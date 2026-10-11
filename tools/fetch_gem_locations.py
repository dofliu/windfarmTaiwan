#!/usr/bin/env python3
"""共用代用座標的風場：從 GEM wiki 專案頁抓「Location」文字，再以 OpenStreetMap Nominatim 定位到鄉鎮或縣 ·
Placeholder-coordinate farms: read the "Location" text of each GEM wiki project page, then geocode it with Nominatim.

    python3 tools/fetch_gem_locations.py data/global/wind_farms.json data/global/sources/gem_locations.json

GEM 2026-02 版把約 1,350 座營運中風場（多在中國、印度）放在省或國家中心的代用座標（location-accuracy = approximate，
同一點上有幾十筆）。GEM 專案頁的「Location」表仍寫出鄉鎮、縣（區）、市、省（例：Baoshan, Huangdao District, Qingdao, Shandong, China），
這支程式：
  1. 依風場名稱（去掉本站加的「 · 分期」字尾）抓 https://www.gem.wiki/<名稱> 的 Location 文字（快取在暫存資料夾，重跑不再下載）；
  2. 把該文字送 Nominatim（每秒最多 1 次、通用 User-Agent）找出對應的行政區，只接受「行政區」或「聚落」類、地址含 GEM 寫的省（或邦）、
     與原代用點相距 800 km 以內、而且 OSM 物件有 wikidata 標籤的結果；
  3. 座標不取 OSM 的：改以該 Wikidata 項目的座標（P625，CC0）與中英文標籤為準（wbgetentities，每次 50 筆），OSM 只當查詢索引，
     輸出與網站都不含 OSM 的資料，不受 ODbL 的分享條款約束；
  4. 輸出 {name, iso, place, gem_url, wikidata, lat, lon, label_zh, label_en, level}，由 tools/farm_cleanup.py 的 GEM_LOC_RULES
     套用成「概略位置」的更正（仍標 flags 1：鄉鎮或縣中心不是風場本身的位置，但比省中心近得多）。
定位不到、或檢查不過的寫在 "skipped"，不臆測。

The February 2026 GEM release places about 1,350 operating farms (mostly China and India) on province- or country-centre
placeholders (location-accuracy = approximate, dozens of records on one point). The GEM project page's Location table still
names the township, county/district, city and province. This script fetches that text (cached), geocodes it with Nominatim
(≤1 request/s, generic User-Agent), accepts only administrative/settlement results whose address contains the province GEM gives,
that lie within 800 km of the placeholder and whose OSM object carries a wikidata tag. The published coordinate is then taken from
that Wikidata item (P625, CC0) together with its Chinese and English labels (wbgetentities, 50 per call); OSM serves only as the lookup
index and no OSM data is published, so the ODbL share-alike does not apply. tools/farm_cleanup.py (GEM_LOC_RULES) applies the result
as an approximate position (flag 1 kept: a township or county centre is not the farm itself, but far closer than a province centre).
"""
import hashlib
import html
import json
import math
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

CACHE = Path('/tmp/gem_loc_cache')
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
NOMINATIM = 'https://nominatim.openstreetmap.org/search'
GEM = 'https://www.gem.wiki/'
OK_TYPES = {'administrative', 'city', 'town', 'village', 'hamlet', 'suburb', 'county', 'district', 'municipality',
            'state_district', 'locality', 'neighbourhood', 'quarter', 'borough', 'region', 'province', 'island', 'isolated_dwelling'}
MAX_KM = 800


WD_UA = 'windfarmTaiwan-locations/1.0 (https://github.com/dofliu/windfarmTaiwan; research script)'   # Wikimedia 要求說明用途的 User-Agent


def get(url, retries=3, ua=UA):
    key = CACHE / (hashlib.sha1(url.encode()).hexdigest() + '.txt')
    if key.exists():
        return key.read_text(encoding='utf-8')
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': ua, 'Accept-Language': 'en'})
            with urllib.request.urlopen(req, timeout=30) as r:
                t = r.read().decode('utf-8', 'replace')
            key.write_text(t, encoding='utf-8')
            return t
        except urllib.error.HTTPError as e:
            if e.code in (404, 400):          # 沒有這個 GEM 頁面：不用重試
                return 'ERR ' + str(e)
            if i == retries - 1:
                return 'ERR ' + str(e)
            time.sleep(20 * (i + 1) if e.code == 429 else 2)     # Wikidata 的 429：等久一點再試
        except Exception as e:  # noqa: BLE001
            if i == retries - 1:
                return 'ERR ' + str(e)
            time.sleep(2)


