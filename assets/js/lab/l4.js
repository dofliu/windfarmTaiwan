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
