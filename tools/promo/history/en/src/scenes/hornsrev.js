// src/scenes/hornsrev.js
// Chapter "hornsrev" · 2002 · Horns Rev 1.
//
// Medium: satellite map / GIS (Satellite map on a light map screen). A bright top-down view with north
// up: the North Sea in stepped false-colour depth bands (deep blue -> turquoise over the Horns Rev
// reef), thin unlabelled bathymetric contour lines traced by marching squares, sand-wave ripples on
// the shoal, wind ripples, a faint graticule with a checkered neatline, a GIS tool strip
// (zoom / select / measure), an arrow cursor, a white locator card with north arrow, scale bar,
// "you are here" viewport box, coastline with sand beach, dunes and a patchwork of fields, and a
// legend + seabed-profile dock under the map. Satellite tells: every turbine casts a long shadow
// to the north-north-west (sun from the south-south-east) and clouds drift over with their own
// shadows offset the same way.
// Scene: the 80-turbine array of Horns Rev 1 as a regular 10 x 8 grid seen from straight above:
// each turbine is a white nacelle on a yellow transition-piece ring, rotor facing west into the
// prevailing wind (from above the blades show only as a north-south line whose tips swing in and
// out), and its shadow on the water shows the three blades turning. A service boat runs east along
// a lane between the rows, the export cable leaves the array eastward with pulses running toward
// the shore. The locator card shows where it is: Jutland's west coast with the Blåvandshuk point
// (lighthouse dot), the reef tongue running west from it, the farm, the cable to shore and a measure
// line "about 20 km". Depth: back = sea, contours, graticule (static); mid = turbines, boat, cable;
// fore = drifting clouds and the screen UI (cards, tool strip, cursor) and the rider on the dock.
// The dock (gallery-ride only, under the road line) is a schematic seabed profile from the farm to
// the shore with ten small turbines turning, and the legend.
// Story beat (bar 3): the cursor has picked the select tool at the end of bar 2; on the bar-3
// downbeat it drags a selection box across the whole array — each turbine lights amber as the box
// reaches it — and on the half-bar it lets go: all 80 flash, the farm blinks on the locator, and
// an info pop-up opens: "Horns Rev 1 · 2002 / 80 turbines × 2.0 MW = 160 MW". The marching-ants box and
// the pop-up stay through bar 4.
// Facts used (research/fact-sheet.md · hornsrev): 2002, 80 turbines of 2.0 MW = 160 MW, North Sea
// off Denmark's west coast, about 20 km west of Blåvandshuk, an export cable to shore, regular 8 x 10
// grid. Depths are never labelled (not verified); the profile is marked schematic. Geography note: with
// north up the Danish coast lies EAST (right) of the farm, so the coast is drawn on the right.
//
// Deterministic: no Math.random / Date — kit.hash11 / kit.noise* / baked PRNG only. Static layers
// (map, contours, farm bases, dock, locator card, tool strip, pop-up, clouds) are baked once.
// Stages: gallery-ride (1000x1000, road = top edge of the dock at y 700) and easel (the map is
// baked across the whole canvas; the 1000-unit design sits in p.layout; no dock, no rider).

export const meta = { stages: ['gallery-ride', 'easel'] };
const ID = 'hornsrev';
const TAU = Math.PI * 2;

// --- the array (design units) ---------------------------------------------------------------
const COLS = 10; // west -> east
const ROWS = 8; // north -> south
const SP = 42; // symbol spacing (map is not to scale for symbols)
const GX = 112;
const GY = 142; // bottom row at y 436, clear of the rider band (y 470-700)
const GRID_W = SP * (COLS - 1);
const GRID_H = SP * (ROWS - 1);
const LANE_Y = GY + SP * 3.5; // boat lane between rows 4 and 5
const ROAD = 700;

// turbine symbol geometry (top-down): rotor radius, hub height for the shadow, sun direction
const ROT_R = 14;
const HUB_H = 22;
const SUN_K = 0.78; // cot(sun elevation ~52°): shadows shorter than the symbols
const SH_E = -0.5; // shadow points NNW (azimuth 330°): east component
const SH_N = 0.866; //                                  north component

// --- UI rectangles (design units) -------------------------------------------------------------
const CARD = { x: 612, y: 52, w: 336, h: 336 };
const MAP = { x: 10, y: 34, w: 316, h: 292 }; // map area inside the card
const TOOL = { x: 40, y: 154, n: 4, s: 32, gap: 6 };
const POP = { x: GX - 10, y: 26, w: 336, h: 88 }; // tail tip (y 128) clears the top row's nacelles

// card map geography (card-map px, 10 px ≈ 1 km): farm centre, Blåvandshuk tip, cable landfall
const LOC_FARM = { x: 68, y: 200 };
const LOC_TIP = { x: 243, y: 127 };
const LOC_LAND = { x: 254, y: 101 };
const LOC_CTRL = { x: 172, y: 138 };
// coastline polyline, north -> tip -> south-east along the Skallingen side
const COAST = [
  [272, -4],
  [266, 30],
  [260, 66],
  [254, 96],
  [249, 112],
  [244, 123],
  [243, 127],
  [248, 132],
  [262, 138],
  [290, 151],
  [330, 170],
];

// --- colours ----------------------------------------------------------------------------------
const C = {
  sea: ['#3b8bc4', '#4a9bce', '#5daed8', '#77c1df', '#96d2e2', '#b9e3e0'], // deep -> shallow
  contour: 'rgba(14, 58, 98, 0.30)',
  contourMajor: 'rgba(14, 58, 98, 0.52)',
  grat: 'rgba(255, 255, 255, 0.28)',
  sand: '#f0e2b2',
  sandDk: '#d8c488',
  dune: '#dfd29a',
  land: ['#c9d79c', '#b6ca86', '#d5d9a3', '#a8bf7b', '#dccf95', '#bfd08f'],
  ink: '#22384b',
  inkSoft: '#5d7486',
  ui: '#f8fafb',
  uiLine: '#c3ced7',
  dock: '#e8eef2',
  white: '#ffffff',
  tp: '#f2c14e', // transition piece (marine yellow)
  shadow: 'rgba(12, 42, 74, 0.34)',
  shadowSoft: 'rgba(12, 42, 74, 0.24)', // turbine tower + rotor shadows (must not outweigh the white symbols)
  water: '#a9d7e8',
};
const BAND_T = [0.78, 0.68, 0.585, 0.495, 0.415]; // band edges, deep -> shallow

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mod = (a, n) => ((a % n) + n) % n;
const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const SEA_RGB = C.sea.map(hexRgb);

function bandOf(d) {
  for (let k = 0; k < BAND_T.length; k++) if (d > BAND_T[k]) return k;
  return BAND_T.length;
}

/** Depth value (0 shallow .. 1 deep) of the main view at design (x, y). The reef runs ~E-W. */
function depthMain(kit, x, y) {
  const ax = 330 - 0.16 * (x - 320) + 26 * Math.sin(x / 240 + 0.7);
  const dy = (y - ax) / 250;
  let d = 0.86 - 0.5 * Math.exp(-dy * dy);
  d += 0.24 * (kit.fbm2(x / 270 + 3.1, y / 270 + 7.7, 4, 5) - 0.5);
  d += 0.05 * (kit.noise2(x / 55, y / 55, 9) - 0.5);
  return d;
}

/** Depth of the locator map at card-map (x, y): deepens away from the coast, reef tongue west of the tip. */
function depthLoc(kit, x, y) {
  let d = 0.36 + 0.55 * clamp01(coastDist(x, y) / 210);
  const ry = LOC_TIP.y + (LOC_TIP.x - x) * 0.41;
  const ryd = (y - ry) / 30;
  if (x < LOC_TIP.x + 4) d -= 0.27 * Math.exp(-ryd * ryd) * clamp01((x + 60) / 120);
  d += 0.14 * (kit.fbm2(x / 70 + 1.3, y / 70 + 4.1, 3, 11) - 0.5);
  return d;
}

