// src/scenes/gedser.js
// #13 · 1957 · 蓋瑟風機與丹麥概念 — Gedser & the Danish concept.
//
// Medium: a mid-century Danish modernist travel / industry poster, printed offset in
// four flat inks on off-white stock (off-white paper, Danish red, deep blue, mustard,
// charcoal), with tints, a little misregistration, halftone dots and paper grain;
// a grotesque headline, lots of open sky.
//
// Machine: Johannes Juul's Gedser wind turbine (Falster, 1956–57): 200 kW, THREE blades,
// UPWIND rotor 24 m across turning a steady ~30 rpm (stall-regulated, asynchronous
// generator straight onto the grid), blades braced by stays to a stay-mast projecting
// forward of the hub (to about mid-span) and wire-tied to one another near the tips,
// rotatable aerodynamic tip brakes, nacelle on a smooth reinforced-concrete cylinder
// (hub ~24 m). Baltic coast: ferry on the horizon, lighthouse on
// the point, gulls, a farm, a transformer hut flying the Dannebrog.
//
// Gag (bar 3): a strong gust — the tip brakes swing out (red tips turn broadside), the
// rotor eases, then they fold back; a gull rides the gust down and hitches a ride on
// the rider's pinwheel pole, taking off again at the end of bar 4.

const S = 1000;
const ROAD_Y = 700;
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const PAPER = '#f2ebdc';
const RED = '#c8102e';
const BLUE = '#1d3557';
const MUSTARD = '#f1c40f';
const CHAR = '#2a2a2a';
const WHITE = '#fbf8f0';
// offset tints (ink over paper)
const BLUE_T1 = '#c9cdd1'; // ~18% blue
const BLUE_T2 = '#8e99aa'; // ~45% blue
const BLUE_T3 = '#4f5f78'; // ~75% blue
const MUST_T = '#efd77a'; // ~60% mustard
const MUST_D = '#d9ad12'; // mustard + a touch of charcoal
const CON_L = '#dcd5c6'; // concrete, lit (charcoal 10%)
const RED_T = '#e5a3a6';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function ss(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
function intSmooth(T, a, b) {
  const s = clamp01((T - a) / (b - a));
  return (b - a) * (s * s * s - 0.5 * s * s * s * s) + Math.max(0, T - b);
}
function h1(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
const lerp = (a, b, t) => a + (b - a) * t;
const pmod = (a, m) => ((a % m) + m) % m;

// -----------------------------------------------------------------------------
// timing: the bar-3 gust, tip brakes, rotor speed
// -----------------------------------------------------------------------------
function gust(T) {
  return 0.25 * (ss(0.6, 1.1, T) - ss(1.6, 2.4, T)) + (ss(3.7, 4.1, T) - ss(5.5, 6.6, T));
}
function brakeAngle(T) {
  return (Math.PI / 2) * (ss(4.05, 4.4, T) - ss(5.45, 6.1, T));
}
const OMEGA = Math.PI; // 30 rpm
function rotorAngle(T) {
  // constant speed (induction generator on the grid) — eases while the tip brakes are out
  const slow = intSmooth(T, 4.1, 4.6) - intSmooth(T, 5.4, 6.3);
  return 0.35 + OMEGA * (T - 0.32 * slow);
}

// -----------------------------------------------------------------------------
// 3D -> 2D (metres; Y up; the rotor faces -X, i.e. towards the viewer's left)
// -----------------------------------------------------------------------------
const V = { cx: 688, gy: 688, s: 16.5, A: 58 * DEG };
const cA = Math.cos(V.A);
const sA = Math.sin(V.A);
function pr(X, Y, Z) {
  return { x: V.cx + V.s * (X * cA + Z * sA), y: V.gy - V.s * Y };
}
const HUB_Y = 24.6;
const XR = -2.7; // rotor plane
const R = 12;
const HUB = pr(XR, HUB_Y, 0);
const NOSE = pr(XR - 4.6, HUB_Y, 0); // tip of the stay-mast
const OUT = { x: -V.s * cA, y: 0 }; // screen vector of 1 m toward the wind (-X)
// in-plane: u (up) -> (0,-s), v (Z) -> (s*sA, 0)
function disc(r, phi) {
  return { x: HUB.x + r * Math.sin(phi) * V.s * sA, y: HUB.y - r * Math.cos(phi) * V.s };
}
function discVec(du, dv) {
  return { x: dv * V.s * sA, y: -du * V.s };
}

// tower (tapered concrete, round)
const TW = { rb: 1.85, rt: 1.55, h: 23.2 }; // a stiffened concrete cylinder (only a hint of taper)
const NAC = { x0: -1.9, x1: 3.9, y0: 23.3, y1: 25.9, z: 1.15 };
const SUN = { x: 724, y: 262, r: 158 };

// -----------------------------------------------------------------------------
// small drawing helpers
// -----------------------------------------------------------------------------
function poly(g, pts, close = true) {
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  if (close) g.closePath();
}
function spaced(g, str, x, y, sp, align = 'left') {
  let w = 0;
  const ws = [];
  for (const ch of str) {
    const cw = g.measureText(ch).width;
    ws.push(cw);
    w += cw + sp;
  }
  w -= sp;
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const prev = g.textAlign;
  g.textAlign = 'left';
  let k = 0;
  for (const ch of str) {
    g.fillText(ch, cx, y);
    cx += ws[k++] + sp;
  }
  g.textAlign = prev;
  return w;
}
/** Halftone dots of `color` inside the current clip; size from fn(x,y) in 0..1. */
function halftone(g, x0, y0, x1, y1, cell, color, fn, angle = 15 * DEG) {
  g.fillStyle = color;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const span = Math.hypot(x1 - x0, y1 - y0) / 2 + cell;
  g.beginPath();
  for (let j = -span; j <= span; j += cell) {
    for (let i = -span; i <= span; i += cell) {
      const x = cx + i * ca - j * sa;
      const y = cy + i * sa + j * ca;
      if (x < x0 - cell || x > x1 + cell || y < y0 - cell || y > y1 + cell) continue;
      const v = fn(x, y);
      if (v <= 0.02) continue;
      const r = Math.sqrt(v) * cell * 0.62;
      g.moveTo(x + r, y);
      g.arc(x, y, r, 0, TAU);
    }
  }
  g.fill();
}

// -----------------------------------------------------------------------------
// BACKGROUND (baked)
// -----------------------------------------------------------------------------
const HORIZON = 598;
const FAR_SEA = { y0: 598, y1: 618 };
const ROAD = { y0: 688, y1: 716 };
const SEA_Y = 730;

function paintSky(g) {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, S, S);
  // the sun (printed a hair out of register)
  g.fillStyle = MUSTARD;
  g.beginPath();
  g.arc(SUN.x - 2, SUN.y - 1.5, SUN.r, 0, TAU);
  g.fill();
  // flat clouds: long pale-blue tint lozenges, one crossing the sun
  const cloud = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x + h / 2, y);
    g.lineTo(x + w - h / 2, y);
    g.arc(x + w - h / 2, y + h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
    g.lineTo(x + h / 2, y + h);
    g.arc(x + h / 2, y + h / 2, h / 2, Math.PI / 2, Math.PI * 1.5);
    g.closePath();
    g.fill();
  };
  cloud(590, 384, 300, 26, BLUE_T1);
  cloud(680, 354, 150, 22, BLUE_T1);
  cloud(836, 150, 130, 20, BLUE_T1);
  cloud(470, 470, 120, 16, BLUE_T1);
  // the red behind a cloud overprints darker (red over blue tint)
  g.save();
  g.beginPath();
  g.arc(SUN.x - 2, SUN.y - 1.5, SUN.r, 0, TAU);
  g.clip();
  g.globalCompositeOperation = 'multiply';
  cloud(590, 384, 300, 26, BLUE_T1);
  cloud(680, 354, 150, 22, BLUE_T1);
  g.restore();
}

