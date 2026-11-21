// src/audio/synth-worker.js — Web Worker that mixes whole score sections (synthesising their
// notes) and renders the wind bed off the main thread. Pure functions of their inputs, so
// results are bit-identical to the main-thread fallback path in engine.js (same mix.js).
//
// Dev: started as a module worker (new URL('./synth-worker.js', import.meta.url)).
// Single-file build: tools/build.mjs bundles this file as an IIFE, injects it as a string
// (window.__FILM_SYNTH_WORKER_SRC__) and engine.js starts it as a classic Blob-URL worker.
// It deliberately imports no score / era data: jobs carry their events and the wind table.
import { mixSection, busTransfer } from './mix.js';
import { WindGen } from './foley.js';

const scratch = { L: new Float32Array(0), R: new Float32Array(0) };

self.onmessage = async (e) => {
  const msg = e.data || {};
  try {
    if (msg.type === 'ping') {
      self.postMessage({ type: 'pong', id: msg.id });
    } else if (msg.type === 'mix') {
      // no awaits happen inside (no yielder), so jobs never interleave on `scratch`
      const bus = await mixSection(msg.sec, msg.sr, scratch);
      self.postMessage({ type: 'mix', id: msg.id, bus }, busTransfer(bus));
    } else if (msg.type === 'wind') {
      const w = new WindGen(msg.sr, msg.length, msg.table, msg.seed);
      while (!w.process(1 << 16));
      self.postMessage({ type: 'wind', id: msg.id, L: w.L, R: w.R }, [w.L.buffer, w.R.buffer]);
    } else {
      self.postMessage({ type: 'error', id: msg.id, message: `unknown job ${msg.type}` });
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id, message: String((err && err.stack) || err) });
  }
};
