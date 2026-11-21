// tools/scene-looks.mjs — medium-specific scene skeletons ("looks") for tools/new-scene.mjs.
//
// A look is a working starting scene that already reads as its art medium: the background is
// baked in the medium, the ground band is textured, a placeholder subject (a tower with a turning
// wheel) is drawn with the medium's technique, a bar-3 story beat fires, the rider (gallery-ride)
// is re-styled, and the medium's overlay (film grain, CRT, ...) is applied. The author REPLACES
// drawSubject / drawBeat with the chapter's real subject and keeps the rest.
//
// Every look works on BOTH stages without a design square: the subject goes in the focus box F
// (easel: p.safe; gallery-ride: the panel above the road) and stands on p.groundY.
//
//   node tools/new-scene.mjs <id> --look poster       (new_film.mjs picks the look from the medium)

export const LOOKS = {
  engraving: 'line media: woodcut, copperplate / wood engraving, patent drawing, map (paper + hatching + ink lines)',
  poster: 'flat-colour print: mid-century / WPA / Deco / screen-print poster, chromolith, comic, infographic, manuscript (flat shapes + halftone + misregistration)',
  blueprint: 'cyanotype / blueprint / technical drawing (grid, white lines, dimension arrows, title block)',
  newsreel: 'black-and-white film: newsreel, silent film, archival photo (greys + film grain, flicker, scratches, gate weave)',
  screen: 'screens: wireframe HUD, early GUI / CRT terminal, synthwave, satellite map (dark ground + glow lines + scanlines)',
  pixel: 'pixel art 8/16-bit (everything drawn at low resolution, hard pixels, stepped motion)',
  ink: 'brush media: ink wash 水墨, watercolour sketch, Delftware (paper + washes + tapered ink lines + seal)',
  fresco: 'ancient: tomb fresco, relief, clay tablet, black-figure (plaster + registers + embossed / flat outlined figures)',
};

const COMMON_TOP = (id, look) => `//
// Look: ${look} — ${LOOKS[look]}.
// Generated from tools/scene-looks.mjs: the background, ground band, overlay and rider style already
// read as the medium. REPLACE drawSubject() and drawBeat() with this chapter's subject (fact sheet
// "Visual facts"); adjust paintBackground() for the setting. Kit helpers: SCENE_GUIDE.md "Medium helpers".
//
// Layout (both stages, no design square): F = focus box for the main subject — easel: p.safe
// (clear of hill, painter and paper fade); gallery-ride: the panel above the road. The ground line
// is p.groundY (gallery-ride road 700 with the rider on it; easel valley floor 720).
// Gallery-ride: the rider (~230 px tall) crosses the whole panel on y 470-700 during the chapter, so
// keep text and small key details above y ≈ 450 or to the side; a big subject may sit behind it.

export const meta = { stages: ['gallery-ride', 'easel'] };
const ID = '${id}';

/** Focus box for the main subject. */
function focus(p) {
  return p.safe ? { x: p.safe.x, y: p.safe.y, w: p.safe.w, h: p.safe.h } : { x: 80, y: 80, w: 840, h: 600 };
}

/** Placeholder subject geometry: a tower standing on the ground with a wheel on top. */
function geom(p, F) {
  const h = (p.groundY - F.y) * 0.62;
  const bx = F.x + F.w * 0.58;
  const r = Math.min(F.w, p.groundY - F.y) * 0.2;
  return { bx, by: p.groundY, h, w: r * 0.55, hub: { x: bx, y: p.groundY - h, r } };
}

/** Bar-3 envelope (0 -> 1 -> 0) for the story beat. */
function beatEnv(kit, p, T) {
  const b = p.beat.barSec;
  return kit.envelope(T, 2 * b, 2.25 * b, 3.7 * b, 4 * b);
}
`;

const RENDER = (opts = {}) => `
export function render(kit, ctx, p) {
  const T = p.isThumbnail ? p.chapterSec * 0.5 : p.rawLocalT; // animate with rawLocalT; thumbnails are a fixed calm frame
  const pal = p.palette && p.palette.length >= 5 ? p.palette : DEFAULT_PAL;
  const F = focus(p);
  ctx.save();
${opts.pre || ''}  ctx.drawImage(kit.bake(ID + '_bg_v1', p.W, p.H, (g, rng, w, h) => paintBackground(kit, g, rng, w, h, p, pal)), 0, 0);
  drawSubject(kit, ctx, p, T, F, pal);
  drawBeat(kit, ctx, p, T, F, pal);
  if (p.actor && p.actor.visible) p.actor.draw(ctx, p.actor.rig(), riderStyle(p, pal));
${opts.post || ''}  ctx.restore();
}
`;

