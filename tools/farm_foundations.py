"""離岸風場水下基礎型式：逐場對照表（逐步收集；見 ROADMAP「使用者 2026-09 提出的新規劃」第 2 項）。

tools/build_foundations.py 讀這張表，產生 data/global/foundations.json（地球儀的「水下基礎」圖層）與
docs/foundations.md、docs/foundations.en.md。

每一列用（國別, 風場名稱）指定 wind_farms.json 裡剛好一座離岸或浮動式風場，名稱要完全一致。
    t      型式代碼（見 TYPES）；混合型用 'mx'，並在 parts 列出各型式的座數
    ospar  對應的 OSPAR Offshore Renewables 2024 紀錄（data/global/sources/ospar_offshore_renewables_2024.csv）
    url    第二來源：OSPAR 沒有具體型式、或與實際建成的不同時必填，並在 zh／en 說明
    sub    細分型式（吸力桶、單柱式…，見 SUBS）
    zh/en  顯示在風場卡片的註記
建置時會檢查：風場存在且是離岸或浮動式；引用 OSPAR 時，OSPAR 的值要與 t 相符，不相符（或 OSPAR 沒有具體型式）就必須
有 url 與理由；同一座風場不可出現兩次。

第 1 步（2026-09，F）：OSPAR 涵蓋的北海與東北大西洋。OSPAR 的「營運中」紀錄逐筆比對過名稱、位置與容量；
德國的紀錄不可靠（10 筆只寫「單樁／三腳／三樁／套管／重力式／其他」任一種，Merkur、Veja Mate、Trianel Borkum II 與
alpha ventus 則與建成紀錄不符），所以德國每一座都改以德文維基百科資訊框的「Gründung」（附建造紀錄）為準；
Hornsea One 西區也與建成紀錄不符。
第 2 步（2026-09，F2）：歐洲其他風場，包括 OSPAR 範圍以外的波羅的海、地中海與艾瑟爾湖，以及 OSPAR 2024 之後才完工的風場。
每一座都附出處（開發商、施工廠商、產業新聞、政府文件或維基百科，原文逐筆核對過）。OSPAR 對 2024 年以後完工的風場只有
核准階段的設計（Current Status 是 authorised 等，不是 operational 或 decommissioned），設計可能改變，所以這種紀錄一定要再附施工紀錄，建置會檢查。
沒把握的不列（見 EXCLUDED），不臆測。
"""

ASOF = '2026-09'
OSPAR_URL = 'https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/'
DE = 'https://de.wikipedia.org/wiki/'
EN = 'https://en.wikipedia.org/wiki/'
FR = 'https://fr.wikipedia.org/wiki/'

# 型式：代碼 → (中文, English, 地圖色組)。地圖上多於三種色相時分不清（見 globe.js 的 FD_GROUPS），
# 所以依結構歸成四組：單樁、鋼構框架（套管、三腳、三樁）、浮動式、其他固定式（重力式、高樁承台、圍堰式、混合）。
# 圍堰式：近岸淺水處用鋼板樁（或鋼管樁加板樁）圍成一圈、填砂，上面做混凝土基座，等於把陸上風機的基礎做在水中
TYPES = {
    'mp': ('單樁', 'Monopile', 'mp'),
    'jk': ('套管式', 'Jacket', 'frame'),
    'tp': ('三腳架', 'Tripod', 'frame'),
    'tl': ('三樁', 'Tripile', 'frame'),
    'gb': ('重力式', 'Gravity-based', 'other'),
    'pc': ('高樁承台', 'High-rise pile cap', 'other'),
    'cf': ('圍堰式', 'Cofferdam', 'other'),
    'mx': ('混合', 'Mixed', 'other'),
    'fl': ('浮動式', 'Floating', 'fl'),
}
SUBS = {
    'sb': ('吸力桶', 'suction bucket'),
    'spar': ('單柱式', 'spar'),
    'semi': ('半潛式', 'semi-submersible'),
    'barge': ('駁船式', 'barge'),
    'tlp': ('張力腳', 'tension-leg platform'),
}


