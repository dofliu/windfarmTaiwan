/* 風電風情 · today.js — 「今天的風」：首頁一句話標題（全部由資料算出）與分享圖卡
   標題只寫資料看得到的事：此刻出力與本站過去 7 天取樣比、近 3 小時的變化、可用率、台灣附近 GFS 模式的最大風速；不寫推測與因果。
   另從 farm_daily.json 判斷紀錄：昨天是不是取樣以來（或本月）最有風的一天、此刻（或今天某一刻）是不是取樣以來最高的出力（每天的最高取樣 mx 自 2026-10-26 起才有，累積滿 14 天才比）。
   圖卡：方形、橫式、直式三種，含資料時間（年月日時分）、近 7 天曲線與台灣附近此刻的風（GFS 底色）。 */
(function () {
'use strict';
const WW = window.WW;
let LO = null;                                      // 語言覆蓋：嵌入小卡（#/embed?l=en）用
const EN = () => (LO || WW.lang) === 'en';
const tms = s => Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + '+08:00');    // 沒寫時區的是台灣時間
const p2 = n => String(n).padStart(2, '0');
const twTime = (ms, withYear) => { const d = new Date(ms + 288e5); return (withYear ? d.getUTCFullYear() + '/' : '') + (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + ' ' + p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); };

/* ---------- 台灣附近此刻的風（GFS 離地 10 m，與地球儀「此刻的風」同一份資料） ---------- */
const BOX = { lon0: 116, lon1: 126, lat0: 19, lat1: 29 };       // 圖卡地圖範圍
const NEAR = { lon0: 118.5, lon1: 123.5, lat0: 21, lat1: 26.5 }; // 標題「台灣附近」的範圍（含台灣海峽與東部外海）
let wnP = null;
function windNow() {
  if (wnP) return wnP;
  const metaP = WW.standalone ? Promise.resolve(WW.standalone.json(WW.DATA.windNow)) : WW.getLiveJSON(WW.DATA.windNow);
  wnP = metaP.then(meta => new Promise((ok, no) => {
    const img = new Image(); img.onload = () => ok([meta, img]); img.onerror = no;
    img.src = WW.standalone ? WW.asset(WW.DATA.windNowImg) : WW.DATA.windNowImg + '?v=' + encodeURIComponent(meta.run);
  })).then(([meta, img]) => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); const px = g.getImageData(0, 0, img.width, img.height).data;
    const W = img.width, H = img.height, U = new Float32Array(W * H), V = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) { U[i] = px[i * 4] * meta.scale + meta.min; V[i] = px[i * 4 + 1] * meta.scale + meta.min; }
    const at = (lon, lat) => {                     // 雙線性內插（m/s）
      const x = (lon - meta.lon0) / meta.step, y = (meta.lat0 - lat) / meta.step, x0 = Math.floor(x), y0 = Math.max(0, Math.min(H - 2, Math.floor(y))), fx = x - x0, fy = y - y0;
      const a = ((x0 % W) + W) % W, b = (a + 1) % W, i00 = y0 * W + a, i10 = y0 * W + b, i01 = i00 + W, i11 = i10 + W;
      const Lp = A => (A[i00] * (1 - fx) + A[i10] * fx) * (1 - fy) + (A[i01] * (1 - fx) + A[i11] * fx) * fy;
      return [Lp(U), Lp(V)];
    };
    let max = 0, mlon = 0, mlat = 0;
    for (let lat = NEAR.lat0; lat <= NEAR.lat1; lat += 0.25) for (let lon = NEAR.lon0; lon <= NEAR.lon1; lon += 0.25) {
      const [u, v] = at(lon, lat), s = Math.hypot(u, v); if (s > max) { max = s; mlon = lon; mlat = lat; }
    }
    return { meta, at, max, mlon, mlat, run: Date.parse(meta.run.replace('Z', ':00Z')) };
  });
  return wnP;
}

/* ---------- 本站每日取樣（farm_daily.json）：昨天是不是取樣以來最有風的一天、此刻是不是最高出力 ·
   the site's daily samples: was yesterday the windiest day since sampling began, is now the highest sampled output ---------- */
