// src/characters/person.js
// Character "person": a generic, stylised human (no likeness of any real or fictional
// character). Configurable skin / hair / clothes / hat / scarf colours; deterministic
// secondary motion (breathing, hair, scarf tails, coat hem in the wind).
//
// Actions
//   'cycle'  profile view riding the shared bicycle (geometry from spoonbill.js's bicycle,
//            analytic 2-bone IK legs on the pedals, arms on the bar, prop on a rear pole).
//            Used by the gallery-ride stage; same size as the spoonbill rider (~230 px).
//   'paint'  3/4 rear view standing at an easel (easel stage): long-handled brush in the
//            right hand (IK to a brush-tip target, the torso leans when the target is far),
//            watercolour palette in the left hand, head can glance aside, optional walk.
//   'stand'  = 'paint' with the brush lowered (outro).
//
// computeRig(a) is PURE. Common args: { action, x, y (ground), scale, time, slope }.
//   cycle: { phase (crank rad), speedScale, worldX, propAngle }
//   paint: { brush: {x, y} brush-tip target (absolute px), lift (0..1 brush off the paper),
//            look (-1..1: -1 glance left, +1 glance right toward the valley), nod (0..1 beat pulse),
//            walk: { phase, amount } (feet stepping), lean (extra lean, rad), wind (0..1.5),
//            brushLen (scale-1 px, default 62), paletteHand: {x, y} (optional absolute) }
// draw(ctx, rig, style): style keys in DEFAULT_PERSON_STYLE (+ prop / showProp / silhouette / wire).

import { computeRiderRig as bicycleRig, solveTwoBoneIK } from './spoonbill.js';
import { drawProp } from '../kit/props.js';

const TAU = Math.PI * 2;

export const DEFAULT_PERSON_STYLE = {
  skin: '#e8b58f',
  skinShade: '#c98f6a',
  hair: '#3a2a22',
  hairStyle: 'bob', // 'bob' | 'short' | 'bun' | 'ponytail'
  top: '#47708c', // smock / jacket
  topShade: '#36586f',
  trousers: '#4b4339',
  shoes: '#2b221c',
  hat: 'beret', // 'beret' | 'straw' | 'cap' | 'none'
  hatColor: '#b8473a', // when not given, HAT_COLORS[hat] is used (straw is straw-coloured)
  hatBand: '#2b2620',
  scarf: true,
  scarfColor: '#e9c46a',
  scarfStripe: '#c8553d',
  paletteWood: '#d8b588',
  brushHandle: '#7a4f2e',
  brushPaint: '#3d6b8c', // pigment on the brush tip (the stage passes the current colour)
  paints: ['#3d6b8c', '#c8553d', '#e9c46a', '#5b8c5a', '#8a5a3b'], // dabs on the palette
  // bicycle (same keys as the spoonbill)
  frame: '#2f6f8f',
  frameShade: '#245873',
  metal: '#3b3935',
  tire: '#1f1e1c',
  rim: '#c9c3b5',
  saddle: '#3a2a20',
  spokes: 12,
  outline: '#2a231d',
  outlineWidth: 1.5,
  lineScale: 1,
  silhouette: null,
  wire: null,
  showProp: true,
  prop: null,
};

// -----------------------------------------------------------------------------
// small helpers
// -----------------------------------------------------------------------------
const lerpP = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

