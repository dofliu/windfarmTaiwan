// src/audio/score.js — builds the whole film score from the chapters' music recipes.
//
// Output: plain data. buildScore() -> [{ id, index, t0, t1, start, end, tracks, events, eq,
// loudDb, measure }] where events are { tr, voice, t (s, absolute film time), dur (s), midi,
// vel, pan, p }. The engine (engine.js) synthesises, loudness-matches and overlaps them.
//
//   intro    FILM.music.intro preset, written for 3 bars, placed so it ends on chapter 1's
//            downbeat (longer intros get a sustained pad underneath first)
//   chapter  PRESETS[recipe.preset] (presets.js) tiled over CHAPTER_BARS: 4-bar repeats, the
//            pickup of a repeat is dropped, anything past the chapter end is cut
//   outro    FILM.music.outro preset from the outro downbeat (6 bars of music)
//
// Tempo: everything is written in beats, so it follows FILM.bpm; delay times scale with it.
// Key:   FILM.music.transpose shifts every pitched note (percussion is untouched).

import { CHARACTER_CYCLES } from '../data/staging.js';
import { hashStr, clamp } from './dsp.js';
import { VOICES } from './instruments.js';
import { Arr, makeCtx, T } from './arrange.js';
import { PRESETS, getPreset, INTRO_PRESETS, OUTRO_PRESETS } from './presets.js';
import { FILM } from '../data/film.config.js';
import { CHAPTERS, INTRO_SEC, CHAPTER_SEC, CHAPTER_BARS, OUTRO_START, TOTAL_DURATION, BEAT_SEC, BAR_SEC } from '../beat/timeline.js';

const MUSIC = FILM.music || {};
const TRANSPOSE = Math.round(clamp(Number(MUSIC.transpose) || 0, -12, 12));
const TEMPO_K = BEAT_SEC / 0.5; // presets' delay times were written at 120 BPM
const DEFAULT_PRESET = 'ancient-harp';

/** Resolve a chapter's recipe against the preset library. */
export function chapterRecipe(ch) {
  const r = ch.music || {};
  let id = r.preset;
  if (!PRESETS[id]) {
    if (id) console.warn(`[score] unknown music preset "${id}" for chapter ${ch.id}; using ${DEFAULT_PRESET}`);
    id = DEFAULT_PRESET;
  }
  const pr = getPreset(id);
  return {
    preset: id,
    arrange: pr.arrange,
    mode: r.mode || pr.mode,
    lead: pr.lead,
    relayP: pr.relayP,
    loudDb: r.loudDb ?? pr.loudDb ?? 0,
    wind: r.wind ?? pr.wind ?? 0.5,
    human: r.human ?? pr.human ?? 0,
    swing: r.swing ?? pr.swing ?? 0.5,
  };
}

function scaleFx(tracks) {
  for (const k of Object.keys(tracks || {})) {
    const fx = tracks[k] && tracks[k].fx;
    if (fx && fx.delay) tracks[k] = { ...tracks[k], fx: { ...fx, delay: { ...fx.delay, time: fx.delay.time * TEMPO_K } } };
  }
  return tracks;
}

function transpose(events) {
  if (!TRANSPOSE) return events;
  for (const e of events) if (VOICES[e.voice] && !VOICES[e.voice].drum) e.midi += TRANSPOSE;
  return events;
}

