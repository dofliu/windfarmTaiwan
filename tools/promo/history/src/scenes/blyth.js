// src/scenes/blyth.js
// Chapter "blyth" · 1887 · 布萊斯的布帆風車.
//
// Medium: 維多利亞木口版畫 (Victorian popular-science wood engraving), lightly hand-coloured.
// Tells: the whole picture is cut as WHITE-LINE tone — black ground with parallel white lines
// whose width sets the tone (thin = dark sky at the top, wide = the bright break at the
// horizon); a dramatic engraved sky with lit cloud tops and dark undersides and a fan of
// crepuscular rays; trees as black masses flecked with short white cuts; ruled plate border;
// a small inset figure with its own label (the accumulators) as in popular-science journals;
// a period caption set under the block; a thin, slightly off-register watercolour wash
// (multiply) laid over cream stock — warm, so it differs from the grey newsreel that follows.
//
// Scene (fact sheet "Visual facts"): Professor James Blyth's stone-built holiday cottage at
// Marykirk (1½ storeys, gable chimneys, wallhead dormers, slate roof, white sash windows) and
// in its garden a timber trestle windmill with four cloth sails on lattice frames — drawn as
// a generic wooden frame with cloth sails whose plane is seen obliquely (a slanted ellipse,
// shaft hidden in the head frame) so neither a horizontal nor a vertical shaft reads strongly
// (the sources do not settle it). Two wires run on a pole from the mill to the
// cottage; the inset shows a row of glass accumulator jars on a shelf with hanging lamps.
// The professor, in frock coat and top hat, stands in the garden behind a dry-stone dyke.
// No capacity figures. Depth: back = engraved sky, drifting cloud wisps, rooks, distant
// Mearns farmland and kirk; mid = cottage (chimney smoke), mill (sails turning), professor;
// fore = the dyke, gravel lane and a verge of grasses and thistles swaying in the wind.
//
// Story beat (bar 3): the wind has freshened through bar 2 and the sails race; on the downbeat
// of bar 3 the cottage lamps come on (a flicker, then steady): every window turns from black
// glass to warm light with the little bulbs showing, the inset's lamps light with engraved
// rays, and the professor turns his whole figure from the mill to the cottage door and raises
// his hat high. The lamps stay lit after.
//
// Deterministic: no Math.random / Date — kit.makePRNG / kit.hash11 / kit.noise*. Static
// layers are baked once with kit.bake: the plate (incl. the inset figure and the caption) and
// the cloud strip. The sails are drawn live as vector paths each frame.

export const meta = { stages: ['gallery-ride', 'easel'] };
const ID = 'blyth';

const S = 1000;
const ROAD = 700;
const TAU = Math.PI * 2;
const BX0 = 34;
const BY0 = 34;
const BX1 = 966;
const BY1 = 872; // engraved block; caption set below it
const PITCH = 4; // white-line pitch of the sky (integer, so drifting clouds stay on the same rows)

const PAPER = '#efe9dc';
const INK = '#151413';
const INK2 = '#2d2a26';
const RED = '#8a3b2a';
const LAMP = '#f6d27a';

const HUB = { x: 664, y: 284 };
const SAIL_R = 212;
// oblique view of the sail plane: squash by ROT_K along the image direction ROT_D
const ROT_D = -0.7;
const ROT_K = 0.55;
const ROT_M = (() => {
  const dc = Math.cos(ROT_D);
  const ds = Math.sin(ROT_D);
  const q = 1 - ROT_K;
  return [1 - q * dc * dc, -q * dc * ds, -q * dc * ds, 1 - q * ds * ds];
})();
const COT = { x0: 92, x1: 398, base: 646, eave: 524, ridge: 430 };
const DYKE = 656; // top of the dry-stone dyke
const POLE_X = 470;
const PROF_X = 300; // in front of the cottage, clear of the rider during bar 3
const INSET = { x: 54, y: 54, w: 262, h: 176 };

const WINDOWS = [
  { x: 126, y: 562, w: 48, h: 54, rows: 3 },
  { x: 316, y: 562, w: 48, h: 54, rows: 3 },
  { x: 172, y: 474, w: 26, h: 36, rows: 2 },
  { x: 294, y: 474, w: 26, h: 36, rows: 2 },
];
const FANLIGHT = { x: 230, y: 552, w: 30, h: 9 };

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ss = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
/** Quadratic curve as a 3-segment polyline (continues the current path from x0, y0). */
function quad3(ctx, x0, y0, cx, cy, x1, y1) {
  for (const t of [1 / 3, 2 / 3, 1]) {
    const u = 1 - t;
    ctx.lineTo(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1);
  }
}

// -----------------------------------------------------------------------------
// white-line engraving (bake time): ink ground cut by paper lines whose width = tone
// -----------------------------------------------------------------------------
function engrave(g, box, o) {
  const { x, y, w, h } = box;
  const pitch = o.pitch || 4;
  const a = o.angle || 0;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const step = o.step || 5;
  const wob = o.wobble ?? 0.4;
  const cx = x + w / 2;
  const cy = y + h / 2;
  let umin = 1e9;
  let umax = -1e9;
  let vmin = 1e9;
  let vmax = -1e9;
  for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    const dx = px - cx;
    const dy = py - cy;
    const u = dx * ca + dy * sa;
    const v = -dx * sa + dy * ca;
    umin = Math.min(umin, u);
    umax = Math.max(umax, u);
    vmin = Math.min(vmin, v);
    vmax = Math.max(vmax, v);
  }
  g.fillStyle = o.ink || INK;
  g.fillRect(x, y, w, h);
  g.fillStyle = o.paper || PAPER;
  let row = 0;
  for (let v = vmin - pitch; v <= vmax + pitch; v += pitch, row++) {
    const top = [];
    const bot = [];
    for (let u = umin - step; u <= umax + step; u += step) {
      const vv = v + wob * Math.sin(u * 0.031 + row * 1.7) + (o.warp ? o.warp(u, v) : 0);
      const px = cx + u * ca - vv * sa;
      const py = cy + u * sa + vv * ca;
      const t = clamp01(o.tone(px, py));
      const half = t * pitch * 0.52;
      top.push(px + sa * half, py - ca * half);
      bot.push(px - sa * half, py + ca * half);
    }
    g.beginPath();
    g.moveTo(top[0], top[1]);
    for (let i = 2; i < top.length; i += 2) g.lineTo(top[i], top[i + 1]);
    for (let i = bot.length - 2; i >= 0; i -= 2) g.lineTo(bot[i], bot[i + 1]);
    g.closePath();
    g.fill();
  }
}

/** Clip to a path, engrave inside it, then (optionally) outline it. */
function engraveShape(g, pathFn, box, o, outline = 0) {
  g.save();
  g.beginPath();
  pathFn(g);
  g.clip();
  engrave(g, box, o);
  g.restore();
  if (outline) {
    g.beginPath();
    pathFn(g);
    g.strokeStyle = INK;
    g.lineWidth = outline;
    g.stroke();
  }
}

/** Hand-colouring: a translucent multiply wash, slightly off the lines. */
function tint(g, pathFn, color, alpha, dx = 3, dy = -2) {
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = alpha;
  g.translate(dx, dy);
  g.beginPath();
  pathFn(g);
  g.fillStyle = color;
  g.fill();
  g.restore();
}

/** A squared timber, engraved: black body with a white highlight on the lit (right) side. */
function beam(g, x1, y1, x2, y2, w) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  let nx = dy / len;
  let ny = -dx / len;
  if (nx < 0 || (Math.abs(nx) < 0.2 && ny > 0)) {
    nx = -nx;
    ny = -ny;
  }
  g.lineCap = 'butt';
  g.strokeStyle = INK;
  g.lineWidth = w;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
  const o = w * 0.18;
  g.strokeStyle = PAPER;
  g.lineWidth = Math.max(0.8, w * 0.36);
  g.beginPath();
  g.moveTo(x1 + nx * o, y1 + ny * o);
  g.lineTo(x2 + nx * o, y2 + ny * o);
  g.stroke();
}

