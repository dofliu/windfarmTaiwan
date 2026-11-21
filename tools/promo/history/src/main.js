// src/main.js
// Pure-function frame scheduler `renderFilmFrame(ctx, t)` (delegated to the selected
// STAGE), plus the interactive player (index.html), the deterministic render host
// (render.html) and the single-chapter inspector used by tools/shot.mjs and the gallery.

import {
  TOTAL_DURATION,
  INTRO_SEC,
  CHAPTER_SEC,
  OUTRO_START,
  NUM_CHAPTERS,
  CHAPTERS,
  clamp,
  chapterById,
} from './beat/timeline.js';
import { VIEW_W, VIEW_H } from './beat/camera.js';
import { createKit } from './kit/kit.js';
import { loadFonts } from './kit/fonts.js';
import { renderChapter } from './scenes/index.js';
import { getStage } from './stages/index.js';
import { getCharacter } from './characters/index.js';
import { createAudioEngine } from './audio/engine.js';
import { FILM } from './data/film.config.js';
import { GLYPHS } from './data/glyphs.js';
import { UI } from './data/i18n.js';
import { STAGE_ID, CHARACTER_ID } from './data/staging.js';

const params = new URLSearchParams(window.location.search);
const IS_RENDER_MODE = window.__FILM_RENDER_MODE__ === true || params.get('render') === '1';
const IS_GALLERY = window.__FILM_GALLERY_MODE__ === true;

export const stage = getStage(STAGE_ID);
export const character = getCharacter(CHARACTER_ID);

let kit = null;
let mainCanvas = null;
let mainCtx = null;
let audioEngine = null;
let currentT = clamp(parseFloat(params.get('t') || '0') || 0, 0, TOTAL_DURATION);
let isPlaying = false;
let lastWallMs = 0;
let teachMode = false;
let teachPausedScene = -1;

// =============================================================================
// Frame renderer
// =============================================================================

/** Render the whole 1920x1080 film frame at time t (pure function of t). */
export function renderFilmFrame(ctx, t) {
  return stage.renderFrame(ctx, t);
}

/** Render one chapter's scene canvas alone (stage.scene.W x H) — tools/shot.mjs and the gallery. */
export function renderPanelInto(ctx, chapterId, localT = CHAPTER_SEC / 2, riderLocalX = null, opts = {}) {
  const chapter = typeof chapterId === 'number' ? CHAPTERS[chapterId] : chapterById(chapterId);
  if (!chapter) throw new Error(`unknown chapter ${chapterId}`);
  stage.renderStill(ctx, chapter, localT, { ...opts, riderLocalX });
  return chapter;
}

// =============================================================================
// Boot
// =============================================================================

function allText() {
  const O = FILM.outro || {};
  const parts = [FILM.title, FILM.subtitle, FILM.quote, O.headline, O.summary, O.closing, O.credits, '《》·…「」，。、：；！？0123456789'];
  for (const s of CHAPTERS) parts.push(s.title, s.titleAlt || '', s.caption, s.dateLabel, s.ruler, s.style, s.styleAlt || '', s.description || '', (s.facts || []).join(''), s.specs || '');
  // every non-ASCII glyph used in scene / stage code (tools/glyphs.mjs) + optional FILM.extraGlyphs
  parts.push(GLYPHS, FILM.extraGlyphs || '');
  return Array.from(new Set(parts.join(''))).join('');
}

