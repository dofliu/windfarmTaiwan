/* 風電風情 · core.js
   全站共用：語言（zh/en）、hash 路由、延遲載入、資料快取、數字格式、分享。
   各頁模組（home / live / global / learn）以 WW.registerPage() 註冊 enter/leave，
   由路由在切換頁面時呼叫——例如 3D 地球儀離開頁面時會停掉繪圖迴圈，不在背景耗電。 */
(function () {
'use strict';
const WW = window.WW = window.WW || {};

/* 單檔版（tools/build_standalone.py 產生）：延遲載入的 JS／CSS、全球資料與底圖都內嵌在同一個 HTML 裡，
   即時資料連網時向正式網站抓最新的，離線時用建置當下的快照。一般網站上 EMB 為 null，以下行為都不變。 */
const EMB = WW.standalone = window.WW_STANDALONE || null;
WW.SITE = 'https://dofliu.github.io/windfarmTaiwan/';
/* 專案版本（語意化版本 MAJOR.MINOR.PATCH）：每次發布到網站就更新，並在 CHANGELOG.md／CHANGELOG.en.md 各加一段。
   頁尾、「關於本站」、地球儀出處列與「資料來源」視窗都讀這裡；單檔版建置時會檢查兩份 CHANGELOG 都有這個版本 */
WW.VERSION = '3.5.0';
WW.changelogURL = () => 'https://github.com/dofliu/windfarmTaiwan/blob/main/CHANGELOG' + (WW.lang === 'en' ? '.en' : '') + '.md';
WW.asset = p => (EMB && EMB.url(p)) || p;                    // 圖檔：單檔版改用內嵌的 data URL
/* 分享用網址：單檔版（file://）一律指向正式網站 */
WW.pageURL = hash => hash == null ? (EMB ? WW.SITE + location.hash : location.href)
  : (EMB ? WW.SITE : location.href.split('?')[0].split('#')[0]) + hash;

/* ---------------- 瀏覽器儲存（只存個人偏好；私密視窗等情況讀寫會失敗，一律靜默） ---------------- */
WW.store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
};

/* ---------------- i18n ---------------- */
const DICT = {};                                   // key -> {zh, en}
WW.addI18n = obj => Object.assign(DICT, obj);
WW.lang = WW.store.get('ww_lang', 'zh') === 'en' ? 'en' : 'zh';
WW.t = k => (DICT[k] && DICT[k][WW.lang] != null) ? DICT[k][WW.lang] : k;
WW.L = (zh, en) => WW.lang === 'en' ? en : zh;     // 行內雙語
/* 線條圖示（取代 emoji：各系統長得一樣，顏色跟著文字的 currentColor）；HTML 寫 <span data-ico="名稱"></span> ·
   line icons instead of emoji (same on every system, coloured by currentColor); in HTML use data-ico */
const ICONS = {
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  book: '<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5zM12 6v13.5"/>',
  trend: '<path d="M3 20h18M4 16l5-5 4 3 7-8"/>',
  home: '<path d="M4 11l8-6 8 6M6 10v9h12v-9M10 19v-5h4v5"/>',
  bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.6 1.2 1.4 1.3 2.1h4.4c.1-.7.6-1.5 1.3-2.1A6 6 0 0 0 12 3z"/>',
  leaf: '<path d="M12 21v-6M12 15c-4 0-7-3-7-7 4 0 7 3 7 7zM12 15c4 0 7-3 7-7-4 0-7 3-7 7z"/>'
};
WW.icon = name => '<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
/* 風力等級：四格長條，亮起的格數＝等級 1–4 · wind level drawn as 1–4 lit bars */
WW.windLevel = n => '<svg class="ico wlv" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">' +
  [0, 1, 2, 3].map(i => `<rect x="${3 + i * 5}" y="${17 - i * 4}" width="3.4" height="${4 + i * 4}" rx="1.2" fill="${i < n ? 'currentColor' : 'var(--line-2)'}"/>`).join('') + '</svg>';
WW.paintIcons = root => (root || document).querySelectorAll('[data-ico]').forEach(el => { if (!el.firstChild) el.innerHTML = WW.icon(el.dataset.ico); });
const langSubs = [];
WW.onLang = fn => { langSubs.push(fn); };
WW.applyI18n = root => {
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = WW.t(el.dataset.i18n); });
  r.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = WW.t(el.dataset.i18nHtml); });
  r.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = WW.t(el.dataset.i18nTitle); });
  r.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', WW.t(el.dataset.i18nAria)); });
  r.querySelectorAll('[data-ver]').forEach(el => {             // 版本號：連到該語言的更新紀錄
    el.textContent = 'v' + WW.VERSION;
    if (el.tagName === 'A') { el.href = WW.changelogURL(); el.title = WW.L('更新紀錄', 'Changelog'); }
  });
};
function syncLangDom() {
  const en = WW.lang === 'en';
  document.documentElement.lang = en ? 'en' : 'zh-Hant';
  document.body.classList.toggle('lang-en', en);
  const b = document.getElementById('langbtn');
  if (b) { b.textContent = en ? '中文' : 'EN'; b.setAttribute('aria-label', en ? '切換為中文' : 'Switch to English'); }
}
WW.setLang = l => {
  WW.lang = l === 'en' ? 'en' : 'zh';
  WW.store.set('ww_lang', WW.lang);
  syncLangDom();
  WW.applyI18n();
  setTitle();
  langSubs.forEach(fn => { try { fn(WW.lang); } catch (e) { console.error(e); } });
};

