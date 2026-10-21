"""觀察報告的數字與數列 · Figures and series for the observation report.

全部從 data/global 的資料檔計算，不寫死數字；報告文字只引用這裡算出的值。
Everything is computed from the data files in data/global; the report text only quotes values computed here.
"""
import collections
import json
import os
import statistics as st

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATA = os.path.join(ROOT, 'data', 'global')
EUROPE_OFF = {'GBR', 'DEU', 'NLD', 'DNK', 'BEL', 'FRA', 'SWE', 'FIN', 'NOR', 'IRL', 'PRT', 'ESP', 'ITA', 'POL', 'EST', 'LVA', 'LTU'}


def load(name):
    with open(os.path.join(DATA, name + '.json'), encoding='utf-8') as f:
        return json.load(f)


def compute():
    G = load('wind_global')
    CI = load('country_indicators')
    CS = load('country_stats')
    FW = load('wind_farms')
    FD = load('foundations')
    GEN = load('generation')
    MS = load('market_shares')
    TU = load('turbines')
    TD = load('turbines_de')

    D = {}
    Y = G['years']
    C = G['countries']
    W = G['worldTotal']
    i25 = Y.index(2025)
    tot = lambda c, i: (c['on'][i] or 0) + (c['off'][i] or 0)
    names = {c['iso']: {'zh': c['zh'], 'en': c['name']} for c in C}
    D['names'] = names

    # ── 一、全球容量 ──
    on = [sum(c['on'][i] or 0 for c in C) for i in range(len(Y))]
    off = [sum(c['off'][i] or 0 for c in C) for i in range(len(Y))]
    add = [None] + [W[k] - W[k - 1] for k in range(1, len(Y))]
    D['years'] = Y
    D['on'], D['off'], D['total'], D['add'] = on, off, W, add
    D['thresholds'] = {t: next(yr for yr, v in zip(Y, W) if v >= t * 1000) for t in (10, 100, 200, 400, 500, 800, 1000)}
    D['w'] = {yr: W[Y.index(yr)] for yr in (1980, 1990, 2000, 2009, 2010, 2015, 2020, 2025)}
    D['add_max_year'] = max(range(1, len(Y)), key=lambda k: add[k])
    D['add_max_year'] = Y[D['add_max_year']]
    prev_peak = max((add[k], Y[k]) for k in range(1, len(Y)) if Y[k] < 2025)
    D['add_prev_peak'] = {'year': prev_peak[1], 'mw': prev_peak[0]}
    D['mult_2000'] = W[i25] / W[Y.index(2000)]
    D['cagr_2000'] = 100 * (D['mult_2000'] ** (1 / 25) - 1)
    D['off25'] = off[i25]
    D['off_pct25'] = 100 * off[i25] / W[i25]
    D['countries_with_wind'] = sum(1 for c in C if tot(c, i25) > 0)

    lead = []
    for i, yr in enumerate(Y):
        top = max(C, key=lambda c: tot(c, i))['iso']
        if lead and lead[-1][0] == top:
            lead[-1][2] = yr
        else:
            lead.append([top, yr, yr])
    D['leaders'] = lead

    cont_keys = ['Asia', 'Europe', 'North America', 'Other']
    D['cont_keys'] = cont_keys
    D['cont_share'] = {}
    for yr in (1990, 2000, 2010, 2020, 2025):
        j = Y.index(yr)
        d = collections.Counter()
        for c in C:
            d[c['cont'] if c['cont'] in cont_keys else 'Other'] += tot(c, j)
        D['cont_share'][yr] = [100 * d[k] / W[j] for k in cont_keys]
    asia = lambda j: sum(tot(c, j) for c in C if c['cont'] == 'Asia')
    eur = lambda j: sum(tot(c, j) for c in C if c['cont'] == 'Europe')
    D['asia_passes_europe'] = next(yr for j, yr in enumerate(Y) if yr > 2000 and asia(j) > eur(j))

    def ind(iso, key, year=2025):
        v = (CI['c'].get(iso) or {}).get(key) or []
        k = year - CI['meta']['years'][0]
        return v[k] if 0 <= k < len(v) else None

    top = sorted(C, key=lambda c: -tot(c, i25))
    D['top10'] = [dict(iso=c['iso'], on=c['on'][i25] or 0, off=c['off'][i25] or 0, total=tot(c, i25),
                       share=100 * tot(c, i25) / W[i25], gshare=ind(c['iso'], 'share'), cf=ind(c['iso'], 'cf'))
                  for c in top[:10]]
    D['chn_share'] = D['top10'][0]['share']
    chn = next(c for c in C if c['iso'] == 'CHN')
    D['chn_off_share'] = 100 * (chn['off'][i25] or 0) / off[i25]
    D['ember_year'] = 2025

    # 風電占發電比例的數列 · wind share of generation
    y0 = CI['meta']['years'][0]
    D['share_years'] = list(range(y0, CI['meta']['years'][1] + 1))
    D['share_series'] = {iso: CI['c'][iso]['share'] for iso in ('DNK', 'IRL', 'GBR', 'DEU', 'ESP', 'BRA', 'CHN', 'USA', 'IND', 'JPN', 'TWN') if iso in CI['c']}

    # ── 里程碑 ──
    D['milestones'] = G['milestones']

    # ── 三、風機變大：美國 USWTDB、德國 MaStR（本站已對應到風場、單一年份的風場）──
    def size_by_year(farms):
        agg = collections.defaultdict(lambda: [0.0, 0, 0.0, 0, 0.0, 0])
        for v in farms.values():
            y = v.get('y')
            if not y or y[0] != y[1] or not v.get('n') or not v.get('kw'):
                continue
            a = agg[y[0]]
            a[0] += v['kw']; a[1] += v['n']
            if v.get('rd'):
                a[2] += sum(v['rd']) / 2 * v['n']; a[3] += v['n']
            if v.get('hh'):
                a[4] += sum(v['hh']) / 2 * v['n']; a[5] += v['n']
        out = {}
        for yr, a in agg.items():
            if a[1] >= 40:
                out[yr] = dict(n=a[1], mw=a[0] / a[1] / 1000, rd=a[2] / a[3] if a[3] else None, hh=a[4] / a[5] if a[5] else None)
        return dict(sorted(out.items()))
    D['size_us'] = size_by_year(TU['farms'])
    D['size_de'] = size_by_year(TD['farms'])
    D['size_meta'] = dict(us_turbines=TU['meta']['turbines'], de_turbines=TD['meta']['turbines'],
                          us_version=TU['meta']['version'])

    # ── 離岸風場的尺寸 ──
    cols = FW['meta']['cols']
    R = [dict(zip(cols, r)) for r in FW['rows']]
    offop = {r['name']: r for r in R if r['type'] in (1, 2) and r['st'] == 0}
    num = lambda v: (sum(v) / len(v) if isinstance(v, list) else v)
    pts = []
    for n, v in FD['farms'].items():
        r = offop.get(n)
        if r and r['year']:
            pts.append(dict(year=r['year'], rd=num(v.get('r')), hh=num(v.get('h')), dep=num((v.get('d') or [None])[-1]), iso=r['iso'], name=n))
    periods = [(1991, 2004), (2005, 2009), (2010, 2014), (2015, 2019), (2020, 2022), (2023, 2026)]
    rows = []
    for a, b in periods:
        s = [p for p in pts if a <= p['year'] <= b]
        med = lambda k: (st.median([p[k] for p in s if p[k]]) if any(p[k] for p in s) else None, sum(1 for p in s if p[k]))
        rows.append(dict(period=(a, b), farms=len(s), rd=med('rd'), hh=med('hh'), dep=med('dep')))
    D['offdims'] = rows
    D['offdims_n'] = len(pts)

    # ── 四、離岸：各國累計、基礎型式、浮動式 ──
    offc = {}
    for iso in ('CHN', 'GBR', 'DEU'):
        c = next(c for c in C if c['iso'] == iso)
        offc[iso] = [c['off'][i] or 0 for i in range(len(Y))]
    offc['Other'] = [off[i] - sum(offc[k][i] for k in ('CHN', 'GBR', 'DEU')) for i in range(len(Y))]
    D['off_by_country'] = offc
    rank = sorted(C, key=lambda c: -(c['off'][i25] or 0))
    D['off_rank'] = [(c['iso'], c['off'][i25] or 0) for c in rank[:8]]
    D['twn_off_rank'] = 1 + [c['iso'] for c in rank].index('TWN')

    groups = {'mp': 'mp', 'jk': 'frame', 'tp': 'frame', 'tl': 'frame', 'fl': 'fl'}
    reg = collections.defaultdict(collections.Counter)
    region = lambda iso: 'CHN' if iso == 'CHN' else ('EUR' if iso in EUROPE_OFF else 'OTH')
    for n, v in FD['farms'].items():
        r = offop.get(n)
        if not r:
            continue
        reg[region(r['iso'])][groups.get(v['t'], 'other')] += r['mw']
    regtot = collections.Counter()
    for r in offop.values():
        regtot[region(r['iso'])] += r['mw']
    D['found'] = {k: dict(mw=dict(reg[k]), known=sum(reg[k].values()), total=regtot[k]) for k in ('EUR', 'CHN', 'OTH')}
    D['found_asof'] = FD['meta']['asof']
    fl = [r for r in R if r['type'] == 2 and r['st'] == 0]
    D['floating'] = sorted([dict(name=r['name'], zh=r['zh'], iso=r['iso'], mw=r['mw'], year=r['year']) for r in fl], key=lambda r: (r['year'] or 0, r['name']))
    D['floating_mw'] = sum(r['mw'] for r in fl)

    # ── 五、實測發電 ──
    key = {(r['iso'], r['name']): r for r in R}
    cf = collections.defaultdict(list)
    us = []
    for k, v in GEN['farms'].items():
        iso, name = k.split('|', 1)
        last = v['y'][max(v['y'])]
        cf[iso].append(last[1])
        r = key.get((iso, name))
        if iso == 'USA' and r and r['year']:
            us.append((r['year'], last[1]))
    D['cf'] = {iso: dict(vals=sorted(l), n=len(l), med=st.median(l), q=st.quantiles(l, n=4)) for iso, l in cf.items()}
    pers = [(1980, 1999), (2000, 2004), (2005, 2009), (2010, 2014), (2015, 2019), (2020, 2025)]
    D['cf_us_period'] = [dict(period=p, n=len(s), med=st.median(s)) for p in pers for s in [[c for y, c in us if p[0] <= y <= p[1]]] if s]
    D['gen_meta'] = dict(years=GEN['meta']['years'], by_iso=GEN['meta']['by_iso'], farms=GEN['meta']['farms'],
                         dk_retrieved=GEN['meta'].get('retrieved', {}).get('DNK'), dk_through=GEN['meta'].get('through', {}).get('DNK'))

    # ── 六、廠牌與業主 ──
    MK = MS['makers']
    def makers(isos=None, offshore=False):
        t = k = 0
        c = collections.Counter()
        for iso, rows in MS['m'].items():
            if isos and iso not in isos:
                continue
            for y, ret, o, mi, mw in rows:
                if ret or (offshore and not o):
                    continue
                t += mw
                if mi >= 0:
                    k += mw; c[MK[mi]] += mw
        return dict(total=t, known=k, cov=100 * k / t if t else 0, top=[(a, b, 100 * b / k) for a, b in c.most_common(6)])
    D['mk_world'] = makers()
    D['mk_us'] = makers({'USA'})
    D['mk_de'] = makers({'DEU'})
    D['mk_off'] = makers(offshore=True)
    D['mk_cov'] = {iso: makers({iso})['cov'] for iso in ('USA', 'DEU', 'GBR', 'TWN', 'FRA', 'BRA', 'IND', 'ESP', 'CHN')}
    D['mk_china_top'] = makers({'CHN'})
    ow = MS['owners']['WORLD']
    D['ow_all'] = dict(t=ow['all']['t'], k=ow['all']['k'], n=ow['all']['n'], top=ow['all']['top'][:12])
    D['ow_off'] = dict(t=ow['off']['t'], k=ow['off']['k'], n=ow['off']['n'], top=ow['off']['top'][:10])

    # ── 七、台灣 ──
    tw = next(c for c in C if c['iso'] == 'TWN')
    D['tw_years'] = [yr for yr in Y if yr >= 2000]
    D['tw_on'] = [tw['on'][Y.index(yr)] or 0 for yr in D['tw_years']]
    D['tw_off'] = [tw['off'][Y.index(yr)] or 0 for yr in D['tw_years']]
    D['tw_latest'] = CS['latest']['countries']['TWN']
    D['tw_rank_total'] = 1 + [c['iso'] for c in top].index('TWN')
    fdf = FD['farms']
    D['tw_farms'] = [dict(name=r['name'], zh=r['zh'], mw=r['mw'], year=r['year'], st=r['st'], turbine=r['turbine'], fd=(fdf.get(r['name']) or {}).get('t'))
                     for r in sorted((r for r in R if r['iso'] == 'TWN' and r['type'] >= 1 and r['st'] <= 1), key=lambda r: (r['st'], r['year'] or 9999))]
    D['fd_types'] = FD['meta']['types']
    D['tw_gen'] = {k.split('|', 1)[1]: v for k, v in GEN['farms'].items() if k.startswith('TWN|')}
    D['tw_share'] = CI['c']['TWN']['share']

    # ── 八、開發管線與最新可得 ──
    P = G['pipelineTotals']
    D['pipe_world'] = P['world']
    D['pipe_release'] = P['release']
    D['pipe_top'] = sorted(((iso, v) for iso, v in P['byIso'].items()), key=lambda x: -(x[1]['construction'] + x[1]['preconstruction']))[:12]
    D['latest'] = CS['latest']

    # ── 附錄：覆蓋 ──
    opf = [r for r in R if r['st'] == 0]
    D['farms_total'] = len(R)
    D['farms_op'] = len(opf)
    D['farms_op_mw'] = sum(r['mw'] for r in opf)
    D['farms_noyear_mw'] = sum(r['mw'] for r in opf if not r['year'])
    D['cleanup'] = FW['meta']['cleanup']
    D['gem_release'] = FW['meta']['gem_release']
    D['milestones_n'] = len(G['milestones'])
    D['events_n'] = load('events')['meta']['count']
    D['ports_n'] = len(load('ports')['ports'])
    D['foundations_n'] = len(FD['farms'])
    return D


