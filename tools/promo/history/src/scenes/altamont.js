// src/scenes/california.js
// #15 1980s · 加州風潮 — the California wind rush (Altamont Pass, Tehachapi, San Gorgonio),
// painted as a 1980s synthwave / VHS tape: sunset gradient with a banded sun, golden-brown
// rolling passes rim-lit in neon, a magenta perspective grid, scanlines, baked chromatic
// aberration and a drifting VHS tracking-noise band.
//
// Machines (historically): thousands of SMALL turbines (≈50–100 kW, 15–20 m rotors) in
// ROWS along the ridgelines — mostly upwind three-bladed rotors on open steel LATTICE
// towers, some on tubular towers, plus vertical-axis Darrieus "eggbeaters" held up by guy
// wires. They turn at a fixed speed (≈45–70 rpm) with no synchronisation between machines;
// a few always stand idle (availability was a real problem in the early farms).
//
// Story (4 bars): bar 1–2 the rider glides past the hero turbine silhouetted against the
// sun; bar 3 downbeat the tape loses tracking — the picture tears sideways for half a beat —
// and when it snaps back the rider's mini rotor has become a neon star; the OSD says
// TRACKING while the meter refills; once tracking is restored (bar 4) the star is the
// three-bladed mini rotor again, so the rider leaves the panel on-model.
// Setting: Altamont is treeless grazing land — wooden pole line and cattle, no palms.

const P = 1000;
const ROAD_Y = 700;
const FLOOR_Y = 612; // where the hills sit on the neon grid floor
const VP = { x: 520, y: 404 }; // grid vanishing point (on the far horizon, behind the hills)

const C = {
  night: '#1a0f2e',
  deep: '#120a22',
  violet: '#6f3cc3',
  magenta: '#ff4f9a',
  pink: '#ff8fc5',
  cyan: '#25d0ff',
  cyanLight: '#9ef0ff',
  orange: '#ffb347',
  yellow: '#ffe66b',
  white: '#fff4fb',
  ink: '#1b0f2c',
};

const GLITCH_T0 = 4.0; // bar 3, beat 1
const GLITCH_T1 = 4.25; // half a beat
const STAR_T = 4.18;
const STAR_END = 5.8; // tracking restored (the TRACKING meter fades out at 5.6–5.8)

let K = null;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const fract = (x) => x - Math.floor(x);

// -----------------------------------------------------------------------------
// terrain
// -----------------------------------------------------------------------------
const far2Y = (x) => 382 - 12 * Math.sin(x * 0.0085 + 0.4) - 7 * Math.sin(x * 0.021 + 1.7);
const far1Y = (x) => 412 - 16 * Math.sin(x * 0.0068 + 2.1) - 8 * Math.sin(x * 0.019 + 0.3);
const midY = (x) => 478 - 24 * Math.sin(x * 0.0058 + 0.9) - 11 * Math.sin(x * 0.016 + 2.6);
const nearY = (x) => 556 - 22 * Math.sin(x * 0.0052 + 3.3) - 9 * Math.sin(x * 0.014 + 0.8);

// -----------------------------------------------------------------------------
// turbine catalogue (static layout; deterministic)
// -----------------------------------------------------------------------------
const ROWS = [];
function buildRows() {
  if (ROWS.length) return;
  // far row 2 (most distant, smallest)
  for (let x = 44, i = 0; x < 990; x += 25, i++) {
    ROWS.push({ row: 'far2', x: x + 4 * Math.sin(i * 1.7), base: far2Y(x) + 2, h: 15, R: 5, kind: 'lattice', i });
  }
  // far row 1
  for (let x = 30, i = 0; x < 990; x += 33, i++) {
    ROWS.push({ row: 'far1', x: x + 5 * Math.sin(i * 2.3), base: far1Y(x) + 2, h: 26, R: 8.5, kind: i % 9 === 4 ? 'darrieus' : 'lattice', i });
  }
  // mid row (golden ridge)
  const midXs = [52, 126, 198, 268, 410, 478, 548, 690, 760, 830, 902];
  midXs.forEach((x, i) => {
    const kind = i === 3 || i === 8 ? 'darrieus' : i === 5 ? 'tube' : 'lattice';
    ROWS.push({ row: 'mid', x, base: midY(x) + 3, h: kind === 'darrieus' ? 62 : 74, R: 21, kind, i });
  });
}

const NEAR = [
  { kind: 'lattice', x: 196, h: 196, R: 54, yaw: 0.86, seed: 1 },
  { kind: 'darrieus', x: 346, h: 214, R: 44, seed: 2 },
  { kind: 'lattice', x: 612, h: 222, R: 60, yaw: 0.95, seed: 3 },
  { kind: 'tube', x: 846, h: 188, R: 52, yaw: 0.8, seed: 4 },
];
for (const n of NEAR) n.base = nearY(n.x) + 6;

function rotorSpeed(seed) {
  // ≈45–70 rpm, a few machines idle
  const h = K.hash11(seed * 13.37);
  if (h < 0.07) return 0;
  return (0.75 + 0.42 * K.hash11(seed * 7.1)) * Math.PI * 2;
}

// -----------------------------------------------------------------------------
// background bake
// -----------------------------------------------------------------------------
function paintSky(g, rng) {
  const sky = g.createLinearGradient(0, 0, 0, 430);
  sky.addColorStop(0, '#120a26');
  sky.addColorStop(0.3, '#2d1652');
  sky.addColorStop(0.55, '#6a2a86');
  sky.addColorStop(0.75, '#c43b8e');
  sky.addColorStop(0.88, '#ff5f8a');
  sky.addColorStop(1, '#ffab5c');
  g.fillStyle = sky;
  g.fillRect(0, 0, P, 640);
  // stars in the dark upper sky
  for (let i = 0; i < 140; i++) {
    const x = rng() * P;
    const y = rng() * 220;
    const a = (1 - y / 240) * (0.3 + 0.7 * rng());
    g.fillStyle = `rgba(255,240,255,${a})`;
    const s = rng() < 0.1 ? 2 : 1;
    g.fillRect(x, y, s, s);
  }
  // thin horizontal cloud streaks lit from below
  for (let i = 0; i < 9; i++) {
    const y = 150 + rng() * 150;
    const x = rng() * P;
    const w = 120 + rng() * 260;
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, 'rgba(255,120,180,0)');
    gr.addColorStop(0.5, `rgba(255,${120 + Math.round(rng() * 60)},170,${0.18 + rng() * 0.2})`);
    gr.addColorStop(1, 'rgba(255,120,180,0)');
    g.fillStyle = gr;
    g.fillRect(x - w / 2, y, w, 2 + rng() * 3);
  }
}

