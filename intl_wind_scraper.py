#!/usr/bin/env python3
"""澳洲與加拿大的風場即時出力，以及幾個國家／電網的風電總出力（GitHub Actions 約每 2 小時與台電資料一起執行）。

    python3 intl_wind_scraper.py          # 更新 data/live/intl_realtime.json

來源（都不需要金鑰，評估見 docs/live-data-sources.md）：
    AEMO  澳洲東部電網 NEM：NEMWeb Dispatch_SCADA，每個發電機組（DUID）每 5 分鐘的實測出力
    AESO  加拿大亞伯達：Current Supply Demand 報表，每個風場資產約 1 分鐘的即時淨出力（TNG）
    IESO  加拿大安大略：Generators Output and Capability 報表，每個風場每小時的出力
國家／電網總量（nat，沒有逐場資料）：
    GB     大不列顛：Elexon BMRS FUELINST，營運計量的風電每 5 分鐘平均（不含大部分接在配電網的風機）
    DE     德國：SMARD（聯邦網路局）陸域、離岸每 15 分鐘
    FR     法國：RTE éCO2mix 全國即時資料（ODRÉ）陸域、離岸每 15 分鐘（遙測加估計值）
    DK     丹麥：Energinet PowerSystemRightNow 陸域、離岸每分鐘
    ERCOT  美國德州電網每 5 分鐘（附同一儀表板的當月風電容量）
    CAISO  美國加州獨立系統營運者每 5 分鐘
    BE     比利時：Elia 開放資料，離岸＋陸域（含配電網）每 15 分鐘「實測並推估」，附監測容量
    PL     波蘭：PSE 首頁地圖的即時快照（陸域、離岸）；趨勢的較早時段用 PSE 次日公布的每 15 分鐘風電總發電量
    IE/NI  愛爾蘭共和國／北愛爾蘭：EirGrid Smart Grid Dashboard 每 15 分鐘的風電估計
    KR     韓國：KPX 實時電力供需現況（發電源別）每 5 分鐘的瞬時值
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
import time
import urllib.error
import urllib.parse
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


# 國家或電網層級的風電總出力：沒有逐場資料，只有總量（陸域／離岸分開的另外列出）與 48 小時的每小時平均。
# 每個 fetch_* 回傳 (點列 [(時間, 總 MW, 陸域 MW|None, 離岸 MW|None)], 同口徑的風電裝置容量 MW|None)。
NAT = {
    "GB": {"iso": "GBR", "res": "5min", "url": "https://bmrs.elexon.co.uk/generation-by-fuel-type",
           "lic": "https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/"},
    "DE": {"iso": "DEU", "res": "15min", "url": "https://www.smard.de/home", "lic": "https://creativecommons.org/licenses/by/4.0/"},
    "FR": {"iso": "FRA", "res": "15min", "url": "https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/",
           "lic": "https://www.etalab.gouv.fr/licence-ouverte-open-licence/"},
    "DK": {"iso": "DNK", "res": "1min", "url": "https://www.energidataservice.dk/tso-electricity/PowerSystemRightNow",
           "lic": "https://creativecommons.org/licenses/by/4.0/"},
    "ERCOT": {"iso": "USA", "area": "TX", "res": "5min", "url": "https://www.ercot.com/gridmktinfo/dashboards/fuelmix"},
    "CAISO": {"iso": "USA", "area": "CA", "res": "5min", "url": "https://www.caiso.com/todays-outlook/supply"},
    "BE": {"iso": "BEL", "res": "15min", "url": "https://opendata.elia.be/explore/dataset/ods086/", "lic": "https://opendata.elia.be/pages/licence/"},
    "PL": {"iso": "POL", "res": "snapshot", "url": "https://www.pse.pl/home",
           "lic": "https://www.pse.pl/bip/ponowne-wykorzystanie-informacji-publicznej"},
    "IE": {"iso": "IRL", "res": "15min", "url": "https://www.smartgriddashboard.com/roi/wind/",
           "lic": "https://www.smartgriddashboard.com/all/open-data-license/"},
    "NI": {"iso": "GBR", "area": "NI", "res": "15min", "url": "https://www.smartgriddashboard.com/ni/wind/",
           "lic": "https://www.smartgriddashboard.com/all/open-data-license/"},
    "KR": {"iso": "KOR", "res": "5min", "url": "https://www.kpx.or.kr/powerinfoSubmain.es?mid=a10404030000",
           "lic": "https://www.data.go.kr/data/15142651/openapi.do"},
}
NAT_NOTICE = {
    "GB": "Contains BMRS data © Elexon Limited copyright and database right {year}",
    "DE": "Bundesnetzagentur | SMARD.de, CC BY 4.0 (onshore + offshore summed and averaged by this site)",
    "FR": "Source : RTE – éCO2mix, via ODRÉ (Open Data Réseaux Énergies), Licence Ouverte v2.0 (moyennes horaires calculées par ce site)",
    "DK": "Source: Energinet (www.energidataservice.dk), CC BY 4.0 (hourly means computed by this site)",
    "ERCOT": "Source: Electric Reliability Council of Texas (ERCOT), Fuel Mix dashboard",
    "CAISO": "Source: California ISO, Today's Outlook (fuel source)",
    "BE": "Source: Elia Open Data (ods086, ods031), Elia Open Data Licence (CC BY 4.0) (regions summed and hourly means computed by this site)",
    "PL": "Informacja pozyskana ze strony www.pse.pl, wg. stanu strony na dzień {date}, przetworzona w części (średnie godzinowe obliczone przez ten serwis)",
    "IE": "Supported by EirGrid Group Data (Smart Grid Dashboard, wind generation estimate; hourly means computed by this site)",
    "NI": "Supported by EirGrid Group Data (Smart Grid Dashboard, SONI area, wind generation estimate; hourly means computed by this site)",
    "KR": "출처: 한국전력거래소(KPX) 실시간 전력수급현황(발전원별, 5분 순시값) — Source: Korea Power Exchange (KPX); hourly means computed by this site",
}


def get_json(url, timeout=60):
    """讀 JSON；暫時性錯誤（ERCOT 偶爾回 403）等 10 秒再試一次。"""
    try:
        return json.loads(get(url, timeout=timeout))
    except (urllib.error.URLError, TimeoutError):
        time.sleep(10)
        return json.loads(get(url, timeout=timeout))


def fetch_gb(now):
    """Elexon BMRS FUELINST：大不列顛（不含北愛爾蘭）以營運計量的風電，每 5 分鐘平均 MW；陸域、離岸不分。"""
    q = urllib.parse.urlencode({"publishDateTimeFrom": iso_utc(now - dt.timedelta(hours=HIST_HOURS + 1)),
                                "publishDateTimeTo": iso_utc(now), "fuelType": "WIND", "format": "json"})
    rows = get_json("https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELINST?" + q)
    rows = rows.get("data", rows) if isinstance(rows, dict) else rows
    pts = {}
    for r in rows:
        if r.get("fuelType") == "WIND" and r.get("generation") is not None:
            pts[dt.datetime.fromisoformat(r["startTime"].replace("Z", "+00:00"))] = float(r["generation"])
    return [(t, v, None, None) for t, v in pts.items()], None


def fetch_de(now):
    """SMARD（聯邦網路局）：陸域 4067、離岸 1225，每 15 分鐘的發電量（MWh，× 4 = 平均 MW）；每週一個檔，跨週時多讀前一週。"""
    def series(mid):
        base = f"https://www.smard.de/app/chart_data/{mid}/DE/"
        ts = get_json(base + "index_quarterhour.json")["timestamps"][-2:]
        out = {}
        for t in ts:
            for ms, v in get_json(f"{base}{mid}_DE_quarterhour_{t}.json")["series"]:
                if v is not None:
                    out[ms] = v * 4
        return out
    on, off = series(4067), series(1225)
    pts = [(dt.datetime.fromtimestamp(ms / 1000, dt.timezone.utc), on[ms] + off[ms], on[ms], off[ms]) for ms in on if ms in off]
    return pts, None


def fetch_fr(now):
    """ODRÉ éCO2mix 全國即時資料（RTE）：風電每 15 分鐘 MW，含陸域與離岸；即時值是遙測加估計，之後才換成結算數字。"""
    q = urllib.parse.urlencode({"select": "date_heure,eolien,eolien_terrestre,eolien_offshore",
                                "where": f"date_heure >= now(hours=-{HIST_HOURS + 1}) and eolien is not null", "order_by": "date_heure"})
    rows = get_json("https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/eco2mix-national-tr/exports/json?" + q)
    return [(dt.datetime.fromisoformat(r["date_heure"]), float(r["eolien"]),
             None if r.get("eolien_terrestre") is None else float(r["eolien_terrestre"]),
             None if r.get("eolien_offshore") is None else float(r["eolien_offshore"])) for r in rows], None


def fetch_dk(now):
    """Energinet PowerSystemRightNow：丹麥（DK1＋DK2）每分鐘的陸域、離岸風電 MW。"""
    rows = get_json("https://api.energidataservice.dk/dataset/PowerSystemRightNow?start=now-PT49H"
                    "&columns=Minutes1UTC,OffshoreWindPower,OnshoreWindPower&sort=Minutes1UTC&limit=0")["records"]
    return [(dt.datetime.fromisoformat(r["Minutes1UTC"]).replace(tzinfo=dt.timezone.utc), r["OnshoreWindPower"] + r["OffshoreWindPower"],
             r["OnshoreWindPower"], r["OffshoreWindPower"]) for r in rows
            if r["OnshoreWindPower"] is not None and r["OffshoreWindPower"] is not None], None


def fetch_ercot(now):
    """ERCOT Fuel Mix 儀表板：德州電網（ERCOT）昨天與今天每 5 分鐘的風電 MW，附當月風電容量（同一儀表板）。"""
    j = get_json("https://www.ercot.com/api/1/services/read/dashboards/fuel-mix.json")
    pts = []
    for day in j["data"].values():
        for ts, mix in day.items():
            if "Wind" in mix and mix["Wind"].get("gen") is not None:
                pts.append((dt.datetime.strptime(ts, "%Y-%m-%d %H:%M:%S%z"), float(mix["Wind"]["gen"]), None, None))
    cap = (j.get("monthlyCapacity") or {}).get("Wind")
    return pts, float(cap) if cap else None


def fetch_caiso(now):
    """CAISO Today's Outlook：加州獨立系統營運者每 5 分鐘的風電 MW；檔內只有當地時間（太平洋時間），今天一檔、前兩天各一檔。"""
    tz = ZoneInfo("America/Los_Angeles")
    today = now.astimezone(tz).date()

    def rows_of(url):
        out = []
        for r in csv.DictReader(io.StringIO(get(url))):
            m = re.fullmatch(r"(\d{1,2}):(\d{2})", r.get("Time", "").strip())
            if m and int(m.group(1)) < 24 and r.get("Wind", "").strip():
                out.append((int(m.group(1)), int(m.group(2)), float(r["Wind"])))
        return out

    def stamp(day, rows):
        return [(dt.datetime.combine(day, dt.time(hh, mm), tzinfo=tz).astimezone(dt.timezone.utc), v, None, None) for hh, mm, v in rows]

    cur = rows_of("https://www.caiso.com/outlook/current/fuelsource.csv")     # 今天的檔失敗就整個來源失敗
    if not cur:
        raise RuntimeError("CAISO current file has no wind rows")
    day0 = today
    if stamp(today, cur[-1:])[0][0] > now + dt.timedelta(minutes=15):         # 剛過午夜時「今天」的檔可能還是昨天的
        day0 = today - dt.timedelta(days=1)
    pts = stamp(day0, cur)
    for k in (1, 2):                                                          # 前兩天的檔只補歷史，缺了不影響此刻值
        day = day0 - dt.timedelta(days=k)
        try:
            pts += stamp(day, rows_of(f"https://www.caiso.com/outlook/history/{day:%Y%m%d}/fuelsource.csv"))
        except Exception as e:  # noqa: BLE001
            print(f"CAISO history {day}: {e}", file=sys.stderr)
    return pts, None


