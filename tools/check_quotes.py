#!/usr/bin/env python3
"""引用原文核對 · Check that quoted passages really appear on their source pages

查水下基礎型式（tools/farm_foundations.py）或風場更正（tools/farm_cleanup.py）時，每個出處都要附一段原文。
這支程式逐筆抓出處網頁，確認那段原文真的在頁面上：
  python3 tools/check_quotes.py research.json             # 印出每個出處的結果
  python3 tools/check_quotes.py research.json --write     # 另把結果寫回 JSON（每個出處加上 "check"）
research.json 是一個陣列，每筆 {"farm": "...", "sources": [{"url": "...", "quote": "..."}, ...]}（其他欄位不動）；
另有 "issue_sources"（資料問題的出處，同樣格式）時一併核對。
結果：OK（原文完整出現）、OK(parts)（以「…」分段的引文每段都在）、OK(nospace)（中日韓文去掉空白後相符）、
PARTIAL（只對到部分片段，要人工確認）、MISSING（沒找到）、ERR（抓不到網頁）。PARTIAL、MISSING、ERR 都不能直接採用。
網頁依 HTTP 標頭或網頁宣告的編碼解碼（Big5、GBK、Shift_JIS、EUC-JP、EUC-KR 等），PDF 需要 pypdf，Word 檔直接讀。
抓過的網頁存在暫存資料夾（--cache 可指定），重跑時不再下載。

For every source cited while researching foundation types or farm fixes, fetch the page and confirm the quoted passage is
on it. Input: a JSON array of {"farm": ..., "sources": [{"url": ..., "quote": ...}]} ("issue_sources", the sources for data problems,
are checked too when present). Results: OK, OK(parts) (every part
of a quote split by "…" is there), OK(nospace) (matches once whitespace is removed, for CJK text), PARTIAL (only some
fragments match; check by hand), MISSING, ERR (page could not be fetched). Only OK results may be used as they are.
Pages are decoded with the charset from the HTTP header or the page itself; PDFs need pypdf. Fetched pages are cached.
"""
import argparse
import gzip
import hashlib
import html
import io
import json
import os
import re
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.request
import zlib
from pathlib import Path

UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
# 有些網站擋瀏覽器樣式的 User-Agent（回 403），美國 SEC 要求自報身分：依序改用這些再試
UA_FALLBACK = ('curl/8.0', 'windfarmTaiwan-research/1.0 (+https://github.com/dofliu/windfarmTaiwan)')
CHARSETS = ('utf-8', 'big5', 'gb18030', 'shift_jis', 'euc-jp', 'cp949')     # 標頭與網頁都沒寫編碼時依序嘗試
LANG_FIRST = {'ko': ('cp949',), 'ja': ('shift_jis', 'euc-jp'), 'zh-cn': ('gb18030',), 'zh-hans': ('gb18030',),
              'zh-tw': ('big5',), 'zh-hant': ('big5',)}                        # 依網頁的 lang 屬性先試的編碼


def to_text(b, charset=None):
    """把下載的內容轉成純文字：PDF、Word 檔、HTML（依編碼）"""
    if b[:4] == b'%PDF':
        sys.modules.setdefault('cryptography', None)     # 部分環境的 cryptography 會讓 pypdf 匯入失敗；讀一般 PDF 用不到
        import logging
        import pypdf
        logging.getLogger('pypdf').setLevel(logging.ERROR)   # 字型解析的警告與文字比對無關
        t = '\n'.join((p.extract_text() or '') for p in pypdf.PdfReader(io.BytesIO(b)).pages)
        return re.sub(r'(\w)-\n(\w)', r'\1\2', t)     # 行尾斷字
    if b[:2] == b'PK':
        import zipfile
        z = zipfile.ZipFile(io.BytesIO(b))
        if 'word/document.xml' in z.namelist():
            x = z.read('word/document.xml').decode('utf-8', 'replace')
            return html.unescape(re.sub(r'<[^>]+>', '', x.replace('</w:p>', '\n')))
    m = re.search(rb'<meta[^>]+charset=["\']?([A-Za-z0-9_\-]+)', b[:4000], re.I)
    lang = re.search(rb'<html[^>]+lang=["\']?([A-Za-z\-]+)', b[:4000], re.I)
    lang = lang.group(1).decode().lower() if lang else ''
    first = LANG_FIRST.get(lang) or LANG_FIRST.get(lang.split('-')[0], ())
    t = None
    for cs in [charset, m.group(1).decode() if m else None, 'utf-8', *first, *CHARSETS]:
        if not cs:
            continue
        try:
            t = b.decode(cs)
            break
        except (UnicodeDecodeError, LookupError):
            continue
    if t is None:
        t = b.decode('utf-8', 'replace')
    t = re.sub(r'(?is)<(script|style|noscript)[^>]*>.*?</\1>', ' ', t)
    return html.unescape(re.sub(r'(?s)<[^>]+>', ' ', t))


