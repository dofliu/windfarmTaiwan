/* 風電風情 · learn.js — 風電知識 12 章：章節導覽、以全球資料集繪製的圖表、里程碑卡片、資料來源 */
(function () {
'use strict';
const WW = window.WW;
const $ = id => document.getElementById(id);
const EN = () => WW.lang === 'en';
const L = WW.L;
const COL = { on: '#B8892F', off: '#3B8FE0', float: '#1f9e8a', asia: '#d55181', europe: '#9085e9', other: '#5b6b80', wind: '#3987e5', solar: '#d95926', live: '#3fdcb0', muted: '#40506a' };
const gw = mw => WW.num(mw / 1000, mw >= 100000 ? 0 : 1) + ' GW';

let D = null, rendered = false;

/* ---------- 頁首數字 ---------- */
function paintFacts() {
  const F = WW.globalFacts(D), box = $('ln-facts');
  const tile = (k, v, u, s) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}${u ? `<small>${u}</small>` : ''}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
  box.innerHTML =
    tile(L('全球累計（' + F.Y + '）', 'World total (' + F.Y + ')'), WW.int(F.world / 1000), 'GW', WW.int(F.world) + ' MW') +
    tile(L('其中離岸', 'Of which offshore'), WW.num(F.worldOff / 1000, 1), 'GW', (F.worldOff / F.world * 100).toFixed(1) + '%') +
    tile(L(F.Y + ' 年新增', 'Added in ' + F.Y), WW.int(F.add / 1000), 'GW', L('歷年最高', 'a record year')) +
    tile(L('台灣離岸 全球排名', "Taiwan's offshore rank"), '#' + F.offRank, '', WW.int(F.twOff) + ' MW');
}

/* ---------- 里程碑卡片 ---------- */
function paintMilestones() {
  document.querySelectorAll('[data-ms]').forEach(box => {
    const k = box.dataset.ms; box.textContent = '';
    let list;
    if (k === 'offshore') list = D.milestones.filter(m => m.type === 'offshore');
    else if (k === 'floating') list = D.milestones.filter(m => m.type === 'floating');
    else { const [a, b] = k.split('-').map(Number); list = D.milestones.filter(m => m.year >= a && m.year <= b); }
    list.forEach(m => box.appendChild(WW.msCard(m, D)));
  });
}

/* ---------- 圖表 ---------- */
function mount(key) { const el = document.querySelector(`[data-chart="${key}"]`); if (el) el.textContent = ''; return el; }
function charts() {
  const Y = D.years, C = D.countries, n = Y.length, i = n - 1;
  const onS = Y.map((y, k) => C.reduce((s, c) => s + c.on[k], 0)), offS = Y.map((y, k) => C.reduce((s, c) => s + c.off[k], 0));
  const both = gwv => `${WW.num(gwv / 1000, gwv >= 1e5 ? 0 : 1)} GW（${WW.int(gwv)} MW）`;
  const src = L('資料：IRENA / Our World in Data、GWEC、WFO、EWEA、BTM Consult（1980–1999 多數國家為估計值）', 'Data: IRENA / Our World in Data, GWEC, WFO, EWEA, BTM Consult (1980–1999 mostly estimates)');

  // 1. 全球累計（陸域＋離岸堆疊）
  WW.chart.line(mount('world'), {
    title: L('全球風電累計裝置容量 1980–' + D.Y1, 'Global cumulative wind capacity 1980–' + D.Y1),
    subtitle: L('陸域與離岸堆疊 · 年底累計 · 縱軸單位 GW（1 GW＝1,000 MW），提示框同時列出 MW', 'Onshore and offshore stacked · year-end · axis in GW (1 GW = 1,000 MW), tooltip also in MW'),
    x: Y, stacked: true, endLabels: true, totalLabel: L('合計', 'Total'),
    series: [{ name: L('陸域', 'Onshore'), color: COL.on, values: onS }, { name: L('離岸', 'Offshore'), color: COL.off, values: offS }],
    yFmt: v => WW.int(v / 1000), tipFmt: both,
    annotations: [{ x: 1985, label: '1 GW' }, { x: 1999, label: '10 GW' }, { x: 2008, label: '100 GW' }, { x: 2023, label: '1 TW' }],
    height: 320, source: src,
    table: { head: [L('年', 'Year'), L('陸域 MW', 'Onshore MW'), L('離岸 MW', 'Offshore MW'), L('合計 MW', 'Total MW')], rows: Y.map((y, k) => [String(y), WW.int(onS[k]), WW.int(offS[k]), WW.int(onS[k] + offS[k])]).reverse() }
  });
  // 2. 每年新增
  const tot = Y.map((y, k) => onS[k] + offS[k]);
  const adds = tot.slice(1).map((v, k) => Math.max(0, v - tot[k]));
  const recIdx = adds.indexOf(Math.max(...adds));
  WW.chart.columns(mount('adds'), {
    title: L('每年新增裝置容量（GW）', 'Capacity added each year (GW)'),
    subtitle: L(`${Y[recIdx + 1]} 年新增 ${both(adds[recIdx])}，為歷年最高`, `${Y[recIdx + 1]} added ${both(adds[recIdx])}, the most ever`),
    x: Y.slice(1), values: adds, color: COL.live, mutedColor: '#2a6f5c', highlight: k => k === recIdx, labels: [recIdx],
    seriesName: L('新增', 'Added'), yFmt: v => WW.int(v / 1000), tipFmt: both, height: 230,
    table: { head: [L('年', 'Year'), L('新增 MW', 'Added MW')], rows: Y.slice(1).map((y, k) => [String(y), WW.int(adds[k])]).reverse() }, source: src
  });

  // 3. 洲別占比
  const cont = key => Y.map((y, k) => { const all = tot[k] || 1; return C.filter(c => c.cont === key).reduce((s, c) => s + c.on[k] + c.off[k], 0) / all * 100; });
  const y0 = Y.indexOf(1990);
  const asia = cont('Asia').slice(y0), eu = cont('Europe').slice(y0), na = cont('North America').slice(y0);
  const cross = Y.slice(y0).find((y, k) => asia[k] > eu[k]);
  WW.chart.line(mount('regions'), {
    title: L('全球風電容量的洲別占比 1990–' + D.Y1, 'Share of global wind capacity by continent 1990–' + D.Y1),
    subtitle: L(`亞洲在 ${cross} 年超越歐洲`, `Asia overtook Europe in ${cross}`),
    x: Y.slice(y0), endLabels: true,
    series: [{ name: L('亞洲', 'Asia'), color: COL.asia, values: asia }, { name: L('歐洲', 'Europe'), color: COL.europe, values: eu }, { name: L('北美', 'N. America'), color: COL.other, values: na }],
    yFmt: v => Math.round(v) + '%', yMax: 100, annotations: [{ x: cross, label: L('亞洲超越歐洲', 'Asia passes Europe') }], height: 280,
    table: { head: [L('年', 'Year'), L('亞洲', 'Asia'), L('歐洲', 'Europe'), L('北美', 'N. America')], rows: Y.slice(y0).map((y, k) => [String(y), asia[k].toFixed(1) + '%', eu[k].toFixed(1) + '%', na[k].toFixed(1) + '%']).reverse() },
    source: src
  });

  // 4. 前 15 名（MW）＋台灣
  const rankAll = C.slice().sort((a, b) => (b.on[i] + b.off[i]) - (a.on[i] + a.off[i]));
  const rows = rankAll.slice(0, 15).map((c, k) => ({ label: WW.cname(c), rank: k + 1, parts: [c.on[i], c.off[i]], highlight: c.iso === 'TWN', onClick: () => WW.go(WW.hashFor('global', null, { r: c.iso })) }));
  const twR = rankAll.findIndex(c => c.iso === 'TWN');
  if (twR >= 15) { const c = rankAll[twR]; rows.push({ label: `#${twR + 1} ${WW.cname(c)}`, rank: twR + 1, parts: [c.on[i], c.off[i]], highlight: true, onClick: () => WW.go(WW.hashFor('global', null, { r: 'TWN' })) }); }
  WW.chart.hbar(mount('top15'), {
    title: L(`累計裝置容量前 15 名（${D.Y1}，MW）`, `Top 15 by cumulative capacity (${D.Y1}, MW)`),
    subtitle: L('點一下國家，在 3D 地球儀上飛過去 · 台灣另列於最後', 'Click a country to fly there on the 3D globe · Taiwan appended'),
    series: [{ name: L('陸域', 'Onshore'), color: COL.on }, { name: L('離岸', 'Offshore'), color: COL.off }],
    rows, valueFmt: v => WW.int(v) + ' MW', totalLabel: L('合計', 'Total'), source: src,
    table: { head: ['#', L('國家', 'Country'), L('陸域 MW', 'Onshore MW'), L('離岸 MW', 'Offshore MW'), L('合計 MW', 'Total MW')], rows: rankAll.map((c, k) => [String(k + 1), WW.cname(c), WW.int(c.on[i]), WW.int(c.off[i]), WW.int(c.on[i] + c.off[i])]) }
  });

  // 5. 離岸前 10（強調台灣）
  const offR = C.slice().sort((a, b) => b.off[i] - a.off[i]).filter(c => c.off[i] > 0);
  WW.chart.hbar(mount('offtop'), {
    title: L(`離岸風電累計容量前 10 名（${D.Y1}，MW）`, `Top 10 offshore wind countries (${D.Y1}, MW)`),
    subtitle: L('台灣以亮色標示；台灣與中國含部分併網中的容量（見第 12 章口徑說明）', 'Taiwan highlighted; Taiwan and China include partially connected capacity (see chapter 12)'),
    series: [{ name: L('離岸', 'Offshore'), color: COL.off }], emphasis: true, muted: COL.muted,
    rows: offR.slice(0, 10).map((c, k) => ({ label: WW.cname(c), rank: k + 1, parts: [c.off[i]], highlight: c.iso === 'TWN', onClick: () => WW.go(WW.hashFor('global', null, { r: c.iso, layer: 'off' })) })),
    valueFmt: v => WW.int(v) + ' MW', source: src,
    table: { head: ['#', L('國家', 'Country'), L('離岸 MW', 'Offshore MW')], rows: offR.map((c, k) => [String(k + 1), WW.cname(c), WW.int(c.off[i])]) }
  });

  // 6. 葉輪直徑演進（里程碑）
  const TYPES = ['onshore', 'offshore', 'floating'];
  const pts = D.milestones.filter(m => m.rotor).map(m => ({
    x: m.year, y: m.rotor, s: TYPES.indexOf(m.type), title: `${m.year} · ${m.name}`,
    rows: [{ name: L('葉輪直徑', 'Rotor Ø'), value: m.rotor + ' m' }, ...(m.mw ? [{ name: L('單機', 'Turbine'), value: (m.mw < 1 ? WW.num(m.mw * 1000, 0) + ' kW' : m.mw + ' MW') }] : [])],
    label: /Brush|Growian|Horns Rev|Formosa 1|Dongfang|Smith/.test(m.name) ? `${m.name.split(/[,(]/)[0].replace(/ offshore wind farm| wind turbine/i, '')} · ${m.rotor} m` : null,
    labelDy: /Growian/.test(m.name) ? 14 : -8,
    onClick: () => WW.go(WW.hashFor('global', null, { ms: m.name }))
  }));
  WW.chart.scatter(mount('rotor'), {
    title: L('葉輪直徑的演進（里程碑機組）', 'Rotor diameter of milestone turbines'),
    subtitle: L('點一下點，在地球儀上看那部風機', 'Click a dot to see that turbine on the globe'),
    series: [{ name: L('陸域', 'Onshore'), color: COL.on }, { name: L('離岸', 'Offshore'), color: COL.off }, { name: L('浮動式', 'Floating'), color: COL.float }],
    points: pts, xDomain: [1880, 2030], yMax: 320, yFmt: v => v + ' m', height: 320,
    refLines: [{ y: 105, label: L('足球場長 ≈ 105 m', 'football pitch ≈ 105 m') }],
    table: { head: [L('年', 'Year'), L('機組', 'Turbine'), L('類型', 'Type'), L('葉輪直徑', 'Rotor Ø'), L('單機', 'Rating')], rows: D.milestones.filter(m => m.rotor).map(m => [String(m.year), m.name, WW.typeName(m.type), m.rotor + ' m', m.mw ? (m.mw < 1 ? WW.num(m.mw * 1000, 0) + ' kW' : m.mw + ' MW') : '—']) },
    source: L('資料：本站全球資料集的 35 個里程碑（製造商與維基百科公開規格）', "Data: the 35 milestones in this site's global dataset (manufacturer and Wikipedia specifications)")
  });
  scaleFigure(mount('scale'));

  // 7. 台灣
  const tw = D._idx.TWN, t0 = Y.indexOf(2000);
  WW.chart.line(mount('taiwan'), {
    title: L('台灣風電裝置容量 2000–' + D.Y1 + '（MW）', "Taiwan's wind capacity 2000–" + D.Y1 + ' (MW)'),
    subtitle: L('陸域與離岸堆疊 · 國際比較口徑（見下方說明）', 'Onshore and offshore stacked · international-comparison basis (see note below)'),
    x: Y.slice(t0), stacked: true, endLabels: true, totalLabel: L('合計', 'Total'),
    series: [{ name: L('陸域', 'Onshore'), color: COL.on, values: tw.on.slice(t0) }, { name: L('離岸', 'Offshore'), color: COL.off, values: tw.off.slice(t0) }],
    yFmt: v => WW.int(v) + ' MW', annotations: [{ x: 2017, label: L('第一部離岸風機', 'first offshore turbines') }, { x: 2021, label: L('台電離岸一期', 'Taipower Phase 1') }],
    height: 300, table: { head: [L('年', 'Year'), L('陸域 MW', 'Onshore MW'), L('離岸 MW', 'Offshore MW'), L('合計 MW', 'Total MW')], rows: Y.slice(t0).map((y, k) => [String(y), WW.int(tw.on[t0 + k]), WW.int(tw.off[t0 + k]), WW.int(tw.on[t0 + k] + tw.off[t0 + k])]).reverse() },
    source: L('資料：IRENA（總量）、WFO／GWEC（離岸），台灣 2022–2025 陸域／離岸拆分經本站修正（第 12 章）', 'Data: IRENA (totals), WFO/GWEC (offshore); Taiwan 2022–2025 split corrected by this site (chapter 12)')
  });

  // 8. 迷思：季節互補（示意）
  WW.chart.line(mount('season'), {
    title: L('風電與太陽能的季節互補（示意）', 'Wind and solar complement each other through the year (illustrative)'),
    subtitle: L('典型季節型態，相對強度 0–1；非特定年份實測', 'Typical seasonal pattern, relative strength 0–1; not a specific year'),
    x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], xFmt: m => EN() ? ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] : m + '月', xEvery: 1, endLabels: true,
    series: [{ name: L('離岸風電', 'Offshore wind'), color: COL.wind, values: [.9, .85, .72, .52, .36, .26, .22, .28, .42, .66, .84, .9] }, { name: L('太陽能', 'Solar'), color: COL.solar, values: [.42, .52, .66, .8, .9, .96, .96, .9, .76, .6, .46, .4] }],
    yFmt: v => v.toFixed(1), yMax: 1, height: 240,
    table: { head: [L('月', 'Month'), L('離岸風電', 'Offshore wind'), L('太陽能', 'Solar')], rows: [.9, .85, .72, .52, .36, .26, .22, .28, .42, .66, .84, .9].map((v, k) => [String(k + 1), String(v), String([.42, .52, .66, .8, .9, .96, .96, .9, .76, .6, .46, .4][k])]) }
  });
  // 9. 迷思：成本
  WW.chart.hbar(mount('cost'), {
    title: L('台灣離岸風電價格一路下降（元／度）', "Taiwan's offshore wind prices fell steadily (NT$/kWh)"),
    series: [{ name: L('價格', 'Price'), color: COL.wind }],
    rows: [
      { label: L('示範／遴選', 'Demo / selection'), parts: [5.8], valueLabel: L('約 5.8 元', '~NT$5.8') },
      { label: L('競價 2018', 'Auction 2018'), parts: [2.35], valueLabel: L('2.2–2.5 元', 'NT$2.2–2.5') },
      { label: L('區塊開發', 'Zonal phase'), parts: [0.02], valueLabel: L('零元躉購＊', 'zero subsidy*') }],
    max: 6.2, valueFmt: v => v.toFixed(2), rowH: 34,
    source: L('＊零元躉購：改由企業以綠電購售合約（CPPA）承購，不再領政府躉購費率。', '*Zero subsidy: power sold to companies through corporate PPAs instead of a government feed-in tariff.'),
    table: { head: [L('階段', 'Phase'), L('價格', 'Price')], rows: [[L('示範／遴選', 'Demo / selection'), L('約 5.8 元/度', '~NT$5.8/kWh')], [L('競價 2018', 'Auction 2018'), L('2.2–2.5 元/度', 'NT$2.2–2.5/kWh')], [L('區塊開發', 'Zonal phase'), L('零元躉購（CPPA）', 'zero subsidy (CPPA)')]] }
  });
  // 10. 迷思：鳥類
  WW.chart.hbar(mount('birds'), {
    title: L('每年鳥類死亡原因估計（美國，國際研究）', 'Estimated annual bird deaths by cause (US, international studies)'),
    series: [{ name: L('每年死亡', 'Deaths / yr'), color: COL.live }], emphasis: true, muted: COL.muted,
    rows: [
      { label: L('🐈 家貓', '🐈 Cats'), parts: [2.4e9], valueLabel: L('約 24 億', '~2.4 billion') },
      { label: L('🏢 建築玻璃', '🏢 Buildings'), parts: [5.99e8], valueLabel: L('約 6 億', '~599 million') },
      { label: L('💨 風機', '💨 Turbines'), parts: [2.34e5], valueLabel: L('約 23 萬', '~234,000'), highlight: true }],
    valueFmt: v => WW.int(v), rowH: 34,
    source: L('資料：美國魚類及野生動物署等國際研究估計；風機那一條短到幾乎看不見——這正是重點。', 'Data: US Fish & Wildlife Service and other studies; the turbine bar is almost invisible — that is the point.'),
    table: { head: [L('原因', 'Cause'), L('每年', 'Per year')], rows: [[L('家貓', 'Cats'), '2,400,000,000'], [L('建築玻璃', 'Buildings'), '599,000,000'], [L('風機', 'Turbines'), '234,000']] }
  });
}

