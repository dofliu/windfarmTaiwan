// src/scenes/outro.js
// Film-level outro (shared by every stage): every chapter gathers on one horizontal time
// axis (thumbnails alternating above / below, sized for N), the character travels the
// axis once more while its prop changes into each chapter's prop, then the closing line.
//
// renderOutro(ctx, env, localT)
//   env.kit          the kit (character drawing)
//   env.thumbnail(ch) -> canvas   representative still of a chapter (the stage provides it)
//   env.action       character action used on the axis ('cycle' rides; other actions glide)

import { VIEW_W, VIEW_H } from '../beat/camera.js';
import { CHAPTERS, NUM_CHAPTERS, OUTRO_START, OUTRO_SEC, clamp, smoothstep, envelope, lerp, actionPhaseAt, propAngleAt } from '../beat/timeline.js';
import { FONT } from '../kit/fonts.js';
import { FILM } from '../data/film.config.js';

const AXIS_Y = 600;
const AXIS_X0 = 110;
const AXIS_X1 = VIEW_W - 110;
const STEP = (AXIS_X1 - AXIS_X0) / Math.max(1, NUM_CHAPTERS);
/** Thumbnails alternate above / below, so same-side neighbours are 2 steps apart. */
export const THUMB = Math.round(clamp(2 * STEP - 26, 64, NUM_CHAPTERS <= 4 ? 230 : 170));
const PAL = FILM.palette || {};
// outro beats scale with the outro length (written for 12 s)
const K = OUTRO_SEC / 12;

export function tickX(i) {
  return AXIS_X0 + ((i + 0.5) / NUM_CHAPTERS) * (AXIS_X1 - AXIS_X0);
}

function shorten(ctx, text, maxW) {
  let s = String(text || '');
  if (ctx.measureText(s).width <= maxW) return s;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

export function renderOutro(ctx, env, localT) {
  const { kit } = env;
  const T = localT / K; // normalised to the 12 s choreography
  ctx.save();
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  const ob = PAL.outroBg || ['#0d141b', '#16110d'];
  bg.addColorStop(0, ob[0]);
  bg.addColorStop(1, ob[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // headline
  const O = FILM.outro || {};
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = envelope(T, 0.3, 1.2, 99, 100);
  ctx.fillStyle = PAL.ink || '#f3efe4';
  ctx.font = `900 64px ${FONT.serif}`;
  ctx.fillText(O.headline || FILM.title, VIEW_W / 2, 118);
  ctx.globalAlpha = envelope(T, 0.8, 1.8, 99, 100);
  ctx.font = `500 28px ${FONT.sans}`;
  ctx.fillStyle = PAL.inkSoft || '#b9d7e2';
  if (O.summary) ctx.fillText(O.summary, VIEW_W / 2, 170);
  ctx.globalAlpha = 1;

  // axis (draws itself left -> right)
  const axisP = smoothstep(0.4, 3.2, T);
  const ax1 = lerp(AXIS_X0, AXIS_X1, axisP);
  ctx.strokeStyle = 'rgba(233, 226, 207, 0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(AXIS_X0, AXIS_Y);
  ctx.lineTo(ax1, AXIS_Y);
  ctx.stroke();
  if (axisP > 0.98) {
    ctx.fillStyle = 'rgba(233, 226, 207, 0.7)';
    ctx.beginPath();
    ctx.moveTo(AXIS_X1 + 18, AXIS_Y);
    ctx.lineTo(AXIS_X1, AXIS_Y - 9);
    ctx.lineTo(AXIS_X1, AXIS_Y + 9);
    ctx.closePath();
    ctx.fill();
  }

  // thumbnails
  const stagger = Math.min(0.13, 2.6 / Math.max(1, NUM_CHAPTERS));
  for (let i = 0; i < NUM_CHAPTERS; i++) {
    const s = CHAPTERS[i];
    const appear = smoothstep(0.5 + i * stagger, 1.1 + i * stagger, T);
    if (appear <= 0.001) continue;
    const x = tickX(i);
    const up = i % 2 === 0;
    const ty = up ? AXIS_Y - 70 - THUMB : AXIS_Y + 70;
    const pop = lerp(12, 0, appear);
    ctx.globalAlpha = appear;
    ctx.strokeStyle = 'rgba(233, 226, 207, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, AXIS_Y);
    ctx.lineTo(x, up ? ty + THUMB : ty);
    ctx.stroke();
    ctx.fillStyle = (s.frame && s.frame.accent) || (s.palette && s.palette[1]) || '#c9a45c';
    ctx.beginPath();
    ctx.arc(x, AXIS_Y, 6, 0, Math.PI * 2);
    ctx.fill();
    const img = env.thumbnail(s);
    const ix = x - THUMB / 2;
    const iy = ty + (up ? -pop : pop);
    ctx.fillStyle = '#e9e2cf';
    ctx.fillRect(ix - 5, iy - 5, THUMB + 10, THUMB + 10);
    if (img) ctx.drawImage(img, ix, iy, THUMB, THUMB);
    // labels
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.ink || '#f3efe4';
    const big = THUMB >= 150;
    ctx.font = `700 ${big ? 21 : 18}px ${FONT.sans}`;
    const labelY = up ? iy - 14 : iy + THUMB + 30;
    ctx.fillText(shorten(ctx, s.ruler, THUMB + 40), x, labelY);
    ctx.font = `500 ${big ? 17 : 15}px ${FONT.sans}`;
    ctx.fillStyle = '#b8b0a0';
    ctx.fillText(shorten(ctx, s.title, Math.max(THUMB + 14, 90)), x, labelY + (up ? -24 : 24));
  }
  ctx.globalAlpha = 1;

  // the character travels the axis; its prop becomes the prop of the chapter it passes
  const rideP = smoothstep(1.0, 10.2, T);
  const rx = lerp(AXIS_X0 - 120, AXIS_X1 + 40, rideP);
  let idx = 0;
  for (let i = 0; i < NUM_CHAPTERS; i++) if (rx >= tickX(i) - 40) idx = i;
  const t = OUTRO_START + localT;
  const riderA = envelope(T, 0.9, 1.4, 10.4, 10.9);
  if (riderA > 0.01 && kit.character) {
    const rig = kit.computeRiderRig({
      action: env.action || 'cycle',
      x: rx,
      y: AXIS_Y - 2,
      phase: actionPhaseAt(t) * 1.4,
      scale: 0.62,
      time: t,
      worldX: rx * 1.6,
      propAngle: propAngleAt(t),
    });
    ctx.globalAlpha = riderA;
    kit.drawRider(ctx, rig, { prop: CHAPTERS[idx].prop || FILM.defaultProp });
    ctx.globalAlpha = 1;
  }

  // closing line + credits
  const credA = smoothstep(8.4, 9.4, T);
  if (credA > 0) {
    ctx.globalAlpha = credA;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e9e2cf';
    ctx.font = `400 30px ${FONT.kai}`;
    if (O.closing) ctx.fillText(O.closing, VIEW_W / 2, 985);
    ctx.font = `500 19px ${FONT.sans}`;
    ctx.fillStyle = PAL.inkMuted || '#8fa3ad';
    ctx.fillText(`《${FILM.title}》${O.credits ? ' · ' + O.credits : ''}`, VIEW_W / 2, 1030);
  }
  ctx.restore();
}
