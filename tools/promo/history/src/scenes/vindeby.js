// src/scenes/vindeby.js
// Chapter "vindeby" · 1991 · Vindeby 離岸風場.
//
// Medium: 像素遊戲 (Pixel art, early-90s 16-bit console screen). Everything is drawn on a
// low-resolution grid (1 art pixel = 5 canvas px) and blitted up with hard edges: a limited
// palette (~20 colours), ordered (Bayer) dithering in the sky and sea gradients, 1-px sprite
// outlines on the near machines, stepped motion (sprites move on an 8–10 Hz clock, rotors turn
// in fixed angle steps), 2-frame flapping gulls, and a black game HUD across the top drawn in a
// hand-made 5x7 bitmap font: "TURBINES" with eleven turbine "life" icons and an "MW" counter.
// Scene: the Vindeby farm off Lolland — eleven small white three-bladed turbines in two rows
// standing on grey concrete foundations in a calm, shallow grey-green Baltic; perspective
// shrinks the rows toward the low, flat Lolland coast (fields, red-roofed village, a
// whitewashed church tower) on the left horizon. A small work boat comes in to the nearest
// foundation. Depth: back = dithered sky, pixel clouds (two drift rates), pale sun, coast,
// distant sail; mid = the two turbine rows with their water reflections, glinting sea, the
// boat; fore = a wooden pier the rider rides along, its piles and the darker near water with
// fast-scrolling wave crests, a bobbing buoy and a big gull crossing low.
// Story beat (bar 3): the turbines stand parked while the work boat comes in and ties up at
// the nearest foundation (beat 3 of bar 2, before the rider gets there); on the bar-3
// downbeat the farm "goes online" — one turbine per eighth note, nearest first, each rotor
// spins up with a sparkle while its HUD icon lights (11 in all, ~1¼ bars); when the
// eleventh is lit the HUD's "MW" readout blinks to 5 (11 × 450 kW, about 5 MW). In bar 4 the
// boat stays moored while the rider passes and leaves to the right after it (end of bar 4).
// Facts used (research/fact-sheet.md · vindeby): 11 turbines, 450 kW each, about 5 MW, 1991
// grid connection; two rows, white tubular towers on concrete foundations, shallow calm sea,
// low Lolland coast and villages, one small work boat; no brand marks. Water depth and distance
// from shore are deliberately not shown (not verified).
//
// Deterministic: no Math.random / Date — kit.hash11 / kit.noise1 only; static layers baked.
// Stages: gallery-ride (1000x1000, road = pier deck at y 700) and easel (1920x1080, the design
// strip is shifted into p.safe on the same 5-px grid; no rider there).

export const meta = { stages: ['gallery-ride', 'easel'] };
const ID = 'vindeby';
const CELL = 5; // one art pixel = 5 canvas px (gallery 1000 -> 200 art px, easel 1920 -> 384)

