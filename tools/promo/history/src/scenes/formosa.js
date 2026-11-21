// src/scenes/formosa.js
// Chapter "formosa" · 2017–2020 · 海洋風電.
//
// Medium: 客家花布＋廟宇彩繪 (Hakka floral fabric and temple painting). The sea view is framed by
// printed cotton: a red-ground valance with big peonies, green leaves and a gold scalloped trim
// with tassels, green-ground side curtains tied back with gold cord, a red-ground hem. Fabric
// tells: big layered peonies (pink, white, gold, blue) with bold navy outlines, the colour fills
// printed a hair off register from the keyline, two-tone leaves, small five-petal fillers and a
// visible cotton weave. Temple-painting tells inside the view: a stepped 退暈 sky (banded colour
// gradation), outlined 祥雲 with spiral curls, rows of outlined 浪紋 wave scallops with white crest
// lines, and a navy-and-gold 匾額 on the valance (「風調雨順」, a stock temple inscription).
//
// Scene: looking out to sea from the breakwater of a Miaoli fishing harbour (龍鳳漁港, Zhunan).
//   back  stepped sky, a red sun, drifting 祥雲; far sea in wave rows
//   mid   the two demonstration turbines (installed Oct 2016) standing nearest, white towers on
//         yellow transition pieces (monopiles), three white blades; behind them the phase-2 row
//         of 6 MW turbines along the horizon (only part of the 20 is drawn); a fishing boat
//         heading out; the breakwater: tetrapods (消波塊), stone walkway (the road), bollards
//   fore  the harbour basin with two moored fishing boats (tyre fenders, wheelhouse, pennant
//         strings) bobbing on mooring lines, the tied-back curtains (tassels swing), valance and hem
//   Proportions follow tools/farm_dimensions.py: demo 90 m hub / 120 m rotor, phase 2 110 m hub /
//   154 m rotor; positions are artistic (exact offshore distance is not claimed). No logos.
//
// Story beat (bar 3): 2017 → 2019/20. Only the two demo turbines turn at first; on the bar-3
// downbeat the phase-2 turbines pop up one after another across the horizon (left → right) and
// start turning, a red festival ribbon with gold edges unfurls out of a 祥雲 reading
// 「22 部風機 · 128 MW」, and gold sparkles burst on the landing beat.
//
// Deterministic: no Math.random / Date — kit.makePRNG / kit.hash11 only. Static layers are baked.
// Gallery-ride: designed on the 1000x1000 panel (road / walkway at y 700). Easel: the design sits
// in p.layout inside a field of the same floral fabric with a gold border.

export const meta = { stages: ['gallery-ride', 'easel'] };
const ID = 'formosa';

const S = 1000;
const ROAD = 700;
const HZ = 452; // horizon
const TAU = Math.PI * 2;

// palette (chapter palette + fabric / temple-painting tints)
const RED = '#c8202f';
const RED_D = '#8f1622';
const GREEN = '#1f7a4a';
const GREEN_D = '#145537';
const GREEN_L = '#4fae6f';
const LEAF_L = '#8fcf6a';
const GOLD = '#f2c230';
const GOLD_D = '#b98a1c';
const GOLD_L = '#fbe39a';
const CREAM = '#f4ead2';
const NAVY = '#1c2b4a';
const WHITE = '#fbf6ea';
const STONE = '#d8d1bd';
const STONE_D = '#a7a08e';

const PEONIES = [
  ['#e8607f', '#f39ab0', '#fcd6df'], // pink
  ['#efe2cf', '#f9f0e2', '#ffffff'], // white
  ['#e9a91f', '#f4cb55', '#fbe7a0'], // gold
  ['#4c68b8', '#839ad9', '#c6d0f2'], // blue
];

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ss = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const pmod = (a, m) => ((a % m) + m) % m;
/** Integral of smoothstep(a, b, T) dT — an angle that eases from rest to unit speed. */
function intSmooth(T, a, b) {
  const s = clamp01((T - a) / (b - a));
  return (b - a) * (s * s * s - 0.5 * s * s * s * s) + Math.max(0, T - b);
}
function easeOutBack(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.9;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

// =============================================================================
// fabric motifs (bake time)
// =============================================================================
/** One scalloped peony petal as a Path2D, pointing along `ang` from radius r0 to r1. */
function petalPath(cx, cy, ang, r0, r1, wid, bumps) {
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const P = (u, v) => [cx + ca * u - sa * v, cy + sa * u + ca * v];
  const path = new Path2D();
  let q = P(r0, -wid * 0.3);
  path.moveTo(q[0], q[1]);
  let c = P(lerp(r0, r1, 0.45), -wid * 1.12);
  q = P(r1 - wid * 0.32, -wid * 0.92);
  path.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  const edge = (v) => r1 - wid * 0.32 * (v / wid) * (v / wid);
  for (let k = 0; k < bumps; k++) {
    const v0 = lerp(-0.92, 0.92, k / bumps) * wid;
    const v1 = lerp(-0.92, 0.92, (k + 1) / bumps) * wid;
    const vm = (v0 + v1) / 2;
    c = P(edge(vm) + wid * 0.34, vm);
    q = P(edge(v1), v1);
    path.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  }
  c = P(lerp(r0, r1, 0.45), wid * 1.12);
  q = P(r0, wid * 0.3);
  path.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  path.closePath();
  return path;
}

/** Fill a path slightly off register, then the navy keyline on register. */
function printFill(g, path, color, lw, off = 1) {
  g.save();
  g.translate(1.6 * off, 1.1 * off);
  g.fillStyle = color;
  g.fill(path);
  g.restore();
  g.lineWidth = lw;
  g.strokeStyle = NAVY;
  g.stroke(path);
}

function peony(g, x, y, R, rot, cols, rng) {
  const lw = Math.max(1.4, R * 0.045);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const ring = (n, r0, r1, wid, col, off, bumps) => {
    for (let i = 0; i < n; i++) {
      const a = rot + off + (i * TAU) / n + (rng() - 0.5) * 0.12;
      printFill(g, petalPath(x, y, a, r0, r1 * (0.94 + rng() * 0.1), wid, bumps), col, lw, R / 60);
    }
  };
  ring(8, R * 0.12, R, R * 0.42, cols[0], 0, 3);
  ring(7, R * 0.08, R * 0.72, R * 0.34, cols[1], 0.45, 3);
  ring(5, R * 0.05, R * 0.46, R * 0.25, cols[2], 0.12, 2);
  // petal highlights (short white strokes)
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = Math.max(1, R * 0.035);
  for (let i = 0; i < 7; i++) {
    const a = rot + 0.45 + (i * TAU) / 7;
    g.beginPath();
    g.moveTo(x + Math.cos(a) * R * 0.38, y + Math.sin(a) * R * 0.38);
    g.lineTo(x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.6);
    g.stroke();
  }
  // gold heart with stamen dots
  const hp = new Path2D();
  hp.arc(x, y, R * 0.17, 0, TAU);
  printFill(g, hp, GOLD, lw, R / 60);
  g.fillStyle = RED_D;
  for (let i = 0; i < 7; i++) {
    const a = (i * TAU) / 7 + rot;
    g.beginPath();
    g.arc(x + Math.cos(a) * R * 0.1, y + Math.sin(a) * R * 0.1, R * 0.025 + 0.6, 0, TAU);
    g.fill();
  }
}

function leaf(g, x, y, len, ang, wid) {
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const P = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
  const lw = Math.max(1.2, len * 0.03);
  const half = (sgn) => {
    const p = new Path2D();
    let q = P(0, 0);
    p.moveTo(q[0], q[1]);
    const c = P(len * 0.42, sgn * wid * 1.15);
    q = P(len, 0);
    p.quadraticCurveTo(c[0], c[1], q[0], q[1]);
    p.closePath();
    return p;
  };
  const whole = new Path2D();
  let q = P(0, 0);
  whole.moveTo(q[0], q[1]);
  let c = P(len * 0.42, -wid * 1.15);
  q = P(len, 0);
  whole.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  c = P(len * 0.42, wid * 1.15);
  q = P(0, 0);
  whole.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  g.save();
  g.translate(1.4, 1);
  g.fillStyle = GREEN_L;
  g.fill(half(-1));
  g.fillStyle = LEAF_L;
  g.fill(half(1));
  g.restore();
  g.lineWidth = lw;
  g.strokeStyle = NAVY;
  g.stroke(whole);
  g.beginPath();
  q = P(len * 0.08, 0);
  g.moveTo(q[0], q[1]);
  q = P(len * 0.88, 0);
  g.lineTo(q[0], q[1]);
  for (let k = 1; k <= 3; k++) {
    const u = len * (0.2 + k * 0.16);
    q = P(u, 0);
    g.moveTo(q[0], q[1]);
    q = P(u + len * 0.1, -wid * 0.55);
    g.lineTo(q[0], q[1]);
    q = P(u, 0);
    g.moveTo(q[0], q[1]);
    q = P(u + len * 0.1, wid * 0.55);
    g.lineTo(q[0], q[1]);
  }
  g.lineWidth = lw * 0.7;
  g.stroke();
}

function blossom(g, x, y, r, col, rng) {
  const lw = Math.max(1, r * 0.12);
  const rot = rng() * TAU;
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * TAU) / 5;
    const p = new Path2D();
    p.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.48, 0, TAU);
    printFill(g, p, col, lw, 0.5);
  }
  const c = new Path2D();
  c.arc(x, y, r * 0.3, 0, TAU);
  printFill(g, c, GOLD, lw, 0.5);
}

