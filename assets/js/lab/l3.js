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
