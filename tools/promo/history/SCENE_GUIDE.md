# Scene Author Guide

Each chapter is one ES module in `src/scenes/<id>.js` that paints the chapter's
**scene canvas**. The selected **stage** (`FILM.stage`) decides how that canvas is shown
(framed panel on a museum wall, valley below an easel …), where the character is and how
chapters hand over. This guide is the contract.

## 1. The contract

```js
// src/scenes/<id>.js
export const meta = { stages: ['gallery-ride'] };   // stages this scene is written for (optional)

export function render(kit, ctx, p) {
  // ctx: CanvasRenderingContext2D of p.W x p.H, already cleared, transform reset
  ...
}
```

Register it in `src/scenes/index.js` (`node tools/new-scene.mjs <id>` does both).
A chapter uses the module named by `chapter.scene` (default `chapter.id`); several chapters
may share one module. A module whose `meta.stages` does not include the active stage, a
missing module and a module that throws all fall back to the placeholder (logged once).

### `p` — fields every stage provides (`src/stages/common.js`)

| field | meaning |
|---|---|
| `chapter` (alias `scene`) | the chapter record from `chapters.js` + `index`, `num`, `t0`, `t1` |
| `index`, `num` | 0-based index / 1-based number |
| `t` | global film time (s) |
| `localT` | time inside the chapter, clamped to `[0, chapterSec]` |
| `rawLocalT` | unclamped (negative before the chapter starts, `> chapterSec` after) — **animate with this** so the scene is alive while it slides in / out |
| `chapterSec`, `u` | chapter length (s); `localT / chapterSec` |
| `beat` | `{ bpm, beatSec, barSec, beat, bar, beatInBar, beatFrac, pulse(len) }` relative to the chapter's downbeat; time story beats with `barSec` (never hard-code 2 s or 8 s: BPM and bars per chapter are configurable) |
| `W`, `H` | scene canvas size |
| `stage` | active stage id |
| `isThumbnail` | render a calm, representative frame (outro axis, gallery) |
| `prop` | the chapter's prop (`chapter.prop` or `FILM.defaultProp`) |
| `palette` | `chapter.palette` |
| `actor` | character API for this canvas, or `null` when the stage draws the character itself |

### Stage `gallery-ride` (1000 × 1000)

* Road at **y = 700 with zero slope at x = 0 and x = 1000** — adjacent panels join there and
  the rider crosses frame edges. `kit.sampleRoad(x, arch)` returns a valid arched road;
  pass the same `arch` to `p.actor.rig({ arch })`.
* The outer 26 px of each side are covered by the frame; the museum placard under the frame
  already prints number / date / title / caption — **no modern title cards** in the scene.
  Medium-native inscriptions are welcome.
* The panel is on screen from `rawLocalT ≈ −chapterSec` to `≈ +2·chapterSec`.
* Extra fields: `groundY` (700), `action` ('cycle'), `riderLocalX` (0 → 1000 during the
  chapter), `riderWorldX`, `pedalAngle` (= `phase`), `speedScale`, `pinwheelAngle` (= `propAngle`).
* `p.actor = { visible, x, rig(opts), draw(ctx, rig, style), drawDefault(ctx, opts) }`
  — the scene draws the rider so it can restyle it:
  `if (p.actor.visible) p.actor.draw(ctx, p.actor.rig({ arch }), STYLE)`.
  The bicycle centre is at `riderLocalX`, wheels on the road, figure ≈ 230 px tall incl. the
  prop on its pole (top ≈ y 470). Below the road (y 700–1000) is foreground / margin.

### Stage `easel` (1920 × 1080 valley, see `src/stages/easel.js` + `src/stages/easel/geom.js`)

The scene is the **valley** behind and below a hilltop; the stage draws the hill, the easel,
the painter and the board that shows the chapter being painted. `p.actor = null`.

```
 y  0 ┌───────────────────────── ruler + paper haze (top ~70 px) ─────────────────────────┐
      │  paper veil (upper left)                 ┌──────────── p.safe ───────────────┐    │
  330 │ ┌easel+board┐                            │  x 760–1760, y 110–940            │    │
  430 │ │  painter  │ ─ ─ ─ ─ ─ horizonY 430 ─ ─ │  layout box (1000-unit design):   │ ─ ─│
  720 │ │           │ ─ ─ ─ ─ ─ groundY 720 ─ ─ ─│  x 840–1740, y 50–950 (s = 0.9)   │ ─ ─│
  760 │▓▓▓ hill crest ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╲          └───────────────────────────────────┘    │
 1080 └▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╲ (reaches the bottom edge at x ≈ 1110) ────────────┘
```

