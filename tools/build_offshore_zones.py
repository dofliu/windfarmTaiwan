#!/usr/bin/env python3
"""海域圖層：專屬經濟區界線與台灣離岸風電潛力場址 → data/global/offshore_zones.json
Sea-zones layer: exclusive economic zone boundaries and Taiwan's offshore wind potential sites

  python3 tools/build_offshore_zones.py [eez_boundaries.json]

專屬經濟區：Flanders Marine Institute（VLIZ）Marine Regions「Maritime Boundaries Geodatabase」第 12 版（2023）的 eez_boundaries 圖層，
CC BY 4.0（https://www.marineregions.org/disclaimer.php）。不給檔案時向 Marine Regions 的 WFS 下載（約 25 MB，不存進 repo；
Marine Regions 請使用者不要在別處提供原始資料下載，所以這裡只留簡化過、供地圖顯示的線）。
  · 不畫基線（Straight／Archipelagic／Normal baseline），其餘依線的類型分三組：協議或判決（Treaty、Court ruling、Joint regime）、
    中線與外界（Median line、200 NM、12 NM、Connection line、Unilateral claim）、未定或有爭議（Unsettled …）。
  · Douglas–Peucker 簡化（0.02°，約 2 km），座標取到 0.001°。界線不具法律效力，也不代表本站對任何爭議海域的立場。
台灣離岸風電潛力場址：經濟部能源署「台灣離岸風電潛力場址地理資訊」（政府資料開放平臺 36681，政府資料開放授權條款第 1 版；
2015 年公告的 36 處），存在 data/global/sources/twn_offshore_potential_sites_36681.csv。檔案只列各點的 TWD97 二度分帶座標，
點的順序不一定沿著邊界，所以每一處都用公告面積核對：
  1. 檔案順序圍成的多邊形（不自我相交）面積與公告相差 3% 以內 → 用檔案順序；
  2. 否則試著依檔案順序從中間切成兩個環：兩塊面積和、或外環扣掉完全在其內的內環（挖空）的面積與公告相差 1% 以內才用；
  3. 否則（10 點以內）試所有順序，只有一種不自我相交、面積相差 1% 以內時才用；
  4. 都不行就不畫，理由寫進輸出檔的 meta（不猜）。

EEZ: the eez_boundaries layer of the Flanders Marine Institute's (VLIZ) Maritime Boundaries Geodatabase v12 (2023), CC BY 4.0, downloaded
from the Marine Regions WFS when no file is given (about 25 MB, not kept; Marine Regions asks users not to offer its data for download
elsewhere, so only simplified display lines are kept). Baselines are left out; the other lines fall into three groups (agreed: treaty,
court ruling, joint regime; median lines and outer limits; unsettled or disputed). Douglas–Peucker at 0.02°, coordinates to 0.001°.
The lines have no legal value and imply no position on any disputed area.
Taiwan potential sites: Energy Administration open data 36681 (Open Government Data Licence v1; the 36 sites published in 2015), saved in
data/global/sources/. The file lists TWD97 TM2 vertices in no guaranteed order, so each site is checked against its published area:
file order if it forms a simple polygon within 3%; otherwise two rings split in file order, either two parts whose areas add up or an outer
ring minus a hole lying wholly inside it, within 1%; otherwise a vertex order only when it is the unique simple polygon within 1% (up to 10
vertices); otherwise the site is left out with the reason.
"""
import csv
import collections
import itertools
import json
import sys
import time
import urllib.request
from pathlib import Path

from pyproj import Transformer

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/global/offshore_zones.json'
TW_CSV = ROOT / 'data/global/sources/twn_offshore_potential_sites_36681.csv'
EEZ_WFS = ('https://geo.vliz.be/geoserver/MarineRegions/wfs?service=WFS&version=1.0.0&request=GetFeature'
           '&typeName=MarineRegions:eez_boundaries&outputFormat=application/json')
TOL = 0.02
GROUPS = ['agreed', 'median', 'unsettled']
GROUP_OF = {'Treaty': 0, 'Court ruling': 0, 'Joint regime': 0,
            'Median line': 1, '200 NM': 1, '12 NM': 1, 'Connection line': 1, 'Unilateral claim (undisputed)': 1}
