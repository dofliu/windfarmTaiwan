// src/audio/arrange.js — the musical toolkit every preset arrangement is written with.
//
// One original 4-bar tune (MOTIF: 16 beats, 22 notes) is written in scale degrees and
// mapped onto any mode; presets re-voice it with their own instruments, harmony, rhythm
// feel and percussion, plus a one-beat pickup (negative beats) that crossfades in under
// the bar line.
//
//   Arr       beat grid -> absolute seconds (swing, light humanisation); A.note(track, voice,
//             beat, durBeats, midi, vel, { pan, p }); A.hit(track, drumVoice, beat, vel, { pan, p })
//   makeCtx(mode) -> c: c.m(deg, oct) midi of a scale degree; c.mel(oct) the motif as notes
//             [{ i, s, l, b (beat), d (beats), deg, midi, vel }]; c.voicings(lo, hi) 4 voice-led
//             chords (one per bar); c.root(bar), c.fifth(bar) bass notes; c.prog chord degrees
//   helpers   voiceChord, harmonyBelow, at(V, i), rubIndex / rubsAhead, strum, pattern,
//             T(gain, pan, hall, room, fx) track spec  (fx: { trem, delay, duck })

import { mulberry32, clamp } from './dsp.js';
import { BEAT_SEC } from '../beat/timeline.js';

export const TONIC = 62; // D4 — one tonal centre for the whole film, so era crossfades never clash

export const MODES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian_dominant: [0, 1, 4, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  // Shur on D: D, E-koron (quarter-flat, ~1.5 semitones), F, G, A, Bb, C
  dastgah_shur: [0, 1.5, 3, 5, 7, 8, 10],
  // gong (宮) pentatonic seen through heptatonic degrees: fa -> sol, ti -> do'
  gong: [0, 2, 4, 7, 7, 9, 12],
};

/** Chord per bar as scale-degree stacks (root first). Chosen so every strong-beat note of the motif is a chord tone. */
export const PROG = {
  major: [[0, 2, 4], [3, 5, 7], [4, 6, 8, 10], [0, 2, 4]], // I  IV  V7  I
  dorian: [[0, 2, 4], [3, 5, 7], [4, 6, 8], [0, 2, 4]], // i  IV  v   i
  mixolydian: [[0, 2, 4], [3, 5, 7], [4, 6, 8], [0, 2, 4]], // I  IV  v   I
  natural_minor: [[0, 2, 4], [3, 5, 7], [2, 4, 6, 8], [0, 2, 4]], // i  iv  IIImaj7  i (synthwave)
  lydian: [[0, 2, 4, 8], [1, 3, 5, 7], [4, 6, 8], [0, 2, 4, 5]], // Iadd9  II7  V  I6
  phrygian_dominant: [[0, 2, 4], [3, 5, 7], [0, 2, 6, 8], [0, 2, 4]], // I  iv  I7(b9)  I
  dastgah_shur: [[0, 4], [3, 7], [4, 8], [0, 4]], // drone eras: only used for virtual roots
  gong: [[0, 4], [0, 4], [4, 8], [0, 4]],
};

/**
 * The leitmotif: [startSlot (8th notes from bar 1), lengthSlots, scaleDegree (0 = tonic, 7 = octave)].
 * In D major:  A— F# A | D'—— C# | B— G B | D'— B G | A B C# E' | C#'— A— | D' A F# E | D———
 */
export const MOTIF = [
  [0, 2, 4], [2, 1, 2], [3, 1, 4], [4, 3, 7], [7, 1, 6],
  [8, 2, 5], [10, 1, 3], [11, 1, 5], [12, 2, 7], [14, 1, 5], [15, 1, 3],
  [16, 1, 4], [17, 1, 5], [18, 1, 6], [19, 1, 8], [20, 2, 6], [22, 2, 4],
  [24, 1, 7], [25, 1, 4], [26, 1, 2], [27, 1, 1], [28, 4, 0],
];

export function degSemi(mode, deg) {
  const sc = MODES[mode] || MODES.major;
  const o = Math.floor(deg / 7);
  return sc[deg - o * 7] + 12 * o;
}

export const melVel = (s) => 0.74 + (s % 8 === 0 ? 0.12 : s % 2 === 0 ? 0.06 : 0) + (s >= 16 && s < 24 ? 0.04 : 0) + (s === 28 ? 0.04 : 0);

// -----------------------------------------------------------------------------
// Arranger: beat grid -> absolute seconds, with swing and light humanisation
// -----------------------------------------------------------------------------
export class Arr {
  constructor(t0, { swing = 0.5, human = 0, seed = 1 } = {}) {
    this.t0 = t0;
    this.swing = swing;
    this.human = human;
    this.rnd = mulberry32(seed);
    this.events = [];
  }
  time(b) {
    const ib = Math.floor(b);
    let f = b - ib;
    if (this.swing !== 0.5) f = f < 0.5 ? f * 2 * this.swing : this.swing + (f - 0.5) * 2 * (1 - this.swing);
    return this.t0 + (ib + f) * BEAT_SEC;
  }
  note(tr, voice, b, d, midi, vel, x = {}) {
    let t = this.time(b);
    const te = this.time(b + d);
    let v = vel;
    if (this.human) {
      t += (this.rnd() - 0.5) * 0.014 * this.human;
      v *= 1 + (this.rnd() - 0.5) * 0.16 * this.human;
    }
    this.events.push({ tr, voice, t, dur: Math.max(0.03, te - t), midi, vel: clamp(v, 0.02, 1), pan: x.pan ?? 0, p: x.p });
  }
  hit(tr, kind, b, vel, x = {}) {
    this.note(tr, kind, b, 0.1, 60, vel, x);
  }
}

