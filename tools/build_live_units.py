#!/usr/bin/env python3
"""即時資料的「發電機組 → 風場」對照表：澳洲東部電網（AEMO）、加拿大亞伯達（AESO）與安大略（IESO）。

    pip install openpyxl                      # 只有這支程式需要（讀 AEMO 登錄清單 xlsx）
    python3 tools/build_live_units.py         # 產生 data/live/units.json

三個來源都只給機組代碼或名稱、沒有座標，所以要對到 data/global/wind_farms.json 的風場：
    1. 名稱自動比對（同國家、同省州；去掉 wind / farm 等通用字後比較，編號不同的分期不互相對應）
    2. MANUAL：人工確認過的對照（代碼與名稱差很多的，例如安大略以變電所命名的機組）
    3. 對不到的機組仍計入各電網的即時總量，只是不掛在個別風場上；不猜測。
新風場併網、機組改名或重建風場資料後重跑一次（建議每季），並檢查輸出的「未對應」清單。
排程抓即時值的是 intl_wind_scraper.py，它只讀這份對照表，不需要 openpyxl。
"""
import difflib
import io
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "live" / "units.json"
AEMO_REG = "https://www.aemo.com.au/-/media/files/electricity/nem/participant_information/nem-registration-and-exemption-list.xlsx"
AESO_CSD = ["https://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet", "http://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet"]
IESO_GEN = "https://reports-public.ieso.ca/public/GenOutputCapability/PUB_GenOutputCapability.xml"

# 省州範圍（粗略外框，用來把加拿大風場分到亞伯達／安大略；澳洲 NEM 只排除西澳與北領地）
BOX = {"AB": (-120.1, 48.9, -109.9, 60.1), "ON": (-95.3, 41.6, -74.3, 57.0), "NEM": (128.9, -44.0, 154.0, -9.0)}

# 人工確認過的對照：(來源, 機組) → wind_farms.json 的風場名稱；
#   list ＝ 一個機組涵蓋資料中的多座風場，出力依風場容量比例分配（前端標示為估計）
#   None ＝ 確認對不到（資料中沒有這座風場，或對應的列是興建中的整體專案），只計入該電網總量
# 安大略的對照依 IESO「Transmission-Connected Generation」頁的「設施名稱（IESO 機組名）」
# https://www.ieso.ca/en/Power-Data/Supply-Overview/Transmission-Connected-Generation （2026-09 查核）
MANUAL = {
    # 澳洲 NEM
    ("AEMO", "MOORAWF1"): ["Moorabool North wind farm", "Moorabool South wind farm"],   # 一個 DUID 涵蓋南北兩區
    ("AEMO", "HALLWF1"): "Hallett (Brown Hill/Hallett Hill/North Brown Hill/Bluff)",   # Hallett 1 = Brown Hill
    ("AEMO", "HALLWF2"): "Hallett (Brown Hill/Hallett Hill/North Brown Hill/Bluff)",   # Hallett 2 = Hallett Hill
    ("AEMO", "NBHWF1"): "Hallett (Brown Hill/Hallett Hill/North Brown Hill/Bluff)",    # Hallett 4 = North Brown Hill
    ("AEMO", "BLUFF1"): "Hallett (Brown Hill/Hallett Hill/North Brown Hill/Bluff)",    # Hallett 5 = The Bluff（不是塔斯馬尼亞的 Bluff Point）
    ("AEMO", "DIAPURWF1"): "Diapur 2 wind farm",
    ("AEMO", "YAMBUKWF"): "Portland (PWEP) Wind Energy Project · Yambuk wind farm",   # Yambuk＝Portland 風電計畫第一期
    ("AEMO", "GPWFEST1"): "Golden Plains (Stage 1)", ("AEMO", "GPWFEST2"): "Golden Plains (Stage 1)",
    ("AEMO", "GPWFEST3"): "Golden Plains (Stage 1)",       # Golden Plains 東區＝第一期 756 MW
    ("AEMO", "GPWFWST1"): None, ("AEMO", "GPWFWST2"): None,   # Golden Plains 西區（第二期）：資料中是興建中的整體專案列
    ("AEMO", "ELAINWF1"): None, ("AEMO", "YAWWF1"): None,     # 資料中沒有這兩座風場
    # 加拿大亞伯達
    ("AESO", "TAB1"): "Taber wind farm",
    ("AESO", "SCR2"): "Magrath wind farm",
    ("AESO", "SCR3"): "Chin Chute wind farm",
    ("AESO", "FRM1"): None,                                   # Forty Mile Bow Island：資料中沒有
    # 加拿大安大略（IESO 名稱 → 設施）
    ("IESO", "AMARANTH"): "Melancthon EcoPower Centre",      # Melancthon Wind / Melancthon II (Amaranth)
    ("IESO", "BLAKE"): "Bluewater wind farm",                 # Bluewater Wind Energy Centre (Blake)
    ("IESO", "CRYSLER"): "Nation Rise wind farm",             # IESO 表未列機組名；位置（Crysler, North Stormont）與容量 100 MW 相符
    ("IESO", "DILLON"): "Raleigh wind farm",                  # Raleigh Wind Energy Centre (Dillon)
    ("IESO", "HENVEY NORTH"): "Henvey Inlet", ("IESO", "HENVEY SOUTH"): "Henvey Inlet",
    ("IESO", "LANDON"): "Adelaide Wind Power Project",        # Adelaide Wind Power (Landon)
    ("IESO", "MCLEANSMTNWF-LT.AG_T1"): "Mclean's Mountain wind farm",
    ("IESO", "PAROCHES"): "Pointes Aux Roches wind farm",
    ("IESO", "PORT BURWELL"): "Erie Shores wind farm",        # Erie Shores Wind Farm (Port Burwell)
    ("IESO", "PORTALMA-T1"): "Port Alma wind farm",           # Kruger Energy Port Alma (Portalma T1)
    ("IESO", "PORTALMA-T3"): "Chatham wind farm",             # Kruger Energy Chatham Wind (Portalma T3)
    ("IESO", "RAILBEDWF-LT.AG_SR"): "South Kent",             # South Kent Wind (Railbed)
    ("IESO", "SANDUSK-LT.AG_T1"): "Port Dover And Nanticoke wind farm",
    ("IESO", "SHANNON"): "Dufferin wind farm",                # Dufferin Wind Power (Shannon)
    ("IESO", "SPENCE"): "Talbot wind farm",                   # Talbot Wind Farm (Spence)
    ("IESO", "WEST LINCOLN NRWF"): "Niagara Region wind farm",
    ("IESO", "ZURICH"): "Grand Bend wind farm",               # Grand Bend Wind Farm (Zurich)
}

