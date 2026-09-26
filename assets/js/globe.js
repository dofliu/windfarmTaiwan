/* 風電風情 · globe.js — 全球風電發展 3D 地球儀 1980–2025（three.js r128）
   改寫自使用者提供的「全球風電發展觀察地圖」(wind-history-map v3)：
   · 資料抽成 data/global/*.json；本檔與 three.js 只在進入「全球發展」頁時才載入，離開頁面即停止繪圖迴圈
   · 風場層改用 InstancedMesh，可同時繪製上萬座風場（GEM 全球風電追蹤 2025-02 ＋ 附件精選風場）
   · 新增：規劃中圖層（興建中／前期開發／已宣布）、國家概況、地貌底圖（地形／衛星／簡潔）與
     放大後的 Esri 圖磚細節、台灣風場連動台電即時出力、全程 MW 單位、深連結（?y=&r=&ms=&f=…）
   · 無 WebGL 時自動退回長條圖排名模式 */
(function () {
'use strict';
const WW = window.WW;
const $ = id => document.getElementById(id);
const host = $('globe');

/* ================= i18n ================= */
const I18N = {
  zh: {
    title: '全球風電發展地圖', vMap: '地圖', vSplit: '地圖＋長條', vBars: '長條排名', mGlobe: '3D 地球', mFlat: '2.5D 平面',
    region: '範圍', base: '底圖', bRelief: '地形', bSat: '衛星', bPlain: '簡潔', pipe: '規劃中', rotate: '自動旋轉', tour: '▶ 導覽', labels: '標籤', sources: '資料來源',
    speed: '速度', layer: '顯示', lBoth: '陸域＋離岸', lOn: '只看陸域', lOff: '只看離岸',
    hint: '拖曳旋轉 · 滾輪縮放（可一路放大到風場） · 點國家或風場直接飛過去 · 空白鍵播放/暫停',
    hintTouch: '單指旋轉 · 雙指縮放 · 點國家或風場直接飛過去',
    barTitle: '累計裝置容量排名（MW）', onshore: '陸域', offshore: '離岸', total: '合計',
    barFoot: '年底累計（MW）· 點長條聚焦該國 · 資料：IRENA / OWID、GWEC、WFO、EWEA、BTM Consult（1980–99 為估算）',
    world: '全世界', worldTotal: '全球累計', countriesWith: '個國家有風電', top15: n => '全球前 ' + n + ' 名', inRegion: n => '區域內前 ' + n + ' 名',
    cont: { Asia: '亞洲', Europe: '歐洲', 'North America': '北美洲', 'South America': '南美洲', Africa: '非洲', Oceania: '大洋洲' },
    turbine: '單機', farm: '風場', rotor: '葉輪直徑', type: { onshore: '陸域', offshore: '離岸', floating: '浮動式' },
    st: ['營運中', '興建中', '前期開發', '已宣布', '已除役'],
    srcTitle: '資料來源與說明', msTitle: '里程碑', farmsTab: '風場', profTab: '概況',
    msFocus: '點里程碑可跳到該年份並把鏡頭飛到現場',
    play: '播放', pause: '暫停', farmLayer: '風場層', farmShown: '已出現', farmNone: '此國家尚無風場層級資料',
    farmSrc: '點風場可拉近並查看照片與連結 · 座標為概略位置 · 風場容量為全場裝置容量，加總可能與國家年底統計不同', farmsLoading: '風場資料載入中…',
    dens: ['關閉', '精簡', '標準', '詳細'],
    totalCap: '容量', units: '部', clickMore: '點擊：拉近並查看照片與連結',
    wikiLoading: '正在查詢維基百科…', wikiNone: '找不到對應的維基百科條目，可用下方連結搜尋。', wikiOffline: '目前無法連線維基百科（離線或網路受限），可用下方連結查詢。',
    lnkWiki: '維基百科', lnkMap: '衛星地圖', lnkPhoto: '搜尋照片', lnkGem: 'GEM 專案頁', photoCredit: '圖片：Wikipedia / Wikimedia Commons',
    whyFirstOff: c => c + '第一座離岸風場', whyFirstOn: c => c + '資料中最早的陸域風場', whyRecOff: c => '併網時為' + c + '規模最大的離岸風場', whyRecOn: c => '併網時為' + c + '規模最大的陸域風場', whyTop: c => c + '規模最大的風場之一',
    tourEnd: '導覽結束', decom: '已除役', yearUnknown: '商轉年份不詳', posStack: '位置示意：與另外 {n} 筆共用同一座標（多為省或國家中心的代用點），地圖上以該點為中心排開，不是實際位置。', posApprox: '座標為概略位置（資料來源標示）。', tipStack: '位置示意（共用代用座標）', expected: '預計', pipeNote: '規劃中專案為 GEM 2025 年 2 月資料，拉到 2025 年才會顯示',
    liveNow: '此刻即時出力', liveLegend: '綠色外圈：有即時資料的風場，葉片轉速依此刻出力', liveSee: '看即時詳情', availability: '可用率', open: '開啟', more: '顯示更多', search: '搜尋風場名稱',
    fAll: '全部', fOp: '營運中', fPipe: '規劃中', sortMw: '依容量', sortYear: '依年份',
    profCap: '年底累計', profRank: '全球排名', profOnOff: '陸域／離岸', profTen: '10 年前', profGrowth: '成長', profShare: '佔全球',
    profFarms: '資料中的風場', profLargest: '最大風場', profEarliest: '最早風場',
    tourCountry: '▶ 導覽這個國家', seeFarms: '風場清單', seeLive: '台灣即時儀表 →', noWebgl: '此裝置無法啟用 3D（WebGL），已切換為長條圖排名。',
    attrPlain: '國界：Natural Earth', credit: '© 2026 勤益科大 劉瑞弘研究室', attrRelief: '地形與國界：Natural Earth', attrSat: '影像：NASA Blue Marble · 國界：Natural Earth',
    attrTileRelief: '山影 © Esri, USGS, NASA 等', attrTileSat: '影像 © Esri, Vantor, Earthstar Geographics',
    worldCap: '年底累計裝置容量',
    pipeTab: '規劃', pipeHead: '規劃中與興建中專案', gemTotals: 'GEM 2026-02 開發管線（各國總量）',
    pipeCaveat: '狀態與時程會變動，座標多為概略位置。逐案資料：GEM 2025-02＋2026 年 9 月整理的清單（台灣第三階段區塊開發、歐洲大型離岸案等）；各國總量：GEM 2026-02。',
    pipeLegendT: '規劃中（虛線環）', pipeInData: (n, mw) => `資料中逐案 ${n} 案 · ${mw}`, pipeSee: '看規劃清單 →',
    coverage: '逐場資料覆蓋率', covMapped: '已逐場標示', covGap: '差額（未逐場標示）', covOver: '風場加總高於國家統計（口徑不同）',
    lnkSrc: '來源', tbd: '時程未定', auditSrc: '官方統計稽核',
    lnkOsm: 'OpenStreetMap', lnkWd: 'Wikidata', lnkGwa: '風能資源地圖', lnkGwaT: 'Global Wind Atlas：這個地點的平均風速等風能資源',
    rankHead: y => `在國內的地位 · ${y} 年底`, rankHeadPipe: '在國內的地位 · 規劃中專案',
    rankOf: (cn, n) => `本站收錄的${cn} ${n} 座運轉中風場`, rankOfPipe: (cn, n) => `本站收錄的${cn} ${n} 個規劃中專案`,
    rankNo: k => `第 ${k} 大`, rankType: (t, k) => `${t}第 ${k} 大`, shareOf: cn => `占${cn}風電總裝置容量`,
    phTitle: '分期（虛線框＝時間軸年份還沒完工）',
    near: '附近風場（30 km 內）', nearNone: '30 km 內沒有其他收錄的風場。',
    sameOwner: '同開發商', ownNote: '依業主名稱比對；各來源寫法不一，可能有遺漏。本國優先，依容量排序。',
    relMore: n => `顯示全部 ${n} 座`, relCap: n => `另有 ${n} 座未列出`,
    copyLink: '複製此風場連結', copyLinkMs: '複製此里程碑連結', copied: '已複製連結 ✓', copyFail: '無法自動複製，請手動複製下方連結',
    report: '回報資料錯誤', reportT: '在 GitHub 開一則 issue（需登入），已預填名稱、座標與連結'
  },
  en: {
    title: 'Global wind power map', vMap: 'Map', vSplit: 'Map + bars', vBars: 'Bar race', mGlobe: '3D globe', mFlat: '2.5D map',
    region: 'Focus', base: 'Basemap', bRelief: 'Relief', bSat: 'Satellite', bPlain: 'Plain', pipe: 'Pipeline', rotate: 'Auto-rotate', tour: '▶ Tour', labels: 'Labels', sources: 'Sources',
    speed: 'Speed', layer: 'Show', lBoth: 'Onshore + offshore', lOn: 'Onshore only', lOff: 'Offshore only',
    hint: 'Drag to rotate · scroll to zoom (down to farms) · click a country or farm to fly there · Space = play/pause',
    hintTouch: 'One finger to rotate · pinch to zoom · tap a country or farm to fly there',
    barTitle: 'Cumulative capacity ranking (MW)', onshore: 'Onshore', offshore: 'Offshore', total: 'Total',
    barFoot: 'Year-end cumulative (MW) · click a bar to focus · Data: IRENA / OWID, GWEC, WFO, EWEA, BTM Consult (1980–99 estimated)',
    world: 'World', worldTotal: 'World total', countriesWith: 'countries with wind power', top15: n => 'World top ' + n, inRegion: n => 'Top ' + n + ' in region',
    cont: { Asia: 'Asia', Europe: 'Europe', 'North America': 'North America', 'South America': 'South America', Africa: 'Africa', Oceania: 'Oceania' },
    turbine: 'Turbine', farm: 'Farm', rotor: 'Rotor Ø', type: { onshore: 'onshore', offshore: 'offshore', floating: 'floating' },
    st: ['operating', 'construction', 'pre-construction', 'announced', 'retired'],
    srcTitle: 'Data sources & notes', msTitle: 'Milestones', farmsTab: 'Farms', profTab: 'Profile',
    msFocus: 'Click a milestone to jump to that year and fly there',
    play: 'Play', pause: 'Pause', farmLayer: 'Farm layer', farmShown: 'shown', farmNone: 'No farm-level data for this country yet',
    farmSrc: 'Click a farm to zoom in and see photo & links · approximate coordinates · farm capacity is full nameplate, so sums can differ from national year-end totals', farmsLoading: 'Loading farm data…',
    dens: ['Off', 'Minimal', 'Standard', 'Detailed'],
    totalCap: 'Capacity', units: 'units', clickMore: 'Click to zoom in and see photo & links',
    wikiLoading: 'Looking up Wikipedia…', wikiNone: 'No matching Wikipedia article found — try the links below.', wikiOffline: 'Wikipedia is unreachable right now (offline or blocked) — try the links below.',
    lnkWiki: 'Wikipedia', lnkMap: 'Satellite map', lnkPhoto: 'Search photos', lnkGem: 'GEM project page', photoCredit: 'Image: Wikipedia / Wikimedia Commons',
    whyFirstOff: c => 'First offshore wind farm in ' + c, whyFirstOn: c => 'Earliest onshore wind farm in the dataset for ' + c, whyRecOff: c => 'Largest offshore wind farm in ' + c + ' when commissioned', whyRecOn: c => 'Largest onshore wind farm in ' + c + ' when commissioned', whyTop: c => 'One of the largest wind farms in ' + c,
    tourEnd: 'Tour finished', decom: 'decommissioned', yearUnknown: 'start year unknown', posStack: 'Schematic position: shares one point with {n} other records (usually a province or country centre used as a placeholder), so they are fanned out around it on the map; this is not the real location.', posApprox: 'Approximate location (as marked by the source).', tipStack: 'Schematic position (shared placeholder point)', expected: 'expected', pipeNote: 'Pipeline projects are GEM data as of Feb 2025 — move to 2025 to see them',
    liveNow: 'Live output now', liveLegend: 'Green ring: farms with live data; rotors spin with their current output', liveSee: 'Live details', availability: 'availability', open: 'Open', more: 'Show more', search: 'Search farms',
    fAll: 'All', fOp: 'Operating', fPipe: 'Pipeline', sortMw: 'By size', sortYear: 'By year',
    profCap: 'Year-end total', profRank: 'World rank', profOnOff: 'Onshore / offshore', profTen: '10 years earlier', profGrowth: 'Growth', profShare: 'Share of world',
    profFarms: 'Farms in the dataset', profLargest: 'Largest farm', profEarliest: 'Earliest farm',
    tourCountry: '▶ Tour this country', seeFarms: 'Farm list', seeLive: 'Taiwan live dashboard →', noWebgl: 'This device cannot run 3D (WebGL); showing the bar race instead.',
    attrPlain: 'Borders: Natural Earth', credit: '© 2026 Dof Lab, NCUT', attrRelief: 'Relief & borders: Natural Earth', attrSat: 'Imagery: NASA Blue Marble · Borders: Natural Earth',
    attrTileRelief: 'Hillshade © Esri, USGS, NASA et al.', attrTileSat: 'Imagery © Esri, Vantor, Earthstar Geographics',
    worldCap: 'Year-end cumulative installed capacity',
    pipeTab: 'Pipeline', pipeHead: 'Projects in the pipeline', gemTotals: 'GEM pipeline, Feb 2026 (country totals)',
    pipeCaveat: 'Status and timing change often; coordinates are mostly approximate. Projects: GEM Feb 2025 + a list curated in Sep 2026 (Taiwan Round 3, large European offshore, etc.); country totals: GEM Feb 2026.',
    pipeLegendT: 'Pipeline (dashed rings)', pipeInData: (n, mw) => `${n} projects in the data · ${mw}`, pipeSee: 'Pipeline list →',
    coverage: 'Farm-level coverage', covMapped: 'Mapped', covGap: 'Gap (not mapped)', covOver: 'Farm sum exceeds the national total (different scope)',
    lnkSrc: 'Source', tbd: 'timing TBD', auditSrc: 'Official statistics audit',
    lnkOsm: 'OpenStreetMap', lnkWd: 'Wikidata', lnkGwa: 'Wind resource map', lnkGwaT: 'Global Wind Atlas: mean wind speed and other wind-resource data at this site',
    rankHead: y => `Within the country · end of ${y}`, rankHeadPipe: 'Within the country · pipeline projects',
    rankOf: (cn, n) => `of ${n} operating farms listed for ${cn}`, rankOfPipe: (cn, n) => `of ${n} pipeline projects listed for ${cn}`,
    rankNo: k => `#${k}`, rankType: (t, k) => `#${k} ${t.toLowerCase()}`, shareOf: cn => `of ${cn}’s total installed wind capacity`,
    phTitle: 'Phases (dashed = not yet built at the timeline year)',
    near: 'Nearby farms (within 30 km)', nearNone: 'No other listed farm within 30 km.',
    sameOwner: 'Same developer', ownNote: 'Matched by owner name; sources spell names differently, so some may be missing. Same country first, then by capacity.',
    relMore: n => `Show all ${n}`, relCap: n => `${n} more not listed`,
    copyLink: 'Copy link to this farm', copyLinkMs: 'Copy link to this milestone', copied: 'Link copied ✓', copyFail: 'Could not copy automatically — copy the link below',
    report: 'Report a data error', reportT: 'Opens a GitHub issue (sign-in needed) pre-filled with the name, coordinates and link'
  }
};
let lang = WW.lang;
const T = k => I18N[lang][k];
const L = (zh, en) => lang === 'en' ? en : zh;

/* ================= markup ================= */
const loadingEl = $('globe-loading');     // 資料載入完成前保留「載入中」遮罩
host.innerHTML = `
<div id="g-top">
  <span class="gtitle" data-gi="title"></span>
  <div class="gseg" id="g-viewSeg" role="group"><button data-view="map" class="active" data-gi="vMap"></button><button data-view="split" data-gi="vSplit"></button><button data-view="bars" data-gi="vBars"></button></div>
  <div class="gseg" id="g-modeSeg" role="group"><button data-mode="globe" class="active" data-gi="mGlobe"></button><button data-mode="flat" data-gi="mFlat"></button></div>
  <div class="ggrp"><label for="g-regionSel" data-gi="region"></label><select id="g-regionSel"></select></div>
  <div class="ggrp"><label for="g-baseSel" data-gi="base"></label><select id="g-baseSel"><option value="relief" data-gi="bRelief"></option><option value="sat" data-gi="bSat"></option><option value="plain" data-gi="bPlain"></option></select></div>
  <button id="g-btnPipe" type="button" aria-pressed="true" data-gi="pipe"></button>
  <span class="gsp"></span>
  <button id="g-btnRotate" type="button" aria-pressed="false" data-gi="rotate"></button>
  <button id="g-btnTour" type="button" data-gi="tour"></button>
  <div class="ggrp"><label for="g-densSel" data-gi="labels"></label><select id="g-densSel"><option value="0"></option><option value="1" selected></option><option value="2"></option><option value="3"></option></select></div>
  <button id="g-btnSources" type="button" data-gi="sources"></button>
</div>
<div id="g-stage" class="mapOnly">
  <div id="g-mapPane">
    <canvas id="g-gl" aria-label="3D globe"></canvas>
    <div id="g-labels"></div>
    <div id="g-yearBig">1980<small></small></div>
    <div id="g-worldStat"></div>
    <div id="g-msPanel">
      <div class="ph"><span class="gseg" role="tablist"><button id="g-tabProf" type="button" data-gi="profTab"></button><button id="g-tabMs" type="button" class="active" data-gi="msTitle"></button><button id="g-tabFarms" type="button" data-gi="farmsTab"></button><button id="g-tabPipe" type="button" data-gi="pipeTab"></button></span><button id="g-msToggle" type="button" aria-label="collapse">–</button></div>
      <div class="gpbody prof" id="g-profBody" hidden></div>
      <div class="gpbody" id="g-msList"></div>
      <div class="gpbody" id="g-farmList" hidden></div>
      <div class="gpbody" id="g-pipeList" hidden></div>
    </div>
    <div id="g-pipeLegend" hidden></div><div id="g-liveLegend" hidden></div><div id="g-hint"></div><div id="g-attr"></div><div id="g-notice" role="status"></div><div id="g-tip"></div>
    <div id="g-infoCard" role="dialog"><button class="gx" type="button" aria-label="close">✕</button><div class="cb"></div>
      <div id="g-tourBar"><button class="tprev" type="button" aria-label="previous">⏮</button><button class="tp" type="button" aria-label="pause">❚❚</button><button class="tnext" type="button" aria-label="next">⏭</button><span class="cnt"></span><div class="prog"><i></i></div><button class="tx" type="button" aria-label="exit">✕</button></div>
    </div>
  </div>
  <div id="g-barPane"><div class="gin">
    <div id="g-barHead"><h2 data-gi="barTitle"></h2><div class="yr" id="g-barYear">1980</div></div>
    <div class="glegend"><span><i class="gsw" style="background:var(--on)"></i><span data-gi="onshore"></span></span><span><i class="gsw" style="background:var(--off)"></i><span data-gi="offshore"></span></span><span id="g-barScope"></span></div>
    <div id="g-bars"><div id="g-axis"></div></div>
    <div id="g-barFoot" data-gi="barFoot"></div>
  </div></div>
</div>
<div id="g-bottom">
  <button id="g-play" type="button">▶</button>
  <div id="g-yearNow">1980</div>
  <input type="range" id="g-slider" min="1980" max="2025" step="0.02" value="1980">
  <div class="ggrp"><label for="g-speedSel" data-gi="speed"></label><select id="g-speedSel"><option value="0.1"></option><option value="0.2"></option><option value="0.333"></option><option value="0.5"></option><option value="1" selected></option><option value="2"></option><option value="4"></option></select></div>
  <div class="ggrp"><label for="g-layerSel" data-gi="layer"></label><select id="g-layerSel"><option value="both" data-gi="lBoth"></option><option value="on" data-gi="lOn"></option><option value="off" data-gi="lOff"></option></select></div>
</div>
<div id="g-modal"><div class="box"><button class="gclose" id="g-modalClose" type="button" aria-label="close">✕</button><div id="g-modalBody"></div></div></div>`;
if (loadingEl) { loadingEl.classList.add('gload'); host.appendChild(loadingEl); }

/* ================= helpers ================= */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const D2R = Math.PI / 180;
const esc = WW.esc;
/* 容量一律以 MW 顯示（千分位），數字更有感 */
const fmtMW = mw => (mw < 10 ? (Math.round(mw * 10) / 10).toLocaleString('en-US') : WW.int(mw)) + ' MW';
const fmtAxis = mw => WW.int(mw);
const cname = c => lang === 'zh' ? c.zh : c.name;
const fname = f => (lang === 'zh' && f.zh) ? f.zh : f.name;
const isTouch = matchMedia('(pointer: coarse)').matches;

let D = null, YEARS, Y0, Y1, C, byIso = {};
const S = { year: 1980, playing: false, speed: 1, mode: 'globe', view: 'map', region: 'WORLD', layer: 'both', rotate: false, density: 1, lastT: 0, modeT: 0,
  pipe: WW.store.get('ww_globe_pipe', '1') === '1', base: WW.store.get('ww_globe_base', 'relief') };
if (!['relief', 'sat', 'plain'].includes(S.base)) S.base = 'relief';
let active = false, running = false, farmsReady = false, firstEnter = true;

function valAt(arr, y) {
  const i = Math.floor(y) - Y0;
  if (i <= 0) return arr[0] * clamp(y - Y0 + 1, 0, 1);
  if (i >= arr.length - 1) return arr[arr.length - 1];
  return arr[i] + (arr[i + 1] - arr[i]) * (y - Math.floor(y));
}
function capOf(c, y) {
  const on = valAt(c.on, y), off = valAt(c.off, y);
  const a = S.layer === 'off' ? 0 : on, b = S.layer === 'on' ? 0 : off;
  return { on: a, off: b, tot: a + b };
}
function inScope(iso, region) {
  region = region || S.region;
  if (region === 'WORLD') return true;
  if (region.startsWith('C:')) return !!byIso[iso] && byIso[iso].cont === region.slice(2);
  return iso === region;
}
const inRegion = c => inScope(c.iso);
function scopeName(region) {
  region = region || S.region;
  if (region === 'WORLD') return L('全球', 'the world');
  if (region.startsWith('C:')) return T('cont')[region.slice(2)];
  return byIso[region] ? cname(byIso[region]) : region;
}
function layerOk(type) { return S.layer === 'both' || (S.layer === 'on' ? type === 'onshore' : type !== 'onshore'); }
const PIPE_HEX = [0, 0xe3eaf5, 0x9fb0c9, 0x6a7c97];                // 興建中 → 前期開發 → 已宣布（有序，越接近完工越亮）
const stCls = f => f.st === 1 ? 'p1' : f.st === 2 ? 'p2' : f.st === 3 ? 'p3' : f.st === 4 ? 'ret' : (f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'floating' : 'off');

/* ================= boot ================= */
let THREEOK = true;
const ready = Promise.all([WW.globalData(), WW.getJSON(WW.DATA.borders)]).then(([G, B]) => {
  D = Object.assign({}, G, { borders: B.borders, ringIso: B.ringIso, farms: [] });
  YEARS = D.years; Y0 = YEARS[0]; Y1 = YEARS[YEARS.length - 1]; C = D.countries;
  C.forEach(c => { byIso[c.iso] = c; });
  S.year = Y0;
  $('g-slider').min = Y0; $('g-slider').max = Y1;
  init();
  WW.getJSON(WW.DATA.farms).then(expandFarms).catch(e => { console.error(e); notice(L('風場資料載入失敗', 'Farm data failed to load')); });
});

const STACK_STEP = 0.045;     // 共用座標排開的間距（度，約 5 km）
const AGG_RE = /\bbase\b|cluster|corridor|aggregate|remainder|placeholder|smaller projects|unnamed/i;   // 整區彙總列的名稱
function expandFarms(J) {
  const TY = ['onshore', 'offshore', 'floating'];
  D.farms = J.rows.map(r => {
    const f = { name: r[0], zh: r[1] || null, iso: r[2], lat: r[3], lon: r[4], mw: r[5], year: r[6], type: TY[r[7]] || 'onshore', st: r[8],
      end: r[9] || null, owner: r[10] || null, turbine: r[11] || null, flags: r[12], src: r[13], ph: r[14] || null, note: r[15] || null, url: r[16] || null };
    if (f.flags & 2) { f.yu = true; f.year = Y1; }
    if (f.st >= 1 && f.st <= 3) f.pipe = true;
    if (f.st === 4 && !f.end) f.end = f.year + 20;
    return f;
  });
  // 共用同一座標的紀錄（flags 4，多為省或國家中心的代用點）：以該點為中心、依容量由內而外排成向日葵狀，每一座才點得到；
  // 原座標留在 lat0／lon0（地圖連結用），卡片註明位置為示意
  const stacks = new Map();
  D.farms.forEach(f => { if (f.flags & 4) { const k = f.iso + '|' + f.lat + '|' + f.lon; if (!stacks.has(k)) stacks.set(k, []); stacks.get(k).push(f); } });
  stacks.forEach(list => {
    list.sort((a, b) => b.mw - a.mw || (a.name < b.name ? -1 : 1));
    const lat0 = list[0].lat, lon0 = list[0].lon, cl = Math.max(0.2, Math.cos(lat0 * Math.PI / 180));
    list.forEach((f, i) => {
      const r = STACK_STEP * Math.sqrt(i + 0.5), a = i * 2.39996;
      f.lat0 = lat0; f.lon0 = lon0; f.nStack = list.length;
      f.lat = lat0 + r * Math.cos(a); f.lon = lon0 + r * Math.sin(a) / cl;
    });
  });
  D.pipelineCuratedAsOf = J.meta && J.meta.pipeline_curated_asof;
  farmsByIso = {};
  D.farms.forEach(f => { (farmsByIso[f.iso] = farmsByIso[f.iso] || []).push(f); });
  farmsReady = true;
  farmLayerDirty = true;
  renderFarmList(true); renderProfile(); renderPipeList(true);
  if (pendingParams) { const p = pendingParams; pendingParams = null; applyParams(p, true); }
  warmOwners();
}
function notice(msg, ms) {
  const n = $('g-notice'); n.textContent = msg; n.style.display = 'block';
  clearTimeout(notice._t); notice._t = setTimeout(() => { n.style.display = 'none'; }, ms || 4200);
}

/* ================= three.js scene (built in init) ================= */
let renderer, scene, camera, vcam, controls, canvas, globe, atmo, plane, bordersG, bordersF, landTex, texCanvas, ambL;
const R = 100, FS = 1.6, KM = 0.015;
const G_MIN_ALT = 0.12, G_MAX_ALT = 520, CL_ALT = 3.2;
const OCEAN = '#0c1830', LAND = '#33486a';
let RINGS, RING_ISO, ringBox, isoRings;
let farmsByIso = {};
let W = 1, H = 1;

function init() {
  canvas = $('g-gl');
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.6 : 2));
  } catch (e) { renderer = null; THREEOK = false; }
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.5, 3000);
  vcam = new THREE.PerspectiveCamera(40, 1, 0.5, 3000);
  vcam.position.set(0, 60, 300);
  controls = new THREE.OrbitControls(vcam, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.5; controls.enablePan = false;
  controls.minDistance = 1; controls.maxDistance = 1e5;
  ambL = new THREE.AmbientLight(0xffffff, 0.55); scene.add(ambL);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(200, 250, 300); scene.add(sun);
  const fillL = new THREE.DirectionalLight(0x88aaff, 0.35); fillL.position.set(-200, -50, -100); scene.add(fillL);
  buildBase();
  buildBordersAll();
  buildSymbols();
  wireUI();
  applyI18n();
  setBase(S.base, true);
  if (!renderer) {
    S.view = 'bars'; setView('bars');
    document.querySelectorAll('#g-viewSeg button, #g-modeSeg button').forEach(b => { if (b.dataset.view !== 'bars') b.disabled = true; });
    notice(T('noWebgl'), 8000);
  }
  layoutAnchors();
  flyToRegion(true);
  syncYearUI(); updateBars(true);
  new ResizeObserver(() => resize()).observe($('g-mapPane'));
  resize();
}

