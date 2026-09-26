#!/usr/bin/env python3
"""風場資料覆蓋率報告：各國「已逐場標示的營運中容量」對照國家年底統計，並列出需要補足或求證的項目。

    python3 tools/coverage_report.py            # 產生 docs/data-coverage.md（中文）與 docs/data-coverage.en.md（英文）

計算方式與地球儀的「國家概況」相同（assets/js/globe.js 的 farmActive / farmMwAt）：
    - 營運中 = 狀態不是規劃中（興建中／前期開發／已宣布）、商轉年 <= 該年、尚未除役
    - 分期風場只計入已商轉的分期；商轉年份不詳的風場放在 2025（時間軸終點）
每次重建 wind_farms.json 或更新國家統計後重跑一次。只用 Python 標準函式庫。
"""
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
Y = 2025                      # 報告年份（時間軸終點）
BUILD = 0.6                   # 與 globe.js 相同：Y.0 代表 Y 年底
G = json.loads((ROOT / "data/global/wind_global.json").read_text(encoding="utf-8"))
F = json.loads((ROOT / "data/global/wind_farms.json").read_text(encoding="utf-8"))
COLS = F["meta"]["cols"]
YEARS = G["years"]
YI = YEARS.index(Y)


def farms():
    for r in F["rows"]:
        f = dict(zip(COLS, r))
        f["yu"] = bool(f["flags"] & 2)
        f["approx"] = bool(f["flags"] & 1)
        if f["yu"]:
            f["year"] = YEARS[-1]
        f["pipe"] = 1 <= f["st"] <= 3
        if f["st"] == 4 and not f["end"]:
            f["end"] = f["year"] + 20
        yield f


def active(f, y):
    return (not f["pipe"]) and y - f["year"] + BUILD >= 0 and not (f["end"] and y >= f["end"])


def mw_at(f, y):
    if not f["ph"]:
        return f["mw"]
    s = sum(p[1] for p in f["ph"] if not p[0] or p[0] - BUILD <= y)
    return s or f["ph"][0][1]


ALL = list(farms())
C = {c["iso"]: c for c in G["countries"]}
by = defaultdict(lambda: {"n": 0, "mw": 0.0, "on": 0.0, "off": 0.0, "yu": 0.0, "approx": 0, "pipe_n": 0, "pipe_mw": 0.0, "late_n": 0, "late_mw": 0.0})
late = []
for f in ALL:
    b = by[f["iso"]]
    if f["pipe"]:
        b["pipe_n"] += 1
        b["pipe_mw"] += f["mw"]
        if f["year"] and f["year"] <= Y:          # 預計商轉年已過卻仍是規劃中：狀態待確認
            b["late_n"] += 1
            b["late_mw"] += f["mw"]
            late.append(f)
        continue
    if not active(f, Y):
        continue
    m = mw_at(f, Y)
    b["n"] += 1
    b["mw"] += m
    b["on" if f["type"] == 0 else "off"] += m
    if f["yu"]:
        b["yu"] += m
    b["approx"] += f["approx"]

rows = []
for iso, c in C.items():
    nat = c["on"][YI] + c["off"][YI]
    b = by[iso]
    rows.append({"iso": iso, "zh": c.get("zh") or c["name"], "en": c["name"], "nat": nat, "non": c["on"][YI], "noff": c["off"][YI], **b,
                 "pct": (b["mw"] / nat * 100) if nat else None})
rows.sort(key=lambda r: -r["nat"])
no_series = sorted(((iso, b) for iso, b in by.items() if iso not in C and b["n"]), key=lambda t: -t[1]["mw"])

nat_total = sum(r["nat"] for r in rows)
mapped_total = sum(r["mw"] for r in rows)
world = G["worldTotal"][YI]
yu_total = sum(r["yu"] for r in rows)
pt = G.get("pipelineTotals") or {}

# 座標健檢（tools/qa_farms.py）：只取「不在自己國界內」的筆數
try:
    qa = subprocess.run([sys.executable, str(ROOT / "tools/qa_farms.py")], cwd=ROOT, capture_output=True, text=True, timeout=300).stdout
    qa_n = next((int(l.split()[0]) for l in qa.splitlines() if "farms outside their country" in l), None)
except Exception:
    qa_n = None


