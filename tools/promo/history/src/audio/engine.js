// src/audio/engine.js — procedural soundtrack engine (history-timeline-film template).
//
// Interface used by main.js (unchanged from the stub):
//   createAudioEngine() -> { init(): Promise, isReady(), onReady(cb), onEnded(cb),
//     play(t): Promise, pause(), seek(t), isPlaying(), getCurrentTime(),
//     setVolume(v), getVolume(), setMuted(b), isMuted(), toggleMute() }
// Extra exports for tools:
//   renderSoundtrack(sampleRate = 48000) -> Promise<AudioBuffer>   (stereo, TOTAL_DURATION s, deterministic)
//   encodeWav16(audioBuffer) -> Uint8Array                          (16-bit PCM WAV)
//   getLastRenderStats() -> { ms, phase, sections: [...] }
//
// Render pipeline (deterministic: seeded PRNGs only, no Math.random, no timers in the DSP):
//   1. score.js turns the chapters' music recipes (presets.js) into sections (intro, one per
//      chapter, outro) of note events.
//   2. Each section is synthesised (instruments.js: Karplus–Strong strings, modal bars and
//      bells, FM, subtractive synths, noise percussion) and mixed (mix.js) into a dry stem
//      plus hall/room reverb sends with per-track FX (vibraphone tremolo, ping-pong delay,
//      side-chain ducking) — in a small pool of Web Workers when available (module worker
//      in dev, Blob-URL classic worker in the single-file build), otherwise on the main
//      thread in ~20 ms slices. Both paths give bit-identical stems.
//   3. (The ambience bed — FILM.music.bed — is generated in a worker meanwhile.)
//   4. The reverb sends of every 4 sections are rendered by one OfflineAudioContext through
//      two ConvolverNodes with procedurally generated impulse responses (at half rate:
//      reverb tails carry little above 10 kHz, and it quarters the convolution cost).
//   5. Stems are loudness-matched per era (K-weighted RMS) and overlap-added: each era's
//      one-beat pickup plays over the previous era's last beat, and the previous era's tail
//      fades out over the first beat of the new bar — transitions land on the bar line.
//   6. The stereo wind bed (foley.js) is added, then a 5 ms look-ahead peak limiter
//      (smoothed attack, 120 ms release) and a final normalisation to a -1 dBFS sample peak.
//      The long master loops run in slices so the player keeps animating meanwhile.

import { TOTAL_DURATION, BEAT_SEC } from '../beat/timeline.js';
import { buildScore, windinessAt, bedSpec } from './score.js';
import { WindGen, windTable } from './foley.js';
import { mixSection, packSection } from './mix.js';
import { mulberry32, eq, kRms, peakOf, dbToGain, clamp } from './dsp.js';

const MUSIC_TARGET = 0.089; // loudness (√(K-RMS·RMS)) each era stem is matched to (≈ -20 dB)
const WIND_LEVEL = 0.36; // wind K-RMS relative to MUSIC_TARGET at windiness 1
const CEILING = dbToGain(-1); // final sample peak: -1 dBFS
const XFADE = BEAT_SEC; // one beat: a chapter's tail fades out under the next downbeat
const PICKUP_GUARD = 0.04; // click guard at the start of each era's pickup beat
const WET_BATCH = 4; // sections per reverb OfflineAudioContext
const MAX_INFLIGHT = 2; // reverb batches rendering concurrently
const LOOKAHEAD = 6; // sections queued ahead in the worker pool
const WIND_SEED = 4242;

let lastStats = null;
export function getLastRenderStats() {
  return lastStats;
}

// -----------------------------------------------------------------------------
// Cooperative yielding (MessageChannel is not throttled like setTimeout in background tabs)
// -----------------------------------------------------------------------------
function makeYielder(budgetMs = 20) {
  const hasPerf = typeof performance !== 'undefined';
  const clock = () => (hasPerf ? performance.now() : Date.now());
  let last = clock();
  let ch = null;
  const queue = [];
  if (typeof MessageChannel !== 'undefined') {
    ch = new MessageChannel();
    ch.port1.onmessage = () => {
      const r = queue.shift();
      if (r) r();
    };
  }
  const yieldNow = () =>
    new Promise((res) => {
      if (ch) {
        queue.push(res);
        ch.port2.postMessage(0);
      } else setTimeout(res, 0);
    });
  const fn = async () => {
    if (clock() - last < budgetMs) return;
    await yieldNow();
    last = clock();
  };
  fn.close = () => {
    if (ch) {
      ch.port1.onmessage = null;
      ch.port1.close();
      ch.port2.close();
    }
  };
  return fn;
}

