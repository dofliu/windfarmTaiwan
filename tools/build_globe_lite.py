#!/usr/bin/env python3
"""產生「全球風電地圖」單檔公開版：只有 3D 地球儀與三個基本圖層（陸域、離岸、規劃中），給一般人下載、直接用瀏覽器開啟。
Build the public single-file "Global wind map": just the 3D globe with the three basic layers (onshore, offshore, pipeline),
for the general public to download and open in a browser.

    python3 tools/build_globe_lite.py            # 輸出 standalone/windfarmTaiwan-globe.html

與完整單檔版（tools/build_standalone.py）的差別 · Differences from the full single-file copy:
    - 只有全球地球儀頁：沒有首頁、台灣即時與風電知識，也不抓任何即時資料。
      Only the globe page: no home, Taiwan live or Learn pages, and no live data is fetched.
    - 地球儀以 lite 模式執行（core.js／globe.js 讀 WW_STANDALONE.lite）：不載入港口、水下基礎、事件、里程碑導覽與海外即時出力，
      工具列只剩地圖／範圍／底圖／規劃中／旋轉／標籤／資料來源與搜尋，側欄只有「風場」與「規劃」兩個分頁。
      The globe runs in lite mode: no ports, foundations, events, milestone tour or overseas live output; the toolbar keeps
      map / region / basemap / pipeline / rotate / labels / sources / search and the side panel has only the Farms and Pipeline tabs.
    - 內嵌：site.css、globe.css、three.js、OrbitControls、core.js、globe.js、國家逐年容量、風場層、國界與 2k 地形／衛星底圖。
      Embedded: the CSS, three.js, the two site scripts, the country series, the farm layer, the borders and the 2k basemaps.
    Esri 高解析圖磚與維基百科簡介需要連網（離線時只是不顯示）。Esri tiles and Wikipedia summaries need a connection (they are simply absent offline).
只用 Python 標準函式庫；版本號與 CHANGELOG 的檢查與完整單檔版相同。Standard library only; the same version / changelog check as the full copy.
"""
import base64
import datetime
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_standalone import IMAGES, LAZY, PRELUDE, ROOT, SITE, git_sha, json_block, read, script_safe, site_version  # noqa: E402

OUT = ROOT / "standalone" / "windfarmTaiwan-globe.html"
SCRIPTS = ["assets/js/core.js"]
DATA = ["data/global/wind_global.json", "data/global/wind_farms.json", "data/global/world_borders.json", "data/global/country_stats.json", "data/global/turbines.json", "data/global/turbines_osm.json", "data/global/generation.json", "data/global/wind_resource.json", "data/global/turbines_de.json"]

TEMPLATE = """<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>全球風電地圖 · 風電風情</title>
<meta name="description" content="全球風電發展 1980–2025 的 3D 地球儀：各國逐年裝置容量、逾 1.5 萬座陸域與離岸風場與規劃中專案。單檔公開版，離線也能開。">
%(author)s
<meta name="theme-color" content="#07101d">
%(icon)s
<style>
%(site_css)s
</style>
<script>%(prelude)s</script>
</head>
<body class="lite">
<a class="skip" href="#main"><span data-l="zh">跳到主要內容</span><span data-l="en">Skip to content</span></a>

<header class="topbar">
  <a class="brand" href="#/global" aria-label="風電風情 Taiwan Wind Watch">
    %(logo)s
    <span class="bt"><span class="bn">風電風情</span><span class="bs"><span data-l="zh">全球風電地圖 · 單檔公開版</span><span data-l="en">Global wind map · public copy</span></span></span>
  </a>
  <div class="topbar-right">
    <a class="btn sm" href="%(site)s" target="_blank" rel="noopener"><span data-l="zh">完整網站</span><span data-l="en">Full site</span></a>
    <button class="btn sm" id="sharebtn" type="button"><span data-l="zh">分享</span><span data-l="en">Share</span></button>
    <button class="btn sm" id="langbtn" type="button">EN</button>
  </div>
</header>

<main id="main">
<section class="page page-full" data-page="global" id="page-global">
  <div id="globe"><div class="loading" id="globe-loading"><span data-l="zh">載入 3D 地球儀與全球資料…</span><span data-l="en">Loading the 3D globe and global data…</span></div></div>
</section>
</main>

%(footer)s
<div id="toast" role="status" aria-live="polite"></div>

%(blocks)s
<script>
%(scripts)s
</script>
</body>
</html>
"""

