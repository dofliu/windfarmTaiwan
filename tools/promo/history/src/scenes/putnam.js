// src/scenes/putnam.js
// #12 · 1941 · 史密斯–帕特南百萬瓦風機 — the Smith–Putnam wind turbine, Grandpa's Knob, Vermont.
//
// Medium: a 1940s black-and-white NEWSREEL. The picture is composed at reduced resolution
// and projected up (soft optics), then the "print" gets animated grain (seeded by the
// 24 fps frame number), exposure flicker, gate weave of ±1–2 px, vignette with a rounded
// gate, running emulsion scratches, dust and the occasional hair, plus a superimposed
// newsreel title.
//
// The machine (Putnam, "Power from the Wind", 1948): the first megawatt-class turbine —
// 1,250 kW synchronous generator, TWO stainless-steel-skinned blades (≈20 m long, constant
// 3.5 m chord, square tips, no taper), rotor ≈53 m (175 ft) across, DOWNWIND of a 33.5 m
// (110 ft) four-legged steel lattice tower (hub ≈37 m / 120 ft up), hinged blade roots so
// the blades cone slightly downwind, hydraulic pitch control, 28.7 rpm. It was NOT the
// first grid-connected wind turbine (e.g. Balaklava 1931 fed a grid): it was the first
// megawatt-class one, phased in to the Central Vermont lines on 19 Oct 1941. A large boxy housing on the pintle at the tower top carries shaft,
// gearing and generator. Forested summit, early-winter snow, a pole line carries the power
// down the mountain to the utility's grid.
//
// Story beat (bar 3): the crew on top of the housing waves to the newsreel camera, the
// cameraman waves back — and the film jumps: the frame slips and rolls, a splice flashes
// through the gate, a few frames are missing (the rotor and the crew jump ahead), then the
// reel runs on as if nothing happened.

const S = 1000;
const TAU = Math.PI * 2;
const K = 0.76; // picture buffer scale (soft newsreel optics)
const BW = Math.round(S * K);
const HOR = 560;
const ARCH = 14;

// world: X right, Y up (px above the tower foot), Z towards the camera
const OX = 590;
const OY = 652;
function P(X, Y, Z) {
  const sy = OY - Y;
  return { x: OX + X, y: sy - (Z * (HOR - sy)) / 1100, z: Z };
}

// tower (four-legged steel lattice, 120 ft)
const TW = { h: 318, hb: 44, ht: 15, yaw: 0.38 };
const TCY = Math.cos(TW.yaw);
const TSY = Math.sin(TW.yaw);
function towerPt(u, sx, sz) {
  const h = TW.hb + (TW.ht - TW.hb) * u;
  const xl = sx * h;
  const zl = sz * h;
  return P(xl * TCY + zl * TSY, TW.h * u, -xl * TSY + zl * TCY);
}

// nacelle axis (downwind, towards the camera-right) and rotor
const AL = 0.9;
const AXV = { x: Math.cos(AL), z: Math.sin(AL) }; // along the shaft, downwind
const SDV = { x: -Math.sin(AL), z: Math.cos(AL) }; // horizontal, in the rotor plane
const BOX = { a0: -52, a1: 56, w: 20, y0: TW.h + 2, y1: TW.h + 42 };
function boxPt(a, s, y) {
  return P(AXV.x * a + SDV.x * s, y, AXV.z * a + SDV.z * s);
}
const HUB_A = 80;
const HUB_Y = TW.h + 22;
const HUB3 = { X: AXV.x * HUB_A, Y: HUB_Y, Z: AXV.z * HUB_A };
const HUB = P(HUB3.X, HUB3.Y, HUB3.Z);
// scale ≈9.5 px/m: tower 33.5 m (110 ft) = 318 px, hub ≈36 m, rotor radius 26.65 m = 252 px
// (rotor diameter ≈1.6 × tower height, as on the real machine)
const ROTOR_R = 252;
const OMEGA = (28.7 / 60) * TAU; // 28.7 rpm

// timing ---------------------------------------------------------------------
function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function sstep(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
const G_START = 5.0; // splice glitch (bar 3, second half)
const FPS = 24;
function glitchState(T, thumb) {
  const st = { roll: 0, flash: 0, tape: 0, jolt: 0, skip: 0 };
  if (thumb) return st;
  const f = Math.floor((T - G_START) * FPS);
  if (T >= G_START + 0.17) st.skip = 1;
  if (f < 0 || f > 7) return st;
  if (f === 0) st.roll = 0.2;
  else if (f === 1) st.roll = 0.5;
  else if (f === 2) st.roll = 0.83;
  else if (f === 3) st.flash = 1;
  else if (f === 4) {
    st.flash = 0.35;
    st.jolt = 9;
  } else if (f === 5) st.jolt = -5;
  else if (f === 6) st.jolt = 2;
  if (f >= 3 && f <= 6) st.tape = 1;
  return st;
}
/** the picture's own time: a few frames are missing after the splice */
function picTime(T, gl) {
  return T + gl.skip * 0.42;
}

// colour helpers (greyscale) ------------------------------------------------
function gv(v, a = 1) {
  const c = Math.max(0, Math.min(255, v | 0));
  return a >= 1 ? `rgb(${c},${c},${c})` : `rgba(${c},${c},${c},${a})`;
}

// -----------------------------------------------------------------------------
// static picture (baked at full res, then softened into the 720 px buffer size)
// -----------------------------------------------------------------------------
function ridgeY(x, base, amp, f, seed, kit) {
  return base - amp * (kit.noise1(x * f, seed) - 0.5) * 2 - amp * 0.4 * (kit.noise1(x * f * 3.1, seed + 3) - 0.5) * 2;
}
function summitY(x) {
  // the knob: plateau around the tower, falling away to both sides
  const u = (x - 600) / 300;
  return 646 + 70 * Math.max(0, Math.abs(u) - 0.45) ** 1.6 * (u < 0 ? 1.15 : 0.9) + 4 * Math.sin(x * 0.03);
}
function roadY(x) {
  const u = Math.max(0, Math.min(1, x / S));
  const s = Math.sin(Math.PI * u);
  return 700 - ARCH * s * s;
}

function paintSky(g, rng, kit) {
  const img = g.createImageData(S, 620);
  const d = img.data;
  for (let y = 0; y < 620; y++) {
    const base = lerp(104, 210, Math.pow(y / 620, 0.85));
    for (let x = 0; x < S; x++) {
      const c = kit.fbm2(x * 0.0042, y * 0.011, 4, 2);
      const band = kit.fbm2(x * 0.0018 + 3, y * 0.006, 3, 6);
      let v = base + (c - 0.5) * 60 + (band - 0.5) * 34;
      // brighter break in the overcast low on the left
      v += 18 * Math.exp(-(((x - 260) / 300) ** 2) - (((y - 420) / 140) ** 2));
      v += (rng() - 0.5) * 6;
      const i = (y * S + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, v));
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

function stippleForest(g, rng, x0, x1, topFn, botFn, n, tone, size, snow) {
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, rng());
    const top = topFn(x);
    const bot = botFn(x);
    if (bot <= top) continue;
    const y = lerp(top, bot, Math.pow(rng(), 0.8));
    const s = size * (0.6 + 0.8 * rng()) * (0.7 + 0.6 * ((y - top) / Math.max(1, bot - top)));
    g.fillStyle = gv(tone + (rng() - 0.5) * 22);
    g.beginPath();
    g.moveTo(x, y - s * 2.2);
    g.lineTo(x + s * 0.7, y);
    g.lineTo(x - s * 0.7, y);
    g.closePath();
    g.fill();
    if (snow && rng() < snow) {
      g.fillStyle = gv(232, 0.7);
      g.fillRect(x - s * 0.4, y - s * 1.2, s * 0.6, s * 0.3);
    }
  }
}

function paintHills(g, rng, kit) {
  // far ridge (Taconic range), hazy
  const r1 = (x) => ridgeY(x, 478, 34, 0.0035, 11, kit);
  g.fillStyle = gv(176);
  g.beginPath();
  g.moveTo(0, 700);
  for (let x = 0; x <= S; x += 8) g.lineTo(x, r1(x));
  g.lineTo(S, 700);
  g.fill();
  for (let i = 0; i < 2400; i++) {
    const x = rng() * S;
    const y = r1(x) + rng() * 60;
    g.fillStyle = gv(160 + rng() * 30, 0.6);
    g.fillRect(x, y, 2, 2);
  }
  // snow streaks on the far ridge
  for (let i = 0; i < 160; i++) {
    const x = rng() * S;
    const y = r1(x) + 4 + rng() * 30;
    g.strokeStyle = gv(214, 0.5);
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 6 + rng() * 10, y + 8 + rng() * 10);
    g.stroke();
  }
  // valley haze
  const hz = g.createLinearGradient(0, 500, 0, 600);
  hz.addColorStop(0, gv(200, 0));
  hz.addColorStop(1, gv(206, 0.55));
  g.fillStyle = hz;
  g.fillRect(0, 500, S, 100);
  // middle ridges, forested
  const r2 = (x) => ridgeY(x, 548, 26, 0.006, 21, kit) + (x > 560 ? 14 : 0) * sstep(520, 640, x);
  g.fillStyle = gv(104);
  g.beginPath();
  g.moveTo(0, 720);
  for (let x = 0; x <= S; x += 8) g.lineTo(x, r2(x));
  g.lineTo(S, 720);
  g.fill();
  stippleForest(g, rng, 0, S, r2, (x) => r2(x) + 60, 3600, 70, 3.2, 0.22);
  const hz2 = g.createLinearGradient(0, 540, 0, 640);
  hz2.addColorStop(0, gv(196, 0.25));
  hz2.addColorStop(1, gv(196, 0));
  g.fillStyle = hz2;
  g.fillRect(0, 540, S, 100);
}

