// tools/presets.mjs — list the music style presets (and intro / outro / bed presets).
//   node tools/presets.mjs            table
//   node tools/presets.mjs --json     machine-readable
import { PRESETS, INTRO_PRESETS, OUTRO_PRESETS } from '../src/audio/presets.js';

const rows = Object.entries(PRESETS).map(([id, p]) => ({ id, mode: p.mode, lead: p.lead, wind: p.wind, swing: p.swing ?? 0.5, label: p.label }));
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ chapter: rows, intro: Object.keys(INTRO_PRESETS), outro: Object.keys(OUTRO_PRESETS), bed: ['wind', 'breeze', 'none'] }, null, 2));
} else {
  console.log('chapter music presets (chapters.js -> music: { preset, mode? }):\n');
  for (const r of rows) console.log(`  ${r.id.padEnd(20)} ${r.mode.padEnd(18)} lead ${r.lead.padEnd(12)} ${r.label}`);
  console.log(`\nintro presets: ${Object.keys(INTRO_PRESETS).join(', ')}, none`);
  console.log(`outro presets: ${Object.keys(OUTRO_PRESETS).join(', ')}, none`);
  console.log('bed presets:   wind, breeze, none');
}