/** Distance (card-map px) from (x, y) to the coastline polyline. */
function coastDist(x, y) {
  let best = 1e9;
  for (let i = 0; i < COAST.length - 1; i++) {
    const [x0, y0] = COAST[i];
    const [x1, y1] = COAST[i + 1];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const t = clamp01(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy));
    const ex = x0 + dx * t - x;
    const ey = y0 + dy * t - y;
    best = Math.min(best, ex * ex + ey * ey);
  }
  return Math.sqrt(best);
}

// -----------------------------------------------------------------------------------------------
// marching squares on a value grid -> one stroked path per level
// -----------------------------------------------------------------------------------------------
function contourPath(g, vals, nx, ny, step, ox, oy, lvl) {
  g.beginPath();
  const v = (i, j) => vals[j * nx + i];
  const pts = [];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = v(i, j);
      const b = v(i + 1, j);
      const c = v(i + 1, j + 1);
      const d = v(i, j + 1);
      const idx = (a > lvl ? 8 : 0) | (b > lvl ? 4 : 0) | (c > lvl ? 2 : 0) | (d > lvl ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      pts.length = 0;
      const x0 = ox + i * step;
      const y0 = oy + j * step;
      if (a > lvl !== b > lvl) pts.push(x0 + ((lvl - a) / (b - a)) * step, y0);
      if (b > lvl !== c > lvl) pts.push(x0 + step, y0 + ((lvl - b) / (c - b)) * step);
      if (d > lvl !== c > lvl) pts.push(x0 + ((lvl - d) / (c - d)) * step, y0 + step);
      if (a > lvl !== d > lvl) pts.push(x0, y0 + ((lvl - a) / (d - a)) * step);
      for (let k = 0; k + 3 < pts.length; k += 4) {
        g.moveTo(pts[k], pts[k + 1]);
        g.lineTo(pts[k + 2], pts[k + 3]);
      }
    }
  }
}

/** Paint banded sea into an ImageData region using a coarse value grid (bilinear). */
function paintSea(g, x, y, w, h, vals, nx, step, rng) {
  const img = g.createImageData(w, h);
  const D = img.data;
  for (let py = 0; py < h; py++) {
    const gy = py / step;
    const j = Math.floor(gy);
    const fy = gy - j;
    for (let px = 0; px < w; px++) {
      const gx = px / step;
      const i = Math.floor(gx);
      const fx = gx - i;
      const k = j * nx + i;
      const a = vals[k];
      const b = vals[k + 1];
      const c = vals[k + nx];
      const e = vals[k + nx + 1];
      const d = (a + (b - a) * fx) * (1 - fy) + (c + (e - c) * fx) * fy;
      const bi = bandOf(d);
      const col = SEA_RGB[bi];
      // inside a band: slightly darker toward its deep edge (soft relief), plus pixel grain
      const hi = bi === 0 ? 1.1 : BAND_T[bi - 1];
      const lo = bi < BAND_T.length ? BAND_T[bi] : 0.25;
      const t = clamp01((d - lo) / (hi - lo));
      const s = 1.04 - 0.09 * t + (rng() - 0.5) * 0.025;
      const o = (py * w + px) * 4;
      D[o] = Math.min(255, col[0] * s);
      D[o + 1] = Math.min(255, col[1] * s);
      D[o + 2] = Math.min(255, col[2] * s);
      D[o + 3] = 255;
    }
  }
  g.putImageData(img, x, y);
}

// -----------------------------------------------------------------------------------------------
// background bake: sea, contours, ripples, graticule, farm bases + tower shadows, dock (gallery)
// -----------------------------------------------------------------------------------------------
function paintBackground(kit, g, rng, w, h, p, L) {
  const gallery = !p.safe;
  const step = 6;
  const nx = Math.ceil(w / step) + 2;
  const ny = Math.ceil(h / step) + 2;
  const vals = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) vals[j * nx + i] = depthMain(kit, (i * step - L.x) / L.s, (j * step - L.y) / L.s);
  paintSea(g, 0, 0, w, h, vals, nx, step, rng);

  // sun glint / haze: a soft bright patch toward the south-east
  const gl = g.createRadialGradient(w * 0.72, h * 0.85, 0, w * 0.72, h * 0.85, Math.max(w, h) * 0.6);
  gl.addColorStop(0, 'rgba(255,255,255,0.13)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl;
  g.fillRect(0, 0, w, h);

  // sand waves on the shoal: short N-S crests (perpendicular to the tidal current)
  const sc = L.s;
  for (let n = 0; n < (w * h) / 260; n++) {
    const x = rng() * w;
    const y = rng() * h;
    const d = depthMain(kit, (x - L.x) / sc, (y - L.y) / sc);
    if (d > 0.56) continue;
    const len = (10 + rng() * 22) * sc;
    const bend = (rng() - 0.5) * 6 * sc;
    g.strokeStyle = 'rgba(255,255,255,0.13)';
    g.lineWidth = 1.2 * sc;
    g.beginPath();
    g.moveTo(x, y - len / 2);
    g.quadraticCurveTo(x + bend, y, x + 1.5 * sc, y + len / 2);
    g.stroke();
    g.strokeStyle = 'rgba(10,50,80,0.08)';
    g.beginPath();
    g.moveTo(x + 2 * sc, y - len / 2);
    g.quadraticCurveTo(x + 2 * sc + bend, y, x + 3.5 * sc, y + len / 2);
    g.stroke();
  }
  // wind ripples everywhere: tiny pale dashes
  g.strokeStyle = 'rgba(255,255,255,0.07)';
  g.lineWidth = 1;
  g.beginPath();
  for (let n = 0; n < (w * h) / 700; n++) {
    const x = rng() * w;
    const y = rng() * h;
    const l = 3 + rng() * 6;
    g.moveTo(x, y);
    g.lineTo(x + l, y - l * 0.35);
  }
  g.stroke();

  // contours: minors between band edges, majors on band edges
  g.lineJoin = 'round';
  for (let k = 0; k < BAND_T.length - 1; k++) {
    contourPath(g, vals, nx, ny, step, 0, 0, (BAND_T[k] + BAND_T[k + 1]) / 2);
    g.strokeStyle = C.contour;
    g.lineWidth = 0.8 * sc;
    g.stroke();
  }
  for (const t of BAND_T) {
    contourPath(g, vals, nx, ny, step, 0, 0, t);
    g.strokeStyle = C.contourMajor;
    g.lineWidth = 1.2 * sc;
    g.stroke();
  }

  // design-space layers
  g.save();
  g.translate(L.x, L.y);
  g.scale(L.s, L.s);

  // graticule across the whole canvas
  const gx0 = Math.floor(L.x0 / 125) * 125;
  const gy0 = Math.floor(L.y0 / 125) * 125;
  g.strokeStyle = C.grat;
  g.lineWidth = 1;
  g.beginPath();
  for (let x = gx0; x <= L.x1; x += 125) {
    g.moveTo(x, L.y0);
    g.lineTo(x, gallery ? ROAD : L.y1);
  }
  for (let y = gy0; y <= (gallery ? ROAD : L.y1); y += 125) {
    g.moveTo(L.x0, y);
    g.lineTo(L.x1, y);
  }
  g.stroke();
  // graticule crosses
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 1.4;
  g.beginPath();
  for (let x = gx0; x <= L.x1; x += 125)
    for (let y = gy0; y <= (gallery ? ROAD : L.y1); y += 125) {
      g.moveTo(x - 6, y);
      g.lineTo(x + 6, y);
      g.moveTo(x, y - 6);
      g.lineTo(x, y + 6);
    }
  g.stroke();

  // static parts of each turbine: foam at the pile, tower shadow, yellow transition piece
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const x = GX + i * SP;
      const y = GY + j * SP;
      const hx = x + SH_E * SUN_K * HUB_H;
      const hy = y - SH_N * SUN_K * HUB_H;
      g.strokeStyle = C.shadowSoft;
      g.lineWidth = 2.6;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(hx, hy);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.beginPath();
      g.arc(x, y, 8, 0, TAU);
      g.fill();
      g.fillStyle = C.tp;
      g.strokeStyle = 'rgba(70,55,10,0.6)';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(x, y, 6, 0, TAU);
      g.fill();
      g.stroke();
    }

  if (gallery) paintDock(kit, g, rng);
  g.restore();

  // checkered neatline (gallery: just inside the frame, down to the dock)
  if (gallery) {
    const a = 32;
    const b2 = 968;
    g.fillStyle = C.ink;
    g.fillRect(a - 1, a - 1, b2 - a + 2, 8);
    g.fillRect(a - 1, a - 1, 8, ROAD - a);
    g.fillRect(b2 - 7, a - 1, 8, ROAD - a);
    g.fillStyle = C.white;
    for (let x = a + 62.5; x < b2 - 20; x += 125) g.fillRect(x, a + 1, 62.5, 4);
    for (let y = a + 62.5; y < ROAD - 20; y += 125) {
      g.fillRect(a + 1, y, 4, Math.min(62.5, ROAD - y));
      g.fillRect(b2 - 5, y, 4, Math.min(62.5, ROAD - y));
    }
    // small ticks on the inside of the neatline
    g.strokeStyle = C.ink;
    g.lineWidth = 1;
    g.beginPath();
    for (let x = a + 125 / 4; x < b2; x += 125 / 4) {
      g.moveTo(x, a + 7);
      g.lineTo(x, a + 11);
    }
    for (let y = a + 125 / 4; y < ROAD; y += 125 / 4) {
      g.moveTo(a + 7, y);
      g.lineTo(a + 11, y);
      g.moveTo(b2 - 7, y);
      g.lineTo(b2 - 11, y);
    }
    g.stroke();
  }
}

