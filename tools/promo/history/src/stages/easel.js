// src/stages/easel.js
// STAGE "easel": a painter stands on a grassy hilltop (lower left) at a wooden easel and
// paints watercolour. The board on the easel shows the current chapter being painted in,
// beat by beat: the big date label, the title, then a small watercolour miniature of the
// chapter scene (wash rows, detail dabs, signature + seal). Behind and below the hill, the
// VALLEY is the chapter's animated scene, softened into the paper at its edges. On every
// chapter bar line the painter sweeps a wash across the board and a paper-wash wipe with
// bleeding edges carries the valley into the next chapter (one beat). Intro: the camera
// starts close on the board while the film title is painted, then settles on the painter.
// Outro: the painter steps back, the camera pulls out and every chapter's painting is
// pinned on strings fanning out from the easel, then the closing line + credits.
//
// SCENE CANVAS (what each chapter's render(kit, ctx, p) draws into) — see SCENE_GUIDE.md
//   1920 x 1080 px, cleared, composited full-bleed 1:1 (an optional slow push-in: PUSH).
//   Covered by the stage: the lower-left hill + painter + easel (geom.js COVER: everything
//   left of x ≈ 640 below y ≈ 300, plus the hill whose crest falls from y ≈ 760 at x 600 to the
//   bottom edge at x ≈ 1110), the top ~70 px (ruler + paper haze) and a ragged ~60–120 px
//   paper fade on the other edges. A soft paper veil lies over the upper-left behind the painter.
//   Safe area for the key subject: p.safe = { x: 760, y: 110, w: 1000, h: 830 } (clear of the fade).
//   Horizon guidance: p.horizonY = 430; valley-floor reference: p.groundY = 720.
//   p.layout = { x: 840, y: 50, s: 0.9, x0, x1, y0, y1 } maps a 1000x1000 design (a
//   gallery-ride panel) into the safe area; x0..x1 / y0..y1 = the whole canvas in design
//   units (extend backgrounds / spawn ranges there). p.actor = null (the stage draws the
//   painter); p.action = 'paint'; p.cover = COVER polygon.
//
// The stage overlays: paper haze, hill, easel + board, painter, grass, the top time ruler.

import {
  CHAPTERS,
  NUM_CHAPTERS,
  CHAPTER_SEC,
  CHAPTER_BARS,
  INTRO_SEC,
  OUTRO_START,
  OUTRO_SEC,
  TOTAL_DURATION,
  BEAT_SEC,
  BAR_SEC,
  clamp,
  smoothstep,
  smootherstep,
  envelope,
  lerp,
  getBeatState,
} from '../beat/timeline.js';
import { VIEW_W, VIEW_H } from '../beat/camera.js';
import { baseParams } from './common.js';
import { FONT } from '../kit/fonts.js';
import { FILM } from '../data/film.config.js';
import { createCanvas, hexToRgb, noise1, hash11, makePRNG, hashSeed } from '../kit/kit.js';
import { getCharacter } from '../characters/index.js';
import { SCENE, BOARD, CARD, EASEL, PAINTER, COVER, RULER, hillY } from './easel/geom.js';
import {
  PAPER,
  INK,
  paperTexture,
  hazeOverlay,
  hillArt,
  HILL_BOX,
  easelBack,
  easelFront,
  EASEL_BOX,
  drawJar,
  drawGrass,
  sketchValley,
  outroPanorama,
  blot,
} from './easel/scenery.js';
import {
  CARD_RES,
  INTRO_RES,
  bakeCard,
  cardInks,
  chapterSchedule,
  introSchedule,
  sweepEvent,
  brushAt,
  renderCard,
  drawBoard,
  drawWetTip,
  drawCardWipe,
  defaultCrop,
  setPaletteAt,
} from './easel/painting.js';

const SW = SCENE.W;
const SH = SCENE.H;
const TAU = Math.PI * 2;
const B_CH = CHAPTER_BARS * 4; // beats per chapter
const B_INTRO = Math.round(INTRO_SEC / BEAT_SEC);
const PUSH = 0; // valley push-in over a chapter (e.g. 0.025); 0 = off (cheaper)
const PUSH_C = { x: SCENE.safe.x + SCENE.safe.w / 2, y: SCENE.safe.y + SCENE.safe.h / 2 };

let env = null; // { kit, character, renderChapter, painter }

// =============================================================================
// scene params
// =============================================================================
function chapterParams(chapter, t, opts = {}) {
  const p = baseParams('easel', chapter, t, SW, SH, Boolean(opts.isThumbnail));
  p.groundY = SCENE.groundY;
  p.horizonY = SCENE.horizonY;
  p.safe = SCENE.safe;
  p.layout = SCENE.layout;
  p.cover = COVER;
  p.action = 'paint';
  p.actor = null;
  return p;
}