export async function boot() {
  document.documentElement.lang = UI.htmlLang;
  if (!IS_GALLERY) document.title = FILM.title;
  await loadFonts(allText());
  const charStyle = { ...((FILM.character && FILM.character.colors) || {}) };
  if (FILM.character && FILM.character.hat !== undefined) charStyle.hat = FILM.character.hat;
  kit = createKit({ W: stage.scene.W, H: stage.scene.H, groundY: stage.scene.groundY, character, characterStyle: charStyle });
  if (!character.actions.includes(stage.action)) console.warn(`[character] "${character.id}" has no "${stage.action}" action for stage "${stage.id}"`);
  stage.init({ kit, character, renderChapter });
  window.__FILM_KIT__ = kit;

  const host = document.getElementById('canvas-host');
  mainCanvas = document.createElement('canvas');
  mainCanvas.width = VIEW_W;
  mainCanvas.height = VIEW_H;
  mainCanvas.id = 'film';
  if (host) host.appendChild(mainCanvas);
  mainCtx = mainCanvas.getContext('2d');

  // ---- deterministic external API (tools/*.mjs) ------------------------
  window.renderAt = async (t) => {
    if (mainCanvas.width !== VIEW_W) {
      mainCanvas.width = VIEW_W;
      mainCanvas.height = VIEW_H;
    }
    currentT = clamp(Number(t) || 0, 0, TOTAL_DURATION);
    if (!IS_RENDER_MODE && audioEngine && !isPlaying) audioEngine.seek(currentT);
    const st = renderFilmFrame(mainCtx, currentT);
    if (!IS_RENDER_MODE) updateHUD(st);
    return { t: st.t, section: st.section, sceneIndex: st.sceneIndex };
  };
  window.renderPanelAt = async (chapterId, localT = CHAPTER_SEC / 2, riderLocalX = null, opts = {}) => {
    if (mainCanvas.width !== stage.scene.W || mainCanvas.height !== stage.scene.H) {
      mainCanvas.width = stage.scene.W;
      mainCanvas.height = stage.scene.H;
    }
    const s = renderPanelInto(mainCtx, chapterId, localT, riderLocalX, opts);
    return { id: s.id, num: s.num };
  };
  /** QA: the stage's finished chapter card (easel: the painted board with its miniature), or false. */
  window.renderCardFor = async (chapterId) => {
    if (typeof stage.card !== 'function') return false;
    const chapter = typeof chapterId === 'number' ? CHAPTERS[chapterId] : chapterById(chapterId);
    const card = chapter && stage.card(chapter);
    if (!card) return false;
    mainCanvas.width = card.width;
    mainCanvas.height = card.height;
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    mainCtx.clearRect(0, 0, card.width, card.height);
    mainCtx.drawImage(card, 0, 0);
    return true;
  };
  window.captureFrameAt = async (t, mime = 'image/png', quality = 0.92) => {
    await window.renderAt(t);
    return mainCanvas.toDataURL(mime, quality).split(',')[1];
  };
  window.__FILM_INFO__ = {
    title: FILM.title,
    stage: stage.id,
    character: character.id,
    sceneW: stage.scene.W,
    sceneH: stage.scene.H,
    total: TOTAL_DURATION,
    introSec: INTRO_SEC,
    chapterSec: CHAPTER_SEC,
    outroStart: OUTRO_START,
    chapters: CHAPTERS.map((s) => ({ id: s.id, num: s.num, title: s.title, t0: s.t0, t1: s.t1 })),
  };

  if (IS_GALLERY) {
    window.__FILM_READY__ = true;
    return;
  }

  const st = renderFilmFrame(mainCtx, currentT);
  window.__FILM_READY__ = true;
  if (IS_RENDER_MODE) return;

  audioEngine = createAudioEngine();
  window.__filmAudio = audioEngine;
  initControls();
  updateHUD(st);
  updateAudioHUD();
  audioEngine.onReady(() => updateAudioHUD());
  audioEngine.onEnded(() => {
    currentT = TOTAL_DURATION;
    setPlaying(false, { fromEnded: true });
  });
  audioEngine.init().catch((e) => console.warn('[audio]', e));
  requestAnimationFrame(tick);
  warmUpScenes();
}

/**
 * Bake every era's static layers in the background (one panel per idle slice,
 * nearest eras first) so playback never hitches when a new frame slides in.
 */
function warmUpScenes() {
  const scratch = document.createElement('canvas');
  scratch.width = stage.scene.W;
  scratch.height = stage.scene.H;
  const sctx = scratch.getContext('2d');
  const start = Math.max(0, Math.floor((currentT - INTRO_SEC) / CHAPTER_SEC));
  const order = CHAPTERS.map((s, i) => i).sort((a, b) => Math.abs(a - start) - Math.abs(b - start) || a - b);
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 30));
  const step = () => {
    if (!order.length) return;
    if (isPlaying) {
      // while playing, only warm when we have slack
      setTimeout(() => idle(step), 120);
      return;
    }
    const i = order.shift();
    try {
      renderPanelInto(sctx, i, CHAPTER_SEC / 2, null, {});
    } catch (e) {
      // the scene error is reported by renderScenePanel
    }
    idle(step);
  };
  idle(step);
}