let DP = null, DY = null;
WW.farmDaily = () => DP || (DP = WW.getLiveJSON(WW.DATA.farmDaily).then(J => { DY = J; if (WW.repaintToday && WW.currentPage() === 'home') WW.repaintToday(); return J; }));
const twDate = ms => new Date(ms + 288e5).toISOString().slice(0, 10);
const mdd = k => +k.slice(5, 7) + '/' + +k.slice(8, 10);
function records(now, nowT) {                       // now＝此刻全台出力（MW）、nowT＝資料時間（ms）
  const D = DY && DY.days; if (!D) return [];
  const today = twDate(nowT), keys = Object.keys(D).filter(k => k < today).sort(), F = [];
  if (keys.length < 14) return F;
  const avg = k => { let v = 0; for (const x of Object.values(D[k].u || {})) if (x[0]) v += x[1] / x[0]; return v; };
  const y = keys[keys.length - 1], yv = avg(y), prev = keys.slice(0, -1);
  if (y === twDate(nowT - 864e5) && (D[y].t || []).length >= 12) {                       // 昨天：取樣夠多才比
    if (prev.length >= 29 && prev.every(k => avg(k) <= yv)) F.push({ w: 85, ic: '🏆', zh: `昨天（${mdd(y)}）全台風電平均 ${WW.int(yv)} MW，是本站取樣以來（自 ${mdd(keys[0])}）最有風的一天`, en: `Yesterday (${mdd(y)}) Taiwan's wind averaged ${WW.int(yv)} MW, the windiest day since the site began sampling (${mdd(keys[0])})` });
    else { const m = prev.filter(k => k.slice(0, 7) === y.slice(0, 7)); if (m.length >= 10 && m.every(k => avg(k) <= yv)) F.push({ w: 60, ic: '🏆', zh: `昨天（${mdd(y)}）平均 ${WW.int(yv)} MW，是本月到目前最有風的一天`, en: `Yesterday (${mdd(y)}) averaged ${WW.int(yv)} MW, the windiest day so far this month` }); }
  }
  const mk = keys.filter(k => D[k].mx);                                                 // 每天最高的一次取樣（2026-10-26 起才記）
  if (mk.length >= 14 && now > 0) {
    const rec = Math.max(...mk.map(k => D[k].mx[0])), tm = D[today] && D[today].mx, best = tm && tm[0] > now ? tm : null;
    if ((best ? best[0] : now) >= rec) F.push({ w: 95, ic: '🥇', record: true, zh: best ? `今天 ${best[1]} 的 ${WW.int(best[0])} MW，是本站自 ${mdd(mk[0])} 以來取樣到的最高出力` : `此刻 ${WW.int(now)} MW，是本站自 ${mdd(mk[0])} 以來取樣到的最高出力`,
      en: best ? `${WW.int(best[0])} MW at ${best[1]} today, the highest output the site has sampled since ${mdd(mk[0])}` : `${WW.int(now)} MW right now, the highest output the site has sampled since ${mdd(mk[0])}` });
  }
  return F;
}

