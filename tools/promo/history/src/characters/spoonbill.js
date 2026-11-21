// src/characters/spoonbill.js
// Character "spoonbill": Black-faced Spoonbill (黑面琵鷺, Platalea minor) riding a bicycle,
// with a prop (pinwheel / mini-rotor / pennant ...) on a rear flag-pole that changes per chapter.
// Actions: 'cycle' (rides the bicycle) and 'paint' (easel stage: stands on the hill, brush in
// the bill). The character descriptor (default export) is at the bottom of the file.
//
// computeRiderRig() returns panel-space joint positions (pure function of its inputs),
// drawRider() draws a clean default rendering with lots of style switches so each era
// can restyle it (silhouette, line-art, flat colours, outline weight, palette ...).
// Scenes that need a fully bespoke look can draw their own rider from the rig points.

import { drawProp } from '../kit/props.js';

const DEG = Math.PI / 180;

/** Analytical two-bone IK. Returns the knee position. */
export function solveTwoBoneIK(rx, ry, tx, ty, L1, L2, bendSign = 1) {
  let dx = tx - rx;
  let dy = ty - ry;
  let d = Math.hypot(dx, dy);
  const minD = Math.abs(L1 - L2) + 1e-3;
  const maxD = L1 + L2 - 1e-3;
  if (d < minD) d = minD;
  if (d > maxD) {
    const k = maxD / Math.hypot(dx, dy);
    dx *= k;
    dy *= k;
    d = maxD;
  }
  const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const a = Math.atan2(dy, dx) + bendSign * Math.acos(Math.max(-1, Math.min(1, cosA)));
  return { x: rx + L1 * Math.cos(a), y: ry + L1 * Math.sin(a) };
}

/**
 * @param {object} o
 * @param {number} o.x            bicycle centre x (panel px)
 * @param {number} o.y            ground contact y (panel px, road = 700 at panel edges)
 * @param {number} o.pedalAngle   crank angle (rad), 1 revolution per second
 * @param {number} [o.slope]      road tangent angle (rad)
 * @param {number} [o.scale]      uniform scale (1 = standard ~230 px tall incl. pinwheel)
 * @param {number} [o.speedScale] 0..1 motion intensity
 * @param {number} [o.time]       seconds, for secondary motion (crest, wing tips)
 * @param {number} [o.worldX]     continuous world x for wheel spoke phase (defaults to x)
 * @param {number} [o.pinwheelAngle] rotor angle (rad)
 */