def gem_location(name):
    """GEM 頁面 Location 表裡的地點文字（第一個分期的），找不到回 None"""
    page = GEM + urllib.parse.quote(name.replace(' ', '_'))
    t = get(page)
    if t.startswith('ERR'):
        return None, page, t
    txt = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', t)))
    m = re.search(r'Location Coordinates \( WGS 84 \) (.+?) \[ \d+ \] (-?\d+\.\d+), (-?\d+\.\d+)', txt)
    if not m:
        m = re.search(r'Location Coordinates \( WGS 84 \) (.+?) (-?\d+\.\d+), (-?\d+\.\d+)', txt)
    if not m:
        return None, page, 'no location table'
    place = m.group(1).strip()
    place = re.sub(r'\s*\[ \d+ \]\s*$', '', place)
    return place, page, None


def km(a, b, c, d):
    p = math.pi / 180
    x = math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


_last = [0.0]


def nominatim(q):
    wait = 1.1 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    url = NOMINATIM + '?' + urllib.parse.urlencode({'q': q, 'format': 'jsonv2', 'limit': 5, 'addressdetails': 1, 'extratags': 1, 'accept-language': 'en'})
    t = get(url)
    _last[0] = time.time()
    if t.startswith('ERR'):
        return []
    try:
        return json.loads(t)
    except ValueError:
        return []


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


def geocode(place, lat0, lon0, min_drop=0):
    """依序試完整地址、去掉第一段（鄉鎮）、再去掉一段；要求結果含省名且在 800 km 內。min_drop=1 從縣層級開始（鄉鎮的 Wikidata 項目沒有座標時）"""
    parts = [p.strip() for p in place.split(',') if p.strip()]
    if len(parts) < 2:
        return None, 'too short'
    prov = parts[-2] if parts[-1].lower() in ('china', 'india', 'spain', 'italy', 'japan', 'germany', 'vietnam', 'romania', 'kazakhstan', 'ukraine', 'norway', 'poland', 'uruguay', 'netherlands', 'czech republic', 'czechia', 'morocco', 'united states', 'oman', 'colombia') else parts[-1]
    prov_n = norm(re.sub(r'\b(province|state|autonomous region|special administrative region|municipality)\b', '', prov, flags=re.I))
    for drop in range(min_drop, max(min_drop + 1, len(parts) - 2)):
        q = ', '.join(parts[drop:])
        for r in nominatim(q):
            if r.get('type') not in OK_TYPES and r.get('category') not in ('boundary', 'place'):
                continue
            dn = norm(r.get('display_name', ''))
            addr = r.get('address', {})
            addr_n = norm(' '.join(str(v) for v in addr.values()))
            if prov_n and prov_n not in dn and prov_n not in addr_n:
                continue
            la, lo = float(r['lat']), float(r['lon'])
            if km(lat0, lon0, la, lo) > MAX_KM:
                continue
            wd = (r.get('extratags') or {}).get('wikidata')
            if not wd:
                continue
            level = 'township' if drop == 0 and len(parts) >= 4 else ('county' if len(parts) - drop >= 3 else 'city')
            return dict(wikidata=wd, query=q, level=level, _lat=la, _lon=lo), None
    return None, 'no acceptable result'


WD_API = 'https://www.wikidata.org/w/api.php'


def wikidata_coords(ids):
    """Wikidata 項目的座標（P625）與中英文標籤，每次 50 筆 · coordinates and labels of Wikidata items, 50 per call"""
    out = {}
    ids = sorted(set(ids))
    out['_failed'] = set()
    for i in range(0, len(ids), 50):
        url = WD_API + '?' + urllib.parse.urlencode({'action': 'wbgetentities', 'ids': '|'.join(ids[i:i + 50]), 'props': 'claims|labels',
                                                     'languages': 'zh|zh-hant|zh-hans|en', 'format': 'json'})
        t = get(url, retries=5, ua=WD_UA)
        if t.startswith('ERR'):
            out['_failed'].update(ids[i:i + 50])
            continue
        for q, e in json.loads(t).get('entities', {}).items():
            cl = e.get('claims', {}).get('P625')
            if not cl:
                continue
            v = cl[0]['mainsnak'].get('datavalue', {}).get('value', {})
            if 'latitude' not in v:
                continue
            lab = e.get('labels', {})
            out[q] = dict(lat=round(v['latitude'], 4), lon=round(v['longitude'], 4),
                          label_zh=(lab.get('zh-hant') or lab.get('zh') or lab.get('zh-hans') or {}).get('value', ''),
                          label_en=(lab.get('en') or {}).get('value', ''))
        time.sleep(3)
    return out


