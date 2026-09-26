/* 風電風情 · charts.js — 小型 SVG 圖表元件
   依 dataviz 規範：依容器實際寬度繪製（手機上字級不縮）、細線 2px、長條 ≤24px 且資料端 4px 圓角、
   段與段間 2px 底色間隙、點有 2px 底色外環、格線為細實線；每張圖都有 hover/鍵盤 tooltip 與「表格」檢視。
   tooltip／圖例／表格的文字一律用 textContent 寫入。 */
(function () {
'use strict';
const WW = window.WW;
const SURF = 'var(--surface-1)';

/* ---------- 刻度 ---------- */
function niceStep(range, n) {
  const raw = range / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw || 1))), m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}
function ticks(max, n) {
  const step = niceStep(max, n || 5), top = Math.ceil(max / step - 1e-9) * step, out = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(+v.toFixed(10));
  return { step, top: top || step, list: out.length > 1 ? out : [0, step] };
}
const textW = (s, px) => { let w = 0; for (const ch of String(s)) w += /[⺀-鿿豈-￯]/.test(ch) ? px * 1.02 : px * 0.58; return w; };

/* ---------- figure 外框：標題、圖例、繪圖區、表格切換、來源、tooltip ---------- */
function figure(host, o) {
  const fig = WW.el('figure', { class: 'fig' });
  const fh = WW.el('div', { class: 'fh' }), tt = WW.el('div');
  if (o.title) tt.appendChild(WW.el('div', { class: 'ft' }, o.title));
  if (o.subtitle) tt.appendChild(WW.el('div', { class: 'fs' }, o.subtitle));
  fh.appendChild(tt);
  const fa = WW.el('div', { class: 'fa' });
  (o.actions || []).forEach(a => fa.appendChild(a));
  let tblBtn = null;
  if (o.table) {
    tblBtn = WW.el('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false' }, WW.L('表格', 'Table'));
    fa.appendChild(tblBtn);
  }
  fh.appendChild(fa);
  fig.appendChild(fh);
  if (o.legend && o.legend.length > 1) {
    const lg = WW.el('div', { class: 'legend' });
    o.legend.forEach(s => {
      const sp = WW.el('span');
      sp.appendChild(WW.el('i', { class: s.shape === 'line' ? 'lk' : 'lr', style: 'background:' + s.color }));
      sp.appendChild(document.createTextNode(s.name));
      lg.appendChild(sp);
    });
    fig.appendChild(lg);
  }
  const plot = WW.el('div', { class: 'plot' });
  fig.appendChild(plot);
  let tbl = null;
  if (o.table) {
    tbl = WW.el('div', { class: 'tbl', hidden: '' });
    const t = WW.el('table'), th = WW.el('thead'), trh = WW.el('tr');
    o.table.head.forEach(h => trh.appendChild(WW.el('th', { scope: 'col' }, h)));
    th.appendChild(trh); t.appendChild(th);
    const tb = WW.el('tbody');
    o.table.rows.forEach(r => { const tr = WW.el('tr'); r.forEach(c => tr.appendChild(WW.el('td', null, c))); tb.appendChild(tr); });
    t.appendChild(tb); tbl.appendChild(t); fig.appendChild(tbl);
    tblBtn.onclick = () => {
      const on = tblBtn.getAttribute('aria-pressed') !== 'true';
      tblBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      tblBtn.textContent = on ? WW.L('圖表', 'Chart') : WW.L('表格', 'Table');
      tbl.hidden = !on; plot.hidden = on;
      if (!on) draw();
    };
  }
  if (o.source) fig.appendChild(WW.el('figcaption', { class: 'src' }, o.source));
  const tipEl = WW.el('div', { class: 'cht-tip', role: 'status', 'aria-live': 'polite' });
  fig.appendChild(tipEl);
  host.appendChild(fig);

  const tip = {
    show(px, py, title, rows) {
      tipEl.textContent = '';
      if (title) tipEl.appendChild(WW.el('div', { class: 'tt' }, title));
      rows.forEach(r => {
        const d = WW.el('div', { class: 'tr' });
        if (r.color) d.appendChild(WW.el('i', { class: 'tk', style: 'background:' + r.color + (r.shape === 'rect' ? ';height:9px;width:9px;border-radius:2px' : '') }));
        d.appendChild(WW.el('span', { class: 'tn' }, r.name));
        d.appendChild(WW.el('span', { class: 'tv' }, r.value));
        tipEl.appendChild(d);
      });
      tipEl.style.display = 'block';
      const fw = fig.clientWidth, tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
      let x = px + 14, y = py - th - 10;
      if (x + tw > fw - 6) x = px - tw - 14;
      if (x < 6) x = 6;
      if (y < 4) y = py + 16;
      tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
    },
    hide() { tipEl.style.display = 'none'; }
  };
  // 繪圖區相對 figure 的位移（tooltip 座標換算）
  const offset = () => ({ x: plot.offsetLeft, y: plot.offsetTop });
  let lastW = 0, raf = 0;
  function draw() {
    const w = Math.max(260, Math.floor(plot.clientWidth));
    if (!plot.clientWidth) return;
    lastW = w;
    plot.textContent = '';
    o.render(plot, w, tip, offset);
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      const w = Math.floor(plot.clientWidth);
      if (!w || Math.abs(w - lastW) < 2) return;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
    }).observe(plot);
  }
  requestAnimationFrame(draw);
  return { fig, plot, tip, draw };
}

