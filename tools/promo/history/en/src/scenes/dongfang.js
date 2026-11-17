// src/scenes/dongfang.js
// Chapter "dongfang" · 2025 · 26 MW 級海上風機.
//
// Medium: 等角 3D 低多邊形 (Isometric low-poly 3D). Tells: a true 30° isometric projection of
// a small world (every solid is computed in 3D metres and projected, no perspective); the
// ground is a grid of iso tiles split into two facets each, with a stepped coastline and creek
// banks showing their side faces; every solid is flat-shaded from one light (top light, left
// face mid, right face dark: three tones per material); soft blurred contact shadows; tiny
// people, trucks and houses; a floating extruded card and iso tags whose lettering is skewed
// onto the planes it sits on; a dashed swept-circle outline and a dimension line like an
// isometric infographic. Pale, airy palette (fog white, coral orange, slate, teal, ink).
//
// Scene (fact sheet "Visual facts"): the 26 MW-class test turbine on the coastal mudflat of the
// test base at Dongying, drawn to one scale (1.6 px per metre): a white tapered low-poly tower on
// a concrete pedestal, a box nacelle and a three-bladed rotor over 310 m across (blades about
// 155 m, so a house is ~16 px; the tiny people are drawn about 2x, ~6 px, so they still read). The rotor faces the viewer's left and
// turns slowly (about 5 rpm); the blades' shadows sweep across the mudflat and over the little
// site houses. Around it: a gravel hardstand (right of the tower, clear of the rider's band) with tiny people, a parked flatbed, a truck driving
// in on the access road, a buried cable to a small substation, a power line on lattice pylons,
// tidal creeks, a faceted sea fading to fog, low-poly clouds and gulls. Upper left, a small
// floating iso card holds a model of the 1887 cloth-sail windmill and its cottage for contrast
// (timber frame, four cloth sails, drawn generic as in the blyth chapter). Upper right, a
// dimension line across the swept circle reads "Rotor diameter over 310 m". No logos, no rated output.
// Layers: back = fog, sea, clouds; mid = mudflat, turbine, site; fore = the dike road the rider
// takes, its revetment, a drainage channel and a reed marsh with egrets and swaying reeds.
//
// Story beat (bar 3): grid connection. On the downbeat an orange power pulse leaves the nacelle,
// runs down the tower and along the buried cable to the substation (two beats); on beat 3 the
// substation lamp lights with a ping ring, a tag pops up (Grid connected 2025.10.29, the date from the
// fact sheet), and the site houses' windows light one per beat, as Blyth's cottage did in 1887.
// Power keeps flowing along the line to the pylons through bar 4 and after.
//
// Deterministic: no Math.random / Date — local hash noise and sin of T. Static layers baked.
// Designed in the 1000x1000 gallery-ride square; on the easel the iso world is simply painted
// over the whole valley through kit.layout (no rider there).

export const meta = { stages: ['gallery-ride', 'easel'] };
const ID = 'dongfang';

const S = 1000;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------------
// isometric projection: world metres -> design px. X runs down-right, Y down-left, Z up.
// ---------------------------------------------------------------------------------------------
const K = 1.6;
const KX = 0.8660254 * K;
const KY = 0.5 * K;
const OX = 590;
const OY = 640;
const P = (X, Y, Z = 0) => [OX + (X - Y) * KX, OY + (X + Y) * KY - Z * K];

let tagFont = null; // the grid tag's fitted font, measured once
/** Set a font of the given weight, shrinking from `px` until `text` fits in `maxW`. */
function fitFont(g, text, weight, px, maxW, family) {
  let sz = px;
  g.font = `${weight} ${sz}px ${family}`;
  while (sz > 9 && g.measureText(text).width > maxW) {
    sz -= 0.5;
    g.font = `${weight} ${sz}px ${family}`;
  }
}

// light (pointing at the sun): high, from the upper left on the viewer's side
const LLEN = Math.hypot(-0.2, 0.6, 1.0);
const LX = -0.2 / LLEN;
const LY = 0.6 / LLEN;
const LZ = 1.0 / LLEN;
const SHX = -LX / LZ;
const SHY = -LY / LZ;
const SP = (X, Y, Z, Zg = 0) => P(X + SHX * (Z - Zg), Y + SHY * (Z - Zg), Zg); // shadow on the ground

// turbine (metres)
const NAC_Z = 182;
const HUB_Z = 190;
const R = 155; // rotor radius: the rotor is "over 310 m" across
const YAW = 62 * DEG;
const DX = Math.cos(YAW); // rotor axis, pointing upwind (towards the viewer's left)
const DY = Math.sin(YAW);
const EX = -DY; // horizontal axis in the rotor plane
const EY = DX;
const ROT_A = 13; // rotor plane, metres ahead of the tower axis
const HUB = [ROT_A * DX, ROT_A * DY, HUB_Z];
const OMEGA = 0.54; // rad/s, about 5 rpm
const CHORD_X = 1.3; // blades drawn a little broader than life so they read at panel size

// blade stations: radius fraction, chord (m), thickness / chord, twist (deg)
const ST = [
  [0.03, 5.2, 0.9, 16],
  [0.075, 7.4, 0.42, 14],
  [0.18, 9.4, 0.28, 11],
  [0.32, 8.4, 0.22, 8],
  [0.5, 6.4, 0.18, 5],
  [0.68, 4.8, 0.16, 3],
  [0.85, 3.2, 0.14, 1.5],
  [0.96, 1.8, 0.12, 0.5],
  [1.0, 0.7, 0.12, 0],
];

// site layout (metres)
const PAD = { x0: 16, y0: -40, x1: 48, y1: -8 };
const ROADX = [24, 32];
const ROAD_Y1 = 72 - ROADX[0]; // the access road meets the dike top (v = X + Y = 72)
const SUB = { x: -184, y: 40, w: 32, d: 26 };
const PYLONS = [
  [-262, 92],
  [-344, 120],
];
const HOUSES = [
  // x, y, w (X), d (Y), wall height, roof: 0 flat / 1 gable, roof colour
  [48, -64, 14, 9, 6, 1, 'roof'],
  [70, -60, 10, 8, 6, 1, 'slate'],
  [86, -48, 12, 9, 6.5, 1, 'roof'],
  [50, -42, 22, 9, 4.5, 0, 'wall'],
  [74, -30, 10, 8, 6, 1, 'slate'],
];
const CABLE = [
  [-6, 6],
  [-30, 12],
  [-60, 16],
  [-120, 36],
  [SUB.x + SUB.w, SUB.y + 12],
];

// dike (the rider's road): top Z 6 between v = 72 and 96, revetment down to the channel
const DK = { v0: 72, v1: 96, z: 6, v2: 108, zc: -2, v3: 124 };

const DEFAULT_PAL = ['#eef1f5', '#f08a5d', '#3a4a6b', '#6ec6ca', '#2b2d42'];

// three tones per material: dark (shade), mid, light (top)
const MAT = {
  white: ['#9aa4b8', '#dbe0e9', '#fdfdfe'],
  concrete: ['#7d8392', '#b2b7c2', '#dcdfe5'],
  wall: ['#8e98ab', '#cdd4df', '#f4f6f9'],
  roof: ['#a8573a', '#e07a52', '#f6a682'],
  slate: ['#262839', '#3a4a6b', '#61739a'],
  steel: ['#4f586d', '#848ea4', '#b8c0ce'],
  cab: ['#b5603e', '#f08a5d', '#f9b392'],
  mud: ['#7a6c5e', '#9b8c7b', '#c7b8a5'],
  marshSide: ['#6f6650', '#8f8566', '#b3a882'],
  sail: ['#b6ab96', '#e8dfcf', '#fcf8ee'],
  timber: ['#5a412f', '#8a6748', '#b48c66'],
  stone: ['#77706a', '#a59c90', '#d0c8bb'],
  grass: ['#5f8257', '#8aac7c', '#b5d0a3'],
  earth: ['#5e4c3e', '#866d58', '#a98d75'],
  tree: ['#3f6a52', '#5f8f6e', '#8fb894'],
};

// ---------------------------------------------------------------------------------------------
// small helpers (pure, deterministic)
// ---------------------------------------------------------------------------------------------
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const pmod = (a, m) => ((a % m) + m) % m;
const lerp = (a, b, t) => a + (b - a) * t;
const h11 = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};
const h21 = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + 74.7) * 43758.5453123;
  return s - Math.floor(s);
};
const vn1 = (x) => {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(h11(i), h11(i + 1), f * f * (3 - 2 * f));
};
const vn2 = (x, y) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h21(ix, iy), h21(ix + 1, iy), ux), lerp(h21(ix, iy + 1), h21(ix + 1, iy + 1), ux), uy);
};
const fbm = (x, y) => 0.55 * vn2(x, y) + 0.3 * vn2(x * 2.1 + 5, y * 2.1) + 0.15 * vn2(x * 4.3, y * 4.3 + 9);
const backOut = (t) => {
  const c = 1.9;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mixCache = new Map();
function mix(a, b, t) {
  const q = Math.round(clamp01(t) * 32);
  const key = a + b + q;
  let v = mixCache.get(key);
  if (!v) {
    const A = hexRgb(a);
    const B = hexRgb(b);
    const u = q / 32;
    const r = (A[0] + (B[0] - A[0]) * u) | 0;
    const g = (A[1] + (B[1] - A[1]) * u) | 0;
    const bl = (A[2] + (B[2] - A[2]) * u) | 0;
    v = '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
    mixCache.set(key, v);
  }
  return v;
}
/** Lambert term -> 0..1 tone (0.12 ambient). */
function litN(nx, ny, nz) {
  const l = Math.hypot(nx, ny, nz) || 1;
  return 0.12 + 0.88 * Math.max(0, (nx * LX + ny * LY + nz * LZ) / l);
}
const T_TOP = litN(0, 0, 1);
const T_LEFT = litN(0, 1, 0);
const T_RIGHT = litN(1, 0, 0);
/** Three-tone material lookup: 0 = dark, 0.5 = mid, 1 = light. */
function tone(mat, t) {
  const m = MAT[mat];
  t = clamp01(t);
  return t < 0.5 ? mix(m[0], m[1], t * 2) : mix(m[1], m[2], (t - 0.5) * 2);
}

function path(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}
function fillPoly(g, pts, col, seam = 0) {
  path(g, pts);
  g.fillStyle = col;
  g.fill();
  if (seam) {
    g.strokeStyle = col;
    g.lineWidth = seam;
    g.stroke();
  }
}
/** Planar quad / polygon in 3D: shaded from its normal; two-sided faces turn to the viewer. */
function face3(g, pts3, mat, twoSided = false, seam = 0.6) {
  const a = pts3[0];
  const b = pts3[1];
  const c = pts3[2];
  const d = pts3[pts3.length - 1];
  const ux = c[0] - a[0];
  const uy = c[1] - a[1];
  const uz = c[2] - a[2];
  const vx = d[0] - b[0];
  const vy = d[1] - b[1];
  const vz = d[2] - b[2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  if (nx + ny + nz < 0) {
    if (!twoSided) return;
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }
  const pts = pts3.map((q) => P(q[0], q[1], q[2]));
  fillPoly(g, pts, tone(mat, litN(nx, ny, nz)), seam);
}
/** Axis-aligned box: the three faces the iso camera sees. */
function box(g, X0, Y0, Z0, w, d, h, mat) {
  const X1 = X0 + w;
  const Y1 = Y0 + d;
  const Z1 = Z0 + h;
  fillPoly(g, [P(X0, Y1, Z0), P(X1, Y1, Z0), P(X1, Y1, Z1), P(X0, Y1, Z1)], tone(mat, T_LEFT), 0.6);
  fillPoly(g, [P(X1, Y0, Z0), P(X1, Y1, Z0), P(X1, Y1, Z1), P(X1, Y0, Z1)], tone(mat, T_RIGHT), 0.6);
  fillPoly(g, [P(X0, Y0, Z1), P(X1, Y0, Z1), P(X1, Y1, Z1), P(X0, Y1, Z1)], tone(mat, T_TOP), 0.6);
}
/** Low-poly vertical prism / frustum (n sides) with its top cap. */
function prism(g, cx, cy, z0, z1, r0, r1, n, mat, rot = 0) {
  const slope = (r0 - r1) / Math.max(1e-3, z1 - z0);
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU;
    const a1 = rot + ((i + 1) / n) * TAU;
    const am = (a0 + a1) / 2;
    const nx = Math.cos(am);
    const ny = Math.sin(am);
    if (nx + ny + slope < -0.02) continue;
    fillPoly(
      g,
      [
        P(cx + r0 * Math.cos(a0), cy + r0 * Math.sin(a0), z0),
        P(cx + r0 * Math.cos(a1), cy + r0 * Math.sin(a1), z0),
        P(cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1), z1),
        P(cx + r1 * Math.cos(a0), cy + r1 * Math.sin(a0), z1),
      ],
      tone(mat, litN(nx, ny, slope)),
      0.6,
    );
  }
  const cap = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    cap.push(P(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), z1));
  }
  fillPoly(g, cap, tone(mat, T_TOP), 0.6);
}
/** Convex hull (monotone chain) of 2D points, for box shadows. */
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  up.pop();
  lo.pop();
  return lo.concat(up);
}
function boxShadow(g, X0, Y0, w, d, h, z0 = 0) {
  const pts = [];
  for (const x of [X0, X0 + w]) for (const y of [Y0, Y0 + d]) {
    pts.push(P(x, y, z0));
    pts.push(SP(x, y, z0 + h, z0));
  }
  path(g, hull(pts));
  g.fill();
}