function paintSun(g) {
  const cx = 612;
  const cy = 318;
  const r = 158;
  // halo
  const halo = g.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.1);
  halo.addColorStop(0, 'rgba(255,170,90,0.55)');
  halo.addColorStop(0.4, 'rgba(255,90,150,0.22)');
  halo.addColorStop(1, 'rgba(255,90,150,0)');
  g.fillStyle = halo;
  g.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  // sun disc on its own canvas so the bands can be cut out
  const sc = K.createCanvas(r * 2 + 4, r * 2 + 4);
  const s = sc.getContext('2d');
  const gr = s.createLinearGradient(0, 0, 0, r * 2);
  gr.addColorStop(0, '#fff3a0');
  gr.addColorStop(0.35, '#ffd15c');
  gr.addColorStop(0.62, '#ff9a4a');
  gr.addColorStop(1, '#ff3f8e');
  s.fillStyle = gr;
  s.beginPath();
  s.arc(r + 2, r + 2, r, 0, Math.PI * 2);
  s.fill();
  // the classic horizontal slits, thicker toward the bottom
  s.globalCompositeOperation = 'destination-out';
  let y = r + 2 - r * 0.12;
  for (let k = 0; k < 12; k++) {
    const th = 2 + k * 1.5;
    s.fillRect(0, y, r * 2 + 4, th);
    y += th + 13 - k * 0.6;
  }
  g.drawImage(sc, cx - r - 2, cy - r - 2);
}

function ridgePath(fn, bottom) {
  const p = new Path2D();
  p.moveTo(-10, bottom);
  for (let x = -10; x <= P + 10; x += 6) p.lineTo(x, fn(x));
  p.lineTo(P + 10, bottom);
  p.closePath();
  return p;
}

function strokeRidge(g, fn, color, width, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.beginPath();
  for (let x = -10; x <= P + 10; x += 6) {
    if (x === -10) g.moveTo(x, fn(x));
    else g.lineTo(x, fn(x));
  }
  g.stroke();
  g.restore();
}

/** Neon line with a soft glow (bake-time: several widening translucent strokes). */
function glowStroke(g, path, color, width, glow = 1) {
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = color;
  const passes = [
    [width * 7, 0.06 * glow],
    [width * 4, 0.12 * glow],
    [width * 2.2, 0.25 * glow],
  ];
  for (const [w, a] of passes) {
    g.globalAlpha = a;
    g.lineWidth = w;
    g.stroke(path);
  }
  g.globalAlpha = 1;
  g.lineWidth = width;
  g.stroke(path);
  g.restore();
}

function linePath(fn, x0 = -10, x1 = P + 10, dx = 6) {
  const p = new Path2D();
  for (let x = x0; x <= x1; x += dx) {
    if (x === x0) p.moveTo(x, fn(x));
    else p.lineTo(x, fn(x));
  }
  return p;
}

/** Distant low-poly wireframe mountains (the Diablo Range), the synthwave way. */
function paintMountains(g, rng) {
  const ranges = [
    { x0: -20, x1: 430, peak: 262, base: 392 },
    { x0: 780, x1: 1020, peak: 288, base: 392 },
  ];
  for (const r of ranges) {
    const n = 9;
    const top = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const env = Math.sin(Math.PI * u);
      const y = r.base - (r.base - r.peak) * env * (0.55 + 0.45 * rng()) - (i % 2 ? 0 : 8);
      top.push({ x: lerp(r.x0, r.x1, u), y: i === 0 || i === n ? r.base : y });
    }
    const path = new Path2D();
    path.moveTo(r.x0, r.base);
    for (const p of top) path.lineTo(p.x, p.y);
    path.lineTo(r.x1, r.base);
    path.closePath();
    const gr = g.createLinearGradient(0, r.peak, 0, r.base);
    gr.addColorStop(0, '#7b3384');
    gr.addColorStop(1, '#b04a8e');
    g.fillStyle = gr;
    g.fill(path);
    // triangulated wireframe: a mid row of vertices joined to the ridge
    const mid = top.map((p, i) => ({ x: p.x + (i % 2 ? 10 : -10), y: lerp(p.y, r.base, 0.5 + 0.1 * (i % 2)) }));
    const w = new Path2D();
    for (let i = 0; i < n; i++) {
      w.moveTo(top[i].x, top[i].y);
      w.lineTo(mid[i].x, mid[i].y);
      w.lineTo(top[i + 1].x, top[i + 1].y);
      w.moveTo(mid[i].x, mid[i].y);
      w.lineTo(mid[i + 1].x, mid[i + 1].y);
      w.lineTo(top[i + 1].x, top[i + 1].y);
      w.moveTo(mid[i].x, mid[i].y);
      w.lineTo(lerp(mid[i].x, mid[i + 1].x, 0.5), r.base);
    }
    g.save();
    g.clip(path);
    g.globalAlpha = 0.45;
    g.strokeStyle = '#ff8fc5';
    g.lineWidth = 0.9;
    g.stroke(w);
    g.restore();
    g.save();
    g.globalAlpha = 0.8;
    glowStroke(g, (() => {
      const e = new Path2D();
      e.moveTo(top[0].x, top[0].y);
      for (const p of top) e.lineTo(p.x, p.y);
      return e;
    })(), '#ff9ad0', 1, 0.6);
    g.restore();
  }
}

function paintHills(g, rng) {
  paintMountains(g, rng);
  // --- far ridge 2: violet haze ---
  g.fillStyle = (() => {
    const gr = g.createLinearGradient(0, 360, 0, 440);
    gr.addColorStop(0, '#a2438f');
    gr.addColorStop(1, '#6d2a78');
    return gr;
  })();
  g.fill(ridgePath(far2Y, FLOOR_Y));
  glowStroke(g, linePath(far2Y), '#ff7fb8', 1, 0.6);
  for (const t of ROWS) if (t.row === 'far2') smallTower(g, t, '#5d2470');
  // --- far ridge 1: dusky rose-brown ---
  g.fill(ridgePath(far1Y, FLOOR_Y));
  {
    const gr = g.createLinearGradient(0, 390, 0, 470);
    gr.addColorStop(0, '#b4527a');
    gr.addColorStop(1, '#6b2a5e');
    g.fillStyle = gr;
    g.fill(ridgePath(far1Y, FLOOR_Y));
  }
  glowStroke(g, linePath(far1Y), '#ff9ac4', 1.1, 0.7);
  for (const t of ROWS) if (t.row === 'far1') smallTower(g, t, '#4a1a5c');
  // --- mid ridge: golden-brown grass lit by the low sun ---
  {
    const gr = g.createLinearGradient(0, 440, 0, 600);
    gr.addColorStop(0, '#f0a24c');
    gr.addColorStop(0.35, '#c46e3c');
    gr.addColorStop(1, '#5e2848');
    g.fillStyle = gr;
    g.fill(ridgePath(midY, FLOOR_Y));
    // wireframe contour lines following the terrain
    g.save();
    g.clip(ridgePath(midY, FLOOR_Y));
    for (let k = 1; k < 9; k++) {
      const off = k * k * 1.6 + k * 4;
      g.globalAlpha = 0.42 - k * 0.035;
      g.strokeStyle = k % 2 ? '#ffd27a' : '#ff8a6a';
      g.lineWidth = 1;
      g.stroke(linePath((x) => midY(x) + off + 3 * Math.sin(x * 0.02 + k)));
    }
    // dry-grass hatching
    g.globalAlpha = 0.25;
    g.strokeStyle = '#ffd890';
    for (let i = 0; i < 900; i++) {
      const x = rng() * P;
      const y = midY(x) + 4 + rng() * 60;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 3, y - 2);
      g.stroke();
    }
    g.restore();
  }
  glowStroke(g, linePath(midY), C.orange, 1.4, 0.9);
  for (const t of ROWS) if (t.row === 'mid') midTower(g, t);
  // --- near hill: deep golden-brown into violet shadow ---
  {
    const gr = g.createLinearGradient(0, 520, 0, FLOOR_Y);
    gr.addColorStop(0, '#d9843f');
    gr.addColorStop(0.18, '#a5512f');
    gr.addColorStop(0.6, '#5a2340');
    gr.addColorStop(1, '#2a1236');
    g.fillStyle = gr;
    g.fill(ridgePath(nearY, FLOOR_Y));
    g.save();
    g.clip(ridgePath(nearY, FLOOR_Y));
    for (let k = 1; k < 6; k++) {
      g.globalAlpha = 0.35 - k * 0.05;
      g.strokeStyle = k % 2 ? '#ffb347' : '#ff5f8a';
      g.lineWidth = 1;
      g.stroke(linePath((x) => nearY(x) + k * k * 2.2 + k * 3 + 2 * Math.sin(x * 0.03 + k)));
    }
    g.globalAlpha = 0.22;
    g.strokeStyle = '#ffcf80';
    for (let i = 0; i < 500; i++) {
      const x = rng() * P;
      const y = nearY(x) + 3 + rng() * 30;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 4, y - 3);
      g.stroke();
    }
    g.restore();
  }
  glowStroke(g, linePath(nearY), '#ffcf6a', 1.6, 1);
}

