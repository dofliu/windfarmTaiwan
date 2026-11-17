// src/stages/index.js — stage registry.
//
// A STAGE owns the film-level composition of every frame: how chapters are laid out and
// revealed, the camera, where the character is, the intro hand-off and the outro. The
// player, tools and gallery only ever talk to the selected stage (FILM.stage).
//
// STAGE INTERFACE (default export of src/stages/<id>.js)
// {
//   id: 'gallery-ride', label, labelAlt,
//   action: 'cycle',                  // character action the stage needs (character.actions)
//   scene: { W, H, groundY, edge },   // the canvas each chapter scene draws into
//   view:  { W: 1920, H: 1080 },      // output frame size
//   init(env)                         // once at boot. env = { kit, character, renderChapter }
//                                     //   renderChapter(kit, ctx, chapter, p) runs a scene module
//                                     //   (with placeholder fallback) — see src/scenes/index.js
//   renderFrame(ctx, t) -> beatState  // PURE: draw the whole 1920x1080 frame for film time t
//                                     //   (intro overlay, chapters, ruler, outro cross-fade)
//   chapterParams(chapter, t, opts) -> p   // scene params at film time t (baseParams + stage extras)
//                                     //   opts: { isThumbnail, riderLocalX (gallery-ride) }
//   renderStill(ctx, chapter, localT, opts) -> p  // one scene canvas (W x H) for gallery / shot /
//                                     //   sheet; opts: { isThumbnail, withFrame, riderLocalX }
//   thumbnail(chapter) -> canvas      // cached 300x300 still for the outro axis
// }
//
// Stages: 'gallery-ride' (museum wall + road, character action 'cycle') and 'easel'
// (hilltop painter, valley scene canvas 1920x1080, action 'paint'; a character without
// 'paint' is replaced by the person painter with a warning). Optional extra hook:
// card(chapter) -> canvas (easel: the finished painting of a chapter).
//
// To add a stage: create src/stages/<id>.js with the default export above (copy
// gallery-ride.js or easel.js), register it here, set FILM.staging = '<id>+<character>', and document the
// scene canvas it provides at the top of the file (size, ground line, safe area, extra p fields).

import galleryRide from './gallery-ride.js';
import easel from './easel.js';

export const STAGES = {
  'gallery-ride': galleryRide,
  easel,
};

export function getStage(id) {
  const s = STAGES[id];
  if (!s) {
    console.warn(`[stage] unknown id "${id}", using gallery-ride`);
    return galleryRide;
  }
  return s;
}