// --- limited palette (16-bit console feel; derived from the chapter palette) ---------------
const C = {
  ink: '#1d1d1d',
  hud: '#141618',
  hudLine: '#e9e4d6',
  sky0: '#3f8fd2',
  sky1: '#62a5dc',
  sky2: '#8fbee3',
  sky3: '#bdd6e6',
  haze: '#d6dcd8',
  cloud: '#f6f4ee',
  cloudSh: '#c9c5bb',
  cloudSh2: '#a9b4bf',
  sun: '#fbf0c4',
  sea0: '#a7bdb3',
  sea1: '#8aa79c',
  sea2: '#6f9186',
  sea3: '#587d72',
  seaD0: '#4c6f65',
  seaD1: '#3c5c54',
  seaD2: '#2c4842',
  glint: '#e4eee9',
  glint2: '#bcd0c8',
  land0: '#2e7d32',
  land1: '#1f5a26',
  field: '#6a9a3e',
  sand: '#d8cb9c',
  wall: '#efe6cf',
  roof: '#b4472f',
  white: '#f4f4ef',
  grey: '#c3c8cc',
  grey2: '#8e959a',
  concrete: '#9d9d95',
  concreteSh: '#6c6d68',
  wood: '#a07a52',
  woodLt: '#c49a68',
  woodDk: '#5e4129',
  woodDk2: '#3f2c1c',
  yellow: '#f2c14e',
  yellowDk: '#b8862a',
  boatHull: '#24476b',
  boatHull2: '#3f8fd2',
  red: '#c2412e',
  far: '#8e959a', // distance outline for the far machines (solid enough to read against clouds)
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const mod = (a, n) => ((a % n) + n) % n; // JS % keeps the sign (rawLocalT < 0 while sliding in)
const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

// --- layout in art pixels (gallery numbers; easel adds the offset) ----------------------------
const HY = 86; // horizon
const ROAD = 140; // pier deck top = road (y 700)
const MAIN_X = 144; // nearest turbine (x 720)
const DOCK_X = 158; // boat centre when moored at the nearest foundation (bow to the east side)
const BOAT_Y = 123; // boat waterline

/** Eleven turbines in two parallel rows, placed with a simple pinhole projection. */
const TURB = (() => {
  const L = [];
  const f = 100;
  const cx = 100;
  const step = [-0.7, 0.55];
  const add = (X, Z, row) => {
    const s = 1 / Z;
    L.push({ x: Math.round(cx + (f * X) / Z), s, Z, row, base: Math.round(HY + 34 * s) });
  };
  for (let i = 0; i < 6; i++) add(0.44 + i * step[0], 1 + i * step[1], 0); // near row: 6
  for (let i = 0; i < 5; i++) add(0.6 + i * step[0], 2.1 + i * step[1], 1); // far row: 5, offset half a spacing so each tower stands clear
  const byNear = L.slice().sort((a, b) => a.Z - b.Z);
  byNear.forEach((t, k) => (t.order = k)); // start order: nearest first
  for (const t of L) {
    t.hub = Math.round(t.base - 66 * t.s); // nearest tip stays below the HUD
    t.R = Math.max(4, Math.round(32 * t.s));
    t.park = -Math.PI / 2 + (((t.order * 0.618) % 1) - 0.5) * 0.5;
  }
  return L.sort((a, b) => b.Z - a.Z); // draw far -> near
})();

// --- 5x7 bitmap font for the HUD -------------------------------------------------------------
const GLYPH = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
};
function bitText(g, str, x, y, color, shadow) {
  for (let pass = shadow ? 0 : 1; pass < 2; pass++) {
    g.fillStyle = pass === 0 ? shadow : color;
    const o = pass === 0 ? 1 : 0;
    let cx = x;
    for (const ch of str) {
      const gl = GLYPH[ch];
      if (gl) for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (gl[r][c] === '1') g.fillRect(cx + c + o, y + r + o, 1, 1);
      cx += 6;
    }
  }
}

// small sprites as strings ('.' = clear)
const GULL_FAR = [
  ['1...1', '.1.1.', '..1..'],
  ['.....', '11.11', '..1..'],
];
const GULL_BIG = [
  ['g.........g', 'ww.......ww', '.ww.....ww.', '..wwwwwww..', '.yw#wwgg...', '..www......'],
  ['...........', '...........', 'gwwwwwwwwwg', '.wwwwwwwgg.', 'yw#ww......', '.www.......'],
];
const SPR_COL = { 1: '#3b4248', g: C.grey2, w: C.white, y: C.yellow, '#': C.ink, r: C.red, k: C.ink };
function sprite(g, rows, x, y, flip) {
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      g.fillStyle = SPR_COL[ch];
      g.fillRect(x + (flip ? w - 1 - c : c), y + r, 1, 1);
    }
  }
}

// --- geometry per stage ----------------------------------------------------------------------
function frameGeo(p) {
  const sw = Math.round(p.W / CELL);
  const sh = Math.round(p.H / CELL);
  if (p.safe) {
    const ox = Math.round((p.safe.x + p.safe.w / 2 - 500) / CELL);
    const oy = Math.round((p.groundY - 700) / CELL);
    // HUD inside the safe area, right-aligned just below the pier piles (deep water; the big
    // rotor reaches the safe top, and the painter's hill covers the lower-left corner)
    return { sw, sh, ox, oy, easel: true, hudX: Math.round((p.safe.x + p.safe.w) / CELL) - 190, hudY: ROAD + oy + 17 };
  }
  return { sw, sh, ox: 0, oy: 0, hudX: 6, hudY: 6 };
}

