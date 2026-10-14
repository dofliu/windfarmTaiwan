#!/usr/bin/env python3
"""風機廠牌與業主占比 · Turbine-maker and owner shares → data/global/market_shares.json

  python3 tools/build_market_shares.py gwpt_map_2026-02.geojson

廠牌（makers）：本站逐場資料（data/global/wind_farms.json）裡營運中與已除役的風場，依下列順序決定廠牌：
  1. 美國：USWTDB 每部風機的廠牌（data/global/turbines.json；混合機型的風場用 mk 欄、依各廠牌額定容量比例分配）。
  2. 德國：MaStR（data/global/turbines_de.json），只用整座風場只有一種機型的（混合機型時其他機組的廠牌不明，算「不詳」）。
  3. 其他：風場紀錄的機型欄（turbine）；寫了兩家以上廠牌、又沒有各自容量的，算「不詳」。
  不用 OpenStreetMap 的風機標籤（ODbL，不能併進其他授權的資料檔，見 CLAUDE.md）。
  品牌依沿革歸併成目前的公司：NEG Micon、Micon、Nordtank、MHI Vestas → Vestas；Siemens、Gamesa、Bonus、Adwen → Siemens Gamesa；
  Enron Wind、Zond、Tacke、Alstom → GE Vernova；Acciona Windpower → Nordex；REpower → Senvion。其他廠牌照原名。
  這是「本站資料中已知廠牌的容量」，不是年度市占統計（那類統計是付費報告）；介面要寫出覆蓋率。

業主（owners）：Global Energy Monitor《Global Wind Power Tracker》2026-02 版（CC BY 4.0）營運中機組的 owner 欄，
  依持股比例（[xx%]）分配容量；沒寫比例的單一業主算 100%，多家又沒有比例的算「不詳」。
  子公司只在名稱看得出所屬集團時歸併（例：Enel Green Power España → Enel）；名稱看不出母公司的不合併
  （例：龍源電力、Avangrid 各自列出），所以集團的實際持有量可能比這裡多。

Turbine makers come from the site's farm records (operating and retired farms): USWTDB per-turbine manufacturers for US farms
(mixed farms split by each maker's summed rating), MaStR for German farms with a single model, otherwise the record's turbine
field; records naming several makers without their capacities count as unknown. OpenStreetMap tags are not used (ODbL).
Brands are folded into today's companies along their merger history (listed above). This is capacity with a known maker in
the site's data, not an annual market-share statistic; the page shows the coverage.
Owners come from GEM's Global Wind Power Tracker (2026-02, CC BY 4.0), operating units, capacity split by the stated stakes;
subsidiaries are merged only when the group's name is part of their own name, so groups may own more than shown.
"""
import ast
import collections
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FARMS = ROOT / 'data/global/wind_farms.json'
GLOBAL = ROOT / 'data/global/wind_global.json'
US = ROOT / 'data/global/turbines.json'
DE = ROOT / 'data/global/turbines_de.json'
OUT = ROOT / 'data/global/market_shares.json'
GEM_REL = '2026-02'

