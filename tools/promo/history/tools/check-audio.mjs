// tools/check-audio.mjs — render the procedural soundtrack in the browser and measure it.
//
//   node tools/check-audio.mjs                 render at 44.1 kHz, print per-section RMS / peak
//   node tools/check-audio.mjs --sr 48000      other sample rate
//   node tools/check-audio.mjs --determinism   render twice more (worker pool again + main-thread
//                                              fallback) and require identical sample hashes
//   node tools/check-audio.mjs --json out.json also write the measurements as JSON
//
// Fails (exit 1) if the duration is wrong, any section is (near) silent, a sample is NaN,
// the peak exceeds 0.98, the page logged a console error, or (--determinism) any two renders differ.
import fs from 'node:fs';
import { openRenderHost } from './browser.mjs';

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const sr = Number(arg('--sr', 44100));
const determinism = args.includes('--determinism');
const jsonOut = arg('--json', null);

const { page, errors, close } = await openRenderHost();
let failed = false;
try {
  const res = await page.evaluate(
    async ([sr, determinism]) => {
      const m = await import('./src/audio/engine.js');
      const hashBuf = (buf) => {
        let h = 2166136261 >>> 0;
        for (let c = 0; c < buf.numberOfChannels; c++) {
          const d = buf.getChannelData(c);
          for (let i = 0; i < d.length; i++) {
            h ^= Math.round(d[i] * 32767) & 0xffff;
            h = Math.imul(h, 16777619);
          }
        }
        return (h >>> 0).toString(16);
      };
      const t0 = performance.now();
      const buf = await m.renderSoundtrack(sr);
      const ms = performance.now() - t0;
      const stats = m.getLastRenderStats();
      const L = buf.getChannelData(0);
      const R = buf.getChannelData(1);
      // K-weighting (ITU-R BS.1770 shape) -> ungated LUFS-style loudness per section
      const biquad = (type, f0, q, db, fs) => {
        const w = (2 * Math.PI * f0) / fs, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q), A = Math.pow(10, db / 40);
        let b0, b1, b2, a0, a1, a2;
        if (type === 'hs') {
          const s2 = 2 * Math.sqrt(A) * al;
          b0 = A * (A + 1 + (A - 1) * cw + s2); b1 = -2 * A * (A - 1 + (A + 1) * cw); b2 = A * (A + 1 + (A - 1) * cw - s2);
          a0 = A + 1 - (A - 1) * cw + s2; a1 = 2 * (A - 1 - (A + 1) * cw); a2 = A + 1 - (A - 1) * cw - s2;
        } else {
          b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
        }
        return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
      };
      const kw = (ch) => {
        const out = new Float32Array(ch.length);
        const st = [biquad('hs', 1681.97, 0.7072, 3.99984, buf.sampleRate), biquad('hp', 38.1355, 0.5003, 0, buf.sampleRate)];
        out.set(ch);
        for (const [b0, b1, b2, a1, a2] of st) {
          let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
          for (let i = 0; i < out.length; i++) {
            const x = out[i];
            const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            x2 = x1; x1 = x; y2 = y1; y1 = y;
            out[i] = y;
          }
        }
        return out;
      };
      const KL = kw(L);
      const KR = kw(R);
      const measure = (a, b) => {
        const i0 = Math.max(0, Math.round(a * buf.sampleRate));
        const i1 = Math.min(buf.length, Math.round(b * buf.sampleRate));
        let pk = 0;
        let ss = 0;
        let nan = 0;
        let clip = 0;
        let ks = 0;
        for (let i = i0; i < i1; i++) ks += KL[i] * KL[i] + KR[i] * KR[i];
        for (let i = i0; i < i1; i++) {
          const l = L[i];
          const r = R[i];
          if (!Number.isFinite(l) || !Number.isFinite(r)) {
            nan++;
            continue;
          }
          const al = Math.abs(l);
          const ar = Math.abs(r);
          if (al > pk) pk = al;
          if (ar > pk) pk = ar;
          if (al >= 0.999 || ar >= 0.999) clip++;
          ss += l * l + r * r;
        }
        return { peak: pk, rms: Math.sqrt(ss / Math.max(1, 2 * (i1 - i0))), lufs: -0.691 + 10 * Math.log10(ks / Math.max(1, i1 - i0) + 1e-12), nan, clip };
      };
      const info = window.__FILM_INFO__;
      const sections = [{ id: 'intro', a: 0, b: info.introSec }];
      for (const s of info.chapters) sections.push({ id: s.id, num: s.num, a: s.t0, b: s.t1 });
      sections.push({ id: 'outro', a: info.outroStart, b: info.total });
      const rows = sections.map((s) => ({ ...s, ...measure(s.a, s.b) }));
      const all = measure(0, buf.duration);
      let hash = null;
      let hash2 = null;
      let hash3 = null;
      let stats3 = null;
      if (determinism) {
        hash = hashBuf(buf);
        hash2 = hashBuf(await m.renderSoundtrack(sr));
        hash3 = hashBuf(await m.renderSoundtrack(sr, { workers: false }));
        stats3 = m.getLastRenderStats();
      }
      return { total: info.total, ms, duration: buf.duration, length: buf.length, sampleRate: buf.sampleRate, channels: buf.numberOfChannels, all, rows, stats, hash, hash2, hash3, stats3 };
    },
    [sr, determinism],
  );

  const db = (v) => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : '-inf').padStart(6);
  console.log(`soundtrack: ${res.duration.toFixed(3)} s, ${res.channels} ch @ ${res.sampleRate} Hz (${res.length} samples)`);
  console.log(`render time: ${(res.ms / 1000).toFixed(2)} s (${res.stats && res.stats.workers ? `${res.stats.workers} ${res.stats.workerKind} worker(s)` : 'main thread'})`);
  console.log(`overall: peak ${res.all.peak.toFixed(4)} (${db(res.all.peak)} dBFS)  RMS ${res.all.rms.toFixed(4)} (${db(res.all.rms)} dBFS)  clipped samples ${res.all.clip}  NaN ${res.all.nan}`);
  console.log('');
  console.log('section        window (s)       RMS      RMS dB   peak    peak dB   K-loud (LUFS, ungated)');
  const eraRms = [];
  const eraK = [];
  for (const r of res.rows) {
    const name = (r.num ? `${String(r.num).padStart(2, '0')} ${r.id}` : r.id).padEnd(14);
    const win = `${r.a.toFixed(1).padStart(6)}–${r.b.toFixed(1).padEnd(6)}`;
    console.log(`${name} ${win}   ${r.rms.toFixed(4)}  ${db(r.rms)}   ${r.peak.toFixed(3)}  ${db(r.peak)}   ${r.lufs.toFixed(1).padStart(6)}`);
    if (r.num) {
      eraRms.push(20 * Math.log10(Math.max(r.rms, 1e-9)));
      eraK.push(r.lufs);
    }
    if (r.rms < 0.005) {
      console.log(`  !! ${r.id} is (near) silent`);
      failed = true;
    }
    if (r.nan) {
      console.log(`  !! ${r.id} has ${r.nan} NaN samples`);
      failed = true;
    }
  }
  const spread = Math.max(...eraRms) - Math.min(...eraRms);
  console.log('');
  console.log(`chapter RMS spread: ${spread.toFixed(2)} dB (min ${Math.min(...eraRms).toFixed(1)}, max ${Math.max(...eraRms).toFixed(1)} dBFS)`);
  console.log(`chapter K-weighted loudness spread: ${(Math.max(...eraK) - Math.min(...eraK)).toFixed(2)} LU (min ${Math.min(...eraK).toFixed(1)}, max ${Math.max(...eraK).toFixed(1)})`);
  if (res.stats) {
    if (res.stats.phase) console.log('phases (ms): ' + Object.entries(res.stats.phase).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', '));
    console.log(`limiter active on ${(100 * res.stats.limitedFraction).toFixed(2)}% of samples, pre-limit peak ${res.stats.prePeak.toFixed(3)}, final norm gain ${res.stats.normGain.toFixed(3)}`);
  }
  if (res.hash) {
    const same = res.hash === res.hash2 && res.hash === res.hash3;
    console.log(`determinism: workers ${res.hash} / workers again ${res.hash2} / main thread ${res.hash3} (${(res.stats3.ms / 1000).toFixed(2)} s) -> ${same ? 'identical' : 'DIFFERENT'}`);
  }
  if (Math.abs(res.duration - res.total) > 0.01) {
    console.log(`!! duration ${res.duration} != ${res.total}`);
    failed = true;
  }
  if (res.all.peak > 0.98) {
    console.log(`!! peak ${res.all.peak} > 0.98`);
    failed = true;
  }
  if (res.hash && (res.hash !== res.hash2 || res.hash !== res.hash3)) failed = true;
  if (errors.some((e) => e.startsWith('[error]') || e.startsWith('[pageerror]'))) {
    console.log('!! the page logged console errors');
    failed = true;
  }
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(res, null, 2));
} finally {
  if (errors.length) {
    console.log('--- browser console errors/warnings ---');
    for (const e of errors) console.log(e);
  }
  await close();
}
console.log(failed ? 'AUDIO CHECK FAILED' : 'audio check OK');
process.exit(failed ? 1 : 0);