function paintSummit(g, rng, kit) {
  // the knob, its clearing and the dark spruce on its shoulders
  g.fillStyle = gv(214);
  g.beginPath();
  g.moveTo(0, 720);
  for (let x = 0; x <= S; x += 6) g.lineTo(x, summitY(x));
  g.lineTo(S, 720);
  g.closePath();
  g.fill();
  // snow texture + rock outcrops + dry grass
  for (let i = 0; i < 2600; i++) {
    const x = rng() * S;
    const top = summitY(x);
    const y = top + rng() * (705 - top);
    const k = rng();
    if (k < 0.12) {
      g.fillStyle = gv(70 + rng() * 50, 0.8);
      g.beginPath();
      g.ellipse(x, y, 2 + rng() * 6, 1 + rng() * 3, 0, 0, TAU);
      g.fill();
    } else if (k < 0.5) {
      g.strokeStyle = gv(120 + rng() * 40, 0.6);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rng() - 0.5) * 3, y - 3 - rng() * 5);
      g.stroke();
    } else {
      g.fillStyle = gv(222 + rng() * 26, 0.5);
      g.fillRect(x, y, 3 + rng() * 6, 1.2);
    }
  }
  // spruce stands on both shoulders (left = down the mountain, right = the far slope)
  const spruce = (x, yb, h, tone) => {
    const w = h * 0.34;
    g.fillStyle = gv(tone);
    g.beginPath();
    g.moveTo(x, yb - h);
    for (let k = 0; k <= 6; k++) {
      const u = k / 6;
      g.lineTo(x + w * u * (1 + 0.25 * (k % 2)), yb - h + h * u);
    }
    g.lineTo(x - w, yb);
    for (let k = 6; k >= 0; k--) {
      const u = k / 6;
      g.lineTo(x - w * u * (1 + 0.25 * (k % 2)), yb - h + h * u);
    }
    g.closePath();
    g.fill();
    // snow on the boughs
    g.fillStyle = gv(226, 0.75);
    for (let k = 1; k < 6; k++) {
      const u = k / 6;
      g.fillRect(x - w * u * 0.9, yb - h + h * u - 1.5, w * u * 0.9, 1.6);
    }
  };
  for (let i = 0; i < 70; i++) {
    const x = 20 + rng() * 420;
    const yb = summitY(x) + 8 + rng() * 40;
    spruce(x, yb, 26 + rng() * 34 + (440 - x) * 0.02, 34 + rng() * 26);
  }
  for (let i = 0; i < 45; i++) {
    const x = 800 + rng() * 200;
    const yb = summitY(x) + 6 + rng() * 34;
    spruce(x, yb, 24 + rng() * 30, 40 + rng() * 26);
  }
  // a few bare hardwoods (late autumn) near the clearing edge
  const bare = (x, yb, h) => {
    g.strokeStyle = gv(60, 0.85);
    g.lineCap = 'round';
    const branch = (x0, y0, ang, len, w, depth) => {
      const x1 = x0 + Math.cos(ang) * len;
      const y1 = y0 + Math.sin(ang) * len;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
      if (depth <= 0) return;
      branch(x1, y1, ang - 0.4 - rng() * 0.3, len * 0.7, w * 0.65, depth - 1);
      branch(x1, y1, ang + 0.4 + rng() * 0.3, len * 0.7, w * 0.65, depth - 1);
    };
    branch(x, yb, -Math.PI / 2, h * 0.4, 2.6, 4);
  };
  bare(452, summitY(452) + 10, 70);
  bare(790, summitY(790) + 6, 62);
  bare(500, summitY(500) + 4, 50);
}

function paintPoleLine(g) {
  // wooden poles with cross-arms carrying the 3 conductors down the mountain to the grid
  const poles = [
    [268, 674, 172],
    [64, 606, 92],
  ];
  const arm = (p) => {
    const [x, y, h] = p;
    const w = h * 0.36;
    return [
      [x - w, y - h + h * 0.06],
      [x, y - h - h * 0.04],
      [x + w, y - h + h * 0.06],
    ];
  };
  for (const p of poles) {
    const [x, y, h] = p;
    g.strokeStyle = gv(40);
    g.lineWidth = Math.max(1.5, h * 0.04);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y - h - h * 0.04);
    g.stroke();
    g.lineWidth = Math.max(0.8, h * 0.035);
    g.beginPath();
    g.moveTo(x - h * 0.4, y - h + h * 0.06);
    g.lineTo(x + h * 0.4, y - h + h * 0.06);
    g.stroke();
    g.fillStyle = gv(215);
    for (const [ax, ay] of arm(p)) g.fillRect(ax - 1.5, ay - Math.max(2, h * 0.05), 3, Math.max(2, h * 0.05));
    // diagonal arm braces
    g.strokeStyle = gv(40);
    g.lineWidth = Math.max(0.8, h * 0.015);
    g.beginPath();
    g.moveTo(x - h * 0.22, y - h + h * 0.06);
    g.lineTo(x, y - h + h * 0.2);
    g.lineTo(x + h * 0.22, y - h + h * 0.06);
    g.stroke();
  }
  // conductors with catenary sag; the first span comes from the switch house at the tower
  const start = [
    [690, 606],
    [694, 604],
    [698, 606],
  ];
  g.strokeStyle = gv(30, 0.9);
  g.lineWidth = 1.3;
  for (let c = 0; c < 3; c++) {
    let prev = start[c];
    for (const p of poles) {
      const cur = arm(p)[c];
      const sag = Math.abs(cur[0] - prev[0]) * 0.07;
      g.beginPath();
      g.moveTo(prev[0], prev[1]);
      g.quadraticCurveTo((prev[0] + cur[0]) / 2, (prev[1] + cur[1]) / 2 + sag, cur[0], cur[1]);
      g.stroke();
      prev = cur;
    }
    g.beginPath();
    g.moveTo(prev[0], prev[1]);
    g.quadraticCurveTo(prev[0] - 20, prev[1] + 6, 0, prev[1] - 8);
    g.stroke();
  }
}

