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