STOP = set("wind farm farms windfarm wf wgs energy centre center project power facility park hub green renewable renewables the and of "
           "pty ltd inc lp co stage phase ecopower sop canada alberta australia lt ag t1 t2 t3 sr ac1".split())


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (windfarmTaiwan live units)"})
    with urllib.request.urlopen(req, timeout=90) as r:
        b = r.read()
    return b if binary else b.decode("utf-8", "replace")


def toks(name):
    s = name.lower().replace("&", " and ").replace("'", "")
    return [{"mt": "mount"}.get(t, t) for t in re.findall(r"\d+[a-z]?\b|[a-z]+|\d+", s) if t not in STOP]


def score(unit, farm):
    """名稱相似度 0–1；兩邊都有編號且不同時視為不同分期。"""
    a, b = toks(unit), toks(farm)
    num = lambda t: t[0].isdigit()                     # 編號（含 1A、1B 這種分期代號）
    wa, wb = [t for t in a if not num(t)], [t for t in b if not num(t)]
    da, db = {t for t in a if num(t)}, {t for t in b if num(t)}
    if not wa or not wb:
        return 0.0
    if da and db and not (da & db):
        return 0.0
    jac = len(set(wa) & set(wb)) / len(set(wa) | set(wb))
    sa, sb = "".join(wa), "".join(wb)
    ratio = difflib.SequenceMatcher(None, sa, sb).ratio()
    pref = 0.9 if (sa.startswith(sb) or sb.startswith(sa)) and min(len(sa), len(sb)) >= 4 else 0
    sc = max(jac, ratio if ratio >= 0.85 else 0, pref)
    if da and db:            # 編號相同（例：Crookwell 3 ↔ Crookwell wind farm · 3）優先於沒有編號的整體列
        sc += 0.05
    elif db and not da:      # 風場有編號、機組沒有（例：Murra Warra ↔ Murra Warra 2）多半是不同分期
        sc *= 0.6
    return sc


def farms_in(iso, box):
    F = json.loads((ROOT / "data/global/wind_farms.json").read_text(encoding="utf-8"))
    cols = F["meta"]["cols"]
    x0, y0, x1, y1 = BOX[box]
    out = []
    for r in F["rows"]:
        f = dict(zip(cols, r))
        if f["iso"] == iso and x0 < f["lon"] < x1 and y0 < f["lat"] < y1 and f["st"] != 4:
            out.append(f)
    return out


