// src/scenes/legacy.js — run a scene written for the older signature render(kit, slot, scene, params)
// (e.g. references/examples/*.js) under the current contract, unchanged.
export function legacy(mod) {
  return {
    meta: { stages: ['gallery-ride'] },
    render(kit, ctx, p) {
      const c = p.chapter;
      const scene = { ...c, zh: c.title, en: c.titleAlt, styleEn: c.styleAlt, pinwheel: p.prop };
      mod.render(kit, { ctx, canvas: ctx.canvas }, scene, p);
    },
  };
}
