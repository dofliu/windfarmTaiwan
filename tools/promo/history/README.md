# History timeline film — template

A deterministic, 100 % procedural animated timeline: `renderAt(t)` is a pure function of
time, chapters are drawn in their own art media, the soundtrack is synthesised in the
browser, and everything is driven by two data files. The demo (3 chapters, 42 s) is
《書寫的旅程》, a short history of writing tools.

```bash
node tools/serve.mjs                         # http://127.0.0.1:4173/  player · gallery.html · render.html
node tools/validate.mjs                      # check config + chapters + scene registry
node tools/presets.mjs                       # list the music presets
node tools/test-presets.mjs                  # run every preset once (sanity after editing presets.js)
node tools/new-scene.mjs <id>                # scaffold + register a scene module
node tools/shot.mjs panel <id> 0.5,4,7.5 out/<id> --timing
node tools/shot.mjs film 10,20 out/film      # whole frames (add --staging easel+person for another staging)
node tools/sheet.mjs                         # contact sheet out/sheet.png
node tools/check-audio.mjs --determinism     # loudness per chapter, peak, NaN, bit-identical renders
node tools/render-audio.mjs                  # out/soundtrack.wav
node tools/render.mjs --audio out/soundtrack.wav             # out/film.mp4 (ffmpeg)
npm install && node tools/build.mjs          # dist/ single-file pages (+ dist/artifact/)
```

Every browser tool accepts `--staging <stage>+<character>` (or `--stage` / `--character`);
the player and gallery accept the same as URL parameters: `index.html?staging=easel+person`.

## Staging: stage × character

One line in `src/data/film.config.js`: `staging: 'gallery-ride+spoonbill'`.

| staging | look |
|---|---|
| `gallery-ride+spoonbill` | the spoonbill rides along one road through framed panels on a museum wall (reference look) |
| `gallery-ride+person` | the same ride with the stylised human rider (colours / hat / scarf in `character`) |
| `easel+person` | a painter on a hilltop paints each chapter on an easel (date, title, a watercolour miniature, beat by beat); the valley below is the chapter scene; paper-wash wipes on the bar lines; outro: every painting pinned on strings |
| `easel+spoonbill` | the same, the spoonbill paints with the brush in its bill |

Requires Node 20+, Playwright + Chromium (for the tools), ffmpeg (for MP4), esbuild (build).

## What to edit

| file | what |
|---|---|
| `src/data/film.config.js` | title, subtitle, quote, outro lines, language, BPM, bars, stage, character + colours, default prop, palette tokens, Google Fonts, music intro/outro/bed/transpose |
| `src/data/chapters.js` | the chapters: dates, titles, captions, teaching text, facts, sources, medium, palette, frame, prop, music recipe |
| `src/scenes/<id>.js` | one scene module per chapter (contract: `SCENE_GUIDE.md`) |

Nothing else needs to change for a new topic.

## Architecture

```text
src/
  main.js              boot, player UI, render APIs (window.renderAt / renderPanelAt / captureFrameAt)
  data/                film.config.js · chapters.js · i18n.js (UI strings zh-Hant / en) ·
                       staging.js (resolves stage + character from the URL or FILM.staging)
  beat/timeline.js     clock: BPM, intro / chapter / outro lengths from the config, beat state
  beat/camera.js       1920x1080 view; gallery-ride rider motion + dolly camera
  stages/              STAGE interface (index.js): gallery-ride.js, easel.js (+ easel/: geom, scenery,
                       painting), common.js
  characters/          CHARACTER interface (index.js): spoonbill.js (cycle, paint), person.js
                       (cycle, paint, stand)
  kit/                 kit.js (PRNG, noise, bake cache, road, helpers) · props.js · frame.js · fonts.js
  scenes/              index.js (registry + fallback), intro.js, outro.js, placeholder.js, legacy.js
                       (adapter for reference scenes), one module per chapter
  audio/               arrange.js (motif + harmony toolkit) · presets.js (20 style presets + intro/outro)
                       score.js (recipes -> events) · instruments.js · mix.js · foley.js (wind bed)
                       engine.js (worker pool, reverb, loudness matching, limiter, WAV) · synth-worker.js
tools/                 serve · browser · shot · sheet · render · render-audio · check-audio · build
                       validate · presets · test-presets · new-scene
```

* **Stage** (`src/stages/index.js`): owns the whole frame — layout, camera, character placement,
  intro hand-off, outro. `renderFilmFrame(ctx, t)` → `stage.renderFrame(ctx, t)`.
* **Scene** (`SCENE_GUIDE.md`): `render(kit, ctx, p)` paints one chapter into the stage's canvas.
* **Character** (`src/characters/index.js`): `computeRig(args)` (pure) + `draw(ctx, rig, style)`
  + supported `actions`; the chapter `prop` is drawn by the character at `rig.propHub`.
* **Music**: each chapter names a preset (`music.preset`); the score tiles its 4-bar
  orchestration of the shared leitmotif over the chapter, at the film's BPM and key, and the
  engine loudness-matches every chapter and crossfades on the bar line.

## Determinism

No `Math.random` / `Date` in render paths: seeded PRNGs (`kit.makePRNG`, `mulberry32`) only.
Frames are pure functions of `t`; the soundtrack renders bit-identically with or without
workers (`check-audio --determinism`). Scenes may only cache static artwork (`kit.bake`).