/** Cotton weave over a fabric region (inside the current clip). */
function weave(g, x, y, w, h) {
  g.fillStyle = 'rgba(20,10,10,0.07)';
  for (let yy = y; yy < y + h; yy += 3) g.fillRect(x, yy, w, 1);
  g.fillStyle = 'rgba(255,250,235,0.06)';
  for (let xx = x; xx < x + w; xx += 3) g.fillRect(xx, y, 1, h);
}

/** A printed floral fabric filling the clip region (x, y, w, h). */
function fabric(g, rng, x, y, w, h, ground, cell, colourSet) {
  g.fillStyle = ground;
  g.fillRect(x, y, w, h);
  // scattered printed dots
  g.fillStyle = 'rgba(255,240,210,0.55)';
  for (let i = 0; i < (w * h) / 900; i++) {
    g.beginPath();
    g.arc(x + rng() * w, y + rng() * h, 1.2 + rng() * 1.4, 0, TAU);
    g.fill();
  }
  const cells = [];
  const rows = Math.ceil(h / (cell * 0.78)) + 2;
  const cols = Math.ceil(w / cell) + 2;
  for (let j = -1; j < rows; j++)
    for (let i = -1; i < cols; i++) {
      cells.push({
        x: x + (i + (j & 1) * 0.5) * cell + (rng() - 0.5) * cell * 0.25,
        y: y + j * cell * 0.78 + (rng() - 0.5) * cell * 0.2,
        R: cell * (0.3 + rng() * 0.08),
        rot: rng() * TAU,
        col: colourSet[(i * 3 + j * 2 + 40) % colourSet.length],
      });
    }
  for (const c of cells) {
    const n = 4;
    const a0 = rng() * TAU;
    for (let k = 0; k < n; k++) leaf(g, c.x, c.y, c.R * (1.45 + rng() * 0.3), a0 + (k * TAU) / n + (rng() - 0.5) * 0.5, c.R * 0.36);
  }
  for (const c of cells) {
    const a = rng() * TAU;
    const d = cell * 0.5;
    blossom(g, c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, cell * 0.07, rng() < 0.5 ? WHITE : GOLD_L, rng);
  }
  for (const c of cells) peony(g, c.x, c.y, c.R, c.rot, PEONIES[c.col], rng);
  weave(g, x, y, w, h);
}

/** Gold trim along a path: navy keyline, gold band, dark-gold stitch line. */
function goldTrim(g, pathFn, wide = 9) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.beginPath();
  pathFn(g);
  g.strokeStyle = NAVY;
  g.lineWidth = wide + 4;
  g.stroke();
  g.strokeStyle = GOLD;
  g.lineWidth = wide;
  g.stroke();
  g.setLineDash([5, 4]);
  g.strokeStyle = GOLD_D;
  g.lineWidth = 1.5;
  g.stroke();
  g.setLineDash([]);
}