def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    CACHE.mkdir(parents=True, exist_ok=True)
    f = json.loads(src.read_text(encoding='utf-8'))
    cols = f['meta']['cols']
    rows = [dict(zip(cols, r)) for r in f['rows']]
    todo = [r for r in rows if r['st'] == 0 and not r['end'] and (r['flags'] & 4) and r['src'] == 2]
    prev = json.loads(out.read_text(encoding='utf-8')) if out.exists() else {'located': [], 'skipped': []}
    prev['skipped'] = [x for x in prev['skipped'] if not x['why'].startswith(('Wikidata fetch failed', 'Wikidata item has no coordinate'))]   # 重跑時再試這些
    done = {(x['iso'], x['name']) for x in prev['located']} | {(x['iso'], x['name']) for x in prev['skipped']}
    located, skipped = prev['located'], prev['skipped']
    cache_place = {}
    placeholder = {(r['iso'], r['name']): (r['lat'], r['lon']) for r in todo}
    for i, r in enumerate(todo):
        if (r['iso'], r['name']) in done:
            continue
        base = re.sub(r' · .*$', '', r['name'])
        place, page, err = gem_location(base)
        if not place:
            skipped.append(dict(name=r['name'], iso=r['iso'], gem_url=page, why=err or 'no location'))
        else:
            if place in cache_place:
                g, why = cache_place[place]
            else:
                g, why = geocode(place, r['lat'], r['lon'])
                cache_place[place] = (g, why)
            if g:
                located.append(dict(name=r['name'], iso=r['iso'], place=place, gem_url=page, **g))
            else:
                skipped.append(dict(name=r['name'], iso=r['iso'], place=place, gem_url=page, why=why))
        if (i + 1) % 25 == 0:
            print(time.strftime('%H:%M:%S'), end=' ')
            out.write_text(json.dumps({'meta': META, 'located': located, 'skipped': skipped}, ensure_ascii=False, indent=0), encoding='utf-8')
            print(i + 1, '/', len(todo), 'located', len(located), 'skipped', len(skipped), flush=True)
    # 第二階段：以 Wikidata 的座標取代查詢用的 OSM 座標；Wikidata 沒有座標的改列 skipped（OSM 座標不寫出）
    need = [x for x in located if 'lat' not in x]
    wd = wikidata_coords([x['wikidata'] for x in need])
    keep = []
    for x in located:
        if 'lat' in x:
            keep.append(x); continue
        w = wd.get(x['wikidata'])
        la, lo = x.pop('_lat', None), x.pop('_lon', None)
        if w and la is not None and km(la, lo, w['lat'], w['lon']) <= 50:
            x.update(w); keep.append(x)
        else:
            skipped.append(dict(name=x['name'], iso=x['iso'], place=x['place'], gem_url=x['gem_url'],
                                why='Wikidata fetch failed' if x['wikidata'] in wd['_failed'] else ('Wikidata item has no coordinate' if not w else 'Wikidata and OSM centres differ by more than 50 km')))
    located = keep
    # 第三階段：鄉鎮的 Wikidata 項目沒有座標的，退一級用縣（區）中心
    retry = [x for x in skipped if x['why'] == 'Wikidata item has no coordinate' and x.get('place')]
    skipped = [x for x in skipped if not (x['why'] == 'Wikidata item has no coordinate' and x.get('place'))]
    got = {}
    for x in retry:
        if x['place'] not in got:
            got[x['place']] = geocode(x['place'], *placeholder[(x['iso'], x['name'])], min_drop=1)
    wd = wikidata_coords([g['wikidata'] for g, _ in got.values() if g])
    for x in retry:
        g, why = got[x['place']]
        w = wd.get(g['wikidata']) if g else None
        if g and w and km(g['_lat'], g['_lon'], w['lat'], w['lon']) <= 50:
            located.append(dict(name=x['name'], iso=x['iso'], place=x['place'], gem_url=x['gem_url'], wikidata=g['wikidata'], query=g['query'], level=g['level'], **w))
        else:
            x['why'] = 'Wikidata fetch failed' if g and g['wikidata'] in wd['_failed'] else ('Wikidata item has no coordinate (township and county)' if not g or not w else 'Wikidata and OSM centres differ by more than 50 km')
            skipped.append(x)
    out.write_text(json.dumps({'meta': META, 'located': located, 'skipped': skipped}, ensure_ascii=False, indent=0), encoding='utf-8')
    print('done', len(todo), 'located', len(located), 'skipped', len(skipped))


META = {
    'source': 'Location text of Global Energy Monitor project pages (gem.wiki, CC BY 4.0); coordinates and labels of the named township/county/city from Wikidata (CC0), found through OpenStreetMap Nominatim (used only as a lookup index; no OSM data is included)',
    'note': 'Positions are township, county or city centres, not the farms themselves; the site keeps the approximate flag. Built by tools/fetch_gem_locations.py',
}

if __name__ == '__main__':
    main()
