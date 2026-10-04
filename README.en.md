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

See [CHANGELOG.en.md](./CHANGELOG.en.md) for versions and changes (the site footer shows the current version),
[ROADMAP.en.md](./ROADMAP.en.md) and [TODO.en.md](./TODO.en.md) for planned work and known limitations,
[docs/data-coverage.en.md](./docs/data-coverage.en.md) for farm-level coverage by country and the items still to
verify, [docs/data-cleanup.en.md](./docs/data-cleanup.en.md) for every farm record removed or corrected and why,
[docs/foundations.en.md](./docs/foundations.en.md) for the foundation type of each offshore farm,
and [docs/live-data-sources.en.md](./docs/live-data-sources.en.md) for which other countries publish live
wind generation data.

**Single-file edition**: [download windfarmTaiwan-standalone.html](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html)
(about 6 MB), save it and open it in any browser — no web server needed. See "Single-file edition" below.
**Public global wind map** (for everyone): [download windfarmTaiwan-globe.html](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-globe.html)
(about 6 MB), just the 3D globe with the onshore, offshore and pipeline layers; works offline.

Developed by National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu (國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室)

**Project status (27 Sep 2026, v2.11.1)**: the main features are finished; the project is paused and in maintenance, with no new
features planned. The automatic Taiwan live-data updates keep running. What to watch while it is paused is under "Maintenance" in
[DEPLOY.en.md](./DEPLOY.en.md); work to pick up later is at the top of [TODO.en.md](./TODO.en.md).

## Quick start (read this first)

The bar at the top of the site has four pages:

| Page | What it shows |
|---|---|
| **Home** | Everything on one page: Taiwan's wind output right now, the world's wind growth 1980–2025, and where Taiwan ranks |
| **Taiwan live** | How much each of Taiwan's 30 wind farms is generating right now (updated about every 2 hours); click any farm for its details |
| **Global** | A 3D globe that animates 45 years of wind growth by country and zooms down to single wind farms |
| **Learn** | 12 illustrated chapters, from the first power-generating turbine in 1888 to Taiwan's offshore wind, with a glossary and "Frequently asked" |

A suggested first visit (about 5 minutes):

1. **Home**: start with the two big numbers at the top — Taiwan's wind output right now and the world's cumulative capacity.
2. **Taiwan live**: click any farm (for example Greater Changhua or Formosa 2) to open its details: live trend, nearby wind speed,
   specifications and project history. The tabs at the top switch between Dashboard, Farm grid, Charts and Map.
3. **Global**: press **▶ Tour** in the toolbar for a guided run through the key moments in wind power, or press play on the timeline
   to watch every country grow from 1980 to today. Press **🔍 Search** (or the / key) and type a farm name such as "Hornsea" or
   "Hai Long", then click a result to fly to it. If a result says it is "not on the map for this year", the timeline is still on an
   earlier year: press "Go to the latest year".
4. **Learn**: to find out where wind power came from and why it matters, read from the first chapter; every chapter has a button
   that replays that part of the story on the globe.

Tips:

- **EN / 中文** at the top right switches the language; **Share** makes a live image card with the data time on it. Links can be
  shared as they are: whoever opens one sees the same view.
- It works on phones. The globe downloads a few MB the first time, so give it a moment; older devices without 3D graphics get a
  bar-chart ranking instead.