function paintLand(g, rng) {
  // far sea strip on the horizon (halftone blue over a light tint)
  g.fillStyle = BLUE_T1;
  g.fillRect(0, FAR_SEA.y0, S, FAR_SEA.y1 - FAR_SEA.y0);
  g.save();
  g.beginPath();
  g.rect(0, FAR_SEA.y0, S, FAR_SEA.y1 - FAR_SEA.y0);
  g.clip();
  halftone(g, 0, FAR_SEA.y0, S, FAR_SEA.y1, 4, BLUE, (x, y) => 0.35 + 0.4 * ((y - FAR_SEA.y0) / 20));
  g.restore();
  // the point with the lighthouse (left)
  g.fillStyle = MUST_T;
  g.beginPath();
  g.moveTo(0, 612);
  g.lineTo(0, 602);
  g.quadraticCurveTo(60, 596, 128, 606);
  g.lineTo(150, 618);
  g.closePath();
  g.fill();
  // lighthouse: white tower, red lantern, blue gallery
  g.fillStyle = WHITE;
  g.beginPath();
  g.moveTo(66, 604);
  g.lineTo(69, 562);
  g.lineTo(79, 562);
  g.lineTo(82, 604);
  g.closePath();
  g.fill();
  g.fillStyle = BLUE;
  g.fillRect(66, 560, 16, 3);
  g.fillStyle = RED;
  g.fillRect(69, 550, 10, 10);
  g.beginPath();
  g.moveTo(68, 550);
  g.lineTo(74, 543);
  g.lineTo(80, 550);
  g.closePath();
  g.fill();
  g.fillStyle = CHAR;
  g.fillRect(73, 580, 2, 5);
  // fields: horizontal bands narrowing toward the horizon
  let y = FAR_SEA.y1;
  let k = 0;
  while (y < ROAD.y0) {
    const hgt = 5 + (y - FAR_SEA.y1) * 0.22;
    g.fillStyle = k % 2 === 0 ? MUSTARD : MUST_D;
    g.fillRect(0, y, S, Math.min(hgt, ROAD.y0 - y));
    y += hgt;
    k++;
  }
  // a hedge row and a ploughed field in blue-shadow tint
  g.fillStyle = BLUE_T3;
  g.beginPath();
  g.moveTo(330, 624);
  for (let x = 330; x <= 560; x += 10) g.lineTo(x, 618 - 4 * Math.abs(Math.sin(x * 0.13)));
  g.lineTo(560, 626);
  g.closePath();
  g.fill();
  // farm: white walls, red tiled roofs, tarred base
  const farm = (x, w, h, roof) => {
    g.fillStyle = WHITE;
    g.fillRect(x, 640 - h, w, h);
    g.fillStyle = RED;
    g.beginPath();
    g.moveTo(x - 4, 640 - h + 1);
    g.lineTo(x + roof, 640 - h - 18);
    g.lineTo(x + w - roof, 640 - h - 18);
    g.lineTo(x + w + 4, 640 - h + 1);
    g.closePath();
    g.fill();
    g.fillStyle = CHAR;
    g.fillRect(x, 636, w, 4);
    g.fillStyle = BLUE;
    for (let wx = x + 8; wx < x + w - 8; wx += 16) g.fillRect(wx, 640 - h + 6, 6, 7);
  };
  farm(150, 120, 22, 16);
  farm(236, 60, 18, 10);
  // trees: round blue crowns on charcoal stems
  for (const [x, yb, r] of [[130, 640, 15], [290, 636, 12], [312, 640, 16], [116, 638, 10], [420, 632, 9]]) {
    g.fillStyle = CHAR;
    g.fillRect(x - 1.5, yb - r - 6, 3, r + 6);
    g.fillStyle = BLUE_T3;
    g.beginPath();
    g.arc(x, yb - r - 8, r, 0, TAU);
    g.fill();
    g.fillStyle = BLUE;
    g.beginPath();
    g.arc(x + r * 0.35, yb - r - 8 + r * 0.2, r * 0.75, -0.6, 1.9);
    g.fill();
  }
  // road along the dike (charcoal) with a dashed centre line
  g.fillStyle = CHAR;
  g.fillRect(0, ROAD.y0, S, ROAD.y1 - ROAD.y0);
  g.fillStyle = PAPER;
  for (let x = 12; x < S; x += 56) g.fillRect(x, 707, 30, 3);
  // verge and stone revetment down to the sea
  g.fillStyle = MUST_T;
  g.fillRect(0, ROAD.y1, S, SEA_Y - ROAD.y1);
  g.fillStyle = CHAR;
  for (let x = -10; x < S + 20; x += 22) {
    g.beginPath();
    g.moveTo(x, SEA_Y);
    g.lineTo(x + 6, ROAD.y1 + 6 + (h1(x) * 3));
    g.lineTo(x + 18, ROAD.y1 + 7 + (h1(x + 3) * 3));
    g.lineTo(x + 22, SEA_Y);
    g.closePath();
    g.globalAlpha = 0.18;
    g.fill();
  }
  g.globalAlpha = 1;
  void rng;
}

