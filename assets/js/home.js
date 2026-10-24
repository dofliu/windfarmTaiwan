/* 風電風情 · home.js — 首頁：台灣此刻（即時）× 全球 1980–2025（歷史）兩個尺度並排 */
(function () {
'use strict';
const WW = window.WW;
const $ = id => document.getElementById(id);
const EN = () => WW.lang === 'en';

/* ---------- 里程碑卡片（首頁與知識頁共用） ---------- */
const TYPE = { onshore: ['陸域', 'Onshore'], offshore: ['離岸', 'Offshore'], floating: ['浮動式', 'Floating'] };
WW.typeName = tp => (TYPE[tp] || TYPE.onshore)[EN() ? 1 : 0];
WW.msCard = (m, D) => {
  const a = WW.el('a', { class: 'mscard', href: WW.hashFor('global', null, { ms: m.name }) });
  a.appendChild(WW.el('span', { class: 'my' }, String(m.year)));
  a.appendChild(WW.el('span', { class: 'mn' }, m.name));
  a.appendChild(WW.el('span', { class: 'md' }, EN() ? m.en : m.zh));
  const c = D._idx[m.iso];
  const spec = [c ? WW.cname(c) : m.iso, WW.typeName(m.type), m.mw ? (m.mw < 1 ? WW.num(m.mw * 1000, 0) + ' kW' : m.mw + ' MW') : null, m.rotor ? 'Ø ' + m.rotor + ' m' : null].filter(Boolean).join(' · ');
  a.appendChild(WW.el('span', { class: 'mm' }, spec));
  return a;
};

/* ---------- 台灣此刻 ---------- */
function paintLive() {
  const L = WW.live; if (!L) return;
  const T = L.totals(), V = L.impactVals(), M = L.moodParts();
  $('hh-total').innerHTML = WW.int(T.total) + '<small>MW</small>';
  const mini = (k, v, u) => `<div class="mini"><div class="k">${k}</div><div class="v">${v}${u ? `<small>${u}</small>` : ''}</div></div>`;
  $('hh-minis').innerHTML =
    mini(EN() ? 'Availability' : '整體可用率', (T.ratio * 100).toFixed(1), '%') +
    mini(EN() ? 'Share of grid' : '佔全國發電', V.share != null ? V.share.toFixed(1) : '—', V.share != null ? '%' : '') +
    mini(EN() ? 'Homes powered' : '可供家戶', EN() ? WW.int(V.homes * 10) : V.homes.toFixed(V.homes < 10 ? 1 : 0), EN() ? 'k' : '萬戶');
  $('hh-mood').innerHTML = `${WW.windLevel(M.m.lv)} ${WW.esc(M.m.t)}`;
  paint7d();
  paintToday();
}

/* ---------- 今天的風：由資料算出的一句話（today.js） ---------- */
let WN = null, rot = 0, rotT = 0;
function paintToday() {
  const box = $('hh-today'); if (!box || !WW.todayFacts) return;
  const F = WW.todayFacts(WN); if (!F.length) { box.hidden = true; return; }
  let sty = 'a'; try { sty = localStorage.getItem('ww_hl') || 'a'; } catch (e) {}      // 樣本：a 一行橫幅、b 大標＋兩個小標籤、c 輪播
  box.hidden = false; box.className = 'hh-today s-' + sty;
  const fact = f => `<span class="ti" aria-hidden="true">${f.ic}</span><span class="tt">${WW.esc(f.text)}</span>` + (f.src ? `<span class="tsrc">${WW.esc(f.src)}</span>` : '');
  clearInterval(rotT);
  if (sty === 'b') box.innerHTML = `<div class="tmain">${fact(F[0])}</div>` + (F.length > 1 ? `<div class="tchips">${F.slice(1, 3).map(f => `<span class="tchip">${fact(f)}</span>`).join('')}</div>` : '');
  else if (sty === 'c') {
    const show = () => { const f = F[rot % F.length]; box.innerHTML = `<div class="trot">${fact(f)}</div><div class="tdots">${F.map((_, i) => `<i class="${i === rot % F.length ? 'on' : ''}"></i>`).join('')}</div>`; };
    show(); if (F.length > 1) rotT = setInterval(() => { rot++; show(); }, 6000);
  } else box.innerHTML = `<div class="tline">${fact(F[0])}</div>`;
}
if (WW.todayWind) WW.todayWind().then(w => { WN = w; if (WW.currentPage() === 'home') paintToday(); }).catch(() => {});

/* ---------- 台灣此刻：過去 7 天的全台出力（本站排程取樣的 wind_history.json，標出此刻與 7 天最高；滑過或方向鍵看各點） ·
   Taiwan's total output over the past 7 days from the site's sampled history, with now and the 7-day peak marked ---------- */
const tms = s => Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + '+08:00');    // 沒寫時區的是台灣時間
const tFmt = (ms, day) => { const x = new Date(ms + 288e5).toISOString(); return `${+x.slice(5, 7)}/${+x.slice(8, 10)}` + (day ? '' : ' ' + x.slice(11, 16)); };
let c7 = null;
function paint7d() {
  const box = $('hh-7d'), L = WW.live; if (!box || !L || !L.hist) return;
  const all = (L.hist().points || []).filter(p => p && p.t && typeof p.total === 'number').map(p => ({ t: tms(p.t), v: p.total })).filter(p => !isNaN(p.t)).sort((a, b) => a.t - b.t);
  const st = L.srcTime && L.srcTime(), now = st && L.isLive() ? tms(st) : NaN;
  if (all.length && !isNaN(now) && now > all[all.length - 1].t + 6e4) all.push({ t: now, v: L.totals().total });   // 補上此刻的即時值
  const end = all.length ? all[all.length - 1].t : 0, P = all.filter(p => p.t >= end - 7 * 864e5);
  if (P.length < 3 || P[P.length - 1].t - P[0].t < 864e5) { box.hidden = true; return; }
  box.hidden = false;
  c7 = { P, i: -1 };
  draw7d();
}
function draw7d() {
  const box = $('hh-7d'); if (!box || !c7 || box.hidden) return;
  const P = c7.P, n = P.length, W = Math.max(240, box.clientWidth || 520), H = 112, pt = 20, pb = 18;
  const t0 = P[0].t, t1 = P[n - 1].t, max = Math.max(...P.map(p => p.v), 1);
  const sx = t => (t - t0) / (t1 - t0) * (W - 12) + 6, sy = v => pt + (H - pt - pb) * (1 - v / max);
  const pk = P.reduce((b, p, i) => p.v > P[b].v ? i : b, 0), last = n - 1;
  const pts = P.map(p => sx(p.t).toFixed(1) + ',' + sy(p.v).toFixed(1)).join(' ');
  let g = '';
  for (let d = Math.ceil((t0 + 288e5) / 864e5) * 864e5 - 288e5; d <= t1; d += 864e5) {     // 台灣時間的每天 0 點
    const x = sx(d); g += `<line class="dy" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${pt - 6}" y2="${H - pb}"/>`;
    if (x < W - 30) g += `<text class="dt" x="${(x + 3).toFixed(1)}" y="${H - 5}">${tFmt(d, true)}</text>`;
  }
  const lab = (i, txt) => { const x = sx(P[i].t), y = sy(P[i].v), a = x > W - 120 ? 'end' : x < 90 ? 'start' : 'middle';
    return `<text class="pl" x="${(a === 'end' ? x + 4 : a === 'start' ? x - 4 : x).toFixed(1)}" y="${Math.max(11, y - 9).toFixed(1)}" text-anchor="${a}">${WW.esc(txt)}</text>`; };
  const nowTxt = EN() ? `Now ${WW.int(P[last].v)} MW` : `此刻 ${WW.int(P[last].v)} MW`;
  const pkTxt = (EN() ? '7-day high ' : '7 天最高 ') + WW.int(P[pk].v) + ' MW';
  const close = Math.abs(sx(P[pk].t) - sx(P[last].t)) < 130;
  const labels = pk === last ? lab(last, nowTxt + (EN() ? ' (7-day high)' : '（7 天最高）')) : (close ? lab(last, nowTxt) : lab(pk, pkTxt) + lab(last, nowTxt));
  const dot = (i, cls) => `<circle class="${cls}" cx="${sx(P[i].t).toFixed(1)}" cy="${sy(P[i].v).toFixed(1)}" r="4.5"/>`;
  const sum = EN()
    ? `Taiwan's total wind output over the past 7 days: high ${WW.int(P[pk].v)} MW (${tFmt(P[pk].t)}), now ${WW.int(P[last].v)} MW, ${n} samples`
    : `過去 7 天全台風電出力：最高 ${WW.int(P[pk].v)} MW（${tFmt(P[pk].t)}），此刻 ${WW.int(P[last].v)} MW，共 ${n} 個取樣點`;
  box.innerHTML = `<svg class="c7" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" tabindex="0" aria-label="${WW.esc(sum)}">${g}
    <polygon class="ar" points="${sx(t0).toFixed(1)},${H - pb} ${pts} ${sx(t1).toFixed(1)},${H - pb}"/><polyline class="ln" points="${pts}"/>
    <line class="bl" x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}"/>${pk !== last && !close ? dot(pk, 'pk') : ''}${dot(last, 'nw')}${labels}
    <g class="hv" visibility="hidden"><line class="cx" y1="${pt - 6}" y2="${H - pb}"/><circle class="hd" r="4.5"/></g></svg>
    <div class="t7" hidden></div>
    <div class="c7cap">${EN() ? `Past 7 days · ${n} samples taken by the site (uneven spacing)` : `過去 7 天 · 本站取樣 ${n} 點（間隔不等）`} · <a href="#/live/charts?mode=hist">${EN() ? 'Long-term trend →' : '長期趨勢 →'}</a></div>`;
  const svg = box.querySelector('svg'), hv = svg.querySelector('.hv'), tip = box.querySelector('.t7');
  const show = i => {
    c7.i = i; if (i < 0) { hv.setAttribute('visibility', 'hidden'); tip.hidden = true; return; }
    const x = sx(P[i].t), y = sy(P[i].v);
    hv.setAttribute('visibility', 'visible');
    hv.querySelector('.cx').setAttribute('x1', x); hv.querySelector('.cx').setAttribute('x2', x);
    hv.querySelector('.hd').setAttribute('cx', x); hv.querySelector('.hd').setAttribute('cy', y);
    tip.textContent = `${tFmt(P[i].t)} · ${WW.int(P[i].v)} MW`; tip.hidden = false;
    const tw = tip.offsetWidth; tip.style.left = Math.min(W - tw, Math.max(0, x - tw / 2)) + 'px';
  };
  const near = cx => { let b = 0; P.forEach((p, i) => { if (Math.abs(sx(p.t) - cx) < Math.abs(sx(P[b].t) - cx)) b = i; }); return b; };
  svg.onpointermove = e => { const r = svg.getBoundingClientRect(); show(near((e.clientX - r.left) * W / r.width)); };
  svg.onpointerleave = () => show(-1);
  svg.onblur = () => show(-1);
  svg.onkeydown = e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(n - 1, Math.max(0, (c7.i < 0 ? last : c7.i) + (e.key === 'ArrowLeft' ? -1 : 1)))); }
    else if (e.key === 'Escape') show(-1);
  };
}
if ('ResizeObserver' in window) { let w0 = 0; new ResizeObserver(es => { const w = Math.round(es[0].contentRect.width); if (w && Math.abs(w - w0) > 2) { w0 = w; draw7d(); } }).observe($('hh-7d')); }