/* ---------------- base texture & geometry ---------------- */
let TEXW = 4096, TEXH = 2048;
function buildBase() {
  const small = Math.min(screen.width, screen.height) < 820 || (navigator.deviceMemory && navigator.deviceMemory < 4) || (renderer && renderer.capabilities.maxTextureSize < 4096);
  if (small) { TEXW = 2048; TEXH = 1024; }
  texCanvas = document.createElement('canvas'); texCanvas.width = TEXW; texCanvas.height = TEXH;
  landTex = new THREE.CanvasTexture(texCanvas); landTex.anisotropy = 4;
  RINGS = D.borders; RING_ISO = D.ringIso;
  ringBox = RINGS.map(r => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (let i = 0; i < r.length; i += 2) { const x = r[i], y = r[i + 1]; if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; } return [a, b, c, d]; });
  isoRings = {}; RING_ISO.forEach((iso, i) => { if (iso) (isoRings[iso] = isoRings[iso] || []).push(i); });
  drawBaseTexture();
  globe = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 100), new THREE.MeshPhongMaterial({ map: landTex, shininess: 8, specular: 0x223344 })); scene.add(globe);
  atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 64, 48), new THREE.MeshBasicMaterial({ color: 0x3b8fe0, transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false })); scene.add(atmo);
  plane = new THREE.Mesh(new THREE.PlaneGeometry(360 * FS, 180 * FS), new THREE.MeshPhongMaterial({ map: landTex, shininess: 6, specular: 0x223344 }));
  plane.rotation.x = -Math.PI / 2; plane.visible = false; scene.add(plane);
}
function drawBaseTexture() {   // 向量繪製的陸地遮罩（「簡潔」底圖）
  const g = texCanvas.getContext('2d'), TW = TEXW, TH = TEXH;
  g.fillStyle = OCEAN; g.fillRect(0, 0, TW, TH);
  g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 1;
  for (let i = 0; i <= 12; i++) { g.beginPath(); g.moveTo(i * TW / 12, 0); g.lineTo(i * TW / 12, TH); g.stroke(); }
  for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(0, i * TH / 6); g.lineTo(TW, i * TH / 6); g.stroke(); }
  g.fillStyle = LAND;
  RINGS.forEach(r => { g.beginPath(); for (let i = 0; i < r.length; i += 2) { const x = (r[i] + 180) / 360 * TW, y = (90 - r[i + 1]) / 180 * TH; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.closePath(); g.fill(); });
  landTex.needsUpdate = true;
}
/* 底圖：地形（Natural Earth 陰影地形上色）／衛星（NASA Blue Marble）／簡潔（向量） */
const BASE_URL = { relief: 'assets/img/globe/relief_', sat: 'assets/img/globe/sat_' };
const baseTex = {}, baseImg = {};
function setBase(b, silent) {
  S.base = b; WW.store.set('ww_globe_base', b); $('g-baseSel').value = b;
  const apply = tex => { globe.material.map = tex; plane.material.map = tex; globe.material.needsUpdate = true; plane.material.needsUpdate = true; patchInfo = null; updateAttr(); };
  if (b === 'plain') { apply(landTex); return; }
  if (baseTex[b]) { apply(baseTex[b]); return; }
  const img = new Image(); img.decoding = 'async';
  img.onload = () => { const t = new THREE.Texture(img); t.anisotropy = 4; t.needsUpdate = true; baseTex[b] = t; baseImg[b] = img; if (S.base === b) apply(t); };
  img.onerror = () => { if (!silent) notice(L('底圖載入失敗，改用簡潔底圖', 'Basemap failed to load; using plain')); if (S.base === b) apply(landTex); };
  let src = BASE_URL[b] + (TEXW >= 4096 ? '4k' : '2k') + '.jpg';
  if (WW.standalone && !WW.standalone.url(src)) src = BASE_URL[b] + '2k.jpg';   // 單檔版只內嵌 2k 底圖
  img.src = WW.asset(src);
  apply(landTex);   // 載入前先用向量底圖
}
function updateAttr() {
  const tiles = patch && patch.visible && S.base !== 'plain' && tileAttrOn;
  const parts = [T('credit'), S.base === 'relief' ? T('attrRelief') : S.base === 'sat' ? T('attrSat') : T('attrPlain')];
  if (tiles) parts.push(S.base === 'sat' ? T('attrTileSat') : T('attrTileRelief'));
  $('g-attr').textContent = parts.join(' · ');
}

/* ---------------- coordinates ---------------- */
function globePos(lon, lat, h, out) {
  const phi = (lon + 180) * D2R, th = (90 - lat) * D2R, r = R + (h || 0);
  out = out || new THREE.Vector3();
  return out.set(-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th));
}
function flatPos(lon, lat, h, out) { out = out || new THREE.Vector3(); return out.set(lon * FS, h || 0, -lat * FS); }
function posAt(lon, lat, h, out) {
  out = out || new THREE.Vector3();
  if (S.modeT <= 0) return globePos(lon, lat, h, out);
  if (S.modeT >= 1) return flatPos(lon, lat, h, out);
  return out.copy(globePos(lon, lat, h)).lerp(flatPos(lon, lat, h), S.modeT);
}
const UP = new THREE.Vector3(0, 1, 0);
const _qg = new THREE.Quaternion(), _qid = new THREE.Quaternion(), _gp = new THREE.Vector3();
function quatAt(lon, lat, out) {
  out = out || new THREE.Quaternion();
  _qg.setFromUnitVectors(UP, globePos(lon, lat, 0, _gp).normalize());
  if (S.modeT <= 0) return out.copy(_qg);
  if (S.modeT >= 1) return out.identity();
  return out.copy(_qg).slerp(_qid, S.modeT);
}
function xyzToLonLat(p) {
  if (S.mode === 'flat') return { lon: p.x / FS, lat: -p.z / FS };
  const r = p.length(); const lat = Math.asin(clamp(p.y / r, -1, 1)) / D2R;
  let lon = Math.atan2(p.z, -p.x) / D2R - 180; if (lon < -180) lon += 360; if (lon > 180) lon -= 360;
  return { lon, lat };
}
function curAlt() { return S.mode === 'globe' ? vcam.position.length() - R : vcam.position.distanceTo(controls.target); }
function focusLonLat() { return S.mode === 'globe' ? xyzToLonLat(vcam.position) : xyzToLonLat(controls.target); }

/* ---------------- borders & country highlight ---------------- */
function buildBorders(flat) {
  const pts = [], a = new THREE.Vector3(), b = new THREE.Vector3();
  RINGS.forEach(r => { for (let i = 0; i < r.length - 2; i += 2) {
    if (flat) { flatPos(r[i], r[i + 1], 0, a); flatPos(r[i + 2], r[i + 3], 0, b); } else { globePos(r[i], r[i + 1], 0, a); globePos(r[i + 2], r[i + 3], 0, b); }
    pts.push(a.x, a.y, a.z, b.x, b.y, b.z); } });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9db0cf, transparent: true, opacity: 0.4 }));
}
function buildBordersAll() {
  bordersG = buildBorders(false); bordersF = buildBorders(true);
  bordersF.visible = false; scene.add(bordersG, bordersF);
}
let hiLines = null, hiIso = null;
function setHighlight(iso) {
  hiIso = iso;
  if (hiLines) { scene.remove(hiLines); hiLines.geometry.dispose(); hiLines = null; }
  const idx = isoRings[iso]; if (!idx) return;
  const pts = [], a = new THREE.Vector3(), b = new THREE.Vector3();
  idx.forEach(k => { const r = RINGS[k]; for (let i = 0; i < r.length - 2; i += 2) { posAt(r[i], r[i + 1], 0, a); posAt(r[i + 2], r[i + 3], 0, b); pts.push(a.x, a.y, a.z, b.x, b.y, b.z); } });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  hiLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xf0c86a, transparent: true, opacity: 0.9 }));
  scene.add(hiLines);
}
function countryAt(lon, lat) {
  for (const iso in isoRings) {
    for (const k of isoRings[iso]) {
      const bx = ringBox[k]; if (lon < bx[0] || lon > bx[2] || lat < bx[1] || lat > bx[3]) continue;
      const r = RINGS[k]; let inside = false;
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
        if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
      }
      if (inside) return iso;
    }
  }
  return null;
}

/* ================= high-resolution detail patch (sharp coasts; Esri tiles when zoomed in) ================= */
const PW = 2048, PH = 2048;
let patchCanvas, patchTex, patchMat, patch = null, patchInfo = null, lastPatchT = 0, tileAttrOn = false;
const tileCache = new Map();          // key -> {img, ok}
let patchDirty = false;
function tileURL(z, x, y) {
  return S.base === 'sat'
    ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
    : `https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${z}/${y}/${x}`;
}
const tileLat = (y, z) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / Math.pow(2, z)))) / D2R;
function getTile(z, x, y, cb) {
  const key = S.base + '/' + z + '/' + x + '/' + y;
  let t = tileCache.get(key);
  if (t) { if (t.ok) return t.img; if (!t.failed) t.cbs.push(cb); return null; }
  const img = new Image(); img.crossOrigin = 'anonymous';
  t = { img, ok: false, failed: false, cbs: [cb] }; tileCache.set(key, t);
  img.onload = () => { t.ok = true; t.cbs.forEach(f => f(key)); t.cbs = []; };
  img.onerror = () => { t.failed = true; t.cbs = []; };
  img.src = tileURL(z, x, y);
  if (tileCache.size > 400) { const k0 = tileCache.keys().next().value; tileCache.delete(k0); }
  return null;
}
function drawTileInto(g, img, z, x, y, P) {
  // Web Mercator 圖磚 → 等距圓柱 patch：垂直分 8 條分別換算緯度，誤差可忽略
  const n = Math.pow(2, z), lonW = x / n * 360 - 180, lonE = (x + 1) / n * 360 - 180;
  const px0 = (lonW - P.lon0) * P.sx, pw = (lonE - lonW) * P.sx;
  const strips = 8;
  for (let s = 0; s < strips; s++) {
    const yt = y + s / strips, yb = y + (s + 1) / strips;
    const latT = tileLat(yt, z), latB = tileLat(yb, z);
    const py0 = (P.lat1 - latT) * P.sy, ph = (latT - latB) * P.sy;
    if (py0 > PH || py0 + ph < 0) continue;
    g.drawImage(img, 0, s * 256 / strips, 256, 256 / strips, px0, py0, pw, ph + 0.6);
  }
}
function drawPatch(lon0, lat0, lonSpan, latSpan) {
  const g = patchCanvas.getContext('2d');
  const lat1 = lat0 + latSpan, lon1 = lon0 + lonSpan;
  const P = { lon0, lat1, sx: PW / lonSpan, sy: PH / latSpan };
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const img = S.base !== 'plain' && baseImg[S.base];
  if (img) {
    // 先畫底圖貼圖的對應區塊（立即可見），跨越換日線時分兩段
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const sy0 = (90 - lat1) / 180 * ih, sh = latSpan / 180 * ih;
    const seg = (a, b, dx) => { const sx0 = (a + 180) / 360 * iw, sw = (b - a) / 360 * iw; g.drawImage(img, sx0, sy0, sw, sh, dx, 0, (b - a) * P.sx, PH); };
    if (lon0 < -180) { seg(lon0 + 360, 180, 0); seg(-180, lon1, (-180 - lon0) * P.sx); }
    else if (lon1 > 180) { seg(lon0, 180, 0); seg(-180, lon1 - 360, (180 - lon0) * P.sx); }
    else seg(lon0, lon1, 0);
  } else {
    g.fillStyle = OCEAN; g.fillRect(0, 0, PW, PH);
    g.fillStyle = LAND;
    for (let k = 0; k < RINGS.length; k++) {
      const bx = ringBox[k]; if (bx[2] < lon0 || bx[0] > lon1 || bx[3] < lat0 || bx[1] > lat1) continue;
      const r = RINGS[k]; g.beginPath();
      for (let i = 0; i < r.length; i += 2) { const x = (r[i] - lon0) * P.sx, y = (lat1 - r[i + 1]) * P.sy; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.closePath(); g.fill();
    }
  }
  patchTex.needsUpdate = true;
  tileAttrOn = false;
  if (S.base === 'plain' || latSpan > 30) { updateAttr(); return; }
  // 圖磚：地形＝World_Hillshade 以色彩增值疊在深色地形上（海面不變）；衛星＝World_Imagery 再略為壓暗
  let z = Math.floor(Math.log2(PW / lonSpan * 360 / 256)) - (isTouch ? 1 : 0);
  z = clamp(z, 3, S.base === 'sat' ? 17 : 15);
  const n = Math.pow(2, z);
  const merc = lat => (1 - Math.log(Math.tan(clamp(lat, -85, 85) * D2R) + 1 / Math.cos(clamp(lat, -85, 85) * D2R)) / Math.PI) / 2 * n;
  const x0 = Math.floor((lon0 + 180) / 360 * n), x1 = Math.floor((lon1 + 180) / 360 * n);
  const y0 = Math.floor(merc(lat1)), y1 = Math.floor(merc(lat0));
  if ((x1 - x0 + 1) * (y1 - y0 + 1) > 100) { updateAttr(); return; }     // 2048 px 的 patch 最多約 9×9 張 256 px 圖磚
  const myInfo = patchInfo;
  let any = false;
  for (let x = x0; x <= x1; x++) for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++) {
    const xw = ((x % n) + n) % n;
    const im = getTile(z, xw, y, () => { if (patchInfo !== myInfo) return; drawOneWrapped(x, y); });
    if (im) { drawOneWrapped(x, y, im); any = true; }
  }
  function drawOneWrapped(x, y, imArg) {
    const xw = ((x % n) + n) % n; const t = tileCache.get(S.base + '/' + z + '/' + xw + '/' + y); const im = imArg || (t && t.img);
    if (!im) return;
    g.save();
    if (S.base === 'sat') { drawTileInto(g, im, z, x, y, P); g.globalAlpha = 0.08; g.fillStyle = '#000'; const lonW = x / n * 360 - 180; g.fillRect((lonW - lon0) * P.sx, 0, 360 / n * P.sx, PH); }
    else { g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.9; drawTileInto(g, im, z, x, y, P); }
    g.restore();
    patchDirty = true;
    if (!tileAttrOn) { tileAttrOn = true; updateAttr(); }
  }
  if (any) patchDirty = true;
  updateAttr();
}
function updatePatch(now) {
  if (!patchCanvas) {
    patchCanvas = document.createElement('canvas'); patchCanvas.width = PW; patchCanvas.height = PH;
    patchTex = new THREE.CanvasTexture(patchCanvas); patchTex.anisotropy = 4;
    patchMat = new THREE.MeshPhongMaterial({ map: patchTex, shininess: 8, specular: 0x223344 });
  }
  if (patchDirty) { patchTex.needsUpdate = true; patchDirty = false; }
  if (modeAnim) { if (patch) patch.visible = false; return; }
  const alt = curAlt(); const limit = S.base === 'plain' ? (S.mode === 'globe' ? 150 : 200) : (S.mode === 'globe' ? 60 : 90);
  if (alt > limit) { if (patch && patch.visible) { patch.visible = false; updateAttr(); } patchInfo = null; return; }
  if (now - lastPatchT < 300 && patchInfo) { if (patch) patch.visible = true; return; }
  const fc = focusLonLat();
  const latSpan = clamp(alt * 0.6 * 6.5, 0.8, 80);
  const lonSpan = Math.min(170, latSpan / Math.max(0.25, Math.cos(fc.lat * D2R)));
  if (patchInfo && patchInfo.mode === S.mode && patchInfo.base === S.base && Math.abs(fc.lat - patchInfo.clat) < patchInfo.latSpan * 0.18 && Math.abs(fc.lon - patchInfo.clon) < patchInfo.lonSpan * 0.18
     && latSpan / patchInfo.latSpan > 0.62 && latSpan / patchInfo.latSpan < 1.5) { if (patch) patch.visible = true; return; }
  lastPatchT = now;
  const lat0 = clamp(fc.lat - latSpan / 2, -89.5, 89.5 - latSpan), lon0 = fc.lon - lonSpan / 2;
  patchInfo = { mode: S.mode, base: S.base, clat: fc.lat, clon: fc.lon, latSpan, lonSpan };
  drawPatch(lon0, lat0, lonSpan, latSpan);
  let geo;
  if (S.mode === 'globe') geo = new THREE.SphereGeometry(R, 72, 72, (lon0 + 180) * D2R, lonSpan * D2R, (90 - (lat0 + latSpan)) * D2R, latSpan * D2R);
  else { geo = new THREE.PlaneGeometry(lonSpan * FS, latSpan * FS); geo.rotateX(-Math.PI / 2); geo.translate((lon0 + lonSpan / 2) * FS, 0, -(lat0 + latSpan / 2) * FS); }
  if (!patch) { patch = new THREE.Mesh(geo, patchMat); scene.add(patch); }
  else { patch.geometry.dispose(); patch.geometry = geo; }
  patch.visible = true;
  updateAttr();
}