# 品牌 → 目前的公司（依沿革歸併）；比對字串轉小寫後的正規式
MAKERS = [
    ('Vestas', r'\bvestas\b|\bneg\b|\bmicon\b|\bnordtank\b|\bwind world\b'),
    ('Siemens Gamesa', r'\bsiemens\b|\bgamesa\b|\bswt-|\bsg ?\d|\bbonus\b|\badwen\b'),
    ('GE Vernova', r'\bge\b|\bge ?\d|\bgeneral electric\b|\benron\b|\bzond\b|\btacke\b|\balstom\b|\bhaliade'),
    ('Nordex', r'\bnordex\b|\bacciona\b|\baw ?\d'),
    ('Enercon', r'\benercon\b|\be-\d'),
    ('Goldwind', r'\bgoldwind\b|\bgw ?\d|\bgwh|金风'),
    ('Envision', r'\benvision\b|\ben-?\d{3}|远景'),
    ('Mingyang', r'\bmingyang\b|\bmyse|明阳'),
    ('Shanghai Electric', r'\bshanghai electric\b|\bsewind\b|上海电气'),
    ('Windey', r'\bwindey\b|运达'),
    ('Dongfang Electric', r'\bdongfang\b|东方电气'),
    ('CSSC Haizhuang', r'\bhaizhuang\b|\bcssc\b|\bcsic\b|海装'),
    ('Sany', r'\bsany\b|三一'),
    ('Sinovel', r'\bsinovel\b|华锐'),
    ('XEMC', r'\bxemc\b|湘电'),
    ('Suzlon', r'\bsuzlon\b'),
    ('Senvion', r'\bsenvion\b|\brepower\b'),
    ('Mitsubishi', r'\bmitsubishi\b|\bmwt'),
    ('Hitachi', r'\bhitachi\b'),
    ('Doosan', r'\bdoosan\b'),
    ('Unison', r'\bunison\b'),
    ('Inox', r'\binox\b'),
    ('WEG', r'\bweg\b'),
    ('Clipper', r'\bclipper\b'),
    ('Kenetech', r'\bkenetech\b'),
    ('Vensys', r'\bvensys\b'),
    ('Fuhrländer', r'\bfuhrl'),
    ('Eno Energy', r'\beno\b'),
    ('DeWind', r'\bdewind\b'),
]
MAKER_RE = [(n, re.compile(p)) for n, p in MAKERS]


def makers_in(s):
    s = (s or '').lower()
    out = [n for n, p in MAKER_RE if p.search(s)]
    if 'mhi vestas' in s and 'Mitsubishi' in out:
        out.remove('Mitsubishi')
    return out


# 業主：名稱裡看得出所屬集團的子公司歸併（regex 比對小寫名稱）
OWNER_GROUPS = [
    ('Enel', r'^enel\b'), ('Iberdrola', r'iberdrola'), ('EDP Renováveis', r'^edp|^edpr\b'), ('Ørsted', r'ørsted|orsted|^dong energy'),
    ('RWE', r'^rwe\b'), ('Vattenfall', r'vattenfall'), ('ENGIE', r'^engie\b'), ('EDF', r'^edf\b|électricité de france'),
    ('Acciona', r'^acciona\b'), ('NextEra Energy', r'^nextera\b'), ('Statkraft', r'^statkraft\b'), ('Equinor', r'^equinor\b'),
    ('TotalEnergies', r'^total\b|totalenergies'), ('Invenergy', r'^invenergy\b'), ('AES', r'^aes\b'), ('Brookfield', r'^brookfield\b'),
    ('Northland Power', r'^northland power\b'), ('Copenhagen Infrastructure Partners', r'copenhagen infrastructure'), ('wpd', r'^wpd\b'),
    ('China Huaneng', r'huaneng'), ('China Huadian', r'huadian'), ('China Datang', r'datang'), ('China Three Gorges', r'three gorges|^ctg\b'),
    ('State Power Investment Corp (SPIC)', r'^spic\b|state power investment'), ('China General Nuclear (CGN)', r'^cgn\b|china general nuclear|china guangdong nuclear'),
    ('China Energy Investment', r'china energy investment'), ('China Resources', r'^china resources\b'), ('Adani', r'^adani\b'),
    ('ReNew', r'^renew power|^renew energy'), ('Mingyang', r'^mingyang\b'), ('Goldwind', r'^goldwind\b|^beijing tianrun'),
    ('Pattern Energy', r'^pattern\b'), ('Xcel Energy', r'^xcel\b'), ('Duke Energy', r'^duke energy\b'), ('MidAmerican / BHE', r'^midamerican\b|^bhe\b|berkshire hathaway energy'),
    ('Naturgy', r'^naturgy\b'), ('EnBW', r'^enbw\b'), ('SSE', r'^sse\b'), ('ScottishPower', r'^scottishpower|^scottish power'),
]
OWNER_RE = [(n, re.compile(p)) for n, p in OWNER_GROUPS]
STAKE = re.compile(r'^(.*?)\s*\[(\d+(?:\.\d+)?)%\]\s*$')