function renderStill(ctx, chapter, localT = CHAPTER_SEC / 2, opts = {}) {
  const p = chapterParams(chapter, chapter.t0 + localT, opts);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, SW, SH);
  ctx.drawImage(paperTexture(env.kit), 0, 0);
  env.renderChapter(env.kit, ctx, chapter, p);
  // --guides shows the real paper fade too (text under it is lost in the film)
  if (opts.isThumbnail || opts.withFrame || opts.guides) ctx.drawImage(hazeOverlay(env.kit), 0, 0);
  if (opts.guides) drawGuides(ctx);
  return p;
}

/** Author guides: safe area, horizon, valley floor, the 1000-design box and the covered area. */
function drawGuides(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(40, 70, 40, 0.45)';
  ctx.beginPath();
  COVER.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(244, 237, 221, 0.6)';
  ctx.fillRect(0, 0, SW, 70);
  ctx.setLineDash([12, 8]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#e63946';
  const s = SCENE.safe;
  ctx.strokeRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = '#1d6fb8';
  const L = SCENE.layout;
  ctx.strokeRect(L.x, L.y, 1000 * L.s, 1000 * L.s);
  ctx.setLineDash([]);
  ctx.lineWidth = 2;
  for (const [y, c, label] of [[SCENE.horizonY, '#1d6fb8', 'horizonY 430'], [SCENE.groundY, '#2a9d4f', 'groundY 720']]) {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SW, y);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.font = `700 22px ${FONT.sans}`;
    ctx.fillText(label, SW - 220, y - 8);
  }
  ctx.fillStyle = '#e63946';
  ctx.fillText('safe', s.x + 10, s.y + 28);
  ctx.fillStyle = '#1d6fb8';
  ctx.fillText('layout (1000-unit design)', L.x + 10, L.y + 1000 * L.s - 12);
  ctx.fillStyle = '#f4eddd';
  ctx.fillText('hill + painter + easel', 40, 1040);
  ctx.restore();
}

/** 300x300 thumbnail: the layout square of a calm mid-chapter still. */
function makeThumb(chapter) {
  const kit = env.kit;
  const key = `easel_thumb_${chapter.id}`;
  if (kit.thumbCache.has(key)) return kit.thumbCache.get(key);
  const src = stillCanvas(chapter);
  const c = kit.createCanvas(300, 300);
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  const L = SCENE.layout;
  g.drawImage(src, L.x, L.y, 1000 * L.s, 1000 * L.s, 0, 0, 300, 300);
  kit.thumbCache.set(key, c);
  return c;
}

/**
 * Default board-miniature crop: the band of the layout box (aspect of `base`) where the coarse
 * picture varies most ACROSS x (a subject standing somewhere), not where it is merely textured
 * (hatched ground, grain average out at this resolution). Runs once per chapter; deterministic.
 */
function autoCrop(still, base) {
  const [bx, , bw, bh] = base;
  const L = SCENE.layout;
  const top = Math.max(SCENE.safe.y, L.y);
  const bot = Math.min(SCENE.safe.y + SCENE.safe.h, L.y + 1000 * L.s);
  const sw = 32;
  const sh = Math.max(8, Math.round(((bot - top) / bw) * sw * 1.5));
  const c = createCanvas(sw, sh);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(still, bx, top, bw, bot - top, 0, 0, sw, sh);
  let d;
  try {
    d = g.getImageData(0, 0, sw, sh).data;
  } catch (e) {
    return base;
  }
  const rowE = new Float64Array(sh);
  for (let y = 0; y < sh; y++) {
    for (const ch of [0, 1, 2]) {
      let m = 0;
      for (let x = 0; x < sw; x++) m += d[(y * sw + x) * 4 + ch];
      m /= sw;
      for (let x = 0; x < sw; x++) rowE[y] += (d[(y * sw + x) * 4 + ch] - m) ** 2;
    }
  }
  const win = Math.max(1, Math.round((bh / (bot - top)) * sh));
  let best = -1;
  let bestY = 0;
  for (let y = 0; y + win <= sh; y++) {
    let e = 0;
    for (let k = 0; k < win; k++) e += rowE[y + k];
    if (e > best * 1.0001) {
      best = e;
      bestY = y;
    }
  }
  const y0 = top + (bestY / sh) * (bot - top);
  return [bx, Math.round(Math.min(bot - bh, Math.max(top, y0))), bw, bh];
}