/** Foliage mass: black clump flecked with short white cuts, more on the lit upper right. */
function tree(g, kit, x, y, r, seed) {
  g.fillStyle = INK;
  g.beginPath();
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU;
    const rr = r * (0.55 + 0.25 * kit.hash11(seed + k));
    g.moveTo(x + Math.cos(a) * r * 0.55 + rr, y + Math.sin(a) * r * 0.45);
    g.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.45, rr, 0, TAU);
  }
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = Math.max(1.5, r * 0.12);
  g.beginPath();
  g.moveTo(x, y + r * 0.4);
  g.lineTo(x + 1, y + r * 1.3);
  g.stroke();
  g.strokeStyle = PAPER;
  g.lineWidth = 1;
  g.lineCap = 'round';
  const n = Math.round(r * 2.4);
  for (let i = 0; i < n; i++) {
    const a = kit.hash11(seed * 3.1 + i) * TAU;
    const d = Math.sqrt(kit.hash11(seed * 7.7 + i)) * r * 0.95;
    const fx = x + Math.cos(a) * d;
    const fy = y + Math.sin(a) * d * 0.85;
    const lit = (fx - x) / r - (fy - y) / r; // upper right is lit
    if (kit.hash11(seed + i * 1.9) > 0.35 + 0.35 * lit) continue;
    g.beginPath();
    g.moveTo(fx - 2, fy + 1);
    g.quadraticCurveTo(fx, fy - 1.5, fx + 2.4, fy + 0.6);
    g.stroke();
  }
}

// -----------------------------------------------------------------------------
// the plate (baked once)
// -----------------------------------------------------------------------------
function skyTone(kit) {
  const dens = (x, y) => {
    const band = ss(40, 120, y) * (1 - ss(330, 430, y));
    return ss(0.5, 0.62, kit.fbm2(x * 0.0036, y * 0.0105, 4, 11) + 0.08 * band - 0.05) * band;
  };
  return (x, y) => {
    const v = clamp01((y - BY0) / (560 - BY0));
    let t = 0.16 + 0.62 * Math.pow(v, 1.25);
    // bright break low on the right, behind the mill
    const br = Math.hypot((x - 860) / 340, (y - 470) / 150);
    t += 0.28 * (1 - ss(0.2, 1, br));
    // crepuscular rays fanning down from a sun hidden in the cloud at upper right
    const ang = Math.atan2(y - 250, x - 900);
    if (y > 250) {
      const ray = ss(0.55, 0.9, 0.5 + 0.5 * Math.sin(ang * 23 + 1.3));
      t += 0.16 * ray * ss(250, 360, y) * (1 - ss(520, 560, y));
    }
    const d = dens(x, y);
    if (d > 0.001) {
      const up = dens(x, y - 14);
      const dn = dens(x, y + 14);
      const tc = 0.5 + 0.5 * (1 - up) * d + 0.32 * dn - 0.3 * (1 - dn);
      t = mix(t, tc, d);
    }
    return t;
  };
}

const farRidge = (kit, x) => 508 - 30 * kit.fbm2(x * 0.0045, 3.1, 3, 5) - 14 * Math.sin(x * 0.006 + 1.2);
const nearRidge = (kit, x) => 566 - 16 * kit.fbm2(x * 0.007, 8.3, 3, 9);

function paintLand(kit, g) {
  // far hills (the Grampian edge beyond the Mearns): light, horizontal lines
  const far = (gg) => {
    gg.moveTo(BX0, 600);
    for (let x = BX0; x <= BX1; x += 8) gg.lineTo(x, farRidge(kit, x));
    gg.lineTo(BX1, 600);
    gg.closePath();
  };
  engraveShape(g, far, { x: BX0, y: 440, w: BX1 - BX0, h: 160 }, {
    pitch: 3.2,
    tone: (x, y) => 0.6 + 0.2 * ss(0, 1, (x - 500) / 400) - 0.25 * ss(0, 30, y - farRidge(kit, x)) * (0.5 + 0.5 * Math.sin(x * 0.02)),
  });
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  g.beginPath();
  for (let x = BX0; x <= BX1; x += 8) (x === BX0 ? g.moveTo : g.lineTo).call(g, x, farRidge(kit, x));
  g.stroke();
  // near farmland: fields in alternating furrow directions, hedgerows between
  const near = (gg) => {
    gg.moveTo(BX0, DYKE + 4);
    for (let x = BX0; x <= BX1; x += 8) gg.lineTo(x, nearRidge(kit, x));
    gg.lineTo(BX1, DYKE + 4);
    gg.closePath();
  };
  engraveShape(g, near, { x: BX0, y: 530, w: BX1 - BX0, h: DYKE - 526 }, {
    pitch: 3.4,
    angle: 0.0,
    tone: (x, y) => {
      const f = Math.floor((x + 0.6 * (y - 560)) / 150);
      const odd = f & 1;
      return 0.5 + 0.22 * odd + 0.12 * ss(560, 640, y) * (odd ? -1 : 1);
    },
    warp: (u, v) => 3 * Math.sin(u * 0.05 + v * 0.2),
  });
  // field wash (green / ripe barley ochre), off register
  for (let f = 0; f < 8; f++) {
    const x0 = BX0 + f * 150 - 60;
    tint(g, (gg) => {
      gg.moveTo(x0, 560);
      gg.lineTo(x0 + 150, 560);
      gg.lineTo(x0 + 90, DYKE + 4);
      gg.lineTo(x0 - 60, DYKE + 4);
      gg.closePath();
    }, f & 1 ? '#c9b26e' : '#93a76a', 0.42, 4, -2);
  }
  tint(g, far, '#8f9aa8', 0.32);
  // hedgerows and tree clumps
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.beginPath();
  for (let x = BX0; x <= BX1; x += 6) (x === BX0 ? g.moveTo : g.lineTo).call(g, x, nearRidge(kit, x) + 2 + 1.5 * Math.sin(x * 0.3));
  g.stroke();
  g.lineWidth = 2.2;
  g.beginPath();
  for (let x = BX0; x <= BX1; x += 6) (x === BX0 ? g.moveTo : g.lineTo).call(g, x, 608 + 0.05 * (x - 500) + 1.5 * Math.sin(x * 0.27));
  g.stroke();
  const trees = [
    [418, 552, 20], [446, 560, 14], [540, 548, 24], [790, 556, 18], [812, 548, 24], [940, 556, 16], [60, 560, 16], [770, 600, 13], [430, 604, 12],
  ];
  trees.forEach(([x, y, r], i) => tree(g, kit, x, y, r, 17 + i * 13));
  for (const [x, y, r] of trees) tint(g, (gg) => gg.arc(x, y, r * 0.95, 0, TAU), '#6f8a56', 0.4, 4, -3);
  // the village kirk on the rise, far right
  const kirk = (gg) => {
    gg.rect(866, 522, 16, 30);
    gg.moveTo(864, 522);
    gg.lineTo(874, 484);
    gg.lineTo(884, 522);
    gg.closePath();
    gg.rect(882, 532, 40, 20);
  };
  g.fillStyle = PAPER;
  g.beginPath();
  kirk(g);
  g.fill();
  g.save();
  g.beginPath();
  kirk(g);
  g.clip();
  kit.hatch(g, { x: 860, y: 480, w: 14, h: 80, spacing: 2.4, angle: Math.PI / 2, color: INK, width: 0.8, seed: ID + 'kirk' });
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 1.1;
  g.beginPath();
  kirk(g);
  g.stroke();
  g.beginPath();
  g.moveTo(880, 532);
  g.lineTo(902, 524);
  g.lineTo(924, 532);
  g.stroke();
}

function cottagePaths() {
  const wall = (gg) => gg.rect(COT.x0, COT.eave, COT.x1 - COT.x0, COT.base - COT.eave);
  const roof = (gg) => {
    gg.moveTo(COT.x0 - 8, COT.eave + 2);
    gg.lineTo(COT.x1 + 8, COT.eave + 2);
    gg.lineTo(COT.x1 + 2, COT.ridge);
    gg.lineTo(COT.x0 - 2, COT.ridge);
    gg.closePath();
  };
  const stacks = (gg) => {
    gg.rect(96, 388, 40, 44);
    gg.rect(354, 388, 40, 44);
  };
  const dormers = (gg) => {
    for (const dx of [164, 286]) {
      gg.moveTo(dx - 6, 466);
      gg.lineTo(dx + 21, 442);
      gg.lineTo(dx + 48, 466);
      gg.lineTo(dx + 42, 466);
      gg.lineTo(dx + 42, COT.eave);
      gg.lineTo(dx, COT.eave);
      gg.lineTo(dx, 466);
      gg.closePath();
    }
  };
  return { wall, roof, stacks, dormers };
}