- How current the data is: Taiwan live updates about every 2 hours (the header shows Taipower's data time); country totals run to
  the end of 2025; the farm-by-farm data is GEM's February 2026 release.
- To use it offline, download the [single-file edition](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html)
  and open it from your computer.
- Found a mistake? Farm cards have "Report a data error" at the bottom, or open an issue on
  [GitHub](https://github.com/dofliu/windfarmTaiwan/issues).

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
    (Feb 2025), about 15,000 operating farms; selecting a country draws all of its farms, each shown as a
    single turbine at any zoom; clicking a farm draws all of its turbines based on its unit count
  - **Pipeline layer** (dashed rings): about 7,850 projects under construction, in pre-construction or
    announced — brighter means closer to completion; toggle with the "Pipeline" button. The Pipeline tab lists
    every project in scope by status and expected commissioning year, next to GEM's February 2026 country
    totals, and clicking a project shows its planned layout as translucent turbines
  - **Terrain basemaps**: relief (Natural Earth shaded relief + ocean bottom) / satellite (NASA Blue
    Marble) / plain; zooming in adds Esri hillshade or imagery tiles automatically
  - Country profiles (history sparkline, rank, 10-year growth, largest/earliest farm, farm-level coverage,
    pipeline totals, short notes for major markets; Taiwan and Japan carry an official-statistics audit badge),
    milestones, and a searchable farm list
  - Guided tour and deep links (e.g. `#/global?r=TWN&y=2020`, `#/global?ms=Horns%20Rev%201`,
    `#/global?f=Hai%20Long%202%20%26%203`)
  - **Global farm search and filters**: "🔍 Search" in the toolbar or the / key searches all ~23,000 farms by name,
    Chinese name, developer, turbine model or country, with filters for status, type (onshore/offshore/floating),
    size and year; the scope follows the region selector (world, continent or country). While any condition is set,
    the map shows only the matching farms (visible even at world zoom), and the conditions go into the URL so the
    view can be shared (e.g. `#/global?fty=fl&fst=op`, operating floating farms worldwide)
  - **Ports layer** (⚓): 55 offshore wind ports in 15 countries for marshalling, foundation and turbine-component
    manufacturing, cables, floating assembly and O&M (compiled by hand in Sep 2026, each with sources); small dots at
    world zoom, icons and names when zoomed in, and arcs to the farms served when a port is selected (v2.16.0). Port cards list the roles, the wind farms served (click to switch)
    and the sources; ports are searchable and have their own Ports tab (e.g. `#/global?port=twn-taichung`)
  - **Events layer** (⚑): 91 major events and incidents (36 milestones, 53 incidents / failures, 2 policy & society; the first 59
    verified by hand on 28 Sep 2026, a second batch of 29 incidents compiled from web searches, passages still to be checked, and a third batch of 3 from owner notices on 3 Oct 2026), each with a primary source from a regulator or the owner; an event appears once the
    timeline reaches its year (2026 events show at the latest year), red = incident / failure, white = milestone,
    purple = policy & society. Events with coordinates are marked on the globe, events linked to a farm but without
    coordinates are placed at the farm, and the rest appear only in the Events tab. The event card shows the summary,
    capacity basis, casualties (officially confirmed only), notes, related farms, sources and the photo page (URL and
    rights status only; nothing is reproduced); farm cards list their related events. Searchable and filterable by
    type (e.g. `#/global?ev=WIND-040`); the full list is [docs/events.en.md](./docs/events.en.md)
  - **Foundation layer** (“Offshore: foundations” in the Show menu): colours operating offshore farms by foundation
    type — monopile, steel frame (jacket, tripod, tripile), floating, and other fixed-bottom (gravity-based, high-rise pile
    cap, cofferdam, rock-anchored, composite bucket, mixed); farms not yet checked are “type unknown”. The legend counts each group in scope and
    the share of capacity with a known type, and a click on a group shows only that group; farm cards give the exact type and
    sources, and country profiles get a capacity bar. The data is collected step by step: step 1 is the North Sea and NE
    Atlantic within OSPAR (Sep 2026, 99 farms; where OSPAR differs from what was built or gives no specific type, German
    Wikipedia or construction news is used); step 2 adds the rest of Europe (Sep 2026, 41 farms: the Baltic, the
    Mediterranean, the IJsselmeer and farms finished after OSPAR 2024, each with a construction or other source), so every
    operating offshore farm in Europe except one test site has a known type; step 3 gives floating farms worldwide their
    sub-type (Sep 2026: spar, semi-submersible, barge, tension-leg platform), and country profiles count floating farms by
    sub-type; step 4 covers Taiwan, Japan, Korea and the USA (Sep 2026, 36 farms: every operating farm in Taiwan and the USA,
    9 of the 10 in Japan and 6 of the 7 in Korea), each citing a developer, construction contractor, government document or
    trade press, with farms inside Japanese ports following NEDO's classification of support structures; step 5 (China and
    Vietnam) is under way: from September to October 2026 Chinese and Vietnamese farms were added batch by batch (with a new
    “composite bucket” type), every quoted passage verified with `tools/check_quotes.py`. As of 4 Oct 2026 (v2.17.7), 238 of the 330
    operating offshore farms have a known type, 71.4% of capacity; the rest still read “type unknown”. Country profiles also have a
    chart of new offshore capacity per year by foundation type (v2.15.0).
    Farm-by-farm list: [docs/foundations.en.md](./docs/foundations.en.md) (e.g. `#/global?r=C:Europe&layer=fd`)
  - **Dimensions and cross-section** (from v2.17.0): operating offshore farms carry water depth, hub height and rotor diameter
    (`tools/farm_dimensions.py`, each row with a quoted source), and the farm card's cross-section and the close-up turbine are
    drawn to scale from them; of the 236 operating offshore farms with a foundation type, 234 have at least one value and 168 have
    all three. Consent limits, EIA design values and values for only one phase or some units are not used (reasons in TODO).
  - **Farm cards**: click a farm for its Wikipedia photo and summary; its standing within the country
    (capacity rank and share of national installed wind capacity at the timeline year), a phase timeline,
    nearby farms (within 30 km) and other farms by the same developer (clickable to switch); links to a
    satellite map, OpenStreetMap, a wind resource map (Global Wind Atlas) and Wikidata; "Copy link to this
    farm" and "Report a data error" (opens a pre-filled GitHub issue)
  - Taiwanese farms are linked to the live data: click one to see Taipower's current output and jump
    to its live details
  - **Live output in Australia and Canada**: about 150 farms on Australia's NEM (AEMO, measured every
    5 minutes), in Alberta (AESO, about a minute old) and in Ontario (IESO, hourly) show their current
    output; country profiles show each grid's total and a 48-hour trend. With the timeline at the latest
    year, farms with live data get a green ring and their rotors spin with their current output
  - Devices without WebGL fall back to the bar race automatically
