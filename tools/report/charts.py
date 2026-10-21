"""報告用的 SVG 圖表 · SVG charts for the report (style B, light paper).

色盤經 dataviz 色盲檢查（陸域 #c98500、離岸／第二色 #256abf、第三色 #199e70，底色 #faf7f0）；
每張圖都直接標示數值或名稱，顏色不單獨承載意義。
Palette validated for colour-blind readers; every chart labels values or names directly.
"""
import html
import math

T = dict(surface='#ffffff', ink='#1d1a14', muted='#6f685b', grid='#ece6d8', axis='#c4baa5',
         c1='#c98500', c2='#256abf', c3='#199e70', other='#b3ab9b', soft='#d9d2c3')


def esc(s):
    return html.escape(str(s))


def fmt(v, d=0):
    return f'{v:,.{d}f}'


def _svg(w, h, label, body):
    return f'<svg viewBox="0 0 {w} {h}" class="chart" role="img" aria-label="{esc(label)}">{"".join(body)}</svg>'


def _ticks(vmax, n=5):
    raw = vmax / n
    mag = 10 ** math.floor(math.log10(raw))
    step = next(s * mag for s in (1, 2, 2.5, 5, 10) if s * mag >= raw)
    top = step * math.ceil(vmax / step)
    return [step * k for k in range(int(round(top / step)) + 1)], top


def _spread(items, gap=13, lo=0, hi=1e9):
    """把直接標籤的 y 錯開 · nudge direct labels apart. items: [y, ...]; returns new ys in same order."""
    order = sorted(range(len(items)), key=lambda k: items[k])
    ys = [items[k] for k in order]
    for k in range(1, len(ys)):
        ys[k] = max(ys[k], ys[k - 1] + gap)
    over = ys[-1] - hi if ys else 0
    if over > 0:
        ys = [y - over for y in ys]
        for k in range(len(ys) - 2, -1, -1):
            ys[k] = min(ys[k], ys[k + 1] - gap)
    out = [0] * len(items)
    for k, o in enumerate(order):
        out[o] = max(lo, ys[k])
    return out


def area_stack(xs, series, label, unit, w=640, h=300, ymax=None, marks=(), right=None, ylab=None, xstep=5, xlast=None):
    """堆疊面積圖 · stacked area. series: [(name, values, color)], bottom first. marks: [(x, y, text)]."""
    ml, mr, mt, mb = 52, (right or 96), 18, 28
    pw, ph = w - ml - mr, h - mt - mb
    totals = [sum(s[1][i] for s in series) for i in range(len(xs))]
    ticks, top = _ticks(ymax or max(totals))
    x0, x1 = xs[0], xs[-1]
    X = lambda v: ml + (v - x0) / (x1 - x0) * pw
    Yv = lambda v: mt + ph - v / top * ph
    b = []
    for t in ticks:
        b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(t):.1f}" y2="{Yv(t):.1f}" stroke="{T["grid"]}"/>')
        b.append(f'<text x="{ml-8}" y="{Yv(t)+4:.1f}" text-anchor="end" class="tick">{fmt(t)}</text>')
    for v in xs:
        if (v - x0) % xstep == 0 or v == (xlast or x1):
            b.append(f'<text x="{X(v):.1f}" y="{h-8}" text-anchor="middle" class="tick">{v}</text>')
    base = [0] * len(xs)
    tops = []
    for name, vals, col in series:
        up = [base[i] + vals[i] for i in range(len(xs))]
        pts = ' '.join(f'{X(x):.1f},{Yv(v):.1f}' for x, v in zip(xs, up))
        back = ' '.join(f'{X(x):.1f},{Yv(v):.1f}' for x, v in reversed(list(zip(xs, base))))
        b.append(f'<polygon points="{pts} {back}" fill="{col}" fill-opacity=".88"/>')
        b.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="2"/>')
        tops.append(((base[-1] + up[-1]) / 2, name, col, vals[-1]))
        base = up
    b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(0)}" y2="{Yv(0)}" stroke="{T["axis"]}"/>')
    ys = _spread([Yv(t[0]) + 4 for t in tops], 14, mt + 10, mt + ph)
    for (mid, name, col, last), yy in zip(tops, ys):
        b.append(f'<text x="{X(x1)+8:.1f}" y="{yy:.1f}" class="lab"><tspan fill="{col}">■</tspan> {esc(name)}</text>')
    for mx, my, text in marks:
        cx, cy = X(mx), Yv(my)
        b.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="4" fill="#fff" stroke="{T["ink"]}" stroke-width="2"/>')
        b.append(f'<text x="{cx-10:.1f}" y="{cy-6:.1f}" text-anchor="end" class="ann">{esc(text)}</text>')
    b.append(f'<text x="{ml-8}" y="{mt-6}" text-anchor="end" class="unit">{esc(unit)}</text>')
    if ylab:
        b.append(f'<text x="{X(x1)+8:.1f}" y="{Yv(totals[-1])-6:.1f}" class="lab">{esc(ylab)}</text>')
    return _svg(w, h, label, b)