SKIP = {'Straight baseline', 'Archipelagic baseline', 'Normal baseline (official)'}
COUNTY_EN = {'新北市': 'New Taipei', '桃園市': 'Taoyuan', '新竹縣': 'Hsinchu County', '新竹市': 'Hsinchu City', '苗栗縣': 'Miaoli',
             '台中市': 'Taichung', '彰化縣': 'Changhua', '雲林縣': 'Yunlin', '台南市': 'Tainan', '高雄市': 'Kaohsiung', '屏東縣': 'Pingtung'}


def dp(pts, tol):
    """Douglas–Peucker（迭代版）· iterative Douglas–Peucker on [(lon, lat), …]"""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        n2 = dx * dx + dy * dy
        best, bi = 0.0, -1
        for i in range(a + 1, b):
            x, y = pts[i]
            if n2:
                t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / n2))
                d = (x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2
            else:
                d = (x - x1) ** 2 + (y - y1) ** 2
            if d > best:
                best, bi = d, i
        if bi > 0 and best > tol * tol:
            keep[bi] = True
            stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]


def eez_lines(path):
    if path:
        d = json.loads(Path(path).read_text(encoding='utf-8'))
    else:
        print('downloading Marine Regions eez_boundaries …', flush=True)
        with urllib.request.urlopen(urllib.request.Request(EEZ_WFS, headers={'User-Agent': 'windfarmTaiwan'}), timeout=600) as r:
            d = json.loads(r.read())
    out, n0, n1, kinds = [], 0, 0, collections.Counter()
    for f in d['features']:
        t = f['properties']['line_type']
        if t in SKIP:
            continue
        g = GROUP_OF.get(t, 2 if t.startswith('Unsettled') else None)
        if g is None:
            raise SystemExit(f'unknown line type {t!r}: add it to GROUP_OF')
        kinds[GROUPS[g]] += 1
        geom = f['geometry']
        parts = geom['coordinates'] if geom['type'] == 'MultiLineString' else [geom['coordinates']]
        for p in parts:
            n0 += len(p)
            s = dp([tuple(c[:2]) for c in p], TOL)
            flat = []
            for x, y in s:
                flat += [round(x, 3), round(y, 3)]
            if len(flat) >= 4:
                out.append([g, flat])
                n1 += len(s)
    print(f'EEZ: {len(out)} lines, {n0:,} → {n1:,} points; ' + ', '.join(f'{k} {v}' for k, v in kinds.items()), flush=True)
    return out


def area(p):
    return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2 / 1e6


def simple(p):
    def o(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    n = len(p)
    for i in range(n):
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            a, b, c, e = p[i], p[(i + 1) % n], p[j], p[(j + 1) % n]
            if o(a, b, c) * o(a, b, e) < 0 and o(c, e, a) * o(c, e, b) < 0:
                return False
    return True


def inside(pt, poly):
    x, y = pt
    c = False
    for i in range(len(poly)):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % len(poly)]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def file_order_parts(pts, A):
    """依檔案順序切成兩個環：兩塊相加，或外環扣掉完全在裡面的內環（挖空），面積相差 1% 以內
    two rings in file order: two parts whose areas add up, or an outer ring minus a hole lying wholly inside it, within 1%"""
    for k in range(3, len(pts) - 2):
        a, b = pts[:k], pts[k:]
        if not (simple(a) and simple(b)):
            continue
        if abs(area(a) + area(b) - A) <= 0.01 * A:
            return [a, b], f'two parts ({k} + {len(pts) - k} vertices)'
        if all(inside(q, a) for q in b) and abs(area(a) - area(b) - A) <= 0.01 * A:
            return [a, b], f'outer ring ({k} vertices) with a hole ({len(pts) - k} vertices)'
    return None, None


