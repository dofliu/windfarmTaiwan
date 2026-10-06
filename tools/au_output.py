#!/usr/bin/env python3
"""澳洲：風場的實測年發電量 · Australia: measured yearly output of wind farms (AEMO, National Electricity Market)

  python3 tools/au_output.py fetch 2022-01 2025-12     # 下載 AEMO MMSDM 月檔、彙整成 data/global/sources/aemo_wind_monthly.json
  （之後由 tools/build_generation.py 自動讀取這個彙整檔，不必再下載）

資料：AEMO NEMWeb 的 MMSDM 歷史資料（https://nemweb.com.au/Data_Archive/Wholesale_Electricity/MMSDM/），只用標準函式庫下載。
  DISPATCH_UNIT_SCADA：每個機組（DUID）每 5 分鐘的 SCADA 實測出力 MW（每月約 30 MB 的 zip）→ 逐月加總成 MWh（出力 × 5/60 h）與筆數；
  DUDETAIL：各 DUID 歷次的登記容量（REGISTEREDCAPACITY，含生效日）。
  只留 data/live/units.json 的 AEMO 風力機組（tools/build_live_units.py 依 AEMO 登錄清單「Fuel Source - Primary = Wind」產生）。
授權：AEMO Copyright Permissions——可為任何目的使用 AEMO 資料，但須正確標示 AEMO 與資料來源，且不得暗示 AEMO 背書
（https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions）。

規則（寧可少列，見 au_generation）：
  1. 風場＝units.json 對到同一座本站風場的 DUID（一個 DUID 分給好幾座風場的不用，那幾座風場也不用）。
  2. 某一年只有在每個 DUID 都在前一年 1 月以前開始發電（澳洲新風場常分段併網、受 AEMO 保持點限制半年到一年）、
     當年登記容量沒有變動、5 分鐘資料筆數至少 98% 時才採用。
  3. 容量因數的分母是 AEMO 登記容量的加總；與本站紀錄相差 15% 以上的風場不用（對錯或有沒對到的分期）；5–65% 以外的不用。
  4. 實測值含限電與負電價時的自主降載（澳洲常見），所以是「實際送出」而不是「可發」的電量。
  5. 機型（同機型比較用）：只用本站紀錄，整座風場只寫一種型號（「V66 / V90」這類混合的不寫）、登記容量與紀錄相差 3% 以內才寫。

AEMO's MMSDM archive (public, no key): DISPATCH_UNIT_SCADA gives every unit's 5-minute SCADA output in MW, summed per month into MWh
(MW × 5/60 h) and interval counts; DUDETAIL gives each unit's registered capacity with effective dates. Only the wind DUIDs in
data/live/units.json are kept. Licence: AEMO Copyright Permissions (any purpose, with accurate attribution of AEMO and the material,
no implied endorsement). Rules (conservative): a farm is the set of DUIDs mapped to one site farm (a DUID shared between farms drops
them all); a year counts only if every DUID was generating by January of the year before (new Australian farms ramp up under AEMO hold
points for six months to a year), its registered capacity did not change during the year and at least 98% of the 5-minute intervals
are present; the capacity factor uses the summed registered capacity, farms more than 15% off the site record are dropped, and factors
outside 5–65% are dropped. Output includes curtailment and economic self-curtailment at negative prices (common in Australia).
A model is taken from the site record only when it names a single model and the registered capacity is within 3% of the record.
"""
import calendar
import collections
import csv
import datetime as dt
import io
import json
import re
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UNITS = ROOT / 'data/live/units.json'
AGG = ROOT / 'data/global/sources/aemo_wind_monthly.json'
BASE = 'https://nemweb.com.au/Data_Archive/Wholesale_Electricity/MMSDM'
SRC = {'name': 'AEMO, MMS Data Model monthly archive (DISPATCH_UNIT_SCADA, DUDETAIL)',
       'url': 'https://nemweb.com.au/Data_Archive/Wholesale_Electricity/MMSDM/',
       'terms': 'https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions'}
YEARS = (2023, 2024, 2025)
MIN_COVER = 0.98
CF_MIN, CF_MAX = 0.05, 0.65


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'windfarmTaiwan (github.com/dofliu/windfarmTaiwan)'})
            with urllib.request.urlopen(req, timeout=300) as r:
                return r.read()
        except Exception as e:                      # 網路偶爾斷線：重試 · retry transient network errors
            if i == tries - 1:
                raise
            print(f'  retry {url[-60:]}: {e}', flush=True)
            time.sleep(5 * (i + 1))


