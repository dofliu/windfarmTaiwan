/* 風電風情 · lab-levels.js — 風電實驗室的 8 關（由 assets/js/lab/l1.js–l8.js 合併）· the eight Wind Lab levels */
/* 第 1 關 · 風的能量：P = ½ ρ A v³，Betz 極限 16/27（ISA 海平面空氣密度 1.225 kg/m³；葉輪直徑取自 foundations.json 的海洋風電二期） */
(function () {
'use strict';
const RHO = 1.225, BETZ = 16 / 27;
const SRC = [
  { label: 'International Standard Atmosphere (ρ = 1.225 kg/m³)', url: 'https://en.wikipedia.org/wiki/International_Standard_Atmosphere' },
  { label: "Betz's law (16/27)", url: 'https://en.wikipedia.org/wiki/Betz%27s_law' }
];
WW.lab.add({
  n: 1, id: 'energy',
  title: ['風的能量', 'The energy in the wind'],
  hook: ['風速只變兩倍，風裡的能量為什麼變成八倍？', 'Why does doubling the wind speed give eight times the power?'],
  need: ['foundations'],
  build({ sh, D, U }) {
    const { L, f } = U;
    const fd = D.foundations && D.foundations.farms && D.foundations.farms['Formosa 1 Phase 2'];
    const DR = fd && fd.r ? fd.r : 154;                          // 海洋風電二期的葉輪直徑（本站查證值）
    const area = d => Math.PI * d * d / 4, pw = (d, v) => 0.5 * RHO * area(d) * v * v * v;
    const intro = '<p>' + L('風是流動的空氣，有質量也有速度，所以帶著動能。每秒鐘穿過葉輪掃過面積 A 的空氣質量是 ρ·A·v，它的動能是 ½·m·v²，合起來就是風「流過」葉輪的功率：',
      'Wind is moving air: it has mass and speed, so it carries kinetic energy. Each second a mass of ρ·A·v passes through the area A swept by the rotor; its kinetic energy is ½·m·v², so the power flowing through the rotor is:') + '</p>' +
      U.eq('P<sub>' + L('風', 'wind') + '</sub> = ½ · ρ · A · v³') +
      '<p>' + L('ρ 是空氣密度（這裡用國際標準大氣海平面的 1.225 kg/m³），A 是掃風面積（π·D²/4），v 是風速。風機只能把其中一部分變成電，這個比例叫功率係數 Cp；理論上最多 16/27 ≈ 59.3%（Betz 極限）。',
        'ρ is the air density (here the International Standard Atmosphere value at sea level, 1.225 kg/m³), A the swept area (π·D²/4) and v the wind speed. A turbine turns only part of it into electricity: the power coefficient Cp, at most 16/27 ≈ 59.3% in theory (the Betz limit).') + '</p>';
    const S = { v: 8, d: DR, cp: 0.45 };
    const fm = { v: x => f(x, 1) + ' m/s', d: x => U.int(x) + ' m', cp: x => x.toFixed(2) };
    const tool = {
      html: '<div class="lbgridt"><div>' + U.slider('v', L('風速 v', 'Wind speed v'), 0, 25, 0.5, S.v, fm.v) + U.slider('d', L('葉輪直徑 D', 'Rotor diameter D'), 20, 320, 1, S.d, fm.d) +
        U.slider('cp', L('功率係數 Cp（假設值）', 'Power coefficient Cp (assumed)'), 0.2, 0.59, 0.01, S.cp, fm.cp) + '</div><div id="lb1out"></div></div>' +
        '<p class="note">' + L('簡化模型：沒有額定功率上限、切入與切出風速，只看風本身帶來多少功率。', 'Simplified model: no rated-power cap, cut-in or cut-out speed — just the power the wind brings.') + '</p>',
      mount(root) {
        const out = root.querySelector('#lb1out');
        const draw = () => {
          const pwd = pw(S.d, S.v) / 1e6, pt = pwd * S.cp, pb = pwd * BETZ;
          out.innerHTML = U.chip(L('掃風面積 A', 'Swept area A'), U.int(area(S.d)) + ' m²') + U.chip(L('風中的功率', 'Power in the wind'), f(pwd, 2) + ' MW') +
            U.chip(L('Betz 上限（59.3%）', 'Betz limit (59.3%)'), f(pb, 2) + ' MW') + U.chip(L('風機取得（×Cp）', 'Turbine gets (×Cp)'), f(pt, 2) + ' MW') +
            '<p class="note">' + L('試試看：風速從 5 拉到 10 m/s，或把葉輪直徑拉成兩倍，數字怎麼變？', 'Try it: move the wind speed from 5 to 10 m/s, or double the rotor diameter. How do the numbers change?') + '</p>';
        };
        U.bind(root, S, fm, draw); draw();
      }
    };
    let qs;
    if (!sh) {
      qs = [
        { id: 'a', type: 'mc', q: L('風速從 5 m/s 變成 10 m/s（變 2 倍），風中的功率變成原來的幾倍？', 'The wind speed goes from 5 to 10 m/s (×2). How many times larger is the power in the wind?'),
          opts: [[L('2 倍', '2×'), L('功率和 v³ 成正比，不是和 v 成正比。', 'Power goes with v³, not with v.')], [L('4 倍', '4×'), L('那是 v²；別忘了每秒流過的空氣也變多了。', 'That is v²; remember that more air flows through each second too.')], [L('8 倍', '8×')], [L('16 倍', '16×'), L('算成 v⁴ 了。', 'That would be v⁴.')]],
          a: 2, hint: L('用滑桿試一次，或算 2³。', 'Try it with the slider, or work out 2³.'), sol: '<p>' + L('P ∝ v³，所以 (10 ÷ 5)³ = 2³ = 8 倍。', 'P ∝ v³, so (10 ÷ 5)³ = 2³ = 8 times.') + '</p>' },
        { id: 'b', type: 'num', q: L('風速 10 m/s 時，每 1 平方公尺掃風面積裡，風的功率是多少瓦（W）？（ρ = 1.225 kg/m³）', 'At 10 m/s, how many watts (W) of wind power flow through each square metre? (ρ = 1.225 kg/m³)'),
          ans: 0.5 * RHO * 1000, unit: 'W', tol: { abs: 3 }, hint: L('P = ½ × 1.225 × 1 × 10³。', 'P = ½ × 1.225 × 1 × 10³.'),
          sol: U.eq('½ × 1.225 × 1 × 10³ = ' + f(0.5 * RHO * 1000, 1) + ' W') },
        { id: 'c', type: 'mc', q: L('葉輪直徑變成 2 倍，掃風面積變成幾倍？', 'If the rotor diameter doubles, how many times larger is the swept area?'),
          opts: [[L('2 倍', '2×'), L('面積和直徑的平方成正比。', 'Area goes with the square of the diameter.')], [L('4 倍', '4×')], [L('8 倍', '8×'), L('那是立方；面積只有平方。', 'That is a cube; area is only a square.')], [L('π 倍', 'π×'), L('π 兩邊都有，會約掉。', 'π is on both sides and cancels.')]],
          a: 1, hint: L('A = π·D²/4。', 'A = π·D²/4.'), sol: '<p>' + L('A = π·D²/4，D 變 2 倍，A 變 2² = 4 倍；所以葉輪越大，同樣的風能拿到越多能量。', 'A = π·D²/4: doubling D gives 2² = 4 times the area, which is why bigger rotors catch much more energy.') + '</p>' }
      ];
    } else {
      const p8 = pw(DR, 8) / 1e6;
      qs = [
        { id: 'a', type: 'num', q: L('風速從 6 m/s 增加到 9 m/s，風中的功率變成原來的幾倍？（算到小數第二位）', 'The wind rises from 6 to 9 m/s. By what factor does the power in the wind grow? (two decimals)'),
          ans: Math.pow(9 / 6, 3), unit: L('倍', '×'), tol: { abs: 0.011 }, hint: L('(9 ÷ 6)³。', '(9 ÷ 6)³.'), sol: U.eq('(9 / 6)³ = 1.5³ = ' + f(Math.pow(1.5, 3), 3)) },
        { id: 'b', type: 'num', q: L('海洋風電二期的風機葉輪直徑 ' + U.int(DR) + ' m。風速 8 m/s 時，流過它的風有多少百萬瓦（MW）？（ρ = 1.225 kg/m³，算到小數第一位）',
            'The turbines of Formosa 1 Phase 2 have a ' + U.int(DR) + ' m rotor. At 8 m/s, how many megawatts (MW) of wind flow through it? (ρ = 1.225 kg/m³, one decimal)'),
          ans: p8, unit: 'MW', tol: { abs: 0.06 }, hint: L('A = π × ' + U.int(DR) + '² ÷ 4，再算 ½ρAv³，最後除以 10⁶。', 'A = π × ' + U.int(DR) + '² ÷ 4, then ½ρAv³, then divide by 10⁶.'),
          sol: U.eq('A = π × ' + U.int(DR) + '² / 4 ≈ ' + U.int(area(DR)) + ' m²') + U.eq('P = ½ × 1.225 × ' + U.int(area(DR)) + ' × 8³ ≈ ' + f(p8, 2) + ' MW') },
        { id: 'c', type: 'num', q: L('同一部風機在 8 m/s 時，依 Betz 極限最多能取得多少 MW？（算到小數第一位）', 'For the same turbine at 8 m/s, what is the most it can extract under the Betz limit, in MW? (one decimal)'),
          ans: p8 * BETZ, unit: 'MW', tol: { abs: 0.06 }, hint: L('把上一題的答案乘上 16/27。', 'Multiply the previous answer by 16/27.'), sol: U.eq(f(p8, 2) + ' × 16/27 ≈ ' + f(p8 * BETZ, 2) + ' MW') },
        { id: 'd', type: 'mc', q: L('為什麼風機不可能把風的能量 100% 變成電（Cp 不可能等於 1）？', 'Why can no turbine turn 100% of the wind\'s power into electricity (Cp can never be 1)?'),
          opts: [[L('葉片太重，轉不動', 'The blades are too heavy to turn'), L('重量影響啟動，但不是理論上限的原因。', 'Weight matters for start-up, but it is not why there is a theoretical limit.')],
            [L('如果把空氣的動能全部取走，空氣會停在葉輪後面，後面的風就流不過來', 'If all the kinetic energy were taken, the air would stop behind the rotor and no more air could flow through')],
            [L('發電機的效率不夠高', 'The generator is not efficient enough'), L('發電機損失是另外一筆；Betz 極限算的是葉輪本身能取多少。', 'Generator losses come on top; the Betz limit is about what the rotor itself can take.')],
            [L('空氣密度太小', 'The air density is too low'), L('密度影響功率大小，但不影響 16/27 這個比例。', 'Density changes the amount, not the 16/27 ratio.')]],
          a: 1, hint: L('想想風通過葉輪後還要繼續往後流。', 'Think about the air having to keep flowing away behind the rotor.'),
          sol: '<p>' + L('風通過葉輪後必須帶著一部分速度離開，否則會堵住後面的空氣。Betz 證明在最理想的情況下，葉輪最多只能取走 16/27 ≈ 59.3%；實際風機的 Cp 大約 0.4–0.5。',
            'Air must leave the rotor with some speed or it would block the air behind. Betz showed that even ideally a rotor can take at most 16/27 ≈ 59.3%; real turbines reach a Cp of roughly 0.4–0.5.') + '</p>' }
      ];
    }
    return {
      intro, tool, qs,
      explain: '<p>' + L('功率和風速的三次方成正比，所以風場選址最在乎平均風速：風速多 10%，能量就多約 33%。這也是為什麼風機越蓋越高（高處風較強）、葉輪越做越大（面積和直徑平方成正比）。',
        'Power goes with the cube of wind speed, so siting is all about the average wind: 10% more wind means about 33% more energy. That is why towers keep getting taller (stronger wind higher up) and rotors bigger (area goes with the diameter squared).') + '</p>',
      verify: [{ href: '#/learn', label: ['風電知識的「功率曲線」教具：加上額定功率與切入、切出風速', 'The power-curve panel in Learn, with rated power and cut-in/cut-out'] },
        { href: '#/global?f=' + encodeURIComponent('Formosa 1 Phase 2'), label: ['地球儀：海洋風電二期的風場卡片（葉輪直徑）', 'Globe: the Formosa 1 Phase 2 card (rotor diameter)'] }],
      sources: SRC
    };
  }
});
})();
/* 第 2 關 · 從 Gedser 到 26 MW：風機放大。里程碑（wind_global.json 的 milestones：year、mw、rotor）依名稱開頭當場查出，不寫死數字；
   掃風面積 A = π·D²/4、每平方公尺額定功率 W/m² = mw·10⁶ ÷ A；「平方—立方」是經驗法則（同形狀、同材料等比放大時，質量約與長度的立方成正比）。
   26 MW 級風機只稱「2025 年的 26 MW 級風機」，不寫地點（本站紀錄互有出入）。
   Hornsea 2 的單機功率本站紀錄互有出入（里程碑 8.4 MW、事件 165 × 8 MW），待查證，所以改用 London Array（175 × 3.6 MW，紀錄一致）。足球場尺寸取 WW.SCALE_REF（FIFA 建議 105 × 68 m）。 */
(function () {
'use strict';
const PRE = ['Gedser wind turbine', 'Vindeby offshore wind farm', 'Horns Rev 1', 'London Array', 'Dongfang 26 MW'];
WW.lab.add({
  n: 2, id: 'scale',
  title: ['從 Gedser 到 26 MW', 'From Gedser to 26 MW'],
  hook: ['葉輪直徑變十幾倍，能掃到的風變多少倍？', 'The rotor got over ten times wider. How much more wind does it catch?'],
  need: ['global'],
  build({ sh, D, U }) {
    const { L, f } = U;
    const all = (D.global && D.global.milestones) || [];
    const M = PRE.map((p, i) => { const m = all.find(x => x.name && x.name.indexOf(p) === 0); return m && m.rotor > 0 && m.mw > 0 ? Object.assign({ big: i === PRE.length - 1 }, m) : null; }).filter(Boolean);
    const G = M.find(m => m.name.indexOf(PRE[0]) === 0), X = M.find(m => m.big);
    if (!G || !X) throw new Error('lab 2: milestones missing');
    const PT = (WW.SCALE_REF && WW.SCALE_REF.pitch) || { w: 105, h: 68, url: 'https://publications.fifa.com/' };
    const area = d => Math.PI * d * d / 4, spec = m => m.mw * 1e6 / area(m.rotor);
    const pwr = mw => mw < 1 ? U.int(mw * 1000) + ' kW' : f(mw, mw % 1 ? 1 : 0) + ' MW';
    const nm = m => m.big ? L(m.year + ' 年的 ' + f(m.mw, 0) + ' MW 級風機', 'the ' + f(m.mw, 0) + ' MW-class turbine of ' + m.year)
      : L(m.name.replace(/ wind turbine$/, ' 風機').replace(/ offshore wind farm$/, ' 離岸風場'), m.name);
    const short = m => m.big ? L(f(m.mw, 0) + ' MW 級', f(m.mw, 0) + ' MW class') : m.name.replace(/ (wind turbine|offshore wind farm)$/, '');
    const typ = m => m.type === 'offshore' ? L('離岸', 'Offshore') : m.type === 'floating' ? L('浮動式', 'Floating') : L('陸域', 'Onshore');
    const FM = M.filter(m => m.farm > 0);
    const dr = X.rotor / G.rotor, ar = dr * dr, pr = X.mw / G.mw, sg = spec(G), sx = spec(X);

    /* ---------- 情境 ---------- */
    const intro = '<p>' + L(G.year + ' 年，丹麥的 Gedser 風機葉輪直徑 ' + U.int(G.rotor) + ' m、額定 ' + pwr(G.mw) + '。本站里程碑的說明：', 'In ' + G.year + ', Denmark\'s Gedser turbine had a ' + U.int(G.rotor) + ' m rotor rated at ' + pwr(G.mw) + '. The site\'s milestone note says: ') +
      L('「', '“') + U.esc(L((G.zh || '').replace(/「/g, '『').replace(/」/g, '』'), G.en || '')) + L('」', '”') + '</p>' +
      '<p>' + L('到了 ' + X.year + ' 年，' + f(X.mw, 0) + ' MW 級的風機葉輪直徑已經是 ' + U.int(X.rotor) + ' m。葉輪越大，每轉一圈掃過的面積越大，能接住的風就越多：',
        'By ' + X.year + ', a ' + f(X.mw, 0) + ' MW-class turbine had a ' + U.int(X.rotor) + ' m rotor. The bigger the rotor, the larger the area it sweeps on every turn, and the more wind it catches:') + '</p>' +
      U.eq(L('掃風面積', 'Swept area') + ' A = π · D² / 4') +
      (sh ? '<p>' + L('比較大小不同的風機時，工程師常看「每平方公尺掃風面積分到多少額定功率」（比功率，單位 W/m²）。另外有一個經驗法則（平方—立方）：形狀與材料都不變、只把東西等比放大時，面積約與長度的平方成正比，體積和質量約與長度的立方成正比。',
        'To compare turbines of different sizes, engineers often look at how much rated power each square metre of swept area gets (specific power, in W/m²). There is also a rule of thumb, the square–cube rule: if something is scaled up with the same shape and material, its area grows roughly with the square of its length, while its volume and mass grow roughly with the cube.') + '</p>' +
        U.eq(L('比功率', 'Specific power') + ' = P<sub>' + L('額定', 'rated') + '</sub> ÷ A = P(MW) × 10⁶ ÷ (π · D² / 4)  [W/m²]') : '');

    /* ---------- 動手：同一比例的葉輪 ---------- */
    let sel = M.length - 1;
    const k = 0.55, gap = 10, slot = m => Math.max(m.rotor * k, 38), x0 = 8, TS = 'font-size:13px';
    const W = Math.ceil(x0 * 2 + M.reduce((s, m) => s + slot(m), 0) + gap * (M.length - 1)), Hc = Math.max(...M.map(m => m.rotor)) * k, base = Hc + 10, H = Math.ceil(base + 74);
    const svg = () => {
      let x = x0, g = '<line class="ax" x1="' + x0 + '" x2="' + (W - x0) + '" y1="' + base + '" y2="' + base + '"/>';
      M.forEach((m, i) => {
        const s = slot(m), cx = x + s / 2, r = m.rotor * k / 2, on = i === sel;
        g += '<circle cx="' + cx.toFixed(1) + '" cy="' + (base - r).toFixed(1) + '" r="' + r.toFixed(1) + '"' + (on ? ' class="on" style="fill:var(--live);fill-opacity:.16"' : ' class="ax" fill="none" stroke-width="1.5"') + '/>' +
          '<circle cx="' + cx.toFixed(1) + '" cy="' + (base - r).toFixed(1) + '" r="1.6" style="fill:var(--ink-3)"/>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (base + 16) + '" text-anchor="middle" style="' + TS + (on ? ';fill:var(--ink);font-weight:800' : '') + '">' + m.year + '</text>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (base + 31) + '" text-anchor="middle" style="' + TS + (on ? ';fill:var(--ink);font-weight:800' : '') + '">' + U.int(m.rotor) + ' m</text>';
        x += s + gap;
      });
      const pw = PT.w * k, py = base + 44;
      g += '<rect class="hi" x="' + x0 + '" y="' + py + '" width="' + pw.toFixed(1) + '" height="6" rx="1"/>' +
        '<text x="' + x0 + '" y="' + (py + 20) + '" style="' + TS + '">' + U.esc(L('同一比例：標準足球場長 ' + PT.w + ' m', 'Same scale: a standard football pitch, ' + PT.w + ' m long')) + '</text>';
      const lab = M.map(m => m.year + ' ' + U.int(m.rotor) + ' m').join(L('、', ', '));
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + U.esc(L('同一比例的葉輪掃風圓，下緣對齊：', 'Rotor discs to the same scale, bottom-aligned: ') + lab +
        L('；下方長條是 ' + PT.w + ' m 的足球場長度。', '; the bar below is a ' + PT.w + ' m football pitch.')) + '">' + g + '</svg>';
    };
    const chips = () => {
      const m = M[sel], a = area(m.rotor), np = a / (PT.w * PT.h);
      return '<p class="note" style="margin:2px 0 4px"><b style="color:var(--ink)">' + U.esc(nm(m)) + '</b>' + (m.big ? '' : ' · ' + m.year) + ' · ' + typ(m) + '</p>' +
        U.chip(L('單機額定', 'Rated power'), pwr(m.mw)) + U.chip(L('葉輪直徑 D', 'Rotor diameter D'), U.int(m.rotor) + ' m') +
        U.chip(L('掃風面積 A', 'Swept area A'), U.int(a) + ' m²') +
        U.chip(L('約幾個足球場面積', 'Football pitches of area'), (np >= 1 ? f(np, 1) : f(np, 2)));
    };
    const rows = M.map(m => '<tr><td>' + m.year + '</td><td style="word-break:keep-all">' + U.esc(m.big ? L(f(m.mw, 0) + ' MW 級風機', f(m.mw, 0) + ' MW-class turbine') : nm(m)) + '<br><small style="color:var(--ink-3)">' + typ(m) + '</small></td><td class="r" style="white-space:nowrap">' + pwr(m.mw) + '</td><td class="r">' + U.int(m.rotor) + '</td><td class="r">' + U.int(area(m.rotor)) + '</td></tr>').join('');
    const tool = {
      html: '<div class="lbgridt"><div><fieldset style="border:0;margin:0;padding:0"><legend class="lbk" style="font-size:13px;color:var(--ink-2);margin-bottom:4px">' + L('選一部里程碑風機', 'Pick a milestone turbine') + '</legend>' +
        '<div style="display:flex;flex-direction:column;gap:2px">' + M.map((m, i) => '<label class="lbopt"><input type="radio" name="lb2-pick" value="' + i + '"' + (i === sel ? ' checked' : '') + '><span>' + m.year + ' · ' + U.esc(short(m)) + '</span></label>').join('') + '</div></fieldset>' +
        '<div id="lb2chips" aria-live="polite"></div></div><div class="lbplot" id="lb2svg"></div></div>' +
        '<div class="lbtw"><table class="lbtbl"><caption class="note" style="text-align:left;caption-side:top">' + L('本站里程碑資料（單機額定功率與葉輪直徑；掃風面積由 π·D²/4 算出）', 'The site\'s milestone data (rated power per turbine and rotor diameter; swept area worked out as π·D²/4)') + '</caption>' +
        '<thead><tr><th>' + L('年', 'Year') + '</th><th style="min-width:6.5em">' + L('里程碑', 'Milestone') + '</th><th class="r">' + L('單機額定', 'Rated power') + '</th><th class="r">' + L('葉輪直徑 (m)', 'Rotor D (m)') + '</th><th class="r">' + L('掃風面積 (m²)', 'Swept area (m²)') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="note">' + L('圓是從正面看葉輪掃過的範圍，同一比例、下緣對齊，不代表塔高。' + FM.map(short).join('、') + ' 是風場，表中是其中一部風機的額定功率與葉輪直徑。足球場尺寸是 FIFA 建議的 ' + PT.w + ' × ' + PT.h + ' m。',
          'Each circle is the area the rotor sweeps, seen from the front, to the same scale and bottom-aligned; tower heights are not shown. ' + FM.map(short).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' are wind farms: the table gives the rating and rotor of one of their turbines. The pitch is FIFA\'s recommended ' + PT.w + ' × ' + PT.h + ' m.') + '</p>',
      mount(root) {
        const draw = () => { root.querySelector('#lb2svg').innerHTML = svg(); root.querySelector('#lb2chips').innerHTML = chips(); };
        root.querySelectorAll('input[name="lb2-pick"]').forEach(r => { r.onchange = () => { sel = +r.value; draw(); }; });
        draw();
      }
    };

    /* ---------- 問題 ---------- */
    const gN = L('Gedser 風機', 'the Gedser turbine'), xN = nm(X);
    let qs;
    if (!sh) {
      const o3 = Math.round(Math.pow(dr, 3)), oPi = Math.round(ar * Math.PI);
      qs = [
        { id: 'a', type: 'num', q: L(xN + '的葉輪直徑是 ' + gN + '的幾倍？（看表，算到小數第一位）', 'How many times wider is the rotor of ' + xN + ' than that of ' + gN + '? (read the table, one decimal)'),
          ans: dr, unit: L('倍', '×'), tol: { abs: 0.06 }, hint: L('用 ' + U.int(X.rotor) + ' ÷ ' + U.int(G.rotor) + '。', 'Work out ' + U.int(X.rotor) + ' ÷ ' + U.int(G.rotor) + '.'),
          sol: U.eq(U.int(X.rotor) + ' ÷ ' + U.int(G.rotor) + ' ≈ ' + f(dr, 2) + ' → ' + f(dr, 1)) },
        { id: 'b', type: 'mc', q: L('那麼掃風面積大約是幾倍？', 'Then about how many times larger is the swept area?'),
          opts: [[L('約 ' + f(dr, 1) + ' 倍', 'About ' + f(dr, 1) + '×'), L('這是直徑的倍數；面積和直徑的平方成正比。', 'That is the diameter ratio; area goes with the square of the diameter.')],
            [L('約 ' + U.int(ar) + ' 倍', 'About ' + U.int(ar) + '×')],
            [L('約 ' + U.int(o3) + ' 倍', 'About ' + U.int(o3) + '×'), L('這是立方；面積只有長和寬兩個方向，是平方。', 'That is the cube; area has only two directions, so it is the square.')],
            [L('約 ' + U.int(oPi) + ' 倍', 'About ' + U.int(oPi) + '×'), L('比較兩個圓的面積時，π 和 ÷4 在分子分母都有，會約掉。', 'When you compare two circles, π and ÷4 appear top and bottom and cancel.')]],
          a: 1, hint: L('A = π·D²/4，所以面積比 = 直徑比²。', 'A = π·D²/4, so the area ratio = (diameter ratio)².'),
          sol: U.eq('(' + U.int(X.rotor) + ' ÷ ' + U.int(G.rotor) + ')² ≈ ' + f(dr, 2) + '² ≈ ' + U.int(ar)) +
            '<p>' + L('也可以用表裡的面積直接除：' + U.int(area(X.rotor)) + ' ÷ ' + U.int(area(G.rotor)) + ' ≈ ' + U.int(ar) + '。', 'Or divide the areas in the table: ' + U.int(area(X.rotor)) + ' ÷ ' + U.int(area(G.rotor)) + ' ≈ ' + U.int(ar) + '.') + '</p>' },
        { id: 'c', type: 'num', q: L('單機額定功率呢？' + xN + '是 ' + gN + '的幾倍？（算到整數）', 'And the rated power? How many times that of ' + gN + ' is ' + xN + '? (whole number)'),
          ans: pr, unit: L('倍', '×'), tol: { abs: 0.6 }, hint: L('單位要先統一：' + pwr(G.mw) + ' = ' + f(G.mw, 1) + ' MW，再用 ' + f(X.mw, 0) + ' ÷ ' + f(G.mw, 1) + '。', 'Use the same unit first: ' + pwr(G.mw) + ' = ' + f(G.mw, 1) + ' MW, then ' + f(X.mw, 0) + ' ÷ ' + f(G.mw, 1) + '.'),
          sol: U.eq(f(X.mw, 0) + ' MW ÷ ' + f(G.mw, 1) + ' MW = ' + f(pr, 0)) +
            '<p>' + L('比一比：面積變成約 ' + U.int(ar) + ' 倍，額定功率變成 ' + f(pr, 0) + ' 倍，功率' + (pr < ar ? '沒有' : '') + '跟上面積的成長。高中組會算出原因。',
              'Compare: the area grew about ' + U.int(ar) + '×, the rated power ' + f(pr, 0) + '× — power ' + (pr < ar ? 'did not keep up with' : 'outpaced') + ' area. The senior level works out why.') + '</p>' }
      ];
    } else {
      const m3 = Math.pow(dr, 3);
      qs = [
        { id: 'a', type: 'num', q: L(gN + '（D = ' + U.int(G.rotor) + ' m，額定 ' + pwr(G.mw) + '）的比功率是多少 W/m²？（算到整數）', 'What is the specific power of ' + gN + ' (D = ' + U.int(G.rotor) + ' m, rated ' + pwr(G.mw) + '), in W/m²? (whole number)'),
          ans: sg, unit: 'W/m²', tol: { abs: 2.5 }, hint: L('先算 A = π × ' + U.int(G.rotor) + '² ÷ 4，再用 ' + U.int(G.mw * 1e6) + ' W ÷ A。注意 D 是直徑，不是半徑。', 'First A = π × ' + U.int(G.rotor) + '² ÷ 4, then ' + U.int(G.mw * 1e6) + ' W ÷ A. D is the diameter, not the radius.'),
          sol: U.eq('A = π × ' + U.int(G.rotor) + '² / 4 ≈ ' + f(area(G.rotor), 1) + ' m²') + U.eq(U.int(G.mw * 1e6) + ' W ÷ ' + f(area(G.rotor), 1) + ' m² ≈ ' + f(sg, 1) + ' W/m²') },
        { id: 'b', type: 'num', q: L(xN + '（D = ' + U.int(X.rotor) + ' m，額定 ' + pwr(X.mw) + '）的比功率是多少 W/m²？（算到整數）', 'And the specific power of ' + xN + ' (D = ' + U.int(X.rotor) + ' m, rated ' + pwr(X.mw) + '), in W/m²? (whole number)'),
          ans: sx, unit: 'W/m²', tol: { abs: 2.5 }, hint: L('A = π × ' + U.int(X.rotor) + '² ÷ 4；' + f(X.mw, 0) + ' MW = ' + U.int(X.mw * 1e6) + ' W。', 'A = π × ' + U.int(X.rotor) + '² ÷ 4; ' + f(X.mw, 0) + ' MW = ' + U.int(X.mw * 1e6) + ' W.'),
          sol: U.eq('A = π × ' + U.int(X.rotor) + '² / 4 ≈ ' + U.int(area(X.rotor)) + ' m²') + U.eq(U.int(X.mw * 1e6) + ' W ÷ ' + U.int(area(X.rotor)) + ' m² ≈ ' + f(sx, 1) + ' W/m²') +
            '<p>' + L('比功率從約 ' + U.int(sg) + ' ' + (sx < sg ? '降到' : '升到') + '約 ' + U.int(sx) + ' W/m²：面積變成約 ' + U.int(ar) + ' 倍，額定功率只變成 ' + f(pr, 0) + ' 倍。',
              'Specific power went from about ' + U.int(sg) + ' ' + (sx < sg ? 'down' : 'up') + ' to about ' + U.int(sx) + ' W/m²: the area grew about ' + U.int(ar) + '× but the rated power ' + f(pr, 0) + '×.') + '</p>' },
        { id: 'c', type: 'mc', q: L('風機從風中取得的功率 P = ½ρAv³·Cp。比功率變' + (sx < sg ? '小' : '大') + '，代表什麼？', 'The power taken from the wind is P = ½ρAv³·Cp. What does a ' + (sx < sg ? 'lower' : 'higher') + ' specific power mean?'),
          opts: [[L('Betz 極限對大葉輪比較低，所以只能配比較小的發電機', 'The Betz limit is lower for big rotors, so they need a smaller generator'), L('Betz 極限 16/27 和葉輪大小無關（第 1 關）。', 'The Betz limit of 16/27 does not depend on rotor size (Level 1).')],
            [sx < sg ? L('達到額定功率時 P/A = ½ρCp·v³，P/A 較小，需要的風速 v 就較低：中等風速下就能滿載，較常接近滿載發電', 'At rated power P/A = ½ρCp·v³; a smaller P/A needs a lower wind speed v, so the turbine reaches full output in moderate winds and runs near full power more often')
              : L('達到額定功率時 P/A = ½ρCp·v³，P/A 較大，需要的風速 v 就較高：要到強風才會滿載', 'At rated power P/A = ½ρCp·v³; a larger P/A needs a higher wind speed v, so the turbine reaches full output only in strong winds')],
            [L('大風機的輪轂比較高，那裡空氣比較濃，所以不需要那麼大的發電機', 'Big turbines have higher hubs where the air is denser, so they need less generator'), L('高處的空氣其實略稀薄，而且幾百公尺內密度只差幾個百分比，解釋不了這麼大的差距。', 'Air higher up is in fact slightly thinner, and over a few hundred metres the density changes by only a few per cent — far too little to explain the gap.')],
            [L('大葉輪轉得比較快，所以每平方公尺需要的功率比較少', 'Big rotors spin faster, so each square metre needs less power'), L('大葉輪其實轉得比較慢（每分鐘轉數較低）；轉速只透過 Cp 影響功率，而 Cp 不論轉速都不能超過 Betz 極限 16/27。', 'Big rotors actually turn more slowly (fewer rpm); rotation speed affects power only through Cp, which cannot exceed the Betz limit of 16/27 whatever the speed.')]],
          a: 1, hint: L('把式子兩邊除以 A，看 v 怎麼跟著 P/A 變。', 'Divide both sides by A and see how v depends on P/A.'),
          sol: U.eq('P/A = ½ · ρ · Cp · v³  →  v = (2 · (P/A) ÷ (ρ · Cp))^(1/3)') +
            '<p>' + L('在 ρ 和 Cp 差不多時，P/A 越小，達到額定功率所需的風速越低。所以同樣大小的發電機配上更大的葉輪，在不那麼強的風裡也能接近滿載。這是簡化的推論：實際的設計還要考慮成本、載重與風場的風況。',
              'With ρ and Cp about the same, the smaller P/A is, the lower the wind speed needed to reach rated power. A larger rotor on a given generator gets close to full output in less strong winds. This is a simplified argument: real designs also weigh cost, loads and the site\'s winds.') + '</p>' },
        { id: 'd', type: 'num', q: L('平方—立方經驗法則：如果把 Gedser 的葉片形狀、材料都不變，等比放大成 ' + xN + '的葉輪大小，葉片質量大約會變成幾倍？（用直徑比的立方，算到整數）',
            'The square–cube rule of thumb: if Gedser\'s blades were scaled up with the same shape and material to the rotor size of ' + xN + ', about how many times heavier would a blade be? (use the cube of the diameter ratio, whole number)'),
          ans: m3, unit: L('倍', '×'), tol: { rel: 0.025 }, hint: L('葉片長度和直徑成正比，直徑比 = ' + U.int(X.rotor) + ' ÷ ' + U.int(G.rotor) + '；質量 ∝ 長度³。', 'Blade length is proportional to the diameter: ratio = ' + U.int(X.rotor) + ' ÷ ' + U.int(G.rotor) + '; mass ∝ length³.'),
          sol: U.eq('(' + U.int(X.rotor) + ' ÷ ' + U.int(G.rotor) + ')³ ≈ ' + f(dr, 3) + '³ ≈ ' + U.int(m3)) +
            '<p>' + L('面積只變約 ' + U.int(ar) + ' 倍，質量卻變約 ' + U.int(m3) + ' 倍，所以每平方公尺掃風面積分到的葉片質量變成約 ' + f(m3 / ar, 1) + ' 倍（就是直徑比）。這只是等比放大的經驗法則，不是真實葉片的重量（本站沒有葉片質量的資料）；它說明了為什麼不能只把舊葉片放大，而要改變形狀與材料。',
              'The area grows about ' + U.int(ar) + '× but the mass about ' + U.int(m3) + '×, so the blade mass per square metre of swept area grows about ' + f(m3 / ar, 1) + '× (the diameter ratio). This is only the rule of thumb for scaling up unchanged; it is not the weight of real blades (the site has no blade-mass data). It shows why old blades cannot simply be enlarged: shapes and materials have to change.') + '</p>' }
      ];
    }
    return {
      intro, tool, qs,
      explain: '<p>' + L('從 ' + G.year + ' 到 ' + X.year + ' 年，葉輪直徑變成約 ' + f(dr, 1) + ' 倍，掃風面積就變成約 ' + U.int(ar) + ' 倍：面積跟著直徑的平方長，這是風機越做越大的一個重要理由——一部大風機能接住的風，抵得上很多部小風機。',
        'From ' + G.year + ' to ' + X.year + ' the rotor diameter grew about ' + f(dr, 1) + '×, so the swept area grew about ' + U.int(ar) + '×: area grows with the square of the diameter, which is one important reason turbines keep getting bigger — one large turbine catches as much wind as many small ones.') + '</p>' +
        (sh ? '<p>' + L('額定功率沒有跟著面積同步放大（比功率約 ' + U.int(sg) + ' → ' + U.int(sx) + ' W/m²），換來在中等風速下更容易滿載（簡化推論）。放大也有代價：依平方—立方經驗法則，等比放大時質量長得比面積快，葉片的材料與設計就成了關鍵。',
          'Rated power did not grow as fast as the area (specific power about ' + U.int(sg) + ' → ' + U.int(sx) + ' W/m²), so, in the simplified picture, the turbine reaches full output more easily in moderate winds. Scaling up has a cost too: by the square–cube rule of thumb, mass grows faster than area when you simply enlarge, so blade materials and design become the key.') + '</p>' : ''),
      verify: [{ href: '#/learn', label: ['風電知識：「葉輪直徑的演進」圖（所有里程碑機組）', 'Learn: the "rotor diameter of milestone turbines" chart (all milestones)'] },
        { href: WW.hashFor('global', null, { ms: G.name }), label: ['地球儀：Gedser 風機的里程碑', 'Globe: the Gedser turbine milestone'] }]
        .concat(M.filter(m => !m.big && m !== G).map(m => ({ href: WW.hashFor('global', null, { ms: m.name }), label: ['地球儀：' + m.name.replace(/ wind turbine$/, ' 風機').replace(/ offshore wind farm$/, ' 離岸風場') + ' 的里程碑', 'Globe: the ' + m.name + ' milestone'] }))),
      sources: [{ label: L('本站全球資料集的里程碑（wind_global.json；製造商與維基百科公開規格）', 'Milestones in the site\'s global dataset (wind_global.json; manufacturer and Wikipedia specifications)'), url: 'data/global/wind_global.json' },
        { label: L('FIFA 球場指引（' + PT.w + ' × ' + PT.h + ' m）', 'FIFA stadium guidelines (' + PT.w + ' × ' + PT.h + ' m)'), url: PT.url },
        { label: 'Gedser wind turbine (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Gedser_wind_turbine' }]
        .concat(sh ? [{ label: L('平方—立方定律（Wikipedia）', 'Square–cube law (Wikipedia)'), url: 'https://en.wikipedia.org/wiki/Square%E2%80%93cube_law' }] : [])
    };
  }
});
})();
/* 第 3 關 · 容量因數：容量因數 = 年發電量 ÷（裝置容量 × 當年時數），閏年 8,784 小時。只用 generation.json 的台電自有風場官方實測值（台電開放資料 17140／17141）；
   民營風場沒有官方逐場數字，不用估計值或即時取樣充當實測。題目用的風場在畫面打開時挑：最新年份容量最大的陸域與離岸各一座。 */