// -----------------------------------------------------------------------------
// Procedural impulse responses
// -----------------------------------------------------------------------------
function makeIR(sr, { seconds, rt60, predelay, bright, dark, early, seed }) {
  const len = Math.round(seconds * sr);
  const buf = new AudioBuffer({ length: len, numberOfChannels: 2, sampleRate: sr });
  for (let c = 0; c < 2; c++) {
    const rnd = mulberry32(seed + c * 977);
    const d = new Float32Array(len);
    const pd = Math.round(predelay * sr);
    let z = 0;
    for (let n = pd; n < len; n++) {
      const t = (n - pd) / sr;
      // high frequencies die faster: one-pole lowpass that closes over time
      const fc = dark + (bright - dark) * Math.exp(-t / (rt60 * 0.35));
      const a = 1 - Math.exp((-2 * Math.PI * fc) / sr);
      z += a * (rnd() * 2 - 1 - z);
      const env = Math.exp((-6.9078 * t) / rt60) * Math.min(1, t / 0.004);
      d[n] = z * env;
    }
    for (let k = 0; k < early; k++) {
      const n = pd + Math.round((0.004 + 0.07 * rnd()) * sr);
      if (n < len) d[n] += (rnd() < 0.5 ? -1 : 1) * (0.25 + 0.45 * rnd()) * Math.exp(-k * 0.18);
    }
    // energy-normalise so a send of 1 gives roughly equal wet/dry loudness
    let e = 0;
    for (let n = 0; n < len; n++) e += d[n] * d[n];
    const g = 1 / Math.sqrt(e || 1);
    for (let n = 0; n < len; n++) d[n] *= g;
    buf.copyToChannel(d, c);
  }
  return buf;
}

// -----------------------------------------------------------------------------
// Worker pool for section mixing + wind (falls back to the main thread when unavailable)
// -----------------------------------------------------------------------------
// Where the worker comes from:
//   - single-file build (tools/build.mjs): the worker bundle is injected as a string in
//     window.__FILM_SYNTH_WORKER_SRC__ and started as a classic worker from a Blob URL;
//   - dev / multi-file hosting: a module worker next to this file.
// Every failure mode (no Worker, blocked URL, script error, no answer, a worker dying
// mid-render) degrades to the main-thread path, which renders bit-identical samples.
const WORKER_SRC_GLOBAL = '__FILM_SYNTH_WORKER_SRC__';
const JOB_TIMEOUT_MS = 30000;

function spawnWorkers(n) {
  const src = typeof globalThis !== 'undefined' ? globalThis[WORKER_SRC_GLOBAL] : null;
  if (typeof src === 'string' && src.length && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
    let blobUrl = null;
    const workers = [];
    try {
      blobUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      for (let i = 0; i < n; i++) workers.push(new Worker(blobUrl));
      return { workers, blobUrl, kind: 'blob' };
    } catch (e) {
      workers.forEach((w) => w.terminate());
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      // fall through to the module worker
    }
  }
  const workers = [];
  try {
    const url = new URL('./synth-worker.js', import.meta.url);
    for (let i = 0; i < n; i++) workers.push(new Worker(url, { type: 'module' }));
    return { workers, blobUrl: null, kind: 'module' };
  } catch (e) {
    workers.forEach((w) => w.terminate());
    return null;
  }
}

class SynthPool {
  constructor(workers, kind) {
    this.workers = workers;
    this.kind = kind;
    this.load = workers.map(() => 0);
    this.dead = workers.map(() => false);
    this.pending = new Map(); // id -> { resolve, reject, worker, timer }
    this.nextId = 1;
    workers.forEach((w, wi) => {
      w.onmessage = (e) => {
        const d = e.data || {};
        const p = this.pending.get(d.id);
        if (!p) return;
        this.settle(d.id);
        if (d.type === 'error') p.reject(new Error(d.message));
        else p.resolve(d);
      };
      w.onerror = (e) => {
        if (e && e.preventDefault) e.preventDefault(); // handled here: no uncaught-error console noise
        this.kill(wi, (e && e.message) || 'worker error');
      };
      w.onmessageerror = () => this.kill(wi, 'worker message could not be deserialised');
    });
  }

