#!/usr/bin/env python3
"""丹麥每部風機的實際位置與規格 · Danish turbine positions and specs from the Energy Agency register

用法 · Usage:
    python3 tools/build_turbines_dk.py vinddata.xlsx [--debug 風場名稱]

輸入是丹麥能源署風機登記檔「Vinddata」（Stamdataregister for vindkraftanlæg：每部風機的 GSRN、併網／除役日、容量、
葉輪直徑、輪轂高度、廠牌型號、陸域／海域、UTM 32N 座標；與 tools/dk_output.py 同一個檔，下載見該檔說明），
輸出 data/global/turbines_dk.json（格式同 turbines_de.json：每座本站風場的中心、各機位相對中心的 1e-5 度偏移、
機組數、機型、輪轂高度與葉輪直徑範圍、容量、併網年份範圍）。地球儀近看與實景視角用它畫丹麥風場的實際機位，
取代 OpenStreetMap（丹麥的 OSM 機位仍在 turbines_osm.json，對不到登記檔的風場才用）。

對應規則（寧可少配，與 tools/dk_output.py 的歸場規則相同）：
  1. 只用還在運轉的風機（沒有除役日），對本站營運中（未除役）的丹麥風場。
  2. 風機歸到最近的本站風場，海域 12 km、陸域 3 km 內，陸域／海域要相同；併網年份不早於該風場商轉年的前一年
     （更早的是附近別的風機）。
  3. 歸到同一座風場的機組容量加總要在本站紀錄 ±15% 內才寫出（差太多表示混進鄰場或本站紀錄有誤）。
     對不上時再試兩步（仍要在 ±15% 內）：(a) 陸域 5 km 內、與已歸入的風機同型號同併網年、又沒有歸給別座風場的補進來
     （一排風機超出 3 km 的情形）；(b) 把機組依「型號＋併網年」分組（2–6 組），只留商轉年前後一年、單獨一組就對得上的那組
     （鄰近另一期、另一座風場混入的情形；要兩組以上才湊得上的不配）。兩步都不行就不寫，地球儀改用 OpenStreetMap。
  4. 機型只在所有機組同一種寫法時寫（dk_output.model_of）。

授權：丹麥能源署資料使用條款（免費、非專屬，須標示 Energistyrelsen、資料集名稱與取用時間）；取用月份由檔案的修改時間寫進 meta，
網站從那裡讀，不要寫死。重建風場層或下載新的登記檔後重跑。

Input: the Danish Energy Agency's "Vinddata" workbook (the same file tools/dk_output.py reads; see its docstring for the download).
Output: data/global/turbines_dk.json in the turbines_de.json format. Rules (conservative, same as dk_output.py's farm assignment):
operating turbines only (no decommissioning date), matched to the site's operating Danish farms by nearest point within 12 km at sea /
3 km on land of the same kind, connected no earlier than the year before the farm's start year, and written only when the assigned
capacity is within ±15% of the site record (when it is not, two fallbacks are tried, still within ±15%: (a) add unassigned turbines within
5 km on land that share model and connection year with turbines already assigned — a row reaching past 3 km; (b) group the turbines by
model + connection year (2–6 groups) and keep a single group from the farm's start year ±1 that matches on its own — a neighbouring
phase or farm mixed in; combinations of groups are never used); a model is written only when every turbine carries the same model string.
Licence: the agency's data terms (credit Energistyrelsen, the dataset and the retrieval date, which the build writes into meta from
the file's modification time). Re-run after rebuilding the farm layer or downloading a newer register.
"""
import datetime as dt
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from dk_output import SRC, model_of, read_turbines  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
FARMS = ROOT / 'data/global/wind_farms.json'
OUT = ROOT / 'data/global/turbines_dk.json'
SEA_KM, LAND_KM, TOL = 12.0, 3.0, 0.15
EXT_KM = 5.0      # (a) 同型號同年份的延伸距離（陸域） · reach of fallback (a) on land
LICENSE = ('Danish Energy Agency data terms (free, non-exclusive reuse; credit Energistyrelsen, the dataset and the retrieval date): '
           + SRC['terms'])


def km(lat1, lon1, lat2, lon2):
    x = (lon2 - lon1) * 111.32 * math.cos(math.radians((lat1 + lat2) / 2))
    y = (lat2 - lat1) * 110.574
    return math.hypot(x, y)