function tick() {
  if (isPlaying) {
    if (audioEngine && audioEngine.isPlaying()) {
      currentT = audioEngine.getCurrentTime();
    } else {
      const now = performance.now();
      currentT += Math.min(0.1, (now - lastWallMs) / 1000);
      lastWallMs = now;
    }
    // teaching mode: pause in the middle of each era
    if (teachMode && currentT >= INTRO_SEC && currentT < OUTRO_START) {
      const idx = Math.floor((currentT - INTRO_SEC) / CHAPTER_SEC);
      const mid = INTRO_SEC + idx * CHAPTER_SEC + CHAPTER_SEC * 0.5;
      if (idx !== teachPausedScene && currentT >= mid) {
        teachPausedScene = idx;
        currentT = mid;
        setPlaying(false);
      }
    }
    if (currentT >= TOTAL_DURATION) {
      currentT = TOTAL_DURATION;
      setPlaying(false, { fromEnded: true });
    }
    const st = renderFilmFrame(mainCtx, currentT);
    updateHUD(st);
  }
  requestAnimationFrame(tick);
}

// =============================================================================
// Player UI
// =============================================================================

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

function setPlaying(next, opts = {}) {
  if (next && currentT >= TOTAL_DURATION - 0.01) {
    currentT = 0;
    teachPausedScene = -1;
  }
  isPlaying = next;
  lastWallMs = performance.now();
  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = isPlaying ? UI.pause : UI.play;
  if (!audioEngine) return;
  if (isPlaying) audioEngine.play(currentT).catch((e) => console.warn('[audio]', e));
  else if (!opts.fromEnded) audioEngine.pause();
}

