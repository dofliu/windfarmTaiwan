#!/usr/bin/env python3
"""OpenStreetMap 的風機位置對到本站風場 · Match OpenStreetMap wind turbines to the site's farms → data/global/turbines_osm.json

  python3 tools/fetch_osm_turbines.py osm_wind/      # 先下載（見該程式）
  python3 tools/build_turbines_osm.py osm_wind/

美國用 USWTDB（tools/build_turbines.py），其他國家用 OpenStreetMap。OSM 的風機多半沒有名稱，所以分兩步、寧可少配：
  1. 風場範圍：OSM 有名稱的風場（power=plant＋plant:source=wind）與本站風場名稱相符（英文字詞或中日韓文的字元組）、
     中心相距 30 km 內，且容量相符（OSM 有寫容量時 ±15%，而且單機容量不離譜；沒寫時用 3 的檢查）→ 範圍內的風機歸給這座風場。
  2. 空間群聚：其餘風機以 2 km 相連成群；一群附近（最近的風機 5 km 內，概略座標的風場 10 km）只有一座本站風場 → 整群歸給它；
     有好幾座 → 依最近的風場座標分開，每一份都要通過 3 的檢查，有一份不通過就整群不用。
  3. 檢查：OSM 有一半以上的風機寫了單機容量 → 加總要在風場容量 ±20% 內；本站有機組數 → ±15% 內；
     都沒有 → 容量 ÷ 部數（單機容量）要落在該年代陸域／離岸機組的合理範圍內。
只對營運中、沒有除役年的風場；共用代用座標的紀錄（flags 4）與德國已有 MaStR 機位的風場不對。OSM 是 ODbL 授權，輸出檔也以 ODbL 分享（見 meta.license）。

The US uses USWTDB (tools/build_turbines.py); other countries use OpenStreetMap. Most OSM turbines carry no name, so matching is
conservative and in two steps: (1) named OSM wind plants matched to a farm by name (Latin words or CJK character pairs), centre
within 30 km and capacity (±15% when OSM states it, with a loose unit-size check; otherwise the plausibility check below) give the farm the turbines inside the
plant; (2) the remaining turbines are grouped (2 km links); a group with exactly one site farm nearby (nearest turbine within 5 km,
10 km for approximate coordinates) goes to that farm, and a group with several is split by nearest farm point, every share passing
the check or the whole group is dropped. The check: when half or more of the turbines state a rating, their sum must be within ±20%
of the farm's capacity; when the site knows the turbine count, within ±15%; otherwise capacity ÷ count must be a plausible unit size
for the era and onshore/offshore. Only operating farms without a retirement year; records on a shared placeholder point (flags 4) and German
farms with MaStR positions are skipped. OpenStreetMap data is ODbL, and so is the output (see meta.license).
"""
import collections
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FARMS = ROOT / 'data/global/wind_farms.json'
OUT = ROOT / 'data/global/turbines_osm.json'
LINK_KM, NEAR_KM, NEAR_APPROX_KM, PLANT_KM = 2.0, 5.0, 10.0, 30.0
GENERIC = {'wind', 'farm', 'windfarm', 'park', 'windpark', 'energy', 'project', 'power', 'plant', 'station', 'offshore', 'onshore',
           'phase', 'the', 'of', 'and', 'de', 'la', 'le', 'du', 'des', 'el', 'parque', 'eolico', 'eólico', 'eolien', 'éolien', 'parc',
           'windpark', 'vindpark', 'vindkraftpark', 'windenergiepark', 'centrale', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'ltd', 'llc', 'co'}
CJK_SUFFIX = re.compile(r'(離岸|海上|陸域)?(風力發電|风力发电|風力|风力|風電|风电|風場|风场|風機|发电|發電|項目|项目|站|場|场|廠|厂|一期|二期|三期|ウインドファーム|風力発電所|発電所|洋上|풍력발전단지|풍력|단지)+')