(function () {
'use strict';
WW.lab.add({
  n: 3, id: 'cf',
  title: ['容量因數', 'Capacity factor'],
  hook: ['一座 100 MW 的風場，一年能發 100 MW × 8,760 小時的電嗎？', 'Can a 100 MW wind farm make 100 MW × 8,760 hours of electricity in a year?'],
  need: ['generation'],
  build({ sh, D, U }) {
    const { L, f, esc } = U;
    const G = D.generation, M = G.meta || {};
    /* 台電自有風場：每座取最新一個整年的實測值 · Taipower-owned farms, each with its latest full year */
    const TW = Object.entries(G.farms).filter(([k]) => k.indexOf('TWN|') === 0).map(([k, v]) => {
      const ys = Object.keys(v.y).map(Number).sort((a, b) => a - b);
      return { k, name: k.slice(4), st: v.st || '', mw: v.mw, ys, y: v.y, off: /offshore/i.test(k) || /離岸/.test(v.st || '') };
    }).filter(x => x.mw > 0 && x.ys.length);
    const Y = Math.max(...TW.map(x => x.ys[x.ys.length - 1]));
    const inY = TW.filter(x => x.y[Y]).sort((a, b) => b.mw - a.mw);
    const OFF = inY.find(x => x.off) || null;
    const ON = inY.find(x => !x.off) || inY[0];
    const nm = x => L('台電' + (x.st || x.name) + '發電站', x.name);
    const hrs = U.hours, gwh = (x, y) => x.y[y][0], cfF = (x, y) => x.y[y][1];
    const cfC = (x, y) => gwh(x, y) * 1000 / (x.mw * hrs(y)) * 100;              // 由發電量與容量算出的容量因數（%）
    const flh = (x, y) => gwh(x, y) * 1000 / x.mw;                               // 等效滿載小時
    const leap = y => hrs(y) === 8784;
    const pct = v => f(v, 1) + '%';

    const intro = '<p>' + L('風場的「裝置容量」（MW）是所有風機同時全力運轉時的出力。但風有時強、有時弱，風機大部分時間都沒有全力運轉。一整年實際發的電，和「整年都全力運轉」能發的電相比，這個比例就叫<b>容量因數</b>：',
      'A wind farm\'s installed capacity (MW) is its output with every turbine running flat out. But the wind rises and falls, and most of the time the turbines are below full output. The share of what the farm actually generated in a year, compared with running flat out all year, is its <b>capacity factor</b>:') + '</p>' +
      U.eq(L('容量因數 = 年發電量 ÷（裝置容量 × 當年時數）', 'capacity factor = yearly generation ÷ (capacity × hours in the year)')) +
      '<p>' + L('一年有 365 × 24 = 8,760 小時，閏年 366 天是 8,784 小時。單位要對齊：MW × 小時 = MWh，1 GWh = 1,000 MWh = 100 萬度。',
        'A year has 365 × 24 = 8,760 hours; a leap year (366 days) has 8,784. Keep the units straight: MW × hours = MWh, and 1 GWh = 1,000 MWh = 1 million kWh.') + '</p>' +
      '<p>' + L('這一關的數字是台電自有風力發電站中、有官方逐站資料的 ' + TW.length + ' 座的實測淨發電量（台電開放資料）。民營風場沒有官方公布的逐場發電量，所以不在這裡；網站上它們只有即時取樣的估計，不能當成實測。',
        'The figures here are the measured net generation of the ' + TW.length + ' Taipower-owned wind stations with official per-station figures (Taipower open data). Private farms have no official per-farm figures, so they are not here; the site has only sampled estimates for them, which are not measured output.') + '</p>';

    /* 動手：選一座風場、拉滑桿「整年都以 X% 運轉」 · pick a farm, drag "if it ran at X% all year" */
    const pick0 = OFF || ON;
    const latest = x => x.ys[x.ys.length - 1];
    const S = { k: pick0.k, pct: Math.round(cfF(pick0, latest(pick0))) };
    const fm = { pct: v => v + '%' };
    const list = TW.slice().sort((a, b) => b.mw - a.mw);
    const tbl = '<details><summary>' + L('台電自有風場一覽（' + Y + ' 年，依容量排序）', 'All Taipower-owned farms (' + Y + ', by capacity)') + '</summary><div class="lbtw"><table class="lbtbl"><thead><tr><th>' + L('風場', 'Farm') + '</th><th class="r">MW</th><th class="r">GWh</th><th class="r">' + L('容量因數', 'Capacity factor') + '</th><th class="r">' + L('等效滿載小時', 'Full-load hours') + '</th></tr></thead><tbody>' +
      inY.map(x => '<tr><td>' + esc(nm(x)) + (x.off ? L('（離岸）', ' (offshore)') : '') + '</td><td class="r">' + f(x.mw, 1) + '</td><td class="r">' + f(gwh(x, Y), 1) + '</td><td class="r">' + pct(cfF(x, Y)) + '</td><td class="r">' + U.int(flh(x, Y)) + '</td></tr>').join('') +
      '</tbody></table></div><p class="note">' + L('GWh 四捨五入到 0.1；小風場用表上的數字重算，會和容量因數欄差一點（資料檔用未四捨五入的發電量）。', 'GWh is rounded to 0.1, so recomputing small farms from the table differs slightly from the capacity-factor column (the file uses unrounded generation).') + '</p></details>';
    const tool = {
      html: '<div class="lbgridt"><div><label class="lbs"><span class="lbk">' + L('風場（最新一個整年）', 'Farm (latest full year)') + '</span><select id="lb3-farm" class="fsel">' +
        list.map(x => '<option value="' + esc(x.k) + '"' + (x.k === S.k ? ' selected' : '') + '>' + esc(nm(x)) + L('（', ' (') + f(x.mw, 1) + ' MW' + L('）', ')') + '</option>').join('') + '</select></label>' +
        U.slider('pct', L('假如整年都以這個比例運轉', 'If it ran at this share all year'), 0, 100, 1, S.pct, fm.pct) + '</div><div><div class="lbplot" id="lb3plot"></div><div id="lb3out"></div></div></div>' + tbl +
        '<p class="note">' + L('「整年以 X% 運轉」是想像的平均值：實際上風場的出力每分鐘都在變，有時全力、有時停著。', '"Running at X% all year" is an imagined average: a real farm\'s output changes minute by minute, sometimes at full power, sometimes still.') + '</p>',
      mount(root) {
        const plot = root.querySelector('#lb3plot'), out = root.querySelector('#lb3out'), sel = root.querySelector('#lb3-farm');
        const draw = () => {
          const x = TW.find(q => q.k === S.k), y = latest(x), h = hrs(y), full = x.mw * h / 1000, cfv = cfF(x, y), what = full * S.pct / 100;
          const W = Math.max(300, Math.min(560, Math.round(plot.clientWidth || 400))), H = 130, bx = 110, bw = W - bx - 56, TS = 'font-size:13px'; // 依實際寬度設 viewBox，字約 13 px · viewBox matches the real width so text stays ~13 px
          const row = (yy, k, v, p, col) => '<text x="' + (bx - 8) + '" y="' + (yy + 16) + '" text-anchor="end" style="' + TS + '">' + k + '</text>' +
            '<rect x="' + bx + '" y="' + yy + '" width="' + bw + '" height="22" rx="4" style="fill:var(--surface-2);stroke:var(--line-2)"/>' +
            '<rect x="' + bx + '" y="' + yy + '" width="' + (bw * Math.min(1, p / 100)).toFixed(1) + '" height="22" rx="4" style="fill:' + col + '"/>' +
            '<text x="' + (bx + bw + 6) + '" y="' + (yy + 16) + '" style="fill:var(--ink);font-weight:700;' + TS + '">' + v + '</text>';
          plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(L(nm(x) + '：' + y + ' 年實測容量因數 ' + pct(cfv) + '；滑桿 ' + S.pct + '%', nm(x) + ': measured capacity factor ' + pct(cfv) + ' in ' + y + '; slider ' + S.pct + '%')) + '">' +
            row(14, L('實測 ' + y, 'Measured ' + y), pct(cfv), cfv, 'var(--live)') + row(52, L('滑桿', 'Slider'), S.pct + '%', S.pct, 'var(--hist)') +
            '<text x="' + bx + '" y="' + (H - 26) + '" style="' + TS + '">0%</text><text x="' + (bx + bw) + '" y="' + (H - 26) + '" text-anchor="end" style="' + TS + '">100%</text>' +
            '<text x="' + (bx + bw) + '" y="' + (H - 6) + '" text-anchor="end" style="' + TS + '">' + L('100%＝整年滿載', '100% = flat out all year') + '</text></svg>';
          out.innerHTML = U.chip(L('裝置容量', 'Capacity'), f(x.mw, 1) + ' MW') + U.chip(L(y + ' 年時數', 'Hours in ' + y), U.int(h) + ' h' + (leap(y) ? L('（閏年）', ' (leap)') : '')) +
            U.chip(L('整年滿載能發', 'Flat out all year'), f(full, 1) + ' GWh') + U.chip(L(y + ' 年實際發電', 'Generated in ' + y), f(gwh(x, y), 1) + ' GWh') +
            U.chip(L('容量因數', 'Capacity factor'), pct(cfv)) + U.chip(L('整年以 ' + S.pct + '% 運轉會發', 'At ' + S.pct + '% all year'), f(what, 1) + ' GWh') +
            '<p class="note">' + L('試試看：把滑桿拉到「整年以 X% 運轉會發」最接近實際發電量，滑桿停在哪裡？', 'Try it: move the slider until "at X% all year" comes closest to the actual generation. Where does it stop?') + '</p>';
        };
        sel.onchange = () => {
          S.k = sel.value; const x = TW.find(q => q.k === S.k); S.pct = Math.round(cfF(x, latest(x)));
          const r = root.querySelector('#lb-pct'), o = root.querySelector('#lb-pct-o'); if (r) r.value = S.pct; if (o) o.textContent = fm.pct(S.pct); draw();
        };
        U.bind(root, S, fm, draw); draw();
      }
    };

    let qs;
    if (!sh) {
      const x = ON, full = x.mw * hrs(Y) / 1000, c = gwh(x, Y) / full * 100;
      qs = [
        { id: 'a', type: 'num', q: L(nm(x) + '的裝置容量是 ' + f(x.mw, 1) + ' MW。假如 ' + Y + ' 年（' + U.int(hrs(Y)) + ' 小時）所有風機整年都全力運轉，可以發多少 GWh 的電？（四捨五入到整數）',
            nm(x) + ' has a capacity of ' + f(x.mw, 1) + ' MW. If every turbine had run flat out for all of ' + Y + ' (' + U.int(hrs(Y)) + ' hours), how many GWh would it have generated? (round to a whole number)'),
          ans: full, unit: 'GWh', tol: { abs: 0.6 }, hint: L('MW × 小時 = MWh，再除以 1,000 變成 GWh。', 'MW × hours = MWh; divide by 1,000 for GWh.'),
          sol: U.eq(f(x.mw, 1) + ' MW × ' + U.int(hrs(Y)) + ' h = ' + U.int(x.mw * hrs(Y)) + ' MWh = ' + f(full, 1) + ' GWh') },
        { id: 'b', type: 'num', q: L(nm(x) + '在 ' + Y + ' 年實際發了 ' + f(gwh(x, Y), 1) + ' GWh。它的容量因數是幾 %？（算到小數第一位）',
            nm(x) + ' actually generated ' + f(gwh(x, Y), 1) + ' GWh in ' + Y + '. What was its capacity factor, in %? (one decimal)'),
          ans: c, unit: '%', tol: { abs: 0.15 }, hint: L('實際發電量 ÷ 上一題「整年滿載」的發電量，再乘以 100。', 'Actual generation ÷ the "flat out all year" figure from the last question, times 100.'),
          sol: U.eq(f(gwh(x, Y), 1) + ' ÷ ' + f(full, 1) + ' × 100 ≈ ' + f(c, 2) + '%') + '<p>' + L('資料檔裡寫的是 ' + pct(cfF(x, Y)) + '，一樣。也就是說，這一年平均起來，風場大約只發了「全力運轉」的 ' + Math.round(c) + '%。',
            'The data file says ' + pct(cfF(x, Y)) + ', the same. So averaged over the year, the farm produced only about ' + Math.round(c) + '% of what running flat out would give.') + '</p>' },
        { id: 'c', type: 'mc', q: L('容量因數為什麼遠低於 100%？最主要的原因是：', 'Why is the capacity factor far below 100%? The main reason is:'),
          opts: [[L('風機晚上會關掉', 'The turbines are switched off at night'), L('那是太陽能板的情形；有風的話，風機白天晚上都會轉。', 'That is solar panels; wind turbines turn day and night whenever there is wind.')],
            [L('風速一直在變，大部分時間風不夠強，風機達不到全力；風太小時甚至停著', 'The wind keeps changing: most of the time it is not strong enough for full output, and when it is too weak the turbines stand still')],
            [L('風機一年裡有七成以上的時間是壞的', 'The turbines are broken for over 70% of the year'), L('維修確實會讓風機停一陣子，但容量因數低不代表壞掉：大部分時間它們在轉，只是沒有全力。', 'Maintenance does stop turbines for a while, but a low capacity factor does not mean broken: most of the time they are turning, just below full output.')],
            [L('風場還沒有蓋完', 'The farm has not been finished yet'), L('這份資料只列所有風機都已經運轉的整年。', 'This data lists only full years with every turbine already in service.')]],
          a: 1, hint: L('回想第 1 關：功率和風速的三次方成正比，風小一點，出力就少很多。', 'Remember Level 1: power goes with the cube of wind speed, so a little less wind means much less output.'),
          sol: '<p>' + L('風機要在額定風速（通常要超過 10 m/s）以上才會全力運轉，但大部分時間的風比這個小；風太小時乾脆停著。再加上維修，也可能有限電，一整年平均起來，台電這些風場的容量因數大約在 ' +
              Math.round(Math.min(...inY.map(q => cfF(q, Y)))) + '%–' + Math.round(Math.max(...inY.map(q => cfF(q, Y)))) + '% 之間（' + Y + ' 年）。',
            'A turbine reaches full output only above its rated wind speed (typically above 10 m/s), but most of the time the wind is weaker, and when it is too weak the turbine stops. Add maintenance and possibly curtailment, and over a whole year Taipower\'s farms had capacity factors of about ' +
              Math.round(Math.min(...inY.map(q => cfF(q, Y)))) + '%–' + Math.round(Math.max(...inY.map(q => cfF(q, Y)))) + '% (' + Y + ').') + '</p>' }
      ];
    } else {
      const A = OFF || inY[0], B = OFF ? ON : inY[1] || inY[0];
      /* 閏年題：優先用離岸那座，找不到閏年就用任一座有閏年資料的 · leap-year question: prefer the offshore farm */
      const lyOf = x => x.ys.filter(leap).pop();
      const LF = lyOf(A) ? A : (inY.find(lyOf) || TW.find(lyOf) || A), LY = lyOf(LF) || latest(LF);
      const fa = flh(A, Y), fb = flh(B, Y), cL = cfC(LF, LY), cWrong = gwh(LF, LY) * 1000 / (LF.mw * 8760) * 100;
      qs = [
        { id: 'a', type: 'num', q: L('「等效滿載小時」＝ 年發電量 ÷ 裝置容量：假如風場只在全力運轉時發電，一年要轉幾小時才發得出這些電。' + nm(A) + '（' + f(A.mw, 1) + ' MW）在 ' + Y + ' 年發了 ' + f(gwh(A, Y), 1) + ' GWh，等效滿載小時是多少？（四捨五入到整數）',
            '"Equivalent full-load hours" = yearly generation ÷ capacity: how many hours the farm would need at full output to make that much electricity. ' + nm(A) + ' (' + f(A.mw, 1) + ' MW) generated ' + f(gwh(A, Y), 1) + ' GWh in ' + Y + '. What were its full-load hours? (whole number)'),
          ans: fa, unit: L('小時', 'h'), tol: { rel: 0.003 }, hint: L('先把 GWh 換成 MWh（× 1,000），再除以 MW。', 'Convert GWh to MWh (× 1,000), then divide by MW.'),
          sol: U.eq(f(gwh(A, Y), 1) + ' × 1,000 MWh ÷ ' + f(A.mw, 1) + ' MW ≈ ' + U.int(fa) + ' h') + '<p>' + L('除以當年的 ' + U.int(hrs(Y)) + ' 小時就是容量因數：' + U.int(fa) + ' ÷ ' + U.int(hrs(Y)) + ' ≈ ' + f(fa / hrs(Y) * 100, 1) + '%（資料檔：' + pct(cfF(A, Y)) + '）。',
            'Divide by the ' + U.int(hrs(Y)) + ' hours of the year to get the capacity factor: ' + U.int(fa) + ' ÷ ' + U.int(hrs(Y)) + ' ≈ ' + f(fa / hrs(Y) * 100, 1) + '% (data file: ' + pct(cfF(A, Y)) + ').') + '</p>' },
        { id: 'b', type: 'num', q: L(nm(LF) + '在 ' + LY + ' 年發了 ' + f(gwh(LF, LY), 1) + ' GWh，容量 ' + f(LF.mw, 1) + ' MW。它這一年的容量因數是幾 %？（注意 ' + LY + ' 年有幾小時；算到小數第二位）',
            nm(LF) + ' generated ' + f(gwh(LF, LY), 1) + ' GWh in ' + LY + ' with ' + f(LF.mw, 1) + ' MW. What was its capacity factor that year, in %? (mind how many hours ' + LY + ' had; two decimals)'),
          ans: cL, unit: '%', tol: { abs: 0.03 }, hint: L(LY + ' 能被 4 整除嗎？閏年多一天，就多 24 小時。', 'Is ' + LY + ' divisible by 4? A leap year has one more day: 24 more hours.'),
          sol: U.eq(f(gwh(LF, LY), 1) + ' × 1,000 ÷ (' + f(LF.mw, 1) + ' × ' + U.int(hrs(LY)) + ') × 100 ≈ ' + f(cL, 2) + '%') +
            '<p>' + (leap(LY) ? L(LY + ' 是閏年，有 8,784 小時。如果誤用 8,760 小時，會算成 ' + f(cWrong, 2) + '%，高估了 ' + f(cWrong - cL, 2) + ' 個百分點：差別不大，但比較不同年份時，分母要用對。',
              LY + ' is a leap year with 8,784 hours. Using 8,760 by mistake gives ' + f(cWrong, 2) + '%, ' + f(cWrong - cL, 2) + ' percentage points too high: a small error, but comparing years needs the right denominator.')
              : L(LY + ' 不是閏年，有 8,760 小時。', LY + ' is not a leap year: 8,760 hours.')) + '</p>' },
        { id: 'c', type: 'num', q: L(Y + ' 年：' + nm(A) + '（' + f(A.mw, 1) + ' MW）發了 ' + f(gwh(A, Y), 1) + ' GWh；' + nm(B) + '（' + f(B.mw, 1) + ' MW）發了 ' + f(gwh(B, Y), 1) + ' GWh。每 1 MW 的容量，前者發的電是後者的幾倍？（算到小數第二位）',
            'In ' + Y + ', ' + nm(A) + ' (' + f(A.mw, 1) + ' MW) generated ' + f(gwh(A, Y), 1) + ' GWh and ' + nm(B) + ' (' + f(B.mw, 1) + ' MW) generated ' + f(gwh(B, Y), 1) + ' GWh. Per MW of capacity, how many times as much did the first generate as the second? (two decimals)'),
          ans: fa / fb, unit: L('倍', '×'), tol: { abs: 0.015 }, hint: L('不能直接比發電量，要先除以各自的容量（或直接比容量因數）。', 'Do not compare the totals directly: divide each by its own capacity first (or compare the capacity factors).'),
          sol: U.eq(L('前者 ', 'first ') + f(gwh(A, Y), 1) + ' ÷ ' + f(A.mw, 1) + ' ≈ ' + f(fa / 1000, 3) + ' GWh/MW') + U.eq(L('後者 ', 'second ') + f(gwh(B, Y), 1) + ' ÷ ' + f(B.mw, 1) + ' ≈ ' + f(fb / 1000, 3) + ' GWh/MW') +
            U.eq(f(fa / 1000, 3) + ' ÷ ' + f(fb / 1000, 3) + ' ≈ ' + f(fa / fb, 2)) + '<p>' + L('直接拿發電量相除會得到 ' + f(gwh(A, Y) / gwh(B, Y), 2) + '，那混進了「風場大小」；除以容量後才是「同樣的設備，哪裡發得多」。',
              'Dividing the totals gives ' + f(gwh(A, Y) / gwh(B, Y), 2) + ', which mixes in the farm size; dividing by capacity tells you where the same equipment generates more.') + '</p>' },
        { id: 'd', type: 'mc', q: L(Y + ' 年' + nm(A) + '的容量因數是 ' + pct(cfF(A, Y)) + '，' + nm(B) + '是 ' + pct(cfF(B, Y)) + '。下面哪一個推論最合理？',
            'In ' + Y + ' the capacity factor of ' + nm(A) + ' was ' + pct(cfF(A, Y)) + ' and that of ' + nm(B) + ' ' + pct(cfF(B, Y)) + '. Which conclusion is most reasonable?'),
          opts: OFF ? [
            [L('離岸的風場比較大，所以容量因數比較高', 'The offshore farm is bigger, so its capacity factor is higher'), L('容量因數已經除以容量了，風場大小會約掉。', 'The capacity factor is already divided by capacity, so the size cancels out.')],
            [L('海上沒有地形與建物阻擋，風通常比陸上強、也比較穩定，所以同樣的容量發得比較多；但風機型號、維修與限電也會影響，單憑這兩個數字分不出各占多少', 'At sea nothing blocks the wind, so it is usually stronger and steadier than on land and the same capacity generates more; turbine model, maintenance and curtailment matter too, and these two numbers alone cannot tell how much each contributes')],
            [L('陸上的風場一定有三分之一的時間故障', 'The onshore farm must have been broken a third of the time'), L('一個年平均值分不出原因：風小、停機維修、限電都會讓它變低，資料裡沒有寫是哪一個。', 'A yearly average cannot tell causes apart: weak wind, maintenance stops and curtailment all lower it, and the data does not say which.')],
            [L('所以所有離岸風場的容量因數都是 ' + pct(cfF(A, Y)), 'So every offshore farm has a capacity factor of ' + pct(cfF(A, Y))), L('這只是一座風場、一年的數字；不同年份、不同地點都會不一樣，民營離岸風場也沒有官方逐場數字可以比。', 'This is one farm in one year; other years and places differ, and private offshore farms have no official per-farm figures to compare.')]]
            : [
            [L('比較大的風場容量因數一定比較高', 'A bigger farm always has a higher capacity factor'), L('容量因數已經除以容量了，風場大小會約掉。', 'The capacity factor is already divided by capacity, so the size cancels out.')],
            [L('兩座風場的風況、風機型號、維修停機與限電都可能不同；單憑這兩個數字分不出各占多少', 'Wind, turbine model, maintenance stops and curtailment may all differ between the two; these two numbers alone cannot tell how much each contributes')],
            [L('容量因數低的那座一定有三分之一的時間故障', 'The one with the lower factor must have been broken a third of the time'), L('一個年平均值分不出原因：風小、停機維修、限電都會讓它變低。', 'A yearly average cannot tell causes apart: weak wind, maintenance stops and curtailment all lower it.')],
            [L('所以所有風場的容量因數都在這兩個數字之間', 'So every wind farm\'s capacity factor lies between these two'), L('這只是兩座風場、一年的數字。', 'These are two farms in one year.')]],
          a: 1, hint: L('容量因數是一整年的平均：想想有哪些事情會讓它變高或變低，以及這兩個數字能不能分辨它們。', 'The capacity factor is a yearly average: think about what can raise or lower it, and whether two numbers can tell those apart.'),
          sol: '<p>' + L('容量因數受風況（地點、高度、那一年風大不大）、風機設計、可用率（故障與維修）和限電影響。一個年平均值只告訴我們「結果」，要分辨原因需要更細的資料，例如每小時的出力和風速。',
            'The capacity factor depends on the wind (site, height, how windy that year was), turbine design, availability (faults and maintenance) and curtailment. One yearly average shows only the result; telling the causes apart needs finer data, such as hourly output and wind speed.') + '</p>' }
      ];
    }

    /* 解說：同一座風場兩年差最多的例子（由資料算） · take-away: the largest year-to-year swing in the data */
    let swing = null;
    TW.forEach(x => { for (let i = 1; i < x.ys.length; i++) { const a = x.ys[i - 1], b = x.ys[i], d = Math.abs(cfF(x, b) - cfF(x, a)); if (!swing || d > swing.d) swing = { x, a, b, d }; } });
    /* 陸域風場中容量因數不低於離岸那座的（由資料算），避免「海上一定比較多」的印象 · onshore farms at or above the offshore one */
    const above = OFF ? inY.filter(x => !x.off && cfF(x, Y) >= cfF(OFF, Y)).sort((a, b) => cfF(b, Y) - cfF(a, Y)) : [];
    const cmp = OFF && ON && !ON.off ? cfF(OFF, Y) - cfF(ON, Y) : null;
    const explain = '<p>' + L('容量因數把「風場大小」除掉，讓不同大小、不同年份的風場可以比較。' + (cmp !== null ? Y + ' 年' + nm(OFF) + '（離岸）是 ' + pct(cfF(OFF, Y)) + '，' + (cmp === 0 ? '和' : '比') + '陸域的' + nm(ON) + '（' + pct(cfF(ON, Y)) + '）' + (cmp > 0 ? '高' : cmp < 0 ? '低' : '一樣') +
          (above.length ? '；但陸域也有不低於它的：' + above.map(x => nm(x) + ' ' + pct(cfF(x, Y))).join('、') : '') + '。地點的風況、風機、停機與限電都會影響，一兩座風場不能證明「海上一定發得比較多」。' : ''),
        'The capacity factor divides out the farm size, so farms of different sizes and years can be compared.' + (cmp !== null ? ' In ' + Y + ' ' + nm(OFF) + ' (offshore) reached ' + pct(cfF(OFF, Y)) + ', ' + (cmp > 0 ? 'above' : cmp < 0 ? 'below' : 'level with') + ' the onshore ' + nm(ON) + ' (' + pct(cfF(ON, Y)) + ')' +
          (above.length ? ', but some onshore farms did as well or better: ' + above.map(x => nm(x) + ' ' + pct(cfF(x, Y))).join(', ') : '') + '. Site wind, turbines, stoppages and curtailment all matter; one or two farms cannot show that the sea always generates more.' : '')) + '</p>' +
      (swing ? '<p>' + L('同一座風場，每年也不一樣：' + nm(swing.x) + '在 ' + swing.a + ' 年是 ' + pct(cfF(swing.x, swing.a)) + '、' + swing.b + ' 年是 ' + pct(cfF(swing.x, swing.b)) + '。可能是風的大小、停機維修或限電，這份資料只有年總量，分不出是哪一個。',
        'The same farm also varies from year to year: ' + nm(swing.x) + ' had ' + pct(cfF(swing.x, swing.a)) + ' in ' + swing.a + ' and ' + pct(cfF(swing.x, swing.b)) + ' in ' + swing.b + '. Wind, maintenance stops or curtailment could explain it; this data has only yearly totals and cannot tell which.') + '</p>' : '') +
      '<p>' + L('注意：台灣即時頁的「可用率」是某一刻的出力 ÷ 容量，是瞬間值，不是一整年的容量因數。', 'Note: the "availability" on the Taiwan live page is output ÷ capacity at one moment, not a capacity factor over a whole year.') + '</p>';

    const sources = [{ label: (M.source && M.source.TWN || 'Taiwan Power Company open data') + (M.license && M.license.TWN ? ' · ' + M.license.TWN : ''), url: (M.url && M.url.TWN) || 'https://data.gov.tw/dataset/17140' }];
    return {
      intro, tool, qs, explain, sources,
      verify: [
        { href: '#/global?out=TWN.cf', label: ['地球儀「發電表現」：台灣・官方年資料的容量因數排名', 'Globe Output dialog: capacity-factor ranking of Taiwan\'s official yearly data'] },
        { href: '#/global?f=' + encodeURIComponent((OFF || ON).name), label: ['地球儀：台電' + ((OFF || ON).st || (OFF || ON).name) + '發電站的風場卡片（實際年發電量與容量因數）', 'Globe: the ' + (OFF || ON).name + ' card (actual yearly output and capacity factor)'] },
        { href: '#/learn/why', label: ['風電知識「為什麼台灣需要風電？」一章的容量因數教具（含其他國家的風場）', 'The capacity-factor panel in Learn, chapter "Why Taiwan needs wind" (farms in other countries too)'] },
        { href: '#/live', label: ['台灣即時：此刻各風場的出力與可用率（瞬間值，不是容量因數）', 'Taiwan live: each farm\'s output and availability right now (instantaneous, not a capacity factor)'] }
      ]
    };
  }
});
})();
/* 第 4 關 · 尾流：Jensen（1983）單一尾流模型，與風電知識的「尾流效應」教具（assets/js/lessons.js 的 wake）同一套：
   風速折減 = (1 − √(1 − Ct)) ÷ (1 + 2k·x/D)²，只算正上游最近一部的尾流（每部吃到的風 = 上一部吃到的風 × (1 − 折減)），出力 ∝ v³（額定風速以下）。
   這一關沒有資料檔：題目的數字都由題目寫明的 Ct、k、x/D 當場算出。陸域 k ≈ 0.075 依 Katić 等（1986）；海上常用較小的 k，題目裡的 0.05 只是假設值。 */