def site_polys(pts, A):
    """回傳（多邊形清單, 方法）或（None, 理由）· returns (polygons, method) or (None, reason)"""
    if simple(pts) and abs(area(pts) - A) <= 0.03 * A:
        return [pts], 'file order'
    polys, how = file_order_parts(pts, A)
    if polys:
        return polys, how
    if len(pts) <= 10:
        hits = []
        for perm in itertools.permutations(range(1, len(pts))):
            if perm[0] > perm[-1]:
                continue
            p = [pts[0]] + [pts[i] for i in perm]
            if abs(area(p) - A) <= 0.01 * A and simple(p):
                hits.append(p)
        if len(hits) == 1:
            return hits, 'unique vertex order matching the published area'
        if len(hits) > 1:
            return None, f'{len(hits)} vertex orders match the published area; order cannot be determined'
    return None, 'no vertex order or split matches the published area'


def tw_sites():
    rows = list(csv.reader(open(TW_CSV, encoding='utf-8-sig'), delimiter='\t'))[1:]
    by = collections.OrderedDict()
    for r in rows:
        by.setdefault((int(r[3]), r[1], r[0], float(r[2])), []).append((float(r[5]), float(r[6])))
    tr = Transformer.from_crs('EPSG:3826', 'EPSG:4326', always_xy=True)
    out, skipped = [], []
    for (n, name, county, A), pts in by.items():
        polys, how = site_polys(pts, A)
        if polys is None:
            skipped.append({'n': n, 'name': name, 'area_km2': A, 'reason': how})
            print(f'  site {n} {name}: left out — {how}', flush=True)
            continue
        ll = []
        for p in polys:
            flat = []
            for x, y in p:
                lon, lat = tr.transform(x, y)
                flat += [round(lon, 5), round(lat, 5)]
            ll.append(flat)
        en = COUNTY_EN[county] + name[len(county):].replace('_', '-')
        out.append({'n': n, 'zh': name.replace('_', '-'), 'en': en.strip(), 'area': A, 'polys': ll, 'how': how})
    print(f'Taiwan: {len(out)} of {len(by)} potential sites drawn', flush=True)
    return out, skipped