// ---------------------------------------------------------------------------------------------
// terrain
// ---------------------------------------------------------------------------------------------
function vShore(u) {
  return -322 + 50 * (vn1(u * 0.0085 + 3.1) - 0.5) + 18 * (vn1(u * 0.037 + 11.3) - 0.5) - 40 * sstep(-160, -440, u) + 26 * sstep(250, 520, u);
}
const CREEKS = [
  { pts: [[-150, -380], [-126, -300], [-150, -246], [-120, -190], [-140, -142], [-112, -100]], w: 10 },
  { pts: [[-150, -246], [-206, -214], [-236, -168]], w: 9 },
  { pts: [[338, -360], [304, -282], [322, -232], [288, -186]], w: 10 },
  { pts: [[-520, -300], [-470, -250], [-490, -200]], w: 9 },
].map((c) => ({ w: c.w, pts: c.pts.map(([u, v]) => [(u + v) / 2, (v - u) / 2]) }));
function creekDist(X, Y) {
  let best = 1e9;
  for (const c of CREEKS) {
    for (let i = 0; i < c.pts.length - 1; i++) {
      const [ax, ay] = c.pts[i];
      const [bx, by] = c.pts[i + 1];
      const vx = bx - ax;
      const vy = by - ay;
      const t = clamp01(((X - ax) * vx + (Y - ay) * vy) / (vx * vx + vy * vy));
      const d = Math.hypot(X - ax - vx * t, Y - ay - vy * t) - c.w;
      if (d < best) best = d;
    }
  }
  return best;
}
// zone kinds
const SEA = 0;
const LAND = 1;
const CREEK = 2;
const CHAN = 3;
const MARSH = 4;
const POND = 5;
const ZH = [-3, 0, -2, -2, 0, -1.5];
function zoneAt(X, Y) {
  const u = X - Y;
  const v = X + Y;
  if (v >= DK.v2) {
    if (v < DK.v3) return CHAN;
    if (v > 150 && fbm(X * 0.02 + 3, Y * 0.02) > 0.68) return POND;
    return MARSH;
  }
  if (v >= 56) return LAND;
  if (v < vShore(u)) return SEA;
  if (creekDist(X, Y) < 0) return CREEK;
  return LAND;
}

const TS = 16;
function tileTop(g, X0, Y0, z, cA, cB, seam = 0.7) {
  const a = P(X0, Y0, z);
  const b = P(X0 + TS, Y0, z);
  const c = P(X0 + TS, Y0 + TS, z);
  const d = P(X0, Y0 + TS, z);
  fillPoly(g, [a, b, c], cA, seam);
  fillPoly(g, [a, c, d], cB, seam);
}

function paintTiles(g, pal, Rg) {
  const umin = (Rg.x0 - OX) / KX - 3 * TS;
  const umax = (Rg.x1 - OX) / KX + 3 * TS;
  const vmin = (Rg.y0 - OY) / KY - 3 * TS;
  const vmax = (Rg.y1 - OY) / KY + 4 * TS;
  const aMin = Math.floor(vmin / TS);
  const aMax = Math.ceil(vmax / TS);
  const bMin = Math.floor(umin / TS);
  const bMax = Math.ceil(umax / TS);
  for (let a = aMin; a <= aMax; a++) {
    for (let b = bMin; b <= bMax; b++) {
      if (((a + b) % 2 + 2) % 2) continue;
      const i = (a + b) / 2;
      const j = (a - b) / 2;
      const X0 = i * TS;
      const Y0 = j * TS;
      const cx = X0 + TS / 2;
      const cy = Y0 + TS / 2;
      const kind = zoneAt(cx, cy);
      const z = ZH[kind];
      const u = cx - cy;
      const v = cx + cy;
      const jit = h21(i * 1.7, j * 2.3) - 0.5;
      const sy = OY + v * KY - z * K;
      let cA;
      let cB;
      if (kind === SEA) {
        const d = vShore(u) - v;
        let base = d < 26 ? '#a3ddd5' : d < 90 ? mix('#86d1cf', '#6ec6ca', (d - 26) / 64) : mix('#6ec6ca', '#56acbb', (d - 90) / 220);
        const fade = sstep(250, -60, sy) * 0.78;
        base = mix(base, pal[0], fade);
        const f = 0.08 + 0.05 * jit;
        cA = mix(base, '#ffffff', f * (1 - fade * 0.6));
        cB = mix(base, '#2f7f91', 0.07 + 0.05 * jit);
        if (h21(i, j) > 0.5) [cA, cB] = [cB, cA];
      } else if (kind === LAND) {
        const n = fbm(cx * 0.011, cy * 0.011);
        const wet = Math.max(1 - (v - vShore(u)) / 70, 1 - (creekDist(cx, cy) + 10) / 34, 0);
        let base = mix('#cdbfad', '#b6a693', n);
        base = mix(base, '#9a8b7b', clamp01(wet) * 0.8);
        const red = sstep(0.6, 0.72, fbm(cx * 0.019 + 9, cy * 0.019 + 2));
        base = mix(base, '#c98a70', red * 0.55);
        cA = mix(base, '#ffffff', 0.06 + 0.04 * jit);
        cB = mix(base, '#5a4d42', 0.06 - 0.03 * jit);
      } else if (kind === CREEK || kind === CHAN || kind === POND) {
        const base = kind === CHAN ? '#78c3c4' : kind === POND ? '#8ccfcb' : '#7dc6c6';
        cA = mix(base, '#ffffff', 0.12 + 0.05 * jit);
        cB = mix(base, '#2f7f91', 0.06);
      } else {
        // marsh: reed beds, greener near the ponds
        const n = fbm(cx * 0.015 + 7, cy * 0.015);
        let base = mix('#cbbd90', '#a9b27f', n);
        base = mix(base, '#c98a70', sstep(0.64, 0.76, fbm(cx * 0.022, cy * 0.022 + 4)) * 0.45);
        cA = mix(base, '#ffffff', 0.08 + 0.04 * jit);
        cB = mix(base, '#4f4a36', 0.07 - 0.03 * jit);
      }
      tileTop(g, X0, Y0, z, cA, cB);
      // side faces where the neighbour in front is lower
      const zr = ZH[zoneAt(cx + TS, cy)];
      const zl = ZH[zoneAt(cx, cy + TS)];
      const sideMat = kind === MARSH ? 'marshSide' : 'mud';
      if (zr < z) fillPoly(g, [P(X0 + TS, Y0, zr), P(X0 + TS, Y0 + TS, zr), P(X0 + TS, Y0 + TS, z), P(X0 + TS, Y0, z)], tone(sideMat, 0.12), 0.6);
      if (zl < z) fillPoly(g, [P(X0, Y0 + TS, zl), P(X0 + TS, Y0 + TS, zl), P(X0 + TS, Y0 + TS, z), P(X0, Y0 + TS, z)], tone(sideMat, 0.55), 0.6);
      // the iso grid on solid ground
      if (kind === LAND || kind === MARSH) {
        path(g, [P(X0, Y0, z), P(X0 + TS, Y0, z), P(X0 + TS, Y0 + TS, z), P(X0, Y0 + TS, z)]);
        g.strokeStyle = 'rgba(43,45,66,0.07)';
        g.lineWidth = 0.8;
        g.stroke();
      }
      // vegetation tufts
      if (kind === LAND && v < 50) {
        const red = fbm(cx * 0.019 + 9, cy * 0.019 + 2);
        if (red > 0.6) tufts(g, cx, cy, 3, i * 31 + j, ['#b5644c', '#d98d70'], 5);
      } else if (kind === MARSH && v > DK.v3 + 6) {
        const nT = Math.floor(h21(i + 3, j) * 2.6);
        if (nT) tufts(g, cx, cy, nT, i * 17 + j * 3, ['#a8966a', '#d2c394'], 8);
        if (h21(i * 3, j * 5) > 0.95) shrub(g, cx + 2, cy - 2, 5 + 3 * h21(i, j * 7));
      }
    }
  }
}
/** Little two-tone reed / seepweed tufts on a tile. */
function tufts(g, cx, cy, n, seed, cols, hgt) {
  for (let k = 0; k < n; k++) {
    const X = cx + (h11(seed + k * 3.1) - 0.5) * 12;
    const Y = cy + (h11(seed + k * 5.7 + 1) - 0.5) * 12;
    const [x, y] = P(X, Y, 0);
    const hh = hgt * (0.7 + 0.6 * h11(seed + k));
    g.fillStyle = cols[0];
    g.beginPath();
    g.moveTo(x - 3.2, y);
    g.lineTo(x - 0.6, y - hh);
    g.lineTo(x + 0.4, y);
    g.fill();
    g.fillStyle = cols[1];
    g.beginPath();
    g.moveTo(x - 0.4, y);
    g.lineTo(x + 1.6, y - hh * 0.85);
    g.lineTo(x + 3.4, y);
    g.fill();
  }
}
/** Low-poly shrub (tamarisk-like): a faceted mound with a soft shadow. */
function shrub(g, X, Y, r) {
  const [x, y] = P(X, Y, 0);
  g.fillStyle = 'rgba(43,45,66,0.16)';
  g.beginPath();
  g.ellipse(x + r * 1.3, y - 1, r * 1.7, r * 0.6, 0, 0, TAU);
  g.fill();
  const top = [x, y - r * 2.3];
  const l = [x - r * 1.25, y - r * 0.6];
  const rr = [x + r * 1.25, y - r * 0.7];
  const b = [x + r * 0.1, y + r * 0.2];
  fillPoly(g, [top, l, b], tone('tree', T_LEFT));
  fillPoly(g, [top, b, rr], tone('tree', 0.2));
  fillPoly(g, [top, l, [x - r * 0.2, y - r * 1.4]], tone('tree', 0.95));
}

