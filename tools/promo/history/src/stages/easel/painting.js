// src/stages/easel/painting.js — what is painted on the easel board.
//
// A CARD is a chapter's painting, baked once in separate layers so it can be revealed
// stroke by stroke: paper, text (date + title), a soft wash miniature of the chapter scene
// and a sharper detail layer, plus a seal with the chapter number. A SCHEDULE says, beat
// by beat, where the brush is and what it reveals:
//   dip in the water jar -> paint the date -> the title -> load colour on the palette ->
//   wash rows over the miniature (one beat each) -> rinse -> detail dabs -> glance at the
//   valley -> last accents -> sign + seal ... and the big wash sweep on the next bar line.
// The plan is written for 16 beats and stretched to the chapter's length on a half-beat grid.

import { BOARD, CARD, EASEL, PAINTER, SCENE } from './geom.js';
import { makePRNG, hashSeed, createCanvas, hexToRgb, noise1 } from '../../kit/kit.js';
import { blot, granulate } from './scenery.js';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const ss = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const CARD_RES = 2;
export const INTRO_RES = 3;
const PAPER_CARD = '#fbf7ec';

/** World position of the palette in the painter's left hand (matches person.js at rest). */
export const PALETTE_AT = { x: PAINTER.x - 92, y: PAINTER.y - 190 };
/** Painters without a palette hand (descriptor.holdsPalette === false) load colour elsewhere. */
export function setPaletteAt(p) {
  PALETTE_AT.x = p.x;
  PALETTE_AT.y = p.y;
}
const JAR_IN = { x: EASEL.jar.x, y: EASEL.jar.y - 14 };
const REST = { x: BOARD.x + 52, y: BOARD.y + 176 };

// -----------------------------------------------------------------------------
// colours
// -----------------------------------------------------------------------------
function lum(hex) {
  const c = hexToRgb(hex);
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}
function sat(hex) {
  const c = hexToRgb(hex);
  const mx = Math.max(c.r, c.g, c.b);
  const mn = Math.min(c.r, c.g, c.b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}
/** Ink colours for a chapter card: date (a saturated mid-dark), title (the darkest). */
export function cardInks(ch) {
  const pal = (ch.palette || []).filter((c) => typeof c === 'string' && c[0] === '#');
  const e = ch.easel || {};
  const darkest = pal.slice().sort((a, b) => lum(a) - lum(b))[0] || '#2c2721';
  const cands = pal.filter((c) => lum(c) < 0.5);
  const accent = (ch.frame && ch.frame.accent && lum(ch.frame.accent) < 0.55 ? ch.frame.accent : null) || cands.sort((a, b) => sat(b) - sat(a))[0] || darkest;
  return { date: e.dateInk || accent, title: e.ink || (lum(darkest) < 0.3 ? darkest : '#2c2721'), seal: e.seal || '#b8322a' };
}

// -----------------------------------------------------------------------------
// card layout + layers
// -----------------------------------------------------------------------------
function fitFont(g, text, weight, family, maxSize, maxW) {
  let size = maxSize;
  g.font = `${weight} ${size}px ${family}`;
  while (g.measureText(text).width > maxW && size > 9) {
    size -= 1;
    g.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function paperLayer(key, res, kit) {
  const w = CARD.w * res;
  const h = CARD.h * res;
  return kit.bake(`easel_cardpaper_v2_${key}`, w, h, (g, rng) => {
    g.fillStyle = PAPER_CARD;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) blot(g, rng() * w, rng() * h, 60 * res + rng() * 80 * res, '200, 180, 140', 0.05);
    granulate(g, 0, 0, w, h, rng, 1400 * res, '120, 100, 70', 0.08);
    // pencil guides + deckle shadow
    g.strokeStyle = 'rgba(80, 74, 66, 0.10)';
    g.lineWidth = res * 0.8;
    g.strokeRect(10 * res, 10 * res, w - 20 * res, h - 20 * res);
  });
}

/** Watercolour text: pigment fill, a darker pooled edge and a slight bloom offset. */
function paintText(g, text, x, y, font, color, res) {
  g.font = font;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  const c = hexToRgb(color);
  g.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.28)`;
  g.fillText(text, x + 1.2 * res, y + 1 * res);
  g.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.9)`;
  g.fillText(text, x, y);
  g.strokeStyle = `rgba(${Math.round(c.r * 0.6)}, ${Math.round(c.g * 0.6)}, ${Math.round(c.b * 0.6)}, 0.35)`;
  g.lineWidth = 0.7 * res;
  g.strokeText(text, x, y);
}

/** Ragged vignette path inside rect r (card px), for the miniature's soft wash edge. */
function vignettePath(g, r, rng, inset, res) {
  const pts = [];
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    // superellipse so the miniature stays mostly rectangular
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const k = 6;
    const rr = 1 / Math.pow(Math.pow(Math.abs(ca), k) + Math.pow(Math.abs(sa), k), 1 / k);
    const jitter = 1 - (inset + rng() * 0.05);
    pts.push([cx + ca * rr * (r.w / 2) * jitter, cy + sa * rr * (r.h / 2) * jitter]);
  }
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  return pts;
}

