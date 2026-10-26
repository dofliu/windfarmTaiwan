#!/usr/bin/env node
/* 冒煙測試 · Smoke test (Playwright + Chromium)

  python3 -m http.server 8000 &                       # 先開本機預覽 · serve the repo first
  node tools/smoke_test.js [http://localhost:8000/] [--standalone] [--shots 目錄]

1. 網站各頁（首頁、台灣即時的儀表／風場牆／數據／地圖、全球地球儀、風場卡片、發電表現、風電知識）以桌機與手機寬度各走一次：
   不能有頁面錯誤、console 錯誤（外部網站連不上的除外）或橫向捲動；地球儀要畫出來、風場卡片與發電表現要有內容；
   儀表精簡檢視最多 8 張「此刻在發電」卡片、切到全部卡片要等於全部風場；儀表篩選要寫進網址與瀏覽器、「恢復預設」要清掉；
   詳情的下一座要換風場，返回鍵（地球儀資訊卡也一樣）只關掉詳情、不離開頁面；地圖要有衛星地圖或離線簡圖；首頁要有 7 天出力曲線、頁尾四組來源連結；
   風電知識的四個「動手試試看」要畫出來、拉滑桿要有反應；嵌入小卡（#/embed）不能有頁首頁尾；手機的風電知識捲到某章時要有「目前章節」列；探險版要畫出地球與 8 個站點，答錯不蓋章、答對蓋章並出現下一站，護照要記得，
   有「唸給我聽」；全班一起玩要走得完三步（→ 鍵）且不動個人進度；集滿 8 個章要能列印護照、打開寫著名字的完成證書。
2. --standalone：standalone/ 的兩個單檔版（先跑 tools/build_standalone.py、tools/build_globe_lite.py）以 file:// 開啟，
   連網與離線（擋掉所有 http/https 請求）各一次：不能有頁面錯誤，離線時完整版的即時資料要標示「離線快照」、地圖改畫離線簡圖，完整版的探險版地球要有 8 個站點。
3. 無障礙：裝了 axe-core（npm install axe-core，或環境變數 AXE_CORE 指到 axe.min.js；沒裝就略過並提示）時，每一頁以 WCAG 2.1 A／AA 與最佳做法規則檢查，
   首頁、台灣即時、風電知識、排程狀態另以淺色模式再查一次（對比）；首頁用 Tab 走過前 14 個焦點，每個都要看得到、有焦點框，第一個是「跳到主要內容」且 Enter 後焦點到 #main；
   減少動態效果（prefers-reduced-motion）下首頁、台灣即時與探險版不能有任何 CSS 動畫在跑。
4. 效能預算：tools/perf_budget.json 列出的每一頁各以全新的分頁打開（桌機寬度），同源傳輸量（未壓縮）不能超過預算。
有錯誤時結束碼為 1。GitHub Actions 的 pr-check 在每個 PR 跑這支（.github/workflows/pr-check.yml）。

1. Walks every page (home, the four Taiwan live tabs, the globe, a farm card, the Output dialog, Learn) at desktop and phone widths:
   no page errors, no console errors (except unreachable external sites), no horizontal scrolling; the globe must draw, the farm
   card and Output dialog must have content, the dashboard's compact view must show at most 8 generating cards and its all-cards view every farm,
   dashboard filters must reach the URL and storage and Reset must clear them, the drawer's next button must change farm and Back must close
   only the drawer (likewise the globe's info card), the map tab must show the map
   or the offline sketch, the home page must have the 7-day curve and the four footer source groups, and on phones Learn must
   show the current-chapter bar inside a chapter; Learn's four hands-on lessons must render and respond to a slider; the embeddable card (#/embed) must hide the header and footer; the kids page must draw its globe with 8 stops, stamp only a right answer, offer the next stop, keep
   the stamp in the passport and offer read-aloud; its class mode must step through with the → key without touching personal progress, and with
   all 8 stamps the passport must offer printing and a certificate carrying the name.
2. --standalone: opens both single-file copies in standalone/ over file:// online and offline (all http/https blocked): no page errors,
   and offline the full copy must label its live data as an offline snapshot and draw the sketch map; the full copy's kids globe must show 8 stops.
3. Accessibility: with axe-core installed (npm install axe-core, or AXE_CORE pointing at axe.min.js; skipped with a notice otherwise) every page is checked
   against the WCAG 2.1 A/AA and best-practice rules, and Home, Taiwan live, Learn and the status page again in light mode (contrast); on Home, Tab
   through the first 14 focus stops, each visible with a focus ring, the first being "Skip to content" which moves focus to #main on Enter;
   under prefers-reduced-motion Home, Taiwan live and the kids page must have no CSS animation running.
4. Performance budget: each page in tools/perf_budget.json is opened in a fresh tab (desktop width) and its same-origin bytes (uncompressed) must stay under budget.
Exits with 1 on any error. The pr-check workflow runs it on every pull request.
*/
const path = require('path');
const fs = require('fs');