def F(iso, name, t, ospar=(), url=None, sub=None, parts=None, zh='', en='', step=1):
    return dict(iso=iso, name=name, t=t, ospar=list(ospar), url=url, sub=sub, parts=parts, zh=zh, en=en, step=step)


def F2(*a, **k):
    """第 2 步加入的列"""
    return F(*a, step=2, **k)


GER = ('OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準', 'OSPAR says “any of these”, so German Wikipedia (with construction records) is used')

FOUNDATIONS = [
    # ------------------------------------------------ Belgium
    F('BEL', 'Belwind I (Bligh Bank)', 'mp', ['Be003']),
    F('BEL', 'Nobelwind (Bligh Bank II)', 'mp', ['Be009']),
    F('BEL', 'Thornton Bank I', 'gb', ['Be001'], EN + 'Thorntonbank_Wind_Farm',
      zh='第一期 6 部風機坐在混凝土重力式基礎上；OSPAR 把三期合成一筆「重力式／套管」',
      en='The six phase-1 turbines stand on concrete gravity bases; OSPAR lists the three phases together as “gravity-based/jacket”'),
    F('BEL', 'Thornton Bank II', 'jk', ['Be001'], EN + 'Thorntonbank_Wind_Farm',
      zh='第二、三期共 48 部風機用鋼製套管基礎（OWEC 設計）', en='Phases 2 and 3 (48 turbines) use steel jackets designed by OWEC'),
    F('BEL', 'Thornton Bank III', 'jk', ['Be001'], EN + 'Thorntonbank_Wind_Farm',
      zh='第二、三期共 48 部風機用鋼製套管基礎（OWEC 設計）', en='Phases 2 and 3 (48 turbines) use steel jackets designed by OWEC'),
    F('BEL', 'Norther', 'mp', ['Be005']),
    F('BEL', 'Northwester 2', 'mp', ['Be008']),
    F('BEL', 'Northwind', 'mp', ['Be002']),
    F('BEL', 'Rentel', 'mp', ['Be004']),
    F('BEL', 'SeaMade - Mermaid', 'mp', ['Be007']),
    F('BEL', 'SeaMade - Seastar', 'mp', ['Be006']),
    # ------------------------------------------------ Denmark（北海與卡特加特海峽；波羅的海不在 OSPAR 範圍）
    F('DNK', 'Horns Rev 1', 'mp', ['DK02']),
    F('DNK', 'Horns Rev 2', 'mp', ['DK05']),
    F('DNK', 'Horns Rev 3', 'mp', ['DK24']),
    F('DNK', 'Rønland', 'gb', ['DK04']),
    F('DNK', 'Nissum Bredning Vind', 'gb', ['DK23']),
    F('DNK', 'Anholt', 'mp', ['DK14']),
    F('DNK', 'Vesterhav Syd', 'mp', ['DK26']),
    F('DNK', 'Vesterhav Nord', 'mp', ['DK27']),
    # ------------------------------------------------ France
    F('FRA', 'Saint-Nazaire (Banc de Guérande)', 'mp', ['FR03'], FR + 'Parc_%C3%A9olien_en_mer_de_Saint-Nazaire'),
    F('FRA', 'Saint-Brieuc', 'jk', ['FR02']),
    F('FRA', 'Fécamp', 'gb', ['FR04'], FR + 'Parc_%C3%A9olien_en_mer_de_F%C3%A9camp',
      zh='71 座混凝土重力式基礎（每座約 5,000 噸）', en='71 concrete gravity bases (about 5,000 t each)'),
    F('FRA', 'Provence Grand Large', 'fl', ['FR11']),
    # ------------------------------------------------ Germany（北海；每一座以德文維基百科為準）
    F('DEU', 'alpha ventus', 'mx', ['DE001'], DE + 'Offshore-Windpark_alpha_ventus', parts=[['tp', 6], ['jk', 6]],
      zh='6 部三腳架、6 部套管；OSPAR 誤列為「單樁／套管」', en='6 tripods and 6 jackets; OSPAR wrongly lists “monopile/jacket”'),
    F('DEU', 'DanTysk', 'mp', ['DE002'], DE + 'Offshore-Windpark_DanTysk'),
    F('DEU', 'Borkum Riffgrund 1', 'mp', ['DE004'], DE + 'Offshore-Windpark_Borkum_Riffgrund',
      zh='77 座單樁，另有 1 座吸力桶套管（試驗）', en='77 monopiles plus one suction-bucket jacket (a trial)'),
    F('DEU', 'Borkum Riffgrund 2', 'mx', ['DE028'], DE + 'Offshore-Windpark_Borkum_Riffgrund', parts=[['mp', 36], ['jk', 20]], sub='sb',
      zh='36 座單樁、20 座吸力桶套管', en='36 monopiles and 20 suction-bucket jackets'),
    F('DEU', 'Amrumbank West', 'mp', ['DE005'], DE + 'Offshore-Windpark_Amrumbank_West', zh=GER[0], en=GER[1]),
    F('DEU', 'Nordsee Ost', 'jk', ['DE006'], DE + 'Offshore-Windpark_Nordsee_Ost'),
    F('DEU', 'Butendiek', 'mp', ['DE008'], DE + 'Offshore-Windpark_Butendiek'),
    F('DEU', 'Global Tech I', 'tp', ['DE009'], DE + 'Offshore-Windpark_Global_Tech_I'),
    F('DEU', 'Sandbank', 'mp', ['DE012'], DE + 'Offshore-Windpark_Sandbank', zh=GER[0], en=GER[1]),
    F('DEU', 'Gode Wind 1', 'mp', ['DE013'], DE + 'Offshore-Windpark_Gode_Wind_I', zh=GER[0], en=GER[1]),
    F('DEU', 'Gode Wind 2', 'mp', ['DE032'], DE + 'Offshore-Windpark_Gode_Wind_II'),
    F('DEU', 'Gode Wind 3', 'mp', ['DE074'], DE + 'Offshore-Windpark_Gode_Wind_III'),
    F('DEU', 'EnBW He Dreiht', 'mp', ['DE017'], DE + 'Offshore-Windpark_He_dreiht', zh=GER[0], en=GER[1]),
    F('DEU', 'Nordergründe', 'mp', ['DE018'], DE + 'Offshore-Windpark_Nordergr%C3%BCnde', zh=GER[0], en=GER[1]),
    F('DEU', 'Riffgat', 'mp', ['DE019'], DE + 'Offshore-Windpark_Riffgat', zh=GER[0], en=GER[1]),
    F('DEU', 'BARD Offshore 1', 'tl', ['DE021'], DE + 'BARD_Offshore_1'),
    F('DEU', 'Deutsche Bucht', 'mp', ['DE022'], DE + 'Offshore-Windpark_Deutsche_Bucht'),
    F('DEU', 'Merkur', 'mp', ['DE024'], DE + 'Offshore-Windpark_Merkur',
      zh='66 座單樁；OSPAR 列為三腳架，與建成紀錄不符', en='66 monopiles; OSPAR lists tripods, which does not match what was built'),
    F('DEU', 'Trianel Windpark Borkum I', 'tp', ['DE025a'], DE + 'Trianel_Windpark_Borkum'),
    F('DEU', 'Trianel Windpark Borkum II', 'mp', ['DE025b'], DE + 'Trianel_Windpark_Borkum',
      zh='第二期用單樁；OSPAR 列為三腳架／三樁', en='Phase 2 uses monopiles; OSPAR lists tripod/tripile'),
    F('DEU', 'Nordsee One', 'mp', ['DE026'], DE + 'Offshore-Windpark_Nordsee_One', zh=GER[0], en=GER[1]),
    F('DEU', 'Kaskasi', 'mp', ['DE031'], DE + 'Offshore-Windpark_Kaskasi'),
    F('DEU', 'Veja Mate', 'mp', ['DE034'], DE + 'Offshore-Windpark_Veja_Mate',
      zh='67 座單樁（直徑 7.8 m）；OSPAR 列為三腳架／三樁', en='67 monopiles (7.8 m diameter); OSPAR lists tripod/tripile'),
    F('DEU', 'Meerwind Süd/Ost', 'mp', ['DE036'], DE + 'Offshore-Windpark_Meerwind', zh=GER[0], en=GER[1]),
    F('DEU', 'Albatros', 'mp', ['DE037'], DE + 'Offshore-Windpark_Albatros', zh=GER[0], en=GER[1]),
    # ------------------------------------------------ Netherlands
    F('NLD', 'Egmond aan Zee (OWEZ)', 'mp', ['NL001']),
    F('NLD', 'Prinses Amalia', 'mp', ['NL002']),
    F('NLD', 'Luchterduinen', 'mp', ['NL003']),
    F('NLD', 'Gemini', 'mp', ['NL004']),
    F('NLD', 'Borssele I & II', 'mp', ['NL005']),
    F('NLD', 'Borssele III & IV (Blauwwind)', 'mp', ['NL006']),
    F('NLD', 'Hollandse Kust Zuid I & II', 'mp', ['NL007']),
    F('NLD', 'Hollandse Kust Zuid III & IV', 'mp', ['NL007']),
    F('NLD', 'Hollandse Kust Noord', 'mp', ['NL008']),
    # ------------------------------------------------ Norway
    F('NOR', 'Hywind Demo (Karmøy)', 'fl', ['NO001'], EN + 'Hywind', sub='spar',
      zh='2019 年起改名 Unitech Zefyros（OSPAR 用此名）', en='Renamed Unitech Zefyros in 2019 (the name OSPAR uses)'),
    F('NOR', 'Hywind Tampen', 'fl', ['NO010'], EN + 'Hywind_Tampen', sub='spar', zh='混凝土單柱式浮台', en='Concrete spar buoys'),
    F('NOR', 'TetraSpar Demonstrator (METCentre)', 'fl', ['NO018']),
    # ------------------------------------------------ United Kingdom
    F('GBR', 'Barrow', 'mp', ['UK002']),
    F('GBR', 'Beatrice', 'jk', ['UK003']),
    F('GBR', 'Blyth Offshore', 'mp', ['UK007']),
    F('GBR', 'Blyth Offshore Demonstrator', 'gb', ['UK005']),
    F('GBR', 'Burbo Bank', 'mp', ['UK013']),
    F('GBR', 'Burbo Bank Extension', 'mp', ['UK012']),
    F('GBR', 'Dudgeon', 'mp', ['UK019']),
    F('GBR', 'East Anglia ONE', 'jk', ['UK022']),
    F('GBR', 'European Offshore Wind Deployment Centre (Aberdeen)', 'jk', ['UK001'], EN + 'European_Offshore_Wind_Deployment_Centre', sub='sb',
      zh='11 座吸力桶套管', en='11 suction-bucket jackets'),
    F('GBR', 'Galloper', 'mp', ['UK034']),
    F('GBR', 'Greater Gabbard', 'mp', ['UK036']),
    F('GBR', 'Gunfleet Sands 1 & 2', 'mp', ['UK038', 'UK039']),
    F('GBR', 'Gunfleet Sands 3 Demonstration', 'mp', ['UK037']),
    F('GBR', 'Gwynt y Môr', 'mp', ['UK040']),
    F('GBR', 'Hornsea One', 'mp', ['UK043', 'UK044', 'UK045'], 'https://www.offshorewind.biz/2019/04/26/hornsea-one-foundations-all-in-place/',
      zh='174 座全為單樁（2019 年 4 月完工）；OSPAR 把西區列為套管，與建成紀錄不符（DONG 2015 年曾規劃三分之一用吸力桶基礎）',
      en='All 174 are monopiles (completed April 2019); OSPAR lists the western part as jackets, which does not match what was built (in 2015 DONG planned suction buckets for a third of the turbines)'),
    F('GBR', 'Hornsea Two', 'mp', ['UK046', 'UK046A', 'UK046B']),
    F('GBR', 'Humber Gateway', 'mp', ['UK049']),
    F('GBR', 'Kentish Flats', 'mp', ['UK057']),
    F('GBR', 'Kentish Flats Extension', 'mp', ['UK056']),
    F('GBR', 'Levenmouth Demonstration (Methil)', 'jk', ['UK064']),
    F('GBR', 'Lincs', 'mp', ['UK059']),
    F('GBR', 'London Array', 'mp', ['UK060']),
    F('GBR', 'Lynn and Inner Dowsing', 'mp', ['UK061', 'UK052']),
    F('GBR', 'Moray East', 'jk', ['UK141']),
    F('GBR', 'North Hoyle', 'mp', ['UK074']),
    F('GBR', 'Ormonde', 'jk', ['UK076']),
    F('GBR', 'Race Bank', 'mp', ['UK079']),
    F('GBR', 'Rampion', 'mp', ['UK080']),
    F('GBR', 'Rhyl Flats', 'mp', ['UK082']),
    F('GBR', 'Robin Rigg', 'mp', ['UK083', 'UK084']),
    F('GBR', 'Scroby Sands', 'mp', ['UK087']),
    F('GBR', 'Sheringham Shoal', 'mp', ['UK092']),
    F('GBR', 'Teesside (Redcar)', 'mp', ['UK102']),
    F('GBR', 'Thanet', 'mp', ['UK104']),
    F('GBR', 'Triton Knoll', 'mp', ['UK106']),
    F('GBR', 'Walney 1 & 2', 'mp', ['UK107', 'UK108']),
    F('GBR', 'Walney Extension', 'mp', ['UK109', 'UK110']),
    F('GBR', 'West of Duddon Sands', 'mp', ['UK113']),
    F('GBR', 'Westermost Rough', 'mp', ['UK114']),

    # ================================================ 第 2 步（2026-09）：歐洲其他風場（波羅的海、地中海、艾瑟爾湖）與 OSPAR 2024 之後完工的風場
    # ------------------------------------------------ Germany
    F2('DEU', 'Borkum Riffgrund 3', 'mp', ['DE130'], 'https://www.jandenul.com/news/jan-de-nul-kicks-orsteds-borkum-riffgrund-3-offshore-wind-farm-construction',
       zh='83 座單樁', en='83 monopiles'),
    F2('DEU', 'Hohe See', 'mp', ['DE011'], 'https://www.offshorewind.biz/2019/04/11/hohe-see-albatros-foundations-stand-complete/',
       zh='OSPAR 只寫「任一種」、德文維基百科也沒寫；施工新聞：與相鄰的 Albatros 共 87 部風機全用單樁',
       en='OSPAR says “any of these” and German Wikipedia does not say; construction news: all 87 turbines of Hohe See and neighbouring Albatros stand on monopiles'),
    F2('DEU', 'Hooksiel (BARD test turbine)', 'tl', url='https://de.wikipedia.org/wiki/Tripile_(Gr%C3%BCndung)',
       zh='BARD 的三樁試驗機（2016 年拆除）', en='BARD’s tripile pilot turbine (dismantled in 2016)'),
    F2('DEU', 'EnBW Baltic 1', 'mp', url='https://www.enbw.com/company/topics/wind-power/offshore-wind-farm-baltic-1/'),
    F2('DEU', 'EnBW Baltic 2', 'mx', url='https://www.enbw.com/company/topics/wind-power/offshore-wind-farm-baltic-2/', parts=[['mp', 39], ['jk', 41]],
       zh='水深約 35 m 以內用單樁（39 座），更深處用套管（41 座）', en='Monopiles in water up to about 35 m deep (39) and jackets beyond (41)'),
    F2('DEU', 'Wikinger', 'jk', url='https://www.offshorewind.biz/2017/10/26/all-wikinger-turbines-up/', zh='70 座套管', en='70 jackets'),
    F2('DEU', 'Arkona', 'mp', url='https://www.offshorewind.biz/2017/11/09/all-monopiles-installed-at-arkona-offshore-wind-farm-tps-next/',
       zh='60 座單樁', en='60 monopiles'),
    F2('DEU', 'Arcadis Ost 1', 'mp', url='https://parkwind.eu/news/ao1-monopile-installation-completed', zh='XXL 單樁', en='XXL monopiles'),
    F2('DEU', 'Baltic Eagle', 'mp', url='https://www.energyglobal.com/wind/12092023/iberdrola-completes-installation-of-all-50-monopiles-at-baltic-eagle-offshore-wind-farm/',
       zh='50 座單樁', en='50 monopiles'),
    F2('DEU', 'Ems Emden (Enercon E-112 nearshore)', 'cf', url='https://w3.windmesse.de/windenergie/news/1004-erstes-nearshore-projekt-mit-grosswindanlage',
       zh='堤腳外約 40 m 的河口水域中，在鋼板樁圍堰內澆築、由 40 支鋼管樁支撐的混凝土基座；聯邦能源登錄（MaStR）把它列為陸域風機',
       en='In the estuary about 40 m off the dike toe: a concrete base on 40 steel tube piles, cast inside a sheet-pile wall; the federal '
          'energy register (MaStR) lists it as an onshore turbine'),
    F2('DEU', 'Breitling (Rostock)', 'cf', url='https://w3.windmesse.de/windenergie/news/2284-erste-offshore-turbine-in-deutschland-errichtet',
       zh='水深約 2 m 處以鋼板樁圍成、用砂與混凝土築成的基座（直徑 18 m）；聯邦能源登錄（MaStR）把它列為陸域風機',
       en='A sheet-pile ring in about 2 m of water, built up with sand and concrete (18 m across); the federal energy register (MaStR) '
          'lists it as an onshore turbine'),
    # ------------------------------------------------ Netherlands（艾瑟爾湖與 Borssele 試驗場）、Belgium
    F2('NLD', 'Windpark Fryslân', 'mp', url='https://www.offshorewind.biz/2020/11/09/windpark-fryslan-monopiles-halfway-there/',
       zh='89 座單樁（艾瑟爾湖）', en='89 monopiles (IJsselmeer)'),
    F2('NLD', 'Westermeerwind', 'mp', url='https://www.offshore-energy.biz/westermeerwind-foundations-in-place/',
       zh='48 座單樁（艾瑟爾湖）', en='48 monopiles (IJsselmeer)'),
    F2('NLD', 'Windplanblauw offshore wind farm', 'cf',
       url='https://windpowernl.com/2024/08/30/festive-opening-of-dutch-on-and-nearshore-wind-project-windplanblauw/',
       zh='湖中 24 部風機：每座以 22 支鋼管樁（間以板樁）圍成一圈、填砂，上面是直徑約 20 m 的混凝土基座',
       en='The 24 turbines in the lake: each stands on a ring of 22 steel tube piles (with sheet piles between them), filled with sand and '
          'topped by a concrete base about 20 m across'),
    F2('NLD', 'Irene Vorrink (Dronten)', 'mp',
       url='https://windpowernl.com/2022/02/28/vattenfall-starts-decommissioning-of-one-of-the-oldest-operational-dutch-wind-farms/',
       zh='28 座鋼製單樁，立在堤外的水中（2022 年拆除）', en='28 steel monopiles in the water off the dike (dismantled in 2022)'),
    F2('NLD', 'Borssele V (Two Towers innovation site)', 'mp',
       url='https://www.offshore-energy.biz/the-borssele-series-innovation-site-for-the-ever-evolving-industry/',
       zh='2 座單樁；其中一座試用 Slip Joint（單樁與轉接段以錐面套接）', en='2 monopiles; one tests a Slip Joint (a conical connection between the monopile and transition piece)'),
    F2('BEL', 'Belwind Alstom Haliade demonstrator', 'jk', ['Be003'],
       'https://www.offshorewind.biz/2013/11/20/belgium-alstom-installs-6mw-haliade-offshore-wind-turbine',
       zh='61 m 高的套管，架在預先打入海床的樁上（2013 年）；OSPAR 把它併在 Belwind 一期（單樁）裡',
       en='A 61 m jacket set on pre-driven piles (2013); OSPAR merges it into Belwind phase 1 (monopiles)'),
    # ------------------------------------------------ United Kingdom
    F2('GBR', 'Seagreen Phase 1', 'jk', ['UK089'], 'https://www.sserenewables.com/news-and-views/2023/04/final-jacket-foundation-installed-on-seagreen/', sub='sb',
       zh='114 座吸力桶套管；OSPAR 這筆沒有寫型式', en='114 suction-bucket jackets; OSPAR’s record gives no type'),
    F2('GBR', 'Moray West', 'mp', ['UK142'], 'https://www.moraywest.com/news/moray-west-celebrates-final-monopile-installation',
       zh='全部為單樁（2024 年 4 月裝完）；OSPAR 列為套管，與建成紀錄不符', en='All monopiles (completed April 2024); OSPAR lists jackets, which does not match what was built'),
    F2('GBR', 'Neart na Gaoithe', 'jk', ['UK068'], 'https://www.saipem.com/en/media/press-releases/2023-10-24/saipem-successfully-completed-installation-works-scotland-neart-na',
       zh='54 座套管', en='54 jackets'),
    F2('GBR', 'Dogger Bank A', 'mp', ['UK014'], 'https://doggerbank.com/construction/foundation-installation-campaign-begins-on-dogger-bank-b/',
       zh='95 座單樁（附轉接段）', en='95 monopiles with transition pieces'),
    F2('GBR', 'Sofia', 'mp', ['UK138'], 'https://www.rwe.com/en/press/rwe-offshore-wind-gmbh/2025-07-15-sofia-offshore-wind-farm-completes-installation-of-foundations/',
       zh='100 座加長單樁（不另加轉接段）', en='100 extended monopiles (no separate transition piece)'),
    # ------------------------------------------------ France, Ireland, Italy, Spain
    F2('FRA', "Îles d'Yeu et de Noirmoutier", 'mp', ['FR06'], 'https://www.deme-group.com/news/all-foundations-installed-iles-dyeu-and-noirmoutier-offshore-wind-farm',
       zh='61 座鑽孔植入的單樁', en='61 drilled monopiles'),
    F2('FRA', 'Calvados (Courseulles-sur-Mer)', 'mp', ['FR01'],
       'https://www.meretmarine.com/fr/energies-marines/parc-eolien-du-calvados-le-seaway-strashnov-est-arrive-au-havre-pour-installer-des-monopieux',
       zh='64 座單樁（興建中）', en='64 monopiles (under construction)'),
    F2('IRL', 'Arklow Bank Phase 1', 'mp', ['IE01'], 'https://www.ge.com/news/press-releases/arklow-bank-wind-park-irish-sea-nearing-completion',
       zh='7 座打入式單樁', en='7 driven monopiles'),
    F2('ITA', 'Beleolico (Taranto)', 'mp', url='https://www.offshorewind.biz/2022/01/13/foundations-stand-at-first-mediterranean-offshore-wind-farm/',
       zh='10 座單樁；地中海第一座離岸風場', en='10 monopiles; the first offshore wind farm in the Mediterranean'),
    F2('ESP', 'Elican / Elisa (Gran Canaria)', 'gb', url='https://cordis.europa.eu/project/id/691919',
       zh='重力式基礎配伸縮式塔架，可自行安裝的原型機', en='A gravity-based foundation with a telescopic tower; a self-installing prototype'),
]

# OSPAR 有紀錄、但這一步刻意不列的風場（理由寫在報告裡，之後的步驟再查）
EXCLUDED = [
    ('DNK', 'Frederikshavn', ['DK03'], 'OSPAR 寫全為單樁，但這個試驗場有過吸力桶基礎的試驗機組，容量也對不上（14 vs 7.6 MW）',
     'OSPAR says monopiles, but this test site had a suction-bucket trial turbine, and the capacities disagree (14 vs 7.6 MW)'),
]