/**
 * Bake a card. spec = {
 *   key, res,
 *   lines: [{ text, weight, family, size, color, y (baseline, logical) }],
 *   mini: { canvas, sx, sy, sw, sh } | null,   // source region of a scene still
 *   miniRect: { x, y, w, h } (logical), seal: { text, color } | null }
 */
export function bakeCard(kit, spec) {
  const res = spec.res;
  const w = CARD.w * res;
  const h = CARD.h * res;
  const card = { key: spec.key, res, w, h, lines: [], rows: [], dabs: [], seal: spec.seal || null, miniRect: spec.miniRect || null };
  card.paper = paperLayer(spec.key, res, kit);
  const rng = makePRNG(hashSeed(`card_${spec.key}`));

  // text
  card.text = kit.bake(`easel_cardtext_v3_${spec.key}`, w, h, (g) => {
    for (const ln of spec.lines) {
      const maxW = (ln.maxW ?? CARD.w - 36) * res;
      const size = fitFont(g, ln.text, ln.weight, ln.family, ln.size * res, maxW);
      const tw = g.measureText(ln.text).width;
      const x = (ln.x ?? 18) * res + (ln.center ? (maxW - tw) / 2 : 0);
      paintText(g, ln.text, x, ln.y * res, `${ln.weight} ${size}px ${ln.family}`, ln.color, res);
      card.lines.push({ x0: x / res - 4, x1: (x + tw) / res + 6, yTop: ln.y - (size / res) * 0.95, yBot: ln.y + (size / res) * 0.3 });
    }
  });
  if (!card.lines.length) {
    // the bake was cached: recompute line extents
    const g = createCanvas(4, 4).getContext('2d');
    for (const ln of spec.lines) {
      const maxW = (ln.maxW ?? CARD.w - 36) * res;
      const size = fitFont(g, ln.text, ln.weight, ln.family, ln.size * res, maxW);
      const tw = g.measureText(ln.text).width;
      const x = (ln.x ?? 18) * res + (ln.center ? (maxW - tw) / 2 : 0);
      card.lines.push({ x0: x / res - 4, x1: (x + tw) / res + 6, yTop: ln.y - (size / res) * 0.95, yBot: ln.y + (size / res) * 0.3 });
    }
  }

  // miniature (wash + detail) from a scene still
  const r = spec.miniRect;
  if (spec.mini && r) {
    const { canvas, sx, sy, sw, sh } = spec.mini;
    const R = { x: r.x * res, y: r.y * res, w: r.w * res, h: r.h * res };
    // tiny version -> soft wash + row colours
    const tw = Math.max(8, Math.round(r.w / 6));
    const th = Math.max(4, Math.round(r.h / 6));
    const tiny = createCanvas(tw, th);
    const tg = tiny.getContext('2d');
    tg.imageSmoothingQuality = 'high';
    tg.drawImage(canvas, sx, sy, sw, sh, 0, 0, tw, th);
    const px = tg.getImageData(0, 0, tw, th).data;
    const nRows = 4;
    for (let k = 0; k < nRows; k++) {
      let rr = 0;
      let gg = 0;
      let bb = 0;
      let n = 0;
      const y0 = Math.floor((k / nRows) * th);
      const y1 = Math.max(y0 + 1, Math.floor(((k + 1) / nRows) * th));
      for (let y = y0; y < y1; y++)
        for (let x = 0; x < tw; x++) {
          const i = (y * tw + x) * 4;
          rr += px[i];
          gg += px[i + 1];
          bb += px[i + 2];
          n++;
        }
      card.rows.push({ y: r.y + ((k + 0.5) / nRows) * r.h, h: r.h / nRows, rgb: `${Math.round(rr / n)}, ${Math.round(gg / n)}, ${Math.round(bb / n)}` });
    }
    card.wash = kit.bake(`easel_cardwash_v3_${spec.key}`, w, h, (g, rg) => {
      g.imageSmoothingQuality = 'high';
      g.globalAlpha = 0.92;
      g.drawImage(tiny, R.x, R.y, R.w, R.h);
      g.globalAlpha = 0.35;
      g.drawImage(canvas, sx, sy, sw, sh, R.x, R.y, R.w, R.h);
      g.globalAlpha = 1;
      // blooms + granulation
      for (let i = 0; i < 10; i++) blot(g, R.x + rg() * R.w, R.y + rg() * R.h, (8 + rg() * 16) * res, '255, 252, 240', 0.22);
      granulate(g, R.x, R.y, R.w, R.h, rg, 900 * res, '40, 30, 20', 0.1);
      // ragged vignette edge + pooled rim
      g.globalCompositeOperation = 'destination-in';
      vignettePath(g, R, rg, 0.0, res);
      g.fill();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(60, 46, 30, 0.22)';
      g.lineWidth = 1.6 * res;
      vignettePath(g, R, makePRNG(hashSeed(`v_${spec.key}`)), 0.0, res);
      g.stroke();
    });
    card.detail = kit.bake(`easel_carddetail_v3_${spec.key}`, w, h, (g, rg) => {
      g.imageSmoothingQuality = 'high';
      g.drawImage(canvas, sx, sy, sw, sh, R.x, R.y, R.w, R.h);
      g.globalCompositeOperation = 'destination-in';
      vignettePath(g, R, rg, 0.04, res);
      g.fill();
      g.globalCompositeOperation = 'source-over';
    });
    // detail dab points (logical)
    const dr = makePRNG(hashSeed(`dabs_${spec.key}`));
    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      card.dabs.push({ x: r.x + r.w * (0.17 + col * 0.33 + (dr() - 0.5) * 0.08), y: r.y + r.h * (0.3 + row * 0.42 + (dr() - 0.5) * 0.1), r: Math.min(r.w, r.h) * 0.42 });
    }
  }
  return card;
}