* Canvas **1920 × 1080**, composited 1:1 full-bleed (optional push-in: `PUSH` in easel.js).
* **Covered**: everything left of x ≈ 640 below y ≈ 300 (painter, easel, board) and the hill
  (crest from y ≈ 760 at x 600 falling to the bottom edge at x ≈ 1110) — polygon `p.cover`;
  the top ~70 px (ruler + haze); a ragged 60–160 px paper fade on the other edges; a soft paper
  veil over the upper left.
* Keep the key subject inside **`p.safe = { x: 760, y: 110, w: 1000, h: 830 }`** (clear of the ragged paper fade; `--guides` draws the fade). Horizon near
  **`p.horizonY = 430`**, valley-floor figures stand around **`p.groundY = 720`**.
* The board's miniature is cut from a calm mid-chapter still: by default a wide band through
  the layout box (`x 840–1740`), placed where the picture varies most across x (the subject). Override per chapter with
  `chapter.easel = { crop: [x, y, w, h] }` (aspect ≈ 2.9 : 1). Optional `easel.ink`,
  `easel.dateInk`, `easel.seal` colours for the board text / seal.
* No title cards in the valley: the board already shows date + title.
* Chapter changes are a one-beat paper-wash wipe (left → right) centred on the bar line; the
  incoming scene is rendered from `rawLocalT ≈ −0.25 s`, so animate with `rawLocalT`.
* Check coverage with `node tools/shot.mjs panel <id> 4 out/<id> --stage easel --guides`.

### Writing one scene for both stages

**Fastest: a look skeleton** (`node tools/new-scene.mjs <id> --look <look>`; `new_film.mjs` already
picked one per chapter from its medium). Looks: `engraving poster blueprint newsreel screen pixel
ink fresco` (`tools/scene-looks.mjs`). The skeleton already reads as the medium on BOTH stages: baked
background + textured ground band, a placeholder subject drawn with the medium's technique, a
bar-3 beat, the restyled rider and the medium's overlay (film grain, CRT …). It draws on `p.W × p.H`
directly: the subject goes in the focus box `F` (`p.safe` on easel, the panel above the road on
gallery-ride) and stands on `p.groundY`. Replace the blocks marked `// REPLACE:` (check_film fails
while any are left) and adjust `paintBackground()` to the setting.

The other two ways, shown by `node tools/new-scene.mjs <id> --look plain` (square, both stages) and
`node tools/new-scene.mjs <id> --wide` (native easel valley):

