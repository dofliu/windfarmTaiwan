// src/scenes/index.js
// Chapter scene registry. Every chapter in src/data/chapters.js names a scene module
// (chapter.scene, default chapter.id); register each module here with a static import so
// the single-file build can bundle it. Missing modules / thrown errors fall back to the
// placeholder renderer (and the error is logged once as [scene-error:<id>]).
//
// SCENE CONTRACT (see SCENE_GUIDE.md):
//   export function render(kit, ctx, p) { ... }
//   export const meta = { stages: ['gallery-ride'] }   // optional: stages the scene supports
//   ctx is a W x H canvas (p.W, p.H), already cleared; p is built by the active stage.

import { renderPlaceholder } from './placeholder.js';
import * as blyth from './blyth.js';
import * as putnamL from './putnam.js';
import * as gedserL from './gedser.js';
import * as tvind from './tvind.js';
import * as californiaL from './altamont.js';
import { legacy } from './legacy.js';
import * as vindeby from './vindeby.js';
import * as hornsrev from './hornsrev.js';
import * as hywind from './hywind.js';
import * as formosa from './formosa.js';
import * as dongfang from './dongfang.js';

export const SCENE_MODULES = {
  blyth,
  putnam: legacy(putnamL),
  gedser: legacy(gedserL),
  tvind,
  altamont: legacy(californiaL),
  vindeby,
  hornsrev,
  hywind,
  formosa,
  dongfang,
};

const errorOnce = new Set();

/** Render one chapter scene into ctx (W x H, cleared by the caller). */
export function renderChapter(kit, ctx, chapter, p) {
  const id = chapter.scene || chapter.id;
  const mod = SCENE_MODULES[id];
  ctx.save();
  try {
    const supported = !mod || !mod.meta || !mod.meta.stages || mod.meta.stages.includes(p.stage);
    if (mod && typeof mod.render === 'function' && supported) mod.render(kit, ctx, p);
    else {
      if (mod && !supported && !errorOnce.has(`stage:${id}`)) {
        errorOnce.add(`stage:${id}`);
        console.warn(`[scene] "${id}" does not support stage "${p.stage}" (meta.stages = ${JSON.stringify(mod.meta.stages)}); placeholder used`);
      }
      renderPlaceholder(kit, ctx, p);
    }
  } catch (err) {
    if (!errorOnce.has(id)) {
      errorOnce.add(id);
      console.error(`[scene-error:${id}]`, err);
    }
    ctx.restore();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, p.W, p.H);
    renderPlaceholder(kit, ctx, p);
  }
  ctx.restore();
}
