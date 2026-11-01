#!/usr/bin/env python3
"""英國 REPD：對到本站的英國風場，補狀態、商轉年、機組數、座標與業主，並列出還沒收錄的營運中風場
UK REPD: match the Renewable Energy Planning Database to the site's UK farms and list operating farms the site lacks

用法 · Usage:
    python3 tools/build_repd.py REPD_Publication_Q2_2026.csv

輸入是英國能源安全與淨零部（DESNZ）每季發布的「Renewable Energy Planning Database」CSV（gov.uk，Open Government Licence v3.0；
檔案為 cp1252 編碼），只取風力（Wind Onshore／Wind Offshore）且狀態為營運中、興建中或已除役的紀錄；座標是英國國家格網（OSGB36），
這裡自行換算成經緯度（Airy 橢球橫麥卡托反算＋Helmert 七參數，誤差約 5 m，不另裝套件）。

輸出 data/global/sources/repd_GBR.json，由 tools/build_farms.py 讀取：
  matches：對到本站風場的 REPD 紀錄（每座本站風場可對到好幾筆：分期或擴建各是一筆）。建置時只做保守的補充——
           本站列規劃中而 REPD 已營運（有商轉日期）的改成營運中、商轉年取最早的商轉日期；本站沒寫機組的補「N x U MW」；
           座標只是概略位置（flags 1）的改用 REPD 的格網座標；沒寫業主的補 Operator。本站已營運的不改年份（本站年份多半查證過）。
           REPD 標已除役但沒有除役日期的只記在 log，不改資料。
  parks：  REPD 營運中、1 MW 以上、對不到本站風場、附近 3 km 內也沒有任何本站紀錄的陸域風場，建置時以來源代碼 5 加進風場層。
           離岸風場不自動新增（本站的離岸紀錄齊全，名稱寫法不同的要人工對）。

對應規則（寧可少配）：REPD 紀錄只配給半徑內（陸域 8 km、離岸 40 km）名稱有共同字的本站風場（數字 one/two 與 1/2 視為相同，
wind、farm、extension、phase 等不算字）；沒有共同字時，只有在半徑很小（陸域 2 km、離岸 15 km）、容量 ±15% 內且只有一個候選時才配。
一筆 REPD 紀錄只配一座風場。建置會檢查本站英國陸域營運容量＋新增的不超過官方陸域容量的 102%。

The input is DESNZ's quarterly REPD CSV (gov.uk, Open Government Licence v3.0; cp1252), filtered to wind records that are operational,
under construction or decommissioned; British National Grid coordinates are converted here (Airy transverse Mercator inverse plus a
Helmert shift, about 5 m, no extra packages). The output lists the matched records (build_farms.py upgrades pipeline farms that REPD
shows operational, taking the earliest operational date; fills empty turbine fields, approximate coordinates and empty owners; never
changes the year of a farm already operating; decommissioned records without a date are only logged) and the operating onshore farms
of 1 MW+ with no site record within 3 km (added as source code 5). Matching is conservative: shared name tokens within 8 km onshore /
40 km offshore, or a single candidate within 2 / 15 km and ±15% of capacity; one REPD record goes to one farm. The build checks that
the site's UK onshore operating capacity plus the additions stays within 102% of the official onshore total.
"""
import csv
import datetime as dt
import io
import json
import math
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FARMS = ROOT / 'data/global/wind_farms.json'
OUT = ROOT / 'data/global/sources/repd_GBR.json'
SRC = {'name': 'Renewable Energy Planning Database (REPD), Department for Energy Security and Net Zero',
       'url': 'https://www.gov.uk/government/publications/renewable-energy-planning-database-monthly-extract',
       'license': 'Open Government Licence v3.0 — contains public sector information licensed under the Open Government Licence v3.0'}
STOP = set('wind farm farms windfarm windfarms park energy limited ltd plc the of and at on extension ext repowering repower phase '
           'project scheme site offshore onshore turbine turbines'.split())
NUM = {'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4'}


def toks(s):
    out = set()
    for t in re.findall(r'[a-z0-9]+', (s or '').lower().replace('&', ' and ')):
        t = NUM.get(t, t)
        if t not in STOP and len(t) > 1:
            out.add(t)
    return out


