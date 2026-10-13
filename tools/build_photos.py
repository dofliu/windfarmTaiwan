#!/usr/bin/env python3
"""風場卡片的照片 · Verified photos for the globe's cards → data/global/photos.json

  python3 tools/build_photos.py

照片清單在 tools/farm_photos.py（人工逐張看過，見那個檔的說明）。這支程式向 Wikimedia Commons 查每張照片的縮圖網址、作者與授權，
並檢查：照片存在、授權是 CC0／公有領域／CC BY／CC BY-SA／Attribution（只要求標示來源）、照片確實在表上寫的那個 Commons 分類裡、風場名稱與 wind_farms.json 完全一致、
里程碑名稱與 wind_global.json 一致、事件代碼在 events.json 裡。任何一項不符就中止。
照片不下載進 repo，網頁直接載入 Commons 的縮圖（離線時不顯示），卡片寫出作者、授權並連到 Commons 的檔案頁。

The photo list lives in tools/farm_photos.py (each photo looked at by hand). This script asks Wikimedia Commons for each file's
thumbnail URL, author and licence, and stops unless the file exists, is CC0 / public domain / CC BY / CC BY-SA / Attribution, sits in the
Commons category the table names, and the farm, milestone or event matches the site's data exactly. Photos are not copied into
the repo: the page loads the Commons thumbnail (hidden offline) and the card credits the author and licence with a link to the file page.
"""
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from farm_photos import EVENTS, FARMS, MILESTONES   # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'windfarmTaiwan/photos (github.com/dofliu/windfarmTaiwan)'}
WIDTH = 500                                           # Wikimedia 的標準縮圖寬度之一（卡片最寬約 360 px，高解析螢幕夠用）
# 自由授權：CC0、公有領域、CC BY／BY-SA，以及 Commons 的 {{Attribution}}（只要求標示來源；台灣政府開放資料、台電網站照片多用這個）
FREE = re.compile(r'^(CC0|Public domain|PD\b|CC BY(-SA)? \d(\.\d)?|Attribution$)', re.I)


def api(**params):
    params.update(format='json', formatversion='2')
    url = API + '?' + urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 2:
                raise
            time.sleep(5 * (attempt + 1))


PAGE = 'https://commons.wikimedia.org/wiki/'


def lookup_html(files):
    """API 被限流（429）時的替代：讀每個檔案頁的 HTML，取授權（licensetpl）、作者（fileinfotpl_aut）、分類與原圖尺寸，縮圖網址依 Commons 的路徑規則組出
    · fallback when the API answers 429: parse each file page (licence template spans, author cell, categories, original size) and build the thumbnail URL"""
    info = {}
    for f in files:
        url = PAGE + urllib.parse.quote(f.replace(' ', '_'))
        try:
            t = html.unescape(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read().decode('utf-8', 'replace'))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                info[f] = {'missing': True}
                time.sleep(3)
                continue
            raise
        full = re.search(r'class="fullImageLink"[^>]*>\s*<a href="(https://upload\.wikimedia\.org/wikipedia/commons/([0-9a-f])/([0-9a-f]{2})/[^"]+)"', t)
        size = re.search(r'(\d[\d,]*)\s*×\s*(\d[\d,]*) pixels', t)
        lic = re.search(r'class="licensetpl_short"[^>]*>(.*?)</span>', t, re.S)
        licurl = re.search(r'class="licensetpl_link"[^>]*>(.*?)</span>', t, re.S)
        aut = re.search(r'id="fileinfotpl_aut"[^>]*>.*?</td>\s*<td[^>]*>(.*?)</td>', t, re.S)
        catblock = re.search(r'id="mw-normal-catlinks".*?</div>', t, re.S)
        cats = re.findall(r'title="(Category:[^"]+)"', catblock.group(0)) if catblock else []
        if not full or not size:
            info[f] = {'missing': True}
            time.sleep(3)
            continue
        w, h = int(size.group(1).replace(',', '')), int(size.group(2).replace(',', ''))
        tw = min(WIDTH, w)
        name = full.group(1).split('?')[0].rsplit('/', 1)[1]
        thumb = f'https://thumb.wikimedia.org/wikipedia/commons/thumb/{full.group(2)}/{full.group(3)}/{name}/{tw}px-{name}' + ('.png' if name.lower().endswith('.svg') else '')   # 與 API 回的 thumburl 同一種網址
        meta = {'LicenseShortName': {'value': lic.group(1) if lic else ''}, 'LicenseUrl': {'value': licurl.group(1) if licurl else ''},
                'Artist': {'value': aut.group(1) if aut else ''}}
        info[f] = {'imageinfo': [{'thumburl': thumb, 'descriptionurl': url, 'extmetadata': meta, 'thumbwidth': tw, 'thumbheight': round(h * tw / w)}],
                   'categories': [{'title': c} for c in cats]}
        time.sleep(3)
    return info


