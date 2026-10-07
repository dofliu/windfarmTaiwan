"""第一階段資料清理（2026 年 9 月逐筆查證）：tools/build_farms.py 合併完各來源後套用的明確規則。

每條規則用（國別, 名稱, 來源）指定剛好一筆紀錄。名稱是 wind_farms.json 裡的 name（含 GEM 的分期標籤）；
來源 0 = 精選、1 = WRI GPPD、2 = GEM、3 = 2026 整理清單。規則對不到紀錄、或對到多筆時建置會中止：
上游資料改版後要重新檢查這裡的每一條。
    dup   與 keep 指定的另一筆是同一座風場 → 刪除；保留者沒有業主或分期時搬過去（分期合計與保留者容量相差 5% 內才搬）
    drop  從未建成、查無此場，或已由逐場資料涵蓋的彙總 → 刪除
    fix   修正欄位：rename（改名）、zhname、lat、lon、mw、year、type（0 陸域、1 離岸、2 浮動式）、st、end、owner、turbine（機組）、ph、
          note（note=True 表示把理由寫進卡片的註記）；
          改了座標就不再標「概略位置」（approx=True 則仍標）；補上年份或改成規劃中就不再標「年份不詳」；
          改了容量而舊分期加總對不上時清掉分期
GEM_KEEP 列出不可被當成重複的 GEM 專案（例：與精選風場名稱相近、實為另一座）。
ORPHAN_OK 列出被併進某筆精選紀錄、而那筆精選紀錄之後被 dup／drop 刪掉的 GEM 專案中，確認已由別的紀錄涵蓋、可以不保留的；
建置時遇到不在 GEM_KEEP 也不在 ORPHAN_OK 的這種專案會中止（否則整座風場會消失）。
PIPE_DROP 列出 2026 整理的規劃中專案清單（data/global/sources/pipeline_curated.json）裡已經停止、不再收錄的專案；
PIPE_FIX 列出清單整理後才變動的欄位（例：預計完工年延後），套用在清單比對之前。兩者對不到清單裡的專案時建置會中止。
每條規則都附中英文理由與來源連結（url=None 表示依資料本身比對：同名、同容量、同地點），
build_farms.py 會把套用結果寫成 docs/data-cleanup.md 與 docs/data-cleanup.en.md。
"""
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
C, P, G, N = 0, 1, 2, 3
SRC_ZH = ['精選', 'WRI GPPD', 'GEM', '2026 整理清單', 'MaStR']
SRC_EN = ['curated', 'WRI GPPD', 'GEM', '2026 compilation', 'MaStR']
ASOF = '2026-09'

# ---------------------------------------------------------------- 來源連結
MOIT = 'https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html'
TRANSELECTRICA = 'https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/'
IBERDROLA_RO = 'https://www.iberdrola.com/press-room/news/detail/iberdrola-sells-its-wind-power-assets-in-romania-for-88-million-euro'
NO_LIST = 'https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge'
NL_NOP = 'https://nl.wikipedia.org/wiki/Windpark_Noordoostpolder'
PORTLAND = 'https://en.wikipedia.org/wiki/Portland_Wind_Project'
WOOLNORTH = 'https://en.wikipedia.org/wiki/Woolnorth_Wind_Farm'
SNOWTOWN = 'https://en.wikipedia.org/wiki/Snowtown_Wind_Farm'
STORY = 'https://en.wikipedia.org/wiki/Story_County_Wind_Farm'
MANJIL = 'https://en.wikipedia.org/wiki/Manjil_and_Rudbar_Wind_Farm'
CY_TAICHUNG = 'https://cybsbox.cy.gov.tw/CYBSBoxSSL/edoc/download/46805'     # 監察院 2010 年台中電廠及台中港區風機採購案調查報告


def R(act, iso, name, src, zh, en, url, keep=None, **fix):
    return dict(act=act, iso=iso, name=name, src=src, zh=zh, en=en, url=url, keep=keep, fix=fix)


def dup(iso, name, src, keep, zh, en, url=None):
    return R('dup', iso, name, src, zh, en, url, keep=keep)


def drop(iso, name, src, zh, en, url=None):
    return R('drop', iso, name, src, zh, en, url)


def fix(iso, name, src, zh, en, url=None, **f):
    return R('fix', iso, name, src, zh, en, url, **f)


def ro_gone(name, zh='', en=''):
    return drop('ROU', name, G, '不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄' + zh,
                'Not on Transelectrica’s February 2024 list of wind plants (whose rows add up to the national total); '
                'no evidence it was built' + en, TRANSELECTRICA)


def ro_iberdrola(name):
    return drop('ROU', name, G, 'Iberdrola（Eolica Dobrogea）在羅馬尼亞只建成 Mihai Viteazu（80 MW），此案未興建',
                'Iberdrola (Eolica Dobrogea) built only Mihai Viteazu (80 MW) in Romania; this project was never built', IBERDROLA_RO)


def ro_casimcea(name):
    return fix('ROU', name, G, '位於圖爾恰縣 Casimcea（原座標是羅馬尼亞國土中心的代用點）',
               'In Casimcea, Tulcea County (the old point was a placeholder at the centre of Romania)', TRANSELECTRICA,
               lat=44.72, lon=28.38, approx=True)


def no_year(name, year, mw):
    return fix('NOR', name, G, f'補上商轉年 {year}（{mw} MW）', f'Commissioning year {year} added ({mw} MW)', NO_LIST, year=year, mw=mw)


def cn_agg(name, zh, en):
    return drop('CHN', name, C, '整區的概略彙總，' + zh + '，各有自己的商轉年', 'A rough total for the whole area; ' + en + ', each with its own commissioning year')


