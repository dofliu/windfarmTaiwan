#!/usr/bin/env python3
"""風電均化發電成本（LCOE）· Wind levelised cost of electricity for the Learn page's "falling costs" lesson

  python3 tools/build_lcoe.py            # 從 data/global/sources/owid_lcoe_wind.csv 建置 data/global/lcoe_wind.json
  python3 tools/build_lcoe.py --fetch    # 先重新下載 Our World in Data 的原始檔、更新摘錄檔，再建置

Our World in Data「Levelized cost of energy for renewables」（CC BY 4.0，https://ourworldindata.org/grapher/levelized-cost-of-energy）：
IRENA《Renewable Power Generation Costs》歷年報告的全球加權平均 LCOE，OWID 換算成固定 2025 年美元／度；IRENA 的網站擋掉程式下載，
所以與人口資料一樣經 OWID 取得。只摘錄「World」的陸域與離岸兩欄，存成 data/global/sources/owid_lcoe_wind.csv（進 git），取用日期寫在
data/global/sources/owid_lcoe_retrieved.txt；網站從 lcoe_wind.json 的 meta 讀出處、單位與取用日期，不要寫死。
數字是全球加權平均、固定幣值的估計，各國與各案差很多；介面要寫明單位與年份幣值，不要與台灣的躉購費率混成一張圖。OWID 每年更新（下一次約 2027 年 7 月）。

Our World in Data's "Levelized cost of energy for renewables" (CC BY 4.0) carries IRENA's global weighted-average LCOE from the yearly
"Renewable Power Generation Costs" reports, converted to constant 2025 US$ per kWh; IRENA's own site blocks scripted downloads, so the
series comes through OWID like the population data. Only the "World" onshore and offshore wind columns are kept, in
data/global/sources/owid_lcoe_wind.csv (committed) with the retrieval date in owid_lcoe_retrieved.txt; the site reads the source, unit and
retrieval date from the meta of lcoe_wind.json. These are global weighted averages in constant money, so the UI must state the unit and the
price year and never mix them into the chart of Taiwan's feed-in tariffs. OWID updates yearly (next about July 2027).
"""
import csv
import io
import json
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data/global/sources/owid_lcoe_wind.csv'
RETRIEVED = ROOT / 'data/global/sources/owid_lcoe_retrieved.txt'
OUT = ROOT / 'data/global/lcoe_wind.json'
URL = 'https://ourworldindata.org/grapher/levelized-cost-of-energy.csv?v=1&csvType=full&useColumnShortNames=true'
META_URL = 'https://ourworldindata.org/grapher/levelized-cost-of-energy.metadata.json?v=1&csvType=full&useColumnShortNames=true'
PAGE = 'https://ourworldindata.org/grapher/levelized-cost-of-energy'
UA = {'User-Agent': 'windfarmTaiwan/1.0 (https://github.com/dofliu/windfarmTaiwan)'}


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=600) as r:
        return r.read().decode('utf-8')


def refresh():
    meta = json.loads(fetch(META_URL))
    unit = meta['columns']['onshore_wind']['unit']
    rows = [(int(r['year']), r['onshore_wind'], r['offshore_wind']) for r in csv.DictReader(io.StringIO(fetch(URL))) if r['entity'] == 'World']
    with SRC.open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['year', 'onshore_wind', 'offshore_wind'])
        w.writerows(sorted(rows))
    RETRIEVED.write_text(time.strftime('%Y-%m-%d') + '\n' + unit + '\n' + meta['chart'].get('citation', '') + '\n', encoding='utf-8')
    print(f'{SRC.relative_to(ROOT)}: {len(rows)} years ({min(r[0] for r in rows)}–{max(r[0] for r in rows)}), {unit}')


def build():
    retrieved, unit, citation = (RETRIEVED.read_text(encoding='utf-8').strip('\n').split('\n') + ['', ''])[:3]
    rows = []
    for r in csv.DictReader(SRC.open(encoding='utf-8')):
        rows.append([int(r['year']), round(float(r['onshore_wind']), 4) if r['onshore_wind'] else None, round(float(r['offshore_wind']), 4) if r['offshore_wind'] else None])
    rows.sort()
    out = {'meta': {'source': 'Our World in Data, "Levelized cost of energy for renewables" (' + citation + '), global weighted average of newly commissioned projects',
                    'url': PAGE, 'licence': 'CC BY 4.0', 'unit': unit, 'retrieved': retrieved,
                    'note': 'World series only; onshore and offshore wind; constant-money estimates that vary widely by country and project',
                    'cols': ['year', 'onshore', 'offshore']}, 'rows': rows}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: {len(rows)} years, retrieved {retrieved}, {OUT.stat().st_size} bytes')


if __name__ == '__main__':
    if '--fetch' in sys.argv:
        refresh()
    build()