def bars(xs, vals, label, unit, w=640, h=200, highlight=None, note=None, xstep=5, colors=None, valfmt=None, right=110):
    """直條圖 · columns. highlight: x to colour with c2 and label."""
    ml, mr, mt, mb = 52, right, 18, 26
    pw, ph = w - ml - mr, h - mt - mb
    ticks, top = _ticks(max(vals))
    bw = pw / len(xs)
    Yv = lambda v: mt + ph - v / top * ph
    b = []
    for t in ticks:
        b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(t):.1f}" y2="{Yv(t):.1f}" stroke="{T["grid"]}"/>')
        b.append(f'<text x="{ml-8}" y="{Yv(t)+4:.1f}" text-anchor="end" class="tick">{fmt(t)}</text>')
    for k, (x, v) in enumerate(zip(xs, vals)):
        bx = ml + k * bw + 1
        bh = max(0.0, v / top * ph)
        col = (colors[k] if colors else (T['c2'] if x == highlight else T['c1']))
        r = min(3, bw / 2 - 1, bh)
        b.append(f'<path d="M{bx:.1f},{Yv(0):.1f} v{-(bh-r):.1f} q0,{-r:.1f} {r:.1f},{-r:.1f} h{bw-2-2*r:.1f} q{r:.1f},0 {r:.1f},{r:.1f} v{bh-r:.1f} z" fill="{col}"/>')
        if isinstance(x, str) or (x - xs[0]) % xstep == 0 or x == xs[-1]:
            b.append(f'<text x="{bx+bw/2-1:.1f}" y="{h-8}" text-anchor="middle" class="tick">{esc(x)}</text>')
        if valfmt:
            b.append(f'<text x="{bx+bw/2-1:.1f}" y="{Yv(v)-5:.1f}" text-anchor="middle" class="val">{esc(valfmt(v))}</text>')
    b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(0)}" y2="{Yv(0)}" stroke="{T["axis"]}"/>')
    if highlight is not None and note:
        k = xs.index(highlight)
        lx = ml + k * bw + bw
        b.append(f'<text x="{lx+6:.1f}" y="{Yv(vals[k])+4:.1f}" class="lab">{esc(note[0])}</text>')
        if len(note) > 1:
            b.append(f'<text x="{lx+6:.1f}" y="{Yv(vals[k])+19:.1f}" class="ann">{esc(note[1])}</text>')
    b.append(f'<text x="{ml-8}" y="{mt-6}" text-anchor="end" class="unit">{esc(unit)}</text>')
    return _svg(w, h, label, b)


def stack100(rows, keys, colors, label, w=640, h=230, legend=True):
    """100% 堆疊橫條 · 100% stacked bars. rows: [(label, [values summing to 100])]."""
    ml, mr, mt, mb = 52, 10, (32 if legend else 6), 6
    pw = w - ml - mr
    rh = (h - mt - mb) / len(rows)
    bh = rh * 0.62
    b = []
    if legend:
        lx = ml
        for k, col in zip(keys, colors):
            b.append(f'<rect x="{lx}" y="6" width="11" height="11" rx="2" fill="{col}"/><text x="{lx+16}" y="16" class="lab">{esc(k)}</text>')
            lx += 16 + 12.5 * len(k) + 26
    for r, (lab, vals) in enumerate(rows):
        y0 = mt + r * rh + (rh - bh) / 2
        x0 = ml
        b.append(f'<text x="{ml-8}" y="{y0+bh/2+4:.1f}" text-anchor="end" class="tick">{esc(lab)}</text>')
        for v, col in zip(vals, colors):
            wd = v / 100 * pw
            if wd <= 0.3:
                continue
            b.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{max(0.5, wd-2):.1f}" height="{bh:.1f}" rx="3" fill="{col}"/>')
            if v >= 6:
                b.append(f'<text x="{x0+6:.1f}" y="{y0+bh/2+4:.1f}" class="inbar">{v:.0f}%</text>')
            x0 += wd
    return _svg(w, h, label, b)