function paintCottage(kit, g) {
  const P = cottagePaths();
  // roof: dark slates
  engraveShape(g, P.roof, { x: COT.x0 - 10, y: COT.ridge, w: COT.x1 - COT.x0 + 20, h: COT.eave - COT.ridge + 4 }, {
    pitch: 3.6,
    tone: (x, y) => 0.24 + 0.26 * ss(COT.x0, COT.x1 + 40, x) + 0.08 * Math.sin(y * 0.7),
  }, 2);
  // slate joints
  g.strokeStyle = INK;
  g.lineWidth = 0.9;
  for (let y = COT.ridge + 9, r = 0; y < COT.eave; y += 9, r++) {
    for (let x = COT.x0 + (r & 1 ? 6 : 0); x < COT.x1; x += 13) {
      g.beginPath();
      g.moveTo(x, y - 8);
      g.lineTo(x, y);
      g.stroke();
    }
  }
  // ridge cap
  g.fillStyle = PAPER;
  g.fillRect(COT.x0 - 2, COT.ridge - 4, COT.x1 - COT.x0 + 4, 6);
  g.lineWidth = 1.4;
  g.strokeRect(COT.x0 - 2, COT.ridge - 4, COT.x1 - COT.x0 + 4, 6);
  tint(g, P.roof, '#7c8b9a', 0.34);

  // walls: rubble masonry, right side catching the low sun
  engraveShape(g, P.wall, { x: COT.x0, y: COT.eave, w: COT.x1 - COT.x0, h: COT.base - COT.eave }, {
    pitch: 3.4,
    tone: (x, y) => 0.42 + 0.3 * ss(COT.x0, COT.x1, x) + 0.06 * Math.sin(x * 0.4 + y),
  });
  const rng = kit.makePRNG(kit.hashSeed('blyth-stones'));
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  for (let y = COT.eave + 12; y < COT.base; y += 12) {
    g.beginPath();
    g.moveTo(COT.x0, y);
    for (let x = COT.x0; x <= COT.x1; x += 10) g.lineTo(x, y + (rng() - 0.5) * 2.4);
    g.stroke();
    for (let x = COT.x0 + rng() * 20; x < COT.x1; x += 14 + rng() * 22) {
      g.beginPath();
      g.moveTo(x, y - 12);
      g.lineTo(x + (rng() - 0.5) * 3, y);
      g.stroke();
    }
  }
  // dressed quoins (light)
  g.fillStyle = PAPER;
  g.lineWidth = 1.2;
  for (let k = 0, y = COT.eave; y < COT.base; y += 14, k++) {
    const long = k & 1 ? 22 : 14;
    g.fillRect(COT.x0, y, long, 13);
    g.strokeRect(COT.x0, y, long, 13);
    g.fillRect(COT.x1 - long, y, long, 13);
    g.strokeRect(COT.x1 - long, y, long, 13);
  }
  tint(g, P.wall, '#c9a77c', 0.36, 4, -3);
  // chimney stacks at the gables, with copes and pots
  engraveShape(g, P.stacks, { x: 96, y: 386, w: 300, h: 48 }, { pitch: 3.4, tone: (x) => 0.36 + 0.3 * ss(96, 394, x) }, 1.8);
  for (const sx of [96, 354]) {
    g.fillStyle = PAPER;
    g.fillRect(sx - 3, 384, 46, 6);
    g.strokeRect(sx - 3, 384, 46, 6);
    for (const px of [sx + 8, sx + 24]) {
      g.fillStyle = INK2;
      g.fillRect(px, 370, 9, 14);
      g.fillStyle = PAPER;
      g.fillRect(px + 5, 371, 2, 12);
      g.strokeRect(px, 370, 9, 14);
    }
  }
  tint(g, P.stacks, '#c08a6a', 0.3);
  // wallhead dormers
  engraveShape(g, P.dormers, { x: 156, y: 440, w: 182, h: COT.eave - 440 }, {
    pitch: 3.2,
    tone: (x, y) => (y < 467 ? 0.3 : 0.62) + 0.1 * ss(150, 340, x),
  }, 1.8);
  tint(g, P.dormers, '#c9a77c', 0.3);

  // windows (dark glass now; lamps are drawn per frame): stone margins, white sashes
  for (const w of WINDOWS) {
    g.fillStyle = PAPER;
    g.fillRect(w.x - 5, w.y - 5, w.w + 10, w.h + 10);
    g.strokeStyle = INK;
    g.lineWidth = 1.2;
    g.strokeRect(w.x - 5, w.y - 5, w.w + 10, w.h + 10);
    g.fillRect(w.x - 8, w.y + w.h + 3, w.w + 16, 5); // sill
    g.strokeRect(w.x - 8, w.y + w.h + 3, w.w + 16, 5);
    g.fillStyle = INK;
    g.fillRect(w.x, w.y, w.w, w.h);
    // sky reflected in the panes: a few diagonal white cuts
    g.save();
    g.beginPath();
    g.rect(w.x, w.y, w.w, w.h);
    g.clip();
    g.strokeStyle = PAPER;
    g.lineWidth = 0.9;
    for (let k = -2; k < 4; k++) {
      g.beginPath();
      g.moveTo(w.x + k * 12, w.y + w.h);
      g.lineTo(w.x + k * 12 + w.h * 0.7, w.y);
      g.stroke();
    }
    g.restore();
    sashBars(g, w, PAPER, 2);
  }
  // door with fanlight
  engraveShape(g, (gg) => gg.rect(228, 556, 34, COT.base - 556), { x: 228, y: 556, w: 34, h: 90 }, {
    pitch: 3,
    angle: Math.PI / 2,
    tone: () => 0.28,
  }, 1.6);
  g.strokeStyle = PAPER;
  g.lineWidth = 1;
  g.strokeRect(233, 566, 10, 30);
  g.strokeRect(247, 566, 10, 30);
  g.strokeRect(233, 604, 10, 32);
  g.strokeRect(247, 604, 10, 32);
  tint(g, (gg) => gg.rect(228, 556, 34, COT.base - 556), RED, 0.55, 2, -1);
  g.fillStyle = INK;
  g.fillRect(FANLIGHT.x, FANLIGHT.y, FANLIGHT.w, FANLIGHT.h);
  g.fillStyle = PAPER;
  g.fillRect(224, 545, 42, 6);
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  g.strokeRect(224, 545, 42, 6);
  // climbing rose by the door
  tree(g, kit, 210, 616, 14, 501);
  tree(g, kit, 202, 590, 9, 503);
  tint(g, (gg) => gg.arc(208, 606, 18, 0, TAU), '#6f8a56', 0.45, 3, -2);
  g.fillStyle = '#b3473a';
  for (let i = 0; i < 9; i++) {
    g.globalAlpha = 0.85;
    g.beginPath();
    g.arc(198 + kit.hash11(i * 3.3) * 26, 586 + kit.hash11(i * 5.1) * 40, 2, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
  // bracket and insulators for the wires on the right gable
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(COT.x1 - 2, 500);
  g.lineTo(COT.x1 + 10, 500);
  g.moveTo(COT.x1 - 2, 510);
  g.lineTo(COT.x1 + 10, 510);
  g.stroke();
  for (const y of [497, 507]) {
    g.fillStyle = PAPER;
    g.fillRect(COT.x1 + 8, y - 3, 5, 6);
    g.strokeRect(COT.x1 + 8, y - 3, 5, 6);
  }
}

function sashBars(g, w, color, lw) {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  g.beginPath();
  g.moveTo(w.x + w.w / 2, w.y);
  g.lineTo(w.x + w.w / 2, w.y + w.h);
  for (let r = 1; r < w.rows * 2; r++) {
    const y = w.y + (w.h * r) / (w.rows * 2);
    if (r === w.rows) {
      g.moveTo(w.x, y);
      g.lineTo(w.x + w.w, y);
    } else if (w.rows > 2 && (r === 1 || r === 5)) {
      g.moveTo(w.x, y + (r === 1 ? 5 : -5));
      g.lineTo(w.x + w.w, y + (r === 1 ? 5 : -5));
    }
  }
  g.stroke();
}

function paintMill(kit, g) {
  // timber trestle: two rear legs (thin, further back), two front legs, girts, braces, ladder
  beam(g, 610, 660, 650, 312, 5);
  beam(g, 780, 660, 694, 312, 5);
  // side bracing between the right front and rear legs
  const legX = (x0, x1, y0, y1, y) => x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  const FL = (y) => legX(572, 642, 676, 312, y);
  const FR = (y) => legX(752, 686, 676, 312, y);
  const RR = (y) => legX(780, 694, 660, 312, y);
  const lv = [604, 520, 440, 370];
  for (let i = 0; i < lv.length - 1; i++) {
    const a = lv[i];
    const b = lv[i + 1];
    beam(g, FR(a), a, RR(b), b, 3);
  }
  beam(g, 572, 676, 642, 312, 11);
  beam(g, 752, 676, 686, 312, 11);
  for (let i = 0; i < lv.length; i++) beam(g, FL(lv[i]) + 4, lv[i], FR(lv[i]) - 4, lv[i], 7);
  for (let i = 0; i < lv.length - 1; i++) {
    const a = lv[i];
    const b = lv[i + 1];
    beam(g, FL(a) + 6, a, FR(b) - 5, b, 4.5);
    beam(g, FR(a) - 6, a, FL(b) + 5, b, 4.5);
  }
  // ladder up the middle
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(652, 676);
  g.lineTo(658, 316);
  g.moveTo(668, 676);
  g.lineTo(670, 316);
  g.stroke();
  g.lineWidth = 1.4;
  for (let y = 668; y > 320; y -= 13) {
    g.beginPath();
    g.moveTo(652 + ((676 - y) / 360) * 6, y);
    g.lineTo(668 + ((676 - y) / 360) * 2, y);
    g.stroke();
  }
  // platform and the head frame that carries the sail shaft
  beam(g, 620, 316, 712, 316, 8);
  g.strokeStyle = INK;
  g.lineWidth = 2;
  for (const x of [624, 646, 690, 708]) {
    g.beginPath();
    g.moveTo(x, 314);
    g.lineTo(x, 298);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(622, 299);
  g.lineTo(710, 299);
  g.stroke();
  engraveShape(g, (gg) => gg.rect(642, 258, 44, 54), { x: 642, y: 258, w: 44, h: 54 }, {
    pitch: 3,
    angle: Math.PI / 2,
    tone: (x) => 0.25 + 0.4 * ss(642, 686, x),
  }, 1.8);
  // timber wash
  tint(g, (gg) => {
    gg.moveTo(568, 678);
    gg.lineTo(640, 300);
    gg.lineTo(690, 300);
    gg.lineTo(784, 662);
    gg.closePath();
  }, '#b48a5a', 0.22, 4, -2);
  // insulators on the left leg for the two wires
  for (const y of [436, 448]) {
    const x = FL(y) - 6;
    g.fillStyle = PAPER;
    g.fillRect(x - 3, y - 3, 6, 7);
    g.strokeStyle = INK;
    g.lineWidth = 1.1;
    g.strokeRect(x - 3, y - 3, 6, 7);
  }
}

function paintPoleAndWires(kit, g) {
  beam(g, POLE_X, DYKE + 4, POLE_X + 2, 418, 7);
  beam(g, POLE_X - 22, 428, POLE_X + 24, 428, 5);
  const tops = [POLE_X - 18, POLE_X + 20];
  for (const x of tops) {
    g.fillStyle = PAPER;
    g.fillRect(x - 3, 419, 6, 8);
    g.strokeStyle = INK;
    g.lineWidth = 1.1;
    g.strokeRect(x - 3, 419, 6, 8);
  }
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  const sag = (x1, y1, x2, y2, s) => {
    g.beginPath();
    g.moveTo(x1, y1);
    g.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + s, x2, y2);
    g.stroke();
  };
  sag(COT.x1 + 12, 497, tops[0], 420, 22);
  sag(COT.x1 + 12, 507, tops[1], 420, 28);
  const FLx = (y) => 572 + ((642 - 572) * (y - 676)) / (312 - 676) - 6;
  sag(tops[0], 420, FLx(436), 434, 14);
  sag(tops[1], 420, FLx(448), 446, 12);
}

function paintDykeRoadVerge(kit, g) {
  const rng = kit.makePRNG(kit.hashSeed('blyth-dyke'));
  // the garden path from the door to the gate (light gravel)
  g.fillStyle = PAPER;
  g.fillRect(226, COT.base, 40, ROAD - COT.base);
  // dry-stone dyke along the lane: two courses of rounded stones + upright coping
  const courses = [[DYKE + 12, ROAD - 2], [DYKE + 2, DYKE + 14]];
  for (const [y0, y1] of courses) {
    let x = BX0 - 4;
    while (x < BX1) {
      const w = 14 + rng() * 22;
      if (!(x + w > 224 && x < 268)) {
        const h = y1 - y0;
        g.beginPath();
        g.ellipse(x + w / 2, y0 + h / 2, w / 2, h / 2 + 1, 0, 0, TAU);
        g.fillStyle = PAPER;
        g.fill();
        g.save();
        g.clip();
        kit.hatch(g, { x: x, y: y0 + h * 0.45, w: w, h: h, spacing: 2.2, angle: 0.25, color: INK, width: 0.8, seed: 'st' + x });
        g.restore();
        g.strokeStyle = INK;
        g.lineWidth = 1.3;
        g.beginPath();
        g.ellipse(x + w / 2, y0 + h / 2, w / 2, h / 2 + 1, 0, 0, TAU);
        g.stroke();
      }
      x += w;
    }
  }
  // coping: stones on edge
  g.strokeStyle = INK;
  for (let x = BX0; x < BX1; x += 5) {
    if (x > 222 && x < 270) continue;
    const top = DYKE - 6 - rng() * 2;
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(x, DYKE + 4);
    g.lineTo(x + 1, top);
    g.stroke();
  }
  // gate pillars with ball finials
  for (const px of [216, 266]) {
    engraveShape(g, (gg) => gg.rect(px, DYKE - 10, 12, ROAD - DYKE + 8), { x: px, y: DYKE - 12, w: 12, h: 60 }, {
      pitch: 2.6,
      tone: (x) => 0.35 + 0.5 * ss(px, px + 12, x),
    }, 1.4);
    g.fillStyle = PAPER;
    g.beginPath();
    g.arc(px + 6, DYKE - 15, 6, 0, TAU);
    g.fill();
    g.lineWidth = 1.3;
    g.stroke();
  }
  tint(g, (gg) => gg.rect(BX0, DYKE - 8, BX1 - BX0, ROAD - DYKE + 6), '#b9a582', 0.3, 2, -1);
  // the lane: pale gravel, fine lines, two ruts
  engrave(g, { x: BX0, y: ROAD - 1, w: BX1 - BX0, h: 42 }, { pitch: 3, tone: (x, y) => 0.86 + 0.08 * Math.sin(x * 0.05 + y), wobble: 0.6 });
  g.fillStyle = INK;
  for (let i = 0; i < 420; i++) g.fillRect(BX0 + rng() * (BX1 - BX0), ROAD + 2 + rng() * 36, 1.6, 1.2);
  g.strokeStyle = INK;
  g.lineWidth = 1.4;
  for (const ry of [714, 728]) {
    g.beginPath();
    for (let x = BX0; x <= BX1; x += 12) {
      const y = ry + Math.sin(x * 0.02) * 1.2;
      if (rng() < 0.2) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.lineWidth = 2.6;
  g.beginPath();
  g.moveTo(BX0, ROAD);
  g.lineTo(BX1, ROAD);
  g.stroke();
  // verge: dark, cut with white grass blades
  const vergeTop = (x) => 741 + 3 * Math.sin(x * 0.05) + 2 * Math.sin(x * 0.19);
  const verge = (gg) => {
    gg.moveTo(BX0, BY1);
    for (let x = BX0; x <= BX1; x += 6) gg.lineTo(x, vergeTop(x));
    gg.lineTo(BX1, BY1);
    gg.closePath();
  };
  engraveShape(g, verge, { x: BX0, y: 736, w: BX1 - BX0, h: BY1 - 736 }, {
    pitch: 3.2,
    angle: -0.06,
    tone: (x, y) => 0.32 - 0.16 * ss(760, 860, y) + 0.1 * Math.sin(x * 0.03),
  });
  g.save();
  g.beginPath();
  verge(g);
  g.clip();
  g.strokeStyle = PAPER;
  g.lineCap = 'round';
  for (let i = 0; i < 700; i++) {
    const x = BX0 + rng() * (BX1 - BX0);
    const y = 744 + Math.pow(rng(), 0.8) * (BY1 - 740);
    const len = 8 + rng() * 22 * (1 - (y - 744) / 300);
    const lean = (rng() - 0.4) * 0.6;
    g.lineWidth = 0.7 + rng() * 0.9;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + lean * len * 0.3, y - len * 0.6, x + lean * len, y - len);
    g.stroke();
  }
  // daisies and stones
  for (let i = 0; i < 40; i++) {
    const x = BX0 + rng() * (BX1 - BX0);
    const y = 752 + rng() * 100;
    g.fillStyle = PAPER;
    g.beginPath();
    g.arc(x, y, 2.4, 0, TAU);
    g.fill();
  }
  g.restore();
  tint(g, verge, '#7d9a55', 0.42, 3, -2);
  g.fillStyle = '#d9b44a';
  g.globalAlpha = 0.7;
  for (let i = 0; i < 40; i++) {
    g.beginPath();
    g.arc(BX0 + kit.hash11(i * 7.1) * (BX1 - BX0), 752 + kit.hash11(i * 3.7) * 100, 1.2, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
}

function paintPlate(kit, g, rng) {
  g.drawImage(kit.paper(ID + '_stock', S, S, { color: PAPER, grain: 0.05, blotches: 14, foxing: 14, vignette: 0.12 }), 0, 0);
  g.save();
  g.beginPath();
  g.rect(BX0, BY0, BX1 - BX0, BY1 - BY0);
  g.clip();
  // sky: white-line tint, dark at the top, a bright break and rays low on the right
  engrave(g, { x: BX0, y: BY0, w: BX1 - BX0, h: 560 - BY0 }, { pitch: PITCH, step: 4, tone: skyTone(kit), wobble: 0.3 });
  // hand colouring of the sky: cool slate above, warm evening low on the right
  g.save();
  g.globalCompositeOperation = 'multiply';
  let gr = g.createLinearGradient(0, BY0, 0, 420);
  gr.addColorStop(0, 'rgba(120,146,170,0.55)');
  gr.addColorStop(1, 'rgba(120,146,170,0)');
  g.fillStyle = gr;
  g.fillRect(BX0, BY0, BX1 - BX0, 400);
  gr = g.createRadialGradient(860, 470, 20, 860, 470, 480);
  gr.addColorStop(0, 'rgba(240,180,96,0.7)');
  gr.addColorStop(0.6, 'rgba(240,190,110,0.25)');
  gr.addColorStop(1, 'rgba(240,190,110,0)');
  g.fillStyle = gr;
  g.fillRect(BX0, 150, BX1 - BX0, 420);
  g.restore();
  paintLand(kit, g);
  paintCottage(kit, g);
  paintPoleAndWires(kit, g);
  paintMill(kit, g);
  paintDykeRoadVerge(kit, g);
  g.restore();
  // the inset figure (its bubbles and lamps are drawn per frame)
  g.save();
  g.translate(INSET.x, INSET.y);
  paintInset(kit, g);
  g.restore();
  // plate border: a strong rule and a hairline
  g.strokeStyle = INK;
  g.lineWidth = 2.6;
  g.strokeRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
  g.lineWidth = 0.8;
  g.strokeRect(BX0 - 5, BY0 - 5, BX1 - BX0 + 10, BY1 - BY0 + 10);
  // caption set under the block, as in a popular-science weekly
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `400 25px ${kit.FONT.engraving}`;
  if ('letterSpacing' in g) g.letterSpacing = '1.5px';
  g.fillText("PROFESSOR BLYTH'S WINDMILL AT MARYKIRK, KINCARDINESHIRE.", 500, 914);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  g.font = `400 20px ${kit.FONT.serif}`;
  g.fillText('布帆風車替蓄電池充電，供小屋照明 · 1887 年 7 月', 500, 950);
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(420, 926);
  g.lineTo(580, 926);
  g.stroke();
}

// -----------------------------------------------------------------------------
// sprites
// -----------------------------------------------------------------------------
function paintInset(kit, g) {
  const W = INSET.w;
  const H = INSET.h;
  g.fillStyle = PAPER;
  g.fillRect(-4, -4, W + 8, H + 32);
  // a dim room: vertical white-line tint
  engrave(g, { x: 0, y: 0, w: W, h: H }, { pitch: 3, angle: Math.PI / 2, tone: (x, y) => 0.26 + 0.18 * ss(0, H, y) + 0.1 * ss(0, W, x) });
  // shelf and brackets
  g.fillStyle = PAPER;
  g.fillRect(8, 128, W - 16, 10);
  g.strokeStyle = INK;
  g.lineWidth = 1.3;
  g.strokeRect(8, 128, W - 16, 10);
  g.lineWidth = 0.7;
  for (const y of [131, 134]) {
    g.beginPath();
    g.moveTo(12, y);
    g.lineTo(W - 12, y + 0.5);
    g.stroke();
  }
  for (const bx of [30, W - 30]) {
    g.fillStyle = PAPER;
    g.beginPath();
    g.moveTo(bx - 6, 138);
    g.lineTo(bx + 6, 138);
    g.lineTo(bx - 6, 162);
    g.closePath();
    g.fill();
    g.stroke();
  }
  // the row of glass accumulator jars, plates inside, wired in series
  for (let i = 0; i < 6; i++) {
    const x = 18 + i * 39;
    g.fillStyle = 'rgba(239,233,220,0.55)';
    g.beginPath();
    g.roundRect ? g.roundRect(x, 72, 30, 56, [2, 2, 5, 5]) : g.rect(x, 72, 30, 56);
    g.fill();
    g.fillStyle = 'rgba(200,190,160,0.6)';
    g.fillRect(x + 1, 86, 28, 41);
    g.fillStyle = INK;
    for (const px of [6, 13, 20]) g.fillRect(x + px, 80, 4, 44);
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.beginPath();
    g.roundRect ? g.roundRect(x, 72, 30, 56, [2, 2, 5, 5]) : g.rect(x, 72, 30, 56);
    g.stroke();
    g.strokeStyle = PAPER;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x + 3.5, 76);
    g.lineTo(x + 3.5, 124);
    g.stroke();
    g.fillStyle = INK;
    g.fillRect(x + 7, 63, 3, 10);
    g.fillRect(x + 21, 63, 3, 10);
    g.fillStyle = PAPER;
    g.fillRect(x + 7, 63, 3, 2);
    g.fillRect(x + 21, 63, 3, 2);
    if (i < 5) {
      g.strokeStyle = PAPER;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x + 22.5, 63);
      g.quadraticCurveTo(x + 31, 52, x + 39 + 8.5, 63);
      g.stroke();
    }
  }
  // leads up to the lamps
  g.strokeStyle = PAPER;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(26.5, 63);
  g.quadraticCurveTo(12, 40, 14, 4);
  g.moveTo(18 + 5 * 39 + 22.5, 63);
  g.quadraticCurveTo(W - 10, 40, W - 14, 4);
  g.moveTo(14, 4);
  g.lineTo(W - 14, 4);
  g.stroke();
  for (const bx of [96, 172]) {
    g.beginPath();
    g.moveTo(bx, 4);
    g.lineTo(bx, 30);
    g.stroke();
    drawBulb(g, bx, 40, 0);
  }
  tint(g, (gg) => gg.rect(8, 60, W - 16, 70), '#a9b7a0', 0.3, 0, 0);
  // inset border and label
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.strokeRect(0, 0, W, H);
  g.lineWidth = 0.7;
  g.strokeRect(-3.5, -3.5, W + 7, H + 7);
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `italic 400 15px ${kit.FONT.engraving}`;
  g.fillText('The Accumulators.', W / 2 - 34, H + 21);
  g.font = `400 13px ${kit.FONT.serif}`;
  g.fillText('蓄電池', W / 2 + 62, H + 20);
}

/** A pear-shaped carbon-filament lamp at (x, y); lit 0..1. */
function drawBulb(ctx, x, y, lit) {
  ctx.fillStyle = INK;
  ctx.fillRect(x - 3, y - 12, 6, 5);
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 7);
  ctx.quadraticCurveTo(x - 10, y - 2, x - 8, y + 4);
  ctx.arc(x, y + 4, 8, Math.PI, 0, true);
  ctx.quadraticCurveTo(x + 10, y - 2, x + 3, y - 7);
  ctx.closePath();
  ctx.fillStyle = lit > 0.01 ? '#fbeec0' : 'rgba(239,233,220,0.75)';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.strokeStyle = lit > 0.01 ? '#c0641e' : INK;
  ctx.lineWidth = lit > 0.01 ? 1.5 : 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 6);
  ctx.lineTo(x - 3, y + 2);
  ctx.quadraticCurveTo(x, y + 9, x + 3, y + 2);
  ctx.lineTo(x + 2, y - 6);
  ctx.stroke();
}

const CLOUD_W = 1300;
const CLOUD_H = 150;
const CLOUD_Y = 98; // ≡ BY0 (mod PITCH): the strip's rows sit on the sky's rows
const BLOBS = [
  [200, 72, 160, 26],
  [300, 58, 70, 30],
  [640, 60, 200, 26],
  [580, 50, 80, 30],
  [730, 110, 140, 18],
  [1080, 84, 140, 28],
  [1130, 70, 60, 30],
];

function paintClouds(kit, g) {
  // the drifting wisps only LIGHTEN the sky (wider white lines, tapering at the ends) and
  // darken their undersides with thin ink lines between the rows, so they sit in the plate
  const m = (x, y) => {
    let best = -1;
    for (const [cx, cy, rx, ry] of BLOBS) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      // flat-bottomed cumulus: rounder above, sharper below
      best = Math.max(best, 1 - dx * dx - (dy < 0 ? dy * dy * 0.8 : dy * dy * 1.6));
    }
    return best + 0.28 * (kit.fbm2(x * 0.01, y * 0.03, 3, 21) - 0.5);
  };
  const strip = (y, fn, color) => {
    let top = [];
    let bot = [];
    const flush = () => {
      if (top.length > 4) {
        g.fillStyle = color;
        g.beginPath();
        g.moveTo(top[0], top[1]);
        for (let i = 2; i < top.length; i += 2) g.lineTo(top[i], top[i + 1]);
        for (let i = bot.length - 2; i >= 0; i -= 2) g.lineTo(bot[i], bot[i + 1]);
        g.closePath();
        g.fill();
      }
      top = [];
      bot = [];
    };
    for (let x = 0; x <= CLOUD_W; x += 4) {
      const half = x > 8 && x < CLOUD_W - 8 ? fn(x) : 0;
      if (half > 0.05) {
        top.push(x, y - half);
        bot.push(x, y + half);
      } else flush();
    }
    flush();
  };
  for (let y = 2; y < CLOUD_H; y += PITCH) {
    // white lines (rows of the sky tint)
    strip(y, (x) => {
      const v = m(x, y);
      const body = clamp01(v * 3.2);
      const up = clamp01(m(x, y - 10) * 3);
      return body * (0.62 + 0.4 * up) * PITCH * 0.52;
    }, PAPER);
    // ink between the rows, heavier toward the flat underside
    const yi = y + PITCH / 2;
    strip(yi, (x) => {
      const v = m(x, yi);
      if (v <= 0) return 0;
      const dn = clamp01(m(x, yi + 12) * 3);
      return clamp01(v * 3) * (1 - dn) * PITCH * 0.36;
    }, INK);
  }
}

