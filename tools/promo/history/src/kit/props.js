// src/kit/props.js
// Props a character carries (on the spoonbill: a pole behind the saddle). One prop per
// chapter (chapter.prop), so the carried object "changes costume" with every chapter.
//
//   drawProp(ctx, hub, angle, opts)
//     hub   { x, y, r }   centre and nominal radius (r = 24 at character scale 1)
//     angle rad           spin / flutter phase (rotor types spin with it; pennants flutter)
//     opts  { type, colors[], stroke, lineWidth, wire, silhouette, time }
//
// Types
//   rotors   paper (toy pinwheel) | sail (square boat sail) | panemone (vertical-axis drum) |
//            chinese (junk-sail VAWT) | post (4 lattice sails) | multiblade (farm water pump) |
//            three | two (modern rotors) | darrieus (eggbeater)
//   other    pennant (swallow-tail flag on the pole; colors [cloth, stripe]) |
//            balloon (colors [skin, highlight]) | lantern (paper lantern; colors [paper, rib]) | none
//
// To add a prop: write a function (ctx, hub, angle, opts) and register it in EXTRA_PROPS.

/**
 * Draw the era-specific mini rotor at `hub` = {x, y, r}.
 * type: 'paper' | 'sail' (boat sail, no spin) | 'panemone' | 'chinese' | 'post' (4 lattice sails)
 *       | 'multiblade' | 'three' | 'two' | 'darrieus' | 'none'
 */
