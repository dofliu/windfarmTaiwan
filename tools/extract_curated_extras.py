#!/usr/bin/env python3
"""從另一個平行開發版本「全球風電發展觀察地圖」(wind-history-map.html，2026 年整理版) 取出兩份補充資料，
交給 tools/build_farms.py 與 GEM 資料合併：

    python tools/extract_curated_extras.py <wind-history-map.html> data/global/sources

輸出：
    pipeline_curated.json   193 個人工整理的規劃中／興建中專案（多為離岸與浮動式；含中文名、開發商、預計商轉年、
                            狀態備註，整理於 2026 年 9 月）。GEM 2025-02 已有的專案用來更新狀態與預計年份，
                            沒有的才新增；「暫緩」(on_hold) 不收錄（與 GEM 的 shelved 一致）。
    farms_jp_compiled.json  日本風場清單（NEDO 各縣 1 MW 以上風場至 2018 年 3 月＋其後 windfarm.work／營運商資料），
                            用來補上 GEM 未收錄的 10 MW 以下風場，並更新 GEM 2025-02 之後才商轉的案場。

該版本其他國家的風場（德國 MaStR 群聚、PyPSA powerplantmatching 等）與 GEM 高度重疊、名稱與範圍不一致，
併入會重複計算，所以不取用。"""
import json, re, sys
from pathlib import Path

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
html = SRC.read_text(encoding="utf-8")
D = json.loads(re.search(r"^const WIND_DATA = (\{.*\});\s*$", html, re.M).group(1))
OUT.mkdir(parents=True, exist_ok=True)
dump = lambda obj, p: p.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

pipe = [p for p in D.get("pipeline", []) if p.get("status") != "on_hold"]
dump({"asOf": D.get("pipelineAsOf"), "sources": D["sources"].get("pipeline", []), "notes": D["notes"].get("pipeline", []),
      "skipped_on_hold": sum(1 for p in D.get("pipeline", []) if p.get("status") == "on_hold"),
      "projects": pipe}, OUT / "pipeline_curated.json")

keys, types = D["farmKeys"], D["farmTypes"]
jp = []
for r in D["farmRows"]:
    f = dict(zip(keys, r))
    if f["iso"] != "JPN":
        continue
    if isinstance(f.get("type"), int):
        f["type"] = types[f["type"]]
    jp.append({k: v for k, v in f.items() if v not in (None, "", 0) or k in ("lat", "lon")})
jp_notes = [n for n in D["notes"].get("farms", []) if "Japan" in n or "JPN" in n]
dump({"sources": [s for s in D["sources"].get("farms", []) if "NEDO" in s or "windfarm.work" in s or ".jp" in s],
      "notes": jp_notes, "farms": jp}, OUT / "farms_jp_compiled.json")
print("pipeline projects", len(pipe), "(on_hold skipped", sum(1 for p in D.get("pipeline", []) if p.get("status") == "on_hold"), ")")
print("japan farms", len(jp))
