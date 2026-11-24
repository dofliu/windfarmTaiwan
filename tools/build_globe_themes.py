#!/usr/bin/env python3
"""地球儀的淺色與漫畫配色 · Light and comic colour themes for the globe

    python3 tools/build_globe_themes.py            # 寫出 assets/css/globe-themes.css
    python3 tools/build_globe_themes.py --check    # 只檢查是否需要重建（pr-check 用）

globe.css 是依深色設計的，裡面有幾十個寫死的顏色。這支程式讀 globe.css，把每一條含顏色的宣告換成對應主題的顏色，
寫成 `#globe[data-gt="light"] …`（之後加 comic）的覆寫規則；改了 globe.css 之後重跑，不要手改輸出檔。
換色規則（深色→淺色）：
  · 灰階與低彩度的顏色把明度反過來（深底變淺底、白字變深藍字），白色半透明的疊層變成深藍半透明；
  · 有彩度的重點色保留色相、壓低明度到在白底上讀得清楚（例：金色 #f0c86a → 深金）；
  · 資料用色（陸域／離岸／浮動、水下基礎、港口、事件、規劃中）不在這裡換：那些顏色要跑色盲與對比檢查，另外處理（見 KEEP_VARS）；
  · 檔案最後的 EXTRA 是人工指定的少數規則（天空色背景、標籤的白色光暈）。

globe.css was designed dark and holds dozens of hard-coded colours. This reads it, swaps every colour in each declaration for
the theme's counterpart and writes `#globe[data-gt="light"] …` overrides; re-run after editing globe.css and never edit the
output by hand. Greys flip their lightness (dark panels turn light, white text turns navy), saturated accents keep their hue
but darken to stay readable on white, and the data colours listed in KEEP_VARS are left for the colour-blind check. EXTRA holds
the few rules set by hand (the sky background, white halos around labels).
"""
import colorsys
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'css' / 'globe.css'
OUT = ROOT / 'assets' / 'css' / 'globe-themes.css'

# 資料用色：主題不自動換（之後依色盲檢查另訂）· data colours, not mapped automatically
KEEP_VARS = {'--on', '--on-b', '--off', '--off-b', '--fl', '--fl-b', '--port', '--ev-inc', '--ev-ms', '--ev-pol',
             '--fd-mp', '--fd-frame', '--fd-fl', '--fd-other', '--fd-unk'}
NAVY = (0x12, 0x32, 0x4A)          # 淺色主題的主要文字色（與探險版相同）· main ink of the light theme (same as the kids edition)

COLOR_PROPS = ('color', 'background', 'border', 'shadow', 'outline', 'fill', 'stroke')
COLOR = re.compile(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)')


def parse(c):
    if c.startswith('#'):
        h = c[1:]
        if len(h) == 3:
            h = ''.join(x * 2 for x in h)
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), None
    nums = [x.strip() for x in c[c.index('(') + 1:-1].split(',')]
    r, g, b = (int(float(x)) for x in nums[:3])
    return r, g, b, (nums[3] if len(nums) > 3 else None)


def fmt(r, g, b, a):
    r, g, b = (max(0, min(255, round(x))) for x in (r, g, b))
    return f'rgba({r},{g},{b},{a})' if a is not None else f'#{r:02x}{g:02x}{b:02x}'


def to_light(c):
    r, g, b, a = parse(c)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if s < 0.35 or l < 0.2 or l > 0.92:                    # 灰階、深底、近白：明度反過來 · greys, dark panels, near-white: flip
        if l > 0.6:                                         # 淺色字或白色疊層 → 深藍；越白越深 · light ink / white overlays → navy, whiter → darker
            k = min(1.0, (l - 0.6) / 0.3)
            mid = (0x56, 0x6f, 0x84)                         # 次要文字色（白底 5.3:1）· secondary ink (5.3:1 on white)
            return fmt(*(m + (n - m) * k for m, n in zip(mid, NAVY)), a)
        l2 = 1 - l                                          # 深色底 → 淺色底（帶一點原本的色相）· dark base → light base, hue kept
        l2 = 0.93 + (l2 - 0.8) * 0.35 if l2 > 0.8 else l2
        r2, g2, b2 = colorsys.hls_to_rgb(h, min(0.985, l2), min(s, 0.45))
        return fmt(r2 * 255, g2 * 255, b2 * 255, a)
    l2 = min(l, 0.36)                                       # 重點色：保留色相、壓暗 · accents: keep hue, darken
    r2, g2, b2 = colorsys.hls_to_rgb(h, l2, min(1.0, s * 1.05))
    return fmt(r2 * 255, g2 * 255, b2 * 255, a)


