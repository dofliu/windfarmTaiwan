/* 風電風情 · week.js — 首頁「本週風電回顧」：最近 7 天與前 7 天的全台風電（本站取樣），兩週長條圖＋重點，以及可分享的方形週報圖卡
   資料：data/archive/farm_daily.json（抓取程式約每 30 分鐘記下台電各併網點的瞬間出力，含民營；2026-10-22 以前約每 2 小時）與
   wind_history.json（約每小時一筆的全台出力，用來找最高瞬間）。都是取樣估計，不是官方發電量；取樣不到 12 次的日子以斜線標示、註明次數。
   「最近 7 天」是到昨天為止的 7 個完整日（台灣時間），今天還沒結束不算。 */
(function () {
'use strict';
const WW = window.WW;
const EN = () => WW.lang === 'en';
const L = (a, b) => EN() ? b : a;
const LOW = 12;                                        // 一天取樣少於這個次數：斜線標示
const tms = s => Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + '+08:00');
const md = k => +k.slice(5, 7) + '/' + +k.slice(8, 10);
const hhmm = ms => { const d = new Date(ms + 288e5); return (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const twDate = ms => new Date(ms + 288e5).toISOString().slice(0, 10);

let DP = null;
const daily = () => DP || (DP = WW.getLiveJSON(WW.DATA.farmDaily));

/* 計算：每天的全台平均出力＝各併網點（取樣總和 ÷ 取樣次數）相加 */
function compute(J) {
  const D = J.days || {}, today = twDate(Date.now()), keys = Object.keys(D).filter(k => k < today).sort();
  if (keys.length < 8) return null;
  const day = k => { const u = D[k].u || {}; let v = 0; for (const x of Object.values(u)) if (x[0]) v += x[1] / x[0]; return { k, v, n: (D[k].t || []).length }; };
  const cur = keys.slice(-7).map(day), prev = keys.slice(-14, -7).map(day);
  const avg = a => a.length ? a.reduce((s, x) => s + x.v, 0) / a.length : null;
  const A = avg(cur), B = prev.length === 7 ? avg(prev) : null;
  const hi = cur.reduce((b, x) => x.v > b.v ? x : b), lo = cur.reduce((b, x) => x.v < b.v ? x : b);
  // 容量因數最高的風場：最近 7 天、只計已列裝置容量的取樣；彙總項（其它台電自有、其它購電）不列
  const agg = {}, Lv = WW.live;
  cur.forEach(({ k }) => { for (const [id, x] of Object.entries(D[k].u || {})) { const a = agg[id] || (agg[id] = [0, 0, 0]); a[0] += x[3]; a[1] += x[4]; a[2] += x[2]; } });
  const isAgg = id => { const f = Lv && Lv.FARMS.find(x => x.id === id); return !f || f.agg || id.startsWith('u:'); };
  const best = Object.entries(agg).filter(([id, a]) => a[1] > 0 && a[2] > 0 && a[1] / a[2] >= 20 && !isAgg(id)).map(([id, a]) => ({ id, cf: a[0] / a[1] })).sort((a, b) => b.cf - a.cf)[0] || null;
  // 最高瞬間：wind_history 裡落在最近 7 天的點
  let peak = null;
  if (Lv && Lv.hist) (Lv.hist().points || []).forEach(p => { if (!p || typeof p.total !== 'number') return; const t = tms(p.t), k = twDate(t); if (k >= cur[0].k && k <= cur[6].k && (!peak || p.total > peak.v)) peak = { v: p.total, t }; });
  return { cur, prev, A, B, hi, lo, best, peak, n: cur.reduce((s, x) => s + x.n, 0), nPrev: prev.reduce((s, x) => s + x.n, 0), names: J.names || {} };
}
const fname = (R, id) => (WW.live && WW.live.unitName(id)) || R.names[id] || id;
function headline(R) {
  const A = WW.int(R.A);
  if (R.B == null) return L(`最近 7 天全台風電平均約 ${A} MW`, `Taiwan's wind averaged about ${A} MW over the last 7 days`);
  const d = (R.A - R.B) / R.B * 100;
  if (Math.abs(d) < 10) return L(`風和前一週差不多：最近 7 天全台風電平均約 ${A} MW`, `About the same as the week before: Taiwan's wind averaged about ${A} MW over the last 7 days`);
  return d > 0 ? L(`風比前一週大：最近 7 天全台風電平均約 ${A} MW，比前 7 天多 ${Math.round(d)}%`, `Windier than the week before: Taiwan's wind averaged about ${A} MW over the last 7 days, ${Math.round(d)}% more than the 7 days before`)
    : L(`風比前一週小：最近 7 天全台風電平均約 ${A} MW，比前 7 天少 ${Math.round(-d)}%`, `Calmer than the week before: Taiwan's wind averaged about ${A} MW over the last 7 days, ${Math.round(-d)}% less than the 7 days before`);
}
function chips(R) {
  const c = [[L('🌀 最有風', '🌀 Windiest'), L(`${md(R.hi.k)} 平均 ${WW.int(R.hi.v)} MW`, `${md(R.hi.k)}, ${WW.int(R.hi.v)} MW average`)]];
  if (R.peak) c.push([L('⚡ 最高瞬間', '⚡ Highest moment'), `${WW.int(R.peak.v)} MW（${hhmm(R.peak.t)}）`]);
  c.push([L('😴 最安靜', '😴 Calmest'), L(`${md(R.lo.k)} 平均 ${WW.int(R.lo.v)} MW`, `${md(R.lo.k)}, ${WW.int(R.lo.v)} MW average`)]);
  if (R.best) c.push([L('🏆 容量因數最高', '🏆 Highest capacity factor'), `${fname(R, R.best.id)} ${(R.best.cf * 100).toFixed(1)}%`]);
  return c;
}
const note = R => L(`取樣估計：本站約每 30 分鐘記下台電即時出力（2026-10-22 以前約每 2 小時）；斜線表示當天取樣不到 ${LOW} 次。最近 7 天共 ${WW.int(R.n)} 次${R.prev.length ? `、前 7 天 ${WW.int(R.nPrev)} 次` : ''}。不是官方發電量統計。`,
  `Estimates from samples: the site records Taipower's live output about every 30 minutes (about every 2 hours before 22 Oct 2026); hatched bars are days with fewer than ${LOW} samples. ${WW.int(R.n)} samples in the last 7 days${R.prev.length ? `, ${WW.int(R.nPrev)} in the 7 days before` : ''}. Not official generation statistics.`);

/* 兩週長條圖（SVG）：前 7 天灰、最近 7 天綠；滑過每根看日期、平均與取樣次數 */
function barsSVG(R, W, H) {
  const all = R.prev.concat(R.cur), np = R.prev.length, mx = Math.max(...all.map(x => x.v), 1), bw = W / all.length, top = 22, base = H - 18;
  let g = '<defs><pattern id="wkh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="wkhl"/></pattern></defs>';
  all.forEach((x, i) => {
    const h = Math.max(2, x.v / mx * (base - top)), X = i * bw + 2, w = bw - 4, Y = base - h, cls = i >= np ? 'wkc' : 'wkp';
    const tip = `${md(x.k)}: ${WW.int(x.v)} MW` + L(`（取樣 ${x.n} 次）`, ` (${x.n} samples)`);
    g += `<g><title>${WW.esc(tip)}</title><rect x="${X.toFixed(1)}" y="${Y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" class="${cls}"/>` + (x.n < LOW ? `<rect x="${X.toFixed(1)}" y="${Y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="url(#wkh)"/>` : '') +
      `<text x="${(X + w / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" class="wkd">${bw < 36 && i > 0 && x.k.slice(5, 7) === all[i - 1].k.slice(5, 7) ? +x.k.slice(8) : md(x.k)}</text></g>`;   // 窄螢幕：同月只寫日
  });
  g += `<line x1="0" x2="${W}" y1="${base}" y2="${base}" class="wkb"/>`;
  if (np) g += `<line x1="${(np * bw).toFixed(1)}" x2="${(np * bw).toFixed(1)}" y1="4" y2="${base}" class="wks"/><text x="${(np * bw / 2).toFixed(1)}" y="13" text-anchor="middle" class="wkl">${WW.esc(L(`前 7 天 平均 ${WW.int(R.B)} MW`, `7 days before: ${WW.int(R.B)} MW avg`))}</text>`;
  g += `<text x="${((np + 3.5) * bw).toFixed(1)}" y="13" text-anchor="middle" class="wkl wklc">${WW.esc(L(`最近 7 天 平均 ${WW.int(R.A)} MW`, `Last 7 days: ${WW.int(R.A)} MW avg`))}</text>`;
  const lab = all.map(x => `${md(x.k)} ${WW.int(x.v)} MW`).join(', ');
  return `<svg class="wkbars" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${WW.esc(L('每日全台風電平均出力（取樣）：', 'Daily average wind output in Taiwan (samples): ') + lab)}">${g}</svg>`;
}

/* ---------- 首頁 ---------- */
let RES = null;
function paint() {
  const box = document.getElementById('hweek'); if (!box) return;
  if (!RES) { box.hidden = true; return; }
  const R = RES, rng = md(R.cur[0].k) + '–' + md(R.cur[6].k);
  box.hidden = false;
  document.getElementById('hweek-rng').textContent = rng;
  document.getElementById('hweek-body').innerHTML = `<h3 class="wkhd">${WW.esc(headline(R))}</h3>
    <div class="wkrow"><div class="wkchart" id="hweek-chart"></div>
    <ul class="wkchips">${chips(R).map(c => `<li><b>${WW.esc(c[0])}</b>${WW.L('：', ': ')}${WW.esc(c[1])}</li>`).join('')}</ul></div>
    <p class="wknote">${WW.esc(note(R))}</p>`;
  drawBars();
}
function drawBars() {                                   // 依實際寬度畫，字在手機上才不會被縮小
  const el = document.getElementById('hweek-chart'); if (!el || !RES) return;
  const w = Math.max(280, Math.round(el.clientWidth || 460));
  el.innerHTML = barsSVG(RES, w, w < 420 ? 170 : 190);
}
let rzT = 0;
window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(drawBars, 150); });
let JD = null;
function load() {
  daily().then(J => { JD = J; RES = compute(J); paint(); }).catch(e => { console.warn(e); RES = null; paint(); });
}

/* ---------- 方形週報圖卡（1080×1080） ---------- */
const CN = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
WW.weekCard = () => daily().then(J => {
  const R = RES || compute(J); if (!R) throw new Error('no weekly data');
  const S = 1080, pad = 72, cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#10223a'); g.addColorStop(1, '#050b16'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  const y0 = R.cur[0].k, y1 = R.cur[6].k;
  x.fillStyle = '#eaf1f8'; x.font = `900 40px ${CN}`; x.fillText(L('風電風情 · 本週風電回顧', 'Taiwan Wind Watch · This week'), pad, 112);
  x.fillStyle = '#a9b7c9'; x.font = `600 26px ${CN}`; x.fillText(`${y0.replace(/-/g, '/')} – ${md(y1)}` + L('（台灣時間）', ' (Taiwan time)'), pad, 156);
  x.fillStyle = '#ffffff'; x.font = `900 150px ${CN}`; const ns = WW.int(R.A), nw = x.measureText(ns).width; x.fillText(ns, pad - 4, 310);
  x.fillStyle = '#a9b7c9'; x.font = `800 44px ${CN}`; x.fillText(L('MW 平均', 'MW average'), pad + nw + 14, 310);
  const d = R.B ? (R.A - R.B) / R.B * 100 : null;
  x.fillStyle = '#ffd98a'; x.font = `800 36px ${CN}`;
  x.fillText((d == null ? '' : Math.abs(d) < 10 ? L('與前 7 天差不多', 'About the same as the 7 days before') : d > 0 ? L(`比前 7 天多 ${Math.round(d)}%`, `${Math.round(d)}% more than the 7 days before`) : L(`比前 7 天少 ${Math.round(-d)}%`, `${Math.round(-d)}% less than the 7 days before`)) + L(`　·　最有風 ${md(R.hi.k)}`, `  ·  windiest ${md(R.hi.k)}`), pad, 372);
  // 長條
  const all = R.prev.concat(R.cur), np = R.prev.length, mx = Math.max(...all.map(v => v.v), 1), X0 = pad, W = S - pad * 2, top = 440, base = 760, bw = W / all.length;
  x.font = `600 22px ${CN}`; x.textAlign = 'center';
  if (np) { x.fillStyle = '#a9b7c9'; x.fillText(L(`前 7 天 平均 ${WW.int(R.B)} MW`, `7 days before: ${WW.int(R.B)} MW`), X0 + np * bw / 2, top - 14); }
  x.fillStyle = '#3fdcb0'; x.fillText(L(`最近 7 天 平均 ${WW.int(R.A)} MW`, `Last 7 days: ${WW.int(R.A)} MW`), X0 + (np + 3.5) * bw, top - 14);
  all.forEach((v, i) => {
    const h = Math.max(4, v.v / mx * (base - top - 10)), bx = X0 + i * bw + 5, w = bw - 10, by = base - h;
    rr(x, bx, by, w, h, 6); x.fillStyle = i >= np ? '#3fdcb0' : '#5b6b80'; x.fill();
    if (v.n < LOW) { x.save(); rr(x, bx, by, w, h, 6); x.clip(); x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 3; for (let k = -h; k < w + h; k += 12) { x.beginPath(); x.moveTo(bx + k, by + h); x.lineTo(bx + k + h, by); x.stroke(); } x.restore(); }
    x.fillStyle = '#7d8ca3'; x.font = `600 19px ${CN}`; x.fillText(md(v.k), bx + w / 2, base + 30);
  });
  if (np) { x.strokeStyle = 'rgba(255,255,255,.25)'; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(X0 + np * bw, top); x.lineTo(X0 + np * bw, base); x.stroke(); x.setLineDash([]); }
  x.textAlign = 'left';
  // 重點
  x.font = `700 26px ${CN}`; x.fillStyle = '#eaf1f8';
  chips(R).slice(0, 4).forEach((c, i) => x.fillText(c[0] + L('：', ': ') + c[1], pad + (i % 2) * 470, 850 + Math.floor(i / 2) * 42));
  x.fillStyle = '#7d8ca3'; x.font = `500 18px ${CN}`;
  x.fillText(L(`本站取樣估計（最近 7 天 ${R.n} 次，斜線＝當天不到 ${LOW} 次），非官方發電量；資料：台電開放資料`, `Site samples (${R.n} in the last 7 days; hatched = under ${LOW} that day), not official generation; data: Taipower open data`), pad, 1000);
  x.fillStyle = '#3fdcb0'; x.font = `800 24px ${CN}`; x.fillText('dofliu.github.io/windfarmTaiwan', pad, 1036);
  return cv;
});
WW.weekShareText = () => RES ? headline(RES) : '';

let asked = false;
const onHome = () => (WW.currentPage() || (location.hash.replace(/^#\/?/, '').split(/[/?]/)[0] || 'home')) === 'home';
const ensure = () => { if (!asked && onHome()) { asked = true; load(); } };   // 只在首頁才載入取樣檔
function init() { ensure(); window.addEventListener('hashchange', ensure); const b = document.getElementById('hweek-share'); if (b) b.onclick = () => WW.shareTodayCard && WW.shareTodayCard('week'); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
WW.onLang(paint);
if (WW.live) WW.live.onUpdate(() => { if (JD && WW.currentPage() === 'home') { RES = compute(JD); paint(); } });   // 7 天趨勢晚一點才載入：到了再補上最高瞬間
})();