function playwright() {
  try { return require('playwright'); } catch (e) {          // 本機：全域安裝的 Playwright · fall back to a global install
    const root = require('child_process').execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  }
}
const { chromium } = playwright();
const args = process.argv.slice(2);
const base = (args.find(a => /^https?:/.test(a)) || 'http://localhost:8000/').replace(/\/?$/, '/');
const shotsAt = args.indexOf('--shots'), shots = shotsAt >= 0 ? args[shotsAt + 1] : null;
const ROOT = path.resolve(__dirname, '..');
const LAUNCH = { args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] };
// 外部網站（地圖圖磚、Commons 照片、即時資料備援）連不上不算網站錯誤 · unreachable external resources are not site errors
const NET = /ERR_CERT|ERR_NAME|ERR_CONNECTION|ERR_INTERNET|ERR_TIMED_OUT|net::ERR|ERR_FAILED|429|403|Failed to load resource|CORS policy/;

// axe-core：repo 的 node_modules、全域安裝或環境變數 AXE_CORE；沒有就略過 · axe-core from node_modules, a global install or AXE_CORE; optional
function axeSource() {
  const cands = [process.env.AXE_CORE, path.join(ROOT, 'node_modules/axe-core/axe.min.js')];
  try { cands.push(path.join(require('child_process').execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'axe-core/axe.min.js')); } catch (e) {}
  for (const c of cands) if (c && fs.existsSync(c)) return fs.readFileSync(c, 'utf8');
  return null;
}
const AXE = axeSource();
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const LIGHT = ['#/', '#/live', '#/learn', '#/status'];                      // 淺色模式也查（對比）· checked in light mode too
async function axeCheck(page, label) {
  if (!AXE) return [];
  if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({ content: AXE });
  const v = await page.evaluate(async tags => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: tags } });
    return r.violations.map(x => `${x.impact} ${x.id} ×${x.nodes.length}: ${x.help} (${x.nodes[0].target.join(' ')})`);
  }, AXE_TAGS);
  return v.map(x => 'axe' + (label ? ' ' + label : '') + ': ' + x);
}
const BUDGET = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/perf_budget.json'), 'utf8'));