// -----------------------------------------------------------------------------
// schedules
// -----------------------------------------------------------------------------
/**
 * Event: { kind, b0, b1, layer?, pos(u) -> {x, y} (world), contact(u), color, look }
 * kinds: dip | text | wash | dab | look | sign | sweep
 */
function boardPt(cx, cy) {
  return { x: BOARD.x + (cx * BOARD.w) / CARD.w, y: BOARD.y + (cy * BOARD.h) / CARD.h };
}

function dipEvent(b0, b1, where, color) {
  const P = where === 'jar' ? JAR_IN : PALETTE_AT;
  return {
    kind: 'dip',
    where,
    b0,
    b1,
    color,
    pos: (u) => {
      const down = Math.sin(Math.PI * clamp(u * 1.15, 0, 1));
      const stir = Math.sin(u * TAU * 2) * 5 * down;
      return { x: P.x + stir, y: P.y - 26 + 26 * down };
    },
    contact: () => 0,
  };
}

function textEvent(b0, b1, line, color, seed) {
  return {
    kind: 'text',
    layer: 'text',
    line,
    b0,
    b1,
    color,
    pos: (u) => {
      // the brush writes along the line with a small up/down per character
      const x = line.x0 + (line.x1 - line.x0) * u;
      const midY = (line.yTop + line.yBot) / 2;
      const amp = (line.yBot - line.yTop) * 0.32;
      return boardPt(x, midY + amp * Math.sin(u * TAU * Math.max(2, (line.x1 - line.x0) / 30) + seed));
    },
    contact: (u) => ss(0, 0.06, u) * (1 - ss(0.94, 1, u)),
  };
}