function svgEl(w, h, label) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 ' + w + ' ' + h); s.setAttribute('width', w); s.setAttribute('height', h);
  s.setAttribute('role', 'img'); if (label) s.setAttribute('aria-label', label);
  return s;
}

/* ---------- 折線／面積（可堆疊）：十字線找 X，tooltip 列出所有序列 ---------- */
function line(host, o) {
  const H = o.height || 280;
  return figure(host, Object.assign({}, o, {
    legend: o.series.map(s => ({ name: s.name, color: s.color, shape: o.stacked || o.area ? 'rect' : 'line' })),
    render(plot, W, tip, offset) {
      const X = o.x, n = X.length, S = o.series;
      const stackTop = S.map(() => new Array(n).fill(0)), stackBot = S.map(() => new Array(n).fill(0));
      for (let i = 0; i < n; i++) { let acc = 0; S.forEach((s, k) => { stackBot[k][i] = o.stacked ? acc : 0; acc = (o.stacked ? acc : 0) + (s.values[i] || 0); stackTop[k][i] = o.stacked ? acc : (s.values[i] || 0); }); }
      const maxV = o.yMax || Math.max(...stackTop.map(a => Math.max(...a)), 1e-9);
      const tk = ticks(maxV, H > 240 ? 5 : 4), yf = o.yFmt || (v => WW.int(v));
      const endW = o.endLabels ? Math.max(...S.map(s => textW(s.name, 12)), ...S.map(s => textW(yf(s.values[n - 1] || 0), 11))) + 14 : 0;
      const pl = Math.max(...tk.list.map(v => textW(yf(v), 11))) + 12, pr = Math.max(14, endW), pt = o.annotations ? 26 : 12, pb = 26;
      const iw = W - pl - pr, ih = H - pt - pb;
      const xmin = X[0], xmax = X[n - 1];
      const sx = v => pl + (v - xmin) / (xmax - xmin || 1) * iw, sy = v => pt + ih - v / tk.top * ih;
      const svg = svgEl(W, H, o.title);
      let g = '<g class="ax">';
      tk.list.forEach(v => { g += `<line x1="${pl}" x2="${W - pr}" y1="${sy(v)}" y2="${sy(v)}" ${v === 0 ? 'class="base"' : ''}/><text x="${pl - 8}" y="${sy(v) + 4}" text-anchor="end">${WW.esc(yf(v))}</text>`; });
      const every = o.xEvery || (() => { const span = xmax - xmin, want = Math.max(3, Math.floor(iw / 70)); const c = [1, 2, 5, 10, 20, 25, 50]; return c.find(s => span / s <= want) || 50; })();
      X.forEach(x => { if ((x % every === 0) || x === xmax) { if (x !== xmax && xmax - x < every * 0.45) return; g += `<text x="${sx(x)}" y="${H - 8}" text-anchor="middle">${WW.esc(o.xFmt ? o.xFmt(x) : x)}</text>`; } });
      g += '</g>';
      // 註記（垂直細線＋上方文字），不與資料搶視覺
      (o.annotations || []).forEach(a => {
        const xx = sx(a.x);
        g += `<line x1="${xx}" x2="${xx}" y1="${pt - 4}" y2="${pt + ih}" stroke="rgba(255,255,255,.14)"/><text class="dl2" x="${xx}" y="${pt - 9}" text-anchor="${xx > W - 90 ? 'end' : xx < pl + 60 ? 'start' : 'middle'}">${WW.esc(a.label)}</text>`;
      });
      S.forEach((s, k) => {
        const top = stackTop[k].map((v, i) => `${sx(X[i]).toFixed(1)},${sy(v).toFixed(1)}`);
        if (o.stacked || o.area || s.area) {
          const bot = stackBot[k].map((v, i) => `${sx(X[i]).toFixed(1)},${sy(v).toFixed(1)}`).reverse();
          g += `<polygon points="${top.join(' ')} ${bot.join(' ')}" fill="${s.color}" fill-opacity="${o.stacked ? 0.24 : 0.1}"/>`;
        }
        g += `<polyline points="${top.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ' stroke-dasharray="6 5"' : ''}/>`;
      });
      // 端點直接標示（碰撞時只留優先者，其餘交給圖例與 tooltip）
      if (o.endLabels) {
        const labs = S.map((s, k) => ({ k, y: sy(stackTop[k][n - 1]), s })).sort((a, b) => a.y - b.y);
        let lastY = -1e9;
        labs.forEach(l => {
          if (l.y - lastY < 26) return;
          lastY = l.y;
          g += `<circle cx="${sx(xmax)}" cy="${l.y}" r="4" fill="${l.s.color}" stroke="${'#0d1829'}" stroke-width="2"/>`;
          g += `<text class="dl" x="${sx(xmax) + 8}" y="${l.y - 2}">${WW.esc(l.s.name)}</text><text class="dl2" x="${sx(xmax) + 8}" y="${l.y + 12}">${WW.esc(yf(l.s.values[n - 1] || 0))}</text>`;
        });
      }
      g += `<line class="xh" x1="0" x2="0" y1="${pt}" y2="${pt + ih}" stroke="rgba(255,255,255,.35)" visibility="hidden"/>`;
      g += S.map((s, k) => `<circle class="xd" data-k="${k}" r="4" fill="${s.color}" stroke="#0d1829" stroke-width="2" visibility="hidden"/>`).join('');
      g += `<rect class="hit" x="${pl}" y="${pt}" width="${iw}" height="${ih}" fill="transparent" tabindex="0" aria-label="${WW.esc(WW.L('用左右方向鍵逐點查看', 'Use arrow keys to step through points'))}"/>`;
      svg.innerHTML = g;
      plot.appendChild(svg);
      const xh = svg.querySelector('.xh'), dots = svg.querySelectorAll('.xd'), hit = svg.querySelector('.hit');
      let cur = -1;
      function at(i) {
        cur = i; const xx = sx(X[i]);
        xh.setAttribute('x1', xx); xh.setAttribute('x2', xx); xh.setAttribute('visibility', 'visible');
        dots.forEach((d, k) => { d.setAttribute('cx', xx); d.setAttribute('cy', sy(stackTop[k][i])); d.setAttribute('visibility', 'visible'); });
        const tf = o.tipFmt || yf;
        const rows = S.map(s => ({ color: s.color, name: s.name, value: tf(s.values[i] || 0) })).reverse();
        if (o.stacked && o.totalLabel) rows.unshift({ name: o.totalLabel, value: tf(stackTop[S.length - 1][i]) });
        const off = offset();
        tip.show(off.x + xx, off.y + sy(stackTop[S.length - 1][i]), o.xFmt ? o.xFmt(X[i]) : String(X[i]), rows);
      }
      function clear() { xh.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); tip.hide(); cur = -1; }
      hit.addEventListener('pointermove', ev => {
        const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (W / r.width);
        let best = 0, bd = 1e9; X.forEach((x, i) => { const d = Math.abs(sx(x) - px); if (d < bd) { bd = d; best = i; } });
        if (best !== cur) at(best);
      });
      hit.addEventListener('pointerleave', clear);
      hit.addEventListener('focus', () => at(n - 1));
      hit.addEventListener('blur', clear);
      hit.addEventListener('keydown', ev => {
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); at(Math.max(0, (cur < 0 ? n : cur) - 1)); }
        if (ev.key === 'ArrowRight') { ev.preventDefault(); at(Math.min(n - 1, cur + 1)); }
        if (ev.key === 'Escape') clear();
      });
    }
  }));
}

