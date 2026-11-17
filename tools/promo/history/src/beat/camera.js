// src/beat/camera.js
// Output view size (shared by every stage) and the gallery-ride stage's motion:
// the rider's continuous world position and a calm, C2-continuous dolly camera along
// the museum wall. No roll, no whip-pans, no zoom pumping. The rider stays near screen
// centre; a gentle harmonic lead makes the camera dwell while each panel is centred.

import {
  INTRO_SEC,
  CHAPTER_SEC,
  NUM_CHAPTERS,
  OUTRO_START,
  BAR_SEC,
  BEAT_SEC,
  clamp,
  lerp,
  smootherstep,
  actionPhaseAt,
} from './timeline.js';

export const VIEW_W = 1920;
export const VIEW_H = 1080;

// ---- gallery-ride geometry ---------------------------------------------------
export const PANEL_SIZE = 1000;
/** Canonical road height at x = 0 and x = 1000 of every panel (slope must be 0 there). */
export const ROAD_Y = 700;
/** Rider ground speed in world px / s: one panel per chapter. */
export const RIDER_SPEED = PANEL_SIZE / CHAPTER_SEC;
/** 1000 world px panel -> 860 screen px. */
export const BASE_SCALE = 0.86;
/** World Y placed at screen centre: panel top lands at ~28 px, leaving room for placards + time ruler. */
export const CAM_Y = 595;

const LEAD_AMP = 46; // world px of harmonic framing lead
/** The rider sets off one bar before the first chapter. */
const RIDE_DUR = Math.min(BAR_SEC, INTRO_SEC * 0.45);
const INTRO_RIDE_START = INTRO_SEC - RIDE_DUR;

/**
 * Continuous world X of the rider's bicycle centre.
 * - Intro (last bar): accelerates from rest to x = 0 with C2-matched position / velocity /
 *   acceleration so the hand-off into chapter 1 has zero kink.
 * - Chapters: x = idx * 1000 + RIDER_SPEED * localT (constant speed, one panel per chapter).
 * - Outro: keeps rolling for the cross-dissolve.
 */
export function getRiderWorldState(t) {
  if (t < INTRO_SEC) {
    const s = clamp((t - INTRO_RIDE_START) / RIDE_DUR, 0, 1);
    const s3 = s * s * s;
    const s4 = s3 * s;
    const ease = -0.5 + s3 - 0.5 * s4; // -0.5 -> 0, d/ds = 1 at s = 1, d2/ds2 = 0 at s = 1
    const mX = RIDER_SPEED * RIDE_DUR;
    const mTheta = (Math.PI / BEAT_SEC) * RIDE_DUR;
    return {
      visible: t >= INTRO_RIDE_START - 1.2,
      worldX: mX * ease,
      speedScale: s * s * (3 - 2 * s),
      pedalAngle: actionPhaseAt(INTRO_SEC) + mTheta * ease,
    };
  }
  return {
    visible: true,
    worldX: (t - INTRO_SEC) * RIDER_SPEED,
    speedScale: 1,
    pedalAngle: actionPhaseAt(t),
  };
}

export function getCameraState(t) {
  const rider = getRiderWorldState(t);

  if (t < INTRO_SEC) {
    // Rest, then C2-accelerate over the last 0.8 bar to meet the rider at x = 0
    // with matching velocity and zero acceleration.
    const dur = Math.min(0.8 * BAR_SEC, INTRO_SEC * 0.4);
    const tcStart = INTRO_SEC - dur;
    const s = clamp((t - tcStart) / dur, 0, 1);
    const s3 = s * s * s;
    const ease = -0.5 + s3 - 0.5 * s3 * s;
    const camX = RIDER_SPEED * dur * ease;
    return { camX, camY: CAM_Y, scale: BASE_SCALE, rider };
  }

  const st = t - INTRO_SEC;
  // Harmonic lead: 0 at every frame crossing, slows the camera while a panel is centred.
  const leadEnv = smootherstep(INTRO_SEC, INTRO_SEC + 1.2, t) * (1 - smootherstep(OUTRO_START - 4.2, OUTRO_START - 2.6, t));
  let camX = rider.worldX + LEAD_AMP * Math.sin((2 * Math.PI * st) / CHAPTER_SEC) * leadEnv;

  // Settle onto the centre of the final panel before the outro cross-dissolve.
  const settle = smootherstep(OUTRO_START - Math.min(3.2, CHAPTER_SEC * 0.4), OUTRO_START - 0.4, t);
  if (settle > 0) {
    const lastCentre = (NUM_CHAPTERS - 1) * PANEL_SIZE + PANEL_SIZE / 2;
    camX = lerp(camX, lastCentre, settle);
  }

  return { camX, camY: CAM_Y, scale: BASE_SCALE, rider };
}

/** World -> screen helpers. */
export function worldToScreen(cam, wx, wy) {
  return {
    x: VIEW_W / 2 + (wx - cam.camX) * cam.scale,
    y: VIEW_H / 2 + (wy - cam.camY) * cam.scale,
  };
}

/** Indices of panels whose framed bounds intersect the viewport. */
export function getVisiblePanelIndices(cam) {
  const halfW = VIEW_W / 2 / cam.scale + 60;
  const minX = cam.camX - halfW;
  const maxX = cam.camX + halfW;
  const list = [];
  for (let i = 0; i < NUM_CHAPTERS; i++) {
    const x0 = i * PANEL_SIZE;
    if (x0 + PANEL_SIZE >= minX && x0 <= maxX) list.push(i);
  }
  return list;
}