(function () {
'use strict';
const SRC = [
  { label: 'N.O. Jensen, A note on wind generator interaction, Risø-M-2411 (1983)', url: 'https://orbit.dtu.dk/en/publications/a-note-on-wind-generator-interaction' },
  { label: 'Katić, Højstrup & Jensen, A simple model for cluster efficiency (1986)', url: 'https://orbit.dtu.dk/en/publications/a-simple-model-for-cluster-efficiency' }
];
const N = 5;                                                   // 一排 5 部 · a row of five
const def = (ct, k, s) => (1 - Math.sqrt(1 - ct)) / Math.pow(1 + 2 * k * s, 2);   // 風速折減（比例）· speed deficit (fraction)
const row = (ct, k, s) => { const d = def(ct, k, s), V = [1]; for (let i = 1; i < N; i++) V.push(V[i - 1] * (1 - d)); return { d, V, P: V.map(v => v * v * v) }; };

WW.lab.add({
  n: 4, id: 'wake',
  title: ['尾流', 'Wakes'],
  hook: ['風機排成一排，後面那幾部還吃得到多少風？', 'Turbines in a row: how much wind is left for the ones behind?'],
  need: [],
  build({ sh, U }) {
    const { L, f, esc } = U;
    const pc = (v, d) => f(v * 100, d == null ? 0 : d) + '%';

    /* ---------- 情境 ---------- */
    const intro = '<p>' + L('風機把風的一部分動能變成電，風通過葉輪後就變慢了。風機後方這一道又慢、又亂的氣流叫<b>尾流</b>。尾流往下游走的時候會慢慢變寬，和周圍的風混合，速度一點一點恢復；如果下游不遠處還有另一部風機，它吃到的就是比較慢的風。',
      'A turbine turns part of the wind\'s kinetic energy into electricity, so the air leaving the rotor is slower. This slower, more turbulent stream behind the turbine is its <b>wake</b>. As it moves downstream it widens, mixes with the surrounding wind and slowly speeds up again; a turbine standing not far behind gets the slower air.') + '</p>' +
      '<p>' + L('這一關用一個簡化模型（Jensen 1983）：把尾流想成一個越來越寬的圓錐，下游一部風機吃到的風速比上游少了這麼多：',
        'This level uses a simplified model (Jensen 1983): the wake is pictured as a widening cone, and the turbine downstream sees its wind speed reduced by:') + '</p>' +
      U.eq(L('風速折減', 'deficit') + ' = d₀ ÷ (1 + 2k · x/D)²') + U.eq('d₀ = 1 − √(1 − C<sub>t</sub>)') +
      '<p>' + L('d₀ 是尾流起點（剛離開葉輪不遠）的起始折減，由 C<sub>t</sub> 決定；', 'd₀ is the initial deficit at the start of the wake (a short way behind the rotor), set by C<sub>t</sub>; ') +
      L('x/D 是兩部風機的距離是葉輪直徑的幾倍（例如「間距 7D」）；C<sub>t</sub> 是推力係數，代表風機「擋」風擋得多用力（額定風速以下多在 0.7–0.9）；k 是尾流擴張係數，代表尾流變寬得多快（陸域常用 0.075，海上大氣較穩定、尾流恢復較慢，常用較小的值）。風機的出力和風速的三次方成正比（第 1 關），所以風速少一點，出力就少很多。',
        'x/D is the distance between the two turbines in rotor diameters (for example "7D spacing"); C<sub>t</sub> is the thrust coefficient, how hard the turbine pushes back on the wind (mostly 0.7–0.9 below rated speed); k is the wake decay constant, how fast the wake widens (0.075 is common onshore; offshore the air is more stable and wakes recover more slowly, so a smaller value is used). Power goes with the cube of the wind speed (Level 1), so a little less wind means a lot less power.') + '</p>' +
      (sh ? '<p>' + L('公式從哪裡來？動量理論說，推力係數 C<sub>t</sub> 的葉輪後方、壓力恢復之後（尾流的起點），風速少了 d₀ = 1 − √(1 − C<sub>t</sub>)（這是尾流的「起始折減」；在葉輪面上只少了它的一半）。Jensen 假設尾流的半徑從 D/2 開始，每往下游走 x 就多 k·x；尾流越寬，同樣的動量缺口分到越大的面積，折減就依面積比 (D ÷ (D + 2k·x))² 變小，也就是上面的分母。',
          'Where does it come from? Momentum theory says that a short way behind a rotor with thrust coefficient C<sub>t</sub>, once the pressure has recovered (the start of the wake), the wind is slower by d₀ = 1 − √(1 − C<sub>t</sub>) (the wake\'s initial deficit; at the rotor plane itself the drop is half of that). Jensen let the wake radius grow from D/2 by k·x over a distance x; as the wake widens, the same momentum gap is spread over a larger area, so the deficit shrinks by the area ratio (D ÷ (D + 2k·x))² — the denominator above.') + '</p>' : '') +
      '<p class="note">' + L('簡化的假設：風正對著這一排吹、每部只受正上游最近那一部的尾流影響（它吃到的風是上一部吃到的風再打折）、風速都在額定風速以下（出力 ∝ v³），不考慮風向變化、多個尾流疊加與地形。',
        'Simplifying assumptions: the wind blows straight along the row, each turbine feels only the wake of the nearest one upstream (applied to the slower wind that one received), all speeds are below rated (power ∝ v³), and wind-direction changes, overlapping wakes and terrain are ignored.') + '</p>';

    /* ---------- 動手：一排 5 部 ---------- */
    const S = { ws: 7, wk: 0.075, wct: 0.8, wv: 8 };
    const fm = { ws: v => f(v, 1) + ' D', wk: v => v.toFixed(3), wct: v => v.toFixed(2), wv: v => f(v, 1) + ' m/s' };
    const tool = {
      html: '<div class="lbgridt"><div>' +
        U.slider('ws', L('風機間距 x/D（葉輪直徑的倍數）', 'Spacing x/D (rotor diameters)'), 2, 12, 0.5, S.ws, fm.ws) +
        U.slider('wk', L('尾流擴張係數 k', 'Wake decay constant k'), 0.03, 0.1, 0.005, S.wk, fm.wk) +
        U.slider('wct', L('推力係數 Ct', 'Thrust coefficient Ct'), 0.5, 0.9, 0.05, S.wct, fm.wct) +
        U.slider('wv', L('第 1 部吃到的風速', 'Wind at turbine 1'), 4, 11, 0.5, S.wv, fm.wv) +
        '</div><div><div class="lbplot" id="lb4plot"></div><div id="lb4out"></div></div></div>' +
        '<p class="note">' + L('俯視圖，風從左邊吹來；風機之間的距離依實際比例畫（間距越大，葉輪畫得越小）。色塊是尾流，越深代表風速折減越大（這個模型裡每一段的折減比例相同，但風會一部比一部慢）；每部下方的數字是它吃到的風速，長條是它的出力（第 1 部＝100%）。',
          'Seen from above, wind from the left; distances are to scale (the wider the spacing, the smaller the rotors are drawn). The shaded cones are the wakes; darker means a larger speed deficit (the same fraction for every gap in this model, though the wind gets slower turbine by turbine); the number under each turbine is the wind it sees and the bar is its power (turbine 1 = 100%).') + '</p>',
      mount(root) {
        const plot = root.querySelector('#lb4plot'), out = root.querySelector('#lb4out');
        const draw = () => {
          const R = row(S.wct, S.wk, S.ws), V = R.V, P = R.P, avg = P.reduce((a, b) => a + b, 0) / N;
          const W = 360, H = 222, x0 = 34, step = (W - x0 - 26) / (N - 1), Dpx = Math.min(40, step / S.ws), cy = 58, by0 = H - 18;
          let g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(L('間距 ' + f(S.ws, 1) + ' 倍葉輪直徑、k = ' + S.wk.toFixed(3) + '、Ct = ' + S.wct.toFixed(2) + '：第 2 部吃到 ' + pc(V[1]) + ' 的風、出力 ' + pc(P[1]) + '；第 5 部出力 ' + pc(P[4]) + '；整排平均出力 ' + pc(avg),
            'Spacing ' + f(S.ws, 1) + ' D, k = ' + S.wk.toFixed(3) + ', Ct = ' + S.wct.toFixed(2) + ': turbine 2 sees ' + pc(V[1]) + ' of the wind and makes ' + pc(P[1]) + ' of the power; turbine 5 makes ' + pc(P[4]) + '; row average ' + pc(avg))) + '">';
          g += '<text x="2" y="' + Math.max(10, cy - Dpx / 2 - 6).toFixed(1) + '">' + L('風→', 'wind→') + '</text>';
          for (let i = 0; i < N - 1; i++) {                    // 尾流圓錐：半寬 = D/2 + k·x · wake cone, half-width D/2 + k·x
            const xa = x0 + i * step, xb = x0 + (i + 1) * step, ha = Dpx / 2, hb = Dpx / 2 + S.wk * S.ws * Dpx;
            g += '<polygon points="' + [xa, cy - ha, xb, cy - hb, xb, cy + hb, xa, cy + ha].map(v => v.toFixed(1)).join(' ') + '" style="fill:var(--hist);opacity:' + (0.15 + 1.4 * (1 - V[i + 1] / V[i])).toFixed(2) + '"/>';
          }
          for (let i = 0; i < N; i++) {
            const x = x0 + i * step, bh = 62 * P[i], by = by0 - bh;
            g += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + (cy - Dpx / 2).toFixed(1) + '" y2="' + (cy + Dpx / 2).toFixed(1) + '" style="stroke:var(--ink);stroke-width:3;stroke-linecap:round"/>' +
              '<circle cx="' + x.toFixed(1) + '" cy="' + cy + '" r="2.5" style="fill:var(--ink)"/>' +
              '<text x="' + x.toFixed(1) + '" y="' + (cy + 40) + '" text-anchor="middle" style="fill:var(--ink);font-weight:700">#' + (i + 1) + '</text>' +
              '<text x="' + x.toFixed(1) + '" y="' + (cy + 54) + '" text-anchor="middle">' + f(S.wv * V[i], 1) + '</text>' +
              '<rect x="' + (x - 13).toFixed(1) + '" y="' + by.toFixed(1) + '" width="26" height="' + bh.toFixed(1) + '" rx="3" style="fill:var(--live)"/>' +
              '<text x="' + x.toFixed(1) + '" y="' + (by - 4).toFixed(1) + '" text-anchor="middle" style="fill:var(--ink)">' + pc(P[i]) + '</text>';
          }
          g += '<line x1="' + (x0 - 18) + '" x2="' + (W - 6) + '" y1="' + by0 + '" y2="' + by0 + '" class="ax"/>' +
            '<text x="2" y="' + (cy + 54) + '">m/s</text><text x="' + (W - 4) + '" y="' + (H - 3) + '" text-anchor="end">' + L('出力（第 1 部＝100%）', 'power (turbine 1 = 100%)') + '</text></svg>';
          plot.innerHTML = g;
          out.innerHTML = U.chip(L('風速折減', 'Speed deficit'), pc(R.d, 1)) + U.chip(L('第 2 部的風速', 'Wind at turbine 2'), f(S.wv * V[1], 1) + ' m/s' + L('（', ' (') + pc(V[1]) + L('）', ')')) +
            U.chip(L('第 2 部的出力', 'Power of turbine 2'), pc(P[1])) + U.chip(L('第 5 部的出力', 'Power of turbine 5'), pc(P[4])) + U.chip(L('整排 5 部平均出力', 'Row average (5 turbines)'), pc(avg)) +
            '<p class="note">' + L('試試看：把間距從 12D 慢慢拉到 3D，第 2 部的出力怎麼變？再把 k 調小（像海上），同樣的間距尾流損失變大還是變小？',
              'Try it: slide the spacing from 12D down to 3D. What happens to turbine 2\'s power? Then make k smaller (as offshore): at the same spacing, do wake losses grow or shrink?') + '</p>';
        };
        U.bind(root, S, fm, draw); draw();
      }
    };

    /* ---------- 問題 ---------- */
    let qs;
    if (!sh) {
      const CT = 0.8, K = 0.075, SA = 8, SB = 4, SC = 5;
      const ra = 1 - def(CT, K, SA), rb = 1 - def(CT, K, SB);
      const rp = Math.round((1 - def(CT, K, SC)) * 100), pw = Math.pow(rp / 100, 3) * 100;   // 題目給整數 % 的風速比 · the speed ratio as a whole %
      qs = [
        { id: 'a', type: 'mc', q: L('風通過風機之後，為什麼會變慢？', 'Why is the wind slower after it has passed a turbine?'),
          opts: [[L('塔架擋住了風', 'The tower blocks the wind'), L('塔架只擋住很小一塊；尾流主要是葉輪造成的。', 'The tower blocks only a small strip; the wake comes mainly from the rotor.')],
            [L('風機把風的一部分動能拿去發電了，留下來的風動能變少、速度變慢', 'The turbine took part of the wind\'s kinetic energy to make electricity, so the air left behind has less energy and moves more slowly')],
            [L('葉片把空氣加熱，熱空氣往上跑', 'The blades heat the air and the warm air rises'), L('葉片不會明顯加熱空氣；能量是被發電機拿走的。', 'The blades do not noticeably heat the air; the energy goes to the generator.')],
            [L('風機會把風往回吹', 'The turbine blows the wind backwards'), L('風機不是電風扇：它從風裡取能量，不會往回吹。', 'A turbine is not a fan: it takes energy from the wind and does not blow it back.')]],
          a: 1, hint: L('回想第 1 關：風的功率來自風的動能（½mv²）。', 'Remember Level 1: the wind\'s power comes from its kinetic energy (½mv²).'),
          sol: '<p>' + L('能量不會憑空出現或消失：風機發出來的電，就是從風的動能來的。動能少了，風速就變慢，這道慢下來的氣流就是尾流。',
            'Energy is not created or lost: the electricity the turbine makes comes from the wind\'s kinetic energy. With less kinetic energy the air moves more slowly, and that slower stream is the wake.') + '</p>' },
        { id: 'b', type: 'mc', q: L('把兩部風機的間距從 ' + SA + ' 倍葉輪直徑（' + SA + 'D）縮短成 ' + SB + 'D，下游那一部吃到的風會怎樣？（用上面的工具試試）',
            'The spacing between two turbines is cut from ' + SA + ' rotor diameters (' + SA + 'D) to ' + SB + 'D. What happens to the wind at the downstream turbine? (Try it with the tool above.)'),
          opts: [[L('變快，因為風被擠在兩部風機之間', 'Faster, because the air is squeezed between the turbines'), L('風沒有被擠快；靠得越近，尾流越來不及恢復。', 'The air is not squeezed faster; the closer they are, the less time the wake has to recover.')],
            [L('一樣，風一離開葉輪馬上就恢復了', 'The same: the wind recovers as soon as it leaves the rotor'), L('尾流要往下游走一段距離、和周圍的風混合，才會慢慢恢復。', 'The wake needs distance downstream, mixing with the surrounding wind, to recover slowly.')],
            [L('變慢，因為尾流還沒走多遠、來不及恢復', 'Slower, because the wake has not travelled far enough to recover')],
            [L('只有離岸風場才會變慢', 'Slower only at offshore farms'), L('陸上一樣有尾流；海上只是恢復得比較慢。', 'Onshore farms have wakes too; at sea they just recover more slowly.')]],
          a: 2, hint: L('把工具的間距滑桿從 ' + SA + 'D 拉到 ' + SB + 'D，看第 2 部的風速。', 'Move the spacing slider from ' + SA + 'D to ' + SB + 'D and watch the wind at turbine 2.'),
          sol: '<p>' + L('用模型算（C<sub>t</sub> = ' + CT + '、k = ' + K + '）：間距 ' + SA + 'D 時，第 2 部吃到第 1 部風速的 ' + pc(ra) + '；縮到 ' + SB + 'D 只剩 ' + pc(rb) + '。靠得越近，尾流越來不及變寬、和周圍的風混合，風就越慢。',
            'With the model (C<sub>t</sub> = ' + CT + ', k = ' + K + '): at ' + SA + 'D turbine 2 sees ' + pc(ra) + ' of turbine 1\'s wind speed; at ' + SB + 'D only ' + pc(rb) + '. The closer they are, the less the wake has widened and mixed with the surrounding wind, so the slower the air.') + '</p>' },
        { id: 'c', type: 'num', q: L('依這個模型（間距 ' + SC + 'D、C<sub>t</sub> = ' + CT + '、k = ' + K + '），第 2 部吃到的風速是第 1 部的 ' + rp + '%。出力和風速的三次方成正比，第 2 部的出力是第 1 部的幾 %？（四捨五入到整數）',
            'In this model (spacing ' + SC + 'D, C<sub>t</sub> = ' + CT + ', k = ' + K + '), turbine 2 sees ' + rp + '% of turbine 1\'s wind speed. Power goes with the cube of the wind speed. What percentage of turbine 1\'s power does turbine 2 make? (round to a whole number)'),
          ans: pw, unit: '%', tol: { abs: 0.6 }, hint: L('把 ' + rp + '% 寫成 ' + f(rp / 100, 2) + '，算 ' + f(rp / 100, 2) + ' × ' + f(rp / 100, 2) + ' × ' + f(rp / 100, 2) + '，再乘以 100。', 'Write ' + rp + '% as ' + f(rp / 100, 2) + ', work out ' + f(rp / 100, 2) + ' × ' + f(rp / 100, 2) + ' × ' + f(rp / 100, 2) + ', then multiply by 100.'),
          sol: U.eq(f(rp / 100, 2) + '³ = ' + f(rp / 100, 2) + ' × ' + f(rp / 100, 2) + ' × ' + f(rp / 100, 2)) + U.eq('≈ ' + f(pw / 100, 3) + ' → ' + f(pw, 0) + '%') +
            '<p>' + L('風速只少了 ' + (100 - rp) + '%，出力卻少了大約 ' + f(100 - pw, 0) + '%：這就是 v³ 的威力。', 'The wind is only ' + (100 - rp) + '% slower, yet the power is about ' + f(100 - pw, 0) + '% lower: that is the power of v³.') + '</p>' }
      ];
    } else {
      const CT = 0.78, K = 0.05, X = 6, KEEP = 0.9, SN = 4, SF = 8;   // Ct 0.78 不在滑桿格點上（間隔 0.05），學生要自己算 · not on the slider grid, so it must be computed
      const d0 = 1 - Math.sqrt(1 - CT), den = Math.pow(1 + 2 * K * X, 2), d = d0 / den, p2 = Math.pow(1 - d, 3);
      const dmax = 1 - Math.pow(KEEP, 1 / 3), need = (Math.sqrt(d0 / dmax) - 1) / (2 * K);          // 出力保留 90% 所需間距 · spacing for 90% power
      const pN = Math.pow(1 - def(CT, K, SN), 3), pF = Math.pow(1 - def(CT, K, SF), 3);
      const kTxt = L('k = ' + K + '（假設值；海上常用比陸域 0.075 小的 k）', 'k = ' + K + ' (an assumed value; offshore k is usually taken smaller than the onshore 0.075)');
      qs = [
        { id: 'a', type: 'num', q: L('一部離岸風機的 C<sub>t</sub> = ' + CT + '，' + kTxt + '。依 Jensen 模型，正下游 ' + X + 'D 處的風速折減是幾 %？（算到小數第一位）',
            'An offshore turbine has C<sub>t</sub> = ' + CT + ', ' + kTxt + '. In the Jensen model, what is the speed deficit ' + X + 'D straight downstream, in %? (one decimal)'),
          ans: d * 100, unit: '%', tol: { abs: 0.15 }, hint: L('先算起始折減 1 − √(1 − ' + CT + ')，再除以 (1 + 2 × ' + K + ' × ' + X + ')²。別忘了平方。', 'First the initial deficit 1 − √(1 − ' + CT + '), then divide by (1 + 2 × ' + K + ' × ' + X + ')². Don\'t forget the square.'),
          sol: U.eq('d₀ = 1 − √(1 − ' + CT + ')') + U.eq('= 1 − ' + f(Math.sqrt(1 - CT), 3) + ' = ' + f(d0, 3)) +
            U.eq('(1 + 2 × ' + K + ' × ' + X + ')²') + U.eq('= ' + f(1 + 2 * K * X, 2) + '² = ' + f(den, 4)) +
            U.eq(f(d0, 3) + ' ÷ ' + f(den, 4) + ' ≈ ' + f(d, 4)) + U.eq('→ ' + f(d * 100, 1) + '%') },
        { id: 'b', type: 'num', q: L('承上題，下游這一部的出力是上游那一部的幾 %？（出力 ∝ v³，兩部都在額定風速以下；算到小數第一位）',
            'Following on, what percentage of the upstream turbine\'s power does the downstream one make? (power ∝ v³, both below rated speed; one decimal)'),
          ans: p2 * 100, unit: '%', tol: { abs: 0.3 }, hint: L('下游的風速是上游的 (1 − 折減) 倍，出力就是它的三次方。', 'The downstream wind is (1 − deficit) times the upstream wind; the power is that cubed.'),
          sol: U.eq('(1 − ' + f(d, 4) + ')³ = ' + f(1 - d, 4) + '³') + U.eq('≈ ' + f(p2, 4) + ' → ' + f(p2 * 100, 1) + '%') +
            '<p>' + L('風速少了 ' + f(d * 100, 1) + '%，出力卻少了 ' + f(100 - p2 * 100, 1) + '%。', 'A ' + f(d * 100, 1) + '% drop in wind speed costs ' + f(100 - p2 * 100, 1) + '% of the power.') + '</p>' },
        { id: 'c', type: 'num', q: L('同樣的 C<sub>t</sub> = ' + CT + '、k = ' + K + '：要讓下游那一部剛好保有上游 ' + Math.round(KEEP * 100) + '% 的出力，間距 x/D 大約是幾倍葉輪直徑？（從公式反推，四捨五入到整數）',
            'Same C<sub>t</sub> = ' + CT + ' and k = ' + K + ': at what spacing x/D (in rotor diameters) does the downstream turbine keep exactly ' + Math.round(KEEP * 100) + '% of the upstream power? (solve the formula backwards; round to the nearest whole number)'),
          ans: need, unit: 'D', tol: { abs: 0.6 }, hint: L('出力 ' + Math.round(KEEP * 100) + '% → 風速比 = ∛' + KEEP + ' → 折減上限 = 1 − ∛' + KEEP + '；再解 ' + f(d0, 3) + ' ÷ (1 + 2k·x/D)² = 折減上限。注意是「出力」' + Math.round(KEEP * 100) + '%，不是風速。',
            Math.round(KEEP * 100) + '% power → speed ratio = ∛' + KEEP + ' → largest deficit = 1 − ∛' + KEEP + '; then solve ' + f(d0, 3) + ' ÷ (1 + 2k·x/D)² = that deficit. It is ' + Math.round(KEEP * 100) + '% of the power, not of the wind speed.'),
          sol: U.eq('∛' + KEEP + ' ≈ ' + f(Math.pow(KEEP, 1 / 3), 4)) + U.eq(L('折減上限', 'max deficit') + ' = ' + f(dmax, 4)) +
            U.eq('(1 + 2 × ' + K + ' × x/D)²') + U.eq('= ' + f(d0, 3) + ' ÷ ' + f(dmax, 4) + ' ≈ ' + f(d0 / dmax, 2)) +
            U.eq('1 + ' + f(2 * K, 2) + ' · x/D = √' + f(d0 / dmax, 2)) + U.eq('≈ ' + f(Math.sqrt(d0 / dmax), 3)) +
            U.eq('x/D ≈ ' + f(need, 1)) +
            '<p>' + L('大約要 ' + Math.round(need) + 'D 這麼遠，比工具的滑桿還長。在這個模型裡，海上的尾流要很長的距離才恢復；實際風場的間距通常比這小，接受一部分尾流損失（下一題）。',
              'About ' + Math.round(need) + 'D — further than the slider in the tool goes. In this model offshore wakes take a long distance to recover; real farms usually space turbines closer than this and accept some wake loss (next question).') + '</p>' },
        { id: 'd', type: 'mc', q: L('一塊固定大小的海域要蓋風場。風機排成方格，間距從 ' + SF + 'D 縮成 ' + SN + 'D，可以放的風機數大約變成 4 倍。下面哪一個說法最合理？',
            'A wind farm is planned in a sea area of fixed size, with turbines on a square grid. Cutting the spacing from ' + SF + 'D to ' + SN + 'D fits about 4 times as many turbines. Which statement is most reasonable?'),
          opts: [[L('越密越好：風機數變 4 倍，發電量也一定變 4 倍', 'Denser is always better: 4 times the turbines must give 4 times the energy'), L('間距縮短時尾流損失變大，每部下游風機發得比較少，總發電量不會跟著風機數等比增加。', 'Closer spacing means bigger wake losses: each downstream turbine makes less, so total energy does not grow in step with the number of turbines.')],
            [L('越疏越好：間距 ' + SF + 'D 以上就完全沒有尾流損失', 'Sparser is always better: beyond ' + SF + 'D there is no wake loss at all'), L('用模型算算看：' + SF + 'D 時下游仍只剩約 ' + pc(pF) + ' 的出力；而且太疏的話，同一塊海域能裝的容量就少了。', 'Work it out with the model: at ' + SF + 'D the downstream turbine still makes only about ' + pc(pF) + '; and too sparse a layout fits less capacity into the same area.')],
            [L('要取捨：靠近一點能放更多容量，但每部下游風機的尾流損失變大', 'It is a trade-off: closer spacing fits more capacity but each downstream turbine loses more to wakes')],
            [L('間距不重要，因為風向一直在變，尾流打不到下游風機', 'Spacing does not matter, because the wind direction keeps changing and the wakes miss the downstream turbines'), L('風向變化會讓尾流有時打中、有時錯開，但不會讓損失消失；所以實際風場要依當地的風向分布排列。', 'Changing wind directions make wakes hit some of the time and miss at other times, but the loss does not vanish; that is why farms are laid out for the local wind-direction distribution.')]],
          a: 2, hint: L('比較兩件事：同一塊海域能放幾部風機，以及每部下游風機在 ' + SN + 'D 和 ' + SF + 'D 時各剩多少出力。', 'Compare two things: how many turbines fit in the area, and how much power each downstream turbine keeps at ' + SN + 'D and at ' + SF + 'D.'),
          sol: '<p>' + L('用同樣的 C<sub>t</sub> = ' + CT + '、k = ' + K + '：間距 ' + SF + 'D 時，正下游一部剩 ' + pc(pF, 1) + ' 的出力；縮到 ' + SN + 'D 只剩 ' + pc(pN, 1) + '。方格間距減半，每平方公里的風機數變成 2² = 4 倍，容量變大，但被尾流打到時每部發得少很多。所以沒有「越密越好」或「越疏越好」，而是要在容量、發電量、海纜與基礎的成本之間取捨，並依當地主要風向排列（風從各方向吹來的時間不同，尾流不會一直打中同一部）。',
            'With the same C<sub>t</sub> = ' + CT + ' and k = ' + K + ': at ' + SF + 'D the turbine straight downstream keeps ' + pc(pF, 1) + ' of the power; at ' + SN + 'D only ' + pc(pN, 1) + '. Halving the grid spacing puts 2² = 4 times as many turbines in each square kilometre — more capacity, but each one makes much less when it sits in a wake. So neither "denser" nor "sparser" is always better: designers trade capacity and energy against the cost of cables and foundations, and lay the rows out for the local wind directions (the wind blows from different directions at different times, so a wake does not always hit the same turbine).') + '</p>' }
      ];
    }

    return {
      intro, tool, qs,
      explain: '<p>' + L('風機會互相「搶風」：上游的風機把風的能量拿走，下游的就吃到比較慢的風；而出力和風速的三次方成正比，風速少一點，出力就少很多。所以風場設計不是把風機塞得越多越好，而是在同一塊土地或海域裡，權衡可以裝多少容量、尾流會吃掉多少電，並依當地主要的風向排列。這一關的 Jensen 模型很簡化（一部尾流、風向固定、Ct 與 k 是假設值）；實際設計會用多年的風向風速資料與更完整的尾流模型。',
        'Turbines "compete" for the wind: the ones upstream take energy out of it and the ones behind get slower air, and since power goes with the cube of the speed, a little less wind costs a lot of power. So designing a farm is not about squeezing in as many turbines as possible but about weighing the capacity that fits in an area against the energy wakes take away, and laying the rows out for the local wind directions. The Jensen model here is very simplified (one wake, a fixed wind direction, assumed Ct and k); real designs use years of wind data and fuller wake models.') + '</p>',
      verify: [
        { href: '#/learn/offshore', label: ['風電知識第 6 章「走向大海：離岸風電」的尾流效應教具：同一個模型，一排 5 部風機', 'The wake panel in Learn, chapter 6 “Going offshore”: the same model, a row of five turbines'] },
        { href: '#/global?f=' + encodeURIComponent('Horns Rev 1') + '&sv=1', label: ['地球儀實景視角：丹麥 Horns Rev 1 離岸風場的風機怎麼排列', 'Globe sea-level view: how the turbines of Denmark\'s Horns Rev 1 offshore farm are laid out'] }
      ],
      sources: SRC
    };
  }
});
})();
/* 第 5 關 · 為什麼到海上：水下基礎型式與水深。資料 foundations.json（farms：t 型式代碼、d [最淺, 最深] 水深 m、s 細分型式；meta.types／meta.subs 中英名稱、meta.note 收集進度、meta.ospar 出處），
   台灣離岸容量取 wind_global.json（國家統計）；動手區另讀 offshore_farms.json 找出台灣的風場（單檔版改用內嵌的 wind_farms.json，與知識頁相同），讀不到就不標，題目不靠它。
   題目只問資料裡看得到的事（各型式座數、占比、最大水深、比固定式最深還深的浮動式座數），不寫門檻值；「為什麼到海上」的說法依風電知識第 6、7 章。 */
