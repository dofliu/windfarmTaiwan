// src/scenes/hywind.js
// Chapter "hywind" · 2017 · Hywind Scotland.
//
// Medium: 數位線框 HUD／數位分身 (Wireframe HUD / digital twin) — a dark navy screen, stroke-only
// geometry in phosphor cyan and green with hidden-line fills, a dot grid, a section plane cut at
// the sea surface, corner brackets around targets, a scan sweep crossing the screen, scrolling
// telemetry in a mono face, sparkline traces, and CRT scan lines + vignette over everything.
//
// Scene: a cut-away "digital twin" of one Hywind Scotland unit. The road (y 700) is the section
// plane at the sea surface. Above it: a three-bladed turbine (tapered tower, nacelle, rotor seen at
// three-quarter view, turning slowly) and a perspective wire mesh of the sea with four more
// turbines on the horizon (5 units in all, per the fact sheet). Below it: the long vertical spar
// buoy (narrow column at the waterline, a cone, then the wide ballast body) reaching deep down,
// three catenary mooring lines (green) running out to three anchors on a wire-mesh seabed, and
// the power cable lying along the seabed toward shore. The whole floating body pitches and heaves
// gently with the waves and the mooring lines follow it. No depths or dimensions are written:
// proportions only (the spar longer than the tower, per the fact sheet's visual line).
// Layers: back = dot grid, sea mesh, far turbines, seabed mesh (slow parallax); mid = the unit and
// its moorings; fore = drifting particles in the water, the scan sweep, screen-corner reticles
// (fastest parallax). On-screen numbers come only from the fact sheet (5 × 6 MW, 2017-10-18).
//
// Story beat (bar 3): the scan finds its target — amber brackets close in from the whole rotor to
// the nacelle and lock on the downbeat (accent pulse); the status line flips from 掃描中 to
// 發電中 · 2017-10-18, the five unit icons light up one per beat, and power pulses start running
// down the cable toward shore (they keep running through bar 4 and after).
//
// Deterministic: no Math.random / Date — kit.hash11 / sin of T only. Static layers baked.
// Designed in the 1000x1000 gallery-ride square; on the easel the square sits in p.layout on a
// wide dark screen ground (no rider there).

export const meta = { stages: ['gallery-ride', 'easel'] };
const ID = 'hywind';

const S = 1000;
const WL = 700; // sea surface = section plane = road
const CX = 560; // turbine axis
const TAU = Math.PI * 2;

// structure (design px, unrotated, y absolute)
const SPAR_TOP = 680; // top of the spar (transition to the tower)
const COL_END = 732; // narrow column ends, cone starts
const CONE_END = 760; // wide ballast body starts
const KEEL = 950;
const COL_HW = 10;
const BODY_HW = 19;
const TOWER_TOP = 460;
const TB_HW = 8;
const TT_HW = 5;
const HUB = { x: CX - 20, y: 448 };
const R = 200; // blade length
const KX = 0.62; // rotor disc foreshortening (three-quarter view)
const FAIR_Y = 830; // fairlead depth on the spar
const PIV = { x: CX, y: 780 }; // pitch pivot (below the waterline)

// seabed (oblique projection: Z > 0 is away from the viewer)
const SB = 972; // seabed at Z = 0
const KZ = 0.09;
const sbY = (Z) => SB - Z * KZ;
const ANCHORS = [
  { X: -380, Z: 40, side: -1, name: 'A' },
  { X: 310, Z: 0, side: 1, name: 'B' },
  // C runs sideways and back (away from the viewer) so its seabed run reads as receding, not a hook
  { X: 175, Z: 300, side: 0.4, name: 'C' },
].map((a) => ({ ...a, x: CX + a.X, y: sbY(a.Z) - 8 }));

// far turbines on the horizon (4 more: 5 units in all)
const FAR = [
  { x: 118, y: 646, k: 0.34, ph: 0.7 },
  { x: 262, y: 622, k: 0.22, ph: 2.1 },
  { x: 838, y: 628, k: 0.25, ph: 4.0 },
  { x: 942, y: 652, k: 0.37, ph: 5.3 },
];

const DEFAULT_PAL = ['#07131f', '#39d0ff', '#9effc8', '#ffb347', '#1c3b57']; // ground, line, line 2, alert, grid

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pmod = (a, m) => ((a % m) + m) % m;
const lerp = (a, b, t) => a + (b - a) * t;

// -----------------------------------------------------------------------------
// motion
// -----------------------------------------------------------------------------
function pitchAt(T) {
  return 0.016 * Math.sin(T * 0.95) + 0.006 * Math.sin(T * 2.3 + 1.1);
}
function heaveAt(T) {
  return 2.2 * Math.sin(T * 1.25 + 0.4);
}
/** Camera drift (design px) for the parallax layers. */
function camAt(T) {
  return 7 * Math.sin(T * 0.33) + 2 * Math.sin(T * 0.9 + 2);
}
/** Local (unrotated) point -> world point under the current sway. */
function swayPt(x, y, th, hv, dx) {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const ux = x - PIV.x;
  const uy = y - PIV.y;
  return { x: PIV.x + ux * c - uy * s + dx, y: PIV.y + ux * s + uy * c + hv };
}

// -----------------------------------------------------------------------------
// baked background (design square)
// -----------------------------------------------------------------------------
function monoFont(kit, px, bold) {
  return `${bold ? '600 ' : ''}${px}px ${kit.FONT.mono}`;
}

// per-frame text is blitted from small baked sprites (CJK fillText every frame is the slow path)
let MEASURE = null;
function textSprite(kit, str, px, bold, color) {
  const font = monoFont(kit, px, bold);
  return kit.bake(`${ID}_tx_${px}_${bold ? 1 : 0}_${color}_${str}`, measureText(kit, str, font) + 4, Math.ceil(px * 1.5), (g) => {
    g.font = font;
    g.fillStyle = color;
    g.textBaseline = 'alphabetic';
    g.fillText(str, 2, Math.round(px * 1.12));
  });
}
function measureText(kit, str, font) {
  if (!MEASURE) MEASURE = kit.createCanvas(4, 4).getContext('2d');
  MEASURE.font = font;
  return Math.ceil(MEASURE.measureText(str).width);
}
/** Draw text sprite with its baseline at (x, y). */
function blitText(kit, ctx, str, x, y, px, bold, color) {
  ctx.drawImage(textSprite(kit, str, px, bold, color), x - 2, y - Math.round(px * 1.12));
}

