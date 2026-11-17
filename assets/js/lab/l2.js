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
