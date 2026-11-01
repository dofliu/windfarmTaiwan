#!/usr/bin/env python3
"""可能重複的營運中風場紀錄：同一國、名稱相同或幾乎相同（中國、印度、越南的拼音只認完全相同）、15 km 內、容量相差 10% 內、商轉年相差 2 年內。

    python3 tools/qa_dups.py [data/global/wind_farms.json] [--max N]

只列候選，不改資料：每一組要查證（出處原文以 check_quotes.py 核對）後才寫進 tools/farm_cleanup.py——
是同一座就加 dup() 規則，確認是不同風場就加進同一檔的 DUP_OK，之後不再列出。重建風場層後跑一次。
--max N：候選超過 N 組時結束碼為 1（給 CI 用）。

排除（不算重複）：
  · 兩筆都是 MaStR 新增的群組（來源代碼 4）：每部登記的風機只會分到一個群組，不會重複計算。
  · 兩筆都寫了期別而且不同（I／II、1／2、「· 1」／「· 2」、H6／H10、A 區／C 區、東／西）。
  · 名稱括號裡都寫了開發商、而且互不包含（例：太陽山（大唐）／太陽山（京能）是不同業主的風場）。
  · 兩筆都在共用代用點（flags 4）上：位置沒有意義，只有業主相同才列。

Possible duplicate operating farm records: same country, same or nearly the same name, within 15 km, capacity within 10% and start year
within 2 years. Candidates only: verify each pair with quoted sources, then add a dup() rule to tools/farm_cleanup.py (same farm) or put
the pair in DUP_OK there (different farms) so it is not listed again. In China, India and Vietnam only identical name stems count (romanised place names). Excluded: pairs of MaStR groups (each registered turbine is in one
group only), pairs with different explicit phase/area markers, pairs whose bracketed developers differ, and pairs on shared placeholder
points unless the owner is the same. --max N exits with 1 when there are more than N candidates.
"""
import difflib
import json
import math
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from farm_cleanup import DUP_OK  # noqa: E402


GENERIC = (r'\b(wind|farm|farms|windfarm|park|windpark|power|project|plant|energy|station|onshore|offshore|the|of|and|de|del|des|du|la|le|les|'
           r'el|los|las|di|da|do|und|am|im|an|parque|eolico|eolien|eolienne|centrale|vindpark|llc|inc|ltd|distributed)\b')
MARK = r'\b(i{1,3}|iv|v|vi{0,3}|ix|x|\d+[a-z]?|[a-z]\d+|area [a-z]|[a-z] area|north|south|east|west|nord|sud|est|ouest)\b'
EXACT = {'CHN', 'IND', 'VNM'}      # 拼音或轉寫：差一兩個字母就是不同地名，只認完全相同 · romanised place names: only identical stems count
ROMAN = {'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10'}


def load(path='data/global/wind_farms.json'):
    j = json.loads(Path(path).read_text(encoding='utf-8'))
    return [dict(zip(j['meta']['cols'], r)) for r in j['rows']]


def ascii_lower(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()


def base(n):
    s = ascii_lower(n.split('·')[0])
    s = re.sub(r'\(.*?\)', ' ', s)
    s = re.sub(r'[-_/,.\'"]', ' ', s)
    s = re.sub(GENERIC, ' ', s)
    return ' '.join(s.split())


def marks(n):
    s = base(n) + ' ' + ' '.join(re.findall(r'·\s*(\d+)', n))
    return tuple(sorted(ROMAN.get(m, m) for m in re.findall(MARK, s)))


def stem(n):
    return ' '.join(re.sub(MARK, ' ', base(n)).split())


def brackets(n):
    return [ascii_lower(x).strip() for x in re.findall(r'\(([^)]*)\)', n.split('·')[0])]


def km(a, b):
    p1, p2 = math.radians(a['lat']), math.radians(b['lat'])
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(b['lon'] - a['lon']) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def same_name(a, b):
    """兩個風場名稱是否可能指同一座（名稱主體相同或幾乎相同，期別與括號裡的開發商不衝突）· whether two farm names may be the same farm"""
    sa, sb = stem(a['name']), stem(b['name'])
    if len(sa) < 3 or len(sb) < 3:
        return False
    if sa != sb:
        if a['iso'] in EXACT:
            return False
        ta, tb = sa.split(), sb.split()
        da, db = ' '.join(t for t in ta if t not in tb), ' '.join(t for t in tb if t not in ta)
        if difflib.SequenceMatcher(None, da or sa, db or sb).ratio() < 0.8:
            return False
    ma, mb = marks(a['name']), marks(b['name'])
    if ma and mb and ma != mb:
        return False
    ba, bb = brackets(a['name']), brackets(b['name'])
    return not (ba and bb and not any(x in y or y in x for x in ba for y in bb))


def candidates(farms=None):
    OP = [f for f in (farms or load()) if f['st'] == 0 and not f['end'] and f['mw'] and f['lat'] is not None]
    grid = defaultdict(list)
    for f in OP:
        f['_s'] = stem(f['name'])
        grid[(f['iso'], round(f['lat'] * 5), round(f['lon'] * 5))].append(f)
    seen, out = set(), []
    for f in OP:
        if len(f['_s']) < 3:
            continue
        cx, cy = round(f['lat'] * 5), round(f['lon'] * 5)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for g in grid.get((f['iso'], cx + dx, cy + dy), []):
                    if g is f or len(g['_s']) < 3 or (id(g), id(f)) in seen:
                        continue
                    seen.add((id(f), id(g)))
                    if f['src'] == 4 and g['src'] == 4:
                        continue
                    if (f['type'] != 0) != (g['type'] != 0):
                        continue
                    if abs(f['mw'] - g['mw']) > 0.10 * max(f['mw'], g['mw']):
                        continue
                    if f['year'] and g['year'] and abs(f['year'] - g['year']) > 2:
                        continue
                    if not same_name(f, g):     # 只比不相同的字，省、縣等共同字首不拉高相似度 · differing words only, shared prefixes do not count
                        continue
                    if (f['flags'] or 0) & 4 and (g['flags'] or 0) & 4 and (f['owner'] or '').split('[')[0].strip() != (g['owner'] or '').split('[')[0].strip():
                        continue
                    d = km(f, g)
                    if d > 15:
                        continue
                    if frozenset((f['name'], g['name'])) in DUP_OK.get(f['iso'], set()):
                        continue
                    out.append((f['iso'], d, f, g))
    return sorted(out, key=lambda o: (o[0], -max(o[2]['mw'], o[3]['mw'])))


if __name__ == '__main__':
    ARGS = sys.argv[1:]
    MAX = None
    if '--max' in ARGS:
        i = ARGS.index('--max'); MAX = int(ARGS[i + 1]); del ARGS[i:i + 2]
    found = candidates(load(ARGS[0]) if ARGS else None)
    for iso, d, a, b in found:
        print(f"{iso} {d:5.1f} km | {a['name']} ({a['mw']:g} MW, {a['year'] or '?'}, src {a['src']}) = {b['name']} ({b['mw']:g} MW, {b['year'] or '?'}, src {b['src']})")
    print(f'{len(found)} candidate pairs of possibly duplicated operating farms')
    if MAX is not None and len(found) > MAX:
        sys.exit(1)
