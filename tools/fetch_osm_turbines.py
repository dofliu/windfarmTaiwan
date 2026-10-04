#!/usr/bin/env python3
"""從 OpenStreetMap 下載風機與風場範圍 · Download wind turbines and wind-farm areas from OpenStreetMap

  python3 tools/fetch_osm_turbines.py osm_wind/          # 依 10°×10° 分區查 Overpass API（只查本站有美國以外營運中風場的格子），每區存一個 JSON（已下載的區跳過，同時查四區）

查詢：風機＝power=generator＋generator:source=wind 的節點；風場範圍＝power=plant＋plant:source=wind 的 way／relation（含邊界幾何）。
下載的原始檔不進 git；tools/build_turbines_osm.py 讀這個資料夾，把風機對到本站的風場。OpenStreetMap 資料是 ODbL 授權：
由它衍生的 data/global/turbines_osm.json 也以 ODbL 分享，並標示「© OpenStreetMap 貢獻者」。
Overpass 公用伺服器常忙碌（504、連線中斷）：每區重試，依序換伺服器。

Queries: turbines = nodes tagged power=generator + generator:source=wind; farm areas = ways/relations tagged power=plant +
plant:source=wind (with geometry). One JSON per 10°×10° tile, only tiles holding an operating non-US farm of the site (tiles already downloaded are skipped, four at a time); the raw files stay out of
git. tools/build_turbines_osm.py reads the folder. OpenStreetMap data is ODbL: the derived data/global/turbines_osm.json is shared
under the ODbL with "© OpenStreetMap contributors". Public Overpass servers are often busy, so each tile is retried across servers.
"""
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
import urllib.parse
import urllib.request
from pathlib import Path

SERVERS = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter',
           'https://overpass.kumi.systems/api/interpreter']
STEP = 10
WORKERS = 4      # 同時查幾區（大區一次要 1–2 分鐘）· tiles fetched at once (a dense tile takes 1–2 minutes)
TAGS = ['generator:output:electricity', 'manufacturer', 'model', 'height:hub', 'rotor:diameter']
Q_TURB = """[out:csv(::id,::lat,::lon,""" + ','.join('"%s"' % t for t in TAGS) + """;false;"\t")][timeout:600];
node["power"="generator"]["generator:source"="wind"]({s},{w},{n},{e});
out;"""
Q_PLANT = """[out:json][timeout:600];
(nwr["power"="plant"]["plant:source"="wind"]({s},{w},{n},{e}););
out tags geom;"""


def fetch(q):
    last = None
    for attempt in range(8):
        url = SERVERS[0] if attempt < 4 else SERVERS[attempt % len(SERVERS)]
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'windfarmTaiwan/turbines (github.com/dofliu/windfarmTaiwan)'})
            with urllib.request.urlopen(req, timeout=700) as r:
                return r.read().decode('utf-8')
        except Exception as e:  # noqa: BLE001 - 公用伺服器的各種錯誤都重試
            last = e
            time.sleep(15 * (attempt + 1))
    raise RuntimeError(f'Overpass failed: {last}')


def main(out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    # 只查本站有營運中風場（美國以外）的格子
    fj = json.loads((Path(__file__).resolve().parent.parent / 'data/global/wind_farms.json').read_text(encoding='utf-8'))
    cols = fj['meta']['cols']
    tiles = sorted({(int(r[cols.index('lat')] // STEP) * STEP, int(r[cols.index('lon')] // STEP) * STEP) for r in fj['rows']
                    if r[cols.index('st')] == 0 and r[cols.index('iso')] != 'USA'})
    print(len(tiles), 'tiles', flush=True)

    def one(job):
        try:
            get(*job)
        except (RuntimeError, ValueError) as e:                          # 這一區先跳過，重跑時再補 · skip; a re-run fills it in
            print(f'FAILED {job[1]}: {e}', flush=True)

    def get(i, tile):
        s, w = tile
        f = out / f'tile_{s}_{w}.json'
        if f.exists():
            return
        box = dict(s=s, w=w, n=s + STEP, e=w + STEP)
        el = []
        for line in fetch(Q_TURB.format(**box)).splitlines():          # 風機：精簡的 CSV（id、緯度、經度、幾個規格欄）
            c = line.split('\t')
            if len(c) >= 3 and c[0].isdigit():
                el.append({'type': 'node', 'id': int(c[0]), 'lat': float(c[1]), 'lon': float(c[2]),
                           'tags': dict({'power': 'generator'}, **{t: v for t, v in zip(TAGS, c[3:]) if v})})
        d = json.loads(fetch(Q_PLANT.format(**box)))                     # 風場範圍：含邊界幾何
        el += d.get('elements', [])
        f.write_text(json.dumps({'osm_base': d.get('osm3s', {}).get('timestamp_osm_base'), 'elements': el}, ensure_ascii=False), encoding='utf-8')
        print(f'{i + 1}/{len(tiles)} {s},{w}: {len(el)} elements', flush=True)

    with ThreadPoolExecutor(WORKERS) as ex:
        list(ex.map(one, enumerate(tiles)))
    missing = [t for t in tiles if not (out / f'tile_{t[0]}_{t[1]}.json').exists()]
    print(f'{len(tiles) - len(missing)}/{len(tiles)} tiles done' + (f'; run again for {len(missing)} failed' if missing else ''), flush=True)
    return not missing


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sys.exit(0 if main(sys.argv[1]) else 1)
