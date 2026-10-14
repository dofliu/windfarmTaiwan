#!/usr/bin/env python3
"""各國指標（風電占發電比例、容量因數、人口）· Per-country indicators → data/global/country_indicators.json

  python3 tools/build_country_indicators.py            # 從 data/global/sources/ 的兩個摘錄檔建置
  python3 tools/build_country_indicators.py --fetch    # 先重新下載 Ember 與 Our World in Data 的原始檔、更新摘錄檔，再建置

資料來源 · Sources
1. Ember「Yearly Electricity Data」（CC BY 4.0，https://ember-energy.org/data/yearly-electricity-data/）：各國逐年的風電容量（GW）、
   風電發電量（TWh）、風電占發電比例（%）與總發電量（TWh），2000 年起。原始檔約 50 MB，只摘錄本站有國家統計的國家寫成
   data/global/sources/ember_wind_2000-2025.csv（進 git）。
2. Our World in Data「Population」（CC BY 4.0，依聯合國《世界人口展望》等整理，https://ourworldindata.org/grapher/population）：
   各國逐年人口，摘錄成 data/global/sources/owid_population_2000-2023.csv（進 git）。
   人均容量由網站以本站的年底容量 ÷ 當年人口計算；人口只到 2023 年，之後的年份沿用最後一年並在介面標示。

容量因數（cf）＝ Ember 風電發電量 ÷（前後兩年年底容量的平均 × 當年時數）；前一年容量不到 0.1 GW、或算出來不在 5–60% 之間的年份留空
（小國的年底容量與發電量常對不齊）。這是全國平均，含限電與新機組的部分年份，只適合看趨勢與國家之間的粗略比較。

Ember's yearly electricity data (CC BY 4.0) gives each country's wind capacity (GW), wind generation (TWh), wind share of generation (%)
and total generation (TWh) from 2000; only the countries with national statistics on this site are extracted into
data/global/sources/ember_wind_2000-2025.csv. Our World in Data's population series (CC BY 4.0, based on UN World Population Prospects)
is extracted into data/global/sources/owid_population_2000-2023.csv; the site divides its own year-end capacity by the population of the
year (the last population year is carried forward and labelled). The capacity factor is wind generation / (mean of the two year-end
capacities × hours in the year), blank when the previous year's capacity is under 0.1 GW or the result falls outside 5–60%; it is a
national average including curtailment and partial years, meant for trends and rough comparisons only.
"""
import csv
import io
import json
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLOBAL = ROOT / 'data/global/wind_global.json'
EMBER_SRC = ROOT / 'data/global/sources/ember_wind_2000-2025.csv'
POP_SRC = ROOT / 'data/global/sources/owid_population_2000-2023.csv'
OUT = ROOT / 'data/global/country_indicators.json'
EMBER_URL = 'https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv'
POP_URL = 'https://ourworldindata.org/grapher/population.csv?v=1&csvType=full&useColumnShortNames=true'
Y0, Y1 = 2000, 2025
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) windfarmTaiwan build script'}
EMBER_KEYS = {('Capacity', 'Wind', 'GW'): 'cap_gw', ('Electricity generation', 'Wind', 'TWh'): 'gen_twh',
              ('Electricity generation', 'Wind', '%'): 'share_pct', ('Electricity generation', 'Total Generation', 'TWh'): 'total_twh'}


def site_isos():
    return {c['iso'] for c in json.loads(GLOBAL.read_text(encoding='utf-8'))['countries']}


def fetch(url):
    print('downloading', url)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=600) as r:
        return r.read().decode('utf-8', 'replace')