function washEvent(b0, b1, row, dir, rect) {
  const x0 = rect.x + 4;
  const x1 = rect.x + rect.w - 4;
  return {
    kind: 'wash',
    layer: 'wash',
    row,
    dir,
    b0,
    b1,
    color: `rgb(${row.rgb})`,
    pathX: (u) => (dir > 0 ? x0 + (x1 - x0) * u : x1 - (x1 - x0) * u),
    pathY: (u) => row.y + Math.sin(u * TAU * 1.5 + row.y) * row.h * 0.12,
    pos(u) {
      return boardPt(this.pathX(u), this.pathY(u));
    },
    contact: (u) => ss(0, 0.05, u) * (1 - ss(0.95, 1, u)),
  };
}

function dabEvent(b0, b1, dab, color) {
  return {
    kind: 'dab',
    layer: 'detail',
    dab,
    b0,
    b1,
    color,
    pos: (u) => {
      const hop = Math.sin(Math.PI * u);
      return boardPt(dab.x + (u - 0.5) * 8, dab.y - 14 * (1 - Math.min(1, u * 2.2)) * hop);
    },
    contact: (u) => ss(0.25, 0.4, u) * (1 - ss(0.75, 0.95, u)),
  };
}

function holdEvent(kind, b0, b1, at, look = 0) {
  return { kind, b0, b1, look, pos: () => at, contact: () => 0 };
}

function signEvent(b0, b1, color) {
  const a = { x: CARD.w - 64, y: CARD.h - 14 };
  return {
    kind: 'sign',
    b0,
    b1,
    color,
    pos: (u) => boardPt(a.x + 40 * u, a.y - 6 * Math.sin(u * TAU * 1.5)),
    contact: (u) => ss(0, 0.1, u) * (1 - ss(0.8, 1, u)),
  };
}

export function sweepEvent(b0, b1, color) {
  return {
    kind: 'sweep',
    b0,
    b1,
    color,
    pos: (u) => boardPt(-10 + (CARD.w + 20) * u, CARD.h * 0.5 + 30 * Math.sin(u * Math.PI) - 20 * u),
    contact: (u) => ss(0.05, 0.2, u) * (1 - ss(0.85, 1, u)),
  };
}

/** Snap a template beat (written for 16) onto the chapter's beat grid (half beats). */
function grid(b, B) {
  return Math.round(((b * B) / 16) * 2) / 2;
}

