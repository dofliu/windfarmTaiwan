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
    fix('VNM', 'Tân An 1 offshore wind farm', G, '新安 1 號三部分都已商轉：一期 25 MW（2021，工貿部 FIT 名單）、2021–2025 期 45 MW（EVN 2023-08-18 表已 COD；金甌工貿廳 2024-04 檢查的運轉中風場也列入）、2021–2025 期另 30 MW 的 7 部（29.4 MW，2025 年 1 月 31 日表仍未送件、2 月 28 日表已 COD）；合計 99.4 MW、2025 年全部完成。取代 2026-09 那條「後續各期到 2024 年仍未併網」的規則（它引用的青年報其實把 45 MW 列為運轉中）', 'All three parts of Tan An 1 are in operation: phase 1, 25 MW (2021, MOIT’s FIT list); the 2021–2025 phase of 45 MW (at COD in EVN’s 18 Aug 2023 tracker, and among the operating farms the Ca Mau trade department inspected in April 2024); and the other 2021–2025 phase of 30 MW, whose 7 turbines (29.4 MW) were not yet filed on 31 Jan 2025 and at COD on 28 Feb 2025; 99.4 MW in all, complete in 2025. Replaces the Sep 2026 rule saying the later phases were still not connected in 2024 (the Thanh Nien article it cites lists the 45 MW phase as operating)', 'https://www.evn.com.vn/userfile/User/giangtcdl/files/2025/3/28022025capnhatCODduanNLTTchuyentiep-20250311103857508.pdf', mw=99.4, year=2025, ph=[[2021, 25], [2023, 45], [2025, 29.4]], note=True),
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
    fix('CHN', 'Huadian Yuhuan 2', C, '開發商是華能（與晶科合作），不是華電', 'Developed by Huaneng (with Jinko), not Huadian',
        'https://m.bjx.com.cn/mnews/20240129/1358593.shtml', rename='Huaneng Yuhuan 2', zhname='華能玉環2號',
        owner='Huaneng (Zhejiang) Energy Development; JinkoSolar'),
    fix('CHN', 'Huadian Yuhuan 2', C,
        '華能玉環 2 號核准變更後為 508 MW、31 部（25 部 16 MW＋6 部 18 MW；環評報告書報批稿，中國風能協會 2025-04 同）；原寫 504 MW（2023 年原核准的 36 部 14 MW）與「8–10 MW 級」。'
        '2025 年 4 月才完成陸上工頻系統倒送電（「向併網發電邁出關鍵一步」），GEM 2026-02 仍列興建中，查無全容量併網報導，所以「2024 年營運中」不對，改為興建中、年份未定',
        'After the approval change Huaneng Yuhuan 2 is 508 MW with 31 turbines (25 × 16 MW + 6 × 18 MW; EIA report for approval, and CWEEA, Apr 2025); it was stored as 504 MW '
        '(the original 2023 approval of 36 × 14 MW) of “8–10 MW class”. Its onshore power-frequency system was only back-energised in April 2025 (“a key step towards grid '
        'connection”), GEM (Feb 2026) still lists it under construction and no full-connection report was found, so “operating since 2024” is wrong: set to under construction with no year',
        'https://www.cweea.com.cn/xwdt/html/40264.html', mw=508, st=1, year=0, turbine='25x 16 MW + 6x 18 MW (planned)'),
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
        '2 號機 2023 年 2 月 21 日齒輪箱損壞緊急停機，1 號機也因老化常出故障；町公所 2025 年 9 月審查決算時說明 2024 年度（2024 年 4 月起）已停止發電。2026 年 4 月町公所決定 2027 年度撤除',
        'Unit 2 made an emergency stop with a broken gearbox on 21 February 2023 and ageing unit 1 kept breaking down; at the review of the accounts in '
        'September 2025 the town said generation had stopped from FY2024 (April 2024). In April 2026 the town decided to remove it in FY2027',
        'https://www.town.setana.lg.jp/gikai/745f1de0a8c0ef02111284d7a3b4a4b6.pdf', end=2024, note=True),
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
        '靈光風電（35 部、79.6 MW）中立在潮間帶的 15 部 2.3 MW＝34.5 MW（電子新聞 2020-02）；座標改為 OpenStreetMap 風場關係「영광 해상풍력」'
        '（relation 17551812：營運者영광풍력발전的 15 部 2.3 MW）的中心，北緯 35.259°、東經 126.326°（© OpenStreetMap 貢獻者）；GEM 原座標是公司登記地址',
        'The 15 × 2.3 MW turbines (34.5 MW) that stand in the intertidal zone of the Yeonggwang Wind complex (35 turbines, 79.6 MW; Electronic Times, Feb 2020); '
        'the point moves to the centre of the OpenStreetMap wind-farm relation “영광 해상풍력” (relation 17551812: 15 turbines of 2.3 MW operated by 영광풍력발전), '
        '35.259 N, 126.326 E (© OpenStreetMap contributors); GEM’s point was the company’s registered address',
        'https://www.openstreetmap.org/relation/17551812', mw=34.5, turbine='15 x Unison U113 2.3 MW', lat=35.259, lon=126.326, note=True),
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
        '湛江徐聞 600 MW（南、北兩個標段各 47 台，94 台 2021 年 11 月 26 日全部併網）是國家電投的風場，這筆「粵電徐聞 300 MW」只是其中一半；GEM 的徐聞一筆已含 600 MW 原場與 300 MW 增容',
        'The Zhanjiang Xuwen 600 MW farm (two lots of 47 turbines; all 94 on the grid on 26 November 2021) is SPIC’s; this “Guangdong Energy Xuwen 300 MW” row is half of it, and GEM’s Xuwen record already carries the 600 MW farm plus the 300 MW extension',
        'https://m.gdzjdaily.com.cn/p/2816813.html'),
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
    dup('CHN', 'Jiangsu Dafeng H10 (Three Gorges) Offshore wind farm', G, ('Guoxin Dafeng 850 MW', C),
        '新浪財經 2025-03-13（國信集團稿）：江蘇國信大豐 85 萬千瓦項目包含大豐H1#、H2#、H10#、H16#，100 台 8.5 MW，2025 年全容量併網；大豐港務 2025-03 載三峽在大豐 2021 年建成的是 H8-2。查無「三峽大豐H10」155 MW／2021，大豐唯一的 H10# 場址屬國信（150 MW），已含在精選紀錄「Guoxin Dafeng 850 MW」，此筆刪除。',
        "Sina Finance (2025-03-13, Guoxin release): Jiangsu Guoxin's 850 MW Dafeng project comprises Dafeng H1#, H2#, H10# and H16#, 100 x 8.5 MW, due for full grid connection in 2025; the Dafeng government (2025-03) says what CTG built at Dafeng in 2021 was H8-2. No 'CTG Dafeng H10' of 155 MW / 2021 exists; the only H10# site at Dafeng is Guoxin's 150 MW block, part of the curated “Guoxin Dafeng 850 MW”, so delete this record.",
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
        '國資委／走出去導航網（2023-04-13）：越南金甌 1 號風電項目總裝機 350 MW（非 352），分 A、B、C、D 四個風場，業主越南建設貿易股份公司（WTO），選用明陽 MySE5.0-166 海上風機；中國電建 2023 年 4 月完成的是 1A 區全部風機吊裝。',
        'SASAC and goalfore.cn (2023-04-13): the Ca Mau 1 project totals 350 MW (not 352) in four areas A-D, owner Vietnam Trading Construction Works Organization (WTO), using Mingyang MySE5.0-166 turbines; what PowerChina finished in April 2023 was hoisting all turbines in area 1A.',
        'http://www.sasac.gov.cn/n2588025/n2588124/c19372635/content.html', mw=350, turbine='Mingyang MySE5.0-166'),
    fix('VNM', 'Bac Lieu Phase 3', C,
        '薄寮三期尚未完工：Mekong ASEAN 2025-04-24 報導 2025 年 4 月才恢復安裝首台機組，容量 141 MW、47 座金風 3 MW 無齒輪箱機組，2025 年內預計僅安裝 99 MW；越通社 2026-03-18 報導 47 座中完成 33 座，目標 2026 年第二季送電運轉，故改為興建中、預計 2026 年。',
        'Bac Lieu phase 3 is not finished: Mekong ASEAN (2025-04-24) reported the first turbine was only installed in April 2025 after a stoppage, 141 MW with 47 Goldwind 3 MW gearless turbines and only 99 MW planned for 2025; VietnamPlus (2026-03-18) reports 33 of 47 turbines completed and a target of energisation in Q2 2026, so status is under construction, expected 2026.',
        'https://mekongasean.vn/tiep-tuc-trien-khai-lap-dat-nha-may-dien-gio-bac-lieu-giai-doan-3-40791.html', st=1, year=2026, mw=141, turbine='47x Goldwind 3 MW'),
    fix('VNM', 'Soc Trang 1 Phase 1 (Cong Ly)', C,
        '越通社 2018-01-30 開工報導：朔莊公理風電廠由 Công ty Cổ phần Super Wind Energy Công Lý Sóc Trăng 投資（業主），一期原規劃 15 座、每座 2 MW、共 30 MW（建成為 10 部 3 MW，見 2026-10-07 第五批之二）。',
        'VietnamPlus (2018-01-30 groundbreaking): the Cong Ly Soc Trang wind plant is invested by Super Wind Energy Cong Ly Soc Trang JSC, phase 1 planned with 15 turbines of 2 MW each (30 MW; built with 10 × 3 MW, see the second part of the 7 Oct 2026 fifth batch).',
        'https://www.vietnamplus.vn/khoi-cong-xay-dung-nha-may-dien-gio-dau-tien-tai-soc-trang-post486569.vnp', owner='Super Wind Energy Cong Ly Soc Trang JSC'),
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
        'https://www.offshorewind.biz/2026/06/10/windanker-turbine-components-arriving-at-german-port-ahead-of-offshore-installation/', mw=315, year=2027),
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
    drop('KOR', 'Ulsan Dongbu floating demo (Vindmøllen 750 kW)', C, '蔚山 750 kW 浮動式示範機從未在海上安裝：2019 年 11 月蔚州郡四度退回細部設計、無法下海；2025 年政府的風電研發企畫報告說 750 kW 浮動式實證「曾嘗試」、因取得實證海域困難而受阻，2025 年 9 月 KISTEP 報告說韓國沒有浮動式離岸風電的運送安裝實例', 'The Ulsan 750 kW floating demonstrator was never installed at sea: in November 2019 Ulju County had rejected its detailed design four times; the government’s 2025 wind R&D planning report says a 750 kW floating demonstration was “attempted” and held back by the difficulty of securing a test site, and a KISTEP report of September 2025 says Korea has no case of transporting and installing floating offshore wind', 'https://www.kistep.re.kr/boardDownload.es?bid=0067&list_no=94369&seq=1'),
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
    drop('CHN', "Zhangpu Liu'ao Phase 1", C,
        '六鰲沒有 2022 年營運的「一期」：福建省 2023-02 的報導說漳浦六鰲已核准 800 MW，由漳浦 D 區與漳浦二期兩個項目組成；二期 2023-02 開工時是「閩南地區首個海上風電項目」，2024-06 全容量併網'
        '（精選「CTG Zhangpu Liu\'ao Phase 2」）；D 區（402 MW）查無開工紀錄，由 GEM 的 D 區紀錄代表',
        "Liu'ao has no 'phase 1' operating since 2022: a Fujian government report of Feb 2023 says Zhangpu Liu'ao has 800 MW approved, made up of the Zhangpu area D project and the Zhangpu phase 2 project; phase 2 started in Feb 2023 as 'the first offshore wind project in southern Fujian' and was fully connected in June 2024 (the curated “CTG Zhangpu Liu'ao Phase 2”); area D (402 MW) has no record of construction and is represented by GEM's area D record",
        'https://gxt.fj.gov.cn/zwgk/xw/hydt/snhydt/202302/t20230206_6103398.htm'),
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
    fix('CHN', 'Shanghai Fengxian Haiwan Expansion Offshore wind farm', G, '財政部 2013-03 可再生能源電價附加補助目錄：「上海新能源環保工程公司奉賢海灣風電場擴容 14.75MW 發電工程」。奉賢海灣風電場本身是陸上風電場（新浪 2007-02：上海已建的 3 處陸上風電場之一），同一業主為它申報的汰換案「奉賢海灣風電（場）一期擴容工程」在上海市發改委 2023–2026 年的清單都列為陸上風電；沒有任何出處說擴容的機組在海上（GEM 的「海上」只引 CDM 5636 號，讀不到），改為陸域', 'The Ministry of Finance subsidy catalogue (March 2013) lists the “Fengxian Haiwan wind farm expansion 14.75 MW” of Shanghai New Energy & Environmental Protection Engineering. The Fengxian Haiwan farm itself is an onshore farm (Sina, Feb 2007: one of Shanghai’s three onshore farms), and the same owner’s repowering of it (“Fengxian Haiwan wind farm phase 1 expansion”) is listed as onshore wind in the Shanghai DRC lists of 2023–2026; no source puts the expansion’s turbines at sea (GEM’s ‘offshore’ cites only CDM project 5636, which cannot be read), so the type becomes onshore', 'http://jjs.mof.gov.cn/tongzhigonggao/201303/P020130308403305257355.pdf', mw=14.75, owner='Shanghai New Energy and Environmental Protection Engineering Co Ltd', type=0, note=True, rename='Shanghai Fengxian Haiwan Expansion wind farm'),
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
        '這筆是中廣核象山塗茨海上風電場（象山縣東北部塗茨外海，與 GEM 的 Xiangshan Tuci 同點），不是國電象山 1 號一期（鶴浦鎮東南海域，已含在 GEM 的象山 1 號），原名「Xiangshan 1 Phase 1」是混名。'
        '一期已併網（寧波日報 2025-07），風機由中國海裝供應（日立能源 2022-07 新聞稿、券商報告），8 MW 級；原寫「明陽 6.45 MW」不對。'
        '變更海域使用論證報告（2022-08 調整批覆後成稿）寫「目前尚未投產建設」，所以「2022 年」不對；中郵證券 2023-10 研報列「中廣核象山塗茨 280 MW、23 年已併網」，GEM 也寫 2023，'
        '年份改 2023（業主的全容量併網公告待查證）；寧波海事局 2024-11 通告寫「已建成投用」、38 台 8 MW（舊說的 35 部、280 MW 是調整前的數字）',
        "This is CGN's Xiangshan Tuci offshore wind farm (off Tuci, north-east of Xiangshan county, the same point as GEM's Xiangshan Tuci), not Guodian's Xiangshan 1 phase 1 "
        "(south-east of Hepu, already in GEM's Xiangshan 1); “Xiangshan 1 Phase 1” in the name was a mix-up. Phase 1 is connected (Ningbo Daily, July 2025), with CSSC "
        "Haizhuang 8 MW-class turbines (Hitachi Energy release, July 2022; broker report), not 'Mingyang 6.45 MW'. A sea-use change report written after the August 2022 "
        "adjustment approval says it was 'not yet in construction', so 2022 is wrong; a China Post Securities report (Oct 2023) lists “CGN Xiangshan Tuci 280 MW, connected "
        "in 2023” and GEM also gives 2023, so the year is 2023 (the owner's full-connection notice is unverified); a Ningbo MSA notice (Nov 2024) says it is “built and in use” with 38 × 8 MW (the earlier 35 turbines, 280 MW, predate the amendment)",
        'https://file.iyanbao.com/pdf/3023a-06643cec-e616-4cde-aed1-4d8ef822d202.pdf', turbine='CSSC Haizhuang 8 MW class', note=True,
        rename='CGN Xiangshan Tuci', year=2023),
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
        'http://www.spic.com.cn/xtdt1/202412/t20241218_324623.html', turbine='94x 6.45 MW + 25x 12 MW'),
    fix('CHN', 'Guangdong Zhanjiang Xuwen Offshore wind farm', G,
        '徐聞 600 MW 原場：北區 47 台 2021 年 11 月 19 日全容量併網，南區最後一台 S56 於 11 月 26 日併網，94 台 6.45 MW 全部併網（湛江日報 2021-11-26）；原場原寫 2022 年',
        'The original 600 MW Xuwen farm: the north lot (47 units) was fully connected on 19 Nov 2021 and the last south-lot unit, S56, on 26 Nov 2021, putting all 94 × 6.45 MW '
        'turbines on the grid (Zhanjiang Daily, 26 Nov 2021); the original farm was dated 2022',
        'https://m.gdzjdaily.com.cn/p/2816813.html', year=2021, ph=[[2021, 606.0], [2024, 300.0]]),
    fix('CHN', 'Jiangsu Dongtai Zhugensha H1 Offshore wind farm', G,
        '國華東台五期（竹根沙 H1#）裝 50 台上海電氣 4.0-146（中國能源報，2020-06 首台吊裝）；原本機型欄空白',
        'Guohua Dongtai phase V (Zhugensha H1#) has 50 Shanghai Electric 4.0-146 turbines (China Energy News, first turbine installed June 2020); the turbine field was empty',
        'https://paper.people.com.cn/zgnyb/html/2020-06/22/content_1993858.htm', turbine='50x Shanghai Electric 4.0-146'),
    fix('CHN', 'Jiangsu Dongtai Zhugensha H2 Offshore wind farm', G,
        '竹根沙 H2# 總裝機 302 MW，含 50 台 4.0 MW 與 17 台 6.0 MW（中國可再生能源學會風能專委會轉 EPC 承包商，2020-09）；原本機型欄空白',
        'Zhugensha H2# is 302 MW with 50 × 4.0 MW and 17 × 6.0 MW turbines (CWEEA citing the EPC contractor, Sept 2020); the turbine field was empty',
        'https://www.cweea.com.cn/xwdt/html/31056.html', turbine='50x 4.0 MW + 17x 6.0 MW'),
    # ------------------------------------------------ 2026-10-07 第四批（第十輪查到的資料問題；出處原文以 check_quotes.py 核對）
    fix('VNM', 'Tan Phu Dong 2 (Tien Giang, GEC)', C,
        '新富東 2 號裝 12 部 Vestas V150-4.2 MW（Power Technology），不是遠景；EPC 為 PC1', 'Tan Phu Dong 2 has 12 Vestas V150-4.2 MW turbines (Power Technology), not Envision; EPC by PC1',
        'https://power-technology.com/?p=174203', turbine='12x Vestas V150-4.2'),
    fix('CHN', 'Jiangsu Dafeng H4 Offshore (Longyuan) wind farm', G,
        '大豐 H4 竣工為 47 台 6.45 MW（龍源鹽城新能源 2025-11 招標公告）；原本機型欄空白', 'Dafeng H4 was built with 47 × 6.45 MW turbines (Longyuan Yancheng tender notice, Nov 2025); the turbine field was empty',
        'http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20251129/c09f1385-66c8-4ffb-b075-750f71961119.html', turbine='47x 6.45 MW'),
    fix('CHN', 'Jiangsu Dafeng H6 Offshore (Longyuan) wind farm', G,
        '大豐 H6 為 47 台 6.45 MW（龍源鹽城新能源 2025-11 招標公告）；原本機型欄空白', 'Dafeng H6 has 47 × 6.45 MW turbines (Longyuan Yancheng tender notice, Nov 2025); the turbine field was empty',
        'http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20251129/c09f1385-66c8-4ffb-b075-750f71961119.html', turbine='47x 6.45 MW'),
    fix('CHN', 'Jiangsu Dafeng H12 Offshore (Longyuan) wind farm', G,
        '大豐 H12 共 80 台（龍源 2020-10 招標公告），為金風 GW109/2500（中國能源網 2017 年施工中的概況，55 台在潮間帶、25 台在深水區）；原本機型欄空白',
        'Dafeng H12 has 80 turbines (Longyuan tender notice, Oct 2020), Goldwind GW109/2500 (China5e overview during construction in 2017: 55 intertidal, 25 in deeper water); the turbine field was empty',
        'https://www.china5e.com/news/news-1004814-1.html', turbine='80x Goldwind GW109/2500'),
    fix('CHN', 'Jiangsu Sheyang Southern Area H2-1 Offshore wind farm', G,
        '射陽南區 H2-1# 共 23 台（射陽龍源 2022-01 招標公告），海上射陽風電場共 90 台 4.5 MW（67＋23，江蘇海上龍源 2025-08）；原本機型欄空白',
        'Sheyang South H2-1# has 23 turbines (Sheyang Longyuan tender notice, Jan 2022), and the Sheyang offshore farm has 90 × 4.5 MW in all (67 + 23, Jiangsu Offshore Longyuan, Aug 2025); the turbine field was empty',
        'http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20220126/a64913cb-cf9d-4f39-8a5f-8d3af8011429.html', turbine='23x 4.5 MW'),
    # ------------------------------------------------ 2026-10-07 第五批（第十一輪資料疑點；出處原文以 check_quotes.py 核對）
    fix('CHN', 'Jiangsu Jiangjiasha H1 Offshore wind farm · 1', G, '龍源海安蔣家沙 300 MW（2018 年建成，75 部遠景 4 MW；世紀新能源網 2025）：江蘇海事局 2022 年航行通告寫 67 號風機中心座標 32°39.011′N、121°07.280′E；座標改到這部風機（概略位置，風場範圍在其周圍），原點 31.773 N、121.105 E 在長江口，偏南約 100 km', 'Longyuan’s Hai’an Jiangjiasha 300 MW farm (built 2018, 75 Envision 4 MW turbines; ne21 2025): a 2022 Jiangsu MSA notice gives the centre of turbine 67 as 32°39.011′N, 121°07.280′E; point moved to that turbine (approximate, the farm lies around it); the old point, 31.773 N 121.105 E, was in the Yangtze estuary about 100 km to the south', 'https://www.js.msa.gov.cn/art/2022/5/27/art_75_1350583.html', lat=32.650, lon=121.121, approx=True, turbine='75x Envision 4 MW'),
    fix('CHN', 'Jiangsu Jiangjiasha H2 Offshore wind farm', G, '江蘇海事局 2022 年航行通告：蔣家沙（H2#）300MW 海上風電場 43 號風機座標 32°44′30.44″N、121°14′12.96″E（建設單位九思海上風力發電如東）；同年另一通告的維護作業水域（11 點連線）也在北緯 32.68–32.78°。座標改到 43 號風機（概略位置），原點 31.773 N、121.105 E 在長江口，偏南約 110 km', 'Jiangsu MSA notices (2022): turbine 43 of the Jiangjiasha (H2#) 300 MW farm stands at 32°44′30.44″N, 121°14′12.96″E (developer Jiusi Offshore Wind Rudong); another notice’s maintenance area (11 points) also lies at 32.68–32.78° N. Point moved to turbine 43 (approximate); the old point, 31.773 N 121.105 E, was in the Yangtze estuary about 110 km to the south', 'https://js.msa.gov.cn/art/2022/4/18/art_280_1339155.html', lat=32.742, lon=121.237, approx=True),
    fix('CHN', 'Jiangsu Rudong H2 (Guoxin) Offshore wind farm', G, '國信如東 H2#（350 MW）的 70 台中國海裝 H171-5MW 機組 2021 年 12 月 1 日全部並網（中國海裝新聞稿；江蘇省國資委寫共 70 台 5 MW、12 月 1 日全部機組並網）；原機型欄空白', 'All 70 CSSC Haizhuang H171-5MW turbines of Guoxin Rudong H2# (350 MW) were on the grid on 1 Dec 2021 (CSSC Haizhuang release; Jiangsu SASAC gives 70 × 5 MW and all units connected on 1 Dec); the turbine field was empty', 'http://www.hzwindpower.com/zongbuxinwen/20211220092246.html', turbine='70x CSSC Haizhuang H171-5.0'),
    fix('CHN', 'Guoxin Dafeng 850 MW', C, '國信大豐 85 萬千瓦：四個場址（H1#、H2#、H10#、H16#）共 100 部 8.5 MW，2025 年 12 月 29 日全容量併網（中國能建，2026-01；人民日報 2026-01-06）；2024 年 6 月風機標由金風科技預中標。原寫「明陽／金風 10–16 MW」', 'Guoxin Dafeng 850 MW: four sites (H1#, H2#, H10#, H16#) with 100 × 8.5 MW turbines, fully connected on 29 Dec 2025 (China Energy Engineering, Jan 2026; People’s Daily, 6 Jan 2026); Goldwind was the preferred bidder for the turbines in June 2024. Was “Mingyang/Goldwind 10–16 MW”', 'https://www.ceec.net.cn/art/2026/1/6/art_11019_2537923.html', turbine='100x Goldwind 8.5 MW'),
    dup('CHN', 'Jiangsu Dafeng H1 (Guoxin) Offshore wind farm', G, ('Guoxin Dafeng 850 MW', C), '國信大豐 85 萬千瓦（H1#、H2#、H10#、H16# 四個場址，100 部 8.5 MW）2025 年 12 月 29 日全容量併網；精選紀錄「Guoxin Dafeng 850 MW」已是整案，GEM 的四個場址紀錄重複（這筆是 H1#，200 MW）', 'Guoxin’s Dafeng 850 MW project (sites H1#, H2#, H10# and H16#, 100 × 8.5 MW) reached full grid connection on 29 Dec 2025; the curated record “Guoxin Dafeng 850 MW” already covers the whole project, so GEM’s four site records are duplicates (this one is H1#, 200 MW)', 'https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml'),
    dup('CHN', 'Jiangsu Dafeng H2 (Guoxin) Offshore wind farm', G, ('Guoxin Dafeng 850 MW', C), '國信大豐 85 萬千瓦（H1#、H2#、H10#、H16# 四個場址，100 部 8.5 MW）2025 年 12 月 29 日全容量併網；精選紀錄「Guoxin Dafeng 850 MW」已是整案，GEM 的四個場址紀錄重複（這筆是 H2#，300 MW）', 'Guoxin’s Dafeng 850 MW project (sites H1#, H2#, H10# and H16#, 100 × 8.5 MW) reached full grid connection on 29 Dec 2025; the curated record “Guoxin Dafeng 850 MW” already covers the whole project, so GEM’s four site records are duplicates (this one is H2#, 300 MW)', 'https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml'),
    dup('CHN', 'Jiangsu Dafeng H10 (Guoxin) Offshore wind farm', G, ('Guoxin Dafeng 850 MW', C), '國信大豐 85 萬千瓦（H1#、H2#、H10#、H16# 四個場址，100 部 8.5 MW）2025 年 12 月 29 日全容量併網；精選紀錄「Guoxin Dafeng 850 MW」已是整案，GEM 的四個場址紀錄重複（這筆是 H10#，150 MW）', 'Guoxin’s Dafeng 850 MW project (sites H1#, H2#, H10# and H16#, 100 × 8.5 MW) reached full grid connection on 29 Dec 2025; the curated record “Guoxin Dafeng 850 MW” already covers the whole project, so GEM’s four site records are duplicates (this one is H10#, 150 MW)', 'https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml'),
    dup('CHN', 'Jiangsu Dafeng H16 (Guoxin) Offshore wind farm', G, ('Guoxin Dafeng 850 MW', C), '國信大豐 85 萬千瓦（H1#、H2#、H10#、H16# 四個場址，100 部 8.5 MW）2025 年 12 月 29 日全容量併網；精選紀錄「Guoxin Dafeng 850 MW」已是整案，GEM 的四個場址紀錄重複（這筆是 H16#，200 MW）', 'Guoxin’s Dafeng 850 MW project (sites H1#, H2#, H10# and H16#, 100 × 8.5 MW) reached full grid connection on 29 Dec 2025; the curated record “Guoxin Dafeng 850 MW” already covers the whole project, so GEM’s four site records are duplicates (this one is H16#, 200 MW)', 'https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml'),
    fix('CHN', 'SPIC Binhai South H3', C, '國家電投濱海南 H3（300 MW）2020 年 12 月 31 日全容量併網，裝 75 台上海電氣 W4000-146（電氣風電，2024）；原寫 2019 年，業主欄誤為大唐／國信（來自被自動併入的大唐濱海紀錄）', 'SPIC Binhai South H3 (300 MW) reached full grid connection on 31 Dec 2020 with 75 Shanghai Electric W4000-146 turbines (Shanghai Electric Wind Power, 2024); the row said 2019 and its owner field was Datang/Guoxin (taken from the Datang Binhai record merged into it by the build)', 'http://windpower.cpem.org.cn/contents/31/1370.html', year=2020, turbine='75x Shanghai Electric W4000-146', owner='SPIC Jiangsu Electric Power Co Ltd'),
    fix('CHN', 'Shandong Bohai B1 offshore wind farm', G, '渤中 B 場址規劃 1,000 MW，山東能源負責西側 500 MW：其中 400 MW（47 部 8.5 MW）2022 年底已建成，是精選紀錄「Shandong Energy Bozhong B」；剩下的 100 MW 才是「渤中海上風電基地 B1 項目」（8 部 8.5 MW＋4 部 8 MW，接入已建的 B 場址升壓站），2024 年 10 月招標、2025 年 6 月國資委仍寫「正在建設、將於近期併網」。GEM 的 500 MW 把已建的 400 MW 重算一次，改為 100 MW 的續建案，維持興建中', 'Bozhong site B is planned at 1,000 MW, with Shandong Energy developing the western 500 MW: 400 MW of it (47 × 8.5 MW) was built by end-2022 and is the curated record “Shandong Energy Bozhong B”; only the remaining 100 MW is the “Bozhong offshore wind base B1 project” (8 × 8.5 MW + 4 × 8 MW, connected to the existing site-B substation), tendered in Oct 2024 and still “under construction, to be connected soon” per SASAC in June 2025. GEM’s 500 MW counts the built 400 MW again; reduced to the 100 MW extension, kept under construction', 'https://www.ne21.com/news/show-202646.html', rename='Shandong Energy Bozhong B1 (100 MW extension)', zhname='山東能源渤中B1（續建10萬千瓦）', mw=100, turbine='8x 8.5 MW + 4x 8 MW'),
    fix('CHN', 'CGN Huizhou Gangkou I', C, '港口一 250 MW 為 40 部明陽 MySE6.25-180；港口二 750 MW 為 10 部 8.5 MW、45 部 12 MW、9 部 14 MW（含 PA、PB 兩案），全場共 104 部，2023 年 12 月 12 日全容量併網（新華社；CPEM）；原寫「明陽 6.45–8 MW」', 'Gangkou I (250 MW) has 40 Mingyang MySE6.25-180; Gangkou II (750 MW, projects PA and PB) has 10 × 8.5 MW, 45 × 12 MW and 9 × 14 MW; 104 turbines in all, fully connected on 12 Dec 2023 (Xinhua; CPEM); was “Mingyang 6.45–8 MW”', 'https://www.cpem.org.cn/list40/89386.html', turbine='40x Mingyang MySE6.25-180 + 10x 8.5 MW + 45x 12 MW + 9x 14 MW'),
    fix('CHN', 'Guangxi Fangchenggang A', C, '防城港海上風電示範項目 A 場址（83 部 8.5 MW、700 MW）2024 年 1 月首批併網，2025 年 2 月初才全容量併網（廣西日報 2025-02-08、國資委）；原寫 2024 年、機型「明陽 8–16 MW」', 'Fangchenggang demonstration site A (83 × 8.5 MW, 700 MW): first units connected in Jan 2024, full grid connection only in early Feb 2025 (Guangxi Daily, 8 Feb 2025; SASAC); the row said 2024 and “Mingyang 8–16 MW”', 'http://www.gx.xinhua.org/20250208/489586cf99ff4ed8908866faa90a118f/c.html', year=2025, turbine='83x 8.5 MW'),
    fix('CHN', 'Zhuhai Guishan', C,
        "桂山海上風電場：一期 34 部 3 MW（2019 年 5 月已併網 9.3 萬瓩；02#、05#、31# 三部基礎受損的風機 2020 年重建）。「一期後續及二期」2021 年 6 月獲准把原設計（一期未建的 3 部 6 MW、二期 15 部 5.5 MW）改為 7 部 6.45 MW 與 8 部 7 MW（合計 101.15 MW），2021 年 12 月全容量併網時新增 13 部（GlobalData：明陽 MySE6.45-180 5 部、東方電氣 DEW-D7000-186 8 部）；另 2 部裝在筒型基礎上（第一座 2022 年 6 月沉放，筒型基礎工程延至 2025 年 5 月；35#、43# 風機海纜 2024 年 6 月回收重鋪），2024 年加建。廣州海事局 2025 年 7 月建成通告：共 49 部、裝置容量 200 MW（核准容量 198 MW；設計值加總 203.15 MW）。年份仍以 2021 年全容量併網為準；後加的 2 部機型與容量未公布，待查證",
        "Guishan: phase 1 has 34 × 3 MW (93 MW connected by May 2019; three turbines with damaged foundations, 02#, 05# and 31#, were rebuilt in 2020). In June 2021 the “phase-1 follow-up and phase 2” design (the unbuilt 3 × 6 MW of phase 1 and 15 × 5.5 MW of phase 2) was changed to 7 × 6.45 MW and 8 × 7 MW (101.15 MW in all); 13 of them were connected when the farm reached full capacity in December 2021 (GlobalData: 5 Mingyang MySE6.45-180 and 8 Dongfang DEW-D7000-186), and two more on bucket foundations (the first set in June 2022, bucket works extended to May 2025; cables at turbines 35# and 43# re-laid in June 2024) were added in 2024. The Guangzhou MSA completion notice (July 2025) gives 49 turbines and 200 MW (approved capacity 198 MW; the design figures add up to 203.15 MW). The year stays 2021 (full capacity); the models and ratings of the two later units are not published",
        'https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=4ab6834f5da342eda39986faf7b5b0fa', year=2021, mw=200,
        turbine='34x 3 MW + 5x Mingyang MySE6.45-180 + 8x Dongfang DEW-D7000-186 + 2x (added 2024, models unverified)', note=True),
    fix('CHN', 'Putian Pinghai Bay Phase 2', C, '平海灣二期建成 41 部 6 MW、246 MW（新開發銀行 2024 年評價、秀嶼區 2021-07）；上海電氣以西門子 SWT-6.0-154 拿下二期第一、二批風機採購（界面新聞 2017-10），GlobalData 也寫 41 部上海電氣 SWT-6.0-154。原寫「金風／湘電 5–6.45 MW」沒有出處（機型依採購結果與資料庫，沒有相反的出處）', 'Pinghai Bay phase 2 was built with 41 x 6 MW, 246 MW (New Development Bank evaluation, 2024; Xiuyu district, July 2021); Shanghai Electric won both turbine lots of phase 2 with the Siemens-licensed SWT-6.0-154 (Jiemian, Oct 2017), and GlobalData also lists 41 Shanghai Electric SWT-6.0-154. The stored “Goldwind/XEMC 5–6.45 MW” had no source (model from the award and a database; nothing contradicts it)', 'https://www.ndb.int/wp-content/uploads/2024/09/Evaluation-Lens-Issue-8_China-Putian-Bay-Offshore_CN.pdf', turbine='41x Shanghai Electric SWT-6.0-154'),
    fix('CHN', 'Putian Pinghai Bay Phase 3', C, '平海灣三期 44 部 7 MW、308 MW（秀嶼區 2021-07）；2019 年兩批風機採購都由上海電氣以 SWT-7.0-154 得標（14＋30＝44 部，世紀新能源網轉北極星），GlobalData 也寫 44 部 SWT-7.0-154。原寫「金風／明陽 6.45–7 MW」沒有出處（機型依得標結果與資料庫，沒有相反的出處）', 'Pinghai Bay phase 3 has 44 x 7 MW, 308 MW (Xiuyu district, July 2021); both 2019 turbine lots went to Shanghai Electric with the SWT-7.0-154 (14 + 30 = 44 units; ne21 citing BJX), and GlobalData also lists 44 SWT-7.0-154. The stored “Goldwind/Mingyang 6.45–7 MW” had no source (model from the award and a database; nothing contradicts it)', 'https://www.ne21.com/news/show-131941.html', turbine='44x Shanghai Electric SWT-7.0-154'),
    fix('CHN', 'Changle Waihai C', C, 'OpenStreetMap 的風場範圍 way 1455417021 標名「长乐外海风电场C区」（依海事局航行通告 1131/2025 繪製），範圍北緯 25.817–25.891°、東經 119.950–120.049°，內有 53 部 OSM 風機；點位改為範圍中心（北緯 25.854°、東經 119.999°）。原點位 25.75 N、120.0 E 落在 A 區的範圍（way 1343837215）裡', 'OpenStreetMap wind-farm area way 1455417021 is named “长乐外海风电场C区” (drawn from China MSA notice 1131/2025) and spans 25.817–25.891 N, 119.950–120.049 E with 53 OSM turbines inside; the point moves to the centre of that area (25.854 N, 119.999 E). The old point (25.75 N, 120.0 E) lay inside the area-A polygon (way 1343837215)', 'https://www.openstreetmap.org/way/1455417021', lat=25.854, lon=119.999),
    fix('CHN', 'CTG Fujian Changle Waihai A', C, 'OpenStreetMap 的風場範圍 way 1343837215 標名「长乐外海风电场A区」（依海事局航行通告 472/2025 繪製），範圍北緯 25.740–25.800°、東經 119.956–120.023°，內有 31 部 OSM 風機，北接 C 區、南接平潭外海（way 1391515683）；點位改為範圍中心（北緯 25.770°、東經 119.989°），原點位在其西北約 17 km', 'OpenStreetMap wind-farm area way 1343837215 is named “长乐外海风电场A区” (drawn from China MSA notice 472/2025) and spans 25.740–25.800 N, 119.956–120.023 E with 31 OSM turbines inside, between area C to the north and Pingtan Waihai (way 1391515683) to the south; the point moves to the centre of that area (25.770 N, 119.989 E), about 17 km south-east of the old one', 'https://www.openstreetmap.org/way/1343837215', lat=25.770, lon=119.989),
    fix('CHN', 'Fujian Pingtan Straits Road/Railroad Bridge Illumination Project Offshore Distributed wind farm', G, '平潭海峽公鐵大橋照明工程分散式海上風電：EPC 中標公告（2020-08-27，永福股份公告，格隆匯轉載）寫明建設 33.5 MW、5 部 GW154-6.7MW（輪轂 103 m）；福州新聞網 2022-01 寫全容量併網、33.5 MW、5 部，與 5 × 6.7 MW 相符。機型依得標公告，沒有相反的出處；容量 34→33.5 MW', 'Pingtan Strait road-rail bridge lighting distributed offshore wind: the EPC award notice (27 Aug 2020, Yongfu filing via Gelonghui) specifies 33.5 MW with 5 GW154-6.7MW units (103 m hub); Fuzhou News (Jan 2022) reports full-capacity connection, 33.5 MW, 5 turbines, consistent with 5 x 6.7 MW. Model from the award notice; nothing contradicts it; capacity 34 → 33.5 MW', 'https://www.usmart.hk/en/news-detail/6704560855457054924', turbine='5x Goldwind GW154-6.7', mw=33.5),
    drop('CHN', 'Zhoushan Liuheng / Zhejiang others', C, '沒有出處的彙總（600 MW、「舟山六橫、嘉興 2 號等」、機型 mixed）：六橫島東南側海域的離岸風場就是國電舟山普陀 6 號 2 區（252 MW、63 部西門子 4 MW，國家能源集團 2020-06），已是精選紀錄「Guodian Zhoushan Putuo 6#2」；華能嘉興 2 號（杭州灣嘉興海域，300 MW、50 部 6 MW）也有 GEM 紀錄。這筆把兩座重複計算，其餘「等」查無對應', 'An unsourced aggregate (600 MW, “Zhoushan Liuheng, Jiaxing 2 etc.”, turbines “mixed”): the offshore farm south-east of Liuheng Island is Guodian’s Zhoushan Putuo 6 zone 2 (252 MW, 63 Siemens 4 MW; CHN Energy, June 2020), already the curated “Guodian Zhoushan Putuo 6#2”, and Huaneng Jiaxing 2 (Hangzhou Bay off Jiaxing, 300 MW, 50 x 6 MW) has its GEM record. The row double counts both, and the “etc.” matches nothing', 'https://www.ceic.com/gjnyjtww/chnyxfc/202006/e5a14799afc44f2a890f4e1784673ac0.shtml'),
    fix('CHN', 'Fujian Putian Pinghaiwan Offshore wind farm', G, '莆田平海灣海上風電場 F 區：福建省發改委 2017 年核准 20 萬千瓦（福能股份公告），三川海上風電（福能新能源 51%、海峽發電 39%、廈門華夏 10%）投資；2021 年 7 月與石城風電場一起併網發電（人民法院報 2026-04）。GEM 這個場址另含一至三期（各有精選紀錄），只留 F 區；29 部風機的位置依福建省 2024 年用海批覆（見 2026-10-07 第六批），機型待查證', 'Putian Pinghai Bay offshore wind farm area F: 200 MW approved by the Fujian DRC in 2017 (Funeng filing), invested by Sanchuan Offshore Wind (Funeng New Energy 51%, Strait Power 39%, Xiamen Huaxia 10%); connected to the grid together with the Shicheng farm in July 2021 (People’s Court Daily, Apr 2026). The GEM location also carries phases 1–3 (each a curated record), so only area F is kept; the 29 turbine positions come from Fujian’s 2024 sea-use approval (see the 7 Oct 2026 sixth batch) and the turbine model is unverified', 'https://www.court.gov.cn/zixun/xiangqing/497381.html', rename='Putian Pinghai Bay Area F (Sanchuan)', zhname='莆田平海灣F區（三川）', mw=200, year=2021, ph=0, owner='Fujian Sanchuan Offshore Wind Power Co Ltd (Funeng New Energy 51%; Strait Power 39%; Xiamen Huaxia 10%)', note=True),
    # ------------------------------------------------ 2026-10-07 第五批之二（越南與其他國家；出處原文以 check_quotes.py 核對）
    fix('VNM', 'Cà Mau wind farm', G, '越南電力集團（EVN）2025-04-30 轉型期風場 COD 進度表：金甌 1A（88 MW）、1B（88 MW）、1C（88 MW）、1D（86 MW）四座都「尚未送 COD 文件」；法律報 2023-08 仍列為施工中；中國電建 2023-04 只完成 1A 區全部吊裝。2026-07 金甌省（已併入薄遼）14 座商轉風場共 694.2 MW，正好等於不含金甌 1 號的各場加總。全案尚未商轉，改為興建中、完工年不詳（舊規則「2023 年 4 月完工」實為 1A 區吊裝完成）', 'EVN’s COD tracker for transitional projects (30 Apr 2025) lists Ca Mau 1A (88 MW), 1B (88 MW), 1C (88 MW) and 1D (86 MW) all as “COD dossier not yet submitted”; Bao Phap luat (Aug 2023) still listed the cluster as under construction, and PowerChina’s April 2023 milestone was only the hoisting of all turbines in area 1A. In July 2026 the enlarged Ca Mau province (now including Bac Lieu) had 14 commercial wind farms totalling 694.2 MW, exactly the sum of the farms other than Ca Mau 1. The project is not in commercial operation: status set to under construction, completion year unknown (the older rule’s “completed April 2023” was the area-1A hoisting)', 'https://www.evn.com.vn/userfile/User/giangtcdl/files/2025/5/30042025capnhatCODduanNLTTchuyentiep-20250513162804678.pdf', st=1, year=0, note=True),
    fix('VNM', 'Soc Trang 1 Phase 1 (Cong Ly)', C, '公理朔莊一期 30 MW 不是 2021 年商轉：2021 年底 FIT 期限前沒有通過 COD，EVN 2025-04-30 的轉型期風場表仍寫「尚未送 COD 文件」；業主母公司 Super Energy 2026-01-06 公布 2025-12-31 起 27 MW 商轉，其餘 3 MW 預計 2026 年第一季。10 部 3 MW（金風 GW155-3.3）中 9 部在陸上、1 部在近岸，改列陸域；全場是否已完成待查證，暫列興建中、預計 2026', 'Cong Ly Soc Trang phase 1 (30 MW) did not start in 2021: it missed the FIT COD deadline, and EVN’s transitional-project tracker of 30 Apr 2025 still says “COD dossier not yet submitted”. Super Energy (the owner’s parent) announced on 6 Jan 2026 that 27 MW reached COD on 31 Dec 2025 with the remaining 3 MW expected in Q1 2026. Of its ten 3 MW turbines (Goldwind GW155-3.3), nine stand on land and one nearshore, so the record becomes onshore; full completion is unverified, so it is shown as under construction, expected 2026', 'https://southeastasiainfra.com/super-energy-to-start-operations-on-a-30-mw-wind-power-plant-in-mekong-delta-by-2025/', type=0, st=1, year=2026, turbine='10x 3 MW (Goldwind GW155-3.3)', note=True),
    dup('VNM', 'Công Lý Sóc Trăng wind farm', G, ('Soc Trang 1 Phase 1 (Cong Ly)', C), '同一座公理朔莊風電廠一期（30 MW，Super Wind Energy Công Lý Sóc Trăng）；GEM 這筆列為施工中', 'The same Cong Ly Soc Trang plant, phase 1 (30 MW, Super Wind Energy Cong Ly Soc Trang); GEM lists it as under construction', 'https://www.gem.wiki/C%C3%B4ng_L%C3%BD_S%C3%B3c_Tr%C4%83ng_wind_farm'),
    fix('VNM', 'Bến Tre 10 Bình Đại 1 Offshore wind farm', G, '平大風場三期 30／49／49 MW：一期 7 部西門子歌美颯（5.0 系列），二、三期 24 部金風（海事保證檢驗商 AqualisBraemar LOC 的施工階段報導，GlobalData 同；型號未查到）；共 31 部、128 MW（PTSC）。一期 2021 年 FIT 期限前只有 4.2 MW 通過 COD（工貿部），其餘 25.8 MW 與平大 2、3 號各 49 MW 都是轉型期專案，2023 年才通過 COD（EVN 2023-08-18 表），全場完工年改為 2023；GEM 的分期 2021／2022 不對', 'Binh Dai has three phases of 30, 49 and 49 MW: phase 1 has 7 Siemens Gamesa (5.0 series) turbines and phases 2–3 have 24 Goldwind units (contract-stage report by the marine warranty surveyor AqualisBraemar LOC, matching GlobalData; model not found), 31 turbines and 128 MW in all (PTSC). Only 4.2 MW of phase 1 reached COD before the 2021 FIT deadline (MOIT); the remaining 25.8 MW and the 49 MW Binh Dai No. 2 and No. 3 were transitional projects that reached COD in 2023 (EVN tracker of 18 Aug 2023), so the farm is complete from 2023; GEM’s 2021/2022 phases are wrong', 'https://www.evn.com.vn/userfile/User/honghoa/files/18082023_CapnhatCODduanNLTTchuyentiep.pdf', year=2023, ph=[[2021, 4.2], [2023, 123.8]], turbine='7x Siemens Gamesa + 24x Goldwind'),
    dup('VNM', 'Bình Đại wind farm', G, ('Bến Tre 10 Bình Đại 1 Offshore wind farm', G), 'GEM 這筆 25.8 MW「陸域」只引用 EVN 2023-08 的轉型期 COD 表，就是平大一期（30 MW）在 2021 年只通過 4.2 MW 之後剩下的 25.8 MW，不是另一座風場', 'This 25.8 MW “onshore” GEM record cites only EVN’s Aug 2023 transitional COD tracker: it is the 25.8 MW left of Binh Dai phase 1 (30 MW) after 4.2 MW reached COD in 2021, not a separate farm', 'https://www.gem.wiki/B%C3%ACnh_%C4%90%E1%BA%A1i_wind_farm'),
    fix('VNM', 'Thanh Hải No. 5 Offshore wind farm', G, '成海 5 號共 4 座電廠、28 部（EVN 2022-07；打樁承包商 Lê Thy 寫 24 部，以 EVN 為準）。2021 年 FIT 期限前只有成海 1（30 MW）與成海 2 的 4.25 MW 通過 COD（工貿部）；成海 2 其餘 25.75 MW、成海 3、4（各 30 MW）在 EVN 2025-04-30 的轉型期表仍「未送 COD 文件」，全場尚未完成，改為興建中（完工年不詳）。機型：成海 1 為 7 部西門子歌美颯 SG 4.5-145（訂單），成海 2 為 7 部 SG 4.5-145（GlobalData；原訂單為附條件），成海 3、4 未查到', 'Thanh Hai No. 5 is four plants with 28 turbines (EVN, Jul 2022; the piling contractor Le Thy says 24, EVN is preferred). Only Thanh Hai 1 (30 MW) and 4.25 MW of Thanh Hai 2 reached COD before the 2021 FIT deadline (MOIT); the remaining 25.75 MW of Thanh Hai 2 and Thanh Hai 3 and 4 (30 MW each) were still “COD dossier not submitted” in EVN’s transitional tracker of 30 Apr 2025, so the farm is not complete: under construction, completion year unknown. Turbines: Thanh Hai 1 has 7 Siemens Gamesa SG 4.5-145 (order), Thanh Hai 2 7 × SG 4.5-145 (GlobalData; the order was conditional), Thanh Hai 3–4 not found', 'https://www.evn.com.vn/userfile/User/giangtcdl/files/2025/5/30042025capnhatCODduanNLTTchuyentiep-20250513162804678.pdf', st=1, year=0, note=True),
    fix('VNM', 'Hoa Binh 1 Phase 2', C, '和平 1 號二期與和平 2 號由方英建設投資貿易公司（Phương Anh 集團）投資（工貿部 2020-07 開工報導）；原本業主空白', 'Hoa Binh 1 phase 2 and Hoa Binh 2 are invested by Phuong Anh Investment, Construction and Trading Co Ltd (Phuong Anh Group) (MOIT, groundbreaking, Jul 2020); the owner was blank', 'https://moit.gov.vn/phat-trien-ben-vung/bac-lieu-them-100mw-dien-gio-duoc-khoi-cong-xay-dung.html', owner='Phuong Anh Investment, Construction and Trading Co Ltd (Phuong Anh Group)'),
    fix('VNM', 'Hoa Binh 2', C, '和平 1、2 號共 150 MW、39 部（人民報），和平 1 號兩期各 13 部 V150-4.2，所以和平 2 號是 13 部；業主同為方英', 'Hoa Binh 1 and 2 total 150 MW with 39 turbines (Nhan Dan); the two Hoa Binh 1 phases have 13 V150-4.2 each, so Hoa Binh 2 has 13; same owner, Phuong Anh', 'https://nhandan.vn/ocop/bac-lieu-tien-phong-phat-trien-dien-gio-ngoai-khoi-post733339.html', owner='Phuong Anh Investment, Construction and Trading Co Ltd (Phuong Anh Group)', turbine='13x Vestas V150-4.2'),
    fix('VNM', 'VPL Ben Tre (Nexif Ben Tre 1)', C, 'VPL 檳椥 2021 年 FIT 期限前只有 25.2 MW 通過 COD（工貿部，部分），最後 4.2 MW（1 部）是轉型期專案，2023 年才 COD（EVN 2023-08-18 表），全場完成年改為 2023、共 29.4 MW', 'Only 25.2 MW of VPL Ben Tre reached COD before the 2021 FIT deadline (MOIT, partial); the last 4.2 MW (one turbine) was a transitional project at COD only in 2023 (EVN tracker of 18 Aug 2023), so the farm is complete from 2023, 29.4 MW in all', 'https://www.evn.com.vn/userfile/User/honghoa/files/18082023_CapnhatCODduanNLTTchuyentiep.pdf', mw=29.4, year=2023, ph=[[2021, 25.2], [2023, 4.2]]),
    fix('VNM', 'Hiep Thanh (Tra Vinh)', C, '協成 2021 年 FIT 期限前只有 12.8 MW 通過 COD（工貿部，部分），其餘 64.5 MW 是轉型期專案，2023 年才 COD（EVN 2023-08-18 表），全場完成年由 2022 改為 2023', 'Only 12.8 MW of Hiep Thanh reached COD before the 2021 FIT deadline (MOIT, partial); the other 64.5 MW was a transitional project at COD only in 2023 (EVN tracker of 18 Aug 2023), so the farm is complete from 2023, not 2022', 'https://www.evn.com.vn/userfile/User/honghoa/files/18082023_CapnhatCODduanNLTTchuyentiep.pdf', year=2023, ph=[[2021, 12.8], [2023, 64.5]]),
    fix('MAR', 'Akhfennir I-II', C, '阿赫費尼爾一期（101.87 MW、61 部 Alstom ECO 74）2013 年投入運轉：Nareva 執行長 2013-02 說 1 月起已有風機運轉、6 月全部投運；晨報 2014 寫「2013 年起運轉」，GlobalData 寫 2013 年 6 月投運；GEM 的 2014 不對。二期為 56 部 GE 1.7-100（GE 2014-09 合約）；原機型欄「Siemens Gamesa」不對', 'Akhfennir I (101.87 MW, 61 Alstom ECO 74) went into service in 2013: Nareva’s CEO said in Feb 2013 that turbines had been turning since January with full commissioning due in June; Le Matin (2014) says “operational since 2013” and GlobalData gives June 2013; GEM’s 2014 is wrong. Phase II has 56 GE 1.7-100 (GE contract, Sep 2014); the stored “Siemens Gamesa” is wrong', 'https://lematin.ma/express/2014/energie-eolienne_tarfaya-abrite-le-premier-parc-en-afrique/200878.html', ph=[[2013, 102], [2016, 100]], turbine='61x Alstom ECO 74 (1.67 MW) + 56x GE 1.7-100'),
    drop('TWN', 'Formosa 3 offshore wind farm · 3', G, '海鼎（Formosa 3）計畫已終止：Corio 2025 年決定退出台灣，經濟部 2025 年 5 月前解除海鼎一（3.2 期）開發權，海鼎二（3.1 期）也已解約、2026 年併入 3.3 期擴充容量；Infralogic 2026-02：與道達爾能源共有的 Formosa 3 開發權 2025 年已取消，Corio 本身 2026-04-01 起不存在。海鼎三從未獲配容量，已無開發商', 'The Formosa 3 (Haiding) project has ended: Corio decided in 2025 to leave Taiwan, the ministry revoked Haiding 1’s Round 3.2 rights by May 2025, and Haiding 2 (Round 3.1) was terminated and added to the Round 3.3 expansion capacity in 2026; Infralogic (Feb 2026): the development rights of Formosa 3, co-owned with TotalEnergies, were cancelled in 2025, and Corio itself ceased to exist on 1 April 2026. Haiding 3 never received capacity and no longer has a developer', 'https://ionanalytics.com/insights/infralogic/macquarie-winds-down-offshore-platform-corio/'),
    # ------------------------------------------------ 2026-10-07 第六批（第十二輪資料疑點；出處原文以 check_quotes.py 核對）
    fix('CHN', 'Changle Waihai C', C, '福建中科環境檢測（受福建省福能海峽發電委託做長樂外海 C 區施工期跟蹤監測與竣工環保驗收）的案例頁：C 區安裝上海電氣 8 MW 37 台和東方電氣 10 MW 20 台，共 57 台、實際總裝機 496 MW；機型欄補上 8 MW 的廠牌（部數不變）', 'Case page of Fujian Zhongke Environmental Testing, hired by Funeng Strait Power for area C’s construction monitoring and completion environmental acceptance: area C has 37 Shanghai Electric 8 MW and 20 Dongfang Electric 10 MW turbines, 57 in all, 496 MW as built; the maker of the 8 MW units is added (counts unchanged)', 'http://www.zhongkejc.net/case_detail-199.html', turbine='37x Shanghai Electric 8 MW + 20x Dongfang 10 MW'),
    fix('CHN', 'CGN Xiangshan 1 Phase 1 (Tuci)', C, '寧波海事局 2024-11-11 通航要素通告（甬航通〔2024〕0532 號）：中廣核象山塗茨海上風電場「已建成投用」，場區有 38 台單機 8 MW 風機，並列出 38 台的座標；點位改為這 38 點的平均（北緯 29.531°、東經 122.057°；原點在西方約 10 km）。容量依調整後核准的 300 MW（38 台 8 MW，變更海域使用論證報告）', 'Ningbo MSA notice of 11 Nov 2024 (Yong Hang Tong [2024] 0532): CGN Xiangshan Tuci offshore wind farm “has been built and put into use”, with 38 turbines of 8 MW each, and lists all 38 positions; the point moves to their mean (29.531 N, 122.057 E; the old point was about 10 km west). Capacity is the 300 MW of the amended approval (38 × 8 MW, sea-use change report)', 'https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=BBC12C15A2FE47E6AC5CEB280B1BC877', mw=300, turbine='38x CSSC Haizhuang 8 MW', lat=29.531, lon=122.057),
    fix('CHN', 'Fujian Putian Pinghaiwan Offshore wind farm', G, '福建省政府 2024-09-18 平海灣 F 區變更用海批覆（閩政海域〔2024〕27 號）附件的界址點 1–29 號是 29 台風機的圓心；點位改為這 29 點的平均（北緯 25.164°、東經 119.470°，南日島南側；GEM 的概略點在西方約 18 km）。F 區 2018-08-21 開工、2021-07-15 與石城一起竣工投產（人民網福建）。機型待查證（GlobalData 寫 29 台 SWT-7.0-154、203 MW，與官方 200 MW 不符），只寫台數', 'The Fujian government’s approval of 18 Sept 2024 for area F’s changed sea use (Min Zheng Hai Yu [2024] 27) lists boundary points, of which 1–29 are the centres of the 29 turbines; the point moves to their mean (25.164 N, 119.470 E, south of Nanri Island; GEM’s approximate point was about 18 km west). Area F started on 21 Aug 2018 and was completed and put into operation with Shicheng on 15 Jul 2021 (People’s Daily Fujian). Model unverified (GlobalData lists 29 × SWT-7.0-154, 203 MW, which does not match the official 200 MW), so only the count is written', 'https://zrzyt.fujian.gov.cn/zwgk/zfxxgkzl/zfxxgkml/hygl/202409/t20240929_6537863.htm', lat=25.164, lon=119.470, turbine='29 turbines'),
    fix('CHN', 'Putian Shicheng', C, '福建省政府 2024-04-19 莆田石城海上風電場用海批覆：用海位於秀嶼區埭頭鎮石城村東北側，附件宗海界址點 954–982 號是 29 台風機的圓心點；點位改為這 29 點的平均（北緯 25.297°、東經 119.373°；原點 25.12°N、119.30°E 在南方約 21 km）', 'The Fujian government’s sea-use approval of 19 Apr 2024 for the Putian Shicheng offshore wind farm puts it north-east of Shicheng village, Daitou town, and boundary points 954–982 in its annex are the centres of the 29 turbines; the point moves to their mean (25.297 N, 119.373 E; the old point 25.12 N, 119.30 E was about 21 km south)', 'https://zrzyt.fujian.gov.cn/zwgk/zfxxgkzl/zfxxgkml/hygl/202404/t20240423_6439224.htm', lat=25.297, lon=119.373),
    fix('CHN', 'CTG Yangjiang Shapa Phase 2', C, '沙扒二期海域使用補充論證報告書（陽江市自然資源局，建成後）：62 台 6.45 MW，機型為明陽 MySE6.45-180 與金風 GW171/6450 兩種，2021-11-27 最後一台併網；兩種機型各幾台報告沒寫；三峽能源招股書：二期風機及塔筒分兩個標段，I 標明陽智慧（14.996 億元）、II 標金風科技（14.646 億元），GlobalData（Energy Monitor）列二期 I、II 各 31 台，機型欄依此寫明陽、金風各 31 台（原寫 62 台全為明陽）', 'Shapa phase 2 supplementary sea-use report (Yangjiang natural resources bureau, after completion): 62 × 6.45 MW of two models, Mingyang MySE6.45-180 and Goldwind GW171/6450, last unit connected on 27 Nov 2021; the report gives no split; CTG New Energy’s prospectus shows phase 2’s turbines and towers bought in two lots, lot I from Mingyang (CNY 1,499.6 m) and lot II from Goldwind (CNY 1,464.6 m), and GlobalData (Energy Monitor) lists 31 units in each of phase 2-I and 2-II, so the field gives 31 of each (it said all 62 were Mingyang)', 'http://www.yangjiang.gov.cn/yjzrzy/attachment/0/58/58162/731643.pdf', turbine='31x Mingyang MySE6.45-180 + 31x Goldwind GW171-6.45'),
    fix('CHN', 'Shandong Bandaonan U2 (Guohua) Offshore wind farm', G, '山東半島南 U 場址（150 萬瓩，含國家電投 U1 的 90 萬瓩與國家能源集團 U2 的 60 萬瓩，共 177 台）2024-10-26 實現全容量併網（威海市委對外宣傳辦經澎湃新聞 2024-10-29；山東 2024-12 報導同）；國家能源集團 2025-09：U2 安裝 71 台 8.5 MW、603.5 MW（機型為遠景 EN226-8.5，世紀新能源網的專案介紹）。改為營運中 2024 年。中證鵬元 2025-06 評級報告把 U2 列在「截至 2024 年末在建、擬建項目」，應是會計上尚未結轉', 'The Peninsula South U site (1,500 MW: SPIC’s 900 MW U1 and CHN Energy’s 600 MW U2, 177 turbines) reached full grid connection on 26 Oct 2024 (Weihai municipal publicity office via The Paper, 29 Oct 2024; a Shandong report of Dec 2024 agrees); CHN Energy (Sept 2025): U2 has 71 × 8.5 MW, 603.5 MW (Envision EN226-8.5 per the project description on ne21). Set to operating from 2024. A June 2025 rating report still lists U2 among projects under construction at end-2024, presumably not yet transferred to fixed assets', 'https://m.thepaper.cn/newsDetail_forward_29177936', st=0, year=2024, turbine='71x Envision EN226-8.5', note=True),
    fix('VNM', 'Duyên Hai wind farm · 1', G, 'GEM 這筆的別名就是「Duyen Hai Wind Power Plant (V1-4)／NMĐ gió Duyên Hải (V1-4)」，狀態引用的西貢經濟時報 2025-09 報導的是 REE 子公司 Duyên Hải 風電公司在 Đông Hải 等三個社的 48 MW 電廠；業主 Asian Energy／Uniso 是 2018 年已被茶榮省終止的舊案。人民報：Duyên Hải（V1-4）10／10 部 2026-03-16 起全部正式運轉（券商摘要：2026-03-16 商轉）；KB 證券 2025 年第三季報告稱為離岸（潮間帶）專案、10 座離岸風機塔已裝完。改為運轉中、2026、離岸，業主改為 REE 的 Duyen Hai Wind Power JSC；機組數各來源不一（10 或 8 部），機型未查到', 'GEM’s own page gives this record’s other name as “Duyen Hai Wind Power Plant (V1-4) / NMĐ gió Duyên Hải (V1-4)”, and its status source (Saigon Times, Sep 2025) describes the 48 MW plant of REE’s subsidiary Duyen Hai Wind Power JSC in Dong Hai and two neighbouring communes; the listed owners Asian Energy / Uniso belong to an older project that Tra Vinh terminated in 2018. Nhan Dan: all 10 of 10 turbines of Duyen Hai (V1-4) in official operation from 16 Mar 2026 (a broker summary gives COD on 16 Mar 2026); KB Securities (3Q 2025) calls it an offshore (intertidal) project whose 10 offshore turbine towers were installed. Set to operating, 2026, offshore, owner REE’s Duyen Hai Wind Power JSC; the turbine count differs between sources (10 or 8) and the model was not found', 'https://nhandan.vn/post-952529.html', st=0, year=2026, type=1, owner='Duyen Hai Wind Power JSC (REE Corp)', note=True),
    fix('VNM', 'Lạc Hòa wind farm', G, 'GEM 這筆含兩座：二期 124 MW 就是 Lạc Hòa 2（EVN：40 部中 38 部、123.6 MW 於 2023-08-18 前通過 COD），一期 30 MW 是 UPC／AC Energy 的 Lạc Hòa 風電廠（和東社、6 部 V150-3.8＋2 部 V150-3.6，業主公告 2023-12-30 商轉；GEM 的 2025 年引用 2025-02 的進度表）。兩部分都在 2023 年，不再分期', 'This GEM record holds two plants: phase 2 (124 MW) is Lac Hoa 2 (EVN: 38 of 40 turbines, 123.6 MW, at COD by 18 Aug 2023) and phase 1 (30 MW) is UPC / AC Energy’s Lac Hoa plant (Hoa Dong commune, 6 V150-3.8 + 2 V150-3.6, in commercial operation from 30 Dec 2023 per the owner; GEM’s 2025 came from a Feb 2025 tracker). Both parts date from 2023, so the phases are dropped', 'https://diengiolachoa.com/en/', year=2023, ph=0),
    fix('VNM', 'Chơ Long wind farm · 2', G, '朱龍（Chơ Long）風電廠共 155 MW（Phong Điện Chơ Long 股份公司，原 Krông Chro 縣）：2021 年已建成，但只有 49.5 MW 在 FIT 期限前通過 COD；其餘 105.5 MW 因電能品質（諧波）試驗問題，到 2026-08 仍未商轉（嘉萊省 2026-08-04 向 EVN 陳情）。不是「規劃中」，改為興建中（已建成、未商轉）', 'Cho Long wind plant is 155 MW in all (Cho Long Wind Power JSC, former Krong Chro district): it was built in 2021, but only 49.5 MW reached COD before the FIT deadline; the remaining 105.5 MW was still not in commercial operation in Aug 2026 because of power-quality (harmonics) test issues (Gia Lai’s request to EVN on 4 Aug 2026). Not “pre-construction”: set to under construction (built, not commissioned)', 'https://www.tinnhanhchungkhoan.vn/gia-lai-tiep-tuc-kien-nghi-go-vuong-2-du-an-dien-gio-chua-van-hanh-thuong-mai-post395316.html', st=1, owner='Cho Long Wind Power JSC (Phong Dien Cho Long)', note=True),
    fix('VNM', 'Chơ Long wind farm', G, '朱龍風電廠的 49.5 MW 在 2021-10-31 前通過 COD（EVN 名單「部分」，全廠 155 MW）', 'The 49.5 MW part of Cho Long reached COD by 31 Oct 2021 (EVN list, “partial” of the 155 MW plant)', 'https://evn.com.vn/userfile/User/tcdl/files/Thong-tin-COD-dien-gio-den-het-ngay-31-10-2021_2.pdf', year=2021, owner='Cho Long Wind Power JSC (Phong Dien Cho Long)'),
    fix('VNM', 'Soc Trang 7 Phase 1', C, '7 號風場一期是 7 部 4.2 MW、29.4 MW（EVN 2021 FIT 名單「Số 7 Sóc Trăng 29,40 全部」），業主朔莊能源股份公司與春求公司', 'Wind farm No. 7 phase 1 has 7 × 4.2 MW, 29.4 MW (EVN’s 2021 FIT list: “Số 7 Sóc Trăng 29,40, full”), owned by Soc Trang Energy JSC and Xuan Cau Co Ltd', 'https://vietnamenergy.vn/the-first-wind-power-projects-in-soc-trang-province-have-started-the-power-generation-27557.html', mw=29.4, turbine='7x 4.2 MW', owner='Soc Trang Energy JSC; Xuan Cau Co Ltd'),
    fix('DNK', 'Rønland', C,
        '丹麥能源署：羅恩蘭海上風場現在只有南側 4 部（9.2 MW）；北側 4 部 Vestas V80 因 Thyborøn 港擴建已與陸地相連（2003 年起原為 8 部、17.2 MW）。'
        '座標改到南側 4 部的中心（OpenStreetMap 關係「Rønland Vindmøllepark」）',
        'Danish Energy Agency: the Rønland offshore wind farm now consists of the four southern turbines (9.2 MW); the four northern Vestas V80 have become '
        'land-connected through the Thyborøn port extension (8 turbines and 17.2 MW from 2003). Point moved to the centre of the southern four (OpenStreetMap relation “Rønland Vindmøllepark”)',
        'https://ens.dk/energikilder/etablerede-havvindmoelleparker', mw=9.2, turbine='4x Bonus/Siemens 2.3 MW', lat=56.657, lon=8.223, note=True),
    fix('DNK', 'Frederikshavn', C,
        '丹麥能源署：2003 年在海上設 3 部（7.6 MW），港口擴建後兩部已與陸地相連，海上只剩 1 部 2.3 MW；OpenStreetMap 標為離岸的是 Nordex N90/2300'
        '（Bonus 2.3 MW 與 Vestas V90 已在陸上），座標改到這部風機',
        'Danish Energy Agency: 3 turbines (7.6 MW) were put up at sea in 2003; after the harbour extension two are land-connected and only one 2.3 MW turbine is left at sea. '
        'OpenStreetMap tags the Nordex N90/2300 as the offshore one (the Bonus 2.3 MW and the Vestas V90 now stand on land); point moved to that turbine',
        'https://ens.dk/energikilder/etablerede-havvindmoelleparker', mw=2.3, turbine='1x Nordex N90/2300', lat=57.442, lon=10.565, note=True),
    fix('NOR', 'Sormarkfjellet wind farm', G, '31 部 Vestas V117、每部 4.2 MW（業主 Aneo 專案頁）', '31 Vestas V117 turbines of 4.2 MW each (owner Aneo’s project page)',
        'https://www.aneo.com/en/projects/sormarkfjellet-wind-farm', turbine='31x Vestas V117-4.2 MW'),
    fix('FIN', 'Ajos Retrofit wind farm', G,
        'OX2 2017 年 10 月把汰換後的 Ajos 風場交給 IKEA Finland：8 部 Siemens SWT-3.3-130（人工島與防波堤上）＋5 部 SWT-3.2-113（Ajos 島上），共 42.4 MW；新機組 2016–2017 年豎立，取代原本 10 部 WinWinD',
        'OX2 handed the repowered Ajos farm to IKEA Finland in October 2017: 8 Siemens SWT-3.3-130 (on artificial islands and breakwaters) plus 5 SWT-3.2-113 (on Ajos island), 42.4 MW in all; '
        'the new turbines went up in 2016–2017, replacing the 10 original WinWinD units',
        'https://news.cision.com/ox2/r/ox2-hands-over-ajos-wind-farm-to-ikea-finland,c2361999', mw=42.4, year=2017, ph=0, turbine='8x Siemens SWT-3.3-130 + 5x Siemens SWT-3.2-113'),
    fix('FIN', 'Kemi wind farm', G,
        'PVO-Innopower 的原 Ajos 風場：10 部 WinWinD WWD-3（3 MW），2007–2008 年建成，共 30 MW（GEM 寫 27 MW）；2016 年起由 OX2 汰換',
        'PVO-Innopower’s original Ajos farm: 10 WinWinD WWD-3 (3 MW) built in 2007–2008, 30 MW in all (GEM says 27 MW); replaced by OX2 from 2016',
        'https://fi.wikipedia.org/wiki/Kemin_tuulipuisto', mw=30, turbine='10x WinWinD WWD-3'),
    fix('DOM', 'Esperanza (Dominican Republic) wind farm', G,
        'EGE Haina 的 Esperanza 風場 49.5 MW、11 部 Vestas V163-4.5 MW，2025 年開始運轉（2026 年 5 月與光電場一起舉行啟用典禮）；這就是本站逐場加總比 IRENA 少的約 50 MW',
        'EGE Haina’s Esperanza wind farm: 49.5 MW, 11 Vestas V163-4.5 MW, in operation from 2025 (inaugurated with the solar parks in May 2026); it is the roughly 50 MW the site’s farm total was short of IRENA',
        'https://www.egehaina.com/Centrales?name=esperanzarenovable', st=0, year=2025, mw=49.5, turbine='11x Vestas V163-4.5 MW', owner='Empresa Generadora de Electricidad Haina SA (EGE Haina)'),
    dup('DOM', 'Esperanza wind farm (Dominican Republic)', G, ('Esperanza (Dominican Republic) wind farm', G),
        '同一座風場（GEM 兩筆都是 EGE Haina 的 Esperanza 風場、50 MW；這筆座標只是概略位置）', 'The same farm (both GEM records are EGE Haina’s Esperanza farm, 50 MW; this one’s point is only approximate)',
        'https://www.egehaina.com/Centrales?name=esperanzarenovable'),
    fix('DOM', 'Larimar wind farm', G,
        '兩期：2016 年 3 月 15 部 Vestas V112-3.3（49.5 MW）、14 部 V117-3.45（48.3 MW），共 97.8 MW（EGE Haina）',
        'Two phases: 15 Vestas V112-3.3 (49.5 MW) inaugurated in March 2016 and 14 V117-3.45 (48.3 MW), 97.8 MW in all (EGE Haina)',
        'https://www.egehaina.com/Centrales?name=Larimar', mw=97.8, ph=[[2016, 49.5], [2018, 48.3]], turbine='15x Vestas V112-3.3 MW + 14x Vestas V117-3.45 MW'),
    fix('ROU', 'Crucea Nord', C, 'Crucea Nord（Crucea 鄉，108 MW）由 STEAG 開發，2014 年啟用（Transelectrica 風場清單的整理）', 'Crucea Nord (Crucea commune, 108 MW) was developed by STEAG and commissioned in 2014 (compilation of the Transelectrica list)',
        'https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/', year=2014),
    fix('COL', 'Carreto wind farm', G,
        'Celsia 的 Carreto 風場（大西洋省）9.6 MW、2 部 4.8 MW，2025 年 6 月完工、當月投入運轉（Celsia 2025 年成果：Carreto 風場投入運轉）；GEM 寫 9.9 MW、興建中',
        'Celsia’s Carreto farm (Atlántico): 9.6 MW, 2 turbines of 4.8 MW, completed in June 2025 and entering operation that month (Celsia’s 2025 results: Carreto entered operation); GEM says 9.9 MW, under construction',
        'https://www.eltiempo.com/colombia/barranquilla/el-atlantico-entra-a-la-era-de-la-energia-eolica-con-el-primer-parque-de-celsia-en-colombia-3460285', st=0, year=2025, mw=9.6, turbine='2x 4.8 MW'),
    dup('DEU', 'Dreiberg wind farm', G, ('Windpark Druiberg (Dardesheim)', C),
        '同一座風場：GEM 的「Dreiberg」是 Dardesheim 的 Druiberg 風場拼錯，GEM 座標（51.990, 10.833）正是德文維基 Windpark Druiberg 的座標',
        'Same farm: GEM’s “Dreiberg” is a misspelling of the Druiberg farm at Dardesheim, and the GEM point (51.990, 10.833) is German Wikipedia’s coordinate for Windpark Druiberg',
        'https://de.wikipedia.org/wiki/Windpark_Druiberg'),
    fix('DEU', 'Windpark Druiberg (Dardesheim)', C, '座標改到 Druiberg 山上的風場（德文維基：北緯 51°59′23″、東經 10°50′0″；原座標是 Dardesheim 鎮）',
        'Point moved to the farm on the Druiberg (German Wikipedia: 51°59′23″ N, 10°50′0″ E; the old one was Dardesheim town)', 'https://de.wikipedia.org/wiki/Windpark_Druiberg', lat=51.99, lon=10.833),
    fix('USA', 'Shiloh', C,
        'Shiloh 共四期 505 MW：I 期 2006 年 4 月 150 MW（100 部 GE 1.5 MW，Iberdrola）、II 期 2009 年 1 月 150 MW（75 部 REpower MM92）、III 期 2011 年 12 月與 IV 期 2012 年 12 月各 102.5 MW'
        '（各 50 部 REpower 2.05 MW，II–IV 期屬 EDF）。建置把 GEM 四期 504 MW 的紀錄併進這筆 300 MW，III、IV 期因此不見；與 SMUD 的 Solano 是不同風場',
        'Shiloh has four phases, 505 MW: phase I (April 2006) 150 MW with 100 GE 1.5 MW (Iberdrola); phase II (January 2009) 150 MW with 75 REpower MM92; phases III (December 2011) and IV '
        '(December 2012) 102.5 MW each with 50 REpower 2.05 MW (II–IV owned by EDF). The build merged GEM’s four-phase 504 MW record into this 300 MW row, so phases III and IV were missing; '
        'it is a different farm from SMUD’s Solano',
        'https://en.wikipedia.org/wiki/Shiloh_Wind_Power_Plant', mw=505, ph=[[2006, 150], [2009, 150], [2011, 102.5], [2012, 102.5]],
        turbine='100x GE 1.5 MW + 75x REpower MM92 + 100x REpower 2.05 MW', owner='Avangrid Renewables (I); EDF Renewables (II–IV)'),
    dup('USA', 'Dempsey Ridge Wind Farm', P, ('Big Smile wind farm', G),
        '同一座風場：Acciona 的 Dempsey Ridge 風場 2012 年改名為 Big Smile Wind Farm at Dempsey Ridge（132 MW，奧克拉荷馬州）', 'Same farm: Acciona’s Dempsey Ridge farm was renamed “Big Smile Wind Farm at Dempsey Ridge” in 2012 (132 MW, Oklahoma)',
        'https://www.windpowerengineering.com/oklahoma-wind-farm-begins-operation-new-name/'),
    fix('AUS', 'Gullen Range wind farm', G, '73 部金風（56 部 GW100-2.5MW＋17 部 GW82-1.5MW），165.5 MW，2014 年 12 月全部運轉（風場年度環境報告）',
        '73 Goldwind turbines (56 GW100-2.5MW + 17 GW82-1.5MW), 165.5 MW, fully operational in December 2014 (annual environmental report)',
        'https://gullenrangewindfarm.com/wp-content/uploads/2025/03/NGRWF-Annual-Environmental-Management-Report_2024-signed.pdf', mw=165.5, turbine='56x Goldwind GW100-2.5MW + 17x Goldwind GW82-1.5MW'),
    fix('USA', 'Revolution Wind', G, '座標改到 65 部風機的中心（OpenStreetMap 標為 Revolution Wind LLC 營運的 SG 11.0-200 DD）；原座標在風場西北角外',
        'Point moved to the centre of the 65 turbines (OpenStreetMap nodes of SG 11.0-200 DD operated by Revolution Wind LLC); the old point was off the north-west corner of the array',
        'https://www.openstreetmap.org/node/13097062280', lat=41.152, lon=-71.064),
    fix('DEU', 'Gohlocher Wald wind farm', G, 'Gohlocher Wald 風場在 Lebach，是 2 部 Nordex N131/3000、6 MW（GEM 寫 12 MW）；與 Püttlingen 的 Schwalbach 風場（4 部 E-115、12 MW）是不同風場',
        'The Gohlocher Wald farm at Lebach has 2 Nordex N131/3000, 6 MW (GEM says 12 MW); it is not the Schwalbach farm at Püttlingen (4 E-115, 12 MW)',
        'https://www.energy3k.com/wp-gow-erste-kwh/', mw=6, turbine='2x Nordex N131/3000'),
    fix('DEU', 'Oederquart wind farm', G, 'Bürgerwindpark Oederquart 的 Seeweg 風場：7 部 Enercon E-115 E2（3.2 MW），共 22.4 MW，2019 年併網（GEM 寫 16 MW）',
        'Bürgerwindpark Oederquart’s Seeweg park: 7 Enercon E-115 E2 (3.2 MW), 22.4 MW in all, connected in 2019 (GEM says 16 MW)',
        'https://www.investmentcheck.de/produkt/buergerwindpark-oederquart/', mw=22.4, turbine='7x Enercon E-115 E2'),
    fix('DEU', 'Streumen wind farm', G, 'Streumen/Glaubitz II 汰換案：2016 年、4 部 Vestas V126，13.2 MW（業者 Energieanlagen FB；GEM 也列 Glaubitz RI 為別名）',
        'The Streumen/Glaubitz II repowering: 2016, 4 Vestas V126, 13.2 MW (Energieanlagen FB; GEM also lists Glaubitz RI as another name)',
        'https://www.energie-fb.de/referenzen/', mw=13.2, turbine='4x Vestas V126'),
    fix('JPN', 'Choshi Offshore Demonstration (NEDO/TEPCO)', C, '仍在運轉（2026 年 9 月報導：實證風車沒有撤除，2019 年轉為商轉後至今持續運轉）；座標改為東京電力 RP 公布的風車位置（北緯 35°40′54″、東經 140°49′13″，世界測地系；原座標偏東北約 3 km）', 'Still operating (September 2026: the demonstration turbine was never removed and has run commercially since 2019); the point moves to the turbine position published by TEPCO Renewable Power (35°40′54″ N, 140°49′13″ E, WGS; the old point was about 3 km to the north-east)', 'https://www.mlit.go.jp/sogoseisaku/ocean_policy/content/001388008.pdf', lat=35.682, lon=140.82),
    fix('TWN', 'Formosa 1 Phase 1', C, '機組是西門子 SWT-4.0-120（葉輪直徑 120 m）：營運商沃旭 2019 年簡報列「4MW Siemens SWT 4.0-120」，西門子歌美颯 2018 年 1 月簡報的已安裝實績（統計至 2017 年 11 月）也列「Formosa: 2x SWT-4.0-120」；西門子歌美颯 2018 年 4 月新聞稿寫的 SWT-4.0-130 與這兩份不符，不採用', 'The turbines are Siemens SWT-4.0-120 (120 m rotor): the operator Ørsted’s 2019 presentation lists “4MW Siemens SWT 4.0-120”, and Siemens Gamesa’s January 2018 presentation of installed projects (installed by November 2017) lists “Formosa: 2x SWT-4.0-120”; the SWT-4.0-130 in Siemens Gamesa’s April 2018 press release contradicts both and is not used', 'https://www.asiawind.org/wp-content/uploads/2019/10/01-ORSTED-ULRIK-LANGE.pdf', turbine='2x Siemens SWT-4.0-120'),
    # ------------------------------------------------ 2026-10-08 第七批（第十三輪資料疑點；出處原文以 check_quotes.py 核對）
    fix('THA', 'Hanuman 10 wind farm', G, '亞洲開發銀行（ADB）2020 年度環境社會監測報告（2021-05）表 2 列出 Hanuman 10 全部 32 部風機的座標（北緯 15.507–15.566°、東經 101.520–101.589°）；點位改為 32 點的平均（北緯 15.536°、東經 101.557°；GEM 的概略點在東北方約 0.8 km）。機組為 32 部西門子歌美颯 2.5 MW（輪轂 153 m、葉輪 126 m）', 'Table 2 of the ADB environmental and social monitoring report for 2020 (May 2021) lists all 32 turbine positions of Hanuman 10 (15.507–15.566 N, 101.520–101.589 E); the point moves to their mean (15.536 N, 101.557 E; GEM’s approximate point was about 0.8 km north-east). It has 32 Siemens Gamesa 2.5 MW turbines (153 m hub, 126 m rotor)', 'https://www.adb.org/sites/default/files/project-documents/53255/53255-001-esmr-en_9.pdf', lat=15.536, lon=101.557, turbine='32x Siemens Gamesa 2.5 MW'),
    fix('THA', 'Hanuman 1 wind farm', G, '亞洲開發銀行（ADB）2020 年度環境社會監測報告表 2 的 18 部風機座標（Sap Yai 縣 Tha Kup 分區）；點位改為其平均（北緯 15.653°、東經 101.689°；原點是 GEM 給 Hanuman 1、5、9、10 的同一點（在 Hanuman 10 的範圍內），在約 18.5 km 外）。機組為 18 部西門子歌美颯 2.5 MW', 'Table 2 of the ADB environmental and social monitoring report for 2020 lists the 18 turbine positions (Tha Kup subdistrict, Sap Yai district); the point moves to their mean (15.653 N, 101.689 E; the old point was the single GEM point given to Hanuman 1, 5, 9 and 10 (inside Hanuman 10), about 18.5 km away). It has 18 Siemens Gamesa 2.5 MW turbines', 'https://www.adb.org/sites/default/files/project-documents/53255/53255-001-esmr-en_9.pdf', lat=15.653, lon=101.689, turbine='18x Siemens Gamesa 2.5 MW'),
    fix('THA', 'Hanuman 8 wind farm', G, '亞洲開發銀行（ADB）2020 年度環境社會監測報告表 2 的 18 部風機座標（Sap Yai 縣 Tha Kup 與 Sap Yai 分區）；點位改為其平均（北緯 15.625°、東經 101.650°；原點是 GEM 的點，落在 Hanuman 10 的範圍內，在約 11.5 km 外）。機組為 18 部西門子歌美颯 2.5 MW', 'Table 2 of the ADB environmental and social monitoring report for 2020 lists the 18 turbine positions (Tha Kup and Sap Yai subdistricts, Sap Yai district); the point moves to their mean (15.625 N, 101.650 E; the old GEM point lay inside Hanuman 10, about 11.5 km away). It has 18 Siemens Gamesa 2.5 MW turbines', 'https://www.adb.org/sites/default/files/project-documents/53255/53255-001-esmr-en_9.pdf', lat=15.625, lon=101.650, turbine='18x Siemens Gamesa 2.5 MW'),
    fix('THA', 'Hanuman 5 wind farm', G, '亞洲開發銀行（ADB）2020 年度環境社會監測報告表 2 的 19 部風機座標（Thep Sathit 縣 Watabaek 分區）；點位改為其平均（北緯 15.464°、東經 101.413°；原點是 GEM 給 Hanuman 1、5、9、10 的同一點（在 Hanuman 10 的範圍內），在約 18.2 km 外）。機組為 19 部西門子歌美颯 2.5 MW', 'Table 2 of the ADB environmental and social monitoring report for 2020 lists the 19 turbine positions (Watabaek subdistrict, Thep Sathit district); the point moves to their mean (15.464 N, 101.413 E; the old point was the single GEM point given to Hanuman 1, 5, 9 and 10 (inside Hanuman 10), about 18.2 km away). It has 19 Siemens Gamesa 2.5 MW turbines', 'https://www.adb.org/sites/default/files/project-documents/53255/53255-001-esmr-en_9.pdf', lat=15.464, lon=101.413, turbine='19x Siemens Gamesa 2.5 MW'),
    fix('THA', 'Hanuman 9 wind farm', G, '亞洲開發銀行（ADB）2020 年度環境社會監測報告表 2 的 16 部風機座標（Thep Sathit 縣 Watabaek 分區）；點位改為其平均（北緯 15.485°、東經 101.449°；原點是 GEM 給 Hanuman 1、5、9、10 的同一點（在 Hanuman 10 的範圍內），在約 13.6 km 外）。機組為 16 部西門子歌美颯 2.5 MW', 'Table 2 of the ADB environmental and social monitoring report for 2020 lists the 16 turbine positions (Watabaek subdistrict, Thep Sathit district); the point moves to their mean (15.485 N, 101.449 E; the old point was the single GEM point given to Hanuman 1, 5, 9 and 10 (inside Hanuman 10), about 13.6 km away). It has 16 Siemens Gamesa 2.5 MW turbines', 'https://www.adb.org/sites/default/files/project-documents/53255/53255-001-esmr-en_9.pdf', lat=15.485, lon=101.449, turbine='16x Siemens Gamesa 2.5 MW'),
    fix('THA', 'Subyai (Chaiyaphum)', C, '點位改為 OpenStreetMap 風場關係「Chaiyaphum Wind Farm」（16162037，業主 EGCO Group、80 MW、2016）32 部風機的平均（北緯 15.603°、東經 101.538°，猜也蓬府 Subyai（Sap Yai）縣；原點在南南東約 7 km，落在 Hanuman 10 的範圍）', 'The point moves to the mean of the 32 turbines of the OpenStreetMap wind-farm relation “Chaiyaphum Wind Farm” (16162037; owner EGCO Group, 80 MW, 2016): 15.603 N, 101.538 E, in Subyai (Sap Yai) district, Chaiyaphum (the old point was about 7 km SSE, inside Hanuman 10)', 'https://www.openstreetmap.org/relation/16162037', lat=15.603, lon=101.538, turbine='32x 2.5 MW'),
    fix('VNM', 'Dong Hai V1-4 Offshore wind farm', G, 'GEM 這筆的本地名稱是「Nhà máy điện gió Đông Hải 1 Giai đoạn 4」（東海 1 號第 4 期），狀態引用的工貿部 1509/QĐ-BCT 號決定（2025-05-30）把它列在薄遼省（50 MW、2025–2030）；「V1-4」與茶榮外海的點、業主 SC-CCG 來自另一個茶榮 V1-4 場址的舊資料（茶榮 V1-4 是 REE 的 Duyên Hải，已另有紀錄）。越通社 2026-08-28：金甌省（原薄遼）在東海社為東海 1 號第 3、4 期與東海 13 號第 2 期舉行啟動儀式，第 4 期由 Miền Tây 風電股份公司投資、50 MW、目標 2028 年第 4 季完成，之後才做勘察與可行性研究。改名、改業主、改為規劃中（2028），點位暫用同名第 1–2 期的概略點', 'GEM’s local name for this record is “Nhà máy điện gió Đông Hải 1 Giai đoạn 4” (Dong Hai 1 phase 4), and its status source, MOIT Decision 1509/QĐ-BCT (30 May 2025), lists that project under Bạc Liêu province (50 MW, 2025–2030); the “V1-4” label, the point off Trà Vinh and the owner SC-CCG come from older data on a Trà Vinh V1-4 site (Trà Vinh’s V1-4 is REE’s Duyen Hai, already a separate record). VietnamPlus, 28 Aug 2026: Cà Mau (which absorbed Bạc Liêu) launched Dong Hai 1 phases 3 and 4 and Dong Hai 13 phase 2 in Đông Hải commune; phase 4 is Mien Tay Wind Power JSC’s, 50 MW, due by Q4 2028, with surveys and the feasibility study still to come. Renamed, owner changed, set to pre-construction (2028); the point provisionally takes the approximate point of phases 1–2', 'https://www.vietnamplus.vn/ca-mau-khoi-dong-3-du-an-dien-gio-voi-tong-von-dau-tu-6300-ty-dong-post1133100.vnp', rename='Dong Hai 1 Phase 4 (Ca Mau)', zhname='東海1號四期（金甌）', owner='Mien Tay Wind Power JSC', st=2, year=2028, lat=9.101, lon=105.601, approx=True),
    fix('VNM', 'Dong Hai 1 Offshore wind farm · 3', G, '薄遼（今金甌）東海 1 號第 3 期：工貿部 1509/QĐ-BCT 號決定列在薄遼省（50 MW、2025–2030，接到屬於東海 1 號的和平 2 開關站）；越通社 2026-08-28：金甌省為第 3、4 期舉行啟動儀式，第 3 期由 Bắc Phương 風能股份公司投資、50 MW、在東海社海域、預計 2029 年第 1 季完成。GEM 的點（北緯 9.352°、東經 109.146°）在南海中、離岸約 390 km，改用同名第 1–2 期的概略點；改為規劃中（2029）並補業主', 'Dong Hai 1 phase 3 in Bạc Liêu (now Cà Mau): MOIT Decision 1509/QĐ-BCT lists it under Bạc Liêu (50 MW, 2025–2030, connecting to the Hòa Bình 2 switching station that belongs to Dong Hai 1); VietnamPlus, 28 Aug 2026: Cà Mau launched phases 3 and 4, phase 3 being Bac Phuong Wind Energy JSC’s, 50 MW, in the sea off Đông Hải commune, due by Q1 2029. GEM’s point (9.352 N, 109.146 E) is in the South China Sea about 390 km offshore, so the approximate point of phases 1–2 is used; set to pre-construction (2029) with the owner added', 'https://www.vietnamplus.vn/ca-mau-khoi-dong-3-du-an-dien-gio-voi-tong-von-dau-tu-6300-ty-dong-post1133100.vnp', rename='Dong Hai 1 Phase 3 (Ca Mau)', zhname='東海1號三期（金甌）', owner='Bac Phuong Wind Energy JSC', st=2, year=2029, lat=9.101, lon=105.601, approx=True),
    fix('VNM', 'Dong Hai 1 Phase 1 (Tra Vinh, Trungnam)', C, '點位改為 OpenStreetMap 風場關係「điện gió Đông Hải 1 Trà Vinh」（18122789，營運者中南集團、100 MW）25 部風機的平均（北緯 9.522°、東經 106.451°；原點在東北方約 14 km，靠近茶榮 V1-1～V1-3）', 'The point moves to the mean of the 25 turbines of the OpenStreetMap wind-farm relation “điện gió Đông Hải 1 Trà Vinh” (18122789; operator Trungnam Group, 100 MW): 9.522 N, 106.451 E (the old point was about 14 km north-east, near Trà Vinh V1-1 to V1-3)', 'https://www.openstreetmap.org/relation/18122789', lat=9.522, lon=106.451),
    fix('DEU', 'Erbes-Büdesheim wind farm', G,
        'GEM 的 15 MW 取自 The Wind Power 的「5 部 Vestas V112、15,375 kW」（Erbes-Büdesheim／Offenheim／Nack），就是 MaStR 的「Windpark Offenheim」：5 部 V112，2013 年 12 月至 2014 年 2 月併網，'
        '營運公司 ERG Wind Erbes Büdesheim GmbH & Co. KG, Standort Offenheim；GEM 的 2012 年與座標取自村北另一群 2012 年的 Senvion 3.4M104，改為 2013 年、座標移到這 5 部的中心',
        'GEM’s 15 MW comes from The Wind Power’s “5 Vestas V112, 15,375 kW” (Erbes-Büdesheim/Offenheim/Nack), i.e. MaStR’s “Windpark Offenheim”: 5 V112 connected December 2013 – February 2014, '
        'operated by ERG Wind Erbes Büdesheim GmbH & Co. KG, Standort Offenheim; GEM’s 2012 and its point come from a different group of 2012 Senvion 3.4M104 north of the village, so the year becomes 2013 and the point moves to the centre of the five',
        'https://www.thewindpower.net/windfarm_en_24358.php', year=2013, lat=49.741, lon=8.026),
    fix('DEU', 'Lütjenholm wind farm', G,
        '「Windpark Lütjenholm」是 4 部 Senvion（REpower）3.4M104、13.6 MW，2013 年併網，就是 MaStR 的「WPL」（Bargum／Lütjenholm，OpenStreetMap 的風場範圍是同一批機位）；'
        'GEM 的座標在東方約 4 km 的 Goldelund，那裡是另一座 BWP Veer Dörper，改到這 4 部的中心',
        '“Windpark Lütjenholm” is 4 Senvion (REpower) 3.4M104, 13.6 MW, connected in 2013: MaStR’s “WPL” at Bargum/Lütjenholm (the OpenStreetMap plant has the same turbine positions); '
        'GEM’s point is about 4 km east at Goldelund, where the separate BWP Veer Dörper stands, so it moves to the centre of the four',
        'https://www.openstreetmap.org/relation/14965140', lat=54.674, lon=9.036),
    fix('DEU', 'Zettingen wind farm', G,
        '補上商轉年 2009：MaStR 的「Zettingen」6 部 Nordex N90 中 5 部 2009 年 12 月、1 部 2010 年 6 月併網（Gamesa 開發，2010 年 9 月售予 IKEA）',
        'Start year 2009 added: of MaStR’s six Nordex N90 “Zettingen”, five were connected in December 2009 and one in June 2010 (developed by Gamesa, sold to IKEA in September 2010)',
        'https://www.marktstammdatenregister.de/MaStR/Datendownload', year=2009),
    fix('DEU', 'Bornstedt-Holdenstedt wind farm', G,
        'MVV 的「Windpark Holdenstedt-Bornstedt」是 8 部、12 MW，就是 MaStR 的 8 部 GE 1.5sl（2006 年 7 月併網，Allstedt／Bornstedt）；GEM 的 2010 年是旁邊別批機組的年份，改為 2006',
        'MVV’s “Windpark Holdenstedt-Bornstedt” has 8 turbines and 12 MW, i.e. MaStR’s 8 GE 1.5sl connected in July 2006 (Allstedt/Bornstedt); GEM’s 2010 belongs to other turbines nearby, so the year becomes 2006',
        'https://web.archive.org/web/20240131130640/https://www.mvv.de/en/about-us/group-of-companies/mvv-umwelt/renewable-energies/windfarms-on-shore?tx_maps2_maps2%5BmapProviderRequestsAllowedForMaps2%5D=1&cHash=c4995b927adfc78d8d92015e95b3acdc', year=2006),
    fix('DEU', 'Süderauerdorf wind farm', G, '2017 年 4 部 Siemens SWT-3.0-113（12 MW），2023 年同一個 BWP Süderauerdorf 再加 2 部 SWT-DD-130（8.6 MW，MaStR）', '4 Siemens SWT-3.0-113 in 2017 (12 MW), and 2 SWT-DD-130 added under the same BWP Süderauerdorf name in 2023 (8.6 MW, MaStR)', 'https://www.marktstammdatenregister.de/MaStR/Datendownload', mw=20.6, ph=[[2017, 12.0], [2023, 8.6]]),
    fix('POL', 'Baltica I Offshore wind farm', G,
        '2025 年 12 月 17 日波蘭首次離岸風電差價合約競標落選（PGE 得標的是 Baltica 9）；原訂 2032 年底商轉以得標為前提，之後沒有新的預定年；由 PGE 集團（PGE Baltica）開發',
        'Lost Poland’s first offshore wind CfD auction on 17 December 2025 (PGE won with Baltica 9 instead); the end-2032 commissioning target depended on winning it, and no new date has been given; developed by the PGE Group (PGE Baltica)',
        'https://globenergia.pl/wyniki-aukcji-offshore-jeden-projekt-nie-uzyskal-wsparcia/', year=0, owner='PGE Baltica (PGE Group)', note=True),
    fix('JPN', 'Kakegawa wind farm', G,
        '機組是 Enercon E-82（2,300 kW，6 部，2020 年 7 月交貨；日立 Power Solutions 的 Enercon 國內交貨表）',
        'The turbines are Enercon E-82 (2,300 kW, 6 units, delivered July 2020; Hitachi Power Solutions’ Enercon delivery list)',
        'https://www.hitachi-power-solutions.com/energy/wind-solor/wind-power/case/doc/doc_2024.pdf', turbine='6 x Enercon E-82 2.3 MW'),
    dup('CHN', 'Shanghai Fengxian Bay Retrofit and Upgrade wind farm', G, ('Shanghai Fengxian Haiwan 1 wind farm', G), '同一個汰換案：上海市發改委 2023 年清單的「奉賢海灣風電場改造升級」（上海新能源環保工程，陸上風電 4.8 萬瓩，前期）在 2024 年清單改名「上海奉賢海灣風力發電場一期擴容工程」（4.8 萬瓩，調整納入，執行風電場改造升級辦法），2025、2026 年清單擴大為 6.25 萬瓩；2026 年清單只剩「一期擴容工程」。GEM 把 2023 與 2025 年版本各列一筆，保留 62.5 MW 那筆', 'One repowering project: the Shanghai DRC’s 2023 list item “Fengxian Haiwan wind farm repowering” (Shanghai New Energy & Environmental Protection Engineering, onshore wind, 48 MW, pre-construction) became “Fengxian Haiwan wind farm phase 1 expansion” in the 2024 list (48 MW, re-included under the repowering rules) and grew to 62.5 MW in the 2025 and 2026 lists; the 2026 list has only the phase 1 expansion. GEM lists the 2023 and the 2025 versions as two projects; the 62.5 MW one is kept', 'https://fgw.sh.gov.cn/cmsres/de/de4b42f5f30241c88757752ef1004c34/54a6401b19396ff535006fd29d60218f.pdf'),
    fix('CHN', 'CTG Dafeng H8-2', C, '三峽大豐 H8-2 離岸約 72 km（offshoreWIND.biz 2021-12）；GEM 依鹽城市政府資料標的確切位置在大豐毛竹沙海域（北緯 33.3225°、東經 121.5927°），落在 OpenStreetMap 依海事局通告 715/2025 繪製的風場範圍（way 1343826793）裡；點位改到這裡。原點位（33.2 N、121.3 E）在西南方約 30 km，落在 OpenStreetMap 標為 H17 的場址範圍（way 1454078619，三峽 800 MW 項目的一區）', 'CTG Dafeng H8-2 lies some 72 km offshore (offshoreWIND.biz, Dec 2021); GEM gives its exact position from Yancheng government data in the Maozhusha area of Dafeng (33.3225 N, 121.5927 E), inside the wind-farm area OpenStreetMap drew from MSA notice 715/2025 (way 1343826793); the point moves there. The old point (33.2 N, 121.3 E), about 30 km south-west, lies inside the area OpenStreetMap labels H17 (way 1454078619, one site of CTG’s 800 MW project)', 'https://www.gem.wiki/Jiangsu_Dafeng_H8-2_Offshore_wind_farm', lat=33.3225, lon=121.5927),
    fix('CHN', 'Zhejiang Jiaxing 2 Offshore wind farm', G, 'OpenStreetMap 的風場範圍 way 1177759242 標名「华能嘉兴2号海上风电场」，範圍北緯 30.563–30.654°、東經 121.445–121.500°；點位改為範圍中心（北緯 30.608°、東經 121.473°），原點位在其西方約 13 km', 'OpenStreetMap wind-farm area way 1177759242 is named “华能嘉兴2号海上风电场” and spans 30.563–30.654 N, 121.445–121.500 E; the point moves to its centre (30.608 N, 121.473 E), about 13 km east of the old one', 'https://www.openstreetmap.org/way/1177759242', lat=30.608, lon=121.473),
    fix('CHN', 'Zhejiang Energy Jiaxing 1', C, 'OpenStreetMap 的風場範圍 way 1300965884 標名「浙能嘉兴1号海上风电场」，範圍北緯 30.394–30.515°、東經 121.454–121.499°（嘉興 2 號範圍的南側）；點位改為範圍中心（北緯 30.455°、東經 121.476°），原點位在其西北約 24 km', 'OpenStreetMap wind-farm area way 1300965884 is named “浙能嘉兴1号海上风电场” and spans 30.394–30.515 N, 121.454–121.499 E (south of the Jiaxing 2 area); the point moves to its centre (30.455 N, 121.476 E), about 24 km south-east of the old one', 'https://www.openstreetmap.org/way/1300965884', lat=30.455, lon=121.476),
    # ------------------------------------------------ 2026-10-08 第八批（第十四輪資料疑點；出處原文以 check_quotes.py 核對）
    fix('CHN', "CTG Zhangpu Liu'ao Phase 2", C,
        '福建省政府 2023-12-25 的二期用海變更批復（閩政海域〔2023〕45 號）附宗海界址點坐標：風機區在北緯 23.894–23.947°、東經 118.174–118.245°（另有海纜往西接回六鰲）；點位改為風機區中心（北緯 23.921°、東經 118.209°），原點位在其西南約 30 km。OpenStreetMap 依海事局通告 1182/2024 畫的無名風場範圍（way 1334215514）與此重合',
        "The Fujian government's approval of phase 2's sea-use change (25 Dec 2023, Min Zheng Hai Yu [2023] 45) lists its boundary points: the turbine area spans 23.894–23.947 N, 118.174–118.245 E (with the export cable running west to Liu'ao); the point moves to the centre of that area (23.921 N, 118.209 E), about 30 km north-east of the old one. The unnamed wind-farm area OpenStreetMap drew from MSA notice 1182/2024 (way 1334215514) covers the same ground",
        'https://zrzyt.fujian.gov.cn/zwgk/zfxxgkzl/zfxxgkml/hygl/202401/t20240104_6372449.htm', lat=23.921, lon=118.209),
    fix('CHN', "Fujian Zhangpu Liu'Ao Offshore wind farm · D", G,
        '六鰲 D 區（402 MW）是海峽發電已核准的項目（2018 年券商報告已列），但查無開工紀錄：二期在 2023 年開工時與 2024 年都還被稱為閩南首個海上風電項目，2024-06 海峽發電的項目清單只列「負責控股建設漳浦六鰲二期」'
        '與「籌建平海灣 DE 區」，沒有 D 區；改為前期開發（GEM 寫興建中）。GEM 的點位是貼近六鰲海岸的概略位置，確切場址待查證',
        "Liu'ao area D (402 MW) is an approved Straits Power project (already listed in a 2018 broker report) with no record of construction: phase 2 was still called the first offshore wind project in southern Fujian when it started in 2023 and in 2024, and Straits Power's project list of June 2024 names only Zhangpu Liu'ao phase 2 (under construction) and Pinghai Bay DE (in preparation), not area D; moved to pre-construction (GEM says construction). GEM's point is an approximate one close to the Liu'ao coast; the real site is unverified",
        'https://epaper.cs.com.cn/zgzqb/images/2024-06/08/B075/zqB07508.pdf', st=2, note=True, zhname='福建漳浦六鰲海上風電場D區'),
    dup('DEU', 'Lichtenau wind farm', G, ('Paderborn wind farm', G),
        'GEM 的 Lichtenau（11 MW、1997、RWE）是 1997–98 年 Lichtenau-Asseln「Windpark Asseln」的一部分：當地鄉土協會的介紹寫整座風場 62 部、36 MW，1997 年 12 月首次併網、1998 年 5 月完工，'
        '營運者「Diverse Betreiber 23 部、Asselner Windkraft 18 部、WINKRA Lichtenau 21 部」；The Wind Power 的 Lichtenau 頁列 18 部 Enercon E-40「開發商 Winkra、營運者 RWE」。GEM 另一筆 Paderborn（36 MW、1998，出處就是這篇介紹）是整座風場，本筆重複',
        'GEM’s Lichtenau (11 MW, 1997, RWE) is part of the 1997–98 “Windpark Asseln” at Lichtenau-Asseln: the village heritage society’s page gives the whole park as 62 turbines and 36 MW, first feed-in in December 1997 and completion in May 1998, '
        'with operators “various operators 23, Asselner Windkraft 18, WINKRA Lichtenau 21”; The Wind Power lists 18 Enercon E-40 there with “developer Winkra, operator RWE”. GEM’s separate Paderborn record (36 MW, 1998, sourced to that page) is the whole park, so this one is a duplicate',
        'https://web.archive.org/web/20240126012246/https://www.asseln.de/index.php?option=com_content&view=article&id=4&Itemid=21'),
    fix('CHN', 'Fujian Putian Pinghaiwan Offshore wind farm', G,
        '莆田海事局 2025-12 通航要素通告（已建成）：平海灣 F 區採用 3 台 6 MW、26 台 7 MW 風電機組（合計 200 MW），海域水深 10–25 m',
        'Putian MSA navigation notice (Dec 2025, built): Pinghai Bay area F uses 3 × 6 MW and 26 × 7 MW turbines (200 MW in all), in 10–25 m of water',
        'https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=43c18726195d4eb29b36542045a78ee0', turbine='3x 6 MW + 26x 7 MW'),
    # ------------------------------------------------ 2026-10-08 第九批（第十五輪資料疑點；出處原文以 check_quotes.py 核對）
    fix('DEU', 'Paderborn wind farm', G,
        '即 Lichtenau-Asseln 的 Windpark Asseln（GEM 的別名 Asseln wind farm）；GEM 的概略點位在風場北方約 2.7 km，靠近 2015–17 年另外的 WP LA、WP Lichtenau 機組，改用德文維基的座標（北緯 51°38′24″、東經 8°54′35″）',
        'This is the Windpark Asseln at Lichtenau-Asseln (GEM’s other name: Asseln wind farm); GEM’s approximate point is about 2.7 km north of the park, next to the separate WP LA and WP Lichtenau turbines of 2015–17, so the German Wikipedia coordinates are used (51°38′24″ N, 8°54′35″ E)',
        'https://de.wikipedia.org/wiki/Windpark_Lichtenau-Asseln', lat=51.64, lon=8.91),
    fix('DEU', 'Asselner wind farm', G,
        'Asselner Windpark：2015 年 12 月 7 部 Enercon E-92＋1 部 E-115（19.45 MW，The Wind Power）；MaStR 的同名群另有 2018 年 2 部（E-115 3 MW、E-82 2.3 MW），共 24.75 MW',
        'Asselner Windpark: 7 Enercon E-92 and one E-115 of December 2015 (19.45 MW, The Wind Power); MaStR’s group of that name adds 2 units of 2018 (an E-115 of 3 MW and an E-82 of 2.3 MW), 24.75 MW in all',
        'https://www.marktstammdatenregister.de/MaStR/Datendownload', mw=24.75, ph=[[2015, 19.45], [2018, 5.3]]),
    fix('CHN', "Fujian Zhangpu Liu'Ao Offshore wind farm · D", G,
        '點位改到漳州海事局 2026-08 通告（閩航通〔2026〕0531 號）的「D 區 4 號測風塔」（北緯 23°49′25.57″、東經 118°01′29.45″，2026-09 拆除）；測風塔不是場址中心，仍標概略位置；GEM 原點位貼近六鰲海岸，在其西北約 22 km',
        "The point moves to the 'area D met mast No. 4' of a Zhangzhou MSA notice of Aug 2026 (Min Hang Tong [2026] 0531; 23°49′25.57″ N, 118°01′29.45″ E, removed in Sept 2026); a met mast is not the centre of the site, so the point stays approximate; GEM's point hugged the Liu'ao coast about 22 km to the north-west",
        'https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=5747a71192184f58bf7a009e7d857649', lat=23.824, lon=118.025, approx=True),
    fix('CHN', 'CGN Shanwei Jiazi I', C,
        '甲子一 78 部明陽 6.45 MW（中國電力網 2022-04：擬安裝 78 台 MySE6.45MW、首台 6.45 MW 已裝；汕尾海事局 2025-08 備案參數：78 台 6.45 MW）。海事局備案的葉輪直徑為 168 m、輪轂高 100 m，與原寫的 MySE6.45-180（葉輪約 178–180 m）不合，型號尾碼沒有出處，改為只寫 6.45 MW（確切型號待查證）',
        'Jiazi I has 78 Mingyang 6.45 MW turbines (China Power, Apr 2022: 78 MySE6.45MW planned, first 6.45 MW unit erected; Shanwei MSA filed parameters, Aug 2025: 78 × 6.45 MW). The MSA filing gives a 168 m rotor and 100 m hub, which does not fit the stored MySE6.45-180 (a 178–180 m rotor); the suffix had no source, so only the 6.45 MW rating is kept (exact model unverified)',
        'https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=255290a5a1bf454781d9520088a87167', turbine='78x Mingyang MySE 6.45 MW'),
    # ------------------------------------------------ 2026-10-09 第十批（第十六輪資料疑點；出處原文以 check_quotes.py 核對）
    fix('CHN', 'Longyuan Putian Nanri Island', C,
        '龍源莆田南日島（三墩風電場）是 100 部西門子 SWT-4.0-130（福建龍源 2026-07 招標：「現已安裝有海上 100 台西門子 SWT-4.0-130 變槳變速型機組」），不是金風 GW171-6.45',
        'Longyuan Putian Nanri Island (the Sandun wind farm) has 100 Siemens SWT-4.0-130 turbines (Fujian Longyuan tender, July 2026: “100 Siemens SWT-4.0-130 pitch-regulated variable-speed units are installed at sea”), not Goldwind GW171-6.45',
        'http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20260731/e9b7aeb1-a2d1-4db9-b7a9-afc63483abb8.html', turbine='100x Siemens SWT-4.0-130'),
    fix('CHN', 'Longyuan Putian Nanri Island', C,
        '全部投產是 2021 年底（福建龍源 2022-08 招標：「安裝 100 台西門子 4MW 雙饋風力發電機組，機組離岸距離在 0–14 公里範圍內，於 2021 年底完成全部投產發電」），不是 2019 年',
        'All units were in production by the end of 2021 (Fujian Longyuan tender, Aug 2022: 100 Siemens 4 MW doubly-fed turbines 0–14 km offshore, “all put into production by the end of 2021”), not 2019',
        'http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20220817/475120fe-d699-4cc3-af64-5bd9bf13f507.html', year=2021),
    # ------------------------------------------------ 2026-10-09 第十一批（第十八輪：事件對應與資料疑點；出處原文以 check_quotes.py 核對）
    fix('CHN', 'Longyuan Rudong Intertidal Demo', C, '龍源如東 30 MW 潮間帶試驗風電場 2010 年 9 月投產時是 9 家廠商的 16 部試驗機組、3.2 萬瓩（1.5–3 MW）；龍源 2019 與 2024 年運維招標列出現存 15 部、8 種機型：遠景 EN82/1.5、聯合動力 UP82-1500、海裝 H93-2000、明陽 MY1.5S、三一 SE93/2000、華銳 SL3000、上海電氣 W2000 各 2 部，金風 GW100/2500 1 部（招標寫總容量 27.5 MW，但所列機組合計 29.5 MW）。第 16 部（2.5 MW）何時、為何不在清單上待查證；容量維持建成時的 32 MW',
        'Longyuan’s Rudong 30 MW intertidal test farm went into service in Sept 2010 with 16 test units from 9 makers, 32 MW (1.5–3 MW); Longyuan’s O&M tenders of 2019 and 2024 list the 15 units still there, 8 models: 2 each of Envision EN82/1.5, Guodian United Power UP82-1500, CSSC Haizhuang H93-2000, Mingyang MY1.5S, Sany SE93/2000, Sinovel SL3000 and Shanghai Electric W2000, and 1 Goldwind GW100/2500 (the tenders state 27.5 MW, but the listed units add up to 29.5 MW). When and why the 16th unit (2.5 MW) left is unverified; the capacity stays at the as-built 32 MW',
        'http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20190814/91f278b0-cb76-4c62-81f7-9f3d77c5c03f.html',
        turbine='16 test units, 1.5–3 MW; 15 listed since 2019: 2x Envision EN82-1.5, 2x Guodian UP82-1.5, 2x CSSC Haizhuang H93-2.0, 1x Goldwind GW100-2.5, 2x Mingyang MY1.5S, 2x Sany SE93-2.0, 2x Sinovel SL3000, 2x Shanghai Electric W2000', note=True),
    dup('BRA', 'Rei dos Ventos 1', P, ('Ventus wind farm', G), 'WRI 的 Rei dos Ventos 1（58.5 MW，南緯 5.101°、西經 36.202°）就是 GEM「Ventus wind farm」（Complexo Eólico Ventus，187 MW，AES）的一期 Rei dos Ventos 1（58.45 MW，座標相同）',
        'WRI’s Rei dos Ventos 1 (58.5 MW, 5.101 S, 36.202 W) is the Rei dos Ventos 1 phase (58.45 MW, same coordinates) of GEM’s “Ventus wind farm” (Complexo Eólico Ventus, 187 MW, AES)',
        'https://www.gem.wiki/Ventus_wind_farm'),
    fix('BRA', 'Ventos de São Rafael wind farm', G, '補上商轉年 2025：本筆 499.5 MW 是 Ventos de São Rafael 01–07 與 09 八座風場（GEM 第 1–7、9 期，各 58.5–63 MW），巴西電力監理署 ANEEL 機組商轉許可開放資料（2026-10-06 版）列出這八座的 111 部 4.5 MW 機組，都在 2025 年 9 月 3 日至 12 月 23 日取得商業運轉許可', 'Commissioning year 2025: the 499.5 MW are the eight parks Ventos de São Rafael 01–07 and 09 (GEM phases 1–7 and 9, 58.5–63 MW each); ANEEL’s open data on generating units released for commercial operation (6 Oct 2026 edition) list their 111 units of 4.5 MW, all released between 3 Sep and 23 Dec 2025', 'https://dadosabertos.aneel.gov.br/datastore/dump/75419902-c692-498b-a6ef-85f6d4beb5b2?format=csv&q=Ventos%20de%20S%C3%A3o%20Rafael&fields=NomUsina,NumUgUsina,MdaPotenciaLiberadaComercial,DatLiberOpComerRealizado&sort=NomUsina,NumUgUsina', year=2025),
    fix('BRA', 'Serra Das Almas wind farm', G, '補上商轉年 2025：本筆 261 MW 是 PEC Energia 的 Serra das Almas I–VI 六座風場（GEM 第 1–6 期），ANEEL 機組商轉許可開放資料（2026-10-06 版）列出這六座的 58 部 4.5 MW 機組，都在 2025 年 6 月 24 日至 8 月 22 日取得商業運轉許可', 'Commissioning year 2025: the 261 MW are PEC Energia’s six parks Serra das Almas I–VI (GEM phases 1–6); ANEEL’s open data on generating units released for commercial operation (6 Oct 2026 edition) list their 58 units of 4.5 MW, all released between 24 Jun and 22 Aug 2025', 'https://dadosabertos.aneel.gov.br/datastore/dump/75419902-c692-498b-a6ef-85f6d4beb5b2?format=csv&q=Serra%20das%20Almas&fields=NomUsina,NumUgUsina,MdaPotenciaLiberadaComercial,DatLiberOpComerRealizado&sort=NomUsina,NumUgUsina', year=2025),
    fix('IND', 'Tanot wind farm', G, '補上商轉年 2015：GlobalData（Power Technology 轉載）稱 Greenko 的 Tanot 風場（拉賈斯坦，120 MW）分期興建，建成後於 2015 年 6 月商轉', 'Commissioning year 2015: GlobalData (via Power Technology) says Greenko’s 120 MW Tanot wind farm in Rajasthan was built in phases and commissioned in June 2015 once construction was complete', 'https://www.power-technology.com/?p=241025', year=2015),
    fix('FRA', 'Village du Richebourg wind farm', G, '位置更正：En Avel Braz 的 Village de Richebourg I（22 部，92.4 MW）與 II 位於奧布省（Aube），法國國家發電設施登錄（ODRÉ）的「PARC EOLIEN RICHEBOURG 6」在 Salon 鎮，環評意見書也說 Richebourg III（Villiers-Herbisse、Semoine）緊鄰 I、II 期；原座標是加來海峽省同名的 Richebourg 村，偏離約 230 km。改用 Salon 鎮座標（概略位置）', 'Location corrected: En Avel Braz’s Village de Richebourg I (22 turbines, 92.4 MW) and II are in the Aube department; the national register of production installations (ODRÉ) places “PARC EOLIEN RICHEBOURG 6” in Salon, and the environmental authority’s opinion puts Richebourg III (Villiers-Herbisse, Semoine) next to phases I and II. The old point was the village of Richebourg in Pas-de-Calais, about 230 km away. Now at Salon (approximate)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aube%22%20and%20commune%3D%22Salon%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', lat=48.641, lon=4.004, approx=True),
    dup('CHL', 'La Cabana (Enel) wind farm', G, ('La Cabaña wind farm (Chile)', G), '與「La Cabaña wind farm (Chile)」（106 MW、2024）是同一座：Enel Green Power Chile 在阿勞卡尼亞大區 Angol 的 La Cabaña 風場，22 部 4.8 MW、合計 105.6 MW，2022 年 11 月開工，已商轉', 'Same farm as “La Cabaña wind farm (Chile)” (106 MW, 2024): Enel Green Power Chile’s La Cabaña wind farm in Angol, Araucanía, 22 turbines of 4.8 MW, 105.6 MW; construction began in November 2022 and it is now in commercial operation', 'https://www.nsenergybusiness.com/news/enel-green-power-starts-construction-la-cabana-wind-farm-chile/'),
    fix('BRA', 'Ventos de São Rafael wind farm · 10, 8', G, 'GEM 標為興建中，實已商轉：ANEEL 機組商轉許可開放資料（2026-10-06 版）中 Ventos de São Rafael 08（14 部，63 MW）於 2025 年 12 月 18 日、10（13 部，58.5 MW）於 2026 年 2 月 10 日取得商業運轉許可', 'Listed by GEM as under construction, but operating: in ANEEL’s open data on generating units released for commercial operation (6 Oct 2026 edition), Ventos de São Rafael 08 (14 units, 63 MW) was released on 18 Dec 2025 and 10 (13 units, 58.5 MW) on 10 Feb 2026', 'https://dadosabertos.aneel.gov.br/datastore/dump/75419902-c692-498b-a6ef-85f6d4beb5b2?format=csv&q=Ventos%20de%20S%C3%A3o%20Rafael&fields=NomUsina,NumUgUsina,MdaPotenciaLiberadaComercial,DatLiberOpComerRealizado&sort=NomUsina,NumUgUsina', st=0, year=2026, ph=[[2025, 63], [2026, 58.5]], note=True),
    fix('BRA', 'Ventos de São Rafael wind farm · 11', G, 'GEM 標為準備興建，實已商轉：ANEEL 機組商轉許可開放資料（2026-10-06 版）中 Ventos de São Rafael 11 的 14 部 4.5 MW 機組（63 MW）於 2026 年 7 月 16 日至 8 月 12 日取得商業運轉許可', 'Listed by GEM as pre-construction, but operating: in ANEEL’s open data on generating units released for commercial operation (6 Oct 2026 edition), the 14 units of 4.5 MW (63 MW) of Ventos de São Rafael 11 were released between 16 Jul and 12 Aug 2026', 'https://dadosabertos.aneel.gov.br/datastore/dump/75419902-c692-498b-a6ef-85f6d4beb5b2?format=csv&q=Ventos%20de%20S%C3%A3o%20Rafael&fields=NomUsina,NumUgUsina,MdaPotenciaLiberadaComercial,DatLiberOpComerRealizado&sort=NomUsina,NumUgUsina', st=0, year=2026, note=True),
    fix('CHN', 'Inner Mongolia Zhengxiangbai Banner (Shanxi International Energy) Green Hydrogen wind farms', G, '正鑲白旗300萬瓩風光製氫一體化項目（風電250萬瓩、光伏50萬瓩，格盟諾金新能源，山西國際能源集團儲能公司持股65%）2024年12月27日取得建設指標，2025年11月可研才通過評審；原訂一期2025年6月開工、二期2025年10月開工，報導指一期仍未開工（晉融社經東方財富 2025-11-27）。GEM 把二期 1,350 MW 標為營運中，實為規劃中', 'The Zhengxiangbai 3 GW wind-solar-hydrogen project (2,500 MW wind, 500 MW solar; Gemeng Nuojin New Energy, 65% owned by Shanxi International Energy Group Energy Storage) received its construction quota on 27 Dec 2024 and its feasibility study was approved only in Nov 2025; phase 1 was due to start in June 2025 and phase 2 in Oct 2025, but phase 1 had not started (Jinrongshe via East Money, 27 Nov 2025). GEM lists the 1,350 MW phase 2 as operating; it is still pre-construction', 'https://caifuhao.eastmoney.com/news/20251127100947595412760', st=2, note=True),
    dup('CHN', 'Inner Mongolia Shangdu (Huaneng Beifang) wind farm · Duolun', G, ('Shangdu Huaneng Beifang', C), '同一座風場：精選紀錄「Shangdu Huaneng Beifang」（1,600 MW）就是華能北方上都百萬千瓦級風電基地，分正藍旗場區 1,100 MW 與多倫場區 500 MW（北方多倫），全容量併網日期 2023-06-30（蒙電華能重組審核問詢回覆 2025-12）；GEM 的正藍旗分期已在建置時併入精選紀錄，多倫分期是重複', 'Same farm: the curated record “Shangdu Huaneng Beifang” (1,600 MW) is Huaneng Beifang’s Shangdu 1 GW-class wind base, made up of the Zhenglan area (1,100 MW) and the Duolun area (500 MW, Beifang Duolun), fully connected on 30 June 2023 (MengDian HuaNeng restructuring Q&A reply, Dec 2025); GEM’s Zhenglan phase is already merged into the curated record by the build, so the Duolun phase is a duplicate', 'https://file.finance.qq.com/finance/hs/pdf/2025/12/03/1224844317.PDF'),
    fix('CHN', 'Shangdu Huaneng Beifang', C, '華能北方上都百萬千瓦級風電基地（正藍旗 1,100 MW、多倫 500 MW）2022 年 10 月底起陸續併網，2023 年 6 月 30 日全容量併網（中新網經能源在線 2023-07-05；蒙電華能重組審核問詢回覆 2025-12）；原寫 2022 年', 'Huaneng Beifang’s Shangdu 1 GW-class wind base (Zhenglan 1,100 MW, Duolun 500 MW) began connecting at the end of Oct 2022 and reached full grid connection on 30 June 2023 (China News Service via news2e, 5 July 2023; MengDian HuaNeng restructuring Q&A reply, Dec 2025); the row said 2022', 'https://www.news2e.com/e/action/ShowInfo.php?classid=20&id=566', year=2023),
    fix('CHN', 'Xinjiang Urumqi (Huadian Dabancheng) wind farm · Area 1, Area 2, Area 6, Area 7, Area 8, Area 9', G, '華電北疆烏魯木齊 100 萬瓩風光基地（風電 80 萬瓩、光伏 20 萬瓩，達坂城 10 個地塊）2023 年 6 月 30 日全容量併網（中國華電經新華網新疆頻道 2023-07-10）', 'Huadian’s North Xinjiang Ürümqi 1 GW wind-solar base (800 MW wind, 200 MW solar on 10 plots in Dabancheng) reached full grid connection on 30 June 2023 (China Huadian via Xinhua Xinjiang, 10 July 2023)', 'http://xj.news.cn/20230710/eed62de1a1f4428c9a894351549d70c5/c.html', year=2023),
    fix('CHN', 'Xinjiang Urumqi (Huadian Dabancheng) wind farm · Area 4, Area 5', G, '華電北疆烏魯木齊 100 萬瓩風光基地（風電 80 萬瓩、光伏 20 萬瓩，達坂城 10 個地塊）2023 年 6 月 30 日全容量併網（中國華電經新華網新疆頻道 2023-07-10）', 'Huadian’s North Xinjiang Ürümqi 1 GW wind-solar base (800 MW wind, 200 MW solar on 10 plots in Dabancheng) reached full grid connection on 30 June 2023 (China Huadian via Xinhua Xinjiang, 10 July 2023)', 'http://xj.news.cn/20230710/eed62de1a1f4428c9a894351549d70c5/c.html', year=2023),
    fix('CHN', 'Gansu Subei Mazongshan Yinmaxia Area A wind farm', G, '肅北縣馬鬃山飲馬峽 A 區 15 萬瓩風電項目（業主肅北蒙古族自治縣騰達風電，運達風電總包招標 2022-07）即「馬鬃山騰達 15 萬瓩風電項目」：30 部 5 MW，2023 年 12 月全容量併網（中新網甘肅 2023-12-28）；原寫 155 MW', 'The Subei Mazongshan Yinmaxia area A 150 MW wind project (owner Subei Mongol Autonomous County Tengda Wind Power; Windey EPC tender, July 2022) is the “Mazongshan Tengda 150 MW” project: 30 × 5 MW, fully connected in Dec 2023 (China News Service Gansu, 28 Dec 2023); the row said 155 MW', 'http://www.gs.chinanews.com.cn/news/2023/12-28/367256.shtml', year=2023, mw=150, turbine='30x 5 MW'),
    fix('CHN', 'Xinjiang Altai Jimunai (State Power Investment) wind farm', G, '國家電投吉木乃 25 萬瓩風電項目（阿勒泰地區保障性併網項目，40 部 6.25 MW）2023 年 4 月全容量併網（國家電投新疆公司經電力網 2023-04-19）；項目位於吉木乃縣恰勒什海鄉的額爾齊斯河谷風區（新浪新聞 2023-02-27），原座標（北緯 42.48°、東經 85.463°）是新疆的代用點，改用恰勒什海鄉的位置（概略位置）', 'SPIC’s Jimunai 250 MW wind project (an Altay prefecture guaranteed-grid project, 40 × 6.25 MW) reached full grid connection in April 2023 (SPIC Xinjiang via chinapower.com.cn, 19 Apr 2023); it lies in the Irtysh valley wind area of Qialeshihai township, Jeminay county (Sina News, 27 Feb 2023), so the old Xinjiang placeholder (42.48 N, 85.463 E) is replaced by the township’s position (approximate)', 'http://www.chinapower.com.cn/flfd/xmjz/20230419/196883.html', year=2023, turbine='40x 6.25 MW', lat=47.53, lon=86.144, approx=True),
    fix('CHN', 'Inner Mongolia Wulatehou Banner 200 MW (Jingneng) wind farm', G, '烏拉特後旗京能 200 MW 風電項目（巴彥淖爾京能清潔能源電力公司，2022 年 6 月開工，40 部 5 MW）2023 年 3–4 月全容量併網（掌上巴彥淖爾 2023-04-02）', 'The Wulatehou Banner Jingneng 200 MW wind project (Bayannur Jingneng Clean Energy Power, started June 2022, 40 × 5 MW) reached full grid connection by early April 2023 (Bayannur city media, 2 Apr 2023)', 'https://baijiahao.baidu.com/s?id=1762074057272726588&wfr=spider&for=pc', year=2023, turbine='40x 5 MW', owner='Bayannur Jingneng Clean Energy Power Co Ltd'),
    fix('CHN', 'Inner Mongolia Keyouqian Banner 200 MW wind farm', G, '華能蒙東新能源恩輝風電場科爾沁右翼前旗 20 萬瓩風電項目 32 部風機 2023 年 6 月 9 日全部併網（電力網 2023-06-15）', 'All 32 turbines of Huaneng Mengdong New Energy’s Enhui wind farm, the Horqin Right Front Banner 200 MW project, were connected on 9 June 2023 (chinapower.com.cn, 15 June 2023)', 'http://mm.chinapower.com.cn/flfd/xmjz/20230615/205166.html', year=2023),
    fix('CHN', 'Hunan Jiangyong Shuimeitang wind farm', G, '華電永州水美塘 260 MW 風電項目（江永縣松柏鄉與瀟浦鎮，52 部 5.0 MW）2023 年 12 月 29 日全容量併網（央廣網 2023-12-30）', 'Huadian’s Yongzhou Shuimeitang 260 MW wind project (Songbai and Xiaopu, Jiangyong county; 52 × 5.0 MW) reached full grid connection on 29 Dec 2023 (CNR, 30 Dec 2023)', 'https://www.cnr.cn/hunan/yw/20231230/t20231230_526540744.shtml', year=2023, turbine='52x 5 MW'),
    fix('CHN', 'Inner Mongolia Alashanzuo Banner Zongbieli (China Resources) wind farm', G, '華潤新能源阿拉善宗別立 200 MW 風電項目 2023 年 6 月 30 日 32 部風機全容量併網，裝 32 部中車 6.25 MW（內蒙古日報 2023-07-21）', 'China Resources New Energy’s Alxa Zongbieli 200 MW wind project reached full grid connection with all 32 turbines on 30 June 2023, using 32 CRRC 6.25 MW units (Inner Mongolia Daily, 21 July 2023)', 'http://nm.people.com.cn/n2/2023/0721/c347198-40502062.html', year=2023, turbine='32x CRRC 6.25 MW', owner='China Resources New Energy'),
    fix('CHN', "Liaoning Tai'an (Anshan Liaodian) wind farm", G, '國家電投東北公司台安縣 200 MW 集中式風電項目（新台鎮、富家鎮，40 部 5 MW）2024 年 10 月 25 日全容量併網（遼寧日報經遼寧省政府網 2024-11-04；國家電投東北公司 2024-10-28）', 'SPIC Northeast’s Tai’an county 200 MW wind project (Xintai and Fujia towns, 40 × 5 MW) reached full grid connection on 25 Oct 2024 (Liaoning Daily via the Liaoning government site, 4 Nov 2024; SPIC Northeast, 28 Oct 2024)', 'https://www.ln.gov.cn/web/ywdt/jrln/tpxw/2024110409165961567/index.shtml', year=2024, turbine='40x 5 MW'),
    fix('CHN', 'Liaoning Zhangwu Xiliujiazi wind farm', G, '大金重工的阜新彰武西六家子 250 MW 風電項目「已經於去年建成」（大金重工投資者關係活動記錄 2024-09，即 2023 年建成）', 'Dajin Heavy Industry’s Fuxin Zhangwu Xiliujiazi 250 MW wind project “was completed last year” (Dajin investor-relations record, Sept 2024, i.e. completed in 2023)', 'http://static.cninfo.com.cn/finalpage/2024-09-01/1221106372.PDF', year=2023),
    dup('CHN', 'Jilin Tongyu (Huaneng) 2000 MW Unsubsidized wind farm', G, ('Jilin Tongyu Shihuadao wind farm', G), '同一座風場：華能通榆 200 萬瓩平價上網項目一期 20 萬瓩與二期 10 萬瓩建在什花道風電場（華能沉降觀測招標 2022-05），什花道 30 萬瓩（89 部風機）2021 年 12 月 30 日全容量併網（中國華能經世紀新能源網 2022-01-05），已是「Jilin Tongyu Shihuadao wind farm」（300 MW、2021）', 'Same farm: phase 1 (200 MW) and phase 2 (100 MW) of Huaneng’s Tongyu 2 GW unsubsidised project were built as the Shihuadao wind farm (Huaneng settlement-monitoring tender, May 2022); Shihuadao’s 300 MW (89 turbines) reached full grid connection on 30 Dec 2021 (China Huaneng via ne21, 5 Jan 2022) and is already the record “Jilin Tongyu Shihuadao wind farm” (300 MW, 2021)', 'https://www.ne21.com/news/show-167486.html'),
    fix('CHN', 'Xinjiang Urumqi (Huadian Dabancheng) wind farm · Area 3', G, '華電北疆烏魯木齊 100 萬瓩風光基地（風電 80 萬瓩、光伏 20 萬瓩，達坂城 10 個地塊）2023 年 6 月 30 日全容量併網（中國華電經新華網新疆頻道 2023-07-10）；GEM 把 80 萬瓩風電分成三筆（444＋300＋56 MW），這筆的座標是新疆的佔位點，不在達坂城', 'Huadian’s North Xinjiang Ürümqi 1 GW wind-solar base (800 MW wind, 200 MW solar on 10 plots in Dabancheng) reached full grid connection on 30 June 2023 (China Huadian via Xinhua Xinjiang, 10 July 2023); GEM splits the 800 MW of wind into three records (444 + 300 + 56 MW), and this one’s point is a Xinjiang placeholder, not Dabancheng', 'http://xj.news.cn/20230710/eed62de1a1f4428c9a894351549d70c5/c.html', year=2023),
    fix('CHN', 'Jilin Tongyu Shihuadao wind farm', G, '什花道風電場是華能通榆 200 萬瓩平價上網項目的一、二期（見同批 Tongyu 一期的 dup），在通榆縣；原座標（北緯 42.999°、東經 125.982°，與良井子同點）在通榆東南約 300 km，改用 GEM 對同一專案一期的點（通榆縣，概略位置）', 'Shihuadao is phases 1 and 2 of Huaneng’s Tongyu 2 GW unsubsidised project (see the Tongyu phase-1 dup in this batch), in Tongyu county; the old point (42.999 N, 125.982 E, shared with Liangjingzi) is about 300 km south-east of Tongyu, so it now uses GEM’s point for phase 1 of the same project (Tongyu county, approximate)', 'https://www.ne21.com/news/show-167486.html', lat=44.8, lon=123.3, approx=True),
    # ------------------------------------------------ 2026-10-09 第十二批（第十九輪：商轉年與資料疑點；出處原文以 check_quotes.py 核對）
    dup('FRA', 'Fontenelle-Montby wind farm', G, ('Rougemont wind farm', G), '同一座風場：Fontenelle-Montby 鎮的風機是 Innergex／VSB 的 Rougemont II（16 部 GE 120，44.5 MW）；法國國家發電設施登錄（ODRÉ）在 Fontenelle-Montby 與 Mésandans 只有 Energies du Plateau Central 2 的 4 個併網點、各 11.12 MW（合計 44.48 MW，2016-10 至 2017-10 併網），已含在 Rougemont 風場（80 MW，2017）', 'Same farm: the turbines in Fontenelle-Montby are Innergex/VSB’s Rougemont II (16 GE 120 units, 44.5 MW); the national register of production installations (ODRÉ) has only the four Energies du Plateau Central 2 delivery points of 11.12 MW each in Fontenelle-Montby and Mésandans (44.48 MW, connected Oct 2016 to Oct 2017), already part of the Rougemont wind farm record (80 MW, 2017)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Doubs%22%20and%20commune%20in%20%28%22Fontenelle-Montby%22%2C%22M%C3%A9sandans%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    dup('FRA', 'Pelade wind farm', G, ('Artigues Et Ollieres wind farm', G), '同一座風場：Provencialis 的 Colle Pelade 風場就是 Artigues 與 Ollières 的 22 部風機（2020-12-01 起運轉，NTR 收購的 48 MW 風場）；國家發電設施登錄的「Ferme éolienne de Pelade」4 個併網點合計 48.4 MW、2020-11-06 併網', 'Same farm: Provencialis’s Colle Pelade wind farm is the 22 turbines in Artigues and Ollières (operating since 1 Dec 2020, the 48 MW farm NTR bought); the national register’s “Ferme éolienne de Pelade” has four delivery points totalling 48.4 MW, connected on 6 Nov 2020', 'https://www.georisques.gouv.fr/webappReport/ws/installations/inspection/kechPa3nkXwlrxDJr3hpjwrav9FaC6zU'),
    dup('FRA', 'Les Vignottes wind farm', G, ('Vignottes wind farm', G), '同一座風場：國家發電設施登錄只有一座 Les Vignottes（Saron-sur-Aube，3 個併網點各 12 MW，合計 36 MW，2015 年 7 月併網），與 Vignottes 風場（36 MW，2015）相同', 'Same farm: the national register has a single Les Vignottes farm (Saron-sur-Aube, three 12 MW delivery points, 36 MW, connected July 2015), the same as the Vignottes wind farm record (36 MW, 2015)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Marne%22%20and%20commune%3D%22Saron-sur-Aube%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Tulipes wind farm', G, '補上商轉年 2020：國家發電設施登錄的「Ferme éolienne des Tulipes de Bus-la-Mésière」36 MW，2020-09-11 併網', 'Commissioning year 2020 added: the national register lists the “Ferme éolienne des Tulipes de Bus-la-Mésière”, 36 MW, connected on 11 Sep 2020', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Somme%22%20and%20commune%3D%22Bus-la-M%C3%A9si%C3%A8re%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020),
    fix('FRA', 'Longues Roies wind farm', G, '補上商轉年 2020：國家發電設施登錄的 Parc éolien des Longues Roies（Songy）5 個併網點 2020-09-17／18 併網（登錄容量合計 44.4 MW）', 'Commissioning year 2020 added: the national register lists the five delivery points of the Parc éolien des Longues Roies (Songy), connected on 17–18 Sep 2020 (44.4 MW registered in all)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Marne%22%20and%20commune%3D%22Songy%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020),
    fix('FRA', 'Plateau De Cabalas wind farm', G, '補上商轉年：國家發電設施登錄的 Cabalas 三個併網點（Joncels）分三年併網：Cabalas Centre 11.5 MW（2017-12）、Cabalas Ouest 9.2 MW（2018-12）、Cabalas Est 9.2 MW（2020-02），合計 29.9 MW', 'Commissioning years added: the national register lists the three Cabalas delivery points (Joncels) connected in three years: Cabalas Centre 11.5 MW (Dec 2017), Cabalas Ouest 9.2 MW (Dec 2018) and Cabalas Est 9.2 MW (Feb 2020), 29.9 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22H%C3%A9rault%22%20and%20commune%3D%22Joncels%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=29.9, year=2020, ph=[[2017, 11.5], [2018, 9.2], [2020, 9.2]]),
    fix('FRA', 'Vaux-Coulommes wind farm', G, '補上商轉年 2015：國家發電設施登錄在 Vaux-Champagne 有 Parc éolien Vaux Coulommes 等 3 個併網點各 10.6 MW（合計 31.8 MW），2014-12 至 2015-01-05 併網', 'Commissioning year 2015 added: the national register has three 10.6 MW delivery points in Vaux-Champagne, including Parc éolien Vaux Coulommes (31.8 MW in all), connected between Dec 2014 and 5 Jan 2015', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Ardennes%22%20and%20commune%3D%22Vaux-Champagne%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2015),
    fix('FRA', 'La Côte Du Cerisat wind farm', G, '補上商轉年 2020：DREAL 檢查報告說 Côte du Cerisat 風場有 15 部風機、4 個併網點，位於 Coole 與 Pringy；國家發電設施登錄在這兩鎮正好有 4 個 2020-07-09 併網的併網點（Pringy 3 × 13.2 MW、Coole 9.9 MW，合計 49.5 MW＝15 × 3.3 MW）', 'Commissioning year 2020 added: the DREAL inspection report says the Côte du Cerisat farm has 15 turbines and 4 delivery points in Coole and Pringy; the national register has exactly four delivery points in those two communes connected on 9 Jul 2020 (Pringy 3 × 13.2 MW, Coole 9.9 MW, 49.5 MW = 15 × 3.3 MW)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Marne%22%20and%20commune%20in%20%28%22Pringy%22%2C%22Coole%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=49.5, year=2020),
    fix('FRA', 'Tortebesse wind farm', G, '補上商轉年 2025 並更正容量：VSB 的 Éoliennes de Tortebesse 有 15 部 Vestas V110、合計 32.4 MW（2026-01-20 宣布投入運轉）；國家發電設施登錄在 Tortebesse 的兩個併網點於 2025-11-24 與 2025-12-03 併網', 'Commissioning year 2025 added and capacity corrected: VSB’s Éoliennes de Tortebesse has 15 Vestas V110 turbines, 32.4 MW in all (commissioning announced on 20 Jan 2026); the national register’s two delivery points in Tortebesse were connected on 24 Nov and 3 Dec 2025', 'https://www.vsb.energy/fileadmin/upload_frankreich/VSB_CP_TORTEBESSE_FR.pdf', mw=32.4, year=2025, turbine='15 x Vestas V110'),
    dup('FRA', 'Le Mont Hussard wind farm', G, ("Mont D'Origny wind farm", G), '同一座風場：Engie Green 的 Mont Hussard 風場（含擴建）共 11 部、3 個併網點，位於 Mont-d’Origny 與 Origny-Sainte-Benoîte，2020 年 1 月投入運轉（DREAL 2025 檢查報告）；與 Mont d’Origny 風場（38 MW，ENGIE）相同', 'Same farm: Engie Green’s Mont Hussard wind farm and its extension, 11 turbines and 3 delivery points in Mont-d’Origny and Origny-Sainte-Benoîte, in service since January 2020 (DREAL inspection, 2025); the same as the Mont d’Origny wind farm record (38 MW, ENGIE)', 'https://www.georisques.gouv.fr/webappReport/ws/installations/inspection/fvrBNHqRkOGB294BG5hIGqgjMVLZOajs'),
    fix('FRA', 'Chambon Puyravault wind farm', G, '補上商轉年 2026 並更正容量：EDF power solutions 與 Volkswind 2026-05-28 新聞稿說 Chambon 與 Puyravault 風場有 8 部風機、合計 34 MW，2026 年初投入運轉（國家發電設施登錄兩個 17 MW 併網點 2026-03-19 併網）', 'Commissioning year 2026 added and capacity corrected: EDF power solutions and Volkswind’s release of 28 May 2026 says the Chambon and Puyravault farm has 8 turbines, 34 MW in all, in service since early 2026 (the national register’s two 17 MW delivery points were connected on 19 Mar 2026)', 'https://france.edf-powersolutions.com/en/communiques/edf-power-solutions-volkswind-france-inaugurent-parc-eolien-chambon-puyravault-charente-maritime/', mw=34, year=2026),
    fix('FRA', 'Rembercourt-Sommaisne wind farm', G, '補上商轉年 2023 並更正容量：DREAL 2024 檢查報告說 Rembercourt 風場（CE Rembercourt）有 10 部風機、最大裝置容量 36.5 MW，2023-07-04 投入運轉（ENEDIS 證明）', 'Commissioning year 2023 added and capacity corrected: the DREAL inspection report (2024) says the Rembercourt farm (CE Rembercourt) has 10 turbines with a maximum installed capacity of 36.5 MW and went into service on 4 Jul 2023 (ENEDIS certificate)', 'https://www.georisques.gouv.fr/webappReport/ws/installations/inspection/gzZaXBryvnhSnq1hi40jtuD93xXTAnY5', mw=36.5, year=2023),
    dup('ITA', 'Lercara Friddi wind farm', G, ('Rocca Rossa (Alpiq) wind farm', G), '同一座風場：Alpiq 在 Lercara Friddi 的 84 MW 風場就是 Rocca Rossa（又名 Aerorossa，42 部 Gamesa G90，2011 年商轉）；GEM 自己的 Rocca Rossa (Alpiq) 頁面也把它放在 Lercara Friddi', 'Same farm: Alpiq’s 84 MW farm at Lercara Friddi is Rocca Rossa (also called Aerorossa, 42 Gamesa G90 units, commissioned 2011); GEM’s own Rocca Rossa (Alpiq) page places it in Lercara Friddi', 'https://www.gem.wiki/Rocca_Rossa_(Alpiq)_wind_farm'),
    fix('ITA', 'Camporeale wind farm', G, '補上商轉年 2023：ERG 2023-09-29 新聞稿說 Camporeale 改建完工並開始送電，24 部 0.85 MW（20.4 MW）換成 12 部 4.2 MW（50.4 MW）', 'Commissioning year 2023 added: ERG’s release of 29 Sep 2023 says the Camporeale repowering was completed and energising began, replacing 24 × 0.85 MW (20.4 MW) with 12 × 4.2 MW (50.4 MW)', 'https://www.erg.eu/en/-/erg-prosegue-nel-repowering-dei-propri-impianti.-avviato-il-parco-eolico-da-50-mw-di-camporeale-in-sicilia', mw=50.4, year=2023),
    fix('ITA', 'Trapani Salemi wind farm', G, '補上商轉年 2009：ENGIE Rinnovabili 的 Trapani Salemi 風場 66.25 MW（31 部 Vestas V90 2 MW＋5 部 V52 0.85 MW），2009-11-23 投入運轉（環境部改建案文件）', 'Commissioning year 2009 added: ENGIE Rinnovabili’s Trapani Salemi farm, 66.25 MW (31 Vestas V90 2 MW + 5 V52 0.85 MW), in service since 23 Nov 2009 (environment ministry repowering file)', 'https://va.mite.gov.it/File/Documento/503356', mw=66.25, year=2009, turbine='31 x Vestas V90-2.0 MW + 5 x Vestas V52-0.85 MW'),
    drop('FRA', 'Saint-Georges-Sur-Arnon wind farm', G, '已由逐場資料涵蓋的彙總：國家發電設施登錄在 Saint-Georges-sur-Arnon 2009 年併網的是 Joyeuses（10 MW）、Tilleuls（12.5 MW）、Vignes（12 MW）與另一座 12 MW（合計 46.5 MW），2021 年再加 Les Pierrots 1–3；這些風場本站已逐場收錄（Joyeuses、Les Tilleuls、Les Vignes、Les Barbes D’Or、Les Pierrots），這筆 48 MW 是同一群風機的合計', 'An aggregate already covered farm by farm: the national register’s 2009 connections in Saint-Georges-sur-Arnon are Joyeuses (10 MW), Tilleuls (12.5 MW), Vignes (12 MW) and another of 12 MW (46.5 MW in all), with Les Pierrots 1–3 added in 2021; the site already lists these farms one by one (Joyeuses, Les Tilleuls, Les Vignes, Les Barbes D’Or, Les Pierrots), so this 48 MW record is the total of the same turbines', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Indre%22%20and%20commune%3D%22Saint-Georges-sur-Arnon%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('CHN', 'Liaoning Liaozhong (Guohua) wind farm', G, '國華投資遼寧分公司遼中 15 萬瓩風電項目（瀋陽市遼中區大黑崗子鎮、老大房鎮）2024 年 6 月 30 日全容量併網（搜狐轉載國華投資消息 2024-07-03）；補上商轉年', 'Guohua Investment’s 150 MW Liaozhong wind project (Dahenggangzi and Laodafang towns, Liaozhong District, Shenyang) reached full grid connection on 30 June 2024 (Guohua Investment news reposted on Sohu, 3 July 2024); commissioning year added', 'https://www.sohu.com/a/790453667_121124362', year=2024),
    fix('CHN', 'Heilongjiang Binxian (Datang) wind farm', G, '大唐黑龍江發電宾縣二期 150 MW 風電項目（24 部 6.25 MW）2023 年 12 月全部機組併網發電，當年開工、當年投產（哈爾濱日報經中國能源新聞網 2023-12-25）；補上商轉年', 'Datang Heilongjiang Power’s 150 MW Binxian phase 2 wind project (24 × 6.25 MW) had all units connected in Dec 2023, started and finished the same year (Harbin Daily via cpnn.com.cn, 25 Dec 2023); commissioning year added', 'https://www.cpnn.com.cn/news/xny/202312/t20231225_1663739.html', year=2023, turbine='24x 6.25 MW'),
    fix('CHN', 'Inner Mongolia Wuchuan (Tianneng) wind farm', G, '天能重工呼和浩特市武川縣 150 MW 風電項目 2023 年 3 月併網，2023-03-18 達到預定可使用狀態（天能重工 2024 年年報）；補上商轉年', 'Tianneng Heavy Industries’ 150 MW wind project in Wuchuan County, Hohhot, was connected in March 2023 and reached its intended usable state on 18 Mar 2023 (Tianneng 2024 annual report); commissioning year added', 'https://static.cninfo.com.cn/finalpage/2025-04-24/1223243270.pdf', year=2023),
    fix('CHN', 'Hebei Zhangbei Zhanhai wind farm', G, '新天綠能張北戰海 108 MW 風電項目 2023 年全部風機併網發電（2023 年年報）；同一 200 MW 指標的另外 92 MW（張北新澤戰海）2024 年仍在建，不在這筆紀錄。補上商轉年', 'Suntien Green Energy’s 108 MW Zhangbei Zhanhai wind project had all turbines connected in 2023 (2023 annual report); the other 92 MW of the same 200 MW allocation (Zhangbei Xinze Zhanhai) was still under construction in 2024 and is not part of this record. Commissioning year added', 'https://static.cninfo.com.cn/finalpage/2024-03-27/1219412368.PDF', year=2023),
    fix('CHN', 'Hunan Yuanling Rangjiaxi wind farm', G, '華能讓家溪風電場（沅陵縣，10 萬瓩）2023 年全容量投產發電（懷化市政府 2024-12）；補上商轉年。二期 10 萬瓩仍在規劃', 'Huaneng’s Rangjiaxi wind farm (Yuanling County, 100 MW) went into full-capacity operation in 2023 (Huaihua municipal government, Dec 2024); commissioning year added. A second 100 MW phase is still being planned', 'https://www.huaihua.gov.cn/huaihua/c101116/202412/24ccb96c529942e6a88ad782fc48d555.shtml', year=2023),
    fix('CHN', 'Jilin Changling (China Energy Investment) wind farm', G, '國能吉林長嶺 A 10 萬瓩風電項目（三期規劃中的一期 A 地塊，20 部 5.0 MW）2023 年 2 月開工，2024 年 9 月全容量併網（中國能源新聞網轉載中國電建 2024-09-25）；補上商轉年', 'CHN Energy’s Changling A 100 MW wind project in Jilin (block A, the first of three planned phases; 20 × 5.0 MW) started construction in Feb 2023 and reached full grid connection in Sept 2024 (POWERCHINA via cpnn.com.cn, 25 Sept 2024); commissioning year added', 'https://www.cpnn.com.cn/news/xny/202409/t20240925_1738774.html', year=2024, turbine='20x 5.0 MW'),
    fix('CHN', 'Gansu Gaotai Yanchitan (Gansu Power Investment) wind farm', G, '甘肅能源（辰旭高台公司）高台縣鹽池灘 100 MW 風電場：首台機組 2023-07-01 併網，2023 年 7 月投產發電、列入年內併網的裝機（甘肅能源 2023 年公告與年報）；補上商轉年', 'Gansu Energy’s (Chenxu Gaotai subsidiary) 100 MW Yanchitan wind farm in Gaotai County: first unit connected on 1 July 2023, in production from July 2023 and counted in the capacity connected during 2023 (Gansu Energy notice and 2023 annual report); commissioning year added', 'https://static.cninfo.com.cn/finalpage/2024-03-30/1219460939.PDF', year=2023),
    fix('CHN', 'Xinjiang Ruoqiang Luobuzhuang Wind District wind farm', G, '新天綠能若羌縣羅布莊 10 萬瓩風電項目 2022 年底仍在建（2022 年年報），2023 年全部風機併網發電（2023 年年報）；補上商轉年', 'Suntien Green Energy’s 100 MW Luobuzhuang wind project in Ruoqiang County was still under construction at end-2022 (2022 annual report) and had all turbines connected in 2023 (2023 annual report); commissioning year added', 'https://static.cninfo.com.cn/finalpage/2024-03-27/1219412368.PDF', year=2023),
    fix('CHN', 'Shanxi Pinglu Xiamiangao wind farm', G, '朔州平魯區下面高鄉 100 MW 風電項目（16 部 6.25 MW）2024 年 10 月全容量併網（中國電力網／山西電建 2024-10-12）；補上商轉年', 'The 100 MW Xiamiangao project in Pinglu District, Shuozhou (16 × 6.25 MW) reached full grid connection in Oct 2024 (chinapower.com.cn / Shanxi Electric Power Construction, 12 Oct 2024); commissioning year added', 'http://www.chinapower.com.cn/flfd/xmjz/20241012/262997.html', year=2024, turbine='16x 6.25 MW'),
    fix('CHN', 'Hebei Lixian wind farm', G, '國能保定蠡縣 100 MW 風電項目（16 部 6.25 MW，褚崗風電場）首台風機 2024 年 12 月併網，2025 年 4 月初全容量併網（蠡縣政府 2025-04-08）；補上商轉年', 'CHN Energy’s 100 MW Lixian (Baoding) wind project (16 × 6.25 MW, Chugang wind farm): first turbine connected in Dec 2024, full grid connection in early April 2025 (Lixian county government, 8 Apr 2025); commissioning year added', 'https://lixian.gov.cn/content-252-90504.html', year=2025, turbine='16x 6.25 MW'),
    fix('CHN', 'Heilongjiang Tailai wind farm', G, '泰來九洲大興 100 MW 風電項目：2023 年底仍列在建工程（九洲集團 2023 年年報），2024 年內併網（2024 年年報）；2024-11 中核匯能受讓泰來風電時稱在運裝機 100 MW（證券時報 2024-11-12）。補上商轉年', 'Tailai Jiuzhou Daxing 100 MW wind project: still under construction at end-2023 (Jiuzhou Group 2023 annual report) and connected during 2024 (2024 annual report); when CNNC Huineng agreed to buy Tailai Wind in Nov 2024 it had 100 MW in operation (Securities Times, 12 Nov 2024). Commissioning year added', 'https://static.cninfo.com.cn/finalpage/2025-04-24/1223241473.PDF', year=2024),
    fix('NLD', 'De Drentse Monden En Oostermoer wind farm', G, '風場共 45 部 Nordex N131/3900（測試機 2019 年夏天先在現場裝設，其餘 44 部 2019 年 12 月下單），總裝置容量 175.5 MW（經濟部 2022 年政府公報）；荷蘭企業局（RVO）《2021 陸域風電監測》：2021 年全場建成，2022 年 1 月 45 部全部運轉。原寫 156.8 MW、年份不詳', 'The farm has 45 Nordex N131/3900 turbines (a test unit put up on site in summer 2019, the other 44 ordered in Dec 2019), 175.5 MW in all (Ministry of Economic Affairs notice, Staatscourant 2022); RVO’s Monitor Wind op Land 2021: the whole farm was built in 2021 and all 45 turbines were running in January 2022. The row said 156.8 MW with no year', 'https://www.rvo.nl/sites/default/files/2022-05/Monitor-wind-op-land-2021_0.pdf', mw=175.5, year=2021, turbine='45x Nordex N131/3900'),
    dup('IND', 'Basavana Bagewadi (Atria) II wind farm', G, ('Basavana Bagewadi (Atria) I wind farm', G), '同一座風場：Vestas 稱 Basavane Bagewadi 風場全場 120 MW、分三期各 40 MW（各 18 部 V110）；「Basavana Bagewadi (Atria) I」（119 MW）已是全場，這筆 40 MW 是其中一期，重複計算', 'Same farm: Vestas describes the Basavane Bagewadi farm as 120 MW in three 40 MW phases (18 V110 units each); “Basavana Bagewadi (Atria) I” (119 MW) already stands for the whole farm, so this 40 MW record is one of its phases counted twice', 'https://www.vestas.com/en/media/company-news/2017/vestas-receives-40-mw-order-in-india-c2963504'),
    fix('IND', 'Basavana Bagewadi (Atria) I wind farm', G, 'Atria 在比賈布爾縣 Basavana Bagewadi 的 120 MW 風場，三期共 54 部 Vestas V110（2.2 MW）；其中兩家專案公司（Atria Wind Power (Bijapur 1) 與 (Basavana Bagewadi)，各 39.6 MW）2018 年 4 月 18 日商轉（CARE 信評報告），第三期的商轉日期未查到，所以全場商轉年仍待查證。原座標（北緯 12.975°、東經 77.726°）是班加羅爾的代用點，改用 Basavana Bagewadi 鎮的位置（概略位置）', 'Atria’s 120 MW farm at Basavana Bagewadi, Bijapur district: three phases, 54 Vestas V110 units (2.2 MW); two of its project companies (Atria Wind Power (Bijapur 1) and (Basavana Bagewadi), 39.6 MW each) reached commercial operation on 18 Apr 2018 (CARE rating reports); the third phase’s date was not found, so the farm’s year is still unverified. The old point (12.975 N, 77.726 E) was a Bengaluru placeholder; it now uses the town of Basavana Bagewadi (approximate)', 'https://www.careratings.com/upload/CompanyFiles/PR/21102021044859_Atria_Wind_Power_(Bijapur_1)_Private_Limited.pdf', lat=16.583, lon=75.967, approx=True, turbine='54x Vestas V110 (2.2 MW)'),
    drop('IND', 'Yermala wind farm', G, '中電（CLP）的 Yermala 風電項目（馬哈拉施特拉邦，2014 年稱 148.8 MW 興建中）2017 年因土地問題停建，已資本化的成本註銷；接手 CLP 印度資產的 Apraava Energy 現有的 13 座風場也沒有 Yermala，查無建成紀錄', 'CLP’s Yermala wind project (Maharashtra; 148.8 MW “under construction” in 2014) was discontinued in 2017 because of land issues and its capitalised cost written off; it is not among the 13 wind farms of Apraava Energy (the former CLP India). No evidence it was built', 'https://www1.hkexnews.hk/listedco/listconews/sehk/2017/0807/ltn20170807155.pdf'),
    dup('IND', 'Vankusawade Wind Park', G, ('Vankusawade', C), '同一座風場：Vankusawade 風場在薩塔拉縣 Koyna 水庫上方約 1,150 m 的高原，裝 Suzlon 機組，已是精選紀錄「Vankusawade」；GEM 這筆的座標（北緯 18.635°、東經 73.849°）是浦那的代用點。各來源容量不一（GEM 189 MW、維基百科 210 MW、精選紀錄 259 MW），保留精選紀錄', 'Same farm: the Vankusawade wind park on the plateau about 1,150 m above the Koyna reservoir in Satara district, with Suzlon turbines, is already the curated record “Vankusawade”; GEM’s point (18.635 N, 73.849 E) is a Pune placeholder. Sources differ on capacity (GEM 189 MW, Wikipedia 210 MW, the curated row 259 MW); the curated row is kept', 'https://en.wikipedia.org/wiki/Vankusawade_Wind_Park'),
    fix('IND', 'Tamil Nadu (Evergreen) wind farm', G, '不是單一風場：Evergreen Power 是開發商，網站只列它在坦米爾納德邦「已開發並出售」的風電合計 250 MW，各案的位置、年份與買方都未公開；座標是代用點', 'Not a single farm: Evergreen Power is a developer, and its website only gives a total of 250 MW of wind “executed & sold” in Tamil Nadu; the projects, their locations, years and buyers are not published, and the point is a placeholder', 'https://egreenpwr.com/project-in-india.html', note=True),
    fix('CHN', 'Jilin Tongyu Liangjingzi wind farm', G, '華能良井子風電場在吉林通榆縣（GEM 寫瞻榆鎮；良井子畜牧場是通榆縣的鄉級單位）；原座標（北緯 42.999°、東經 125.982°）在通榆東南約 300 km，改用瞻榆鎮的位置（概略位置）', 'Huaneng’s Liangjingzi farm is in Tongyu county, Jilin (GEM gives Zhanyu town; the Liangjingzi livestock farm is a township-level unit of Tongyu); the old point (42.999 N, 125.982 E) is about 300 km south-east of Tongyu, so it now uses Zhanyu town (approximate)', 'https://www.gem.wiki/Jilin_Tongyu_Liangjingzi_wind_farm', lat=44.807, lon=123.078, approx=True),
    # ------------------------------------------------ 2026-10-09 第十三批（第二十輪：商轉年與資料疑點；出處原文以 check_quotes.py 核對）
    fix('CHN', 'Heilongjiang Daqing Unsubsidized (Daqing Chenneng) wind farm', G, '大慶辰能風力發電平價上網項目（大同區太陽升鎮馬營子村，100 MW、24 部風機）2024 年 8 月 23 日一次倒送電成功、正式併入國家電網（微大慶經新浪財經 2024-10-30）；同址的二期 200 MW 是另一個項目。補上商轉年', 'The Daqing Chenneng unsubsidized wind project (Mayingzi village, Taiyangsheng town, Datong District; 100 MW, 24 turbines) was energised and connected to the State Grid on 23 Aug 2024 (Daqing city media via Sina Finance, 30 Oct 2024); the 200 MW phase 2 at the same site is a separate project. Commissioning year added', 'https://finance.sina.com.cn/roll/2024-10-30/doc-incuiarc6932254.shtml', year=2024),
    fix('CHN', 'Heilongjiang Harbin Bayan wind farm', G, '黑龍江華電哈爾濱巴彥一期 100 MW 風電項目（2022 年核准；項目單位華電哈爾濱巴彥新能源公司，九洲集團持股 49%）：九洲集團 2022 年年報列為在建，2023 年年報列為 100 MW、2023 年上網電量 12,038 萬度（2024 年 24,776 萬度），2023 年投產；二期 100 MW 另列在建。業主原寫四川九洲投資（另一家公司）', 'Huadian’s Harbin Bayan phase 1 100 MW wind project (approved 2022; project company Huadian Harbin Bayan New Energy, 49% held by Harbin Jiuzhou Group): Jiuzhou’s 2022 annual report lists it as under construction, its 2023 report as 100 MW with 120.4 GWh sent out in 2023 (247.8 GWh in 2024), so it entered service in 2023; phase 2 (100 MW) is listed separately as under construction. The owner field named Sichuan Jiuzhou Investment, a different company', 'http://static.cninfo.com.cn/finalpage/2024-04-22/1219738496.PDF', year=2023, owner='Huadian Harbin Bayan New Energy Co Ltd (Harbin Jiuzhou Group 49%)'),
    fix('CHN', 'Heilongjiang Harbin Hulan wind farm', G, '華電哈爾濱呼蘭一期 100 MW 風電場（呼蘭區大用鎮，2022 年核准；項目單位華電哈爾濱呼蘭新能源公司，九洲集團持股 49%）：九洲集團 2022 年年報列為在建，2023 年年報列為 100 MW、2023 年上網電量 2,651 萬度（2024 年 23,864 萬度），即 2023 年底投產', 'Huadian’s Harbin Hulan phase 1 100 MW wind farm (Dayong town, Hulan District; approved 2022; project company Huadian Harbin Hulan New Energy, 49% held by Harbin Jiuzhou Group): Jiuzhou’s 2022 annual report lists it as under construction, its 2023 report as 100 MW with 26.5 GWh sent out in 2023 (238.6 GWh in 2024), i.e. it entered service at the end of 2023', 'http://static.cninfo.com.cn/finalpage/2024-04-22/1219738496.PDF', year=2023, owner='Huadian Harbin Hulan New Energy Co Ltd (Harbin Jiuzhou Group 49%)'),
    fix('CHN', 'Hebei Fengning Hademen Wind Storage Hydrogen wind farm', G, '新天綠能 2025 年年報：哈德門一期等項目 2025 年全部風機併網發電（承德大元新能源，新天綠能控股）；補上商轉年。一期容量（100 MW）沿用 GEM，待查證', 'Suntien Green Energy’s 2025 annual report: all turbines of Hademen phase 1 (among other projects) were connected to the grid in 2025 (Chengde Dayuan New Energy, controlled by Suntien); commissioning year added. The phase-1 capacity (100 MW) is GEM’s and unverified', 'http://static.cninfo.com.cn/finalpage/2026-03-26/1225032266.PDF', year=2025),
    fix('CHN', 'Shandong Qingyun Zhongding wind farm', G, '中廣核山東慶雲中丁 10 萬瓩風電項目 2022 年 12 月 30 日全容量投運（中廣核集團要聞 2023-01-11）；補上商轉年', 'CGN’s 100 MW Qingyun Zhongding wind project in Shandong went into full operation on 30 Dec 2022 (CGN group news, 11 Jan 2023); commissioning year added', 'http://www.cgnpc.com.cn/cgn/c100944/2023-01/23/content_0f9d6a99a59f43bead956f34ac445b8b.shtml', year=2022),
    fix('CHN', 'Liaoning Zhangwu Dasijiazi wind farm', G, '遼水清潔能源彰武大四家子 99 MW 風電場（大四家子鎮，20 部 4.55 MW＋2 部 4.0 MW）2023 年 10 月初升壓站受電、首台機組運行（電力網 2023-10-08）；GlobalData 記 2023 年 11 月投運。補上商轉年', 'Liaoning Water Clean Energy’s 99 MW Zhangwu Dasijiazi wind farm (Dasijiazi town; 20 × 4.55 MW + 2 × 4.0 MW) energised its substation and ran its first turbine in early Oct 2023 (chinapower.com.cn, 8 Oct 2023); GlobalData gives commissioning in Nov 2023. Commissioning year added', 'http://www.chinapower.com.cn/flfd/xmjz/20231008/219108.html', year=2023, turbine='20x 4.55 MW + 2x 4 MW'),
    fix('CHN', 'Anhui Qixing Yingquan wind farm', G, '中國能建浙江火電 EPC 總承包的安徽萁星潁泉風電 2023 年 5 月全容量併網發電（電力工業網 2023-05-10）；補上商轉年', 'The Anhui Qixing Yingquan wind farm, built under an EPC contract by CEEC Zhejiang Thermal Power, reached full grid connection in May 2023 (chinapower.org.cn, 10 May 2023); commissioning year added', 'https://www.chinapower.org.cn/index.php/detail/405288.html', year=2023),
    fix('CHN', 'Guangxi Qinbei Wuning wind farm', G, '國華投資廣西分公司欽北五寧一期 80 MW 風電項目 2023 年 12 月下旬實現全容量併網（電力網 2023-12-26）；這筆是一期（80 MW），GEM 的中文名寫成二期（140 MW、28 部 5 MW，2024 年才招標風機，另一筆），一併改名。補上商轉年', 'Guohua Investment Guangxi’s Qinbei Wuning phase 1 80 MW wind project reached full grid connection in late Dec 2023 (chinapower.com.cn, 26 Dec 2023); this record is phase 1 (80 MW), while GEM’s Chinese name is that of phase 2 (140 MW, 28 × 5 MW, turbines tendered in 2024, a separate record), so the Chinese name is corrected too. Commissioning year added', 'http://mm.chinapower.com.cn/flfd/xmjz/20231226/229836.html', year=2023, zhname='欽北五寧風電場一期'),
    fix('CHN', 'Hebei Baixiang Huaiyang wind farm', G, '柏鄉槐陽二期 60 MW 風電項目 2024 年底成功併網，年發電量逾 1.5 億度（人民日報客戶端河北頻道 2025-09-18）；補上商轉年', 'The Baixiang Huaiyang phase 2 60 MW wind project was connected to the grid at the end of 2024, generating over 150 GWh a year (People’s Daily app, Hebei channel, 18 Sept 2025); commissioning year added', 'https://sdxw.iqilu.com/share/YS0yMS0xNjc2MTczNw.html', year=2024),
    fix('CHN', 'Inner Mongolia Hure Banner Rural Energy wind farm', G, '國家電投庫倫旗農村能源革命試點縣項目一期工程（風電 5 萬瓩、光伏 0.5 萬瓩，2024 年 8 月核准）2025 年 12 月 28 日全容量併網（山東電建三公司 2025-12-31）；補上商轉年', 'SPIC’s Hure Banner rural energy revolution pilot county project phase 1 (50 MW wind, 5 MW solar; approved Aug 2024) reached full grid connection on 28 Dec 2025 (SEPCOIII, 31 Dec 2025); commissioning year added', 'http://www.sepco3.com/col/col16685/art/2026/art_281764cf66bf431294af6c843904dc77.html', year=2025),
    fix('CHN', 'Hubei Anlu Zhaopeng wind farm', G, '長源電力全資子公司國能長源安陸新能源的安陸趙棚風電項目（安陸市與廣水市交界，5 萬瓩，2021 年 11 月開工）2023 年 6 月全部風電機組併網發電轉商運（長源電力公告 2023-06-26）；補上商轉年', 'The Anlu Zhaopeng wind project of CHN Energy Changyuan’s subsidiary Guoneng Changyuan Anlu New Energy (on the Anlu–Guangshui border, 50 MW, construction started Nov 2021) had all turbines connected and in commercial operation in June 2023 (Changyuan Power filing, 26 June 2023); commissioning year added', 'http://static.cninfo.com.cn/finalpage/2023-06-27/1217138136.PDF', year=2023),
    fix('CHN', 'Anhui Woyang Baohe & Wujiahe wind farm', G, '渦陽縣包河與武家河風電廠（總裝機 50 MW，2020 年 4 月開工）2020 年 12 月 23 日 110 kV 送出線路送電成功、併網發電（國網亳州供電公司經人民網精選資訊 2020-12-25，標題「9 個風電項目投運」）。補上商轉年（業主欄待查證）', 'The Woyang Baohe & Wujiahe wind farm (50 MW, construction started Apr 2020) was connected to the grid on 23 Dec 2020 when its 110 kV export line was energised (State Grid Bozhou via People’s Daily feed, 25 Dec 2020, headlined “9 wind projects put into operation”); commissioning year added (the owner field is still to be checked)', 'https://baijiahao.baidu.com/s?id=1687019672959469071&wfr=spider&for=pc', year=2020),
    drop('FRA', 'Fère-Champenoise wind farm', G, '已由逐場資料涵蓋的彙總：國家發電設施登錄在 Euvy、Fère-Champenoise 與 Corroy 三鎮 2011 年併網的只有 3 個併網點（Parc éolien d’Euvy 12.5 MW、另一個 15 MW、Corroy Énergies 17 MW，合計 44.5 MW）；前兩個是 Féréole 風場（11 部 2.5 MW、2 個併網點，2011 年投入運轉，DREAL 2026 檢查報告），第三個是 Corroy 風場（17 MW，2011），兩座本站已分別收錄，這筆 45 MW 是兩者的合計', 'An aggregate already covered farm by farm: the national register has only three delivery points connected in 2011 in Euvy, Fère-Champenoise and Corroy (Parc éolien d’Euvy 12.5 MW, another of 15 MW and Corroy Énergies 17 MW, 44.5 MW in all); the first two are the Féréole farm (11 turbines of 2.5 MW, 2 delivery points, in service since 2011, DREAL inspection 2026) and the third is the Corroy farm (17 MW, 2011), both already listed, so this 45 MW record is their sum', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Marne%22%20and%20commune%20in%20%28%22Euvy%22%2C%22F%C3%A8re-Champenoise%22%2C%22Corroy%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    drop('FRA', 'Fère-Champenoise-Euvy-Corroy wind farm', G, '已由逐場資料涵蓋的彙總：國家發電設施登錄在 Euvy 有 3 個 2011 年併網的併網點（Parc éolien d’Euvy 12.5 MW、另一個 15 MW、Corroy Énergies 17 MW，合計 44.5 MW），Fère-Champenoise 鎮只有 2026 年的新機組；前兩個是 Féréole 風場（27.5 MW，2011），第三個是 Corroy 風場（17 MW，2011），本站已分別收錄', 'An aggregate already covered farm by farm: the national register has three delivery points in Euvy connected in 2011 (Parc éolien d’Euvy 12.5 MW, another of 15 MW and Corroy Énergies 17 MW, 44.5 MW in all) and only 2026 units in Fère-Champenoise itself; the first two are the Féréole farm (27.5 MW, 2011) and the third the Corroy farm (17 MW, 2011), both listed separately', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Marne%22%20and%20commune%20in%20%28%22Euvy%22%2C%22F%C3%A8re-Champenoise%22%2C%22Corroy%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Fereole wind farm', G, '補上商轉年 2011：DREAL 2026 檢查報告說 Féréole 風場（Fère-Champenoise）有 11 部 2.5 MW 風機、2 個併網點，2011 年投入運轉；與國家發電設施登錄在相鄰 Euvy 2011 年 3 月併網的兩個併網點（12.5＋15＝27.5 MW）相符', 'Commissioning year 2011 added: the DREAL inspection report (2026) says the Féréole farm (Fère-Champenoise) has 11 turbines of 2.5 MW and 2 delivery points, in service since 2011; this matches the two delivery points the national register lists in neighbouring Euvy, connected in March 2011 (12.5 + 15 = 27.5 MW)', 'https://www.georisques.gouv.fr/webappReport/ws/installations/inspection/APZUC91LtbyADa5d3ZKrUTpiMZmg9cmb', year=2011),
    drop('FRA', 'Melle wind farm', G, '已由逐場資料涵蓋的彙總：國家發電設施登錄在 Melle 鎮（INSEE 79174）的 5 個風電併網點合計正好 54.3 MW（12 MW 2009-12、12 MW 2011-02、14 MW 2018-07、9.4 MW 2018-08、Les Raffauds 2 6.9 MW 2020-09）；鎮內的風場本站已逐場收錄：Mont Jarron（12 MW，2009；ICPE 登記在 Melle 鎮 Mont Jarron）、Lusseray（14 MW，2018；ICPE「Ferme éolienne Lusseray-Paizay le Tort」也登記在 Melle 鎮）、3D Energies 的 La Tourette 與 Les Raffauds，以及 Paizay Le Tort；這筆是同一群風機的合計', 'An aggregate already covered farm by farm: the national register’s five wind delivery points in the commune of Melle (INSEE 79174) add up to exactly 54.3 MW (12 MW Dec 2009, 12 MW Feb 2011, 14 MW Jul 2018, 9.4 MW Aug 2018 and Les Raffauds 2, 6.9 MW, Sep 2020); the site already lists the farms in the commune one by one: Mont Jarron (12 MW, 2009; its ICPE is registered at Mont Jarron in Melle), Lusseray (14 MW, 2018; the ICPE “Ferme éolienne Lusseray-Paizay le Tort” is also registered in Melle), 3D Energies’ La Tourette and Les Raffauds, and Paizay Le Tort; this record is the total of the same turbines', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Deux-S%C3%A8vres%22%20and%20commune%3D%22Melle%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Miraumont wind farm', G, '更正容量與年份：這筆 46.1 MW 是 Miraumont 鎮 5 個併網點的合計；其中 2018-12-07 併網的兩個（9.9＋13.2 MW）是 Sources de l’Ancre 風場（7 部風機、2 個併網點，ICPE 登記在 Miraumont），本站已另列（23 MW）。剩下的是 H2air 的 Coquelicot 2（2A、2B 各 9.2 MW，2015-11-27 併網）與 Camomille（4.6 MW，2018-06-27 併網），合計 23 MW', 'Capacity and year corrected: the 46.1 MW is the total of the five delivery points in Miraumont; the two connected on 7 Dec 2018 (9.9 + 13.2 MW) are the Sources de l’Ancre farm (7 turbines and 2 delivery points, registered as an ICPE in Miraumont), listed separately (23 MW). The rest is H2air’s Coquelicot 2 (2A and 2B, 9.2 MW each, connected 27 Nov 2015) and Camomille (4.6 MW, connected 27 Jun 2018), 23 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Somme%22%20and%20commune%3D%22Miraumont%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=23, year=2018, ph=[[2015, 18.4], [2018, 4.6]], note=True),
    fix('FRA', 'Voie Romaine wind farm', G, '更正商轉年為 2014：Global EcoPower 2014-06-26 公告 Marne 省的 La Voie Romaine 風場（22 MW）風機 2014-05-13 組裝完成、2014-06-16 併網；DREAL 2026 檢查報告說前 11 部風機 2014-07-01 投入運轉（之後另核准 2 部，全場 13 部 2 MW、26 MW）', 'Commissioning year corrected to 2014: Global EcoPower announced on 26 Jun 2014 that the La Voie Romaine farm in the Marne (22 MW) finished turbine erection on 13 May 2014 and was connected on 16 Jun 2014; the DREAL inspection report (2026) says the first 11 turbines went into service on 1 Jul 2014 (2 more were authorised later, 13 × 2 MW = 26 MW in all)', 'https://echanges.dila.gouv.fr/OPENDATA/AMF/ACT/2014/06/FCACT027058_20140626.pdf', year=2014),
    fix('FRA', 'Les Tilleuls wind farm', G, '更正商轉年與容量：國家發電設施登錄的 Parc éolien des Tilleuls（Saint-Georges-sur-Arnon）12.5 MW，2009-05-13 併網', 'Commissioning year and capacity corrected: the national register lists the Parc éolien des Tilleuls (Saint-Georges-sur-Arnon), 12.5 MW, connected on 13 May 2009', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Indre%22%20and%20commune%3D%22Saint-Georges-sur-Arnon%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2009, mw=12.5),
    fix('FRA', 'Les Pierrots wind farm', G, '補上商轉年 2021 並更正容量：國家發電設施登錄的 Parc éolien Les Pierrots 1、2、3（Saint-Georges-sur-Arnon）9.6＋7.2＋9.6＝26.4 MW，2021-07-28／30 併網', 'Commissioning year 2021 added and capacity corrected: the national register lists the Parc éolien Les Pierrots 1, 2 and 3 (Saint-Georges-sur-Arnon), 9.6 + 7.2 + 9.6 = 26.4 MW, connected on 28 and 30 Jul 2021', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Indre%22%20and%20commune%3D%22Saint-Georges-sur-Arnon%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2021, mw=26.4),
    dup('ITA', 'Sant Agata wind farm', G, ('Sant’Agata Di Puglia (EDF) wind farm', G), '同一座風場：EDF 2007 年 3 月宣布投入運轉的 Sant’Agata 風場是 36 部 Vestas V80 2 MW（72 MW），與 Fri-El Green Power 合作開發，EDF EN Italia 持有 50%；環境部 2023 年改建案文件說 Sant’Agata di Puglia 的既有風場是 Fri-El S. Agata 的 36 部 2 MW、72 MW，同一批風機', 'Same farm: the Sant’Agata farm EDF announced in service in March 2007 is 36 Vestas V80 2 MW units (72 MW), developed with Fri-El Green Power and 50% owned by EDF EN Italia; the environment ministry’s 2023 repowering file describes the existing farm at Sant’Agata di Puglia as Fri-El S. Agata’s 36 × 2 MW, 72 MW, the same turbines', 'https://www.power-eng.com/renewables/wind-energy/edf-commissions-72-mw-wind-farm-in-italy/'),
    fix('ITA', 'Sant’Agata Di Puglia (EDF) wind farm', G, '補上機組：36 部 Vestas V80 2 MW（EDF 2007 年公告；環境部改建案文件）', 'Turbines added: 36 Vestas V80 2 MW units (EDF, 2007; environment ministry repowering file)', 'https://www.power-eng.com/renewables/wind-energy/edf-commissions-72-mw-wind-farm-in-italy/', turbine='36 x Vestas V80-2.0 MW'),
    dup('CHN', 'Liaoning Chifeng Poverty Alleviation District (China Guangdong Nuclear) wind farm', G, ('Inner Mongolia Chifeng Poverty Alleviation Area (China Guangdong Nuclear) wind farm', G), '同一座風場：兩筆的中文名都是「中广核赤峰市扶贫改革试验区10万千瓦风电项目」、都是 100 MW、都在翁牛特旗；這個項目只有一個（中廣核 2022 年 5 月風機招標：場址在內蒙古赤峰市翁牛特旗、容量 100 MW、20 個機位）。赤峰屬內蒙古，名稱裡的「Liaoning」有誤', 'Same farm: both records carry the Chinese name “中广核赤峰市扶贫改革试验区10万千瓦风电项目”, both are 100 MW and both are in Ongniud Banner; there is one such project (CGN’s turbine tender of May 2022: site in Ongniud Banner, Chifeng, Inner Mongolia, 100 MW, 20 positions). Chifeng is in Inner Mongolia, so “Liaoning” in the name is wrong', 'https://www.sohu.com/a/551331079_257552'),
    fix('CHN', 'Inner Mongolia - Shandong Power Export Hanggin Banner  (China Resources) wind farm', G, 'GEM 寫明此場在鄂爾多斯杭錦旗巴拉貢鎮，但座標（北緯 43.244°、東經 114.325°）是錫林郭勒盟的代用點、離杭錦旗約 600 km；改用巴拉貢鎮的位置（OpenStreetMap，概略位置）', 'GEM places this farm in Balagong, Hanggin Banner, Ordos, but its point (43.244 N, 114.325 E) is a placeholder in Xilingol League, about 600 km away; moved to Balagong town (OpenStreetMap, approximate)', 'https://www.gem.wiki/Inner_Mongolia_-_Shandong_Power_Export_Hanggin_Banner_(China_Resources)_wind_farm', lat=40.27, lon=107.04, approx=True),
    fix('CHN', 'Sichuan Yanyuan Houlongshan wind farm', G, '補上商轉年 2023 並更正中文名：華電涼山鹽源後龍山風電場 100 MW（20 部 5 MW），2022 年開工、2023 年 5 月商轉（GlobalData），華電新能鹽源公司 2023-03-29 舉行白楊坪、後龍山、長坪子風電項目集中投產儀式（四川在線）；原中文名「凉山盐源后龙山二期风电项目」是 2025 年才核准的二期（16 部 6.25 MW），已另有紀錄', 'Commissioning year 2023 added and Chinese name corrected: Huadian’s Liangshan Yanyuan Houlongshan wind farm, 100 MW (20 × 5 MW), started in 2022 and entered commercial operation in May 2023 (GlobalData); Huadian New Energy’s Yanyuan company held a joint commissioning ceremony for the Baiyangping, Houlongshan and Changpingzi wind projects on 29 Mar 2023 (Sichuan Online); the old Chinese name “凉山盐源后龙山二期风电项目” is phase 2 (16 × 6.25 MW, approved in 2025), which has its own record', 'https://power-technology.com/?p=302298', year=2023, zhname='盐源后龙山风电项目', turbine='20x 5 MW'),
    fix('NLD', 'Delfzijl Midden wind farm', G, '補上商轉年 2021：荷蘭企業局（RVO）《2021 陸域風電監測》格羅寧根省 2021 年完成的風場列有 Delfzijl Midden（Eemsdelta，38.7 MW）', 'Commissioning year 2021 added: RVO’s Monitor Wind op Land 2021 lists Delfzijl Midden (Eemsdelta, 38.7 MW) among the farms completed in Groningen in 2021', 'https://www.rvo.nl/sites/default/files/2022-05/Monitor-wind-op-land-2021_0.pdf', year=2021, mw=38.7),
    fix('NLD', 'Piet De Wit wind farm', G, '補上商轉年 2022 並更正容量與機組：舊的 Piet de Wit（21 MW）2021 年拆除，新的 Windpark Piet de Wit（Goeree-Overflakkee，7 部 Nordex N133/4800、33.6 MW）列在荷蘭企業局（RVO）《2022 陸域風電監測》2022 年完成的風場', 'Commissioning year 2022 added, capacity and turbines corrected: the old Piet de Wit (21 MW) was removed in 2021, and the new Windpark Piet de Wit (Goeree-Overflakkee, 7 Nordex N133/4800, 33.6 MW) is listed by RVO’s Monitor Wind op Land 2022 among the farms completed in 2022', 'https://www.rvo.nl/sites/default/files/2023-05/Monitor-wind-op-land-2022.pdf', year=2022, mw=33.6, turbine='7 x Nordex N133/4800'),
    fix('NLD', 'Suyderlandt wind farm', G, '補上商轉年 2021：荷蘭企業局（RVO）《2021 陸域風電監測》南荷蘭省 2021 年完成的風場列有 Windpark Suyderlandt（Goeree-Overflakkee，10.8 MW）', 'Commissioning year 2021 added: RVO’s Monitor Wind op Land 2021 lists Windpark Suyderlandt (Goeree-Overflakkee, 10.8 MW) among the farms completed in South Holland in 2021', 'https://www.rvo.nl/sites/default/files/2022-05/Monitor-wind-op-land-2021_0.pdf', year=2021, mw=10.8),
    fix('NLD', 'Windmolens Groetpolder wind farm', G, '補上商轉年 2021：荷蘭企業局（RVO）《2021 陸域風電監測》北荷蘭省 2021 年完成的風場列有 WP Groetpolder（Hollands Kroon，13.2 MW），同時拆除舊機組 4.7 MW', 'Commissioning year 2021 added: RVO’s Monitor Wind op Land 2021 lists WP Groetpolder (Hollands Kroon, 13.2 MW) among the farms completed in North Holland in 2021, with 4.7 MW of old turbines removed', 'https://www.rvo.nl/sites/default/files/2022-05/Monitor-wind-op-land-2021_0.pdf', year=2021, mw=13.2),
    fix('NLD', 'Anna Vosdijk Polder wind farm', G, '補上商轉年 2008：Anna Vosdijkpolder 風場（Tholen）有 5 部 Vestas V90 3 MW（15 MW），2008 年投入運轉（荷蘭文維基百科，依澤蘭省風能地圖）', 'Commissioning year 2008 added: the Anna Vosdijkpolder farm (Tholen) has 5 Vestas V90 3 MW units (15 MW), in operation since 2008 (Dutch Wikipedia, after the Zeeland province wind map)', 'https://nl.wikipedia.org/wiki/Windpark_Anna_Vosdijkpolder', year=2008, turbine='5 x Vestas V90-3.0 MW'),
    fix('NLD', 'Wisse wind farm', G, '補上商轉年 2011 並更正容量：Wisse Wind BV 的 Willempolder 風場（Sint Philipsland）有 5 部 2.3 MW Enercon（11.5 MW），2011 年投入運轉（荷蘭文維基百科，依澤蘭省風能地圖）', 'Commissioning year 2011 added and capacity corrected: Wisse Wind BV’s Willempolder farm (Sint Philipsland) has 5 Enercon units of 2.3 MW (11.5 MW), in operation since 2011 (Dutch Wikipedia, after the Zeeland province wind map)', 'https://nl.wikipedia.org/wiki/Windpark_Wissewind', year=2011, mw=11.5, turbine='5 x Enercon 2.3 MW'),
    fix('NLD', 'Zierikzee wind farm', G, '補上商轉年 2014 並更正容量：Zierikzee 風場有 3 部 Senvion 3.4M104（10.2 MW），2014 年 8 月開工、同年投入運轉（荷蘭文維基百科，依澤蘭省風能地圖）', 'Commissioning year 2014 added and capacity corrected: the Zierikzee farm has 3 Senvion 3.4M104 units (10.2 MW), construction started in August 2014 and it went into operation the same year (Dutch Wikipedia, after the Zeeland province wind map)', 'https://nl.wikipedia.org/wiki/Windpark_Zierikzee', year=2014, mw=10.2, turbine='3 x Senvion 3.4M104'),
    fix('NLD', 'Etten-Leur wind farm', G, '補上商轉年 2019 並更正容量與機組：Etten-Leur 風場（換掉 2000 年的 5 部舊機）有 3 部 Vestas 4.2 MW（輪轂 112 m、葉輪 136 m），合計 12.6 MW，2019 年完工（基礎設計公司 Windbase 專案資料）', 'Commissioning year 2019 added, capacity and turbines corrected: the Etten-Leur farm (replacing five turbines from 2000) has 3 Vestas 4.2 MW units (112 m hub, 136 m rotor), 12.6 MW in all, completed in 2019 (foundation designer Windbase’s project sheet)', 'https://galleo.co/search/projects/wind-park-etten-leur/windbase', year=2019, mw=12.6, turbine='3 x Vestas V136-4.2 MW'),
    fix('FRA', 'Pougny wind farm', G, '補上商轉年：國家發電設施登錄（ODRÉ）在 Pougny 有 4 個併網點，分三年併網：4.7 MW（2017-08）、11.75＋9.4 MW（2018-11）、2.35 MW（2020-10），合計 28.2 MW；OpenStreetMap 把當地風場標為 Parc éolien de Pougny 1–3（Ludmila 1–3），容量合計同為 28.2 MW', 'Commissioning years added: the national register of production installations (ODRÉ) has four delivery points in Pougny connected over three years: 4.7 MW (Aug 2017), 11.75 + 9.4 MW (Nov 2018) and 2.35 MW (Oct 2020), 28.2 MW in all; OpenStreetMap tags the farm there as Parc éolien de Pougny 1–3 (Ludmila 1–3), also 28.2 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Ni%C3%A8vre%22%20and%20commune%3D%22Pougny%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=28.2, year=2020, ph=[[2017, 4.7], [2018, 21.15], [2020, 2.35]]),
    dup('FRA', 'Des Hauts Pres wind farm', G, ('Haut Pres wind farm', G), '同一座風場：國家發電設施登錄（ODRÉ）的 Ferme éolienne des Hauts Prés 只有 Candor 與 Écuvilly 兩個 12 MW 併網點（2019-02-06 併網，合計 24 MW），與 Haut Pres 風場（24 MW，2019）相同', 'Same farm: the national register of production installations (ODRÉ) lists the Ferme éolienne des Hauts Prés as just two 12 MW delivery points in Candor and Écuvilly (connected on 6 Feb 2019, 24 MW in all), the same as the Haut Pres wind farm record (24 MW, 2019)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Oise%22%20and%20commune%20in%20%28%22Candor%22%2C%22%C3%89cuvilly%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    dup('FRA', "Le Val D'Esnoms wind farm", G, ('Langres Sud wind farm', G), '同一座風場：國家發電設施登錄（ODRÉ）在 Le Val-d’Esnoms 的三個併網點（CEPE Langres Sud 6 MW、CEPE Langres Sud 1 12 MW、另一個 10 MW）都在 2010 年併網，合計正好 28 MW，其中兩個以 Langres Sud 為名；OpenStreetMap 在旁邊標的是 RES 的 Langres Sud 風場（52 MW），已有紀錄（Langres Sud，52 MW，2010）', 'Same farm: the national register of production installations (ODRÉ)’s three delivery points in Le Val-d’Esnoms (CEPE Langres Sud 6 MW, CEPE Langres Sud 1 12 MW and another of 10 MW) were all connected in 2010 and add up to exactly 28 MW, two of them named Langres Sud; OpenStreetMap shows RES’s Langres Sud farm (52 MW) there, which already has a record (Langres Sud, 52 MW, 2010)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Haute-Marne%22%20and%20commune%3D%22Le%20Val-d%27Esnoms%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    dup('FRA', "Villes D'Oyses wind farm", G, ('Achery-Mayot wind farm', G), '同一座風場：國家發電設施登錄（ODRÉ）在 Mayot 只有兩個併網點：Ferme éolienne des Villes d’Oyses 12.5 MW 與另一個 15 MW（2015 年 11、12 月併網，合計 27.5 MW），Achery 鎮沒有風電併網點；OpenStreetMap 的 Parc éolien des Villes d’Oyses 也是 27.5 MW。與 1.7 km 外的 Achery-Mayot 風場（28 MW）相同', 'Same farm: the national register of production installations (ODRÉ) has only two delivery points in Mayot, the Ferme éolienne des Villes d’Oyses (12.5 MW) and another of 15 MW (connected Nov–Dec 2015, 27.5 MW in all), and none in Achery; OpenStreetMap’s Parc éolien des Villes d’Oyses is also 27.5 MW. The same as the Achery-Mayot wind farm record (28 MW) 1.7 km away', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aisne%22%20and%20commune%3D%22Mayot%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    dup('FRA', 'Chasseradès wind farm', G, ('Taillades Sud wind farm', G), '同一座風場：EDF Renewables 2019-09-20 新聞稿說 Les Taillades 風場（27 MW，9 部 3 MW）位於 Chasseradès 與 La Bastide-Puylaurent；國家發電設施登錄（ODRÉ）的 Parc éolien des Taillades Sud 為 27.45 MW（2019-06 併網），與 Taillades Sud 風場（27 MW，2019）相同', 'Same farm: EDF Renewables’ release of 20 Sep 2019 says the 27 MW Les Taillades farm (nine 3 MW turbines) lies in Chasseradès and La Bastide-Puylaurent; the national register of production installations (ODRÉ) lists the Parc éolien des Taillades Sud at 27.45 MW (connected June 2019), the same as the Taillades Sud wind farm record (27 MW, 2019)', 'https://edf-renouvelables.com/?p=8111'),
    fix('FRA', 'Aeolus Masts wind farm', G, '補上商轉年 2022：DREAL 檢查報告說 Cheppes-la-Prairie 的 CHEPPES 2 - Les Mâts d’Eole 風場有 6 部風機，2022 年 4 月投入運轉；國家發電設施登錄（ODRÉ）在 Cheppes-la-Prairie 有兩個 13.2 MW 併網點，2022-03-28 與 04-01 併網', 'Commissioning year 2022 added: the DREAL inspection report says the CHEPPES 2 - Les Mâts d’Eole farm in Cheppes-la-Prairie has six turbines and went into service in April 2022; the national register of production installations (ODRÉ) has two 13.2 MW delivery points in Cheppes-la-Prairie connected on 28 Mar and 1 Apr 2022', 'https://www.georisques.gouv.fr/webappReport/ws/installations/inspection/d2nzqF1Brzkh4DY97NZoJhPbNN5Q5Mer', year=2022),
    fix('FRA', 'Terres Chaudes wind farm', G, '補上商轉年 2024：OpenStreetMap 的 Parc éolien les Terres Chaudes（Volkswind，22.8 MW）位於 Lorcy；國家發電設施登錄（ODRÉ）在 Lorcy 只有兩個併網點（12＋10.8 MW），都在 2024-06-01 併網', 'Commissioning year 2024 added: OpenStreetMap’s Parc éolien les Terres Chaudes (Volkswind, 22.8 MW) is at Lorcy; the national register of production installations (ODRÉ) has just two delivery points in Lorcy (12 + 10.8 MW), both connected on 1 Jun 2024', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Loiret%22%20and%20commune%3D%22Lorcy%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2024),
    fix('FRA', 'Falvieux wind farm', G, '補上商轉年 2020：國家發電設施登錄（ODRÉ）的「Ferme éolienne de Cressy-Omencourt (CEFAL 1 et 2)」25.2 MW 於 2020-12-08 投入運轉；OpenStreetMap 標為 Parc éolien de Falvieux（25.2 MW）。2025 年另有 8.4 MW 擴建（CEFAL 3），不含在這筆', 'Commissioning year 2020 added: the national register of production installations (ODRÉ) lists the “Ferme éolienne de Cressy-Omencourt (CEFAL 1 et 2)”, 25.2 MW, in service on 8 Dec 2020; OpenStreetMap tags it as Parc éolien de Falvieux (25.2 MW). An 8.4 MW extension (CEFAL 3, 2025) is not part of this record', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Somme%22%20and%20commune%3D%22Cressy-Omencourt%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020),
    fix('FRA', 'Lacaune wind farm', G, '補上商轉年並更正容量：國家發電設施登錄（ODRÉ）在 Lacaune 只有 Enertrag 的兩個併網點：Puech d’Embuel 13.036 MW（2017-12）與 Escournadouyre 10.863 MW（2019-10），合計 23.9 MW', 'Commissioning years added and capacity corrected: the national register of production installations (ODRÉ) has only Enertrag’s two delivery points in Lacaune: Puech d’Embuel, 13.036 MW (Dec 2017) and Escournadouyre, 10.863 MW (Oct 2019), 23.9 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Tarn%22%20and%20commune%3D%22Lacaune%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=23.9, year=2019, ph=[[2017, 13.04], [2019, 10.86]]),
    fix('FRA', 'Tilleul Othon wind farm', G, '補上商轉年 2018 並更正容量：OpenStreetMap 的 Parc éolien de Bray et du Tilleul-Othon 為 12.3 MW；國家發電設施登錄（ODRÉ）在 Bray 的「EE Bray」併網點 12.3 MW，2018-08-25 併網', 'Commissioning year 2018 added and capacity corrected: OpenStreetMap’s Parc éolien de Bray et du Tilleul-Othon is 12.3 MW; the national register of production installations (ODRÉ) lists the “EE Bray” delivery point in Bray, 12.3 MW, connected on 25 Aug 2018', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Eure%22%20and%20commune%3D%22Bray%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=12.3, year=2018),
    drop('FRA', 'Haut De Mergey wind farm', G, '與既有紀錄重複：OpenStreetMap 把 Haut de Mergey 標為 Neoen 的 Val d’Éole 與 Chapelle d’Éole 兩座風場（合計 24 MW）；國家發電設施登錄（ODRÉ）在 Chapelle-Vallon 正好有兩個 12 MW 併網點，2006-04-20 併網。這兩座已分別列為 Val D’Eole 與 Chapelle D’Eole 風場（各 12 MW，2006）', 'Duplicate of existing records: OpenStreetMap tags Haut de Mergey as Neoen’s Val d’Éole and Chapelle d’Éole farms (24 MW in all); the national register of production installations (ODRÉ) has exactly two 12 MW delivery points in Chapelle-Vallon, connected on 20 Apr 2006. Both farms already have records (Val D’Eole and Chapelle D’Eole wind farms, 12 MW each, 2006)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aube%22%20and%20commune%3D%22Chapelle-Vallon%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Lizant Saint-Macoux wind farm', G, '補上商轉年 2014：國家發電設施登錄（ODRÉ）在 Saint-Macoux 只有兩個 12.6 MW 併網點，都在 2014-02-25 併網（合計 25.2 MW）；OpenStreetMap 在當地標的是 Sergies 的 Grand Champs 與 Mont Joubert 兩座各 12 MW 的風場', 'Commissioning year 2014 added: the national register of production installations (ODRÉ) has only two 12.6 MW delivery points in Saint-Macoux, both connected on 25 Feb 2014 (25.2 MW in all); OpenStreetMap shows Sergies’ Grand Champs and Mont Joubert farms, 12 MW each, there', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Vienne%22%20and%20commune%3D%22Saint-Macoux%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2014),
    fix('FRA', 'Les Tournevents du COS wind farm', G, '補上商轉年：國家發電設施登錄（ODRÉ）的 Tournevents du COS 1（Sommette-Eaucourt，9.6 MW）2017-10-26 併網、Tournevents du COS 2（Cugny，12 MW）2019-02-01 併網，合計 21.6 MW', 'Commissioning years added: the national register of production installations (ODRÉ) lists Tournevents du COS 1 (Sommette-Eaucourt, 9.6 MW), connected on 26 Oct 2017, and Tournevents du COS 2 (Cugny, 12 MW), connected on 1 Feb 2019, 21.6 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aisne%22%20and%20commune%20in%20%28%22Cugny%22%2C%22Sommette-Eaucourt%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2019, ph=[[2017, 9.6], [2019, 12]]),
    fix('FRA', 'Energie Du Gatinais wind farm · 2', G, '補上商轉年 2021，更正容量與位置：國家發電設施登錄（ODRÉ）的 Énergie du Gâtinais 2 有兩個併網點（Beaumont-du-Gâtinais，15.3＋8.4 MW），2021-07-19 併網，合計 23.7 MW；OpenStreetMap 的 Parc éolien du Gâtinais 2（23.7 MW）位於塞納-馬恩省 Beaumont-du-Gâtinais 一帶。原座標在卡爾瓦多斯省 Caen 附近，偏離約 236 km', 'Commissioning year 2021 added, capacity and location corrected: the national register of production installations (ODRÉ) lists two Énergie du Gâtinais 2 delivery points (Beaumont-du-Gâtinais, 15.3 + 8.4 MW), connected on 19 Jul 2021, 23.7 MW in all; OpenStreetMap’s Parc éolien du Gâtinais 2 (23.7 MW) is near Beaumont-du-Gâtinais, Seine-et-Marne. The old point was near Caen, Calvados, about 236 km away', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Seine-et-Marne%22%20and%20commune%3D%22Beaumont-du-G%C3%A2tinais%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=23.7, year=2021, lat=48.155, lon=2.51),
    fix('FRA', 'Achiet-Le-Petit wind farm', G, '補上商轉年 2020 並更正容量：OpenStreetMap 的 Parc éolien Les Quatre Arbres（別名 Parc éolien de Achiet-le-Petit，Engie Green）為 11.75 MW；國家發電設施登錄（ODRÉ）在 Achiet-le-Petit 只有兩個併網點（7.05＋4.7 MW），都在 2020-09-14 併網', 'Commissioning year 2020 added and capacity corrected: OpenStreetMap’s Parc éolien Les Quatre Arbres (also Parc éolien de Achiet-le-Petit, Engie Green) is 11.75 MW; the national register of production installations (ODRÉ) has only two delivery points in Achiet-le-Petit (7.05 + 4.7 MW), both connected on 14 Sep 2020', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Pas-de-Calais%22%20and%20commune%3D%22Achiet-le-Petit%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=11.75, year=2020),
    fix('FRA', 'Orvilliers wind farm', G, '補上商轉年 2018 並更正容量：國家發電設施登錄（ODRÉ）的 Parc éolien Orvilliers II 與 Orvilliers II bis（Orvilliers-Saint-Julien）兩個併網點於 2018-12-01 併網，合計 25.45 MW（同鎮 2010 年的 12 MW 是另一筆 Orvilliers Saint-Julien 風場）', 'Commissioning year 2018 added and capacity corrected: the national register of production installations (ODRÉ) lists the Parc éolien Orvilliers II and Orvilliers II bis delivery points (Orvilliers-Saint-Julien), connected on 1 Dec 2018, 25.45 MW in all (the commune’s 12 MW of 2010 is the separate Orvilliers Saint-Julien record)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aube%22%20and%20commune%3D%22Orvilliers-Saint-Julien%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=25.45, year=2018),
    fix('FRA', 'Les Vingt Sétiers wind farm', G, '補上商轉年 2011：國家發電設施登錄（ODRÉ）的 Centrale éolienne des Vingt Setiers 1 有兩個 9.2 MW 併網點（Gommerville 2011-05-13、Pussay 2011-06-27），合計 18.4 MW', 'Commissioning year 2011 added: the national register of production installations (ODRÉ) lists two 9.2 MW Centrale éolienne des Vingt Setiers 1 delivery points (Gommerville, 13 May 2011; Pussay, 27 Jun 2011), 18.4 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%20in%20%28%22Eure-et-Loir%22%2C%22Essonne%22%29%20and%20commune%20in%20%28%22Gommerville%22%2C%22Pussay%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2011),
    dup('FRA', "L'Epine Aux Bois wind farm", G, ('Epine-Aux-Bois wind farm', G), '同一座風場：國家發電設施登錄（ODRÉ）在 L’Épine-aux-Bois 只有兩個併網點（8＋10 MW，2018 年 2 月併網，合計 18 MW）；OpenStreetMap 標為 Ferme éolienne de la Haute Épine（18 MW）。與 Volkswind 的 Epine-Aux-Bois 風場（18 MW，2018）相同', 'Same farm: the national register of production installations (ODRÉ) has only two delivery points in L’Épine-aux-Bois (8 + 10 MW, connected Feb 2018, 18 MW in all); OpenStreetMap tags it as the Ferme éolienne de la Haute Épine (18 MW). The same as Volkswind’s Epine-Aux-Bois wind farm record (18 MW, 2018)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aisne%22%20and%20commune%3D%22L%27%C3%89pine-aux-Bois%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Saint Jean de Liversay wind farm', G, '補上商轉年 2026：OpenStreetMap 的 Ferme éolienne de Saint-Jean-de-Liversay 為 18 MW；國家發電設施登錄（ODRÉ）在 Saint-Jean-de-Liversay 有兩個新併網點（7.2＋10.8 MW），2026-02-04 併網（同鎮 2017 年的 13.5 MW 是另一筆 Aunis 風場）', 'Commissioning year 2026 added: OpenStreetMap’s Ferme éolienne de Saint-Jean-de-Liversay is 18 MW; the national register of production installations (ODRÉ) has two new delivery points in Saint-Jean-de-Liversay (7.2 + 10.8 MW), connected on 4 Feb 2026 (the commune’s 13.5 MW of 2017 is the separate Aunis record)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Charente-Maritime%22%20and%20commune%3D%22Saint-Jean-de-Liversay%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2026),
    fix('FRA', 'Tout Vent wind farm', G, '補上商轉年 2021：國家發電設施登錄（ODRÉ）的 Tout Vent Énergies 1、2（Chantemerle-sur-la-Soie）各 9 MW，2021-04-21／22 併網', 'Commissioning year 2021 added: the national register of production installations (ODRÉ) lists Tout Vent Énergies 1 and 2 (Chantemerle-sur-la-Soie), 9 MW each, connected on 21–22 Apr 2021', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Charente-Maritime%22%20and%20commune%3D%22Chantemerle-sur-la-Soie%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2021),
    fix('FRA', 'Chaunay wind farm', G, '補上商轉年：OpenStreetMap 的 Ferme éolienne du Champ des Moulins（別名 Parc éolien de Chaunay）為 18 MW；國家發電設施登錄（ODRÉ）在 Chaunay 有三個對應的併網點：8 MW（2018-10-29）與 6＋4 MW（2019-01-18），合計 18 MW', 'Commissioning years added: OpenStreetMap’s Ferme éolienne du Champ des Moulins (also Parc éolien de Chaunay) is 18 MW; the national register of production installations (ODRÉ) has three matching delivery points in Chaunay: 8 MW (29 Oct 2018) and 6 + 4 MW (18 Jan 2019), 18 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Vienne%22%20and%20commune%3D%22Chaunay%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2019, ph=[[2018, 8], [2019, 10]]),
    fix('FRA', 'Chemin De Valenciennes wind farm', G, '補上商轉年 2023 並更正容量：OpenStreetMap 的 Parc éolien du Chemin de Valenciennes 為 12 MW；國家發電設施登錄（ODRÉ）在 Haussy 對應的併網點 12 MW，2023-07-19 併網', 'Commissioning year 2023 added and capacity corrected: OpenStreetMap’s Parc éolien du Chemin de Valenciennes is 12 MW; the national register of production installations (ODRÉ) has the matching 12 MW delivery point in Haussy, connected on 19 Jul 2023', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Nord%22%20and%20commune%3D%22Haussy%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=12, year=2023),
    fix('FRA', 'Lunaires wind farm', G, '補上商轉年 2023：國家發電設施登錄（ODRÉ）在 Gruey-lès-Surance 有 H2air 的 Éoliennes des Lunaires 2（13.2 MW，2023-08-30）與 Éoliennes des Fuchsias（4.4 MW，2023-11-13），合計 17.6 MW', 'Commissioning year 2023 added: the national register of production installations (ODRÉ) lists H2air’s Éoliennes des Lunaires 2 (13.2 MW, 30 Aug 2023) and Éoliennes des Fuchsias (4.4 MW, 13 Nov 2023) in Gruey-lès-Surance, 17.6 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Vosges%22%20and%20commune%3D%22Gruey-l%C3%A8s-Surance%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2023),
    fix('FRA', 'Martelotte wind farm', G, '補上商轉年 2023：國家發電設施登錄（ODRÉ）的 Ferme éolienne Martelotte（Morchies）18 MW，2023-05-25 投入運轉', 'Commissioning year 2023 added: the national register of production installations (ODRÉ) lists the Ferme éolienne Martelotte (Morchies), 18 MW, in service on 25 May 2023', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Pas-de-Calais%22%20and%20commune%3D%22Morchies%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2023),
    fix('FRA', 'Vron wind farm', G, '補上商轉年 2013：國家發電設施登錄（ODRÉ）在 Vron 只有兩個 9.2 MW 併網點（Boralex Vron 1 與 InnoVent 的另一個），都在 2013-07-02 併網', 'Commissioning year 2013 added: the national register of production installations (ODRÉ) has only two 9.2 MW delivery points in Vron (Boralex Vron 1 and InnoVent’s other one), both connected on 2 Jul 2013', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Somme%22%20and%20commune%3D%22Vron%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2013),
    fix('FRA', 'Plaine De L’Escrebieux  wind farm', G, '補上商轉年 2021 並更正容量：這筆是 Boralex 的 Plaine de l’Escrebieux 擴建（原風場 12 MW，2014 年已另有紀錄）；OpenStreetMap 的擴建為 13.8 MW，國家發電設施登錄（ODRÉ）在 Noyelles-Godault 對應的併網點 13.8 MW，2021-09-20 併網', 'Commissioning year 2021 added and capacity corrected: this record is Boralex’s Plaine de l’Escrebieux extension (the original 12 MW farm of 2014 has its own record); OpenStreetMap gives the extension 13.8 MW, and the national register of production installations (ODRÉ) has the matching 13.8 MW delivery point in Noyelles-Godault, connected on 20 Sep 2021', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Pas-de-Calais%22%20and%20commune%3D%22Noyelles-Godault%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=13.8, year=2021),
    fix('FRA', 'Arcy-Précy wind farm', G, '補上商轉年、更正容量與位置：國家發電設施登錄（ODRÉ）的 Ferme éolienne d’Arcy-Précy 兩個併網點都在 Arcy-sur-Cure（約訥省）：Champs Rouillot 13.56 MW（2021-07）與 Les Thureaux 4 MW（2022-04），合計 17.56 MW；OpenStreetMap 的 Parc éolien d’Arcy Precy（17.56 MW）在其東北約 36 km，原座標偏離', 'Commissioning years, capacity and location corrected: the national register of production installations (ODRÉ) lists both Ferme éolienne d’Arcy-Précy delivery points in Arcy-sur-Cure (Yonne): Champs Rouillot, 13.56 MW (Jul 2021) and Les Thureaux, 4 MW (Apr 2022), 17.56 MW in all; OpenStreetMap’s Parc éolien d’Arcy Precy (17.56 MW) is about 36 km north-east of the old point', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Yonne%22%20and%20commune%3D%22Arcy-sur-Cure%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=17.56, year=2022, ph=[[2021, 13.56], [2022, 4]], lat=47.607, lon=3.796),
    fix('FRA', 'Longueil wind farm', G, '補上商轉年 2023，更正容量與位置：OpenStreetMap 的 Parc éolien de Longueil（濱海塞納省）為 12 MW；國家發電設施登錄（ODRÉ）在鄰鎮 Saint-Denis-d’Aclon 對應的併網點 12 MW，2023-04-27 併網。原座標在約 47 km 外', 'Commissioning year 2023 added, capacity and location corrected: OpenStreetMap’s Parc éolien de Longueil (Seine-Maritime) is 12 MW; the national register of production installations (ODRÉ) has the matching 12 MW delivery point in neighbouring Saint-Denis-d’Aclon, connected on 27 Apr 2023. The old point was about 47 km away', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Seine-Maritime%22%20and%20commune%3D%22Saint-Denis-d%27Aclon%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=12, year=2023, lat=49.863, lon=0.935),
    fix('FRA', 'Rescotiou wind farm', G, '補上商轉年 2010：OpenStreetMap 的 Parc éolien de Rescostiou 1、2 為 12＋4 MW；國家發電設施登錄（ODRÉ）在 Kergrist-Moëlou 有對應的 12 MW 與 4 MW 併網點，2010-07-22 併網', 'Commissioning year 2010 added: OpenStreetMap’s Parc éolien de Rescostiou 1 and 2 are 12 + 4 MW; the national register of production installations (ODRÉ) has the matching 12 MW and 4 MW delivery points in Kergrist-Moëlou, connected on 22 Jul 2010', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22C%C3%B4tes-d%27Armor%22%20and%20commune%3D%22Kergrist-Mo%C3%ABlou%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2010),
    fix('FRA', 'Monnes Energies wind farm', G, '補上商轉年 2016：國家發電設施登錄（ODRÉ）的 Monnes Énergies（Neuilly 2，Neuilly-Saint-Front）6.47 MW 於 2016-11-23 併網，同鎮另一個 10.79 MW 併網點於 2016-11-25 併網', 'Commissioning year 2016 added: the national register of production installations (ODRÉ) lists Monnes Énergies (Neuilly 2, Neuilly-Saint-Front), 6.47 MW, connected on 23 Nov 2016, and another 10.79 MW delivery point in the same commune connected on 25 Nov 2016', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aisne%22%20and%20commune%3D%22Neuilly-Saint-Front%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2016),
    fix('FRA', 'Lavacquerie wind farm', G, '補上商轉年 2019：Statkraft 2019 年的購電合約新聞稿列出 Valeco 的 Lavacquerie 風場 15.4 MW；國家發電設施登錄（ODRÉ）在 Lavacquerie 只有兩個併網點（6.6＋8.8 MW，合計 15.4 MW），2019-11-28 併網', 'Commissioning year 2019 added: Statkraft’s 2019 PPA release lists Valeco’s Lavacquerie wind project at 15.4 MW; the national register of production installations (ODRÉ) has just two delivery points in Lavacquerie (6.6 + 8.8 MW, 15.4 MW in all), connected on 28 Nov 2019', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Oise%22%20and%20commune%3D%22Lavacquerie%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2019),
    fix('FRA', 'Champarts wind farm', G, '補上商轉年 2023 並更正容量：國家發電設施登錄（ODRÉ）的 CPENR Les Champarts（Aschères-le-Marché）12 MW，2023-01-19 併網', 'Commissioning year 2023 added and capacity corrected: the national register of production installations (ODRÉ) lists CPENR Les Champarts (Aschères-le-Marché), 12 MW, connected on 19 Jan 2023', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Loiret%22%20and%20commune%3D%22Asch%C3%A8res-le-March%C3%A9%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=12, year=2023),
    fix('FRA', 'Bornay 2 wind farm', G, '補上商轉年 2022：OpenStreetMap 的 Parc éolien de Bornay 2（Valeco） 為 15 MW；國家發電設施登錄（ODRÉ）在 Chéry 對應的 15 MW 併網點於 2022-12-01 併網', 'Commissioning year 2022 added: OpenStreetMap’s Parc éolien de Bornay 2（Valeco） is 15 MW; the national register of production installations (ODRÉ) has the matching 15 MW delivery point in Chéry, connected on 1 Dec 2022', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Cher%22%20and%20commune%3D%22Ch%C3%A9ry%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2022),
    fix('FRA', 'Roussac wind farm', G, '補上商轉年 2021：OpenStreetMap 的 Parc éolien de Roussac 為 15 MW；國家發電設施登錄（ODRÉ）在鄰鎮 Saint-Junien-les-Combes 只有兩個併網點（6＋9 MW，合計 15 MW），2021 年 3、4 月併網', 'Commissioning year 2021 added: OpenStreetMap’s Parc éolien de Roussac is 15 MW; the national register of production installations (ODRÉ) has just two delivery points in neighbouring Saint-Junien-les-Combes (6 + 9 MW, 15 MW in all), connected in March and April 2021', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Haute-Vienne%22%20and%20commune%3D%22Saint-Junien-les-Combes%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2021),
    fix('FRA', 'Sainte-Valière wind farm', G, '補上商轉年 2024並更正容量：OpenStreetMap 的 Ferme éolienne de Sainte-Valière 為 11 MW；國家發電設施登錄（ODRÉ）在 Sainte-Valière 只有一個 11.3 MW 併網點，2024-04-23 併網', 'Commissioning year 2024 added and capacity corrected: OpenStreetMap’s Ferme éolienne de Sainte-Valière is 11 MW; the national register of production installations (ODRÉ) has a single 11.3 MW delivery point in Sainte-Valière, connected on 23 Apr 2024', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aude%22%20and%20commune%3D%22Sainte-Vali%C3%A8re%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2024, mw=11.3),
    fix('FRA', 'Villers-le-Tourneur wind farm', G, '補上商轉年 2021：Energiequelle 2021-08-09 新聞稿說 Villers-le-Tourneur 風場（5 部 Nordex N117，合計 15 MW）已投入運轉；國家發電設施登錄（ODRÉ）在 Villers-le-Tourneur 的 15 MW 併網點（Énergie du Partage）2021-04-15 併網', 'Commissioning year 2021 added: Energiequelle’s release of 9 Aug 2021 says the Villers-le-Tourneur farm (five Nordex N117, 15 MW in all) has been commissioned; the national register of production installations (ODRÉ) lists the 15 MW Énergie du Partage delivery point in Villers-le-Tourneur, connected on 15 Apr 2021', 'https://www.renewable-energy-industry.com/news/press-releases/pm-7211-two-french-wind-farms-of-energiequelle-gmbh-commissioned', year=2021, turbine='5 x Nordex N117'),
    fix('FRA', 'Mont Louis wind farm (France)', G, '補上商轉年 2024：OpenStreetMap 的 Ferme éolienne du Mont-Louis 為 15 MW；國家發電設施登錄（ODRÉ）在 Mont-Laurent 對應的 15 MW 併網點於 2024-04-10 併網', 'Commissioning year 2024 added: OpenStreetMap’s Ferme éolienne du Mont-Louis is 15 MW; the national register of production installations (ODRÉ) has the matching 15 MW delivery point in Mont-Laurent, connected on 10 Apr 2024', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Ardennes%22%20and%20commune%3D%22Mont-Laurent%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2024),
    fix('FRA', 'Brandes wind farm', G, '補上商轉年 2017：OpenStreetMap 的 parc éolien des Brandes 為 15 MW；國家發電設施登錄（ODRÉ）在 Saint-Secondin 對應的 15 MW 併網點於 2017-01-10 併網', 'Commissioning year 2017 added: OpenStreetMap’s parc éolien des Brandes is 15 MW; the national register of production installations (ODRÉ) has the matching 15 MW delivery point in Saint-Secondin, connected on 10 Jan 2017', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Vienne%22%20and%20commune%3D%22Saint-Secondin%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2017),
    fix('FRA', 'Bois Briffaut wind farm', G, '補上商轉年 2020 並更正位置：國家發電設施登錄（ODRÉ）的 FE du Bois Briffaut（索姆省 Vermandovillers）14.4 MW，2020-11-13 併網；OpenStreetMap 的 Ferme éolienne du Bois Briffaut（Volkswind，14.4 MW）也在那裡，原座標在瓦茲省、偏離約 44 km', 'Commissioning year 2020 added and location corrected: the national register of production installations (ODRÉ) lists the FE du Bois Briffaut (Vermandovillers, Somme), 14.4 MW, connected on 13 Nov 2020; OpenStreetMap’s Ferme éolienne du Bois Briffaut (Volkswind, 14.4 MW) is there too, while the old point was in the Oise, about 44 km away', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Somme%22%20and%20commune%3D%22Vermandovillers%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020, lat=49.832, lon=2.791),
    fix('FRA', 'Haut-Vignoble wind farm', G, '補上商轉年 2024：國家發電設施登錄（ODRÉ）的 Ferme éolienne du Haut Vignoble（La Regrippière）13.56 MW，2024-01-26 併網', 'Commissioning year 2024 added: the national register of production installations (ODRÉ) lists the Ferme éolienne du Haut Vignoble (La Regrippière), 13.56 MW, connected on 26 Jan 2024', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Loire-Atlantique%22%20and%20commune%3D%22La%20Regrippi%C3%A8re%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2024),
    fix('FRA', 'Audinchtun wind farm', G, '補上商轉年 2019：Statkraft 2019 年的購電合約新聞稿列出 Valeco 的 Audincthun 風場 14.1 MW；國家發電設施登錄（ODRÉ）在 Audincthun 對應的 14.1 MW 併網點於 2019-04-18 併網', 'Commissioning year 2019 added: Statkraft’s 2019 PPA release lists Valeco’s Audincthun wind project at 14.1 MW; the national register of production installations (ODRÉ) has the matching 14.1 MW delivery point in Audincthun, connected on 18 Apr 2019', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Pas-de-Calais%22%20and%20commune%3D%22Audincthun%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2019),
    fix('FRA', 'Leigné-Les-Bois wind farm', G, '補上商轉年 2020：OpenStreetMap 的 Parc éolien de Leigné-les-Bois 為 14 MW；國家發電設施登錄（ODRÉ）在 Leigné-les-Bois 只有一個 14 MW 併網點，2020-01-09 併網', 'Commissioning year 2020 added: OpenStreetMap’s Parc éolien de Leigné-les-Bois is 14 MW; the national register of production installations (ODRÉ) has a single 14 MW delivery point in Leigné-les-Bois, connected on 9 Jan 2020', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Vienne%22%20and%20commune%3D%22Leign%C3%A9-les-Bois%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020),
    fix('FRA', 'Bois Du Frou wind farm', G, '補上商轉年 2021：OpenStreetMap 的 Parc eolien du Bois du Frou（別名 Toury Énergie） 為 14.1 MW；國家發電設施登錄（ODRÉ）在 Toury 對應的 14.1 MW 併網點於 2021-05-05 併網', 'Commissioning year 2021 added: OpenStreetMap’s Parc eolien du Bois du Frou（別名 Toury Énergie） is 14.1 MW; the national register of production installations (ODRÉ) has the matching 14.1 MW delivery point in Toury, connected on 5 May 2021', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Eure-et-Loir%22%20and%20commune%3D%22Toury%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2021),
    fix('FRA', 'Les Hauts Chemins wind farm', G, '補上商轉年 2019：國家發電設施登錄（ODRÉ）的 Centrale éolienne Les Hauts Chemins（Esley）15 MW，2019-05-15 併網', 'Commissioning year 2019 added: the national register of production installations (ODRÉ) lists the Centrale éolienne Les Hauts Chemins (Esley), 15 MW, connected on 15 May 2019', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Vosges%22%20and%20commune%3D%22Esley%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2019),
    dup('FRA', 'Soutets wind farm', G, ('Les Faydunnes wind farm', G), '同一座風場：DREAL 2022 檢查報告說 Faydunes 風場由 Centrale Éolienne des Soutets 經營，6 部、合計 13.8 MW，2019-04-01 投入運轉；國家發電設施登錄（ODRÉ）的 Centrale éolienne des Soutets（Saint-Affrique）13.8 MW。與 Les Faydunnes 風場（14 MW，2019）相同', 'Same farm: the DREAL inspection report (2022) says the Faydunes farm is run by Centrale Éolienne des Soutets, six turbines, 13.8 MW in all, in service since 1 Apr 2019; the national register of production installations (ODRÉ) lists the Centrale éolienne des Soutets (Saint-Affrique), 13.8 MW. The same as the Les Faydunnes wind farm record (14 MW, 2019)', 'https://www.georisques.gouv.fr/webappReport/ws/installations/inspection/hET8MKeqeKgCEUpIRaGoJ8VvEihvckIp'),
    fix('FRA', 'Bena wind farm', G, '補上商轉年 2023：OpenStreetMap 的 Parc éolien de Bena 為 13.5 MW；國家發電設施登錄（ODRÉ）在 Chaunay 對應的 13.5 MW 併網點於 2023-12-04 併網', 'Commissioning year 2023 added: OpenStreetMap’s Parc éolien de Bena is 13.5 MW; the national register of production installations (ODRÉ) has the matching 13.5 MW delivery point in Chaunay, connected on 4 Dec 2023', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Vienne%22%20and%20commune%3D%22Chaunay%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2023),
    fix('FRA', 'Marchéville wind farm', G, '補上商轉年 2020：OpenStreetMap 的 Parc éolien de Marchéville 為 13.2 MW；國家發電設施登錄（ODRÉ）在 Marchéville 只有一個 13.2 MW 併網點，2020-02-20 併網', 'Commissioning year 2020 added: OpenStreetMap’s Parc éolien de Marchéville is 13.2 MW; the national register of production installations (ODRÉ) has a single 13.2 MW delivery point in Marchéville, connected on 20 Feb 2020', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Eure-et-Loir%22%20and%20commune%3D%22March%C3%A9ville%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020),
    fix('FRA', 'Pays de Caux wind farm', G, '補上商轉年 2023：OpenStreetMap 的 Parc éolien du Pays de Caux 為 12.9 MW；國家發電設施登錄（ODRÉ）在 Ambrumesnil 只有一個 12.9 MW 併網點，2023-07-21 併網', 'Commissioning year 2023 added: OpenStreetMap’s Parc éolien du Pays de Caux is 12.9 MW; the national register of production installations (ODRÉ) has a single 12.9 MW delivery point in Ambrumesnil, connected on 21 Jul 2023', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Seine-Maritime%22%20and%20commune%3D%22Ambrumesnil%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2023),
    fix('FRA', 'Varimpré wind farm', G, '補上商轉年 2007：OpenStreetMap 的 Parc éolien de Varimpre 為 12.5 MW；國家發電設施登錄（ODRÉ）在 Callengeville 對應的 12 MW 併網點於 2007-11-27 併網（同日的 10 MW 是另一筆 Clos Bataille 風場）', 'Commissioning year 2007 added: OpenStreetMap’s Parc éolien de Varimpre is 12.5 MW; the national register of production installations (ODRÉ) has the matching 12 MW delivery point in Callengeville, connected on 27 Nov 2007 (the 10 MW unit of the same day is the separate Clos Bataille record)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Seine-Maritime%22%20and%20commune%3D%22Callengeville%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2007),
    fix('FRA', 'Les Pelures Blanches wind farm', G, '補上商轉年：國家發電設施登錄（ODRÉ）在 Sainte-Lizaigne 的 Parc éolien des Pelures Blanches 2.5 MW（2015-06-04）與 Pelures Blanches 2 10 MW（2016-08-16），合計 12.5 MW', 'Commissioning years added: the national register of production installations (ODRÉ) lists the Parc éolien des Pelures Blanches in Sainte-Lizaigne, 2.5 MW (4 Jun 2015), and Pelures Blanches 2, 10 MW (16 Aug 2016), 12.5 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Indre%22%20and%20commune%3D%22Sainte-Lizaigne%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2016, ph=[[2015, 2.5], [2016, 10]]),
    fix('FRA', "Bois d'Olivet wind farm", G, '補上商轉年 2021並更正容量：OpenStreetMap 的 Parc éolien de Bois d’Olivet 為 9.6 MW；國家發電設施登錄（ODRÉ）在 Massay 對應的 9.6 MW 併網點於 2021-03-16 併網', 'Commissioning year 2021 added and capacity corrected: OpenStreetMap’s Parc éolien de Bois d’Olivet is 9.6 MW; the national register of production installations (ODRÉ) has the matching 9.6 MW delivery point in Massay, connected on 16 Mar 2021', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Cher%22%20and%20commune%3D%22Massay%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2021, mw=9.6),
    fix('FRA', 'Chauvé wind farm', G, '補上商轉年 2013：國家發電設施登錄（ODRÉ）的 Chauvé Énergies（Chauvé）12 MW，2013-02-11 併網', 'Commissioning year 2013 added: the national register of production installations (ODRÉ) lists Chauvé Énergies (Chauvé), 12 MW, connected on 11 Feb 2013', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Loire-Atlantique%22%20and%20commune%3D%22Chauv%C3%A9%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2013),
    dup('FRA', 'Baronville wind farm', G, ('Destry wind farm', G), '同一座風場：國家發電設施登錄（ODRÉ）在 Baronville 只有一個 12 MW 併網點（2010-04-29 併網）；OpenStreetMap 在該處標的是 UEM 的 Parc éolien de Destry（12 MW），與 Destry 風場（12 MW，2010）相同', 'Same farm: the national register of production installations (ODRÉ) has a single 12 MW delivery point in Baronville (connected on 29 Apr 2010); OpenStreetMap shows UEM’s Parc éolien de Destry (12 MW) there, the same as the Destry wind farm record (12 MW, 2010)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Moselle%22%20and%20commune%3D%22Baronville%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Petit Arbre wind farm', G, '補上商轉年 2008：OpenStreetMap 的 Parc éolien du Nord Santerre 2（別名 Vauvillers 3，經營者 Parc éolien du Petit Arbre） 為 12 MW；國家發電設施登錄（ODRÉ）的 Parc éolien Vauvillers 3（Vauvillers）12 MW 於 2008-06-01 併網', 'Commissioning year 2008 added: OpenStreetMap’s Parc éolien du Nord Santerre 2（別名 Vauvillers 3，經營者 Parc éolien du Petit Arbre） is 12 MW; the national register of production installations (ODRÉ) lists the Parc éolien Vauvillers 3 (Vauvillers), 12 MW, connected on 1 Jun 2008', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Somme%22%20and%20commune%3D%22Vauvillers%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2008),
    dup('FRA', 'Le Moulin De Sehen wind farm', G, ('Mesnil-Rousset wind farm', G), '同一座風場：OpenStreetMap 的 Parc éolien du Moulin de Sehen（Engie Green，別名 Mesnil-Rousset / La Haye-Saint-Sylvestre）為 12.3 MW；國家發電設施登錄（ODRÉ）在 Mesnil-Rousset 只有一個 12.3 MW 併網點（2015-05-21 併網），與 Mesnil-Rousset 風場（12 MW，2015）相同', 'Same farm: OpenStreetMap’s Parc éolien du Moulin de Sehen (Engie Green, also Mesnil-Rousset / La Haye-Saint-Sylvestre) is 12.3 MW; the national register of production installations (ODRÉ) has a single 12.3 MW delivery point in Mesnil-Rousset (connected on 21 May 2015), the same as the Mesnil-Rousset wind farm record (12 MW, 2015)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Eure%22%20and%20commune%3D%22Mesnil-Rousset%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'La Remise Des Bruyeres wind farm', G, '補上商轉年 2006：OpenStreetMap 的 Parc éolien de la Remise des Bruyères 為 12 MW；國家發電設施登錄（ODRÉ）在 Louville-la-Chenard 對應的 12 MW 併網點於 2006-06-14 併網', 'Commissioning year 2006 added: OpenStreetMap’s Parc éolien de la Remise des Bruyères is 12 MW; the national register of production installations (ODRÉ) has the matching 12 MW delivery point in Louville-la-Chenard, connected on 14 Jun 2006', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Eure-et-Loir%22%20and%20commune%3D%22Louville-la-Chenard%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2006),
    fix('FRA', 'La Seauve wind farm', G, '補上商轉年 2020：OpenStreetMap 的 Parc éolien de La Seauve 為 11.5 MW；國家發電設施登錄（ODRÉ）在 La Roche-sur-Grane 只有一個 11.5 MW 併網點，2020-12-02 併網', 'Commissioning year 2020 added: OpenStreetMap’s Parc éolien de La Seauve is 11.5 MW; the national register of production installations (ODRÉ) has a single 11.5 MW delivery point in La Roche-sur-Grane, connected on 2 Dec 2020', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Dr%C3%B4me%22%20and%20commune%3D%22La%20Roche-sur-Grane%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020),
    fix('FRA', 'Rully wind farm', G, '補上商轉年 2010：OpenStreetMap 的 Parc éolien de Rully 為 12 MW；國家發電設施登錄（ODRÉ）在 Valdallière（Rully 已併入的新市鎮）只有一個 12 MW 併網點，2010-02-15 併網', 'Commissioning year 2010 added: OpenStreetMap’s Parc éolien de Rully is 12 MW; the national register of production installations (ODRÉ) has a single 12 MW delivery point in Valdallière (the merged commune that now includes Rully), connected on 15 Feb 2010', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Calvados%22%20and%20commune%3D%22Valdalli%C3%A8re%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2010),
    fix('FRA', 'Saint Jacques wind farm', G, '補上商轉年 2009：OpenStreetMap 的 Centrale éolienne de Saint-Jacques 為 12 MW；國家發電設施登錄（ODRÉ）在 Charmont-en-Beauce 對應的 12 MW 併網點於 2009-08-22 併網', 'Commissioning year 2009 added: OpenStreetMap’s Centrale éolienne de Saint-Jacques is 12 MW; the national register of production installations (ODRÉ) has the matching 12 MW delivery point in Charmont-en-Beauce, connected on 22 Aug 2009', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Loiret%22%20and%20commune%3D%22Charmont-en-Beauce%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2009),
    fix('FRA', "D'Autremencourt wind farm", G, '補上商轉年 2008：國家發電設施登錄（ODRÉ）的 Parc éolien d’Autremencourt（Autremencourt）12 MW，2008-12-04 併網', 'Commissioning year 2008 added: the national register of production installations (ODRÉ) lists the Parc éolien d’Autremencourt (Autremencourt), 12 MW, connected on 4 Dec 2008', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aisne%22%20and%20commune%3D%22Autremencourt%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2008),
    fix('FRA', 'Tripleville wind farm', G, '補上商轉年 2012：OpenStreetMap 的 Parc éolien de Tripleville 為 11.5 MW；國家發電設施登錄（ODRÉ）在 Bourthes 對應的 11.5 MW 併網點於 2012-08-10 併網', 'Commissioning year 2012 added: OpenStreetMap’s Parc éolien de Tripleville is 11.5 MW; the national register of production installations (ODRÉ) has the matching 11.5 MW delivery point in Bourthes, connected on 10 Aug 2012', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Pas-de-Calais%22%20and%20commune%3D%22Bourthes%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2012),
    dup('FRA', 'Le Nitis 1 wind farm', G, ('Le Nitis wind farm', G), '同一座風場：OpenStreetMap 的 Le Nitis 1、Le Nitis 2（WindVision）各 11.75 MW；國家發電設施登錄（ODRÉ）在 Ménil-Annelles 與 Annelles 的對應併網點於 2017-05-02 與 05-29 併網，與 Le Nitis 風場（24 MW，2017，已含兩期）相同', 'Same farm: OpenStreetMap’s Le Nitis 1 and Le Nitis 2 (WindVision) are 11.75 MW each; the national register of production installations (ODRÉ) has the matching delivery points in Ménil-Annelles and Annelles, connected on 2 and 29 May 2017, the same as the Le Nitis wind farm record (24 MW, 2017, both phases)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Ardennes%22%20and%20commune%20in%20%28%22Annelles%22%2C%22M%C3%A9nil-Annelles%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    dup('FRA', 'Binas wind farm', G, ('Viertiville wind farm', G), '同一座風場：國家發電設施登錄（ODRÉ）在 Binas 只有一個 11.5 MW 併網點（2006-07-27 併網）；OpenStreetMap 標為 Parc éolien la Bruyère（別名 Parc éolien de Viertiville，11.5 MW，同一天），與 Viertiville 風場（12 MW，2006）相同', 'Same farm: the national register of production installations (ODRÉ) has a single 11.5 MW delivery point in Binas (connected on 27 Jul 2006); OpenStreetMap tags it as the Parc éolien la Bruyère (also Parc éolien de Viertiville, 11.5 MW, same date), the same as the Viertiville wind farm record (12 MW, 2006)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Loir-et-Cher%22%20and%20commune%3D%22Binas%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Chenu wind farm', G, '補上商轉年 2024：OpenStreetMap 的 Ferme éolienne de Chenu 為 11 MW；國家發電設施登錄（ODRÉ）在 Chenu 只有一個 11 MW 併網點，2024-02-08 併網', 'Commissioning year 2024 added: OpenStreetMap’s Ferme éolienne de Chenu is 11 MW; the national register of production installations (ODRÉ) has a single 11 MW delivery point in Chenu, connected on 8 Feb 2024', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Sarthe%22%20and%20commune%3D%22Chenu%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2024),
    fix('FRA', 'Moisson De Beauce wind farm', G, '補上商轉年 2020：OpenStreetMap 的 Parc éolien de Moisson de Beauce 為 11 MW；國家發電設施登錄（ODRÉ）在 Luplanté 與 La Bourdinière-Saint-Loup 的三個併網點（4.4＋2.2＋4.4 MW，合計 11 MW）都在 2020-12-17 併網', 'Commissioning year 2020 added: OpenStreetMap’s Parc éolien de Moisson de Beauce is 11 MW; the national register of production installations (ODRÉ) has three delivery points in Luplanté and La Bourdinière-Saint-Loup (4.4 + 2.2 + 4.4 MW, 11 MW in all), all connected on 17 Dec 2020', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Eure-et-Loir%22%20and%20commune%20in%20%28%22Luplant%C3%A9%22%2C%22La%20Bourdini%C3%A8re-Saint-Loup%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020),
    fix('FRA', 'Bois de la Hayette wind farm', G, '補上商轉年 2023並更正容量：OpenStreetMap 的 Ferme éolienne du Bois de la Hayette 為 27.4 MW；國家發電設施登錄（ODRÉ）在 Malpart 與 Aubvillers 的兩個併網點（15.4＋12 MW，合計 27.4 MW）都在 2023-06-27 併網', 'Commissioning year 2023 added and capacity corrected: OpenStreetMap’s Ferme éolienne du Bois de la Hayette is 27.4 MW; the national register of production installations (ODRÉ) has two delivery points in Malpart and Aubvillers (15.4 + 12 MW, 27.4 MW in all), both connected on 27 Jun 2023', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Somme%22%20and%20commune%20in%20%28%22Malpart%22%2C%22Aubvillers%22%29&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2023, mw=27.4),
    fix('FRA', 'Monterfil wind farm', G, '補上商轉年 2022：OpenStreetMap 的 Parc éolien de Monterfil 為 11.025 MW；國家發電設施登錄（ODRÉ）在 Monterfil 只有一個 11.025 MW 併網點，2022-10-12 併網', 'Commissioning year 2022 added: OpenStreetMap’s Parc éolien de Monterfil is 11.025 MW; the national register of production installations (ODRÉ) has a single 11.025 MW delivery point in Monterfil, connected on 12 Oct 2022', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Ille-et-Vilaine%22%20and%20commune%3D%22Monterfil%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2022),
    fix('FRA', 'Brux wind farm', G, '補上商轉年 2021：OpenStreetMap 的 Parc éolien de la Plaine de Nouaillé（位於 Brux） 為 10.5 MW；國家發電設施登錄（ODRÉ）在 Brux 只有一個 10.5 MW 併網點，2021-10-04 併網', 'Commissioning year 2021 added: OpenStreetMap’s Parc éolien de la Plaine de Nouaillé（位於 Brux） is 10.5 MW; the national register of production installations (ODRÉ) has a single 10.5 MW delivery point in Brux, connected on 4 Oct 2021', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Vienne%22%20and%20commune%3D%22Brux%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2021),
    fix('FRA', 'Goulafrière wind farm', G, '補上商轉年 2022並更正容量：OpenStreetMap 的 Parc éolien de La Goulafrière（Engie Green） 為 8.8 MW；國家發電設施登錄（ODRÉ）在 La Goulafrière 只有一個 8.8 MW 併網點，2022-01-17 併網', 'Commissioning year 2022 added and capacity corrected: OpenStreetMap’s Parc éolien de La Goulafrière（Engie Green） is 8.8 MW; the national register of production installations (ODRÉ) has a single 8.8 MW delivery point in La Goulafrière, connected on 17 Jan 2022', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Eure%22%20and%20commune%3D%22La%20Goulafri%C3%A8re%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2022, mw=8.8),
    dup('FRA', 'Blancfossé wind farm', G, ('Butte Saint Liphard wind farm', G), '同一座風場：OpenStreetMap 把 Parc éolien de Blancfossé 標為 Parc éolien La Butte Saint-Liphard 的別名（13.2 MW），與 Butte Saint Liphard 風場（10 MW，2007）相同', 'Same farm: OpenStreetMap gives Parc éolien de Blancfossé as another name of the Parc éolien La Butte Saint-Liphard (13.2 MW), the same as the Butte Saint Liphard wind farm record (10 MW, 2007)', 'https://www.openstreetmap.org/relation/2684338'),
    dup('FRA', 'Sacquenay wind farm', G, ('Sources Du Mistral wind farm', G), '同一座風場：OpenStreetMap 把 Parc éolien de Sacquenay 標為 CNR 的 Parc éolien des Sources du Mistral 的別名（18 MW）；國家發電設施登錄（ODRÉ）在 Sacquenay 只有一個 10 MW 併網點（2019-01-07 併網），是該風場的一部分，與 Sources Du Mistral 風場（18 MW，2019）相同', 'Same farm: OpenStreetMap gives Parc éolien de Sacquenay as another name of CNR’s Parc éolien des Sources du Mistral (18 MW); the national register of production installations (ODRÉ) has a single 10 MW delivery point in Sacquenay (connected on 7 Jan 2019), part of that farm, the same as the Sources Du Mistral wind farm record (18 MW, 2019)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22C%C3%B4te-d%27Or%22%20and%20commune%3D%22Sacquenay%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Louvières et Poulangy wind farm', G, '補上商轉年 2020：OpenStreetMap 的 Parc éolien de Louvières-Poulangy 為 11 MW；國家發電設施登錄（ODRÉ）在 Louvières 只有一個 11 MW 併網點，2020-10-13 併網', 'Commissioning year 2020 added: OpenStreetMap’s Parc éolien de Louvières-Poulangy is 11 MW; the national register of production installations (ODRÉ) has a single 11 MW delivery point in Louvières, connected on 13 Oct 2020', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Haute-Marne%22%20and%20commune%3D%22Louvi%C3%A8res%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2020),
    dup('FRA', 'Laucourt wind farm', G, ('Laucourt-Beuvraignes wind farm', G), '同一座風場：國家發電設施登錄（ODRÉ）在 Beuvraignes 只有 Valorem 的 Laucourt Énergies 1 與 Beuvraignes Énergies 兩個 10 MW 併網點（2009-09-01 併網，合計 20 MW），Laucourt 鎮沒有風電併網點；這筆 10 MW 是 Laucourt-Beuvraignes 風場（20 MW，2009）的一半', 'Same farm: the national register of production installations (ODRÉ) has only Valorem’s two 10 MW delivery points in Beuvraignes, Laucourt Énergies 1 and Beuvraignes Énergies (connected on 1 Sep 2009, 20 MW in all), and none in Laucourt; this 10 MW record is half of the Laucourt-Beuvraignes wind farm record (20 MW, 2009)', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Somme%22%20and%20commune%3D%22Beuvraignes%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B'),
    fix('FRA', 'Montloué wind farm', G, '補上商轉年並更正容量：OpenStreetMap 的 Parc éolien de Montloué 1（4.6 MW）與 Montloué 2（8 MW）；國家發電設施登錄（ODRÉ）在 Montloué 的兩個併網點：Parc éolien Montloué L1 4.6 MW（2007-06）與另一個 8 MW（2009-07），合計 12.6 MW', 'Commissioning years added and capacity corrected: OpenStreetMap has Parc éolien de Montloué 1 (4.6 MW) and Montloué 2 (8 MW); the national register of production installations (ODRÉ) has two delivery points in Montloué: Parc éolien Montloué L1, 4.6 MW (Jun 2007), and another of 8 MW (Jul 2009), 12.6 MW in all', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Aisne%22%20and%20commune%3D%22Montlou%C3%A9%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', mw=12.6, year=2009, ph=[[2007, 4.6], [2009, 8]]),
    fix('FRA', 'Noyal-Muzillac wind farm', G, '補上商轉年 2021並更正容量：OpenStreetMap 的 Parc éolien de Noyal-Muzillac 為 7 MW；國家發電設施登錄（ODRÉ）在 Noyal-Muzillac 只有一個 7 MW 併網點（EE Noyal），2021-12-09 併網', 'Commissioning year 2021 added and capacity corrected: OpenStreetMap’s Parc éolien de Noyal-Muzillac is 7 MW; the national register of production installations (ODRÉ) has a single 7 MW delivery point in Noyal-Muzillac (EE Noyal), connected on 9 Dec 2021', 'https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?where=codefiliere%3D%22EOLIE%22%20and%20departement%3D%22Morbihan%22%20and%20commune%3D%22Noyal-Muzillac%22&select=nominstallation,commune,codeinseecommune,datemiseenservice,dateraccordement,puismaxinstallee,nbinstallations&order_by=datemiseenservice&delimiter=%3B', year=2021, mw=7),
    # ------------------------------------------------ 2026-10-09 第十四批（第二十一輪：商轉年；出處原文以 check_quotes.py 核對）
    fix('ESP', 'El Llano wind farm (Spain)', G, '補上商轉年 2019：亞拉岡自治區政府公布的環境監測報告說，El Llano 風場（Rueda de Jalón；14 部 Vestas V136，49.95 MW）2019 年 3 月進入運轉期', 'Commissioning year 2019 added: the monitoring report published by the Government of Aragón says the El Llano wind farm (Rueda de Jalón; 14 Vestas V136 turbines, 49.95 MW) entered its operating phase in March 2019', 'https://www.aragon.es/documents/20127/91855630/PE+El+Llano_A%C3%B1o4_IC1_Expl_ene22-abr22.pdf/e69e07d5-a919-01cf-d5af-d89ffed551dc?t=1655114518532', year=2019),
    fix('ESP', 'Juno wind farm', G, '補上商轉年 2004：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 JUNO（Suellacabras, Narros, Arancón y Magaña，Soria，49.5 MW，33 部 NEG Micon 1.5 MW），2004 年投入運轉', 'Commissioning year 2004 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists JUNO (Suellacabras, Narros, Arancón y Magaña, Soria, 49.5 MW, 33 NEG Micon turbines of 1.5 MW), put into operation in 2004', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22JUNO%22&delimiter=%3B', year=2004),
    fix('ESP', 'La Luna wind farm', G, '補上商轉年 2004：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 LA LUNA（Trévago, Fuentestrún, Valdegeña, Villar del Campo y Matalebreras，Soria，49.5 MW，33 部 NEG Micon 1.5 MW），2004 年投入運轉', 'Commissioning year 2004 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists LA LUNA (Trévago, Fuentestrún, Valdegeña, Villar del Campo y Matalebreras, Soria, 49.5 MW, 33 NEG Micon turbines of 1.5 MW), put into operation in 2004', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22LA%20LUNA%22&delimiter=%3B', year=2004),
    fix('ESP', 'Valdemoro wind farm', G, '補上商轉年 2025：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 VALDEMORO（Fuentes de Valdepero，Burgos，49.5 MW，11 部 Gamesa 4.5 MW），2025 年投入運轉', 'Commissioning year 2025 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists VALDEMORO (Fuentes de Valdepero, Burgos, 49.5 MW, 11 Gamesa turbines of 4.5 MW), put into operation in 2025', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22VALDEMORO%22&delimiter=%3B', year=2025),
    fix('ESP', 'Rea Unificado wind farm', G, '補上商轉年 2022 與業主：RWE 2022 年 12 月宣布索里亞省的 Rea Unificado 風場（9 部 Nordex 4.53 MW，40.8 MW）投入運轉，是它在西班牙的第 17 座風場；卡斯提亞—雷昂自治區的運轉中風場登錄只有「REA UNIFICADO (FASE 2)」一筆（9 部 Nordex 4.8 MW，42.4 MW，2024-04-09），年份依 RWE 的公告', 'Commissioning year 2022 and owner added: in December 2022 RWE announced that its Rea Unificado wind farm in Soria (9 Nordex turbines of 4.53 MW, 40.8 MW), its 17th in Spain, had been put into service; Castilla y León’s register of operating farms has only a “REA UNIFICADO (FASE 2)” entry (9 Nordex turbines of 4.8 MW, 42.4 MW, 9 Apr 2024), so the year follows RWE’s announcement', 'https://www.energias-renovables.com/eolica/rwe-emplea-una-solucion-de-cimentacion-20221211', year=2022, owner='RWE Renewables Iberia'),
    fix('ESP', 'Carratorres wind farm', G, '補上商轉年 2020：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 CARRATORRES（Valdenebro de los Valles，Valladolid，39.6 MW，12 部 Acciona 3.3 MW），2020 年投入運轉', 'Commissioning year 2020 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists CARRATORRES (Valdenebro de los Valles, Valladolid, 39.6 MW, 12 Acciona turbines of 3.3 MW), put into operation in 2020', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22CARRATORRES%22&delimiter=%3B', year=2020),
    fix('ESP', 'Campanario (Ventient) wind farm', G, '補上商轉年 2010：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 CAMPANARIO（Carcedo de Burgos y Revillarruz，Burgos，38 MW，19 部 Vestas 2 MW），2010 年投入運轉', 'Commissioning year 2010 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists CAMPANARIO (Carcedo de Burgos y Revillarruz, Burgos, 38 MW, 19 Vestas turbines of 2 MW), put into operation in 2010', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22CAMPANARIO%22&delimiter=%3B', year=2010),
    fix('ESP', 'Castil De Tierra wind farm', G, '補上商轉年 2009：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 CASTIL DE TIERRA（Tejado，Soria，36 MW，20 部 Vestas 1.8 MW），2009 年投入運轉', 'Commissioning year 2009 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists CASTIL DE TIERRA (Tejado, Soria, 36 MW, 20 Vestas turbines of 1.8 MW), put into operation in 2009', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22CASTIL%20DE%20TIERRA%22&delimiter=%3B', year=2009),
    fix('ESP', 'Fuente Vaín wind farm', G, '補上商轉年 2010：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 FUENTE VAIN（Carcedo de Burgos，Burgos，32 MW，16 部 Vestas 2 MW），2010 年投入運轉', 'Commissioning year 2010 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists FUENTE VAIN (Carcedo de Burgos, Burgos, 32 MW, 16 Vestas turbines of 2 MW), put into operation in 2010', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22FUENTE%20VAIN%22&delimiter=%3B', year=2010),
    fix('ESP', 'Urano wind farm', G, '補上商轉年 2004：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 URANO（Aldehuelas y Villar del Río，Soria，30.4 MW，38 部 MADE 800 kW），2004 年投入運轉', 'Commissioning year 2004 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists URANO (Aldehuelas y Villar del Río, Soria, 30.4 MW, 38 MADE turbines of 800 kW), put into operation in 2004', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22URANO%22&delimiter=%3B', year=2004),
    fix('ESP', 'La Sía wind farm', G, '補上商轉年 2003：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 LA SIA（Espinosa de los Monteros，Burgos，29.7 MW，27 部 MADE 1.1 MW），2003 年投入運轉', 'Commissioning year 2003 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists LA SIA (Espinosa de los Monteros, Burgos, 29.7 MW, 27 MADE turbines of 1.1 MW), put into operation in 2003', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22LA%20SIA%22&delimiter=%3B', year=2003),
    fix('ESP', 'La Peña wind farm', G, '補上商轉年 2019：亞拉岡自治區政府公布的環境監測報告說，La Peña 風場（Las Pedrosas、Sierra de Luna；11 部 2.625 MW，28.8 MW）2018 年 6 月開工、2019 年 8 月完工並投入運轉', 'Commissioning year 2019 added: the monitoring report published by the Government of Aragón says the La Peña wind farm (Las Pedrosas and Sierra de Luna; 11 turbines of 2.625 MW, 28.8 MW) was built from June 2018 to August 2019 and began operating when it was finished', 'https://www.aragon.es/documents/20127/91866716/PE+LaPe%C3%B1a_A%C3%B1o3_IC2_Expl_dic21-mar22_v2.pdf/33ca0b78-9a14-a025-2d97-f2f2d6d043ab?t=1655206224308', year=2019),
    fix('ESP', 'El Castillo (EDP) wind farm', G, '補上商轉年 2022：亞拉岡自治區政府公布的 El Castillo 風場（Luesma 等地，薩拉戈薩與特魯埃爾省）運轉第 1 年環境監測報告說，風場 2022 年 5 月投入運轉', 'Commissioning year 2022 added: the first operating-year monitoring report on the El Castillo wind farm (Luesma and neighbouring municipalities, Zaragoza and Teruel) published by the Government of Aragón says the farm was put into operation in May 2022', 'https://www.aragon.es/documents/20127/91914885/PE+El+Castillo_A%C3%B1o1_IC1_Expl_ene22-abr22.pdf/2332d90a-758c-24b6-a169-c467f3c2d35f?t=1655722054107', year=2022),
    fix('ESP', 'El Páramo wind farm', G, '補上商轉年 2010：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 EL PARAMO（Alfoz de Quintanadueñas，Burgos，24 MW，16 部 GE 1.5 MW），2010 年投入運轉', 'Commissioning year 2010 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists EL PARAMO (Alfoz de Quintanadueñas, Burgos, 24 MW, 16 GE turbines of 1.5 MW), put into operation in 2010', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22EL%20PARAMO%22&delimiter=%3B', year=2010),
    fix('ESP', 'Valdesamario wind farm', G, '補上商轉年 2010：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 VALDESAMARIO（Riello, Valdesamario y Villagatón，León，18 MW，12 部 Gamesa 2 MW），2010 年投入運轉（登錄的總容量寫 18 MW，但 12 部 × 2 MW＝24 MW，與本站紀錄相同，容量不改）', 'Commissioning year 2010 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists VALDESAMARIO (Riello, Valdesamario y Villagatón, León, 18 MW, 12 Gamesa turbines of 2 MW), put into operation in 2010 (the register gives 18 MW in total, but 12 × 2 MW = 24 MW, as in the record, so the capacity is left as is)', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22VALDESAMARIO%22&delimiter=%3B', year=2010),
    fix('ESP', 'Parideras wind farm', G, '補上商轉年 2020：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 PARIDERAS（Medinaceli，Soria，23.1 MW，11 部 Vestas 2.1 MW），2020 年投入運轉', 'Commissioning year 2020 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists PARIDERAS (Medinaceli, Soria, 23.1 MW, 11 Vestas turbines of 2.1 MW), put into operation in 2020', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22PARIDERAS%22&delimiter=%3B', year=2020),
    fix('ESP', 'Perdiguera wind farm', G, '補上商轉年 2021：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 PERDIGUERA（Estepar，Burgos，22 MW，10 部 Vestas 2.2 MW），2021 年投入運轉', 'Commissioning year 2021 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists PERDIGUERA (Estepar, Burgos, 22 MW, 10 Vestas turbines of 2.2 MW), put into operation in 2021', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22PERDIGUERA%22&delimiter=%3B', year=2021),
    fix('ESP', 'Las Mazorras wind farm', G, '補上商轉年 2001：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 LAS MAZORRAS（Merindad de Valdivielso y Los Altos，Burgos，28.39 MW，41 部 Gamesa 660 kW），2001 年投入運轉（登錄寫 28.39 MW、41 部 660 kW；本站紀錄 22 MW，因登錄本身的數字對不上〔41×0.66＝27.06 MW〕，容量暫不改）', 'Commissioning year 2001 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists LAS MAZORRAS (Merindad de Valdivielso y Los Altos, Burgos, 28.39 MW, 41 Gamesa turbines of 660 kW), put into operation in 2001 (the register gives 28.39 MW and 41 × 660 kW; the record says 22 MW, and as the register’s own figures disagree [41 × 0.66 = 27.06 MW] the capacity is left as is)', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22LAS%20MAZORRAS%22&delimiter=%3B', year=2001),
    fix('ESP', 'Los Gigantes wind farm', G, '補上商轉年 2021：亞拉岡自治區政府公布的環境監測報告說，Enel Green Power España 的 Los Gigantes 風場（Blesa，特魯埃爾省）2021 年 2 月下旬開始運轉期監測', 'Commissioning year 2021 added: the monitoring report published by the Government of Aragón says operating-phase monitoring of Enel Green Power España’s Los Gigantes wind farm (Blesa, Teruel) began in the second half of February 2021', 'https://www.aragon.es/documents/20127/91924223/PE+Los+Gigantes_A%C3%91O+2_IC1_Expl_Ene22-abr22.pdf/94ecce19-2cd0-5cfb-0f56-612914922bd7?t=1655817878459', year=2021),
    fix('ESP', 'Soliedra wind farm', G, '補上商轉年 2021：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 SOLIEDRA（Momblona y Morón de Almazán，Soria，21 MW，6 部 Senvion 3.5 MW），2021 年投入運轉', 'Commissioning year 2021 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists SOLIEDRA (Momblona y Morón de Almazán, Soria, 21 MW, 6 Senvion turbines of 3.5 MW), put into operation in 2021', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22SOLIEDRA%22&delimiter=%3B', year=2021),
    fix('ESP', 'El Coto wind farm', G, '補上商轉年 2023，容量改為 21 MW：亞拉岡自治區政府公布的環境監測報告說，El Coto 風場（薩拉戈薩市；4 部 5.25 MW，合計 21 MW）2023 年 11 月進入運轉期', 'Commissioning year 2023 and capacity 21 MW added: the monitoring report published by the Government of Aragón says the El Coto wind farm (municipality of Zaragoza; 4 turbines of 5.25 MW, 21 MW in all) entered its operating phase in November 2023', 'https://www.aragon.es/documents/d/guest/pe-el-coto_ano2_ic2_expl_mar25-jun25-pdf', year=2023, mw=21),
    fix('ESP', 'Piedrahita wind farm', G, '補上商轉年 2022：亞拉岡自治區政府公布的 Piedrahita 風場（Loscos，特魯埃爾省）運轉第 1 年環境監測報告說，風場 2022 年 5 月投入運轉', 'Commissioning year 2022 added: the first operating-year monitoring report on the Piedrahita wind farm (Loscos, Teruel) published by the Government of Aragón says the farm was put into operation in May 2022', 'https://www.aragon.es/documents/20127/91930671/PE+Piedrahita_A%C3%B1o1_IC1_Expl_ene22-abr22.pdf/508b8bf2-bfc3-2331-4646-e87b87e49c75?t=1655894255924', year=2022),
    fix('ESP', 'Las Sardas wind farm', G, '補上商轉年 2025，業主改為 EDP Renovables España：亞拉岡自治區政府公布的環境監測報告說，EDP Renovables España 開發的 Las Sardas 風場（Farlete，20 MW）2025 年 1–2 月做併網前測試，2025 年 3 月起進入運轉期監測', 'Commissioning year 2025 and owner EDP Renovables España added: the environmental monitoring reports published by the Government of Aragón say the Las Sardas wind farm (Farlete, 20 MW), promoted by EDP Renovables España, went through pre-commissioning tests in January–February 2025 and has been monitored in its operating phase since March 2025', 'https://www.aragon.es/documents/d/guest/pe-las-sardas_ano2_im4_cons-final_feb-25-pdf', year=2025, owner='EDP Renovables España'),
    fix('ESP', 'Valdelugo wind farm', G, '補上商轉年 2022：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 VALDELUGO（Estepar，Burgos，18 MW，5 部 GE 3.6 MW），2022 年投入運轉', 'Commissioning year 2022 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists VALDELUGO (Estepar, Burgos, 18 MW, 5 GE turbines of 3.6 MW), put into operation in 2022', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22VALDELUGO%22&delimiter=%3B', year=2022),
    fix('ESP', 'Las Fuentes wind farm', G, '補上商轉年 2010：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 LAS FUENTES（Carcedo de Burgos，Burgos，18 MW，9 部 Vestas 2 MW），2010 年投入運轉', 'Commissioning year 2010 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists LAS FUENTES (Carcedo de Burgos, Burgos, 18 MW, 9 Vestas turbines of 2 MW), put into operation in 2010', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22LAS%20FUENTES%22&delimiter=%3B', year=2010),
    dup('ESP', 'Do Vilan wind farm', G, ('Do Vilán wind farm', G), '與「Do Vilán wind farm」（17 MW、2003）是同一座：Enel 與 Unión Fenosa 合資公司 2004 年 2 月在 Camariñas 啟用 Peña Forcada 與 Vilán 兩座風場，Vilán 為 13 部 1.3 MW、16.9 MW；Endesa 的新聞也把 Do Vilán 列為它在 Camariñas 的風場', 'Same farm as “Do Vilán wind farm” (17 MW, 2003): the Enel–Unión Fenosa joint venture inaugurated the Peña Forcada and Vilán farms in Camariñas in February 2004, Vilán with 13 turbines of 1.3 MW, 16.9 MW; Endesa’s news also lists Do Vilán among its Camariñas farms', 'https://www.energias-renovables.com/eolica/enelunion-fenosa-inaugura-dos-parques-eolicos-en'),
    fix('ESP', 'Montejo De Bricia wind farm', G, '補上商轉年 2006：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 MONTEJO DE BRICIA（Valle de Valdebezana，Burgos，13.6 MW，16 部 Gamesa 850 kW），2006 年投入運轉', 'Commissioning year 2006 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists MONTEJO DE BRICIA (Valle de Valdebezana, Burgos, 13.6 MW, 16 Gamesa turbines of 850 kW), put into operation in 2006', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22MONTEJO%20DE%20BRICIA%22&delimiter=%3B', year=2006),
    dup('ESP', 'Tirupan wind farm', G, ('Tirapun wind farm', G), '與「Tirapun wind farm」（13.2 MW）是同一座：Naturgy 的 Tirapu 風場（納瓦拉，4 部 3.3 MW＝13.2 MW），2018 年 11 月與 Barásoain 風場一起開工；這筆的座標落在 Ribera 一帶（與 San Gregorio、Pestriz 同點），保留座標在 Tirapu 附近的那筆', 'Same farm as “Tirapun wind farm” (13.2 MW): Naturgy’s Tirapu wind farm in Navarre (4 × 3.3 MW = 13.2 MW), started together with the Barásoain farm in November 2018; this record sits on a point in the Ribera shared with San Gregorio and Pestriz, so the record near Tirapu is kept', 'https://smartgridsinfo.es/2018/11/15/naturgy-comienza-las-obras-cuatro-parque-eolicos-navarra-sumaran-una-potencia-495-mw'),
    fix('ESP', 'Las Traperas wind farm', G, '補上商轉年 2013：卡斯提亞—雷昂自治區開放資料「運轉中風場」（Parques eólicos en funcionamiento）列 LAS TRAPERAS（Medina del Campo，Valladolid，9.9 MW，6 部 MTorres 1.65 MW），2013 年投入運轉', 'Commissioning year 2013 added: Castilla y León’s open data on operating wind farms (Parques eólicos en funcionamiento) lists LAS TRAPERAS (Medina del Campo, Valladolid, 9.9 MW, 6 MTorres turbines of 1.65 MW), put into operation in 2013', 'https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/parques-eolicos/exports/csv?where=nombre%3D%22LAS%20TRAPERAS%22&delimiter=%3B', year=2013),
]

# 不可當成精選風場重複的 GEM 專案（GEM 專案名稱，不含分期標籤）
ORPHAN_OK = {
    ('CHN', 'Jiangsu Sheyang Southern Area H1 Offshore wind farm'):
        ('射陽南區 H1 由精選的「Huaneng Sheyang H1 / Yancheng」（300 MW）代表', 'Sheyang South H1 is represented by the curated “Huaneng Sheyang H1 / Yancheng” (300 MW)'),
    ('CHN', 'Zhejiang Cangnan 1 Offshore wind farm'):
        ('蒼南 1 號由精選的「Huarun Cangnan 1 / CR Power」（400 MW）代表', 'Cangnan 1 is represented by the curated “Huarun Cangnan 1 / CR Power” (400 MW)'),
    ('CHN', 'Xinjiang Mori 2500 MW wind farm complex'):
        ('莫里 2,500 MW 是整區彙總，GEM 另逐場列出同地名的各座風場', 'The Mori 2,500 MW complex is an area total; GEM also lists the individual Mori farms'),
}

# 名稱相近、已查證是不同風場的組合：覆蓋率報告的「疑似重複」不再列（tools/coverage_report.py）
NOT_DUP = {
    # 2026-10-08 第十三輪：查證後確定是不同風場
    ('DEU', 'WP LA'):
        ('MaStR 的「WP LA」是 Lichtenau-Asseln 北側 2015–16 年的 5 部（E-82、E-92、E-115、E-70，12.3 MW）；GEM 的 Dahl（12 MW、2016）對到的是約 8 km 外 Paderborn-Dahl 的 Bürgerwindpark Dahl（2016–17 年 5 部 E-82）：不同風場',
         'MaStR’s “WP LA” is 5 turbines of 2015–16 just north of Lichtenau-Asseln (E-82, E-92, E-115, E-70; 12.3 MW); GEM’s Dahl (12 MW, 2016) matches the Bürgerwindpark Dahl at Paderborn-Dahl about 8 km away (5 E-82 of 2016–17): different farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('JPN', 'Enshu Kakegawa Wind Farm'):
        ('黑潮風力發電的遠州掛川（掛川市國安海岸，8 部 Enercon E-82，2009–2011 年，15.97 MW）與中部電力的御前崎二期（御前崎市，8 部 Subaru 2 MW，2011 年）容量年份相同，是相距約 7 km 的兩座風場（日立 Power Solutions 的 Enercon 國內交貨表只列掛川）',
         'Kuroshio Wind Power’s Enshu Kakegawa (Kuniyasu coast, Kakegawa; 8 Enercon E-82, 2009–2011, 15.97 MW) and Chubu Electric’s Omaezaki phase 2 (Omaezaki; 8 Subaru 2 MW, 2011) share capacity and year but are two farms about 7 km apart (Hitachi Power Solutions’ Enercon delivery list has only the Kakegawa one)',
         'https://www.hitachi-power-solutions.com/energy/wind-solor/wind-power/case/doc/doc_2024.pdf'),
    ('CHN', 'Jiangsu Dafeng H4 Offshore (Longyuan) wind farm'):
        ('龍源大豐 H4（303 MW、47 部 6.45 MW，太平沙，龍源鹽城新能源）與三峽大豐 H8-2（300 MW、38 部 4.5 MW＋20 部 6.45 MW，離岸約 72 km）是不同業主、不同機組的兩座風場', 'Longyuan Dafeng H4 (303 MW, 47 × 6.45 MW, Taipingsha, Longyuan Yancheng New Energy) and CTG Dafeng H8-2 (300 MW, 38 × 4.5 MW + 20 × 6.45 MW, some 72 km offshore) are two farms with different owners and turbines', 'https://offshorewind.biz/2021/12/21/chinas-farthest-offshore-wind-farm-sprints-to-the-finish-line'),
    ('CHN', 'Zhejiang Jiaxing 2 Offshore wind farm'):
        ('華能嘉興 2 號（300 MW、50 部 6 MW）與浙能嘉興 1 號（300 MW，浙江省新能源投資集團）是不同業主的兩座風場；OpenStreetMap 分別標出相鄰的兩個範圍：1 號在北緯 30.39–30.52°、2 號在 30.56–30.65°', 'Huaneng Jiaxing 2 (300 MW, 50 × 6 MW) and Zheneng Jiaxing 1 (300 MW, Zhejiang Provincial New Energy Investment Group) are two farms with different owners; OpenStreetMap maps them as two adjacent areas: No. 1 at 30.39–30.52 N, No. 2 at 30.56–30.65 N', 'https://www.openstreetmap.org/way/1300965884'),
    ('CHN', 'Jiangsu Dafeng H12 Offshore (Longyuan) wind farm'):
        ('龍源大豐 H12（80 部金風 GW109/2500，55 部在潮間帶）與 H7（80 部金風 2.5 MW，2018 年 7 月底首台交付、2019 年 6 月全部併網，中心離岸 45 km 以上）是兩座風場：金風稱 H7 是龍源在江蘇大豐海域投資建設的第二個海上風電場', 'Longyuan Dafeng H12 (80 Goldwind GW109/2500, 55 of them intertidal) and H7 (80 Goldwind 2.5 MW, first unit delivered end of July 2018, all connected by June 2019, centre over 45 km offshore) are two farms: Goldwind calls H7 Longyuan’s second offshore farm in the Dafeng sea area', 'https://www.china5e.com/news/news-1061980-1.html'),
    ('CHN', 'Fujian Putian Shitang wind farm'):
        ('莆田石塘風電場（48 MW，陸域，平海鎮，福能新能源／福能平海（莆田）風力發電，2016 年）與平海灣海上風電一期（50 MW，福建中閩海上風電，2015-04 動工、2016-07 全部併網）是不同業主的陸域與離岸兩座風場', 'Putian Shitang (48 MW, onshore, Pinghai town, Funeng New Energy / Funeng Pinghai (Putian) Wind Power, 2016) and Pinghai Bay offshore phase 1 (50 MW, Fujian Zhongmin Offshore Wind, started April 2015, fully connected July 2016) are an onshore and an offshore farm with different owners', 'https://www.gem.wiki/Fujian_Putian_Shitang_wind_farm'),
    ('DEU', 'WP Kail'):
        ('MaStR 的「WP Kail」是 2025 年在 Kail／Kaisersesch 併網的 3 部 Nordex（2 部 N149/4.5 MW、1 部 N131/3.9 MW，12.9 MW）；GEM 的 Zettingen（Gamesa 開發、2010 年售予 IKEA）對到的是 3 km 外 2009–2010 年的 6 部 Nordex N90：不同風場',
         'MaStR’s “WP Kail” is 3 Nordex turbines connected in 2025 at Kail/Kaisersesch (2 N149/4.5 MW and an N131/3.9 MW, 12.9 MW); GEM’s Zettingen (developed by Gamesa, sold to IKEA in 2010) matches the 6 Nordex N90 of 2009–2010 3 km away: different farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'WP Mittelhausen'):
        ('MaStR 的「WP Mittelhausen」是 2010 年在 Allstedt 併網的 6 部 Vestas V90（12 MW）；GEM 的 Bornstedt-Holdenstedt（MVV，8 部、12 MW）是旁邊 2006 年的 8 部 GE 1.5sl：不同風場（The Wind Power 也把 Mittelhausen I、II 列為附近另外的風場）',
         'MaStR’s “WP Mittelhausen” is 6 Vestas V90 connected in 2010 at Allstedt (12 MW); GEM’s Bornstedt-Holdenstedt (MVV, 8 turbines, 12 MW) is the neighbouring 8 GE 1.5sl of 2006: different farms (The Wind Power also lists Mittelhausen I and II as separate nearby farms)',
         'https://www.thewindpower.net/windfarm_en_3743_bornstedt-holdenstedt.php'),
    ('DEU', 'Sommerland_B'):
        ('MaStR 的「Sommerland_B」是 Elskop 2016–2018 年的 6 部 Senvion MM100（12 MW），在 BWP Süderauerdorf（2017 年 4 部 Siemens SWT-3.0-113）西南方約 4 km；也不是 ing-holst 列的 BWP Sommerland（1 部 MM100）：不同風場',
         'MaStR’s “Sommerland_B” is 6 Senvion MM100 at Elskop from 2016–2018 (12 MW), about 4 km south-west of BWP Süderauerdorf (4 Siemens SWT-3.0-113 of 2017), and not the BWP Sommerland on ing-holst’s list (1 MM100): different farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Bürgerwindpark Norddeich'):
        ('MaStR 的「Bürgerwindpark Norddeich」是 Norddeich 2015–2016 年的 5 部 Enercon E-92（11.75 MW）；GEM 的 Schülp（wpd，2014 年 5 部 E-70）、Büttler Balje（Friedrichsgabekoog，2014–2015 年 5 部 E-82）與 Wesselburener Deichhausen（2014 年 5 部 E-82）都是別的機組：不同風場',
         'MaStR’s “Bürgerwindpark Norddeich” is 5 Enercon E-92 at Norddeich from 2015–2016 (11.75 MW); GEM’s Schülp (wpd, 5 E-70 of 2014), Büttler Balje (Friedrichsgabekoog, 5 E-82 of 2014–2015) and Wesselburener Deichhausen (5 E-82 of 2014) are other turbines: different farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Dieksanderkoog TraGe 1'):
        ('MaStR 的「Dieksanderkoog TraGe 1」是 Friedrichskoog 2012 年 11–12 月併網的 6 部 Enercon E-70 E4（13.8 MW）；GEM 的 Barlt West（14 MW、2012）對到的是約 8 km 外 Barlt 的 4 部 Senvion 3.4M104（2012）與 1 部 3.2M114（2016）：不同風場',
         'MaStR’s “Dieksanderkoog TraGe 1” is 6 Enercon E-70 E4 connected November–December 2012 at Friedrichskoog (13.8 MW); GEM’s Barlt West (14 MW, 2012) matches 4 Senvion 3.4M104 (2012) and a 3.2M114 (2016) at Barlt, about 8 km away: different farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'WP Neuenreuth'):
        ('MaStR 的「WP Neuenreuth」是 Thiersheim／Höchstädt 2017 年 1–2 月併網的 4 部 Nordex N131（13.2 MW）；GEM 的 Heidelheim（13 MW、2017）對到的是約 8 km 外 Selb 的 5 部 Vensys 112（2017）：不同風場',
         'MaStR’s “WP Neuenreuth” is 4 Nordex N131 connected January–February 2017 at Thiersheim/Höchstädt (13.2 MW); GEM’s Heidelheim (13 MW, 2017) matches 5 Vensys 112 (2017) at Selb, about 8 km away: different farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Priesberg'):
        ('MaStR 的「Windpark Priesberg」是 Nohfelden 2016 年 9 月併網的 5 部 Vensys 112（12.5 MW）；GEM 的 Sötern-Bosen（13 MW、2016）對到的是約 4 km 北邊的另外 4 部（3 部 Vestas V126/3.3「Windpark Nohfelden-Eisen」2016 年與 1 部 2014 年的 E-101）：不同風場',
         'MaStR’s “Windpark Priesberg” is 5 Vensys 112 connected in September 2016 at Nohfelden (12.5 MW); GEM’s Sötern-Bosen (13 MW, 2016) matches 4 other units about 4 km north (3 Vestas V126/3.3 “Windpark Nohfelden-Eisen” of 2016 and an E-101 of 2014): different farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'OF III'):
        ('MaStR 的「OF III」是 Ovelgönne（Oldenbroker Feld）2017 年 11–12 月併網的 3 部 Vestas V112（9.9 MW）；GEM 的 Hammelwarder Moor（10 MW、2018）對到的是約 10 km 外的 3 部 Senvion 3.4M114（2017–2018）：不同風場',
         'MaStR’s “OF III” is 3 Vestas V112 connected November–December 2017 at Ovelgönne (Oldenbroker Feld, 9.9 MW); GEM’s Hammelwarder Moor (10 MW, 2018) matches 3 Senvion 3.4M114 (2017–2018) about 10 km away: different farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    # 2026-10-07 第十二輪：查證後確定是不同風場
    ('VNM', 'Cửu An wind farm'):
        ('嘉萊安溪的 Cửu An 與 Song An 是兩座 46.2 MW 風場，共用一座 110 kV 升壓站；Cửu An 2021 年在 FIT 期限前全廠 COD，Song An 是轉型期專案（EVN）',
         'Cuu An and Song An at An Khe, Gia Lai, are two 46.2 MW farms sharing one 110 kV substation; Cuu An reached full COD before the 2021 FIT deadline, Song An is a transitional project (EVN)',
         'https://sdic.vn/nha-may-dien-gio-cuu-an-462mw/'),
    ('VNM', 'Quoc Vinh Soc Trang wind farm'):
        ('國榮（6 號，陸上 7.5 ha、6 部，朔莊國榮風電公司）與 7 號（海上 3,100 ha 範圍、7 部 4.2 MW，朔莊能源公司與春求公司）是不同業主的兩座；EVN 的 FIT 名單分列國榮 30 MW 與 7 號 29.4 MW',
         'Quoc Vinh (No. 6, 7.5 ha onshore, 6 turbines, Soc Trang Quoc Vinh Wind Power Co) and No. 7 (3,100 ha offshore area, 7 × 4.2 MW, Soc Trang Energy JSC and Xuan Cau Co) are two farms with different owners; EVN’s FIT list has Quoc Vinh 30 MW and No. 7 29.4 MW as separate entries',
         'https://vietnamenergy.vn/the-first-wind-power-projects-in-soc-trang-province-have-started-the-power-generation-27557.html'),
    ('DEU', 'Streumen'):
        ('MaStR 在 Streumen 有好幾群：GEM 的 Streumen（Streumen/Glaubitz II 汰換案，4 部 Vestas V126，2016 年）之外，這筆是 2011–2023 年陸續併網的另外 4 部（16.7 MW），是另一批機組',
         'MaStR has several groups at Streumen: besides GEM’s Streumen (the Streumen/Glaubitz II repowering, 4 Vestas V126, 2016), this record is 4 other units connected 2011–2023 (16.7 MW), a different set of turbines',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('USA', 'Solano Wind Project'):
        ('Montezuma Hills 有好幾座風場：Shiloh（四期 505 MW，Iberdrola 與 EDF）與 SMUD 的 Solano Wind 是不同電廠（英文維基分列）',
         'The Montezuma Hills hold several farms: Shiloh (four phases, 505 MW, Iberdrola and EDF) and SMUD’s Solano Wind are different plants (listed separately on English Wikipedia)',
         'https://en.wikipedia.org/wiki/Shiloh_Wind_Power_Plant'),
    ('PRT', 'Fonte Da Quelha wind farm'):
        ('Cinfães 風電計畫包含兩座風場：Fonte da Quelha 與 Alto do Talefe（各 13.5 MW、EDP、2004 年），相距約 10 km，OpenStreetMap 各有一筆風場關係',
         'The Cinfães wind project consists of two farms, Fonte da Quelha and Alto do Talefe (13.5 MW each, EDP, 2004), about 10 km apart, each with its own OpenStreetMap wind-farm relation',
         'https://www.edp.com/sites/default/files/document/2025-04/quelha_e_talefe_recape.pdf'),
    ('DEU', 'Gohlocher Wald wind farm'):
        ('Gohlocher Wald 在 Lebach（2 部 Nordex N131/3000，2018 年）；MaStR 的「CEE Windpark Schwalbach」在 Püttlingen（4 部 Enercon E-115、12 MW，2018 年）：不同風場',
         'Gohlocher Wald is at Lebach (2 Nordex N131/3000, 2018); MaStR’s “CEE Windpark Schwalbach” is at Püttlingen (4 Enercon E-115, 12 MW, 2018): different farms',
         'https://www.energy3k.com/wp-gow-erste-kwh/'),
    ('CHN', 'Putian Pinghai Bay Area F (Sanchuan)'):
        ('平海灣 F 區（三川海上風電，20 萬千瓦，2017 年核准）與平海灣二期（中閩海上風電，246 MW）是不同的項目；F 區 2021 年 7 月與石城風電場一起併網',
         'Pinghai Bay area F (Sanchuan Offshore Wind, 200 MW, approved 2017) is a different project from Pinghai Bay phase 2 (Zhongmin Offshore Wind, 246 MW); area F was connected together with the Shicheng farm in July 2021',
         'https://www.court.gov.cn/zixun/xiangqing/497381.html'),
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
    # 2026-10-07：與 MaStR 新增風場容量相同、位置相近，但 MaStR 登記的是不同機組（疑似重複 B 逐組核對）
    ('DEU', 'Gägelow'):
        ('MaStR 有兩群都叫「Gägelow」、相距 41 km：GEM 的 Gägelow（2002 年、14 MW）所在處是 8 部 ENERCON E-66（2002 年，14.4 MW）；這筆是 Gägelow 鄉（維斯馬附近）2014–2022 年陸續併網的 6 部（13.8 MW），是另一座',
         'MaStR has two groups called “Gägelow”, 41 km apart: at GEM’s Gägelow (2002, 14 MW) stand 8 ENERCON E-66 (2002, 14.4 MW); this record is the 6 units in the municipality of Gägelow near Wismar, connected 2014–2022 (13.8 MW), a different farm',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'AW Windenergie Bramsche'):
        ('MaStR 的「AW Windenergie Bramsche」是 13 部 Senvion 3.0 M122（2016–2017 年併網，40.99 MW）；GEM 的「Kalkriese」（40 MW）在 MaStR 對到的是另外 12 部 Vestas V126（2016 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “AW Windenergie Bramsche” is 13 × Senvion 3.0 M122 (connected 2016–2017, 40.99 MW); GEM’s “Kalkriese” (40 MW) matches 12 other units in MaStR, Vestas V126 (2016): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Neuengörs Repowering'):
        ('MaStR 的「Windpark Neuengörs Repowering」是 5 部 Nordex SE N163-6.x（2025 年併網，34 MW）；GEM 的「Bebensee」（33 MW）在 MaStR 對到的是另外 5 部 Nordex Germany N163/6.X（2025 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “Windpark Neuengörs Repowering” is 5 × Nordex SE N163-6.x (connected 2025, 34 MW); GEM’s “Bebensee” (33 MW) matches 5 other units in MaStR, Nordex Germany N163/6.X (2025): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Mahlsdorf 2'):
        ('MaStR 的「Windpark Mahlsdorf 2」是 4 部 Nordex Germany N175-6.8 MW（2025–2026 年併網，27.2 MW）；GEM 的「Illmersdorf」（28.5 MW）在 MaStR 對到的是另外 5 部 Nordex Energy N163-5.7 MW STE（2023–2024 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “Windpark Mahlsdorf 2” is 4 × Nordex Germany N175-6.8 MW (connected 2025–2026, 27.2 MW); GEM’s “Illmersdorf” (28.5 MW) matches 5 other units in MaStR, Nordex Energy N163-5.7 MW STE (2023–2024): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', '4.4-Wind'):
        ('MaStR 的「4.4-Wind」是 4 部 ENERCON E-115 EP3 E3（2023 年併網，16.8 MW）；GEM 的「Vettenbüttel」（17 MW）在 MaStR 對到的是另外 3 部 Nordex Energy N 149 - 5,7 MW（2022 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “4.4-Wind” is 4 × ENERCON E-115 EP3 E3 (connected 2023, 16.8 MW); GEM’s “Vettenbüttel” (17 MW) matches 3 other units in MaStR, Nordex Energy N 149 - 5,7 MW (2022): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Sillerup Repowering II'):
        ('MaStR 的「Sillerup Repowering II」是 3 部 Nordex Energy N133/4.8（2023 年併網，13.2 MW）；GEM 的「Jörl-Stieglund」（13 MW）在 MaStR 對到的是另外 3 部 ENERCON E-115 EP3 E3（2024 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “Sillerup Repowering II” is 3 × Nordex Energy N133/4.8 (connected 2023, 13.2 MW); GEM’s “Jörl-Stieglund” (13 MW) matches 3 other units in MaStR, ENERCON E-115 EP3 E3 (2024): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Sollwitt-Pobüll'):
        ('MaStR 的「Windpark Sollwitt-Pobüll」是 2 部 Siemens Gamesa Renewable Energy SG 6.0 155（2025 年併網，13.2 MW）；GEM 的「Jörl-Stieglund」（13 MW）在 MaStR 對到的是另外 3 部 ENERCON E-115 EP3 E3（2024 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “Windpark Sollwitt-Pobüll” is 2 × Siemens Gamesa Renewable Energy SG 6.0 155 (connected 2025, 13.2 MW); GEM’s “Jörl-Stieglund” (13 MW) matches 3 other units in MaStR, ENERCON E-115 EP3 E3 (2024): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Max Bögl Windpower Winnberg'):
        ('MaStR 的「Max Bögl Windpower Winnberg」是 4 部 Senvion 3.4M104（2010–2015 年併網，12.51 MW）；GEM 的「Zieger」（12 MW）在 MaStR 對到的是另外 5 部 ENERCON E-82 E2（2011 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “Max Bögl Windpower Winnberg” is 4 × Senvion 3.4M104 (connected 2010–2015, 12.51 MW); GEM’s “Zieger” (12 MW) matches 5 other units in MaStR, ENERCON E-82 E2 (2011): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Windpark Baaler Bruch'):
        ('MaStR 的「Windpark Baaler Bruch」是 5 部 ENERCON E92（2017 年併網，11.65 MW）；GEM 的「Kalbeck」（12 MW）在 MaStR 對到的是另外 4 部 ENERCON E115（2017 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “Windpark Baaler Bruch” is 5 × ENERCON E92 (connected 2017, 11.65 MW); GEM’s “Kalbeck” (12 MW) matches 4 other units in MaStR, ENERCON E115 (2017): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'Loehrheide Nord'):
        ('MaStR 的「Loehrheide Nord」是 2 部 Nordex Energy N149（2024 年併網，11.4 MW）；GEM 的「Stepratherheide」（11 MW）在 MaStR 對到的是另外 2 部 Nordex SE N149（2024 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “Loehrheide Nord” is 2 × Nordex Energy N149 (connected 2024, 11.4 MW); GEM’s “Stepratherheide” (11 MW) matches 2 other units in MaStR, Nordex SE N149 (2024): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'WPGEL'):
        ('MaStR 的「WPGEL」是 2 部 Nordex SE Nordex Delta4000 N163/5.X（2025 年併網，11.4 MW）；GEM 的「Stepratherheide」（11 MW）在 MaStR 對到的是另外 2 部 Nordex SE N149（2024 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “WPGEL” is 2 × Nordex SE Nordex Delta4000 N163/5.X (connected 2025, 11.4 MW); GEM’s “Stepratherheide” (11 MW) matches 2 other units in MaStR, Nordex SE N149 (2024): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
    ('DEU', 'WP Uhlhorn'):
        ('MaStR 的「WP Uhlhorn」是 3 部 Vestas V-126（2018 年併網，10.35 MW）；GEM 的「Hengsterholz」（10 MW）在 MaStR 對到的是另外 3 部 Vestas V117-3,45MW（2017 年）：兩批不同的機組，是相鄰的兩座風場',
         'MaStR’s “WP Uhlhorn” is 3 × Vestas V-126 (connected 2018, 10.35 MW); GEM’s “Hengsterholz” (10 MW) matches 3 other units in MaStR, Vestas V117-3,45MW (2017): two different sets of turbines, i.e. neighbouring farms',
         'https://www.marktstammdatenregister.de/MaStR/Datendownload'),
}

GEM_KEEP = {
    ('CHN', "Fujian Zhangpu Liu'Ao Offshore wind farm"):
        (
    '六鰲 D 區（402 MW）與三峽漳浦六鰲二期（400.2 MW）是兩個分別核准的項目：福建省 2023-02 的報導說漳浦六鰲已核准 800 MW，由 D 區與二期組成；二期另於 2021-05-21 核准（閩發改網審能源〔2021〕80 號）。'
    '舊建置把 D 區併進後來刪除的精選「Zhangpu Liu\'ao Phase 1」，整筆消失',
    "Liu'ao area D (402 MW) and CTG's Zhangpu Liu'ao phase 2 (400.2 MW) are two separately approved projects: a Fujian government report of Feb 2023 says Zhangpu Liu'ao has 800 MW approved, made up of area D and phase 2; phase 2 had its own approval on 21 May 2021 (Min Fa Gai Wang Shen Neng Yuan [2021] 80). The old build merged area D into the curated “Zhangpu Liu'ao Phase 1”, later removed, so the project vanished",
    'https://gxt.fj.gov.cn/zwgk/xw/hydt/snhydt/202302/t20230206_6103398.htm'),
    ('THA', 'Hanuman 10 wind farm'):
        ('Energy Absolute 的 Hanuman 10（Banchuan Development 公司，80 MW、32 部西門子歌美颯 2.5 MW，猜也蓬府 Bamnet Narong 縣 Ban Chuan 分區，2019-04-13 商轉）與 EGCO 2016 年的 Chaiyaphum 風場（Subyai，Sap Yai 縣）是兩座；舊建置把它當成「Subyai (Chaiyaphum)」的重複刪掉', 'Energy Absolute’s Hanuman 10 (Banchuan Development Co, 80 MW, 32 Siemens Gamesa 2.5 MW, Ban Chuan subdistrict, Bamnet Narong district, Chaiyaphum; COD 13 Apr 2019) is not EGCO’s 2016 Chaiyaphum Wind Farm (Subyai, Sap Yai district); the old build dropped it as a duplicate of “Subyai (Chaiyaphum)”', 'https://www.adb.org/sites/default/files/project-documents/53255/53255-001-esmr-en_9.pdf'),
    ('JPN', 'Kakegawa wind farm'):
        ('日本風力開發的掛川風力發電所（6 部 Enercon E-82 2,300 kW、13.8 MW，2020 年 7 月）與黑潮風力發電的遠州掛川風力發電所（8 部 Enercon E-82，2009–2011 年）是相鄰的兩座風場（日立 Power Solutions 的 Enercon 國內交貨表分列）',
         'Japan Wind Development’s Kakegawa wind farm (6 × Enercon E-82 2,300 kW, 13.8 MW, July 2020) and Kuroshio Wind Power’s Enshu Kakegawa (8 Enercon E-82, 2009–2011) are two neighbouring farms (listed separately in Hitachi Power Solutions’ Enercon delivery list)',
         'https://www.hitachi-power-solutions.com/energy/wind-solor/wind-power/case/doc/doc_2024.pdf'),
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
    ('CHN', 'Jiangsu Binhai (Datang) Offshore wind farm'):
        ('大唐國信濱海 300 MW 海上風電（廢黃河口至扁擔港之間，3 MW 與 3.3 MW 機組）2019 年 12 月 25 日全部風機併網，是與國家電投濱海南 H3（2020 年底投產）不同的風場；舊建置因名稱都有「濱海」而把它併進濱海南 H3，整座消失', 'Datang-Guoxin’s Binhai 300 MW offshore farm (3 MW and 3.3 MW turbines) had all turbines connected on 25 Dec 2019; it is not SPIC’s Binhai South H3 (in service end-2020), into which the build merged it because both names contain “Binhai”, so the farm vanished', 'https://www.ne21.com/news/show-132982.html'),
    ('CHN', "Fujian Changle 'Outer Ocean' Area I Offshore wind farm"):
        ('長樂外海 I 區是 2021–2023 年後才配置的新場址：I 區（南）2023 年競爭配置由福建投資集團與國投電力聯合體中選、2024-11-30 核准、2025-11 環評公示（16 部 18 MW＋1 部 26 MW，314 MW，離岸 54–61 km）；I 區（北）2024-06 核准給東方電氣的東福新能源（19 部，含 1 部 26 MW 試驗機）。兩案都要等長樂外海集中送出工程，都還沒建成，與 2021 年起營運的三峽長樂外海 A 區（37 部）不是同一座', 'Changle offshore area I is a newer site: I (South) was awarded in the 2023 competitive allocation to the Fujian Investment Group–SDIC Power consortium, approved on 30 Nov 2024 and put to EIA consultation in Nov 2025 (16 x 18 MW + 1 x 26 MW, 314 MW, 54–61 km offshore); I (North) was approved in June 2024 for Dongfang Electric’s Dongfu New Energy (19 turbines incl. a 26 MW test unit). Both wait for the Changle centralised export link and neither is built, so neither is CTG’s Changle area A (37 turbines, operating since 2021)', 'https://www.fuzhou.gov.cn/zgfzzt/shbj/xxgk/spgs/202511/P020251104372076206643.pdf'),
    ('CHN', 'Fujian Putian Pinghaiwan Offshore wind farm'):
        ('莆田平海灣 F 區（三川海上風電，200 MW，2021 年 7 月與石城一起併網）沒有自己的紀錄；GEM 這個場址的 F 期被一起併進精選的平海灣三期而消失', 'Putian Pinghai Bay area F (Sanchuan, 200 MW, connected with Shicheng in July 2021) has no record of its own; GEM’s phase F of this location was merged into the curated Pinghai Bay phase 3 and vanished', 'https://www.court.gov.cn/zixun/xiangqing/497381.html'),
    ('ROU', 'Pantelimon wind farm'):
        ('Pantelimon（Constanța 縣 Pantelimon 鄉，123 MW）與 Crucea Nord（Crucea 鄉，108 MW）是不同的風場（Transelectrica 清單分列）；舊建置把它當成 Crucea Nord 的重複而刪掉',
         'Pantelimon (Pantelimon commune, Constanța, 123 MW) and Crucea Nord (Crucea commune, 108 MW) are different farms (listed separately by Transelectrica); the old build dropped it as a duplicate of Crucea Nord',
         'https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/'),
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
    ('POL', 'Baltica 1'): (
        {'expected': 0, 'note': 'Lost the Dec 2025 CfD auction; no new commissioning date'},
        '清單的 Baltica 1 就是 GEM 的 Baltica I（PGE 的 Elektrownia Wiatrowa Baltica-1，896 MW；對照寫在 tools/build_farms.py 的 PIPE_SAME），GEM 的座標在環評決定所寫的 POM.60.E 海域內，清單的概略座標在海域外約 23 km；2025 年 12 月 17 日差價合約競標落選，原訂 2032 年底商轉以得標為前提，預計年改為未定',
        'The list’s Baltica 1 is GEM’s Baltica I (PGE’s Elektrownia Wiatrowa Baltica-1, 896 MW; mapped in PIPE_SAME in tools/build_farms.py); GEM’s point lies inside sea area POM.60.E named in the environmental decision, while the list’s approximate point is about 23 km outside it; it lost the CfD auction of 17 December 2025, and the end-2032 target depended on winning, so the expected year becomes unknown',
        'https://www.gov.pl/attachment/d17bdc47-d1be-49f9-a810-2949be7213b4'),
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
