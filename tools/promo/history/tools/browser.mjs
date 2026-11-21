// tools/browser.mjs — shared Playwright helper: serve the project, open render.html,
// wait for fonts + boot, collect console errors.
import { createRequire } from 'node:module';

// Playwright is pre-installed globally in some environments (resolvable via require/NODE_PATH),
// or locally via `npm i -D playwright`.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { startServer, ROOT } from './serve.mjs';
import { syncGlyphs } from './glyphs.mjs';

/**
 * Staging flags shared by every tool: --staging easel+person | --stage easel | --character person.
 * Returns the URL query ('' when none) and the argv with those flags + values removed.
 */
export function stagingArgs(argv = process.argv.slice(2)) {
  const keys = ['--staging', '--stage', '--character'];
  const q = new URLSearchParams();
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (keys.includes(argv[i]) && argv[i + 1] !== undefined) {
      q.set(argv[i].slice(2), argv[i + 1]);
      i++;
    } else rest.push(argv[i]);
  }
  const s = q.toString();
  return { query: s ? `?${s}` : '', rest };
}

export async function openRenderHost({ page: pageName = 'render.html', viewport = { width: 1920, height: 1080 }, query = null } = {}) {
  if (query === null) query = stagingArgs().query;
  syncGlyphs(ROOT); // preload every glyph scenes draw (lazy CJK font slices break determinism)
  const { server, port } = await startServer(ROOT, 0);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  await page.goto(`http://127.0.0.1:${port}/${pageName}${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__FILM_READY__ === true, null, { timeout: 60000 });
  const close = async () => {
    await browser.close();
    server.close();
  };
  return { page, errors, close, port };
}

/** Returns PNG Buffer of the main canvas. */
export async function grabCanvas(page, mime = 'image/png', quality = 0.92) {
  const b64 = await page.evaluate(
    ([m, q]) => document.querySelector('#canvas-host canvas').toDataURL(m, q).split(',')[1],
    [mime, quality],
  );
  return Buffer.from(b64, 'base64');
}