def shadow(c):
    r, g, b, a = parse(c)
    if (r + g + b) / 3 < 80:                                  # 黑色陰影 → 淡深藍陰影 · black shadow → soft navy
        return fmt(*NAVY, round(float(a if a is not None else 1) * 0.45, 3))
    return to_light(c)


def split_rules(css):
    """把 CSS 拆成 [(prelude, body)]；@media 的 body 再遞迴拆 · split into (prelude, body) pairs, recursing into @media"""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        pre = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
            k += 1
        out.append((pre, css[j + 1:k - 1]))
        i = k
    return out


def scope(sel, attr):
    parts = []
    for s in sel.split(','):
        s = s.strip()
        if not s:
            continue
        if s.startswith('#globe'):
            m = re.match(r'#globe(\[[^\]]*\])*', s)
            parts.append(f'#globe[data-gt="{attr}"]' + s[m.end():])
        else:
            parts.append(f'#globe[data-gt="{attr}"] ' + s)
    return ','.join(parts)


def theme_rules(rules, attr, mapper):
    out = []
    for pre, body in rules:
        if pre.startswith('@media') or pre.startswith('@supports'):
            inner = theme_rules(split_rules(body), attr, mapper)
            if inner:
                out.append(pre + '{\n' + '\n'.join('  ' + x for x in inner) + '\n}')
            continue
        if pre.startswith('@'):
            continue
        decls = []
        for d in body.split(';'):
            d = d.strip()
            if ':' not in d:
                continue
            prop, val = d.split(':', 1)
            prop = prop.strip()
            # 含顏色的宣告都重寫一次（包括只用 var() 的），淺色規則的權重一致、原本的層疊順序（:hover、.active）才保得住 ·
            # every colour declaration is re-emitted, var() ones included, so the original cascade (:hover, .active) holds
            if not (COLOR.search(val) or (any(k in prop for k in COLOR_PROPS) and 'var(' in val) or 'transparent' in val and any(k in prop for k in COLOR_PROPS)):
                continue
            if prop in KEEP_VARS:
                continue
            if prop == 'box-shadow':          # 陰影維持深色、變淡 · shadows stay dark, only softer
                val = COLOR.sub(lambda m: shadow(m.group(0)), val.strip())
            else:
                val = COLOR.sub(lambda m: mapper(m.group(0)), val.strip())
            if prop == 'background' and COLOR.fullmatch(val.strip()):   # 只有顏色的簡寫改成 background-color，不重設位置與大小 · colour-only shorthand → background-color (keeps position/size)
                prop = 'background-color'
            decls.append(prop + ':' + val)
        if decls:
            out.append(scope(pre, attr) + '{' + ';'.join(decls) + '}')
    return out


