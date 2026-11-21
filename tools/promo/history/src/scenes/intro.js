// src/scenes/intro.js
// Film-level intro card (shared by every stage): title / subtitle / quote from
// film.config.js over flowing streamlines; the overlay dissolves during the intro's last
// bar to reveal the stage as the character sets off into chapter 1.

import { VIEW_W, VIEW_H } from '../beat/camera.js';
import { INTRO_SEC, BAR_SEC, clamp, envelope, smoothstep, lerp } from '../beat/timeline.js';
import { hash11 } from '../kit/kit.js';
import { FONT } from '../kit/fonts.js';
import { FILM } from '../data/film.config.js';

export const INTRO_FADE_START = INTRO_SEC - Math.min(1.05 * BAR_SEC, INTRO_SEC * 0.4);
export const INTRO_FADE_END = INTRO_SEC - Math.min(0.45 * BAR_SEC, INTRO_SEC * 0.15);
const PAL = FILM.palette || {};

/** Streamline y for line k at screen x (deterministic flow field). */
function flowY(k, x, t) {
  const base = 120 + k * 34;
  return (
    base +
    18 * Math.sin(x * 0.0042 + k * 0.7 + t * 0.9) +
    9 * Math.sin(x * 0.011 - t * 1.7 + k * 1.3) +
    40 * Math.exp(-Math.pow((x - 960) / 520, 2)) * Math.sin(k * 0.45)
  );
}

export function renderIntroOverlay(ctx, t) {
  if (t >= INTRO_FADE_END) return;
  const alpha = 1 - smoothstep(INTRO_FADE_START, INTRO_FADE_END, t);
  ctx.save();
  ctx.globalAlpha = alpha;

  // deep night-blue backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  const ib = PAL.introBg || ['#0b1620', '#111c25'];
  bg.addColorStop(0, ib[0]);
  bg.addColorStop(1, ib[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // wind streamlines with travelling dashes
  ctx.lineCap = 'round';
  for (let k = 0; k < 26; k++) {
    const a = 0.08 + 0.12 * hash11(k * 3.3);
    ctx.strokeStyle = `rgba(${PAL.flow || '170, 214, 230'}, ${a})`;
    ctx.lineWidth = 1.2 + hash11(k * 9.1) * 1.6;
    ctx.beginPath();
    for (let x = -20; x <= VIEW_W + 20; x += 24) {
      const y = flowY(k, x, t);
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // bright gust streaks riding the line (comet dashes that follow the flow)
    const speed = 420 + 300 * hash11(k * 1.7);
    if (hash11(k * 4.4) < 0.55) {
      for (let j = 0; j < 2; j++) {
        const head = ((t * speed + j * 980 + hash11(k + j * 13) * 1900) % (VIEW_W + 400)) - 200;
        const len = 120 + 90 * hash11(k * 2.2 + j);
        const grad = ctx.createLinearGradient(head - len, 0, head, 0);
        grad.addColorStop(0, 'rgba(220, 245, 255, 0)');
        grad.addColorStop(1, 'rgba(220, 245, 255, 0.75)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let px = head - len; px <= head; px += 12) {
          const py = flowY(k, px, t);
          if (px === head - len) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
  }

  // title block
  const titleA = envelope(t, 0.3, 1.3, 99, 100);
  const subA = envelope(t, 0.9, 1.9, 99, 100);
  const quoteA = envelope(t, 1.9, 2.8, 99, 100);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.globalAlpha = alpha * titleA;
  ctx.fillStyle = PAL.ink || '#f3efe4';
  let size = 132;
  ctx.font = `900 ${size}px ${FONT.serif}`;
  while (ctx.measureText(FILM.title).width > VIEW_W - 200 && size > 60) {
    size -= 4;
    ctx.font = `900 ${size}px ${FONT.serif}`;
  }
  const rise = lerp(18, 0, smoothstep(0.3, 1.4, t));
  ctx.fillText(FILM.title, VIEW_W / 2, 470 + rise);

  ctx.globalAlpha = alpha * subA;
  ctx.font = `500 40px ${FONT.sans}`;
  ctx.fillStyle = PAL.inkSoft || '#b9d7e2';
  if (FILM.subtitle) ctx.fillText(FILM.subtitle, VIEW_W / 2, 548);
  ctx.font = `italic 500 30px ${FONT.garamond}`;
  ctx.fillStyle = PAL.inkMuted || '#8fb3c2';
  if (FILM.subtitleAlt) ctx.fillText(FILM.subtitleAlt, VIEW_W / 2, 598);

  ctx.globalAlpha = alpha * quoteA;
  ctx.font = `400 34px ${FONT.kai}`;
  ctx.fillStyle = '#e9e2cf';
  if (FILM.quote) ctx.fillText(FILM.quote, VIEW_W / 2, 720);

  // thin rule
  ctx.globalAlpha = alpha * subA;
  ctx.fillStyle = 'rgba(185, 215, 226, 0.5)';
  const rw = 520 * smoothstep(0.9, 1.9, t);
  ctx.fillRect(VIEW_W / 2 - rw / 2, 625, rw, 2);

  ctx.restore();
}

export { INTRO_SEC, clamp };
