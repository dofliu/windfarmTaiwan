#!/usr/bin/env python3
"""合併風場層級資料 → data/global/wind_farms.json（3D 地球儀用）。

    curl -LO https://raw.githubusercontent.com/GlobalEnergyMonitor/maps/main/trackers/wind/compilation_output/Wind-map-file-2025-02-04.csv
    python tools/build_farms.py data/global/sources/farms_attachment.json Wind-map-file-2025-02-04.csv data/global/wind_farms.json

來源：
  1. 附件「全球風電發展觀察地圖」的精選風場（curated：中文名、機型、查證過的年份）＋ WRI GPPD 風場
  2. Global Energy Monitor「Global Wind Power Tracker」2025-02 版公開地圖檔（CC BY 4.0，
     https://globalenergymonitor.org/projects/global-wind-power-tracker/ ）
     —— 涵蓋各國 10 MW 以上陸域風場與所有離岸風場，含營運中、興建中、前期開發、已宣布與已除役。

合併規則：
  · 精選風場全部保留；GEM 中與精選風場重複者（同國、名稱相符或位置極近且容量相近）捨棄，只補業主等缺漏欄位。
  · 附件中來自 WRI GPPD 的風場，若 GEM 有對應者即以 GEM 為準（GEM 較新較完整），其餘保留。
  · GEM 依 gem-location-id 合併同一場址的分期：營運中各期合成一座（年份＝最早一期，容量＝各期合計，
    並保留逐期 [年份, MW]）；興建中／前期開發／已宣布各自成一筆「規劃中」專案；已除役者保留起訖年。
    同一 location id 底下相距 25 km 以上的分期（例：跨州的企業購電專案）分成不同的點，不取平均座標。
  · 來源座標的已知錯誤以 COORD_FIX 修正；位置明顯錯誤的 GPPD 舊資料以 DROP_CUR 排除（見下方註解）。
  · 取消、擱置、封存（cancelled / shelved / mothballed）不收錄。

輸出為精簡欄位陣列（見 COLS），前端再展開。
"""
import csv, json, math, re, sys, unicodedata
from collections import defaultdict
from pathlib import Path

CUR, GEM, OUT = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])