/** The painting plan for a chapter card over B beats (beat 0 = the chapter's downbeat). */
export function chapterSchedule(card, ch, B) {
  const inks = cardInks(ch);
  const ev = [];
  const G = (b) => grid(b, B);
  const pal = ch.palette || [];
  const push = (e) => {
    if (e.b1 - e.b0 > 0.01) ev.push(e);
  };
  push(dipEvent(G(0.5), G(1.5), 'jar', inks.date));
  if (card.lines[0]) push(textEvent(G(1.5), G(3.5), card.lines[0], inks.date, 0.3));
  if (card.lines[1]) push(textEvent(G(3.5), G(5), card.lines[1], inks.title, 1.1));
  push(dipEvent(G(5), G(6), 'palette', pal[1] || inks.date));
  card.rows.forEach((row, k) => push(washEvent(G(6 + k), G(7 + k), row, k % 2 ? -1 : 1, card.miniRect)));
  push(dipEvent(G(10), G(11), 'jar', pal[2] || inks.title));
  const dabs = card.dabs;
  for (let k = 0; k < 4 && k < dabs.length; k++) push(dabEvent(G(11 + k * 0.5), G(11.5 + k * 0.5), dabs[k], inks.title));
  push(holdEvent('look', G(13), G(14), boardPt(CARD.w - 30, CARD.h * 0.35), 1));
  for (let k = 4; k < 6 && k < dabs.length; k++) push(dabEvent(G(14 + (k - 4) * 0.5), G(14.5 + (k - 4) * 0.5), dabs[k], inks.title));
  push(signEvent(G(15), G(15.5), inks.seal));
  return { events: ev, B, inks, signAt: G(15.25), detailFadeAt: G(15), lastBeat: B - 0.5 };
}

/** The intro's title card plan over B beats (ends before the first chapter's sweep). */
export function introSchedule(card, B) {
  const ev = [];
  const n = card.lines.length;
  // title over ~40 % of the intro, then the other lines; hold before the pull-back
  const start = Math.min(1, B * 0.08);
  const titleEnd = Math.max(start + 1, Math.round(B * 0.42 * 2) / 2);
  ev.push(textEvent(start, titleEnd, card.lines[0], card.inkTitle || '#2c2721', 0.4));
  let b = titleEnd;
  for (let i = 1; i < n; i++) {
    const len = i === 1 ? Math.max(0.5, Math.round(B * 0.14 * 2) / 2) : Math.max(0.5, Math.round(B * 0.08 * 2) / 2);
    ev.push(textEvent(b, b + len, card.lines[i], card.lineColors ? card.lineColors[i] : '#2c2721', 0.8 + i));
    b += len;
  }
  ev.push(holdEvent('look', b + 0.5, B - 0.6, boardPt(CARD.w - 40, CARD.h * 0.55), 1));
  return { events: ev, B, inks: { date: '#2c2721', title: '#2c2721', seal: '#b8322a' }, signAt: 1e9, detailFadeAt: 1e9, lastBeat: B - 0.5 };
}

/**
 * Brush state at beat b of a schedule (plus an optional incoming sweep at [-0.5, 0.5]).
 * Returns { pos (world), contact, color, look, event }.
 */
export function brushAt(sched, b, sweep = null) {
  const ev = sweep ? [sweep, ...sched.events] : sched.events;
  let prev = null;
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i];
    if (b < e.b0) {
      // travelling (lifted) from the previous event's end to this one's start
      const A = prev ? prev.pos(1) : REST;
      const Bp = e.pos(0);
      const t0 = prev ? prev.b1 : Math.min(e.b0 - 0.5, 0);
      const u = ss(t0, e.b0, b);
      const arc = Math.sin(Math.PI * u) * Math.min(28, Math.hypot(Bp.x - A.x, Bp.y - A.y) * 0.25);
      return { pos: { x: A.x + (Bp.x - A.x) * u, y: A.y + (Bp.y - A.y) * u - arc }, contact: 0, color: prev ? prev.color : e.color, look: prev && prev.look ? prev.look * (1 - u) : 0, event: null };
    }
    if (b <= e.b1) {
      const u = (b - e.b0) / (e.b1 - e.b0);
      const look = e.look ? e.look * Math.sin(Math.PI * clamp(u * 1.3, 0, 1)) : 0;
      return { pos: e.pos(u), contact: e.contact(u), color: e.color, look, event: e, u };
    }
    prev = e;
  }
  // after the last event: drift back towards rest
  const A = prev ? prev.pos(1) : REST;
  const u = ss(prev ? prev.b1 : 0, (prev ? prev.b1 : 0) + 1, b);
  return { pos: { x: A.x + (REST.x - A.x) * u, y: A.y + (REST.y - A.y) * u }, contact: 0, color: prev ? prev.color : '#3d6b8c', look: 0, event: null };
}