// [路由, 等待毫秒, 檢查（在頁面裡執行，回傳錯誤字串或空字串）]
const ROUTES = [
  ['#/', 3500, async () => {
    // 首頁：過去 7 天的出力曲線、頁尾四組來源連結 · home: 7-day curve and the four footer source groups
    if (!document.querySelector('#hh-7d svg .ln')) return 'home: no 7-day output curve';
    // 今天的風（由資料算出的大標）、三種分享圖卡、淺色模式切換 · today's headline, the three share-card formats, the light-mode toggle
    if (!document.querySelector('#hh-today .tmain')) return 'home: no today headline';
    if (!document.getElementById('nearbtn') || !document.getElementById('nearbox').hidden) return 'home: wind-near-me button missing or opened without a press';
    // 本週風電回顧：兩週長條、重點與方形週報圖卡 · the weekly recap: bars, highlights and the square weekly card
    if (document.getElementById('hweek').hidden || document.querySelectorAll('#hweek .wkbars .wkc').length !== 7 || !document.querySelector('#hweek .wkchips li')) return 'home: weekly recap missing';
    const wk = await WW.weekCard(); if (wk.width !== 1080 || wk.height !== 1080) return 'weekly card size ' + wk.width;
    for (const [f, w, h] of [['square', 1080, 1080], ['wide', 1200, 630], ['story', 1080, 1920]]) {
      const cv = WW.drawTodayCard(f, null, []); if (cv.width !== w || cv.height !== h) return 'share card ' + f + ': ' + cv.width + '×' + cv.height;
    }
    const tb = document.getElementById('themebtn'); tb.click();
    const lt = document.documentElement.dataset.theme === 'light' && getComputedStyle(document.body).color === 'rgb(13, 27, 46)'; tb.click();
    if (!lt || document.documentElement.dataset.theme) return 'light mode toggle';
    const g = [...document.querySelectorAll('.sitefoot .fsrc dt a')].map(a => a.getAttribute('href'));
    return g.length === 4 && g.every(h => /^#\/learn\/sources\?s=/.test(h)) ? '' : 'footer: source groups ' + g.join(' ');
  }],
  ['#/live', 4000, async () => {
    // 儀表精簡檢視：此刻在發電最多 8 張卡、沒出力的收成名稱；切到全部卡片要等於全部風場 · compact view vs the all-cards view
    const q = s => document.querySelectorAll('#groups ' + s).length, tg = document.querySelector('#groups .fulltoggle');
    if (!q('.fcard') && !q('.fchip')) return 'dashboard: no farms';
    // 「可供家戶」卡片點一下換一種東西比，五種輪一圈回到家戶 · the conversion card cycles through five comparisons
    const cv = () => document.querySelector('#lv-conv .ik') && document.querySelector('#lv-conv .ik').textContent, seen = new Set([cv()]);
    for (let i = 0; i < 5; i++) { document.getElementById('lv-conv').click(); seen.add(cv()); }
    if (seen.size !== 5) return 'conversion card: ' + seen.size + ' distinct comparisons';
    if (tg) {                                             // 風場不多時直接列全部卡片 · few farms: all cards already
      if (q('.genhead:not(.off) + .fgrid .fcard') > 8) return 'dashboard: more than 8 cards in the compact view';
      const mb = document.querySelector('#groups .genmore .fulltoggle'), more = mb ? parseInt(mb.textContent.match(/\d+/)[0], 10) : 0;
      const shown = q('.fcard') + q('.fchip');
      tg.click(); const n = q('.fcard'); document.querySelector('#groups .fulltoggle').click();
      if (n !== shown + more) return `dashboard: all-cards view has ${n} cards, expected ${shown + more}`;
    }
    // 篩選寫進網址並記住，「恢復預設」清掉 · filters go into the URL and storage; Reset clears them
    const wait = ms => new Promise(r => setTimeout(r, ms));
    document.querySelector('#filt .chip[data-f=offshore]').click();
    if (!/[?&]type=offshore/.test(location.hash) || !/"offshore"/.test(localStorage.getItem('wf_live_view') || '')) return 'dashboard: filter not in the URL or storage: ' + location.hash;
    document.getElementById('tbreset').click();
    if (location.hash !== '#/live') return 'dashboard: Reset left ' + location.hash;
    // 詳情：下一座、返回鍵只關掉詳情 · drawer: next farm, and Back closes only the drawer
    document.querySelector('#groups [data-id]').click(); await wait(500);
    const n0 = document.getElementById('dname').textContent;
    if (!(history.state && history.state.wwLayer === 'ldrawer')) return 'drawer: no history entry for Back';
    document.getElementById('dnext').click();
    if (document.getElementById('dname').textContent === n0 || !/[?&]farm=/.test(location.hash)) return 'drawer: next farm did not open';
    history.back(); await wait(700);
    if (document.getElementById('drawer').classList.contains('is-on') || document.body.dataset.page !== 'live' || location.hash !== '#/live') return 'drawer: Back did not close it on the page: ' + location.hash;
    return '';
  }],
  ['#/live/wall', 3500],
  ['#/live/charts', 4000],
  ['#/live/map', 4000, () => {
    // 衛星地圖，或地圖元件載不到時的離線簡圖 · Leaflet map, or the offline sketch when it cannot load
    return document.querySelector('#map.leaflet-container') || document.querySelectorAll('#map .fbdot').length ? '' : 'map: neither the map nor the offline sketch';
  }],
  ['#/global', 15000, async () => {
    if (!document.querySelector('canvas')) return 'globe: no canvas';
    // 第一次沒帶參數：四張任務卡，點「探索」關掉並開始播放 · first-visit task cards
    const w = document.querySelector('#g-welcome');
    if (!w || w.hidden || w.querySelectorAll('.wcard').length !== 4) return 'welcome: task cards missing';
    w.querySelector('.wcard[data-k=explore]').click();
    if (!w.hidden || !WW.globe.api().S.playing) return 'welcome: explore card did not close the cards and start playing';
    // 返回鍵先關掉自己打開的資訊卡 · Back closes a card the user opened
    const A = WW.globe.api(), card = document.querySelector('#g-infoCard');
    A.selectFarm(A.D.farms.find(f => f.iso === 'DNK' && !f.pipe)); await new Promise(r => setTimeout(r, 400));
    if (!card.classList.contains('show') || !(history.state && history.state.wwLayer === 'g-infoCard')) return 'card: no history entry for Back';
    history.back(); await new Promise(r => setTimeout(r, 800));
    if (card.classList.contains('show') || document.body.dataset.page !== 'global') return 'card: Back did not close it on the page';
    if (innerWidth > 640) return '';
    // 手機：底部抽屜三段高度（把手列／半開／全開），半開時側欄看得到 · phone drawer heights
    const d = document.querySelector('#g-drawer'); if (!d) return 'phone: no drawer';
    const H = document.querySelector('#g-stage').clientHeight, hs = [];
    for (const h of [0, 1, 2]) { WW.globe.api().drawerSet(h); await new Promise(r => setTimeout(r, 400)); hs.push(d.clientHeight / H); }
    if (!(hs[0] < 0.25 && hs[1] > 0.4 && hs[1] < 0.65 && hs[2] > 0.8)) return 'phone drawer heights: ' + hs.map(x => x.toFixed(2)).join(' / ');
    const pn = document.querySelector('#g-msPanel'); if (!pn || !pn.offsetHeight) return 'phone drawer: panel not visible when open';
    WW.globe.api().drawerSet(0);
    return '';
  }],
  ['#/global?f=Sweetwater', 15000, () => {
    const c = document.querySelector('#g-infoCard');
    if (!(c && c.classList.contains('show') && c.innerText.trim().length > 50)) return 'farm card did not open';
    // 風機有多大：USWTDB 有輪轂高度與葉輪直徑，卡片要有三張比較卡與足球場圖 · the scale panel from USWTDB hub height and rotor
    if (document.getElementById('g-btnNear').hidden) return 'globe: Near me button hidden';
    if (c.querySelectorAll('details.fscale .sctile').length !== 3 || !c.querySelector('details.fscale svg.scfig .scr')) return 'farm card: no turbine scale panel';
    if (innerWidth <= 640) { const d = document.querySelector('#g-drawer'); if (!d || !d.classList.contains('h1')) return 'phone: the card did not open the drawer half way'; }
    // 暫停時地球上只畫形狀：事件標題與里程碑名不出現 · shapes only while paused
    const shown = [...document.querySelectorAll('#g-labels .lbl.ev, #g-labels .lbl.ms')].filter(l => l.style.display !== 'none');
    if (shown.length) return 'labels: ' + shown.length + ' event/milestone labels shown while paused';
    return '';
  }],
  ['#/global?out=USA.cf', 15000, () => {
    const n = document.querySelectorAll('.gana .oout .orow').length;
    return n > 10 ? '' : 'Output dialog: ' + n + ' rows';
  }],
  ['#/global?out=AUS.cf', 15000, () => {
    const n = document.querySelectorAll('.gana .oout .orow').length;
    return n > 10 ? '' : 'Output dialog (Australia): ' + n + ' rows';
  }],
  ['#/global?r=TWN&zones=1', 15000, () => {
    const l = document.querySelector('#g-zoneLegend');
    return l && !l.hidden ? '' : 'sea zones: legend missing';
  }],
  ['#/global?live=1', 15000, () => {
    const l = document.querySelector('#g-cvgLegend');
    return l && !l.hidden && l.querySelector('.cvsw.full') ? '' : 'live data coverage: legend missing';
  }],
  ['#/global?cmp=TWN,DNK,DEU&y=2024', 15000, () => {
    const n = document.querySelectorAll('.gana .ocmp .cmptab tbody tr').length;
    return n >= 10 ? '' : 'country comparison: ' + n + ' rows';
  }],
  ['#/global?mk=WORLD&mkt=off', 15000, () => {
    const n = document.querySelectorAll('.gana .omk .mkrow').length;
    return n >= 5 ? '' : 'makers & owners: ' + n + ' rows';
  }],
  ['#/global?r=TWN&flow=1&fc=t', 15000, () => {
    const l = document.querySelector('#g-flowLegend');
    return l && !l.hidden && l.querySelector('.wbands') && l.querySelector('[data-fc="t"].on') ? '' : 'wind now (turbine wash): legend missing';
  }],
  ['#/global?ind=share', 15000, () => {
    const l = document.querySelector('#g-indLegend');
    return l && !l.hidden && l.querySelector('.ilr') ? '' : 'indicator: legend missing';
  }],
  ['#/learn', 3500, () => {
    // 動手試試看：四個教具都要畫出來，拉滑桿要改變讀數 · the four hands-on lessons must render and respond to a slider
    const ls = document.querySelectorAll('#page-learn .lesson'); if (ls.length !== 4) return 'learn: ' + ls.length + ' lessons (expected 4)';
    if (![...ls].every(l => l.querySelector('.lplot svg') && l.querySelector('.lout .lchip'))) return 'learn: a lesson has no plot or readout';
    const r = document.querySelector('#cv-v'), before = document.querySelector('[data-k="curve"] .lout').textContent; r.value = 12; r.dispatchEvent(new Event('input'));
    if (document.querySelector('[data-k="curve"] .lout').textContent === before) return 'learn: the power-curve slider changes nothing';
    return '';
  }],
  ['#/learn/asia', 3500, () => {
    // 窄螢幕：目錄捲出畫面後出現「目前章節」列 · narrow screens: the current-chapter bar once the contents scroll away
    if (innerWidth > 1100) return '';
    const b = document.getElementById('lnbar');
    return b && b.classList.contains('is-on') && /05/.test(document.getElementById('lnc').textContent) ? '' : 'learn: current-chapter bar missing';
  }],
  ['#/learn/sources', 3500],
  ['#/embed', 3500, () => {
    // 嵌入小卡：沒有頁首頁尾、有出力數字與嵌入程式碼 · the embeddable card: no header or footer, an output figure, a snippet
    if (getComputedStyle(document.querySelector('.topbar')).display !== 'none' || getComputedStyle(document.querySelector('.sitefoot')).display !== 'none') return 'embed: header or footer shown';
    if (!/\d/.test((document.querySelector('#page-embed .emb-main b') || {}).textContent || '')) return 'embed: no output figure';
    if (!/<iframe .*#\/embed/.test(WW.embedSnippet())) return 'embed: bad snippet';
    return '';
  }],
  ['#/status', 5000, () => document.querySelectorAll('#page-status .sttbl tr').length > 8 && document.querySelector('#page-status .stsum') ? '' : 'status: tables or summary missing'],
  ['#/kids', 3000, () => document.querySelector('#page-kids .khome h1') ? '' : 'kids: home page missing'],
  ['#/kids/globe', 6000, () => {
    const n = document.querySelectorAll('#page-kids .kpin').length;
    return document.querySelector('#page-kids canvas') && n === 8 ? '' : 'kids globe: canvas or 8 stop pins missing (' + n + ')';
  }],
  ['#/kids/stop?n=7', 3000, () => document.querySelector('#page-kids .kcmp svg') ? '' : 'kids stop 7: no scale comparison'],
  ['#/kids/stop?n=6', 3000, () => {
    // 答錯不蓋章，答對蓋章並出現「下一站」 · a wrong answer gives no stamp, the right one stamps and shows Next
    localStorage.removeItem('wf_kids'); WW.kids.api().P.s = [];
    const A = WW.kids.api();                                      // 唸給我聽：按鈕在，要唸的內容含題目 · read aloud: button and text
    if (A.CAN_SAY && (!document.querySelector('.kbar .kspk') || !A.sayParts().some(t => t.includes(A.STOPS[5].quiz.q[WW.lang === 'en' ? 1 : 0])))) return 'kids read aloud: button or question text missing';
    const a = A.STOPS[5].quiz.a, wrong = a ? 0 : 1;
    document.querySelector('#kquiz [data-o="' + wrong + '"]').click();
    if (document.querySelector('#kquiz .kfb.ok') || /"s":\[6\]/.test(localStorage.getItem('wf_kids') || '')) return 'kids quiz: wrong answer stamped';
    document.querySelector('#kquiz [data-o="' + a + '"]').click();
    if (!document.querySelector('#kquiz .kfb.ok') || !/"s":\[6\]/.test(localStorage.getItem('wf_kids') || '')) return 'kids quiz: right answer not stamped';
    return document.querySelector('#knext a[href="#/kids/stop?n=7"]') ? '' : 'kids quiz: no link to the next stop';
  }],
  ['#/kids/taiwan', 4500, () => !/\d/.test((document.querySelector('#page-kids .ktwv .kbig') || {}).textContent || '') ? 'kids Taiwan: no output figure' : !document.getElementById('knearbtn') ? 'kids Taiwan: no near-me button' : (document.getElementById('kweek').hidden || !document.querySelector('#kweek svg rect')) ? 'kids Taiwan: no weekly bars' : ''],
  ['#/kids/passport', 2500, () => {
    const st = document.querySelectorAll('#page-kids .kst'), ok = document.querySelectorAll('#page-kids .kst.ok');
    return st.length === 8 && ok.length === 1 ? '' : 'kids passport: ' + st.length + ' stamps, ' + ok.length + ' stamped';
  }],
  ['#/kids/class', 2500, async () => {
    // 全班一起玩：三步、答錯有說明、答對公布，且不動到個人進度 · class mode: three steps, no personal progress
    const before = localStorage.getItem('wf_kids'), A = WW.kids.api(), q = A.STOPS[0].quiz, wait = ms => new Promise(r => setTimeout(r, ms));
    const st = document.querySelector('[data-cl=start]'); if (!st) return 'kids class: no start button';
    st.click(); await wait(300);
    if (!/class\?n=1/.test(location.hash) || !document.querySelector('.kc-learn h1')) return 'kids class: stop 1 facts not shown';
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await wait(300);
    if (document.querySelectorAll('.kc-opt').length !== 3) return 'kids class: the → key did not open the question';
    document.querySelector('.kc-opt[data-clo="' + (q.a ? 0 : 1) + '"]').click(); await wait(200);
    if (!document.querySelector('.kc-fb.no') || document.querySelector('.kc-opt.right')) return 'kids class: wrong answer not explained';
    document.querySelector('.kc-opt[data-clo="' + q.a + '"]').click(); await wait(200);
    if (!document.querySelector('.kc-opt.right') || !document.querySelector('.kc-fb.ok')) return 'kids class: right answer not revealed';
    return localStorage.getItem('wf_kids') === before ? '' : 'kids class: personal progress changed';
  }],
  ['#/kids/passport', 2000, async () => {
    // 集滿 8 個章：護照出現證書，證書寫出名字 · all 8 stamps: certificate with the name
    const A = WW.kids.api(), wait = ms => new Promise(r => setTimeout(r, ms));
    A.P.s = [1, 2, 3, 4, 5, 6, 7, 8]; A.P.name = 'Smoke'; localStorage.setItem('wf_kids', JSON.stringify(A.P));
    location.hash = '#/kids/globe'; await wait(600); location.hash = '#/kids/passport'; await wait(800);
    const c = document.querySelector('#page-kids a[href="#/kids/cert"]'); if (!c || !document.getElementById('kprint')) return 'kids passport: print or certificate button missing';
    c.click(); await wait(800);
    const n = document.querySelector('.kcert .kc-name');
    return n && n.value === 'Smoke' && document.querySelectorAll('.kcert .kc-stamps .kst').length === 8 ? '' : 'kids certificate: name or stamps missing';
  }],
];

async function walk(browser, fails) {
  for (const [w, h, tag] of [[1400, 900, 'desktop'], [390, 844, 'phone']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    let errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !NET.test(m.text())) errs.push('console: ' + m.text()); });
    for (const [route, wait, check] of ROUTES) {
      errs = [];
      await page.goto(base + route);
      await page.waitForTimeout(wait);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 2) errs.push('horizontal overflow ' + over + ' px');
      if (check) { const r = await page.evaluate(check); if (r) errs.push(r); }
      errs.push(...await axeCheck(page));
      if (LIGHT.includes(route)) {                      // 淺色模式：只換主題屬性，不寫入瀏覽器設定 · theme attribute only, nothing stored
        await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; }); await page.waitForTimeout(400);
        errs.push(...await axeCheck(page, 'light'));
        await page.evaluate(() => { delete document.documentElement.dataset.theme; });
      }
      if (shots) await page.screenshot({ path: path.join(shots, `${tag}-${route.replace(/[^a-z0-9]+/gi, '_')}.png`) });
      console.log(`${tag.padEnd(7)} ${route.padEnd(24)} ${errs.length ? 'FAIL' : 'ok'}`);
      errs.forEach(e => { console.log('        ' + e.slice(0, 300)); fails.push(`${tag} ${route}: ${e}`); });
    }
    await page.close();
  }
}

