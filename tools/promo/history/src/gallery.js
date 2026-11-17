// src/gallery.js — chapter gallery: one still per chapter + the teaching text and sources.
import { boot, renderPanelInto, stage } from './main.js';
import { CHAPTERS, NUM_CHAPTERS, CHAPTER_SEC } from './beat/timeline.js';
import { FILM } from './data/film.config.js';
import { UI } from './data/i18n.js';

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

async function main() {
  document.title = `${FILM.title} · ${UI.galleryTitle(NUM_CHAPTERS)}`;
  document.getElementById('gallery-title').textContent = `${FILM.title} · ${UI.galleryTitle(NUM_CHAPTERS)}`;
  document.getElementById('gallery-intro').textContent = `${FILM.subtitle || ''} ${UI.galleryIntro}`;
  document.getElementById('back-link').textContent = UI.backToPlayer;
  await boot();
  const grid = document.getElementById('grid');
  for (const s of CHAPTERS) {
    const card = document.createElement('article');
    card.className = 'card';
    card.id = `chapter-${s.id}`;
    const canvas = document.createElement('canvas');
    canvas.width = stage.scene.W;
    canvas.height = stage.scene.H;
    canvas.style.aspectRatio = `${stage.scene.W} / ${stage.scene.H}`;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${s.title}（${s.style || ''}）`);
    const facts = (s.facts || []).map((f) => `<li>${esc(f)}</li>`).join('');
    const srcs = (s.sources || []).map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)}</a></li>`).join('');
    card.appendChild(canvas);
    const body = document.createElement('div');
    body.className = 'body';
    body.innerHTML = `
      <div class="date">${String(s.num).padStart(2, '0')} · ${esc(s.dateLabel)}</div>
      <h3>${esc(s.title)}</h3>
      <div class="en">${esc(s.titleAlt || '')}</div>
      <div class="style">${esc(UI.style)}：${esc(s.style || '')}${s.styleAlt ? ` · ${esc(s.styleAlt)}` : ''}</div>
      <p class="cap">${esc(s.caption)}</p>
      ${s.description ? `<p>${esc(s.description)}</p>` : ''}
      ${facts ? `<ul>${facts}</ul>` : ''}
      ${s.specs ? `<p class="style"><b>${esc(UI.specs)}</b> ${esc(s.specs)}</p>` : ''}
      ${srcs ? `<details><summary>${esc(UI.sources)}</summary><ul>${srcs}</ul></details>` : ''}
      <p class="play"><a href="./index.html?t=${(s.t0 + 0.01).toFixed(2)}">${esc(UI.playFromHere)}</a></p>`;
    card.appendChild(body);
    grid.appendChild(card);
    // render lazily, one per animation frame, so the page stays responsive
    await new Promise((r) => requestAnimationFrame(r));
    renderPanelInto(canvas.getContext('2d'), s.id, CHAPTER_SEC / 2, stage.id === 'gallery-ride' ? 500 : null, { isThumbnail: true });
  }
  window.__FILM_GALLERY_DONE__ = true;
}
main();
