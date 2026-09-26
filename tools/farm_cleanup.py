"""第一階段資料清理（2026 年 9 月逐筆查證）：tools/build_farms.py 合併完各來源後套用的明確規則。

每條規則用（國別, 名稱, 來源）指定剛好一筆紀錄。名稱是 wind_farms.json 裡的 name（含 GEM 的分期標籤）；
來源 0 = 精選、1 = WRI GPPD、2 = GEM、3 = 2026 整理清單。規則對不到紀錄、或對到多筆時建置會中止：
上游資料改版後要重新檢查這裡的每一條。
    dup   與 keep 指定的另一筆是同一座風場 → 刪除；保留者沒有業主或分期時搬過去（分期合計與保留者容量相差 5% 內才搬）
    drop  從未建成、查無此場，或已由逐場資料涵蓋的彙總 → 刪除
    fix   修正欄位：rename（改名）、zhname、lat、lon、mw、year、st、end、owner、ph、note（note=True 表示把理由寫進卡片的註記）；
          改了座標就不再標「概略位置」（approx=True 則仍標）；補上年份或改成規劃中就不再標「年份不詳」；
          改了容量而舊分期加總對不上時清掉分期
GEM_KEEP 列出不可被當成重複的 GEM 專案（例：與精選風場名稱相近、實為另一座）。
每條規則都附中英文理由與來源連結（url=None 表示依資料本身比對：同名、同容量、同地點），
build_farms.py 會把套用結果寫成 docs/data-cleanup.md 與 docs/data-cleanup.en.md。
"""
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
C, P, G, N = 0, 1, 2, 3
SRC_ZH = ['精選', 'WRI GPPD', 'GEM', '2026 整理清單']
SRC_EN = ['curated', 'WRI GPPD', 'GEM', '2026 compilation']
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