LITE_CSS = """
/* 單檔公開版：只有地球儀，主區塊不留頁尾以外的空間 · public copy: globe only */
body.lite main{min-height:0}
body.lite .topbar .bt .bs{white-space:nowrap}
"""


def take(html, pattern, what):
    m = re.search(pattern, html, re.S)
    if not m:
        sys.exit(f"{what} not found in index.html")
    return m.group(0)


def main():
    index = read("index.html")
    built = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sha = git_sha()
    ver = site_version()
    img = {p: "data:image/jpeg;base64," + base64.b64encode((ROOT / p).read_bytes()).decode() for p in IMAGES}
    prelude = PRELUDE % {"site": json.dumps(SITE), "img": json.dumps(img), "built": json.dumps(built), "sha": json.dumps(sha)}
    # lite 旗標：core.js 把預設頁改為地球儀，globe.js 不載入進階圖層
    prelude = prelude.replace("built: %s," % json.dumps(built), "lite: true, built: %s," % json.dumps(built), 1)
    assert "lite: true" in prelude

    # 版權、作者與圖示都直接取自 index.html，文字才會一致（CLAUDE.md 第 2 節）
    author = take(index, r'<meta name="author"[^>]*>', "author meta") + "\n" + take(index, r'<meta name="copyright"[^>]*>', "copyright meta")
    icon = take(index, r'<link rel="icon"[^>]*>', "icon link")
    logo = take(index, r'<svg class="logo".*?</svg>', "logo svg")
    footer = take(index, r'<footer class="sitefoot">.*?</footer>', "footer")
    note = (f'<br><span data-l="zh">全球風電地圖 單檔公開版 · 建置於 {built}（{sha}）· 只有陸域、離岸與規劃中三個圖層，離線也能開；港口、水下基礎、事件、台灣即時與風電知識請看'
            f'<a href="{SITE}" target="_blank" rel="noopener">完整網站</a></span>'
            f'<span data-l="en">Global wind map, public single-file copy · built {built} ({sha}) · onshore, offshore and pipeline layers only, works offline; ports, foundations, events, Taiwan live data and the Learn pages are on the '
            f'<a href="{SITE}" target="_blank" rel="noopener">full site</a></span>')
    m = re.search(r'(<div class="fcopy">.*?)(</div>)', footer, re.S)
    assert m, "footer .fcopy not found"
    footer = footer[:m.end(1)] + note + footer[m.end(1):]

    css = read("assets/css/site.css") + LITE_CSS
    if re.search(r"</style", css, re.I):
        sys.exit("site.css contains '</style'")

    blocks = []
    for p in LAZY:
        blocks.append(f'<script type="text/plain" data-emb="{p}">' + script_safe(read(p), p) + "</script>")
    for p in DATA:
        blocks.append(f'<script type="application/json" data-emb="{p}">' + json_block(p) + "</script>")
    scripts = "\n".join(script_safe(read(p), p) for p in SCRIPTS)

    html = TEMPLATE % {"author": author, "icon": icon, "site_css": css, "prelude": script_safe(prelude, "prelude"), "logo": logo, "site": SITE,
                       "footer": footer, "blocks": "\n".join(blocks), "scripts": scripts}
    header = (f"<!-- 全球風電地圖 單檔公開版 v{ver} / Global wind map, public single-file copy v{ver} — generated by tools/build_globe_lite.py "
              f"from dofliu/windfarmTaiwan@{sha} on {built}. Do not edit by hand; full site: {SITE} -->\n")
    html = html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + header, 1)

    left = sorted(set(re.findall(r'(?:src|href)="((?:assets|data)/[^"]+)"', html)))
    if left:
        sys.exit("unresolved relative resources: " + ", ".join(left))
    for must in ("WW.registerPage('global'", "window.WW_STANDALONE", 'data-emb="assets/js/globe.js"', 'data-emb="data/global/wind_farms.json"'):
        if must not in html:
            sys.exit(f"expected {must!r} in the output")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}  {OUT.stat().st_size / 1e6:.2f} MB  (v{ver}, built {built}, {sha})")


if __name__ == "__main__":
    main()
