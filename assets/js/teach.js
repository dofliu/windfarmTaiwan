/* 風電風情 · teach.js — 教師專區 #/teach：課堂活動（連結、QR code、怎麼用）、兩份教案與學習單（#/teach/jh 國中 45 分鐘、#/teach/sh 高中探究與實作 2 節）、投影設定與資料引用
   課綱對應只寫查證過的條文（tools/research/curriculum_2026-10.json，以 check_quotes.py 核對國教院課綱與議題融入說明手冊的原文）；教案裡的數字一律由資料算出或留給學生從網站抄。
   QR code 用 assets/vendor/qrcode-1.4.4.js（MIT，Kazuhiko Arase）在瀏覽器裡產生；頁面可列印（A4，隱藏頁首頁尾），學習單與教師版答案各自分頁。
   The teacher hub: classroom activities with links and QR codes, two lesson plans with worksheets and answer keys (printable, A4), projection tips and citation.
   Curriculum references are only the checked passages; figures in the plans come from the data at render time or are left for students to read off the site. */
(function () {
'use strict';
const WW = window.WW;
const host = document.getElementById('page-teach');
if (!host) return;
const L = WW.L, esc = WW.esc, EN = () => WW.lang === 'en';
const site = h => WW.SITE + h;                       // 給 QR code 與講義用的完整網址（單檔版也指向正式網站）· full URLs for QR codes and handouts
let GEN = null, lastSub = null;

/* ---------- QR code（有載到程式才畫；畫不出來就只留網址）· QR via the vendored encoder ---------- */
function qrSVG(url) {
  try {
    const q = window.qrcode(0, 'M'); q.addData(url); q.make();
    return q.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
  } catch (e) { return ''; }
}

/* ---------- 課堂活動 ---------- */
const ACTS = () => [
  { h: '#/kids', ic: '🧭', who: L('國小高年級、國中', 'Upper primary, junior high'), t: L('8–15 分鐘 / 站', '8–15 min per stop'),
    name: L('探險版：跟著風去旅行', 'Travel with the Wind'),
    how: L('學生用平板或電腦自己走 8 站（1888 年到現在），每站三句重點＋一題；答對在護照蓋章，8 站集滿可印證書。適合分組輪站或回家作業。', 'Students work through 8 stops (1888 to today) on a tablet or computer: three facts and a question per stop; a right answer stamps the passport, and 8 stamps earn a printable certificate. Good for group rotation or homework.') },
  { h: '#/kids/class', ic: '📽', who: L('全班投影', 'Whole class, projected'), t: L('每站 5–8 分鐘', '5–8 min per stop'),
    name: L('全班一起玩（投影模式）', 'Play as a class (projector mode)'),
    how: L('字放大、每站三步「看重點 → 小問題 → 公布答案」。小問題按「倒數 10 秒」讓全班舉手，點最多人選的答案（答錯會說明、可再選）。→ 或簡報器下一頁＝下一步，F＝全螢幕。不蓋章、不記錄任何人的進度。', 'Large type, three steps per stop: facts → question → answer. Start the 10-second countdown, take a show of hands, tap the most popular answer (a wrong one is explained and can be retried). → or a clicker = next, F = full screen. No stamps, no one\'s progress is kept.') },
  { h: '#/kids/taiwan', ic: '🌬', who: L('國小高年級、國中', 'Upper primary, junior high'), t: L('5 分鐘開場', '5-min opener'),
    name: L('台灣此刻的風（每天 5 分鐘）', 'Taiwan\'s wind right now (5 minutes a day)'),
    how: L('上課先看：全台風機此刻發多少電、夠幾萬戶用、這週哪天最有風。數字每 30 分鐘更新，每天都不一樣，是「風力發電要看天氣」最直接的例子。按「唸給我聽」可以讓瀏覽器唸出來。', 'Open the lesson with it: how much Taiwan\'s turbines are making now, how many homes that is, which day this week was windiest. The figures change every 30 minutes, the most direct example of wind depending on the weather. "Read to me" lets the browser read it aloud.') },
  { h: '#/', ic: '📊', who: L('國中、高中', 'Junior and senior high'), t: L('5–10 分鐘', '5–10 min'),
    name: L('首頁：今天的風與本週回顧', 'Home: today\'s wind and the weekly recap'),
    how: L('「今天的風」一句話由資料算出（與過去 7 天比、風正在變強或減弱、台灣附近海面的風速）；「本週風電回顧」把最近 7 天與前 7 天畫成長條，適合討論「為什麼每天不一樣」。', '"Today\'s wind" is one line computed from the data (against the past 7 days, whether the wind is picking up, the wind speed off Taiwan); the weekly recap draws the last 7 days against the 7 before, good for discussing why no two days are alike.') },
  { h: '#/learn/bigger', ic: '🎛', who: L('高中', 'Senior high'), t: L('10–15 分鐘 / 個', '10–15 min each'),
    name: L('動手試試看：功率曲線、尾流、容量因數、成本', 'Hands-on: power curve, wake, capacity factor, costs'),
    how: L('風電知識裡四個拉滑桿的教具：P = ½ρAv³ 的功率曲線（第 9 章）、一排風機的尾流（第 6 章）、用實測資料算容量因數與全球成本下降（第 11 章）。投影時拉滑桿讓全班預測再驗證。', 'Four slider panels in Learn: the P = ½ρAv³ power curve (ch. 9), the wake along a row of turbines (ch. 6), the capacity factor from measured output and the global cost decline (ch. 11). Project them, let the class predict, then drag the slider.') },
  { h: '#/global?tour=tw', ic: '🌍', who: L('國中、高中', 'Junior and senior high'), t: L('10 分鐘', '10 min'),
    name: L('地球儀故事導覽：台灣之路', 'Globe story tour: Taiwan\'s path'),
    how: L('3D 地球儀自動飛到台灣離岸風場，一段一段講從 2017 年示範機到全球第五大離岸市場。另有歐洲（tour=eu）、中國（tour=cn）與浮動式（tour=fl）三條導覽，時間軸可從 1980 年播放。', 'The 3D globe flies to Taiwan\'s offshore farms and tells the story from the 2017 demonstrators to the world\'s fifth-largest offshore market. Europe (tour=eu), China (tour=cn) and floating wind (tour=fl) tours exist too; the timeline plays from 1980.') },
  { h: '#/global?cmp=TWN,DNK,DEU', ic: '⚖', who: L('高中', 'Senior high'), t: L('10 分鐘', '10 min'),
    name: L('國家比較：台灣、丹麥、德國', 'Country comparison: Taiwan, Denmark, Germany'),
    how: L('2–4 個國家並排：累計容量、人均容量、風電占發電比例、全國平均容量因數。可以換國家（網址 cmp= 後面改國碼），討論「為什麼丹麥風電占比這麼高」。', 'Two to four countries side by side: cumulative capacity, per-capita capacity, wind share of generation, national average capacity factor. Swap countries by editing cmp= in the link; discuss why Denmark\'s share is so high.') },
  { h: '#/data', ic: '💾', who: L('高中探究與實作、科展', 'Senior-high inquiry, science fairs'), t: '—',
    name: L('資料下載：CSV 與引用格式', 'Data download: CSV and citation'),
    how: L('每日取樣、各國逐年容量、風場實測年發電量、風場清單等，一鍵下載 CSV（含授權與出處），可直接進試算表畫圖。', 'Daily samples, national capacity by year, measured farm output, the farm list and more as one-click CSVs with licence and source, ready for a spreadsheet.') }
];

function hub() {
  const acts = ACTS().map(a => {
    const url = site(a.h);
    return `<article class="tact"><div class="tqr" aria-hidden="true">${qrSVG(url)}</div><div class="tab">
      <h3><span aria-hidden="true">${a.ic}</span> ${esc(a.name)}</h3><div class="tmeta">${esc(a.who)} · ${esc(a.t)}</div><p>${esc(a.how)}</p>
      <div class="tlinks"><a class="btn sm" href="${a.h}">${L('打開', 'Open')} →</a><code class="turl">${esc(url)}</code></div></div></article>`;
  }).join('');
  return `<div class="wrap teach"><header class="thead"><div class="eyebrow">${L('教師專區', 'For teachers')}</div><h1 class="h2">${L('把風電風情帶進課堂', 'Bringing Wind Watch into the classroom')}</h1>
    <p class="lead">${L('不用帳號、不用安裝：投影、平板或手機打開網址就能用。下面是現成的教案與學習單、每個活動的連結與 QR code，以及投影時的設定。', 'No account, nothing to install: open a link on a projector, tablet or phone. Below are ready-made lesson plans with worksheets, a link and QR code for every activity, and projection tips.')}</p>
    <div class="tchips"><span>${L('國小高年級、國中 → 探險版', 'Upper primary and junior high → Travel with the Wind')}</span><span>${L('高中 → 風電知識與動手教具', 'Senior high → Learn and the hands-on panels')}</span><span>${L('大學通識、科展 → 地球儀與資料下載', 'University courses and science fairs → the globe and the data page')}</span></div></header>

    <h2 class="h3">${L('教案與學習單（可列印）', 'Lesson plans and worksheets (printable)')}</h2>
    <div class="tplans">
      <a class="tplan" href="#/teach/jh"><div class="tpk">${L('國中 · 自然 · 45 分鐘', 'Junior high · Science · 45 min')}</div><h3>${L('台灣的風，現在發多少電？', 'How much power is Taiwan\'s wind making right now?')}</h3>
        <p>${L('用即時資料讀出此刻出力、可供家戶與本週最有風的一天，討論「沒風就沒電」的迷思。對應 Nc-Ⅳ-2、Nc-Ⅳ-4、Nc-Ⅳ-6 與能源教育議題。', 'Read the output now, the homes it serves and the windiest day this week from live data, and discuss the "no wind, no power" myth. Maps to Nc-Ⅳ-2, Nc-Ⅳ-4, Nc-Ⅳ-6 and the energy-education issue.')}</p><span class="tgo">${L('看教案、學習單與答案 →', 'Plan, worksheet and key →')}</span></a>
      <a class="tplan" href="#/teach/sh"><div class="tpk">${L('高中 · 自然科學探究與實作 · 2 節', 'Senior high · Scientific inquiry and practice · 2 periods')}</div><h3>${L('風場真的一直在發電嗎？用實測資料算容量因數', 'Does a wind farm really generate all the time? Capacity factor from measured output')}</h3>
        <p>${L('從地球儀的官方實測年發電量算台灣、丹麥、澳洲、美國風場的容量因數，比較、論證、上台分享。走完發現問題、規劃與研究、論證與建模、表達與分享四個項目。', 'Compute the capacity factor of farms in Taiwan, Denmark, Australia and the US from the globe\'s official measured output, compare, argue and present: the four inquiry items from finding the question to sharing.')}</p><span class="tgo">${L('看教案、學習單與答案 →', 'Plan, worksheet and key →')}</span></a>
    </div>

    <h2 class="h3">${L('課堂活動：連結與 QR code', 'Classroom activities: links and QR codes')}</h2>
    <p class="note">${L('QR code 指向正式網站；投影時讓學生掃描就能在自己的平板打開同一頁。按右上角「列印活動卡」可以印成一張講義。', 'The QR codes point to the public site; students scan them to open the same page on their own tablet. "Print activity cards" at the top right prints a handout.')}</p>
    <div class="tacts">${acts}</div>

    <h2 class="h3">${L('投影與設定', 'Projection and settings')}</h2>
    <ul class="tlist">
      <li>${L('頁首的 ☀ 切換淺色模式，投影與白天的教室比較清楚；瀏覽器會記住。', 'The ☀ button in the header switches to light mode, clearer on a projector or in a bright room; the browser remembers it.')}</li>
      <li>${L('全班一起玩模式按 F 全螢幕；地球儀用滑鼠拖拉轉動、滾輪縮放，手機兩指縮放。', 'Press F for full screen in class mode; drag to spin the globe and scroll to zoom (pinch on phones).')}</li>
      <li>${L('頁首 EN／中文 切換語言，整站包括探險版與教案都有英文版。', 'EN / 中文 in the header switches language; the whole site, the kids page and the plans included, is bilingual.')}</li>
      <li>${L('沒有網路的教室：下載單檔版 HTML（頁尾「專案」），用瀏覽器開啟就能用，即時資料會標示「離線快照」。', 'Classrooms without internet: download the single-file HTML (under "Project" in the footer); it opens in any browser and labels live data as an offline snapshot.')}</li>
      <li>${L('「我附近的風」與探險版的「離我最近的風車」會先問位置權限；位置只在那台裝置上用，不會送出。', '"Wind near me" and the kids\' "nearest turbine" ask for location permission first; the position is used only on that device and never sent.')}</li>
      <li>${L('即時數字是台電開放資料，本站約每 30 分鐘抓一次；頁首有資料時間。本站的每日取樣是估計值，不是官方統計，教案裡都有註明。', 'Live figures are Taipower open data fetched about every 30 minutes; the data time is in the header. The site\'s daily samples are estimates, not official statistics, as the plans note.')}</li>
    </ul>
    <h2 class="h3">${L('資料與引用', 'Data and citation')}</h2>
    <p>${L('學生報告或科展要用本站資料時，請到', 'For student reports and science fairs, the')} <a href="#/data">${L('資料下載', 'data page')}</a>${L('：每個資料集都有出處、授權與建議的引用格式。網站本身的程式、文字與圖表設計保留所有權利，各資料集依其來源授權使用。', ' has every dataset with its source, licence and a suggested citation. The site\'s own code, text and chart design are all rights reserved; each dataset is used under its source\'s licence.')}</p>
    <p class="note">${L('意見或想要的教案主題，歡迎到 GitHub 開 issue：', 'Suggestions and lesson topics are welcome as GitHub issues: ')}<a href="https://github.com/dofliu/windfarmTaiwan/issues" target="_blank" rel="noopener">dofliu/windfarmTaiwan</a></p>
    <div class="tnp tprint"><button class="btn sm" type="button" id="tprint">🖨 ${L('列印活動卡', 'Print activity cards')}</button></div></div>`;
}

/* ---------- 教案共用 ---------- */
const CODES = {                                      // 查證過的課綱與議題條文（原文，tools/research/curriculum_2026-10.json）· checked curriculum passages
  'Nc-Ⅳ-2': ['開發任何一種能源都有風險，應依據證據來評估與決策。', 'Developing any energy source carries risks; evaluate and decide on evidence.'],
  'Nc-Ⅳ-4': ['新興能源的開發，例如：風能、太陽能、核融合發電、汽電共生、生質能、燃料電池等。', 'The development of new energy sources, e.g. wind, solar, fusion, cogeneration, biomass, fuel cells.'],
  'Nc-Ⅳ-6': ['臺灣能源的利用現況與未來展望。', 'Taiwan\'s energy use today and its outlook.'],
  'INa-Ⅳ-4': ['生活中各種能源的特性及其影響。', 'The properties and effects of the energy sources in everyday life.'],
  'CNc-Vc-1': ['新興能源與替代能源在臺灣的發展現況。', 'The state of new and alternative energy in Taiwan.'],
  '能 J1': ['認識國內外能源議題。', 'Know energy issues at home and abroad.'],
  '能 J3': ['了解各式能源應用及創能、儲能與節能的原理。', 'Understand energy applications and the principles of generating, storing and saving energy.'],
  '能 J5': ['了解能源與經濟發展、環境之間相互的影響與關聯。', 'Understand how energy, economic development and the environment affect one another.'],
  '能 J8': ['養成動手做探究能源科技的態度。', 'Develop a hands-on, inquiring attitude to energy technology.'],
  '能 U6': ['理解我國與國際間能源使用情形及未來發展。', 'Understand energy use and its future at home and abroad.'],
  '能 U7': ['分析新興能源的發展現況及未來趨勢。', 'Analyse the state and trends of new energy sources.'],
  '能 U9': ['分析國內外能源政策、措施，並提出自己的看法。', 'Analyse energy policies at home and abroad and form a view.']
};
const codeRows = keys => keys.map(k => `<tr><td><b>${k}</b></td><td>${esc(EN() ? CODES[k][1] : CODES[k][0])}</td></tr>`).join('');
const SRC = L('課綱條文出處：國家教育研究院《十二年國民基本教育課程綱要 國民中小學暨普通型高級中等學校—自然科學領域》（2018）；議題條文出處：《議題融入說明手冊（定稿版）》表 4.6.1（2020）。英文為本站翻譯。',
  'Curriculum passages from the National Academy for Educational Research\'s science curriculum guidelines (2018) and the issues-integration handbook, table 4.6.1 (2020); English translations are the site\'s own.');
const planTop = (sub, kicker, title) => `<div class="tnp tbar"><a class="btn sm" href="#/teach">← ${L('教師專區', 'For teachers')}</a><a class="btn sm" href="#/teach/${sub === 'jh' ? 'sh' : 'jh'}">${sub === 'jh' ? L('高中教案', 'Senior-high plan') : L('國中教案', 'Junior-high plan')} →</a><span class="tsp"></span><button class="btn sm" type="button" id="tprint">🖨 ${L('列印／存成 PDF', 'Print / save as PDF')}</button></div>
  <div class="eyebrow">${kicker}</div><h1 class="h2">${title}</h1>`;
const tbl = (head, rows) => `<div class="ttw" tabindex="0" role="region" aria-label="${esc(head.join(' / '))}"><table class="ttbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const blank = n => `<span class="tblank" style="min-width:${n || 60}px"></span>`;
const lines = n => Array.from({ length: n }, () => '<div class="tline"></div>').join('');
const box = (title, body) => `<section class="tsec"><h2 class="h3">${title}</h2>${body}</section>`;

/* ---------- 國中教案（45 分鐘） ---------- */
function planJH() {
  const sum = tbl([L('項目', 'Item'), L('內容', 'Content')], [
    [L('對象', 'Students'), L('國中七至九年級（自然科學／理化；國小高年級也可用探險版部分）', 'Junior high (science); upper primary can use the kids-page part')],
    [L('時間', 'Time'), L('45 分鐘（1 節）', '45 minutes (one period)')],
    [L('課綱對應', 'Curriculum'), L('自然科學領域學習內容 Nc-Ⅳ-2、Nc-Ⅳ-4、Nc-Ⅳ-6、INa-Ⅳ-4；跨科概念「資源與永續性」', 'Science learning content Nc-Ⅳ-2, Nc-Ⅳ-4, Nc-Ⅳ-6, INa-Ⅳ-4; cross-cutting concept "resources and sustainability"')],
    [L('議題融入', 'Issue integration'), L('能源教育 能 J1、能 J3、能 J5', 'Energy education 能 J1, 能 J3, 能 J5')],
    [L('設備', 'Equipment'), L('投影機與網路；學生平板或手機（選用，每組一台）；學習單每人一張', 'Projector and internet; one tablet or phone per group (optional); one worksheet per student')],
    [L('網頁', 'Pages'), `<a href="#/">${site('#/')}</a><br><a href="#/kids/taiwan">${site('#/kids/taiwan')}</a><br><a href="#/global?r=TWN">${site('#/global?r=TWN')}</a>`]
  ]);
  const goals = `<ol class="tol"><li>${L('能從即時資料讀出台灣風電此刻的出力、約可供多少家戶，以及占全國發電的比例。', 'Read Taiwan\'s wind output right now, roughly how many homes it serves and its share of national generation from live data.')}</li>
    <li>${L('能用一週的資料說明風力發電量為什麼每天不一樣（風速、天氣、季節）。', 'Use a week of data to explain why wind output differs from day to day (wind speed, weather, season).')}</li>
    <li>${L('能用證據回應「沒風就沒電，所以風電沒用」的說法，說出風電與其他電源互補的概念。', 'Answer the claim "no wind, no power, so wind is useless" with evidence, and describe how wind complements other sources.')}</li></ol>`;
  const flow = tbl([L('時間', 'Min'), L('活動', 'Activity'), L('教師', 'Teacher'), L('學生', 'Students'), L('工具', 'Tool')], [
    ['5', L('引起動機', 'Hook'), L('投影首頁，讀出「今天的風」那一句與此刻 MW 數，問：這個數字一小時後會一樣嗎？', 'Project Home, read the "today\'s wind" line and the MW figure; ask: will it be the same in an hour?'), L('猜測、舉手', 'Guess, show of hands'), `<a href="#/">#/</a>`],
    ['10', L('台灣此刻的風', 'Taiwan right now'), L('打開探險版「台灣此刻的風」，帶著讀：此刻出力、可供幾萬戶、這 7 天風最大的時候是現在的幾倍、幾座風場在發電。', 'Open the kids page "Taiwan\'s wind right now": output now, homes, how many times the week\'s peak is, how many farms are generating.'), L('填學習單第 1 題', 'Fill worksheet Q1'), `<a href="#/kids/taiwan">#/kids/taiwan</a>`],
    ['10', L('這一週的風', 'This week'), L('回到首頁「本週風電回顧」：最有風與最安靜的一天差幾倍？最高瞬間是什麼時候？請學生說可能的原因（東北季風、鋒面、颱風前後）。', 'Home, "This week in Taiwan\'s wind": how many times the calmest day is the windiest; when the peak was. Ask for likely causes (monsoon, fronts, typhoons).'), L('填第 2 題，分組討論', 'Fill Q2, group discussion'), `<a href="#/">#/</a>`],
    ['10', L('風場在哪裡', 'Where the farms are'), L('地球儀聚焦台灣（r=TWN）：離岸風場都在西岸的台灣海峽；點一座風場看卡片（容量、風機大小、水下基礎）。有平板的組自己操作。', 'Globe focused on Taiwan (r=TWN): the offshore farms sit in the Strait off the west coast; open a farm card (capacity, turbine size, foundation). Groups with tablets explore themselves.'), L('填第 3 題', 'Fill Q3'), `<a href="#/global?r=TWN">#/global?r=TWN</a>`],
    ['7', L('迷思討論', 'The myth'), L('提問：「沒風就沒電，所以風電沒用」對嗎？引導用今天看到的數字回答：風大時發很多、風小時靠其他電源，冬天風大、夏天太陽能強。', 'Ask whether "no wind, no power, so wind is useless" holds; steer students to today\'s figures: lots on windy days, other sources on calm days, wind in winter and solar in summer.'), L('填第 4 題（主張＋證據）', 'Fill Q4 (claim + evidence)'), ''],
    ['3', L('總結與延伸', 'Wrap-up'), L('回收學習單；延伸作業：探險版走完 8 站、集滿章印證書。', 'Collect worksheets; homework: finish the 8 stops and print the certificate.'), '', `<a href="#/kids">#/kids</a>`]
  ]);
  const assess = `<ul class="tlist"><li>${L('學習單第 1–3 題：能正確抄錄與換算資料（形成性）。', 'Worksheet Q1–3: reads and converts the data correctly (formative).')}</li><li>${L('第 4 題：主張是否有資料當證據、是否提到互補（三等第：有主張有證據有互補／有主張有證據／只有主張）。', 'Q4: a claim backed by data, mentioning complementarity (three levels: claim + evidence + complementarity / claim + evidence / claim only).')}</li></ul>`;
  const notes = `<ul class="tlist"><li>${L('即時數字來自台電開放資料，本站約每 30 分鐘抓一次；頁首寫資料時間。若資料時間落後好幾小時，改用首頁「本週風電回顧」，它不受影響。', 'Live figures are Taipower open data fetched about every 30 minutes; the header shows the data time. If it lags by hours, use the weekly recap on Home instead.')}</li>
    <li>${L('「可供幾萬戶」是以每戶平均 0.5 kW 估算的換算，不是真的供電給那些家戶；本週回顧與「這 7 天風最大的時候」是本站取樣估計，不是官方統計。', '"Homes supplied" is a conversion at 0.5 kW per home, not actual delivery; the weekly recap and the 7-day peak are the site\'s sampled estimates, not official statistics.')}</li>
    <li>${L('風很小的日子（可用率 10% 以下）剛好是討論互補的好材料；風很大的日子可以多看「風正在變強」與附近海面的風速。', 'A calm day (availability under 10%) is good material for complementarity; on a windy day look at "the wind is picking up" and the sea wind speed.')}</li>
    <li>${L('投影用淺色模式（頁首 ☀）；沒有網路時用單檔版。', 'Use light mode (☀ in the header) for projection; the single-file copy works without internet.')}</li></ul>`;
  const ws = `<div class="tws"><div class="twh"><b>${L('學習單：台灣的風，現在發多少電？', 'Worksheet: how much power is Taiwan\'s wind making right now?')}</b><span>${L('班級', 'Class')} ${blank(50)} ${L('姓名', 'Name')} ${blank(80)} ${L('日期', 'Date')} ${blank(70)}</span></div>
    <ol class="tq">
      <li>${L('台灣此刻的風（探險版「台灣此刻的風」）', 'Taiwan right now (kids page "Taiwan\'s wind right now")')}<br>${L('資料時間', 'Data time')} ${blank(90)}　${L('全台風機此刻發出', 'Output now')} ${blank(60)} MW　${L('約可供', 'about')} ${blank(50)} ${L('萬戶', '×10,000 homes')}<br>${L('全台', 'Of Taiwan\'s')} ${blank(40)} ${L('座風場，', 'farms,')} ${blank(40)} ${L('座正在發電。這 7 天風最大的時候是現在的', 'are generating. The week\'s peak was')} ${blank(40)} ${L('倍。', 'times now.')}</li>
      <li>${L('這一週的風（首頁「本週風電回顧」）', 'This week (Home, weekly recap)')}<br>${L('最有風的一天', 'Windiest day')} ${blank(50)} ${L('平均', 'average')} ${blank(60)} MW${L('；', '; ')}${L('最安靜的一天', 'calmest day')} ${blank(50)} ${L('平均', 'average')} ${blank(60)} MW<br>${L('最有風是最安靜的', 'The windiest was')} ${blank(40)} ${L('倍。最高瞬間', 'times the calmest. Highest moment')} ${blank(60)} MW（${blank(80)}）<br>${L('為什麼每天不一樣？寫出兩個可能的原因：', 'Why do the days differ? Give two likely reasons:')}${lines(2)}</li>
      <li>${L('風場在哪裡（地球儀 r=TWN）', 'Where the farms are (globe, r=TWN)')}<br>${L('台灣的離岸風場主要在', 'Taiwan\'s offshore farms are mainly in')} ${blank(120)}${L('。', '. ')}${L('我點開的風場：', 'The farm I opened:')} ${blank(120)}${L('，', ', ')}${L('容量', 'capacity')} ${blank(60)} MW${L('，', ', ')}${L('一部風機', 'one turbine')} ${blank(50)} MW${L('。', '.')}</li>
      <li>${L('有人說：「沒風就沒電，所以風電沒用。」你同意嗎？用今天看到的數字當證據，寫出你的主張、證據與理由。', 'Someone says "no wind, no power, so wind is useless." Do you agree? Write your claim, evidence from today\'s figures, and reasoning.')}${lines(4)}</li>
    </ol></div>`;
  const key = `<div class="tkey"><h2 class="h3">${L('教師版：答案與說明', 'Teacher\'s key and notes')}</h2>
    <ol class="tol"><li>${L('第 1 題的數字每次上課都不同，批改時看資料時間與數字是否一致（可用當時的網站或頁首的資料時間核對）。「倍」是 7 天最高 ÷ 此刻，整數即可。', 'Q1 differs every lesson; check that the data time and figures agree (compare with the site at the time). "Times" is the 7-day peak ÷ now, whole numbers are fine.')}</li>
      <li>${L('第 2 題原因（參考）：東北季風強弱、鋒面或颱風前後、白天與夜晚的差別、風機維修或停機。重點是說出「風速」與「天氣」。', 'Q2 reference causes: the north-east monsoon, fronts or typhoons, day–night differences, turbine maintenance. The key words are "wind speed" and "weather".')}</li>
      <li>${L('第 3 題：台灣海峽（西岸外海，苗栗、彰化、雲林外海）；風場與風機的數字以卡片為準。', 'Q3: the Taiwan Strait off the west coast (Miaoli, Changhua, Yunlin); farm and turbine figures as on the card.')}</li>
      <li>${L('第 4 題參考答案：不同意。證據：這週最有風的一天發電是最安靜那天的 __ 倍，說明風電有時很多、有時很少；但風小的時候台電用燃氣、水力、太陽能與儲能補上，冬天風大剛好補夏天太陽能強的空檔，所以是「搭配」而不是「沒用」。給分看是否有主張、有數字、有互補。', 'Q4 reference: disagree. Evidence: the windiest day made __ times the calmest, so wind is sometimes plentiful and sometimes scarce; on calm days Taipower uses gas, hydro, solar and storage, and winter wind fills the gap of summer solar, so wind "complements" rather than "is useless". Mark for a claim, a figure and complementarity.')}</li></ol>
    <p class="note">${esc(SRC)}</p></div>`;
  return `<div class="wrap teach tplanv">${planTop('jh', L('國中 · 自然 · 45 分鐘', 'Junior high · Science · 45 min'), L('台灣的風，現在發多少電？', 'How much power is Taiwan\'s wind making right now?'))}
    ${box(L('教案摘要', 'Summary'), sum)}${box(L('學習目標', 'Learning goals'), goals)}${box(L('課綱與議題對應（原文）', 'Curriculum and issue references (original wording)'), tbl([L('代碼', 'Code'), L('條文', 'Passage')], []).replace('<tbody></tbody>', '<tbody>' + codeRows(['Nc-Ⅳ-2', 'Nc-Ⅳ-4', 'Nc-Ⅳ-6', 'INa-Ⅳ-4', '能 J1', '能 J3', '能 J5']) + '</tbody>'))}
    ${box(L('教學流程', 'Lesson flow'), flow)}${box(L('評量', 'Assessment'), assess)}${box(L('教師備註', 'Teacher notes'), notes)}
    <div class="pb"></div>${ws}<div class="pb"></div>${key}</div>`;
}

