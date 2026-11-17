// src/kit/media.js
// Art-medium helpers: the textures and overlays that make a period medium read at a glance.
// All of them are on `kit` (kit.paper, kit.halftone, ...). Deterministic (seeded) and cheap:
// anything that touches pixels runs once inside a bake and is cached by key; per-frame helpers
// only blit baked canvases or draw a handful of paths.
//
//   BAKE-TIME (call inside kit.bake callbacks, or use the ones that bake for you)
//     kit.paper(key, w, h, o)            -> canvas  paper / plaster / parchment / card stock
//     kit.halftoneShade(g, x, y, w, h, o)          print dots whose size follows a tone function
//     kit.stipple(g, x, y, w, h, o)                 random dots (engraving stipple, spray, dust)
//     kit.hatch(g, o)                               parallel (or cross-) hatching in the current clip
//     kit.wash(g, x, y, w, h, color, o)             watercolour / ink-wash blot with a darker rim
//   PER FRAME (cheap)
//     kit.dots(ctx, o)                   -> CanvasPattern  flat halftone fill (fillStyle)
//     kit.inkLine(ctx, pts, o)                      tapered brush / pen stroke along points
//     kit.emboss(ctx, pathFn, o)                    relief: shape drawn dark/light offset + fill
//     kit.misregister(ctx, drawFn, o)               two-ink screen print slightly off register
//     kit.glow(ctx, x, y, r, color, a)              soft additive glow (baked sprite)
//     kit.scanlines(ctx, w, h, o)                   CRT scan lines (+ optional rolling band)
//     kit.crt(ctx, w, h, T, o)                      scanlines + vignette + flicker for screens
//     kit.filmLook(ctx, w, h, T, o)                 newsreel: grain frames, flicker, scratches, vignette
//     kit.gateWeave(T, amp)              -> {dx, dy} film gate weave in whole px (translate before drawing)
//
// PERF: a full-frame drawImage costs ~0.7 ms unscaled at an integer offset, but ~6 ms when it is
// scaled or placed at a fractional offset (headless Chromium, 1920x1080). Bake full-size layers,
// blit them 1:1 at whole pixels; use small tiles as patterns for grain-like textures.
//     kit.pixelate(ctx, key, w, h, cell, drawFn)    draw at low resolution, blit up with hard pixels
//
// Every helper takes a plain options object; unknown keys are ignored. Colours are CSS strings.

import { makePRNG, hashSeed, hash11, noise1, fbm2, createCanvas, hexToRgb } from './kit.js';
import { clamp, quantizeTime } from '../beat/timeline.js';

const TAU = Math.PI * 2;

/** Parse '#rrggbb' or 'rgb(...)'-less 'r,g,b' into {r,g,b}. */
function toRgb(c) {
  if (typeof c === 'string' && c[0] === '#') return hexToRgb(c);
  if (typeof c === 'string') {
    const m = c.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  }
  return { r: 0, g: 0, b: 0 };
}