/* ================= symbols: turbines, milestones, farm layer, clusters ================= */
let towerGeo, nacGeo, hubGeo, bladeGeo, ringGeo, discGeo, rotorGeo, dashRingGeo, thinRingGeo, thinDashGeo;
const COL = { on: 0xB8892F, onB: 0xe3b458, off: 0x3B8FE0, offB: 0x6fb3ff, fl: 0x1f9e8a, flB: 0x9be8d8 };
let surfaceRoot, countryRoot, msRoot, clusterRoot;
const cGroups = [];
let msMarkers = [];
let countryPicks = [];
function mergeGeos(parts) {
  const pos = [], nor = [];
  parts.forEach(([geo, m]) => { const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(m); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); });
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return out;
}
function makeTurbine(kind) {
  const col = kind === 'on' ? COL.on : COL.off, colB = kind === 'on' ? COL.onB : COL.offB;
  const mTower = new THREE.MeshPhongMaterial({ color: 0xdfe6f0, transparent: true });
  const mBlade = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: colB, emissiveIntensity: 0.25, transparent: true });
  const mNac = new THREE.MeshPhongMaterial({ color: col, transparent: true });
  const g = new THREE.Group();
  const tower = new THREE.Mesh(towerGeo, mTower), nac = new THREE.Mesh(nacGeo, mNac);
  const rotor = new THREE.Mesh(rotorGeo, mBlade); rotor.position.set(0, 1.0, 0.12);
  g.add(tower, nac, rotor);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, depthWrite: false }));
  const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, depthWrite: false }));
  g.add(ring, disc);
  g.userData = { kind, tower, nac, rotor, ring, disc, mats: [mTower, mBlade, mNac, ring.material, disc.material], h: 0, r: 0 };
  return g;
}
const heightOf = mw => mw <= 0 ? 0 : Math.max(1.2, 0.16 * Math.pow(mw, 0.40));
const radiusOf = mw => mw <= 0 ? 0 : Math.max(0.6, 0.02 * Math.sqrt(mw));
function buildSymbols() {
  towerGeo = new THREE.CylinderGeometry(0.035, 0.06, 1, 10); towerGeo.translate(0, 0.5, 0);
  nacGeo = new THREE.BoxGeometry(0.10, 0.09, 0.18); nacGeo.translate(0, 1.0, 0.02);
  hubGeo = new THREE.SphereGeometry(0.045, 10, 8);
  bladeGeo = new THREE.BoxGeometry(0.035, 0.52, 0.012); bladeGeo.translate(0, 0.28, 0);
  ringGeo = new THREE.RingGeometry(0.75, 1, 48); ringGeo.rotateX(-Math.PI / 2);
  thinRingGeo = new THREE.RingGeometry(0.95, 1, 72); thinRingGeo.rotateX(-Math.PI / 2);
  discGeo = new THREE.CircleGeometry(0.75, 48); discGeo.rotateX(-Math.PI / 2);
  rotorGeo = mergeGeos([[hubGeo, new THREE.Matrix4()], ...[0, 1, 2].map(i => [bladeGeo, new THREE.Matrix4().makeRotationZ(i * Math.PI * 2 / 3)])]);
  // 規劃中專案：虛線環（尚未蓋好，不畫風機）
  dashRingGeo = mergeGeos([...Array(14)].map((_, i) => [new THREE.RingGeometry(0.8, 1, 5, 1, i * Math.PI / 7, Math.PI / 7 * 0.58), new THREE.Matrix4()])); dashRingGeo.rotateX(-Math.PI / 2);
  surfaceRoot = new THREE.Group(); scene.add(surfaceRoot);
  countryRoot = new THREE.Group(); surfaceRoot.add(countryRoot);
  C.forEach(c => {
    const anchor = new THREE.Group(); const tOn = makeTurbine('on'), tOff = makeTurbine('off');
    anchor.add(tOn, tOff); anchor.userData = { c, tOn, tOff, dim: 1 };
    countryRoot.add(anchor); cGroups.push(anchor);
    [tOn, tOff].forEach(t => [t.userData.tower, t.userData.nac, t.userData.disc].forEach(m => { m.userData.anchor = anchor; }));
  });
  countryPicks = []; cGroups.forEach(a => { [a.userData.tOn, a.userData.tOff].forEach(t => countryPicks.push(t.userData.tower, t.userData.nac, t.userData.disc)); });
  msRoot = new THREE.Group(); surfaceRoot.add(msRoot);
  const pinGeo = new THREE.ConeGeometry(0.5, 2.2, 8), haloGeo = new THREE.RingGeometry(0.8, 1.1, 32);
  msMarkers = D.milestones.map(m => {
    const g = new THREE.Group();
    const pin = new THREE.Mesh(pinGeo, new THREE.MeshPhongMaterial({ color: 0xf0c86a, emissive: 0xf0c86a, emissiveIntensity: 0.5 }));
    pin.rotation.x = Math.PI; pin.position.y = 1.4;
    const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: 0xf0c86a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.15;
    g.add(pin, halo); g.visible = false; g.userData = { m, pin, halo };
    pin.userData.ms = m; msRoot.add(g); return g;
  });
  buildFarmLayer();
  clusterRoot = new THREE.Group(); surfaceRoot.add(clusterRoot);
  clusterMats = {
    on: { disc: new THREE.MeshBasicMaterial({ color: COL.on, transparent: true, opacity: 0.16, depthWrite: false }), ring: new THREE.MeshBasicMaterial({ color: COL.on, transparent: true, opacity: 0.55, depthWrite: false }), tower: new THREE.MeshPhongMaterial({ color: 0xe6ebf2 }), nac: new THREE.MeshPhongMaterial({ color: COL.on }), blade: new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: COL.onB, emissiveIntensity: 0.18 }) },
    off: { disc: new THREE.MeshBasicMaterial({ color: COL.off, transparent: true, opacity: 0.16, depthWrite: false }), ring: new THREE.MeshBasicMaterial({ color: COL.off, transparent: true, opacity: 0.6, depthWrite: false }), tower: new THREE.MeshPhongMaterial({ color: 0xe6ebf2 }), nac: new THREE.MeshPhongMaterial({ color: COL.off }), blade: new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: COL.offB, emissiveIntensity: 0.18 }) }
  };
  // 規劃中專案拉近時畫成半透明「預定配置」：風機不轉，外圈為依狀態上色的虛線
  const ghost = () => new THREE.MeshPhongMaterial({ color: 0xdfe6f0, transparent: true, opacity: 0.38, depthWrite: false });
  [1, 2, 3].forEach(st => {
    clusterMats['p' + st] = { disc: new THREE.MeshBasicMaterial({ color: PIPE_HEX[st], transparent: true, opacity: 0.06, depthWrite: false }),
      ring: new THREE.MeshBasicMaterial({ color: PIPE_HEX[st], transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
      tower: ghost(), nac: ghost(), blade: ghost() };
  });
  clusterMats.liveRing = new THREE.MeshBasicMaterial({ color: LIVE_HEX, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
  thinDashGeo = mergeGeos([...Array(36)].map((_, i) => [new THREE.RingGeometry(0.96, 1, 3, 1, i * Math.PI / 18, Math.PI / 18 * 0.55), new THREE.Matrix4()])); thinDashGeo.rotateX(-Math.PI / 2);
}

/* ---------------- farm layer: InstancedMesh（營運中一組、規劃中一組） ---------------- */
const FARM_MAX = 6000, ROTOR_ANIM = 700;
const FL = { op: null, pp: null };
let farmLayerDirty = true, lastFarmBuild = 0, farmBuildKey = '';
let farmK = 1, farmRefAlt = 20;
const fHeight = mw => Math.max(0.16, 0.075 * Math.pow(mw, 0.35));
const fRadius = mw => Math.max(0.09, 0.013 * Math.sqrt(mw));
function makeInst(isPipe) {
  const mk = (geo, mat) => { const m = new THREE.InstancedMesh(geo, mat, FARM_MAX); m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return m; };
  const tower = isPipe ? null : mk(towerGeo, new THREE.MeshPhongMaterial({ color: 0xdfe6f0 }));
  const nac = isPipe ? null : mk(nacGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
  const rotor = isPipe ? null : mk(rotorGeo, new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x333333, emissiveIntensity: 0.4 }));
  const ring = mk(isPipe ? dashRingGeo : ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: isPipe ? 0.9 : 0.55, depthWrite: false, side: THREE.DoubleSide }));
  const disc = mk(discGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: isPipe ? 0.06 : 0.16, depthWrite: false }));
  const meshes = [tower, nac, rotor, ring, disc].filter(Boolean);
  // 先建立完整大小的逐實例顏色緩衝：three.js 在第一次繪製時決定著色器是否支援逐實例顏色（之後才加的會被忽略），
  // 而 setColorAt 會依當下的 count（此時為 0）配置緩衝，所以要自己配置 FARM_MAX 筆
  [nac, ring, disc].filter(Boolean).forEach(m => { m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(FARM_MAX * 3).fill(1), 3); m.instanceColor.setUsage(THREE.DynamicDrawUsage); });
  const grp = new THREE.Group(); grp.add(...meshes);
  return { grp, tower, nac, rotor, ring, disc, meshes, list: [], h: new Float32Array(FARM_MAX), r: new Float32Array(FARM_MAX), pos: [], quat: [], phase: new Float32Array(FARM_MAX), ang: 0, isPipe,
    spin: new Float32Array(FARM_MAX).fill(1), angF: new Float32Array(FARM_MAX) };
}
function buildFarmLayer() {
  FL.op = makeInst(false); FL.pp = makeInst(true);
  surfaceRoot.add(FL.op.grp, FL.pp.grp);
}
const _col = new THREE.Color();
function farmColor(f) {
  if (f.pipe) return PIPE_HEX[f.st];
  return f.type === 'onshore' ? COL.on : f.type === 'floating' ? COL.fl : COL.off;
}
/* 時間軸上的 Y.0 代表「Y 年底」：風場在商轉那一年的最後 BUILD 年內逐步蓋好，年底完工（與國家年底累計一致） */
const BUILD = 0.6;
const fAge = (f, y) => (y == null ? S.year : y) - f.year + BUILD;
function farmMwAt(f, y) {
  if (!f.ph) return f.mw;
  let s = 0; for (const p of f.ph) { if (!p[0] || p[0] - BUILD <= y) s += p[1]; }
  return s || f.ph[0][1];
}
function farmActive(f, y) {
  if (f.pipe) return S.pipe && y >= Y1 - 0.02;
  return fAge(f, y) >= 0 && !(f.end && y >= f.end);
}
/* 選出要畫的風場：選定國家的全部風場＋放大時視野內的風場（上限 FARM_MAX，依容量） */
function pickFarms() {
  if (!farmsReady) return [];
  const want = new Map();
  const iso = byIso[S.region] ? S.region : null;
  if (iso && farmsByIso[iso]) farmsByIso[iso].forEach(f => want.set(f, 1));
  const alt = curAlt();
  // 選了國家時只畫該國風場，拉得很近（跨境）才加入鄰國；全球／洲別視角放大即顯示視野內風場
  const zoomAlt = iso ? (S.mode === 'globe' ? 12 : 20) : (S.mode === 'globe' ? 45 : 70);
  if (alt < zoomAlt && !modeAnim) {
    const fc = focusLonLat(), cosl = Math.max(0.2, Math.cos(fc.lat * D2R));
    const rad = clamp(alt * (S.mode === 'globe' ? 0.9 : 0.55), 1.5, 40);
    for (const f of D.farms) {
      const dl = f.lat - fc.lat, dn = (f.lon - fc.lon) * cosl;
      if (dl * dl + dn * dn < rad * rad) want.set(f, 1);
    }
  }
  let arr = [...want.keys()];
  arr.sort((a, b) => b.mw - a.mw);
  if (arr.length > FARM_MAX * 2) arr = arr.slice(0, FARM_MAX * 2);
  return arr;
}
function rebuildFarmInstances(now, force) {
  if (!force && now - lastFarmBuild < 450) return;
  lastFarmBuild = now;
  const fc = focusLonLat(), alt = curAlt();
  const key = [S.region, S.mode, S.pipe, S.layer, farmsReady, liveOn(), (fc.lat / Math.max(1, alt * 0.3)).toFixed(0), (fc.lon / Math.max(1, alt * 0.3)).toFixed(0), Math.round(Math.log2(Math.max(0.1, alt)) * 2)].join('|');
  if (!force && !farmLayerDirty && key === farmBuildKey) return;
  farmBuildKey = key; farmLayerDirty = false;
  const list = pickFarms();
  const byKind = { op: [], pp: [] };
  liveSeen = false;
  for (const f of list) {
    if (f.pipe) { if (S.pipe && byKind.pp.length < FARM_MAX) byKind.pp.push(f); }
    else if (byKind.op.length < FARM_MAX) byKind.op.push(f);
  }
  ['op', 'pp'].forEach(k => {
    const L2 = FL[k], nl = byKind[k], old = new Map(L2.list.map((f, i) => [f, i]));
    const h = new Float32Array(FARM_MAX), r = new Float32Array(FARM_MAX), angF = new Float32Array(FARM_MAX), spin = new Float32Array(FARM_MAX);
    nl.forEach((f, i) => { const j = old.get(f); if (j != null) { h[i] = L2.h[j]; r[i] = L2.r[j]; angF[i] = L2.angF[j]; } });
    L2.h = h; L2.r = r; L2.angF = angF; L2.spin = spin; L2.list = nl;
    const colored = [L2.nac, L2.ring, L2.disc].filter(Boolean);
    nl.forEach((f, i) => {
      _col.setHex(farmColor(f)); colored.forEach(m => m.setColorAt(i, _col)); L2.phase[i] = (i * 2.399) % 6.283;
      const lv = liveOn() && liveFor(f);
      spin[i] = lv ? spinOf(lv) : 1;
      if (lv) { _col.setHex(LIVE_HEX); L2.ring.setColorAt(i, _col); liveSeen = true; }   // 有即時資料：外圈改為即時綠
    });
    colored.forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    L2.meshes.forEach(m => { m.count = nl.length; });
    layoutFarmKind(L2);
    L2._force = true;          // 每個 slot 都重寫矩陣，避免沿用上一座風場的矩陣（殘影）
  });
  const iso = byIso[S.region] ? S.region : null;
  if (iso) { const rc = regionCenter(); farmK = clamp(rc.span / 25, 0.8, 1.8); farmRefAlt = regionAlt(rc); }
  else { farmK = 1; farmRefAlt = 20; }
}
function layoutFarmKind(L2) {
  L2.pos = L2.list.map(f => posAt(f.lon, f.lat, 0));
  L2.quat = L2.list.map(f => quatAt(f.lon, f.lat));
}
function layoutFarms() { if (FL.op) { layoutFarmKind(FL.op); layoutFarmKind(FL.pp); } }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3(), _p3 = new THREE.Vector3(), _zAxis = new THREE.Vector3(0, 0, 1), _off = new THREE.Vector3();
const _m4b = new THREE.Matrix4(), _m4c = new THREE.Matrix4();
function animateFarmKind(L2, dt, farmScale, deep, now) {
  const n = L2.list.length; if (!n) return;
  L2.ang += dt * 3;
  let dirty = false;
  const k = Math.min(1, dt * 4);
  for (let i = 0; i < n; i++) {
    const f = L2.list[i];
    const act = farmActive(f, S.year) && layerOk(f.type) && !clusters.has(f) && !deep;
    const mw = act ? farmMwAt(f, S.year) : 0;
    const hT = act ? fHeight(mw) * farmScale : 0, rT = act ? fRadius(mw) * farmScale : 0;
    const h0 = L2.h[i], r0 = L2.r[i];
    const h = Math.abs(hT - h0) < 1e-5 ? hT : h0 + (hT - h0) * k, r = Math.abs(rT - r0) < 1e-5 ? rT : r0 + (rT - r0) * k;
    const grow = h !== h0 || r !== r0 || L2._force;
    L2.h[i] = h; L2.r[i] = r;
    const q = L2.quat[i], p = L2.pos[i];
    if (grow) {
      const hs = h > 0.0003 ? h : 0;
      if (L2.tower) { _s.set(hs, hs, hs); _m4.compose(p, q, _s); L2.tower.setMatrixAt(i, _m4); L2.nac.setMatrixAt(i, _m4); }
      const age = fAge(f), pulse = (!f.pipe && !f.yu && age >= 0 && age < 1.5) ? 1 + (1.5 - age) * 0.4 : 1;
      const rs = h > 0.0003 ? r : 0;
      _s.set(rs * pulse, 1, rs * pulse); _m4.compose(p, q, _s); L2.ring.setMatrixAt(i, _m4);
      _s.set(rs, 1, rs); _m4.compose(p, q, _s); L2.disc.setMatrixAt(i, _m4);
      dirty = true;
    }
    if (L2.rotor && (i < ROTOR_ANIM || grow)) {
      const hs = h > 0.0003 ? h : 0;
      // rotor：位置在塔頂前方，繞本地 Z 軸旋轉
      _off.set(0, hs, 0.12 * hs).applyQuaternion(q);
      _p3.copy(p).add(_off);
      if (!f.pipe) L2.angF[i] += dt * 3 * L2.spin[i];          // 有即時資料的風場：轉速依此刻出力
      _q2.setFromAxisAngle(_zAxis, (f.pipe ? 0 : L2.angF[i]) + L2.phase[i]);
      _q.copy(q).multiply(_q2);
      _s.set(hs, hs, hs); _m4.compose(_p3, _q, _s); L2.rotor.setMatrixAt(i, _m4);
    }
  }
  L2._force = false;
  if (dirty) { L2.meshes.forEach(m => { if (m !== L2.rotor) m.instanceMatrix.needsUpdate = true; }); }
  if (L2.rotor) L2.rotor.instanceMatrix.needsUpdate = true;
}

/* ---------------- turbine clusters (close-range view of real farm layouts) ---------------- */
let clusterMats;
function defaultUnit(type, y) {
  if (type === 'onshore') return y < 1990 ? 0.1 : y < 1995 ? 0.3 : y < 2000 ? 0.6 : y < 2005 ? 1.5 : y < 2010 ? 2 : y < 2015 ? 2.3 : y < 2020 ? 3 : 4.2;
  return y < 2000 ? 0.5 : y < 2005 ? 2 : y < 2010 ? 3 : y < 2015 ? 3.6 : y < 2019 ? 6 : y < 2022 ? 8 : 12;
}
const clamp1 = clamp;
function turbSpec(f) {
  if (f._spec) return f._spec;
  const t = f.turbine || ''; let n = null, unit = null, m;
  if ((m = t.match(/(\d+)\s*[x×]\s/)) || (m = t.match(/(?:MW|\s)\s*[x×]\s*(\d+)\b/)) || (m = t.match(/(\d+)\s*(?:turbines|units|部)/i))) n = +m[1];
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*MW/i))) unit = +m[1];
  if (!unit && ((m = t.match(/SWT-(\d+(?:\.\d+)?)/i)) || (m = t.match(/\bV\d+-(\d+(?:\.\d+)?)/)) || (m = t.match(/SG\s*(\d+(?:\.\d+)?)-/i)) || (m = t.match(/MySE\s*(\d+(?:\.\d+)?)/i)) || (m = t.match(/Haliade-X\s*(\d+)/i)))) unit = +m[1];
  if (unit && unit > 30) unit = null;
  if (!unit && n) unit = f.mw / n;
  if (!unit) unit = f._unit || defaultUnit(f.type, f.year);
  if (!n) n = f._n || Math.round(f.mw / unit);
  n = clamp1(Math.round(n), 1, 160);
  const areaKm2 = f.mw * (f.type === 'onshore' ? 0.25 : 0.15);
  const extent = Math.max(0.6, Math.sqrt(areaKm2));
  const spacing = n > 1 ? Math.max(0.35, extent / Math.sqrt(n)) : 0.5;
  const hKm = n <= 3 ? 1.1 : clamp(spacing * 0.85, 0.3, 2.6);
  f._spec = { n, unit, extent, spacing, hKm };
  return f._spec;
}
function farmAlt(f) { const sp = turbSpec(f); return clamp(sp.extent * KM * 3.0, 0.2, 2.0); }
function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
const clusters = new Map();
function makeCluster(f) {
  const sp = turbSpec(f), kind = f.pipe ? 'p' + f.st : f.type === 'onshore' ? 'on' : 'off', mats = clusterMats[kind];
  const rnd = seeded(f.name + f.lat);
  const r = Math.ceil(Math.sqrt(sp.n)) + 2, pts = [];
  for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) { const x = i + (j & 1) * 0.5, z = j * 0.866; pts.push([x, z, x * x + z * z]); }
  pts.sort((a, b) => a[2] - b[2]);
  const P = pts.slice(0, sp.n).map(p => [(p[0] + (rnd() - 0.5) * 0.25) * sp.spacing * KM, (p[1] + (rnd() - 0.5) * 0.25) * sp.spacing * KM]);
  const h = sp.hKm * KM;
  const tower = new THREE.InstancedMesh(towerGeo, mats.tower, sp.n), nac = new THREE.InstancedMesh(nacGeo, mats.nac, sp.n), rotor = new THREE.InstancedMesh(rotorGeo, mats.blade, sp.n);
  _q.identity(); _s.set(h, h, h);
  P.forEach((p, i) => { _p3.set(p[0], 0, p[1]); _m4.compose(_p3, _q, _s); tower.setMatrixAt(i, _m4); nac.setMatrixAt(i, _m4); });
  [tower, nac, rotor].forEach(m => { m.userData.farm = f; m.instanceMatrix.needsUpdate = true; });
  const g = new THREE.Group(); g.add(tower, nac, rotor);
  let rad = 0; P.forEach(p => { rad = Math.max(rad, Math.hypot(p[0], p[1])); }); rad += sp.spacing * KM * 0.8;
  const disc = new THREE.Mesh(discGeo, clusterMats[kind].disc), ring = new THREE.Mesh(f.pipe ? thinDashGeo : thinRingGeo, clusterMats[kind].ring);
  disc.scale.set(rad / 0.75, 1, rad / 0.75); ring.scale.set(rad, 1, rad); disc.position.y = ring.position.y = h * 0.02;
  disc.userData.farm = f; g.add(disc, ring);
  g.userData = { f, P, h, tower, nac, rotor, disc, ring, ringMat: ring.material, live: false, phase: P.map(() => rnd() * 6.28), ang: 0, count: -1 };
  const q = new THREE.Quaternion(); posAt(f.lon, f.lat, 0, g.position); g.quaternion.copy(quatAt(f.lon, f.lat, q));
  clusterRoot.add(g); return g;
}
function removeCluster(f) { const g = clusters.get(f); if (!g) return; clusterRoot.remove(g); [g.userData.tower, g.userData.nac, g.userData.rotor].forEach(m => m.dispose && m.dispose()); clusters.delete(f); }
function layoutClusters() { const q = new THREE.Quaternion(); clusters.forEach((g, f) => { posAt(f.lon, f.lat, 0, g.position); g.quaternion.copy(quatAt(f.lon, f.lat, q)); }); }
let lastClusterT = 0, focusFarm = null;
function updateClusters(now, force) {
  if (!force && now - lastClusterT < 280) return; lastClusterT = now;
  const alt = curAlt();
  const want = new Set();
  if (alt < CL_ALT && !modeAnim && farmsReady) {
    const fc = focusLonLat(), cosl = Math.max(0.2, Math.cos(fc.lat * D2R));
    const rad = Math.max(0.35, alt * 0.6 * 2.6);
    const cands = [];
    for (const f of D.farms) {
      if (!farmActive(f, S.year) || !layerOk(f.type)) continue;          // 規劃中：開啟「規劃中」且在時間軸終點才出現
      const dl = (f.lat - fc.lat), dn = (f.lon - fc.lon) * cosl, d = Math.sqrt(dl * dl + dn * dn);
      if (d < rad + 0.15) cands.push([d, f]);
    }
    cands.sort((a, b) => a[0] - b[0]); cands.slice(0, 18).forEach(c => want.add(c[1]));
    if (focusFarm && farmActive(focusFarm, S.year)) want.add(focusFarm);
  }
  clusters.forEach((g, f) => { if (!want.has(f)) removeCluster(f); });
  want.forEach(f => { if (!clusters.has(f)) clusters.set(f, makeCluster(f)); });
}
function animateClusters(dt) {
  clusters.forEach((g, f) => {
    const u = g.userData, n = u.P.length;
    const built = (f.yu || f.pipe) ? n : clamp(Math.ceil(n * fAge(f) / BUILD), 0, n);
    if (built !== u.count) { u.count = built; u.tower.count = built; u.nac.count = built; u.rotor.count = built; }
    const lv = liveOn() && liveFor(f);
    if (!!lv !== u.live) { u.live = !!lv; u.ring.material = lv ? clusterMats.liveRing : u.ringMat; }   // 有即時資料：外圈改為即時綠
    u.ang += dt * 1.6 * (lv ? spinOf(lv) : f.pipe ? 0 : 1);   // 近看的風機群：轉速依此刻出力（興建中但已併網發電者也會轉）
    _s.set(u.h, u.h, u.h);
    for (let i = 0; i < built; i++) { _p3.set(u.P[i][0], u.h, u.P[i][1] + 0.12 * u.h); _q.setFromAxisAngle(_zAxis, u.ang + u.phase[i]); _m4.compose(_p3, _q, _s); u.rotor.setMatrixAt(i, _m4); }
    u.rotor.instanceMatrix.needsUpdate = true;
  });
}
function layoutAnchors() {
  const q = new THREE.Quaternion();
  cGroups.forEach(a => { const c = a.userData.c; posAt(c.lon, c.lat, 0, a.position); a.quaternion.copy(quatAt(c.lon, c.lat, q)); });
  msMarkers.forEach(g => { const m = g.userData.m; posAt(m.lon, m.lat, 0, g.position); g.quaternion.copy(quatAt(m.lon, m.lat, q)); });
  if (hiLines) setHighlight(hiIso);
  layoutFarms(); if (FL.op) { FL.op._force = true; FL.pp._force = true; }
  layoutClusters();
}

/* ================= camera: regions, tweens, auto-tilt ================= */
function regionCenter(region) {
  region = region || S.region;
  if (region === 'WORLD') return { lon: 30, lat: S.mode === 'flat' ? 12 : 25, span: 170 };
  if (region.startsWith('C:')) {
    const presets = { Asia: { lon: 95, lat: 32, span: 110 }, Europe: { lon: 12, lat: 52, span: 45 }, 'North America': { lon: -98, lat: 42, span: 80 }, 'South America': { lon: -60, lat: -18, span: 70 }, Africa: { lon: 20, lat: 5, span: 80 }, Oceania: { lon: 145, lat: -30, span: 70 } };
    return presets[region.slice(2)];
  }
  const c = byIso[region];
  return { lon: c.lon, lat: c.lat, country: true, span: Math.max(10, Math.max(c.bbox[2] - c.bbox[0], (c.bbox[3] - c.bbox[1]) * 1.3)) };
}
function regionAlt(rc) {
  if (S.mode === 'globe') return Math.min(320, Math.max(14, rc.span * (rc.country ? (rc.span > 40 ? 1.6 : 1.2) : 1.9)));
  return Math.min(700, Math.max(18, rc.span * FS * (rc.country ? (rc.span > 40 ? 1.4 : 0.9) : 1.9)));
}
let camTween = null;
function tweenTo(pos, tgt, dur) {
  const p0 = vcam.position.clone(), t0 = controls.target.clone();
  const spherical = S.mode === 'globe' && t0.length() < 1 && tgt.length() < 1;
  let bump = 0, d = dur;
  if (spherical) {
    const ang = p0.clone().normalize().angleTo(pos.clone().normalize());
    const a0 = p0.length() - R, a1 = pos.length() - R;
    bump = Math.max(0, Math.min(240, ang * R * 0.85) - (a0 + a1) * 0.35);
    d = d || clamp(1.3 + ang * 1.3 + Math.abs(Math.log(Math.max(a1, 0.1) / Math.max(a0, 0.1))) * 0.16, 1.3, 4.2);
  } else {
    const dist = t0.distanceTo(tgt);
    bump = S.mode === 'flat' ? Math.min(250, dist * 0.45) : 0;
    d = d || clamp(1.3 + dist / 220, 1.3, 3.6);
  }
  camTween = { t: 0, dur: d, p0, p1: pos.clone(), t0, t1: tgt.clone(), spherical, bump };
  return d;
}
function stepTween(dt) {
  if (!camTween) return;
  const c = camTween; c.t += dt; const k = Math.min(1, c.t / c.dur), e = easeIO(k);
  if (c.spherical) {
    const d0 = c.p0.clone().normalize(), d1 = c.p1.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(d0, d1), qe = new THREE.Quaternion().slerp(q, e);
    const a0 = Math.max(0.05, c.p0.length() - R), a1 = Math.max(0.05, c.p1.length() - R);
    const alt = Math.exp(lerp(Math.log(a0), Math.log(a1), e)) + c.bump * Math.sin(Math.PI * e);
    vcam.position.copy(d0.applyQuaternion(qe)).multiplyScalar(R + alt); controls.target.set(0, 0, 0);
  } else {
    vcam.position.lerpVectors(c.p0, c.p1, e); controls.target.lerpVectors(c.t0, c.t1, e);
    vcam.position.y += c.bump * Math.sin(Math.PI * e);
  }
  if (k >= 1) camTween = null;
}
function flyToRegion(instant) {
  const rc = regionCenter(), alt = regionAlt(rc);
  let pos, tgt;
  if (S.mode === 'globe') { pos = globePos(rc.lon, rc.lat, alt); tgt = new THREE.Vector3(); }
  else { tgt = flatPos(rc.lon, rc.lat, 0); const tilt = rc.span > 120 ? 0.42 : rc.country ? 0.6 : 0.75; pos = tgt.clone().add(new THREE.Vector3(0, alt * Math.cos(tilt), alt * Math.sin(tilt))); }
  if (instant) { vcam.position.copy(pos); controls.target.copy(tgt); camTween = null; return 0; }
  return tweenTo(pos, tgt);
}
function flyToLonLat(lon, lat, alt, dur) {
  let pos, tgt;
  if (S.mode === 'globe') { pos = globePos(lon, lat, alt); tgt = new THREE.Vector3(); }
  else { tgt = flatPos(lon, lat, 0); const tl = 0.95; pos = tgt.clone().add(new THREE.Vector3(0, alt * Math.cos(tl), alt * Math.sin(tl))); }
  return tweenTo(pos, tgt, dur);
}
let tiltBlend = 0;
const _n = new THREE.Vector3(), _u = new THREE.Vector3(), _F = new THREE.Vector3();
function syncRenderCamera(dt) {
  const want = (S.mode === 'globe' && !modeAnim && controls.target.lengthSq() < 1) ? 1 : 0;
  tiltBlend += (want - tiltBlend) * Math.min(1, dt * 4);
  const P = vcam.position;
  let alt;
  if (S.mode === 'globe' && controls.target.lengthSq() < 1 && tiltBlend > 0.001) {
    alt = P.length() - R;
    const s = clamp(1 - alt / 75, 0, 1), a = tiltBlend * 1.0 * s * s * (3 - 2 * s);
    _n.copy(P).normalize(); _F.copy(_n).multiplyScalar(R);
    _u.set(0, 1, 0).applyQuaternion(vcam.quaternion); _u.addScaledVector(_n, -_u.dot(_n)).normalize();
    camera.position.copy(_F).addScaledVector(_n, alt * Math.cos(a)).addScaledVector(_u, -alt * Math.sin(a));
    camera.up.copy(_u).multiplyScalar(Math.cos(a)).addScaledVector(_n, Math.sin(a)).normalize();
    camera.lookAt(_F);
  } else {
    alt = curAlt();
    camera.position.copy(P); camera.quaternion.copy(vcam.quaternion); camera.up.copy(vcam.up);
  }
  const near = clamp(alt * 0.2, 0.004, 5), far = S.mode === 'globe' ? (R + alt) * 2.2 + 60 : Math.max(1500, alt * 6);
  if (Math.abs(camera.near - near) > near * 0.05 || camera.far !== far) { camera.near = near; camera.far = far; camera.updateProjectionMatrix(); }
}

/* 自動旋轉：以秒計速（與畫面更新率無關），任何範圍、兩種模式都有效。
   3D 地球繞地軸由西向東自轉，全球視角約 60 秒一圈，拉近時等比放慢，畫面上的移動速度維持一致；
   2.5D 平面則繞畫面中心緩慢旋轉。拖曳、飛行途中與導覽時暫停。 */
const _qs = new THREE.Quaternion(), _sv = new THREE.Vector3();
function autoSpin(dt) {
  if (S.mode === 'globe') {
    const degPerSec = 6 * clamp(curAlt() / 320, 0.0005, 1.5);
    _qs.setFromAxisAngle(UP, -degPerSec * D2R * dt);
    vcam.position.applyQuaternion(_qs);
  } else {
    _qs.setFromAxisAngle(UP, 5 * D2R * dt);
    _sv.copy(vcam.position).sub(controls.target).applyQuaternion(_qs);
    vcam.position.copy(controls.target).add(_sv);
  }
}

