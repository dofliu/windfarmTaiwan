/* 風電風情 · lessons.js — 風電知識的「動手試試看」：拉動滑桿看結果的四個小教具（index.html 的 <div data-lesson="…">）
   curve  功率曲線：風速、葉輪直徑、額定功率與功率係數 → 出力（P = ½ ρ A v³ Cp，ρ 用國際標準大氣海平面 1.225 kg/m³，Betz 極限 16/27 畫成虛線）
   wake   尾流效應：一排 5 部風機的間距 → 後面每部的風速與出力（Jensen 1983 的單一尾流模型：風速折減 = (1−√(1−Ct)) ÷ (1 + 2k·x/D)²，只算最近的上游一部）
   cf     容量因數：從 generation.json 的實測年發電量算 容量因數 = 發電量 ÷（容量 × 當年時數），再拉滑桿看「整年都以 X% 運轉」會發多少電
   cost   成本下降：lcoe_wind.json（IRENA 經 Our World in Data，全球加權平均、固定 2025 年美元）的陸域與離岸 LCOE，拉年份看數字
   前兩個是簡化的物理模型（介面寫明「簡化模型」與假設值），後兩個只用本站已查證的資料；文字雙語，換語言時重畫但保留滑桿的值。
   Four hands-on panels for Learn: a power curve, the wake effect (Jensen's single-wake model), the capacity factor from measured output,
   and the LCOE trend (IRENA via Our World in Data); the first two are labelled simplified models, the other two use only the site's verified data. */