export function drawProp(ctx, hub, angle, opts = {}) {
  const {
    type = 'paper',
    colors = ['#e63946', '#f1c453', '#2a9d8f', '#457b9d'],
    stroke = '#1d1b18',
    lineWidth = 1.4,
    flat = false,
    wire = null,
    silhouette = null,
    time = 0,
  } = opts;
  if (type === 'none') return;
  if (EXTRA_PROPS[type]) return EXTRA_PROPS[type](ctx, hub, angle, opts);
  const { x, y, r } = hub;
  const sc = r / 24;
  const ink = wire || silhouette || stroke;
  const fillOr = (c) => (wire ? 'rgba(0,0,0,0)' : silhouette || c);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, lineWidth * sc);
  ctx.strokeStyle = ink;

  const blade = (a, len, w0, w1, fill) => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const nx = -sa;
    const ny = ca;
    ctx.beginPath();
    ctx.moveTo(x + nx * w0, y + ny * w0);
    ctx.lineTo(x + ca * len + nx * w1, y + sa * len + ny * w1);
    ctx.lineTo(x + ca * len - nx * w1 * 0.4, y + sa * len - ny * w1 * 0.4);
    ctx.lineTo(x - nx * w0 * 0.3, y - ny * w0 * 0.3);
    ctx.closePath();
    ctx.fillStyle = fillOr(fill);
    if (!wire) ctx.fill();
    ctx.stroke();
  };

  if (type === 'paper') {
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const tip = { x: x + ca * r, y: y + sa * r };
      const a2 = a + Math.PI / 2;
      const side = { x: x + Math.cos(a2) * r * 0.62, y: y + Math.sin(a2) * r * 0.62 };
      const fold = { x: x + Math.cos(a + 0.55) * r * 0.86, y: y + Math.sin(a + 0.55) * r * 0.86 };
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tip.x, tip.y);
      ctx.quadraticCurveTo(fold.x, fold.y, side.x * 0.5 + x * 0.5, side.y * 0.5 + y * 0.5);
      ctx.closePath();
      ctx.fillStyle = fillOr(colors[i % colors.length]);
      if (!wire) ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = fillOr('#f4efe4');
    ctx.beginPath();
    ctx.arc(x, y, 2.6 * sc, 0, Math.PI * 2);
    if (!wire) ctx.fill();
    ctx.stroke();
  } else if (type === 'sail') {
    // little square boat sail on a yard: billows, does not spin
    const billow = 3 * Math.sin(time * 3.1) * sc;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - r * 0.9);
    ctx.lineTo(x + r * 0.9, y - r * 0.9);
    ctx.quadraticCurveTo(x + r * 1.05 + billow, y, x + r * 0.9, y + r * 0.9);
    ctx.lineTo(x - r * 0.9, y + r * 0.9);
    ctx.quadraticCurveTo(x - r * 0.75 + billow, y, x - r * 0.9, y - r * 0.9);
    ctx.closePath();
    ctx.fillStyle = fillOr(colors[0]);
    if (!wire) ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 1.05, y - r * 0.9);
    ctx.lineTo(x + r * 1.05, y - r * 0.9);
    ctx.moveTo(x - r * 1.05, y + r * 0.9);
    ctx.lineTo(x + r * 1.05, y + r * 0.9);
    ctx.stroke();
  } else if (type === 'panemone' || type === 'chinese') {
    // vertical-axis drum seen from the side: vanes sweep horizontally (cos projection)
    const n = type === 'chinese' ? 8 : 6;
    const h = r * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.62);
    ctx.lineTo(x, y + h * 0.62);
    ctx.stroke();
    const vanes = [];
    for (let i = 0; i < n; i++) {
      const a = angle * 0.6 + (i * Math.PI * 2) / n;
      vanes.push({ a, z: Math.sin(a), px: Math.cos(a) * r });
    }
    vanes.sort((A, B) => A.z - B.z);
    for (const v of vanes) {
      const w = r * 0.42 * (0.35 + 0.65 * Math.abs(Math.sin(v.a)));
      const shade = v.z < 0 ? 0.65 : 1;
      ctx.globalAlpha = shade;
      ctx.fillStyle = fillOr(colors[(vanes.indexOf(v) + 1) % colors.length]);
      if (type === 'chinese') {
        // junk-style battened sail
        ctx.beginPath();
        ctx.moveTo(x + v.px, y - h * 0.5);
        ctx.lineTo(x + v.px + Math.sign(v.px || 1) * w, y - h * 0.42);
        ctx.lineTo(x + v.px + Math.sign(v.px || 1) * w, y + h * 0.45);
        ctx.lineTo(x + v.px, y + h * 0.5);
        ctx.closePath();
        if (!wire) ctx.fill();
        ctx.stroke();
        for (let k = 1; k < 4; k++) {
          const yy = y - h * 0.5 + (h * k) / 4;
          ctx.beginPath();
          ctx.moveTo(x + v.px, yy);
          ctx.lineTo(x + v.px + Math.sign(v.px || 1) * w, yy + 1);
          ctx.stroke();
        }
      } else {
        ctx.fillRect(x + v.px - w / 2, y - h * 0.5, w, h);
        ctx.strokeRect(x + v.px - w / 2, y - h * 0.5, w, h);
      }
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(x - r * 1.1, y - h * 0.58);
    ctx.lineTo(x + r * 1.1, y - h * 0.58);
    ctx.moveTo(x - r * 1.1, y + h * 0.58);
    ctx.lineTo(x + r * 1.1, y + h * 0.58);
    ctx.stroke();
  } else if (type === 'post') {
    // four lattice sails with cloth
    for (let i = 0; i < 4; i++) {
      const a = angle * 0.55 + (i * Math.PI) / 2 + Math.PI / 4;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const nx = -sa;
      const ny = ca;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ca * r * 1.15, y + sa * r * 1.15);
      ctx.stroke();
      const w = r * 0.34;
      ctx.beginPath();
      ctx.moveTo(x + ca * r * 0.25, y + sa * r * 0.25);
      ctx.lineTo(x + ca * r * 1.1, y + sa * r * 1.1);
      ctx.lineTo(x + ca * r * 1.1 + nx * w, y + sa * r * 1.1 + ny * w);
      ctx.lineTo(x + ca * r * 0.25 + nx * w, y + sa * r * 0.25 + ny * w);
      ctx.closePath();
      ctx.fillStyle = fillOr(colors[0]);
      if (!wire) ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      for (let k = 1; k < 4; k++) {
        const f = 0.25 + (0.85 * k) / 4;
        ctx.moveTo(x + ca * r * f, y + sa * r * f);
        ctx.lineTo(x + ca * r * f + nx * w, y + sa * r * f + ny * w);
      }
      ctx.stroke();
    }
  } else if (type === 'multiblade') {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = angle * 0.8 + (i * Math.PI * 2) / n;
      blade(a, r * 1.05, r * 0.1, r * 0.17, colors[i % 2 === 0 ? 0 : 1]);
    }
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = fillOr(colors[2] || '#555');
    ctx.beginPath();
    ctx.arc(x, y, r * 0.16, 0, Math.PI * 2);
    if (!wire) ctx.fill();
    ctx.stroke();
  } else if (type === 'three' || type === 'two') {
    const n = type === 'three' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = angle * 0.5 + (i * Math.PI * 2) / n;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const nx = -sa;
      const ny = ca;
      const L = r * 1.25;
      ctx.beginPath();
      ctx.moveTo(x + nx * r * 0.08, y + ny * r * 0.08);
      ctx.quadraticCurveTo(x + ca * L * 0.3 + nx * r * 0.2, y + sa * L * 0.3 + ny * r * 0.2, x + ca * L, y + sa * L);
      ctx.quadraticCurveTo(x + ca * L * 0.5 - nx * r * 0.02, y + sa * L * 0.5 - ny * r * 0.02, x - nx * r * 0.08, y - ny * r * 0.08);
      ctx.closePath();
      ctx.fillStyle = fillOr(colors[0]);
      if (!wire) ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = fillOr(colors[1] || '#ccc');
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.16, r * 0.16, 0, 0, Math.PI * 2);
    if (!wire) ctx.fill();
    ctx.stroke();
  } else if (type === 'darrieus') {
    // eggbeater: two curved blades around a vertical shaft, rotating (width ~ |cos|)
    const h = r * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.62);
    ctx.lineTo(x, y + h * 0.62);
    ctx.stroke();
    for (let i = 0; i < 2; i++) {
      const a = angle * 0.6 + i * Math.PI;
      const wx = Math.cos(a) * r * 0.95;
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.5);
      ctx.bezierCurveTo(x + wx * 1.35, y - h * 0.3, x + wx * 1.35, y + h * 0.3, x, y + h * 0.5);
      ctx.lineWidth = Math.max(1, 2.6 * sc);
      ctx.strokeStyle = Math.sin(a) < 0 && !wire && !silhouette ? colors[1] || ink : wire || silhouette || colors[0];
      ctx.stroke();
    }
    ctx.strokeStyle = ink;
  }
  ctx.restore();
}