// =============================================================================
// temple painting motifs
// =============================================================================
/** 祥雲: lobed cloud with spiral curls, outlined navy, gold inner line. */
function cloud(g, x, y, sc, flip = 1) {
  g.save();
  g.translate(x, y);
  g.scale(sc * flip, sc);
  const lobes = [
    [-46, 6, 20],
    [-20, -8, 26],
    [12, -14, 30],
    [44, -2, 22],
    [64, 12, 14],
    [-6, 12, 22],
    [26, 12, 20],
  ];
  const body = new Path2D();
  for (const [lx, ly, r] of lobes) {
    body.moveTo(lx + r, ly);
    body.arc(lx, ly, r, 0, TAU);
  }
  // tail
  const tail = new Path2D();
  tail.moveTo(-60, 14);
  tail.bezierCurveTo(-90, 18, -110, 8, -128, 22);
  tail.bezierCurveTo(-104, 30, -82, 34, -54, 26);
  tail.closePath();
  g.lineJoin = 'round';
  g.strokeStyle = NAVY;
  g.lineWidth = 7;
  g.stroke(body);
  g.stroke(tail);
  g.fillStyle = '#e9f3ef';
  g.fill(tail);
  g.fill(body);
  // 退暈 inner band (pale teal) inside the lower lobes
  g.save();
  g.clip(body);
  g.fillStyle = '#bfe0da';
  g.fillRect(-80, 14, 170, 40);
  g.fillStyle = '#8fc8c2';
  g.fillRect(-80, 26, 170, 40);
  g.restore();
  // curls
  g.strokeStyle = NAVY;
  g.lineWidth = 2.6;
  g.lineCap = 'round';
  const curl = (cx, cy, r, dir) => {
    g.beginPath();
    for (let k = 0; k <= 26; k++) {
      const t = k / 26;
      const a = dir * t * TAU * 1.15 - Math.PI / 2;
      const rr = r * (1 - t * 0.8);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (k === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
  };
  curl(-20, -8, 16, 1);
  curl(12, -14, 19, -1);
  curl(44, -2, 13, 1);
  g.strokeStyle = GOLD_D;
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(12, -14, 25, Math.PI * 1.1, Math.PI * 1.9);
  g.stroke();
  g.restore();
}

/** A strip of temple-painting wave scallops (浪紋), period P, drawn into a canvas. */
function waveStrip(g, w, h, ext, P, base, crest, lw) {
  const r = P * 0.62;
  const cy = ext + h;
  g.fillStyle = base;
  g.fillRect(0, ext, w, h);
  g.lineCap = 'round';
  for (let x = -P; x <= w + P; x += P) {
    g.beginPath();
    g.arc(x, cy, r, Math.PI, TAU);
    g.closePath();
    g.fillStyle = crest;
    g.fill();
    g.strokeStyle = NAVY;
    g.lineWidth = lw;
    g.beginPath();
    g.arc(x, cy, r, Math.PI, TAU);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = lw * 0.75;
    for (const f of [0.72, 0.46]) {
      g.beginPath();
      g.arc(x, cy, r * f, Math.PI * 1.08, Math.PI * 1.92);
      g.stroke();
    }
  }
}

// sea bands (far -> near) and harbour bands
const SEA = [
  { y: HZ, h: 14, base: '#86c1ba', crest: '#a5d3cb', v: 4 },
  { y: HZ + 14, h: 18, base: '#6aaeaa', crest: '#8cc5be', v: 6 },
  { y: HZ + 32, h: 24, base: '#4b9497', crest: '#6cb0ad', v: 9 },
  { y: HZ + 56, h: 32, base: '#337983', crest: '#4f9a9c', v: 12 },
  { y: HZ + 88, h: 42, base: '#235f72', crest: '#3a8189', v: 16 },
  { y: HZ + 130, h: 62, base: '#1b4b63', crest: '#2c6c7c', v: 21 },
];
const HARBOUR = [
  { y: 792, h: 30, base: '#2a6f7a', crest: '#3f8f92', v: -6 },
  { y: 822, h: 38, base: '#24626f', crest: '#3a8389', v: 5 },
  { y: 860, h: 46, base: '#1d5466', crest: '#33787f', v: -4 },
  { y: 906, h: 40, base: '#184659', crest: '#2b6a77', v: 3 },
];
// period from the band height so the scallops always reach the band's top (no flat stripe)
for (const b of [...SEA, ...HARBOUR]) b.P = Math.round(b.h * 1.75);
function stripCanvas(kit, key, b) {
  const ext = Math.round(b.P * 0.62 * 0.55);
  const c = kit.bake(`${ID}_${key}_v1`, S + 2 * b.P, b.h + ext, (g, rng, w, h) =>
    waveStrip(g, w, b.h, ext, b.P, b.base, b.crest, Math.max(1.2, b.P * 0.04)),
  );
  return { c, ext };
}
function drawStrips(kit, ctx, key, bands, T) {
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    const { c, ext } = stripCanvas(kit, key + i, b);
    const off = pmod(T * b.v, b.P);
    ctx.drawImage(c, Math.round(-b.P + off), b.y - ext);
  }
}

// =============================================================================
// baked layers
// =============================================================================
const SKY_Y = 150;
const SKY_H = HZ + 20 - SKY_Y;
function paintSky(kit, g, rng) {
  g.translate(0, -SKY_Y);
  // 退暈: stepped bands from cream to pale sea-green toward the horizon
  const bands = ['#f4ead2', '#eeead4', '#e5e8d6', '#d8e4d7', '#c8ddd6', '#b6d4d2', '#a3cac9'];
  const top = 0;
  const bh = (HZ - top) / bands.length;
  for (let i = 0; i < bands.length; i++) {
    g.fillStyle = bands[i];
    g.fillRect(0, top + i * bh, S, bh + 1);
  }
  // fine band keylines (as painted)
  g.fillStyle = 'rgba(28,43,74,0.08)';
  for (let i = 1; i < bands.length; i++) g.fillRect(0, Math.round(top + i * bh), S, 1);
  // red sun with gold rim
  const sun = new Path2D();
  sun.arc(772, 330, 34, 0, TAU);
  g.lineWidth = 9;
  g.strokeStyle = NAVY;
  g.stroke(sun);
  g.lineWidth = 5;
  g.strokeStyle = GOLD;
  g.stroke(sun);
  g.fillStyle = RED;
  g.fill(sun);
  // a couple of small static clouds low in the sky
  cloud(g, 160, 395, 0.42, 1);
  cloud(g, 640, 405, 0.36, -1);
  // paper-ish grain of the painted surface
  kit.addGrain(g, S, S, rng, 0.025);
}

function tetrapod(g, x, y, s, rot) {
  const legs = [];
  for (let k = 0; k < 3; k++) {
    const a = rot + (k * TAU) / 3 - Math.PI / 2;
    legs.push([Math.cos(a) * s, Math.sin(a) * s * 0.8]);
  }
  const w = s * 0.62;
  g.lineCap = 'round';
  g.strokeStyle = NAVY;
  g.lineWidth = w + 4;
  g.beginPath();
  for (const [lx, ly] of legs) {
    g.moveTo(x, y);
    g.lineTo(x + lx, y + ly);
  }
  g.stroke();
  g.strokeStyle = STONE;
  g.lineWidth = w;
  g.stroke();
  g.strokeStyle = STONE_D;
  g.lineWidth = w * 0.4;
  g.beginPath();
  for (const [lx, ly] of legs) {
    g.moveTo(x + w * 0.12, y + w * 0.16);
    g.lineTo(x + lx + w * 0.12, y + ly + w * 0.16);
  }
  g.stroke();
  // the fourth leg pointing at the viewer
  g.beginPath();
  g.arc(x, y, w * 0.62, 0, TAU);
  g.fillStyle = '#e9e3d1';
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = NAVY;
  g.stroke();
}

const WALL_Y = 622;
function paintWall(kit, g, rng) {
  g.translate(0, -WALL_Y);
  // tetrapods behind the walkway (back rows first)
  const pods = [];
  for (let i = 0; i < 48; i++) pods.push({ x: ((i + rng() * 0.6) / 48) * (S + 60) - 30, y: 652 + rng() * 36, s: 18 + rng() * 6, r: rng() * TAU });
  pods.sort((a, b) => a.y - b.y);
  // sea and foam behind the tetrapod pile
  g.fillStyle = '#1b4b63';
  g.fillRect(0, 636, S, 56);
  g.strokeStyle = 'rgba(255,255,255,0.7)';
  g.lineWidth = 2;
  g.beginPath();
  for (let x = 6; x < S; x += 34) {
    g.moveTo(x, 650 + (x % 3) * 4);
    g.quadraticCurveTo(x + 10, 644 + (x % 3) * 4, x + 20, 650 + (x % 3) * 4);
  }
  g.stroke();
  for (const p of pods) tetrapod(g, p.x, p.y, p.s, p.r);
  // stone walkway (the road)
  g.fillStyle = '#e6d9ba';
  g.fillRect(0, 690, S, 24);
  g.fillStyle = '#d3c39f';
  g.fillRect(0, 706, S, 8);
  g.strokeStyle = NAVY;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(0, 690);
  g.lineTo(S, 690);
  g.moveTo(0, 714);
  g.lineTo(S, 714);
  g.stroke();
  g.lineWidth = 1.4;
  g.beginPath();
  for (let x = 30; x < S; x += 62) {
    g.moveTo(x, 691);
    g.lineTo(x - 4, 713);
  }
  g.stroke();
  // breakwater face: staggered stone blocks
  const tones = ['#bdb6a3', '#c9c2ae', '#b0aa97', '#c3bba5'];
  for (let row = 0; row < 3; row++) {
    const y0 = 714 + row * 26;
    const off = row % 2 ? -40 : 0;
    for (let x = off; x < S; x += 80) {
      g.fillStyle = tones[Math.floor(rng() * tones.length)];
      g.fillRect(x, y0, 80, 26);
      g.strokeStyle = NAVY;
      g.lineWidth = 1.6;
      g.strokeRect(x + 0.5, y0 + 0.5, 80, 26);
      // temple-painting edge shading: a lighter top line on every block
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(x + 2, y0 + 2, 76, 3);
    }
  }
  // wet band with algae
  g.fillStyle = '#5d6b5e';
  g.fillRect(0, 788, S, 8);
  g.fillStyle = '#3f7a4b';
  for (let i = 0; i < 60; i++) {
    g.beginPath();
    g.arc(rng() * S, 790 + rng() * 6, 2 + rng() * 3, 0, TAU);
    g.fill();
  }
  // bollards on the quay edge
  for (const bx of BOLLARDS) {
    g.fillStyle = '#2d3a55';
    g.strokeStyle = NAVY;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(bx - 7, 712);
    g.lineTo(bx - 6, 698);
    g.quadraticCurveTo(bx - 12, 694, bx - 9, 690);
    g.lineTo(bx + 9, 690);
    g.quadraticCurveTo(bx + 12, 694, bx + 6, 698);
    g.lineTo(bx + 7, 712);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = GOLD;
    g.fillRect(bx - 8, 689, 16, 3);
  }
}
const BOLLARDS = [180, 560, 880];

function paintValance(kit, g, rng) {
  const swag = 125;
  const shape = new Path2D();
  shape.moveTo(-10, -10);
  shape.lineTo(S + 10, -10);
  shape.lineTo(S + 10, 168);
  for (let x = S; x > 0; x -= swag) shape.quadraticCurveTo(x - swag / 2, 168 + 46, x - swag, 168);
  shape.lineTo(-10, 168);
  shape.closePath();
  g.save();
  g.clip(shape);
  fabric(g, rng, 0, 0, S, 215, RED, 150, [0, 1, 2, 3, 1]);
  // gathered folds: darker arcs following each swag
  g.strokeStyle = 'rgba(80,0,10,0.18)';
  g.lineWidth = 7;
  for (let x = 0; x < S; x += swag) {
    for (const d of [10, 28]) {
      g.beginPath();
      g.moveTo(x + 6, 150 - d);
      g.quadraticCurveTo(x + swag / 2, 168 + 40 - d * 1.2, x + swag - 6, 150 - d);
      g.stroke();
    }
  }
  g.restore();
  goldTrim(g, (c) => {
    c.moveTo(0, 168);
    for (let x = 0; x < S; x += swag) c.quadraticCurveTo(x + swag / 2, 168 + 46, x + swag, 168);
  }, 9);
  // top gold band with a key-fret (回紋) pattern
  g.fillStyle = NAVY;
  g.fillRect(0, 26, S, 22);
  g.fillStyle = GOLD;
  g.fillRect(0, 28, S, 18);
  g.strokeStyle = GOLD_D;
  g.lineWidth = 2;
  g.beginPath();
  for (let x = 0; x < S; x += 20) {
    g.moveTo(x + 2, 42);
    g.lineTo(x + 2, 32);
    g.lineTo(x + 14, 32);
    g.lineTo(x + 14, 40);
    g.lineTo(x + 7, 40);
    g.lineTo(x + 7, 36);
  }
  g.stroke();
  // tassels at the swag joints
  for (let x = swag; x < S; x += swag) {
    g.strokeStyle = GOLD_D;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(x, 170);
    g.lineTo(x, 186);
    g.stroke();
    g.fillStyle = GOLD;
    g.strokeStyle = NAVY;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, 190, 6, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = RED;
    g.beginPath();
    g.moveTo(x - 4, 195);
    g.lineTo(x + 4, 195);
    g.lineTo(x + 8, 222);
    g.lineTo(x - 8, 222);
    g.closePath();
    g.fill();
    g.stroke();
    g.strokeStyle = RED_D;
    g.lineWidth = 1;
    g.beginPath();
    for (let k = -2; k <= 2; k++) {
      g.moveTo(x + k * 1.6, 198);
      g.lineTo(x + k * 3, 220);
    }
    g.stroke();
  }
  // 匾額 (plaque) in the middle: navy ground, gold frame, gold characters
  const px = 372;
  const py = 58;
  const pw = 256;
  const ph = 74;
  g.fillStyle = NAVY;
  g.fillRect(px - 8, py - 8, pw + 16, ph + 16);
  g.fillStyle = GOLD;
  g.fillRect(px - 5, py - 5, pw + 10, ph + 10);
  g.fillStyle = GOLD_D;
  g.fillRect(px - 1, py - 1, pw + 2, ph + 2);
  g.fillStyle = '#1e3a5c';
  g.fillRect(px + 2, py + 2, pw - 4, ph - 4);
  g.strokeStyle = GOLD;
  g.lineWidth = 1.5;
  g.strokeRect(px + 7, py + 7, pw - 14, ph - 14);
  // corner brackets
  g.fillStyle = GOLD;
  for (const [cx, cy, sx, sy] of [
    [px - 8, py - 8, 1, 1],
    [px + pw + 8, py - 8, -1, 1],
    [px - 8, py + ph + 8, 1, -1],
    [px + pw + 8, py + ph + 8, -1, -1],
  ]) {
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + sx * 26, cy);
    g.quadraticCurveTo(cx + sx * 10, cy + sy * 10, cx, cy + sy * 26);
    g.closePath();
    g.fill();
    g.strokeStyle = NAVY;
    g.lineWidth = 1.5;
    g.stroke();
  }
  g.font = `700 46px ${kit.FONT.kai}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.strokeStyle = '#0f1a2e';
  g.lineWidth = 4;
  const txt = '風調雨順';
  const step = 56;
  for (let i = 0; i < 4; i++) {
    const tx = px + pw / 2 + (i - 1.5) * step;
    g.strokeText(txt[i], tx, py + ph / 2 + 2);
    g.fillStyle = GOLD;
    g.fillText(txt[i], tx, py + ph / 2 + 2);
  }
}

const CURT = { w: 170, h: 400, top: 120 };
function curtainShape() {
  const p = new Path2D();
  p.moveTo(-10, 0);
  p.lineTo(150, 0);
  p.bezierCurveTo(140, 130, 62, 220, 66, 285);
  p.bezierCurveTo(70, 322, 120, 348, 106, 372);
  p.quadraticCurveTo(50, 384, -10, 378);
  p.closePath();
  return p;
}
function paintCurtain(kit, g, rng) {
  const shape = curtainShape();
  g.save();
  g.clip(shape);
  fabric(g, rng, 0, 0, CURT.w, CURT.h, GREEN, 120, [0, 2, 1, 0, 3]);
  // folds converging on the tie
  g.fillStyle = 'rgba(0,30,15,0.2)';
  for (const fx of [20, 62, 104, 140]) {
    g.beginPath();
    g.moveTo(fx - 7, 0);
    g.lineTo(fx + 7, 0);
    g.lineTo(fx * 0.45 + 4, 285);
    g.lineTo(fx * 0.45 - 2, 285);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(fx * 0.45 - 2, 290);
    g.lineTo(fx * 0.45 + 4, 290);
    g.lineTo(fx * 0.7 + 8, 380);
    g.lineTo(fx * 0.7 - 6, 380);
    g.closePath();
    g.fill();
  }
  g.restore();
  goldTrim(g, (c) => {
    c.moveTo(150, 0);
    c.bezierCurveTo(140, 130, 62, 220, 66, 285);
    c.bezierCurveTo(70, 322, 120, 348, 106, 372);
    c.quadraticCurveTo(50, 384, -10, 378);
  }, 8);
  // gold cord tie with a tassel
  g.lineCap = 'round';
  g.strokeStyle = NAVY;
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(-10, 282);
  g.quadraticCurveTo(35, 296, 74, 284);
  g.stroke();
  g.strokeStyle = GOLD;
  g.lineWidth = 8;
  g.stroke();
  g.strokeStyle = GOLD_D;
  g.lineWidth = 1.5;
  g.setLineDash([4, 4]);
  g.stroke();
  g.setLineDash([]);
}

/** The curtain tie's tassel (drawn live so it swings); (x, y) = the knot. */
function drawTassel(ctx, x, y, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.lineJoin = 'round';
  ctx.fillStyle = RED;
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, 7);
  ctx.lineTo(5, 7);
  ctx.lineTo(11, 46);
  ctx.lineTo(-11, 46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = RED_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = -2; k <= 2; k++) {
    ctx.moveTo(k * 1.5, 10);
    ctx.lineTo(k * 3.5, 44);
  }
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function paintHem(kit, g, rng) {
  g.save();
  g.beginPath();
  g.rect(0, 0, S, 90);
  g.clip();
  fabric(g, rng, 0, 0, S, 90, RED, 100, [1, 0, 3, 2]);
  g.restore();
  // twisted gold rope along the top edge
  g.fillStyle = NAVY;
  g.fillRect(0, 0, S, 14);
  g.fillStyle = GOLD;
  g.fillRect(0, 2, S, 10);
  g.strokeStyle = GOLD_D;
  g.lineWidth = 2;
  g.beginPath();
  for (let x = -10; x < S + 10; x += 8) {
    g.moveTo(x, 11);
    g.lineTo(x + 7, 3);
  }
  g.stroke();
}

/** The easel field: the same fabric everywhere outside the design square, then a gold border. */
function paintMargin(kit, g, rng, w, h, L) {
  fabric(g, rng, 0, 0, w, h, RED, 190, [0, 1, 2, 3, 1, 0]);
  const x = L.x;
  const y = L.y;
  const s = 1000 * L.s;
  g.fillStyle = NAVY;
  g.fillRect(x - 18, y - 18, s + 36, s + 36);
  g.fillStyle = GOLD;
  g.fillRect(x - 14, y - 14, s + 28, s + 28);
  g.strokeStyle = GOLD_D;
  g.lineWidth = 2;
  g.strokeRect(x - 8, y - 8, s + 16, s + 16);
  g.fillStyle = NAVY;
  g.fillRect(x - 3, y - 3, s + 6, s + 6);
}

/** Ribbon sprite (festival banner with swallowtail ends and gold edges). */
// sits below the valance tassels (they hang to y 222) and right of the demo rotors
const RIB = { x: 510, y: 214, w: 340, h: 84 };
function paintRibbon(kit, g) {
  const w = RIB.w;
  const mid = 42;
  const top = (x) => mid - 22 + Math.sin((x / w) * TAU * 1.0) * 5;
  const band = new Path2D();
  band.moveTo(14, top(14));
  for (let x = 14; x <= w - 14; x += 8) band.lineTo(x, top(x));
  band.lineTo(w - 2, top(w - 14) + 4);
  band.lineTo(w - 22, top(w - 14) + 22);
  band.lineTo(w - 2, top(w - 14) + 40);
  for (let x = w - 14; x >= 14; x -= 8) band.lineTo(x, top(x) + 44);
  band.lineTo(2, top(14) + 40);
  band.lineTo(22, top(14) + 22);
  band.lineTo(2, top(14) + 4);
  band.closePath();
  g.lineJoin = 'round';
  g.strokeStyle = NAVY;
  g.lineWidth = 8;
  g.stroke(band);
  g.strokeStyle = GOLD;
  g.lineWidth = 4;
  g.stroke(band);
  g.fillStyle = RED;
  g.fill(band);
  // fold shading
  g.save();
  g.clip(band);
  g.fillStyle = 'rgba(90,0,10,0.25)';
  for (const fx of [0.25, 0.75]) {
    g.beginPath();
    g.ellipse(w * fx, mid, 26, 40, 0, 0, TAU);
    g.fill();
  }
  // gold edge lines inside
  g.strokeStyle = GOLD;
  g.lineWidth = 2;
  g.beginPath();
  for (let x = 14; x <= w - 14; x += 8) (x === 14 ? g.moveTo(x, top(x) + 6) : g.lineTo(x, top(x) + 6));
  g.moveTo(14, top(14) + 38);
  for (let x = 14; x <= w - 14; x += 8) g.lineTo(x, top(x) + 38);
  g.stroke();
  g.restore();
  g.font = `700 28px ${kit.FONT.serif}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.strokeStyle = NAVY;
  g.lineWidth = 5;
  g.strokeText('22 部風機 · 128 MW', w / 2, mid + 1);
  g.fillStyle = GOLD;
  g.fillText('22 部風機 · 128 MW', w / 2, mid + 1);
}

