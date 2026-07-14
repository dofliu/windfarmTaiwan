#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
台電各機組「過去發電量」歷史回填器  ·  backfill_history.py
================================================================
用途：抓取政府資料開放平臺資料集 37331「台灣電力公司_各機組過去發電量」
      (各機組過去每 10 分鐘淨發電量·瞬間值)，取出風力機組，
      回填 wind_history.json 中缺漏的時間點。

為什麼需要這支程式：
  taipower_wind_scraper.py 靠 GitHub Actions 每 15 分鐘取樣一次「即時」
  快照(genary)，但 Actions 排程常被延遲或跳過，趨勢線會出現缺口；
  且 15 分鐘取樣只能撈到台電 10 分鐘資料的 2/3。
  資料集 37331 提供官方回溯資料，可把缺漏的 10 分鐘點位補齊。

資料來源解析順序(執行時動態決定，不寫死未驗證的網址)：
  1. 環境變數 BACKFILL_URL(手動指定資源網址時優先)
  2. 政府資料開放平臺 metadata API(data.gov.tw / data.nat.gov.tw)
     → 讀出資料集 37331 的 resourceDownloadUrl
  抓回的資料會先驗證形狀(每列需有 時間+機組名稱+淨發電量，且含多個
  相異時間戳)才使用；驗證不過就明確報錯，不寫入任何臆測值。

合併原則(誠實資料原則)：
  - 只「補缺」：wind_history.json 既有時間點一律保留不覆蓋
    (既有點含 CWA 風速 wind{}；回填點無歷史風速，wind 為空)。
  - 回填點與即時點同源(皆為台電淨發電量瞬間值)，格式完全一致。
  - 僅保留最近 HISTORY_DAYS 天(與 scraper 的滾動視窗一致)。
