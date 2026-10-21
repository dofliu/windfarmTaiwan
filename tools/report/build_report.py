#!/usr/bin/env python3
"""全球風電發展觀察報告：產生 HTML 與 PDF · Build the observation report (HTML + PDF).

  python3 -m http.server 8000 &                 # 截圖要先開本機預覽 · serve the site for screenshots
  node tools/report/shots.js                    # 網站截圖到 report/shots/（只需偶爾重拍）
  python3 tools/report/build_report.py zh       # 產生 report/observation-report.zh.html 與 .pdf

輸出在 report/（不進 git）。數字全部由 analysis.py 從 data/global 計算；文字在 text_zh.py（英文版 text_en.py）。
Output goes to report/ (not in git). Figures come from analysis.py; the words live in text_zh.py / text_en.py.
"""
import html
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import analysis  # noqa: E402
import charts as ch  # noqa: E402

ROOT = analysis.ROOT
OUT = os.path.join(ROOT, 'report')
T = ch.T
esc = ch.esc
SITE = 'https://dofliu.github.io/windfarmTaiwan/'

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900'
         '&family=Noto+Serif+TC:wght@600;700;900&display=swap" rel="stylesheet">')

CSS = f'''@page{{size:A4;margin:16mm 17mm 17mm;background:#faf7f0;@bottom-left{{content:"{{FOOT}}";font:8.5px "Noto Sans TC";color:{T["muted"]};letter-spacing:.05em}}@bottom-right{{content:counter(page,decimal-leading-zero);font:8.5px "Noto Sans TC";color:{T["muted"]}}}}}
@page cover{{margin:0;@bottom-left{{content:none}}@bottom-right{{content:none}}}}
html{{background:#faf7f0}}.ch{{break-before:page}}*{{box-sizing:border-box}}
body{{margin:0;font-family:"Noto Sans TC",sans-serif;color:{T["ink"]};background:#bbb;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.pg{{page:cover;width:210mm;height:297mm;margin:0;padding:17mm;position:relative;break-after:page;overflow:hidden}}
body{{background:#faf7f0}}
.ft{{position:absolute;bottom:8mm;left:17mm;right:17mm;display:flex;justify-content:space-between;font-size:8.5px;color:{T["muted"]};letter-spacing:.05em}}
.cov{{padding:0;background:#0b1220;color:#fff}}.cov img{{position:absolute;left:-22mm;top:92mm;width:254mm;height:auto}}
.cov .veil{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,18,32,1) 0%,rgba(11,18,32,1) 30.5%,rgba(11,18,32,0) 37%,rgba(11,18,32,0) 53%,rgba(11,18,32,1) 61.5%)}}
.cov .top{{position:absolute;top:20mm;left:17mm;right:17mm}}.cov .kick{{font-weight:700;font-size:10px;letter-spacing:.32em;color:#f0b23c}}
.cov h1{{font:900 44px/1.15 "Noto Sans TC";margin:5mm 0 3mm}}.cov .sub{{font-size:16px;font-weight:500;opacity:.92}}
.cov .bot{{position:absolute;bottom:17mm;left:17mm;right:17mm;display:flex;justify-content:space-between;align-items:flex-end;gap:8mm}}
.cov .big b{{font:900 56px/1 "Noto Sans TC";color:#f0b23c;white-space:nowrap}}.cov .big span{{display:block;font-size:11px;opacity:.85;margin-top:2mm}}
.cov .by{{text-align:right;font-size:9.5px;line-height:1.7;opacity:.85}}
.back{{background:#0b1220;color:#d8d0bf;display:flex;flex-direction:column;justify-content:flex-end}}.back b{{color:#f0b23c;font-size:18px}}.back p{{color:#d8d0bf;font-size:9.5px}}
.num{{font:900 60px/1 "Noto Serif TC";color:{T["c1"]}}}
.chap{{display:flex;gap:6mm;align-items:flex-end;border-bottom:2px solid {T["ink"]};padding-bottom:3mm;margin-bottom:5mm}}
.chap h2{{font:900 24px/1.25 "Noto Sans TC";margin:0}}.k{{font-size:9.5px;letter-spacing:.25em;color:{T["muted"]};font-weight:700}}
.open{{margin:0 0 5mm;height:98mm;position:relative;background:#0b1220;overflow:hidden;border-radius:3mm}}
.open img{{width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}}
.open .veil{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,12,22,0) 45%,rgba(8,12,22,.88) 100%)}}
.open .t{{position:absolute;left:17mm;right:17mm;bottom:7mm;color:#fff;display:flex;gap:6mm;align-items:flex-end}}
.open .num{{color:#f0b23c;font-size:68px}}.open h2{{font:900 27px/1.25 "Noto Sans TC";margin:0}}.open .k{{color:#e9dcc0}}
.open .cap{{position:absolute;right:4mm;top:3mm;font-size:8px;color:#fff;opacity:.8;background:rgba(8,12,22,.55);padding:1mm 2.5mm;border-radius:2mm;margin:0;max-width:150mm}}
p{{font-size:11.2px;line-height:1.88;margin:0 0 2.8mm;text-align:justify;orphans:2;widows:2;hyphens:auto}}
.lede{{font-size:15px;line-height:1.7;font-weight:700;margin-bottom:4mm}}
.cols{{column-count:2;column-gap:8mm;margin-bottom:2mm;break-inside:avoid}}
.panel{{background:#fff;border-radius:3mm;padding:4.5mm 5mm 3.5mm;margin:0 0 4mm;box-shadow:0 0 0 .4px {T["grid"]};break-inside:avoid}}.panel.flow{{break-inside:auto}}.panel.flow .sub{{break-inside:avoid}}
.panel h4{{margin:0 0 2mm;font-size:11.5px;display:flex;justify-content:space-between;gap:4mm}}.panel h4 span{{font-weight:500;color:{T["muted"]}}}
.cap{{font-size:8.8px;line-height:1.55;color:{T["muted"]};margin:1.5mm 0 0}}.cap a{{color:{T["c2"]};text-decoration:none}}
.keys{{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin:5mm 0}}.keys div{{background:#fff;border-radius:3mm;padding:4.5mm 6mm;box-shadow:0 0 0 .4px {T["grid"]}}}
.keys b{{font:900 34px/1 "Noto Serif TC";color:{T["ink"]}}}.keys b small{{font:700 13px "Noto Sans TC";margin-left:3px;color:{T["muted"]}}}
.keys span{{display:block;font-size:10px;margin-top:2mm;color:{T["muted"]}}}
.keys div:first-child{{background:{T["ink"]}}}.keys div:first-child b{{color:#f0b23c}}.keys div:first-child span,.keys div:first-child small{{color:#d8d0bf}}
.pull{{border-left:4px solid {T["c1"]};padding:1mm 0 1mm 5mm;font:700 14px/1.6 "Noto Serif TC";margin:4mm 0}}
.fnd{{display:grid;grid-template-columns:16mm 1fr;gap:1.6mm 3mm;font-size:10.2px;line-height:1.7}}.fnd b{{color:{T["c1"]};font-size:10.5px}}
.tbl{{width:100%;border-collapse:collapse;font-size:9.4px}}.tbl th{{text-align:left;font-weight:700;color:{T["muted"]};border-bottom:1.2px solid {T["ink"]};padding:1.5mm 1.3mm;font-size:8.6px;white-space:nowrap}}
.tbl td{{padding:1.35mm 1.3mm;border-bottom:.3px solid {T["grid"]};vertical-align:top}}.tbl tr.hl td{{background:#f6ecd6}}
.n{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}.b{{font-weight:700}}.mut{{color:{T["muted"]}}}
.shot{{margin:0 0 4mm;break-inside:avoid}}.shot img{{width:100%;display:block;border-radius:2.5mm;box-shadow:0 1.5mm 5mm rgba(0,0,0,.18)}}
.g2{{display:grid;grid-template-columns:1fr 1fr;gap:4mm}}
.multi{{display:grid;gap:3mm;margin:0 0 5mm}}.multi.n3{{grid-template-columns:1fr 1fr 1fr}}.multi.n2{{grid-template-columns:1fr 1fr}}
.multi figure{{margin:0}}.multi img{{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:2.5mm;display:block}}.multi.n2 img{{aspect-ratio:4/3}}
.multi figcaption{{font-size:9px;line-height:1.5;color:{T["muted"]};margin-top:1.5mm}}.multi figcaption b{{display:block;color:{T["ink"]};font-size:11px}}
.cov .note{{position:absolute;left:17mm;right:17mm;top:186mm;font-size:9.5px;color:#d8d0bf;opacity:.85;text-align:right}}
.tl{{display:grid;grid-template-columns:14mm 1fr;gap:0 4mm;font-size:9.6px;line-height:1.5}}
.tl .y{{font:700 12px "Noto Serif TC";color:{T["c1"]};text-align:right;padding-top:.6mm}}.tl .e{{border-left:2px solid {T["soft"]};padding:0 0 2mm 4mm;position:relative}}
.tl .e:before{{content:"";position:absolute;left:-4.2px;top:2mm;width:6px;height:6px;border-radius:50%;background:{T["c1"]}}}.tl .e b{{font-size:10.2px}}
.toc{{display:grid;grid-template-columns:12mm 1fr;gap:2.4mm 3mm;font-size:12px;margin:2mm 0 7mm}}.toc b{{font:700 14px "Noto Serif TC";color:{T["c1"]}}}
.how{{display:grid;grid-template-columns:22mm 1fr;gap:2mm 3mm;font-size:9.8px;line-height:1.6;background:#fff;border-radius:3mm;padding:4mm 5mm;box-shadow:0 0 0 .4px {T["grid"]}}}.how b{{color:{T["muted"]}}}
.obs{{display:grid;gap:3mm}}.obs div{{background:#fff;border-radius:3mm;padding:3.5mm 5mm;box-shadow:0 0 0 .4px {T["grid"]};border-left:4px solid {T["c1"]}}}
.obs b{{display:block;font-size:11.5px;margin-bottom:1mm}}.obs span{{font-size:10.2px;line-height:1.7}}
h3{{font-size:13px;margin:4mm 0 2mm}}ul.ap{{margin:0 0 2mm;padding-left:4.5mm}}ul.ap li{{font-size:9.4px;line-height:1.7;margin-bottom:1mm}}
.quote{{font-size:8.8px;line-height:1.55;margin:0 0 2mm;padding-left:3mm;border-left:2px solid {T["soft"]}}}.quote i{{color:{T["muted"]};word-break:break-all}}
{ch.CSS}'''