def month_files(y, m, table):
    """該月 DATA 目錄裡某個表的 zip 網址（2024-08 起檔名改為 PUBLIC_ARCHIVE#表#FILE01#…，之前是 PUBLIC_DVD_表_…）"""
    d = f'{BASE}/{y}/MMSDM_{y}_{m:02d}/MMSDM_Historical_Data_SQLLoader/DATA/'
    html = get(d).decode('utf-8', 'replace')
    pat = re.compile(r'HREF="([^"]*(?:%23|#|_DVD_)' + table + r'(?:%23|#|_)(?:FILE\d+(?:%23|#))?\d{12}\.zip)"', re.I)
    return ['https://nemweb.com.au' + h if h.startswith('/') else d + h for h in dict.fromkeys(pat.findall(html))]


def rows(blob, table):
    """MMSDM SQLLoader CSV：I 列是欄名、D 列是資料 · I rows are headers, D rows are data"""
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        for name in z.namelist():
            with z.open(name) as fh:
                head = None
                for r in csv.reader(io.TextIOWrapper(fh, encoding='utf-8', newline='')):
                    if not r:
                        continue
                    if r[0] == 'I' and r[2].upper() == table:
                        head = {k.upper(): i for i, k in enumerate(r)}
                    elif r[0] == 'D' and head:
                        yield head, r