async function standalone(browser, fails) {
  for (const file of ['windfarmTaiwan-standalone.html', 'windfarmTaiwan-globe.html']) {
    const p = path.join(ROOT, 'standalone', file);
    if (!fs.existsSync(p)) { fails.push(file + ': not built'); console.log(file + ' FAIL not built'); continue; }
    const url = 'file://' + p, full = !file.includes('globe');
    for (const offline of [false, true]) {
      const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
      if (offline) await ctx.route(/^https?:/, r => r.abort());
      const page = await ctx.newPage(), errs = [];
      page.on('pageerror', e => errs.push('pageerror: ' + e.message));
      if (full) {
        await page.goto(url + '#/live');
        await page.waitForTimeout(6000);
        const label = await page.evaluate(() => /離線快照|offline snapshot/i.test(document.body.innerText));
        if (offline && !label) errs.push('offline: live data not labelled as an offline snapshot');
        if (offline) {                                  // 離線時地圖改畫簡圖 · offline, the map falls back to the sketch
          await page.goto(url + '#/live/map');
          await page.waitForTimeout(2500);
          const dots = await page.evaluate(() => document.querySelectorAll('#map .fbdot').length);
          if (!dots) errs.push('offline: no sketch map');
        }
      }
      if (full) {                                    // 探險版只在完整版 · the kids page is in the full copy only
        await page.goto(url + '#/kids/globe');
        await page.waitForTimeout(5000);
        const pins = await page.evaluate(() => document.querySelector('#page-kids canvas') ? document.querySelectorAll('#page-kids .kpin').length : 0);
        if (pins !== 8) errs.push('kids globe: ' + pins + ' stop pins');
      }
      await page.goto(url + '#/global?f=Sweetwater');
      await page.waitForTimeout(15000);
      const card = await page.evaluate(() => { const c = document.querySelector('#g-infoCard'); return !!(c && c.classList.contains('show')); });
      if (!card) errs.push('farm card did not open');
      const mode = offline ? 'offline' : 'online';
      if (shots) await page.screenshot({ path: path.join(shots, `standalone-${full ? 'full' : 'globe'}-${mode}.png`) });
      console.log(`${file.padEnd(32)} ${mode.padEnd(8)} ${errs.length ? 'FAIL' : 'ok'}`);
      errs.forEach(e => { console.log('        ' + e.slice(0, 300)); fails.push(`${file} ${mode}: ${e}`); });
      await ctx.close();
    }
  }
}