def km(a_lat, a_lon, b_lat, b_lon):
    p = math.radians
    h = math.sin(p(b_lat - a_lat) / 2) ** 2 + math.cos(p(a_lat)) * math.cos(p(b_lat)) * math.sin(p(b_lon - a_lon) / 2) ** 2
    return 12742 * math.asin(math.sqrt(min(1, h)))


def latin(s):
    s = re.sub(r'\(.*?\)', ' ', (s or '').split(' · ')[0])
    return {w for w in re.findall(r'[a-zà-öø-ÿ0-9]+', s.lower()) if w not in GENERIC and len(w) > 2 and not w.isdigit()}


def cjk_pairs(s):
    s = CJK_SUFFIX.sub('', re.sub(r'[（(].*?[）)]', '', s or ''))
    s = ''.join(ch for ch in s if '぀' <= ch <= '鿿' or '가' <= ch <= '힯')
    return {s[i:i + 2] for i in range(len(s) - 1)}


def phase_ids(s):
    """名稱裡的期別編號（1、2a、H6、IV…）"""
    s = re.sub(r'(19|20)\d\d', ' ', (s or '').lower())
    return set(re.findall(r'\b[a-z]?\d{1,2}[a-z]?\b', s)) | {r for r in re.findall(r'\b(ii|iii|iv|vi|vii|viii)\b', s)}


def names_match(farm, tags):
    fp = phase_ids(farm['name'])
    fl = latin(farm['name'])
    fz = cjk_pairs(farm['zh'] or '') | cjk_pairs(farm['name'])
    for k, v in tags.items():
        if not (k == 'name' or k.startswith('name:') or k in ('alt_name', 'official_name', 'old_name')):
            continue
        pl, pz, pp = latin(v), cjk_pairs(v), phase_ids(v)
        if fp and pp and not (pp <= fp):            # 期別編號不同（2a 不能配到 2b & 4）
            continue
        if fl and pl and (fl & pl) and len(fl & pl) >= min(len(fl), len(pl), 2) * 0.5:
            return True
        if fz and pz and len(fz & pz) >= max(1, 0.5 * min(len(fz), len(pz))):
            return True
    return False


def mw_of(v):
    m = re.match(r'\s*([\d.,]+)\s*(GW|MW|kW|W)?\s*$', str(v or ''), re.I)
    if not m:
        return None
    x = float(m.group(1).replace(',', '.') if m.group(1).count(',') == 1 and '.' not in m.group(1) else m.group(1).replace(',', ''))
    unit = (m.group(2) or 'MW').lower()
    return x * {'gw': 1000, 'mw': 1, 'kw': 1e-3, 'w': 1e-6}[unit]


def unit_range(f):
    y, off = f['year'] or 2015, f['type'] != 0
    if off:
        return (0.4, 5) if y < 2010 else (2, 8.5) if y < 2018 else (3.5, 12) if y < 2022 else (5, 18)
    return (0.02, 1.0) if y < 2000 else (0.5, 3.2) if y < 2010 else (0.8, 4.8) if y < 2018 else (1.5, 7.5)


def turbine_count(f):
    t = f['turbine'] or ''
    many = re.findall(r'(\d+)\s*[x×]\s', t)              # 混合機型（例：「22x A + 51x B」）要加總，不能只取第一個
    if many:
        return sum(int(n) for n in many)
    m = re.search(r'(?:MW|\s)\s*[x×]\s*(\d+)\b', t) or re.search(r'(\d+)\s*(?:turbines|units|部)', t, re.I)
    return int(m.group(1)) if m else None


def plausible(f, pts):
    n = len(pts)
    if n == 0:
        return False
    outs = [o for o in (mw_of(p[2].get('generator:output:electricity')) for p in pts) if o and 0.01 <= o <= 25]
    if len(outs) >= 0.5 * n:
        est = sum(outs) / len(outs) * n
        return abs(est - f['mw']) <= 0.2 * f['mw']
    cnt = turbine_count(f)
    if cnt:
        return abs(n - cnt) <= max(1, 0.15 * cnt)
    lo, hi = unit_range(f)
    return lo <= f['mw'] / n <= hi


