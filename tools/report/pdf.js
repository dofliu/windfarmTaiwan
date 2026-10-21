#!/usr/bin/env node
/* HTML → PDF · Render the report to PDF (Chromium paginates; @page margin boxes give the footer and page numbers).
   node tools/report/pdf.js report/observation-report.zh.html report/observation-report.zh.pdf
   預覽每頁 · page previews: pdftoppm -r 60 -png report/observation-report.zh.pdf 目錄/p */
const path = require('path');
function playwright() {
  try { return require('playwright'); } catch (e) {
    const root = require('child_process').execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  }
}
const { chromium } = playwright();
const [src, dst] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(src), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: dst, printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log('pdf', dst);
})();