function paintSea(g) {
  g.fillStyle = BLUE;
  g.fillRect(0, SEA_Y, S, S - SEA_Y);
  // deeper water: halftone darkening to the bottom
  g.save();
  g.beginPath();
  g.rect(0, SEA_Y, S, S - SEA_Y);
  g.clip();
  halftone(g, 0, SEA_Y + 60, S, S, 6, '#13243c', (x, y) => clamp01((y - SEA_Y - 60) / 260) * 0.8, 45 * DEG);
  // reflected sun: mustard dashes under the sun's x
  g.fillStyle = MUSTARD;
  for (let k = 0; k < 7; k++) {
    const y = SEA_Y + 12 + k * 9;
    const w = 90 - k * 11;
    g.globalAlpha = 0.9 - k * 0.1;
    g.fillRect(SUN.x - w / 2 + Math.sin(k * 1.7) * 8, y, w, 3);
  }
  g.globalAlpha = 1;
  g.restore();
}

function paintTower(g) {
  // tapered round concrete tower: lit half / blue-shadow half, formwork rings
  const base = pr(0, 0, 0);
  const top = pr(0, TW.h, 0);
  const rb = TW.rb * V.s;
  const rt = TW.rt * V.s;
  const shape = [
    { x: base.x - rb, y: base.y },
    { x: top.x - rt, y: top.y },
    { x: top.x + rt, y: top.y },
    { x: base.x + rb, y: base.y },
  ];
  g.fillStyle = CON_L;
  poly(g, shape);
  g.fill();
  // shadow side (light comes from the low sun at upper right? no: from the left/sea)
  g.fillStyle = BLUE_T2;
  poly(g, [
    { x: base.x + rb * 0.15, y: base.y },
    { x: top.x + rt * 0.15, y: top.y },
    { x: top.x + rt, y: top.y },
    { x: base.x + rb, y: base.y },
  ]);
  g.fill();
  g.save();
  poly(g, shape);
  g.clip();
  // halftone core shadow toward the right edge
  halftone(g, base.x, top.y, base.x + rb + 2, base.y, 3.2, BLUE, (x, y) => {
    const w = lerp(rt, rb, (y - top.y) / (base.y - top.y));
    return clamp01((x - top.x - w * 0.35) / (w * 0.7)) * 0.7;
  });
  // formwork rings
  g.strokeStyle = 'rgba(42,42,42,0.22)';
  g.lineWidth = 1;
  for (let Y = 2.4; Y < TW.h; Y += 2.4) {
    const p = pr(0, Y, 0);
    const w = lerp(rb, rt, Y / TW.h);
    g.beginPath();
    g.moveTo(p.x - w, p.y);
    g.quadraticCurveTo(p.x, p.y + 3, p.x + w, p.y);
    g.stroke();
  }
  g.restore();
  // door
  g.fillStyle = BLUE;
  g.fillRect(base.x - 9, base.y - 34, 15, 34);
  g.fillStyle = MUSTARD;
  g.fillRect(base.x - 9, base.y - 38, 15, 3);
  // top flange
  g.fillStyle = CHAR;
  g.fillRect(top.x - rt - 4, top.y - 3, rt * 2 + 8, 5);
}

function nacelleFaces() {
  const { x0, x1, y0, y1, z } = NAC;
  return {
    side: [pr(x0, y0, z), pr(x1, y0, z), pr(x1, y1 - 0.4, z), pr(x0 + 0.6, y1, z)],
    front: [pr(x0, y0, -z), pr(x0, y0, z), pr(x0 + 0.6, y1, z), pr(x0 + 0.6, y1, -z)],
  };
}
function paintNacelle(g) {
  const f = nacelleFaces();
  // white housing with a blue-shadow front, so it reads against the mustard sun
  g.fillStyle = WHITE;
  poly(g, f.side);
  g.fill();
  g.fillStyle = BLUE_T2;
  poly(g, f.front);
  g.fill();
  g.strokeStyle = CHAR;
  g.lineWidth = 1.1;
  poly(g, f.side);
  g.stroke();
  // roof shadow, a red band, louvres
  g.fillStyle = BLUE_T2;
  const a = pr(NAC.x0 + 0.6, NAC.y1, NAC.z);
  const b = pr(NAC.x1, NAC.y1 - 0.4, NAC.z);
  g.beginPath();
  g.moveTo(a.x, a.y);
  g.lineTo(b.x, b.y);
  g.lineTo(b.x, b.y + 5);
  g.lineTo(a.x, a.y + 5);
  g.closePath();
  g.fill();
  g.fillStyle = RED;
  const c = pr(NAC.x0, NAC.y0 + 0.55, NAC.z);
  const d = pr(NAC.x1, NAC.y0 + 0.55, NAC.z);
  g.fillRect(c.x, c.y - 4, d.x - c.x, 4);
  g.fillStyle = CHAR;
  for (let k = 0; k < 4; k++) {
    const p = pr(1.5 + k * 0.55, 24.5, NAC.z);
    g.fillRect(p.x, p.y - 7, 3, 13);
  }
  // yaw ring at the tower head
  const t = pr(0, NAC.y0, 0);
  g.fillStyle = CHAR;
  g.fillRect(t.x - TW.rt * V.s - 2, t.y, TW.rt * V.s * 2 + 4, 4);
}