if __name__ == '__main__':
    import pprint
    D = compute()
    for k in ('thresholds', 'add_max_year', 'add_prev_peak', 'asia_passes_europe', 'twn_off_rank', 'tw_rank_total', 'floating_mw', 'farms_op', 'farms_op_mw', 'farms_noyear_mw'):
        print(k, D[k])
    pprint.pprint(D['found'])
    pprint.pprint(D['cf_us_period'])
    print({k: v for k, v in D['size_us'].items() if k % 5 == 0}, {k: v for k, v in D['size_de'].items() if k % 5 == 0})


def compute_more(D):
    """第二輪的深入分析 · deeper analyses added in the second round."""
    import glob
    G = load('wind_global')
    CI = load('country_indicators')
    FW = load('wind_farms')
    GEN = load('generation')
    TU = load('turbines')
    TD = load('turbines_de')
    MS = load('market_shares')
    EV = load('events')
    PO = load('ports')
    Y = G['years']
    C = G['countries']
    W = G['worldTotal']
    tot = lambda c, i: (c['on'][i] or 0) + (c['off'][i] or 0)
    cols = FW['meta']['cols']
    R = [dict(zip(cols, r)) for r in FW['rows']]

    # 一、各地區的年新增 · yearly additions by region
    def grp(c):
        if c['iso'] == 'CHN':
            return 'CHN'
        if c['cont'] == 'Europe':
            return 'EUR'
        if c['iso'] == 'USA':
            return 'USA'
        return 'OTH'
    adds = {k: [] for k in ('CHN', 'EUR', 'USA', 'OTH')}
    ay = list(range(2001, 2026))
    for yr in ay:
        i = Y.index(yr)
        s = collections.Counter()
        for c in C:
            s[grp(c)] += tot(c, i) - tot(c, i - 1)
        for k in adds:
            adds[k].append(s[k])
    D['add_years'] = ay
    D['add_by_region'] = adds
    D['chn_add_share'] = {yr: 100 * adds['CHN'][ay.index(yr)] / sum(adds[k][ay.index(yr)] for k in adds) for yr in (2010, 2015, 2020, 2025)}
    D['chn_add_share_2016_25'] = 100 * sum(adds['CHN'][ay.index(y)] for y in range(2016, 2026)) / sum(adds[k][ay.index(y)] for k in adds for y in range(2016, 2026))
    dec = []
    for a, b in ((1980, 1990), (1990, 2000), (2000, 2010), (2010, 2020), (2020, 2025)):
        ia, ib = Y.index(a), Y.index(b)
        gain = {c['iso']: tot(c, ib) - tot(c, ia) for c in C}
        topc = max(gain, key=gain.get)
        dec.append(dict(a=a, b=b, w0=W[ia], w1=W[ib], cagr=100 * ((W[ib] / W[ia]) ** (1 / (b - a)) - 1), add=W[ib] - W[ia],
                        top=topc, top_add=gain[topc], top_share=100 * gain[topc] / (W[ib] - W[ia])))
    D['decades'] = dec

    # 二、集中度與門檻 · concentration and thresholds
    D['conc_years'] = list(range(1990, 2026))
    D['top5_share'] = []
    D['n_1gw'] = []
    D['n_10gw'] = []
    for yr in D['conc_years']:
        i = Y.index(yr)
        v = sorted((tot(c, i) for c in C), reverse=True)
        D['top5_share'].append(100 * sum(v[:5]) / W[i])
        D['n_1gw'].append(sum(1 for x in v if x >= 1000))
        D['n_10gw'].append(sum(1 for x in v if x >= 10000))
    i25 = Y.index(2025)
    pc = []
    for c in C:
        pop = (CI['c'].get(c['iso']) or {}).get('pop') or []
        p = next((x for x in reversed(pop) if x), None)
        if p and tot(c, i25) > 500:
            pc.append((c['iso'], tot(c, i25) * 1e6 / p))
    pc.sort(key=lambda x: -x[1])
    D['percap'] = pc
    D['percap_world'] = W[i25] * 1e6 / 8.1e9 if False else None
    D['twn_percap_rank'] = 1 + [x[0] for x in pc].index('TWN') if 'TWN' in [x[0] for x in pc] else None

    # 三、比功率（W/m²）· specific power of new turbines
    import math
    def spec(d):
        return {y: v['mw'] * 1e6 / (math.pi * (v['rd'] / 2) ** 2) for y, v in d.items() if v.get('rd')}
    D['sp_us'] = spec(D['size_us'])
    D['sp_de'] = spec(D['size_de'])

    # 四、離岸占年新增、離岸風場平均規模 · offshore share of additions; offshore farm size
    off = D['off']
    D['off_add_share'] = {yr: 100 * (off[Y.index(yr)] - off[Y.index(yr) - 1]) / (W[Y.index(yr)] - W[Y.index(yr) - 1]) for yr in range(2005, 2026)}
    offf = [r for r in R if r['type'] in (1, 2) and r['st'] == 0 and r['year']]
    rows = []
    for a, b in ((1991, 2004), (2005, 2009), (2010, 2014), (2015, 2019), (2020, 2022), (2023, 2026)):
        s = [r['mw'] for r in offf if a <= r['year'] <= b]
        rows.append(dict(period=(a, b), n=len(s), med=st.median(s) if s else 0, mx=max(s) if s else 0))
    D['off_farm_size'] = rows
    biggest = sorted(offf, key=lambda r: -r['mw'])[:5]
    D['off_biggest'] = [(r['name'], r['zh'], r['iso'], r['mw'], r['year']) for r in biggest]

    # 五、容量因數與葉輪、丹麥陸域／離岸 · CF vs rotor; Danish onshore vs offshore
    ftype = {(r['iso'], r['name']): r['type'] for r in R}
    sc = []
    dk = {'on': [], 'off': []}
    for k, v in GEN['farms'].items():
        iso, name = k.split('|', 1)
        last = v['y'][max(v['y'])]
        if iso == 'USA' and v.get('rd') and ftype.get((iso, name)) == 0:
            t = TU['farms'].get(name)
            if t and t.get('n') and t.get('kw'):
                sp_ = (t['kw'] / t['n']) * 1000 / (math.pi * (v['rd'] / 2) ** 2)
                sc.append((v['rd'], last[1], sp_))
        if iso == 'DNK':
            dk['off' if ftype.get((iso, name), 0) >= 1 else 'on'].append(last[1])
    D['cf_rd'] = sc
    bins = [(0, 80), (80, 100), (100, 120), (120, 140), (140, 200)]
    D['cf_rd_bins'] = [dict(b=b, n=len(s), med=st.median(s)) for b in bins for s in [[c for r, c, _ in sc if b[0] <= r < b[1]]] if s]
    D['cf_dk'] = {k: dict(n=len(v), med=st.median(v)) for k, v in dk.items() if v}

    # 六、廠牌的世代變化（美國、德國）· makers by commissioning period
    MK = MS['makers']
    def by_period(iso, keep):
        out = []
        for a, b in ((1990, 2004), (2005, 2009), (2010, 2014), (2015, 2019), (2020, 2026)):
            cnt = collections.Counter()
            for y, ret, o, mi, mw in MS['m'].get(iso, []):
                if ret or mi < 0 or not (a <= y <= b):
                    continue
                n = MK[mi]
                cnt[n if n in keep else 'Other'] += mw
            t = sum(cnt.values())
            out.append(dict(period=(a, b), total=t, shares=[100 * cnt[k] / t if t else 0 for k in keep + ['Other']]))
        return out
    D['mk_us_period'] = by_period('USA', ['GE Vernova', 'Vestas', 'Siemens Gamesa'])
    D['mk_de_period'] = by_period('DEU', ['Enercon', 'Vestas', 'Nordex'])
    ow = MS['owners']['WORLD']['all']
    D['ow_top10_share'] = 100 * sum(b for a, b in ow['top'][:10]) / ow['k']

    # 七、港口 · ports
    P = PO['ports']
    D['ports_roles'] = collections.Counter(r for x in P for r in x['roles'])
    D['ports_by_iso'] = collections.Counter(x['iso'] for x in P).most_common(12)
    D['ports_status'] = collections.Counter(x['status'] for x in P)
    D['ports_n'] = len(P)
    D['ports_meta'] = PO['meta']
    D['ports_tw'] = [dict(name=x['name'], zh=x.get('zh') or x['name'], roles=x['roles'], status=x['status'], farms=len(x.get('farms') or [])) for x in P if x['iso'] == 'TWN']
    D['ports_most_farms'] = sorted(((x.get('zh') or x['name'], x['name'], x['iso'], len(x.get('farms') or [])) for x in P), key=lambda r: -r[3])[:6]

    # 八、事故 · incidents
    E = EV['events']
    inc = [e for e in E if e['cat'] == 'inc']
    D['ev_meta'] = EV['meta']
    D['inc_n'] = len(inc)
    def itype(e):
        s = e['sub'][0]
        if '火' in s:
            return 'fire'
        if '葉片' in s or '轉子' in s:
            return 'blade'
        if '倒' in s or '塔架' in s or '基礎' in s:
            return 'tower'
        return 'other'
    D['inc_type'] = collections.Counter(itype(e) for e in inc)
    D['inc_site'] = collections.Counter(e['site'] for e in inc)
    D['inc_year'] = collections.Counter(e['year'] for e in inc)
    D['inc_cont'] = collections.Counter(e['cont'] for e in inc)
    D['inc_typhoon'] = sum(1 for e in inc if '颱風' in e['sub'][0] or '颱風' in (e['title'][0] or ''))
    D['inc_deaths'] = sum(e['deaths'] or 0 for e in inc if isinstance(e['deaths'], (int, float)))
    D['inc_with_deaths'] = sum(1 for e in inc if isinstance(e['deaths'], (int, float)) and e['deaths'] > 0)
    D['inc_list'] = sorted(inc, key=lambda e: e['date'])

    # 九、台灣與日韓 · Taiwan vs Japan and Korea offshore
    D['asia_off'] = {iso: [next(c for c in C if c['iso'] == iso)['off'][Y.index(y)] or 0 for y in range(2010, 2026)] for iso in ('TWN', 'JPN', 'KOR', 'VNM')}
    tw = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'archive', 'wind_history_archive_*.json'))):
        a = json.load(open(f, encoding='utf-8'))
        t = [p['total'] for p in a['points'] if p.get('total') is not None]
        if t:
            tw.append((a['month'], st.mean(t), len(t)))
    D['tw_month'] = tw

    # 十、開發管線的陸域／離岸 · pipeline by type from the farm layer
    pipe = collections.defaultdict(float)
    for r in R:
        if r['st'] in (1, 2, 3):
            pipe[(r['st'], 'off' if r['type'] >= 1 else 'on')] += r['mw']
    D['pipe_type'] = dict(pipe)
    return D
