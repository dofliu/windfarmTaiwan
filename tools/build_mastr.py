#!/usr/bin/env python3
"""德國風場：聯邦網路局「市場主資料登錄」MaStR · Germany from the Bundesnetzagentur's Marktstammdatenregister (MaStR)

  python3 tools/build_mastr.py EinheitenWind.xml Katalogwerte.xml
  # 兩個檔都在 MaStR 全國匯出檔裡（https://www.marktstammdatenregister.de/MaStR/Datendownload，約 3 GB 的 zip）；
  # tools/fetch_mastr.py 用分段下載只取出這兩個檔（壓縮後約 10 MB），不用下載整個 zip。

MaStR 登錄了德國每一部發電機組（風機逐部：座標、機型、輪轂高度、葉輪直徑、商轉日、風場名稱），授權是
Datenlizenz Deutschland – Namensnennung – Version 2.0（dl-de/by-2-0），標示「© Bundesnetzagentur | Marktstammdatenregister」。

1. 營運中（狀態 35）、有座標的機組，依「風場名稱」（NameWindpark）分組，同名但相距超過 5 km 的拆開；沒有名稱的依 1.5 km 相連成群。
2. 對到本站的德國風場（營運中、不是 MaStR 來源的紀錄）：名稱有共同的字、相距 30 km 內（概略座標的風場、或名稱完全相同時 150 km）；每一群只給一座風場（共同字最多、最近的），
   一座風場可以收好幾群（分期），取容量加總最接近風場容量的組合，要在 ±20% 內。沒有名稱相符的，3 km 內只有一群且容量 ±20% 也算。
   → data/global/turbines_de.json：這些風場的實際機位與規格（近景與卡片用，取代 OpenStreetMap）。
3. 還沒對到的本站風場（大的先）由近到遠「預扣」8 km 內沒對到的群，拿到接近它的容量為止（最多 +30%）：這些群視為同一座、不另加；
   拿到的容量在 ±20% 內時也當成它的機位。其餘 1 MW 以上的陸域群＝本站還沒收錄的風場（寧可少加；更小的多為單部舊機或小型風機）。
   → data/global/sources/mastr_parks_DEU.json：由 tools/build_farms.py 加進風場層（來源代碼 4＝MaStR），分期依各機組的商轉年。
   離岸風場本站都已收錄，不從這裡加。
沒配成的群與風場再配一輪（最多三輪）；與還沒配成的本站風場名稱相同的群可能是它的一部分，也不另加；3 km 內有同名本站風場的群（容量對不上）也不加。
檢查：本站德國營運中的陸域容量＋新增的，不能超過 MaStR 陸域營運容量的 102%（超過表示重複）。
重建流程：fetch_mastr.py → build_mastr.py（只拿非 MaStR 來源的紀錄比對，結果穩定）→ build_farms.py → 其餘照 README。

MaStR registers every generating unit in Germany (each wind turbine with position, model, hub height, rotor diameter, commissioning
date and wind-farm name); licence Data licence Germany – attribution – 2.0. Operating units are grouped by wind-farm name (same name more
than 5 km apart is split; unnamed units link within 1.5 km). Groups are matched to the site's German farms (shared name word within 30 km, 150 km for farms with approximate coordinates or identical names; up to three rounds;
one farm per group, several groups per farm, the combination closest to the farm's capacity, within ±20%; otherwise a single group within 3 km with capacity ±20%) and give
those farms their real turbines (turbines_de.json). Each still-unmatched site farm (largest first) then reserves the nearest
unmatched groups within 8 km up to about its capacity (at most +30%); those are not added, and become its turbines when they sum to ±20%.
The remaining onshore groups of 1 MW or more become new farms (sources/mastr_parks_DEU.json, source code 4 in build_farms.py). Groups sharing a name with an unmatched site farm, or with any site farm within 3 km, are never added either. Check: site + added onshore
capacity must stay within 102% of the MaStR onshore total.
"""
import collections
import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FARMS = ROOT / 'data/global/wind_farms.json'
OUT_TB = ROOT / 'data/global/turbines_de.json'
OUT_PARKS = ROOT / 'data/global/sources/mastr_parks_DEU.json'
URL = 'https://www.marktstammdatenregister.de/MaStR/Datendownload'
LICENSE = 'Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0); © Bundesnetzagentur | Marktstammdatenregister'
SPLIT_KM, LINK_KM, MATCH_KM, FAR_KM, NEAR_KM, SAME_KM = 5.0, 1.5, 30.0, 150.0, 3.0, 8.0
TOL, SAME_TOL = 0.20, 0.30
GROUPS = []
MIN_MW = 1.0                 # 更小的（多為單部舊機或小型風機）不加進風場層 · smaller groups are not added
GENERIC = {'windpark', 'windenergiepark', 'windfeld', 'windfarm', 'wind', 'farm', 'park', 'wp', 'wea', 'weas', 'owp', 'bwp',
           'bürgerwindpark', 'buergerwindpark', 'offshore', 'onshore', 'gmbh', 'co', 'kg', 'mbh', 'und', 'der', 'die', 'das', 'am', 'an',
           'im', 'in', 'bei', 'von', 'zu', 'repowering', 'erweiterung', 'anlage', 'anlagen', 'windenergieanlage', 'windenergieanlagen',
           'windkraft', 'windkraftanlage', 'windkraftanlagen', 'energie', 'energiepark', 'projekt', 'bürgerwind', 'gbr', 'ug', 'ag', 'ii',
           'iii', 'iv', 'phase', 'bauabschnitt', 'ba', 'teil', 'neu', 'alt'}