function paintTower(g) {
  const levels = [0, 0.13, 0.26, 0.38, 0.5, 0.61, 0.71, 0.8, 0.88, 0.95, 1];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const faces = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const nx = (a[0] + b[0]) / 2;
    const nz = (a[1] + b[1]) / 2;
    faces.push({ a, b, wz: -nx * TSY + nz * TCY, wx: nx * TCY + nz * TSY });
  }
  faces.sort((p, q) => p.wz - q.wz);
  const line = (p, q, w, v) => {
    g.strokeStyle = gv(v);
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(q.x, q.y);
    g.stroke();
  };
  g.lineCap = 'butt';
  const face = (f) => {
    const back = f.wz < 0;
    const v = back ? 92 : f.wx < 0 ? 58 : 44;
    for (let k = 0; k < levels.length - 1; k++) {
      const u0 = levels[k];
      const u1 = levels[k + 1];
      const A0 = towerPt(u0, f.a[0], f.a[1]);
      const B0 = towerPt(u0, f.b[0], f.b[1]);
      const A1 = towerPt(u1, f.a[0], f.a[1]);
      const B1 = towerPt(u1, f.b[0], f.b[1]);
      const w = (back ? 1.2 : 1.9) * (1 - u0 * 0.35);
      line(A0, B1, w, v);
      line(B0, A1, w, v);
      line(A1, B1, w * 1.2, v);
    }
  };
  for (const f of faces) if (f.wz < 0) face(f);
  // legs (steel angles)
  const legs = corners.map((c) => ({ c, z: towerPt(0, c[0], c[1]).z })).sort((p, q) => p.z - q.z);
  for (const { c, z } of legs) {
    const p0 = towerPt(0, c[0], c[1]);
    const p1 = towerPt(1, c[0], c[1]);
    const w0 = z < 0 ? 3 : 4.6;
    const w1 = z < 0 ? 1.8 : 2.6;
    g.fillStyle = gv(z < 0 ? 84 : 36);
    g.beginPath();
    g.moveTo(p0.x - w0 / 2, p0.y);
    g.lineTo(p0.x + w0 / 2, p0.y);
    g.lineTo(p1.x + w1 / 2, p1.y);
    g.lineTo(p1.x - w1 / 2, p1.y);
    g.closePath();
    g.fill();
    if (z > 0) {
      g.strokeStyle = gv(150, 0.6);
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(p0.x - w0 / 2 + 0.6, p0.y);
      g.lineTo(p1.x - w1 / 2 + 0.4, p1.y);
      g.stroke();
    }
    // concrete pier
    g.fillStyle = gv(z < 0 ? 168 : 196);
    g.fillRect(p0.x - 6, p0.y - 3, 12, 8);
    g.fillStyle = gv(120);
    g.fillRect(p0.x + 2, p0.y - 3, 4, 8);
  }
  for (const f of faces) if (f.wz >= 0) face(f);
  // platform at the tower head
  const pts = corners.map((c) => towerPt(1, c[0] * 1.5, c[1] * 1.5));
  g.fillStyle = gv(60);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) g.lineTo(p.x, p.y);
  g.closePath();
  g.fill();
  // the climbing ladder inside the tower
  const l0 = towerPt(0, 0.15, 0.4);
  const l1 = towerPt(0.98, 0.15, 0.4);
  g.strokeStyle = gv(70, 0.8);
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(l0.x - 2, l0.y);
  g.lineTo(l1.x - 2, l1.y);
  g.moveTo(l0.x + 2, l0.y);
  g.lineTo(l1.x + 2, l1.y);
  g.stroke();
}

function quad(g, a, b, c, d) {
  g.beginPath();
  g.moveTo(a.x, a.y);
  g.lineTo(b.x, b.y);
  g.lineTo(c.x, c.y);
  g.lineTo(d.x, d.y);
  g.closePath();
}

function paintNacelle(g) {
  const { a0, a1, w, y0, y1 } = BOX;
  const yr = y1 + 6; // rounded roof crown
  // pintle girder under the housing
  quad(g, boxPt(a0 + 10, -w + 4, y0 - 4), boxPt(a1 - 4, -w + 4, y0 - 4), boxPt(a1 - 4, w - 4, y0 - 4), boxPt(a0 + 10, w - 4, y0 - 4));
  g.fillStyle = gv(48);
  g.fill();
  // visible faces (camera at +Z): the +s side (left on screen), the downwind end (+a) and the roof
  const side = [boxPt(a0, w, y0), boxPt(a1, w, y0), boxPt(a1, w, y1), boxPt(a0, w, y1)];
  quad(g, side[0], side[1], side[2], side[3]);
  const sg = g.createLinearGradient(0, side[3].y, 0, side[0].y);
  sg.addColorStop(0, gv(200));
  sg.addColorStop(1, gv(142));
  g.fillStyle = sg;
  g.fill();
  const end = [boxPt(a1, w, y0), boxPt(a1, -w, y0), boxPt(a1, -w, y1), boxPt(a1, w, y1)];
  quad(g, end[0], end[1], end[2], end[3]);
  const eg = g.createLinearGradient(0, end[3].y, 0, end[0].y);
  eg.addColorStop(0, gv(168));
  eg.addColorStop(1, gv(112));
  g.fillStyle = eg;
  g.fill();
  // roof: rounded crown (two facets + a bright ridge band)
  quad(g, boxPt(a0, w, y1), boxPt(a1, w, y1), boxPt(a1, w * 0.45, yr - 1), boxPt(a0, w * 0.45, yr - 1));
  g.fillStyle = gv(214);
  g.fill();
  quad(g, boxPt(a0, w * 0.45, yr - 1), boxPt(a1, w * 0.45, yr - 1), boxPt(a1, -w, y1), boxPt(a0, -w, y1));
  g.fillStyle = gv(232);
  g.fill();
  // roof end cap (curved) on the downwind end
  const c0 = boxPt(a1, w, y1);
  const c1 = boxPt(a1, 0, yr + 1);
  const c2 = boxPt(a1, -w, y1);
  g.fillStyle = gv(150);
  g.beginPath();
  g.moveTo(c0.x, c0.y);
  g.quadraticCurveTo(c1.x, c1.y - 6, c2.x, c2.y);
  g.closePath();
  g.fill();
  // outline
  g.strokeStyle = gv(46, 0.8);
  g.lineWidth = 1;
  quad(g, side[0], side[1], side[2], side[3]);
  g.stroke();
  quad(g, end[0], end[1], end[2], end[3]);
  g.stroke();
  // panel seams, louvres and portholes on the side
  g.strokeStyle = gv(110, 0.7);
  g.lineWidth = 0.8;
  for (let a = a0 + 14; a < a1; a += 14) {
    const p = boxPt(a, w, y0);
    const q = boxPt(a, w, y1);
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(q.x, q.y);
    g.stroke();
  }
  for (const a of [a0 + 20, a0 + 48, a0 + 76]) {
    const p = boxPt(a, w, y0 + 22);
    g.fillStyle = gv(60);
    g.beginPath();
    g.ellipse(p.x, p.y, 3.4, 3.8, 0, 0, TAU);
    g.fill();
    g.fillStyle = gv(200, 0.5);
    g.beginPath();
    g.ellipse(p.x - 1, p.y - 1, 1.2, 1.4, 0, 0, TAU);
    g.fill();
  }
  // louvres
  for (let k = 0; k < 4; k++) {
    const p = boxPt(a1, w - 5, y0 + 6 + k * 4);
    const q = boxPt(a1, w - 15, y0 + 6 + k * 4);
    g.strokeStyle = gv(80);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(q.x, q.y);
    g.stroke();
  }
  // hand rail along the roof edges
  g.strokeStyle = gv(54);
  g.lineWidth = 1;
  for (const sw of [w - 1, -w + 1]) {
    const r0 = boxPt(a0 + 2, sw, y1 + 10);
    const r1 = boxPt(a1 - 2, sw, y1 + 10);
    g.beginPath();
    g.moveTo(r0.x, r0.y);
    g.lineTo(r1.x, r1.y);
    for (let a = a0 + 2; a <= a1 - 2; a += 12) {
      const p = boxPt(a, sw, y1 + 10);
      const q = boxPt(a, sw, y1 + 1);
      g.moveTo(p.x, p.y);
      g.lineTo(q.x, q.y);
    }
    g.stroke();
  }
  // main shaft stub to the hub (downwind)
  const s0 = boxPt(a1, 0, HUB_Y);
  g.strokeStyle = gv(70);
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(s0.x, s0.y);
  g.lineTo(HUB.x, HUB.y);
  g.stroke();
  g.strokeStyle = gv(170, 0.6);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s0.x, s0.y - 3);
  g.lineTo(HUB.x, HUB.y - 3);
  g.stroke();
}