(function () {
'use strict';
WW.lab.add({
  n: 5, id: 'offshore',
  title: ['為什麼到海上', 'Why go offshore'],
  hook: ['海上的風比較好，可是風機要怎麼站在多深的水裡？', 'The wind is better at sea — but how does a turbine stand in deep water?'],
  need: ['foundations', 'global'],
  build({ sh, D, U }) {
    const { L, f } = U;
    const FD = D.foundations, TY = (FD && FD.meta && FD.meta.types) || {}, SUB = (FD && FD.meta && FD.meta.subs) || {};
    const tn = t => L(TY[t][0], TY[t][1]);
    const dm = x => String(Math.round(x * 10) / 10);                 // 水深顯示：最多一位小數
    const SEP = L('、', ', ');
    const names = list => list.map(x => U.esc(x.name)).join(SEP);

    /* ---------- 資料整理（全部當場算） ---------- */
    const rows = Object.keys((FD && FD.farms) || {}).map(name => {
      const r = FD.farms[name], d = r.d;
      let lo = null, hi = null;
      if (Array.isArray(d)) { lo = d[0]; hi = d[d.length - 1]; } else if (typeof d === 'number') { lo = hi = d; }
      if (!(hi > 0) && lo > 0) hi = lo;
      return { name, t: r.t, s: r.s, lo: typeof lo === 'number' ? lo : null, hi: hi > 0 ? hi : null };
    }).filter(x => TY[x.t]);
    const N = rows.length, byT = {};
    rows.forEach(x => { const g = byT[x.t] || (byT[x.t] = { t: x.t, n: 0, ds: [] }); g.n++; if (x.hi != null) g.ds.push(x); });
    const types = Object.keys(byT).map(k => byT[k]).sort((a, b) => b.n - a.n || (a.t < b.t ? -1 : 1));
    types.forEach(g => {
      g.ds.sort((a, b) => a.hi - b.hi);
      const v = g.ds.map(x => x.hi), m = v.length;
      g.med = m ? (m % 2 ? v[(m - 1) / 2] : (v[m / 2 - 1] + v[m / 2]) / 2) : null;
      g.max = m ? v[m - 1] : null; g.min = m ? v[0] : null;
      g.deep = g.ds.filter(x => x.hi === g.max);
    });
    const withD = rows.filter(x => x.hi != null);
    const mp = byT.mp, flo = byT.fl;
    if (!N || !mp || !flo || !mp.ds.length || !flo.ds.length) throw new Error('lab 5: foundations data missing');
    const DMAX = Math.max(...withD.map(x => x.hi)), deepest = withD.filter(x => x.hi === DMAX);
    const fixed = withD.filter(x => x.t !== 'fl'), FXMAX = Math.max(...fixed.map(x => x.hi)), fxDeep = fixed.filter(x => x.hi === FXMAX);
    const fxV = fixed.map(x => x.hi).sort((a, b) => a - b), fxMed = fxV.length % 2 ? fxV[(fxV.length - 1) / 2] : (fxV[fxV.length / 2 - 1] + fxV[fxV.length / 2]) / 2;
    const flOver = flo.ds.filter(x => x.hi > FXMAX), flNotOver = flo.ds.length - flOver.length;
    const flMin = flo.ds[0];
    const pMp = mp.n / N * 100, pFl = flo.n / N * 100;
    const asof = FD.meta.asof || '';
    const OSP = FD.meta.ospar || null;
    const G = D.global, gy = G && G.years ? G.years.length - 1 : -1, TW = G && G._idx ? G._idx.TWN : null;
    const twOff = TW && TW.off && gy >= 0 ? TW.off[gy] : null, Y1 = G && G.Y1;

    /* ---------- 情境 ---------- */
    const intro = '<p>' + L('陸地上的風會被山丘、樹林和建築擋住、變慢；海面平坦，沒有東西阻擋，所以海上的風比陸地更強、更穩定。海上空間大、離住家遠，風機也可以做得更大（大葉片不必走道路運輸）。代價是：風機得「站」在海裡。',
        'On land, hills, trees and buildings slow the wind down. The sea surface is flat with nothing in the way, so the wind at sea is stronger and steadier than on land. There is more room at sea, far from homes, and turbines can be bigger (huge blades need not travel by road). The catch: the turbine has to stand in the sea.') + '</p>' +
      '<p>' + L('塔架下面的<b>水下基礎</b>要把整部風機固定在海床上，或像船一樣浮在海面、再用纜繩和錨拉住（<b>浮動式</b>）。選哪一種，要看水深、海床地質、風機大小與施工船隊（風電知識第 7 章）。這一關只看其中一項：<b>水深</b>。',
        'Below the tower, the <b>foundation</b> either fixes the turbine to the seabed or floats like a ship, held by mooring lines and anchors (<b>floating</b>). Which one is chosen depends on water depth, seabed geology, turbine size and the installation fleet (Learn, chapter 7). This level looks at one of them: <b>water depth</b>.') + '</p>' +
      '<p>' + L('資料：本站逐場查證的水下基礎對照表（' + U.esc(asof) + '），共 ' + U.int(N) + ' 座離岸風場已查明型式（含已除役與興建中的紀錄），其中 ' + U.int(withD.length) + ' 座有水深範圍。下面說的「最大水深」是每座風場水深範圍裡最深的那個數字。',
        'Data: the site\'s farm-by-farm foundation table (' + U.esc(asof) + '): ' + U.int(N) + ' offshore farms with a known type (retired and under-construction records included), ' + U.int(withD.length) + ' of them with a water-depth range. “Maximum depth” below means the deepest figure in each farm\'s depth range.') + '</p>' +
      (FD.meta.note ? '<p class="note">' + U.esc(L(FD.meta.note[0], FD.meta.note[1])) + L('。所以這裡的座數是「本站已查證的風場」，不是全世界的市占。', '. So the counts here are farms the site has checked, not world market shares.') + '</p>' : '');

    /* ---------- 動手：依型式的最大水深 ---------- */
    const TOP = Math.ceil(DMAX / 10) * 10;
    const S = { dep: Math.min(30, TOP) };
    const fm = { dep: x => U.int(x) + ' m' };
    let twSet = null, twOn = false;
    const SG = types.filter(g => g.ds.length);                      // 有水深的型式才畫
    const table = '<div class="lbtw"><table class="lbtbl"><caption class="note" style="caption-side:bottom;text-align:left">' +
      L('「最大水深」的中位數與最深，只算有水深資料的風場。', 'Median and deepest use only the farms that have a depth range.') + '</caption><thead><tr><th>' + L('型式', 'Type') + '</th><th class="r">' + L('座數', 'Farms') + '</th><th class="r">' + L('有水深', 'With depth') +
      '</th><th class="r">' + L('最大水深中位數', 'Median max depth') + '</th><th class="r">' + L('最大水深最深', 'Deepest max depth') + '</th></tr></thead><tbody>' +
      types.map(g => '<tr><td>' + tn(g.t) + '</td><td class="r">' + U.int(g.n) + '</td><td class="r">' + U.int(g.ds.length) + '</td><td class="r">' + (g.med != null ? dm(g.med) + ' m' : '—') + '</td><td class="r">' + (g.max != null ? dm(g.max) + ' m' : '—') + '</td></tr>').join('') +
      '<tr><td><b>' + L('合計', 'Total') + '</b></td><td class="r"><b>' + U.int(N) + '</b></td><td class="r"><b>' + U.int(withD.length) + '</b></td><td></td><td></td></tr></tbody></table></div>';
    const tool = {
      html: '<div class="lbgridt"><div>' + U.slider('dep', L('最大水深超過', 'Maximum depth over'), 0, TOP, 1, S.dep, fm.dep) +
        '<label style="display:flex;gap:8px;align-items:center;font-size:13.5px;color:var(--ink-2);margin:10px 0 4px"><input type="checkbox" id="lb5tw" disabled> <span>' + L('標出台灣的風場（◆ 菱形）', 'Mark Taiwan\'s farms (◆ diamond)') + '</span></label>' +
        '<p class="note" id="lb5twn">' + L('讀取台灣風場名單…', 'Loading Taiwan\'s farm list…') + '</p></div><div id="lb5out"></div></div>' +
        '<div class="lbplot" id="lb5plot"></div>' +
        '<p class="note">' + L('每一點是一座風場的最大水深，直線是該型式的中位數；虛線是滑桿設定的水深，比它深的點是實心，其餘是空心圈。橫軸用平方根刻度，讓淺水的點不會擠在一起。',
          'Each dot is one farm\'s maximum depth; the bar marks the median for that type. The dashed line is the slider depth: dots deeper than it are solid, the rest are hollow rings. The axis uses a square-root scale so the shallow farms do not pile up.') + '</p>' +
        table + '<div id="lb5twl"></div>',
      mount(root) {
        const out = root.querySelector('#lb5out'), plot = root.querySelector('#lb5plot'), cb = root.querySelector('#lb5tw');
        const draw = () => {
          const X = S.dep, over = withD.filter(x => x.hi > X), cnt = {};
          over.forEach(x => { cnt[x.t] = (cnt[x.t] || 0) + 1; });
          out.innerHTML = '<p class="note" style="margin:0 0 4px">' + L('最大水深超過 ' + U.int(X) + ' m 的風場：', 'Farms with a maximum depth over ' + U.int(X) + ' m:') + '</p>' +
            U.chip(L('合計', 'Total'), U.int(over.length) + L(' 座', '')) +
            SG.filter(g => cnt[g.t]).map(g => U.chip(tn(g.t), U.int(cnt[g.t]) + L(' 座', ''))).join('');
          const W = Math.max(300, Math.min(900, Math.round(plot.clientWidth || 640))), pl = 8, pr = 18, RH = 38, top = 18;
          const xs = d => pl + (W - pl - pr) * Math.sqrt(Math.max(0, d) / TOP);
          const H = top + SG.length * RH + 34, ay = top + SG.length * RH + 4;
          const ticks = [0, 10, 20, 30, 50, 100, 200, 300, 500].filter(t => t <= TOP && !(W < 480 && t === 20));
          let g = ticks.map(t => '<line class="gr" x1="' + xs(t).toFixed(1) + '" x2="' + xs(t).toFixed(1) + '" y1="' + top + '" y2="' + ay + '"/>' +
            '<text x="' + xs(t).toFixed(1) + '" y="' + (ay + 14) + '" text-anchor="middle">' + t + '</text>').join('') +
            '<line class="ax" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + ay + '" y2="' + ay + '"/>' +
            '<text x="' + (W - pr) + '" y="' + (ay + 28) + '" text-anchor="end">' + U.esc(L('最大水深（m，平方根刻度）', 'Maximum depth (m, square-root scale)')) + '</text>';
          SG.forEach((s, i) => {
            const y0 = top + i * RH, cy = y0 + 25;
            s.ds.forEach(x => {
              const cx = xs(x.hi).toFixed(1), on = x.hi > X;
              if (twOn && twSet && twSet.has(x.name)) g += '<path d="M' + cx + ' ' + (cy - 7) + 'l6 7l-6 7l-6 -7z" style="fill:var(--hist);fill-opacity:' + (on ? 1 : 0.35) + ';stroke:var(--ink);stroke-width:1.2"/>';
              else g += on ? '<circle cx="' + cx + '" cy="' + cy + '" r="4" style="fill:var(--live);fill-opacity:.85;stroke:var(--live)"/>'
                : '<circle cx="' + cx + '" cy="' + cy + '" r="3.6" style="fill:none;stroke:var(--live);stroke-opacity:.7;stroke-width:1.2"/>';
            });
            if (s.med != null) g += '<line x1="' + xs(s.med).toFixed(1) + '" x2="' + xs(s.med).toFixed(1) + '" y1="' + (cy - 9) + '" y2="' + (cy + 9) + '" style="stroke:var(--ink);stroke-width:2.5"/>';
          });
          const tx = xs(X);
          g += '<line x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="' + (top - 6) + '" y2="' + ay + '" style="stroke:var(--hist);stroke-width:1.6;stroke-dasharray:4 3"/>' +
            '<text x="' + Math.min(W - pr, Math.max(pl + 16, tx)).toFixed(1) + '" y="' + (top - 8) + '" text-anchor="middle" style="fill:var(--ink);font-weight:800;font-size:11.5px">' + U.int(X) + ' m</text>';
          SG.forEach((s, i) => {                                   // 型式名稱最後畫、加底色描邊，免得被虛線或點蓋住
            g += '<text x="' + pl + '" y="' + (top + i * RH + 10) + '" style="fill:var(--ink-2);font-size:12px;font-weight:700;paint-order:stroke;stroke:var(--surface-1);stroke-width:4px;stroke-linejoin:round">' + U.esc(tn(s.t) + L('（' + s.ds.length + ' 座）', ' (' + s.ds.length + ')')) + '</text>';
          });
          const desc = SG.map(s => tn(s.t) + ' ' + s.ds.length + L(' 座，中位數 ', (s.ds.length === 1 ? ' farm' : ' farms') + ', median ') + dm(s.med) + L(' m、最深 ', ' m, deepest ') + dm(s.max) + ' m').join(L('；', '; '));
          plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + (H + 6) + '" role="img" aria-label="' + U.esc(L('各型式風場的最大水深：', 'Maximum depth of farms by foundation type: ') + desc +
            L('。虛線在 ' + U.int(X) + ' m，超過的有 ' + over.length + ' 座。', '. Dashed line at ' + U.int(X) + ' m; ' + over.length + ' farms are deeper.')) + '">' + g + '</svg>';
        };
        U.bind(root, S, fm, draw); draw();
        const onR = () => { if (!plot.isConnected) { window.removeEventListener('resize', onR); return; } draw(); };
        window.addEventListener('resize', onR);
        cb.onchange = () => { twOn = cb.checked; draw(); };
        // 台灣的風場名單：網站版讀離岸小檔，單檔版讀內嵌的完整風場檔（同知識頁）
        const tp = WW.standalone
          ? WW.getJSON(WW.DATA.farms).then(J => { const c = {}; J.meta.cols.forEach((k, i) => { c[k] = i; }); return J.rows.filter(r => r[c.iso] === 'TWN').map(r => r[c.name]); })
          : WW.getJSON(WW.DATA.offshoreFarms).then(J => J.rows.filter(r => r[1] === 'TWN').map(r => r[0]));
        tp.then(list => {
          if (!plot.isConnected) return;
          twSet = new Set(list);
          const tw = rows.filter(x => twSet.has(x.name)).sort((a, b) => (a.hi == null ? 1e9 : a.hi) - (b.hi == null ? 1e9 : b.hi));
          const tc = {}; tw.forEach(x => { tc[x.t] = (tc[x.t] || 0) + 1; });
          root.querySelector('#lb5twn').textContent = tw.length ? L('台灣有 ' + tw.length + ' 座已查明型式：', 'Taiwan has ' + tw.length + ' farms with a known type: ') + Object.keys(tc).map(t => tn(t) + ' ' + tc[t]).join(SEP) : L('對照表裡還沒有台灣的風場。', 'No Taiwanese farms in the table yet.');
          cb.disabled = !tw.length;
          if (tw.length) root.querySelector('#lb5twl').innerHTML = '<h3 class="h4" style="margin:12px 0 4px;font-size:14.5px">' + L('台灣的離岸風場', 'Taiwan\'s offshore farms') + '</h3>' +
            (twOff != null ? '<p class="note">' + L('台灣 ' + Y1 + ' 年底離岸風電 ' + U.int(twOff) + ' MW（本站國家統計，能源署）。下表是對照表裡已查明型式的台灣風場（名稱與地球儀相同）：', 'Taiwan had ' + U.int(twOff) + ' MW offshore at the end of ' + Y1 + ' (the site\'s national figure, Energy Administration). The table lists the Taiwanese farms with a known type (names as on the globe):') + '</p>' : '') +
            '<div class="lbtw"><table class="lbtbl"><thead><tr><th>' + L('風場', 'Farm') + '</th><th>' + L('型式', 'Type') + '</th><th class="r">' + L('水深', 'Depth') + '</th></tr></thead><tbody>' +
            tw.map(x => '<tr><td><a href="#/global?f=' + encodeURIComponent(x.name) + '">' + U.esc(x.name) + '</a></td><td>' + tn(x.t) + '</td><td class="r">' + (x.hi != null ? (x.lo != null && x.lo !== x.hi ? dm(x.lo) + '–' : '') + dm(x.hi) + ' m' : '—') + '</td></tr>').join('') + '</tbody></table></div>';
        }).catch(() => { const n = root.querySelector('#lb5twn'); if (n) n.textContent = L('台灣風場名單讀取失敗（不影響作答）。', 'Taiwan\'s farm list failed to load (the questions do not need it).'); });
      }
    };

    /* ---------- 問題 ---------- */
    const mpName = tn('mp'), flName = tn('fl');
    let qs;
    if (!sh) {
      // 1. 最常見的型式：選項取座數前幾名（不含「混合」），依代碼排序
      const cand = types.filter(g => g.t !== 'mx').slice(0, 4).sort((a, b) => (a.t < b.t ? -1 : 1));
      const top1 = types.filter(g => g.t !== 'mx')[0];
      const deepT = deepest[0].t;
      const opt3 = ['gb', 'mp', 'jk', 'fl'].filter(t => byT[t] && byT[t].ds.length);
      if (!opt3.includes(deepT)) opt3.push(deepT);
      qs = [
        { id: 'a', type: 'mc', q: L('看表格：在本站已查明型式的 ' + U.int(N) + ' 座離岸風場裡，哪一種水下基礎最多？', 'Read the table: among the ' + U.int(N) + ' offshore farms with a known type, which foundation is the most common?'),
          opts: cand.map(g => g === top1 ? [tn(g.t)] : [tn(g.t), L(tn(g.t) + '只有 ' + U.int(g.n) + ' 座，比' + tn(top1.t) + '的 ' + U.int(top1.n) + ' 座少。', tn(g.t) + ' has only ' + U.int(g.n) + ', fewer than ' + tn(top1.t) + ' with ' + U.int(top1.n) + '.')]),
          a: cand.indexOf(top1), hint: L('比較表格「座數」那一欄。', 'Compare the “Farms” column.'),
          sol: '<p>' + L(tn(top1.t) + ' ' + U.int(top1.n) + ' 座最多；其次是' + types.filter(g => g !== top1).slice(0, 2).map(g => tn(g.t) + ' ' + U.int(g.n) + ' 座').join('、') + '。',
            tn(top1.t) + ' leads with ' + U.int(top1.n) + ' farms, followed by ' + types.filter(g => g !== top1).slice(0, 2).map(g => tn(g.t).toLowerCase() + ' (' + U.int(g.n) + ')').join(' and ') + '.') + '</p>' },
        { id: 'b', type: 'num', q: L(U.int(N) + ' 座風場裡，' + flName + '占幾 %？（四捨五入到整數）', 'Of the ' + U.int(N) + ' farms, what percentage are ' + flName.toLowerCase() + '? (round to a whole number)'),
          ans: pFl, unit: '%', tol: { abs: 0.51 }, hint: L(flName + '的座數 ÷ ' + U.int(N) + ' × 100。', 'Number of ' + flName.toLowerCase() + ' farms ÷ ' + U.int(N) + ' × 100.'),
          sol: U.eq(U.int(flo.n) + ' ÷ ' + U.int(N) + ' × 100 ≈ ' + f(pFl, 2) + '% ≈ ' + Math.round(pFl) + '%') +
            '<p>' + L('浮動式還不到一成，大多數離岸風場都用固定在海床上的基礎。', 'Floating farms are still under a tenth: most offshore farms stand on foundations fixed to the seabed.') + '</p>' },
        { id: 'c', type: 'mc', q: L('把滑桿往右拉。資料裡水最深的那座風場（最大水深 ' + dm(DMAX) + ' m）用哪一種基礎？', 'Drag the slider right. The farm in the deepest water (maximum depth ' + dm(DMAX) + ' m) uses which foundation?'),
          opts: opt3.map(t => t === deepT ? [tn(t)] : [tn(t), L(tn(t) + '最深的一座只到 ' + dm(byT[t].max) + ' m（' + names(byT[t].deep) + '）。', 'The deepest ' + tn(t).toLowerCase() + ' farm reaches only ' + dm(byT[t].max) + ' m (' + names(byT[t].deep) + ').')]),
          a: opt3.indexOf(deepT), hint: L('滑桿拉到最右邊附近，看哪一列還有實心的點（空心圈表示沒有超過）。', 'Move the slider near the right end and see which row still has solid dots (hollow rings are not past the line).'),
          sol: '<p>' + L('最深的是 ' + names(deepest) + '，最大水深 ' + dm(DMAX) + ' m，用' + tn(deepT) + '。固定式基礎最深的例子只到 ' + dm(FXMAX) + ' m（' + names(fxDeep) + '）。',
            'The deepest is ' + names(deepest) + ' at ' + dm(DMAX) + ' m, on a ' + tn(deepT).toLowerCase() + ' foundation. The deepest fixed foundation in the data is at only ' + dm(FXMAX) + ' m (' + names(fxDeep) + ').') + '</p>' }
      ];
    } else {
      qs = [
        { id: 'a', type: 'num', q: L('在有水深資料的' + mpName + '風場裡，最大水深最深的是幾公尺（m）？', 'Among the ' + mpName.toLowerCase() + ' farms with a depth range, what is the deepest maximum depth, in metres?'),
          ans: mp.max, unit: 'm', tol: { abs: 0.5 }, hint: L('看表格' + mpName + '那一列，或在圖上找' + mpName + '最右邊的點。', 'Look at the ' + mpName.toLowerCase() + ' row of the table, or the right-most ' + mpName.toLowerCase() + ' dot in the chart.'),
          sol: '<p>' + L(mpName + '有水深資料的 ' + mp.ds.length + ' 座裡，最深的是 ' + names(mp.deep) + '，最大水深 ' + dm(mp.max) + ' m；中位數只有 ' + dm(mp.med) + ' m。',
            'Of the ' + mp.ds.length + ' ' + mpName.toLowerCase() + ' farms with a depth range, the deepest is ' + names(mp.deep) + ' at ' + dm(mp.max) + ' m; the median is only ' + dm(mp.med) + ' m.') + '</p>' },
        { id: 'b', type: 'num', q: L('本站已查明型式的 ' + U.int(N) + ' 座離岸風場裡，用' + mpName + '的占幾 %？（算到小數第一位）', 'Of the ' + U.int(N) + ' offshore farms with a known type, what percentage use ' + mpName.toLowerCase() + 's? (one decimal)'),
          ans: pMp, unit: '%', tol: { abs: 0.1 }, hint: L('分母是全部已查明型式的座數（含沒有水深資料的）。', 'The denominator is every farm with a known type, including those without a depth range.'),
          sol: U.eq(U.int(mp.n) + ' ÷ ' + U.int(N) + ' × 100 ≈ ' + f(pMp, 2) + '% ≈ ' + f(pMp, 1) + '%') +
            '<p>' + L('注意：對照表是逐步收集的（歐洲最完整），這是「已查證風場」裡的比例，不是全球的市占。', 'Note: the table is built step by step (Europe is the most complete), so this is a share of the checked farms, not a world market share.') + '</p>' },
        { id: 'c', type: 'num', q: L('所有固定式基礎（' + flName + '以外的型式）裡，最大水深最深的是 ' + dm(FXMAX) + ' m。有幾座' + flName + '風場的最大水深比它更深（大於 ' + dm(FXMAX) + ' m）？', 'Among all fixed foundations (every type except floating), the deepest maximum depth is ' + dm(FXMAX) + ' m. How many floating farms have a maximum depth deeper than that (over ' + dm(FXMAX) + ' m)?'),
          ans: flOver.length, unit: L('座', 'farms'), tol: { abs: 0 }, hint: L('把滑桿拉到 ' + U.int(FXMAX) + ' m，看「' + flName + '」那一格有幾座；等於 ' + dm(FXMAX) + ' m 的不算。', 'Set the slider to ' + U.int(FXMAX) + ' m and read the “' + flName + '” count; farms at exactly ' + dm(FXMAX) + ' m do not count.'),
          sol: '<p>' + L(flName + '有水深資料的 ' + flo.ds.length + ' 座裡，' + flOver.length + ' 座比 ' + dm(FXMAX) + ' m 深：', 'Of the ' + flo.ds.length + ' floating farms with a depth range, ' + flOver.length + ' are deeper than ' + dm(FXMAX) + ' m: ') +
            flOver.map(x => U.esc(x.name) + ' ' + dm(x.hi) + ' m').join(SEP) + L('。其餘 ' + flNotOver + ' 座在 ' + dm(FXMAX) + ' m 以內。', '. The other ' + flNotOver + ' are at ' + dm(FXMAX) + ' m or less.') + '</p>' },
        { id: 'd', type: 'mc', q: L('根據這份資料，下面哪一句說法最有根據？', 'Which statement does this data support best?'),
          opts: [
            [L(flName + '比較便宜，所以大多數離岸風場都用' + flName, 'Floating is cheaper, so most offshore farms are floating'), L('資料沒有成本；而且' + flName + '只有 ' + U.int(flo.n) + ' / ' + U.int(N) + ' 座，是少數。', 'The data has no costs, and floating farms are only ' + U.int(flo.n) + ' of ' + U.int(N) + ', a minority.')],
            [L('固定式基礎最深的例子是 ' + dm(FXMAX) + ' m；比這更深的風場在資料裡全都是' + flName + '，所以更深的海域目前只看到浮動式', 'The deepest fixed foundation is at ' + dm(FXMAX) + ' m; every farm deeper than that in the data is floating, so in deeper water only floating designs appear so far')],
            [L(flName + '只用在比所有固定式都深的水裡', 'Floating is used only in water deeper than every fixed foundation'), L('不對：最淺的' + flName + '（' + U.esc(flMin.name) + '）最大水深只有 ' + dm(flMin.hi) + ' m；' + flName + '共有 ' + flNotOver + ' 座沒有超過 ' + dm(FXMAX) + ' m。', 'No: the shallowest floating farm (' + U.esc(flMin.name) + ') reaches only ' + dm(flMin.hi) + ' m, and ' + flNotOver + ' floating farms are no deeper than ' + dm(FXMAX) + ' m.')],
            [L('固定式和' + flName + '通常用在差不多深的水裡', 'Fixed and floating foundations are usually used in about the same depth'), L('中位數差很多：固定式 ' + dm(fxMed) + ' m，' + flName + ' ' + dm(flo.med) + ' m。', 'The medians differ a lot: ' + dm(fxMed) + ' m for fixed, ' + dm(flo.med) + ' m for floating.')]
          ],
          a: 1, hint: L('把滑桿拉到 ' + U.int(FXMAX) + ' m，看還剩哪些型式；再看最淺的' + flName + '在哪裡。', 'Set the slider to ' + U.int(FXMAX) + ' m and see which types remain; then find the shallowest floating farm.'),
          sol: '<p>' + L('固定式最深到 ' + dm(FXMAX) + ' m（' + names(fxDeep) + '），超過它的 ' + flOver.length + ' 座全是' + flName + '，最深到 ' + dm(DMAX) + ' m。但' + flName + '也有用在較淺水域的（最淺 ' + dm(flMin.hi) + ' m），所以水深是重要的理由，卻不是唯一的理由；資料也沒有成本，不能說哪一種比較便宜。',
            'Fixed foundations reach ' + dm(FXMAX) + ' m at most (' + names(fxDeep) + '); all ' + flOver.length + ' farms beyond that are floating, down to ' + dm(DMAX) + ' m. But floating is also used in shallower water (from ' + dm(flMin.hi) + ' m), so depth is an important reason but not the only one, and with no costs in the data we cannot say which is cheaper.') + '</p>' }
      ];
    }

    /* ---------- 解說 ---------- */
    const ord = types.filter(g => g.ds.length >= 3).sort((a, b) => a.med - b.med);
    const subc = {}; flo.ds.concat(rows.filter(x => x.t === 'fl' && x.hi == null)).forEach(x => { if (x.s && SUB[x.s]) subc[x.s] = (subc[x.s] || 0) + 1; });
    const subTxt = Object.keys(subc).sort((a, b) => subc[b] - subc[a]).map(k => L(SUB[k][0] + ' ' + subc[k], SUB[k][1] + ' ' + subc[k])).join(SEP);
    const explain = '<p>' + L('依「最大水深」的中位數由淺到深排（至少 3 座有水深的型式）：', 'Ordered by the median maximum depth, shallow to deep (types with at least 3 farms with a depth): ') +
      ord.map(g => tn(g.t) + ' ' + dm(g.med) + ' m').join(' → ') + L('。', '.') + '</p>' +
      '<p>' + L('固定式基礎在資料裡最深到 ' + dm(FXMAX) + ' m；比這更深的 ' + flOver.length + ' 座全是' + flName + '，最深到 ' + dm(DMAX) + ' m（' + names(deepest) + '）。',
        'In the data, fixed foundations go down to ' + dm(FXMAX) + ' m; all ' + flOver.length + ' farms deeper than that are floating, down to ' + dm(DMAX) + ' m (' + names(deepest) + ').') +
      (subTxt ? L(flName + '又分好幾種浮台：' + subTxt + '。', ' Floating platforms come in several kinds: ' + subTxt + '.') : '') + '</p>' +
      '<p>' + L('水深不是唯一的條件：海床地質、風機大小和施工船隊也會影響選擇，所以同樣的水深可能用不同的基礎。這份對照表還在逐步收集，數字會隨查證增加而改變。',
        'Depth is not the only factor: seabed geology, turbine size and the installation fleet matter too, so the same depth can get different foundations. The table is still being collected, so the figures will change as more farms are checked.') + '</p>';

    const fdDoc = 'https://github.com/dofliu/windfarmTaiwan/blob/main/docs/foundations' + (U.EN() ? '.en' : '') + '.md';
    return {
      intro, tool, qs, explain,
      verify: [
        { href: '#/global?layer=fd', label: ['地球儀「離岸：水下基礎」圖層（依型式上色）', 'Globe: the “Offshore: foundations” layer (coloured by type)'] },
        { href: '#/global?layer=fd&fdg=fl', label: ['地球儀：只看浮動式的風場', 'Globe: floating farms only'] },
        { href: '#/global?f=' + encodeURIComponent(deepest[0].name), label: ['地球儀：' + deepest[0].name + ' 的風場卡片（水深與基礎剖面）', 'Globe: the ' + deepest[0].name + ' card (depth and foundation profile)'] },
        { href: '#/learn/offshore', label: ['風電知識第 6 章「走向大海：離岸風電」', 'Learn, chapter 6: “Going offshore”'] },
        { href: '#/learn/foundations', label: ['風電知識第 7 章「站在海上：水下基礎型式」', 'Learn, chapter 7: “Standing in the sea: foundation types”'] },
        { href: '#/learn/floating', label: ['風電知識第 8 章「浮動式風電」', 'Learn, chapter 8: “Floating wind”'] }
      ],
      sources: [{ label: L('本站水下基礎逐場對照（', 'The site\'s foundation table (') + asof + L('，每座的出處在風場卡片）', '; each farm\'s sources are on its card)'), url: fdDoc }]
        .concat(OSP && OSP.url ? [{ label: OSP.title + (OSP.licence ? ' (' + OSP.licence + ')' : ''), url: OSP.url }] : [])
        .concat([{ label: L('台灣離岸容量：本站國家統計（能源署《能源統計手冊》表 3-6，見風電知識「資料來源與方法」）', 'Taiwan offshore capacity: the site\'s national figures (Energy Administration handbook, Table 3-6; see Learn, “Sources and methods”)'), url: '#/learn/sources' }])
    };
  }
});
})();
/* 第 6 關 · 台灣此刻：台電即時資料（live.js 的 WW.live）的全台風電出力、可用率與換算。
   數字在第一次打開這一關時「凍結」成一份快照（SNAP）：題目、工具與解法都用同一份；作答後重畫或切換語言也不變。
   有更新的台電資料時：還沒作答就自動換成新的，作答過就顯示按鈕讓學生自己決定（換資料會清掉這一關的作答）。
   即時值是某一個資料時間的瞬間值，不是官方年發電量；家戶換算沿用台灣即時頁的假設（每戶平均 0.5 kW）。
   Level 6 · Taiwan right now: a frozen snapshot of WW.live (instantaneous values only, never yearly generation). */