(function () {
'use strict';
const WW = window.WW;
const L = WW.L, esc = WW.esc, EN = () => WW.lang === 'en';
const RHO = 1.225, BETZ = 16 / 27;                    // ISA 海平面空氣密度 kg/m³ · Betz 極限
const SRC = {
  isa: 'https://en.wikipedia.org/wiki/International_Standard_Atmosphere', betz: 'https://en.wikipedia.org/wiki/Betz%27s_law',
  jensen: 'https://orbit.dtu.dk/en/publications/a-note-on-wind-generator-interaction', katic: 'https://orbit.dtu.dk/en/publications/a-simple-model-for-cluster-efficiency'
};
const f1 = v => WW.num(v, 1), f0 = v => WW.int(v);
const link = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
let mounted = false, GEN = null, LCOE = null;

/* ---------- 共用：面板外框、滑桿 ---------- */
function shell(host, k, title, sub, body, out, src) {
  host.innerHTML = `<div class="lesson" data-k="${k}"><div class="lh"><span class="ltag">${L('🎛 動手試試看', '🎛 Try it')}</span><div><div class="lt">${title}</div><div class="ls">${sub}</div></div></div>
    <div class="lgrid"><div class="lctl">${body}</div><div class="lplot"></div></div><div class="lout"></div><div class="src">${src}</div></div>`;
  return { plot: host.querySelector('.lplot'), out: host.querySelector('.lout') };
}
const slider = (id, label, min, max, step, val, fmt) => `<label class="lsl"><span class="lk">${label}<output id="${id}-o">${fmt(val)}</output></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
function bind(host, S, fmts, draw) {                  // 每根滑桿：拉動即更新 S 與 <output>，再重畫
  host.querySelectorAll('input[type=range]').forEach(r => {
    const k = r.id.split('-').pop();
    r.oninput = () => { S[k] = +r.value; const o = host.querySelector('#' + r.id + '-o'); if (o) o.textContent = fmts[k](S[k]); draw(); };
  });
}
const chip = (k, v) => `<span class="lchip"><span class="ck">${k}</span><b>${v}</b></span>`;
const svgOpen = (W, H, label) => `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`;

/* ---------- 1. 功率曲線 ---------- */
const CV = { D: 154, P: 6, cp: 0.45, v: 8 };           // 預設：海洋風電二期的 SWT-6.0-154（6 MW、154 m）；Cp 0.45 是假設值
function curve(host) {
  const F = { D: v => v + ' m', P: v => f1(v) + ' MW', cp: v => v.toFixed(2), v: v => f1(v) + ' m/s' };
  const { plot, out } = shell(host, 'curve', L('一部風機的功率曲線', 'One turbine\'s power curve'),
    L('簡化模型：出力 P = ½ · ρ · A · v³ · Cp，到額定功率就不再增加；3 m/s 以下不發電，25 m/s 以上停機保護。拉動滑桿看風速、葉輪大小與額定功率怎麼影響出力。',
      'Simplified model: P = ½ · ρ · A · v³ · Cp, capped at the rated power; no output below 3 m/s and a protective stop from 25 m/s. Drag the sliders to see how wind speed, rotor size and rated power change the output.'),
    slider('cv-v', L('風速', 'Wind speed'), 0, 30, 0.5, CV.v, F.v) + slider('cv-D', L('葉輪直徑', 'Rotor diameter'), 40, 310, 1, CV.D, F.D) +
    slider('cv-P', L('額定功率', 'Rated power'), 0.5, 26, 0.5, CV.P, F.P) + slider('cv-cp', L('功率係數 Cp（假設值）', 'Power coefficient Cp (assumed)'), 0.2, 0.59, 0.01, CV.cp, F.cp),
    '', L(`假設：空氣密度 ρ = ${RHO} kg/m³（國際標準大氣海平面，${link(SRC.isa, 'ISA')}）；理論上限 Cp ≤ 16/27 ≈ 0.593（${link(SRC.betz, 'Betz 極限')}，虛線）；切入 3 m/s、切出 25 m/s 是常見設定（見名詞小辭典）。真實的功率曲線由製造商在標準空氣密度下實測公布，形狀與這條略有不同。`,
      `Assumptions: air density ρ = ${RHO} kg/m³ (International Standard Atmosphere at sea level, ${link(SRC.isa, 'ISA')}); the theoretical limit Cp ≤ 16/27 ≈ 0.593 (${link(SRC.betz, "Betz's law")}, dashed); cut-in 3 m/s and cut-out 25 m/s are typical settings (see the glossary). Real power curves are measured and published by the maker at standard air density and differ a little in shape.`));
  const draw = () => {
    const A = Math.PI * CV.D * CV.D / 4, pw = (v, cp) => (v < 3 || v >= 25) ? 0 : Math.min(CV.P, 0.5 * RHO * A * v * v * v * cp / 1e6);
    const vr = Math.cbrt(CV.P * 1e6 / (0.5 * RHO * A * CV.cp)), W = 520, H = 230, px = 44, py = 14, pb = 34, pw_ = W - px - 12, ph = H - py - pb;
    const X = v => px + v / 30 * pw_, Y = p => py + ph - p / (CV.P * 1.08) * ph;
    const path = cp => { let d = ''; for (let v = 0; v <= 30; v += 0.25) d += (d ? 'L' : 'M') + X(v).toFixed(1) + ',' + Y(pw(v, cp)).toFixed(1); return d; };
    const vv = CV.v, p = pw(vv, CV.cp);
    let g = svgOpen(W, H, L(`功率曲線：葉輪 ${CV.D} m、額定 ${CV.P} MW，風速 ${vv} m/s 時出力 ${f1(p)} MW`, `Power curve: ${CV.D} m rotor, ${CV.P} MW rated, ${f1(p)} MW at ${vv} m/s`));
    for (let v = 0; v <= 30; v += 5) g += `<line class="lg" x1="${X(v)}" x2="${X(v)}" y1="${py}" y2="${py + ph}"/><text class="lx" x="${X(v)}" y="${H - 16}" text-anchor="middle">${v}</text>`;
    [0, 0.5, 1].forEach(f => { g += `<line class="lg" x1="${px}" x2="${W - 12}" y1="${Y(CV.P * f)}" y2="${Y(CV.P * f)}"/><text class="lx" x="${px - 6}" y="${Y(CV.P * f) + 4}" text-anchor="end">${f1(CV.P * f)}</text>`; });
    g += `<text class="lx" x="${W - 12}" y="${H - 2}" text-anchor="end">m/s</text><text class="lx" x="${px - 6}" y="${py - 2}" text-anchor="end">MW</text>`;
    g += `<line class="lcut" x1="${X(3)}" x2="${X(3)}" y1="${py}" y2="${py + ph}"/><line class="lcut" x1="${X(25)}" x2="${X(25)}" y1="${py}" y2="${py + ph}"/>`;
    g += `<text class="lx2" x="${X(3) + 3}" y="${py + 10}">${L('切入 3', 'cut-in 3')}</text><text class="lx2" x="${X(25) - 3}" y="${py + 10}" text-anchor="end">${L('切出 25', 'cut-out 25')}</text>`;
    g += `<path class="lbz" d="${path(BETZ)}"/><path class="lcv" d="${path(CV.cp)}"/>`;
    g += `<circle class="lpt" cx="${X(vv).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="5"/><text class="lv" x="${(X(vv) + (vv > 22 ? -9 : 9)).toFixed(1)}" y="${(Y(p) - 9).toFixed(1)}" text-anchor="${vv > 22 ? 'end' : 'start'}">${f1(vv)} m/s → ${f1(p)} MW</text></svg>`;
    plot.innerHTML = g;
    out.innerHTML = chip(L('此刻出力', 'Output'), `${f1(p)} MW（${L('額定的 ', '')}${Math.round(p / CV.P * 100)}%${L('', ' of rated')}）`) +
      chip(L('達到額定的風速', 'Rated wind speed'), vr < 25 ? L('約 ', 'about ') + f1(vr) + ' m/s' : L('超過 25 m/s（到切出前都達不到）', 'over 25 m/s (never reached before cut-out)')) +
      chip(L('掃風面積', 'Swept area'), f0(A) + ' m²') + chip(L('這樣吹一小時', 'One hour like this'), L(f0(p * 1000) + ' 度電', f0(p * 1000) + ' kWh'));
  };
  bind(host, CV, F, draw); draw();
}