function paintSwitchHouse(g) {
  // small control / switch house at the tower foot
  const x = 666;
  const y = 646;
  g.fillStyle = gv(96);
  g.fillRect(x, y - 38, 58, 38);
  g.fillStyle = gv(140);
  g.fillRect(x - 12, y - 38, 12, 36);
  g.fillStyle = gv(232);
  g.beginPath();
  g.moveTo(x - 16, y - 37);
  g.lineTo(x - 5, y - 52);
  g.lineTo(x + 62, y - 52);
  g.lineTo(x + 62, y - 38);
  g.lineTo(x - 2, y - 38);
  g.closePath();
  g.fill();
  g.fillStyle = gv(40);
  g.fillRect(x + 10, y - 28, 10, 28);
  g.fillStyle = gv(170);
  g.fillRect(x + 32, y - 30, 16, 12);
  g.strokeStyle = gv(70);
  g.lineWidth = 1;
  g.strokeRect(x + 32, y - 30, 16, 12);
  // windsock mast at the house corner
  g.strokeStyle = gv(50);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(SOCK.x, y);
  g.lineTo(SOCK.x, SOCK.y - 2);
  g.stroke();
  // insulators and the lead-out on the roof edge
  g.fillStyle = gv(220);
  for (const ix of [x + 24, x + 28, x + 32]) g.fillRect(ix - 1, y - 56, 2, 4);
  g.strokeStyle = gv(40, 0.8);
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(x + 24, y - 56);
  g.lineTo(690, 606);
  g.moveTo(x + 28, y - 56);
  g.lineTo(694, 604);
  g.moveTo(x + 32, y - 56);
  g.lineTo(698, 606);
  g.stroke();
}

function paintTruck(g) {
  // a generic 1940s pickup by the switch house
  const x = 820;
  const y = 662;
  g.fillStyle = gv(36);
  // bed
  g.fillRect(x + 50, y - 26, 58, 16);
  // cab
  g.beginPath();
  g.moveTo(x + 22, y - 12);
  g.lineTo(x + 22, y - 30);
  g.quadraticCurveTo(x + 24, y - 42, x + 36, y - 42);
  g.lineTo(x + 50, y - 42);
  g.lineTo(x + 52, y - 12);
  g.closePath();
  g.fill();
  // hood + fender curves
  g.beginPath();
  g.moveTo(x - 6, y - 12);
  g.quadraticCurveTo(x - 6, y - 26, x + 6, y - 28);
  g.lineTo(x + 24, y - 30);
  g.lineTo(x + 24, y - 12);
  g.closePath();
  g.fill();
  g.fillStyle = gv(150);
  g.fillRect(x + 28, y - 38, 18, 9);
  g.fillStyle = gv(205, 0.5);
  g.fillRect(x + 30, y - 37, 6, 3);
  g.fillStyle = gv(22);
  for (const wx of [x + 8, x + 88]) {
    g.beginPath();
    g.arc(wx, y - 6, 9, 0, TAU);
    g.fill();
    g.fillStyle = gv(120);
    g.beginPath();
    g.arc(wx, y - 6, 3, 0, TAU);
    g.fill();
    g.fillStyle = gv(22);
  }
  g.fillStyle = gv(190);
  g.fillRect(x - 7, y - 20, 4, 4);
  // snow on the hood and cab roof
  g.fillStyle = gv(236);
  g.fillRect(x + 32, y - 44, 16, 2.5);
}

function paintRoadAndForeground(g, rng, kit) {
  // gravel road over the shoulder of the knob
  g.fillStyle = gv(104);
  g.beginPath();
  g.moveTo(0, roadY(0) - 14);
  for (let x = 0; x <= S; x += 10) g.lineTo(x, roadY(x) - 14);
  for (let x = S; x >= 0; x -= 10) g.lineTo(x, roadY(x) + 20);
  g.closePath();
  g.fill();
  for (let i = 0; i < 3400; i++) {
    const x = rng() * S;
    const y = roadY(x) - 13 + rng() * 32;
    g.fillStyle = gv(70 + rng() * 110, 0.55);
    g.fillRect(x, y, 1 + rng() * 2.5, 1 + rng());
  }
  // tyre tracks (packed snow)
  for (const off of [-6, 9]) {
    g.strokeStyle = gv(176, 0.8);
    g.lineWidth = 4;
    g.beginPath();
    for (let x = 0; x <= S; x += 10) {
      const y = roadY(x) + off;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    g.strokeStyle = gv(120, 0.5);
    g.lineWidth = 1;
    g.stroke();
  }
  // snow banks along the road edges
  for (const [off, h] of [[-14, -6], [20, 8]]) {
    g.fillStyle = gv(232);
    g.beginPath();
    g.moveTo(0, roadY(0) + off);
    for (let x = 0; x <= S; x += 10) g.lineTo(x, roadY(x) + off + h * (0.5 + 0.5 * kit.noise1(x * 0.04, off + 9)));
    for (let x = S; x >= 0; x -= 10) g.lineTo(x, roadY(x) + off);
    g.closePath();
    g.fill();
  }
  // foreground snow field
  const fg = g.createLinearGradient(0, 720, 0, S);
  fg.addColorStop(0, gv(236));
  fg.addColorStop(1, gv(196));
  g.fillStyle = fg;
  g.beginPath();
  g.moveTo(0, roadY(0) + 24);
  for (let x = 0; x <= S; x += 10) g.lineTo(x, roadY(x) + 24);
  g.lineTo(S, S);
  g.lineTo(0, S);
  g.closePath();
  g.fill();
  // drifts (soft shading), rocks and weeds
  for (let i = 0; i < 22; i++) {
    const x = rng() * S;
    const y = 760 + rng() * 220;
    const rx = 40 + rng() * 120;
    const rg = g.createRadialGradient(x, y + 10, 4, x, y + 10, rx);
    rg.addColorStop(0, gv(170, 0.28));
    rg.addColorStop(1, gv(170, 0));
    g.fillStyle = rg;
    g.fillRect(x - rx, y - rx, rx * 2, rx * 2);
  }
  for (let i = 0; i < 26; i++) {
    const x = rng() * S;
    const y = 740 + rng() * 240;
    const s = 4 + rng() * 12 * ((y - 700) / 300);
    g.fillStyle = gv(56 + rng() * 40);
    g.beginPath();
    g.ellipse(x, y, s, s * 0.55, 0, Math.PI, TAU);
    g.fill();
    g.fillStyle = gv(238);
    g.beginPath();
    g.ellipse(x - s * 0.1, y - s * 0.45, s * 0.8, s * 0.2, 0, 0, TAU);
    g.fill();
  }
  for (let i = 0; i < 260; i++) {
    const x = rng() * S;
    const y = 728 + rng() * 260;
    const h = 6 + rng() * 22 * ((y - 700) / 300 + 0.3);
    g.strokeStyle = gv(60 + rng() * 60, 0.75);
    g.lineWidth = 0.8 + rng();
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + (rng() - 0.5) * 6, y - h * 0.5, x + (rng() - 0.5) * 10, y - h);
    g.stroke();
  }
  // truck tracks off the road to the cable reel
  for (const off of [0, 16]) {
    g.strokeStyle = gv(186, 0.75);
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(560 + off, roadY(560) + 22);
    g.bezierCurveTo(520 + off, 760, 470 + off, 790, 380 + off * 0.6, 800);
    g.stroke();
    g.strokeStyle = gv(150, 0.5);
    g.lineWidth = 1.2;
    g.stroke();
  }
  // trampled snow around the camera position
  const tr = g.createRadialGradient(170, 930, 10, 170, 930, 110);
  tr.addColorStop(0, gv(180, 0.45));
  tr.addColorStop(1, gv(180, 0));
  g.fillStyle = tr;
  g.fillRect(60, 820, 220, 180);
  // construction leftovers: a wooden cable reel and oil drums by the road
  const reel = { x: 410, y: 752, r: 28 };
  g.fillStyle = gv(84);
  g.beginPath();
  g.ellipse(reel.x + 9, reel.y, reel.r * 0.55, reel.r, 0, 0, TAU);
  g.fill();
  g.fillStyle = gv(60);
  g.fillRect(reel.x - 6, reel.y - reel.r * 0.62, 15, reel.r * 1.24);
  g.fillStyle = gv(150);
  g.beginPath();
  g.ellipse(reel.x - 6, reel.y, reel.r * 0.55, reel.r, 0, 0, TAU);
  g.fill();
  g.strokeStyle = gv(80);
  g.lineWidth = 1.4;
  for (let k = 0; k < 6; k++) {
    const a = (k * TAU) / 6;
    g.beginPath();
    g.moveTo(reel.x - 6, reel.y);
    g.lineTo(reel.x - 6 + Math.cos(a) * reel.r * 0.5, reel.y + Math.sin(a) * reel.r * 0.95);
    g.stroke();
  }
  g.fillStyle = gv(236);
  g.fillRect(reel.x - 12, reel.y - reel.r - 1, 24, 3);
  for (const [dx, dy, tone] of [[470, 770, 52], [496, 766, 78], [482, 748, 64]]) {
    g.fillStyle = gv(tone);
    g.fillRect(dx - 11, dy - 30, 22, 30);
    g.fillStyle = gv(tone + 50);
    g.fillRect(dx - 11, dy - 22, 22, 2);
    g.fillRect(dx - 11, dy - 10, 22, 2);
    g.fillStyle = gv(236);
    g.beginPath();
    g.ellipse(dx, dy - 30, 11, 3, 0, 0, TAU);
    g.fill();
    g.fillStyle = gv(tone - 20, 0.7);
    g.fillRect(dx + 4, dy - 30, 7, 30);
  }
  // footprints in the snow towards the camera position
  for (let k = 0; k < 14; k++) {
    const u = k / 13;
    const x = lerp(250, 520, u) + (k % 2 ? 6 : -6);
    const y = lerp(930, 730, u);
    g.fillStyle = gv(176, 0.7);
    g.beginPath();
    g.ellipse(x, y, 5 - 2 * u, 2.2 - u, -0.3, 0, TAU);
    g.fill();
  }
}