// -----------------------------------------------------------------------------------------------
// the dock under the road (gallery-ride): seabed profile + legend
// -----------------------------------------------------------------------------------------------
const PROF = { x0: 62, x1: 600, top: 762, sea: 842, bot: 950 };

/** Schematic seabed y along the profile, u 0 (farm, west) .. 1 (shore, east). */
function seabedY(kit, u) {
  let y;
  if (u < 0.46) y = 884 + 10 * Math.sin(u * 19) * 0.4;
  else if (u < 0.78) y = 884 - ((u - 0.46) / 0.32) * 10; // gentle rise along the reef (no unverified trough)
  else y = 874 - ((u - 0.78) / 0.22) ** 1.4 * 94;
  return y + 6 * (kit.noise1(u * 40, 3) - 0.5);
}
const PROF_TURB = Array.from({ length: COLS }, (_, i) => 0.1 + i * 0.034);

function paintDock(kit, g, rng) {
  g.fillStyle = C.dock;
  g.fillRect(0, ROAD, 1000, 300);
  // faint UI grid texture
  g.strokeStyle = 'rgba(34,56,75,0.05)';
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 0; x <= 1000; x += 12) {
    g.moveTo(x, ROAD);
    g.lineTo(x, 1000);
  }
  for (let y = ROAD; y <= 1000; y += 12) {
    g.moveTo(0, y);
    g.lineTo(1000, y);
  }
  g.stroke();
  // top edge = the road: a dark panel border with a soft shadow under it
  const sh = g.createLinearGradient(0, ROAD, 0, ROAD + 18);
  sh.addColorStop(0, 'rgba(20,40,60,0.22)');
  sh.addColorStop(1, 'rgba(20,40,60,0)');
  g.fillStyle = sh;
  g.fillRect(0, ROAD, 1000, 18);
  g.fillStyle = '#2b4458';
  g.fillRect(0, ROAD - 2, 1000, 5);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.fillRect(0, ROAD - 3, 1000, 1);

  const card = (x, y, w, h) => {
    g.save();
    g.shadowColor = 'rgba(20,40,60,0.18)';
    g.shadowBlur = 8;
    g.shadowOffsetY = 2;
    g.fillStyle = C.ui;
    g.fillRect(x, y, w, h);
    g.restore();
    g.strokeStyle = C.uiLine;
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  };

  // ---- profile card
  card(44, 724, 572, 236);
  g.fillStyle = C.ink;
  g.font = 'bold 16px ' + kit.FONT.sans;
  g.textBaseline = 'alphabetic';
  g.fillText('Seabed profile (schematic)', 58, 750);
  g.fillStyle = C.inkSoft;
  g.font = '13px ' + kit.FONT.sans;
  g.textAlign = 'right';
  g.fillText('Along the cable: farm → shore', 600, 750);
  g.textAlign = 'left';
  const X = (u) => PROF.x0 + (PROF.x1 - PROF.x0) * u;
  // water
  const wg = g.createLinearGradient(0, PROF.sea, 0, PROF.bot);
  wg.addColorStop(0, '#9fd3e6');
  wg.addColorStop(1, '#4f9fcb');
  g.fillStyle = wg;
  g.fillRect(PROF.x0, PROF.sea, PROF.x1 - PROF.x0, PROF.bot - PROF.sea);
  // sky strip
  g.fillStyle = '#f2f7fa';
  g.fillRect(PROF.x0, PROF.top, PROF.x1 - PROF.x0, PROF.sea - PROF.top);
  // seabed (sand) with stipple
  const bed = new Path2D();
  bed.moveTo(PROF.x0, PROF.bot);
  for (let k = 0; k <= 120; k++) bed.lineTo(X(k / 120), seabedY(kit, k / 120));
  bed.lineTo(PROF.x1, PROF.bot);
  bed.closePath();
  g.fillStyle = C.sand;
  g.fill(bed);
  g.save();
  g.clip(bed);
  g.fillStyle = 'rgba(150,120,60,0.35)';
  for (let n = 0; n < 900; n++) g.fillRect(PROF.x0 + rng() * (PROF.x1 - PROF.x0), 760 + rng() * 190, 1.4, 1.4);
  // dune grass on the shore end
  g.fillStyle = C.dune;
  g.fillRect(X(0.93), PROF.top, PROF.x1, 200);
  g.restore();
  g.strokeStyle = '#a88f52';
  g.lineWidth = 1.5;
  g.beginPath();
  for (let k = 0; k <= 120; k++) {
    const u = k / 120;
    if (k === 0) g.moveTo(X(u), seabedY(kit, u));
    else g.lineTo(X(u), seabedY(kit, u));
  }
  g.stroke();
  // export cable buried along the seabed from the last turbine to shore (dashed coral)
  g.strokeStyle = '#ff7a59';
  g.lineWidth = 2.2;
  g.setLineDash([6, 4]);
  g.beginPath();
  const u0 = PROF_TURB[COLS - 1];
  for (let k = 0; k <= 60; k++) {
    const u = u0 + (0.96 - u0) * (k / 60);
    const y = Math.min(seabedY(kit, u) + 4, PROF.sea + 200);
    if (k === 0) g.moveTo(X(u), y);
    else g.lineTo(X(u), y);
  }
  g.stroke();
  g.setLineDash([]);
  // monopiles + towers (rotors turn per frame)
  for (const u of PROF_TURB) {
    const x = Math.round(X(u));
    const yb = seabedY(kit, u);
    g.fillStyle = '#6e7f8c';
    g.fillRect(x - 1.8, PROF.sea - 2, 3.6, yb - PROF.sea + 2);
    g.fillStyle = C.tp;
    g.fillRect(x - 2.4, PROF.sea - 12, 4.8, 12);
    g.fillStyle = '#ffffff';
    g.strokeStyle = C.inkSoft;
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(x - 1.6, PROF.sea - 12);
    g.lineTo(x - 1, PROF.sea - 58);
    g.lineTo(x + 1, PROF.sea - 58);
    g.lineTo(x + 1.6, PROF.sea - 12);
    g.closePath();
    g.fill();
    g.stroke();
  }
  // axis frame (no numbers: depths are not verified)
  g.strokeStyle = C.inkSoft;
  g.lineWidth = 1;
  g.strokeRect(PROF.x0 + 0.5, PROF.top + 0.5, PROF.x1 - PROF.x0 - 1, PROF.bot - PROF.top - 1);
  g.beginPath();
  for (let k = 1; k < 10; k++) {
    const x = PROF.x0 + ((PROF.x1 - PROF.x0) * k) / 10;
    g.moveTo(x, PROF.bot);
    g.lineTo(x, PROF.bot - 5);
  }
  for (let k = 1; k < 5; k++) {
    const y = PROF.top + ((PROF.bot - PROF.top) * k) / 5;
    g.moveTo(PROF.x0, y);
    g.lineTo(PROF.x0 + 5, y);
  }
  g.stroke();
  g.fillStyle = C.ink;
  g.font = 'bold 13px ' + kit.FONT.sans;
  g.fillText('Farm', PROF.x0 + 6, PROF.top + 16);
  g.textAlign = 'right';
  g.fillText('Shore', PROF.x1 - 8, PROF.top + 16);
  g.textAlign = 'left';

  // ---- legend card
  card(636, 724, 320, 236);
  g.fillStyle = C.ink;
  g.font = 'bold 16px ' + kit.FONT.sans;
  g.fillText('Legend', 652, 750);
  const items = [
    ['turbine', 'Turbines (80)'],
    ['cable', 'Subsea cable'],
    ['contour', 'Depth contours'],
    ['sand', 'Beach and dunes'],
    ['select', 'Selection'],
  ];
  items.forEach(([k, label], n) => {
    const cy = 782 + n * 37;
    const sx = 676;
    if (k === 'turbine') {
      g.fillStyle = C.water;
      g.fillRect(sx - 20, cy - 13, 40, 26);
      g.fillStyle = C.tp;
      g.beginPath();
      g.arc(sx, cy, 4.4, 0, TAU);
      g.fill();
      g.fillStyle = C.white;
      g.strokeStyle = C.ink;
      g.lineWidth = 0.8;
      g.fillRect(sx - 3, cy - 2.2, 10, 4.4);
      g.strokeRect(sx - 3, cy - 2.2, 10, 4.4);
      g.strokeStyle = C.white;
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(sx - 4, cy - 10);
      g.lineTo(sx - 4, cy + 10);
      g.stroke();
    } else if (k === 'cable') {
      g.strokeStyle = '#ff7a59';
      g.lineWidth = 2.5;
      g.setLineDash([6, 4]);
      g.beginPath();
      g.moveTo(sx - 20, cy);
      g.lineTo(sx + 20, cy);
      g.stroke();
      g.setLineDash([]);
    } else if (k === 'contour') {
      g.fillStyle = C.sea[3];
      g.fillRect(sx - 20, cy - 13, 40, 26);
      g.strokeStyle = C.contourMajor;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(sx - 20, cy + 4);
      g.bezierCurveTo(sx - 8, cy - 10, sx + 6, cy + 10, sx + 20, cy - 4);
      g.stroke();
    } else if (k === 'sand') {
      g.fillStyle = C.sand;
      g.fillRect(sx - 20, cy - 13, 20, 26);
      g.fillStyle = C.dune;
      g.fillRect(sx, cy - 13, 20, 26);
      g.strokeStyle = C.uiLine;
      g.lineWidth = 1;
      g.strokeRect(sx - 19.5, cy - 12.5, 39, 25);
    } else {
      g.strokeStyle = '#d99a1c';
      g.lineWidth = 2;
      g.setLineDash([5, 3]);
      g.fillStyle = 'rgba(242,193,78,0.18)';
      g.fillRect(sx - 20, cy - 12, 40, 24);
      g.strokeRect(sx - 20, cy - 12, 40, 24);
      g.setLineDash([]);
    }
    g.fillStyle = C.ink;
    g.font = '15px ' + kit.FONT.sans;
    g.fillText(label, 712, cy + 5);
  });
}