/* ---------------- 格式與小工具 ---------------- */
WW.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
WW.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
WW.int = n => Math.round(n).toLocaleString('en-US');
WW.num = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
/* MW → 顯示字串：≥1 GW 以 GW 表示 */
WW.fmtMW = mw => {
  if (mw == null || isNaN(mw)) return '—';
  if (Math.abs(mw) >= 1000) {
    const g = mw / 1000;
    return (g >= 100 ? WW.int(g) : g >= 10 ? WW.num(g, 1) : WW.num(g, 2)) + ' GW';
  }
  return (mw < 10 ? WW.num(mw, 1) : WW.int(mw)) + ' MW';
};
WW.fmtGW = mw => { const g = mw / 1000; return g >= 100 ? WW.int(g) : g >= 10 ? WW.num(g, 1) : WW.num(g, 2); };
WW.el = (tag, attrs, text) => {                  // 建元素（文字一律 textContent，避免把資料當 HTML）
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k === 'style') e.style.cssText = attrs[k]; else e.setAttribute(k, attrs[k]); }
  if (text != null) e.textContent = text;
  return e;
};
let toastT = null;
WW.toast = msg => {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
};

/* ---------------- 延遲載入與資料快取 ---------------- */
const scripts = {}, styles = {}, jsonCache = {};
WW.loadScript = src => scripts[src] || (scripts[src] = new Promise((res, rej) => {
  const s = document.createElement('script');
  const code = EMB && EMB.text(src);
  if (code != null) { s.textContent = code; document.head.appendChild(s); res(); return; }   // 內嵌：插入即同步執行，順序不變
  s.src = src; s.async = false;
  s.onload = () => res(); s.onerror = () => { delete scripts[src]; rej(new Error('failed to load ' + src)); };
  document.head.appendChild(s);
}));
WW.loadCSS = href => styles[href] || (styles[href] = new Promise((res, rej) => {
  const css = EMB && EMB.text(href);
  if (css != null) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); res(); return; }
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
  l.onload = () => res(); l.onerror = () => { delete styles[href]; rej(new Error('failed to load ' + href)); };
  document.head.appendChild(l);
}));
/* 靜態資料（全球資料集）：整個工作階段只抓一次 */
WW.getJSON = url => jsonCache[url] || (jsonCache[url] = (EMB && EMB.has(url) ? Promise.resolve().then(() => EMB.json(url)) : fetch(url).then(r => {
  if (!r.ok) throw new Error(url + ' ' + r.status); return r.json();
})).catch(e => { delete jsonCache[url]; throw e; }));
/* 即時資料（約每 2 小時更新）：不快取 */
WW.getLiveJSON = url => EMB ? EMB.live(url) : fetch(url, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });

WW.DATA = {
  global: 'data/global/wind_global.json',
  farms: 'data/global/wind_farms.json',
  borders: 'data/global/world_borders.json',
  ports: 'data/global/ports.json',
  foundations: 'data/global/foundations.json',
  events: 'data/global/events.json',
  stats: 'data/global/country_stats.json',
  indicators: 'data/global/country_indicators.json',
  shares: 'data/global/market_shares.json',
  generation: 'data/global/generation.json',
  turbineOutput: 'data/global/turbine_output.json',
  farmDaily: 'data/archive/farm_daily.json',
  photos: 'data/global/photos.json',
  windNow: 'data/live/wind_now.json',
  windNowImg: 'data/live/wind_now.webp',
  windResource: 'data/global/wind_resource.json',
  zones: 'data/global/offshore_zones.json',
  liveRegions: 'data/global/live_regions.json',
  turbinesDe: 'data/global/turbines_de.json',
  turbines: 'data/global/turbines.json',
  turbinesOsm: 'data/global/turbines_osm.json'
};
/* 水下基礎剖面示意：依型式（mp/jk/tp/tl/gb/pc/lp/cf/bk/ra/fl＋浮動式細分）畫在 x=cx、海面 SEA、海床 BED 的座標系裡，回傳 SVG 片段與塔底高度。
   地球儀的風場卡片與風電知識頁的型式圖共用（示意、非等比例） */