def fmt(x):
    return f"{x:,.0f}"


def band(r):
    if not r["nat"]:
        return "—"
    p = r["pct"]
    return "⚠" if p > 110 else "✓" if p >= 85 else "△" if p >= 60 else "✗"


def gem_op(iso):
    g = (pt.get("byIso") or {}).get(iso)
    return g.get("operating") if g else None


def table(lang):
    zh = lang == "zh"
    head = ("| # | 國家 | 國家統計 MW | 其中離岸 | GEM 營運中 MW | 已逐場標示 MW | 覆蓋率 | 差額 MW | 風場數 | 年份不詳 MW | 概略座標 | 判讀 |" if zh else
            "| # | Country | National MW | of which offshore | GEM operating MW | Mapped MW | Coverage | Gap MW | Farms | Year-unknown MW | Approx. coords | Flag |")
    out = [head, "|" + "---|" * 12]
    for i, r in enumerate(rows, 1):
        name = f"{r['zh']}（{r['iso']}）" if zh else f"{r['en']} ({r['iso']})"
        pct = f"{r['pct']:.0f}%" if r["pct"] is not None else "—"
        gap = fmt(max(0, r["nat"] - r["mw"])) if r["nat"] else "—"
        go = gem_op(r["iso"])
        out.append(f"| {i} | {name} | {fmt(r['nat'])} | {fmt(r['noff'])} | {fmt(go) if go is not None else '—'} | {fmt(r['mw'])} | {pct} | {gap} | {r['n']:,} | {fmt(r['yu'])} | {r['approx']:,} | {band(r)} |")
    return "\n".join(out)


def top(key, n, cond):
    return [r for r in sorted(rows, key=key) if cond(r)][:n]


big_gaps = top(lambda r: -(r["nat"] - r["mw"]), 12, lambda r: r["nat"] - r["mw"] > 1000)
over = top(lambda r: -(r["pct"] or 0), 20, lambda r: r["pct"] and r["pct"] > 110)
yu_top = top(lambda r: -r["yu"], 10, lambda r: r["yu"] > 0)
late.sort(key=lambda f: -f["mw"])
# 疑似重複（來源不同的兩座營運中風場）：
#   A. 名稱相同或高度相似（編號也相同）、相距 50 km 內、容量相差 25% 以內 → 很可能是同一座風場被收了兩次
#   B. 名稱不同，但容量幾乎相同（±5%）、商轉年相差 1 年內、相距 10 km 內 → 需人工確認（常是相鄰的姊妹風場）
import math, re
def km(a, b):
    p1, p2 = math.radians(a["lat"]), math.radians(b["lat"])
    dp, dl = p2 - p1, math.radians(b["lon"] - a["lon"])
    return 12742 * math.asin(math.sqrt(math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2))
GENERIC = set("wind farm farms windfarm windpark park parc parque eolico eólico eolien éolien project projects power plant station offshore onshore "
              "energy renewable renewables co ltd limited inc company the de del la le of and phase area do da dos das di du des van von".split())
def toks(f):
    return {t for t in re.findall(r"[a-z0-9]+", (f["name"] or "").lower().replace("ö", "o").replace("ü", "u")) if t not in GENERIC}
OPS = [f for f in ALL if active(f, Y)]
cell = defaultdict(list)
for f in OPS:
    cell[(f["iso"], math.floor(f["lat"] * 2), math.floor(f["lon"] * 2))].append(f)       # 0.5° 格
dupA, dupB, seen = [], [], set()
for (iso, a, b), fs in cell.items():
    near = [g for da in (-1, 0, 1) for db in (-1, 0, 1) for g in cell.get((iso, a + da, b + db), [])]
    for f in fs:
        for g in near:
            if id(f) >= id(g) or f["src"] == g["src"] or (id(f), id(g)) in seen:
                continue
            seen.add((id(f), id(g)))
            lo, hi = sorted((f["mw"], g["mw"]))
            if not hi:
                continue
            d = km(f, g)
            tf, tg = toks(f), toks(g)
            jac = len(tf & tg) / len(tf | tg) if tf and tg else 0
            nf, ng = {t for t in tf if re.search(r"\d", t)}, {t for t in tg if re.search(r"\d", t)}
            if jac >= 0.5 and d <= 50 and lo / hi >= 0.75 and not (nf and ng and nf != ng):   # 編號不同（1 期／2 期、H4／H6）不算
                dupA.append((f, g, d))
            elif d <= 10 and lo / hi >= 0.95 and abs(f["year"] - g["year"]) <= 1 and (f["lat"], f["lon"]) != (g["lat"], g["lon"]):
                dupB.append((f, g, d))
