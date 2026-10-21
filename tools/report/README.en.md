# Global Wind Power Observation Report · builder

English (this page) ｜ [中文](./README.md)

Turns the data the site has collected into an A4 portrait observation report (annual-report magazine style, chosen by the owner in Oct 2026), as HTML and PDF.
The report's text, chart design and layout are all rights reserved (see [LICENSE](../../LICENSE)); each dataset is used under its source's licence.

## Build

```bash
python3 -m http.server 8000 &               # serve the site for the screenshots
node tools/report/shots.js                  # site screenshots into report/shots/ (retake only when the site's look changes)
python3 tools/report/build_report.py zh     # Chinese: report/observation-report.zh.html and .pdf
python3 tools/report/build_report.py en     # English: report/observation-report.en.html and .pdf
pdftoppm -r 50 -png report/observation-report.zh.pdf /tmp/p   # page previews (optional)
```

Needs Python 3, Pillow, Node.js and Playwright (Chromium 131 or later: the footer and page numbers use `@page` margin boxes); fonts load from Google Fonts (Noto Sans TC, Noto Serif TC).
Output goes to `report/` (not in git).

## Files

| File | Contents |
|---|---|
| `analysis.py` | Computes every figure and series in the report from `data/global/`; nothing is typed in |
| `charts.py` | SVG charts (area, columns, lines, dot strips, ranked bars); the palette is checked for colour-blind readers |
| `text_zh.py`, `text_en.py` | The Chinese and English text (same keys; change both together) |
| `build_report.py` | Layout: cover, contents, summary, 8 chapters, appendix and back cover; each chapter starts a new page and the browser paginates within it |
| `outlook_quotes.json` | Sources and quoted passages for chapter 8's outlooks, checked with `python3 tools/check_quotes.py tools/report/outlook_quotes.json` |
| `shots.js` | Site screenshots (1440×900 at 2×) |
| `pdf.js` | HTML to PDF |

## Rules

- Every figure is computed in `analysis.py` and inserted by the text files; outside organisations' figures come only from the checked quotes in `outlook_quotes.json`.
- No causal claims without a source; maker shares always state their coverage and are never called market shares; measured output and estimates are never mixed (the site's own rules, see CLAUDE.md).
- After a data update, rerun `build_report.py` and reread the text: some sentences describe rankings or trends ("most", "passed") that may need rewriting when the data change.
