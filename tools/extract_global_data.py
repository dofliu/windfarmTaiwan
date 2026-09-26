#!/usr/bin/env python3
"""把「全球風能發展圖譜 v3｜台灣・日本稽核版」(global-wind-development-atlas-v3-tw-jp-audited.html)
單檔 HTML 內嵌的 WIND_DATA／GWPT／AUDIT_DATA 拆成網站讀取的靜態 JSON。

用法：
    python tools/extract_global_data.py <global-wind-development-atlas-v3-tw-jp-audited.html> data/global

v3 稽核版＝原「全球風電發展觀察地圖」(wind-history-map v3) 的資料，另以官方統計重建台灣與日本：
  · 台灣 2005–2025 陸域／離岸：經濟部能源署《2025 能源統計手冊》表 3-6（下方 TWN_OFFICIAL，已逐年核對原表）
  · 日本 2011–2025：日本風力發電協會 JWPA 年末累積導入量；洋上＝本格洋上＋セミ洋上（下方 JPN_JWPA，
    2019–2025 年總量已逐年核對 JWPA 公告）
  · 兩國風場逐場稽核：分批併網的大型離岸風場以「全場完工年」計入；2025 年底尚未全場商轉者改列興建中
兩個序列直接寫在本程式中，所以輸入原版 wind-history-map v3 也會得到相同的台灣／日本數字。

輸出：
    data/global/wind_global.json   國家逐年容量、全球總量、里程碑、來源與註記、GEM 2026-02 各國開發管線總量、
                                   台灣／日本稽核說明（首頁／知識頁／地球儀共用）
    data/global/sources/farms_attachment.json  精選風場（tools/build_farms.py 會與 GEM 等資料合併成 wind_farms.json）

所有修正都會寫進 wind_global.json 的 meta.edits 與 notes，前端「資料來源」會一併列出。"""
import json, re, sys
from pathlib import Path

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
html = SRC.read_text(encoding="utf-8")


def js_const(name):
    m = re.search(r"^const " + name + r" = (.*?);\s*$", html, re.M)
    return m.group(1) if m else None


D = json.loads(js_const("WIND_DATA"))
Y = D["years"]
iy = {y: i for i, y in enumerate(Y)}
EDITS = []

# ---------------------------------------------------------------- 官方國家序列
EA_URL = ("https://ea01.moeaea.gov.tw/a0303/02/attachments/handbook/2025/docs/3-06.%E5%86%8D%E7%94%9F%E8%83%BD%E6%BA%90"
          "%E7%99%BC%E9%9B%BB%E8%A3%9D%E7%BD%AE%E5%AE%B9%E9%87%8F(114).pdf")
# 經濟部能源署《2025 能源統計手冊》表 3-6 再生能源發電裝置容量：風力 陸域／離岸（MW）
TWN_OFFICIAL = {
    2005: (23.9, 0), 2006: (102.0, 0), 2007: (186.0, 0), 2008: (250.4, 0), 2009: (374.3, 0), 2010: (475.9, 0),
    2011: (522.7, 0), 2012: (571.0, 0), 2013: (614.2, 0), 2014: (637.2, 0), 2015: (646.7, 0), 2016: (682.1, 0),
    2017: (684.4, 8.0), 2018: (705.2, 8.0), 2019: (717.2, 128.0), 2020: (809.1, 128.0), 2021: (825.0, 269.2),
    2022: (836.2, 744.8), 2023: (914.2, 1763.2), 2024: (918.2, 2986.8), 2025: (930.3, 3586.9)}
# 2000–2004：官方表未涵蓋，採早期示範機組合計（麥寮 2.64 MW 2000、中屯 2.4 MW 2001、其後合計 8.5 MW）
TWN_EARLY = {2000: (2.6, 0), 2001: (5.0, 0), 2002: (8.5, 0), 2003: (8.5, 0), 2004: (8.5, 0)}
# JWPA 年末累積導入量（MW）：陸上／洋上（本格洋上＋セミ洋上）。總量 2019 3,923・2020 4,439・2021 4,581・
# 2022 4,802・2023 5,213.4・2024 5,840.4・2025 6,434.2 已與 JWPA 公告核對
JWPA_URL = "https://jwpa.jp/information/12660/"
JPN_JWPA = {
    2011: (2530.0, 25), 2012: (2588.0, 25), 2013: (2612.0, 50), 2014: (2742.0, 50), 2015: (2983.0, 53),
    2016: (3170.0, 60), 2017: (3327.0, 65), 2018: (3588.0, 65), 2019: (3857.4, 65.6), 2020: (4380.4, 58.6),
    2021: (4529.4, 51.6), 2022: (4667.0, 135.0), 2023: (5025.7, 187.7), 2024: (5552.8, 287.6), 2025: (6146.6, 287.6)}