// ---------------------------------------------------------------------------------------------
// static objects (baked)
// ---------------------------------------------------------------------------------------------
function house(g, h) {
  const [X, Y, w, d, wh, roofKind, roofMat] = h;
  box(g, X, Y, 0, w, d, wh, 'wall');
  // windows on the left face (dark glass, they light up in the beat)
  const nW = Math.max(1, Math.floor(w / 5));
  for (let k = 0; k < nW; k++) {
    const x0 = X + ((k + 0.5) * w) / nW - 1.1;
    fillPoly(g, [P(x0, Y + d, wh * 0.38), P(x0 + 2.2, Y + d, wh * 0.38), P(x0 + 2.2, Y + d, wh * 0.68), P(x0, Y + d, wh * 0.68)], '#46557a');
  }
  if (!roofKind) {
    box(g, X - 0.4, Y - 0.4, wh, w + 0.8, d + 0.8, 0.8, 'concrete');
    return;
  }
  // gable roof, ridge along X
  const rh = d * 0.42;
  const ym = Y + d / 2;
  const e = 0.7;
  face3(g, [[X - e, Y - e, wh], [X + w + e, Y - e, wh], [X + w + e, ym, wh + rh], [X - e, ym, wh + rh]], roofMat);
  fillPoly(g, [P(X + w, Y, wh), P(X + w, Y + d, wh), P(X + w, ym, wh + rh)], tone('wall', T_RIGHT), 0.6);
  face3(g, [[X - e, ym, wh + rh], [X + w + e, ym, wh + rh], [X + w + e, Y + d + e, wh], [X - e, Y + d + e, wh]], roofMat);
}
function windowPts(h) {
  const [X, Y, w, d, wh] = h;
  const nW = Math.max(1, Math.floor(w / 5));
  const out = [];
  for (let k = 0; k < nW; k++) out.push(P(X + ((k + 0.5) * w) / nW, Y + d, wh * 0.53));
  return out;
}
const WINDOWS = HOUSES.map(windowPts);

function person(g, X, Y, col, seed) {
  const [x, y] = P(X, Y, 0);
  g.fillStyle = 'rgba(43,45,66,0.25)';
  g.fillRect(x, y - 0.6, 3.2, 1.2);
  g.fillStyle = '#2b2d42';
  g.fillRect(x - 1, y - 2.2, 2, 2.2);
  g.fillStyle = col;
  g.fillRect(x - 1.2, y - 4.8, 2.4, 2.8);
  g.fillStyle = h11(seed) > 0.5 ? '#fdfdfe' : '#f08a5d';
  g.fillRect(x - 0.9, y - 6.3, 1.8, 1.6);
}

function truck(g, X, Y, cargo) {
  // heading -Y: cab at the small-Y end
  const w = 2.8;
  box(g, X, Y, 0.6, w, 3.2, 3.4, 'cab');
  box(g, X, Y + 3.4, 0.6, w, 12.5, 1.0, 'steel');
  if (cargo) box(g, X + 0.1, Y + 4.4, 1.6, w - 0.2, 10, 2.6, 'slate');
  // windscreen
  fillPoly(g, [P(X + 0.3, Y, 2.6), P(X + w - 0.3, Y, 2.6), P(X + w - 0.3, Y, 3.6), P(X + 0.3, Y, 3.6)], '#3a4a6b');
}

function pylon(g, X, Y) {
  const H = 38;
  const legs = [
    [-3.4, -3.4],
    [3.4, -3.4],
    [3.4, 3.4],
    [-3.4, 3.4],
  ];
  g.strokeStyle = '#6e7890';
  g.lineWidth = 1;
  g.beginPath();
  for (const [lx, ly] of legs) {
    const a = P(X + lx, Y + ly, 0);
    const b = P(X + lx * 0.25, Y + ly * 0.25, H);
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
  }
  // braces on the two visible faces
  for (let k = 0; k < 4; k++) {
    const z0 = (k * H) / 4;
    const z1 = ((k + 1) * H) / 4;
    const s0 = 3.4 * (1 - (0.75 * z0) / H);
    const s1 = 3.4 * (1 - (0.75 * z1) / H);
    for (const [ax, ay, bx, by] of [
      [-1, 1, 1, 1],
      [1, -1, 1, 1],
    ]) {
      const p0 = P(X + ax * s0, Y + ay * s0, z0);
      const p1 = P(X + bx * s1, Y + by * s1, z1);
      const p2 = P(X + bx * s0, Y + by * s0, z0);
      const p3 = P(X + ax * s1, Y + ay * s1, z1);
      g.moveTo(p0[0], p0[1]);
      g.lineTo(p1[0], p1[1]);
      g.moveTo(p2[0], p2[1]);
      g.lineTo(p3[0], p3[1]);
    }
  }
  // cross arms (along the line, i.e. across Y)
  for (const z of [H * 0.78, H * 0.95]) {
    const a = P(X - 9, Y, z);
    const b = P(X + 9, Y, z);
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
  }
  g.stroke();
}
function pylonArms(X, Y) {
  const H = 38;
  return [P(X - 8.5, Y, H * 0.78 - 2), P(X + 8.5, Y, H * 0.78 - 2), P(X, Y, H * 0.95 - 1.5)];
}

function substation(g) {
  const { x, y, w, d } = SUB;
  // gravel yard
  fillPoly(g, [P(x, y, 0.1), P(x + w, y, 0.1), P(x + w, y + d, 0.1), P(x, y + d, 0.1)], '#cfc8bd');
  // control building, transformers, gantry
  box(g, x + 2, y + 2, 0, 12, 8, 5, 'wall');
  box(g, x + 1.6, y + 1.6, 5, 12.8, 8.8, 0.7, 'concrete');
  box(g, x + 18, y + 4, 0, 5, 4, 4.4, 'steel');
  box(g, x + 18, y + 13, 0, 5, 4, 4.4, 'steel');
  box(g, x + 4, y + 15, 0, 6, 4, 3.6, 'steel');
  g.strokeStyle = '#6e7890';
  g.lineWidth = 1;
  g.beginPath();
  for (const yy of [y + 6, y + 15]) {
    const a = P(x + 26, yy, 0);
    const b = P(x + 26, yy, 9);
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
  }
  const t0 = P(x + 26, y + 6, 9);
  const t1 = P(x + 26, y + 15, 9);
  g.moveTo(t0[0], t0[1]);
  g.lineTo(t1[0], t1[1]);
  g.stroke();
  // fence
  g.strokeStyle = 'rgba(58,74,107,0.55)';
  g.lineWidth = 0.8;
  g.beginPath();
  for (const zz of [0, 2.2]) {
    const c = [P(x, y, zz), P(x + w, y, zz), P(x + w, y + d, zz), P(x, y + d, zz)];
    g.moveTo(c[0][0], c[0][1]);
    for (let k = 1; k <= 4; k++) g.lineTo(c[k % 4][0], c[k % 4][1]);
  }
  g.stroke();
}
const SUB_LAMP = P(SUB.x + 8, SUB.y + 10, 9);

function tower(g) {
  // pedestal, tower, nacelle (rotor is drawn per frame)
  prism(g, 0, 0, 0, 2.6, 12, 11, 10, 'concrete', 0.2);
  prism(g, 0, 0, 2.6, NAC_Z, 5.2, 3.3, 14, 'white', 0.1);
  // door + stair on the lit face
  fillPoly(g, [P(-1, 5.1, 3), P(1.2, 5, 3), P(1.2, 5, 6.6), P(-1, 5.1, 6.6)], '#3a4a6b');
  // tower transition ring (low-poly band)
  prism(g, 0, 0, 2.6, 4.2, 5.6, 5.4, 14, 'concrete', 0.1);
  // nacelle box in the rotor frame
  const c = (a, b, z) => [a * DX + b * EX, a * DY + b * EY, z];
  const A0 = -16;
  const A1 = 9;
  const B = 5.8;
  const Z0 = NAC_Z;
  const Z1 = NAC_Z + 13.5;
  const faces = [
    [c(A1, -B, Z0), c(A1, B, Z0), c(A1, B, Z1), c(A1, -B, Z1)],
    [c(A0, -B, Z0), c(A1, -B, Z0), c(A1, -B, Z1), c(A0, -B, Z1)],
    [c(A0, B, Z0), c(A0, -B, Z0), c(A0, -B, Z1), c(A0, B, Z1)],
    [c(A0, -B, Z1), c(A1, -B, Z1), c(A1, B, Z1), c(A0, B, Z1)],
  ];
  for (const f of faces) face3(g, f, 'white', false, 0.8);
  // roof bevel strip + cooler box (low-poly detail)
  const r0 = [c(A0 + 2, -B + 1.2, Z1), c(A0 + 9, -B + 1.2, Z1), c(A0 + 9, B - 1.2, Z1), c(A0 + 2, B - 1.2, Z1)];
  const r1 = r0.map((q) => [q[0], q[1], Z1 + 2.4]);
  face3(g, [r0[0], r0[1], r1[1], r1[0]], 'concrete');
  face3(g, [r0[3], r0[0], r1[0], r1[3]], 'concrete');
  face3(g, [r1[0], r1[1], r1[2], r1[3]], 'concrete');
}
const NAC_LIGHT = P(-14 * DX, -14 * DY, NAC_Z + 16.5);