def main(vind_xlsx, debug=None):
    fj = json.loads(FARMS.read_text(encoding='utf-8'))
    cols = {k: i for i, k in enumerate(fj['meta']['cols'])}
    farms = [dict((k, r[i]) for k, i in cols.items()) for r in fj['rows']]
    site = [f for f in farms if f['iso'] == 'DNK' and f['st'] == 0 and not f['end'] and f['type'] is not None]
    ts = [t for t in read_turbines(vind_xlsx) if t['ll'] and not t['off'] and t['kw']]
    got = dt.datetime.fromtimestamp(Path(vind_xlsx).stat().st_mtime).strftime('%Y-%m')
    print(f'{len(ts):,} operating turbines with coordinates; {len(site)} operating site farms in Denmark')

    # 每部風機 → 最近且合格的本站風場 · each turbine → nearest qualifying site farm
    assign = defaultdict(list)
    for t in ts:
        lat, lon = t['ll']                                   # dk_output 回傳 (緯度, 經度) · (lat, lon)
        best, bd = None, 1e9
        for f in site:
            sea = f['type'] != 0
            if sea != t['sea'] and not (sea and not t['land'] and not t['sea']):
                continue
            d = km(lat, lon, f['lat'], f['lon'])
            if d > (SEA_KM if sea else LAND_KM) or d >= bd:
                continue
            if f['year'] and t['on'] and t['on'].year < f['year'] - 1:
                continue
            best, bd = f, d
        if best:
            assign[(best['iso'], best['name'])].append(t)

    used = {id(t) for tt in assign.values() for t in tt}
    ok = lambda tt, f: abs(sum(t['kw'] for t in tt) / 1000 - f['mw']) <= TOL * f['mw']
    grp = lambda t: (t['model'] or '', t['on'].year if t['on'] else None)

    def fallback(f, tt):
        if f['type'] == 0:                                   # (a) 陸域：同型號同年份、5 km 內 · same model and year within 5 km
            keys = {grp(t) for t in tt}
            more = [t for t in ts if id(t) not in used and not t['sea'] and grp(t) in keys
                    and km(t['ll'][0], t['ll'][1], f['lat'], f['lon']) <= EXT_KM]
            if more and ok(tt + more, f):
                return tt + more, 'a'
        groups = defaultdict(list)                           # (b) 依型號＋年份分組取單一組 · one model+year group
        for t in tt:
            groups[grp(t)].append(t)
        gl = list(groups.values())
        if not 2 <= len(gl) <= 6:
            return None, ''
        best = None
        for pick in gl:                                      # 只接受單一組（同一期同型號）就對上的 · only a single group (one phase, one model)
            if f['year'] and not (pick[0]['on'] and abs(pick[0]['on'].year - f['year']) <= 1):
                continue
            d = abs(sum(t['kw'] for t in pick) / 1000 - f['mw'])
            if ok(pick, f) and (best is None or d < best[0]):
                best = (d, pick)
        return (best[1], 'b') if best else (None, '')

    out, dropped, rescued = {}, [], []
    for (iso, name), tt in sorted(assign.items()):
        f = next(x for x in site if x['name'] == name)
        kw = sum(t['kw'] for t in tt)
        if abs(kw / 1000 - f['mw']) > TOL * f['mw']:
            alt, how = fallback(f, tt)
            if not alt:
                dropped.append((name, f['mw'], round(kw / 1000, 1), len(tt)))
                continue
            rescued.append((name, how, f['mw'], round(kw / 1000, 1), round(sum(t['kw'] for t in alt) / 1000, 1), len(tt), len(alt)))
            used.update(id(t) for t in alt)
            tt, kw = alt, sum(t['kw'] for t in alt)
        pts = [(t['ll'][1], t['ll'][0]) for t in tt]       # (經度, 緯度) · (lon, lat)
        c = (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
        p = []
        for lon, lat in pts:
            p += [round((lon - c[0]) * 1e5), round((lat - c[1]) * 1e5)]
        hh = [t['hh'] for t in tt if t['hh']]
        rd = [t['rd'] for t in tt if t['rd']]
        ys = [t['on'].year for t in tt if t['on']]
        m = model_of(tt)
        out[f'{iso}|{name}'] = {'c': [round(c[0], 5), round(c[1], 5)], 'p': p, 'n': len(tt), 'm': m, 'mn': 1 if m else 0,                      # mn：機型寫法的種類數（同 turbines_de.json） · number of model spellings
                                'hh': [min(hh), max(hh)] if len(hh) >= len(tt) / 2 else None,
                                'rd': [min(rd), max(rd)] if len(rd) >= len(tt) / 2 else None,
                                'kw': round(kw), 'y': [min(ys), max(ys)] if ys else None, 'src': 'dk'}
    if debug:
        for k, v in out.items():
            if debug.lower() in k.lower():
                print(k, {a: b for a, b in v.items() if a != 'p'})
    for d in dropped:
        print(f'  skip {d[0]}: site {d[1]} MW vs register {d[2]} MW ({d[3]} turbines)')
    for r in rescued:
        print(f'  fallback ({r[1]}) {r[0]}: site {r[2]} MW; register {r[3]} MW ({r[5]} turbines) -> {r[4]} MW ({r[6]} turbines)')
    meta = {'source': 'Energistyrelsen, Stamdataregister for vindkraftanlæg (Vinddata): every turbine\'s position, rating, rotor, hub height and model',
            'url': SRC['url'], 'license': LICENSE, 'credit': 'Energistyrelsen, Stamdataregister for vindkraftanlæg (Vinddata), retrieved ' + got,
            'retrieved': got, 'farms': len(out), 'turbines': sum(v['n'] for v in out.values()), 'mw': round(sum(v['kw'] for v in out.values()) / 1000),
            'register_turbines': len(ts), 'skipped': len(dropped), 'fallback': len(rescued), 'tool': 'tools/build_turbines_dk.py',
            'note': 'Keys are "ISO|farm name". Positions are offsets from "c" in 1e-5 degrees, [dlon, dlat, ...]; hh/rd = hub height and rotor diameter '
                    'range (m) when at least half the turbines report them; kw = summed rating; y = range of grid-connection years; m = model when every '
                    'turbine carries the same model.'}
    OUT.write_text(json.dumps({'meta': meta, 'farms': out}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'wrote {OUT.name}: {len(out)} farms, {meta["turbines"]:,} turbines, {meta["mw"]:,} MW ({OUT.stat().st_size / 1e3:.0f} KB); '
          f'{len(dropped)} farms skipped on capacity')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == '--debug' else None)