# ------------------------------------------------ 北海周邊國家的離岸風電規劃區 · offshore wind areas around the North Sea
# 每國一個官方開放圖層（不需帳號），下載後只留風電區、簡化，授權與標示寫進 meta。英格蘭、威爾斯、北愛爾蘭（The Crown Estate）的授權
# 有額外限制（可撤回、不得用於提供類似服務的網站），使用者決定前不放。
# One official open layer per country (no account needed); only the wind areas are kept, simplified, with licence and credit in meta.
# England, Wales and Northern Ireland (The Crown Estate) are left out until the owner decides on its licence, which adds restrictions.
NS_TOL = 0.002          # 約 200 m · about 200 m
AREA_SOURCES = [
    dict(c='NLD', zh='荷蘭：已指定的離岸風電區', en='Netherlands: designated wind energy areas',
         url='https://geo.rijkswaterstaat.nl/services/ogc/gdr/windenergiegebieden/ows?service=WFS&version=2.0.0&request=GetFeature'
             '&typeNames=windenergiegebieden:aangewezen_windgebieden&outputFormat=application/json&srsName=EPSG:4326',
         page='https://data.overheid.nl/en/dataset/46780-aangewezen-windgebieden-nwp', license='CC0 1.0',
         credit='Rijkswaterstaat, Aangewezen windgebieden (Programma Noordzee 2022–2027)', by='Rijkswaterstaat', lic='CC0',
         name=lambda p: (p.get('opmerking') or '').strip() or p['windgebied']),
    dict(c='DEU', zh='德國：離岸風電區域發展計畫（FEP 2025）的區域', en='Germany: areas of the Site Development Plan (FEP 2025)',
         url='https://gdi.bsh.de/mapservice_gs/Site_Development_Plan_2025/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature'
             '&TYPENAMES=Site_Development_Plan_2025:Area&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326',
         page='https://gdi.bsh.de/en/mapservice/Site-Development-Plan-in-the-German-Maritime-Area-2025-WFS',
         license='GeoNutzV (Nutzungsbestimmungen für die Bereitstellung von Geodaten des Bundes)', credit='Quelle: © BSH 2025 (Flächenentwicklungsplan 2025), vereinfacht', by='© BSH 2025', lic='GeoNutzV',
         keep=lambda p: p.get('status') == 'planned', name=lambda p: p['name_fep'],
         note='Areas under review (status "under Review") are left out; the plan covers the EEZ only, not the 12 NM territorial sea.'),
    dict(c='BEL', zh='比利時：海洋空間計畫 2026–2034 的再生能源區', en='Belgium: renewable energy zones of the 2026–2034 marine spatial plan',
         url='https://spatial.naturalsciences.be/geoserver/imsp26/ows?service=WFS&version=2.0.0&request=GetFeature'
             '&typeNames=imsp26:bmsp_energy_cables_pipelines_zone&outputFormat=application/json&srsName=EPSG:4326',
         page='https://doi.org/10.24417/bmdc.be:dataset:3121', license='CC BY 4.0',
         credit='RBINS, Belgian Marine Data Centre: 2026 Belgian MSP – Energy, cable and pipeline zones (doi:10.24417/bmdc.be:dataset:3121), simplified', by='RBINS / BMDC', lic='CC BY 4.0',
         keep=lambda p: 'renewable energy zone' in (p.get('resource_title_en') or '').lower(),
         name=lambda p: p['resource_title_en'].replace('Princess Elisabeth renewable energy zone: ', 'Princess Elisabeth ')
                                              .replace('Renewable energy zone: ', '')),
    dict(c='DNK', zh='丹麥：海洋空間計畫的再生能源發展區（含能源島）', en='Denmark: renewable energy development zones of the maritime spatial plan',
         url='https://havplan.dk/geoserver/havplan/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=havplan:Danmarks_havplan_af_28_juni_2024'
             "&outputFormat=application/json&srsName=EPSG:25832&CQL_FILTER=zone_type%20IN%20('Ev','Ei')",
         crs='EPSG:25832', page='https://havplan.dk/', license='CC BY 4.0',
         credit='Søfartsstyrelsen (Danish Maritime Authority), Danmarks Havplan af 28. juni 2024, simplified', by='Søfartsstyrelsen', lic='CC BY 4.0',
         name=lambda p: p['feature_ref_id'],
         note='Zones Ev (renewable energy) and Ei (renewable energy and energy islands), all Danish waters; the plan names zones by number only. '
              'Requested in EPSG:25832 (the service rounds EPSG:4326 output to whole degrees) and converted.'),
    dict(c='GBR', zh='英國蘇格蘭：Crown Estate Scotland 的離岸風電租約區', en='Scotland: Crown Estate Scotland offshore wind lease and option areas',
         url='https://services3.arcgis.com/nGV4jiurzcahJ9LV/ArcGIS/rest/services/Offshore_Wind_Crown_Estate_Scotland/FeatureServer/0/query'
             '?where=1%3D1&outFields=*&outSR=4326&f=geojson',
         page='https://www.arcgis.com/home/item.html?id=b9c7d514362f40ceb3fe299b47aeb8b3', license='Open Government Licence v3.0',
         credit='Contains public sector information licensed under the Open Government Licence v3.0, from Crown Estate Scotland', by='Crown Estate Scotland', lic='OGL v3.0',
         keep=lambda p: p.get('Property_Classification') == 'Wind Farm', name=lambda p: ' '.join(p['Property_Description'].split()),
         note='Seabed lease and option areas of individual projects (existing farms, ScotWind and INTOG), not plan-level zones. England, Wales and '
              'Northern Ireland (The Crown Estate) are not included: its open data licence adds restrictions, pending the owner\'s decision.'),
    dict(c='NOR', zh='挪威：已開放申請的離岸風電區', en='Norway: areas opened for offshore wind',
         url='https://kart.nve.no/enterprise/rest/services/Mapservices/HavvindOnline/MapServer/17/query?where=1%3D1&outFields=*&outSR=4326&f=geojson',
         page='https://kart.nve.no/enterprise/rest/services/Mapservices/HavvindOnline/MapServer', license='NLOD 2.0',
         credit='Contains data under the Norwegian licence for Open Government data (NLOD) distributed by NVE, simplified', by='NVE', lic='NLOD 2.0',
         name=lambda p: p['havvindomr']),
]