/* 鍵盤：首頁前 14 個 Tab 停點都看得到、有焦點框；第一個是「跳到主要內容」，Enter 後焦點在 #main · keyboard: focus stops visible with a ring; skip link works */
async function keyboard(browser, fails) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } }), errs = [];
  await page.goto(base + '#/'); await page.waitForTimeout(3500);
  const stops = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(60);
    stops.push(await page.evaluate(() => {
      const el = document.activeElement, r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const ring = el.closest('svg') ? true : (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      return { el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''), vis: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && r.bottom > 0 && r.top < innerHeight, ring };
    }));
    if (i === 0) {
      if (!stops[0].el.includes('skip')) errs.push('first Tab stop is ' + stops[0].el + ', not the skip link');
      await page.keyboard.press('Enter'); await page.waitForTimeout(300);
      const at = await page.evaluate(() => ({ id: document.activeElement.id, page: document.body.dataset.page }));
      if (at.id !== 'main' || at.page !== 'home') errs.push('skip link: focus on ' + (at.id || 'nothing') + ' on page ' + at.page);
      await page.keyboard.press('Tab'); await page.waitForTimeout(60);          // 回到第二個停點 · back to the next stop
    }
  }
  stops.forEach((s, i) => { if (!s.vis) errs.push(`Tab stop ${i + 1} (${s.el}) is not visible`); else if (!s.ring) errs.push(`Tab stop ${i + 1} (${s.el}) has no focus ring`); });
  console.log(`keyboard ${'home'.padEnd(24)} ${errs.length ? 'FAIL' : 'ok'}`);
  errs.forEach(e => { console.log('        ' + e); fails.push('keyboard: ' + e); });
  await page.close();
}
/* 減少動態效果：不能有 CSS 動畫在跑 · reduced motion: no CSS animation may be running */
async function reducedMotion(browser, fails) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' }), page = await ctx.newPage(), errs = [];
  for (const [route, wait] of [['#/', 3500], ['#/live', 3500], ['#/kids', 3000]]) {
    await page.goto(base + route); await page.waitForTimeout(wait);
    const n = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);
    if (n) errs.push(route + ': ' + n + ' animation(s) running under prefers-reduced-motion');
  }
  console.log(`motion   ${'home/live/kids'.padEnd(24)} ${errs.length ? 'FAIL' : 'ok'}`);
  errs.forEach(e => { console.log('        ' + e); fails.push('reduced motion: ' + e); });
  await ctx.close();
}
/* 效能預算：每頁各開一個全新的分頁，同源傳輸量不能超過 tools/perf_budget.json · performance budget per page, fresh tab each */
async function budget(browser, fails) {
  for (const route of Object.keys(BUDGET).filter(k => k.startsWith('#'))) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } }), page = await ctx.newPage();
    let bytes = 0; const pending = [];
    page.on('response', r => { if (r.url().startsWith(base)) pending.push(r.body().then(b => { bytes += b.length; }).catch(() => {})); });
    await page.goto(base + route); await page.waitForTimeout(route.includes('global') ? 16000 : 6000); await Promise.all(pending);
    const mb = bytes / 1048576, over = mb > BUDGET[route];
    console.log(`budget  ${route.padEnd(24)} ${over ? 'FAIL' : 'ok'}   ${mb.toFixed(2)} MB / ${BUDGET[route]} MB`);
    if (over) fails.push(`budget ${route}: ${mb.toFixed(2)} MB over the ${BUDGET[route]} MB budget (raise tools/perf_budget.json only on purpose)`);
    await ctx.close();
  }
}

(async () => {
  if (shots) fs.mkdirSync(shots, { recursive: true });
  if (!AXE) console.log('note: axe-core not found (npm install axe-core) — accessibility rules skipped');
  const browser = await chromium.launch(LAUNCH), fails = [];
  try {
    await walk(browser, fails);
    await keyboard(browser, fails);
    await reducedMotion(browser, fails);
    await budget(browser, fails);
    if (args.includes('--standalone')) await standalone(browser, fails);
  } finally { await browser.close(); }
  console.log(fails.length ? `\n${fails.length} problem(s)` : '\nall pages ok');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