WW.FD_SVG_COL = { sea: 'rgba(59,143,224,.28)', seaLine: '#6fb3ff', bed: '#7a6650', tower: '#dfe6f0', tp: '#f2c230', steel: '#9aa3ad', conc: '#c9c3b6', hull: '#e3e8ee', txt: 'currentColor', moor: '#9aa3ad' };
WW.fdDraw = function (t, sub, cx, SEA, BED, SVG_COL) {
  SVG_COL = SVG_COL || WW.FD_SVG_COL;
  const P = [];
  const line = (x1, y1, x2, y2, c, w) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="' + (w || 2) + '" stroke-linecap="round"/>';
  const rect = (x, y, w, h, c, rx) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"' + (rx ? ' rx="' + rx + '"' : '') + '/>';
  const poly = (pts, c) => '<polygon points="' + pts.join(' ') + '" fill="' + c + '"/>';
  const moor = (x0, y0, x1) => '<path d="M' + x0 + ' ' + y0 + ' Q ' + ((x0 + x1) / 2) + ' ' + (BED + 2) + ' ' + x1 + ' ' + BED + '" fill="none" stroke="' + SVG_COL.moor + '" stroke-width="1" stroke-dasharray="3 2"/>';
  let top = SEA - 12;                                          // 塔底的高度（海面以上）
  if (t === 'mp') { P.push(rect(cx - 5, SEA - 12, 10, BED - SEA + 20, SVG_COL.steel), rect(cx - 7, SEA - 28, 14, 20, SVG_COL.tp, 1.5), line(cx - 11, SEA - 28, cx + 11, SEA - 28, SVG_COL.tp, 2)); top = SEA - 28; }
  else if (t === 'jk') { [-1, 1].forEach(d => P.push(line(cx + d * 8, SEA - 24, cx + d * 26, BED, SVG_COL.steel, 2.2), rect(cx + d * 26 - 3, BED, 6, 14, SVG_COL.steel)));
    [SEA - 6, SEA + 22, SEA + 48].forEach((y, j) => { const w = 9 + j * 6; P.push(line(cx - w, y, cx + w, y + 20, SVG_COL.steel, 1.2), line(cx + w, y, cx - w, y + 20, SVG_COL.steel, 1.2)); });
    P.push(rect(cx - 11, SEA - 34, 22, 12, SVG_COL.tp, 1.5)); top = SEA - 34; }
  else if (t === 'tp') { P.push(rect(cx - 5, SEA - 30, 10, BED - SEA + 10, SVG_COL.steel)); [-1, 1].forEach(d => P.push(line(cx, SEA + 14, cx + d * 26, BED, SVG_COL.steel, 2), rect(cx + d * 26 - 3, BED - 2, 6, 16, SVG_COL.steel)));
    P.push(rect(cx - 7, SEA - 30, 14, 14, SVG_COL.tp, 1.5)); top = SEA - 30; }
  else if (t === 'tl') { [-1, 0, 1].forEach(d => P.push(rect(cx + d * 16 - 3, SEA - 26, 6, BED - SEA + 40, SVG_COL.steel))); P.push(rect(cx - 22, SEA - 34, 44, 10, SVG_COL.tp, 1.5)); top = SEA - 34; }
  else if (t === 'gb') { P.push(poly([(cx - 30) + ',' + BED, (cx + 30) + ',' + BED, (cx + 10) + ',' + (SEA + 8), (cx - 10) + ',' + (SEA + 8)], SVG_COL.conc), rect(cx - 7, SEA - 14, 14, 24, SVG_COL.conc)); top = SEA - 14; }
  else if (t === 'pc') { [-2, -1, 0, 1, 2].forEach(d => P.push(line(cx + d * 10, SEA + 2, cx + d * 13, BED + 10, SVG_COL.steel, 2.2))); P.push(rect(cx - 24, SEA - 14, 48, 18, SVG_COL.conc, 2)); top = SEA - 14; }
  else if (t === 'lp') { [-2, -1, 0, 1, 2].forEach(d => P.push(line(cx + d * 9, BED + 7, cx + d * 9, BED + 14, SVG_COL.steel, 2.2))); P.push(rect(cx - 22, BED, 44, 7, SVG_COL.conc, 2), rect(cx - 7, SEA - 14, 14, BED - SEA + 14, SVG_COL.conc, 1.5)); top = SEA - 14; }   // 承台埋在泥面下、高立柱撐到水面上
  else if (t === 'cf' || t === 'bk') { P.push(rect(cx - 22, t === 'cf' ? SEA + 10 : BED - 18, 44, t === 'cf' ? BED - SEA - 10 : 18, t === 'cf' ? SVG_COL.steel : SVG_COL.conc, 2), rect(cx - 5, SEA - 10, 10, BED - SEA, SVG_COL.steel), rect(cx - 7, SEA - 26, 14, 18, SVG_COL.tp, 1.5)); top = SEA - 26; }
  else if (t === 'ra') { P.push(rect(cx - 16, BED - 6, 32, 8, SVG_COL.conc), rect(cx - 5, SEA - 10, 10, BED - SEA + 4, SVG_COL.steel), rect(cx - 7, SEA - 26, 14, 18, SVG_COL.tp, 1.5)); [-1, 1].forEach(d => P.push(line(cx + d * 8, BED, cx + d * 14, BED + 14, SVG_COL.steel, 2))); top = SEA - 26; }
  else if (t === 'fl') {
    if (sub === 'spar') { P.push(rect(cx - 8, SEA - 14, 16, 60, SVG_COL.hull, 3), rect(cx - 8, SEA + 30, 16, 16, SVG_COL.steel, 3)); P.push(moor(cx - 6, SEA + 36, cx - 40), moor(cx + 6, SEA + 36, cx + 40)); top = SEA - 14; }
    else if (sub === 'barge') { P.push(rect(cx - 36, SEA - 8, 72, 14, SVG_COL.hull, 2)); P.push(moor(cx - 30, SEA + 6, cx - 48), moor(cx + 30, SEA + 6, cx + 48)); top = SEA - 8; }
    else if (sub === 'tlp') { P.push(rect(cx - 24, SEA - 10, 48, 12, SVG_COL.hull, 2)); [-1, 1].forEach(d => P.push(rect(cx + d * 20 - 5, SEA - 4, 10, 20, SVG_COL.hull, 2), line(cx + d * 20, SEA + 16, cx + d * 20, BED, SVG_COL.moor, 1.2), rect(cx + d * 20 - 5, BED - 2, 10, 6, SVG_COL.steel))); top = SEA - 10; }
    else { [-1, 1].forEach(d => P.push(rect(cx + d * 26 - 6, SEA - 16, 12, 30, SVG_COL.hull, 2))); P.push(rect(cx - 32, SEA + 2, 64, 8, SVG_COL.hull, 2), rect(cx - 6, SEA - 16, 12, 30, SVG_COL.hull, 2)); P.push(moor(cx - 30, SEA + 10, cx - 52), moor(cx + 30, SEA + 10, cx + 52)); top = SEA - 16; }
  }
  return { svg: P.join(''), top };
};
/* 剖面示意圖上的風機：塔（塔底在 top）、機艙、三片葉輪與掃風圓；sc 為縮放（並排多座時用 0.8） */
WW.fdTurbine = function (cx, top, sc, SVG_COL, geom) {         // geom：{hubY, rr} 以像素直接指定輪轂高度與葉輪半徑（等比例圖用）
  SVG_COL = SVG_COL || WW.FD_SVG_COL; sc = sc || 1;
  const hub = geom && geom.hubY != null ? geom.hubY : top - 54 * sc, rr = geom && geom.rr ? geom.rr : 20 * sc, P = [];
  P.push('<polygon points="' + [(cx - 3.2) + ',' + top, (cx + 3.2) + ',' + top, (cx + 1.6) + ',' + hub, (cx - 1.6) + ',' + hub].join(' ') + '" fill="' + SVG_COL.tower + '"/>');
  P.push('<rect x="' + (cx - 4) + '" y="' + (hub - 3) + '" width="9" height="6" rx="1" fill="' + SVG_COL.tower + '"/>');
  [90, 210, 330].forEach(a => { const ra = a * Math.PI / 180; P.push('<line x1="' + cx + '" y1="' + hub + '" x2="' + (cx + Math.cos(ra) * rr) + '" y2="' + (hub - Math.sin(ra) * rr) + '" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>'); });
  P.push('<circle cx="' + cx + '" cy="' + hub + '" r="' + rr + '" fill="none" stroke="#ffffff" stroke-opacity=".25" stroke-width="1" stroke-dasharray="2 3"/>');
  return P.join('');
};
/* 全球資料集＋衍生查詢（首頁、知識頁、地球儀共用） */
WW.globalData = () => WW.getJSON(WW.DATA.global).then(D => {
  if (!D._idx) {
    D._idx = {};
    D.countries.forEach(c => { D._idx[c.iso] = c; });
    D.Y0 = D.years[0]; D.Y1 = D.years[D.years.length - 1];
  }
  return D;
});
/* 國家名（依目前語言） */
WW.cname = c => c ? (WW.lang === 'zh' ? c.zh : c.name) : '';