/* ================= mode switch ================= */
let modeAnim = null;
function setMode(m) {
  if (S.mode === m || !renderer) return;
  S.mode = m;
  document.querySelectorAll('#g-modeSeg button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  modeAnim = { from: S.modeT, to: m === 'flat' ? 1 : 0, t: 0, dur: 1.1 };
  if (m === 'flat') { controls.minDistance = 0.15; controls.maxDistance = 900; controls.zoomSpeed = 2.2; controls.enablePan = true; controls.maxPolarAngle = Math.PI / 2 - 0.08; }
  else { controls.minDistance = 1; controls.maxDistance = 1e5; controls.zoomSpeed = 1; controls.enablePan = false; controls.maxPolarAngle = Math.PI; }
  clusters.forEach((g, f) => removeCluster(f)); patchInfo = null; farmLayerDirty = true;
  if (TOUR) tourShowStop(TOUR.i, true); else if (focusFarm) flyToLonLat(focusFarm.lon, focusFarm.lat, farmAlt(focusFarm)); else flyToRegion(false);
  syncURL();
}
function applyModeT() {
  const flat = S.modeT > 0.5;
  globe.visible = !flat; atmo.visible = !flat; bordersG.visible = !flat; plane.visible = flat; bordersF.visible = flat;
  globe.scale.setScalar(Math.max(0.001, 1 - Math.min(1, S.modeT * 2) * 0.999)); plane.scale.setScalar(clamp((S.modeT - 0.5) * 2, 0.001, 1));
  layoutAnchors();
}

/* ================= region select & side panel ================= */
function buildRegionSelect() {
  const sel = $('g-regionSel'); const cur = S.region; sel.innerHTML = '';
  const add = (v, txt, grp) => { const o = document.createElement('option'); o.value = v; o.textContent = txt; (grp || sel).appendChild(o); };
  add('WORLD', '🌍 ' + T('world'));
  const og = document.createElement('optgroup'); og.label = L('洲別', 'Continents'); sel.appendChild(og);
  ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'].forEach(k => add('C:' + k, T('cont')[k], og));
  const og2 = document.createElement('optgroup'); og2.label = L('國家／地區（依 ' + Y1 + ' 容量排序）', 'Countries (by ' + Y1 + ' capacity)'); sel.appendChild(og2);
  C.forEach(c => add(c.iso, cname(c), og2));
  sel.value = cur;
}
function setRegion(r, noFly) {
  if (r !== 'WORLD' && !r.startsWith('C:') && !byIso[r]) r = 'WORLD';
  S.region = r; $('g-regionSel').value = r;
  setHighlight(byIso[r] ? r : null);
  farmLayerDirty = true;
  focusFarm = null;
  setPanelTab(panelTab === 'pipe' || (panelTab === 'farms' && byIso[r]) ? panelTab : (byIso[r] ? 'prof' : 'ms'));
  if (!noFly) flyToRegion(false);
  updateBars(true); renderMilestones(true); renderProfile();
  syncURL();
}
let panelTab = 'ms';
function setPanelTab(t) {
  panelTab = t;
  [['prof', 'g-tabProf', 'g-profBody'], ['ms', 'g-tabMs', 'g-msList'], ['farms', 'g-tabFarms', 'g-farmList'], ['pipe', 'g-tabPipe', 'g-pipeList']].forEach(([k, b, body]) => {
    $(b).classList.toggle('active', k === t); $(b).setAttribute('aria-selected', k === t ? 'true' : 'false'); $(body).hidden = k !== t;
  });
  $('g-tabProf').hidden = !(byIso[S.region] || S.region.startsWith('C:') || S.region === 'WORLD');
  if (t === 'farms') renderFarmList(true);
  if (t === 'prof') renderProfile();
  if (t === 'pipe') renderPipeList(true);
}

/* ================= labels ================= */
let labelsEl, labelPool = [];
function getLabel(i) { while (labelPool.length <= i) { const d = document.createElement('div'); d.className = 'lbl'; labelsEl.appendChild(d); labelPool.push(d); } return labelPool[i]; }
const _pp = new THREE.Vector3();
function project(v) { _pp.copy(v).project(camera); return { x: (_pp.x + 1) / 2 * W, y: (1 - _pp.y) / 2 * H, z: _pp.z }; }
function facing(worldPos) {
  if (S.modeT > 0.5) return true;
  _n.copy(worldPos).normalize();
  return _pp.copy(camera.position).sub(worldPos).dot(_n) > 0;
}
function textW(s, px) { let w = 0; for (const ch of s) w += /[⺀-鿿豈-￯]/.test(ch) ? px * 1.02 : px * 0.57; return w; }
const DENS = [{ c: 0, f: 0, m: 0, n: 0 }, { c: 7, f: 5, m: 1, n: 3 }, { c: 12, f: 11, m: 3, n: 5 }, { c: 22, f: 24, m: 5, n: 8 }];
function upAt(p) { return S.modeT > 0.5 ? UP : _u.copy(p).normalize(); }

/* ================= main loop ================= */
function resize() {
  const pane = $('g-mapPane'); W = pane.clientWidth || 1; H = pane.clientHeight || 1;
  if (renderer) renderer.setSize(W, H, false);
  camera.aspect = vcam.aspect = W / H; camera.updateProjectionMatrix(); vcam.updateProjectionMatrix();
}
const tmpV = new THREE.Vector3(), tmpW = new THREE.Vector3();
function start() { if (running) return; running = true; S.lastT = performance.now(); requestAnimationFrame(frame); }
function stop() { running = false; }
function frame(now) {
  if (!running) return;
  requestAnimationFrame(frame);
  const dt = Math.min(0.25, (now - S.lastT) / 1000 || 0); S.lastT = now; S.frames = (S.frames || 0) + 1;

  if (S.playing) { S.year += dt * S.speed; if (S.year >= Y1) { S.year = Y1; setPlaying(false); } syncYearUI(); }
  if (TOUR) tourTick(dt);
  if (!renderer) { updateHUD(); if (now - (S.lastBar || 0) > 90) { S.lastBar = now; updateBars(false); } return; }

  if (modeAnim) { modeAnim.t += dt; const k = Math.min(1, modeAnim.t / modeAnim.dur); const e = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
    S.modeT = modeAnim.from + (modeAnim.to - modeAnim.from) * e; applyModeT(); if (k >= 1) { modeAnim = null; S.modeT = S.mode === 'flat' ? 1 : 0; applyModeT(); } }

  stepTween(dt);
  // OrbitControls 在事件中直接改距離：以「高度」空間修正滾輪縮放，讓近地面也能細緻縮放
  const zoomFix = () => {
    if (S.mode !== 'globe' || camTween || modeAnim || !S.lastDist) return;
    const cur = vcam.position.length();
    if (Math.abs(cur - S.lastDist) > 1e-7) {
      const newAlt = clamp((S.lastDist - R) * Math.pow(cur / S.lastDist, 3.4), G_MIN_ALT, G_MAX_ALT);
      vcam.position.setLength(R + newAlt);
    }
  };
  zoomFix();
  if (S.rotate && !camTween && !TOUR && !modeAnim && !S.dragging) autoSpin(dt);
  const alt0 = curAlt();
  if (S.mode === 'globe') controls.rotateSpeed = clamp(0.0013 * alt0, 0.00008, 0.5);
  S.lastDist = vcam.position.length();
  controls.update();
  zoomFix();
  S.lastDist = vcam.position.length();
  syncRenderCamera(dt);
  const alt = curAlt();

  updatePatch(now);
  ambL.intensity = 0.55 + 0.35 * clamp(1 - alt / 40, 0, 1);     // 近地面時提高環境光，衛星影像／山影才看得清楚
  const lift = clamp(alt * 0.004, 0.0015, 0.4);
  if (!modeAnim) {
    if (S.mode === 'globe') {
      const s = r => (R + r) / R;
      if (patch) patch.scale.setScalar(s(lift)); bordersG.scale.setScalar(s(lift * 1.7)); if (hiLines) hiLines.scale.setScalar(s(lift * 1.9));
      surfaceRoot.scale.setScalar(s(lift * 1.3)); surfaceRoot.position.set(0, 0, 0);
    } else {
      if (patch) { patch.scale.setScalar(1); patch.position.y = lift; } bordersF.position.y = lift * 1.7; if (hiLines) { hiLines.scale.setScalar(1); hiLines.position.y = lift * 1.9; }
      surfaceRoot.scale.setScalar(1); surfaceRoot.position.y = lift * 1.3;
    }
  } else { surfaceRoot.scale.setScalar(1); surfaceRoot.position.set(0, 0, 0); if (hiLines) { hiLines.scale.setScalar(1); hiLines.position.set(0, 0, 0); } }
  surfaceRoot.updateMatrixWorld();

  updateClusters(now, false);
  animateClusters(dt);
  rebuildFarmInstances(now, false);
  const deep = alt < CL_ALT;

  const sizeK = S.mode === 'globe' ? clamp(alt / 65, 0.02, 1) : clamp(alt / 220, 0.02, 1.4);
  const farmScale = farmK * clamp(Math.pow(alt / Math.max(1, farmRefAlt), 0.75), 0.015, 1.3);
  const pinK = clamp(Math.pow(alt / 150, 0.85), 0.004, 1) * (FL.op.list.length ? 0.5 : 1);
  const selHasFarms = !!(byIso[S.region] && farmsByIso[S.region] && farmsByIso[S.region].length);

  const dens = DENS[S.density];
  const cands = [];
  let worldOn = 0, worldOff = 0, nWith = 0;
  const zoomFarms = FL.op.list.length > 0 && alt < (S.mode === 'globe' ? 45 : 70);
  cGroups.forEach(a => {
    const c = a.userData.c, cap = capOf(c, S.year), inR = inRegion(c);
    const hasFarms = selHasFarms && S.region === c.iso;
    const dimT = (hasFarms || (selHasFarms && !inR) || deep || zoomFarms) ? 0 : (inR ? 1 : 0.18);
    a.userData.dim += (dimT - a.userData.dim) * Math.min(1, dt * 6);
    a.visible = a.userData.dim > 0.02;
    worldOn += valAt(c.on, S.year); worldOff += valAt(c.off, S.year); if (cap.tot > 0.5) nWith++;
    if (!a.visible) return;
    [['on', a.userData.tOn, cap.on], ['off', a.userData.tOff, cap.off]].forEach(([k, t, mw]) => {
      const u = t.userData;
      const hT = heightOf(mw) * sizeK, rT = radiusOf(mw) * sizeK;
      u.h += (hT - u.h) * Math.min(1, dt * 5); u.r += (rT - u.r) * Math.min(1, dt * 5);
      const on = mw > 0.5 && u.h > 0.0005; t.visible = on; if (!on) return;
      u.tower.scale.setScalar(u.h); u.nac.scale.setScalar(u.h); u.rotor.scale.setScalar(u.h); u.rotor.position.set(0, u.h, 0.12 * u.h);
      u.ring.scale.set(u.r, 1, u.r); u.disc.scale.set(u.r, 1, u.r);
      u.rotor.rotation.z += dt * 2.2 * (k === 'on' ? 1 : 0.9);
      const op = a.userData.dim; u.mats[0].opacity = op; u.mats[1].opacity = op; u.mats[2].opacity = op; u.mats[3].opacity = 0.55 * op; u.mats[4].opacity = 0.16 * op;
    });
    const sep = (a.userData.tOn.userData.r + a.userData.tOff.userData.r) * 0.6 + 0.8 * sizeK;
    a.userData.tOn.position.set(cap.off > 0.5 ? -sep * 0.5 : 0, 0, 0); a.userData.tOff.position.set(sep * 0.5, 0, 0);
    if (inR && cap.tot > 0.5 && !hasFarms && a.userData.dim > 0.5) {
      a.getWorldPosition(tmpV); const h = Math.max(a.userData.tOn.userData.h, a.userData.tOff.userData.h) * surfaceRoot.scale.x;
      cands.push({ cat: 'c', pri: cap.tot, pos: tmpV.clone().addScaledVector(upAt(tmpV), h * 1.15 + 1.2 * sizeK), name: cname(c), val: fmtMW(cap.tot), cls: '', key: 'c' + c.iso });
    }
  });
  S.worldOn = worldOn; S.worldOff = worldOff; S.nWith = nWith;

  // 風場層（InstancedMesh）＋標籤候選（只取容量最大的一批）
  animateFarmKind(FL.op, dt, farmScale, deep, now);
  animateFarmKind(FL.pp, dt, farmScale, deep, now);
  [FL.op, FL.pp].forEach(L2 => {
    const lim = Math.min(L2.list.length, 120);
    for (let i = 0; i < lim; i++) {
      const f = L2.list[i], h = L2.h[i]; if (h < 0.0003) continue;
      tmpW.copy(L2.pos[i]).applyMatrix4(surfaceRoot.matrixWorld);
      const age = fAge(f), isNew = !f.pipe && !f.yu && age >= 0 && age < 1.5;
      cands.push({ cat: isNew ? 'n' : 'f', pri: f.mw + (f === focusFarm ? 1e9 : 0) - (f.pipe ? 1e5 : 0), pos: tmpW.clone().addScaledVector(upAt(tmpW), h * (L2.isPipe ? 0.25 : 1.2) * surfaceRoot.scale.x + 0.25 * farmScale),
        name: fname(f), val: f.pipe ? T('st')[f.st] + ' · ' + fmtMW(f.mw) : (f.yu ? '' : f.year + ' · ') + fmtMW(farmMwAt(f, S.year)), cls: f.pipe ? 'pipe' : isNew ? 'fnew' : 'farm', key: 'f' + f.name + f.lat });
    }
  });
  clusters.forEach((g, f) => {
    if (g.userData.count <= 0 || f.pseudo) return;     // 里程碑的示意風場：由里程碑標籤代表
    g.getWorldPosition(tmpV);
    const isNew = !f.yu && fAge(f) < 1.5;
    const val = f.pipe ? T('st')[f.st] + (f.year ? ' · ' + T('expected') + ' ' + f.year : '') + ' · ' + fmtMW(f.mw) : (f.yu ? '' : f.year + ' · ') + fmtMW(f.mw);
    cands.push({ cat: f === focusFarm ? 'm' : (isNew && !f.pipe ? 'n' : 'f'), pri: f.mw + (f === focusFarm ? 1e9 : 0) - (f.pipe ? 1e5 : 0), pos: tmpV.clone().addScaledVector(upAt(tmpV), g.userData.h * 2.2), name: fname(f), val, cls: f === focusFarm ? 'focus' : f.pipe ? 'pipe' : (isNew ? 'fnew' : 'farm'), key: 'k' + f.name + f.lat });
  });
  const tourMs = TOUR && TOUR.stops[TOUR.i] && TOUR.stops[TOUR.i].m;
  msMarkers.forEach(g => {
    const m = g.userData.m;
    const isTour = tourMs === m;
    const show = isTour || (S.year >= m.year && S.year < m.year + 4 && inScope(m.iso) && (!TOUR));
    g.visible = show && !(isTour && focusFarm && clusters.has(focusFarm)); if (!show) return;
    const age = Math.max(0, S.year - Math.max(m.year, Y0)); const pulse = 1 + 0.35 * Math.sin(now / 250);
    g.scale.setScalar(pinK);
    g.userData.halo.scale.setScalar(pulse * (1 + Math.min(age, 2) * 0.6)); g.userData.halo.material.opacity = isTour ? 0.8 : Math.max(0, 0.8 - age * 0.2);
    g.userData.pin.position.y = 1.4 + 0.3 * Math.sin(now / 300);
    if (isTour || age < 1.5) { g.getWorldPosition(tmpV); cands.push({ cat: 'm', pri: isTour ? 2e9 : 1e8, pos: tmpV.clone().addScaledVector(upAt(tmpV), 3.4 * pinK * surfaceRoot.scale.x), name: '★ ' + m.name, val: m.year + (m.farm ? ' · ' + fmtMW(m.farm) : m.mw ? ' · ' + T('turbine') + ' ' + (m.mw < 1 ? WW.int(m.mw * 1000) + ' kW' : m.mw + ' MW') : ''), cls: 'ms', key: 'm' + m.name }); }
  });

  let li = 0;
  if (S.density > 0 || TOUR) {
    const rects = [];
    const pr = $('g-mapPane').getBoundingClientRect();
    ['g-yearBig', 'g-worldStat', 'g-msPanel', 'g-infoCard'].forEach(id => { const el = $(id); if (!el || el.offsetParent === null) return; const b = el.getBoundingClientRect(); if (b.width) rects.push([b.left - pr.left, b.top - pr.top, b.right - pr.left, b.bottom - pr.top]); });
    const used = { c: 0, f: 0, m: 0, n: 0 };
    const lim = S.density > 0 ? dens : { c: 0, f: 0, m: 1, n: 0 };
    cands.sort((a, b) => b.pri - a.pri);
    for (const cd of cands) {
      if (used[cd.cat] >= lim[cd.cat] && cd.pri < 1e9) continue;
      if (!facing(cd.pos)) continue;
      const p = project(cd.pos); if (p.z > 1 || p.y < 10 || p.y > H + 10) continue;
      const w = Math.max(textW(cd.name, 12), textW(cd.val, 10.5)) + 6, h = 29;
      if (p.x - w / 2 < 2 || p.x + w / 2 > W - 2) continue;             // 標籤要完整落在畫面內
      const r = [p.x - w / 2 - 3, p.y - h - 2, p.x + w / 2 + 3, p.y + 2];
      if (rects.some(q => !(r[2] < q[0] || r[0] > q[2] || r[3] < q[1] || r[1] > q[3]))) continue;
      rects.push(r); used[cd.cat]++;
      const el = getLabel(li++);
      if (el._key !== cd.key) { el._key = cd.key; el.innerHTML = '<b>' + esc(cd.name) + '</b><span class="v">' + esc(cd.val) + '</span>'; el.className = 'lbl ' + cd.cls; el._val = cd.val; }
      else if (el._val !== cd.val) { el._val = cd.val; el.lastChild.textContent = cd.val; }
      el.style.display = 'block'; el.style.transform = 'translate(' + (p.x | 0) + 'px,' + (p.y | 0) + 'px) translate(-50%,-100%)';
    }
  }
  for (let i = li; i < labelPool.length; i++) { if (labelPool[i].style.display !== 'none') { labelPool[i].style.display = 'none'; labelPool[i]._key = null; } }

  if (S.view !== 'bars') renderer.render(scene, camera);
  updateHUD();
  if (now - (S.lastBar || 0) > 90) { S.lastBar = now; updateBars(false); }
}

/* ================= HUD ================= */
let hudCache = '';
function farmStats() {
  const iso = byIso[S.region] ? S.region : null;
  const list = (iso && farmsByIso[iso]) || []; let n = 0, mw = 0, pn = 0, pmw = 0;
  list.forEach(f => { if (f.pipe) { pn++; pmw += f.mw; } else if (farmActive(f, S.year)) { n++; mw += farmMwAt(f, S.year); } });
  return { n, mw, total: list.filter(f => !f.pipe).length, pn, pmw };
}
function updateHUD() {
  const yr = Math.floor(S.year);
  let sOn = S.worldOn || 0, sOff = S.worldOff || 0;
  if (S.region !== 'WORLD' || !renderer) { sOn = 0; sOff = 0; C.filter(inRegion).forEach(c => { sOn += valAt(c.on, S.year); sOff += valAt(c.off, S.year); }); }
  const nm = S.region === 'WORLD' ? T('worldTotal') : scopeName();
  let html = '<div>' + esc(nm) + ' <b>' + fmtMW(sOn + sOff) + '</b></div>' +
    '<div><i class="gsw" style="background:var(--on)"></i>' + T('onshore') + ' ' + fmtMW(sOn) + ' &nbsp; <i class="gsw" style="background:var(--off)"></i>' + T('offshore') + ' ' + fmtMW(sOff) + '</div>' +
    (S.region === 'WORLD' ? '<div>' + (S.nWith || C.filter(c => capOf(c, S.year).tot > 0.5).length) + ' ' + T('countriesWith') + '</div>' : '');
  if (byIso[S.region]) {
    if (!farmsReady) html += '<div style="margin-top:4px;color:var(--ginkm)">' + T('farmsLoading') + '</div>';
    else {
      const st = farmStats();
      if (st.total || st.pn) {
        html += '<div style="margin-top:4px;color:var(--acc)">' + T('farmLayer') + '：' + L(`已出現 ${st.n} / ${st.total} 座 · ${fmtMW(st.mw)}`, `${st.n} of ${st.total} shown · ${fmtMW(st.mw)}`) + '</div>';
        if (S.pipe && st.pn) html += '<div class="pl">' + (S.year >= Y1 - 0.02 ? L(`規劃中 ${st.pn} 案 · ${fmtMW(st.pmw)}（虛線環）`, `Pipeline: ${st.pn} projects · ${fmtMW(st.pmw)} (dashed rings)`) : T('pipeNote')) + '</div>';
      } else html += '<div style="margin-top:4px;color:var(--ginkm)">' + T('farmNone') + '</div>';
    }
  }
  const key = yr + '|' + html;
  if (key !== hudCache) { hudCache = key; $('g-yearBig').childNodes[0].nodeValue = yr; $('g-yearBig').querySelector('small').textContent = L(yr + ' 年 · ' + T('worldCap'), T('worldCap')); $('g-worldStat').innerHTML = html; }
  if (panelTab === 'farms') renderFarmList(false);
  if (panelTab === 'prof' && Math.floor(S.year) !== profYear) renderProfile();
  const ll = $('g-liveLegend'), showLl = liveSeen && liveOn() && !!renderer && S.view !== 'bars' && farmsReady;
  if (ll.hidden === showLl || ll._lang !== lang) { ll.hidden = !showLl; ll._lang = lang; ll.innerHTML = '<i class="gsw" style="background:var(--live)"></i>' + T('liveLegend'); }
  const lg = $('g-pipeLegend'), showLg = S.pipe && S.year >= Y1 - 0.02 && !!renderer && S.view !== 'bars' && farmsReady;
  ll.classList.toggle('up', showLg);
  if (lg.hidden === showLg) {
    lg.hidden = !showLg;
    if (showLg) lg.innerHTML = '<span>' + T('pipeLegendT') + '</span>' + [1, 2, 3].map(k => '<span><i class="gsw dash p' + k + '"></i>' + T('st')[k] + '</span>').join('');
  }
}

/* ================= side panel: milestones, farms, profile ================= */
let msRendered = -1;
function renderMilestones(force) {
  const yr = Math.floor(S.year);
  const shown = D.milestones.filter(m => m.year <= yr && inScope(m.iso));
  if (!force && shown.length === msRendered) return;
  msRendered = shown.length;
  const box = $('g-msList');
  box.innerHTML = '<div class="gnote">' + T('msFocus') + '</div>';
  shown.slice().reverse().forEach((m, i) => {
    const d = document.createElement('button'); d.type = 'button'; d.className = 'msItem' + (i === 0 ? ' new' : '');
    const c = byIso[m.iso]; const cn = c ? cname(c) : m.iso;
    d.innerHTML = '<span class="y">' + m.year + '</span><span class="n">' + esc(m.name) + '</span>' +
      '<span class="t"><span class="gtag ' + stCls({ type: m.type }) + '">' + T('type')[m.type] + '</span>' + esc(cn) + (m.maker ? ' · ' + esc(m.maker) : '') + '</span>';
    d.onclick = () => openStop(msStop(m));
    box.appendChild(d);
  });
}
const FL_UI = { filter: 'all', sort: 'mw', q: '', limit: 200 };
let farmRendered = '';
function renderFarmList(force) {
  if (panelTab !== 'farms') return;
  const box = $('g-farmList');
  if (!farmsReady) { box.innerHTML = '<div class="gnote">' + T('farmsLoading') + '</div>'; return; }
  const iso = byIso[S.region] ? S.region : null;
  if (!iso) { box.innerHTML = '<div class="gnote">' + L('先在「範圍」選一個國家，或點地圖上的國家。', 'Pick a country in “Focus” or click one on the map.') + '</div>'; return; }
  let list = (farmsByIso[iso] || []).filter(f => f.pipe ? (FL_UI.filter !== 'op') : (FL_UI.filter !== 'pipe' && fAge(f) >= 0));
  if (FL_UI.q) { const q = FL_UI.q.toLowerCase(); list = list.filter(f => (f.name + ' ' + (f.zh || '') + ' ' + (f.owner || '')).toLowerCase().includes(q)); }
  const key = [iso, Math.floor(S.year), FL_UI.filter, FL_UI.sort, FL_UI.q, FL_UI.limit, lang, list.length].join('|');
  if (!force && key === farmRendered) return; farmRendered = key;
  list.sort(FL_UI.sort === 'mw' ? (a, b) => b.mw - a.mw : (a, b) => (b.pipe - a.pipe) || (b.year - a.year) || (b.mw - a.mw));
  const st = farmStats();
  box.innerHTML = '';
  const head = document.createElement('div'); head.className = 'gnote';
  head.innerHTML = esc(cname(byIso[iso])) + ' · ' + L(`營運中 ${st.n} 座 ${fmtMW(st.mw)}`, `${st.n} operating · ${fmtMW(st.mw)}`) + (st.pn ? L(` · 規劃中 ${st.pn} 案 ${fmtMW(st.pmw)}`, ` · ${st.pn} pipeline · ${fmtMW(st.pmw)}`) : '') + '<br>' + T('farmSrc');
  box.appendChild(head);
  const ctl = document.createElement('div'); ctl.style.cssText = 'display:flex;flex-direction:column;gap:6px';
  ctl.innerHTML = `<input type="search" id="g-fq" placeholder="${esc(T('search'))}" value="${esc(FL_UI.q)}">
    <div class="gchips"><button type="button" data-fl="all" class="${FL_UI.filter === 'all' ? 'active' : ''}">${T('fAll')}</button><button type="button" data-fl="op" class="${FL_UI.filter === 'op' ? 'active' : ''}">${T('fOp')}</button><button type="button" data-fl="pipe" class="${FL_UI.filter === 'pipe' ? 'active' : ''}">${T('fPipe')}</button>
    <span style="flex:1"></span><button type="button" data-so="mw" class="${FL_UI.sort === 'mw' ? 'active' : ''}">${T('sortMw')}</button><button type="button" data-so="year" class="${FL_UI.sort === 'year' ? 'active' : ''}">${T('sortYear')}</button></div>`;
  box.appendChild(ctl);
  const q = ctl.querySelector('#g-fq');
  q.oninput = () => { FL_UI.q = q.value.trim(); FL_UI.limit = 200; renderFarmList(true); const nq = $('g-fq'); if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); } };
  ctl.querySelectorAll('[data-fl]').forEach(b => b.onclick = () => { FL_UI.filter = b.dataset.fl; FL_UI.limit = 200; renderFarmList(true); });
  ctl.querySelectorAll('[data-so]').forEach(b => b.onclick = () => { FL_UI.sort = b.dataset.so; renderFarmList(true); });
  list.slice(0, FL_UI.limit).forEach(f => {
    const d = document.createElement('button'); d.type = 'button'; const gone = f.end && S.year >= f.end;
    d.className = 'msItem' + (!f.pipe && !f.yu && fAge(f) < 1.5 ? ' new' : '') + (gone ? ' gone' : '') + (f.pipe ? ' pipe' : '');
    const yr = f.pipe ? (f.year ? T('expected') + ' ' + f.year : T('st')[f.st]) : (f.yu ? '—' : f.year + (f.end ? '–' + f.end : ''));
    d.innerHTML = '<span class="y">' + esc(String(yr)) + '</span><span class="n">' + esc(fname(f)) + '</span>' +
      '<span class="t"><span class="gtag ' + stCls(f) + '">' + (f.pipe ? T('st')[f.st] : T('type')[f.type]) + '</span>' + fmtMW(f.mw) + (f.turbine ? ' · ' + esc(f.turbine) : f.owner ? ' · ' + esc(f.owner) : '') + '</span>';
    const lv = liveOn() && liveFor(f);
    if (lv) d.querySelector('.t').insertAdjacentHTML('beforeend', ' · <b class="lv">● ' + WW.num(lv.mw, lv.mw < 100 ? 1 : 0) + ' MW</b>');
    d.onclick = () => selectFarm(f);
    box.appendChild(d);
  });
  if (list.length > FL_UI.limit) {
    const m = document.createElement('button'); m.type = 'button'; m.className = 'gmore'; m.textContent = T('more') + ` (${list.length - FL_UI.limit})`;
    m.onclick = () => { FL_UI.limit += 300; renderFarmList(true); }; box.appendChild(m);
  }
}
/* 規劃中清單（規劃分頁）：範圍內逐案專案，依狀態、預計年份、容量排序；上方是逐案合計與 GEM 2026-02 各國總量 */
const PL_UI = { st: 0, q: '', limit: 150 };
let pipeRendered = '';
function gemTotalsFor(region) {
  const P = D.pipelineTotals; if (!P) return null;
  if (region === 'WORLD') return P.world;
  const out = { operating: 0, construction: 0, preconstruction: 0, announced: 0 };
  C.filter(c => inScope(c.iso, region)).forEach(c => { const g = P.byIso[c.iso]; if (g) for (const k in out) out[k] += g[k] || 0; });
  return out;
}
function pipeBar(g) {
  const parts = [['construction', 1], ['preconstruction', 2], ['announced', 3]];
  const tot = parts.reduce((a, [k]) => a + (g[k] || 0), 0);
  if (!tot) return '';
  return '<div class="pbar" role="img" aria-label="' + esc(parts.map(([k, st]) => T('st')[st] + ' ' + fmtMW(g[k] || 0)).join(', ')) + '">' +
    parts.map(([k, st]) => g[k] ? '<i class="p' + st + '" style="flex:' + g[k] + '"></i>' : '').join('') + '</div>' +
    '<div class="pleg">' + parts.map(([k, st]) => '<span><i class="gsw dash p' + st + '"></i>' + T('st')[st] + ' <b>' + fmtMW(g[k] || 0) + '</b></span>').join('') + '</div>';
}
function renderPipeList(force) {
  if (panelTab !== 'pipe') return;
  const box = $('g-pipeList');
  if (!farmsReady) { box.innerHTML = '<div class="gnote">' + T('farmsLoading') + '</div>'; return; }
  const all = D.farms.filter(f => f.pipe && inScope(f.iso) && layerOk(f.type));
  const cnt = [0, 0, 0, 0], mw = [0, 0, 0, 0];
  all.forEach(f => { cnt[f.st]++; mw[f.st] += f.mw; });
  let list = PL_UI.st ? all.filter(f => f.st === PL_UI.st) : all;
  if (PL_UI.q) { const q = PL_UI.q.toLowerCase(); list = list.filter(f => (f.name + ' ' + (f.zh || '') + ' ' + (f.owner || '')).toLowerCase().includes(q)); }
  const key = [S.region, S.layer, PL_UI.st, PL_UI.q, PL_UI.limit, lang, list.length].join('|');
  if (!force && key === pipeRendered) return; pipeRendered = key;
  list.sort((a, b) => a.st - b.st || (a.year || 9999) - (b.year || 9999) || b.mw - a.mw);
  const g = gemTotalsFor(S.region);
  box.innerHTML = '';
  const head = document.createElement('div'); head.className = 'phead';
  head.innerHTML = '<h4>' + esc(scopeName()) + '</h4><div class="gnote">' + T('pipeHead') + ' · ' + T('pipeInData')(cnt[1] + cnt[2] + cnt[3], fmtMW(mw[1] + mw[2] + mw[3])) + '</div>' +
    pipeBar({ construction: mw[1], preconstruction: mw[2], announced: mw[3] }) +
    (g ? '<div class="pipeh">' + T('gemTotals') + '</div><div class="gnote">' + L('營運中', 'Operating') + ' ' + fmtMW(g.operating) + '</div>' + pipeBar(g) : '') +
    '<div class="gnote" style="margin-top:6px">' + T('pipeCaveat') + '</div>';
  box.appendChild(head);
  const ctl = document.createElement('div'); ctl.style.cssText = 'display:flex;flex-direction:column;gap:6px';
  ctl.innerHTML = '<input type="search" id="g-pq" placeholder="' + esc(T('search')) + '" value="' + esc(PL_UI.q) + '"><div class="gchips">' +
    [0, 1, 2, 3].map(k => '<button type="button" data-ps="' + k + '" class="' + (PL_UI.st === k ? 'active' : '') + '">' + (k ? T('st')[k] + ' ' + cnt[k] : T('fAll')) + '</button>').join('') + '</div>';
  box.appendChild(ctl);
  const q = ctl.querySelector('#g-pq');
  q.oninput = () => { PL_UI.q = q.value.trim(); PL_UI.limit = 150; renderPipeList(true); const nq = $('g-pq'); if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); } };
  ctl.querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { PL_UI.st = +b.dataset.ps; PL_UI.limit = 150; renderPipeList(true); });
  list.slice(0, PL_UI.limit).forEach(f => {
    const d = document.createElement('button'); d.type = 'button'; d.className = 'msItem pipe';
    const c = byIso[f.iso];
    d.innerHTML = '<span class="y">' + (f.year ? esc(String(f.year)) : '—') + '</span><span class="n">' + esc(fname(f)) + '</span>' +
      '<span class="t"><span class="gtag p' + f.st + '">' + T('st')[f.st] + '</span>' + (byIso[S.region] ? '' : esc(c ? cname(c) : f.iso) + ' · ') + fmtMW(f.mw) +
      (f.owner ? ' · ' + esc(f.owner) : '') + (f.year ? '' : ' · ' + T('tbd')) + '</span>';
    d.onclick = () => selectFarm(f);
    box.appendChild(d);
  });
  if (list.length > PL_UI.limit) {
    const m = document.createElement('button'); m.type = 'button'; m.className = 'gmore'; m.textContent = T('more') + ` (${list.length - PL_UI.limit})`;
    m.onclick = () => { PL_UI.limit += 300; renderPipeList(true); }; box.appendChild(m);
  }
}
/* 國家概況：自動由資料計算＋主要國家的簡介 */
const NOTE = {
  CHN: ['全球最大的風電市場。2005 年《可再生能源法》後快速成長，在甘肅、新疆、內蒙古等地建設大型風電基地；2021 年起也是離岸風電第一大國，江蘇、廣東、福建沿海是主要場址。', "The world's largest wind market. Growth took off after the 2005 Renewable Energy Law, with giant wind bases in Gansu, Xinjiang and Inner Mongolia; since 2021 China is also the largest offshore market, led by Jiangsu, Guangdong and Fujian."],
  USA: ['1980 年代加州風潮的發源地；今日德州、愛荷華、奧克拉荷馬等中部「風帶」州是主力，聯邦生產稅額抵減（PTC）長期影響市場起伏。離岸風電起步較晚（2016 年 Block Island）。', 'Birthplace of the 1980s California wind rush; today the central "wind belt" states such as Texas, Iowa and Oklahoma dominate, and the federal Production Tax Credit has long shaped the market cycle. Offshore wind started late (Block Island, 2016).'],
  DEU: ['1991 年的饋網法與 2000 年《再生能源法》（EEG）帶動風電，1997–2007 年為全球第一；北海與波羅的海另有近 10 GW 離岸風電。', "The 1991 feed-in law and the 2000 Renewable Energy Sources Act (EEG) built the industry; Germany led the world from 1997 to 2007 and has close to 10 GW offshore in the North and Baltic seas."],
  IND: ['1986 年坦米爾納德邦 Muppandal 起步，風場集中在古吉拉特、坦米爾納德、卡納塔克、拉賈斯坦等西部與南部各邦；目前尚無商轉的離岸風場。', 'Started at Muppandal, Tamil Nadu, in 1986; farms are concentrated in western and southern states such as Gujarat, Tamil Nadu, Karnataka and Rajasthan. No offshore farm is operating yet.'],
  BRA: ['東北部（北里約格蘭德、巴伊亞、塞阿拉）風況極佳，2009 年起透過能源拍賣快速成長，陸域容量已進入全球前五。', 'The northeast (Rio Grande do Norte, Bahia, Ceará) has excellent winds; energy auctions since 2009 drove rapid growth into the global top five.'],
  ESP: ['2000 年代歐洲成長最快的風電國之一，以陸域為主；風機製造商 Gamesa（今 Siemens Gamesa）即源自西班牙。', "One of Europe's fastest-growing wind countries in the 2000s, mostly onshore; the turbine maker Gamesa (now Siemens Gamesa) is Spanish."],
  GBR: ['離岸風電的先行者，2008–2020 年離岸容量全球第一；透過差價合約（CfD）競標建成 Hornsea、Dogger Bank 等巨型風場，約一半風電容量在海上。', 'An offshore pioneer that led the world from 2008 to 2020; Contracts for Difference auctions delivered giants such as Hornsea and Dogger Bank, and about half of its wind capacity is at sea.'],
  FRA: ['陸域風電穩定成長，離岸起步較晚：2022 年第一座商轉離岸風場 Saint-Nazaire，並在地中海發展浮動式風場。', 'Steady onshore growth; offshore came later, with the first commercial farm at Saint-Nazaire in 2022 and floating projects in the Mediterranean.'],
  DNK: ['現代風電的發源地之一：Gedser、Tvind、Vindeby（1991 年世界第一座離岸風場）、Horns Rev 都在這裡，Vestas 與 Ørsted 也是丹麥企業；風電占其發電量一半以上。', 'A cradle of modern wind power: Gedser, Tvind, Vindeby (the first offshore farm, 1991) and Horns Rev are all here, as are Vestas and Ørsted; wind supplies more than half of its electricity.'],
  NLD: ['從 IJsselmeer 湖區風場到北海大型離岸風場；2018 年 Hollandse Kust Zuid 以零補貼得標。', 'From lake farms on the IJsselmeer to large North Sea projects; Hollandse Kust Zuid was won with zero subsidy in 2018.'],
  TWN: ['2000 年麥寮示範起步，2017 年第一部離岸風機併網；2025 年底離岸容量名列全球第 5，是中國以外亞洲最大的離岸市場。', "Started with the Mailiao demonstration in 2000 and connected its first offshore turbines in 2017; by the end of 2025 its offshore fleet ranked fifth in the world, Asia's largest outside China."],
  JPN: ['多山、平地少，陸域風場多在北海道與東北沿海；2022–2023 年秋田港、能代港啟動首批商業規模離岸風場，並積極發展浮動式技術。', 'Mountainous with little flat land, Japan builds onshore farms mainly on the coasts of Hokkaido and Tohoku; its first commercial-scale offshore farms at Akita and Noshiro ports started in 2022–2023, and it is investing in floating technology.'],
  KOR: ['陸域風場主要在濟州島與東部山區；政府規劃大規模離岸風電（含蔚山浮動式），多數仍在開發階段。', 'Onshore farms are mainly on Jeju and in the eastern mountains; large offshore plans (including floating wind off Ulsan) are mostly still in development.'],
  VNM: ['湄公河三角洲的潮間帶風場（如 Bac Lieu）是特色，2021 年躉購期限前出現大量搶裝。', 'Known for intertidal farms in the Mekong Delta such as Bac Lieu, with a rush of installations before the 2021 feed-in-tariff deadline.'],
  SWE: ['北部森林與山區有大型陸域風場（如 Markbygden），近十年成長快速。', 'Large onshore farms in the northern forests and uplands, such as Markbygden, have grown quickly over the past decade.'],
  AUS: ['南澳、維多利亞與新南威爾斯為主要市場；2024 年完工的 MacIntyre（923 MW）是最大的陸域風場之一。', 'South Australia, Victoria and New South Wales lead; MacIntyre (923 MW, 2024) is one of the largest onshore farms.'],
  TUR: ['愛琴海與馬爾馬拉海沿岸風況佳，近十年穩定成長。', 'Good winds along the Aegean and Marmara coasts have supported steady growth over the past decade.'],
  CAN: ['安大略、魁北克與亞伯達為主要市場，以陸域風場為主。', 'Ontario, Quebec and Alberta are the main markets, almost entirely onshore.']
};
let profYear = -1;
function sparkSVG(on, off, yi) {
  const n = on.length, w = 280, h = 56, max = Math.max(1, ...on.map((v, i) => v + off[i]));
  const X = i => i / (n - 1) * w, Y = v => h - 2 - v / max * (h - 6);
  const top = on.map((v, i) => `${X(i).toFixed(1)},${Y(v + off[i]).toFixed(1)}`), mid = on.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
  const cx = X(yi);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${h} ${mid.join(' ')} ${w},${h}" fill="#B8892F" fill-opacity=".35"/><polygon points="${mid.join(' ')} ${top.slice().reverse().join(' ')}" fill="#3B8FE0" fill-opacity=".45"/><polyline points="${top.join(' ')}" fill="none" stroke="#eaf1f8" stroke-width="1.5" vector-effect="non-scaling-stroke"/><line x1="${cx}" x2="${cx}" y1="0" y2="${h}" stroke="#f0c86a" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}
function renderProfile() {
  if (panelTab !== 'prof' || !D) return;
  const box = $('g-profBody'); profYear = Math.floor(S.year);
  const yi = clamp(profYear - Y0, 0, YEARS.length - 1), y = YEARS[yi];
  const rowsHTML = rows => '<div class="rows">' + rows.map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('') + '</div>';
  if (!byIso[S.region]) {
    const list = C.filter(inRegion);
    const on = YEARS.map((_, k) => list.reduce((s, c) => s + c.on[k], 0)), off = YEARS.map((_, k) => list.reduce((s, c) => s + c.off[k], 0));
    const top = list.slice().sort((a, b) => (b.on[yi] + b.off[yi]) - (a.on[yi] + a.off[yi])).slice(0, 5);
    box.innerHTML = `<h4>${esc(scopeName())}</h4><div class="sub">${y} · ${T('worldCap')}</div>
      <div class="big">${WW.int(on[yi] + off[yi])}<small>MW</small></div>${sparkSVG(on, off, yi)}
      ${rowsHTML([[T('profOnOff'), `${WW.int(on[yi])} / ${WW.int(off[yi])}`], ...top.map((c, k) => [`#${k + 1} ${esc(cname(c))}`, WW.int(c.on[yi] + c.off[yi])])])}
      ${pipeBlock(S.region)}
      <div class="gnote" style="margin-top:8px">${L('在「範圍」選一個國家，可看該國概況、風場與規劃中專案。', 'Pick a country in “Focus” to see its profile, farms and pipeline.')}</div>`;
    const ps0 = box.querySelector('[data-act="pipe"]'); if (ps0) ps0.onclick = e => { e.preventDefault(); setPanelTab('pipe'); };
    return;
  }
  const c = byIso[S.region];
  const rank = C.slice().sort((a, b) => (b.on[yi] + b.off[yi]) - (a.on[yi] + a.off[yi])).indexOf(c) + 1;
  const tot = c.on[yi] + c.off[yi], world = C.reduce((s, x) => s + x.on[yi] + x.off[yi], 0);
  const y10 = Math.max(0, yi - 10), tot10 = c.on[y10] + c.off[y10];
  const rows = [[T('profCap'), `${WW.int(tot)} MW`], [T('profRank'), '#' + rank], [T('profOnOff'), `${WW.int(c.on[yi])} / ${WW.int(c.off[yi])} MW`], [T('profShare'), (tot / world * 100).toFixed(2) + '%']];
  if (tot10 > 0) rows.push([T('profTen') + ` (${YEARS[y10]})`, `${WW.int(tot10)} MW · ×${(tot / tot10).toFixed(1)}`]);
  if (c.off[yi] > 0) { const ro = C.slice().sort((a, b) => b.off[yi] - a.off[yi]).indexOf(c) + 1; rows.push([L('離岸全球排名', 'Offshore rank'), '#' + ro]); }
  let farmsHTML = '';
  if (farmsReady && farmsByIso[c.iso]) {
    const fl = farmsByIso[c.iso], op = fl.filter(f => !f.pipe && farmActive(f, S.year));
    // 「最大風場」不取整區彙總列（例：新疆哈密風電基地），那不是單一座風場
    const big = op.filter(f => !AGG_RE.test(f.name)).sort((a, b) => b.mw - a.mw)[0], early = fl.filter(f => !f.pipe && !f.yu).sort((a, b) => a.year - b.year)[0];
    const fr = [[T('profFarms'), L(`${op.length} 座 · ${fmtMW(op.reduce((s, f) => s + farmMwAt(f, S.year), 0))}`, `${op.length} · ${fmtMW(op.reduce((s, f) => s + farmMwAt(f, S.year), 0))}`)]];
    if (big) fr.push([T('profLargest'), `<a href="#" data-farm="${esc(big.name)}">${esc(fname(big))}</a> · ${fmtMW(big.mw)}`]);
    if (early) fr.push([T('profEarliest'), `<a href="#" data-farm="${esc(early.name)}">${esc(fname(early))}</a> · ${early.year}`]);
    farmsHTML = rowsHTML(fr) + coverageBox(op.reduce((a, f) => a + farmMwAt(f, S.year), 0), tot);
  } else if (!farmsReady) farmsHTML = '<div class="gnote" style="margin-top:8px">' + T('farmsLoading') + '</div>';
  const note = NOTE[c.iso] ? `<div class="blurb">${esc(NOTE[c.iso][lang === 'en' ? 1 : 0])}</div>` : '';
  let live = intlProfileBox(c.iso);
  if (c.iso === 'TWN' && WW.live) {
    const Tt = WW.live.totals();
    live = `<div class="livebox">🌬 ${T('liveNow')}：<b>${WW.int(Tt.total)} MW</b>（${WW.live.isLive() ? L('台電', 'Taipower') + ' ' + WW.live.fmtSrc(WW.live.srcTime()) : L('模擬', 'simulated')}）· ${T('availability')} ${(Tt.ratio * 100).toFixed(1)}%</div>`;
  }
  box.innerHTML = `<h4>${esc(cname(c))}</h4><div class="sub">${esc(T('cont')[c.cont] || c.cont)} · ${y}</div>
    <div class="big">${WW.int(tot)}<small>MW</small></div>${sparkSVG(c.on, c.off, yi)}${rowsHTML(rows)}${auditBox(c.iso)}${live}${note}${farmsHTML}${pipeBlock(c.iso)}
    <div class="acts"><button type="button" data-act="tour">${T('tourCountry')}</button><button type="button" data-act="farms">${T('seeFarms')}</button>${c.iso === 'TWN' ? `<a href="#/live">${T('seeLive')}</a>` : ''}</div>`;
  box.querySelectorAll('[data-farm]').forEach(a => a.onclick = e => { e.preventDefault(); const f = D.farms.find(x => x.name === a.dataset.farm && x.iso === c.iso); if (f) selectFarm(f); });
  box.querySelector('[data-act="tour"]').onclick = () => tourStart();
  box.querySelector('[data-act="farms"]').onclick = () => setPanelTab('farms');
  const ps1 = box.querySelector('[data-act="pipe"]'); if (ps1) ps1.onclick = e => { e.preventDefault(); setPanelTab('pipe'); };
}
/* 逐場資料覆蓋率：已逐場標示的營運中容量 ÷ 國家年底統計；差額明白列出，不補虛構風場 */
function coverageBox(mapped, national) {
  if (!national) return '';
  const pct = mapped / national * 100;
  return '<div class="cov"><div class="covh"><span>' + T('coverage') + '</span><b>' + pct.toFixed(0) + '%</b></div>' +
    '<div class="covr" role="img" aria-label="' + T('coverage') + ' ' + pct.toFixed(0) + '%"><i style="width:' + Math.min(100, pct).toFixed(1) + '%"></i></div>' +
    '<div class="covm"><span>' + T('covMapped') + ' ' + fmtMW(mapped) + '</span><span>' + (pct > 100.5 ? T('covOver') : T('covGap') + ' ' + fmtMW(Math.max(0, national - mapped))) + '</span></div></div>';
}
/* 台灣、日本：官方統計稽核標記與來源 */
function auditBox(iso) {
  const a = D.audit && D.audit[iso]; if (!a) return '';
  const zh = lang === 'zh';
  return '<div class="audit"><b>✓ ' + esc(zh ? a.badgeZh : a.badgeEn) + '</b> · ' + esc(zh ? a.periodZh : a.periodEn) +
    '<div class="gnote" style="margin-top:3px">' + esc(zh ? a.methodZh : a.methodEn) + '</div><div class="alinks">' +
    (a.sources || []).map(x => '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name) + '</a>').join('') + '</div></div>';
}
/* 規劃中區塊：逐案資料合計＋GEM 2026-02 總量 */
function pipeBlock(region) {
  if (!farmsReady) return '';
  const fl = D.farms.filter(f => f.pipe && inScope(f.iso, region));
  const n = fl.length, mw = fl.reduce((a, f) => a + f.mw, 0);
  const g = gemTotalsFor(region);
  if (!n && !(g && (g.construction || g.preconstruction || g.announced))) return '';
  return '<div class="pipeh">' + T('gemTotals') + '</div>' + (g ? pipeBar(g) : '') +
    '<div class="gnote" style="margin-top:4px">' + T('pipeInData')(n, fmtMW(mw)) + ' · <a href="#" data-act="pipe">' + T('pipeSee') + '</a></div>';
}

/* ================= bar chart race（MW） ================= */
const rowEls = {}; const NBAR = 15;
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const m = v / p; const n = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => m <= x); return n * p; }
function updateBars(force) {
  if (S.view === 'map' && !force) return;
  const barsEl = $('g-bars'), axisEl = $('g-axis');
  const scoped = S.region === 'WORLD' || !S.region.startsWith('C:') ? C : C.filter(inRegion);
  const all = scoped.map(c => ({ c, cap: capOf(c, S.year) })).filter(r => r.cap.tot > 0.5).sort((a, b) => b.cap.tot - a.cap.tot);
  all.forEach((r, i) => r.rank = i + 1);
  const NB = clamp(Math.floor((barsEl.clientHeight - 22) / 19) - 2, 5, NBAR);   // 窄螢幕自動減少列數
  $('g-barScope').textContent = (S.region.startsWith('C:') ? T('inRegion') : T('top15'))(NB);
  const rows = all.slice(0, NB);
  const extra = iso => { if (!rows.some(r => r.c.iso === iso)) { const r = all.find(r => r.c.iso === iso); if (r) rows.push(r); } };
  if (byIso[S.region]) extra(S.region);
  extra('TWN');
  const maxV = niceMax(rows.length ? rows[0].cap.tot * 1.05 : 1);
  const nRows = Math.max(NB, rows.length);
  const AX = 18;                                  // 上方留給軸標籤
  const rowH = Math.max(18, Math.min(34, (barsEl.clientHeight - 4 - AX) / (nRows + 1)));
  $('g-barYear').textContent = Math.floor(S.year);
  let ax = ''; for (let i = 1; i <= 4; i++) { ax += '<div style="left:' + (i * 25) + '%">' + fmtAxis(maxV * i / 4) + '</div>'; }
  axisEl.innerHTML = ax;
  const seen = new Set();
  rows.forEach((r, i) => {
    seen.add(r.c.iso);
    let el = rowEls[r.c.iso];
    if (!el) { el = document.createElement('div'); el.className = 'brow'; el.innerHTML = '<div class="nm"><small></small><span></span></div><div class="bar"><i class="on"></i><i class="off"></i></div><div class="val"></div>';
      el.style.transform = 'translateY(' + (AX + nRows * rowH + 20) + 'px)'; el.style.opacity = 0; barsEl.appendChild(el); rowEls[r.c.iso] = el;
      const c = r.c;
      el.onmouseenter = ev => showTip(ev, tipCountry(c), $('g-barPane')); el.onmousemove = ev => moveTip(ev, $('g-barPane')); el.onmouseleave = hideTip;
      el.onclick = () => { if (S.view === 'bars' && renderer) setView('split'); setRegion(c.iso); }; }
    el.style.height = rowH + 'px';
    el.querySelector('.nm small').textContent = r.rank; el.querySelector('.nm span').textContent = cname(r.c);
    el.querySelector('i.on').style.width = (r.cap.on / maxV * 100) + '%'; el.querySelector('i.off').style.width = (r.cap.off / maxV * 100) + '%';
    el.querySelector('i.off').style.display = r.cap.off > 0.5 ? 'block' : 'none';
    el.querySelector('.val').textContent = fmtMW(r.cap.tot);
    el.classList.toggle('sel', S.region === r.c.iso);
    el.classList.toggle('tw', r.c.iso === 'TWN');
    const slot = i < NB ? i : NB + 0.4 + (i - NB);
    requestAnimationFrame(() => { el.style.transform = 'translateY(' + (AX + slot * rowH) + 'px)'; el.style.opacity = 1; });
  });
  Object.keys(rowEls).forEach(iso => { if (!seen.has(iso)) { const el = rowEls[iso]; el.style.transform = 'translateY(' + (AX + nRows * rowH + 20) + 'px)'; el.style.opacity = 0; } });
}

/* ================= Wikipedia lookup (photo, summary, link) ================= */
const wikiCache = {};
const STOP_EN = new Set(['wind', 'farm', 'farms', 'offshore', 'onshore', 'park', 'windpark', 'project', 'energy', 'power', 'the', 'and', 'phase', 'turbine', 'turbines', 'prototype', 'centre', 'center', 'station', 'parque', 'eolico', 'eólico', 'windfarm', 'demo', 'demonstrator', 'ltd', 'gmbh', 'co', 'kg', 'plant']);
function titleMatch(q, title) {
  const t = title.toLowerCase();
  if (/[一-鿿]/.test(q)) {
    const core = q.replace(/[（(].*?[)）]/g, '').replace(/離岸|离岸|海上|陸域|陆域|風力發電|风力发电|風電|风电|風場|风场|發電|发电|計畫|计划|項目|项目|[一二三四五]期|第|階段|示範|示范/g, '');
    for (let i = 0; i < core.length - 1; i++) { if (t.includes(core.slice(i, i + 2))) return true; }
    return false;
  }
  const toks = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP_EN.has(w) && !/^\d+$/.test(w));
  if (!toks.length) return false;
  const tt = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const hit = toks.filter(w => tt.includes(w)).length;
  return hit >= Math.max(1, Math.ceil(toks.length * 0.5));
}
async function wikiSearch(hostName, q) {
  const clean = q.replace(/\(.*?\)|（.*?）/g, ' ').replace(/\s+/g, ' ').trim();
  const sq = hostName === 'en' && !/wind|turbine|farm|park/i.test(clean) ? clean + ' wind' : clean;
  const url = 'https://' + hostName + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=4&gsrsearch=' + encodeURIComponent(sq) +
    '&prop=pageimages%7Cextracts%7Cinfo%7Cpageprops&ppprop=wikibase_item&piprop=thumbnail&pithumbsize=520&exintro=1&explaintext=1&exsentences=3&inprop=url&redirects=1' + (hostName === 'zh' ? '&variant=zh-tw' : '');
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctl.signal }); const j = await res.json();
    const pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index);
    for (const p of pages) { if (titleMatch(clean, p.title)) return { title: p.title, url: hostName === 'zh' ? 'https://zh.wikipedia.org/zh-tw/' + encodeURIComponent(p.title.replace(/ /g, '_')) : (p.fullurl || ('https://en.wikipedia.org/wiki/' + encodeURIComponent(p.title))), extract: p.extract || '', thumb: p.thumbnail && p.thumbnail.source, host: hostName, qid: p.pageprops && p.pageprops.wikibase_item }; }
  } finally { clearTimeout(to); }
  return null;
}
function wikiLookup(it) {
  const key = lang + '|' + it.name;
  if (wikiCache[key]) return wikiCache[key];
  const tries = [];
  if (lang === 'zh' && it.zh) tries.push(['zh', it.zh]);
  tries.push(['en', it.name.replace(/ · .*$/, '')]);
  if (lang !== 'zh' && it.zh) tries.push(['zh', it.zh]);
  wikiCache[key] = (async () => { let net = false; for (const [h, q] of tries) { try { const r = await wikiSearch(h, q); if (r) return r; } catch (e) { net = true; } } if (net) delete wikiCache[key]; return net ? 'ERR' : null; })();
  return wikiCache[key];
}

/* ================= items (farm / milestone) and info card ================= */
const noteOf = f => f && f.note ? (lang === 'en' ? (f.note[1] || f.note[0]) : (f.note[0] || f.note[1])) : '';
const posNote = f => !f || f.pseudo ? '' : f.nStack ? T('posStack').replace('{n}', f.nStack - 1) : (f.flags & 1) ? T('posApprox') : '';
function farmItem(f, why) { return { kind: 'farm', f, name: f.name, zh: f.zh, lat: f.lat0 != null ? f.lat0 : f.lat, lon: f.lon0 != null ? f.lon0 : f.lon, year: f.year, end: f.end, type: f.type, mw: f.mw, turbine: f.turbine, owner: f.owner, iso: f.iso, why }; }
function msPseudoFarm(m) {
  let best = null, bs = 0;
  for (const f of D.farms) {
    if (f.iso !== m.iso || f.pipe || Math.abs(f.lat - m.lat) > 0.3 || Math.abs(f.lon - m.lon) > 0.3) continue;
    const nm = titleMatch(f.name, m.name) || titleMatch(m.name, f.name);
    const dy = Math.abs(f.year - m.year), dd = Math.hypot(f.lat - m.lat, f.lon - m.lon);
    let sc = 0;
    if (nm && dy <= 3) sc = 10 - dy; else if (dy <= 1 && dd < 0.12) sc = 3 - dy;
    if (f.src === 0) sc += 0.5;
    if (sc > bs) { bs = sc; best = f; }
  }
  if (best) return best;
  if (!m._pf) { const n = (m.farm && m.mw) ? Math.max(1, Math.round(m.farm / m.mw)) : 1;
    m._pf = { name: m.name, iso: m.iso, lat: m.lat, lon: m.lon, mw: m.farm || m.mw || 1, year: Math.max(m.year, Y0 - 1), type: m.type, turbine: (n > 1 ? n + ' x ' : '') + (m.mw ? m.mw + ' MW' : ''), _n: n, _unit: m.mw || null, pseudo: true, st: 0 }; }
  return m._pf;
}
function msStop(m) { return { kind: 'ms', m, name: m.name, zh: null, lat: m.lat, lon: m.lon, year: m.year, type: m.type, iso: m.iso, farm: farmsReady ? msPseudoFarm(m) : null }; }
let cardItem = null;
/* ================= 澳洲、加拿大即時出力（intl_wind_scraper.py 約每 2 小時更新 data/live/intl_realtime.json） ================= */
// 超過 LIVE_STALE_MS 的電網資料不再疊到風場上：排程約每 2 小時，容許漏跑一兩次（安大略的資料本身還晚約 1 小時）
const INTL_URL = 'data/live/intl_realtime.json', LIVE_HEX = 0x3fdcb0, LIVE_STALE_MS = 6 * 3600e3;
const GRID_TZ = { AEMO: 'Australia/Brisbane', AESO: 'America/Edmonton', IESO: 'America/Toronto' };
const GRID_SRC = { AEMO: 'https://nemweb.com.au/Reports/Current/Dispatch_SCADA/', AESO: 'http://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet',
  IESO: 'https://reports-public.ieso.ca/public/GenOutputCapability/PUB_GenOutputCapability.xml' };
let INTL = null, intlByKey = new Map(), intlTimer = null, liveSeen = false;
function loadIntl() {
  return WW.getLiveJSON(INTL_URL).then(j => {
    if (!j || !j.grids) return;
    INTL = j; intlByKey = new Map((j.farms || []).map(x => [x.iso + '|' + x.name, x]));
    liveChanged();
  }).catch(() => { /* 沒有即時檔或離線：不顯示即時資訊 */ });
}
function liveChanged() {
  farmLayerDirty = true;
  if (!active || !farmsReady) return;
  if (panelTab === 'prof' && (S.region === 'AUS' || S.region === 'CAN' || S.region === 'TWN')) renderProfile();
  if (panelTab === 'farms') renderFarmList(true);
  refreshLiveBox();
}
const liveOn = () => S.year >= Y1 - 0.02;                                   // 時間軸在最新年份時才疊上「此刻」
const gridFresh = g => !!g && g.ok !== false && Date.now() - Date.parse(g.time) < LIVE_STALE_MS;
const spinOf = x => { const cf = x.cap ? clamp(x.mw / x.cap, 0, 1) : 0; return cf < 0.01 ? 0 : 0.25 + 1.75 * cf; };
/* 一座風場此刻的出力；沒有即時資料時為 null。台灣來自台電，澳洲、加拿大來自各電網 */
function liveFor(f) {
  if (!f) return null;
  if (f.iso === 'TWN') {
    if (!WW.live || !WW.live.isLive()) return null;
    const units = WW.live.unitsForGlobalFarm(f.name); if (!units.length) return null;
    return { mw: units.reduce((s, u) => s + (WW.live.RT[u.id] || 0), 0), cap: units.reduce((s, u) => s + (u.cap || 0), 0), grid: 'TPC' };
  }
  const x = INTL && intlByKey.get(f.iso + '|' + f.name);
  return x && gridFresh(INTL.grids[x.grid]) ? x : null;
}
function gridName(g) { return ({ AEMO: L('澳洲東部電網（AEMO）', 'Australia NEM (AEMO)'), AESO: L('亞伯達（AESO）', 'Alberta (AESO)'), IESO: L('安大略（IESO）', 'Ontario (IESO)') })[g] || g; }
function gridRes(g) { return ({ '5min': L('每 5 分鐘實測', 'measured every 5 min'), snapshot: L('約 1 分鐘的即時值', 'real-time value (~1 min)'), hourly: L('每小時平均', 'hourly average') })[g.res] || ''; }
function gridTime(key, g) {
  const t = new Date(g.time), mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  let local = '';
  try { local = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'zh-TW', { timeZone: GRID_TZ[key], month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(t); } catch (e) { local = g.time; }
  const zone = ({ AEMO: L('澳洲東部時間', 'AEST'), AESO: L('亞伯達時間', 'Alberta time'), IESO: L('安大略時間', 'Ontario time') })[key] || '';
  const ago = mins < 90 ? L(mins + ' 分鐘前', mins + ' min ago') : L(Math.round(mins / 60) + ' 小時前', Math.round(mins / 60) + ' h ago');
  return `${local}（${zone}，${ago}）`.replace('（', lang === 'en' ? ' (' : '（').replace('，', lang === 'en' ? ', ' : '，').replace('）', lang === 'en' ? ')' : '）');
}
function gridNotice(key) { return INTL && INTL.notice && INTL.notice[key] ? '<div class="gnote lic">' + esc(INTL.notice[key]) + '</div>' : ''; }
function liveSpark(pts, cap) {
  if (!pts || pts.length < 2) return '';
  const W = 250, H = 36, t0 = Date.parse(pts[0][0]), t1 = Date.parse(pts[pts.length - 1][0]) || t0 + 1, ym = Math.max(cap || 0, ...pts.map(p => p[1])) || 1;
  const xy = pts.map(p => [((Date.parse(p[0]) - t0) / (t1 - t0 || 1)) * W, H - 2 - (p[1] / ym) * (H - 4)]);
  const last = xy[xy.length - 1];
  return `<svg class="lspark" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(L('過去 48 小時風電出力', 'Wind output, last 48 hours'))}"><polyline fill="none" stroke="var(--live)" stroke-width="1.5" points="${xy.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.5" fill="var(--live)"/></svg>`;
}
/* 國家概況：澳洲、加拿大此刻的風電總出力（各電網）與 48 小時趨勢 */
function intlProfileBox(iso) {
  if (!INTL || (iso !== 'AUS' && iso !== 'CAN')) return '';
  const keys = Object.keys(INTL.grids).filter(k => INTL.grids[k].iso === iso);
  if (!keys.length) return '';
  const rows = keys.map(k => {
    const g = INTL.grids[k], fresh = gridFresh(g);
    return `<div class="lrow"><div>${esc(gridName(k))}${L('：', ': ')}<b>${fresh ? WW.int(g.mw) + ' MW' : L('資料延遲', 'delayed')}</b>` +
      (fresh && g.cap_listed ? ` · ${L('約為已登錄容量 ' + fmtMW(g.cap_listed) + ' 的 ', 'about ')}${(g.mw / g.cap_listed * 100).toFixed(0)}%${L('', ' of ' + fmtMW(g.cap_listed) + ' registered')}` : '') +
      `</div><div class="gnote">${esc(gridRes(g))} · ${esc(gridTime(k, g))}</div>${liveSpark(INTL.hist && INTL.hist[k], g.cap_listed)}</div>`;
  }).join('');
  const other = iso === 'AUS' ? L('西澳與北領地不在東部電網，沒有即時資料。', 'Western Australia and the Northern Territory are outside the NEM and have no live data here.')
    : L('其他省份沒有公開的即時資料。', 'Other provinces publish no live data.');
  return `<div class="livebox intl">🌬 ${T('liveNow')}${rows}<div class="gnote">${other} ${L('地圖上綠色外圈的風場有即時資料。', 'Farms with a green ring on the map have live data.')}</div>${keys.map(gridNotice).join('')}</div>`;
}
function liveBoxFor(f) {
  if (f.iso === 'AUS' || f.iso === 'CAN') {
    const x = liveFor(f);
    if (!x) return INTL && !f.pipe ? '<div class="livebox none" data-live><span class="gnote">' + L('這座風場沒有公開的即時資料（目前只有澳洲東部電網、亞伯達與安大略的風場有）。', 'No live data for this farm (only farms on Australia’s NEM, in Alberta and in Ontario have it).') + '</span></div>' : '';
    const g = INTL.grids[x.grid], pct = x.cap ? (x.mw / x.cap * 100).toFixed(0) : null;
    return `<div class="livebox" data-live>🌬 ${T('liveNow')}${L('：', ': ')}<b>${WW.num(x.mw, x.mw < 100 ? 1 : 0)} MW</b>${pct != null ? ` · ${L('約為裝置容量的 ' + pct + '%', pct + '% of capacity')}` : ''}` +
      `<br><span class="gnote">${esc(gridName(x.grid))} · ${esc(gridRes(g))} · ${esc(gridTime(x.grid, g))}${x.est ? '<br>' + esc(L('一個發電機組涵蓋數座風場，依容量比例估算。', 'One grid unit covers several farms; split by capacity (estimate).')) : ''}</span>` +
      gridNotice(x.grid) + `<div class="links" style="margin-top:6px"><a href="${esc(GRID_SRC[x.grid])}" target="_blank" rel="noopener">${T('lnkSrc')} ↗</a></div></div>`;
  }
  if (!WW.live || f.iso !== 'TWN') return '';
  const units = WW.live.unitsForGlobalFarm(f.name); if (!units.length) return '';
  const out = units.reduce((s, u) => s + (WW.live.RT[u.id] || 0), 0), cap = units.reduce((s, u) => s + (u.cap || 0), 0);
  const when = WW.live.isLive() ? L('台電', 'Taipower') + ' ' + WW.live.fmtSrc(WW.live.srcTime()) : L('模擬', 'simulated');
  return `<div class="livebox" data-live>🌬 ${T('liveNow')}：<b>${out.toFixed(1)} MW</b>${cap ? ` · ${T('availability')} ${(out / cap * 100).toFixed(0)}%` : ''}<br><span class="gnote">${esc(units.map(u => u.tp).join(' + '))} · ${esc(when)}</span>
    <div class="links" style="margin-top:6px"><a href="#/live?farm=${esc(units[0].id)}">${T('liveSee')} →</a></div></div>`;
}
/* ================= 風場詳情：國內地位、分期、附近與同開發商風場、更多連結、回報錯誤、複製連結 ================= */
const REPO_URL = 'https://github.com/dofliu/windfarmTaiwan';
const NEAR_KM = 30, REL_SHOW = 6, REL_CAP = 60;
function kmBetween(la1, lo1, la2, lo2) {
  const s1 = Math.sin((la2 - la1) * D2R / 2), s2 = Math.sin((lo2 - lo1) * D2R / 2);
  return 12742 * Math.asin(Math.min(1, Math.sqrt(s1 * s1 + Math.cos(la1 * D2R) * Math.cos(la2 * D2R) * s2 * s2)));
}
/* 30 km 內的其他風場（跨國也算，依距離排序）；共用代用座標的紀錄位置不實：不替它找附近，也不列進別人的附近 */
function nearbyFarms(f) {
  if (f.pseudo || f.nStack) return null;
  const dLat = NEAR_KM / 111, dLon = dLat / Math.max(0.05, Math.cos(f.lat * D2R)), out = [];
  for (const g of D.farms) {
    if (g === f || g.nStack || Math.abs(g.lat - f.lat) > dLat) continue;
    const dl = Math.abs(g.lon - f.lon); if (Math.min(dl, 360 - dl) > dLon || isAgg(g)) continue;
    const km = kmBetween(f.lat, f.lon, g.lat, g.lon);
    if (km <= NEAR_KM) out.push({ g, km });
  }
  return out.sort((a, b) => a.km - b.km);
}
/* 同開發商：業主欄位（GEM、GPPD、精選清單）寫法不一，比對前先正規化——去重音、括號與公司型態字尾（Co Ltd、A/S…），
   再去掉「能源、電力、國名」這類泛稱字尾，但剩下的字若全是泛稱或地名就停（Shanghai Electric Power 不會縮成 Shanghai）；
   幾個常見集團的不同寫法另外對照（例：China Three Gorges／Three Gorges）。
   build_farms.py 把業主截在 60 字，被截斷的最後一段只比對開頭。寧可少配，不要配錯。 */
const OWN_LEGAL = new Set('co ltd limited inc incorporated llc lp llp plc corp corporation company sa ag se ab as asa ps aps gmbh bv nv spa srl sas sl slu sau oy oyj pty kk group holding holdings jsc pjsc bhd sdn pte tbk ltda sarl kg cv'.split(' '));
const OWN_WEAK = new Set(('energy energia energie power renewable renewables renovables wind windkraft windenergie vindkraft vind eolica eolico eolien eolienne solar offshore onshore ' +
  'green clean new investment investments development generation resources electric electricity capital international global ' +
  'taiwan japan korea china uk usa us america americas north europe germany deutschland france italia italy spain espana portugal polska poland greece hellas ' +
  'sweden sverige norway norge denmark danmark finland netherlands nederland belgium ireland australia canada brasil brazil mexico chile india vietnam philippines turkey romania').split(' '));
const OWN_PLACE = new Set(('state national provincial municipal city county province region inner mongolia anhui beijing chongqing fujian gansu guangdong guangxi guizhou hainan hebei heilongjiang ' +
  'henan hubei hunan jiangsu jiangxi jilin liaoning ningxia qinghai shaanxi shandong shanghai shanxi sichuan tianjin tibet xinjiang yunnan zhejiang hong kong').split(' '));
const OWN_PREFIX = [['taiwan power', 'taipower'], ['copenhagen infrastructure', 'cip'], ['china three gorges', 'three gorges'], ['china resources', 'china resources'], ['huarun', 'china resources'],
  ['state power investment', 'spic'], ['china general nuclear', 'cgn'], ['china guangdong nuclear', 'cgn'], ['china longyuan', 'longyuan'], ['china datang', 'datang'], ['china huadian', 'huadian'],
  ['china huaneng', 'huaneng'], ['china energy investment', 'china energy'], ['dong energy', 'orsted']];
const OWN_ALIAS = { cip: 'cip', dong: 'orsted' };
const ownGeneric = t => OWN_WEAK.has(t) || OWN_PLACE.has(t) || t.length < 3;
function ownerParts(f) {
  if (f._own) return f._own;
  const raw = f.owner || '', cut = raw.length >= 60 && !raw.endsWith('…'), seen = new Set();
  const segs = raw.replace(/…$/, '').split(/\s*;\s*|\s+\/\s+/).filter(Boolean);
  f._own = segs.map((seg, i) => {
    let w = (/[^\x00-\x7f]/.test(seg) ? seg.normalize('NFD').replace(/[̀-ͯ]/g, '') : seg).toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/ł/g, 'l').replace(/đ/g, 'd')
      .replace(/\([^)]*\)?/g, ' ').replace(/\b([a-z])\/([a-z])\b/g, '$1$2').replace(/[.'’]/g, '').replace(/windpower/g, 'wind power').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
    if (w[0] === 'the') w.shift();
    const rawKey = w.join(' ');
    if (!rawKey) { const k = seg.replace(/[^぀-ヿ㐀-鿿가-힯]/g, ''); return k.length >= 2 ? { label: seg.trim(), key: k, raw: k, trunc: false } : null; }
    if (/^(unknown|n a|na|none|other|others|various)$/.test(rawKey)) return null;
    const pre = OWN_PREFIX.find(([x]) => rawKey === x || rawKey.startsWith(x + ' '));
    let key;
    if (pre) key = pre[1];
    else {
      let weak = false;
      while (w.length > 1) {
        const last = w[w.length - 1];
        if (OWN_LEGAL.has(last)) { w.pop(); continue; }
        if (!OWN_WEAK.has(last) || w.slice(0, -1).every(ownGeneric)) break;     // 剩下的字全是泛稱或地名：停
        w.pop(); weak = true;
      }
      if (w[0] === 'china' && w.length > 1 && !ownGeneric(w[1])) w.shift();   // China Longyuan＝Longyuan
      key = w.join(' ');
      if (weak && key.length < 3) key = rawKey;                                   // 去掉泛稱後只剩兩三個字母：不拿來比
      key = OWN_ALIAS[key] || key;
    }
    return { label: seg.trim(), key, raw: rawKey, trunc: cut && i === segs.length - 1 };
  }).filter(p => p && !seen.has(p.key) && seen.add(p.key));
  return f._own;
}
/* 正規化全部業主約需 0.1 秒（手機更久）：風場資料載入後利用瀏覽器空檔先算好，第一次開卡片才不會卡頓 */
function warmOwners() {
  const list = D.farms.filter(f => f.owner && !f._own);
  const idle = window.requestIdleCallback ? fn => requestIdleCallback(fn, { timeout: 1000 })      // 繪圖迴圈一直忙時也至少每秒做一小段
    : fn => setTimeout(() => { const t = performance.now(); fn({ timeRemaining: () => 8 - (performance.now() - t) }); }, 60);
  let i = 0;
  const step = dl => {
    do { for (const e = Math.min(list.length, i + (dl.didTimeout ? 1000 : 200)); i < e; i++) ownerParts(list[i]); } while (i < list.length && dl.timeRemaining() > 2);
    if (i < list.length) idle(step);
  };
  idle(step);
}
const ownerMatch = (a, b) => a.key === b.key || (a.trunc && a.raw.length >= 12 && b.raw.startsWith(a.raw)) || (b.trunc && b.raw.length >= 12 && a.raw.startsWith(b.raw));
function sameOwnerLists(f) {
  const res = ownerParts(f).slice(0, 2).map(p => ({ p, list: [] }));
  if (!res.length) return res;
  for (const g of D.farms) {
    if (g === f || !g.owner || isAgg(g)) continue;
    const gp = ownerParts(g);
    for (const r of res) if (gp.some(q => ownerMatch(r.p, q))) r.list.push(g);
  }
  res.forEach(r => r.list.sort((a, b) => (b.iso === f.iso) - (a.iso === f.iso) || b.mw - a.mw));
  return res.filter(r => r.list.length);
}
/* 國內地位：以時間軸年份（年底）計，已除役的以最後運轉的一年；排名只比本站收錄的逐場紀錄（不含整區彙總），
   占比的分母是國家年底累計裝置容量（台灣＝能源署、日本＝JWPA、其他＝IRENA） */
function rankYear(f) {
  let y = Math.min(Y1, Math.floor(S.year + 1e-6));
  if (f.end && y >= f.end) y = f.end - 1;
  return Math.max(y, f.year);
}
const phaseDone = (f, p) => !f.pipe && (!p[0] || p[0] - BUILD <= S.year);
const cardYearKeyOf = f => rankYear(f) + '|' + (f.ph ? f.ph.filter(p => phaseDone(f, p)).length : 0);
function rankHTML(f) {
  if (!farmsReady || f.pseudo || isAgg(f)) return '';
  const c = byIso[f.iso], cn = c ? cname(c) : L('該國', 'this country');     // 沒有國家統計的地區（例：波士尼亞）只列排名
  const all = (farmsByIso[f.iso] || []).filter(g => !isAgg(g));
  const tile = (big, small) => '<div><b>' + esc(big) + '</b><span>' + esc(small) + '</span></div>';
  if (f.pipe) {
    const pl = all.filter(g => g.pipe);
    return pl.length < 2 ? '' : '<div class="fh">' + esc(T('rankHeadPipe')) + '</div><div class="ftiles">' + tile(T('rankNo')(1 + pl.filter(g => g.mw > f.mw).length), T('rankOfPipe')(cn, pl.length)) + '</div>';
  }
  const y = rankYear(f), mw = farmMwAt(f, y), isOff = t => t !== 'onshore';
  const act = all.filter(g => !g.pipe && farmActive(g, y)), same = act.filter(g => isOff(g.type) === isOff(f.type));
  const above = list => list.filter(g => farmMwAt(g, y) > mw).length;
  const tiles = [];
  if (act.length >= 2) {
    let small = T('rankOf')(cn, act.length);
    if (same.length >= 3 && same.length < act.length) small += L('；', ' · ') + T('rankType')(T('type')[isOff(f.type) ? 'offshore' : 'onshore'], 1 + above(same));
    tiles.push(tile(T('rankNo')(1 + above(act)), small));
  }
  const i = y - Y0, nat = c && i >= 0 ? (c.on[i] || 0) + (c.off[i] || 0) : 0;
  if (nat > 0 && mw > 0 && mw <= nat) { const p = mw / nat * 100; tiles.push(tile((p >= 10 ? Math.round(p) : p >= 0.1 ? p.toFixed(1) : '<0.1') + '%', T('shareOf')(cn))); }
  return tiles.length ? '<div class="fh">' + esc(T('rankHead')(y)) + '</div><div class="ftiles">' + tiles.join('') + '</div>' : '';
}
/* 分期時間軸（兩期以上）：每一期一列，長條接在前一期之後（累積到全場容量）；時間軸年份還沒完工的一期畫成虛線框 */
function phaseHTML(f) {
  if (!f.ph || f.ph.length < 2) return '';
  const tot = f.ph.reduce((s, p) => s + p[1], 0) || 1, cls = f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'fl' : 'off';
  let cum = 0;
  const rows = f.ph.map(p => {
    const x = cum / tot * 100, w = p[1] / tot * 100; cum += p[1];
    return '<li' + (phaseDone(f, p) ? '' : ' class="todo"') + '><span class="y">' + (p[0] || '?') + '</span><span class="tr"><i class="' + cls + '" style="left:' + x.toFixed(2) + '%;width:' + Math.max(w, 1.5).toFixed(2) + '%"></i></span><span class="v">+' + esc(fmtMW(p[1])) + '</span></li>';
  }).join('');
  return '<div class="fh">' + esc(T('phTitle')) + '</div><ul class="fphase" role="list">' + rows + '</ul>';
}
let cardYearKey = '';
function refreshCardYear() {                 // 時間軸年份改變：只重畫國內地位與分期（不動卡片其他部分與捲動位置）
  const f = cardItem && cardItem.kind === 'farm' ? cardItem.f : null;
  if (!f || f.pseudo) return;
  const k = cardYearKeyOf(f); if (k === cardYearKey) return; cardYearKey = k;
  const card = $('g-infoCard'), a = card.querySelector('.fstat'), b = card.querySelector('.fphw');
  if (a) a.innerHTML = rankHTML(f);
  if (b) b.innerHTML = phaseHTML(f);
}
/* 可點選的風場清單（附近、同開發商）：連結本身就是深連結，可另開分頁；一般點選則直接切換卡片 */
let relFarms = [];
function relItem(g, f, km) {
  const i = relFarms.push(g) - 1;
  const when = g.pipe ? (g.year ? T('expected') + ' ' + g.year : T('tbd')) : g.yu ? T('yearUnknown') : g.year + (g.end ? '–' + g.end : '');
  const bits = [fmtMW(g.mw), String(when)];
  if (g.iso !== f.iso && byIso[g.iso]) bits.push(cname(byIso[g.iso]));
  if (km != null) bits.push((km < 10 ? km.toFixed(1) : Math.round(km)) + ' km');
  return '<li><a href="' + esc(WW.hashFor('global', null, { r: byIso[g.iso] ? g.iso : null, f: g.name })) + '" data-rel="' + i + '"><span class="n">' + esc(fname(g)) + '</span><span class="m">' +
    '<span class="gtag ' + stCls(g) + '">' + (g.pipe || g.st === 4 ? T('st')[g.st] : T('type')[g.type]) + '</span>' + esc(bits.join(' · ')) + '</span></a></li>';
}
function relSection(key, title, list, f, withKm, note) {
  const shown = list.slice(0, REL_CAP), open = WW.store.get('ww_card_' + key, '1') === '1';
  return '<details class="frel" data-k="' + key + '"' + (open ? ' open' : '') + '><summary>' + esc(title) + '<span class="cnt">' + list.length + '</span></summary>' +
    '<ul' + (shown.length > REL_SHOW ? ' class="clip"' : '') + '>' + shown.map(x => withKm ? relItem(x.g, f, x.km) : relItem(x, f)).join('') + '</ul>' +
    (shown.length > REL_SHOW ? '<button type="button" class="frmore">' + esc(T('relMore')(shown.length)) + '</button>' : '') +
    (list.length > REL_CAP ? '<div class="gnote">' + esc(T('relCap')(list.length - REL_CAP)) + '</div>' : '') + (note ? '<div class="gnote">' + esc(note) + '</div>' : '') + '</details>';
}
/* 深連結（複製連結、回報錯誤用）：單檔版一律指向正式網站 */
function itemLink(it) {
  const p = { r: byIso[it.iso] ? it.iso : null };
  if (it.kind === 'ms') p.ms = it.m.name; else p.f = it.f.name;
  return WW.pageURL(WW.hashFor('global', null, p));
}
/* 「回報資料錯誤」：開一則預填好的 GitHub issue（標題與欄位中英並列，方便維護者與回報者） */
function reportURL(it) {
  const f = it.f, c = byIso[it.iso], Z = I18N.zh, E = I18N.en;
  const both = (z, e) => z === e ? z : z + ' / ' + e;
  const rows = [
    (it.kind === 'ms' ? '里程碑 Milestone' : '風場 Farm') + ': ' + it.name + (it.zh ? ' / ' + it.zh : ''),
    '國家 Country: ' + (c ? c.zh + ' / ' + c.name : (it.iso || '—')),
    '座標 Coordinates: ' + (+it.lat).toFixed(4) + ', ' + (+it.lon).toFixed(4) + (f && f.nStack ? '（共用代用座標 shared placeholder point）' : f && (f.flags & 1) ? '（概略位置 approximate）' : '')
  ];
  if (f && !f.pseudo) {
    rows.push('容量 Capacity: ' + f.mw + ' MW' + (f.ph ? '（' + f.ph.map(p => (p[0] || '?') + ': ' + p[1]).join(', ') + '）' : ''));
    rows.push('狀態 Status: ' + both(Z.st[f.st], E.st[f.st]) + ' · ' + both(Z.type[f.type], E.type[f.type]) + ' · ' + (f.yu ? '年份不詳 year unknown' : (f.pipe ? '預計 expected ' : '') + (f.year || '—') + (f.end ? '–' + f.end : '')));
    if (f.owner) rows.push('業主 Owner: ' + f.owner);
    if (f.turbine) rows.push('機型 Turbines: ' + f.turbine);
    rows.push('資料集 Dataset: ' + (['精選清單 curated list', 'GPPD (WRI)', 'GEM Global Wind Power Tracker', '2026 年整理清單 2026 compilation'][f.src] || '—'));
  } else if (it.kind === 'ms') rows.push('年份 Year: ' + it.m.year);
  rows.push('連結 Link: ' + itemLink(it));
  const body = rows.map(r => '- ' + r).join('\n') + '\n\n### 哪裡有錯？正確的資料是什麼？ What is wrong, and what is correct?\n\n\n### 出處 Source (URL or document)\n\n';
  const title = '資料錯誤 Data error: ' + it.name + (c ? ' (' + c.name + ')' : '');
  return REPO_URL + '/issues/new?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
}
async function copyText(s) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(s); return true; } } catch (e) { /* 改用下面的舊方法 */ }
  const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove(); return ok;
}
function refreshLiveBox() {                  // 即時資料更新：只換卡片裡的即時框
  const slot = cardItem && $('g-infoCard').querySelector('.lvslot'); if (!slot) return;
  const f = cardItem.f || cardItem.farm; slot.innerHTML = f ? liveBoxFor(f) : '';
}
function renderCard(it) {
  const same = it === cardItem;               // 同一張卡重畫（換語言）：保留捲動位置
  cardItem = it; relFarms = [];
  const card = $('g-infoCard');
  const c = byIso[it.iso]; const cn = c ? cname(c) : (it.iso || '');
  let title, sub = '', spec = '', desc = '', tag;
  const f = it.f;
  const real = !!f && !f.pseudo, full = !TOUR;   // 導覽時卡片保持精簡：不列附近／同開發商與動作列
  if (it.kind === 'ms') {
    const m = it.m; title = m.name;
    tag = '<span class="gtag ' + stCls({ type: it.type }) + '">' + T('type')[it.type] + '</span>';
    spec = [m.mw ? T('turbine') + ' ' + (m.mw < 1 ? (m.mw * 1000).toFixed(0) + ' kW' : m.mw + ' MW') : null, m.farm ? T('farm') + ' ' + WW.int(m.farm) + ' MW' : null, m.rotor ? T('rotor') + ' ' + m.rotor + ' m' : null, m.maker ? esc(m.maker) : null].filter(Boolean).join(' · ');
    desc = lang === 'zh' ? m.zh : m.en;
  } else {
    title = fname(f); if (lang === 'zh' && f.zh) sub = f.name;
    tag = '<span class="gtag ' + stCls(f) + '">' + (f.pipe ? T('st')[f.st] : T('type')[f.type]) + '</span>' + (f.pipe ? '<span class="gtag ' + (f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'floating' : 'off') + '">' + T('type')[f.type] + '</span>' : '');
    const sp = turbSpec(f);
    const phases = f.ph && f.ph.length < 2 ? ' · ' + f.ph.map(p => (p[0] || '?') + ': ' + WW.int(p[1])).join(', ') + ' MW' : '';   // 兩期以上另畫分期時間軸
    spec = T('totalCap') + ' ' + fmtMW(f.mw) + phases + (f.turbine ? ' · ' + esc(f.turbine) : (sp.n > 1 && !f.pseudo && !f.pipe ? ' · ~' + sp.n + ' ' + T('units') : '')) + (f.owner ? ' · ' + esc(f.owner) : '');
    desc = it.why || '';
  }
  const yrs = f && f.pipe ? (f.year ? T('expected') + ' ' + f.year : '') : (f && f.yu ? T('yearUnknown') : it.year + (it.end ? '–' + it.end + ' (' + T('decom') + ')' : ''));
  const bare = it.name.replace(/ · .*$/, ''), la = (+it.lat).toFixed(5), lo = (+it.lon).toFixed(5);
  const q = encodeURIComponent((it.zh && lang === 'zh' ? it.zh : bare) + (/wind|turbine|風/i.test(it.name) ? '' : ' wind farm'));
  const ext = (href, text, cls, tip) => '<a href="' + esc(href) + '" target="_blank" rel="noopener"' + (cls ? ' class="' + cls + '"' : '') + (tip ? ' title="' + esc(tip) + '"' : '') + '>' + esc(text) + '</a>';
  let links = ext('https://www.google.com/maps/@' + it.lat + ',' + it.lon + ',' + (it.kind === 'ms' && !(it.m.farm) ? 14 : 11) + 'z/data=!3m1!1e3', T('lnkMap')) +
    ext('https://www.openstreetmap.org/?mlat=' + la + '&mlon=' + lo + '#map=13/' + la + '/' + lo, T('lnkOsm'));
  // Global Wind Atlas：/shared/ 後接 GeoJSON 點，開啟即拉近到該點並顯示平均風速圖層（2026-09 實測）；共用代用座標的風場不給
  if (!(f && f.nStack)) links += ext('https://globalwindatlas.info/' + (lang === 'zh' ? 'zh' : 'en') + '/shared/' + encodeURIComponent(JSON.stringify({ type: 'Feature', properties: { type: 'marker' }, geometry: { type: 'Point', coordinates: [+lo, +la] } })), T('lnkGwa'), '', T('lnkGwaT'));
  links += ext('https://www.google.com/search?tbm=isch&q=' + q, T('lnkPhoto'));
  if (f && f.src === 2) links += ext('https://www.gem.wiki/' + encodeURIComponent(bare.replace(/ /g, '_')), T('lnkGem'));
  links += ext('https://www.wikidata.org/w/index.php?search=' + encodeURIComponent(bare), T('lnkWd'), 'wd');
  if (f && f.url) links += ext(f.url, T('lnkSrc'));
  let rel = '';
  if (real && full) {
    const near = nearbyFarms(f);
    if (near) rel += near.length ? relSection('near', T('near'), near, f, true) : '<p class="gnote fnear0">' + esc(T('nearNone')) + '</p>';
    sameOwnerLists(f).forEach(o => { rel += relSection('own', T('sameOwner') + L('：', ': ') + o.p.label, o.list, f, false, T('ownNote')); });
  }
  card.querySelector('.cb').innerHTML =
    '<div class="gph" hidden><img alt=""><span class="cr">' + T('photoCredit') + '</span></div>' +
    '<div class="kick">' + tag + esc(String(yrs)) + ' · ' + esc(cn) + '</div>' +
    '<h3>' + esc(title) + '</h3>' + (sub ? '<div class="csub">' + esc(sub) + '</div>' : '') +
    (spec ? '<div class="spec">' + spec + '</div>' : '') +
    (real ? '<div class="fstat">' + rankHTML(f) + '</div><div class="fphw">' + phaseHTML(f) + '</div>' : '') +
    (desc ? '<p class="desc">' + esc(desc) + '</p>' : '') +
    (noteOf(f) ? '<p class="fnote">' + esc(noteOf(f)) + '</p>' : '') +
    (posNote(f) ? '<p class="fnote pos">' + esc(posNote(f)) + '</p>' : '') +
    '<div class="lvslot">' + (f ? liveBoxFor(f) : (it.farm ? liveBoxFor(it.farm) : '')) + '</div>' +
    '<p class="wx">' + T('wikiLoading') + '</p><div class="links xl">' + links + '</div>' + rel +
    (full ? '<div class="factions"><button type="button" class="fcopy">🔗 ' + esc(T(it.kind === 'ms' ? 'copyLinkMs' : 'copyLink')) + '</button>' +
      '<a class="freport" href="' + esc(reportURL(it)) + '" target="_blank" rel="noopener" title="' + esc(T('reportT')) + '">⚑ ' + esc(T('report')) + '</a></div>' : '');
  card.classList.add('show');
  if (!same) card.scrollTop = 0;
  cardYearKey = real ? cardYearKeyOf(f) : '';
  card.querySelectorAll('[data-rel]').forEach(a => a.onclick = e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;       // 另開分頁：交給瀏覽器
    e.preventDefault(); const g = relFarms[+a.dataset.rel]; if (g) selectFarm(g);
  });
  card.querySelectorAll('details.frel').forEach(d => d.addEventListener('toggle', () => WW.store.set('ww_card_' + d.dataset.k, d.open ? '1' : '0')));
  card.querySelectorAll('.frmore').forEach(b => b.onclick = () => { b.previousElementSibling.classList.remove('clip'); b.remove(); });
  const cp = card.querySelector('.fcopy');
  if (cp) cp.onclick = async () => {
    const url = itemLink(it);
    if (await copyText(url)) { WW.toast(T('copied')); return; }
    WW.toast(T('copyFail'));
    const box = card.querySelector('.factions'); let inp = box.querySelector('.flink');
    if (!inp) { inp = document.createElement('input'); inp.className = 'flink'; inp.readOnly = true; inp.setAttribute('aria-label', T('copyLink')); box.appendChild(inp); }
    inp.value = url; inp.focus(); inp.select();
  };
  const myIt = it;
  wikiLookup(it).then(w => {
    if (cardItem !== myIt) return;
    const wx = card.querySelector('.wx');
    if (!w || w === 'ERR') { wx.textContent = w === 'ERR' ? T('wikiOffline') : T('wikiNone'); return; }
    wx.textContent = w.extract ? (w.extract.length > 260 ? w.extract.slice(0, 260) + '…' : w.extract) : '';
    const a = document.createElement('a'); a.href = w.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = T('lnkWiki') + ' · ' + w.title;
    card.querySelector('.links.xl').prepend(a);                   // 不是即時框裡的 .links
    const wd = card.querySelector('.links.xl .wd'); if (wd && w.qid) wd.href = 'https://www.wikidata.org/wiki/' + w.qid;   // 找到維基百科條目：直接連到它的 Wikidata 項目
    if (w.thumb) { const ph = card.querySelector('.gph'), img = ph.querySelector('img'); img.onload = () => { ph.hidden = false; }; img.onerror = () => { ph.hidden = true; }; img.src = w.thumb; }
  });
}
function closeCard() { $('g-infoCard').classList.remove('show'); cardItem = null; if (!TOUR) focusFarm = null; syncURL(); }
function selectFarm(f) {
  setPlaying(false);
  if (f.pipe) { if (!S.pipe) togglePipe(true); S.year = Y1; syncYearUI(); }
  else if (fAge(f) < BUILD) { S.year = Math.min(Y1, f.year + 0.5); syncYearUI(); }
  else if (f.end && S.year >= f.end) { S.year = Math.max(f.year + 0.5, f.end - 0.5); syncYearUI(); }     // 已除役：回到它還在運轉的年份
  if (f.iso && byIso[f.iso] && S.region !== f.iso) setRegion(f.iso, true);
  focusFarm = f;
  flyToLonLat(f.lon, f.lat, farmAlt(f));
  renderCard(farmItem(f));
  syncURL();
}
function openStop(st) {
  setPlaying(false);
  S.year = clamp(st.year + 0.7, Y0, Y1); syncYearUI();
  if (st.kind === 'ms' && !st.farm && farmsReady) st.farm = msPseudoFarm(st.m);
  focusFarm = st.farm || st.f || null;
  const tf = (st.farm && !st.farm.pseudo) ? st.farm : st;
  flyToLonLat(tf.lon, tf.lat, stopAlt(st));
  renderCard(st.kind === 'ms' ? st : farmItem(st.f, st.why));
}
function stopAlt(st) { const f = st.farm || st.f; return f ? farmAlt(f) * 1.25 : 0.5; }

