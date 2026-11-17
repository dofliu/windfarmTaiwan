// tools/validate.mjs — static checks of film.config.js + chapters.js before rendering.
//   node tools/validate.mjs
// Checks: required chapter fields, unique ids, scene modules registered in src/scenes/index.js
// (and the file exists), music preset ids, prop types, stage / character ids, durations,
// and that no scene file uses Math.random / Date / performance.now.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './serve.mjs';
import { FILM } from '../src/data/film.config.js';
import { CHAPTERS } from '../src/data/chapters.js';
import { PRESETS, INTRO_PRESETS, OUTRO_PRESETS } from '../src/audio/presets.js';
import { PROP_TYPES } from '../src/kit/props.js';
import { TOTAL_DURATION, CHAPTER_SEC, INTRO_SEC, OUTRO_SEC, BPM } from '../src/beat/timeline.js';

const problems = [];
const warn = [];
const req = ['id', 'dateLabel', 'ruler', 'title', 'caption', 'palette'];
const ids = new Set();
const sceneIndex = fs.readFileSync(path.join(ROOT, 'src/scenes/index.js'), 'utf8');
const stagesIndex = fs.readFileSync(path.join(ROOT, 'src/stages/index.js'), 'utf8');
const charIndex = fs.readFileSync(path.join(ROOT, 'src/characters/index.js'), 'utf8');

const STAGE_ACTIONS = { 'gallery-ride': 'cycle', easel: 'paint' };
if (!/^[a-z-]+\+[a-z-]+$/.test(String(FILM.staging || ''))) problems.push(`FILM.staging "${FILM.staging}" must look like '<stage>+<character>' (e.g. 'easel+person')`);
if (!new RegExp(`['"]?${FILM.stage}['"]?\\s*[:,]`).test(stagesIndex.split('STAGES = {')[1] || '')) problems.push(`stage "${FILM.stage}" is not registered in src/stages/index.js`);
const cid = (FILM.character && FILM.character.id) || 'spoonbill';
{
  // the character must be able to do what the stage needs (else the stage substitutes / warns)
  const cfile = path.join(ROOT, 'src/characters', `${cid}.js`);
  const act = STAGE_ACTIONS[FILM.stage];
  if (fs.existsSync(cfile) && act) {
    const m = fs.readFileSync(cfile, 'utf8').match(/actions:\s*\[([^\]]*)\]/);
    if (m && !m[1].includes(`'${act}'`)) warn.push(`character "${cid}" has no '${act}' action for stage "${FILM.stage}" (the stage will substitute / warn)`);
  }
}
if (!new RegExp(`\\b${cid}\\b`).test(charIndex.split('CHARACTERS = {')[1] || '')) problems.push(`character "${cid}" is not registered in src/characters/index.js`);
for (const k of ['intro', 'outro']) {
  const v = FILM.music && FILM.music[k];
  const lib = k === 'intro' ? INTRO_PRESETS : OUTRO_PRESETS;
  if (v && v !== 'none' && !lib[v]) problems.push(`FILM.music.${k} "${v}" is not a ${k} preset (${Object.keys(lib).join(', ')}, none)`);
}
if (FILM.music && FILM.music.bed && !['wind', 'breeze', 'none'].includes(FILM.music.bed)) problems.push(`FILM.music.bed "${FILM.music.bed}" must be wind | breeze | none`);
if (CHAPTERS.length < 1) problems.push('no chapters');
if (CHAPTERS.length > 24) warn.push(`${CHAPTERS.length} chapters: ruler labels and outro thumbnails get small above ~24`);

for (const [i, c] of CHAPTERS.entries()) {
  const tag = `chapter ${i + 1} (${c.id || '?'})`;
  for (const f of req) if (c[f] === undefined || c[f] === '') problems.push(`${tag}: missing ${f}`);
  if (ids.has(c.id)) problems.push(`${tag}: duplicate id`);
  ids.add(c.id);
  const sid = c.scene || c.id;
  const file = path.join(ROOT, 'src/scenes', `${sid}.js`);
  if (!fs.existsSync(file)) warn.push(`${tag}: src/scenes/${sid}.js does not exist (placeholder will render)`);
  else {
    if (!new RegExp(`import \\* as ${sid.replace(/[^A-Za-z0-9_$]/g, '_')} from './${sid}.js'`).test(sceneIndex) && !sceneIndex.includes(`'./${sid}.js'`)) problems.push(`${tag}: scene ${sid}.js is not imported in src/scenes/index.js`);
    const src = fs.readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '');
    if (/Math\.random|Date\.now|new Date|performance\.now/.test(src)) problems.push(`${tag}: ${sid}.js uses Math.random / Date / performance.now (must be deterministic)`);
    if (!/export function render\s*\(/.test(src)) problems.push(`${tag}: ${sid}.js has no "export function render(kit, ctx, p)"`);
  }
  if (!Array.isArray(c.palette) || c.palette.length < 5) warn.push(`${tag}: palette should have 5 colours`);
  if (c.prop && !PROP_TYPES.includes(c.prop.type)) problems.push(`${tag}: prop type "${c.prop.type}" unknown (${PROP_TYPES.join(', ')})`);
  if (!c.music || !c.music.preset) warn.push(`${tag}: no music.preset (default ancient-harp)`);
  else if (!PRESETS[c.music.preset]) problems.push(`${tag}: music preset "${c.music.preset}" unknown (node tools/presets.mjs)`);
  if (!c.sources || !c.sources.length) warn.push(`${tag}: no sources`);
  if ((c.ruler || '').length > 8) warn.push(`${tag}: ruler label "${c.ruler}" is long`);
}
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
console.log(`${FILM.title}: staging ${FILM.staging} (stage ${FILM.stage}, character ${cid}), ${CHAPTERS.length} chapters × ${CHAPTER_SEC.toFixed(2)} s @ ${BPM} BPM; intro ${INTRO_SEC.toFixed(2)} s, outro ${OUTRO_SEC.toFixed(2)} s, total ${TOTAL_DURATION.toFixed(2)} s (${fmt(TOTAL_DURATION)})`);
for (const w of warn) console.log(`  warn: ${w}`);
for (const p of problems) console.log(`  ERROR: ${p}`);
console.log(problems.length ? `validate: ${problems.length} error(s)` : 'validate: OK');
process.exit(problems.length ? 1 : 0);
