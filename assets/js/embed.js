/* 風電風情 · embed.js — 可嵌入的小卡 #/embed：台灣此刻的風電出力，給學校或其他網站用 <iframe> 放進自己的頁面
   只畫一張卡（沒有頁首、頁尾）：此刻出力、可用率、可供家戶、占全國發電、「今天的風」第一句、過去 7 天曲線、資料時間與回本站的連結。
   網址參數：l=en 英文（不改這個瀏覽器記住的語言）、t=light 淺色（只在這一頁，不存）。資料與其他頁同一份（WW.live，本站約每 30 分鐘更新）。
   分享視窗的「嵌入到你的網站」會複製 <iframe> 程式碼（WW.embedSnippet）。
   The embeddable card: Taiwan's wind output right now for other sites to put in an <iframe>; params l=en and t=light apply to this page only. */
(function () {
'use strict';
const WW = window.WW;
const host = document.getElementById('page-embed');
if (!host) return;
let lang = null, themed = false, mounted = false;
const L = (zh, en) => (lang || WW.lang) === 'en' ? en : zh;
const tms = s => Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + '+08:00');

function spark(P, W, H) {                            // 過去 7 天：與首頁同一份取樣，只畫線與此刻的點
  if (P.length < 3) return '';
  const t0 = P[0].t, t1 = P[P.length - 1].t, mx = Math.max(...P.map(p => p.v), 1);
  const x = t => ((t - t0) / Math.max(1, t1 - t0) * (W - 6) + 3).toFixed(1), y = v => (H - 4 - v / mx * (H - 10)).toFixed(1);
  const pts = P.map(p => x(p.t) + ',' + y(p.v)).join(' '), last = P[P.length - 1];
  return `<svg class="emb-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polygon points="3,${H} ${pts} ${W - 3},${H}" class="ea"/><polyline points="${pts}" class="el"/><circle cx="${x(last.t)}" cy="${y(last.v)}" r="3" class="ed"/></svg>`;
}
function paint() {
  const Lv = WW.live; if (!Lv || !mounted) return;
  const T = Lv.totals(), V = Lv.impactVals(), live = Lv.isLive(), st = Lv.srcTime && Lv.srcTime();
  const facts = WW.todayFacts ? WW.todayFacts(null, lang) : [];
  const P = ((Lv.hist && Lv.hist().points) || []).filter(p => p && p.t && typeof p.total === 'number').map(p => ({ t: tms(p.t), v: p.total })).filter(p => !isNaN(p.t)).sort((a, b) => a.t - b.t);
  const end = P.length ? P[P.length - 1].t : 0, P7 = P.filter(p => p.t >= end - 7 * 864e5);
  const subs = [];
  if (T.cap > 0) subs.push(L('可用率 ', 'availability ') + (T.ratio * 100).toFixed(0) + '%');
  if (V.homes > 0) subs.push(L('約可供 ' + V.homes.toFixed(V.homes < 10 ? 1 : 0) + ' 萬戶', 'about ' + WW.int(V.homes * 10) + 'k homes'));
  if (V.share != null) subs.push(L('占全國發電 ', 'share of national generation ') + V.share.toFixed(1) + '%');
  const url = WW.SITE + '#/live';
  host.querySelector('.emb').innerHTML =
    `<h1 class="emb-h"><a class="emb-brand" href="${url}" target="_top" rel="noopener"><span class="emb-dot${live ? ' on' : ''}"></span>${L('風電風情 · 台灣風電此刻', 'Wind Watch · Taiwan wind right now')}</a></h1>
    <div class="emb-main"><b>${WW.int(T.total)}</b><span>MW</span>${subs.length ? `<small>${WW.esc(subs.join(' · '))}</small>` : ''}</div>
    ${facts[0] ? `<div class="emb-fact"><span aria-hidden="true">${facts[0].ic}</span>${WW.esc(facts[0].text)}</div>` : ''}
    ${P7.length >= 3 ? `<div class="emb-7d">${spark(P7, 400, 54)}<small>${L('過去 7 天 · 本站取樣', 'Past 7 days · the site\'s samples')}</small></div>` : ''}
    <div class="emb-foot">${live ? L('台電資料 ', 'Taipower data ') + WW.esc(Lv.fmtSrc(st)) + L(' · 本站約每 30 分鐘更新', ' · refreshed about every 30 min') : L('模擬資料（暫時拿不到台電資料）', 'Simulated (Taipower data unavailable for now)')} · <a href="${url}" target="_top" rel="noopener">${L('打開網站 →', 'Open the site →')}</a></div>`;
}
WW.registerPage('embed', {
  enter(r) {
    lang = r.params.l === 'en' ? 'en' : r.params.l === 'zh' ? 'zh' : null;
    if (r.params.t === 'light' && document.documentElement.dataset.theme !== 'light') { document.documentElement.dataset.theme = 'light'; themed = true; }
    if (!mounted) { host.innerHTML = '<div class="emb"></div>'; mounted = true; }
    paint();
  },
  leave() { if (themed) { delete document.documentElement.dataset.theme; themed = false; } }
});
if (WW.live && WW.live.onUpdate) WW.live.onUpdate(() => { if (WW.currentPage() === 'embed') paint(); });
WW.onLang(() => { if (WW.currentPage() === 'embed') paint(); });
if (WW.farmDaily) WW.farmDaily().then(() => { if (WW.currentPage() === 'embed') paint(); }).catch(() => {});
/* 給別的網站貼的程式碼 · the snippet other sites paste */
WW.embedSnippet = () => `<iframe src="${WW.SITE}#/embed${WW.lang === 'en' ? '?l=en' : ''}" width="100%" height="280" style="border:0;max-width:460px;border-radius:14px" title="${WW.lang === 'en' ? 'Taiwan wind right now · Wind Watch' : '台灣風電此刻 · 風電風情'}" loading="lazy"></iframe>`;
})();