RULES = [
    # ------------------------------------------------ Australia
    dup('AUS', 'Snowtown I wind farm', G, ('Snowtown', C),
        'Snowtown 第一期；精選的 Snowtown 已含兩期', 'Stage 1 of Snowtown; the curated Snowtown record covers both stages', SNOWTOWN),
    fix('AUS', 'Snowtown', C, '補上兩期：2008 年 98.7 MW、2014 年 270 MW（北 144 + 南 126）',
        'Two stages: 98.7 MW in 2008 and 270 MW in 2014 (North 144 + South 126)', SNOWTOWN, mw=368.7, ph=[[2008, 98.7], [2014, 270]]),
    dup('AUS', 'Bluff Point wind farm', G, ('Woolnorth (Bluff Point / Studland Bay)', C),
        'Woolnorth 的 Bluff Point 部分；精選紀錄已含 Bluff Point 與 Studland Bay',
        'The Bluff Point part of Woolnorth; the curated record covers Bluff Point and Studland Bay', WOOLNORTH),
    fix('AUS', 'Woolnorth (Bluff Point / Studland Bay)', C, '補上分期：Bluff Point 2002 年 10.5 MW、2004 年 54.3 MW，Studland Bay 2007 年 75 MW',
        'Phases: Bluff Point 10.5 MW (2002) and 54.3 MW (2004), Studland Bay 75 MW (2007)', WOOLNORTH,
        mw=139.8, ph=[[2002, 10.5], [2004, 54.3], [2007, 75]]),
    # GEM 2026-02 把 Portland 計畫依座標分成兩筆：西邊三個場址（149 MW）與東邊的 Codrington＋Yambuk；Codrington 另有精選紀錄
    fix('AUS', 'Portland (PWEP) Wind Energy Project · Codrington wind farm, Yambuk wind farm', G,
        '扣除另有精選紀錄的 Codrington（18.2 MW，2001）：只留 Yambuk 30 MW（2007 年，Portland 風電計畫第四個場址）',
        'Codrington (18.2 MW, 2001) has its own curated record and is taken out, leaving Yambuk 30 MW (2007, the fourth site of the Portland Wind Project)',
        PORTLAND, rename='Portland (PWEP) Wind Energy Project · Yambuk wind farm', mw=30, year=2007, ph=[[2007, 30]]),
    # ------------------------------------------------ Canada
    dup('CAN', 'Whitla wind farm', G, ('Whitla', C),
        '同一座風場；GEM 座標在班夫附近，偏離約 300 km（實際位於 Forty Mile 郡）',
        'Same farm; the GEM point is near Banff, about 300 km off (the farm is in the County of Forty Mile)',
        'https://www.capitalpower.com/operations/whitla-wind-2-3/'),
    # ------------------------------------------------ United States
    dup('USA', 'Chanarambie Power Partners  LLC', P, ('Chanarambie wind farm', G),
        'WRI GPPD 舊資料；GEM 有同一座風場（已於 2022 年除役）', 'Old WRI GPPD record; GEM has the same farm (retired in 2022)'),
    dup('USA', 'Snyder Wind Farm', P, ('Snyder wind farm', G),
        'WRI GPPD 舊資料；GEM 有同一座風場（已於 2021 年除役）', 'Old WRI GPPD record; GEM has the same farm (retired in 2021)'),
    dup('USA', 'FPL Energy Story Wind LLC', P, ('Story County', C),
        'Story County 第二期（150 MW，2009）；精選的 Story County（300 MW）已含兩期',
        'Phase II of Story County (150 MW, 2009); the curated 300 MW record covers both phases', STORY),
    fix('USA', 'Story County', C, '補上兩期（2008、2009 年各 150 MW），座標改到 Colo 以北的實際場址',
        'Two phases (150 MW each in 2008 and 2009); point moved to the actual site north of Colo', STORY,
        lat=42.06, lon=-93.27, ph=[[2008, 150], [2009, 150]]),
    dup('USA', 'Prairie Winds SD1', P, ('Crow Lake wind farm', G),
        'PrairieWinds SD1 是 Basin Electric 持有 Crow Lake 風場（162 MW，2011）的子公司，同一座',
        'PrairieWinds SD1 is the Basin Electric subsidiary that owns the Crow Lake farm (162 MW, 2011): same farm',
        'https://renewablesnow.com/news/basin-electrics-162-mw-crow-lake-wind-project-starts-operation-in-south-dakota-17914/'),
    dup('USA', 'Windy Point wind farm (United States)', G, ('Windy Point / Windy Flats', C),
        'Windy Point 第一期（136.3 MW，2009）；精選紀錄（400 MW）已含第一期與 Windy Flats',
        'Phase I of Windy Point (136.3 MW, 2009); the curated 400 MW record covers Phase I and Windy Flats',
        'https://en.wikipedia.org/wiki/Windy_Point/Windy_Flats'),
    # ------------------------------------------------ Brazil
    dup('BRA', 'Ventos Do Sul wind farm', G, ('Osório', C), 'Ventos do Sul Energia 就是 Osório 風場（150 MW，75 × 2 MW）的業主，同一座',
        'Ventos do Sul Energia owns the Osório farm (150 MW, 75 × 2 MW): same farm', 'https://en.wikipedia.org/wiki/Os%C3%B3rio_wind_farm'),
    # ------------------------------------------------ South Africa
    dup('ZAF', 'Amakhala Emoyeni wind farm', G, ('Amakhala Emoyeni', C), '同一座風場', 'Same farm'),
    fix('ZAF', 'Amakhala Emoyeni', C, '座標改到 Bedford／Cookhouse 一帶（原座標偏西南約 50 km）；容量 134.4 MW（56 × 2.4 MW）',
        'Point moved to the Bedford / Cookhouse area (the old one was about 50 km south-west); 134.4 MW (56 × 2.4 MW)',
        'https://www.power-technology.com/projects/amakhala-emoyeni-wind-farm-bedford/', lat=-32.69, lon=26.11, mw=134.4, approx=True),
    dup('ZAF', 'Waainek wind farm', G, ('Waainek Wind Farm', P),
        '同一座風場；GEM 座標偏北約 80 km，保留位置正確的 WRI 紀錄',
        'Same farm; the GEM point is about 80 km too far north, so the WRI record with the right location is kept',
        'https://southafrica.edf-powersolutions.com/operational/waainek/'),
    fix('ZAF', 'Waainek Wind Farm', P, '容量 24.6 MW（8 × 3.075 MW）', 'Capacity 24.6 MW (8 × 3.075 MW)',
        'https://southafrica.edf-powersolutions.com/operational/waainek/', mw=24.6),
    # ------------------------------------------------ South Korea
    dup('KOR', 'Yeongyang', C, ('Yeong Yang (Macquarie Group) wind farm', G),
        '同一座風場（孟洞山 41 × 1.5 MW，2008–2009 年完工）；精選紀錄的年份（2015）、座標（郡中心）與業主都誤植，保留 GEM 這筆',
        'Same farm (41 × 1.5 MW on Maengdongsan, built 2008–2009); the curated record had the wrong year (2015), point '
        '(county seat) and owner, so the GEM record is kept', 'https://www.epj.co.kr/news/articleView.html?idxno=4315'),
    # ------------------------------------------------ Uruguay, Jordan
    dup('URY', 'Pampa (Nordex) wind farm', G, ('Pampa (Tacuarembó)', C), '同一座風場（UTE 的 Pampa，141.6 MW）', 'Same farm (UTE’s Pampa, 141.6 MW)'),
    fix('URY', 'Pampa (Tacuarembó)', C, '2016 年 10 月開始運轉', 'In operation from October 2016',
        'https://es.wikipedia.org/wiki/Parque_e%C3%B3lico_Pampa', year=2016),
    dup('JOR', 'Tafilah wind farm', G, ('Tafila', C), '同一座風場（JWPC，117 MW，2015 年 9 月商轉）',
        'Same farm (JWPC, 117 MW, commercial operation September 2015)', 'https://masdar.ae/en/renewables/our-projects/tafila-wind-farm'),
    # ------------------------------------------------ Kenya, Senegal
    dup('KEN', 'Lake Turkana', P, ('Lake Turkana', C), 'WRI GPPD 舊資料，與精選紀錄是同一座', 'Old WRI GPPD record of the same farm'),
    fix('KEN', 'Lake Turkana', C, '2018 年 9 月首次併網、10 月商轉（2019 年 7 月是落成典禮）',
        'First grid power September 2018, commissioned October 2018 (July 2019 was the inauguration)',
        'https://en.wikipedia.org/wiki/Lake_Turkana_Wind_Power_Station', year=2018),
    fix('KEN', 'Chania Green Wind Project', G, '尚在開發、未建成（GEM 標為 2021 年營運，沒有出處）',
        'Still in development, not built (GEM’s “operating since 2021” cites no source)',
        'https://www.power-technology.com/marketdata/power-plant-profile-chania-green-wind-project-kenya/', st=2, year=0),
    fix('KEN', 'Kilifi wind farm', G, '2019 年 12 月啟用；Mombasa Cement 的自備電廠，餘電併入國家電網',
        'Commissioned December 2019; a captive plant of Mombasa Cement that feeds its surplus into the grid',
        'https://en.wikipedia.org/wiki/Mombasa_Cement_Wind_Power_Station', year=2019, note=True),
    fix('SEN', 'Léona wind farm', G, '仍在開發（2010 年設測風塔，未見融資或施工）',
        'Still in development (met mast in 2010; no financing or construction reported)',
        'http://www.arei.info/fr_EleQtra_Wind___Leona_50_MW__Wind.html', st=2, year=0),
    fix('SEN', 'Taiba N’Diaye wind farm', G, '三期：2019、2020 年各 55.2 MW，2021 年 48.3 MW',
        'Three phases: 55.2 MW each in 2019 and 2020, 48.3 MW in 2021',
        'https://en.wikipedia.org/wiki/Taiba_N%27Diaye_Wind_Power_Station', mw=158.7, ph=[[2019, 55.2], [2020, 55.2], [2021, 48.3]]),
    # ------------------------------------------------ Dominican Republic
    fix('DOM', 'Granadillos wind farm', G, '開發商表示仍在開發階段', 'The developer says it is still in development',
        'https://gedom.do/los-granadillos/', st=2, year=0),
    fix('DOM', 'La Isabela wind farm', G, '只有特許權，未見施工或啟用', 'Concession only; no construction or opening found',
        'https://cne.gob.do/parque-eolico-la-isabela/', st=2, year=0),
    fix('DOM', 'Puerto Plata-Imbert wind farm', G, '只有特許權、未見施工；當地實際建成的是 Los Guzmancito',
        'Concession only, no construction found; the farm actually built there is Los Guzmancito',
        'https://cne.gob.do/parque-eolico-puerto-plata-lmbert/', st=2, year=0),
    dup('DOM', 'Pecasa wind farm', G, ('Guanillo wind farm', G),
        'PECASA（Parques Eólicos del Caribe）就是 El Guanillo 風場的業主：同一場址、同樣 25 部風機',
        'PECASA (Parques Eólicos del Caribe) owns the El Guanillo farm: same site, same 25 turbines',
        'https://www.proparco.fr/en/carte-des-projets/pecasa'),
    fix('DOM', 'Los Cocos wind farm', G, '77.2 MW（一期 25.2 MW 2011、二期 52 MW 2013）；GEM 的 87.3 MW 把 Quilvio Cabrera 也算進去',
        '77.2 MW (25.2 MW in 2011, 52 MW in 2013); GEM’s 87.3 MW also counted Quilvio Cabrera',
        'https://www.egehaina.com/Centrales?name=LOSCOCOS', mw=77.2, ph=[[2011, 25.2], [2013, 52]]),
    fix('DOM', 'Los Guzmancito wind farm', G, '兩期：2019 年 48.3 MW、2023 年 50 MW', 'Two phases: 48.3 MW in 2019 and 50 MW in 2023',
        'https://www.diariolibre.com/actualidad/nacional/2023/07/01/inauguran-parque-eolico-los-guzmancito-en-puerto-plata/2391911',
        mw=98.3, ph=[[2019, 48.3], [2023, 50]]),
    fix('DOM', 'Matafongo wind farm', G, '2024 年 10 月擴建 15.6 MW（3 × 5.2 MW）', 'Extended by 15.6 MW (3 × 5.2 MW) in October 2024',
        'https://listindiario.com/economia/energia/20241016/interenergy-instala-turbinas-eolicas-mas-grandes-centroamerica-caribe_829793.html',
        mw=49.6, ph=[[2019, 34], [2024, 15.6]]),
    # ------------------------------------------------ Colombia
    fix('COL', 'Vientos De Galerazamba wind farm', G, '仍是規劃案，未見施工或商轉', 'Still a proposed project; no construction or commissioning found',
        'https://www.bnamericas.com/en/project-profile/wind-farm-winds-galerazamba', st=3, year=0),
    fix('COL', 'WESP 01 wind farm', G, '2022 年加入運轉（ISAGEN，與 Guajira I 相鄰）', 'In operation from 2022 (ISAGEN, next to Guajira I)',
        'https://www.valoraanalitik.com/2022/01/19/extension-guajira-1-wesp-01-operacion-julio-2022/', year=2022),
    drop('COL', 'El Morro wind farm', G, '查無此風場；Grupo Argos 旗下唯一的風場是 2025 年在大西洋省啟用的 Carreto（9.6 MW）',
         'No such farm found; Grupo Argos’s only wind farm is Carreto (9.6 MW, Atlántico, 2025)',
         'https://www.eltiempo.com/colombia/barranquilla/el-atlantico-entra-a-la-era-de-la-energia-eolica-con-el-primer-parque-de-celsia-en-colombia-3460285'),
    # ------------------------------------------------ Norway
    drop('NOR', 'Fosen Vind (six farms)', C, '六座風場的彙總（Roan、Storheia、Harbaksfjellet、Kvenndalsfjellet、Geitfjellet、Hitra 2，合計 1,057.6 MW），各座已逐場列出',
         'Aggregate of six farms (Roan, Storheia, Harbaksfjellet, Kvenndalsfjellet, Geitfjellet, Hitra 2; 1,057.6 MW) that are listed individually',
         NO_LIST),
    dup('NOR', 'Smola wind farm', G, ('Smøla', C), '同一座風場；分期（2002 年 40 MW、2005 年 110 MW）與業主移到精選紀錄',
        'Same farm; its phases (40 MW in 2002, 110 MW in 2005) and owner move to the curated record',
        'https://en.wikipedia.org/wiki/Sm%C3%B8la_Wind_Farm'),
    drop('NOR', 'Hordavind wind farm', G, '從未建成：1,500 MW 的申請在 2026 年 2 月被 NVE 駁回',
         'Never built: NVE rejected the 1,500 MW application in February 2026',
         'https://www.nve.no/konsesjon/konsesjonssaker/konsesjonssak?id=7412&type=A-6'),
    no_year('Sormarkfjellet wind farm', 2021, 130.2), no_year('Stokkfjellet wind farm', 2021, 88.2),
    no_year('Lutelandet wind farm', 2021, 51.1), no_year('Tysvaer wind farm', 2021, 47.3), no_year('Haram wind farm', 2021, 34),
    no_year('Svaheia wind farm', 2018, 25.2), no_year('Gismarvik wind farm', 2021, 12.6),
    fix('NOR', 'Havøygavlen wind farm', G, '2020–21 年汰換為 9 部 V117（另保留 1 部 2010 年的 3 MW 測試機），合計 41.4 MW',
        'Repowered in 2020–21 with nine Vestas V117 (plus a 3 MW test turbine from 2010), 41.4 MW in total',
        'https://finnmarkkraft.no/prosjekter/havoygavlen-vindpark', year=2021, mw=41.4),
    # ------------------------------------------------ Netherlands
    drop('NLD', 'Beaufort wind farm', G, '從未建成：2009 年取得許可但未獲補貼，許可延到 2020 年仍未興建',
         'Never built: permitted in 2009 but got no subsidy; the permit was extended to 2020 and the farm was never built',
         'https://group.vattenfall.com/nl/newsroom/archive/nieuws/2012/vergunning-nuon-windpark-beaufort-verlengd-tot-2020'),
    dup('NLD', 'Amazon Shell HKN offshore wind farm', G, ('Hollandse Kust Noord', C),
        '就是 Hollandse Kust Noord（CrossWind：Shell 與 Eneco；Amazon 只是購電方）',
        'This is Hollandse Kust Noord (CrossWind: Shell and Eneco; Amazon only buys power)',
        'https://en.wikipedia.org/wiki/Hollandse_Kust_Noord_Offshore_Wind_Farm'),
    fix('NLD', 'Hollandse Kust Noord', C, '業主改為 CrossWind（Shell、Eneco）；原欄位是鄰近風場的業主',
        'Owner set to CrossWind (Shell, Eneco); the field held a neighbouring farm’s owners',
        'https://en.wikipedia.org/wiki/Hollandse_Kust_Noord_Offshore_Wind_Farm', owner='CrossWind (Shell; Eneco)'),
    dup('NLD', 'Noordoostpolder-Westermeerwind Windpark', G, ('Noordoostpolder (incl. Westermeerwind nearshore)', C),
        '同一座風場（GEM 座標偏西約 80 km，落在北海）', 'Same farm (the GEM point is about 80 km west, in the North Sea)', NL_NOP),
    dup('NLD', 'Noordoostpolder Buitendijks wind farm', G, ('Westermeerwind', C),
        'Westermeerwind 位於弗里斯蘭省水域的幾部風機', 'The Westermeerwind turbines standing in Friesland waters',
        'https://www.gem.wiki/Noordoostpolder_Buitendijks_wind_farm'),
    dup('NLD', 'Binnenjijks wind farm', G, ('Noordoostpolder (incl. Westermeerwind nearshore)', C),
        'Noordoostpolder 堤內（binnendijks）的陸上風機', 'The land turbines of Noordoostpolder inside the dike (binnendijks)',
        'https://www.gem.wiki/Binnenjijks_wind_farm'),
    fix('NLD', 'Noordoostpolder (incl. Westermeerwind nearshore)', C,
        '全區 429 MW＝湖中的 Westermeerwind 144 MW（另列一筆）＋堤岸上的 NOP Agrowind 195 MW（2016）與 Zuidwester 90 MW（2017）；原本的 429 MW 重複計入 Westermeerwind',
        'The whole park is 429 MW: Westermeerwind in the lake, 144 MW (its own record), plus NOP Agrowind 195 MW (2016) and '
        'Zuidwester 90 MW (2017) on the dikes; the old 429 MW counted Westermeerwind twice', NL_NOP,
        rename='Noordoostpolder (NOP Agrowind + Zuidwester)', mw=285, year=2016, ph=[[2016, 195], [2017, 90]]),
    # ------------------------------------------------ Portugal
    dup('PRT', 'Alto Do Talefe wind farm', G, ('Alto do Talefe', P), '同一座風場；實際位於 Cinfães（Montemuro 山），GEM 座標誤放在布拉加',
        'Same farm; it is in Cinfães (Serra de Montemuro) and the GEM point was placed in Braga', 'https://www.openstreetmap.org/relation/14053337'),
    # ------------------------------------------------ United Kingdom, Denmark, Finland, Turkey
    dup('GBR', 'Westermost Rough A wind farm', G, ('Westermost Rough', C), '同一座風場；GEM 座標在林肯郡外海，偏離約 80 km',
        'Same farm; the GEM point is off Lincolnshire, about 80 km away', 'https://en.wikipedia.org/wiki/Westermost_Rough_Wind_Farm'),
    dup('GBR', 'Hornsea wind farm · 1', G, ('Hornsea One', C), '同一座風場', 'Same farm'),
    dup('GBR', 'Dogger Bank wind farm', G, ('Dogger Bank A', C), '同一座風場（Dogger Bank A，2023 年 10 月首次發電）',
        'Same farm (Dogger Bank A, first power October 2023)', 'https://www.equinor.com/news/202310-dogger-bank'),
    drop('GBR', 'Hornsea wind farm · 3, 4', G, 'Hornsea 3 已由 2026 整理清單列為興建中；Hornsea 4 已於 2025 年 5 月由 Ørsted 停止開發',
         'Hornsea 3 is already listed as under construction (2026 compilation); Ørsted discontinued Hornsea 4 in May 2025',
         'https://orsted.com/en/company-announcement-list/2025/05/orsted-to-discontinue-the-hornsea-4-offshore-wind--143901911'),
    dup('DNK', 'Vesterhav Offshore wind farm · Nord', G, ('Vesterhav Nord', C), '同一座風場', 'Same farm',
        'https://powerplants.vattenfall.com/vesterhav-nord/'),
    fix('DNK', 'Vesterhav Nord', C, '座標改到 Thyborøn 與 Ferring Sø 之間的外海（原座標偏南約 20 km）',
        'Point moved offshore between Thyborøn and Ferring Sø (the old one was about 20 km too far south)',
        'https://powerplants.vattenfall.com/vesterhav-nord/', lat=56.61, approx=True),
    dup('FIN', 'Kemi Ajos', C, ('Ajos Retrofit wind farm', G),
        '同一場址；GEM 有完整沿革（2008 年的原機組 27 MW 到 2016 年，之後汰換為 43 MW），保留 GEM 的兩筆',
        'Same site; GEM has the fuller history (the original 27 MW from 2008 to 2016, then repowered to 43 MW), so its two records are kept'),
    dup('TUR', 'Gökçedag wind farm', G, ('Gökçedağ (Osmaniye)', C), '同一座風場（又稱 Bahçe 風場）', 'Same farm (also called the Bahçe Wind Farm)',
        'https://en.wikipedia.org/wiki/Bah%C3%A7e_Wind_Farm'),
    fix('TUR', 'Gökçedağ (Osmaniye)', C, '座標改到 Bahçe 與 Hasanbeyli 之間的 Gökçedağ 稜線（原座標偏離約 30 km）',
        'Point moved to the Gökçedağ ridge between Bahçe and Hasanbeyli (the old one was about 30 km off)',
        'https://www.openstreetmap.org/relation/12270025', lat=37.15, lon=36.61),
    # ------------------------------------------------ Belgium, France（2026-09 比對 OSPAR 離岸風場資料時發現）
    drop('BEL', 'C-Power Offshore Wind Project', G,
         'Thorntonbank 風場（營運商 C-Power）的整場合計；三期已由精選的 Thornton Bank I、II、III 逐期列出（30 + 184.5 + 110.7 MW）',
         'The whole-farm total for Thorntonbank (operated by C-Power); its three phases are already listed as the curated '
         'Thornton Bank I, II and III (30 + 184.5 + 110.7 MW)', 'https://en.wikipedia.org/wiki/Thorntonbank_Wind_Farm'),
    # ------------------------------------------------ 歐洲離岸風場（2026-09 查水下基礎第 2 步時發現）
    fix('DEU', 'Borkum Riffgrund 3', C, '座標改到建成風場範圍的中心（原座標偏東南約 18 km，落在 Borkum Riffgrund 1、2 旁）',
        'Point moved to the centre of the built array (the old one was about 18 km to the south-east, next to Borkum Riffgrund 1 and 2)',
        'https://www.openstreetmap.org/way/1271257138', lat=54.05, lon=6.19),
    fix('DEU', 'Hohe See', C, '座標改到建成風場範圍的中心（原座標偏東約 9 km）', 'Point moved to the centre of the built array (the old one was about 9 km to the east)',
        'https://www.openstreetmap.org/way/344491479', lat=54.44, lon=6.33),
    fix('DEU', 'Hooksiel (BARD test turbine)', C, '2016 年 5 月拆除（當時已停機約四年）', 'Dismantled in May 2016, after about four years out of service',
        'https://www.thb.info/rubriken/offshore-windenergie/detail/news/ein-pionier-windrad-verlaesst-hooksiel.html', end=2016),
    fix('GBR', 'Sofia', C, '興建中：100 部風機 2026 年 6 月 10 日全部裝好，仍在試運轉（原本誤列為 2025 年營運中；2025 年還沒有發電）',
        'Under construction: all 100 turbines were in place on 10 June 2026 and commissioning is still under way (it was wrongly listed as '
        'operating in 2025; it generated nothing in 2025)',
        'https://www.rwe.com/en/press/rwe-ag/2026-06-11-rwe-completes-installation-of-all-turbines-at-sofia-offshore-wind-farm/', st=1, year=2026, note=True),
    fix('GBR', 'Sofia', C, '座標改到核准風場範圍（Dogger Bank Teesside B，592 km²）的中心；原座標在範圍外約 38 km',
        'Point moved to the centre of the consented array (Dogger Bank Teesside B, 592 km²); the old one was about 38 km outside it',
        'https://www.legislation.gov.uk/uksi/2015/1592/schedule/1/made', lat=54.99, lon=2.23),
    dup('GBR', 'Sofia wind farm', G, ('Sofia', C), '同一座風場（RWE，1.4 GW）；GEM 座標是整個 Dogger Bank 區的代用點', 'Same farm (RWE, 1.4 GW); the GEM point is a placeholder for the whole Dogger Bank area',
        'https://www.rwe.com/en/press/rwe-ag/2026-06-11-rwe-completes-installation-of-all-turbines-at-sofia-offshore-wind-farm/'),
    fix('GBR', 'Dogger Bank A', C, '業主改為 Equinor、SSE Renewables 與 Vårgrønn 的合資；原欄位是 Dogger Bank South 的業主',
        'Owner set to the Equinor, SSE Renewables and Vårgrønn joint venture; the field held Dogger Bank South’s owners',
        'https://www.equinor.com/news/202310-dogger-bank', owner='Equinor; SSE Renewables; Vårgrønn'),
    fix('GBR', 'Dogger Bank A', C,
        '逐年併網（WindEurope 年度統計）：2023 年 1 部（13 MW）、2024 年 63 MW、2025 年 66 部（834 MW）；95 部風機 2026 年 2 月全部裝好，其餘仍在試運轉',
        'Connected year by year (WindEurope annual statistics): one turbine (13 MW) in 2023, 63 MW in 2024 and 66 turbines (834 MW) in 2025; '
        'all 95 turbines were in place by February 2026 and the rest is still being commissioned',
        'https://proceedings.windeurope.org/biplatform/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBa01LIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19'
        '--8aebcd72a09f63bec00d2131e13a2a48069695a4/WindEurope-European-Stats-2025.pdf',
        year=2023, ph=[[2023, 13], [2024, 63], [2025, 834], [2026, 290]], note=True),
    fix('FRA', "Îles d'Yeu et de Noirmoutier", C, '實際為 61 部 × 8 MW＝488 MW（原本寫 62 部、496 MW）；2025 年 6 月開始發電，年底已併網 408 MW，2026 年 4 月全部完工',
        'Built as 61 × 8 MW = 488 MW (it was listed as 62 turbines and 496 MW); first power in June 2025, 408 MW connected by the end of 2025, '
        'complete in April 2026',
        'https://www.meretmarine.com/fr/energies-marines/parc-de-yeu-noirmoutier-toutes-les-eoliennes-ont-ete-installees',
        mw=488, turbine='61 x Siemens Gamesa SG 8.0-167 DD', ph=[[2025, 408], [2026, 80]], note=True),
    fix('FRA', 'Calvados (Courseulles-sur-Mer)', C, '興建中：比原計畫延後約兩年，EDF 預計 2027 年底商轉（原本誤列為 2025 年營運中）',
        'Under construction: about two years behind the original plan, EDF expects commissioning at the end of 2027 (it was wrongly listed as '
        'operating in 2025)', 'https://www.connaissancedesenergies.org/afp/en-normandie-la-mise-en-service-du-parc-eolien-calvados-reportee-de-2-ans-250705',
        st=1, year=2027, note=True),
    fix('IRL', 'Arklow Bank Phase 1', C, '最後三部風機 2024 年 5 月因安全原因停機，此後不再發電；業者 2026 年 9 月表示將申請拆除',
        'The last three turbines were shut down for safety reasons in May 2024 and it has not generated since; in September 2026 the operator '
        'said it would apply to dismantle it',
        'https://www.rte.ie/news/business/2026/0910/1591020-plans-lodged-to-dismantle-constructed-off-shore-wind-farm/', end=2024, note=True),
    fix('NLD', 'Windpark Fryslân', C, '座標改到 89 部風機的中心（原座標偏東約 6 km，在最東一排風機外）',
        'Point moved to the centre of the 89 turbines (the old one was about 6 km to the east, beyond the easternmost row)',
        'https://www.openstreetmap.org/way/672905354', lon=5.26),
    fix('NLD', 'Irene Vorrink (Dronten)', C, '2022 年 3 月起拆除，由 Windplanblauw 取代；原座標在陸上，改到萊利斯塔德北邊艾瑟爾湖堤外的水域（概略位置）',
        'Dismantled from March 2022 and replaced by Windplanblauw; the old point was on land, so it is moved into the water off the '
        'IJsselmeer dike north of Lelystad (approximate)',
        'https://group.vattenfall.com/press-and-media/newsroom/2022/dismantling-of-irene-vorrink-wind-farm-after-25-years-of-faithful-service',
        end=2022, lat=52.6, lon=5.585, approx=True),
    dup('NLD', 'Dronten offshore wind farm', G, ('Irene Vorrink (Dronten)', C),
        '同一座風場：早年的離岸風場清單把艾瑟爾湖 Dronten 的 Nordtank 600 kW 風機（1996 年起）列為「Dronten」，就是 Irene Vorrink；GEM 座標在北海',
        'Same farm: early offshore lists called the Nordtank 600 kW turbines at Dronten in the IJsselmeer (from 1996) “Dronten”, which is '
        'Irene Vorrink; the GEM point is in the North Sea',
        'https://www.techniques-ingenieur.fr/actualite/articles/10-parcs-eoliens-offshore-dans-le-monde-et-tous-en-europe-6521/'),
    dup('NLD', 'NOP Agrowind wind farm', G, ('Noordoostpolder (incl. Westermeerwind nearshore)', C),   # 規則依原名比對（改名見上方荷蘭一節）
        '就是 Noordoostpolder 風場堤岸上的 NOP Agrowind（26 部 Enercon E-126，195 MW），在陸上，不是離岸',
        'This is NOP Agrowind (26 Enercon E-126, 195 MW) on the dikes of the Noordoostpolder wind park: on land, not offshore', 'https://nopagrowind.nl/'),
    fix('NLD', 'Windplanblauw offshore wind farm', G,
        '座標改到艾瑟爾湖中兩排共 24 部風機的位置（原座標在北海，偏西約 82 km）；132 MW 是湖中部分，另有 37 部在陸上',
        'Point moved to the two rows of 24 turbines in the IJsselmeer (the old one was in the North Sea, about 82 km to the west); '
        'the 132 MW is the part in the lake, and 37 more turbines stand on land', 'https://www.openstreetmap.org/relation/12695731', lat=52.6, lon=5.58),
    fix('NLD', 'Borssele V (Two Towers innovation site)', C, '座標改到兩部風機的位置（原座標偏東北約 3 km）',
        'Point moved to the two turbines (the old one was about 3 km to the north-east)', 'https://www.openstreetmap.org/node/7680250702',
        lat=51.71, lon=3.004),
    dup('NLD', 'Borssele Site V wind farm', G, ('Borssele V (Two Towers innovation site)', C),
        '同一座風場（兩部 V164-9.5 MW，2022 年由 Octopus Energy 買下）；GEM 座標偏北約 85 km',
        'Same farm (two V164-9.5 MW, bought by Octopus Energy in 2022); the GEM point is about 85 km to the north',
        'https://www.offshorewind.biz/2022/06/29/dutch-offshore-wind-innovation-site-gets-new-owner/'),
    drop('NOR', 'Karmoy Wind Turbine Demonstration Area', G,
         '只取得許可、從未興建：NVE 2010 年核准兩部固定式示範機組（最多 10 MW），METCentre 於 2024 年 7 月撤回許可',
         'Licensed but never built: NVE licensed two bottom-fixed demonstration turbines (up to 10 MW) in 2010, and METCentre withdrew the '
         'licence in July 2024', 'https://www.nve.no/konsesjon/konsesjonssaker/konsesjonssak/?type=A-6&id=193'),
    drop('NOR', 'Kvitsoy Wind Turbine Demonstration Area', G, '只取得許可、從未興建：NVE 的資料列為「許可已撤回」，沒有運轉日期',
         'Licensed but never built: NVE lists the licence as withdrawn, with no date of first operation',
         'https://kart.nve.no/enterprise/rest/services/Vindkraft2/MapServer/5/query?where=saksid+in+(192,193,194)&outFields=saksid,anleggnavn,'
         'kommune,stadium,sakskategori,status,forsteidriftdato,effekt_mw&returnGeometry=false&f=json'),
    drop('NOR', 'Rennesoy Wind Turbine Demonstration Area', G,
         '只取得許可（NVE 2010 年）、從未興建：NVE 的已建成風場圖層在這一帶只有 Tysvær、Gismarvik、Zephyros、Utsira、Storøy',
         'Licensed (NVE, 2010) but never built: NVE’s layer of built wind plants shows only Tysvær, Gismarvik, Zephyros, Utsira and Storøy in this area',
         'https://kart.nve.no/enterprise/rest/services/Vindkraft2/MapServer/0/query?where=1%3D1&geometry=4.8,58.9,5.8,59.4&geometryType='
         'esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=saksid,anleggnavn,kommune,status,effekt_mw&returnGeometry=false&f=json'),
    drop('NOR', 'Marine Energy Test Centre wind farm', G,
         'METCentre 測試場許可的容量（浮動式 10 MW＋固定式 10 MW），不是一座風場：實際只有 Hywind Demo（Zefyros）與 TetraSpar 兩部浮動式機組，本站已分別列出；固定式從未興建',
         'The licensed capacity of the METCentre test site (10 MW floating plus 10 MW bottom-fixed), not a wind farm: the only turbines are '
         'the floating Hywind Demo (Zefyros) and TetraSpar, both listed separately; the bottom-fixed part was never built',
         'https://www.norwegianoffshorewind.no/about/initiatives/met-centre/'),
    fix('SWE', 'Utgrunden I', C, '2018 年由 Vattenfall 拆除', 'Dismantled by Vattenfall in 2018',
        'https://www.offshorewind.biz/2018/10/04/swedish-offshore-wind-farm-is-no-more/', end=2018),
    fix('SWE', 'Bockstigen', C, '2018 年換上整修過的 Vestas V47（660 kW）機艙與葉片，沿用原本的塔架與基礎，容量由 2.8 MW 增為 3.3 MW',
        'In 2018 refurbished Vestas V47 (660 kW) nacelles and blades went onto the original towers and foundations, raising the capacity from 2.8 to 3.3 MW',
        'https://www.offshorewind.biz/2018/12/05/swedish-old-timer-gains-momentum/', mw=3.3, ph=[[1998, 2.8], [2018, 0.5]]),
    fix('SWE', 'Vindpark Vänern (Gässlingegrund)', C, '座標改到維納恩湖 Gässlingegrund 的 10 部風機（原座標偏南約 27 km）',
        'Point moved to the 10 turbines on Gässlingegrund in Lake Vänern (the old one was about 27 km to the south)',
        'https://www.openstreetmap.org/relation/14399986', lat=59.26, lon=13.385),
    fix('ALA', 'Långnabba wind farm', G, '在奧蘭 Eckerö 南端的陸地上（只有輸電海纜在海底），不是離岸風場',
        'On land at the southern tip of Eckerö, Åland (only the export cable runs under the sea); not an offshore farm',
        'https://www.hbl.fi/2023-07-16/det-behovs-en-alanning-pa-varje-vindkraftverk-nu-har-alands-mr-vindkraft-fastnat-for-gront-vate/', type=0),
    # ------------------------------------------------ 浮動式風場（2026-09 查水下基礎第 3 步時發現）
    drop('ESP', 'Biscay Marine Energy Platform wind farm', G,
         'BiMEP 測試場的併網容量（四條 5 MW 海纜），不是一座風場；測試場唯一裝過的風機 DemoSATH 已另列',
         'The BiMEP test site’s grid capacity (four 5 MW export cables), not a wind farm; the only wind turbine ever installed there, '
         'DemoSATH, is listed separately', 'https://www.bimep.com/en/bimep-area/technical-characteristics/'),
    dup('FRA', 'EFGL wind farm', G, ('Les Éoliennes Flottantes du Golfe du Lion (EFGL)', C), '同一座風場（Leucate 外海，30 MW）',
        'Same farm (off Leucate, 30 MW)', 'https://www.gem.wiki/EFGL_wind_farm'),
    fix('FRA', 'Les Éoliennes Flottantes du Golfe du Lion (EFGL)', C,
        '2026 年 5 月開始發電、7 月全面運轉，業主是 Ocean Winds 與 Banque des Territoires；時間軸「2026（最新可得）」起列為營運中',
        'First power in May 2026 and full power in July 2026; owned by Ocean Winds with Banque des Territoires; operating from the timeline\'s "2026 (latest available)" point',
        'https://www.renewableenergymagazine.com/wind/ocean-winds-reaches-full-power-from-first-20260717',
        st=0, year=2026, owner='Ocean Winds; Banque des Territoires', note=True),
    dup('FRA', 'Eolmed Floating wind farm', G, ('EolMed (Gruissan)', C), '同一座風場（Gruissan 外海，30 MW）',
        'Same farm (off Gruissan, 30 MW)', 'https://www.gem.wiki/Eolmed_Floating_wind_farm'),
    fix('FRA', 'EolMed (Gruissan)', C, '2026 年 4 月開始發電、5 月全面運轉；時間軸「2026（最新可得）」起列為營運中',
        'First power in April 2026 and full capacity in May 2026; operating from the timeline\'s "2026 (latest available)" point', 'https://www.bw-ideol.com/en/eolmed-project', st=0, year=2026, note=True),
    fix('FRA', 'Provence Grand Large', C,
        '機組是西門子歌美颯 SWT-8.0-154（以 8.4 MW 運轉，葉片 75 m），不是 Vestas；RTE 專案文件寫明選用 SWT-8.0-154，SBM 寫 3 座浮動機組安裝完成',
        'The turbines are Siemens Gamesa SWT-8.0-154 (run at 8.4 MW, 75 m blades), not Vestas; the RTE project dossier names the SWT-8.0-154 and SBM reports the three floating units installed',
        'https://www.sbmoffshore.com/newsroom/sbm-offshore-announces-successful-installation-3-floating-wind-units/',
        turbine='3 x Siemens Gamesa SWT-8.0-154 at 8.4 MW (SBM tension-leg)'),
    drop('GBR', 'Dounreay Tr‚àö¬®  Floating Wind Demonstration', G,   # GEM 2026-02 的名稱編碼壞掉（原為 Dounreay Trì）· mojibake in GEM 2026-02
         '從未興建：這個兩部風機的示範案已經中止，同一場址後來改由 Pentland 浮動式風場開發（另列）',
         'Never built: this two-turbine demonstrator was discontinued, and the site was later taken up by the Pentland floating wind farm '
         '(listed separately)', 'https://www.offshorewind.biz/2021/06/18/cip-revives-floating-wind-project-offshore-scotland/'),
    fix('GBR', 'Kincardine', C, '現在是 5 部 9.5 MW（47.5 MW）；2018–2020 年曾有 1 部 2 MW 試驗機（原 WindFloat 1），2020 年移走',
        'Now 5 × 9.5 MW (47.5 MW); a 2 MW trial unit (the former WindFloat 1) ran from 2018 to 2020 and was then removed',
        'https://marine.gov.scot/sites/default/files/250403_-_kincardine_offshore_windfarm_-_project_environmental_monitoring_programme_-_revision_c10.pdf',
        mw=47.5, turbine='5 x MHI Vestas V164-9.5 MW', note=True),
    fix('NOR', 'TetraSpar Demonstrator (METCentre)', C, '2026 年夏天除役，拖回港口', 'Decommissioned in summer 2026 and brought back to port',
        'https://www.rwe.com/en/our-energy/discover-renewables/floating-offshore-wind/tetraspar/', end=2026, note=True),
    fix('PRT', 'WindFloat 1 (Aguçadoura demo)', C, '座標改到阿古薩杜拉外海約 5 km（概略位置；原座標偏西約 13 km）',
        'Point moved to about 5 km off Aguçadoura (approximate; the old one was about 13 km further west)',
        'https://www.principlepower.com/projects/windfloat1', lat=41.43, lon=-8.84, approx=True),
    fix('PRT', 'WindFloat Atlantic', C, '業主改為專案出資方 Ocean Winds、東京瓦斯與 Repsol；原欄位是比對錯的公司名',
        'Owner set to the project sponsors Ocean Winds, Tokyo Gas and Repsol; the field held a wrongly matched company name',
        'https://www.principlepower.com/projects/windfloat-atlantic', owner='Ocean Winds; Tokyo Gas; Repsol'),
    fix('CHN', "Mingyang Qingzhou 4 floating 'OceanX' & Tiancheng", C,
        '「OceanX」與「明陽天成號」是同一座浮台（一座浮台上兩部 8.3 MW 風機，共 16.6 MW），名稱合為一個',
        '“OceanX” and “Mingyang Tiancheng” are the same floater (two 8.3 MW turbines on one platform, 16.6 MW), so the names are merged',
        'https://www.ditan.com/industry/energy/4497.html', rename='Mingyang OceanX (Tiancheng) floating'),
    fix('CHN', 'Haiyou Guanlan (CNOOC floating)', C, '裝機容量 7.25 MW', 'Installed capacity 7.25 MW',
        'http://finance.people.com.cn/n1/2023/0520/c1004-32690779.html', mw=7.25),
    fix('JPN', 'Fukushima FORWARD floating demo', C,
        '三部浮動式機組：2013 年 11 月 2 MW（半潛式）、2015 年 12 月 7 MW（V 型半潛式）、2017 年 2 月 5 MW（單柱式）開始運轉；'
        '7 MW 於 2018 年決定停機、2020 年撤除，其餘兩部 2021 年 2 月起撤除',
        'Three floating units started in November 2013 (2 MW, semi-submersible), December 2015 (7 MW, V-shaped semi-submersible) and '
        'February 2017 (5 MW, spar); the 7 MW unit was stopped in 2018 and removed in 2020, and removal of the other two began in February 2021',
        'https://www.fukushima-forward.jp/reference/pdf/study086.pdf', ph=[[2013, 2], [2015, 7], [2017, 5]], note=True),
    fix('JPN', 'Goto City Offshore floating project', C, '2026 年 1 月 5 日開始商轉（8 部 2.1 MW，五島洋上風場）；時間軸「2026（最新可得）」起列為營運中',
        'Commercial operation began on 5 January 2026 (eight 2.1 MW units, Goto Offshore Wind Farm); operating from the timeline\'s "2026 (latest available)" point',
        'https://www.toda.co.jp/news/2026/20260105_006181.html', zhname='五島洋上風場', st=0, year=2026, note=True),
    dup('JPN', 'Kyushu floating wind farm', G, ('Kyushu - GIP floating wind farm', G), '同一個規劃案（Skyborn，1 GW，五島外海）；GEM 有兩筆',
        'The same planned project (Skyborn, 1 GW, off the Goto Islands); GEM lists it twice', 'https://www.gem.wiki/Kyushu_floating_wind_farm'),
    drop('KOR', 'Firefly (Bandibuli) floating offshore wind farm', G, 'Equinor 於 2026 年 5 月停止開發', 'Equinor stopped the project in May 2026',
         'https://www.equinor.co.kr/en/news/important-notice-on-bandibuli-project_en'),
    fix('ESP', 'Timanfaya Floating Offshore wind farm', G, '浮動式：開發商 Capital Energy 的專案採浮動式技術（GEM 誤列為固定式）',
        'Floating: the developer, Capital Energy, uses floating technology for it (GEM lists it as fixed-bottom)',
        'https://www.evwind.es/2023/02/17/capital-energy-will-invest-2500-million-in-four-wind-farms-in-the-canary-islands-three-of-them-offshore/90273', type=2),
    # ------------------------------------------------ Thailand, Philippines, Iran
    drop('THA', 'Jhimpir Power (Energy Absolute) wind farm', G,
         '不存在：Jhimpir 在巴基斯坦，Energy Absolute 在泰國沒有 600 MW 風場（它在猜也蓬的 Hanuman 各場另有紀錄）',
         'Does not exist: Jhimpir is in Pakistan and Energy Absolute has no 600 MW farm in Thailand (its Hanuman farms in Chaiyaphum are listed separately)',
         'https://www.energyabsolute.co.th/en/our-businesses/renewable-business/wind-power-plants'),
    fix('THA', 'Subyai (Chaiyaphum)', C, 'EGCO 的 Chaiyaphum 風場：80 MW（32 × 2.5 MW），2016 年 12 月商轉；業主名稱原本拼錯',
        'EGCO’s Chaiyaphum Wind Farm: 80 MW (32 × 2.5 MW), commercial operation December 2016; the owner name was misspelt',
        'https://www.bangkokpost.com/business/1163661/egco-kicks-off-latest-wind-farm', mw=80, owner='EGCO'),
    dup('PHL', 'Pagudpud (ACEN) Wind Power Project', G, ('Balaoi & Caunayan', C), 'Bayog Wind Power 是 ACEN 這座 160 MW 風場的專案公司，同一座',
        'Bayog Wind Power is ACEN’s project company for this 160 MW farm: same farm',
        'https://business.inquirer.net/323245/acen-shells-out-p3b-to-partly-fund-phs-biggest-windmill-farm'),
    fix('PHL', 'Bangui Bay', C, '三期：2005 年 24.75 MW、2008 年 8.25 MW、2014 年 18.9 MW', 'Three phases: 24.75 MW (2005), 8.25 MW (2008), 18.9 MW (2014)',
        'https://en.wikipedia.org/wiki/Wind_power_in_the_Philippines', mw=51.9, ph=[[2005, 24.75], [2008, 8.25], [2014, 18.9]]),
    dup('IRN', 'Siahpoush (Manjil) wind farm', G, ('Manjil wind farm', G),
        'Manjil 風場群（Manjil、Rudbar、Harzevil、Siahpoush，共 92.2 MW）中的 Siahpoush 區',
        'The Siahpoush site of the Manjil complex (Manjil, Rudbar, Harzevil and Siahpoush; 92.2 MW)', MANJIL),
    dup('IRN', 'Harzvil wind farm', G, ('Manjil wind farm', G), 'Manjil 風場群中的 Harzevil 區', 'The Harzevil site of the Manjil complex', MANJIL),
    fix('IRN', 'Manjil wind farm', G, 'Manjil 風場群合計 92.2 MW，1995 年起分期興建、2015 年完工',
        'The Manjil complex totals 92.2 MW, built in phases from 1995 and completed in 2015', MANJIL, mw=92.2, note=True),
    fix('IRN', 'Binalood wind farm', G, '2008 年啟用（43 × 660 kW）', 'Online in 2008 (43 × 660 kW)',
        'https://en.wikipedia.org/wiki/Binalood_Wind_Farm', year=2008),
    # 2026-10-06 查證（出處原文以 check_quotes.py 核對；伊朗官方網站在核對環境連不上，改用轉載與官方數字）
    fix('IRN', 'Tizbaad wind farm', G,
        '查無運轉證據：伊朗再生能源署（SATBA）2025 年 11 月底分省資料，整個禮薩呼羅珊省（含 28 MW 的 Binalood）風電只有 51.30 MW，容不下 Khaf 縣 100 MW 的 Tizbaad；'
        '2020 年 10 月全國風電僅 302.82 MW；2024 年 6 月 50 MW 的 Mil Nader 仍被稱為伊朗東部目前最大的風場。GEM 的「2019 年營運中」只根據開發商網站。'
        '改為施工前、年份不詳（確認從未興建後再刪除）',
        'No evidence it operates: SATBA’s provincial data for late November 2025 give only 51.30 MW of wind in all of Razavi Khorasan (which includes the 28 MW Binalood farm), '
        'leaving no room for a 100 MW Tizbaad farm in Khaf County; national wind capacity was 302.82 MW in October 2020; in June 2024 the 50 MW Mil Nader farm was still called '
        'the largest wind farm in eastern Iran. GEM’s “operating since 2019” rests only on the developer’s website. Set to pre-construction with the year unknown '
        '(to be removed once it is confirmed never to have been built)',
        'https://www.ice.it/it/news/notizie-dal-mondo/297574', st=2, year=0, note=True),
    # ------------------------------------------------ Morocco（2026-10-06：逐場加總為國家統計的 120%，三筆 GEM 紀錄與精選重複；出處原文以 check_quotes 核對）
    dup('MAR', 'Tarfaya wind farm', G, ('Tarfaya', C),
        '同一座塔爾法亞風場（300／301 MW、2014 年）：GEM 把它放在北部的得土安省，但這座風場在南部、距塔爾法亞 20 km，131 部 2.3 MW、共 301 MW（英文維基）',
        'The same Tarfaya wind farm (300/301 MW, 2014): GEM places it in Tetouan Province in the north, but the farm lies 20 km from Tarfaya in the south, '
        'with 131 × 2.3 MW and 301 MW (English Wikipedia)',
        'https://en.wikipedia.org/wiki/Tarfaya_Wind_Farm'),
    fix('MAR', 'Tarfaya', C, '業主是 ENGIE 與 Nareva 各半的合資公司（Tarec）；併入的 GEM 紀錄寫 ONEE，屬於它誤放在得土安的資料',
        'Owned and operated by a 50:50 joint venture of ENGIE and Nareva Holding (Tarec); the merged GEM record’s owner, ONEE, came with its misplaced Tetouan entry',
        'https://en.wikipedia.org/wiki/Tarfaya_Wind_Farm', owner='Tarfaya Energy Company (Tarec): ENGIE [50%]; Nareva Holding [50%]'),
    dup('MAR', 'Tangier wind farm', G, ('Tanger I (Dhar Saadane / Beni Mejmel)', C),
        '同一座丹吉爾一號風場（140 MW）：GEM 的別名就是 Parc Eolien De Tanger I，分期為 Dhar Saadane 與 Bni Majmel',
        'The same Tangier I farm (140 MW): GEM’s alternative name is Parc Eolien De Tanger I, with the Dhar Saadane and Bni Majmel phases',
        'https://www.gem.wiki/Tangier_wind_farm'),
    dup('MAR', 'Akhfenir wind farm', G, ('Akhfennir I-II', C),
        '同一座阿赫費尼爾風場（Akhfennir I、II，約 200 MW，在塔爾法亞省）',
        'The same Akhfenir farm (Akhfennir I and II, about 200 MW, in Tarfaya Province)',
        'https://www.gem.wiki/Akhfenir_wind_farm'),
    fix('MAR', 'Akhfennir I-II', C,
        '座標改到 GEM 的精確位置（塔爾法亞省阿赫費尼爾）；原座標偏西北約 17 km，近景對不到 OpenStreetMap 標出的風機',
        'Point moved to GEM’s exact location (Akhfenir, Tarfaya Province); the old one was about 17 km to the north-west, so the close-up could not pick up the turbines mapped in OpenStreetMap',
        'https://www.gem.wiki/Akhfenir_wind_farm', lat=27.954, lon=-11.998),
    # ------------------------------------------------ Vietnam
    dup('VNM', 'Tân Phú Đông 2 nearshore wind power plant', G, ('Tan Phu Dong 2 (Tien Giang, GEC)', C), '同一座風場', 'Same farm', MOIT),
    dup('VNM', 'Thuận Bắc Trungnam wind farm', G, ('Trung Nam Ninh Thuận', C), '同一座風場（Trung Nam，151.95 MW）；分期移到精選紀錄',
        'Same farm (Trung Nam, 151.95 MW); its phases move to the curated record', MOIT),
    drop('VNM', 'Chu Se wind farm', G, '查無此風場：唯一出處是沒有內容的 thewindpower 條目，也不在工貿部的商轉名單',
         'No such farm: its only source is an empty thewindpower.net stub, and it is not on MOIT’s list of commissioned farms',
         'https://www.gem.wiki/Chu_Se_wind_farm'),
    drop('VNM', 'Chu Pu wind farm', G, '無法證實：只有沒有出處的 thewindpower 條目，不在工貿部的商轉名單',
         'Unverified: only an unsourced thewindpower.net stub, and not on MOIT’s list of commissioned farms', 'https://www.gem.wiki/Chu_Pu_wind_farm'),
    fix('VNM', 'Cư An wind farm', G, '應為 Cửu An 風場（嘉萊省安溪，46.2 MW，2021 年商轉）；200 MW 只見於沒有出處的條目',
        'This is Cửu An (An Khê, Gia Lai; 46.2 MW, commissioned 2021); the 200 MW figure came from an unsourced stub',
        'https://sdic.vn/nha-may-dien-gio-cuu-an-462mw/', rename='Cửu An wind farm', mw=46.2, year=2021),
    fix('VNM', 'BPP Vĩnh Châu wind farm', G, '2021 年動工，商轉日一再延後（預計 2025 年），尚未見商轉公告',
        'Construction began in 2021; commercial operation kept slipping (expected 2025) and has not been announced',
        'https://www.banpu.com/news/whyvietnam/', st=1, year=2025),
    dup('VNM', 'Dong Hai 1 Phase 2 (Bac Lieu, Bac Phuong)', C, ('Dong Hai 1 Offshore wind farm', G),
        '薄遼的東海1號（兩期各 50 MW）就是 GEM 這筆', 'Đông Hải 1 in Bạc Liêu (two 50 MW phases) is this GEM record', MOIT),
    fix('VNM', 'Dong Hai 1 Phase 1 (Tra Vinh, Trungnam)', C, '茶榮的東海1號是獨立的風場，不是薄遼東海1號的一期',
        'The Trà Vinh Đông Hải 1 is a separate farm, not a phase of the Bạc Liêu one', MOIT,
        rename='Dong Hai 1 – Tra Vinh (Trungnam)', zhname='東海1號（茶榮）'),
    dup('VNM', 'Binh Dai 1 Phase 1 (TTC/Gulf, Ben Tre)', C, ('Bến Tre 10 Bình Đại 1 Offshore wind farm', G),
        '平大1號的一部分；GEM 這筆含全部三期（128 MW）', 'Part of Bình Đại 1; the GEM record covers all three phases (128 MW)',
        'https://www.ptsc.com.vn/en-US/news/ptsc-news-1/operating-news/pps-provides-services-at-binh-dai-wind-power-plant-ben-tre'),
    dup('VNM', 'Binh Dai 1 Phase 2', C, ('Bến Tre 10 Bình Đại 1 Offshore wind farm', G),
        '平大1號的一部分；GEM 這筆含全部三期（128 MW）', 'Part of Bình Đại 1; the GEM record covers all three phases (128 MW)',
        'https://www.ptsc.com.vn/en-US/news/ptsc-news-1/operating-news/pps-provides-services-at-binh-dai-wind-power-plant-ben-tre'),
    dup('VNM', 'Tan An 1 Phase 1 (Ca Mau)', C, ('Tân An 1 offshore wind farm', G), '同一座風場', 'Same farm', MOIT),
    fix('VNM', 'Tân An 1 offshore wind farm', G, '只有第一期 25 MW 商轉（2021）；後續各期到 2024 年仍未併網',
        'Only phase 1 (25 MW, 2021) is in operation; the later phases were still not grid-connected in 2024',
        'https://thanhnien.vn/ca-mau-kiem-tra-phat-hien-thieu-sot-o-2-nha-may-dien-gio-18524042817170935.htm', mw=25, ph=0),
    dup('VNM', 'Hiệp Thành wind farm', G, ('Hiep Thanh (Tra Vinh)', C), '同一座風場（茶榮省沿海的 Hiệp Thạnh；GEM 列為陸域）',
        'Same farm (Hiệp Thạnh on the Trà Vinh coast; GEM lists it as onshore)'),
    # ------------------------------------------------ China
    drop('CHN', 'Guangdong Yangjiang Shaba (Three Gorges) Offshore wind farm', G,
         'GEM 把三峽陽江沙扒一至五期合成一筆（1,706 MW）；精選資料已逐期列出', 'GEM lumps phases 1–5 of CTG’s Yangjiang Shapa into one record (1,706 MW); the curated data lists each phase'),
    cn_agg('Dabancheng', '標為 2,500 MW、1989 年；GEM 在 80 km 內已逐場列出同地名的 28 座（3,661 MW）',
           'marked 2,500 MW in 1989; GEM lists 28 farms of the same name within 80 km (3,661 MW)'),
    cn_agg('Yumen Changma', 'GEM 在 80 km 內已逐場列出同地名的 23 座（2,679 MW）', 'GEM lists 23 farms of the same name within 80 km (2,679 MW)'),
    cn_agg('Minqin Hongshagang', 'GEM 在 80 km 內已逐場列出同地名的 9 座（1,200 MW）', 'GEM lists 9 farms of the same name within 80 km (1,200 MW)'),
    cn_agg('Mori wind complex', 'GEM 在 80 km 內已逐場列出同地名的 8 座（2,150 MW）', 'GEM lists 8 farms of the same name within 80 km (2,150 MW)'),
    cn_agg('Togtoh', 'GEM 已逐場列出這個送出基地的 3 座（1,750 MW，2024）', 'GEM lists the 3 farms of this export base (1,750 MW, 2024)'),
    fix('CHN', 'Zhejiang Energy Taizhou Yuhuan 1', C,
        '玉環披山島西北的離岸風場是華電玉環1號：北區 154 MW（2021 年 12 月）、南區 75 MW（2024 年 6 月）；浙能台州1號（300 MW，臨海外海）是另一座，GEM 已列出',
        'The offshore farm north-west of Pishan Island off Yuhuan is Huadian Yuhuan 1: north zone 154 MW (December 2021), south zone 75 MW '
        '(June 2024); Zhejiang Energy’s Taizhou 1 (300 MW, off Linhai) is a different farm that GEM already lists',
        'https://www.cpnn.com.cn/news/xny/202406/t20240604_1706589.html',
        rename='Huadian Yuhuan 1', zhname='華電玉環1號', mw=229, year=2021, ph=[[2021, 154], [2024, 75]], owner='China Huadian'),
    fix('CHN', 'Huadian Yuhuan 2', C, '開發商是華能（與晶科合作），不是華電；504 MW', 'Developed by Huaneng (with Jinko), not Huadian; 504 MW',
        'https://m.bjx.com.cn/mnews/20240129/1358593.shtml', rename='Huaneng Yuhuan 2', zhname='華能玉環2號', mw=504,
        owner='Huaneng (Zhejiang) Energy Development; JinkoSolar'),
    dup('CHN', 'Jiangsu Sheyang South H1 (Longyuan)', C, ('Jiangsu Sheyang Southern Area H5 Offshore wind farm', G),
        '射陽南區 H1 屬華能（另有紀錄）；龍源的 400 MW 場址是 H5，即 GEM 這筆',
        'Sheyang South H1 belongs to Huaneng (listed separately); Longyuan’s 400 MW site is H5, which is this GEM record',
        'https://www.gem.wiki/Jiangsu_Sheyang_Southern_Area_H1_Offshore_wind_farm'),
    # ------------------------------------------------ Romania
    ro_gone('Adamdel wind farm'), ro_gone('Banca wind farm'), ro_gone('Cwp Independenta I Wind Farm wind farm'),
    ro_gone('Falciu wind farm'), ro_gone('Auseu-Borod wind farm'), ro_gone('Monsson Orsova wind farm'),
    ro_gone('Monsson Serbotesti wind farm', '（Monsson 唯一的 150 MW 級案場是 Pantelimon）', ' (Monsson’s only project of that size is Pantelimon)'),
    ro_gone('Windkraft Sfanta Elena wind farm', '；唯一的 Sfânta Elena 風場是 48.3 MW 那座，已列為 Moldova Noua',
            '; the only Sfânta Elena plant is the 48.3 MW one, already listed as Moldova Noua'),
    ro_gone('Pestera Sorgenia wind farm', '；Verbund 的風場不含它合計已達 226 MW', '; Verbund’s farms add up to 226 MW without it'),
    ro_gone('Gebelesis Enel wind farm', '；PPC（原 Enel）的 8 座不含它合計 498.7 MW', '; PPC’s (formerly Enel’s) 8 plants add up to 498.7 MW without it'),
    ro_iberdrola('Iberdrola Cogealac wind farm'), ro_iberdrola('Iberdrola Sacele wind farm'), ro_iberdrola('Iberdrola Piatra wind farms'),
    ro_iberdrola('Beidaud wind farm'), ro_iberdrola('Istria wind farm'),
    dup('ROU', 'Valea Nucarilor wind farm', G, ('Salbatica wind farm · 2', G),
        '與 Salbatica 二期是同一筆 70 MW；Transelectrica 的 Valea Nucarilor 是 34 MW（即 Agighiol 那筆）',
        'The same 70 MW as Salbatica 2; Transelectrica’s Valea Nucarilor is 34 MW (the Agighiol record)', TRANSELECTRICA),
    fix('ROU', 'Casimcea Verbund wind farm', G,
        'Verbund 在 Casimcea 的三座是 Alpha Wind Nord 81.3、Ventus Nord 2 69 與 Cas Sud 2 75.9 MW；這筆 200 MW 是重複的彙總，改為 Cas Sud 2',
        'Verbund’s three Casimcea farms are Alpha Wind Nord 81.3, Ventus Nord 2 69 and Cas Sud 2 75.9 MW; this 200 MW lump '
        'duplicated them, so it becomes Cas Sud 2', TRANSELECTRICA, rename='Cas Sud 2 (Verbund) wind farm', mw=75.9, lat=44.72, lon=28.38, approx=True),
    ro_casimcea('Alpha Wind Nord wind farm'), ro_casimcea('Ventus Nord-2 wind farm'), ro_casimcea('Casimcea wind farm · 1'),
    ro_casimcea('Corugea wind farm'),
    fix('ROU', 'Salbatica wind farm · 2', G, '與一期同在圖爾恰縣 Sălbatica（原座標是羅馬尼亞國土中心的代用點）',
        'At Sălbatica, Tulcea County, next to phase 1 (the old point was a placeholder at the centre of Romania)', TRANSELECTRICA,
        lat=45.02, lon=28.86, approx=True),
    fix('ROU', 'Casimcea wind farm · 2', G, '容量 5.8 MW（業主 Renovatio Trading）', 'Capacity 5.8 MW (owner Renovatio Trading)', TRANSELECTRICA, mw=5.8),
    fix('ROU', 'Babadag wind farm', G, 'Transelectrica 清單只有 Babadag 3（30 MW）', 'Transelectrica lists only Babadag 3 (30 MW)', TRANSELECTRICA, mw=30),
    fix('ROU', 'Baia Holrom wind farm', G, 'Transelectrica 清單的 Baia 4（Holrom）是 10 MW', 'Transelectrica lists Baia 4 (Holrom) at 10 MW', TRANSELECTRICA, mw=10),
    fix('ROU', 'Ruginoasa wind farm', G, '2023 年 11 月完工', 'Completed November 2023',
        'https://balkangreenenergynews.com/ukrainian-billionaire-akhmetov-completes-60-mw-ruginoasa-wind-farm-in-romania/', year=2023),
    # ------------------------------------------------ 台灣、日本、韓國、美國的離岸風場（2026-09 查水下基礎第 4 步時發現）
    fix('TWN', 'Zhong Neng', C,
        '31 部風機 2024 年 8 月全數安裝併網，2025 年 4 月取得電業執照正式商轉；獲配容量 300 MW，實際裝置 31 部 × 9.5 MW＝294.5 MW',
        'All 31 turbines were installed and grid-connected by August 2024, and commercial operation began with the electricity licence in '
        'April 2025; the allocated capacity is 300 MW, while the installed capacity is 31 × 9.5 MW = 294.5 MW',
        'https://www.csc.com.tw/csc/esg/env/env2_1.html', year=2025, mw=294.5, note=True),
    fix('TWN', 'Taipower Offshore Phase 1 (Changhua)', C, '機組是日立 HTW5.2-127（葉片 127 m），不是 HTW5.2-136。位置：台電只寫「芳苑外海 7.2–8.7 km」，'
        '改用 OpenStreetMap 標出的 21 部風機的中心（23.986 N、120.242 E，© OpenStreetMap 貢獻者）；原座標 24.05 N、120.35 E 在海岸邊，與官方的離岸距離不符',
        'The turbines are Hitachi HTW5.2-127 (127 m blades), not HTW5.2-136. Position: Taipower only says “7.2–8.7 km off Fangyuan”, so the centre of the 21 turbines '
        'mapped in OpenStreetMap is used (23.986 N, 120.242 E, © OpenStreetMap contributors); the old point, 24.05 N 120.35 E, was at the coast and did not fit the official distance',
        'https://www.openstreetmap.org/relation/15992407', turbine='21 x Hitachi HTW5.2-127', lat=23.986, lon=120.242, note=True),
    drop('JPN', 'Kamis Offshore wind farm', G, 'GEM 把神栖一期（2010 年 14 MW）與二期（2013 年 16 MW）合成一筆，本站兩期各有紀錄',
         'GEM bundles Kamisu Phase 1 (14 MW, 2010) and Phase 2 (16 MW, 2013) into one record; both phases are listed separately here',
         'https://www.gem.wiki/Kamis_Offshore_wind_farm'),
    fix('JPN', 'Kamisu Phase 1 (Wind Power Ibaraki)', C,
        '一期在南濱外海（神栖市資料）；原座標在內陸約 1.5–2 km，改用 OpenStreetMap 的風機位置（概略位置）',
        'Phase 1 stands off Minamihama (city of Kamisu); the old point was about 1.5–2 km inland, so it is moved to the turbine positions '
        'in OpenStreetMap (approximate)',
        'https://www.city.kamisu.ibaraki.jp/shisei/machi/1007515/1002412.html', lat=35.884, lon=140.735, approx=True),
    fix('JPN', 'Kamisu Phase 2', C,
        '二期在北濱外海、位於一期北邊（原座標在一期南邊的內陸，南北顛倒）；改用 OpenStreetMap 的風機位置（概略位置）',
        'Phase 2 stands off Kitahama, north of Phase 1 (the old point was inland and south of Phase 1, the wrong way round); it is moved '
        'to the turbine positions in OpenStreetMap (approximate)',
        'https://www.city.kamisu.ibaraki.jp/shisei/machi/1007515/1002412.html', lat=35.91, lon=140.716, approx=True),
    fix('JPN', 'Setana semi-offshore', C,
        '因故障與老化停機（確切停機時間待查證，2025 年 7 月已報導決定撤除）；瀨棚町 2026 年 4 月決定 2027 年度撤除',
        'Out of service after breakdowns and ageing (the exact date it stopped is not verified; the decision to remove it was already '
        'reported in July 2025); in April 2026 the town of Setana decided to remove it in the 2027 financial year',
        'https://www.hokkaido-np.co.jp/article/1305209/', end=2025, note=True),
    fix('JPN', 'Setana semi-offshore', C, '座標改到瀨棚港東外防波堤內側的風機位置（OpenStreetMap，概略位置；原座標偏東北約 1 km）',
        'Point moved to the turbines inside Setana port, behind the east outer breakwater (OpenStreetMap, approximate; the old one was '
        'about 1 km to the north-east)',
        'https://www.khi.co.jp/pressrelease/detail/c3040209-1.html', lat=42.4435, lon=139.839, approx=True),
    fix('JPN', 'Kitakyushu Offshore Demonstration (NEDO/J-Power)', C,
        '2019 年 9 月撤除風機與上部結構（10 月起以 SEP 船施工），不是 2023 年；重力式底版留作 J-POWER 的研究設施',
        'The turbine and substructure were removed in September 2019 (work from a jack-up vessel began that October), not in 2023; the '
        'gravity base was kept as a J-Power research facility',
        'https://www.jpower.co.jp/oshirase/2019/10/oshirase191001.html', end=2019, note=True),
    fix('JPN', 'Kitakyushu Hibikinada', C,
        '2026 年 3 月 2 日開始商業運轉（25 部 9.6 MW，併網上限 220 MW）；時間軸「2026（最新可得）」起列為營運中',
        'Commercial operation began on 2 March 2026 (25 × 9.6 MW turbines, output capped at 220 MW); operating from the timeline\'s '
        '"2026 (latest available)" point',
        'https://www.jpower.co.jp/english/news_release/pdf/news260302e.pdf', turbine='25 x Vestas V174-9.6 MW', st=0, year=2026, note=True),
    fix('JPN', 'Eurus Akita Port semi-offshore', C,
        '這 1 部屬ユーラス秋田港ウインドファーム，在秋田市向濱；原座標落在秋田港洋上風場上，改為向濱的概略位置',
        'This single turbine belongs to Eurus Akita Port Wind Farm on the Mukaihama shore of Akita City; the old point fell on the Akita '
        'Port offshore wind farm, so it is moved to an approximate point at Mukaihama',
        'https://www.fuji-gab-mesh.co.jp/zisseki/zissekidetail/tikutei24.html', lat=39.734, lon=140.063, approx=True),
    fix('JPN', 'Hokkaido Ishikari Bay Offshore wind farm', G,
        '不是興建中：丸紅的石狩灣專案只有 2021 年 2 月的計畫階段環境配慮書，海域尚未指定為促進區域',
        'Not under construction: Marubeni’s Ishikari Bay project has only filed a planning-stage environmental consideration document '
        '(February 2021), and the sea area has not yet been designated a promotion zone',
        'https://www.meti.go.jp/policy/safety_security/industrial_safety/sangyo/electric/detail/furyoku_hokkaidoishikariwan.html', st=3),
    dup('KOR', 'Jeonnam (SK E&C) wind farm', G, ('Jeonnam Shinan 1 / others', C),
        '同一座風場：全南海上風電 1 號（96 MW，SK Innovation E&S 與 CIP），在新安郡自恩島西北約 9 km',
        'Same farm: Jeonnam Offshore Wind 1 (96 MW, SK Innovation E&S and CIP), about 9 km north-west of Jaeun-do in Sinan County',
        'https://cop.dk/jeonnam-1-offshore-wind-project-begins-commercial-operations/'),
    fix('KOR', 'Jeonnam Shinan 1 / others', C,
        '正式名稱為全南海上風電 1 號；機組是 10 部西門子歌美颯 SG 10.0-193 DD（降額為 9.6 MW），2025 年 5 月 16 日起全面運轉',
        'Its name is Jeonnam Offshore Wind 1; the turbines are 10 Siemens Gamesa SG 10.0-193 DD derated to 9.6 MW, in full operation '
        'since 16 May 2025',
        'https://www.offshorewind.biz/2025/05/21/largest-privately-led-offshore-wind-farm-in-south-korea-enters-commercial-operation/',
        rename='Jeonnam Offshore Wind 1', zhname='全南海上風電 1 號', turbine='10 x Siemens Gamesa SG 10.0-193 DD (9.6 MW)'),
    fix('KOR', 'Jeonnam Shinan 1 / others', C, '座標改到自恩島西北約 9 km 的海域（概略位置；原座標偏東南約 19 km）',
        'Point moved to the water about 9 km north-west of Jaeun-do (approximate; the old one was about 19 km to the south-east)',
        'https://cop.dk/jeonnam-1-offshore-wind-project-begins-commercial-operations/', lat=34.97, lon=125.95, approx=True),
    fix('KOR', 'Yeonggwang Nakwol', C,
        '2025 年 12 月起部分商轉（年底只裝好 7 部風機）；2026 年 8 月 64 座單樁完成、47 部豎立、33 部商轉，預定 2026 年 12 月全面商轉。機組是 Vensys 5.7 MW（原本寫斗山）',
        'Partial commercial operation began in December 2025 (only 7 turbines were up at the end of the year); by August 2026 all 64 '
        'monopiles were in, 47 turbines stood and 33 were in commercial operation, with full operation planned for December 2026. The '
        'turbines are Vensys 5.7 MW (they were listed as Doosan)',
        'https://www.mt.co.kr/industry/2026/08/24/2026082407272061046', st=1, year=2026, turbine='64 x Vensys 5.7 MW', note=True),
    fix('KOR', 'Jeju Woljeong test (Doosan)', C,
        '第二部是 STX 重工 2 MW（能源技術研究院，2011–12 年），不是 2015 年的曉星；該部 2016 年 6 月起停機，荷蘭 RVO 2021 年說試驗場沒有運轉（現況待查證）',
        'The second unit is an STX Heavy Industries 2 MW turbine (KIER, 2011–12), not a 2015 Hyosung; it has been idle since June 2016, '
        'and the Netherlands Enterprise Agency wrote in 2021 that the test site was not operational (its present state is unverified)',
        'https://www.epj.co.kr/news/articleView.html?idxno=37661',
        turbine='1 x Doosan WinDS3000/91 3 MW (2012) + 1 x STX 2 MW (2011–12)', note=True),
    fix('KOR', 'Tamra (Jeju Hallim/Hangyeong)', C, '耽羅海上風電在濟州翰京面（Hangyeong-myeon）海域，不在翰林（翰林另有一座風場）',
        'Tamra stands off Hangyeong-myeon on Jeju (the waters between Dumo-ri and Geumdeung-ri), not off Hallim, where a separate farm lies',
        'http://tamra-owp.co.kr/2019/sub0201.php', rename='Tamra (Jeju Hangyeong)'),
    fix('KOR', 'Jwasari Offshore wind farm', G, '還在環評階段（2025 年 3 月舉行環評初稿公聽會），規劃已改為 360 MW（24 部 15 MW）；'
        '2026 年 9 月查證時仍無開工或競標得標紀錄（環評初稿的工期是 2028 年 3 月至 2031 年 9 月），不採 GEM 的「興建中」。'
        '場址在慶尚南道統營市欲知面左沙里島一帶海域，不在全羅南道麗水外海：座標改為左沙里島（概略位置）',
        'Still at the environmental-impact-assessment stage (a public hearing on the draft was held in March 2025); the plan is now '
        '360 MW (24 × 15 MW). As of September 2026 there is no construction start or auction award (the draft EIA plans construction '
        'from March 2028 to September 2031), so GEM’s “under construction” is not used. The site is in the waters around Jwasari-do, '
        'Yokji-myeon, Tongyeong (South Gyeongsang), not off Yeosu in South Jeolla: the point moves to Jwasari-do (approximate)',
        'https://www.hansannews.com/news/articleView.html?idxno=95554', st=2, year=0, mw=360, lat=34.561, lon=128.346, approx=True),
    fix('KOR', 'Yeonggwang Wind offshore wind farm', G,
        '靈光風電（35 部、79.6 MW）中立在潮間帶的 15 部 2.3 MW＝34.5 MW；GEM 的座標是公司登記地址，位置只能當概略值',
        'The 15 × 2.3 MW turbines (34.5 MW) that stand in the intertidal zone of the Yeonggwang Wind complex (35 turbines, 79.6 MW); '
        'GEM’s point is the company’s registered address, so the location can only be treated as approximate',
        'https://m.etnews.com/20200221000242', mw=34.5, turbine='15 x Unison U113 2.3 MW', lat=35.279, lon=126.336, approx=True, note=True),
    fix('USA', 'Sunrise wind farm (United States)', G,
        '與 2026 整理清單的「Sunrise Wind」是同一座（Ørsted，924 MW，BOEM 租約 OCS-A 0487）：GEM 的座標其實落在 Revolution Wind 的租約區內，'
        '改到 OCS-A 0487 的中心（概略位置）並改用專案名稱，清單那筆就會併進來、不再重複',
        'The same farm as “Sunrise Wind” in the 2026 compilation (Ørsted, 924 MW, BOEM lease OCS-A 0487): the GEM point actually falls '
        'inside Revolution Wind’s lease area, so it is moved to the centre of OCS-A 0487 (approximate) and takes the project’s name, '
        'which merges the compilation record into it instead of leaving two',
        'https://www.boem.gov/renewable-energy/state-activities/sunrise-wind', rename='Sunrise Wind', lat=40.99, lon=-71.06, approx=True),
    fix('USA', 'Vineyard Wind 1', C,
        '最後一部風機 2026 年 3 月 13 日才裝好（開發商 2026 年 1 月的訴狀說 2025 年底 62 部中只有 44 部運轉、約 572 MW）；'
        '依本站慣例改列興建中、年份 2026',
        'The last turbine was only installed on 13 March 2026 (the developer’s January 2026 court filing says 44 of the 62 turbines were '
        'operating at the end of 2025, about 572 MW), so it is listed as under construction with 2026 as its year',
        'https://www.wbur.org/news/2026/03/14/vineyard-wind-construction-complete-massachusetts-offshore-wind', st=1, year=2026, note=True),
    fix('USA', 'Coastal Virginia Offshore Wind (CVOW) Commercial Project', G,
        '完工時間延到 2027 年底：2026 年 8 月時 176 部風機裝好 31 部，2026 年 3 月起首批運轉約 450 MW'
        '（清單的預計完工年也一併改為 2027，見 PIPE_FIX）',
        'Completion has moved to the end of 2027: 31 of the 176 turbines were installed by August 2026, and the first ones have been '
        'generating about 450 MW since March 2026 (the compilation’s expected year is corrected to 2027 as well, see PIPE_FIX)',
        'https://www.offshorewind.biz/2026/08/03/largest-us-offshore-wind-farm-81-pct-complete-final-turbine-expected-by-end-of-2027',
        turbine='176 x Siemens Gamesa SG 14-222 DD', note=True),
    fix('USA', 'Revolution Wind', G, '開發商的容量是 704 MW（羅德島 400 MW＋康乃狄克 304 MW）；65 部 × 11 MW 的銘牌合計為 715 MW',
        'The developers give 704 MW (400 MW for Rhode Island plus 304 MW for Connecticut); 65 × 11 MW of nameplate would be 715 MW',
        'https://www.offshorewind.biz/2026/09/18/us-gets-new-offshore-wind-farm-as-all-turbines-installed-at-704-mw-revolution-wind', mw=704),
    fix('USA', 'Empire wind farm', G, '開發商的容量是 810 MW（54 部 Vestas V236-15 MW）',
        'The developer gives 810 MW (54 Vestas V236-15 MW turbines)', 'https://www.empirewind.com/project/', mw=810),
    # ------------------------------------------------ 2026-09-27 依使用者整理的《全球離岸風場資料庫｜亞洲查核版 v2》逐案覆核
    # 2026-09-30 以 tools/check_quotes.py 核對：三峽集團網域在核對環境連不上，改用能核對的出處（上海市政府、中科院廣州能源所、新浪財經補貼公示、
    # 福建省工信廳、GEM wiki）；核不到的細節已從理由裡拿掉（見 TODO）
    dup('CHN', 'Shanghai Donghai Bridge Offshore wind farm · 1', G, ('Donghai Bridge', C),
        '同一座風場：GEM 的中文名就是「東海大橋海上風電項目一期 102.2MW」（34 部 3 MW，上海市政府：2010 年 6 月 8 日全部風機併網）；GEM 座標偏北約 110 km',
        'Same farm: GEM’s Chinese name is “Donghai Bridge offshore wind project phase 1, 102.2 MW” (34 × 3 MW; Shanghai government: all turbines connected on 8 June 2010); '
        'the GEM point is about 110 km too far north',
        'https://www.shanghai.gov.cn/nw5827/20200905/0001-5827_667816.html'),
    fix('CHN', 'CTG Yangjiang Qingzhou 6', C, '青洲六為 1,000 MW、74 部，2024 年 12 月 27 日全容量併網（補貼公示；原本寫 500 MW）；座標改用 GEM 的精確位置',
        'Qingzhou 6 is 1,000 MW with 74 turbines, fully connected on 27 December 2024 (subsidy notice; it was listed as 500 MW); the point is moved to GEM’s exact location',
        'https://finance.sina.com.cn/roll/2025-12-19/doc-inhcipui7654969.shtml', mw=1000, lat=20.991, lon=111.496),
    dup('CHN', 'Guangdong Yangjiang Qingzhou VI Offshore wind farm', G, ('CTG Yangjiang Qingzhou 6', C),
        '同一座風場（三峽陽江青洲六，1,000 MW）；GEM 2026-02 版仍列興建中，補貼公示寫 2024 年 12 月 27 日全容量併網',
        'Same farm (CTG Yangjiang Qingzhou 6, 1,000 MW); GEM’s February 2026 release still lists it as under construction, while the subsidy '
        'notice gives full grid connection on 27 December 2024',
        'https://finance.sina.com.cn/roll/2025-12-19/doc-inhcipui7654969.shtml'),
    fix('CHN', 'Longyuan Jiangsu Xiangshui', C, '響水近海風電（202 MW，2016 年 10 月 17 日全數併網）是三峽集團的第一座離岸風場，不是龍源',
        'The Xiangshui nearshore farm (202 MW, all turbines connected on 17 October 2016) is China Three Gorges’ first offshore wind farm, not Longyuan’s',
        'http://newenergy.giec.cas.cn/fn/cydt/201804/t20180426_736984.html',
        rename='CTG Jiangsu Xiangshui', zhname='三峽江蘇響水近海風電', owner='China Three Gorges Renewables (Group) Co Ltd'),
    fix('CHN', 'Fuqing Xinghua Bay Phase 2', C, '二期為 280 MW、45 部（2021 年安裝，全為國產機組，含國內首部 10 MW 示範機），2021 年全容量併網（原本寫 300 MW、2020 年）',
        'Phase 2 is 280 MW with 45 turbines (installed in 2021, all Chinese-built, including China’s first 10 MW demonstration unit), fully connected in 2021 (it was listed as 300 MW in 2020)',
        'https://gxt.fujian.gov.cn/zwgk/xw/jxyw/202412/t20241211_6590606.htm', mw=280, year=2021),
    # ------------------------------------------------ 2026-09-30 升級 GEM 2026-02 時發現的重複（GEM 新收錄、座標與精選紀錄相距太遠而沒有自動合併；出處為 GEM 專案頁的別名與規格）
    dup('AUS', 'MacIntyre', C, ('MacIntyre precinct wind farm', G),
        '同一座風場（923 MW，2024 年）；GEM 的座標在 Karara 附近的實際場址，精選紀錄的座標偏東約 40 km，改留 GEM 這筆',
        'Same farm (923 MW, 2024); the GEM point is at the actual site near Karara, the curated point about 40 km east, so the GEM record is kept',
        'https://www.gem.wiki/MacIntyre_precinct_wind_farm'),
    dup('AUS', 'Studland Bay wind farm', G, ('Woolnorth (Bluff Point / Studland Bay)', C),
        'GEM 專案頁的別名就是 Woolnorth：75 MW（2007 年）已含在精選的 Woolnorth 紀錄的分期裡',
        'GEM’s project page lists Woolnorth as its other name: the 75 MW (2007) is already a phase of the curated Woolnorth record',
        'https://www.gem.wiki/Studland_Bay_wind_farm'),
    dup('USA', 'Kingman Wind', P, ('Kingman Wind Energy Center', G),
        'WRI GPPD 舊資料；GEM 專案頁的別名就是 Kingman Wind（214.8 MW，2016 年）', 'Old WRI GPPD record; GEM’s page lists Kingman Wind as its other name (214.8 MW, 2016)',
        'https://www.gem.wiki/Kingman_Wind_Energy_Center'),
    dup('GBR', 'Triton Knoll (Innogy) wind farm', G, ('Triton Knoll', C),
        '同一座風場（857 MW）；GEM 寫 2022 年，本站依全數風機 2021 年發電列 2021 年', 'Same farm (857 MW); GEM gives 2022, this site keeps 2021 when all turbines were generating',
        'https://www.gem.wiki/Triton_Knoll_(Innogy)_wind_farm'),
    dup('TUR', 'Gökçedağ wind farm', G, ('Gökçedağ (Osmaniye)', C),
        '同一座風場（奧斯曼尼耶，135 MW，Zorlu 集團的 Rotor Elektrik）；GEM 沒有商轉年', 'Same farm (Osmaniye, 135 MW, Zorlu’s Rotor Elektrik); GEM gives no commissioning year',
        'https://www.gem.wiki/G%C3%B6k%C3%A7eda%C4%9F_wind_farm'),
    dup('KEN', 'Kajiado wind farm', G, ('Kipeto', C),
        'GEM 專案頁的別名就是 Kipeto Project（100 MW，2021 年）', 'GEM’s project page lists Kipeto Project as its other name (100 MW, 2021)',
        'https://www.gem.wiki/Kajiado_wind_farm'),
    dup('EGY', 'Amunet wind farm', G, ('Amunet (AMEA Power) Red Sea', C),
        '同一座風場（AMEA Power，紅海 Ras Ghareb）；GEM 寫 502 MW、2025 年全數商轉，本站依首批併網列 2024 年',
        'Same farm (AMEA Power, Ras Ghareb on the Red Sea); GEM gives 502 MW and 2025 for full operation, this site keeps 2024 for first power',
        'https://www.gem.wiki/Amunet_wind_farm'),
    dup('EGY', 'Gulf Of Ziet Wind Complex', G, ('Gabal El Zeit (I-III)', C),
        'GEM 專案頁的別名就是 Gabal El-Zayt（NREA 三期共 580 MW）；GEM 的座標落在庫塞爾附近，偏南約 250 km',
        'GEM’s page lists Gabal El-Zayt as its other name (the three NREA phases, 580 MW in all); the GEM point near Al Qusair is about 250 km too far south',
        'https://www.gem.wiki/Gulf_Of_Ziet_Wind_Complex'),
    # ------------------------------------------------ 2026-09-30 查中國水下基礎第二批時發現（出處原文已以 check_quotes 核對）
    fix('CHN', 'CGN Yangjiang Qingzhou 1&2', C,
        '青洲一、二是廣東能源集團（粵電）的風場，不是中廣核：青洲一 400 MW（37 部）＋青洲二 600 MW（55 部）共 92 部 11 MW，2023 年 12 月 12 日全容量併網',
        'Qingzhou 1 & 2 belong to Guangdong Energy Group (Yudean), not CGN: Qingzhou 1 (400 MW, 37 turbines) plus Qingzhou 2 (600 MW, 55 turbines), 92 × 11 MW in all, fully connected on 12 December 2023',
        'https://cpnn.com.cn/news/hy/202312/t20231212_1659356.html', rename='Guangdong Energy Yangjiang Qingzhou 1&2', zhname='粵電陽江青洲一、二',
        owner='Guangdong Energy Group (Yudean)'),
    dup('CHN', 'Hainan CZ2 Demonstration Offshore wind farm', G, ('Shenergy Hainan CZ2 (Dongfang)', C),
        '同一座風場（申能海南 CZ2 示範風場，67 部 9 MW）', 'Same farm (Shenergy’s Hainan CZ2 demonstration farm, 67 × 9 MW)',
        'https://finance.sina.com.cn/jjxw/2024-05-26/doc-inawpazx5145233.shtml'),
    dup('CHN', 'Hainan Danzhou CZ3 (Datang) Offshore wind farm', G, ('Datang Danzhou CZ3', C),
        'GEM 大唐儋州 120 萬瓩案的第 1 期（一場址 60 萬瓩，2025 年營運）；與精選紀錄（一場址）同一座。第 2 期（二場址）是另一筆「· 2」',
        'Phase 1 of GEM’s Datang Danzhou 1,200 MW project (site 1, 600 MW, operating 2025); same farm as the curated site-1 record. Phase 2 (site 2) is the separate “· 2” record',
        'https://www.gem.wiki/Hainan_Danzhou_CZ3_(Datang)_Offshore_wind_farm'),
    dup('CHN', 'Hainan CZ3 Demonstration Offshore wind farm', G, ('Datang Danzhou CZ3', C),
        'GEM 把同一案又收了一次（大唐 CZ3 海上風場示範項目）；這筆是它的第 1 期，即一場址 60 萬瓩',
        'GEM carries the same project a second time (Datang CZ3 demonstration project); this is its phase 1, i.e. site 1 (600 MW)',
        'https://www.gem.wiki/Hainan_CZ3_Demonstration_Offshore_wind_farm'),
    # ------------------------------------------------ 2026-09-30 查中國水下基礎第三批時發現（出處原文已以 check_quotes 核對）
    fix('CHN', 'Huarun Cangnan 1 / CR Power', C,
        '2022 年 12 月 28 日全容量併網（原寫 2023）；49 部 6.25／10 MW 機組',
        'Fully connected on 28 December 2022 (was 2023); 49 turbines of 6.25 / 10 MW',
        'https://www.cpem.org.cn/list68/64746.html', year=2022),
    dup('CHN', 'Zhejiang Energy Cangnan 1', C, ('Huarun Cangnan 1 / CR Power', C),
        '蒼南 1 號是華潤電力的風場（浙能沒有蒼南 1 號），與「華潤電力蒼南1號」重複',
        'Cangnan 1 is CR Power’s farm (Zhejiang Energy has no Cangnan 1) and duplicates “Huarun Cangnan 1 / CR Power”',
        'https://www.cpem.org.cn/list68/64746.html'),
    dup('CHN', 'Shandong Bozhong (Yankuang GroupOffshore) wind farm', G, ('Shandong Energy Bozhong A', C),
        '同一座風場（山東能源渤中 A 場址：501 MW、60 部 8.35 MW，2022 年）', 'Same farm (Shandong Energy’s Bozhong site A: 501 MW, 60 × 8.35 MW, 2022)',
        'https://sdb.nea.gov.cn/dtyw/hyxx/202309/t20230919_112577.html'),
    fix('CHN', 'Shandong Energy Bozhong G', C,
        '一期 400.4 MW（35 部 10 MW＋4 部 12.6 MW）2025 年 5 月 31 日全容量併網；原寫 850 MW、2024 年',
        'Phase 1 is 400.4 MW (35 × 10 MW plus 4 × 12.6 MW), fully connected on 31 May 2025; was 850 MW and 2024',
        'https://news.iqilu.com/shandong/yuanchuang/2025/0531/5817656.shtml', mw=400.4, year=2025, zhname='山東能源渤中G（一期）'),
    dup('CHN', 'Shandong Bozhong G Offshore wind farm', G, ('Shandong Energy Bozhong G', C),
        '同一案的一期（GEM 記為 400 MW、2025）', 'Phase 1 of the same project (GEM: 400 MW, 2025)',
        'https://news.iqilu.com/shandong/yuanchuang/2025/0531/5817656.shtml'),
    fix('CHN', 'CGN Huizhou Gangkou I', C,
        '港口風場分兩期共 100 萬瓩、104 部：一期 25 萬瓩 2021 年 12 月 28 日全容量併網，二期 75 萬瓩 2023 年 12 月 12 日投產（新華社）；原只寫 400 MW',
        'The Gangkou farm has two phases totalling 1,000 MW and 104 turbines: phase 1 (250 MW) fully connected on 28 December 2021, phase 2 (750 MW) commissioned on 12 December 2023 (Xinhua); was 400 MW',
        'http://www.news.cn/fortune/2023-12/13/c_1130023531.htm', rename='CGN Huizhou Gangkou I & II', zhname='中廣核惠州港口一、二', mw=1000, year=2021, ph=[[2021, 250], [2023, 750]]),
    # ------------------------------------------------ 2026-09-30 陽江深水場址時效核對（出處原文已以 check_quotes 核對）
    fix('CHN', 'CTG Yangjiang Qingzhou 5', C,
        '青洲五是 1,000 MW（原寫 500）、2021 年 11 月開工、預計 2026 年 12 月投產（陽江市 2025 年重點建設項目）；青洲五、七共 163 部、2,000 MW，'
        '2026 年 9 月 27 日才首批 5 部併網（陽江市政府），改為興建中',
        'Qingzhou 5 is 1,000 MW (was 500), started November 2021 and is due in December 2026 (Yangjiang’s 2025 key-project list); Qingzhou 5 and 7 '
        'together have 163 turbines and 2,000 MW and connected their first 5 turbines only on 27 September 2026 (Yangjiang city government), so it goes back to under construction',
        'https://www.yangjiang.gov.cn/yj/ywdt/bmzx/content/post_984170.html', mw=1000, st=1, year=2026),
    fix('CHN', 'CTG Yangjiang Qingzhou 7', C,
        '青洲七 1,000 MW，2021 年 11 月開工、預計 2026 年 12 月投產；與青洲五共 163 部，2026 年 9 月 27 日首批 5 部併網，改為興建中（原寫 2025 年營運）',
        'Qingzhou 7 (1,000 MW) started November 2021 and is due in December 2026; with Qingzhou 5 it has 163 turbines, the first 5 connected on 27 September 2026, '
        'so it goes back to under construction (was operating since 2025)',
        'https://www.yangjiang.gov.cn/yj/ywdt/bmzx/content/post_984170.html', st=1, year=2026),
    dup('CHN', 'Guangdong Yangjiang Qingzhou V Offshore wind farm', G, ('CTG Yangjiang Qingzhou 5', C),
        '同一座風場（三峽陽江青洲五，1,000 MW）', 'Same farm (CTG Yangjiang Qingzhou 5, 1,000 MW)', 'https://www.gdshe.org/article/24026.html'),
    dup('CHN', 'Guangdong Yangjiang Qingzhou VII Offshore wind farm', G, ('CTG Yangjiang Qingzhou 7', C),
        '同一座風場（三峽陽江青洲七，1,000 MW）', 'Same farm (CTG Yangjiang Qingzhou 7, 1,000 MW)', 'https://www.gdshe.org/article/24026.html'),
    fix('CHN', 'CGN Fanshi I', C,
        '中廣核帆石一、二共 200 萬瓩、131 部，2026 年 9 月 24 日全容量投運（中新網）；原寫 2025 年',
        'CGN’s Fanshi I and II (2,000 MW, 131 turbines) reached full capacity on 24 September 2026 (China News Service); was 2025',
        'https://www.chinanews.com.cn/cj/2026/09-24/10703009.shtml', year=2026),
    fix('CHN', 'Guangdong Energy Fanshi II / Yangjiang', C,
        '帆石二是中廣核的風場，不是粵電；建成 33 部 18 MW＋25 部 16.2 MW（國資委轉中國能建，2026-06；陽江市 2025 年重點項目清單寫的 63 部 16 MW 是早期規劃），'
        '與帆石一同於 2026 年 9 月 24 日全容量投運（原寫 2025 年）',
        'Fanshi II is CGN’s farm, not Guangdong Energy’s; as built it has 33 × 18 MW + 25 × 16.2 MW (SASAC citing CEEC, June 2026; the 63 × 16 MW on Yangjiang’s 2025 '
        'key-project list was the earlier plan), and it reached full capacity with Fanshi I on 24 September 2026 (was 2025)',
        'https://www.chinanews.com.cn/cj/2026/09-24/10703009.shtml', rename='CGN Fanshi II', zhname='中廣核陽江帆石二', owner='CGN New Energy', year=2026,
        turbine='33x 18 MW + 25x 16.2 MW'),
    # ------------------------------------------------ 2026-10-01 查中國水下基礎第四批時發現（出處原文已以 check_quotes 核對）
    fix('CHN', 'Shandong Huaneng Offshore L Area wind farm', G,
        '華能半島北 L 場址（504 MW、42 部 12 MW）2026 年 4 月 7 日全容量併網（國資委）；GEM 2026-02 版仍列興建中',
        'Huaneng’s Peninsula North site L (504 MW, 42 × 12 MW) was fully connected on 7 April 2026 (SASAC); GEM’s February 2026 release still lists it as under construction',
        'http://wap.sasac.gov.cn/n2588025/n2588124/c35402269/content.html', st=0, year=2026),
    drop('CHN', 'Shandong Energy Bohai / Peninsula North N2 / L', C,
        '三案合併的彙總：半島北 L（華能，504 MW，2026 年 4 月併網）與半島北 N2（上海電氣，900 MW，興建中）已各有 GEM 紀錄，山東能源渤海即渤中 G 一期（已有精選紀錄）',
        'An aggregate of three projects that now have records of their own: Peninsula North L (Huaneng, 504 MW, connected April 2026) and N2 (Shanghai Electric, 900 MW, under construction) from GEM, and Shandong Energy’s Bohai farm, which is Bozhong G phase 1 (curated)',
        'http://wap.sasac.gov.cn/n2588025/n2588124/c35402269/content.html'),
    fix('CHN', 'Huaneng Peninsula North BW', C, '華能半島北 BW 是 510 MW（60 部 8.5 MW；原寫 500）', 'Huaneng’s Peninsula North BW is 510 MW (60 × 8.5 MW; was 500)',
        'http://www.cpem.org.cn/list99/56313.html', mw=510),
    dup('CHN', 'Shandong Bandaobei BW Offshore wind farm', G, ('Huaneng Peninsula North BW', C),
        '同一座風場（華能山東半島北 BW，510 MW，2024 年）', 'Same farm (Huaneng Shandong Peninsula North BW, 510 MW, 2024)', 'http://www.cpem.org.cn/list99/56313.html'),
    dup('CHN', 'Guodian Xiangshan 1 Phase 2', C, ('Zhejiang Xiangshan 1 Offshore wind farm', G),
        '國電象山 1 號二期（504 MW、56 部 9 MW，2024 年 1 月主體完工）；GEM 的象山 1 號一筆已含一期 254 MW 與二期 504 MW 兩期',
        'Guodian Xiangshan 1 phase 2 (504 MW, 56 × 9 MW, main works finished January 2024); GEM’s Xiangshan 1 record already carries both phase 1 (254 MW) and phase 2 (504 MW)',
        'http://mm.chinapower.com.cn/flfd/hsfd/20240102/230553.html'),
    # ------------------------------------------------ 2026-10-01 全量查證水下基礎時發現（出處原文已以 check_quotes 核對）
    dup('CHN', 'CR Power Cangnan 2 / Wenzhou', C, ('Zhejiang Cangnan 2 Offshore wind farm', G),
        '蒼南 2 號是華能的風場（36 部 8.5 MW、300 MW），不是華潤；這筆 500 MW 是蒼南 2 號與「溫州洞頭」等合併的彙總，GEM 已有蒼南 2 號本身的紀錄',
        'Cangnan 2 is Huaneng’s farm (36 × 8.5 MW, 300 MW), not CR Power’s; this 500 MW row is an aggregate of Cangnan 2 with “Wenzhou Dongtou” and GEM already carries Cangnan 2 itself',
        'https://new.qq.com/rain/a/20230419A060DE00'),
    dup('CHN', 'Guangxi Qinzhou / Fangchenggang B', C, ('Guangxi Fangchenggang A', C),
        '廣西目前建成的只有防城港示範項目 A 場址（700 MW、83 部，2025 年 2 月 7 日全容量投產）；這筆「欽州／防城港 B」500 MW 是規劃場址，與 A 場址重複',
        'Guangxi’s only completed offshore farm is site A of the Fangchenggang demonstration project (700 MW, 83 turbines, full capacity on 7 February 2025); this “Qinzhou / Fangchenggang B” 500 MW row is a planned site that duplicates it',
        'http://www.gx.xinhua.org/20250208/489586cf99ff4ed8908866faa90a118f/c.html'),
    fix('CHN', 'Zhuanghe V / Liaoning 2025', C,
        '莊河場址 V 是 250 MW（24 部 9 MW＋4 部 8.5 MW，招商局太平灣與三峽能源），2025 年 4 月主體完工；原寫 500 MW、名稱混入「遼寧 2025」',
        'Zhuanghe site V is 250 MW (24 × 9 MW plus 4 × 8.5 MW, China Merchants Taipingwan and CTG Renewables), main works finished April 2025; was 500 MW with “Liaoning 2025” in the name',
        'https://finance.sina.com.cn/jjxw/2025-04-13/doc-inesycqi0944554.shtml', rename='Zhuanghe V', zhname='莊河V', mw=250,
        owner='China Merchants Taipingwan New Energy; CTG Renewables'),
    fix('CHN', 'Jiangsu Sheyang Southern Area H5 Offshore wind farm', G,
        '龍源射陽 100 萬瓩案一期（H4、H5，35 部 8.5 MW、297.5 MW）2026 年 4 月 30 日才開始製作單樁，仍在興建；GEM 列為 2024 年營運',
        'Phase 1 of Longyuan’s 1,000 MW Sheyang project (H4 and H5, 35 × 8.5 MW, 297.5 MW) only started fabricating its monopiles on 30 April 2026 and is still under construction; GEM lists it as operating since 2024',
        'https://hykzsxny.jstec.com.cn/news/202612828050571160', st=1, year=0),
    dup('CHN', 'Huaneng Zhuanghe IV1', C, ('Liaoning Dalian Zhuanghe 4 Area I Offshore wind farm', G),
        '同一座風場（華能莊河 Ⅳ1，350 MW、51 部，2021 年 12 月 29 日全容量併網）；GEM 的容量正確',
        'Same farm (Huaneng Zhuanghe IV-1, 350 MW, 51 turbines, fully connected on 29 December 2021); GEM’s capacity is the right one',
        'https://www.chinanews.com/ny/2021/12-29/9640309.shtml'),
    dup('CHN', 'Zhejiang Putuo 6 Offshore wind farm', G, ('Guodian Zhoushan Putuo 6#2', C),
        '同一座風場（國電電力舟山普陀 6 號 2 區，252 MW、63 部西門子 4 MW，2019 年）', 'Same farm (Guodian Power’s Zhoushan Putuo 6 zone 2, 252 MW, 63 × Siemens 4 MW, 2019)',
        'https://www.ceic.com/gjnyjtww/chnyxfc/202006/e5a14799afc44f2a890f4e1784673ac0.shtml'),
    fix('CHN', 'Shanghai Lingang Demonstration Phase 1', C,
        '臨港一期示範 25 部 4 MW（上海電氣 W4000）2018 年 5 月開工、2019 年完工，晚於二期；原寫 2016 年、3.6 MW 機組',
        'Lingang phase 1 (25 × 4 MW Shanghai Electric W4000) started in May 2018 and finished in 2019, after phase 2; was 2016 with 3.6 MW turbines',
        'https://www.fegroup.com.cn/ydkg/xwzx79/gsxw10/577818/index.html', year=2019, turbine='25 x Shanghai Electric W4000 4 MW'),
    fix('VNM', 'Thanh Hải No. 5 Offshore wind farm', G,
        '檳椥 5 號（成海）風場是新環球檳椥公司的案子，不是越南電力公司；全案 28 部、120 MW（EVN 落成報導）',
        'The Ben Tre No. 5 (Thanh Hai) farm belongs to Tan Hoan Cau Ben Tre, not EVN; 28 turbines and 120 MW in all (EVN inauguration report)',
        'https://www.evn.com.vn/d6/news/Khanh-thanh-Nha-may-dien-gio-so-5-Thanh-Hai-Ben-Tre-100-668-55952.aspx', owner='Tân Hoàn Cầu Bến Tre JSC', mw=120),
    dup('VNM', 'Ben Tre 5 Thanh Hai 1', C, ('Thanh Hải No. 5 Offshore wind farm', G),
        '5 號風場一期（成海 1，7 部 30 MW）；GEM 的一筆已含全案', 'Phase 1 of the No. 5 farm (Thanh Hai 1, 7 turbines, 30 MW); GEM’s record covers the whole project',
        'https://lethycorp.com/du-an-da-thi-cong/dien-gio-so-5.html'),
    dup('VNM', 'Ben Tre 5 Thanh Hai 2', C, ('Thanh Hải No. 5 Offshore wind farm', G),
        '5 號風場二期（成海 2–4，21 部 90 MW）的一部分；GEM 的一筆已含全案', 'Part of phase 2 of the No. 5 farm (Thanh Hai 2–4, 21 turbines, 90 MW); GEM’s record covers the whole project',
        'https://lethycorp.com/du-an-da-thi-cong/dien-gio-so-5.html'),
    dup('VNM', 'VPL 1 nearshore wind power plant', G, ('VPL Ben Tre (Nexif Ben Tre 1)', C),
        '同一座風場（Nexif 的 VPL 檳椥一期，30 MW，平大縣）', 'Same farm (Nexif’s VPL Ben Tre phase 1, 30 MW, Binh Dai district)',
        'https://www.phanvu.vn/en-US/vpl-ben-tre-wind-power-plant-p1'),
    dup('CHN', 'Guangdong Energy Zhanjiang Xuwen', C, ('Guangdong Zhanjiang Xuwen Offshore wind farm', G),
        '湛江徐聞 600 MW（南、北兩個標段各 47 台，北區 2021 年 11 月 19 日全容量併網）是國家電投的風場，這筆「粵電徐聞 300 MW」只是其中一半；GEM 的徐聞一筆已含 600 MW 原場與 300 MW 增容',
        'The Zhanjiang Xuwen 600 MW farm (two lots of 47 turbines; the north lot fully connected on 19 November 2021) is SPIC’s; this “Guangdong Energy Xuwen 300 MW” row is half of it, and GEM’s Xuwen record already carries the 600 MW farm plus the 300 MW extension',
        'https://www.ne21.com/news/show-166655.html'),
    dup('CHN', 'Shandong Changyi Laizhouwan Offshore wind farm', G, ('CTG Changyi', C),
        '同一座風場（三峽昌邑萊州灣一期／海洋牧場融合示範，300 MW、50 部 6 MW，2022 年）', 'Same farm (CTG’s Changyi Laizhou Bay phase 1 / marine-ranch demonstration, 300 MW, 50 × 6 MW, 2022)',
        'http://www.sasac.gov.cn/n2588025/n2588124/c26784560/content.html'),
    # ------------------------------------------------ 2026-10-03 第 5 步全量查證時記下的資料異常，逐筆重新查證（出處原文已以 check_quotes 核對）
    dup('CHN', 'Shandong Peninsula South U Site Offshore Wind Project', G, ('CGN Peninsula South U1', C),
        'GEM這筆（中文名「國家電投…U場址一期」）把國家電投U1（900 MW，106×8.5 MW，2024-10-26全容量投運）與國能國華U2（603.5 MW）加總成1503.5 MW；U1已有精選紀錄「CGN Peninsula South U1」（同筆另修正業主、容量、年份），U2另有GEM紀錄「Shandong Bandaonan U2 (Guohua) Offshore wind farm」，故本筆為重複（騰訊／經濟導報2024-10-28、海報新聞2023-11）。',
        "This GEM record (Chinese name says SPIC U site phase 1) lumps SPIC's U1 (900 MW, 106 x 8.5 MW, fully operational 2024-10-26) and Guohua's U2 (603.5 MW) into 1503.5 MW; U1 is already the curated record 'CGN Peninsula South U1' (corrected separately) and U2 is the GEM record 'Shandong Bandaonan U2 (Guohua) Offshore wind farm', so this one is a duplicate (Tencent/Economic Herald 2024-10-28, Haibao News 2023-11).",
        'https://news.qq.com/rain/a/20241028A054SE00'),
    drop('CHN', 'Shandong Guohua Kenli Offshore wind farm', G,
        '國華投資山東墾利100萬kW項目是海上光伏（東營離岸8 km、2934座光伏平台、2024-11首批併網），不是風場（中國中鐵2025-02-11）；查無同名海上風電。',
        'The Guohua Kenli 1,000 MW project off Dongying (8 km offshore, 2,934 PV platforms, first units connected Nov 2024) is an offshore solar plant, not a wind farm (China Railway Group 2025-02-11); no offshore wind farm of this name exists.',
        'https://www.crecg.com/web/xwzx61/gsyw87/2025021110071850533/index.html'),
    dup('CHN', 'Guoneng Peninsula South U2 / Laizhou', C, ('Shandong Bandaonan U2 (Guohua) Offshore wind farm', G),
        '國華投資半島南U2場址位於威海乳山市海域（非萊州），603.5 MW、71台遠景EN226-8.5 MW分兩期（36＋35台），2023-07首台吊裝（山東省能源局2023-08-07）；資料庫已有 GEM 筆「Shandong Bandaonan U2 (Guohua) Offshore wind farm」（603.5 MW，座標36.571,121.745 正確），本筆容量500 MW、座標在萊州灣均錯，屬重複。',
        "Guohua's Peninsula South U2 site lies off Rushan, Weihai (not Laizhou): 603.5 MW, 71 Envision EN226-8.5 MW turbines in two phases (36 + 35), first turbine installed July 2023 (Shandong Energy Administration 2023-08-07); the GEM record 'Shandong Bandaonan U2 (Guohua) Offshore wind farm' (603.5 MW, correct coordinates 36.571,121.745) already covers it, and this record's 500 MW and Laizhou Bay coordinates are both wrong, so it is a duplicate.",
        'http://nyj.shandong.gov.cn/art/2023/8/7/art_59966_10299976.html'),
    dup('CHN', 'Shandong Bandaonan 4 Offshore wind farm', G, ('Huaneng Peninsula South 4', C),
        'GEM 的「山东半岛南 4 号海上风电项目」（302 MW、2021、華能山東發電）與精選的「Huaneng Peninsula South 4」（301.6 MW、2021）是同一座：華能山東半島南4號 301.6 MW、58×5.2 MW，2021-12-10 全容量併網（世紀新能源網 2021-04-06；水母網 2021-12-28）。刪 GEM 筆，保留精選筆。',
        "GEM's 'Shandong Bandaonan 4' (302 MW, 2021, Huaneng Shandong) and the curated 'Huaneng Peninsula South 4' (301.6 MW, 2021) are the same farm: Huaneng Shandong Peninsula South 4, 301.6 MW, 58x5.2 MW, full capacity on 2021-12-10 (ne21.com 2021-04-06; shm.com.cn 2021-12-28). Drop the GEM record and keep the curated one.",
        'https://m.ne21.com/news/show-159357.html'),
    dup('CHN', 'Jiangsu Dafeng H11 (Three Gorges) Offshore wind farm', G, ('CTG Jiangsu Dafeng 300 MW', C),
        '「三峽大豐H11」就是三峽新能源江蘇大豐 300 MW 項目：採購公告寫明「三峡大丰海上风电场（H11项目）位于大丰市东沙沙洲北侧的小北槽-太平沙海域」（中國污水處理工程網轉三峽運維公告 2025-02-13），金風科技業績表亦列「三峡江苏大丰H11#30万千瓦项目 300 建成」（中國電機工程學會 2019-11）；該項目 2019-10-31 全部機組併網（CWEEA 2019-11-15）。與精選筆「CTG Jiangsu Dafeng 300 MW」為同一座，刪 GEM 筆。',
        "'Three Gorges Dafeng H11' is the CTG Renewables Jiangsu Dafeng 300 MW project: a procurement notice states the Three Gorges Dafeng offshore wind farm (H11 project) lies in the Xiaobeicao-Taipingsha waters north of Dongsha shoal (dowater.com citing CTG O&M, 2025-02-13), and Goldwind's track record lists 'Three Gorges Jiangsu Dafeng H11# 300 MW, built' (CSEE, Nov 2019); all units were connected on 2019-10-31 (CWEEA 2019-11-15). Same farm as the curated 'CTG Jiangsu Dafeng 300 MW', so drop the GEM record.",
        'https://www.dowater.com/zhaobiao/2025-02-13/7570794.asp'),
    dup('CHN', 'Guohua Dongtai V (H5)', C, ('Jiangsu Dongtai Zhugensha H1 Offshore wind farm', G),
        '新華網江蘇 2021-11-21：國華投資江蘇東台項目由東台四期（北條子泥海域）與東台五期（竹根沙海域）組成，東台五期 20 萬千瓦、50 台風機，2021-11-20 全容量併網；南通泰勝藍島 2021-05 稱國華竹根沙H1# 為 50 台 4.0 MW、200 MW。兩筆是同一座風場，刪此筆、保留 GEM 的竹根沙H1#紀錄。',
        "Xinhua Jiangsu (2021-11-21): Guohua's Dongtai project consists of Phase IV (Beitiaozini) and Phase V in the Zhugensha sea area, Phase V being 200 MW with 50 turbines, fully grid-connected on 20 Nov 2021; Nantong Taisheng Lantao (2021-05) describes Guohua Zhugensha H1# as 50 x 4.0 MW, 200 MW. Same farm: delete this record and keep the GEM Zhugensha H1 record.",
        'http://js.news.cn/2021-11/21/c_1128085511.htm'),
    drop('CHN', 'Guodian Rudong H1', C,
        '如東 11 座海上風電場為國信H2、海裝H3及H3-2、國電投H4／H7、蘇交控H5、三峽H6／H10、中廣核H8、協鑫H13／H15（新華日報 2021-11-29），加上 2020 年投運的魯能H14；2018 年核准清單（浙商證券整理）中如東亦無 H1# 場址。查無「國電投／國能如東H1」，此精選占位紀錄（無業主、無中文來源）應刪除。',
        "Rudong's eleven offshore farms are Guoxin H2, Haizhuang H3/H3-2, SPIC H4/H7, Sujiaokong H5, CTG H6/H10, CGN H8 and GCL H13/H15 (Xinhua Daily 2021-11-29), plus Luneng H14 commissioned in 2020; the 2018 approval list (Zheshang Securities compilation) has no Rudong H1# site either. No 'SPIC/Guoneng Rudong H1' exists, so this curated placeholder (no owner, no source) should be dropped.",
        'https://www.163.com/dy/article/GQ0GC2VI05345ASA.html'),
    dup('CHN', 'Jiangsu Rudong H1-2 (Xiexin) Offshore wind farm', G, ('Zhongtian Rudong H15', C),
        '江蘇省發改委 2018-11-30 核准「協鑫如東H1-2#海上風電場項目」（蘇發改能源發(2018)1181號）；浙商證券整理 2018 年核准清單寫「協鑫如東200MW海上風電項目（2018.12.16 獲核准）」，而協鑫同批另核准 H13# 為 150 MW。協鑫在如東建成的只有 H13（150 MW）與 H15（200 MW，2021-11-29 全容量併網），H1-2# 即 H15 的核准名稱，此筆（200 MW、2024 年）為重複。',
        "Jiangsu DRC approved the 'GCL Rudong H1-2# offshore wind farm' on 2018-11-30; the Zheshang Securities compilation lists it as the 'GCL Rudong 200 MW project (approved 2018-12-16)' while GCL's H13# in the same batch is 150 MW. GCL built only H13 (150 MW) and H15 (200 MW, fully grid-connected 29 Nov 2021) at Rudong, so H1-2# is the approval name of H15 and this 200 MW / 2024 record is a duplicate.",
        'https://fzggw.jiangsu.gov.cn/art/2018/11/30/art_59371_372.html'),
    dup('CHN', 'Jiangsu Dafeng H10 (Three Gorges) Offshore wind farm', G, ('Jiangsu Dafeng H10 (Guoxin) Offshore wind farm', G),
        '新浪財經 2025-03-13（國信集團稿）：江蘇國信大豐 85 萬千瓦項目包含大豐H1#、H2#、H10#、H16#，100 台 8.5 MW，2025 年全容量併網；大豐港務 2025-03 載三峽在大豐 2021 年建成的是 H8-2。查無「三峽大豐H10」155 MW／2021，大豐唯一的 H10# 場址屬國信（150 MW），資料庫已有該紀錄，此筆刪除。',
        "Sina Finance (2025-03-13, Guoxin release): Jiangsu Guoxin's 850 MW Dafeng project comprises Dafeng H1#, H2#, H10# and H16#, 100 x 8.5 MW, due for full grid connection in 2025; the Dafeng government (2025-03) says what CTG built at Dafeng in 2021 was H8-2. No 'CTG Dafeng H10' of 155 MW / 2021 exists; the only H10# site at Dafeng is Guoxin's 150 MW block, already in the database, so delete this record.",
        'https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml'),
    dup('CHN', 'Guangdong Huilai Shibeishan Offshore wind farm', G, ('Guangdong Huilai Shibeishan wind farm', G),
        'CPEM 2025-07-01（三一重能稿）：石碑山風電場為國家首批特許權項目，原裝機 100.2 MW、167 台 0.6 MW，2007 年 4 月全容量投運，「上大壓小」後機位由 167 個縮減至 15 個、釋放土地空間約 5 萬平方米——是陸上風場。資料庫已有陸上紀錄「Guangdong Huilai Shibeishan wind farm」（100 MW），此筆誤標離岸，刪除。',
        "CPEM (2025-07-01, Sany release): Shibeishan is a first-round national concession farm, originally 100.2 MW with 167 x 0.6 MW turbines, fully operational in April 2007; the repowering cuts the sites from 167 to 15 and frees about 50,000 m2 of land, i.e. it is onshore. The onshore record 'Guangdong Huilai Shibeishan wind farm' (100 MW) already exists, so this offshore-tagged record is deleted.",
        'https://www.cpem.org.cn/list123/109502.html'),
    drop('CHN', 'Shangdong Dongying Dongfang offshore wind farm', G,
        '東方電氣 26 MW 樣機 2025-08-29 吊裝於「東營風電裝備測試認證創新基地」（東方風電官網）。該基地是臨海滩涂上的陸上測試場：山東新聞聯播／搜狐 2026-09 說明過去企業須「自行到海上建設測試機位」，而此基地建於東營經開區土地上，單機位基礎混凝土 3500 m3 約為陸上風電基礎三倍；中國能建稱其為「專用臨海風電測試基地」，總裝機 240 MW。單機測試機位不在海上，不是離岸風場，刪除。',
        "Dongfang's 26 MW prototype was erected on 2025-08-29 at the Dongying wind-equipment test and certification base (Dongfang Wind official site). The base is a land-based test site on coastal tidal flats: Shandong TV/Sohu (2026-09) explain that firms previously had to build test positions at sea, whereas this base sits on land in the Dongying development zone with 3,500 m3 concrete foundations about three times an onshore foundation; CEEC calls it a dedicated 'coastal' test base of 240 MW. A single test unit not at sea is not an offshore wind farm, so drop.",
        'https://dew.dongfang.com/info/1240/2190.htm'),
    drop('CHN', 'Guangdong Coastal Test Site Single Offshore wind farm', G,
        '「廣東省風電臨海試驗基地」是南方電網在汕頭濠江區岸上建的風機並網測試機位（央視網 2025-01-06：利用濠江區海峽狹管效應，試驗成本僅為海上的 1/3；1、2 號機位 2022 年底投入運行，3、4 號機位 2025 年初建成），東方電氣 18 MW 樣機只是在此做認證測試，不是海上風場。',
        "The Guangdong coastal wind test base is an onshore test-pad facility built by China Southern Grid in Shantou's Haojiang district (CCTV 2025-01-06: it uses the strait funnel effect at Haojiang and testing costs about a third of testing at sea; pads 1-2 ran from end-2022, pads 3-4 were finished in early 2025); the Dongfang 18 MW prototype was only certified there. It is not an offshore wind farm.",
        'https://local.cctv.com/2025/01/06/ARTIzJUvELxU9Wo0PNcKiFUJ250106.shtml'),
    dup('VNM', 'Xinshun offshore wind farm', G, ('Tan Thuan (PECC2) Phase 1+2', C),
        'GEM 的「Xinshun」只引用 GlobalData 檔案；power-technology 的 GlobalData 檔案寫明該案在金甌省、18 台機組、2021 年 11 月商轉、EPC 為中國能建規劃設計集團，與金甌新順（Tân Thuận，漢語「新順」＝Xinshun）風場一致（18 台、2021 年底商轉、一期 25 MW＋二期 50 MW），座標誤放寧順外海、90 MW 為資料庫容量錯誤，屬重複。',
        "GEM's 'Xinshun' cites only a GlobalData profile; power-technology's GlobalData profile places it in Ca Mau with 18 turbines, commercial operation November 2021 and China Energy Engineering as EPC, matching the Tan Thuan farm (Chinese name 新顺 = Xinshun; 18 turbines, COD late 2021, 25 MW + 50 MW). The Ninh Thuan coordinates and 90 MW are database errors; it is a duplicate.",
        'https://www.power-technology.com/data-insights/power-plant-profile-xinshun-offshore-wind-power-project-vietnam/'),
    dup('CHN', 'Datang Pingtan Waihai', C, ("Fujian Pingtan Changjiang'Ao Offshore wind farm", G),
        "大唐在平潭唯一的海上風場是長江澳（一期 15 台約 185 MW，2024 年投產；二期 110 MW、11 台 10 MW 於 2024-12-25 全容量投產，世紀新能源網 2025-01-02），合計約 295 MW，與本筆 300 MW 相符，資料庫已另有「Fujian Pingtan Changjiang'Ao Offshore wind farm」（295 MW），本筆為重複；「平潭外海」之名實為三峽 111 MW 專案（2023-09 全容量，國資委）。",
        "Datang's only offshore farm at Pingtan is Changjiang'ao (phase 1: 15 turbines, about 185 MW, 2024; phase 2: 110 MW, 11 x 10 MW, full capacity 2024-12-25 per ne21 2025-01-02), about 295 MW in total, matching this 300 MW record; the database already has 'Fujian Pingtan Changjiang'Ao Offshore wind farm' (295 MW), so this is a duplicate. The name 'Pingtan Waihai' actually belongs to CTG's 111 MW project (full capacity Sept 2023, SASAC).",
        'https://www.ne21.com/news/show-206639.html'),
    dup('CHN', 'Ningde Xiapu / Xiapu A', C, ('Fujian Ningde Xiapu Offshore wind farm · B', G),
        '查無寧德霞浦海上風電 2021 年建成之紀錄：霞浦 A 區（200 MW）僅列規劃，B 區（300 MW）2023 年底由省發改委批准核准延期、2024 年才 EPC 開標（世紀新能源網 2023-12、2024-08），資料庫已有 A、B 區的規劃中紀錄，本筆 300 MW／2021 營運中為錯誤重複。',
        'No record exists of a Ningde Xiapu offshore farm completed in 2021: area A (200 MW) is only planned and area B (300 MW) had its approval extended by the provincial NDRC in late 2023 with the EPC tender opened in 2024 (ne21 2023-12 and 2024-08). The database already holds planned records for areas A and B, so this 300 MW/2021 operating record is an erroneous duplicate.',
        'https://www.ne21.com/news/show-185714.html'),
    dup('CHN', 'CGN Taizhou 1', C, ('Zhejiang Taizhou 1 Offshore wind farm', G),
        '台州 1 號海上風電場為浙能專案（CPEM 轉中鐵大橋局 2023-09：浙能台州 1 號海上風電場位於臨海市雀兒岙島北側，40 台 7.5 MW、300 MW，2023-09-19 最後一台風機安裝完成、年底併網），查無中廣核在台州的營運中風場，本筆（Mingyang 6.45／2022）為「Zhejiang Taizhou 1 Offshore wind farm」之重複。',
        "Taizhou No.1 offshore wind farm is a Zhejiang Energy (Zheneng) project (CPEM via China Railway Major Bridge, Sept 2023: north of Que'erao island, Linhai; 40 x 7.5 MW = 300 MW; last turbine installed 2023-09-19, grid connection by year end). There is no operating CGN farm at Taizhou, so this record (Mingyang 6.45 MW, 2022) duplicates 'Zhejiang Taizhou 1 Offshore wind farm'.",
        'https://www.cpem.org.cn/list68/82617.html'),
    dup('CHN', 'Guoxin Sheyang H1', C, ('Huaneng Sheyang H1 / Yancheng', C),
        '射陽海上南區H1#30萬千瓦為華能項目（射陽縣第一個海上風電項目，67台2020-11吊裝完成，中國縣域經濟報百家號2020-11-05）；江蘇國信在射陽的海上風電是2026年才成立項目公司、尚未開工的射陽北區H1#75萬千瓦，與本筆（300MW、2021、33.8N 120.75E）不符。本筆與「Huaneng Sheyang H1 / Yancheng」同場址、同容量、同年份，判為重複。',
        "Sheyang Southern Area H1 (300 MW) is Huaneng's project, the county's first offshore farm, with 67 turbines installed by Nov 2020 (China County Economy News on Baijiahao, 5 Nov 2020); Jiangsu Guoxin's only Sheyang offshore project is the 750 MW Sheyang Northern Area H1, whose project company was formed in 2026 and which has not started, so it does not match this record (300 MW, 2021, 33.8N 120.75E). This record shares site, capacity and year with 'Huaneng Sheyang H1 / Yancheng' and is a duplicate.",
        'https://baijiahao.baidu.com/s?id=1682496439824355289&wfr=spider&for=pc'),
    dup('CHN', 'Shandong Bandaonan V Offshore wind farm', G, ('SPIC Peninsula South V', C),
        '同一座風場（國家電投山東半島南 V 場址，500 MW、70 部 7 MW＋1 部 10 MW，2022 年 12 月 9 日全容量併網）；精選那筆同時更正容量與年份',
        'Same farm (SPIC’s Shandong Peninsula South site V, 500 MW, 70 × 7 MW plus 1 × 10 MW, fully connected on 9 December 2022); the curated row is corrected at the same time',
        'http://nyj.shandong.gov.cn/art/2023/2/15/art_253733_10296175.html'),
    fix('CHN', 'SPIC Jieyang Shenquan II', C,
        '揭陽市政府2022-12-28：神泉二總裝機502 MW，安裝34台11 MW＋16台8 MW共50台，2022-12-28全容量併網投產；資料庫50座正確，年份2022正確，機型欄改為實際組合。',
        'Jieyang municipal government, 2022-12-28: Shenquan II is 502 MW with 34 x 11 MW and 16 x 8 MW turbines (50 in total), fully grid-connected on 28 Dec 2022; the count of 50 and year 2022 are right, the turbine field is corrected to the actual mix.',
        'http://www.jieyang.gov.cn/xwdt/jyxw/content/post_734301.html', turbine='34x 11 MW + 16x 8 MW', year=2022),
    fix('CHN', 'Huadian Yangjiang Qingzhou 3', C,
        '陽江市生態環境局驗收公示（2023-07-12）：500 MW、37台6.8 MW＋30台8.3 MW，2020-11-02開工、2021年12月全部67台風機併網完成；年份應為2021，非2022。',
        'Yangjiang Ecology and Environment Bureau acceptance notice (2023-07-12): 500 MW, 37 x 6.8 MW + 30 x 8.3 MW, construction from 2 Nov 2020 and all 67 turbines grid-connected by December 2021; the year should be 2021, not 2022.',
        'https://www.yangjiang.gov.cn/yj/zwgk/zdlyxxgk/hjbh/jsxmjghbysxx/content/post_719318.html', year=2021),
    fix('CHN', 'Guoneng Bozhong B1 / Bozhong B', C,
        '渤中B場址是山東能源電力集團項目，非國能：47台上海電氣EW8.5-230，2022-09-08首吊、2022-12-30全容量併網，與A場址（60台海裝8.35 MW）合計90萬kW（國務院國資委2023-03-22）；國能／國華的渤中項目是另一筆「Shandong Bozhong B2」（59×8.5 MW，2023）。機型與業主改正，容量按47×8.5＝399.5 MW。',
        "Bozhong site B belongs to Shandong Energy Electric Power Group, not CHN Energy: 47 Shanghai Electric EW8.5-230 turbines, first lift 8 Sep 2022 and full grid connection 30 Dec 2022, 900 MW together with site A (60 x CSSC Haizhuang 8.35 MW) (SASAC 2023-03-22); CHN Energy/Guohua's Bozhong project is the separate record 'Shandong Bozhong B2' (59 x 8.5 MW, 2023). Owner and turbines corrected; capacity 47 x 8.5 = 399.5 MW.",
        'http://www.sasac.gov.cn/n2588025/n2588129/c27500182/content.html', rename='Shandong Energy Bozhong B', zhname='山東能源渤中B', owner='Shandong Energy Group Electric Power Group Co Ltd', turbine='47x Shanghai Electric EW8.5-230', mw=399.5, year=2022),
    fix('CHN', 'Mingyang Yangjiang Qingzhou 4', C,
        '龍船風電網（搜狐轉載）2024-02-01：明陽陽江青洲四500 MW，44台固定式機組（25台MySE11-230＋19台MySE12-242），水深45–47 m，2024-02-01全容量併網；年份改2024、機型改正，浮式「明陽天成號」另有紀錄「Mingyang OceanX (Tiancheng) floating」。',
        "Longchuan Wind (via Sohu), 2024-02-01: Mingyang Yangjiang Qingzhou 4 is 500 MW with 44 fixed-bottom turbines (25 MySE11-230 + 19 MySE12-242) in 45-47 m water, fully grid-connected on 1 Feb 2024; year changed to 2024 and turbines corrected; the floating OceanX unit is the separate record 'Mingyang OceanX (Tiancheng) floating'.",
        'https://www.sohu.com/a/755731064_121194771', year=2024, turbine='44x Mingyang MySE11-230 (25) / MySE12-242 (19)'),
    fix('CHN', 'CGN Peninsula South U1', C,
        '半島南U1為國家電投山東能源投資建設（非中廣核），90萬kW、106台8.5 MW分兩期：一期450 MW 2023-11-17投運、二期450 MW 2024-10-26全容量併網（中國電器工業協會2024-10-31、騰訊／IT之家2024-10-27）；位於乳山市南側海域。',
        'Peninsula South U1 is built by SPIC Shandong Energy (not CGN): 900 MW, 106 x 8.5 MW in two phases, phase 1 (450 MW) operational 17 Nov 2023 and phase 2 (450 MW) fully connected 26 Oct 2024 (CEEIA 2024-10-31, Tencent/IT Home 2024-10-27); located south of Rushan.',
        'https://www.ceeia.com/XWZX/d/202410/1e56e39e98c44482a46066bc95bcdb07.html', rename='SPIC Peninsula South U1', zhname='國家電投半島南U1', owner='SPIC Shandong Energy Development Co Ltd', mw=900, year=2024, turbine='106x 8.5 MW'),
    fix('CHN', 'Changle Waihai C', C,
        '疑點不成立：長樂外海C區由福建能源石化集團權屬福能海峽發電有限公司投資建設（福建日報／福州新聞網2026-07-03、福建省政府2026-01-29），資料庫業主「海峽發電49%＋福能」即此合資公司，非三峽；總裝機496 MW、57台（含20台東方10 MW，世紀新能源網2021-10-25），2020年底開工、一年後57台全容量併網，年份2021正確；容量改496、機型改正。',
        'The ownership doubt is unfounded: Changle Waihai Area C is invested and built by Funeng Strait Power Generation Co (a Fujian Energy & Petrochemical Group company) (Fujian Daily/Fuzhou News 2026-07-03, Fujian provincial government 2026-01-29), which is the Strait Power 49% / Funeng joint venture in the database, not CTG; 496 MW, 57 turbines including 20 Dongfang 10 MW units (ne21 2021-10-25), main works from late 2020 and all 57 turbines fully connected a year later, so 2021 is right; capacity set to 496 and turbines corrected.',
        'https://news.fznews.com.cn/changle/20260703/4409ZM6r4S.shtml', mw=496, turbine='37x 8 MW + 20x Dongfang 10 MW'),
    fix('CHN', 'CTG Yangjiang Shapa Phase 3', C,
        "三峽陽江沙扒三期400 MW於2021年底前建成併網、單機容量約6.45 MW（CPEM轉載研報）；浮式「三峽引領號」5.5 MW已另有紀錄「Yangjiang Shapa 'Sanxia Yinling' floating」（type 2），機型欄不應再含該浮式機組，刪去。",
        'CTG Yangjiang Shapa phase 3 (400 MW) was built and connected before end-2021 with roughly 6.45 MW units (research note via CPEM); the 5.5 MW floating \'Sanxia Yinling\' already has its own record "Yangjiang Shapa \'Sanxia Yinling\' floating" (type 2), so it is removed from this turbine field.',
        'https://www.cpem.org.cn/list99/51783.html', turbine='Mingyang 6.45 MW class'),
    fix('CHN', 'SPIC Jieyang Shenquan I', C,
        '神泉一400 MW分兩期：一期315 MW（16台7 MW＋37台5.5 MW）2021年底併網，二期91 MW（13台上海電氣7 MW）2022-04首樁、2023年4月全容量併網（世紀新能源網2022-01、2022-04-28、2024-01）；機型「上海電氣8 MW級」錯誤，全場併網年份為2023。',
        "Shenquan I (400 MW) has two phases: phase 1, 315 MW (16 x 7 MW + 37 x 5.5 MW) connected end-2021, and phase 2, 91 MW (13 Shanghai Electric 7 MW), first pile April 2022 and full grid connection in April 2023 (ne21 2022-01, 2022-04-28, 2024-01); 'Shanghai Electric 8 MW class' is wrong and the whole farm was complete in 2023.",
        'https://www.ne21.com/news/show-166728.html', turbine='16x 7 MW + 37x 5.5 MW (phase 1, 315 MW) + 13x Shanghai Electric 7 MW (phase 2, 91 MW)', mw=406, year=2021, ph=[[2021, 315], [2023, 91]]),
    fix('CHN', 'Huaneng Cangnan 4', C,
        '蒼南新聞網2022-09-06：華能蒼南4號海上風電（77台機組）建成投產，為全省迎峰度夏提供電源支撐；年份應為2022，非2023。',
        "Cangnan News (2022-09-06): Huaneng Cangnan 4 offshore wind farm (77 turbines) was completed and put into operation, supporting the province's summer peak; the year should be 2022, not 2023.",
        'https://www.cnxw.com.cn/system/2022/09/06/014531534.shtml', year=2022),
    fix('CHN', 'Huaneng Zhanjiang Xuwen East', C,
        '查無「華能」徐聞東風場；業主欄的明陽／巴斯夫對應的是「明陽巴斯夫湛江徐聞東三海上風電示範項目」：500 MW、核准方案 50×10 MW（湛江市政府 2024-05；CPEM 轉湛江發改 2024-12-20），2024-12-18 才開工動員，官方預計 2025 年底併網；2025-04 風機招標已改為 30×16.7 MW（新浪財經轉中國能建公告）。至今未查得併網報導，改為興建中、年份未定。',
        "No 'Huaneng' Xuwen East farm exists; the BASF/Mingyang owner points to the Mingyang-BASF Zhanjiang Xuwen East 3 demonstration project: 500 MW, approved as 50x10 MW (Zhanjiang government, May 2024; CPEM citing Zhanjiang DRC, 2024-12-20), construction mobilised only on 2024-12-18 with grid connection officially expected end-2025; the April 2025 turbine tender changed the layout to 30x16.7 MW (Sina Finance citing CEEC). No commissioning report found, so set to under construction with no year.",
        'https://www.cpem.org.cn/list68/103205.html', rename='Mingyang-BASF Zhanjiang Xuwen East 3', zhname='明陽巴斯夫湛江徐聞東三', mw=500, year=0, st=1, owner='Zhanjiang Mingyang-BASF New Energy (Ming Yang Smart Energy; BASF)', turbine='Mingyang (50x10 MW approved; 30x16.7 MW tendered 2025)'),
    fix('CHN', 'Zhejiang Shengsi 2 Offshore wind farm', G,
        '浙能嵊泗2號：核准 67×6.25 MW，實際建成 63 台、399.95 MW，2021-11-29 最後一台 88 號風機併網達全容量（中新網轉載於新浪科技 2021-11-29；浙江在線 2021-11-16）；報導寫明是「浙能集團」的重點工程，業主欄的國家電投浙江新能源不符。容量 400 MW 與年份 2021 正確。',
        'Zheneng Shengsi 2: approved as 67x6.25 MW but built with 63 turbines totalling 399.95 MW, reaching full capacity when turbine 88 connected on 2021-11-29 (China News via Sina Tech, 2021-11-29; Zhejiang Online, 2021-11-16); the reports name it a Zheneng Group key project, so the SPIC Zhejiang owner is wrong. 400 MW and 2021 are correct.',
        'https://finance.sina.com.cn/tech/2021-11-29/doc-ikyakumx0940273.shtml', owner='Zhejiang Provincial Energy Group (Zheneng)', turbine='63 turbines, 6.25 MW class', mw=400),
    fix('CHN', 'Putian Pinghai Bay Phase 3', C,
        '三期為 308 MW（中閩能源 2024-06-08 公告：一、二、三期合計 604 MW，其中三期 308 MW），資料庫容量正確、312 MW 之疑點不成立；疑點的「2022 年 2 月全容量」其實是二期全部機組投產時間。三期由閩投海電（福建省投資開發集團控股子公司）投資營運，2019–2022 年陸續達到預定可使用狀態，2023 年已全部投產，故年份改 2022；業主欄的海峽發電／福能不符。',
        "Phase 3 is 308 MW (Zhongmin Energy filing of 2024-06-08: phases 1-3 total 604 MW, of which phase 3 is 308 MW), so the database capacity is right and the 312 MW doubt fails; the 'Feb 2022 full capacity' in the doubt actually refers to phase 2. Phase 3 is owned and operated by Mintou Offshore Wind (a subsidiary of Fujian Investment & Development Group); its units reached service between 2019 and 2022 and were all in operation by 2023, so the year becomes 2022; the Haixia/Funeng owner is wrong.",
        'https://epaper.stcn.com/pic/202406/08/67a30a8e71359fb86d66138561bf8a4e.pdf', year=2022, owner='Fujian Putian Mintou Offshore Wind Power Co Ltd (Fujian Investment & Development Group)'),
    fix('CHN', 'Tangshan Laoting Yuetuo Island Phase 1', C,
        '疑點屬實：資料庫寫 2022 年營運、Sewind/Envision 6–8 MW，但 2024-09 才招標設計與升壓站（30×10 MW＋1×4 MW、304 MW，計畫 2025-12-30 全容量併網，電力招標網），2025-01 才招標風機基礎與安裝（計畫 2025-02-15 首樁沉樁，中國低碳網轉國能 e 招），2025-08 業界進度梳理仍寫「因海事原因改機位，進度緩慢」（新浪財經 2025-08-26）。至今未查得併網報導，改為興建中、年份未定；業主國電申能唐山新能源正確。',
        'The doubt holds: the record says operating since 2022 with Sewind/Envision 6-8 MW turbines, yet design and substation works were only tendered in September 2024 (30x10 MW + 1x4 MW, 304 MW, full grid connection planned for 2025-12-30; dlztb.com), foundations and installation in January 2025 (first pile planned 2025-02-15; ditan360 citing Guoneng e-bidding), and an August 2025 industry progress review still called it slow after turbine positions were changed (Sina Finance, 2025-08-26). No commissioning report found, so set to under construction with no year; the Guodian Shenneng owner is correct.',
        'http://www.dlztb.com/news/202409/24/9839.html', st=1, year=0, turbine='30x 10 MW + 1x 4 MW (planned)'),
    fix('CHN', 'Shandong Laizhou Offshore Wind Farm And Acquaculture Integrated Project', G,
        '中廣核萊州 304 MW、38×8 MW，由中廣核新能源與山東誠源集團共同投資（山東省能源局 2022-12-21 轉大眾日報）；2022-12-24 全場 38 台併網達全容量（中天科技 2022-12-27），年份 2022 正確。容量 303→304，業主補為中廣核新能源與山東誠源。',
        'CGN Laizhou is 304 MW with 38x8 MW turbines, co-invested by CGN New Energy and Shandong Chengyuan Group (Shandong Energy Administration citing Dazhong Daily, 2022-12-21); all 38 turbines were connected on 2022-12-24 (ZTT, 2022-12-27), so 2022 is correct. Capacity 303 becomes 304 and the owner is completed.',
        'http://nyj.shandong.gov.cn/art/2022/12/21/art_253733_10295458.html', mw=304, owner='CGN New Energy; Shandong Chengyuan Group', turbine='38x 8 MW'),
    fix('CHN', 'Huaneng Peninsula South 4', C,
        '與 GEM「Shandong Bandaonan 4 Offshore wind farm」重複，保留本筆並補業主（華能山東發電，GEM 紀錄）與風機：301.6 MW、58×5.2 MW（世紀新能源網 2021-04-06），2021-12-10 全容量併網（水母網 2021-12-28）。',
        "Duplicate of GEM's 'Shandong Bandaonan 4 Offshore wind farm'; keep this record and fill in the owner (Huaneng Shandong Power Generation, per GEM) and turbines: 301.6 MW, 58x5.2 MW (ne21.com 2021-04-06), full capacity on 2021-12-10 (shm.com.cn 2021-12-28).",
        'https://m.ne21.com/news/show-159357.html', owner='Huaneng Shandong Power Generation Co Ltd', turbine='58x 5.2 MW'),
    fix('CHN', 'SPIC Peninsula South 3', C,
        '國家電投山東半島南3號由國家電投山東能源發展有限公司投資開發建設，301.6 MW、58×5.2 MW，2021-12-16 全容量併網（央廣網 2024-01-01；水母網 2021-12-28）。補業主，容量 301.5→301.6，風機改 58×5.2 MW。',
        'SPIC Shandong Peninsula South 3 was developed by SPIC Shandong Energy Development Co Ltd: 301.6 MW, 58x5.2 MW, full capacity on 2021-12-16 (CNR 2024-01-01; shm.com.cn 2021-12-28). Fill in the owner, change 301.5 to 301.6 MW and the turbines to 58x5.2 MW.',
        'https://www.cnr.cn/sd/tysd/20240101/t20240101_526543670.shtml', owner='SPIC Shandong Energy Development Co Ltd', mw=301.6, turbine='58x 5.2 MW'),
    fix('CHN', "Fujian Pingtan Changjiang'Ao Offshore wind farm", G,
        '疑點屬實：大唐平潭長江澳（顯美風電場）總裝機 185 MW，15 台 5 MW＋11 台 10 MW，建設單位福建平潭大唐海上風電有限責任公司，已全部投運並獲評 2024 年度 AAAAA 級風電場（福建省政府網轉福建日報 2025-08-25）；2024-07 時 15 台已併網、11 台 10 MW 在建（世紀新能源網 2024-07-08），2024 年平潭新併網風電 110 MW 即此續建部分。295 MW 有誤，改 185 MW；年份 2024 維持。',
        "The doubt holds: Datang Pingtan Changjiang'ao (Xianmei wind farm) totals 185 MW with 15x5 MW and 11x10 MW turbines, built by Fujian Pingtan Datang Offshore Wind Power Co Ltd, fully operating and rated an AAAAA wind farm for 2024 (Fujian provincial government citing Fujian Daily, 2025-08-25); in July 2024 15 turbines were connected and the 11x10 MW units under construction (ne21.com 2024-07-08), and the 110 MW Pingtan connected in 2024 is that extension. 295 MW is wrong, set 185 MW; keep 2024.",
        'https://www.fujian.gov.cn/zwgk/ztzl/sxzygwzxsgzx/flsxkmh/202508/t20250825_6995046.htm', mw=185, turbine='15x 5 MW + 11x 10 MW', owner='Fujian Pingtan Datang Offshore Wind Power Co Ltd (China Datang)', zhname='大唐平潭長江澳（顯美風電場）'),
    fix('CHN', 'Hebei Construction Investment Xiangyun Island', C,
        '疑點屬實：河北建投祥雲島 250 MW 擬裝 30 台 8.5 MW（環評公示；新浪財經 2025-04-16 轉風機採購中標候選人公示，三一重能預中標），2026-08-27 建投能源仍稱「祥雲島 25 萬千瓦……正在建設中」（騰訊新聞）。非 2021 年營運中風場，改興建中、預計 2026 年，風機改 30×8.5 MW。',
        'The doubt holds: Hebei Jiantou Xiangyun Island, 250 MW, is planned with 30x8.5 MW turbines (EIA notice; Sina Finance 2025-04-16 on the turbine-award notice, Sany pre-selected), and on 2026-08-27 Jiantou Energy still described the Xiangyun Island 250 MW project as under construction (Tencent News). Not a farm operating since 2021: set under construction, expected 2026, turbines 30x8.5 MW.',
        'https://www.eiacloud.com/gs/detail/3?id=40708PouBn', st=1, year=2026, turbine='30x 8.5 MW (planned)', owner='Hebei Construction & Investment Group (Jiantou Offshore Wind)'),
    fix('CHN', 'Putian Pinghai Bay Phase 2', C,
        '疑點屬實：平海灣二期 246 MW 由中閩能源全資子公司福建中閩海上風電有限公司投資營運，非龍源；該期自 2019 年起陸續併網、2021 年 12 月全容量併網投產（中閩能源 2024-06-08 公告），年份 2019→2021。',
        'The doubt holds: Pinghai Bay phase 2 (246 MW) is owned and operated by Fujian Zhongmin Offshore Wind Power Co Ltd, a wholly owned subsidiary of Zhongmin Energy, not Longyuan; its units connected progressively from 2019 and reached full capacity in December 2021 (Zhongmin Energy filing, 2024-06-08), so the year changes from 2019 to 2021.',
        'https://epaper.stcn.com/pic/202406/08/67a30a8e71359fb86d66138561bf8a4e.pdf', owner='Fujian Zhongmin Offshore Wind Power Co Ltd (Zhongmin Energy)', year=2021),
    fix('CHN', "Datang Nan'ao Lemen I", C,
        '疑點屬實：大唐南澳勒門Ⅰ 245 MW 安裝 35 台上海電氣 SWT7.0-154 7.0 MW 風機，2021-12-31 全容量投產（羊城晚報 2021-12-31），非明陽 6.45–7 MW；業主為中國大唐（大唐汕頭新能源有限公司，珠海特區報／汕頭橄欖台 2023-12-30）。',
        "The doubt holds: Datang Nan'ao Lemen I (245 MW) uses 35 Shanghai Electric SWT-7.0-154 turbines and reached full capacity on 2021-12-31 (Yangcheng Evening News), not Mingyang 6.45-7 MW; the owner is China Datang via Datang Shantou New Energy Co Ltd (hizh.cn, 2023-12-30).",
        'https://ycpai.ycwb.com/ycppad/content/2021-12/31/content_40487673.html', turbine='35x Shanghai Electric SWT-7.0-154', owner='China Datang (Datang Shantou New Energy Co Ltd)'),
    fix('CHN', 'Huaneng Shantou Lemen', C,
        '查無 2021 年 245 MW 的「華能汕頭勒門」：勒門海域 2021 年投產的 245 MW 是大唐南澳勒門Ⅰ（羊城晚報 2021-12-31），本筆數字顯然抄自它；華能在勒門的風場是勒門（二），總設計容量 594 MW（世紀新能源網轉華能招標 2022-04-28，招標人華能廣東汕頭海上風電有限責任公司），54 台上海電氣 11 MW，2023-12-29 併網投運（珠海特區報轉汕頭橄欖台 2023-12-30）。資料庫無其他勒門（二）紀錄，故改寫本筆而非刪除。',
        "No 245 MW 'Huaneng Shantou Lemen' from 2021 exists: the 245 MW Lemen farm commissioned in 2021 is Datang Nan'ao Lemen I (Yangcheng Evening News 2021-12-31), whose figures this record copies; Huaneng's farm at Lemen is Lemen (II), 594 MW design capacity (ne21.com citing the Huaneng tender of 2022-04-28, tenderer Huaneng Guangdong Shantou Offshore Wind Power Co Ltd), 54 Shanghai Electric 11 MW turbines, connected on 2023-12-29 (hizh.cn citing Shantou media, 2023-12-30). The database has no other Lemen (II) record, so rewrite this one rather than delete it.",
        'https://ycpai.ycwb.com/ycppad/content/2021-12/31/content_40487673.html', rename='Huaneng Shantou Lemen (II)', zhname='華能汕頭勒門（二）', mw=594, year=2023, turbine='54x Shanghai Electric 11 MW', owner='Huaneng Guangdong Shantou Offshore Wind Power Co Ltd (China Huaneng)'),
    fix('CHN', 'Zhejiang Daishan 4 Offshore wind farm', G,
        '人民網浙江頻道 2021-05-17 報導岱山4號海上風電（234 MW）於 5 月 16 日正式併入電網，資料庫年份 2020 應改 2021；風機座數兩來源不一（世紀新能源網 2020-12 寫 50 台、人民網 2021-05 寫 54 台），機型欄維持空白。',
        "People's Daily Zhejiang (2021-05-17) reports Daishan 4 (234 MW) was formally grid-connected on 16 May 2021, so the year should be 2021 rather than 2020; the turbine count differs between sources (50 per ne21 2020-12, 54 per People's Daily 2021-05), so the turbine field is left blank.",
        'http://zj.people.com.cn/n2/2021/0517/c370990-34728482.html', year=2021),
    fix('CHN', 'Shanghai Fengxian', C,
        '國家能源局電力可靠性中心與世紀新能源網（2021-11）均載明奉賢海上風電總裝機 206.4 MW、32 台 6.45 MW 機組，2021 年 11 月 28 日主體完工、2021 年內併網；資料庫 200 MW 應改 206.4 MW，機型改為 32×6.45 MW。',
        'The NEA reliability centre and ne21 (2021-11) both give 206.4 MW with 32 x 6.45 MW turbines; the main works finished on 28 Nov 2021 and the farm was grid-connected in 2021, so change 200 MW to 206.4 MW and the turbine field to 32 x 6.45 MW.',
        'https://prpq.nea.gov.cn/gczl/6856.html', mw=206.4, turbine='32x 6.45 MW'),
    fix('CHN', 'Zhongtian Rudong H15', C,
        '中國海裝官網 2021-12-20：協鑫江蘇如東 H13#、H15# 共採用 70 台中國海裝 H171-5MW 機組，2021-11-29 全容量併網；新華日報 2021-11-29 載 H13 為 30 台 5 MW，故 H15 為 40 台。業主為協鑫（資料庫已正確），「中天」只是承包商，名稱應改為協鑫如東H15；機型由 Envision 改為海裝 H171-5MW。',
        "CSSC Haizhuang (2021-12-20): GCL's Rudong H13# and H15# use 70 Haizhuang H171-5MW turbines in total and reached full grid connection on 29 Nov 2021; Xinhua Daily (2021-11-29) gives H13 as 30 x 5 MW, so H15 is 40 units. The owner is GCL (Xiexin), already correct in the record; 'Zhongtian' is only the contractor, so rename to Xiexin (GCL) Rudong H15 and change the turbine from Envision to Haizhuang H171-5MW.",
        'http://www.hzwindpower.com/zongbuxinwen/20211220092246.html', rename='Xiexin (GCL) Rudong H15', zhname='協鑫如東H15', turbine='40x CSSC Haizhuang H171-5MW'),
    fix('CHN', 'Longyuan Dafeng H7', C,
        '中國能源網 2019-06-27（金風科技稿）：龍源江蘇大豐H7 第 80 台風機併網，全場 80 台金風 GW130-2.5MW、20 萬千瓦；中國能源報 2019-08-05 亦載 80 台、20 萬千瓦。資料庫年份 2021、機型金風 6.45 MW 有誤（6.45 MW 是 2021 年的龍源大豐二期 94 台）。',
        "China5e (2019-06-27, Goldwind release): the 80th turbine of Longyuan Dafeng H7 was grid-connected, the farm being 80 x Goldwind GW130-2.5MW, 200 MW; China Energy News (2019-08-05) also gives 80 units / 200 MW. The record's 2021 and Goldwind 6.45 MW are wrong (the 94 x 6.45 MW units belong to Longyuan Dafeng Phase II, 2021).",
        'https://www.china5e.com/news/news-1061980-1.html', year=2019, turbine='80x Goldwind GW130-2.5'),
    fix('CHN', 'Jiangsu Rudong H14 (Guangheng) Offshore wind farm', G,
        '瓯洋海工 2020-12-19：魯能如東H14# 200 MW 於 2020-12-19 全容量併網，由魯能新能源投資，安裝 50 台上海電氣 4.0 MW（SWT-4.0-146）；2018 年核准清單的項目公司為「如東廣恒新能源」。年份 2020、200 MW 已正確；業主補魯能新能源（2020 年起併入國家電投，故資料庫寫國家電投江蘇並非全錯），機型補 50×SWT-4.0-146。',
        'OY Offshore (2020-12-19): Luneng Rudong H14# (200 MW) reached full grid connection on 19 Dec 2020, invested by Luneng New Energy, with 50 Shanghai Electric 4.0 MW (SWT-4.0-146) turbines; the 2018 approval list names the project company Rudong Guangheng New Energy. Year 2020 and 200 MW are already right; add Luneng as owner (Luneng was folded into SPIC in 2020, so the SPIC Jiangsu entry is not wholly wrong) and the turbine model.',
        'https://www.oyoffshore.co/detail/4.html', owner='Luneng New Energy (Rudong Guangheng New Energy Co Ltd; Luneng merged into SPIC in 2020)', turbine='50x Shanghai Electric SWT-4.0-146'),
    fix('CHN', 'Longyuan Rudong Intertidal 150 MW Demo', C,
        '南通海洋水建：一期 100 MW 選用 17 台華銳 3 MW＋21 台西門子 2.38 MW，2011-06-21 開工、同年底投產；二期 50 MW 為 20 台金風 2.5 MW（2012）。機型欄改為實際組成（共 58 台），年份 2012 維持，加分期。',
        'Nantong Ocean & Coastal Engineering: Phase 1 (100 MW) used 17 Sinovel 3 MW and 21 Siemens 2.38 MW turbines, started 21 Jun 2011 and commissioned that year-end; Phase 2 (50 MW) used 20 Goldwind 2.5 MW (2012). Set the turbine field to the actual mix (58 units), keep 2012 and add the phases.',
        'http://www.ntoc-china.com/?m=home&c=View&a=index&aid=354', turbine='17x Sinovel 3 MW + 21x Siemens 2.38 MW + 20x Goldwind 2.5 MW', ph=[[2011, 100], [2012, 50]]),
    fix('CHN', 'SinoHydro Rudong Intertidal', C,
        '風能產業網 2014-06-05：中國電建集團所屬水電新能源公司投資的如東凌洋外灘潮間帶風電場 100 MW，由 10 台 2 MW＋32 台 2.5 MW 組成，2014-05-25 首批併網；紅網 2022-12 稱 2016 年正式投產。機型改為 10×2 MW＋32×2.5 MW、業主補中國電建水電新能源；年份 2016 維持。',
        "CWEEA (2014-06-05): the 100 MW Rudong Lingyang intertidal farm, invested by PowerChina's Hydropower New Energy Co, consists of 10 x 2 MW and 32 x 2.5 MW turbines, first grid-connected on 25 May 2014; Rednet (2022-12) says formal commissioning in 2016. Change the turbine field, add the owner, keep 2016.",
        'https://www.cweea.com.cn/xwdt/html/4250.html', turbine='10x 2 MW + 32x 2.5 MW', owner='PowerChina Hydropower New Energy Co (China Power Construction Group)'),
    fix('CHN', 'Tianjin Nangang', C,
        '國資委 2018-06-28（中國電建稿）：天津南港海上風電項目 2018 年 6 月 27 日按期併網，一期首批安裝 18 台 5 MW、90 MW，由中國電建集團所屬新能源公司投資。資料庫年份 2021 改 2018，機型「Sewind 6 MW」改為 18×5 MW。',
        "SASAC (2018-06-28, PowerChina release): the Tianjin Nangang offshore project was grid-connected on 27 Jun 2018, Phase 1 installing 18 x 5 MW (90 MW), invested by PowerChina's new-energy subsidiary. Change the year from 2021 to 2018 and the turbine field from 'Sewind 6 MW' to 18 x 5 MW.",
        'http://www.sasac.gov.cn/n2588025/n2588124/c9178300/content.html', year=2018, turbine='18x 5 MW'),
    fix('CHN', 'Jiangsu Xiangshui C1 Offshore wind farm', G,
        '鹽城市海洋與漁業局 2014-11-27 聽證公告：三峽響水試驗風機項目在陳港鎮沿海灘塗共 5 台、總裝機 12.5 MW（非 12）；三峽集團回顧（新浪 2026）稱 5 台潮間帶試驗機組於 2011 年安裝，2014 年聽證為補辦海域手續，故年份改 2011。',
        "Yancheng ocean bureau hearing notice (2014-11-27): the CTG Xiangshui test project has 5 turbines totalling 12.5 MW (not 12) on the Chengang tidal flats; CTG's own retrospective (Sina, 2026) says the 5 intertidal test turbines were installed in 2011, the 2014 hearing being a later sea-use formality, so the year is set to 2011.",
        'http://www.yancheng.gov.cn/art/2014/11/27/art_13184_1456250.html', mw=12.5, year=2011),
    fix('VNM', 'Cà Mau wind farm', G,
        '國資委／走出去導航網（2023-04-13）：越南金甌 1 號風電項目總裝機 350 MW（非 352），分 A、B、C、D 四個風場，業主越南建設貿易股份公司（WTO），選用明陽 MySE5.0-166 海上風機，中國電建 2023 年 4 月完工。',
        'SASAC and goalfore.cn (2023-04-13): the Ca Mau 1 project totals 350 MW (not 352) in four areas A-D, owner Vietnam Trading Construction Works Organization (WTO), using Mingyang MySE5.0-166 turbines; PowerChina completed it in April 2023.',
        'http://www.sasac.gov.cn/n2588025/n2588124/c19372635/content.html', mw=350, turbine='Mingyang MySE5.0-166'),
    fix('VNM', 'Bac Lieu Phase 3', C,
        '薄寮三期尚未完工：Mekong ASEAN 2025-04-24 報導 2025 年 4 月才恢復安裝首台機組，容量 141 MW、47 座金風 3 MW 無齒輪箱機組，2025 年內預計僅安裝 99 MW；越通社 2026-03-18 報導 47 座中完成 33 座，目標 2026 年第二季送電運轉，故改為興建中、預計 2026 年。',
        'Bac Lieu phase 3 is not finished: Mekong ASEAN (2025-04-24) reported the first turbine was only installed in April 2025 after a stoppage, 141 MW with 47 Goldwind 3 MW gearless turbines and only 99 MW planned for 2025; VietnamPlus (2026-03-18) reports 33 of 47 turbines completed and a target of energisation in Q2 2026, so status is under construction, expected 2026.',
        'https://mekongasean.vn/tiep-tuc-trien-khai-lap-dat-nha-may-dien-gio-bac-lieu-giai-doan-3-40791.html', st=1, year=2026, mw=141, turbine='47x Goldwind 3 MW'),
    fix('VNM', 'Soc Trang 1 Phase 1 (Cong Ly)', C,
        '越通社 2018-01-30 開工報導：朔莊公理風電廠由 Công ty Cổ phần Super Wind Energy Công Lý Sóc Trăng 投資（業主），一期 15 座、每座 2 MW、共 30 MW。',
        'VietnamPlus (2018-01-30 groundbreaking): the Cong Ly Soc Trang wind plant is invested by Super Wind Energy Cong Ly Soc Trang JSC, phase 1 having 15 turbines of 2 MW each (30 MW).',
        'https://www.vietnamplus.vn/khoi-cong-xay-dung-nha-may-dien-gio-dau-tien-tai-soc-trang-post486569.vnp', owner='Super Wind Energy Cong Ly Soc Trang JSC', turbine='15x 2 MW'),
    fix('VNM', 'V1-3 Ben Tre (BTRE)', C,
        '越南能源雜誌 2021-11-29 落成報導：檳椥 V1-3 風電廠由 Công ty cổ phần Năng lượng tái tạo Bến Tre（檳椥再生能源股份公司）投資，7 座 Vestas 4.2 MW 機組。',
        'Nang Luong Viet Nam (2021-11-29 inauguration): the V1-3 Ben Tre plant is invested by Ben Tre Renewable Energy JSC and has 7 Vestas 4.2 MW turbines.',
        'https://nangluongvietnam.vn/khanh-thanh-nha-may-dien-gio-v1-3-ben-tre-27881.html', owner='Ben Tre Renewable Energy JSC', turbine='7x Vestas 4.2 MW'),
    fix('VNM', 'Bac Lieu Phase 1', C,
        '越南維基（引投資報、青年報）：薄寮風電廠三期皆由 Công ty TNHH Xây dựng - Thương mại và Du lịch Công Lý（公理建設貿易旅遊公司）投資，與資料庫二期業主相同；一期 10 座、16 MW 於 2012 年 10 月裝完。',
        'Vietnamese Wikipedia (citing Dau Tu and Thanh Nien): all phases of the Bac Lieu plant are invested by Cong Ly Construction - Trading - Tourism Co Ltd, the same owner the database lists for phase 2; phase 1 (10 turbines, 16 MW) was installed by October 2012.',
        'https://vi.wikipedia.org/wiki/Nh%C3%A0_m%C3%A1y_%C4%91i%E1%BB%87n_gi%C3%B3_B%E1%BA%A1c_Li%C3%AAu', owner='Cong Ly Construction - Trading - Tourism Co Ltd [100%]'),
    fix('CHN', 'CTG Yangjiang Shapa Phase 4', C,
        '中新網四川 2024-09-10：三峽新能源陽江陽西沙扒四期項目現場，東方電氣研製供貨的 43 台 7 MW 海上風機在颱風「摩羯」期間正常運轉（43×7 ≈ 300 MW），機型非明陽 6.45 MW。',
        "China News Sichuan (2024-09-10): at CTG's Yangxi Shapa phase 4 site, the 43 Dongfang Electric 7 MW offshore turbines ran normally through typhoon Yagi (43 x 7 = about 300 MW); the turbines are not Mingyang 6.45 MW.",
        'https://www.sc.chinanews.com.cn/cjbd/2024-09-10/215587.html', turbine='43x Dongfang 7 MW'),
    fix('CHN', 'CTG Yangjiang Shapa Phase 5', C,
        '沙扒五期是 300 MW（47 部明陽 MySE6.45-180，303.15 MW）：陽江市發改局 2020-04-30 核准變更公示、廣東省生態環境廳粵環審〔2020〕85 號、明陽中標公告（三期 I 標＋五期共 78 部、50 萬千瓦）'
        '與三峽能源上市公告書都寫 300MW；本站原本的 400 MW 就是五期加總比三峽「全案 170 萬千瓦、269 部」多出約 100 MW 的原因',
        'Shapa phase 5 is 300 MW (47 Mingyang MySE6.45-180, 303.15 MW): the Yangjiang DRC approval-change notice (30 Apr 2020), the Guangdong ecology department’s EIA approval '
        '粤环审〔2020〕85号, Mingyang’s award notice (phase 3 lot I plus phase 5: 78 units, 500 MW) and CTG New Energy’s listing announcement all give 300 MW; the site’s 400 MW '
        'is why the five phases added up to about 100 MW more than CTG’s 1.7 GW and 269 turbines',
        'http://www.yangjiang.gov.cn/yjfgw/gkmlpt/content/0/453/post_453906.html', mw=300, turbine='47x Mingyang MySE6.45-180'),
    fix('CHN', 'Datang Zhuanghe II', C,
        '莊河海上風電場址 II（300 MW）業主為華能遼寧清潔能源有限責任公司（2019 年核准時為中船重工，世紀新能源網轉中國電力新聞網 2020-09-14），安裝 60 台海裝 H171-5.0MW（大連天健網 2019-06-26），非大唐、非金風；國資委報導其與 IV1 場址同於 2021 年底全容量並網。',
        'Zhuanghe offshore site II (300 MW) is owned by Huaneng Liaoning Clean Energy (originally approved under CSIC in 2019; ne21 via China Electric Power News 2020-09-14) with 60 CSIC Haizhuang H171-5.0MW turbines (Dalian Tianjian 2019-06-26), not Datang or Goldwind; SASAC reports it reached full capacity together with site IV1 at the end of 2021.',
        'https://www.ne21.com/news/show-135438.html', owner='Huaneng Liaoning Clean Energy Co Ltd [100%]', turbine='60x CSIC Haizhuang H171-5.0MW', rename='Huaneng Zhuanghe II', zhname='華能莊河II'),
    fix('CHN', 'CTG Dafeng H8-2', C,
        '中新網 2021-12-30：三峽能源江蘇大豐 30 萬千瓦 H8-2 海上風電項目於 2021-12-23 成功全容量並網發電，年份應為 2021 而非 2022。',
        "China News (2021-12-30): CTG's 300 MW Jiangsu Dafeng H8-2 offshore project reached full-capacity grid connection on 23 December 2021, so the year is 2021, not 2022.",
        'https://www.chinanews.com.cn/cj/2021/12-30/9640759.shtml', year=2021),
    fix('CHN', 'SPIC Peninsula South V', C,
        '世紀新能源網轉中國發展網 2023-02-16：國家電投山東半島南 V 場址總裝機 500 MW（非 300），70 台 7 MW＋1 台 10 MW，由國家電投山東分公司投資建設，2022-05-20 開工、2022-12-09 全容量並網（當年開工當年全容量），年份應為 2022。',
        "ne21 via China Development Net (2023-02-16): SPIC Shandong Peninsula South site V totals 500 MW (not 300) with 70 x 7 MW plus 1 x 10 MW turbines, built by SPIC's Shandong branch; construction started 2022-05-20 and full-capacity grid connection came on 2022-12-09, so the year is 2022.",
        'https://www.ne21.com/news/show-176154.html', mw=500, year=2022, turbine='70x 7 MW + 1x 10 MW', owner='SPIC Shandong Branch'),
    fix('CHN', 'Zhejiang Jiaxing 2 Offshore wind farm', G,
        '華能嘉興2號300MW、50台6.0MW；標段I風機2021-08-11全部安裝完成（中國海洋工程諮詢協會海上風電分會），新浪財經2022-05-18稱嘉興2號於2021年11月投產，資料庫年份2021正確，只補機型。',
        'Huaneng Jiaxing 2 is 300 MW with 50 x 6.0 MW turbines; lot I turbines were all installed on 11 Aug 2021 (China offshore wind association) and Sina Finance (18 May 2022) says Jiaxing 2 was commissioned in November 2021, so the database year 2021 is right; only the turbine field is added.',
        'https://www.chinaoffshorewind.cn/html/news/affairs/2021/0813/188.html', turbine='50x 6.0 MW'),
    fix('CHN', 'Zhejiang Taizhou 1 Offshore wind farm', G,
        '浙能台州1號300MW、40台7.5MW（CPEM 2023-09）；浙能集團2023年度報告寫「台州1号海上风电项目实现全容量并网发电」，故年份應為2023而非2024。與「CGN Taizhou 1」是否重複無法證實：中廣核2020年浙江在建項目只有岱山4#、嵊泗5#/6#，查無中廣核台州項目。',
        "Zheneng Taizhou 1 is 300 MW with 40 x 7.5 MW turbines (CPEM, Sep 2023); Zhejiang Energy Group's 2023 annual report states the Taizhou 1 project reached full-capacity grid connection, so the year should be 2023 rather than 2024. A duplicate with 'CGN Taizhou 1' cannot be confirmed: CGN's Zhejiang projects under construction in 2020 were only Daishan 4 and Shengsi 5/6, and no CGN Taizhou project was found.",
        'https://www.zjenergy.com.cn/ZNWW/contents/1423/23897.html', year=2023, turbine='40x 7.5 MW'),
    fix('CHN', 'Jiangsu Rudong H5 (Yunshan) Offshore wind farm', G,
        '如東H5為75台4MW、300MW（世紀新能源網2020-05），機組為電氣風電（上海電氣），2021-08全部吊裝（世紀新能源網2021-08-12）；資料庫業主江蘇交通控股（苏交控）已正確，只補機型。',
        'Rudong H5 is 300 MW with 75 x 4 MW turbines (ne21, May 2020) supplied by Shanghai Electric Wind Power, all installed by August 2021 (ne21, 12 Aug 2021); the database owner Jiangsu Transportation Holding is already correct, so only the turbine field is added.',
        'https://www.ne21.com/news/show-164967.html', turbine='75x Shanghai Electric 4.0 MW'),
    fix('CHN', 'Huaneng Rudong', C,
        '如東八仙角300MW、70台（4MW、4.2MW、5MW三種機型、3個廠家），2017-09全部併網；其中20台為中國海裝5MW（19台H151-5MW＋1台H171-5MW），由華能江蘇清潔能源分公司投資建設（中國能源網2019-03、中國電力網2021-03、中國能源報2019-05）。資料庫「70x Sewind/Siemens 4.0-4.3 MW」有誤。',
        "Rudong Baxianjiao is 300 MW with 70 turbines of 4, 4.2 and 5 MW from three makers, all grid-connected by September 2017; 20 of them are CSIC Haizhuang 5 MW (19 x H151-5MW and 1 x H171-5MW) and the investor is Huaneng Jiangsu Clean Energy Branch (china5e Mar 2019, chinapower Mar 2021, China Energy News May 2019). The database's '70x Sewind/Siemens 4.0-4.3 MW' is wrong.",
        'https://www.china5e.com/news/news-1053335-1.html', turbine='70 units of 4/4.2/5 MW from three makers, incl. 20x CSIC Haizhuang 5 MW (19x H151 + 1x H171)', owner='Huaneng Jiangsu Clean Energy Branch'),
    fix('CHN', 'CTG Yangjiang Shapa Phase 1', C,
        '三峽陽西沙扒一期30萬千瓦：2019-11-19首批風機併網，2021-06-08全容量併網；投資主體為三峽新能源陽江發電有限公司（三峽珠江發電100%持股）（搜狐投資分析2024）；陽西縣政府2021-07-26證實55台5.5MW已全部投運。資料庫年份2019應改為2021，業主補上。',
        'CTG Yangxi Shapa Phase 1 (300 MW): first turbines grid-connected 19 Nov 2019, full capacity on 8 Jun 2021; the investor is CTG Yangjiang Power Generation Co Ltd, wholly owned by CTG Pearl River Power (Sohu project analysis, 2024), and Yangxi county (26 Jul 2021) confirms all 55 x 5.5 MW turbines in operation. Change the year from 2019 to 2021 and add the owner.',
        'https://www.sohu.com/a/789824114_121779604', year=2021, owner='CTG Yangjiang Power Generation Co Ltd (China Three Gorges New Energy)'),
    fix('CHN', 'Tangshan Laoting Putidao', C,
        '唐山樂亭菩提島300MW為75台4MW，開工時擬裝西門子SWT-4.0-130（中國電器工業協會2017-05），中交三航局安裝75台4.0MW風機（百家號2023）；項目名為「河北建投唐山乐亭菩提岛海上风电场300mw示范项目」（中國風能設備協會網）。資料庫機型「Goldwind/Envision 4-5 MW」有誤，業主應為河北建投海上風電有限公司。',
        "Tangshan Laoting Putidao (300 MW) has 75 x 4 MW turbines, planned as Siemens SWT-4.0-130 at groundbreaking (CEEIA, May 2017) and installed as 75 x 4.0 MW by CCCC Third Harbour (Baijiahao, 2023); the project is titled 'HECIC Tangshan Laoting Putidao 300 MW demonstration offshore wind farm' (CWEEA). The database turbine 'Goldwind/Envision 4-5 MW' is wrong and the owner should be HECIC Offshore Wind Power Co Ltd.",
        'https://www.ceeia.com/XWZX/d/201705/69430.html', turbine='75x Siemens SWT-4.0-130', owner='HECIC Offshore Wind Power Co Ltd (Hebei Construction & Investment Group)'),
    fix('CHN', 'CTG Jiangsu Dafeng 300 MW', C,
        '三峽新能源江蘇大豐300MW：73台風機，2019-10-31全部機組併網、全容量達產，首次批量應用6.45MW國產海上風機（三峽新能源澎湃號2019-11-15）。資料庫業主「Huaneng Jiangsu Clean Energy」與年份2020有誤。',
        "CTG New Energy Jiangsu Dafeng 300 MW: 73 turbines, all grid-connected at full capacity on 31 Oct 2019, the first batch use of 6.45 MW domestic offshore turbines (CTG New Energy on The Paper, 15 Nov 2019). The database owner 'Huaneng Jiangsu Clean Energy' and year 2020 are wrong.",
        'https://www.thepaper.cn/newsDetail_forward_4965158', year=2019, owner='China Three Gorges New Energy (Group) Co Ltd', turbine='73 units incl. 6.45 MW class'),
    fix('CHN', 'Huaneng Dalian Zhuanghe III', C,
        '莊河Ⅲ（300MW）是三峽新能源的風場：新華社2020-11-27報導「三峡新能源大连庄河Ⅲ海上风电场近日实现全容量并网」，2017-03開工，為東北首座海上風場。華能在莊河的是Ⅱ（300MW）與Ⅳ1（350MW）（華東院）。資料庫無另一筆三峽莊河Ⅲ，故改名與改業主而非刪除；年份2020正確。',
        "Zhuanghe III (300 MW) belongs to CTG New Energy: Xinhua (27 Nov 2020) reported that 'CTG New Energy Dalian Zhuanghe III offshore wind farm recently reached full-capacity grid connection', construction having started in March 2017, the first offshore farm in north-east China. Huaneng's Zhuanghe farms are II (300 MW) and IV-1 (350 MW) (HDEC). The database has no separate CTG Zhuanghe III record, so rename and change the owner rather than delete; the year 2020 is right.",
        'https://www.cs.com.cn/xwzx/hg/202011/t20201127_6115516.html', rename='CTG Dalian Zhuanghe III', zhname='三峽大連莊河III', owner='China Three Gorges New Energy (Group) Co Ltd', year=2020),
    fix('CHN', 'Huaneng Rudong H3', C,
        '華能盛東如東H3總裝機400MW、80台中國海裝5MW海上風機，2021-06-29完成全場吊裝（中國海裝官網2021-07-16；世紀新能源網2021-07-15）。資料庫300MW／Goldwind-Mingyang 5.5-6.45MW有誤。',
        "Huaneng Shengdong Rudong H3 is 400 MW with 80 CSIC Haizhuang 5 MW offshore turbines, all installed by 29 Jun 2021 (CSIC Haizhuang website, 16 Jul 2021; ne21, 15 Jul 2021). The database's 300 MW and 'Goldwind/Mingyang 5.5-6.45 MW' are wrong.",
        'http://www.hzwindpower.com/zongbuxinwen/20210716151715.html', mw=400, turbine='80x CSIC Haizhuang 5 MW'),
    fix('CHN', 'Huaneng Qidong H3', C,
        '啟東H3為江蘇華威風力發電有限公司的啟東H1/H2/H3（802MW、134台）之一：華威2020-02與華東院簽H1 250MW、H2 250MW、H3 300MW EPC合同（世紀新能源網2020-03-11）；H3標段50台6種機型、300MW（人民網江蘇2021-10-30）；全項目2021-12-25全容量併網（新華網）。業主不是華能，資料庫業主「Qidong Huaerrui」與名稱應改。',
        "Qidong H3 is one of Jiangsu Huawei Windpower's Qidong H1/H2/H3 projects (802 MW, 134 turbines): Huawei signed EPC contracts with HDEC in Feb 2020 for H1 250 MW, H2 250 MW and H3 300 MW (ne21, 11 Mar 2020); the H3 lot has 50 turbines of 6 models totalling 300 MW (People's Daily Jiangsu, 30 Oct 2021); the whole project reached full capacity on 25 Dec 2021 (Xinhua). The owner is not Huaneng, so the name and owner 'Qidong Huaerrui' should be changed.",
        'https://www.ne21.com/news/show-133715.html', rename='Jiangsu Qidong H3 (Huawei)', zhname='江蘇華威啟東H3', owner='Jiangsu Huawei Windpower Co Ltd', turbine='50 units, 6 models, 300 MW'),
    fix('CHN', 'Longyuan Sheyang H2', C,
        '龍源射陽H2採用遠景EN-148/4.5MW機組（新浪財經轉中國風電新聞網2025-02-07），2021-04-12全容量併網（射陽新聞網）；資料庫「Goldwind 6.45 MW」有誤。67台之數未能在可核對原文中證實，機型欄不寫台數。',
        "Longyuan Sheyang H2 uses Envision EN-148/4.5 MW turbines (Sina Finance reprint of China Wind Power News, 7 Feb 2025) and reached full capacity on 12 Apr 2021 (Sheyang News); the database's 'Goldwind 6.45 MW' is wrong. The 67-unit count could not be confirmed in checkable text, so no count is given.",
        'https://finance.sina.com.cn/roll/2025-02-07/doc-ineiqkks1306604.shtml', turbine='Envision EN-148/4.5 MW'),
    fix('CHN', 'Datang Danzhou CZ3', C,
        '這筆只算儋州 120 萬瓩案的一場址：60 部 10 MW（600 MW，主機全部產自洋浦海上風電產業園），大唐稱 2024 年底併網發電、2026 年的產業報導寫 2025 年第一季併網發電，'
        '2025 年 6 月 30 日通過海洋環保竣工驗收；二場址（60 萬瓩，明陽 10 MW）2025 年 12 月 16 日才開工、2026 年 10 月仍在海上施工，改由「Datang Danzhou CZ3 (site 2)」'
        '一筆表示（原本把二場址算成 2026 年營運中，機型欄也寫成兩場址都是東方電氣）。座標改到儋州西北外海（GEM 概略位置；場址離岸約 34 公里），原座標在昌江縣海岸附近，偏西南約 75 公里',
        'This record now covers only site 1 of the 1,200 MW Danzhou project: 60 × 10 MW (600 MW; all nacelles made at the Yangpu offshore wind industrial park). Datang says '
        'it was connected at the end of 2024 and a 2026 trade report says in Q1 2025; it passed its marine-environment completion acceptance on 30 June 2025. Site 2 (600 MW, Mingyang 10 MW) only broke ground '
        'on 16 December 2025 and was still under offshore construction in October 2026; it is the separate record “Datang Danzhou CZ3 (site 2)” (this row counted it as '
        'operating from 2026, and its turbine field gave Dongfang units for both sites). Point moved to the site north-west of Danzhou, about 34 km offshore (GEM, approximate); '
        'the old one was near the Changjiang county coast, about 75 km to the south-west',
        'https://m.sohu.com/a/1040969549_121194771', rename='Datang Danzhou CZ3 (site 1)', zhname='大唐儋州CZ3（一場址）', mw=600,
        turbine='60x 10 MW', lat=20.101, lon=109.143, approx=True, note=True),
    fix('CHN', 'Huaneng Peninsula North BW', C,
        '半島北 BW 的機組是 60 部 8.5 MW（大眾新聞 2024 年 9 月；原寫「金風 8–12 MW」，混入半島北 L 場址的 42 部 12 MW）',
        'Peninsula North BW uses 60 × 8.5 MW turbines (Dazhong News, September 2024); the row said “Goldwind 8–12 MW”, mixing in the 42 × 12 MW units of the Peninsula North L site',
        'https://m.dzplus.dzng.com/share/general/0/NEWS1723611XKUKXREOUNYBW', turbine='60x 8.5 MW'),
    # ------------------------------------------------ 2026-10-03 尺寸補查時發現的機型欄錯誤（出處原文已以 check_quotes 核對）
    fix('CHN', 'Guohua Dongtai IV (H2)', C,
        '東台四期是 63 部上海電氣 SWT-4.0-130（一期）加 12 部遠景 EN136-4.2（二期），不是 75 部金風 GW154-4.0（Power Technology 專案頁）',
        'Dongtai IV is 63 Shanghai Electric SWT-4.0-130 (phase I) plus 12 Envision EN136-4.2 (phase II), not 75 Goldwind GW154-4.0 (Power Technology project profile)',
        'https://www.power-technology.com/data-insights/power-plant-profile-dongtai-iv-china/', turbine='63x Shanghai Electric SWT-4.0-130 + 12x Envision EN136-4.2'),
    fix('CHN', 'Huaneng Dafeng', C,
        '華能大豐一期是 48 部遠景 EN136-4.2 加 20 部中國海裝 H151-5.0，業主為華能新能源（持股 100%）；原寫 75 部金風 4 MW、業主國家電投江蘇（Power Technology 專案頁）',
        'Huaneng Dafeng phase I is 48 Envision EN136-4.2 plus 20 CSSC Haizhuang H151-5.0, owned 100% by Huaneng Renewables; the row said 75 Goldwind 4 MW and SPIC Jiangsu (Power Technology project profile)',
        'https://power-technology.com/marketdata/huaneng-dafeng-phase-i-offshore-wind-farm-china',
        turbine='48x Envision EN136-4.2 + 20x CSSC Haizhuang H151-5.0', owner='Huaneng Renewables [100%]'),
    fix('CHN', 'Huaneng Sheyang H1 / Yancheng', C,
        '射陽南區 H1 是 67 部遠景 EN148-4.5，不是「6–8 MW 級」（Power Technology 專案頁）',
        'Sheyang South H1 has 67 Envision EN148-4.5 turbines, not a “6–8 MW class” (Power Technology project profile)',
        'https://www.power-technology.com/data-insights/power-plant-profile-sheyang-south-area-h1-wind-farm-china/', turbine='67x Envision EN148-4.5'),
    fix('CHN', 'Longyuan Dafeng H3 (Huaneng Dafeng)', C,
        '大豐 H3 是國家電投（原中電投）的風場，72 部遠景 EN136-4.2；舊名稱裡的「龍源」「華能大豐」都不對（Power Technology 專案頁）',
        'Dafeng H3 is SPIC’s farm (developed by China Power Investment), with 72 Envision EN136-4.2 turbines; neither “Longyuan” nor “Huaneng Dafeng” in the old name is right (Power Technology project profile)',
        'https://www.power-technology.com/marketdata/spic-jigansu-dafeng-h3-offshore-wind-farm-china/', rename='SPIC Dafeng H3', zhname='國家電投大豐H3',
        owner='State Power Investment Corp (SPIC)', turbine='72x Envision EN136-4.2'),
    fix('VNM', 'Hoa Binh 1 Phase 1', C,
        '和平 1 號一期是 13 部 Vestas V150-4.2，不是金風（offshoreWIND.biz 2020-01）',
        'Hoa Binh 1 phase 1 uses 13 Vestas V150-4.2, not Goldwind (offshoreWIND.biz, Jan 2020)',
        'https://www.offshorewind.biz/2020/01/02/vestas-secures-third-intertidal-turbine-order-in-vietnam/', turbine='13x Vestas V150-4.2'),
    fix('VNM', 'Hoa Binh 1 Phase 2', C,
        '和平 1 號二期同樣是 13 部 Vestas V150-4.2，不是金風（Vestas 新聞稿 2020）',
        'Hoa Binh 1 phase 2 also uses 13 Vestas V150-4.2, not Goldwind (Vestas press release, 2020)',
        'https://www.vestas.com/en/media/company-news/2020/vestas-surpasses-1-gw-of-order-intake-in-vietnam--winni-c3167101', turbine='13x Vestas V150-4.2'),
    fix('VNM', 'Hoa Binh 2', C,
        '和平 1、2 號合計 39 部 Vestas V150 4.2 MW（吊裝商明煌），不是金風',
        'Hoa Binh 1 and 2 together have 39 Vestas V150 4.2 MW turbines (crane contractor Minh Hoang), not Goldwind',
        'https://minhhoangcrane.com.vn/project/dien-gio-hoa-binh/', turbine='Vestas V150-4.2'),
    fix('VNM', 'Tan Thuan (PECC2) Phase 1+2', C,
        '新順風場 75 MW、海上 18 座，用西門子歌美颯 SG 5.0-145，不是遠景 4.2 MW（西門子歌美颯新聞稿 2020-07；投資報落成報導）',
        'Tan Thuan (75 MW, 18 turbines at sea) uses Siemens Gamesa SG 5.0-145, not Envision 4.2 MW (Siemens Gamesa press release, July 2020; Bao Dau Tu inauguration report)',
        'https://www.siemensgamesa.com/global/en/home/press-releases/200715-siemens-gamesa-press-release-vietnam-nearshore-project.html', turbine='18x Siemens Gamesa SG 5.0-145'),
    fix('VNM', 'V1-2 Truong Long Hoa (Tra Vinh)', C,
        '茶榮 V1-2 是 12 部金風 GW155-4.5，不是遠景（offshoreWIND.biz 2021-09）',
        'Tra Vinh V1-2 has 12 Goldwind GW155-4.5 turbines, not Envision (offshoreWIND.biz, Sep 2021)',
        'https://www.offshorewind.biz/2021/09/01/all-wind-turbines-up-at-tra-vinh-v1-2-nearshore-wind-farm/', turbine='12x Goldwind GW155-4.5'),
    fix('VNM', 'V1-3 Truong Long Hoa 48 MW (REE, Tra Vinh No.3)', C,
        '茶榮 V1-3 是 12 部 Vestas V150-4.2（以 4.0 MW 運轉），不是西門子歌美颯（offshoreWIND.biz 2020-06）',
        'Tra Vinh V1-3 has 12 Vestas V150-4.2 turbines run in 4.0 MW mode, not Siemens Gamesa (offshoreWIND.biz, June 2020)',
        'https://www.offshorewind.biz/2020/06/17/vestas-wins-another-epc-intertidal-contract-in-vietnam/', turbine='12x Vestas V150-4.2 (4.0 MW mode)'),
    fix('VNM', 'Dong Hai 1 Phase 1 (Tra Vinh, Trungnam)', C,
        '茶榮東海 1 號是 25 部西門子歌美颯 SG 5.0-145（每部以 4 MW 運轉），不是 SG 4.0-145（offshoreWIND.biz 2021-02；中南集團專案頁）',
        'Tra Vinh Dong Hai 1 has 25 Siemens Gamesa SG 5.0-145 turbines rated at 4 MW each, not SG 4.0-145 (offshoreWIND.biz, Feb 2021; Trungnam project page)',
        'https://www.offshorewind.biz/2021/02/03/siemens-gamesa-lands-its-largest-nearshore-project-in-vietnam/', turbine='25x Siemens Gamesa SG 5.0-145 (4 MW rating)'),
    fix('VNM', 'Thanh Hải No. 5 Offshore wind farm', G,
        '成海全案 28 部（EVN），其中第 1、2 期為西門子歌美颯 SG 4.5-145（Power Technology）；其餘各期的機型查不到',
        'Thanh Hai has 28 turbines in all (EVN); phases 1 and 2 use Siemens Gamesa SG 4.5-145 (Power Technology); the model of the other phases is not found',
        'https://www.power-technology.com/data-insights/power-plant-profile-thanh-hai-offshore-wind-farm-vietnam/', turbine='28 turbines; phases 1–2 Siemens Gamesa SG 4.5-145'),
    # ------------------------------------------------ 2026-10-03 補回被誤併的 GEM 風場（列在 GEM_KEEP；出處原文已以 check_quotes 核對）
    fix('CHN', 'Fujian Pingtan Waihai Offshore wind farm', G,
        '三峽平潭外海：111 MW、11 部 8–16 MW 試驗機組（4×8、5×10、1×13、1×16 MW），2023 年 9 月建成投產，建設單位平潭海峽發電；座標改用福建省海域使用核准的 11 個機位中心（GEM 點位為概略位置）',
        'CTG Pingtan Waihai: 111 MW, eleven 8–16 MW test turbines (4×8, 5×10, 1×13, 1×16 MW), in service September 2023, built by Pingtan Haixia Power; coordinates moved to the centre of the 11 turbine positions in Fujian’s sea-use approval (GEM’s point is approximate)',
        'http://zrzyt.fj.gov.cn/zwgk/gsgg/202404/P020240429531356048270.pdf', rename='CTG Pingtan Waihai', zhname='三峽平潭外海', mw=111, year=2023,
        lat=25.73, lon=119.972, turbine='11 test turbines: 4x 8 MW, 5x 10 MW, 1x Dongfang 13 MW, 1x Goldwind 16 MW',
        owner='Pingtan Haixia Power Generation Co Ltd (China Three Gorges)'),
    fix('CHN', 'Jiangsu Rudong H13 (Xiexin) Offshore wind farm', G,
        '協鑫如東 H13：裝機 15 萬瓩、30 部海裝 5 MW，2021 年 11 月 29 日全容量併網（GEM 寫 152 MW）',
        'GCL Rudong H13: 150 MW, 30 Haizhuang 5 MW turbines, fully connected on 29 November 2021 (GEM says 152 MW)',
        'https://www.163.com/dy/article/GQ0GC2VI05345ASA.html', rename='Xiexin (GCL) Rudong H13', zhname='協鑫如東H13', mw=150, year=2021,
        turbine='30x CSSC Haizhuang H171-5.0'),
    # ------------------------------------------------ 2026-10-03 補回被誤併的陸域風場（列在 GEM_KEEP；出處原文已以 check_quotes 核對）
    fix('KOR', 'YEP wind farm', G,
        '韓華建設的英陽風場 76 MW、22 部 3.45 MW 級，2020 年完工（易投資日報 2021 年 1 月：「去年完工」）；GEM 寫 2017 年',
        'Hanwha’s Yeongyang farm: 76 MW, 22 turbines of the 3.45 MW class, finished in 2020 (eToday, January 2021: “completed last year”); GEM says 2017',
        'https://www.etoday.co.kr/news/view/1988572', rename='Yeongyang (Hanwha)', zhname='英陽風場（韓華）', year=2020, turbine='22x 3.45 MW class'),
    fix('KOR', 'Yeongyang 2nd wind power generation', G,
        '英陽第二風場 42 MW、10 部 4.2 MW 級，2023 年 5 月起商業運轉（GEM 寫 2022 年，那是試運轉）',
        'Yeongyang No. 2: 42 MW, 10 turbines of the 4.2 MW class, in commercial operation from May 2023 (GEM’s 2022 is the test run)',
        'https://www.fnnews.com/news/202309241852426048', zhname='英陽第二風場', year=2023, turbine='10x 4.2 MW class'),
    # ------------------------------------------------ 2026-10-03 尺寸第三輪查到的資料疑點（出處原文已以 check_quotes 核對）
    dup('CHN', 'Guohua Rudong H14', C, ('Jiangsu Rudong H14 (Guangheng) Offshore wind farm', G),
        '如東 H14 是魯能新能源的 200 MW 風場（50 部 4 MW，南通發布 2020-08），GEM 已有這筆；精選的「國華如東 H14」300 MW、金風 6.45 MW 是錯置，查無國華在如東 H14 的風場',
        'Rudong H14 is Luneng New Energy’s 200 MW farm (50 × 4 MW; Nantong Fabu, Aug 2020), already in GEM; the curated “Guohua Rudong H14” (300 MW, Goldwind 6.45 MW) is misplaced and no Guohua farm at Rudong H14 exists',
        'https://news.96189.com/w/2008/ebbbbcec80b94ed8a6b9441a968e997c.html'),
    dup('CHN', 'CGN Jiaxing 2 (Zhoushan Daishan 4)', C, ('Zhejiang Daishan 4 Offshore wind farm', G),
        '中廣核岱山 4 號是 234 MW、54 部（遠景 4.5 MW 與湘電 4 MW），GEM 已有這筆；精選紀錄的 300 MW、明陽 5.5 MW 與「嘉興 2」名稱都不對（嘉興 2 號是另一座風場）',
        'CGN’s Daishan 4 is 234 MW with 54 turbines (Envision 4.5 MW and XEMC 4 MW), already in GEM; the curated row’s 300 MW, Mingyang 5.5 MW and “Jiaxing 2” name are all wrong (Jiaxing 2 is a different farm)',
        'https://www.power-technology.com/marketdata/daishan-no-4-offshore-wind-farm-china/'),
    fix('CHN', 'Zhejiang Daishan 4 Offshore wind farm', G,
        '機組：36 部遠景 EN148-4.5（一期 32＋4）與 18 部湘電 XE140-4.0（Power Technology）',
        'Turbines: 36 Envision EN148-4.5 (32 + 4) and 18 XEMC XE140-4.0 (Power Technology)',
        'https://www.power-technology.com/marketdata/daishan-no-4-offshore-wind-farm-china/', zhname='中廣核岱山4號', turbine='36x Envision EN148-4.5 + 18x XEMC XE140-4.0'),
    fix('CHN', 'CGN Rudong H8', C,
        '中廣核如東 H8 是 40 部中國海裝 H171-5.0 加 25 部上海電氣 SWT-4.0-146，不是明陽 5.5 MW（Power Technology 專案頁）',
        'CGN Rudong H8 has 40 CSSC Haizhuang H171-5.0 plus 25 Shanghai Electric SWT-4.0-146 turbines, not Mingyang 5.5 MW (Power Technology project profile)',
        'https://www.power-technology.com/marketdata/power-plant-profile-cgn-jiangsu-rudong-h8-offshore-wind-power-project-china/',
        turbine='40x CSSC Haizhuang H171-5.0 + 25x Shanghai Electric SWT-4.0-146'),
    fix('CHN', 'Guoneng Dafeng H5', C,
        '國能大豐 H5 總裝機 206.4 MW、32 部金風 GW184-6.45（大豐區政府 2024-12）；原寫 200 MW、金風 5–6 MW 級',
        'Guoneng Dafeng H5 is 206.4 MW with 32 Goldwind GW184-6.45 turbines (Dafeng district government, Dec 2024); the row said 200 MW and Goldwind 5–6 MW class',
        'https://www.dafeng.gov.cn/art/2024/12/13/art_45256_4270868.html', mw=206.4, turbine='32x Goldwind GW184-6.45'),
    # ------------------------------------------------ 2026-10-03 尺寸第四輪查到的資料疑點（出處原文已以 check_quotes 核對）
    fix('VNM', 'Tan Phu Dong 1 (Tien Giang, GEC)', C,
        '新富東 1 號是 24 部 Vestas V150-4.2 MW，不是遠景（物流承包商 Infinity Logistics 專案頁）',
        'Tan Phu Dong 1 has 24 Vestas V150-4.2 MW turbines, not Envision (project page of the logistics contractor Infinity Logistics)',
        'https://infinitylog.com.vn/projects/tan-phu-dong-i-offshore-wind-farm-project/', turbine='24x Vestas V150-4.2'),
    # ------------------------------------------------ 2026-10-03 尺寸第五輪查到的資料疑點（出處原文已以 check_quotes 核對）
    fix('CHN', 'Fuqing Haitan Strait', C,
        '竣工海洋環保驗收報告：46 部，海裝 6.2 MW 21 部、5 MW 3 部、明陽 7.0 MW 22 部，總裝機 299.2 MW；原寫金風 6.45–8 MW、300 MW',
        'As-built marine environmental acceptance report: 46 turbines, 21 Haizhuang 6.2 MW, 3 × 5 MW and 22 Mingyang 7.0 MW, 299.2 MW in total; the row said Goldwind 6.45–8 MW and 300 MW',
        'https://www.cti-cert.com/upload/files/202511071148308464.pdf', mw=299.2, turbine='21x CSSC Haizhuang 6.2 MW + 3x 5 MW + 22x Mingyang 7.0 MW'),
    # ------------------------------------------------ 2026-10-03 GEM 2026-02 待查證差異（出處原文已以 check_quotes 核對）
    fix('JPN', 'Kakegawa wind farm', G, '靜岡縣環評：掛川風力發電事業變更為 6 部 2,300 kW 級、13,800 kW（日本風力開發，2020 年運轉）',
        'Shizuoka EIA notice: the Kakegawa wind project was changed to 6 turbines of the 2,300 kW class, 13,800 kW (Japan Wind Development, in operation from 2020)',
        'https://www.pref.shizuoka.jp/kurashikankyo/kankyo/assessetc/1002648/1017974.html', mw=13.8, turbine='6 x 2.3 MW class'),
    drop('TWN', 'Formosa 3 offshore wind farm · 2', G,
        '這是海鼎二（3.1 期獲配 600 MW），Corio 退出後已解約，能源署 2026 年把海峽一、海峽二與海鼎二的解約場址納入 3.3 期擴充容量；GEM 的中文名誤寫為海鼎一',
        'This is Haiding 2 (600 MW in Round 3.1); its contract was terminated after Corio withdrew, and in 2026 the Energy Administration added the terminated sites Haixia 1, Haixia 2 and Haiding 2 to the Round 3.3 expansion capacity; GEM’s Chinese name wrongly says Haiding 1',
        'https://www.cna.com.tw/news/afe/202609300338.aspx'),
    fix('TWN', 'Formosa 3 offshore wind farm · 3', G, '這是海鼎三（Formosa 3 的第三座風場，未在 3.1、3.2 期獲配容量）；GEM 的中文名寫成海鼎一',
        'This is Haiding 3 (the third Formosa 3 site, which received no capacity in Round 3.1 or 3.2); GEM’s Chinese name says Haiding 1',
        'https://www.gem.wiki/Formosa_3_offshore_wind_farm', zhname='海鼎三'),
    fix('TWN', 'Datian Youde Offshore wind farm', G,
        '又德在 3.2 期獲配 700 MW、預計 2029 年併網，開發商是森崴能源（Shinfox）；GEM 的業主 wpd 與「達天」是舊資料（達天 3.1 期只獲配 165 MW、未簽約，2023 年取消）。'
        '2026 年 8 月能源署表示業者未繳足履約保證金、正在簽報解約',
        'Youde was allocated 700 MW in Round 3.2 for 2029, developed by Shinfox; GEM’s owner wpd and the “Datian” half are out of date (Datian got only 165 MW in Round 3.1, '
        'did not sign and was cancelled in 2023). In August 2026 the Energy Administration said the developer had not paid the rest of its performance bond and the termination was being processed',
        'https://news.cts.com.tw/cna/money/202608/202608243070944.html', owner='Shinfox Energy'),
    # 2026-10 時間軸延伸到「2026（最新可得）」時核對的興建中離岸風場（出處原文以 check_quotes.py 核對）
    fix('TWN', 'Hai Long 2 & 3', C,
        'Northland 2026 年第二季報告：73 部已裝 71 部、59 部發電，全案商轉預計 2027 年',
        'Northland\'s Q2 2026 report: 71 of 73 turbines installed and 59 generating; commercial operation of the whole project expected in 2027',
        'https://northlandpower.com/northland-power-reports-second-quarter-2026-results-and-construction-progress-updates/', year=2027),
    fix('TWN', 'Taipower Offshore Phase 2', C,
        '2026 年 6 月經濟部長表示整體進度逾九成、只剩風機安裝，盼年底裝完、2027 年上半年併聯；10 月台電表示已接管船隊安裝風機、目標年底完工',
        'In June 2026 the economy minister said over 90% was done with only turbine installation left, aiming to finish by year-end and connect in H1 2027; in October Taipower said it had taken over the vessels and aims to finish by year-end',
        'https://www.cna.com.tw/news/afe/202606170184.aspx', year=2027),
    # 2026-10-06 時效核對（出處原文以 check_quotes.py 核對）
    fix('TWN', 'Greater Changhua 2b & 4', C,
        '2b（337.1 MW，台電即時資料的「沃南風」）2026-09-18 起列入台電裝置容量（試運轉結束）；4（583 MW，「沃四風」）至 2026-10-06 仍標示註10（試運轉、暫不計入裝置容量），全案尚未全面商轉',
        '2b (337.1 MW, “沃南風” in Taipower’s live data) has been counted in Taipower’s installed capacity since 18 Sep 2026 (trial operation over); 4 (583 MW, “沃四風”) still carried note 10 '
        '(trial operation, not yet counted) on 6 Oct 2026, so the whole project is not yet in full commercial operation',
        'https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json', note=True),
    fix('TWN', 'Greater Changhua 2b & 4', C,
        '沃旭：583 MW 的大彰化西北（4）由沃旭與國泰人壽各持有 50%；原寫沃旭 100%',
        'Ørsted: the 583 MW Greater Changhua 4 is co-owned by Ørsted (50%) and Cathay Life (50%); the record said Ørsted 100%',
        'https://orsted.com/en/media/news/2026/09/orsted-hosts-completion-ceremony-for-920-mw-greate-15125521', owner='Ørsted [2b 100%, 4 50%]; Cathay Life Insurance [4 50%]'),
    fix('TWN', 'Taipower Offshore Phase 2', C,
        '31 部 9.5 MW 風機、共 294.5 MW；原寫 294 MW',
        '31 turbines of 9.5 MW, 294.5 MW in total; the record said 294 MW',
        'https://technews.tw/2022/11/03/taipower-offshore-wind2/', mw=294.5),
    fix('TWN', 'Taipower Offshore Phase 2', C,
        '31 座水下基礎與海纜都已完工；台電船機 2026-09-28 出海裝機（原訂 9/25），31 部風機已裝 1 部，台電力拚年底前完工、2027 年上半年併聯',
        'All 31 foundations and the cables are in; Taipower’s vessel sailed on 28 Sep 2026 to install turbines (planned for 25 Sep) with 1 of 31 installed, '
        'and Taipower aims to finish by year-end and connect in H1 2027',
        'https://www.cna.com.tw/news/afe/202610020045.aspx', note=True),
    fix('TWN', 'Formosa 3 offshore wind farm · 3', G,
        'JERA 2023 年把海鼎（Formosa 3）的持股全數轉給 Corio，Corio 再與道達爾能源合作，海鼎三由兩家各持有約一半；GEM 的業主 JERA 是舊資料。'
        'Macquarie 2026 年結束 Corio 平台，海鼎三之後由誰持有待查證',
        'JERA transferred all its Formosa 3 shares to Corio in 2023, and Corio then partnered with TotalEnergies, the two holding about half of Haiding 3 each; GEM’s owner JERA is out of date. '
        'Macquarie wound up the Corio platform in 2026; who holds Haiding 3 now is unverified',
        'https://totalenergies.com/newsroom/totalenergies-and-corio-join-forces-develop-offshore-wind-taiwan/?lang=eng', owner='Corio Generation; TotalEnergies'),
    fix('GBR', 'Dogger Bank wind farm · B, C', G,
        'B 期 2026 年 6 月才裝了 20 部，風機安裝持續到約 2027 年第二季，C 期在 B 期之後',
        'Only 20 turbines of phase B were in by June 2026 and installation runs to about Q2 2027, with phase C after B',
        'https://www.offshorewind.biz/2026/06/09/20-turbines-installed-at-dogger-bank-b-offshore-wind-farm/', year=2027),
    fix('POL', 'Baltic Power Offshore wind farm', G,
        '76 部 15 MW 風機、共 1,140 MW（Northland 寫約 1.1 GW），不是 1,200 MW；2026 年 7 月首度發電，第二季末 76 部已裝 61 部，預計 2026 年下半年商轉',
        '76 turbines of 15 MW, 1,140 MW in total (Northland: about 1.1 GW), not 1,200 MW; first power in July 2026, 61 of 76 installed at the end of Q2, commercial operation expected in H2 2026',
        'https://northlandpower.com/northland-power-reports-second-quarter-2026-results-and-construction-progress-updates/', mw=1140),
    fix('DEU', 'Windanker wind farm', G,
        '容量 315 MW（21 部風機），不是 300 MW；2026 年 6 月才開始安裝風機，預計年底完工、2027 年全面運轉',
        'Capacity 315 MW (21 turbines), not 300 MW; turbine installation only began in June 2026, with completion expected by year-end and full commissioning in 2027',
        'https://www.offshorewind.biz/2026/06/10/windanker-turbine-components-arriving-at-german-port-ahead-of-offshore-installation/', mw=315),
    # 2026-10-04 再核對「預計 2026 年完工」的興建中離岸風場（出處原文以 check_quotes.py 核對）
    fix('NLD', 'Ecowende Offshore wind farm', G,
        'Ecowende（Hollandse Kust West 第 VI 區）52 部 Vestas V236-15.0、760 MW，2026 年 7 月首度送電、預定 2026 年底全面運轉；'
        '座標改為 Hollandse Kust West 風場區（原座標在海岸線上，概略位置）。容量、狀態與年份由 2026 年整理的規劃中清單帶入（見 build_farms.py 的 PIPE_SAME）',
        'Ecowende (Hollandse Kust West site VI), 52 Vestas V236-15.0, 760 MW, first power July 2026, full operation planned for the end of 2026; '
        'moved to the Hollandse Kust West zone (the old point was on the coastline; approximate). Capacity, status and year come from the 2026 pipeline compilation (PIPE_SAME in build_farms.py)',
        'https://windpowernl.com/2026/07/06/ecowendes-hollandse-kust-west-offshore-wind-farm-delivers-first-power-to-dutch-grid/',
        turbine='52x Vestas V236-15.0', lat=52.68, lon=3.77, approx=True),
    fix('CHN', 'Shenergy Hainan CZ2 (Dongfang)', C,
        '申能海南 CZ2 一期 67 部 9 MW 於 2025-03-24 全容量併網（2024 年只是首批併網），年份 2024→2025；場址在儋州市北面海域、中心離岸約 27 km，'
        '不在東方外海，座標改到儋州北面（概略位置），名稱的「Dongfang」改為「Danzhou」',
        'Shenergy Hainan CZ2 phase 1 (67 × 9 MW) reached full grid connection on 2025-03-24 (2024 was only the first units), so the year changes from 2024 to 2025; '
        'the site lies off northern Danzhou, about 27 km offshore, not off Dongfang, so the point moves north of Danzhou (approximate) and “Dongfang” in the name becomes “Danzhou”',
        'https://www.ne21.com/news/show-210615.html', rename='Shenergy Hainan CZ2 (Danzhou)', year=2025, lat=19.965, lon=109.42, approx=True),
    fix('CHN', 'Hainan CZ2 Demonstration Offshore wind farm · 2', G,
        '這是 CZ2 二期：全案 120 萬千瓦、一期 60 萬千瓦已營運，二期 2026-04-30 才打下首樁，完工年份未公布；GEM 的中文名寫成一期',
        'This is CZ2 phase 2: the project totals 1,200 MW and phase 1 (600 MW) is operating; phase 2 drove its first pile only on 2026-04-30 and no completion year has been published; GEM’s Chinese name says phase 1',
        'https://www.hi.chinanews.com.cn/hnnew/2026-05-02/739814.html', zhname='申能海南CZ2海上風電示範項目（二期）', year=0),
    fix('CHN', 'Hainan CZ7 Demonstration Offshore wind farm · 1', G,
        '這是 CZ7 一期（CZ7-1，600 MW，擬裝 60 部 10 MW 明陽機組），不是二期；2026 年只查到陸上集控中心與送出線路施工，未見海上施工，完工年份未公布',
        'This is CZ7 phase 1 (CZ7-1, 600 MW, 60 × 10 MW Mingyang turbines planned), not phase 2; in 2026 only the onshore control centre and grid connection are being built, '
        'with no offshore works found and no completion year published',
        'https://finance.sina.com.cn/roll/2025-07-23/doc-infhncvn1132725.shtml', zhname='中海油海南CZ7海上示範風電場一期（CZ7-1）', year=0),
    fix('CHN', 'Hainan CZ9 Demonstration Offshore wind farm · 1', G,
        '明陽東方 CZ9 一期 600 MW：2022-11-30 舉行開工儀式，但到 2026-10 查不到海上沉樁或吊裝，2026 年 7 月明陽仍把 CZ9 寫成規劃中的場址；2026 年完工的根據不足，年份改為不詳',
        'Mingyang Dongfang CZ9 phase 1, 600 MW: a groundbreaking ceremony was held on 2022-11-30, but by October 2026 no offshore piling or turbine installation can be found, '
        'and in July 2026 Mingyang still described CZ9 as a planned site; there is no basis for 2026 completion, so the year is set to unknown',
        'https://www.ewindpower.cn/news/show-htm-itemid-33855.html', year=0),
    fix('CHN', 'Guangdong Xuwen Donger Offshore wind farm', G,
        '中核集團湛江徐聞東二：300 MW、21 部 14.3 MW；2026-09-04 才打下首根鋼管樁（原計畫 2025 年底全容量併網已延誤），完工年份未公布',
        'CNNC’s Zhanjiang Xuwen Donger: 300 MW, 21 × 14.3 MW; the first monopile was driven only on 2026-09-04 (the original plan of full connection by end-2025 has slipped), '
        'and no completion year has been published',
        'https://www.21jingji.com/article/20260906/herald/6b02ac88b4840ed91205ffeb9430edf6.html',
        year=0, turbine='21x 14.3 MW', owner='China National Nuclear Corporation (CNNC)', zhname='湛江徐聞東二海上風電項目'),
    fix('CHN', 'Guangdong Three Gorges Pilot Floating Offshore wind farm', G,
        '這是三峽「領航號」單機 16 MW 浮動式平台，2026-05-02 在陽江青洲海域完成安裝、6 月敷設 66 kV 動態海纜，接入青洲五、七的集電網路；查不到本身已併網的報導，維持興建中。'
        'GEM 的座標在沙扒鎮外海幾公里，但國家能源局寫「離岸超70公里、水深超50米」：改放在本站青洲五、七兩點之間（概略位置，沒有官方座標）',
        'This is CTG’s “Three Gorges Lead” (Sanxia Linghang), a single 16 MW floating platform, installed off Yangjiang (Qingzhou) on 2026-05-02 with its 66 kV dynamic cable '
        'laid in June into the Qingzhou 5/7 array; no report of its own grid connection was found, so it stays under construction. '
        'GEM’s point is a few km off Shapa town, but the National Energy Administration says it lies “more than 70 km offshore in over 50 m of water”: '
        'moved between the site’s Qingzhou 5 and 7 points (approximate; no official coordinates)',
        'https://www.nea.gov.cn/20260508/6077d3ffe9cb4855b009df84347bfe80/c.html', zhname='三峽領航號', turbine='1x 16 MW floating',
        lat=20.80, lon=111.95, approx=True),
    fix('VNM', 'Đông Thành 1 - Thái Hòa offshore wind farm · 1', G,
        '東城 1（80 MW）2026 年 3 月永隆省工商廳仍在請上級對投資主張表示意見，查不到施工報導（GEM 的「施工中」只根據 2024 年的付費資料庫頁面）；改為施工前、年份不詳',
        'Đông Thành 1 (80 MW): in March 2026 the Vĩnh Long trade department was still seeking opinions on its investment approval, and no construction report can be found '
        '(GEM’s “construction” rests on a 2024 paid-database page); set to pre-construction, year unknown',
        'https://thuonghieucongluan.com.vn/vinh-long-phat-trien-dien-gio-tro-thanh-nganh-kinh-te-quan-trong-a310538.htm', st=2, year=0),
    # 2026-10-05 待查證項目核對（出處原文以 check_quotes.py 核對）
    fix('GBR', 'Pentland wind farm', G,
        'Pentland 浮動式風場（GEM 另一筆「Pentland Floating Offshore wind farm」是同一案，GEM 的頁面互列為別名）：2023-06-29 取得蘇格蘭海洋局 Section 36 許可，'
        '2026 年 1 月在第 7 輪差價合約得標，預計 2027 年最終投資決定、2030 年商轉，尚未施工；位置改用 GEM 另一筆在 Dounreay 外海約 7.5 km 的點（原座標在 Thurso 陸上，概略位置）',
        'Pentland floating wind farm (GEM’s other record, “Pentland Floating Offshore wind farm”, is the same project; the two GEM pages list each other as other names): '
        'Marine Scotland granted Section 36 consent on 2023-06-29, it won a Contract for Difference in Allocation Round 7 in January 2026, with a final investment decision '
        'expected in 2027 and operation in 2030; not yet under construction. Moved to GEM’s other point about 7.5 km off Dounreay (the old point was on land at Thurso; approximate)',
        'https://cop.dk/pentland-floating-offshore-wind-farm-secures-contract-for-difference-cfd/', year=2030,
        lat=58.633, lon=-3.815, approx=True),
    fix('KOR', 'Ulsan Dongbu floating demo (Vindmøllen 750 kW)', C,
        '蔚山 750 kW 浮動式示範機：2019 年 11 月蔚州郡四度退回細部設計審查，原訂當月完成安裝、隔年 3 月實證的計畫受阻；之後查不到安裝或發電的報導，'
        '原本「2020 年營運中」沒有根據，改為施工前、年份不詳（確認從未運轉後再刪除）',
        'Ulsan 750 kW floating demonstrator: in November 2019 Ulju County had rejected its detailed design four times, derailing the plan to install that month and '
        'test until March 2020; no later report of installation or generation can be found, so the “operating since 2020” entry has no support and is set to '
        'pre-construction with the year unknown (to be removed once it is confirmed never to have operated)',
        'https://www.ksilbo.co.kr/news/articleView.html?idxno=735360', st=2, year=0, note=True),
    # 2026-10-05 台電自有風場對照台電「風力發電站資料」（政府資料開放平臺 17141，2026 年版）與能源署風力發電單一服務窗口（出處原文以 check_quotes.py 核對）
    fix('TWN', 'Taoyuan Luzhu', C,
        '台電發電站清單與能源署單一窗口都只有蘆竹 8 部 Enercon E44（0.9 MW），共 7.2 MW，查無 33.6 MW 的新建或汰舊換新計畫；2015 年 2 月 2 日完工併聯商轉（維基百科）。原本的 33.6 MW、2025 年是估計值',
        'Taipower’s station list and the Energy Administration’s wind single window list only the 8 Enercon E44 (0.9 MW) at Luzhu, 7.2 MW in all, with no 33.6 MW new-build or repowering plan; completed and connected on 2 February 2015 (Wikipedia). The previous 33.6 MW and 2025 were estimates',
        'https://service.taipower.com.tw/data/opendata/apply/file/d693002/001.csv', mw=7.2, year=2015, turbine='Enercon E-44 0.9 MW x8', note=True),
    fix('TWN', 'Taichung Power Plant', C,
        '台中電廠原有 4 部 Zephyros Z72；2008 年薔蜜颱風吹倒台中港區一部後，從電廠移 1 部（P01）去補，電廠剩 3 部；2016 年台電因中龍鋼鐵等建物擋風，'
        '再移 2 部到高美濕地第 1 排補蘇迪勒颱風（2015）吹毀的機組，電廠只剩 1 部（2 MW）。台電 2026 年發電站清單與能源署單一窗口都是 1 部',
        'Taichung Power Plant originally had 4 Zephyros Z72; after Typhoon Jangmi toppled one at Taichung Port in 2008, one (P01) was moved there, leaving 3; in 2016, '
        'with the plant’s turbines blocked by China Steel/Dragon Steel buildings, Taipower moved 2 more to the front row at Gaomei Wetland to replace units destroyed by '
        'Typhoon Soudelor (2015), leaving 1 (2 MW). Taipower’s 2026 station list and the Energy Administration’s single window both show 1 turbine',
        'https://news.ltn.com.tw/news/life/breakingnews/1618036', mw=2.0, turbine='Zephyros Z72 2.0 MW x1', note=True),
    fix('TWN', 'Taichung Port', C,
        '高美濕地旁原有 18 部 Zephyros Z72（前排 10、後排 8）。2008 年薔蜜颱風吹斷 2 號機，由台中電廠移 1 部補上；2015 年蘇迪勒颱風吹倒 6 部（前後排各 3 部），'
        '台電 2016 年從台中電廠移 2 部補前排、後排的空缺另行新購；2016 年梅姬颱風又吹斷 12 號機葉片。台電 2026 年發電站清單：Z72 剩 13 部（共少了 7 部），'
        '另有 3 部 Enercon E82 E4，共 16 部 35 MW（能源署單一窗口同）',
        'Gaomei Wetland originally had 18 Zephyros Z72 (10 in the front row, 8 behind). Typhoon Jangmi broke unit 2 in 2008 and a turbine from Taichung Power Plant '
        'replaced it; Typhoon Soudelor toppled 6 in 2015 (3 in each row), and in 2016 Taipower moved 2 from the power plant to the front row and planned new turbines '
        'for the back row; Typhoon Megi broke unit 12’s blades in 2016. Taipower’s 2026 station list: 13 Z72 remain (7 fewer in all) plus 3 Enercon E82 E4, '
        '16 turbines and 35 MW (the Energy Administration’s single window agrees)',
        'https://news.ltn.com.tw/news/life/breakingnews/1618036', mw=35.0, turbine='Zephyros Z72 2.0 MW x13 + Enercon E-82 E4 3.0 MW x3', note=True),
    # 2026-10-06 商轉年查證（監察院 2010 年調查報告，出處原文以 check_quotes.py 核對）
    fix('TWN', 'Taichung Power Plant', C,
        '監察院 2010 年調查報告（台電「風力發電第一期計畫臺中電廠及臺中港區風力發電機組及附屬設備採購帶安裝案」）：臺中電廠 4 部機組於 95 年（2006 年）6 月 1 日開始商業運轉；'
        '95 年 1 月已在做 24 小時負載測試，95 年 10 月首次 500 小時定檢時各機已運轉 1,197–2,169 小時；發電業執照 96 年 4 月 20 日核發。年份由 2005 改為 2006',
        'Control Yuan investigation report (2010) on Taipower’s Taichung Power Plant and Taichung Port wind procurement: the plant’s four units entered commercial operation on '
        '1 June 2006; they were in 24-hour load tests in January 2006 and had run 1,197–2,169 hours by the first 500-hour inspection in October 2006; the generation licence '
        'was issued on 20 April 2007. Year changed from 2005 to 2006',
        CY_TAICHUNG, year=2006),
    fix('TWN', 'Taichung Port', C,
        '同一份監察院調查報告：台中港區 18 部 Zephyros Z72 自 96 年（2007 年）1 月 5 日起陸續商業運轉，97 年（2008 年）7 月 19 日全數商轉（96 年 5 月仍有 11 部未商轉）。年份由 2006 改為 2007',
        'Same Control Yuan report: the 18 Zephyros Z72 at Taichung Port entered commercial operation one by one from 5 January 2007, all of them by 19 July 2008 '
        '(11 were still not in commercial operation in May 2007). Year changed from 2006 to 2007',
        CY_TAICHUNG, year=2007),
    fix('TWN', 'Wanggong', C, '台電發電站清單：彰化王功 10 部 Enercon E70，共 23 MW（不是 10 部 Vestas V80、20 MW）',
        'Taipower’s station list: Changhua Wanggong has 10 Enercon E70, 23 MW in all (not 10 Vestas V80 and 20 MW)',
        'https://service.taipower.com.tw/data/opendata/apply/file/d693002/001.csv', mw=23.0, turbine='Enercon E-70 2.3 MW x10'),
    fix('TWN', 'Datan (Tatan)', C, '大潭：2005 年 6 月 3 部 GE 1.5se 商轉，2011 年 7 月擴建 3 部 Vestas V80 2 MW 與 2 部 Enercon E70 2.3 MW（共 8 部 15.1 MW）；'
        '#3（GE 1.5se）2025 年 6 月 20 日變更電業執照除役，剩 7 部 13.6 MW（台電簡明月報、能源署單一窗口；台電發電站清單的 15.1 MW 是除役前的數字）',
        'Datan: 3 GE 1.5se entered service in June 2005, and a July 2011 expansion added 3 Vestas V80 2 MW and 2 Enercon E70 2.3 MW (8 units, 15.1 MW); unit #3 (a GE 1.5se) '
        'was decommissioned with its licence amended on 20 June 2025, leaving 7 units and 13.6 MW (Taipower’s monthly reports, the Energy Administration’s single window; '
        'the 15.1 MW in Taipower’s station list predates the decommissioning)',
        'https://www.taipower.com.tw/media/1f4ew1jr/11508%E7%B0%A1%E6%98%8E%E6%9C%88%E5%A0%B1.pdf', mw=13.6, turbine='GE 1.5se x2 + Vestas V80 2.0 MW x3 + Enercon E-70 2.3 MW x2', note=True),
    fix('TWN', 'Yongxing (Fangyuan)', C, '台電發電站清單：彰化永興 4 部 Enercon E70，共 9.2 MW（原本的 16.8 MW、4.2 MW 機組是估計值）；台電簡明月報：2019 年 10 月併聯試運轉，'
        '2020 年 12 月 28 日商轉（原本寫 2024 年）',
        'Taipower’s station list: Changhua Yongxing has 4 Enercon E70, 9.2 MW in all (the previous 16.8 MW with 4.2 MW turbines was an estimate); Taipower’s monthly reports: '
        'connected for trial operation in October 2019, in commercial operation from 28 December 2020 (previously 2024)',
        'https://www.taipower.com.tw/media/yizfvrbn/10912%E7%B0%A1%E6%98%8E%E6%9C%88%E5%A0%B1.pdf', mw=9.2, turbine='Enercon E-70 2.3 MW x4', year=2020),
    fix('TWN', 'Yunlin Taixi', C, '台電發電站清單：雲林台西 4 部 Enercon E70 E4，共 9.2 MW，113 年（2024 年）10 月 24 日併聯、試運轉中（原本的 16.8 MW 是估計值）',
        'Taipower’s station list: Yunlin Taixi has 4 Enercon E70 E4, 9.2 MW in all, connected on 24 October 2024 and in trial operation (the previous 16.8 MW was an estimate)',
        'https://service.taipower.com.tw/data/opendata/apply/file/d693002/001.csv', mw=9.2, turbine='Enercon E-70 E4 2.3 MW x4'),
    fix('TWN', 'Penghu Longmen', C, '台電發電站清單與能源署單一窗口：澎湖龍門 3 部 Enercon E82 E4，共 9 MW（原本的 6.9 MW 是估計值）；3 部風機 2019 年完工，'
        '台電簡明月報寫 2022 年 6 月 1 日併聯、試運轉到 2024 年 8 月（原本寫 2023 年，改用併聯發電的 2022 年）',
        'Taipower’s station list and the Energy Administration’s single window: Penghu Longmen has 3 Enercon E82 E4, 9 MW in all (the previous 6.9 MW was an estimate); '
        'the 3 turbines were finished in 2019, and Taipower’s monthly reports give grid connection on 1 June 2022 with trial operation until August 2024 '
        '(previously 2023; now the 2022 connection year)',
        'https://www.taipower.com.tw/media/11zda1gx/11308%E7%B0%A1%E6%98%8E%E6%9C%88%E5%A0%B1.pdf', mw=9.0, turbine='Enercon E-82 E4 3.0 MW x3', year=2022, note=True),
    fix('TWN', 'Penghu Zhongtun', C,
        '中屯 8 部風機運轉逾 20 年、無備品，台電 2023 年起辦理除役更新；更新計畫 2024 年 8 月通過環評但因地方反對暫緩，8 部風機 2025 年 11 月前拆除完成（自由時報 2025-11-15）',
        'Zhongtun’s 8 turbines were over 20 years old with no spare parts and Taipower began decommissioning them in 2023; the renewal plan passed its EIA in August 2024 but was shelved after local opposition, and all 8 turbines had been dismantled by November 2025 (Liberty Times, 15 Nov 2025)',
        'https://news.ltn.com.tw/news/life/breakingnews/5246753', st=4, end=2025),
    # 2026-10-06 中國三筆「營運中」離岸風場重查（出處原文以 check_quotes.py 核對）
    fix('CHN', 'Hainan Danzhou CZ3 (Datang) Offshore wind farm · 2', G,
        '大唐儋州 120 萬瓩案的二場址：60 部明陽 10 MW（2025 年 12 月得標），2025 年 12 月 16 日開工；220 kV 送出海纜 2026 年 6 月才招標（工期 8 月 1 日至 10 月 15 日），'
        '10 月 2 日洋浦海事局仍為風機與基礎施工標段二增派施工船，查無任何機組併網的報導；大唐目標 2026 年底全容量併網（標段二合約工期到 2027 年 5 月）。GEM 2026-02 版列規劃中，改為興建中',
        'Site 2 of Datang’s 1,200 MW Danzhou project: 60 Mingyang 10 MW turbines (awarded December 2025), construction started on 16 December 2025. The 220 kV export cable '
        'was only tendered in June 2026 (works 1 August to 15 October 2026), and on 2 October 2026 the Yangpu maritime authority added a work vessel for turbine-and-foundation '
        'lot 2; no turbine has been reported on the grid. Datang aims for full grid connection by the end of 2026 (the lot-2 contract runs to May 2027). GEM’s February 2026 '
        'release lists it as pre-construction; set to under construction',
        'https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=78b6e0e798a44247b72f4720f2d6169b&channelId=5eb2863167464a6faaa1fca5bff0a2a9',
        rename='Datang Danzhou CZ3 (site 2)', zhname='大唐儋州CZ3（二場址）', st=1, turbine='60x Mingyang 10 MW', note=True),
    dup('CHN', 'Hainan CZ3 Demonstration Offshore wind farm · 2', G, ('Hainan Danzhou CZ3 (Datang) Offshore wind farm · 2', G),
        'GEM 第二次收錄的大唐 CZ3 案的第 2 期（600 MW、規劃中，誤標陸域；中文名沿用整案的「一期（一廠址）」）。全案只有兩個場址，'
        '營運中的一場址已是精選紀錄，這筆規劃中的 600 MW 與二場址重複',
        'Phase 2 of GEM’s second entry for the same Datang CZ3 project (600 MW, pre-construction, wrongly typed onshore; its Chinese name repeats the project’s '
        '“phase 1 (site 1)”). The project has only two sites: the operating site 1 is the curated record, so this pre-construction 600 MW repeats site 2',
        'https://www.gem.wiki/Hainan_CZ3_Demonstration_Offshore_wind_farm'),
    fix('CHN', 'Huaneng Peninsula North BW', C,
        '座標改到龍口桑島西北外海（GEM 的精確位置；龍口市 2022 年公示：場址中心離岸約 18 km）；原座標在威海北方外海，偏東約 140 km。'
        '營運狀態無誤：2023 年 8 月開工、2024 年全容量併網',
        'Point moved to the site north-west of Sangdao island off Longkou (GEM’s exact point; the 2022 Longkou notice puts the site centre about 18 km offshore); '
        'the old one was in the sea north of Weihai, about 140 km to the east. The operating status is right: construction started in August 2023 and it reached full capacity in 2024',
        'https://www.gem.wiki/Shandong_Bandaobei_BW_Offshore_wind_farm', lat=37.779, lon=120.435),
    dup('CHN', 'Changle Waihai B', C, ("Fujian Changle 'Outer Ocean' Area B Offshore wind farm", G),
        '長樂外海 B 區沒有建成的風場：唯一的 B 區案是中閩能源的「長樂 B 區（調整）」，2023 年競爭配置才選定業主、2024 年 11 月 30 日核准（114 MW、7 部），'
        '2026 年 9 月才招 EPC（不超過 102 MW、6 部，計畫 2027 年 12 月前全部併網）。這筆 400 MW、2022 年營運中有誤，GEM 已有該案的規劃中紀錄',
        'Changle offshore area B has no built farm: the only area-B project is Zhongmin Energy’s “Changle B (adjusted)”, whose developer was picked in a 2023 '
        'competitive allocation and which was approved on 30 November 2024 (114 MW, 7 turbines); its EPC contract was only tendered in September 2026 (at most '
        '102 MW and 6 turbines, all on the grid by December 2027). This 400 MW record operating since 2022 is wrong; GEM already has the project as pre-construction',
        'https://baijiahao.baidu.com/s?id=1875652994034298464&wfr=spider&for=pc'),
    fix('CHN', "Fujian Changle 'Outer Ocean' Area B Offshore wind farm", G,
        '業主是中閩能源（福建投資集團旗下；專案公司福建福州閩投海上風電由中閩能源持股 100%），不是華電；2024 年 11 月核准 114 MW、7 部，'
        '2026 年 9 月 EPC 招標為不超過 102 MW、6 部，計畫 2027 年 10 月前首部、12 月前全部併網',
        'The developer is Zhongmin Energy (part of Fujian Investment & Development Group; the project company Fujian Fuzhou Mintou Offshore Wind is 100% Zhongmin), not '
        'Huadian. Approved in November 2024 for 114 MW and 7 turbines; the September 2026 EPC tender is for at most 102 MW and 6 turbines, with the first turbine on '
        'the grid by October 2027 and all by December 2027',
        'https://fgw.fujian.gov.cn/zfxxgkzl/zfxxgkml/zdjsxmpzhss/202412/t20241202_6587050.htm', owner='Zhongmin Energy Co Ltd [100%]', mw=102, year=2027, note=True),
    # 2026-10-06 澳洲 AEMO 實測發電量對照時查到的錯誤（AEMO 登記容量與紀錄不符；出處原文以 check_quotes.py 核對）
    fix('AUS', 'Rye Park', C, 'Rye Park 是 66 部 Vestas V162-6.2（以 6.0 MW 模式運轉），共 396 MW（Vestas 2021 年訂單新聞稿；AEMO 登記容量同），不是 327 MW',
        'Rye Park has 66 Vestas V162-6.2 turbines run in 6.0 MW mode, 396 MW in all (Vestas order release, 2021; AEMO’s registered capacity agrees), not 327 MW',
        'https://vestas.com/en/media/company-news/2021/vestas-wins-396-mw-enventus-order-for-wind-project-in-a-c3407249', mw=396,
        turbine='Vestas V162-6.2 (6.0 MW mode) x66'),
    fix('AUS', 'Cullerin Range wind farm', G, 'Cullerin Range 是 8 部 Senvion MM82 2 MW 加 7 部 MM92 2.05 MW，共 30 MW（英文維基；AEMO 登記容量 30 MW），不是 26 MW',
        'Cullerin Range has 8 Senvion MM82 2 MW and 7 MM92 2.05 MW turbines, 30 MW in all (English Wikipedia; AEMO registered capacity 30 MW), not 26 MW',
        'https://en.wikipedia.org/wiki/Cullerin_Range_Wind_Farm', mw=30.0, turbine='Senvion MM82 2.0 MW x8 + MM92 2.05 MW x7'),
    fix('AUS', 'Lal Lal', C, 'Lal Lal 的 60 部是 Vestas V136-3.45 平台、每部 3.8 MW（共 228 MW，英文維基），原寫「V136 3.6」與容量不符',
        'Lal Lal’s 60 turbines are Vestas V136-3.45 machines rated 3.8 MW each (228 MW in all, English Wikipedia); the row said “V136 3.6”, which does not add up to its capacity',
        'https://en.wikipedia.org/wiki/Lal_Lal_Wind_Farm', turbine='Vestas V136-3.45 (3.8 MW) x60'),
    # 2026-10-05 德國 MaStR 對照時查到的錯置（MaStR 機組編號可在 marktstammdatenregister.de 查詢）
    fix('DEU', 'Flomborn-Stetten wind farm', G,
        'BVT 集團的 Flomborn／Stetten 風場就是 MaStR 的「BVT Windpark Flomborn/Stetten」：5 部 3,075 kW、2013 年 12 月併網（SEE970097431950、SEE972537071986、'
        'SEE986793983570、SEE978061015458、SEE997638951548），位於 Alzey-Worms 縣 Flomborn；GEM 的座標在東北方約 25 km 外，改到這 5 部的中心',
        'BVT Group’s Flomborn/Stetten farm is MaStR’s “BVT Windpark Flomborn/Stetten”: 5 × 3,075 kW, connected in December 2013 (SEE970097431950, SEE972537071986, '
        'SEE986793983570, SEE978061015458, SEE997638951548), at Flomborn, Alzey-Worms district; GEM’s point is about 25 km to the north-east, so it moves to the centre of these five',
        'https://www.marktstammdatenregister.de/MaStR/Datendownload', lat=49.690, lon=8.111),
    # ------------------------------------------------ 2026-10-07 上一輪記下的資料疑點逐筆查證（出處原文以 check_quotes.py 核對）
    dup('CHN', 'Shandong Haiwei Peninsula South U', C, ('CGN Peninsula South U1', C),
        '「山東海衛半島南 U 場址 450MW 海上風電項目」就是國家電投半島南 U 場址項目二期（53 部 8.5 MW、450.5 MW，乳山南側海域，世紀新能源網 2024-09）；'
        '精選紀錄「SPIC Peninsula South U1」已含兩期 900 MW（一期 2023-11-17 投運、二期 2024-10-26 全容量併網，中國電器工業協會 2024-10-31），本筆重複，年份 2025 也不對',
        '"Shandong Haiwei Peninsula South U site 450 MW" is phase 2 of SPIC\'s Peninsula South U site (53 × 8.5 MW, 450.5 MW, south of Rushan; ne21, Sept 2024); '
        'the curated "SPIC Peninsula South U1" already holds both phases, 900 MW (phase 1 in operation 17 Nov 2023, phase 2 fully connected 26 Oct 2024; CEEIA, 31 Oct 2024), '
        'so this record is a duplicate, and its year 2025 is wrong too',
        'https://www.ne21.com/news/show-201133.html'),
    dup('CHN', "Zhangpu Liu'ao Phase 1", C, ("CTG Zhangpu Liu'ao Phase 2", C),
        '福能持股 35%、三峽 65% 的海峽發電在六鰲只有一個項目：2018 年券商報告寫「漳州六鰲 D 區項目（40.2 萬千瓦）」，2024 年中閩能源回覆上交所（引福能年報）'
        '寫成「漳浦六鰲二期 40.2 萬千瓦」，即 2023-02-04 開工（「閩南地區首個海上風電項目」）、2024-06-27 全容量併網的三峽漳浦六鰲二期；本筆「一期、2022 年營運」'
        '是 GEM 的 D 區併進精選紀錄後誤標，與二期重複',
        "Straits Power (Funeng 35%, CTG 65%) has a single Liu'ao project: a 2018 broker report calls it 'Zhangzhou Liu'ao area D (402 MW)' and Zhongmin Energy's 2024 reply "
        "to the stock exchange (citing Funeng's annual report) calls it 'Zhangpu Liu'ao phase 2, 402 MW' — CTG's phase 2, started 4 Feb 2023 as 'the first offshore wind "
        "project in southern Fujian' and fully connected 27 Jun 2024; this 'phase 1, operating 2022' record is GEM's area D mislabelled, a duplicate of phase 2",
        'https://epaper.cs.com.cn/zgzqb/images/2024-06/08/B075/zqB07508.pdf'),
    fix('CHN', 'Zhuanghe I', C,
        '莊河場址 I 是大唐集團的 100 MW 項目：19 部明陽 MySE5.2-166（19 × 5.2 = 98.8 MW），EPC 於 2021 年由中國能建北方建投與上海院聯合體得標（世紀新能源網）；'
        '原寫 200 MW、業主空白、「4-6 MW class」都不對。併網年份沒有可引用的出處，2021 年待查證',
        "Zhuanghe site I is China Datang's 100 MW project: 19 MingYang MySE5.2-166 (19 × 5.2 = 98.8 MW), EPC awarded in 2021 to a CEEC Northern Construction / SHIDI consortium (ne21); "
        "the stored 200 MW, blank owner and '4-6 MW class' were wrong. No quotable grid-connection date was found, so the year 2021 is unverified",
        'https://www.ne21.com/news/show-157836.html', mw=98.8, owner='China Datang Corporation', turbine='19x MingYang MySE5.2-166'),
    fix('CHN', 'Liaoning Dalian Zhuanghe 4 Area I Offshore wind farm', G,
        '華能莊河 IV1（350 MW）：中新網寫 II、IV1 兩場共 650 MW、60 部 5 MW＋26 部 7.5 MW＋25 部 6.2 MW，II 場是 60 部 5 MW，所以 IV1 為 26 × 7.5＋25 × 6.2 = 350 MW，'
        '2021-12-29 全容量併網，由華能遼寧清潔能源建設運維；補上業主與機組',
        'Huaneng Zhuanghe IV-1 (350 MW): China News gives sites II and IV-1 together as 650 MW with 60 × 5 MW + 26 × 7.5 MW + 25 × 6.2 MW; site II is 60 × 5 MW, so IV-1 is '
        '26 × 7.5 + 25 × 6.2 = 350 MW, fully connected 29 Dec 2021, built and run by Huaneng Liaoning Clean Energy; owner and turbines filled in',
        'https://www.chinanews.com/ny/2021/12-29/9640309.shtml', owner='Huaneng Liaoning Clean Energy Co Ltd', turbine='26x 7.5 MW + 25x 6.2 MW'),
    fix('CHN', 'Shanghai Fengxian Haiwan Expansion Offshore wind farm', G,
        '財政部 2013-03 可再生能源電價附加補助目錄：「上海新能源環保工程公司奉賢海灣風電場擴容 14.75MW 發電工程」，容量 14.75 MW；是海堤上的陸域還是海上沒有可引用的出處，型別待查證',
        "The Ministry of Finance renewable-energy subsidy catalogue (March 2013) lists 'Shanghai New Energy & Environmental Protection Engineering Co – Fengxian Haiwan wind farm "
        "expansion 14.75 MW'; whether it stands on the sea wall (onshore) or offshore has no quotable source, so the type is unverified",
        'http://jjs.mof.gov.cn/tongzhigonggao/201303/P020130308403305257355.pdf', mw=14.75, owner='Shanghai New Energy and Environmental Protection Engineering Co Ltd'),
    fix('VNM', 'V1-1 Truong Long Hoa (Tra Vinh)', C,
        '茶榮 V1-1 就是「韓國－茶榮」風場一期（48 MW）：2019-04-24 由茶榮 1 號風電公司在長隆和社 V1-1 位置動工，主要出資者 Climate Investor One 與韓國 Samtan（vietnamfinance）；'
        'Vestas 統包 12 部 V150-4.2 MW（offshoreWIND.biz 2021-09）。Sermsang 是 V1-2 的投資人，原寫的業主與「12x Envision 4 MW」都不對',
        "Tra Vinh V1-1 is the Korea–Tra Vinh wind farm phase 1 (48 MW): Tra Vinh Wind Power Co. No. 1 broke ground at site V1-1 in Truong Long Hoa on 24 Apr 2019, with Climate "
        "Investor One and Korea's Samtan as the main investors (vietnamfinance); Vestas supplied 12 V150-4.2 MW turnkey (offshoreWIND.biz, Sept 2021). Sermsang invests in V1-2, "
        "so the stored owner and '12x Envision 4 MW' were wrong",
        'https://www.offshorewind.biz/2021/09/01/vestas-nears-finish-line-at-vietnamese-intertidal-wind-farm',
        owner='Tra Vinh Wind Power Co Ltd No. 1 (Climate Investor One; Samtan)', turbine='12x Vestas V150-4.2'),
    fix('VNM', 'Hiep Thanh (Tra Vinh)', C,
        '協成風場（78 MW）是 18 部西門子歌美颯 SG 5.0-145、每部以 4.3 MW 運轉（offshoreWIND.biz 2020-07 與 2021-08），不是遠景；開發商 EcoTech Tra Vinh Renewables，'
        '投資人 Janakuasa、Ecotech Vietnam、Climate Investor One 與 ST International',
        'Hiep Thanh (78 MW) has 18 Siemens Gamesa SG 5.0-145 turbines run at 4.3 MW each (offshoreWIND.biz, July 2020 and Aug 2021), not Envision; developer EcoTech Tra Vinh '
        'Renewables, with investors Janakuasa, Ecotech Vietnam, Climate Investor One and ST International',
        'https://www.offshorewind.biz/2020/07/23/siemens-gamesa-lands-biggest-nearshore-contract-in-vietnam/',
        owner='EcoTech Tra Vinh Renewables JSC (Janakuasa; Ecotech Vietnam; Climate Investor One; ST International)', turbine='18x Siemens Gamesa SG 5.0-145 (4.3 MW rating)'),
    # ------------------------------------------------ 2026-10-07 第二批資料疑點（機型欄、分場重複、狀態；出處原文以 check_quotes.py 核對）
    fix('CHN', 'CGN Xiangshan 1 Phase 1 (Tuci)', C,
        '中廣核象山塗茨一期已併網（寧波日報 2025-07），風機由中國海裝供應（日立能源 2022-07 新聞稿、券商報告），8 MW 級；原寫「明陽 6.45 MW」不對。'
        '變更海域使用論證報告（2022-08 調整批覆後成稿）寫「目前尚未投產建設」，所以「2022 年」不對，實際全容量併網年份待查證；台數有 35 部（280 MW）與 38 部兩說',
        "CGN's Xiangshan Tuci phase 1 is connected (Ningbo Daily, July 2025), with CSSC Haizhuang 8 MW-class turbines (Hitachi Energy release, July 2022; broker report), "
        "not 'Mingyang 6.45 MW'. A sea-use change report written after the August 2022 adjustment approval says it was 'not yet in construction', so 2022 is wrong; the "
        "year of full connection is unverified, and sources give either 35 turbines (280 MW) or 38",
        'http://epaper.cnnb.com.cn/nbrb/pc/content/202507/17/content_225027.html', turbine='CSSC Haizhuang 8 MW class', note=True),
    fix('CHN', 'Huaneng Cangnan 4', C,
        '華能蒼南 4 號安裝 77 部機組（蒼南新聞網 2022-09），GlobalData 寫為遠景 5.2 MW（77 × 5.2 = 400.4 MW）；原寫「明陽 6.45–8 MW」沒有出處',
        'Huaneng Cangnan 4 has 77 turbines (Cangnan News, Sept 2022), Envision 5.2 MW according to GlobalData (77 × 5.2 = 400.4 MW); the stored "Mingyang 6.45–8 MW" had no source',
        'https://www.cnxw.com.cn/system/2022/09/06/014531534.shtml', turbine='77x Envision 5.2 MW'),
    fix('CHN', 'CGN Shanwei Jiazi II', C,
        '汕尾甲子 900 MW 全場「78 台 6.45 MW 和 50 台 8.0 MW」，甲子一是 78 台 6.45 MW，所以甲子二為 50 台 8.0 MW（中國證券報 2022-12-21；汕尾市政府補充論證報告同）；原寫 MySE6.45-180',
        'Shanwei Jiazi (900 MW) has "78 × 6.45 MW and 50 × 8.0 MW"; Jiazi I is the 78 × 6.45 MW, so Jiazi II is 50 × 8.0 MW (China Securities Journal, 21 Dec 2022; the Shanwei '
        'supplementary report agrees); it was stored as MySE6.45-180',
        'https://www.cs.com.cn/ssgs/gsxw/202212/t20221221_6314699.html', turbine='50x 8 MW'),
    fix('CHN', 'Huaneng Guanyun', C,
        '華能灌雲 2021-07-30 全容量併網、共 48 台（中證網轉華能），中廣核嵊泗 7 號環評的類比表：46 台 6.45 MW＋2 台 3.0 MW；原寫「金風／遠景 4–5 MW」',
        'Huaneng Guanyun was fully connected on 30 July 2021 with 48 turbines (cs.com.cn citing Huaneng); the comparison table in the CGN Shengsi 7 EIA gives 46 × 6.45 MW + '
        '2 × 3.0 MW; it was stored as "Goldwind/Envision 4–5 MW"',
        'https://29634560.s21i.faiusr.com/61/ABUIABA9GAAgpofptwYorvi-iwM.pdf', turbine='46x 6.45 MW + 2x 3 MW'),
    fix('CHN', 'CTG Changyi', C,
        '三峽昌邑 300 MW 共 50 台 6 MW，2022 年入冬前全部吊裝（山東省能源局 2022-11；新華社 2026-06 寫 50 座風機、滿發時每台每小時 6,000 度）；原寫「明陽 5.5–6.45 MW」',
        'CTG Changyi (300 MW) has 50 × 6 MW, all installed before winter 2022 (Shandong Energy Administration, Nov 2022; Xinhua, June 2026: 50 turbines, 6,000 kWh per '
        'turbine-hour at full output); it was stored as "Mingyang 5.5–6.45 MW"',
        'http://nyj.shandong.gov.cn/art/2022/11/9/art_253733_10294676.html', turbine='50x 6 MW'),
    fix('CHN', 'Shandong Energy Bozhong G', C,
        '渤中 G 場址一期 400.4 MW 一次全容量併網，35 台 10 MW＋4 台 12.6 MW（齊魯網／大眾新聞 2025-05-31）；原寫「明陽／金風 8.5–16 MW」沒有出處',
        'Bozhong G phase 1 (400.4 MW) was connected in one go with 35 × 10 MW + 4 × 12.6 MW (iqilu / Dazhong News, 31 May 2025); the stored "Mingyang/Goldwind 8.5–16 MW" had no source',
        'https://news.iqilu.com/shandong/yuanchuang/2025/0531/5817656.shtml', turbine='35x 10 MW + 4x 12.6 MW'),
    fix('CHN', 'Putian Shicheng', C,
        '莆田石城 200 MW 為 26 台 7 MW＋3 台 6 MW（福建省自然資源廳 2024-05），GlobalData 寫上海電氣 SWT-7.0-154 與 SWT-6.0-154、2021-07 商轉；與平海灣 F 區是不同項目（券商報告分列）',
        'Putian Shicheng (200 MW) has 26 × 7 MW + 3 × 6 MW (Fujian Natural Resources Department, May 2024), Shanghai Electric SWT-7.0-154 and SWT-6.0-154 in commercial '
        'operation from July 2021 per GlobalData; it is a different project from Pinghai Bay area F (broker reports list both)',
        'https://zrzyt.fujian.gov.cn/zwgk/xwdt/zrzyyw/202405/t20240509_6445881.htm', turbine='26x Shanghai Electric SWT-7.0-154 + 3x SWT-6.0-154'),
    fix('CHN', 'Tianjin Nangang', C,
        '天津南港海上風電一期 18 台 5 MW（國資委轉中國電建 2018-06），GlobalData 寫在渤海、高樁承台基礎、西門子歌美颯 G132-5.0；防波堤上的是另一案',
        'Tianjin Nangang offshore phase 1 has 18 × 5 MW (SASAC citing PowerChina, June 2018), in the Bohai Sea on high-rise pile caps with Siemens Gamesa G132-5.0 per GlobalData; '
        'the breakwater project is a separate one',
        'http://www.sasac.gov.cn/n2588025/n2588124/c9178300/content.html', turbine='18x Siemens Gamesa G132-5.0'),
    dup('CHN', 'Jiangsu Dafeng H8-1 (Three Gorges) Offshore wind farm', G, ('CTG Dafeng H8-1 (800 MW)', C),
        '三峽江蘇大豐 800 MW 由 H8-1、H9、H15、H17 四個場址組成、共 98 台，2025-12-15 全容量併網（揚子晚報 2025-09、紫牛新聞 2026-07）；GEM 的 H8-1 是其中一個場址，已由精選紀錄涵蓋',
        "CTG's Jiangsu Dafeng 800 MW is made up of sites H8-1, H9, H15 and H17 (98 turbines), fully connected on 15 Dec 2025 (Yangtse Evening Post, Sept 2025; Ziniu News, July 2026); "
        "GEM's H8-1 is one of those sites, already covered by the curated record",
        'https://www.yzwb.net/news/jiangsu/202509/t20250916_264564.html'),
    dup('CHN', 'Jiangsu Dafeng H9 (Three Gorges) Offshore wind farm', G, ('CTG Dafeng H8-1 (800 MW)', C),
        '三峽江蘇大豐 800 MW 由 H8-1、H9、H15、H17 四個場址組成、共 98 台，2025-12-15 全容量併網（揚子晚報 2025-09、紫牛新聞 2026-07）；GEM 的 H9 是其中一個場址，已由精選紀錄涵蓋',
        "CTG's Jiangsu Dafeng 800 MW is made up of sites H8-1, H9, H15 and H17 (98 turbines), fully connected on 15 Dec 2025 (Yangtse Evening Post, Sept 2025; Ziniu News, July 2026); "
        "GEM's H9 is one of those sites, already covered by the curated record",
        'https://www.yzwb.net/news/jiangsu/202509/t20250916_264564.html'),
    dup('CHN', 'Jiangsu Dafeng H15 (Three Gorges) Offshore wind farm', G, ('CTG Dafeng H8-1 (800 MW)', C),
        '三峽江蘇大豐 800 MW 由 H8-1、H9、H15、H17 四個場址組成、共 98 台，2025-12-15 全容量併網（揚子晚報 2025-09、紫牛新聞 2026-07）；GEM 的 H15 是其中一個場址，已由精選紀錄涵蓋',
        "CTG's Jiangsu Dafeng 800 MW is made up of sites H8-1, H9, H15 and H17 (98 turbines), fully connected on 15 Dec 2025 (Yangtse Evening Post, Sept 2025; Ziniu News, July 2026); "
        "GEM's H15 is one of those sites, already covered by the curated record",
        'https://www.yzwb.net/news/jiangsu/202509/t20250916_264564.html'),
    dup('CHN', 'Jiangsu Dafeng H17 (Three Gorges) Offshore wind farm', G, ('CTG Dafeng H8-1 (800 MW)', C),
        '三峽江蘇大豐 800 MW 由 H8-1、H9、H15、H17 四個場址組成、共 98 台，2025-12-15 全容量併網（揚子晚報 2025-09、紫牛新聞 2026-07）；GEM 的 H17 是其中一個場址，已由精選紀錄涵蓋',
        "CTG's Jiangsu Dafeng 800 MW is made up of sites H8-1, H9, H15 and H17 (98 turbines), fully connected on 15 Dec 2025 (Yangtse Evening Post, Sept 2025; Ziniu News, July 2026); "
        "GEM's H17 is one of those sites, already covered by the curated record",
        'https://www.yzwb.net/news/jiangsu/202509/t20250916_264564.html'),
    fix('CHN', 'Liaoning Dalian Zhuanghe 4 Area II Offshore wind farm', G,
        '華能大連莊河 Ⅳ2（石城島東部海域，200 MW、25 台 8.0 MW）2024-09-29 最後一台併網、全容量併網（遼寧省政府網 2024-09-30）；原列興建中',
        'Huaneng Dalian Zhuanghe IV-2 (east of Shicheng Island, 200 MW, 25 × 8.0 MW) connected its last turbine and reached full capacity on 29 Sept 2024 (Liaoning government, '
        '30 Sept 2024); it was listed as under construction',
        'https://www.ln.gov.cn/web/ywdt/jrln/wzxx2018/2024093014452334478/index.shtml', st=0, year=2024, turbine='25x 8 MW'),
    fix('CHN', "Fujian Zhangpu Liu'Ao Offshore wind farm · E", G,
        '六鰲 E 區（404 MW）查無開工紀錄：GlobalData（2024-10）仍列規劃中、預計 2025 年開工；改為前期開發。GEM 的點位在六鰲以南約 130 km，確切位置待查證',
        "Liu'ao area E (404 MW) has no record of construction: GlobalData (Oct 2024) still lists it as planned, with construction expected from 2025; moved to pre-construction. "
        "GEM's point is about 130 km south of Liu'ao; the real position is unverified",
        'https://power-technology.com/?p=213306', st=2),
    fix('CHN', 'Guangdong Yangjiang Shaba (Guangdong Energy) Offshore wind farm', G,
        '粵電陽江沙扒已建 46 台明陽 MySE6.45-180＋1 台 MySE5.5-155（21 號機位）（海域使用補充論證報告書，2023-06）；原機型欄空白',
        'Guangdong Energy Yangjiang Shaba has 46 MingYang MySE6.45-180 + 1 MySE5.5-155 (position 21) built (supplementary sea-use report, June 2023); the turbine field was empty',
        'http://www.yangjiang.gov.cn/yjzrzy/attachment/0/43/43288/710896.pdf', turbine='46x Mingyang MySE6.45-180 + 1x MySE5.5-155'),
    fix('CHN', 'CTG Yangjiang Shapa Phase 3', C,
        '沙扒三期建成 61 台 6.45 MW 固定式（明陽 MySE6.45-180 與金風 GW171/6450）＋1 台 5.5 MW 漂浮式 MySE5.5-155（海域使用補充論證報告書，2023-09；2021-12-16 建設完成）；'
        '漂浮式那台已有自己的紀錄「三峽引領號」，這筆只算 61 台固定式（393.45 MW，原寫 400 MW）',
        'Shapa phase 3 has 61 fixed 6.45 MW turbines (MingYang MySE6.45-180 and Goldwind GW171/6450) + 1 floating 5.5 MW MySE5.5-155 (supplementary sea-use report, Sept 2023; '
        'completed 16 Dec 2021); the floating unit has its own record ("Sanxia Yinling"), so this one counts the 61 fixed turbines only (393.45 MW; was 400 MW)',
        'http://www.yangjiang.gov.cn/yjzrzy/attachment/0/58/58158/731643.pdf', turbine='61x 6.45 MW (MySE6.45-180, GW171/6450)', mw=393.45),
    fix('CHN', 'Huaneng Dalian Zhuanghe III', C,
        '三峽莊河 III 布置 2 台 3 MW、50 台 3.3 MW、21 台 6.45 MW，裝機規模 300 MW（世紀新能源網轉龍源振華，2020-11）；原寫「金風／上海電氣 4–6 MW」',
        'CTG Zhuanghe III has 2 × 3 MW, 50 × 3.3 MW and 21 × 6.45 MW, 300 MW in all (ne21 citing Longyuan Zhenhua, Nov 2020); it was stored as "Goldwind/Sewind 4–6 MW"',
        'https://www.ne21.com/news/show-135820.html', turbine='2x 3 MW + 50x 3.3 MW + 21x 6.45 MW'),
    # ------------------------------------------------ 2026-10-07 第四批（第十輪查到的資料問題；出處原文以 check_quotes.py 核對）
    fix('VNM', 'Tan Phu Dong 2 (Tien Giang, GEC)', C,
        '新富東 2 號裝 12 部 Vestas V150-4.2 MW（Power Technology），不是遠景；EPC 為 PC1', 'Tan Phu Dong 2 has 12 Vestas V150-4.2 MW turbines (Power Technology), not Envision; EPC by PC1',
        'https://power-technology.com/?p=174203', turbine='12x Vestas V150-4.2'),
    # ------------------------------------------------ 2026-10-07 第三批（輪轂高度第九輪查到的資料問題；出處原文以 check_quotes.py 核對）
    fix('CHN', 'CGN Fanshi I', C,
        '帆石一的機型是 22 台金風 GWH252-13.6MW 與 51 台明陽 MySE14-260（陽江市自然資源局 2025-04 公示的用海調整補充論證報告書「調整後風機主要設備特性表」；'
        '台數與陽江新聞網的 22 台 13.6 MW＋51 台 14 MW 相同）；原寫「明陽 11–16 MW」',
        'Fanshi I uses 22 Goldwind GWH252-13.6MW and 51 Mingyang MySE14-260 (the adjusted equipment table of the sea-use adjustment report published by the Yangjiang '
        'natural resources bureau in Apr 2025; the counts match Yangjiang News’ 22 × 13.6 MW + 51 × 14 MW); it was stored as "Mingyang 11–16 MW"',
        'http://www.yangjiang.gov.cn/yjzrzy/attachment/0/70/70786/853372.pdf', turbine='22x Goldwind GWH252-13.6MW + 51x Mingyang MySE14-260'),
    fix('CHN', 'Guangdong Zhanjiang Xuwen Offshore wind farm', G,
        '國家電投徐聞原場 60 萬千瓦、南北兩個標段各 47 台（世紀新能源網，2021-11）；300 MW 增容為 25 台 12 MW，2024 年 12 月 17 日全容量併網（國家電投），'
        '與這筆紀錄的分期（2024 年 300 MW）相符；原本機型欄空白',
        'SPIC’s original Xuwen farm is 600 MW in two lots of 47 turbines (ne21, Nov 2021); the 300 MW extension is 25 × 12 MW, fully connected on 17 Dec 2024 (SPIC), '
        'matching this record’s 300 MW phase in 2024; the turbine field was empty',
        'http://www.spic.com.cn/xtdt1/202412/t20241218_324623.html', turbine='94x (600 MW) + 25x 12 MW'),
    fix('CHN', 'Jiangsu Dongtai Zhugensha H1 Offshore wind farm', G,
        '國華東台五期（竹根沙 H1#）裝 50 台上海電氣 4.0-146（中國能源報，2020-06 首台吊裝）；原本機型欄空白',
        'Guohua Dongtai phase V (Zhugensha H1#) has 50 Shanghai Electric 4.0-146 turbines (China Energy News, first turbine installed June 2020); the turbine field was empty',
        'https://paper.people.com.cn/zgnyb/html/2020-06/22/content_1993858.htm', turbine='50x Shanghai Electric 4.0-146'),
    fix('CHN', 'Jiangsu Dongtai Zhugensha H2 Offshore wind farm', G,
        '竹根沙 H2# 總裝機 302 MW，含 50 台 4.0 MW 與 17 台 6.0 MW（中國可再生能源學會風能專委會轉 EPC 承包商，2020-09）；原本機型欄空白',
        'Zhugensha H2# is 302 MW with 50 × 4.0 MW and 17 × 6.0 MW turbines (CWEEA citing the EPC contractor, Sept 2020); the turbine field was empty',
        'https://www.cweea.com.cn/xwdt/html/31056.html', turbine='50x 4.0 MW + 17x 6.0 MW'),
]