function bracket(g, x, y, w, h, len) {
  g.beginPath();
  for (const [sx, sy] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
    const px = x + sx * w;
    const py = y + sy * h;
    const dx = sx ? -len : len;
    const dy = sy ? -len : len;
    g.moveTo(px + dx, py);
    g.lineTo(px, py);
    g.lineTo(px, py + dy);
  }
  g.stroke();
}

function paintBackground(kit, g, rng, w, h, pal) {
  // sky / screen ground
  g.fillStyle = pal[0];
  g.fillRect(0, 0, w, h);
  const sky = g.createLinearGradient(0, 0, 0, WL);
  sky.addColorStop(0, 'rgba(10,30,48,0)');
  sky.addColorStop(1, 'rgba(18,58,88,0.55)');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, WL);
  // dot grid (stops at the horizon)
  g.fillStyle = pal[4];
  for (let y = 40; y < 600; y += 40) for (let x = 40; x < w; x += 40) g.fillRect(x - 1, y - 1, 2, 2);
  // faint cross marks every 4th
  g.strokeStyle = kit.rgba(pal[1], 0.18);
  g.lineWidth = 1;
  g.beginPath();
  for (let y = 120; y < 600; y += 160)
    for (let x = 120; x < w; x += 160) {
      g.moveTo(x - 5, y);
      g.lineTo(x + 5, y);
      g.moveTo(x, y - 5);
      g.lineTo(x, y + 5);
    }
  g.stroke();

  // sea body between horizon and section plane: darker band + perspective rays
  const sea = g.createLinearGradient(0, 600, 0, WL);
  sea.addColorStop(0, 'rgba(6,26,42,0.9)');
  sea.addColorStop(1, 'rgba(8,36,58,0.95)');
  g.fillStyle = sea;
  g.fillRect(0, 600, w, WL - 600);
  g.strokeStyle = kit.rgba(pal[4], 0.9);
  g.lineWidth = 1;
  g.beginPath();
  for (let k = -16; k <= 16; k++) {
    g.moveTo(500 + k * 22, 600);
    g.lineTo(500 + k * 70, WL);
  }
  g.stroke();
  // horizon
  g.strokeStyle = kit.rgba(pal[1], 0.45);
  g.beginPath();
  g.moveTo(0, 600);
  g.lineTo(w, 600);
  g.stroke();

  // underwater: section fill, darker with depth
  const uw = g.createLinearGradient(0, WL, 0, h);
  uw.addColorStop(0, '#0a2a44');
  uw.addColorStop(0.35, '#071d31');
  uw.addColorStop(1, '#040d18');
  g.fillStyle = uw;
  g.fillRect(0, WL, w, h - WL);
  // section hatching just under the cut line (engineering section convention)
  g.save();
  g.beginPath();
  g.rect(0, WL, w, 14);
  g.clip();
  g.strokeStyle = kit.rgba(pal[1], 0.22);
  g.beginPath();
  for (let x = -20; x < w + 20; x += 9) {
    g.moveTo(x, WL + 14);
    g.lineTo(x + 14, WL);
  }
  g.stroke();
  g.restore();
  // depth bands (dashed isolines, no values)
  g.setLineDash([2, 8]);
  g.strokeStyle = kit.rgba(pal[1], 0.16);
  g.beginPath();
  for (let y = WL + 50; y < 930; y += 50) {
    g.moveTo(70, y);
    g.lineTo(w - 30, y);
  }
  g.stroke();
  g.setLineDash([]);

  // seabed wire mesh (oblique, gentle relief)
  const hgt = (X, Z) => 5 * (kit.fbm2(X * 0.006 + 3, Z * 0.008 + 7, 3, 11) - 0.5) * 2;
  const rows = [];
  for (let Z = 440; Z >= -440; Z -= 40) {
    const pts = [];
    for (let X = -620; X <= 520; X += 20) {
      const persp = 1 + -Z * 0.00045;
      pts.push({ x: CX + X * persp, y: sbY(Z) - hgt(X, Z) });
    }
    rows.push({ Z, pts });
  }
  // seabed fill under the back edge
  g.fillStyle = 'rgba(12,40,58,0.55)';
  g.beginPath();
  g.moveTo(rows[0].pts[0].x, rows[0].pts[0].y);
  for (const q of rows[0].pts) g.lineTo(q.x, q.y);
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.closePath();
  g.fill();
  g.lineWidth = 1;
  rows.forEach((r, i) => {
    g.strokeStyle = kit.rgba(pal[1], 0.1 + 0.22 * (i / rows.length));
    g.beginPath();
    r.pts.forEach((q, j) => (j ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
    g.stroke();
  });
  g.strokeStyle = kit.rgba(pal[1], 0.16);
  g.beginPath();
  for (let j = 0; j < rows[0].pts.length; j += 2) {
    rows.forEach((r, i) => (i ? g.lineTo(r.pts[j].x, r.pts[j].y) : g.moveTo(r.pts[j].x, r.pts[j].y)));
  }
  g.stroke();
  // back edge of the seabed, brighter
  g.strokeStyle = kit.rgba(pal[1], 0.55);
  g.lineWidth = 1.4;
  g.beginPath();
  rows[0].pts.forEach((q, j) => (j ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
  g.stroke();

  // cable along the seabed toward shore (left edge)
  g.strokeStyle = kit.rgba(pal[3], 0.55);
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(CABLE_TD.x, CABLE_TD.y);
  g.bezierCurveTo(360, CABLE_TD.y + 4, 200, 966, 26, 962);
  g.stroke();

  // anchors: suction cans half buried, with target brackets + labels
  g.font = monoFont(kit, 13, true);
  g.textBaseline = 'alphabetic';
  for (const a of ANCHORS) {
    const rw = 9;
    g.fillStyle = 'rgba(6,20,32,0.95)';
    g.fillRect(a.x - rw, a.y - 6, rw * 2, 14);
    g.strokeStyle = pal[1];
    g.lineWidth = 1.4;
    g.beginPath();
    g.ellipse(a.x, a.y - 6, rw, 3, 0, 0, TAU);
    g.moveTo(a.x - rw, a.y - 6);
    g.lineTo(a.x - rw, a.y + 6);
    g.moveTo(a.x + rw, a.y - 6);
    g.lineTo(a.x + rw, a.y + 6);
    g.stroke();
    g.setLineDash([2, 3]);
    g.beginPath();
    g.ellipse(a.x, a.y + 6, rw, 3, 0, 0, Math.PI);
    g.stroke();
    g.setLineDash([]);
    g.strokeStyle = kit.rgba(pal[2], 0.8);
    g.lineWidth = 1.2;
    bracket(g, a.x - 20, a.y - 18, 40, 32, 7);
    g.fillStyle = pal[2];
    const lx = a.side < 0 ? a.x - 20 : a.x + 26;
    const ly = a.name === 'C' ? a.y - 24 : a.y - 22;
    g.textAlign = a.side < 0 ? 'left' : 'left';
    g.fillText('錨 ' + a.name, a.name === 'C' ? a.x + 24 : lx, a.name === 'A' ? a.y - 24 : ly);
  }

  // underwater labels (below the road: the rider never covers them)
  g.textAlign = 'left';
  g.fillStyle = kit.rgba(pal[1], 0.85);
  g.font = monoFont(kit, 13, true);
  g.fillText('海面 · 剖面', 64, WL + 30);
  g.fillText('海床', 64, 924);
  g.fillStyle = kit.rgba(pal[3], 0.85);
  g.fillText('◀ 送電上岸', 60, 950);
  // callout boxes (leaders drawn per frame)
  g.strokeStyle = kit.rgba(pal[1], 0.7);
  g.lineWidth = 1.2;
  g.strokeRect(CALL_SPAR.x, CALL_SPAR.y, CALL_SPAR.w, CALL_SPAR.h);
  g.strokeStyle = kit.rgba(pal[2], 0.7);
  g.strokeRect(CALL_MOOR.x, CALL_MOOR.y, CALL_MOOR.w, CALL_MOOR.h);
  g.fillStyle = pal[1];
  g.font = monoFont(kit, 15, true);
  g.fillText('浮動圓筒 SPAR', CALL_SPAR.x + 10, CALL_SPAR.y + 22);
  g.fillStyle = pal[2];
  g.fillText('繫泊纜 ×3', CALL_MOOR.x + 10, CALL_MOOR.y + 22);
  g.font = monoFont(kit, 11, false);
  g.fillStyle = kit.rgba(pal[1], 0.7);
  g.fillText('SPAR · FLOATING', CALL_SPAR.x + 10, CALL_SPAR.y + 38);
  g.fillStyle = kit.rgba(pal[2], 0.7);
  g.fillText('MOORING · ANCHOR', CALL_MOOR.x + 10, CALL_MOOR.y + 38);

  // depth ruler on the left (ticks only, no values)
  g.strokeStyle = kit.rgba(pal[1], 0.6);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(44, WL);
  g.lineTo(44, 970);
  for (let y = WL; y <= 970; y += 10) {
    const L = (y - WL) % 50 === 0 ? 12 : 5;
    g.moveTo(44, y);
    g.lineTo(44 + L, y);
  }
  g.stroke();

  // --- HUD panels (top) ---
  // top-left: identification block
  g.fillStyle = 'rgba(4,14,24,0.72)';
  g.fillRect(PANEL_L.x, PANEL_L.y, PANEL_L.w, PANEL_L.h);
  g.strokeStyle = kit.rgba(pal[1], 0.35);
  g.lineWidth = 1;
  g.strokeRect(PANEL_L.x + 0.5, PANEL_L.y + 0.5, PANEL_L.w, PANEL_L.h);
  g.strokeStyle = pal[1];
  g.lineWidth = 2;
  bracket(g, PANEL_L.x - 4, PANEL_L.y - 4, PANEL_L.w + 8, PANEL_L.h + 8, 14);
  g.textAlign = 'left';
  g.fillStyle = kit.rgba(pal[1], 0.7);
  g.font = monoFont(kit, 12, false);
  g.fillText('數位分身 · DIGITAL TWIN', PANEL_L.x + 16, PANEL_L.y + 26);
  g.fillStyle = pal[1];
  g.font = monoFont(kit, 26, true);
  g.fillText('HYWIND SCOTLAND', PANEL_L.x + 16, PANEL_L.y + 60);
  g.font = monoFont(kit, 14, false);
  g.fillStyle = kit.rgba(pal[1], 0.85);
  g.fillText('BUCHAN DEEP · PETERHEAD', PANEL_L.x + 16, PANEL_L.y + 84);
  g.fillStyle = pal[2];
  g.font = monoFont(kit, 17, true);
  g.fillText('浮動式風場 · 5 × 6 MW', PANEL_L.x + 16, PANEL_L.y + 112);
  g.strokeStyle = kit.rgba(pal[1], 0.3);
  g.beginPath();
  g.moveTo(PANEL_L.x + 16, PANEL_L.y + 126);
  g.lineTo(PANEL_L.x + PANEL_L.w - 16, PANEL_L.y + 126);
  g.stroke();
  g.fillStyle = kit.rgba(pal[1], 0.7);
  g.font = monoFont(kit, 13, false);
  g.fillText('狀態', PANEL_L.x + 16, PANEL_L.y + 150);

  // top-right: telemetry block
  g.fillStyle = 'rgba(4,14,24,0.72)';
  g.fillRect(PANEL_R.x, PANEL_R.y, PANEL_R.w, PANEL_R.h);
  g.strokeStyle = kit.rgba(pal[1], 0.35);
  g.lineWidth = 1;
  g.strokeRect(PANEL_R.x + 0.5, PANEL_R.y + 0.5, PANEL_R.w, PANEL_R.h);
  g.strokeStyle = pal[1];
  g.lineWidth = 2;
  bracket(g, PANEL_R.x - 4, PANEL_R.y - 4, PANEL_R.w + 8, PANEL_R.h + 8, 14);
  g.fillStyle = kit.rgba(pal[1], 0.7);
  g.font = monoFont(kit, 12, false);
  g.fillText('遙測 · TELEMETRY', PANEL_R.x + 14, PANEL_R.y + 22);
  g.fillText('縱搖 PITCH', PANEL_R.x + 14, PANEL_R.y + 46);
  g.fillText('轉子 ROTOR', PANEL_R.x + 14, PANEL_R.y + 118);
  g.fillText('繫泊 MOOR', PANEL_R.x + 14, PANEL_R.y + 148);
  for (let i = 0; i < 3; i++) g.fillText('ABC'[i], PANEL_R.x + 14, PANEL_R.y + 172 + i * 16);
  // sparkline frame
  g.strokeStyle = kit.rgba(pal[4], 1);
  g.strokeRect(SPARK.x + 0.5, SPARK.y + 0.5, SPARK.w, SPARK.h);
  g.beginPath();
  g.moveTo(SPARK.x, SPARK.y + SPARK.h / 2);
  g.lineTo(SPARK.x + SPARK.w, SPARK.y + SPARK.h / 2);
  for (let x = SPARK.x; x <= SPARK.x + SPARK.w; x += 20) {
    g.moveTo(x, SPARK.y + SPARK.h);
    g.lineTo(x, SPARK.y + SPARK.h - 4);
  }
  g.stroke();
  // bar tracks
  for (let i = 0; i < 3; i++) g.strokeRect(PANEL_R.x + 34.5, PANEL_R.y + 163.5 + i * 16, 170, 10);
  // dial
  g.beginPath();
  g.arc(DIAL.x, DIAL.y, DIAL.r, 0, TAU);
  g.stroke();
  g.beginPath();
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    g.moveTo(DIAL.x + Math.cos(a) * (DIAL.r - 3), DIAL.y + Math.sin(a) * (DIAL.r - 3));
    g.lineTo(DIAL.x + Math.cos(a) * DIAL.r, DIAL.y + Math.sin(a) * DIAL.r);
  }
  g.stroke();
  // log separator
  g.strokeStyle = kit.rgba(pal[1], 0.3);
  g.beginPath();
  g.moveTo(PANEL_R.x + 14, LOG.y - 18);
  g.lineTo(PANEL_R.x + PANEL_R.w - 14, LOG.y - 18);
  g.stroke();
}

const PANEL_L = { x: 46, y: 46, w: 352, h: 214 };
const PANEL_R = { x: 698, y: 46, w: 256, h: 300 };
const SPARK = { x: 712, y: 100, w: 228, h: 36 };
const DIAL = { x: 922, y: 158, r: 14 };
const LOG = { x: 712, y: 278 };
const CALL_SPAR = { x: 300, y: 770, w: 168, h: 48 };
const CALL_MOOR = { x: 690, y: 728, w: 158, h: 48 };
const CABLE_TD = { x: 430, y: 970 }; // power cable touchdown on the seabed

// -----------------------------------------------------------------------------
// animated pieces
// -----------------------------------------------------------------------------
function drawSea(kit, ctx, T, pal, dx) {
  // perspective wave lines between the horizon and the section plane (back layer)
  ctx.strokeStyle = kit.rgba(pal[1], 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 1; k <= 7; k++) {
    const u = k / 8;
    const y0 = 600 + 100 * Math.pow(u, 1.5);
    const amp = 0.6 + 3.2 * u;
    const f = 0.03 - 0.016 * u;
    const ph = T * (1.1 + u) + k * 1.9;
    for (let x = 0; x <= S; x += 25) {
      const y = y0 + amp * Math.sin(x * f - ph) + amp * 0.4 * Math.sin(x * f * 2.3 + ph * 0.7);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  // far turbines (slow parallax)
  const ox = dx * 0.35;
  ctx.strokeStyle = kit.rgba(pal[1], 0.6);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (const t of FAR) {
    const x = t.x + ox;
    const bob = Math.sin(T * 1.2 + t.ph) * 0.8;
    const hub = { x: x - 18 * t.k, y: t.y - 235 * t.k + bob };
    const th = 1.5 * t.k;
    ctx.moveTo(x - th * 1.6, t.y + bob);
    ctx.lineTo(x - th, hub.y + 6 * t.k);
    ctx.moveTo(x + th * 1.6, t.y + bob);
    ctx.lineTo(x + th, hub.y + 6 * t.k);
    ctx.rect(hub.x, hub.y - 7 * t.k, 52 * t.k, 15 * t.k);
    const a0 = T * 1.05 + t.ph;
    for (let b = 0; b < 3; b++) {
      const a = a0 + (b * TAU) / 3;
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(hub.x + KX * R * t.k * Math.sin(a), hub.y - R * t.k * Math.cos(a));
    }
  }
  ctx.stroke();
  // their hidden spars (dashed, faint): the twin "sees" through the water
  ctx.strokeStyle = kit.rgba(pal[1], 0.28);
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  for (const t of FAR) {
    const x = t.x + ox;
    const L = 190 * t.k;
    const hw = BODY_HW * t.k;
    ctx.rect(x - hw, t.y + 8 * t.k, hw * 2, L);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Wireframe cylinder segment between y0 (half width a) and y1 (half width b), local coords. */
function cylPath(ctx, x, y0, a, y1, b, rings) {
  // silhouette + meridians
  ctx.moveTo(x - a, y0);
  ctx.lineTo(x - b, y1);
  ctx.moveTo(x + a, y0);
  ctx.lineTo(x + b, y1);
  ctx.moveTo(x - a * 0.5, y0);
  ctx.lineTo(x - b * 0.5, y1);
  ctx.moveTo(x + a * 0.5, y0);
  ctx.lineTo(x + b * 0.5, y1);
  // front half rings
  for (let i = 0; i <= rings; i++) {
    const u = i / rings;
    const y = lerp(y0, y1, u);
    const r = lerp(a, b, u);
    ctx.moveTo(x + r, y);
    ctx.ellipse(x, y, r, r * 0.28, 0, 0, Math.PI);
  }
}

// the floating body (spar + tower + nacelle) is static in its own frame: baked once as a sprite
const SPR = { x: CX - 48, y: TOWER_TOP - 30, w: 104, h: KEEL + 16 - (TOWER_TOP - 30) };
function paintBody(kit, g, pal) {
  g.translate(-SPR.x, -SPR.y);
  // hidden-line fill: spar + tower silhouette in the screen ground colour
  g.fillStyle = 'rgba(5,16,27,0.88)';
  g.beginPath();
  g.moveTo(CX - TT_HW, TOWER_TOP);
  g.lineTo(CX + TT_HW, TOWER_TOP);
  g.lineTo(CX + TB_HW, SPAR_TOP);
  g.lineTo(CX + COL_HW, SPAR_TOP);
  g.lineTo(CX + COL_HW, COL_END);
  g.lineTo(CX + BODY_HW, CONE_END);
  g.lineTo(CX + BODY_HW, KEEL);
  g.quadraticCurveTo(CX, KEEL + 9, CX - BODY_HW, KEEL);
  g.lineTo(CX - BODY_HW, CONE_END);
  g.lineTo(CX - COL_HW, COL_END);
  g.lineTo(CX - COL_HW, SPAR_TOP);
  g.lineTo(CX - TB_HW, SPAR_TOP);
  g.closePath();
  g.fill();

  // spar (below + just above the waterline)
  g.strokeStyle = pal[1];
  g.lineWidth = 1.5;
  g.beginPath();
  cylPath(g, CX, SPAR_TOP, COL_HW, COL_END, COL_HW, 3);
  cylPath(g, CX, COL_END, COL_HW, CONE_END, BODY_HW, 2);
  cylPath(g, CX, CONE_END, BODY_HW, KEEL, BODY_HW, 7);
  g.moveTo(CX + BODY_HW, KEEL);
  g.quadraticCurveTo(CX, KEEL + 9, CX - BODY_HW, KEEL);
  g.stroke();
  // top ring of the spar (deck flange)
  g.beginPath();
  g.ellipse(CX, SPAR_TOP, COL_HW + 3, 3, 0, 0, TAU);
  g.stroke();

  // tower
  g.lineWidth = 1.3;
  g.beginPath();
  cylPath(g, CX, TOWER_TOP, TT_HW, SPAR_TOP, TB_HW, 8);
  g.stroke();

  // nacelle: wire box with depth
  const n0 = { x: HUB.x + 4, y: HUB.y - 9 };
  const nw = 50;
  const nh = 17;
  const d = { x: 8, y: -5 };
  g.fillStyle = 'rgba(5,16,27,0.9)';
  g.fillRect(n0.x, n0.y, nw, nh);
  g.lineWidth = 1.5;
  g.beginPath();
  g.rect(n0.x, n0.y, nw, nh);
  g.moveTo(n0.x, n0.y);
  g.lineTo(n0.x + d.x, n0.y + d.y);
  g.lineTo(n0.x + nw + d.x, n0.y + d.y);
  g.lineTo(n0.x + nw, n0.y);
  g.moveTo(n0.x + nw + d.x, n0.y + d.y);
  g.lineTo(n0.x + nw + d.x, n0.y + nh + d.y);
  g.lineTo(n0.x + nw, n0.y + nh);
  g.stroke();
  // spinner
  g.beginPath();
  g.moveTo(n0.x, HUB.y - 7);
  g.quadraticCurveTo(HUB.x - 14, HUB.y - 6, HUB.x - 16, HUB.y);
  g.quadraticCurveTo(HUB.x - 14, HUB.y + 6, n0.x, HUB.y + 7);
  g.stroke();

}

function drawUnit(kit, ctx, T, pal, sw, state) {
  const { th, hv, dx } = sw;
  ctx.save();
  ctx.translate(PIV.x + dx, PIV.y + hv);
  ctx.rotate(th);
  ctx.translate(-PIV.x, -PIV.y);
  ctx.drawImage(kit.bake(ID + '_body_v2', SPR.w, SPR.h, (g) => paintBody(kit, g, pal)), SPR.x, SPR.y);

  // swept disc (faint ellipse + a tick travelling round it)
  ctx.strokeStyle = kit.rgba(pal[1], 0.22);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(HUB.x, HUB.y, KX * R, R, 0, 0, TAU);
  ctx.stroke();

  // blades: tapered outlines in the foreshortened rotor plane + pitch axis
  const a0 = T * 1.05 + 0.4; // ~10 rpm
  ctx.strokeStyle = pal[1];
  ctx.lineWidth = 1.7;
  ctx.fillStyle = 'rgba(14,52,74,0.75)';
  const blade = new Path2D();
  const axes = new Path2D();
  for (let b = 0; b < 3; b++) {
    const a = a0 + (b * TAU) / 3;
    const du = Math.sin(a);
    const dv = -Math.cos(a);
    const nu = Math.cos(a);
    const nv = Math.sin(a);
    const P = (r, c) => ({ x: HUB.x + KX * (r * du + c * nu), y: HUB.y + r * dv + c * nv });
    const pts = [P(6, -4), P(28, -11), P(72, -7.5), P(R, -1.6), P(R, 1.2), P(58, 11), P(26, 10), P(6, 4)];
    blade.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) blade.lineTo(pts[i].x, pts[i].y);
    blade.closePath();
    const q0 = P(8, 0);
    const q1 = P(R - 6, 0);
    axes.moveTo(q0.x, q0.y);
    axes.lineTo(q1.x, q1.y);
  }
  ctx.fill(blade);
  ctx.stroke(blade);
  ctx.strokeStyle = kit.rgba(pal[2], 0.45);
  ctx.lineWidth = 1;
  ctx.stroke(axes);
  ctx.restore();

  // glows + the ring where the spar cuts the section plane (world coords)
  const hubW = swayPt(HUB.x, HUB.y, th, hv, dx);
  const wl = swayPt(CX, WL, th, hv, dx);
  ctx.strokeStyle = pal[2];
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(wl.x, WL, COL_HW + 5, 3.5, 0, 0, TAU);
  ctx.stroke();
  kit.glow(ctx, hubW.x, hubW.y, 46, pal[1], 0.35 + 0.35 * state.on);
}

function fairleads(sw) {
  return ANCHORS.map((a) => swayPt(CX + a.side * BODY_HW * 0.95, FAIR_Y + (a.name === 'C' ? 4 : 0), sw.th, sw.hv, sw.dx));
}

function drawMoorings(kit, ctx, T, pal, sw) {
  const F = fairleads(sw);
  ctx.lineWidth = 1.6;
  const t0 = 0.62;
  const hang = new Path2D(); // suspended catenary part, bright
  const lie = new Path2D(); // part lying on the seabed (receding toward the anchor), fainter
  ANCHORS.forEach((a, i) => {
    const f = F[i];
    for (let k = 0; k <= 20; k++) {
      const t = k / 20;
      const x = lerp(f.x, a.x, t);
      const ground = lerp(sbY(0) - 4, a.y, t);
      const y = t < t0 ? f.y + (ground - f.y) * (1 - Math.pow(1 - t / t0, 2)) : ground;
      const prevT = (k - 1) / 20;
      if (k === 0) hang.moveTo(x, y);
      else if (prevT < t0) hang.lineTo(x, y); // up to and including the touchdown point
      if (t >= t0) {
        if (prevT < t0) lie.moveTo(x, y);
        else lie.lineTo(x, y);
      }
    }
  });
  ctx.strokeStyle = pal[2];
  ctx.stroke(hang);
  ctx.strokeStyle = kit.rgba(pal[2], 0.5);
  ctx.setLineDash([6, 4]);
  ctx.stroke(lie);
  ctx.setLineDash([]);
  // fairlead nodes
  ctx.fillStyle = pal[2];
  for (const f of F) ctx.fillRect(f.x - 2.5, f.y - 2.5, 5, 5);
  // callout leaders: spar + mooring
  const sp = swayPt(CX - BODY_HW, 862, sw.th, sw.hv, sw.dx);
  ctx.strokeStyle = kit.rgba(pal[1], 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CALL_SPAR.x + CALL_SPAR.w, CALL_SPAR.y + CALL_SPAR.h / 2);
  ctx.lineTo(CALL_SPAR.x + CALL_SPAR.w + 30, CALL_SPAR.y + CALL_SPAR.h / 2);
  ctx.lineTo(sp.x - 4, sp.y);
  ctx.stroke();
  ctx.strokeRect(sp.x - 4, sp.y - 3, 6, 6);
  // mooring callout points at line B one third along
  const fb = F[1];
  const t = 0.3;
  const gb = lerp(sbY(0) - 4, ANCHORS[1].y, t);
  const mp = { x: lerp(fb.x, ANCHORS[1].x, t), y: fb.y + (gb - fb.y) * (1 - Math.pow(1 - t / 0.62, 2)) };
  ctx.strokeStyle = kit.rgba(pal[2], 0.7);
  ctx.beginPath();
  ctx.moveTo(CALL_MOOR.x + 30, CALL_MOOR.y + CALL_MOOR.h);
  ctx.lineTo(mp.x, mp.y);
  ctx.stroke();
  ctx.strokeRect(mp.x - 3, mp.y - 3, 6, 6);
  return F;
}

/** Sonar ping from the keel, one per bar (underwater only). */
function drawPing(kit, ctx, T, pal, p, sw) {
  const b = p.beat.barSec;
  const k = p.isThumbnail ? 0.45 : pmod(T / b, 1);
  const c = swayPt(CX, KEEL - 40, sw.th, sw.hv, sw.dx);
  ctx.save();
  ctx.strokeStyle = pal[1];
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    const u = k + i * 0.5 - (k + i * 0.5 >= 1 ? 1 : 0);
    ctx.globalAlpha = 0.35 * (1 - u);
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 30 + u * 340, (30 + u * 340) * 0.42, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/** Dynamic power cable from the spar to the seabed touchdown (lazy wave); returns a sampler. */
function cablePt(sw, t) {
  // t in 0..1 over the hanging part, then 1..2 along the baked seabed part
  const s0 = swayPt(CX - BODY_HW * 0.6, 915, sw.th, sw.hv, sw.dx);
  if (t <= 1) {
    const c1 = { x: s0.x - 40, y: s0.y + 40 };
    const c2 = { x: 500, y: 958 };
    const u = 1 - t;
    return {
      x: u * u * u * s0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * CABLE_TD.x,
      y: u * u * u * s0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * CABLE_TD.y,
    };
  }
  const v = t - 1;
  const u = 1 - v;
  const P0 = CABLE_TD;
  const P1 = { x: 360, y: CABLE_TD.y + 4 };
  const P2 = { x: 200, y: 966 };
  const P3 = { x: 26, y: 962 };
  return {
    x: u * u * u * P0.x + 3 * u * u * v * P1.x + 3 * u * v * v * P2.x + v * v * v * P3.x,
    y: u * u * u * P0.y + 3 * u * u * v * P1.y + 3 * u * v * v * P2.y + v * v * v * P3.y,
  };
}

function drawCable(kit, ctx, T, pal, sw, state) {
  ctx.strokeStyle = kit.rgba(pal[3], 0.6);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k <= 14; k++) {
    const q = cablePt(sw, k / 14);
    if (k === 0) ctx.moveTo(q.x, q.y);
    else ctx.lineTo(q.x, q.y);
  }
  ctx.stroke();
  if (state.on <= 0) return;
  // power pulses running toward shore
  for (let i = 0; i < 4; i++) {
    const t = pmod(state.sinceOn * 0.55 + i * 0.5, 2);
    const q = cablePt(sw, t);
    kit.glow(ctx, q.x, q.y, 16, pal[3], 0.8 * state.on);
    ctx.fillStyle = pal[3];
    ctx.fillRect(q.x - 2, q.y - 2, 4, 4);
  }
}

function drawTelemetry(kit, ctx, T, pal, p, state) {
  // pitch sparkline: recent history of the sway
  ctx.strokeStyle = pal[2];
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const n = 38;
  for (let i = 0; i <= n; i++) {
    const tt = T - (n - i) * 0.12;
    const y = SPARK.y + SPARK.h / 2 - pitchAt(tt) * 820;
    const x = SPARK.x + (i / n) * SPARK.w;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // rotor dial
  const a = T * 1.05;
  ctx.strokeStyle = pal[1];
  ctx.beginPath();
  for (let b = 0; b < 3; b++) {
    const aa = a + (b * TAU) / 3;
    ctx.moveTo(DIAL.x, DIAL.y);
    ctx.lineTo(DIAL.x + Math.sin(aa) * (DIAL.r - 4), DIAL.y - Math.cos(aa) * (DIAL.r - 4));
  }
  ctx.stroke();
  // rotor activity bar (no values)
  ctx.fillStyle = kit.rgba(pal[1], 0.75);
  for (let k = 0; k < 10; k++) {
    const lit = 0.5 + 0.5 * Math.sin(T * 3 - k * 0.6) > 0.35;
    if (lit) ctx.fillRect(PANEL_R.x + 96 + k * 9, PANEL_R.y + 110, 6, 8);
  }
  // mooring tension bars follow the pitch (A on the left side, B on the right)
  const th = pitchAt(T);
  const tens = [0.55 - th * 14, 0.55 + th * 14, 0.5 + 0.06 * Math.sin(T * 1.25 + 0.4)];
  for (let i = 0; i < 3; i++) {
    const w = 168 * Math.max(0.1, Math.min(1, tens[i]));
    ctx.fillStyle = kit.rgba(pal[2], 0.8);
    ctx.fillRect(PANEL_R.x + 36, PANEL_R.y + 165 + i * 16, w, 7);
  }
  // scrolling log (one line per beat; strings from the fact sheet only)
  const LINES = ['SPAR · 浮動圓筒', 'MOOR A · 繫泊', 'MOOR B · 繫泊', 'MOOR C · 繫泊', '5 × 6 MW', 'BUCHAN DEEP', 'PETERHEAD', '2017-10-18'];
  const bs = p.beat.beatSec;
  const step = Math.floor(T / bs);
  const fr = p.isThumbnail ? 0 : pmod(T / bs, 1);
  const off = Math.min(1, fr * 4) * 16;
  ctx.save();
  ctx.beginPath();
  ctx.rect(PANEL_R.x + 8, LOG.y - 14, PANEL_R.w - 16, 50);
  ctx.clip();
  for (let i = 0; i < 4; i++) {
    const idx = pmod(step + i, LINES.length);
    const y = LOG.y + i * 16 - off;
    ctx.globalAlpha = 0.9 - i * 0.18;
    blitText(kit, ctx, '> ' + LINES[idx], LOG.x, y, 12, false, pal[i === 0 ? 2 : 1]);
  }
  ctx.restore();

  // status line + five unit icons in the left panel
  const sx = PANEL_L.x + 56;
  const sy = PANEL_L.y + 150;
  if (state.on > 0.02) {
    const txt = '發電中 · 2017-10-18';
    const nShow = Math.ceil(txt.length * clamp01(state.sinceOn / (p.beat.beatSec * 1.2)));
    blitText(kit, ctx, txt.slice(0, Math.max(1, nShow)), sx, sy, 15, true, pal[3]);
  } else {
    const blink = p.isThumbnail || pmod(T / p.beat.beatSec, 1) < 0.6;
    blitText(kit, ctx, '掃描中' + (blink ? ' ▮' : ''), sx, sy, 15, true, pal[1]);
  }
  for (let i = 0; i < 5; i++) {
    const x = PANEL_L.x + 30 + i * 62;
    const y = PANEL_L.y + 192;
    const lit = state.on > 0 && state.sinceOn > i * p.beat.beatSec * 0.5;
    ctx.strokeStyle = lit ? pal[3] : kit.rgba(pal[1], 0.6);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y + 22);
    ctx.lineTo(x, y - 4);
    for (let b = 0; b < 3; b++) {
      const aa = (lit ? T * 2 : 0.3) + (b * TAU) / 3;
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + Math.sin(aa) * 11, y - 4 - Math.cos(aa) * 11);
    }
    ctx.stroke();
    if (lit) {
      ctx.fillStyle = kit.rgba(pal[3], 0.25);
      ctx.fillRect(x - 16, y - 18, 32, 46);
    }
  }
}

/** Bar-3 beat: target brackets close in from the rotor to the nacelle and lock. */
function drawLock(kit, ctx, T, pal, p, sw, state) {
  const b = p.beat.barSec;
  const close = kit.smoothstep(2 * b, 2.3 * b, T);
  const vis = kit.envelope(T, 1.9 * b, 2 * b, 3.7 * b, 4 * b);
  if (vis < 0.01 && state.on <= 0) return;
  const hub = swayPt(HUB.x + 10, HUB.y, sw.th, sw.hv, sw.dx);
  // opens just around the rotor (clear of both HUD panels), then closes on the nacelle
  const hw = lerp(KX * R + 4, 46, close);
  const hh = lerp(R - 30, 34, close);
  const accent = p.isThumbnail ? 0 : state.on > 0 && state.sinceOn < 0.5 ? p.beat.pulse(0.5) : 0;
  ctx.save();
  if (vis > 0.01) {
    ctx.globalAlpha = vis;
    ctx.strokeStyle = pal[3];
    ctx.lineWidth = 2.4 + accent * 2;
    bracket(ctx, hub.x - hw, hub.y - hh, hw * 2, hh * 2, 16);
    // crosshair ticks
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hub.x - hw - 12, hub.y);
    ctx.lineTo(hub.x - hw + 6, hub.y);
    ctx.moveTo(hub.x + hw - 6, hub.y);
    ctx.lineTo(hub.x + hw + 12, hub.y);
    ctx.stroke();
    blitText(kit, ctx, close > 0.98 ? '鎖定 · TARGET LOCK' : '追蹤 · TRACKING', hub.x - hw, hub.y - hh - 10, 13, true, pal[3]);
    if (accent > 0.01) kit.glow(ctx, hub.x, hub.y, 90, pal[3], accent * 0.7);
  }
  ctx.restore();
  // after the beat: a small steady cyan marker stays on the nacelle
  if (state.on > 0 && vis < 0.99) {
    ctx.save();
    ctx.globalAlpha = 1 - vis;
    ctx.strokeStyle = pal[2];
    ctx.lineWidth = 1.4;
    bracket(ctx, hub.x - 40, hub.y - 28, 80, 56, 9);
    ctx.restore();
  }
}

const inBox = (b, x, y) => x > b.x - 4 && x < b.x + b.w + 2 && y > b.y - 4 && y < b.y + b.h + 2;

function drawFore(kit, ctx, T, pal, p, dx) {
  // drifting particles in the water (fast parallax)
  const ox = dx * 1.8;
  ctx.fillStyle = kit.rgba(pal[1], 0.55);
  for (let i = 0; i < 34; i++) {
    const sp = 6 + kit.hash11(i * 3.1) * 14;
    const x = pmod(kit.hash11(i * 7.7) * 1100 - T * sp + ox, 1100) - 50;
    const y = WL + 18 + kit.hash11(i * 1.3) * 250 + Math.sin(T * 0.8 + i) * 4 - pmod(T * 3 + i * 20, 30);
    const r = 1 + kit.hash11(i * 5.9) * 1.6;
    if (inBox(CALL_SPAR, x, y) || inBox(CALL_MOOR, x, y)) continue; // keep callout text clean
    ctx.fillRect(x, y, r, r);
  }
  // scan sweep: a vertical beam crossing the screen once per two bars
  const per = 2 * p.beat.barSec;
  const u = p.isThumbnail ? 0.18 : pmod(T / per, 1);
  const x = -60 + u * 1120;
  const beam = kit.bake(ID + '_beam_v1', 92, 940, (g, rng, w, h) => {
    const gr = g.createLinearGradient(0, 0, 90, 0);
    gr.addColorStop(0, kit.rgba(pal[1], 0));
    gr.addColorStop(1, kit.rgba(pal[1], 0.12));
    g.fillStyle = gr;
    g.fillRect(0, 0, 90, h);
    g.fillStyle = kit.rgba(pal[1], 0.75);
    g.fillRect(90, 0, 1.6, h);
  });
  ctx.drawImage(beam, Math.round(x - 90), 30);
  // near-plane reticle corners (move with the camera, fastest)
  ctx.strokeStyle = kit.rgba(pal[2], 0.55);
  ctx.lineWidth = 2;
  bracket(ctx, 34 + ox * 0.4, 34, 932, 932, 34);
  // waterline marker riding the section plane at the right edge
  ctx.fillStyle = pal[1];
  ctx.beginPath();
  ctx.moveTo(974, WL);
  ctx.lineTo(962, WL - 6);
  ctx.lineTo(962, WL + 6);
  ctx.closePath();
  ctx.fill();
}

const riderStyle = (p, pal) => ({ wire: pal[2], prop: { type: p.prop.type, colors: [pal[1], pal[2]] } });

export function render(kit, ctx, p) {
  const b = p.beat.barSec;
  const T = p.isThumbnail ? 3.2 * b : p.rawLocalT; // thumbnail: locked on, generating, calm
  const pal = p.palette && p.palette.length >= 5 ? p.palette : DEFAULT_PAL;
  const L = kit.layout(p);
  const square = L.x === 0 && L.y === 0 && L.s === 1 && p.W === S && p.H === S;
  ctx.save();
  const bg = kit.bake(ID + '_bg_v2', S, S, (g, rng, w, h) => paintBackground(kit, g, rng, w, h, pal));
  // the CRT layer (tint, scan lines, vignette) is baked into the screen ground once: a per-frame
  // full-frame overlay costs more than the whole subject, and the thin strokes barely change under it
  const back = kit.bake(ID + (square ? '_screen_v2' : '_wide_v2'), p.W, p.H, (g, rng, w, h) => {
    if (square) g.drawImage(bg, 0, 0);
    else {
      g.fillStyle = pal[0];
      g.fillRect(0, 0, w, h);
      g.fillStyle = pal[4];
      for (let y = 20; y < h; y += 36) for (let x = 20; x < w; x += 36) g.fillRect(x, y, 2, 2);
      g.drawImage(bg, L.x, L.y, S * L.s, S * L.s);
      g.strokeStyle = kit.rgba(pal[1], 0.5);
      g.lineWidth = 2;
      g.strokeRect(L.x, L.y, S * L.s, S * L.s);
    }
    kit.crt(g, w, h, 0, { tint: pal[1], roll: 0, flicker: 0 });
  });
  ctx.drawImage(back, 0, 0);
  ctx.translate(L.x, L.y);
  ctx.scale(L.s, L.s);
  if (!square) {
    ctx.beginPath();
    ctx.rect(0, 0, S, S);
    ctx.clip();
  }

  const dx = p.isThumbnail ? 0 : camAt(T);
  const sw = { th: pitchAt(T), hv: heaveAt(T), dx };
  const tOn = 2.3 * b;
  const state = { on: T >= tOn ? 1 : 0, sinceOn: Math.max(0, T - tOn) };

  drawSea(kit, ctx, T, pal, dx);
  // section plane (the road)
  ctx.strokeStyle = pal[1];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, WL);
  ctx.lineTo(S, WL);
  ctx.stroke();

  drawPing(kit, ctx, T, pal, p, sw);
  drawCable(kit, ctx, T, pal, sw, state);
  drawMoorings(kit, ctx, T, pal, sw);
  drawUnit(kit, ctx, T, pal, sw, state);
  drawLock(kit, ctx, T, pal, p, sw, state);
  drawTelemetry(kit, ctx, T, pal, p, state);

  if (p.actor && p.actor.visible) p.actor.draw(ctx, p.actor.rig(), riderStyle(p, pal));

  drawFore(kit, ctx, T, pal, p, dx);
  ctx.restore();
  // CRT roll: a faint bright band drifting down the screen (baked strip, whole-pixel blit)
  const rollY = Math.round(pmod(T * 48, p.H + 200) - 100);
  const band = kit.bake(ID + '_roll_v1@' + p.W, p.W, 120, (g, rng, w, h) => {
    const rg = g.createLinearGradient(0, 0, 0, h);
    rg.addColorStop(0, 'rgba(160,230,255,0)');
    rg.addColorStop(0.5, 'rgba(160,230,255,0.05)');
    rg.addColorStop(1, 'rgba(160,230,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, w, h);
  });
  ctx.drawImage(band, 0, rollY - 60);
}
