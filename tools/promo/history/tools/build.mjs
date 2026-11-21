// tools/build.mjs — produce self-contained single-file pages in dist/:
//   dist/index.html    player (all JS + CSS inlined; only Google Fonts loaded remotely)
//   dist/gallery.html  chapter gallery
//   dist/render.html   render host
//
// The soundtrack's synth worker (src/audio/synth-worker.js) cannot be a separate file in a
// single-file page, so it is bundled as a classic-worker IIFE and injected as a string
// (window.__FILM_SYNTH_WORKER_SRC__) in a <script> that runs before the app module;
// src/audio/engine.js starts it from a Blob URL (and falls back to the main thread).
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { ROOT } from './serve.mjs';
import { syncGlyphs } from './glyphs.mjs';

const DIST = path.join(ROOT, 'dist');
// the film title for <title> (read from the config without executing the app)
syncGlyphs(ROOT);
const { FILM } = await import(pathToFileURL(path.join(ROOT, 'src/data/film.config.js')).href);
const FILM_TITLE = String(FILM.title || 'Film').replace(/[<&]/g, '');
fs.mkdirSync(DIST, { recursive: true });
const css = fs.readFileSync(path.join(ROOT, 'public/style.css'), 'utf8');

async function bundle(entry, format = 'esm') {
  const res = await build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format,
    minify: true,
    write: false,
    target: ['es2020'],
    legalComments: 'none',
  });
  return res.outputFiles[0].text;
}

/** Classic <script> defining the synth-worker source as a global string. */
function workerScript(workerJs) {
  // JSON.stringify gives one string literal; escaping every '<' keeps '</script' and '<!--'
  // from ever appearing in the page (\u003c is the same character inside the string).
  const lit = JSON.stringify(workerJs).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<script>window.__FILM_SYNTH_WORKER_SRC__ = ${lit};</script>`;
}

function inline(htmlFile, js, outName, { worker = null } = {}) {
  let html = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${FILM_TITLE}</title>`);
  html = html.replace(/<link rel="stylesheet" href="\.\/public\/style\.css" \/>/, `<style>\n${css}\n</style>`);
  // escape any closing script tag sequences inside the bundle
  const safe = js.replace(/<\/script/gi, '<\\/script');
  const pre = worker ? `${workerScript(worker)}\n  ` : '';
  const re = /<script type="module" src="\.\/src\/[a-z]+\.js"><\/script>/;
  if (!re.test(html)) throw new Error(`${htmlFile}: module script tag not found`);
  html = html.replace(re, () => `${pre}<script type="module">\n${safe}\n</script>`);
  fs.writeFileSync(path.join(DIST, outName), html);
  const kb = (fs.statSync(path.join(DIST, outName)).size / 1024).toFixed(0);
  console.log(`dist/${outName}  ${kb} KiB`);
}

const playerJs = await bundle('src/player.js');
const galleryJs = await bundle('src/gallery.js');
const workerJs = await bundle('src/audio/synth-worker.js', 'iife');
console.log(`synth worker (iife, inlined as a Blob-URL worker)  ${(workerJs.length / 1024).toFixed(0)} KiB`);
inline('index.html', playerJs, 'index.html', { worker: workerJs });
inline('render.html', playerJs, 'render.html', { worker: workerJs });
inline('gallery.html', galleryJs, 'gallery.html');

// dist/artifact/: the same player + gallery shaped for hosting as a claude.ai Artifact.
// The host wraps the main page in its own <!doctype><html><head><body> skeleton, so the
// player page drops those tags and keeps only <title>, metas, links, <style> and the app.
const ART = path.join(DIST, 'artifact');
fs.mkdirSync(ART, { recursive: true });
let page = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
page = page
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<html[^>]*>\s*/i, '')
  .replace(/<\/html>\s*/i, '')
  .replace(/<head>\s*/i, '')
  .replace(/<\/head>\s*/i, '')
  .replace(/<body[^>]*>\s*/i, '')
  .replace(/<\/body>\s*/i, '')
  .replace(/<meta charset="utf-8" \/>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<title>[^<]*<\/title>/i, `<title>${FILM_TITLE}</title>\n  <meta name="claude:viewport-fit-sides" content="cover" />`);
fs.writeFileSync(path.join(ART, 'index.html'), page);
fs.copyFileSync(path.join(DIST, 'gallery.html'), path.join(ART, 'gallery.html'));
console.log(`dist/artifact/index.html  ${(fs.statSync(path.join(ART, 'index.html')).size / 1024).toFixed(0)} KiB (+ gallery.html)`);
