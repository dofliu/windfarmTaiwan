#!/usr/bin/env python3
"""離岸風場水下基礎型式 → data/global/foundations.json（地球儀「水下基礎」圖層）＋ docs/foundations.md、docs/foundations.en.md

    python3 tools/build_foundations.py

讀 tools/farm_foundations.py 的逐場對照表，逐條檢查後輸出；有錯誤時以非零狀態結束、不寫檔。
  · 風場要在 data/global/wind_farms.json 裡、國別相同，而且是離岸或浮動式；浮動式風場的型式一定是 fl，固定式不可以是 fl
  · 型式、細分型式、混合型的組成要是已定義的代碼；同一座風場不可出現兩次
  · 引用的 OSPAR 紀錄要存在（data/global/sources/ospar_offshore_renewables_2024.csv，由 ODIMS 的 xlsx 取出風機列）；
    OSPAR 的值與表上的型式不相符、或 OSPAR 沒有具體型式時，該列必須附第二來源（url）與中英文說明
只用 Python 標準函式庫。wind_farms.json 重建後（風場改名或刪除）要再跑一次；對不到會中止，請重新查證。

Offshore foundation types → data/global/foundations.json (the globe's foundation layer) and the generated
docs/foundations.md / docs/foundations.en.md. Checks every row of tools/farm_foundations.py and stops on errors.
"""
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from farm_foundations import ASOF, EXCLUDED, FOUNDATIONS, OSPAR_URL, SUBS, TYPES  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FARMS = ROOT / 'data/global/wind_farms.json'
OSPAR_CSV = ROOT / 'data/global/sources/ospar_offshore_renewables_2024.csv'
OUT = ROOT / 'data/global/foundations.json'
YEAR = 2025                                   # 報告的「營運中」＝時間軸終點仍在運轉
OSPAR_ONE = {'monopile': 'mp', 'jacket': 'jk', 'tripod': 'tp', 'tripile': 'tl', 'gravity-based': 'gb', 'gravitation': 'gb', 'other': 'fl'}


def ospar_codes(v):
    """OSPAR 的 Foundation/anchor type → 代碼集合；None＝沒寫；'any'＝列了四種以上（等於沒說）"""
    v = (v or '').strip().lower()
    if not v:
        return None
    parts = [p.strip() for p in v.split('/') if p.strip()]
    if len(parts) >= 4:
        return 'any'
    codes = set()
    for p in parts:
        if p not in OSPAR_ONE:
            return 'any'
        codes.add(OSPAR_ONE[p])
    if parts == ['tripod', 'tripile']:
        codes = {'tp', 'tl'}
    return codes


