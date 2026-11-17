// tools/test-presets.mjs — run every music preset (and intro / outro preset) once in Node and
// report any that throw or produce no notes. Fast sanity check after editing presets.js.
//   node tools/test-presets.mjs
import { PRESETS, ARRANGE, INTRO_PRESETS, OUTRO_PRESETS } from '../src/audio/presets.js';
import { Arr, makeCtx } from '../src/audio/arrange.js';

let bad = 0;
for (const id of Object.keys(PRESETS)) {
  try {
    const a = new Arr(10, { seed: 1 });
    const r = ARRANGE[id](a, makeCtx(PRESETS[id].mode));
    if (!r || !r.tracks || !a.events.length) throw new Error('no tracks / events');
    for (const e of a.events) if (!r.tracks[e.tr]) throw new Error(`event on undeclared track "${e.tr}"`);
    console.log(`  ok  ${id.padEnd(20)} ${String(a.events.length).padStart(4)} events`);
  } catch (e) {
    bad++;
    console.log(`FAIL  ${id}: ${e.message}`);
  }
}
for (const [k, fn] of [...Object.entries(INTRO_PRESETS).map(([k, f]) => [`intro:${k}`, f]), ...Object.entries(OUTRO_PRESETS).map(([k, f]) => [`outro:${k}`, f])]) {
  try {
    const a = new Arr(10, { seed: 1 });
    fn(a, { relay: [{ voice: 'harp' }, { voice: 'chip', p: { duty: 0.25 } }], bell: true });
    console.log(`  ok  ${k.padEnd(20)} ${String(a.events.length).padStart(4)} events`);
  } catch (e) {
    bad++;
    console.log(`FAIL  ${k}: ${e.message}`);
  }
}
console.log(bad ? `${bad} preset(s) failed` : 'all presets OK');
process.exit(bad ? 1 : 0);