function parseHex(hex) {
  if (!hex || hex[0] !== '#') return null;
  const h = hex.slice(1);
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function shade(hex, amt) {
  // amt > 0 lighten towards white, < 0 darken
  const c = parseHex(hex);
  if (!c) return hex;
  const f = (v) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return `rgb(${f(c.r)},${f(c.g)},${f(c.b)})`;
}
function rgbaHex(hex, a) {
  const c = parseHex(hex);
  if (!c) return hex;
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

/** Deterministic flutter signal in [-1, 1] (sum of incommensurate sines). */
function flutter(t, k = 0) {
  return 0.55 * Math.sin(t * 7.3 + k * 1.7) + 0.3 * Math.sin(t * 12.1 + k * 2.9) + 0.15 * Math.sin(t * 19.7 + k * 0.6);
}

// -----------------------------------------------------------------------------
// CYCLE rig (profile, facing +x)
// -----------------------------------------------------------------------------
function computeCycleRig(a) {
  const x = a.x ?? 500;
  const y = a.y ?? 700;
  const scale = a.scale || 1;
  const slope = a.slope || 0;
  const time = a.time || 0;
  const phase = a.phase ?? a.pedalAngle ?? 0;
  const amp = clamp(a.speedScale ?? 1, 0.1, 1.2);
  // bicycle geometry from the shared bike (spoonbill.js); we only use its bike points
  const bike = bicycleRig({ x: 0, y: 0, pedalAngle: phase, slope: 0, scale: 1, speedScale: amp, time, worldX: (a.worldX ?? x) - x, pinwheelAngle: a.propAngle ?? null });
  const bob = -2.2 * Math.sin(2 * phase) * amp;
  const fl = flutter(time) * amp;

  const hip = { x: -30, y: -121 + bob };
  const shoulder = { x: 6, y: -181 + bob * 0.8 };
  const neck = { x: 12, y: -188 + bob * 0.8 };
  const head = { x: 21, y: -207 + bob * 0.7, r: 15 };
  const nearHip = { x: hip.x + 3, y: hip.y + 2 };
  const farHip = { x: hip.x - 2, y: hip.y + 2 };
  const nearFoot = { x: bike.nearPedal.x + 2, y: bike.nearPedal.y - 4 };
  const farFoot = { x: bike.farPedal.x + 2, y: bike.farPedal.y - 4 };
  const nearKnee = solveTwoBoneIK(nearHip.x, nearHip.y, nearFoot.x, nearFoot.y, 51, 52, -1);
  const farKnee = solveTwoBoneIK(farHip.x, farHip.y, farFoot.x, farFoot.y, 51, 52, -1);
  const grip = { x: bike.grip.x + 2, y: bike.grip.y - 2 };
  const nearShoulder = { x: shoulder.x + 1, y: shoulder.y + 3 };
  const farShoulder = { x: shoulder.x - 3, y: shoulder.y + 2 };
  const nearElbow = solveTwoBoneIK(nearShoulder.x, nearShoulder.y, grip.x, grip.y, 36, 36, 1);
  const farElbow = solveTwoBoneIK(farShoulder.x, farShoulder.y, grip.x - 3, grip.y + 1, 36, 36, 1);
  // scarf tails stream back (wind from the front)
  const scarfRoot = { x: neck.x - 8, y: neck.y + 3 };
  const tail1 = { x: scarfRoot.x - 44, y: scarfRoot.y + 4 + 6 * fl };
  const tail1m = { x: scarfRoot.x - 22, y: scarfRoot.y - 3 - 4 * flutter(time, 2) * amp };
  const tail2 = { x: scarfRoot.x - 36, y: scarfRoot.y + 14 + 5 * flutter(time, 5) * amp };
  const hairTip = { x: head.x - 24, y: head.y + 6 + 3 * fl };

  const c = Math.cos(slope) * scale;
  const s = Math.sin(slope) * scale;
  const xf = (p) => ({ x: x + p.x * c - p.y * s, y: y + p.x * s + p.y * c });
  const out = { action: 'cycle', root: { x, y, scale, slope }, time, pedalAngle: phase, wheelAngle: bike.wheelAngle, pinwheelAngle: bike.pinwheelAngle };
  for (const k of ['rearWheel', 'frontWheel']) out[k] = { ...xf(bike[k]), r: bike[k].r * scale };
  for (const k of ['bb', 'nearPedal', 'farPedal', 'seatCluster', 'saddle', 'headTop', 'headBot', 'stemTop', 'grip', 'poleBase', 'poleTop']) out[k] = xf(bike[k]);
  out.crankR = bike.crankR * scale;
  const pts = { hip, shoulder, neck, nearHip, farHip, nearFoot, farFoot, nearKnee, farKnee, nearShoulder, farShoulder, nearElbow, farElbow, scarfRoot, tail1, tail1m, tail2, hairTip };
  for (const k in pts) out[k] = xf(pts[k]);
  out.hand = xf(grip);
  out.farHand = xf({ x: grip.x - 3, y: grip.y + 1 });
  out.head = { ...xf(head), r: head.r * scale, angle: slope + 0.05 * Math.sin(2 * phase - 0.4) * amp };
  out.propHub = { ...xf(bike.pinHub), r: 24 * scale };
  out.pinHub = out.propHub;
  return out;
}

// -----------------------------------------------------------------------------
// PAINT rig (3/4 rear view, painter faces into the picture, canvas to the right)
// -----------------------------------------------------------------------------
function computePaintRig(a) {
  const x = a.x ?? 300;
  const y = a.y ?? 760;
  const S = a.scale || 1;
  const time = a.time || 0;
  const wind = a.wind ?? 1;
  const look = clamp(a.look ?? 0, -1, 1);
  const nod = a.nod ?? 0;
  const walk = a.walk || { phase: 0, amount: 0 };
  const breath = Math.sin(time * 1.9) * 1.2;
  const brushLen = (a.brushLen ?? 62) * S;
  const L1 = 56 * S;
  const L2 = 54 * S;

  // feet + walk (feet lift alternately; the pelvis bobs and sways)
  const wp = walk.phase || 0;
  const wa = clamp(walk.amount || 0, 0, 1);
  const liftL = Math.max(0, Math.sin(wp)) * 10 * wa;
  const liftR = Math.max(0, -Math.sin(wp)) * 10 * wa;
  const sway = Math.sin(wp) * 3 * wa;
  const footL = { x: -15, y: -liftL };
  const footR = { x: 15, y: -liftR };
  const pelvis = { x: sway, y: -120 + breath * 0.2 - Math.abs(Math.cos(wp)) * 2 * wa };

  // torso lean: lean toward the brush target when it is out of reach
  let lean = a.lean || 0;
  const torsoLen = 74;
  const shoulderOff = 25;
  const tgt = a.brush ? { x: (a.brush.x - x) / S, y: (a.brush.y - y) / S } : null;
  const shoulderAt = (ln) => {
    const cx = pelvis.x + Math.sin(ln) * torsoLen;
    const cy = pelvis.y - Math.cos(ln) * torsoLen;
    return { x: cx + Math.cos(ln) * shoulderOff, y: cy + Math.sin(ln) * shoulderOff, cx, cy };
  };
  if (tgt) {
    const reach = (L1 + L2 + brushLen * 0.92) / S;
    for (let it = 0; it < 3; it++) {
      const sh = shoulderAt(lean);
      const d = Math.hypot(tgt.x - sh.x, tgt.y - sh.y);
      const need = d - reach;
      if (need > 0) lean = clamp(lean + (need / torsoLen) * Math.sign(tgt.x - sh.x || 1) * 0.9, -0.15, 0.42);
    }
    lean = clamp(lean, -0.15, 0.42);
  }
  lean += 0.012 * Math.sin(time * 0.9);
  const chestC = shoulderAt(lean);
  const neckBase = { x: chestC.cx + Math.sin(lean) * 8, y: chestC.cy - Math.cos(lean) * 8 + breath * 0.15 };
  const shR = { x: chestC.x, y: chestC.y + breath * 0.2 };
  const shL = { x: chestC.cx - Math.cos(lean) * shoulderOff, y: chestC.cy - Math.sin(lean) * shoulderOff + breath * 0.2 };
  const headTilt = lean * 0.6 + look * 0.12 - nod * 0.05;
  const head = {
    x: neckBase.x + Math.sin(lean * 0.8) * 22 + look * 3,
    y: neckBase.y - 22 + nod * 2.2,
    r: 17,
    angle: headTilt,
    look,
  };

  // hips and knees (nearly straight; slight bend; feet planted)
  const hipL = { x: pelvis.x - 11, y: pelvis.y + 2 };
  const hipR = { x: pelvis.x + 11, y: pelvis.y + 2 };
  const kneeL = solveTwoBoneIK(hipL.x, hipL.y, footL.x, footL.y - 7, 56, 56, 1);
  const kneeR = solveTwoBoneIK(hipR.x, hipR.y, footR.x, footR.y - 7, 56, 56, -1);

  // right (brush) arm: the hand sits on the intersection of a circle around the shoulder
  // (comfortable reach, straightening when the target is far) and a circle of brush length
  // around the tip, on the side that makes the brush point the preferred way (up-right on the
  // paper, down into a jar)
  let handR;
  let tip;
  let brushDir;
  const Lsum = (L1 + L2) / S;
  const bl = brushLen / S;
  if (tgt) {
    const lift = clamp(a.lift ?? 0, 0, 1);
    const sh = shR;
    const ang0 = Math.atan2(tgt.y - sh.y, tgt.x - sh.x);
    tip = { x: tgt.x - Math.cos(ang0) * lift * 12, y: tgt.y - Math.sin(ang0) * lift * 12 - lift * 5 };
    const dx = tip.x - sh.x;
    const dy = tip.y - sh.y;
    const d = Math.hypot(dx, dy) || 1;
    // a brush pointing into the paper is foreshortened: shorter on screen when the tip is near
    const blE = clamp(d * 0.55, 20, bl);
    if (d > Lsum * 0.995 + blE) {
      // out of reach: arm + brush in one line, the tip falls a little short
      handR = { x: sh.x + (dx / d) * Lsum * 0.995, y: sh.y + (dy / d) * Lsum * 0.995 };
      tip = { x: handR.x + (dx / d) * blE, y: handR.y + (dy / d) * blE };
    } else {
      const dh = clamp(Math.max(0.35 * Lsum, d - blE * 0.85), Math.abs(d - blE) + 0.5, Math.min(Lsum * 0.995, d + blE - 0.5));
      const aa = (dh * dh - blE * blE + d * d) / (2 * d);
      const hh = Math.sqrt(Math.max(0, dh * dh - aa * aa));
      const bx = sh.x + (aa * dx) / d;
      const by = sh.y + (aa * dy) / d;
      const pref = a.brushPref ?? Math.atan2(dy, dx) - 0.3;
      let best = null;
      for (const sg of [1, -1]) {
        const H = { x: bx - (sg * hh * dy) / d, y: by + (sg * hh * dx) / d };
        const dir = Math.atan2(tip.y - H.y, tip.x - H.x);
        let diff = Math.abs(dir - pref);
        if (diff > Math.PI) diff = TAU - diff;
        if (!best || diff < best.diff) best = { H, diff };
      }
      handR = best.H;
    }
    brushDir = Math.atan2(tip.y - handR.y, tip.x - handR.x);
  } else {
    // brush lowered at the side
    handR = { x: shR.x + 10, y: shR.y + 84 };
    brushDir = 1.25;
    tip = { x: handR.x + Math.cos(brushDir) * bl, y: handR.y + Math.sin(brushDir) * bl };
  }
  const elbowR = solveTwoBoneIK(shR.x, shR.y, handR.x, handR.y, L1 / S, L2 / S, handR.y < shR.y - 10 ? -1 : 1);

  // left arm holds the palette in front-left of the body
  const handL = a.paletteHand ? { x: (a.paletteHand.x - x) / S, y: (a.paletteHand.y - y) / S } : { x: shL.x - 26, y: pelvis.y - 4 + breath * 0.3 };
  const elbowL = solveTwoBoneIK(shL.x, shL.y, handL.x, handL.y, L1 / S, L2 / S, -1);

  // wind: hair, scarf tails, coat hem (wind blows from the right, up the hill)
  const fl = flutter(time) * wind;
  const fl2 = flutter(time, 3) * wind;
  const scarfRoot = { x: neckBase.x - 4, y: neckBase.y + 6 };
  const tail1 = { x: scarfRoot.x - 16 - 14 * wind - 5 * fl, y: scarfRoot.y + 52 - 6 * wind + 4 * fl2 };
  const tail1m = { x: scarfRoot.x - 4 - 4 * wind, y: scarfRoot.y + 26 };
  const tail2 = { x: scarfRoot.x - 6 - 10 * wind - 4 * fl2, y: scarfRoot.y + 62 - 5 * wind + 3 * fl };
  const hem = 4 * fl2;

  const xf = (p) => ({ x: x + p.x * S, y: y + p.y * S });
  return {
    action: a.action || 'paint',
    root: { x, y, scale: S, slope: 0 },
    time,
    lean,
    footL: xf(footL),
    footR: xf(footR),
    pelvis: xf(pelvis),
    hipL: xf(hipL),
    hipR: xf(hipR),
    kneeL: xf(kneeL),
    kneeR: xf(kneeR),
    neckBase: xf(neckBase),
    shL: xf(shL),
    shR: xf(shR),
    elbowL: xf(elbowL),
    elbowR: xf(elbowR),
    handL: xf(handL),
    handR: xf(handR),
    brushTip: xf(tip),
    brushDir,
    head: { ...xf(head), r: head.r * S, angle: head.angle, look },
    scarfRoot: xf(scarfRoot),
    tail1: xf(tail1),
    tail1m: xf(tail1m),
    tail2: xf(tail2),
    hem: hem * S,
    wind,
    fl,
    propHub: null,
  };
}

// -----------------------------------------------------------------------------
// Drawing
// -----------------------------------------------------------------------------
function makePen(ctx, st, s) {
  const sil = st.silhouette;
  const wire = st.wire;
  const ink = wire || sil || st.outline;
  const lw = (w) => Math.max(0.6, w * s * st.lineScale);
  const col = (c) => sil || c;
  const pen = {
    sil,
    wire,
    ink,
    lw,
    col,
    limb(pts, width, color) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (wire) {
        ctx.strokeStyle = wire;
        ctx.lineWidth = lw(1.4);
        ctx.stroke();
        return;
      }
      if (!sil && st.outlineWidth > 0) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw(width + st.outlineWidth * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = col(color);
      ctx.lineWidth = lw(width);
      ctx.stroke();
    },
    fillStroke(fill) {
      if (!wire) {
        ctx.fillStyle = col(fill);
        ctx.fill();
      }
      if (wire || (!sil && st.outlineWidth > 0)) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw(wire ? 1.4 : st.outlineWidth);
        ctx.stroke();
      }
    },
    dot(p, r, fill) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      pen.fillStroke(fill);
    },
  };
  return pen;
}