- **Learn** `#/learn` — 13 chapters: from Charles Brush's 1888 turbine to 2025, onshore and offshore, foundations,
  floating wind, ever-bigger turbines, Asia's rise, Taiwan's offshore build-out, why wind matters, a
  glossary and full source list; every chart is drawn from the same global dataset and every chapter
  links to the globe to replay that part of the story

The whole site is bilingual (toggle top right; remembered in the browser).

## Architecture

```
GitHub Actions (every 2 hours cron) ── taipower_wind_scraper.py ──► wind_realtime.json / wind_history.json / grid_status.json ──┐
                                    ── intl_wind_scraper.py    ──► data/live/intl_realtime.json (Australia, Canada) ─────────────┤
GitHub Actions (weekly Monday cron) ── backfill_history.py      ──► data/archive/ monthly files / wind_archive_daily.json ─────┤
                                                                                                                                 ├─► commit back to repo
tools/*.py (manual, rare: when source data changes) ──► data/global/*.json, assets/img/globe/*.jpg ─────────────────────────────┤
GitHub Actions (push to main touching site code or global data) ── tools/build_standalone.py ──► the two HTML files in the "standalone" Release ┤
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
- `data/global/ports.json` — 55 offshore wind ports (curated by hand with sources; run `tools/qa_ports.py` after editing)
- `data/global/foundations.json` — foundation types and dimensions of offshore farms (built by `tools/build_foundations.py` from the
  per-farm tables in `tools/farm_foundations.py` and `tools/farm_dimensions.py`)
- `data/global/events.json` — 91 major events and incidents (built by `tools/build_events.py` from
  `data/global/sources/events_2026-09.csv`; the English titles, summaries and notes and the event-to-farm links live in
  the build script, which checks that every event has English text and that farm names match the farm layer)
- `data/global/country_stats.json` — the "latest available" point on the globe's timeline (2026: official figures for 8 countries,
  sourced country by country in `tools/latest_wind.py`) and each country's average wind capacity factor (Ember, for the
  estimated yearly output on farm cards); built by `tools/build_country_stats.py`
- `data/global/turbines.json` — position and specs of every US turbine (USWTDB, public domain; about 970 farms, 60,000
  turbines), built by `tools/build_turbines.py` and loaded only when a US farm is selected
- `data/global/sources/` — the curated farm list before merging (with the Taiwan/Japan audit status), the
  pipeline projects and Japanese farm list compiled in 2026, the merge log, and the wind records of OSPAR Offshore
  Renewables 2024 (CC0, used for foundation types)
- `tools/` — generators for the global data and basemaps (see "Updating the global data" below);
  `tools/build_standalone.py` builds the single-file edition, `tools/coverage_report.py` the data coverage report,
  `tools/qa_farms.py` checks farm coordinates, `tools/qa_ports.py` checks the ports data,
  `tools/build_foundations.py` builds the foundation data and the farm-by-farm list, and `tools/check_quotes.py` confirms that
  passages quoted during research really are on their source pages; `tools/research/` holds research notes not yet written into
  the tables (each source with its quoted passage and check result)
- `standalone/` (not in git) — where the build scripts write locally; the official single-file edition and public global wind map are built by Actions and uploaded to the GitHub Release "standalone"
- `data/archive/wind_history_archive_YYYY-MM.json` — the long-term archive of Taipower's official retrospective data, one file per month (written by `backfill_history.py`)
  (built by `tools/build_globe_lite.py`; do not edit by hand)
- `docs/` — the data coverage report (`data-coverage.en.md`), the data clean-up log (`data-cleanup.en.md`), the
  farm-by-farm foundation list (`foundations.en.md`), the events list (`events.en.md`) and the
  assessment of live-data sources in other countries (`live-data-sources.en.md`), each with a Chinese version (`.md`)
- `CLAUDE.md` — project conventions (bilingual docs, the single-file edition, data updates, testing) for future
  contributors and AI agents
- `intl_wind_scraper.py` — runs about every 2 hours: fetches each wind farm's live output from Australia's NEM
  (AEMO), Alberta (AESO) and Ontario (IESO) → `data/live/intl_realtime.json` (with each grid's 48-hour
  total); if a source fails, the previous values are kept and flagged, and Taiwan's data is unaffected
- `data/live/units.json` — grid unit code → farm mapping (built by `tools/build_live_units.py`; Ontario
  checked by hand against IESO's published facility list)
- `taipower_wind_scraper.py` — runs about every 2 hours: fetches Taipower's open data, parses the 30
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
  accumulating a long-term archive `data/archive/wind_history_archive_YYYY-MM.json` (official 10-minute retrospective
  values, one file per month, never trimmed; the weekly run only rewrites the current month) and a daily digest `wind_archive_daily.json` (what the "Charts → Long-term
  trend" tab reads, including a per-unit breakdown).
  **Timeliness caveat**: dataset 37331 is a quarterly archive, observed to lag ~4–5 months, so it
  can't fill gaps in the live 7-day trend window — its value is long-term trend analysis only.
  **Scope caveat**: 37331 covers only Taipower-**owned** wind units, excluding IPP (independent
  power producer) purchases; its totals aren't comparable to the live system-wide figure.
- `.github/workflows/scrape.yml` — runs the scraper about every 2 hours and commits
- `.github/workflows/backfill.yml` — accumulates the official retrospective archive weekly;
  can also be triggered manually (with a dry-run option)
- `.github/workflows/standalone.yml` — rebuilds the single-file edition when site code or global data change and uploads it to the "standalone" Release (no commit, so git history does not grow by 12 MB each time)
- `.github/workflows/keepalive.yml` — on the 1st of each month, re-enables the scheduled workflows through the GitHub API so they are not disabled after 60 days without activity (no commits)
- `DEPLOY.en.md` — detailed deployment options (GitHub Pages / Cloudflare Worker / self-hosted)
- `ROADMAP.en.md` / `TODO.en.md` — known limitations, planned work, and open tasks
- `CHANGELOG.en.md` — versions and changes (the version number is `WW.VERSION` in `assets/js/core.js`)

Every document has a Traditional Chinese version (`README.md`, `DEPLOY.md`, `ROADMAP.md`, `TODO.md`, `CHANGELOG.md`, `docs/*.md`).

## Deployment and local preview

- GitHub Pages serves this repo's `main` branch (root) at `https://dofliu.github.io/windfarmTaiwan/`; the four GitHub Actions
  workflows (Taiwan and international live data, the weekly official backfill, the single-file rebuild, the monthly keepalive) are
  running and need no further setup.
- Steps for deploying from scratch to another repo or host are in [DEPLOY.en.md](./DEPLOY.en.md); what to watch while development is
  paused is under "Maintenance" in DEPLOY.en.md.

> Local preview: run `python3 -m http.server` in the repo root and open `http://localhost:8000/`
> (opening `index.html` from disk can't load the JSON files over `file://`; to open the site straight
> from disk, use the single-file edition).

## Single-file edition (download and open)

`windfarmTaiwan-standalone.html` packs the whole site (Home, Taiwan live, the 3D globe and
Learn) into one HTML file of about 6 MB, published in the GitHub Release "[standalone](https://github.com/dofliu/windfarmTaiwan/releases/tag/standalone)" (a fixed tag whose files are overwritten on each rebuild):

- **Download**: "Download the single-file HTML" in the site footer or under Learn → Sources & method →
  About this site, or save `https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html`.
- **Online**: Taiwan live data is fetched fresh from the live site (updated about every 2 hours),
  zooming in on the globe loads Esri detail tiles, and farm cards look up Wikipedia.
- **Offline**: the global data, ~23,000 farm records, borders and the 2k relief/satellite basemaps are
  inside the file, so the globe works as usual; Taiwan live shows the data saved at build time, labelled
  "Offline snapshot". The satellite map on the Taiwan live page (Leaflet) needs a connection.
- **Updates**: pushes to `main` that touch `index.html`, `assets/` or `data/global/*.json` rebuild it
  automatically through GitHub Actions and upload it to the Release (the files are not in git); locally, run `python3 tools/build_standalone.py` (it stops if
  `WW.VERSION` has no entry in both changelogs). The footer shows the version, build time and commit.
  In the single-file edition the Share button always shares the live site's URL.
- **Public global wind map** `windfarmTaiwan-globe.html` (`python3 tools/build_globe_lite.py`, also rebuilt and uploaded by
  Actions): a slimmed-down copy for the general public with just the 3D globe and the onshore, offshore and pipeline
  layers (country series, farm search, the Pipeline tab, relief / satellite basemaps and deep links included); it loads
  no ports, foundations, events, milestone tour or live data and has no Home, Taiwan live or Learn pages; the footer
  links to the full site. Offline it only lacks the Esri detail tiles and Wikipedia summaries.

## Notes

- Uses a **public repo**: unlimited free Actions minutes.
- The schedule runs about every 2 hours; GitHub's cron isn't precise (runs can be late or occasionally
  skipped), which is fine here because the site does not need minute-by-minute data.
- A repo with 60 days of no activity gets its scheduled workflows auto-disabled; the `keepalive`
  workflow re-enables them every month to prevent this (how to check: "Maintenance" in DEPLOY.en.md).
- Every update creates a commit, so git history accumulates (harmless functionally). To avoid
  this, switch to a Cloudflare Worker Cron (see `DEPLOY.md`).
- Third-party services contacted while browsing: cdnjs (Leaflet, map tab only), Esri tiles (only
  when zoomed in on the globe) and the Wikipedia API (farm photos and summaries; links only when
  unavailable). The rest of the site keeps working if any of them fails.

## Updating the global data

The global data changes rarely (once a year is enough). It is generated offline by the scripts in
`tools/` and committed — no scheduled job:

```bash
# 1. Country capacity by year, milestones and GEM Feb-2026 country totals (source: the "Global wind development
#    atlas v3, Taiwan/Japan audited" single-file HTML; the official Taiwan/Japan series live in the script,
#    so the original wind-history-map v3 file gives the same numbers)
python tools/extract_global_data.py global-wind-development-atlas-v3-tw-jp-audited.html data/global
#    Extras from the other parallel version: pipeline projects and the Japanese farm list compiled in 2026
python tools/extract_curated_extras.py wind-history-map.html data/global/sources
# 2. Borders (Natural Earth 1:50m)
curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
python tools/build_borders.py ne_50m_admin_0_countries.geojson data/global/world_borders.json
# 3. Farm layer (curated farms × GEM Global Wind Power Tracker)
curl -LO https://publicgemdata.nyc3.cdn.digitaloceanspaces.com/interim_maps/gwpt_map_2026-02.geojson   # GEM public data bucket (about 55 MB)
python tools/build_farms.py data/global/sources/farms_attachment.json gwpt_map_2026-02.geojson data/global/wind_farms.json
#   clean-up rules that no longer match the new names stop the build; when upgrading the GEM release, build once with CLEANUP_LENIENT=1 to see the new names, then rewrite the rules in tools/farm_cleanup.py
#    (applies the record-level clean-up rules in tools/farm_cleanup.py and writes docs/data-cleanup.md and .en.md)
python tools/qa_farms.py        # sanity check: lists farms located outside their country
python tools/build_live_units.py # unit → farm mapping for Australian/Canadian live data (needs openpyxl; rerun when new farms connect and check the "unmapped" list)
python tools/coverage_report.py # coverage report: docs/data-coverage.md (Chinese) and .en.md (English)
python tools/qa_ports.py        # ports check: fields, inside the country or within 15 km of its coast, sources, farm names
python tools/build_foundations.py # foundations: checks the per-farm table (farm names, OSPAR values, second sources; a construction source where OSPAR only has the consented design), writes foundations.json and docs/foundations*.md
# 4. Terrain basemaps (needs Pillow + numpy; download locations in the script's docstring)
python tools/build_basemaps.py world.topo.bathy.200412.3x5400x2700.jpg GRAY_50M_SR_OB.tif assets/img/globe
# 5. Single-file edition and the public global wind map (written to standalone/, not in git; Actions rebuilds and uploads them after pushes to main)
python tools/build_standalone.py
python tools/build_globe_lite.py
# 6. Major events & incidents (after editing data/global/sources/events_2026-09.csv or the English / farm links in tools/build_events.py)
python tools/build_events.py
# 7. The timeline's "latest available" year and national capacity factors (after editing tools/latest_wind.py or updating data/global/sources/ember_wind_2020-2025.csv)
python tools/build_country_stats.py
# 8. Position and specs of every US turbine (USWTDB, updated quarterly; re-run after rebuilding the farm layer, renamed farms stop matching)
curl -LO https://energy.usgs.gov/uswtdb/assets/data/uswtdbCSV.zip && unzip uswtdbCSV.zip
python tools/build_turbines.py uswtdb_V9_1_20260928.csv
```

### Corrections this site made to the data (all recorded in the data files and the site's "Sources")

- Taiwan 2005–2025 onshore/offshore now follows the official MOEA Energy Administration table (Energy
  Statistics Handbook 2025, Table 3-6; end-2025: 930.3 onshore, 3,586.9 MW offshore). The original counted
  offshore farms still being connected as onshore (e.g. 2,064 MW onshore in 2023, while the onshore fleet is ~0.9 GW)
- Japan 2011–2025 now follows JWPA year-end statistics (end-2025: 6,434.2 MW; offshore = full offshore +
  semi-offshore); the original used IRENA (6,249 MW)
- Taiwan and Japan farms were audited one by one: large offshore farms connected in stages count from their
  full-completion year (Yunlin 2025, Greater Changhua 1&2a and Changfang & Xidao 2024), and those not fully
  operating at end-2025 are under construction (Hai Long 2&3, Greater Changhua 2b&4, Taipower Offshore Phase 2,
  Kitakyushu Hibikinada, Goto floating). Japan also gains five semi-offshore/port sites, retired demonstrators,
  100 small farms missing from GEM (NEDO prefecture lists, windfarm.work) and 22 corrected GEM coordinates
- Formosa 1 Phase 1 and Formosa 2 years aligned with their actual grid connection / commercial dates
- Borders rebuilt from Natural Earth 1:50m (the original lacked the mainland Australia polygon);
- France 2025 onshore/offshore now follows the grid-connected capacity at end-2025 in the SDES wind dashboard (Q2 2026 issue),
  23,992 / 2,008 MW; the original used IRENA onshore 24,155 and offshore 1,500 MW (missing Yeu-Noirmoutier, 500 MW, fully
  connected in 2025)
  Crimea shown as part of Ukraine per UN General Assembly resolution 68/262, matching the country
  GEM assigns to Crimean wind farms
- GEM phases more than 25 km apart under one location are shown as separate points instead of an
  averaged position (which put multi-state projects in the wrong place); three coordinate errors
  that the project names make obvious were fixed (Miyagi Kami, Suzu 1, Suzu 2 phase 2), and one WRI
  GPPD record whose country and coordinates disagree was dropped
- Phase-1 data clean-up (Sep 2026): after checking record by record, 77 duplicate, never-built or non-existent
  records were removed (e.g. a 600 MW "Jhimpir" farm in Thailand that does not exist, Norway's never-approved
  682 MW Hordavind, whole-area totals in China such as Dabancheng that duplicated the farm-by-farm records, and
  15 farms in Romania placed at the country centre with no evidence they were built), and 52 records had their
  location, capacity, year, phases or status fixed; names are compared after converting Traditional to
  Simplified Chinese and zone codes are compared too (the same offshore farm in Jiangsu and elsewhere is no
  longer listed twice); farms sharing a province or country centre as a placeholder are fanned out on the map
  and labelled. Every record, with its reason and source, is in [docs/data-cleanup.en.md](./docs/data-cleanup.en.md)
- While matching the OSPAR offshore data in Sep 2026, two more duplicates were removed: GEM's whole-farm “C-Power”
  record in Belgium (which repeated Thornton Bank phases I–III) and a second Saint-Brieuc record in France placed
  about 170 km away
- While checking foundations for the rest of Europe (step 2, Sep 2026), 26 more rules corrected the data: Sofia (UK) and
  Calvados (France) were listed as operating in 2025 but are still under construction; Dogger Bank A now follows
  WindEurope's yearly grid-connection figures; Arklow Bank, Utgrunden I, Irene Vorrink and the Hooksiel test turbine
  have stopped or been dismantled; Yeu-Noirmoutier is 488 MW; three Norwegian demonstration areas that were never built,
  the METCentre test site's licensed capacity and 4 duplicates were removed; and 8 farms were moved to where they are
- While checking floating farms (foundation step 3, Sep 2026), 20 more rules corrected the data: EFGL and EolMed (France) and
  the Goto Offshore Wind Farm (Japan) only started operating in 2026 (listed as under construction, with a note, while the
  timeline ends in 2025); TetraSpar was decommissioned in 2026; Kincardine is 47.5 MW; GEM's BiMEP test-site capacity, the
  never-built Dounreay Trì, Korea's stopped Bandibuli and 4 duplicates were removed; projects in the 2026 pipeline
  compilation that have since stopped are left out (`PIPE_DROP`)
- While checking foundations in Taiwan, Japan, Korea and the USA (step 4, Sep 2026), 24 more rules corrected the data:
  the duplicate records of Sunrise Wind, Kamisu and Jeonnam Offshore Wind 1 were merged into one each; Vineyard Wind 1 and
  Yeonggwang Nakwol were not fully operating at the end of 2025 (listed as under construction, with a note); the CVOW
  commercial project now finishes at the end of 2027; Revolution Wind is 704 MW and Empire Wind 810 MW; Setana is out of
  service and the Kitakyushu demonstrator was removed in 2019; and Kamisu phases 1 and 2 and Eurus Akita Port were moved to
  where they are
- From the owner's case-by-case review (Sep 2026), 6 more rules corrected the data: duplicate records of Donghai Bridge
  phase 1, Qingzhou 6 and Hollandse Kust Zuid site 4 were merged; Qingzhou 6 is 1,000 MW; the 202 MW Xiangshui nearshore
  farm belongs to China Three Gorges; Fuqing Xinghua Bay phase 2 is 280 MW, fully connected in 2021
- English country names: Australia was labelled "Ashmore and Cartier Is." (which shares the AUS code); fixed

> The country profile's "farm-level coverage" = mapped operating capacity ÷ national year-end total
> (Taiwan ~89%, Japan ~87% in 2025); the gap is shown explicitly and never filled with synthetic farms.
> Elsewhere farms come from GEM at full nameplate, so sums can be slightly above or below national totals.
> Every country, suspected duplicates and the items still to verify are listed in
> [docs/data-coverage.en.md](./docs/data-coverage.en.md).

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

**Australia and Canada live**

- Australia's NEM: AEMO NEMWeb [Dispatch_SCADA](https://nemweb.com.au/Reports/Current/Dispatch_SCADA/) (measured output
  of every generating unit every 5 minutes); source: Australian Energy Market Operator (AEMO); unit list: AEMO NEM
  Registration and Exemption List
- Alberta: AESO [Current Supply Demand](http://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet) report.
  © 2026 THE INDEPENDENT SYSTEM OPERATOR ("ISO"). All rights reserved; used for non-commercial, educational purposes under
  [AESO's website terms](https://www.aeso.ca/legal/), values unmodified
- Ontario: IESO [Generators Output and Capability](https://reports-public.ieso.ca/public/GenOutputCapability/) report;
  unit names matched with IESO's [Transmission-Connected Generation](https://www.ieso.ca/en/Power-Data/Supply-Overview/Transmission-Connected-Generation) list.
  Copyright © 2004-2022 Independent Electricity System Operator, all rights reserved. This information is subject to the Terms of Use set out in the IESO's website (www.ieso.ca).
- The assessment, and the countries not yet added, are in [docs/live-data-sources.en.md](./docs/live-data-sources.en.md)

**Global**

- Country totals 2000–2025: Our World in Data / IRENA Renewable Capacity Statistics
- Offshore capacity 1991–2025: WFO Global Offshore Wind Reports, GWEC, EWEA / WindEurope statistics
  (each source is listed on the site under "Sources")
- Early data 1980–1999: BTM Consult, IEA Wind annual reports, Danish Energy Agency, US EIA and other
  national statistics (most countries are estimates — for trends only)
- Taiwan national series: [MOEA Energy Administration, Energy Statistics Handbook 2025, Table 3-6](https://ea01.moeaea.gov.tw/a0303/02/attachments/handbook/2025/docs/3-06.%E5%86%8D%E7%94%9F%E8%83%BD%E6%BA%90%E7%99%BC%E9%9B%BB%E8%A3%9D%E7%BD%AE%E5%AE%B9%E9%87%8F(114).pdf);
  Japan national series: [JWPA year-end installed capacity](https://jwpa.jp/information/12660/)
- Farm layer: the curated farms from the "Global wind power development map" (Taiwan/Japan audited), WRI
  Global Power Plant Database v1.3 (CC BY 4.0), Global Energy Monitor's
  [Global Wind Power Tracker](https://globalenergymonitor.org/projects/global-wind-power-tracker/),
  February 2026 release (CC BY 4.0), and the pipeline projects and Japanese farm list compiled in Sep 2026
  (NEDO, windfarm.work, operator pages)
- Pipeline country totals: GEM Global Wind Power Tracker, February 2026 release
- Borders and relief: Natural Earth (public domain); satellite basemap: NASA Earth Observatory Blue
  Marble Next Generation (public domain)
- Zoomed-in tiles: Esri World Imagery (Esri, Vantor, Earthstar Geographics) and Esri World Hillshade
  (Esri, USGS, NASA et al.), attributed on screen per Esri's terms
- Farm photos and summaries: looked up live from Wikipedia / Wikimedia Commons (per-image licences)
- Libraries: three.js r128 (MIT), Leaflet 1.9.4 (BSD-2)

Turbine counts, coordinates, and developer info are compiled from public sources; coordinates are
approximate.

## Developer & copyright

- Developed and maintained by **National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu** (國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室)
- Site code, design and text © 2026 Dof Lab; each dataset is used under the licence of its source
  listed above (Open Government Data License, CC BY 4.0, public domain, etc.).
- Found a data error or a better source? Please report it on [GitHub](https://github.com/dofliu/windfarmTaiwan/issues).