================================================================
依賴：requests   (pip install requests)
用法：python backfill_history.py [--days 7] [--dry-run]
排程：.github/workflows/backfill.yml(每日一次，自動補前一日缺口)
"""

import argparse
import csv
import io
import json
import os
import sys
import datetime as dt

import requests

# 沿用 scraper 的解析工具與風場對應表，確保回填點與即時點口徑一致
from taipower_wind_scraper import (
    HEADERS, HISTORY, NAME_MAP_EXACT, TZ, clean_name, map_to_farms, strip_html, to_float,
)

DATASET_ID = "37331"   # 台灣電力公司_各機組過去發電量(每 10 分鐘淨發電量瞬間值)
META_APIS = [
    f"https://data.gov.tw/api/v2/rest/dataset/{DATASET_ID}",
    f"https://data.nat.gov.tw/api/v2/rest/dataset/{DATASET_ID}",
]
HISTORY_DAYS = 7        # 滾動視窗(天)，與 scraper 一致

# 各欄位的候選鍵名(官方欄位名稱可能調整，這裡做寬容比對；比對不到即報錯)
DT_KEYS = ("日期時間", "資料時間", "時間", "DateTime", "datetime", "Time", "TIME", "recordTime")
DATE_KEYS = ("日期", "Date", "DATE")            # 「日期」「時間」分兩欄的情況
TYPE_KEYS = ("機組類型", "能源別", "類型", "type", "Type")
NAME_KEYS = ("機組名稱", "name", "Name", "UNIT_NAME")
OUT_KEYS = ("淨發電量(MW)", "淨發電量", "發電量(MW)", "發電量", "NET_P")


def parse_ts(s):
    """把 '2026-07-03 05:40' / '2026/07/03 05:40:00' / ISO 等格式
    正規化成與 wind_history.json 一致的 '2026-07-03T05:40:00'(無時區·台北時間)。"""
    if not s:
        return None
    t = strip_html(str(s)).replace("/", "-").replace("T", " ").strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d %H", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(t, fmt).isoformat(timespec="seconds")
        except ValueError:
            continue
    return None


def _first_key(row, keys):
    for k in keys:
        if k in row and str(row.get(k, "")).strip() != "":
            return k
    return None


def resolve_resource_urls():
    """回傳依優先序排列的候選資源網址。"""
    urls = []
    manual = os.environ.get("BACKFILL_URL")
    if manual:
        urls.append(manual)
    for api in META_APIS:
        try:
            r = requests.get(api, headers=HEADERS, timeout=25)
            r.raise_for_status()
            meta = r.json()
            dists = (meta.get("result") or meta).get("distribution") or []
            # JSON 資源優先、CSV 次之，其餘格式最後
            def rank(d):
                f = str(d.get("resourceFormat", "")).upper()
                return {"JSON": 0, "CSV": 1}.get(f, 2)
            for d in sorted(dists, key=rank):
                u = d.get("resourceDownloadUrl") or d.get("resourceAccessUrl")
                if u and u not in urls:
                    urls.append(u)
            if len(urls) > (1 if manual else 0):
                break                      # 第一個能回應的 metadata API 就夠了
        except Exception as e:
            print(f"[WARN] metadata API 失敗 {api}：{e}", file=sys.stderr)
    return urls


def _find_rows(data, depth=0):
    """從 JSON 結構找出資料列 list：慣用包裹鍵優先，其次遞迴，最後取最大的 list。
    回傳的列可能是 dict(物件陣列)或 list(位置陣列，如 genary 的 aaData)。"""
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and depth < 3:
        for k in ("data", "aaData", "records", "result"):
            v = data.get(k)
            got = _find_rows(v, depth + 1) if isinstance(v, (list, dict)) else []
            if got:
                return got
        lists = [v for v in data.values() if isinstance(v, list) and v]
        if lists:
            return max(lists, key=len)
    return []


def _diag(data):
    """資料結構摘要(供解析失敗時印進 log，好校準解析器)。"""
    try:
        if isinstance(data, dict):
            parts = [f"{k}:{type(v).__name__}" + (f"[{len(v)}]" if isinstance(v, (list, dict, str)) else "")
                     for k, v in list(data.items())[:12]]
            return "dict{" + ", ".join(parts) + "}"
        if isinstance(data, list):
            return f"list[{len(data)}] 首列={repr(data[0])[:300] if data else '∅'}"
        return f"{type(data).__name__}: {repr(data)[:200]}"
    except Exception:
        return "(無法摘要)"


def fetch_rows(url):
    """抓資源並回傳 (rows, 原始結構摘要)。支援 JSON(物件或位置陣列、常見包裹鍵)與 CSV。"""
    r = requests.get(url, headers=HEADERS, timeout=90)
    r.raise_for_status()
    r.encoding = r.apparent_encoding or "utf-8"
    text = r.text.lstrip("﻿")
    try:
        data = json.loads(text)
        return _find_rows(data), _diag(data)
    except json.JSONDecodeError:
        rows = list(csv.DictReader(io.StringIO(text)))
        return rows, f"CSV 欄位={rows[0].keys() if rows else '∅'}"


def extract_points(rows, diag=""):
    """把原始列 → {ts: [wind_unit,...]}，只收風力機組(排除小計/合計)。

    支援兩種列格式：
      dict — 物件陣列(中文鍵，鍵名寬容比對)
      list — 位置陣列(genary 慣用欄序前加時間欄：[時間, 機組類型, 機組名稱, 裝置容量, 淨發電量, ...])

    驗證(不過即 raise，錯誤訊息附上結構摘要供校準)：
      1. 至少 2 個相異時間戳(否則視為誤抓「即時」快照)
      2. 至少一個機組名稱能對應到已知風場(防位置陣列欄序猜錯產生垃圾值)
    """
    dict_rows = [r for r in rows if isinstance(r, dict)]
    if dict_rows:
        by_ts = _extract_from_dicts(dict_rows)
    else:
        list_rows = [r for r in rows if isinstance(r, (list, tuple)) and len(r) >= 5]
        if not list_rows:
            raise ValueError(f"資源內無可解析的列。結構摘要：{diag}")
        by_ts = _extract_from_lists(list_rows)

    if len(by_ts) < 2:
        raise ValueError(f"僅解析出 {len(by_ts)} 個時間戳，資料形狀不符「過去發電量」(拒用)。結構摘要：{diag}")
    names = {u["name"] for units in by_ts.values() for u in units}
    if not any(n in NAME_MAP_EXACT or any(k in n for k in NAME_MAP_EXACT) for n in names):
        raise ValueError(f"機組名稱與已知風場對應表零匹配(疑欄序/欄名判讀錯誤，拒用)。"
                         f"樣本名稱：{sorted(names)[:8]}。結構摘要：{diag}")
    return by_ts


def _extract_from_lists(rows):
    """位置陣列：假設沿用 genary 欄序、前面多一個時間欄：
    [日期時間, 機組類型, 機組名稱, 裝置容量, 淨發電量, ...]。
    第 0 欄必須可解析為完整日期時間，否則整批拒用(由呼叫端的驗證擋下)。"""
    by_ts = {}
    for row in rows:
        ts = parse_ts(row[0])
        if ts is None:
            continue
        etype = strip_html(str(row[1]))
        name = clean_name(str(row[2]))
        out = to_float(row[4])
        if out is None or any(x in name for x in ("小計", "合計", "總計")):
            continue
        if ("風力" not in etype) and ("wind" not in etype.lower()):
            continue
        by_ts.setdefault(ts, []).append({"name": name, "output": round(out, 2)})
    return by_ts


def _extract_from_dicts(rows):
    sample = rows[0]
    dt_key = _first_key(sample, DT_KEYS)
    date_key = _first_key(sample, DATE_KEYS)
    time_key = None
    if date_key and (dt_key is None or dt_key in ("時間", "Time", "TIME")):
        # 「日期」「時間」分兩欄的格式：合併解析(「時間」欄單獨存在時不是完整日期時間)
        time_key, dt_key = dt_key, None
    else:
        date_key = None
    type_key = _first_key(sample, TYPE_KEYS)
    name_key = _first_key(sample, NAME_KEYS)
    out_key = _first_key(sample, OUT_KEYS)
    if name_key is None or out_key is None or (dt_key is None and date_key is None):
        raise ValueError(f"欄位無法辨識(實際欄位：{sorted(sample.keys())})")

    by_ts = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        if dt_key:
            ts = parse_ts(row.get(dt_key))
        else:
            ts = parse_ts(f"{row.get(date_key, '')} {row.get(time_key, '') if time_key else ''}")
        if ts is None:
            continue
        etype = strip_html(str(row.get(type_key, ""))) if type_key else ""
        name = clean_name(str(row.get(name_key, "")))
        out = to_float(row.get(out_key))
        if out is None or any(x in name for x in ("小計", "合計", "總計")):
            continue
        # 有機組類型欄→用它過濾風力；沒有→退化用名稱過濾：
        # 名稱含「風」或在風場對應表內(觀園/王功等台電自有風場名稱不含「風」字)
        if type_key:
            if ("風力" not in etype) and ("wind" not in etype.lower()):
                continue
        elif "風" not in name and name not in NAME_MAP_EXACT:
            continue
        by_ts.setdefault(ts, []).append({"name": name, "output": round(out, 2)})
    return by_ts


def load_history():
    if HISTORY.exists():
        try:
            doc = json.loads(HISTORY.read_text(encoding="utf-8"))
            return doc, list(doc.get("points", []))
        except Exception:
            pass
    return {}, []


def merge(points, by_ts, days):
    """只補缺：既有 t 不覆蓋。回傳(合併排序修剪後的 points, 新增筆數)。"""
    existing = {p.get("t") for p in points}
    added = 0
    for ts, units in by_ts.items():
        if ts in existing:
            continue
        farms = map_to_farms(units)
        total = round(sum(u["output"] for u in units), 2)
        points.append({"t": ts, "farms": farms, "wind": {}, "total": total})
        added += 1
    points.sort(key=lambda p: p.get("t") or "")
    if points:                              # 以最新點為基準保留 days 天(避免依賴本機時鐘)
        try:
            newest = dt.datetime.fromisoformat(points[-1]["t"])
            cutoff = (newest - dt.timedelta(days=days)).isoformat(timespec="seconds")
            points = [p for p in points if (p.get("t") or "") >= cutoff]
        except ValueError:
            pass
    return points, added


def main():
    ap = argparse.ArgumentParser(description="以資料集 37331 回填 wind_history.json")
    ap.add_argument("--days", type=int, default=HISTORY_DAYS, help="保留最近 N 天(預設 7)")
    ap.add_argument("--dry-run", action="store_true", help="只顯示會新增幾筆，不寫檔")
    args = ap.parse_args()

    urls = resolve_resource_urls()
    if not urls:
        print("[ERROR] 無法取得資料集 37331 的資源網址(metadata API 皆失敗，"
              "可設環境變數 BACKFILL_URL 手動指定)", file=sys.stderr)
        sys.exit(1)

    by_ts, used_url = None, None
    for url in urls:
        try:
            rows, diag = fetch_rows(url)
            by_ts = extract_points(rows, diag)
            used_url = url
            break
        except Exception as e:
            print(f"[WARN] 資源不可用 {url}：{e}", file=sys.stderr)
    if by_ts is None:
        print("[ERROR] 所有候選資源都無法解析，未寫入任何資料", file=sys.stderr)
        sys.exit(1)

    ts_sorted = sorted(by_ts)
    doc, points = load_history()
    before = len(points)
    points, added = merge(points, by_ts, args.days)

    print(f"[OK] 來源：{used_url}")
    print(f"[OK] 官方回溯資料涵蓋 {ts_sorted[0]} ～ {ts_sorted[-1]}(共 {len(ts_sorted)} 個時間點)")
    # 印一個樣本點供人工核對(尤其位置陣列欄序假設)：值應與 wind_realtime 同量級
    sample_ts = ts_sorted[-1]
    print(f"[OK] 樣本 {sample_ts}：{by_ts[sample_ts][:5]}")
    print(f"[OK] 歷史點位：{before} → {len(points)}(回填 {added} 筆，既有點一律保留)")

    if args.dry_run:
        print("[DRY-RUN] 未寫檔")
        return
    if added == 0 and len(points) == before:
        print("[OK] 無缺口可補，檔案未變動")
        return
    doc = {
        "updated": dt.datetime.now(TZ).isoformat(timespec="seconds"),
        "interval_min": doc.get("interval_min", 15),
        "points": points,
    }
    HISTORY.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] 已寫入 {HISTORY.name}")


if __name__ == "__main__":
    main()