// -----------------------------------------------------------------------------
// per-frame card compositing
// -----------------------------------------------------------------------------
const scratch = new Map();
function scratchCanvas(res, id) {
  const k = `${res}:${id}`;
  if (!scratch.has(k)) scratch.set(k, createCanvas(CARD.w * res, CARD.h * res));
  return scratch.get(k);
}

/** Reveal-mask strokes of one layer up to beat b (drawn into g, logical coords x res). */
function drawMask(g, sched, layer, b, res) {
  g.save();
  g.scale(res, res);
  g.fillStyle = '#000';
  g.strokeStyle = '#000';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  let any = false;
  for (const e of sched.events) {
    if (e.layer !== layer || b < e.b0) continue;
    const u = clamp((b - e.b0) / (e.b1 - e.b0), 0, 1);
    any = true;
    if (e.kind === 'text') {
      const L = e.line;
      const xr = L.x0 + (L.x1 - L.x0 + 8) * u;
      g.beginPath();
      g.moveTo(L.x0 - 4, L.yTop - 6);
      const n = 6;
      for (let k = 0; k <= n; k++) {
        const y = L.yTop - 6 + ((L.yBot - L.yTop + 12) * k) / n;
        g.lineTo(xr + 5 * Math.sin(k * 2.1 + L.x0), y);
      }
      g.lineTo(L.x0 - 4, L.yBot + 6);
      g.closePath();
      g.fill();
    } else if (e.kind === 'wash') {
      const steps = Math.max(2, Math.ceil(u * 24));
      for (const [off, wk] of [[0, 1.75], [-0.45, 0.9], [0.5, 0.85]]) {
        g.lineWidth = e.row.h * wk;
        g.beginPath();
        for (let k = 0; k <= steps; k++) {
          const uu = (k / steps) * u;
          const x = e.pathX(uu);
          const y = e.pathY(uu) + off * e.row.h + 2.5 * noise1(x * 0.08 + off * 10, 3);
          if (k === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();
      }
    } else if (e.kind === 'dab') {
      const grow = 1 - Math.pow(1 - ss(0.3, 0.9, u), 2);
      const r = e.dab.r * grow;
      if (r > 0.5) {
        for (const [ox, oy, k] of [[0, 0, 1], [r * 0.35, -r * 0.2, 0.7], [-r * 0.3, r * 0.25, 0.65]]) {
          g.beginPath();
          g.arc(e.dab.x + ox, e.dab.y + oy, r * k, 0, TAU);
          g.fill();
        }
      }
    }
  }
  g.restore();
  return any;
}

function layerComplete(sched, layer, b) {
  let last = -1e9;
  let has = false;
  for (const e of sched.events)
    if (e.layer === layer) {
      has = true;
      last = Math.max(last, e.b1);
    }
  return has && b >= last;
}

/**
 * Composite the card as painted at beat b into a reusable canvas (res x logical size).
 * `full` = draw every layer complete (outro, thumbnails).
 */
export function renderCard(card, sched, b, full = false, target = null) {
  const res = card.res;
  const out = target || scratchCanvas(res, 'live');
  const g = out.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.drawImage(card.paper, 0, 0);
  const m = scratchCanvas(res, 'mask');
  const mg = m.getContext('2d');
  for (const layer of ['wash', 'detail', 'text']) {
    const img = card[layer];
    if (!img) continue;
    if (full || layerComplete(sched, layer, b)) {
      g.drawImage(img, 0, 0);
      continue;
    }
    mg.setTransform(1, 0, 0, 1, 0, 0);
    mg.globalCompositeOperation = 'source-over';
    mg.clearRect(0, 0, m.width, m.height);
    const any = drawMask(mg, sched, layer, b, res);
    if (layer === 'detail' && b >= sched.detailFadeAt) {
      // whatever the dabs missed fades in for the finish
      g.globalAlpha = ss(sched.detailFadeAt, sched.detailFadeAt + 0.75, b);
      g.drawImage(img, 0, 0);
      g.globalAlpha = 1;
    }
    if (!any) continue;
    mg.globalCompositeOperation = 'source-in';
    mg.drawImage(img, 0, 0);
    mg.globalCompositeOperation = 'source-over';
    g.drawImage(m, 0, 0);
  }
  // seal stamp
  if (card.seal && (full || b >= sched.signAt)) {
    const k = full ? 1 : ss(sched.signAt, sched.signAt + 0.2, b);
    const pop = full ? 1 : 1 + 0.25 * Math.sin(Math.PI * ss(sched.signAt, sched.signAt + 0.35, b));
    const s = 22 * res * pop;
    const x = (CARD.w - 18) * res - 22 * res / 2;
    const y = 16 * res + 22 * res / 2;
    g.save();
    g.globalAlpha = k * 0.9;
    g.translate(x, y);
    g.rotate(-0.05);
    g.fillStyle = card.seal.color;
    g.fillRect(-s / 2, -s / 2, s, s);
    g.fillStyle = PAPER_CARD;
    g.font = `700 ${Math.round(13 * res * pop)}px ${card.seal.font}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(card.seal.text, 0, 1 * res);
    g.restore();
  }
  return out;
}

/** Draw the board (backing + painted paper) on the easel; `cardImg` is the composited card. */
export function drawBoard(ctx, cardImg, opts = {}) {
  const { x, y, w, h } = BOARD;
  ctx.save();
  // backing board
  ctx.fillStyle = 'rgba(40, 30, 20, 0.25)';
  ctx.fillRect(x - 4, y + 4, w + 12, h + 8);
  ctx.fillStyle = '#c9b48f';
  ctx.fillRect(x - 8, y - 6, w + 16, h + 12);
  ctx.strokeStyle = 'rgba(60, 44, 28, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 8, y - 6, w + 16, h + 12);
  // paper
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cardImg, x, y, w, h);
  if (opts.overlay) opts.overlay(ctx);
  // two masking-tape corners
  ctx.fillStyle = 'rgba(232, 222, 190, 0.85)';
  for (const [cx, cy, a] of [[x + 6, y + h - 6, 0.7], [x + w - 6, y + h - 6, -0.7]]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillRect(-14, -5, 28, 10);
    ctx.restore();
  }
  ctx.restore();
}

/** Wet sheen + a bead of pigment where the brush touches the paper. */
export function drawWetTip(ctx, pos, contact, color, t) {
  if (contact < 0.05) return;
  ctx.save();
  ctx.globalAlpha = contact * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(pos.x - 2, pos.y + 1, 6, 3.4, 0.3, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = contact * 0.55;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(pos.x - 4 + Math.sin(t * 9) * 0.6, pos.y - 1, 1.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Card-space wash wipe between two composited cards during a chapter change (w: 0..1). */
export function drawCardWipe(ctx, oldImg, newImg, w, color) {
  const { x, y, w: bw, h: bh } = BOARD;
  ctx.save();
  ctx.drawImage(oldImg, x, y, bw, bh);
  const fx = x - 30 + (bw + 60) * w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const n = 10;
  for (let k = 0; k <= n; k++) {
    const yy = y + (bh * k) / n;
    ctx.lineTo(fx + 12 * Math.sin(k * 1.9 + w * 3) - (yy - y - bh / 2) * 0.12, yy);
  }
  ctx.lineTo(x, y + bh);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.drawImage(newImg, x, y, bw, bh);
  ctx.restore();
  // wet rim of the wash
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35 * Math.sin(Math.PI * w);
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
}

/** The default miniature crop in the scene canvas: a wide band through the safe area. */
export function defaultCrop(miniRect) {
  const L = SCENE.layout;
  const sw = 1000 * L.s;
  const sh = (sw * miniRect.h) / miniRect.w;
  const cy = L.y + 530 * L.s;
  return [L.x, cy - sh / 2, sw, sh];
}