/* ---------- 高中探究與實作（2 節） ---------- */
function exampleRows() {                             // 教師版範例：從 generation.json 取最新完整年度的實測值 · worked examples from measured output
  if (!GEN) return '';
  const pick = ['TWN|Dayuan Guanyuan', 'TWN|Taichung Port', 'DNK|Anholt', 'DNK|Horns Rev 1', 'AUS|Bald Hills wind farm', 'USA|Sweetwater'];
  const rows = [];
  pick.forEach(k => { const f = GEN.farms[k]; if (!f) return; const ys = Object.keys(f.y).sort(), y = ys[ys.length - 1], [gwh, cf] = f.y[y], hrs = (+y % 4 === 0 && (+y % 100 !== 0 || +y % 400 === 0)) ? 8784 : 8760;
    rows.push([esc(k.split('|')[1]), k.slice(0, 3), WW.num(f.mw, 1), y, WW.num(gwh, 1), WW.int(hrs), (gwh * 1000 / (f.mw * hrs) * 100).toFixed(1) + '%', cf + '%']); });
  return tbl([L('風場', 'Farm'), L('國家', 'Country'), L('容量 MW', 'Capacity MW'), L('年', 'Year'), L('年發電量 GWh', 'Generation GWh'), L('時數', 'Hours'), L('計算的容量因數', 'Computed CF'), L('網站標示', 'Site')], rows);
}
function cfRange() {                                 // 本站實測值的分布（由資料算，不寫死）· the spread of the site's measured factors, computed
  if (!GEN) return L('有實測值的風場，容量因數的分布會在資料載入後顯示。', 'The spread of measured capacity factors appears once the data has loaded.');
  const v = Object.values(GEN.farms).map(f => { const ys = Object.keys(f.y).sort(); return f.y[ys[ys.length - 1]][1]; }).filter(x => typeof x === 'number').sort((a, b) => a - b);
  if (v.length < 8) return '';
  const q = p => v[Math.floor((v.length - 1) * p)];
  return L(`本站有官方實測值的 ${WW.int(v.length)} 座風場（最新一年），容量因數中間一半落在 ${q(.25)}–${q(.75)}%，中位數 ${q(.5)}%；台灣部分小型陸域風場較低，可討論機齡與地點。`,
    `Across the ${WW.int(v.length)} farms with official measured output on this site (latest year), the middle half of capacity factors lies between ${q(.25)} and ${q(.75)}% (median ${q(.5)}%); some small onshore farms in Taiwan are lower, a chance to discuss age and site.`);
}
function planSH() {
  const sum = tbl([L('項目', 'Item'), L('內容', 'Content')], [
    [L('對象', 'Students'), L('高中一、二年級「自然科學探究與實作」；也可用於物理（能量）或化學（CNc-Vc-1）的課題', 'Senior high years 1–2, "Scientific inquiry and practice"; also usable as a topic in physics (energy) or chemistry (CNc-Vc-1)')],
    [L('時間', 'Time'), L('2 節（100 分鐘），可拆兩週', '2 periods (100 minutes), can be split over two weeks')],
    [L('探究學習內容', 'Inquiry content'), L('發現問題、規劃與研究、論證與建模、表達與分享（四個主要項目）；實作：資料蒐集與分析、歸納與解釋、論證與作結論', 'The four items: finding the question, planning and research, argument and modelling, expression and sharing; practice: data collection and analysis, generalisation and interpretation, argument and conclusion')],
    [L('跨科概念', 'Cross-cutting concepts'), L('系統與尺度、資源與永續性', 'Systems and scale; resources and sustainability')],
    [L('課綱與議題', 'Curriculum and issues'), L('化學 CNc-Vc-1；能源教育 能 U6、能 U7、能 U9', 'Chemistry CNc-Vc-1; energy education 能 U6, 能 U7, 能 U9')],
    [L('設備', 'Equipment'), L('每組一台電腦或平板；計算機；海報紙或簡報；學習單每人一張', 'One computer or tablet per group; calculators; poster paper or slides; one worksheet per student')],
    [L('網頁', 'Pages'), `<a href="#/learn/why">${site('#/learn/why')}</a>（${L('容量因數教具', 'capacity-factor panel')}）<br><a href="#/global?out=TWN.cf">${site('#/global?out=TWN.cf')}</a>（${L('台灣；USA、DNK、AUS 同理', 'Taiwan; USA, DNK, AUS likewise')}）<br><a href="#/data">${site('#/data')}</a>（CSV）`]
  ]);
  const goals = `<ol class="tol"><li>${L('能定義容量因數＝一年實際發電量 ÷（裝置容量 × 當年時數），並用實測資料算出來。', 'Define capacity factor = yearly generation ÷ (capacity × hours in the year) and compute it from measured data.')}</li>
    <li>${L('能比較不同國家、陸域與離岸風場的容量因數，提出差異的可能原因並指出資料的限制（限電、年份、只有部分風場有數字）。', 'Compare capacity factors across countries and onshore/offshore, propose reasons for the differences and name the data\'s limits (curtailment, year, only some farms measured).')}</li>
    <li>${L('能以「主張—證據—推理」論證風電在電力系統中的角色，並以口頭或海報分享。', 'Argue wind\'s role in the power system as claim–evidence–reasoning, and present it orally or on a poster.')}</li></ol>`;
  const flow = tbl([L('節 / 分', 'Period / min'), L('探究項目', 'Inquiry item'), L('活動', 'Activity'), L('工具', 'Tool')], [
    ['1 / 10', L('發現問題', 'Finding the question'), L('投影首頁此刻出力與全台裝置容量（台灣即時儀表）。問：裝置容量約 4,500 MW（2025 年底，能源署統計）的風電，一年發多少電？如果「滿載一整年」會是多少？讓各組先估。', 'Project the output now and Taiwan\'s installed capacity (live dashboard). Ask: how much electricity does about 4,500 MW of wind (end of 2025, Energy Administration) make in a year? What if it ran flat out all year? Groups estimate first.'), `<a href="#/live">#/live</a>`],
    ['1 / 15', L('概念建立', 'The concept'), L('用風電知識第 11 章的容量因數教具示範：選一座風場，看「發電量 ÷（容量 × 時數）」怎麼得到百分比；拉滑桿看整年以 X% 運轉會發多少度。', 'Demonstrate with the capacity-factor panel in Learn chapter 11: pick a farm, see how generation ÷ (capacity × hours) gives the percentage; drag the slider for "X% all year".'), `<a href="#/learn/why">#/learn/why</a>`],
    ['1 / 25', L('規劃與研究', 'Planning and research'), L('每組選 4 座有官方實測值的風場（台灣 2、國外 2，陸域與離岸各至少 1），從地球儀「發電表現」或資料下載頁取得容量、年份與年發電量，自己算容量因數並與網站標示比對。', 'Each group picks 4 farms with official measured output (2 in Taiwan, 2 abroad, at least one onshore and one offshore), takes capacity, year and generation from the globe\'s Output dialog or the data page, computes the factor and checks it against the site.'), `<a href="#/global?out=TWN.cf">#/global?out=TWN.cf</a> · <a href="#/data">#/data</a>`],
    ['2 / 25', L('論證與建模', 'Argument and modelling'), L('比較各組結果：離岸是否高於陸域？台灣與丹麥、澳洲差多少？討論原因（風況、機型新舊、限電、年份）。延伸：把台灣風電總容量乘上各組算出的容量因數，估一年發電量；與台灣即時頁「占全國發電」的比例對照。', 'Compare across groups: is offshore above onshore? How far apart are Taiwan, Denmark and Australia? Discuss causes (wind resource, turbine age, curtailment, year). Extension: multiply Taiwan\'s wind capacity by the group\'s factor to estimate a year\'s generation, and compare with the live page\'s share of national generation.'), `<a href="#/live">#/live</a>`],
    ['2 / 20', L('表達與分享', 'Expression and sharing'), L('每組 3 分鐘：主張、證據（表格）、推理、資料的限制。其他組用評量表互評。', 'Three minutes per group: claim, evidence (the table), reasoning, limits of the data. Peer assessment with the rubric.'), ''],
    ['2 / 5', L('總結', 'Wrap-up'), L('回到「風場真的一直在發電嗎？」：平均只有三到五成，所以電力系統要有多種電源與儲能。', 'Back to the question: only 30–50% on average, which is why a power system needs several sources and storage.'), '']
  ]);
  const rubric = tbl([L('向度', 'Dimension'), L('3 分', '3'), L('2 分', '2'), L('1 分', '1')], [
    [L('資料與計算', 'Data and computation'), L('4 座風場齊全、計算正確、與網站標示相符', 'All 4 farms, correct computation, matches the site'), L('有小錯或少一座', 'Minor errors or one farm missing'), L('資料不全或計算有誤', 'Incomplete or wrong')],
    [L('比較與解釋', 'Comparison and explanation'), L('指出差異並提出兩個以上合理原因', 'Names the differences with two or more plausible causes'), L('有差異、一個原因', 'Differences, one cause'), L('只列數字', 'Figures only')],
    [L('論證', 'Argument'), L('主張、證據、推理齊全且一致', 'Claim, evidence and reasoning present and consistent'), L('缺一項', 'One missing'), L('只有主張', 'Claim only')],
    [L('資料限制', 'Limits of the data'), L('說出限電、年份或樣本等至少兩項', 'Names at least two (curtailment, year, sample)'), L('一項', 'One'), L('沒有', 'None')]
  ]);
  const notes = `<ul class="tlist"><li>${L('只用官方實測值：美國（EIA-923）、台灣台電自有風場（台電開放資料）、丹麥（能源署）、澳洲（AEMO，含限電）。台灣民營風場沒有逐場官方數字，本站的「即時取樣」是估計，不能拿來當實測。', 'Use only official measured values: USA (EIA-923), Taipower-owned farms (Taipower open data), Denmark (the energy agency), Australia (AEMO, curtailment included). Private Taiwanese farms have no official per-farm figures; the site\'s live samples are estimates, not measurements.')}</li>
    <li>${L('時數：平年 8,760、閏年 8,784。網站只列整年運轉的年份。', 'Hours: 8,760 in a common year, 8,784 in a leap year. The site lists full years only.')}</li>
    <li>${cfRange()}</li>
    <li>${L('延伸題的「台灣風電總容量」用台灣即時儀表的「裝置容量」；比例對照用同一頁的「占全國發電」。', 'For the extension use "installed capacity" on the live dashboard and compare with its "share of national generation".')}</li></ul>`;
  const ws = `<div class="tws"><div class="twh"><b>${L('學習單：風場真的一直在發電嗎？', 'Worksheet: does a wind farm really generate all the time?')}</b><span>${L('組別', 'Group')} ${blank(40)} ${L('姓名', 'Name')} ${blank(80)} ${L('日期', 'Date')} ${blank(70)}</span></div>
    <ol class="tq">
      <li>${L('發現問題：台灣風電裝置容量約', 'The question: Taiwan has about')} ${blank(60)} MW${L('（台灣即時儀表）。如果滿載一整年，發電量＝容量 × 8,760 小時 ＝', ' of wind (live dashboard). Flat out all year, generation = capacity × 8,760 h =')} ${blank(90)} MWh${L('。', '. ')}${L('我猜實際只有滿載的', 'I think the real figure is')} ${blank(40)}%${L('。', ' of that.')}</li>
      <li>${L('概念：容量因數 ＝', 'The concept: capacity factor =')} ${blank(100)} ÷ (${blank(80)} × ${blank(60)})${L('。', '. ')}${L('教具裡示範的風場：', 'The farm shown in the panel:')} ${blank(120)}${L('，', ', ')}${L('容量因數', 'capacity factor')} ${blank(40)}%${L('。', '.')}</li>
      <li>${L('規劃與研究：我們這組的 4 座風場（台灣 2、國外 2；至少 1 陸域、1 離岸）', 'Research: our group\'s 4 farms (2 Taiwan, 2 abroad; at least one onshore and one offshore)')}
        ${tbl([L('風場', 'Farm'), L('國家', 'Country'), L('陸域／離岸', 'On/offshore'), L('容量 MW', 'MW'), L('年', 'Year'), L('年發電量 GWh', 'GWh'), L('時數', 'Hours'), L('容量因數', 'CF'), L('網站標示', 'Site')], [1, 2, 3, 4].map(() => Array(9).fill('&nbsp;')))}
        ${L('計算：容量因數 ＝ 發電量(GWh) × 1,000 ÷（容量(MW) × 時數）。', 'Compute: CF = GWh × 1,000 ÷ (MW × hours).')}</li>
      <li>${L('論證與建模：離岸比陸域高嗎？台灣和國外差多少？寫出兩個可能的原因，以及這些資料的限制（例如含限電、只有某一年、只有部分風場有數字）。', 'Argument: is offshore higher than onshore? How far apart are Taiwan and abroad? Give two likely causes and the limits of the data (curtailment, one year only, only some farms measured).')}${lines(4)}</li>
      <li>${L('延伸：台灣風電總容量', 'Extension: Taiwan\'s wind capacity')} ${blank(60)} MW × ${L('我們算的平均容量因數', 'our average CF')} ${blank(40)}% × 8,760 h ＝ ${blank(90)} MWh ${L('一年。台灣即時頁此刻「占全國發電」', 'a year. The live page\'s share of national generation now is')} ${blank(40)}%${L('。', '.')}</li>
      <li>${L('表達與分享：我們的主張', 'Sharing: our claim')}${lines(1)}${L('證據', 'Evidence')}${lines(1)}${L('推理', 'Reasoning')}${lines(2)}</li>
    </ol></div>`;
  const key = `<div class="tkey"><h2 class="h3">${L('教師版：範例計算與說明', 'Teacher\'s key: worked examples and notes')}</h2>
    <p>${L('下表由網站的實測資料即時算出（最新一個完整年度），列印時間', 'The table is computed from the site\'s measured data at render time (latest full year), printed')} ${new Date().toLocaleDateString(EN() ? 'en-GB' : 'zh-TW')}${L('；學生選的風場不同，數字也不同，批改以「計算與網站標示一致」為準。', '; students\' farms differ, so mark on agreement between the computation and the site.')}</p>
    ${exampleRows() || `<p class="note">${L('（實測資料載入中或載入失敗，請重新整理）', '(measured data still loading or unavailable; reload)')}</p>`}
    <ol class="tol"><li>${L('第 1 題：滿載一年 ＝ 容量 × 8,760；學生的猜測不評對錯，課後回頭對照。', 'Q1: flat out all year = capacity × 8,760; the guess is not marked, revisit it at the end.')}</li>
      <li>${L('第 4 題參考原因：離岸風速較高且穩定；丹麥、澳洲風況與台灣不同；機型新舊與單機容量；限電（澳洲實測含限電）；季節（台灣冬季東北季風）。限制：只有某些年份、只有部分風場有官方數字、台灣民營風場沒有。', 'Q4 reference causes: offshore wind is stronger and steadier; Danish and Australian wind resources differ from Taiwan\'s; turbine age and size; curtailment (Australian values include it); season (Taiwan\'s winter monsoon). Limits: certain years only, only some farms measured, no private Taiwanese farms.')}</li>
      <li>${L('第 5 題：結果通常是容量的三到五成；與「占全國發電」比較時提醒那是瞬間值，不是全年。', 'Q5: usually 30–50% of capacity; when comparing with the share of national generation, note it is an instantaneous value, not a yearly one.')}</li></ol>
    <h3 class="h3">${L('評量表（小組互評與教師評量共用）', 'Rubric (peer and teacher assessment)')}</h3>${rubric}
    <p class="note">${esc(SRC)}</p></div>`;
  return `<div class="wrap teach tplanv">${planTop('sh', L('高中 · 自然科學探究與實作 · 2 節', 'Senior high · Scientific inquiry and practice · 2 periods'), L('風場真的一直在發電嗎？用實測資料算容量因數', 'Does a wind farm really generate all the time? Capacity factor from measured output'))}
    ${box(L('教案摘要', 'Summary'), sum)}${box(L('學習目標', 'Learning goals'), goals)}${box(L('課綱與議題對應（原文）', 'Curriculum and issue references (original wording)'), tbl([L('代碼', 'Code'), L('條文', 'Passage')], []).replace('<tbody></tbody>', '<tbody>' + codeRows(['CNc-Vc-1', '能 U6', '能 U7', '能 U9']) + '</tbody>'))}
    ${box(L('教學流程', 'Lesson flow'), flow)}${box(L('評量', 'Assessment'), L('<p>學習單（第 3 題的表格與第 4、6 題的論證）＋口頭分享，用教師版的評量表。課綱建議以科學報告之撰寫及口頭表達做為高層次能力的總結性評量。</p>', '<p>The worksheet (the table in Q3, the arguments in Q4 and Q6) plus the oral presentation, scored with the rubric in the key. The guidelines recommend written reports and oral presentation as the summative assessment of higher-order abilities.</p>'))}${box(L('教師備註', 'Teacher notes'), notes)}
    <div class="pb"></div>${ws}<div class="pb"></div>${key}</div>`;
}

/* ---------- 掛載 ---------- */
function paint(sub) {
  lastSub = sub;
  host.innerHTML = sub === 'jh' ? planJH() : sub === 'sh' ? planSH() : hub();
  const p = document.getElementById('tprint'); if (p) p.onclick = () => window.print();
  if (sub === 'sh' && !GEN) WW.getJSON(WW.DATA.generation).then(J => { GEN = J; if (WW.currentPage() === 'teach' && lastSub === 'sh') paint('sh'); }).catch(() => {});
  window.scrollTo(0, 0);
}
WW.teach = {
  enter(r) { paint(r.sub === 'jh' || r.sub === 'sh' ? r.sub : null); },
  leave() {}
};
WW.onLang(() => { if (WW.currentPage() === 'teach') paint(lastSub); });
})();