def hbars(items, label, w=640, h=None, color=None, unit='', valfmt=None, labw=150, note_w=0):
    """排名橫條 · ranked horizontal bars. items: [(label, value, right_text)]."""
    rh = 22
    h = h or (len(items) * rh + 12)
    ml, mr = labw, 70 + note_w
    pw = w - ml - mr
    vmax = max(v for _, v, _ in items)
    b = []
    for k, (lab, v, txt) in enumerate(items):
        y = 6 + k * rh
        wd = v / vmax * pw
        b.append(f'<text x="{ml-8}" y="{y+13}" text-anchor="end" class="tick2">{esc(lab)}</text>')
        b.append(f'<rect x="{ml}" y="{y+2}" width="{max(1, wd):.1f}" height="{rh-8}" rx="3" fill="{color or T["c1"]}"/>')
        b.append(f'<text x="{ml+wd+6:.1f}" y="{y+13}" class="val">{esc(txt)}</text>')
    return _svg(w, h, label, b)


def lines(xs, series, label, unit, w=640, h=280, ymax=None, right=118, xstep=5, ticks_fmt=None, ymin=0):
    """折線圖 · lines. series: [(name, values (None allowed), color, width, end_label)]."""
    ml, mr, mt, mb = 52, right, 18, 28
    pw, ph = w - ml - mr, h - mt - mb
    allv = [v for s in series for v in s[1] if v is not None]
    ticks, top = _ticks(ymax or max(allv))
    x0, x1 = xs[0], xs[-1]
    X = lambda v: ml + (v - x0) / (x1 - x0) * pw
    Yv = lambda v: mt + ph - (v - ymin) / (top - ymin) * ph
    b = []
    for t in ticks:
        if t < ymin:
            continue
        b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(t):.1f}" y2="{Yv(t):.1f}" stroke="{T["grid"]}"/>')
        b.append(f'<text x="{ml-8}" y="{Yv(t)+4:.1f}" text-anchor="end" class="tick">{(ticks_fmt or fmt)(t)}</text>')
    for v in xs:
        if (v - x0) % xstep == 0 or (v == x1 and (v - x0) % xstep >= 3):
            b.append(f'<text x="{X(v):.1f}" y="{h-8}" text-anchor="middle" class="tick">{v}</text>')
    b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(ymin)}" y2="{Yv(ymin)}" stroke="{T["axis"]}"/>')
    ends = []
    for name, vals, col, wd, endlab in series:
        seg = []
        for x, v in zip(xs, vals):
            if v is None:
                if len(seg) > 1:
                    b.append(f'<polyline points="{" ".join(seg)}" fill="none" stroke="{col}" stroke-width="{wd}" stroke-linejoin="round"/>')
                seg = []
                continue
            seg.append(f'{X(x):.1f},{Yv(v):.1f}')
        if len(seg) > 1:
            b.append(f'<polyline points="{" ".join(seg)}" fill="none" stroke="{col}" stroke-width="{wd}" stroke-linejoin="round"/>')
        last = next(((x, v) for x, v in zip(reversed(xs), reversed(vals)) if v is not None), None)
        if last:
            b.append(f'<circle cx="{X(last[0]):.1f}" cy="{Yv(last[1]):.1f}" r="3" fill="{col}"/>')
            ends.append((Yv(last[1]) + 4, X(last[0]), name, col, endlab))
    ys = _spread([e[0] for e in ends], 13, mt + 4, mt + ph + 4)
    for (y, x, name, col, endlab), yy in zip(ends, ys):
        b.append(f'<text x="{x+8:.1f}" y="{yy:.1f}" class="lab" fill="{T["ink"]}"><tspan fill="{col}">●</tspan> {esc(name)} <tspan class="ann">{esc(endlab)}</tspan></text>')
    b.append(f'<text x="{ml-8}" y="{mt-6}" text-anchor="end" class="unit">{esc(unit)}</text>')
    return _svg(w, h, label, b)