(function () {
'use strict';
const SRC = [
  { label: '台灣電力公司各機組發電量即時資訊 · Taipower unit generation, live (data.gov.tw 8931)', url: 'https://data.gov.tw/dataset/8931' }
];
let SNAP = null, hooked = false, histN = -1;
const r1 = x => Math.round(x * 10) / 10;
/* 顯示用的小數位數（最多 3 位、至少 1 位）· decimals needed to show a value exactly (1–3) */
const dpOf = x => { const m = /\.(\d+)$/.exec(String(x)); return Math.max(1, Math.min(3, m ? m[1].length : 0)); };

/* 快照 · freeze the numbers on screen */
function capture(LV) {
  const tt = LV.totals(), iv = LV.impactVals(), live = LV.isLive();
  const hh = iv.homes > 0 ? tt.total * 1000 / (iv.homes * 1e4) : null;          // 每戶 kW：由網站的換算反推，不另寫一次 · kW per home, read back from the site's own conversion
  return {
    live, snap: !!(live && WW.standalone && WW.standalone.usedSnapshot), t: LV.srcTime(),
    T: r1(tt.total), C: r1(tt.cap), CO: r1(tt.capOut), TO: r1(tt.testOut), pending: tt.pending,
    gen: LV.FARMS.filter(f => (LV.RT[f.id] || 0) >= 0.05).length, nF: LV.FARMS.length,
    hh: hh ? Math.round(hh * 1000) / 1000 : null,
    sys: iv.share > 0 ? r1(tt.total / (iv.share / 100)) : null,
    tp: null                                                                      // 台電自己的風電總計（由同一資料時間的趨勢取樣讀出）· Taipower's own wind total, from the history sample at the same data time
  };
}
const newer = LV => !!SNAP && LV.isLive() && (!SNAP.live || LV.srcTime() !== SNAP.t);
const touched = st => !!st && (Object.keys(st.ok).length > 0 || Object.keys(st.tries).length > 0);
const anyTouched = () => { const Q = WW.lab.api().QS; return touched(Q['jh:6']) || touched(Q['sh:6']); };
/* 台電資料時間是台灣時間（沒有時區）· Taipower's data time is Taiwan time without a zone */
const tFull = (LV, t) => { const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(t || ''); return m ? m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] : LV.fmtSrc(t); };
const tMs = t => { const d = new Date(String(t || '').slice(0, 19) + '+08:00'); return isNaN(d) ? null : +d; };

function rerender(reset) {
  SNAP = null;
  WW.lab.rebuild(6, reset);
}
function banner(LV) {
  const el = document.getElementById('lb6upd'); if (!el || !newer(LV)) return;
  const L = WW.L;
  el.hidden = false;
  el.innerHTML = '<p>' + L('台電有更新的資料了（資料時間 ' + tFull(LV, LV.srcTime()) + '）。題目還是用上面凍結的那一刻；換成新資料會清掉這一關已作答的題目。',
    'Newer Taipower data has arrived (data time ' + tFull(LV, LV.srcTime()) + '). The questions still use the moment frozen above; switching to the new data clears your answers on this level.') +
    '</p><button type="button" class="btn sm" id="lb6new">' + L('換成新資料', 'Use the new data') + '</button>';
  el.querySelector('#lb6new').onclick = () => rerender(true);
}

/* 台電清單裡有本站還沒對應的機組時，台電的風電總計會比本站加總大 · Taipower's total includes units the site has not mapped yet */
function tpNote(LV, U) {
  const el = document.getElementById('lb6tp'); if (!el || !SNAP || !SNAP.live) return;
  if (SNAP.tp == null) {
    const p = ((LV.hist() || {}).points || []).find(x => x && x.t === SNAP.t && typeof x.total === 'number');
    if (p) SNAP.tp = r1(p.total);
  }
  if (SNAP.tp == null || Math.abs(SNAP.tp - SNAP.T) <= 0.5) { el.hidden = true; return; }
  const { L, f } = U, d = SNAP.tp - SNAP.T;
  el.hidden = false;
  el.innerHTML = d > 0
    ? L('台電資料同一刻的風電總計是 ' + f(SNAP.tp, 1) + ' MW，比本站加總多 ' + f(d, 1) + ' MW：台電清單裡有本站還沒對應到的新機組。這一關和台灣即時頁都只加總本站對應到的 ' + SNAP.nF + ' 個機組。',
      'Taipower\'s own wind total at the same moment is ' + f(SNAP.tp, 1) + ' MW, ' + f(d, 1) + ' MW more than the site\'s sum: Taipower\'s list has new units the site has not mapped yet. This level and the Taiwan live page add up only the ' + SNAP.nF + ' units the site maps.')
    : L('台電資料同一刻的風電總計是 ' + f(SNAP.tp, 1) + ' MW，和本站加總的 ' + f(SNAP.T, 1) + ' MW 不同；這一關用本站加總。', 'Taipower\'s own wind total at the same moment is ' + f(SNAP.tp, 1) + ' MW, which differs from the site\'s sum of ' + f(SNAP.T, 1) + ' MW; this level uses the site\'s sum.');
}

/* 趨勢圖：最近 7 天的取樣 · the last seven days of samples */
function histSVG(LV, U, cw) {
  const { L, f } = U;
  const all = ((LV.hist() || {}).points || []).filter(p => p && typeof p.total === 'number' && tMs(p.t) != null);
  /* 只用有逐機組數字的取樣：沒有 farms 的那筆無法核對（例：2026-11-13 有一筆 8,374 MW、遠超過裝置容量）· only samples with a per-unit breakdown */
  /* 每筆用同一組機組（FARMS）的加總，與 totals() 一致 · each sample summed over the same units as totals() */
  const ids = LV.FARMS.map(x => x.id);
  const pts = all.filter(p => p.farms && Object.keys(p.farms).length > 0).map(p => ({ t: p.t, total: ids.reduce((s, k) => s + (+p.farms[k] || 0), 0) }));
  if (pts.length < 6) return '';
  const last = tMs(pts[pts.length - 1].t), wk = pts.filter(p => last - tMs(p.t) <= 7 * 864e5);
  if (wk.length < 6) return '';
  const drop = all.filter(p => !(p.farms && Object.keys(p.farms).length > 0) && last - tMs(p.t) <= 7 * 864e5 && tMs(p.t) >= tMs(wk[0].t)).length;
  const t0 = tMs(wk[0].t), t1 = last, mx = Math.max(...wk.map(p => p.total), SNAP ? SNAP.T : 0), mn = Math.min(...wk.map(p => p.total));
  const avg = wk.reduce((s, p) => s + p.total, 0) / wk.length;
  const gaps = wk.slice(1).map((p, i) => (tMs(p.t) - tMs(wk[i].t)) / 6e4).sort((a, b) => a - b);
  const gMed = gaps[Math.floor(gaps.length / 2)], gMin = gaps[0], gMax = gaps[gaps.length - 1];
  /* 手機寬度：窄一點的畫布、大一點的字，畫出來約 11 px · on a phone: a narrower canvas and larger text, about 11 px on screen */
  const narrow = cw > 0 && cw < 460, fs = narrow ? 'font-size:13px;' : '', ts = narrow ? ' style="font-size:13px"' : '';
  const W = narrow ? 380 : 520, H = narrow ? 220 : 230, ml = 48, mr = 12, mt = 24, mb = 30, iw = W - ml - mr, ih = H - mt - mb;
  const step = mx > 4000 ? 1000 : mx > 1500 ? 500 : mx > 600 ? 200 : 100, top = Math.ceil(mx * 1.05 / step) * step;
  const X = t => ml + (t - t0) / Math.max(1, t1 - t0) * iw, Y = v => mt + ih - v / top * ih;
  let g = '';
  for (let v = 0; v <= top; v += step) g += '<line class="gr" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="' + (ml - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end"' + ts + '>' + U.int(v) + '</text>';
  const d0 = new Date(t0 + 8 * 36e5); d0.setUTCHours(0, 0, 0, 0);                       // 台灣時間午夜 · Taiwan midnights
  for (let t = +d0 - 8 * 36e5 + 864e5; t <= t1; t += 864e5) {
    const dd = new Date(t + 8 * 36e5), x = X(t).toFixed(1);
    g += '<line class="gr" x1="' + x + '" x2="' + x + '" y1="' + mt + '" y2="' + (mt + ih) + '"/><text x="' + x + '" y="' + (H - 10) + '" text-anchor="middle"' + ts + '>' + (dd.getUTCMonth() + 1) + '/' + dd.getUTCDate() + '</text>';
  }
  const path = wk.map((p, i) => (i ? 'L' : 'M') + X(tMs(p.t)).toFixed(1) + ' ' + Y(p.total).toFixed(1)).join('');
  const ya = Y(avg).toFixed(1);
  let dot = '';
  const tq = SNAP && SNAP.live ? tMs(SNAP.t) : null;
  if (tq != null && tq >= t0 && tq <= t1) {
    const x = X(tq), y = Y(SNAP.T), right = x > W - 140;
    dot = '<circle class="hi" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" stroke="var(--surface-1)" stroke-width="1.5"/>' +
      '<text x="' + (right ? x - 9 : x + 9).toFixed(1) + '" y="' + (Math.max(mt + 10, y - 8)).toFixed(1) + '" text-anchor="' + (right ? 'end' : 'start') + '" style="' + fs + 'fill:var(--ink);font-weight:700;paint-order:stroke;stroke:var(--surface-1);stroke-width:4px;stroke-linejoin:round">' + L('題目這一刻 ', 'This level\'s moment ') + f(SNAP.T, 0) + ' MW</text>';
  }
  const tl = d => { const x = new Date(d + 8 * 36e5); return (x.getUTCMonth() + 1) + '/' + x.getUTCDate() + ' ' + String(x.getUTCHours()).padStart(2, '0') + ':' + String(x.getUTCMinutes()).padStart(2, '0'); };
  const aria = L('折線圖：全台風電出力取樣，' + tl(t0) + ' 到 ' + tl(t1) + '（' + wk.length + ' 筆），最低 ' + U.int(mn) + ' MW、最高 ' + U.int(mx) + ' MW、各筆平均約 ' + U.int(avg) + ' MW' + (dot ? '；題目用的這一刻是 ' + f(SNAP.T, 1) + ' MW' : '') + '。',
    'Line chart of sampled Taiwan wind output from ' + tl(t0) + ' to ' + tl(t1) + ' (' + wk.length + ' samples): lowest ' + U.int(mn) + ' MW, highest ' + U.int(mx) + ' MW, sample average about ' + U.int(avg) + ' MW' + (dot ? '; the moment used in the questions is ' + f(SNAP.T, 1) + ' MW' : '') + '.');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + U.esc(aria) + '">' + g +
    '<line class="ax" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + (mt + ih) + '" y2="' + (mt + ih) + '"/>' +
    '<text x="' + (ml - 6) + '" y="' + (mt - 12) + '" text-anchor="end"' + ts + '>MW</text>' +
    '<path class="on" d="' + path + '"/>' +
    '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + ya + '" y2="' + ya + '" style="stroke:var(--ink-2);stroke-width:1.5;stroke-dasharray:6 5"/>' +
    '<text x="' + (ml + 6) + '" y="' + (+ya - 6) + '" style="' + fs + 'fill:var(--ink-2);font-weight:700;paint-order:stroke;stroke:var(--surface-1);stroke-width:4px;stroke-linejoin:round">' + L('取樣平均 ', 'Sample average ') + U.int(avg) + ' MW</text>' + dot + '</svg>' +
    '<p class="note">' + L('趨勢是取樣：本站排程定時記下台電即時資料的各機組出力，這 7 天的取樣間隔中位數約 ' + U.int(gMed) + ' 分鐘（' + U.int(gMin) + '–' + U.int(gMax) + ' 分鐘不等）。每筆加總和上面同一組 ' + ids.length + ' 個機組，各筆直接平均、沒有依間隔加權。是瞬間值的取樣，不是官方發電量。' + (drop ? '圖中略去 ' + drop + ' 筆沒有逐機組數字、無法核對的取樣。' : ''),
      'The trend is sampled: the site\'s schedule records each unit\'s output from Taipower\'s live data; over these seven days the median gap between samples is about ' + U.int(gMed) + ' minutes (' + U.int(gMin) + '–' + U.int(gMax) + ' minutes). Each sample adds up the same ' + ids.length + ' units as above, and the average is a plain mean of the samples. These are instantaneous samples, not official generation.' + (drop ? ' ' + drop + ' sample(s) without a per-unit breakdown, which cannot be checked, are left out.' : '')) + '</p>';
}
function drawHist(LV, U) {
  const el = document.getElementById('lb6hist'); if (!el) return;
  const n = ((LV.hist() || {}).points || []).length;
  if (n === histN && el.innerHTML) return;
  histN = n; el.innerHTML = histSVG(LV, U, el.clientWidth || 0);
  tpNote(LV, U);
}

WW.lab.add({
  n: 6, id: 'now',
  title: ['台灣此刻', 'Taiwan right now'],
  hook: ['全台的風機此刻發出多少電？這個數字能代表一整年嗎？', 'How much power are Taiwan\'s turbines making right now — and does that number say anything about a whole year?'],
  need: ['live'],
  build({ lv, sh, U }) {
    const { L, f, esc } = U;
    const LV = WW.live;
    if (!LV) throw new Error('WW.live missing');
    const untouchedNow = !anyTouched();
    if (!SNAP || (untouchedNow && newer(LV))) SNAP = capture(LV);
    const S = SNAP;
    const ratio = S.C > 0 ? S.CO / S.C * 100 : 0;
    const when = S.live ? tFull(LV, S.t) : '';
    const mode = S.snap ? L('離線快照：單檔版建置時儲存的台電資料', 'Offline snapshot saved in this single-file copy')
      : S.live ? L('台電即時資料（本站約每 30 分鐘更新）', 'Taipower live data (refreshed on this site about every 30 minutes)')
      : L('模擬資料：暫時拿不到台電資料，數字只供練習', 'Simulated: Taipower data is unavailable for now, so the figures are for practice only');
    const age = S.live && !S.snap && tMs(S.t) ? (Date.now() - tMs(S.t)) / 36e5 : 0;
    if (!hooked) {
      hooked = true;
      LV.onUpdate(() => {
        if (WW.currentPage() !== 'lab') return;
        const c = WW.lab.api().cur(); if (!c || c.n !== 6) return;
        drawHist(LV, WW.lab.api().U);
        if (!newer(LV)) return;
        if (!SNAP.live && !anyTouched()) rerender(false); else banner(LV);
      });
    }

    const intro = '<p class="lbbig"><b>' + (S.live ? L('資料時間：', 'Data time: ') + esc(when) + L('（台灣時間）', ' (Taiwan time)') : esc(mode)) + '</b></p>' +
      (S.live ? '<p class="note">' + esc(mode) + (age > 2 ? L('。這份資料距現在約 ' + U.int(age) + ' 小時，這一關的數字以上面的資料時間為準。', '. This data is about ' + U.int(age) + ' hours old; the figures on this level belong to the data time above.') : '') + '</p>' : '') +
      '<p>' + L('台電每 10 分鐘公布一次各機組「這一刻」的發電功率。台灣即時頁把本站對應到的 ' + S.nF + ' 個風力機組（併網點）加起來，就是全台風電此刻的出力，單位是 MW（百萬瓦）。功率是「這一刻每秒送出多少能量」，持續一段時間才累積成電能：',
        'Taipower publishes every unit\'s output at "this moment" every 10 minutes. The Taiwan live page adds up the ' + S.nF + ' wind units (grid connection points) the site maps to give the country\'s wind output right now, in MW (megawatts). Power is how fast energy is delivered at this moment; it builds up into energy only over time:') + '</p>' +
      U.eq(L('電能（MWh）＝ 功率（MW）× 時間（小時）　1 MWh ＝ 1,000 度（kWh）', 'energy (MWh) = power (MW) × time (hours)　1 MWh = 1,000 kWh')) +
      '<p>' + L('這一關的數字在你打開時就固定下來，題目、工具和解法都用同一刻的資料。它們都是<b>瞬間值</b>，不是官方的年發電量。',
        'The figures on this level were frozen when you opened it, so the questions, the tool and the solutions all use the same moment. They are <b>instantaneous values</b>, not official yearly generation.') + '</p>';

    const fm = { h: x => x + ' h' };
    const st = { h: 3 };
    const barAria = L('出力與裝置容量的比較：有列容量的機組此刻出力 ' + f(S.CO, 1) + ' MW，裝置容量 ' + f(S.C, 1) + ' MW',
      'Output compared with capacity: units with a listed capacity are producing ' + f(S.CO, 1) + ' MW of their ' + f(S.C, 1) + ' MW capacity');
    const tool = {
      html: '<div id="lb6upd" class="note" hidden></div>' +
        '<div>' + U.chip(L('全台風電此刻', 'Taiwan wind now'), f(S.T, 1) + ' MW') + U.chip(L('裝置容量（台電列出）', 'Capacity (listed by Taipower)'), f(S.C, 1) + ' MW') +
          U.chip(L('有列容量的機組出力', 'Output of listed units'), f(S.CO, 1) + ' MW') +
          U.chip(L('此刻在發電的機組', 'Units generating now'), S.gen + ' / ' + S.nF) + (S.sys ? U.chip(L('全國即時淨發電', 'National net generation now'), f(S.sys, 1) + ' MW') : '') + '</div>' +
        '<div role="img" aria-label="' + esc(barAria) + '" style="margin:10px 0 4px;max-width:560px">' +
          '<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-3)"><span>0 MW</span><span>' + L('裝置容量 ', 'Capacity ') + f(S.C, 0) + ' MW</span></div>' +
          '<div style="height:16px;border-radius:8px;background:var(--surface-3);border:1px solid var(--line-2);overflow:hidden"><i style="display:block;height:100%;width:' + Math.min(100, ratio).toFixed(1) + '%;background:var(--live)"></i></div>' +
          '<div style="font-size:13px;color:var(--ink-2);margin-top:3px">' + L('長條的填色＝有列容量的機組此刻出力', 'The filled part = output of the units with a listed capacity') + '</div></div>' +
        '<p class="note" id="lb6tp" hidden></p>' +
        (S.TO > 0 || S.pending > 0 ? '<p class="note">' + L('其中 ' + f(S.TO, 1) + ' MW 來自 ' + S.pending + ' 個試運轉機組：台電還沒列它們的裝置容量（註 10），所以算可用率時只用有列容量的機組，免得超過 100%。',
          S.pending + ' unit(s) in trial operation add ' + f(S.TO, 1) + ' MW: Taipower lists no capacity for them yet (note 10), so availability counts only units with a listed capacity, which keeps it under 100%.') + '</p>' : '') +
        '<div class="lbgridt" style="margin-top:10px"><div>' + U.slider('h', L('如果一直維持這個出力', 'If this output held for'), 1, 12, 1, st.h, fm.h) + '</div><div id="lb6out"></div></div>' +
        '<p class="note">' + L('簡化：假設出力在這段時間完全不變。真實的風一直在變，看下面最近 7 天的趨勢就知道。', 'Simplification: the output is assumed not to change at all. Real wind keeps changing, as the last seven days below show.') + '</p>' +
        '<div class="lbplot" id="lb6hist" style="max-width:680px"></div>',
      mount(root) {
        const out = root.querySelector('#lb6out');
        const draw = () => {
          const e = S.T * st.h;
          out.innerHTML = U.chip(L('電能', 'Energy'), f(e, 1) + ' MWh') +
            U.eq(f(S.T, 1) + ' MW × ' + st.h + ' h = ' + f(e, 1) + ' MWh');
        };
        U.bind(root, st, fm, draw); draw();
        histN = -1; drawHist(LV, U);
        banner(LV);
      }
    };

    let qs;
    if (!sh) {
      qs = [
        { id: 'a', type: 'num', q: L('如果此刻的出力 ' + f(S.T, 1) + ' MW 維持 1 小時不變，會發出多少度電（kWh）？（1 MWh = 1,000 度，寫整數）',
            'If this moment\'s output of ' + f(S.T, 1) + ' MW held steady for 1 hour, how many kWh would it generate? (1 MWh = 1,000 kWh; whole number)'),
          ans: S.T * 1000, shown: U.int(S.T * 1000), unit: L('度', 'kWh'), tol: { abs: 1 }, hint: L('MW × 小時 = MWh，再乘 1,000 換成度。', 'MW × hours = MWh, then × 1,000 for kWh.'),
          sol: U.eq(f(S.T, 1) + ' MW × 1 h = ' + f(S.T, 1) + ' MWh') + U.eq(f(S.T, 1) + ' MWh × 1,000 = ' + U.int(S.T * 1000) + L(' 度', ' kWh')) },
        { id: 'b', type: 'num', q: L('有列裝置容量的機組此刻共發出 ' + f(S.CO, 1) + ' MW，它們的裝置容量合計 ' + f(S.C, 1) + ' MW。此刻用到了裝置容量的百分之幾？（算到小數第一位）',
            'The units with a listed capacity are producing ' + f(S.CO, 1) + ' MW, and their capacity adds up to ' + f(S.C, 1) + ' MW. What percentage of the capacity is running now? (one decimal)'),
          ans: ratio, shown: f(ratio, 1), unit: '%', tol: { abs: 0.06 }, hint: L('出力 ÷ 裝置容量 × 100%。', 'Output ÷ capacity × 100%.'),
          sol: U.eq(f(S.CO, 1) + ' ÷ ' + f(S.C, 1) + ' × 100% ≈ ' + f(ratio, 2) + '%') + '<p>' + L('這就是台灣即時頁的「整體可用率」（出力 ÷ 列出的裝置容量）。', 'This is the "Overall availability" figure on the Taiwan live page (output ÷ listed capacity).') + '</p>' },
        { id: 'c', type: 'mc', q: S.live ? L('台灣即時頁把台電各機組的資料加總，寫著全台風電「' + f(S.T, 1) + ' MW」。這個數字是什麼意思？', 'The Taiwan live page, adding up Taipower\'s units, shows Taiwan\'s wind output as "' + f(S.T, 1) + ' MW". What does this number mean?')
            : L('模擬資料寫全台風電「' + f(S.T, 1) + ' MW」。這個數字是什麼意思？', 'The simulated data shows Taiwan\'s wind output as "' + f(S.T, 1) + ' MW". What does this number mean?'),
          opts: [[L('台灣的風機今年一整年發的電', 'All the electricity Taiwan\'s turbines made this year'), L('一整年的電要用 MWh 或度計算，而且要把每一刻加起來；MW 只是某一刻的功率。', 'A year\'s electricity is counted in MWh or kWh and adds up every moment; MW is the power at one moment.')],
            [L('資料時間那一刻，全台風機一起發電的功率，風一變就跟著變', 'The power all of Taiwan\'s turbines were producing at the data time; it changes as the wind changes')],
            [L('全台風機最多能發出的功率', 'The most Taiwan\'s turbines can produce'), S.pending > 0 ? L('那是裝置容量（台電列出 ' + f(S.C, 1) + ' MW，另有 ' + S.pending + ' 個試運轉機組未列）；此刻只用到列出容量的 ' + f(ratio, 1) + '%。', 'That is the capacity (' + f(S.C, 1) + ' MW listed, plus ' + S.pending + ' trial unit(s) without a listed capacity); only ' + f(ratio, 1) + '% of the listed capacity is running now.')
              : L('那是裝置容量（' + f(S.C, 1) + ' MW）；此刻只用到其中 ' + f(ratio, 1) + '%。', 'That is the capacity (' + f(S.C, 1) + ' MW); only ' + f(ratio, 1) + '% of it is running now.')],
            [L('今天一整天的平均出力', 'The average output over today'), L('它是一個資料時間的瞬間值，不是平均；看工具裡的趨勢圖，一天之內變化很大。', 'It is the value at one data time, not an average; the trend chart in the tool shows how much it changes within a day.')]],
          a: 1, hint: L('看單位：MW 是功率，MWh 才是電能。', 'Look at the unit: MW is power; MWh is energy.'),
          sol: '<p>' + L('MW 是功率：' + (when ? '資料時間 ' + when + ' 那一刻' : '某一刻') + '全台風機每秒送出的能量。要知道一段時間發了多少電，得把每一刻的功率乘上時間再加起來（MWh）。',
            'MW is power: how fast Taiwan\'s turbines were delivering energy ' + (when ? 'at the data time ' + when : 'at one moment') + '. To know how much electricity was made over a period, multiply each moment\'s power by its time and add them up (MWh).') + '</p>' }
      ];
    } else {
      const e24 = S.T * 24;
      qs = [
        { id: 'a', type: 'num', q: L('如果此刻的出力 ' + f(S.T, 1) + ' MW 整整維持 24 小時，會發出多少 MWh？（寫整數）', 'If this moment\'s ' + f(S.T, 1) + ' MW held for a full 24 hours, how many MWh would that be? (whole number)'),
          ans: e24, shown: U.int(e24), unit: 'MWh', tol: { abs: 1 }, hint: L('功率 × 時間。', 'Power × time.'),
          sol: U.eq(f(S.T, 1) + ' MW × 24 h = ' + f(e24, 1) + ' MWh') + '<p>' + L('也就是約 ' + f(e24 / 1000, 1) + ' GWh（' + f(e24 / 10, 1) + ' 萬度）。但風不會整天不變，所以這只是「如果」。',
            'That is about ' + f(e24 / 1000, 1) + ' GWh (' + U.int(e24 * 1000) + ' kWh). But the wind does not stay the same all day, so this is only a "what if".') + '</p>' }
      ];
      if (S.hh) {
        const zh = !U.EN(), homes = S.T * 1000 / S.hh, ans = zh ? homes / 1e4 : homes / 1e3, hd = dpOf(S.hh);
        qs.push({ id: 'b', type: 'num', q: L('台灣即時頁換算「可同時供應的家庭用電」時，假設每戶平均用電功率 ' + f(S.hh, hd) + ' kW（台電 2025 年住宅每戶平均月用電：非夏月 308 度、夏月 418 度）。此刻 ' + f(S.T, 1) + ' MW 約可同時供應多少萬戶？（寫整數）',
            'To convert output into "homes powered at once", the Taiwan live page assumes an average of ' + f(S.hh, hd) + ' kW per home (Taipower 2025: the average home used 308 kWh a month outside summer and 418 kWh in summer). About how many thousand homes could ' + f(S.T, 1) + ' MW supply at once? (whole number of thousands)'),
          ans, shown: f(ans, 0), unit: L('萬戶', 'thousand homes'), tol: { abs: 0.6 }, hint: L('先把 MW 換成 kW（× 1,000），除以每戶 kW，再除以 10,000。', 'Turn MW into kW (× 1,000), divide by the kW per home, then by 1,000.'),
          sol: U.eq(f(S.T, 1) + ' MW × 1,000 = ' + U.int(S.T * 1000) + ' kW') + U.eq(U.int(S.T * 1000) + ' ÷ ' + f(S.hh, hd) + ' ≈ ' + U.int(homes) + L(' 戶 ≈ ' + f(homes / 1e4, 1) + ' 萬戶', ' homes ≈ ' + f(homes / 1e3, 1) + ' thousand')) +
            '<p>' + L('檢查假設：308–418 度 ÷ 一個月約 730 小時 ≈ ' + f(308 / 730, 2) + '–' + f(418 / 730, 2) + ' kW，取 ' + f(S.hh, hd) + ' kW 是約略值。這是換算估算，不代表風電真的只供給家庭。',
              'Check the assumption: 308–418 kWh ÷ about 730 hours a month ≈ ' + f(308 / 730, 2) + '–' + f(418 / 730, 2) + ' kW, so ' + f(S.hh, hd) + ' kW is a round figure. It is a conversion, not a claim that wind power goes only to homes.') + '</p>' });
      }
      qs.push({ id: 'c', type: 'mc', q: L('此刻的可用率是 ' + f(ratio, 1) + '%。第 3 關的「容量因數」是一整年的實際發電量 ÷（裝置容量 × 當年時數）。下面哪一句正確？',
          'The share of capacity running now is ' + f(ratio, 1) + '%. Level 3\'s capacity factor is a year\'s actual generation ÷ (capacity × hours in the year). Which statement is right?'),
        opts: [[L('此刻的 ' + f(ratio, 1) + '% 就是台灣風電今年的容量因數', 'This moment\'s ' + f(ratio, 1) + '% is Taiwan wind\'s capacity factor this year'), L('它只是一個資料時間的瞬間值；容量因數要用整年每一刻累積起來的發電量。', 'It is the value at one data time; a capacity factor needs the energy accumulated over every moment of the year.')],
          [L('容量因數一定比任何一刻的比例都高', 'The capacity factor is always higher than the share at any moment'), L('不一定：風大的時刻瞬間比例高於年平均，風小的時候低於年平均。', 'Not so: in strong wind the share at that moment is above the yearly average, in light wind below it.')],
          [L('瞬間比例只代表這一刻；容量因數是把風大、風小、沒風的所有時刻平均起來，所以一定要用整年的發電量算', 'The instantaneous share describes only this moment; the capacity factor averages every windy, calm and still moment, so it must come from a whole year\'s generation')],
          [L('把此刻的出力乘上 8,760 小時，就是今年的年發電量', 'This moment\'s output × 8,760 hours is this year\'s generation'), L('這假設整年都和這一刻一樣；看趨勢圖的起伏，單一時刻放大到一整年會差很多。', 'That assumes every hour is like this one; the ups and downs in the trend chart show how far off one moment scaled to a year can be.')]],
        a: 2, hint: L('想想趨勢圖：同一個星期裡，出力有高有低。', 'Think of the trend chart: within a single week the output goes up and down.'),
        sol: '<p>' + L('瞬間值像是「此刻的車速」，容量因數像是「整趟路程的平均速度」。一年的容量因數要用整年的實測發電量算（第 3 關用的是台電官方數字），不能用任何一刻的即時值推算。',
          'An instantaneous value is like a car\'s speed right now; the capacity factor is like the average speed over the whole trip. A yearly capacity factor comes from a whole year\'s measured generation (Level 3 uses Taipower\'s official figures), never from one live reading.') + '</p>' });
      if (S.sys) {
        const sh2 = S.T / S.sys * 100;
        qs.push({ id: 'd', type: 'num', q: L('同一個資料時間，台電即時資料的全國淨發電量是 ' + f(S.sys, 1) + ' MW。台灣即時頁加總的風電 ' + f(S.T, 1) + ' MW 占全國此刻發電的百分之幾？（算到小數第一位）',
            'At the same data time, Taipower\'s live data puts national net generation at ' + f(S.sys, 1) + ' MW. What percentage of it is the ' + f(S.T, 1) + ' MW of wind summed on the Taiwan live page? (one decimal)'),
          ans: sh2, shown: f(sh2, 1), unit: '%', tol: { abs: 0.06 }, hint: L('風電 ÷ 全國 × 100%。', 'Wind ÷ national total × 100%.'),
          sol: U.eq(f(S.T, 1) + ' ÷ ' + f(S.sys, 1) + ' × 100% ≈ ' + f(sh2, 2) + '%') +
            (S.tp != null && S.tp - S.T > 0.5 ? '<p>' + L('台電自己的風電總計 ' + f(S.tp, 1) + ' MW 還含本站沒對應到的新機組，用它算是 ' + f(S.tp / S.sys * 100, 1) + '%。', 'Taipower\'s own wind total of ' + f(S.tp, 1) + ' MW also includes new units the site has not mapped; with it the share is ' + f(S.tp / S.sys * 100, 1) + '%.') + '</p>' : '') + '<p>' + L('這也只是這一刻的比例：風小的時候可能只有幾 %，所以風電要和其他電源、儲能一起調度。',
            'This too is only this moment\'s share: in light wind it can drop to a few percent, which is why wind is dispatched together with other sources and storage.') + '</p>' });
      }
    }

    return {
      intro, tool, qs,
      explain: '<p>' + L('MW 是「這一刻」的功率，MWh（度）是一段時間累積的電能。台電即時資料給的是瞬間值，會隨風一直變；要說一整年發了多少電、容量因數多少，就得用整年的實測發電量（第 3 關），不能把任何一刻放大成一整年。',
        'MW is power at one moment; MWh (kWh) is energy built up over time. Taipower\'s live data gives instantaneous values that keep changing with the wind. To say how much was generated in a year, or what the capacity factor was, you need a whole year of measured generation (Level 3) — never one moment scaled up to a year.') + '</p>' +
        (S.hh ? '<p>' + L('同一個網站上，「可同時供應幾萬戶」也是用同一個瞬間值換算的估計（每戶 ' + f(S.hh, dpOf(S.hh)) + ' kW），風一小就跟著變小。',
          'On the same site, "homes powered at once" is an estimate from the same instantaneous value (' + f(S.hh, dpOf(S.hh)) + ' kW per home), and it shrinks as soon as the wind drops.') + '</p>' : ''),
      verify: [{ href: '#/live', label: ['台灣即時：全台風電即時出力、整體可用率與「可同時供應家庭用電」', 'Taiwan live: national wind output, overall availability and "homes powered now"'] },
        { href: '#/live/charts?mode=hist', label: ['台灣即時的數據頁「長期趨勢」：台電自有風場的官方回溯每日平均（不含民營，和本關的取樣不同）', 'Taiwan live charts, "Long-term": official daily averages for Taipower-owned farms only (no private farms; not the samples used here)'] },
        { href: '#/lab/level?n=3', label: ['第 3 關：用台電官方年發電量算容量因數', 'Level 3: the capacity factor from Taipower\'s official yearly generation'] }],
      sources: SRC
    };
  }
});
})();
/* 第 7 關 · 成本下降：lcoe_wind.json（IRENA 經 Our World in Data，CC BY 4.0；全球新建風場的加權平均均化發電成本，固定幣值美元／度）。
   meta 的 source、url、licence、unit、retrieved 都從檔案讀（不寫死）；固定幣值的基準年從 meta.unit 讀出。rows：[年, 陸域, 離岸|null]。
   題目只用檔案裡的數字（第一年、最新一年、第一個有離岸數字的年份）；不與台灣躉購費率混用；「為什麼變便宜」只用 LCOE 定義推得出的道理，不寫外加的數字。
   Level 7 · Falling costs: IRENA's global weighted-average LCOE via Our World in Data; every figure, the source, unit and retrieval date come from the file. */