// --- background (baked at art resolution, blitted up with hard pixels) -----------------------
function paintBackground(kit, g, w, h, p, G) {
  const { sw, sh, ox, oy } = G;
  const hy = HY + oy;
  const road = ROAD + oy;
  const s = kit.createCanvas(sw, sh);
  const q = s.getContext('2d');
  const img = q.createImageData(sw, sh);
  const D = img.data;
  const rgb = (hex) => kit.hexToRgb(hex);
  const skyCols = [C.sky0, C.sky1, C.sky2, C.sky3, C.haze].map(rgb);
  const seaCols = [C.sea0, C.sea1, C.sea2, C.sea3].map(rgb);
  const deepCols = [C.seaD0, C.seaD1, C.seaD2, C.seaD2].map(rgb);
  const put = (x, y, c) => {
    const i = (y * sw + x) * 4;
    D[i] = c.r;
    D[i + 1] = c.g;
    D[i + 2] = c.b;
    D[i + 3] = 255;
  };
  const ramp = (cols, t, x, y) => {
    const f = Math.max(0, Math.min(0.999, t)) * (cols.length - 1);
    const i = Math.floor(f);
    return f - i > bayer(x, y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i];
  };
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      let c;
      if (y < hy) c = ramp(skyCols, Math.pow(y / hy, 1.25), x, y);
      else if (y < road + 6) {
        // far sea: lighter at the horizon, with faint horizontal swell bands
        const t = (y - hy) / (road + 6 - hy);
        const band = kit.noise1(x * 0.06 + y * 7.3, 2) > 0.72 ? 0.12 : 0;
        c = ramp(seaCols, Math.pow(t, 0.8) + band, x, y);
      } else {
        const t = (y - road - 6) / (sh - road - 6);
        const band = kit.noise1(x * 0.09 + y * 5.1, 4) > 0.75 ? -0.1 : 0;
        c = ramp(deepCols, t * 0.9 + band, x, y);
      }
      put(x, y, c);
    }
  }
  q.putImageData(img, 0, 0);
  const R = (col, x, y, ww = 1, hh = 1) => {
    q.fillStyle = col;
    q.fillRect(x, y, ww, hh);
  };

  // pale sun with a dithered halo (right, below the HUD)
  const sx = ox + 182;
  const sy = oy + 30;
  for (let yy = -9; yy <= 9; yy++)
    for (let xx = -9; xx <= 9; xx++) {
      const d = Math.hypot(xx, yy);
      if (d <= 4.6) R(C.sun, sx + xx, sy + yy);
      else if (d <= 7.5 && bayer(sx + xx, sy + yy) < 0.5 * (7.5 - d) / 2.9) R(C.sky3, sx + xx, sy + yy);
    }

  // Lolland: a low flat coast tapering out on the left horizon (fields, trees, a village)
  const coastEnd = ox + 58;
  for (let x = 0; x < coastEnd; x++) {
    const u = x / coastEnd;
    const hgt = Math.round((1 - u * u) * (2 + 2.2 * kit.noise1(x * 0.11, 9)));
    if (hgt <= 0) continue;
    R(C.land0, x, hy - hgt, 1, hgt);
    if (hgt > 1) R(C.field, x, hy - hgt, 1, 1);
    R(C.sand, x, hy, 1, 1);
  }
  const village = (vx) => {
    // houses: white walls, red roofs
    [[0, 2], [5, 3], [11, 2], [15, 2]].forEach(([dx, ww]) => {
      R(C.wall, vx + dx, hy - 3, ww + 1, 2);
      R(C.roof, vx + dx, hy - 4, ww + 1, 1);
    });
    // whitewashed church tower with a red stepped cap
    R(C.wall, vx + 8, hy - 8, 2, 7);
    R(C.roof, vx + 8, hy - 9, 2, 1);
    R(C.roof, vx + 7, hy - 8, 1, 1);
    R(C.roof, vx + 10, hy - 8, 1, 1);
    // trees
    [[-3, 3], [3, 2], [13, 2], [19, 3]].forEach(([dx, hh]) => {
      R(C.land1, vx + dx, hy - hh - 1, 2, hh);
      R(C.land1, vx + dx - 1, hy - hh, 1, hh - 1);
    });
  };
  village(ox + 8);
  if (ox > 40) village(ox - 46);
  // a few farm trees along the coast
  for (let x = 2; x < coastEnd - 6; x += 9) if (kit.hash11(x * 3.1) > 0.45) R(C.land1, x, hy - 4, 2, 2);

  // turbine reflections: dithered streaks under each foundation
  for (const t of TURB) {
    const x = t.x + ox;
    const len = Math.round(16 * t.s);
    const tw = Math.max(1, Math.round(6 * t.s));
    for (let yy = 1; yy <= len; yy++) {
      const y = t.base + oy + yy;
      for (let xx = 0; xx < tw; xx++) if (bayer(x + xx, y) < 0.55 * (1 - yy / (len + 1))) R(C.glint2, x - (tw >> 1) + xx, y);
    }
  }

  // wooden pier (the road): plank tops, fascia beam, piles into the water
  const total = sw;
  R(C.woodLt, 0, road, total, 1);
  R(C.wood, 0, road + 1, total, 3);
  for (let x = 3; x < total; x += 7) R(C.woodDk, x, road + 1, 1, 3);
  R(C.woodDk, 0, road + 4, total, 1);
  R(C.woodDk2, 0, road + 5, total, 1);
  for (let x = 6; x < total; x += 22) {
    R(C.woodDk2, x, road + 6, 3, 9);
    R(C.woodDk, x, road + 6, 1, 8);
    R(C.land1, x, road + 12, 3, 1); // weed line at the waterline
  }
  // shadow of the deck on the water
  for (let x = 0; x < total; x++) for (let y = road + 6; y < road + 9; y++) if (bayer(x, y) < 0.7 - (y - road - 6) * 0.22) R(C.seaD2, x, y);

  g.imageSmoothingEnabled = false;
  g.drawImage(s, 0, 0, w, h);
}