let lastInfoScene = -2;
function updateHUD(st) {
  const scrub = document.getElementById('scrubber');
  if (scrub && document.activeElement !== scrub) scrub.value = st.t.toFixed(3);
  const time = document.getElementById('time-readout');
  if (time) time.textContent = `${fmt(st.t)} / ${fmt(TOTAL_DURATION)}`;
  const badge = document.getElementById('era-badge');
  const idx = st.section === 'chapters' ? st.sceneIndex : st.section === 'intro' ? -1 : NUM_CHAPTERS;
  if (badge) {
    badge.textContent =
      st.section === 'intro'
        ? `${UI.intro} · ${FILM.title}`
        : st.section === 'outro'
          ? `${UI.outro} · ${(FILM.outro && FILM.outro.headline) || FILM.title}`
          : `${String(st.scene.num).padStart(2, '0')} · ${st.scene.dateLabel} · ${st.scene.title}`;
  }
  const jump = document.getElementById('scene-jump');
  if (jump && document.activeElement !== jump) jump.value = String(idx);
  if (idx !== lastInfoScene) {
    lastInfoScene = idx;
    renderInfoCard(idx);
  }
}

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function renderInfoCard(idx) {
  const el = document.getElementById('info-card');
  if (!el) return;
  if (idx < 0) {
    el.innerHTML = `<h2>${esc(FILM.title)} <small>${esc(FILM.subtitleAlt || '')}</small></h2>
      <p>${esc(FILM.subtitle || '')}</p>
      ${FILM.quote ? `<p>${esc(FILM.quote)}</p>` : ''}
      <p class="hint">${esc(UI.hint)}</p>`;
    return;
  }
  if (idx >= NUM_CHAPTERS) {
    el.innerHTML = `<h2>${esc((FILM.outro && FILM.outro.headline) || FILM.title)} <small>${esc(UI.outro)}</small></h2><p>${UI.outroCard(NUM_CHAPTERS)}</p>`;
    return;
  }
  const s = CHAPTERS[idx];
  const facts = (s.facts || []).map((f) => `<li>${esc(f)}</li>`).join('');
  const srcs = (s.sources || []).map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)}</a></li>`).join('');
  const accent = (s.frame && s.frame.accent) || (s.palette && s.palette[1]) || '#c9a45c';
  el.innerHTML = `
    <div class="info-head"><span class="num" style="background:${esc(accent)}">${String(s.num).padStart(2, '0')}</span>
      <div><h2>${esc(s.title)} <small>${esc(s.titleAlt || '')}</small></h2><div class="meta">${esc(s.dateLabel)} · ${esc(UI.style)}：${esc(s.style || '')}</div></div></div>
    <p class="caption">${esc(s.caption)}</p>
    ${s.description ? `<p>${esc(s.description)}</p>` : ''}
    ${facts ? `<ul class="facts">${facts}</ul>` : ''}
    ${s.specs ? `<p class="specs"><b>${esc(UI.specs)}</b> ${esc(s.specs)}</p>` : ''}
    ${srcs ? `<details><summary>${esc(UI.sources)}</summary><ul class="sources">${srcs}</ul></details>` : ''}`;
}

function updateAudioHUD() {
  const btn = document.getElementById('btn-mute');
  const status = document.getElementById('audio-status');
  if (!audioEngine) return;
  if (btn) btn.textContent = audioEngine.isMuted() ? UI.muted : UI.sound;
  if (status) {
    const ready = audioEngine.isReady();
    status.textContent = ready ? UI.audioReady : UI.audioLoading;
    status.className = ready ? 'is-ready' : 'is-loading';
  }
}

function seekTo(t) {
  currentT = clamp(t, 0, TOTAL_DURATION);
  teachPausedScene = Math.floor((currentT - INTRO_SEC) / CHAPTER_SEC + 1e-6);
  // allow the teaching pause of the current era if we landed before its middle
  const local = currentT - INTRO_SEC - teachPausedScene * CHAPTER_SEC;
  if (local < CHAPTER_SEC * 0.5 - 0.05) teachPausedScene -= 1;
  if (audioEngine) audioEngine.seek(currentT);
  const st = renderFilmFrame(mainCtx, currentT);
  updateHUD(st);
}

/** Fill the static player chrome (labels / tooltips) from the UI strings. */
function applyStaticUI() {
  const set = (id, fn) => {
    const el = document.getElementById(id);
    if (el) fn(el);
  };
  set('btn-play', (el) => (el.textContent = UI.play));
  set('stage-wrap', (el) => (el.title = UI.clickToPlay));
  set('scrubber', (el) => el.setAttribute('aria-label', UI.scrubLabel));
  set('scene-jump', (el) => el.setAttribute('aria-label', UI.jumpLabel));
  set('teach-label', (el) => (el.textContent = ` ${UI.teach}`));
  set('volume-slider', (el) => el.setAttribute('aria-label', UI.volumeLabel));
  set('gallery-link', (el) => (el.textContent = UI.galleryLink(NUM_CHAPTERS)));
  set('time-readout', (el) => (el.textContent = `00:00.0 / ${fmt(TOTAL_DURATION)}`));
}

function initControls() {
  applyStaticUI();
  const btn = document.getElementById('btn-play');
  const scrub = document.getElementById('scrubber');
  const jump = document.getElementById('scene-jump');
  const mute = document.getElementById('btn-mute');
  const vol = document.getElementById('volume-slider');
  const fs = document.getElementById('btn-fullscreen');
  const teach = document.getElementById('teach-mode');
  const stage = document.getElementById('stage-wrap');

  if (btn) btn.addEventListener('click', () => setPlaying(!isPlaying));
  if (stage) stage.addEventListener('click', () => setPlaying(!isPlaying));
  if (scrub) {
    scrub.max = String(TOTAL_DURATION);
    scrub.addEventListener('input', () => {
      if (isPlaying) setPlaying(false);
      seekTo(parseFloat(scrub.value) || 0);
    });
  }
  if (jump) {
    const add = (v, label) => {
      const o = document.createElement('option');
      o.value = String(v);
      o.textContent = label;
      jump.appendChild(o);
    };
    add(-1, `${UI.intro} · ${FILM.title}`);
    CHAPTERS.forEach((s, i) => add(i, `${String(s.num).padStart(2, '0')} · ${s.dateLabel} · ${s.title}`));
    add(NUM_CHAPTERS, UI.outroJump);
    jump.addEventListener('change', () => {
      const v = parseInt(jump.value, 10);
      const target = v < 0 ? 0 : v >= NUM_CHAPTERS ? OUTRO_START + 1 : CHAPTERS[v].t0 + 0.01;
      seekTo(target);
    });
  }
  if (mute)
    mute.addEventListener('click', () => {
      audioEngine.toggleMute();
      updateAudioHUD();
    });
  if (vol)
    vol.addEventListener('input', () => {
      const v = parseFloat(vol.value);
      audioEngine.setVolume(Number.isFinite(v) ? v : 0.9);
      audioEngine.setMuted(v <= 0.001);
      updateAudioHUD();
    });
  if (teach)
    teach.addEventListener('change', () => {
      teachMode = teach.checked;
      teachPausedScene = Math.floor((currentT - INTRO_SEC) / CHAPTER_SEC + 1e-6) - 1;
    });
  const toggleFs = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };
  if (fs) fs.addEventListener('click', toggleFs);

  window.addEventListener('keydown', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      setPlaying(!isPlaying);
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      toggleFs();
    } else if (e.code === 'KeyM') {
      audioEngine.toggleMute();
      updateAudioHUD();
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      e.preventDefault();
      const d = (e.shiftKey ? 2 : 0.5) * (e.code === 'ArrowRight' ? 1 : -1);
      seekTo(currentT + d);
    }
  });
}