def km(a_lat, a_lon, b_lat, b_lon):
    p = math.radians
    h = math.sin(p(b_lat - a_lat) / 2) ** 2 + math.cos(p(a_lat)) * math.cos(p(b_lat)) * math.sin(p(b_lon - a_lon) / 2) ** 2
    return 12742 * math.asin(math.sqrt(min(1, h)))


def words(s):
    s = re.sub(r'\(.*?\)', ' ', (s or '').split(' · ')[0]).lower()
    s = s.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    return {w for w in re.findall(r'[a-z0-9]+', s) if len(w) > 2 and not w.isdigit() and w not in GENERIC}


def clean(name):
    """風場名稱去掉公司型態（GmbH ＆ Co. KG 等）"""
    s = re.sub(r'(?i)\b(gmbh|mbh|ug|ag|kg|gbr|co\.?|haftungsbeschr\w*)(?=\W|$)|[＆&]', ' ', name or '')
    return re.sub(r'\s+', ' ', s).strip(' ,.-/')


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def load(xml_path, cat_path):
    cat = {}
    for _, el in ET.iterparse(cat_path):
        if el.tag == 'Katalogwert':
            d = {c.tag: c.text for c in el}
            cat[d.get('Id')] = d.get('Wert')
            el.clear()
    units, total = [], 0.0
    for _, el in ET.iterparse(xml_path):
        if el.tag != 'EinheitWind':
            continue
        d = {c.tag: c.text for c in el}
        el.clear()
        if d.get('EinheitBetriebsstatus') != '35':          # 35＝In Betrieb
            continue
        kw = num(d.get('Nettonennleistung')) or num(d.get('Bruttoleistung')) or 0
        total += kw
        lat, lon = num(d.get('Breitengrad')), num(d.get('Laengengrad'))
        if lat is None or lon is None:
            continue
        man = (cat.get(d.get('Hersteller')) or '').replace(' GmbH', '').replace(' & Co. KG', '').replace(' Deutschland', '').strip()
        units.append({'id': d['EinheitMastrNummer'], 'lat': lat, 'lon': lon, 'kw': kw, 'name': (d.get('NameWindpark') or '').strip(),
                      'sea': d.get('WindAnLandOderAufSee') == '889', 'y': int((d.get('Inbetriebnahmedatum') or '0')[:4] or 0),
                      'm': ' '.join(x for x in (man, (d.get('Typenbezeichnung') or '').strip()) if x), 'hh': num(d.get('Nabenhoehe')),
                      'rd': num(d.get('Rotordurchmesser')), 'gem': d.get('Gemeinde') or d.get('Ort') or ''})
    return units, total / 1000


def link(pts, dist):
    """單一連結分群（索引）"""
    parent = list(range(len(pts)))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    grid = collections.defaultdict(list)
    for i, p in enumerate(pts):
        grid[(int(p['lat'] / 0.05), int(p['lon'] / 0.05))].append(i)
    for i, p in enumerate(pts):
        gx, gy = int(p['lat'] / 0.05), int(p['lon'] / 0.05)
        r = int(dist / 4) + 1
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                for j in grid.get((gx + dx, gy + dy), []):
                    if j > i and km(p['lat'], p['lon'], pts[j]['lat'], pts[j]['lon']) <= dist:
                        a, b = find(i), find(j)
                        if a != b:
                            parent[a] = b
    out = collections.defaultdict(list)
    for i in range(len(pts)):
        out[find(i)].append(pts[i])
    return list(out.values())