// -----------------------------------------------------------------------------------------------
// locator card (baked; drawn at CARD in design space)
// -----------------------------------------------------------------------------------------------
const CARD_PAD = 14;

function paintCard(kit, g, rng) {
  const P = CARD_PAD;
  g.save();
  g.shadowColor = 'rgba(16,40,64,0.32)';
  g.shadowBlur = 14;
  g.shadowOffsetX = 2;
  g.shadowOffsetY = 5;
  g.fillStyle = C.ui;
  g.fillRect(P, P, CARD.w, CARD.h);
  g.restore();
  g.strokeStyle = C.uiLine;
  g.strokeRect(P + 0.5, P + 0.5, CARD.w - 1, CARD.h - 1);
  // header
  g.fillStyle = C.ink;
  g.font = 'bold 16px ' + kit.FONT.sans;
  g.textBaseline = 'alphabetic';
  g.fillText('Locator map', P + 12, P + 23);
  const hdW = g.measureText('Locator map').width;
  g.fillStyle = C.inkSoft;
  g.font = '13px ' + kit.FONT.sans;
  g.fillText('North Sea · off Denmark', P + 22 + hdW, P + 23);
  // window dots
  for (let k = 0; k < 3; k++) {
    g.fillStyle = ['#ff7a59', '#f2c14e', '#7fd1ae'][k];
    g.beginPath();
    g.arc(P + CARD.w - 16 - k * 14, P + 18, 4.2, 0, TAU);
    g.fill();
  }

  // ---- the map
  const mx = P + MAP.x;
  const my = P + MAP.y;
  g.save();
  g.translate(mx, my);
  g.beginPath();
  g.rect(0, 0, MAP.w, MAP.h);
  g.clip();
  const step = 4;
  const nx = Math.ceil(MAP.w / step) + 2;
  const ny = Math.ceil(MAP.h / step) + 2;
  const vals = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) vals[j * nx + i] = depthLoc(kit, i * step, j * step);
  // paintSea uses putImageData (ignores transforms): give it canvas coordinates
  paintSea(g, mx, my, MAP.w, MAP.h, vals, nx, step, rng);
  for (let k = 0; k < BAND_T.length; k++) {
    contourPath(g, vals, nx, ny, step, 0, 0, BAND_T[k]);
    g.strokeStyle = C.contour;
    g.lineWidth = 0.8;
    g.stroke();
  }
  // land: polygon right of the coast
  const coast = new Path2D();
  COAST.forEach(([x, y], i) => (i ? coast.lineTo(x, y) : coast.moveTo(x, y)));
  const land = new Path2D(coast);
  land.lineTo(MAP.w + 10, 175);
  land.lineTo(MAP.w + 10, -10);
  land.closePath();
  // beach: wide sand stroke centred on the coast
  g.strokeStyle = C.sand;
  g.lineWidth = 9;
  g.lineJoin = 'round';
  g.stroke(coast);
  g.save();
  g.clip(land);
  g.fillStyle = C.land[0];
  g.fillRect(0, 0, MAP.w + 10, MAP.h);
  // fields: a skewed patchwork
  for (let r = 0; r < 26; r++)
    for (let c = 0; c < 8; c++) {
      const x = 240 + c * 12 + (r % 2) * 5;
      const y = -6 + r * 9;
      g.fillStyle = C.land[Math.floor(rng() * C.land.length)];
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 11, y + 2);
      g.lineTo(x + 10, y + 10);
      g.lineTo(x - 1, y + 8);
      g.closePath();
      g.fill();
    }
  // dunes along the coast (inside the land)
  g.strokeStyle = C.dune;
  g.lineWidth = 26;
  g.stroke(coast);
  g.strokeStyle = 'rgba(160,140,80,0.35)';
  g.lineWidth = 0.8;
  for (let n = 0; n < 70; n++) {
    const t = rng();
    const k = Math.min(COAST.length - 2, Math.floor(t * (COAST.length - 1)));
    const f = t * (COAST.length - 1) - k;
    const x = COAST[k][0] + (COAST[k + 1][0] - COAST[k][0]) * f + 2 + rng() * 9;
    const y = COAST[k][1] + (COAST[k + 1][1] - COAST[k][1]) * f + rng() * 3;
    g.beginPath();
    g.arc(x, y, 1.5 + rng() * 2, Math.PI, TAU);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = C.sand;
  g.lineWidth = 4;
  g.stroke(coast);
  g.strokeStyle = 'rgba(70,96,90,0.75)';
  g.lineWidth = 1;
  g.stroke(coast);

  // viewport ("you are here") box: the main view's extent
  const k8 = 414 / 50; // main-view px per card px
  const vx0 = LOC_FARM.x - (GX + GRID_W / 2) / k8;
  const vy0 = LOC_FARM.y - (GY + GRID_H / 2) / k8;
  g.strokeStyle = C.ink;
  g.lineWidth = 1.2;
  g.setLineDash([4, 3]);
  g.strokeRect(vx0, vy0, 1000 / k8, ROAD / k8);
  g.setLineDash([]);
  // the farm: 10 x 8 tiny white dots
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.fillRect(LOC_FARM.x - 27, LOC_FARM.y - 22, 54, 44);
  g.fillStyle = C.white;
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) g.fillRect(LOC_FARM.x - 25 + i * 5.5, LOC_FARM.y - 19.5 + j * 5.5, 2.2, 2.2);
  // export cable to shore
  g.strokeStyle = '#ff7a59';
  g.lineWidth = 2.2;
  g.setLineDash([5, 3]);
  g.beginPath();
  g.moveTo(LOC_FARM.x + 26, LOC_FARM.y - 6);
  g.quadraticCurveTo(LOC_CTRL.x, LOC_CTRL.y, LOC_LAND.x, LOC_LAND.y);
  g.stroke();
  g.setLineDash([]);
  // measure line farm -> Blåvandshuk with end ticks
  const ax = LOC_FARM.x;
  const ay = LOC_FARM.y;
  const bx = LOC_TIP.x - 3;
  const by = LOC_TIP.y + 1;
  const len = Math.hypot(bx - ax, by - ay);
  const nxv = -(by - ay) / len;
  const nyv = (bx - ax) / len;
  g.strokeStyle = C.ink;
  g.lineWidth = 1.4;
  g.setLineDash([2, 3]);
  g.beginPath();
  g.moveTo(ax, ay);
  g.lineTo(bx, by);
  g.stroke();
  g.setLineDash([]);
  g.beginPath();
  for (const [x, y] of [
    [ax, ay],
    [bx, by],
  ]) {
    g.moveTo(x - nxv * 6, y - nyv * 6);
    g.lineTo(x + nxv * 6, y + nyv * 6);
  }
  g.stroke();
  // pill label
  const lx = (ax + bx) / 2 + 14;
  const ly = (ay + by) / 2 + 22;
  g.font = 'bold 14px ' + kit.FONT.sans;
  const tw = g.measureText('about 20 km').width;
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.strokeStyle = C.ink;
  g.lineWidth = 1;
  g.beginPath();
  if (g.roundRect) g.roundRect(lx - tw / 2 - 8, ly - 13, tw + 16, 22, 11);
  else g.rect(lx - tw / 2 - 8, ly - 13, tw + 16, 22);
  g.fill();
  g.stroke();
  g.fillStyle = C.ink;
  g.textAlign = 'center';
  g.fillText('about 20 km', lx, ly + 3);
  // lighthouse at the point
  g.fillStyle = '#d64933';
  g.beginPath();
  g.arc(LOC_TIP.x + 6, LOC_TIP.y - 3, 4.2, 0, TAU);
  g.fill();
  g.fillStyle = C.white;
  g.beginPath();
  g.arc(LOC_TIP.x + 6, LOC_TIP.y - 3, 1.6, 0, TAU);
  g.fill();
  // labels with halos
  const label = (t, x, y, font, col, align = 'left') => {
    g.font = font;
    g.textAlign = align;
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 3.5;
    g.strokeText(t, x, y);
    g.fillStyle = col;
    g.fillText(t, x, y);
  };
  label('Blåvandshuk', LOC_TIP.x - 8, LOC_TIP.y - 10, 'bold 13px ' + kit.FONT.sans, C.ink, 'right');
  label('Denmark', 310, 60, 'bold 15px ' + kit.FONT.sans, '#3d5a2a', 'right');
  label('North Sea', 106, 92, 'bold 19px ' + kit.FONT.sans, '#13507f', 'center');
  label('Horns Rev 1', LOC_FARM.x, LOC_FARM.y + 38, 'bold 13px ' + kit.FONT.sans, C.ink, 'center');
  // north arrow
  g.save();
  g.translate(26, 34);
  g.fillStyle = C.white;
  g.strokeStyle = C.ink;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(0, -16);
  g.lineTo(8, 10);
  g.lineTo(0, 5);
  g.lineTo(-8, 10);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = C.ink;
  g.beginPath();
  g.moveTo(0, -16);
  g.lineTo(0, 5);
  g.lineTo(-8, 10);
  g.closePath();
  g.fill();
  g.textAlign = 'center';
  g.font = 'bold 13px ' + kit.FONT.sans;
  g.fillText('N', 0, 25);
  g.restore();
  // scale bar: 20 km at 10 px / km
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.fillRect(8, MAP.h - 26, 236, 22);
  for (let k = 0; k < 4; k++) {
    g.fillStyle = k % 2 ? C.white : C.ink;
    g.fillRect(14 + k * 50, MAP.h - 14, 50, 5);
  }
  g.strokeStyle = C.ink;
  g.lineWidth = 1;
  g.strokeRect(14.5, MAP.h - 13.5, 200, 5);
  g.fillStyle = C.ink;
  g.font = 'bold 12px ' + kit.FONT.sans;
  g.textAlign = 'left';
  g.fillText('20 km', 218, MAP.h - 8);
  g.restore();
  g.strokeStyle = C.uiLine;
  g.lineWidth = 1;
  g.strokeRect(mx - 0.5, my - 0.5, MAP.w + 1, MAP.h + 1);
  g.textAlign = 'left';
}