  static async create(n, timeoutMs = 5000) {
    if (typeof Worker === 'undefined' || n < 1) return null;
    const spawned = spawnWorkers(n);
    if (!spawned) return null;
    const { workers, blobUrl, kind } = spawned;
    const ok = await Promise.all(
      workers.map(
        (w) =>
          new Promise((res) => {
            const done = (v) => {
              clearTimeout(to);
              w.onmessage = null;
              w.onerror = null;
              res(v);
            };
            const to = setTimeout(() => done(false), timeoutMs);
            w.onmessage = (e) => {
              if (e.data && e.data.type === 'pong') done(true);
            };
            w.onerror = (e) => {
              if (e && e.preventDefault) e.preventDefault();
              done(false);
            };
            w.postMessage({ type: 'ping', id: 0 });
          }),
      ),
    );
    // every worker has loaded its script (or given up): the Blob URL is no longer needed
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const good = workers.filter((w, i) => ok[i]);
    workers.forEach((w, i) => {
      if (!ok[i]) w.terminate();
    });
    return good.length ? new SynthPool(good, kind) : null;
  }

  settle(id) {
    const p = this.pending.get(id);
    if (!p) return;
    clearTimeout(p.timer);
    this.load[p.worker] -= p.cost;
    this.pending.delete(id);
  }

  /** A worker that errored or hung is retired; its jobs fail over to the main thread. */
  kill(wi, why) {
    if (!this.dead[wi]) {
      this.dead[wi] = true;
      try {
        this.workers[wi].terminate();
      } catch (e) {
        /* ignore */
      }
    }
    for (const [id, p] of [...this.pending]) {
      if (p.worker !== wi) continue;
      this.settle(id);
      p.reject(new Error(why));
    }
  }

  get alive() {
    return this.dead.some((d) => !d);
  }

  /** Post a job to worker i; `cost` counts towards its queue until the job settles. */
  post(i, msg, transfer = [], cost = 1) {
    if (this.dead[i]) return Promise.reject(new Error('worker retired'));
    const id = this.nextId++;
    this.load[i] += cost;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.kill(i, 'worker timed out'), JOB_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, worker: i, timer, cost });
      try {
        this.workers[i].postMessage({ ...msg, id }, transfer);
      } catch (e) {
        this.settle(id);
        reject(e);
      }
    });
  }

  leastLoaded() {
    let b = -1;
    for (let i = 0; i < this.load.length; i++) if (!this.dead[i] && (b < 0 || this.load[i] < this.load[b])) b = i;
    return b < 0 ? 0 : b;
  }

  terminate() {
    for (const [id, p] of [...this.pending]) {
      this.settle(id);
      p.reject(new Error('pool terminated'));
    }
    this.workers.forEach((w) => w.terminate());
    this.dead = this.dead.map(() => true);
  }
}

/** Rough relative cost of mixing a section (for balancing the worker queue). */
function sectionCost(sec) {
  let c = 0;
  for (const ev of sec.events) c += 0.3 + Math.min(ev.dur, 3);
  return c;
}

/**
 * Render the reverb returns of a batch of sections through ONE OfflineAudioContext (half
 * rate). Setting a ConvolverNode's buffer prepares the IR's FFT kernels on the main thread,
 * so one context per batch instead of per section saves most of that work. Sections are laid
 * end to end with an IR-length silent gap, so no reverb tail bleeds into the next one; each
 * section gets back the first `half` samples of its own returns ([L, R] or null).
 */
function renderWetBatch(buses, irs, srHalf) {
  const gap = Math.max(irs.hall.length, irs.room.length);
  const offs = [];
  let total = 0;
  for (const bus of buses) {
    offs.push(total);
    total += bus.half + gap;
  }
  const used = ['hall', 'room'].filter((key) => buses.some((b) => b[key]));
  if (!used.length) return Promise.resolve(buses.map(() => null));
  const ctx = new OfflineAudioContext({ numberOfChannels: 2, length: total, sampleRate: srHalf });
  for (const key of used) {
    const b = ctx.createBuffer(2, total, srHalf);
    buses.forEach((bus, i) => {
      if (!bus[key]) return;
      b.copyToChannel(bus[key][0], 0, offs[i]);
      b.copyToChannel(bus[key][1], 1, offs[i]);
    });
    const s = ctx.createBufferSource();
    s.buffer = b;
    const cv = ctx.createConvolver();
    cv.normalize = false;
    cv.buffer = irs[key];
    s.connect(cv);
    cv.connect(ctx.destination);
    s.start(0);
  }
  return ctx.startRendering().then((out) => {
    const L = out.getChannelData(0);
    const R = out.getChannelData(1);
    return buses.map((bus, i) => (bus.hall || bus.room ? [L.subarray(offs[i], offs[i] + bus.half), R.subarray(offs[i], offs[i] + bus.half)] : null));
  });
}