def rings_of(el):
    """way／relation 的邊界（[lon, lat] 串列的封閉環）"""
    if el['type'] == 'way':
        g = [(p['lon'], p['lat']) for p in el.get('geometry') or []]
        return [g] if len(g) > 3 and g[0] == g[-1] else []
    parts = [[(p['lon'], p['lat']) for p in m.get('geometry') or []] for m in el.get('members', []) if m['type'] == 'way' and m.get('role', 'outer') in ('outer', '')]
    parts = [p for p in parts if len(p) > 1]
    rings = []
    while parts:
        ring = parts.pop()
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, p in enumerate(parts):
                if p[0] == ring[-1]:
                    ring += p[1:]
                elif p[-1] == ring[-1]:
                    ring += p[::-1][1:]
                elif p[-1] == ring[0]:
                    ring = p[:-1] + ring
                elif p[0] == ring[0]:
                    ring = p[::-1][:-1] + ring
                else:
                    continue
                parts.pop(i)
                changed = True
                break
        if len(ring) > 3 and ring[0] == ring[-1]:
            rings.append(ring)
    return rings


def inside(lon, lat, ring):
    c = False
    for i in range(len(ring) - 1):
        (x1, y1), (x2, y2) = ring[i], ring[i + 1]
        if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            c = not c
    return c