/** Point on the locator cable (card-map coords) at t in 0..1. */
function cablePt(t) {
  const a = { x: LOC_FARM.x + 26, y: LOC_FARM.y - 6 };
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * LOC_CTRL.x + t * t * LOC_LAND.x,
    y: u * u * a.y + 2 * u * t * LOC_CTRL.y + t * t * LOC_LAND.y,
  };
}

// -----------------------------------------------------------------------------------------------
// tool strip, pop-up, clouds (baked sprites)
// -----------------------------------------------------------------------------------------------
function paintTools(kit, g) {
  const { s, gap, n } = TOOL;
  const P = 8;
  g.save();
  g.shadowColor = 'rgba(16,40,64,0.3)';
  g.shadowBlur = 8;
  g.shadowOffsetY = 3;
  g.fillStyle = C.ui;
  g.fillRect(P, P, s + 8, n * (s + gap) + 8 - gap);
  g.restore();
  g.strokeStyle = C.uiLine;
  g.strokeRect(P + 0.5, P + 0.5, s + 7, n * (s + gap) + 7 - gap);
  for (let k = 0; k < n; k++) {
    const x = P + 4;
    const y = P + 4 + k * (s + gap);
    g.fillStyle = C.white;
    g.fillRect(x, y, s, s);
    g.strokeStyle = C.uiLine;
    g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
    const cx = x + s / 2;
    const cy = y + s / 2;
    g.strokeStyle = C.ink;
    g.lineWidth = 2.2;
    g.lineCap = 'round';
    g.beginPath();
    if (k === 0) {
      g.moveTo(cx - 8, cy);
      g.lineTo(cx + 8, cy);
      g.moveTo(cx, cy - 8);
      g.lineTo(cx, cy + 8);
      g.stroke();
    } else if (k === 1) {
      g.moveTo(cx - 8, cy);
      g.lineTo(cx + 8, cy);
      g.stroke();
    } else if (k === 2) {
      g.lineWidth = 1.6;
      g.setLineDash([3, 2.5]);
      g.strokeRect(cx - 9, cy - 8, 18, 16);
      g.setLineDash([]);
    } else {
      g.lineWidth = 1.6;
      g.moveTo(cx - 10, cy + 6);
      g.lineTo(cx + 10, cy - 6);
      for (let t = 0; t <= 4; t++) {
        const px = cx - 10 + t * 5;
        const py = cy + 6 - t * 3;
        g.moveTo(px, py);
        g.lineTo(px + 2.2, py + 3.7);
      }
      g.stroke();
    }
  }
}

