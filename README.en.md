# 風電風情 · Taiwan Wind Watch

[中文](./README.md) ｜ English (this page)

Taiwan's wind power, live — and the world's wind power story, 1980–2025. One site, two scales:

- **Taiwan right now**: real-time output for all 30 tracked wind turbine units/farms nationwide, shown
  like a reservoir-level gauge, straight from Taipower and Taiwan government open data.
- **45 years worldwide**: a 3D globe that replays every country's wind build-out from 1980 to 2025 and
  zooms down to individual farms (about 23,000, including projects under construction and in the
  pipeline), plus a 12-chapter "Learn" section on the history, technology, countries and Taiwan's place
  in it.

Live site: `https://dofliu.github.io/windfarmTaiwan/`

See [ROADMAP.md](./ROADMAP.md) and [TODO.md](./TODO.md) for planned work and known limitations
(currently Traditional Chinese only; translation help welcome).

## Features

Four pages in the nav bar (hash routes, so every view can be shared as a link):

- **Home** `#/home` — Taiwan's live total next to global cumulative capacity 1980–2025; where Taiwan
  ranks; three key milestones (click one to fly there on the globe)
- **Taiwan live** `#/live` — everything the original live site did:
  - Dashboard — national wind output, availability, grid operating reserve rate and wind's
    contribution, today's estimated generation, grouped/filterable unit gauges
  - Farm wall `#/live/wall`, Charts `#/live/charts` (ranking / share / distribution, 90-day official
    long-term trend), Map `#/live/map` (Leaflet satellite map)
  - A detail drawer per farm (live trend, nearby weather-station wind speed, specs, verified
    development and operation timeline); open one directly with `#/live?farm=<id>`
  - "Share" generates a live-data card with a prominent date-time badge
- **Global** `#/global` — a 3D globe (three.js, loaded only when you open this page and paused when
  you leave it):
  - Year-by-year animation of each country's onshore/offshore **year-end cumulative capacity**; the
    ranking bars are always in **MW**; map / map + bars / bar race views, 3D globe or 2.5D map
  - **Farm layer**: curated farms merged with the Global Energy Monitor Global Wind Power Tracker
    (Feb 2025), about 15,000 operating farms; selecting a country draws all of its farms, and close to
    the ground each farm becomes a group of turbines based on its unit count
  - **Pipeline layer** (dashed rings): about 7,800 projects under construction, in pre-construction or
    announced — brighter means closer to completion; toggle with the "Pipeline" button
  - **Terrain basemaps**: relief (Natural Earth shaded relief + ocean bottom) / satellite (NASA Blue
    Marble) / plain; zooming in adds Esri hillshade or imagery tiles automatically
  - Country profiles (history sparkline, rank, 10-year growth, largest/earliest farm, pipeline totals,
    short notes for major markets), milestones, and a searchable farm list
  - Guided tour and deep links (e.g. `#/global?r=TWN&y=2020`, `#/global?ms=Horns%20Rev%201`,
    `#/global?f=Hai%20Long%202%20%26%203`)
  - Taiwanese farms are linked to the live data: click one to see Taipower's current output and jump
    to its live details
  - Devices without WebGL fall back to the bar race automatically
- **Learn** `#/learn` — 12 chapters: from Charles Brush's 1888 turbine to 2025, onshore and offshore,
  floating wind, ever-bigger turbines, Asia's rise, Taiwan's offshore build-out, why wind matters, a
  glossary and full source list; every chart is drawn from the same global dataset and every chapter
  links to the globe to replay that part of the story

The whole site is bilingual (toggle top right; remembered in the browser).

## Architecture

```
GitHub Actions (every 15 min cron)  ── taipower_wind_scraper.py ──► wind_realtime.json / wind_history.json / grid_status.json ──┐
GitHub Actions (weekly Monday cron) ── backfill_history.py      ──► wind_history_archive.json / wind_archive_daily.json ────────┤
                                                                                                                                 ├─► commit back to repo
tools/*.py (manual, rare: when source data changes) ──► data/global/*.json, assets/img/globe/*.jpg ─────────────────────────────┤
GitHub Pages serves this same repo: index.html + assets/ + data/ + the JSON above ◄──────────────────────────────────────────────┘
Browser loads index.html → lazy-loads page modules and data (same origin, no CORS)
```

A plain static site with no build step: `index.html` is the shell, and each module in `assets/js/`
registers its page with the hash router via `WW.registerPage()`. The globe's three.js (~600 KB),
basemaps and the 2.7 MB farm dataset are only downloaded the first time `#/global` is opened.

## Files

- `index.html` — site shell: top navigation, the four pages' layout and bilingual copy, drawer, toast
- `assets/css/site.css` — design system (dark data style, palette, components, responsive);
  `assets/css/globe.css` — globe styles
- `assets/js/core.js` — shared core: i18n, hash router, lazy loading, data cache, number formats, share
- `assets/js/live.js` — Taiwan live (the `FARMS` list of 30 units/farms with specs and timelines;
  live / history / grid data loading; dashboard, farm wall, charts, map, drawer, share card)