/** Hat on a head at (h.x, h.y, r) seen from `view` ('side' facing +x, or 'rear'). */
function drawHat(ctx, h, st, pen, view) {
  const r = h.r;
  const type = st.hat || 'none';
  if (type === 'none' || !type) return;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle || 0);
  if (type === 'beret') {
    ctx.beginPath();
    if (view === 'rear') ctx.ellipse(r * 0.08, -r * 0.72, r * 1.12, r * 0.5, -0.12, 0, TAU);
    else ctx.ellipse(-r * 0.12, -r * 0.78, r * 1.1, r * 0.46, -0.2, 0, TAU);
    pen.fillStroke(st.hatColor);
    ctx.beginPath();
    ctx.moveTo(view === 'rear' ? r * 0.15 : -r * 0.05, -r * 1.2);
    ctx.lineTo(view === 'rear' ? r * 0.2 : 0, -r * 1.45);
    ctx.strokeStyle = pen.wire || pen.sil || st.outline;
    ctx.lineWidth = pen.lw(2.2);
    ctx.stroke();
  } else if (type === 'straw') {
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 1.9, r * 0.38, view === 'rear' ? 0.04 : -0.1, 0, TAU);
    pen.fillStroke(st.hatColor);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.92, r * 0.92, r * 0.62, 0, Math.PI, TAU);
    ctx.closePath();
    pen.fillStroke(st.hatColor);
    if (!pen.sil && !pen.wire) {
      ctx.fillStyle = st.hatBand;
      ctx.fillRect(-r * 0.92, -r * 0.82, r * 1.84, r * 0.2);
    }
  } else if (type === 'cap') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.25, r * 1.02, Math.PI, TAU);
    ctx.closePath();
    pen.fillStroke(st.hatColor);
    if (view !== 'rear') {
      ctx.beginPath();
      ctx.moveTo(r * 0.6, -r * 0.3);
      ctx.quadraticCurveTo(r * 1.5, -r * 0.35, r * 1.65, -r * 0.12);
      ctx.lineTo(r * 0.7, -r * 0.1);
      ctx.closePath();
      pen.fillStroke(st.hatBand);
    } else if (!pen.sil && !pen.wire) {
      ctx.fillStyle = st.hatBand;
      ctx.fillRect(-r * 0.3, -r * 0.42, r * 0.6, r * 0.16);
    }
  }
  ctx.restore();
}