const stills = new Map();
/** Calm mid-chapter still of the scene canvas (cached; source of the miniature + thumbnail). */
function stillCanvas(chapter) {
  if (stills.has(chapter.id)) return stills.get(chapter.id);
  const c = createCanvas(SW, SH);
  renderStill(c.getContext('2d'), chapter, CHAPTER_SEC / 2, { isThumbnail: true });
  stills.set(chapter.id, c);
  return c;
}

// =============================================================================
// cards + schedules
// =============================================================================
const MINI = { x: 18, y: 115, w: 264, h: 92 };
const cards = new Map();
const finals = new Map();

function chapterCard(ch) {
  if (cards.has(ch.id)) return cards.get(ch.id);
  const inks = cardInks(ch);
  const crop = (ch.easel && ch.easel.crop) || autoCrop(stillCanvas(ch), defaultCrop(MINI));
  const card = bakeCard(env.kit, {
    key: `${ch.id}_${ch.num}`,
    res: CARD_RES,
    lines: [
      { text: ch.dateLabel || '', weight: 700, family: FONT.kai, size: 50, color: inks.date, y: 64, maxW: 230 },
      { text: ch.title || '', weight: 700, family: FONT.kai, size: 27, color: inks.title, y: 101, maxW: 262 },
    ],
    mini: { canvas: stillCanvas(ch), sx: crop[0], sy: crop[1], sw: crop[2], sh: crop[3] },
    miniRect: MINI,
    seal: { text: String(ch.num), color: inks.seal, font: FONT.serif },
  });
  const sched = chapterSchedule(card, ch, B_CH);
  const entry = { card, sched, inks, ch };
  cards.set(ch.id, entry);
  return entry;
}

function finalCard(ch) {
  if (finals.has(ch.id)) return finals.get(ch.id);
  const e = chapterCard(ch);
  const c = createCanvas(CARD.w * CARD_RES, CARD.h * CARD_RES);
  renderCard(e.card, e.sched, 1e9, true, c);
  finals.set(ch.id, c);
  return c;
}

let intro = null;
function introCard() {
  if (intro) return intro;
  const pal = FILM.palette || {};
  const lines = [{ text: FILM.title || '', weight: 700, family: FONT.kai, size: 58, color: INK, y: 98, center: true, maxW: 264 }];
  if (FILM.subtitle) lines.push({ text: FILM.subtitle, weight: 500, family: FONT.kai, size: 19, color: '#4a5a66', y: 138, center: true, maxW: 264 });
  if (FILM.subtitleAlt) lines.push({ text: FILM.subtitleAlt, weight: 500, family: FONT.garamond, size: 16, color: '#7a6a58', y: 166, center: true, maxW: 250 });
  const card = bakeCard(env.kit, { key: 'intro_title', res: INTRO_RES, lines, mini: null, miniRect: null, seal: { text: '序', color: '#b8322a', font: FONT.serif } });
  card.lineColors = lines.map((l) => l.color);
  card.inkTitle = INK;
  const sched = introSchedule(card, B_INTRO);
  sched.signAt = Math.max(1, B_INTRO - 2);
  const full = createCanvas(CARD.w * INTRO_RES, CARD.h * INTRO_RES);
  renderCard(card, sched, 1e9, true, full);
  intro = { card, sched, full, accent: pal.accent || '#e9c46a' };
  return intro;
}

// =============================================================================
// timing helpers
// =============================================================================
/** Which plan the painter follows at t (switches half a beat before each bar line). */
function phaseAt(t) {
  const tb = t + 0.5 * BEAT_SEC;
  if (tb < INTRO_SEC) return { kind: 'intro', b: t / BEAT_SEC };
  if (tb < OUTRO_START) {
    const i = clamp(Math.floor((tb - INTRO_SEC) / CHAPTER_SEC), 0, NUM_CHAPTERS - 1);
    return { kind: 'chapter', i, b: (t - CHAPTERS[i].t0) / BEAT_SEC };
  }
  return { kind: 'outro', b: (t - OUTRO_START) / BEAT_SEC };
}

/** Wash transition progress (0..1) around bar line tb, else -1. */
function washAt(t, tb) {
  const a = tb - 0.5 * BEAT_SEC;
  const b = tb + 0.5 * BEAT_SEC;
  if (t < a || t > b) return -1;
  return (t - a) / (b - a);
}

