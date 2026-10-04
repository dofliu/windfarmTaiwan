#!/usr/bin/env python3
"""風場的實際年發電量 · Actual yearly generation of wind farms → data/global/generation.json

  python3 tools/build_generation.py uswtdb_V9_1_20260928.csv f923_2023.zip f923_2024.zip f923_2025.zip \
      data/global/sources/taipower_renewable_generation_17140.csv data/global/sources/taipower_wind_stations_17141.csv

美國：EIA-923（美國能源資訊署，各電廠逐月淨發電量，公有領域）。USWTDB 每部風機都附 EIA 電廠代碼（tools/build_turbines.py 寫進
turbines.json 的 eia 欄），所以本站風場→USWTDB 機組→EIA 電廠可以直接接上。寧可少配：
  1. 一座 EIA 電廠的機組必須全部在同一座本站風場裡（電廠跨好幾座風場時，發電量分不開，不用）。
  2. 某一年只有在這些電廠的機組全部在前一年以前商轉、沒有在當年改裝（USWTDB 的 p_year、t_retro_yr）時才採用，
     避免把部分年度當成全年。
  3. 容量因數＝淨發電量 ÷（USWTDB 機組額定容量加總 × 8,760 小時），不在 5–65% 之間的年份不用（多為資料錯誤或停機）。
EIA-923 年度檔的網址：https://www.eia.gov/electricity/data/eia923/（最新年在 xls/，較舊的在 archive/xls/）。
台灣：台電「自建之各類再生能源發電量」（政府資料開放平臺 17140，各發電站逐月淨發電量，2024 年起）與
「風力發電站資料」（17141，各站裝置容量），存在 data/global/sources/（下載：service.taipower.com.tw/data/opendata/apply/file/d693001/001.csv、d693002/001.csv），政府資料開放授權條款第 1 版。只有台電自有的發電站，民營風場沒有逐場的官方數字。
發電站與本站風場的對應寫在 TW_STATIONS，台電公布的裝置容量要在本站容量 ±15% 內才用（對不上多半是本站的紀錄只含其中幾期）；只用 12 個月都有數字的年份。
風場資料或 USWTDB 重建後要重跑（先跑 tools/build_turbines.py）。

US: EIA-923 (U.S. Energy Information Administration, monthly net generation by plant, public domain). USWTDB gives every turbine its
EIA plant code (written by tools/build_turbines.py as the "eia" field of turbines.json), so site farm → USWTDB turbines → EIA plant
links directly. Conservative: an EIA plant is used only when all of its turbines are in one site farm; a year is used only when every
turbine of those plants started before that year and was not retrofitted in it; capacity factor = net generation / (summed USWTDB
turbine ratings × 8,760 h), and years outside 5–65% are dropped. Re-run after rebuilding the farm layer or USWTDB (run
tools/build_turbines.py first).
Taiwan: Taipower's own stations only (open data 17140, monthly net generation by station from 2024; 17141, station capacity; Taiwan
Open Government Data Licence v1). Stations map to site farms in TW_STATIONS and are used only when Taipower's capacity is within
±15% of the site's record; only years with all 12 months reported. Private farms have no official per-farm figures.
"""
import collections
import csv
import json
import re
import sys
import zipfile
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
TURB = ROOT / 'data/global/turbines.json'
OUT = ROOT / 'data/global/generation.json'
CF_MIN, CF_MAX = 0.05, 0.65
TW_URL = 'https://data.gov.tw/dataset/17140'
# 台電發電站（17140／17141 的中文名稱前段）→ 本站風場名稱
TW_STATIONS = {'石門風力': 'Shimen', '林口風力': 'Linkou', '蘆竹風力': 'Taoyuan Luzhu', '觀園風力': 'Dayuan Guanyuan', '大潭風力': 'Datan (Tatan)',
               '新竹香山風力': 'Hsinchu Xiangshan', '台中港區風力': 'Taichung Port', '台中電廠風力': 'Taichung Power Plant',
               '彰工風力': 'Changgong (Changbin Xianxi)', '彰化王功風力': 'Wanggong', '彰化永興風力': 'Yongxing (Fangyuan)',
               '雲林麥寮風力': 'Yunmai (Mailiao)', '雲林台西風力': 'Yunlin Taixi', '雲林四湖風力': 'Sihu', '恆春風力': 'Hengchun (Maanshan NPP)',
               '澎湖湖西風力': 'Penghu Huxi', '金沙風力': 'Kinmen Jinsha', '澎湖龍門風力': 'Penghu Longmen', '中屯風力': 'Penghu Zhongtun',
               '離岸一期風力': 'Taipower Offshore Phase 1 (Changhua)'}


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def eia923_wind(zip_path):
    """{EIA 電廠代碼: 全年淨發電量 MWh}（只取燃料代碼 WND 的列），年份"""
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if re.search(r'Schedules_2_3_4_5.*\.xlsx$', n))
        with z.open(name) as fh:
            wb = openpyxl.load_workbook(fh, read_only=True)
            ws = wb['Page 1 Generation and Fuel Data']
            head, out, year = None, collections.defaultdict(float), None
            for r in ws.iter_rows(values_only=True):
                if head is None:
                    if r and r[0] == 'Plant Id':
                        head = [str(c or '').replace('\n', ' ') for c in r]
                        ip, ifu = head.index('Plant Id'), head.index('Reported Fuel Type Code')
                        ig, iy = head.index('Net Generation (Megawatthours)'), head.index('YEAR')
                    continue
                if r[ifu] == 'WND' and r[ip]:
                    out[int(r[ip])] += num(r[ig]) or 0
                    year = year or int(r[iy])
    return dict(out), year