function drawScarfTails(ctx, rig, st, pen, w) {
  if (!st.scarf) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const r0 = rig.scarfRoot;
  const strip = (tail, mid, width, color) => pen.limb(sampleQuad(r0, mid, tail, 10), width, color);
  strip(rig.tail2, lerpP(r0, rig.tail2, 0.5), w * 0.85, shade(st.scarfColor, -0.12));
  strip(rig.tail1, rig.tail1m, w, st.scarfColor);
  if (!pen.sil && !pen.wire) {
    // stripes near the ends
    const p = sampleQuad(r0, rig.tail1m, rig.tail1, 10);
    ctx.strokeStyle = st.scarfStripe;
    ctx.lineWidth = pen.lw(w * 0.6);
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(p[7].x, p[7].y);
    ctx.lineTo(p[8].x, p[8].y);
    ctx.stroke();
  }
  ctx.restore();
}

function sampleQuad(a, b, c, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const iu = 1 - u;
    out.push({ x: iu * iu * a.x + 2 * iu * u * b.x + u * u * c.x, y: iu * iu * a.y + 2 * iu * u * b.y + u * u * c.y });
  }
  return out;
}

// ---- bicycle (same drawing as the spoonbill's bike) --------------------------
function drawBikeBack(ctx, rig, st, pen, s) {
  // prop on the rear pole
  if (st.showProp !== false && st.prop && st.prop.type !== 'none') {
    ctx.strokeStyle = pen.wire || pen.sil || '#6b4f32';
    ctx.lineWidth = pen.lw(2.4);
    ctx.beginPath();
    ctx.moveTo(rig.poleBase.x, rig.poleBase.y);
    ctx.lineTo(rig.poleTop.x, rig.poleTop.y);
    ctx.stroke();
    drawProp(ctx, rig.propHub, rig.pinwheelAngle, { stroke: st.outline, wire: pen.wire, silhouette: pen.sil, time: rig.time, ...st.prop });
  }
}

function drawCrank(ctx, rig, pedal, st, pen, s) {
  ctx.strokeStyle = pen.wire || pen.sil || st.metal;
  ctx.lineWidth = pen.lw(3.2);
  ctx.beginPath();
  ctx.moveTo(rig.bb.x, rig.bb.y);
  ctx.lineTo(pedal.x, pedal.y);
  ctx.stroke();
  ctx.lineWidth = pen.lw(3.6);
  ctx.beginPath();
  ctx.moveTo(pedal.x - 7 * s, pedal.y + 1.5 * s);
  ctx.lineTo(pedal.x + 7 * s, pedal.y + 1.5 * s);
  ctx.stroke();
}