def set_series(iso, table):
    c = next(c for c in D["countries"] if c["iso"] == iso)
    n = 0
    for y, (on, off) in table.items():
        i = iy[y]
        if abs(c["on"][i] - on) > 1e-6 or abs(c["off"][i] - off) > 1e-6:
            c["on"][i], c["off"][i] = on, off
            n += 1
    return n


set_series("TWN", TWN_EARLY)
set_series("TWN", TWN_OFFICIAL)
set_series("JPN", JPN_JWPA)
EDITS.append("TWN 2005–2025 onshore/offshore = MOEA Energy Administration, Energy Statistics Handbook 2025, Table 3-6 "
             "(official annual table; 2025: 930.3 / 3,586.9 MW). The original map derived onshore as IRENA total minus "
             "a differently scoped offshore series, which put 2,064 MW 'onshore' in 2023.")
EDITS.append("JPN 2011–2025 = JWPA year-end cumulative installed capacity (2025: 6,434.2 MW); offshore = JWPA full "
             "offshore + semi-offshore/port sites (2025: 253.4 + 34.2 MW). The original map used IRENA (2025: 6,249 MW).")

# ---------------------------------------------------------------- 風場：稽核狀態、中英註記
NOTE_ZH = {
    "Sakata Port semi-offshore": "依 JWPA，5 部 2 MW 風機已於 2023 年撤除。",
    "Kitakyushu Offshore Demonstration (NEDO/J-Power)": "2023 年起未列於 JWPA 年底本格洋上營運清單，視為已除役。",
    "Fukushima FORWARD floating demo": "7 MW 浮體於 2020 年撤除，其餘 2 MW 與 5 MW 兩部於 2021 年撤除。",
    "Ishikari Bay New Port": "JWPA 年底營運容量為 99.9 MW（併網上限）；其他資料常引用機組合計 112 MW。",
    "Goto City Offshore floating project": "JWPA 2025 年底統計未列為新營運的洋上案場（8 部 2.1 MW 浮體式，共 16.8 MW）。",
    "Kitakyushu Hibikinada": "JWPA 表示 2025 年沒有新的洋上風場開始運轉，這座 220 MW 風場不計入 2025 年底營運容量。",
    "Formosa 1 Phase 1": "8 MW 示範機組，自 2017 年商轉起計。",
    "Yunlin": "較早即已首度併網；640 MW 全場於 2025 年 1 月全數併網，因此自 2025 年起以全場容量計入。",
    "Greater Changhua 1 & 2a": "首度併網早於完工；全場容量自 2024 年完工啟用起計。",
    "Changfang & Xidao": "2024 年全場完工；先前的部分併網不回推為全場容量。",
    "Hai Long 2 & 3": "2025 年首度併網，但 2025 年底仍在完工前的測試與併網階段，不計為 1,044 MW 全場營運。",
    "Greater Changhua 2b & 4": "興建與併網測試中，2025 年底尚未全場商轉。",
    "Taipower Offshore Phase 2": "計畫網站 2026 年仍顯示持續施工，不計入 2025 年底全場營運容量。",
    "Taoyuan Luzhu": "原精選資料中的容量與商轉年份為估計值，尚待官方許可或專案資料核對。",
    "Choshi Offshore Demonstration (NEDO/TEPCO)": "2013 年起為 NEDO 實證機，2019 年 1 月轉為商業運轉（JWPA 以 2019 年計）。",
    "Akita Port": "2023 年 1 月商轉；JWPA 容量 54.6 MW。",
}
NOTE_EN_EXTRA = {
    "Choshi Offshore Demonstration (NEDO/TEPCO)": "NEDO demonstration turbine from 2013; commercial operation from January 2019 (JWPA counts it from 2019).",
    "Akita Port": "Commercial operation January 2023; JWPA capacity 54.6 MW.",
}
KEEP = ("name", "zh", "iso", "lat", "lon", "mw", "year", "type", "turbine", "owner", "end", "src", "status", "subtype")
farms = []
for f in D["farms"]:
    g = {k: f[k] for k in KEEP if f.get(k) is not None}
    if f.get("expectedYear"): g["expected"] = f["expectedYear"]
    if f.get("firstPowerYear"): g["fp"] = f["firstPowerYear"]
    if f.get("sourceUrl"): g["url"] = f["sourceUrl"]
    en = f.get("note") or NOTE_EN_EXTRA.get(f["name"])
    if en or f["name"] in NOTE_ZH:
        g["note"] = [NOTE_ZH.get(f["name"], ""), en or ""]
    farms.append(g)