def osgb_to_wgs84(E, N):
    """OSGB36 國家格網 → WGS84 經緯度（Airy 1830 橫麥卡托反算＋Helmert），誤差約 5 m · about 5 m."""
    a, b = 6377563.396, 6356256.909
    F0, lat0, lon0, N0, E0 = 0.9996012717, math.radians(49), math.radians(-2), -100000.0, 400000.0
    e2 = 1 - b * b / (a * a)
    n = (a - b) / (a + b)
    lat, M = lat0, 0.0
    while True:
        lat = (N - N0 - M) / (a * F0) + lat
        M = b * F0 * ((1 + n + 1.25 * n * n + 1.25 * n ** 3) * (lat - lat0)
                      - (3 * n + 3 * n * n + 2.625 * n ** 3) * math.sin(lat - lat0) * math.cos(lat + lat0)
                      + (1.875 * n * n + 1.875 * n ** 3) * math.sin(2 * (lat - lat0)) * math.cos(2 * (lat + lat0))
                      - (35 / 24) * n ** 3 * math.sin(3 * (lat - lat0)) * math.cos(3 * (lat + lat0)))
        if abs(N - N0 - M) < 1e-5:
            break
    sl, cl, tl = math.sin(lat), math.cos(lat), math.tan(lat)
    nu = a * F0 / math.sqrt(1 - e2 * sl * sl)
    rho = a * F0 * (1 - e2) / (1 - e2 * sl * sl) ** 1.5
    eta2 = nu / rho - 1
    dE = E - E0
    VII = tl / (2 * rho * nu)
    VIII = tl / (24 * rho * nu ** 3) * (5 + 3 * tl ** 2 + eta2 - 9 * tl ** 2 * eta2)
    IX = tl / (720 * rho * nu ** 5) * (61 + 90 * tl ** 2 + 45 * tl ** 4)
    X = 1 / (cl * nu)
    XI = (nu / rho + 2 * tl ** 2) / (6 * cl * nu ** 3)
    XII = (5 + 28 * tl ** 2 + 24 * tl ** 4) / (120 * cl * nu ** 5)
    XIIA = (61 + 662 * tl ** 2 + 1320 * tl ** 4 + 720 * tl ** 6) / (5040 * cl * nu ** 7)
    phi = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6
    lam = lon0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7
    # Helmert OSGB36 → WGS84
    sp, cp, sm, cm = math.sin(phi), math.cos(phi), math.sin(lam), math.cos(lam)
    nu2 = a / math.sqrt(1 - e2 * sp * sp)
    x, y, z = nu2 * cp * cm, nu2 * cp * sm, (1 - e2) * nu2 * sp
    tx, ty, tz, s, rx, ry, rz = 446.448, -125.157, 542.060, -20.4894e-6, math.radians(0.1502 / 3600), math.radians(0.2470 / 3600), math.radians(0.8421 / 3600)
    x2 = tx + (1 + s) * x - rz * y + ry * z
    y2 = ty + rz * x + (1 + s) * y - rx * z
    z2 = tz - ry * x + rx * y + (1 + s) * z
    a2, b2 = 6378137.0, 6356752.3142
    e22 = 1 - b2 * b2 / (a2 * a2)
    p = math.hypot(x2, y2)
    phi2 = math.atan2(z2, p * (1 - e22))
    for _ in range(10):
        nu3 = a2 / math.sqrt(1 - e22 * math.sin(phi2) ** 2)
        phi2 = math.atan2(z2 + e22 * nu3 * math.sin(phi2), p)
    return math.degrees(phi2), math.degrees(math.atan2(y2, x2))


def km(lat1, lon1, lat2, lon2):
    return math.hypot((lon2 - lon1) * 111.32 * math.cos(math.radians((lat1 + lat2) / 2)), (lat2 - lat1) * 110.574)


def ymd(s):
    s = (s or '').strip()
    try:
        return dt.datetime.strptime(s, '%d/%m/%Y').date()
    except ValueError:
        return None


def num(s):
    try:
        return float(str(s).replace(',', '').strip())
    except ValueError:
        return None


