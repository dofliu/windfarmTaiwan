// src/stages/easel/geom.js — fixed geometry of the easel stage (world = the 1920x1080 frame
// at camera zoom 1). Everything the stage draws in the foreground is placed from here.

import { VIEW_W, VIEW_H } from '../../beat/camera.js';

export const W = VIEW_W;
export const H = VIEW_H;

/** Scene canvas each chapter draws into (the valley), composited full-bleed behind the hill. */
export const SCENE = {
  W: 1920,
  H: 1080,
  horizonY: 430, // where a wide landscape's horizon reads best
  groundY: 720, // valley floor reference line (figures standing in the mid-distance)
  /**
   * Key-subject safe area: never covered by the hill / painter / easel / ruler, and clear of the
   * ragged paper fade (top ~70-170 px, right ~70-180 px, bottom ~40-100 px vary along the edge).
   */
  safe: { x: 760, y: 110, w: 1000, h: 830 },
  /** Where a 1000x1000 design (a gallery-ride panel) maps into the scene canvas. */
  layout: { x: 840, y: 50, s: 0.9 },
};
SCENE.layout.x0 = -SCENE.layout.x / SCENE.layout.s; // design-space x of the canvas' left edge
SCENE.layout.x1 = (SCENE.W - SCENE.layout.x) / SCENE.layout.s;
SCENE.layout.y0 = -SCENE.layout.y / SCENE.layout.s;
SCENE.layout.y1 = (SCENE.H - SCENE.layout.y) / SCENE.layout.s;

// ---- hill (foreground, lower left) ---------------------------------------------
const CREST = [
  [-80, 772],
  [60, 762],
  [200, 756],
  [340, 757],
  [480, 765],
  [600, 784],
  [720, 818],
  [830, 868],
  [930, 930],
  [1030, 1004],
  [1110, 1075],
  [1170, 1130],
];

/** Crest height of the hill at x (Catmull-Rom through CREST, tabulated per pixel). */
const TABLE = new Float32Array(W + 1);
(function build() {
  const pts = CREST;
  const seg = (i) => {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    return [p0, p1, p2, p3];
  };
  const samples = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = seg(i);
    for (let k = 0; k < 40; k++) {
      const t = k / 40;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      samples.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  samples.push(pts[pts.length - 1]);
  let j = 0;
  for (let x = 0; x <= W; x++) {
    while (j < samples.length - 2 && samples[j + 1][0] < x) j++;
    const a = samples[j];
    const b = samples[j + 1];
    const u = b[0] === a[0] ? 0 : Math.max(0, Math.min(1, (x - a[0]) / (b[0] - a[0])));
    TABLE[x] = a[1] + (b[1] - a[1]) * u;
  }
})();
export function hillY(x) {
  if (x <= 0) return TABLE[0];
  if (x >= W) return 1200;
  const i = Math.floor(x);
  const f = x - i;
  return TABLE[i] + (TABLE[Math.min(W, i + 1)] - TABLE[i]) * f;
}
/** Right end of the hill at the bottom edge of the frame. */
export const HILL_END_X = 1120;

// ---- painter, easel, board -------------------------------------------------------
export const PAINTER = { x: 240, scale: 1.5 };
PAINTER.y = hillY(PAINTER.x);

/** The painting board on the easel (the paper the painter paints on), world px. */
export const BOARD = { x: 292, y: 372, w: 300, h: 225 };
/** Logical card size (the card is baked at CARD_RES x for crisp zooms). */
export const CARD = { w: 300, h: 225 };

export const EASEL = {
  mastTop: { x: 442, y: 318 },
  legL: { x: 338, y: hillY(338) + 2 },
  legR: { x: 566, y: hillY(566) + 4 },
  legB: { x: 476, y: hillY(476) - 16 }, // back leg (further away -> higher)
  ledgeY: 600,
  ledgeX0: 278,
  ledgeX1: 606,
  jar: { x: 316, y: 600 }, // water jar standing on the ledge (bottom centre)
};

/** Polygon (world px) the hill + painter + easel cover — for the --guides overlay and docs. */
export const COVER = [
  [0, 360],
  [170, 360],
  [175, 300],
  [620, 300],
  [640, 760],
  [720, 818],
  [830, 868],
  [930, 930],
  [1030, 1004],
  [1110, 1080],
  [0, 1080],
];

/** Time ruler (top of the frame). */
export const RULER = { y: 34, x0: 150, x1: 1770 };
