#!/usr/bin/env node
/* 冒煙測試 · Smoke test (Playwright + Chromium)

  python3 -m http.server 8000 &                       # 先開本機預覽 · serve the repo first
  node tools/smoke_test.js [http://localhost:8000/] [--standalone] [--shots 目錄]

1. 網站各頁（首頁、台灣即時的儀表／風場牆／數據／地圖、全球地球儀、風場卡片、發電表現、風電知識）以桌機與手機寬度各走一次：
   不能有頁面錯誤、console 錯誤（外部網站連不上的除外）或橫向捲動；地球儀要畫出來、風場卡片與發電表現要有內容；
   儀表精簡檢視最多 8 張「此刻在發電」卡片、切到全部卡片要等於全部風場；儀表篩選要寫進網址與瀏覽器、「恢復預設」要清掉；
   詳情的下一座要換風場，返回鍵（地球儀資訊卡也一樣）只關掉詳情、不離開頁面；地圖要有衛星地圖或離線簡圖；首頁要有 7 天出力曲線、頁尾四組來源連結；
   手機的風電知識捲到某章時要有「目前章節」列；探險版要畫出地球與 8 個站點，答錯不蓋章、答對蓋章並出現下一站，護照要記得，
   有「唸給我聽」；全班一起玩要走得完三步（→ 鍵）且不動個人進度；集滿 8 個章要能列印護照、打開寫著名字的完成證書。
2. --standalone：standalone/ 的兩個單檔版（先跑 tools/build_standalone.py、tools/build_globe_lite.py）以 file:// 開啟，
   連網與離線（擋掉所有 http/https 請求）各一次：不能有頁面錯誤，離線時完整版的即時資料要標示「離線快照」、地圖改畫離線簡圖，完整版的探險版地球要有 8 個站點。
有錯誤時結束碼為 1。GitHub Actions 的 pr-check 在每個 PR 跑這支（.github/workflows/pr-check.yml）。

1. Walks every page (home, the four Taiwan live tabs, the globe, a farm card, the Output dialog, Learn) at desktop and phone widths:
   no page errors, no console errors (except unreachable external sites), no horizontal scrolling; the globe must draw, the farm
   card and Output dialog must have content, the dashboard's compact view must show at most 8 generating cards and its all-cards view every farm,
   dashboard filters must reach the URL and storage and Reset must clear them, the drawer's next button must change farm and Back must close
   only the drawer (likewise the globe's info card), the map tab must show the map
   or the offline sketch, the home page must have the 7-day curve and the four footer source groups, and on phones Learn must
   show the current-chapter bar inside a chapter; the kids page must draw its globe with 8 stops, stamp only a right answer, offer the next stop, keep
   the stamp in the passport and offer read-aloud; its class mode must step through with the → key without touching personal progress, and with
   all 8 stamps the passport must offer printing and a certificate carrying the name.
2. --standalone: opens both single-file copies in standalone/ over file:// online and offline (all http/https blocked): no page errors,
   and offline the full copy must label its live data as an offline snapshot and draw the sketch map; the full copy's kids globe must show 8 stops.
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

// [路由, 等待毫秒, 檢查（在頁面裡執行，回傳錯誤字串或空字串）]
const ROUTES = [
  ['#/', 3500, () => {
    // 首頁：過去 7 天的出力曲線、頁尾四組來源連結 · home: 7-day curve and the four footer source groups
    if (!document.querySelector('#hh-7d svg .ln')) return 'home: no 7-day output curve';
    const g = [...document.querySelectorAll('.sitefoot .fsrc dt a')].map(a => a.getAttribute('href'));
    return g.length === 4 && g.every(h => /^#\/learn\/sources\?s=/.test(h)) ? '' : 'footer: source groups ' + g.join(' ');
  }],
  ['#/live', 4000, async () => {
    // 儀表精簡檢視：此刻在發電最多 8 張卡、沒出力的收成名稱；切到全部卡片要等於全部風場 · compact view vs the all-cards view
    const q = s => document.querySelectorAll('#groups ' + s).length, tg = document.querySelector('#groups .fulltoggle');
    if (!q('.fcard') && !q('.fchip')) return 'dashboard: no farms';
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
  ['#/learn', 3500],
  ['#/learn/asia', 3500, () => {
    // 窄螢幕：目錄捲出畫面後出現「目前章節」列 · narrow screens: the current-chapter bar once the contents scroll away
    if (innerWidth > 1100) return '';
    const b = document.getElementById('lnbar');
    return b && b.classList.contains('is-on') && /05/.test(document.getElementById('lnc').textContent) ? '' : 'learn: current-chapter bar missing';
  }],
  ['#/learn/sources', 3500],
  ['#/kids', 3000, () => document.querySelector('#page-kids .khome h1') ? '' : 'kids: home page missing'],
  ['#/kids/globe', 6000, () => {
    const n = document.querySelectorAll('#page-kids .kpin').length;
    return document.querySelector('#page-kids canvas') && n === 8 ? '' : 'kids globe: canvas or 8 stop pins missing (' + n + ')';
  }],
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
  ['#/kids/taiwan', 3500, () => /\d/.test((document.querySelector('#page-kids .ktwv .kbig') || {}).textContent || '') ? '' : 'kids Taiwan: no output figure'],
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

(async () => {
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch(LAUNCH), fails = [];
  try {
    await walk(browser, fails);
    if (args.includes('--standalone')) await standalone(browser, fails);
  } finally { await browser.close(); }
  console.log(fails.length ? `\n${fails.length} problem(s)` : '\nall pages ok');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