/* ================= tour mode ================= */
let TOUR = null;
function isAgg(f) { return /remainder|placeholder|aggregate|misc|corridor|cluster|\bbase\b|smaller projects|unnamed|其他|合計/i.test(f.name + ' ' + (f.zh || '')); }
function buildTourStops(region) {
  const stops = [];
  D.milestones.forEach(m => { if (inScope(m.iso, region)) stops.push(msStop(m)); });
  const sn = region === 'WORLD' ? L('全球', 'the world') : scopeName(region);
  const add = (f, why) => {
    const dup = stops.find(s => Math.abs(s.lat - f.lat) < 0.3 && Math.abs(s.lon - f.lon) < 0.3 && Math.abs(s.year - f.year) <= 2);
    if (dup) { if (dup.kind === 'ms') { dup.farm = f; } return; }
    stops.push({ kind: 'farm', f, name: f.name, zh: f.zh, lat: f.lat, lon: f.lon, year: f.year, type: f.type, iso: f.iso, why });
  };
  const farms = D.farms.filter(f => inScope(f.iso, region) && !isAgg(f) && !f.pipe && f.st === 0 && !f.yu).sort((a, b) => a.year - b.year || b.mw - a.mw);
  const types = region === 'WORLD' ? ['off'] : ['off', 'on'];
  types.forEach(tp => {
    const list = farms.filter(f => tp === 'off' ? f.type !== 'onshore' : f.type === 'onshore');
    let rec = 0;
    list.forEach((f, i) => {
      if (i === 0 && region !== 'WORLD') { add(f, T(tp === 'off' ? 'whyFirstOff' : 'whyFirstOn')(sn)); rec = f.mw; return; }
      if (f.mw >= rec * 1.3 && f.mw >= (region === 'WORLD' ? 40 : 10)) { add(f, T(tp === 'off' ? 'whyRecOff' : 'whyRecOn')(sn)); rec = f.mw; }
    });
  });
  if (region !== 'WORLD') { farms.slice().sort((a, b) => b.mw - a.mw).slice(0, 3).forEach(f => add(f, T('whyTop')(sn))); }
  stops.sort((a, b) => a.year - b.year || a.lat - b.lat);
  const cap = region === 'WORLD' ? 60 : 20;
  return stops.slice(0, cap);
}
function tourStart() {
  if (!farmsReady) { notice(T('farmsLoading'), 2000); pendingParams = Object.assign(pendingParams || {}, { tour: '1' }); return; }
  const stops = buildTourStops(S.region);
  if (!stops.length) return;
  TOUR = { stops, i: -1, phase: 'fly', t: 0, flyDur: 1, dwell: 9, paused: false, region: S.region };
  setPlaying(false);
  host.classList.add('touring');
  $('g-btnTour').classList.add('active');
  tourShowStop(0);
}
function tourShowStop(i, keepYear) {
  if (!TOUR) return;
  if (i >= TOUR.stops.length) { tourEnd(true); return; }
  i = Math.max(0, i);
  TOUR.i = i; const st = TOUR.stops[i];
  TOUR.yFrom = S.year; TOUR.yTo = clamp(st.year + 0.75, Y0, Y1);
  if (keepYear) TOUR.yFrom = TOUR.yTo;
  focusFarm = st.farm || st.f || null;
  const tf = (st.farm && !st.farm.pseudo) ? st.farm : st;
  TOUR.flyDur = flyToLonLat(tf.lon, tf.lat, stopAlt(st)) || 1.5;
  TOUR.phase = 'fly'; TOUR.t = 0;
  renderCard(st.kind === 'ms' ? st : farmItem(st.f, st.why));
  tourPause(false);
  $('g-tourBar').querySelector('.cnt').textContent = (i + 1) + ' / ' + TOUR.stops.length;
}
function tourTick(dt) {
  if (TOUR.paused) return;
  TOUR.t += dt;
  const prog = $('g-tourBar').querySelector('.prog i');
  if (TOUR.phase === 'fly') {
    S.year = lerp(TOUR.yFrom, TOUR.yTo, easeIO(Math.min(1, TOUR.t / TOUR.flyDur))); syncYearUI();
    if (TOUR.t >= TOUR.flyDur) { TOUR.phase = 'dwell'; TOUR.t = 0; }
    prog.style.width = '0%';
  } else {
    prog.style.width = Math.min(100, TOUR.t / TOUR.dwell * 100) + '%';
    if (TOUR.t >= TOUR.dwell) tourShowStop(TOUR.i + 1);
  }
}
function tourPause(p) { if (!TOUR) return; TOUR.paused = p; $('g-tourBar').querySelector('.tp').textContent = p ? '▶' : '❚❚'; }
function tourEnd(finished) {
  TOUR = null; host.classList.remove('touring'); $('g-btnTour').classList.remove('active');
  if (finished) { closeCard(); flyToRegion(false); notice(T('tourEnd'), 2500); }
  else if (cardItem) renderCard(cardItem);     // 中途離開導覽：卡片補上完整內容
}