def fetch_be(now):
    """Elia：比利時離岸＋法蘭德斯、瓦隆陸域（輸電網與配電網各一列，共 5 列）每 15 分鐘「實測並推估到全部容量」的 MW。
    近即時資料集 ods086 只有今天，較早的時段補歷史資料集 ods031；五列齊全的時段才加總。容量為 ods086 最新時段的「監測容量」合計。"""
    base = "https://opendata.elia.be/api/explore/v2.1/catalog/datasets/{}/exports/json?"
    slots, cap = {}, {}
    for ds, col in (("ods031", "measured"), ("ods086", "realtime")):                # 後讀的近即時資料覆蓋歷史資料
        q = urllib.parse.urlencode({"select": f"datetime,offshoreonshore,{col},monitoredcapacity",
                                    "where": f"datetime >= now(hours=-{HIST_HOURS + 1}) and {col} is not null"})
        rows = get_json(base.format(ds) + q)
        got = {}
        for r in rows:
            t = dt.datetime.fromisoformat(r["datetime"])
            got.setdefault(t, []).append(r)
        for t, rs in got.items():
            if len(rs) == 5:
                slots[t] = rs
                if ds == "ods086":
                    cap[t] = sum(x.get("monitoredcapacity") or 0 for x in rs)
    pts = []
    for t, rs in slots.items():
        col = "realtime" if "realtime" in rs[0] else "measured"
        off = sum(x[col] for x in rs if x["offshoreonshore"] == "Offshore")
        on = sum(x[col] for x in rs if x["offshoreonshore"] == "Onshore")
        pts.append((t, on + off, on, off))
    return pts, (cap[max(cap)] if cap else None)