def main(osm_dir):
    fj = json.loads(FARMS.read_text(encoding='utf-8'))
    cols = fj['meta']['cols']
    farms = [dict(zip(cols, r)) for r in fj['rows']]
    de = ROOT / 'data/global/turbines_de.json'                          # 德國有 MaStR 機位的風場不用 OSM（tools/build_mastr.py）
    mastr = set(json.loads(de.read_text(encoding='utf-8'))['farms']) if de.exists() else set()
    cand = [f for f in farms if f['st'] == 0 and not f['end'] and f['iso'] != 'USA' and not (f['flags'] & 4) and 'DEU|' + f['name'] not in mastr]

    turbines, plants, base = {}, {}, None
    for fp in sorted(Path(osm_dir).glob('tile_*.json')):
        d = json.loads(fp.read_text(encoding='utf-8'))
        base = base or d.get('osm_base')
        for el in d['elements']:
            if el['type'] == 'node' and el.get('tags', {}).get('power') == 'generator':
                turbines[el['id']] = (el['lon'], el['lat'], el.get('tags', {}))
            elif el.get('tags', {}).get('power') == 'plant':
                plants[(el['type'], el['id'])] = el
    print(f'{len(turbines):,} OSM turbines, {len(plants):,} wind plants', flush=True)

    # 空間索引：0.05° 格
    grid = collections.defaultdict(list)
    for tid, (lon, lat, _) in turbines.items():
        grid[(int(math.floor(lon / 0.05)), int(math.floor(lat / 0.05)))].append(tid)

    def near_ids(lon, lat, r_km):
        dl = r_km / 111 + 0.05
        dlo = dl / max(0.2, math.cos(math.radians(lat)))
        out = []
        for gx in range(int(math.floor((lon - dlo) / 0.05)), int(math.floor((lon + dlo) / 0.05)) + 1):
            for gy in range(int(math.floor((lat - dl) / 0.05)), int(math.floor((lat + dl) / 0.05)) + 1):
                out += grid.get((gx, gy), [])
        return out

    fgrid = collections.defaultdict(list)
    for i, f in enumerate(cand):
        fgrid[(int(math.floor(f['lon'] / 0.5)), int(math.floor(f['lat'] / 0.5)))].append(i)

    def near_farms(lon, lat, r_km):
        dl = r_km / 111 + 0.5
        dlo = dl / max(0.2, math.cos(math.radians(lat)))
        out = []
        for gx in range(int(math.floor((lon - dlo) / 0.5)), int(math.floor((lon + dlo) / 0.5)) + 1):
            for gy in range(int(math.floor((lat - dl) / 0.5)), int(math.floor((lat + dl) / 0.5)) + 1):
                out += fgrid.get((gx, gy), [])
        return out

    assigned, used = {}, set()          # farm index → [turbine ids]；已用掉的風機
    plant_hits = collections.defaultdict(list)
    how = {}
    # 1. 有名稱的風場範圍
    for key, el in plants.items():
        tags = el.get('tags', {})
        if not any(k == 'name' or k.startswith('name:') for k in tags):
            continue
        rings = rings_of(el)
        node_ids = [m['ref'] for m in el.get('members', []) if m['type'] == 'node' and m['ref'] in turbines]
        pts = []
        if rings:
            xs = [x for r in rings for x, _ in r]
            ys = [y for r in rings for _, y in r]
            clon, clat = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
            rad = km(min(ys), min(xs), max(ys), max(xs)) / 2 + 1
            pts = [t for t in near_ids(clon, clat, rad) if any(inside(turbines[t][0], turbines[t][1], r) for r in rings)]
        pts = sorted(set(pts) | set(node_ids))
        if not pts:
            continue
        clon = sum(turbines[t][0] for t in pts) / len(pts)
        clat = sum(turbines[t][1] for t in pts) / len(pts)
        cap = mw_of(tags.get('plant:output:electricity'))
        best = None
        for i in near_farms(clon, clat, PLANT_KM):
            f = cand[i]
            if km(clat, clon, f['lat'], f['lon']) > PLANT_KM or not names_match(f, tags):
                continue
            if cap and cap > 1.15 * f['mw']:         # 範圍比風場大太多：不是這一座
                continue
            if True:
                d = km(clat, clon, f['lat'], f['lon'])
                if best is None or d < best[0]:
                    best = (d, i)
        if best:
            plant_hits[best[1]].append((pts, cap))
    for i, hits in plant_hits.items():           # 一座風場可以有好幾個 OSM 範圍（例：分期各畫一個）
        pts = sorted({t for p, _ in hits for t in p} - used)
        caps = [c for _, c in hits]
        f = cand[i]
        lo, hi = unit_range(f)                   # OSM 容量相符但只畫了部分風機時，單機容量會不合理 · stated capacity matches but only some turbines are mapped
        ok = (abs(sum(caps) - f['mw']) <= 0.15 * f['mw'] and pts and 0.7 * lo <= f['mw'] / len(pts) <= 1.3 * hi) if all(caps) \
            else plausible(f, [turbines[t] for t in pts])
        if pts and ok:
            assigned[i] = pts
            used.update(pts)
            how[i] = 'plant'

    # 2. 其餘風機的空間群聚（2 km 相連）
    rest = [t for t in turbines if t not in used]
    parent = {t: t for t in rest}

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    rest_set = set(rest)
    for t in rest:
        lon, lat, _ = turbines[t]
        for u in near_ids(lon, lat, LINK_KM):
            if u in rest_set and u != t and km(lat, lon, turbines[u][1], turbines[u][0]) <= LINK_KM:
                ra, rb = find(t), find(u)
                if ra != rb:
                    parent[ra] = rb
    groups = collections.defaultdict(list)
    for t in rest:
        groups[find(t)].append(t)
    n_split = n_drop = 0
    for pts in groups.values():
        clon = sum(turbines[t][0] for t in pts) / len(pts)
        clat = sum(turbines[t][1] for t in pts) / len(pts)
        rad = max(km(clat, clon, turbines[t][1], turbines[t][0]) for t in pts)
        cands = []
        for i in near_farms(clon, clat, rad + NEAR_APPROX_KM):
            if i in assigned:
                continue
            f = cand[i]
            lim = NEAR_APPROX_KM if f['flags'] & 1 else NEAR_KM
            if km(clat, clon, f['lat'], f['lon']) > rad + lim:
                continue
            if min(km(f['lat'], f['lon'], turbines[t][1], turbines[t][0]) for t in pts) <= lim:
                cands.append(i)
        if not cands:
            continue
        if len(cands) == 1:
            share = {cands[0]: pts}
        else:
            share = collections.defaultdict(list)
            for t in pts:
                lon, lat, _ = turbines[t]
                share[min(cands, key=lambda i: km(lat, lon, cand[i]['lat'], cand[i]['lon']))].append(t)
            n_split += 1
        if all(plausible(cand[i], [turbines[t] for t in v]) for i, v in share.items()):     # 沒分到風機的鄰近風場不影響（它可能在別群）
            for i, v in share.items():
                assigned[i] = v
                how[i] = 'group'
        else:
            n_drop += 1

    out = {}
    for i, ids in assigned.items():
        f = cand[i]
        clon = sum(turbines[t][0] for t in ids) / len(ids)
        clat = sum(turbines[t][1] for t in ids) / len(ids)
        pos = []
        for t in ids:
            pos += [round((turbines[t][0] - clon) * 1e5), round((turbines[t][1] - clat) * 1e5)]
        tags = [turbines[t][2] for t in ids]
        def common(*keys):
            vals = collections.Counter(' '.join(x for x in (tg.get(k) for k in keys) if x) for tg in tags)
            v, c = vals.most_common(1)[0]
            return (v, len([x for x in vals if x])) if v and c >= 0.5 * len(ids) else (None, 0)
        model, mn = common('manufacturer', 'model')
        num = lambda k: [v for v in (mw_of(tg.get(k)) for tg in tags) if v]   # noqa: E731 - 公尺值同樣用 mw_of 解析數字
        hh = [v for v in num('height:hub') if 20 <= v <= 200]
        rd = [v for v in num('rotor:diameter') if 10 <= v <= 300]
        out[f['iso'] + '|' + f['name']] = {
            'c': [round(clon, 5), round(clat, 5)], 'p': pos, 'n': len(ids), 'm': model, 'mn': mn,
            'hh': [min(hh), max(hh)] if len(hh) >= 0.5 * len(ids) else None, 'rd': [min(rd), max(rd)] if len(rd) >= 0.5 * len(ids) else None,
            'by': how[i],
        }
    meta = {
        'source': 'OpenStreetMap: nodes tagged power=generator + generator:source=wind, and wind plants (power=plant + plant:source=wind)',
        'osm_base': base, 'url': 'https://www.openstreetmap.org/copyright',
        'license': 'Open Database License (ODbL) 1.0 — © OpenStreetMap contributors. This file is a derived database and is shared under the ODbL; see https://opendatacommons.org/licenses/odbl/',
        'farms': len(out), 'turbines': sum(v['n'] for v in out.values()), 'mw': round(sum(cand[i]['mw'] for i in assigned)),
        'by_plant': sum(1 for v in out.values() if v['by'] == 'plant'), 'by_group': sum(1 for v in out.values() if v['by'] == 'group'),
        'candidates': len(cand), 'candidate_mw': round(sum(f['mw'] for f in cand)),
        'note': 'Keys are "ISO|farm name". Positions are offsets from "c" in 1e-5 degrees, [dlon, dlat, ...]; hh/rd = hub height and rotor diameter (m) when at least half the turbines are tagged.',
    }
    OUT.write_text(json.dumps({'meta': meta, 'farms': dict(sorted(out.items()))}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    by_iso = collections.Counter(k.split('|')[0] for k in out)
    print(f"{meta['farms']:,} of {meta['candidates']:,} farms matched ({meta['mw']:,} of {meta['candidate_mw']:,} MW), {meta['turbines']:,} turbines "
          f"(plant {meta['by_plant']}, group {meta['by_group']}); groups split {n_split}, dropped {n_drop}; {OUT.stat().st_size / 1e6:.2f} MB")
    print('top countries:', by_iso.most_common(15))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