const SOCK = { x: 744, y: 566 };
/** windsock streaming downwind (towards the camera-right): the rotor sits on the lee side */
function drawWindsock(g, T) {
  const L = 36;
  const n = 6;
  const dir = { x: AXV.x, y: 0.28 };
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const wav = Math.sin(T * 13 - u * 5) * 2.2 * u + Math.sin(T * 5.3) * 1.2 * u;
    pts.push({ x: SOCK.x + dir.x * L * u * 1.1, y: SOCK.y + dir.y * L * u + u * u * 5 + wav, r: lerp(7, 3.4, u) });
  }
  for (let k = 0; k < n; k++) {
    const a = pts[k];
    const b = pts[k + 1];
    g.fillStyle = gv(k % 2 ? 230 : 60);
    g.beginPath();
    g.moveTo(a.x, a.y - a.r);
    g.lineTo(b.x, b.y - b.r);
    g.lineTo(b.x, b.y + b.r);
    g.lineTo(a.x, a.y + a.r);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = gv(40);
  g.lineWidth = 1.4;
  g.beginPath();
  g.ellipse(SOCK.x, SOCK.y, 2, 7, 0, 0, TAU);
  g.stroke();
}

/** light snow flurries blown downwind (to the right, towards the camera) */
function drawFlurries(g, kit, T) {
  g.fillStyle = 'rgba(250,250,248,0.85)';
  for (let k = 0; k < 70; k++) {
    const sp = 0.6 + kit.hash11(k * 3.1) * 0.8;
    const ph = kit.hash11(k * 7.7);
    const u = (((T * 0.16 * sp + ph) % 1) + 1) % 1;
    const x0 = kit.hash11(k * 1.9) * 1300 - 300;
    const x = x0 + u * 420 + Math.sin(T * 2.3 + k) * 6;
    const y = -20 + u * 1040;
    if (x < 0 || x > S) continue;
    const r = 0.9 + kit.hash11(k * 5.3) * 1.6 * (y / 900 + 0.4);
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
}

// the newsreel cameraman (foreground left) — body baked, waving arm per frame
const CAM = { x: 150, y: 934 };
function paintCameraman(g) {
  const { x, y } = CAM;
  // tripod (wooden legs)
  const head = { x: x + 64, y: y - 176 };
  g.strokeStyle = gv(72);
  g.lineWidth = 4;
  g.lineCap = 'round';
  for (const [fx, fy] of [[x + 10, y + 2], [x + 118, y + 4], [x + 80, y - 14]]) {
    g.beginPath();
    g.moveTo(head.x, head.y + 8);
    g.lineTo(fx, fy);
    g.stroke();
  }
  g.strokeStyle = gv(150, 0.6);
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(head.x - 1, head.y + 10);
  g.lineTo(x + 8, y);
  g.stroke();
  // pan head + handle
  g.fillStyle = gv(40);
  g.fillRect(head.x - 14, head.y - 2, 28, 10);
  g.strokeStyle = gv(40);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(head.x - 12, head.y + 4);
  g.lineTo(head.x - 50, head.y + 20);
  g.stroke();
  // camera body, tilted up towards the turbine
  g.save();
  g.translate(head.x, head.y - 12);
  g.rotate(-0.32);
  g.fillStyle = gv(30);
  g.fillRect(-30, -18, 64, 34);
  g.fillStyle = gv(70);
  g.fillRect(-30, -18, 64, 5);
  // lens turret + lens hood
  g.fillStyle = gv(24);
  g.beginPath();
  g.moveTo(34, -10);
  g.lineTo(58, -14);
  g.lineTo(58, 12);
  g.lineTo(34, 8);
  g.closePath();
  g.fill();
  g.fillStyle = gv(90);
  g.beginPath();
  g.ellipse(58, -1, 3, 13, 0, 0, TAU);
  g.fill();
  // twin film magazine on top ("ears")
  g.fillStyle = gv(36);
  g.beginPath();
  g.arc(-12, -34, 17, 0, TAU);
  g.arc(16, -34, 17, 0, TAU);
  g.fill();
  g.fillStyle = gv(110, 0.6);
  g.beginPath();
  g.arc(-15, -37, 5, 0, TAU);
  g.arc(13, -37, 5, 0, TAU);
  g.fill();
  // viewfinder
  g.fillStyle = gv(50);
  g.fillRect(-42, -12, 12, 8);
  g.restore();
  // cameraman: overcoat, fedora, bent to the finder
  g.fillStyle = gv(46);
  g.beginPath();
  g.moveTo(x - 30, y - 4);
  g.lineTo(x + 4, y - 4);
  g.lineTo(x + 12, y - 120);
  g.quadraticCurveTo(x + 16, y - 150, x + 2, y - 168);
  g.lineTo(x - 22, y - 160);
  g.quadraticCurveTo(x - 36, y - 120, x - 30, y - 4);
  g.closePath();
  g.fill();
  // coat lit edge
  g.strokeStyle = gv(120, 0.6);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 29, y - 10);
  g.quadraticCurveTo(x - 35, y - 120, x - 21, y - 158);
  g.stroke();
  // legs + shoes
  g.fillStyle = gv(28);
  g.fillRect(x - 22, y - 40, 9, 38);
  g.fillRect(x - 6, y - 40, 9, 38);
  g.fillRect(x - 26, y - 4, 16, 6);
  g.fillRect(x - 8, y - 4, 16, 6);
  // head bent to the viewfinder
  g.fillStyle = gv(178);
  g.beginPath();
  g.ellipse(x + 12, y - 178, 11, 13, 0.4, 0, TAU);
  g.fill();
  g.fillStyle = gv(140);
  g.beginPath();
  g.ellipse(x + 6, y - 172, 6, 7, 0.4, 0, TAU);
  g.fill();
  // fedora
  g.fillStyle = gv(26);
  g.beginPath();
  g.ellipse(x + 10, y - 188, 20, 5, 0.25, 0, TAU);
  g.fill();
  g.beginPath();
  g.moveTo(x - 2, y - 190);
  g.quadraticCurveTo(x + 4, y - 206, x + 18, y - 200);
  g.lineTo(x + 22, y - 186);
  g.closePath();
  g.fill();
  g.fillStyle = gv(80);
  g.fillRect(x, y - 192, 20, 3);
  // far arm on the pan handle
  g.strokeStyle = gv(40);
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(x + 4, y - 150);
  g.lineTo(x + 22, y - 136);
  g.lineTo(x + 18, y - 160);
  g.stroke();
}

