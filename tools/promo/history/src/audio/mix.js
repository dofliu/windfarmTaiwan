// src/audio/mix.js — mixes one section of the score (intro, an era, the outro) into a dry
// stereo stem plus half-rate hall/room reverb sends, with per-track FX (tremolo, side-chain
// ducking, delay). Shared verbatim by the synth worker and the main-thread fallback in
// engine.js, so both paths produce bit-identical stems.

import { renderVoice, clearVoiceCache } from './instruments.js';
import { clamp } from './dsp.js';

export function applyTrackFx(L, R, fx, sr, startT) {
  if (!fx) return;
  const n = L.length;
  if (fx.trem) {
    const { rate, depth } = fx.trem;
    for (let i = 0; i < n; i++) {
      const m = 1 - depth * (0.5 + 0.5 * Math.sin(2 * Math.PI * rate * (startT + i / sr)));
      L[i] *= m;
      R[i] *= m;
    }
  }
  if (fx.duck) {
    const { times, depth, release } = fx.duck;
    let k = 0;
    for (let i = 0; i < n; i++) {
      const t = startT + i / sr;
      while (k + 1 < times.length && times[k + 1] <= t) k++;
      const dt = t - times[k];
      let env = 0;
      if (dt >= 0) env = dt < 0.006 ? dt / 0.006 : Math.exp(-(dt - 0.006) / release);
      const g = 1 - depth * env;
      L[i] *= g;
      R[i] *= g;
    }
  }
  if (fx.delay) {
    const { time, fb, mix, pingpong } = fx.delay;
    const D = Math.max(1, Math.round(time * sr));
    const eL = new Float32Array(n);
    const eR = new Float32Array(n);
    const a = 1 - Math.exp((-2 * Math.PI * 3800) / sr);
    let zl = 0;
    let zr = 0;
    for (let i = D; i < n; i++) {
      if (pingpong) {
        zl += a * (0.5 * (L[i - D] + R[i - D]) + fb * eR[i - D] - zl);
        zr += a * (fb * eL[i - D] - zr);
      } else {
        zl += a * (L[i - D] + fb * eL[i - D] - zl);
        zr += a * (R[i - D] + fb * eR[i - D] - zr);
      }
      eL[i] = zl;
      eR[i] = zr;
    }
    for (let i = 0; i < n; i++) {
      L[i] += mix * eL[i];
      R[i] += mix * eR[i];
    }
  }
}

/**
 * Mix one section: a full-rate dry stem plus half-rate hall/room sends (decimated with a
 * [1/4 1/2 1/4] kernel). `scratch` holds per-track buffers reused across tracks/sections;
 * `maybeYield` (optional) is awaited between notes and tracks on the main thread.
 * Returns { len, half, dry: [L, R], hall: [L, R] | null, room: [L, R] | null }.
 */
export async function mixSection(sec, sr, scratch, maybeYield = null) {
  const len = Math.ceil((sec.end - sec.start) * sr);
  const half = (len >> 1) + 2;
  const bus = { len, half, dry: [new Float32Array(len), new Float32Array(len)], hall: null, room: null };
  const byTrack = new Map();
  for (const ev of sec.events) {
    if (!byTrack.has(ev.tr)) byTrack.set(ev.tr, []);
    byTrack.get(ev.tr).push(ev);
  }
  if (scratch.L.length < len + 2) {
    scratch.L = new Float32Array(len + 2);
    scratch.R = new Float32Array(len + 2);
  }
  const tL = scratch.L;
  const tR = scratch.R;
  for (const [name, evs] of byTrack) {
    const cfg = sec.tracks[name] || { gain: 0.5, pan: 0, hall: 0.2, room: 0 };
    tL.fill(0);
    tR.fill(0);
    let lo = len;
    let hi = 0;
    for (const ev of evs) {
      const buf = renderVoice(ev.voice, sr, ev.midi, ev.dur, ev.vel, ev.p || {});
      const off = Math.round((ev.t - sec.start) * sr);
      const pan = clamp(cfg.pan + (ev.pan || 0), -1, 1);
      const th = ((pan + 1) * Math.PI) / 4;
      const gl = Math.cos(th) * ev.vel;
      const gr = Math.sin(th) * ev.vel;
      const i0 = Math.max(0, -off);
      const i1 = Math.min(buf.length, len - off);
      if (i1 > i0) {
        lo = Math.min(lo, off + i0);
        hi = Math.max(hi, off + i1);
        for (let i = i0; i < i1; i++) {
          const v = buf[i];
          tL[off + i] += v * gl;
          tR[off + i] += v * gr;
        }
      }
      if (maybeYield) await maybeYield();
    }
    if (hi <= lo) continue;
    if (cfg.fx) {
      hi = len; // delay tails run to the end of the section
      applyTrackFx(tL.subarray(0, len), tR.subarray(0, len), cfg.fx, sr, sec.start);
    }
    const g = cfg.gain;
    const [DL, DR] = bus.dry;
    for (let i = lo; i < hi; i++) {
      DL[i] += tL[i] * g;
      DR[i] += tR[i] * g;
    }
    for (const key of ['hall', 'room']) {
      const gs = g * (cfg[key] || 0);
      if (gs <= 0) continue;
      if (!bus[key]) bus[key] = [new Float32Array(half), new Float32Array(half)];
      const [SL, SR] = bus[key];
      const j0 = Math.max(1, lo >> 1);
      const j1 = Math.min(half, (hi >> 1) + 1, (len - 1) >> 1);
      for (let j = j0; j < j1; j++) {
        const i = j << 1;
        SL[j] += (0.25 * tL[i - 1] + 0.5 * tL[i] + 0.25 * tL[i + 1]) * gs;
        SR[j] += (0.25 * tR[i - 1] + 0.5 * tR[i] + 0.25 * tR[i + 1]) * gs;
      }
    }
    if (maybeYield) await maybeYield();
  }
  clearVoiceCache(); // pitched notes rarely repeat across eras: keep memory bounded (drum hits stay cached)
  return bus;
}

/** The fields of a section mixSection needs (structured-clone friendly, for the worker). */
export function packSection(sec) {
  return {
    id: sec.id,
    start: sec.start,
    end: sec.end,
    tracks: sec.tracks,
    events: sec.events.map(({ tr, voice, t, dur, midi, vel, pan, p }) => ({ tr, voice, t, dur, midi, vel, pan, p })),
  };
}

/** ArrayBuffers of a bus, for a zero-copy postMessage. */
export function busTransfer(bus) {
  const out = [bus.dry[0].buffer, bus.dry[1].buffer];
  for (const k of ['hall', 'room']) if (bus[k]) out.push(bus[k][0].buffer, bus[k][1].buffer);
  return out;
}
