// src/data/staging.js — the stage + character actually used, resolved once at load:
//   URL ?staging=easel+person   or   ?stage=easel&character=person   (player, tools)
//   else FILM.staging in film.config.js ('<stage>+<character>').
// Everything that depends on the staging (main.js, the score's bicycle bell ...) reads this.
import { FILM } from './film.config.js';

const q = typeof location !== 'undefined' && location.search ? new URLSearchParams(location.search) : null;
const fromUrl = q && q.get('staging') ? q.get('staging').split(/[+ ]/) : [];
const [cfgStage, cfgChar] = String(FILM.staging || 'gallery-ride+spoonbill').split('+');

export const STAGE_ID = (q && q.get('stage')) || fromUrl[0] || cfgStage || 'gallery-ride';
export const CHARACTER_ID = (q && q.get('character')) || fromUrl[1] || cfgChar || (FILM.character && FILM.character.id) || 'spoonbill';
/** True when the character rides a bicycle (bell / freewheel in the intro & outro music). */
export const CHARACTER_CYCLES = STAGE_ID === 'gallery-ride';