def fetch_pl(now):
    """PSE：www.pse.pl 首頁「Mapa KSE」的即時快照（陸域、離岸風電 MW；網頁小工具的資料端點，沒有公開文件），
    歷史補 api.raporty.pse.pl his-wlk-cal 次日公布的每 15 分鐘「風電總發電量」（dtime_utc 是時段結束時間）。"""
    snap = get_json("https://www.pse.pl/transmissionMapService")
    d = snap["data"]["podsumowanie"]
    t = dt.datetime.fromtimestamp(snap["timestamp"] / 1000, dt.timezone.utc)
    on, off = float(d.get("ladowewiatrowe") or 0), float(d.get("morskiewiatrowe") or 0)
    pts = [(t, float(d["wiatrowe"]), on, off)]
    for k in (1, 2):
        day = (now - dt.timedelta(days=k)).astimezone(ZoneInfo("Europe/Warsaw")).date()
        q = urllib.parse.urlencode({"$filter": f"business_date eq '{day:%Y-%m-%d}' and wi ne null", "$select": "dtime_utc,wi", "$first": "200"})
        try:
            rows = get_json("https://api.raporty.pse.pl/api/his-wlk-cal?" + q).get("value", [])
        except Exception as e:  # noqa: BLE001 — 歷史缺了不影響此刻值
            print(f"PL history {day}: {e}", file=sys.stderr)
            continue
        for r in rows:
            end = dt.datetime.strptime(r["dtime_utc"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=dt.timezone.utc)
            pts.append((end - dt.timedelta(minutes=15), float(r["wi"]), None, None))
    return pts, None


def fetch_eirgrid(region):
    """EirGrid Smart Grid Dashboard（全島網頁背後的資料端點，沒有公開文件）：ROI＝愛爾蘭共和國、NI＝北愛爾蘭（SONI），
    每 15 分鐘的風電估計 MW。時間是愛爾蘭當地時間、不帶時區；一次取三天，尚未到的時段是 null。"""
    def fetch(now):
        tz = ZoneInfo("Europe/Dublin")
        today = now.astimezone(tz).date()
        q = urllib.parse.urlencode({"region": region, "chartType": "wind", "dateRange": "day", "areas": "windactual",
                                    "dateFrom": f"{today - dt.timedelta(days=2):%d-%b-%Y}", "dateTo": f"{today:%d-%b-%Y}"})
        rows = get_json("https://www.smartgriddashboard.com/api/chart/?" + q)["Rows"]
        return [(dt.datetime.strptime(r["EffectiveTime"], "%d-%b-%Y %H:%M:%S").replace(tzinfo=tz), float(r["Value"]), None, None)
                for r in rows if r.get("Value") is not None and r.get("FieldName") == "WIND_ACTUAL"], None
    return fetch


def fetch_kr(now):
    """KPX 實時電力供需現況（發電源別）的圖表頁：網頁內嵌 `var ictArr = [...]`，每 5 分鐘的瞬時值（KST），
    風電欄 windPower（2024-11-23 起單獨列出）；以日期區間一次取三天，尚未到的時段 regDate 為 "0"。"""
    tz = ZoneInfo("Asia/Seoul")
    today = now.astimezone(tz).date()
    q = urllib.parse.urlencode({"mid": "a10404030000", "device": "chart",
                                "view_sdate": f"{today - dt.timedelta(days=2):%Y-%m-%d}", "view_edate": f"{today:%Y-%m-%d}"})
    html = get("https://www.kpx.or.kr/powerSource.es?" + q, timeout=90)
    m = re.search(r"var ictArr\s*=\s*(\[\{.*?\}\]);", html, re.S)
    if not m:
        raise RuntimeError("KPX page layout changed (no ictArr)")
    pts = []
    for r in json.loads(m.group(1)):
        if r.get("regDate") in (None, "", "0") or r.get("windPower") in (None, ""):
            continue
        pts.append((dt.datetime.strptime(r["regDate"], "%Y-%m-%d %H:%M").replace(tzinfo=tz), float(r["windPower"]), None, None))
    return pts, None


NAT_FETCH = {"GB": fetch_gb, "DE": fetch_de, "FR": fetch_fr, "DK": fetch_dk, "ERCOT": fetch_ercot, "CAISO": fetch_caiso,
             "BE": fetch_be, "PL": fetch_pl, "IE": fetch_eirgrid("ROI"), "NI": fetch_eirgrid("NI"), "KR": fetch_kr}


def nat_entry(key, pts, cap, now, prev=None):
    """最新一筆為「此刻」；歷史為過去 48 小時每個 UTC 整點的平均，h = [起始整點, [MW…]]。
    來源本身不足 48 小時的（ERCOT 只有昨天與今天），較早的小時沿用上一次的檔案；仍缺的寫 null。"""
    pts = sorted({p[0].astimezone(dt.timezone.utc): p for p in pts if p[0] <= now + dt.timedelta(minutes=10)}.values(), key=lambda p: p[0])
    if not pts:
        raise RuntimeError("no data points")
    t, mw, on, off = pts[-1]
    t = t.astimezone(dt.timezone.utc)
    h_end = t.replace(minute=0, second=0, microsecond=0)
    h0 = h_end - dt.timedelta(hours=HIST_HOURS - 1)
    buckets = {}
    for p in pts:
        tt = p[0].astimezone(dt.timezone.utc)
        if tt >= h0:
            buckets.setdefault(tt.replace(minute=0, second=0, microsecond=0), []).append(p[1])
    hours = [h0 + dt.timedelta(hours=i) for i in range(HIST_HOURS)]
    old = {}
    if prev and prev.get("h"):
        p0 = dt.datetime.fromisoformat(prev["h"][0].replace("Z", "+00:00"))
        old = {p0 + dt.timedelta(hours=i): v for i, v in enumerate(prev["h"][1]) if v is not None}
    vals = [round(sum(buckets[h]) / len(buckets[h])) if h in buckets else old.get(h) for h in hours]
    e = {**NAT[key], "time": iso_utc(t), "ok": True, "mw": round(mw, 1), "h": [iso_utc(h0), vals]}
    if on is not None and off is not None:
        e["on"], e["off"] = round(on, 1), round(off, 1)
    if cap:
        e["cap"] = round(cap, 1)
    return e


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
    nat = dict(prev.get("nat", {}))
    for key, fetch in NAT_FETCH.items():
        try:
            pts, cap = fetch(now)
            nat[key] = nat_entry(key, pts, cap, now, nat.get(key))
            changed = True
            e = nat[key]
            print(f"{key}: {e['time']} · {e['mw']:,.0f} MW · {sum(v is not None for v in e['h'][1])}/{HIST_HOURS} hourly means")
        except Exception as e:  # noqa: BLE001
            print(f"{key}: FAILED {e}", file=sys.stderr)
            if key in nat:
                nat[key] = {**nat[key], "ok": False, "error": str(e)[:200]}
    if not changed and not grids and not nat:
        sys.exit("all sources failed and no previous data")
    out = {"updated": iso_utc(now), "grids": grids, "farms": sorted(farms, key=lambda f: (f["grid"], -f["cap"])), "hist": hist, "nat": nat,
           "notice": {"AEMO": "Source: Australian Energy Market Operator (AEMO), NEMWeb Dispatch_SCADA",
                      "AESO": "© 2026 THE INDEPENDENT SYSTEM OPERATOR (\"ISO\"). All rights reserved. Source: AESO Current Supply Demand report",
                      "IESO": "Copyright © 2004-2022 Independent Electricity System Operator, all rights reserved. This information is subject to the Terms of Use set out in the IESO's website (www.ieso.ca)",
                      **{k: v.format(year=now.year, date=now.strftime("%Y-%m-%d")) for k, v in NAT_NOTICE.items()}}}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), f"({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