def main():
    rows = json.loads(FARMS.read_text(encoding='utf-8'))['rows']
    farms = {r[0]: r for r in rows}
    ospar = {r['ID']: r for r in csv.DictReader(OSPAR_CSV.open(encoding='utf-8'))}
    countries = {c['iso']: c for c in json.loads((ROOT / 'data/global/wind_global.json').read_text(encoding='utf-8'))['countries']}
    errors, seen, out = [], set(), {}
    for rule in FOUNDATIONS:
        tag = f"{rule['iso']} {rule['name']}"
        f = farms.get(rule['name'])
        if not f:
            errors.append(f'{tag}: not in wind_farms.json (renamed or removed? re-check the farm)'); continue
        if f[2] != rule['iso']:
            errors.append(f'{tag}: country is {f[2]} in wind_farms.json')
        if f[7] not in (1, 2):
            errors.append(f'{tag}: not an offshore or floating farm')
        if rule['name'] in seen:
            errors.append(f'{tag}: listed twice')
        seen.add(rule['name'])
        t = rule['t']
        if t not in TYPES:
            errors.append(f'{tag}: unknown type {t!r}')
        if (f[7] == 2) != (t == 'fl'):
            errors.append(f'{tag}: floating farms must be "fl" and fixed-bottom farms must not be')
        if rule['sub'] and rule['sub'] not in SUBS:
            errors.append(f'{tag}: unknown sub-type {rule["sub"]!r}')
        if (t == 'mx') != bool(rule['parts']):
            errors.append(f'{tag}: mixed farms (and only they) list their parts')
        for p in rule['parts'] or []:
            if p[0] not in TYPES or p[0] in ('mx', 'fl'):
                errors.append(f'{tag}: bad part {p!r}')
        if not rule['ospar'] and not rule['url']:
            errors.append(f'{tag}: needs a source (OSPAR record or url)')
        agree, specific = True, False
        for oid in rule['ospar']:
            o = ospar.get(oid)
            if not o:
                errors.append(f'{tag}: OSPAR record {oid} not found'); continue
            if (o['Device Type'] or '').strip().lower() != 'wind turbine':
                errors.append(f'{tag}: OSPAR record {oid} is not a wind farm')
            c = ospar_codes(o['Foundation/anchor type'])
            if c in (None, 'any'):
                continue
            specific = True
            want = {p[0] for p in rule['parts']} if t == 'mx' else {t}
            if not (want <= c if t == 'mx' else t in c):
                agree = False
        if (not agree or not specific) and not (rule['url'] and rule['zh'] and rule['en']):
            errors.append(f'{tag}: OSPAR says {[ospar[i]["Foundation/anchor type"] for i in rule["ospar"] if i in ospar]}; '
                          'a second source (url) and a zh/en note are required')
        rec = {'t': t}
        if rule['ospar']:
            rec['o'] = rule['ospar']
        if rule['url']:
            rec['u'] = rule['url']
        if rule['sub']:
            rec['s'] = rule['sub']
        if rule['parts']:
            rec['p'] = rule['parts']
        if rule['zh']:
            rec['zh'], rec['en'] = rule['zh'], rule['en']
        out[rule['name']] = rec
    for iso, name, ids, zh, en in EXCLUDED:
        if name not in farms:
            errors.append(f'excluded {iso} {name}: not in wind_farms.json')
        if name in out:
            errors.append(f'excluded {iso} {name}: also classified')
        for oid in ids:
            if oid not in ospar:
                errors.append(f'excluded {iso} {name}: OSPAR record {oid} not found')
    if errors:
        for e in errors:
            print('ERROR', e)
        sys.exit(1)

    meta = {
        'asof': ASOF, 'step': 1,
        'types': {k: list(v) for k, v in TYPES.items()}, 'subs': {k: list(v) for k, v in SUBS.items()},
        'ospar': {'title': 'OSPAR Offshore Renewable Energy Developments 2024', 'url': OSPAR_URL, 'licence': 'CC0 1.0', 'asof': '2024-01-01'},
        'note': ['逐步收集中：第 1 步為 OSPAR 涵蓋的北海與東北大西洋（2026-09）；其他海域的離岸風場暫列「型式不詳」',
                 'Collected step by step: step 1 covers the North Sea and NE Atlantic within OSPAR (Sep 2026); '
                 'offshore farms elsewhere are shown as “type unknown” for now'],
    }
    OUT.write_text(json.dumps({'meta': meta, 'farms': out}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    write_docs(rows, out, ospar, countries)
    ops = [r for r in rows if r[7] in (1, 2) and r[8] == 0 and not (r[9] and r[9] <= YEAR)]
    cls = [r for r in ops if r[0] in out or r[7] == 2]
    mw = lambda rs: sum(r[5] for r in rs)
    print(f'{len(out)} farms classified ({dict(Counter(v["t"] for v in out.values()))}); '
          f'operating offshore with a known type: {len(cls)}/{len(ops)} farms, {mw(cls) / mw(ops) * 100:.1f}% of MW; wrote {OUT.relative_to(ROOT)}')


NAMES = {'ALA': ('奧蘭', 'Åland')}     # wind_global.json 沒有國家資料的地區


def pct(a, b):
    """占比：沒有全部分類就不顯示 100%"""
    x = a / b * 100 if b else 0
    return '100%' if a >= b else ('<1%' if 0 < x < 1 else f'{min(int(x), 99)}%')


def _fmt(x):
    return f'{x:,.0f}' if x >= 100 else f'{x:,.1f}'


def write_docs(rows, out, ospar, countries):
    """docs/foundations.md（中文）與 docs/foundations.en.md"""
    by_name = {r[0]: r for r in rows}
    ops = [r for r in rows if r[7] in (1, 2) and r[8] == 0 and not (r[9] and r[9] <= YEAR)]
    per = defaultdict(lambda: [0, 0.0, 0, 0.0, Counter()])
    for r in ops:
        p = per[r[2]]
        p[0] += 1; p[1] += r[5]
        g = TYPES[out[r[0]]['t']][2] if r[0] in out else ('fl' if r[7] == 2 else None)   # 浮動式風場本來就知道是浮動式
        if g:
            p[2] += 1; p[3] += r[5]; p[4][g] += 1
    tot = [sum(p[i] for p in per.values()) for i in range(4)]
    for lang in ('zh', 'en'):
        zh = lang == 'zh'
        cname = lambda iso: ((countries[iso].get('zh') or countries[iso]['name']) if zh else countries[iso]['name']) if iso in countries else NAMES.get(iso, (iso, iso))[0 if zh else 1]
        tname = lambda t: TYPES[t][0 if zh else 1]
        L = []
        if zh:
            L += ['# 離岸風場水下基礎型式', '', '[English](foundations.en.md) ｜ 中文（本頁）', '',
                  f'> 由 `tools/build_foundations.py` 依 `tools/farm_foundations.py` 的逐場對照表產生，請勿手動編輯。整理時間：{ASOF}。', '',
                  '地球儀的「顯示」選單有「離岸：水下基礎」圖層，依基礎型式為離岸風場上色。資料一步一步收集：',
                  '', '1. **北海與東北大西洋（OSPAR 涵蓋範圍）**：本頁。', '2. 歐洲其他海域（波羅的海、地中海等）。', '3. 浮動式風場的細分型式。',
                  '4. 台灣、日本、韓國、美國。', '5. 中國、越南：前四步完成後再決定。', '',
                  '還沒查到的離岸風場標「型式不詳」，不臆測。', '',
                  '## 來源與方法', '',
                  f'- **OSPAR Offshore Renewable Energy Developments 2024**（[ODIMS]({OSPAR_URL})，CC0，資料時間 2024-01-01）是唯一逐場列出基礎型式的開放資料。'
                  '取其中「營運中」的風機紀錄，逐筆比對本站風場的名稱、位置（OSPAR 範圍圖）與容量；`data/global/sources/ospar_offshore_renewables_2024.csv` 是取出的原始值。',
                  '- OSPAR 不一定是建成後的樣子：德國的紀錄有 10 筆只寫「單樁／三腳／三樁／套管／重力式／其他」任一種，Merkur、Veja Mate、Trianel Borkum II、alpha ventus '
                  '與建成紀錄不符；英國 Hornsea One 西區也不符。所以德國每一座都以德文維基百科（附建造紀錄）為準，其他不符的逐筆附第二來源與說明。',
                  '- 地圖上色依結構歸成四組（多於三種顏色在地圖上分不清）：單樁、鋼構框架（套管、三腳架、三樁）、浮動式、其他固定式（重力式、高樁承台、混合）；'
                  '風場卡片與本頁寫出確切型式。', '',
                  '## 各國進度（營運中的離岸風場）', '',
                  f'合計：已知型式 {tot[2]}／{tot[0]} 座，占容量 {tot[3] / tot[1] * 100:.1f}%（浮動式風場本來就知道是浮動式，細分型式在第 3 步補）。', '',
                  '| 國家 | 營運中 | 已知型式 | 占容量 | 單樁 | 鋼構框架 | 浮動式 | 其他固定式 |', '|---|---:|---:|---:|---:|---:|---:|---:|']
        else:
            L += ['# Offshore wind foundation types', '', 'English (this page) ｜ [中文](foundations.md)', '',
                  f'> Generated by `tools/build_foundations.py` from the per-farm table in `tools/farm_foundations.py`; do not edit by hand. Compiled: {ASOF}.', '',
                  'The globe’s Display menu has an “Offshore: foundations” layer that colours offshore farms by foundation type. '
                  'The data is collected step by step:', '',
                  '1. **North Sea and NE Atlantic (OSPAR coverage)**: this page.', '2. The rest of Europe (Baltic, Mediterranean and others).',
                  '3. Sub-types of floating farms.', '4. Taiwan, Japan, Korea and the USA.', '5. China and Vietnam: to be decided after the first four steps.', '',
                  'Offshore farms not yet checked are shown as “type unknown”, never guessed.', '',
                  '## Sources and method', '',
                  f'- **OSPAR Offshore Renewable Energy Developments 2024** ([ODIMS]({OSPAR_URL}), CC0, data as of 1 Jan 2024) is the only open dataset '
                  'with a foundation type per farm. Its operational wind records were matched one by one to the farms on this site by name, location '
                  '(OSPAR’s site outlines) and capacity; `data/global/sources/ospar_offshore_renewables_2024.csv` holds the values used.',
                  '- OSPAR does not always describe what was built: 10 German records only say “monopile/tripod/tripile/jacket/gravity-based/other”, and '
                  'Merkur, Veja Mate, Trianel Borkum II and alpha ventus differ from the construction records, as does the western part of Hornsea One in the UK. '
                  'So every German farm uses German Wikipedia (with construction records), and every other disagreement cites a second source with a note.',
                  '- The map folds the types into four colour groups by structure (more than three colours cannot be told apart on a map): monopile, steel frame '
                  '(jacket, tripod, tripile), floating, and other fixed-bottom (gravity-based, high-rise pile cap, mixed). Farm cards and this page give the exact type.', '',
                  '## Progress by country (operating offshore farms)', '',
                  f'Total: type known for {tot[2]} of {tot[0]} farms, {tot[3] / tot[1] * 100:.1f}% of their capacity (floating farms are known to be floating; their sub-types come in step 3).', '',
                  '| Country | Operating | Type known | Share of MW | Monopile | Steel frame | Floating | Other fixed |', '|---|---:|---:|---:|---:|---:|---:|---:|']
        for iso in sorted(per, key=lambda i: -per[i][1]):
            p = per[iso]
            if not p[2] and p[1] < 1:
                continue
            g = p[4]
            L.append(f'| {cname(iso)} | {p[0]} | {p[2]} | {pct(p[3], p[1]) if p[2] < p[0] else "100%"} | {g["mp"] or ""} | {g["frame"] or ""} | {g["fl"] or ""} | {g["other"] or ""} |')
        L += ['', '## ' + ('逐場清單' if zh else 'Farm by farm'), '']
        grouped = defaultdict(list)
        for name, rec in out.items():
            grouped[by_name[name][2]].append((name, rec))
        for iso in sorted(grouped, key=cname):
            L += ['### ' + cname(iso), '', '| ' + ('風場 | MW | 年份 | 型式 | 來源 | 說明' if zh else 'Farm | MW | Year | Type | Sources | Note') + ' |',
                  '|---|---:|---:|---|---|---|']
            for name, rec in sorted(grouped[iso], key=lambda x: x[0]):
                r = by_name[name]
                label = (r[1] + '（' + name + '）') if zh and r[1] else name
                typ = tname(rec['t'])
                if rec.get('p'):
                    typ += '：' if zh else ': '
                    typ += ('、' if zh else ', ').join(f'{tname(a)} {n}' for a, n, *_ in rec['p'])
                if rec.get('s'):
                    typ += f'（{SUBS[rec["s"]][0]}）' if zh else f' ({SUBS[rec["s"]][1]})'
                src = [f'[OSPAR {i}]({OSPAR_URL}) ' + (f'「{ospar[i]["Foundation/anchor type"] or "—"}」' if zh else f'“{ospar[i]["Foundation/anchor type"] or "—"}”')
                       for i in rec.get('o', [])]
                if rec.get('u'):
                    src.append(f'[{"第二來源" if zh else "second source"}]({rec["u"]})')
                note = rec.get('zh' if zh else 'en', '')
                year = r[6] or ('不詳' if zh else 'n/a')
                L.append(f'| {label} | {_fmt(r[5])} | {year} | {typ} | {"<br>".join(src)} | {note} |')
            L.append('')
        L += ['## ' + ('這一步刻意不列的風場' if zh else 'Left out on purpose in this step'), '',
              '| ' + ('風場 | OSPAR | 理由' if zh else 'Farm | OSPAR | Reason') + ' |', '|---|---|---|']
        for iso, name, ids, rzh, ren in EXCLUDED:
            L.append(f'| {cname(iso)} · {name} | {", ".join(ids)} | {rzh if zh else ren} |')
        L.append('')
        (ROOT / 'docs' / ('foundations.md' if zh else 'foundations.en.md')).write_text('\n'.join(L), encoding='utf-8')


if __name__ == '__main__':
    main()