function paintPopup(kit, g) {
  const P = 12;
  const { w, h } = POP;
  g.save();
  g.shadowColor = 'rgba(16,40,64,0.32)';
  g.shadowBlur = 12;
  g.shadowOffsetY = 4;
  g.fillStyle = C.ui;
  g.beginPath();
  g.moveTo(P, P);
  g.lineTo(P + w, P);
  g.lineTo(P + w, P + h);
  g.lineTo(P + 74, P + h);
  g.lineTo(P + 62, P + h + 14);
  g.lineTo(P + 50, P + h);
  g.lineTo(P, P + h);
  g.closePath();
  g.fill();
  g.restore();
  g.strokeStyle = C.uiLine;
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = '#f2c14e';
  g.fillRect(P, P, 5, h);
  g.textBaseline = 'alphabetic';
  g.fillStyle = C.ink;
  g.font = 'bold 22px ' + kit.FONT.sans;
  g.fillText('Horns Rev 1', P + 18, P + 30);
  g.fillStyle = '#e0613f';
  g.textAlign = 'right';
  g.fillText('2002', P + w - 14, P + 30);
  g.textAlign = 'left';
  g.fillStyle = C.ink;
  g.font = '19px ' + kit.FONT.sans;
  g.fillText('80 turbines × 2.0 MW = 160 MW', P + 18, P + 58);
  g.fillStyle = C.inkSoft;
  g.font = '14px ' + kit.FONT.sans;
  g.fillText("North Sea off Denmark's west coast · built 2002", P + 18, P + 79);
}

function paintCloud(kit, g, rng, w, h, col) {
  const k = w / 420;
  for (let n = 0; n < 34; n++) {
    const t = n / 33;
    const x = w * (0.14 + 0.72 * t) + (rng() - 0.5) * 30;
    const y = h * 0.5 + (rng() - 0.5) * h * 0.32 * Math.sin(t * Math.PI);
    const r = (22 + rng() * 34) * k * Math.sin(0.15 + t * 2.84);
    const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(4, r));
    gr.addColorStop(0, col.replace('A', '0.34'));
    gr.addColorStop(1, col.replace('A', '0'));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // fine streaks (cirrus texture)
  g.strokeStyle = col.replace('A', '0.10');
  g.lineWidth = 2;
  for (let n = 0; n < 16; n++) {
    const y = h * (0.3 + rng() * 0.4);
    const x = w * (0.15 + rng() * 0.4);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + w * 0.2, y - 8 + rng() * 16, x + w * (0.3 + rng() * 0.2), y + (rng() - 0.5) * 10);
    g.stroke();
  }
}

// drifting clouds: size, height, speed (east), phase
const CLOUDS = [
  { w: 470, h: 210, y: 500, v: 34, o: 0.1 },
  { w: 320, h: 150, y: 26, v: 48, o: 0.62 },
];

/** Cloud with its shadow on the sea (offset to the NNW, like the turbines' shadows). */
function paintCloudSprite(kit, g, rng, c) {
  const sh = kit.createCanvas(c.w, c.h);
  const r2 = kit.makePRNG(kit.hashSeed(ID + c.w));
  paintCloud(kit, sh.getContext('2d'), r2, c.w, c.h, 'rgba(20,60,95,A)');
  g.globalAlpha = 0.38;
  g.drawImage(sh, 0, 0);
  g.globalAlpha = 1;
  const cl = kit.createCanvas(c.w, c.h);
  paintCloud(kit, cl.getContext('2d'), kit.makePRNG(kit.hashSeed(ID + c.w)), c.w, c.h, 'rgba(255,255,255,A)');
  g.drawImage(cl, 50, 76);
}

// -----------------------------------------------------------------------------------------------
// animated pieces
// -----------------------------------------------------------------------------------------------
/** Cursor position + state for time T (design coords). */
function cursorAt(kit, T, b) {
  const sel = { x: TOOL.x + 8 + 4 + TOOL.s / 2, y: TOOL.y + 8 + 4 + 2 * (TOOL.s + TOOL.gap) + TOOL.s / 2 };
  const idle = { x: 588 + 16 * (kit.noise1(T * 0.7, 2) - 0.5), y: 536 + 14 * (kit.noise1(T * 0.6, 5) - 0.5) };
  const A = { x: GX - 28, y: GY - 34 };
  const B = { x: GX + GRID_W + 26, y: GY + GRID_H + 22 }; // release point stays above the rider band
  const rest = { x: 566 + 10 * (kit.noise1(T * 0.5, 8) - 0.5), y: 452 + 8 * (kit.noise1(T * 0.6, 9) - 0.5) };
  const mix = (P, Q, t) => ({ x: P.x + (Q.x - P.x) * t, y: P.y + (Q.y - P.y) * t });
  const ez = (a, c) => kit.smootherstep(a * b, c * b, T);
  let pos;
  if (T < 1.35 * b) pos = idle;
  else if (T < 1.75 * b) pos = mix(idle, sel, ez(1.35, 1.72));
  else if (T < 2.0 * b) pos = mix(sel, A, ez(1.8, 1.98));
  else if (T < 2.5 * b) pos = mix(A, B, kit.smoothstep(2.0 * b, 2.5 * b, T));
  else if (T < 3.0 * b) pos = B;
  else pos = mix(B, rest, ez(3.0, 3.5));
  return { pos, A, B, sel };
}

function drawCursor(ctx, x, y, pressed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.3, 1.3);
  ctx.fillStyle = 'rgba(12,30,50,0.28)';
  ctx.translate(2, 2.5);
  const arrow = new Path2D('M0 0 L0 19 L4.6 14.8 L8 22.2 L11.2 20.8 L7.8 13.6 L13.8 13.6 Z');
  ctx.fill(arrow);
  ctx.translate(-2, -2.5);
  ctx.fillStyle = pressed ? '#fff3cf' : C.white;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  ctx.fill(arrow);
  ctx.stroke(arrow);
  ctx.restore();
}