function getPicture(kit) {
  return kit.bake('putnam_pic_v5', BW, BW, (g, rng) => {
    const full = kit.createCanvas(S, S);
    const f = full.getContext('2d');
    f.lineJoin = 'round';
    paintSky(f, rng, kit);
    paintHills(f, rng, kit);
    paintSummit(f, rng, kit);
    paintPoleLine(f);
    paintTower(f);
    paintNacelle(f);
    paintSwitchHouse(f);
    paintTruck(f);
    paintRoadAndForeground(f, rng, kit);
    paintCameraman(f);
    // soft 1940s optics: slight blur on the way into the picture buffer
    g.filter = 'blur(0.5px)';
    g.drawImage(full, 0, 0, BW, BW);
    g.filter = 'none';
  });
}

// newsreel title superimposed on the lower third
const TITLE = { x: 270, y: 792, w: 700, h: 168 };
function getTitle(kit) {
  return kit.bake('putnam_title_v3', TITLE.w, TITLE.h, (g) => {
    const cx = TITLE.w / 2 + 6;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const draw = (text, font, y, fill, outline, track = 0) => {
      g.font = font;
      if ('letterSpacing' in g) g.letterSpacing = `${track}px`;
      g.lineJoin = 'round';
      g.strokeStyle = outline;
      g.lineWidth = 6;
      g.strokeText(text, cx, y);
      g.fillStyle = fill;
      g.fillText(text, cx, y);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    };
    // soft dark feathered band so the white type always reads
    g.save();
    g.translate(cx, TITLE.h * 0.56);
    g.scale(1, TITLE.h / TITLE.w * 1.25);
    const bg = g.createRadialGradient(0, 0, TITLE.w * 0.12, 0, 0, TITLE.w * 0.5);
    bg.addColorStop(0, 'rgba(10,10,10,0.42)');
    bg.addColorStop(0.65, 'rgba(10,10,10,0.3)');
    bg.addColorStop(1, 'rgba(10,10,10,0)');
    g.fillStyle = bg;
    g.fillRect(-TITLE.w / 2, -TITLE.w / 2, TITLE.w, TITLE.w);
    g.restore();
    draw("GRANDPA'S KNOB, VERMONT", `400 30px "Bebas Neue", "Oswald", Impact, sans-serif`, 46, '#f2f0ea', 'rgba(15,15,15,0.85)', 6);
    draw('1941 · 佛蒙特州 · 1,250 kW', `900 42px "Noto Sans TC", "Noto Sans CJK TC", sans-serif`, 100, '#ffffff', 'rgba(10,10,10,0.9)', 0);
    draw('爺爺丘上，首座百萬瓦級風機向電網送電', `700 24px "Noto Sans TC", "Noto Sans CJK TC", sans-serif`, 140, '#ecebe6', 'rgba(10,10,10,0.85)', 4);
    // rules either side of the top line
    g.strokeStyle = 'rgba(240,238,230,0.85)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx - 280, 36);
    g.lineTo(cx - 168, 36);
    g.moveTo(cx + 168, 36);
    g.lineTo(cx + 280, 36);
    g.stroke();
  });
}

// -----------------------------------------------------------------------------
// per-frame picture elements
// -----------------------------------------------------------------------------
function bladePoint(theta, r, chordOff) {
  // rotor plane spanned by up (Y) and SDV; blades cone slightly downwind (hinged roots)
  const ct = Math.cos(theta);
  const sn = Math.sin(theta);
  const cone = r * 0.07;
  const pitch = 0.22;
  // chord direction (in-plane, perpendicular to the blade) tilted by the pitch towards the axis
  const cY = -sn * Math.cos(pitch);
  const cS = ct * Math.cos(pitch);
  const cA = -Math.sin(pitch);
  const X = HUB3.X + SDV.x * (sn * r + cS * chordOff) + AXV.x * (cone + cA * chordOff);
  const Y = HUB3.Y + ct * r + cY * chordOff;
  const Z = HUB3.Z + SDV.z * (sn * r + cS * chordOff) + AXV.z * (cone + cA * chordOff);
  return P(X, Y, Z);
}

function drawBlade(g, theta) {
  const R = ROTOR_R;
  const r0 = R * 0.25; // blade root at ~22 ft of the 87.5 ft radius (65.6 ft blades)
  const chord = () => 33; // constant 11.4 ft (3.5 m) chord: rectangular, no taper
  // shank (round tube from the hub to the blade)
  const s0 = bladePoint(theta, 10, 0);
  const s1 = bladePoint(theta, r0 + 6, 0);
  g.strokeStyle = gv(66);
  g.lineWidth = 8;
  g.lineCap = 'butt';
  g.beginPath();
  g.moveTo(s0.x, s0.y);
  g.lineTo(s1.x, s1.y);
  g.stroke();
  g.strokeStyle = gv(150, 0.55);
  g.lineWidth = 2;
  g.stroke();
  // blade planform: leading edge (chordOff +) and trailing edge (-), square tip
  const N = 10;
  const lead = [];
  const trail = [];
  for (let k = 0; k <= N; k++) {
    const r = lerp(r0, R, k / N);
    const c = chord(r);
    lead.push(bladePoint(theta, r, c * 0.3));
    trail.push(bladePoint(theta, r, -c * 0.7));
  }
  // stainless steel: brightness changes as the blade turns (sky reflection / glint)
  const glint = Math.pow(Math.max(0, Math.cos(theta - 2.2)), 6);
  const base = 200 + 26 * Math.cos(theta * 1.0 + 0.6) + 40 * glint;
  g.beginPath();
  g.moveTo(lead[0].x, lead[0].y);
  for (const p of lead) g.lineTo(p.x, p.y);
  for (let k = N; k >= 0; k--) g.lineTo(trail[k].x, trail[k].y);
  g.closePath();
  g.fillStyle = gv(base);
  g.fill();
  g.strokeStyle = gv(30, 0.95);
  g.lineWidth = 1.6;
  g.stroke();
  // spar line / highlight along the blade
  g.strokeStyle = gv(Math.min(250, base + 50), 0.7);
  g.lineWidth = 2;
  g.beginPath();
  const m0 = bladePoint(theta, r0 + 4, 0);
  const m1 = bladePoint(theta, R - 6, 0);
  g.moveTo(m0.x, m0.y);
  g.lineTo(m1.x, m1.y);
  g.stroke();
  // darker trailing strip
  g.strokeStyle = gv(base - 80, 0.75);
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(trail[0].x, trail[0].y);
  for (const p of trail) g.lineTo(p.x, p.y);
  g.stroke();
  // the root joint (hinge) at the start of the blade
  g.fillStyle = gv(56);
  g.beginPath();
  g.arc(s1.x, s1.y, 4.5, 0, TAU);
  g.fill();
}

