#!/usr/bin/env python3
"""澳洲與加拿大的風場即時出力（GitHub Actions 約每 2 小時與台電資料一起執行）。

    python3 intl_wind_scraper.py          # 更新 data/live/intl_realtime.json

來源（都不需要金鑰，評估見 docs/live-data-sources.md）：
    AEMO  澳洲東部電網 NEM：NEMWeb Dispatch_SCADA，每個發電機組（DUID）每 5 分鐘的實測出力
    AESO  加拿大亞伯達：Current Supply Demand 報表，每個風場資產約 1 分鐘的即時淨出力（TNG）
    IESO  加拿大安大略：Generators Output and Capability 報表，每個風場每小時的出力
機組對應到哪座風場由 data/live/units.json 決定（tools/build_live_units.py 產生）；對不到的機組只計入電網總量。
任一來源失敗時保留上一次的數值並標示 ok=false，不寫入臆測值；另保留各電網總量 48 小時的歷史供前端畫趨勢。
只用 Python 標準函式庫。
"""
import csv
import datetime as dt
import io
import json
import re
import sys
import urllib.request
import zipfile
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent
UNITS = ROOT / "data" / "live" / "units.json"
OUT = ROOT / "data" / "live" / "intl_realtime.json"
HIST_HOURS = 48
UA = {"User-Agent": "Mozilla/5.0 (windfarmTaiwan live wind; https://github.com/dofliu/windfarmTaiwan)"}

AEMO_DIR = "https://nemweb.com.au/Reports/Current/Dispatch_SCADA/"
AESO_CSD = ["https://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet",
            "http://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet"]      # https 握手常失敗，退回 http
IESO_GEN = "https://reports-public.ieso.ca/public/GenOutputCapability/PUB_GenOutputCapability.xml"

GRIDS = {
    "AEMO": {"iso": "AUS", "area": "NEM", "res": "5min", "url": AEMO_DIR},
    "AESO": {"iso": "CAN", "area": "AB", "res": "snapshot", "url": AESO_CSD[0]},
    "IESO": {"iso": "CAN", "area": "ON", "res": "hourly", "url": IESO_GEN},
}


def get(url, binary=False, timeout=60):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        b = r.read()
    return b if binary else b.decode("utf-8", "replace")


def iso_utc(t):
    return t.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch_aemo():
    """→ (資料時間 UTC, {DUID: MW})。NEM 時間固定為 UTC+10（不實施夏令時間）。"""
    listing = get(AEMO_DIR)
    zips = sorted(set(re.findall(r'(?i)href="([^"]*PUBLIC_DISPATCHSCADA_\d{12}_\d+\.zip)"', listing)))
    if not zips:
        raise RuntimeError("no Dispatch_SCADA files listed")
    raw = get("https://nemweb.com.au" + zips[-1] if zips[-1].startswith("/") else AEMO_DIR + zips[-1], binary=True)
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        text = z.read(z.namelist()[0]).decode("utf-8", "replace")
    vals, when = {}, None
    for row in csv.reader(io.StringIO(text)):
        if len(row) > 6 and row[0] == "D" and row[2] == "UNIT_SCADA":
            when = row[4]
            try:
                vals[row[5]] = float(row[6])
            except ValueError:
                pass
    if not when:
        raise RuntimeError("no UNIT_SCADA rows")
    t = dt.datetime.strptime(when, "%Y/%m/%d %H:%M:%S").replace(tzinfo=dt.timezone(dt.timedelta(hours=10)))
    return t, vals


def fetch_aeso():
    """→ (資料時間 UTC, {資產代碼: MW})。報表時間為亞伯達當地時間（America/Edmonton）。"""
    html, err = None, None
    for u in AESO_CSD:
        try:
            html = get(u)
            break
        except Exception as e:  # noqa: BLE001
            err = e
    if html is None:
        raise RuntimeError(f"AESO unreachable: {err}")
    m = re.search(r"Last Update\s*:\s*([A-Za-z]{3} \d{1,2}, \d{4} \d{1,2}:\d{2})", html)
    marks = [x.start() for x in re.finditer(r"<B>\s*WIND\s*</B>", html)]
    if not m or not marks:
        raise RuntimeError("AESO report layout changed")
    t = dt.datetime.strptime(m.group(1), "%b %d, %Y %H:%M").replace(tzinfo=ZoneInfo("America/Edmonton"))
    tbl = html[marks[-1]:html.find("</TABLE>", marks[-1])]
    vals = {}
    for name, _mc, tng, _dcr in re.findall(r"<TR><TD>([^<]*)</TD><TD>(-?\d+)</TD><TD>(-?\d+)</TD><TD>(-?\d+)</TD></TR>", tbl):
        code = re.search(r"\(([A-Z0-9]+)\)\*?\s*$", name.strip())
        if code:
            vals[code.group(1)] = float(tng)
    return t, vals