1. **Design square** (what the demo scenes do): draw in a 1000 × 1000 design space and map it
   with `kit.layout(p)` → `{ x, y, s, x0, x1, y0, y1 }` (identity on gallery-ride; the easel's
   layout box on easel). `x0..x1` / `y0..y1` are the whole canvas in design units — use them to
   extend spawn ranges (e.g. the tablet's flock walks the full valley width).
   `kit.wideBackdrop(key, bg, p, { mode })` turns the 1000² background bake into a full-canvas
   backdrop: `'mirror'` (mirror-tiles: textures, reliefs, registers — tablet), `'edge'`
   (stretches averaged edge bands outward: horizontal bands continue — ballpoint poster), or
   `{ mode: 'edge', fill: 'corner' }` (plain paper margins — quill page). Overlays meant to cover
   the whole canvas (lighting, grain) are drawn over `x0, y0, x1 − x0, y1 − y0`.
   ```js
   const L = kit.layout(p);
   ctx.drawImage(kit.wideBackdrop('my_bg_v1', bg, p, { mode: 'mirror' }), 0, 0);
   ctx.translate(L.x, L.y); ctx.scale(L.s, L.s);   // then draw exactly as on the panel
   if (p.actor && p.actor.visible) p.actor.draw(ctx, p.actor.rig(), STYLE); // rider: gallery-ride only
   ```
   Fields that only exist on one stage (`riderLocalX`, `actor`) must be guarded
   (`p.riderLocalX ?? -1e4`).
2. **Native wide**: `meta = { stages: ['easel'] }`, draw directly on `p.W × p.H` using
   `p.safe`, `p.horizonY`, `p.groundY`. Best for landscape subjects (a city across decades, a
   process along a valley). Branch on `p.stage` if one module should serve both.

## 2. Hard rules

1. **Deterministic.** Never `Math.random`, `Date`, `performance.now`. Use `kit.makePRNG(seed)`,
   `kit.hash11`, `kit.noise1/noise2/fbm2`. Same inputs → same pixels.
2. **Performance: < 12 ms per scene frame** (check `--timing`; the demo scenes run < 1 ms).
   Bake everything static once with `kit.bake('<id>_name_v1', w, h, (g, rng, w, h) => …)` and
   `ctx.drawImage` it each frame. No per-frame `getImageData`, `ctx.filter`, or big pixel loops.
3. **No external assets** (no images, no fetch). Canvas 2D only.
4. **Text:** primary language per `FILM.lang` (Traditional Chinese, Taiwan usage, by default);
   Latin display faces (`kit.FONT.blackletter / poster / pixel …`) for Latin text only.
   No real brand logos or trademarks; generic period wording.
5. **Leave ctx clean**: `ctx.save()/restore()`, reset `globalAlpha` / `globalCompositeOperation`.
   **Never call `ctx.setTransform` / `resetTransform`**: ctx may arrive transformed (gallery
   thumbnails, the easel push-in). Use `save` → `translate/scale/rotate` → `restore`.
6. **Accuracy:** machines, tools, costumes follow the sources in `chapters.js`.
7. **Thumbnails are a fixed frame**: when `p.isThumbnail`, draw a calm representative state that
   does not depend on `p.rawLocalT`, `p.beat.pulse()` or anything else time-varying.
8. **Negative time**: `p.rawLocalT` is negative while the panel slides in, and JS `%` keeps the
   sign: use `((x % n) + n) % n` for loops; never pass a negative radius / size to `arc`.
9. **Full-frame blits**: draw full-size baked layers unscaled at whole-pixel offsets
   (~0.7 ms). A scaled or sub-pixel full-frame `drawImage` costs ~6 ms at 1920 × 1080.
10. **Text glyphs**: any text is fine (tools/glyphs.mjs preloads every non-ASCII character used in
    `src/`), but text built at runtime from data outside `src/` must go in `FILM.extraGlyphs`.

## 3. Composition

* One big, accurate, animated main subject; 3 depth layers (back / mid / fore).
* One **story beat** timed to the music (usually bar 3: `T` in `[2·barSec, 3·barSec]`).
* The medium must be unmistakable at a glance (texture, line quality, palette, layout
  conventions of that art form). Museum quality, not clip-art.

## 4. Re-styling the character

Characters (`FILM.staging = '<stage>+<character>'`): `spoonbill` (actions cycle, paint — brush in
the bill) and `person` (cycle, paint, stand; style keys `skin, skinShade, hair, hairStyle
('bob'|'short'|'bun'|'ponytail'), top, topShade, trousers, shoes, hat ('beret'|'straw'|'cap'|'none'),
hatColor, hatBand, scarf, scarfColor, scarfStripe` + the bicycle keys below + `silhouette`,
`wire`, `outline`, `outlineWidth`, `lineScale`). Scenes only restyle the rider on gallery-ride.

`p.actor.draw(ctx, rig, style)` / `kit.drawRider(ctx, rig, style)` — for the spoonbill:

```js
{
  plumage, plumageShade, mask, bill, eyeRing, legs, crest, breast,   // bird colours
  frame, frameShade, metal, tire, rim, saddle,                       // bicycle colours
  outline: '#1b1a18', outlineWidth: 1.5, lineScale: 1,
  silhouette: null,   // '#111' -> flat silhouette (shadow puppet, relief shadow …)
  wire: null,         // '#e8f1ff' -> line art only (blueprint, engraving)
  shading: true, spokes: 12,
  prop: { type, colors },   // default: the chapter prop; recolour it into the medium
  showProp: true,
}
```

Film-level colour overrides from `FILM.character.colors` are applied underneath. For a
bespoke look, draw from the rig points (`rig.rearWheel`, `rig.frontWheel`, `rig.bb`,
`rig.body`, `rig.head`, `rig.billTip`, `rig.nearKnee`, `rig.propHub` …) or draw the default
offscreen and post-process. Props: `kit.drawProp(ctx, hub, angle, { type, colors, … })`,
types in `src/kit/props.js`.

## 5. Kit helpers

`kit.W/H`, `kit.bake`, `kit.layout(p)`, `kit.wideBackdrop(key, img, p, opts)`, `kit.sampleRoad`, `kit.drawProp`, `kit.computeRiderRig`, `kit.drawRider`,
`kit.makePRNG`, `kit.hashSeed`, `kit.hash11`, `kit.hash21`, `kit.noise1`, `kit.noise2`, `kit.fbm2`,
`kit.clamp`, `kit.lerp`, `kit.smoothstep`, `kit.smootherstep`, `kit.envelope(x,e0,e1,e2,e3)`,
`kit.quantizeTime(t,hz)`, `kit.createCanvas`, `kit.rgba(hex,a)`, `kit.mixColor(a,b,t)`,
`kit.hexToRgb`, `kit.sampleCubic`, `kit.wobblyLine`, `kit.addGrain` / `kit.addBlotches` /
`kit.vignette` (bake-time), `kit.wrapText`, `kit.FONT.{serif,sans,kai,mono,blackletter,
engraving,garamond,didone,poster,pixel,terminal}`.

### Medium helpers (`src/kit/media.js`, all on `kit`)

| helper | when | what |
|---|---|---|
| `kit.paper(key, w, h, {color, grain, blotches, foxing, fibers, vignette, edgeDarken})` → canvas | bake | paper, parchment, plaster, card, newsprint |
| `kit.halftoneShade(g, x, y, w, h, {cell, color, angle, maxR, tone(u,v), clipFn})` | bake | print dots sized by tone (poster skies, sun, shading) |
| `kit.dots(ctx, {cell, r, color, angle, bg})` → CanvasPattern | frame | flat halftone screen as `fillStyle` |
| `kit.stipple(g, x, y, w, h, {density, r, color, tone, seed})` | bake | stipple engraving, dust, spray |
| `kit.hatch(g, {x, y, w, h, spacing, angle, color, width, cross, wobble, taper, clipFn})` | both | parallel / cross hatching inside the current clip (rebuild your path afterwards) |
| `kit.wash(g, x, y, w, h, color, {alpha, layers, rough, rim, granulate, shape: 'ellipse'/'rect'/'ridge', peaks})` | bake | watercolour / ink-wash blots, mountain ranges |
| `kit.inkLine(ctx, pts, {width, color, taper: true/'start'/'end', pressure, alpha})` | frame | tapered brush / pen stroke |
| `kit.emboss(ctx, pathFn, {fill, light, dark, depth})` | frame | relief, clay, coins, embossed card |
| `kit.misregister(ctx, (ctx, color, i) => …, {colors, offsets})` | frame | 2–3 ink screen print off register |
| `kit.glow(ctx, x, y, r, color, alpha)` | frame | additive glow sprite (lamps, neon, screens) |
| `kit.scanlines(ctx, w, h, {gap, alpha, roll, T})` / `kit.crt(ctx, w, h, T, {tint, vignette, flicker})` | frame | CRT / terminal / HUD screens (draw last) |
| `kit.filmLook(ctx, w, h, T, {grain, flicker, scratches, dust, vignette, sepia})` + `kit.gateWeave(T)` | frame | newsreel / silent film (overlay last; translate the picture by the weave) |
| `kit.pixelate(ctx, key, w, h, cell, g => …)` | frame | pixel art: draw normally into `g`, it comes out in hard pixels |

## 6. Checking your work

```bash
node tools/validate.mjs                                         # config / chapters / registry
node tools/shot.mjs panel <id> 0.5,4,7.5 out/<id> --timing      # scene stills + perf (out/<id> is a file PREFIX -> out/<id>_lt4.png)
node tools/shot.mjs panel <id> 4 out/<id>_thumb --thumb --x 500 # outro thumbnail
node tools/shot.mjs film <t0-0.4>,<t0+4>,<t1-0.2> out/<id>_film # in context, incl. frame crossings
node tools/sheet.mjs                                            # every chapter at 3 moments
node tools/shot.mjs panel <id> 4 out/<id>_e --stage easel --guides   # easel valley + coverage guides
node tools/shot.mjs film 10,13.9 out/e --staging easel+person   # whole frames in another staging
```

`t0 = introSec + chapterSec × (num − 1)` (`node tools/validate.mjs` prints both). Look at
the PNGs. The tools print browser console errors — there must be none.

## 7. Porting a reference scene (`references/examples/`)

The examples live in the skill, not in the project: `<skill>/references/examples/` (the path is
recorded as `examples` in `film.options.json`). The skill's QA runner is
`<skill>/scripts/check_film.mjs <project>`.

Those modules use the older signature `render(kit, slot, scene, params)`:
`slot.ctx` → `ctx`, `scene` → `p.chapter`, `params.*` → `p.*`, `scene.zh/en` → `title/titleAlt`,
`scene.pinwheel` → `p.prop`, `kit.riderVisible(params)` → `p.actor.visible`,
`kit.riderRig(params, o)` → `p.actor.rig(o)`, hard-coded `8` s / `2` s → `p.chapterSec` / `p.beat.barSec`.

Or run one unchanged through the adapter in `src/scenes/legacy.js` (gallery-ride only; it
renders pixel-identically to the reference film):

```js
import * as gedser from './gedser.js';          // copied from references/examples/
import { legacy } from './legacy.js';
export const SCENE_MODULES = { ..., gedser: legacy(gedser) };
```

Legacy scenes assume 8 s chapters at 120 BPM for their story beats.