/* ================= tooltip & picking ================= */
let tipPane = null, hoverKey = null, hoverTimer = null;
function tipCountry(c) {
  const on = valAt(c.on, S.year), off = valAt(c.off, S.year);
  return '<b>' + esc(cname(c)) + '</b> · ' + Math.floor(S.year) + '<br><i class="gsw" style="background:var(--on)"></i>' + T('onshore') + ' ' + fmtMW(on) + '<br><i class="gsw" style="background:var(--off)"></i>' + T('offshore') + ' ' + fmtMW(off) + '<br>' + T('total') + ' <b>' + fmtMW(on + off) + '</b>';
}
function liveTip(f) {
  const x = liveOn() && liveFor(f); if (!x) return '';
  return '<div class="tlive">● ' + T('liveNow') + ' <b>' + WW.num(x.mw, x.mw < 100 ? 1 : 0) + ' MW</b>' + (x.cap ? ' · ' + (x.mw / x.cap * 100).toFixed(0) + '%' : '') + '</div>';
}
function tipFarm(f, w) {
  const sp = turbSpec(f);
  const col = f.pipe ? 'var(--p' + f.st + ')' : 'var(--' + (f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'fl' : 'off') + ')';
  const when = f.pipe ? T('st')[f.st] + (f.year ? ' · ' + T('expected') + ' ' + f.year : '') : (f.yu ? T('yearUnknown') : f.year + (f.end ? '–' + f.end : ''));
  return (w && w.thumb ? '<img class="tph" src="' + esc(w.thumb) + '" alt="">' : '') +
    '<b>' + esc(fname(f)) + '</b>' + (f.zh && lang === 'zh' ? '<br><span style="color:var(--ink-2)">' + esc(f.name) + '</span>' : '') +
    '<br><i class="gsw" style="background:' + col + '"></i>' + T('type')[f.type] + ' · ' + esc(String(when)) +
    '<br>' + T('totalCap') + ' <b>' + fmtMW(f.pipe ? f.mw : farmMwAt(f, S.year)) + '</b>' + (f.turbine ? '<br>' + esc(f.turbine) : (sp.n > 1 && !f.pseudo && !f.pipe ? ' · ~' + sp.n + ' ' + T('units') : '')) + (f.owner ? '<br><span style="color:var(--ink-2)">' + esc(f.owner) + '</span>' : '') +
    (noteOf(f) ? '<div class="tnote">' + esc(noteOf(f).length > 140 ? noteOf(f).slice(0, 140) + '…' : noteOf(f)) + '</div>' : '') +
    (f.nStack ? '<div class="tnote">' + T('tipStack') + '</div>' : '') +
    liveTip(f) + '<div class="hint2">' + T('clickMore') + '</div>';
}
function tipMs(m) { return '<b>★ ' + esc(m.name) + '</b><br>' + m.year + ' · ' + T('type')[m.type] + '<br><span style="color:var(--ink-2)">' + esc(lang === 'zh' ? m.zh : m.en) + '</span><div class="hint2">' + T('clickMore') + '</div>'; }
function showTip(ev, html, pane) { const tip = $('g-tip'); tip.style.display = 'block'; tip.innerHTML = html; if (tip.parentElement !== pane) pane.appendChild(tip); tipPane = pane; moveTip(ev, pane); }
function moveTip(ev, pane) {
  const tip = $('g-tip');
  const r = pane.getBoundingClientRect(); const tw = tip.offsetWidth || 200, th = tip.offsetHeight || 100;
  let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14; if (x + tw > r.width - 8) x = ev.clientX - r.left - tw - 14; if (y + th > r.height - 8) y = Math.max(8, ev.clientY - r.top - th - 10);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { $('g-tip').style.display = 'none'; hoverKey = null; }
const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2();
function visibleDeep(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
/* 風場層用螢幕座標挑選（上萬個 instance 做射線檢測太慢） */
function pickFarmScreen(ev) {
  const r = canvas.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
  let best = null, bd = 1e9;
  [FL.op, FL.pp].forEach(L2 => {
    for (let i = 0; i < L2.list.length; i++) {
      const h = L2.h[i]; if (h < 0.0003) continue;
      tmpW.copy(L2.pos[i]).applyMatrix4(surfaceRoot.matrixWorld);
      if (!facing(tmpW)) continue;
      const p = project(tmpW); if (p.z > 1) continue;
      // 以 ring 半徑換算成螢幕像素當命中範圍（至少 10px）
      _p3.copy(tmpW).addScaledVector(upAt(tmpW), h * surfaceRoot.scale.x * 0.8);
      const pt = project(_p3);
      const rad = Math.max(10, Math.hypot(pt.x - p.x, pt.y - p.y) * 0.9);
      const d = Math.min(Math.hypot(mx - p.x, my - p.y), Math.hypot(mx - pt.x, my - pt.y));
      if (d < rad && d < bd) { bd = d; best = L2.list[i]; }
    }
  });
  return best;
}
function pick(ev) {
  const r = canvas.getBoundingClientRect(); mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1; mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(mouse, camera);
  const objs = [];
  clusters.forEach(g => { if (g.userData.count > 0) objs.push(g.userData.tower, g.userData.nac, g.userData.rotor, g.userData.disc); });
  msMarkers.forEach(g => { if (g.visible) objs.push(g.userData.pin); });
  countryPicks.forEach(o => { if (visibleDeep(o) && o.userData.anchor.userData.dim > 0.5) objs.push(o); });
  const hit = ray.intersectObjects(objs, false)[0];
  if (hit) { const u = hit.object.userData; if (u.farm) return { farm: u.farm }; if (u.ms) return { ms: u.ms }; if (u.anchor) return { country: u.anchor.userData.c }; }
  const f = pickFarmScreen(ev); if (f) return { farm: f };
  return null;
}
function groundAt(ev) {
  const r = canvas.getBoundingClientRect(); mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1; mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(mouse, camera); const p = new THREE.Vector3();
  const ok = S.mode === 'globe' ? ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), R), p) : ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p);
  return ok ? xyzToLonLat(p) : null;
}

