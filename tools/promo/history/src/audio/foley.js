// src/audio/foley.js — the continuous wind bed (this film is about wind).
//
// Stereo, procedurally generated, deterministic: seeded pink/white noise shaped by
//   - a "body" band-pass whose centre rises with gust strength (the whoosh),
//   - a low rumble and an airy hiss that opens up in strong gusts,
//   - a narrow resonant whistle that only sings in the strongest gusts,
// all driven by slow value-noise gusts and an era-dependent windiness curve (louder for
// the Nile sail and the offshore eras). Left/right use independent noise and offset gust
// phases, so gusts drift across the stereo field.
//
// The bed is generated at half the output rate (it has little content above ~8 kHz) and
// linearly interpolated up by the mixer. Written as a resumable generator so the main
// thread can yield between chunks.

import { SVF, mulberry32, smoothstep } from './dsp.js';

function valueNoise(seed, size = 512) {
  const r = mulberry32(seed);
  const tab = new Float32Array(size);
  for (let i = 0; i < size; i++) tab[i] = r();
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = tab[((i % size) + size) % size];
    const b = tab[(((i + 1) % size) + size) % size];
    return a + (b - a) * u;
  };
}

const onePole = (fc, sr) => 1 - Math.exp((-2 * Math.PI * fc) / sr);

/** Windiness curve sampled on the 10 ms grid WindGen uses (shareable with a worker). */
export function windTable(windiness, length, sr) {
  const nW = Math.ceil((length / sr) * 100) + 2;
  const tab = new Float32Array(nW);
  for (let i = 0; i < nW; i++) tab[i] = windiness(i / 100);
  return tab;
}

export class WindGen {
  /**
   * @param {number} sr generator sample rate (the engine passes output rate / 2)
   * @param {number} length samples at `sr`
   * @param {((t:number)=>number)|Float32Array} windiness 0..1 over film time (s), or its windTable()
   * @param {number} seed
   */
  constructor(sr, length, windiness, seed = 1234) {
    this.sr = sr;
    this.length = length;
    // windiness sampled on a 10 ms grid (the curve is slow; this keeps the inner loop lean).
    // A precomputed table (see windTable) may be passed instead of the function.
    const wTab = typeof windiness === 'function' ? windTable(windiness, length, sr) : windiness;
    const nW = wTab.length;
    this.windiness = (t) => {
      const x = Math.max(0, t * 100);
      const i = Math.min(nW - 2, x | 0);
      return wTab[i] + (wTab[i + 1] - wTab[i]) * (x - i);
    };
    this.L = new Float32Array(length);
    this.R = new Float32Array(length);
    this.pos = 0;
    this.aLow = onePole(170, sr);
    this.aHiss = onePole(1800, sr);
    this.aHp = onePole(55, sr);
    this.ch = [0, 1].map((c) => ({
      seed: (Math.floor(mulberry32(seed + 101 * c)() * 4294967295) >>> 0) || 1,
      b0: 0,
      b1: 0,
      b2: 0,
      zl: 0,
      zh: 0,
      zd: 0,
      body: new SVF(),
      whistle: new SVF(),
      gA: valueNoise(seed + 7 + c * 13),
      gB: valueNoise(seed + 19 + c * 17),
      gC: valueNoise(seed + 31 + c * 23),
      wob: valueNoise(seed + 41 + c * 29),
      offs: c * 0.83,
      a0: 0,
      a1: 0,
      a2: 0,
    }));
  }

  gust(c, t) {
    const x = t + c.offs;
    const g = 0.52 * c.gA(x * 0.13) + 0.3 * c.gB(x * 0.37 + 11) + 0.18 * c.gC(x * 1.05 + 23);
    return smoothstep(0.18, 0.86, g);
  }

  /** Generate up to `n` more samples; returns true when finished. */
  process(n = 1 << 15) {
    const { sr, aLow, aHiss, aHp } = this;
    const end = Math.min(this.length, this.pos + n);
    const BLOCK = 32;
    for (let ci = 0; ci < 2; ci++) {
      const c = this.ch[ci];
      const out = ci === 0 ? this.L : this.R;
      let { b0, b1, b2, zl, zh, zd, a0, a1, a2, seed } = c;
      const { body, whistle } = c;
      let t0 = 0;
      let t1 = 0;
      let t2 = 0;
      let blk = 0;
      for (let i = this.pos; i < end; i++) {
        if (blk === 0) {
          const t = i / sr;
          const w = this.windiness(t);
          const g = this.gust(c, t);
          const G = w * (0.3 + 0.7 * Math.pow(g, 1.4));
          t0 = G; // body
          t1 = 0.55 * w * (0.5 + 0.5 * g); // rumble
          const ws = Math.max(0, G - 0.42);
          t2 = ws * ws * 3.2; // whistle
          body.set(230 + 1100 * G, 0.65, sr);
          whistle.set(620 + 950 * g + 160 * (c.wob(t * 0.45) - 0.5), 16, sr);
          blk = BLOCK;
        }
        blk--;
        // smooth the block targets per sample (no zipper noise)
        a0 += (t0 - a0) * 0.004;
        a1 += (t1 - a1) * 0.004;
        a2 += (t2 - a2) * 0.004;
        // xorshift32 white noise (inline, deterministic)
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        const white = (seed >>> 0) * 4.656612873e-10 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        const pink = (b0 + b1 + b2 + white * 0.1848) * 0.2;
        zl += aLow * (pink - zl);
        zh += aHiss * (white - zh);
        const hiss = white - zh;
        const v = a0 * (1.5 * body.bp(pink) + 0.12 * a0 * hiss) + a1 * 0.9 * zl + a2 * 0.5 * whistle.bp(white);
        zd += aHp * (v - zd);
        out[i] = v - zd;
      }
      Object.assign(c, { b0, b1, b2, zl, zh, zd, a0, a1, a2, seed });
    }
    this.pos = end;
    return this.pos >= this.length;
  }
}
