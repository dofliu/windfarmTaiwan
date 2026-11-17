// src/stages/gallery-ride.js
// STAGE "gallery-ride": the character rides a bicycle left -> right along ONE continuous
// road through a row of framed 1000x1000 chapter panels hanging on a museum wall; a
// museum placard under each frame, a time ruler along the bottom, a calm dolly camera.
//
// Scene canvas (what each chapter's render(kit, ctx, p) draws into)
//   1000 x 1000 px, cleared. Road at y = 700 with ZERO slope at x = 0 and x = 1000
//   (kit.sampleRoad(x, arch) gives a valid arched road). The outer 26 px are covered
//   by the frame. The panel is on screen from rawLocalT ≈ −chapterSec to ≈ +2·chapterSec.
//   The scene draws the rider itself (so it can restyle it into the panel's medium):
//     if (p.actor.visible) p.actor.draw(ctx, p.actor.rig({ arch }), style)
//
// Extra fields in p (on top of stages/common.js baseParams):
//   groundY = 700, action = 'cycle',
//   riderLocalX  bicycle centre x in panel px (0 -> 1000 during the chapter)
//   riderWorldX, pedalAngle (= phase), speedScale, pinwheelAngle (= propAngle)
//   actor = { visible, x, rig(opts), draw(ctx, rig, style), drawDefault(ctx, opts) }
//     rig(opts): opts.arch (road arch, px), opts.roadFn(x) -> {y, slope}, opts.scale
//     draw(ctx, rig, style): style = character style overrides + { prop, silhouette, wire ... }
//       (the chapter prop is applied automatically unless style.prop is given)

import {
  CHAPTERS,
  NUM_CHAPTERS,
  CHAPTER_SEC,
  OUTRO_START,
  TOTAL_DURATION,
  clamp,
  smoothstep,
  getBeatState,
  propAngleAt,
  actionPhaseAt,
} from '../beat/timeline.js';
import {
  VIEW_W,
  VIEW_H,
  PANEL_SIZE,
  ROAD_Y,
  getCameraState,
  getVisiblePanelIndices,
  getRiderWorldState,
} from '../beat/camera.js';
import { drawPanelFrame, drawPlacard } from '../kit/frame.js';
import { renderIntroOverlay, INTRO_FADE_END } from '../scenes/intro.js';
import { renderOutro } from '../scenes/outro.js';
import { baseParams, drawTimeRuler, makeThumbnailCache } from './common.js';
import { FILM } from '../data/film.config.js';

const OUTRO_XFADE = 0.6;
const P = PANEL_SIZE;

/** Neutral "pencil sketch" rider used on the bare wall before the first / after the last panel. */
const WALL_RIDER_STYLE = {
  plumage: '#efe9dc',
  plumageShade: '#cfc6b3',
  frame: '#8a7a62',
  frameShade: '#7a6b55',
  outline: '#2a251f',
  prop: { type: 'paper', colors: ['#d9cdb2', '#b8a88a', '#d9cdb2', '#b8a88a'] },
};

let env = null; // { kit, renderChapter, thumbnail }

function makeActor(p) {
  const kit = env.kit;
  const actor = {
    visible: kit.riderVisible(p),
    x: p.riderLocalX,
    rig: (opts = {}) => kit.riderRig(p, opts),
    draw: (ctx, rig, style = {}) => kit.drawRider(ctx, rig, style.prop || style.pinwheel ? style : { ...style, prop: p.prop }),
    drawDefault: (ctx, opts = {}) => actor.draw(ctx, actor.rig(opts), opts.style || {}),
  };
  return actor;
}

/** Scene params for `chapter` at film time t (rider position from the film's motion). */
function chapterParams(chapter, t, opts = {}) {
  const p = baseParams('gallery-ride', chapter, t, P, P, Boolean(opts.isThumbnail));
  const rider = getRiderWorldState(t);
  const worldX0 = chapter.index * P;
  const forcedX = opts.riderLocalX !== null && opts.riderLocalX !== undefined;
  p.groundY = ROAD_Y;
  p.layout = { x: 0, y: 0, s: 1, x0: 0, x1: P, y0: 0, y1: P };
  p.action = 'cycle';
  p.riderLocalX = forcedX ? opts.riderLocalX : rider.worldX - worldX0;
  p.riderWorldX = forcedX ? worldX0 + opts.riderLocalX : rider.worldX;
  p.pedalAngle = forcedX ? actionPhaseAt(t) : rider.pedalAngle;
  p.phase = p.pedalAngle;
  p.speedScale = forcedX ? 1 : rider.speedScale;
  p.pinwheelAngle = propAngleAt(t);
  p.propAngle = p.pinwheelAngle;
  p.actor = makeActor(p);
  return p;
}