function drawRipple(ctx, x, y, age, col) {
  if (age < 0 || age > 0.45) return;
  const e = age / 0.45;
  ctx.strokeStyle = col;
  ctx.globalAlpha = 1 - e;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 4 + 22 * e, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Clip to the map's inner rect: gallery = inside the checkered neatline, easel = the whole map. */
function clipMap(ctx, gallery, L) {
  ctx.beginPath();
  if (gallery) ctx.rect(39, 39, 922, ROAD - 3 - 39);
  else ctx.rect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
  ctx.clip();
}

function drawBoat(ctx, T, p, gallery, L) {
  // runs from behind the west neatline (easel: the canvas edge) to under the locator card, wake included
  const x0 = gallery ? 20 : Math.min(20, L.x0 - 20);
  const span = CARD.x + 130 - x0;
  const P = (p.chapterSec * 1.3 * span) / 1200;
  const x = x0 + mod(T / P + 0.42, 1) * span;
  const y = LANE_Y + 2 * Math.sin(T * 0.9);
  // wake: widening V + foam
  const wg = ctx.createLinearGradient(x - 120, 0, x - 10, 0);
  wg.addColorStop(0, 'rgba(255,255,255,0)');
  wg.addColorStop(1, 'rgba(255,255,255,0.75)');
  ctx.strokeStyle = wg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 4);
  ctx.lineTo(x - 120, y - 22);
  ctx.moveTo(x - 12, y + 4);
  ctx.lineTo(x - 120, y + 22);
  ctx.stroke();
  ctx.fillStyle = wg;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 4.5);
  ctx.lineTo(x - 95, y - 2);
  ctx.lineTo(x - 95, y + 2);
  ctx.lineTo(x - 12, y + 4.5);
  ctx.closePath();
  ctx.fill();
  // shadow, hull (catamaran crew boat, bow east), wheelhouse
  const hull = new Path2D(`M${x - 14} ${y - 6} L${x + 8} ${y - 6} L${x + 16} ${y} L${x + 8} ${y + 6} L${x - 14} ${y + 6} Z`);
  ctx.save();
  ctx.translate(-4, -6);
  ctx.fillStyle = C.shadow;
  ctx.fill(hull);
  ctx.restore();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1;
  ctx.fill(hull);
  ctx.stroke(hull);
  ctx.fillStyle = '#ff7a59';
  ctx.fillRect(x - 14, y - 6, 22, 1.8);
  ctx.fillRect(x - 14, y + 4.2, 22, 1.8);
  ctx.fillStyle = '#dfe7ec';
  ctx.fillRect(x - 5, y - 3.4, 9, 6.8);
  ctx.strokeRect(x - 5, y - 3.4, 9, 6.8);
}

// turbine sprite frames: rotor angle over one third of a turn (three blades) in TF.n steps
const TF = { w: 42, h: 70, ax: 27, ay: 50, n: 24 };

function paintTurbineAtlas(g) {
  for (let f = 0; f < TF.n; f++) {
    const x = f * TF.w + TF.ax;
    const y = TF.ay;
    const ph = (f / TF.n) * (TAU / 3);
    const hx = x - 4;
    const shx = hx + SH_E * SUN_K * HUB_H;
    const shy = y - SH_N * SUN_K * HUB_H;
    g.lineCap = 'round';
    // shadow of the rotor (blades in a N-S vertical plane, sun from the SSE)
    g.strokeStyle = C.shadowSoft;
    g.lineWidth = 2.2;
    g.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = ph + (k * TAU) / 3;
      const north = ROT_R * Math.sin(a);
      const up = ROT_R * Math.cos(a);
      g.moveTo(shx, shy);
      g.lineTo(shx + SH_E * SUN_K * up, shy - north - SH_N * SUN_K * up);
    }
    g.stroke();
    // nacelle (rotor faces west, into the prevailing wind)
    g.fillStyle = C.white;
    g.strokeStyle = 'rgba(20,40,60,0.65)';
    g.lineWidth = 0.9;
    g.fillRect(x - 3, y - 2.6, 12, 5.2);
    g.strokeRect(x - 3, y - 2.6, 12, 5.2);
    // top view: only the north-south component of each blade shows
    g.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = ph + (k * TAU) / 3;
      g.moveTo(hx, y);
      g.lineTo(hx, y - ROT_R * Math.sin(a));
    }
    g.strokeStyle = 'rgba(20,40,60,0.5)';
    g.lineWidth = 4.4;
    g.stroke();
    g.strokeStyle = C.white;
    g.lineWidth = 2.6;
    g.stroke();
  }
}

/** All 80 selection rings, laid out like the array (origin = first turbine - 20). */
function paintHighlights(g, sel, selDk) {
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const x = 20 + i * SP;
      const y = 20 + j * SP;
      g.fillStyle = 'rgba(242,193,78,0.28)';
      g.beginPath();
      g.arc(x, y, 12, 0, TAU);
      g.fill();
      g.strokeStyle = selDk;
      g.lineWidth = 2.2;
      g.stroke();
      g.strokeStyle = sel;
      g.lineWidth = 1;
      g.beginPath();
      g.arc(x, y, 15, 0, TAU);
      g.stroke();
    }
}

// side-view rotor frames for the dock profile
const PF = { s: 28, n: 24 };
function paintProfileRotors(g) {
  for (let f = 0; f < PF.n; f++) {
    const cx = f * PF.s + PF.s / 2;
    const cy = PF.s / 2;
    const a0 = (f / PF.n) * (TAU / 3);
    g.strokeStyle = C.ink;
    g.lineWidth = 1.6;
    g.lineCap = 'round';
    g.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = a0 + (k * TAU) / 3;
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11);
    }
    g.stroke();
    g.fillStyle = C.ink;
    g.beginPath();
    g.arc(cx, cy, 2, 0, TAU);
    g.fill();
  }
}

// -----------------------------------------------------------------------------------------------
// render
// -----------------------------------------------------------------------------------------------
const riderStyle = (p) => ({
  plumage: '#ffffff',
  plumageShade: '#dfe8ee',
  outline: C.ink,
  outlineWidth: 2.2,
  shading: false,
  frame: '#ff7a59',
  frameShade: '#d65a3c',
  tire: C.ink,
  rim: '#9fb3c2',
  saddle: C.ink,
  metal: '#4b6274',
  spokes: 6,
  crest: '#f2c14e',
  breast: '#f2c14e',
  prop: { type: p.prop.type, colors: [C.white, '#ff7a59'] },
});