def main(path):
    raw = Path(path).read_bytes()
    txt = raw.decode('utf-8-sig') if raw[:3] == b'\xef\xbb\xbf' else raw.decode('cp1252')
    rows = [r for r in csv.DictReader(io.StringIO(txt)) if 'Wind' in (r.get('Technology Type') or '')]
    keep = {'Operational', 'Under Construction', 'Decommissioned'}
    recs = []
    for r in rows:
        st = (r.get('Development Status (short)') or '').strip()
        if st not in keep:
            continue
        E, N = num(r.get('X-coordinate')), num(r.get('Y-coordinate'))
        if not E or not N:
            continue
        lat, lon = osgb_to_wgs84(E, N)
        if not (49 < lat < 61.5 and -9 < lon < 3):
            continue
        recs.append({'ref': (r.get('Ref ID') or '').strip(), 'name': ' '.join((r.get('Site Name') or '').split()), 'st': st,
                     'sea': r['Technology Type'] == 'Wind Offshore', 'mw': num(r.get('Installed Capacity (MWelec)')) or 0,
                     'n': int(num(r.get('No. of Turbines')) or 0), 'unit': num(r.get('Turbine Capacity (MW)')),
                     'op': ymd(r.get('Operational')), 'uc': ymd(r.get('Under Construction')), 'lat': round(lat, 5), 'lon': round(lon, 5),
                     'operator': ' '.join((r.get('Operator (or Applicant)') or '').split()), 'country': (r.get('Country') or '').strip(),
                     'updated': (r.get('Record Last Updated (dd/mm/yyyy)') or '').strip()})
    fj = json.loads(FARMS.read_text(encoding='utf-8'))
    cols = {k: i for i, k in enumerate(fj['meta']['cols'])}
    site = [dict((k, r[i]) for k, i in cols.items()) for r in fj['rows'] if r[cols['iso']] == 'GBR' and r[cols['src']] != 5]
    for f in site:
        f['_t'] = toks(f['name'])
    print(f'REPD: {len(recs):,} wind records (operational / under construction / decommissioned) with coordinates; site: {len(site):,} UK records')

    taken = set()
    matches, unmatched = [], []
    for r in sorted(recs, key=lambda x: -x['mw']):
        rt = toks(r['name'])
        R = 40 if r['sea'] else 8
        cands = []
        for f in site:
            d = km(r['lat'], r['lon'], f['lat'], f['lon'])
            if d > R:
                continue
            same_kind = (f['type'] != 0) == r['sea']
            if not same_kind:
                continue
            ov = len(rt & f['_t'])
            # 同狀態優先：REPD 營運中的紀錄先配本站營運中的風場（分期各一筆時，才不會配到規劃中的下一期）
            # same status first, so an operating REPD record goes to the operating phase, not the pipeline next phase
            pref = 1 if (r['st'] == 'Operational') == (f['st'] == 0) else 0
            cands.append((ov, pref, -abs(math.log(max(r['mw'], 0.1) / max(f['mw'], 0.1))), -d, f))
        cands = [c for c in cands if id(c[-1]) not in taken]
        best = None
        named = [c for c in cands if c[0] >= 1]
        if named:
            best = max(named, key=lambda c: c[:4])[-1]
        elif len(cands) == 1:
            ov, pref, capd, d, f = cands[0]
            if -d <= (15 if r['sea'] else 2) and r['mw'] and abs(r['mw'] - f['mw']) <= 0.15 * max(r['mw'], f['mw']):
                best = f
        if best is None:
            unmatched.append(r)
            continue
        taken.add(id(best))
        matches.append({'ref': r['ref'], 'repd': r['name'], 'site': best['name'], 'src': best['src'], 'status': r['st'], 'sea': r['sea'],
                        'mw': r['mw'], 'n': r['n'], 'unit': r['unit'], 'operational': r['op'].isoformat() if r['op'] else None,
                        'under_construction': r['uc'].isoformat() if r['uc'] else None, 'lat': r['lat'], 'lon': r['lon'],
                        'operator': r['operator'], 'site_st': best['st'], 'site_year': best['year'], 'site_mw': best['mw'], 'site_flags': best['flags']})
    # 新增：營運中、1 MW 以上、陸域、附近 3 km 內沒有任何本站紀錄 · additions
    parks, held, moves = [], [], []
    for r in unmatched:
        if r['st'] != 'Operational' or r['mw'] < 1 or r['sea']:
            if r['st'] == 'Operational' and r['mw'] >= 1:
                held.append(r)
            continue
        rt = toks(r['name'])
        # 同名但本站座標離得遠（>8 km）：本站的點可能標錯，改用 REPD 的格網座標（只在剛好一筆、容量 ±25% 內時）
        # same name but the site's point is far away: the site's coordinates are probably wrong, so take REPD's grid reference (one record, ±25% capacity)
        same = [f for f in site if f['st'] == 0 and id(f) not in taken and (rt <= f['_t'] or f['_t'] <= rt) and len(f['_t'] & rt) >= 1
                and abs(f['mw'] - r['mw']) <= 0.25 * max(f['mw'], r['mw'])]
        if len(same) == 1 and km(r['lat'], r['lon'], same[0]['lat'], same[0]['lon']) > 20:   # 大風場的點差幾公里是正常的，只改離得遠的 · only clearly wrong points
            f = same[0]
            taken.add(id(f))
            moves.append({'ref': r['ref'], 'repd': r['name'], 'site': f['name'], 'src': f['src'], 'mw': r['mw'], 'site_mw': f['mw'], 'lat': r['lat'], 'lon': r['lon'],
                          'km': round(km(r['lat'], r['lon'], f['lat'], f['lon']), 1)})
            continue
        # 附近 12 km 內有名稱相同字的本站紀錄（多半是合併計算的擴建），或 3 km 內有任何紀錄：不新增 · covered by a nearby record (usually an extension folded into it)
        near = [f for f in site if km(r['lat'], r['lon'], f['lat'], f['lon']) <= 3 or (km(r['lat'], r['lon'], f['lat'], f['lon']) <= 12 and f['_t'] & rt)]
        if near:
            held.append(r)
            continue
        parks.append({'name': r['name'], 'lat': r['lat'], 'lon': r['lon'], 'mw': round(r['mw'], 2), 'year': r['op'].year if r['op'] else 0,
                      'turbine': f"{r['n']} x {r['unit']:g} MW" if r['n'] and r['unit'] else '', 'owner': r['operator'], 'ref': r['ref'],
                      'country': r['country']})
    parks.sort(key=lambda p: (-p['mw'], p['name']))
    SKIP_UP = {'Lochluichart wind farm · 3': 'REPD 的 Lochluichart (Extension) 是 2014 年的 18 MW 擴建，不是 GEM 這筆 24 MW 的第三期 · the 2014 18 MW extension, not this 24 MW third phase'}
    # 升級的判定只看 REPD 的證據，不看本站目前的狀態：這樣對已套用過 REPD 的資料重跑也會得到同樣的結果（建置時只對規劃中的紀錄套用）
    # the upgrade flag depends on REPD evidence only, not on the site's current status, so re-running on data that already carries
    # the REPD changes gives the same file (build_farms.py applies it to pipeline records only)
    def upgrade_ok(m):
        if m['status'] != 'Operational' or not m['operational'] or m['site'] in SKIP_UP:
            return False
        a, b = toks(m['repd']), toks(m['site'])
        if not (a <= b or b <= a):
            return False                                                  # 名稱要互相包含 · one name must contain the other
        if m['site_mw'] and abs(m['mw'] - m['site_mw']) > 0.25 * max(m['mw'], m['site_mw']):
            return False                                                  # 容量差太多：多半是別的分期 · another phase
        return not (m['site_year'] and int(m['operational'][:4]) < m['site_year'] - 2)   # 比預計商轉年早很多：舊分期 · an older phase
    for m in matches:
        m['upgrade'] = upgrade_ok(m)
    up = [m for m in matches if m['upgrade'] and m['site_st'] in (1, 2, 3)]
    dec = [m for m in matches if m['status'] == 'Decommissioned' and m['site_st'] == 0]
    print(f'matched {len(matches):,} records to {len({m["site"] for m in matches}):,} site farms; {len(unmatched):,} unmatched '
          f'({len(parks):,} onshore 1 MW+ operating farms to add, {sum(p["mw"] for p in parks):,.0f} MW; {len(held):,} held back: offshore or within 3 km of a site record)')
    print(f'status: {len(up):,} site pipeline records that REPD lists as operational; {len(dec):,} operating site farms REPD lists as decommissioned')
    for m in up:
        print(f'  UP   {m["site"]} ({m["site_mw"]} MW, st{m["site_st"]} y{m["site_year"]}) <- REPD {m["repd"]} {m["mw"]} MW operational {m["operational"]}')
    for m in dec:
        print(f'  DEC  {m["site"]} ({m["site_mw"]} MW) <- REPD {m["repd"]} decommissioned')
    for m in moves:
        print(f'  MOVE {m["site"]} ({m["site_mw"]} MW) -> REPD {m["repd"]} grid reference, {m["km"]} km away')
    for p in parks:
        print(f'  ADD  {p["name"]} {p["mw"]} MW y{p["year"]} ({p["country"]})')
    for r in held[:15]:
        print(f'  held {r["name"]} {r["mw"]} MW ({"offshore" if r["sea"] else "near a site record"})')
    got = dt.datetime.fromtimestamp(Path(path).stat().st_mtime).strftime('%Y-%m-%d')
    rel = re.search(r'(Q[1-4]_\d{4})', Path(path).name)
    meta = dict(SRC, release=rel.group(1).replace('_', ' ') if rel else Path(path).name, retrieved=got, records=len(recs), matched=len(matches),
                parks=len(parks), parks_mw=round(sum(p['mw'] for p in parks), 1), moves=len(moves), tool='tools/build_repd.py',
                note='matches: REPD records matched to site UK farms (name tokens within 8 km onshore / 40 km offshore, or a lone candidate within 2 / 15 km and ±15% '
                     'capacity); moves: same-name site farms whose point lies far from the REPD grid reference (coordinates replaced); parks: operating onshore REPD farms of 1 MW+ with no site record within 3 km and no same-name record within 12 km, added by build_farms.py as source 5.')
    OUT.write_text(json.dumps({'meta': meta, 'matches': matches, 'moves': moves, 'parks': parks}, ensure_ascii=False, indent=0), encoding='utf-8')
    print(f'wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1e3:.0f} KB)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