function cloudSprite(kit, key, sc, flip) {
  return kit.bake(`${ID}_cloud_${key}_v1`, Math.ceil(280 * sc), Math.ceil(150 * sc), (g, rng, w, h) => cloud(g, w * 0.52, h * 0.55, sc, flip));
}

// =============================================================================
// turbines
// =============================================================================
const PXM = 1.65; // px per metre at scale 1
const DEMO = [
  { x: 285, s: 1.05, a0: 0.3, w: 1.25 },
  { x: 440, s: 0.82, a0: 1.4, w: 1.2 },
];
// visible part of the phase-2 row (20 x 6 MW) along the horizon, far row then near row
const ROW = [];
{
  const far = [150, 245, 520, 600, 690, 790, 860];
  const near = [205, 330, 560, 650, 745, 835];
  far.forEach((x, i) => ROW.push({ x, s: 0.27 + 0.01 * (i % 3), a0: i * 1.7, w: 1.05 + 0.05 * (i % 3), far: true }));
  near.forEach((x, i) => ROW.push({ x, s: 0.4 - 0.006 * i, a0: i * 2.3 + 0.5, w: 1.0 + 0.06 * (i % 2), far: false }));
  // pop order: left -> right across both rows
  const order = ROW.map((t, i) => i).sort((a, b) => ROW[a].x - ROW[b].x);
  order.forEach((idx, k) => {
    ROW[idx].k = k;
  });
}
const baseY = (s) => HZ + 34 * s;
const ROWS = [...ROW.filter((t) => t.far), ...ROW.filter((t) => !t.far)]; // draw order: far row first
const ROWS_Y = 360;
const ROWS_H = 120;

