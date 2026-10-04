#!/usr/bin/env python3
"""每部風機的位置與規格 · Individual turbine positions and specs for the close-up view

目前只有美國：USGS／LBNL「U.S. Wind Turbine Database」（USWTDB，公有領域）列出每一部風機的座標、廠牌、機型、
額定功率、輪轂高度與葉輪直徑。這支程式把 USWTDB 的專案對到本站的風場紀錄，輸出 data/global/turbines.json，
地球儀點選風場時改畫真實的機位，卡片也顯示機組數與機型。

  curl -LO https://energy.usgs.gov/uswtdb/assets/data/uswtdbCSV.zip && unzip uswtdbCSV.zip
  python3 tools/build_turbines.py uswtdb_V9_1_20260928.csv

對應規則（寧可少配、不要配錯）：
  1. 只看本站營運中與已除役的美國風場；USWTDB 名稱是「unknown …」的專案不用。
  2. 候選：專案的機組中心在風場座標 30 km 內，而且名稱有共同的字（去掉 wind、farm、phase、羅馬數字等泛稱）；
     只有共同的常見地名字（county、creek、ridge…）時，要整個名稱的字都相同才算。
  3. 每個專案只給一座風場：共同字最多、距離最近的那座。一座風場可以有好幾個專案（本站常把各期合成一筆）。
  4. 專案容量加總要在風場容量的 ±15% 內才採用；超過時由遠到近拿掉專案再比；對不上的風場不寫，近景維持推算的排列。
風場資料重建（tools/build_farms.py）後要重跑，名稱改了會對不到。

Only the United States so far: the USGS/LBNL U.S. Wind Turbine Database (USWTDB, public domain) lists every turbine with its
position, manufacturer, model, rating, hub height and rotor diameter. This script matches USWTDB projects to the site's farm
records and writes data/global/turbines.json; the globe then draws the real turbine positions for a selected farm and the card
shows the turbine count and model. Matching (rather too few than wrong): operating and retired US farms only; candidate
projects within 30 km sharing a distinctive name word (only common place words such as county/creek/ridge must match the whole
name); each project goes to one farm (most shared words, then nearest); a farm may take several projects (phases), and their
summed capacity must be within ±15% of the farm's, dropping the farthest projects first; unmatched farms keep the estimated
layout. Re-run after rebuilding the farm layer.
"""
import collections
import csv
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FARMS = ROOT / 'data/global/wind_farms.json'
OUT = ROOT / 'data/global/turbines.json'

GENERIC = {'wind', 'farm', 'energy', 'project', 'projects', 'power', 'center', 'centre', 'llc', 'inc', 'phase', 'repower',
           'repowering', 'the', 'of', 'and', 'facility', 'co', 'company', 'windfarm', 'windpower', 'renewables', 'renewable',
           'expansion', 'partial', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'united', 'states', 'resource',
           'area', 'park'}
WEAK = {'county', 'creek', 'mesa', 'hills', 'hill', 'prairie', 'valley', 'mountain', 'mountains', 'north', 'south', 'east',
        'west', 'new', 'big', 'lake', 'river', 'ridge', 'ranch', 'springs', 'spring', 'plains', 'point', 'city', 'grand', 'high',
        'blue', 'green', 'red', 'white', 'black', 'rock', 'pass', 'canyon', 'flats', 'cedar', 'pine', 'oak', 'meadow', 'meadows',
        'crossing', 'trail', 'gap', 'peak', 'butte'}
MAX_KM = 30
TOL = 0.15


def words(s):
    s = re.sub(r'\(.*?\)', '', s.split(' · ')[0])
    return {w for w in re.findall(r'[a-z0-9]+', s.lower()) if w not in GENERIC and len(w) > 1 and not w.isdigit()}