def shot(name):
    return f'shots/{name}.jpg'


class Book:
    def __init__(self, t):
        self.t = t
        self.pages = []
        self.fig = 0
        self.tab = 0
        self.refs = {}

    def page(self, body, cls='pg', footer=False):
        """固定一頁（封面、封底）· a fixed full page (covers)."""
        self.pages.append(f'<section class="{cls}">{body}</section>')

    def start(self, body):
        """新的一章，從新的一頁開始，內容自動分頁 · a new chapter on a new page; content flows."""
        self.pages.append(f'<article class="ch">{body}</article>')

    def cont(self, body):
        """接在目前這一章後面 · continue the current chapter."""
        self.pages[-1] = self.pages[-1][:-len('</article>')] + body + '</article>'

    def figure(self, title, svg, src, link=None, side='', key=None):
        self.fig += 1
        if key:
            self.refs['fig:' + key] = self.fig
        lk = f'　{esc(self.t["see"])}：<a href="{SITE}{link}">{esc(link)}</a>' if link else ''
        return (f'<div class="panel"><h4><b>{esc(self.t["fig"])} {self.fig}　{esc(title)}</b><span>{esc(side)}</span></h4>{svg}'
                f'<div class="cap">{esc(self.t["src"])}{esc(src)}{lk}</div></div>')

    def table(self, title, head, rows, src, num_cols=(), hl=(), key=None):
        self.tab += 1
        if key:
            self.refs['tab:' + key] = self.tab
        th = ''.join(f'<th class="{"n" if k in num_cols else ""}">{esc(h)}</th>' for k, h in enumerate(head))
        trs = ''.join(f'<tr class="{"hl" if i in hl else ""}">' + ''.join(f'<td class="{"n" if k in num_cols else ""}">{c}</td>' for k, c in enumerate(r)) + '</tr>'
                      for i, r in enumerate(rows))
        return (f'<div class="panel"><h4><b>{esc(self.t["tab"])} {self.tab}　{esc(title)}</b></h4><table class="tbl"><thead><tr>{th}</tr></thead>'
                f'<tbody>{trs}</tbody></table><div class="cap">{esc(self.t["src"])}{esc(src)}</div></div>')


