#!/usr/bin/env node
/* Lighthouse 分數摘要 · Prints a Markdown table from Lighthouse JSON reports (the manual `lighthouse` workflow writes it to the job summary)

  node tools/lighthouse_summary.js 報告目錄        # 目錄裡的 *.report.json → 表格（效能、無障礙、最佳做法、SEO、FCP、LCP、TBT、CLS、傳輸量）
*/
const fs = require('fs');
const path = require('path');
const dir = process.argv[2] || 'lighthouse';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.report.json')).sort();
const pct = c => c && c.score != null ? Math.round(c.score * 100) : '—';
const dv = (a, k) => a[k] && a[k].displayValue ? a[k].displayValue : '—';
console.log('| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const f of files) {
  const J = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), c = J.categories, a = J.audits;
  console.log(`| ${f.replace('.report.json', '')} | ${pct(c.performance)} | ${pct(c.accessibility)} | ${pct(c['best-practices'])} | ${pct(c.seo)} | ${dv(a, 'first-contentful-paint')} | ${dv(a, 'largest-contentful-paint')} | ${dv(a, 'total-blocking-time')} | ${dv(a, 'cumulative-layout-shift')} | ${dv(a, 'total-byte-weight')} |`);
}
console.log(`\nLighthouse ${files.length ? JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf8')).lighthouseVersion : ''} · mobile simulation · scores vary a little between runs`);