def refresh_sources():
    isos = site_isos()
    rows = defaultdict(dict)
    for r in csv.DictReader(io.StringIO(fetch(EMBER_URL))):
        k = EMBER_KEYS.get((r['Category'], r['Variable'], r['Unit']))
        if not k or r['ISO 3 code'] not in isos or not r['Value'] or not (Y0 <= int(r['Year']) <= Y1):
            continue
        rows[(r['ISO 3 code'], int(r['Year']))][k] = float(r['Value'])
    with open(EMBER_SRC, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['iso', 'year', 'cap_gw', 'gen_twh', 'share_pct', 'total_twh'])
        for (iso, y), v in sorted(rows.items()):
            w.writerow([iso, y] + [v.get(k, '') for k in ('cap_gw', 'gen_twh', 'share_pct', 'total_twh')])
    print('wrote', EMBER_SRC, len(rows), 'rows;', len({k[0] for k in rows}), 'countries')
    pop = []
    for r in csv.DictReader(io.StringIO(fetch(POP_URL))):
        if r['code'] in isos and r['population_historical'] and Y0 <= int(r['year']) <= Y1:
            pop.append((r['code'], int(r['year']), int(float(r['population_historical']))))
    with open(POP_SRC, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['iso', 'year', 'population'])
        w.writerows(sorted(pop))
    print('wrote', POP_SRC, len(pop), 'rows;', len({p[0] for p in pop}), 'countries')
    (ROOT / 'data/global/sources/ember_owid_retrieved.txt').write_text(time.strftime('%Y-%m-%d') + '\n', encoding='utf-8')


def hours(y):
    return 8784 if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0 else 8760


def main():
    if '--fetch' in sys.argv:
        refresh_sources()
    isos = site_isos()
    years = list(range(Y0, Y1 + 1))
    em = defaultdict(dict)
    for r in csv.DictReader(open(EMBER_SRC, encoding='utf-8')):
        em[r['iso']][int(r['year'])] = {k: float(r[k]) for k in ('cap_gw', 'gen_twh', 'share_pct', 'total_twh') if r[k] != ''}
    pop = defaultdict(dict)
    for r in csv.DictReader(open(POP_SRC, encoding='utf-8')):
        pop[r['iso']][int(r['year'])] = int(r['population'])
    retrieved = (ROOT / 'data/global/sources/ember_owid_retrieved.txt')
    retrieved = retrieved.read_text(encoding='utf-8').strip() if retrieved.exists() else None
    out = {}
    pop_last = 0
    for iso in sorted(isos):
        e, p = em.get(iso, {}), pop.get(iso, {})
        share = [round(e[y]['share_pct'], 2) if y in e and 'share_pct' in e[y] else None for y in years]
        gen = [round(e[y]['gen_twh'], 3) if y in e and 'gen_twh' in e[y] else None for y in years]
        cf = []
        for y in years:
            c0, c1, g = e.get(y - 1, {}).get('cap_gw'), e.get(y, {}).get('cap_gw'), e.get(y, {}).get('gen_twh')
            v = None
            if c0 and c1 and g is not None and c0 >= 0.1:
                x = g / ((c0 + c1) / 2 * hours(y) / 1000)
                if 0.05 <= x <= 0.6:
                    v = round(x, 3)
            cf.append(v)
        pp = [p.get(y) for y in years]
        if p:
            pop_last = max(pop_last, max(p))
        if any(v is not None for v in share + gen + cf + pp):
            out[iso] = {'share': share, 'gen': gen, 'cf': cf, 'pop': pp}
    data = {
        'meta': {
            'years': [Y0, Y1],
            'ember': {'name': 'Ember, Yearly Electricity Data', 'licence': 'CC BY 4.0', 'url': 'https://ember-energy.org/data/yearly-electricity-data/',
                      'fields': 'share = wind share of electricity generation (%); gen = wind generation (TWh); cf = wind generation / (mean of year-end capacities × hours in the year), national average incl. curtailment, blank outside 5–60% or when the previous year-end capacity is under 0.1 GW'},
            'population': {'name': 'Our World in Data, Population (based on UN World Population Prospects and others)', 'licence': 'CC BY 4.0',
                           'url': 'https://ourworldindata.org/grapher/population', 'last_year': pop_last,
                           'note': 'per-capita capacity = site year-end capacity / population of the year; after the last population year the last value is carried forward'},
            'retrieved': retrieved,
            'tool': 'tools/build_country_indicators.py',
        },
        'years': years,
        'c': out,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    n_share = sum(1 for v in out.values() if v['share'][-1] is not None)
    print(f'{OUT}: {len(out)} countries; {n_share} with a {Y1} wind share; population to {pop_last}; {OUT.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
