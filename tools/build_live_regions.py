#!/usr/bin/env python3
"""地球儀「即時資料」圖層用的州界：只涵蓋部分地區的國家，只塗有即時資料的州或省 → data/global/live_regions.json。

來源是 Natural Earth 1:50m Admin-1 states and provinces（公有領域），與國界（tools/build_borders.py）同一個比例尺：

    curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson
    python3 tools/build_live_regions.py ne_50m_admin_1_states_provinces.geojson data/global/live_regions.json

每個州或省附上涵蓋它的即時來源代碼（intl_realtime.json 的 grids／nat 鍵）；網站只塗來源此刻真的存在的州。
州界只是近似：電網範圍與州界不完全相同（ERCOT 約占德州用電的九成，CAISO 約供應加州八成用電），網站的說明寫明這一點。
輸出格式與國界相同：只取外環，座標取到小數 2 位、相鄰點至少相隔 0.03 度。
"""
import json, sys
from pathlib import Path

# ISO 3166-2 → (即時來源代碼, 中文名, 英文名)
REGIONS = {
    "US-TX": ("ERCOT", "德州", "Texas"),
    "US-CA": ("CAISO", "加州", "California"),
    "CA-AB": ("AESO", "亞伯達", "Alberta"),
    "CA-ON": ("IESO", "安大略", "Ontario"),
    "AU-QLD": ("AEMO", "昆士蘭", "Queensland"),
    "AU-NSW": ("AEMO", "新南威爾斯", "New South Wales"),
    "AU-ACT": ("AEMO", "澳洲首都領地", "Australian Capital Territory"),
    "AU-VIC": ("AEMO", "維多利亞", "Victoria"),
    "AU-SA": ("AEMO", "南澳", "South Australia"),
    "AU-TAS": ("AEMO", "塔斯馬尼亞", "Tasmania"),
}
MIN_STEP = 0.03
URL = "https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-1-states-provinces/"

src, out = Path(sys.argv[1]), Path(sys.argv[2])
fc = json.loads(src.read_text(encoding="utf-8"))
regions, seen = [], set()
for f in fc["features"]:
    p = f["properties"]
    code = p.get("iso_3166_2")
    if code not in REGIONS:
        continue
    seen.add(code)
    key, zh, en = REGIONS[code]
    g = f["geometry"]
    polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    rings = []
    for poly in polys:
        ext, flat, last = poly[0], [], None
        n = len(ext)
        for k, (lon, lat) in enumerate(ext):
            pt = (round(lon, 2), round(lat, 2))
            if last is not None and k < n - 1 and abs(pt[0] - last[0]) + abs(pt[1] - last[1]) < MIN_STEP:
                continue
            if pt != last:
                flat += [pt[0], pt[1]]
                last = pt
        if len(flat) >= 8:
            rings.append(flat)
    regions.append({"id": code, "iso": p["adm0_a3"], "src": key, "zh": zh, "en": en, "rings": rings})
missing = set(REGIONS) - seen
if missing:
    sys.exit("找不到這些州或省（Natural Earth 改了代碼？）：" + ", ".join(sorted(missing)))
regions.sort(key=lambda r: r["id"])
meta = {"source": "Natural Earth 1:50m Admin-1 states and provinces", "url": URL, "licence": "public domain"}
out.write_text(json.dumps({"meta": meta, "regions": regions}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(out, len(regions), "regions", sum(len(r["rings"]) for r in regions), "rings", out.stat().st_size, "bytes")