/* ---------- 全球 1980–2025 ---------- */
function facts(D) {
  const i = D.years.length - 1, C = D.countries;
  const tot = k => C.reduce((s, c) => s + c.on[k] + c.off[k], 0), off = k => C.reduce((s, c) => s + c.off[k], 0);
  const tw = D._idx.TWN;
  const offRank = C.slice().sort((a, b) => b.off[i] - a.off[i]).indexOf(tw) + 1;
  const totRank = C.slice().sort((a, b) => (b.on[i] + b.off[i]) - (a.on[i] + a.off[i])).indexOf(tw) + 1;
  const firstOff = D.years[tw.off.findIndex(v => v > 0)];
  return {
    Y: D.Y1, world: tot(i), worldOff: off(i), add: tot(i) - tot(i - 1), nC: C.filter(c => c.on[i] + c.off[i] > 0.5).length,
    series: D.years.map((y, k) => tot(k)), twOff: tw.off[i], twOn: tw.on[i], offRank, totRank, twShare: tw.off[i] / off(i), firstOff
  };
}
WW.globalFacts = facts;
function paintWorld(D) {
  const F = facts(D);
  $('hh-world').innerHTML = WW.int(F.world / 1000) + '<small>GW</small>';
  $('hh-worldcap').innerHTML = EN()
    ? `Global cumulative wind capacity, end of ${F.Y} · = <b>${WW.int(F.world)} MW</b>`
    : `${F.Y} 年底全球風電累計裝置容量 · 相當於 <b>${WW.int(F.world)} MW</b>`;
  $('hh-spark').innerHTML = WW.chart.sparkArea(F.series, 600, 120, '#f0c86a');
  const mini = (k, v, u) => `<div class="mini"><div class="k">${k}</div><div class="v">${v}${u ? `<small>${u}</small>` : ''}</div></div>`;
  $('hh-wminis').innerHTML =
    mini(EN() ? `Added in ${F.Y}` : `${F.Y} 年新增`, WW.int(F.add / 1000), 'GW') +
    mini(EN() ? 'Offshore' : '其中離岸', WW.num(F.worldOff / 1000, 1), `GW · ${(F.worldOff / F.world * 100).toFixed(1)}%`) +
    mini(EN() ? 'Countries' : '國家（資料集）', F.nC, '');
  const tile = (k, v, u, s) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}${u ? `<small>${u}</small>` : ''}</div><div class="s">${s}</div></div>`;
  $('hh-twpos').innerHTML =
    tile(EN() ? 'Offshore wind, world rank' : '離岸風電 全球排名', '#' + F.offRank, '', EN() ? `${WW.int(F.twOff)} MW at the end of ${F.Y}` : `${F.Y} 年底 ${WW.int(F.twOff)} MW`) +
    tile(EN() ? 'Share of world offshore' : '佔全球離岸容量', (F.twShare * 100).toFixed(1), '%', EN() ? 'largest offshore market in Asia outside China' : '中國以外亞洲最大的離岸市場') +
    tile(EN() ? 'Since the first offshore turbines' : '距第一部離岸風機', F.Y - F.firstOff, EN() ? 'years' : '年', EN() ? `Formosa 1 demonstration, ${F.firstOff}` : `${F.firstOff} 年海洋風場示範機`) +
    tile(EN() ? 'All wind, world rank' : '風電總量 全球排名', '#' + F.totRank, '', EN() ? `onshore ${WW.int(F.twOn)} MW + offshore ${WW.int(F.twOff)} MW` : `陸域 ${WW.int(F.twOn)} MW＋離岸 ${WW.int(F.twOff)} MW`);
  const box = $('hh-ms'); box.textContent = '';
  ['Vindeby', 'Horns Rev 1', 'Formosa 1'].forEach(p => { const m = D.milestones.find(x => x.name.startsWith(p)); if (m) box.appendChild(WW.msCard(m, D)); });
}
/* 「最新可得」年份（country_stats.json 的 latest，與地球儀同一套算法）：有今年數字的國家用它，其他沿用去年底 ·
   the latest-available year, computed the same way as the globe: countries with this year's figure use it, the rest carry last year-end */
let ST = null;
function paintLatest(D) {
  const box = $('hh-worldlt'), LT = ST && ST.latest;
  if (!box || !LT || LT.year !== D.Y1 + 1) { if (box) box.hidden = true; return; }
  const i = D.years.length - 1;
  const tot = D.countries.reduce((s, c) => { const u = LT.countries[c.iso]; return s + (u ? u.on + u.off : c.on[i] + c.off[i]); }, 0);
  const U = Object.values(LT.countries), ms = U.map(u => u.asof).sort();
  const range = ms.length ? (ms[0] === ms[ms.length - 1] ? ms[0] : ms[0] + '–' + ms[ms.length - 1].slice(5)) : '';
  const est = U.some(u => u.est);
  box.innerHTML = EN()
    ? `<b>${LT.year} (latest available): about ${WW.int(tot / 1000)} GW</b> · ${U.length} countries have figures for this year (up to ${range}${est ? ', some estimated' : ''}); the rest carry the end of ${D.Y1}. The globe opens on this year.`
    : `<b>${LT.year}（最新可得）約 ${WW.int(tot / 1000)} GW</b> · ${U.length} 國已有今年數字（截至 ${range}${est ? '，部分為估計' : ''}），其他國家沿用 ${D.Y1} 年底；地球儀預設顯示這一年。`;
  box.hidden = false;
}
let GD = null;
function paintAll() { paintLive(); if (GD) { paintWorld(GD); paintLatest(GD); } }
WW.registerPage('home', { enter() { paintAll(); } });
WW.onLang(paintAll);
if (WW.live) WW.live.onUpdate(() => { if (WW.currentPage() === 'home') paintLive(); });
WW.getJSON(WW.DATA.stats).then(j => { ST = j; if (GD) paintLatest(GD); }).catch(() => {});
WW.globalData().then(D => { GD = D; paintWorld(D); paintLatest(D); }).catch(() => {
  $('hh-world').textContent = '—';
  $('hh-worldcap').textContent = EN() ? 'Global data could not be loaded.' : '全球資料載入失敗。';
});
})();
