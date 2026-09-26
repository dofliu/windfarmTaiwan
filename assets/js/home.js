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
  $('hh-mood').innerHTML = `<span aria-hidden="true">${M.m.e}</span> ${WW.esc(M.m.t)}`;
}

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
let GD = null;
function paintAll() { paintLive(); if (GD) paintWorld(GD); }
WW.registerPage('home', { enter() { paintAll(); } });
WW.onLang(paintAll);
if (WW.live) WW.live.onUpdate(() => { if (WW.currentPage() === 'home') paintLive(); });
WW.globalData().then(D => { GD = D; paintWorld(D); }).catch(() => {
  $('hh-world').textContent = '—';
  $('hh-worldcap').textContent = EN() ? 'Global data could not be loaded.' : '全球資料載入失敗。';
});
})();