/** Pixel cloud sprite, baked once (white top, grey dithered belly). */
function cloudSprite(kit, key, cw, chh, seed) {
  return kit.bake(`${ID}_${key}_v2`, cw, chh, (g) => {
    const blobs = [];
    const n = 4 + Math.floor(kit.hash11(seed) * 3);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const r = (0.28 + 0.22 * Math.sin(u * Math.PI) + 0.1 * kit.hash11(seed + i)) * chh;
      blobs.push({ x: cw * (0.12 + 0.76 * u), y: chh - 2 - r * 0.55, r });
    }
    for (let y = 0; y < chh; y++)
      for (let x = 0; x < cw; x++) {
        let inside = false;
        for (const b of blobs) if (Math.hypot(x - b.x, (y - b.y) * 1.25) < b.r) inside = true;
        if (!inside || y > chh - 2) continue;
        const shade = y / chh;
        g.fillStyle = shade > 0.78 ? C.cloudSh2 : shade > 0.55 && bayer(x, y) < (shade - 0.55) * 3.5 ? C.cloudSh : C.cloud;
        g.fillRect(x, y, 1, 1);
      }
  });
}

/** Static HUD panel (bar, border, label), baked at art resolution. */
function hudSprite(kit) {
  return kit.bake(`${ID}_hud_v2`, 188, 13, (g) => {
    g.fillStyle = C.hud;
    g.fillRect(0, 0, 188, 13);
    g.fillStyle = C.hudLine;
    g.fillRect(1, 1, 186, 1);
    g.fillRect(1, 11, 186, 1);
    g.fillRect(1, 1, 1, 11);
    g.fillRect(186, 1, 1, 11);
    bitText(g, 'TURBINES', 5, 3, C.hudLine, '#4a4f55');
    bitText(g, 'MW', 146, 3, C.hudLine, '#4a4f55');
  });
}

// --- the turbines -----------------------------------------------------------------------------
/** Turbine body (foundation, tower, nacelle) in sprite-local coordinates. */
function paintBody(g, t, cx, hub, base) {
  const s = t.s;
  const near = s > 0.44;
  // concrete foundation standing in the water: shaft, ice cone at the waterline, platform
  const fw = Math.max(2, Math.round(9 * s));
  const fh = Math.max(1, Math.round(7 * s));
  const fx = cx - (fw >> 1);
  g.fillStyle = C.concrete;
  g.fillRect(fx, base - fh, fw, fh);
  g.fillStyle = C.concreteSh;
  g.fillRect(fx + fw - Math.max(1, Math.round(fw / 3)), base - fh, Math.max(1, Math.round(fw / 3)), fh);
  if (s > 0.3) {
    g.fillRect(fx - 1, base - 1, fw + 2, 1); // ice cone flare
    g.fillStyle = C.ink;
    g.fillRect(fx - 1, base - fh - 1, fw + 2, 1); // platform deck
    if (near) for (let x = fx - 1; x <= fx + fw; x += 2) g.fillRect(x, base - fh - 3, 1, 2); // railing posts
    if (near) g.fillRect(fx - 1, base - fh - 3, fw + 2, 1); // hand rail
  }
  g.fillStyle = C.glint;
  g.fillRect(fx - (s > 0.3 ? 1 : 0), base, fw + (s > 0.3 ? 2 : 0), 1); // foam line
  // white tubular tower, tapered, shaded on the right
  const top = hub + Math.round(2 * s);
  const bot = base - fh - 1;
  const w0 = Math.max(1, Math.round(6 * s));
  const w1 = Math.max(1, Math.round(3.6 * s));
  for (let y = top; y < bot; y++) {
    const u = (y - top) / Math.max(1, bot - top);
    const ww = Math.round(w1 + (w0 - w1) * u);
    const x0 = cx - (ww >> 1);
    if (near) {
      g.fillStyle = C.ink;
      g.fillRect(x0 - 1, y, ww + 2, 1);
    }
    g.fillStyle = C.white;
    g.fillRect(x0, y, ww, 1);
    if (ww > 2) {
      g.fillStyle = C.grey;
      g.fillRect(x0 + ww - Math.max(1, Math.round(ww / 3)), y, Math.max(1, Math.round(ww / 3)), 1);
    }
  }
  // nacelle (seen three-quarter, behind the upwind rotor)
  const nl = Math.max(2, Math.round(10 * s));
  const nh = Math.max(1, Math.round(5 * s));
  const ny = hub - (nh >> 1);
  if (near) {
    g.fillStyle = C.ink;
    g.fillRect(cx - 1, ny - 1, nl + 2, nh + 2);
  }
  g.fillStyle = C.white;
  g.fillRect(cx, ny, nl, nh);
  g.fillStyle = C.grey;
  g.fillRect(cx, ny + nh - Math.max(1, Math.round(nh / 3)), nl, Math.max(1, Math.round(nh / 3)));
}