def ps(items):
    return ''.join(f'<p>{esc(x)}</p>' for x in items)


def opener(num, kick, title, img, cap):
    return (f'<div class="open"><img src="{shot(img)}"><div class="veil"></div>'
            f'<div class="t"><div class="num">{num}</div><div><div class="k">{esc(kick)}</div><h2>{esc(title)}</h2></div></div></div>'
            f'<div class="cap" style="margin:-3.5mm 0 4mm">▲ {esc(cap)}</div>')


def esc_refs(html_):
    """esc() 不會動到 ⟨⟩，這裡保持原樣 · placeholders survive escaping as they are."""
    return html_


def opener_multi(num, kick, title, panels, cap):
    """多張截圖的章首 · chapter opener with two or three screenshots side by side."""
    cells = ''.join(f'<figure><img src="{shot(img)}">' + (f'<figcaption><b>{esc(a)}</b>{esc(b)}</figcaption>' if a else f'<figcaption>{esc(b)}</figcaption>') + '</figure>'
                    for img, a, b in panels)
    head = (f'<div class="chap"><div class="num">{num}</div><div><div class="k">{esc(kick)}</div><h2>{esc(title)}</h2></div></div>')
    return head + f'<div class="multi n{len(panels)}">{cells}</div>' + (f'<div class="cap" style="margin:-2mm 0 4mm">▲ {esc(cap)}</div>' if cap else '')