function drawRotor(g, theta) {
  // depth: the blade whose sideways component points away from the camera is behind
  const blades = [theta, theta + Math.PI].map((t) => ({ t, z: Math.sin(t) * SDV.z }));
  blades.sort((a, b) => a.z - b.z);
  drawBlade(g, blades[0].t);
  // hub "spider" with the pitch cylinders
  g.fillStyle = gv(84);
  g.beginPath();
  g.ellipse(HUB.x, HUB.y, 13, 15, 0, 0, TAU);
  g.fill();
  g.fillStyle = gv(170, 0.7);
  g.beginPath();
  g.ellipse(HUB.x - 3, HUB.y - 4, 5, 6, 0, 0, TAU);
  g.fill();
  g.fillStyle = gv(40);
  g.beginPath();
  g.ellipse(HUB.x + 9, HUB.y + 2, 6, 7, 0, 0, TAU);
  g.fill();
  drawBlade(g, blades[1].t);
}

function drawWorker(g, a, s, T, wave, phase, walkU) {
  const foot = boxPt(a, s, BOX.y1 + 6.5);
  const x = foot.x;
  const y = foot.y;
  const h = 24;
  g.fillStyle = gv(30);
  // legs (with a small stride if walking)
  const st = walkU ? Math.sin(T * 9) * 2.2 : 0;
  g.fillRect(x - 2.4 + st * 0.5, y - h * 0.44, 2, h * 0.44);
  g.fillRect(x + 0.6 - st * 0.5, y - h * 0.44, 2, h * 0.44);
  // body (overalls, light jacket for one of them)
  g.fillStyle = gv(phase > 0.5 ? 34 : 92);
  g.fillRect(x - 3.6, y - h * 0.82, 7.2, h * 0.42);
  // head + cap
  g.fillStyle = gv(170);
  g.beginPath();
  g.arc(x, y - h * 0.9, 2.4, 0, TAU);
  g.fill();
  g.fillStyle = gv(30);
  g.fillRect(x - 2.6, y - h * 1.0, 5.2, 1.8);
  // arms: down, or waving overhead
  g.strokeStyle = gv(phase > 0.5 ? 34 : 92);
  g.lineWidth = 2.6;
  g.lineCap = 'round';
  const sh = { x: x + 2.6, y: y - h * 0.78 };
  const sw = Math.sin(T * 10 + phase * 4) * 0.55;
  const ang = lerp(Math.PI * 0.45, -Math.PI * 0.5 + sw, wave);
  const el = { x: sh.x + Math.cos(ang) * 7, y: sh.y + Math.sin(ang) * 7 };
  const ang2 = ang + lerp(0.1, -0.3, wave);
  const hd = { x: el.x + Math.cos(ang2) * 7, y: el.y + Math.sin(ang2) * 7 };
  g.beginPath();
  g.moveTo(sh.x, sh.y);
  g.lineTo(el.x, el.y);
  g.lineTo(hd.x, hd.y);
  g.stroke();
  if (wave > 0.3) {
    // a white cap / rag waved at the camera
    g.fillStyle = gv(245, Math.min(1, (wave - 0.3) * 2));
    g.beginPath();
    g.ellipse(hd.x + 1.5, hd.y - 2.5, 4.2, 2.6, sw, 0, TAU);
    g.fill();
  }
  const sh2 = { x: x - 2.6, y: y - h * 0.78 };
  const ang3 = lerp(Math.PI * 0.55, -Math.PI * 0.5 - sw * 0.8, wave * phase);
  g.beginPath();
  g.moveTo(sh2.x, sh2.y);
  g.lineTo(sh2.x + Math.cos(ang3) * 13, sh2.y + Math.sin(ang3) * 13);
  g.stroke();
}

function drawCrew(g, T, thumb) {
  const wave = thumb ? 0 : sstep(3.8, 4.15, T) * (1 - sstep(6.1, 6.6, T));
  // one man walks aft along the roof during bars 1–2, the other is at the rail
  const walk = thumb ? 1 : sstep(-1, 3.4, T);
  drawWorker(g, -38, 6, T, wave, 0.2, 0);
  drawWorker(g, lerp(26, -14, walk), -4, T, wave, 0.8, walk > 0.02 && walk < 0.98 ? 1 : 0);
}

function drawCameramanArm(g, T, thumb) {
  // the cameraman lifts his near hand off the camera and waves back
  const w = thumb ? 0 : sstep(4.4, 4.7, T) * (1 - sstep(6.1, 6.45, T));
  const sh = { x: CAM.x - 10, y: CAM.y - 152 };
  const restHand = { x: CAM.x + 38, y: CAM.y - 176 };
  const sw = Math.sin(T * 11) * 0.45;
  const up = { x: sh.x - 14 + Math.sin(T * 11) * 10, y: sh.y - 70 };
  const hand = { x: lerp(restHand.x, up.x, w), y: lerp(restHand.y, up.y, w) };
  const el = { x: lerp(sh.x + 26, sh.x - 22, w), y: lerp(sh.y + 2, sh.y - 30, w) };
  g.strokeStyle = gv(52);
  g.lineWidth = 10;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(sh.x, sh.y);
  g.lineTo(el.x, el.y);
  g.lineTo(hand.x, hand.y);
  g.stroke();
  g.fillStyle = gv(176);
  g.beginPath();
  g.ellipse(hand.x, hand.y, 5, 6, sw, 0, TAU);
  g.fill();
}

const RIDER_STYLE = {
  plumage: '#ebebe8',
  plumageShade: '#a9a9a6',
  mask: '#121212',
  bill: '#161616',
  eyeRing: '#9a9a96',
  legs: '#1e1e1e',
  crest: '#cfcfca',
  breast: '#c8c8c4',
  frame: '#3a3a3a',
  frameShade: '#2a2a2a',
  metal: '#4a4a4a',
  tire: '#1a1a1a',
  rim: '#b8b8b4',
  saddle: '#2e2e2e',
  outline: '#1a1a1a',
  outlineWidth: 1.2,
  shading: true,
};

function drawRiderInto(g, kit, scene, params) {
  const rig = kit.riderRig(params, { arch: ARCH });
  g.fillStyle = gv(60, 0.28);
  g.beginPath();
  g.ellipse(rig.root.x + 6, rig.root.y + 2, 110, 6, rig.root.slope, 0, TAU);
  g.fill();
  kit.drawRider(g, rig, {
    ...RIDER_STYLE,
    pinwheel: { ...(scene.pinwheel || { type: 'two' }), colors: ['#d8d6d0', '#5a5a58'], stroke: '#1a1a1a' },
  });
}

// -----------------------------------------------------------------------------
// film print artefacts
// -----------------------------------------------------------------------------
const GRAIN_N = 6;
const GT = 512;
function grainTile(kit, i) {
  return kit.bake(`putnam_grain2_${i}`, GT, GT, (g, rng) => {
    const img = g.createImageData(GT, GT);
    const d = img.data;
    for (let p = 0; p < GT * GT; p++) {
      // approx. gaussian
      const n = (rng() + rng() + rng() - 1.5) * 1.6;
      const j = p * 4;
      if (n > 0) {
        d[j] = d[j + 1] = d[j + 2] = 255;
        d[j + 3] = Math.min(255, n * 44);
      } else {
        d[j] = d[j + 1] = d[j + 2] = 0;
        d[j + 3] = Math.min(255, -n * 52);
      }
    }
    const tmp = kit.createCanvas(GT, GT);
    tmp.getContext('2d').putImageData(img, 0, 0);
    g.filter = 'blur(0.55px)';
    g.drawImage(tmp, 0, 0);
    g.drawImage(tmp, 0, 0);
    g.filter = 'none';
  });
}

