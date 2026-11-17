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