// -----------------------------------------------------------------------------
// animated parts
// -----------------------------------------------------------------------------
/** Sail angle: steady breeze, freshening through bar 2 (closed-form integral of a smoothstep ramp). */
function sailAngle(T, b) {
  const a = 0.8 * b;
  const c = 2 * b;
  const L = c - a;
  let I;
  if (T <= a) I = 0;
  else if (T >= c) I = L * 0.5 + (T - c);
  else {
    const x = (T - a) / L;
    I = L * (x * x * x - (x * x * x * x) / 2);
  }
  return 0.75 * T + 1.5 * I;
}

/**
 * The four cloth sails, drawn as engraved vectors (rotated sprites are slow on software GL):
 * whip (stock) with a white highlight, cloth on the trailing side shaded by lines along the
 * arm (heavy near the whip, fine where the cloth catches the light), sail bars, outer frame
 * and creases, a narrow leading board. Every part of all four sails goes in one path.
 */
function drawSails(kit, ctx, ang) {
  const cs = [];
  for (let k = 0; k < 4; k++) {
    const a = ang + (k * Math.PI) / 2;
    cs.push([Math.cos(a), Math.sin(a)]);
  }
  let c = 1;
  let s = 0;
  // the sail plane is seen obliquely (squashed along ROT_D), so the sweep is a slanted ellipse
  // that reads as neither a face-on (horizontal-shaft) rotor nor a flat carousel
  const X = (x, y) => HUB.x + ROT_M[0] * (x * c - y * s) + ROT_M[1] * (x * s + y * c);
  const Y = (x, y) => HUB.y + ROT_M[2] * (x * c - y * s) + ROT_M[3] * (x * s + y * c);
  const each = (fn) => {
    for (const [cc, sn] of cs) {
      c = cc;
      s = sn;
      fn();
    }
  };
  const poly = (pts) => {
    ctx.moveTo(X(pts[0][0], pts[0][1]), Y(pts[0][0], pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(X(pts[i][0], pts[i][1]), Y(pts[i][0], pts[i][1]));
    ctx.closePath();
  };
  const seg = (x1, y1, x2, y2) => {
    ctx.moveTo(X(x1, y1), Y(x1, y1));
    ctx.lineTo(X(x2, y2), Y(x2, y2));
  };
  const edge = (x) => -48 - ((x - 50) / 164) * 8; // outer edge of the cloth
  // cloth
  ctx.fillStyle = '#e7d8b4';
  ctx.beginPath();
  each(() => poly([[50, -5], [214, -5], [214, -56], [50, -48]]));
  ctx.fill();
  // dark band beside the whip, cut with white lines (white-line engraving)
  ctx.fillStyle = INK;
  ctx.beginPath();
  each(() => {
    poly([[50, -5], [214, -5], [214, -15], [50, -15]]);
    poly([[50, -46.5], [214, -54.5], [214, -57.5], [50, -49.5]]); // hemlath (outer bar)
    poly([[211.5, -57], [214.5, -57], [214.5, -4], [211.5, -4]]); // tip bar
    poly([[48.5, -49], [51.5, -49], [51.5, -4], [48.5, -4]]); // inner bar
    poly([[50, 3], [214, 3], [214, 12], [50, 12]]); // leading board
    poly([[10, -5], [224, -3], [224, 3], [10, 5]]); // whip
  });
  ctx.fill();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  each(() => {
    seg(52, -8.5, 212, -8.5);
    seg(52, -12, 212, -12);
    seg(14, -1.5, 222, -1);
    seg(54, 6, 210, 6);
  });
  ctx.stroke();
  // fine tone lines (lighter toward the middle of the cloth), sail bars and creases
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  each(() => {
    for (const y of [-18, -21.5, -25.5, -40, -43.5]) seg(52, y, 212, y);
    for (const y of [-30, -34.5]) {
      seg(52, y, 118, y);
      seg(152, y, 212, y);
    }
    for (let x = 77.3; x < 212; x += 27.3) seg(x, -15, x, edge(x));
    for (const [x0, x1] of [[70, 150], [110, 200], [150, 210]]) {
      const mx = (x0 + x1) / 2;
      ctx.moveTo(X(x0, -16), Y(x0, -16));
      ctx.lineTo(X(mx + 4, -29), Y(mx + 4, -29));
      ctx.lineTo(X(x1, -48), Y(x1, -48));
    }
  });
  ctx.stroke();
  // hub boss
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(HUB.x, HUB.y, 15 * ROT_K, 15, ROT_D, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(HUB.x, HUB.y, 10 * ROT_K, 10, ROT_D, -1.3, 0.4);
  ctx.stroke();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.ellipse(HUB.x, HUB.y, 3.2 * ROT_K, 3.2, ROT_D, 0, TAU);
  ctx.fill();
}

function drawSmoke(ctx, T, wind) {
  // peat / coal smoke from the gable chimneys: lobed puffs, lit above, hatched below
  for (const [cx, cy, ph] of [[112, 370, 0], [370, 370, 0.43]]) {
    for (let j = 0; j < 6; j++) {
      const age = (((T * 0.32 + j / 6 + ph) % 1) + 1) % 1;
      const x = cx + age * (70 + 70 * wind) + Math.sin(age * 6 + j) * 4;
      const y = cy - age * 62;
      const r = 4 + age * 14;
      ctx.globalAlpha = 0.92 * (1 - age) * ss(0, 0.08, age);
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(x - r * 0.5, y + r * 0.15, r * 0.7, 0, TAU);
      ctx.arc(x + r * 0.15, y - r * 0.2, r * 0.8, 0, TAU);
      ctx.arc(x + r * 0.7, y + r * 0.2, r * 0.6, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const yy = y + r * (0.35 + k * 0.17);
        const ww = r * (1.1 - k * 0.3);
        ctx.moveTo(x - ww + r * 0.1, yy);
        ctx.lineTo(x + ww + r * 0.1, yy);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawRooks(ctx, T) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(BX0, BY0, BX1 - BX0, 480);
  ctx.clip();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const span = 1100;
    const x = ((((T * (34 + i * 5) + i * 230) % span) + span) % span) - 60;
    const y = 300 + i * 22 + Math.sin(T * 0.9 + i * 2) * 10 - (i & 1) * 60;
    if (x < 330 && y < 260) continue; // keep the inset clear
    const f = Math.sin(T * 7 + i * 1.7);
    const s = 6 - (i % 3);
    ctx.beginPath();
    ctx.moveTo(x - s * 1.4, y - f * s * 0.8);
    ctx.quadraticCurveTo(x - s * 0.5, y - 1, x, y + 1);
    ctx.quadraticCurveTo(x + s * 0.5, y - 1, x + s * 1.4, y - f * s * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

/** Lamp state: off until bar 3, a flicker on the downbeat, then steady. */
function lampLevel(T, b, beat) {
  const t0 = 2 * b;
  if (T < t0) return 0;
  const k = T - t0;
  const q = beat;
  if (k < 0.14 * q) return 0.25 * ss(0, 0.05 * q, k); // first spark
  if (k < 0.24 * q) return mix(0.25, 0.05, ss(0.14 * q, 0.2 * q, k)); // dip
  if (k < 0.4 * q) return mix(0.05, 0.6, ss(0.24 * q, 0.3 * q, k)); // catches
  return mix(0.6, 1, ss(0.4 * q, 0.6 * q, k)); // steady
}

function drawLitWindows(kit, ctx, lit, glowPulse) {
  if (lit < 0.01) return;
  ctx.save();
  ctx.globalAlpha = lit;
  for (const w of [...WINDOWS, { ...FANLIGHT, rows: 1 }]) {
    ctx.fillStyle = LAMP;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(255,250,232,0.85)';
    ctx.fillRect(w.x + w.w * 0.18, w.y + w.h * 0.12, w.w * 0.64, w.h * 0.6);
    if (w.h > 20) {
      // the little lamps hanging inside
      const n = w.w > 40 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const bx = w.x + (w.w * (i + 1)) / (n + 1);
        ctx.strokeStyle = INK2;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(bx, w.y);
        ctx.lineTo(bx, w.y + w.h * 0.3);
        ctx.stroke();
        ctx.fillStyle = '#fffdf0';
        ctx.beginPath();
        ctx.arc(bx, w.y + w.h * 0.3 + 3, 3, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#c0641e';
        ctx.stroke();
      }
      sashBars(ctx, w, INK2, 1.8);
    }
  }
  ctx.restore();
  for (const w of WINDOWS) kit.glow(ctx, w.x + w.w / 2, w.y + w.h / 2, (w.w + 30) * (0.9 + 0.15 * glowPulse), '#ffcf6a', 0.4 * lit);
}

function drawInsetLive(kit, ctx, T, lit, pulse) {
  ctx.save();
  ctx.translate(INSET.x, INSET.y);
  // gas bubbles rising off the plates while the cells charge
  ctx.fillStyle = PAPER;
  for (let i = 0; i < 6; i++) {
    const x = 18 + i * 39;
    for (let j = 0; j < 4; j++) {
      const h = (i * 4 + j) * 1.37;
      const u = (((T * (0.5 + 0.3 * Math.sin(h)) + j / 4 + i * 0.13) % 1) + 1) % 1;
      const by = 124 - u * 36;
      const bx = x + 6 + ((j * 7 + i * 3) % 18) + Math.sin(T * 5 + h) * 1.2;
      const r = (1.1 + 0.5 * (j & 1)) * (1 - 0.5 * u);
      ctx.fillRect(bx - r, by - r, 2 * r, 2 * r);
    }
  }
  ctx.globalAlpha = 1;
  if (lit > 0.01) {
    for (const bx of [96, 172]) {
      kit.glow(ctx, bx, 44, 34 + 6 * pulse, '#ffd27a', 0.55 * lit);
      ctx.globalAlpha = lit;
      drawBulb(ctx, bx, 40, 1);
      // engraved rays of light
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU + 0.11;
        const r0 = 15;
        const r1 = 23 + 5 * pulse + (k & 1) * 6;
        ctx.moveTo(bx + Math.cos(a) * r0, 44 + Math.sin(a) * r0);
        ctx.lineTo(bx + Math.cos(a) * r1, 44 + Math.sin(a) * r1);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function topHat(ctx, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(-6.5, 0);
  ctx.lineTo(-7.5, -17);
  ctx.lineTo(7.5, -17);
  ctx.lineTo(6.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 2.6, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(3.5, -15);
  ctx.lineTo(3, -3);
  ctx.moveTo(-6.5, -4);
  ctx.lineTo(6.5, -4);
  ctx.stroke();
  ctx.restore();
}

function drawProfessor(kit, ctx, T, b, beat, thumb) {
  const X = PROF_X;
  const e = thumb ? 0 : kit.envelope(T, 2 * b, 2 * b + 0.5 * beat, 3 * b, 3 * b + beat);
  // the whole figure turns from the mill (facing right) to the cottage door (facing left) on the
  // downbeat of bar 3: a quick squash through edge-on, as a cut-out figure turning
  const tc = thumb ? 1 : Math.cos(Math.PI * ss(2 * b, 2 * b + 0.22 * beat, T));
  const dir = tc < 0 ? -1 : 1;
  const sx = dir * Math.max(0.22, Math.abs(tc));
  const bob = Math.sin(T * 2.2) * 0.6;
  const headY = 572 + bob;
  ctx.save();
  ctx.beginPath();
  ctx.rect(X - 70, 470, 140, DYKE - 6 - 470);
  ctx.clip();
  ctx.translate(X, 0);
  ctx.scale(sx, 1);
  ctx.translate(-X, 0);
  // trousers
  ctx.fillStyle = INK2;
  ctx.fillRect(X - 9, 640, 7, 56);
  ctx.fillRect(X + 2, 640, 7, 56);
  // frock coat with white-line highlights on the lit side
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(X - 11, 588 + bob);
  ctx.lineTo(X + 11, 588 + bob);
  ctx.lineTo(X + 16, 652);
  ctx.lineTo(X - 16, 652);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const dx of [5, 8, 11]) {
    ctx.moveTo(X + dx, 594 + bob);
    ctx.lineTo(X + dx + 3, 648);
  }
  ctx.stroke();
  // shirt front and collar
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.moveTo(X - 4, 588 + bob);
  ctx.lineTo(X, 602 + bob);
  ctx.lineTo(X + 4, 588 + bob);
  ctx.closePath();
  ctx.fill();
  // far arm hangs
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(X - 10, 594 + bob);
  ctx.lineTo(X - 14, 632);
  ctx.stroke();
  // head: bearded, turned toward the mill, later toward the cottage
  ctx.save();
  ctx.translate(X, headY);
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 9, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // hair at the back of the head and an ear, so the facing reads at a glance
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(-4.6, -2.5, 3.6, 6.2, 0.15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.ellipse(-1.6, 0, 1.7, 2.6, 0, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.quadraticCurveTo(-6, 15, 2, 16);
  ctx.quadraticCurveTo(8, 12, 7.5, 2);
  ctx.lineTo(4, 3);
  ctx.quadraticCurveTo(0, 6, -3, 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(7.2, -2);
  ctx.lineTo(10, 1.5);
  ctx.lineTo(7.2, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3.5, -2.5, 1.1, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-2, 8);
  ctx.lineTo(0, 13);
  ctx.moveTo(2, 7);
  ctx.lineTo(3, 12);
  ctx.stroke();
  ctx.restore();
  // near arm: gestures toward the sails, raises the hat high on the beat, then rests
  const point = { x: X + 30, y: 575 + 3 * Math.sin(T * 2.5) };
  const rest = { x: X + 14, y: 634 };
  const doff = { x: X + 20, y: 526 };
  const pre = thumb || T >= 2.5 * b ? rest : point;
  const hand = { x: mix(pre.x, doff.x, e), y: mix(pre.y, doff.y, e) };
  const sh = { x: X + 10, y: 594 + bob };
  const el = { x: (sh.x + hand.x) / 2 + 5, y: (sh.y + hand.y) / 2 + 5 };
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(sh.x, sh.y);
  ctx.quadraticCurveTo(el.x, el.y, hand.x, hand.y);
  ctx.stroke();
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, 2.6, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // top hat: on the head, or in the raised hand
  const onHead = { x: X, y: headY - 7 };
  const inHand = { x: hand.x, y: hand.y - 2 };
  const wave = 0.14 * Math.sin((T - 2 * b) * TAU * 1.4) * ss(0.6, 1, e);
  topHat(ctx, mix(onHead.x, inHand.x, e), mix(onHead.y, inHand.y, e), (-0.35 + wave) * e);
  ctx.restore();
}

// foreground grasses and thistles at the sides of the verge
let PLANTS = null;
function plants(kit) {
  if (PLANTS) return PLANTS;
  PLANTS = [];
  for (let i = 0; i < 18; i++) {
    const left = i < 9;
    const u = kit.hash11(i * 3.17 + 0.5);
    const x = left ? BX0 + 6 + u * 120 : BX1 - 6 - u * 120;
    const edge = 1 - u; // taller near the plate edge
    PLANTS.push({
      x,
      y: 850 + kit.hash11(i * 5.3) * 20,
      h: 90 + 170 * edge * kit.hash11(i * 7.9 + 2) + 30,
      lean: (left ? 1 : -1) * (0.1 + 0.2 * kit.hash11(i * 2.3)),
      ph: kit.hash11(i * 9.1) * TAU,
      kind: kit.hash11(i * 4.4 + 1) > 0.7 ? 1 : 0,
    });
  }
  return PLANTS;
}

function drawForeground(kit, ctx, T, wind) {
  // batched by style, straight segments only (curves and caps are the cost on software GL)
  const P = plants(kit).map((pl) => {
    const sway = Math.sin(T * (1.6 + wind) + pl.ph) * (0.05 + 0.06 * wind) + 0.03 * wind;
    return { ...pl, sway, tx: pl.x + (pl.lean + sway) * pl.h, ty: pl.y - pl.h, side: Math.sign(pl.lean) };
  });
  ctx.strokeStyle = INK;
  for (const kind of [0, 1]) {
    ctx.lineWidth = kind ? 2.6 : 1.8;
    ctx.beginPath();
    for (const pl of P) {
      if (pl.kind !== kind) continue;
      ctx.moveTo(pl.x, pl.y);
      quad3(ctx, pl.x, pl.y, pl.x + pl.lean * pl.h * 0.3, pl.y - pl.h * 0.55, pl.tx, pl.ty);
    }
    ctx.stroke();
  }
  // blades and grass seed heads
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const pl of P) {
    ctx.moveTo(pl.x, pl.y - 6);
    ctx.lineTo(pl.x + 9 * pl.side, pl.y - 38);
    ctx.lineTo(pl.x + 20 * pl.side + pl.sway * 40, pl.y - 70);
    if (pl.kind) continue;
    for (let k = 0; k < 3; k++) {
      const yy = pl.ty + k * 7;
      const xx = pl.tx - (pl.lean + pl.sway) * k * 7;
      ctx.moveTo(xx - 4, yy - 5);
      ctx.lineTo(xx, yy);
      ctx.lineTo(xx + 4, yy - 5);
    }
  }
  ctx.stroke();
  // thistle heads: black bulbs flecked white, purple tufts (hand-tinted)
  ctx.fillStyle = INK;
  ctx.beginPath();
  for (const pl of P) {
    if (!pl.kind) continue;
    const x = pl.tx;
    const y = pl.ty + 2;
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x + 6, y - 3);
    ctx.lineTo(x + 5, y + 5);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 5, y + 5);
    ctx.lineTo(x - 6, y - 3);
    ctx.closePath();
  }
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = PAPER;
  ctx.beginPath();
  for (const pl of P) {
    if (!pl.kind) continue;
    ctx.moveTo(pl.tx - 3, pl.ty + 4);
    ctx.lineTo(pl.tx + 2, pl.ty);
    ctx.moveTo(pl.tx - 1, pl.ty + 7);
    ctx.lineTo(pl.tx + 3, pl.ty + 4);
  }
  ctx.stroke();
  ctx.strokeStyle = '#7d5b8c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (const pl of P) {
    if (!pl.kind) continue;
    for (let k = -2; k <= 2; k++) {
      ctx.moveTo(pl.tx + k * 1.6, pl.ty - 4);
      ctx.lineTo(pl.tx + k * 3 + pl.sway * 20, pl.ty - 13);
    }
  }
  ctx.stroke();
}

const riderStyle = (p, pal) => ({
  plumage: '#f4efe2',
  plumageShade: pal[3],
  mask: INK,
  bill: INK,
  eyeRing: '#c99a3e',
  legs: INK2,
  crest: '#d8b25a',
  breast: '#e7c77c',
  frame: RED,
  frameShade: '#5e271c',
  metal: INK,
  tire: INK,
  rim: pal[3],
  saddle: INK2,
  outline: INK,
  outlineWidth: 2,
  shading: false,
  spokes: 12,
  prop: { type: p.prop.type, colors: ['#ead9b4', RED] },
});

export function render(kit, ctx, p) {
  const thumb = p.isThumbnail;
  const T = thumb ? p.chapterSec * 0.8 : p.rawLocalT; // thumbnail: lamps lit, hat back on
  const b = p.beat.barSec;
  const beat = p.beat.beatSec;
  const pal = p.palette && p.palette.length >= 5 ? p.palette : [PAPER, INK, RED, '#b9ad96', INK2];
  const wind = ss(0.8 * b, 2 * b, T); // the breeze freshens through bar 2
  const lit = thumb ? 1 : lampLevel(T, b, beat);
  const pulse = thumb ? 0 : p.beat.pulse(0.5);

  ctx.save();
  const L = kit.layout(p);
  const plate = kit.bake(ID + '_plate_v1', S, S, (g, rng) => paintPlate(kit, g, rng));
  ctx.drawImage(kit.wideBackdrop(ID + '_plate_v1', plate, p, { mode: 'edge', fill: 'corner', inset: 12 }), 0, 0);
  ctx.translate(L.x, L.y);
  ctx.scale(L.s, L.s);

  // back: cloud wisps drift across the engraved sky (same rows as the sky's white lines)
  const clouds = kit.bake(ID + '_clouds_v1', CLOUD_W, CLOUD_H, (g) => paintClouds(kit, g));
  // (only right of the inset, which covers the strip's rows on the left: no clip needed)
  const ox = Math.round((((T * 16) % CLOUD_W) + CLOUD_W) % CLOUD_W);
  for (const dx of [ox - CLOUD_W, ox]) {
    const x0 = Math.max(dx, INSET.x + INSET.w + 6);
    const x1 = Math.min(dx + CLOUD_W, BX1 - 2);
    if (x1 > x0) ctx.drawImage(clouds, x0 - dx, 0, x1 - x0, CLOUD_H, x0, CLOUD_Y, x1 - x0, CLOUD_H);
  }
  drawRooks(ctx, T);
  drawSmoke(ctx, T, wind);
  drawInsetLive(kit, ctx, T, lit, pulse);

  // mid: lamps, the professor, the turning sails
  drawLitWindows(kit, ctx, lit, pulse);
  drawProfessor(kit, ctx, T, b, beat, thumb);
  drawSails(kit, ctx, sailAngle(T, b));

  // the rider on the lane, then the foreground verge plants
  if (p.actor && p.actor.visible) p.actor.draw(ctx, p.actor.rig(), riderStyle(p, pal));
  drawForeground(kit, ctx, T, wind);
  ctx.restore();
}