function drawBikeFrame(ctx, rig, st, pen, s) {
  const { wire, sil } = pen;
  for (const w of [rig.rearWheel, rig.frontWheel]) {
    ctx.strokeStyle = wire || sil || st.metal;
    ctx.lineWidth = pen.lw(1.1);
    const n = st.spokes;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = rig.wheelAngle + (i * TAU) / n;
      ctx.moveTo(w.x, w.y);
      ctx.lineTo(w.x + Math.cos(a) * (w.r - 3 * s), w.y + Math.sin(a) * (w.r - 3 * s));
    }
    ctx.stroke();
    if (!wire && !sil) {
      ctx.strokeStyle = st.rim;
      ctx.lineWidth = pen.lw(2.6);
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r - 3.2 * s, 0, TAU);
      ctx.stroke();
    }
    ctx.strokeStyle = wire || sil || st.tire;
    ctx.lineWidth = pen.lw(wire ? 1.8 : 4.6);
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = pen.ink;
    ctx.beginPath();
    ctx.arc(w.x, w.y, 3.6 * s, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = wire || sil || st.metal;
  ctx.lineWidth = pen.lw(1.6);
  ctx.beginPath();
  ctx.arc(rig.bb.x, rig.bb.y, 11 * s, 0, TAU);
  ctx.moveTo(rig.rearWheel.x, rig.rearWheel.y - 4.5 * s);
  ctx.lineTo(rig.bb.x, rig.bb.y - 11 * s);
  ctx.moveTo(rig.rearWheel.x, rig.rearWheel.y + 4.5 * s);
  ctx.lineTo(rig.bb.x, rig.bb.y + 11 * s);
  ctx.stroke();
  ctx.strokeStyle = wire || sil || st.frame;
  ctx.lineWidth = pen.lw(wire ? 1.8 : 4.2);
  ctx.beginPath();
  ctx.moveTo(rig.rearWheel.x, rig.rearWheel.y);
  ctx.lineTo(rig.seatCluster.x, rig.seatCluster.y);
  ctx.lineTo(rig.bb.x, rig.bb.y);
  ctx.closePath();
  ctx.moveTo(rig.seatCluster.x, rig.seatCluster.y);
  ctx.lineTo(rig.headTop.x, rig.headTop.y);
  ctx.moveTo(rig.headBot.x, rig.headBot.y);
  ctx.lineTo(rig.bb.x, rig.bb.y);
  ctx.stroke();
  ctx.lineWidth = pen.lw(wire ? 1.8 : 3.6);
  ctx.strokeStyle = wire || sil || st.frameShade;
  ctx.beginPath();
  ctx.moveTo(rig.headTop.x, rig.headTop.y);
  ctx.lineTo(rig.headBot.x, rig.headBot.y);
  ctx.lineTo(rig.frontWheel.x, rig.frontWheel.y);
  ctx.stroke();
  ctx.strokeStyle = wire || sil || st.metal;
  ctx.lineWidth = pen.lw(3);
  ctx.beginPath();
  ctx.moveTo(rig.seatCluster.x, rig.seatCluster.y);
  ctx.lineTo(rig.saddle.x, rig.saddle.y);
  ctx.moveTo(rig.headTop.x, rig.headTop.y);
  ctx.lineTo(rig.stemTop.x, rig.stemTop.y);
  ctx.quadraticCurveTo(rig.stemTop.x - 5 * s, rig.stemTop.y - 5 * s, rig.grip.x, rig.grip.y);
  ctx.stroke();
  ctx.strokeStyle = wire || sil || st.saddle;
  ctx.lineWidth = pen.lw(5);
  ctx.beginPath();
  ctx.moveTo(rig.saddle.x - 12 * s, rig.saddle.y);
  ctx.lineTo(rig.saddle.x + 11 * s, rig.saddle.y + 1 * s);
  ctx.stroke();
}

function shoe(ctx, foot, dirX, s, st, pen, rear = false) {
  ctx.beginPath();
  if (rear) ctx.ellipse(foot.x, foot.y - 4 * s, 9 * s, 6 * s, 0, 0, TAU);
  else ctx.ellipse(foot.x + dirX * 6 * s, foot.y + 1 * s, 11 * s, 5 * s, 0.08 * dirX, 0, TAU);
  pen.fillStroke(st.shoes);
}

function drawCycle(ctx, rig, st) {
  const s = rig.root.scale;
  const pen = makePen(ctx, st, s);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawBikeBack(ctx, rig, st, pen, s);
  // far leg + far crank
  drawCrank(ctx, rig, rig.farPedal, st, pen, s);
  const farTrouser = pen.sil || pen.wire ? st.trousers : shade(st.trousers, -0.25);
  pen.limb([rig.farHip, rig.farKnee, rig.farFoot], 13, farTrouser);
  shoe(ctx, rig.farFoot, 1, s, st, pen);
  // far arm
  pen.limb([rig.farShoulder, rig.farElbow, rig.farHand], 9, pen.sil || pen.wire ? st.top : shade(st.top, -0.25));
  drawBikeFrame(ctx, rig, st, pen, s);
  // scarf tails behind the torso
  drawScarfTails(ctx, rig, st, pen, 7);
  // torso (jacket) — a rounded wedge from hip to shoulder
  const hp = rig.hip;
  const sh = rig.shoulder;
  const dx = sh.x - hp.x;
  const dy = sh.y - hp.y;
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  const P = (u, v) => ({ x: hp.x + ux * u * L + nx * v * s, y: hp.y + uy * u * L + ny * v * s });
  const b0 = P(-0.12, 15);
  const b1 = P(0.55, 18);
  const b2 = P(1.04, 11);
  const f2 = P(1.05, -9);
  const f1 = P(0.5, -14);
  const f0 = P(-0.1, -15);
  ctx.beginPath();
  ctx.moveTo(b0.x, b0.y);
  ctx.quadraticCurveTo(b1.x, b1.y, b2.x, b2.y);
  ctx.quadraticCurveTo(P(1.15, 0).x, P(1.15, 0).y, f2.x, f2.y);
  ctx.quadraticCurveTo(f1.x, f1.y, f0.x, f0.y);
  ctx.closePath();
  pen.fillStroke(st.top);
  // near leg
  drawCrank(ctx, rig, rig.nearPedal, st, pen, s);
  pen.limb([rig.nearHip, rig.nearKnee, rig.nearFoot], 14, st.trousers);
  shoe(ctx, rig.nearFoot, 1, s, st, pen);
  // neck + head
  const h = rig.head;
  pen.limb([rig.neck, { x: h.x - 4 * s, y: h.y + 8 * s }], 8, st.skin);
  drawHeadSide(ctx, h, st, pen, rig);
  // scarf wrap
  if (st.scarf) {
    ctx.beginPath();
    ctx.ellipse(rig.neck.x + 1 * s, rig.neck.y + 1 * s, 9 * s, 5 * s, -0.4, 0, TAU);
    pen.fillStroke(st.scarfColor);
  }
  // near arm
  pen.limb([rig.nearShoulder, rig.nearElbow, rig.hand], 10, st.top);
  pen.dot(rig.hand, 4.6 * s, st.skin);
  ctx.restore();
}

