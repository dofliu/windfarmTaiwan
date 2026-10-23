#!/usr/bin/env node
/* 報告用的網站截圖 · Site screenshots for the report into report/shots/.
   先開本機預覽 · serve the repo first: python3 -m http.server 8000
   node tools/report/shots.js [http://localhost:8000/] [名稱…]

   每張圖預設關掉事件與港口圖層（紅點與錨點），只在要講它們的章節打開；clean＝只留地圖畫面（隱藏介面），
   ops 是拍照前的滑鼠動作（drag＝旋轉／傾斜，wheel＝縮放）。
   Event and port markers are off unless the chapter is about them; clean hides the interface; ops are mouse moves before the shot. */
const path = require('path');
const fs = require('fs');
function playwright() {
  try { return require('playwright'); } catch (e) {
    const root = require('child_process').execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  }
}
const { chromium } = playwright();
const args = process.argv.slice(2);
const base = (args.find(a => /^https?:/.test(a)) || 'http://localhost:8000/').replace(/\/?$/, '/');
const only = args.filter(a => !/^https?:/.test(a));
const out = path.resolve(__dirname, '..', '..', 'report', 'shots');
const W = 16000;
const SHOTS = [
  // 封面：平面地圖傾斜，各國風機高度依容量 · cover: tilted flat map, turbine height by capacity
  { n: 'cover', url: '#/global?mode=flat&y=2025', clean: true, vp: [1800, 1100], ops: [['drag', 0, -200]] },
  { n: 'globe', url: '#/global?y=2025' },
  // 第 1 章：1981 年加州 Altamont Pass · chapter 1: Altamont Pass, 1981
  { n: 'altamont', url: '#/global?y=1981&ms=Altamont%20Pass%20wind%20farm%2C%20California' },
  // 第 2 章：三個時代的重心 · chapter 2: the three centres of gravity
  { n: 'na1990', url: '#/global?r=USA&y=1990', clean: true },
  { n: 'eu2000', url: '#/global?r=C:Europe&y=2000', clean: true },
  { n: 'as2025', url: '#/global?r=C:Asia&y=2025', clean: true },
  { n: 'cmp', url: '#/global?cmp=CHN,USA,DEU,GBR&y=2025' },
  { n: 'share', url: '#/global?ind=share&y=2025' },
  // 第 3 章 · chapter 3
  { n: 'farm', url: '#/global?f=Sweetwater', wait: 18000 },
  // 第 4 章：北海與中國沿海的離岸風場 · chapter 4: North Sea and the Chinese coast
  { n: 'northsea', url: '#/global?r=GBR&layer=off&y=2025', clean: true },
  { n: 'chinaoff', url: '#/global?r=CHN&layer=off&y=2025', clean: true },
  { n: 'fdeu', url: '#/global?r=C:Europe&layer=fd' },
  { n: 'float', url: '#/global?fty=fl&fst=op' },
  // 第 5、6 章 · chapters 5 and 6
  { n: 'outus', url: '#/global?out=USA.cf' },
  { n: 'owners', url: '#/global?mk=WORLD&mkv=owner' },
  { n: 'makers', url: '#/global?mk=WORLD&mkt=off' },
  // 第 7 章：港口 · chapter 7: ports
  { n: 'ports', url: '#/global?r=C:Europe&y=2025', ports: true },
  { n: 'porttw', url: '#/global?port=twn-taichung', ports: true },
  // 第 8 章：事件 · chapter 8: incidents
  { n: 'events', url: '#/global?y=2025', events: true },
  { n: 'evtw', url: '#/global?ev=WIND-061', events: true },
  // 此刻的風（風機運轉色階），產生報告當下的天氣 · Wind now, turbine view, the weather at build time
  { n: 'windtw', url: '#/global?r=TWN&flow=1&fc=t', clean: true },
  // 第 9 章：台灣 · chapter 9: Taiwan
  { n: 'twzones', url: '#/global?r=TWN&zones=1' },
  { n: 'twoff', url: '#/global?r=TWN&layer=off&y=2025', clean: true },
  { n: 'live', url: '#/live', wait: 6000 },
  // 第 10 章：開發管線 · chapter 10: pipeline
  { n: 'pipe', url: '#/global?r=C:Asia&y=2026', pipe: true },
  { n: 'pipeeu', url: '#/global?r=C:Europe&y=2026', pipe: true, clean: true },
];
const CLEAN = '#g-stage{position:fixed!important;inset:0!important;z-index:9000!important;width:100vw!important;height:100vh!important}'
  + '#g-hud,#g-msPanel{display:none!important}#g-stage .gfoot,#g-stage [class*="attr"]{display:none!important}';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  for (const s of SHOTS) {
    if (only.length && !only.includes(s.n)) continue;
    const [w, h] = s.vp || [1440, 900];
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await ctx.addInitScript(o => {
      localStorage.setItem('ww_globe_events', o.events ? '1' : '0');
      localStorage.setItem('ww_globe_ports', o.ports ? '1' : '0');
      localStorage.setItem('ww_globe_pipe', o.pipe ? '1' : '0');
      localStorage.setItem('ww_globe_seen', '1');
    }, { events: !!s.events, ports: !!s.ports, pipe: !!s.pipe });
    const p = await ctx.newPage();
    await p.goto(base + s.url);
    await p.waitForTimeout(s.wait || W);
    if (s.clean) {
      await p.addStyleTag({ content: CLEAN });
      await p.evaluate(() => window.dispatchEvent(new Event('resize')));
      await p.waitForTimeout(1500);
    }
    for (const op of s.ops || []) {
      if (op[0] === 'drag') { await p.mouse.move(w / 2, h / 2); await p.mouse.down(); await p.mouse.move(w / 2 + op[1], h / 2 + op[2], { steps: 15 }); await p.mouse.up(); }
      if (op[0] === 'wheel') { await p.mouse.move(w / 2, h / 2); await p.mouse.wheel(0, op[1]); }
      await p.waitForTimeout(1500);
    }
    await p.waitForTimeout(2000);
    await p.screenshot({ path: path.join(out, s.n + '.png') });
    await ctx.close();
    console.log('shot', s.n);
  }
  await b.close();
})();