/** Tiny far turbine: tapered silhouette tower + nacelle dot (rotor drawn per frame). */
function smallTower(g, t, col) {
  const top = t.base - t.h;
  g.fillStyle = col;
  if (t.kind === 'darrieus') {
    g.strokeStyle = col;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(t.x, t.base);
    g.lineTo(t.x, top);
    g.stroke();
    return;
  }
  g.beginPath();
  g.moveTo(t.x - t.h * 0.09, t.base);
  g.lineTo(t.x - 0.6, top);
  g.lineTo(t.x + 0.6, top);
  g.lineTo(t.x + t.h * 0.09, t.base);
  g.closePath();
  g.fill();
  g.fillRect(t.x - 2, top - 1.5, 4, 3);
}

/** Mid-row turbine tower (lattice / tube / darrieus base and guy wires). */
function midTower(g, t) {
  const top = t.base - t.h;
  const ink = '#2a1034';
  if (t.kind === 'lattice') {
    lattice(g, t.x, t.base, top + 3, 14, 3, ink, 1.2, 5);
    g.fillStyle = ink;
    g.fillRect(t.x - 5, top - 2, 10, 5);
    rim(g, t.x + 7, t.base, t.x + 1.5, top + 3, C.cyan, 0.8);
  } else if (t.kind === 'tube') {
    g.fillStyle = '#3a1c4a';
    g.beginPath();
    g.moveTo(t.x - 4, t.base);
    g.lineTo(t.x - 2, top + 3);
    g.lineTo(t.x + 2, top + 3);
    g.lineTo(t.x + 4, t.base);
    g.closePath();
    g.fill();
    g.fillStyle = ink;
    g.fillRect(t.x - 5, top - 2, 10, 5);
    rim(g, t.x + 4, t.base, t.x + 2, top + 3, C.cyan, 0.8);
  } else {
    // darrieus: guy wires + base housing (blades & shaft per frame)
    g.strokeStyle = 'rgba(40,16,52,0.8)';
    g.lineWidth = 0.7;
    g.beginPath();
    for (const dx of [-30, 26]) {
      g.moveTo(t.x, top);
      g.lineTo(t.x + dx, t.base + 2);
    }
    g.stroke();
    g.fillStyle = ink;
    g.fillRect(t.x - 5, t.base - 6, 10, 7);
  }
}

function rim(g, x0, y0, x1, y1, col, w) {
  g.save();
  g.strokeStyle = col;
  g.globalAlpha = 0.25;
  g.lineWidth = w * 4;
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
  g.globalAlpha = 0.9;
  g.lineWidth = w;
  g.stroke();
  g.restore();
}

/** Open steel lattice (truss) tower: two visible legs, X-bracing panels and struts. */
function lattice(g, x, baseY, topY, wBase, wTop, col, lw, panels) {
  g.save();
  g.strokeStyle = col;
  g.lineCap = 'round';
  const legL = (y) => x - lerp(wTop, wBase, (y - topY) / (baseY - topY)) / 2;
  const legR = (y) => x + lerp(wTop, wBase, (y - topY) / (baseY - topY)) / 2;
  g.lineWidth = lw * 1.6;
  g.beginPath();
  g.moveTo(legL(baseY), baseY);
  g.lineTo(legL(topY), topY);
  g.moveTo(legR(baseY), baseY);
  g.lineTo(legR(topY), topY);
  g.stroke();
  g.lineWidth = lw * 0.7;
  g.beginPath();
  // panels get shorter toward the top (as on real truss towers)
  const ys = [];
  for (let i = 0; i <= panels; i++) {
    const f = i / panels;
    ys.push(lerp(baseY, topY, 1 - Math.pow(1 - f, 1.25)));
  }
  for (let i = 0; i < panels; i++) {
    const ya = ys[i];
    const yb = ys[i + 1];
    g.moveTo(legL(ya), ya);
    g.lineTo(legR(yb), yb);
    g.moveTo(legR(ya), ya);
    g.lineTo(legL(yb), yb);
    g.moveTo(legL(yb), yb);
    g.lineTo(legR(yb), yb);
  }
  g.stroke();
  g.restore();
}