/* ================= year / view / misc controls ================= */
function syncYearUI() { const sl = $('g-slider'); sl.value = S.year; sl.style.setProperty('--p', ((S.year - Y0) / (Y1 - Y0) * 100) + '%'); $('g-yearNow').textContent = Math.floor(S.year); renderMilestones(false); refreshCardYear(); }
function setPlaying(p) { if (p && S.year >= Y1) S.year = Y0; if (p && TOUR) tourEnd(false); S.playing = p; $('g-play').textContent = p ? '❚❚' : '▶'; $('g-play').setAttribute('aria-label', p ? T('pause') : T('play')); if (!p) syncURL(); }
function setView(v) {
  if (!renderer) v = 'bars';
  S.view = v; const st = $('g-stage'); st.className = v === 'map' ? 'mapOnly' : v === 'bars' ? 'barOnly' : 'split';
  document.querySelectorAll('#g-viewSeg button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  setTimeout(() => { resize(); updateBars(true); }, 30);
  syncURL();
}
function togglePipe(on) {
  S.pipe = on != null ? on : !S.pipe; WW.store.set('ww_globe_pipe', S.pipe ? '1' : '0');
  const b = $('g-btnPipe'); b.classList.toggle('active', S.pipe); b.setAttribute('aria-pressed', S.pipe ? 'true' : 'false');
  farmLayerDirty = true; hudCache = ''; updateClusters(0, true);
  if (S.pipe && S.year < Y1 - 0.02 && !S.playing) notice(T('pipeNote'), 3500);
  renderFarmList(true); renderPipeList(true);
}
function applyI18n() {
  host.querySelectorAll('[data-gi]').forEach(el => { const v = T(el.dataset.gi); if (typeof v === 'string') el.textContent = v; });
  host.querySelector('.gtitle').innerHTML = esc(T('title')) + '<small>' + Y0 + '–' + Y1 + '</small>';
  document.querySelectorAll('#g-speedSel option').forEach(o => { const v = parseFloat(o.value); o.textContent = v < 1 ? (lang === 'zh' ? '1 年 ' + Math.round(1 / v) + ' 秒' : Math.round(1 / v) + ' s / yr') : (lang === 'zh' ? v + ' 年/秒' : v + ' yr/s'); });
  document.querySelectorAll('#g-densSel option').forEach(o => { o.textContent = T('dens')[+o.value]; });
  $('g-hint').textContent = isTouch ? T('hintTouch') : T('hint');
  buildRegionSelect();
  hudCache = ''; msRendered = -1; renderMilestones(true); renderFarmList(true); renderProfile(); renderPipeList(true); updateAttr();
  $('g-pipeLegend').hidden = true;      // 下一個 HUD 更新時依新語言重畫圖例
  labelPool.forEach(l => { l._key = null; });          // 地圖標籤依語言重畫
  Object.keys(rowEls).forEach(k => { rowEls[k].querySelector('.nm span').textContent = cname(byIso[k]); });
}
function showSources() {
  const src = D.sources, n = D.notes;
  const li = arr => (arr || []).map(s => '<li>' + (/^https?:/.test(s) ? '<a href="' + esc(s.split(' ')[0]) + '" target="_blank" rel="noopener">' + esc(s) + '</a>' : esc(s)) + '</li>').join('');
  const zh = lang === 'zh';
  $('g-modalBody').innerHTML = '<h2>' + T('srcTitle') + '</h2>' +
    (zh ? '<p>地圖顯示各國<b>年底累計裝置容量</b>（MW），陸域與離岸分開統計，離岸含潮間帶／近岸（GWEC 口徑）。國家層級的風機高度以容量的 0.4 次方縮放；選擇單一國家或放大時改以風場為單位，放大到接近地面時，風場會依機組數量與間距畫成一群風機（機組位置為示意排列，非實際座標）。虛線環為規劃中專案（越亮越接近完工；「規劃」分頁有逐案清單與 GEM 2026-02 各國總量，拉近時以半透明風機顯示預定配置）。台灣與日本的國家數字採官方統計（能源署、JWPA），兩國風場另經逐場稽核。1980–1999 年多數國家的逐年數字為估計值，僅供趨勢觀察。風場照片與簡介於瀏覽時即時查詢維基百科，離線時不會顯示。</p>'
        : '<p>The map shows <b>year-end cumulative installed capacity</b> per country (MW), onshore and offshore separately (offshore includes intertidal/nearshore, GWEC convention). Country turbine height scales with capacity^0.4; with a country selected or when zoomed in the map switches to individual farms, and close to the ground each farm is drawn as a group of turbines from its unit count and spacing (schematic layout). Dashed rings are pipeline projects (brighter = closer to completion; the Pipeline tab lists them with GEM’s February 2026 country totals, and zooming in shows the planned layout as translucent turbines). Taiwan’s and Japan’s national figures come from official statistics (Energy Administration, JWPA), and their farms were audited one by one. Most 1980–1999 country series are estimates. Farm photos and summaries are looked up live from Wikipedia.</p>') +
    '<h4>' + (zh ? '本站修正' : 'Corrections by this site') + '</h4><ul>' + li((D.meta && D.meta.edits) || []) +
    '<li>' + (zh ? '2026 年 9 月逐筆查證：刪除重複、從未建成或查無此場的風場紀錄，修正座標、容量、年份、分期或狀態；共用省或國家中心代用座標的風場在地圖上示意排開（卡片註明「位置示意」）。逐筆理由見'
      : 'Checked record by record in Sep 2026: duplicate, never-built or non-existent farm records were removed and locations, capacities, years, phases or statuses fixed; farms sharing a province or country centre as a placeholder are fanned out on the map (their cards say the position is schematic). Every record is in the') +
    ' <a href="https://github.com/dofliu/windfarmTaiwan/blob/main/docs/data-cleanup' + (zh ? '' : '.en') + '.md" target="_blank" rel="noopener">' + (zh ? '資料清理紀錄' : 'clean-up log') + '</a>' + (zh ? '。' : '.') + '</li><li>' + (zh ? '國界改以 Natural Earth 1:50m 重建（原資料缺澳洲本土；克里米亞依聯合國大會第 68/262 號決議劃歸烏克蘭）；風場與 GEM 全球風電追蹤（2025-02，CC BY 4.0）合併並加入規劃中專案；GEM 同一場址相距 25 km 以上的分期分開標示，3 筆明顯的座標錯誤已修正。' : 'Borders rebuilt from Natural Earth 1:50m (the original lacked mainland Australia; Crimea shown as part of Ukraine per UN GA resolution 68/262); farms merged with the GEM Global Wind Power Tracker (Feb 2025, CC BY 4.0), adding pipeline projects; GEM phases more than 25 km apart are shown separately and three obvious coordinate errors were corrected.') + '</li></ul>' +
    '<h4>' + (zh ? '總容量 2000–2025' : 'Total capacity 2000–2025') + '</h4><ul><li>Our World in Data — Installed wind energy capacity (IRENA Renewable Capacity Statistics): <a href="https://ourworldindata.org/grapher/cumulative-installed-wind-energy-capacity-gigawatts" target="_blank" rel="noopener">ourworldindata.org</a></li></ul>' +
    '<h4>' + (zh ? '離岸容量 1991–2025' : 'Offshore capacity 1991–2025') + '</h4><ul>' + li(src.offshore) + '</ul>' +
    '<h4>' + (zh ? '1980–1999 早期資料' : 'Early data 1980–1999') + '</h4><ul>' + li(src.early) + '</ul>' +
    '<h4>' + (zh ? '風場層級資料' : 'Farm-level data') + '</h4><ul><li>Global Energy Monitor, Global Wind Power Tracker, February 2025 release (CC BY 4.0): <a href="https://globalenergymonitor.org/projects/global-wind-power-tracker/" target="_blank" rel="noopener">globalenergymonitor.org</a></li>' + li(src.farms) + '</ul>' +
    '<h4>' + (zh ? '備註（離岸）' : 'Notes (offshore)') + '</h4><ul>' + li(n.offshore) + '</ul>' +
    '<h4>' + (zh ? '備註（早期）' : 'Notes (early)') + '</h4><ul>' + li(n.early) + '</ul>' +
    '<h4>' + (zh ? '備註（風場）' : 'Notes (farms)') + '</h4><ul>' + li(n.farms) + '</ul>' +
    '<h4>' + (zh ? '台灣、日本官方統計稽核' : 'Taiwan & Japan official-statistics audit') + '</h4><ul>' + li(src.audit) + li(n.audit) + '</ul>' +
    '<h4>' + (zh ? '規劃中專案' : 'Pipeline projects') + '</h4><ul>' +
      '<li>' + (zh ? '逐案：GEM 全球風電追蹤 2025-02（興建中、前期開發、已宣布）；2026 年 9 月人工整理的 177 個重點專案（' : 'Projects: GEM Global Wind Power Tracker, Feb 2025 (construction, pre-construction, announced); 177 key projects curated in Sep 2026 (') +
      esc(D.pipelineCuratedAsOf || '2026') + (zh ? '），用來更新狀態與預計商轉年，GEM 沒有的才新增；「暫緩」不收錄。' : '), used to update status and expected commissioning year and to add projects GEM lacks; on-hold projects are left out.') + '</li>' +
      (D.pipelineTotals ? '<li>' + (zh ? '各國總量：' : 'Country totals: ') + esc(D.pipelineTotals.source) + ' · ' + esc(D.pipelineTotals.release) + ' — <a href="' + esc(D.pipelineTotals.url) + '" target="_blank" rel="noopener">globalenergymonitor.org</a></li>' : '') +
      '<li>' + (zh ? '日本另補 NEDO 各縣風場清單（1 MW 以上，至 2018 年 3 月）與 windfarm.work／營運商資料中 GEM 未收錄的小型風場，並據以修正 GEM 錯置的座標。' : 'Japan adds small farms missing from GEM from the NEDO prefecture lists (≥1 MW, to March 2018) and windfarm.work / operator pages, which were also used to correct misplaced GEM coordinates.') + '</li></ul>' +
    '<h4>' + (zh ? '即時出力（台灣、澳洲、加拿大）' : 'Live output (Taiwan, Australia, Canada)') + '</h4><ul>' +
      '<li>' + (zh ? '台灣：台電「各機組發電量即時資訊」（政府資料開放平臺資料集 8931）。' : 'Taiwan: Taipower real-time generation by unit (government open data, dataset 8931).') + '</li>' +
      '<li>' + (zh ? '澳洲東部電網：AEMO NEMWeb Dispatch_SCADA（每 5 分鐘）。資料來源：Australian Energy Market Operator (AEMO)。' : 'Australia NEM: AEMO NEMWeb Dispatch_SCADA (every 5 minutes). Source: Australian Energy Market Operator (AEMO).') + '</li>' +
      '<li>' + (zh ? '亞伯達：AESO Current Supply Demand 報表（約 1 分鐘）。© 2026 THE INDEPENDENT SYSTEM OPERATOR ("ISO"). All rights reserved；非商業與教育用途，數值未修改。' : 'Alberta: AESO Current Supply Demand report (about 1 minute). © 2026 THE INDEPENDENT SYSTEM OPERATOR ("ISO"). All rights reserved; non-commercial, educational use, values unmodified.') + '</li>' +
      '<li>' + (zh ? '安大略：IESO Generators Output and Capability 報表（每小時）。' : 'Ontario: IESO Generators Output and Capability report (hourly). ') + 'Copyright © 2004-2022 Independent Electricity System Operator, all rights reserved. This information is subject to the Terms of Use set out in the IESO\'s website (www.ieso.ca).</li>' +
      '<li>' + (zh ? '機組與風場的對照以 AEMO 登錄清單與 IESO「Transmission-Connected Generation」人工核對；對不到的機組只計入電網總量。綠色外圈只在時間軸位於最新年份時顯示。' : 'Units are matched to farms using AEMO’s registration list and IESO’s “Transmission-Connected Generation” page, checked by hand; unmatched units only count toward the grid total. Green rings only show when the timeline is at the latest year.') + '</li></ul>' +
    '<h4>' + (zh ? '底圖與元件' : 'Basemaps & libraries') + '</h4><ul><li>Natural Earth 1:50m Admin-0 & Gray Earth shaded relief (public domain) · NASA Blue Marble Next Generation with topography & bathymetry (public domain)</li><li>Esri World Imagery (Esri, Vantor, Earthstar Geographics) · Esri World Hillshade (Esri, USGS, NASA et al.) — zoomed-in detail</li><li>three.js r128 (MIT) · Wikipedia / Wikimedia Commons (live lookup, per-image licences)</li></ul>' +
    '<h4>' + (zh ? '開發者與版權' : 'Developer & copyright') + '</h4><p>國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室<br>National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu<br>' +
    (zh ? '網站程式、設計與文字 © 2026 劉瑞弘研究室；各項資料依上列來源的授權使用。' : 'Site code, design and text © 2026 Dof Lab; each dataset is used under the licence of its source listed above.') +
    '<br><a href="https://github.com/dofliu/windfarmTaiwan" target="_blank" rel="noopener">GitHub · dofliu/windfarmTaiwan</a> · <a href="standalone/windfarmTaiwan-standalone.html" download>' + (zh ? '下載單檔版 HTML' : 'Download the single-file HTML') + '</a></p>';
  $('g-modal').classList.add('show');
  $('g-modalClose').focus();
}

/* ================= URL state (shareable deep links) ================= */
let urlT = 0;
function stateParams() {
  const p = {};
  if (S.region !== 'WORLD') p.r = S.region;
  if (!S.playing && Math.floor(S.year) !== Y1) p.y = Math.floor(S.year);
  if (S.view !== 'map') p.v = S.view;
  if (S.mode !== 'globe') p.mode = S.mode;
  if (S.layer !== 'both') p.layer = S.layer;
  if (focusFarm && !focusFarm.pseudo && cardItem && cardItem.kind === 'farm') p.f = focusFarm.name;
  if (cardItem && cardItem.kind === 'ms') p.ms = cardItem.m.name;
  return p;
}
function syncURL() {
  if (!active || WW.currentPage() !== 'global') return;
  clearTimeout(urlT);
  const at = location.hash;
  urlT = setTimeout(() => {
    if (!active || WW.currentPage() !== 'global' || location.hash !== at) return;     // 250 ms 內已換頁或開了別的深連結：不可覆寫
    const h = WW.hashFor('global', null, stateParams()); if (location.hash !== h) history.replaceState(null, '', h);
  }, 250);
}
let pendingParams = null;
function applyParams(p, fromFarms) {
  if (!p) return;
  if (p.base && ['relief', 'sat', 'plain'].includes(p.base)) setBase(p.base);
  if (p.mode === 'flat' || p.mode === 'globe') setMode(p.mode);
  if (p.v && ['map', 'split', 'bars'].includes(p.v)) setView(p.v);
  if (p.layer && ['both', 'on', 'off'].includes(p.layer)) { S.layer = p.layer; $('g-layerSel').value = p.layer; updateBars(true); farmLayerDirty = true; }
  if (p.pipe != null) togglePipe(p.pipe !== '0');
  if (p.r && !fromFarms) setRegion(p.r);
  if (p.y && !isNaN(+p.y)) { S.year = clamp(+p.y, Y0, Y1); syncYearUI(); }
  else if (!fromFarms && p.play !== '1') { S.year = Y1; syncYearUI(); }     // 連結省略 y ＝ 最新年份（見 stateParams）
  if (p.ms) {
    const m = D.milestones.find(x => x.name === p.ms) || D.milestones.find(x => x.name.toLowerCase().startsWith(String(p.ms).toLowerCase()));
    if (m) { if (!farmsReady) { pendingParams = { ms: p.ms }; } openStop(msStop(m)); }
  }
  if (p.f) {
    if (!farmsReady) { pendingParams = Object.assign(pendingParams || {}, { f: p.f }); }
    else { const f = D.farms.find(x => x.name === p.f && x.src === 0) || D.farms.find(x => x.name === p.f) || D.farms.find(x => x.name.toLowerCase().startsWith(String(p.f).toLowerCase())); if (f) selectFarm(f); }
  }
  if (p.play === '1') { if (!p.y) S.year = Y0; setPlaying(true); }
  if (p.tour === '1') { if (farmsReady) tourStart(); else pendingParams = Object.assign(pendingParams || {}, { tour: '1' }); }
}

/* ================= UI wiring ================= */
function wireUI() {
  labelsEl = $('g-labels');
  controls.addEventListener('start', () => { S.dragging = true; camTween = null; if (TOUR && !TOUR.paused) tourPause(true); });
  controls.addEventListener('end', () => { S.dragging = false; });
  canvas.addEventListener('mousemove', ev => {
    if (ev.buttons) { hideTip(); return; }
    const h = pick(ev), pane = $('g-mapPane');
    if (!h) { hideTip(); canvas.style.cursor = 'grab'; return; }
    canvas.style.cursor = 'pointer';
    const key = h.farm ? 'f' + h.farm.name + h.farm.lat : h.ms ? 'm' + h.ms.name : 'c' + h.country.iso;
    if (key === hoverKey) { moveTip(ev, pane); return; }
    hoverKey = key; clearTimeout(hoverTimer);
    if (h.farm) {
      showTip(ev, tipFarm(h.farm), pane);
      const f = h.farm;
      hoverTimer = setTimeout(() => { wikiLookup(farmItem(f)).then(w => { if (hoverKey === key && w && w !== 'ERR' && w.thumb) { $('g-tip').innerHTML = tipFarm(f, w); } }); }, 350);
    } else if (h.ms) showTip(ev, tipMs(h.ms), pane);
    else showTip(ev, tipCountry(h.country), pane);
  });
  canvas.addEventListener('mouseleave', hideTip);
  let downAt = null;
  canvas.tabIndex = 0;              // 點過地圖後，空白鍵／方向鍵等快捷鍵即可使用
  canvas.addEventListener('pointerdown', ev => { downAt = { x: ev.clientX, y: ev.clientY, t: performance.now() }; canvas.focus({ preventScroll: true }); });
  canvas.addEventListener('pointerup', ev => {
    if (!downAt) return; const d = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y), dtm = performance.now() - downAt.t; downAt = null;
    if (d > 6 || dtm > 600) return;
    hideTip();
    if (TOUR) { tourEnd(false); }
    const h = pick(ev);
    if (h && h.farm) { selectFarm(h.farm); return; }
    if (h && h.ms) { openStop(msStop(h.ms)); return; }
    if (h && h.country) { closeCard(); setRegion(h.country.iso); return; }
    const g = groundAt(ev); if (!g) return;
    const iso = countryAt(g.lon, g.lat);
    if (iso && iso !== S.region && byIso[iso]) { closeCard(); setRegion(iso); return; }
    const alt = curAlt(); flyToLonLat(g.lon, g.lat, Math.max(S.mode === 'globe' ? G_MIN_ALT : 0.2, alt * 0.45), 1.1);
  });
  $('g-infoCard').querySelector('.gx').onclick = () => { if (TOUR) tourEnd(); closeCard(); };
  const tb = $('g-tourBar');
  tb.querySelector('.tprev').onclick = () => TOUR && tourShowStop(TOUR.i - 1);
  tb.querySelector('.tnext').onclick = () => TOUR && tourShowStop(TOUR.i + 1);
  tb.querySelector('.tp').onclick = () => TOUR && tourPause(!TOUR.paused);
  tb.querySelector('.tx').onclick = () => { tourEnd(false); closeCard(); };
  $('g-btnTour').onclick = () => { if (TOUR) { tourEnd(false); closeCard(); } else tourStart(); };
  $('g-tabProf').onclick = () => setPanelTab('prof'); $('g-tabMs').onclick = () => setPanelTab('ms'); $('g-tabFarms').onclick = () => setPanelTab('farms'); $('g-tabPipe').onclick = () => setPanelTab('pipe');
  $('g-msToggle').onclick = e => { const p = $('g-msPanel'); p.classList.toggle('collapsed'); e.currentTarget.textContent = p.classList.contains('collapsed') ? '+' : '–'; };
  if (window.innerWidth < 700) { $('g-msPanel').classList.add('collapsed'); $('g-msToggle').textContent = '+'; }
  $('g-play').onclick = () => setPlaying(!S.playing);
  $('g-slider').oninput = () => { if (TOUR) tourPause(true); S.year = parseFloat($('g-slider').value); syncYearUI(); };
  $('g-slider').onchange = () => syncURL();
  $('g-speedSel').onchange = e => { S.speed = parseFloat(e.target.value); };
  $('g-layerSel').onchange = e => { S.layer = e.target.value; updateBars(true); updateClusters(0, true); farmLayerDirty = true; renderPipeList(true); syncURL(); };
  $('g-densSel').onchange = e => { S.density = +e.target.value; };
  $('g-regionSel').onchange = e => { if (TOUR) tourEnd(false); closeCard(); setRegion(e.target.value); };
  $('g-baseSel').onchange = e => setBase(e.target.value);
  $('g-btnPipe').onclick = () => { togglePipe(); if (S.pipe && S.year < Y1 - 0.02 && !S.playing) { S.year = Y1; syncYearUI(); } if (S.pipe) setPanelTab('pipe'); };
  $('g-btnPipe').classList.toggle('active', S.pipe); $('g-btnPipe').setAttribute('aria-pressed', S.pipe ? 'true' : 'false');
  document.querySelectorAll('#g-viewSeg button').forEach(b => b.onclick = () => setView(b.dataset.view));
  document.querySelectorAll('#g-modeSeg button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('g-btnRotate').onclick = e => { S.rotate = !S.rotate; e.currentTarget.classList.toggle('active', S.rotate); e.currentTarget.setAttribute('aria-pressed', S.rotate ? 'true' : 'false'); };
  $('g-btnSources').onclick = showSources;
  $('g-modalClose').onclick = () => $('g-modal').classList.remove('show');
  $('g-modal').onclick = e => { if (e.target.id === 'g-modal') e.target.classList.remove('show'); };
  window.addEventListener('keydown', e => {
    if (!active || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') {        // Esc 不論焦點在哪都有效：先關來源說明，再關資訊卡／導覽
      if ($('g-modal').classList.contains('show')) { $('g-modal').classList.remove('show'); $('g-btnSources').focus(); return; }
      if (TOUR) tourEnd(false); if (cardItem) closeCard(); return;
    }
    const tg = e.target.tagName;
    if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA' || tg === 'BUTTON' || tg === 'A') return;
    if (e.code === 'Space') { e.preventDefault(); if (TOUR) tourPause(!TOUR.paused); else setPlaying(!S.playing); }
    if (e.key === 'ArrowRight') { if (TOUR) tourShowStop(TOUR.i + 1); else { S.year = Math.min(Y1, Math.floor(S.year) + 1); syncYearUI(); } }
    if (e.key === 'ArrowLeft') { if (TOUR) tourShowStop(TOUR.i - 1); else { S.year = Math.max(Y0, Math.ceil(S.year) - 1); syncYearUI(); } }
  });
}

/* ================= page lifecycle ================= */
WW.globe = {
  ready,
  enter(r) {
    active = true;
    ready.then(() => {
      if (!active) return;
      if (loadingEl && loadingEl.parentNode) loadingEl.remove();
      resize(); start();
      loadIntl(); clearInterval(intlTimer);
      intlTimer = setInterval(() => { if (active) loadIntl(); }, 5 * 60e3);   // 每 5 分鐘重抓澳洲、加拿大即時資料
      const p = r && r.params ? r.params : {};
      const hasParams = Object.keys(p).length > 0;
      if (hasParams) applyParams(p);
      else if (firstEnter) setTimeout(() => { if (active && !TOUR && S.year === Y0 && !S.playing) setPlaying(true); }, 900);
      firstEnter = false;
      if (lang !== WW.lang) { lang = WW.lang; applyI18n(); }
    }, e => {
      console.error(e);
      if (loadingEl) loadingEl.textContent = L('全球資料載入失敗，請檢查網路後重新整理。', 'Global data failed to load. Check your connection and reload.');
    });
  },
  leave() { active = false; clearTimeout(urlT); clearInterval(intlTimer); intlTimer = null; stop(); setPlaying(false); if (TOUR) tourPause(true); hideTip(); },
  api: () => ({ S, D, setRegion, selectFarm, tourStart, setMode, setBase, flyToLonLat, curAlt, FL, clusters, get TOUR() { return TOUR; },
    cam: () => { const f = focusLonLat(); return { lon: +f.lon.toFixed(3), lat: +f.lat.toFixed(3), alt: +curAlt().toFixed(1), frames: S.frames || 0, rotate: S.rotate }; },
    patchState: () => ({ info: patchInfo, tiles: tileAttrOn, visible: !!(patch && patch.visible), cache: tileCache.size, ok: [...tileCache.values()].filter(t => t.ok).length }) })
};
WW.onLang(l => { lang = l; if (D) { applyI18n(); updateBars(true); if (cardItem) renderCard(cardItem); } });
if (WW.live) WW.live.onUpdate(() => { farmLayerDirty = true; if (active && panelTab === 'prof' && S.region === 'TWN') renderProfile(); if (active && cardItem && cardItem.iso === 'TWN') refreshLiveBox(); });
})();