- `assets/js/charts.js` — lightweight SVG charts (line, columns, bars, scatter; tooltips and table views)
- `assets/js/home.js`, `assets/js/learn.js` — Home and Learn pages
- `assets/js/globe.js` — the 3D globe (rewritten from the "Global wind power development map",
  wind-history-map v3)
- `assets/vendor/` — three.js r128 and OrbitControls (MIT, vendored unmodified)
- `assets/img/globe/` — relief / satellite basemaps (4096×2048 and 2048×1024)
- `data/global/wind_global.json` — per-country onshore/offshore capacity 1980–2025, world totals,
  milestones, sources and notes (~70 KB)
- `data/global/wind_farms.json` — ~23,000 farm-level records (operating, pipeline, retired)
- `data/global/world_borders.json` — country borders (Natural Earth 1:50m)
- `data/global/sources/` — the curated farm list before merging, and the merge log
- `tools/` — generators for the global data and basemaps (see "Updating the global data" below)
- `taipower_wind_scraper.py` — runs every 15 min: fetches Taipower's open data, parses the 30
  wind units → `wind_realtime.json`; accumulates a rolling 7-day history → `wind_history.json`;
  also fetches the real-time supply-demand report → `grid_status.json`
- `wind_realtime.json` — live data (auto-updated by Actions)
- `wind_history.json` — rolling 7-day history (accumulated live by the scraper, for trend lines)
- `grid_status.json` — national power supply-demand report (peak load / supply capacity /
  operating reserve rate). **Known limitation**: the primary source returns 403 when fetched from
  GitHub Actions (likely a WAF block on cloud-CI IP ranges), so in practice this mostly falls back
  to an official open-data source (updated daily, observed to lag ~6 weeks). The frontend labels
  this honestly as "not live, as of YYYY-MM-DD" and never pairs it with the live wind figure. If
  both sources fail or fields can't be parsed, nothing is written — the UI section hides itself
  rather than showing a guess.