def fetch(first, last):
    duids = set(json.loads(UNITS.read_text(encoding='utf-8'))['AEMO'])
    y, m = map(int, first.split('-'))
    y2, m2 = map(int, last.split('-'))
    agg = collections.defaultdict(dict)                   # DUID → {YYYY-MM: [MWh, 5 分鐘筆數]}
    while (y, m) <= (y2, m2):
        key = f'{y}-{m:02d}'
        files = month_files(y, m, 'DISPATCH_UNIT_SCADA')
        if not files:
            raise SystemExit(f'{key}: DISPATCH_UNIT_SCADA not found')
        seen = collections.defaultdict(set)
        e, n = collections.defaultdict(float), collections.Counter()
        start = dt.datetime(y, m, 1)
        for url in files:
            for head, r in rows(get(url), 'UNIT_SCADA'):
                d = r[head['DUID']]
                if d not in duids:
                    continue
                t = dt.datetime.strptime(r[head['SETTLEMENTDATE']], '%Y/%m/%d %H:%M:%S') - dt.timedelta(minutes=5)   # 區間結束時間 → 開始時間
                if (t.year, t.month) != (y, m):
                    continue
                k = int((t - start).total_seconds() // 300)
                if k in seen[d]:                              # 同一區間重複的列只算一次 · count each interval once
                    continue
                seen[d].add(k)
                e[d] += float(r[head['SCADAVALUE']] or 0) * 5 / 60
                n[d] += 1
        for d in n:
            agg[d][key] = [round(e[d], 1), n[d]]
        print(f'{key}: {len(files)} file(s), {len(n)} wind DUIDs, {sum(e.values()) / 1e3:,.0f} GWh', flush=True)
        m += 1
        if m > 12:
            y, m = y + 1, 1
    cap = collections.defaultdict(dict)                     # DUID → {生效日: (版本, 登記容量 MW)}
    for url in month_files(y2, m2, 'DUDETAIL'):
        for head, r in rows(get(url), 'DUDETAIL'):
            d = r[head['DUID']]
            if d in duids:
                eff, ver = r[head['EFFECTIVEDATE']][:10].replace('/', '-'), int(r[head['VERSIONNO']] or 0)
                if eff not in cap[d] or ver > cap[d][eff][0]:
                    cap[d][eff] = (ver, float(r[head['REGISTEREDCAPACITY']] or 0))
    AGG.write_text(json.dumps({
        'meta': {'source': SRC['name'], 'url': SRC['url'], 'terms': SRC['terms'], 'months': [first, last],
                 'retrieved': time.strftime('%Y-%m'), 'built': time.strftime('%Y-%m-%d'), 'tool': 'tools/au_output.py fetch',
                 'note': 'Wind DUIDs of data/live/units.json. m = {YYYY-MM: [MWh from 5-minute SCADA MW x 5/60, number of 5-minute intervals]}; '
                         'cap = [[effective date, registered capacity MW], ...] from DUDETAIL (latest version per date). '
                         'Source: AEMO; used under AEMO Copyright Permissions.'},
        'duid': {d: {'m': dict(sorted(agg[d].items())), 'cap': [[k, v[1]] for k, v in sorted(cap[d].items())]}
                 for d in sorted(set(agg) | set(cap))}}, separators=(',', ':')), encoding='utf-8')
    print(f'{AGG.relative_to(ROOT)}: {len(agg)} DUIDs, {AGG.stat().st_size / 1e3:.0f} kB')


def hours(y):
    return 8784 if calendar.isleap(y) else 8760


def cap_on(caps, day):
    """某天有效的登記容量 · registered capacity in effect on a day ([[生效日, MW], …] 依日期排序)"""
    v = None
    for eff, mw in caps:
        if eff <= day:
            v = mw
    return v


def au_generation(farms, model_of):
    """回傳 ({'AUS|風場': {'y': {年: [GWh, 容量因數 %]}, 'mw': MW, 'duid': [...], 'm'?: 機型}}, 統計)；沒有彙整檔時回傳 ({}, None)"""
    if not AGG.exists():
        return {}, None
    J = json.loads(AGG.read_text(encoding='utf-8'))
    agg, units = J['duid'], json.loads(UNITS.read_text(encoding='utf-8'))['AEMO']
    by_name = {f['name']: f for f in farms if f['iso'] == 'AUS'}
    shared, groups = set(), collections.defaultdict(list)
    for d, v in units.items():
        if isinstance(v['farm'], list):              # 一個 DUID 分給好幾座風場：發電量分不開 · one DUID over several farms
            shared.update(v['farm'])
        elif v['farm']:
            groups[v['farm']].append(d)
    out, why = {}, collections.Counter()
    for name, ds in sorted(groups.items()):
        f = by_name.get(name)
        if f is None or name in shared or f['st'] != 0:
            why['not an operating farm of its own' if f else 'farm not found'] += 1
            continue
        ys, mw = {}, None
        for y in YEARS:
            months = [f'{y}-{i:02d}' for i in range(1, 13)]
            mwh = cap = 0
            for d in ds:
                m, caps = agg.get(d, {}).get('m', {}), agg.get(d, {}).get('cap', [])
                first = next((k for k, v in sorted(m.items()) if v[0] > 0), None)
                if not first or first > f'{y - 1}-01':          # 前一年 1 月以前就在發電 · generating by January of the year before
                    why['ramping up'] += 1
                    break
                if sum(m.get(k, [0, 0])[1] for k in months) < MIN_COVER * hours(y) * 12:
                    why['data gaps'] += 1
                    break
                c0 = cap_on(caps, f'{y}-01-01')
                if not c0 or any(abs(c - c0) > 0.01 for e, c in caps if f'{y}-01-01' < e <= f'{y}-12-31'):
                    why['capacity changed'] += 1
                    break
                mwh += sum(m.get(k, [0, 0])[0] for k in months)
                cap += c0
            else:
                if abs(cap - f['mw']) > 0.15 * f['mw']:
                    why['capacity off the site record'] += 1
                    continue
                cf = mwh / (cap * hours(y))
                if CF_MIN <= cf <= CF_MAX:
                    ys[str(y)] = [round(mwh / 1000, 1), round(cf * 100, 1)]
                    mw = cap
                else:
                    why['capacity factor out of range'] += 1
        if ys:
            out['AUS|' + name] = {'y': ys, 'mw': round(mw, 1), 'duid': sorted(ds)}
            t = f.get('turbine') or ''
            m = None if re.search(r'/|,|\band\b', t) else model_of(t)       # 「Vestas V66 / V90」等混合機型不寫 · mixed models
            if m and abs(mw - f['mw']) <= 0.03 * f['mw']:
                out['AUS|' + name]['m'] = m
    stats = {'duids': len(agg), 'farms': len(out), 'why': dict(why), 'months': J['meta']['months'], 'retrieved': J['meta']['retrieved']}
    return out, stats


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == 'fetch':
        fetch(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
