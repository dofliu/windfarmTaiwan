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

第 1 步（2026-09）：OSPAR 涵蓋的北海與東北大西洋。OSPAR 的「營運中」紀錄逐筆比對過名稱、位置與容量；
德國的紀錄不可靠（10 筆只寫「單樁／三腳／三樁／套管／重力式／其他」任一種，Merkur、Veja Mate、Trianel Borkum II 與
alpha ventus 則與建成紀錄不符），所以德國每一座都改以德文維基百科資訊框的「Gründung」（附建造紀錄）為準；
Hornsea One 西區也與建成紀錄不符。
沒把握的不列（見 EXCLUDED），不臆測。
"""

ASOF = '2026-09'
OSPAR_URL = 'https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/'
DE = 'https://de.wikipedia.org/wiki/'
EN = 'https://en.wikipedia.org/wiki/'
FR = 'https://fr.wikipedia.org/wiki/'

# 型式：代碼 → (中文, English, 地圖色組)。地圖上多於三種色相時分不清（見 globe.js 的 FD_GROUPS），
# 所以依結構歸成四組：單樁、鋼構框架（套管、三腳、三樁）、浮動式、其他固定式（重力式、高樁承台、混合）
TYPES = {
    'mp': ('單樁', 'Monopile', 'mp'),
    'jk': ('套管式', 'Jacket', 'frame'),
    'tp': ('三腳架', 'Tripod', 'frame'),
    'tl': ('三樁', 'Tripile', 'frame'),
    'gb': ('重力式', 'Gravity-based', 'other'),
    'pc': ('高樁承台', 'High-rise pile cap', 'other'),
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


def F(iso, name, t, ospar=(), url=None, sub=None, parts=None, zh='', en=''):
    return dict(iso=iso, name=name, t=t, ospar=list(ospar), url=url, sub=sub, parts=parts, zh=zh, en=en, step=1)


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
]

# OSPAR 有紀錄、但這一步刻意不列的風場（理由寫在報告裡，之後的步驟再查）
EXCLUDED = [
    ('DEU', 'Hohe See', ['DE011'], 'OSPAR 只寫「任一種」，德文維基百科沒有寫基礎型式', 'OSPAR says “any of these” and German Wikipedia does not state the foundation'),
    ('DNK', 'Frederikshavn', ['DK03'], 'OSPAR 寫全為單樁，但這個試驗場有過吸力桶基礎的試驗機組，容量也對不上（14 vs 7.6 MW）',
     'OSPAR says monopiles, but this test site had a suction-bucket trial turbine, and the capacities disagree (14 vs 7.6 MW)'),
    ('BEL', 'Belwind Alstom Haliade demonstrator', ['Be003'], 'OSPAR 把它併在 Belwind 一期（單樁）裡，這部示範機的基礎要另外查證',
     'OSPAR merges it into Belwind phase 1 (monopiles); this demonstrator’s own foundation still has to be checked'),
]