/** Rotor + spinner in sprite-local coordinates (upwind: in front of tower and nacelle). */
function paintRotor(g, t, cx, hub, ang) {
  const s = t.s;
  const near = s > 0.44;
  // rotor: three tapered blades on a pixel grid (half-pixel sampling so diagonals have no holes)
  const R = t.R;
  const kw = 1.25 * s;
  for (let pass = 0; pass < 2; pass++) {
    g.fillStyle = pass === 0 ? (near ? C.ink : C.far) : C.white;
    const o = pass === 0 ? 1 : 0;
    for (let b = 0; b < 3; b++) {
      const a = ang + (b * Math.PI * 2) / 3;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let k = Math.max(1, 2 * s); k <= R; k += 0.5) {
        const u = k / R;
        const wid = Math.max(1, (u < 0.14 ? 2.2 + 8 * u : 3.3 - (2.6 * (u - 0.14)) / 0.86) * kw);
        for (let j = 0; j < wid; j += 0.5) {
          const px = Math.round(cx + ca * k - sa * j);
          const py = Math.round(hub + sa * k + ca * j);
          g.fillRect(px - o, py - o, 1 + 2 * o, 1 + 2 * o);
        }
      }
    }
  }
  if (near) {
    // shade the trailing edge of each blade
    g.fillStyle = C.grey;
    for (let b = 0; b < 3; b++) {
      const a = ang + (b * Math.PI * 2) / 3;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let k = Math.max(2, 3 * s); k <= R * 0.8; k += 0.5) {
        const u = k / R;
        const wid = Math.max(1, (u < 0.14 ? 2.2 + 8 * u : 3.3 - (2.6 * (u - 0.14)) / 0.86) * kw);
        if (wid < 2) continue;
        g.fillRect(Math.round(cx + ca * k - sa * (wid - 0.5)), Math.round(hub + sa * k + ca * (wid - 0.5)), 1, 1);
      }
    }
  }
  // hub / spinner
  const hr = Math.max(1, Math.round(2.2 * s));
  if (near) {
    g.fillStyle = C.ink;
    g.fillRect(cx - hr - 1, hub - hr - 1, 2 * hr + 3, 2 * hr + 3);
  }
  g.fillStyle = C.white;
  g.fillRect(cx - hr, hub - hr, 2 * hr + 1, 2 * hr + 1);
  g.fillStyle = C.grey;
  g.fillRect(cx - hr, hub + hr, 2 * hr + 1, 1);
}

/** Sprite box for one turbine: local hub at (P, P). */
function spriteBox(t) {
  const P = t.R + 3;
  return { P, w: 2 * P + Math.round(10 * t.s) + 2, h: P + (t.base - t.hub) + 3 };
}

const ANG_STEP = (Math.PI * 2) / 48; // rotors turn in 7.5-degree sprite steps (16 frames per third of a turn)

/** One turbine from baked sprites (body + one of 16 rotor frames), plus the start-up sparkle. */
function drawTurbine(kit, g, t, ang, ox, oy, spark) {
  const B = spriteBox(t);
  const id = TURB.indexOf(t);
  const x0 = t.x + ox - B.P;
  const y0 = t.hub + oy - B.P;
  g.drawImage(kit.bake(`${ID}_body${id}_v2`, B.w, B.h, (q) => paintBody(q, t, B.P, B.P, B.P + t.base - t.hub)), x0, y0);
  const f = ((Math.round(ang / ANG_STEP) % 16) + 16) % 16;
  g.drawImage(kit.bake(`${ID}_rot${id}_${f}_v2`, B.w, B.h, (q) => paintRotor(q, t, B.P, B.P, f * ANG_STEP)), x0, y0);
  const cx = t.x + ox;
  const hub = t.hub + oy;
  const s = t.s;
  // start-up sparkle (two stepped frames)
  if (spark) {
    const r = 2 + Math.round(4 * s) + (spark === 2 ? 1 : 0);
    g.fillStyle = spark === 2 ? C.white : C.yellow;
    g.fillRect(cx - r, hub, 2 * r + 1, 1);
    g.fillRect(cx, hub - r, 1, 2 * r + 1);
    g.fillStyle = C.yellow;
    g.fillRect(cx - 1, hub - 1, 3, 3);
    if (spark === 2) {
      g.fillRect(cx - r + 1, hub - r + 1, 1, 1);
      g.fillRect(cx + r - 1, hub - r + 1, 1, 1);
      g.fillRect(cx - r + 1, hub + r - 1, 1, 1);
      g.fillRect(cx + r - 1, hub + r - 1, 1, 1);
    }
  }
}