/* ---------- 風機大小等比例圖（葉輪直徑，旁邊放台北 101 當比例尺） ---------- */
function scaleFigure(host) {
  const pick = [['Brush', 1888], ['Gedser', 1957], ['Horns Rev', 2002], ['Formosa 1', 2019], ['Vestas V236', 2023], ['Dongfang', 2025]];
  const items = pick.map(([p]) => D.milestones.find(m => m.name.startsWith(p))).filter(m => m && m.rotor);
  WW.chart.figure(host, {
    title: L('等比例看風機長大：葉輪直徑 vs 台北 101', 'Turbines to scale: rotor diameter vs Taipei 101'),
    subtitle: L('圓的直徑按實際公尺等比例；台北 101 高 508 m', 'Circle diameters drawn to scale in metres; Taipei 101 is 508 m tall'),
    table: { head: [L('年', 'Year'), L('機組', 'Turbine'), L('葉輪直徑', 'Rotor Ø')], rows: items.map(m => [String(m.year), m.name, m.rotor + ' m']).concat([[' ', L('台北 101（高度）', 'Taipei 101 (height)'), '508 m']]) },
    render(plot, W) {
      const H = Math.min(360, Math.max(250, W * 0.42)), base = H - 44, gap = 14, t101w = 46;
      const sumD = items.reduce((s, m) => s + m.rotor, 0);
      const k = Math.min((base - 24) / 508, (W - 40 - t101w - gap * (items.length + 1)) / sumD);
      let x = 16, g = `<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="rgba(255,255,255,.16)"/>`;
      items.forEach(m => {
        const d = m.rotor * k, r = d / 2, cx = x + r, cy = base - r;
        const col = m.type === 'onshore' ? COL.on : m.type === 'floating' ? COL.float : COL.off;
        g += `<circle cx="${cx}" cy="${cy}" r="${Math.max(r, 1.5)}" fill="${col}" fill-opacity=".14" stroke="${col}" stroke-width="2"/>`;
        g += `<text class="dl" x="${cx}" y="${base + 16}" text-anchor="middle">${m.rotor} m</text><text class="dl2" x="${cx}" y="${base + 31}" text-anchor="middle">${m.year}</text>`;
        x += d + gap;
      });
      const h101 = 508 * k, tx = W - t101w - 10;
      g += `<path d="M${tx + t101w * 0.18},${base} L${tx + t101w * 0.3},${base - h101 * 0.86} L${tx + t101w * 0.46},${base - h101 * 0.9} L${tx + t101w * 0.5},${base - h101} L${tx + t101w * 0.54},${base - h101 * 0.9} L${tx + t101w * 0.7},${base - h101 * 0.86} L${tx + t101w * 0.82},${base} Z" fill="rgba(234,241,248,.10)" stroke="rgba(234,241,248,.45)" stroke-width="1.5"/>`;
      g += `<text class="dl" x="${tx + t101w / 2}" y="${base + 16}" text-anchor="middle">508 m</text><text class="dl2" x="${tx + t101w / 2}" y="${base + 31}" text-anchor="middle">${L('台北 101', 'Taipei 101')}</text>`;
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('width', W); s.setAttribute('height', H); s.setAttribute('role', 'img');
      s.setAttribute('aria-label', items.map(m => `${m.year} ${m.rotor} m`).join(', ') + ', Taipei 101 508 m');
      s.innerHTML = g; plot.appendChild(s);
    }
  });
}

