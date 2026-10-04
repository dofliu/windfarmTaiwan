"""印出網頁（或 PDF）中含關鍵字的原文片段，供查證時挑選可引用的逐字原文 · Print passages around keywords from a page or PDF.

用法 · Usage:
  python3 tools/grab_page.py "<URL>" 關鍵字1 關鍵字2 ...
  （例 · e.g. python3 tools/grab_page.py "https://example.com/farm" 水深 轮毂 叶轮）

下載與轉文字沿用 tools/check_quotes.py（同一個快取資料夾），所以這裡看到的文字就是核對時比對的文字：
只引用它印出的連續片段，寫進查證 JSON 後再跑 check_quotes.py。LEN 很小或 ERR 代表抓不到，換出處。
Fetching and text extraction reuse tools/check_quotes.py (same cache folder), so the text shown here is the text the check
compares against: quote only a continuous passage it prints, then run check_quotes.py on the research JSON. A tiny LEN or an
ERR means the page could not be read; use another source.
"""
import html
import os
import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_quotes as cq  # noqa: E402

CACHE = os.path.join(tempfile.gettempdir(), 'windfarm_quote_cache')


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    url, kws = sys.argv[1], sys.argv[2:]
    os.makedirs(CACHE, exist_ok=True)
    try:
        t, err = cq.fetch(url, CACHE)
    except Exception as e:     # noqa: BLE001 — 網路或解析錯誤都只回報，不中止批次查證
        print('ERR', url, e)
        return
    if t is None:
        print('ERR', url, err)
        return
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t))
    t = re.sub(r'\s+', ' ', t)
    print('LEN', len(t), url)
    seen = set()
    for kw in kws:
        for m in re.finditer(re.escape(kw), t):
            a, b = max(0, m.start() - 120), min(len(t), m.end() + 120)
            if a // 200 in seen:           # 相鄰的命中只印一次 · print overlapping hits once
                continue
            seen.add(a // 200)
            print(' …' + t[a:b] + '…')


if __name__ == '__main__':
    main()