function paintShadows(g) {
  g.save();
  g.filter = 'blur(1.6px)';
  g.fillStyle = 'rgba(43,45,66,0.2)';
  // tower: base edges perpendicular to the shadow direction, up to the projected top
  const sl = Math.hypot(SHX, SHY);
  const px = -SHY / sl;
  const py = SHX / sl;
  path(g, [P(px * 5.4, py * 5.4, 0), SP(px * 3.3, py * 3.3, NAC_Z), SP(-px * 3.3, -py * 3.3, NAC_Z), P(-px * 5.4, -py * 5.4, 0)]);
  g.fill();
  // nacelle
  const c = (a, b) => [a * DX + b * EX, a * DY + b * EY];
  const pts = [];
  for (const a of [-16, 9]) for (const b of [-5.8, 5.8]) for (const z of [NAC_Z, NAC_Z + 13.5]) {
    const q = c(a, b);
    pts.push(SP(q[0], q[1], z));
  }
  path(g, hull(pts));
  g.fill();
  for (const h of HOUSES) boxShadow(g, h[0], h[1], h[2], h[3], h[4] + (h[5] ? h[3] * 0.42 : 0.8));
  boxShadow(g, SUB.x + 2, SUB.y + 2, 12, 8, 5.7);
  boxShadow(g, PAD.x0 + 4, PAD.y0 + 6, 2.8, 16, 4.2);
  g.restore();
}

function paintSite(g) {
  // gravel hardstand and access road
  fillPoly(g, [P(PAD.x0, PAD.y0, 0.05), P(PAD.x1, PAD.y0, 0.05), P(PAD.x1, PAD.y1, 0.05), P(PAD.x0, PAD.y1, 0.05)], '#d6cfc3');
  fillPoly(g, [P(ROADX[0], PAD.y1, 0.05), P(ROADX[1], PAD.y1, 0.05), P(ROADX[1], ROAD_Y1, 0.05), P(ROADX[0], ROAD_Y1, 0.05)], '#c9c1b4');
  fillPoly(g, [P(6, -14, 0.05), P(16, -16, 0.05), P(16, -8, 0.05), P(6, -6, 0.05)], '#d6cfc3');
  // speckle
  g.fillStyle = 'rgba(90,80,70,0.25)';
  for (let k = 0; k < 90; k++) {
    const X = lerp(PAD.x0, PAD.x1, h11(k * 1.3));
    const Y = lerp(PAD.y0, PAD.y1, h11(k * 2.9 + 4));
    const [x, y] = P(X, Y, 0);
    g.fillRect(x, y, 1.2, 0.8);
  }
  // buried cable: dashed trench with marker posts
  g.setLineDash([5, 4]);
  g.strokeStyle = 'rgba(58,74,107,0.42)';
  g.lineWidth = 1.4;
  g.beginPath();
  CABLE.forEach(([X, Y], i) => {
    const [x, y] = P(X, Y, 0);
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  });
  g.stroke();
  g.setLineDash([]);
}

function powerLines(g) {
  const a = pylonArms(...PYLONS[0]);
  const b = pylonArms(...PYLONS[1]);
  const s = [P(SUB.x + 26, SUB.y + 6, 9), P(SUB.x + 26, SUB.y + 15, 9), P(SUB.x + 26, SUB.y + 10, 9)];
  g.strokeStyle = 'rgba(43,45,66,0.5)';
  g.lineWidth = 0.8;
  g.beginPath();
  for (let k = 0; k < 3; k++) {
    for (const [p0, p1] of [
      [s[k], a[k]],
      [a[k], b[k]],
    ]) {
      g.moveTo(p0[0], p0[1]);
      g.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 7, p1[0], p1[1]);
    }
    const far = [b[k][0] - 260, b[k][1] + 60];
    g.moveTo(b[k][0], b[k][1]);
    g.quadraticCurveTo((b[k][0] + far[0]) / 2, (b[k][1] + far[1]) / 2 + 9, far[0], far[1]);
  }
  g.stroke();
}
function linePath() {
  // the route the power takes after the substation (top conductor), as screen points
  const s = P(SUB.x + 26, SUB.y + 10, 9);
  const a = pylonArms(...PYLONS[0])[2];
  const b = pylonArms(...PYLONS[1])[2];
  return [s, a, b, [b[0] - 260, b[1] + 60]];
}
const LINE_PATH = linePath();
const DOWN_PATH = (() => {
  const top = P(0, 3.4, NAC_Z);
  const bot = P(0, 5.3, 3);
  const hub = P(...HUB);
  return [hub, top, bot].concat(CABLE.map(([X, Y]) => P(X, Y, 0)));
})();

function polyLen(pts) {
  const segs = [];
  let tot = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push(l);
    tot += l;
  }
  return { segs, tot };
}
function polyAt(pts, meta, s) {
  let d = clamp01(s) * meta.tot;
  for (let i = 0; i < meta.segs.length; i++) {
    if (d <= meta.segs[i] || i === meta.segs.length - 1) {
      const t = meta.segs[i] ? Math.min(1, d / meta.segs[i]) : 0;
      return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)];
    }
    d -= meta.segs[i];
  }
  return pts[pts.length - 1];
}
const DOWN_META = polyLen(DOWN_PATH);
const LINE_META = polyLen(LINE_PATH);

// ---------------------------------------------------------------------------------------------
// the dike (the rider's road) and the marsh in front
// ---------------------------------------------------------------------------------------------
function paintDike(g, pal, Rg) {
  const uA = (Rg.x0 - OX) / KX - 60;
  const uB = (Rg.x1 - OX) / KX + 60;
  const at = (u, v, z) => P((u + v) / 2, (v - u) / 2, z);
  // low wave wall on the seaward edge
  fillPoly(g, [at(uA, DK.v0 - 2.2, DK.z + 1.3), at(uB, DK.v0 - 2.2, DK.z + 1.3), at(uB, DK.v0, DK.z + 1.3), at(uA, DK.v0, DK.z + 1.3)], tone('concrete', T_TOP));
  fillPoly(g, [at(uA, DK.v0, DK.z + 1.3), at(uB, DK.v0, DK.z + 1.3), at(uB, DK.v0, DK.z), at(uA, DK.v0, DK.z)], tone('concrete', 0.5));
  // road surface
  fillPoly(g, [at(uA, DK.v0, DK.z), at(uB, DK.v0, DK.z), at(uB, DK.v1, DK.z), at(uA, DK.v1, DK.z)], '#575d74');
  fillPoly(g, [at(uA, DK.v1 - 1.6, DK.z), at(uB, DK.v1 - 1.6, DK.z), at(uB, DK.v1, DK.z), at(uA, DK.v1, DK.z)], '#6b7189');
  // edge line and centre dashes
  const e0 = at(uA, DK.v0 + 1.6, DK.z);
  const e1 = at(uB, DK.v0 + 1.6, DK.z);
  g.fillStyle = 'rgba(238,241,245,0.75)';
  g.fillRect(e0[0], e0[1] - 0.6, e1[0] - e0[0], 1.2);
  const mY = at(0, (DK.v0 + DK.v1) / 2, DK.z)[1];
  for (let x = Math.floor(Rg.x0 / 64) * 64; x < Rg.x1; x += 64) g.fillRect(x + 10, mY - 1.2, 30, 2.4);
  // revetment slope (concrete blocks on an iso diamond grid)
  const zAt = (v) => DK.z + ((DK.zc - DK.z) * (v - DK.v1)) / (DK.v2 - DK.v1);
  fillPoly(g, [at(uA, DK.v1, DK.z), at(uB, DK.v1, DK.z), at(uB, DK.v2, DK.zc), at(uA, DK.v2, DK.zc)], tone('concrete', litN(0.45, 0.45, 0.77)));
  g.strokeStyle = 'rgba(58,74,107,0.2)';
  g.lineWidth = 0.9;
  g.beginPath();
  const xMin = (uA + DK.v1) / 2 - 20;
  const xMax = (uB + DK.v2) / 2 + 20;
  for (let c = Math.floor(xMin / 6) * 6; c < xMax; c += 6) {
    // X = c and Y = c lines across the slope
    for (const isX of [true, false]) {
      const p0 = isX ? P(c, DK.v1 - c, DK.z) : P(DK.v1 - c, c, DK.z);
      const p1 = isX ? P(c, DK.v2 - c, DK.zc) : P(DK.v2 - c, c, DK.zc);
      g.moveTo(p0[0], p0[1]);
      g.lineTo(p1[0], p1[1]);
    }
  }
  g.stroke();
  // toe line
  const t0 = at(uA, DK.v2, DK.zc);
  const t1 = at(uB, DK.v2, DK.zc);
  g.fillStyle = 'rgba(43,45,66,0.25)';
  g.fillRect(t0[0], t0[1] - 0.8, t1[0] - t0[0], 1.6);
  void zAt;
  void pal;
}