def km(lat1, lon1, lat2, lon2):
    p = math.radians
    h = math.sin(p(lat2 - lat1) / 2) ** 2 + math.cos(p(lat1)) * math.cos(p(lat2)) * math.sin(p(lon2 - lon1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def eia_of(t):
    """USWTDB 的 EIA 電廠代碼（沒有時是空字串、NA 或負數）"""
    v = num(t.get('eia_id'))
    return int(v) if v and v > 0 else 0


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def main(csv_path):
    fj = json.loads(FARMS.read_text(encoding='utf-8'))
    cols = fj['meta']['cols']
    farms = [dict(zip(cols, r)) for r in fj['rows']]
    us = [f for f in farms if f['iso'] == 'USA' and f['st'] in (0, 4)]

    rows = list(csv.DictReader(open(csv_path, encoding='utf-8')))
    version = re.search(r'uswtdb_(V[\d_]+)_(\d{8})', Path(csv_path).name)
    groups = collections.defaultdict(list)
    for r in rows:
        if r['p_name'].lower().startswith('unknown'):
            continue
        groups[(r['p_name'], r['t_state'])].append(r)
    proj = {}
    for k, ts in groups.items():
        lat = sum(float(t['ylat']) for t in ts) / len(ts)
        lon = sum(float(t['xlong']) for t in ts) / len(ts)
        cap = num(ts[0]['p_cap']) or sum(num(t['t_cap']) or 0 for t in ts) / 1000
        proj[k] = {'lat': lat, 'lon': lon, 'cap': cap, 'ts': ts}

    cand = collections.defaultdict(list)
    for fi, f in enumerate(us):
        fw = words(f['name'])
        for k, p in proj.items():
            d = km(f['lat'], f['lon'], p['lat'], p['lon'])
            if d > MAX_KM:
                continue
            pw = words(k[0])
            shared = fw & pw
            if not shared or (not (shared - WEAK) and fw != pw):
                continue
            cand[k].append((len(shared - WEAK) + len(shared), -d, fi))
    assign = collections.defaultdict(list)
    for k, c in cand.items():
        c.sort(reverse=True)
        assign[c[0][2]].append(k)

    out, rejected = {}, 0
    for fi, ks in sorted(assign.items()):
        f = us[fi]
        ks.sort(key=lambda k: km(f['lat'], f['lon'], proj[k]['lat'], proj[k]['lon']))
        tot = sum(proj[k]['cap'] for k in ks)
        while len(ks) > 1 and tot > (1 + TOL) * f['mw']:
            tot -= proj[ks.pop()]['cap']
        if not (1 - TOL) * f['mw'] <= tot <= (1 + TOL) * f['mw']:
            rejected += 1
            continue
        ts = [t for k in ks for t in proj[k]['ts']]
        clat = sum(float(t['ylat']) for t in ts) / len(ts)
        clon = sum(float(t['xlong']) for t in ts) / len(ts)
        # 機位：相對中心的經緯度差，單位 1e-5 度（約 1 m），整數陣列 [dlon, dlat, ...]
        pos = []
        for t in ts:
            pos += [round((float(t['xlong']) - clon) * 1e5), round((float(t['ylat']) - clat) * 1e5)]
        models = collections.Counter(' '.join(x for x in (t['t_manu'], t['t_model']) if x and x != 'missing') for t in ts)
        model, mcount = models.most_common(1)[0]
        hh = [v for v in (num(t['t_hh']) for t in ts) if v and v > 0]
        rd = [v for v in (num(t['t_rd']) for t in ts) if v and v > 0]
        yrs = [int(v) for v in (num(t['p_year']) for t in ts) if v]
        out[f['name']] = {
            'c': [round(clon, 5), round(clat, 5)], 'p': pos, 'n': len(ts),
            'm': model or None, 'mn': len(models), 'hh': [min(hh), max(hh)] if hh else None, 'rd': [min(rd), max(rd)] if rd else None,
            'kw': round(sum(num(t['t_cap']) or 0 for t in ts)), 'y': [min(yrs), max(yrs)] if yrs else None,
            'pr': sorted({k[0] for k in ks}),
            # EIA 電廠代碼與這座風場裡屬於它的機組數（tools/build_generation.py 用來接 EIA-923 發電量）
            'eia': sorted([int(i), c] for i, c in collections.Counter(eia_of(t) for t in ts).items() if i),
        }
    meta = {
        'source': 'U.S. Wind Turbine Database (USWTDB), USGS / Lawrence Berkeley National Laboratory / American Clean Power Association',
        'version': (version.group(1).replace('_', '.') + ' (' + version.group(2)[:4] + '-' + version.group(2)[4:6] + '-' + version.group(2)[6:] + ')') if version else None,
        'url': 'https://energy.usgs.gov/uswtdb/', 'license': 'Public domain (U.S. Government work)',
        'cite': 'Hoen, B.D., Diffendorfer, J.E., Rand, J.T., Kramer, L.A., Garrity, C.P., and Hunt, H.E., 2018, United States Wind Turbine Database: U.S. Geological Survey, American Clean Power Association, and Lawrence Berkeley National Laboratory data release, https://doi.org/10.5066/F7TX3DN0',
        'farms': len(out), 'turbines': sum(v['n'] for v in out.values()),
        'mw': round(sum(f['mw'] for f in us if f['name'] in out)), 'us_mw': round(sum(f['mw'] for f in us)), 'us_farms': len(us),
        'note': 'Positions are offsets from "c" in 1e-5 degrees, [dlon, dlat, ...]; hh/rd = hub height and rotor diameter range (m); kw = summed turbine rating.',
    }
    OUT.write_text(json.dumps({'meta': meta, 'farms': out}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f"{meta['farms']} of {len(us)} US farms matched ({meta['mw']:,} of {meta['us_mw']:,} MW), {meta['turbines']:,} turbines; "
          f"{rejected} farms rejected on capacity; {OUT.stat().st_size / 1e6:.2f} MB")


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
