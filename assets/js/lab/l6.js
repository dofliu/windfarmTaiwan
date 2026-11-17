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