export function computeRiderRig({
  x = 500,
  y = 700,
  pedalAngle = 0,
  slope = 0,
  scale = 1,
  speedScale = 1,
  time = 0,
  worldX = null,
  pinwheelAngle = null,
  pose = 'ride',
} = {}) {
  const wheelR = 44;
  const roll = (worldX !== null && worldX !== undefined ? worldX : x) / wheelR;
  const amp = Math.max(0.1, Math.min(1.2, speedScale));
  const bob = -2.6 * Math.sin(2 * pedalAngle) * amp;
  const nod = 0.05 * Math.sin(2 * pedalAngle - 0.5) * amp;
  const flutter = Math.sin(time * 11.0) * 0.5 + Math.sin(time * 17.3 + 1.1) * 0.5;

  // --- bicycle (local, ground at y = 0, facing +x) ---
  const rearWheel = { x: -84, y: -wheelR };
  const frontWheel = { x: 84, y: -wheelR };
  const bb = { x: -6, y: -wheelR };
  const crankR = 19;
  const nearPedal = { x: bb.x + crankR * Math.cos(pedalAngle), y: bb.y + crankR * Math.sin(pedalAngle) };
  const farPedal = { x: bb.x - crankR * Math.cos(pedalAngle), y: bb.y - crankR * Math.sin(pedalAngle) };
  const seatCluster = { x: -30, y: -104 };
  const saddle = { x: -34, y: -111 };
  const headTop = { x: 52, y: -106 };
  const headBot = { x: 58, y: -84 };
  const stemTop = { x: 49, y: -122 };
  const grip = { x: 33, y: -125 };

  // --- spoonbill ---
  const hip = { x: -26, y: -119 + bob };
  const body = { x: -12, y: -140 + bob, rx: 42, ry: 23, tilt: -0.2 };
  const tailTip = { x: -60, y: -133 + bob * 0.7 };
  const chest = { x: 22, y: -150 + bob };
  const neckBase = { x: 14, y: -158 + bob };
  const neckC1 = { x: 36, y: -170 + bob };
  const neckC2 = { x: 6, y: -186 + bob };
  const headAngle = (pose === 'proud' ? -0.12 : 0) + nod;
  const head = { x: 22, y: -201 + bob * 1.1, r: 12.5, angle: headAngle };
  const billDir = 17 * DEG + headAngle;
  const billLen = 66;
  const billBase = { x: head.x + 9 * Math.cos(headAngle) + 1, y: head.y + 2 + 9 * Math.sin(headAngle) };
  const billTip = { x: billBase.x + billLen * Math.cos(billDir), y: billBase.y + billLen * Math.sin(billDir) };
  const eye = { x: head.x + 4.5, y: head.y - 2.5 };
  // breeding crest plumes stream back in the wind
  const crestRoot = { x: head.x - 9, y: head.y - 5 };
  const crestTip1 = { x: head.x - 40, y: head.y - 10 + 3.2 * flutter * amp };
  const crestTip2 = { x: head.x - 36, y: head.y - 1 - 2.6 * flutter * amp };
  const wingShoulder = { x: 6, y: -150 + bob };
  const wingElbow = { x: 24, y: -139 + bob * 0.6 };
  const wingHand = { x: grip.x + 1, y: grip.y - 1 };

  const nearHip = { x: hip.x + 2, y: hip.y + 4 };
  const farHip = { x: hip.x - 2, y: hip.y + 4 };
  const footOff = -4;
  const nearFoot = { x: nearPedal.x, y: nearPedal.y + footOff };
  const farFoot = { x: farPedal.x, y: farPedal.y + footOff };
  const nearKnee = solveTwoBoneIK(nearHip.x, nearHip.y, nearFoot.x, nearFoot.y, 47, 51, -1);
  const farKnee = solveTwoBoneIK(farHip.x, farHip.y, farFoot.x, farFoot.y, 47, 51, -1);

  // --- pinwheel on a rear flag pole ---
  const poleBase = { x: -64, y: -74 };
  const poleTop = { x: -100, y: -200 };
  const pinHub = { x: -101, y: -204 };

  const c = Math.cos(slope) * scale;
  const s = Math.sin(slope) * scale;
  const xf = (p) => ({ x: x + p.x * c - p.y * s, y: y + p.x * s + p.y * c });

  return {
    root: { x, y, scale, slope },
    pose,
    time,
    pedalAngle,
    wheelAngle: roll,
    pinwheelAngle: pinwheelAngle !== null && pinwheelAngle !== undefined ? pinwheelAngle : time * 13.8,
    flutter,
    rearWheel: { ...xf(rearWheel), r: wheelR * scale },
    frontWheel: { ...xf(frontWheel), r: wheelR * scale },
    bb: xf(bb),
    crankR: crankR * scale,
    nearPedal: xf(nearPedal),
    farPedal: xf(farPedal),
    seatCluster: xf(seatCluster),
    saddle: xf(saddle),
    headTop: xf(headTop),
    headBot: xf(headBot),
    stemTop: xf(stemTop),
    grip: xf(grip),
    hip: xf(hip),
    body: { ...xf(body), rx: body.rx * scale, ry: body.ry * scale, tilt: body.tilt + slope },
    tailTip: xf(tailTip),
    chest: xf(chest),
    neckBase: xf(neckBase),
    neckC1: xf(neckC1),
    neckC2: xf(neckC2),
    head: { ...xf(head), r: head.r * scale, angle: head.angle + slope },
    billBase: xf(billBase),
    billTip: xf(billTip),
    billDir: billDir + slope,
    eye: xf(eye),
    crestRoot: xf(crestRoot),
    crestTip1: xf(crestTip1),
    crestTip2: xf(crestTip2),
    wingShoulder: xf(wingShoulder),
    wingElbow: xf(wingElbow),
    wingHand: xf(wingHand),
    nearHip: xf(nearHip),
    farHip: xf(farHip),
    nearKnee: xf(nearKnee),
    farKnee: xf(farKnee),
    nearFoot: xf(nearFoot),
    farFoot: xf(farFoot),
    poleBase: xf(poleBase),
    poleTop: xf(poleTop),
    pinHub: { ...xf(pinHub), r: 24 * scale },
    propHub: { ...xf(pinHub), r: 24 * scale },
  };
}