/** Near (hero) machines: towers, nacelles, guy wires — baked. */
function paintNearTowers(g) {
  for (const n of NEAR) {
    const top = n.base - n.h;
    if (n.kind === 'lattice') {
      // concrete pad
      g.fillStyle = '#2a1236';
      g.fillRect(n.x - 22, n.base - 3, 44, 7);
      lattice(g, n.x, n.base, top + 8, 34, 7, '#1d0c2a', 1.6, 9);
      // neon rim light from the sun on the right leg
      rim(g, n.x + 17, n.base, n.x + 3.5, top + 8, C.cyan, 1.1);
      rim(g, n.x - 17, n.base, n.x - 3.5, top + 8, C.magenta, 0.8);
      // service ladder platform + nacelle (yawed slightly: its side shows to the left)
      g.fillStyle = '#1d0c2a';
      g.fillRect(n.x - 9, top + 6, 18, 4);
      nacelle(g, n.x, top, n.yaw);
    } else if (n.kind === 'tube') {
      g.fillStyle = '#2a1236';
      g.fillRect(n.x - 16, n.base - 3, 32, 7);
      const gr = g.createLinearGradient(n.x - 8, 0, n.x + 8, 0);
      gr.addColorStop(0, '#3b1f55');
      gr.addColorStop(0.6, '#6c4a8c');
      gr.addColorStop(1, '#2a1236');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(n.x - 8, n.base);
      g.lineTo(n.x - 4, top + 8);
      g.lineTo(n.x + 4, top + 8);
      g.lineTo(n.x + 8, n.base);
      g.closePath();
      g.fill();
      rim(g, n.x + 8, n.base, n.x + 4, top + 8, C.cyan, 1.1);
      // door + seams
      g.strokeStyle = 'rgba(255,143,197,0.5)';
      g.lineWidth = 0.8;
      g.strokeRect(n.x - 3, n.base - 18, 6, 12);
      g.beginPath();
      g.moveTo(n.x - 6.5, n.base - n.h * 0.35);
      g.lineTo(n.x + 6.5, n.base - n.h * 0.35);
      g.moveTo(n.x - 5.2, n.base - n.h * 0.7);
      g.lineTo(n.x + 5.2, n.base - n.h * 0.7);
      g.stroke();
      nacelle(g, n.x, top, n.yaw);
    } else {
      // Darrieus: guy wires to three anchors, base gearbox housing
      g.save();
      const tY = top;
      g.strokeStyle = 'rgba(255,170,215,0.8)';
      g.lineWidth = 1.1;
      g.beginPath();
      for (const dx of [-120, -46, 104]) {
        g.moveTo(n.x, tY - 4);
        g.lineTo(n.x + dx, nearY(n.x + dx) + 18);
      }
      g.stroke();
      for (const dx of [-120, -46, 104]) {
        g.fillStyle = '#2a1236';
        g.fillRect(n.x + dx - 4, nearY(n.x + dx) + 15, 8, 5);
      }
      g.fillStyle = '#1d0c2a';
      g.beginPath();
      g.moveTo(n.x - 18, n.base + 2);
      g.lineTo(n.x - 14, n.base - 22);
      g.lineTo(n.x + 14, n.base - 22);
      g.lineTo(n.x + 18, n.base + 2);
      g.closePath();
      g.fill();
      rim(g, n.x + 18, n.base + 2, n.x + 14, n.base - 22, C.cyan, 1);
      g.restore();
    }
  }
}

function nacelle(g, x, topY, yaw) {
  const side = Math.sqrt(Math.max(0, 1 - yaw * yaw)); // how much of the nacelle side shows
  const L = 34 * side + 8;
  g.save();
  g.fillStyle = '#251036';
  g.beginPath();
  g.moveTo(x + 6, topY - 7);
  g.lineTo(x - L, topY - 6);
  g.lineTo(x - L, topY + 6);
  g.lineTo(x + 6, topY + 7);
  g.closePath();
  g.fill();
  g.strokeStyle = C.pink;
  g.lineWidth = 0.9;
  g.globalAlpha = 0.8;
  g.beginPath();
  g.moveTo(x + 6, topY - 7);
  g.lineTo(x - L, topY - 6);
  g.stroke();
  g.globalAlpha = 1;
  // tail vane? no: upwind machines yaw by motor; small anemometer mast at the back
  g.strokeStyle = '#251036';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x - L + 4, topY - 6);
  g.lineTo(x - L + 4, topY - 14);
  g.stroke();
  g.fillStyle = C.cyan;
  g.fillRect(x - L + 1, topY - 16, 6, 1.5);
  g.restore();
}

/** Neon perspective grid on the floor (static lines; the beat pulse is drawn per frame). */
function gridPaths() {
  const v = new Path2D();
  for (let k = -26; k <= 26; k++) {
    const xb = VP.x + k * 62;
    v.moveTo(VP.x + (xb - VP.x) * ((FLOOR_Y - VP.y) / (P - VP.y)), FLOOR_Y);
    v.lineTo(xb, P);
  }
  const h = new Path2D();
  for (let d = 0; d < 26; d++) {
    const y = VP.y + 560 / (0.94 + d * 0.42);
    if (y < FLOOR_Y) break;
    h.moveTo(0, y);
    h.lineTo(P, y);
  }
  return { v, h };
}

function paintFloor(g) {
  const gr = g.createLinearGradient(0, FLOOR_Y, 0, P);
  gr.addColorStop(0, '#3a1240');
  gr.addColorStop(0.25, '#1d0b2c');
  gr.addColorStop(1, '#0d0618');
  g.fillStyle = gr;
  g.fillRect(0, FLOOR_Y, P, P - FLOOR_Y);
  // sun reflection smear on the glossy floor
  const rf = g.createRadialGradient(612, FLOOR_Y + 10, 10, 612, FLOOR_Y + 10, 260);
  rf.addColorStop(0, 'rgba(255,120,170,0.35)');
  rf.addColorStop(1, 'rgba(255,120,170,0)');
  g.fillStyle = rf;
  g.fillRect(300, FLOOR_Y, 640, 200);
  const { v, h } = gridPaths();
  g.save();
  g.beginPath();
  g.rect(0, FLOOR_Y, P, P - FLOOR_Y);
  g.clip();
  glowStroke(g, v, C.magenta, 1.2, 0.55);
  glowStroke(g, h, C.magenta, 1.2, 0.55);
  // fade the grid into haze near the horizon
  const hz = g.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 70);
  hz.addColorStop(0, 'rgba(58,18,64,0.85)');
  hz.addColorStop(1, 'rgba(58,18,64,0)');
  g.fillStyle = hz;
  g.fillRect(0, FLOOR_Y, P, 70);
  g.restore();
  // the hills' base line glows where they meet the grid
  const base = new Path2D();
  base.moveTo(0, FLOOR_Y);
  base.lineTo(P, FLOOR_Y);
  glowStroke(g, base, C.pink, 1, 0.6);
}

function paintRoad(g) {
  const top = 683;
  const bot = 717;
  const gr = g.createLinearGradient(0, top, 0, bot);
  gr.addColorStop(0, '#16102a');
  gr.addColorStop(1, '#0a0614');
  g.fillStyle = gr;
  g.fillRect(0, top, P, bot - top);
  const e1 = new Path2D();
  e1.moveTo(0, top + 0.5);
  e1.lineTo(P, top + 0.5);
  glowStroke(g, e1, C.cyan, 1.6, 1);
  const e2 = new Path2D();
  e2.moveTo(0, bot - 0.5);
  e2.lineTo(P, bot - 0.5);
  glowStroke(g, e2, C.magenta, 1.6, 1);
  // dashed centre line (stops cleanly at both panel edges so neighbours can join)
  const d = new Path2D();
  for (let x = 20; x < P - 40; x += 62) {
    d.moveTo(x, ROAD_Y + 0.5);
    d.lineTo(x + 34, ROAD_Y + 0.5);
  }
  glowStroke(g, d, C.yellow, 1.6, 0.8);
}

/**
 * Altamont is treeless grazing land (no palms — those belong to Palm Springs): a wooden
 * pole line (the farm's collector line) runs from the left foreground up into the hills,
 * and a few cattle graze on the near slope between the towers. Black cut-outs, neon rim.
 */