def text(v):
    """extmetadata 的值是 HTML：去標籤、合併空白"""
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', v or ''))).strip()


def lookup(files):
    info = {}
    for i in range(0, len(files), 20):
        r = api(action='query', titles='|'.join(files[i:i + 20]), prop='imageinfo|categories', iiprop='url|size|extmetadata',
                iiurlwidth=WIDTH, iiextmetadatafilter='Artist|LicenseShortName|LicenseUrl|Credit', cllimit='max')
        norm = {n['to']: n['from'] for n in r['query'].get('normalized', [])}
        for p in r['query']['pages']:
            info[norm.get(p['title'], p['title'])] = p
        time.sleep(1)
    return info


def main():
    errors = []
    farms = json.loads((ROOT / 'data/global/wind_farms.json').read_text(encoding='utf-8'))['rows']
    names = {(r[2], r[0]) for r in farms}
    ms = {m['name'] for m in json.loads((ROOT / 'data/global/wind_global.json').read_text(encoding='utf-8'))['milestones']}
    ev = {e['id'] for e in json.loads((ROOT / 'data/global/events.json').read_text(encoding='utf-8'))['events']}
    rows = [('farms', f'{iso}|{name}', f, c) for iso, name, f, c, _ in FARMS] + \
           [('ms', name, f, c) for name, f, c, _ in MILESTONES] + [('events', eid, f, c) for eid, f, c, _ in EVENTS]
    for iso, name, *_ in FARMS:
        if (iso, name) not in names:
            errors.append(f'farm not in wind_farms.json: {iso} | {name}')
    errors += [f'milestone not in wind_global.json: {n}' for n, *_ in MILESTONES if n not in ms]
    errors += [f'event not in events.json: {e}' for e, *_ in EVENTS if e not in ev]
    seen = {}
    for kind, key, *_ in rows:
        if (kind, key) in seen:
            errors.append(f'listed twice: {kind} {key}')
        seen[(kind, key)] = 1
    files = sorted({f for *_, f, _ in rows})
    try:
        info = lookup(files)
    except urllib.error.HTTPError as e:
        if e.code != 429:
            raise
        print('Commons API rate-limited (429): reading the file pages instead', file=sys.stderr)
        info = lookup_html(files)
    out = {'farms': {}, 'ms': {}, 'events': {}}
    for kind, key, f, cat in rows:
        p = info.get(f)
        if not p or p.get('missing') or not p.get('imageinfo'):
            errors.append(f'{key}: {f} not found on Commons')
            continue
        ii = p['imageinfo'][0]
        meta = {k: text(v.get('value')) for k, v in (ii.get('extmetadata') or {}).items()}
        lic = meta.get('LicenseShortName', '')
        if not FREE.match(lic):
            errors.append(f'{key}: {f} licence "{lic}" is not CC0 / PD / CC BY / CC BY-SA')
        cats = {c['title'] for c in p.get('categories', [])}
        if cat not in cats:
            errors.append(f'{key}: {f} is not in {cat}')
        by = meta.get('Artist') or meta.get('Credit') or ''
        out[kind][key] = {'src': ii['thumburl'].split('?')[0], 'page': ii['descriptionurl'], 'by': by[:120], 'lic': lic,
                          'licUrl': meta.get('LicenseUrl') or None, 'w': ii.get('thumbwidth'), 'h': ii.get('thumbheight')}
    if errors:
        sys.exit('photos: ' + str(len(errors)) + ' problem(s)\n  ' + '\n  '.join(errors))
    out = {'meta': {'source': 'Wikimedia Commons (each file under its own free licence; author and licence listed per photo)',
                    'built': time.strftime('%Y-%m-%d'), 'tool': 'tools/build_photos.py'}, **out}
    path = ROOT / 'data/global/photos.json'
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(path, {k: len(v) for k, v in out.items() if k != 'meta'})


if __name__ == '__main__':
    main()