export function render(kit, ctx, p) {
  const b = p.beat.barSec;
  const T = p.isThumbnail ? 3.4 * b : p.rawLocalT; // thumbnails: a fixed calm frame after the beat
  const gallery = !p.safe;
  const L = kit.layout(p);
  const HOT = '#ff7a59';
  const SEL = '#f2c14e';
  const SEL_DK = '#d99a1c';

  ctx.save();
  ctx.drawImage(kit.bake(ID + '_bg_en1', p.W, p.H, (g, rng, w, h) => paintBackground(kit, g, rng, w, h, p, L)), 0, 0);
  ctx.translate(L.x, L.y);
  ctx.scale(L.s, L.s);

  const cur = cursorAt(kit, T, b);
  const dragging = T >= 2.0 * b && T < 2.5 * b;
  const selOn = T >= 2.0 * b;
  const rx0 = cur.A.x;
  const ry0 = cur.A.y;
  const rx1 = selOn ? (dragging ? cur.pos.x : cur.B.x) : rx0;
  const ry1 = selOn ? (dragging ? cur.pos.y : cur.B.y) : ry0;
  const released = T >= 2.5 * b;
  const relAge = T - 2.5 * b;

  // ---- export cable leaving the array to the east (pulses run toward shore)
  {
    ctx.save();
    clipMap(ctx, gallery, L);
    const sx = GX + GRID_W;
    const sy = GY + SP * 3;
    const ex = CARD.x + 40;
    const ey = sy - (ex - sx) * 0.52;
    ctx.strokeStyle = HOT;
    ctx.lineWidth = 2.6;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -T * 30;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.restore();
  }

  // ---- turbines: baked sprite frames (rotor shadow + nacelle + blades), highlight layer under them
  const atlas = kit.bake(ID + '_turb_v2', TF.w * TF.n, TF.h, (g) => paintTurbineAtlas(g));
  const hlLayer = kit.bake(ID + '_hl_v2', GRID_W + 40, GRID_H + 40, (g) => paintHighlights(g, SEL, SEL_DK));
  let selI = -1;
  let selJ = -1;
  if (selOn) {
    // the box grows from the north-west corner: columns / rows whose centre it covers
    selI = Math.min(COLS - 1, Math.floor((Math.max(rx0, rx1) - GX) / SP));
    selJ = Math.min(ROWS - 1, Math.floor((Math.max(ry0, ry1) - GY) / SP));
    if (selI >= 0 && selJ >= 0) {
      const sw = (selI + 1) * SP;
      const sh = (selJ + 1) * SP;
      ctx.drawImage(hlLayer, 0, 0, sw, sh, GX - 20, GY - 20, sw, sh);
    }
  }
  const per = TAU / 3;
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const n = j * COLS + i;
      const w = TAU * (0.3 + 0.03 * kit.hash11(n * 3.1));
      const ph = T * w + kit.hash11(n * 7.7) * TAU;
      const f = Math.floor((mod(ph, per) / per) * TF.n) % TF.n;
      ctx.drawImage(atlas, f * TF.w, 0, TF.w, TF.h, GX + i * SP - TF.ax, GY + j * SP - TF.ay, TF.w, TF.h);
    }
  // release: the whole selection flashes once
  if (released && relAge < p.beat.beatSec && !p.isThumbnail && selI >= 0) {
    ctx.globalAlpha = 0.55 * (1 - relAge / p.beat.beatSec);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(hlLayer, GX - 20, GY - 20);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // ---- service boat
  ctx.save();
  clipMap(ctx, gallery, L);
  drawBoat(ctx, T, p, gallery, L);
  ctx.restore();

  // ---- dock: profile rotors + water surface (gallery only)
  if (gallery) {
    const X = (u) => PROF.x0 + (PROF.x1 - PROF.x0) * u;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let k = 0; k <= 24; k++) {
      const x = PROF.x0 + ((PROF.x1 - PROF.x0) * k) / 24;
      const y = PROF.sea + 1.6 * Math.sin(x * 0.09 - T * 3);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const pr = kit.bake(ID + '_prot_v1', PF.s * PF.n, PF.s, (g) => paintProfileRotors(g));
    PROF_TURB.forEach((u, i) => {
      const ph = T * TAU * 0.33 + kit.hash11(i * 5.3) * TAU;
      const f = Math.floor((mod(ph, TAU / 3) / (TAU / 3)) * PF.n) % PF.n;
      ctx.drawImage(pr, f * PF.s, 0, PF.s, PF.s, Math.round(X(u)) - PF.s / 2, PROF.sea - 58 - PF.s / 2, PF.s, PF.s);
    });
  }

  // ---- clouds and their shadows (foreground, drift east faster than anything else)
  {
    ctx.save();
    clipMap(ctx, gallery, L); // imagery never crosses the map frame
    const x0 = Math.min(0, L.x0) - 520;
    const spanX = Math.max(1000, L.x1) - x0 + 60;
    for (let k = 0; k < CLOUDS.length; k++) {
      const c = CLOUDS[k];
      const spr = kit.bake(ID + '_cloud' + k + '_v1', c.w + 50, c.h + 76, (g, rng) => paintCloudSprite(kit, g, rng, c));
      const x = Math.round(x0 + mod(c.o * spanX + T * c.v, spanX));
      ctx.drawImage(spr, x - 50, c.y - 76);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---- selection box (marching ants)
  if (selOn) {
    const x = Math.min(rx0, rx1);
    const y = Math.min(ry0, ry1);
    const w = Math.abs(rx1 - rx0);
    const h = Math.abs(ry1 - ry0);
    ctx.fillStyle = 'rgba(242,193,78,0.10)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = SEL_DK;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = -T * 14;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    if (released) {
      // corner handles
      ctx.fillStyle = C.white;
      ctx.strokeStyle = SEL_DK;
      ctx.lineWidth = 1.5;
      for (const [hx, hy] of [
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h],
      ]) {
        ctx.fillRect(hx - 4, hy - 4, 8, 8);
        ctx.strokeRect(hx - 4, hy - 4, 8, 8);
      }
    }
  }

  // ---- locator card + live overlays
  {
    const card = kit.bake(ID + '_card_en1', CARD.w + CARD_PAD * 2, CARD.h + CARD_PAD * 2, (g, rng) => paintCard(kit, g, rng));
    ctx.drawImage(card, CARD.x - CARD_PAD, CARD.y - CARD_PAD);
    const ox = CARD.x + MAP.x;
    const oy = CARD.y + MAP.y;
    // power pulses along the cable, one per beat
    const bs = p.beat.beatSec;
    for (let k = 0; k < 2; k++) {
      const t = mod(T / (bs * 2) + k * 0.5, 1);
      const q = cablePt(t);
      ctx.fillStyle = 'rgba(255,122,89,0.35)';
      ctx.beginPath();
      ctx.arc(ox + q.x, oy + q.y, 5.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = HOT;
      ctx.beginPath();
      ctx.arc(ox + q.x, oy + q.y, 2.6, 0, TAU);
      ctx.fill();
    }
    // the farm blinks once selected
    if (released) {
      const blink = p.isThumbnail ? 1 : 0.55 + 0.45 * Math.cos(Math.min(relAge, 6) * 6);
      ctx.strokeStyle = SEL_DK;
      ctx.globalAlpha = blink;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(ox + LOC_FARM.x - 29, oy + LOC_FARM.y - 24, 58, 48);
      ctx.globalAlpha = 1;
    }
  }

  // ---- tool strip
  {
    const tools = kit.bake(ID + '_tools_v1', TOOL.s + 24, TOOL.n * (TOOL.s + TOOL.gap) + 24, (g) => paintTools(kit, g));
    ctx.drawImage(tools, TOOL.x, TOOL.y);
    if (T >= 1.75 * b) {
      const bx = TOOL.x + 12;
      const by = TOOL.y + 12 + 2 * (TOOL.s + TOOL.gap);
      ctx.strokeStyle = '#2f9e78';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(bx - 1, by - 1, TOOL.s + 2, TOOL.s + 2);
      ctx.fillStyle = 'rgba(127,209,174,0.28)';
      ctx.fillRect(bx, by, TOOL.s, TOOL.s);
    }
  }

  // ---- info pop-up
  if (released) {
    const a = p.isThumbnail ? 1 : kit.smoothstep(0, 0.2 * b, relAge);
    const pop = kit.bake(ID + '_pop_en1', POP.w + 24, POP.h + 40, (g) => paintPopup(kit, g));
    const s = 0.88 + 0.12 * a;
    const ax = POP.x + 62;
    const ay = POP.y + POP.h + 14;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(ax, ay);
    ctx.scale(s, s);
    ctx.translate(-ax, -ay);
    ctx.drawImage(pop, POP.x - 12, POP.y - 12);
    ctx.restore();
  }

  // ---- cursor + click ripples
  if (!p.isThumbnail) {
    drawRipple(ctx, cur.sel.x, cur.sel.y, T - 1.75 * b, '#2f9e78');
    drawRipple(ctx, cur.A.x, cur.A.y, T - 2.0 * b, SEL_DK);
    drawRipple(ctx, cur.B.x, cur.B.y, relAge, SEL_DK);
  }
  if (!p.isThumbnail) drawCursor(ctx, cur.pos.x, cur.pos.y, dragging);

  ctx.restore();

  // ---- the rider on the dock edge, re-styled as a flat map symbol (white, navy outline, coral bike)
  if (p.actor && p.actor.visible) p.actor.draw(ctx, p.actor.rig(), riderStyle(p));
}
