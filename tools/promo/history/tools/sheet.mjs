// tools/sheet.mjs — contact sheet: every chapter's scene canvas at 3 moments -> out/sheet.png
//   node tools/sheet.mjs [u1,u2,u3 as fractions of the chapter (default 0.12,0.5,0.88)] [out.png] [--staging easel+person]
import fs from 'node:fs';
import path from 'node:path';
import { openRenderHost, stagingArgs } from './browser.mjs';

const { rest } = stagingArgs();
const fracs = (rest[0] || '0.12,0.5,0.88').split(',').map(Number);
const out = rest[1] || 'out/sheet.png';
const { page, errors, close } = await openRenderHost();
const png = await page.evaluate(async (fr) => {
  const info = window.__FILM_INFO__;
  const scenes = info.chapters;
  const lts = fr.map((f) => f * info.chapterSec);
  const S = 240;
  const SH = Math.round((S * info.sceneH) / info.sceneW);
  const c = document.createElement('canvas');
  c.width = S * lts.length * 2 + 20;
  c.height = Math.ceil(scenes.length / 2) * (SH + 10) + 10;
  const g = c.getContext('2d');
  g.fillStyle = '#111';
  g.fillRect(0, 0, c.width, c.height);
  const src = document.querySelector('#canvas-host canvas');
  for (let i = 0; i < scenes.length; i++) {
    for (let k = 0; k < lts.length; k++) {
      await window.renderPanelAt(scenes[i].id, lts[k]);
      const col = (i % 2) * lts.length + k;
      const row = Math.floor(i / 2);
      g.drawImage(src, 10 + col * S, 10 + row * (SH + 10), S - 6, SH - 6);
    }
  }
  return c.toDataURL('image/png').split(',')[1];
}, fracs);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(png, 'base64'));
console.log(`wrote ${out}`);
if (errors.length) console.log(errors.join('\n'));
await close();
