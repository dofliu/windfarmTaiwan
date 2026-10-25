"""「我附近」用的風場點位小檔 · Slim farm points for "Near me"

從 data/global/wind_farms.json 取出營運中、位置不是共用代用點（flags 4）、還沒除役的風場，只留名稱、座標、容量、年份、類型與「概略位置」旗標，
寫成 data/global/farm_points.json（約 1.5 MB，壓縮後約 0.5 MB；完整的 wind_farms.json 約 4.4 MB）。首頁「📍 我附近的風」按下去才載入這個檔。
單檔版不另外內嵌：wind_farms.json 已經在裡面，near.js 在單檔版直接用它。重建風場層後重跑；pr-check 會重跑並比對。

Operating farms from data/global/wind_farms.json that are not on a shared placeholder point (flags 4) and not yet retired, reduced to
name, coordinates, capacity, year, type and the "approximate position" flag, written to data/global/farm_points.json (about 1.5 MB,
0.5 MB compressed, against 4.4 MB for the full file). Home's "📍 Wind near me" loads it only when pressed. The single-file copy does
not embed it: wind_farms.json is already there and near.js uses it. Re-run after rebuilding the farm layer; pr-check re-runs and compares.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data/global/wind_farms.json'
OUT = ROOT / 'data/global/farm_points.json'
YEAR = 2026          # 與 latest_wind.py 的「最新可得」年份相同：除役年 ≤ 這一年的不列 · retired by this year → left out


def main():
    J = json.loads(SRC.read_text(encoding='utf-8'))
    c = {k: i for i, k in enumerate(J['meta']['cols'])}
    rows = []
    for r in J['rows']:
        if r[c['st']] != 0 or (r[c['flags']] & 4) or (r[c['end']] and r[c['end']] <= YEAR):
            continue
        rows.append([r[c['name']], r[c['zh']] or '', r[c['iso']], round(r[c['lat']], 3), round(r[c['lon']], 3),
                     r[c['mw']], r[c['year']], r[c['type']], r[c['flags']] & 1])
    rows.sort(key=lambda x: (x[2], x[0]))
    out = {'meta': {'from': 'data/global/wind_farms.json (tools/build_farm_points.py)', 'year': YEAR,
                    'note': 'operating farms, shared placeholder points (flags 4) and retired farms left out; approx = flags 1',
                    'cols': ['name', 'zh', 'iso', 'lat', 'lon', 'mw', 'year', 'type', 'approx'], 'types': J['meta']['types']},
           'rows': rows}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'wrote {OUT.relative_to(ROOT)}: {len(rows)} farms, {OUT.stat().st_size / 1e6:.2f} MB')


if __name__ == '__main__':
    main()
