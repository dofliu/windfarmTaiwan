#!/usr/bin/env python3
"""重大事件與事故資料層：把人工查證的事件清單（CSV）轉成網站用的 JSON，並輸出中英文對照文件。
Major events & incidents layer: turns the hand-verified event list (CSV) into the site's JSON and writes the bilingual docs.

    python3 tools/build_events.py
        讀 data/global/sources/events_2026-09.csv（使用者 2026-09-28 整理、逐筆附一手來源）
        寫 data/global/events.json、docs/events.md、docs/events.en.md

原則 · Rules
    - CSV 是唯一的資料來源；欄位不改寫、數字不臆測，查不到的欄位留空。
      The CSV is the single source; values are copied as they are and blanks stay blank.
    - 英文的標題、摘要與各項附註寫在本檔的 EN（依事件 ID）；新增事件時要一起補英文，建置時檢查每筆都有。
      English titles, summaries and notes live in EN below, keyed by event id; the build stops if one is missing.
    - 事件與風場的對應寫在 FARMS（名稱要與 data/global/wind_farms.json 完全一致，建置時檢查）；對不到的不猜。
      Event-to-farm links live in FARMS (exact names from wind_farms.json, checked at build time); unmatched events stay unmatched.
    - 照片只記錄頁面網址與權利狀態，不下載、不內嵌（CSV 明列各張照片需另洽權利人）。
      Photos are recorded as page URLs with their rights status only; nothing is downloaded or embedded.
只用 Python 標準函式庫。Standard library only.
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data/global/sources/events_2026-09.csv"
OUT = ROOT / "data/global/events.json"
DOC_ZH = ROOT / "docs/events.md"
DOC_EN = ROOT / "docs/events.en.md"
FARMS_JSON = ROOT / "data/global/wind_farms.json"

# ---------------------------------------------------------------- 國家 · countries (CSV 的中文國名 → ISO3)
ISO = {"美國": "USA", "丹麥": "DNK", "中國": "CHN", "英國": "GBR", "荷蘭": "NLD", "日本": "JPN", "摩洛哥": "MAR", "澳洲": "AUS",
       "南韓": "KOR", "肯亞": "KEN", "台灣": "TWN", "巴西": "BRA", "沙烏地阿拉伯": "SAU", "挪威": "NOR", "加拿大": "CAN", "法國": "FRA", "瑞典": "SWE", "德國": "DEU"}
CONT = {"北美洲": "NA", "歐洲": "EU", "亞洲": "AS", "非洲": "AF", "大洋洲": "OC", "南美洲": "SA"}

# ---------------------------------------------------------------- 分類 · categories (事件類型 → 代碼；子類、階段等固定詞的英文)
CAT = {"發展里程碑": "ms", "事故／故障": "inc", "政策／社會": "pol", "政策／投資": "pol"}
CAT_LABEL = {"ms": ["發展里程碑", "Milestone"], "inc": ["事故／故障", "Incident / failure"], "pol": ["政策與社會", "Policy & society"]}
SITE = {"陸域": "on", "離岸": "off"}
PREC = {"日": "d", "月": "m", "年": "y"}
SUB_EN = {
    "啟用／建置": "Commissioning / construction", "設備事故": "Equipment accident", "電網／系統事件": "Grid / system event",
    "塔架／基礎失效": "Tower / foundation failure", "塔架倒塌／基礎失效": "Tower collapse / foundation failure", "原住民族權利／司法": "Indigenous rights / court ruling", "轉子脫落": "Rotor detachment",
    "塔架倒塌": "Tower collapse", "浮體製造瑕疵／延後商轉": "Floater manufacturing defect / delayed start", "潤滑油洩漏／復發": "Lubricant leak (recurring)",
    "大型開發取消": "Major project cancelled", "葉片受損": "Blade damage", "葉片斷裂／碎片漂流": "Blade failure / debris drift",
    "葉片斷裂": "Blade failure", "工作者高處墜落／重傷": "Worker fall from height / serious injury", "吊裝工程死亡": "Lifting-work fatality",
    "塔架焊縫疲勞／倒塔": "Tower weld fatigue / collapse", "輸出海纜受損／工期延後": "Export cable damage / schedule delay",
    "塔架折彎／老舊機組": "Tower buckling (ageing turbine)", "維修火災／人員死亡": "Maintenance fire / fatalities", "風機火災": "Turbine fire",
    "颱風／塔架倒塌": "Typhoon / tower collapse", "機艙火災": "Nacelle fire", "塔架倒塌／飛車": "Tower collapse / overspeed", "塔架倒塌／葉片缺陷": "Tower collapse / blade defect",
    "風機火災與倒塌": "Turbine fire and collapse", "風機火災／野火": "Turbine fire / wildfire", "氣體外洩／窒息": "Gas release / asphyxiation", "工作者高處墜落／死亡": "Worker fall from height / fatality",
}
STAGE_EN = {
    "建成": "built", "已退役": "retired", "營運": "operating", "營運維修": "operation & maintenance", "跨案場系統事故": "multi-site system incident",
    "營運中斷／整修": "operation interrupted / repairs", "營運；後續協商處理": "operating; follow-up negotiations", "首發電／施工中": "first power / under construction",
    "施工中": "under construction", "營運中斷": "operation interrupted", "揭幕（商轉狀態另查）": "inaugurated (commercial status to be checked)",
    "停止開發": "development ceased", "施工／試運轉": "construction / commissioning", "工程完成": "construction complete", "全容量併網": "full capacity connected",
    "施工／部分送電": "construction / partial power", "首發電／分期建設": "first power / staged build-out", "營運／故障": "operating / failure",
    "施工／修復": "construction / repair", "營運／事故": "operating / incident", "試運轉／部分營運": "commissioning / partly operating",
    "工程完成／待全面商轉": "construction complete / awaiting full operation", "首發電／持續施工": "first power / construction continuing",
    "停機（電源關閉）": "stopped (power switched off)", "試運轉": "commissioning",
}
VERIFY_EN = {"主管機關／業主一手資料": "primary source (regulator / owner)", "業主公告索引核對，細節待補": "checked against the owner's notice index; details pending",
             "搜尋結果摘要核對（原文待 check_quotes 核對）": "checked against search-result summaries (quoted passages still to be verified with check_quotes)",
             "媒體報導核對（出處原文已以 check_quotes 核對）": "press reports (quoted passages checked with check_quotes)"}
ORG_EN = {
    "上海市政府": "Shanghai Municipal Government", "美國 OSHA": "US OSHA", "荷蘭國會官方答覆／NOS": "Dutch parliamentary answer / NOS", "日本經產省 METI": "Japan METI",
    "韓國南東發電 KOEN": "Korea South-East Power (KOEN)", "BKW（投資方）": "BKW (investor)", "挪威國家人權機構 NIM": "Norwegian National Human Rights Institution (NIM)",
    "中國三峽集團": "China Three Gorges Corporation", "美國 BSEE／Vineyard Wind": "US BSEE / Vineyard Wind", "美國 BSEE 事故調查": "US BSEE incident investigation",
    "中國三峽集團採購平台": "China Three Gorges procurement platform", "中國國家能源局東北監管局": "NEA Northeast Regulatory Bureau (China)",
    "Ørsted 募資公開說明書": "Ørsted rights-issue prospectus", "戶田建設／日本經產省": "Toda Corporation / Japan METI", "韓國氣候能源環境部": "Korea Ministry of Climate, Energy and Environment",
    "韓國勞動部／氣候能源環境部": "Korea Ministry of Employment and Labor / Ministry of Climate, Energy and Environment", "台灣經濟部能源署": "Taiwan Energy Administration, MOEA",
    "Ørsted Taiwan／經濟部能源署": "Ørsted Taiwan / Energy Administration, MOEA", "Chubu Electric／戶田建設": "Chubu Electric / Toda Corporation",
    "自由時報／華藝線上圖書館（鑑定論文）": "Liberty Times / Airiti Library (forensic paper)", "自由時報／公視新聞網／中央社": "Liberty Times / PTS News / CNA", "TVBS 新聞": "TVBS News",
    "沖繩電力（調查結果）／東京大學石原研究室論文": "Okinawa Electric Power (investigation results) / Ishihara Lab, University of Tokyo", "日本經濟新聞／神戶新聞": "Nikkei / Kobe Shimbun",
    "WindAction 轉載最終調查報告／維基百科": "final investigation report (via WindAction) / Wikipedia", "Renewables Now（引用 SHK 調查）／Recharge": "Renewables Now (citing the SHK investigation) / Recharge",
    "Nordex 聲明／Windpower Monthly": "Nordex statement / Windpower Monthly", "Øyfjellet Wind 公告／Windpower Monthly": "Øyfjellet Wind announcement / Windpower Monthly",
    "Reuters（經 MarketScreener）／Windpower Monthly": "Reuters (via MarketScreener) / Windpower Monthly", "首爾新聞／Newsis": "Seoul Shinmun / Newsis",
    "Bloomberg／Renewables Now": "Bloomberg / Renewables Now", "Click Petróleo e Gás／Recharge": "Click Petróleo e Gás / Recharge", "Recharge／Windpower Monthly": "Recharge / Windpower Monthly",
    "E&T（IET）／Nordex 調查報告（UNECE 存檔）": "E&T (IET) / Nordex investigation report (archived by UNECE)", "WBCK（地方媒體）／Huron Daily Tribune（經 wind-watch 轉載）": "WBCK (local media) / Huron Daily Tribune (via wind-watch)",
    "Seattle Times／Yakima Herald": "Seattle Times / Yakima Herald", "北極星風力發電網（轉載國家電監會通報）／中國新聞網": "Bjx.com.cn (reposting the SERC notice) / China News Service",
    "羊城晚報／界面新聞": "Yangcheng Evening News / Jiemian News", "勞動部職業安全衛生署／工商時報": "Occupational Safety and Health Administration (Taiwan) / Commercial Times",
    "Windpower Monthly／Recharge（引用 EnBW、Vestas 聲明）": "Windpower Monthly / Recharge (citing EnBW and Vestas statements)", "NBC Palm Springs／KESQ": "NBC Palm Springs / KESQ",
    "Windpower Monthly／Recharge": "Windpower Monthly / Recharge", "Windpower Monthly／The Well News": "Windpower Monthly / The Well News", "Enid News／KFOR": "Enid News / KFOR",
    "North American Windpower／Windpower Monthly": "North American Windpower / Windpower Monthly", "CBC News": "CBC News", "Recharge／reNEWS": "Recharge / reNEWS",
    "沖繩電力（調查結果）": "Okinawa Electric Power (investigation results)", "Electronics Weekly（引述 New Scientist 對調查報告的報導）": "Electronics Weekly (citing New Scientist's report on the investigation)",
    "EnergyWatch（引述瑞典事故調查局 SHK）／Recharge": "EnergyWatch (citing the Swedish Accident Investigation Authority, SHK) / Recharge",
    "Insurance Journal（Bloomberg）／Windpower Monthly／Recharge": "Insurance Journal (Bloomberg) / Windpower Monthly / Recharge", "RenewEconomy／The Well News": "RenewEconomy / The Well News",
    "Enid News／Windpower Monthly": "Enid News / Windpower Monthly", "Bloomberg Línea／eixos": "Bloomberg Línea / eixos",
    "Click Petróleo e Gás（引述 GE 與 AES Brasil 聲明）": "Click Petróleo e Gás (citing the GE and AES Brasil statements)", "NS Energy／Power Technology": "NS Energy / Power Technology",
    "中國新聞網（新華網，引述國家電監會）": "China News Service (Xinhua, citing the State Electricity Regulatory Commission)", "界面新聞": "Jiemian News",
}
PHOTO_KIND_EN = {
    "未確認有對應照片": "no matching photo confirmed", "歷史風場照片／頁面示意": "historic farm photo / page illustration", "風場照片／官方報導頁": "farm photo on the owner's news page",
    "東海大橋風場照片／原刊媒體攝影": "Donghai Bridge farm photo (original press photography)", "事故火災現場照／RTL、攝影 Kees van Wuyckhuyse": "fire-scene photo (RTL, photographer Kees van Wuyckhuyse)",
    "業主新聞頁圖片（需逐張核對）": "images on the owner's news page (check each)", "風場照片／業主頁面": "farm photo on the owner's page", "官方揭幕新聞頁圖片（需逐張核對）": "official inauguration news images (check each)",
    "風場照片／官方頁面": "farm photo on the official page", "風場施工照片／業主頁面": "construction photo on the owner's page", "風場照片／業主專案頁": "farm photo on the owner's project page",
    "風場照片／官方專案頁": "farm photo on the official project page", "專案新聞頁圖片（需核對是否風場）": "project news image (check it shows the farm)", "Fosen 風機照片": "Fosen turbine photo",
    "Storheia 風機照片／非判決當日": "Storheia turbine photo (not from the ruling day)", "安裝風機照片／業主新聞頁": "turbine installation photo on the owner's news page",
    "風場照片／官方新聞頁": "farm photo on the official news page", "兩港風場官方照片": "official photos of both port farms", "風場照片／業主新聞頁": "farm photo on the owner's news page",
    "風場／揭幕新聞頁圖片": "farm / inauguration news images", "風場／活動頁面圖片": "farm / event page images", "風場／揭幕新聞頁圖片": "farm / inauguration news images",
    "風場／活動新聞頁圖片": "farm / event news images", "風場施工照片／業主新聞頁": "construction photo on the owner's news page", "事故斷裂葉片現場照／Nantucket Current 攝影": "broken-blade scene photo (Nantucket Current)",
    "風場照片／業主專案頁": "farm photo on the owner's project page", "風場施工／首發電新聞頁圖片": "construction / first-power news images", "工安示意圖／非事故現場照片": "safety illustration, not a scene photo",
    "專案照片媒體庫（含營運風場照）": "project media library (includes operating-farm photos)", "風場／商轉新聞頁圖片": "farm / commissioning news images",
    "浮體／風場照片（業主頁）": "floater / farm photo (owner's page)", "事故火災與葉片墜落現場照／讀者提供": "fire and fallen-blade scene photo (reader-submitted)",
    "事故火災現場照／雲林縣消防局提供 CNA": "fire-scene photo (Yunlin fire department via CNA)", "風場一般照片，非事故火災畫面": "general farm photo, not of the fire",
    "典禮照／風場新聞頁圖片，須核對單張": "ceremony / farm news images (check each)", "首發電／風場業主新聞頁圖片": "first-power / owner's news images",
}
RIGHTS_EN = {
    "業主網站；公開使用需取得授權": "owner's website; permission needed for public use", "原攝影／媒體權利；市府轉載不代表可再利用": "original photographer / media rights; the government repost does not grant reuse",
    "有著作權；正式導覽引用須先取得授權": "copyrighted; permission needed before use in a guided tour", "Equinor 攝影作品；公開使用需授權": "Equinor photography; permission needed for public use",
    "KOEN 網站；公開使用需授權": "KOEN website; permission needed for public use", "Ørsted 網站；公開使用需授權": "Ørsted website; permission needed for public use",
    "Enel 網站；公開使用需授權": "Enel website; permission needed for public use", "Masdar 網站；公開使用需授權": "Masdar website; permission needed for public use",
    "BKW／攝影者權利；公開使用需授權": "BKW / photographer rights; permission needed for public use", "NIM／攝影者 Hanna Jhore；公開使用需授權": "NIM / photographer Hanna Jhore; permission needed for public use",
    "EDF／攝影者權利；公開使用需授權": "EDF / photographer rights; permission needed for public use", "業主網站；公開使用需授權": "owner's website; permission needed for public use",
    "AOW 網站；公開使用需授權": "AOW website; permission needed for public use", "Vattenfall 網站；公開使用需授權": "Vattenfall website; permission needed for public use",
    "GPSC 網站；公開使用需授權": "GPSC website; permission needed for public use", "三峽集團網站；公開使用需授權": "China Three Gorges website; permission needed for public use",
    "Nantucket Current／攝影者授權必要": "Nantucket Current / photographer permission required", "ACCIONA 網站；公開使用需授權": "ACCIONA website; permission needed for public use",
    "WorkSafe 圖示；使用條件需另查": "WorkSafe illustration; terms of use to be checked", "EDF／攝影者權利；逐張授權": "EDF / photographer rights; permission per image",
    "戶田建設網站；公開使用需授權": "Toda Corporation website; permission needed for public use",
    "Equinor 網站；公開使用需授權": "Equinor website; permission needed for public use",
    "Yonhap 標示 PHOTO NOT FOR SALE；勿直接下載或重製，另洽權利人": "Yonhap marks it PHOTO NOT FOR SALE; do not download or reproduce, contact the rights holder",
    "中央社／消防局照片；公開使用前查權利": "CNA / fire department photo; check rights before public use", "Ørsted／中央社圖片；公開使用需授權": "Ørsted / CNA images; permission needed for public use",
}

# ---------------------------------------------------------------- 事件與風場的對應 · event → farms (exact names in wind_farms.json)
# 2026-09-28 第二批（WIND-060 起）先依搜尋結果摘要整理，2026-09-29 逐筆以 tools/check_quotes.py 核對出處原文（54 個出處全部 OK），
# 對不上的改寫或換來源（Rei dos Ventos 是第 3 園區、Fenner 是 Enron 1.5 MW、酒泉損失出力與文昌受損部數等未核對的數字刪除）。
# The second batch (from WIND-060) was first compiled from search-result summaries and then checked source by source with check_quotes.py on
# 2026-09-29 (all 54 sources OK); rows that did not check out were rewritten or given other sources.
FARMS = {
    "WIND-002": ["Vindeby"], "WIND-003": ["Horns Rev 1"], "WIND-004": ["Donghai Bridge"], "WIND-005": ["Endeavor wind farm · 1, 2"],
    "WIND-006": ["London Array"], "WIND-007": ["Piet De Wit wind farm · 1"], "WIND-009": ["Tarfaya"], "WIND-011": ["Block Island"],
    "WIND-012": ["Hywind Scotland"], "WIND-013": ["Tamra (Jeju Hangyeong)"], "WIND-014": ["Lake Turkana"], "WIND-015": ["Hornsea One"],
    "WIND-016": ["Formosa 1 Phase 2"], "WIND-017": ["Lagoa dos Ventos"], "WIND-018": ["Dumat Al Jandal"], "WIND-019": ["Storheia (Fosen)", "Roan (Fosen)"],
    "WIND-020": ["Kent Hills wind farm · 1, 2"], "WIND-021": ["Storheia (Fosen)", "Roan (Fosen)"], "WIND-022": ["Saint-Nazaire (Banc de Guérande)"],
    "WIND-023": ["Anholt"], "WIND-024": ["Hornsea Two"], "WIND-025": ["Hinggan (Xing'an) League base"], "WIND-026": ["CGN Huizhou Gangkou I"],
    "WIND-027": ["Akita Port", "Noshiro Port"], "WIND-028": ["Rokkasho-Mura wind farm"], "WIND-029": ["Goto City Offshore floating project"],
    "WIND-030": ["Hywind Tampen"], "WIND-031": ["Noshiro Port"], "WIND-032": ["Hollandse Kust Zuid I & II", "Hollandse Kust Zuid III & IV"],
    "WIND-033": ["Seagreen Phase 1"], "WIND-035": ["South Fork Wind"], "WIND-036": ["Greater Changhua 1 & 2a"], "WIND-037": ["Dogger Bank A"],
    "WIND-038": ["Changfang & Xidao"], "WIND-039": ["CTG Zhangpu Liu'ao Phase 2"], "WIND-040": ["Vineyard Wind 1"], "WIND-041": ["Dogger Bank A"],
    "WIND-042": ["Viking"], "WIND-043": ["Vineyard Wind 1"], "WIND-044": ["MacIntyre"], "WIND-046": ["CTG Yangjiang Qingzhou 6"],
    "WIND-047": ["Heilongjiang Tonghe (Guoneng) wind farm"], "WIND-048": ["Heilongjiang Tonghe (Guoneng) wind farm"], "WIND-049": ["Provence Grand Large"],
    "WIND-050": ["Greater Changhua 2b & 4"], "WIND-051": ["Yunlin"], "WIND-052": ["Goto City Offshore floating project"], "WIND-053": ["Yeongdeok"],
    "WIND-054": ["Kitakyushu Hibikinada"], "WIND-055": ["Revolution Wind"], "WIND-056": ["Yeongdeok"], "WIND-057": ["Yunmai (Mailiao)"], "WIND-058": ["Greater Changhua 2b & 4"], "WIND-059": ["Greater Changhua 2b & 4"],
    # 2026-09-28 第二批（搜尋整理的故障事件） · second batch (incidents compiled from searches)
    "WIND-060": ["Taichung Port"], "WIND-061": ["Taichung Port", "Shimen"], "WIND-062": ["Taichung Port"], "WIND-066": ["Ardrossan wind farm"], "WIND-067": ["Lemnhult wind farm"],
    "WIND-069": ["Fenner Wind Power Project"], "WIND-070": ["Raleigh wind farm"], "WIND-071": ["Aldermyrberget wind farm"], "WIND-072": ["Øyfjellet"], "WIND-073": ["Herkentrup wind farm"],
    "WIND-074": ["Frontier Windpower I & II"], "WIND-075": ["Maverick Wind Project"], "WIND-076": ["Odal wind farm"], "WIND-077": ["Geumseongsan wind power plant"], "WIND-078": ["Santo Agostinho"],
"WIND-081": ["Screggagh wind farm"], "WIND-082": ["Harvest (Exelon) wind farm"], "WIND-083": ["Juniper Canyon wind farm"], "WIND-086": ["Hai Long 2 & 3"],
    "WIND-087": ["EnBW He Dreiht"],
    # 對不到的 · unmatched (left out on purpose): WIND-001 Crotched Mountain (not in the farm layer), WIND-008 Kunimidake (the 2013 farm is not
    # in the layer; the listed entry is a later project), WIND-010 (grid-wide), WIND-034 Ocean Wind (cancelled, not in the layer), WIND-045 Rokewood
    # (official site name pending per the source). WIND-057 Taipower Mailiao = Yunmai (Mailiao): Taipower's only Mailiao farm, Vestas V80 2 MW ×23
    # (second batch of 7 commissioned 2010/2011, matching the "2010-05-27, 2 MW Vestas, unit 17" in the official notice).
    # Second batch unmatched: WIND-079 Rei dos Ventos (the incident was at park 3; the layer only has Rei dos Ventos 1), WIND-063 Miyakojima 2003 (the 2007/2008 records are later, different turbines), WIND-064 Awaji park turbine (single
    # municipal turbine, not in the layer), WIND-065 Hornslet (not in the layer), WIND-068 Haltern AV9 (the layer's Haltern Ennenberg is a different
    # park), WIND-080 Delta 6 (not in the layer), WIND-084 Jiuquan (grid-wide), WIND-085 Wenchang repowering (cannot confirm which record), WIND-088 (farm not named).
}

# ---------------------------------------------------------------- 英文 · English text per event: title, summary, area, then optional notes
# 鍵 · keys: t 標題, s 摘要, a 行政區或海域, p 風場或專案（英文名）, cap 容量口徑, coord 座標說明, cas 傷亡註記, note 特別註記, st 開工資訊, cod 完成或商轉資訊, fd 基礎型式, tb 機組廠牌型號, own 開發商
EN = {
    "WIND-001": {"t": "One of the world's first commercial wind farms is built", "s": "US Windpower installed 20 turbines of 30 kW; the UMass Wind Energy Center calls it the world's first wind farm.",
                 "a": "Crotched Mountain, New Hampshire", "p": "Crotched Mountain", "cap": "20 × 0.03 MW", "own": "US Windpower", "note": "The historical \"first\" follows the source's definition; it is not the first power-generating turbine."},
    "WIND-002": {"t": "World's first offshore wind farm connected to the grid", "s": "Eleven Bonus 450 kW turbines, officially described as about 5 MW; decommissioned in 2017.",
                 "a": "off Lolland", "p": "Vindeby", "cap": "11 × 0.45 = 4.95 MW; officially rounded to 5 MW", "fd": "gravity base (historic site)", "cod": "grid-connected 1991; decommissioned 2017", "own": "DONG Energy / predecessor of Ørsted"},
    "WIND-003": {"t": "160 MW-class offshore wind farm scales up commercial offshore wind", "s": "Eighty Vestas 2 MW turbines; an early large commercial offshore wind farm.",
                 "a": "Horns Rev, North Sea", "p": "Horns Rev 1", "cap": "80 × 2 MW", "fd": "monopile (reference technical data)", "cod": "2002", "own": "Elsam / later Ørsted-related assets", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-004": {"t": "Asia's early commercial offshore wind farm, 102 MW, fully connected", "s": "Thirty-four 3 MW turbines; the Shanghai city government's historical report gives 8 June as the date all units were connected.",
                 "a": "Donghai Bridge, Shanghai", "p": "Donghai Bridge Phase I", "cap": "34 × 3 MW", "fd": "high-rise pile cap", "st": "offshore works started 2008-09", "cod": "all units connected 2010-06-08", "own": "Shanghai Donghai Wind Power and partners",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "The news page is dated 2010-08-28; the full connection itself happened on 2010-06-08."},
    "WIND-005": {"t": "Maintenance worker dies in a fall", "s": "OSHA records a worker falling through an opening inside a turbine; he was pronounced dead in hospital after rescue.",
                 "a": "near Ocheyedan, Iowa", "p": "Endeavor 1", "own": "NextEra Energy Resources", "cas": "OSHA explicitly records 1 death; no other counts reported"},
    "WIND-006": {"t": "630 MW London Array officially opened", "s": "175 Siemens 3.6 MW turbines, the world's largest offshore wind farm at the time.",
                 "a": "outer Thames Estuary", "p": "London Array 1", "cap": "175 × 3.6 MW", "fd": "monopile", "cod": "commercial operation 2013", "own": "DONG Energy and joint-venture partners", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-007": {"t": "Nacelle fire kills two technicians", "s": "A fire broke out at the top of a turbine during maintenance and two workers died; parliament demanded an investigation, and the root cause cannot be inferred from photos.",
                 "a": "Ooltgensplaat / Mariadijk", "p": "Piet de Wit / Mariadijk turbine", "note": "The widely shared \"embracing selfie\" image is not included; it has not been confirmed to belong to this incident."},
    "WIND-008": {"t": "Turbine fire with blade and other parts falling", "s": "A METI safety notice lists a fire that caused blades to fall and asks operators to inspect and prevent recurrence.",
                 "a": "Mt Kunimi, Fukui Prefecture", "p": "Kunimidake wind farm", "note": "The public notice does not confirm casualties or the cause of the fire; left blank."},
    "WIND-009": {"t": "Africa's largest wind farm at the time enters full commercial operation", "s": "301 MW from 131 turbines of 2.3 MW; a joint venture of ENGIE and Nareva.",
                 "a": "Tarfaya, Atlantic coast", "p": "Tarfaya", "cap": "131 × 2.3 ≈ 301 MW", "cod": "full commercial operation 2014-12-08", "own": "GDF SUEZ / ENGIE, Nareva"},
    "WIND-010": {"t": "South Australia blackout and the interaction with wind-farm protection settings", "s": "A storm first destroyed transmission lines; after repeated voltage disturbances, protection settings at some wind farms cut output sharply, the interconnector tripped and the whole state lost power.",
                 "a": "several wind farms / grid, South Australia", "p": "South Australian wind farms and transmission system (multi-site)", "note": "A multi-factor grid event; it must not be described as \"wind power alone caused the blackout\". No single farm coordinate."},
    "WIND-011": {"t": "First commercial offshore wind farm in the United States starts operating", "s": "Five 6 MW turbines, 30 MW in total; supplying the island in December and exporting to the Rhode Island grid from the 12th.",
                 "a": "off Block Island, Rhode Island", "p": "Block Island", "cap": "5 × 6 MW", "fd": "jacket", "cod": "commercial operation 2016-12", "own": "Deepwater Wind, later acquired by Ørsted",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "BOEM material states commercial operation on 2 Dec and export to the mainland grid on 12 Dec separately."},
    "WIND-012": {"t": "World's first floating wind farm starts generating", "s": "Five 6 MW turbines on floating spar foundations with mooring systems.",
                 "a": "off Peterhead, Scotland", "p": "Hywind Scotland", "cap": "5 × 6 MW", "fd": "floating spar", "cod": "generation started 2017-10", "own": "Equinor / Masdar", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-013": {"t": "Korea's first commercial offshore wind farm inaugurated", "s": "Ten Korean-made 3 MW turbines; construction started in 2015, was completed in September 2017, and the farm was inaugurated after two months of trial operation.",
                 "a": "off Han-gyeong, western Jeju", "p": "Tamra offshore wind farm", "cap": "10 × 3 MW", "st": "construction started 2015", "cod": "construction complete 2017-09; inaugurated 11-17", "own": "KOEN, Doosan and partners", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-014": {"t": "310 MW wind farm starts delivering power to the national grid", "s": "365 Vestas V52 turbines of 850 kW each; the site was finished in 2017, power flowed in 2018 once the transmission line was completed, and the official inauguration followed in July 2019.",
                 "a": "Marsabit / Lake Turkana", "p": "Lake Turkana Wind Power", "cap": "365 × 0.85 = 310.25 MW; officially 310 MW", "st": "turbines completed 2017", "cod": "power delivered 2018-09; full commercial operation 2019-03; inaugurated 2019-07", "own": "Lake Turkana Wind Power Ltd",
                 "note": "The 2019 inauguration release misprints 356 turbines; 365 is used, consistent with the FAQ, the 2018 notice and later material."},
    "WIND-015": {"t": "Hornsea 1 commissioned; a single wind farm passes 1 GW", "s": "174 turbines, 1,218 MW; the owner's 2019 annual report records it as commissioned.",
                 "a": "North Sea off Yorkshire", "p": "Hornsea 1", "cap": "official export capacity 1,218 MW", "cod": "recorded as commissioned in the owner's 2019 annual report", "own": "Ørsted and partners",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "Early news expected completion in Q1 2020, but the annual report records commissioning in 2019; the date is kept at year precision."},
    "WIND-016": {"t": "Taiwan's first commercial-scale offshore wind farm enters commercial operation", "s": "Construction finished at the end of 2019 and commercial operation began in January 2020; two 4 MW and twenty 6 MW turbines, 128 MW in total.",
                 "a": "off Miaoli", "p": "Formosa 1", "cap": "2 × 4 + 20 × 6 MW", "fd": "monopile", "cod": "completed end of 2019; commercial operation 2020-01", "own": "Ørsted, JERA, Seagull, Stonepeak and partners",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "Inaugurated in 2019-11, but the owner's project page states commercial operation from 2020-01."},
    "WIND-017": {"t": "Large South American onshore wind farm enters full commercial operation", "s": "The initial 716 MW and 230 turbines were fully operating; later expansions raised the capacity recorded under the same name.",
                 "a": "Piauí", "p": "Lagoa dos Ventos (initial phase)", "cap": "2021 initial-phase capacity, excluding later expansions", "cod": "full commercial operation 2021-06", "own": "Enel Green Power",
                 "note": "The official status page now shows 1,063.05 MW after expansion; the event keeps the 716 MW of 2021."},
    "WIND-018": {"t": "Saudi Arabia's first large wind farm delivers first power", "s": "99 Vestas 4.2 MW turbines; the owner announced first generation on 7 August 2021 while turbine installation was still under way.",
                 "a": "Al Jouf / Dumat Al Jandal", "p": "Dumat Al Jandal", "cap": "project output 400 MW; 99 × 4.2 = 415.8 MW nameplate", "st": "construction started 2019-09", "own": "EDF Renewables, Masdar, Nesma",
                 "note": "The event date is the announcement date; first power may have been slightly earlier."},
    "WIND-019": {"t": "Large European onshore wind cluster inaugurated", "s": "Six wind farms and 277 turbines, 1,057 MW in total; construction ran from 2016 to late summer 2020 and the last turbine entered service in January 2021.",
                 "a": "Fosen peninsula", "p": "Fosen Vind (six wind farms)", "cap": "six-farm cluster; do not add to the individual farm records", "st": "construction started 2016-02", "cod": "works completed late summer 2020; inaugurated 2021-08", "own": "Fosen Vind DA, led by Statkraft"},
    "WIND-020": {"t": "Turbine tower collapses; 50 foundations need rebuilding", "s": "A tower collapsed at the 167 MW site; later analysis found an original design flaw at Kent Hills 1 and 2 let foundation cracks grow, requiring 50 foundations to be replaced.",
                 "a": "Kent Hills, New Brunswick", "p": "Kent Hills 1 / 2 / 3", "cap": "Kent Hills total 167 MW, not the capacity affected", "own": "TransAlta", "cas": "the owner reported no injuries from the collapse",
                 "note": "The design root cause was published by a later independent engineering analysis; 50 is the number of foundations replaced, not the number that collapsed."},
    "WIND-021": {"t": "Supreme Court rules the wind-farm licences violate Sámi reindeer-herding rights", "s": "Norway's Supreme Court found the licensing decisions invalid, a landmark case on energy infrastructure and Indigenous rights.",
                 "a": "Fosen peninsula", "p": "Fosen Vind (Storheia / Roan)", "cap": "1,057 MW is the six-farm cluster; the ruling concerns Storheia and Roan", "own": "Fosen Vind DA", "note": "The ruling date is recorded at month precision only."},
    "WIND-022": {"t": "France's first commercial offshore wind farm fully operational", "s": "Eighty GE 6 MW turbines, 480 MW in total.",
                 "a": "off Saint-Nazaire", "p": "Saint-Nazaire", "cap": "80 × 6 MW", "fd": "monopile", "cod": "end of 2022", "own": "EDF Renewables, Enbridge / CPP Investments", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-023": {"t": "Whole rotor with three blades detaches from the nacelle into the sea", "s": "The owner paused turbines of the same SGRE 3.6 / 4.0 MW type for inspection; nobody was hurt.",
                 "a": "off Anholt", "p": "Anholt Offshore Wind Farm", "cap": "farm 400 MW; single unit 3.6 MW by type", "fd": "monopile", "own": "Ørsted and partners", "cas": "the owner explicitly stated no injuries",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "The owner's initial notice only describes the rotor detachment; no root cause is assumed here."},
    "WIND-024": {"t": "1,320 MW Hornsea 2 fully operational", "s": "165 turbines; the world's largest operating offshore wind farm when announced.",
                 "a": "North Sea off Yorkshire", "p": "Hornsea 2", "cap": "165 × 8 MW", "cod": "fully operational 2022-08-31", "own": "Ørsted", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-025": {"t": "3,000 MW onshore wind base enters operation", "s": "CGN states the project entered operation in 2023, then China's largest operating onshore wind base.",
                 "a": "Hinggan League, Inner Mongolia", "p": "CGN Hinggan League wind base", "cap": "wind-base total, not a single wind farm", "own": "CGN", "note": "A base and a single wind farm are defined differently; no global single-farm ranking is implied."},
    "WIND-026": {"t": "Greater Bay Area's first GW-class offshore wind farm in operation", "s": "CGN states the 1,000 MW Huizhou Port offshore project is built and running, the region's first GW-class offshore wind project.",
                 "a": "off Huizhou Port, Guangdong", "p": "CGN Huizhou Port offshore wind", "cap": "total project capacity", "own": "CGN"},
    "WIND-027": {"t": "Japan's large port-based offshore wind farms fully commercial", "s": "13 turbines at Akita Port and 20 at Noshiro Port, all 4.2 MW; Noshiro started in 2022-12 and Akita on 2023-01-31.",
                 "a": "Akita Port / Noshiro Port", "p": "Akita Port and Noshiro Port offshore wind farms", "cap": "33 × 4.2 = 138.6 MW; the owner says about 140 MW", "fd": "fixed-bottom (port project)", "cod": "both ports fully commercial 2023-01-31", "own": "Akita Offshore Wind Corporation (AOW)",
                 "coord": "GEM 2026-02 reference point for Akita Port, not Noshiro Port", "note": "Both ports are combined in one row to avoid double counting with separate Noshiro / Akita rows."},
    "WIND-028": {"t": "GE 1.5s turbine collapses; regulator orders emergency inspections", "s": "One tower collapsed, the farm was shut down and access restricted; METI told operators of the same model to inspect their units.",
                 "a": "Rokkasho, Aomori Prefecture", "p": "Rokkasho-mura wind farm", "cap": "22 × 1.5 MW", "note": "No casualty figures were found in the verifiable official summary; left blank."},
    "WIND-029": {"t": "Manufacturing defects in two floaters delay commercial operation", "s": "Toda Corporation found defects in two floaters being built onshore; the consortium later pushed the commercial-operation target from January 2024 to January 2026.",
                 "a": "Goto, Nagasaki Prefecture / onshore fabrication yard", "p": "Goto floating wind farm", "cap": "whole project 16.8 MW; the incident concerns 2 floaters", "fd": "floating hybrid spar", "own": "consortium led by Toda Corporation",
                 "coord": "GEM reference point of the project area; the defect occurred at the onshore yard", "note": "The date is the first public announcement; when the defects formed is unknown."},
    "WIND-030": {"t": "88 MW floating wind farm officially opened", "s": "Eleven spar floaters supplying offshore oil and gas platforms; partial generation from 2022 and full operation from summer 2023.",
                 "a": "Gullfaks / Snorre, North Sea", "p": "Hywind Tampen", "cap": "system output 88 MW", "fd": "floating spar", "cod": "fully operational summer 2023; opened in August", "own": "Equinor and partners", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-031": {"t": "Oil leak at a Noshiro Port turbine, reported again the same month", "s": "AOW issued a leak notice on 12 September, a recurrence notice on 25 September and a cause statement on 28 September.",
                 "a": "Noshiro Port, Akita Prefecture", "p": "Noshiro Port offshore wind farm", "cap": "Noshiro Port 20 × 4.2 MW; 138.6 MW together with Akita Port", "own": "AOW",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "Month precision. The notice index confirms the three dates, but the individual notices on the old site could not be retrieved, so the leak volume and root cause are left blank."},
    "WIND-032": {"t": "1.5 GW offshore wind farm inaugurated", "s": "139 turbines, officially about 1.5 GW; inauguration is not the same as completing all commissioning steps.",
                 "a": "off the Dutch North Sea coast", "p": "Hollandse Kust Zuid", "cap": "owner states 1.5 GW", "fd": "monopile", "own": "Vattenfall, BASF, Allianz",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "The 2023 annual report expected full operation in 2024; this row records only the 2023 inauguration."},
    "WIND-033": {"t": "Deepest fixed-bottom large offshore wind farm fully operational", "s": "114 Vestas V164-10 MW turbines; deepest foundation at 58.7 m.",
                 "a": "off Angus, Scotland", "p": "Seagreen", "cap": "export / official capacity 1,075 MW; nameplate 114 × 10 = 1,140 MW", "fd": "jacket", "cod": "fully operational 2023-10", "own": "SSE Renewables, TotalEnergies and partners", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-034": {"t": "Ørsted ceases development of two planned offshore wind farms", "s": "The 1,100 MW and 1,148 MW projects were cancelled, reflecting supply-chain, cost and permitting pressures; planned capacity must not be counted as installed.",
                 "a": "off New Jersey (planned)", "p": "Ocean Wind 1 / 2", "cap": "1,100 + 1,148 MW planned, never built", "own": "Ørsted", "note": "A cancelled development plan, not an incident at an operating farm."},
    "WIND-035": {"t": "First commercial-scale offshore wind farm in the United States completed", "s": "Twelve 11 MW turbines, 132 MW in total; all turbines were installed and delivering power on the news date.",
                 "a": "off Long Island, New York", "p": "South Fork Wind", "cap": "12 × 11 MW", "fd": "monopile", "st": "first monopile 2023-06", "cod": "completed / delivering power 2024-03", "own": "Ørsted, Eversource", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-036": {"t": "900 MW and 111 turbines fully grid-connected", "s": "Offshore construction started in March 2021 and first power came in April 2022; all 111 turbines were connected and the farm inaugurated in April 2024.",
                 "a": "off Changhua", "p": "Greater Changhua 1 & 2a", "cap": "allocated / official 900 MW; 111 × 8.0 = 888 MW nameplate", "fd": "jacket", "st": "offshore construction 2021-03", "cod": "all turbines connected 2024-04", "own": "Ørsted, CDPQ, Cathay PE and partners",
                 "coord": "GEM 2026-02 reference point of Greater Changhua 1; the combined project does not mark the centre of 2a", "note": "This row combines 1 and 2a; do not add it to the individual phases."},
    "WIND-037": {"t": "Installed Haliade-X blade damaged", "s": "SSE said one installed blade was damaged and under investigation; the project was still under construction.",
                 "a": "Dogger Bank A, North Sea", "p": "Dogger Bank A", "cap": "phase A planned at 1.2 GW; one damaged blade does not stop the whole farm", "own": "SSE Renewables, Equinor, Vårgrønn",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "The notice said \"last week\", so month precision is used."},
    "WIND-038": {"t": "600 MW offshore wind farm construction completed", "s": "62 Vestas V174-9.6 MW turbines; GPSC and CIP celebrated completion of construction.",
                 "a": "off Changhua", "p": "Changfang & Xidao", "cap": "official 600 MW; 62 × 9.6 = 595.2 MW", "fd": "jacket", "cod": "construction completion ceremony 2024-05", "own": "CIP, GPSC and partners", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-039": {"t": "First farm using 16 MW-class turbines in volume reaches full-capacity connection", "s": "28 turbines and 400.2 MW, including six 16 MW units alongside 14.3 MW and 13 MW units.",
                 "a": "off Liu'ao, Zhangpu, Fujian", "p": "Zhangpu Liu'ao Phase II", "cap": "28 turbines of mixed ratings, not all 16 MW", "fd": "fixed-bottom (not verified per unit)", "cod": "2024-06-27", "own": "China Three Gorges Corporation / CTG Renewables",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "A 20 MW prototype was planned after 2024; this row records the 400.2 MW phase as of June 2024."},
    "WIND-040": {"t": "Blade failure sends debris drifting to Nantucket", "s": "BSEE ordered all turbines to stop generating and required an investigation; beach clean-up and material recovery continued for weeks.",
                 "a": "off Martha's Vineyard, Massachusetts", "p": "Vineyard Wind 1", "cap": "806 MW planned for the whole farm; not all operating that day", "fd": "monopile", "own": "Vineyard Wind (Avangrid / CIP)",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "The later preliminary manufacturing deviation is not written up as the final investigation conclusion."},
    "WIND-041": {"t": "Another Haliade-X blade fails during construction", "s": "SSE confirmed a blade failure on a turbine installed at Dogger Bank A; construction delays and follow-up inspections are assessed separately.",
                 "a": "Dogger Bank A, North Sea", "p": "Dogger Bank A", "cap": "phase A planned capacity", "own": "SSE Renewables, Equinor, Vårgrønn",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "In September the owner said there were three Haliade-X blade events in 2024; this row is specifically 22 August."},
    "WIND-042": {"t": "Shetland's 443 MW onshore wind farm in operation", "s": "103 Vestas turbines; the owner's project page records completion in September.",
                 "a": "Shetland", "p": "Viking Wind Farm", "cap": "103 × 4.3 = 442.9 MW nameplate; another release says 434 MW", "st": "construction started 2020", "cod": "completed 2024-09", "own": "SSE Renewables",
                 "note": "SSE's 2024-08 release says 434 MW and the project page 443 MW; the nameplate sum is used and the difference disclosed."},
    "WIND-043": {"t": "Technician seriously injured in a fall through a tower opening", "s": "BSEE's investigation cited a guardrail not put back, no fall-arrest equipment and poor lighting; the injured worker was flown to hospital by Coast Guard helicopter.",
                 "a": "off Massachusetts / WTG AS-42", "p": "Vineyard Wind 1", "own": "Vineyard Wind", "cas": "BSEE official report: 1 serious injury", "coord": "GEM farm reference point, not the exact position of WTG AS-42",
                 "note": "A separate personal-injury event; do not merge it with the July blade failure."},
    "WIND-044": {"t": "First turbines of the 923 MW project start delivering power", "s": "27 turbines connected in the first batch, 154 MW operating at the time; 923 MW is the whole-farm target, not the capacity in service that day.",
                 "a": "Queensland", "p": "MacIntyre Wind Farm", "cap": "923 MW whole farm; 154 MW connected at this event", "st": "construction from 2022", "own": "ACCIONA Energía, Ark Energy"},
    "WIND-045": {"t": "Blade shifts during construction and kills a worker", "s": "A 79 m blade being prepared for lifting on the ground moved off its support stand and struck a 36-year-old worker.",
                 "a": "Rokewood, Victoria", "p": "Rokewood wind farm site", "cas": "WorkSafe Victoria confirmed 1 death", "note": "The regulator's notice refers to the Rokewood site; the official project name is still to be added."},
    "WIND-046": {"t": "1,000 MW deep-water offshore wind farm reaches full-capacity connection", "s": "74 offshore turbines; the owner's 2026 procurement documents confirm full-capacity connection in December 2024.",
                 "a": "off Qingzhou, Yangjiang, Guangdong", "p": "Qingzhou 6", "cap": "installed capacity as listed by the owner; several turbine ratings", "fd": "fixed-bottom (sub-type to be confirmed per unit)", "cod": "full-capacity connection 2024-12", "own": "CTG Renewables Yangjiang Power Generation",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "An older tender schedule said 2024-06; the actual 2024-12 date from later O&M procurement documents is used."},
    "WIND-047": {"t": "Turbine 14 collapses and crushes a transmission tower", "s": "The official investigation found initial welding defects and fatigue cracks in a circumferential weld caused the tower failure; no one was hurt on site.",
                 "a": "Chalinhe farm, Tonghe County, Harbin, Heilongjiang", "p": "Guoneng Tonghe County 150 MW wind project", "cap": "30 × 5 MW; one 5 MW unit in this event", "own": "Guoneng Tonghe County New Energy Co.", "cas": "the regulator's investigation lists no casualties",
                 "note": "Listed separately from the second collapse on 2025-01-09; direct losses for both events total RMB 8.9739 million."},
    "WIND-048": {"t": "Turbine 17 collapses at the same farm", "s": "A second collapse 15 days after the first; the regulator found tower weld defects and fatigue cracking under alternating loads; no casualties.",
                 "a": "Sanzhan, Tonghe County, Harbin, Heilongjiang", "p": "Guoneng Tonghe County 150 MW wind project", "cap": "30 × 5 MW; one 5 MW unit in this event", "own": "Guoneng Tonghe County New Energy Co.", "cas": "the regulator's investigation lists no casualties in either event",
                 "note": "The two collapses at the same farm are separate events; the report was published in 2026-02 and the event happened in 2025-01."},
    "WIND-049": {"t": "France's first floating wind farm fully commercial", "s": "Three floating turbines with a planned output of about 25 MW.",
                 "a": "Golfe de Fos, Provence", "p": "Provence Grand Large", "cap": "planned export capacity 25 MW", "fd": "floating tension-leg", "cod": "full commercial operation 2025-06-05", "own": "EDF Renewables, Enbridge / CPP Investments",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "The owner's page explicitly records tension-leg floaters."},
    "WIND-050": {"t": "Export cable damage pushes back the project schedule", "s": "Ørsted learned in August 2025 that the 2b export cable was damaged; the affected phase is 337 MW, within the combined 920 MW of 2b and 4.",
                 "a": "off Changhua", "p": "Greater Changhua 2b", "cap": "920 MW combined project; 337 MW is the affected 2b phase", "own": "Ørsted",
                 "coord": "GEM 2026-02 phase reference point, not an incident location", "note": "No public source gives the day of the incident; the date is the month the owner was informed. No casualties are assumed."},
    "WIND-051": {"t": "640 MW and 80 turbines officially in full commercial operation", "s": "All turbines were connected in January 2025; commercial operation was declared in August after the electricity licence and contractual requirements were completed.",
                 "a": "off Yunlin", "p": "Yunlin", "cap": "80 × 8 MW", "fd": "monopile", "cod": "all connected 2025-01; commercial operation 2025-08", "own": "Skyborn, TotalEnergies and partners", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-052": {"t": "Japan's first commercial floating wind farm in operation", "s": "Eight 2.1 MW turbines, 16.8 MW in total, on hybrid steel-concrete spar floaters.",
                 "a": "off Goto, Nagasaki Prefecture", "p": "Goto floating wind farm", "cap": "8 × 2.1 MW", "fd": "floating hybrid spar", "cod": "commercial operation 2026-01-05", "own": "Goto Floating Wind Farm LLC / Toda Corporation and partners", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-053": {"t": "Tower buckling at turbine 21 triggers a special safety inspection", "s": "The government announced the 2 February tower-buckling incident and launched a special safety inspection of ageing turbines; a fire at turbine 19 followed in March.",
                 "a": "Yeongdeok County, North Gyeongsang", "p": "Yeongdeok Wind Farm", "cap": "23 × 1.65 MW per the Korean regulator's equipment list", "note": "Kept separate from the March fire; the official summary does not state casualties for 2 February, so left blank."},
    "WIND-054": {"t": "Japan's large port-based offshore wind farm starts commercial operation", "s": "25 turbines of 9.6 MW, 240 MW nameplate in total; maximum plant output 220 MW.",
                 "a": "off Hibikinada, Kitakyushu, Fukuoka", "p": "Kitakyushu Hibikinada (Wind KitaQ 25)", "cap": "maximum output 220 MW; nameplate 25 × 9.6 = 240 MW", "fd": "jacket", "cod": "commercial operation 2026-03-02", "own": "Hibiki Wind Energy / J-POWER and partners", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-055": {"t": "704 MW project delivers first power", "s": "First power to New England in March 2026; not all 704 MW were in service that day.",
                 "a": "off Rhode Island / Connecticut", "p": "Revolution Wind", "cap": "whole-project planned capacity; MW connected that day not published", "own": "Ørsted, Skyborn (ownership changed over time)", "coord": "GEM 2026-02 phase reference point, not an incident location"},
    "WIND-056": {"t": "Maintenance fire at turbine 19 kills three workers", "s": "A fire during blade maintenance; the authorities confirmed three deaths and the cause is under investigation.",
                 "a": "Yeongdeok County, North Gyeongsang", "p": "Yeongdeok Wind Farm", "cap": "23 × 1.65 MW; single-unit incident", "cas": "the Ministry of Climate, Energy and Environment and the Ministry of Employment and Labor both confirmed 3 deaths",
                 "note": "The grinding work during maintenance is not assumed to be the cause; the official investigation is ongoing."},
    "WIND-057": {"t": "Nacelle fire at turbine 17", "s": "A 2 MW Vestas unit commissioned in 2010 caught fire and the blaze was under control by evening; the cause is under investigation.",
                 "a": "Mailiao Township, Yunlin County", "p": "Taipower Mailiao wind farm", "cap": "burning unit 2 MW; farm total not in the official notice", "tb": "Vestas (model not published)", "cod": "this batch commissioned 2010-05-27", "own": "Taiwan Power Company",
                 "note": "Taipower initially suspected an overheated component; the official cause is not confirmed, so no root cause is recorded."},
    "WIND-058": {"t": "14 MW turbine catches fire after an abnormal shutdown", "s": "The turbine tripped automatically and then caught fire; the fire was put out quickly, the unit isolated and the other turbines kept running.",
                 "a": "off Changhua", "p": "Greater Changhua 4", "cap": "920 MW is the combined 2b & 4 project; this incident concerns one ~14 MW unit", "fd": "jacket", "own": "Ørsted", "cas": "Ørsted explicitly stated no one was hurt",
                 "coord": "GEM farm reference point, not the burning turbine; the combined project total is not phase 4 alone", "note": "The regulator said on 27 Aug that about 14 MW was affected; the root cause was still under investigation on the verification date."},
    "WIND-059": {"t": "920 MW project completes construction and enters final commissioning", "s": "All 66 SG 14-236 turbines are installed and a completion ceremony was held; the owner's English notice says final commissioning and statutory steps remain.",
                 "a": "off Changhua", "p": "Greater Changhua 2b & 4", "cap": "allocated / project 920 MW; nameplate 66 × 14 = 924 MW", "fd": "jacket", "st": "offshore construction started 2025-02", "cod": "completion ceremony 2026-09-01; full commercial operation to be confirmed", "own": "Ørsted, Cathay Life and partners",
                 "coord": "GEM 2026-02 reference point of Greater Changhua 4; the combined project does not mark the centre of 2b", "note": "The Chinese notice speaks of completion / O&M; the English notice says final commissioning is pending, so full commercial operation is not recorded."},
}

EN.update({
    "WIND-060": {"t": "Typhoon Jangmi snaps the tower of Taichung Port turbine No. 2", "s": "The tower fractured at the joint between the lower and middle sections; the upper sections collapsed and the nacelle and three blades were badly damaged. The forensic analysis blamed fractured joint bolts; the 10-minute mean wind speed at collapse was 56 m/s.",
                 "a": "Taichung Port (next to the Gaomei wetland)", "p": "Taipower Taichung Port wind power station", "cap": "18 turbines at the station; one in this event", "own": "Taiwan Power Company", "note": "Taiwan's first tower-fracture incident; no casualties were reported, so left blank."},
    "WIND-061": {"t": "Typhoon Soudelor topples seven Taipower turbines", "s": "Six turbines at the Gaomei wetland by Taichung Port and one at Shimen snapped in half and many blades were damaged; all were uncertified trial models from the 2003 first-phase tender. Taipower estimated the loss at about NT$560 million and set up an investigation team.",
                 "a": "Taichung Port and Shimen, New Taipei", "p": "Taipower Taichung Port and Shimen wind farms (first-phase turbines)", "cap": "7 collapsed; Taipower also spoke of 8 damaged units", "own": "Taiwan Power Company", "note": "Taipower said the design lacked a keep-alive power supply for typhoons, so the blades ran out of control when power was lost; the root cause follows Taipower's investigation."},
    "WIND-062": {"t": "Typhoon Megi snaps a blade at Taichung Port turbine No. 12", "s": "A blade broke off in gusts of Beaufort 17; Taipower said the wind-speed sensor had failed and the unit did not shut down above 25 m/s, with a loss of about NT$13.8 million.",
                 "a": "Taichung Port (next to the Gaomei wetland)", "p": "Taipower Taichung Port wind power station", "cap": "single-unit event", "own": "Taiwan Power Company"},
    "WIND-063": {"t": "Typhoon Maemi topples three turbines on Miyakojima", "s": "With a peak gust of 74.1 m/s, units 3 and 5 of the Hirara demonstration site buckled above the tower door, unit 1 at Nanamata in Gusukube collapsed through foundation failure, and two more units lost blades and one a nacelle.",
                 "a": "Miyakojima, Okinawa Prefecture", "p": "Okinawa Electric Power Miyakojima wind demonstration facilities", "cap": "3 collapsed, 2 with broken blades, 1 with nacelle damage", "own": "Okinawa Electric Power", "coord": "approximate position of Miyakojima, not a turbine location", "note": "Wind analysis estimated peak gusts of 90 m/s at the sites."},
    "WIND-064": {"t": "Typhoon No. 20 topples a park turbine in Awaji", "s": "The turbine's main power had been switched off since the previous year, so the safety function that pitches the blades in strong wind could not work; the city's investigation committee reported to the national government in April 2019 and dismantling began in January 2021.",
                 "a": "Hokudan Earthquake Memorial Park, Awaji, Hyogo Prefecture", "p": "Hokudan Earthquake Memorial Park turbine", "own": "Awaji City (park operator)", "note": "The collapse happened during the night of 23–24 August; 23 August is used."},
    "WIND-065": {"t": "Brake failure sends a turbine into overspeed, disintegration and collapse (filmed)", "s": "The 600 kW Nordtank turbine had its brake repaired that morning; in the afternoon the brake failed again, the rotor ran away in strong wind, the blades disintegrated under centrifugal force and one struck the tower, which broke. Nobody was hurt.",
                 "a": "Hornslet, eastern Jutland", "p": "Hornslet Nordtank NTK 600", "cap": "single 600 kW unit", "cod": "inaugurated 1996-12-23", "own": "Syddjurs Municipality", "coord": "approximate position of the town of Hornslet, not the turbine"},
    "WIND-066": {"t": "Nacelle of a parked turbine catches fire in a storm", "s": "Although shut down in extreme storm winds, the turbine caught fire; the nacelle burned out and burning debris scattered downwind. Owner Infinis and Vestas disagreed on the initial cause (loss of yaw control versus brake drag); nobody was hurt.",
                 "a": "Ardrossan, North Ayrshire, Scotland", "p": "Ardrossan Wind Farm", "cap": "12 turbines at the farm; single-unit event", "own": "Infinis", "cas": "reports say nobody was hurt", "note": "Vestas later modified all turbines at the site so the parking brake is applied only during maintenance."},
    "WIND-067": {"t": "Vestas V112 tower collapses; the other 31 turbines shut down as a precaution", "s": "The 3 MW turbine commissioned in 2013 collapsed with nobody hurt; Sweden's accident investigation authority SHK found fatigue and corrosion at the joint between the bottom and second tower sections, caused by too little bolt pre-tension: bolts, tower sections and tools were not protected from rain and snow during installation, tools were poorly maintained and the assembler had no training.",
                 "a": "Lemnhult, Vetlanda", "p": "Lemnhult Wind Farm", "cap": "32 × 3 MW; one unit in this event", "cod": "2013", "own": "Stena Renewable", "cas": "reports say nobody was hurt", "note": "The site had loose and broken bolts before the accident, which the operator did not report."},
    "WIND-068": {"t": "Nordex N149 on a hybrid tower collapses six months after commissioning", "s": "The N149/4.0-4.5 on a 164 m hybrid tower collapsed almost completely, the nacelle and blades falling to the ground with nobody hurt; Nordex shut down 22 further turbines of the same configuration and a year later concluded that weak points in the pre-stressed concrete tower section caused the collapse.",
                 "a": "Haltern am See, North Rhine-Westphalia", "p": "Haltern AV9 wind park", "cap": "9 MW park; one unit in this event", "st": "installed 2021-01", "cod": "commissioned 2021-03-11", "own": "Nordex (manufacturer)", "cas": "Nordex stated nobody was hurt"},
    "WIND-069": {"t": "Turbine 18 collapses without warning; the whole farm is shut down for investigation", "s": "The 187-tonne turbine fell in a field with nobody hurt; owner Enel ruled out shoddy construction and material defects but never published the final report.",
                 "a": "Fenner, Madison County, New York", "p": "Fenner Wind Farm", "cap": "20 × 1.5 MW; one unit in this event", "cod": "2001", "own": "Enel North America", "cas": "reports say nobody was hurt", "note": "The root cause was not published, so none is recorded."},
    "WIND-070": {"t": "Turbine snaps in half; all 51 turbines shut down", "s": "Nobody was hurt; owner TerraForm Power later attributed the collapse to a single faulty blade, and the whole farm returned to service on 2018-03-29.",
                 "a": "Raleigh Township, Chatham-Kent, Ontario", "p": "Raleigh Wind (TerraForm Power)", "cap": "78 MW farm; one unit in this event", "cod": "2011", "own": "TerraForm Power", "cas": "reports say nobody was hurt"},
    "WIND-071": {"t": "Vestas V150 collapses during commissioning; Vestas stops 150 turbines of the type", "s": "The turbine collapsed during the night of 21–22 November while ramping up for full commissioning, with nobody hurt; the investigation found a bonding failure on blade-root inserts caused by a manufacturing issue at a single supplier, and Vestas took about 150 V150s with the same blade configuration out of service as a precaution.",
                 "a": "Aldermyrberget, Skellefteå", "p": "Aldermyrberget Wind Farm", "cap": "72 MW farm; one unit in this event", "own": "wpd", "cas": "reports say nobody was hurt"},
    "WIND-072": {"t": "Whole rotor of turbine 18 falls to the ground during repairs", "s": "After a technical problem in June 2023 the gearbox was removed and the rotor moved out of position during the delay; before a special tool could be fitted, high wind brought the rotor down. The area had long been cordoned off and nobody was hurt; the operator calls it an isolated incident.",
                 "a": "Øyfjellet, Vefsn, Nordland", "p": "Øyfjellet Wind", "cap": "72 × 5.X MW; one unit in this event", "cod": "2022", "own": "Øyfjellet Wind (developed by Eolus)", "cas": "operator notice: area cordoned off, no risk to safety"},
    "WIND-073": {"t": "Upper tower and nacelle of a Nordex N149 installed in 2023 fall to the ground", "s": "The upper tower segment with nacelle, hub and blades fell; material damage only, nobody hurt. A Nordex expert team is investigating with the customer.",
                 "a": "Herkentrup, Coesfeld, North Rhine-Westphalia", "p": "Herkentrup wind park", "cap": "13.5 MW park; one unit in this event", "st": "installed 2023", "own": "Nordex (manufacturer)", "cas": "Nordex said nobody was hurt", "note": "No root cause published by the verification date."},
    "WIND-074": {"t": "A Nordex turbine collapses on a calm morning", "s": "The fire department was called at 7:23 a.m.; the 490 ft turbine came down in almost no wind and was heard four miles away. Nobody was hurt, no fire started, the other 73 turbines kept running and the cause is unknown.",
                 "a": "Kildare, Kay County, Oklahoma", "p": "Frontier Windpower II", "cap": "74 Nordex N149/4.X (4.8 MW) at the farm; one unit in this event", "st": "installed 2020", "cod": "operating since 2021-03", "cas": "fire department said nobody was hurt", "note": "No root cause published."},
    "WIND-075": {"t": "GE turbine collapses less than a year after entering service", "s": "A resident heard a thud in the evening and found the turbine down; firefighters responded at 6:45 p.m. and nobody was hurt. Owner Invenergy referred questions to the offtaker PSO and no cause was published.",
                 "a": "near Ames, Oklahoma", "p": "Maverick Wind Farm", "cap": "288 MW farm; one unit in this event", "cod": "2021", "own": "Invenergy", "cas": "reports say nobody was hurt"},
    "WIND-076": {"t": "22-tonne blade falls off a Siemens Gamesa 5.0-145; the whole farm stops", "s": "The 72 m, roughly 22-tonne blade fell late at night with nobody hurt; 15 of the farm's 34 turbines had already been stopped for blade damage linked to a production problem, and the whole farm was shut down for investigation with its restart delayed.",
                 "a": "Odal, Innlandet", "p": "Odal Vind", "cap": "34 × 5 MW (4.X platform); one unit in this event", "cod": "2022", "own": "Odal Vind", "cas": "the owner said nobody was hurt", "note": "The blade fell late on Wednesday 10 April; reported on 11 April."},
    "WIND-077": {"t": "4.7 MW turbine tower folds like a straw", "s": "At 2:50 a.m. without strong wind the 127 m turbine folded; manufacturer Siemens Gamesa's investigation found a structural crack of undetermined origin in the glass-fibre blade that grew under repeated stress until the blade broke and struck the tower. The turbine was removed by the end of the year.",
                 "a": "Mt Geumseong, Hwasun County, South Jeolla", "p": "Geumseongsan wind farm", "cap": "11 × 4.7 MW; one unit in this event", "cod": "2023", "note": "The investigation was led by the manufacturer and its result only reached the press in February 2026."},
    "WIND-078": {"t": "Blade breaks on a new Siemens Gamesa 5.X turbine; the whole farm stops", "s": "One blade of a recently commissioned 6.2 MW turbine still in testing broke and the farm was shut down for investigation; Siemens Gamesa had warned that year of blade and main-bearing quality problems on its 4.X and 5.X platforms.",
                 "a": "Santo Agostinho, Rio Grande do Norte", "p": "Santo Agostinho (Engie Brasil)", "cap": "434 MW farm; one unit in this event", "own": "Engie Brasil Energia"},
    "WIND-079": {"t": "One turbine burns and part of another falls from its tower", "s": "GE confirmed two Alstom-built turbines were affected, one by fire and one whose upper structure fell, with nobody hurt; AES Brasil and GE investigated the root cause (sabotage was suspected at one point).",
                 "a": "Rei dos Ventos, Rio Grande do Norte", "p": "Rei dos Ventos (AES Brasil)", "cap": "two units affected", "own": "AES Brasil", "cas": "reports say nobody was hurt", "note": "Linked to the Rei dos Ventos 1 record in the farm layer (same complex); the exact day was not reported, so month precision is used."},
    "WIND-080": {"t": "GE turbine collapses; one worker injured", "s": "A GE turbine at the 54 MW farm, operating only since December 2018, collapsed while three GE employees were on site; one was injured and treated. It was GE's fifth collapse in the Americas that year.",
                 "a": "Paulino Neves, Maranhão", "p": "Delta 6 (Omega Geração)", "cap": "54 MW farm; one unit in this event", "cod": "2018-12", "own": "Omega Geração", "cas": "reports: 1 injured"},
    "WIND-081": {"t": "Nordex N80 rotor runs away in moderate wind and the turbine collapses", "s": "With winds of only about 10–12 m/s the blades still ran out of control and the 100 m turbine collapsed, heard seven miles away; nobody was on site and nobody was hurt. Nordex's interim investigation found a unique fault in the blade control system.",
                 "a": "Fintona, County Tyrone, Northern Ireland", "p": "Screggagh Wind Farm", "cap": "8 × 2.5 MW; one unit in this event", "cod": "2011", "cas": "reports say nobody was hurt"},
    "WIND-082": {"t": "Nacelle fire that firefighters could not reach was left to burn out", "s": "Firefighters had no equipment able to reach the nacelle and could only watch for spread on the ground; the operator shut down 32 surrounding turbines as a precaution.",
                 "a": "Oliver Township, Huron County, Michigan", "p": "Harvest Wind II (Exelon)", "cap": "single-unit event", "cod": "2012", "own": "Exelon Generation", "note": "No cause published. Linked to the combined Harvest (Exelon) record in the farm layer."},
    "WIND-083": {"t": "Turbine fire starts the Juniper wildfire", "s": "Smoke and fire from the nacelle at 1:40 p.m.; burning parts falling from 300 ft ignited grass and juniper, and gusty winds in canyon terrain spread the fire over 250–500 acres, threatening 39 structures with about 200 people fighting it.",
                 "a": "near Bickleton, Klickitat County, Washington", "p": "Juniper Canyon Wind (Avangrid)", "cap": "151.2 MW farm; one unit in this event", "cod": "2011", "own": "Avangrid Renewables"},
    "WIND-084": {"t": "598 turbines at the Jiuquan wind base disconnect from the grid", "s": "A three-phase short circuit at a 35 kV cable terminal in the Qiaoxi No. 1 wind farm caused a voltage dip; most turbines lacked low-voltage ride-through and 598 turbines at 16 wind farms disconnected, losing 840 MW of output. The electricity regulator called it the most serious wind-related grid event in years and it drove revised grid-connection standards.",
                 "a": "Jiuquan wind base, Gansu (Qiaoxi No. 1 and 15 other farms)", "p": "Jiuquan wind base (multi-site)", "cap": "840 MW of output lost", "note": "A multi-farm grid event with no single farm coordinate."},
    "WIND-085": {"t": "Super Typhoon Yagi snaps five or six 6.25 MW typhoon-class turbines under construction", "s": "The typhoon made landfall only about 7 km from the site with estimated peak winds above 83 m/s, beyond the national standard; the turbines were still under construction and not yet powered or grid-connected, so their typhoon strategy could not run. 13 of 16 planned turbines were installed and 5–6 were snapped, each costing about RMB 10 million.",
                 "a": "Mulan Bay, Wenchang, Hainan", "p": "Huaneng Wenchang wind farm repowering project", "cap": "16 × 6.25 MW planned; 5–6 damaged", "own": "Huaneng Hainan Power Generation", "note": "Landfall was on 6 September; reported on 8 September. Operating turbines at Xuwen, Zhanjiang were undamaged in the same typhoon."},
    "WIND-086": {"t": "CO2 fire-suppression cylinders leak at the onshore substation; three workers die", "s": "56 carbon-dioxide fire-suppression cylinders discharged accidentally and 17 people were taken to hospital; the labour safety authority recorded an asphyxiation accident affecting 7 workers (3 dead, 4 injured), found the protective measures inadequate, fined NT$300,000 and ordered work stopped. The three critically injured workers died on 26 August, 6 September and 7 September.",
                 "a": "Hai Long onshore substation, Changhua Coastal Industrial Park", "p": "Hai Long Offshore Wind (onshore substation)", "cap": "Hai Long 2 & 3 total 1,044 MW; the accident was at the onshore substation", "own": "Hai Long Offshore Wind (Teco as construction contractor)", "cas": "OSHA Taiwan: 3 dead, 4 injured (7 workers asphyxiated); more were hospitalised for observation",
                 "coord": "The accident site is the onshore substation; the map places it at the wind farm.", "note": "Deaths follow later reports up to 7 September; the root cause follows the OSHA and judicial investigations."},
    "WIND-087": {"t": "Blade of a Vestas V236-15 MW being installed breaks and falls into the sea", "s": "EnBW said a blade failure was detected on one turbine on 22 July, nobody was hurt and the authorities were informed immediately; the blade was later found floating and recovered with the federal police. Some work was paused as a precaution, blades from the same production site were barred, and the inauguration moved from September to December.",
                 "a": "He Dreiht, North Sea", "p": "EnBW He Dreiht", "cap": "64 × 15 MW; one unit in this event", "own": "EnBW", "cas": "EnBW said nobody was hurt", "note": "EnBW regards it as a one-off; Vestas and the owner are running a root-cause investigation, not published by the verification date."},
    "WIND-088": {"t": "Worker dies in a fall of more than 100 ft inside a tower", "s": "At 11:15 a.m. a 52-year-old worker fell more than 100 ft inside a turbine tower and was pronounced dead at the scene; Cal/OSHA was notified by the employer and opened an investigation.",
                 "a": "near Desert Hot Springs, California", "p": "Desert Hot Springs wind facility (Site Constructors work)", "cas": "Cal/OSHA was notified of 1 death", "note": "Reports do not name the wind farm; not linked to the farm layer."},
})

EN.update({
    "WIND-060": dict(EN["WIND-060"], cas="Liberty Times: fortunately no casualties", note="Taiwan's first tower-fracture incident."),
    "WIND-066": dict(EN["WIND-066"], s="In an extreme storm (winds of 176 km/h) the blades of the parked, locked turbine T8 ground against the brake pads, the heat set the nacelle on fire and burning debris scattered downwind; nobody was hurt and the UK HSE investigated.",
                     note="Vestas later changed the parking-brake logic on all turbines at the site so it is applied only during maintenance (Wikipedia and others; not separately checked)."),
    "WIND-067": dict(EN["WIND-067"], s="The 3 MW turbine commissioned in 2013 collapsed, the first such incident for a Vestas MW-class machine; the Swedish Accident Investigation Authority (SHK) found the tower bolts were not sufficiently tightened by an electrician who had neither experience nor the right training, and that it was not the only flawed turbine.",
                     note="The collapse date of 24 December follows the Recharge report (full text paywalled, not checked); Recharge published it on 2015-12-29."),
    "WIND-069": dict(EN["WIND-069"], tb="Enron Wind 1.5 MW (predecessor of the GE 1.5)"),
    "WIND-071": dict(EN["WIND-071"], cap="17 × 4.2 MW at the farm; one unit in this event",
                     s="The 230 m tall V150 collapsed over the weekend (the night of 21–22 November) while ramping up for commissioning, with nobody hurt; the investigation found a bonding failure on blade-root inserts caused by a manufacturing issue at a single supplier, and Vestas took about 150 V150s with the same blade configuration out of service as a precaution."),
    "WIND-074": dict(EN["WIND-074"], note="No root cause published; the offtaker told The Well News the turbine belongs to Deriva Energy."),
    "WIND-075": dict(EN["WIND-075"], note="The farm name Maverick and the GE turbine follow the KFOR report (HTTP 403 here, not checked)."),
    "WIND-077": dict(EN["WIND-077"], cas="Seoul Shinmun: nobody was nearby, no casualties"),
    "WIND-079": dict(EN["WIND-079"], p="Rei dos Ventos 3 (AES Brasil)", t="One turbine burns and the upper part of another falls from its tower",
                     s="On Sunday 7 February one turbine caught fire with black smoke, and on Monday the 8th the upper part of another fell from the top of its tower; GE said nobody was injured and is investigating the root cause with the owner and the authorities, and the turbines at the Rei dos Ventos 3 park were switched off. The turbines were built by Alstom, whose energy division merged with GE.",
                     cas="GE statement: nobody was injured", note="The farm layer only has a record for Rei dos Ventos 1; the incident was at park 3, so no link."),
    "WIND-080": dict(EN["WIND-080"], note="The exact day is in the paywalled Recharge and Windpower Monthly articles (not checked), so month precision is used; Windpower Monthly published on 2019-09-06."),
    "WIND-081": dict(EN["WIND-081"], s="The roughly £2 million, 100 m (328 ft) Nordex N80 collapsed and debris scattered across a wide area; nobody was on site and nobody was hurt, and the remaining seven turbines were shut down for investigation.",
                     note="E&T (IET) reported on 2015-02-13 that Nordex's interim investigation found a unique fault in the blade control system and that winds were only about 10–12 m/s (HTTP 403 here, not checked)."),
    "WIND-082": dict(EN["WIND-082"], s="The nacelle caught fire with black smoke shortly after 5 p.m. on Monday (ABC 12: reported around 5:30 p.m.); firefighters had no equipment able to reach the nacelle; owner Exelon said there were no injuries to the public or employees, and no cause was published.",
                     cas="Exelon: no injuries to the public or employees", note="Linked to the combined Harvest (Exelon) record in the farm layer."),
    "WIND-083": dict(EN["WIND-083"], s="Smoke and fire from the nacelle at 1:40 p.m.; burning parts falling from about 300 ft ignited grass and juniper and the fire spread over about 250 acres (early estimates near 500), 39 residences were threatened under a Level 3 evacuation order and about 201 firefighters responded; the farm is operated by Avangrid."),
    "WIND-084": dict(EN["WIND-084"], s="A cable-terminal fault at the Qiaoxi No. 1 wind farm of CPI Jiuquan caused 598 turbines at 16 wind farms to disconnect; the State Electricity Regulatory Commission called it the most serious wind-related grid event in years.",
                     cap="", note="A multi-farm grid event with no single farm coordinate; the lost output and low-voltage ride-through explanations appear in other reports that were not checked, so they are left out."),
    "WIND-085": dict(EN["WIND-085"], t="Super Typhoon Yagi snaps 6.25 MW typhoon-class turbines under construction",
                     s="The typhoon made landfall at Wengtian, Wenchang around 16:20 on 6 September, only about 7 km from the site, with winds possibly above 83 m/s, beyond the national standard; the Huaneng Wenchang repowering project planned 16 turbines of 6.25 MW and had installed 13, still under construction and not yet powered or grid-connected, so the yaw system could not adjust the load angle and several turbines were snapped.",
                     cap="16 × 6.25 MW planned, 13 installed; the number damaged is not in the checked source"),
    "WIND-086": dict(EN["WIND-086"], s="While workers were flushing the pipework of the CO2 fire-suppression system, cylinders discharged suddenly and high-pressure gas leaked into the cylinder room and the corridor; the labour safety authority recorded an asphyxiation accident affecting 7 workers (3 dead, 4 injured), ordered part of the site stopped and said fines would be published separately; contractor Teco said about 17 workers inhaled the gas and were taken to hospital, and the site was stopped for a full safety review.",
                     cas="OSHA Taiwan: 3 dead, 4 injured (7 workers asphyxiated); Teco: about 17 workers inhaled gas and were hospitalised",
                     note="The root cause follows the OSHA and judicial investigations; the dates on which the three critically injured workers died appear in later reports that were not checked, so they are left out."),
})


def num(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        v = float(s.replace(",", ""))
        return int(v) if v == int(v) else v
    except ValueError:
        return None


def load_rows():
    with SRC.open(encoding="utf-8-sig", newline="") as fh:
        rows = [r for r in csv.DictReader(fh) if r.get("事件ID")]
    return rows


def build():
    farms = json.loads(FARMS_JSON.read_text(encoding="utf-8"))
    farm_names = {r[0] for r in farms["rows"]}
    rows = load_rows()
    problems = []
    events = []
    for r in rows:
        eid = r["事件ID"].strip()
        en = EN.get(eid)
        if not en or not en.get("t") or not en.get("s") or not en.get("a"):
            problems.append(f"{eid}: missing English title/summary/area in EN")
            continue
        iso = ISO.get(r["國家或地區"].strip())
        if not iso:
            problems.append(f"{eid}: unknown country {r['國家或地區']!r}")
        cat = CAT.get(r["事件類型"].strip())
        if not cat:
            problems.append(f"{eid}: unknown event type {r['事件類型']!r}")
        sub = r["事件子類"].strip()
        if sub not in SUB_EN:
            problems.append(f"{eid}: sub-type {sub!r} has no English label")
        stage = r["事件時階段"].strip()
        if stage and stage not in STAGE_EN:
            problems.append(f"{eid}: stage {stage!r} has no English label")
        verify = r["核驗狀態"].strip()
        if verify and verify not in VERIFY_EN:
            problems.append(f"{eid}: verify status {verify!r} has no English label")
        photo_kind = r["照片內容性質"].strip()
        if photo_kind and photo_kind not in PHOTO_KIND_EN:
            problems.append(f"{eid}: photo kind {photo_kind!r} has no English label")
        rights = r["照片權利狀態"].strip()
        if rights and rights not in RIGHTS_EN:
            problems.append(f"{eid}: photo rights {rights!r} has no English label")
        org = r["主要來源機構"].strip()
        org_en = ORG_EN.get(org, org)
        for f in FARMS.get(eid, []):
            if f not in farm_names:
                problems.append(f"{eid}: farm {f!r} is not in wind_farms.json")
        # 中文自由文字欄位：有內容就一定要有英文（避免英文介面出現中文）
        for zh_key, en_key in (("容量口徑", "cap"), ("座標說明", "coord"), ("傷亡註記", "cas"), ("特別註記", "note"), ("開工資訊", "st"), ("完成或商轉資訊", "cod"), ("基礎型式", "fd")):
            if r[zh_key].strip() and not en.get(en_key):
                problems.append(f"{eid}: {zh_key} has Chinese text but EN[{en_key!r}] is missing")
        lat, lon = num(r["緯度"]), num(r["經度"])
        srcs = [u.strip() for u in (r["一手來源URL"], r["補充來源URL"]) if u.strip()]
        ev = {
            "id": eid, "date": r["事件日期"].strip(), "prec": PREC.get(r["日期精度"].strip(), "d"), "year": int(r["年份"]),
            "iso": iso, "cont": CONT.get(r["洲別"].strip()), "site": SITE.get(r["陸域或離岸"].strip()),
            "cat": cat, "sub": [sub, SUB_EN.get(sub, sub)],
            "area": [r["行政區或海域"].strip(), en["a"]],
            "project": [r["風場或專案"].strip(), en.get("p") or r["風場或專案"].strip()],
            "title": [r["事件標題"].strip(), en["t"]], "summary": [r["事件摘要"].strip(), en["s"]],
            "stage": [stage, STAGE_EN.get(stage, stage)] if stage else None,
            "mw": num(r["風場或計畫規模MW"]), "mwEvent": num(r["本次涉及容量MW"]),
            "capNote": [r["容量口徑"].strip(), en.get("cap", "")] if r["容量口徑"].strip() else None,
            "turbine": en.get("tb") or (r["機組廠牌型號"].strip() or None), "unitMw": r["單機額定MW"].strip() or None,
            "foundation": [r["基礎型式"].strip(), en.get("fd", "")] if r["基礎型式"].strip() else None,
            "start": [r["開工資訊"].strip(), en.get("st", "")] if r["開工資訊"].strip() else None,
            "cod": [r["完成或商轉資訊"].strip(), en.get("cod", "")] if r["完成或商轉資訊"].strip() else None,
            "owner": en.get("own") or (r["開發商或營運商"].strip() or None),
            "deaths": num(r["死亡人數"]), "injuries": num(r["受傷人數"]),
            "casNote": [r["傷亡註記"].strip(), en.get("cas", "")] if r["傷亡註記"].strip() else None,
            "lat": lat, "lon": lon,
            "coordNote": [r["座標說明"].strip(), en.get("coord", "")] if r["座標說明"].strip() else None,
            "pri": int(r["導覽優先級_1最高"] or 2),
            "org": [org, org_en], "src": srcs,
            "photo": {"url": r["照片頁面URL"].strip(), "kind": [photo_kind, PHOTO_KIND_EN.get(photo_kind, photo_kind)], "rights": [rights, RIGHTS_EN.get(rights, rights)]} if r["照片頁面URL"].strip() else None,
            "verify": [verify, VERIFY_EN.get(verify, verify)] if verify else None,
            "note": [r["特別註記"].strip(), en.get("note", "")] if r["特別註記"].strip() else None,
            "checked": r["查證日期"].strip(),
            "farms": FARMS.get(eid, []),
        }
        events.append(ev)
    if problems:
        sys.exit("build_events: " + str(len(problems)) + " problem(s):\n  " + "\n  ".join(problems))
    events.sort(key=lambda e: (e["date"], e["id"]))
    with_coord = sum(1 for e in events if e["lat"] is not None and e["lon"] is not None)
    out = {
        "meta": {
            "source": "data/global/sources/events_2026-09.csv", "compiled": "2026-09-28", "count": len(events), "withCoord": with_coord,
            "cats": CAT_LABEL,
            "note": ["人工查證的重大事件與事故清單（2026-09-28 整理，每筆附一手來源；不含照片，只記錄照片頁面與權利狀態）。事件日期依來源精度記錄為日、月或年。傷亡與根因只寫官方已確認的，未確認的留空。",
                     "Hand-verified list of major events and incidents (compiled 2026-09-28, each with a primary source; photos are not included, only their page and rights status). Dates are recorded at the day, month or year precision of the source. Casualties and root causes are recorded only when officially confirmed; otherwise left blank."],
        },
        "events": events,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    write_docs(events, with_coord)
    print(f"wrote {OUT.relative_to(ROOT)}: {len(events)} events ({with_coord} with coordinates), docs/events.md + docs/events.en.md")


def write_docs(events, with_coord):
    inc = sum(1 for e in events if e["cat"] == "inc")
    ms = sum(1 for e in events if e["cat"] == "ms")
    pol = sum(1 for e in events if e["cat"] == "pol")
    deaths = sum(e["deaths"] or 0 for e in events)
    def table(lang):
        L = 0 if lang == "zh" else 1
        head = ("| 編號 | 日期 | 國家 | 類型 | 事件 | 對應風場 | 傷亡 | 主要來源 |\n|---|---|---|---|---|---|---|---|\n" if lang == "zh"
                else "| ID | Date | Country | Type | Event | Linked farm | Casualties | Main source |\n|---|---|---|---|---|---|---|---|\n")
        rows = []
        for e in events:
            cas = []
            if e["deaths"] is not None:
                cas.append(("死亡 " if lang == "zh" else "deaths ") + str(e["deaths"]))
            if e["injuries"] is not None:
                cas.append(("受傷 " if lang == "zh" else "injured ") + str(e["injuries"]))
            src = e["src"][0] if e["src"] else ""
            rows.append("| %s | %s | %s | %s | **%s** — %s | %s | %s | [%s](%s) |" % (
                e["id"], e["date"], e["iso"], CAT_LABEL[e["cat"]][L] + " · " + e["sub"][L], e["title"][L].replace("|", "｜"), e["summary"][L].replace("|", "｜"),
                ", ".join(e["farms"]) or "—", ", ".join(cas) or "—", e["org"][L].replace("|", "｜"), src))
        return head + "\n".join(rows) + "\n"
    zh = f"""# 重大事件與事故 · Major events & incidents