PORTLAND_ALL = ('Portland (PWEP) Wind Energy Project · Cape Bridgewater wind farm, Cape Nelson South wind farm, '
                'Cape Sir William Grant/Cape Nelson North, Codrington wind farm')

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
    dup('AUS', 'Yambuk wind farm', G, ('Portland (PWEP) Wind Energy Project · Yambuk wind farm', G),
        'GEM 重複收錄；Yambuk（30 MW）是 Portland 風電計畫第一期，2007 年商轉',
        'Listed twice in GEM; Yambuk (30 MW) is stage 1 of the Portland Wind Project, commissioned in 2007', PORTLAND),
    fix('AUS', PORTLAND_ALL, G, '扣除另有精選紀錄的 Codrington（18.2 MW，2001）：Cape Bridgewater 58 MW（2008）、Cape Nelson South 44 MW（2009）、'
        'Cape Sir William Grant 47 MW（2015）',
        'Codrington (18.2 MW, 2001) has its own curated record and is taken out: Cape Bridgewater 58 MW (2008), '
        'Cape Nelson South 44 MW (2009), Cape Sir William Grant 47 MW (2015)', PORTLAND,
        rename=PORTLAND_ALL.replace(', Codrington wind farm', ''), mw=149, year=2008, ph=[[2008, 58], [2009, 44], [2015, 47]]),
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
    dup('USA', 'Criterion', P, ('Criterion wind farm · 1', G),
        'WRI GPPD 舊資料；GEM 有同一座風場（2023 年除役，正在汰換）', 'Old WRI GPPD record; GEM has the same farm (retired in 2023, being repowered)'),
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
    dup('PRT', 'Chaminé wind farm', G, ('Chaminé', P), '同一座風場；GEM 的概略座標是塞圖巴爾市，實際在錫尼什',
        'Same farm; the approximate GEM point is Setúbal city, the farm is in Sines', 'https://www.thewindpower.net/windfarm_en_2570_chamine.php'),
    dup('PRT', 'Felgar wind farm', G, ('Felgar', P), '同一座風場；GEM 的概略座標是布拉干薩市，實際在 Torre de Moncorvo',
        'Same farm; the approximate GEM point is Bragança city, the farm is in Torre de Moncorvo',
        'https://www.thewindpower.net/windfarm_en_2641_felgar.php'),
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
    drop('FIN', 'Pohjoinen wind farm', G, '就是挪威的 Sørfjord 風場（同為 99 MW、2020 年、Fortum 持股、座標相同，挪威那筆已列出），國別被誤植為芬蘭',
         'This is Norway’s Sørfjord farm (same 99 MW, 2020, Fortum-owned, identical coordinates; listed under Norway) filed under Finland'),
    dup('FIN', 'Kemi Ajos', C, ('Ajos Retrofit wind farm', G),
        '同一場址；GEM 有完整沿革（2008 年的原機組 27 MW 到 2016 年，之後汰換為 43 MW），保留 GEM 的兩筆',
        'Same site; GEM has the fuller history (the original 27 MW from 2008 to 2016, then repowered to 43 MW), so its two records are kept'),
    dup('TUR', 'Gökçedag wind farm', G, ('Gökçedağ (Osmaniye)', C), '同一座風場（又稱 Bahçe 風場）', 'Same farm (also called the Bahçe Wind Farm)',
        'https://en.wikipedia.org/wiki/Bah%C3%A7e_Wind_Farm'),
    fix('TUR', 'Gökçedağ (Osmaniye)', C, '座標改到 Bahçe 與 Hasanbeyli 之間的 Gökçedağ 稜線（原座標偏離約 30 km）',
        'Point moved to the Gökçedağ ridge between Bahçe and Hasanbeyli (the old one was about 30 km off)',
        'https://www.openstreetmap.org/relation/12270025', lat=37.15, lon=36.61),
    # ------------------------------------------------ Thailand, Philippines, Iran
    drop('THA', 'Jhimpir Power (Energy Absolute) wind farm', G,
         '不存在：Jhimpir 在巴基斯坦，Energy Absolute 在泰國沒有 600 MW 風場（它在猜也蓬的 Hanuman 各場另有紀錄）',
         'Does not exist: Jhimpir is in Pakistan and Energy Absolute has no 600 MW farm in Thailand (its Hanuman farms in Chaiyaphum are listed separately)',
         'https://www.energyabsolute.co.th/en/our-businesses/renewable-business/wind-power-plants'),
    fix('THA', 'Subyai (Chaiyaphum)', C, 'EGCO 的 Chaiyaphum 風場：80 MW（32 × 2.5 MW），2016 年 12 月商轉；業主名稱原本拼錯',
        'EGCO’s Chaiyaphum Wind Farm: 80 MW (32 × 2.5 MW), commercial operation December 2016; the owner name was misspelt',
        'https://www.bangkokpost.com/business/1163661/egco-kicks-off-latest-wind-farm', mw=80, owner='EGCO'),
    dup('PHL', 'Pagudpud wind farm', G, ('Balaoi & Caunayan', C), 'Bayog Wind Power 是 ACEN 這座 160 MW 風場的專案公司，同一座',
        'Bayog Wind Power is ACEN’s project company for this 160 MW farm: same farm',
        'https://business.inquirer.net/323245/acen-shells-out-p3b-to-partly-fund-phs-biggest-windmill-farm'),
    dup('PHL', 'Pagudpu wind farm', G, ('Balaoi & Caunayan', C), '同一座（GEM 把第一階段 80 MW 另列一筆）',
        'Same farm (GEM lists its first 80 MW stage separately)', 'https://www.gem.wiki/Pagudpu_wind_farm'),
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
    dup('VNM', 'Phuoc wind farm', G, ('Phuoc Minh Revn wind farm', G), '應是同一座 Phước Minh 風場（27.2 MW，2021）',
        'Most likely the same Phước Minh farm (27.2 MW, 2021)', MOIT),
    dup('VNM', 'Dong Hai 1 Phase 2 (Bac Lieu, Bac Phuong)', C, ('Dong Hai 1 Offshore wind farm', G),
        '薄遼的東海1號（兩期各 50 MW）就是 GEM 這筆', 'Đông Hải 1 in Bạc Liêu (two 50 MW phases) is this GEM record', MOIT),
    fix('VNM', 'Dong Hai 1 Phase 1 (Tra Vinh, Trungnam)', C, '茶榮的東海1號是獨立的風場，不是薄遼東海1號的一期',
        'The Trà Vinh Đông Hải 1 is a separate farm, not a phase of the Bạc Liêu one', MOIT,
        rename='Dong Hai 1 – Tra Vinh (Trungnam)', zhname='東海1號（茶榮）'),
    drop('VNM', 'Bến Tre 5 Thạnh Hải Offshore wind farm', G, '120 MW 是四期（各 30 MW）的全部規劃；只證實一、二期完工，已以精選紀錄列出',
         '120 MW is all four planned 30 MW phases; only phases 1 and 2 are confirmed built, and they are listed as curated records',
         'https://dongkhoi.baovinhlong.vn/tinh-hinh-van-hanh-cac-nha-may-dien-gio-tren-dia-ban-tinh-ben-tre-07092022-a105006.html'),
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
]

