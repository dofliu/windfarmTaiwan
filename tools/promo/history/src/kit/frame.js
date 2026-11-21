// src/kit/frame.js
// Period-appropriate frames drawn in WORLD space around each 1000x1000 panel
// (inside the panel bounds, so adjacent frames sit side by side), plus the
// museum wall label (placard) under each frame. Used by the gallery-ride stage;
// any stage may reuse drawPanelFrame for a framed canvas of the same size.

import { FONT } from './fonts.js';

const PANEL_SIZE = 1000;
import { hash11, wrapText } from './kit.js';

export const FRAME_W = 26;
const P = PANEL_SIZE;

function bandPath(ctx, x0, y0, w, h, inset, thick) {
  ctx.beginPath();
  ctx.rect(x0 + inset, y0 + inset, w - inset * 2, h - inset * 2);
  ctx.rect(x0 + inset + thick, y0 + inset + thick, w - (inset + thick) * 2, h - (inset + thick) * 2);
}

function fillBand(ctx, x0, y0, inset, thick, style) {
  ctx.fillStyle = style;
  bandPath(ctx, x0, y0, P, P, inset, thick);
  ctx.fill('evenodd');
}

/** Bevelled band: light top/left, dark bottom/right. */
function bevel(ctx, x0, y0, inset, thick, light, dark) {
  const a = inset;
  const b = inset + thick;
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(x0 + a, y0 + a);
  ctx.lineTo(x0 + P - a, y0 + a);
  ctx.lineTo(x0 + P - b, y0 + b);
  ctx.lineTo(x0 + b, y0 + b);
  ctx.lineTo(x0 + b, y0 + P - b);
  ctx.lineTo(x0 + a, y0 + P - a);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(x0 + P - a, y0 + a);
  ctx.lineTo(x0 + P - a, y0 + P - a);
  ctx.lineTo(x0 + a, y0 + P - a);
  ctx.lineTo(x0 + b, y0 + P - b);
  ctx.lineTo(x0 + P - b, y0 + P - b);
  ctx.lineTo(x0 + P - b, y0 + b);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw the frame for `scene` with its panel origin at world (x0, 0).
 * scene.frame = { family, color, accent }
 * families: gilt | wood | stone | mount | tile | paper | poster | film | screen | steel
 */
export function drawPanelFrame(ctx, scene, x0, active = false) {
  const fr = scene.frame || {};
  const family = fr.family || 'wood';
  const color = fr.color || '#5a4632';
  const accent = fr.accent || '#c9a45c';
  const y0 = 0;
  const W = FRAME_W;
  ctx.save();

  switch (family) {
    case 'gilt': {
      bevel(ctx, x0, y0, 0, W, '#e9c873', '#7a5a22');
      fillBand(ctx, x0, y0, 5, W - 10, '#c99a3e');
      // bead moulding
      ctx.fillStyle = '#f3dc93';
      const step = 22;
      for (let i = step / 2; i < P; i += step) {
        for (const [bx, by] of [
          [x0 + i, y0 + W / 2],
          [x0 + i, y0 + P - W / 2],
          [x0 + W / 2, y0 + i],
          [x0 + P - W / 2, y0 + i],
        ]) {
          ctx.beginPath();
          ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      fillBand(ctx, x0, y0, W - 4, 4, '#5c4317');
      break;
    }
    case 'stone': {
      bevel(ctx, x0, y0, 0, W, '#d8c6a3', '#8b7756');
      fillBand(ctx, x0, y0, 4, W - 8, color);
      // carved notches
      ctx.strokeStyle = 'rgba(40,30,20,0.35)';
      ctx.lineWidth = 2;
      for (let i = 30; i < P - 20; i += 40) {
        ctx.beginPath();
        ctx.moveTo(x0 + i, y0 + 6);
        ctx.lineTo(x0 + i, y0 + W - 6);
        ctx.moveTo(x0 + i, y0 + P - W + 6);
        ctx.lineTo(x0 + i, y0 + P - 6);
        ctx.moveTo(x0 + 6, y0 + i);
        ctx.lineTo(x0 + W - 6, y0 + i);
        ctx.moveTo(x0 + P - W + 6, y0 + i);
        ctx.lineTo(x0 + P - 6, y0 + i);
        ctx.stroke();
      }
      fillBand(ctx, x0, y0, W - 3, 3, accent);
      break;
    }
    case 'mount': {
      // Chinese silk mounting: pale silk band with brocade stripes
      fillBand(ctx, x0, y0, 0, W, '#e7dcc3');
      fillBand(ctx, x0, y0, 0, 5, color);
      fillBand(ctx, x0, y0, 10, 3, accent);
      fillBand(ctx, x0, y0, W - 2, 2, '#6b5a40');
      break;
    }
    case 'tile': {
      fillBand(ctx, x0, y0, 0, W, '#f4f1ea');
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      bandPath(ctx, x0, y0, P, P, 3, W - 6);
      ctx.stroke();
      ctx.fillStyle = color;
      for (let i = 40; i < P - 20; i += 52) {
        for (const [bx, by] of [
          [x0 + i, y0 + W / 2],
          [x0 + i, y0 + P - W / 2],
          [x0 + W / 2, y0 + i],
          [x0 + P - W / 2, y0 + i],
        ]) {
          ctx.beginPath();
          ctx.moveTo(bx, by - 6);
          ctx.lineTo(bx + 6, by);
          ctx.lineTo(bx, by + 6);
          ctx.lineTo(bx - 6, by);
          ctx.closePath();
          ctx.fill();
        }
      }
      break;
    }
    case 'paper': {
      // engraving / print: black thin frame + cream passe-partout
      fillBand(ctx, x0, y0, 0, 7, '#111');
      fillBand(ctx, x0, y0, 7, W - 7, '#efe8d8');
      fillBand(ctx, x0, y0, W - 2, 2, '#8a8170');
      break;
    }
    case 'poster': {
      fillBand(ctx, x0, y0, 0, 5, '#9aa0a6');
      fillBand(ctx, x0, y0, 5, W - 5, '#f6f4ef');
      break;
    }
    case 'film': {
      fillBand(ctx, x0, y0, 0, W, '#0d0d0d');
      ctx.fillStyle = '#e8e2d2';
      for (let i = 14; i < P - 10; i += 34) {
        ctx.fillRect(x0 + i, y0 + 8, 16, 10);
        ctx.fillRect(x0 + i, y0 + P - 18, 16, 10);
      }
      break;
    }
    case 'screen': {
      fillBand(ctx, x0, y0, 0, W, color || '#1a1d22');
      fillBand(ctx, x0, y0, W - 3, 3, '#000');
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x0 + P - 40, y0 + P - W / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'steel': {
      bevel(ctx, x0, y0, 0, W, '#b9c0c7', '#4f565d');
      fillBand(ctx, x0, y0, 5, W - 10, '#7d858d');
      ctx.fillStyle = '#d5dade';
      for (const [bx, by] of [
        [x0 + 13, y0 + 13],
        [x0 + P - 13, y0 + 13],
        [x0 + 13, y0 + P - 13],
        [x0 + P - 13, y0 + P - 13],
      ]) {
        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'wood':
    default: {
      bevel(ctx, x0, y0, 0, W, '#8a6a48', '#2e2116');
      fillBand(ctx, x0, y0, 5, W - 10, color);
      // grain
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        const o = 8 + k * 4 + hash11(scene.num * 3 + k) * 2;
        ctx.strokeRect(x0 + o, y0 + o, P - o * 2, P - o * 2);
      }
      fillBand(ctx, x0, y0, W - 3, 3, accent);
      break;
    }
  }

  // thin inner shadow so the artwork sits "inside" the frame
  const g = ctx.createLinearGradient(0, y0 + W, 0, y0 + W + 14);
  g.addColorStop(0, 'rgba(0,0,0,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x0 + W, y0 + W, P - W * 2, 14);

  if (active) {
    // nothing flashy: a soft picture-light glow on top of the frame
    const gl = ctx.createLinearGradient(0, y0 - 40, 0, y0 + 60);
    gl.addColorStop(0, 'rgba(255,236,190,0)');
    gl.addColorStop(0.6, 'rgba(255,236,190,0.07)');
    gl.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(x0, y0 - 40, P, 100);
  }
  ctx.restore();
}

/**
 * Museum wall label under each frame (world space, panel origin x0).
 * Shows: number, date label, title (zh), English title, one-line caption.
 */
export const PLACARD_Y = 1022;
export const PLACARD_H = 132;

export function drawPlacard(ctx, scene, x0, alpha = 1) {
  if (alpha <= 0.001) return;
  const x = x0 + 30;
  const y = PLACARD_Y;
  const w = P - 60;
  const h = PLACARD_H;
  const accent = (scene.frame && scene.frame.accent) || '#c9a45c';
  ctx.save();
  ctx.globalAlpha = alpha;

  // card
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 4, y + 6, w, h);
  ctx.fillStyle = '#f2ede2';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 10, h);

  // number
  ctx.fillStyle = '#2a2621';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 64px ${FONT.serif}`;
  const num = String(scene.num).padStart(2, '0');
  ctx.fillText(num, x + 30, y + 72);
  const numW = ctx.measureText(num).width;

  // date label
  ctx.font = `700 26px ${FONT.sans}`;
  ctx.fillStyle = darken(accent);
  ctx.fillText(scene.dateLabel, x + 30, y + 112);
  const dateW = ctx.measureText(scene.dateLabel).width;

  const tx = x + 30 + Math.max(numW, dateW) + 28;
  // divider
  ctx.fillStyle = 'rgba(42,38,33,0.25)';
  ctx.fillRect(tx - 16, y + 18, 2, h - 36);

  // title
  ctx.fillStyle = '#1d1a16';
  const title = scene.title || scene.zh || '';
  const titleAlt = scene.titleAlt || scene.en || '';
  let tSize = 40;
  ctx.font = `700 ${tSize}px ${FONT.serif}`;
  while (ctx.measureText(title).width > x + w - 24 - tx && tSize > 26) {
    tSize -= 2;
    ctx.font = `700 ${tSize}px ${FONT.serif}`;
  }
  ctx.fillText(title, tx, y + 52);
  const zhW = ctx.measureText(title).width;
  ctx.font = `italic 500 21px ${FONT.garamond}`;
  ctx.fillStyle = '#6a6052';
  if (tx + zhW + 16 + ctx.measureText(titleAlt).width < x + w - 16) ctx.fillText(titleAlt, tx + zhW + 16, y + 50);

  // caption (single line, shrink to fit)
  let size = 27;
  ctx.font = `500 ${size}px ${FONT.sans}`;
  const maxW = x + w - 24 - tx;
  while (ctx.measureText(scene.caption).width > maxW && size > 19) {
    size -= 1;
    ctx.font = `500 ${size}px ${FONT.sans}`;
  }
  ctx.fillStyle = '#39342d';
  const lines = wrapText(ctx, scene.caption, maxW);
  ctx.fillText(lines[0] || '', tx, y + 98);
  if (lines[1]) ctx.fillText(lines[1], tx, y + 98 + size + 4);
  ctx.restore();
}

function darken(hex) {
  if (!hex || hex[0] !== '#') return '#5a4a32';
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (v) => Math.round(v * 0.62);
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