ISO = {  # GEM country/area → ISO 3166-1 alpha-3（Kosovo 用 Natural Earth 的 KOS 以對齊國界檔）
 'Afghanistan':'AFG','Albania':'ALB','Algeria':'DZA','Angola':'AGO','Argentina':'ARG','Aruba':'ABW','Australia':'AUS','Austria':'AUT',
 'Azerbaijan':'AZE','Bahrain':'BHR','Bangladesh':'BGD','Barbados':'BRB','Belgium':'BEL','Bermuda':'BMU','Bolivia':'BOL',
 'Bonaire, Sint Eustatius, and Saba':'BES','Bosnia and Herzegovina':'BIH','Botswana':'BWA','Brazil':'BRA','Bulgaria':'BGR',
 'Cabo Verde':'CPV','Cambodia':'KHM','Cameroon':'CMR','Canada':'CAN','Chad':'TCD','Chile':'CHL','China':'CHN','Colombia':'COL',
 'Costa Rica':'CRI','Croatia':'HRV','Cuba':'CUB','Curaçao':'CUW','Cyprus':'CYP','Czech Republic':'CZE','Denmark':'DNK','Djibouti':'DJI',
 'Dominican Republic':'DOM','Ecuador':'ECU','Egypt':'EGY','El Salvador':'SLV','Estonia':'EST','Ethiopia':'ETH','Faroe Islands':'FRO',
 'Fiji':'FJI','Finland':'FIN','France':'FRA','Georgia':'GEO','Germany':'DEU','Ghana':'GHA','Greece':'GRC','Greenland':'GRL',
 'Grenada':'GRD','Guadeloupe':'GLP','Guatemala':'GTM','Guernsey':'GGY','Guinea':'GIN','Guyana':'GUY','Honduras':'HND','Hong Kong':'HKG',
 'Hungary':'HUN','Iceland':'ISL','India':'IND','Indonesia':'IDN','Iran':'IRN','Iraq':'IRQ','Ireland':'IRL','Isle of Man':'IMN',
 'Israel':'ISR','Italy':'ITA','Jamaica':'JAM','Japan':'JPN','Jersey':'JEY','Jordan':'JOR','Kazakhstan':'KAZ','Kenya':'KEN','Kosovo':'KOS',
 'Kuwait':'KWT','Kyrgyzstan':'KGZ','Laos':'LAO','Latvia':'LVA','Lebanon':'LBN','Libya':'LBY','Lithuania':'LTU','Luxembourg':'LUX',
 'Madagascar':'MDG','Malawi':'MWI','Mali':'MLI','Martinique':'MTQ','Mauritania':'MRT','Mauritius':'MUS','Mexico':'MEX','Mongolia':'MNG',
 'Montenegro':'MNE','Morocco':'MAR','Mozambique':'MOZ','Myanmar':'MMR','Namibia':'NAM','Netherlands':'NLD','New Caledonia':'NCL',
 'New Zealand':'NZL','Nicaragua':'NIC','Niger':'NER','Nigeria':'NGA','Norfolk Island':'NFK','North Macedonia':'MKD','Norway':'NOR',
 'Oman':'OMN','Pakistan':'PAK','Panama':'PAN','Peru':'PER','Philippines':'PHL','Poland':'POL','Portugal':'PRT','Puerto Rico':'PRI',
 'Romania':'ROU','Russia':'RUS','Réunion':'REU','Saint Kitts and Nevis':'KNA','Saudi Arabia':'SAU','Senegal':'SEN','Serbia':'SRB',
 'Seychelles':'SYC','Sierra Leone':'SLE','Singapore':'SGP','Slovakia':'SVK','Slovenia':'SVN','South Africa':'ZAF','South Korea':'KOR',
 'Spain':'ESP','Sri Lanka':'LKA','Sudan':'SDN','Sweden':'SWE','Switzerland':'CHE','Taiwan':'TWN','Tanzania':'TZA','Thailand':'THA',
 'The Gambia':'GMB','Timor-Leste':'TLS','Tonga':'TON','Tunisia':'TUN','Türkiye':'TUR','Uganda':'UGA','Ukraine':'UKR',
 'United Arab Emirates':'ARE','United Kingdom':'GBR','United States':'USA','Uruguay':'URY','Uzbekistan':'UZB','Vanuatu':'VUT',
 'Vietnam':'VNM','Western Sahara':'ESH','Yemen':'YEM','Zambia':'ZMB','Zimbabwe':'ZWE','Åland Islands':'ALA',
}
ST = {'operating': 0, 'construction': 1, 'pre-construction': 2, 'announced': 3, 'retired': 4}
TYPES = {'onshore': 0, 'offshore': 1, 'floating': 2}
COLS = ["name", "zh", "iso", "lat", "lon", "mw", "year", "type", "st", "end", "owner", "turbine", "flags", "src", "ph"]
# flags: 1 = 座標為概略位置, 2 = 商轉年份不詳（前端放在時間軸終點）；src: 0 精選, 1 WRI GPPD, 2 GEM

STOP = set("""wind farm farms windfarm windpark park parc parque eolico eolica eolien eolienne vindpark vindkraftpark
vindkraftverk windenergie energy energia power plant station project projects phase offshore onshore the and of de del
la le les des do da di van der den und og i ii iii iv v vi extension repowering expansion demonstration demo generation
windpower wpp wf owf co ltd inc llc sa gmbh ag kg corp company group limited complex cluster base farm""".split())


def toks(s):
    s = unicodedata.normalize('NFD', (s or '').lower())
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    return {t for t in re.split(r'[^a-z0-9]+', s) if len(t) >= 3 and t not in STOP and not t.isdigit()}


def cjk2(s):
    s = re.sub(r'[（(].*?[)）]', '', s or '')
    s = re.sub(r'離岸|离岸|海上|陸域|陆域|風力發電|风力发电|風電|风电|風場|风场|發電|发电|計畫|计划|項目|项目|[一二三四五]期|第|階段|示範|示范|廠|厂|站', '', s)
    cj = ''.join(ch for ch in s if '一' <= ch <= '鿿')
    return {cj[i:i + 2] for i in range(len(cj) - 1)}


