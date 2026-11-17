// src/characters/index.js — character registry.
//
// CHARACTER INTERFACE (default export of src/characters/<id>.js)
// {
//   id: 'spoonbill',
//   label, labelAlt,                       // display names
//   actions: ['cycle', ...],               // actions this character can perform
//                                          //   'cycle' -> gallery-ride stage (rides a bicycle)
//                                          //   'paint' -> easel stage (paints at an easel); paint args:
//                                          //     brush {x,y} tip target, lift 0..1, look -1..1, nod 0..1,
//                                          //     walk {phase, amount}, wind, brushLen, brushPref (rad)
//   holdsPalette?: false                   // (easel) no palette hand: colour is loaded from the jar
//   easel?: { x, scale }                   // (easel) where / how big the painter stands (default 240, 1.5)
//   size: { w, h },                        // approx. bounding box at scale 1 (px)
//   defaultStyle: { ... },                 // every colour / switch draw() understands
//   computeRig(a) -> rig                   // PURE. a = { action, x, y (ground contact), slope, scale,
//                                          //   phase (rad; one cycle per 2 beats), speedScale (0..1),
//                                          //   time (s), worldX, propAngle (rad), ...action extras }
//                                          // rig must include: root {x,y,scale,slope}, time,
//                                          //   propHub {x,y,r} (where the chapter prop is drawn, or null)
//   draw(ctx, rig, style)                  // style = { ...defaultStyle overrides, prop: {type, colors},
//                                          //   showProp, silhouette: '#111' | null, wire: '#fff' | null,
//                                          //   outline, outlineWidth, lineScale }
//   drawMarker(ctx, x, y, style)           // ~30x16 px icon for the time-ruler progress marker
// }
//
// Scenes normally do not call the character directly: the stage hands them p.actor
// (see src/stages/index.js), which already knows the character, action, position and colours.
//
// To add a character: create src/characters/<id>.js with the default export above, import
// it here, add it to CHARACTERS, then select it in film.config.js (staging: '<stage>+<id>').
// Characters: spoonbill (cycle, paint: brush in the bill), person (cycle, paint, stand).

import spoonbill from './spoonbill.js';
import person from './person.js';

export const CHARACTERS = {
  spoonbill,
  person,
};

/** Resolve the configured character; unknown ids fall back to the spoonbill with a warning. */
export function getCharacter(id) {
  const c = CHARACTERS[id];
  if (!c) {
    console.warn(`[character] unknown id "${id}", using spoonbill`);
    return spoonbill;
  }
  return c;
}
