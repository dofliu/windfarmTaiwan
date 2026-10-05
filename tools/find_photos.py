#!/usr/bin/env python3
"""找風場照片的候選 · List candidate Wikimedia Commons photos for a farm

  python3 tools/find_photos.py "Horns Rev"                 # 搜尋 Commons 分類，列出分類與其中的照片
  python3 tools/find_photos.py "Category:Horns Rev 1"      # 直接列出某個分類（含一層子分類）的照片
  python3 tools/find_photos.py "Horns Rev" --save DIR      # 另外把縮圖存到 DIR，方便逐張目視確認

只是幫忙找候選：要寫進 tools/farm_photos.py 的照片一定要逐張看過（看得到這座風場的風機，不是地圖、標誌、典禮或一般風景），
並確認出自這座風場自己的 Commons 分類。授權與作者由 tools/build_photos.py 建置時向 Commons 查詢。

Only finds candidates. Every photo written into tools/farm_photos.py must be looked at (it shows this farm's turbines, not a
map, logo, ceremony or general scenery) and come from the farm's own Commons category. Licences and authors are read by
tools/build_photos.py at build time.
"""
import json
import sys
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'windfarmTaiwan/photos (github.com/dofliu/windfarmTaiwan)'}


def get(url):
    for attempt in range(6):                          # Commons 限流（429）：等一下再試
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 5:
                raise
            time.sleep(5 * (attempt + 1))


def api(**params):
    params.update(format='json', formatversion='2')
    return json.loads(get(API + '?' + urllib.parse.urlencode(params)))


def categories(q):
    r = api(action='query', list='search', srsearch=q, srnamespace=14, srlimit=10)
    return [x['title'] for x in r['query']['search']]


def files(cat, depth=1):
    out, subs = [], []
    cont = {}
    while True:
        r = api(action='query', list='categorymembers', cmtitle=cat, cmtype='file|subcat', cmlimit=200, **cont)
        for m in r['query']['categorymembers']:
            (out if m['ns'] == 6 else subs).append(m['title'])
        if 'continue' not in r:
            break
        cont = {'cmcontinue': r['continue']['cmcontinue']}
    if depth > 0:
        for s in subs[:15]:
            out += files(s, depth - 1)
    return out


def thumbs(titles, width=330):              # Wikimedia 的標準縮圖寬度之一
    res = {}
    for i in range(0, len(titles), 20):
        r = api(action='query', titles='|'.join(titles[i:i + 20]), prop='imageinfo', iiprop='url|size|mime', iiurlwidth=width)
        for p in r['query']['pages']:
            ii = (p.get('imageinfo') or [{}])[0]
            if ii.get('mime', '').startswith('image/') and ii.get('mime') != 'image/svg+xml':
                res[p['title']] = (ii.get('thumburl'), ii.get('width'), ii.get('height'))
    return res


def main(q, save=None):
    cats = [q] if q.startswith('Category:') else categories(q)
    if not q.startswith('Category:'):
        print('categories:', *cats, sep='\n  ')
        cats = cats[:2]
    for c in cats:
        fs = list(dict.fromkeys(files(c)))
        print(f'\n{c}: {len(fs)} files')
        for t, (u, w, h) in thumbs(fs[:80]).items():
            print(f'  {t}  ({w}x{h})')
            if save and u:
                d = Path(save)
                d.mkdir(parents=True, exist_ok=True)
                name = ''.join(ch if ch.isalnum() else '_' for ch in t[5:])[:80] + '.jpg'
                (d / name).write_bytes(get(u))
                time.sleep(1)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    a = sys.argv[1:]
    main(a[0], a[a.index('--save') + 1] if '--save' in a else None)