def fetch_ieso():
    """→ (資料時間 UTC, {機組名: MW})。取每個風電機組最新一個小時的出力；IESO 報表以東部標準時間（UTC−5）計時。"""
    xml = get(IESO_GEN)
    day = re.search(r"<Date>(\d{4}-\d{2}-\d{2})</Date>", xml)
    if not day:
        raise RuntimeError("IESO report layout changed")
    vals, hours = {}, []
    for name, body in re.findall(r"<Generator>\s*<GeneratorName>([^<]+)</GeneratorName>\s*<FuelType>WIND</FuelType>(.*?)</Generator>", xml, re.S):
        outs = [(int(h), v) for h, v in re.findall(r"<Output>\s*<Hour>(\d+)</Hour>\s*<EnergyMW>([^<]*)</EnergyMW>", body) if v.strip()]
        if outs:
            h, v = outs[-1]
            vals[name] = float(v)
            hours.append(h)
    if not hours:
        raise RuntimeError("no IESO wind outputs yet")
    he = max(set(hours), key=hours.count)                      # 多數機組已公布的最新時段（hour ending）
    vals = {k: v for k, v, h in zip(vals, vals.values(), hours) if h == he}
    t = dt.datetime.strptime(day.group(1), "%Y-%m-%d").replace(tzinfo=dt.timezone(dt.timedelta(hours=-5))) + dt.timedelta(hours=he)
    return t, vals


def build(src, t, vals, units):
    """把機組出力換成電網總量與逐場數值；對應到多座風場的機組依容量比例分配（est）。"""
    total = cap_on = 0.0
    n = 0
    farms = {}
    for uid, u in units.items():
        if uid not in vals:
            continue
        mw = max(0.0, vals[uid])                   # 夜間的小負值（廠內用電）以 0 計
        total += mw
        cap_on += u["cap"]
        n += 1
        names = u["farm"] if isinstance(u["farm"], list) else [u["farm"]] if u["farm"] else []
        ws = u.get("w") or [1.0] * len(names)
        for name, w in zip(names, ws):
            f = farms.setdefault(name, {"iso": GRIDS[src]["iso"], "name": name, "grid": src, "mw": 0.0, "cap": 0.0, "units": []})
            f["mw"] += mw * w
            f["cap"] += u["cap"] * w
            f["units"].append(uid)
            if len(ws) > 1:
                f["est"] = True
    for f in farms.values():
        f["mw"], f["cap"] = round(f["mw"], 1), round(f["cap"], 1)
    grid = {**GRIDS[src], "time": iso_utc(t), "ok": True, "mw": round(total, 1), "cap": round(cap_on, 1),
            "units": n, "units_listed": len(units), "cap_listed": round(sum(u["cap"] for u in units.values()), 1),
            "mapped": sum(1 for uid, u in units.items() if uid in vals and u["farm"])}
    return grid, list(farms.values())


def main():
    units = json.loads(UNITS.read_text(encoding="utf-8"))
    prev = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    grids, farms, hist = dict(prev.get("grids", {})), [], dict(prev.get("hist", {}))
    prev_farms = {}
    for f in prev.get("farms", []):
        prev_farms.setdefault(f["grid"], []).append(f)
    now = dt.datetime.now(dt.timezone.utc)
    changed = False
    for src, fetch in (("AEMO", fetch_aemo), ("AESO", fetch_aeso), ("IESO", fetch_ieso)):
        try:
            t, vals = fetch()
            grid, fl = build(src, t, vals, units[src])
            grids[src] = grid
            farms += fl
            h = [p for p in hist.get(src, []) if dt.datetime.fromisoformat(p[0].replace("Z", "+00:00")) > now - dt.timedelta(hours=HIST_HOURS)]
            if not h or h[-1][0] != grid["time"]:
                h.append([grid["time"], grid["mw"]])
            hist[src] = h
            changed = True
            print(f"{src}: {grid['time']} · {grid['mw']:,.0f} MW from {grid['units']} units ({grid['mapped']} mapped) · {len(fl)} farms")
        except Exception as e:  # noqa: BLE001 — 單一來源失敗不影響其他來源
            print(f"{src}: FAILED {e}", file=sys.stderr)
            if src in grids:
                grids[src] = {**grids[src], "ok": False, "error": str(e)[:200]}
                farms += prev_farms.get(src, [])
    if not changed and not grids:
        sys.exit("all sources failed and no previous data")
    out = {"updated": iso_utc(now), "grids": grids, "farms": sorted(farms, key=lambda f: (f["grid"], -f["cap"])), "hist": hist,
           "notice": {"AEMO": "Source: Australian Energy Market Operator (AEMO), NEMWeb Dispatch_SCADA",
                      "AESO": "© 2026 THE INDEPENDENT SYSTEM OPERATOR (\"ISO\"). All rights reserved. Source: AESO Current Supply Demand report",
                      "IESO": "Copyright © 2004-2022 Independent Electricity System Operator, all rights reserved. This information is subject to the Terms of Use set out in the IESO's website (www.ieso.ca)"}}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), f"({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