def groups_of(units):
    by = collections.defaultdict(list)
    for u in units:
        by[u['name'].lower()].append(u)
    out = []
    for name, us in by.items():
        for g in link(us, SPLIT_KM if name else LINK_KM):
            lat = sum(u['lat'] for u in g) / len(g)
            lon = sum(u['lon'] for u in g) / len(g)
            out.append({'name': g[0]['name'], 'us': g, 'lat': lat, 'lon': lon, 'mw': sum(u['kw'] for u in g) / 1000,
                        'sea': sum(u['sea'] for u in g) > len(g) / 2, 'w': words(g[0]['name'])})
    return out


def spec(us):
    clat = sum(u['lat'] for u in us) / len(us)
    clon = sum(u['lon'] for u in us) / len(us)
    pos = []
    for u in us:
        pos += [round((u['lon'] - clon) * 1e5), round((u['lat'] - clat) * 1e5)]
    models = collections.Counter(u['m'] for u in us if u['m'])
    hh = [u['hh'] for u in us if u['hh'] and 10 <= u['hh'] <= 250]
    rd = [u['rd'] for u in us if u['rd'] and 5 <= u['rd'] <= 300]
    yrs = [u['y'] for u in us if u['y']]
    return {'c': [round(clon, 5), round(clat, 5)], 'p': pos, 'n': len(us), 'm': models.most_common(1)[0][0] if models else None,
            'mn': len(models), 'hh': [min(hh), max(hh)] if len(hh) >= 0.5 * len(us) else None,
            'rd': [min(rd), max(rd)] if len(rd) >= 0.5 * len(us) else None, 'kw': round(sum(u['kw'] for u in us)),
            'y': [min(yrs), max(yrs)] if yrs else None}


def best_subset(f, gis, fw):
    """容量加總最接近風場容量的組合（相同時取較近的），要在 ±20% 內；先只用共同字最多的群，湊不到再放寬（避免同鄉的別座風場混進來）"""
    score = {gi: len(fw & GROUPS[gi]['w']) for gi in gis}
    for top in sorted(set(score.values()), reverse=True):
        tier = sorted((gi for gi in gis if score[gi] >= top), key=lambda gi: km(f['lat'], f['lon'], GROUPS[gi]['lat'], GROUPS[gi]['lon']))[:12]
        best = None
        for mask in range(1, 1 << len(tier)):
            pick = [gi for k, gi in enumerate(tier) if mask >> k & 1]
            tot = sum(GROUPS[gi]['mw'] for gi in pick)
            key = (abs(tot - f['mw']), sum(km(f['lat'], f['lon'], GROUPS[gi]['lat'], GROUPS[gi]['lon']) for gi in pick))
            if best is None or key < best[0]:
                best = (key, pick)
        if best and best[0][0] <= TOL * f['mw']:
            return best[1]
    return None


