/* 風電風情 · lab.js — 國高中探究版「風電實驗室」#/lab（使用者 2026-11-17 決定：同一套 8 關、國中／高中兩種難度、全部完成發證書）
   #/lab 首頁（選難度、8 關）· #/lab/level?n=1–8 一關 · #/lab/cert 證書（可列印）；網址加 lv=jh 或 lv=sh 指定難度。
   每關：情境 → 動手（滑桿或資料）→ 問題（選擇題與數值題，答錯給提示，兩次後可看解法）→ 全部答對才過關 → 解說與「在網站上查證」。
   關卡內容在 lab-levels.js（WW.lab.add 註冊）；題目裡的數字一律由網站資料當場算出，物理模型寫明假設與出處。進度只記在這台裝置的瀏覽器。
   The secondary-school "Wind Lab": eight levels, junior/senior difficulty, a printable certificate once all eight are done at one difficulty.
   Levels live in lab-levels.js; every figure in a question is computed from the site's data at render time. Progress stays in this browser. */
(function () {
'use strict';
const WW = window.WW;
const page = document.getElementById('page-lab');
if (!page) return;
const L = WW.L, esc = WW.esc, EN = () => WW.lang === 'en';
const $ = id => document.getElementById(id);

/* ---------------- 進度 · progress (this browser only) ---------------- */
const KEY = 'wf_lab';
let P = {};
try { P = JSON.parse(WW.store.get(KEY, 'null')) || {}; } catch (e) { P = {}; }
['jh', 'sh'].forEach(k => { if (!Array.isArray(P[k])) P[k] = []; P[k] = P[k].filter(n => n >= 1 && n <= 8); });
if (P.lv !== 'sh') P.lv = 'jh';
if (!P.done || typeof P.done !== 'object') P.done = {};
const save = () => WW.store.set(KEY, JSON.stringify(P));
const passed = (n, lv) => P[lv || P.lv].includes(n);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const LVN = { jh: ['國中', 'Junior high'], sh: ['高中', 'Senior high'] };
const lvName = lv => L(LVN[lv][0], LVN[lv][1]);

/* ---------------- 關卡登錄 · level registry ---------------- */
const LEVELS = [];
const lvAt = n => LEVELS.find(x => x.n === n);

/* ---------------- 給關卡用的小工具 · helpers for the level files ---------------- */
const f = (v, d) => WW.num(v, d == null ? 1 : d);
const U = {
  L, esc, EN, f, int: WW.int,
  /* 滑桿：id 在同一關內唯一；fmt 把數值轉成顯示文字 */
  slider: (id, label, min, max, step, val, fmt) => '<label class="lbs"><span class="lbk">' + label + '<output id="lb-' + id + '-o">' + fmt(val) + '</output></span>' +
    '<input type="range" id="lb-' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>',
  /* 綁定滑桿：S[id] 隨滑桿更新，接著呼叫 draw() */
  bind: (root, S, fmts, draw) => {
    root.querySelectorAll('input[type=range][id^="lb-"]').forEach(r => {
      const k = r.id.slice(3);
      r.oninput = () => { S[k] = +r.value; const o = root.querySelector('#lb-' + k + '-o'); if (o) o.textContent = fmts[k](S[k]); draw(); };
    });
  },
  chip: (k, v) => '<span class="lbchip"><span>' + k + '</span><b>' + v + '</b></span>',
  /* 公式區塊（等寬、可讀出）· a formula line */
  eq: s => '<div class="lbeq">' + s + '</div>',
  link: (href, text) => '<a href="' + esc(href) + '"' + (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a>',
  hours: y => (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 8784 : 8760
};

/* ---------------- 資料 · data (loaded per level as needed) ---------------- */
const DATA = {}, loading = {};
function need(keys) {
  return Promise.all((keys || []).map(k => {
    if (k === 'live') return Promise.resolve(WW.live || null);
    if (DATA[k]) return DATA[k];
    loading[k] = loading[k] || (k === 'global' ? WW.globalData() : WW.getJSON(WW.DATA[k])).then(d => (DATA[k] = d));
    return loading[k];
  })).then(() => DATA);
}

/* ---------------- 版面 · shell ---------------- */
let view = 'home', curN = 1;
const QS = {};                                        // 作答狀態：`${lv}:${n}` → { ok: {qid: true}, tries: {qid: n}, shown: {qid: true} }
const qstate = (n, lv) => QS[lv + ':' + n] || (QS[lv + ':' + n] = { ok: {}, tries: {}, shown: {} });

function lvSwitch() {
  return '<div class="lbseg" role="group" aria-label="' + esc(L('難度', 'Difficulty')) + '">' + ['jh', 'sh'].map(k =>
    '<button type="button" data-lv="' + k + '" aria-pressed="' + (P.lv === k) + '">' + lvName(k) + '</button>').join('') + '</div>';
}
function dots() {
  return '<nav class="lbdots" aria-label="' + esc(L('八關', 'Eight levels')) + '">' + LEVELS.map(x =>
    '<a href="#/lab/level?n=' + x.n + '" class="lbdot' + (passed(x.n) ? ' ok' : '') + (view === 'level' && x.n === curN ? ' cur' : '') + '"' +
    (view === 'level' && x.n === curN ? ' aria-current="page"' : '') + ' aria-label="' +
    esc(L('第 ' + x.n + ' 關：' + x.title[0], 'Level ' + x.n + ': ' + x.title[1]) + (passed(x.n) ? L('（已完成）', ' (done)') : '')) + '">' + x.n + '</a>').join('') + '</nav>';
}
function topbar() {
  return '<div class="lbtop"><a class="lbbrand" href="#/lab">' + L('風電實驗室', 'Wind Lab') + '<small>' + L('國高中探究版', 'for secondary school') + '</small></a>' +
    dots() + '<div class="lbtr">' + lvSwitch() + '<a class="btn sm" href="#/lab/cert">' + L('證書 ', 'Certificate ') + P[P.lv].length + '/8</a></div></div>';
}

/* 首頁 · home */
function viewHome() {
  const cnt = P[P.lv].length;
  page.innerHTML = '<div class="wrap lbwrap">' + topbar() +
    '<header class="lbhero"><div class="eyebrow">' + L('國中・高中 · 8 關探究', 'Junior & senior high · 8 inquiry levels') + '</div>' +
    '<h1 class="h2">' + L('風電實驗室', 'Wind Lab') + '</h1>' +
    '<p class="lblead">' + L('每一關一個問題：先動手試，再到網站的真實資料裡找證據、算出答案。題目的數字都是網站資料當場算出來的，答錯會給提示。同一個難度 8 關都過，就能印出證書。',
      'One question per level: try it hands-on, then find evidence in the site\'s real data and work out the answer. Every figure is computed from the data on the spot, and wrong answers get a hint. Pass all 8 at one difficulty to print a certificate.') + '</p>' +
    '<div class="lbpick">' + ['jh', 'sh'].map(k => '<button type="button" class="lbpk' + (P.lv === k ? ' on' : '') + '" data-lv="' + k + '" aria-pressed="' + (P.lv === k) + '"><b>' + lvName(k) + '</b><span>' +
      (k === 'jh' ? L('讀資料、比大小、算比例與百分比', 'Read data, compare, work out ratios and percentages') : L('用公式推導、估算、討論假設與誤差', 'Derive with formulas, estimate, discuss assumptions and error')) +
      '</span><i>' + L('完成 ', 'Done ') + P[k].length + '/8</i></button>').join('') + '</div>' +
    '<div class="lbprog" role="progressbar" aria-valuemin="0" aria-valuemax="8" aria-valuenow="' + cnt + '" aria-label="' + esc(L(lvName(P.lv) + '進度', lvName(P.lv) + ' progress')) + '"><i style="width:' + (cnt / 8 * 100) + '%"></i></div>' +
    '</header><ol class="lbgrid">' + LEVELS.map(x => '<li><a class="lbcard' + (passed(x.n) ? ' ok' : '') + '" href="#/lab/level?n=' + x.n + '">' +
      '<span class="lbno">' + x.n + '</span><b>' + esc(L(x.title[0], x.title[1])) + '</b><span>' + esc(L(x.hook[0], x.hook[1])) + '</span>' +
      '<i class="lbst">' + ['jh', 'sh'].map(k => '<span class="' + (passed(x.n, k) ? 'y' : '') + '">' + lvName(k) + (passed(x.n, k) ? ' ✓' : '') + '</span>').join('') + '</i></a></li>').join('') + '</ol>' +
    (cnt === 8 ? '<p><a class="btn hist" href="#/lab/cert">' + L('8 關都完成了：印出證書', 'All 8 done: print your certificate') + '</a></p>' : '') +
    '<section class="lbteach"><h2 class="h3">' + L('給老師', 'For teachers') + '</h2><p>' +
      L('可以讓學生個人或分組走完 8 關（每關約 10–15 分鐘），國中選「國中」、高中選「高中」；也可以投影某一關帶全班討論。對應的課綱學習內容（Nc-Ⅳ-2、Nc-Ⅳ-4、Nc-Ⅳ-6、INa-Ⅳ-4、CNc-Vc-1）與能源教育議題（能 J3、能 J8、能 U7）原文與教案見 ',
        'Students can work through the 8 levels alone or in groups (about 10–15 minutes each), choosing Junior or Senior high; or project one level for a class discussion. The curriculum content (Nc-Ⅳ-2, Nc-Ⅳ-4, Nc-Ⅳ-6, INa-Ⅳ-4, CNc-Vc-1) and energy-education issues (能 J3, 能 J8, 能 U7), with lesson plans, are in ') +
      '<a href="#/teach">' + L('教師專區', 'the teacher hub') + '</a>' + L('。年紀小一點的學生可以先玩', '. Younger students can start with ') + '<a href="#/kids">' + L('探險版「跟著風去旅行」', '“Travel with the Wind”') + '</a>' + L('。', '.') + '</p>' +
      '<p class="note">' + L('數字都來自風電風情網站的資料（各關列出出處）；物理模型是簡化模型，題目會寫明假設。進度只記在這台裝置的瀏覽器裡，不用註冊。',
        'All figures come from Wind Watch\'s data (each level lists its sources); the physics models are simplified and the questions state their assumptions. Progress stays in this browser, with no sign-up.') + '</p></section></div>';
}

/* 一關 · one level */
function qHTML(q, i, st) {
  const ok = st.ok[q.id], tries = st.tries[q.id] || 0, show = ok || st.shown[q.id];
  let inp;
  if (q.type === 'mc') {
    inp = '<div class="lbopts" role="radiogroup" aria-labelledby="lbq-' + q.id + '">' + q.opts.map((o, k) =>
      '<label class="lbopt"><input type="radio" name="lbq-' + q.id + '" value="' + k + '"' + (ok && k === q.a ? ' checked' : '') + (ok ? ' disabled' : '') + '><span>' + o[0] + '</span></label>').join('') + '</div>';
  } else {
    inp = '<div class="lbnum"><input type="text" inputmode="decimal" autocomplete="off" id="lbin-' + q.id + '" aria-labelledby="lbq-' + q.id + '"' + (ok ? ' disabled value="' + esc(String(q.shown != null ? q.shown : q.ans)) + '"' : '') + '>' +
      (q.unit ? '<span class="lbu">' + q.unit + '</span>' : '') + '</div>';
  }
  return '<li class="lbq' + (ok ? ' ok' : '') + '" data-q="' + q.id + '"><div class="lbqt" id="lbq-' + q.id + '"><span class="lbqn">' + (i + 1) + '</span><div>' + q.q + '</div></div>' + inp +
    '<div class="lbqa">' + (ok ? '' : '<button type="button" class="btn sm" data-check="' + q.id + '">' + L('檢查答案', 'Check') + '</button>') +
    (!ok && tries >= 2 && !st.shown[q.id] ? '<button type="button" class="btn sm ghost" data-sol="' + q.id + '">' + L('看解法', 'Show the solution') + '</button>' : '') + '</div>' +
    '<div class="lbfb" aria-live="polite">' + (ok ? '<p class="lbgood">✓ ' + L('答對了！', 'Correct!') + '</p>' : '') + (show && q.sol ? '<div class="lbsol"><b>' + L('解法', 'Solution') + '</b>' + q.sol + '</div>' : '') + '</div></li>';
}
let CUR = null;                                       // 目前這一關建好的內容 · the built level on screen
function viewLevel(n) {
  const x = lvAt(n);
  if (!x) { viewHome(); return; }
  const lv = P.lv, st = qstate(n, lv);
  page.innerHTML = '<div class="wrap lbwrap">' + topbar() + '<p class="note">' + L('載入資料…', 'Loading data…') + '</p></div>';
  need(x.need).then(D => {
    if (view !== 'level' || curN !== n || P.lv !== lv || WW.currentPage() !== 'lab') return;
    let B;
    try { B = x.build({ lv, sh: lv === 'sh', D, U }); }
    catch (e) { console.error(e); page.querySelector('.note').textContent = L('這一關的資料讀取失敗，請重新整理。', 'This level\'s data failed to load. Please reload.'); return; }
    CUR = { n, lv, B };
    const all = B.qs.every(q => st.ok[q.id]);
    const prev = n > 1 ? '<a class="btn sm" href="#/lab/level?n=' + (n - 1) + '">← ' + L('上一關', 'Previous') + '</a>' : '<a class="btn sm" href="#/lab">← ' + L('風電實驗室', 'Wind Lab') + '</a>';
    const next = n < 8 ? '<a class="btn sm' + (all ? ' hist' : '') + '" href="#/lab/level?n=' + (n + 1) + '">' + L('下一關', 'Next') + ' →</a>' : '<a class="btn sm' + (all ? ' hist' : '') + '" href="#/lab/cert">' + L('證書', 'Certificate') + ' →</a>';
    page.innerHTML = '<div class="wrap lbwrap">' + topbar() +
      '<article class="lblevel"><header class="lbh"><div class="eyebrow">' + L('第 ' + n + ' 關 / 8 · ' + lvName(lv), 'Level ' + n + ' / 8 · ' + lvName(lv)) + '</div>' +
        '<h1 class="h2">' + esc(L(x.title[0], x.title[1])) + '</h1><p class="lbhook">' + esc(L(x.hook[0], x.hook[1])) + '</p></header>' +
      '<section class="lbsec"><h2 class="h3">' + L('情境', 'The question') + '</h2>' + B.intro + '</section>' +
      (B.tool ? '<section class="lbsec lbtool"><h2 class="h3">' + L('動手試試看', 'Try it') + '</h2><div id="lbtool">' + B.tool.html + '</div></section>' : '') +
      '<section class="lbsec"><h2 class="h3">' + L('問題', 'Questions') + '</h2><ol class="lbqs">' + B.qs.map((q, i) => qHTML(q, i, st)).join('') + '</ol>' +
        '<div class="lbpass" id="lbpass" aria-live="polite">' + (all ? passHTML(n) : '') + '</div></section>' +
      (all && B.explain ? '<section class="lbsec lbexp"><h2 class="h3">' + L('想一想：這一關學到什麼', 'Take-away') + '</h2>' + B.explain + '</section>' : '') +
      '<section class="lbsec lbsrc"><h2 class="h3">' + L('在網站上查證', 'Check it on the site') + '</h2><ul class="lbver">' + (B.verify || []).map(v => '<li><a href="' + esc(v.href) + '">' + esc(L(v.label[0], v.label[1])) + '</a></li>').join('') + '</ul>' +
        ((B.sources || []).length ? '<p class="note">' + L('資料與模型出處：', 'Data and model sources: ') + B.sources.map(s => U.link(s.url, esc(s.label))).join('；') + '</p>' : '') + '</section>' +
      '<nav class="lbnav">' + prev + next + '</nav></article></div>';
    if (B.tool && B.tool.mount) B.tool.mount($('lbtool'));
  }).catch(e => {
    console.error(e);
    const nt = page.querySelector('.note'); if (nt) nt.textContent = L('資料載入失敗，請檢查網路後重新整理。', 'The data failed to load. Check your connection and reload.');
  });
}
function passHTML(n) {
  const c = P[P.lv].length;
  return '<p class="lbgood lbbig">🎉 ' + L('第 ' + n + ' 關完成！', 'Level ' + n + ' complete!') + ' ' + (c === 8
    ? '<a href="#/lab/cert">' + L(lvName(P.lv) + '的 8 關都完成了，印出證書', 'All 8 ' + lvName(P.lv).toLowerCase() + ' levels done: print your certificate') + '</a>'
    : L('（' + lvName(P.lv) + '已完成 ' + c + '/8）', '(' + lvName(P.lv) + ': ' + c + '/8 done)')) + '</p>';
}
const parseNum = s => {
  const t = String(s || '').trim().replace(/[\s,，]/g, '').replace(/[％%]$/, '').replace('－', '-').replace('．', '.');
  return /^-?\d*\.?\d+(e-?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
};
function check(qid) {
  if (!CUR) return;
  const q = CUR.B.qs.find(z => z.id === qid), st = qstate(CUR.n, CUR.lv);
  const li = page.querySelector('.lbq[data-q="' + qid + '"]'), fb = li.querySelector('.lbfb');
  let good = false, msg = '';
  if (q.type === 'mc') {
    const sel = li.querySelector('input[type=radio]:checked');
    if (!sel) { fb.innerHTML = '<p class="lbbad">' + L('先選一個答案。', 'Pick an answer first.') + '</p>'; return; }
    const k = +sel.value; good = k === q.a;
    if (!good) msg = (q.opts[k][1] || '') + (q.hint ? ' ' + q.hint : '');
  } else {
    const inp = li.querySelector('input'), v = parseNum(inp.value);
    if (isNaN(v)) { fb.innerHTML = '<p class="lbbad">' + L('請輸入一個數字（可以有小數點）。', 'Enter a number (decimals are fine).') + '</p>'; return; }
    const tol = q.tol || {}, d = Math.abs(v - q.ans);
    good = d <= (tol.abs != null ? tol.abs : 0) + (tol.rel != null ? Math.abs(q.ans) * tol.rel : 0) + 1e-9;
    if (!good) msg = (v > q.ans ? L('太大了。', 'Too high.') : L('太小了。', 'Too low.')) + ' ' + (q.hint || '');
  }
  if (good) {
    st.ok[qid] = true;
    if (q.type === 'num') q.shown = li.querySelector('input').value;
    li.outerHTML = qHTML(q, CUR.B.qs.indexOf(q), st);
    const all = CUR.B.qs.every(z => st.ok[z.id]);
    if (all) {
      if (!P[CUR.lv].includes(CUR.n)) { P[CUR.lv].push(CUR.n); P[CUR.lv].sort((a, b) => a - b); if (P[CUR.lv].length === 8 && !P.done[CUR.lv]) P.done[CUR.lv] = today(); save(); }
      viewLevel(CUR.n);                                // 重畫：解說、下一關按鈕與上方進度 · redraw with the take-away
      setTimeout(() => { const p = $('lbpass'); if (p) p.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
    } else {
      const nx = page.querySelector('.lbq:not(.ok) input:not([disabled])'); if (nx) nx.focus();
    }
  } else {
    st.tries[qid] = (st.tries[qid] || 0) + 1;
    fb.innerHTML = '<p class="lbbad">✗ ' + L('還不對。', 'Not yet.') + ' ' + msg + '</p>';
    if (st.tries[qid] >= 2 && !li.querySelector('[data-sol]')) li.querySelector('.lbqa').insertAdjacentHTML('beforeend', '<button type="button" class="btn sm ghost" data-sol="' + qid + '">' + L('看解法', 'Show the solution') + '</button>');
  }
}

/* 證書 · certificate */
function viewCert() {
  const lv = P.lv, c = P[lv].length, done = c === 8;
  const nm = (P.name || '').trim();
  page.innerHTML = '<div class="wrap lbwrap">' + topbar() + (done
    ? '<div class="lbcbar"><label>' + L('證書上的名字', 'Name on the certificate') + ' <input id="lbname" maxlength="24" value="' + esc(nm) + '" placeholder="' + esc(L('寫上你的名字', 'Your name')) + '"></label>' +
      '<button type="button" class="btn hist" id="lbprint">' + L('列印證書', 'Print the certificate') + '</button></div>' +
      '<div class="lbcert" role="group" aria-label="' + esc(L('完成證書', 'Certificate')) + '"><div class="lbc-in">' +
        '<div class="lbc-k">' + L('風電風情 · 風電實驗室', 'Wind Watch · Wind Lab') + '</div><h1>' + L('探究完成證書', 'Certificate of Inquiry') + '</h1>' +
        '<div class="lbc-lv">' + L(lvName(lv) + '組', lvName(lv) + ' level') + '</div>' +
        '<p class="lbc-name" id="lbcname">' + (esc(nm) || '&nbsp;') + '</p>' +
        '<p class="lbc-t">' + L('完成了風電實驗室全部 8 關探究：從風的能量、風機放大、容量因數、尾流、離岸基礎、台灣即時出力、成本下降到事故教訓，用網站的真實資料找證據、算出答案。',
          'completed all 8 inquiry levels of the Wind Lab — wind energy, scaling up, capacity factor, wakes, offshore foundations, Taiwan\'s live output, falling costs and lessons from incidents — finding evidence and working out answers from real data.') + '</p>' +
        '<ol class="lbc-list">' + LEVELS.map(x => '<li>✓ ' + esc(L(x.title[0], x.title[1])) + '</li>').join('') + '</ol>' +
        '<div class="lbc-foot"><span>' + L('完成日期：', 'Completed: ') + esc(P.done[lv] || today()) + '</span><span>' + L('國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室', 'National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu') + '</span></div>' +
      '</div></div>'
    : '<section class="lbsec"><h1 class="h2">' + L('完成證書', 'Certificate') + '</h1><p>' + L(lvName(lv) + '已完成 ' + c + '/8 關。8 關都過了就能在這裡寫上名字、印出證書。還沒完成的：', lvName(lv) + ': ' + c + ' of 8 levels done. Finish all 8 to put your name on the certificate and print it. Still to do:') + '</p>' +
      '<ul class="lbver">' + LEVELS.filter(x => !passed(x.n)).map(x => '<li><a href="#/lab/level?n=' + x.n + '">' + L('第 ' + x.n + ' 關：', 'Level ' + x.n + ': ') + esc(L(x.title[0], x.title[1])) + '</a></li>').join('') + '</ul></section>') + '</div>';
  if (done) {
    const inp = $('lbname');
    inp.oninput = () => { P.name = inp.value.slice(0, 24); save(); $('lbcname').innerHTML = esc(P.name.trim()) || '&nbsp;'; };
    $('lbprint').onclick = () => window.print();
  }
}

/* ---------------- 事件 · events ---------------- */
page.addEventListener('click', e => {
  const b = e.target.closest('[data-lv]');
  if (b) { const k = b.dataset.lv; if (k !== P.lv) { P.lv = k; save(); render(); } return; }
  const c = e.target.closest('[data-check]'); if (c) { check(c.dataset.check); return; }
  const s = e.target.closest('[data-sol]');
  if (s && CUR) { const st = qstate(CUR.n, CUR.lv); st.shown[s.dataset.sol] = true; const q = CUR.B.qs.find(z => z.id === s.dataset.sol), li = s.closest('.lbq'); li.outerHTML = qHTML(q, CUR.B.qs.indexOf(q), st); }
});
page.addEventListener('keydown', e => {                // 數值題按 Enter 直接檢查 · Enter checks a numeric answer
  if (e.key !== 'Enter') return;
  const li = e.target.closest && e.target.closest('.lbq');
  if (li && e.target.tagName === 'INPUT' && e.target.type === 'text') { e.preventDefault(); check(li.dataset.q); }
});

/* ---------------- 路由 · routing ---------------- */
function render() {
  if (view === 'level') viewLevel(curN);
  else if (view === 'cert') viewCert();
  else viewHome();
}
WW.lab = {
  add(def) { if (!lvAt(def.n)) { LEVELS.push(def); LEVELS.sort((a, b) => a.n - b.n); } },
  enter(r) {
    if (r.params.lv === 'jh' || r.params.lv === 'sh') { P.lv = r.params.lv; save(); }
    view = r.sub === 'level' ? 'level' : r.sub === 'cert' ? 'cert' : 'home';
    curN = Math.max(1, Math.min(8, parseInt(r.params.n, 10) || 1));
    CUR = null; render(); window.scrollTo(0, 0);
  },
  leave() { CUR = null; },
  api: () => ({ P, LEVELS, QS, DATA, need, U, cur: () => CUR })
};
WW.onLang(() => { if (WW.currentPage() === 'lab') render(); });
})();