// -----------------------------------------------------------------------------
// Non-rotor props
// -----------------------------------------------------------------------------
function pennant(ctx, hub, angle, opts) {
  const { colors = ['#c8102e', '#f1c40f'], stroke = '#1d1b18', lineWidth = 1.4, wire = null, silhouette = null, time = 0 } = opts;
  const { x, y, r } = hub;
  const sc = r / 24;
  const ink = wire || silhouette || stroke;
  const fill = (c) => (wire ? 'rgba(0,0,0,0)' : silhouette || c);
  // the cloth streams back (−x) from the pole top and ripples with a travelling wave
  const L = r * 2.3;
  const H = r * 1.25;
  const ph = time * 9 + angle * 0.15;
  const wave = (u) => Math.sin(ph - u * 5.2) * r * 0.16 * (0.25 + u);
  const N = 10;
  const top = [];
  const bot = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const half = (H / 2) * (1 - 0.18 * u);
    top.push({ x: x - u * L, y: y - H / 2 + wave(u) - half * 0 });
    bot.push({ x: x - u * L, y: y + H / 2 - (H * 0.18 * u) + wave(u) });
  }
  // swallow-tail notch
  const notch = { x: x - L * 0.78, y: (top[N].y + bot[N].y) / 2 };
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, lineWidth * sc);
  ctx.strokeStyle = ink;
  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  for (let i = 1; i <= N; i++) ctx.lineTo(top[i].x, top[i].y);
  ctx.lineTo(notch.x, notch.y);
  ctx.lineTo(bot[N].x, bot[N].y);
  for (let i = N - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y);
  ctx.closePath();
  ctx.fillStyle = fill(colors[0]);
  if (!wire) ctx.fill();
  ctx.stroke();
  // stripe through the middle
  if (colors[1] && !silhouette) {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = wire || colors[1];
    ctx.lineWidth = H * 0.22;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const mid = (top[i].y + bot[i].y) / 2;
      if (i === 0) ctx.moveTo(top[i].x, mid);
      else ctx.lineTo(top[i].x, mid);
    }
    ctx.stroke();
    ctx.restore();
  }
  // finial
  ctx.fillStyle = fill(colors[1] || '#d9b44a');
  ctx.beginPath();
  ctx.arc(x, y - H / 2 - 3 * sc, 3.2 * sc, 0, Math.PI * 2);
  if (!wire) ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function balloon(ctx, hub, angle, opts) {
  const { colors = ['#e63946', '#ffd6d9'], stroke = '#1d1b18', lineWidth = 1.4, wire = null, silhouette = null, time = 0 } = opts;
  const { x, y, r } = hub;
  const sc = r / 24;
  const sway = Math.sin(time * 2.1) * r * 0.25;
  const bx = x + sway - r * 0.2;
  const by = y - r * 0.9;
  ctx.save();
  ctx.lineWidth = Math.max(0.8, lineWidth * sc);
  ctx.strokeStyle = wire || silhouette || stroke;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.2);
  ctx.quadraticCurveTo(x + sway * 0.4 + r * 0.25, y - r * 0.1, bx, by + r * 0.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(bx, by, r * 0.78, r * 0.95, sway * 0.01, 0, Math.PI * 2);
  ctx.fillStyle = wire ? 'rgba(0,0,0,0)' : silhouette || colors[0];
  if (!wire) ctx.fill();
  ctx.stroke();
  if (!wire && !silhouette) {
    ctx.fillStyle = colors[1] || 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(bx - r * 0.3, by - r * 0.35, r * 0.16, r * 0.26, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function lantern(ctx, hub, angle, opts) {
  const { colors = ['#d62828', '#f4d35e'], stroke = '#1d1b18', lineWidth = 1.4, wire = null, silhouette = null, time = 0 } = opts;
  const { x, y, r } = hub;
  const sc = r / 24;
  const swing = Math.sin(time * 2.6) * 0.18;
  ctx.save();
  ctx.translate(x, y - r * 0.4);
  ctx.rotate(swing);
  ctx.lineWidth = Math.max(0.8, lineWidth * sc);
  ctx.strokeStyle = wire || silhouette || stroke;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.2);
  ctx.lineTo(0, r * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, r * 1.0, r * 0.62, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fillStyle = wire ? 'rgba(0,0,0,0)' : silhouette || colors[0];
  if (!wire) ctx.fill();
  ctx.stroke();
  if (!silhouette) {
    ctx.strokeStyle = wire || colors[1] || '#f4d35e';
    for (const k of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.ellipse(0, r * 1.0, r * 0.62 * Math.abs(Math.cos(k * 1.4)), r * 0.72, 0, -Math.PI / 2, Math.PI / 2, k < 0);
      ctx.stroke();
    }
  }
  ctx.fillStyle = wire ? 'rgba(0,0,0,0)' : silhouette || colors[1] || '#f4d35e';
  ctx.fillRect(-r * 0.3, r * 0.22, r * 0.6, r * 0.12);
  ctx.fillRect(-r * 0.3, r * 1.66, r * 0.6, r * 0.12);
  ctx.restore();
}

const EXTRA_PROPS = { pennant, balloon, lantern };

/** All prop type ids (for docs / validation). */
export const PROP_TYPES = ['paper', 'sail', 'panemone', 'chinese', 'post', 'multiblade', 'three', 'two', 'darrieus', ...Object.keys(EXTRA_PROPS), 'none'];

/** Back-compat alias used by the reference scenes. */
export const drawPinwheel = drawProp;
