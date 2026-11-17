// tools/render-audio.mjs — export the procedural soundtrack as a 16-bit stereo WAV.
//
//   node tools/render-audio.mjs                       -> out/soundtrack.wav (48 kHz)
//   node tools/render-audio.mjs --sr 44100 --out x.wav
//   node tools/render-audio.mjs --staging easel+person   (no bicycle bell when nobody cycles)
//
// The track is rendered by the same browser code the player uses (renderSoundtrack in
// src/audio/engine.js), so the file is sample-identical to what plays in the page.
import fs from 'node:fs';
import path from 'node:path';
import { openRenderHost } from './browser.mjs';
import { ROOT } from './serve.mjs';

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const sr = Number(arg('--sr', 48000));
const outFile = path.resolve(ROOT, arg('--out', 'out/soundtrack.wav'));

const { page, errors, close } = await openRenderHost();
try {
  const info = await page.evaluate(async (sr) => {
    const m = await import('./src/audio/engine.js');
    const t0 = performance.now();
    const buf = await m.renderSoundtrack(sr);
    const ms = performance.now() - t0;
    window.__wavBytes = m.encodeWav16(buf);
    return { ms, bytes: window.__wavBytes.length, duration: buf.duration };
  }, sr);
  const CHUNK = 4 << 20;
  const parts = [];
  for (let o = 0; o < info.bytes; o += CHUNK) {
    const b64 = await page.evaluate(
      ([o, n]) => {
        const u = window.__wavBytes.subarray(o, o + n);
        let s = '';
        for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
        return btoa(s);
      },
      [o, CHUNK],
    );
    parts.push(Buffer.from(b64, 'base64'));
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, Buffer.concat(parts));
  console.log(`wrote ${path.relative(ROOT, outFile)}  ${(info.bytes / 1048576).toFixed(1)} MiB, ${info.duration.toFixed(2)} s @ ${sr} Hz (render ${(info.ms / 1000).toFixed(2)} s)`);
} finally {
  if (errors.length) {
    console.log('--- browser console errors/warnings ---');
    for (const e of errors) console.log(e);
  }
  await close();
}
