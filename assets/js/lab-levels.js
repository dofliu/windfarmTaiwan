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