/* ---------- 2. 尾流效應 ---------- */
const WK = { s: 7, k: 0.075, ct: 0.8 };               // 間距（倍葉輪直徑）、尾流擴張係數、推力係數
function wake(host) {
  const N = 5, F = { s: v => f1(v) + ' D', k: v => v.toFixed(3), ct: v => v.toFixed(2) };
  const { plot, out } = shell(host, 'wake', L('尾流效應：風機排成一排，後面的還有多少風？', 'The wake effect: how much wind is left for the turbines behind?'),
    L('簡化模型（Jensen 1983）：每部風機後方的尾流像一個越來越寬的圓錐，風速折減 = (1 − √(1 − Ct)) ÷ (1 + 2k·x/D)²，x 是距離、D 是葉輪直徑；出力與風速的三次方成正比。這裡只算最近一部上游風機的尾流、風正對著這一排吹。',
      'Simplified model (Jensen 1983): behind each turbine the wake widens like a cone and the speed deficit is (1 − √(1 − Ct)) ÷ (1 + 2k·x/D)², with x the distance and D the rotor diameter; power goes with the cube of the speed. Only the nearest upstream wake is counted and the wind blows straight along the row.'),
    slider('wk-s', L('風機間距（葉輪直徑的倍數）', 'Spacing (rotor diameters)'), 2, 12, 0.5, WK.s, F.s) + slider('wk-k', L('尾流擴張係數 k', 'Wake decay constant k'), 0.03, 0.1, 0.005, WK.k, F.k) +
    slider('wk-ct', L('推力係數 Ct', 'Thrust coefficient Ct'), 0.5, 0.9, 0.05, WK.ct, F.ct),
    '', L(`模型：${link(SRC.jensen, 'N.O. Jensen, A note on wind generator interaction, Risø-M-2411 (1983)')}；${link(SRC.katic, 'Katić, Højstrup & Jensen (1986)')} 把它用到整座風場，陸域常用 k ≈ 0.075；海上大氣較穩定、尾流恢復較慢，常用較小的 k。Ct 隨風速變化，額定風速以下多在 0.7–0.9。實際風場要考慮風向分布、多個尾流疊加與地形，這裡只是示意。`,
      `Model: ${link(SRC.jensen, 'N.O. Jensen, A note on wind generator interaction, Risø-M-2411 (1983)')}; ${link(SRC.katic, 'Katić, Højstrup & Jensen (1986)')} applied it to whole farms, with k ≈ 0.075 commonly used onshore; offshore the air is more stable and wakes recover more slowly, so a smaller k is used. Ct varies with wind speed and is mostly 0.7–0.9 below rated speed. A real farm also depends on the wind-direction distribution, overlapping wakes and terrain; this is only a sketch.`));
  const draw = () => {
    const d = (1 - Math.sqrt(1 - WK.ct)) / Math.pow(1 + 2 * WK.k * WK.s, 2), V = [1], P = [1];
    for (let i = 1; i < N; i++) { V.push(V[i - 1] * (1 - d)); P.push(Math.pow(V[i], 3)); }
    const avg = P.reduce((a, b) => a + b, 0) / N, W = 520, H = 210, x0 = 40, step = (W - 80) / (N - 1), Dpx = Math.min(40, step / WK.s * 1.6), cy = 70;
    let g = svgOpen(W, H, L(`間距 ${WK.s} 倍葉輪直徑：第 2 部風速 ${Math.round(V[1] * 100)}%、出力 ${Math.round(P[1] * 100)}%，整排平均出力 ${Math.round(avg * 100)}%`, `Spacing ${WK.s} D: turbine 2 sees ${Math.round(V[1] * 100)}% of the wind and makes ${Math.round(P[1] * 100)}% of the power; row average ${Math.round(avg * 100)}%`));
    g += `<text class="lx2" x="${x0 - 30}" y="${cy + 4}">${L('風 →', 'wind →')}</text>`;
    for (let i = 0; i < N - 1; i++) {                 // 尾流圓錐：半寬 = D/2 + k·x（俯視）
      const xa = x0 + i * step, xb = x0 + (i + 1) * step, ha = Dpx / 2, hb = Dpx / 2 + WK.k * WK.s * Dpx;
      g += `<polygon class="lwk" points="${xa},${cy - ha} ${xb},${cy - hb} ${xb},${cy + hb} ${xa},${cy + ha}" style="opacity:${(0.25 + 0.6 * (1 - V[i + 1])).toFixed(2)}"/>`;
    }
    for (let i = 0; i < N; i++) {
      const x = x0 + i * step;
      g += `<line class="lrot" x1="${x}" x2="${x}" y1="${cy - Dpx / 2}" y2="${cy + Dpx / 2}"/><circle class="lhub" cx="${x}" cy="${cy}" r="3"/>`;
      g += `<text class="lx" x="${x}" y="${cy + Dpx / 2 + 16}" text-anchor="middle">${i + 1}</text>`;
      const bh = 60 * P[i], by = H - 14 - bh;        // 下方：每部出力的長條
      g += `<rect class="lbar" x="${x - 14}" y="${by.toFixed(1)}" width="28" height="${bh.toFixed(1)}" rx="3"/><text class="lv" x="${x}" y="${(by - 4).toFixed(1)}" text-anchor="middle">${Math.round(P[i] * 100)}%</text>`;
    }
    g += `<text class="lx2" x="${W - 8}" y="${H - 2}" text-anchor="end">${L('每部出力（第 1 部＝100%）', 'power per turbine (first = 100%)')}</text></svg>`;
    plot.innerHTML = g;
    out.innerHTML = chip(L('第 2 部的風速', 'Wind at turbine 2'), Math.round(V[1] * 100) + '%') + chip(L('第 2 部的出力', 'Power of turbine 2'), Math.round(P[1] * 100) + '%') +
      chip(L('第 5 部的出力', 'Power of turbine 5'), Math.round(P[4] * 100) + '%') + chip(L('整排 5 部的平均出力', 'Row average (5 turbines)'), Math.round(avg * 100) + '%');
  };
  bind(host, WK, F, draw); draw();
}