// ---------------------------------------------------------------------------------------------
// annotation: swept circle and dimension line (baked)
// ---------------------------------------------------------------------------------------------
const rotorPt = (phi, r) => {
  const c = Math.cos(phi) * r;
  const s = Math.sin(phi) * r;
  return P(HUB[0] + c * EX, HUB[1] + c * EY, HUB[2] + s);
};
function paintAnnotation(kit, g, pal) {
  g.save();
  g.setLineDash([6, 6]);
  g.strokeStyle = kit.rgba(pal[2], 0.3);
  g.lineWidth = 1.3;
  g.beginPath();
  for (let k = 0; k <= 96; k++) {
    const q = rotorPt((k / 96) * TAU, R);
    if (k) g.lineTo(q[0], q[1]);
    else g.moveTo(q[0], q[1]);
  }
  g.stroke();
  g.restore();
}
/** Dimension line + label (per frame, so drifting clouds pass behind it). */
function drawDimension(kit, g, pal, ldx = 0, ldy = 0) {
  g.save();
  // dimension line in the rotor plane, R + 32 m to the side
  const off = R + 32;
  const at = (b, z) => P(HUB[0] - b * EX, HUB[1] - b * EY, HUB[2] + z);
  const top = rotorPt(Math.PI / 2, R);
  const bot = rotorPt(-Math.PI / 2, R);
  const lt = at(off + 8, R);
  const lb = at(off + 8, -R);
  g.setLineDash([3, 4]);
  g.strokeStyle = kit.rgba(pal[2], 0.45);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(top[0], top[1]);
  g.lineTo(lt[0], lt[1]);
  g.moveTo(bot[0], bot[1]);
  g.lineTo(lb[0], lb[1]);
  g.stroke();
  g.setLineDash([]);
  const d0 = at(off, R);
  const d1 = at(off, -R);
  g.strokeStyle = pal[2];
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(d0[0], d0[1]);
  g.lineTo(d1[0], d1[1]);
  g.stroke();
  g.fillStyle = pal[2];
  for (const [p, s] of [
    [d0, 1],
    [d1, -1],
  ]) {
    g.beginPath();
    g.moveTo(p[0], p[1]);
    g.lineTo(p[0] - 5, p[1] + 13 * s);
    g.lineTo(p[0] + 5, p[1] + 13 * s);
    g.fill();
  }
  g.restore();
  g.drawImage(labelSprite(kit, pal), Math.round(d0[0] - 166 + ldx), Math.round(d0[1] - 130 + ldy));
  // leader from the card to the top arrow
  g.strokeStyle = kit.rgba(pal[2], 0.6);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(d0[0] - 8 + ldx, d0[1] - 22 + ldy);
  g.lineTo(d0[0], d0[1] - 4);
  g.stroke();
}
function labelSprite(kit, pal) {
  return kit.bake(ID + '_label_en_v1', 200, 130, (g) => paintLabel(kit, g, pal));
}
function paintLabel(kit, g, pal) {
  // label card, skewed into the rotor plane (its horizontal follows -E on screen)
  const ex = -(EX - EY) * KX;
  const ey = -(EX + EY) * KY;
  const el = Math.hypot(ex, ey);
  const ax = ex / el;
  const ay = ey / el;
  g.save();
  g.translate(8, 8);
  g.transform(ax, ay, 0, 1, 0, 0);
  const w = 150;
  const h = 70;
  // soft shadow and extruded edge
  g.fillStyle = 'rgba(43,45,66,0.12)';
  g.fillRect(6, 9, w, h);
  g.fillStyle = tone('white', 0.12);
  g.beginPath();
  g.moveTo(w, 0);
  g.lineTo(w + 5, 4);
  g.lineTo(w + 5, h + 4);
  g.lineTo(5, h + 4);
  g.lineTo(0, h);
  g.lineTo(w, h);
  g.closePath();
  g.fill();
  g.fillStyle = '#fdfdfe';
  g.fillRect(0, 0, w, h);
  g.fillStyle = pal[1];
  g.fillRect(0, 0, 5, h);
  g.fillStyle = pal[2];
  g.textBaseline = 'alphabetic';
  fitFont(g, 'Rotor diameter over', 700, 15, 126, kit.FONT.sans);
  g.fillText('Rotor diameter over', 16, 25);
  g.fillStyle = pal[4];
  g.font = `800 32px ${kit.FONT.sans}`;
  g.fillText('310 m', 15, 60);
  g.restore();
}

// ---------------------------------------------------------------------------------------------
// world bake
// ---------------------------------------------------------------------------------------------
function paintWorld(kit, g, pal, Rg) {
  g.fillStyle = pal[0];
  g.fillRect(Rg.x0, Rg.y0, Rg.x1 - Rg.x0, Rg.y1 - Rg.y0);
  paintTiles(g, pal, Rg);
  paintSite(g);
  paintShadows(g);
  // objects back to front (by X + Y)
  const objs = [
    { v: SUB.x + SUB.y, f: () => substation(g) },
    { v: PYLONS[0][0] + PYLONS[0][1], f: () => pylon(g, ...PYLONS[0]) },
    { v: PYLONS[1][0] + PYLONS[1][1], f: () => pylon(g, ...PYLONS[1]) },
    { v: 0, f: () => tower(g) },
    { v: PAD.x0 + PAD.y0 + 20, f: () => truck(g, PAD.x0 + 4, PAD.y0 + 6, true) },
    { v: PAD.x0 + PAD.y0 + 21, f: () => box(g, PAD.x0 + 14, PAD.y0 + 22, 0, 6, 2.6, 2.6, 'roof') },
  ];
  for (const h of HOUSES) objs.push({ v: h[0] + h[1] + h[3], f: () => house(g, h) });
  // a few low-poly trees between the houses
  for (const [X, Y] of [
    [66, -72],
    [100, -40],
    [56, -14],
  ])
    objs.push({ v: X + Y, f: () => shrub(g, X, Y, 6) });
  // tiny people on the hardstand, by the houses and at the substation (scale)
  const people = [
    [40, -22, '#f08a5d'],
    [42, -19, '#3a4a6b'],
    [38, -16, '#f08a5d'],
    [45, -12, '#fdfdfe'],
    [26, -11, '#3a4a6b'],
    [45, -33, '#f08a5d'],
    [64, -26, '#3a4a6b'],
    [SUB.x + 16, SUB.y + 28, '#f08a5d'],
  ];
  people.forEach(([X, Y, col], k) => objs.push({ v: X + Y + 0.1, f: () => person(g, X, Y, col, k) }));
  objs.sort((a, b) => a.v - b.v);
  for (const o of objs) o.f();
  powerLines(g);
  paintDike(g, pal, Rg);
  paintAnnotation(kit, g, pal);
}

// ---------------------------------------------------------------------------------------------
// the 1887 card (baked sprite, sails per frame)
// ---------------------------------------------------------------------------------------------
const CARD = { w: 300, h: 250, cx: 150, cy: 96, k: 6.2, n: 18 };
const P2 = (x, y, z) => [CARD.cx + (x - y) * 0.8660254 * CARD.k, CARD.cy + (x + y) * 0.5 * CARD.k - z * CARD.k];
const MILL = { x: 5.2, y: 11.5, top: 9.6 };
function fill2(g, pts3, col) {
  fillPoly(
    g,
    pts3.map((q) => P2(q[0], q[1], q[2])),
    col,
    0.5,
  );
}
function box2(g, X0, Y0, Z0, w, d, h, mat) {
  const X1 = X0 + w;
  const Y1 = Y0 + d;
  const Z1 = Z0 + h;
  fill2(g, [[X0, Y1, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X0, Y1, Z1]], tone(mat, T_LEFT));
  fill2(g, [[X1, Y0, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X1, Y0, Z1]], tone(mat, T_RIGHT));
  fill2(g, [[X0, Y0, Z1], [X1, Y0, Z1], [X1, Y1, Z1], [X0, Y1, Z1]], tone(mat, T_TOP));
}
function paintCard(kit, g, pal) {
  const n = CARD.n;
  const th = 3.4;
  // slab sides
  fill2(g, [[0, n, -th], [n, n, -th], [n, n, 0], [0, n, 0]], tone('earth', T_LEFT));
  fill2(g, [[n, 0, -th], [n, n, -th], [n, n, 0], [n, 0, 0]], tone('earth', 0.2));
  // strata line
  g.strokeStyle = 'rgba(43,45,66,0.25)';
  g.lineWidth = 1;
  g.beginPath();
  let q = P2(0, n, -1.1);
  g.moveTo(q[0], q[1]);
  q = P2(n, n, -1.1);
  g.lineTo(q[0], q[1]);
  q = P2(n, 0, -1.1);
  g.lineTo(q[0], q[1]);
  g.stroke();
  // grass top, faceted 3 m tiles
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++) {
      const x0 = i * 3;
      const y0 = j * 3;
      const jit = h21(i * 3.1, j * 1.9) - 0.5;
      const base = mix('#a6c391', '#8fb27d', h21(i, j * 2));
      fill2(g, [[x0, y0, 0], [x0 + 3, y0, 0], [x0 + 3, y0 + 3, 0]], mix(base, '#ffffff', 0.08 + 0.05 * jit));
      fill2(g, [[x0, y0, 0], [x0 + 3, y0 + 3, 0], [x0, y0 + 3, 0]], mix(base, '#2b3a2a', 0.06));
    }
  // garden path
  fill2(g, [[9, 10.5, 0.02], [10.6, 10.5, 0.02], [10.6, 18, 0.02], [9, 18, 0.02]], '#d8cdb8');
  // shadows
  g.save();
  g.filter = 'blur(1.2px)';
  g.fillStyle = 'rgba(43,45,66,0.18)';
  const sp = (x, y, z) => P2(x + SHX * z, y + SHY * z, 0);
  path(g, hull([P2(7, 3, 0), P2(16, 3, 0), P2(16, 10, 0), P2(7, 10, 0), sp(7, 3, 7.5), sp(16, 3, 7.5), sp(16, 10, 7.5), sp(7, 10, 7.5)]));
  g.fill();
  path(g, hull([P2(MILL.x - 1.6, MILL.y - 1.6, 0), P2(MILL.x + 1.6, MILL.y + 1.6, 0), sp(MILL.x, MILL.y, MILL.top)]));
  g.fill();
  g.restore();
  // a low-poly tree at the back corner
  const tb = P2(3, 3, 0);
  fillPoly(g, [[tb[0] - 1.5, tb[1]], [tb[0] + 1.5, tb[1]], [tb[0] + 1.5, tb[1] - 10], [tb[0] - 1.5, tb[1] - 10]], tone('timber', 0.4));
  fillPoly(g, [[tb[0], tb[1] - 44], [tb[0] - 13, tb[1] - 8], [tb[0], tb[1] - 4]], tone('tree', 0.62));
  fillPoly(g, [[tb[0], tb[1] - 44], [tb[0], tb[1] - 4], [tb[0] + 13, tb[1] - 8]], tone('tree', 0.22));
  // stone cottage: 1½ storeys, slate roof, gable chimneys (ridge along X)
  const X0 = 7;
  const Y0 = 3;
  const W = 9;
  const D = 6.4;
  const WH = 4.4;
  const RH = 3.2;
  box2(g, X0, Y0, 0, W, D, WH, 'stone');
  const ym = Y0 + D / 2;
  fill2(g, [[X0 - 0.3, Y0 - 0.3, WH], [X0 + W + 0.3, Y0 - 0.3, WH], [X0 + W + 0.3, ym, WH + RH], [X0 - 0.3, ym, WH + RH]], tone('slate', 0.35));
  fill2(g, [[X0 + W, Y0, WH], [X0 + W, Y0 + D, WH], [X0 + W, ym, WH + RH]], tone('stone', T_RIGHT));
  fill2(g, [[X0 - 0.3, ym, WH + RH], [X0 + W + 0.3, ym, WH + RH], [X0 + W + 0.3, Y0 + D + 0.3, WH], [X0 - 0.3, Y0 + D + 0.3, WH]], tone('slate', 0.62));
  box2(g, X0 - 0.2, ym - 0.6, WH + RH - 0.8, 1.2, 1.2, 2.2, 'stone');
  box2(g, X0 + W - 1, ym - 0.6, WH + RH - 0.8, 1.2, 1.2, 2.2, 'stone');
  // lit windows (the cottage that wind-electric lamps lit) and the door
  for (const wx of [X0 + 1.4, X0 + 6.4]) fill2(g, [[wx, Y0 + D, 1.3], [wx + 1.3, Y0 + D, 1.3], [wx + 1.3, Y0 + D, 3.1], [wx, Y0 + D, 3.1]], '#ffd27a');
  fill2(g, [[X0 + 3.9, Y0 + D, 0], [X0 + 5.1, Y0 + D, 0], [X0 + 5.1, Y0 + D, 2.6], [X0 + 3.9, Y0 + D, 2.6]], '#5a412f');
  // timber trestle: four legs to the head, two levels of braces
  g.strokeStyle = tone('timber', 0.35);
  g.lineWidth = 1.6;
  g.beginPath();
  const legs = [
    [-1.7, -1.7],
    [1.7, -1.7],
    [1.7, 1.7],
    [-1.7, 1.7],
  ];
  for (const [lx, ly] of legs) {
    const a = P2(MILL.x + lx, MILL.y + ly, 0);
    const b = P2(MILL.x + lx * 0.2, MILL.y + ly * 0.2, MILL.top - 0.4);
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
  }
  g.stroke();
  g.lineWidth = 1;
  g.beginPath();
  for (const z of [2.6, 5.6]) {
    const s = 1.7 * (1 - (0.8 * z) / MILL.top);
    const c = legs.map(([lx, ly]) => P2(MILL.x + (lx / 1.7) * s, MILL.y + (ly / 1.7) * s, z));
    g.moveTo(c[0][0], c[0][1]);
    for (let k = 1; k <= 4; k++) g.lineTo(c[k % 4][0], c[k % 4][1]);
  }
  g.stroke();
  // head box
  box2(g, MILL.x - 0.6, MILL.y - 0.6, MILL.top - 0.6, 1.2, 1.2, 1.2, 'timber');
  // wire from the mill to the cottage on a pole
  const w0 = P2(MILL.x, MILL.y, MILL.top - 1.5);
  const pole = P2(8.6, 12.2, 4.6);
  const w1 = P2(X0 + 1, Y0 + D, WH - 0.4);
  const pb = P2(8.6, 12.2, 0);
  g.strokeStyle = tone('timber', 0.3);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(pb[0], pb[1]);
  g.lineTo(pole[0], pole[1]);
  g.stroke();
  g.strokeStyle = 'rgba(43,45,66,0.7)';
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(w0[0], w0[1]);
  g.quadraticCurveTo((w0[0] + pole[0]) / 2, (w0[1] + pole[1]) / 2 + 3, pole[0], pole[1]);
  g.quadraticCurveTo((pole[0] + w1[0]) / 2, (pole[1] + w1[1]) / 2 + 2, w1[0], w1[1]);
  g.stroke();
  // dry-stone dyke along the front-right edge
  for (let k = 0; k < 7; k++) box2(g, n - 1.1, 0.6 + k * 2.4, 0, 1, 2.2, 0.9 + 0.15 * h11(k), 'stone');
  // lettering skewed onto the slab faces
  g.save();
  const lf = P2(2.2, n, -0.4);
  g.translate(lf[0], lf[1]);
  g.transform(0.8660254, 0.5, 0, 1, 0, 0);
  g.fillStyle = '#fdf6ea';
  g.font = `800 18px ${kit.FONT.sans}`;
  g.textBaseline = 'alphabetic';
  g.fillText('1887', 0, 0);
  g.restore();
  g.save();
  // on the darker right face, baseline low enough that the glyphs clear the stone dyke on top
  const rf = P2(n, n - 1.4, -2.75);
  g.translate(rf[0], rf[1]);
  g.transform(0.8660254, -0.5, 0, 1, 0, 0);
  fitFont(g, 'Cloth-sail mill', 700, 15, 92, kit.FONT.sans);
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(43,45,66,0.55)';
  g.lineWidth = 2.2;
  g.strokeText('Cloth-sail mill', 0, 0);
  g.fillStyle = '#fdf6ea';
  g.fillText('Cloth-sail mill', 0, 0);
  g.restore();
  void pal;
}
function drawSails(ctx, T, ox, oy) {
  // four cloth sails on lattice frames, face-on (in the plane of Z and the screen horizontal)
  const hx = MILL.x + 0.9;
  const hy = MILL.y + 0.9;
  const hz = MILL.top;
  const ux = 0.7071;
  const uy = -0.7071;
  const at = (a, r, o) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    // radial (c, s) and tangential (-s, c) in the sail plane
    const rr = c * r - s * o;
    const zz = s * r + c * o;
    const q = P2(hx + ux * rr, hy + uy * rr, hz + zz);
    return [ox + q[0], oy + q[1]];
  };
  const base = -T * 2.1;
  for (let k = 0; k < 4; k++) {
    const a = base + (k * TAU) / 4;
    const pts = [at(a, 0.9, 0), at(a, 4.4, 0), at(a, 4.4, 1.5), at(a, 1.1, 0.9)];
    const shade = 0.55 + 0.4 * Math.cos(a * 1 + 0.6);
    fillPoly(ctx, pts, tone('sail', shade));
    ctx.strokeStyle = tone('timber', 0.4);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    const s0 = at(a, 0, 0);
    const s1 = at(a, 4.6, 0);
    ctx.moveTo(s0[0], s0[1]);
    ctx.lineTo(s1[0], s1[1]);
    for (const r of [2.1, 3.3]) {
      const l0 = at(a, r, 0);
      const l1 = at(a, r, 1.3);
      ctx.moveTo(l0[0], l0[1]);
      ctx.lineTo(l1[0], l1[1]);
    }
    ctx.stroke();
  }
  const c = at(0, 0, 0);
  ctx.fillStyle = tone('timber', 0.2);
  ctx.beginPath();
  ctx.arc(c[0], c[1], 1.8, 0, TAU);
  ctx.fill();
}

