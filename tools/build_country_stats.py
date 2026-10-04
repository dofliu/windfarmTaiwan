#!/usr/bin/env python3
"""各國補充統計 · Extra per-country statistics → data/global/country_stats.json

1. 風電平均容量因數（cf）：Ember 年度電力資料（CC BY 4.0）的風電發電量 ÷（前後兩年年底容量的平均 × 8,760 小時），
   取最近三年（2023–2025）有資料的年份平均。風場卡片用它估算年發電量（容量 × 容量因數，標示為估計）。
   輸入：data/global/sources/ember_wind_2020-2025.csv（從 Ember「yearly_full_release_long_format.csv」只取各國風電容量與發電量）。
   全國風電總容量低於 100 MW、或算出來不在 5–60% 之間的國家不列（小國的年底容量與發電量常對不齊）。
2. 時間軸最新可得年份（latest）：tools/latest_wind.py 的逐國官方數字（每列附出處與原文），由 build_latest() 整理。

1. Average wind capacity factor (cf) from Ember's yearly electricity data (CC BY 4.0): wind generation divided by the mean of
   the two year-end capacities × 8,760 h, averaged over the latest three years (2023–2025) with data. The farm card multiplies a
   farm's capacity by it for an estimated yearly output (labelled as an estimate). Countries under 100 MW of wind, or with a result
   outside 5–60%, are left out (small systems often have mismatched year-end capacity and generation).
2. The latest-available timeline point (latest) from the per-country official figures in tools/latest_wind.py.
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data/global/sources/ember_wind_2020-2025.csv'
OUT = ROOT / 'data/global/country_stats.json'
YEARS = (2023, 2024, 2025)


def capacity_factors():
    cap, gen = defaultdict(dict), defaultdict(dict)
    for r in csv.DictReader(open(SRC, encoding='utf-8')):
        if not r['Value']:
            continue
        (cap if r['Category'] == 'Capacity' else gen)[r['ISO 3 code']][int(r['Year'])] = float(r['Value'])
    out = {}
    for iso in cap:
        vals = []
        for y in YEARS:
            c0, c1, g = cap[iso].get(y - 1), cap[iso].get(y), gen[iso].get(y)
            if not c0 or not c1 or not g:
                continue
            vals.append((y, g / (8.76 * (c0 + c1) / 2)))
        if not vals or cap[iso].get(vals[-1][0], 0) < 0.1:
            continue
        cf = sum(v for _, v in vals) / len(vals)
        if 0.05 <= cf <= 0.6:
            out[iso] = {'cf': round(cf, 3), 'y': [vals[0][0], vals[-1][0]]}
    return out


def build_latest():
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    try:
        import latest_wind  # noqa: E402
    except ImportError:
        return None
    return latest_wind.build()


def main():
    cf = capacity_factors()
    data = {
        'meta': {
            'cf_source': 'Ember, Yearly Electricity Data (CC BY 4.0), https://ember-energy.org/data/yearly-electricity-data/',
            'cf_method': 'wind generation / (mean of year-end capacities × 8,760 h), averaged over ' + '–'.join(map(str, (YEARS[0], YEARS[-1]))),
            'cf_input': SRC.relative_to(ROOT).as_posix(),
        },
        'cf': dict(sorted(cf.items())),
    }
    latest = build_latest()
    if latest:
        data['latest'] = latest
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(cf)} countries with a capacity factor' + (f"; latest {latest['year']}: {len(latest['countries'])} countries updated" if latest else ''))


if __name__ == '__main__':
    main()