function drawHeadSide(ctx, h, st, pen, rig) {
  const r = h.r;
  const s = rig.root.scale;
  // hair mass behind
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle || 0);
  const tip = { x: rig.hairTip.x - h.x, y: rig.hairTip.y - h.y };
  if (st.hairStyle !== 'short') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 1.0);
    ctx.quadraticCurveTo(-r * 1.3, -r * 0.8, tip.x, tip.y);
    ctx.quadraticCurveTo(-r * 0.9, r * 0.5, -r * 0.2, r * 0.55);
    ctx.closePath();
    pen.fillStroke(st.hair);
  }
  // face
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  pen.fillStroke(st.skin);
  if (!pen.sil && !pen.wire) {
    // nose
    ctx.beginPath();
    ctx.moveTo(r * 0.92, -r * 0.15);
    ctx.quadraticCurveTo(r * 1.28, r * 0.08, r * 0.9, r * 0.22);
    ctx.fillStyle = st.skin;
    ctx.fill();
    ctx.strokeStyle = st.outline;
    ctx.lineWidth = pen.lw(1.1);
    ctx.stroke();
    // eye + cheek
    ctx.fillStyle = '#1d1a17';
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.18, r * 0.11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(214, 110, 90, 0.35)';
    ctx.beginPath();
    ctx.arc(r * 0.42, r * 0.3, r * 0.22, 0, TAU);
    ctx.fill();
  }
  // hair cap on top / back of the head
  ctx.beginPath();
  ctx.arc(-r * 0.08, -r * 0.05, r * 1.04, Math.PI * 0.82, Math.PI * 1.92);
  ctx.quadraticCurveTo(r * 0.1, -r * 0.55, -r * 0.35, -r * 0.2);
  ctx.closePath();
  pen.fillStroke(st.hair);
  if (st.hairStyle === 'bun') {
    ctx.beginPath();
    ctx.arc(-r * 0.95, -r * 0.6, r * 0.42, 0, TAU);
    pen.fillStroke(st.hair);
  }
  // ear
  if (!pen.sil && !pen.wire) {
    ctx.beginPath();
    ctx.ellipse(-r * 0.1, r * 0.08, r * 0.17, r * 0.24, 0, 0, TAU);
    ctx.fillStyle = st.skinShade;
    ctx.fill();
  }
  ctx.restore();
  drawHat(ctx, h, st, pen, 'side');
}