function paintAltamontDetails(g) {
  const CUT = '#140a1f';
  const poles = [
    { x: 58, base: 652, h: 268, arm: 34 },
    { x: 118, base: 616, h: 150, arm: 20 },
    { x: 152, base: 597, h: 94, arm: 13 },
  ];
  const tops = poles.map((p) => ({ x: p.x, y: p.base - p.h + 10 }));
  g.save();
  g.lineCap = 'round';
  // wires: three conductors per span, sagging; the first span leaves the frame on the left
  const span = (a, b, dy, lw) => {
    g.beginPath();
    g.moveTo(a.x, a.y + dy);
    g.quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + dy + Math.abs(b.x - a.x) * 0.12, b.x, b.y + dy);
    g.stroke();
    void lw;
  };
  for (const [k, off] of [[0, -1], [1, 0], [2, 1]]) {
    const pa = poles.map((p, i) => ({ x: p.x + off * p.arm * 0.82, y: tops[i].y - 3 }));
    g.strokeStyle = 'rgba(20,10,31,0.95)';
    g.lineWidth = 1.2;
    span({ x: -30 + off * 20, y: pa[0].y - 14 }, pa[0], 0, 1);
    span(pa[0], pa[1], 0, 1);
    span(pa[1], pa[2], 0, 1);
    g.strokeStyle = 'rgba(255,143,197,0.45)';
    g.lineWidth = 0.7;
    span({ x: -30 + off * 20, y: pa[0].y - 14 }, pa[0], -1, 1);
    span(pa[0], pa[1], -1, 1);
    void k;
  }
  // poles: tapered wooden posts with a crossarm and three insulators
  poles.forEach((p, i) => {
    const s = p.h / 268;
    const top = p.base - p.h;
    g.fillStyle = CUT;
    g.beginPath();
    g.moveTo(p.x - 5 * s - 1, p.base);
    g.lineTo(p.x - 3 * s - 0.5, top);
    g.lineTo(p.x + 3 * s + 0.5, top);
    g.lineTo(p.x + 5 * s + 1, p.base);
    g.closePath();
    g.fill();
    g.fillRect(p.x - p.arm, top + 10 - 2.5 * s - 1, p.arm * 2, 5 * s + 2);
    // diagonal arm braces
    g.strokeStyle = CUT;
    g.lineWidth = 1.6 * s + 0.6;
    g.beginPath();
    g.moveTo(p.x - p.arm * 0.55, top + 12);
    g.lineTo(p.x, top + 10 + 26 * s);
    g.lineTo(p.x + p.arm * 0.55, top + 12);
    g.stroke();
    for (const off of [-1, 0, 1]) {
      const ix = p.x + off * p.arm * 0.82;
      g.fillRect(ix - 2 * s - 0.5, top + 2, 4 * s + 1, 9 * s + 1);
    }
    // neon rim light on the sun side
    g.strokeStyle = 'rgba(37,208,255,0.7)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(p.x + 5 * s + 1, p.base);
    g.lineTo(p.x + 3 * s + 0.5, top);
    g.stroke();
    g.strokeStyle = 'rgba(255,79,154,0.6)';
    g.beginPath();
    g.moveTo(p.x - p.arm, top + 10 - 2.5 * s - 1);
    g.lineTo(p.x + p.arm, top + 10 - 2.5 * s - 1);
    g.stroke();
    void i;
  });
  // grazing cattle on the near slope (facing left; head down = grazing)
  const cow = (x, y, sc, graze) => {
    g.save();
    g.translate(x, y);
    g.scale(sc, sc);
    g.fillStyle = CUT;
    g.beginPath();
    // body
    g.moveTo(-9, -13);
    g.quadraticCurveTo(0, -15, 9, -13);
    g.quadraticCurveTo(12, -12, 11, -7);
    g.lineTo(10, -5);
    g.lineTo(-9, -5);
    g.quadraticCurveTo(-11, -9, -9, -13);
    g.closePath();
    g.fill();
    // neck + head
    g.beginPath();
    if (graze) {
      g.moveTo(-8, -12);
      g.lineTo(-14, -6);
      g.lineTo(-16, -1.5);
      g.lineTo(-12, -1);
      g.lineTo(-8, -6);
    } else {
      g.moveTo(-8, -12);
      g.lineTo(-13, -15);
      g.lineTo(-18, -13);
      g.lineTo(-17, -10);
      g.lineTo(-9, -7);
    }
    g.closePath();
    g.fill();
    // legs
    for (const lx of [-7.5, -4.5, 5, 8]) g.fillRect(lx - 0.9, -6, 1.8, 6);
    // tail
    g.strokeStyle = CUT;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(10.5, -12);
    g.quadraticCurveTo(12.5, -8, 11.5, -3.5);
    g.stroke();
    // warm rim light along the back
    g.strokeStyle = 'rgba(255,179,71,0.85)';
    g.lineWidth = 1 / sc + 0.2;
    g.beginPath();
    g.moveTo(-9, -13);
    g.quadraticCurveTo(0, -15, 9, -13);
    g.stroke();
    g.restore();
  };
  cow(486, nearY(486) + 22, 1.05, true);
  cow(522, nearY(522) + 27, 1.1, false);
  cow(553, nearY(553) + 19, 0.85, true);
  g.restore();
}

/** Bake-time chromatic aberration: red channel shifted right, blue shifted left. */
function chromaShift(g, w, h, dx) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      const i = row + x * 4;
      const xr = Math.max(0, x - dx);
      const xb = Math.min(w - 1, x + dx);
      out[i] = d[row + xr * 4];
      out[i + 2] = d[row + xb * 4 + 2];
    }
  }
  img.data.set(out);
  g.putImageData(img, 0, 0);
}

/** Roadside neon sign in the foreground (generic place wording, no brands). */
const SIGN = { x: 92, y: 748, w: 236, h: 92 };
function paintSign(g) {
  const x0 = SIGN.x;
  const y0 = SIGN.y;
  const w = SIGN.w;
  const h = SIGN.h;
  g.save();
  // posts
  g.fillStyle = '#0c0616';
  g.fillRect(x0 + 34, y0 + h - 4, 6, 70);
  g.fillRect(x0 + w - 40, y0 + h - 4, 6, 70);
  g.strokeStyle = 'rgba(37,208,255,0.7)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x0 + 40.5, y0 + h);
  g.lineTo(x0 + 40.5, y0 + h + 66);
  g.moveTo(x0 + w - 33.5, y0 + h);
  g.lineTo(x0 + w - 33.5, y0 + h + 66);
  g.stroke();
  // board
  g.fillStyle = 'rgba(14,6,26,0.92)';
  g.fillRect(x0, y0, w, h);
  const frame = new Path2D();
  frame.roundRect(x0 + 6, y0 + 6, w - 12, h - 12, 8);
  glowStroke(g, frame, C.magenta, 2, 1);
  // neon lettering
  const neonText = (txt, x, y, font, col, wdt) => {
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.lineJoin = 'round';
    g.strokeStyle = col;
    for (const [lw, a] of [
      [9, 0.08],
      [5, 0.18],
      [2.6, 0.4],
    ]) {
      g.globalAlpha = a;
      g.lineWidth = lw;
      g.strokeText(txt, x, y, wdt);
    }
    g.globalAlpha = 1;
    g.fillStyle = col;
    g.fillText(txt, x, y, wdt);
    g.globalAlpha = 0.85;
    g.fillStyle = '#ffffff';
    g.fillText(txt, x, y - 0.5, wdt);
    g.globalAlpha = 1;
    g.lineWidth = 0.8;
    g.strokeStyle = col;
    g.strokeText(txt, x, y, wdt);
  };
  neonText('ALTAMONT PASS', x0 + w / 2, y0 + 50, `44px ${K.FONT.poster}`, C.cyan, w - 30);
  neonText('WIND RESOURCE AREA', x0 + w / 2, y0 + 77, `22px ${K.FONT.poster}`, C.pink, w - 40);
  g.restore();
}

