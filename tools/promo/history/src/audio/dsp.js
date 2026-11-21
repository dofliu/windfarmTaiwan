// src/audio/dsp.js — small deterministic DSP toolkit for the procedural soundtrack.
// Everything here is plain JS on Float32Arrays (no Web Audio), so a note rendered with
// the same arguments is bit-identical every time. Only seeded PRNGs are used.

export const TAU = Math.PI * 2;

// Fast sine: 4096-point table with linear interpolation (error < 1e-6), phase in cycles.
const SIN_N = 4096;
const SIN_T = new Float32Array(SIN_N + 1);
for (let i = 0; i <= SIN_N; i++) SIN_T[i] = Math.sin((TAU * i) / SIN_N);
export function fsin(ph) {
  ph -= Math.floor(ph);
  const x = ph * SIN_N;
  const i = x | 0;
  return SIN_T[i] + (SIN_T[i + 1] - SIN_T[i]) * (x - i);
}

/** Mulberry32 PRNG -> floats in [0, 1). */
export function mulberry32(seed) {
  let s = (seed ^ 0x9e3779b9) >>> 0 || 1;
  return function rand() {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), s | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of a string -> uint32. */
export function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const dbToGain = (db) => Math.pow(10, db / 20);
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Amplitude multiplier per sample for a T60 decay (seconds). */
export const t60coef = (t60, sr) => Math.pow(0.001, 1 / Math.max(1e-4, t60 * sr));

/** Linear-attack / exponential-ish ADSR value at time t for a note of length `dur`. */
export function adsr(t, dur, a, d, s, r) {
  let v;
  if (t < a) v = t / a;
  else if (t < a + d) v = 1 - (1 - s) * ((t - a) / d);
  else v = s;
  if (t > dur) {
    const k = (t - dur) / r;
    // level reached at note-off (attack may not have finished for very short notes)
    const atOff = dur < a ? dur / a : dur < a + d ? 1 - (1 - s) * ((dur - a) / d) : s;
    v = k >= 1 ? 0 : atOff * (1 - k) * (1 - k);
  }
  return v;
}

// -----------------------------------------------------------------------------
// Filters
// -----------------------------------------------------------------------------
/** Topology-preserving-transform state variable filter (Zavalishin). */
export class SVF {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
    this.k = 1;
    this.a1 = 1;
    this.a2 = 0;
    this.a3 = 0;
    this.bpv = 0;
  }
  set(fc, q, sr) {
    const g = Math.tan((Math.PI * clamp(fc, 10, sr * 0.45)) / sr);
    this.k = 1 / q;
    this.a1 = 1 / (1 + g * (g + this.k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
    return this;
  }
  lp(x) {
    const v3 = x - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.bpv = v1;
    return v2;
  }
  bp(x) {
    this.lp(x);
    return this.bpv;
  }
  hp(x) {
    const l = this.lp(x);
    return x - this.k * this.bpv - l;
  }
}

/** RBJ biquad (transposed direct form II). */
export class Biquad {
  constructor(b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0) {
    this.b0 = b0;
    this.b1 = b1;
    this.b2 = b2;
    this.a1 = a1;
    this.a2 = a2;
    this.z1 = 0;
    this.z2 = 0;
  }
  static make(type, fc, q, db, sr) {
    const w = (TAU * clamp(fc, 5, sr * 0.45)) / sr;
    const cw = Math.cos(w);
    const sw = Math.sin(w);
    const alpha = sw / (2 * q);
    const A = Math.pow(10, (db || 0) / 40);
    let b0, b1, b2, a0, a1, a2;
    switch (type) {
      case 'lowpass':
        b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
        break;
      case 'highpass':
        b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
        break;
      case 'bandpass': // constant 0 dB peak gain
        b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
        break;
      case 'peaking':
        b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A;
        break;
      case 'highshelf': {
        const s2 = 2 * Math.sqrt(A) * alpha;
        b0 = A * (A + 1 + (A - 1) * cw + s2);
        b1 = -2 * A * (A - 1 + (A + 1) * cw);
        b2 = A * (A + 1 + (A - 1) * cw - s2);
        a0 = A + 1 - (A - 1) * cw + s2;
        a1 = 2 * (A - 1 - (A + 1) * cw);
        a2 = A + 1 - (A - 1) * cw - s2;
        break;
      }
      case 'lowshelf': {
        const s2 = 2 * Math.sqrt(A) * alpha;
        b0 = A * (A + 1 - (A - 1) * cw + s2);
        b1 = 2 * A * (A - 1 - (A + 1) * cw);
        b2 = A * (A + 1 - (A - 1) * cw - s2);
        a0 = A + 1 + (A - 1) * cw + s2;
        a1 = -2 * (A - 1 + (A + 1) * cw);
        a2 = A + 1 + (A - 1) * cw - s2;
        break;
      }
      default:
        return new Biquad();
    }
    return new Biquad(b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0);
  }
  process(x) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
  run(buf) {
    for (let i = 0; i < buf.length; i++) buf[i] = this.process(buf[i]);
    return buf;
  }
}

/** Apply a list of [type, fc, q, db] biquads to a buffer in place. */
export function eq(buf, sr, bands) {
  for (const [type, fc, q, db] of bands) Biquad.make(type, fc, q, db, sr).run(buf);
  return buf;
}

/** One-pole DC blocker in place. */
export function dcBlock(buf, sr, fc = 20) {
  const R = Math.exp((-TAU * fc) / sr);
  let x1 = 0;
  let y1 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = x - x1 + R * y1;
    x1 = x;
    y1 = y;
    buf[i] = y;
  }
  return buf;
}

/** Short linear fade at both ends (avoids clicks). */
export function fadeEnds(buf, sr, inMs = 1, outMs = 15) {
  const ni = Math.min(buf.length, Math.round((inMs / 1000) * sr));
  const no = Math.min(buf.length, Math.round((outMs / 1000) * sr));
  for (let i = 0; i < ni; i++) buf[i] *= i / ni;
  for (let i = 0; i < no; i++) buf[buf.length - 1 - i] *= i / no;
  return buf;
}

// -----------------------------------------------------------------------------
// Oscillators
// -----------------------------------------------------------------------------
export function polyblep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

/** Band-limited sawtooth: returns value for phase in [0,1) with increment dt. */
export function sawBL(ph, dt) {
  return 2 * ph - 1 - polyblep(ph, dt);
}

/** Band-limited pulse with duty d. */
export function pulseBL(ph, dt, d) {
  let ph2 = ph + (1 - d);
  if (ph2 >= 1) ph2 -= 1;
  return sawBL(ph, dt) - sawBL(ph2, dt); // zero-mean, peak-to-peak 2
}

// -----------------------------------------------------------------------------
// Loudness helpers (K-weighting approximation, ITU-R BS.1770 shape)
// -----------------------------------------------------------------------------
export function kWeightFilters(sr) {
  return [Biquad.make('highshelf', 1681.97, 0.7072, 3.99984, sr), Biquad.make('highpass', 38.1355, 0.5003, 0, sr)];
}

/** K-weighted RMS of mono or stereo buffers between sample indices [a, b). */
export function kRms(chans, sr, a = 0, b = Infinity) {
  let sum = 0;
  let n = 0;
  for (const ch of chans) {
    const [f1, f2] = kWeightFilters(sr);
    const end = Math.min(b, ch.length);
    // warm filters from slightly before the window
    const warm = Math.max(0, a - Math.round(0.05 * sr));
    for (let i = warm; i < end; i++) {
      const y = f2.process(f1.process(ch[i]));
      if (i >= a) {
        sum += y * y;
        n++;
      }
    }
  }
  return n ? Math.sqrt(sum / n) : 0;
}

/** Max K-weighted RMS over sliding windows of `winSec` (hop 10 ms) — a momentary-loudness proxy. */
export function kRmsMax(buf, sr, winSec = 0.3) {
  const [f1, f2] = kWeightFilters(sr);
  const n = buf.length;
  const cum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const y = f2.process(f1.process(buf[i]));
    cum[i + 1] = cum[i] + y * y;
  }
  const w = Math.max(1, Math.min(n, Math.round(winSec * sr)));
  const hop = Math.max(1, Math.round(0.01 * sr));
  let best = 0;
  for (let a = 0; a + w <= n; a += hop) best = Math.max(best, cum[a + w] - cum[a]);
  if (n < w) best = cum[n];
  return Math.sqrt(best / w);
}

export function peakOf(chans, a = 0, b = Infinity) {
  let p = 0;
  for (const ch of chans) {
    const end = Math.min(b, ch.length);
    for (let i = a; i < end; i++) {
      const v = ch[i] < 0 ? -ch[i] : ch[i];
      if (v > p) p = v;
    }
  }
  return p;
}