// ---------------------------------------------------------------------------------------------
// per-frame layers
// ---------------------------------------------------------------------------------------------
function cloudSprite(kit, k) {
  return kit.bake(`${ID}_cloud${k}_v1`, 180, 80, (g) => {
    const blobs = [
      [52, 50, 26],
      [86, 38, 32],
      [122, 50, 24],
      [70, 54, 22],
      [104, 56, 22],
    ];
    const sc = k === 1 ? 0.8 : k === 2 ? 0.65 : 1;
    g.translate(90 * (1 - sc), 60 * (1 - sc));
    g.scale(sc, sc);
    for (const [x, y, r] of blobs) {
      const poly = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + k;
        poly.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85]);
      }
      fillPoly(g, poly, '#ffffff');
    }
    // flat underside in shade
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#d3dce8';
    g.fillRect(0, 56, 180, 30);
    g.fillStyle = '#e9eef5';
    g.beginPath();
    g.moveTo(90, 0);
    g.lineTo(180, 0);
    g.lineTo(180, 56);
    g.lineTo(110, 56);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'source-over';
  });
}
function drawClouds(kit, ctx, T, Rg) {
  const span = Rg.x1 - Rg.x0 + 400;
  const C = [
    [120, 52, 0],
    [610, 26, 1],
    [900, 150, 2],
    [-300, 110, 1],
  ];
  for (const [x0, y, k] of C) {
    const x = Rg.x0 - 200 + pmod(x0 - Rg.x0 + 200 + T * 7, span);
    ctx.drawImage(cloudSprite(kit, k), Math.round(x - 90), y);
  }
}

let glintCache = null;
function glints(Rg) {
  const key = Rg.x0 + ',' + Rg.x1;
  if (glintCache && glintCache.key === key) return glintCache.list;
  const list = [];
  const umin = (Rg.x0 - OX) / KX;
  const umax = (Rg.x1 - OX) / KX;
  for (let k = 0; list.length < 46 && k < 400; k++) {
    const u = lerp(umin, umax, h11(k * 3.7 + 1));
    const vs = vShore(u);
    const v = lerp(-760, vs - 30, h11(k * 5.3 + 2));
    if (v > vs - 30) continue;
    const q = P((u + v) / 2, (v - u) / 2, -3);
    if (q[1] < Rg.y0 + 10) continue;
    list.push([q[0], q[1], h11(k * 9.1), 0.6 + 0.8 * h11(k * 2.2)]);
  }
  glintCache = { key, list };
  return list;
}
function drawGlints(ctx, T, Rg) {
  ctx.fillStyle = '#ffffff';
  const bk = [new Path2D(), new Path2D(), new Path2D()];
  for (const [x, y, ph, sz] of glints(Rg)) {
    const a = Math.sin(T * 2.2 + ph * TAU);
    if (a < 0.2) continue;
    const pa = bk[Math.min(2, Math.floor(((a - 0.2) / 0.8) * 3))];
    const w = 7 * sz * (0.5 + 0.5 * a);
    const dx = Math.sin(T * 0.6 + ph * 9) * 3;
    pa.moveTo(x + dx - w, y);
    pa.lineTo(x + dx, y - 1.6);
    pa.lineTo(x + dx + w, y);
    pa.lineTo(x + dx, y + 1.6);
    pa.closePath();
  }
  bk.forEach((pa, i) => {
    ctx.globalAlpha = 0.3 + 0.27 * i;
    ctx.fill(pa);
  });
  ctx.globalAlpha = 1;
}

