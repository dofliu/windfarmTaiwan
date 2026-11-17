// src/scenes/tvind.js
// Chapter "tvind" · 1978 · Tvind 風機.
//
// Medium: 絲網印刷海報 (Screen-printed poster) — a 1970s screen print pulled by hand on brown
// kraft stock in four opaque spot inks (white, orange, olive, aubergine purple): every ink is
// its own screen, printed a few px out of register (kraft shows through the gaps), with
// mottled coverage and pinholes where the mesh did not fill; hand-cut stencil lettering with
// bridges; a 70s rainbow sunrise of concentric half rings with a halftone halo; perspective
// furrows; registration marks; a rally crowd seen from behind as the foreground plate.
//
// Scene: the Tvind turbine (Tvindkraft) in the flat West Jutland fields beside the low school
// buildings — a tapering WHITE CONCRETE tower, the nacelle on top and the three long blades
// DOWNWIND of the tower (the wind blows in from the left, the rotor turns behind the tower).
// Volunteers in hard hats haul the last crate up to the nacelle on a rope. Depth: kraft sky and
// sunrise rings (back) · turbine, school, fields, volunteers (mid) · rally crowd (front).
//
// Story beat (bar 3): the crate reaches the nacelle on the downbeat, the rotor spins up from a
// crawl, power runs down the tower to the school and its windows light up under a lightning
// stencil; the volunteers let go of the rope and the crowd raises fists and hard hats,
// pumping on the beats until bar 4 ends.
//
// Deterministic: no Math.random / Date — kit.bake() rngs, kit.hash11, kit.fbm2 only.
// Everything is drawn in the 1000x1000 design square (gallery-ride panel; easel via kit.layout).

export const meta = { stages: ['gallery-ride', 'easel'] };
const ID = 'tvind';

const S = 1000;
const ROAD = 700;
const HZ = 600; // horizon
const TAU = Math.PI * 2;

// inks on kraft
const KRAFT = '#c49b6a';
const ORANGE = '#e85d2a';
const OLIVE = '#7b7f30';
const PURPLE = '#4a2b5e';
const WHITE = '#f3ead6';
const ORANGE_T = '#e49a6e'; // orange printed through a coarse screen (tint)
// each screen lands a little off register
const REG = { white: [0, 0], orange: [4, -3], olive: [-3, 2], purple: [1.5, 1.5] };

