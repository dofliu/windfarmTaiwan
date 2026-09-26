#!/usr/bin/env python3
"""產生單檔版 HTML：把整個網站（首頁、台灣即時、全球 3D 地球儀、風電知識）打包成一個可下載、
直接用瀏覽器開啟的檔案。

    python3 tools/build_standalone.py            # 輸出 standalone/windfarmTaiwan-standalone.html

內嵌的內容：
    - site.css 與五個頁面程式（直接執行）
    - 地球儀的 globe.css、three.js、OrbitControls、globe.js（進入全球頁時才執行，與網站相同）
    - 全球資料（國家逐年容量、風場、國界）與 2k 地形／衛星底圖
    - 台灣與澳洲、加拿大即時資料的快照（建置當下）

單檔版連網時會向正式網站抓最新的即時資料，離線時改用快照並標示「離線快照」。
Leaflet 地圖、Esri 高解析圖磚與維基百科簡介需要連網。
只用 Python 標準函式庫；網站程式或 data/global/ 有變更時，GitHub Actions（build-standalone.yml）會自動重建。
"""
import base64
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "standalone" / "windfarmTaiwan-standalone.html"
SITE = "https://dofliu.github.io/windfarmTaiwan/"

PAGE_SCRIPTS = ["assets/js/core.js", "assets/js/charts.js", "assets/js/live.js", "assets/js/home.js", "assets/js/learn.js"]
LAZY = ["assets/css/globe.css", "assets/vendor/three-r128.min.js", "assets/vendor/OrbitControls-r128.js", "assets/js/globe.js"]
DATA = ["data/global/wind_global.json", "data/global/wind_farms.json", "data/global/world_borders.json", "data/global/ports.json"]
LIVE = ["wind_realtime.json", "wind_history.json", "grid_status.json", "wind_archive_daily.json", "data/live/intl_realtime.json"]
IMAGES = ["assets/img/globe/relief_2k.jpg", "assets/img/globe/sat_2k.jpg"]


def read(p):
    return (ROOT / p).read_text(encoding="utf-8")


def script_safe(text, where):
    """放進 <script> 的文字不能出現 </script 或 <!--（會提早結束或改變 HTML 解析狀態）。"""
    if re.search(r"<!--|</script", text, re.I):
        sys.exit(f"{where}: contains '</script' or '<!--'; cannot inline safely")
    return text


def json_block(p):
    obj = json.loads(read(p))
    # JSON 字串外不會有 '<'；字串內的 '<' 改寫成 \u003c，內容不變，也不可能提早結束 <script>
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def rewrite(text):
    """下載連結指向正式網站（單檔版本身沒有旁邊的 standalone/ 資料夾）。"""
    return text.replace('href="standalone/windfarmTaiwan-standalone.html" download', f'href="{SITE}standalone/windfarmTaiwan-standalone.html"')


def git_sha():
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        return "unknown"


PRELUDE = r"""
/* 單檔版執行環境：core.js 讀 window.WW_STANDALONE 取得內嵌的程式、資料與圖檔 */
window.WW_STANDALONE = (function () {
  'use strict';
  const SITE = %(site)s, IMG = %(img)s, snap = {};
  const norm = p => String(p).replace(/^\.\//, '').split('?')[0];
  const node = p => document.querySelector('script[data-emb="' + norm(p) + '"]');
  const text = p => { const n = node(p); return n ? n.textContent : null; };
  return {
    built: %(built)s, sha: %(sha)s, site: SITE,
    text, has: p => !!node(p), json: p => JSON.parse(text(p)),
    url: p => IMG[norm(p)] || null,
    /* 即時資料：先向正式網站抓最新的，失敗（離線）才用建置當下的快照 */
    live(p) {
      const q = norm(p), ctl = 'AbortController' in window ? new AbortController() : null;
      const tm = ctl && setTimeout(() => ctl.abort(), 8000);
      return fetch(SITE + q + '?t=' + Date.now(), { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
        .then(r => { if (!r.ok) throw new Error(q + ' ' + r.status); return r.json(); })
        .then(j => { clearTimeout(tm); snap[q] = false; return j; },
              e => { clearTimeout(tm); const t = text(q); if (t == null) throw e; snap[q] = true; return JSON.parse(t); });
    },
    get usedSnapshot() { return !!snap['wind_realtime.json']; }
  };
})();
"""