def tw_station(name):
    """「觀園風力發電站/Guanyuan …」→「觀園風力」"""
    return re.sub(r'(發電站)?\s*/?\s*[A-Za-z].*$', '', name).strip()


def taiwan(gen_csv, cap_csv, farms):
    cap = collections.defaultdict(float)
    for r in list(csv.reader(open(cap_csv, encoding='utf-8-sig')))[1:]:
        if '風' in r[1]:
            cap[tw_station(r[2])] += num(r[6]) or 0
    mwh, months = collections.defaultdict(float), collections.defaultdict(set)
    for r in list(csv.reader(open(gen_csv, encoding='utf-8-sig')))[1:]:
        m = re.match(r'^[\d,]+(\.\d+)?', r[4].strip())            # 「-」是沒有資料；少數格子後面多了雜字
        if '風' in r[2] and m:
            k = (tw_station(r[3]), int(r[0]))
            mwh[k] += float(m.group(0).replace(',', '')) / 1000
            months[k].add(int(r[1]))
    by_name = {f['name']: f for f in farms if f['iso'] == 'TWN'}
    out, skipped = {}, []
    for st, name in TW_STATIONS.items():
        f, kw = by_name.get(name), cap.get(st)
        if f is None:
            raise SystemExit(f'TW_STATIONS: site farm {name!r} not found (renamed?)')
        if not kw or abs(kw / 1000 - f['mw']) > 0.15 * f['mw']:
            skipped.append(f'{st} {kw and kw / 1000} MW vs {name} {f["mw"]} MW')
            continue
        ys = {}
        for (s2, y), v in mwh.items():
            if s2 == st and len(months[(s2, y)]) == 12 and y > (f['year'] or 0):
                cf = v / (kw / 1000 * 8760)
                if CF_MIN <= cf <= CF_MAX:
                    ys[y] = [round(v / 1000, 1), round(cf * 100, 1)]
        if ys:
            out['TWN|' + name] = {'y': dict(sorted(ys.items())), 'mw': round(kw / 1000, 1), 'st': st}
    print(f'Taiwan: {len(out)} Taipower stations; capacity mismatch skipped: ' + '; '.join(skipped), flush=True)
    return out