/** Small work boat (facing right), 19 x 9 art px; `bob` lifts it 1 px. */
function drawBoat(g, x, y, bob, moving, Tq, flip) {
  const X = (dx) => (flip ? x - dx : x + dx);
  const R = (col, dx, dy, ww = 1, hh = 1) => {
    g.fillStyle = col;
    g.fillRect(flip ? x - dx - ww + 1 : x + dx, y + dy - bob, ww, hh);
  };
  // wake
  if (moving) {
    const ph = mod(Math.floor(Tq * 8), 2);
    g.fillStyle = C.glint;
    for (let i = 0; i < 4; i++) g.fillRect(X(-12 - i * 3 - ph), y + 1 - (i & 1), 2, 1);
    g.fillRect(X(9), y + 1, 2, 1);
  }
  // hull
  R(C.ink, -10, -3, 20, 1);
  R(C.boatHull2, -10, -2, 19, 1);
  R(C.boatHull, -9, -1, 18, 1);
  R(C.boatHull, -8, 0, 15, 1);
  R(C.red, 7, -2, 2, 2); // bow fender
  R(C.yellow, -10, -3, 2, 1);
  // deck house
  R(C.ink, -4, -9, 9, 1);
  R(C.white, -4, -8, 8, 5);
  R(C.grey, -4, -4, 8, 1);
  R(C.ink, -3, -7, 2, 2);
  R(C.ink, 0, -7, 2, 2);
  R(C.boatHull2, 3, -7, 1, 2);
  // mast + light
  R(C.ink, -2, -12, 1, 3);
  R(C.yellow, -2, -13, 1, 1);
  // aft deck rail
  R(C.ink, -9, -5, 1, 2);
  R(C.ink, -7, -5, 1, 2);
  R(C.ink, -9, -5, 5, 1);
  // waterline foam
  g.fillStyle = C.glint;
  g.fillRect(flip ? x - 9 : x - 9, y + 1, 18, 1);
}

/** Rider's prop as pixel art (art-pixel units): 1-px wooden pole and a small white rotor. */
function drawPixelProp(g, rig) {
  const b = rig.poleBase;
  const t = rig.poleTop;
  const hubP = rig.pinHub || rig.propHub || t;
  if (!b || !t) return;
  const x0 = b.x / CELL;
  const y0 = b.y / CELL;
  const x1 = t.x / CELL;
  const y1 = t.y / CELL;
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
  g.fillStyle = C.woodDk2;
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
  const r = (hubP.r || 24) / CELL;
  const rot = { s: 0.62, R: Math.max(4, Math.round(r * 1.25)) };
  const ang = Math.round(((rig.pinwheelAngle || 0) * 0.5) / ANG_STEP) * ANG_STEP; // stepped like the farm
  const cx = Math.round(hubP.x / CELL);
  const cy = Math.round(hubP.y / CELL);
  paintRotor(g, rot, cx, cy, ang);
  g.fillStyle = C.yellow;
  g.fillRect(cx, cy, 1, 1);
}