[English](./events.en.md) ｜ 中文（本頁）

由 `tools/build_events.py` 自 `data/global/sources/events_2026-09.csv` 產生，請勿手動修改。
資料為 2026-09-28 人工查證的清單：每筆附主管機關或業主的一手來源；傷亡人數與根因只寫官方已確認的，未確認的留空；
照片只記錄頁面網址與權利狀態，網站不下載或內嵌照片。事件日期依來源精度記錄為日、月或年。

- 事件 {len(events)} 筆：發展里程碑 {ms}、事故／故障 {inc}、政策與社會 {pol}；有座標的 {with_coord} 筆會標在地球儀上，其餘只列在「事件」分頁。
- 官方確認的死亡人數合計 {deaths} 人（只計清單內有一手來源的事件，不是全球統計）。
- 對應風場為 `data/global/wind_farms.json` 裡的名稱（風場卡片會列出相關事件）；對不到的不猜。

{table("zh")}"""
    en = f"""# Major events & incidents

English (this page) ｜ [中文](./events.md)

Generated by `tools/build_events.py` from `data/global/sources/events_2026-09.csv`; do not edit by hand.
The list was verified by hand on 2026-09-28: every row has a primary source from a regulator or the owner; casualties and root causes are
recorded only when officially confirmed; photos are recorded as page URLs with their rights status and are never downloaded or embedded.
Dates are recorded at the day, month or year precision of the source.

- {len(events)} events: {ms} milestones, {inc} incidents / failures, {pol} policy & society; the {with_coord} with coordinates are marked on the globe, the rest appear only in the Events tab.
- Officially confirmed deaths total {deaths} (events in this list only, not a global statistic).
- Linked farms use the exact names in `data/global/wind_farms.json` (farm cards list their related events); unmatched events are left unmatched.

{table("en")}"""
    DOC_ZH.write_text(zh, encoding="utf-8")
    DOC_EN.write_text(en, encoding="utf-8")


if __name__ == "__main__":
    build()
