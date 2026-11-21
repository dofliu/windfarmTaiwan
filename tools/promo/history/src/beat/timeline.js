// src/beat/timeline.js
// Musical clock and film structure, derived from src/data/film.config.js + chapters.js.
//
//   Intro    introBars × bar
//   Chapters N × barsPerChapter × bar   (chapter i runs t0 = INTRO_SEC + i × CHAPTER_SEC)
//   Outro    outroBars × bar
//
// Everything here is a pure function of time `t`, so any frame can be rendered in
// isolation (scrubbing, contact sheets, parallel offline rendering).

import { FILM } from '../data/film.config.js';
import { CHAPTERS as CHAPTER_DATA } from '../data/chapters.js';

export const BPM = Math.max(40, Math.min(220, Number(FILM.bpm) || 120));
export const BEAT_SEC = 60 / BPM;
export const BAR_BEATS = 4;
export const BAR_SEC = BEAT_SEC * BAR_BEATS;

export const INTRO_BARS = Math.max(2, Math.round(FILM.introBars ?? 3));
export const INTRO_SEC = INTRO_BARS * BAR_SEC;

export const CHAPTER_BARS = Math.max(
  1,
  FILM.secondsPerChapter ? Math.round(Number(FILM.secondsPerChapter) / BAR_SEC) : Math.round(FILM.barsPerChapter ?? 4),
);
export const CHAPTER_SEC = CHAPTER_BARS * BAR_SEC;
export const NUM_CHAPTERS = CHAPTER_DATA.length;
export const CHAPTERS_TOTAL_SEC = NUM_CHAPTERS * CHAPTER_SEC;

export const OUTRO_BARS = Math.max(6, Math.round(FILM.outroBars ?? 6));
export const OUTRO_SEC = OUTRO_BARS * BAR_SEC;
export const OUTRO_START = INTRO_SEC + CHAPTERS_TOTAL_SEC;
export const TOTAL_DURATION = OUTRO_START + OUTRO_SEC;

/** Chapter records enriched with timing. */
export const CHAPTERS = CHAPTER_DATA.map((c, idx) => ({
  ...c,
  scene: c.scene || c.id,
  index: idx,
  num: idx + 1,
  t0: INTRO_SEC + idx * CHAPTER_SEC,
  t1: INTRO_SEC + (idx + 1) * CHAPTER_SEC,
}));

// Back-compat aliases (the reference scenes and older tools use these names).
export const SCENE_SEC = CHAPTER_SEC;
export const NUM_SCENES = NUM_CHAPTERS;
export const SCENES = CHAPTERS;

// -----------------------------------------------------------------------------
// Math helpers (shared by every module)
// -----------------------------------------------------------------------------
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
export function smootherstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
/** Quantize time to `hz` updates per second (stop-motion / retro looks). */
export function quantizeTime(t, hz = 12) {
  if (!hz || hz <= 0) return t;
  return Math.floor(t * hz + 1e-6) / hz;
}
/** Ease value in [0,1] that rises at e0..e1 and falls at e2..e3. */
export function envelope(x, e0, e1, e2, e3) {
  return smoothstep(e0, e1, x) * (1 - smoothstep(e2, e3, x));
}

export function chapterById(id) {
  return CHAPTERS.find((s) => s.id === id) || null;
}
export const sceneById = chapterById;

/** Index of the chapter playing at time t (-1 = intro, NUM_CHAPTERS = outro). */
export function chapterIndexAt(t) {
  if (t < INTRO_SEC) return -1;
  if (t >= OUTRO_START) return NUM_CHAPTERS;
  return clamp(Math.floor((t - INTRO_SEC) / CHAPTER_SEC), 0, NUM_CHAPTERS - 1);
}

// -----------------------------------------------------------------------------
// Musical clock
// -----------------------------------------------------------------------------
export function getBeatState(rawT) {
  const t = clamp(rawT, 0, TOTAL_DURATION);
  const globalBeat = t / BEAT_SEC;
  const beatIndex = Math.floor(globalBeat + 1e-7);
  const beatFrac = globalBeat - beatIndex;

  let section = 'chapters';
  let sceneIndex = -1;
  let scene = null;
  let localT = 0;
  let barInScene = 0;
  let beatInScene = 0;

  if (t < INTRO_SEC) {
    section = 'intro';
    localT = t;
  } else if (t < OUTRO_START) {
    const st = t - INTRO_SEC;
    sceneIndex = clamp(Math.floor(st / CHAPTER_SEC), 0, NUM_CHAPTERS - 1);
    scene = CHAPTERS[sceneIndex];
    localT = st - sceneIndex * CHAPTER_SEC;
    beatInScene = localT / BEAT_SEC;
    barInScene = clamp(Math.floor(localT / BAR_SEC), 0, CHAPTER_BARS - 1);
  } else {
    section = 'outro';
    localT = t - OUTRO_START;
  }

  return {
    t,
    bpm: BPM,
    beatSec: BEAT_SEC,
    barSec: BAR_SEC,
    globalBeat,
    beatIndex,
    beatFrac,
    isDownbeat: beatIndex % BAR_BEATS === 0,
    section,
    sceneIndex,
    chapterIndex: sceneIndex,
    scene,
    chapter: scene,
    localT,
    barInScene,
    beatInScene,
  };
}

/** Beat info relative to a chapter's own start (negative before it starts). */
export function chapterBeat(rawLocalT) {
  const beat = rawLocalT / BEAT_SEC;
  const bi = Math.floor(beat);
  return {
    bpm: BPM,
    beatSec: BEAT_SEC,
    barSec: BAR_SEC,
    beat, // fractional beats since the chapter's downbeat
    bar: Math.floor(beat / BAR_BEATS), // 0-based bar inside the chapter
    beatInBar: ((bi % BAR_BEATS) + BAR_BEATS) % BAR_BEATS,
    beatFrac: beat - bi,
    /** 1 on each beat, decaying to 0 over `len` beats — handy for pulses. */
    pulse: (len = 0.5) => Math.max(0, 1 - (beat - bi) / len),
  };
}

// -----------------------------------------------------------------------------
// Character motion clocks (shared by every stage)
// -----------------------------------------------------------------------------
/** Action phase (rad): one full cycle every 2 beats (pedal crank / brush stroke). */
export function actionPhaseAt(t) {
  return (t / BEAT_SEC) * Math.PI;
}
export const pedalAngleAt = actionPhaseAt;

/** Spin angle of a carried rotor-type prop: ~2.2 rev/s with a gentle gust modulation. */
export function propAngleAt(t) {
  const base = t * Math.PI * 2 * 2.2;
  const gust = 0.9 * Math.sin(t * 0.73) + 0.45 * Math.sin(t * 1.91 + 1.3);
  return base + gust;
}
export const pinwheelAngleAt = propAngleAt;