- `backfill_history.py` — runs weekly (Monday): fetches government open dataset
  [37331 "Electricity generated by each unit in the past"](https://data.gov.tw/dataset/37331),
  accumulating a long-term archive `wind_history_archive.json` (official 10-minute retrospective
  values, never trimmed) and a daily digest `wind_archive_daily.json` (what the "Charts → Long-term
  trend" tab reads, including a per-unit breakdown).
  **Timeliness caveat**: dataset 37331 is a quarterly archive, observed to lag ~4–5 months, so it
  can't fill gaps in the live 7-day trend window — its value is long-term trend analysis only.
  **Scope caveat**: 37331 covers only Taipower-**owned** wind units, excluding IPP (independent
  power producer) purchases; its totals aren't comparable to the live system-wide figure.
- `.github/workflows/scrape.yml` — runs the scraper every 15 minutes and commits
- `.github/workflows/backfill.yml` — accumulates the official retrospective archive weekly;
  can also be triggered manually (with a dry-run option)
- `DEPLOY.md` — detailed deployment options (GitHub Pages / Cloudflare Worker / self-hosted)
- `ROADMAP.md` / `TODO.md` — known limitations, planned work, and open tasks

## Setup (the only steps left for you)

1. After pushing, go to **Settings → Pages → Source, select `main` / `(root)`** and save to enable
   Pages.
2. On the **Actions** tab, manually run `scrape-taipower-wind` once (Run workflow) to confirm
   `wind_realtime.json` gets updated.
3. Open `https://dofliu.github.io/windfarmTaiwan/` — the top-right dot should turn green ("Live").

> The repo ships with a real seed snapshot, so the site shows live-mode data as soon as Pages is
> enabled, even before Actions has run.
> Local preview: run `python3 -m http.server` in the repo root and open `http://localhost:8000/`
> (opening `index.html` from disk can't load the JSON files over `file://`).

## Notes

- Uses a **public repo**: unlimited free Actions minutes.
- GitHub's cron schedule isn't precise (often delayed a few minutes) — fine here, since Taipower
  itself only updates every 10 minutes.
- A repo with 60 days of no activity gets its scheduled workflows auto-disabled; trigger one
  manually once a month to keep it alive.
- Every update creates a commit, so git history accumulates (harmless functionally). To avoid
  this, switch to a Cloudflare Worker Cron (see `DEPLOY.md`).
- Third-party services contacted while browsing: cdnjs (Leaflet, map tab only), Esri tiles (only
  when zoomed in on the globe) and the Wikipedia API (farm photos and summaries; links only when
  unavailable). The rest of the site keeps working if any of them fails.

## Updating the global data

The global data changes rarely (once a year is enough). It is generated offline by the scripts in
`tools/` and committed — no scheduled job:

```bash
# 1. Country capacity by year and milestones (source: the WIND_DATA block embedded in the
#    "Global wind power development map" single-file HTML)
python tools/extract_global_data.py wind-history-map.html data/global
# 2. Borders (Natural Earth 1:50m)
curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
python tools/build_borders.py ne_50m_admin_0_countries.geojson data/global/world_borders.json
# 3. Farm layer (curated farms × GEM Global Wind Power Tracker)
curl -LO https://raw.githubusercontent.com/GlobalEnergyMonitor/maps/main/trackers/wind/compilation_output/Wind-map-file-2025-02-04.csv
python tools/build_farms.py data/global/sources/farms_attachment.json Wind-map-file-2025-02-04.csv data/global/wind_farms.json
python tools/qa_farms.py        # sanity check: lists farms located outside their country
# 4. Terrain basemaps (needs Pillow + numpy; download locations in the script's docstring)
python tools/build_basemaps.py world.topo.bathy.200412.3x5400x2700.jpg GRAY_50M_SR_OB.tif assets/img/globe
```

### Corrections this site made to the data (all recorded in the data files and the site's "Sources")

- Taiwan 2022–2025 onshore/offshore split: upstream counted offshore farms that were still being
  connected as onshore (e.g. 2,064 MW onshore in 2023, while Taiwan's onshore fleet is ~0.9 GW);
  re-split using the actual onshore fleet (yearly totals unchanged)
- Formosa 1 Phase 1 and Formosa 2 years aligned with their actual grid connection / commercial dates
- Borders rebuilt from Natural Earth 1:50m (the original lacked the mainland Australia polygon);
  Crimea shown as part of Ukraine per UN General Assembly resolution 68/262, matching the country
  GEM assigns to Crimean wind farms
- GEM phases more than 25 km apart under one location are shown as separate points instead of an
  averaged position (which put multi-state projects in the wrong place); three coordinate errors
  that the project names make obvious were fixed (Miyagi Kami, Suzu 1, Suzu 2 phase 2), and one WRI
  GPPD record whose country and coordinates disagree was dropped

> Farm capacity in the farm layer is each farm's **full nameplate**: farms still being connected in
> stages (e.g. Hai Long 2 & 3 and Greater Changhua 2b & 4 in 2025) count in full, so farm sums can
> exceed national year-end statistics — they measure different things.

## Data sources & license

**Taiwan live**

- Live generation: Government Open Data Platform, "Taiwan Power Company — Real-time Information
  on Power Generation of Each Unit" ([dataset 8931](https://data.gov.tw/dataset/8931)), endpoint
  `https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json`, updated every 10 min
- Historical archive: Government Open Data Platform, "Taiwan Power Company — Electricity
  Generated by Each Unit in the Past" ([dataset 37331](https://data.gov.tw/dataset/37331)),
  resolved dynamically via the data.gov.tw metadata API by `backfill_history.py`; a quarterly
  archive, historical units use short names (e.g. "中港" = Taichung Port)
- Supply-demand: Taipower's raw "Today's Power Information" page (no open-data-licensed mirror
  available); falls back to the Government Open Data Platform's "Taiwan Power Company — Past
  Power Supply-Demand Information" ([dataset 19995](https://data.gov.tw/dataset/19995))
- Wind speed reference: Central Weather Administration automatic weather stations
  ([opendata.cwa.gov.tw](https://opendata.cwa.gov.tw/)) — nearest station to each farm, used as a
  coastal reference, not an actual hub-height measurement
- Offshore farm development history: compiled from official press releases and media coverage by
  Taipower, Ørsted, CIP, wpd, China Steel Corporation, Hai Long, and others; each milestone is
  sourced during research and omitted rather than guessed when no precise date could be verified
- License: Government Open Data License, Version 1

**Global**

- Country totals 2000–2025: Our World in Data / IRENA Renewable Capacity Statistics
- Offshore capacity 1991–2025: WFO Global Offshore Wind Reports, GWEC, EWEA / WindEurope statistics
  (each source is listed on the site under "Sources")
- Early data 1980–1999: BTM Consult, IEA Wind annual reports, Danish Energy Agency, US EIA and other
  national statistics (most countries are estimates — for trends only)
- Farm layer: the curated farms from the "Global wind power development map", WRI Global Power Plant
  Database v1.3 (CC BY 4.0), and Global Energy Monitor's
  [Global Wind Power Tracker](https://globalenergymonitor.org/projects/global-wind-power-tracker/),
  February 2025 release (CC BY 4.0)
- Borders and relief: Natural Earth (public domain); satellite basemap: NASA Earth Observatory Blue
  Marble Next Generation (public domain)
- Zoomed-in tiles: Esri World Imagery (Esri, Vantor, Earthstar Geographics) and Esri World Hillshade
  (Esri, USGS, NASA et al.), attributed on screen per Esri's terms
- Farm photos and summaries: looked up live from Wikipedia / Wikimedia Commons (per-image licences)
- Libraries: three.js r128 (MIT), Leaflet 1.9.4 (BSD-2)

Turbine counts, coordinates, and developer info are compiled from public sources; coordinates are
approximate.