function drawWallRoad(ctx, x0, x1) {
  ctx.strokeStyle = 'rgba(190, 170, 140, 0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.moveTo(x0, ROAD_Y);
  ctx.lineTo(x1, ROAD_Y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawWall(ctx, cam) {
  const pal = FILM.palette || {};
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, pal.wall || '#24211d');
  g.addColorStop(0.75, pal.wall || '#1c1a17');
  g.addColorStop(1, pal.wallDeep || '#141210');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(255, 240, 210, 0.018)';
  const off = (-cam.camX * cam.scale) % 240;
  for (let x = off - 240; x < VIEW_W + 240; x += 240) ctx.fillRect(x, 0, 120, VIEW_H);
}

function renderStill(ctx, chapter, localT = CHAPTER_SEC / 2, opts = {}) {
  const t = chapter.t0 + localT;
  const p = chapterParams(chapter, t, { riderLocalX: opts.riderLocalX ?? (opts.isThumbnail ? P / 2 : null), isThumbnail: opts.isThumbnail });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, P, P);
  env.renderChapter(env.kit, ctx, chapter, p);
  if (opts.withFrame) drawPanelFrame(ctx, chapter, 0, false);
  return p;
}

function renderFrame(ctx, tIn) {
  const t = clamp(tIn, 0, TOTAL_DURATION);
  const kit = env.kit;
  const beat = getBeatState(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const outroEnv = { kit, thumbnail: env.thumbnail, action: 'cycle' };

  if (t >= OUTRO_START + OUTRO_XFADE) {
    renderOutro(ctx, outroEnv, t - OUTRO_START);
    return beat;
  }

  const cam = getCameraState(t);
  const rider = cam.rider;
  const visible = getVisiblePanelIndices(cam);

  const rendered = visible.map((idx, slotIdx) => {
    const chapter = CHAPTERS[idx];
    const slot = kit.getSlot(slotIdx);
    slot.ctx.setTransform(1, 0, 0, 1, 0, 0);
    slot.ctx.globalAlpha = 1;
    slot.ctx.globalCompositeOperation = 'source-over';
    slot.ctx.clearRect(0, 0, P, P);
    env.renderChapter(kit, slot.ctx, chapter, chapterParams(chapter, t));
    return { chapter, slot, x0: idx * P };
  });

  drawWall(ctx, cam);
  ctx.save();
  ctx.setTransform(cam.scale, 0, 0, cam.scale, VIEW_W / 2 - cam.camX * cam.scale, VIEW_H / 2 - cam.camY * cam.scale);

  const lastX = NUM_CHAPTERS * P;
  if (cam.camX < 1300) drawWallRoad(ctx, -1500, 0);
  if (cam.camX > lastX - 1300) drawWallRoad(ctx, lastX, lastX + 1500);

  for (const { slot, x0 } of rendered) ctx.drawImage(slot.canvas, x0, 0, P, P);
  for (const { chapter, x0 } of rendered) {
    drawPanelFrame(ctx, chapter, x0, beat.chapterIndex === chapter.index);
    drawPlacard(ctx, chapter, x0, 1);
  }

  // rider on the bare wall (clipped outside the panels)
  if (rider.visible && (rider.worldX < 270 || rider.worldX > lastX - 270)) {
    ctx.save();
    ctx.beginPath();
    if (rider.worldX < 270) ctx.rect(-2000, -500, 2000, 2000);
    else ctx.rect(lastX, -500, 2000, 2000);
    ctx.clip();
    const rig = kit.computeRiderRig({
      action: 'cycle',
      x: rider.worldX,
      y: ROAD_Y,
      phase: rider.pedalAngle,
      speedScale: rider.speedScale,
      time: t,
      worldX: rider.worldX,
      propAngle: propAngleAt(t),
    });
    kit.drawRider(ctx, rig, WALL_RIDER_STYLE);
    ctx.restore();
  }
  ctx.restore();

  const rulerA = smoothstep(INTRO_FADE_END - 0.6, INTRO_FADE_END + 0.6, t) * (1 - smoothstep(OUTRO_START - 0.4, OUTRO_START + 0.2, t));
  drawTimeRuler(ctx, t, rulerA, kit);

  if (t < INTRO_FADE_END) renderIntroOverlay(ctx, t);

  if (t >= OUTRO_START - 0.01) {
    const a = smoothstep(OUTRO_START, OUTRO_START + OUTRO_XFADE, t);
    if (a > 0.001) {
      ctx.save();
      ctx.globalAlpha = a;
      renderOutro(ctx, outroEnv, t - OUTRO_START);
      ctx.restore();
    }
  }
  return beat;
}

export default {
  id: 'gallery-ride',
  label: '畫廊騎行',
  labelAlt: 'Gallery ride',
  /** Character action this stage needs. */
  action: 'cycle',
  /** The canvas each chapter scene draws into. */
  scene: { W: P, H: P, groundY: ROAD_Y, edge: 26 },
  view: { W: VIEW_W, H: VIEW_H },
  init(e) {
    env = { ...e };
    env.thumbnail = makeThumbnailCache(e.kit, renderStill);
  },
  renderFrame,
  chapterParams,
  renderStill,
  thumbnail: (ch) => env.thumbnail(ch),
};