(function () {
'use strict';
WW.lab.add({
  n: 7, id: 'cost',
  title: ['成本下降', 'Falling costs'],
  hook: ['風電每度電的成本，四十年來降了多少？離岸和陸域誰降得快？', 'How far has the cost of a unit of wind power fallen in forty years — and which fell faster, onshore or offshore?'],
  need: ['lcoe'],
  build({ sh, D, U }) {
    const { L, esc } = U;
    const J = D.lcoe, M = J.meta || {};
    const rows = (J.rows || []).filter(r => r && typeof r[1] === 'number').map(r => ({ y: r[0], on: r[1], off: typeof r[2] === 'number' ? r[2] : null }));
    const first = rows[0], last = rows[rows.length - 1];
    const offRows = rows.filter(r => r.off != null), fo = offRows[0], lo = offRows[offRows.length - 1];
    const at = y => rows.find(r => r.y === y);
    const fo_on = at(fo.y);                                        // 第一個有離岸數字的年份的陸域值 · onshore in the first offshore year
    const BY = ((/(\d{4})/.exec(M.unit || '') || [])[1]) || String(last.y);   // 固定幣值的基準年（從 meta.unit 讀）· constant-money base year
    const v4 = x => x.toFixed(4), usd = x => 'US$' + v4(x);
    const pc = (x, d) => U.f(x, d == null ? 1 : d) + '%';
    const unitTxt = L('固定 ' + BY + ' 年美元／度（kWh）', 'constant ' + BY + ' US$ per kWh');

    /* ---------- 當場算的數字 · figures computed from the file ---------- */
    const dropOn = (1 - last.on / first.on) * 100;                         // 陸域：第一年 → 最新年
    const nYo = lo.y - fo.y;
    const E = lo.y, eOn = at(E).on;                                         // 兩條線共同的最後一年（離岸年份都在陸域年份裡）· last year both series have
    const dOn2 = (1 - eOn / fo_on.on) * 100, dOff2 = (1 - lo.off / fo.off) * 100;   // 第一個離岸年份起 · since the first offshore year
    const ratio = lo.off / eOn;                                     // 最新年：離岸 ÷ 陸域
    const rOff = 1 - Math.pow(lo.off / fo.off, 1 / nYo);                    // 離岸平均每年下降率 · offshore yearly rate of decline
    const halfT = rOff > 0.005 ? Math.log(0.5) / Math.log(1 - rOff) : null;
    const rOn2 = 1 - Math.pow(last.on / fo_on.on, 1 / (last.y - fo.y));
    let bump = null;                                                        // 最近一次離岸比前一年高 · the latest year offshore rose
    for (let i = offRows.length - 1; i > 0; i--) if (offRows[i].off > offRows[i - 1].off) { bump = offRows[i]; bump.prev = offRows[i - 1]; break; }

    /* ---------- 情境 · intro ---------- */
    const intro = '<p>' + L('蓋一座風場要先花很多錢（風機、基礎、電纜、施工），之後每年還有維護費；換來的是二、三十年裡發出來的電。把一輩子的總成本除以一輩子的總發電量，就是「均化發電成本」（LCOE），單位是每度電多少錢：',
        'Building a wind farm costs a lot up front (turbines, foundations, cables, installation), and then there is maintenance every year; in return it makes electricity for twenty or thirty years. Divide the lifetime cost by the lifetime electricity and you get the levelised cost of electricity (LCOE), in money per kWh:') + '</p>' +
      (sh ? U.eq('LCOE = Σ ' + L('（第 t 年成本）', '(cost in year t)') + ' ÷ (1+i)<sup>t</sup> ／ Σ ' + L('（第 t 年發電量）', '(energy in year t)') + ' ÷ (1+i)<sup>t</sup>') +
          '<p>' + L('i 是折現率：今天的一塊錢比十年後的一塊錢值錢，所以未來的成本和發電量都要折算回現在再相除。',
            'i is the discount rate: a dollar today is worth more than a dollar in ten years, so future costs and output are both discounted back to today before dividing.') + '</p>'
        : U.eq('LCOE ≈ ' + L('一輩子的總成本 ÷ 一輩子的總發電量', 'lifetime cost ÷ lifetime electricity'))) +
      '<p>' + L('這一關的資料是國際再生能源總署（IRENA）整理、經 Our World in Data 發布的全球數字：每一年「當年新完工」風場的加權平均 LCOE，陸域從 ' + first.y + ' 年、離岸從 ' + fo.y + ' 年開始，到 ' + last.y + ' 年；單位是' + unitTxt + '。',
        'This level uses global figures compiled by the International Renewable Energy Agency (IRENA) and published by Our World in Data: each year\'s weighted-average LCOE of the wind farms completed that year, onshore from ' + first.y + ' and offshore from ' + fo.y + ', up to ' + last.y + ', in ' + unitTxt + '.') + '</p>' +
      '<p class="note">' + L('這是全球平均，各國、各案差很多；它也不是台灣的躉購費率（政府向風場收購電力的價格），兩者口徑不同，不要放在一起比。',
        'These are global averages that vary widely by country and project. They are not Taiwan\'s feed-in tariffs (the price the government pays wind farms for power) — a different measure, so do not compare the two.') + '</p>';

    /* ---------- 動手：折線圖＋年份滑桿 · tool: line chart with a year slider ---------- */
    const S = { yr: last.y };
    const fm = { yr: x => String(x) };
    const tool = {
      html: '<div class="lbgridt"><div>' + U.slider('yr', L('年份', 'Year'), first.y, last.y, 1, S.yr, fm.yr) + '<div id="lb7out"></div>' +
        '<p class="note">' + L('實線＝陸域，虛線＝離岸。拉動年份，讀出那一年兩條線的數值；第一年的數值把滑桿拉到最左邊就看得到。',
          'Solid line = onshore, dashed line = offshore. Drag the year to read both values; slide all the way left for the first year.') + '</p></div>' +
        '<div class="lbplot" id="lb7plot"></div></div>',
      mount(root) {
        const plot = root.querySelector('#lb7plot'), out = root.querySelector('#lb7out');
        const W = Math.max(320, Math.min(640, plot.clientWidth || 520)), H = 250, ml = 46, mr = 14, mt = 30, mb = 28, iw = W - ml - mr, ih = H - mt - mb;   // 依實際寬度畫，字不縮小 · drawn at the real width so text stays readable
        const mx = Math.max(...rows.map(r => Math.max(r.on, r.off || 0)));
        const step = mx > 0.3 ? 0.1 : 0.05, top = Math.ceil(mx * 1.04 / step) * step;
        const X = y => ml + (y - first.y) / Math.max(1, last.y - first.y) * iw, Y = v => mt + ih - v / top * ih;
        const path = (list, k) => list.map((r, i) => (i ? 'L' : 'M') + X(r.y).toFixed(1) + ' ' + Y(r[k]).toFixed(1)).join('');
        const ON = 'stroke:var(--onshore-b);fill:none;stroke-width:2.5;stroke-linejoin:round', OFF = 'stroke:var(--offshore-b);fill:none;stroke-width:2.5;stroke-linejoin:round;stroke-dasharray:7 4';
        const draw = () => {
          const r = at(S.yr);
          let g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(L('全球風電均化發電成本折線圖（' + unitTxt + '）：' + first.y + ' 年陸域 ' + v4(first.on) + '，' + last.y + ' 年陸域 ' + v4(last.on) + '，' + E + ' 年離岸 ' + v4(lo.off) + '；選定 ' + r.y + ' 年：陸域 ' + v4(r.on) + (r.off != null ? '、離岸 ' + v4(r.off) : '、離岸沒有資料'),
            'Line chart of global wind LCOE (' + unitTxt + '): onshore ' + v4(first.on) + ' in ' + first.y + ', onshore ' + v4(last.on) + ' in ' + last.y + ', offshore ' + v4(lo.off) + ' in ' + E + '; selected ' + r.y + ': onshore ' + v4(r.on) + (r.off != null ? ', offshore ' + v4(r.off) : ', no offshore data'))) + '">';
          const ys = W < 440 ? 10 : 5;
          for (let v = 0; v <= top + 1e-9; v += step) g += '<line class="gr" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="' + (ml - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v.toFixed(2) + '</text>';
          for (let y = Math.ceil(first.y / ys) * ys; y <= last.y; y += ys) g += '<line class="gr" x1="' + X(y).toFixed(1) + '" x2="' + X(y).toFixed(1) + '" y1="' + mt + '" y2="' + (mt + ih) + '"/><text x="' + X(y).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + y + '</text>';
          g += '<line class="ax" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + (mt + ih) + '" y2="' + (mt + ih) + '"/>';
          g += '<text x="' + (ml - 6) + '" y="' + (mt - 16) + '" text-anchor="start">US$/kWh</text>';
          /* 圖例：線型＋文字，不只靠顏色 · legend with line style and words, not colour alone */
          const lx = W - mr - 200;
          g += '<line x1="' + lx + '" x2="' + (lx + 26) + '" y1="' + (mt - 18) + '" y2="' + (mt - 18) + '" style="' + ON + '"/><text x="' + (lx + 31) + '" y="' + (mt - 14) + '" style="fill:var(--ink-2)">' + L('陸域', 'Onshore') + '</text>';
          g += '<line x1="' + (lx + 98) + '" x2="' + (lx + 124) + '" y1="' + (mt - 18) + '" y2="' + (mt - 18) + '" style="' + OFF + '"/><text x="' + (lx + 129) + '" y="' + (mt - 14) + '" style="fill:var(--ink-2)">' + L('離岸', 'Offshore') + '</text>';
          g += '<path d="' + path(rows, 'on') + '" style="' + ON + '"/><path d="' + path(offRows, 'off') + '" style="' + OFF + '"/>';
          const x = X(r.y);
          g += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + mt + '" y2="' + (mt + ih) + '" style="stroke:var(--ink-3);stroke-width:1;stroke-dasharray:2 3"/>';
          const right = x > ml + iw * 0.62, ta = right ? 'end' : 'start', dx = right ? -9 : 9;
          const pts = [{ k: 'on', v: r.on, t: L('陸域 ', 'Onshore ') + v4(r.on), c: 'var(--onshore-b)' }];
          if (r.off != null) pts.push({ k: 'off', v: r.off, t: L('離岸 ', 'Offshore ') + v4(r.off), c: 'var(--offshore-b)' });
          pts.sort((a, b) => b.v - a.v);
          const clampY = t => Math.max(mt + 10, Math.min(mt + ih - 4, t));
          /* 標籤放在線「離開」的那一側：標籤那一邊的線段比點高就放下方，否則放上方；兩個標籤太近時改用固定的上／下排法 ·
             put each label on the side away from its own line (below when the line on the label's side runs higher); fall back to above/below when the two labels clash */
          const nb = at(r.y + (right ? -1 : 1));
          let tys = pts.map(p => { const cy = Y(p.v), nv = nb ? nb[p.k] : null; return clampY(nv != null && Y(nv) < cy ? cy + 17 : cy - 8); });
          if (tys.length === 2 && Math.abs(tys[1] - tys[0]) < 15) {
            tys = [clampY(Y(pts[0].v) - 8)]; tys.push(clampY(Math.max(Y(pts[1].v) + 17, tys[0] + 15)));
          }
          pts.forEach((p, i) => {
            g += '<circle cx="' + x.toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="5" style="fill:' + p.c + ';stroke:var(--surface-1);stroke-width:1.5"/>';
            g += '<text x="' + (x + dx).toFixed(1) + '" y="' + tys[i].toFixed(1) + '" text-anchor="' + ta + '" style="fill:var(--ink);font-weight:700;font-size:12px">' + p.t + '</text>';
          });
          plot.innerHTML = g + '</svg>';
          out.innerHTML = U.chip(r.y + L(' 陸域', ' onshore'), usd(r.on)) +
            U.chip(r.y + L(' 離岸', ' offshore'), r.off != null ? usd(r.off) : L('沒有資料', 'no data'));
        };
        U.bind(root, S, fm, draw); draw();
      }
    };

    /* ---------- 問題 · questions ---------- */
    const same = Math.abs(dOn2 - dOff2) < 2;
    const kFast = same ? 2 : dOn2 > dOff2 ? 0 : 1;
    const why2 = L('從 ' + fo.y + ' 到 ' + E + ' 年：陸域 ' + v4(fo_on.on) + ' → ' + v4(eOn) + '，降了 ' + pc(dOn2) + '；離岸 ' + v4(fo.off) + ' → ' + v4(lo.off) + '，降了 ' + pc(dOff2) + '。',
      'From ' + fo.y + ' to ' + E + ': onshore ' + v4(fo_on.on) + ' → ' + v4(eOn) + ', down ' + pc(dOn2) + '; offshore ' + v4(fo.off) + ' → ' + v4(lo.off) + ', down ' + pc(dOff2) + '.');
    const fbFast = k => k === kFast ? '' : L('算算看兩者各降了百分之幾再比。', 'Work out each one\'s percentage drop and compare.');
    let qs;
    if (!sh) {
      qs = [
        { id: 'a', type: 'num', q: L('陸域風電的 LCOE 從 ' + first.y + ' 年到 ' + last.y + ' 年下降了百分之幾？（用滑桿下方顯示的數值，四捨五入到整數 %）',
            'By what percentage did onshore wind\'s LCOE fall from ' + first.y + ' to ' + last.y + '? (use the values shown under the slider, round to a whole %)'),
          ans: dropOn, unit: '%', tol: { abs: 0.6 },
          hint: L('下降百分比 =（舊 − 新）÷ 舊 × 100%。舊的是 ' + first.y + ' 年，新的是 ' + last.y + ' 年。', 'Percentage drop = (old − new) ÷ old × 100%. Old is ' + first.y + ', new is ' + last.y + '.'),
          sol: U.eq('(' + v4(first.on) + ' − ' + v4(last.on) + ') ÷ ' + v4(first.on) + ' × 100% ≈ ' + pc(dropOn)) +
            '<p>' + L('也就是說，' + last.y + ' 年一度電的成本只剩 ' + first.y + ' 年的約 ' + pc(100 - dropOn, 0) + '。', 'In other words, a kWh in ' + last.y + ' cost only about ' + pc(100 - dropOn, 0) + ' of what it did in ' + first.y + '.') + '</p>' },
        { id: 'b', type: 'mc', q: L('從有離岸數字的第一年（' + fo.y + ' 年）到 ' + E + ' 年，哪一種風電的成本「下降的百分比」比較大？', 'From the first year with an offshore figure (' + fo.y + ') to ' + E + ', which kind of wind power had the bigger percentage fall in cost?'),
          opts: [[L('陸域', 'Onshore'), fbFast(0)], [L('離岸', 'Offshore'), fbFast(1)], [L('兩者差不多（相差不到 2 個百分點）', 'About the same (within 2 percentage points)'), fbFast(2)],
            [L('兩者都變貴了', 'Both got dearer'), L('兩條線的終點都比起點低。', 'Both lines end lower than they start.')]],
          a: kFast, hint: L('把滑桿拉到 ' + fo.y + ' 和 ' + E + ' 年，分別算陸域和離岸下降的百分比。', 'Set the slider to ' + fo.y + ' and ' + E + ' and work out the percentage drop for each.'),
          sol: '<p>' + why2 + ' ' + (same ? L('兩者差不多。', 'They are about the same.') : (dOn2 > dOff2 ? L('陸域降得比較多。', 'Onshore fell further.') : L('離岸降得比較多。', 'Offshore fell further.'))) + '</p>' },
        { id: 'c', type: 'num', q: L(lo.y + ' 年，離岸風電的 LCOE 是陸域的幾倍？（四捨五入到小數第一位）', 'In ' + lo.y + ', the offshore LCOE was how many times the onshore LCOE? (one decimal)'),
          ans: ratio, unit: L('倍', '×'), tol: { abs: 0.06 },
          hint: L('離岸 ÷ 陸域，兩個都用 ' + lo.y + ' 年的數字。', 'Offshore ÷ onshore, both for ' + lo.y + '.'),
          sol: U.eq(v4(lo.off) + ' ÷ ' + v4(eOn) + ' ≈ ' + U.f(ratio, 2)) +
            '<p>' + L('離岸每度電還是比陸域貴，因為海上的基礎、海纜、施工船與維護都比較花錢；不過海上風比較強、也比較穩。', 'Offshore power still costs more per kWh, because foundations, cables, vessels and maintenance at sea are costlier — though the wind at sea is stronger and steadier.') + '</p>' }
      ];
    } else {
      const q2 = halfT != null
        ? { id: 'b', type: 'num', q: L('假設離岸 LCOE 一直以上一題的速率下降（只是假設，不是預測），成本要幾年才會減半？用對數算，答案四捨五入到小數第一位。',
              'Suppose offshore LCOE kept falling at the rate from the previous question (an assumption, not a forecast). How many years would it take to halve? Use logarithms; one decimal.'),
            ans: halfT, unit: L('年', 'years'), tol: { abs: 0.3 },
            hint: L('解 (1 − r)ⁿ = 0.5：n = log 0.5 ÷ log(1 − r)（r 用小數，例如 3.5% 寫成 0.035）。', 'Solve (1 − r)ⁿ = 0.5: n = log 0.5 ÷ log(1 − r) (r as a decimal, e.g. 3.5% → 0.035).'),
            sol: U.eq('n = log 0.5 ÷ log(1 − ' + U.f(rOff, 4) + ') ≈ ' + U.f(halfT, 2) + L(' 年', ' years')) +
              '<p>' + L('「70 法則」（70 ÷ 每年 % ≈ ' + U.f(70 / (rOff * 100), 1) + ' 年）是近似；年下降率越大，近似誤差越大。', 'The "rule of 70" (70 ÷ yearly % ≈ ' + U.f(70 / (rOff * 100), 1) + ' years) is an approximation that gets worse as the rate grows.') + '</p>' }
        : { id: 'b', type: 'num', q: L('同樣的方法，陸域從 ' + fo.y + ' 到 ' + last.y + ' 年平均每年下降百分之幾？（小數第一位）', 'By the same method, what was onshore\'s average yearly rate of decline from ' + fo.y + ' to ' + last.y + '? (one decimal)'),
            ans: rOn2 * 100, unit: '%', tol: { abs: 0.06 }, hint: L('1 − (新 ÷ 舊)^(1 ÷ 年數)。', '1 − (new ÷ old)^(1 ÷ years).'),
            sol: U.eq('1 − (' + v4(last.on) + ' ÷ ' + v4(fo_on.on) + ')^(1/' + (last.y - fo.y) + ') ≈ ' + pc(rOn2 * 100, 2)) };
      qs = [
        { id: 'a', type: 'num', q: L('離岸風電的 LCOE 從 ' + fo.y + ' 年的 ' + v4(fo.off) + ' 降到 ' + lo.y + ' 年的 ' + v4(lo.off) + '。這 ' + nYo + ' 年間平均每年下降百分之幾？用複利公式 r = 1 − (新 ÷ 舊)^(1/n)，答案四捨五入到小數第一位。',
            'Offshore wind\'s LCOE fell from ' + v4(fo.off) + ' in ' + fo.y + ' to ' + v4(lo.off) + ' in ' + lo.y + '. What was the average yearly rate of decline over these ' + nYo + ' years? Use the compound formula r = 1 − (new ÷ old)^(1/n); one decimal.'),
          ans: rOff * 100, unit: '%', tol: { abs: 0.06 },
          hint: L('n 是年數差：' + lo.y + ' − ' + fo.y + ' = ' + nYo + '（不是資料的筆數）。不要用「總降幅 ÷ 年數」，那會忽略複利。', 'n is the difference in years: ' + lo.y + ' − ' + fo.y + ' = ' + nYo + ' (not the number of rows). Do not use "total drop ÷ years" — that ignores compounding.'),
          sol: U.eq('(' + v4(lo.off) + ' ÷ ' + v4(fo.off) + ')^(1/' + nYo + ') ≈ ' + U.f(1 - rOff, 4)) + U.eq('r = 1 − ' + U.f(1 - rOff, 4) + ' ≈ ' + pc(rOff * 100, 2)) +
            '<p>' + L('如果用「總降幅 ÷ 年數」= ' + pc(dOff2) + ' ÷ ' + nYo + ' ≈ ' + pc(dOff2 / nYo, 2) + '，會算錯：每一年是在前一年已經變便宜的基礎上再降。', 'Using "total drop ÷ years" = ' + pc(dOff2) + ' ÷ ' + nYo + ' ≈ ' + pc(dOff2 / nYo, 2) + ' would be wrong: each year falls from the already lower level of the year before.') + '</p>' },
        q2,
        { id: 'c', type: 'mc', q: L('依 LCOE 的定義（一輩子的成本 ÷ 一輩子的發電量），下列哪一個說法最能解釋風電成本為什麼會下降？', 'Going by the definition of LCOE (lifetime cost ÷ lifetime electricity), which statement best explains why wind costs fell?'),
          opts: [[L('風機越做越大、越高，每 MW 裝置容量一年發的電變多（容量因數提高），市場變大也讓每 MW 的造價下降；分母變大、分子變小，LCOE 就降了', 'Bigger, taller turbines make more electricity per MW installed (higher capacity factors), and larger markets cut the cost per MW: a bigger denominator and a smaller numerator lower the LCOE')],
            [L('這幾十年地球上的風變強了', 'The wind on Earth got stronger over these decades'), L('資料沒有顯示這件事；變的是機器和工程，不是風。', 'Nothing in the data shows that; what changed is the machines and projects, not the wind.')],
            [L('政府補貼越來越多，所以成本降低', 'Governments gave more subsidies, so the cost fell'), L('補貼改變的是誰付錢，不會讓蓋風場、維護風場本身變便宜；LCOE 算的是成本。（政策支持讓市場變大，間接帶來規模效益，但那是正確選項說的「規模」，不是補貼本身讓成本變低。）', 'A subsidy changes who pays, not how much it costs to build and run the farm; LCOE measures the cost. (Policy support did help markets grow, which brings the economies of scale in the correct answer — but that is scale, not the subsidy itself lowering the cost.)')],
            [L('其實沒有變便宜，只是通貨膨脹造成的錯覺', 'It did not really get cheaper; the fall is just an effect of inflation'), L('這份資料已經換算成固定 ' + BY + ' 年美元，通膨的影響已經扣掉；而且物價上漲只會讓名目金額越來越大，不會讓它變小。', 'The data are already in constant ' + BY + ' US$, so inflation has been taken out — and rising prices would make nominal figures grow, not shrink.')]],
          a: 0, hint: L('想想什麼會讓「分母」（發電量）變大，或讓「分子」（成本）變小。', 'Think about what makes the denominator (electricity) bigger or the numerator (cost) smaller.'),
          sol: '<p>' + L('LCOE 是分數：發電量變多或成本變少，它就下降。更大的葉輪掃到更多風、更高的塔架吹到更強的風，同樣的裝置容量一年發的電更多；裝的量多了，製造、施工和維護也更有規模。這是常見的解釋方向，每一項各貢獻多少，這份資料沒有拆開，要看 IRENA 的報告。',
              'LCOE is a fraction: more electricity or less cost lowers it. Larger rotors sweep more wind and taller towers reach stronger wind, so each MW of capacity makes more electricity a year; more installations bring scale to manufacturing, construction and maintenance. These are the usual lines of explanation; this file does not split out how much each contributed — that needs IRENA\'s reports.') + '</p>' },
        { id: 'd', type: 'mc', q: L('單位寫「固定 ' + BY + ' 年美元」是什麼意思？', 'What does "constant ' + BY + ' US$" mean in the unit?'),
          opts: [[L('每一年的成本都換算成 ' + BY + ' 年的購買力，扣掉通貨膨脹，不同年份才能直接比', 'Every year\'s cost is converted to ' + BY + ' purchasing power, removing inflation, so different years can be compared directly')],
            [L('只算 ' + BY + ' 年完工的風場', 'Only farms completed in ' + BY + ' are counted'), L('每一年都有當年完工的風場，只是金額換算成同一年的幣值。', 'Each year has its own completed farms; only the money is converted to one year\'s value.')],
            [L('那是 ' + BY + ' 年每個人實際付的電價', 'It is the electricity price everyone actually paid in ' + BY), L('LCOE 是發電成本，不是電價。', 'LCOE is a generating cost, not a retail price.')],
            [L('舊年份的數字是當年的美元，沒有調整', 'Old years are in that year\'s dollars, unadjusted'), L('那叫「名目」或「當期」美元，正好相反。', 'That is "nominal" or "current" dollars — the opposite.')]],
          a: 0, hint: L('想想 ' + first.y + ' 年的一美元和 ' + BY + ' 年的一美元買得到的東西一樣多嗎？', 'Does a dollar in ' + first.y + ' buy the same as a dollar in ' + BY + '?'),
          sol: '<p>' + L('物價會上漲，所以要比較不同年份的成本，得先把金額換算成同一年的購買力。這份資料都用 ' + BY + ' 年的美元表示，下降的部分是真正變便宜，不是通膨造成的錯覺。',
              'Prices rise over time, so to compare costs across years the money has to be put in one year\'s purchasing power. Every figure here is in ' + BY + ' dollars, so the fall is a real fall, not an illusion caused by inflation.') + '</p>' }
      ];
    }

    const srcLbl = (M.source || 'Our World in Data') + ' · ' + (M.licence || '') + L('，取用 ', ', retrieved ') + (M.retrieved || '');
    return {
      intro, tool, qs,
      explain: '<p>' + L('陸域風電的 LCOE 從 ' + first.y + ' 到 ' + last.y + ' 年降了約 ' + pc(dropOn, 0) + '；離岸從 ' + fo.y + ' 年起降了約 ' + pc(dOff2, 0) + '，但每度電仍是陸域的約 ' + U.f(ratio, 1) + ' 倍。',
          'Onshore wind\'s LCOE fell by about ' + pc(dropOn, 0) + ' from ' + first.y + ' to ' + last.y + '; offshore has fallen about ' + pc(dOff2, 0) + ' since ' + fo.y + ', yet a kWh still costs about ' + U.f(ratio, 1) + ' times as much as onshore.') + '</p>' +
        '<p>' + L('曲線不是每年都往下：每年的數字是「當年完工」那些風場的平均，哪些風場剛好在那一年完工，數字就跟著變' +
          (bump ? '（例如離岸 ' + bump.y + ' 年 ' + v4(bump.off) + '，比 ' + bump.prev.y + ' 年的 ' + v4(bump.prev.off) + ' 高）' : '') + '。看長期趨勢要看很多年，不要只比相鄰兩年。',
          'The curve does not fall every year: each year\'s figure is the average of the farms completed that year, so it moves with which farms happened to finish' +
          (bump ? ' (offshore was ' + v4(bump.off) + ' in ' + bump.y + ', above ' + v4(bump.prev.off) + ' in ' + bump.prev.y + ')' : '') + '. To see the long-term trend, look across many years rather than two neighbouring ones.') + '</p>',
      verify: [{ href: '#/learn/why', label: ['風電知識「為什麼台灣需要風電」：成本下降教具（和台灣躉購費率分開畫）', 'Learn, "Why Taiwan needs wind": the falling-costs panel (drawn apart from Taiwan\'s feed-in tariffs)'] },
        { href: '#/data', label: ['資料下載：全球風電均化發電成本（CSV）', 'Data downloads: global wind LCOE (CSV)'] }],
      sources: [{ label: srcLbl, url: M.url || 'https://ourworldindata.org/grapher/levelized-cost-of-energy' },
        { label: L('均化發電成本（LCOE）的定義', 'Levelized cost of electricity (definition)'), url: 'https://en.wikipedia.org/wiki/Levelized_cost_of_electricity' },
        { label: L('複合年均成長率', 'Compound annual growth rate'), url: 'https://en.wikipedia.org/wiki/Compound_annual_growth_rate' }]
    };
  }
});
})();
/* 第 8 關 · 事件與教訓：events.json（本站人工查證的事件清單，每筆附一手來源；根因只寫官方或出處確認的）。
   只用摘要裡寫明原因的 6 筆事故（依 id 指定、當場讀標題、摘要與出處）；分類與答案都以摘要裡的原文片段為準：
   每個關鍵片段用正規式從中英文摘要找出來，找不到就不出那一題（避免答案與摘要不一致）。數字（筆數、費用、倍數、機艙數）都從檔案讀。
   Level 8 · Lessons from incidents: six incidents whose summaries state a cause, read by id at render time. Every answer is tied to a phrase found in
   both language versions of the summary; a question whose phrase is missing is left out. Figures come from the file. */
(function () {
'use strict';
const IDS = ['WIND-152', 'WIND-140', 'WIND-139', 'WIND-125', 'WIND-047', 'WIND-124'];   // 依年代排列 · in date order
/* 原因類型（只描述摘要寫到的層次）· cause types, worded no further than the summaries go */
const CAT = {
  crack: ['材料或焊縫的裂縫擴大', 'Cracks growing in material or welds'],
  design: ['設計標準的錯誤（結構連接）', 'An error in a design standard (structural connection)'],
  elec: ['電氣設備的缺陷', 'Defects in electrical equipment'],
  insp: ['檢查或監測沒發現損傷', 'Damage missed by inspection or monitoring']
};
const KEY = { 'WIND-152': 'crack', 'WIND-140': 'elec', 'WIND-139': 'design', 'WIND-125': 'insp', 'WIND-047': 'crack', 'WIND-124': 'insp' };
/* 摘要裡的關鍵片段（中文、英文）· the phrases in the summaries that carry each answer */
const PH = {
  'WIND-152': { cause: [/翼梁舊裂縫延伸[^）]*/, /an old crack in the spar had grown[^)]*/], wind: [/(\d+) mph 風中/, /in a (\d+) mph wind/] },
  'WIND-140': { cause: [/乾式變壓器陸續故障[^；]*?製造缺陷/, /the dry-type transformers[^;]*?defects were then found in many generators/],
    sea: [/北海作業條件惡劣/, /repairs hampered by North Sea conditions/], ashore: [/把 \d+ 具機艙[^，]*?整修/, /all \d+ nacelles[^,]*?for repair/],
    autumn: [/預計秋季完成/, /to finish in the autumn/] },
  'WIND-139': { cause: [/DNV J101 標準公式有誤、軸向承載力高估約\s*\d+\s*倍/, /an error in the DNV J101 standard that over-estimated axial capacity by a factor of about \w+/],
    slip: [/過渡段沿單樁下滑/, /transition pieces slipping down the monopiles/] },
  'WIND-125': { cause: [/法定點檢未適當執行[^；]*?無法掌握軸承損傷/, /the statutory inspections[^;]*?had not revealed the bearing damage/],
    sensor: [/僅靠溫度感測器監視無法掌握軸承損傷/, /temperature sensors alone had not revealed the bearing damage/] },
  'WIND-047': { cause: [/環焊縫初始焊接缺陷及疲勞裂紋/, /initial welding defects and fatigue cracks in a circumferential weld/] },
  'WIND-124': { cause: [/避雷接收器以外部位遭落雷受損[^；]*?漏看/, /lightning had hit the blade outside its receptor[^;]*?missed the damage/],
    stop: [/雷擊小於自動停機門檻未停機/, /too small a strike to trigger the automatic stop/],
    eye: [/只以目視檢查轉動中的葉片而漏看/, /only looked at the rotating blades by eye and missed the damage/],
    receptor: [/避雷接收器以外部位/, /outside its receptor/] }
};
WW.lab.add({
  n: 8, id: 'lessons',
  title: ['事件與教訓', 'Lessons from incidents'],
  hook: ['風機為什麼會壞？從真實事故的調查結果，找出原因和該學的教訓。', 'Why do turbines fail? Find the causes and the lessons in the findings of real incidents.'],
  need: ['events'],
  build({ sh, D, U }) {
    const { L, esc, f } = U;
    const J = D.events || {}, M = J.meta || {}, ALL = J.events || [];
    const tx = a => Array.isArray(a) ? L(a[0], a[1]) : (a == null ? '' : String(a));
    const byId = {}; ALL.forEach(e => { byId[e.id] = e; });
    const EV = IDS.map(id => byId[id]).filter(e => e && Array.isArray(e.summary) && e.summary.length === 2);
    const has = id => EV.some(e => e.id === id);
    const LET = {}; EV.forEach((e, i) => { LET[e.id] = String.fromCharCode(65 + i); });
    /* 片段：中英文摘要都找得到才算 · a phrase counts only when found in both languages */
    const ph = (id, k) => {
      const e = byId[id], r = PH[id] && PH[id][k];
      if (!e || !r) return null;
      const z = r[0].exec(e.summary[0]), n = r[1].exec(e.summary[1]);
      return z && n ? { zh: z[0].trim(), en: n[0].trim(), mz: z, me: n } : null;
    };
    const quote = p => p ? L('「' + esc(p.zh) + '」', '“' + esc(p.en) + '”') : '';
    const okAll = (...ps) => ps.every(Boolean);
    const name = id => tx(byId[id].project);
    const tag = id => LET[id] + '. ' + esc(name(id));

    /* ---------- 從檔案算的數字 · figures from the file ---------- */
    const inc = ALL.filter(e => e.cat === 'inc'), incOff = inc.filter(e => e.site === 'off');
    const catName = M.cats && M.cats.inc ? tx(M.cats.inc) : L('事故／故障', 'Incident / failure');

    /* ---------- 情境 · intro ---------- */
    const intro = '<p>' + L('再好的設計也可能出錯。工程師把每一次事故的調查結果記下來，下一代的風機、標準和維護方式才會更安全。本站的事件資料共有 ' + U.int(ALL.length) + ' 筆，其中「' + esc(catName) + '」' + U.int(inc.length) + ' 筆（離岸 ' + U.int(incOff.length) + ' 筆）。這一關挑出 ' + EV.length + ' 筆「摘要裡寫明原因」的事故，請你當調查員：讀摘要、找出寫原因的那一句，把它歸到一種原因類型。',
      'Even good designs can fail. Engineers record what each incident investigation found, so that the next turbines, standards and maintenance can be safer. The site\'s event list has ' + U.int(ALL.length) + ' entries, ' + U.int(inc.length) + ' of them “' + esc(catName) + '” (' + U.int(incOff.length) + ' offshore). This level picks ' + EV.length + ' incidents whose summaries state a cause. Be the investigator: read each summary, find the sentence that gives the cause, and sort it into a cause type.') + '</p>' +
      '<ul>' + Object.keys(CAT).map(k => '<li><b>' + esc(tx(CAT[k])) + '</b>' + L('：', ': ') + ({
        crack: L('材料或焊縫裡原本就有的缺陷或裂縫，在運轉中越長越大，最後斷裂。', 'a flaw or crack already in the material or a weld grows during operation until the part breaks.'),
        design: L('零件之間的連接照著設計標準計算，但標準本身的公式有錯。', 'a connection between parts was designed to a standard whose formula was itself wrong.'),
        elec: L('變壓器、發電機等電氣設備故障或有製造缺陷。', 'electrical equipment such as transformers or generators fails or has production defects.'),
        insp: L('損傷已經發生，但檢查或感測器沒有發現，損壞因此擴大。', 'damage had already happened, but inspections or sensors did not find it, so it got worse.')
      })[k] + '</li>').join('') + '</ul>' +
      (M.note ? '<p class="note">' + L('資料說明：', 'About the data: ') + esc(tx(M.note)) + '</p>' : '');

    /* ---------- 動手：事故卡片與分類 · tool: incident cards and sorting ---------- */
    const S = { show: false };
    const mark = (e, on) => {
      const p = ph(e.id, 'cause'), s = esc(tx(e.summary));
      if (!on || !p) return s;
      const k = esc(L(p.zh, p.en)), i = s.indexOf(k);
      return i < 0 ? s : s.slice(0, i) + '<mark style="background:var(--hl);color:var(--bg);border-radius:3px;padding:0 2px">' + k + '</mark>' + s.slice(i + k.length);
    };
    const card = e => {
      const orgs = Array.isArray(e.org) ? tx(e.org) : '';
      return '<li data-ev="' + esc(e.id) + '" style="border:1px solid var(--line-2);border-radius:12px;padding:10px 12px;background:var(--surface-2);display:flex;flex-direction:column;gap:6px;min-width:0">' +
        '<div style="font-size:12.5px;color:var(--ink-3)"><b style="color:var(--ink);font-size:14px">' + LET[e.id] + '</b> · ' + esc(e.date || String(e.year)) + ' · ' +
          (e.site === 'off' ? L('離岸', 'offshore') : L('陸域', 'onshore')) + ' · ' + esc(tx(e.area)) + '</div>' +
        '<b style="color:var(--ink);line-height:1.4">' + esc(tx(e.title)) + '</b>' +
        '<div style="font-size:12.5px;color:var(--ink-2)">' + esc(tx(e.project)) + '</div>' +
        '<p class="lb8sum" style="font-size:13.5px;line-height:1.6;margin:0">' + mark(e, S.show) + '</p>' +
        '<div style="font-size:12.5px;color:var(--ink-3)">' + L('出處：', 'Source: ') + esc(orgs) + ' ' + (e.src || []).map((u, i) => U.link(u, '[' + (i + 1) + ']')).join(' ') +
          ' · ' + U.link('#/global?ev=' + encodeURIComponent(e.id), L('地球儀上看', 'On the globe')) + '</div>' +
        '<label class="lbs" style="margin:auto 0 0"><span>' + L('你判斷的原因類型', 'Your cause type') + '</span><select class="fsel" data-k="' + esc(e.id) + '" aria-label="' + esc(L(LET[e.id] + '. ' + tx(e.title) + '：原因類型', LET[e.id] + '. ' + tx(e.title) + ': cause type')) + '">' +
          '<option value="">' + L('— 選一種 —', '— choose —') + '</option>' + Object.keys(CAT).map(k => '<option value="' + k + '">' + esc(tx(CAT[k])) + '</option>').join('') + '</select></label>' +
        '<div class="lb8r" aria-live="polite" style="font-size:13px"></div></li>';
    };
    const tool = {
      html: '<p>' + L('每張卡片是一筆事故的標題與摘要（從本站資料當場讀出）。先讀摘要，再替每一筆選一種原因類型，按「核對」看看你分得對不對。', 'Each card shows an incident\'s title and summary, read from the site\'s data. Read the summary, choose a cause type for each one, then press “Check”.') + '</p>' +
        '<ol style="list-style:none;padding:0;margin:8px 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr));gap:10px">' + EV.map(card).join('') + '</ol>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="btn sm" id="lb8chk">' + L('核對我的分類', 'Check my sorting') + '</button>' +
        '<button type="button" class="btn sm ghost" id="lb8key">' + L('標出寫原因的句子', 'Highlight the cause in each summary') + '</button><span id="lb8sum" aria-live="polite" style="font-weight:700"></span></div>' +
        '<p class="note">' + L('分類是本關為了練習做的簡化：一起事故常常不只一個原因（例如雷擊受損又被檢查漏看）。這裡只用摘要寫到的內容，不加推測。', 'The sorting is a simplification for practice: an incident often has more than one cause (such as lightning damage that an inspection then missed). Only what the summaries say is used here.') + '</p>',
      mount(root) {
        const sels = [...root.querySelectorAll('select[data-k]')];
        const res = () => {
          let ok = 0, chosen = 0;
          sels.forEach(s => {
            const id = s.dataset.k, v = s.value, out = root.querySelector('li[data-ev="' + id + '"] .lb8r'), p = ph(id, 'cause');
            if (!v) { out.innerHTML = '<span style="color:var(--ink-3)">' + L('還沒選。', 'Not chosen yet.') + '</span>'; return; }
            chosen++;
            if (v === KEY[id]) { ok++; out.innerHTML = '<span class="lbgood">✓ ' + L('對。', 'Right.') + '</span> ' + (p ? L('摘要寫：', 'The summary says: ') + quote(p) : ''); }
            else out.innerHTML = '<span class="lbbad">✗ ' + L('再讀一次：摘要裡寫原因的是哪一句？', 'Read it again: which sentence in the summary gives the cause?') + '</span>';
          });
          root.querySelector('#lb8sum').textContent = L('對了 ' + ok + ' / ' + sels.length + (chosen < sels.length ? '（還有 ' + (sels.length - chosen) + ' 筆沒選）' : ''), ok + ' of ' + sels.length + ' right' + (chosen < sels.length ? ' (' + (sels.length - chosen) + ' not chosen yet)' : ''));
        };
        root.querySelector('#lb8chk').onclick = res;
        const kb = root.querySelector('#lb8key');
        kb.onclick = () => {
          S.show = !S.show;
          EV.forEach(e => { root.querySelector('li[data-ev="' + e.id + '"] .lb8sum').innerHTML = mark(e, S.show); });
          kb.setAttribute('aria-pressed', String(S.show));
        };
        kb.setAttribute('aria-pressed', 'false');
      }
    };

    /* ---------- 題目 · questions ---------- */
    const qs = [];
    const c152 = ph('WIND-152', 'cause'), w152 = ph('WIND-152', 'wind');
    const c140 = ph('WIND-140', 'cause'), sea140 = ph('WIND-140', 'sea'), ash140 = ph('WIND-140', 'ashore'), aut140 = ph('WIND-140', 'autumn');
    const c139 = ph('WIND-139', 'cause'), sl139 = ph('WIND-139', 'slip');
    const c124 = ph('WIND-124', 'cause'), st124 = ph('WIND-124', 'stop'), eye124 = ph('WIND-124', 'eye'), rc124 = ph('WIND-124', 'receptor');
    const s125 = ph('WIND-125', 'sensor');
    /* Robin Rigg 的倍數、費用與基礎數 · Robin Rigg's factor, cost and foundation count (from the summary text) */
    const r139 = has('WIND-139') ? byId['WIND-139'].summary : null;
    /* 中英文摘要各讀一次，兩者一致才用 · read from both summaries and used only when they agree */
    const num = (re, t) => { const m = re.exec(t || ''); return m ? +m[1].replace(/,/g, '') : NaN; };
    const WORD = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, hundred: 100 };
    const enNum = (re, t) => { const m = re.exec(t || ''); if (!m) return NaN; const w = m[1].toLowerCase(); return /^\d+$/.test(w) ? +w : (WORD[w] || NaN); };
    const pick = (z, n) => (z > 0 && z === n) ? z : NaN;
    const FAC = r139 ? pick(num(/高估約\s*(\d+)\s*倍/, r139[0]), enNum(/factor of about (\w+)/, r139[1])) : NaN;
    const EUR = r139 ? pick(num(/([\d,]+)\s*萬歐元/, r139[0]) / 100, num(/EUR\s*([\d.]+)\s*m\b/, r139[1])) : NaN;
    const NF = r139 ? pick(num(/(\d+)\s*座單樁基礎/, r139[0]), num(/The (\d+) monopile foundations/, r139[1])) : NaN;
    const N140 = has('WIND-140') ? pick(num(/把\s*(\d+)\s*具機艙/, byId['WIND-140'].summary[0]), num(/all (\d+) nacelles/, byId['WIND-140'].summary[1])) : NaN;

    if (!sh) {
      if (okAll(c152, has('WIND-152')))
        qs.push({ id: 'a', type: 'mc', q: L('讀卡片 ' + tag('WIND-152') + '：摘要說這片葉片為什麼會從葉根斷裂？', 'Read card ' + tag('WIND-152') + ': according to the summary, why did the blade break off at the root?'),
          opts: [[L('被雷打中', 'It was struck by lightning'), L('摘要沒有提到雷擊。', 'The summary does not mention lightning.')],
            [L('翼梁裡原本就有的舊裂縫越長越大，戰時材料短缺，沒能徹底補強', 'An old crack in the spar had grown, and wartime shortages had prevented full reinforcement')],
            [L('颱風等級的超強風把風機吹倒', 'A typhoon-strength wind blew the turbine over'), w152 ? L('摘要寫葉片是在「' + esc(w152.zh) + '」斷裂，而且斷的是一片葉片，不是整部風機倒下。', 'The summary says the blade broke “' + esc(w152.en) + '”, and only a blade came off — the turbine did not blow over.') : L('摘要說斷的是一片葉片，沒有說是超強風。', 'The summary says a blade broke; it does not mention an extreme wind.')],
            [L('煞車失靈，轉速太快', 'The brake failed and it spun too fast'), L('摘要沒有提到煞車或超速。', 'The summary says nothing about the brake or overspeed.')]],
          a: 1, hint: L('在摘要的括號裡找「裂縫」。', 'Look for “crack” inside the brackets of the summary.'),
          sol: '<p>' + L('摘要寫：', 'The summary says: ') + quote(c152) + L('。舊裂縫越來越長，最後整片葉片自葉根斷裂飛出；這部風機之後沒有再修復。', '. The old crack kept growing until the whole blade snapped off at the root; the turbine was never repaired.') + '</p>' });
      if (okAll(c140, sea140, ash140, aut140) && N140 > 0)
        qs.push({ id: 'b', type: 'mc', q: L('讀卡片 ' + tag('WIND-140') + '：風機的電氣設備出問題後，Vestas 決定怎麼做？摘要給的理由是什麼？', 'Read card ' + tag('WIND-140') + ': after the electrical equipment failed, what did Vestas decide, and what reason does the summary give?'),
          opts: [[L('派船在海上逐部更換變壓器，因為比較省時', 'Send ships to replace the transformers one by one at sea, because it was quicker'), L('摘要寫的是相反的做法：海上作業條件不好，所以改運回岸上。', 'The summary describes the opposite: conditions at sea were poor, so the work moved ashore.')],
            [L('把全部 ' + N140 + ' 具機艙運回岸上整修，因為北海作業條件惡劣', 'Ship all ' + N140 + ' nacelles back to shore for repair, because North Sea conditions hampered the work')],
            [L('拆除整座風場，不再運轉', 'Dismantle the whole wind farm for good'), L('摘要寫整修' + L('「' + esc(aut140.zh) + '」', '') + '，不是拆除。', 'The summary says the repairs were “' + esc(aut140.en) + '” — not a dismantling.')],
            [L('改裝另一家廠商的風機', 'Replace them with another maker\'s turbines'), L('摘要沒有提到換廠商；是 Vestas 自己把機艙運回岸上整修。', 'The summary mentions no other maker; Vestas shipped its own nacelles back for repair.')]],
          a: 1, hint: L('找摘要裡的「北海」和「運回」。', 'Look for “North Sea” and “shipped” in the summary.'),
          sol: '<p>' + L('摘要寫原因是', 'The summary gives the cause as ') + quote(c140) + L('，又因為', '; with ') + quote(sea140) + L('，所以', ', ') + quote(ash140) + L('。海上的修理受海況限制，所以改把機艙全部運回岸上的 Ringkøbing 與 Lem 整修。', '. Repairs at sea were held back by the conditions, so the nacelles were all shipped ashore to Ringkøbing and Lem instead.') + '</p>' });
      if (okAll(c139) && FAC > 0)
        qs.push({ id: 'c', type: 'num', q: L('讀卡片 ' + tag('WIND-139') + '：摘要說設計標準的公式把連接處的軸向承載力「高估約 ' + FAC + ' 倍」（也就是公式算出的值約是真正值的 ' + FAC + ' 倍）。那麼連接處真正能承受的力，大約只有公式算出來的百分之幾？（算到整數）',
            'Read card ' + tag('WIND-139') + ': the summary says the standard\'s formula over-estimated the axial capacity of the connection by a factor of about ' + FAC + '. So the real capacity was about what percent of what the formula gave? (whole number)'),
          ans: 100 / FAC, unit: '%', tol: { abs: 0.6 }, hint: L('公式值是真實值的 ' + FAC + ' 倍，所以真實值 ＝ 公式值 ÷ ' + FAC + '，再換成百分比。', 'The formula value is ' + FAC + ' times the real one, so real = formula ÷ ' + FAC + '; turn that into a percentage.'),
          sol: U.eq('1 ÷ ' + FAC + ' = ' + f(1 / FAC, 2) + ' → ' + f(100 / FAC, 0) + '%') + '<p>' + L('摘要寫：', 'The summary says: ') + quote(c139) + (sl139 ? L('。結果是', '. The result: ') + quote(sl139) : '') + L('。照著有錯的標準設計，連接處只剩以為的一小部分強度。', '. Designed to a wrong standard, the connection had only a small part of the strength it was thought to have.') + '</p>' });
    } else {
      const four = ['WIND-152', 'WIND-140', 'WIND-139', 'WIND-124'];             // 依卡片字母順序 · in card-letter order
      if (four.every(has) && okAll(c152, c139, c140, c124)) {
        const lineup = '<ul style="margin:6px 0 0">' + four.map(id => '<li>' + tag(id) + L('：', ': ') + esc(tx(byId[id].title)) + '</li>').join('') + '</ul>';
        const short = { crack: L('裂縫擴大', 'crack growth'), design: L('設計標準錯誤', 'design-standard error'), elec: L('電氣設備缺陷', 'electrical defects'), insp: L('檢查漏看', 'missed by inspection') };
        const opt = m => four.map((id, i) => LET[id] + ' ' + short[m[i]]).join(L('；', '; '));
        qs.push({ id: 'a', type: 'mc', q: L('把四筆事故配到原因類型（依卡片摘要）：', 'Match the four incidents to cause types (from the card summaries):') + lineup,
          opts: [[opt(['elec', 'crack', 'design', 'insp']), L(LET['WIND-152'] + ' 的摘要寫的是翼梁的舊裂縫延伸；' + LET['WIND-140'] + ' 是變壓器與發電機的問題。', LET['WIND-152'] + '\'s summary is about an old crack in the spar growing; ' + LET['WIND-140'] + ' is about transformers and generators.')],
            [opt(['crack', 'elec', 'design', 'insp'])],
            [opt(['crack', 'design', 'elec', 'insp']), L(LET['WIND-139'] + ' 的原因是標準公式有誤，不是設備缺陷；' + LET['WIND-140'] + ' 也不是結構連接的問題。', LET['WIND-139'] + '\'s cause was an error in the standard, not an equipment defect; ' + LET['WIND-140'] + ' was not a structural-connection problem.')],
            [opt(['crack', 'elec', 'design', 'elec']), L(LET['WIND-124'] + ' 是落雷受損後被月檢漏看，摘要沒有說電氣設備有缺陷。', LET['WIND-124'] + ' was lightning damage missed by the monthly inspection; its summary mentions no equipment defect.')]],
          a: 1, hint: L('每張卡片先找寫原因的那一句，可以用上面的「標出寫原因的句子」核對。', 'In each card find the sentence that gives the cause; the “highlight” button above lets you check.'),
          sol: '<ul>' + four.map(id => '<li>' + tag(id) + ' → <strong style="color:var(--ink)">' + esc(tx(CAT[KEY[id]])) + '</strong>' + L('：', ': ') + quote(ph(id, 'cause')) + '</li>').join('') + '</ul>' });
      }
      if (okAll(c139) && EUR > 0 && NF > 0)
        qs.push({ id: 'b', type: 'num', q: L('卡片 ' + tag('WIND-139') + '：摘要說 ' + NF + ' 座單樁基礎的補救費用是 ' + U.int(EUR * 100) + ' 萬歐元。平均每座基礎要多少千歐元（thousand EUR）？（算到整數）',
            'Card ' + tag('WIND-139') + ': the summary puts the remedial cost for the ' + NF + ' monopile foundations at EUR ' + EUR + ' million. On average, how many thousand euros is that per foundation? (whole number)'),
          ans: EUR * 1000 / NF, unit: L('千歐元', 'thousand EUR'), tol: { abs: 1 }, hint: L(U.int(EUR * 100) + ' 萬 ＝ ' + U.int(EUR * 1000) + ' 千；再除以 ' + NF + '。', 'EUR ' + EUR + ' million = ' + U.int(EUR * 1000) + ' thousand; divide by ' + NF + '.'),
          sol: U.eq(U.int(EUR * 1000) + ' ÷ ' + NF + ' ≈ ' + f(EUR * 1000 / NF, 1) + L(' 千歐元', ' thousand EUR')) + '<p>' + L('這只是把總費用平均分攤的估算；摘要沒有寫每座的實際費用，也沒有寫費用怎麼組成。重點是：設計標準的一個錯誤，讓整批 ' + NF + ' 座基礎都要補救。',
            'This only spreads the total evenly; the summary gives neither a per-foundation figure nor a breakdown. The point: one error in a design standard meant all ' + NF + ' foundations needed remedial work.') + '</p>' });
      if (okAll(c139) && FAC > 0) {
        const SF = 1.5;
        qs.push({ id: 'c', type: 'num', q: L('卡片 ' + tag('WIND-139') + '：假設設計者用那條公式算，讓連接處的承載力是負載的 ' + SF + ' 倍（安全係數 ' + SF + '；這是本題假設的數字，不是 Robin Rigg 的實際設計值）。如果公式把承載力高估約 ' + FAC + ' 倍，真正的「承載力 ÷ 負載」是多少？（算到小數第二位）',
            'Card ' + tag('WIND-139') + ': suppose the designers used that formula to give the connection a capacity ' + SF + ' times the load (a safety factor of ' + SF + ' — a number assumed for this question, not Robin Rigg\'s actual design value). If the formula over-estimated capacity by a factor of about ' + FAC + ', what is the real capacity ÷ load? (two decimals)'),
          ans: SF / FAC, unit: '', tol: { abs: 0.006 }, hint: L('真正的承載力 ＝ 公式值 ÷ ' + FAC + '；公式值 ＝ ' + SF + ' × 負載。', 'Real capacity = formula value ÷ ' + FAC + ', and the formula value = ' + SF + ' × load.'),
          sol: U.eq(SF + ' ÷ ' + FAC + ' = ' + f(SF / FAC, 2)) + '<p>' + L('在這個假設下比值小於 1：照有錯的公式設計，連接處真正的承載力可能比負載還小。實際的設計值與載重摘要沒有寫' + (sl139 ? '；摘要寫的結果是' : ''), 'Under this assumption the ratio is below 1: a connection designed with the wrong formula may really hold less than its load. The summary gives neither the actual design values nor the loads' + (sl139 ? '; the outcome it reports is ' : '')) + (sl139 ? quote(sl139) : '') + L('。安全係數只能保護「算對了」的設計；標準本身錯了，安全係數也救不回來。', '. A safety factor only protects a design whose calculation is right; when the standard itself is wrong, the margin is gone.') + '</p>' });
      }
      if (okAll(st124, eye124, rc124, s125) && has('WIND-125'))
        qs.push({ id: 'd', type: 'mc', q: L('比較卡片 ' + tag('WIND-124') + ' 與 ' + tag('WIND-125') + '：兩筆事故都有感測器或檢查，為什麼還是沒發現損傷？哪一個結論和兩份摘要都相符？',
            'Compare cards ' + tag('WIND-124') + ' and ' + tag('WIND-125') + ': both had sensors or inspections, so why was the damage missed? Which conclusion fits both summaries?'),
          opts: [[L('風機只要沒有自動停機，就代表沒有受損', 'If a turbine has not stopped automatically, it is not damaged'), L('男鹿的摘要寫' + L('「' + esc(st124.zh) + '」', '') + '，葉片其實已經受損。', 'The Oga summary says it was “' + esc(st124.en) + '”, yet the blade was damaged.')],
            [L('葉片有避雷接收器，就不會被雷擊損傷', 'A blade with a lightning receptor cannot be damaged by lightning'), L('摘要寫雷打在' + L('「' + esc(rc124.zh) + '」', '') + '。', 'The summary says the strike hit “' + esc(rc124.en) + '”.')],
            [L('自動保護和感測器都有門檻或盲點，所以檢查要真的看得到損傷，不能只靠它們', 'Automatic protection and sensors have thresholds and blind spots, so inspections must really be able to find damage rather than relying on them')],
            [L('溫度感測器能及早發現所有軸承損傷，所以年度點檢可以省略', 'Temperature sensors catch all bearing damage early, so annual inspections can be skipped'), L('昆布盛的摘要寫' + L('「' + esc(s125.zh) + '」', '') + '，主管機關反而要求年度點檢確認潤滑脂。', 'The Konbumori summary says “' + esc(s125.en) + '”; the regulator asked for grease checks at annual inspections.')]],
          a: 2, hint: L('找兩份摘要裡「門檻」「目視」「溫度感測器」這幾個地方。', 'Look for “automatic stop”, “by eye” and “temperature sensors” in the two summaries.'),
          sol: '<p>' + L('男鹿：', 'Oga: ') + quote(st124) + L('，而且', ', and the inspection ') + quote(eye124) + L('。昆布盛：', '. Konbumori: ') + quote(s125) + L('。兩筆都說明感測器與自動停機有門檻，檢查方式不對也會漏看；損傷沒被及早發現，最後男鹿的葉片斷裂、昆布盛的機艙起火。',
            '. Both show that sensors and automatic stops have thresholds and that the wrong kind of inspection misses damage; the damage was not found in time, and in the end Oga\'s blade broke and Konbumori\'s nacelle caught fire.') + '</p>' });
    }

    /* ---------- 解說、查證、出處 · take-away, verify, sources ---------- */
    const lt = (...ids) => ids.filter(has).map(id => LET[id]).join(L('、', ', ')) || '—';
    const rr = has('WIND-139') ? esc(name('WIND-139')) : '';
    const eurTxt = EUR > 0 ? L('，補救費用 ' + U.int(EUR * 100) + ' 萬歐元', ', with a remedial bill of EUR ' + EUR + ' million') : '';
    const explain = '<p>' + L('這幾起事故的教訓很不一樣：裂縫會越長越大，最後斷裂（' + lt('WIND-152', 'WIND-047') + '）；' + (rr ? '設計標準也可能有錯（' + lt('WIND-139') + '：' + rr + (NF > 0 ? ' 的 ' + NF + ' 座基礎都出了問題' : ' 的基礎出了問題') + '，一年前 Egmond aan Zee 也已出事' + eurTxt + '）；' : '') + '離岸風機出問題時，海況會讓海上修理變困難，只好把機艙全部運回岸上（' + lt('WIND-140') + '）；感測器和檢查有盲點，損傷沒被發現就會擴大（' + lt('WIND-124', 'WIND-125') + '）。',
      'The lessons differ: cracks keep growing until a part breaks (' + lt('WIND-152', 'WIND-047') + '); ' + (rr ? 'a design standard can be wrong (' + lt('WIND-139') + ': ' + rr + (NF > 0 ? '\'s ' + NF + ' foundations all failed' : '\'s foundations failed') + ', as Egmond aan Zee\'s had a year before' + eurTxt + '); ' : '') + 'when offshore turbines go wrong, sea conditions can make repairs at sea so hard that every nacelle is shipped ashore (' + lt('WIND-140') + '); sensors and inspections have blind spots, and damage nobody finds keeps growing (' + lt('WIND-124', 'WIND-125') + ').') + '</p>' +
      '<p>' + L('讀事故報導時，先分清楚「發生了什麼」和「調查認定的原因」：本站的事件資料只寫官方或出處已確認的原因，查不到的就留空，不猜。', 'When reading about an incident, keep “what happened” apart from “what the investigation found”: the site\'s event list records only causes confirmed by officials or the sources, and leaves the rest blank rather than guessing.') + '</p>';
    const verify = EV.map(e => ({ href: '#/global?ev=' + encodeURIComponent(e.id), label: ['地球儀：' + e.title[0], 'Globe: ' + e.title[1]] }))
      .concat(['WIND-140', 'WIND-139'].filter(has).map(id => (byId[id].farms || [])[0]).filter(Boolean).map(fm => ({ href: '#/global?f=' + encodeURIComponent(fm), label: ['地球儀：' + fm + ' 的風場卡片', 'Globe: the ' + fm + ' farm card'] })));
    const sources = [{ label: L('風電風情事件資料 events.json（', 'Wind Watch event list, events.json (') + (M.compiled ? L('整理 ', 'compiled ') + M.compiled : '') + (M.checkedTo ? L('、查證至 ', ', checked to ') + M.checkedTo : '') + L('）', ')'), url: 'https://github.com/dofliu/windfarmTaiwan/blob/main/docs/events' + (WW.lang === 'en' ? '.en' : '') + '.md' }]
      .concat(EV.reduce((a, e) => a.concat((e.src || []).map((u, i) => ({ label: LET[e.id] + ' · ' + (Array.isArray(e.org) ? tx(e.org) : u) + ((e.src || []).length > 1 ? ' [' + (i + 1) + ']' : ''), url: u }))), []));
    return { intro, tool, qs, explain, verify, sources };
  }
});
})();