// -----------------------------------------------------------------------------
// Default rider rendering
// -----------------------------------------------------------------------------
export const DEFAULT_RIDER_STYLE = {
  plumage: '#f7f4ec',
  plumageShade: '#d9d3c4',
  mask: '#161514',
  bill: '#1b1a19',
  eyeRing: '#c9a24a',
  legs: '#24221f',
  crest: '#e9c25b',
  breast: '#f0cf72',
  frame: '#2f6f8f',
  frameShade: '#245873',
  metal: '#3b3935',
  tire: '#1f1e1c',
  rim: '#c9c3b5',
  saddle: '#3a2a20',
  outline: '#1b1a18',
  outlineWidth: 1.5,
  lineScale: 1,
  silhouette: null, // flat single colour (shadow theatre, film noir, etc.)
  wire: null, // line-art only in this colour (blueprint, oscilloscope, engraving)
  shading: true,
  spokes: 12,
  pinwheel: { type: 'paper' },
  showPinwheel: true,
  showRider: true,
  showBike: true,
};

export function drawRider(ctx, rig, styleIn = {}) {
  const st = { ...DEFAULT_RIDER_STYLE, ...styleIn };
  // generic names used by the stage / character API
  if (styleIn.prop && !styleIn.pinwheel) st.pinwheel = styleIn.prop;
  if (styleIn.showProp === false) st.showPinwheel = false;
  const s = rig.root.scale;
  const sil = st.silhouette;
  const wire = st.wire;
  const ink = wire || sil || st.outline;
  const lw = (w) => Math.max(0.6, w * s * st.lineScale);
  const col = (c) => sil || c;
  const fillable = !wire;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // limb = outlined thick stroke along points
  const limb = (pts, width, color) => {
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
  };

  const fillStroke = (fill) => {
    if (fillable) {
      ctx.fillStyle = col(fill);
      ctx.fill();
    }
    if (wire || (!sil && st.outlineWidth > 0)) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = lw(wire ? 1.4 : st.outlineWidth);
      ctx.stroke();
    }
  };

  // 1. Pinwheel pole + rotor (behind everything)
  if (st.showPinwheel && st.pinwheel && st.pinwheel.type !== 'none') {
    ctx.strokeStyle = wire || sil || '#6b4f32';
    ctx.lineWidth = lw(2.4);
    ctx.beginPath();
    ctx.moveTo(rig.poleBase.x, rig.poleBase.y);
    ctx.lineTo(rig.poleTop.x, rig.poleTop.y);
    ctx.stroke();
    drawProp(ctx, rig.pinHub, rig.pinwheelAngle, {
      stroke: st.outline,
      wire,
      silhouette: sil,
      time: rig.time,
      ...st.pinwheel,
    });
  }

  const drawLeg = (hipP, knee, foot, pedal, far) => {
    if (st.showBike) {
      // crank arm + pedal
      ctx.strokeStyle = wire || sil || st.metal;
      ctx.lineWidth = lw(3.2);
      ctx.beginPath();
      ctx.moveTo(rig.bb.x, rig.bb.y);
      ctx.lineTo(pedal.x, pedal.y);
      ctx.stroke();
      ctx.lineWidth = lw(3.6);
      ctx.beginPath();
      ctx.moveTo(pedal.x - 7 * s, pedal.y + 1.5 * s);
      ctx.lineTo(pedal.x + 7 * s, pedal.y + 1.5 * s);
      ctx.stroke();
    }
    if (!st.showRider) return;
    const legCol = far && !sil && !wire ? shadeHex(st.legs, 0.35) : st.legs;
    limb([hipP, knee, foot], 3.6, legCol);
    // three forward toes + hind toe gripping the pedal
    ctx.strokeStyle = wire || sil || legCol;
    ctx.lineWidth = lw(2.2);
    ctx.beginPath();
    ctx.moveTo(foot.x, foot.y);
    ctx.lineTo(foot.x + 13 * s, foot.y + 2.5 * s);
    ctx.moveTo(foot.x, foot.y);
    ctx.lineTo(foot.x + 10 * s, foot.y + 5 * s);
    ctx.moveTo(foot.x, foot.y);
    ctx.lineTo(foot.x - 6 * s, foot.y + 2 * s);
    ctx.stroke();
  };

  // 2. far leg
  drawLeg(rig.farHip, rig.farKnee, rig.farFoot, rig.farPedal, true);

  if (st.showBike) {
    // 3. wheels
    for (const w of [rig.rearWheel, rig.frontWheel]) {
      ctx.strokeStyle = wire || sil || st.metal;
      ctx.lineWidth = lw(1.1);
      const n = st.spokes;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = rig.wheelAngle + (i * Math.PI * 2) / n;
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.x + Math.cos(a) * (w.r - 3 * s), w.y + Math.sin(a) * (w.r - 3 * s));
      }
      ctx.stroke();
      if (!wire && !sil) {
        ctx.strokeStyle = st.rim;
        ctx.lineWidth = lw(2.6);
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r - 3.2 * s, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = wire || sil || st.tire;
      ctx.lineWidth = lw(wire ? 1.8 : 4.6);
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 3.6 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. chainring + chain
    ctx.strokeStyle = wire || sil || st.metal;
    ctx.lineWidth = lw(1.6);
    ctx.beginPath();
    ctx.arc(rig.bb.x, rig.bb.y, 11 * s, 0, Math.PI * 2);
    ctx.moveTo(rig.rearWheel.x, rig.rearWheel.y - 4.5 * s);
    ctx.lineTo(rig.bb.x, rig.bb.y - 11 * s);
    ctx.moveTo(rig.rearWheel.x, rig.rearWheel.y + 4.5 * s);
    ctx.lineTo(rig.bb.x, rig.bb.y + 11 * s);
    ctx.stroke();

    // 5. frame
    ctx.strokeStyle = wire || sil || st.frame;
    ctx.lineWidth = lw(wire ? 1.8 : 4.2);
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
    ctx.lineWidth = lw(wire ? 1.8 : 3.6);
    ctx.strokeStyle = wire || sil || st.frameShade;
    ctx.beginPath();
    ctx.moveTo(rig.headTop.x, rig.headTop.y);
    ctx.lineTo(rig.headBot.x, rig.headBot.y);
    ctx.lineTo(rig.frontWheel.x, rig.frontWheel.y);
    ctx.stroke();
    // seat post, stem, bar
    ctx.strokeStyle = wire || sil || st.metal;
    ctx.lineWidth = lw(3);
    ctx.beginPath();
    ctx.moveTo(rig.seatCluster.x, rig.seatCluster.y);
    ctx.lineTo(rig.saddle.x, rig.saddle.y);
    ctx.moveTo(rig.headTop.x, rig.headTop.y);
    ctx.lineTo(rig.stemTop.x, rig.stemTop.y);
    ctx.quadraticCurveTo(rig.stemTop.x - 5 * s, rig.stemTop.y - 5 * s, rig.grip.x, rig.grip.y);
    ctx.stroke();
    ctx.strokeStyle = wire || sil || st.saddle;
    ctx.lineWidth = lw(5);
    ctx.beginPath();
    ctx.moveTo(rig.saddle.x - 12 * s, rig.saddle.y);
    ctx.lineTo(rig.saddle.x + 11 * s, rig.saddle.y + 1 * s);
    ctx.stroke();
  }

  if (st.showRider) {
    // 6. tail + body
    const b = rig.body;
    ctx.beginPath();
    ctx.moveTo(b.x - b.rx * 0.6, b.y - b.ry * 0.35);
    ctx.lineTo(rig.tailTip.x, rig.tailTip.y);
    ctx.lineTo(b.x - b.rx * 0.55, b.y + b.ry * 0.45);
    ctx.closePath();
    fillStroke(st.plumageShade);

    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.rx, b.ry, b.tilt, 0, Math.PI * 2);
    fillStroke(st.plumage);
    if (st.shading && !sil && !wire) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, b.tilt, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = rgbaHex(st.plumageShade, 0.75);
      ctx.beginPath();
      ctx.ellipse(b.x - 4 * s, b.y + b.ry * 0.62, b.rx * 1.05, b.ry * 0.55, b.tilt, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // folded wing on the body (primaries towards the tail)
    const sh = rig.wingShoulder;
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.bezierCurveTo(sh.x - 24 * s, sh.y - 8 * s, sh.x - 58 * s, sh.y + 2 * s, rig.tailTip.x - 4 * s, rig.tailTip.y + 3 * s);
    ctx.bezierCurveTo(sh.x - 46 * s, sh.y + 20 * s, sh.x - 16 * s, sh.y + 20 * s, sh.x + 2 * s, sh.y + 10 * s);
    ctx.closePath();
    fillStroke(st.shading ? st.plumageShade : st.plumage);
    if (!sil) {
      ctx.strokeStyle = wire || rgbaHex(st.outline, 0.55);
      ctx.lineWidth = lw(1);
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const fx = sh.x - (24 + k * 9) * s;
        ctx.moveTo(fx, sh.y + (6 + k * 1.5) * s);
        ctx.lineTo(fx - 12 * s, sh.y + (12 + k * 1.2) * s);
      }
      ctx.stroke();
    }

    // 7. neck (S-curve), breast patch
    const neckPts = cubicPts(rig.neckBase, rig.neckC1, rig.neckC2, rig.head, 14);
    limb(neckPts, 12, st.plumage);
    if (!sil && !wire && st.breast) {
      ctx.fillStyle = rgbaHex(st.breast, 0.85);
      ctx.beginPath();
      ctx.ellipse(rig.chest.x - 3 * s, rig.chest.y + 1 * s, 9 * s, 7 * s, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // crest plumes
    ctx.strokeStyle = wire || sil || st.crest;
    ctx.lineWidth = lw(2.4);
    ctx.beginPath();
    const cr = rig.crestRoot;
    ctx.moveTo(cr.x, cr.y);
    ctx.quadraticCurveTo((cr.x + rig.crestTip1.x) / 2, cr.y - 6 * s, rig.crestTip1.x, rig.crestTip1.y);
    ctx.moveTo(cr.x, cr.y + 2 * s);
    ctx.quadraticCurveTo((cr.x + rig.crestTip2.x) / 2, cr.y - 1 * s, rig.crestTip2.x, rig.crestTip2.y);
    ctx.moveTo(cr.x, cr.y + 1 * s);
    ctx.quadraticCurveTo((cr.x + rig.crestTip2.x) / 2, cr.y - 3 * s, (rig.crestTip1.x + rig.crestTip2.x) / 2 + 4 * s, (rig.crestTip1.y + rig.crestTip2.y) / 2);
    ctx.stroke();

    // head
    const h = rig.head;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
    fillStroke(st.plumage);

    // black facial mask (front of head, around the eye, to the bill base)
    if (!wire) {
      const ca = Math.cos(h.angle);
      const sa = Math.sin(h.angle);
      const R = (px, py) => ({ x: h.x + px * ca - py * sa, y: h.y + px * sa + py * ca });
      const m0 = R(-1, -h.r * 0.95);
      const m1 = R(h.r * 0.95, -h.r * 0.5);
      const m2 = R(h.r * 1.05, h.r * 0.55);
      const m3 = R(h.r * 0.1, h.r * 0.9);
      const m4 = R(-h.r * 0.15, 0);
      ctx.beginPath();
      ctx.moveTo(m0.x, m0.y);
      ctx.quadraticCurveTo(R(h.r * 0.8, -h.r * 1.0).x, R(h.r * 0.8, -h.r * 1.0).y, m1.x, m1.y);
      ctx.lineTo(m2.x, m2.y);
      ctx.quadraticCurveTo(R(h.r * 0.6, h.r * 1.0).x, R(h.r * 0.6, h.r * 1.0).y, m3.x, m3.y);
      ctx.quadraticCurveTo(m4.x - 2 * s, m4.y + 4 * s, m4.x, m4.y);
      ctx.quadraticCurveTo(m4.x - 1 * s, m4.y - 6 * s, m0.x, m0.y);
      ctx.closePath();
      ctx.fillStyle = sil || st.mask;
      ctx.fill();
    }

    // bill: tapered shaft + spatulate "spoon" tip
    const bb0 = rig.billBase;
    const bt = rig.billTip;
    const d = rig.billDir;
    const nx = -Math.sin(d);
    const ny = Math.cos(d);
    const L = Math.hypot(bt.x - bb0.x, bt.y - bb0.y);
    const ux = (bt.x - bb0.x) / L;
    const uy = (bt.y - bb0.y) / L;
    const spoonC = { x: bt.x - ux * 8 * s, y: bt.y - uy * 8 * s };
    ctx.beginPath();
    ctx.moveTo(bb0.x + nx * -4.6 * s, bb0.y + ny * -4.6 * s);
    ctx.lineTo(spoonC.x - ux * 6 * s + nx * -2.2 * s, spoonC.y - uy * 6 * s + ny * -2.2 * s);
    ctx.quadraticCurveTo(bt.x + nx * -6.5 * s, bt.y + ny * -6.5 * s, bt.x + ux * 1.5 * s, bt.y + uy * 1.5 * s);
    ctx.quadraticCurveTo(bt.x + nx * 7.5 * s + ux * -1 * s, bt.y + ny * 7.5 * s + uy * -1 * s, spoonC.x - ux * 6 * s + nx * 2.4 * s, spoonC.y - uy * 6 * s + ny * 2.4 * s);
    ctx.lineTo(bb0.x + nx * 4.4 * s, bb0.y + ny * 4.4 * s);
    ctx.closePath();
    if (fillable) {
      ctx.fillStyle = sil || st.bill;
      ctx.fill();
    }
    if (wire) {
      ctx.strokeStyle = wire;
      ctx.lineWidth = lw(1.4);
      ctx.stroke();
    } else if (!sil) {
      // subtle ridges on the bill
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = lw(0.9);
      ctx.beginPath();
      ctx.moveTo(bb0.x + ux * 6 * s, bb0.y + uy * 6 * s);
      ctx.lineTo(spoonC.x - ux * 4 * s, spoonC.y - uy * 4 * s);
      ctx.stroke();
    }

    // eye (bright ring so it reads on the black mask)
    const e = rig.eye;
    if (!sil) {
      ctx.fillStyle = wire ? 'rgba(0,0,0,0)' : st.eyeRing;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 2.9 * s, 0, Math.PI * 2);
      if (!wire) ctx.fill();
      else {
        ctx.strokeStyle = wire;
        ctx.lineWidth = lw(1);
        ctx.stroke();
      }
      ctx.fillStyle = wire || '#0a0a0a';
      ctx.beginPath();
      ctx.arc(e.x + 0.4 * s, e.y, 1.6 * s, 0, Math.PI * 2);
      ctx.fill();
      if (!wire) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x - 0.5 * s, e.y - 0.9 * s, 0.75 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 8. near leg (in front of the frame)
  drawLeg(rig.nearHip, rig.nearKnee, rig.nearFoot, rig.nearPedal, false);

  if (st.showRider) {
    // 9. near wing reaching for the handlebar
    const sh = rig.wingShoulder;
    const el = rig.wingElbow;
    const hd = rig.wingHand;
    // tapered wing: rounded leading edge on top, scalloped flight feathers underneath,
    // primaries curling around the grip like fingers
    ctx.beginPath();
    ctx.moveTo(sh.x - 12 * s, sh.y - 5 * s);
    ctx.bezierCurveTo(el.x - 6 * s, el.y - 16 * s, hd.x - 6 * s, hd.y - 12 * s, hd.x + 4 * s, hd.y - 5 * s);
    ctx.quadraticCurveTo(hd.x + 9 * s, hd.y - 1 * s, hd.x + 5 * s, hd.y + 3.5 * s);
    ctx.quadraticCurveTo(hd.x + 1 * s, hd.y + 6 * s, hd.x - 3 * s, hd.y + 3 * s);
    ctx.quadraticCurveTo(hd.x - 5 * s, hd.y + 8 * s, hd.x - 10 * s, hd.y + 4 * s);
    ctx.quadraticCurveTo(el.x - 2 * s, el.y + 9 * s, el.x - 9 * s, el.y + 6 * s);
    ctx.quadraticCurveTo(el.x - 14 * s, el.y + 13 * s, sh.x - 8 * s, sh.y + 12 * s);
    ctx.quadraticCurveTo(sh.x - 18 * s, sh.y + 12 * s, sh.x - 20 * s, sh.y + 5 * s);
    ctx.closePath();
    fillStroke(st.plumage);
    if (!sil && !wire) {
      ctx.strokeStyle = rgbaHex(st.outline, 0.4);
      ctx.lineWidth = lw(0.9);
      ctx.beginPath();
      ctx.moveTo(sh.x - 10 * s, sh.y + 3 * s);
      ctx.quadraticCurveTo(el.x - 4 * s, el.y - 4 * s, hd.x - 4 * s, hd.y - 2 * s);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// -----------------------------------------------------------------------------
function cubicPts(p0, p1, p2, p3, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const iu = 1 - u;
    pts.push({
      x: iu * iu * iu * p0.x + 3 * iu * iu * u * p1.x + 3 * iu * u * u * p2.x + u * u * u * p3.x,
      y: iu * iu * iu * p0.y + 3 * iu * iu * u * p1.y + 3 * iu * u * u * p2.y + u * u * u * p3.y,
    });
  }
  return pts;
}

function parseHex(hex) {
  if (!hex || hex[0] !== '#') return null;
  const h = hex.slice(1);
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbaHex(hex, a) {
  const c = parseHex(hex);
  if (!c) return hex;
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

function shadeHex(hex, amt) {
  const c = parseHex(hex);
  if (!c) return hex;
  const f = (v) => Math.round(v + (255 - v) * amt);
  return `rgb(${f(c.r)},${f(c.g)},${f(c.b)})`;
}

// -----------------------------------------------------------------------------
// Character descriptor (see src/characters/index.js for the interface)
// -----------------------------------------------------------------------------
/** Small head icon for the time ruler marker, centred at (x, y), facing right. */
function drawMarker(ctx, x, y, style = {}) {
  ctx.save();
  ctx.fillStyle = style.plumage || DEFAULT_RIDER_STYLE.plumage;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = style.bill || '#161514';
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 4);
  ctx.lineTo(x + 22, y + 3);
  ctx.quadraticCurveTo(x + 27, y + 5, x + 22, y + 8);
  ctx.lineTo(x + 3, y + 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// -----------------------------------------------------------------------------
// 'paint' action (easel stage): the spoonbill stands on the hill and paints with a brush
// held in the tip of its bill. Built on the riding rig (same body / head geometry), so the
// cycle path above is untouched.
// -----------------------------------------------------------------------------
function computePaintRig(a) {
  const s = a.scale || 1;
  const x = a.x ?? 300;
  const y = a.y ?? 760;
  const time = a.time || 0;
  const breath = Math.sin(time * 1.9) * 1.5 * s;
  // the riding rig's hip is 119 px above the road; lower the body so the legs reach the ground
  const base = computeRiderRig({ x, y: y + 22 * s + breath, pedalAngle: 0, scale: s, speedScale: 0.4, time, pose: 'ride' });
  const rig = { ...base, action: 'paint' };
  const L = (v, k) => ({ x: v.x * k, y: v.y * k });
  // legs: stand, the backward-bending joint below the body
  rig.nearFoot = { x: x + 10 * s, y };
  rig.farFoot = { x: x - 12 * s, y };
  const knee = (hip, foot) => {
    const k1 = solveTwoBoneIK(hip.x, hip.y, foot.x, foot.y, 47 * s, 51 * s, 1);
    const k2 = solveTwoBoneIK(hip.x, hip.y, foot.x, foot.y, 47 * s, 51 * s, -1);
    return k1.x < k2.x ? k1 : k2;
  };
  rig.nearKnee = knee(rig.nearHip, rig.nearFoot);
  rig.farKnee = knee(rig.farHip, rig.farFoot);
  rig.nearPedal = rig.nearFoot;
  rig.farPedal = rig.farFoot;
  // folded wing
  rig.wingElbow = { x: rig.body.x + 14 * s, y: rig.body.y + 4 * s };
  rig.wingHand = { x: rig.body.x - 30 * s, y: rig.body.y + 6 * s };
  // neck + head: the brush (held in the spoon) reaches the target
  const brushLen = (a.brushLen ?? 30) * s;
  const nb = rig.neckBase;
  let tgt = a.brush ? { x: a.brush.x, y: a.brush.y - (a.lift ?? 0) * 8 * s } : { x: nb.x + 90 * s, y: nb.y - 40 * s };
  const dir = Math.max(-0.95, Math.min(1.25, Math.atan2(tgt.y - nb.y, tgt.x - nb.x) + 0.15));
  const ha = dir - 17 * DEG;
  const ux = Math.cos(dir);
  const uy = Math.sin(dir);
  // head centre so that billTip + brush = target
  const billTip = { x: tgt.x - ux * brushLen, y: tgt.y - uy * brushLen };
  let head = {
    x: billTip.x - ux * 66 * s - Math.cos(ha) * 10 * s,
    y: billTip.y - uy * 66 * s - Math.sin(ha) * 10 * s - 2 * s,
  };
  const maxNeck = 112 * s;
  const dn = Math.hypot(head.x - nb.x, head.y - nb.y);
  if (dn > maxNeck) head = { x: nb.x + ((head.x - nb.x) / dn) * maxNeck, y: nb.y + ((head.y - nb.y) / dn) * maxNeck };
  if (head.y > nb.y + 10 * s && head.x < nb.x + 30 * s) head.x = nb.x + 30 * s; // keep the neck out of the chest
  rig.head = { x: head.x, y: head.y, r: 12.5 * s, angle: ha };
  rig.billBase = { x: head.x + 9 * s * Math.cos(ha) + 1 * s, y: head.y + 2 * s + 9 * s * Math.sin(ha) };
  rig.billDir = dir;
  rig.billTip = { x: rig.billBase.x + 66 * s * ux, y: rig.billBase.y + 66 * s * uy };
  rig.brushTip = { x: rig.billTip.x + ux * brushLen, y: rig.billTip.y + uy * brushLen };
  rig.eye = { x: head.x + 4.5 * s, y: head.y - 2.5 * s };
  const fl = rig.flutter;
  rig.crestRoot = { x: head.x - 9 * s, y: head.y - 5 * s };
  rig.crestTip1 = { x: head.x - 40 * s, y: head.y - 10 * s + 3.2 * fl * s };
  rig.crestTip2 = { x: head.x - 36 * s, y: head.y - 1 * s - 2.6 * fl * s };
  // S-curved neck from the base to the head
  const mid = { x: (nb.x + head.x) / 2, y: (nb.y + head.y) / 2 };
  const nx = -(head.y - nb.y);
  const ny = head.x - nb.x;
  const nl = Math.hypot(nx, ny) || 1;
  rig.neckC1 = { x: mid.x + (nx / nl) * 14 * s + (nb.x - mid.x) * 0.4, y: mid.y + (ny / nl) * 14 * s + (nb.y - mid.y) * 0.4 };
  rig.neckC2 = { x: mid.x - (nx / nl) * 12 * s + (head.x - mid.x) * 0.4, y: mid.y - (ny / nl) * 12 * s + (head.y - mid.y) * 0.4 };
  rig.propHub = null;
  void L;
  return rig;
}

function drawPaintBird(ctx, rig, style = {}) {
  drawRider(ctx, rig, { ...style, showBike: false, showPinwheel: false, showProp: false });
  // the brush held in the spoon
  const s = rig.root.scale;
  const dx = Math.cos(rig.billDir);
  const dy = Math.sin(rig.billDir);
  const a = { x: rig.billTip.x - dx * 6 * s, y: rig.billTip.y - dy * 6 * s };
  const t = rig.brushTip;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#7a4f2e';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(t.x - dx * 9 * s, t.y - dy * 9 * s);
  ctx.stroke();
  ctx.strokeStyle = style.brushPaint || '#3d6b8c';
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(t.x - dx * 9 * s, t.y - dy * 9 * s);
  ctx.lineTo(t.x, t.y);
  ctx.stroke();
  ctx.restore();
}

export default {
  id: 'spoonbill',
  label: '黑面琵鷺',
  labelAlt: 'Black-faced spoonbill',
  actions: ['cycle', 'paint'],
  /** No hands: palette dips go to the water jar; stands closer to the easel. */
  holdsPalette: false,
  easel: { x: 292, scale: 1.45 },
  /** Approximate size at scale 1 (px): bicycle ~260 wide, ~230 tall incl. the prop on its pole. */
  size: { w: 260, h: 230 },
  defaultStyle: DEFAULT_RIDER_STYLE,
  /**
   * @param {object} a  { action:'cycle', x, y (ground), slope, scale, phase (crank rad),
   *                      speedScale, time, worldX, propAngle }
   */
  computeRig(a = {}) {
    if (a.action === 'paint' || a.action === 'stand') return computePaintRig(a);
    return computeRiderRig({
      x: a.x,
      y: a.y,
      slope: a.slope || 0,
      scale: a.scale || 1,
      pedalAngle: a.phase ?? a.pedalAngle ?? 0,
      speedScale: a.speedScale ?? 1,
      time: a.time || 0,
      worldX: a.worldX ?? null,
      pinwheelAngle: a.propAngle ?? a.pinwheelAngle ?? null,
      pose: a.pose || 'ride',
    });
  },
  draw: (ctx, rig, style) => (rig.action === 'paint' ? drawPaintBird(ctx, rig, style) : drawRider(ctx, rig, style)),
  drawMarker,
};