/** Camera: zoom z and the world point A shown at the screen centre. */
function cameraAt(t) {
  const C = { x: VIEW_W / 2, y: VIEW_H / 2 };
  if (t < INTRO_SEC) {
    const z0 = 2.25;
    const focus = { x: BOARD.x + BOARD.w / 2, y: BOARD.y + BOARD.h / 2 + 6 };
    const p0 = INTRO_SEC * 0.5;
    const p1 = Math.max(p0 + 0.8, INTRO_SEC - 0.75 * BEAT_SEC);
    const k = smootherstep(p0, p1, t);
    // zoom in log space so the pull-back feels even
    const z = Math.exp(lerp(Math.log(z0), 0, k));
    // keep the board's on-screen position moving smoothly toward its rest place
    const ax = lerp(focus.x, C.x, (z0 - z) / (z0 - 1));
    const ay = lerp(focus.y, C.y, (z0 - z) / (z0 - 1));
    return { z, ax, ay };
  }
  if (t < OUTRO_START + 0.5 * BEAT_SEC) return { z: 1, ax: C.x, ay: C.y };
  const T = (t - OUTRO_START) / (OUTRO_SEC / 12);
  const z = lerp(1, 0.62, smootherstep(0.5, 3.0, T));
  // keep the bottom-left corner of the world pinned to the screen's bottom-left corner
  return { z, ax: C.x / z, ay: VIEW_H - C.y / z };
}

function applyCamera(ctx, cam) {
  ctx.setTransform(cam.z, 0, 0, cam.z, VIEW_W / 2 - cam.ax * cam.z, VIEW_H / 2 - cam.ay * cam.z);
}

// =============================================================================
// valley
// =============================================================================
/** Render chapter `ch` into scene slot `slotIdx` at film time t; returns the canvas. */
function renderValley(ch, t, slotIdx) {
  const kit = env.kit;
  const slot = kit.getSlot(slotIdx);
  const g = slot.ctx;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, SW, SH);
  g.drawImage(paperTexture(kit), 0, 0);
  env.renderChapter(kit, g, ch, chapterParams(ch, t));
  return slot.canvas;
}

/**
 * Draw the valley. PUSH > 0 adds a slow push-in over the chapter; it costs a resampled
 * full-frame blit (~5 ms in software rendering), so it is off by default.
 */
function drawPushed(ctx, img, k) {
  if (!PUSH) {
    ctx.drawImage(img, 0, 0);
    return;
  }
  const v = 1 + PUSH * clamp(k, 0, 1.2);
  ctx.drawImage(img, PUSH_C.x - PUSH_C.x * v, PUSH_C.y - PUSH_C.y * v, SW * v, SH * v);
}

