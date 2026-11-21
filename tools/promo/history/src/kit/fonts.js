// src/kit/fonts.js
// Font stacks used on canvas. Web fonts come from Google Fonts: FILM.fonts in
// src/data/film.config.js lists the families, injectFontLink() adds the <link> and
// loadFonts() waits for them. Every stack falls back to common Traditional-Chinese
// system fonts so the film still renders offline. Add a stack here when you add a family.

import { FILM } from '../data/film.config.js';

const CJK_FALLBACK = '"PingFang TC", "Microsoft JhengHei", "Noto Sans CJK TC", "WenQuanYi Zen Hei"';

export const FONT = {
  /** Museum serif for titles (Traditional Chinese). */
  serif: `"Noto Serif TC", "Songti TC", "PMingLiU", ${CJK_FALLBACK}, serif`,
  /** Clean sans for captions / UI. */
  sans: `"Noto Sans TC", ${CJK_FALLBACK}, sans-serif`,
  /** Brush-like kai for ink / calligraphy scenes. */
  kai: `"LXGW WenKai TC", "BiauKai", "DFKai-SB", "Noto Serif TC", ${CJK_FALLBACK}, serif`,
  /** Code / HMI / terminal. */
  mono: `"JetBrains Mono", "Noto Sans TC", ${CJK_FALLBACK}, monospace`,
  /** Latin display faces for period flavour (Latin text only). */
  blackletter: '"UnifrakturMaguntia", "Old English Text MT", serif',
  engraving: '"IM Fell English", "Cormorant Garamond", Georgia, serif',
  garamond: '"Cormorant Garamond", Georgia, serif',
  didone: '"Playfair Display", Georgia, serif',
  poster: '"Bebas Neue", "Oswald", Impact, sans-serif',
  pixel: '"Press Start 2P", monospace',
  terminal: '"VT323", "JetBrains Mono", monospace',
};

/** Google Fonts CSS2 URL built from FILM.fonts (film.config.js). */
export const GOOGLE_FONTS_HREF = FILM.fonts && FILM.fonts.length ? 'https://fonts.googleapis.com/css2?' + FILM.fonts.map((f) => `family=${f}`).join('&') + '&display=block' : '';

/** Parse 'Noto+Serif+TC:wght@400;700' / 'IM+Fell+English:ital@0;1' -> [[weightSpec, family], ...]. */
function parseFamily(spec) {
  const [name, axes = ''] = spec.split(':');
  const family = name.replace(/\+/g, ' ');
  const out = [];
  const m = axes.match(/^(ital,)?wght@(.+)$/);
  const it = axes.match(/^ital@(.+)$/);
  if (m) {
    for (const tok of m[2].split(';')) {
      const parts = tok.split(',');
      const w = parts.length === 2 ? parts[1] : parts[0];
      const ital = parts.length === 2 && parts[0] === '1';
      out.push([`${ital ? 'italic ' : ''}${w}`, family]);
    }
  } else if (it) {
    for (const i of it[1].split(';')) out.push([i === '1' ? 'italic 400' : '400', family]);
  } else out.push(['400', family]);
  return out;
}

/** Insert the Google Fonts <link> once; resolves when its @font-face rules are loaded (or fail). */
let linkPromise = null;
export function injectFontLink(doc = document) {
  if (linkPromise) return linkPromise;
  if (!GOOGLE_FONTS_HREF) return (linkPromise = Promise.resolve());
  for (const [href, cross] of [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]]) {
    const l = doc.createElement('link');
    l.rel = 'preconnect';
    l.href = href;
    if (cross) l.crossOrigin = '';
    doc.head.appendChild(l);
  }
  const link = doc.createElement('link');
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_HREF;
  link.setAttribute('data-film-fonts', '1');
  linkPromise = new Promise((res) => {
    link.onload = res;
    link.onerror = res;
    setTimeout(res, 8000);
  });
  doc.head.appendChild(link);
  return linkPromise;
}

const CJK_RE = /\b(TC|SC|HK|JP|KR)\b|WenKai|Kai|Ming|Hei/;

/**
 * Ensure web fonts (including the CJK unicode-range slices for `sampleText`)
 * are loaded before the first canvas draw. Resolves even if offline (12 s cap).
 */
export async function loadFonts(sampleText = '') {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
  await injectFontLink();
  const latin = 'AaBbQqWw0123456789';
  const jobs = [];
  for (const spec of FILM.fonts || []) {
    for (const [w, f] of parseFamily(spec)) {
      const text = CJK_RE.test(f) ? sampleText + latin : latin;
      jobs.push(document.fonts.load(`${w} 32px "${f}"`, text));
    }
  }
  const timeout = new Promise((res) => setTimeout(res, 12000));
  try {
    await Promise.race([Promise.allSettled(jobs), timeout]);
    await Promise.race([document.fonts.ready, timeout]);
  } catch (e) {
    // offline: fall back silently
  }
}