def scatter_log(points, label, unit, w=640, h=300, x0=1885, x1=2030, labels=()):
    """里程碑風機的單機容量（對數）· milestone turbine ratings on a log scale. points: [(year, mw, kind, name)]."""
    ml, mr, mt, mb = 52, 16, 18, 28
    pw, ph = w - ml - mr, h - mt - mb
    lo, hi = math.log10(0.01), math.log10(30)
    X = lambda v: ml + (v - x0) / (x1 - x0) * pw
    Yv = lambda v: mt + ph - (math.log10(v) - lo) / (hi - lo) * ph
    b = []
    for t, s in ((0.01, '0.01'), (0.1, '0.1'), (1, '1'), (10, '10')):
        b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(t):.1f}" y2="{Yv(t):.1f}" stroke="{T["grid"]}"/>')
        b.append(f'<text x="{ml-8}" y="{Yv(t)+4:.1f}" text-anchor="end" class="tick">{s}</text>')
    for v in range(1900, 2030, 20):
        b.append(f'<text x="{X(v):.1f}" y="{h-8}" text-anchor="middle" class="tick">{v}</text>')
    b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{mt+ph}" y2="{mt+ph}" stroke="{T["axis"]}"/>')
    cols = {'onshore': T['c1'], 'offshore': T['c2'], 'floating': T['c3']}
    for yr, mw, kind, name in points:
        b.append(f'<circle cx="{X(yr):.1f}" cy="{Yv(mw):.1f}" r="5" fill="{cols.get(kind, T["other"])}" stroke="#fff" stroke-width="1.5"/>')
    for yr, mw, text, anchor, dx, dy in labels:
        b.append(f'<text x="{X(yr)+dx:.1f}" y="{Yv(mw)+dy:.1f}" text-anchor="{anchor}" class="ann">{esc(text)}</text>')
    b.append(f'<text x="{ml-8}" y="{mt-6}" text-anchor="end" class="unit">{esc(unit)}</text>')
    return _svg(w, h, label, b)


def strips(groups, label, unit, w=640, h=260, ymax=70, medlab='中位數'):
    """點狀分布 · dot strips. groups: [(label, sorted values, median)]."""
    ml, mr, mt, mb = 52, 16, 18, 34
    pw, ph = w - ml - mr, h - mt - mb
    Yv = lambda v: mt + ph - v / ymax * ph
    cw = pw / len(groups)
    b = []
    for t in range(0, ymax + 1, 10):
        b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(t):.1f}" y2="{Yv(t):.1f}" stroke="{T["grid"]}"/>')
        b.append(f'<text x="{ml-8}" y="{Yv(t)+4:.1f}" text-anchor="end" class="tick">{t}%</text>')
    for k, (lab, vals, med) in enumerate(groups):
        cx = ml + cw * (k + 0.5)
        n = len(vals)
        for j, v in enumerate(vals):
            jit = ((j * 0.6180339) % 1 - 0.5) * cw * 0.55
            b.append(f'<circle cx="{cx+jit:.1f}" cy="{Yv(v):.1f}" r="2.3" fill="{T["c2"]}" fill-opacity=".55"/>')
        b.append(f'<line x1="{cx-cw*0.34:.1f}" x2="{cx+cw*0.34:.1f}" y1="{Yv(med):.1f}" y2="{Yv(med):.1f}" stroke="{T["c1"]}" stroke-width="3"/>')
        b.append(f'<text x="{cx+cw*0.36:.1f}" y="{Yv(med)+4:.1f}" class="lab">{med:.1f}%</text>')
        b.append(f'<text x="{cx:.1f}" y="{h-18}" text-anchor="middle" class="tick2">{esc(lab)}</text>')
        b.append(f'<text x="{cx:.1f}" y="{h-5}" text-anchor="middle" class="ann">n = {n}</text>')
    b.append(f'<line x1="{ml}" x2="{ml+pw}" y1="{Yv(0)}" y2="{Yv(0)}" stroke="{T["axis"]}"/>')
    b.append(f'<text x="{ml-8}" y="{mt-6}" text-anchor="end" class="unit">{esc(unit)}</text>')
    return _svg(w, h, label, b)


CSS = f'''.chart{{width:100%;height:auto;display:block}}.chart .tick{{font-size:10.5px;fill:{T["muted"]};font-variant-numeric:tabular-nums}}
.chart .tick2{{font-size:11px;fill:{T["ink"]}}}.chart .lab{{font-size:11.5px;fill:{T["ink"]};font-weight:600}}.chart .ann{{font-size:10.5px;fill:{T["muted"]};font-weight:400}}
.chart .unit{{font-size:10px;fill:{T["muted"]}}}.chart .inbar{{font-size:11px;fill:#fff;font-weight:700}}.chart .val{{font-size:10.5px;fill:{T["ink"]};font-variant-numeric:tabular-nums}}'''