// -----------------------------------------------------------------------------
// Stem placement (plain top-level loops: they run on the main thread for every section)
// -----------------------------------------------------------------------------
/** dst[i] += half-rate `wet` linearly interpolated back up (wet holds len/2 + 2 samples). */
function addWet(dst, wet, len) {
  for (let i = 0, j = 0; i < len; i += 2, j++) {
    const w0 = wet[j];
    dst[i] += w0;
    if (i + 1 < len) dst[i + 1] += 0.5 * (w0 + wet[j + 1]);
  }
}

function sumSq(x, a, b) {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return s;
}

/**
 * out[s0 + i] += stem[i] * gain for i in [i0, i1): a raised-cosine click guard over the first
 * `guardN` samples, unity in the body, a cos² fade over `tailLen` samples after `tailStart`.
 */
function addStem(out, stem, s0, i0, i1, g, guardN, tailStart, tailLen) {
  const gEnd = Math.min(guardN, i1);
  for (let i = i0; i < gEnd; i++) out[s0 + i] += stem[i] * g * (0.5 - 0.5 * Math.cos((Math.PI * i) / guardN));
  const bEnd = Math.min(i1, tailStart + 1);
  for (let i = Math.max(i0, guardN); i < bEnd; i++) out[s0 + i] += stem[i] * g;
  for (let i = Math.max(bEnd, guardN); i < i1; i++) {
    const c = Math.cos((((i - tailStart) / tailLen) * Math.PI) / 2);
    out[s0 + i] += stem[i] * g * c * c;
  }
}

// -----------------------------------------------------------------------------
// Master: look-ahead peak limiter
// -----------------------------------------------------------------------------
const CHUNK = 1 << 16; // samples per slice of the long master loops (keeps the player responsive)

/**
 * Look-ahead peak limiter. Required gain per sample -> sliding minimum over the next `la`
 * samples -> release smoothing (instant down, 120 ms up) -> moving average over `la`
 * samples. The final average spans only values that already include each peak's requirement,
 * so the gain still meets it exactly at the peak, but now ramps down over 5 ms instead of
 * stepping (a hard gain step is an audible click).
 */
async function limitInPlace(L, R, sr, ceiling, maybeYield) {
  const n = L.length;
  const la = Math.max(1, Math.round(0.005 * sr));
  const rel = Math.exp(-1 / (0.12 * sr));
  const req = new Float32Array(n);
  let any = false;
  for (let i0 = 0; i0 < n; i0 += CHUNK) {
    const i1 = Math.min(n, i0 + CHUNK);
    for (let i = i0; i < i1; i++) {
      const a = L[i] < 0 ? -L[i] : L[i];
      const b = R[i] < 0 ? -R[i] : R[i];
      const p = a > b ? a : b;
      if (p > ceiling) {
        req[i] = ceiling / p;
        any = true;
      } else req[i] = 1;
    }
    await maybeYield();
  }
  if (!any) return 0;
  // sliding-window minimum over [i, i + la] (monotonic deque) + release
  const g = new Float32Array(n);
  const dq = new Int32Array(n + 1);
  let h = 0;
  let tq = 0;
  let gr = 1;
  for (let j0 = 0; j0 < n + la; j0 += CHUNK) {
    const j1 = Math.min(n + la, j0 + CHUNK);
    for (let j = j0; j < j1; j++) {
      if (j < n) {
        while (tq > h && req[dq[tq - 1]] >= req[j]) tq--;
        dq[tq++] = j;
      }
      const i = j - la;
      if (i >= 0) {
        while (dq[h] < i) h++;
        const target = req[dq[h]];
        gr = target < gr ? target : target + (gr - target) * rel;
        g[i] = gr;
      }
    }
    await maybeYield();
  }
  // moving average of the gain over (i - la, i]
  const hist = new Float64Array(la).fill(1);
  let acc = la;
  let reduced = 0;
  for (let i0 = 0; i0 < n; i0 += CHUNK) {
    const i1 = Math.min(n, i0 + CHUNK);
    for (let i = i0; i < i1; i++) {
      const k = i % la;
      acc += g[i] - hist[k];
      hist[k] = g[i];
      const s = acc / la;
      if (s < 0.999) reduced++;
      L[i] *= s;
      R[i] *= s;
    }
    acc = 0; // re-sum to stop floating-point drift
    for (let k = 0; k < la; k++) acc += hist[k];
    await maybeYield();
  }
  return reduced / n;
}

