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