export function render(kit, ctx, p) {
  const b = p.beat.barSec;
  const T = p.isThumbnail ? p.chapterSec * 0.5 : p.rawLocalT; // animate with rawLocalT
  const Ts = p.isThumbnail ? 3.5 * b : T; // story clock: thumbnails show the farm online, boat moored
  const Tq = kit.quantizeTime(T, 8); // stepped sprite clock
  const G = frameGeo(p);
  const { sw, ox, oy } = G;
  const hy = HY + oy;
  const road = ROAD + oy;
  ctx.save();
  ctx.drawImage(kit.bake(`${ID}_bg_v2`, p.W, p.H, (g, rng, w, h) => paintBackground(kit, g, w, h, p, G)), 0, 0);

  const clouds = [cloudSprite(kit, 'cloudA', 34, 12, 3), cloudSprite(kit, 'cloudB', 22, 9, 7), cloudSprite(kit, 'cloudC', 46, 14, 11)];
  const hud = hudSprite(kit);
  const t0 = 2 * b; // bar-3 downbeat: boat moored, first turbine starts
  const step = b / 8; // one turbine per eighth note
  const tAll = t0 + 10 * step;

  kit.pixelate(ctx, ID + '_px', p.W, p.H, CELL, (g) => {
    g.save();
    g.scale(CELL, CELL); // from here on: art-pixel units
    g.imageSmoothingEnabled = false;

    // clouds: two layers drifting at different rates (whole art pixels)
    const span = sw + 60;
    const cl = [
      { s: clouds[2], x0: 10, y: oy + 24, v: 0.9 },
      { s: clouds[0], x0: 120, y: oy + 40, v: 0.9 },
      { s: clouds[1], x0: 70, y: oy + 58, v: 1.8 },
      { s: clouds[1], x0: 190, y: oy + 66, v: 1.8 },
    ];
    for (const c of cl) {
      const x = ((((c.x0 + Math.floor(Tq * c.v)) % span) + span) % span) - 50;
      g.drawImage(c.s, x, c.y);
    }

    // far gulls (2-frame flap)
    for (let i = 0; i < 3; i++) {
      const sp = 5 + 3 * kit.hash11(i + 4);
      const x = ((((kit.hash11(i + 1) * span + Tq * sp) % span) + span) % span) - 30;
      const y = oy + 30 + Math.round(18 * kit.hash11(i + 9) + Math.sin(Tq * 1.3 + i) * 1.5);
      sprite(g, GULL_FAR[mod(Math.floor(Tq * 4) + i, 2)], Math.round(x), y);
    }

    // distant sail on the horizon (right)
    {
      const x = ox + 168 + mod(Math.floor(Tq * 0.6), 30);
      g.fillStyle = C.white;
      g.fillRect(x, hy - 4, 1, 3);
      g.fillRect(x + 1, hy - 3, 1, 2);
      g.fillStyle = C.grey2;
      g.fillRect(x - 1, hy - 1, 4, 1);
    }

    // sea glints (blink on a stepped clock, drift slowly)
    const seaH = road - hy;
    for (let i = 0; i < 70; i++) {
      const hv = kit.hash11(i * 1.37 + 0.2);
      const fy = Math.pow(kit.hash11(i * 2.11 + 5), 0.7);
      const y = hy + 2 + Math.floor(fy * (seaH - 4));
      const len = 1 + Math.floor(fy * 3.5);
      const drift = Tq * (0.6 + fy * 2.2);
      const x = Math.floor((((hv * (sw + 10) + drift) % (sw + 10)) + sw + 10) % (sw + 10)) - 5;
      const on = kit.hash21(i, Math.floor(Tq * 2 + hv * 3)) > 0.4;
      if (!on) continue;
      g.fillStyle = fy > 0.5 && kit.hash11(i + 77) > 0.5 ? C.glint : C.glint2;
      g.fillRect(x, y, len, 1);
    }

    // the eleven turbines, far to near; parked until their turn in bar 3
    const omega = Math.PI * 2 * 0.55;
    const rampT = b / 2;
    const Tsq = kit.quantizeTime(Ts, 10);
    let lit = 0;
    for (const t of TURB) {
      const tk = t0 + t.order * step;
      const dt = Tsq - tk;
      let ang = t.park;
      let spark = 0;
      if (dt >= 0) {
        lit++;
        ang += omega * (dt > rampT ? dt - rampT / 2 : (dt * dt) / (2 * rampT));
        if (!p.isThumbnail && dt < b / 4) spark = Math.floor(dt / (b / 16)) % 2 ? 2 : 1;
      }
      drawTurbine(kit, g, t, ang, ox, oy, spark);
    }

    // the work boat: comes in from the right and moors at the nearest foundation on beat 3
    // of bar 2 (bow fender against the concrete), so it is tied up before the farm starts on
    // the bar-3 downbeat and before the rider reaches it; it stays while the rider passes in
    // front and leaves to the right once the rider is through (end of bar 4)
    {
      const v = 8;
      const tDock = 1.5 * b;
      const tGo = 4 * b;
      let x;
      let moving = true;
      let flip = true; // facing left while coming in
      if (Ts < tDock) {
        const d = tDock - Ts;
        x = DOCK_X + v * (d > 1 ? d - 0.5 : (d * d) / 2);
      } else if (Ts < tGo) {
        x = DOCK_X;
        moving = false;
      } else {
        const e = Ts - tGo;
        x = DOCK_X + 1 + v * 1.2 * (e > 1 ? e - 0.5 : (e * e) / 2);
        flip = false;
      }
      const bob = mod(Math.floor(Tq * 2), 2);
      drawBoat(g, Math.round(x) + ox, BOAT_Y + oy, bob, moving && !p.isThumbnail, Tq, flip);
    }

    // foreground water: wave crests scrolling faster the nearer they are
    for (let i = 0; i < 46; i++) {
      const fy = kit.hash11(i * 3.7 + 1);
      const y = road + 16 + Math.floor(fy * (G.sh - road - 18));
      const sp = 3 + fy * 9;
      const len = 2 + Math.floor(fy * 4);
      const wrap = sw + 20;
      const x = Math.floor((((kit.hash11(i * 5.3) * wrap - Tq * sp) % wrap) + wrap) % wrap) - 10;
      g.fillStyle = C.seaD0;
      g.fillRect(x, y, len, 1);
      g.fillStyle = C.glint2;
      g.fillRect(x + 1, y - 1, Math.max(1, len - 2), 1);
    }
    // buoy bobbing below the pier
    {
      const bx = ox + (G.easel ? 130 : 34);
      const by = road + (G.easel ? 37 : 30) + mod(Math.floor(Tq * 2), 2); // easel: below the HUD
      g.fillStyle = C.ink;
      g.fillRect(bx - 3, by - 1, 7, 6);
      g.fillStyle = C.yellow;
      g.fillRect(bx - 2, by, 5, 4);
      g.fillStyle = C.yellowDk;
      g.fillRect(bx + 1, by, 1, 4);
      g.fillStyle = C.ink;
      g.fillRect(bx, by - 4, 1, 3);
      g.fillRect(bx - 1, by - 5, 3, 1);
      g.fillStyle = C.glint;
      g.fillRect(bx - 4 - (mod(Math.floor(Tq * 2), 2)), by + 5, 9 + 2 * (mod(Math.floor(Tq * 2), 2)), 1);
    }

    // the rider: its prop (pole + three-blade rotor) is redrawn here as a crisp pixel sprite
    // behind it, because the stock vector prop is thinner than one art pixel and comes out
    // as a faint grey smear on the 5-px grid
    const rig = p.actor && p.actor.visible ? p.actor.rig() : null;
    if (rig && p.prop && p.prop.type !== 'none') drawPixelProp(g, rig);
    g.restore(); // back to the pixelate transform (canvas units) for the rider
    if (rig) p.actor.draw(g, rig, riderStyle(p));
    g.save();
    g.scale(CELL, CELL);

    // big foreground gull gliding low over the near water (right to left)
    {
      const wrap = sw + 80;
      const x = Math.floor(((((sw + 30 - Tq * 16) % wrap) + wrap) % wrap) - 30);
      const y = road + 20 + Math.round(Math.sin(Tq * 2.1) * 2);
      sprite(g, GULL_BIG[mod(Math.floor(Tq * 4), 2)], x, y);
    }

    // HUD: TURBINES + eleven life icons, MW readout
    const hx = G.hudX;
    const hyy = G.hudY;
    g.drawImage(hud, hx, hyy);
    for (let i = 0; i < 11; i++) {
      const ix = hx + 57 + i * 7;
      const iy = hyy + 3;
      const on = i < lit;
      const flash = on && !p.isThumbnail && Ts - (t0 + i * step) < b / 8;
      const col = flash ? C.white : on ? C.yellow : '#4a4f55';
      g.fillStyle = col;
      g.fillRect(ix + 2, iy + 2, 1, 5); // tower
      g.fillRect(ix + 2, iy, 1, 2); // blade up
      g.fillRect(ix, iy + 3, 2, 1); // blade left-down
      g.fillRect(ix + 3, iy + 3, 2, 1); // blade right-down
      g.fillRect(ix + 1, iy + 2, 3, 1); // hub
    }
    const allOn = Ts >= tAll;
    const blink = allOn && !p.isThumbnail && Ts - tAll < b / 2 && Math.floor((Ts - tAll) / (b / 8)) % 2 === 1;
    if (!blink) bitText(g, allOn ? '5' : '-', hx + 172, hyy + 3, allOn ? C.yellow : '#7a8086', allOn ? '#6b5320' : null);
    g.restore();
  });

  ctx.restore();
}

const riderStyle = (p) => ({
  outline: C.ink,
  outlineWidth: 3.5,
  lineScale: 1.35,
  shading: false,
  spokes: 6,
  frame: C.red,
  frameShade: '#8a2c1f',
  tire: C.ink,
  rim: C.grey2,
  saddle: C.ink,
  showProp: false, // drawn as a pixel sprite by drawPixelProp
  prop: { type: p.prop.type, colors: [C.white, C.yellow] },
});