function paintHut(g) {
  // transformer hut: white box, red roof; overhead line out to the grid; flagpole
  const x = 770;
  const yb = 684;
  g.fillStyle = WHITE;
  g.fillRect(x, yb - 34, 46, 34);
  g.fillStyle = BLUE_T2;
  g.fillRect(x + 46, yb - 34, 14, 34);
  g.fillStyle = RED;
  g.beginPath();
  g.moveTo(x - 4, yb - 33);
  g.lineTo(x + 23, yb - 50);
  g.lineTo(x + 50, yb - 33);
  g.closePath();
  g.fill();
  g.fillStyle = '#9b0c23';
  g.beginPath();
  g.moveTo(x + 50, yb - 33);
  g.lineTo(x + 23, yb - 50);
  g.lineTo(x + 36, yb - 50);
  g.lineTo(x + 63, yb - 33);
  g.closePath();
  g.fill();
  g.fillStyle = BLUE;
  g.fillRect(x + 16, yb - 24, 13, 24);
  // high-voltage symbol plate
  g.fillStyle = MUSTARD;
  g.beginPath();
  g.moveTo(x + 37, yb - 26);
  g.lineTo(x + 43, yb - 16);
  g.lineTo(x + 31, yb - 16);
  g.closePath();
  g.fill();
  // line poles (H-frames) marching off to the right
  g.strokeStyle = CHAR;
  g.lineWidth = 2;
  const poles = [
    { x: 880, yb: 668, h: 60 },
    { x: 962, yb: 652, h: 44 },
  ];
  for (const p of poles) {
    g.beginPath();
    g.moveTo(p.x - 7, p.yb);
    g.lineTo(p.x - 5, p.yb - p.h);
    g.moveTo(p.x + 7, p.yb);
    g.lineTo(p.x + 5, p.yb - p.h);
    g.moveTo(p.x - 12, p.yb - p.h + 4);
    g.lineTo(p.x + 12, p.yb - p.h + 4);
    g.stroke();
  }
  g.lineWidth = 0.9;
  for (const dz of [-10, 0, 10]) {
    g.beginPath();
    g.moveTo(x + 48, yb - 40);
    g.quadraticCurveTo(840, 622 + dz * 0.2, 880 + dz, 612);
    g.quadraticCurveTo(920, 616, 962 + dz * 0.7, 612);
    g.lineTo(1000, 604);
    g.stroke();
  }
  // flagpole
  g.fillStyle = WHITE;
  g.fillRect(842, 560, 3, 128);
  g.fillStyle = CHAR;
  g.fillRect(841, 557, 5, 4);
}

function paintHeadline(g) {
  g.save();
  g.textBaseline = 'alphabetic';
  // GEDSER — big grotesque
  g.fillStyle = BLUE;
  g.font = '700 118px "Noto Sans TC", "Helvetica Neue", Arial, sans-serif';
  spaced(g, 'GEDSER', 54, 160, -4);
  // 1957 in red, 200 kW in a mustard block
  g.fillStyle = RED;
  g.font = '700 64px "Noto Sans TC", "Helvetica Neue", Arial, sans-serif';
  const w = spaced(g, '1957', 58, 240, -1);
  g.fillStyle = MUSTARD;
  g.fillRect(58 + w + 16, 190, 178, 58);
  g.fillStyle = CHAR;
  g.font = '700 46px "Noto Sans TC", "Helvetica Neue", Arial, sans-serif';
  spaced(g, '200 kW', 58 + w + 28, 236, 0);
  // rule and small Danish caption (generic wording)
  g.fillStyle = CHAR;
  g.fillRect(58, 262, 330, 3);
  g.font = '700 15px "Noto Sans TC", "Helvetica Neue", Arial, sans-serif';
  spaced(g, 'VINDKRAFT · FALSTER · DANMARK', 58, 288, 2.6);
  g.font = '500 14px "Noto Sans TC", "Helvetica Neue", Arial, sans-serif';
  g.fillStyle = BLUE;
  spaced(g, 'Ø 24 m  ·  3 VINGER  ·  30 o/min  ·  NAVHØJDE 24 m', 58, 310, 1.4);
  g.fillStyle = CHAR;
  spaced(g, 'KONSTRUERET AF JOHANNES JUUL', 58, 332, 1.4);
  g.restore();
}

function paintFooter(g) {
  g.save();
  g.textBaseline = 'alphabetic';
  g.fillStyle = PAPER;
  g.font = '700 50px "Noto Sans TC", sans-serif';
  spaced(g, '三葉片·上風·失速控制', 56, 900, 6);
  g.fillStyle = MUSTARD;
  g.font = '700 15px "Noto Sans TC", sans-serif';
  spaced(g, 'TRE VINGER · STALLREGULERET · ASYNKRONGENERATOR · 200 kW', 58, 934, 2.2);
  // printer's colophon
  g.fillStyle = 'rgba(242,235,220,0.55)';
  g.font = '500 10px "Noto Sans TC", sans-serif';
  spaced(g, 'TRYKT I DANMARK · 1957', 948, 958, 1.6, 'right');
  // a little red-and-white tag at right
  g.fillStyle = RED;
  g.fillRect(800, 884, 150, 40);
  g.fillStyle = PAPER;
  g.font = '700 22px "Noto Sans TC", sans-serif';
  spaced(g, '丹麥概念', 822, 912, 4);
  g.restore();
}