# 不可當成精選風場重複的 GEM 專案（GEM 專案名稱，不含分期標籤）
ORPHAN_OK = {
    ('CHN', 'Jiangsu Sheyang Southern Area H1 Offshore wind farm'):
        ('射陽南區 H1 由精選的「Huaneng Sheyang H1 / Yancheng」（300 MW）代表', 'Sheyang South H1 is represented by the curated “Huaneng Sheyang H1 / Yancheng” (300 MW)'),
    ('CHN', 'Zhejiang Cangnan 1 Offshore wind farm'):
        ('蒼南 1 號由精選的「Huarun Cangnan 1 / CR Power」（400 MW）代表', 'Cangnan 1 is represented by the curated “Huarun Cangnan 1 / CR Power” (400 MW)'),
    ('CHN', 'Xinjiang Mori 2500 MW wind farm complex'):
        ('莫里 2,500 MW 是整區彙總，GEM 另逐場列出同地名的各座風場', 'The Mori 2,500 MW complex is an area total; GEM also lists the individual Mori farms'),
    ('CHN', "Fujian Zhangpu Liu'Ao Offshore wind farm"):
        ('GEM 的六鰲 D 區（402 MW）就是三峽漳浦六鰲二期，由精選的「CTG Zhangpu Liu\'ao Phase 2」（400 MW，2024 年）代表（中國證券報 2024-06 中閩能源回覆上交所）',
         "GEM's Liu'ao area D (402 MW) is CTG's Zhangpu Liu'ao phase 2, represented by the curated “CTG Zhangpu Liu'ao Phase 2” (400 MW, 2024; Zhongmin Energy's reply to the SSE, China Securities Journal, June 2024)"),
}