dupA.sort(key=lambda t: -min(t[0]["mw"], t[1]["mw"]))
dupB.sort(key=lambda t: -min(t[0]["mw"], t[1]["mw"]))
# 共用座標：同一點上 3 座以上的營運中風場，多半是國家或省份中心的代用座標
same = defaultdict(list)
for f in OPS:
    same[(f["iso"], f["lat"], f["lon"])].append(f)
stacks = sorted((v for v in same.values() if len(v) >= 3), key=lambda v: -sum(f["mw"] for f in v))

dev = []
for r in rows:
    go = gem_op(r["iso"])
    if go and r["nat"] > 300 and abs(go - r["nat"]) / r["nat"] > 0.15:
        dev.append((r, go))
dev.sort(key=lambda t: -abs(t[1] - t[0]["nat"]))
bands = defaultdict(int)
for r in rows:
    bands[band(r)] += 1
pipe_cmp = []
for r in rows[:15]:
    g = (pt.get("byIso") or {}).get(r["iso"])
    if g:
        gp = g.get("prospective") or sum(g.get(k, 0) for k in ("construction", "preconstruction", "announced"))
        pipe_cmp.append((r, gp))


# 已查證、但加總仍高於國家統計的原因（2026 年 9 月）
OVER_NOTE = {
    "PHL": ("逐場資料已查證（DOE 2020 年清單 443 MW 加上 2024–25 年陸續完工的 Pagudpud 160 MW）；IRENA 的數字可能還沒完整計入 Pagudpud",
            "the farm list checks out (DOE’s 2020 list, 443 MW, plus the 160 MW Pagudpud farm completed in 2024–25); IRENA’s figure may not yet fully count Pagudpud"),
    "IRN": ("Manjil 風場群的重複已合併；Tizbaad（99 MW）與 Aqkand（50 MW）的商轉狀態還需要以 SATBA 資料查證",
            "the Manjil complex duplicates are merged; whether Tizbaad (99 MW) and Aqkand (50 MW) are in operation still needs checking against SATBA data"),
}