// -----------------------------------------------------------------------------
// Full render
// -----------------------------------------------------------------------------
export async function renderSoundtrack(sampleRate = 48000, opts = {}) {
  if (typeof OfflineAudioContext === 'undefined') throw new Error('OfflineAudioContext unavailable');
  const sr = sampleRate;
  const srHalf = sr / 2;
  const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const tStart = clock();
  const phase = { pool: 0, waitMix: 0, mainMix: 0, waitWet: 0, place: 0, wind: 0, master: 0 };
  let mainMixed = 0;
  const maybeYield = makeYielder(opts.budgetMs ?? 20);
  let pool = null;
  try {
    const total = Math.round(TOTAL_DURATION * sr);
    const L = new Float32Array(total);
    const R = new Float32Array(total);
    const irs = {
      hall: makeIR(srHalf, { seconds: 2.4, rt60: 2.1, predelay: 0.018, bright: 6500, dark: 1800, early: 10, seed: 11 }),
      room: makeIR(srHalf, { seconds: 0.7, rt60: 0.5, predelay: 0.005, bright: 8000, dark: 2500, early: 14, seed: 23 }),
    };
    const sections = buildScore();
    const stats = [];

    let c0 = clock();
    // leave two cores to the page (animation, compositor) and the reverb render thread: on a
    // 4-core machine 2 workers render faster *and* stutter less than 3 (measured)
    const hc = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 2;
    pool = opts.workers === false ? null : await SynthPool.create(clamp(hc - 2, 1, 3));
    const workerCount = pool ? pool.workers.length : 0;
    const workerKind = pool ? pool.kind : 'main-thread';
    phase.pool = clock() - c0;

    // wind bed: half rate, in a worker if we have one. The windiness curve is tabulated here
    // once and shared by both paths, so the worker never needs the score / era data.
    const windLen = (total >> 1) + 2;
    const windTab = windTable(windinessAt, windLen, srHalf);
    let windP = null;
    const bed = bedSpec();
    if (pool && bed.kind !== 'none') windP = pool.post(pool.leastLoaded(), { type: 'wind', sr: srHalf, length: windLen, seed: WIND_SEED, table: windTab }, [], 120).catch(() => null);

    // Each section is mixed into its stem by a worker (the note buffers never leave it), or on
    // the main thread in slices when there is no pool or a job failed. Stems are then placed
    // strictly in score order, so the sum is the same whichever path produced them.
    const mixReqs = [];
    const request = (k) => {
      if (!pool || !pool.alive || k >= sections.length || mixReqs[k]) return;
      const sec = sections[k];
      mixReqs[k] = pool
        .post(pool.leastLoaded(), { type: 'mix', sr, sec: packSection(sec) }, [], sectionCost(sec))
        .then((r) => r.bus)
        .catch(() => null);
    };
    for (let k = 0; k < LOOKAHEAD; k++) request(k);

    const place = async (sec, bus, wet) => {
      const [DL, DR] = bus.dry;
      const len = bus.len;
      if (wet) {
        addWet(DL, wet[0], len);
        addWet(DR, wet[1], len);
        await maybeYield();
      }
      if (sec.eq) {
        eq(DL, sr, sec.eq);
        eq(DR, sr, sec.eq);
        await maybeYield();
      }
      const a = Math.round((sec.measure[0] - sec.start) * sr);
      const b = Math.round((sec.measure[1] - sec.start) * sr);
      // loudness = geometric mean of K-weighted (perceptual) and plain RMS, so eras match on both meters
      const rk = kRms([DL, DR], sr, a, b);
      const ss = sumSq(DL, a, b) + sumSq(DR, a, b);
      const rms = Math.sqrt(rk * Math.sqrt(ss / Math.max(1, 2 * (b - a))));
      await maybeYield();
      const want = MUSIC_TARGET * dbToGain(sec.loudDb || 0);
      const g = rms > 1e-6 ? clamp(want / rms, 0.05, 30) : 1;
      const s0 = Math.round(sec.start * sr);
      // The pickup beat before t0 plays at its written dynamics (the pickups are composed as
      // crescendos into the bar line); only a 40 ms click guard opens the window. The tail
      // after t1 fades out over one beat under the next era's downbeat.
      const guardN = Math.max(1, Math.min(Math.round(PICKUP_GUARD * sr), Math.round((sec.t0 - sec.start) * sr)));
      const tailStart = Math.round((sec.t1 - sec.start) * sr);
      const tailLen = Math.round(XFADE * sr);
      const iEnd = Math.min(len, total - s0, tailStart + tailLen);
      addStem(L, DL, s0, Math.max(0, -s0), iEnd, g, guardN, tailStart, tailLen);
      addStem(R, DR, s0, Math.max(0, -s0), iEnd, g, guardN, tailStart, tailLen);
      stats.push({ id: sec.id, rawRms: rms, gain: g, events: sec.events.length });
    };

    const scratch = { L: new Float32Array(0), R: new Float32Array(0) };
    const inflight = []; // reverb batches, placed strictly in score order
    let batch = [];
    const flush = () => {
      if (!batch.length) return;
      const items = batch;
      batch = [];
      const p = renderWetBatch(
        items.map((it) => it.bus),
        irs,
        srHalf,
      ).then((wets) => items.map((it, i) => ({ ...it, wet: wets[i] })));
      p.catch(() => {}); // observed below; avoids a transient "unhandled rejection" report
      inflight.push(p);
    };
    const settleOne = async () => {
      let t = clock();
      const done = await inflight.shift();
      phase.waitWet += clock() - t;
      t = clock();
      for (const r of done) {
        await place(r.sec, r.bus, r.wet);
        await maybeYield();
      }
      phase.place += clock() - t;
    };
    for (let k = 0; k < sections.length; k++) {
      const sec = sections[k];
      request(k + LOOKAHEAD);
      c0 = clock();
      let bus = mixReqs[k] ? await mixReqs[k] : null;
      mixReqs[k] = null;
      phase.waitMix += clock() - c0;
      if (!bus || bus.len !== Math.ceil((sec.end - sec.start) * sr)) {
        c0 = clock();
        bus = await mixSection(sec, sr, scratch, maybeYield);
        phase.mainMix += clock() - c0;
        mainMixed++;
      }
      batch.push({ sec, bus });
      if (batch.length >= WET_BATCH) flush();
      if (inflight.length >= MAX_INFLIGHT) await settleOne();
      if (opts.onProgress) opts.onProgress((k + 1) / sections.length);
    }
    flush();
    while (inflight.length) await settleOne();

    c0 = clock();
    let windL;
    let windR;
    const windRes = windP ? await windP : null;
    if (windRes && windRes.L && windRes.L.length === windLen) {
      windL = windRes.L;
      windR = windRes.R;
    } else if (bed.kind === 'none') {
      windL = new Float32Array(windLen);
      windR = new Float32Array(windLen);
    } else {
      const wind = new WindGen(srHalf, windLen, windTab, WIND_SEED);
      while (!wind.process(1 << 15)) await maybeYield();
      windL = wind.L;
      windR = wind.R;
    }
    if (pool) {
      pool.terminate();
      pool = null;
    }
    phase.wind = clock() - c0;
    c0 = clock();

    // wind level: K-RMS of the bed relative to its mean windiness
    let meanW = 0;
    for (let i = 0; i < windTab.length; i++) meanW += windTab[i];
    meanW /= windTab.length;
    const windRms = kRms([windL, windR], srHalf) || 1e-6;
    const wg = bed.kind === 'none' ? 0 : ((WIND_LEVEL * MUSIC_TARGET * meanW) / windRms) * bed.level;
    await maybeYield();

    // sum (wind interpolated up from half rate), fade the very start and the last 1.1 s
    const fadeInN = Math.round(0.4 * sr);
    const endFadeA = Math.round((TOTAL_DURATION - 1.1) * sr);
    let prePeak = 0;
    for (let i0 = 0; i0 < total; i0 += CHUNK) {
      const i1 = Math.min(total, i0 + CHUNK);
      for (let i = i0; i < i1; i++) {
        const j = i >> 1;
        const fr = (i & 1) * 0.5;
        const wl = windL[j] + (windL[j + 1] - windL[j]) * fr;
        const wr = windR[j] + (windR[j + 1] - windR[j]) * fr;
        let w = 1;
        if (i < fadeInN) w = i / fadeInN;
        else if (i > endFadeA) w = Math.cos((((i - endFadeA) / (total - endFadeA)) * Math.PI) / 2) ** 2;
        const l = (L[i] + wl * wg) * w;
        const r = (R[i] + wr * wg) * w;
        L[i] = l;
        R[i] = r;
        const al = l < 0 ? -l : l;
        const ar = r < 0 ? -r : r;
        if (al > prePeak) prePeak = al;
        if (ar > prePeak) prePeak = ar;
      }
      await maybeYield();
    }
    const limited = await limitInPlace(L, R, sr, CEILING * 0.995, maybeYield);
    let peak = 0;
    for (let i0 = 0; i0 < total; i0 += CHUNK) {
      peak = Math.max(peak, peakOf([L, R], i0, Math.min(total, i0 + CHUNK)));
      await maybeYield();
    }
    const norm = (CEILING * 0.995) / (peak || 1);
    for (let i0 = 0; i0 < total; i0 += CHUNK) {
      const i1 = Math.min(total, i0 + CHUNK);
      for (let i = i0; i < i1; i++) {
        L[i] *= norm;
        R[i] *= norm;
      }
      await maybeYield();
    }

    const out = new AudioBuffer({ length: total, numberOfChannels: 2, sampleRate: sr });
    out.copyToChannel(L, 0);
    out.copyToChannel(R, 1);
    const tEnd = clock();
    phase.master = tEnd - c0;
    lastStats = { ms: tEnd - tStart, workers: workerCount, workerKind, mainThreadSections: mainMixed, phase, sampleRate: sr, prePeak, limitedFraction: limited, normGain: norm, windGain: wg, sections: stats };
    return out;
  } finally {
    if (pool) pool.terminate();
    maybeYield.close();
  }
}

