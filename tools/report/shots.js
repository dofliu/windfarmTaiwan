#!/usr/bin/env node
/* 報告用的網站截圖 · Site screenshots for the report (1440×900 @2x) into report/shots/.
   先開本機預覽 · serve the repo first: python3 -m http.server 8000
   node tools/report/shots.js [http://localhost:8000/] */
const path = require('path');
const fs = require('fs');
function playwright() {
  try { return require('playwright'); } catch (e) {
    const root = require('child_process').execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  }
}
const { chromium } = playwright();
const base = (process.argv.slice(2).find(a => /^https?:/.test(a)) || 'http://localhost:8000/').replace(/\/?$/, '/');
const out = path.resolve(__dirname, '..', '..', 'report', 'shots');
const SHOTS = [
  ['globe', '#/global?y=2025', 16000], ['y2000', '#/global?y=2000', 16000], ['cmp', '#/global?cmp=CHN,USA,DEU,GBR&y=2025', 16000],
  ['share', '#/global?ind=share&y=2025', 16000], ['farm', '#/global?f=Sweetwater', 18000], ['euzones', '#/global?r=C:Europe&zones=1', 16000],
  ['fdeu', '#/global?r=C:Europe&layer=fd', 16000], ['float', '#/global?fty=fl&fst=op', 16000], ['outus', '#/global?out=USA.cf', 16000],  ['owners', '#/global?mk=WORLD&mkv=owner', 16000], ['twzones', '#/global?r=TWN&zones=1', 16000],
  ['live', '#/live', 6000], ['pipe', '#/global?r=C:Asia&y=2026', 16000],
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  for (const [n, r, w] of SHOTS) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(base + r); await p.waitForTimeout(w);
    await p.screenshot({ path: path.join(out, n + '.png') });
    await ctx.close(); console.log('shot', n);
  }
  await b.close();
})();
