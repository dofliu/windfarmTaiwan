// tools/new-scene.mjs — scaffold a chapter scene module and register it.
//   node tools/new-scene.mjs <id> [--force]          design-square scene: runs on BOTH stages
//   node tools/new-scene.mjs <id> --wide [--force]   native wide valley scene for the easel stage
//   node tools/new-scene.mjs <id> --look <look>      a working skeleton already in an art medium, both
//        stages (looks: engraving poster blueprint newsreel screen pixel ink fresco; tools/scene-looks.mjs)
// Writes src/scenes/<id>.js from a skeleton that follows the scene contract and adds the
// import + registry entry to src/scenes/index.js. Add the chapter record to
// src/data/chapters.js yourself (id: '<id>'), then iterate with:
//   node tools/shot.mjs panel <id> 0.5,4,7.5 out/<id> --timing
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './serve.mjs';
import { LOOKS, lookSkeleton } from './scene-looks.mjs';

const id = process.argv[2];
if (!id || !/^[a-z][a-z0-9_]*$/.test(id)) {
  console.log('usage: node tools/new-scene.mjs <id>   (lowercase letters, digits, _)');
  process.exit(1);
}
const file = path.join(ROOT, 'src/scenes', `${id}.js`);
if (fs.existsSync(file) && !process.argv.includes('--force')) {
  console.log(`${path.relative(ROOT, file)} exists (use --force to overwrite)`);
  process.exit(1);
}
const header = `// src/scenes/${id}.js
// Chapter "${id}" · <date> · <title>.
//
// Medium: <the art medium of this chapter — what makes it unmistakable at a glance>.
// Scene: <the subject, accurate details, 3 depth layers>.
// Story beat (bar 3): <what happens, timed to the music>.
//
// Deterministic: no Math.random / Date — use kit.makePRNG / kit.hash11 / kit.noise*.
// Bake static layers with kit.bake(). Contract + per-stage canvases: SCENE_GUIDE.md.
`;
const square = `${header}//
// Layout: drawn in a 1000x1000 DESIGN space. gallery-ride shows it 1:1 (road y = 700, zero slope
// at x = 0 / 1000, outer 26 px under the frame). On the easel stage kit.layout(p) maps it into the
// valley's safe area and kit.wideBackdrop() extends the background to the 1920x1080 canvas.

const S = 1000;
const ROAD = 700;

function paintBackground(kit, g, rng) {
  const [c0, c1, c2, c3] = ['#e9dcc0', '#2a2622', '#7a8c6e', '#c9a45c'];
  const sky = g.createLinearGradient(0, 0, 0, ROAD);
  sky.addColorStop(0, c0);
  sky.addColorStop(1, kit.mixColor(c0, c3, 0.3));
  g.fillStyle = sky;
  g.fillRect(0, 0, S, S);
  g.fillStyle = c2;
  g.fillRect(0, ROAD, S, S - ROAD);
  g.strokeStyle = c1;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, ROAD);
  g.lineTo(S, ROAD);
  g.stroke();
  kit.addGrain(g, S, S, rng, 0.03);
}

export const meta = { stages: ['gallery-ride', 'easel'] };

export function render(kit, ctx, p) {
  const T = p.isThumbnail ? p.chapterSec * 0.5 : p.rawLocalT; // animate with rawLocalT (alive while sliding in/out)
  const L = kit.layout(p); // { x, y, s, x0, x1 }: design -> canvas; x0..x1 = whole canvas in design units
  ctx.save();
  const bg = kit.bake('${id}_bg_v1', S, S, (g, rng) => paintBackground(kit, g, rng));
  ctx.drawImage(kit.wideBackdrop('${id}_bg_v1', bg, p, { mode: 'edge' }), 0, 0); // 'mirror' for textures
  ctx.translate(L.x, L.y);
  ctx.scale(L.s, L.s);

  // REPLACE: main subject: big, accurate, animated (this pinwheel is a placeholder)
  const hub = { x: 680, y: 330, r: 110 };
  kit.drawProp(ctx, hub, T * 2, { ...p.prop, time: T });

  // story beat on bar 3 (index 2)
  const pop = kit.envelope(T, 2 * p.beat.barSec, 2.3 * p.beat.barSec, 3.6 * p.beat.barSec, 4 * p.beat.barSec);
  if (pop > 0.01) {
    ctx.globalAlpha = pop;
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.arc(hub.x, hub.y - 160, 20 + 6 * p.beat.pulse(0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // gallery-ride: the rider, re-styled into this medium (SCENE_GUIDE.md §4); null on the easel stage
  if (p.actor && p.actor.visible) p.actor.draw(ctx, p.actor.rig(), { outlineWidth: 1.5 });
  ctx.restore();
}
`;
const wide = `${header}//
// Layout: native easel valley — 1920x1080 canvas (p.W x p.H). The hill + painter + easel cover
// the lower left (p.cover), the ruler + paper haze the top ~70 px; keep the key subject inside
// p.safe ({ x: 760, y: 110, w: 1000, h: 830 }); horizon near p.horizonY (430), valley floor p.groundY (720).

function paintBackground(kit, g, rng, w, h, p) {
  const sky = g.createLinearGradient(0, 0, 0, p.horizonY);
  sky.addColorStop(0, '#a9c6d8');
  sky.addColorStop(1, '#efe3c8');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  // far hills, mid fields, near valley floor (3 depth layers)
  for (const [y0, amp, col] of [[p.horizonY + 10, 70, '#9fb1b8'], [p.horizonY + 120, 50, '#8fa877'], [p.groundY, 30, '#6f8f55']]) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) g.lineTo(x, y0 - amp * kit.fbm2(x * 0.004, y0, 3));
    g.lineTo(w, h);
    g.closePath();
    g.fill();
  }
  kit.addGrain(g, w, h, rng, 0.02);
}

export const meta = { stages: ['easel'] };

export function render(kit, ctx, p) {
  const T = p.isThumbnail ? p.chapterSec * 0.5 : p.rawLocalT;
  ctx.save();
  ctx.drawImage(kit.bake('${id}_bg_v1', p.W, p.H, (g, rng, w, h) => paintBackground(kit, g, rng, w, h, p)), 0, 0);
  // REPLACE: main subject in the safe area, animated with T / p.beat (this pinwheel is a placeholder)
  const cx = p.safe.x + p.safe.w * 0.55;
  const hub = { x: cx, y: p.groundY - 260, r: 120 };
  ctx.strokeStyle = '#3a3530';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(hub.x, hub.y);
  ctx.lineTo(hub.x, p.groundY);
  ctx.stroke();
  kit.drawProp(ctx, hub, T * 2, { ...p.prop, time: T });
  ctx.restore();
}
`;
const li = process.argv.indexOf('--look');
const look = li > 0 ? process.argv[li + 1] : null;
if (look && look !== 'plain' && !LOOKS[look]) {
  console.log(`unknown look "${look}". Looks:\n${Object.entries(LOOKS).map(([k, v]) => `  ${k.padEnd(10)} ${v}`).join('\n')}`);
  process.exit(1);
}
const skeleton = look && look !== 'plain' ? lookSkeleton(id, look, header) : process.argv.includes('--wide') ? wide : square;
fs.writeFileSync(file, skeleton);
const idxFile = path.join(ROOT, 'src/scenes/index.js');
let idx = fs.readFileSync(idxFile, 'utf8');
if (!idx.includes(`'./${id}.js'`)) {
  idx = idx.replace(/(import \* as [A-Za-z0-9_$]+ from '\.\/[^']+';\n)(?!import \* as)/, `$1import * as ${id} from './${id}.js';\n`);
  idx = idx.replace(/export const SCENE_MODULES = \{\n/, `export const SCENE_MODULES = {\n  ${id},\n`);
  fs.writeFileSync(idxFile, idx);
}
console.log(`wrote src/scenes/${id}.js and registered it in src/scenes/index.js`);