function paintBackground(g, rng) {
  buildRows();
  paintSky(g, rng);
  paintSun(g);
  paintHills(g, rng);
  paintFloor(g);
  paintNearTowers(g);
  paintAltamontDetails(g);
  paintRoad(g);
  paintSign(g);
  chromaShift(g, P, P, 2);
}

/** Scanlines, CRT vignette and phosphor tint (one overlay, drawn every frame). */
function paintScanlines(g) {
  g.fillStyle = 'rgba(8,2,18,0.26)';
  for (let y = 0; y < P; y += 3) g.fillRect(0, y, P, 1);
  const v = g.createRadialGradient(P / 2, P / 2, P * 0.38, P / 2, P / 2, P * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(6,0,16,0.5)');
  g.fillStyle = v;
  g.fillRect(0, 0, P, P);
}

/** VHS tracking-noise band sprite (several variants for flicker). */
function paintNoiseBand(g, rng, w, h) {
  for (let i = 0; i < 1400; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const len = 2 + rng() * 26;
    const a = rng() * 0.75 * Math.sin((y / h) * Math.PI);
    g.fillStyle = rng() < 0.8 ? `rgba(255,255,255,${a})` : `rgba(255,120,200,${a})`;
    g.fillRect(x, y, len, 1);
  }
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(255,255,255,${0.15 + rng() * 0.25})`;
    g.fillRect(rng() * w, rng() * h, 60 + rng() * 300, 1);
  }
}

// -----------------------------------------------------------------------------
// animated machines
// -----------------------------------------------------------------------------
function farRotors(ctx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  const rows = [
    ['far2', '#5d2470', 1],
    ['far1', '#4a1a5c', 1.3],
  ];
  for (const [row, col, lw] of rows) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (const tb of ROWS) {
      if (tb.row !== row) continue;
      const seed = tb.i * 3.1 + (row === 'far2' ? 100 : 200);
      const sp = rotorSpeed(seed);
      const a0 = K.hash11(seed) * 6.28 + t * sp;
      const top = tb.base - tb.h;
      if (tb.kind === 'darrieus') {
        const w = Math.cos(a0) * tb.R * 0.9;
        ctx.moveTo(tb.x, top);
        ctx.quadraticCurveTo(tb.x + w * 1.3, top + tb.h * 0.35, tb.x, top + tb.h * 0.7);
        ctx.moveTo(tb.x, top);
        ctx.quadraticCurveTo(tb.x - w * 1.3, top + tb.h * 0.35, tb.x, top + tb.h * 0.7);
        continue;
      }
      for (let b = 0; b < 3; b++) {
        const a = a0 + (b * Math.PI * 2) / 3;
        ctx.moveTo(tb.x, top);
        ctx.lineTo(tb.x + Math.cos(a) * tb.R, top + Math.sin(a) * tb.R);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function midRotors(ctx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const tb of ROWS) {
    if (tb.row !== 'mid') continue;
    const seed = tb.i * 5.3 + 300;
    const sp = rotorSpeed(seed);
    const a0 = K.hash11(seed) * 6.28 + t * sp;
    const top = tb.base - tb.h;
    if (tb.kind === 'darrieus') {
      darrieus(ctx, tb.x, top, tb.base - 7, tb.R * 0.8, a0, 0.7);
      continue;
    }
    rotor(ctx, tb.x + 1, top, tb.R, a0, 1, 0.42, false);
  }
  ctx.restore();
}

/** Three-bladed upwind rotor, face-on with a slight yaw (x squeezed by `yaw`). */
function rotor(ctx, hx, hy, R, a0, yaw, scale, hero) {
  const blades = [];
  for (let b = 0; b < 3; b++) {
    const a = a0 + (b * Math.PI * 2) / 3;
    const ca = Math.cos(a) * yaw;
    const sa = Math.sin(a);
    const nx = -sa;
    const ny = ca;
    const p = new Path2D();
    const root = 3.4 * scale * 2;
    const chord = 4.8 * scale * 2;
    const tip = 1.2 * scale * 2;
    p.moveTo(hx + nx * root * 0.6, hy + ny * root * 0.6);
    p.quadraticCurveTo(hx + ca * R * 0.25 + nx * chord, hy + sa * R * 0.25 + ny * chord, hx + ca * R + nx * tip, hy + sa * R + ny * tip);
    p.lineTo(hx + ca * R * 1.01, hy + sa * R * 1.01);
    p.quadraticCurveTo(hx + ca * R * 0.4 - nx * root * 0.3, hy + sa * R * 0.4 - ny * root * 0.3, hx - nx * root * 0.6, hy - ny * root * 0.6);
    p.closePath();
    blades.push(p);
  }
  if (hero) {
    // chromatic ghosts (VHS colour misregistration)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.translate(-2.5, 0);
    ctx.strokeStyle = C.magenta;
    ctx.lineWidth = 2;
    for (const p of blades) ctx.stroke(p);
    ctx.translate(5, 0);
    ctx.strokeStyle = C.cyan;
    for (const p of blades) ctx.stroke(p);
    ctx.restore();
    // glow
    ctx.save();
    ctx.strokeStyle = C.pink;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 7;
    for (const p of blades) ctx.stroke(p);
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3.5;
    for (const p of blades) ctx.stroke(p);
    ctx.restore();
  }
  ctx.fillStyle = hero ? '#1f0d30' : '#2a1034';
  for (const p of blades) ctx.fill(p);
  ctx.strokeStyle = hero ? C.pink : 'rgba(255,170,120,0.85)';
  ctx.lineWidth = hero ? 1.3 : 0.8;
  for (const p of blades) ctx.stroke(p);
  // hub / spinner
  ctx.fillStyle = hero ? '#2a1238' : '#2a1034';
  ctx.beginPath();
  ctx.ellipse(hx, hy, 5 * scale * 2 * yaw, 5 * scale * 2, 0, 0, Math.PI * 2);
  ctx.fill();
  if (hero) {
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

/** Darrieus "eggbeater": two curved blades swept around a vertical shaft. */
function darrieus(ctx, x, top, bot, W, a0, scale, hero = false) {
  const h = bot - top;
  // shaft
  ctx.strokeStyle = hero ? '#2a1238' : '#2a1034';
  ctx.lineWidth = hero ? 6 : 2.4 * scale;
  ctx.beginPath();
  ctx.moveTo(x, top - 6 * scale);
  ctx.lineTo(x, bot);
  ctx.stroke();
  if (hero) {
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, top - 6);
    ctx.lineTo(x + 3, bot);
    ctx.stroke();
  }
  const blades = [0, Math.PI].map((o) => {
    const a = a0 + o;
    return { w: Math.cos(a) * W, z: Math.sin(a) };
  });
  blades.sort((A, B) => A.z - B.z);
  for (const b of blades) {
    const p = new Path2D();
    p.moveTo(x, top);
    p.bezierCurveTo(x + b.w * 1.36, top + h * 0.12, x + b.w * 1.36, top + h * 0.88, x, bot);
    const front = b.z > 0;
    if (hero) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = C.magenta;
      ctx.lineWidth = 2;
      ctx.translate(-2.5, 0);
      ctx.stroke(p);
      ctx.translate(5, 0);
      ctx.strokeStyle = C.cyan;
      ctx.stroke(p);
      ctx.restore();
      ctx.strokeStyle = front ? C.pink : '#a2307a';
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 12;
      ctx.stroke(p);
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 6;
      ctx.stroke(p);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = front ? '#ffe3f0' : '#c2387a';
      ctx.lineWidth = front ? 3.4 : 2.4;
      ctx.stroke(p);
    } else {
      ctx.strokeStyle = front ? '#ffb0a0' : '#6a2a5a';
      ctx.lineWidth = 1.4 * scale + 0.4;
      ctx.stroke(p);
    }
  }
}

function nearRotors(ctx, t, calm = false) {
  for (const n of NEAR) {
    const sp = rotorSpeed(n.seed * 17 + 1) || Math.PI * 2 * 0.9;
    const a0 = calm ? (n.kind === 'darrieus' ? 0.45 : n.seed * 0.7) : n.seed * 1.9 + t * sp;
    const top = n.base - n.h;
    if (n.kind === 'darrieus') {
      darrieus(ctx, n.x, top, n.base - 22, n.R, a0 * 0.8, 1, true);
    } else {
      rotor(ctx, n.x + 6, top, n.R, a0, n.yaw, 1.1, true);
    }
  }
}

// -----------------------------------------------------------------------------
// VHS layer
// -----------------------------------------------------------------------------
function osdText(ctx, text, x, y, size, align = 'left', alpha = 1) {
  ctx.save();
  ctx.font = `${size}px ${K.FONT.terminal}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(text, x + 2.5, y + 2.5);
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillStyle = C.magenta;
  ctx.fillText(text, x - 1.5, y);
  ctx.fillStyle = C.cyan;
  ctx.fillText(text, x + 1.5, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#f7f3ff';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawOSD(ctx, lt, t, glitchK) {
  // PLAY ▶ (top left)
  const playA = glitchK > 0 ? 0.4 + 0.6 * (Math.floor(t * 20) % 2) : 1;
  osdText(ctx, 'PLAY', 62, 104, 46, 'left', playA);
  ctx.save();
  ctx.globalAlpha = playA;
  ctx.fillStyle = '#f7f3ff';
  ctx.beginPath();
  ctx.moveTo(158, 74);
  ctx.lineTo(182, 89);
  ctx.lineTo(158, 104 - 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  osdText(ctx, 'SP', 940, 104, 40, 'right');
  // timestamp (bottom right): date + running clock
  const secs = 7 * 3600 + 42 * 60 + 5 + Math.max(0, lt + 8);
  const hh = Math.floor(secs / 3600) % 12 || 12;
  const mm = String(Math.floor(secs / 60) % 60).padStart(2, '0');
  const ss = String(Math.floor(secs) % 60).padStart(2, '0');
  osdText(ctx, `PM ${hh}:${mm}:${ss}`, 940, 952, 40, 'right');
  osdText(ctx, 'AUG. 17 1985', 940, 916, 40, 'right');
  // TRACKING meter after the glitch
  const trackA = glitchK > 0 ? 1 : 1 - sstep(5.6, 5.8, lt);
  if (lt >= GLITCH_T0 && trackA > 0.01) {
    const blink = lt < 5.2 ? (Math.floor(lt * 6) % 2 ? 1 : 0.35) : 1;
    osdText(ctx, 'TRACKING', 500, 812, 40, 'center', trackA * blink);
    const bars = 14;
    const fill = Math.round(lerp(3, 10, sstep(GLITCH_T0, 5.2, lt)));
    ctx.save();
    ctx.globalAlpha = trackA * blink;
    for (let i = 0; i < bars; i++) {
      ctx.fillStyle = i < fill ? '#f7f3ff' : 'rgba(247,243,255,0.25)';
      ctx.fillRect(500 - bars * 9 + i * 18, 826, 12, 14);
    }
    ctx.restore();
  }
}

let SCRATCH = null;

/** Horizontal tear: copy the finished frame and redraw it in shifted strips. */
function tearFrame(ctx, k, t) {
  const q = Math.floor(t * 30);
  let y = 0;
  let i = 0;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  while (y < P) {
    const h = 6 + Math.floor(K.hash21(i, q) * 46);
    const r = K.hash21(i * 1.3, q * 0.7);
    // the tear is strongest in a band that rolls through the picture
    const band = Math.exp(-Math.pow((y - lerp(820, 260, k)) / 210, 2));
    const dx = (r - 0.35) * 160 * band * Math.sin(Math.PI * k) + (r < 0.12 ? 40 : 0) * Math.sin(Math.PI * k);
    const hh = Math.min(h, P - y);
    ctx.drawImage(SCRATCH, 0, y, P, hh, dx, y, P, hh);
    if (dx > 0.5) ctx.drawImage(SCRATCH, P - dx, y, dx, hh, 0, y, dx, hh);
    else if (dx < -0.5) ctx.drawImage(SCRATCH, 0, y, -dx, hh, P + dx, y, -dx, hh);
    if (Math.abs(dx) > 0.5) {
      if (r > 0.82) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = r > 0.9 ? 'rgba(255,79,154,0.35)' : 'rgba(37,208,255,0.35)';
        ctx.fillRect(0, y, P, h);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    y += h;
    i++;
  }
  // white dropout streaks
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let j = 0; j < 14; j++) {
    const yy = K.hash21(j, q + 9) * P;
    ctx.fillRect(K.hash21(j + 3, q) * P - 100, yy, 80 + K.hash21(j, q + 2) * 420, 1 + (j % 3));
  }
  ctx.restore();
}

/** Drifting tracking-noise band: the picture inside it is re-painted with a sideways skew. */
function trackingBand(ctx, params, lt, star) {
  const t = params.t;
  const period = 11;
  const ph = fract(t / period);
  const y = lerp(-60, P + 40, ph);
  const h = 30;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y + 3, P, h - 6);
  ctx.clip();
  ctx.translate(6 + 4 * Math.sin(t * 9), 0);
  drawPicture(ctx, params, lt, star);
  ctx.restore();
  const variant = Math.floor(t * 15) % 5;
  const band = K.bake(`california_noise_${variant}`, P, h, (g, rng, w, hgt) => paintNoiseBand(g, rng, w, hgt));
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(band, 0, Math.round(y));
  ctx.restore();
}

/** Neon star that replaces the rider's mini rotor after the glitch. */
function drawStar(ctx, hub, ang, appear) {
  const R = hub.r * 1.25 * (0.6 + 0.4 * appear);
  const r = R * 0.45;
  const p = new Path2D();
  for (let k = 0; k < 10; k++) {
    const a = ang + (k * Math.PI) / 5 - Math.PI / 2;
    const rr = k % 2 ? r : R;
    const x = hub.x + Math.cos(a) * rr;
    const y = hub.y + Math.sin(a) * rr;
    if (k === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = C.magenta;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 12;
  ctx.stroke(p);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 6;
  ctx.stroke(p);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255,230,107,0.25)';
  ctx.fill(p);
  ctx.strokeStyle = C.yellow;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.stroke(p);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // sparkle
  const sp = 0.5 + 0.5 * Math.sin(ang * 6);
  ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * sp})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hub.x + R * 0.9, hub.y - R * 1.1);
  ctx.lineTo(hub.x + R * 0.9, hub.y - R * 1.1 - 8 * sp);
  ctx.moveTo(hub.x + R * 0.9 - 4 * sp, hub.y - R * 1.1 - 4 * sp);
  ctx.lineTo(hub.x + R * 0.9 + 4 * sp, hub.y - R * 1.1 - 4 * sp);
  ctx.stroke();
  ctx.restore();
}

