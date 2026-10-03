#!/usr/bin/env python3
"""離岸風場水下基礎型式 → data/global/foundations.json（地球儀「水下基礎」圖層）＋ docs/foundations.md、docs/foundations.en.md

    python3 tools/build_foundations.py

讀 tools/farm_foundations.py 的逐場對照表，逐條檢查後輸出；有錯誤時以非零狀態結束、不寫檔。
  · 風場要在 data/global/wind_farms.json 裡、國別相同，而且是離岸或浮動式；浮動式風場的型式一定是 fl，固定式不可以是 fl
  · 型式、細分型式、混合型的組成要是已定義的代碼；同一座風場不可出現兩次
  · 引用的 OSPAR 紀錄要存在（data/global/sources/ospar_offshore_renewables_2024.csv，由 ODIMS 的 xlsx 取出風機列）；
    OSPAR 的值與表上的型式不相符、或 OSPAR 沒有具體型式時，該列必須附第二來源（url）與中英文說明
  · OSPAR 紀錄還在核准階段（Current Status 不是 operational 或 decommissioned，只是設計）時，一定要附施工紀錄（url）
只用 Python 標準函式庫。wind_farms.json 重建後（風場改名或刪除）要再跑一次；對不到會中止，請重新查證。

Offshore foundation types → data/global/foundations.json (the globe's foundation layer) and the generated
docs/foundations.md / docs/foundations.en.md. Checks every row of tools/farm_foundations.py and stops on errors.
"""
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from farm_foundations import ASOF, EXCLUDED, FLOAT_SUBS, FOUNDATIONS, OSPAR_URL, SUBS, TYPES  # noqa: E402
from farm_dimensions import DIMENSIONS, DIMS_ASOF  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FARMS = ROOT / 'data/global/wind_farms.json'
OSPAR_CSV = ROOT / 'data/global/sources/ospar_offshore_renewables_2024.csv'
OUT = ROOT / 'data/global/foundations.json'
YEAR = 2025                                   # 報告的「營運中」＝時間軸終點仍在運轉
BUILT = ('operational', 'decommissioned')          # OSPAR 其他狀態（authorised、application…）只是設計，不一定照建
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
    STEP = max(r['step'] for r in FOUNDATIONS)          # 對照表已做到第幾步
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
        if STEP >= 3 and t == 'fl' and rule['sub'] not in FLOAT_SUBS and not (rule['zh'] and rule['en']):   # 第 3 步起
            errors.append(f'{tag}: a floating farm needs a floating sub-type ({"/".join(FLOAT_SUBS)}) or a zh/en note explaining why not')
        if t != 'fl' and rule['sub'] in FLOAT_SUBS:
            errors.append(f'{tag}: {rule["sub"]!r} is a floating sub-type')
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
            if o['Current Status'] not in BUILT and not rule['url']:
                errors.append(f'{tag}: OSPAR record {oid} is only at the {o["Current Status"]} stage; a construction source (url) is required')
            c = ospar_codes(o['Foundation/anchor type'])
            if c in (None, 'any'):
                continue
            specific = True
            want = {p[0] for p in rule['parts']} if t == 'mx' else {t}
            if not (want <= c if t == 'mx' else t in c):
                agree = False
        if rule['ospar'] and (not agree or not specific) and not (rule['url'] and rule['zh'] and rule['en']):
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
    # 尺寸（水深、輪轂高度、葉輪直徑）：只接受已在對照表裡的風場，數值要合理，每列要有出處
    seen_d, dims_n = set(), 0
    for d in DIMENSIONS:
        tag = f"dims {d['iso']} {d['name']}"
        if d['name'] not in out:
            errors.append(f'{tag}: not in the foundation table (add the foundation row first)'); continue
        if farms[d['name']][2] != d['iso']:
            errors.append(f'{tag}: country is {farms[d["name"]][2]} in wind_farms.json')
        if d['name'] in seen_d:
            errors.append(f'{tag}: listed twice')
        seen_d.add(d['name'])
        if not d['url']:
            errors.append(f'{tag}: needs a source url')
        dep, hub, rot = d['depth'], d['hub'], d['rotor']
        if dep is not None and not (isinstance(dep, list) and len(dep) == 2 and all(isinstance(v, (int, float)) for v in dep) and 0 <= dep[0] <= dep[1] <= 400):
            errors.append(f'{tag}: depth must be [min, max] in metres (0–400), got {dep!r}')
        hv = hub if isinstance(hub, list) else ([hub, hub] if hub is not None else None)
        if hv is not None and not (len(hv) == 2 and all(isinstance(v, (int, float)) for v in hv) and 15 <= hv[0] <= hv[1] <= 250):
            errors.append(f'{tag}: hub height must be a value or [min, max] in metres (15–250), got {hub!r}')
        if rot is not None and not (isinstance(rot, (int, float)) and 20 <= rot <= 350):
            errors.append(f'{tag}: rotor diameter must be in metres (20–350), got {rot!r}')
        if d['hub_kind'] not in ('hub', 'tower'):
            errors.append(f'{tag}: hub_kind must be hub or tower')
        if dep is None and hub is None and rot is None:
            errors.append(f'{tag}: no values'); continue
        rec = out[d['name']]
        if dep is not None:
            rec['d'] = dep
        if hub is not None:
            rec['h'] = hub
            if d['hub_kind'] == 'tower':
                rec['hk'] = 'tower'
        if rot is not None:
            rec['r'] = rot
        rec['du'] = d['url']
        if d['zh'] or d['en']:
            rec['dz'], rec['de'] = d['zh'], d['en']
        dims_n += 1
    excluded = {}
    for iso, name, ids, zh, en in EXCLUDED:
        if name not in farms:
            errors.append(f'excluded {iso} {name}: not in wind_farms.json')
        elif farms[name][2] != iso:
            errors.append(f'excluded {iso} {name}: country is {farms[name][2]} in wind_farms.json')
        if name in out:
            errors.append(f'excluded {iso} {name}: also classified')
        for oid in ids:
            if oid not in ospar:
                errors.append(f'excluded {iso} {name}: OSPAR record {oid} not found')
        excluded[name] = [zh, en]
    if errors:
        for e in errors:
            print('ERROR', e)
        sys.exit(1)

    meta = {
        'asof': ASOF, 'step': max(r['step'] for r in FOUNDATIONS),
        'types': {k: list(v) for k, v in TYPES.items()}, 'subs': {k: list(v) for k, v in SUBS.items()},
        'ospar': {'title': 'OSPAR Offshore Renewable Energy Developments 2024', 'url': OSPAR_URL, 'licence': 'CC0 1.0', 'asof': '2024-01-01'},
        'note': NOTE[max(r['step'] for r in FOUNDATIONS)],
        'dims': {'asof': DIMS_ASOF, 'n': dims_n},
    }
    # x：查過但找不到可引用出處、刻意不列的風場與理由（風場卡片會顯示）
    OUT.write_text(json.dumps({'meta': meta, 'farms': out, 'x': excluded}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    write_docs(rows, out, ospar, countries)
    ops = [r for r in rows if r[7] in (1, 2) and r[8] == 0 and not (r[9] and r[9] <= YEAR)]
    cls = [r for r in ops if r[0] in out or r[7] == 2]
    mw = lambda rs: sum(r[5] for r in rs)
    print(f'{len(out)} farms classified ({dict(Counter(v["t"] for v in out.values()))}); '
          f'operating offshore with a known type: {len(cls)}/{len(ops)} farms, {mw(cls) / mw(ops) * 100:.1f}% of MW; wrote {OUT.relative_to(ROOT)}')


NAMES = {'ALA': ('奧蘭', 'Åland')}     # wind_global.json 沒有國家資料的地區
N5 = sum(1 for r in FOUNDATIONS if r['step'] == 5 and r['iso'] == 'CHN')   # 第 5 步已補的中國風場數
NOTE = {   # 依對照表已完成到第幾步
    1: ['逐步收集中：第 1 步為 OSPAR 涵蓋的北海與東北大西洋（2026-09）；其他海域的離岸風場暫列「型式不詳」',
        'Collected step by step: step 1 covers the North Sea and NE Atlantic within OSPAR (Sep 2026); '
        'offshore farms elsewhere are shown as “type unknown” for now'],
    2: ['逐步收集中：第 1、2 步為歐洲（北海、東北大西洋、波羅的海、地中海等，2026-09）；其他地區的離岸風場暫列「型式不詳」',
        'Collected step by step: steps 1 and 2 cover Europe (North Sea, NE Atlantic, Baltic, Mediterranean and others; Sep 2026); '
        'offshore farms elsewhere are shown as “type unknown” for now'],
    3: ['逐步收集中：第 1、2 步為歐洲，第 3 步為全球浮動式風場的細分型式（2026-09）；其他地區的固定式離岸風場暫列「型式不詳」',
        'Collected step by step: steps 1 and 2 cover Europe and step 3 the sub-types of floating farms worldwide (Sep 2026); '
        'fixed-bottom offshore farms elsewhere are shown as “type unknown” for now'],
    4: ['逐步收集中：第 1、2 步為歐洲，第 3 步為全球浮動式風場的細分型式，第 4 步為台灣、日本、韓國、美國（2026-09）；'
        '中國、越南等其他地區的固定式離岸風場暫列「型式不詳」',
        'Collected step by step: steps 1 and 2 cover Europe, step 3 the sub-types of floating farms worldwide and step 4 Taiwan, Japan, '
        'Korea and the USA (Sep 2026); fixed-bottom offshore farms elsewhere, such as in China and Vietnam, are shown as “type unknown” for now'],
    5: ['逐步收集中：第 1、2 步為歐洲，第 3 步為全球浮動式風場的細分型式，第 4 步為台灣、日本、韓國、美國；第 5 步（中國、越南）進行中，'
        f'已依使用者的逐案覆核補上中國 {N5} 座（2026-09）；其他仍暫列「型式不詳」',
        'Collected step by step: steps 1 and 2 cover Europe, step 3 the sub-types of floating farms worldwide and step 4 Taiwan, Japan, '
        f'Korea and the USA; step 5 (China and Vietnam) is under way, with {N5} Chinese farms added from the owner’s case-by-case review '
        '(Sep 2026); the rest are shown as “type unknown” for now'],
}


def pct(a, b):
    """占比：沒有全部分類就不顯示 100%"""
    x = a / b * 100 if b else 0
    return '100%' if a >= b else ('<1%' if 0 < x < 1 else f'{min(int(x), 99)}%')


def host(u):
    return urlparse(u).netloc.removeprefix('www.')


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
    done = max(r['step'] for r in FOUNDATIONS)
    for lang in ('zh', 'en'):
        zh = lang == 'zh'
        cname = lambda iso: ((countries[iso].get('zh') or countries[iso]['name']) if zh else countries[iso]['name']) if iso in countries else NAMES.get(iso, (iso, iso))[0 if zh else 1]
        tname = lambda t: TYPES[t][0 if zh else 1]
        L = []
        if zh:
            L += ['# 離岸風場水下基礎型式', '', '[English](foundations.en.md) ｜ 中文（本頁）', '',
                  f'> 由 `tools/build_foundations.py` 依 `tools/farm_foundations.py` 的逐場對照表產生，請勿手動編輯。整理時間：{ASOF}。', '',
                  '地球儀的「顯示」選單有「離岸：水下基礎」圖層，依基礎型式為離岸風場上色。資料一步一步收集：',
                  '', '1. **北海與東北大西洋（OSPAR 涵蓋範圍）**：已完成（2026-09）。',
                  '2. **歐洲其他風場**（波羅的海、地中海、艾瑟爾湖，以及 OSPAR 2024 之後才完工的風場）：' + ('已完成（2026-09）。' if done >= 2 else '進行中。'),
                  '3. **浮動式風場的細分型式**（全球）：' + ('已完成（2026-09）。' if done >= 3 else '進行中。'),
                  '4. **台灣、日本、韓國、美國**：' + ('已完成（2026-09）。' if done >= 4 else '進行中。'),
                  '5. **中國、越南**：' + (f'進行中：已依使用者 2026-09 的逐案覆核補上中國 {N5} 座，出處原文待核對。' if done >= 5 else '前四步完成後再決定。'), '',
                  '本頁是' + {1: '第 1 步', 2: '前兩步', 3: '前三步', 4: '前四步', 5: '前四步與第 5 步已完成部分'}[done] + '的結果。還沒查到的離岸風場標「型式不詳」，不臆測。', '',
                  '## 來源與方法', '',
                  f'- **OSPAR Offshore Renewable Energy Developments 2024**（[ODIMS]({OSPAR_URL})，CC0，資料時間 2024-01-01）是唯一逐場列出基礎型式的開放資料。'
                  '取其中「營運中」的風機紀錄，逐筆比對本站風場的名稱、位置（OSPAR 範圍圖）與容量；`data/global/sources/ospar_offshore_renewables_2024.csv` 是取出的原始值。',
                  '- OSPAR 不一定是建成後的樣子：德國的紀錄有 10 筆只寫「單樁／三腳／三樁／套管／重力式／其他」任一種，Merkur、Veja Mate、Trianel Borkum II、alpha ventus '
                  '與建成紀錄不符；英國 Hornsea One 西區也不符。所以德國每一座都以德文維基百科（附建造紀錄）為準，其他不符的逐筆附第二來源與說明。',
                  *(['- **第 2 步**：OSPAR 不涵蓋波羅的海與地中海，2024 年以後才完工的風場也只有核准階段的設計（設計可能改變）。這些風場逐座查開發商、施工廠商、'
                     '產業新聞、政府文件或維基百科，每座都附出處，引用的原文逐筆核對過；OSPAR 有核准階段紀錄的，一律再附施工紀錄（建置時檢查）。'] if done >= 2 else []),
                  *(['- **第 3 步**：全球的浮動式風場補上細分型式：單柱式（spar）、半潛式、駁船式（含阻尼池式）、張力腳平台，逐座查技術供應商、開發商或產業新聞，'
                     '引用的原文逐筆核對過；同一筆紀錄含不同型式的機組時，在說明欄逐部寫出。'] if done >= 3 else []),
                  *(['- **第 4 步**：台灣、日本、韓國、美國的離岸風場都沒有 OSPAR 紀錄，逐座查開發商、施工廠商、政府文件或產業新聞，'
                     '引用的原文逐筆核對過（日文、韓文網頁依網頁編碼比對，PDF 逐頁比對），不引用 4C Offshore；日本港灣內的風場以 NEDO 的'
                     '支持構造分類為準（NEDO 明寫「ドルフィン」就是 High-Rise Pile Cap 高樁承台）。查不到型式的列在下方「查過但暫不列入」。'] if done >= 4 else []),
                  *([f'- **第 5 步（進行中）**：依使用者 2026-09-27 整理的《全球離岸風場資料庫｜亞洲查核版 v2》「亞洲逐案覆核」補上中國 {N5} 座，'
                     '出處為該表各列的第一手來源（三峽集團、上海市政府、中廣核）；這批原文尚未以 `tools/check_quotes.py` 核對（整理時的工作環境無法連線），'
                     '列在 TODO 待補。越南各案該表只寫潮間帶／近岸、細分待查，未列入。新增「複合筒」型式，歸在「其他固定式」色組。'] if done >= 5 else []),
                  '- 下表「來源」欄：OSPAR 紀錄附上它寫的原值；其他連結是第二來源，或沒有 OSPAR 紀錄時的出處。',
                  f'- **水深、輪轂高度、葉輪直徑**（{DIMS_ASOF} 起，`tools/farm_dimensions.py`）：逐座查維基百科（含英文維基百科各國離岸風場清單的「Depth range」欄）、開發商、風機廠商、政府文件或產業新聞，引用的原文逐筆核對過；查不到的留空，不用典型值推估。下表的「水深／輪轂／葉輪」欄即為這些值；地球儀的風場卡片剖面圖與近景風機依這些值等比例繪製。',
                  '- 地圖上色依結構歸成四組（多於三種顏色在地圖上分不清）：單樁、鋼構框架（套管、三腳架、三樁）、浮動式、其他固定式（重力式、高樁承台、圍堰式、岩錨式、複合筒、混合）；'
                  '風場卡片與本頁寫出確切型式。', '',
                  '## 各國進度（營運中的離岸風場）', '',
                  f'合計：已知型式 {tot[2]}／{tot[0]} 座，占容量 {tot[3] / tot[1] * 100:.1f}%（浮動式風場本來就知道是浮動式，'
                  + ('細分型式見下方「浮動式風場」）。' if done >= 3 else '細分型式在第 3 步補）。'), '',
                  '| 國家 | 營運中 | 已知型式 | 占容量 | 單樁 | 鋼構框架 | 浮動式 | 其他固定式 |', '|---|---:|---:|---:|---:|---:|---:|---:|']
        else:
            L += ['# Offshore wind foundation types', '', 'English (this page) ｜ [中文](foundations.md)', '',
                  f'> Generated by `tools/build_foundations.py` from the per-farm table in `tools/farm_foundations.py`; do not edit by hand. Compiled: {ASOF}.', '',
                  'The globe’s Display menu has an “Offshore: foundations” layer that colours offshore farms by foundation type. '
                  'The data is collected step by step:', '',
                  '1. **North Sea and NE Atlantic (OSPAR coverage)**: done (Sep 2026).',
                  '2. **The rest of Europe** (the Baltic, the Mediterranean and the IJsselmeer, plus farms finished after OSPAR 2024): ' + ('done (Sep 2026).' if done >= 2 else 'in progress.'),
                  '3. **Sub-types of floating farms** (worldwide): ' + ('done (Sep 2026).' if done >= 3 else 'in progress.'),
                  '4. **Taiwan, Japan, Korea and the USA**: ' + ('done (Sep 2026).' if done >= 4 else 'in progress.'),
                  '5. **China and Vietnam**: ' + (f'under way: {N5} Chinese farms added from the owner’s case-by-case review of Sep 2026; their quoted passages are still to be checked.' if done >= 5 else 'to be decided after the first four steps.'), '',
                  'This page shows the results of ' + ('step 1' if done == 1 else 'steps 1–4 and the part of step 5 done so far' if done == 5 else f'steps 1–{done}') + '. Offshore farms not yet checked are shown as “type unknown”, never guessed.', '',
                  '## Sources and method', '',
                  f'- **OSPAR Offshore Renewable Energy Developments 2024** ([ODIMS]({OSPAR_URL}), CC0, data as of 1 Jan 2024) is the only open dataset '
                  'with a foundation type per farm. Its operational wind records were matched one by one to the farms on this site by name, location '
                  '(OSPAR’s site outlines) and capacity; `data/global/sources/ospar_offshore_renewables_2024.csv` holds the values used.',
                  '- OSPAR does not always describe what was built: 10 German records only say “monopile/tripod/tripile/jacket/gravity-based/other”, and '
                  'Merkur, Veja Mate, Trianel Borkum II and alpha ventus differ from the construction records, as does the western part of Hornsea One in the UK. '
                  'So every German farm uses German Wikipedia (with construction records), and every other disagreement cites a second source with a note.',
                  *(['- **Step 2**: OSPAR does not cover the Baltic or the Mediterranean, and for farms finished after 2024 it only has the consented design, which '
                     'can change. These farms were checked one by one against developers, construction contractors, trade press, government documents or Wikipedia; '
                     'every farm cites a source, and each quoted passage was checked against the page. Where OSPAR has a consent-stage record, a construction source '
                     'is always added (the build checks this).'] if done >= 2 else []),
                  *(['- **Step 3**: floating farms worldwide get their sub-type: spar, semi-submersible, barge (including damping-pool hulls) or '
                     'tension-leg platform, checked one by one against technology providers, developers or trade press, with every quoted passage '
                     'checked against the page; where one record holds units of different types, the note lists them.'] if done >= 3 else []),
                  *(['- **Step 4**: no offshore farm in Taiwan, Japan, Korea or the USA has an OSPAR record, so each was checked one by one against '
                     'developers, construction contractors, government documents and trade press, with every quoted passage checked against the page '
                     '(Japanese and Korean pages in their own encodings, PDFs page by page) and 4C Offshore never cited; farms inside Japanese ports '
                     'follow NEDO’s classification of support structures (NEDO states that a “dolphin” is a High-Rise Pile Cap). Farms whose type '
                     'could not be found are under “Checked but left out for now” below.'] if done >= 4 else []),
                  *([f'- **Step 5 (under way)**: {N5} Chinese farms were added from the “Asia case-by-case review” in the owner’s compilation of '
                     '27 Sep 2026, citing that sheet’s first-hand sources (China Three Gorges, the Shanghai government, CGN); their quoted passages '
                     'have not yet been checked with `tools/check_quotes.py` (the working environment had no network access) and are listed '
                     'in TODO. The Vietnamese cases there only say intertidal / nearshore, sub-type unconfirmed, so none were added. A new '
                     '“composite bucket” type joins the “other fixed-bottom” colour group.'] if done >= 5 else []),
                  '- In the Sources column below, OSPAR records show the value OSPAR gives; other links are second sources, or the source itself where OSPAR has no record.',
                  f'- **Water depth, hub height and rotor diameter** (from {DIMS_ASOF}, `tools/farm_dimensions.py`): checked farm by farm against Wikipedia (including the “Depth range” column of the English Wikipedia lists of offshore wind farms by country), developers, turbine makers, government documents or trade press, with every quoted passage verified; unknown values are left blank, never filled with typical values. The “Depth / Hub / Rotor” columns below hold these values, and the globe’s farm-card cross-section and close-up turbines are drawn to scale from them.',
                  '- The map folds the types into four colour groups by structure (more than three colours cannot be told apart on a map): monopile, steel frame '
                  '(jacket, tripod, tripile), floating, and other fixed-bottom (gravity-based, high-rise pile cap, cofferdam, rock-anchored, composite bucket, mixed). Farm cards and this page give the exact type.', '',
                  '## Progress by country (operating offshore farms)', '',
                  f'Total: type known for {tot[2]} of {tot[0]} farms, {tot[3] / tot[1] * 100:.1f}% of their capacity (floating farms are known to be floating; '
                  + ('their sub-types are under “Floating farms” below).' if done >= 3 else 'their sub-types come in step 3).'), '',
                  '| Country | Operating | Type known | Share of MW | Monopile | Steel frame | Floating | Other fixed |', '|---|---:|---:|---:|---:|---:|---:|---:|']
        for iso in sorted(per, key=lambda i: -per[i][1]):
            p = per[iso]
            if not p[2] and p[1] < 1:
                continue
            g = p[4]
            L.append(f'| {cname(iso)} | {p[0]} | {p[2]} | {pct(p[3], p[1]) if p[2] < p[0] else "100%"} | {g["mp"] or ""} | {g["frame"] or ""} | {g["fl"] or ""} | {g["other"] or ""} |')
        if done >= 3:
            fl_ops = [r for r in ops if r[7] == 2]
            sc = Counter((out.get(r[0]) or {}).get('s') or '?' for r in fl_ops)
            order = [k for k in FLOAT_SUBS if sc.get(k)] + (['?'] if sc.get('?') else [])
            label = lambda k: (('細分型式不詳或混合' if zh else 'sub-type unknown or mixed') if k == '?' else SUBS[k][0 if zh else 1])
            L += ['', '## ' + ('浮動式風場（營運中）' if zh else 'Floating farms (operating)'), '',
                  (f'共 {len(fl_ops)} 座、{sum(r[5] for r in fl_ops):,.1f} MW：' if zh else f'{len(fl_ops)} farms, {sum(r[5] for r in fl_ops):,.1f} MW: ')
                  + ('、' if zh else ', ').join(f'{label(k)} {sc[k]}' for k in order) + ('。' if zh else '.')]
        L += ['', '## ' + ('逐場清單' if zh else 'Farm by farm'), '']
        grouped = defaultdict(list)
        for name, rec in out.items():
            grouped[by_name[name][2]].append((name, rec))
        for iso in sorted(grouped, key=cname):
            L += ['### ' + cname(iso), '', '| ' + ('風場 | MW | 年份 | 型式 | 水深 m | 輪轂 m | 葉輪 m | 來源 | 說明' if zh else 'Farm | MW | Year | Type | Depth m | Hub m | Rotor m | Sources | Note') + ' |',
                  '|---|---:|---:|---|---:|---:|---:|---|---|']
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
                    src.append(f'[{host(rec["u"])}]({rec["u"]})')
                note = rec.get('zh' if zh else 'en', '')
                if rec.get('du') and rec['du'] != rec.get('u'):
                    src.append(f'[{host(rec["du"])}]({rec["du"]})')
                if rec.get('dz' if zh else 'de'):
                    note = (note + ('；' if zh else '; ') if note else '') + rec['dz' if zh else 'de']
                rng = lambda v: ('' if v is None else (f'{v[0]:g}–{v[1]:g}' if isinstance(v, list) and v[0] != v[1] else f'{(v[0] if isinstance(v, list) else v):g}'))
                dep_s, hub_s, rot_s = rng(rec.get('d')), rng(rec.get('h')) + (('（塔高）' if zh else ' (tower)') if rec.get('hk') == 'tower' and rec.get('h') is not None else ''), rng(rec.get('r'))
                year = r[6] or ('不詳' if zh else 'n/a')
                L.append(f'| {label} | {_fmt(r[5])} | {year} | {typ} | {dep_s} | {hub_s} | {rot_s} | {"<br>".join(src)} | {note} |')
            L.append('')
        L += ['## ' + ('查過但暫不列入的風場' if zh else 'Checked but left out for now'), '',
              '| ' + ('風場 | OSPAR | 理由' if zh else 'Farm | OSPAR | Reason') + ' |', '|---|---|---|']
        for iso, name, ids, rzh, ren in EXCLUDED:
            L.append(f'| {cname(iso)} · {name} | {", ".join(ids) or "—"} | {rzh if zh else ren} |')
        L.append('')
        (ROOT / 'docs' / ('foundations.md' if zh else 'foundations.en.md')).write_text('\n'.join(L), encoding='utf-8')


if __name__ == '__main__':
    main()