/** Build all sections of the film score. Pure & deterministic. */
export function buildScore() {
  const sections = [];
  // the bicycle bell / freewheel belong to the riding stage
  const characterCycles = CHARACTER_CYCLES;

  // ---- intro ---------------------------------------------------------------
  const introFn = INTRO_PRESETS[MUSIC.intro ?? 'wind-chimes'];
  if (introFn) {
    const a0 = INTRO_SEC - 12 * BEAT_SEC; // the preset is 3 bars long, ending on chapter 1
    const A = new Arr(a0, { seed: hashStr('intro') });
    if (a0 > 1) {
      // longer intro: hold a soft tonic pad from 0.5 s until the preset starts
      const lead = -a0 / BEAT_SEC + 1;
      [50, 57, 62].forEach((m, k) => A.note('pre', 'pad', lead, -lead + 0.6, m, 0.42, { pan: (k - 1) * 0.3, p: { att: 1.5, rel: 0.8 } }));
    }
    const r = introFn(A, { bell: characterCycles });
    if (r.tracks && A.events.some((e) => e.tr === 'pre')) r.tracks.pre = T(0.36, 0, 0.45);
    const start = Math.min(0, a0);
    sections.push({ id: 'intro', index: -1, t0: 0, t1: INTRO_SEC, start, end: INTRO_SEC + 0.6, events: transpose(A.events), ...r, tracks: scaleFx(r.tracks), loudDb: -4.5, measure: [Math.max(0.5, a0 + 0.5), INTRO_SEC] });
  }

  // ---- chapters --------------------------------------------------------------
  const reps = Math.ceil(CHAPTER_BARS / 4);
  CHAPTERS.forEach((ch, i) => {
    const rec = chapterRecipe(ch);
    const t0 = ch.t0;
    const t1 = t0 + CHAPTER_SEC;
    let events = [];
    let res = null;
    const duckTimes = {};
    for (let j = 0; j < reps; j++) {
      const rt0 = t0 + j * 4 * BAR_SEC;
      const A = new Arr(rt0, { swing: rec.swing, human: rec.human, seed: hashStr(ch.id + (j ? `:${j}` : '')) });
      const r = rec.arrange(A, makeCtx(rec.mode));
      if (!res) res = r;
      for (const [k, tr] of Object.entries(r.tracks || {})) if (tr && tr.fx && tr.fx.duck) (duckTimes[k] ||= []).push(...tr.fx.duck.times);
      for (const e of A.events) {
        if (j > 0 && e.t < rt0 - 1e-6) continue; // a repeat's pickup would double the previous bar
        if (e.t >= t1 - 1e-6) continue; // truncated chapters
        events.push(e);
      }
    }
    const tracks = { ...res.tracks };
    for (const k of Object.keys(duckTimes)) tracks[k] = { ...tracks[k], fx: { ...tracks[k].fx, duck: { ...tracks[k].fx.duck, times: duckTimes[k] } } };
    events = transpose(events);
    sections.push({ id: ch.id, preset: rec.preset, index: i, mode: rec.mode, t0, t1, start: t0 - BEAT_SEC, end: t1 + 0.6, events, ...res, tracks: scaleFx(tracks), loudDb: rec.loudDb, measure: [t0, t1] });
  });

  // ---- outro -----------------------------------------------------------------
  const outroFn = OUTRO_PRESETS[MUSIC.outro ?? 'relay-finale'];
  if (outroFn) {
    const A = new Arr(OUTRO_START, { seed: hashStr('outro') });
    const relay = CHAPTERS.map((ch) => {
      const r = chapterRecipe(ch);
      return { voice: r.lead, p: r.relayP };
    });
    const r = outroFn(A, { relay, bell: characterCycles });
    sections.push({ id: 'outro', index: CHAPTERS.length, t0: OUTRO_START, t1: TOTAL_DURATION, start: OUTRO_START - BEAT_SEC, end: TOTAL_DURATION, events: transpose(A.events), ...r, tracks: scaleFx(r.tracks), loudDb: 0.5, measure: [OUTRO_START, Math.min(TOTAL_DURATION, OUTRO_START + 20 * BEAT_SEC)] });
  }
  // (a humanised pickup note may start a few ms before its section's buffer: mix.js clips it,
  // exactly as in the reference film)
  return sections;
}

/** Ambience bed spec for the engine: { kind: 'wind' | 'none', level, scale }. */
export function bedSpec() {
  const kind = MUSIC.bed ?? 'wind';
  const level = Math.max(0, Number(MUSIC.bedLevel ?? 1));
  if (kind === 'none' || level === 0) return { kind: 'none', level: 0, scale: 0 };
  if (kind === 'breeze') return { kind: 'wind', level: level * 0.7, scale: 0.55 };
  return { kind: 'wind', level, scale: 1 };
}

/**
 * Wind strength over the film (0..1): strong at the very start (the wind comes first), the
 * per-chapter level (recipe.wind or the preset's), then a lull that swells again under the
 * final chord. Segments are blended with a 1.2 s smoothstep centred on every bar-line
 * boundary, so the curve is continuous everywhere.
 */
export function windinessAt(t) {
  const n = CHAPTERS.length;
  const bed = bedSpec();
  const k = INTRO_SEC / 6;
  const level = (idx, tt) => {
    if (idx < 0) return 0.95 - 0.25 * clamp((tt - 2 * k) / (3 * k), 0, 1);
    if (idx >= n) return 0.6 + 0.25 * clamp((tt - (TOTAL_DURATION - 4)) / 2, 0, 1);
    return chapterRecipe(CHAPTERS[idx]).wind;
  };
  const x = (t - INTRO_SEC) / CHAPTER_SEC;
  const seg = clamp(Math.floor(x), -1, n);
  const kb = clamp(Math.round(x), 0, n);
  const dt = t - (INTRO_SEC + kb * CHAPTER_SEC);
  const H = 0.6;
  let w;
  if (dt > -H && dt < H) {
    const u = (dt + H) / (2 * H);
    const s = u * u * (3 - 2 * u);
    w = level(kb - 1, t) * (1 - s) + level(kb, t) * s;
  } else w = level(seg, t);
  return w * (bed.scale || 0);
}