/* ---------------- 路由 ---------------- */
const PAGES = {};
let cur = null;                                     // 目前頁面名稱
WW.registerPage = (name, handlers) => { PAGES[name] = handlers; };
WW.parseHash = h => {
  const s = (h || location.hash || '').replace(/^#\/?/, '');
  const [path, qs] = s.split('?');
  const parts = (path || '').split('/').filter(Boolean);
  const params = {};
  if (qs) qs.split('&').forEach(kv => { const [k, v] = kv.split('='); if (k) params[decodeURIComponent(k)] = v == null ? '' : decodeURIComponent(v.replace(/\+/g, ' ')); });
  const page = PAGES[parts[0]] ? parts[0] : (EMB && EMB.lite && PAGES.global ? 'global' : 'home');   // 單檔公開版只有地球儀
  return { page, sub: parts[1] || null, params, raw: s };
};
WW.route = null;
WW.go = hash => { if (location.hash === hash) onRoute(); else location.hash = hash; };
WW.hashFor = (page, sub, params) => {
  let h = '#/' + page + (sub ? '/' + sub : '');
  const q = params ? Object.keys(params).filter(k => params[k] != null && params[k] !== '').map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])) : [];
  return h + (q.length ? '?' + q.join('&') : '');
};
const TITLES = {
  home: ['風電風情 · 台灣即時 × 全球風電發展', 'Wind Watch · Taiwan live × global wind story'],
  live: ['台灣風電即時 · 風電風情', 'Taiwan wind live · Wind Watch'],
  global: ['全球風電發展地圖 1980–2025 · 風電風情', 'Global wind power map 1980–2025 · Wind Watch'],
  learn: ['風電知識 · 風電風情', 'Learn about wind power · Wind Watch'],
  kids: ['跟著風去旅行 · 風電風情探險版', 'Travel with the Wind · Wind Watch for young explorers']
};
function setTitle() {
  const t = TITLES[cur || 'home'];
  if (t) document.title = WW.lang === 'en' ? t[1] : t[0];
}
/* 返回鍵先關掉打開的卡片、視窗與詳情：打開時記一筆上一頁（同一個網址），按返回只關掉它；用 ✕／Esc 關掉時把那一筆退掉。
   由網址打開的（深連結、上一頁回來）不記，換頁時清掉。 · Back closes the open card, dialog or drawer first: opening one adds a history entry
   with the same URL, Back closes it, and closing it with ✕/Esc drops the entry again. Opened from a URL: no entry; cleared on page change. */