/* ---------- 直條（單一序列，例如每年新增） ---------- */
function columns(host, o) {
  const H = o.height || 240;
  return figure(host, Object.assign({}, o, {
    render(plot, W, tip, offset) {
      const X = o.x, V = o.values, n = X.length, yf = o.yFmt || (v => WW.int(v));
      const tk = ticks(Math.max(...V, 1e-9), 4);
      const pl = Math.max(...tk.list.map(v => textW(yf(v), 11))) + 12, pr = 10, pt = 14, pb = 26;
      const iw = W - pl - pr, ih = H - pt - pb, slot = iw / n, bw = Math.max(2, Math.min(24, slot - 2));
      const sy = v => pt + ih - v / tk.top * ih;
      const svg = svgEl(W, H, o.title);
      let g = '<g class="ax">';
      tk.list.forEach(v => { g += `<line x1="${pl}" x2="${W - pr}" y1="${sy(v)}" y2="${sy(v)}" ${v === 0 ? 'class="base"' : ''}/><text x="${pl - 8}" y="${sy(v) + 4}" text-anchor="end">${WW.esc(yf(v))}</text>`; });
      const every = o.xEvery || (n > 30 ? (iw < 500 ? 10 : 5) : n > 12 ? 2 : 1);
      X.forEach((x, i) => { if (i % every === 0 || i === n - 1) { if (i !== n - 1 && n - 1 - i < every * 0.6) return; g += `<text x="${pl + slot * i + slot / 2}" y="${H - 8}" text-anchor="middle">${WW.esc(o.xFmt ? o.xFmt(x) : x)}</text>`; } });
      g += '</g>';
      V.forEach((v, i) => {
        const x = pl + slot * i + (slot - bw) / 2, y = sy(v), h = Math.max(0, pt + ih - y), r = Math.min(4, bw / 2, h);
        const col = (o.highlight && o.highlight(i)) ? o.color : (o.mutedColor || o.color);
        const path = h > 0 ? `M${x},${pt + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${pt + ih} Z` : '';
        g += `<g class="hitbar" tabindex="0" data-i="${i}"><rect class="hit" x="${pl + slot * i}" y="${pt}" width="${slot}" height="${ih}" fill="transparent"/>${path ? `<path class="mk" d="${path}" fill="${col}"/>` : ''}</g>`;
      });
      (o.labels || []).forEach(i => { const x = pl + slot * i + slot / 2; g += `<text class="dl" x="${x}" y="${sy(V[i]) - 6}" text-anchor="${i > n - 3 ? 'end' : 'middle'}">${WW.esc(yf(V[i]))}</text>`; });
      svg.innerHTML = g; plot.appendChild(svg);
      svg.querySelectorAll('.hitbar').forEach(b => {
        const i = +b.dataset.i;
        const show = () => { const off = offset(); tip.show(off.x + pl + slot * i + slot / 2, off.y + sy(V[i]), o.xFmt ? o.xFmt(X[i]) : String(X[i]), [{ color: o.color, shape: 'rect', name: o.seriesName || '', value: (o.tipFmt || yf)(V[i]) }]); };
        b.addEventListener('pointerenter', show); b.addEventListener('focus', show);
        b.addEventListener('pointerleave', () => tip.hide()); b.addEventListener('blur', () => tip.hide());
      });
    }
  }));
}