def build(lang):
    if lang == 'zh':
        import text_zh as tx
    else:
        import text_en as tx
    D = analysis.compute_more(analysis.compute())
    t = tx.build(D)
    B = Book(t)
    Y = D['years']
    i25 = Y.index(2025)
    SHORT = {'United States of America': 'United States'}
    N = lambda iso: D['names'][iso]['zh'] if lang == 'zh' else SHORT.get(D['names'][iso]['en'], D['names'][iso]['en'])

    # 封面 · cover：平面地圖傾斜，各國風機高度依容量
    B.page(f'''<img src="{shot('cover_crop')}"><div class="veil"></div>
<div class="top"><div class="kick">{esc(t["kicker"])}</div><h1>{esc(t["title"])}</h1><div class="sub">{esc(t["sub"])}</div></div>
<div class="note">{esc(t["cover_note"])}</div>
<div class="bot"><div class="big"><b>{esc(t["cover_big"])}</b><span>{esc(t["cover_big_sub"])}</span></div>
<div class="by">{esc(t["lab"])}<br>{esc(t["lab2"])}<br>{esc(t["date"])}</div></div>''', 'pg cov')

    # 關於與目次 · about and contents
    toc = ''.join(f'<b>{a}</b><span>{esc(b)}</span>' for a, b in t['toc'])
    how = ''.join(f'<b>{esc(a)}</b><span>{esc(b)}</span>' for a, b in t['howto'])
    B.start(f'''<div class="chap"><div><div class="k">CONTENTS</div><h2>{esc(t["toc_title"])}</h2></div></div><div class="toc">{toc}</div>
<div class="chap"><div><div class="k">ABOUT</div><h2>{esc(t["about_title"])}</h2></div></div>{ps(t["about"])}<div class="how">{how}</div>''')

    # 00 摘要
    keys = ''.join(f'<div><b>{esc(a)}<small>{esc(u)}</small></b><span>{esc(s)}</span></div>' for a, u, s in t['keys'])
    fnd = ''.join(f'<b>{esc(a)}</b><span>{esc(b)}</span>' for a, b in t['findings'])
    B.start(f'''<div class="chap"><div class="num">00</div><div><div class="k">{t["sum_kick"]}</div><h2>{esc(t["sum_title"])}</h2></div></div>
<p class="lede">{esc(t["sum_lede"])}</p><div class="keys">{keys}</div><div class="pull">{esc(t["pull"])}</div><div class="fnd">{fnd}</div>''')

    # 01 四十五年
    marks = [(D['thresholds'][v], D['total'][Y.index(D['thresholds'][v])] / 1000, t['cross'].format(y=D['thresholds'][v], v=f'{v:,} GW')) for v in (100, 500, 1000)]
    fig1 = ch.area_stack(Y, [(t['onshore'], [v / 1000 for v in D['on']], T['c1']), (t['offshore'], [v / 1000 for v in D['off']], T['c2'])],
                         t['c1_fig1'], t['gw'], h=330, ymax=1400, marks=marks, ylab=f'{t["total"]} {D["total"][i25]/1000:,.0f} GW')
    yrs = list(range(1990, 2026))
    fig2 = ch.bars(yrs, [D['add'][Y.index(y)] / 1000 for y in yrs], t['c1_fig2'], t['gwy'], h=190, highlight=2025, note=t['add_note'])
    ab, ay = D['add_by_region'], D['add_years']
    fig3 = ch.stacked_cols(ay, [(t['regions4'][k], [v / 1000 for v in ab[k]], c) for k, c in (('CHN', T['c1']), ('EUR', T['c2']), ('USA', T['c3']), ('OTH', T['other']))],
                           t['c1_fig3'], t['gwy'], h=230)
    dec_rows = [[f'{r["a"]}–{r["b"]}', f'{r["w0"]/1000:,.1f}', f'{r["w1"]/1000:,.1f}', f'{r["add"]/1000:,.1f}', f'{r["cagr"]:.1f}%', esc(N(r["top"])), f'{r["top_share"]:.0f}%'] for r in D['decades']]
    B.start(opener('01', t['c1_kick'], t['c1_title'], 'altamont', t['c1_shot']) + f'<p class="lede">{esc(t["c1_lede"])}</p><div class="cols">{ps(t["c1_p"])}</div>')
    B.cont(B.figure(t['c1_fig1'], fig1, t['c1_fig1_src'], '#/global?play=1', key='cap') + B.figure(t['c1_fig2'], fig2, t['c1_fig2_src'], key='add'))
    B.cont(f'<div class="cols">{ps(t["c1_p2"])}</div>' + B.figure(t['c1_fig3'], fig3, t['c1_fig3_src'], key='addreg')
           + B.table(t['c1_tab'], t['c1_tab_cols'], dec_rows, t['c1_tab_src'], num_cols=(1, 2, 3, 4, 6), key='dec'))
    pick = ['Brush wind turbine', 'Gedser', 'Altamont', 'Growian', 'Vindeby', 'Enercon E-66', 'Dabancheng', 'Horns Rev 1', 'Hywind Demo', 'Donghai Bridge',
            'London Array', 'Hywind Scotland', 'Formosa 1', 'Hornsea 2', 'Vestas V236', 'Dongfang 26']
    ms = [m for m in D['milestones'] if any(m['name'].startswith(p) for p in pick)]
    tl = ''.join(f'<div class="y">{m["year"]}</div><div class="e"><b>{esc(m["name"].split(",")[0])}</b>　<span class="mut">{esc(N(m["iso"]))}</span><br>{esc(m["zh"] if lang == "zh" else m["en"])}</div>' for m in ms)
    B.start(f'<div class="chap"><div><div class="k">MILESTONES</div><h2>{esc(t["ms_title"])}</h2></div></div><p>{esc(t["ms_lede"])}</p><div class="tl">{tl}</div><div class="cap">{esc(t["src"])}{esc(t["ms_src"])}</div>')

    # 02 重心東移
    cs = D['cont_share']
    figc = ch.stack100([(str(y), cs[y]) for y in (1990, 2000, 2010, 2020, 2025)], t['cont'], [T['c1'], T['c2'], T['c3'], T['other']], t['c2_fig3'], h=210)
    rows = []
    for k_, r in enumerate(D['top10'], 1):
        rows.append([str(k_), esc(N(r['iso'])), f'{r["on"]:,.0f}', f'{r["off"]:,.0f}', f'<b>{r["total"]:,.0f}</b>', f'{r["share"]:.1f}%',
                     f'{r["gshare"]:.1f}%', f'{r["cf"]*100:.0f}%'])
    sy = D['share_years']
    pal = {'DNK': T['c2'], 'TWN': T['c1']}
    ser = []
    for iso in ('DNK', 'IRL', 'GBR', 'DEU', 'ESP', 'BRA', 'CHN', 'USA', 'TWN'):
        v = D['share_series'][iso]
        ser.append((N(iso), v, pal.get(iso, T['other']), 2.6 if iso in pal else 1.6, f'{v[-1]:.1f}%'))
    figs = ch.lines(sy, ser, t['c2_fig4'], '%', h=330, ymax=60, right=130)
    cy = D['conc_years']
    figcnt = ch.lines(cy, [(t['n1'], D['n_1gw'], T['c1'], 2.4, str(D['n_1gw'][-1])), (t['n10'], D['n_10gw'], T['c2'], 2.4, str(D['n_10gw'][-1]))],
                      t['c2_fig6'], '', h=200, ymax=50, right=90)
    pc = D['percap'][:15]
    if 'TWN' not in [x[0] for x in pc]:
        pc = pc + [('TWN', dict(D['percap'])['TWN'])]
    figpc = ch.hbars([(N(i), v, f'{v:,.0f}') for i, v in pc], t['c2_fig7'], labw=110)
    figpc = figpc.replace(f'>{esc(N("TWN"))}</text>', f' style="font-weight:700">{esc(N("TWN"))}</text>')
    B.start(opener_multi('02', t['c2_kick'], t['c2_title'], t['c2_panels'], t['c2_shot']) + f'<p class="lede">{esc(t["c2_lede"])}</p><div class="cols">{ps(t["c2_p"][:2])}</div>')
    B.cont(B.figure(t['c2_fig3'], figc, t['c2_fig3_src'], '#/global?y=2000', key='cont')
           + B.table(t['c2_tab1'], t['c2_tab1_cols'], rows, t['c2_tab1_src'], num_cols=(0, 2, 3, 4, 5, 6, 7), hl=(0,), key='top10'))
    B.cont(f'<div class="cols">{ps(t["c2_p"][2:])}</div>' + B.figure(t['c2_fig4'], figs, t['c2_fig4_src'], '#/global?ind=share', key='share'))
    B.cont(f'<div class="cols">{ps(t["c2_p2"])}</div>' + B.figure(t['c2_fig6'], figcnt, t['c2_fig6_src'], key='count')
           + B.figure(t['c2_fig7'], figpc, t['c2_fig7_src'], '#/global?ind=pc', key='percap'))

    # 03 更大的風機
    pts = [(m['year'], m['mw'], m['type'], m['name']) for m in D['milestones'] if m['mw']]
    labs = [(1888, 0.012, 'Brush 12 kW', 'start', 8, 4), (1957, 0.2, 'Gedser 200 kW', 'start', 8, 14), (1983, 3, 'Growian 3 MW', 'end', -8, -6),
            (1991, 0.45, 'Vindeby 450 kW', 'start', 8, 14), (2007, 7.58, 'E-126 7.6 MW', 'end', -8, -6), (2023, 15, 'V236 15 MW', 'end', -8, -4),
            (2025, 26, '26 MW', 'end', -8, -6), (1941, 1.25, 'Smith–Putnam 1.25 MW', 'start', 8, -6)]
    figm = ch.scatter_log(pts, t['c3_fig5'], 'MW', h=270, labels=labs)
    leg5 = '　'.join(f'<span style="color:{c}">●</span> {esc(t["kinds"][k])}' for k, c in (('onshore', T['c1']), ('offshore', T['c2']), ('floating', T['c3'])))
    su, sd = D['size_us'], D['size_de']
    yy = list(range(1995, 2026))
    g = lambda d, k: [d[y][k] if y in d and d[y][k] else None for y in yy]
    figsz = ch.lines(yy, [(t['de'], g(sd, 'mw'), T['c1'], 2.4, f'{sd[max(sd)]["mw"]:.1f} MW'), (t['us'], g(su, 'mw'), T['c2'], 2.4, f'{su[max(su)]["mw"]:.1f} MW')],
                     t['c3_fig6'], t['mwu'], h=210, ymax=6, ticks_fmt=lambda v: f'{v:g}')
    figrd = ch.lines(yy, [(t['de'], g(sd, 'rd'), T['c1'], 2.4, f'{sd[max(sd)]["rd"]:.0f} m'), (t['us'], g(su, 'rd'), T['c2'], 2.4, f'{su[max(su)]["rd"]:.0f} m')],
                     t['c3_fig7'], t['m'], h=210, ymax=160)
    gs = lambda d: [d.get(y) for y in yy]
    figsp = ch.lines(yy, [(t['de'], gs(D['sp_de']), T['c1'], 2.4, f'{D["sp_de"][max(D["sp_de"])]:.0f} W/m²'), (t['us'], gs(D['sp_us']), T['c2'], 2.4, f'{D["sp_us"][max(D["sp_us"])]:.0f} W/m²')],
                     t['c3_fig10'], t['wm2'], h=210, ymax=500)
    B.start(opener('03', t['c3_kick'], t['c3_title'], 'farm', t['c3_shot']) + f'<p class="lede">{esc(t["c3_lede"])}</p><div class="cols">{ps(t["c3_p"][:2])}</div>')
    B.cont(B.figure(t['c3_fig5'], figm, t['c3_fig5_src'], '#/global?ms=Gedser%20wind%20turbine', key='ms').replace('</h4>', f'</h4><div class="cap" style="margin:0 0 1mm">{leg5}</div>', 1)
           + f'<div class="cols">{ps(t["c3_p"][2:])}</div>')
    B.cont(B.figure(t['c3_fig6'], figsz, t['c3_fig67_src'], '#/global?f=Sweetwater', key='size') + B.figure(t['c3_fig7'], figrd, t['c3_fig67_src'], key='rotor'))
    B.cont(ps(t['c3_p2']) + B.figure(t['c3_fig10'], figsp, t['c3_fig10_src'], key='sp'))

    # 04 走向海上
    oc = D['off_by_country']
    y2 = list(range(2000, 2026))
    figo = ch.area_stack(y2, [(N('CHN'), [oc['CHN'][Y.index(y)] / 1000 for y in y2], T['c1']), (N('GBR'), [oc['GBR'][Y.index(y)] / 1000 for y in y2], T['c2']),
                              (N('DEU'), [oc['DEU'][Y.index(y)] / 1000 for y in y2], T['c3']), (t['other'], [oc['Other'][Y.index(y)] / 1000 for y in y2], T['other'])],
                         t['c4_fig8'], t['gw'], h=290, ymax=100, ylab=f'{t["total"]} {D["off25"]/1000:.1f} GW')
    oa = D['off_add_share']
    figoa = ch.bars(list(oa), list(oa.values()), t['c4_fig12'], '%', h=180, highlight=2021, note=(f'2021 年 {oa[2021]:.0f}%' if lang == 'zh' else f'2021: {oa[2021]:.0f}%',), right=90)
    ofs = D['off_farm_size']
    figos = ch.bars([f'{a}–{str(b)[2:]}' if a != 1991 else f'–{b}' for a, b in (r['period'] for r in ofs)], [r['med'] for r in ofs], t['c4_fig13'], 'MW', h=190,
                    valfmt=lambda v: f'{v:,.0f} MW', right=20)
    dims = D['offdims']
    cell = lambda v, u: (f'{v[0]:.0f} {u} <span class="mut">({v[1]})</span>' if v[0] else '—')
    fd = D['found']
    grp = ['mp', 'frame', 'other', 'fl']
    figfd = ch.stack100([(t['regions'][k], [100 * fd[k]['mw'].get(g_, 0) / fd[k]['known'] for g_ in grp]) for k in ('EUR', 'CHN', 'OTH')],
                        t['fdg'], [T['c1'], T['c2'], T['other'], T['c3']], t['c4_fig9'], h=170)
    fl = D['floating']
    half = (len(fl) + 1) // 2
    flr = lambda r: [str(r['year']), esc(r['name'] if lang != 'zh' or not r['zh'] else f'{r["zh"]}'), esc(N(r['iso'])), f'{r["mw"]:g}']
    B.start(opener_multi('04', t['c4_kick'], t['c4_title'], [('northsea', '', t['c4_shot']), ('chinaoff', '', t['c4_shot2'])], None)
            + f'<p class="lede">{esc(t["c4_lede"])}</p><div class="cols">{ps(t["c4_p"][:2])}</div>')
    B.cont(B.figure(t['c4_fig8'], figo, t['c4_fig8_src'], '#/global?layer=off', key='offc') + ps(t['c4_p2'][:1]) + B.figure(t['c4_fig12'], figoa, t['c4_fig12_src'], key='offshare'))
    B.cont(ps(t['c4_p2'][1:]) + B.figure(t['c4_fig13'], figos, t['c4_fig13_src'] + ' n = ' + '、'.join(str(r['n']) for r in ofs), key='offsize')
           + f'<p>{esc(t["c4_p"][2])}</p>' + B.table(t['c4_tab2'], t['c4_tab2_cols'], [[f'{a}–{b}' if a != 1991 else f'–{b}', str(r['farms']), cell(r['rd'], 'm'), cell(r['hh'], 'm'), cell(r['dep'], 'm')]
                                                      for r in dims for a, b in [r['period']]], t['c4_tab2_src'], num_cols=(1, 2, 3, 4), key='dims'))
    B.cont(f'<p>{esc(t["c4_p"][3])}</p>' + B.figure(t['c4_fig9'], figfd, t['c4_fig9_src'], '#/global?r=C:Europe&layer=fd', key='fd')
           + f'<div class="shot"><img src="{shot("fdeu")}"></div>')
    B.cont(f'<p>{esc(t["c4_p"][4])}</p>' + B.table(t['c4_tab3'], t['c4_tab3_cols'] + t['c4_tab3_cols'], [flr(a) + (flr(b) if b else ['', '', '', '']) for a, b in zip(fl[:half], fl[half:] + [None])],
                   t['c4_tab3_src'], num_cols=(3, 7), key='float') + f'<div class="shot"><img src="{shot("float")}"></div>')

    # 05 實測發電
    cf = D['cf']
    figst = ch.strips([(t['cty'][i], cf[i]['vals'], cf[i]['med']) for i in ('USA', 'AUS', 'DNK', 'TWN')], t['c5_fig10'], '%', h=290)
    cp = D['cf_us_period']
    figcp = ch.bars([f'{a}–{str(b)[2:]}' if a != 1980 else f'–{b}' for a, b in (r['period'] for r in cp)], [r['med'] for r in cp], t['c5_fig11'], '%', h=190,
                    valfmt=lambda v: f'{v:.1f}%', right=20)
    figrd2 = ch.scatter_bins([(r, c) for r, c, _ in D['cf_rd']], [(b['b'], b['med'], b['n']) for b in D['cf_rd_bins']], t['c5_fig16'], t['rd_m'], '%', h=280)
    B.start(opener('05', t['c5_kick'], t['c5_title'], 'outus', t['c5_shot']) + f'<p class="lede">{esc(t["c5_lede"])}</p><div class="cols">{ps(t["c5_p"][:2])}</div>')
    B.cont(B.figure(t['c5_fig10'], figst, t['c5_fig10_src'], '#/global?out=USA.cf', key='cfstrip') + f'<div class="cols">{ps(t["c5_p"][2:])}</div>'
           + B.figure(t['c5_fig11'], figcp, t['c5_fig11_src'] + '、'.join(t['farms_n'].format(n=r['n']) for r in cp), key='cfper'))
    B.cont(ps(t['c5_p2']) + B.figure(t['c5_fig16'], figrd2, t['c5_fig16_src'], '#/global?out=USA.model', key='cfrd'))

    # 06 廠牌與業主
    pan = ''
    for title, d in t['c6_fig12_panels']:
        items = [(a, p, f'{p:.0f}%') for a, mw, p in d['top'][:5]]
        pan += (f'<div class="sub"><div class="cap" style="margin:0 0 1mm;color:{T["ink"]};font-weight:700">{esc(title)}　<span class="mut">{esc(t["c6_cov"].format(c=d["cov"]))}</span></div>'
                + ch.hbars(items, title, w=640, color=T['c1'] if 'off' not in title.lower() and '離岸' not in title else T['c2'], labw=130) + '</div>')
    B.fig += 1
    B.refs['fig:mk'] = B.fig
    figmk = (f'<div class="panel flow"><h4><b>{esc(t["fig"])} {B.fig}　{esc(t["c6_fig12"])}</b></h4><div style="display:grid;gap:3mm">{pan}</div>'
             f'<div class="cap">{esc(t["src"])}{esc(t["c6_fig12_src"])}　{esc(t["see"])}：<a href="{SITE}#/global?mk=WORLD">#/global?mk=WORLD</a></div></div>')
    per = lambda P: [(f'{a}–{str(b)[2:]}' if a != 1990 else f'–{b}', r['shares']) for r in P for a, b in [r['period']]]
    figmu = ch.stack100(per(D['mk_us_period']), t['mk_us_keys'], [T['c1'], T['c2'], T['c3'], T['other']], t['c6_fig19'], h=190)
    figmd = ch.stack100(per(D['mk_de_period']), t['mk_de_keys'], [T['c1'], T['c2'], T['c3'], T['other']], t['c6_fig19'], h=190)
    ow = D['ow_all']
    figow = ch.hbars([(a, b, f'{b/1000:,.1f} GW') for a, b in ow['top']], t['c6_fig13'], labw=190)
    B.start(opener('06', t['c6_kick'], t['c6_title'], 'makers', t['c6_shot']) + f'<p class="lede">{esc(t["c6_lede"])}</p>{ps(t["c6_p"][:2])}')
    B.cont(figmk)
    B.cont(ps(t['c6_p2'][:1]) + B.figure(t['c6_fig19'], f'<div class="cap" style="margin:0;color:{T["ink"]};font-weight:700">{esc(t["us"])}</div>' + figmu
                                         + f'<div class="cap" style="margin:2mm 0 0;color:{T["ink"]};font-weight:700">{esc(t["de"])}</div>' + figmd, t['c6_fig19_src'], key='mkper'))
    B.cont(f'<p>{esc(t["c6_p"][2])}</p>' + ps(t['c6_p2'][1:]) + B.figure(t['c6_fig13'], figow, t['c6_fig13_src'], '#/global?mk=WORLD&mkv=owner', side=f'{100*ow["k"]/ow["t"]:.0f}%', key='own'))

    # 07 港口與供應鏈（新）
    pr = D['ports_roles']
    figro = ch.hbars([(t['roles'][k], v, str(v)) for k, v in pr.most_common()], t['c7p_fig20'], labw=110, color=T['c2'])
    figpi = ch.hbars([(N(i), v, str(v)) for i, v in D['ports_by_iso']], t['c7p_fig21'], labw=110, color=T['c2'])
    prow = [[esc(x['zh'] if lang == 'zh' else x['name']), esc('、'.join(t['roles'][r] for r in x['roles'])), esc(t['pstatus'][x['status']]), str(x['farms'])] for x in D['ports_tw']]
    B.start(opener('07', t['c7p_kick'], t['c7p_title'], 'ports', t['c7p_shot']) + f'<p class="lede">{esc(t["c7p_lede"])}</p><div class="cols">{ps(t["c7p_p"][:2])}</div>')
    B.cont(B.figure(t['c7p_fig20'], figro, t['c7p_src'], '#/global', key='roles') + B.figure(t['c7p_fig21'], figpi, t['c7p_src'], key='portc'))
    B.cont(ps(t['c7p_p'][2:]) + B.table(t['c7p_tab'], t['c7p_tab_cols'], prow, t['c7p_src'], num_cols=(3,), key='portstw')
           + f'<div class="shot"><img src="{shot("porttw")}"></div><div class="cap">▲ {esc(t["port_shot"])}　{esc(t["see"])}：<a href="{SITE}#/global?port=twn-taichung">#/global?port=twn-taichung</a></div>')

    # 08 事故與風險（新）
    it = D['inc_type']
    figit = ch.hbars([(t['inc_types'][k], it[k], str(it[k])) for k in ('tower', 'blade', 'fire', 'other')], t['c8i_fig22'], labw=110, color=T['c1'])
    iy = sorted(D['inc_year'])
    iyr = list(range(min(iy), max(iy) + 1))
    figiy = ch.bars(iyr, [D['inc_year'].get(y, 0) for y in iyr], t['c8i_fig23'], '', h=170, xstep=5, right=20)
    B.start(opener('08', t['c8i_kick'], t['c8i_title'], 'evtw', t['c8i_shot']) + f'<p class="lede">{esc(t["c8i_lede"])}</p><div class="cols">{ps(t["c8i_p"][:2])}</div>')
    B.cont(B.figure(t['c8i_fig22'], figit, t['c8i_src'], '#/global?ev=WIND-061', key='inctype') + B.figure(t['c8i_fig23'], figiy, t['c8i_src'], key='incyear')
           + f'<div class="cols">{ps(t["c8i_p"][2:])}</div>')

    # 09 台灣
    ty = D['tw_years']
    tl_ = D['tw_latest']
    figtw = ch.area_stack(ty, [(t['onshore'], D['tw_on'], T['c1']), (t['offshore'], D['tw_off'], T['c2'])], t['c7_fig14'], t['mw'], h=270, ymax=6000,
                          marks=[], ylab=f'{t["total"]} {D["tw_on"][-1]+D["tw_off"][-1]:,.0f} MW')
    figtw = figtw.replace('</svg>', '') + _tw_2026(tl_, t) + '</svg>'
    ao = D['asia_off']
    figao = ch.lines(list(range(2010, 2026)), [(N(i), ao[i], c, 2.6 if i == 'TWN' else 1.8, f'{ao[i][-1]:,.0f} MW') for i, c in (('TWN', T['c1']), ('VNM', T['c3']), ('KOR', T['c2']), ('JPN', T['other']))],
                     t['c7_fig26'], t['mw'], h=220, ymax=4000, right=120)
    tm = D['tw_month']
    figtm = ch.bars([m for m, v, n in tm], [v for m, v, n in tm], t['c7_fig27'], t['mw'], h=180, valfmt=lambda v: f'{v:.0f}', right=20, colors=[T['c2'] if m[5:] in ('12', '01', '02') else T['c1'] for m, v, n in tm])
    rows = []
    for r in D['tw_farms']:
        fdn = D['fd_types'].get(r['fd'], ['—', '—'])[0 if lang == 'zh' else 1] if r['fd'] else '—'
        y = str(r['year']) + ('' if r['st'] == 0 else f'（{t["building"]}）')
        rows.append([y, esc(r['zh'] if lang == 'zh' and r['zh'] else r['name']), f'{r["mw"]:,.1f}'.replace('.0', ''), esc(r['turbine']), esc(fdn)])
    B.start(opener('09', t['c7_kick'].replace('SEVEN', 'NINE'), t['c7_title'], 'twoff', t['c7_shot']) + f'<p class="lede">{esc(t["c7_lede"])}</p><div class="cols">{ps(t["c7_p"][:2])}</div>')
    B.cont(B.figure(t['c7_fig14'], figtw, t['c7_fig14_src'], '#/global?r=TWN', key='tw') + f'<div class="cols">{ps(t["c7_p"][2:])}</div>')
    B.cont(ps(t['c7_p2'][:1]) + B.figure(t['c7_fig26'], figao, t['c7_fig26_src'], '#/global?cmp=TWN,JPN,KOR,VNM', key='asiaoff')
           + ps(t['c7_p2'][1:2]) + B.table(t['c7_tab4'], t['c7_tab4_cols'], rows, t['c7_tab4_src'], num_cols=(2,), key='twfarms'))
    B.cont(ps(t['c7_p2'][2:]) + B.figure(t['c7_fig27'], figtm, t['c7_fig27_src'], key='twmonth')
           + f'<div class="shot"><img src="{shot("live")}"></div><div class="cap">▲ {esc(t["c7_live"])}　{esc(t["see"])}：<a href="{SITE}#/live">#/live</a></div>')

    # 10 下一步
    pw = D['pipe_world']
    figp = ch.bars(t['pipe_st'], [pw['operating'] / 1000, pw['construction'] / 1000, pw['preconstruction'] / 1000, pw['announced'] / 1000], t['c8_fig15'], t['gw'], h=190,
                   colors=[T['other'], T['c1'], T['c2'], T['c3']], valfmt=lambda v: f'{v:,.0f}', right=20)
    pt = D['pipe_top']
    figpt = _pipe_bars([(N(i), v['construction'] / 1000, v['preconstruction'] / 1000) for i, v in pt], t)
    ptp = D['pipe_type']
    figty = _pipe_bars([(t['pipe_st'][s_], ptp.get((s_, 'on'), 0) / 1000, ptp.get((s_, 'off'), 0) / 1000) for s_ in (1, 2, 3)], t, keys=t['on_off'])
    hy = list(range(2000, 2031))
    hist = [D['total'][Y.index(y)] / 1000 if y <= 2025 else None for y in hy]
    gw_ = [None if y < 2025 else 1299 + (2268 - 1299) * (y - 2025) / 5 for y in hy]
    figpath = ch.lines(hy, [(t['hist'], hist, T['c1'], 2.6, f'{hist[25]:,.0f} GW'), (t['gwec'], gw_, T['c2'], 2.4, '2,268 GW', '6 4')], t['c8_fig32'], t['gw'], h=230, ymax=2500, right=130)
    lt = D['latest']['countries']
    rows = [[esc(N(i)), v['asof'], f'{v["on"]:,.0f}', f'{v["off"]:,.0f}' if v['off'] else '—',
             esc(v['src'][0 if lang == 'zh' else 1]) + (f'　<b>{esc(t["est"])}</b>' if v['est'] else '')] for i, v in lt.items()]
    obs = ''.join(f'<div><b>{esc(a)}</b><span>{esc(b)}</span></div>' for a, b in t['obs'])
    B.start(opener('10', t['c8_kick'].replace('EIGHT', 'TEN'), t['c8_title'], 'pipeeu', t['c8_shot']) + f'<p class="lede">{esc(t["c8_lede"])}</p>{ps(t["c8_p"][:1])}'
            + B.table(t['c8_tab5'], t['c8_tab5_cols'], rows, t['c8_tab5_src'], num_cols=(2, 3), key='latest'))
    B.cont(f'<p>{esc(t["c8_p"][1])}</p>' + B.figure(t['c8_fig15'], figp, t['c8_fig15_src'], key='pipe') + B.figure(t['c8_fig16'], figpt, t['c8_fig16_src'], key='pipetop'))
    B.cont(ps(t['c8_p2'][:1]) + B.figure(t['c8_fig31'], figty, t['c8_fig31_src'], key='pipetype'))
    B.cont(ps(t['c8_p'][2:]) + ps(t['c8_p2'][1:]) + B.figure(t['c8_fig32'], figpath, t['c8_fig32_src'], key='path')
           + B.table(t['c8_tab6'], t['c8_tab6_cols'], [[f'<b>{esc(a)}</b>', esc(b)] for a, b in t['outlook']], t['c8_tab6_src'], key='outlook'))
    B.start(f'<div class="chap"><div class="num">◎</div><div><div class="k">OBSERVATIONS</div><h2>{esc(t["obs_title"])}</h2></div></div><div class="obs">{obs}</div>')

    # 附錄
    sec = ''.join(f'<h3>{esc(a)}</h3><ul class="ap">' + ''.join(f'<li>{esc(x)}</li>' for x in b) + '</ul>' for a, b in t['ap_sec'])
    B.start(f'<div class="chap"><div class="num">A</div><div><div class="k">{t["ap_kick"]}</div><h2>{esc(t["ap_title"])}</h2></div></div>{sec}')
    quotes = _quotes()
    q = ''.join(f'<div class="quote"><b>{esc(lab)}</b>　{esc(qt)}<br><i>{esc(url)}</i></div>' for lab, url, qt in quotes)
    lim = '<ul class="ap">' + ''.join(f'<li>{esc(x)}</li>' for x in t['ap_cov']) + '</ul>'
    B.cont(f'<h3>{esc(t["ap_cov_title"])}</h3>{lim}<h3>{esc(t["ap_quotes_title"])}</h3>{q}')
    B.page(f'<div><b>{esc(t["back"])}</b><p>{esc(t["lab"])}<br>{esc(t["lab2"])}</p><p>{esc(t["copyright"])}</p></div>', 'pg back')

    os.makedirs(OUT, exist_ok=True)
    css = CSS.replace('{FOOT}', t['footer'])
    body = ''.join(B.pages)
    missing = set()
    def ref(m):
        k = m.group(1) + ':' + m.group(2)
        if k not in B.refs:
            missing.add(k)
            return m.group(0)
        return (t['fig'] if m.group(1) == 'fig' else t['tab']) + ' ' + str(B.refs[k])
    import re
    body = re.sub(r'⟨(fig|tab):([a-z0-9_]+)⟩', ref, esc_refs(body))
    if missing:
        raise SystemExit('unresolved figure/table references: ' + ', '.join(sorted(missing)))
    doc = (f'<!doctype html><html lang="{t["lang"]}"><head><meta charset="utf-8"><title>{esc(t["title"])}</title>'
           f'<meta name="author" content="{esc(t["lab"])} · {esc(t["lab2"])}">{FONTS}<style>{css}</style></head><body>{body}</body></html>')
    path = os.path.join(OUT, f'observation-report.{lang}.html')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(doc)
    return path, len(B.pages)