def fetch(url, cache):
    """抓網頁（有快取），回傳 (文字, 錯誤訊息)"""
    fn = Path(cache) / (hashlib.md5(url.encode()).hexdigest() + '.txt')
    if fn.exists():
        return fn.read_text(encoding='utf-8'), None
    last = None
    tries = [(UA, 'gzip, deflate'), (UA, 'identity')] + [(ua, 'identity') for ua in UA_FALLBACK]
    for n, (ua, enc) in enumerate(tries * 2):      # 有些伺服器不理會 Accept-Encoding，送回 br 等格式時改要求不壓縮
        if n == len(tries):
            time.sleep(3)                         # 偶發的 403／429：整輪失敗後等一下再試一輪
        req = urllib.request.Request(url, headers={'User-Agent': ua, 'Accept-Encoding': enc,
                                                   'Accept-Language': 'en,zh-TW;q=0.8,ja;q=0.6,ko;q=0.5,de;q=0.4'})
        try:
            r = urllib.request.urlopen(req, timeout=60)
            b = r.read()
            ce = r.headers.get('Content-Encoding', '')
            if ce == 'gzip':
                b = gzip.decompress(b)
            elif ce == 'deflate':
                b = zlib.decompress(b)
            elif ce not in ('', 'identity'):
                raise ValueError('content encoding ' + ce)
            t = to_text(b, r.headers.get_content_charset())
            fn.write_text(t, encoding='utf-8')
            time.sleep(1)
            return t, None
        except urllib.error.HTTPError as e:
            last = f'HTTP {e.code}'
            if e.code not in (403, 406, 429):
                return None, last
        except Exception as e:     # noqa: BLE001 — 網路錯誤、編碼錯誤都記下來，換下一種方式再試
            last = str(e)[:80]
    return None, last


def norm(s):
    s = unicodedata.normalize('NFKC', s).lower().replace('­', '')
    s = re.sub(r'[‘’‚‛\'`´]', "'", s)
    s = re.sub(r'[“”„‟"«»「」『』]', '"', s)
    s = re.sub(r'[‐-―−]', '-', s)
    s = re.sub(r'\[\d+\]', '', s)          # 維基百科的註腳編號
    return re.sub(r'\s+', ' ', s).strip()


def check(page, quote):
    P, Q = norm(page), norm(quote)
    if not Q:
        return 'MISSING'
    if Q in P:
        return 'OK'
    parts = [x.strip() for x in re.split(r'\[?(?:\.\.\.|…)\]?', Q) if len(x.strip()) > 15]
    if len(parts) > 1 and all(x in P for x in parts):
        return 'OK(parts)'
    if re.sub(r'\s+', '', Q) in re.sub(r'\s+', '', P):
        return 'OK(nospace)'
    words = Q.split()
    for n in (12, 8, 6):
        if len(words) >= n:
            starts = range(0, len(words) - n + 1, max(1, n // 2))
            hits = sum(1 for i in starts if ' '.join(words[i:i + n]) in P)
            if hits and hits >= len(starts) * 0.6:
                return f'PARTIAL({hits}/{len(starts)} {n}-grams)'
    return 'MISSING'


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('json', help='research JSON: [{"farm": ..., "sources": [{"url": ..., "quote": ...}]}]')
    ap.add_argument('--write', action='store_true', help='write the result of each source back into the JSON as "check"')
    ap.add_argument('--cache', default=os.path.join(tempfile.gettempdir(), 'windfarm_quote_cache'), help='page cache folder')
    a = ap.parse_args()
    os.makedirs(a.cache, exist_ok=True)
    data = json.loads(Path(a.json).read_text(encoding='utf-8'))
    bad = 0
    for item in data:
        for s in item.get('sources', []) + item.get('issue_sources', []):
            page, err = fetch(s['url'], a.cache)
            st = ('ERR ' + err) if err else check(page, s.get('quote', ''))
            s['check'] = st
            bad += not st.startswith('OK')
            print(f"{str(item.get('farm', ''))[:44]:44} {st:24} {s['url'][:110]}")
    if a.write:
        Path(a.json).write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{bad} source(s) not confirmed' if bad else 'all quotes confirmed')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