const layers = [];
let popIgnore = 0, skipHash = null, skipUntil = 0;
WW.layerOpen = (id, close) => {
  const l = layers.find(x => x.id === id);
  if (l) { l.close = close; return; }
  layers.push({ id, close });
  history.pushState({ wwLayer: id }, '', location.href);
};
WW.layerClosed = id => {
  const i = layers.findIndex(x => x.id === id); if (i < 0) return;
  layers.splice(i, 1);
  if (history.state && history.state.wwLayer === id) { popIgnore++; history.back(); }
};
WW.layerDrop = id => { const i = layers.findIndex(x => x.id === id); if (i >= 0) layers.splice(i, 1); };   // 接著要換頁：不退那一筆
window.addEventListener('popstate', () => {
  const skip = () => { skipHash = location.hash; skipUntil = Date.now() + 600; };   // 接著來的 hashchange 不重新套用網址
  if (popIgnore) { popIgnore--; skip(); return; }
  const top = layers.pop(); if (!top) return;
  skip();
  try { top.close(); } catch (e) { console.error(e); }
});

function onRoute() {
  const r = WW.parseHash();
  if (r.page === cur && skipHash === location.hash && Date.now() < skipUntil) { skipHash = null; WW.route = r; return; }
  const changed = r.page !== cur;
  if (changed) layers.length = 0;
  if (changed && cur && PAGES[cur] && PAGES[cur].leave) { try { PAGES[cur].leave(); } catch (e) { console.error(e); } }
  WW.route = r;
  document.querySelectorAll('.page').forEach(p => { p.hidden = p.dataset.page !== r.page; });
  document.querySelectorAll('[data-route]').forEach(a => {
    if (a.dataset.route === r.page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.body.dataset.page = r.page;
  const prev = cur; cur = r.page;
  setTitle();
  if (changed) window.scrollTo(0, 0);
  const h = PAGES[r.page];
  if (h && h.enter) { try { h.enter(r, prev); } catch (e) { console.error(e); } }
}
WW.currentPage = () => cur;

/* ---------------- 全球發展頁：three.js（約 600 KB）與地球儀程式只在第一次進入時載入 ---------------- */
let globeLoad = null;
WW.registerPage('global', {
  enter(r) {
    // async=false 的動態 script 依插入順序執行，可平行下載
    globeLoad = globeLoad || Promise.all([
      WW.loadCSS('assets/css/globe.css'),
      WW.loadScript('assets/vendor/three-r128.min.js'),
      WW.loadScript('assets/vendor/OrbitControls-r128.js'),
      WW.loadScript('assets/js/globe.js')
    ]);
    globeLoad.then(() => { if (cur === 'global' && WW.globe) WW.globe.enter(r); }).catch(e => {
      console.error(e); globeLoad = null;
      const l = document.getElementById('globe-loading');
      if (l) l.textContent = WW.L('3D 地球儀載入失敗，請檢查網路後重新整理。', 'The 3D globe failed to load. Check your connection and reload.');
    });
  },
  leave() { if (WW.globe) WW.globe.leave(); }
});

/* ---------------- 兒童版「跟著風去旅行」：程式與 three.js 只在第一次進入時載入（單檔公開版沒有這一頁） ---------------- */
let kidsLoad = null;
if (!(EMB && EMB.lite)) WW.registerPage('kids', {
  enter(r) {
    kidsLoad = kidsLoad || Promise.all([
      WW.loadCSS('assets/css/kids.css'),
      WW.loadScript('assets/vendor/three-r128.min.js'),
      WW.loadScript('assets/vendor/OrbitControls-r128.js'),
      WW.loadScript('assets/js/kids.js')
    ]);
    kidsLoad.then(() => { if (cur === 'kids' && WW.kids) WW.kids.enter(r); }).catch(e => {
      console.error(e); kidsLoad = null;
      const l = document.getElementById('kids-loading');
      if (l) l.textContent = WW.L('載入失敗，請檢查網路後重新整理。', 'Failed to load. Check your connection and reload.');
    });
  },
  leave() { if (WW.kids) WW.kids.leave(); }
});

/* ---------------- header 高度（全螢幕頁：地球儀、風場牆、地圖用） ---------------- */
function syncHeaderH() {
  const h = document.querySelector('.topbar');
  if (h) document.documentElement.style.setProperty('--header-h', h.offsetHeight + 'px');
}

/* ---------------- 分享（依目前頁面：即時頁由 live.js 產圖卡；其他頁分享連結） ---------------- */
WW.shareHandlers = {};
WW.share = async () => {
  const h = WW.shareHandlers[cur];
  if (h) return h();
  const url = WW.pageURL();
  const text = WW.L('風電風情：台灣風電即時資訊 × 全球風電發展 1980–2025', 'Wind Watch: Taiwan wind live × global wind power 1980–2025');
  if (navigator.share) { try { await navigator.share({ title: document.title, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); WW.toast(WW.L('已複製此頁連結 ✓', 'Link copied ✓')); }
  catch (e) { WW.toast(WW.L('請手動複製網址', 'Please copy the URL manually')); }
};

/* ---------------- 開機 ---------------- */
WW.boot = () => {
  syncLangDom();
  WW.applyI18n();
  WW.paintIcons();
  syncHeaderH();
  if ('ResizeObserver' in window) new ResizeObserver(syncHeaderH).observe(document.querySelector('.topbar'));
  else window.addEventListener('resize', syncHeaderH);
  document.getElementById('langbtn').onclick = () => WW.setLang(WW.lang === 'zh' ? 'en' : 'zh');
  document.getElementById('sharebtn').onclick = () => WW.share();
  window.addEventListener('hashchange', onRoute);
  onRoute();
};
document.addEventListener('DOMContentLoaded', () => { WW.boot(); });
})();