def _tw_2026(tl_, t):
    """在台灣圖右上角加 2026 年 8 月的數字 · annotate the August 2026 figure."""
    return (f'<text x="380" y="40" class="lab">{esc(t["c7_2026"])}：{tl_["on"] + tl_["off"]:,.0f} MW</text>'
            f'<text x="380" y="56" class="ann">{esc(t["onshore"])} {tl_["on"]:,.0f} · {esc(t["offshore"])} {tl_["off"]:,.0f}</text>')


def _pipe_bars(rows, t, w=640, keys=None):
    rh = 22
    h = len(rows) * rh + 34
    ml, mr = max(110, 14 + max(ch.tw(l, 11) for l, _, _ in rows)), 70
    pw = w - ml - mr
    vmax = max(a + b for _, a, b in rows)
    k1, k2 = keys or (t['pipe_st'][1], t['pipe_st'][2])
    b = [f'<rect x="{ml}" y="4" width="11" height="11" rx="2" fill="{T["c1"]}"/><text x="{ml+16}" y="14" class="lab">{esc(k1)}</text>',
         f'<rect x="{ml+30+ch.tw(k1, 11.5)}" y="4" width="11" height="11" rx="2" fill="{T["c2"]}"/><text x="{ml+46+ch.tw(k1, 11.5)}" y="14" class="lab">{esc(k2)}</text>']
    for k, (lab, a, c) in enumerate(rows):
        y = 26 + k * rh
        wa, wc = a / vmax * pw, c / vmax * pw
        b.append(f'<text x="{ml-8}" y="{y+13}" text-anchor="end" class="tick2">{esc(lab)}</text>')
        b.append(f'<rect x="{ml}" y="{y+2}" width="{max(0.5, wa-1):.1f}" height="{rh-8}" rx="3" fill="{T["c1"]}"/>')
        b.append(f'<rect x="{ml+wa+1:.1f}" y="{y+2}" width="{max(0.5, wc-1):.1f}" height="{rh-8}" rx="3" fill="{T["c2"]}"/>')
        b.append(f'<text x="{ml+wa+wc+6:.1f}" y="{y+13}" class="val">{a+c:,.0f} GW</text>')
    return f'<svg viewBox="0 0 {w} {h}" class="chart" role="img" aria-label="pipeline">{"".join(b)}</svg>'