# 人工指定 · set by hand
EXTRA = {
    'light': '''
/* 天空色的背景（取代深色太空）· a sky in place of dark space */
/* 網站共用的變數改成淺色模式的值（不論頁首 ☀／☾）· the site's shared variables take their light-mode values */
#globe[data-gt="light"]{color-scheme:light;--ink:#12324A;--ink-2:#3E5A70;--ink-3:#566f84;--acc:#0b7d70;background:#e4f2fb;
  --surface-1:#ffffff;--surface-2:#eef3f9;--surface-3:#e1e9f3;--line:rgba(16,32,56,.12);--line-2:rgba(16,32,56,.22);
  --live:#0b7a5d;--live-ink:#ffffff;--onshore-b:#8a6212;--offshore-b:#1f6fbf;--floating-b:#127565;--hist:#9a6b00;--hl:#7a4f00;
  --grid:rgba(16,32,56,.08);--axis:rgba(16,32,56,.22);--glass-rgb:255,255,255;--fg-rgb:16,32,56;--pop:#ffffff;--prose:#1f2f45}
#globe[data-gt="light"] #g-mapPane{background:radial-gradient(ellipse at 50% 30%,#ffffff 0%,#e3f2fc 45%,#bfdff3 100%)}
/* 地圖上的文字：深色字加白色光暈（原本是白字黑影）· labels: dark ink with a white halo instead of white with a black shadow */
#globe[data-gt="light"] .lbl{color:#12324A;text-shadow:0 0 2px #fff,0 0 4px #fff,0 0 7px rgba(255,255,255,.9)}
#globe[data-gt="light"] .lbl .v{color:#3E5A70}
#globe[data-gt="light"] .lbl.ctry{background:rgba(255,255,255,.78);text-shadow:none;box-shadow:0 1px 3px rgba(18,50,74,.18)}
#globe[data-gt="light"] .lbl.focus{color:#0b2236}
#globe[data-gt="light"] .lbl.focus b,#globe[data-gt="light"] .lbl.ms{color:#8a5a00}
#globe[data-gt="light"] .lbl.fnew{color:#8a5a00}
#globe[data-gt="light"] button.active,#globe[data-gt="light"] .gseg button.active{color:#fff}
/* 資料用色（與 globe.js 的 DATA_PAL.light 一致）：陸域／離岸／浮動的字與連結用深色版；水下基礎的中性色改深灰 ·
   data colours (matching DATA_PAL.light in globe.js): darker onshore/offshore/floating for text and links, dark-grey foundation neutrals */
#globe[data-gt="light"]{--on:#9a6b14;--on-b:#8a6212;--off:#1f6fbf;--off-b:#1a5fa6;--fl:#127565;--fl-b:#0f6658;--fd-mp:#2a64c0;--fd-frame:#b8441a;--fd-fl:#0b7552;--fd-other:#2f3742;--fd-unk:#6c7785;--p1:#1c3044;--p2:#3f546a;--p3:#66788b}
/* 港口與事件：記號維持原本的亮色填色（深色字），當文字用的地方改深色 · ports and events: markers keep their bright fills, text uses darker shades */
#globe[data-gt="light"] .fsports .fh,#globe[data-gt="light"] .pres .fh,#globe[data-gt="light"] .msItem.port .y,#globe[data-gt="light"] .gtag.port,#globe[data-gt="light"] .lbl.port.focus b,#globe[data-gt="light"] #g-ports .pmk.dev{color:#b5401e}
#globe[data-gt="light"] .gtag.port{border-color:#b5401e}
#globe[data-gt="light"] #g-ports .pmk{border-color:#12324A}
#globe[data-gt="light"] #g-ports .pmk.dev{background:rgba(255,255,255,.9);border-color:#b5401e}
#globe[data-gt="light"] .gtag.ev,#globe[data-gt="light"] .lbl.ev{color:#12324A;border-color:#12324A}
#globe[data-gt="light"] .gtag.ev.inc,#globe[data-gt="light"] .lbl.ev.inc b{color:#b3261e;border-color:#b3261e}
#globe[data-gt="light"] .gtag.ev.pol,#globe[data-gt="light"] .lbl.ev.pol{color:#6b3fb5;border-color:#6b3fb5}
#globe[data-gt="light"] .msItem.ev{border-left-color:#12324A}
#globe[data-gt="light"] #g-events .emk{box-shadow:0 0 0 1.5px #12324A}
/* 實景視角：影像出處列加白底（海面是深色的影像）· sea-level view: a white backing for the credit line over the dark imagery */
#globe[data-gt="light"] #g-scene .scn-cr{background:rgba(255,255,255,.85);color:#12324A;text-shadow:none;padding:1px 6px;border-radius:5px}
#globe[data-gt="light"] #g-scene .scn-load{background:rgba(255,255,255,.9);color:#12324A}
/* 水下基礎剖面圖維持深色水體（圖裡的塔架是白色）· the foundation cross-sections keep a dark water panel (their towers are white) */
#globe[data-gt="light"] .ffd .fdsvg{background:#1d3348;color:#e3eaf5}
''',
}


def build():
    rules = split_rules(SRC.read_text(encoding='utf-8'))
    head = ('/* 由 tools/build_globe_themes.py 從 globe.css 產生，請勿手動編輯 · generated from globe.css by '
            'tools/build_globe_themes.py; do not edit */\n')
    body = '\n'.join(theme_rules(rules, 'light', to_light))
    return head + '\n/* ---------- 淺色（白天）· light (daytime) ---------- */\n' + body + '\n' + EXTRA['light'].lstrip('\n')


if __name__ == '__main__':
    css = build()
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != css:
            sys.exit(f'{OUT.relative_to(ROOT)} is out of date: run python3 tools/build_globe_themes.py')
        print('globe-themes.css up to date')
    else:
        OUT.write_text(css, encoding='utf-8')
        print(f'wrote {OUT.relative_to(ROOT)} ({len(css) / 1e3:.1f} kB)')
