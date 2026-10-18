#!/usr/bin/env node
/* 冒煙測試 · Smoke test (Playwright + Chromium)

  python3 -m http.server 8000 &                       # 先開本機預覽 · serve the repo first
  node tools/smoke_test.js [http://localhost:8000/] [--standalone] [--shots 目錄]

1. 網站各頁（首頁、台灣即時的儀表／風場牆／數據／地圖、全球地球儀、風場卡片、發電表現、風電知識）以桌機與手機寬度各走一次：
   不能有頁面錯誤、console 錯誤（外部網站連不上的除外）或橫向捲動；地球儀要畫出來、風場卡片與發電表現要有內容；
   儀表沒有出力的風場收成名稱後可展開；地圖要有衛星地圖或離線簡圖；首頁要有 7 天出力曲線、頁尾四組來源連結；
   手機的風電知識捲到某章時要有「目前章節」列。
2. --standalone：standalone/ 的兩個單檔版（先跑 tools/build_standalone.py、tools/build_globe_lite.py）以 file:// 開啟，
   連網與離線（擋掉所有 http/https 請求）各一次：不能有頁面錯誤，離線時完整版的即時資料要標示「離線快照」、地圖改畫離線簡圖。
有錯誤時結束碼為 1。GitHub Actions 的 pr-check 在每個 PR 跑這支（.github/workflows/pr-check.yml）。

1. Walks every page (home, the four Taiwan live tabs, the globe, a farm card, the Output dialog, Learn) at desktop and phone widths:
   no page errors, no console errors (except unreachable external sites), no horizontal scrolling; the globe must draw, the farm
   card and Output dialog must have content, the dashboard's folded no-output farms must expand, the map tab must show the map
   or the offline sketch, the home page must have the 7-day curve and the four footer source groups, and on phones Learn must
   show the current-chapter bar inside a chapter.
2. --standalone: opens both single-file copies in standalone/ over file:// online and offline (all http/https blocked): no page errors,
   and offline the full copy must label its live data as an offline snapshot and draw the sketch map.
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
  ['#/live', 4000, () => {
    // 儀表：有出力與沒出力的風場並存時，沒出力的收成名稱，展開後全部是卡片 · farms with no output fold into name chips
    const q = s => document.querySelectorAll('#groups ' + s).length, cards = q('.fcard'), chips = q('.fchip');
    if (!cards && !chips) return 'dashboard: no farms';
    if (!chips) return '';
    if (!q('.genhead.off')) return 'dashboard: chips without the no-output heading';
    document.getElementById('offtoggle').click();
    const n = q('.fcard'); document.getElementById('offtoggle').click();
    return n === cards + chips ? '' : `dashboard: expanded to ${n} cards, expected ${cards + chips}`;
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