// ---- painter (rear view) ------------------------------------------------------
function drawPalette(ctx, rig, st, pen, s) {
  const h = rig.handL;
  ctx.save();
  ctx.translate(h.x - 10 * s, h.y + 2 * s);
  ctx.rotate(-0.18);
  ctx.beginPath();
  ctx.ellipse(0, 0, 30 * s, 13 * s, 0, 0, TAU);
  pen.fillStroke(st.paletteWood);
  if (!pen.sil && !pen.wire) {
    const paints = st.paints || [];
    for (let i = 0; i < paints.length; i++) {
      const a = Math.PI * (0.9 + (i / Math.max(1, paints.length - 1)) * 1.15);
      ctx.fillStyle = paints[i];
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 21 * s, Math.sin(a) * 7.5 * s, 4.6 * s, 3 * s, 0, 0, TAU);
      ctx.fill();
    }
    // thumb hole
    ctx.fillStyle = rgbaHex(st.outline, 0.55);
    ctx.beginPath();
    ctx.ellipse(16 * s, 3 * s, 3.2 * s, 2.4 * s, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBrush(ctx, rig, st, pen, s) {
  const h = rig.handR;
  const t = rig.brushTip;
  const ux = t.x - h.x;
  const uy = t.y - h.y;
  const L = Math.hypot(ux, uy) || 1;
  const dx = ux / L;
  const dy = uy / L;
  const back = { x: h.x - dx * 14 * s, y: h.y - dy * 14 * s };
  const ferrule = { x: t.x - dx * 15 * s, y: t.y - dy * 15 * s };
  const ferrule2 = { x: t.x - dx * 9 * s, y: t.y - dy * 9 * s };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = pen.wire || pen.sil || st.brushHandle;
  ctx.lineWidth = pen.lw(3.4);
  ctx.beginPath();
  ctx.moveTo(back.x, back.y);
  ctx.lineTo(ferrule.x, ferrule.y);
  ctx.stroke();
  ctx.strokeStyle = pen.wire || pen.sil || '#b9b2a4';
  ctx.lineWidth = pen.lw(4);
  ctx.beginPath();
  ctx.moveTo(ferrule.x, ferrule.y);
  ctx.lineTo(ferrule2.x, ferrule2.y);
  ctx.stroke();
  // bristles (pointed, loaded with pigment)
  const nx = -dy;
  const ny = dx;
  ctx.beginPath();
  ctx.moveTo(ferrule2.x + nx * 2.6 * s, ferrule2.y + ny * 2.6 * s);
  ctx.quadraticCurveTo(ferrule2.x + dx * 5 * s + nx * 3.2 * s, ferrule2.y + dy * 5 * s + ny * 3.2 * s, t.x, t.y);
  ctx.quadraticCurveTo(ferrule2.x + dx * 5 * s - nx * 3.2 * s, ferrule2.y + dy * 5 * s - ny * 3.2 * s, ferrule2.x - nx * 2.6 * s, ferrule2.y - ny * 2.6 * s);
  ctx.closePath();
  ctx.fillStyle = pen.sil || st.brushPaint || '#3d6b8c';
  if (!pen.wire) ctx.fill();
  ctx.strokeStyle = pen.ink;
  ctx.lineWidth = pen.lw(0.9);
  ctx.stroke();
  ctx.restore();
}

function drawPaint(ctx, rig, st) {
  const s = rig.root.scale;
  const pen = makePen(ctx, st, s);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const holdsPalette = rig.action !== 'stand';
  // right (brush) arm: in front of the body (hidden side) when the hand crosses to the left
  const armBehind = rig.handR.x < rig.neckBase.x;
  const drawRightArm = () => {
    pen.limb([rig.shR, rig.elbowR], 11, st.top);
    pen.limb([rig.elbowR, rig.handR], 9.5, st.top);
    drawBrush(ctx, rig, st, pen, s);
    pen.dot(rig.handR, 5.2 * s, st.skin);
  };

  // palette (in front of the body, peeking out on the left) + left forearm
  if (holdsPalette) drawPalette(ctx, rig, st, pen, s);
  pen.limb([rig.elbowL, rig.handL], 10, pen.sil || pen.wire ? st.top : shade(st.top, -0.18));
  pen.dot(rig.handL, 5 * s, st.skin);

  if (armBehind) drawRightArm();

  // legs (trousers) + heels
  const trL = pen.sil || pen.wire ? st.trousers : shade(st.trousers, -0.12);
  pen.limb([rig.hipL, rig.kneeL, { x: rig.footL.x, y: rig.footL.y - 6 * s }], 17, trL);
  pen.limb([rig.hipR, rig.kneeR, { x: rig.footR.x, y: rig.footR.y - 6 * s }], 17, st.trousers);
  shoe(ctx, rig.footL, 0, s, st, pen, true);
  shoe(ctx, rig.footR, 0, s, st, pen, true);

  // smock (back view): shoulders -> flared hem, with the hem lifting in the wind
  const shL = rig.shL;
  const shR = rig.shR;
  const pv = rig.pelvis;
  const lean = rig.lean;
  const ca = Math.cos(lean);
  const sa = Math.sin(lean);
  const R = (px, py) => ({ x: pv.x + (px * ca - py * sa) * s, y: pv.y + (px * sa + py * ca) * s });
  const hem = rig.hem / s;
  const hemL = { x: pv.x - 33 * s + hem * s, y: pv.y + 26 * s };
  const hemR = { x: pv.x + 31 * s + hem * 0.6 * s, y: pv.y + 24 * s };
  const waistL = R(-24, -18);
  const waistR = R(23, -18);
  ctx.beginPath();
  ctx.moveTo(shL.x - 2 * s, shL.y);
  ctx.quadraticCurveTo(rig.neckBase.x, rig.neckBase.y - 3 * s, shR.x + 2 * s, shR.y);
  ctx.quadraticCurveTo(shR.x + 6 * s, shR.y + 22 * s, waistR.x, waistR.y);
  ctx.quadraticCurveTo(hemR.x - 2 * s, hemR.y - 18 * s, hemR.x, hemR.y);
  ctx.quadraticCurveTo(pv.x + hem * 0.5 * s, pv.y + 31 * s, hemL.x, hemL.y);
  ctx.quadraticCurveTo(waistL.x - 4 * s, waistL.y + 10 * s, waistL.x, waistL.y);
  ctx.quadraticCurveTo(shL.x - 7 * s, shL.y + 22 * s, shL.x - 2 * s, shL.y);
  ctx.closePath();
  pen.fillStroke(st.top);
  if (!pen.sil && !pen.wire) {
    // soft shade on the left, a back seam, two folds, a tied apron string
    ctx.save();
    ctx.clip();
    ctx.fillStyle = rgbaHex(st.topShade, 0.75);
    ctx.beginPath();
    ctx.ellipse(hemL.x + 2 * s, (shL.y + hemL.y) / 2 + 8 * s, 16 * s, 70 * s, lean, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgbaHex(st.outline, 0.35);
    ctx.lineWidth = pen.lw(1.1);
    const top = { x: rig.neckBase.x, y: rig.neckBase.y + 4 * s };
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.quadraticCurveTo(R(1, -40).x, R(1, -40).y, pv.x + hem * 0.4 * s, pv.y + 30 * s);
    ctx.moveTo(R(-12, -6).x, R(-12, -6).y);
    ctx.lineTo(hemL.x + 10 * s, hemL.y - 2 * s);
    ctx.moveTo(R(13, -8).x, R(13, -8).y);
    ctx.lineTo(hemR.x - 9 * s, hemR.y - 2 * s);
    ctx.stroke();
    ctx.strokeStyle = rgbaHex(st.outline, 0.5);
    ctx.lineWidth = pen.lw(2);
    ctx.beginPath();
    ctx.moveTo(waistL.x + 2 * s, waistL.y + 2 * s);
    ctx.lineTo(waistR.x - 2 * s, waistR.y + 2 * s);
    ctx.stroke();
    ctx.restore();
  }

  // left upper arm on the side of the body
  pen.limb([rig.shL, rig.elbowL], 11, st.top);

  // neck, scarf wrap, head (back of the head: hair), ears
  const h = rig.head;
  pen.limb([rig.neckBase, { x: h.x, y: h.y + h.r * 0.7 }], 11, st.skinShade);
  drawScarfTails(ctx, rig, st, pen, 9);
  if (st.scarf) {
    ctx.beginPath();
    ctx.ellipse(rig.neckBase.x, rig.neckBase.y - 1 * s, 15 * s, 7 * s, lean * 0.6, 0, TAU);
    pen.fillStroke(st.scarfColor);
  }
  drawHeadRear(ctx, h, st, pen, rig);

  if (!armBehind) drawRightArm();
  ctx.restore();
}

function drawHeadRear(ctx, h, st, pen, rig) {
  const r = h.r;
  const look = h.look || 0;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle || 0);
  // ears (the right one shows more when glancing right)
  if (!pen.wire) {
    for (const side of [-1, 1]) {
      const vis = side > 0 ? 1 + look * 0.5 : 1 - look * 0.5;
      ctx.beginPath();
      ctx.ellipse(side * r * (0.96 + 0.05 * vis), r * 0.12, r * 0.16 * vis, r * 0.24, 0, 0, TAU);
      ctx.fillStyle = pen.sil || st.skin;
      ctx.fill();
    }
  }
  // face edge / cheek when glancing aside
  if (Math.abs(look) > 0.05 && !pen.wire) {
    const side = Math.sign(look);
    ctx.beginPath();
    ctx.ellipse(side * r * 0.62, r * 0.25, r * 0.42 * Math.abs(look), r * 0.62, 0, 0, TAU);
    ctx.fillStyle = pen.sil || st.skin;
    ctx.fill();
    if (Math.abs(look) > 0.4 && !pen.sil) {
      // nose tip silhouette beyond the cheek
      ctx.beginPath();
      ctx.moveTo(side * r * 0.98, r * 0.05);
      ctx.quadraticCurveTo(side * r * 1.22, r * 0.22, side * r * 0.98, r * 0.34);
      ctx.fillStyle = st.skin;
      ctx.fill();
    }
  }
  // hair: back of the head, bob cut with wind-lifted ends to the left
  const fl = rig.fl || 0;
  const w = rig.wind ?? 1;
  ctx.beginPath();
  ctx.arc(0, -r * 0.08, r * 1.02, Math.PI * 1.02, TAU * 0.995);
  if (st.hairStyle === 'short') {
    ctx.quadraticCurveTo(r * 1.0, r * 0.5, r * 0.6, r * 0.62);
    ctx.quadraticCurveTo(0, r * 0.8, -r * 0.6, r * 0.62);
    ctx.quadraticCurveTo(-r * 1.0, r * 0.5, -r * 1.02, -r * 0.1);
  } else {
    ctx.quadraticCurveTo(r * 1.12, r * 0.6, r * 0.82, r * 0.98);
    ctx.lineTo(r * 0.3, r * 0.9);
    ctx.quadraticCurveTo(-r * 0.2, r * 1.05, -r * 0.7, r * 0.95);
    // wind-lifted strands on the left
    ctx.lineTo(-r * (1.25 + 0.15 * w) , r * (0.78 - 0.1 * fl));
    ctx.lineTo(-r * 1.0, r * 0.58);
    ctx.lineTo(-r * (1.32 + 0.2 * w), r * (0.38 - 0.12 * fl));
    ctx.quadraticCurveTo(-r * 1.1, -r * 0.1, -r * 1.02, -r * 0.1);
  }
  ctx.closePath();
  pen.fillStroke(st.hair);
  if (!pen.sil && !pen.wire) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = pen.lw(1.4);
    ctx.beginPath();
    ctx.arc(r * 0.05, -r * 0.1, r * 0.72, Math.PI * 1.15, Math.PI * 1.55);
    ctx.stroke();
  }
  if (st.hairStyle === 'bun') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.75, r * 0.42, 0, TAU);
    pen.fillStroke(st.hair);
  } else if (st.hairStyle === 'ponytail') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, r * 0.2);
    ctx.quadraticCurveTo(-r * 0.9, r * 1.1 + fl * 2, -r * (1.6 + 0.3 * w), r * (0.9 + 0.2 * fl));
    ctx.quadraticCurveTo(-r * 0.7, r * 0.7, r * 0.1, r * 0.35);
    ctx.closePath();
    pen.fillStroke(st.hair);
  }
  ctx.restore();
  drawHat(ctx, h, st, pen, 'rear');
}