function getVignette(kit) {
  return kit.bake('putnam_vig_v1', S, S, (g) => {
    const vg = g.createRadialGradient(S / 2, S * 0.47, S * 0.26, S / 2, S / 2, S * 0.74);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.7, 'rgba(0,0,0,0.18)');
    vg.addColorStop(1, 'rgba(0,0,0,0.62)');
    g.fillStyle = vg;
    g.fillRect(0, 0, S, S);
    // rounded projector gate: dark soft corners
    g.filter = 'blur(10px)';
    g.strokeStyle = 'rgba(0,0,0,0.75)';
    g.lineWidth = 46;
    const r = 70;
    g.beginPath();
    g.moveTo(r, 0);
    g.arcTo(S, 0, S, S, r);
    g.arcTo(S, S, 0, S, r);
    g.arcTo(0, S, 0, 0, r);
    g.arcTo(0, 0, S, 0, r);
    g.closePath();
    g.stroke();
    g.filter = 'none';
  });
}

function drawFilmArtifacts(ctx, kit, tq, fi, gl, thumb) {
  // grain (one of six tiles at a random offset, 2 px clumps)
  const gi = Math.floor(kit.hash11(fi * 0.317 + 0.1) * GRAIN_N) % GRAIN_N;
  const ox = -Math.floor(kit.hash11(fi * 1.71) * 24);
  const oy = -Math.floor(kit.hash11(fi * 2.93) * 24);
  ctx.globalAlpha = thumb ? 0.4 : 0.55;
  ctx.drawImage(grainTile(kit, gi), ox, oy, GT * 2, GT * 2);
  ctx.globalAlpha = 1;
  // vignette + rounded gate
  ctx.drawImage(getVignette(kit), 0, 0);
  if (thumb) return;
  // emulsion scratches: two long running ones that come and go, plus per-frame short ones
  const scratches = [
    { x0: 322, seed: 3, col: '255,255,255', a: 0.42, w: 1.3 },
    { x0: 748, seed: 9, col: '0,0,0', a: 0.38, w: 1.1 },
    { x0: 552, seed: 15, col: '255,255,255', a: 0.25, w: 0.8 },
  ];
  for (const sc of scratches) {
    if (kit.noise1(tq * 1.3, sc.seed) < 0.48) continue;
    const x = sc.x0 + 70 * (kit.noise1(tq * 0.35, sc.seed + 1) - 0.5) + (kit.hash11(fi * sc.seed) - 0.5) * 1.6;
    ctx.strokeStyle = `rgba(${sc.col},${sc.a * (0.6 + 0.4 * kit.hash11(fi + sc.seed))})`;
    ctx.lineWidth = sc.w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 100; y <= S; y += 100) ctx.lineTo(x + Math.sin(y * 0.01 + sc.seed) * 2, y);
    ctx.stroke();
  }
  if (kit.hash11(fi * 0.73) > 0.55) {
    const x = 60 + kit.hash11(fi * 3.1) * 880;
    const y0 = kit.hash11(fi * 5.3) * 600;
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.3 * kit.hash11(fi * 7.7)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x + 3, y0 + 120 + kit.hash11(fi * 9.1) * 260);
    ctx.stroke();
  }
  // dust specks
  const nd = Math.floor(kit.hash11(fi * 1.37) * 6);
  for (let k = 0; k < nd; k++) {
    const x = kit.hash11(fi * 11.3 + k * 7.1) * S;
    const y = kit.hash11(fi * 13.7 + k * 3.3) * S;
    const r = 0.8 + kit.hash11(fi * 17.1 + k) * 3;
    const white = kit.hash11(fi * 19.9 + k) < 0.4;
    ctx.fillStyle = white ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + kit.hash11(k + fi) * 0.6), k, 0, TAU);
    ctx.fill();
  }
  // a hair caught in the gate now and then
  if (kit.hash11(fi * 0.191) > 0.94) {
    const x = 80 + kit.hash11(fi * 2.2) * 840;
    const y = 80 + kit.hash11(fi * 4.4) * 840;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 30, y - 20, x + 10, y + 40, x + 50, y + 30);
    ctx.stroke();
  }
  // exposure flicker
  const fl = (kit.hash11(fi * 0.917) - 0.5) * 0.09 + 0.025 * Math.sin(tq * 6.1);
  ctx.fillStyle = fl > 0 ? `rgba(255,255,255,${fl * 0.8})` : `rgba(0,0,0,${-fl})`;
  ctx.fillRect(0, 0, S, S);
  // splice: tape edges + cement line crossing the frame, overexposed flash
  if (gl.tape) {
    const ty = 300 + gl.jolt * 3;
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(0, ty, S, 120);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, ty);
    ctx.lineTo(S, ty + 2);
    ctx.moveTo(0, ty + 120);
    ctx.lineTo(S, ty + 118);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, ty + 58);
    ctx.lineTo(S, ty + 61);
    ctx.stroke();
  }
  if (gl.flash > 0) {
    ctx.fillStyle = `rgba(250,248,240,${0.88 * gl.flash})`;
    ctx.fillRect(0, 0, S, S);
  }
}

// -----------------------------------------------------------------------------
// main
// -----------------------------------------------------------------------------
let picBuf = null;

export function render(kit, slot, scene, params) {
  const { ctx } = slot;
  const thumb = !!params.isThumbnail;
  const T = thumb ? 2.16 : params.rawLocalT;
  const tq = thumb ? 60 : Math.floor(params.t * FPS) / FPS;
  const fi = Math.round(tq * FPS);
  const gl = glitchState(T, thumb);
  const PT = picTime(T, gl);

  // 1. compose the picture at reduced resolution (soft optics)
  if (!picBuf) picBuf = kit.createCanvas(BW, BW);
  const pg = picBuf.getContext('2d');
  pg.setTransform(1, 0, 0, 1, 0, 0);
  pg.globalAlpha = 1;
  pg.globalCompositeOperation = 'source-over';
  pg.drawImage(getPicture(kit), 0, 0);
  pg.setTransform(K, 0, 0, K, 0, 0);
  pg.lineJoin = 'round';
  drawWindsock(pg, PT);
  drawCrew(pg, PT, thumb);
  drawRotor(pg, -OMEGA * PT + 1.0);
  if (kit.riderVisible(params)) drawRiderInto(pg, kit, scene, params);
  drawCameramanArm(pg, PT, thumb);
  drawFlurries(pg, kit, PT);
  pg.drawImage(getTitle(kit), TITLE.x, TITLE.y);
  pg.setTransform(1, 0, 0, 1, 0, 0);

  // 2. project it: gate weave, frame slip / roll
  ctx.save();
  ctx.fillStyle = '#060606';
  ctx.fillRect(0, 0, S, S);
  const jx = thumb ? 0 : 1.5 * (kit.noise1(tq * 3.7, 3) - 0.5) * 2 + 0.6 * (kit.hash11(fi * 1.33) - 0.5);
  const jy = thumb ? 0 : 1.6 * (kit.noise1(tq * 2.9, 8) - 0.5) * 2 + 0.6 * (kit.hash11(fi * 2.71) - 0.5) + gl.jolt;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const pad = 6; // overscan so the weave never shows an edge
  if (gl.roll > 0) {
    const dy = gl.roll * S;
    const FL = 38; // frame line
    ctx.drawImage(picBuf, -pad + jx, dy - pad + jy, S + pad * 2, S + pad * 2);
    ctx.drawImage(picBuf, -pad + jx, dy - S - FL - pad + jy, S + pad * 2, S + pad * 2);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, dy - FL + jy, S, FL);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, dy - FL * 0.55 + jy, S, 2);
  } else {
    ctx.drawImage(picBuf, -pad + jx, -pad + jy, S + pad * 2, S + pad * 2);
  }

  // 3. the print: grain, vignette, scratches, dust, flicker, splice
  drawFilmArtifacts(ctx, kit, tq, fi, gl, thumb);
  ctx.restore();
}