# 苫前ウィンビラ：2023 年 10 月汰換（新苫前），原機組於 2023 年停止；新機組由 GEM 的 RP-1 階段補上
for g in farms:
    if g["iso"] == "JPN" and g["name"] == "Tomamae Winvilla" and not g.get("end"):
        g["end"] = 2023
        g["note"] = ["原機組於 2023 年 10 月汰換為新苫前風場（新機組另列）。",
                     "Repowered in October 2023 (Shin-Tomamae); the new turbines are listed separately."]
        EDITS.append("Farm 'Tomamae Winvilla' (JPN): end 2023 (repowered Oct 2023; GEM lists the repowered phase)")
n_st = sum(1 for g in farms if g.get("status") in ("construction", "retired", "unverified"))
if n_st:
    EDITS.append(f"TWN/JPN farm audit: {n_st} farms re-classified (construction / retired / unverified); partly "
                 "grid-connected Taiwanese offshore farms enter the operating layer in their full-completion year "
                 "(Yunlin 2025, Greater Changhua 1&2a and Changfang & Xidao 2024); Hai Long 2&3, Greater Changhua 2b&4 "
                 "and Taipower Offshore Phase 2 are listed as under construction at end-2025; Kitakyushu Hibikinada and "
                 "the Goto floating farm are under construction (JWPA: no new offshore project in 2025).")

# 海洋風電一期（原版輸入時）：兩部 4 MW 示範機於 2017 年 4 月商轉
for g in farms:
    if g["iso"] == "TWN" and g["name"] == "Formosa 1 Phase 1" and g["year"] == 2016:
        g["year"] = 2017
        EDITS.append("Farm 'Formosa 1 Phase 1': year 2016 -> 2017 (demo turbines commercial Apr 2017)")

# 海能風電（Formosa 2）里程碑：2022 年 7 月首度併網、2023 年 9 月全數商轉
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

# 附件的英文國名有一筆取錯（澳洲被標成國界檔裡同屬 AUS 的「Ashmore and Cartier Is.」）
NAME_FIX = {"AUS": "Australia"}
for c in D["countries"]:
    c["name"] = NAME_FIX.get(c["iso"], c["name"])

# 全球總量＝各國加總（台灣、日本改用官方序列後重新計算）
D["worldTotal"] = [round(sum(c["on"][i] + c["off"][i] for c in D["countries"]), 1) for i in range(len(Y))]

# ---------------------------------------------------------------- GEM 2026-02 各國開發管線總量、稽核說明
extra = {}
gw, gg, rel = js_const("GWPT"), js_const("GWPT_GLOBAL"), js_const("GWPT_RELEASE")
if gw and gg:
    extra["pipelineTotals"] = {
        "release": (rel or "").strip("'\""),
        "source": "Global Energy Monitor, Global Wind Power Tracker (country totals by status, MW; prospective = "
                  "construction + pre-construction + announced)",
        "url": "https://globalenergymonitor.org/projects/global-wind-power-tracker/",
        "world": json.loads(gg), "byIso": json.loads(gw)}
au = js_const("AUDIT_DATA")
if au:
    extra["audit"] = json.loads(au)

# ---------------------------------------------------------------- write
OUT.mkdir(parents=True, exist_ok=True)
meta = {
    "title": "Global wind power 1980-2025 (country capacity, milestones, farms)",
    "based_on": "wind-history-map v3 dataset, TW/JP-audited atlas v3 (see sources / notes)",
    "units": "MW, year-end cumulative installed capacity",
    "edits": EDITS,
}
dump = lambda obj, p: p.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
dump(dict({"meta": meta, "years": Y, "countries": D["countries"], "worldTotal": D["worldTotal"],
      "milestones": D["milestones"], "sources": D["sources"], "notes": D["notes"]}, **extra), OUT / "wind_global.json")
(OUT / "sources").mkdir(exist_ok=True)
dump({"farms": farms}, OUT / "sources" / "farms_attachment.json")   # 精選風場原始檔；tools/build_farms.py 再與 GEM 合併成 wind_farms.json
# 國界改由 tools/build_borders.py 以 Natural Earth 1:50m 重建（附件的國界缺澳洲本土），這裡不再輸出
for e in EDITS:
    print("edit:", e)
for p in sorted(OUT.glob("*.json")):
    print(p.name, p.stat().st_size)