def km(a, b, c, d):
    return math.hypot((a - c) * 111, (b - d) * 111 * math.cos(math.radians((a + c) / 2)))


def has_kana(s):
    return any('぀' <= ch <= 'ヿ' for ch in s or '')


# 來源座標的已知錯誤（GEM phase id → 概略座標；依專案名稱／在地名稱即可確認地點者才修正）
COORD_FIX = {
    'G100000901374': (38.64, 140.72),   # Miyagi Kami（JRE宮城加美町，宮城縣加美町）：原座標 32.46, 131.15 在宮崎縣
    'G100000901394': (37.44, 137.25),   # Suzu 1（珠洲第１，石川縣能登半島）：原座標 33.18, 129.89 在長崎縣
    'G100000901395': (37.44, 137.27),   # Suzu 2 第 2 期：原座標 40.83, 140.70 在青森縣（第 1 期在珠洲）
}
# 附件中的 WRI GPPD 舊資料：國別與座標不符者排除
DROP_CUR = {'Outside the Northeast'}    # 標為荷蘭，座標卻在美國印第安納州
SPLIT_KM = 25


# ---------------------------------------------------------------- curated / GPPD from the attachment
cur = [f for f in json.loads(CUR.read_text(encoding='utf-8'))['farms'] if f['name'] not in DROP_CUR]
for f in cur:
    f['_t'] = toks(f['name']); f['_z'] = cjk2(f.get('zh'))
cur_by = defaultdict(list)
for f in cur:
    cur_by[f['iso']].append(f)


def nums(s):
    return set(re.findall(r'\d+', s or ''))


AGG = re.compile(r'remainder|placeholder|aggregate|misc|corridor|cluster|\bbase\b|smaller projects|unnamed|其他|合計', re.I)


def matches(f, name, zh, lat, lon, mw, pipeline=False):
    """GEM 專案是否就是精選風場 f（同國已先篩過）。編號不同（Formosa 1 vs Formosa 3）一律視為不同案。
    規劃案（興建中／前期開發／已宣布）只有名稱強相符、且精選風場本身就是這個剛完工的案子時才算重複。"""
    d = km(f['lat'], f['lon'], lat, lon)
    if d > 60:
        return False
    nd, fd = nums(name), nums(f['name'])
    if nd and fd and not (nd & fd):
        return False
    nt, nz = toks(name), cjk2(zh)
    ft, fz = f['_t'], f['_z']
    ratio = (mw / f['mw']) if f['mw'] else 0
    jac = len(ft & nt) / len(ft | nt) if (ft | nt) else 0
    cj, cjn = len(fz & nz), min(len(fz), len(nz))
    strong = jac >= 0.5 or (cjn > 0 and cj >= max(1, round(cjn * 0.6)))
    weak = bool(ft & nt) or cj >= 1
    if pipeline:
        return (jac >= 0.5 or cj >= 2) and d < 30 and (f['year'] >= 2025 or 0.8 <= ratio <= 1.25)
    if jac >= 0.75 and 0.8 <= ratio <= 1.25:          # 名稱幾乎相同、容量相近：座標誤差可能較大（例：石狩湾新港 35 km）
        return True
    if d > 40:
        return False
    if strong and d < 30 and 0.3 <= ratio <= 3.5:
        return True
    if weak and d < 10 and 0.5 <= ratio <= 2:
        return True
    return d < 3 and 0.8 <= ratio <= 1.25


# 台灣在地知識的明確判定（GEM 名稱 → 精選風場名稱；None＝一定保留為獨立風場）
TW_SAME = {'Hsinyuan wind farm': 'Yunlin Lunbei',                     # 新源崙背 25 MW = wpd 雲林崙背
           'Greater Changhua Northwest wind farm': 'Greater Changhua 2b & 4',
           'Yunlin Taixi wind farm': 'Yunlin Taixi'}                     # 台電台西（精選資料為估計值）
TW_KEEP = {'Chuangwei wind farm', 'Changbin (TCC) wind farm', 'Starwind wind farm', 'Changwang wind farm',
           'Changyuan wind farm', 'Beiyuan wind farm', 'Tung Kang wind farm', 'Anwei Dajia wind farm'}