/* ---------- 橫條（可分段堆疊、可強調單列） ---------- */
function hbar(host, o) {
  const rowH = o.rowH || 28;
  return figure(host, Object.assign({}, o, {
    legend: o.series.length > 1 ? o.series.map(s => ({ name: s.name, color: s.color, shape: 'rect' })) : null,
    render(plot, W, tip, offset) {
      const R = o.rows, S = o.series, vf = o.valueFmt || (v => WW.int(v));
      const tot = r => r.parts.reduce((a, b) => a + (b || 0), 0);
      const max = o.max || Math.max(...R.map(tot), 1e-9);
      const vlab = r => r.valueLabel != null ? r.valueLabel : vf(tot(r));
      const lw = Math.min(W * 0.34, Math.max(...R.map(r => textW(r.label, 12.5))) + 16), vw = Math.max(...R.map(r => textW(vlab(r), 12))) + 16;
      const iw = W - lw - vw, bh = Math.min(20, rowH - 8), H = R.length * rowH + 6;
      const svg = svgEl(W, H, o.title);
      let g = '';
      R.forEach((r, i) => {
        const y = 3 + i * rowH, cy = y + rowH / 2, hl = r.highlight;
        let x = lw, segs = '';
        const nz = r.parts.map((v, k) => [v, k]).filter(p => p[0] > 0);
        nz.forEach(([v, k], j) => {
          const w = Math.max(1, v / max * iw - (j < nz.length - 1 ? 2 : 0));
          const last = j === nz.length - 1, rr = last ? Math.min(4, w) : 0, top = cy - bh / 2;
          const col = (o.emphasis && !hl) ? (o.muted || '#40506a') : S[k].color;
          segs += last ? `<path class="mk" d="M${x},${top} H${x + w - rr} Q${x + w},${top} ${x + w},${top + rr} V${top + bh - rr} Q${x + w},${top + bh} ${x + w - rr},${top + bh} H${x} Z" fill="${col}"/>`
                       : `<rect class="mk" x="${x}" y="${top}" width="${w}" height="${bh}" fill="${col}"/>`;
          x += w + 2;
        });
        g += `<g class="hitbar" tabindex="0" data-i="${i}"><rect class="hit" x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent"/>`
          + `<text x="${lw - 10}" y="${cy + 4}" text-anchor="end" style="fill:${hl ? 'var(--ink)' : 'var(--ink-2)'};font-size:12.5px;font-weight:${hl ? 800 : 500}">${WW.esc(r.label)}</text>${segs}`
          + `<text x="${lw + tot(r) / max * iw + 8}" y="${cy + 4}" style="fill:${hl ? 'var(--ink)' : 'var(--ink-2)'};font-size:12px;font-weight:${hl ? 800 : 600}">${WW.esc(vlab(r))}</text></g>`;
      });
      svg.innerHTML = g; plot.appendChild(svg);
      svg.querySelectorAll('.hitbar').forEach(b => {
        const r = R[+b.dataset.i], i = +b.dataset.i;
        const show = () => {
          const off = offset();
          const rows = S.map((s, k) => ({ color: s.color, shape: 'rect', name: s.name, value: S.length === 1 && r.valueLabel != null ? r.valueLabel : vf(r.parts[k] || 0) })).filter((x, k) => S.length === 1 || r.parts[k] > 0);
          if (S.length > 1) rows.push({ name: o.totalLabel || WW.L('合計', 'Total'), value: vf(tot(r)) });
          tip.show(off.x + lw + tot(r) / max * iw, off.y + 3 + i * rowH, (r.rank ? '#' + r.rank + ' ' : '') + r.label, rows);
        };
        b.addEventListener('pointerenter', show); b.addEventListener('focus', show);
        b.addEventListener('pointerleave', () => tip.hide()); b.addEventListener('blur', () => tip.hide());
        if (r.onClick) { b.style.cursor = 'pointer'; b.addEventListener('click', r.onClick); b.addEventListener('keydown', ev => { if (ev.key === 'Enter') r.onClick(); }); }
      });
    }
  }));
}