export function createMedia(kit) {
  const { bake } = kit;

  // ---------------------------------------------------------------- paper
  /**
   * Paper-like ground, baked. o: color ('#efe6d2'), grain (0.05), blotches (24), blotchColor
   * ('rgba(120,90,50,0.06)'), fibers (true), vignette (0.22), vignetteColor ('60,40,20'),
   * edgeDarken (0: aged edges, 0..0.5), foxing (0: brown age spots count).
   * Examples: parchment '#efe0bd' blotches 40 foxing 30 · plaster '#e8d6b0' grain .08 ·
   * newsprint '#e9e4d6' fibers · blueprint '#1f4e8c' grain .04 vignette .3.
   */
  function paper(key, w, h, o = {}) {
    return bake(`${key}_paper_v1`, w, h, (g, rng) => {
      g.fillStyle = o.color || '#efe6d2';
      g.fillRect(0, 0, w, h);
      const nb = o.blotches ?? 24;
      const bc = o.blotchColor || 'rgba(120,90,50,0.06)';
      for (let i = 0; i < nb; i++) {
        const x = rng() * w;
        const y = rng() * h;
        const r = (0.04 + 0.16 * rng()) * Math.max(w, h);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, bc);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
      if (o.fibers !== false) {
        g.save();
        g.globalAlpha = 0.07;
        g.strokeStyle = '#5a4630';
        g.lineWidth = 0.6;
        const nf = Math.round((w * h) / 9000);
        for (let i = 0; i < nf; i++) {
          const x = rng() * w;
          const y = rng() * h;
          const a = rng() * TAU;
          const l = 4 + 14 * rng();
          g.beginPath();
          g.moveTo(x, y);
          g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
          g.stroke();
        }
        g.restore();
      }
      const fox = o.foxing || 0;
      for (let i = 0; i < fox; i++) {
        const x = rng() * w;
        const y = rng() * h;
        const r = 1.5 + 5 * rng() * rng();
        g.fillStyle = `rgba(140,90,40,${0.08 + 0.12 * rng()})`;
        g.beginPath();
        g.arc(x, y, r, 0, TAU);
        g.fill();
      }
      grainInPlace(g, w, h, rng, o.grain ?? 0.05);
      const vg = o.vignette ?? 0.22;
      if (vg > 0) {
        const vc = o.vignetteColor || '60,40,20';
        const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.55);
        gr.addColorStop(0, `rgba(${vc},0)`);
        gr.addColorStop(1, `rgba(${vc},${vg})`);
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
      }
      const ed = o.edgeDarken || 0;
      if (ed > 0) {
        g.save();
        g.strokeStyle = `rgba(90,60,30,${ed})`;
        for (let k = 0; k < 6; k++) {
          g.lineWidth = 2 + k * 3;
          g.globalAlpha = 0.35 / (k + 1);
          g.strokeRect(0, 0, w, h);
        }
        g.restore();
      }
    });
  }

  /** Mono grain over existing pixels (bake time only). */
  function grainInPlace(g, w, h, rng, amount) {
    if (!(amount > 0)) return;
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rng() - 0.5) * 2 * amount * 255;
      d[i] = clamp(d[i] + n, 0, 255);
      d[i + 1] = clamp(d[i + 1] + n, 0, 255);
      d[i + 2] = clamp(d[i + 2] + n, 0, 255);
    }
    g.putImageData(img, 0, 0);
  }

  // ---------------------------------------------------------------- halftone / dots
  /**
   * Flat halftone fill as a CanvasPattern: ctx.fillStyle = kit.dots(ctx, {cell: 10, r: 3, color}).
   * o: cell (10 px), r (dot radius, cell*0.3), color ('#000'), angle (0.26 rad; screen angle),
   * bg (transparent). Patterns are cached per option set.
   */
  const patternTiles = new Map();
  function dots(ctx, o = {}) {
    const cell = Math.max(2, Math.round(o.cell || 10));
    const r = o.r ?? cell * 0.3;
    const color = o.color || '#000';
    const key = `${cell}_${r}_${color}_${o.bg || ''}`;
    let tile = patternTiles.get(key);
    if (!tile) {
      // two dots per tile (a rotated-looking screen with a 45-degree offset row)
      tile = createCanvas(cell * 2, cell * 2);
      const g = tile.getContext('2d');
      if (o.bg) {
        g.fillStyle = o.bg;
        g.fillRect(0, 0, cell * 2, cell * 2);
      }
      g.fillStyle = color;
      for (const [x, y] of [[0.5, 0.5], [1.5, 1.5], [1.5, 0.5], [0.5, 1.5]].slice(0, o.square ? 4 : 2)) {
        g.beginPath();
        g.arc(x * cell, y * cell, r, 0, TAU);
        g.fill();
      }
      patternTiles.set(key, tile);
    }
    const pat = ctx.createPattern(tile, 'repeat');
    const a = o.angle ?? 0.26;
    if (a && pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().rotate((a * 180) / Math.PI));
    return pat;
  }

  /**
   * Halftone dots whose radius follows a tone (bake time). tone(u, v) -> 0..1 over the rect
   * (u, v in 0..1; default: a vertical gradient dark at the top). o: cell (9), color, angle
   * (0.26), maxR (cell*0.62), clipFn(g) to restrict to a shape. Typical: poster sky, sun, shading.
   */
  function halftoneShade(g, x, y, w, h, o = {}) {
    const cell = o.cell || 9;
    const maxR = o.maxR ?? cell * 0.62;
    const a = o.angle ?? 0.26;
    const tone = o.tone || ((u, v) => 1 - v);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    g.save();
    if (o.clipFn) {
      g.beginPath();
      o.clipFn(g);
      g.clip();
    }
    g.fillStyle = o.color || '#000';
    const cx = x + w / 2;
    const cy = y + h / 2;
    const R = Math.hypot(w, h) / 2 + cell;
    for (let j = -R; j <= R; j += cell) {
      for (let i = -R; i <= R; i += cell) {
        const px = cx + i * ca - j * sa;
        const py = cy + i * sa + j * ca;
        if (px < x - cell || px > x + w + cell || py < y - cell || py > y + h + cell) continue;
        const t = clamp(tone((px - x) / w, (py - y) / h), 0, 1);
        const r = maxR * Math.sqrt(t);
        if (r < 0.35) continue;
        g.beginPath();
        g.arc(px, py, r, 0, TAU);
        g.fill();
      }
    }
    g.restore();
  }

  /** Random stipple dots (bake time). o: density (dots per 1000 px², 6), r ([0.5, 1.6]), color, seed, tone(u,v). */
  function stipple(g, x, y, w, h, o = {}) {
    const rng = makePRNG(hashSeed(o.seed ?? `${x},${y},${w},${h}`));
    const n = Math.round(((o.density ?? 6) * w * h) / 1000);
    const [r0, r1] = o.r || [0.5, 1.6];
    const tone = o.tone || null;
    g.save();
    g.fillStyle = o.color || '#000';
    for (let i = 0; i < n; i++) {
      const u = rng();
      const v = rng();
      if (tone && rng() > tone(u, v)) continue;
      g.beginPath();
      g.arc(x + u * w, y + v * h, r0 + (r1 - r0) * rng(), 0, TAU);
      g.fill();
    }
    g.restore();
  }

  // ---------------------------------------------------------------- hatching
  /**
   * Parallel hatching over a rect, clipped by the caller's current clip (ctx.clip()) or by
   * o.clipFn(g). o: x, y, w, h (whole canvas), spacing (6), angle (-0.8 rad), color ('#1b1a18'),
   * width (1), cross (false: adds a second set at angle + 1.1), wobble (0.6 px), seed,
   * taper (0: lines thin toward one end, 0..1). Per frame is fine for a few hundred lines.
   */
  function hatch(g, o = {}) {
    const x = o.x ?? 0;
    const y = o.y ?? 0;
    const w = o.w ?? g.canvas.width;
    const h = o.h ?? g.canvas.height;
    const sp = o.spacing || 6;
    const sets = o.cross ? [o.angle ?? -0.8, (o.angle ?? -0.8) + 1.1] : [o.angle ?? -0.8];
    const wob = o.wobble ?? 0.6;
    const seed = hashSeed(o.seed ?? 'hatch');
    g.save();
    if (o.clipFn) {
      g.beginPath();
      o.clipFn(g);
      g.clip();
    }
    g.strokeStyle = o.color || '#1b1a18';
    g.lineCap = 'round';
    const cx = x + w / 2;
    const cy = y + h / 2;
    const R = Math.hypot(w, h) / 2;
    sets.forEach((a, si) => {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      let k = 0;
      for (let d = -R; d <= R; d += sp, k++) {
        const jx = (hash11(seed * 0.001 + k * 1.37 + si * 9.1) - 0.5) * 2 * wob;
        const ox = cx - sa * (d + jx);
        const oy = cy + ca * (d + jx);
        g.lineWidth = (o.width || 1) * (1 - (o.taper || 0) * hash11(k * 2.1 + si));
        g.beginPath();
        g.moveTo(ox - ca * R, oy - sa * R);
        g.lineTo(ox + ca * R, oy + sa * R);
        g.stroke();
      }
    });
    g.restore();
  }

  // ---------------------------------------------------------------- watercolour wash
  /**
   * Watercolour / ink-wash blot filling roughly the rect (bake time). Several translucent
   * layers with fbm-jittered edges, pigment pooling at the rim, optional granulation.
   * o: alpha (0.28 per layer), layers (4), seed, rough (0.18: edge jitter as a fraction of size),
   * rim (0.35: darker edge strength), granulate (0.5), shape ('ellipse' | 'rect' | 'ridge': a
   * mountain range across the rect, fading toward its base; peaks (3)).
   */
  function wash(g, x, y, w, h, color, o = {}) {
    const { r, g: gg, b } = toRgb(color);
    const seed = hashSeed(o.seed ?? `${x},${y},${w},${h},${color}`);
    const rng = makePRNG(seed);
    const layers = o.layers ?? 4;
    const alpha = o.alpha ?? 0.28;
    const rough = o.rough ?? 0.18;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const isRect = o.shape === 'rect';
    if (o.shape === 'ridge') {
      // mountain range: ragged ridge line on top, pigment fading toward the base
      const peaks = o.peaks ?? 3;
      g.save();
      for (let k = 0; k < layers; k++) {
        const grd = g.createLinearGradient(0, y, 0, y + h);
        grd.addColorStop(0, `rgba(${r},${gg},${b},${alpha * (0.75 + 0.4 * rng())})`);
        grd.addColorStop(0.55, `rgba(${r},${gg},${b},${alpha * 0.45})`);
        grd.addColorStop(1, `rgba(${r},${gg},${b},0)`);
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(x, y + h);
        const off = rng() * 10;
        for (let i = 0; i <= 120; i++) {
          const u = i / 120;
          const ridge = 0.5 + 0.5 * Math.sin(u * Math.PI * peaks + off) * (0.6 + 0.4 * fbm2(u * 3 + off, k, 3, seed % 17));
          const jag = (fbm2(u * 24 + k, off, 3, seed % 29) - 0.5) * (o.rough ?? 0.18) * 0.6;
          g.lineTo(x + u * w, y + h * (0.05 + 0.85 * (1 - ridge) + jag + 0.04 * k));
        }
        g.lineTo(x + w, y + h);
        g.closePath();
        g.fill();
      }
      g.restore();
      return;
    }
    const N = 72;
    const outline = (k, shrink) => {
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU;
        const n = fbm2(Math.cos(a) * 1.3 + k * 3.1, Math.sin(a) * 1.3 + (seed % 97), 3, seed % 13);
        const j = 1 - shrink + (n - 0.5) * 2 * rough;
        let ex = Math.cos(a);
        let ey = Math.sin(a);
        if (isRect) {
          const m = Math.max(Math.abs(ex), Math.abs(ey));
          ex /= m;
          ey /= m;
        }
        pts.push([cx + (ex * w * j) / 2, cy + (ey * h * j) / 2]);
      }
      return pts;
    };
    g.save();
    for (let k = 0; k < layers; k++) {
      const pts = outline(k, 0.04 * k + 0.02 * rng());
      g.beginPath();
      pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
      g.closePath();
      g.fillStyle = `rgba(${r},${gg},${b},${alpha * (0.7 + 0.5 * rng())})`;
      g.fill();
      if ((o.rim ?? 0.35) > 0 && k === 0) {
        g.strokeStyle = `rgba(${Math.round(r * 0.7)},${Math.round(gg * 0.7)},${Math.round(b * 0.7)},${(o.rim ?? 0.35) * 0.5})`;
        g.lineWidth = Math.max(1, Math.min(w, h) * 0.012);
        g.stroke();
      }
    }
    const gran = o.granulate ?? 0.5;
    if (gran > 0) {
      g.beginPath();
      outline(0, 0.03).forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
      g.closePath();
      g.clip();
      const n = Math.round((w * h * gran) / 260);
      g.fillStyle = `rgba(${Math.round(r * 0.6)},${Math.round(gg * 0.6)},${Math.round(b * 0.6)},0.12)`;
      for (let i = 0; i < n; i++) g.fillRect(x + rng() * w, y + rng() * h, 1 + rng() * 1.5, 1 + rng() * 1.5);
    }
    g.restore();
  }

  // ---------------------------------------------------------------- ink line
  /**
   * A tapered brush / pen stroke through points [{x,y}] or [[x,y]] (per frame OK, < 200 points).
   * o: width (4), color ('#1b1a18'), taper (true: thin at both ends; 'start' | 'end'),
   * pressure (0.35: noise variation of width), seed, alpha (1), smooth (true: quadratic through
   * midpoints).
   */
  function inkLine(ctx, ptsIn, o = {}) {
    const pts = ptsIn.map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : p));
    if (pts.length < 2) return;
    const w0 = o.width ?? 4;
    const pr = o.pressure ?? 0.35;
    const seed = (hashSeed(o.seed ?? 'ink') % 1000) * 0.37;
    const taper = o.taper ?? true;
    const n = pts.length;
    const left = [];
    const right = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      const u = i / (n - 1);
      let tw = 1;
      if (taper === true) tw = Math.sin(Math.PI * clamp(u, 0.04, 0.96)) ** 0.6;
      else if (taper === 'start') tw = Math.min(1, u * 4 + 0.1);
      else if (taper === 'end') tw = Math.min(1, (1 - u) * 4 + 0.1);
      const wv = (w0 / 2) * tw * (1 - pr + 2 * pr * noise1(u * 6 + seed));
      left.push({ x: pts[i].x - dy * wv, y: pts[i].y + dx * wv });
      right.push({ x: pts[i].x + dy * wv, y: pts[i].y - dx * wv });
    }
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.fillStyle = o.color || '#1b1a18';
    ctx.beginPath();
    const ring = [...left, ...right.reverse()];
    ctx.moveTo(ring[0].x, ring[0].y);
    if (o.smooth === false) for (const p of ring) ctx.lineTo(p.x, p.y);
    else
      for (let i = 1; i < ring.length; i++) {
        const p = ring[i];
        const q = ring[(i + 1) % ring.length];
        ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
      }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- relief / print
  /**
   * Relief (clay, stone, coin, embossed card): pathFn(ctx) builds a path; it is filled dark at
   * +depth, light at -depth, then with `fill`. o: fill, light ('rgba(255,250,235,0.55)'),
   * dark ('rgba(40,25,10,0.45)'), depth (2).
   */
  function emboss(ctx, pathFn, o = {}) {
    const d = o.depth ?? 2;
    ctx.save();
    for (const [dx, col] of [[d, o.dark || 'rgba(40,25,10,0.45)'], [-d, o.light || 'rgba(255,250,235,0.55)']]) {
      ctx.save();
      ctx.translate(dx, dx);
      ctx.beginPath();
      pathFn(ctx);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    pathFn(ctx);
    ctx.fillStyle = o.fill || '#c9b48a';
    ctx.fill();
    ctx.restore();
  }

  /**
   * Screen-print misregistration: drawFn(ctx, color, layerIndex) is called once per ink, each
   * layer shifted by o.offsets[i] (default [[3,-2],[0,0]]) and composited with 'multiply'.
   * o: colors (['#2a6f97', '#e85d2a']), offsets.
   */
  function misregister(ctx, drawFn, o = {}) {
    const colors = o.colors || ['#2a6f97', '#e85d2a'];
    const offs = o.offsets || [[3, -2], [0, 0], [-2, 2]];
    colors.forEach((c, i) => {
      ctx.save();
      const [dx, dy] = offs[i] || [0, 0];
      ctx.translate(dx, dy);
      if (i > 0) ctx.globalCompositeOperation = 'multiply';
      drawFn(ctx, c, i);
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- light
  /** Soft additive glow (neon, lamp, screen): baked radial sprite, 'lighter' blend. */
  function glow(ctx, x, y, r, color = '#ffd166', a = 1) {
    const spr = bake(`glow_${color}`, 128, 128, (g) => {
      const { r: R, g: G, b: B } = toRgb(color);
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, `rgba(${R},${G},${B},1)`);
      gr.addColorStop(0.25, `rgba(${R},${G},${B},0.45)`);
      gr.addColorStop(1, `rgba(${R},${G},${B},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha *= a;
    ctx.drawImage(spr, x - r, y - r, 2 * r, 2 * r);
    ctx.restore();
  }

  // ---------------------------------------------------------------- screens
  /**
   * CRT scan lines over (0,0,w,h): baked line image. o: gap (3 px), alpha (0.22), color ('0,0,0'),
   * roll (0: a brighter band rolling down, pass T), T.
   */
  function scanlines(ctx, w, h, o = {}) {
    const gap = o.gap || 3;
    const img = bake(`scan_${gap}_${o.alpha ?? 0.22}_${o.color || '0,0,0'}`, w, h, (g) => {
      g.fillStyle = `rgba(${o.color || '0,0,0'},${o.alpha ?? 0.22})`;
      for (let y = 0; y < h; y += gap) g.fillRect(0, y, w, Math.max(1, gap / 2.5));
    });
    ctx.drawImage(img, 0, 0);
    if (o.roll) {
      const T = o.T || 0;
      const y = ((T * o.roll * 120) % (h + 200)) - 100;
      const gr = ctx.createLinearGradient(0, y - 60, 0, y + 60);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, y - 60, w, 120);
    }
  }

  /**
   * Screen look over (0,0,w,h) at time T: scanlines, phosphor vignette, subtle flicker.
   * o: tint ('#39ff88' phosphor glow at the centre, null = none), vignette (0.55), flicker (0.03),
   * gap (3), roll (0.4).
   */
  function crt(ctx, w, h, T, o = {}) {
    // one baked layer (tint + scan lines + vignette) -> a single full-frame blit per frame
    const gap = o.gap || 3;
    const vg = o.vignette ?? 0.55;
    const layer = bake(`crt_${o.tint || 'none'}_${gap}_${vg}`, w, h, (g) => {
      if (o.tint) {
        const { r, g: G, b } = toRgb(o.tint);
        const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
        gr.addColorStop(0, `rgba(${r},${G},${b},0.07)`);
        gr.addColorStop(1, `rgba(${r},${G},${b},0)`);
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
      }
      g.fillStyle = 'rgba(0,0,0,0.2)';
      for (let y = 0; y < h; y += gap) g.fillRect(0, y, w, Math.max(1, gap / 2.5));
      const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.55);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, `rgba(0,0,0,${vg})`);
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    });
    ctx.save();
    // flicker = the dark layer breathing a little
    ctx.globalAlpha *= 1 - (o.flicker ?? 0.06) * noise1(T * 17, 3);
    ctx.drawImage(layer, 0, 0);
    ctx.globalAlpha = 1;
    const roll = o.roll ?? 0.4;
    if (roll) {
      const y = ((((T * roll * 120) % (h + 200)) + h + 200) % (h + 200)) - 100;
      const gr = ctx.createLinearGradient(0, y - 60, 0, y + 60);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, y - 60, w, 120);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- film
  /** Gate weave offset for black-and-white film at time T: translate by it before drawing. */
  function gateWeave(T, amp = 1.6) {
    const q = quantizeTime(T, 12);
    // whole pixels: a sub-pixel offset makes every full-frame blit resample (~6 ms at 1080p)
    return { dx: Math.round((noise1(q * 3.1, 11) - 0.5) * 2 * amp), dy: Math.round((noise1(q * 2.3, 29) - 0.5) * 2 * amp) };
  }

  /**
   * Newsreel / silent-film overlay over (0,0,w,h) at time T (draw it LAST): one of n baked grain
   * frames at 12 fps, flicker, vertical scratches and dust that change per frame, a burnt
   * vignette. o: frames (6), grain (0.16), flicker (0.08), scratches (2), dust (6), vignette (0.6),
   * sepia (false: warm tone).
   */
  function filmLook(ctx, w, h, T, o = {}) {
    // grain: one of n small baked tiles used as a pattern at a per-frame integer offset;
    // vignette: one full-size bake blitted unscaled (scaled or sub-pixel full-frame blits are slow)
    const n = o.frames || 6;
    const frame = Math.floor(quantizeTime(T, 12) * 12 + 1e6);
    const fi = frame % n;
    const tile = bake(`film_grain_${fi}_${o.grain ?? 0.16}`, 256, 256, (g, rng) => {
      const img = g.createImageData(256, 256);
      const d = img.data;
      const amt = (o.grain ?? 0.16) * 255;
      for (let i = 0; i < d.length; i += 4) {
        const v = rng();
        d[i] = d[i + 1] = d[i + 2] = v > 0.5 ? 255 : 0;
        d[i + 3] = Math.abs(v - 0.5) * 2 * amt;
      }
      g.putImageData(img, 0, 0);
    });
    const vg = o.vignette ?? 0.6;
    const vig = bake(`film_vig_${vg}_${o.sepia ? 1 : 0}`, w, h, (g) => {
      const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) * 0.56);
      const c = o.sepia ? '40,22,8' : '0,0,0';
      gr.addColorStop(0, `rgba(${c},0)`);
      gr.addColorStop(1, `rgba(${c},${vg})`);
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
      if (o.sepia) {
        g.fillStyle = 'rgba(120,80,30,0.12)';
        g.fillRect(0, 0, w, h);
      }
    });
    ctx.save();
    const ox = Math.floor(hash11(frame * 0.37) * 256);
    const oy = Math.floor(hash11(frame * 0.71) * 256);
    ctx.translate(-ox, -oy);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, w + ox, h + oy);
    ctx.translate(ox, oy);
    const fl = (o.flicker ?? 0.08) * (noise1(T * 9, 7) - 0.3);
    ctx.globalAlpha *= clamp(1 + fl * 4, 0.55, 1.3);
    ctx.drawImage(vig, 0, 0);
    ctx.globalAlpha = 1;
    // scratches (thin bright/dark verticals that jump per frame)
    const ns = o.scratches ?? 2;
    for (let k = 0; k < ns; k++) {
      const hsh = hash11(frame * 1.7 + k * 13.3);
      if (hsh < 0.45) continue;
      const x = hash11(frame * 3.1 + k * 7.7) * w;
      ctx.fillStyle = hsh > 0.75 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, 0, 1 + (hsh > 0.9 ? 1 : 0), h);
    }
    // dust specks
    const nd = o.dust ?? 6;
    ctx.fillStyle = 'rgba(10,10,10,0.55)';
    for (let k = 0; k < nd; k++) {
      if (hash11(frame * 5.3 + k * 2.9) < 0.5) continue;
      const x = hash11(frame * 1.3 + k * 17.1) * w;
      const y = hash11(frame * 2.7 + k * 5.3) * h;
      ctx.beginPath();
      ctx.ellipse(x, y, 1 + 3 * hash11(k + frame), 1 + 2 * hash11(k * 3 + frame), hash11(k) * 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- pixel art
  /**
   * Pixel art: drawFn(g) draws in the normal coordinates of a w x h area; it is rendered into a
   * (w/cell x h/cell) canvas and blitted back with hard pixels at (0,0). Use palette colours and
   * quantise motion with kit.quantizeTime(T, 8). The small canvas is reused per key.
   */
  const pixCanvases = new Map();
  function pixelate(ctx, key, w, h, cell, drawFn) {
    const sw = Math.max(1, Math.round(w / cell));
    const sh = Math.max(1, Math.round(h / cell));
    const k = `${key}@${sw}x${sh}`;
    let c = pixCanvases.get(k);
    if (!c) {
      c = createCanvas(sw, sh);
      pixCanvases.set(k, c);
    }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, sw, sh);
    g.imageSmoothingEnabled = false;
    g.setTransform(sw / w, 0, 0, sh / h, 0, 0);
    drawFn(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, 0, 0, w, h);
    ctx.restore();
  }

  return { paper, dots, halftoneShade, stipple, hatch, wash, inkLine, emboss, misregister, glow, scanlines, crt, gateWeave, filmLook, pixelate };
}
