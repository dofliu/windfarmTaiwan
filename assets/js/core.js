/* 風電風情 · core.js
   全站共用：語言（zh/en）、hash 路由、延遲載入、資料快取、數字格式、分享。
   各頁模組（home / live / global / learn）以 WW.registerPage() 註冊 enter/leave，
   由路由在切換頁面時呼叫——例如 3D 地球儀離開頁面時會停掉繪圖迴圈，不在背景耗電。 */
(function () {
'use strict';
const WW = window.WW = window.WW || {};

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
const langSubs = [];
WW.onLang = fn => { langSubs.push(fn); };
WW.applyI18n = root => {
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = WW.t(el.dataset.i18n); });
  r.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = WW.t(el.dataset.i18nHtml); });
  r.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = WW.t(el.dataset.i18nTitle); });
  r.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', WW.t(el.dataset.i18nAria)); });
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
  const s = document.createElement('script'); s.src = src; s.async = false;
  s.onload = () => res(); s.onerror = () => { delete scripts[src]; rej(new Error('failed to load ' + src)); };
  document.head.appendChild(s);
}));
WW.loadCSS = href => styles[href] || (styles[href] = new Promise((res, rej) => {
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
  l.onload = () => res(); l.onerror = () => { delete styles[href]; rej(new Error('failed to load ' + href)); };
  document.head.appendChild(l);
}));
/* 靜態資料（全球資料集）：整個工作階段只抓一次 */
WW.getJSON = url => jsonCache[url] || (jsonCache[url] = fetch(url).then(r => {
  if (!r.ok) throw new Error(url + ' ' + r.status); return r.json();
}).catch(e => { delete jsonCache[url]; throw e; }));
/* 即時資料（每 10–15 分更新）：不快取 */
WW.getLiveJSON = url => fetch(url, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });

WW.DATA = {
  global: 'data/global/wind_global.json',
  farms: 'data/global/wind_farms.json',
  borders: 'data/global/world_borders.json'
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
  const page = PAGES[parts[0]] ? parts[0] : 'home';
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
  learn: ['風電知識 · 風電風情', 'Learn about wind power · Wind Watch']
};
function setTitle() {
  const t = TITLES[cur || 'home'];
  if (t) document.title = WW.lang === 'en' ? t[1] : t[0];
}
function onRoute() {
  const r = WW.parseHash();
  const changed = r.page !== cur;
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
  const url = location.href;
  const text = WW.L('風電風情：台灣風電即時資訊 × 全球風電發展 1980–2025', 'Wind Watch: Taiwan wind live × global wind power 1980–2025');
  if (navigator.share) { try { await navigator.share({ title: document.title, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); WW.toast(WW.L('已複製此頁連結 ✓', 'Link copied ✓')); }
  catch (e) { WW.toast(WW.L('請手動複製網址', 'Please copy the URL manually')); }
};

/* ---------------- 開機 ---------------- */
WW.boot = () => {
  syncLangDom();
  WW.applyI18n();
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