function paintBackground(kit, g0, rng) {
  const wc = kit.createCanvas(S, S);
  const g = wc.getContext('2d', { willReadFrequently: true });
  paintSky(g);
  paintLand(g, rng);
  paintSea(g);
  paintHut(g);
  paintTower(g);
  paintNacelle(g);
  paintHeadline(g);
  paintFooter(g);
  kit.addGrain(g, S, S, rng, 0.035);
  g0.drawImage(wc, 0, 0);
}

/** Paper grain + a few ink speckles, laid over the moving parts too. */
function paintGrainOverlay(kit, g, rng) {
  const id = g.createImageData(S, S);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = rng();
    if (r < 0.06) {
      d[i] = 255;
      d[i + 1] = 250;
      d[i + 2] = 238;
      d[i + 3] = 40 + rng() * 50;
    } else if (r > 0.985) {
      d[i] = 30;
      d[i + 1] = 30;
      d[i + 2] = 34;
      d[i + 3] = 18 + rng() * 22;
    }
  }
  g.putImageData(id, 0, 0);
  void kit;
}

// -----------------------------------------------------------------------------
// ROTOR (per frame)
// -----------------------------------------------------------------------------
const R_ROOT = 1.5;
const R_TB = 9.9; // start of the rotatable tip
const R_STAY = 7.2; // struts from the nose reach the blades at about mid-span
const R_TIE = 9.3; // the blade-to-blade wires run near the outer ends
function chordAt(r) {
  if (r < 2.6) return lerp(1.5, 2.45, (r - R_ROOT) / (2.6 - R_ROOT));
  return lerp(2.45, 1.3, (r - 2.6) / (R_TB - 2.6));
}
/** screen polygon of a blade from r0 to r1 at angle phi; chord split: leading 0.32 / trailing 0.68 */
function bladePts(phi, r0, r1, n, chordFn, beta = 0, outGain = 1) {
  const lead = [];
  const trail = [];
  const sp = Math.sin(phi);
  const cp = Math.cos(phi);
  // tangential (rotation direction) unit in (u,v) = (-sin, cos)
  const tv = discVec(-sp, cp);
  const cb = Math.cos(beta);
  const sb = Math.sin(beta);
  // (when a tip brake turns, its chord swings out of the rotor plane toward the wind;
  //  the poster exaggerates that throw a little so the flip reads at a glance)
  const cv = { x: tv.x * cb + OUT.x * sb * outGain, y: tv.y * cb + OUT.y * sb * outGain };
  for (let k = 0; k <= n; k++) {
    const r = lerp(r0, r1, k / n);
    const c = chordFn(r);
    const a = disc(r, phi);
    lead.push({ x: a.x + cv.x * c * 0.32, y: a.y + cv.y * c * 0.32 });
    trail.push({ x: a.x - cv.x * c * 0.68, y: a.y - cv.y * c * 0.68 });
  }
  return { lead, trail };
}

