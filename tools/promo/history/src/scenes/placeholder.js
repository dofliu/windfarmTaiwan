// src/scenes/placeholder.js
// Fallback "animatic" renderer used for any chapter whose module is missing or throws.
// Also documents the scene contract by example: render(kit, ctx, p).

import { UI } from '../data/i18n.js';

export function renderPlaceholder(kit, ctx, p) {
  const { W, H, chapter } = p;
  const G = p.groundY ?? Math.round(H * 0.7);
  const [c0, c1, c2, c3, c4] = chapter.palette || ['#ddd', '#333', '#777', '#999', '#111'];

  const bg = kit.bake(`placeholder_${chapter.id}_${p.stage}`, W, H, (g, rng) => {
    const sky = g.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, c0);
    sky.addColorStop(1, kit.mixColor(c0, c3, 0.35));
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    g.fillStyle = kit.mixColor(c2, c0, 0.4);
    g.fillRect(0, G, W, H - G);
    g.strokeStyle = c1;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(0, G);
    g.lineTo(W, G);
    g.stroke();
    kit.addGrain(g, W, H, rng, 0.03);
    g.fillStyle = kit.rgba(c4, 0.75);
    g.font = `700 54px ${kit.FONT.serif}`;
    g.fillText(chapter.title || chapter.id, 60, 120);
    g.font = `500 26px ${kit.FONT.sans}`;
    g.fillText(`${chapter.style || ''} ${UI.placeholder}`, 62, 165);
  });
  ctx.drawImage(bg, 0, 0);

  // a big version of the chapter's prop as the "machine"
  const hub = { x: W * 0.7, y: G * 0.5, r: Math.min(W, H) * 0.12 };
  ctx.strokeStyle = c1;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(hub.x, hub.y);
  ctx.lineTo(hub.x, G - 6);
  ctx.stroke();
  kit.drawProp(ctx, hub, p.t * 2.2, { ...(p.prop || {}), stroke: c1, lineWidth: 2, time: p.t });

  if (p.actor && p.actor.visible) p.actor.drawDefault(ctx);
}