/* ---------- 散佈圖（點 ≥8px、2px 外環、24px 命中區） ---------- */
function scatter(host, o) {
  const H = o.height || 300;
  return figure(host, Object.assign({}, o, {
    legend: o.series.map(s => ({ name: s.name, color: s.color, shape: 'rect' })),
    render(plot, W, tip, offset) {
      const P = o.points, yf = o.yFmt || (v => WW.int(v));
      const tk = ticks(o.yMax || Math.max(...P.map(p => p.y)), 5);
      const [x0, x1] = o.xDomain;
      const pl = Math.max(...tk.list.map(v => textW(yf(v), 11))) + 12, pr = 16, pt = 14, pb = 26, iw = W - pl - pr, ih = H - pt - pb;
      const sx = v => pl + (v - x0) / (x1 - x0) * iw, sy = v => pt + ih - v / tk.top * ih;
      const svg = svgEl(W, H, o.title);
      let g = '<g class="ax">';
      tk.list.forEach(v => { g += `<line x1="${pl}" x2="${W - pr}" y1="${sy(v)}" y2="${sy(v)}" ${v === 0 ? 'class="base"' : ''}/><text x="${pl - 8}" y="${sy(v) + 4}" text-anchor="end">${WW.esc(yf(v))}</text>`; });
      const every = o.xEvery || (iw < 420 ? 40 : 20);
      for (let x = Math.ceil(x0 / every) * every; x <= x1; x += every) g += `<text x="${sx(x)}" y="${H - 8}" text-anchor="middle">${x}</text>`;
      g += '</g>';
      (o.refLines || []).forEach(rl => { if (rl.y > tk.top) return; g += `<line x1="${pl}" x2="${W - pr}" y1="${sy(rl.y)}" y2="${sy(rl.y)}" stroke="rgba(255,255,255,.22)"/><text class="dl2" x="${pl + 6}" y="${sy(rl.y) - 5}">${WW.esc(rl.label)}</text>`; });
      P.forEach((p, i) => {
        const cx = sx(p.x), cy = sy(p.y);
        g += `<g class="hitbar" tabindex="0" data-i="${i}"><circle class="hit" cx="${cx}" cy="${cy}" r="12" fill="transparent"/><circle cx="${cx}" cy="${cy}" r="5" fill="${o.series[p.s].color}" stroke="#0d1829" stroke-width="2"/></g>`;
      });
      P.forEach(p => {
        if (!p.label) return;
        const cx = sx(p.x), cy = sy(p.y), right = cx > W - 140;
        g += `<text class="dl2" x="${cx + (right ? -9 : 9)}" y="${cy + (p.labelDy || -8)}" text-anchor="${right ? 'end' : 'start'}">${WW.esc(p.label)}</text>`;
      });
      svg.innerHTML = g; plot.appendChild(svg);
      svg.querySelectorAll('.hitbar').forEach(b => {
        const p = P[+b.dataset.i];
        const show = () => { const off = offset(); tip.show(off.x + sx(p.x), off.y + sy(p.y), p.title, p.rows || [{ color: o.series[p.s].color, shape: 'rect', name: o.series[p.s].name, value: yf(p.y) }]); };
        b.addEventListener('pointerenter', show); b.addEventListener('focus', show);
        b.addEventListener('pointerleave', () => tip.hide()); b.addEventListener('blur', () => tip.hide());
        if (p.onClick) { b.style.cursor = 'pointer'; b.addEventListener('click', p.onClick); b.addEventListener('keydown', ev => { if (ev.key === 'Enter') p.onClick(); }); }
      });
    }
  }));
}

/* ---------- 迷你走勢（首頁用；單一序列，無軸） ---------- */
function sparkArea(values, w, h, color) {
  const max = Math.max(...values, 1e-9), n = values.length;
  const pts = values.map((v, i) => `${(i / (n - 1) * w).toFixed(1)},${(h - 2 - v / max * (h - 6)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="spark" aria-hidden="true"><polygon points="0,${h} ${pts} ${w},${h}" fill="${color}" fill-opacity=".12"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}

WW.chart = { figure, line, columns, hbar, scatter, sparkArea, ticks };
})();