def owner_group(name):
    low = name.lower()
    for n, p in OWNER_RE:
        if p.search(low):
            return n
    return name


def owner_split(s):
    """'A [60%]; B [40%]' → [(A, 0.6), (B, 0.4)]；沒有比例的單一業主 → 100%；多家沒有比例 → None（不詳）。"""
    parts = [p.strip() for p in (s or '').split(';') if p.strip()]
    if not parts or parts == ['unknown']:
        return None
    out, pct_missing = [], 0
    for p in parts:
        m = STAKE.match(p)
        if m:
            out.append((m.group(1).strip(), float(m.group(2)) / 100))
        else:
            out.append((p, None))
            pct_missing += 1
    if any(re.match(r'(?i)unknown\b', n) for n, _ in out):     # GEM 寫 unknown 的持股：整筆算「不詳」
        return None
    if pct_missing:
        return [(out[0][0], 1.0)] if len(out) == 1 else None
    tot = sum(f for _, f in out)
    if tot <= 0:
        return None
    if tot > 1.001:                                     # 比例加總超過 100%（GEM 偶有）：依比例縮放
        out = [(n, f / tot) for n, f in out]
    return out                                          # 加總不到 100% 的部分算「不詳」


def iso_map():
    """從 tools/build_farms.py 讀 GEM 國名 → ISO 對照（不執行那支程式）。"""
    tree = ast.parse((ROOT / 'tools/build_farms.py').read_text(encoding='utf-8'))
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, 'id', None) == 'ISO' for t in node.targets):
            return ast.literal_eval(node.value)
    raise SystemExit('ISO map not found in build_farms.py')


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    farms = json.loads(FARMS.read_text(encoding='utf-8'))
    G = json.loads(GLOBAL.read_text(encoding='utf-8'))
    cont = {c['iso']: c['cont'] for c in G['countries']}
    data_y = G['years'][-1]
    us = json.loads(US.read_text(encoding='utf-8'))['farms']
    de = json.loads(DE.read_text(encoding='utf-8'))['farms']

    # ---------------- 廠牌
    names = [n for n, _ in MAKERS]
    idx = {n: i for i, n in enumerate(names)}
    rows = collections.defaultdict(float)                  # (iso, year, end, off, maker index or -1) → MW
    src_mw = collections.Counter()
    for r in farms['rows']:
        name, iso, mw, year, typ, st, end, turbine, flags = r[0], r[2], r[5], r[6], r[7], r[8], r[9], r[11], r[12]
        if st not in (0, 4) or not mw:
            continue
        y = 0 if flags & 2 else year                       # 年份不詳：只算進存量
        if st == 4 and not end:
            end = (year or data_y) + 20
        off = 1 if typ else 0
        split = None
        if iso == 'USA' and name in us:
            u = us[name]
            if u.get('mk'):
                ks = collections.Counter()
                for k, kw in u['mk'].items():
                    m = makers_in(k)
                    ks[m[0] if len(m) == 1 else -1] += kw
                tot = sum(ks.values())
                split = [(k, v / tot) for k, v in ks.items()] if tot else None
            elif u.get('m'):
                m = makers_in(u['m'])
                split = [(m[0] if len(m) == 1 else 'Other', 1.0)]
            if split:
                src_mw['uswtdb'] += mw
        elif iso == 'DEU' and 'DEU|' + name in de:
            d = de['DEU|' + name]
            if d.get('mn') == 1 and d.get('m'):
                m = makers_in(d['m'])
                split = [(m[0] if len(m) == 1 else 'Other', 1.0)]
                src_mw['mastr'] += mw
        if split is None:
            m = makers_in(turbine)
            if len(m) == 1:
                split = [(m[0], 1.0)]
                src_mw['record'] += mw
        if split is None:
            split = [(-1, 1.0)]
        for k, f in split:
            if k == 'Other' and 'Other' not in idx:
                idx['Other'] = len(names); names.append('Other')
            mi = -1 if k == -1 else idx[k]
            rows[(iso, y, end or 0, off, mi)] += mw * f
    mk = collections.defaultdict(list)
    for (iso, y, end, off, mi), v in sorted(rows.items()):
        if v >= 0.05:
            mk[iso].append([y, end, off, mi, round(v, 1)])

    # ---------------- 業主（GEM 營運中機組）
    ISO = iso_map()
    feats = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))['features']
    own = {k: collections.defaultdict(lambda: collections.Counter()) for k in ('all', 'off')}
    tot = {k: collections.Counter() for k in ('all', 'off')}
    known = {k: collections.Counter() for k in ('all', 'off')}
    for ft in feats:
        p = ft['properties']
        if p.get('status') != 'operating':
            continue
        iso = ISO.get(p.get('country-area1'))
        cap = p.get('capacity')
        if not iso or cap in (None, ''):
            continue
        cap = float(cap)
        off = 'offshore' in (p.get('tech-type') or '').lower() or 'floating' in (p.get('tech-type') or '').lower()
        scopes = ['WORLD', 'C:' + cont[iso], iso] if iso in cont else ['WORLD', iso]
        sp = owner_split(p.get('owner'))
        for kind in (('all', 'off') if off else ('all',)):
            for sc in scopes:
                tot[kind][sc] += cap
                if sp:
                    for n, f in sp:
                        own[kind][sc][owner_group(n)] += cap * f
                        known[kind][sc] += cap * f
    owners = {}
    for kind in ('all', 'off'):
        for sc, c in own[kind].items():
            top = [[n, round(v, 1)] for n, v in c.most_common(20) if v >= 0.5]
            owners.setdefault(sc, {})[kind] = {'t': round(tot[kind][sc], 1), 'k': round(known[kind][sc], 1), 'n': len(c), 'top': top}

    out = {
        'meta': {
            'makers': {
                'source': 'Site farm records (data/global/wind_farms.json): USWTDB per-turbine manufacturers for US farms, MaStR for single-model German farms, otherwise the record\'s turbine field',
                'folding': 'NEG Micon, Micon, Nordtank, MHI Vestas → Vestas; Siemens, Gamesa, Bonus, Adwen → Siemens Gamesa; Enron Wind, Zond, Tacke, Alstom → GE Vernova; Acciona Windpower → Nordex; REpower → Senvion',
                'note': 'Capacity with a known maker in the site\'s data (operating and retired farms by commissioning year), not an annual market-share statistic. Rows: [year (0 = unknown), retirement year (0 = none), offshore (0/1), maker index (-1 = unknown or mixed), MW].',
                'by_source_mw': {k: round(v) for k, v in src_mw.items()},
            },
            'owners': {
                'source': 'Global Energy Monitor, Global Wind Power Tracker, ' + GEM_REL + ' release (CC BY 4.0), operating units',
                'url': 'https://globalenergymonitor.org/projects/global-wind-power-tracker/',
                'note': 'Capacity split by the stated ownership stakes; t = operating capacity in GEM, k = capacity with a known owner, n = number of owners; subsidiaries are merged only when the group name is part of their name.',
            },
            'tool': 'tools/build_market_shares.py',
        },
        'makers': names,
        'm': dict(sorted(mk.items())),
        'owners': dict(sorted(owners.items())),
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    w = owners['WORLD']['all']
    print(f'{OUT}: {sum(len(v) for v in mk.values())} maker rows in {len(mk)} countries; makers known by source (MW) {dict(src_mw)}; '
          f'owners: {w["n"]} groups, {round(100 * w["k"] / w["t"], 1)}% of {round(w["t"])} MW with a known owner; {OUT.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