# 名稱相近、已查證是不同風場的組合：覆蓋率報告的「疑似重複」不再列（tools/coverage_report.py）
NOT_DUP = {
    ('DEU', 'Windpark Nortorf'):
        ('MaStR 的「Windpark Nortorf」（2 部 Nordex N163，2025 年）在 Rendsburg-Eckernförde 縣的 Nortorf／Ellerdorf；GEM 的「Nortorf 2」（13 MW，2022 年）是 44 km 外 Steinburg 縣的 Nortorf，'
         '已對到 MaStR 的「Windpark Nortorf 2」（2 部 6.6 MW）：兩個同名的地方',
         'MaStR’s “Windpark Nortorf” (2 Nordex N163, 2025) is at Nortorf/Ellerdorf in Rendsburg-Eckernförde district; GEM’s “Nortorf 2” (13 MW, 2022) is the other Nortorf, '
         '44 km away in Steinburg district, matched to MaStR’s “Windpark Nortorf 2” (2 × 6.6 MW): two places with the same name',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'BWP Kaiser-Wilhelm-Koog II'):
        ('MaStR 的「BWP Kaiser-Wilhelm-Koog II」是 2004 年的一部 Enercon E58（1,000 kW），與精選紀錄裡 1987 年的 Westküste 試驗風場不是同一批機組',
         'MaStR’s “BWP Kaiser-Wilhelm-Koog II” is a single Enercon E58 (1,000 kW) from 2004, not the 1987 Westküste test field in the curated record',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Flomborn'):
        ('MaStR 的「Windpark Flomborn」是 5 部 3,075 kW（2012-12 至 2013-02 併網），與 GEM「Flomborn-Stetten」對到的「BVT Windpark Flomborn/Stetten」（5 部，2013-12）是相鄰的另一座',
         'MaStR’s “Windpark Flomborn” has 5 × 3,075 kW connected December 2012 – February 2013, a separate neighbour of the “BVT Windpark Flomborn/Stetten” (5 units, December 2013) that GEM’s “Flomborn-Stetten” matches',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Stetten'):
        ('MaStR 的「Windpark Stetten」（Donnersbergkreis 的 Stetten，2012–2015 年）與 GEM「Flomborn-Stetten」對到的 BVT 那 5 部（2013-12）是不同機組',
         'MaStR’s “Windpark Stetten” (Stetten, Donnersbergkreis, 2012–2015) is a different set of turbines from the five BVT units (December 2013) that GEM’s “Flomborn-Stetten” matches',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Heßloch'):
        ('MaStR 的「Windpark Heßloch」是 2014–2015 年的 3 部 Senvion 3.4M104；GEM「Dittelsheim-Heßloch」已對到 2013 年的 4 部 Enercon E-82：同地點不同期',
         'MaStR’s “Windpark Heßloch” is 3 Senvion 3.4M104 from 2014–2015; GEM’s “Dittelsheim-Heßloch” matches the 4 Enercon E-82 from 2013: same area, different phase',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Welsow'):
        ('MaStR 的「Windpark Welsow」是 2021 年的 2 部 Enercon E138；GEM「Kerkow-Welsow」已對到 2023 年的 2 部 Nordex N149：同地點不同期',
         'MaStR’s “Windpark Welsow” is 2 Enercon E138 from 2021; GEM’s “Kerkow-Welsow” matches the 2 Nordex N149 from 2023: same area, different phase',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Gnannenweiler'):
        ('MaStR 的「Gnannenweiler」是 2021 年的 2 部 Enercon E138；GEM「Gnannenweiler Windnetz」已對到 2009 年的 Enercon E82：同地點不同期',
         'MaStR’s “Gnannenweiler” is 2 Enercon E138 from 2021; GEM’s “Gnannenweiler Windnetz” matches the Enercon E82 from 2009: same area, different phase',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
}

GEM_KEEP = {
    ('JPN', 'Kakegawa wind farm'):
        ('日本風力開發的掛川風力發電所（6 部 2,300 kW、13.8 MW，2020 年）與黑潮風力發電的遠州掛川風力發電所（7 部 Enercon，2011 年）是相鄰的兩座風場',
         'Japan Wind Development’s Kakegawa wind farm (6 × 2,300 kW, 13.8 MW, 2020) and Kuroshio Wind Power’s Enshu Kakegawa (7 Enercon units, 2011) are two neighbouring farms',
         'https://www.pref.shizuoka.jp/kurashikankyo/kankyo/assessetc/1002648/1017974.html'),
    ('CHN', 'Gansu Minqin Hongshagang 1 wind farm'):
        ('民勤紅沙崗第一風電場（中廣核，400 MW）是紅沙崗基地裡獨立的一座；舊建置把它併進後來刪除的整區彙總「Minqin Hongshagang」，整座消失',
         'Minqin Hongshagang No. 1 (CGN, 400 MW) is a separate farm in the Hongshagang base; the old build merged it into the area-wide aggregate “Minqin Hongshagang”, which was later removed, so the farm vanished',
         'https://www.gem.wiki/Gansu_Minqin_Hongshagang_1_wind_farm'),
    ('KOR', 'YEP wind farm'):
        ('韓華建設的英陽風場（76 MW、22 部 3.45 MW）與 2008 年 Macquarie 的英陽風場不同；舊建置把它併進後來判為重複刪除的精選「Yeongyang」',
         'Hanwha’s Yeongyang farm (76 MW, 22 × 3.45 MW) is not Macquarie’s 2008 Yeongyang farm; the old build merged it into the curated “Yeongyang”, later removed as a duplicate',
         'https://www.etoday.co.kr/news/view/1988572'),
    ('KOR', 'Yeongyang 2nd wind power generation'):
        ('英陽第二風場（GS E&R 70%、韓國中部發電 30%，42 MW）是 2023 年的新風場；舊建置把它併進後來判為重複刪除的精選「Yeongyang」',
         'Yeongyang No. 2 (GS E&R 70%, Korea Midland Power 30%, 42 MW) is a new farm of 2023; the old build merged it into the curated “Yeongyang”, later removed as a duplicate',
         'https://www.fnnews.com/news/202309241852426048'),
    ('CHN', 'Fujian Pingtan Waihai Offshore wind farm'):
        ('三峽平潭外海（111 MW、11 部試驗機組，2023 年 9 月全容量併網）與大唐平潭長江澳是不同的風場；舊建置把它併進後來被刪除的「Datang Pingtan Waihai」，整座消失',
         'CTG’s Pingtan Waihai (111 MW, 11 test turbines, fully connected September 2023) is a different farm from Datang’s Changjiang’ao; the old build merged it into “Datang Pingtan Waihai”, which was later removed, so the farm vanished',
         'http://www.sasac.gov.cn/n2588025/n2588124/c28906372/content.html'),
    ('CHN', 'Jiangsu Rudong H13 (Xiexin) Offshore wind farm'):
        ('協鑫如東 H13（150 MW、30 部海裝 5 MW，2021 年 11 月全容量併網）與華能如東是不同的風場；舊建置把它誤併進「Huaneng Rudong」',
         'GCL’s Rudong H13 (150 MW, 30 Haizhuang 5 MW turbines, fully connected November 2021) is a different farm from Huaneng Rudong; the old build merged it into “Huaneng Rudong” by mistake',
         'https://www.163.com/dy/article/GQ0GC2VI05345ASA.html'),
    ('CHN', 'Guangdong Yangjiang Shaba (Guangdong Energy) Offshore wind farm'):
        ('粵電陽江沙扒（300 MW，2021 年 12 月全容量併網）與三峽陽江沙扒是不同的風場',
         'Guangdong Energy’s Yangjiang Shaba (300 MW, fully connected December 2021) is a different farm from CTG’s Yangjiang Shapa',
         'https://m.bjx.com.cn/mnews/20211206/1191794.shtml'),
    ('CHN', 'Guangdong Yangjiang Nanpengdao (China Energy Conservation) Offshore wind farm'):
        ('中節能陽江南鵬島（300 MW，2021 年 11 月全容量併網）與中廣核南鵬島是不同的風場',
         'CECEP’s Yangjiang Nanpeng Island (300 MW, fully connected November 2021) is a different farm from CGN’s Nanpeng Island',
         'https://wind.in-en.com/html/wind-2412533.shtml'),
    ('CHN', 'Jiangsu Dongtai Zhugensha H2 Offshore wind farm'):
        ('竹根沙 H2（302 MW，浙江新能與中海油）與國華東台四期 H2 是不同的風場',
         'Zhugensha H2 (302 MW, Zhejiang New Energy and CNOOC) is a different farm from Guohua’s Dongtai IV (H2)',
         'https://www.nbd.com.cn/articles/2021-11-03/1978454.html'),
}

# 2026 整理的規劃中專案清單裡、之後已停止開發或已完工商轉（GEM 已列營運中）的專案（國別, 清單上的名稱）→（中文理由, English, 出處）
PIPE_DROP = {
    ('TWN', 'Haiding 1 (Formosa 3)'): ('3.2 期獲配 360 MW（預計 2028 年），2025 年 5 月前經濟部已解除開發權（Corio 與 TotalEnergies 的 Formosa 3）',
                                       'Allocated 360 MW in Round 3.2 (for 2028); by May 2025 the ministry had revoked its development rights (Corio and TotalEnergies’ Formosa 3)',
                                       'https://www.ctee.com.tw/news/20250525700516-430104'),
    ('TWN', 'DeShuai'): ('3.2 期獲配 240 MW（預計 2028 年，德能英華威集團），2025 年 5 月前經濟部已解除開發權',
                         'Allocated 240 MW in Round 3.2 (for 2028, Enervest / InfraVest); by May 2025 the ministry had revoked its development rights',
                         'https://www.ctee.com.tw/news/20250525700516-430104'),
    ('TWN', 'Greater Changhua Northeast'): ('3.2 期原排第 3，因與海廣風場高度重疊而未獲配容量，從未取得開發權（沃旭在 3.3 期改以大肚一號投標）',
                                            'Ranked third in Round 3.2 but dropped because its site overlaps Haiguang (Formosa 6), so it never got a development right (Ørsted bid Dadu 1 in Round 3.3 instead)',
                                            'https://www.cna.com.tw/news/afe/202408050303.aspx'),
    ('KOR', 'Firefly (Bandibuli)'): ('Equinor 於 2026 年 5 月停止開發', 'Equinor stopped the project in May 2026',
                                     'https://www.equinor.co.kr/en/news/important-notice-on-bandibuli-project_en'),
    ('EGY', 'Red Sea Wind Energy (Ras Ghareb)'): ('已於 2025 年 7 月 2 日全面商轉（650 MW，比原訂第三季提前）；GEM 2026-02 以「Ras Ghareb wind farm」第 2、3 期列為營運中，不再當規劃案',
                                               'In full commercial operation since 2 July 2025 (650 MW, ahead of the Q3 target); GEM 2026-02 lists it as operating phases 2 and 3 of “Ras Ghareb wind farm”, so it is no longer a pipeline project',
                                               'https://orascom.com/updates/engie-orascom-construction-ttc-eurus-consortium-starts-full-commercial-operations-of-650-mw-wind-farm-in-egypt-ahead-of-schedule/'),
    ('GBR', 'Dogger Bank B'): ('GEM 2026-02 已把 B、C 兩期（1,235＋1,218 MW）合成一筆「Dogger Bank wind farm · B, C」列為興建中（2026），清單不再需要；'
                              '2025-02 版時清單的這筆會誤對到 Dogger Bank South',
                              'GEM 2026-02 lists phases B and C (1,235 + 1,218 MW) together as “Dogger Bank wind farm · B, C”, under construction (2026), so the '
                              'list entry is no longer needed; with the 2025-02 release it was matched to Dogger Bank South by mistake',
                              'https://www.gem.wiki/Dogger_Bank_wind_farm'),
    ('GBR', 'Dogger Bank C'): ('同上：GEM 2026-02 的「Dogger Bank wind farm · B, C」已含 C 期', 'As above: GEM 2026-02’s “Dogger Bank wind farm · B, C” already covers phase C',
                              'https://www.gem.wiki/Dogger_Bank_wind_farm'),
}

# 2026 整理清單之後才變動的欄位（國別, 清單上的名稱）→（要改的欄位, 中文理由, English, 出處）；在比對清單前套用
PIPE_FIX = {
    ('GBR', 'East Anglia TWO'): (
        {'expected': 2028, 'mw': 960.0},
        '預計運轉年由 2029 改為 2028、容量由 963 改為 960 MW：64 部單樁與轉接段 2026 年下半年才開始製造，預計 2027 年海上施工、2028 年運轉',
        'Expected operation moved from 2029 to 2028 and capacity from 963 to 960 MW: fabrication of the 64 monopiles and transition pieces only starts in H2 2026, '
        'with offshore construction expected in 2027 and operation in 2028',
        'https://www.nsenergybusiness.com/projects/east-anglia-two-offshore-wind-farm/'),
    ('TWN', 'YouDe'): (
        {'mw': 700.0, 'zh': '又德', 'note': 'Round 3.2 (2024, 700 MW); in August 2026 the Energy Administration said the termination was being processed'},
        '名稱改為又德、容量由 1,000 MW 改為 3.2 期獲配的 700 MW；與 GEM 的「Datian Youde」是同一案，合成一筆',
        'Name corrected to Youde (又德) and capacity from 1,000 MW to the 700 MW allocated in Round 3.2; the same project as GEM’s “Datian Youde”, now one record',
        'https://www.cna.com.tw/news/afe/202408050303.aspx'),
    ('TWN', 'Fengmiao 2'): (
        {'mw': 600.0},
        '容量由 500 MW 改為 3.2 期獲配的 600 MW', 'Capacity from 500 MW to the 600 MW allocated in Round 3.2', 'https://www.cna.com.tw/news/afe/202408050303.aspx'),
    ('TWN', 'Huanyang'): (
        {'note': 'Round 3.1; the Energy Administration said in 2026 that the termination was in process'},
        '能源署 2026 年表示蔚藍海彰化（環洋）已在解約程序中，正式解約後再移除', 'The Energy Administration said in 2026 that Huanyang (EDF’s Wei Lan Hai Changhua) is in the termination process; it will be removed once that is final',
        'https://www.nownews.com/news/6859530'),
    ('USA', 'Coastal Virginia Offshore Wind (CVOW)'): (
        {'expected': 2027},
        '預計完工年由 2026 改為 2027：2026 年 8 月開發商表示最後一批風機要到 2027 年底才裝完（當時 176 部裝好 31 部）',
        'Expected completion moved from 2026 to 2027: in August 2026 the developer said the final turbines would only be installed by '
        'the end of 2027 (31 of the 176 were in place then)',
        'https://www.offshorewind.biz/2026/08/03/largest-us-offshore-wind-farm-81-pct-complete-final-turbine-expected-by-end-of-2027'),
}

FIELDS = {'rename': 0, 'zhname': 1, 'lat': 3, 'lon': 4, 'mw': 5, 'year': 6, 'type': 7, 'st': 8, 'end': 9, 'owner': 10, 'turbine': 11, 'ph': 14}
LABEL_ZH = {'rename': '名稱', 'zhname': '中文名', 'lat': '座標', 'lon': '座標', 'mw': '容量', 'year': '年份', 'type': '類型', 'st': '狀態',
            'end': '除役年', 'owner': '業主', 'turbine': '機組', 'ph': '分期'}
LABEL_EN = {'rename': 'name', 'zhname': 'Chinese name', 'lat': 'location', 'lon': 'location', 'mw': 'capacity', 'year': 'year',
            'type': 'type', 'st': 'status', 'end': 'end year', 'owner': 'owner', 'turbine': 'turbines', 'ph': 'phases'}


def apply(rows, rules=RULES):
    """套用規則，回傳 (新的 rows, 套用紀錄)。任何一條對不到剛好一筆就中止。"""
    idx = defaultdict(list)
    for r in rows:
        idx[(r[2], r[0], r[13])].append(r)
    errors, gone, log = [], set(), []

    def one(iso, name, src):
        hits = idx.get((iso, name, src), [])
        if len(hits) != 1:
            errors.append(f"{iso} {SRC_EN[src]} “{name}”: {len(hits)} matching records")
            return None
        return hits[0]

    for c in rules:
        r = one(c['iso'], c['name'], c['src'])
        if r is None:
            continue
        before = list(r)
        if c['act'] == 'dup':
            k = one(c['iso'], *c['keep'])
            if k is None:
                continue
            if not k[10] and r[10]:
                k[10] = r[10]
            if not k[14] and r[14] and abs(sum(p[1] for p in r[14]) - k[5]) <= 0.05 * k[5]:
                k[14] = r[14]
        if c['act'] in ('dup', 'drop'):
            gone.add(id(r))
        for f, v in c['fix'].items():
            if f in FIELDS:
                r[FIELDS[f]] = v
        f = c['fix']
        if 'mw' in f and 'ph' not in f and r[14] and abs(sum(q[1] for q in r[14]) - r[5]) > 0.05 * r[5]:
            r[14] = 0                  # 改了容量、舊分期加總對不上 → 清掉分期（否則時間軸會照舊分期畫）
        if 'lat' in f or 'lon' in f:
            r[12] = (r[12] | 1) if f.get('approx') else (r[12] & ~1)
        if f.get('year') or f.get('st', 0):
            r[12] &= ~2
        if f.get('note'):
            r[15] = [c['zh'], c['en']]
        log.append((c, before, list(r)))
    if errors:
        # 升級 GEM 版本時可設 CLEANUP_LENIENT=1 先建置、看新資料的紀錄名稱，再逐條改寫規則；平常一定中止
        # (set CLEANUP_LENIENT=1 only while upgrading the GEM release, to build first and then rewrite the rules one by one)
        msg = "farm_cleanup: rules no longer match the data (recheck them against the new release):\n  " + "\n  ".join(errors)
        if os.environ.get('CLEANUP_LENIENT'):
            print(msg + "\n  (CLEANUP_LENIENT: continuing without these rules)", file=sys.stderr)
        else:
            raise SystemExit(msg)
    return [r for r in rows if id(r) not in gone], log


def _fmt(x):
    return f"{x:,.1f}".rstrip('0').rstrip('.') if isinstance(x, float) else f"{x:,}"


def write_docs(log, countries, out_dir=ROOT / 'docs'):
    """把套用紀錄寫成 docs/data-cleanup.md（中文）與 docs/data-cleanup.en.md。"""
    names = {c['iso']: (c.get('zh') or c['name'], c['name']) for c in countries}
    names.setdefault('ALA', ('奧蘭', 'Åland'))          # wind_global.json 沒有國家資料的地區
    for lang in ('zh', 'en'):
        zh = lang == 'zh'
        cname = lambda iso: names.get(iso, (iso, iso))[0 if zh else 1]
        by = defaultdict(list)
        for c, before, after in log:
            by[c['iso']].append((c, before, after))
        n_drop = sum(1 for c, *_ in log if c['act'] != 'fix')
        mw_drop = sum(b[5] for c, b, _ in log if c['act'] != 'fix' and b[8] == 0)
        n_fix = sum(1 for c, *_ in log if c['act'] == 'fix')
        L = []
        if zh:
            L += ['# 風場資料清理紀錄', '', '[English](data-cleanup.en.md) ｜ 中文（本頁）', '',
                  '> 由 `tools/build_farms.py` 依 `tools/farm_cleanup.py` 的規則產生，請勿手動編輯。'
                  f'查證時間：{ASOF}（逐筆查證，理由與來源列於下表）。', '',
                  '合併各來源後，逐場資料仍有重複（同一座風場被兩個來源各收一次、或精選的「整區彙總」與 GEM 的逐場資料並存）、'
                  '從未建成的案子被標為營運中，以及錯置的座標。這些以明確規則修正：每條規則指定剛好一筆紀錄，'
                  '上游資料改版後若對不到就讓建置失敗，提醒重新查證。', '',
                  f'- 規則 {len(log)} 條：刪除 {n_drop} 筆（其中營運中 {_fmt(round(mw_drop, 1))} MW），修正 {n_fix} 筆。',
                  '- 另外，比對名稱時先把繁體字轉成簡體（精選清單用繁體、GEM 用簡體），並比對分區代號（H6、K 區…）與陸域／離岸，'
                  '讓江蘇、廣東、山東等地重複收錄的離岸風場能自動併成一筆；`GEM_KEEP` 列出名稱相近但確認是不同風場的例外。',
                  '- 動作：**重複**＝與另一筆是同一座，刪除並把業主、分期併過去；**刪除**＝從未建成、查無此場或是重複的彙總；**修正**＝改正欄位。', '']
        else:
            L += ['# Farm data clean-up log', '', 'English (this page) ｜ [中文](data-cleanup.md)', '',
                  '> Generated by `tools/build_farms.py` from the rules in `tools/farm_cleanup.py`; do not edit by hand. '
                  f'Checked: {ASOF} (record by record; the reason and source for each are listed below).', '',
                  'After the sources are merged, the farm list still had duplicates (the same farm taken from two sources, or a curated '
                  '“whole area” total next to GEM’s farm-by-farm records), projects that were never built but marked as operating, '
                  'and misplaced points. They are fixed with explicit rules: each rule names exactly one record, and the build fails '
                  'if a rule no longer matches after an upstream update, so it gets checked again.', '',
                  f'- {len(log)} rules: {n_drop} records removed ({_fmt(round(mw_drop, 1))} MW of them operating), {n_fix} records fixed.',
                  '- In addition, names are compared after converting Traditional to Simplified Chinese (the curated list uses '
                  'Traditional, GEM Simplified), and zone codes (H6, zone K…) and onshore / offshore are compared too, so offshore '
                  'farms listed twice in Jiangsu, Guangdong, Shandong and elsewhere are merged automatically; `GEM_KEEP` lists the '
                  'exceptions with similar names that were confirmed to be different farms.',
                  '- Actions: **duplicate** = the same farm as another record, removed and its owner and phases merged into that one; '
                  '**removed** = never built, not found, or a duplicate aggregate; **fixed** = fields corrected.', '']
        order = sorted(by, key=lambda iso: cname(iso))
        L += ['| ' + ('國家 | 刪除 | 營運中 MW | 修正' if zh else 'Country | Removed | Operating MW | Fixed') + ' |', '|---|---:|---:|---:|']
        for iso in order:
            items = by[iso]
            nd = sum(1 for c, *_ in items if c['act'] != 'fix')
            md = sum(b[5] for c, b, _ in items if c['act'] != 'fix' and b[8] == 0)
            nf = sum(1 for c, *_ in items if c['act'] == 'fix')
            L.append(f"| {cname(iso)} | {nd} | {_fmt(round(md, 1))} | {nf} |")
        L.append('')
        for iso in order:
            L += [f"## {cname(iso)} ({iso})", '',
                  '| ' + ('紀錄 | 來源 | 動作 | 理由 | 出處' if zh else 'Record | Source | Action | Reason | Source link') + ' |',
                  '|---|---|---|---|---|']
            for c, b, a in by[iso]:
                rec = f"{b[0]} · {_fmt(b[5])} MW" + (f" · {b[6]}" if b[6] else '')
                if c['act'] == 'dup':
                    act = (f"重複（併入「{c['keep'][0]}」）" if zh else f"duplicate of “{c['keep'][0]}”")
                elif c['act'] == 'drop':
                    act = '刪除' if zh else 'removed'
                else:
                    ch = list(dict.fromkeys((LABEL_ZH if zh else LABEL_EN)[k] for k in c['fix'] if k in FIELDS))
                    act = ('修正：' if zh else 'fixed: ') + ('、' if zh else ', ').join(ch)
                src = (SRC_ZH if zh else SRC_EN)[c['src']]
                link = f"[{'連結' if zh else 'link'}]({c['url']})" if c['url'] else ('資料比對' if zh else 'data comparison')
                L.append(f"| {rec} | {src} | {act} | {c['zh'] if zh else c['en']} | {link} |")
            L.append('')
        L += ['## ' + ('規劃中專案清單（2026 整理）裡不收錄的專案' if zh else 'Projects left out of the 2026 pipeline compilation'), '',
              '| ' + ('專案 | 理由 | 出處' if zh else 'Project | Reason | Source link') + ' |', '|---|---|---|']
        for (iso, name), (rz, re_, url) in PIPE_DROP.items():
            L.append(f"| {name} ({iso}) | {rz if zh else re_} | [{'連結' if zh else 'link'}]({url}) |")
        L.append('')
        L += ['## ' + ('規劃中專案清單（2026 整理）之後才變動的欄位' if zh else 'Fields changed since the 2026 pipeline compilation'), '',
              '| ' + ('專案 | 修正 | 理由 | 出處' if zh else 'Project | Change | Reason | Source link') + ' |', '|---|---|---|---|']
        for (iso, name), (f, rz, re_, url) in PIPE_FIX.items():
            ch = ', '.join(f'{k}={v}' for k, v in f.items())
            L.append(f"| {name} ({iso}) | {ch} | {rz if zh else re_} | [{'連結' if zh else 'link'}]({url}) |")
        L.append('')
        L += ['## ' + ('不當成重複的 GEM 專案' if zh else 'GEM projects kept apart'), '',
              '| ' + ('專案 | 理由 | 出處' if zh else 'Project | Reason | Source link') + ' |', '|---|---|---|']
        for (iso, name), (rz, re_, url) in GEM_KEEP.items():
            L.append(f"| {name} ({iso}) | {rz if zh else re_} | [{'連結' if zh else 'link'}]({url}) |")
        L.append('')
        L += ['## ' + ('已查證不是重複（覆蓋率報告不再列）' if zh else 'Checked, not duplicates (left out of the coverage report)'), '',
              '| ' + ('風場 | 理由 | 出處' if zh else 'Farm | Reason | Source link') + ' |', '|---|---|---|']
        for (iso, name), (rz, re_, url) in NOT_DUP.items():
            L.append(f"| {name} ({iso}) | {rz if zh else re_} | [{'連結' if zh else 'link'}]({url}) |")
        L.append('')
        (out_dir / ('data-cleanup.md' if zh else 'data-cleanup.en.md')).write_text('\n'.join(L), encoding='utf-8')


def summary(log):
    return {"asof": ASOF, "rules": len(log), "removed": sum(1 for c, *_ in log if c['act'] != 'fix'),
            "fixed": sum(1 for c, *_ in log if c['act'] == 'fix'), "doc": "docs/data-cleanup.md"}


if __name__ == '__main__':
    print(len(RULES), 'rules;', len(GEM_KEEP), 'GEM projects kept apart')
    print(json.dumps(summary([(c, [0] * 17, None) for c in RULES]), ensure_ascii=False))