def _quotes():
    import json
    p = os.path.join(HERE, 'outlook_quotes.json')
    if not os.path.exists(p):
        return []
    out = []
    for e in json.load(open(p, encoding='utf-8')):
        for s in e['sources']:
            out.append((e['farm'], s['url'], s['quote']))
    return out


def crop_cover():
    from PIL import Image
    src = os.path.join(OUT, 'shots', 'cover.png')
    im = Image.open(src).convert('RGB')
    w, h = im.size
    im.crop((0, int(h * 0.27), w, int(h * 0.86))).save(os.path.join(OUT, 'shots', 'cover_crop.jpg'), quality=86)
    for n in os.listdir(os.path.join(OUT, 'shots')):
        if n.endswith('.png'):
            j = os.path.join(OUT, 'shots', n[:-4] + '.jpg')
            if not os.path.exists(j) or os.path.getmtime(j) < os.path.getmtime(os.path.join(OUT, 'shots', n)):
                Image.open(os.path.join(OUT, 'shots', n)).convert('RGB').save(j, quality=82)


if __name__ == '__main__':
    lang = sys.argv[1] if len(sys.argv) > 1 else 'zh'
    crop_cover()
    path, n = build(lang)
    print('wrote', os.path.relpath(path, ROOT), n, 'pages')
    pdf = os.path.join(OUT, f'observation-report.{lang}.pdf')
    r = subprocess.run(['node', os.path.join(HERE, 'pdf.js'), path, pdf], capture_output=True, text=True)
    print(r.stdout.strip(), r.stderr.strip())
    if r.returncode:
        sys.exit(r.returncode)
