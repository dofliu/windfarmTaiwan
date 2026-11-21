// src/stages/common.js — pieces every stage shares: scene params, time ruler, thumbnails.

import {
  CHAPTERS,
  NUM_CHAPTERS,
  CHAPTER_SEC,
  INTRO_SEC,
  OUTRO_START,
  clamp,
  chapterBeat,
} from '../beat/timeline.js';
import { VIEW_W } from '../beat/camera.js';
import { FONT } from '../kit/fonts.js';
import { FILM } from '../data/film.config.js';

/**
 * Fields every stage puts into a scene's `p` (stage-specific fields are added on top).
 *   chapter        the chapter record (chapters.js + index, num, t0, t1, scene)
 *   scene          alias of chapter (reference scenes call it `scene`)
 *   index, num     0-based index / 1-based number
 *   t              global film time (s)
 *   localT         time inside the chapter, clamped to [0, chapterSec]
 *   rawLocalT      unclamped (negative before the chapter starts, > chapterSec after)
 *   chapterSec     chapter length (s)            u   localT / chapterSec (0..1)
 *   beat           chapterBeat(rawLocalT): { bpm, beatSec, barSec, beat, bar, beatInBar, beatFrac, pulse(len) }
 *   W, H           scene canvas size             stage  stage id
 *   isThumbnail    true when rendering the calm representative still (outro / gallery)
 *   prop           the chapter's prop ({ type, colors }) or FILM.defaultProp
 *   palette        chapter.palette
 */
export function baseParams(stageId, chapter, t, W, H, isThumbnail = false) {
  const rawLocalT = t - chapter.t0;
  const localT = clamp(rawLocalT, 0, CHAPTER_SEC);
  return {
    chapter,
    scene: chapter,
    index: chapter.index,
    num: chapter.num,
    t,
    localT,
    rawLocalT,
    chapterSec: CHAPTER_SEC,
    u: localT / CHAPTER_SEC,
    beat: chapterBeat(rawLocalT),
    W,
    H,
    stage: stageId,
    isThumbnail,
    prop: chapter.prop || FILM.defaultProp || { type: 'none' },
    palette: chapter.palette || [],
  };
}

/** Film-level progress ruler along the bottom of the 1920x1080 view (y ≈ 1026–1080). */
export function drawTimeRuler(ctx, t, alpha, kit, opts = {}) {
  if (alpha <= 0.01) return;
  const y = opts.y ?? 1052;
  const x0 = 70;
  const x1 = VIEW_W - 70;
  const step = (x1 - x0) / NUM_CHAPTERS;
  const pos = clamp((t - INTRO_SEC) / CHAPTER_SEC, 0, NUM_CHAPTERS);
  const cur = clamp(Math.floor(pos), 0, NUM_CHAPTERS - 1);
  const pal = FILM.palette || {};
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(10, 9, 8, 0.55)';
  ctx.fillRect(0, y - 26, VIEW_W, 54);
  ctx.strokeStyle = 'rgba(233, 226, 207, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y - 8);
  ctx.lineTo(x1, y - 8);
  ctx.stroke();
  ctx.strokeStyle = pal.accent || 'rgba(233, 196, 106, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y - 8);
  ctx.lineTo(x0 + pos * step, y - 8);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const small = step < 90;
  for (let i = 0; i < NUM_CHAPTERS; i++) {
    const x = x0 + (i + 0.5) * step;
    const active = i === cur && t >= INTRO_SEC && t < OUTRO_START;
    ctx.fillStyle = active ? pal.accent || '#e9c46a' : i < pos ? 'rgba(233, 226, 207, 0.8)' : 'rgba(233, 226, 207, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y - 8, active ? 6 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = active ? `700 ${small ? 15 : 17}px ${FONT.sans}` : `500 ${small ? 13 : 15}px ${FONT.sans}`;
    let label = CHAPTERS[i].ruler || String(i + 1);
    while (label.length > 1 && ctx.measureText(label).width > step - 6) label = label.slice(0, -1);
    ctx.fillText(label, x, y + 16);
  }
  // character marker at the current position
  const mx = x0 + pos * step;
  if (kit && kit.character && kit.character.drawMarker) kit.character.drawMarker(ctx, mx, y - 8, FILM.character && FILM.character.colors);
  else {
    ctx.fillStyle = '#f7f4ec';
    ctx.beginPath();
    ctx.arc(mx, y - 8, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Cached 300x300 thumbnail of a chapter, made from a stage's still renderer. */
export function makeThumbnailCache(kit, renderStill, size = 300) {
  return (chapter) => {
    const key = `${chapter.id}@${size}`;
    if (kit.thumbCache.has(key)) return kit.thumbCache.get(key);
    const slot = kit.getSlot(3);
    slot.ctx.setTransform(1, 0, 0, 1, 0, 0);
    slot.ctx.clearRect(0, 0, slot.canvas.width, slot.canvas.height);
    renderStill(slot.ctx, chapter, CHAPTER_SEC / 2, { isThumbnail: true });
    const c = kit.createCanvas(size, size);
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    // centre-crop to a square
    const w = slot.canvas.width;
    const h = slot.canvas.height;
    const s = Math.min(w, h);
    g.drawImage(slot.canvas, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
    kit.thumbCache.set(key, c);
    return c;
  };
}

export { CHAPTERS };