def match(src, units, farms):
    """units: [{id, name, cap, ...}] → 補上 farm（風場名稱或 None）與比對分數。"""
    for u in units:
        key = (src, u["id"])
        if key in MANUAL:
            u["farm"], u["how"] = MANUAL[key], "manual"
            continue
        best, bs = None, 0.0
        for f in farms:
            sc = score(u["name"], f["name"])
            if sc > bs or (sc == bs and best is not None and f["st"] == 0 and best["st"] != 0):
                best, bs = f, sc
        u["farm"], u["how"] = (best["name"], round(bs, 2)) if best and bs >= 0.75 else (None, round(bs, 2))
    mw = {f["name"]: f["mw"] for f in farms}
    for u in units:
        fl = u["farm"] if isinstance(u["farm"], list) else [u["farm"]] if u["farm"] else []
        missing = [n for n in fl if n not in mw]
        if missing:
            sys.exit(f"{src} {u['id']}: farm name(s) not found in wind_farms.json: {missing}")
        if isinstance(u["farm"], list):          # 依風場容量比例分配
            tot = sum(mw[n] for n in fl)
            u["w"] = [round(mw[n] / tot, 4) for n in fl]
    return units


def aemo_units():
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(get(AEMO_REG, binary=True)), read_only=True, data_only=True)
    rows = list(wb["PU and Scheduled Loads"].iter_rows(values_only=True))
    hdr = [str(h).strip() if h else "" for h in rows[0]]
    ix = {h: i for i, h in enumerate(hdr)}
    out = []
    for r in rows[1:]:
        if str(r[ix["Fuel Source - Primary"]] or "").strip().lower() == "wind" and re.match(r"^[A-Z0-9_]+$", str(r[ix["DUID"]] or "").strip()):
            out.append({"id": str(r[ix["DUID"]]).strip(), "name": str(r[ix["Station Name"]]).strip(),
                        "region": r[ix["Region"]], "cap": float(r[ix["Reg Cap generation (MW)"]] or 0)})
    return out


def aeso_units():
    html = None
    for u in AESO_CSD:
        try:
            html = get(u)
            break
        except Exception as e:
            print("AESO", u, e, file=sys.stderr)
    i = [m.start() for m in re.finditer(r"<B>\s*WIND\s*</B>", html)][-1]
    t = html[i:html.find("</TABLE>", i)]
    out = []
    for name, mc, _tng, _dcr in re.findall(r"<TR><TD>([^<]*)</TD><TD>(-?\d+)</TD><TD>(-?\d+)</TD><TD>(-?\d+)</TD></TR>", t):
        m = re.match(r"^(?:[A-Z0-9]+ )?(.*?) \(([A-Z0-9]+)\)\*?$", name.strip())
        if m:
            out.append({"id": m.group(2), "name": m.group(1).strip(), "cap": float(mc)})
    return out


def ieso_units():
    xml = get(IESO_GEN)
    out = []
    for name, body in re.findall(r"<Generator>\s*<GeneratorName>([^<]+)</GeneratorName>\s*<FuelType>WIND</FuelType>(.*?)</Generator>", xml, re.S):
        caps = [float(v) for v in re.findall(r"<AvailCapacity>\s*<Hour>\d+</Hour>\s*<EnergyMW>([\d.]+)</EnergyMW>", body)]
        out.append({"id": name, "name": re.sub(r"-LT\..*$|-T\d$|WGS$|WF$", "", name).replace("NRWF", "").strip(), "cap": max(caps) if caps else 0})
    return out


def main():
    res = {}
    for src, fetch, iso, box in (("AEMO", aemo_units, "AUS", "NEM"), ("AESO", aeso_units, "CAN", "AB"), ("IESO", ieso_units, "CAN", "ON")):
        units = match(src, fetch(), farms_in(iso, box))
        res[src] = units
        ok = [u for u in units if u["farm"]]
        print(f"{src}: {len(units)} wind units, {sum(u['cap'] for u in units):,.0f} MW; mapped {len(ok)} ({sum(u['cap'] for u in ok):,.0f} MW)")
        for u in units:
            print(f"   {u['id']:<22} {u['name'][:34]:<34} {u['cap']:>7.1f}  → {u['farm'] or '—'}  [{u['how']}]{'  w=' + str(u['w']) if u.get('w') else ''}")
    out = {"meta": {"note": "unit → farm mapping for live data; generated by tools/build_live_units.py",
                    "sources": {"AEMO": AEMO_REG, "AESO": AESO_CSD[0], "IESO": IESO_GEN}},
           **{src: {u["id"]: {k: v for k, v in (("farm", u["farm"]), ("w", u.get("w")), ("name", u["name"]), ("region", u.get("region")), ("cap", u["cap"]))
                              if v is not None or k == "farm"} for u in res[src]} for src in ("AEMO", "AESO", "IESO")}}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
