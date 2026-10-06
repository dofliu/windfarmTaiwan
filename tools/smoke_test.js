#!/usr/bin/env node
/* 冒煙測試 · Smoke test (Playwright + Chromium)

  python3 -m http.server 8000 &                       # 先開本機預覽 · serve the repo first
  node tools/smoke_test.js [http://localhost:8000/] [--standalone] [--shots 目錄]

1. 網站各頁（首頁、台灣即時的儀表／風場牆／數據／地圖、全球地球儀、風場卡片、發電表現、風電知識）以桌機與手機寬度各走一次：
   不能有頁面錯誤、console 錯誤（外部網站連不上的除外）或橫向捲動；地球儀要畫出來、風場卡片與發電表現要有內容。
2. --standalone：standalone/ 的兩個單檔版（先跑 tools/build_standalone.py、tools/build_globe_lite.py）以 file:// 開啟，
   連網與離線（擋掉所有 http/https 請求）各一次：不能有頁面錯誤，離線時完整版的即時資料要標示「離線快照」。
有錯誤時結束碼為 1。GitHub Actions 的 pr-check 在每個 PR 跑這支（.github/workflows/pr-check.yml）。

1. Walks every page (home, the four Taiwan live tabs, the globe, a farm card, the Output dialog, Learn) at desktop and phone widths:
   no page errors, no console errors (except unreachable external sites), no horizontal scrolling; the globe must draw, and the farm
   card and Output dialog must have content.
2. --standalone: opens both single-file copies in standalone/ over file:// online and offline (all http/https blocked): no page errors,
   and offline the full copy must label its live data as an offline snapshot.
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
  ['#/', 3500],
  ['#/live', 4000],
  ['#/live/wall', 3500],
  ['#/live/charts', 4000],
  ['#/live/map', 4000],
  ['#/global', 15000, () => document.querySelector('canvas') ? '' : 'globe: no canvas'],
  ['#/global?f=Sweetwater', 15000, () => {
    const c = document.querySelector('#g-infoCard');
    return c && c.classList.contains('show') && c.innerText.trim().length > 50 ? '' : 'farm card did not open';
  }],
  ['#/global?out=USA.cf', 15000, () => {
    const n = document.querySelectorAll('#g-modal.show .oout .orow').length;
    return n > 10 ? '' : 'Output dialog: ' + n + ' rows';
  }],
  ['#/global?out=AUS.cf', 15000, () => {
    const n = document.querySelectorAll('#g-modal.show .oout .orow').length;
    return n > 10 ? '' : 'Output dialog (Australia): ' + n + ' rows';
  }],
  ['#/global?r=TWN&zones=1', 15000, () => {
    const l = document.querySelector('#g-zoneLegend');
    return l && !l.hidden ? '' : 'sea zones: legend missing';
  }],
  ['#/learn', 3500],
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