function drawRotor(ctx, T) {
  const rot = rotorAngle(T);
  const beta = brakeAngle(T);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const phis = [0, 1, 2].map((k) => rot + (k * TAU) / 3);
  // hub body (behind blades): charcoal drum
  ctx.fillStyle = CHAR;
  ctx.beginPath();
  ctx.ellipse(HUB.x + 6, HUB.y, 16 * sA, 17, 0, 0, TAU);
  ctx.fill();
  // blades
  for (const phi of phis) {
    // root shank
    const sh = bladePts(phi, 0.6, R_ROOT + 0.1, 2, () => 0.55);
    ctx.fillStyle = CHAR;
    poly(ctx, [...sh.lead, ...sh.trail.reverse()]);
    ctx.fill();
    // main blade: aluminium skin (white) with a blue-tint trailing panel
    const b = bladePts(phi, R_ROOT, R_TB, 8, chordAt);
    ctx.fillStyle = WHITE;
    poly(ctx, [...b.lead, ...b.trail.slice().reverse()]);
    ctx.fill();
    const mid = bladePts(phi, R_ROOT, R_TB, 8, (r) => chordAt(r) * 0.5);
    ctx.fillStyle = BLUE_T1;
    // trailing panel between the half-chord line and the trailing edge
    const tp = [];
    for (let k = 0; k < b.trail.length; k++) tp.push(lerpPt(mid.trail[k], b.trail[k], 0));
    poly(ctx, [...tp, ...b.trail.slice().reverse()]);
    ctx.fill();
    // fine charcoal outline (screen-print key line)
    ctx.strokeStyle = CHAR;
    ctx.lineWidth = 1.1;
    poly(ctx, [...b.lead, ...b.trail.slice().reverse()]);
    ctx.stroke();
    // steel spar line
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const s0 = disc(R_ROOT, phi);
    const s1 = disc(R_TB, phi);
    ctx.moveTo(s0.x, s0.y);
    ctx.lineTo(s1.x, s1.y);
    ctx.stroke();
    // rotatable tip brake (red): turns broadside to the rotation when deployed
    const tb = bladePts(phi, R_TB + 0.08, R, 3, (r) => lerp(1.3, 1.0, (r - R_TB) / (R - R_TB)), beta, 2.4);
    ctx.fillStyle = RED;
    poly(ctx, [...tb.lead, ...tb.trail.slice().reverse()]);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
    if (beta > 0.15) {
      // the pivot shaft shows when the tip is turned
      ctx.lineWidth = 2;
      const p0 = disc(R_TB - 0.1, phi);
      const p1 = disc(R_TB + 0.6, phi);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }
  // stays: struts from the stay-mast tip to each blade at about mid-span, and thin
  // wires tying neighbouring blades together near their outer ends (a triangle)
  const B = phis.map((phi) => disc(R_STAY, phi));
  const W = phis.map((phi) => disc(R_TIE, phi));
  ctx.strokeStyle = CHAR;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    ctx.moveTo(NOSE.x, NOSE.y);
    ctx.lineTo(B[k].x, B[k].y);
  }
  ctx.stroke();
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    ctx.moveTo(W[k].x, W[k].y);
    ctx.lineTo(W[(k + 1) % 3].x, W[(k + 1) % 3].y);
  }
  ctx.stroke();
  // stay clamps
  ctx.fillStyle = CHAR;
  for (const p of B) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.6, 0, TAU);
    ctx.fill();
  }
  for (const p of W) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8, 0, TAU);
    ctx.fill();
  }
  // hub cap and the forward stay-mast (a tapered spike)
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.ellipse(HUB.x, HUB.y, 13 * sA, 14, 0, 0, TAU);
  ctx.fill();
  const dx = NOSE.x - HUB.x;
  const dy = NOSE.y - HUB.y;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  ctx.fillStyle = CHAR;
  ctx.beginPath();
  ctx.moveTo(HUB.x + nx * 5, HUB.y + ny * 5);
  ctx.lineTo(NOSE.x + nx * 1.4, NOSE.y + ny * 1.4);
  ctx.lineTo(NOSE.x - nx * 1.4, NOSE.y - ny * 1.4);
  ctx.lineTo(HUB.x - nx * 5, HUB.y - ny * 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = MUSTARD;
  ctx.beginPath();
  ctx.arc(NOSE.x, NOSE.y, 2.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function lerpPt(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// -----------------------------------------------------------------------------
// moving bits: flag, ferry, waves, gusts, gulls
// -----------------------------------------------------------------------------
function drawFlag(ctx, T) {
  const g = gust(T);
  const x0 = 845;
  const y0 = 562;
  const w = 44;
  const h = 28;
  const amp = lerp(4, 1.5, g);
  const freq = lerp(5, 11, g);
  const droop = lerp(5, 0, g);
  const pt = (u, v) => {
    const wave = Math.sin(u * 6 - T * freq) * amp * u;
    return { x: x0 + u * w * lerp(0.92, 1, g), y: y0 + v * h + wave + droop * u * u };
  };
  const quad = (u0, u1, v0, v1, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    const n = 6;
    for (let k = 0; k <= n; k++) {
      const p = pt(lerp(u0, u1, k / n), v0);
      if (k === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    for (let k = n; k >= 0; k--) {
      const p = pt(lerp(u0, u1, k / n), v1);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
  };
  // Dannebrog: red field, white Nordic cross (proportions 3:1:3 / 3:1:4.5)
  quad(0, 1, 0, 1, RED);
  quad(0, 1, 3 / 7, 4 / 7, PAPER);
  quad(3 / 8.5, 4 / 8.5, 0, 1, PAPER);
}

function drawFerry(ctx, T) {
  const x = 520 - T * 5.5;
  const y = 606;
  ctx.save();
  // hull
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(x - 46, y - 6);
  ctx.lineTo(x + 50, y - 6);
  ctx.lineTo(x + 44, y + 2);
  ctx.lineTo(x - 42, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.fillRect(x - 44, y - 11, 92, 5);
  ctx.fillRect(x - 30, y - 17, 58, 6);
  ctx.fillStyle = BLUE;
  for (let k = 0; k < 10; k++) ctx.fillRect(x - 28 + k * 5.6, y - 15, 2.6, 2);
  // funnel
  ctx.fillStyle = RED;
  ctx.fillRect(x + 4, y - 26, 9, 10);
  ctx.fillStyle = CHAR;
  ctx.fillRect(x + 4, y - 28, 9, 3);
  // smoke: flat puffs drifting downwind (to the right)
  ctx.fillStyle = BLUE_T1;
  for (let k = 0; k < 4; k++) {
    const ph = pmod(T * 0.6 + k * 0.25, 1);
    ctx.globalAlpha = 1 - ph;
    ctx.beginPath();
    ctx.arc(x + 12 + ph * 40, y - 32 - ph * 10, 3 + ph * 6, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawWaves(ctx, T) {
  ctx.save();
  ctx.strokeStyle = 'rgba(242,235,220,0.75)';
  ctx.lineCap = 'round';
  const rows = [
    { y: 752, sp: 16, w: 34, lw: 2.2 },
    { y: 784, sp: 11, w: 44, lw: 2 },
    { y: 826, sp: 7, w: 56, lw: 1.8 },
  ];
  for (const rw of rows) {
    ctx.lineWidth = rw.lw;
    ctx.beginPath();
    const off = pmod(T * rw.sp, rw.w * 2);
    for (let x = -rw.w * 2 + off; x < S + rw.w; x += rw.w * 2) {
      const xx = x + ((rw.y * 7) % rw.w);
      ctx.moveTo(xx, rw.y);
      ctx.quadraticCurveTo(xx + rw.w * 0.5, rw.y - rw.w * 0.18, xx + rw.w, rw.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawGustLines(ctx, T) {
  const g = gust(T);
  if (g < 0.05) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (let k = 0; k < 5; k++) {
    const y0 = 340 + h1(k * 2.7) * 120;
    const sp = 560 + h1(k * 4.1) * 240;
    const len = 120 + h1(k * 3.3) * 110;
    const span = S + len + 200;
    const x = pmod(T * sp + h1(k * 7.7) * span, span) - len - 100;
    ctx.strokeStyle = k === 2 ? CHAR : BLUE;
    ctx.globalAlpha = Math.min(1, g * 1.2);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const n = 10;
    for (let q = 0; q <= n; q++) {
      const u = q / n;
      const px = x + u * len;
      const py = y0 + Math.sin(u * Math.PI * 1.4 + k) * 7;
      if (q === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    // a curl at the end
    const ex = x + len;
    const ey = y0 + Math.sin(Math.PI * 1.4 + k) * 7;
    ctx.arc(ex, ey - 6, 6, Math.PI / 2, -Math.PI * 0.6, true);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** A flat poster gull. pose: 0 = gliding, 1 = perched; flap in radians. */
function drawGull(ctx, x, y, sc, dir, flap, pose = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * dir, sc);
  if (pose < 0.5) {
    // wings: far wing, body, near wing
    const wing = (sgn, col) => {
      const up = Math.sin(flap) * 14 * sgn;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.quadraticCurveTo(-8, -14 - up, -26, -10 - up * 1.6);
      ctx.lineTo(-30, -6 - up * 1.7);
      ctx.quadraticCurveTo(-14, -4 - up * 0.4, 6, 1);
      ctx.closePath();
      ctx.fill();
      // black wing tip
      ctx.fillStyle = CHAR;
      ctx.beginPath();
      ctx.moveTo(-26, -10 - up * 1.6);
      ctx.lineTo(-30, -6 - up * 1.7);
      ctx.lineTo(-22, -7 - up * 1.2);
      ctx.closePath();
      ctx.fill();
    };
    wing(-1, BLUE_T2);
    // body
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5.2, -0.05, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, -2.5, 4.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = BLUE_T1;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-20, -2);
    ctx.lineTo(-19, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = MUSTARD;
    ctx.beginPath();
    ctx.moveTo(15.6, -2.6);
    ctx.lineTo(22, -1.4);
    ctx.lineTo(15.6, -0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CHAR;
    ctx.beginPath();
    ctx.arc(13.2, -3.6, 1, 0, TAU);
    ctx.fill();
    wing(1, '#a9b2bf');
    ctx.strokeStyle = 'rgba(42,42,42,0.7)';
    ctx.lineWidth = 0.9 / sc;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5.2, -0.05, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(12, -2.5, 4.4, -1.2, 1.6);
    ctx.stroke();
  } else {
    // perched: upright body, folded grey wing, legs to the grip point (0,0)
    ctx.strokeStyle = MUSTARD;
    ctx.lineWidth = 1.8 / sc;
    ctx.beginPath();
    ctx.moveTo(-2, -12);
    ctx.lineTo(0, 0);
    ctx.moveTo(3, -12);
    ctx.lineTo(1, 0);
    ctx.stroke();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(0, -21, 9, 12, 0.35, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -34, 5.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = BLUE_T2;
    ctx.beginPath();
    ctx.moveTo(-6, -28);
    ctx.quadraticCurveTo(6, -28, 4, -16);
    ctx.lineTo(-14, -6);
    ctx.quadraticCurveTo(-12, -20, -6, -28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CHAR;
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(-9, -10);
    ctx.lineTo(-17, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = MUSTARD;
    ctx.beginPath();
    ctx.moveTo(10.5, -35);
    ctx.lineTo(18, -33);
    ctx.lineTo(10.5, -31.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(15.4, -32.6, 0.9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = CHAR;
    ctx.beginPath();
    ctx.arc(7.6, -35.4, 1.1, 0, TAU);
    ctx.fill();
    // key line round the white body and head
    ctx.strokeStyle = 'rgba(42,42,42,0.85)';
    ctx.lineWidth = 1 / sc;
    ctx.beginPath();
    ctx.ellipse(0, -21, 9, 12, 0.35, -0.2, 3.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(6, -34, 5.4, -2.6, 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

// footer pictogram: the rotatable blade tip (flips with the bar-3 gust)
const PICT = { x: 874, y: 798, r: 40 };
function drawPictogram(ctx, T) {
  const b = brakeAngle(T);
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.arc(PICT.x, PICT.y, PICT.r, 0, TAU);
  ctx.fill();
  const P = (x, y, z) => ({ x: PICT.x + x + z * 0.62, y: PICT.y - y + z * 0.34 });
  // blade (fixed, flat in its plane): from the hub side to the pivot
  const c = 14;
  const x0 = -34;
  const x1 = 8;
  const x2 = 30;
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(P(x0, c * 0.7, 0).x, P(x0, c * 0.7, 0).y);
  ctx.lineTo(P(x1, c / 2, 0).x, P(x1, c / 2, 0).y);
  ctx.lineTo(P(x1, -c / 2, 0).x, P(x1, -c / 2, 0).y);
  ctx.lineTo(P(x0, -c * 0.7, 0).x, P(x0, -c * 0.7, 0).y);
  ctx.closePath();
  ctx.fill();
  // tip plate turning about the span axis
  const cy = Math.cos(b);
  const sz = Math.sin(b);
  const q = [P(x1 + 1.5, (c / 2) * cy, (c / 2) * sz), P(x2, (c / 2.4) * cy, (c / 2.4) * sz), P(x2, (-c / 2.4) * cy, (-c / 2.4) * sz), P(x1 + 1.5, (-c / 2) * cy, (-c / 2) * sz)];
  ctx.fillStyle = RED;
  poly(ctx, q);
  ctx.fill();
  // pivot shaft
  ctx.strokeStyle = CHAR;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(P(x1 - 4, 0, 0).x, P(x1 - 4, 0, 0).y);
  ctx.lineTo(P(x2 + 4, 0, 0).x, P(x2 + 4, 0, 0).y);
  ctx.stroke();
  // turning arrow while it moves / is out
  if (b > 0.05) {
    ctx.strokeStyle = CHAR;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const ax = PICT.x + x2 + 3;
    ctx.ellipse(ax - 4, PICT.y, 5, 13, 0, -Math.PI / 2, -Math.PI / 2 + Math.min(Math.PI * 1.2, b * 2));
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.font = '700 15px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  spaced(ctx, '葉尖煞車', PICT.x, PICT.y + PICT.r + 21, 3, 'center');
  ctx.restore();
}

// the hitch-hiking gull
const G_LAND = 5.25;
const G_OFF = 7.45;
const POLE_F = 0.56;
function poleAt(bx, f) {
  return { x: bx - 64 - 36 * f, y: ROAD_Y - 74 - 126 * f };
}
function bez(p0, p1, p2, p3, u) {
  const iu = 1 - u;
  return {
    x: iu * iu * iu * p0.x + 3 * iu * iu * u * p1.x + 3 * iu * u * u * p2.x + u * u * u * p3.x,
    y: iu * iu * iu * p0.y + 3 * iu * iu * u * p1.y + 3 * iu * u * u * p2.y + u * u * u * p3.y,
  };
}
function gullState(T, riderX, thumb) {
  if (thumb) return { mode: 'pole', ...poleAt(riderX, POLE_F) };
  const circleAt = (t) => ({
    x: 860 + Math.cos(t * 0.9) * 70,
    y: 210 + Math.sin(t * 0.9) * 22,
    dir: -Math.sin(t * 0.9) >= 0 ? 1 : -1,
  });
  if (T < 3.6) {
    const c = circleAt(T);
    return { mode: 'fly', x: c.x, y: c.y, dir: c.dir, flap: 0.35 * Math.sin(T * 3), sc: 0.9 };
  }
  if (T < G_LAND) {
    const u = (T - 3.6) / (G_LAND - 3.6);
    const S0 = circleAt(3.6);
    const E = poleAt(riderX + 125 * (G_LAND - T), POLE_F);
    const p = bez(S0, { x: S0.x - 40, y: S0.y + 160 }, { x: E.x + 160, y: E.y - 120 }, E, u * u * (3 - 2 * u));
    const dir = -1;
    const flap = u < 0.7 ? Math.sin(T * 14) * 0.9 : Math.sin(T * 22) * 0.5 + 0.6;
    return { mode: u > 0.94 ? 'pole' : 'fly', x: p.x, y: p.y, dir, flap, sc: lerp(0.9, 1.35, u) };
  }
  if (T < G_OFF) {
    return { mode: 'pole', ...poleAt(riderX, POLE_F) };
  }
  // take off, up and out to the right
  const u = (T - G_OFF) / 1.8;
  const S0 = poleAt(riderX - 125 * (T - G_OFF), POLE_F);
  const p = bez(S0, { x: S0.x + 60, y: S0.y - 40 }, { x: S0.x + 160, y: S0.y - 160 }, { x: S0.x + 330, y: S0.y - 330 }, clamp01(u));
  return { mode: 'fly', x: p.x, y: p.y, dir: 1, flap: Math.sin(T * 16) * 1.0, sc: 1.35 };
}

// -----------------------------------------------------------------------------
// rider: flat poster shapes + a blue "out of register" shadow
// -----------------------------------------------------------------------------
const RIDER_STYLE = {
  plumage: WHITE,
  plumageShade: '#e3dccb',
  mask: CHAR,
  bill: CHAR,
  eyeRing: MUSTARD,
  legs: CHAR,
  crest: MUSTARD,
  breast: MUSTARD,
  frame: RED,
  frameShade: '#a00d25',
  metal: CHAR,
  tire: CHAR,
  rim: PAPER,
  saddle: BLUE,
  outline: CHAR,
  outlineWidth: 0.9,
  shading: true,
  spokes: 10,
};

function drawRiderFlat(kit, ctx, rig, scene, shadowCanvas) {
  // shadow silhouette rendered once into a scratch canvas, then laid down as a tint
  const sg = shadowCanvas.getContext('2d');
  const ox = Math.round(rig.root.x) - 300;
  const oy = 380;
  sg.setTransform(1, 0, 0, 1, 0, 0);
  sg.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
  sg.translate(-ox, -oy);
  kit.drawRider(sg, rig, { ...RIDER_STYLE, silhouette: BLUE, pinwheel: { ...scene.pinwheel } });
  sg.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.drawImage(shadowCanvas, ox + 6, oy + 4);
  ctx.restore();
  kit.drawRider(ctx, rig, { ...RIDER_STYLE, pinwheel: { ...scene.pinwheel, colors: [WHITE, RED], stroke: CHAR } });
}

// -----------------------------------------------------------------------------
// render
// -----------------------------------------------------------------------------
export function render(kit, slot, scene, params) {
  const { ctx } = slot;
  const thumb = !!params.isThumbnail;
  const T = thumb ? 2.4 : params.rawLocalT;
  ctx.save();
  const bg = kit.bake('gedser_bg_v2', S, S, (g, rng) => paintBackground(kit, g, rng));
  ctx.drawImage(bg, 0, 0);

  drawFerry(ctx, T);
  drawWaves(ctx, T);
  drawPictogram(ctx, thumb ? 0 : T);
  drawFlag(ctx, T);

  // distant gulls in the sky (behind the rotor)
  if (!thumb) {
    const gx = pmod(T * 22 + 300, 1300) - 150;
    drawGull(ctx, 1000 - gx, 150 + Math.sin(T * 0.7) * 10, 0.75, -1, Math.sin(T * 2.2) * 0.3);
    drawGull(ctx, 420 + Math.sin(T * 0.5) * 60, 470 + Math.cos(T * 0.5) * 12, 0.6, Math.cos(T * 0.5) > 0 ? -1 : 1, Math.sin(T * 5) * 0.8);
  }
  drawRotor(ctx, T);
  drawGustLines(ctx, thumb ? 0 : T);

  const gs = gullState(T, params.riderLocalX, thumb);
  if (gs.mode === 'fly' && gs.y < 600) drawGull(ctx, gs.x, gs.y, gs.sc, gs.dir, gs.flap);

  if (kit.riderVisible(params)) {
    const rig = kit.riderRig(params);
    const sc = kit.bake('gedser_shadow_scratch', 600, 360, () => {});
    drawRiderFlat(kit, ctx, rig, scene, sc);
    if (gs.mode === 'pole') {
      const bob = Math.sin(params.pedalAngle * 2) * 1.2;
      drawGull(ctx, gs.x, gs.y + bob, 1.45, 1, 0, 1);
    }
  }
  if (gs.mode === 'fly' && gs.y >= 600) drawGull(ctx, gs.x, gs.y, gs.sc, gs.dir, gs.flap);

  // paper grain over everything (moving parts included)
  const grain = kit.bake('gedser_grain_v1', S, S, (g, rng) => paintGrainOverlay(kit, g, rng));
  ctx.drawImage(grain, 0, 0);
  ctx.restore();
}