// -----------------------------------------------------------------------------
// rider (neon line-art with a pre-layered glow; no blur filters)
// -----------------------------------------------------------------------------
const BIRD_STYLE = {
  plumage: '#fbf3ff',
  plumageShade: '#efe6fb',
  mask: '#07040c',
  bill: '#07040c',
  eyeRing: C.yellow,
  legs: '#ff8fc5',
  crest: C.orange,
  breast: '#ffc070',
  outline: '#7fe9ff',
  outlineWidth: 1.4,
  showBike: false,
  showPinwheel: false,
};

function drawNeonRider(ctx, rig, star, lt) {
  const pin = { type: 'three', colors: ['#25d0ff', '#ff4f9a'] };
  ctx.save();
  // glow passes for the whole rider (bike + bird) in additive light
  ctx.globalCompositeOperation = 'lighter';
  for (const [ls, a, col] of [
    [6, 0.07, C.magenta],
    [3.4, 0.14, C.magenta],
    [1.9, 0.3, C.pink],
  ]) {
    ctx.globalAlpha = a;
    K.drawRider(ctx, rig, { wire: col, lineScale: ls, showPinwheel: !star, pinwheel: pin, spokes: 0 });
  }
  // colour-misregistered ghosts
  ctx.globalAlpha = 0.35;
  ctx.translate(-2.5, 0);
  K.drawRider(ctx, rig, { wire: C.magenta, showPinwheel: !star, pinwheel: pin, spokes: 8 });
  ctx.translate(5, 0);
  K.drawRider(ctx, rig, { wire: C.cyan, showPinwheel: !star, pinwheel: pin, spokes: 8 });
  ctx.restore();
  // crisp neon bicycle + rotor
  ctx.save();
  K.drawRider(ctx, rig, { wire: '#ffd6ec', lineScale: 1.15, showRider: false, showPinwheel: !star, pinwheel: { ...pin, wire: null }, spokes: 10 });
  if (!star) K.drawPinwheel(ctx, rig.pinHub, rig.pinwheelAngle, { type: 'three', colors: ['#25d0ff', '#ff4f9a'], stroke: '#fff4fb', lineWidth: 1.4 });
  ctx.restore();
  // the bird itself stays a white spoonbill with a black face and spoon bill
  if (star) {
    // the pole still carries it
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,79,154,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(rig.poleBase.x, rig.poleBase.y);
    ctx.lineTo(rig.poleTop.x, rig.poleTop.y);
    ctx.stroke();
    ctx.strokeStyle = '#ffd6ec';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  K.drawRider(ctx, rig, BIRD_STYLE);
  if (star) drawStar(ctx, rig.pinHub, rig.pinwheelAngle * 0.35, sstep(STAR_T, STAR_T + 0.25, lt));
}

// -----------------------------------------------------------------------------
// main render
// -----------------------------------------------------------------------------
/** Everything that sits "on the tape": background, grid pulse, machines, rider, scanlines. */
function drawPicture(ctx, params, lt, star) {
  const { t } = params;
  const bg = K.bake('california_bg', P, P, (g, rng) => paintBackground(g, rng));
  ctx.drawImage(bg, 0, 0);
  // beat pulse on the grid (120 BPM)
  const pulse = Math.pow(1 - fract(t * 2), 3);
  if (pulse > 0.02) {
    const grid = K.bake('california_grid', P, P - FLOOR_Y, (g) => {
      g.translate(0, -FLOOR_Y);
      const { v, h } = gridPaths();
      g.strokeStyle = C.pink;
      g.lineWidth = 1.6;
      g.stroke(v);
      g.stroke(h);
      const hz = g.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 90);
      g.globalCompositeOperation = 'destination-out';
      hz.addColorStop(0, 'rgba(0,0,0,1)');
      hz.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = hz;
      g.fillRect(0, FLOOR_Y, P, 90);
      g.clearRect(0, 683, P, 34);
      g.clearRect(SIGN.x, SIGN.y, SIGN.w, SIGN.h); // the sign board hides the grid behind it
    });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55 * pulse;
    ctx.drawImage(grid, 0, FLOOR_Y);
    ctx.restore();
  }
  farRotors(ctx, t);
  midRotors(ctx, t);
  nearRotors(ctx, t, params.isThumbnail);
  if (K.riderVisible(params)) {
    const rig = K.riderRig(params);
    drawNeonRider(ctx, rig, star, lt);
  }
  const scan = K.bake('california_scan', P, P, (g) => paintScanlines(g));
  ctx.drawImage(scan, 0, 0);
}

export function render(kit, slot, scene, params) {
  K = kit;
  buildRows();
  const { ctx } = slot;
  const { t, rawLocalT, isThumbnail } = params;
  const lt = isThumbnail ? 2.0 : rawLocalT;
  const glitchK = !isThumbnail && lt >= GLITCH_T0 && lt < GLITCH_T1 ? (lt - GLITCH_T0) / (GLITCH_T1 - GLITCH_T0) : 0;
  const star = !isThumbnail && lt >= STAR_T && lt < STAR_END;
  ctx.save();
  if (glitchK > 0) {
    // the tape loses tracking: paint the picture off-screen, then tear it into shifted strips
    if (!SCRATCH) SCRATCH = K.createCanvas(P, P);
    const sg = SCRATCH.getContext('2d');
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.clearRect(0, 0, P, P);
    drawPicture(sg, params, lt, star);
    drawOSD(sg, lt, t, glitchK);
    tearFrame(ctx, glitchK, t);
  } else {
    drawPicture(ctx, params, lt, star);
    if (!isThumbnail) trackingBand(ctx, params, lt, star);
    drawOSD(ctx, lt, t, 0);
  }
  ctx.restore();
}
