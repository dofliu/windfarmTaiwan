#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
台電風力即時出力抓取器  ·  taipower_wind_scraper.py
================================================================
用途：定期抓取台電「各機組發電量」即時資料(genary.json)，
      取出風力(Wind)機組，輸出成前端 wind-power-monitor.html
      可直接讀取的 wind_realtime.json。

為什麼需要這支程式：
  台電 genary.json 有 CORS 限制，瀏覽器無法直接抓；正確做法是由
  後端(本程式)定期抓 → 存成自己的 JSON → 前端讀自己的端點。

輸出格式(對應前端 DATA_ENDPOINT 期望)：
  {
    "updated": "2026-06-29T14:30:00+08:00",
    "wind_total_mw": 1234.5,          # 全系統風力即時總出力(最可靠的真實值)
    "farms": { "<farm_id>": <MW>, ... },   # 有對應到的個別機組
    "raw_wind_units": [ {name, capacity, output}, ... ]  # 原始風力列，供校準對照
  }

重要誠實聲明(對應學術/資料可追溯原則)：
  台電 genary.json 對「風力」的揭露粒度不一定逐風場拆分，常見為
  台電自有風場 + 民營風力彙總。因此 farms{} 只填「名稱可明確對應」者，
  其餘一律不臆測、不分攤。wind_total_mw 才是可引用的真實系統值。
  前端對未對應的風場應標示為「未個別揭露」而非填入推估值。