// -----------------------------------------------------------------------------
// WAV export
// -----------------------------------------------------------------------------
export function encodeWav16(audioBuffer) {
  const nCh = audioBuffer.numberOfChannels;
  const n = audioBuffer.length;
  const sr = audioBuffer.sampleRate;
  const dataBytes = n * nCh * 2;
  const bytes = new Uint8Array(44 + dataBytes);
  const dv = new DataView(bytes.buffer);
  const str = (o, s) => {
    for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i);
  };
  str(0, 'RIFF');
  dv.setUint32(4, 36 + dataBytes, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, nCh, true);
  dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * nCh * 2, true);
  dv.setUint16(32, nCh * 2, true);
  dv.setUint16(34, 16, true);
  str(36, 'data');
  dv.setUint32(40, dataBytes, true);
  const chans = [];
  for (let c = 0; c < nCh; c++) chans.push(audioBuffer.getChannelData(c));
  const rnd = mulberry32(16);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nCh; c++) {
      const dither = (rnd() - rnd()) / 32768; // TPDF, ±1 LSB, seeded -> deterministic
      const v = clamp(chans[c][i] + dither, -1, 1);
      dv.setInt16(o, Math.round(v < 0 ? v * 32768 : v * 32767), true);
      o += 2;
    }
  }
  return bytes;
}

