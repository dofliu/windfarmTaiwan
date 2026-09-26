#!/usr/bin/env python3
"""由 Natural Earth 1:50m Admin-0 國界（公有領域）產生 3D 地球儀用的國界環 data/global/world_borders.json。

    curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
    python tools/build_borders.py ne_50m_admin_0_countries.geojson data/global/world_borders.json

輸出格式：{"borders": [[lon,lat,lon,lat,...], ...], "ringIso": ["TWN", ...]}（只取外環，座標取到小數 2 位 ≈ 1 km）。
（原附件的國界檔缺少澳洲本土多邊形，改以此程式重建。）
克里米亞：Natural Earth 預設採「實際控制」視角劃入俄羅斯；本站依聯合國大會第 68/262 號決議，
並與風場資料（GEM 將克里米亞風場列於烏克蘭）一致，將該多邊形歸屬烏克蘭。
"""
import json, sys
from pathlib import Path

src, out = Path(sys.argv[1]), Path(sys.argv[2])
MIN_STEP = 0.03
CRIMEA = (32.3, 44.2, 36.8, 46.4)      # lon0, lat0, lon1, lat1：整個環落在此框內的 RUS 多邊形 → UKR
fc = json.loads(src.read_text(encoding="utf-8"))
rings, isos = [], []
for f in fc["features"]:
    p = f["properties"]
    iso = p.get("ISO_A3_EH") if p.get("ISO_A3_EH") not in (None, "-99") else p.get("ADM0_A3")
    g = f["geometry"]
    polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    for poly in polys:
        ext = poly[0]
        flat, last = [], None
        n = len(ext)
        for k, (lon, lat) in enumerate(ext):
            pt = (round(lon, 2), round(lat, 2))
            # 抽稀：與上一個保留點距離 < MIN_STEP 度就略過（首尾點一定保留）；1:50m 尺度下看不出差異
            if last is not None and k < n - 1 and abs(pt[0] - last[0]) + abs(pt[1] - last[1]) < MIN_STEP:
                continue
            if pt != last:
                flat += [pt[0], pt[1]]
                last = pt
        if len(flat) >= 8:
            xs, ys = flat[0::2], flat[1::2]
            if iso == "RUS" and min(xs) > CRIMEA[0] and max(xs) < CRIMEA[2] and min(ys) > CRIMEA[1] and max(ys) < CRIMEA[3]:
                iso = "UKR"
            rings.append(flat)
            isos.append(iso or "")
out.write_text(json.dumps({"borders": rings, "ringIso": isos}, separators=(",", ":")), encoding="utf-8")
print(out, len(rings), "rings", out.stat().st_size, "bytes")