/** Paper-wash wipe: `next` floods in from the left over `prev` with a bleeding wet edge. */
function drawValleyWipe(ctx, nextImg, w, color, seed, nextPush = 0) {
  const kit = env.kit;
  const slot = kit.getSlot(2);
  const g = slot.ctx;
  const e = w * w * (3 - 2 * w);
  const base = -320 + (SW + 640) * e;
  const front = (y) => base + 150 * (noise1(y * 0.0055 + seed, 7) - 0.5) * 2 + 34 * Math.sin(y * 0.021 + seed * 3) + (540 - y) * 0.3;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, SW, SH);
  g.fillStyle = '#000';
  for (const [off, a] of [[0, 0.35], [-26, 0.55], [-60, 1]]) {
    g.globalAlpha = a;
    g.beginPath();
    g.moveTo(-10, -10);
    for (let y = -10; y <= SH + 10; y += 30) g.lineTo(front(y) + off, y);
    g.lineTo(-10, SH + 10);
    g.closePath();
    g.fill();
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-in';
  if (nextPush === null) g.drawImage(nextImg, 0, 0, SW, SH);
  else drawPushed(g, nextImg, nextPush);
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(slot.canvas, 0, 0);
  // the wet edge: a sheen of water running ahead, pigment pooled on the front, small blooms
  const rgb = hexToRgb(color);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const path = () => {
    ctx.beginPath();
    for (let y = -10; y <= SH + 10; y += 24) {
      const x = front(y) - 20;
      if (y === -10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };
  const fade = Math.sin(Math.PI * w);
  // water running ahead of the pigment: a few soft, widening paper-tinted bands
  ctx.strokeStyle = PAPER;
  for (const [dx, lw, a] of [[70, 90, 0.10], [48, 54, 0.14], [30, 26, 0.18]]) {
    ctx.globalAlpha = a * fade;
    ctx.lineWidth = lw;
    ctx.translate(dx, 0);
    path();
    ctx.stroke();
    ctx.translate(-dx, 0);
  }
  // pigment pooled along the drying edge (dark, thin) with a soft halo behind it
  ctx.strokeStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  for (const [dx, lw, a] of [[-18, 30, 0.08], [-6, 12, 0.14], [0, 3.5, 0.38]]) {
    ctx.globalAlpha = a * fade;
    ctx.lineWidth = lw;
    ctx.translate(dx, 0);
    path();
    ctx.stroke();
    ctx.translate(-dx, 0);
  }
  ctx.restore();
  ctx.save();
  for (let k = 0; k < 7; k++) {
    const y = 80 + hash11(seed * 13 + k) * (SH - 160);
    const x = front(y) - 30 - hash11(seed * 7 + k) * 60;
    blot(ctx, x, y, 22 + 30 * hash11(seed + k * 3.1), `${rgb.r}, ${rgb.g}, ${rgb.b}`, 0.18 * fade);
  }
  ctx.restore();
}

/** The chapter accent used for the wash rim / ruler. */
function accentOf(ch) {
  return (ch && ((ch.frame && ch.frame.accent) || (ch.palette && ch.palette[1]))) || (FILM.palette && FILM.palette.accent) || '#3d6b8c';
}

// =============================================================================
// foreground: hill, easel, board, painter, grass
// =============================================================================
function painterCharacter() {
  return env.painter;
}

function drawForeground(ctx, t, cam, board, brush, extra = {}) {
  const kit = env.kit;
  const hiRes = cam.z > 1.05 ? 2 : 1;
  const HB = HILL_BOX;
  ctx.drawImage(hillArt(kit, hiRes), HB.x, HB.y, HB.w, HB.h);
  const EB = EASEL_BOX;
  ctx.drawImage(easelBack(kit, hiRes), EB.x, EB.y, EB.w, EB.h);
  board(ctx);
  ctx.drawImage(easelFront(kit, hiRes), EB.x, EB.y, EB.w, EB.h);
  drawJar(ctx, extra.jarRgb || '120, 150, 170', extra.jarA || 0, t);
  drawGrass(ctx, t, extra.wind ?? 1);
  if (brush && brush.contact > 0.05) drawWetTip(ctx, brush.pos, brush.contact, brush.color || '#3d6b8c', t);
  // painter
  const ch = painterCharacter();
  const beat = t / BEAT_SEC;
  const pulse = Math.max(0, 1 - (beat - Math.floor(beat)) / 0.35);
  const rig = ch.computeRig({
    action: 'paint',
    x: extra.px ?? env.px,
    y: hillY(extra.px ?? env.px),
    scale: env.pscale,
    time: t,
    brush: brush ? brush.pos : null,
    lift: brush ? 1 - brush.contact : 1,
    look: brush ? brush.look : 0,
    nod: (extra.nod ?? 0.6) * pulse,
    walk: extra.walk,
    wind: extra.wind ?? 1,
    brushLen: 56,
    brushPref: brush && brush.event && brush.event.kind === 'dip' ? 1.25 : undefined,
  });
  const style = { brushPaint: brush ? brush.color : '#3d6b8c', paints: extra.paints };
  if (ch === env.character) kit.drawRider(ctx, rig, style);
  else ch.draw(ctx, rig, { ...((FILM.character && FILM.character.colors) || {}), hat: FILM.character && FILM.character.hat, ...style });
}

// =============================================================================
// time ruler (top)
// =============================================================================
function drawRuler(ctx, t, alpha) {
  if (alpha <= 0.01) return;
  const { y, x0, x1 } = RULER;
  const step = (x1 - x0) / NUM_CHAPTERS;
  const pos = clamp((t - INTRO_SEC) / CHAPTER_SEC, 0, NUM_CHAPTERS);
  const cur = clamp(Math.floor(pos), 0, NUM_CHAPTERS - 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  // pencil line
  ctx.strokeStyle = 'rgba(60, 54, 46, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  // painted progress
  const px = x0 + pos * step;
  if (px > x0 + 1) {
    const col = hexToRgb(accentOf(CHAPTERS[cur]));
    ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.55)`;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    for (let x = x0; x <= px; x += 12) ctx.lineTo(x, y + 1.2 * Math.sin(x * 0.07));
    ctx.lineTo(px, y);
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const small = step < 90;
  for (let i = 0; i < NUM_CHAPTERS; i++) {
    const x = x0 + (i + 0.5) * step;
    const active = i === cur && t >= INTRO_SEC - 0.5 * BEAT_SEC && t < OUTRO_START;
    const done = i < pos;
    const acc = accentOf(CHAPTERS[i]);
    ctx.fillStyle = active ? acc : done ? 'rgba(60, 54, 46, 0.75)' : 'rgba(60, 54, 46, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, active ? 6.5 : 3.6, 0, TAU);
    ctx.fill();
    ctx.font = active ? `700 ${small ? 15 : 18}px ${FONT.kai}` : `500 ${small ? 13 : 15}px ${FONT.kai}`;
    let label = CHAPTERS[i].ruler || String(i + 1);
    while (label.length > 1 && ctx.measureText(label).width > step - 6) label = label.slice(0, -1);
    ctx.fillStyle = active ? INK : done ? 'rgba(44, 39, 33, 0.8)' : 'rgba(44, 39, 33, 0.5)';
    ctx.fillText(label, x, y + 26);
  }
  if (env.character.drawMarker) env.character.drawMarker(ctx, px, y - 1, (FILM.character && FILM.character.colors) || {});
  ctx.restore();
}

// =============================================================================
// frame
// =============================================================================
function renderFrame(ctx, tIn) {
  const t = clamp(tIn, 0, TOTAL_DURATION);
  const kit = env.kit;
  const beatState = getBeatState(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const cam = cameraAt(t);
  const ph = phaseAt(t);

  // ---------------------------------------------------------------- valley
  if (cam.z < 1 || t >= OUTRO_START + 0.5 * BEAT_SEC) {
    // outro: the panorama stays put on screen while the hill shrinks away
    ctx.drawImage(outroPanorama(kit), 0, 0);
    ctx.drawImage(hazeOverlay(kit), 0, 0);
  } else {
    if (cam.z > 1) ctx.drawImage(paperTexture(kit), 0, 0);
    applyCamera(ctx, cam);
    // the base layer is the chapter being washed away (a wipe ends half a beat after its bar line)
    const tw = t - 0.5 * BEAT_SEC;
    if (tw < INTRO_SEC) {
      ctx.drawImage(sketchValley(kit), 0, 0);
    } else if (tw < OUTRO_START) {
      const ch = CHAPTERS[clamp(Math.floor((tw - INTRO_SEC) / CHAPTER_SEC), 0, NUM_CHAPTERS - 1)];
      drawPushed(ctx, renderValley(ch, t, 0), (t - ch.t0) / CHAPTER_SEC);
    } else {
      ctx.drawImage(outroPanorama(kit), 0, 0);
    }
    // wash wipe toward the next chapter (or the outro panorama)
    for (let i = 0; i <= NUM_CHAPTERS; i++) {
      const tb = i < NUM_CHAPTERS ? CHAPTERS[i].t0 : OUTRO_START;
      const w = washAt(t, tb);
      if (w < 0) continue;
      if (i < NUM_CHAPTERS) {
        const ch = CHAPTERS[i];
        drawValleyWipe(ctx, renderValley(ch, t, 1), w, accentOf(ch), i + 1.7, 0);
      } else drawValleyWipe(ctx, outroPanorama(kit), w, '#8aa0b4', 0.37, null);
    }
    ctx.drawImage(hazeOverlay(kit), 0, 0);
  }

  // ---------------------------------------------------------------- foreground
  applyCamera(ctx, cam);
  let brush = null;
  let board;
  let paints = null;
  let jarA = 0;
  let jarRgb = '120, 150, 170';
  let walk = null;
  let px = PAINTER.x;
  if (ph.kind === 'intro') {
    const I = introCard();
    brush = brushAt(I.sched, ph.b);
    const img = renderCard(I.card, I.sched, ph.b);
    board = (g) => drawBoard(g, img);
    paints = ['#3d6b8c', '#c8553d', '#e9c46a', '#5b8c5a', '#8a5a3b'];
  } else if (ph.kind === 'chapter') {
    const ch = CHAPTERS[ph.i];
    const E = chapterCard(ch);
    const prevImg = ph.i === 0 ? introCard().full : finalCard(CHAPTERS[ph.i - 1]);
    brush = brushAt(E.sched, ph.b, sweepEvent(-0.5, 0.5, accentOf(ch)));
    const live = renderCard(E.card, E.sched, ph.b);
    const w = ph.b < 0.5 ? (ph.b + 0.5) : 1;
    board = w < 1 ? (g) => {
      const tmp = createCanvasOnce();
      tmp.getContext('2d').drawImage(live, 0, 0);
      drawBoardWipe(g, prevImg, tmp, w, accentOf(ch));
    } : (g) => drawBoard(g, live);
    paints = (ch.palette || []).slice(0, 5);
    // the rinse water picks up the chapter's colours
    const jc = hexToRgb((ch.palette && ch.palette[2]) || '#7896aa');
    jarRgb = `${jc.r}, ${jc.g}, ${jc.b}`;
    jarA = 0.1 + 0.25 * clamp(ph.b / B_CH, 0, 1);
  } else {
    // outro: the last painting stays on the easel; the painter lowers the brush and steps back
    const last = CHAPTERS[NUM_CHAPTERS - 1];
    const img = finalCard(last);
    board = (g) => drawBoard(g, img);
    const K = OUTRO_SEC / 12;
    const T = (t - OUTRO_START) / K;
    const lower = smoothstep(0, 1.2, T);
    const rest = { x: BOARD.x + 40, y: BOARD.y + 170 };
    const low = { x: env.px + 26, y: hillY(env.px) - 120 };
    brush = { pos: { x: lerp(rest.x, low.x, lower), y: lerp(rest.y, low.y, lower) }, contact: 0, color: accentOf(last), look: 0.55 * smoothstep(2.6, 3.4, T) };
    const stepK = smootherstep(0.7, 2.6, T);
    px = env.px - 96 * stepK;
    walk = { phase: stepK * TAU * 1.5, amount: Math.sin(Math.PI * stepK) };
    brush.pos.x -= 96 * stepK;
    paints = (last.palette || []).slice(0, 5);
    const jc = hexToRgb((last.palette && last.palette[2]) || '#7896aa');
    jarRgb = `${jc.r}, ${jc.g}, ${jc.b}`;
    jarA = 0.35;
  }
  drawForeground(ctx, t, cam, board, brush, { paints, jarA, jarRgb, walk, px, nod: ph.kind === 'outro' ? 0.3 : 0.6, wind: 1 + 0.25 * Math.sin(t * 0.7) });

  // ---------------------------------------------------------------- overlays (screen space)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (t < INTRO_SEC) drawIntroOverlay(ctx, t);
  const rulerA = smoothstep(INTRO_SEC - BEAT_SEC, INTRO_SEC + BEAT_SEC, t) * (1 - smoothstep(OUTRO_START - BEAT_SEC, OUTRO_START + 0.2, t));
  drawRuler(ctx, t, rulerA);
  if (t >= OUTRO_START) drawOutroOverlay(ctx, t - OUTRO_START, cam);
  return beatState;
}

let wipeTmp = null;
function createCanvasOnce() {
  if (!wipeTmp) wipeTmp = createCanvas(CARD.w * CARD_RES, CARD.h * CARD_RES);
  return wipeTmp;
}

function drawBoardWipe(ctx, oldImg, newImg, w, color) {
  drawBoard(ctx, oldImg, {
    overlay: (g) => drawCardWipe(g, oldImg, newImg, w, color),
  });
}

// =============================================================================
// intro + outro overlays
// =============================================================================
function drawIntroOverlay(ctx, t) {
  // the quote, hand-lettered across the sky while the camera settles on the painter
  if (!FILM.quote) return;
  const a = envelope(t, INTRO_SEC * 0.45, INTRO_SEC * 0.62, INTRO_SEC - 1.1 * BEAT_SEC, INTRO_SEC - 0.2 * BEAT_SEC);
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.font = `500 36px ${FONT.kai}`;
  ctx.fillStyle = 'rgba(44, 39, 33, 0.85)';
  const x = 1220;
  const y = 170;
  // reveal left -> right like a brush line
  const w = ctx.measureText(FILM.quote).width;
  const k = smoothstep(INTRO_SEC * 0.45, INTRO_SEC * 0.75, t);
  ctx.beginPath();
  ctx.rect(x - w / 2 - 10, y - 50, (w + 20) * k, 80);
  ctx.clip();
  ctx.fillText(FILM.quote, x, y);
  ctx.restore();
}

/** Outro layout: strings fanning out of the easel's mast with every chapter's painting pinned on. */
function outroLayout() {
  const N = NUM_CHAPTERS;
  const rows = N <= 7 ? 1 : N <= 16 ? 2 : 3;
  const per = Math.ceil(N / rows);
  const xA = 560;
  const xB = 1840;
  const cardW = Math.round(clamp((xB - xA) / per - 30, 64, N <= 4 ? 330 : 240));
  const cardH = Math.round(cardW * 0.75);
  const ends = rows === 1 ? [300] : rows === 2 ? [250, 560] : [230, 450, 670];
  const out = [];
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / per);
    const k = i - r * per;
    const nRow = Math.min(per, N - r * per);
    const span = Math.min(xB - xA, nRow * (cardW + 70));
    const x = xB - span + ((k + 0.5) / nRow) * span;
    out.push({ i, r, x, endY: ends[r] });
  }
  return { rows, per, cardW, cardH, ends, cards: out };
}
let OUTRO_L = null;

function stringY(anchor, endY, x) {
  const u = clamp((x - anchor.x) / (1900 - anchor.x), 0, 1);
  return lerp(anchor.y, endY, u) + 46 * Math.sin(Math.PI * u);
}

function drawOutroOverlay(ctx, localT, cam) {
  const K = OUTRO_SEC / 12;
  const T = localT / K;
  const L = OUTRO_L || (OUTRO_L = outroLayout());
  const O = FILM.outro || {};
  const anchor = { x: (EASEL.mastTop.x - cam.ax) * cam.z + VIEW_W / 2, y: (EASEL.mastTop.y - cam.ay) * cam.z + VIEW_H / 2 };
  ctx.save();
  // headline + summary, brush-revealed
  const hk = smoothstep(0.3, 1.6, T);
  if (hk > 0) {
    ctx.textAlign = 'center';
    ctx.font = `700 66px ${FONT.kai}`;
    const text = O.headline || FILM.title;
    const w = ctx.measureText(text).width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(VIEW_W / 2 - w / 2 - 20, 40, (w + 40) * hk, 110);
    ctx.clip();
    ctx.fillStyle = 'rgba(44, 39, 33, 0.92)';
    ctx.fillText(text, VIEW_W / 2, 124);
    ctx.restore();
    const sa = smoothstep(1.0, 2.0, T);
    if (O.summary && sa > 0) {
      ctx.globalAlpha = sa;
      ctx.font = `500 27px ${FONT.kai}`;
      ctx.fillStyle = 'rgba(74, 70, 64, 0.9)';
      ctx.fillText(O.summary, VIEW_W / 2, 176);
      ctx.globalAlpha = 1;
    }
  }
  // strings
  const sk = smoothstep(1.0, 1.8, T);
  if (sk > 0) {
    ctx.strokeStyle = 'rgba(92, 72, 52, 0.85)';
    ctx.lineWidth = 1.6;
    for (const endY of L.ends) {
      ctx.beginPath();
      const xEnd = lerp(anchor.x, 1910, sk);
      for (let x = anchor.x; x <= xEnd; x += 16) {
        const y = stringY(anchor, endY, x);
        if (x === anchor.x) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  // cards
  const N = NUM_CHAPTERS;
  const stagger = Math.min(0.45, 5.0 / Math.max(1, N));
  for (const c of L.cards) {
    const tPin = 1.5 + c.i * stagger;
    const d = T - tPin;
    if (d < 0) continue;
    const ch = CHAPTERS[c.i];
    const img = finalCard(ch);
    const drop = 1 - smoothstep(0, 0.35, d);
    const top = stringY(anchor, c.endY, c.x);
    const swing = 0.22 * Math.exp(-d * 2.2) * Math.sin(d * 9) + 0.012 * Math.sin(T * 1.7 + c.i);
    ctx.save();
    ctx.globalAlpha = smoothstep(0, 0.15, d);
    ctx.translate(c.x, top - 70 * drop);
    ctx.rotate(swing);
    ctx.fillStyle = 'rgba(40, 30, 20, 0.18)';
    ctx.fillRect(-L.cardW / 2 + 5, 9, L.cardW, L.cardH);
    ctx.drawImage(img, -L.cardW / 2, 4, L.cardW, L.cardH);
    ctx.strokeStyle = 'rgba(90, 80, 66, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-L.cardW / 2, 4, L.cardW, L.cardH);
    // clothes peg
    ctx.fillStyle = '#c99c62';
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(-5, -10, 10, 26);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // closing line + credits
  const credA = smoothstep(8.4, 9.4, T);
  if (credA > 0) {
    ctx.globalAlpha = credA;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(44, 39, 33, 0.92)';
    ctx.font = `500 34px ${FONT.kai}`;
    if (O.closing) ctx.fillText(O.closing, 1260, 984);
    ctx.font = `500 18px ${FONT.sans}`;
    ctx.fillStyle = 'rgba(74, 70, 64, 0.85)';
    ctx.fillText(`《${FILM.title}》${O.credits ? ' · ' + O.credits : ''}`, 1260, 1030);
  }
  ctx.restore();
}

// =============================================================================
export default {
  id: 'easel',
  label: '山頂寫生',
  labelAlt: 'Hilltop easel',
  action: 'paint',
  scene: { W: SW, H: SH, groundY: SCENE.groundY, edge: 0 },
  view: { W: VIEW_W, H: VIEW_H },
  init(e) {
    env = { ...e };
    // a character without a 'paint' action falls back to the person painter
    env.painter = e.character.actions.includes('paint') ? e.character : getCharacter('person');
    if (env.painter !== e.character) console.warn(`[easel] character "${e.character.id}" cannot paint; the person paints instead`);
    // a character may stand elsewhere (descriptor.easel = { x, scale }) or have no palette hand
    env.px = (env.painter.easel && env.painter.easel.x) || PAINTER.x;
    env.pscale = (env.painter.easel && env.painter.easel.scale) || PAINTER.scale;
    if (env.painter.holdsPalette === false) setPaletteAt({ x: EASEL.jar.x + 2, y: EASEL.jar.y - 12 });
  },
  renderFrame,
  chapterParams,
  renderStill,
  thumbnail: (ch) => makeThumb(ch),
  /** Easel extras for tools: the finished card of a chapter (canvas, 600x450). */
  card: (ch) => finalCard(ch),
};
