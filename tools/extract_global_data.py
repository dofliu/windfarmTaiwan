#!/usr/bin/env python3
"""把「全球風電發展觀察地圖」(wind-history-map v3) 單檔 HTML 內嵌的 WIND_DATA
拆成網站讀取的三個靜態 JSON，並套用少量有記錄的台灣資料修正。

用法：
    python tools/extract_global_data.py <wind-history-map.html> data/global

輸出：
    data/global/wind_global.json   國家逐年容量、全球總量、里程碑、來源與註記（首頁/知識頁/地球儀共用，約 70 KB）
    data/global/sources/farms_attachment.json  附件的精選風場（tools/build_farms.py 會與 GEM 資料合併成 wind_farms.json）

所有修正都會寫進 wind_global.json 的 meta.edits 與 notes，前端「資料來源」會一併列出。
附件更新版本時重跑本程式即可；若上游已修正同一問題，對應的修正會自動不生效（條件不成立）。"""
import json, re, sys
from pathlib import Path

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
html = SRC.read_text(encoding="utf-8")
m = re.search(r"^const WIND_DATA = (\{.*\});\s*$", html, re.M)
D = json.loads(m.group(1))
Y = D["years"]
iy = {y: i for i, y in enumerate(Y)}

# ---------------------------------------------------------------- edits
EDITS = []
twn = next(c for c in D["countries"] if c["iso"] == "TWN")
# 1) Taiwan onshore/offshore split 2022-2025.
#    Upstream derives onshore = IRENA total - WFO fully-commissioned offshore, so Taiwan's
#    partially commissioned offshore farms (Changhua 1&2a, Yunlin, Changfang, Hai Long ...)
#    landed in "onshore" (e.g. 2,064 MW onshore in 2023). Anchor onshore to the 2021 value
#    plus the onshore farms listed in this dataset (2023 +6.9, 2024 +50.4, 2025 +33.6 MW);
#    that gives 914 MW for 2024, matching the "~900+ MW onshore end-2024" farm note.
#    Offshore = IRENA total - onshore (installed incl. partially commissioned, GWEC-style).
new_on = {2022: 857, 2023: 864, 2024: 914, 2025: 948}
split_fixed = []
for y, on in new_on.items():
    i = iy[y]
    tot = twn["on"][i] + twn["off"][i]
    old = (twn["on"][i], twn["off"][i])
    if old[0] <= on * 1.2 or tot < on:     # upstream already plausible (or unexpected total): leave it alone
        continue
    twn["on"][i] = on
    twn["off"][i] = tot - on
    split_fixed.append(y)
    EDITS.append(f"TWN {y}: onshore/offshore {old[0]}/{old[1]} -> {on}/{tot-on} MW (total {tot} unchanged)")
if split_fixed:
    D["notes"]["offshore"].append(
        f"[windfarmTaiwan edit] TWN {split_fixed[0]}-{split_fixed[-1]}: upstream onshore = IRENA total - WFO "
        "fully-commissioned offshore put Taiwan's partially commissioned offshore farms into 'onshore' (e.g. 2,064 MW "
        "onshore in 2023, while Taiwan's onshore fleet is ~0.9 GW). Onshore is re-anchored to the 2021 value plus the "
        "onshore farms listed in this dataset (" + "/".join(str(new_on[y]) for y in split_fixed) + " MW; 914 MW for 2024 "
        "matches the ~900+ MW end-2024 reference in the farm notes) and offshore = IRENA total - onshore ("
        + "/".join(f"{twn['off'][iy[y]]:,}" for y in split_fixed) + " MW), i.e. installed incl. partially commissioned "
        "capacity, like the CHN/VNM series. Country totals and the world total are unchanged.")

# 2) Formosa 1 phase 1: the two 4 MW demo turbines entered commercial operation in April 2017
f1_fixed = False
for f in D["farms"]:
    if f["iso"] == "TWN" and f["name"] == "Formosa 1 Phase 1" and f["year"] == 2016:
        f["year"] = 2017
        f1_fixed = True
        EDITS.append("Farm 'Formosa 1 Phase 1': year 2016 -> 2017 (demo turbines commercial Apr 2017)")
if f1_fixed:
  D["notes"]["farms"].append(
    "[windfarmTaiwan edit] Formosa 1 Phase 1 year set to 2017 (the two 4 MW demonstration turbines entered "
    "commercial operation in April 2017), consistent with the TWN offshore series and the Formosa 1 milestone.")

# 3) Formosa 2 milestone: first power 2022, all 47 turbines commercial Sep 2023
f2_fixed = False
for ms in D["milestones"]:
    if ms["iso"] == "TWN" and ms["name"].startswith("Formosa 2") and ms["year"] < 2023:
        f2_fixed = True
        ms["year"] = 2023
        ms["en"] = ("Taiwan's first large-scale (376 MW) offshore wind farm to be fully commissioned: first power "
                    "in July 2022, all 47 turbines in commercial operation in September 2023, marking the step "
                    "from pilot projects to utility-scale build-out.")
        ms["zh"] = ("台灣第一座全數完工商轉的大型（376 MW）離岸風場：2022 年 7 月首度併網、2023 年 9 月 47 部機組"
                    "全數商轉，標誌台灣從示範計畫邁向公用事業規模建置。")
        EDITS.append("Milestone 'Formosa 2': year 2021 -> 2023, text aligned with first power 2022/07, COD 2023/09")
    if ms["iso"] == "TWN" and ms["name"].startswith("Greater Changhua 1"):
        ms["en"] = ms["en"].replace("is Taiwan's largest offshore wind farm to date",
                                    "was Taiwan's largest offshore wind farm when completed")
        ms["zh"] = ms["zh"].replace("是台灣迄今最大的離岸風場", "完工時為台灣最大的離岸風場")
if f2_fixed:
  D["notes"]["farms"].append(
    "[windfarmTaiwan edit] Formosa 2 milestone year set to 2023 (first power July 2022, all 47 turbines commercial "
    "September 2023, per the developers' releases); Greater Changhua 1&2a milestone reworded to 'largest when completed'.")

D["milestones"].sort(key=lambda ms: ms["year"])  # stable: keeps upstream order within a year

# keep worldTotal consistent (country totals unchanged, so this is a no-op check)
for i in range(len(Y)):
    s = sum(c["on"][i] + c["off"][i] for c in D["countries"])
    assert abs(s - D["worldTotal"][i]) < 1e-6, (Y[i], s, D["worldTotal"][i])

# ---------------------------------------------------------------- write
OUT.mkdir(parents=True, exist_ok=True)
meta = {
    "title": "Global wind power 1980-2025 (country capacity, milestones, farms)",
    "based_on": "wind-history-map v3 dataset (see sources / notes)",
    "units": "MW, year-end cumulative installed capacity",
    "edits": EDITS,
}
dump = lambda obj, p: p.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
dump({"meta": meta, "years": Y, "countries": D["countries"], "worldTotal": D["worldTotal"],
      "milestones": D["milestones"], "sources": D["sources"], "notes": D["notes"]}, OUT / "wind_global.json")
(OUT / "sources").mkdir(exist_ok=True)
dump({"farms": D["farms"]}, OUT / "sources" / "farms_attachment.json")   # 精選風場原始檔；tools/build_farms.py 再與 GEM 合併成 wind_farms.json
# 國界改由 tools/build_borders.py 以 Natural Earth 1:50m 重建（附件的國界缺澳洲本土），這裡不再輸出
for e in EDITS:
    print("edit:", e)
for p in sorted(OUT.glob("*.json")):
    print(p.name, p.stat().st_size)
