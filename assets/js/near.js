/* 風電風情 · near.js — 「我附近」：用瀏覽器的定位找最近的風場與此刻的風
   位置只在這台瀏覽器裡計算：風場清單（wind_farms.json）與風的資料（GFS wind_now）都是本站原本就公開的檔案，整份下載後在本機比對，
   不把座標傳到任何地方，也不存下來。風速是 GFS 模式離地 10 m 的值，色階與地球儀「此刻的風」的風機運轉相同（僅供參考）。 */
(function () {
'use strict';
const WW = window.WW;
const EN = () => WW.lang === 'en';
const L = (a, b) => EN() ? b : a;
const R2D = 180 / Math.PI, D2R = Math.PI / 180;
const km = (a, b, c, d) => { const p = (c - a) * D2R, q = (d - b) * D2R, x = Math.sin(p / 2) ** 2 + Math.cos(a * D2R) * Math.cos(c * D2R) * Math.sin(q / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const DIRS = { zh: ['北', '東北', '東', '東南', '南', '西南', '西', '西北'], en: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] };
const bearing = (a, b, c, d) => { const y = Math.sin((d - b) * D2R) * Math.cos(c * D2R), x = Math.cos(a * D2R) * Math.sin(c * D2R) - Math.sin(a * D2R) * Math.cos(c * D2R) * Math.cos((d - b) * D2R); return (Math.atan2(y, x) * R2D + 360) % 360; };
const dirName = deg => (EN() ? DIRS.en : DIRS.zh)[Math.round(deg / 45) % 8];
const TY = ['onshore', 'offshore', 'floating'], TYN = { onshore: ['陸域', 'onshore'], offshore: ['離岸', 'offshore'], floating: ['浮動式', 'floating'] };

/* 營運中、位置不是共用代用點的風場（flags 4 是省或國家中心的代用點，不能拿來算距離；flags 1 是概略位置，照算但註明） */
let FP = null;
function farms() {
  if (FP) return FP;
  // 一般用 farm_points.json（只有營運中風場的點位，約 0.5 MB 壓縮後）；單檔版裡完整的 wind_farms.json 已經內嵌，直接用它，不另外內嵌小檔
  FP = WW.standalone ? WW.getJSON(WW.DATA.farms).then(J => {
    const Y = new Date().getFullYear();
    return J.rows.filter(r => r[8] === 0 && !(r[12] & 4) && !(r[9] && r[9] <= Y)).map(r => ({ name: r[0], zh: r[1] || null, iso: r[2], lat: r[3], lon: r[4], mw: r[5], year: r[6], type: TY[r[7]] || 'onshore', approx: !!(r[12] & 1) }));
  }) : WW.getJSON(WW.DATA.farmPoints).then(J => J.rows.map(r => ({ name: r[0], zh: r[1] || null, iso: r[2], lat: r[3], lon: r[4], mw: r[5], year: r[6], type: TY[r[7]] || 'onshore', approx: !!r[8] })));
  return FP;
}
function locate() {
  return new Promise((ok, no) => {
    if (!navigator.geolocation) return no(new Error('nogeo'));
    navigator.geolocation.getCurrentPosition(p => ok({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }), no, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
  });
}
/* 台灣的即時出力：全球資料集的風場名稱 → 台電機組（只有對得上的才有） */
function liveOf(f) {
  const Lv = WW.live; if (!Lv || f.iso !== 'TWN') return null;
  const U = Lv.unitsForGlobalFarm(f.name); if (!U.length) return null;
  const out = U.reduce((s, u) => s + (Lv.RT[u.id] || 0), 0), cap = U.reduce((s, u) => s + (u.cap || 0), 0);
  return { out, cap, ratio: cap > 0 ? out / cap : null, units: U, live: Lv.isLive() };
}
function compute(pos) {
  return Promise.all([farms(), WW.todayWind ? WW.todayWind().catch(() => null) : null]).then(([F, W]) => {
    const near = F.map(f => ({ f, d: km(pos.lat, pos.lon, f.lat, f.lon), b: bearing(pos.lat, pos.lon, f.lat, f.lon) })).sort((a, b) => a.d - b.d).slice(0, 5);
    let wind = null;
    if (W) { const [u, v] = W.at(pos.lon, pos.lat); wind = { s: Math.hypot(u, v), from: (Math.atan2(-u, -v) * R2D + 360) % 360, run: W.run }; }
    const tw = near.find(n => n.f.iso === 'TWN' && liveOf(n.f));
    return { pos, near, wind, W, liveNear: tw && tw !== near[0] && tw.d < 80 ? tw : null };
  });
}
const band = s => { const B = WW.windBands ? WW.windBands() : []; return s < 3 ? B[0] : s < 12 ? B[1] : s < 25 ? B[2] : B[3]; };
const p2 = n => String(n).padStart(2, '0');
const twTime = ms => { const d = new Date(ms + 288e5); return (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + ' ' + p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); };
const fname = f => EN() || !f.zh ? f.name : f.zh;
const fkm = d => d < 10 ? d.toFixed(1) : WW.int(d);

/* ---------- 文字版：風速＋色階、最近的風場（距離、方位、容量、台灣有即時出力的寫出此刻出力） ---------- */
function textHTML(r) {
  const n0 = r.near[0], w = r.wind, b = w && band(w.s), esc = WW.esc;
  let h = '';
  if (w) h += `<div class="nwind"><span class="nband" style="--c:${b[0]}"></span><div><div class="nv">${w.s.toFixed(1)}<small> m/s</small> <span class="nfrom">${L('吹' + dirName(w.from) + '風', 'from the ' + dirName(w.from))}</span></div>
    <div class="nk">${L('你這裡此刻的風', 'The wind where you are')} · <b style="color:${b[0] === '#4a5262' ? 'var(--ink-2)' : b[0]}">${esc(b[1])}</b></div></div></div>`;
  const farmRow = (n, title) => {
    const lv = liveOf(n.f);
    return `<div class="nfarm"><div class="nk">${title}</div><div class="nname">${esc(fname(n.f))}</div>
      <div class="nmeta">${L('往' + dirName(n.b) + '約 ', 'About ')}${fkm(n.d)} km${L('', ' ' + dirName(n.b))} · ${esc(L(TYN[n.f.type][0], TYN[n.f.type][1]))} · ${WW.int(n.f.mw)} MW${n.f.year ? ' · ' + n.f.year : ''}${n.f.approx ? ' · ' + L('位置為概略', 'approximate position') : ''}</div>
      ${lv ? `<div class="nlive">🌬 ${L('此刻出力', 'Output now')} <b>${lv.out.toFixed(1)} MW</b>${lv.ratio != null ? ` · ${L('可用率', 'availability')} ${(lv.ratio * 100).toFixed(0)}%` : ''}${lv.live ? '' : ' ' + L('（模擬）', '(simulated)')}</div>` : ''}
      <div class="nact"><a class="btn sm" href="${WW.hashFor('global', null, { f: n.f.name })}">🌍 ${L('在地球儀上看', 'On the globe')}</a>${lv ? `<a class="btn sm" href="${WW.hashFor('live', null, { farm: lv.units[0].id })}">${L('即時詳情', 'Live details')} →</a>` : ''}</div></div>`;
  };
  h += farmRow(n0, L('離你最近的風場', 'Nearest wind farm'));
  if (r.liveNear) h += farmRow(r.liveNear, L('最近有即時資料的風場', 'Nearest farm with live data'));
  return h;
}
/* ---------- 地圖版：以你為中心，此刻的風（色階＋風向短線）、陸地、最近 5 座風場與距離 ---------- */
let BR = null;
const borders = () => BR || (BR = WW.getJSON(WW.DATA.borders).catch(() => ({ borders: [], ringIso: [] })));
function drawMap(cv, r, B) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), Wd = cv.clientWidth || 600, Hd = Math.round(Wd * 0.6);
  cv.width = Wd * dpr; cv.height = Hd * dpr; cv.style.height = Hd + 'px';
  const x = cv.getContext('2d'); x.scale(dpr, dpr);
  const far = r.near[Math.min(2, r.near.length - 1)].d, spanKm = Math.min(450, Math.max(25, far * 2.6));
  const kx = Math.cos(r.pos.lat * D2R), s = Wd / (spanKm / 111.32);         // 像素／緯度
  const P = (lon, lat) => [Wd / 2 + (lon - r.pos.lon) * kx * s, Hd / 2 - (lat - r.pos.lat) * s];
  const lonAt = px => r.pos.lon + (px - Wd / 2) / (kx * s), latAt = py => r.pos.lat - (py - Hd / 2) / s;
  x.fillStyle = '#081324'; x.fillRect(0, 0, Wd, Hd);
  if (r.W && WW.windColor) {
    const R = 4, iw = Math.ceil(Wd / R), ih = Math.ceil(Hd / R), im = new ImageData(iw, ih);
    for (let j = 0; j < ih; j++) for (let i = 0; i < iw; i++) { const [u, v] = r.W.at(lonAt(i * R), latAt(j * R)), c = WW.windColor(Math.hypot(u, v)), o = (j * iw + i) * 4; im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = c[3] * 230; }
    const tc = document.createElement('canvas'); tc.width = iw; tc.height = ih; tc.getContext('2d').putImageData(im, 0, 0);
    x.imageSmoothingEnabled = true; x.drawImage(tc, 0, 0, iw * R, ih * R);
  }
  const lonMin = lonAt(-20), lonMax = lonAt(Wd + 20), latMax = latAt(-20), latMin = latAt(Hd + 20);
  const rings = spanKm < 150 ? [] : B.borders.filter(rg => {   // 國界是 1:50m 的粗略海岸線，近看會偏好幾公里，地圖小於 150 km 時不畫                         // 外框與畫面相交就畫（國界頂點很疏，不能只看有沒有頂點落在畫面裡）
    let a = 180, b = -180, c = 90, d = -90; for (let k = 0; k < rg.length; k += 2) { a = Math.min(a, rg[k]); b = Math.max(b, rg[k]); c = Math.min(c, rg[k + 1]); d = Math.max(d, rg[k + 1]); }
    return b > lonMin && a < lonMax && d > latMin && c < latMax; });
  const path = rg => { x.beginPath(); for (let k = 0; k < rg.length; k += 2) { const [px, py] = P(rg[k], rg[k + 1]); k ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); };
  rings.forEach(rg => { path(rg); x.fillStyle = 'rgba(22,35,58,.22)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.4; x.stroke(); });
  if (r.W) {                                                       // 風向短線
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineCap = 'round';
    for (let py = 18; py < Hd; py += 36) for (let px = 18; px < Wd; px += 36) {
      const [u, v] = r.W.at(lonAt(px), latAt(py)), sp = Math.hypot(u, v); if (sp < 1) continue;
      const Ln = 7 + Math.min(1, sp / 20) * 16; x.lineWidth = 1.2 + Math.min(1.6, sp / 12);
      x.beginPath(); x.moveTo(px - u / sp * Ln / 2, py + v / sp * Ln / 2); x.lineTo(px + u / sp * Ln / 2, py - v / sp * Ln / 2); x.stroke();
    }
  }
  x.font = '600 12px "Noto Sans TC",sans-serif'; x.textBaseline = 'middle';
  const boxes = [[Wd / 2 - 12, Hd / 2 - 12, 80, 24]], hit = b => boxes.some(q => b[0] < q[0] + q[2] && q[0] < b[0] + b[2] && b[1] < q[1] + q[3] && q[1] < b[1] + b[3]);
  const labels = [];
  r.near.slice().reverse().forEach((n, i) => {
    const [px, py] = P(n.f.lon, n.f.lat), first = n === r.near[0];
    x.setLineDash([4, 4]); x.strokeStyle = first ? 'rgba(63,220,176,.9)' : 'rgba(255,255,255,.35)'; x.lineWidth = first ? 2 : 1;
    x.beginPath(); x.moveTo(Wd / 2, Hd / 2); x.lineTo(px, py); x.stroke(); x.setLineDash([]);
    const lv = liveOf(n.f), rr = 5 + Math.min(9, Math.sqrt(n.f.mw) / 2.2);
    x.beginPath(); x.arc(px, py, rr, 0, 7); x.fillStyle = lv ? `rgba(63,220,176,${0.45 + 0.5 * Math.min(1, lv.ratio || 0)})` : 'rgba(169,183,201,.7)'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#04241b'; x.stroke();
    labels.unshift({ n, px, py, rr, first });
  });
  labels.forEach(({ n, px, py, rr, first }) => {                 // 標籤由近到遠放：右、左、上、下都撞到就不標（點還在）
    const t = fname(n.f) + ' · ' + fkm(n.d) + ' km', tw = x.measureText(t).width + 8, cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const cand = [[px + rr + 4, py - 9], [px - rr - 4 - tw, py - 9], [px - tw / 2, py - rr - 22], [px - tw / 2, py + rr + 4]].map(([a, b]) => [cl(a, 4, Wd - tw - 4), cl(b, 4, Hd - 22), tw, 18]);
    const b = cand.find(c => !hit(c)); if (!b) return;
    boxes.push(b); x.fillStyle = 'rgba(8,19,36,.8)'; x.fillRect(b[0], b[1], b[2], b[3]); x.fillStyle = first ? '#3fdcb0' : '#eaf1f8'; x.fillText(t, b[0] + 4, b[1] + 9);
  });
  x.beginPath(); x.arc(Wd / 2, Hd / 2, 9, 0, 7); x.fillStyle = '#ffd98a'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#081324'; x.stroke();
  x.fillStyle = '#ffd98a'; x.font = '800 12px "Noto Sans TC",sans-serif'; x.fillText(L('你在這裡', 'You'), Wd / 2 + 13, Hd / 2 - 1);
  // 比例尺
  const sk = [5, 10, 20, 50, 100, 200].find(v => v * s / 111.32 > Wd * 0.12) || 200, sw = sk * s / 111.32;
  x.strokeStyle = '#eaf1f8'; x.lineWidth = 2; x.beginPath(); x.moveTo(12, Hd - 14); x.lineTo(12 + sw, Hd - 14); x.stroke();
  x.fillStyle = '#eaf1f8'; x.font = '600 11px "Noto Sans TC",sans-serif'; x.fillText(sk + ' km', 12, Hd - 26);
}

/* ---------- 首頁「我附近」：按了才定位 ---------- */
function mount() {
  const btn = document.getElementById('nearbtn'), box = document.getElementById('nearbox'); if (!btn || !box) return;
  btn.onclick = () => {
    if (!box.hidden && box.dataset.ok) { box.hidden = true; btn.setAttribute('aria-expanded', 'false'); return; }
    box.hidden = false; btn.setAttribute('aria-expanded', 'true');
    box.innerHTML = `<div class="nnote">${L('定位中…（位置只在這台瀏覽器裡計算，不會傳出去，也不會存下來）', 'Finding you… (your position is used only in this browser; it is never sent anywhere or stored)')}</div>`;
    locate().then(compute).then(r => Promise.all([r, borders()])).then(([r, B]) => {
      box.dataset.ok = '1';                                        // 地圖＋文字（使用者 2026-10-25 選定）
      box.innerHTML = ('<canvas class="nmap" aria-label="' + WW.esc(L('以你為中心的地圖：此刻的風與最近的風場', 'Map centred on you: the wind now and the nearest farms')) + '"></canvas>') +
        '<div class="ntext">' + textHTML(r) + '</div>' +
        `<div class="nnote">${L('風：NOAA GFS 模式離地 10 m（1° 網格內插，代表大範圍的風，不是你家門口的實測）', 'Wind: NOAA GFS model, 10 m above ground (interpolated from a 1° grid: the wind over the wider area, not a measurement at your door)')}${r.wind ? '（' + twTime(r.wind.run) + '）' : ''}${L('，色階是風機運轉的大致區間，輪轂高度的風通常更強。位置只在這台瀏覽器裡計算，不會傳出去，也不會存下來。', '; the colours are rough turbine operating ranges, and wind at hub height is usually stronger. Your position is used only in this browser; it is never sent anywhere or stored.')}</div>`;
      drawMap(box.querySelector('.nmap'), r, B);
    }).catch(e => {
      box.dataset.ok = '';
      box.innerHTML = `<div class="nnote">${e && e.code === 1 ? L('沒有取得定位權限。可以在瀏覽器的網站設定允許「位置」後再按一次。', 'Location permission was not given. Allow location for this site in your browser settings and try again.')
        : L('暫時無法定位或載入資料，請稍後再試。', 'Could not get your location or load the data; please try again later.')}</div>`;
    });
  };
}
WW.nearMe = { compute, textHTML, drawMap, locate, borders, dirName, band };   // 探險版「離我最近的風車」共用
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