================================================================
依賴：requests   (pip install requests)
排程：見檔尾「部署」說明(cron / GitHub Actions / Cloudflare Worker)
"""

import json
import re
import sys
import datetime as dt
from pathlib import Path

import requests

# 台電官方即時資料來源(每 10 分鐘更新)。
# 主要：政府資料開放平臺 opendata 端點(物件陣列+中文鍵，授權明確，最適合公開站台)。
# 備援：原始 genary.json(aaData 位置陣列；有 CORS，僅供後端抓取)。
# 本程式兩種格式都能解析；預設用 opendata。
GENARY_URL = "https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json"
GENARY_URL_ALT = "https://www.taipower.com.tw/d006/loadGraph/loadGraph/data/genary.json"
OUTPUT = Path(__file__).with_name("wind_realtime.json")
TZ = dt.timezone(dt.timedelta(hours=8))  # 台北時間

# 台電 genary「機組名稱」→ 前端 farm_id 的精確對應(與前端 30 機組 1:1)。
# 採完全比對優先、再退化為包含比對。名稱以實際 genary.json 為準，若官方改名於此調整。
NAME_MAP_EXACT = {
    # 陸域 · 台電自有
    "觀園": "guanyuan", "台中港": "taichungport", "王功": "wanggong",
    "彰工": "changgong", "雲麥": "yunmai", "四湖": "sihu", "其它台電自有": "tpc-other-on",
    # 陸域 · 購電
    "苗栗大鵬": "dapeng", "鹿威彰濱": "luwei", "觀威觀音&桃威新屋": "guanwei",
    "中威大安": "zhongwei", "創維風": "chuangwei", "新源崙背": "xinyuan",
    "彰品風": "changpin", "其它購電風力": "ppa-other-on",
    # 離岸 · 台電自有
    "離岸一期": "offshore1", "離岸二期": "offshore2",
    # 離岸 · 購電
    "海洋竹南": "formosa1", "海能風": "formosa2",
    "沃一風": "wo1", "沃二風": "wo2", "沃四風": "wo4", "沃南風": "wonan",
    "芳一風": "fang1", "芳二風": "fang2", "允湖": "yunhu", "允西": "yunxi",
    "中能風": "zhongneng", "龍A風": "longA", "龍B風": "longB",
}

HEADERS = {  # 帶 UA，避免被當成爬蟲擋掉
    "User-Agent": "Mozilla/5.0 (compatible; WindWatch/1.0; +https://doflab.cc)",
    "Accept": "application/json,text/plain,*/*",
}


def strip_html(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s or "").strip()


def to_float(s):
    """把 '5.2' / 'N/A' / '-' / '1,234.5' / '3850.0(6.244%)' 安全轉為 float 或 None。"""
    if s is None:
        return None
    t = str(s).replace(",", "").strip()
    t = re.sub(r"\(.*?\)", "", t).strip()   # 去除小計列的 (6.244%) 之類括號
    if t in ("", "N/A", "-", "--", "NA"):
        return None
    try:
        return float(t)
    except ValueError:
        return None


def clean_name(s: str) -> str:
    """去除機組名稱的 (註X) 後綴，如 '彰品風(註10)' → '彰品風'。"""
    return re.sub(r"\(註\d+\)", "", strip_html(s or "")).strip()


def fetch_genary(url=GENARY_URL) -> dict:
    r = requests.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    # 台電偶爾回傳 BOM / 非標準編碼，這裡保險處理
    r.encoding = r.apparent_encoding or "utf-8"
    return json.loads(r.text.lstrip("\ufeff"))


def parse_wind(data: dict):
    """
    從台電資料取出風力(Wind)機組，同時支援兩種格式：

    A) opendata 物件陣列(預設端點)：每列為 dict，鍵為中文
       {"機組類型":"風力","機組名稱":"沃四風(註10)",
        "裝置容量(MW)":"-","淨發電量(MW)":"374.2", ...}

    B) genary.json 位置陣列：每列為 list
       [能源別(含<img>), 機組名稱, 裝置容量, 淨發電量, 百分比, 備註]

    回傳 (wind_units, total)；wind_units 內含原始名稱(raw_name)與去註名稱(name)。
    """
    rows = data.get("aaData") or data.get("data") or []
    wind_units, total = [], 0.0

    for row in rows:
        if isinstance(row, dict):                       # A) opendata 格式
            etype = strip_html(str(row.get("機組類型", "")))
            raw = str(row.get("機組名稱", ""))
            cap = to_float(row.get("裝置容量(MW)"))
            out = to_float(row.get("淨發電量(MW)"))
        elif isinstance(row, (list, tuple)) and len(row) >= 4:  # B) genary 格式
            etype = strip_html(str(row[0]))
            raw = str(row[1])
            cap = to_float(row[2])
            out = to_float(row[3])
        else:
            continue

        if ("風力" not in etype) and ("wind" not in etype.lower()):
            continue

        name = clean_name(raw)
        if any(x in name for x in ("小計", "合計", "總計")):
            continue
        if out is None:           # 無淨發電值的列略過(不影響 total)
            continue

        wind_units.append({
            "name": name,                 # 去註後名稱(供對應)
            "raw_name": strip_html(raw),   # 原始名稱(保留 (註X) 供顯示)
            "capacity": cap,               # 註10 機組為 None
            "output": round(out, 2),
        })
        total += out

    return wind_units, round(total, 2)


def map_to_farms(wind_units):
    """名稱明確對應者才填入(完全比對優先，再退化包含比對)；其餘不臆測。"""
    farms = {}
    for u in wind_units:
        name = u["name"]
        fid = NAME_MAP_EXACT.get(name)
        if fid is None:  # 退化：包含比對(處理官方在名稱前後加註的情況)
            for k, v in NAME_MAP_EXACT.items():
                if k in name:
                    fid = v
                    break
        if fid:
            farms[fid] = round(farms.get(fid, 0.0) + u["output"], 2)
    return farms


def main():
    data = None
    for url in (GENARY_URL, GENARY_URL_ALT):
        try:
            data = fetch_genary(url)
            break
        except Exception as e:
            print(f"[WARN] 取得失敗 {url}：{e}", file=sys.stderr)
    if data is None:
        print("[ERROR] 兩個端點都無法取得資料", file=sys.stderr)
        sys.exit(1)

    # 官方更新時間：opendata 用頂層 'DateTime'；genary 常見為 '' 或 'recordtime'
    upd = None
    for k in ("DateTime", "", "recordtime", "updateTime", "datetime"):
        if isinstance(data, dict) and data.get(k):
            upd = strip_html(str(data[k]))
            break

    wind_units, total = parse_wind(data)
    farms = map_to_farms(wind_units)

    out = {
        "updated": dt.datetime.now(TZ).isoformat(timespec="seconds"),
        "source_time": upd,
        "wind_total_mw": total,
        "mapped_farm_count": len(farms),
        "farms": farms,
        "raw_wind_units": wind_units,   # 第一次跑請看這裡，據以校準 NAME_MAP
    }

    OUTPUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] {out['updated']}  風力總出力 {total} MW  "
          f"(風力機組 {len(wind_units)} 列，對應 {len(farms)} 座風場) → {OUTPUT.name}")


if __name__ == "__main__":
    main()


# ============================================================
# 部署方式(擇一)
# ------------------------------------------------------------
# 1) Linux cron — 每 10 分鐘抓一次，前端讀同目錄的 wind_realtime.json
#      */10 * * * * /usr/bin/python3 /path/taipower_wind_scraper.py >> /var/log/windwatch.log 2>&1
#
# 2) Windows 工作排程器(你的 RTX 4080 主機)
#      建立基本工作 → 觸發程序「每 10 分鐘」→ 動作執行 python.exe 並帶本檔路徑
#
# 3) GitHub Actions(免主機，產生的 json 直接 push 到 gh-pages 當免費端點)
#      .github/workflows/scrape.yml:
#        on: { schedule: [{ cron: "*/15 * * * *" }] }   # GH 最短約 5–15 分
#        jobs.build: 安裝 requests → 跑本檔 → commit wind_realtime.json
#
# 4) Cloudflare Worker / Tunnel(你已有的基礎設施)
#      用 Worker 定時(Cron Trigger)抓 genary → 寫入 KV/R2 →
#      前端 DATA_ENDPOINT 指向 Worker；Worker 回應加上 CORS 標頭即可跨域。
#
# 設定完成後，把前端 wind-power-monitor.html 內的
#      const DATA_ENDPOINT = "";
# 改成你的 wind_realtime.json 網址，畫面右上角會由「模擬示範」轉為「即時」。
# ============================================================