/* ---------- 今天的風：從資料算出幾句話，依重要性排序 ---------- */
function hist7() {
  const L = WW.live; if (!L || !L.hist) return [];
  const all = (L.hist().points || []).filter(p => p && p.t && typeof p.total === 'number').map(p => ({ t: tms(p.t), v: p.total })).filter(p => !isNaN(p.t)).sort((a, b) => a.t - b.t);
  const st = L.srcTime && L.srcTime(), now = st && L.isLive() ? tms(st) : NaN;
  if (all.length && !isNaN(now) && now > all[all.length - 1].t + 6e4) all.push({ t: now, v: L.totals().total });
  const end = all.length ? all[all.length - 1].t : 0;
  return all.filter(p => p.t >= end - 7 * 864e5);
}
const BEAU = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7, 37.0, 41.5, 46.2, 51.0, 56.1];   // 蒲福風級下限（m/s，中央氣象署）
const DIR = { zh: ['北', '東北', '東', '東南', '南', '西南', '西', '西北'], en: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] };
function where(lon, lat) {                          // 相對台灣中心（120.9E, 23.7N）的方位，在島上時回傳 null
  const dx = (lon - 120.9) * Math.cos(23.7 * Math.PI / 180), dy = lat - 23.7;
  if (Math.hypot(dx, dy) < 1.2) return null;
  const k = Math.round(((Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360) / 45) % 8;
  return EN() ? DIR.en[k] : DIR.zh[k];
}
WW.todayFacts = (W, lang) => {
  LO = lang || null;
  try { return todayFacts(W); } finally { LO = null; }
};
function todayFacts(W) {
  const L = WW.live; if (!L) return [];
  const T = L.totals(), now = T.total, F = [], P = hist7(), live = L.isLive();
  const R = live && L.srcTime && L.srcTime() ? records(now, tms(L.srcTime())) : [];       // 取樣紀錄：昨天最有風、此刻最高
  R.forEach(f => F.push(f));
  if (live && P.length >= 6 && P[P.length - 1].t - P[0].t > 2 * 864e5) {
    const vs = P.map(p => p.v), mx = Math.max(...vs), mn = Math.min(...vs), avg = vs.reduce((a, b) => a + b, 0) / vs.length;
    if (R.some(f => f.record)) { /* 已經是取樣以來最高，不再說 7 天最高 */ }
    else if (now >= mx - 1) F.push({ w: 80, ic: '📈', zh: `此刻 ${WW.int(now)} MW，是本站過去 7 天取樣中最高的`, en: `${WW.int(now)} MW right now, the highest of the site's samples over the past 7 days` });
    else if (now <= mn + 1) F.push({ w: 70, ic: '📉', zh: `此刻 ${WW.int(now)} MW，是本站過去 7 天取樣中最低的`, en: `${WW.int(now)} MW right now, the lowest of the site's samples over the past 7 days` });
    else if (avg > 0) {
      const d = (now - avg) / avg * 100;
      if (Math.abs(d) >= 15) F.push({ w: 40 + Math.min(20, Math.abs(d) / 5), ic: d > 0 ? '⬆' : '⬇', zh: `比過去 7 天平均${d > 0 ? '高' : '低'} ${Math.abs(d).toFixed(0)}%（平均約 ${WW.int(avg)} MW）`, en: `${Math.abs(d).toFixed(0)}% ${d > 0 ? 'above' : 'below'} the 7-day average (about ${WW.int(avg)} MW)` });
    }
    const last = P[P.length - 1], prev = P.slice().reverse().find(p => last.t - p.t >= 2 * 36e5 && last.t - p.t <= 4.5 * 36e5);
    if (prev) {
      const dv = last.v - prev.v, h = Math.round((last.t - prev.t) / 36e5);
      if (Math.abs(dv) >= 150) F.push({ w: 45 + Math.min(25, Math.abs(dv) / 60), ic: dv > 0 ? '🌀' : '🍃', zh: `近 ${h} 小時${dv > 0 ? '增加' : '減少'} ${WW.int(Math.abs(dv))} MW，風${dv > 0 ? '正在變強' : '正在減弱'}`, en: `${dv > 0 ? 'Up' : 'Down'} ${WW.int(Math.abs(dv))} MW in the last ${h} hours: the wind is ${dv > 0 ? 'picking up' : 'easing'}` });
    }
  }
  if (live && T.cap > 0) {
    if (T.ratio >= 0.6) F.push({ w: 55, ic: '⚡', zh: `全台風機以約 ${(T.ratio * 100).toFixed(0)}% 的容量運轉，接近滿載`, en: `Taiwan's turbines are running at about ${(T.ratio * 100).toFixed(0)}% of capacity, close to full output` });
    else if (T.ratio <= 0.1) F.push({ w: 50, ic: '😴', zh: `風很小，全台風機只用到約 ${(T.ratio * 100).toFixed(0)}% 的容量`, en: `Light winds: Taiwan's turbines are using only about ${(T.ratio * 100).toFixed(0)}% of capacity` });
  }
  if (W && W.max >= 12) {
    const dir = where(W.mlon, W.mlat), src = (EN() ? 'GFS model, 10 m above ground, ' : 'GFS 模式離地 10 m，') + twTime(W.run);
    const loc = dir ? (EN() ? `${dir} of Taiwan` : `台灣${dir}方`) : (EN() ? 'over Taiwan' : '台灣上空');
    const bf = BEAU.filter(v => W.max >= v).length, sp = W.max.toFixed(0);       // 蒲福風級
    if (W.max >= 25) F.push({ w: 90, ic: '🌪', src, zh: `${loc}海面風速約 ${sp} m/s（${bf} 級），高於多數風機停機保護的 25 m/s`, en: `Winds of about ${sp} m/s ${loc} (force ${bf}), above the 25 m/s at which most turbines shut down` });
    else if (W.max >= 17.2) F.push({ w: 65, ic: '💨', src, zh: `${loc}海面有 ${bf} 級風，風速約 ${sp} m/s`, en: `Force ${bf} winds of about ${sp} m/s ${loc}` });
    else F.push({ w: 30, ic: '🌬', src, zh: `${loc}海面風速約 ${sp} m/s（${bf} 級）`, en: `Winds of about ${sp} m/s ${loc} (force ${bf})` });
  }
  const V = L.impactVals();
  if (live && V.homes > 0) F.push({ w: 20, ic: '🏠', zh: `此刻的風電約可同時供應 ${V.homes.toFixed(V.homes < 10 ? 1 : 0)} 萬戶家庭用電`, en: `Enough right now for about ${WW.int(V.homes * 10)}k homes at once` });
  return F.sort((a, b) => b.w - a.w).map(f => ({ ic: f.ic, text: EN() ? f.en : f.zh, src: f.src || '' }));
}
WW.todayWind = windNow;
WW.farmDaily().catch(() => {});

/* ---------- 分享圖卡（方形 1080×1080、橫式 1200×630、直式 1080×1920） ---------- */
const CN = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
const WASH_T = [[0, 74, 82, 98, 0.35], [2.95, 74, 82, 98, 0.4], [3, 42, 159, 208, 0.5], [7, 42, 170, 190, 0.6], [11.95, 60, 190, 150, 0.68], [12, 79, 200, 130, 0.74], [24.95, 110, 215, 125, 0.78], [25, 235, 45, 175, 0.85], [35, 255, 110, 215, 0.9]];
function rampAt(r, v) {
  if (v <= r[0][0]) return r[0].slice(1);
  for (let k = 1; k < r.length; k++) if (v <= r[k][0]) { const a = r[k - 1], b = r[k], t = (v - a[0]) / (b[0] - a[0]); return [0, 1, 2, 3].map(j => a[j + 1] + (b[j + 1] - a[j + 1]) * t); }
  return r[r.length - 1].slice(1);
}
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function wrap(x, s, maxW, max) {                     // 中文逐字、英文逐詞斷行；超過 max 行時最後一行加刪節號
  const out = []; let line = '';
  const toks = s.match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+|\s+/g) || [];
  for (const t of toks) { const n = line + t; if (x.measureText(n).width > maxW && line.trim()) { out.push(line.trim()); line = t.trimStart(); } else line = n; }
  if (line.trim()) out.push(line.trim());
  if (max && out.length > max) { let l = out[max - 1]; while (l && x.measureText(l + '…').width > maxW) l = l.slice(0, -1); out.length = max; out[max - 1] = l + '…'; }
  return out;
}
let RINGS = null;
function landRings() {                              // 圖卡範圍內的國界（台灣另外加粗）
  if (RINGS) return Promise.resolve(RINGS);
  return WW.getJSON(WW.DATA.borders).then(B => (RINGS = B.borders.map((r, i) => ({ r, tw: B.ringIso[i] === 'TWN' })).filter(({ r }) => {
    for (let k = 0; k < r.length; k += 2) if (r[k] > BOX.lon0 - 1 && r[k] < BOX.lon1 + 1 && r[k + 1] > BOX.lat0 - 1 && r[k + 1] < BOX.lat1 + 1) return true;
    return false;
  }))).catch(() => (RINGS = []));
}
/* 地圖：台灣附近的風（地球儀「此刻的風」的風機運轉色階）＋風向短線＋陸地＋有即時資料的風場（點的大小與亮度＝此刻可用率） */
function drawMap(x, X, Y, w, h, W, rings) {
  const s = Math.max(w / (BOX.lon1 - BOX.lon0), h / (BOX.lat1 - BOX.lat0)), ox = X + (w - (BOX.lon1 - BOX.lon0) * s) / 2, oy = Y + (h - (BOX.lat1 - BOX.lat0) * s) / 2;
  const P = (lon, lat) => [ox + (lon - BOX.lon0) * s, oy + (BOX.lat1 - lat) * s];
  x.save(); rr(x, X, Y, w, h, 18); x.clip();
  x.fillStyle = '#081324'; x.fillRect(X, Y, w, h);
  if (W) {
    const R = 3, iw = Math.ceil(w / R), ih = Math.ceil(h / R), im = new ImageData(iw, ih);
    for (let j = 0; j < ih; j++) for (let i = 0; i < iw; i++) {
      const lon = BOX.lon0 + (X + i * R - ox) / s, lat = BOX.lat1 - (Y + j * R - oy) / s, [u, v] = W.at(lon, lat), [r, g, b, a] = rampAt(WASH_T, Math.hypot(u, v)), o = (j * iw + i) * 4;
      im.data[o] = r; im.data[o + 1] = g; im.data[o + 2] = b; im.data[o + 3] = a * 230;
    }
    const tc = document.createElement('canvas'); tc.width = iw; tc.height = ih; tc.getContext('2d').putImageData(im, 0, 0);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(tc, X, Y, iw * R, ih * R);
  }
  const path = r => { x.beginPath(); for (let k = 0; k < r.length; k += 2) { const [px, py] = P(r[k], r[k + 1]); k ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); };
  rings.forEach(({ r }) => { path(r); x.fillStyle = '#16233a'; x.fill(); });
  if (W) {
    x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineCap = 'round';            // 風向短線（只畫在海上；長度與粗細依風速）
    const st = 34 / s;
    for (let lat = BOX.lat0 + st / 2; lat < BOX.lat1; lat += st) for (let lon = BOX.lon0 + st / 2; lon < BOX.lon1; lon += st) {
      const [px, py] = P(lon, lat); if (rings.some(({ r }) => { path(r); return x.isPointInPath(px, py); })) continue;
      const [u, v] = W.at(lon, lat), sp = Math.hypot(u, v); if (sp < 1) continue;
      const L = 8 + Math.min(1, sp / 20) * 18;
      x.lineWidth = 1.3 + Math.min(1.7, sp / 12); x.beginPath(); x.moveTo(px - u / sp * L / 2, py + v / sp * L / 2); x.lineTo(px + u / sp * L / 2, py - v / sp * L / 2); x.stroke();
    }
  }
  rings.forEach(({ r, tw }) => { path(r); x.strokeStyle = tw ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.35)'; x.lineWidth = tw ? 2.2 : 1.2; x.stroke(); });
  const L = WW.live;
  if (L) L.FARMS.filter(f => f.cap && f.lat != null).sort((a, b) => b.cap - a.cap).forEach(f => { const r = Math.min(1, (L.RT[f.id] || 0) / f.cap), [px, py] = P(f.lng, f.lat);
    x.beginPath(); x.arc(px, py, 4 + 6 * r, 0, 7); x.fillStyle = `rgba(63,220,176,${0.4 + 0.6 * r})`; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#04241b'; x.stroke(); });
  x.restore();
  x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2; rr(x, X, Y, w, h, 18); x.stroke();
}
function spark(x, X, Y, w, h, P) {
  if (P.length < 3) return;
  const t0 = P[0].t, t1 = P[P.length - 1].t, mx = Math.max(...P.map(p => p.v), 1);
  const px = t => X + 6 + (t - t0) / (t1 - t0) * (w - 12), py = v => Y + h - v / mx * h;
  x.beginPath(); P.forEach((p, i) => i ? x.lineTo(px(p.t), py(p.v)) : x.moveTo(px(p.t), py(p.v)));
  x.lineTo(px(t1), Y + h); x.lineTo(px(t0), Y + h); x.closePath(); x.fillStyle = 'rgba(63,220,176,.16)'; x.fill();
  x.beginPath(); P.forEach((p, i) => i ? x.lineTo(px(p.t), py(p.v)) : x.moveTo(px(p.t), py(p.v))); x.strokeStyle = '#3fdcb0'; x.lineWidth = 3; x.lineJoin = 'round'; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(X, Y + h + 1); x.lineTo(X + w, Y + h + 1); x.stroke();
  const l = P[P.length - 1]; x.beginPath(); x.arc(px(l.t), py(l.v), 7, 0, 7); x.fillStyle = '#3fdcb0'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#081324'; x.stroke();
}
const LEG = () => EN() ? [['#4a5262', 'barely turning'], ['#2a9fd0', 'output rising'], ['#4fc882', 'full output'], ['#eb2daf', 'shut-down speed']] : [['#4a5262', '幾乎不轉'], ['#2a9fd0', '出力上升'], ['#4fc882', '可滿載'], ['#eb2daf', '停機風速']];
/* 版面：每種格式是固定的區塊，數字與文字只在自己的區塊內（標題超過行數就截斷），不會互相重疊 */
const LAYOUT = {
  square: { W: 1080, H: 1080, pad: 64, head: 104, lab: 178, num: 318, ns: 140, hl: [374, 34, 2], chips: [470, 104], map: [64, 600, 560, 372], side: [652, 600, 364, 372], leg: 1004, foot: [1040, 1066] },
  wide:   { W: 1200, H: 630,  pad: 52, head: 72,  lab: 124, num: 236, ns: 112, hl: [286, 25, 2], chips: [358, 88], map: [680, 96, 468, 400], spark: [52, 466, 592, 50], leg: 528, legX: 680, legW: 468, foot: [584, 612] },
  story:  { W: 1080, H: 1920, pad: 64, head: 128, lab: 236, num: 420, ns: 184, hl: [500, 42, 2], hl2: [618, 30, 1], chips: [668, 120], map: [64, 830, 952, 700], leg: 1572, side7: [1630, 1652, 110], foot: [1846, 1880] },
};
WW.drawTodayCard = (fmt, W, rings) => {
  const L = WW.live, T = L.totals(), V = L.impactVals(), F = WW.todayFacts(W), P = hist7(), st = L.srcTime && L.srcTime(), K = LAYOUT[fmt] || LAYOUT.square;
  const cv = document.createElement('canvas'); cv.width = K.W; cv.height = K.H; const x = cv.getContext('2d'), pad = K.pad, CW = K.W, wide = fmt === 'wide';
  const g = x.createLinearGradient(0, 0, CW, K.H); g.addColorStop(0, '#10223a'); g.addColorStop(1, '#050b16'); x.fillStyle = g; x.fillRect(0, 0, CW, K.H);
  const colW = wide ? K.map[0] - pad - 36 : CW - pad * 2;
  x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  // 站名與資料時間
  x.fillStyle = '#eaf1f8'; x.font = `900 ${wide ? 32 : 40}px ${CN}`; x.fillText(EN() ? 'Taiwan Wind Watch' : '風電風情', pad, K.head);
  if (st) { const dt = (EN() ? 'As of ' : '資料時間 ') + twTime(tms(st), true); x.font = `700 ${wide ? 20 : 25}px ${CN}`; const tw = x.measureText(dt).width + 34, ph = wide ? 38 : 46;
    rr(x, CW - pad - tw, K.head - ph + 11, tw, ph, ph / 2); x.fillStyle = '#0d1829'; x.fill(); x.strokeStyle = '#3fdcb0'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#3fdcb0'; x.textAlign = 'right'; x.fillText(dt, CW - pad - 17, K.head - 3); x.textAlign = 'left'; }
  // 大數字
  x.fillStyle = '#a9b7c9'; x.font = `600 ${Math.round(K.ns * 0.22)}px ${CN}`; x.fillText(EN() ? "Taiwan's wind power right now" : '台灣此刻風電出力', pad, K.lab);
  const ns = WW.int(T.total); x.fillStyle = '#ffffff'; x.font = `900 ${K.ns}px ${CN}`; const nw = x.measureText(ns).width; x.fillText(ns, pad - 4, K.num);
  x.fillStyle = '#a9b7c9'; x.font = `800 ${Math.round(K.ns * 0.34)}px ${CN}`; x.fillText('MW', pad + nw + 10, K.num);
  // 今天的風（第一句）
  if (F.length) { const [y0, fs, n] = K.hl; x.font = `800 ${fs}px ${CN}`; x.fillStyle = '#ffd98a';
    wrap(x, F[0].ic + ' ' + F[0].text, colW, n).forEach((l, i) => x.fillText(l, pad, y0 + i * fs * 1.36)); }
  if (K.hl2 && F[1]) { const [y0, fs, n] = K.hl2; x.font = `700 ${fs}px ${CN}`; x.fillStyle = '#eaf1f8'; wrap(x, F[1].ic + ' ' + F[1].text, colW, n).forEach((l, i) => x.fillText(l, pad, y0 + i * fs * 1.36)); }
  // 三個數字
  { const [y, bh] = K.chips, items = [[(T.ratio * 100).toFixed(0) + '%', EN() ? 'of capacity in use' : '可用率'], [V.share != null ? V.share.toFixed(1) + '%' : '—', EN() ? 'of all generation' : '佔全國發電'], [EN() ? WW.int(V.homes * 10) + 'k' : V.homes.toFixed(V.homes < 10 ? 1 : 0) + ' 萬', EN() ? 'homes (estimate)' : '戶家庭（估算）']];
    const gap = 16, bw = (colW - gap * 2) / 3;
    items.forEach((it, i) => { const bx = pad + i * (bw + gap); rr(x, bx, y, bw, bh, 16); x.fillStyle = 'rgba(13,24,41,.92)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = 2; x.stroke();
      x.textAlign = 'center'; x.fillStyle = '#eaf1f8'; x.font = `900 ${Math.round(bh * 0.36)}px ${CN}`; x.fillText(it[0], bx + bw / 2, y + bh * 0.5);
      x.fillStyle = '#8b9ab0'; x.font = `600 ${Math.round(bh * 0.19)}px ${CN}`; x.fillText(it[1], bx + bw / 2, y + bh * 0.8); x.textAlign = 'left'; }); }
  // 地圖與圖例
  drawMap(x, ...K.map, W, rings || []);
  { const fs = wide ? 15 : 19, lx0 = K.legX != null ? K.legX : pad, maxX = lx0 + (K.legW || CW - pad * 2); let lx = lx0, ly = K.leg; x.font = `600 ${fs}px ${CN}`;
    const lab = EN() ? 'Wind now (10 m):' : '此刻的風（離地 10 m）：'; if (!wide) { x.fillStyle = '#a9b7c9'; x.fillText(lab, lx, ly); lx += x.measureText(lab).width + 10; }
    LEG().forEach(([c, t]) => { const iw = 30 + x.measureText(t).width + 18; if (lx + iw > maxX) { lx = lx0; ly += fs + 10; } x.fillStyle = c; rr(x, lx, ly - fs + 3, 22, fs - 4, 4); x.fill(); x.fillStyle = '#a9b7c9'; x.fillText(t, lx + 28, ly); lx += iw; }); }
  // 過去 7 天
  if (K.side) { const [sx, sy, sw, sh] = K.side; x.fillStyle = '#a9b7c9'; x.font = `600 22px ${CN}`; x.fillText(EN() ? 'Past 7 days (site samples)' : '過去 7 天（本站取樣）', sx, sy + 26); spark(x, sx, sy + 70, sw, sh - 110, P);
  }
  if (K.spark) { const [sx, sy, sw, sh] = K.spark; x.fillStyle = '#8b9ab0'; x.font = `600 15px ${CN}`; x.fillText(EN() ? 'Past 7 days' : '過去 7 天', sx, sy - 4); spark(x, sx, sy + 4, sw, sh - 4, P); }
  if (K.side7) { const [ly, sy, sh] = K.side7; x.fillStyle = '#a9b7c9'; x.font = `600 24px ${CN}`; x.fillText(EN() ? 'Past 7 days (site samples)' : '過去 7 天（本站取樣）', pad, ly); spark(x, pad, sy, CW - pad * 2, sh, P); }
  // 出處與網址
  x.fillStyle = '#7d8ca3'; x.font = `500 ${wide ? 14 : 18}px ${CN}`;
  const wt = W ? twTime(W.run) : '';
  wrap(x, EN() ? `Data: Taipower open data; wind: NOAA GFS model, 10 m above ground${wt ? ', ' + wt : ''}. Estimates from public data, for reference only.` : `資料：台電開放資料；風：NOAA GFS 模式離地 10 m${wt ? '（' + wt + '）' : ''}。公開資料整理之估算，僅供參考。`, CW - pad * 2, 1).forEach(l => x.fillText(l, pad, K.foot[0]));
  x.fillStyle = '#3fdcb0'; x.font = `800 ${wide ? 20 : 24}px ${CN}`; x.fillText('dofliu.github.io/windfarmTaiwan', pad, K.foot[1]);
  return cv;
};
WW.windColor = v => rampAt(WASH_T, v);                       // 風機運轉色階（[r,g,b,a]，a 0–1），「我附近」共用
WW.windBands = LEG;
WW.todayCardAssets = () => Promise.all([windNow().catch(() => null), landRings()]);

/* 分享：先選格式（方形適合貼文、橫式適合連結預覽與簡報、直式適合限時動態），能分享檔案就用系統分享，否則下載 */
const FMTS = [['square', '方形 1:1', 'Square 1:1'], ['wide', '橫式 1.91:1', 'Wide 1.91:1'], ['story', '直式 9:16', 'Story 9:16']];
async function shareFmt(fmt) {
  let cv, text, url = WW.pageURL('#/live');
  if (fmt === 'week') {                                          // 本週風電回顧（week.js）
    try { cv = await WW.weekCard(); } catch (e) { WW.toast(EN() ? 'Weekly data is not available yet' : '本週資料還沒準備好'); return; }
    text = WW.weekShareText(); url = WW.pageURL('#/home');
  } else {
    const [W, rings] = await WW.todayCardAssets();
    cv = WW.drawTodayCard(fmt, W, rings); const F = WW.todayFacts(W);
    text = (EN() ? 'Taiwan wind right now: ' : '台灣此刻風電：') + WW.int(WW.live.totals().total) + ' MW' + (F[0] ? ' · ' + F[0].text : '');
  }
  cv.toBlob(async blob => {
    if (!blob) return;
    const name = 'taiwan-wind-' + fmt + '.png', file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: EN() ? 'Taiwan Wind Watch' : '風電風情', text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000); WW.toast(EN() ? 'Card image downloaded ✓' : '圖卡已下載 ✓');
  }, 'image/png');
}
function sharePicker() {
  let d = document.getElementById('sharepick');
  if (!d) {
    d = WW.el('dialog', { id: 'sharepick', class: 'sharepick' });
    document.body.appendChild(d);
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  }
  d.innerHTML = `<h3>${EN() ? 'Share a card of today\'s wind' : '分享今天的風況圖卡'}</h3><div class="spf">${FMTS.map(f => `<button class="btn" type="button" data-f="${f[0]}"><i class="spi spi-${f[0]}"></i>${EN() ? f[2] : f[1]}</button>`).join('')}</div>
    ${WW.weekCard ? `<button class="btn spweek" type="button" data-f="week">📊 ${EN() ? 'This week\'s recap (square)' : '本週風電回顧（方形）'}</button>` : ''}
    <div class="sprow"><button class="btn sm splink" type="button">${EN() ? 'Copy link only' : '只複製連結'}</button>${WW.embedSnippet ? `<button class="btn sm spemb" type="button" title="${EN() ? 'Copy the <iframe> code for a small live card on your own site' : '複製 <iframe> 程式碼，把台灣此刻的風電小卡放進你的網站'}">&lt;/&gt; ${EN() ? 'Embed on your site' : '嵌入到你的網站'}</button>` : ''}</div><button class="btn sm spx" type="button" aria-label="${EN() ? 'Close' : '關閉'}">✕</button>`;
  d.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { d.close(); shareFmt(b.dataset.f); });
  d.querySelector('.spx').onclick = () => d.close();
  const em = d.querySelector('.spemb'); if (em) em.onclick = async () => { d.close(); try { await navigator.clipboard.writeText(WW.embedSnippet()); WW.toast(EN() ? 'Embed code copied ✓ — paste it into your page' : '已複製嵌入程式碼 ✓ 貼到你的網頁即可'); } catch (e) { WW.toast(EN() ? 'Please copy the embed code from the user guide' : '請從使用說明複製嵌入程式碼'); } };
  d.querySelector('.splink').onclick = async () => { d.close(); try { await navigator.clipboard.writeText(WW.pageURL()); WW.toast(EN() ? 'Link copied ✓' : '已複製此頁連結 ✓'); } catch (e) { WW.toast(EN() ? 'Please copy the URL manually' : '請手動複製網址'); } };
  d.showModal();
}
WW.shareTodayCard = shareFmt;
WW.sharePicker = sharePicker;
if (WW.shareHandlers) { WW.shareHandlers.home = sharePicker; WW.shareHandlers.live = sharePicker; }
})();