# 不可當成精選風場重複的 GEM 專案（GEM 專案名稱，不含分期標籤）
GEM_KEEP = {
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

FIELDS = {'rename': 0, 'zhname': 1, 'lat': 3, 'lon': 4, 'mw': 5, 'year': 6, 'st': 8, 'end': 9, 'owner': 10, 'ph': 14}
LABEL_ZH = {'rename': '名稱', 'zhname': '中文名', 'lat': '座標', 'lon': '座標', 'mw': '容量', 'year': '年份', 'st': '狀態',
            'end': '除役年', 'owner': '業主', 'ph': '分期'}
LABEL_EN = {'rename': 'name', 'zhname': 'Chinese name', 'lat': 'location', 'lon': 'location', 'mw': 'capacity', 'year': 'year',
            'st': 'status', 'end': 'end year', 'owner': 'owner', 'ph': 'phases'}


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
        raise SystemExit("farm_cleanup: rules no longer match the data (recheck them against the new release):\n  " + "\n  ".join(errors))
    return [r for r in rows if id(r) not in gone], log


def _fmt(x):
    return f"{x:,.1f}".rstrip('0').rstrip('.') if isinstance(x, float) else f"{x:,}"


def write_docs(log, countries, out_dir=ROOT / 'docs'):
    """把套用紀錄寫成 docs/data-cleanup.md（中文）與 docs/data-cleanup.en.md。"""
    names = {c['iso']: (c.get('zh') or c['name'], c['name']) for c in countries}
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
        L += ['## ' + ('不當成重複的 GEM 專案' if zh else 'GEM projects kept apart'), '',
              '| ' + ('專案 | 理由 | 出處' if zh else 'Project | Reason | Source link') + ' |', '|---|---|---|']
        for (iso, name), (rz, re_, url) in GEM_KEEP.items():
            L.append(f"| {name} ({iso}) | {rz if zh else re_} | [{'連結' if zh else 'link'}]({url}) |")
        L.append('')
        (out_dir / ('data-cleanup.md' if zh else 'data-cleanup.en.md')).write_text('\n'.join(L), encoding='utf-8')


def summary(log):
    return {"asof": ASOF, "rules": len(log), "removed": sum(1 for c, *_ in log if c['act'] != 'fix'),
            "fixed": sum(1 for c, *_ in log if c['act'] == 'fix'), "doc": "docs/data-cleanup.md"}


if __name__ == '__main__':
    print(len(RULES), 'rules;', len(GEM_KEEP), 'GEM projects kept apart')
    print(json.dumps(summary([(c, [0] * 17, None) for c in RULES]), ensure_ascii=False))