// turbine geometry (design px; ~6.8 px per metre)
const TX = 300; // tower axis
const TB = 604; // tower base
const TT = 262; // tower top
const TWB = 22; // half-width at the base
const TWT = 12; // half-width at the top
const SA = 0.5; // rotor disc seen at an angle: horizontal squash
const HUB = { x: TX + 60, y: 249 }; // hub sits downwind of the tower axis
const R = 184; // rotor radius
const ROPE_X = 264; // hoist rope from the davit on the nacelle
const DAVIT_Y = 240;
const SUN = { x: TX, y: HZ };

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
function ss(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
/** Integral of smoothstep(a, b, t) dt from a to T (for a smooth spin-up). */
function intSmooth(T, a, b) {
  const s = clamp01((T - a) / (b - a));
  return (b - a) * (s * s * s - 0.5 * s * s * s * s) + Math.max(0, T - b);
}

// school windows (light up in bar 3)
const WINDOWS = [];
for (let k = 0; k < 5; k++) WINDOWS.push({ x: 36 + k * 21, y: 578, w: 11, h: 10 });
for (let k = 0; k < 4; k++) WINDOWS.push({ x: 158 + k * 21, y: 584, w: 11, h: 9 });
for (let k = 0; k < 3; k++) WINDOWS.push({ x: 848 + k * 18, y: 584, w: 9, h: 8 });

// -----------------------------------------------------------------------------
// screen-print plumbing (bake time)
// -----------------------------------------------------------------------------
/** Mottle + pinhole texture used to knock ink out of each screen. */
function mottleTile(kit) {
  return kit.bake(ID + '_mottle_v1', 250, 250, (g, rng, w, h) => {
    const im = g.createImageData(w, h);
    const d = im.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = kit.fbm2(x * 0.045, y * 0.045, 3, 11);
        const a = clamp01((v - 0.5) * 2.4);
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 0;
        d[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(im, 0, 0);
  });
}

/** One screen: draw(g) in a single ink, then thin it with mottle and pinholes. */
function screen(kit, rng, w, h, draw, o = {}) {
  const c = kit.createCanvas(w, h);
  const g = c.getContext('2d');
  draw(g);
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.globalAlpha = o.mottle ?? 0.22;
  const m = mottleTile(kit);
  const ox = -rng() * 200;
  const oy = -rng() * 200;
  g.drawImage(m, ox, oy, w * 1.35 + 200, h * 1.35 + 200);
  g.globalAlpha = 1;
  g.fillStyle = '#000';
  const n = Math.round((w * h) / (o.holes ?? 380));
  for (let i = 0; i < n; i++) {
    const r = 0.5 + rng() * 1.1;
    g.fillRect(rng() * w, rng() * h, r, r * (0.6 + rng()));
  }
  // a dry pull: one faint streak where the squeegee skipped
  if (o.streak !== false) {
    g.globalAlpha = 0.18;
    g.fillRect(0, rng() * h, w, 2 + rng() * 3);
  }
  g.restore();
  return c;
}

/** Lay screens down in printing order (white, orange, olive, purple), each off register. */
function printScreens(kit, g, rng, w, h, plates, mottle) {
  for (const ink of ['white', 'orange', 'olive', 'purple']) {
    if (!plates[ink]) continue;
    const c = screen(kit, rng, w, h, plates[ink], { mottle });
    const [dx, dy] = REG[ink];
    g.drawImage(c, dx, dy);
  }
}

function poly(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}

/** Hand-cut stencil letters: each glyph a hair rotated, baseline jittered; returns boxes. */
function cutLetters(g, str, x, y, font, sp, rng, fill, fatten = 0) {
  g.font = font;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  const boxes = [];
  let cx = x;
  for (const ch of str) {
    const w = g.measureText(ch).width;
    const rot = (rng() - 0.5) * 0.05;
    const dy = (rng() - 0.5) * 5;
    g.save();
    g.translate(cx + w / 2, y + dy);
    g.rotate(rot);
    g.fillStyle = fill;
    g.fillText(ch, -w / 2, 0);
    if (fatten) {
      g.lineWidth = fatten;
      g.lineJoin = 'round';
      g.strokeStyle = fill;
      g.strokeText(ch, -w / 2, 0);
    }
    g.restore();
    boxes.push({ ch, x: cx, w, y: y + dy, rot });
    cx += w + sp;
  }
  return boxes;
}

/** Cut stencil bridges (destination-out) through glyph boxes. */
function bridges(g, boxes, size, rule) {
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  for (const b of boxes) {
    const cuts = rule(b);
    for (const c of cuts) {
      g.save();
      g.translate(b.x + b.w / 2, b.y);
      g.rotate(b.rot);
      g.fillRect(c[0] - b.w / 2, c[1], c[2], c[3]);
      g.restore();
    }
  }
  g.restore();
  void size;
}

// -----------------------------------------------------------------------------
// the baked poster (everything that does not move)
// -----------------------------------------------------------------------------
function paintPoster(kit, g, rng, w, h) {
  g.drawImage(kit.paper(ID + '_kraft', w, h, { color: KRAFT, grain: 0.05, blotches: 14, blotchColor: 'rgba(90,60,30,0.08)', vignette: 0.12 }), 0, 0);
  const sunClip = (q) => {
    q.beginPath();
    q.rect(0, 0, S, HZ);
    q.clip();
  };
  const ring = (q, r0, r1) => {
    q.beginPath();
    q.arc(SUN.x, SUN.y, r1, Math.PI, TAU);
    q.lineTo(SUN.x + r0, SUN.y);
    q.arc(SUN.x, SUN.y, r0, TAU, Math.PI, true);
    q.closePath();
    q.fill();
  };
  const furrows = (q) => {
    // perspective field rows converging on the sunrise
    q.fillStyle = OLIVE;
    for (let k = -22; k < 22; k += 2) {
      const xa = SUN.x + k * 64;
      const xb = SUN.x + (k + 1) * 64;
      q.beginPath();
      q.moveTo(SUN.x + k * 1.2, HZ);
      q.lineTo(xa, 692);
      q.lineTo(xb, 692);
      q.lineTo(SUN.x + (k + 1) * 1.2, HZ);
      q.closePath();
      q.fill();
    }
  };

  const plates = {
    white(q) {
      q.fillStyle = WHITE;
      // the wind arrow (upper left)
      poly(q, [[44, 74], [146, 74], [146, 58], [192, 92], [146, 126], [146, 110], [44, 110]]);
      q.fill();
      // TVIND in hand-cut stencil caps
      const tv = cutLetters(q, 'TVIND', 590, 198, `400 178px ${kit.FONT.poster}`, 8, rng, WHITE);
      const stem = 178 * 0.12;
      bridges(q, tv, 178, (b) => {
        const capTop = -178 * 0.72;
        if (b.ch === 'D') return [[stem + 1, capTop - 4, 5, 178 * 0.8]];
        if (b.ch === 'N') return [[stem + 1, capTop - 4, 5, 178 * 0.8], [b.w - stem - 6, capTop - 4, 5, 178 * 0.8]];
        if (b.ch === 'I') return [[-2, capTop * 0.48, b.w + 4, 5]];
        if (b.ch === 'V') return [[b.w / 2 - 2.5, capTop * 0.3, 5, 40]];
        if (b.ch === 'T') return [[-2, capTop + stem + 1, b.w + 4, 4]];
        return [];
      });
      // registration marks
      for (const [x, y] of [[500, 46], [962, 520]]) {
        q.fillRect(x - 3, y - 3, 6, 6);
      }
    },
    orange(q) {
      q.save();
      sunClip(q);
      q.fillStyle = ORANGE;
      ring(q, 0, 172);
      ring(q, 250, 276);
      // halftone halo beyond the last ring (a coarse hand-made screen)
      kit.halftoneShade(q, SUN.x - 400, SUN.y - 400, 800, 400, {
        cell: 11,
        color: ORANGE,
        angle: 0.4,
        tone: (u, v) => {
          const d = Math.hypot(u * 800 - 400, v * 400 - 400);
          return d < 330 ? 0 : clamp01(1 - (d - 330) / 46) * 0.9;
        },
      });
      q.restore();
      // the slogan, generic: "the wind belongs to everyone"
      const sl = cutLetters(q, '風是大家的', 590, 376, `700 66px ${kit.FONT.sans}`, 6, rng, ORANGE);
      // stencil bridges: short horizontal cuts, off the glyph centre, on the last three only
      bridges(q, sl, 66, (b) => {
        if (b.ch === '大') return [[b.w * 0.12, -66 * 0.2, b.w * 0.22, 3]];
        if (b.ch === '家') return [[b.w * 0.62, -66 * 0.24, b.w * 0.24, 3]];
        if (b.ch === '的') return [[b.w * 0.06, -66 * 0.36, b.w * 0.3, 3]];
        return [];
      });
      // field furrow highlights in orange tint near the sunrise
      q.fillStyle = ORANGE_T;
      q.fillRect(0, 714, S, 4);
    },
    olive(q) {
      q.save();
      sunClip(q);
      q.fillStyle = OLIVE;
      ring(q, 190, 232);
      q.restore();
      furrows(q);
      // ground band under the road
      q.fillStyle = OLIVE;
      q.fillRect(0, 716, S, S - 716);
      // unlit window panes: olive shows through the holes cut in the purple buildings
      for (const wd of WINDOWS) q.fillRect(wd.x + 1, wd.y - 3, wd.w + 4, wd.h + 4);
    },
    purple(q) {
      q.save();
      sunClip(q);
      q.fillStyle = PURPLE;
      ring(q, 294, 318);
      q.restore();
      // horizon: hedges and wind-bent trees of West Jutland
      q.fillStyle = PURPLE;
      q.beginPath();
      q.moveTo(330, 606);
      for (let x = 330; x <= S; x += 12) q.lineTo(x, 598 - 5 * kit.noise1(x * 0.05, 3) - (x > 600 && x < 700 ? 10 * Math.sin(((x - 600) / 100) * Math.PI) : 0));
      q.lineTo(S, 606);
      q.closePath();
      q.fill();
      for (const [x, s] of [[452, 1], [618, 1.3], [700, 0.9], [960, 1.1]]) {
        // a tree bent downwind
        q.beginPath();
        q.moveTo(x - 3, 600);
        q.lineTo(x - 2, 588 - 8 * s);
        q.lineTo(x + 2, 588 - 8 * s);
        q.lineTo(x + 3, 600);
        q.fill();
        q.beginPath();
        q.ellipse(x + 8 * s, 590 - 12 * s, 18 * s, 10 * s, 0.25, 0, TAU);
        q.fill();
      }
      // a farm on the right
      poly(q, [[826, 604], [826, 580], [866, 566], [906, 580], [906, 604]]);
      q.fill();
      q.fillRect(906, 588, 44, 16);
      // the school: low buildings with shallow roofs (left)
      poly(q, [[20, 604], [20, 568], [86, 552], [152, 568], [152, 604]]);
      q.fill();
      poly(q, [[146, 604], [146, 578], [200, 566], [252, 578], [252, 604]]);
      q.fill();
      q.fillRect(108, 548, 7, 14); // chimney
      // knock the windows out of the purple so the olive panes show (dark until lit)
      q.save();
      q.globalCompositeOperation = 'destination-out';
      for (const wd of WINDOWS) q.fillRect(wd.x - 1, wd.y - 1, wd.w + 2, wd.h + 2);
      q.restore();
      // road
      q.fillStyle = PURPLE;
      q.fillRect(0, 690, S, 24);
      q.save();
      q.globalCompositeOperation = 'destination-out';
      for (let x = 14; x < S; x += 64) q.fillRect(x, 700, 34, 4);
      q.restore();
      // halftone dots darkening the ground toward the crowd
      kit.halftoneShade(q, 0, 716, S, S - 716, { cell: 10, color: PURPLE, angle: 0.8, tone: (u, v) => 0.06 + v * 0.34 });
      // the "1978" block, with knocked-out stencil numerals
      q.fillStyle = PURPLE;
      q.fillRect(590, 218, 328, 82);
      q.save();
      q.globalCompositeOperation = 'destination-out';
      const yr = cutLetters(q, '1978', 606, 288, `400 88px ${kit.FONT.poster}`, 4, rng, '#000');
      const qd = cutLetters(q, '啟用', 790, 280, `700 40px ${kit.FONT.sans}`, 6, rng, '#000');
      q.restore();
      // stencil bridges = purple ribs left across the knocked-out numerals
      q.fillStyle = PURPLE;
      for (const b of yr) {
        if (b.ch === '9' || b.ch === '8') q.fillRect(b.x + b.w * 0.5 - 2, 218, 4, 82);
        if (b.ch === '7') q.fillRect(b.x, b.y - 88 * 0.52, b.w, 4);
      }
      void qd;
      // the facts, in small type
      q.font = `700 21px ${kit.FONT.sans}`;
      q.textBaseline = 'alphabetic';
      q.fillText('1975 · 400 名志工開工', 594, 414);
      q.font = `500 20px ${kit.FONT.sans}`;
      q.fillText('設計 2 MW · 高 54 公尺', 594, 442);
      // wind arrow label (the arrow itself is white)
      q.font = `700 30px ${kit.FONT.sans}`;
      q.fillText('風', 62, 104);
      q.font = `700 22px ${kit.FONT.sans}`;
      q.fillText('下風式', 46, 152);
      q.font = `500 17px ${kit.FONT.sans}`;
      q.fillText('葉片在塔後', 46, 176);
      // registration marks (crosshair + ring)
      q.strokeStyle = PURPLE;
      q.lineWidth = 1.4;
      for (const [x, y] of [[500, 46], [962, 520]]) {
        q.beginPath();
        q.arc(x, y, 9, 0, TAU);
        q.moveTo(x - 15, y);
        q.lineTo(x + 15, y);
        q.moveTo(x, y - 15);
        q.lineTo(x, y + 15);
        q.stroke();
      }
    },
  };
  printScreens(kit, g, rng, w, h, plates, 0.2);
}

// the tower and nacelle as their own small print (the rotor turns behind them)
const TS = { x: TX - 100, y: 222, w: 200, h: 388 };
function paintTower(kit, g, rng, w, h) {
  const shape = [[TX - TWT, TT], [TX + TWT, TT], [TX + TWB, TB], [TX - TWB, TB]];
  const plates = {
    white(q) {
      q.translate(-TS.x, -TS.y);
      q.fillStyle = WHITE;
      poly(q, shape);
      q.fill();
      // nacelle: a long box running downwind to the hub, upwind end rounded
      q.beginPath();
      q.moveTo(TX - 14, 236);
      q.lineTo(TX + 54, 236);
      q.lineTo(TX + 54, 263);
      q.lineTo(TX - 14, 263);
      q.quadraticCurveTo(TX - 26, 250, TX - 14, 236);
      q.fill();
    },
    olive(q) {
      q.translate(-TS.x, -TS.y);
      // shadow side of the round tower: a coarse hand screen
      q.save();
      poly(q, shape);
      q.clip();
      kit.halftoneShade(q, TX - TWB, TT, TWB * 2, TB - TT, {
        cell: 5,
        color: OLIVE,
        angle: 0.5,
        tone: (u) => clamp01((u - 0.55) / 0.4) * 0.95,
      });
      q.restore();
      q.fillStyle = OLIVE;
      q.fillRect(TX - 14, 257, 68, 6); // underside of the nacelle
    },
    purple(q) {
      q.translate(-TS.x, -TS.y);
      q.strokeStyle = PURPLE;
      q.lineWidth = 1.8;
      poly(q, shape);
      q.stroke();
      q.beginPath();
      q.moveTo(TX - 14, 236);
      q.lineTo(TX + 54, 236);
      q.lineTo(TX + 54, 263);
      q.lineTo(TX - 14, 263);
      q.quadraticCurveTo(TX - 26, 250, TX - 14, 236);
      q.stroke();
      q.fillStyle = PURPLE;
      q.fillRect(TX - TWT - 2, 263, TWT * 2 + 4, 4); // yaw ring
      for (let k = 0; k < 4; k++) q.fillRect(TX + 14 + k * 6, 242, 3, 10); // vents
      // davit with the hoist pulley
      q.fillRect(ROPE_X - 2, 230, TX - 12 - ROPE_X + 2, 4);
      q.fillRect(TX - 14, 228, 4, 10);
      q.beginPath();
      q.arc(ROPE_X, DAVIT_Y - 2, 4, 0, TAU);
      q.fill();
      // door and a slit window
      q.fillRect(TX - 7, TB - 28, 13, 28);
      q.fillRect(TX - 2, 420, 4, 12);
      // pulley at the foot
      q.beginPath();
      q.arc(ROPE_X, TB - 4, 5, 0, TAU);
      q.fill();
    },
  };
  printScreens(kit, g, rng, w, h, plates, 0.16);
}

/** Pinholes and ink specks laid over the moving parts too (a pattern tile). */
function grainTile(kit) {
  return kit.bake(ID + '_grain_v1', 256, 256, (g, rng, w, h) => {
    for (let i = 0; i < 900; i++) {
      const light = rng() < 0.7;
      g.fillStyle = light ? 'rgba(214,180,136,0.55)' : 'rgba(60,35,50,0.22)';
      const r = 0.6 + rng() * 1.2;
      g.fillRect(rng() * w, rng() * h, r, r);
    }
  });
}

// -----------------------------------------------------------------------------
// moving parts
// -----------------------------------------------------------------------------
function rotorAngle(T, b) {
  // parked while the last crate goes up, then the spin-up on the bar-3 downbeat
  return 0.7 + 2.1 * intSmooth(T, 2 * b, 2.6 * b);
}

function chordAt(r) {
  if (r < 26) return 9;
  if (r < 40) return lerp(9, 19, (r - 26) / 14);
  return lerp(19, 5, (r - 40) / (R - 40));
}

function bladeEdges(phi, r0, r1, n, f) {
  const dx = Math.sin(phi) * SA;
  const dy = -Math.cos(phi);
  const tx = Math.cos(phi) * SA;
  const ty = Math.sin(phi);
  const lead = [];
  const trail = [];
  for (let k = 0; k <= n; k++) {
    const r = lerp(r0, r1, k / n);
    const c = chordAt(r) * f;
    const cx = HUB.x + dx * r;
    const cy = HUB.y + dy * r;
    lead.push([cx + tx * c * 0.32, cy + ty * c * 0.32]);
    trail.push([cx - tx * c * 0.68, cy - ty * c * 0.68]);
  }
  return { lead, trail };
}

function drawRotor(ctx, T, b) {
  const rot = rotorAngle(T, b);
  ctx.save();
  ctx.lineJoin = 'round';
  for (let k = 0; k < 3; k++) {
    const phi = rot + (k * TAU) / 3;
    const e = bladeEdges(phi, 8, R, 7, 1);
    const outline = [...e.lead, ...e.trail.slice().reverse()];
    // white blade, olive trailing half, purple key line printed off register
    ctx.fillStyle = WHITE;
    poly(ctx, outline);
    ctx.fill();
    const m = bladeEdges(phi, 30, R - 6, 6, 0.36);
    ctx.fillStyle = OLIVE;
    // (trailing panel: between the 0.36-chord line and the trailing edge)
    const tp = [];
    for (let i = 1; i < e.trail.length; i++) tp.push(e.trail[i]);
    const inner = [];
    for (let i = m.trail.length - 1; i >= 0; i--) inner.push(m.trail[i]);
    poly(ctx, [...tp, ...inner]);
    ctx.fill();
    ctx.translate(REG.purple[0], REG.purple[1]);
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 1.6;
    poly(ctx, outline);
    ctx.stroke();
    ctx.translate(-REG.purple[0], -REG.purple[1]);
  }
  // hub and spinner, pointing downwind (right)
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.moveTo(HUB.x - 2, HUB.y - 13);
  ctx.quadraticCurveTo(HUB.x + 22, HUB.y - 8, HUB.x + 26, HUB.y);
  ctx.quadraticCurveTo(HUB.x + 22, HUB.y + 8, HUB.x - 2, HUB.y + 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = OLIVE;
  ctx.beginPath();
  ctx.moveTo(HUB.x + 4, HUB.y + 4);
  ctx.quadraticCurveTo(HUB.x + 20, HUB.y + 6, HUB.x + 26, HUB.y);
  ctx.quadraticCurveTo(HUB.x + 22, HUB.y + 8, HUB.x - 2, HUB.y + 13);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(HUB.x - 2 + 1.5, HUB.y - 13 + 1.5);
  ctx.quadraticCurveTo(HUB.x + 23.5, HUB.y - 6.5, HUB.x + 27.5, HUB.y + 1.5);
  ctx.quadraticCurveTo(HUB.x + 23.5, HUB.y + 9.5, HUB.x - 0.5, HUB.y + 14.5);
  ctx.stroke();
  ctx.restore();
}

/** Stencil-cut wind streaks blowing in from the left (behind the rotor). */
function drawWind(ctx, T, b) {
  const gust = ss(2 * b, 2.6 * b, T);
  const shift = 70 * T + 120 * intSmooth(T, 2 * b, 2.6 * b);
  ctx.save();
  ctx.strokeStyle = WHITE;
  ctx.lineCap = 'butt';
  ctx.setLineDash([26, 7]);
  for (let k = 0; k < 6; k++) {
    const y0 = 214 + kit_h(k * 3.1) * 230;
    const len = 110 + kit_h(k * 5.7) * 90;
    const span = 556 + 280 - len; // the curl ends left of the lettering (x < 570)
    const x = (((shift * (0.8 + 0.4 * kit_h(k * 2.3)) + kit_h(k * 7.9) * span) % span) + span) % span - 280;
    const u = clamp01((x + 280) / span);
    ctx.globalAlpha = Math.sin(u * Math.PI) * (0.75 + 0.25 * gust);
    ctx.lineWidth = 3 + gust;
    ctx.beginPath();
    for (let q = 0; q <= 8; q++) {
      const px = x + (q / 8) * len;
      const py = y0 + Math.sin((q / 8) * 3 + k + T * 1.3) * 5;
      if (q === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    const ex = x + len;
    const ey = y0 + Math.sin(3 + k + T * 1.3) * 5;
    ctx.arc(ex, ey - 7, 7, Math.PI / 2, -Math.PI * 0.7, true);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();
}
function kit_h(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** The hoist: rope, the rising crate and six volunteers hauling out across the field. */
const VS = 1.5; // volunteer scale
const VFOOT = 668; // their feet on the field
function drawHoist(ctx, T, b, beat) {
  const up = ss(-1.5 * b, 2 * b, T); // the crate rises over bars 1-2
  const free = ss(2 * b, 2.2 * b, T); // rope released on the downbeat
  ctx.save();
  // vertical rope from the davit down to the pulley at the foot
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(ROPE_X, DAVIT_Y);
  ctx.lineTo(ROPE_X, TB - 4);
  ctx.stroke();
  // the crate
  if (up < 0.995) {
    const cy = lerp(TB - 22, 268, up);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(ROPE_X - 11, cy, 22, 18);
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(ROPE_X - 11 + 1.5, cy + 1.5, 22, 18);
    ctx.beginPath();
    ctx.moveTo(ROPE_X - 9, cy + 3);
    ctx.lineTo(ROPE_X + 11, cy + 18);
    ctx.stroke();
  }
  // haul line from the foot pulley out to the right across the field; slack when released
  const back = 50 * up; // they walk backwards (right) as they pull
  const lead = 600 + back;
  const handY = VFOOT - 40;
  const endX = lead - 12;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(ROPE_X + 4, TB);
  const sag = lerp(10, 34, free);
  ctx.quadraticCurveTo((ROPE_X + endX) / 2, lerp(handY, VFOOT, free) + sag, endX + 26 * free, lerp(handY, VFOOT - 2, free));
  ctx.stroke();
  // volunteers (hard hats, 70s hair) facing the tower, leaning back on the rope, then cheering
  const heave = beat;
  ctx.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const fx = lead + k * 31 + (kit_h(k * 4.3) - 0.5) * 6;
    const lean = (1 - free) * (0.42 + 0.12 * heave + 0.05 * kit_h(k * 9.1)); // leaning right (away from the tower)
    const hipX = fx;
    const hipY = VFOOT - 14 * VS;
    const shX = hipX + Math.sin(lean) * 15 * VS;
    const shY = hipY - Math.cos(lean) * 15 * VS;
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 5 * VS;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(shX, shY);
    // legs braced toward the tower
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX - (7 * (1 - free) + 2) * VS, VFOOT);
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(hipX + 3 * VS, VFOOT);
    ctx.stroke();
    ctx.lineWidth = 3 * VS;
    ctx.beginPath();
    if (free < 0.5) {
      ctx.moveTo(shX, shY + 2);
      ctx.lineTo(shX - 13 * VS, handY);
    } else {
      // both arms up in a V, pumping on the beat
      const reach = (15 + 3 * heave) * VS;
      ctx.moveTo(shX - 10 * VS, shY - reach);
      ctx.lineTo(shX - 2 * VS, shY + 1);
      ctx.lineTo(shX + 2 * VS, shY + 1);
      ctx.lineTo(shX + 10 * VS, shY - reach);
    }
    ctx.stroke();
    const hx = shX + Math.sin(lean) * 6 * VS;
    const hy = shY - 7 * VS;
    ctx.fillStyle = PURPLE;
    ctx.beginPath();
    ctx.arc(hx, hy, 5 * VS, 0, TAU);
    ctx.fill();
    if (k % 3 !== 1) {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(hx, hy - 1.5 * VS, 5.5 * VS, Math.PI, TAU);
      ctx.fill();
      ctx.fillRect(hx - 7 * VS, hy - 2 * VS, 14 * VS, 1.6 * VS);
    } else {
      ctx.beginPath();
      ctx.ellipse(hx - 2 * VS, hy + 4 * VS, 4 * VS, 7 * VS, -lean, 0, TAU); // long hair
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Power runs down the tower to the school and the farm, and their windows light up (bar 3). */
function drawPower(ctx, T, b, pulse) {
  const s = clamp01((T - 2 * b) / (0.3 * b));
  if (T >= 2 * b && s < 1) {
    // a spark running down the tower, then along the field both ways: school (left), farm (right)
    const diamond = (x, y) => {
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x, y + 8);
      ctx.lineTo(x - 5, y);
      ctx.closePath();
    };
    ctx.fillStyle = ORANGE;
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (s < 0.6) diamond(TX, lerp(TT + 6, TB - 6, s / 0.6));
    else {
      const u = (s - 0.6) / 0.4;
      diamond(lerp(TX - 26, 200, u), TB - 6);
      diamond(lerp(TX + 26, 870, u), TB - 6);
    }
    ctx.fill();
    ctx.stroke();
  }
  const on = ss(2.3 * b, 2.36 * b, T);
  if (on <= 0) return;
  ctx.save();
  ctx.globalAlpha = on;
  // lit windows: an orange glow printed under a white pane
  ctx.fillStyle = ORANGE;
  for (const wd of WINDOWS) ctx.fillRect(wd.x - 2, wd.y - 2, wd.w + 4 + 1.5, wd.h + 4 + 1.5);
  ctx.fillStyle = WHITE;
  for (const wd of WINDOWS) ctx.fillRect(wd.x + 1, wd.y + 1, wd.w - 1, wd.h - 1);
  // lightning stencil over the school (pops on, then rests): white with a deep purple shadow
  const pop = ss(2.3 * b, 2.45 * b, T);
  const sc = (0.6 + 0.4 * pop) * (1 + 0.1 * pulse);
  ctx.translate(100, 500);
  ctx.scale(sc, sc);
  // (a canvas path is fixed when built, so build it once per screen at its own offset)
  const bolt = (dx, dy) => {
    poly(ctx, [[6 + dx, -40 + dy], [-18 + dx, 4 + dy], [-2 + dx, 4 + dy], [-10 + dx, 40 + dy], [20 + dx, -8 + dy], [4 + dx, -8 + dy], [14 + dx, -40 + dy]]);
    ctx.fill();
  };
  ctx.fillStyle = PURPLE;
  bolt(4, 4);
  ctx.fillStyle = WHITE;
  bolt(-1, -1);
  ctx.restore();
}

// rally crowd seen from behind (foreground plate)
const CROWD = [];
for (let i = 0; i < 13; i++) {
  const h = (n) => kit_h(i * 13.7 + n);
  CROWD.push({
    x: -20 + i * 86 + (h(1) - 0.5) * 30,
    y: 846 + h(2) * 36 + (i % 2) * 14,
    s: 0.88 + h(3) * 0.3,
    hair: h(4) < 0.3 ? 'afro' : h(4) < 0.65 ? 'long' : 'short',
    hat: h(5) < 0.38,
    arm: h(6) < 0.8 ? (h(7) < 0.5 ? -1 : 1) : 0,
    lag: h(8) * 0.18,
    ph: h(9) * TAU,
  });
}

function personPath(ctx, f, x) {
  const s = f.s;
  const y = f.y;
  // shoulders and back
  ctx.moveTo(x - 64 * s, S + 10);
  ctx.lineTo(x - 60 * s, y + 70 * s);
  ctx.quadraticCurveTo(x - 58 * s, y + 38 * s, x - 18 * s, y + 32 * s);
  ctx.lineTo(x + 18 * s, y + 32 * s);
  ctx.quadraticCurveTo(x + 58 * s, y + 38 * s, x + 60 * s, y + 70 * s);
  ctx.lineTo(x + 64 * s, S + 10);
  ctx.closePath();
  // head / hair
  if (f.hair === 'afro') {
    ctx.moveTo(x + 40 * s, y);
    ctx.arc(x, y, 40 * s, 0, TAU);
  } else if (f.hair === 'long') {
    ctx.moveTo(x + 32 * s, y + 10 * s);
    ctx.ellipse(x, y + 12 * s, 32 * s, 44 * s, 0, 0, TAU);
  } else {
    ctx.moveTo(x + 29 * s, y);
    ctx.arc(x, y, 29 * s, 0, TAU);
  }
}

function armUp(f, T, b) {
  return ss(2 * b + f.lag * b, 2.25 * b + f.lag * b, T) * (1 - ss(3.8 * b, 4.25 * b, T));
}

function drawCrowd(ctx, T, b, beatSec, pulse) {
  const fists = [];
  // two passes: the orange screen a few px off, then the purple key plate
  for (let pass = 0; pass < 2; pass++) {
    ctx.fillStyle = pass === 0 ? ORANGE : PURPLE;
    const [ox, oy] = pass === 0 ? [6, -5] : [0, 0];
    ctx.beginPath();
    for (const f of CROWD) {
      const sway = Math.sin((T / beatSec) * Math.PI + f.ph) * 4;
      personPath(ctx, f, f.x + sway + ox);
    }
    if (pass === 0) {
      ctx.save();
      ctx.translate(0, oy);
      ctx.fill();
      ctx.restore();
    } else ctx.fill();
  }
  // raised arms (fists or hard hats), pumping on each beat of bars 3-4
  ctx.save();
  ctx.lineCap = 'round';
  for (const f of CROWD) {
    if (!f.arm) continue;
    const u = armUp(f, T, b);
    if (u <= 0.01) continue;
    const s = f.s;
    const sway = Math.sin((T / beatSec) * Math.PI + f.ph) * 4;
    const shX = f.x + sway + f.arm * 44 * s;
    const shY = f.y + 48 * s;
    const th = lerp(Math.PI * 0.95, 0.22, u) * f.arm; // swing up from the side
    const L = (100 - 10 * pulse * u) * s;
    const hx = shX + Math.sin(th) * L;
    const hy = shY - Math.cos(th) * L;
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 22 * s;
    ctx.beginPath();
    ctx.moveTo(shX, shY);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    fists.push({ x: hx, y: hy, s, hat: f.hat, a: th, u });
  }
  for (const q of fists) {
    if (q.hat && q.u > 0.35) {
      // waving the hard hat
      ctx.fillStyle = PURPLE;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 13 * q.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(q.x, q.y - 12 * q.s, 24 * q.s, Math.PI, TAU);
      ctx.fill();
      ctx.fillRect(q.x - 30 * q.s, q.y - 13 * q.s, 60 * q.s, 6 * q.s);
    } else {
      ctx.fillStyle = PURPLE;
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, 17 * q.s, 19 * q.s, q.a, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
  // hard hats on the heads of the others
  ctx.fillStyle = WHITE;
  for (const f of CROWD) {
    if (!f.hat || (f.arm && armUp(f, T, b) > 0.35)) continue;
    const sway = Math.sin((T / beatSec) * Math.PI + f.ph) * 4;
    const x = f.x + sway;
    ctx.beginPath();
    ctx.arc(x, f.y - 4 * f.s, 31 * f.s, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(x - 38 * f.s, f.y - 6 * f.s, 76 * f.s, 7 * f.s);
  }
}

// rider: flat inks with an orange screen printed off register
const RIDER = {
  plumage: WHITE,
  plumageShade: '#dccfb2',
  mask: PURPLE,
  bill: PURPLE,
  eyeRing: ORANGE,
  legs: PURPLE,
  crest: ORANGE_T,
  breast: ORANGE_T,
  frame: ORANGE,
  frameShade: '#c24a1f',
  metal: PURPLE,
  tire: PURPLE,
  rim: KRAFT,
  saddle: OLIVE,
  outline: PURPLE,
  outlineWidth: 1.1,
  shading: false,
  spokes: 8,
};

export function render(kit, ctx, p) {
  const b = p.beat.barSec;
  const T = p.isThumbnail ? 3 * b : p.rawLocalT; // thumbnail: lights on, crowd cheering
  const pulse = p.isThumbnail ? 0 : p.beat.pulse(0.4);
  const L = kit.layout(p);
  ctx.save();
  const bg = kit.bake(ID + '_bg_v2', S, S, (g, rng, w, h) => paintPoster(kit, g, rng, w, h));
  const square = L.x === 0 && L.y === 0 && L.s === 1 && p.W === S && p.H === S;
  // easel: the print hangs as a sheet on plain kraft (baked once at full size, blitted 1:1)
  const back = square
    ? bg
    : kit.bake(`${ID}_wide_v2_${p.W}x${p.H}_${Math.round(L.x)}_${Math.round(L.y)}_${L.s.toFixed(4)}`, p.W, p.H, (g, rng, w, h) => {
        g.drawImage(kit.paper(ID + '_kraftwide', w, h, { color: KRAFT, grain: 0.05, blotches: 10, blotchColor: 'rgba(90,60,30,0.08)' }), 0, 0);
        g.drawImage(bg, L.x, L.y, S * L.s, S * L.s);
      });
  ctx.drawImage(back, 0, 0);
  ctx.translate(L.x, L.y);
  ctx.scale(L.s, L.s);
  if (!square) {
    ctx.beginPath();
    ctx.rect(0, 0, S, S);
    ctx.clip();
  }

  drawWind(ctx, T, b);
  drawRotor(ctx, T, b);
  ctx.drawImage(kit.bake(ID + '_tower_v2', TS.w, TS.h, (g, rng, w, h) => paintTower(kit, g, rng, w, h)), TS.x, TS.y);
  drawHoist(ctx, T, b, p.isThumbnail ? 0 : p.beat.pulse(0.6));
  drawPower(ctx, T, b, pulse);

  if (p.actor && p.actor.visible) {
    const rig = p.actor.rig();
    const prop = { type: p.prop.type, colors: [WHITE, ORANGE], stroke: PURPLE };
    ctx.save();
    ctx.translate(5, -4);
    ctx.globalAlpha = 0.55;
    p.actor.draw(ctx, rig, { ...RIDER, silhouette: ORANGE, showBike: false, showProp: false, prop });
    ctx.restore();
    p.actor.draw(ctx, rig, { ...RIDER, prop });
  }

  drawCrowd(ctx, T, b, p.beat.beatSec, pulse);

  // pinholes and specks over the moving parts (the baked print already has its own)
  ctx.fillStyle = ctx.createPattern(grainTile(kit), 'repeat');
  ctx.fillRect(140, 56, 400, 390);
  ctx.fillRect(0, 730, S, S - 730);
  if (p.actor && p.actor.visible) ctx.fillRect(Math.round(p.riderLocalX) - 170, 440, 340, 290);
  ctx.restore();
}