def main(uswtdb_csv, *files):
    zips = [z for z in files if z.endswith('.zip')]
    tw = [c for c in files if c.endswith('.csv')]
    tb = json.loads(TURB.read_text(encoding='utf-8'))
    rows = list(csv.DictReader(open(uswtdb_csv, encoding='utf-8')))
    plant_n, plant_kw, plant_start = collections.Counter(), collections.defaultdict(float), collections.defaultdict(int)
    for r in rows:
        e = num(r['eia_id'])
        if not e or e <= 0:
            continue
        e = int(e)
        plant_n[e] += 1
        plant_kw[e] += num(r['t_cap']) or 0
        # 最後一部機組的商轉年或改裝年：這一年以前（含）都不是完整的一年
        plant_start[e] = max(plant_start[e], int(num(r['p_year']) or 0), int(num(r['t_retro_yr']) or 0))
    gen = {}
    for z in zips:
        g, y = eia923_wind(z)
        gen[y] = g
        print(f'EIA-923 {y}: {len(g):,} wind plants, {sum(g.values()) / 1e6:,.1f} TWh', flush=True)
    years = sorted(gen)

    out, skipped_shared, skipped_cf = {}, 0, 0
    for name, v in tb['farms'].items():
        ids = [i for i, c in v.get('eia') or []]
        if not ids:
            continue
        if any(plant_n[i] != c for i, c in v['eia']):        # 電廠有機組在別的風場（或沒對到的專案）
            skipped_shared += 1
            continue
        mw = sum(plant_kw[i] for i in ids) / 1000
        start = max(plant_start[i] for i in ids)
        ys = {}
        for y in years:
            if y <= start or not all(i in gen[y] for i in ids):
                continue
            mwh = sum(gen[y][i] for i in ids)
            cf = mwh / (mw * 8760) if mw else 0
            if CF_MIN <= cf <= CF_MAX:
                ys[y] = [round(mwh / 1000, 1), round(cf * 100, 1)]    # [GWh, 容量因數 %]
            else:
                skipped_cf += 1
        if ys:
            out['USA|' + name] = {'y': ys, 'mw': round(mw, 1), 'eia': ids}
    fj = json.loads((ROOT / 'data/global/wind_farms.json').read_text(encoding='utf-8'))
    farms = [dict(zip(fj['meta']['cols'], r)) for r in fj['rows']]
    if tw:
        gen_csv = next(c for c in tw if '17140' in c or 'd693001' in c)
        cap_csv = next(c for c in tw if '17141' in c or 'd693002' in c)
        out.update(taiwan(gen_csv, cap_csv, farms))
    meta = {
        'source': {'USA': 'U.S. Energy Information Administration, Form EIA-923 (net generation by plant), years ' + ', '.join(map(str, years)),
                   'TWN': 'Taiwan Power Company, net generation of its own renewable stations (data.gov.tw 17140) and station capacity (17141)'},
        'url': {'USA': 'https://www.eia.gov/electricity/data/eia923/', 'TWN': TW_URL},
        'license': {'USA': 'Public domain (U.S. Government work)', 'TWN': 'Open Government Data License, version 1.0 (Taiwan)'},
        'farms': len(out), 'by_iso': dict(collections.Counter(k.split('|')[0] for k in out)), 'years': years,
        'note': 'Keys are "ISO|farm name". y = {year: [net generation GWh, capacity factor %]}; mw = rated capacity used for the capacity factor; '
                'only full years (all turbines in service before the year) of plants wholly inside one farm.',
    }
    OUT.write_text(json.dumps({'meta': meta, 'farms': dict(sorted(out.items()))}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(out):,} farms with generation; skipped {skipped_shared} farms sharing an EIA plant, {skipped_cf} farm-years outside '
          f'{CF_MIN:.0%}–{CF_MAX:.0%}; {OUT.stat().st_size / 1e3:.0f} kB')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], *sys.argv[2:])