def report(lang):
    zh = lang == "zh"
    L = (lambda a, b: a) if zh else (lambda a, b: b)
    other = "docs/data-coverage.en.md" if zh else "docs/data-coverage.md"
    s = []
    s.append(L("# 風場資料覆蓋率報告", "# Farm-level data coverage report"))
    s.append("")
    s.append(L(f"[English](data-coverage.en.md) ｜ 中文", f"English ｜ [中文](data-coverage.md)"))
    s.append("")
    s.append(L(f"> 由 `tools/coverage_report.py` 產生，請勿手動修改。年份：{Y} 年底。計算方式與地球儀「國家概況」的逐場資料覆蓋率相同。",
               f"> Generated by `tools/coverage_report.py`; do not edit by hand. Year: end of {Y}. Same method as the farm-level coverage bar in the globe’s country profile."))
    s.append("")
    s.append(L("## 摘要", "## Summary"))
    s.append("")
    s.append(L(
        f"- **國家層級**：{len(rows)} 國的年底容量合計 {fmt(nat_total)} MW，即本站的全球總量（全球 {fmt(world)} MW）；其他國家容量很小，未列入。來源：IRENA（經 Our World in Data）；台灣採能源署、日本採 JWPA 官方統計。",
        f"- **Country level**: {len(rows)} countries total {fmt(nat_total)} MW at year-end, which is the site’s world total ({fmt(world)} MW); other countries are small and not included. Source: IRENA via Our World in Data; Taiwan uses Energy Administration and Japan JWPA official statistics."))
    s.append(L(
        f"- **風場層級**：已逐場標示的營運中風場 {sum(r['n'] for r in rows):,} 座、{fmt(mapped_total)} MW，約為國家統計的 **{mapped_total / nat_total * 100:.0f}%**。差額是資料庫未收錄的風場（多為小型風場，GEM 以 10 MW 以上為主），地圖不補虛構風場。",
        f"- **Farm level**: {sum(r['n'] for r in rows):,} operating farms, {fmt(mapped_total)} MW are mapped individually — about **{mapped_total / nat_total * 100:.0f}%** of the national statistics. The gap is farms missing from the databases (mostly small ones; GEM focuses on projects of 10 MW and above); the map does not invent farms to fill it."))
    s.append(L(
        f"- **覆蓋率分級**：✓ 85% 以上 {bands['✓']} 國 · △ 60–85% {bands['△']} 國 · ✗ 低於 60% {bands['✗']} 國 · ⚠ 高於 110% {bands['⚠']} 國（逐場加總超過國家統計，口徑不同或有重複，需要求證）。",
        f"- **Coverage bands**: ✓ 85% or more: {bands['✓']} countries · △ 60–85%: {bands['△']} · ✗ below 60%: {bands['✗']} · ⚠ above 110%: {bands['⚠']} (the farm sum exceeds the national figure — a scope difference or duplicates to verify)."))
    cl = F["meta"].get("cleanup")
    if cl:
        s.append(L(
            f"- **資料清理**：{cl['asof']} 逐筆查證，刪除 {cl['removed']} 筆重複、從未建成或查無此場的紀錄，修正 {cl['fixed']} 筆（座標、容量、年份、分期、狀態），每筆的理由與出處見[資料清理紀錄](data-cleanup.md)。",
            f"- **Clean-up**: checked record by record in {cl['asof']}; {cl['removed']} duplicate, never-built or non-existent records were removed and {cl['fixed']} were fixed (location, capacity, year, phases, status). The reason and source for each are in the [clean-up log](data-cleanup.en.md)."))
    s.append(L(
        f"- **規劃中**：逐案 {sum(b['pipe_n'] for b in by.values()):,} 案、{fmt(sum(b['pipe_mw'] for b in by.values()))} MW（GEM 2025-02＋2026 年 9 月人工整理）；另以 GEM {pt.get('release', '')} 各國總量對照。",
        f"- **Pipeline**: {sum(b['pipe_n'] for b in by.values()):,} projects, {fmt(sum(b['pipe_mw'] for b in by.values()))} MW listed individually (GEM Feb 2025 plus projects curated in Sep 2026), cross-checked against GEM {pt.get('release', '')} country totals."))
    s.append("")
    s.append(L("## 需要補足的國家（差額超過 1,000 MW）", "## Countries to fill in (gap above 1,000 MW)"))
    s.append("")
    for r in big_gaps:
        s.append(L(f"- **{r['zh']}**：國家統計 {fmt(r['nat'])} MW，已標示 {fmt(r['mw'])} MW（{r['pct']:.0f}%），差 {fmt(r['nat'] - r['mw'])} MW。",
                   f"- **{r['en']}**: national {fmt(r['nat'])} MW, mapped {fmt(r['mw'])} MW ({r['pct']:.0f}%), gap {fmt(r['nat'] - r['mw'])} MW."))
    s.append("")
    s.append(L("## 需要求證的項目", "## Items to verify"))
    s.append("")
    s.append(L("1. **逐場加總高於國家統計（⚠）**：可能是同一風場在不同來源重複、分期被重複計入、除役風場仍列營運，或國家統計口徑較窄。",
               "1. **Farm sum above the national figure (⚠)**: possible duplicates across sources, phases counted twice, retired farms still listed as operating, or a narrower national scope."))
    for r in over:
        nz, ne = OVER_NOTE.get(r["iso"], ("", ""))
        s.append(L(f"   - {r['zh']}：{r['pct']:.0f}%（{fmt(r['mw'])} / {fmt(r['nat'])} MW）" + (f"——{nz}" if nz else ""),
                   f"   - {r['en']}: {r['pct']:.0f}% ({fmt(r['mw'])} / {fmt(r['nat'])} MW)" + (f" — {ne}" if ne else "")))
    s.append(L(f"2. **商轉年份不詳**：{fmt(yu_total)} MW 的營運中風場沒有商轉年（GEM 未提供），地圖只能從 2025 年開始顯示，早年的逐場畫面會偏少。容量最多的國家：",
               f"2. **Unknown commissioning year**: {fmt(yu_total)} MW of operating farms have no start year in GEM, so the map can only show them from 2025 and earlier years look sparser at farm level. Largest by country:"))
    s.append("   " + L("、", ", ").join(f"{(r['zh'] if zh else r['en'])} {fmt(r['yu'])} MW" for r in yu_top))
    s.append(L(f"3. **預計商轉年已過、仍列規劃中**：{len(late):,} 案、{fmt(sum(f['mw'] for f in late))} MW，可能已商轉、延期或取消，需要逐案更新狀態。容量最大的 10 案：",
               f"3. **Expected year already passed but still in the pipeline**: {len(late):,} projects, {fmt(sum(f['mw'] for f in late))} MW — they may have started operating, slipped or been cancelled. The 10 largest:"))
    ST = ["", L("興建中", "construction"), L("前期開發", "pre-construction"), L("已宣布", "announced")]
    for f in late[:10]:
        nm = (f["zh"] or f["name"]) if zh else f["name"]
        s.append(f"   - {nm} ({f['iso']}) · {fmt(f['mw'])} MW · {ST[f['st']]} · {L('預計', 'expected')} {f['year']}")
    s.append(L(f"4. **座標**：{sum(r['approx'] for r in rows):,} 座營運中風場為概略座標（GEM 標示 approximate）；座標健檢（`tools/qa_farms.py`）目前有 {qa_n if qa_n is not None else '?'} 筆不在自己國界內，多為可解釋的例外（澎湖等小島、西撒哈拉、波多黎各）。",
               f"4. **Coordinates**: {sum(r['approx'] for r in rows):,} operating farms have approximate coordinates (GEM ‘approximate’); the border check (`tools/qa_farms.py`) currently lists {qa_n if qa_n is not None else '?'} farms outside their own country, mostly explainable (small islands such as Penghu, Western Sahara, Puerto Rico)."))
    SRC = ({0: '精選', 1: 'WRI GPPD', 2: 'GEM', 3: '2026 整理'} if zh else {0: 'curated', 1: 'WRI GPPD', 2: 'GEM', 3: '2026 compilation'})
    s.append(L(f"   **疑似重複 A（名稱相同或相似）**：{len(dupA)} 組、較小一方合計 {fmt(sum(min(x['mw'], y['mw']) for x, y, _ in dupA))} MW——來源不同、名稱相同或高度相似、相距 50 km 內，很可能是同一座風場被收了兩次，應優先處理：",
               f"   **Suspected duplicates A (same or similar name)**: {len(dupA)} pairs, smaller side {fmt(sum(min(x['mw'], y['mw']) for x, y, _ in dupA))} MW — different sources, same or very similar names, within 50 km; most likely the same farm listed twice. Fix these first:"))
    for x, y, d in dupA[:12]:
        s.append(f"   - {x['iso']} · {x['name']} ({SRC[x['src']]}, {fmt(x['mw'])} MW, {x['year']}) ↔ {y['name']} ({SRC[y['src']]}, {fmt(y['mw'])} MW, {y['year']}) · {d:.1f} km")
    s.append(L(f"   **疑似重複 B（名稱不同、容量相同、位置相近）**：{len(dupB)} 組、較小一方合計 {fmt(sum(min(x['mw'], y['mw']) for x, y, _ in dupB))} MW——多數是相鄰的姊妹風場（例：江蘇大豐 H4 與 H8-2）；已查證為同一座的已由清理規則合併（見[資料清理紀錄](data-cleanup.md)），其餘需逐組人工確認。",
               f"   **Suspected duplicates B (different names, same capacity, close by)**: {len(dupB)} pairs, smaller side {fmt(sum(min(x['mw'], y['mw']) for x, y, _ in dupB))} MW — mostly neighbouring sister farms (e.g. Jiangsu Dafeng H4 and H8-2); pairs confirmed to be the same farm have been merged by the clean-up rules (see the [clean-up log](data-cleanup.en.md)), the rest need a manual check."))
    s.append(L(f"   **共用座標**：{len(stacks)} 個點上各有 3 座以上營運中風場（合計 {sum(len(v) for v in stacks):,} 座、{fmt(sum(f['mw'] for v in stacks for f in v))} MW），多半是國家或省份中心的代用座標；地圖上以該點為中心示意排開，卡片會註明「位置示意」。最大的 5 處：",
               f"   **Shared coordinates**: {len(stacks)} points each hold 3 or more operating farms ({sum(len(v) for v in stacks):,} farms, {fmt(sum(f['mw'] for v in stacks for f in v))} MW in total) — mostly country or province centroids used as placeholders; the map fans them out around that point and their cards say the position is schematic. The 5 largest:"))
    for v in stacks[:5]:
        s.append(f"   - {v[0]['iso']} ({v[0]['lat']}, {v[0]['lon']}) · {len(v)} {L('座', 'farms')} · {fmt(sum(f['mw'] for f in v))} MW · " + ", ".join(f["name"] for f in sorted(v, key=lambda f: -f["mw"])[:3]) + ("…" if len(v) > 3 else ""))
    s.append(L(f"5. **規劃中總量版本不一**：逐案資料為 GEM 2025-02，各國總量為 GEM {pt.get('release', '')}，兩者相差一年，下一版 GEM 逐案資料釋出後應一併更新。前 15 大國家的對照：",
               f"5. **Pipeline versions differ**: projects come from GEM Feb 2025 but country totals from GEM {pt.get('release', '')}; update the project list when the next GEM release is out. Top-15 countries:"))
    for r, gp in pipe_cmp:
        s.append(L(f"   - {r['zh']}：逐案 {fmt(r['pipe_mw'])} MW · GEM 總量 {fmt(gp)} MW",
                   f"   - {r['en']}: projects {fmt(r['pipe_mw'])} MW · GEM total {fmt(gp)} MW"))
    s.append(L("6. **國家統計本身**：除台灣、日本已對照官方原始資料外，其餘國家採 IRENA 系列（經 Our World in Data），建議每年 IRENA 新版釋出（約 3 月）時更新，並抽查前十大國家的官方統計（例：中國國家能源局、美國 EIA、德國 BNetzA）。",
               "6. **The national figures themselves**: apart from Taiwan and Japan, which were checked against official sources, countries use the IRENA series; refresh it when IRENA publishes each year (around March) and spot-check the top ten against official statistics (e.g. China NEA, US EIA, Germany BNetzA)."))
    s.append(L(f"   與 GEM {pt.get('release', '')} 的「營運中」總量相差 15% 以上的國家（國家統計 300 MW 以上；GEM 只收 10 MW 以上案場，口徑較窄時偏低屬正常，偏高則值得查）：",
               f"   Countries whose national figure differs from GEM {pt.get('release', '')} ‘operating’ by more than 15% (national above 300 MW; GEM only tracks projects of 10 MW and above, so a lower GEM figure is expected where small farms are common — a higher one is worth checking):"))
    for r, go in dev:
        s.append(L(f"   - {r['zh']}：國家統計 {fmt(r['nat'])} MW · GEM {fmt(go)} MW（{(go / r['nat'] - 1) * 100:+.0f}%）",
                   f"   - {r['en']}: national {fmt(r['nat'])} MW · GEM {fmt(go)} MW ({(go / r['nat'] - 1) * 100:+.0f}%)"))
    if no_series:
        s.append(L("7. **有風場但沒有國家統計的地區**（不影響上表）：", "7. **Places with farms but no national series** (not in the table):"))
        s.append("   " + L("、", ", ").join(f"{iso} {fmt(b['mw'])} MW" for iso, b in no_series))
    s.append("")
    s.append(L("## 各國明細（依國家統計排序）", "## By country (sorted by national capacity)"))
    s.append("")
    s.append(L("判讀：✓ 85% 以上 · △ 60–85% · ✗ 低於 60% · ⚠ 高於 110%（需求證）。",
               "Flag: ✓ 85% or more · △ 60–85% · ✗ below 60% · ⚠ above 110% (to verify)."))
    s.append("")
    s.append(table(lang))
    s.append("")
    return "\n".join(s)


out = ROOT / "docs"
out.mkdir(exist_ok=True)
(out / "data-coverage.md").write_text(report("zh"), encoding="utf-8")
(out / "data-coverage.en.md").write_text(report("en"), encoding="utf-8")
print(f"mapped {mapped_total:,.0f} / national {nat_total:,.0f} MW ({mapped_total / nat_total * 100:.1f}%), world {world:,.0f}; bands {dict(bands)}; late pipeline {len(late)}; qa {qa_n}")