/** Blade geometry for this frame: per blade, station points (LE, ridge, TE) in 3D. */
function bladeGeom(T) {
  const out = [];
  const phi0 = Math.PI / 2 + T * OMEGA;
  for (let k = 0; k < 3; k++) {
    const phi = phi0 + (k * TAU) / 3;
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    // radial rho, tangential tau (direction of motion), axis D (upwind)
    const rho = [c * EX, c * EY, s];
    const tau = [-s * EX, -s * EY, c];
    const st = [];
    for (let [rf, ch, tk, twd] of ST) {
      const tw = twd * DEG;
      const ct = Math.cos(tw);
      const stw = Math.sin(tw);
      const cd = [ct * tau[0] + stw * DX, ct * tau[1] + stw * DY, ct * tau[2]];
      const nd = [ct * DX - stw * tau[0], ct * DY - stw * tau[1], -stw * tau[2]];
      const r = rf * R;
      const C = [HUB[0] + rho[0] * r, HUB[1] + rho[1] * r, HUB[2] + rho[2] * r];
      ch *= CHORD_X;
      const t = ch * tk;
      st.push([
        [C[0] + cd[0] * ch * 0.35, C[1] + cd[1] * ch * 0.35, C[2] + cd[2] * ch * 0.35],
        [C[0] - cd[0] * ch * 0.1 + nd[0] * t, C[1] - cd[1] * ch * 0.1 + nd[1] * t, C[2] - cd[2] * ch * 0.1 + nd[2] * t],
        [C[0] - cd[0] * ch * 0.65, C[1] - cd[1] * ch * 0.65, C[2] - cd[2] * ch * 0.65],
      ]);
    }
    out.push(st);
  }
  return out;
}
function drawBladeShadows(ctx, geom) {
  ctx.fillStyle = 'rgba(43,45,66,0.13)';
  ctx.strokeStyle = 'rgba(43,45,66,0.06)';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  for (const st of geom) {
    ctx.beginPath();
    for (let i = 0; i < st.length; i++) {
      const q = SP(st[i][0][0], st[i][0][1], st[i][0][2]);
      if (i) ctx.lineTo(q[0], q[1]);
      else ctx.moveTo(q[0], q[1]);
    }
    for (let i = st.length - 1; i >= 0; i--) {
      const q = SP(st[i][2][0], st[i][2][1], st[i][2][2]);
      ctx.lineTo(q[0], q[1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // hub shadow
  const h = SP(HUB[0], HUB[1], HUB[2]);
  ctx.beginPath();
  ctx.ellipse(h[0], h[1], 12, 5, 0, 0, TAU);
  ctx.fill();
}
function drawBlades(ctx, geom, pal) {
  const nrm = (a, b, c, d) => {
    const ux = c[0] - a[0];
    const uy = c[1] - a[1];
    const uz = c[2] - a[2];
    const vx = d[0] - b[0];
    const vy = d[1] - b[1];
    const vz = d[2] - b[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    if (nx + ny + nz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    return tone('white', litN(nx, ny, nz));
  };
  for (const st of geom) {
    const n = st.length;
    const pr = st.map((q) => [P(q[0][0], q[0][1], q[0][2]), P(q[1][0], q[1][1], q[1][2]), P(q[2][0], q[2][1], q[2][2])]);
    // silhouette first (mid tone, slate edge): hides the hairline seams between facets
    ctx.beginPath();
    for (let i = 0; i < n; i++) ctx[i ? 'lineTo' : 'moveTo'](pr[i][0][0], pr[i][0][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(pr[i][2][0], pr[i][2][1]);
    ctx.closePath();
    ctx.fillStyle = tone('white', 0.62);
    ctx.fill();
    ctx.strokeStyle = 'rgba(58,74,107,0.34)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    for (let i = 0; i < n - 1; i++) {
      const a = st[i];
      const c = st[i + 1];
      const A = pr[i];
      const C = pr[i + 1];
      ctx.fillStyle = nrm(a[0], c[0], c[1], a[1]);
      ctx.beginPath();
      ctx.moveTo(A[0][0], A[0][1]);
      ctx.lineTo(C[0][0], C[0][1]);
      ctx.lineTo(C[1][0], C[1][1]);
      ctx.lineTo(A[1][0], A[1][1]);
      ctx.fill();
      ctx.fillStyle = nrm(a[1], c[1], c[2], a[2]);
      ctx.beginPath();
      ctx.moveTo(A[1][0], A[1][1]);
      ctx.lineTo(C[1][0], C[1][1]);
      ctx.lineTo(C[2][0], C[2][1]);
      ctx.lineTo(A[2][0], A[2][1]);
      ctx.fill();
    }
  }
  void pal;
}
function drawSpinner(ctx, T) {
  const n = 8;
  const rot = T * OMEGA;
  const a0 = ROT_A - 4;
  const tipA = ROT_A + 7;
  const rr = 5.6;
  const base = [];
  for (let k = 0; k < n; k++) {
    const t = rot + (k / n) * TAU;
    const c = Math.cos(t) * rr;
    const s = Math.sin(t) * rr;
    base.push([a0 * DX + c * EX, a0 * DY + c * EY, HUB_Z + s]);
  }
  const tip = [tipA * DX, tipA * DY, HUB_Z];
  for (let k = 0; k < n; k++) face3(ctx, [base[k], base[(k + 1) % n], tip], 'white', false, 0.7);
}

function drawTruck(ctx, T, chapterSec) {
  const u = clamp01((T + 0.6 * chapterSec) / (2.2 * chapterSec));
  const e = u * u * (3 - 2 * u);
  const Y = lerp(ROAD_Y1 - 6, PAD.y1 + 2, e);
  const g = ctx;
  // soft contact shadow
  const a = P(ROADX[0] + 2.6, Y + 1, 0);
  g.fillStyle = 'rgba(43,45,66,0.18)';
  g.beginPath();
  g.ellipse(a[0] - 6, a[1] + 6, 14, 3.5, -0.52, 0, TAU);
  g.fill();
  truck(g, ROADX[0] + 1.4, Y, true);
}

function drawPeople(ctx, T) {
  // two people strolling on the hardstand, a step cycle on the beat
  for (let k = 0; k < 2; k++) {
    const t = T * 0.9 + k * 3.1;
    const X = 22 + 14 * (0.5 + 0.5 * Math.sin(t * 0.35 + k));
    const Y = -34 + k * 7 + 3 * Math.sin(t * 0.21 + 2 * k);
    const [x, y] = P(X, Y, 0);
    const bob = Math.abs(Math.sin(t * 6)) * 0.6;
    ctx.fillStyle = 'rgba(43,45,66,0.25)';
    ctx.fillRect(x, y - 0.6, 3.2, 1.2);
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(x - 1, y - 2.2 - bob, 2, 2.2);
    ctx.fillStyle = k ? '#3a4a6b' : '#f08a5d';
    ctx.fillRect(x - 1.2, y - 4.8 - bob, 2.4, 2.8);
    ctx.fillStyle = '#fdfdfe';
    ctx.fillRect(x - 0.9, y - 6.3 - bob, 1.8, 1.6);
  }
}

function drawGulls(ctx, T) {
  for (let k = 0; k < 3; k++) {
    const t = T * (0.42 + 0.05 * k) + k * 2.1;
    const x = 430 + 86 * Math.cos(t) + k * 24;
    const y = 214 + 26 * Math.sin(t) + k * 18;
    const f = Math.sin(T * 7.5 + k * 1.9);
    const dir = -Math.sin(t) >= 0 ? 1 : -1;
    const sp = 9;
    // body
    ctx.fillStyle = '#fdfdfe';
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 1.6, 0, 0, TAU);
    ctx.fill();
    // wings: two facets each (upper lit, under side in shade)
    fillPoly(ctx, [[x - 1, y], [x - sp, y - 5 * f - 1], [x - sp * 0.45, y - 2.5 * f + 1.5]], f > 0 ? '#fdfdfe' : '#c9d1dd');
    fillPoly(ctx, [[x + 1, y], [x + sp, y - 5 * f - 1], [x + sp * 0.45, y - 2.5 * f + 1.5]], f > 0 ? '#dfe5ee' : '#b3bdcc');
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(x - sp - 0.5, y - 5 * f - 1.6, 2, 1.2);
    ctx.fillRect(x + sp - 1.5, y - 5 * f - 1.6, 2, 1.2);
    ctx.fillStyle = '#f08a5d';
    ctx.fillRect(x + 3.6 * dir - (dir < 0 ? 1.6 : 0), y - 0.5, 1.6, 1);
  }
}

// --- bar-3 beat: grid connection -------------------------------------------------------------
function drawBeat(kit, ctx, p, T, pal) {
  const b = p.beat.barSec;
  const t0 = 2 * b; // downbeat of bar 3: the pulse leaves the nacelle
  const tArr = 2.5 * b; // beat 3: it reaches the substation
  if (T < t0) return;
  const g = ctx;
  // the lit face of the tower glows coral from the nacelle down as the pulse descends, so the
  // descent reads above the rider's band even while the foot of the tower is hidden
  {
    const s = clamp01((T - t0) / (tArr - t0));
    const e = s * s * (3 - 2 * s);
    const sTop = DOWN_META.segs[0] / DOWN_META.tot;
    const sBot = sTop + DOWN_META.segs[1] / DOWN_META.tot;
    const fade = 1 - clamp01((T - tArr) / (1.2 * b));
    if (e > sTop && fade > 0) {
      const q = polyAt(DOWN_PATH, DOWN_META, Math.min(e, sBot));
      const top = DOWN_PATH[1];
      g.save();
      g.lineCap = 'round';
      g.strokeStyle = kit.rgba(pal[1], 0.28 * fade);
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(top[0], top[1]);
      g.lineTo(q[0], q[1]);
      g.stroke();
      g.strokeStyle = kit.rgba(pal[1], 0.9 * fade);
      g.lineWidth = 2.4;
      g.stroke();
      g.restore();
    }
  }
  // travelling pulse with a short trail
  if (T < tArr + 0.1 * b) {
    const s = clamp01((T - t0) / (tArr - t0));
    const e = s * s * (3 - 2 * s);
    for (let k = 5; k >= 0; k--) {
      const q = polyAt(DOWN_PATH, DOWN_META, e - k * 0.025);
      g.fillStyle = kit.rgba(pal[1], 0.25 + 0.12 * (5 - k));
      g.beginPath();
      g.arc(q[0], q[1], 2 + (5 - k) * 0.35, 0, TAU);
      g.fill();
    }
    const q = polyAt(DOWN_PATH, DOWN_META, e);
    g.fillStyle = pal[1];
    g.strokeStyle = '#fdfdfe';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(q[0], q[1], 5.5, 0, TAU);
    g.fill();
    g.stroke();
    // the hub rings as the pulse leaves (downbeat accent): a ring in the rotor plane
    const fl = 1 - clamp01((T - t0) / (0.45 * b));
    if (fl > 0) {
      const rr = 12 + 90 * (1 - fl);
      g.strokeStyle = kit.rgba(pal[1], fl);
      g.lineWidth = 3;
      g.beginPath();
      for (let k = 0; k <= 24; k++) {
        const qq = rotorPt((k / 24) * TAU, rr);
        if (k) g.lineTo(qq[0], qq[1]);
        else g.moveTo(qq[0], qq[1]);
      }
      g.stroke();
    }
  }
  const on = T >= tArr ? 1 : 0;
  if (!on) return;
  const since = T - tArr;
  // energised cable and line: dashes flowing away from the turbine
  g.save();
  g.setLineDash([4, 10]);
  g.lineDashOffset = -T * 38;
  g.strokeStyle = kit.rgba(pal[1], 0.85);
  g.lineWidth = 2;
  g.beginPath();
  const cablePts = DOWN_PATH.slice(2);
  cablePts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
  g.stroke();
  g.lineWidth = 1.6;
  g.beginPath();
  for (let i = 0; i < LINE_PATH.length - 1; i++) {
    const a = LINE_PATH[i];
    const c = LINE_PATH[i + 1];
    if (!i) g.moveTo(a[0], a[1]);
    g.quadraticCurveTo((a[0] + c[0]) / 2, (a[1] + c[1]) / 2 + (i === 2 ? 9 : 7), c[0], c[1]);
  }
  g.stroke();
  g.restore();
  // substation lamp + ping ring (iso ellipse on the ground)
  const pulse = p.isThumbnail ? 0 : p.beat.pulse(0.45);
  kit.glow(g, SUB_LAMP[0], SUB_LAMP[1], 14 + 10 * pulse, '#ffd27a', 0.9);
  g.fillStyle = pal[1];
  g.beginPath();
  g.arc(SUB_LAMP[0], SUB_LAMP[1], 3.4, 0, TAU);
  g.fill();
  g.fillStyle = '#fff3d6';
  g.beginPath();
  g.arc(SUB_LAMP[0], SUB_LAMP[1], 1.6, 0, TAU);
  g.fill();
  if (since < 1.2 * b && !p.isThumbnail) {
    const r = 10 + since * 60;
    const c = P(SUB.x + SUB.w / 2, SUB.y + SUB.d / 2, 0);
    g.strokeStyle = kit.rgba(pal[1], clamp01(1 - since / (1.2 * b)) * 0.8);
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(c[0], c[1], r * 1.73, r, 0, 0, TAU);
    g.stroke();
  }
  // house windows light one per beat
  const bs = p.beat.beatSec;
  WINDOWS.forEach((ws, hi) => {
    const tOn = tArr + (hi % 3) * bs * 0.5 + Math.floor(hi / 3) * bs;
    if (T < tOn) return;
    for (const w of ws) {
      g.fillStyle = '#ffd27a';
      g.beginPath();
      g.moveTo(w[0] - 1.6, w[1] - 1.6);
      g.lineTo(w[0] + 1.6, w[1] - 0.7);
      g.lineTo(w[0] + 1.6, w[1] + 2.2);
      g.lineTo(w[0] - 1.6, w[1] + 1.3);
      g.fill();
      kit.glow(g, w[0], w[1], 8, '#ffb347', 0.55);
    }
  });
  // the tag pops up over the substation, skewed onto the left-face plane
  const sc = p.isThumbnail ? 1 : backOut(clamp01(since / (0.3 * b)));
  const anchor = P(SUB.x + 8, SUB.y + 10, 10);
  const tx = 214;
  const ty = 392;
  g.save();
  g.strokeStyle = pal[2];
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(anchor[0], anchor[1]);
  g.lineTo(lerp(anchor[0], tx + 40, sc), lerp(anchor[1], ty + 50, sc));
  g.stroke();
  g.fillStyle = pal[2];
  g.beginPath();
  g.arc(anchor[0], anchor[1], 2.6, 0, TAU);
  g.fill();
  g.translate(tx + 40, ty + 50);
  g.scale(sc, sc);
  g.translate(-40, -50);
  g.transform(0.8660254, 0.5, 0, 1, 0, 0);
  const w = 168;
  const h = 56;
  g.fillStyle = 'rgba(43,45,66,0.14)';
  g.fillRect(6, 10, w, h);
  // extruded edge (thickness)
  g.fillStyle = '#c96a43';
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(w, h);
  g.lineTo(w + 4, h + 5);
  g.lineTo(4, h + 5);
  g.closePath();
  g.fill();
  g.fillStyle = pal[1];
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#fdfdfe';
  g.textBaseline = 'alphabetic';
  if (!tagFont) {
    fitFont(g, 'Grid connected', 800, 20, w - 22, kit.FONT.sans);
    tagFont = g.font;
  }
  g.font = tagFont;
  g.fillText('Grid connected', 12, 27);
  g.font = `700 15px ${kit.FONT.mono}`;
  g.fillText('2025.10.29', 12, 47);
  g.restore();
}

// --- foreground (marsh in front of the dike) -------------------------------------------------
function drawFore(kit, ctx, T, pal, Rg) {
  // ripples on the drainage channel
  const cy = OY + (DK.v2 + 9) * KY + 2 * K;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = Math.floor(Rg.x0 / 70) * 70; x < Rg.x1; x += 70) {
    const xx = x + pmod(T * 12 + h11(x) * 70, 70) - 35;
    const yy = cy + (h11(x * 0.3) - 0.5) * 6;
    ctx.moveTo(xx, yy);
    ctx.lineTo(xx + 12, yy);
  }
  ctx.stroke();
  // egrets in the marsh, pecking
  for (let k = 0; k < 3; k++) {
    const X = [168, 230, 132][k];
    const Y = [-30, 20, 108][k];
    const [x, y] = P(X, Y, 0);
    const peck = Math.max(0, Math.sin(T * 2.4 + k * 2)) ** 6;
    ctx.fillStyle = 'rgba(43,45,66,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + 4, y, 6, 1.6, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x - 1, y);
    ctx.lineTo(x - 0.5, y - 6);
    ctx.moveTo(x + 1.5, y);
    ctx.lineTo(x + 1, y - 6);
    ctx.stroke();
    fillPoly(ctx, [[x - 5, y - 9], [x + 4, y - 12], [x + 4, y - 6], [x - 3, y - 6]], '#fdfdfe');
    fillPoly(ctx, [[x - 5, y - 9], [x - 3, y - 6], [x + 4, y - 6]], '#d6dde8');
    const hx = x + 4 + peck * 3;
    const hy = y - 12 - 6 * (1 - peck) + peck * 6;
    ctx.strokeStyle = '#fdfdfe';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 11);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.fillStyle = '#f1c27a';
    ctx.fillRect(hx, hy - 0.5, 4, 1);
  }
  // tall reed clumps along the bottom edge, swaying (fastest layer): 8 baked sway phases,
  // cross-faded, so the clumps move smoothly without re-drawing a hundred blades every frame
  const ph = pmod((T * 1.7) / TAU, 1) * REED_PH;
  const k0 = Math.floor(ph);
  const f = ph - k0;
  const s0 = reedStrip(kit, Rg, k0);
  const s1 = reedStrip(kit, Rg, (k0 + 1) % REED_PH);
  ctx.drawImage(s0.img, s0.x, s0.y);
  ctx.globalAlpha = f;
  ctx.drawImage(s1.img, s1.x, s1.y);
  ctx.globalAlpha = 1;
}
const REED_PH = 8;
function reedStrip(kit, Rg, k) {
  const baseY = Math.max(986, Math.min(Rg.y1 - 8, 1060));
  const x0 = Math.floor(Rg.x0 / 46) * 46 - 46;
  const x1 = Math.ceil(Rg.x1 / 46) * 46 + 92;
  const y0 = baseY - 100;
  const img = kit.bake(`${ID}_reeds${k}_v1_${x0}_${x1}`, x1 - x0, 116, (g) => {
    g.translate(-x0, -y0);
    const a = (k / REED_PH) * TAU;
    for (let x = x0 + 46; x < x1 - 46; x += 46) {
      const j = h11(x * 0.37);
      const bx = x + j * 30;
      const by = baseY + (h11(x * 0.11) - 0.5) * 18;
      const sw = Math.sin(a + bx * 0.013) * 4 + Math.sin(2 * a + bx * 0.05) * 1.5;
      for (let kk = 0; kk < 5; kk++) {
        const hgt = 38 + 34 * h11(x + kk * 7.7);
        const ox = (kk - 2) * 4.2;
        const tx = bx + ox + sw * (0.6 + 0.2 * kk) + (kk - 2) * 3;
        const ty = by - hgt;
        fillPoly(g, [[bx + ox - 3, by], [tx, ty], [bx + ox + 2.6, by]], kk % 2 ? '#c4af78' : '#9a8656');
        if (kk === 1 || kk === 3) fillPoly(g, [[tx - 2.2, ty + 6], [tx, ty - 1], [tx + 2.2, ty + 6], [tx, ty + 13]], '#7c6a44');
      }
    }
  });
  return { img, x: x0, y: y0 };
}

const riderStyle = (p, pal) => ({
  plumage: '#fdfdfe',
  plumageShade: '#cfd6e1',
  breast: '#f6d9a8',
  crest: '#f3d39a',
  frame: pal[1],
  frameShade: '#c96a43',
  metal: pal[2],
  tire: pal[4],
  rim: '#dfe4ec',
  saddle: pal[4],
  outline: pal[4],
  outlineWidth: 1.1,
  shading: true,
  spokes: 8,
  prop: { type: p.prop.type, colors: [pal[1], pal[2]] },
});

export function render(kit, ctx, p) {
  const b = p.beat.barSec;
  const T = p.isThumbnail ? 3.5 * b : p.rawLocalT; // thumbnail: connected, calm
  const pal = p.palette && p.palette.length >= 5 ? p.palette : DEFAULT_PAL;
  const L = kit.layout(p);
  const Rg = { x0: L.x0 ?? 0, x1: L.x1 ?? S, y0: L.y0 ?? 0, y1: L.y1 ?? S };
  ctx.save();
  const world = kit.bake(ID + '_world_v2', p.W, p.H, (g) => {
    g.save();
    g.translate(L.x, L.y);
    g.scale(L.s, L.s);
    paintWorld(kit, g, pal, Rg);
    g.restore();
  });
  ctx.drawImage(world, 0, 0);
  ctx.translate(L.x, L.y);
  ctx.scale(L.s, L.s);

  // back: clouds and sea glints
  drawClouds(kit, ctx, T, Rg);
  drawGlints(ctx, T, Rg);
  // mid: rotor shadows, traffic, the beat, the rotor itself
  const geom = bladeGeom(T);
  drawBladeShadows(ctx, geom);
  drawTruck(ctx, T, p.chapterSec);
  drawPeople(ctx, T);
  drawBeat(kit, ctx, p, T, pal);
  drawBlades(ctx, geom, pal);
  drawSpinner(ctx, T);
  // aviation light on the nacelle roof
  ctx.fillStyle = '#8f2a22';
  ctx.fillRect(NAC_LIGHT[0] - 1.5, NAC_LIGHT[1] - 1.5, 3, 3);
  if (pmod(T, 1.5) < 0.45) {
    kit.glow(ctx, NAC_LIGHT[0], NAC_LIGHT[1], 8, '#ff3b2e', 0.5);
    ctx.fillStyle = '#e0392b';
    ctx.fillRect(NAC_LIGHT[0] - 1.5, NAC_LIGHT[1] - 1.5, 3, 3);
  }
  drawGulls(ctx, T);
  // easel: the board's safe area starts lower, so the label drops below its top edge
  if (p.stage === 'easel') drawDimension(kit, ctx, pal, -30, 28);
  else drawDimension(kit, ctx, pal);
  // the 1887 card, floating
  const bob = p.isThumbnail ? 0 : Math.sin(T * 1.3) * 4;
  const cardImg = kit.bake(ID + '_card_en_v1', CARD.w, CARD.h, (g) => paintCard(kit, g, pal));
  const cx = 6;
  const cy = 18 + bob;
  const shImg = kit.bake(ID + '_cardsh_v1', 260, 140, (g) => {
    g.filter = 'blur(7px)';
    g.fillStyle = 'rgba(43,45,66,0.2)';
    path(g, [[130, 22], [230, 70], [130, 118], [30, 70]]);
    g.fill();
  });
  ctx.globalAlpha = 0.85 - bob * 0.05;
  ctx.drawImage(shImg, cx + CARD.cx - 130 + 36, 236);
  ctx.globalAlpha = 1;
  ctx.drawImage(cardImg, cx, cy);
  drawSails(ctx, T, cx, cy);

  if (p.actor && p.actor.visible) {
    const rx = p.riderLocalX ?? -1e4;
    ctx.fillStyle = 'rgba(43,45,66,0.22)';
    ctx.beginPath();
    ctx.ellipse(rx + 14, 703, 86, 6, 0, 0, TAU);
    ctx.fill();
    p.actor.draw(ctx, p.actor.rig(), riderStyle(p, pal));
  }
  drawFore(kit, ctx, T, pal, Rg);
  ctx.restore();
}
