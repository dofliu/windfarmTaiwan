/* 風電風情 · datapage.js — 資料下載 #/data：把網站已經在用的 JSON 整理成 CSV（在瀏覽器裡產生，永遠是最新的），每個資料集附欄位說明、出處與授權，以及建議的引用格式
   不另外存 CSV 進 repo：每日取樣每 30 分鐘變動，從 JSON 當場轉出才不會過時。CSV 為 UTF-8 加 BOM（Excel 直接開不會亂碼），欄名用英文（機器好讀），頁面另列中英文說明。
   出處與授權優先從各檔案的 meta 讀；沒有 meta 的（wind_global）寫在這裡，與風電知識「資料來源」一致。OpenStreetMap（ODbL）的風機位置不在這裡提供，避免與其他授權混在一起。
   The data page: the JSON the site already serves, converted to CSV in the browser (always current), each dataset with its columns, source and licence, plus a suggested citation.
   No CSV is stored in the repo; source and licence come from each file's meta where it has one. OSM turbine positions (ODbL) are not offered here. */
(function () {
'use strict';
const WW = window.WW;
const host = document.getElementById('page-data');
if (!host) return;
const L = WW.L, esc = WW.esc, EN = () => WW.lang === 'en';
const live = u => WW.getLiveJSON(u);
const TY = ['onshore', 'offshore', 'floating'];
const rng = v => v == null ? '' : Array.isArray(v) ? v.join('–') : v;
const twDate = ms => new Date(ms + 288e5).toISOString().slice(0, 10);

/* ---------- CSV ---------- */
function csv(head, rows) {
  const q = v => { if (v == null) return ''; const s = String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return '﻿' + [head].concat(rows).map(r => r.map(q).join(',')).join('\r\n') + '\r\n';
}
function download(name, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---------- 資料集：name、說明、欄位、出處／授權、原始檔、建置函式（回傳 {head, rows, note}） ---------- */
const SETS = () => [
  { id: 'daily_units', zh: '台灣各併網點每日取樣', en: 'Taiwan daily samples per grid unit', raw: WW.DATA.farmDaily,
    desc: L('台電即時資料各風力併網點（含民營）每天的平均出力與容量因數，由本站約每 30 分鐘的取樣算出（2026-10-22 以前約每 2 小時）。是取樣估計，不是官方發電量。', 'Each wind grid unit in Taipower\'s live data (private farms included): daily average output and capacity factor from the site\'s samples about every 30 minutes (about every 2 hours before 22 Oct 2026). Estimates from samples, not official generation.'),
    cols: [['date', L('日期（台灣時間）', 'date (Taiwan time)')], ['unit', L('併網點代碼', 'unit key')], ['unit_name', L('台電名稱', 'Taipower name')], ['samples', L('當天取樣次數', 'samples that day')], ['avg_mw', L('平均出力 MW', 'average output MW')], ['capacity_factor', L('容量因數（有列容量的取樣）', 'capacity factor (samples with a listed capacity)')], ['capacity_mw', L('平均列出容量 MW', 'average listed capacity MW')]],
    build: async () => { const J = await live(WW.DATA.farmDaily), rows = []; Object.keys(J.days).sort().forEach(d => { const D = J.days[d]; Object.entries(D.u || {}).forEach(([k, x]) => rows.push([d, k, J.names[k] || '', x[0], x[0] ? (x[1] / x[0]).toFixed(2) : '', x[4] > 0 ? (x[3] / x[4]).toFixed(4) : '', x[2] ? (x[4] / x[2]).toFixed(1) : ''])); }); return { rows, src: J.meta }; } },
  { id: 'daily_total', zh: '台灣每日總出力（取樣）', en: 'Taiwan daily total output (sampled)', raw: WW.DATA.farmDaily,
    desc: L('全台風電每天的平均出力（各併網點平均相加）、取樣次數與當天最高的一次取樣（2026-10-26 起記錄）。', 'Taiwan\'s wind output per day: the average (sum of unit averages), the sample count and the day\'s highest sample (recorded from 26 Oct 2026).'),
    cols: [['date', L('日期', 'date')], ['samples', L('取樣次數', 'samples')], ['avg_total_mw', L('平均總出力 MW', 'average total MW')], ['max_mw', L('最高取樣 MW', 'highest sample MW')], ['max_time', L('最高取樣的時間', 'time of the highest sample')]],
    build: async () => { const J = await live(WW.DATA.farmDaily), rows = Object.keys(J.days).sort().map(d => { const D = J.days[d]; let v = 0; Object.values(D.u || {}).forEach(x => { if (x[0]) v += x[1] / x[0]; }); return [d, (D.t || []).length, v.toFixed(1), D.mx ? D.mx[0] : '', D.mx ? D.mx[1] : '']; }); return { rows, src: J.meta }; } },
  { id: 'country_capacity', zh: '各國逐年風電裝置容量 1980–2025', en: 'National wind capacity by year 1980–2025', raw: WW.DATA.global,
    desc: L('各國年底累計裝置容量，陸域與離岸分開（MW）。台灣＝能源署《能源統計手冊》表 3-6，日本＝JWPA，其他＝IRENA（經 Our World in Data）；離岸拆分依 WFO／GWEC／EWEA。', 'Year-end cumulative capacity by country, onshore and offshore (MW). Taiwan from the Energy Administration handbook (table 3-6), Japan from JWPA, others from IRENA via Our World in Data; the offshore split from WFO / GWEC / EWEA.'),
    lic: L('IRENA 經 Our World in Data：CC BY 4.0；能源署：政府資料開放授權條款第 1 版；JWPA、WFO、GWEC、EWEA 統計：依各自網站的公開報告（引用時標示出處）', 'IRENA via Our World in Data: CC BY 4.0; Energy Administration: Open Government Data License v1; JWPA, WFO, GWEC, EWEA: public reports on their sites (cite the source)'),
    cols: [['iso', 'ISO 3166-1'], ['country', L('國家', 'country')], ['year', L('年', 'year')], ['onshore_mw', L('陸域 MW', 'onshore MW')], ['offshore_mw', L('離岸 MW', 'offshore MW')], ['total_mw', L('合計 MW', 'total MW')]],
    build: async () => { const D = await WW.globalData(), rows = []; D.countries.forEach(c => D.years.forEach((y, i) => { if (c.on[i] || c.off[i]) rows.push([c.iso, c.name, y, c.on[i], c.off[i], Math.round((c.on[i] + c.off[i]) * 10) / 10]); })); return { rows, src: { source: D.meta.title + ' — ' + D.meta.based_on } }; } },
  { id: 'farm_generation', zh: '風場實測年發電量與容量因數', en: 'Measured yearly farm output and capacity factor', raw: WW.DATA.generation,
    desc: L('有官方逐場數字的風場：美國（EIA-923）、台灣台電自有風場（台電開放資料）、丹麥（能源署）、澳洲（AEMO，含限電）。只列整年運轉的年份；容量因數的分母用當年時數。', 'Farms with official per-farm figures: USA (EIA-923), Taipower-owned farms (Taipower open data), Denmark (the energy agency), Australia (AEMO, curtailment included). Full years only; the factor uses the hours in the year.'),
    cols: [['iso', 'ISO'], ['farm', L('風場', 'farm')], ['year', L('年', 'year')], ['generation_gwh', L('年發電量 GWh', 'generation GWh')], ['capacity_factor_pct', L('容量因數 %', 'capacity factor %')], ['capacity_mw', L('計算用容量 MW', 'capacity used MW')], ['model', L('機型（整場單一型號才寫）', 'model (only when one model)')]],
    build: async () => { const J = await WW.getJSON(WW.DATA.generation), rows = []; Object.entries(J.farms).forEach(([k, f]) => Object.keys(f.y).sort().forEach(y => rows.push([k.slice(0, 3), k.slice(4), y, f.y[y][0], f.y[y][1], f.mw, f.m || '']))); return { rows, src: J.meta }; } },
  { id: 'farms_operating', zh: '營運中風場清單', en: 'Operating wind farms', raw: WW.DATA.farmPoints,
    desc: L('全球營運中的風場：名稱、座標、容量、商轉年、類型。位置只是概略的紀錄標 approx=1；共用省中心代用點的紀錄不列。完整資料（含規劃中、業主、機型）在 wind_farms.json。', 'Operating wind farms worldwide: name, position, capacity, start year, type. approx=1 marks approximate positions; records on shared placeholder points are left out. The full file (pipeline, owners, turbines) is wind_farms.json.'),
    lic: L('Global Energy Monitor「Global Wind Power Tracker」（CC BY 4.0）為主，另含 USWTDB（公有領域）、MaStR（Datenlizenz Deutschland – Namensnennung 2.0）與本站人工整理的紀錄；使用時標示「Global Energy Monitor」與本站', 'Mainly Global Energy Monitor\'s Global Wind Power Tracker (CC BY 4.0), with USWTDB (public domain), MaStR (Data licence Germany – attribution 2.0) and the site\'s own curated records; credit Global Energy Monitor and this site'),
    cols: [['name', L('名稱（英文）', 'name')], ['name_zh', L('中文名', 'Chinese name')], ['iso', 'ISO'], ['lat', L('緯度', 'latitude')], ['lon', L('經度', 'longitude')], ['capacity_mw', 'MW'], ['start_year', L('商轉年', 'start year')], ['type', 'onshore / offshore / floating'], ['approx', L('1＝概略位置', '1 = approximate position')]],
    build: async () => { const J = await WW.getJSON(WW.DATA.farmPoints); return { rows: J.rows.map(r => [r[0], r[1], r[2], r[3], r[4], r[5], r[6], TY[r[7]] || '', r[8]]), src: J.meta }; } },
  { id: 'offshore_foundations', zh: '離岸風場水下基礎與尺寸', en: 'Offshore foundations and dimensions', raw: WW.DATA.foundations,
    desc: L('本站逐場查證的離岸風場基礎型式（浮動式含細分型式）、水深、輪轂高度與葉輪直徑，每列附出處網址。', 'Offshore farms\' foundation types (floating with sub-type), water depth, hub height and rotor diameter, checked farm by farm with a source URL per row.'),
    lic: L('本站整理；OSPAR 紀錄 CC0 1.0，其餘出處見每列的 source 欄', 'Compiled by this site; OSPAR records CC0 1.0, other sources in each row\'s source column'),
    cols: [['farm', L('風場', 'farm')], ['type', L('型式代碼', 'type code')], ['type_name', L('型式', 'type')], ['floating_subtype', L('浮動式細分', 'floating sub-type')], ['depth_min_m', L('水深 m（最淺）', 'depth min m')], ['depth_max_m', L('水深 m（最深）', 'depth max m')], ['hub_height_m', L('輪轂高度 m', 'hub height m')], ['rotor_m', L('葉輪直徑 m', 'rotor m')], ['source', L('出處', 'source')]],
    build: async () => { const J = await WW.getJSON(WW.DATA.foundations), T = J.meta.types, S = J.meta.subs; return { rows: Object.entries(J.farms).map(([k, f]) => [k, f.t, T[f.t] ? (EN() ? T[f.t][1] : T[f.t][0]) : '', f.s ? (S[f.s] ? (EN() ? S[f.s][1] : S[f.s][0]) : f.s) : '', f.d ? f.d[0] : '', f.d ? f.d[1] : '', rng(f.h), rng(f.r), f.u || f.du || '']), src: { source: 'OSPAR ' + J.meta.ospar.title + ' (' + J.meta.ospar.licence + ') + per-row sources, asof ' + J.meta.asof } }; } },
  { id: 'lcoe_wind', zh: '全球風電均化發電成本 1984–2025', en: 'Global wind LCOE 1984–2025', raw: WW.DATA.lcoe,
    desc: L('IRENA 歷年成本報告的全球加權平均 LCOE，經 Our World in Data（固定 2025 年美元／度）。', 'IRENA\'s global weighted-average LCOE via Our World in Data (constant 2025 US$ per kWh).'),
    cols: [['year', L('年', 'year')], ['onshore_usd_per_kwh', L('陸域', 'onshore')], ['offshore_usd_per_kwh', L('離岸', 'offshore')]],
    build: async () => { const J = await WW.getJSON(WW.DATA.lcoe); return { rows: J.rows, src: J.meta }; } }
];

function srcText(s, set) {
  if (set.lic) return set.lic;
  if (!s) return '';
  const parts = [];
  const flat = v => typeof v === 'string' ? v : v && typeof v === 'object' ? Object.entries(v).map(([k, x]) => k + ': ' + x).join(' · ') : '';
  if (s.source) parts.push(flat(s.source));
  if (s.license || s.licence) parts.push(flat(s.license || s.licence));
  if (s.retrieved) parts.push(L('取用 ', 'retrieved ') + flat(s.retrieved));
  return parts.join(' — ');
}

/* ---------- 畫面 ---------- */
function paint() {
  const today = twDate(Date.now()), ver = WW.VERSION, url = WW.SITE;
  const cite = EN()
    ? `Dof Lab, National Chin-Yi University of Technology (2026). Wind Watch: Taiwan wind live × global wind story (version ${ver}) [data set]. ${url} (accessed ${today})`
    : `劉瑞弘研究室（2026）。風電風情：台灣風電即時 × 全球風電發展（版本 ${ver}）［資料集］。國立勤益科技大學。${url}（取用日期 ${today}）`;
  host.innerHTML = `<div class="wrap datapg"><header class="thead"><div class="eyebrow">${L('資料下載', 'Data')}</div><h1 class="h2">${L('本站資料的 CSV 與引用', 'The site\'s data as CSV, with citations')}</h1>
    <p class="lead">${L('下面每個資料集都從網站此刻在用的檔案當場轉成 CSV（UTF-8，Excel 與 Google 試算表可直接開），所以永遠是最新的；每個都寫出欄位、出處與授權。', 'Each dataset below is converted to CSV from the file the site is using right now (UTF-8; opens in Excel and Google Sheets), so it is always current; every one lists its columns, source and licence.')}</p></header>
    <div class="dsets">${SETS().map(s => `<article class="dset" data-id="${s.id}"><h2 class="h3">${esc(EN() ? s.en : s.zh)}</h2><p>${esc(s.desc)}</p>
      <details><summary>${L('欄位', 'Columns')}</summary><ul class="dcols">${s.cols.map(c => `<li><code>${c[0]}</code> ${esc(c[1])}</li>`).join('')}</ul></details>
      <div class="dsrc">${L('出處與授權：', 'Source and licence: ')}<span class="dsrct">${esc(s.lic || L('載入後顯示', 'shown after loading'))}</span></div>
      <div class="dbtns"><button class="btn sm" type="button" data-dl="${s.id}">⬇ ${L('下載 CSV', 'Download CSV')}</button><a class="btn sm" href="${s.raw}" target="_blank" rel="noopener">${L('原始 JSON', 'Raw JSON')}</a><span class="dn"></span></div></article>`).join('')}</div>
    <section class="tsec"><h2 class="h3">${L('引用本站', 'Citing the site')}</h2><p>${L('建議格式（學生報告、科展、論文）：', 'Suggested format (reports, science fairs, papers):')}</p><blockquote class="dcite">${esc(cite)}</blockquote>
      <p class="note">${L('引用某一個資料集時，請同時標示該資料集的原始出處與授權（上面每個資料集都有）；網站本身的程式、文字與圖表設計保留所有權利，各資料集依其來源授權使用。OpenStreetMap 的風機位置（ODbL）不在這裡提供。資料時間與限制見風電知識「資料來源與方法」。', 'When citing a dataset, also credit its original source and licence (listed above). The site\'s own code, text and chart design are all rights reserved; each dataset is used under its source\'s licence. OpenStreetMap turbine positions (ODbL) are not offered here. Data times and limits are in Learn\'s "Sources & method".')}</p>
      <button class="btn sm" type="button" id="dcopy">${L('複製引用格式', 'Copy citation')}</button></section></div>`;
  host.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => run(b.dataset.dl, b));
  const c = document.getElementById('dcopy'); if (c) c.onclick = async () => { try { await navigator.clipboard.writeText(cite); WW.toast(L('已複製 ✓', 'Copied ✓')); } catch (e) { WW.toast(L('請手動複製', 'Please copy it by hand')); } };
  SETS().forEach(s => s.build().then(r => { const el = host.querySelector(`[data-id="${s.id}"]`); if (!el) return; el.querySelector('.dn').textContent = L(WW.int(r.rows.length) + ' 列', WW.int(r.rows.length) + ' rows'); const t = srcText(r.src, s); if (t) el.querySelector('.dsrct').textContent = t; }).catch(() => {}));
}
async function run(id, btn) {
  const s = SETS().find(x => x.id === id); if (!s) return;
  btn.disabled = true;
  try { const r = await s.build(); download(`windfarmTaiwan-${id}-${twDate(Date.now())}.csv`, csv(s.cols.map(c => c[0]), r.rows)); WW.toast(L('CSV 已下載 ✓', 'CSV downloaded ✓')); }
  catch (e) { WW.toast(L('下載失敗，請稍後再試', 'Download failed; try again later')); }
  btn.disabled = false;
}
WW.datapage = { enter() { paint(); window.scrollTo(0, 0); }, leave() {} };
WW.onLang(() => { if (WW.currentPage() === 'data') paint(); });
})();