// -----------------------------------------------------------------------------
// Character descriptor
// -----------------------------------------------------------------------------
/** Ruler marker: a tiny head with the hat, centred at (x, y). */
/** Default hat colours per hat type (used when the style gives no hatColor / hatBand). */
export const HAT_COLORS = {
  beret: { hatColor: '#b8473a', hatBand: '#2b2620' },
  straw: { hatColor: '#e2c47c', hatBand: '#7a3b2a' },
  cap: { hatColor: '#2f5d7c', hatBand: '#1f3f55' },
};
function resolveStyle(styleIn = {}) {
  const st = { ...DEFAULT_PERSON_STYLE, ...styleIn };
  const hc = HAT_COLORS[st.hat] || HAT_COLORS.beret;
  if (styleIn.hatColor == null) st.hatColor = hc.hatColor;
  if (styleIn.hatBand == null) st.hatBand = hc.hatBand;
  return st;
}

function drawMarker(ctx, x, y, style = {}) {
  const st = resolveStyle(style);
  ctx.save();
  ctx.fillStyle = st.skin;
  ctx.strokeStyle = st.outline;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = st.hair;
  ctx.beginPath();
  ctx.arc(x - 1, y - 1, 7.2, Math.PI * 0.85, Math.PI * 1.9);
  ctx.closePath();
  ctx.fill();
  if (st.hat && st.hat !== 'none') {
    ctx.fillStyle = st.hatColor;
    ctx.beginPath();
    ctx.ellipse(x - 1, y - 6, 8, 3.4, -0.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function draw(ctx, rig, styleIn = {}) {
  const st = resolveStyle(styleIn);
  if (styleIn.pinwheel && !styleIn.prop) st.prop = styleIn.pinwheel;
  if (rig.action === 'cycle') drawCycle(ctx, rig, st);
  else drawPaint(ctx, rig, st);
}

export default {
  id: 'person',
  label: '人物',
  labelAlt: 'Person',
  actions: ['cycle', 'paint', 'stand'],
  /** Approximate size at scale 1 (px): cycling ~260 x 230 (incl. prop); standing ~250 tall. */
  size: { w: 260, h: 250 },
  defaultStyle: DEFAULT_PERSON_STYLE,
  computeRig(a = {}) {
    if (a.action === 'paint' || a.action === 'stand') return computePaintRig(a);
    return computeCycleRig(a);
  },
  draw,
  drawMarker,
};