# ---------------------------------------------------------------- GEM
rows = [r for r in csv.DictReader(GEM.open(encoding='utf-8')) if r['status'] in ST]
for r in rows:
    if r['gem-phase-id'] in COORD_FIX:
        r['lat'], r['lng'] = map(str, COORD_FIX[r['gem-phase-id']])
loc = defaultdict(list)
for r in rows:
    loc[r['gem-location-id']].append(r)


def gem_type(ph):
    w = defaultdict(float)
    for r in ph:
        it = r['installation-type'].lower()
        w['floating' if 'floating' in it else 'offshore' if 'offshore' in it else 'onshore'] += float(r['capacity-(mw)'] or 0)
    return max(w, key=w.get)


def split_far(g):
    """同一 location id 的分期依距離分群（相距 < SPLIT_KM 者同群，遞移合併）。"""
    par = list(range(len(g)))
    def root(i):
        while par[i] != i:
            par[i] = par[par[i]]; i = par[i]
        return i
    for i in range(len(g)):
        for j in range(i + 1, len(g)):
            if km(float(g[i]['lat']), float(g[i]['lng']), float(g[j]['lat']), float(g[j]['lng'])) < SPLIT_KM:
                par[root(i)] = root(j)
    parts = defaultdict(list)
    for i, r in enumerate(g):
        parts[root(i)].append(r)
    return sorted(parts.values(), key=lambda p: -sum(float(r['capacity-(mw)'] or 0) for r in p))


def owner_of(ph):
    for r in ph:
        o = (r['owner'] or '').strip()
        if o:
            parts = [p.strip() for p in o.split(';') if p.strip()]
            o = '; '.join(parts[:2]) + ('…' if len(parts) > 2 else '')
            return o[:60]
    return ''


groups_all = []   # (iso, name, zh, status, phases)
for lid, ph in loc.items():
    r0 = ph[0]
    iso = ISO.get(r0['country/area'])
    if not iso:
        continue
    name = r0['project-name'].strip()
    # 在地語言名稱常是多個別名；取第一個含「風／风」的（避免只取到「北側区画」這類分區名）
    aliases = [a.strip() for a in (r0['project-name-in-local-language-/-script'] or '').split(',') if a.strip()]
    local = next((a for a in aliases if '風' in a or '风' in a), '')
    zh = local if (iso in ('CHN', 'TWN', 'HKG') or (iso == 'JPN' and not has_kana(local))) and cjk2(local) else ''
    by_st = defaultdict(list)
    for r in ph:
        by_st[r['status']].append(r)
    for st, gs in by_st.items():
        parts = split_far(gs)
        for k, g in enumerate(parts):
            lat = sum(float(r['lat']) for r in g) / len(g)
            lon = sum(float(r['lng']) for r in g) / len(g)
            mw = round(sum(float(r['capacity-(mw)'] or 0) for r in g), 1)
            if mw > 0:
                groups_all.append(dict(iso=iso, name=name, zh=zh, st=st, g=g, lat=lat, lon=lon, mw=mw, multi=len(by_st) > 1,
                                       part=(k + 1) if len(parts) > 1 else 0))

# 精選資料中的「基地／走廊／未具名彙總」：GEM 在 60 km 內已涵蓋其一半以上容量 → 改用 GEM 的逐場資料
superseded = set()
for f in cur:
    if f.get('src') == 'GPPD' or not AGG.search(f['name'] + ' ' + (f.get('zh') or '')):
        continue
    near = sum(x['mw'] for x in groups_all if x['iso'] == f['iso'] and x['st'] == 'operating' and km(f['lat'], f['lon'], x['lat'], x['lon']) < 60)
    if near >= 0.5 * f['mw']:
        superseded.add(id(f))
keep_cur = lambda f: f.get('src') != 'GPPD' and id(f) not in superseded

