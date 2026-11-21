// src/stages/easel/scenery.js — the easel stage's painted world: watercolour paper, the edge
// haze around the valley, the grassy hill, the wooden easel, wind-blown grass, the intro's
// pencil-sketch valley and the outro's soft panorama. All static artwork is baked once.

import { W, H, hillY, HILL_END_X, PAINTER, EASEL, BOARD } from './geom.js';
import { makePRNG, hashSeed, hash11, noise1, noise2, fbm2, createCanvas, hexToRgb } from '../../kit/kit.js';

export const PAPER = '#f4eddd';
export const PAPER_RGB = hexToRgb(PAPER);
export const INK = '#2c2721';

const TAU = Math.PI * 2;
const ss = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// -----------------------------------------------------------------------------
// watercolour helpers (bake-time)
// -----------------------------------------------------------------------------
/** Soft round wash blot (radial gradient), the basic unit of wet-in-wet texture. */
export function blot(g, x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb}, ${a})`);
  gr.addColorStop(0.6, `rgba(${rgb}, ${a * 0.55})`);
  gr.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Granulation: fine pigment specks inside the current clip. */
export function granulate(g, x0, y0, w, h, rng, n, rgb, aMax = 0.12) {
  for (let i = 0; i < n; i++) {
    const x = x0 + rng() * w;
    const y = y0 + rng() * h;
    g.fillStyle = `rgba(${rgb}, ${aMax * (0.3 + 0.7 * rng())})`;
    const r = 0.5 + rng() * 1.3;
    g.fillRect(x, y, r, r);
  }
}

/** Polyline with a hand wobble (subdivided + jittered), returns points. */
export function ragged(points, rng, amp = 3, step = 14) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      out.push([ax + (bx - ax) * u + (rng() - 0.5) * amp, ay + (by - ay) * u + (rng() - 0.5) * amp]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function rgbStr(hex) {
  const c = hexToRgb(hex);
  return `${c.r}, ${c.g}, ${c.b}`;
}

function grain(g, w, h, rng, amount) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (rng() - 0.5) * 2 * amount * 255;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  g.putImageData(img, 0, 0);
}

// -----------------------------------------------------------------------------
// paper + haze
// -----------------------------------------------------------------------------
export function paperTexture(kit) {
  return kit.bake('easel_paper_v2', W, H, (g, rng) => {
    g.fillStyle = PAPER;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) blot(g, rng() * W, rng() * H, 160 + rng() * 360, '170, 140, 95', 0.04);
    for (let i = 0; i < 16; i++) blot(g, rng() * W, rng() * H, 140 + rng() * 260, '255, 255, 255', 0.12);
    grain(g, W, H, rng, 0.03);
  });
}

/**
 * The valley's soft watercolour edge: paper-coloured haze with ragged, bleeding borders
 * (top / left / right / bottom), an atmospheric veil behind the painter (upper left) and a
 * faint pigment rim where the wash ends. One full-frame image, drawn over the valley.
 */
export function hazeOverlay(kit) {
  return kit.bake('easel_haze_v3', W, H, (g, rng) => {
    const img = g.createImageData(W, H);
    const d = img.data;
    // 1D ragged thresholds
    const topT = new Float32Array(W);
    const botT = new Float32Array(W);
    for (let x = 0; x < W; x++) {
      topT[x] = 70 + 70 * fbm2(x * 0.004, 1.3, 3, 11) + 26 * noise1(x * 0.03, 4);
      botT[x] = 36 + 46 * fbm2(x * 0.005, 7.1, 3, 13) + 14 * noise1(x * 0.04, 9);
    }
    const leftT = new Float32Array(H);
    const rightT = new Float32Array(H);
    for (let y = 0; y < H; y++) {
      leftT[y] = 50 + 60 * fbm2(3.7, y * 0.005, 3, 17) + 16 * noise1(y * 0.035, 2);
      rightT[y] = 70 + 90 * fbm2(9.1, y * 0.0045, 3, 19) + 22 * noise1(y * 0.03, 5);
    }
    // coarse 2D raggedness grid
    const GX = 241;
    const GY = 136;
    const grid = new Float32Array(GX * GY);
    for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) grid[j * GX + i] = fbm2(i * 0.11, j * 0.11, 3, 23);
    const sampleGrid = (x, y) => {
      const fx = x / 8;
      const fy = y / 8;
      const i = Math.min(GX - 2, Math.floor(fx));
      const j = Math.min(GY - 2, Math.floor(fy));
      const u = fx - i;
      const v = fy - j;
      const a = grid[j * GX + i];
      const b = grid[j * GX + i + 1];
      const c = grid[(j + 1) * GX + i];
      const e = grid[(j + 1) * GX + i + 1];
      return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v;
    };
    const P = PAPER_RGB;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const n = sampleGrid(x, y);
        const jitter = (n - 0.5) * 50;
        let a = 1 - ss(0, topT[x] + jitter, y);
        a = Math.max(a, 1 - ss(0, botT[x] + jitter * 0.6, H - y));
        a = Math.max(a, 1 - ss(0, leftT[y] + jitter, x));
        a = Math.max(a, 1 - ss(0, rightT[y] + jitter, W - x));
        // atmospheric veil behind the painter (upper left) — keeps the figure readable
        const dx = (x - 260) / 900;
        const dy = (y - 330) / 520;
        const veil = 0.42 * Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * (0.8 + 0.4 * n);
        a = Math.max(a, veil);
        // a whisper of haze over the whole valley (unifies the scene with the paper)
        a = Math.max(a, 0.06 + 0.05 * n);
        // pigment rim where the wash ends (a ~ 0.5)
        const rim = Math.exp(-(((a - 0.55) / 0.07) ** 2)) * (a < 0.9 ? 1 : 0);
        const k = (y * W + x) * 4;
        const speck = (hash11(x * 0.731 + y * 1.913) - 0.5) * 16;
        d[k] = P.r - rim * 46 + speck;
        d[k + 1] = P.g - rim * 44 + speck;
        d[k + 2] = P.b - rim * 36 + speck;
        d[k + 3] = Math.round(255 * Math.min(1, a + rim * 0.1));
      }
    }
    g.putImageData(img, 0, 0);
  });
}

// -----------------------------------------------------------------------------
// hill
// -----------------------------------------------------------------------------
export const HILL_BOX = { x: 0, y: 650, w: 1200, h: 430 };

function hillPath(g, ox, oy) {
  g.beginPath();
  g.moveTo(-10 - ox, hillY(0) - oy);
  for (let x = 0; x <= HILL_END_X + 40; x += 6) g.lineTo(x - ox, hillY(x) - oy);
  g.lineTo(HILL_END_X + 80 - ox, H + 20 - oy);
  g.lineTo(-10 - ox, H + 20 - oy);
  g.closePath();
}

/** The hill at resolution `res` (1 or 2), covering HILL_BOX. */
export function hillArt(kit, res = 1) {
  const B = HILL_BOX;
  return kit.bake(`easel_hill_v4_r${res}`, B.w * res, B.h * res, (g, rng) => {
    g.scale(res, res);
    const ox = B.x;
    const oy = B.y;
    // base wash
    hillPath(g, ox, oy);
    const gr = g.createLinearGradient(0, 750 - oy, 0, H - oy);
    gr.addColorStop(0, '#b4c47a');
    gr.addColorStop(0.18, '#8fae5f');
    gr.addColorStop(0.55, '#6b8f4c');
    gr.addColorStop(1, '#4d6e3e');
    g.fillStyle = gr;
    g.fill();
    g.save();
    hillPath(g, ox, oy);
    g.clip();
    // wet-in-wet blooms: ochre, deep green, blue-green
    for (let i = 0; i < 70; i++) {
      const x = rng() * 1150;
      const y = hillY(Math.min(W, x)) + 20 + rng() * 300;
      const r = 40 + rng() * 120;
      const pick = rng();
      const rgb = pick < 0.3 ? '196, 168, 88' : pick < 0.65 ? '58, 92, 52' : pick < 0.85 ? '64, 104, 98' : '150, 180, 96';
      blot(g, x - ox, y - oy, r, rgb, 0.12 + rng() * 0.14);
    }
    // sunlit band along the crest
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(238, 236, 170, 0.35)';
    g.lineWidth = 26;
    g.beginPath();
    for (let x = 0; x <= HILL_END_X; x += 8) {
      const y = hillY(x) + 12;
      if (x === 0) g.moveTo(x - ox, y - oy);
      else g.lineTo(x - ox, y - oy);
    }
    g.stroke();
    // cast shadows (sun from the upper right): painter + easel legs fall to the lower left
    g.fillStyle = 'rgba(40, 62, 38, 0.24)';
    g.beginPath();
    g.ellipse(PAINTER.x - 46 - ox, PAINTER.y + 10 - oy, 70, 13, -0.08, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(40, 62, 38, 0.22)';
    g.lineWidth = 7;
    for (const leg of [EASEL.legL, EASEL.legR, EASEL.legB]) {
      g.beginPath();
      g.moveTo(leg.x - ox, leg.y + 2 - oy);
      g.lineTo(leg.x - 120 - ox, leg.y + 22 - oy);
      g.stroke();
    }
    // dry-brush grass marks
    for (let i = 0; i < 900; i++) {
      const x = rng() * 1140;
      const top = hillY(Math.min(W, x));
      const y = top + 8 + Math.pow(rng(), 1.4) * 320;
      if (y > H) continue;
      const len = 5 + rng() * 14;
      const lean = -0.5 - rng() * 0.5;
      const dark = rng() < 0.55;
      g.strokeStyle = dark ? `rgba(46, 74, 40, ${0.18 + rng() * 0.25})` : `rgba(214, 222, 150, ${0.18 + rng() * 0.25})`;
      g.lineWidth = 1 + rng() * 1.6;
      g.beginPath();
      g.moveTo(x - ox, y - oy);
      g.quadraticCurveTo(x + lean * len * 0.3 - ox, y - len * 0.6 - oy, x + lean * len - ox, y - len - oy);
      g.stroke();
    }
    granulate(g, 0, 0, 1200, 430, rng, 5000, '30, 50, 28', 0.14);
    // wildflowers
    for (let i = 0; i < 140; i++) {
      const x = rng() * 1080;
      const y = hillY(Math.min(W, x)) + 10 + Math.pow(rng(), 1.8) * 260;
      const c = rng();
      g.fillStyle = c < 0.45 ? 'rgba(250, 246, 226, 0.9)' : c < 0.8 ? 'rgba(242, 200, 76, 0.9)' : 'rgba(214, 110, 120, 0.85)';
      const r = 1.6 + rng() * 2.2;
      g.beginPath();
      g.arc(x - ox, y - oy, r, 0, TAU);
      g.fill();
    }
    g.restore();
    // the painter's satchel and a folding stool on the grass (story props)
    drawSatchel(g, 116 - ox, hillY(116) + 6 - oy);
    // wet edge along the crest
    g.strokeStyle = 'rgba(52, 80, 44, 0.55)';
    g.lineWidth = 2.4;
    g.beginPath();
    const pts = [];
    for (let x = 0; x <= HILL_END_X + 30; x += 10) pts.push([x - ox, hillY(x) - oy]);
    const rp = ragged(pts, rng, 1.6, 9);
    rp.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
    grain(g, B.w * res, B.h * res, makePRNG(hashSeed('hillgrain' + res)), 0.035);
  });
}

function drawSatchel(g, x, y) {
  g.save();
  g.translate(x, y);
  g.lineJoin = 'round';
  // strap
  g.strokeStyle = '#5a3b26';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-22, -26);
  g.quadraticCurveTo(-6, -58, 22, -28);
  g.stroke();
  // bag body
  g.fillStyle = '#9a6a42';
  g.strokeStyle = '#3c2a1c';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-30, -2);
  g.lineTo(-26, -32);
  g.quadraticCurveTo(0, -38, 26, -32);
  g.lineTo(30, -2);
  g.quadraticCurveTo(0, 3, -30, -2);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#7d5434';
  g.beginPath();
  g.moveTo(-27, -30);
  g.quadraticCurveTo(0, -36, 27, -30);
  g.lineTo(24, -16);
  g.quadraticCurveTo(0, -11, -24, -16);
  g.closePath();
  g.fill();
  g.stroke();
  // rolled paper sticking out
  g.fillStyle = '#f2ead6';
  g.beginPath();
  g.ellipse(14, -40, 5, 13, 0.5, 0, TAU);
  g.fill();
  g.stroke();
  g.restore();
}

// -----------------------------------------------------------------------------
// easel
// -----------------------------------------------------------------------------
export const EASEL_BOX = { x: 250, y: 290, w: 400, h: 520 };

function woodPole(g, a, b, w0, w1, col, hi) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  g.beginPath();
  g.moveTo(a.x + nx * w0, a.y + ny * w0);
  g.lineTo(b.x + nx * w1, b.y + ny * w1);
  g.lineTo(b.x - nx * w1, b.y - ny * w1);
  g.lineTo(a.x - nx * w0, a.y - ny * w0);
  g.closePath();
  g.fillStyle = col;
  g.fill();
  g.strokeStyle = 'rgba(40, 26, 14, 0.85)';
  g.lineWidth = 1.3;
  g.stroke();
  g.strokeStyle = hi;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(a.x + nx * w0 * 0.4, a.y + ny * w0 * 0.4);
  g.lineTo(b.x + nx * w1 * 0.4, b.y + ny * w1 * 0.4);
  g.stroke();
}

/** Parts of the easel behind the board: back leg, mast, front legs. */
export function easelBack(kit, res = 1) {
  const B = EASEL_BOX;
  return kit.bake(`easel_back_v2_r${res}`, B.w * res, B.h * res, (g) => {
    g.scale(res, res);
    g.translate(-B.x, -B.y);
    const top = EASEL.mastTop;
    woodPole(g, { x: top.x + 4, y: top.y + 10 }, EASEL.legB, 4, 4.5, '#7a5634', 'rgba(255, 220, 170, 0.25)');
    woodPole(g, { x: top.x - 6, y: top.y + 6 }, EASEL.legL, 5, 6, '#a77a4c', 'rgba(255, 228, 180, 0.5)');
    woodPole(g, { x: top.x + 6, y: top.y + 6 }, EASEL.legR, 5, 6, '#9c7046', 'rgba(255, 228, 180, 0.45)');
    woodPole(g, { x: top.x, y: top.y - 6 }, { x: top.x, y: EASEL.ledgeY + 70 }, 5, 5, '#b0844f', 'rgba(255, 232, 186, 0.55)');
    // wing-nut hinge at the top
    g.fillStyle = '#5b5750';
    g.beginPath();
    g.arc(top.x, top.y + 8, 5, 0, TAU);
    g.fill();
  });
}

/** Parts of the easel in front of the board: ledge (tray) and the top clamp. */
export function easelFront(kit, res = 1) {
  const B = EASEL_BOX;
  return kit.bake(`easel_front_v2_r${res}`, B.w * res, B.h * res, (g) => {
    g.scale(res, res);
    g.translate(-B.x, -B.y);
    const y = EASEL.ledgeY;
    // ledge: a shallow tray
    g.fillStyle = '#b48650';
    g.strokeStyle = 'rgba(40, 26, 14, 0.9)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.rect(EASEL.ledgeX0, y - 4, EASEL.ledgeX1 - EASEL.ledgeX0, 13);
    g.fill();
    g.stroke();
    g.fillStyle = 'rgba(255, 230, 186, 0.45)';
    g.fillRect(EASEL.ledgeX0 + 2, y - 3, EASEL.ledgeX1 - EASEL.ledgeX0 - 4, 3);
    g.fillStyle = '#8a6238';
    g.fillRect(EASEL.ledgeX0, y + 9, EASEL.ledgeX1 - EASEL.ledgeX0, 4);
    // top clamp holding the board
    g.fillStyle = '#a77a4c';
    g.beginPath();
    g.rect(EASEL.mastTop.x - 22, BOARD.y - 12, 44, 16);
    g.fill();
    g.stroke();
    g.fillStyle = '#5b5750';
    g.beginPath();
    g.arc(EASEL.mastTop.x, BOARD.y - 4, 3.4, 0, TAU);
    g.fill();
    // a rag hanging from the ledge
    g.fillStyle = 'rgba(222, 214, 196, 0.95)';
    g.beginPath();
    g.moveTo(EASEL.ledgeX1 - 60, y + 8);
    g.lineTo(EASEL.ledgeX1 - 20, y + 8);
    g.quadraticCurveTo(EASEL.ledgeX1 - 18, y + 40, EASEL.ledgeX1 - 30, y + 52);
    g.lineTo(EASEL.ledgeX1 - 44, y + 46);
    g.quadraticCurveTo(EASEL.ledgeX1 - 56, y + 30, EASEL.ledgeX1 - 60, y + 8);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(60, 50, 40, 0.6)';
    g.stroke();
    g.fillStyle = 'rgba(80, 120, 160, 0.35)';
    g.beginPath();
    g.arc(EASEL.ledgeX1 - 38, y + 26, 7, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(200, 85, 61, 0.3)';
    g.beginPath();
    g.arc(EASEL.ledgeX1 - 46, y + 38, 5, 0, TAU);
    g.fill();
  });
}

/** Water jar on the ledge; the water tints with the pigment the brush has rinsed. */
export function drawJar(ctx, tintRgb, tintA, t) {
  const { x, y } = EASEL.jar;
  ctx.save();
  // water
  ctx.fillStyle = `rgba(${tintRgb}, ${0.18 + tintA})`;
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 22);
  ctx.lineTo(x + 13, y - 22);
  ctx.lineTo(x + 12, y - 4);
  ctx.quadraticCurveTo(x, y + 1, x - 12, y - 4);
  ctx.closePath();
  ctx.fill();
  // ripple
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y - 22, 12, 2.2 + 0.6 * Math.sin(t * 6), 0, 0, TAU);
  ctx.stroke();
  // glass
  ctx.strokeStyle = 'rgba(60, 70, 74, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 32);
  ctx.lineTo(x - 12, y - 4);
  ctx.quadraticCurveTo(x, y + 1, x + 12, y - 4);
  ctx.lineTo(x + 14, y - 32);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y - 32, 14, 3, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 27);
  ctx.lineTo(x - 8, y - 9);
  ctx.stroke();
  ctx.restore();
}

// -----------------------------------------------------------------------------
// grass blades in the wind (per frame, cheap)
// -----------------------------------------------------------------------------
const BLADES = (() => {
  const rng = makePRNG(hashSeed('easel_blades_v1'));
  const out = [];
  for (let x = 4; x < 1090; x += 5 + rng() * 6) {
    const h = 8 + rng() * 20;
    out.push({ x, h, ph: rng() * TAU, c: rng(), w: 1.1 + rng() * 1.3 });
  }
  return out;
})();

export function drawGrass(ctx, t, wind = 1) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const b of BLADES) {
    const base = hillY(b.x) + 3;
    // gusts travel up the hill from the right
    const gust = 0.55 + 0.45 * Math.sin(t * 1.3 - b.x * 0.006);
    const sway = (-0.55 - 0.35 * gust + 0.12 * Math.sin(t * 5.1 + b.ph)) * wind;
    const tipX = b.x + sway * b.h;
    const tipY = base - b.h * (1 - 0.25 * Math.abs(sway));
    ctx.strokeStyle = b.c < 0.4 ? 'rgba(66, 98, 52, 0.85)' : b.c < 0.8 ? 'rgba(120, 150, 78, 0.85)' : 'rgba(196, 196, 120, 0.85)';
    ctx.lineWidth = b.w;
    ctx.beginPath();
    ctx.moveTo(b.x, base);
    ctx.quadraticCurveTo(b.x + sway * b.h * 0.2, base - b.h * 0.6, tipX, tipY);
    ctx.stroke();
  }
  ctx.restore();
}

// -----------------------------------------------------------------------------
// the intro's valley: pencil sketch on paper with a pale sky wash
// -----------------------------------------------------------------------------
export function sketchValley(kit) {
  return kit.bake('easel_sketch_v2', W, H, (g, rng) => {
    g.drawImage(paperTexture(kit), 0, 0);
    // pale sky wash with a ragged lower edge
    const sky = g.createLinearGradient(0, 60, 0, 520);
    sky.addColorStop(0, 'rgba(150, 186, 210, 0.42)');
    sky.addColorStop(1, 'rgba(190, 214, 226, 0.0)');
    g.fillStyle = sky;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(W, 0);
    for (let x = W; x >= 0; x -= 20) g.lineTo(x, 470 + 40 * noise1(x * 0.01, 3));
    g.closePath();
    g.fill();
    for (let i = 0; i < 12; i++) blot(g, 600 + rng() * 1300, 80 + rng() * 260, 60 + rng() * 120, '255, 255, 255', 0.35);
    // graphite lines: distant ridges, river, a few trees and fields
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const pencil = (pts, a = 0.5, w = 1.3) => {
      g.strokeStyle = `rgba(70, 66, 60, ${a})`;
      g.lineWidth = w;
      g.beginPath();
      ragged(pts, rng, 1.6, 10).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    };
    const ridge = (y0, amp, f, ph) => {
      const pts = [];
      for (let x = 500; x <= 1900; x += 40) pts.push([x, y0 - amp * fbm2(x * f, ph, 3, 5)]);
      return pts;
    };
    pencil(ridge(470, 120, 0.004, 1), 0.38, 1.2);
    pencil(ridge(520, 90, 0.006, 4), 0.45, 1.3);
    pencil(ridge(600, 70, 0.008, 7), 0.5, 1.4);
    // river winding to the horizon
    const river = [];
    for (let k = 0; k <= 30; k++) {
      const u = k / 30;
      river.push([1180 + 340 * Math.sin(u * 4.2) * (1 - u) + u * 220, 980 - u * 470]);
    }
    pencil(river, 0.45, 1.3);
    pencil(river.map(([x, y], k) => [x + 40 * (1 - k / 30) + 6, y]), 0.35, 1.1);
    // field lines
    for (let i = 0; i < 9; i++) {
      const y = 660 + i * 34;
      pencil([[900 + rng() * 100, y], [1880, y - 30 + rng() * 20]], 0.18, 1);
    }
    // scribbled trees
    for (let i = 0; i < 18; i++) {
      const x = 820 + rng() * 1050;
      const y = 600 + rng() * 280;
      const r = 10 + rng() * 16;
      g.strokeStyle = 'rgba(70, 66, 60, 0.45)';
      g.lineWidth = 1;
      g.beginPath();
      for (let k = 0; k < 26; k++) {
        const a = k * 0.9;
        const rr = r * (0.6 + 0.4 * rng());
        const px = x + Math.cos(a) * rr;
        const py = y - r + Math.sin(a) * rr * 0.9;
        if (k === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.moveTo(x, y);
      g.lineTo(x, y - r * 0.4);
      g.stroke();
    }
    // light hatching (shadows on the slopes)
    for (let i = 0; i < 160; i++) {
      const x = 700 + rng() * 1150;
      const y = 520 + rng() * 140;
      g.strokeStyle = 'rgba(70, 66, 60, 0.16)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 10, y - 12);
      g.stroke();
    }
  });
}

// -----------------------------------------------------------------------------
// the outro's backdrop: a soft finished panorama in muted washes
// -----------------------------------------------------------------------------
export function outroPanorama(kit) {
  return kit.bake('easel_outro_pano_v2', W, H, (g, rng) => {
    g.drawImage(paperTexture(kit), 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, 720);
    sky.addColorStop(0, 'rgba(160, 192, 214, 0.40)');
    sky.addColorStop(0.6, 'rgba(236, 210, 170, 0.28)');
    sky.addColorStop(1, 'rgba(236, 210, 170, 0)');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, 720);
    for (let i = 0; i < 18; i++) blot(g, rng() * W, 60 + rng() * 380, 80 + rng() * 160, '255, 255, 255', 0.3);
    const layer = (y0, amp, f, ph, rgb, a) => {
      g.fillStyle = `rgba(${rgb}, ${a})`;
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, y0 - amp * fbm2(x * f, ph, 3, 3));
      g.lineTo(W, H);
      g.closePath();
      g.fill();
      g.strokeStyle = `rgba(${rgb}, ${Math.min(1, a + 0.15)})`;
      g.lineWidth = 1.6;
      g.stroke();
    };
    layer(690, 150, 0.0026, 1, '150, 168, 190', 0.30);
    layer(770, 120, 0.0035, 5, '128, 158, 140', 0.32);
    layer(860, 100, 0.005, 9, '112, 146, 104', 0.34);
    for (let i = 0; i < 40; i++) blot(g, rng() * W, 760 + rng() * 300, 30 + rng() * 80, '90, 120, 80', 0.12);
  });
}

/** Utility for other modules: a canvas the size of the frame. */
export function frameCanvas() {
  return createCanvas(W, H);
}

export { noise2 };