// -----------------------------------------------------------------------------
// Harmony helpers
// -----------------------------------------------------------------------------
export function voiceChord(mode, degs, lo, hi, prev) {
  const n = degs.length;
  const cands = [];
  for (let inv = 0; inv < n; inv++) {
    const st = [];
    let last = -Infinity;
    for (let k = 0; k < n; k++) {
      let s = degSemi(mode, degs[(inv + k) % n]);
      while (s <= last) s += 12;
      st.push(s);
      last = s;
    }
    for (let o = -4; o <= 4; o++) {
      const notes = st.map((s) => TONIC + s + 12 * o);
      if (notes[0] < lo || notes[n - 1] > hi) continue;
      let ok = true;
      for (let k = 1; k < n; k++) if (notes[k] - notes[k - 1] === 1) ok = false;
      if (ok) cands.push(notes);
    }
  }
  if (!cands.length) {
    // fallback: root position near the bottom of the range
    const st = degs.map((d) => degSemi(mode, d));
    let o = 0;
    while (TONIC + st[0] + 12 * o > lo + 6) o--;
    while (TONIC + st[0] + 12 * o < lo) o++;
    return st.map((s) => TONIC + s + 12 * o);
  }
  const mid = (lo + hi) / 2;
  let best = cands[0];
  let bestScore = Infinity;
  for (const c of cands) {
    let score;
    if (prev) {
      score = 0;
      for (let k = 0; k < Math.min(c.length, prev.length); k++) score += Math.abs(c[k] - prev[k]);
    } else score = Math.abs(c.reduce((a, b) => a + b, 0) / c.length - mid);
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

export function makeCtx(mode, prog = PROG[mode] || PROG.major) {
  const m = (deg, oct = 0) => TONIC + degSemi(mode, deg) + 12 * oct;
  const root = (bar) => 38 + degSemi(mode, prog[bar][0]);
  const fifth = (bar) => {
    const f = 38 + degSemi(mode, prog[bar][0] + 4);
    return f > 47 ? f - 12 : f;
  };
  const voicings = (lo, hi) => {
    const out = [];
    let prev = null;
    for (let bar = 0; bar < 4; bar++) {
      prev = voiceChord(mode, prog[bar], lo, hi, prev);
      out.push(prev);
    }
    return out;
  };
  const mel = (oct = 0) => MOTIF.map(([s, l, d], i) => ({ i, s, l, b: s / 2, d: l / 2, deg: d, midi: m(d, oct), vel: melVel(s) }));
  return { mode, prog, m, root, fifth, voicings, mel };
}

/** Highest chord tone of the note's bar at least a minor third below it (brass-section harmony). */
export function harmonyBelow(c, n) {
  const bar = Math.min(3, Math.floor(n.s / 8));
  let best = n.midi - 12;
  for (const d of c.prog[bar]) for (let o = -2; o <= 1; o++) {
    const m = c.m(d, o);
    if (m <= n.midi - 3 && m > best) best = m;
  }
  return best;
}

export const at = (V, i) => V[((i % V.length) + V.length) % V.length] + 12 * Math.floor(i / V.length);

/** Index of the first of the next `look` melody notes a semitone (or less) away from note i, or -1. */
export function rubIndex(mel, i, look = 2) {
  for (let k = 1; k <= look && i + k < mel.length; k++) {
    const d = Math.abs(mel[i + k].midi - mel[i].midi);
    if (d > 0 && d <= 1.01) return i + k;
  }
  return -1;
}
export const rubsAhead = (mel, i, look = 2) => rubIndex(mel, i, look) >= 0;

export function strum(A, tr, voice, b, notes, vel, dur, dir = 'd', spread = 0.03, p) {
  const order = dir === 'd' ? notes : [...notes].reverse();
  order.forEach((m, k) => A.note(tr, voice, b + k * spread, Math.max(0.05, dur - k * spread), m, vel * (1 - k * 0.06), { p, pan: (k / Math.max(1, order.length - 1) - 0.5) * 0.3 }));
}

/** steps: [beatOffset, chordIndex, durBeats, vel] applied to every bar. */
export function pattern(A, tr, voice, V, steps, bars = [0, 1, 2, 3], x = {}) {
  for (const bar of bars) for (const [o, i, d, v] of steps) A.note(tr, voice, bar * 4 + o, d, at(V[bar], i), v, x);
}

export const T = (gain, pan = 0, hall = 0, room = 0, fx) => ({ gain, pan, hall, room, fx });