/* ---------- 3. 容量因數（實測） ---------- */
const CF = { key: 'TWN|Dayuan Guanyuan', pct: 35 };
const CO = { TWN: ['台灣（台電自有）', 'Taiwan (Taipower-owned)'], DNK: ['丹麥', 'Denmark'], AUS: ['澳洲', 'Australia'], USA: ['美國', 'United States'] };
function cfList() {                                  // 台灣全部；其他國家各取容量最大的 6 座
  const all = Object.entries(GEN.farms).map(([k, v]) => { const ys = Object.keys(v.y).sort(); return { k, iso: k.split('|')[0], name: k.split('|')[1], mw: v.mw, y: +ys[ys.length - 1], r: v.y[ys[ys.length - 1]] }; }).filter(x => CO[x.iso] && x.r);
  const out = [];
  Object.keys(CO).forEach(iso => { const xs = all.filter(x => x.iso === iso).sort((a, b) => iso === 'TWN' ? a.name.localeCompare(b.name) : b.mw - a.mw); out.push(...(iso === 'TWN' ? xs : xs.slice(0, 6))); });
  return out;
}
function cf(host) {
  if (!GEN) { host.innerHTML = ''; return; }
  const list = cfList(); if (!list.find(x => x.k === CF.key)) CF.key = list[0].k;
  const F = { pct: v => v + '%' };
  const opts = Object.keys(CO).map(iso => `<optgroup label="${esc(L(CO[iso][0], CO[iso][1]))}">${list.filter(x => x.iso === iso).map(x => `<option value="${esc(x.k)}"${x.k === CF.key ? ' selected' : ''}>${esc(x.name)}（${f0(x.mw)} MW）</option>`).join('')}</optgroup>`).join('');
  const { plot, out } = shell(host, 'cf', L('容量因數：一座風場一年到底發了多少電？', 'Capacity factor: how much did a farm actually generate in a year?'),
    L('容量因數 = 一年的實際發電量 ÷（裝置容量 × 當年的時數）。挑一座有官方實測的風場看它的數字，再拉滑桿想像「整年都以這個比例運轉」會發多少電。',
      'Capacity factor = actual yearly generation ÷ (installed capacity × hours in the year). Pick a farm with official measured output, then drag the slider to imagine running at that share all year.'),
    `<label class="lsl"><span class="lk">${L('風場（最新一個完整年度）', 'Farm (latest full year)')}</span><select class="fsel" id="cf-sel">${opts}</select></label>` + slider('cf-pct', L('假如整年都以這個比例運轉', 'If it ran at this share all year'), 0, 100, 1, CF.pct, F.pct),
    '', '');
  const src = host.querySelector('.src');
  const draw = () => {
    const x = list.find(q => q.k === CF.key), hrs = (x.y % 4 === 0 && (x.y % 100 !== 0 || x.y % 400 === 0)) ? 8784 : 8760, gen = x.r[0], cfv = x.r[1], ideal = x.mw * hrs / 1000, what = ideal * CF.pct / 100;
    const W = 440, H = 120, bx = 120, bw = W - bx - 64, row = (y, k, v, pct, cls) => `<text class="lx" x="${bx - 8}" y="${y + 15}" text-anchor="end">${k}</text><rect class="ltrk" x="${bx}" y="${y}" width="${bw}" height="22" rx="4"/><rect class="${cls}" x="${bx}" y="${y}" width="${(bw * Math.min(1, pct / 100)).toFixed(1)}" height="22" rx="4"/><text class="lv" x="${bx + bw + 6}" y="${y + 15}">${v}</text>`;
    plot.innerHTML = svgOpen(W, H, L(`${x.name}：${x.y} 年容量因數 ${cfv}%；滑桿 ${CF.pct}%`, `${x.name}: ${cfv}% capacity factor in ${x.y}; slider ${CF.pct}%`)) +
      row(18, L('實測 ' + x.y, 'Measured ' + x.y), cfv + '%', cfv, 'lbar') + row(58, L('滑桿', 'Slider'), CF.pct + '%', CF.pct, 'lbar2') +
      `<text class="lx2" x="${bx}" y="${H - 6}">0%</text><text class="lx2" x="${bx + bw}" y="${H - 6}" text-anchor="end">100%${L('（整年滿載）', ' (full output all year)')}</text></svg>`;
    out.innerHTML = chip(L('裝置容量', 'Capacity'), f1(x.mw) + ' MW') + chip(L(x.y + ' 年實際發電', 'Generated in ' + x.y), f1(gen) + ' GWh' + L('（' + f0(gen * 1e6) + ' 度）', '')) +
      chip(L('容量因數', 'Capacity factor'), `${f1(gen)} ÷ (${f1(x.mw)} × ${f0(hrs)} h) = ${cfv}%`) + chip(L(`整年以 ${CF.pct}% 運轉會發`, `At ${CF.pct}% all year`), f1(what) + ' GWh');
    const M = GEN.meta, s = M.source && M.source[x.iso];
    src.innerHTML = esc(L('實測值來源：', 'Measured output: ') + (s || '')) + (M.license && M.license[x.iso] ? ' · ' + esc(M.license[x.iso]) : '') + esc(L(' · 只列整年運轉的年份；澳洲含限電。全國平均值與台灣即時頁的「可用率」（瞬間值）不是同一個東西。', ' · full years only; Australia includes curtailment. A national average, or the instantaneous "availability" on the live page, is not the same thing.'));
  };
  host.querySelector('#cf-sel').onchange = e => { CF.key = e.target.value; const x = list.find(q => q.k === CF.key); CF.pct = Math.round(x.r[1]); host.querySelector('#cf-pct').value = CF.pct; host.querySelector('#cf-pct-o').textContent = F.pct(CF.pct); draw(); };
  bind(host, CF, F, draw); draw();
}