def main():
    html = read("index.html")
    built = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sha = git_sha()
    img = {p: "data:image/jpeg;base64," + base64.b64encode((ROOT / p).read_bytes()).decode() for p in IMAGES}
    prelude = PRELUDE % {"site": json.dumps(SITE), "img": json.dumps(img), "built": json.dumps(built), "sha": json.dumps(sha)}

    # 1) site.css 內嵌，後面接單檔版執行環境（必須在 core.js 之前）
    link = '<link rel="stylesheet" href="assets/css/site.css">'
    assert html.count(link) == 1, "site.css <link> not found"
    css = read("assets/css/site.css")
    if re.search(r"</style", css, re.I):
        sys.exit("site.css contains '</style'")
    html = html.replace(link, "<style>\n" + css + "\n</style>\n<script>" + script_safe(prelude, "prelude") + "</script>")

    # 2) 延遲載入的程式與資料以不執行的區塊放在頁面程式之前（頁面程式載入時就可能讀資料），
    #    再把五個頁面程式改為內嵌（body 結尾、DOMContentLoaded 前執行，與 defer 相同）
    blocks = []
    for p in LAZY:
        blocks.append(f'<script type="text/plain" data-emb="{p}">' + script_safe(rewrite(read(p)), p) + "</script>")
    for p in DATA + LIVE:
        blocks.append(f'<script type="application/json" data-emb="{p}">' + json_block(p) + "</script>")
    first = f'<script src="{PAGE_SCRIPTS[0]}" defer></script>'
    assert html.count(first) == 1
    html = html.replace(first, "\n".join(blocks) + "\n" + first)
    for p in PAGE_SCRIPTS:
        tag = f'<script src="{p}" defer></script>'
        assert html.count(tag) == 1, f"{tag} not found"
        html = html.replace(tag, "<script>\n" + script_safe(rewrite(read(p)), p) + "\n</script>")

    # 3) 下載連結指向正式網站（內嵌的程式在上一步已處理）
    html = rewrite(html)

    # 4) 頁尾標示單檔版與建置時間
    note = (f'<br><span data-l="zh">單檔版 · 建置於 {built}（{sha}）· 連網時自動抓取最新即時資料，離線時顯示建置當下的快照 · '
            f'最新版：<a href="{SITE}" target="_blank" rel="noopener">dofliu.github.io/windfarmTaiwan</a></span>'
            f'<span data-l="en">Single-file copy · built {built} ({sha}) · fetches the latest live data when online and shows the snapshot saved at build time when offline · '
            f'latest version: <a href="{SITE}" target="_blank" rel="noopener">dofliu.github.io/windfarmTaiwan</a></span>')
    m = re.search(r'(<div class="fcopy">.*?)(</div>)', html, re.S)
    assert m, "footer .fcopy not found"
    html = html[:m.end(1)] + note + html[m.end(1):]


    header = (f"<!-- 風電風情 單檔版 / Wind Watch single-file edition — generated by tools/build_standalone.py "
              f"from dofliu/windfarmTaiwan@{sha} on {built}. Do not edit by hand; latest version: {SITE} -->\n")
    assert html.startswith("<!DOCTYPE html>")
    html = html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + header, 1)

    # 內嵌後不應再有任何相對路徑的 assets/ 或 data/ 資源參照遺漏
    left = sorted(set(re.findall(r'(?:src|href)="((?:assets|data)/[^"]+)"', html)))
    if left:
        sys.exit("unresolved relative resources: " + ", ".join(left))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    size = OUT.stat().st_size
    print(f"wrote {OUT.relative_to(ROOT)}  {size / 1e6:.2f} MB  (built {built}, {sha})")


if __name__ == "__main__":
    main()
