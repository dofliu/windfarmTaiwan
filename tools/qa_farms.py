#!/usr/bin/env python3
"""風場座標健檢：列出不在自己國界內（陸域 > 40 km、離岸 > 400 km）的風場。

    python tools/qa_farms.py [data/global/wind_farms.json] [data/global/world_borders.json]

每次重建 wind_farms.json 後跑一次。常見的「合理例外」：
  · 國界 1:50m 不含的小島（澎湖、嵊泗等）
  · 屬地與本國分開畫的地區（波多黎各的風場在 GPPD 標為 USA）
  · 爭議領土依 Natural Earth 的畫法（例：西撒哈拉的風場落在摩洛哥多邊形內）
其餘多半是來源座標錯誤，可在 tools/build_farms.py 的 COORD_FIX / DROP_CUR 修正後重建。
"""
import json, math, sys
from collections import defaultdict
from pathlib import Path

FARMS = Path(sys.argv[1] if len(sys.argv) > 1 else 'data/global/wind_farms.json')
BORDERS = Path(sys.argv[2] if len(sys.argv) > 2 else 'data/global/world_borders.json')
B = json.loads(BORDERS.read_text(encoding='utf-8'))
J = json.loads(FARMS.read_text(encoding='utf-8'))

rings = defaultdict(list)
for r, iso in zip(B['borders'], B['ringIso']):
    if iso:
        rings[iso].append(r)


def inside(r, lon, lat):
    ins, n = False, len(r) // 2
    j = n - 1
    for i in range(n):
        xi, yi, xj, yj = r[2 * i], r[2 * i + 1], r[2 * j], r[2 * j + 1]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            ins = not ins
        j = i
    return ins


def km(a, b, c, d):
    return 6371 * math.hypot(math.radians(d - b) * math.cos(math.radians((a + c) / 2)), math.radians(c - a))


def nearest(iso, lon, lat):
    return min(km(lat, lon, r[i + 1], r[i]) for r in rings[iso] for i in range(0, len(r), 2))


def country_at(lon, lat):
    return next((iso for iso, rs in rings.items() for r in rs if inside(r, lon, lat)), None)


bad, no_border = [], set()
for row in J['rows']:
    name, zh, iso, lat, lon, mw, year, tp, st = row[:9]
    if iso not in rings:
        no_border.add(iso)
        continue
    if any(inside(r, lon, lat) for r in rings[iso]):
        continue
    d = nearest(iso, lon, lat)
    if d > (40 if tp == 0 else 400):
        bad.append((round(d), iso, country_at(lon, lat) or '-', name, lat, lon, mw, ['onshore', 'offshore', 'floating'][tp], st, row[13]))

print('ISO codes without a border polygon:', ', '.join(sorted(no_border)) or '-')
print(len(bad), 'farms outside their country (km from border, iso, located in, name, lat, lon, MW, type, status, src):')
for b in sorted(bad, reverse=True):
    print(' ', b)