// ------------------------------------------------------------------------------------------- looks
const BODY = {
  engraving: `
const DEFAULT_PAL = ['#f2ead8', '#1b1a18', '#7a3b2a', '#a89a7a', '#4a443a']; // paper, ink, red-brown, tone, dark

function paintBackground(kit, g, rng, w, h, p, pal) {
  g.drawImage(kit.paper(ID, w, h, { color: pal[0], grain: 0.05, blotches: 18, foxing: 20, vignette: 0.18 }), 0, 0);
  // copperplate sky: fine horizontal lines, denser toward the top
  for (let y = 40; y < p.groundY - 120; y += 7) {
    g.globalAlpha = 0.5 * (1 - y / (p.groundY - 120));
    g.fillStyle = pal[1];
    g.fillRect(30, y, w - 60, 0.8);
  }
  g.globalAlpha = 1;
  // distant hills: outline + hatching
  g.save();
  g.beginPath();
  g.moveTo(0, p.groundY);
  for (let x = 0; x <= w; x += 16) g.lineTo(x, p.groundY - 70 - 60 * kit.fbm2(x * 0.004, 2.2, 3));
  g.lineTo(w, p.groundY);
  g.closePath();
  g.clip();
  kit.hatch(g, { spacing: 5, angle: -0.5, color: pal[4], width: 0.8, seed: ID + 'hills' });
  g.restore();
  // ground band: cross-hatched earth, a ruled road edge
  g.save();
  g.beginPath();
  g.rect(0, p.groundY, w, h - p.groundY);
  g.clip();
  kit.hatch(g, { spacing: 6, angle: 0.35, cross: true, color: pal[1], width: 0.9, seed: ID + 'ground' });
  g.restore();
  kit.inkLine(g, [[0, p.groundY], [w * 0.5, p.groundY + 1.5], [w, p.groundY]], { width: 3.2, color: pal[1], seed: ID });
  // plate mark
  g.strokeStyle = 'rgba(40,30,20,0.35)';
  g.lineWidth = 2;
  g.strokeRect(14, 14, w - 28, h - 28);
}

function drawSubject(kit, ctx, p, T, F, pal) {
  // REPLACE: the chapter's main subject, drawn as an engraving: ink outlines + hatching in the shadows
  const G = geom(p, F);
  const tower = () => {
    ctx.beginPath();
    ctx.moveTo(G.bx - G.w, G.by);
    ctx.lineTo(G.bx - G.w * 0.4, G.hub.y);
    ctx.lineTo(G.bx + G.w * 0.4, G.hub.y);
    ctx.lineTo(G.bx + G.w, G.by);
    ctx.closePath();
  };
  ctx.save();
  tower();
  ctx.fillStyle = pal[0];
  ctx.fill();
  ctx.save();
  ctx.clip();
  // shade the right half only (light from the upper left), denser lines = darker
  kit.hatch(ctx, { x: G.bx, y: G.hub.y, w: G.w, h: G.h, spacing: 4, angle: 1.2, color: pal[1], width: 0.9, seed: ID + 'tower' });
  ctx.restore();
  tower(); // hatch() leaves its own path: rebuild the outline before stroking
  ctx.strokeStyle = pal[1];
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // turning wheel: rim + spokes
  const a = T * 1.6;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(G.hub.x, G.hub.y, G.hub.r, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 8; k++) {
    const t = a + (k * Math.PI) / 4;
    kit.inkLine(ctx, [[G.hub.x, G.hub.y], [G.hub.x + Math.cos(t) * G.hub.r, G.hub.y + Math.sin(t) * G.hub.r]], { width: 3, color: pal[1], taper: 'end', seed: ID + k });
  }
  ctx.restore();
}

function drawBeat(kit, ctx, p, T, F, pal) {
  // REPLACE: the bar-3 story beat (here: a pennant hoisted on the tower)
  const G = geom(p, F);
  const e = beatEnv(kit, p, T);
  if (e < 0.01) return;
  const y = G.hub.y - G.hub.r - 10 - 60 * e;
  ctx.save();
  ctx.strokeStyle = pal[1];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(G.hub.x, G.hub.y - G.hub.r);
  ctx.lineTo(G.hub.x, y - 4);
  ctx.stroke();
  ctx.fillStyle = pal[2];
  ctx.beginPath();
  ctx.moveTo(G.hub.x, y - 4);
  ctx.lineTo(G.hub.x + 50 + 6 * Math.sin(T * 7), y + 8);
  ctx.lineTo(G.hub.x, y + 20);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const riderStyle = (p, pal) => ({ wire: pal[1], prop: { type: p.prop.type, colors: [pal[2], pal[3]] } });
`,

  poster: `
const DEFAULT_PAL = ['#f2ebdc', '#c8102e', '#1d3557', '#f1c40f', '#2a2a2a']; // paper, red, blue, yellow, ink

function paintBackground(kit, g, rng, w, h, p, pal) {
  g.drawImage(kit.paper(ID, w, h, { color: pal[0], grain: 0.035, blotches: 8, vignette: 0.08 }), 0, 0);
  // big sun in halftone
  const sx = w * 0.3;
  const sy = p.groundY * 0.38;
  const sr = Math.min(w, p.groundY) * 0.2;
  g.fillStyle = pal[3];
  g.beginPath();
  g.arc(sx, sy, sr, 0, Math.PI * 2);
  g.fill();
  kit.halftoneShade(g, sx - sr * 1.6, sy - sr * 1.6, sr * 3.2, sr * 3.2, {
    cell: 10, color: pal[1], tone: (u, v) => Math.max(0, 1 - Math.hypot(u - 0.5, v - 0.5) * 2.1) * 0.55,
  });
  // flat hills (two inks) and the ground band with a dot screen
  g.fillStyle = pal[2];
  g.beginPath();
  g.moveTo(0, p.groundY);
  for (let x = 0; x <= w; x += 40) g.lineTo(x, p.groundY - 60 - 40 * Math.sin(x * 0.006 + 1));
  g.lineTo(w, p.groundY);
  g.fill();
  g.fillStyle = pal[4];
  g.fillRect(0, p.groundY, w, h - p.groundY);
  g.fillStyle = kit.dots(g, { cell: 12, r: 3.2, color: pal[2] });
  g.fillRect(0, p.groundY + 14, w, h - p.groundY - 14);
  g.fillStyle = pal[0];
  for (let x = 20; x < w; x += 90) g.fillRect(x, p.groundY + 4, 46, 6); // road dashes
}

function drawSubject(kit, ctx, p, T, F, pal) {
  // REPLACE: the chapter's subject as flat poster shapes, printed in two inks slightly off register
  const G = geom(p, F);
  const a = T * 1.8;
  kit.misregister(ctx, (c, i) => {
    ctx.fillStyle = i === 0 ? pal[2] : pal[1];
    ctx.beginPath();
    ctx.moveTo(G.bx - G.w, G.by);
    ctx.lineTo(G.bx - G.w * 0.35, G.hub.y);
    ctx.lineTo(G.bx + G.w * 0.35, G.hub.y);
    ctx.lineTo(G.bx + G.w, G.by);
    ctx.fill();
    for (let k = 0; k < 4; k++) {
      const t = a + (k * Math.PI) / 2;
      ctx.save();
      ctx.translate(G.hub.x, G.hub.y);
      ctx.rotate(t);
      ctx.fillRect(0, -G.hub.r * 0.12, G.hub.r, G.hub.r * 0.24);
      ctx.restore();
    }
  }, { colors: [pal[2], pal[1]], offsets: [[4, -3], [0, 0]] });
  ctx.fillStyle = pal[3];
  ctx.beginPath();
  ctx.arc(G.hub.x, G.hub.y, G.hub.r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeat(kit, ctx, p, T, F, pal) {
  // REPLACE: the bar-3 beat (here: a starburst stamp pops on the beat)
  const G = geom(p, F);
  const e = beatEnv(kit, p, T);
  if (e < 0.01) return;
  const x = F.x + F.w * 0.2;
  const y = F.y + F.h * 0.2;
  const r = 46 * (0.6 + 0.4 * e) * (1 + 0.08 * p.beat.pulse(0.4));
  ctx.save();
  ctx.globalAlpha = Math.min(1, e * 1.5);
  ctx.fillStyle = pal[1];
  ctx.beginPath();
  for (let k = 0; k < 24; k++) {
    const rr = k % 2 ? r : r * 0.72;
    const t = (k / 24) * Math.PI * 2;
    ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr);
  }
  ctx.fill();
  ctx.restore();
  void G;
}

const riderStyle = (p, pal) => ({ outline: pal[4], outlineWidth: 2, frame: pal[1], top: pal[2], prop: { type: p.prop.type, colors: [pal[1], pal[3]] } });
`,

  blueprint: `
const DEFAULT_PAL = ['#1f4e8c', '#e8f1ff', '#9cc3e6', '#f2d16b', '#0f2a4d']; // paper blue, line white, grid, accent, deep

function paintBackground(kit, g, rng, w, h, p, pal) {
  g.drawImage(kit.paper(ID, w, h, { color: pal[0], grain: 0.04, blotches: 22, blotchColor: 'rgba(10,30,70,0.18)', fibers: false, vignette: 0.3, vignetteColor: '5,15,40' }), 0, 0);
  for (let x = 0; x < w; x += 20) {
    g.fillStyle = x % 100 === 0 ? 'rgba(232,241,255,0.22)' : 'rgba(232,241,255,0.08)';
    g.fillRect(x, 0, 1, h);
  }
  for (let y = 0; y < h; y += 20) {
    g.fillStyle = y % 100 === 0 ? 'rgba(232,241,255,0.22)' : 'rgba(232,241,255,0.08)';
    g.fillRect(0, y, w, 1);
  }
  // ground line with section hatching below it
  g.strokeStyle = pal[1];
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, p.groundY);
  g.lineTo(w, p.groundY);
  g.stroke();
  g.save();
  g.beginPath();
  g.rect(0, p.groundY + 2, w, 34);
  g.clip();
  kit.hatch(g, { spacing: 9, angle: -0.8, color: 'rgba(232,241,255,0.45)', width: 1, wobble: 0, seed: ID });
  g.restore();
  // title block (bottom right)
  const tw = 300;
  const th = 90;
  const tx = w - tw - 40;
  const ty = h - th - 40;
  g.strokeStyle = pal[1];
  g.strokeRect(tx, ty, tw, th);
  g.beginPath();
  g.moveTo(tx, ty + 40);
  g.lineTo(tx + tw, ty + 40);
  g.moveTo(tx + 180, ty + 40);
  g.lineTo(tx + 180, ty + th);
  g.stroke();
  g.fillStyle = pal[1];
  g.font = '700 22px ' + kit.FONT.mono;
  g.fillText('FIG. ' + String(p.chapter.num || 1), tx + 14, ty + 28);
  g.font = '15px ' + kit.FONT.mono;
  g.fillText(String(p.chapter.dateLabel || ''), tx + 14, ty + 70);
  g.fillText('SCALE 1:20', tx + 192, ty + 70);
}

function drawSubject(kit, ctx, p, T, F, pal) {
  // REPLACE: the chapter's machine as a technical drawing: white outlines, centre lines, dimensions
  const G = geom(p, F);
  ctx.save();
  ctx.strokeStyle = pal[1];
  ctx.lineWidth = 2.5;
  ctx.strokeRect(G.bx - G.w * 0.6, G.hub.y, G.w * 1.2, G.h);
  ctx.setLineDash([16, 6, 3, 6]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(G.bx, G.hub.y - G.hub.r - 30);
  ctx.lineTo(G.bx, G.by + 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(G.hub.x, G.hub.y, G.hub.r, 0, Math.PI * 2);
  ctx.stroke();
  const a = T * 1.4;
  for (let k = 0; k < 6; k++) {
    const t = a + (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(G.hub.x, G.hub.y);
    ctx.lineTo(G.hub.x + Math.cos(t) * G.hub.r, G.hub.y + Math.sin(t) * G.hub.r);
    ctx.stroke();
  }
  // dimension line (height)
  const dx = G.bx + G.w + 40;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(dx, G.hub.y);
  ctx.lineTo(dx, G.by);
  for (const [y, s] of [[G.hub.y, 1], [G.by, -1]]) {
    ctx.moveTo(dx - 6, y + 12 * s);
    ctx.lineTo(dx, y);
    ctx.lineTo(dx + 6, y + 12 * s);
  }
  ctx.stroke();
  ctx.fillStyle = pal[1];
  ctx.font = '16px ' + kit.FONT.mono;
  ctx.fillText('H', dx + 10, (G.hub.y + G.by) / 2);
  ctx.restore();
}

function drawBeat(kit, ctx, p, T, F, pal) {
  // REPLACE: the bar-3 beat (here: a callout circle draws itself around the hub, in the accent ink)
  const G = geom(p, F);
  const e = beatEnv(kit, p, T);
  if (e < 0.01) return;
  ctx.save();
  ctx.strokeStyle = pal[3];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(G.hub.x, G.hub.y, G.hub.r * 1.35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, e * 1.3));
  ctx.stroke();
  ctx.restore();
}

const riderStyle = (p, pal) => ({ wire: pal[1], prop: { type: p.prop.type, colors: [pal[1], pal[3]] } });
`,

  newsreel: `
const DEFAULT_PAL = ['#e8e2d2', '#9a958a', '#55524b', '#1e1d1b', '#c7c0ad']; // light, mid, dark, black, highlight

function paintBackground(kit, g, rng, w, h, p, pal) {
  const sky = g.createLinearGradient(0, 0, 0, p.groundY);
  sky.addColorStop(0, pal[2]);
  sky.addColorStop(0.7, pal[0]);
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  kit.addBlotches(g, w, p.groundY, rng, 'rgba(255,255,255,0.08)', 14, 60, 220); // soft clouds
  // far skyline / hills in mid grey, near ground dark with a lighter road
  g.fillStyle = pal[1];
  g.beginPath();
  g.moveTo(0, p.groundY);
  for (let x = 0; x <= w; x += 30) g.lineTo(x, p.groundY - 50 - 50 * kit.fbm2(x * 0.005, 4.4, 3));
  g.lineTo(w, p.groundY);
  g.fill();
  g.fillStyle = pal[3];
  g.fillRect(0, p.groundY, w, h - p.groundY);
  g.fillStyle = pal[2];
  g.fillRect(0, p.groundY, w, 18);
  kit.addGrain(g, w, h, rng, 0.05);
}

function drawSubject(kit, ctx, p, T, F, pal) {
  // REPLACE: the chapter's subject in photographic greys (no outlines; tone and silhouette)
  const G = geom(p, F);
  ctx.save();
  const body = ctx.createLinearGradient(G.bx - G.w, 0, G.bx + G.w, 0);
  body.addColorStop(0, pal[2]);
  body.addColorStop(0.6, pal[4]);
  body.addColorStop(1, pal[3]);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(G.bx - G.w, G.by);
  ctx.lineTo(G.bx - G.w * 0.4, G.hub.y);
  ctx.lineTo(G.bx + G.w * 0.4, G.hub.y);
  ctx.lineTo(G.bx + G.w, G.by);
  ctx.fill();
  ctx.fillStyle = pal[3];
  const a = T * 2;
  for (let k = 0; k < 4; k++) {
    ctx.save();
    ctx.translate(G.hub.x, G.hub.y);
    ctx.rotate(a + (k * Math.PI) / 2);
    ctx.fillRect(0, -G.hub.r * 0.09, G.hub.r, G.hub.r * 0.18);
    ctx.restore();
  }
  // smoke from the top drifting with the wind (seeded puffs, no state)
  for (let k = 0; k < 7; k++) {
    const age = (((T * 0.6 + k / 7) % 1) + 1) % 1; // JS % is negative for negative T (rawLocalT < 0 while sliding in)
    ctx.fillStyle = 'rgba(230,226,214,' + (0.35 * (1 - age)).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(G.bx - G.w * 0.2 - age * 160, G.hub.y - 30 - age * 120, 14 + age * 40, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBeat(kit, ctx, p, T, F, pal) {
  // REPLACE: the bar-3 beat (here: a lamp switches on, blooming in the film)
  const G = geom(p, F);
  const e = beatEnv(kit, p, T);
  if (e < 0.01) return;
  kit.glow(ctx, G.hub.x, G.hub.y, G.hub.r * 1.4, '#fff6dc', e * 0.8);
}

const riderStyle = (p, pal) => ({ silhouette: pal[3], prop: { type: p.prop.type, colors: [pal[3], pal[2]] } });
`,

  screen: `
const DEFAULT_PAL = ['#07131f', '#39d0ff', '#9effc8', '#ffb347', '#1c3b57']; // ground, line, line 2, alert, grid

function paintBackground(kit, g, rng, w, h, p, pal) {
  g.fillStyle = pal[0];
  g.fillRect(0, 0, w, h);
  // faint dot grid
  g.fillStyle = pal[4];
  for (let y = 20; y < p.groundY; y += 40) for (let x = 20; x < w; x += 40) g.fillRect(x, y, 2, 2);
  // perspective floor grid below the ground line
  g.strokeStyle = pal[4];
  g.lineWidth = 1.2;
  const vx = w * 0.6;
  for (let k = -20; k <= 20; k++) {
    g.beginPath();
    g.moveTo(vx + k * 18, p.groundY);
    g.lineTo(vx + k * 160, h);
    g.stroke();
  }
  for (let k = 0; k < 9; k++) {
    const y = p.groundY + (h - p.groundY) * Math.pow(k / 8, 1.8);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.strokeStyle = pal[1];
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, p.groundY);
  g.lineTo(w, p.groundY);
  g.stroke();
}

function drawSubject(kit, ctx, p, T, F, pal) {
  // REPLACE: the subject as glowing wireframe strokes + a readout
  const G = geom(p, F);
  kit.glow(ctx, G.hub.x, G.hub.y, G.hub.r * 1.8, pal[1], 0.35);
  ctx.save();
  ctx.strokeStyle = pal[1];
  ctx.lineWidth = 2;
  ctx.strokeRect(G.bx - G.w * 0.5, G.hub.y, G.w, G.h);
  for (let y = G.hub.y + 30; y < G.by; y += 30) {
    ctx.beginPath();
    ctx.moveTo(G.bx - G.w * 0.5, y);
    ctx.lineTo(G.bx + G.w * 0.5, y);
    ctx.stroke();
  }
  // rotating ring as an ellipse (3D wireframe feel)
  const a = T * 1.5;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(G.hub.x, G.hub.y, G.hub.r, G.hub.r * Math.abs(Math.cos(a + k * 1.05)), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // telemetry text (scrolls)
  ctx.fillStyle = pal[2];
  ctx.font = '16px ' + kit.FONT.mono;
  for (let k = 0; k < 6; k++) {
    const n = Math.floor(T * 4) + k;
    ctx.fillText('CH' + String(p.chapter.num).padStart(2, '0') + '  ' + String(1000 + Math.floor(kit.hash11(n) * 8999)), F.x + 10, F.y + 30 + k * 22);
  }
  ctx.restore();
}

function drawBeat(kit, ctx, p, T, F, pal) {
  // REPLACE: the bar-3 beat (here: target brackets lock onto the hub)
  const G = geom(p, F);
  const e = beatEnv(kit, p, T);
  if (e < 0.01) return;
  const r = G.hub.r * (2.2 - 0.9 * Math.min(1, e * 1.4));
  ctx.save();
  ctx.strokeStyle = pal[3];
  ctx.lineWidth = 3;
  ctx.globalAlpha = Math.min(1, e * 2);
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    ctx.beginPath();
    ctx.moveTo(G.hub.x + sx * r, G.hub.y + sy * r * 0.6);
    ctx.lineTo(G.hub.x + sx * r, G.hub.y + sy * r);
    ctx.lineTo(G.hub.x + sx * r * 0.6, G.hub.y + sy * r);
    ctx.stroke();
  }
  ctx.restore();
}

const riderStyle = (p, pal) => ({ wire: pal[1], prop: { type: p.prop.type, colors: [pal[1], pal[2]] } });
`,

  pixel: `
const DEFAULT_PAL = ['#c9c5bb', '#3f8fd2', '#2e7d32', '#f2c14e', '#1d1d1d']; // sky, blue, green, yellow, ink
const CELL = 6; // size of one art pixel in canvas px (gallery-ride 1000 px -> 166 art pixels)

function paintBackground(kit, g, rng, w, h, p, pal) {
  // baked at low resolution and scaled up with hard pixels
  const sw = Math.round(w / CELL);
  const sh = Math.round(h / CELL);
  const gy = Math.round(p.groundY / CELL);
  const s = kit.createCanvas(sw, sh);
  const q = s.getContext('2d');
  for (let y = 0; y < gy; y++) {
    q.fillStyle = kit.mixColor(pal[1], pal[0], Math.floor((y / gy) * 5) / 5); // banded sky
    q.fillRect(0, y, sw, 1);
  }
  q.fillStyle = pal[2];
  for (let x = 0; x < sw; x++) {
    const hh = 6 + Math.round(5 * kit.noise1(x * 0.08, 3));
    q.fillRect(x, gy - hh, 1, hh);
  }
  q.fillStyle = pal[4];
  q.fillRect(0, gy, sw, sh - gy);
  q.fillStyle = kit.mixColor(pal[4], pal[2], 0.4);
  for (let y = gy + 2; y < sh; y += 3) for (let x = (y % 2) * 2; x < sw; x += 4) q.fillRect(x, y, 2, 1); // brick road
  g.imageSmoothingEnabled = false;
  g.drawImage(s, 0, 0, w, h);
}

function drawSubject(kit, ctx, p, T, F, pal) {
  // REPLACE: the subject, drawn inside kit.pixelate so it comes out as hard pixels
  const G = geom(p, F);
  const Tq = kit.quantizeTime(T, 8); // stepped motion
  kit.pixelate(ctx, ID + '_px', p.W, p.H, CELL, (g) => {
    g.fillStyle = pal[4];
    g.fillRect(G.bx - G.w * 0.5, G.hub.y, G.w, G.h);
    g.fillStyle = pal[3];
    for (let y = G.hub.y + 20; y < G.by - 10; y += 36) g.fillRect(G.bx - 12, y, 24, 18); // windows
    g.fillStyle = pal[3];
    g.strokeStyle = pal[4];
    for (let k = 0; k < 4; k++) {
      g.save();
      g.translate(G.hub.x, G.hub.y);
      g.rotate(Tq * 2 + (k * Math.PI) / 2);
      g.strokeRect(0, -G.hub.r * 0.15, G.hub.r, G.hub.r * 0.3);
      g.fillRect(0, -G.hub.r * 0.15, G.hub.r, G.hub.r * 0.3);
      g.restore();
    }
    if (p.actor && p.actor.visible) p.actor.draw(g, p.actor.rig(), riderStyle(p, pal)); // rider in pixels too
  });
}

function drawBeat(kit, ctx, p, T, F, pal) {
  // REPLACE: the bar-3 beat (here: a "+1" coin pops up, stepped)
  const e = beatEnv(kit, p, T);
  if (e < 0.01) return;
  const G = geom(p, F);
  const y = Math.round((G.hub.y - G.hub.r - 30 - 40 * e) / CELL) * CELL;
  ctx.fillStyle = pal[3];
  ctx.fillRect(G.hub.x - 3 * CELL, y, 6 * CELL, 6 * CELL);
  ctx.fillStyle = pal[4];
  ctx.fillRect(G.hub.x - CELL, y + CELL, 2 * CELL, 4 * CELL);
}

const riderStyle = (p, pal) => ({ outline: pal[4], outlineWidth: 3, frame: pal[1], prop: { type: p.prop.type, colors: [pal[3], pal[1]] } });
`,

  ink: `
const DEFAULT_PAL = ['#efe8d8', '#1c1c1c', '#6b7b6e', '#b8322a', '#a89f8a']; // paper, ink, wash, seal red, light wash

function paintBackground(kit, g, rng, w, h, p, pal) {
  g.drawImage(kit.paper(ID, w, h, { color: pal[0], grain: 0.035, blotches: 14, vignette: 0.12 }), 0, 0);
  // layered mountain washes, paler with distance (atmospheric perspective)
  // ridge washes: far ranges pale and high, near ranges darker (shape 'ridge' fades toward its base)
  const ranges = [[p.groundY - 420, 300, 0.22, pal[4]], [p.groundY - 300, 260, 0.3, pal[2]], [p.groundY - 170, 190, 0.42, pal[2]]];
  ranges.forEach(([y, hh, a, c], k) => kit.wash(g, -40, y, w + 80, hh, c, { shape: 'ridge', alpha: a, layers: 3, peaks: 3 + k, seed: ID + 'range' + k }));
  // ground band: flat dry-brush wash with reeds
  kit.wash(g, -80, p.groundY - 10, w + 160, h - p.groundY + 80, pal[2], { alpha: 0.16, layers: 3, shape: 'rect', rough: 0.04, seed: ID + 'ground' });
  for (let x = 20; x < w; x += 26) {
    const hh = 30 + 50 * kit.hash11(x);
    kit.inkLine(g, [[x, h - 20], [x + 8, h - 20 - hh * 0.5], [x + 4 + 14 * kit.hash11(x + 1), h - 20 - hh]], { width: 3, color: pal[1], alpha: 0.6, seed: 'reed' + x });
  }
  kit.inkLine(g, [[0, p.groundY], [w * 0.4, p.groundY + 4], [w, p.groundY - 2]], { width: 4, color: pal[1], alpha: 0.7, seed: ID + 'shore' });
}

function drawSubject(kit, ctx, p, T, F, pal) {
  // REPLACE: the subject in brush strokes: a wash body + confident tapered outlines
  const G = geom(p, F);
  const body = kit.bake(ID + '_body_v1', 400, 600, (g) => {
    kit.wash(g, 120, 40, 160, 540, pal[2], { alpha: 0.35, layers: 4, shape: 'rect', rough: 0.08, seed: ID + 'body' });
  });
  ctx.drawImage(body, G.bx - 200 * (G.h / 560), G.hub.y - 40 * (G.h / 560), 400 * (G.h / 560), 600 * (G.h / 560));
  kit.inkLine(ctx, [[G.bx - G.w, G.by], [G.bx - G.w * 0.6, (G.by + G.hub.y) / 2], [G.bx - G.w * 0.4, G.hub.y]], { width: 6, color: pal[1], seed: ID + 'l' });
  kit.inkLine(ctx, [[G.bx + G.w * 0.4, G.hub.y], [G.bx + G.w * 0.6, (G.by + G.hub.y) / 2], [G.bx + G.w, G.by]], { width: 6, color: pal[1], seed: ID + 'r' });
  const a = T * 1.3;
  for (let k = 0; k < 4; k++) {
    const t = a + (k * Math.PI) / 2;
    const tip = [G.hub.x + Math.cos(t) * G.hub.r, G.hub.y + Math.sin(t) * G.hub.r];
    const mid = [G.hub.x + Math.cos(t + 0.15) * G.hub.r * 0.55, G.hub.y + Math.sin(t + 0.15) * G.hub.r * 0.55];
    kit.inkLine(ctx, [[G.hub.x, G.hub.y], mid, tip], { width: 9, color: pal[1], taper: 'end', seed: ID + 'b' + k });
  }
}

function drawBeat(kit, ctx, p, T, F, pal) {
  // REPLACE: the bar-3 beat (here: a red seal stamps onto the paper)
  const e = beatEnv(kit, p, T);
  if (e < 0.01) return;
  const s = 54 * (1 + 0.25 * (1 - Math.min(1, e * 2)));
  const x = F.x + F.w - s - 20;
  const y = F.y + 20;
  ctx.save();
  ctx.globalAlpha = Math.min(1, e * 2) * 0.9;
  ctx.fillStyle = pal[3];
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = pal[0];
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 6, y + 6, s - 12, s - 12);
  ctx.restore();
}

const riderStyle = (p, pal) => ({ silhouette: pal[1], prop: { type: p.prop.type, colors: [pal[3], pal[1]] } });
`,

  fresco: `
const DEFAULT_PAL = ['#e8d6b0', '#b5523b', '#1d6b73', '#d9a441', '#2a1d14']; // plaster, red ochre, blue-green, yellow ochre, black

function paintBackground(kit, g, rng, w, h, p, pal) {
  g.drawImage(kit.paper(ID, w, h, { color: pal[0], grain: 0.08, blotches: 40, blotchColor: 'rgba(120,80,40,0.08)', fibers: false, vignette: 0.25 }), 0, 0);
  // register bands (horizontal ground lines) and a zig-zag water / pattern band below the road
  g.fillStyle = pal[4];
  for (const y of [p.groundY, p.groundY + 16, Math.max(40, p.groundY - 520)]) g.fillRect(20, y, w - 40, 5);
  g.strokeStyle = pal[2];
  g.lineWidth = 5;
  for (let row = 0; row < 3; row++) {
    const y0 = p.groundY + 60 + row * 50;
    if (y0 > h - 30) break;
    g.beginPath();
    for (let x = 20; x <= w - 20; x += 24) g.lineTo(x, y0 + (((x / 24) | 0) % 2 ? 14 : -14));
    g.stroke();
  }
  // flaking plaster: pale chips
  for (let i = 0; i < 70; i++) {
    g.fillStyle = 'rgba(245,235,215,' + (0.4 + 0.4 * rng()).toFixed(2) + ')';
    g.beginPath();
    const x = rng() * w;
    const y = rng() * h;
    g.ellipse(x, y, 3 + 10 * rng(), 2 + 6 * rng(), rng() * 3, 0, Math.PI * 2);
    g.fill();
  }
}

function drawSubject(kit, ctx, p, T, F, pal) {
  // REPLACE: the subject as an embossed relief / flat fresco figure with dark outlines, in profile
  const G = geom(p, F);
  const tower = (c) => {
    c.moveTo(G.bx - G.w, G.by);
    c.lineTo(G.bx - G.w * 0.5, G.hub.y);
    c.lineTo(G.bx + G.w * 0.5, G.hub.y);
    c.lineTo(G.bx + G.w, G.by);
    c.closePath();
  };
  kit.emboss(ctx, tower, { fill: pal[1], depth: 3 });
  ctx.strokeStyle = pal[4];
  ctx.lineWidth = 3;
  ctx.beginPath();
  tower(ctx);
  ctx.stroke();
  const a = T * 1.2; // keep motion small and calm in ancient media
  ctx.fillStyle = pal[3];
  for (let k = 0; k < 6; k++) {
    const t = a + (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.ellipse(G.hub.x + Math.cos(t) * G.hub.r * 0.6, G.hub.y + Math.sin(t) * G.hub.r * 0.6, G.hub.r * 0.42, G.hub.r * 0.14, t, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawBeat(kit, ctx, p, T, F, pal) {
  // REPLACE: the bar-3 beat (here: a sun disc rises over the register)
  const e = beatEnv(kit, p, T);
  if (e < 0.01) return;
  const x = F.x + F.w * 0.18;
  const y = F.y + F.h * 0.32 - 40 * e;
  ctx.save();
  ctx.globalAlpha = Math.min(1, e * 2);
  ctx.fillStyle = pal[1];
  ctx.strokeStyle = pal[4];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const riderStyle = (p, pal) => ({ outline: pal[4], outlineWidth: 2.5, frame: pal[2], top: pal[2], plumage: pal[0], prop: { type: p.prop.type, colors: [pal[1], pal[3]] } });
`,
};

const POST = {
  newsreel: { pre: '  ctx.save();\n  const wv = kit.gateWeave(T); // the whole picture weaves in the film gate\n  ctx.translate(wv.dx, wv.dy);\n', post: '  ctx.restore();\n  kit.filmLook(ctx, p.W, p.H, T, { vignette: 0.55 }); // grain, flicker, scratches (draw last)\n' },
  screen: { post: '  kit.crt(ctx, p.W, p.H, T, { tint: pal[1] });\n' },
};

/** Full module source for a look skeleton. `header` is new-scene.mjs's header comment. */
export function lookSkeleton(id, look, header) {
  if (!BODY[look]) throw new Error(`unknown look "${look}" (${Object.keys(BODY).join(' | ')})`);
  let render = RENDER(POST[look] || {});
  if (look === 'pixel') {
    // the rider is drawn inside the pixelated subject layer
    render = render.replace("  if (p.actor && p.actor.visible) p.actor.draw(ctx, p.actor.rig(), riderStyle(p, pal));\n", '');
  }
  return header + COMMON_TOP(id, look) + BODY[look] + render;
}