gem_out, dropped, gppd_hit, log = [], 0, set(), []
for x in groups_all:
    iso, name, zh, st, g, lat, lon, mw = x['iso'], x['name'], x['zh'], x['st'], x['g'], x['lat'], x['lon'], x['mw']
    yrs = [int(r['start-year']) for r in g if r['start-year']]
    year = min(yrs) if yrs else 0
    end = 0
    if st == 'retired':
        ends = [int(r['retired-year']) for r in g if r['retired-year']]
        if not (yrs and ends):
            continue
        end = max(ends)
    # 與精選風場重複 → 捨棄（只補業主）
    pipe = st in ('construction', 'pre-construction', 'announced')
    if iso == 'TWN' and name in TW_KEEP:
        cand = []
    elif iso == 'TWN' and name in TW_SAME:
        cand = [f for f in cur_by['TWN'] if f['name'] == TW_SAME[name]]
    else:
        cand = [f for f in cur_by.get(iso, []) if keep_cur(f) and matches(f, name, zh, lat, lon, mw, pipe)]
    if cand:
        for f in cand:
            if not f.get('owner'):
                o = owner_of(g)
                if o: f['owner'] = o
        dropped += 1
        if iso in ('TWN', 'JPN'): log.append(f"DROP {iso} {st} {name} {mw} ~ {cand[0]['name']} {cand[0]['mw']}")
        continue
    if st == 'operating':   # WRI GPPD 舊資料若與 GEM 營運中風場相同，以 GEM 為準
        for f in cur_by.get(iso, []):
            if f.get('src') == 'GPPD' and id(f) not in gppd_hit and matches(f, name, zh, lat, lon, mw):
                gppd_hit.add(id(f))
    label = name
    if (x['multi'] and st != 'operating') or x['part']:
        pn = sorted({r['phase-name'] for r in g if r['phase-name'] and r['phase-name'] != '--'})
        if pn: label = f"{name} · {', '.join(pn)}"
        elif x['part']: label = f"{name} · {x['part']}"
    phases = sorted(((int(r['start-year']) if r['start-year'] else 0), float(r['capacity-(mw)'] or 0)) for r in g)
    phl = 0
    if st == 'operating' and len({p[0] for p in phases}) > 1:
        acc = defaultdict(float)
        for y, m in phases:
            acc[y or (max(yrs) if yrs else 0)] += m
        phl = [[y, round(m, 1)] for y, m in sorted(acc.items())]
    flags = (1 if any(r['location-accuracy'] == 'approximate' for r in g) else 0) | (2 if (st == 'operating' and not year) else 0)
    if iso in ('TWN',): log.append(f"ADD  {iso} {st} {label} {mw} y{year}")
    gem_out.append([label, zh, iso, round(lat, 3), round(lon, 3), mw, year, TYPES[gem_type(g)], ST[st], end,
                    owner_of(g), '', flags, 2, phl])
Path(OUT.parent / 'sources' / 'build_farms.log').write_text('\n'.join(sorted(log)), encoding='utf-8')

# ---------------------------------------------------------------- curated + GPPD rows
cur_out = []
for f in cur:
    if (f.get('src') == 'GPPD' and id(f) in gppd_hit) or id(f) in superseded:
        continue
    cur_out.append([f['name'], f.get('zh') or '', f['iso'], f['lat'], f['lon'], f['mw'], f['year'], TYPES[f['type']], 0,
                    f.get('end') or 0, f.get('owner') or '', f.get('turbine') or '', 0, 1 if f.get('src') == 'GPPD' else 0, 0])

allrows = cur_out + gem_out
meta = {
    "cols": COLS,
    "status": ["operating", "construction", "pre-construction", "announced", "retired"],
    "types": ["onshore", "offshore", "floating"],
    "sources": ["curated (wind-history-map v3)", "WRI Global Power Plant Database v1.3 (CC BY 4.0)",
                "Global Energy Monitor, Global Wind Power Tracker, February 2025 release (CC BY 4.0)"],
    "gem_release": "2025-02",
}
OUT.write_text(json.dumps({"meta": meta, "rows": allrows}, ensure_ascii=False, separators=(",", ":")), encoding='utf-8')
cnt = defaultdict(int)
for r in allrows:
    cnt[r[8]] += 1
print(f"curated/GPPD kept {len(cur_out)} (GPPD superseded {len(gppd_hit)}, curated aggregates superseded {len(superseded)}), GEM added {len(gem_out)}, GEM dropped as duplicates {dropped}")
print("by status", dict(cnt), "total", len(allrows), "bytes", OUT.stat().st_size)