// -----------------------------------------------------------------------------
// Playback engine
// -----------------------------------------------------------------------------
export function createAudioEngine() {
  const DUR = TOTAL_DURATION;
  let buffer = null;
  let ready = false;
  let renderPromise = null;
  const readyCbs = [];
  const endedCbs = [];
  let ctx = null;
  let master = null;
  let source = null;
  let srcGain = null;
  let token = 0; // identifies the live source (stale onended events are ignored)
  let startSeq = 0; // identifies the latest start request (stale async continuations bail out)
  let playing = false; // a source is actually running
  let wantPlay = false; // play requested (possibly before the buffer is ready / the context runs)
  let offset = 0; // film time at ctxStart (playing), at wallStart (waiting to start), or the paused position
  let ctxStart = 0;
  let wallStart = 0;
  let volume = 0.9;
  let muted = false;

  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const fire = (cbs) =>
    cbs.slice().forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.warn('[audio] callback failed', e);
      }
    });

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
    if (!AC) return null;
    try {
      ctx = new AC({ latencyHint: 'interactive' });
    } catch (e) {
      ctx = new AC();
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    const limiter = ctx.createDynamicsCompressor(); // gentle safety limiter (resampling overs)
    limiter.threshold.value = -2;
    limiter.knee.value = 2;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    const trim = ctx.createGain();
    trim.gain.value = 0.89; // offsets the compressor's automatic make-up gain
    master.connect(trim);
    trim.connect(limiter);
    limiter.connect(ctx.destination);
    return ctx;
  }

  const outLatency = () => (ctx ? clamp((ctx.outputLatency || 0) + (ctx.baseLatency || 0), 0, 0.25) : 0);

  /** Film time the listener hears now (output latency compensated while a source runs). */
  function currentTime() {
    if (playing && source && ctx) {
      const el = ctx.currentTime - ctxStart - outLatency();
      return clamp(offset + Math.max(0, el), 0, DUR);
    }
    if (wantPlay) return clamp(offset + (nowMs() - wallStart) / 1000, 0, DUR);
    return offset;
  }

  function stopSource() {
    if (!source) return;
    token++;
    const s = source;
    const g = srcGain;
    source = null;
    srcGain = null;
    playing = false;
    try {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.015);
      s.stop(t + 0.03);
    } catch (e) {
      /* already stopped */
    }
    setTimeout(() => {
      try {
        s.disconnect();
        g.disconnect();
      } catch (e) {
        /* ignore */
      }
    }, 120);
  }

  function startSource(t) {
    stopSource();
    if (!ctx || !buffer) return;
    const pos = clamp(t, 0, DUR);
    if (pos >= buffer.duration - 0.01) {
      offset = DUR;
      wantPlay = false;
      fire(endedCbs);
      return;
    }
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    const g = ctx.createGain();
    const when = ctx.currentTime + 0.02;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(1, when + 0.012);
    s.connect(g);
    g.connect(master);
    const my = ++token;
    s.onended = () => {
      if (my !== token || source !== s) return;
      source = null;
      srcGain = null;
      playing = false;
      wantPlay = false;
      offset = DUR;
      // the last samples are still in the output pipeline: report the end once they have been
      // heard (the player's own clock meanwhile reaches 178 s and draws the final frame)
      setTimeout(() => {
        if (my === token && !playing && !wantPlay) fire(endedCbs);
      }, Math.round(outLatency() * 1000) + 30);
    };
    s.start(when, pos);
    source = s;
    srcGain = g;
    ctxStart = when;
    offset = pos;
    playing = true;
  }

  /**
   * Get the context running, then start the source if playback is still wanted. Every call
   * supersedes the previous ones, so overlapping play()/init() continuations (e.g. a
   * play -> pause -> play burst while resume() is pending) start exactly one source.
   */
  async function kick() {
    const my = ++startSeq;
    const c = ensureCtx();
    if (!c) return;
    if (c.state !== 'running') {
      try {
        await c.resume();
      } catch (e) {
        /* autoplay policy: stays silent, the visuals keep their own clock */
      }
    }
    if (my !== startSeq || !wantPlay || !ready || playing) return;
    // continue from where the wall clock says we are (resume() may have taken a moment)
    startSource(currentTime());
  }

  function applyGain() {
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.015);
  }

  return {
    init() {
      if (!renderPromise) {
        renderPromise = (async () => {
          // let the first frame paint and the player boot before the heavy lifting
          await new Promise((r) => setTimeout(r, 250));
          buffer = await renderSoundtrack(44100, { budgetMs: 12 }); // short slices: the player animates meanwhile
          ready = true;
          fire(readyCbs);
          readyCbs.length = 0;
          if (wantPlay) await kick();
        })();
      }
      return renderPromise;
    },
    isReady: () => ready,
    onReady(cb) {
      if (typeof cb !== 'function') return;
      if (ready) queueMicrotask(cb);
      else readyCbs.push(cb);
    },
    onEnded(cb) {
      if (typeof cb === 'function') endedCbs.push(cb);
    },
    async play(t) {
      stopSource(); // play(t) while playing restarts at t (offset/ctxStart must not mix)
      offset = clamp(Number(t) || 0, 0, DUR);
      wallStart = nowMs();
      wantPlay = true;
      await kick();
    },
    pause() {
      const t = currentTime();
      wantPlay = false;
      startSeq++; // cancel any start still waiting for resume()
      stopSource();
      offset = t;
    },
    seek(t) {
      const pos = clamp(Number(t) || 0, 0, DUR);
      if (playing) startSource(pos);
      else {
        offset = pos;
        wallStart = nowMs();
      }
    },
    isPlaying: () => playing && !!source,
    getCurrentTime: () => currentTime(),
    setVolume(v) {
      volume = clamp(Number(v) || 0, 0, 1);
      applyGain();
    },
    getVolume: () => volume,
    setMuted(b) {
      muted = !!b;
      applyGain();
    },
    isMuted: () => muted,
    toggleMute() {
      muted = !muted;
      applyGain();
    },
  };
}