def main(xml_path, cat_path):
    units, total_mw = load(xml_path, cat_path)
    groups = groups_of(units)
    GROUPS[:] = groups
    fj = json.loads(FARMS.read_text(encoding='utf-8'))
    cols = fj['meta']['cols']
    farms = [dict(zip(cols, r)) for r in fj['rows'] if r[cols.index('iso')] == 'DEU']
    site = [f for f in farms if f['src'] != 4 and f['st'] == 0 and not f['end'] and not (f['flags'] & 4)]
    site_mw = sum(f['mw'] for f in farms if f['src'] != 4 and f['st'] == 0 and not f['end'])
    print(f'MaStR: {len(units):,} operating turbines with coordinates ({total_mw:,.0f} MW operating in total); {len(groups):,} groups; '
          f'site: {len(site):,} operating German farms, {site_mw:,.0f} MW', flush=True)

    # 1. 名稱相符：每一群給共同字最多、最近的那座；沒配成的群與風場再配一輪（最多三輪）。
    #    概略座標的風場（flags 1）放寬到 150 km（GEM 偶有整筆錯置幾十公里的）
    fw = [words(f['name']) for f in site]
    radius = lambda f: FAR_KM if f['flags'] & 1 else MATCH_KM                                  # noqa: E731
    assigned, used = {}, set()
    for _ in range(3):
        cand = collections.defaultdict(list)
        for gi, g in enumerate(groups):
            if not g['w'] or gi in used:
                continue
            best = None
            for fi, f in enumerate(site):
                if fi in assigned or (f['type'] != 0) != g['sea']:
                    continue
                sh = len(fw[fi] & g['w'])
                if not sh:
                    continue
                d = km(f['lat'], f['lon'], g['lat'], g['lon'])
                if d <= (FAR_KM if fw[fi] == g['w'] else radius(f)) and (best is None or (sh, -d) > best[0]):
                    best = ((sh, -d), fi)
            if best:
                cand[best[1]].append(gi)
        n0 = len(assigned)
        for fi, gis in cand.items():
            pick = best_subset(site[fi], gis, fw[fi])
            if pick:
                assigned[fi] = pick
                used.update(pick)
        if len(assigned) == n0:
            break
    by_name = len(assigned)
    # 名稱與某座還沒配成的本站風場相同的群：可能是它的一部分，不另加
    named_open = {gi for gi, g in enumerate(groups) if gi not in used and g['w'] and any(
        fi not in assigned and fw[fi] & g['w'] and km(f['lat'], f['lon'], g['lat'], g['lon']) <= (FAR_KM if fw[fi] == g['w'] else radius(f))
        for fi, f in enumerate(site))}
    # 2. 沒有名稱相符：3 km 內只有一群、容量相近
    for fi, f in enumerate(site):
        if fi in assigned:
            continue
        near = [gi for gi, g in enumerate(groups) if gi not in used and (f['type'] != 0) == g['sea']
                and km(f['lat'], f['lon'], g['lat'], g['lon']) <= NEAR_KM]
        if len(near) == 1 and abs(groups[near[0]]['mw'] - f['mw']) <= TOL * f['mw']:
            assigned[fi] = near
            used.add(near[0])
    # 3. 還沒對到的本站風場依容量「預扣」附近（8 km 內）沒對到的群，由近到遠拿到接近它的容量為止：這些群視為同一座、不另加；
    #    拿到的容量在 ±20% 內時，也當成這座風場的機位
    held, by_budget = set(), 0
    for fi in sorted((fi for fi in range(len(site)) if fi not in assigned), key=lambda fi: -site[fi]['mw']):
        f = site[fi]
        near = sorted((km(f['lat'], f['lon'], g['lat'], g['lon']), gi) for gi, g in enumerate(groups)
                      if gi not in used and gi not in held and (f['type'] != 0) == g['sea'] and km(f['lat'], f['lon'], g['lat'], g['lon']) <= SAME_KM)
        take, tot = [], 0.0
        for d, gi in near:
            if tot >= (1 - TOL) * f['mw']:
                break
            if tot + groups[gi]['mw'] <= (1 + SAME_TOL) * f['mw']:
                take.append(gi)
                tot += groups[gi]['mw']
        held.update(take)
        if take and abs(tot - f['mw']) <= TOL * f['mw']:
            assigned[fi] = take
            by_budget += 1
    tb = {'DEU|' + site[fi]['name']: spec([u for gi in gis for u in groups[gi]['us']]) for fi, gis in assigned.items()}

    # 4. 其餘的陸域群＝本站還沒收錄的風場
    names_taken = {f['name'] for f in farms if f['src'] != 4}
    parks, seen, close = [], collections.Counter(), 0
    for gi, g in enumerate(groups):
        if gi in used or gi in held or gi in named_open or g['sea'] or g['mw'] < MIN_MW:
            continue
        if g['w'] and any(fw[fi] & g['w'] and km(f['lat'], f['lon'], g['lat'], g['lon']) <= NEAR_KM for fi, f in enumerate(site)):
            close += 1                                                  # 3 km 內有同名的本站風場（容量對不上）：寧可不加
            continue
        gem = collections.Counter(u['gem'] for u in g['us']).most_common(1)[0][0]
        base = clean(g['name']) or ('Windenergieanlagen ' + gem if gem else 'Windenergieanlagen')
        seen[base] += 1
        parks.append((base, gem, g))
    out_parks, mw_added = [], 0.0
    for base, gem, g in parks:
        name = base if seen[base] == 1 and base not in names_taken else f'{base} ({gem})' if gem else base
        k = 2
        while name in names_taken:
            name, k = f'{base} ({gem} {k})', k + 1
        names_taken.add(name)
        ph = collections.defaultdict(float)
        for u in g['us']:
            ph[u['y']] += u['kw'] / 1000
        yrs = sorted(y for y in ph if y)
        sp = spec(g['us'])
        out_parks.append({'name': name, 'lat': round(g['lat'], 4), 'lon': round(g['lon'], 4), 'mw': round(g['mw'], 2),
                          'year': yrs[0] if yrs else 0, 'ph': [[y, round(m, 2)] for y, m in sorted(ph.items())] if len(ph) > 1 else 0,
                          'turbine': f"{sp['n']} x {sp['m']}" if sp['m'] and sp['mn'] == 1 else '',   # 混合機型時卡片依語言顯示部數
                          'gem': gem, 'n': sp['n']})
        tb['DEU|' + name] = sp
        mw_added += g['mw']
    out_parks.sort(key=lambda p: (-p['mw'], p['name']))
    print(f'matched {len(assigned):,} site farms ({by_name:,} by name), {sum(site[fi]["mw"] for fi in assigned):,.0f} MW; '
          f'{by_budget:,} of them by nearby capacity; {len(held):,} groups held back for unmatched site farms, {len(named_open):,} for same-name unmatched farms, '
          f'{close:,} next to a same-name site farm; adding {len(out_parks):,} farms, {mw_added:,.0f} MW', flush=True)
    g_mw = lambda S: sum(groups[gi]['mw'] for gi in S)                          # noqa: E731
    un = [f for fi, f in enumerate(site) if fi not in assigned]
    print(f'  MaStR with coordinates {sum(g["mw"] for g in groups):,.0f} MW: in matched farms {g_mw({gi for v in assigned.values() for gi in v}):,.0f}, '
          f'held {g_mw(held - {gi for v in assigned.values() for gi in v}):,.0f}, offshore unmatched {sum(g["mw"] for gi, g in enumerate(groups) if g["sea"] and gi not in used and gi not in held):,.0f}; '
          f'unmatched site farms {len(un):,} ({sum(f["mw"] for f in un):,.0f} MW)', flush=True)
    if len(sys.argv) > 3:                                                         # 除錯：列出沒對到的本站風場
        Path(sys.argv[3]).write_text(json.dumps([{k: f[k] for k in ('name', 'mw', 'year', 'lat', 'lon', 'src', 'flags', 'type')} for f in un],
                                                ensure_ascii=False, indent=0), encoding='utf-8')
    on_site = sum(f['mw'] for f in farms if f['src'] != 4 and f['st'] == 0 and not f['end'] and f['type'] == 0)
    on_mastr = sum(g['mw'] for g in groups if not g['sea'])
    print(f'  onshore: site {on_site:,.0f} + added {mw_added:,.0f} = {on_site + mw_added:,.0f} MW vs MaStR onshore with coordinates {on_mastr:,.0f} MW', flush=True)
    if on_site + mw_added > on_mastr * 1.02:
        raise SystemExit('site + added onshore capacity exceeds MaStR by more than 2%: probably duplicates')
    meta = {'source': 'Bundesnetzagentur, Marktstammdatenregister (MaStR), Gesamtdatenexport: EinheitenWind', 'url': URL, 'license': LICENSE,
            'farms': len(tb), 'turbines': sum(v['n'] for v in tb.values()), 'mastr_mw': round(total_mw),
            'note': 'Keys are "ISO|farm name". Positions are offsets from "c" in 1e-5 degrees, [dlon, dlat, ...]; hh/rd = hub height and rotor diameter range (m); kw = summed net rating.'}
    OUT_TB.write_text(json.dumps({'meta': meta, 'farms': dict(sorted(tb.items()))}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    OUT_PARKS.write_text(json.dumps({'meta': {'source': meta['source'], 'url': URL, 'license': LICENSE, 'farms': len(out_parks),
                                              'mw': round(mw_added), 'mastr_mw': round(total_mw), 'site_mw': round(site_mw)},
                                     'parks': out_parks}, ensure_ascii=False, indent=0), encoding='utf-8')
    print(f'wrote {OUT_TB.name} ({len(tb):,} farms, {OUT_TB.stat().st_size / 1e6:.2f} MB) and {OUT_PARKS.name} ({len(out_parks):,} parks)')


if __name__ == '__main__':
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