/* ---------- 4. 成本下降（LCOE） ---------- */
const CS = { year: 2025 };
function cost(host) {
  if (!LCOE) { host.innerHTML = ''; return; }
  const rows = LCOE.rows.filter(r => r[1] != null && r[2] != null), y0 = rows[0][0], y1 = rows[rows.length - 1][0];
  if (CS.year < y0 || CS.year > y1) CS.year = y1;
  const F = { year: v => String(v) };
  const { plot, out } = shell(host, 'cost', L('風電越來越便宜：每度電的均化成本', 'Wind keeps getting cheaper: the levelised cost per kWh'),
    L('全球新建風場的加權平均均化發電成本（LCOE，固定 2025 年美元／度）。拉年份看陸域與離岸各是多少、比 2010 年便宜了幾成。', 'Global weighted-average levelised cost of electricity (LCOE, constant 2025 US$ per kWh) of newly commissioned wind farms. Drag the year to see onshore and offshore costs and how far they fell from 2010.'),
    slider('cs-year', L('年份', 'Year'), y0, y1, 1, CS.year, F.year), '',
    esc(L('資料：', 'Data: ') + LCOE.meta.source + ' · ' + LCOE.meta.licence + L('，取用 ', ', retrieved ') + LCOE.meta.retrieved + L('。全球平均、固定幣值的估計，各國與各案差很多；台灣的躉購費率見上圖，兩者口徑不同。', '. Global constant-money averages that vary widely by country and project; Taiwan\'s feed-in tariffs above are a different measure.')) + ' ' + link(LCOE.meta.url, 'Our World in Data'));
  const draw = () => {
    const W = 520, H = 220, px = 44, py = 14, pb = 30, pw = W - px - 12, ph = H - py - pb, mx = Math.max(...rows.map(r => Math.max(r[1], r[2]))) * 1.08;
    const X = y => px + (y - y0) / (y1 - y0) * pw, Y = v => py + ph - v / mx * ph, r = rows.find(q => q[0] === CS.year), b = rows.find(q => q[0] === 2010) || rows[0];
    const path = i => rows.map((q, j) => (j ? 'L' : 'M') + X(q[0]).toFixed(1) + ',' + Y(q[i]).toFixed(1)).join('');
    let g = svgOpen(W, H, L(`${CS.year} 年：陸域 ${r[1].toFixed(3)}、離岸 ${r[2].toFixed(3)} 美元／度`, `${CS.year}: onshore ${r[1].toFixed(3)}, offshore ${r[2].toFixed(3)} US$/kWh`));
    for (let y = y0; y <= y1; y += 5) g += `<line class="lg" x1="${X(y)}" x2="${X(y)}" y1="${py}" y2="${py + ph}"/><text class="lx" x="${X(y)}" y="${H - 12}" text-anchor="middle">${y}</text>`;
    [0, 0.05, 0.1, 0.15, 0.2].filter(v => v < mx).forEach(v => { g += `<line class="lg" x1="${px}" x2="${W - 12}" y1="${Y(v)}" y2="${Y(v)}"/><text class="lx" x="${px - 6}" y="${Y(v) + 4}" text-anchor="end">${v.toFixed(2)}</text>`; });
    g += `<text class="lx" x="${px - 6}" y="${py - 2}" text-anchor="end">$/kWh</text>`;
    g += `<path class="lon" d="${path(1)}"/><path class="loff" d="${path(2)}"/><line class="lcut" x1="${X(CS.year)}" x2="${X(CS.year)}" y1="${py}" y2="${py + ph}"/>`;
    g += `<circle class="lpt lon" cx="${X(CS.year)}" cy="${Y(r[1])}" r="5"/><circle class="lpt loff" cx="${X(CS.year)}" cy="${Y(r[2])}" r="5"/>`;
    const lx = CS.year > y0 + (y1 - y0) * 0.7 ? -9 : 9, ta = lx < 0 ? 'end' : 'start';
    g += `<text class="lv" x="${X(CS.year) + lx}" y="${Y(r[2]) - 8}" text-anchor="${ta}">${L('離岸', 'Offshore')} ${r[2].toFixed(3)}</text><text class="lv" x="${X(CS.year) + lx}" y="${Y(r[1]) + 16}" text-anchor="${ta}">${L('陸域', 'Onshore')} ${r[1].toFixed(3)}</text></svg>`;
    plot.innerHTML = g;
    const dn = (a, c) => c > a ? L(`比 2010 年便宜 ${Math.round((1 - a / c) * 100)}%`, `${Math.round((1 - a / c) * 100)}% cheaper than 2010`) : L(`比 2010 年貴 ${Math.round((a / c - 1) * 100)}%`, `${Math.round((a / c - 1) * 100)}% dearer than 2010`);
    out.innerHTML = chip(L(`${CS.year} 陸域`, `${CS.year} onshore`), `$${r[1].toFixed(3)}/kWh`) + chip(L(`${CS.year} 離岸`, `${CS.year} offshore`), `$${r[2].toFixed(3)}/kWh`) +
      (CS.year !== 2010 && b ? chip(L('陸域', 'Onshore'), dn(r[1], b[1])) + chip(L('離岸', 'Offshore'), dn(r[2], b[2])) : chip('2010', L('基準年', 'base year')));
  };
  bind(host, CS, F, draw); draw();
}

/* ---------- 掛載：風電知識頁畫好後（learn.js 的 renderAll 呼叫），換語言重畫 ---------- */
const LESSONS = { curve, wake, cf, cost };
function mount() {
  const hosts = [...document.querySelectorAll('#page-learn [data-lesson]')]; if (!hosts.length) return;
  mounted = true;
  const paint = () => hosts.forEach(h => { try { LESSONS[h.dataset.lesson](h); } catch (e) { console.error(e); h.innerHTML = ''; } });
  paint();
  if (!GEN) WW.getJSON(WW.DATA.generation).then(J => { GEN = J; hosts.filter(h => h.dataset.lesson === 'cf').forEach(cf); }).catch(() => {});
  if (!LCOE) WW.getJSON(WW.DATA.lcoe).then(J => { LCOE = J; hosts.filter(h => h.dataset.lesson === 'cost').forEach(cost); }).catch(() => {});
}
WW.lessons = { mount };
WW.onLang(() => { if (mounted) mount(); });
})();