def fetch_json(url, cache, key):
    f = Path(cache) / f'{key}.json' if cache else None
    if f and f.exists():
        return json.loads(f.read_text(encoding='utf-8'))
    for attempt in range(3):          # 伺服器偶爾直接斷線，重試兩次 · servers sometimes drop the connection; retry twice
        print(f'downloading {key} …', flush=True)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'windfarmTaiwan'}), timeout=300) as r:
                raw = r.read()
            break
        except OSError as e:
            if attempt == 2:
                raise
            print(f'  {e}; retrying', flush=True)
            time.sleep(5)
    if f:
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_bytes(raw)
    return json.loads(raw)


def rings_of(geom):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    return [ring for poly in polys for ring in poly]


def ns_areas(cache=None):
    from pyproj import Geod
    geod = Geod(ellps='WGS84')
    out, meta = [], {}
    for src in AREA_SOURCES:
        d = fetch_json(src['url'], cache, src['c'])
        tr = Transformer.from_crs(src['crs'], 'EPSG:4326', always_xy=True) if src.get('crs') else None
        n = 0
        for f in d['features']:
            p = f['properties']
            if src.get('keep') and not src['keep'](p):
                continue
            polys, km2 = [], 0.0
            for ring in rings_of(f['geometry']):
                pts = [tuple(tr.transform(x, y)) if tr else (x, y) for x, y in (c[:2] for c in ring)]
                km2 += geod.polygon_area_perimeter([x for x, y in pts], [y for x, y in pts])[0] / 1e6
                s = dp(pts, NS_TOL)
                if len(s) >= 4:
                    polys.append([v for x, y in s for v in (round(x, 4), round(y, 4))])
            if polys:
                out.append({'c': src['c'], 'n': src['name'](p), 'km2': round(abs(km2), 1), 'polys': polys})
                n += 1
        meta[src['c']] = {k: src[k] for k in ('zh', 'en', 'page', 'license', 'credit', 'by', 'lic', 'note') if src.get(k)}
        print(f'  {src["c"]}: {n} areas', flush=True)
    return out, meta


def main(eez_path=None, cache=None):
    eez = eez_lines(eez_path)
    tw, skipped = tw_sites()
    areas, area_meta = ns_areas(cache)
    meta = {
        'eez': {'source': 'Flanders Marine Institute (2023). Maritime Boundaries Geodatabase: Maritime Boundaries and Exclusive Economic Zones (200NM), '
                          'version 12 (eez_boundaries). Available online at https://www.marineregions.org/',
                'url': 'https://www.marineregions.org/', 'license': 'CC BY 4.0', 'groups': GROUPS,
                'note': 'Simplified for display (Douglas–Peucker 0.02°, coordinates to 0.001°); baselines left out. Groups: agreed = treaty, court ruling, '
                        'joint regime; median = median lines, 200 NM and 12 NM limits, connection lines, undisputed unilateral claims; unsettled = '
                        'unsettled or disputed lines. The boundaries have no legal value and imply no position on any disputed area. '
                        'For the data itself, see marineregions.org.'},
        'tw': {'source': '經濟部能源署「台灣離岸風電潛力場址地理資訊」(Energy Administration, Taiwan offshore wind potential sites, data.gov.tw 36681)',
               'url': 'https://data.gov.tw/dataset/36681', 'license': '政府資料開放授權條款第 1 版 · Open Government Data License, version 1.0',
               'note': 'The 36 potential sites published in 2015 (TWD97 TM2 vertices converted to WGS84); each polygon is checked against the '
                       'published area, and sites whose vertex order cannot be determined are left out (see skipped).',
               'skipped': skipped},
        'areas': area_meta,
        'built': time.strftime('%Y-%m-%d'), 'tool': 'tools/build_offshore_zones.py',
    }
    OUT.write_text(json.dumps({'meta': meta, 'eez': eez, 'tw': tw, 'areas': areas}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: {OUT.stat().st_size / 1e3:.0f} kB')


if __name__ == '__main__':
    args = sys.argv[1:]
    cache = None
    if '--cache' in args:
        i = args.index('--cache'); cache = args[i + 1]; del args[i:i + 2]
    main(args[0] if args else None, cache)