function drawTurbine(ctx, x, s, ang, grow, demo, parts = 3) {
  if (grow <= 0.001) return;
  const hub = (demo ? 90 : 110) * PXM;
  const R = (demo ? 60 : 77) * PXM;
  const by = baseY(s);
  const k = s * grow;
  const lw = Math.max(0.9, 3 * s) / s;
  ctx.save();
  ctx.translate(x, by);
  ctx.scale(k, k);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = lw;
  if (parts & 1) towerPart(ctx, hub);
  if (parts & 2) {
    ctx.beginPath();
    rotorInto(ctx, 0, 0, 1, ang, hub, R);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** Transition piece, tower and nacelle in turbine-local px (scale 1, base at 0). */
function towerPart(ctx, hub) {
  // yellow transition piece on the monopile, with its platform
  const tpH = 20;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.rect(-5.5, -tpH, 11, tpH + 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.fillRect(-10, -tpH - 2, 20, 3);
  // tower (white, cool shade on the right third)
  const tb = 4.6;
  const tt = 2.6;
  const top = -hub + 4;
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.moveTo(-tb, -tpH - 1);
  ctx.lineTo(-tt, top);
  ctx.lineTo(tt, top);
  ctx.lineTo(tb, -tpH - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9d6e0';
  ctx.beginPath();
  ctx.moveTo(tb * 0.25, -tpH - 1);
  ctx.lineTo(tt * 0.25, top);
  ctx.lineTo(tt, top);
  ctx.lineTo(tb, -tpH - 1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-tb, -tpH - 1);
  ctx.lineTo(-tt, top);
  ctx.lineTo(tt, top);
  ctx.lineTo(tb, -tpH - 1);
  ctx.stroke();
  // nacelle (seen a little from the side, behind the hub)
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.moveTo(-3, -hub - 6);
  ctx.lineTo(19, -hub - 5);
  ctx.quadraticCurveTo(22, -hub, 19, -hub + 6);
  ctx.lineTo(-3, -hub + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9d6e0';
  ctx.fillRect(-2, -hub + 2, 20, 3.4);
}

/** Add a rotor (three blades + spinner) to the current path: origin (ox, oy), scale k. */
function rotorInto(ctx, ox, oy, k, ang, hub, R) {
  for (let b = 0; b < 3; b++) {
    const a = ang + (b * TAU) / 3;
    const ca = Math.cos(a) * k;
    const sa = Math.sin(a) * k;
    const hy = oy - hub * k;
    const P = (u, v) => [ox + ca * u - sa * v, hy + sa * u + ca * v];
    let q = P(3, -2.8);
    ctx.moveTo(q[0], q[1]);
    q = P(R * 0.24, -5.6);
    ctx.lineTo(q[0], q[1]);
    const c = P(R * 0.7, -3.6);
    q = P(R, -0.9);
    ctx.quadraticCurveTo(c[0], c[1], q[0], q[1]);
    q = P(R, 0.6);
    ctx.lineTo(q[0], q[1]);
    q = P(R * 0.3, 3.2);
    ctx.lineTo(q[0], q[1]);
    q = P(3, 2.8);
    ctx.lineTo(q[0], q[1]);
    ctx.closePath();
  }
  ctx.moveTo(ox + 5.4 * k, oy - hub * k);
  ctx.arc(ox, oy - hub * k, 5.4 * k, 0, TAU);
}

/** Timing of the phase-2 pop-up for turbine k (0..ROW.length-1). */
function popTimes(b, k) {
  const t0 = 2 * b + (k / ROW.length) * 0.85 * b;
  return { t0, t1: t0 + 0.24 * b };
}

// =============================================================================
// fishing boats
// =============================================================================
const PENNANTS = [RED, GOLD, GREEN, '#3b62b0', WHITE];
/** Boat hull, wheelhouse, masts and fenders in local coords (waterline centre, bow at +x). */
function boatBody(ctx, L, o) {
  const lw = Math.max(1.2, L * 0.009);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = lw;
  const hull = new Path2D();
  hull.moveTo(-0.5 * L, -0.17 * L);
  hull.quadraticCurveTo(0.15 * L, -0.155 * L, 0.5 * L, -0.27 * L);
  hull.lineTo(0.42 * L, 0.02 * L);
  hull.lineTo(-0.46 * L, 0.02 * L);
  hull.closePath();
  // wheelhouse (behind the bulwark line)
  const wx0 = -0.32 * L;
  const wx1 = -0.03 * L;
  ctx.fillStyle = WHITE;
  ctx.fillRect(wx0, -0.34 * L, wx1 - wx0, 0.2 * L);
  ctx.strokeRect(wx0, -0.34 * L, wx1 - wx0, 0.2 * L);
  ctx.fillStyle = o.roof || '#3b62b0';
  ctx.fillRect(wx0 - 0.02 * L, -0.37 * L, wx1 - wx0 + 0.04 * L, 0.035 * L);
  ctx.strokeRect(wx0 - 0.02 * L, -0.37 * L, wx1 - wx0 + 0.04 * L, 0.035 * L);
  ctx.fillStyle = NAVY;
  for (let i = 0; i < 3; i++) ctx.fillRect(wx0 + 0.03 * L + i * 0.085 * L, -0.31 * L, 0.06 * L, 0.05 * L);
  // masts
  const m = boatMasts(L, o.mast);
  ctx.beginPath();
  ctx.moveTo(m.mx, -0.17 * L);
  ctx.lineTo(m.mx, m.mTop);
  ctx.moveTo(m.mx - 0.06 * L, m.mTop + 0.08 * L);
  ctx.lineTo(m.mx + 0.06 * L, m.mTop + 0.08 * L);
  ctx.moveTo(m.sx, -0.17 * L);
  ctx.lineTo(m.sx, m.sTop);
  ctx.lineWidth = lw * 1.3;
  ctx.stroke();
  // hull: white topsides, coloured sheer band, red boot-top
  ctx.fillStyle = o.hull || WHITE;
  ctx.fill(hull);
  ctx.save();
  ctx.clip(hull);
  ctx.fillStyle = o.band || '#3b62b0';
  ctx.beginPath();
  ctx.moveTo(-0.52 * L, -0.17 * L);
  ctx.quadraticCurveTo(0.15 * L, -0.155 * L, 0.52 * L, -0.27 * L);
  ctx.lineTo(0.52 * L, -0.22 * L);
  ctx.quadraticCurveTo(0.15 * L, -0.11 * L, -0.52 * L, -0.13 * L);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = RED;
  ctx.fillRect(-0.55 * L, -0.03 * L, 1.1 * L, 0.06 * L);
  ctx.restore();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = lw;
  ctx.stroke(hull);
  // tyre fenders
  if (!o.small) {
    const tyre = new Path2D();
    const hole = new Path2D();
    const fy = -0.1 * L;
    for (let i = 0; i < 4; i++) {
      const fx = -0.36 * L + i * 0.2 * L;
      tyre.moveTo(fx + 0.032 * L, fy);
      tyre.arc(fx, fy, 0.032 * L, 0, TAU);
      hole.moveTo(fx + 0.016 * L, fy);
      hole.arc(fx, fy, 0.016 * L, 0, TAU);
    }
    ctx.fillStyle = '#26272b';
    ctx.fill(tyre);
    ctx.stroke(tyre);
    ctx.strokeStyle = '#6b6e75';
    ctx.lineWidth = lw * 0.7;
    ctx.stroke(hole);
  }
  // water line ripple
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = lw * 0.9;
  ctx.beginPath();
  ctx.moveTo(-0.5 * L, 0.035 * L);
  ctx.quadraticCurveTo(0, 0.06 * L, 0.46 * L, 0.035 * L);
  ctx.stroke();
}
// mastK: masthead height as a fraction of the hull length (the near moored boat uses a shorter
// mast so its top and pennants stay below the walkway at y 700, clear of the rider)
const boatMasts = (L, mastK = 0.68) => ({ mx: 0.1 * L, mTop: -mastK * L, sx: -0.42 * L, sTop: -0.46 * L });

/** Pennant strings (masthead -> bow, masthead -> stern mast), fluttering. */
function pennants(ctx, L, T, seed, small, mastK) {
  const lw = Math.max(1.2, L * 0.009);
  const m = boatMasts(L, mastK);
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = lw * 0.6;
  ctx.lineJoin = 'round';
  const tri = PENNANTS.map(() => new Path2D());
  const all = new Path2D();
  const string = (x0, y0, x1, y1, n, ph) => {
    all.moveTo(x0, y0);
    all.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 0.03 * L, x1, y1);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const px = lerp(x0, x1, t);
      const py = lerp(y0, y1, t) + 0.03 * L * 4 * t * (1 - t);
      const fl = Math.sin(T * 7 + i * 1.3 + ph) * 0.012 * L;
      for (const pa of [tri[(i + ph) % PENNANTS.length], all]) {
        pa.moveTo(px - 0.018 * L, py);
        pa.lineTo(px + 0.018 * L, py);
        pa.lineTo(px + fl, py + 0.05 * L);
        pa.closePath();
      }
    }
  };
  string(m.mx, m.mTop, 0.5 * L, -0.27 * L, small ? 4 : 7, seed);
  string(m.mx, m.mTop, m.sx, m.sTop, small ? 3 : 5, seed + 2);
  for (let c = 0; c < PENNANTS.length; c++) {
    ctx.fillStyle = PENNANTS[c];
    ctx.fill(tri[c]);
  }
  ctx.stroke(all);
}

const boatBob = (T, L, seed) => Math.sin(T * 1.7 + seed * 2.1) * L * 0.012;
/** A fishing boat: baked body blitted at whole pixels (bobbing), live pennants. */
function drawBoat(kit, ctx, x, y, L, dir, T, seed, o = {}) {
  const w = Math.ceil(1.16 * L);
  const oy = Math.ceil(0.76 * L);
  const h = oy + Math.ceil(0.08 * L);
  const spr = kit.bake(`${ID}_boat_${seed}_${dir}_${o.mast || 0}_v2`, w, h, (g) => {
    g.translate(w / 2, oy);
    g.scale(dir, 1);
    boatBody(g, L, o);
  });
  const bx = Math.round(x);
  const by = Math.round(y + boatBob(T, L, seed));
  ctx.drawImage(spr, bx - Math.round(w / 2), by - oy);
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(dir, 1);
  pennants(ctx, L, T, seed, o.small, o.mast);
  ctx.restore();
}

// =============================================================================
// render
// =============================================================================
const riderStyle = (p) => ({
  outline: NAVY,
  outlineWidth: 2.6,
  shading: false,
  plumage: '#fbf3e3',
  plumageShade: '#efd9c4',
  mask: '#1b1a19',
  bill: '#1b1a19',
  crest: GOLD,
  breast: GOLD,
  eyeRing: GOLD,
  frame: RED,
  frameShade: RED_D,
  metal: NAVY,
  tire: NAVY,
  rim: GOLD,
  saddle: GREEN,
  legs: '#2a2522',
  prop: { type: p.prop.type, colors: p.prop.colors || [GREEN, GOLD] },
});

function drawSparkle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

export function render(kit, ctx, p) {
  const thumb = !!p.isThumbnail;
  const b = p.beat.barSec;
  const T = thumb ? 3.5 * b : p.rawLocalT;
  const L = kit.layout(p);
  const wide = !(L.x === 0 && L.y === 0 && L.s === 1);
  ctx.save();
  if (wide) {
    ctx.drawImage(kit.bake(`${ID}_margin_v1_${p.stage}`, p.W, p.H, (g, rng, w, h) => paintMargin(kit, g, rng, w, h, L)), 0, 0);
    ctx.translate(L.x, L.y);
    ctx.scale(L.s, L.s);
    ctx.beginPath();
    ctx.rect(0, 0, S, S);
    ctx.clip();
  }

  // ---- back: sky, sun, clouds, far sea -------------------------------------------------
  ctx.drawImage(kit.bake(`${ID}_sky_v2`, S, SKY_H, (g, rng) => paintSky(kit, g, rng)), 0, SKY_Y);
  const cs = cloudSprite(kit, 'small', 0.5, 1);
  for (let i = 0; i < 2; i++) {
    const cx = pmod(T * (9 + i * 4) + i * 520 + 200, 1300) - 150;
    ctx.drawImage(cs, Math.round(cx - cs.width / 2), Math.round(268 + i * 52 - cs.height / 2));
  }
  drawStrips(kit, ctx, 'sea', SEA, T);

  // ---- mid: the wind farm -------------------------------------------------------------
  const lastT1 = popTimes(b, ROW.length - 1).t1;
  const rotors = [];
  if (T >= lastT1) {
    // all up: the towers are one baked strip, the rotors one path
    ctx.drawImage(kit.bake(`${ID}_rowtowers_v1`, S, ROWS_H, (g) => {
      g.translate(0, -ROWS_Y);
      for (const t of ROWS) drawTurbine(g, t.x, t.s, 0, 1, false, 1);
    }), 0, ROWS_Y);
    for (const t of ROWS) rotors.push([t, 1]);
  } else {
    for (const t of ROWS) {
      const { t0, t1 } = popTimes(b, t.k);
      const grow = easeOutBack(clamp01((T - t0) / (t1 - t0)));
      if (grow <= 0.001) continue;
      drawTurbine(ctx, t.x, t.s, 0, grow, false, 1);
      rotors.push([t, grow]);
    }
  }
  if (rotors.length) {
    ctx.beginPath();
    for (const [t, grow] of rotors) {
      const { t1 } = popTimes(b, t.k);
      const ang = t.a0 + t.w * intSmooth(T, t1, t1 + 0.4 * b);
      rotorInto(ctx, t.x, baseY(t.s), t.s * grow, ang, 110 * PXM, 77 * PXM);
    }
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  for (let i = DEMO.length - 1; i >= 0; i--) {
    const d = DEMO[i];
    drawTurbine(ctx, d.x, d.s, d.a0 + d.w * T, 1, true);
  }

  // ---- story beat: the ribbon unfurls out of a cloud, sparkles on the landing ---------------
  const big = cloudSprite(kit, 'big', 0.9, 1);
  const anchor = cloudSprite(kit, 'anchor', 0.62, -1);
  const bob = thumb ? 0 : Math.sin(T * 1.3) * 3;
  ctx.drawImage(big, Math.round(845 - big.width / 2), Math.round(232 - big.height / 2 + bob));
  const un = thumb ? 1 : ss(2 * b, 2.6 * b, T);
  if (un > 0) {
    const rib = kit.bake(`${ID}_ribbon_v1`, RIB.w, RIB.h, (g) => paintRibbon(kit, g));
    const wave = thumb ? 0 : Math.sin(T * 2.2) * 2.5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(RIB.x, RIB.y - 10, RIB.w * un + 2, RIB.h + 20);
    ctx.clip();
    ctx.drawImage(rib, RIB.x, Math.round(RIB.y + wave));
    ctx.restore();
    // sparkles on the landing beat
    const sp = thumb ? 0 : ss(2.55 * b, 2.65 * b, T) * (1 - ss(2.7 * b, 3.4 * b, T));
    if (sp > 0.01) {
      ctx.fillStyle = GOLD;
      ctx.strokeStyle = NAVY;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + kit.hash11(i + 7) * 0.5;
        const d = 60 + (1 - sp) * 90 + kit.hash11(i + 31) * 50;
        const sx = RIB.x + RIB.w / 2 + Math.cos(a) * d * 1.9;
        const sy = RIB.y + 42 + Math.sin(a) * d * 0.7;
        drawSparkle(ctx, sx, sy, (6 + kit.hash11(i) * 7) * sp);
      }
    }
  }
  ctx.drawImage(anchor, Math.round(RIB.x - 2 - anchor.width / 2), Math.round(RIB.y + 44 - anchor.height / 2 - bob * 0.6));

  // a fishing boat heading out to sea, with its wake
  {
    const bL = 100;
    const bx = pmod(140 + T * 34, 1260) - 130;
    const by = 556;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - 0.5 * bL, by + 2);
    ctx.lineTo(bx - 1.25 * bL, by - 5);
    ctx.moveTo(bx - 0.5 * bL, by + 4);
    ctx.lineTo(bx - 1.25 * bL, by + 12);
    ctx.stroke();
    drawBoat(kit, ctx, bx, by, bL, 1, T, 3, { small: true, band: GREEN, roof: RED });
  }

  // ---- breakwater, harbour, rider ------------------------------------------------------
  ctx.drawImage(kit.bake(`${ID}_wall_v3`, S, 800 - WALL_Y, (g, rng) => paintWall(kit, g, rng)), 0, WALL_Y);
  drawStrips(kit, ctx, 'harbour', HARBOUR, T);

  if (p.actor && p.actor.visible) {
    const rx = p.riderLocalX ?? -1e4;
    ctx.fillStyle = 'rgba(28,43,74,0.22)';
    ctx.beginPath();
    ctx.ellipse(rx, 704, 74, 5, 0, 0, TAU);
    ctx.fill();
    p.actor.draw(ctx, p.actor.rig(), riderStyle(p));
  }

  // ---- fore: moored boats on their lines -----------------------------------------------
  const moored = [
    { x: 640, y: 880, L: 330, dir: -1, seed: 1, bollard: 560, o: { mast: 0.56 } },
    { x: 215, y: 898, L: 270, dir: 1, seed: 4, bollard: 180, o: { hull: '#dff0ea', band: GREEN, roof: RED } },
  ];
  for (const m of moored) {
    const bob = Math.round(boatBob(T, m.L, m.seed));
    const bowX = m.x + m.dir * 0.47 * m.L;
    const bowY = m.y + bob - 0.24 * m.L;
    ctx.strokeStyle = '#6b4a2b';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(m.bollard, 696);
    ctx.quadraticCurveTo((m.bollard + bowX) / 2, Math.max(696, bowY) + 26, bowX, bowY);
    ctx.stroke();
    drawBoat(kit, ctx, m.x, m.y, m.L, m.dir, T, m.seed, m.o);
  }
  ctx.drawImage(kit.bake(`${ID}_hem_v1`, S, 90, (g, rng) => paintHem(kit, g, rng)), 0, 920);

  // ---- fabric frame: valance and swaying curtains --------------------------------------
  const curt = kit.bake(`${ID}_curtain_v2`, CURT.w, CURT.h, (g, rng) => paintCurtain(kit, g, rng));
  ctx.drawImage(curt, 0, CURT.top);
  ctx.save();
  ctx.translate(S, CURT.top);
  ctx.scale(-1, 1);
  ctx.drawImage(curt, 0, 0);
  ctx.restore();
  for (const side of [-1, 1]) {
    const sw = thumb ? 0 : Math.sin(T * 1.9 + (side > 0 ? 1.3 : 0)) * 0.16;
    drawTassel(ctx, side < 0 ? 76 : S - 76, CURT.top + 290, sw);
  }
  ctx.drawImage(kit.bake(`${ID}_valance_v1`, S, 230, (g, rng) => paintValance(kit, g, rng)), 0, 0);
  ctx.restore();
}