/* ---------- 資料來源、本站修正 ---------- */
function paintSources() {
  const e = $('ln-edits'); e.textContent = '';
  const h = WW.el('h3', { class: 'h3', style: 'margin:18px 0 8px' }, L('本站對全球資料集所做的修正', "Corrections this site made to the global dataset"));
  e.appendChild(h);
  const ul = WW.el('ul', { class: 'srclist' });
  (D.meta && D.meta.edits || []).forEach(x => ul.appendChild(WW.el('li', null, x)));
  ul.appendChild(WW.el('li', null, L('國界改用 Natural Earth 1:50m 官方資料重建（原資料缺少澳洲本土）；克里米亞依聯合國大會第 68/262 號決議劃歸烏克蘭，與風場資料的國別一致。', 'Borders rebuilt from the official Natural Earth 1:50m data (the original lacked mainland Australia); Crimea is shown as part of Ukraine per UN General Assembly resolution 68/262, matching the country of its wind farms in the farm data.')));
  ul.appendChild(WW.el('li', null, L('風場層級資料與 Global Energy Monitor「全球風電追蹤」2025-02 版合併（CC BY 4.0），加入興建中、前期開發與已宣布的規劃案；與精選風場重複者以精選為準。', 'Farm-level data merged with the Global Energy Monitor Global Wind Power Tracker, February 2025 release (CC BY 4.0), adding projects under construction, in pre-construction and announced; duplicates of curated farms keep the curated record.')));
  ul.appendChild(WW.el('li', null, L('台灣 2005–2025 陸域／離岸改採經濟部能源署《2025 能源統計手冊》表 3-6 官方年表；日本 2011–2025 改採日本風力發電協會（JWPA）年末累積導入量（原資料為 IRENA）；兩國風場逐場稽核，分批併網的大型離岸風場以全場完工年計入，2025 年底尚未全場商轉者列為興建中。', 'Taiwan 2005–2025 onshore/offshore now follows the official MOEA Energy Administration table (Energy Statistics Handbook 2025, Table 3-6); Japan 2011–2025 follows JWPA year-end statistics (the original used IRENA); farms in both countries were audited one by one — large offshore farms connected in stages count from their full-completion year, and those not fully operating at end-2025 are listed as under construction.')));
  ul.appendChild(WW.el('li', null, L('日本補上 GEM 未收錄的小型風場（NEDO 各縣清單與 windfarm.work／營運商資料，共 100 座），並修正 22 筆 GEM 錯置的座標（例：石狩八の沢、尻別）。', 'Japan adds 100 small farms missing from GEM (NEDO prefecture lists and windfarm.work / operator pages) and corrects 22 misplaced GEM coordinates (e.g. Ishikari Hachinosawa, Shiribetsu).')));
  ul.appendChild(WW.el('li', null, L('GEM 同一場址底下相距 25 km 以上的分期分開標示（不取平均座標）；3 筆可由專案名稱確認的座標錯誤已修正（宮城加美、珠洲第 1、珠洲第 2 期）；1 筆國別與座標不符的 WRI GPPD 舊資料已排除。', 'GEM phases more than 25 km apart under one location are shown as separate points (no averaged coordinates); three coordinate errors that the project names make obvious were corrected (Miyagi Kami, Suzu 1, Suzu 2 phase 2); one WRI GPPD record whose country and coordinates disagree was dropped.')));
  const cl = WW.el('li', null, L('2026 年 9 月逐筆查證：刪除重複、從未建成或查無此場的風場紀錄（例：泰國並不存在的 600 MW「Jhimpir」、挪威未獲准的 Hordavind、中國與逐場資料重複的整區彙總），並修正座標、容量、年份、分期或狀態；共用省或國家中心代用座標的風場在地圖上示意排開。逐筆理由與出處見',
    'Checked record by record in Sep 2026: duplicate, never-built or non-existent farm records were removed (e.g. a 600 MW “Jhimpir” farm in Thailand that does not exist, Norway’s unapproved Hordavind, whole-area totals in China that duplicated the farm-by-farm records), and locations, capacities, years, phases or statuses were fixed; farms sharing a province or country centre as a placeholder are fanned out on the map. Every record, with its reason and source, is in the'));
  cl.appendChild(document.createTextNode(' '));
  cl.appendChild(WW.el('a', { href: 'https://github.com/dofliu/windfarmTaiwan/blob/main/docs/data-cleanup' + (WW.lang === 'en' ? '.en' : '') + '.md', target: '_blank', rel: 'noopener' }, L('資料清理紀錄', 'clean-up log')));
  cl.appendChild(document.createTextNode(L('。', '.')));
  ul.appendChild(cl);
  e.appendChild(ul);
  const n = $('ln-notes'); n.textContent = '';
  const sect = (title, arr) => {
    if (!arr || !arr.length) return;
    n.appendChild(WW.el('h4', { class: 'h3', style: 'font-size:14px;margin:14px 0 6px' }, title));
    const u = WW.el('ul', { class: 'srclist' });
    arr.forEach(s => { const li = WW.el('li'); if (/^https?:/.test(s)) { const m = s.match(/^(\S+)(.*)$/); const a = WW.el('a', { href: m[1], target: '_blank', rel: 'noopener' }, m[1]); li.appendChild(a); if (m[2]) li.appendChild(document.createTextNode(m[2])); } else li.textContent = s; u.appendChild(li); });
    n.appendChild(u);
  };
  sect(L('總容量', 'Totals'), ['Our World in Data — Installed wind energy capacity (IRENA Renewable Capacity Statistics): https://ourworldindata.org/grapher/cumulative-installed-wind-energy-capacity-gigawatts']);
  sect(L('離岸容量', 'Offshore capacity'), D.sources.offshore);
  sect(L('1980–1999 早期資料', 'Early data 1980–1999'), D.sources.early);
  sect(L('風場層級', 'Farm level'), D.sources.farms.concat(['Global Energy Monitor, Global Wind Power Tracker (February 2025 release), CC BY 4.0: https://globalenergymonitor.org/projects/global-wind-power-tracker/']));
  sect(L('註記：離岸', 'Notes: offshore'), D.notes.offshore);
  sect(L('註記：早期', 'Notes: early years'), D.notes.early);
  sect(L('註記：風場', 'Notes: farms'), D.notes.farms);
  sect(L('台灣、日本官方統計稽核', 'Taiwan & Japan official-statistics audit'), (D.sources.audit || []).concat(D.notes.audit || []));
  if (D.pipelineTotals) sect(L('規劃中專案', 'Pipeline projects'), [D.pipelineTotals.source + ', ' + D.pipelineTotals.release + ': ' + D.pipelineTotals.url,
    L('逐案：GEM 2025-02＋2026 年 9 月人工整理的重點專案（更新狀態與預計商轉年；GEM 沒有的才新增）', 'Projects: GEM Feb 2025 plus key projects curated in Sep 2026 (status and expected year updated; projects GEM lacks are added)')]);
  sect(L('底圖與元件', 'Basemap & libraries'), ['Natural Earth 1:50m Admin-0 countries & Gray Earth shaded relief (public domain)', 'NASA Earth Observatory — Blue Marble Next Generation with topography and bathymetry (public domain)', 'Esri World Imagery & World Hillshade tiles (zoomed-in detail; © Esri and data providers)', 'three.js r128 (MIT) · Leaflet 1.9.4 (BSD-2)', 'Wikipedia / Wikimedia Commons (farm photos & summaries looked up live; per-image licences)']);
}

/* ---------- 目錄高亮與章節捲動 ---------- */
let io = null;
function setupToc() {
  if (io || !('IntersectionObserver' in window)) return;
  const links = [...document.querySelectorAll('#toc a')];
  io = new IntersectionObserver(ents => {
    ents.forEach(en => {
      if (!en.isIntersecting) return;
      const ch = en.target.dataset.ch;
      links.forEach(a => a.classList.toggle('is-on', a.dataset.ch === ch));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('.chapter').forEach(s => io.observe(s));
}
function scrollToCh(ch) {
  const el = document.getElementById('ch-' + ch); if (!el) return;
  requestAnimationFrame(() => el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
}
function renderAll() {
  if (!D) return;
  paintFacts(); paintMilestones(); charts(); paintSources(); rendered = true;
}
WW.registerPage('learn', {
  enter(r) {
    setupToc();
    const go = () => { if (!rendered) renderAll(); if (r.sub) scrollToCh(r.sub); };
    if (D) go(); else WW.globalData().then(d => { D = d; go(); }).catch(() => { $('ln-facts').innerHTML = `<div class="note">${L('全球資料載入失敗。', 'Global data could not be loaded.')}</div>`; });
  }
});
WW.onLang(() => { if (rendered) renderAll(); });
})();
