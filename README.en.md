# 風電風情 · Taiwan Wind Watch

[中文](./README.md) ｜ English (this page)

Taiwan's wind power, live — and the world's wind power story, 1980–2025 (plus a "2026 latest available" point on the timeline). One site, two scales:

- **Taiwan right now**: real-time output for all 30 tracked wind turbine units/farms nationwide, shown
  like a reservoir-level gauge, straight from Taipower and Taiwan government open data.
- **45 years worldwide**: a 3D globe that replays every country's wind build-out since 1980 and zooms down to individual farms
  (about 31,000 farm records: about 21,000 operating farms plus about 9,600 projects under construction or in the pipeline),
  plus a 13-chapter "Learn" section on the history, technology, countries and Taiwan's place in it.

Live site: `https://dofliu.github.io/windfarmTaiwan/`

Developed by National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu (國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室)

## Documents

Every document comes in Chinese and English with the same content; the site itself is bilingual too (toggle at the top right).

| Document | 中文 | English | What it covers |
|---|---|---|---|
| Read me (this page) | [README.md](./README.md) | [README.en.md](./README.en.md) | Features in brief, architecture, files, data updates, sources and licences |
| **User guide** | [docs/user-guide.md](./docs/user-guide.md) | [docs/user-guide.en.md](./docs/user-guide.en.md) | How to use every page, button and layer, URL parameters, FAQ |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) | [CHANGELOG.en.md](./CHANGELOG.en.md) | What each version changed (the site footer shows the current version) |
| Roadmap | [ROADMAP.md](./ROADMAP.md) | [ROADMAP.en.md](./ROADMAP.en.md) | Current status, known limitations, plans and directions evaluated but deferred |
| To do | [TODO.md](./TODO.md) | [TODO.en.md](./TODO.en.md) | Work in progress, hand-off notes and concrete tasks |
| Deployment | [DEPLOY.md](./DEPLOY.md) | [DEPLOY.en.md](./DEPLOY.en.md) | Deployment options and the monthly maintenance check |
| Data coverage | [docs/data-coverage.md](./docs/data-coverage.md) | [docs/data-coverage.en.md](./docs/data-coverage.en.md) | Farm-level coverage by country, suspected duplicates and items to verify (generated) |
| Data clean-up log | [docs/data-cleanup.md](./docs/data-cleanup.md) | [docs/data-cleanup.en.md](./docs/data-cleanup.en.md) | Every farm record removed or corrected, and why (generated) |
| Foundations | [docs/foundations.md](./docs/foundations.md) | [docs/foundations.en.md](./docs/foundations.en.md) | Foundation type and dimensions of each offshore farm (generated) |
| Events and incidents | [docs/events.md](./docs/events.md) | [docs/events.en.md](./docs/events.en.md) | The events layer, row by row (generated) |
| Live-data sources | [docs/live-data-sources.md](./docs/live-data-sources.md) | [docs/live-data-sources.en.md](./docs/live-data-sources.en.md) | Which other countries publish live wind generation |
| Promo video | [tools/promo/README.md](./tools/promo/README.md) | [tools/promo/README.en.md](./tools/promo/README.en.md) | Scripts for the globe's promo video |
| Project conventions | [CLAUDE.md](./CLAUDE.md) (both languages side by side) | | For developers and AI agents: rules for docs, data, testing and versions |

## Downloads (no web server needed, open offline)

- **Single-file edition**: [windfarmTaiwan-standalone.html](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html) (about 13 MB), the whole site; see "Single-file edition" below.
- **Public global wind map** (for everyone): [windfarmTaiwan-globe.html](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-globe.html) (about 12 MB), just the 3D globe with the onshore, offshore and pipeline layers.

**Project status (7 Oct 2026, v2.30.2)**: the main features are finished; the project has been in maintenance since 27 Sep 2026, with improvements
made since as the owner asks (one PR each, see the CHANGELOG). The automatic Taiwan and international live-data updates keep running; what to
watch is under "Maintenance" in [DEPLOY.en.md](./DEPLOY.en.md), and work to pick up next is at the top of [TODO.en.md](./TODO.en.md).

## Quick start (read this first)

The bar at the top of the site has four pages:

| Page | What it shows |
|---|---|
| **Home** | Everything on one page: Taiwan's wind output right now, the world's wind growth 1980–2025, and where Taiwan ranks |
| **Taiwan live** | How much each of Taiwan's 30 wind farms is generating right now (updated about every 2 hours); click any farm for its details |
| **Global** | A 3D globe that animates the growth of wind power by country and zooms down to single wind farms |
| **Learn** | 13 illustrated chapters, from the first power-generating turbine in 1888 to Taiwan's offshore wind, with a glossary and "Frequently asked" |

A suggested first visit (about 5 minutes):

1. **Home**: start with the two big numbers at the top — Taiwan's wind output right now and the world's cumulative capacity.
2. **Taiwan live**: click any farm (for example Greater Changhua or Formosa 2) to open its details: live trend, nearby wind speed,
   specifications and project history. The tabs at the top switch between Dashboard, Farm grid, Charts and Map.
3. **Global**: press **▶ Tour** in the toolbar and pick "Auto tour" for a guided run through the key moments in wind power, or one of four narrated story
   tours (Taiwan's road to offshore wind, Europe offshore, China's rise, Floating wind), or press play on the timeline
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
  the end of 2025, with the latest 2026 figures for 8 countries; the farm-by-farm data is GEM's February 2026 release.
- To use it offline, download the [single-file edition](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html)
  and open it from your computer.
- Found a mistake? Farm cards have "Report a data error" at the bottom, or open an issue on
  [GitHub](https://github.com/dofliu/windfarmTaiwan/issues).
- Every button, layer and URL parameter is explained in the **[user guide](./docs/user-guide.en.md)**.

## Features

Four pages in the nav bar (hash routes, so every view can be shared as a link). This is a summary; the [user guide](./docs/user-guide.en.md) has the details.

- **Home** `#/home` — Taiwan's live total next to global cumulative capacity 1980–2025; where Taiwan ranks; featured milestones
  (click one to fly there on the globe)
- **Taiwan live** `#/live` — national wind output, availability, grid operating reserve rate and wind's contribution, today's estimated
  generation, sortable and filterable unit gauges; Farm grid `#/live/wall`, Charts `#/live/charts` (ranking / output mix, the long-term
  trend from official retrospective data), Map `#/live/map` (Leaflet satellite map); a detail panel per farm (live trend, nearby
  weather-station wind speed, specs, verified development and operation timeline, `#/live?farm=<id>`); "Share" makes a live card with the data time
- **Global** `#/global` — a 3D globe (three.js, loaded only when you open this page and paused when you leave it):
  - Year-by-year animation of each country's onshore/offshore **year-end cumulative capacity** (1980–2025, plus a "2026 (latest available)"
    point from 8 countries' official figures); the ranking bars are always in MW; map / map + bars / bar race, 3D globe or 2.5D map
  - **Farm layer**: curated farms merged with Global Energy Monitor's Global Wind Power Tracker (Feb 2026) and Germany's MaStR; selecting a
    country draws all of its farms, and clicking a farm draws its turbines at their real positions (USWTDB in the US, MaStR in Germany,
    OpenStreetMap elsewhere)
  - **Pipeline** (dashed rings): about 9,600 projects under construction, in pre-construction or announced; the Pipeline tab lists them by
    status and expected year, with GEM's country pipeline totals
  - **Search and filters** (🔍 or the / key): every farm by name, Chinese name, developer, turbine model or country, filtered by status, type,
    size and year, with the conditions kept in the URL for sharing
  - **Country profiles**: history curve, rank, 10-year growth, largest and earliest farms, farm-level coverage, pipeline and foundation totals
    (Taiwan and Japan carry an official-statistics audit badge)
  - **Farm cards**: hand-checked photos, Wikipedia summary, foundation and a to-scale cross-section, distance to shore, actual or estimated
    yearly output, national rank, phases, nearby and same-developer farms, related events, live output, external links, "Copy link to this
    farm" and "Report a data error"
  - **📊 Output**: rankings and same-model comparisons of measured yearly output for Taiwan (19 Taipower-owned farms), the US (EIA-923, 833 farms),
    Australia (AEMO, 62 farms) and Denmark (54 farms and about 1,800 individually metered turbines); plus "Taiwan · live samples" including
    private farms (an estimate from samples, never mixed with the official figures)
  - **Layers**: ports (55 in 15 countries, ⚓), major events and incidents (91, ⚑, [docs/events.en.md](./docs/events.en.md)), offshore
    foundations (285 of the 331 operating offshore farms have a known type, 87.3% of capacity, [docs/foundations.en.md](./docs/foundations.en.md)),
    Wind now (NOAA GFS, every 6 hours), Sea zones (EEZ boundaries, Taiwan's 36 potential sites, Japan's 13 promotion zones and the offshore wind
    areas of 6 North Sea countries) and a mean wind speed basemap (Global Wind Atlas)
  - **Tours**: an auto tour and four story tours (Taiwan's road to offshore wind, Europe offshore, China's rise, Floating wind;
    `#/global?tour=tw` / `eu` / `cn` / `fl`)
  - **Live output in Australia and Canada**: about 150 farms from AEMO, AESO and IESO; with the timeline at the latest year, farms with
    live data get a green ring and their rotors spin with their current output
  - **National wind output right now**: totals and a 48-hour trend for the UK (Great Britain, Northern Ireland), Ireland, Germany, France, Denmark, Belgium, Poland and Korea and the Texas
    and California grids (totals only), in the country profiles and the world "Wind output right now" list; see [user guide 4.5](./docs/user-guide.en.md#45-side-panel-tabs)
  - Devices without WebGL fall back to the bar race automatically
- **Learn** `#/learn` — 13 chapters: from Charles Brush's 1888 turbine to 2025, onshore and offshore, foundations, floating wind,
  ever-bigger turbines, Asia's rise, Taiwan's offshore build-out, why wind matters, a glossary and full source list; every chart is drawn
  from the same global dataset and every chapter links to the globe to replay that part of the story

## Architecture

```
GitHub Actions (about every 2 hours) ── taipower_wind_scraper.py ──► wind_realtime.json / wind_history.json / grid_status.json / data/archive/farm_daily.json ─┐
                                     ── intl_wind_scraper.py    ──► data/live/intl_realtime.json (Australia, Canada) ─────────────────────────────────────┤
GitHub Actions (weekly, Monday)      ── backfill_history.py      ──► data/archive/ monthly files / wind_archive_daily.json ─────────────────────────────────┤
GitHub Actions (every 6 hours)       ── tools/fetch_gfs_wind.py  ──► data/live/wind_now.webp / wind_now.json (Wind now) ─────────────────────────────────────┤
                                                                                                                                                              ├─► commit back to repo
tools/*.py (manual, rare: when source data changes) ──► data/global/*.json, assets/img/globe/*.jpg, docs/* (generated documents) ───────────────────────────┤
GitHub Pages serves this same repo: index.html + assets/ + data/ + the JSON above ◄──────────────────────────────────────────────────────────────────────────┘
GitHub Actions (push to main touching site code or global data) ── tools/build_standalone.py, build_globe_lite.py ──► the two HTML files in the "standalone" Release (no commit)
GitHub Actions (every PR) ── tools/smoke_test.js and more ──► automatic checks (pr-check)
Browser loads index.html → lazy-loads page modules and data (same origin, no CORS)
```

A plain static site with no build step: `index.html` is the shell, and each module in `assets/js/`
registers its page with the hash router via `WW.registerPage()`. The globe's three.js (~600 KB),
basemaps and the 3.8 MB farm dataset are only downloaded the first time `#/global` is opened; larger files such as turbine positions,
output and sea zones load only when needed.

## Files

- `index.html` — site shell: top navigation, the four pages' layout and bilingual copy, drawer, toast
- `assets/css/site.css` — design system (dark data style, palette, components, responsive);
  `assets/css/globe.css` — globe styles
- `assets/js/core.js` — shared core: i18n, hash router, lazy loading, data cache, number formats, share; the version `WW.VERSION`
- `assets/js/live.js` — Taiwan live (the `FARMS` list of 30 units/farms with specs and timelines;
  live / history / grid data loading; dashboard, farm wall, charts, map, drawer, share card)
- `assets/js/charts.js` — lightweight SVG charts (line, columns, bars, scatter; tooltips and table views)
- `assets/js/home.js`, `assets/js/learn.js` — Home and Learn pages
- `assets/js/globe.js` — the 3D globe (rewritten from the "Global wind power development map",
  wind-history-map v3)
- `assets/vendor/` — three.js r128 and OrbitControls (MIT, vendored unmodified)
- `assets/img/globe/` — relief / satellite / wind speed basemaps (4096×2048 and 2048×1024)
- `data/global/wind_global.json` — per-country onshore/offshore capacity 1980–2025, world totals,
  milestones, sources and notes (~90 KB)
- `data/global/wind_farms.json` — ~31,000 farm-level records (operating, pipeline, retired; 151 countries and territories)
- `data/global/country_stats.json` — the "latest available" point on the globe's timeline (2026: official figures for 8 countries,
  sourced country by country in `tools/latest_wind.py`) and each country's average wind capacity factor (Ember, for the
  estimated yearly output on farm cards); built by `tools/build_country_stats.py`
- `data/global/world_borders.json` — country borders (Natural Earth 1:50m)
- `data/global/turbines.json` — position and specs of every US turbine (USWTDB, public domain; 967 farms, about 61,000
  turbines), built by `tools/build_turbines.py` and loaded only when a US farm is selected
- `data/global/turbines_de.json` — position and specs of every German turbine (MaStR; about 6,600 farms, 26,000 turbines), built by `tools/build_mastr.py`;
  **shared under the Data licence Germany – attribution – 2.0 (© Bundesnetzagentur | Marktstammdatenregister)**; `data/global/sources/mastr_parks_DEU.json` lists the German farms added to the farm layer
- `data/global/turbines_osm.json` — turbine positions in other countries from OpenStreetMap (about 6,100 farms, 139,000
  turbines), downloaded by `tools/fetch_osm_turbines.py` and matched to the site's farms by `tools/build_turbines_osm.py`. **This file is shared under the
  Open Database License (ODbL) 1.0 (© OpenStreetMap contributors)**, unlike the rest of the site's data; loaded only when a
  non-US farm is selected (Germany prefers MaStR)
- `data/global/generation.json` — actual yearly output and capacity factor of farms (833 in the US from EIA-923 with the nameplate capacity registered in EIA-860M, public domain;
  19 Taipower-owned farms in Taiwan from Taipower open data 17140; 54 Danish farms from the Danish Energy Agency's turbine register, matched by location;
  62 Australian farms from AEMO's 5-minute SCADA output per unit; the turbine model when a farm has only one, for the Output dialog's same-model comparison),
  built by `tools/build_generation.py` (the Danish rules are in `tools/dk_output.py`, the Australian ones in `tools/au_output.py`) and loaded when a farm card first opens;
  the Australian source aggregate is `data/global/sources/aemo_wind_monthly.json` (made by `python3 tools/au_output.py fetch` from AEMO's monthly files)
- `data/global/turbine_output.json` — position, specs and measured yearly output of 1,848 individually metered Danish turbines (Danish Energy Agency;
  production is published for company-owned turbines only), built with `generation.json` and loaded when the Output dialog shows "Denmark · single turbines"
- `data/global/foundations.json` — foundation types and dimensions of offshore farms (built by `tools/build_foundations.py` from the
  per-farm tables in `tools/farm_foundations.py` and `tools/farm_dimensions.py`)
- `data/global/ports.json` — 55 offshore wind ports (curated by hand with sources; run `tools/qa_ports.py` after editing)
- `data/global/events.json` — 91 major events and incidents (built by `tools/build_events.py` from
  `data/global/sources/events_2026-09.csv`; the English titles, summaries and notes and the event-to-farm links live in
  the build script, which checks that every event has English text and that farm names match the farm layer)
- `data/global/photos.json` — farm card photos (64 farms and 18 milestones; hand-checked Wikimedia Commons photos, built by `tools/build_photos.py` from `tools/farm_photos.py`)
- `data/global/offshore_zones.json` — the sea-zones layer: EEZ boundaries (Marine Regions v12, CC BY 4.0, simplified to about 2 km for display), Taiwan's offshore
  wind potential sites (Energy Administration open data 36681), Japan's promotion zones and the North Sea countries' offshore wind areas, built by
  `tools/build_offshore_zones.py` (the Taiwanese site coordinates are kept in `data/global/sources/twn_offshore_potential_sites_36681.csv`, the Japanese
  notices' vertices in `data/global/sources/jpn_promotion_zones.json`, and the North Sea layers are downloaded from official open services by the build) and loaded
  when "Sea zones" is turned on
- `data/global/wind_resource.json` — bands and legend of the wind speed basemap (built by `tools/build_wind_resource.py`)
- `data/global/sources/` — the curated farm list before merging (with the Taiwan/Japan audit status), the
  pipeline projects and Japanese farm list compiled in 2026, the merge log, the wind records of OSPAR Offshore
  Renewables 2024 (CC0, used for foundation types) and other raw build inputs
- `data/live/` — live output in Australia and Canada plus eleven national, regional and grid wind totals `intl_realtime.json`, the grid unit code → farm mapping `units.json` (built by
  `tools/build_live_units.py`; Ontario checked by hand against IESO's published facility list), and Wind now `wind_now.webp` + `wind_now.json` (scheduled)
- `data/archive/wind_history_archive_YYYY-MM.json` — the long-term archive of Taipower's official retrospective data, one file per month (written by `backfill_history.py`)
- `data/archive/farm_daily.json` — daily samples of every grid unit (private farms included) in Taipower's live data, from June 2026 (added by the scraper
  on every run; `tools/build_farm_daily.py` backfills it from the git history), used by the Output dialog's Taiwan live samples and farm cards; one line per day,
  fields described in the file's meta
- `tools/` — generators for the global data and basemaps (see "Updating the global data" below);
  `tools/build_standalone.py` and `tools/build_globe_lite.py` build the two single-file copies, `tools/coverage_report.py` the data coverage report,
  `tools/qa_farms.py` checks farm coordinates, `tools/qa_ports.py` checks the ports data,
  `tools/build_foundations.py` builds the foundation data and the farm-by-farm list, `tools/check_quotes.py` confirms that
  passages quoted during research really are on their source pages (`tools/grab_page.py` finds quotable passages),
  `tools/smoke_test.js` is the smoke test and `tools/check_version.py` checks the version and changelogs; `tools/research/` holds research notes not yet written into
  the tables (each source with its quoted passage and check result)
- `tools/promo/` — scripts for the promo video of the 3D globe (globe recording, designed scenes, storyboards; the videos stay out of git, see [tools/promo/README.en.md](./tools/promo/README.en.md))
- `standalone/` (not in git) — where the build scripts write locally; the official single-file edition and public global wind map are built by Actions and uploaded to the GitHub Release "standalone"
- `docs/` — the user guide (`user-guide.en.md`), the data coverage report (`data-coverage.en.md`), the data clean-up log (`data-cleanup.en.md`), the
  farm-by-farm foundation list (`foundations.en.md`), the events list (`events.en.md`) and the
  assessment of live-data sources in other countries (`live-data-sources.en.md`), each with a Chinese version (`.md`)
- `CLAUDE.md` — project conventions (bilingual docs, the single-file edition, data updates, testing and versions) for future
  contributors and AI agents
- `taipower_wind_scraper.py` — runs about every 2 hours: fetches Taipower's open data, parses the 30
  wind units → `wind_realtime.json`; accumulates a rolling 7-day history → `wind_history.json`; adds the daily samples of every grid
  unit → `data/archive/farm_daily.json`; also fetches the real-time supply-demand report → `grid_status.json`
- `intl_wind_scraper.py` — runs about every 2 hours: fetches each wind farm's live output from Australia's NEM
  (AEMO), Alberta (AESO) and Ontario (IESO), plus the wind totals of Great Britain, Northern Ireland, Ireland, Germany, France, Denmark, Belgium, Poland, Korea, Texas (ERCOT)
  and California (CAISO) → `data/live/intl_realtime.json` (with each grid's 48-hour total, and hourly means for the national
  totals); if a source fails, the previous values are kept and flagged, and Taiwan's data is unaffected
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
- `.github/workflows/scrape.yml` — runs both scrapers about every 2 hours and commits
- `.github/workflows/backfill.yml` — accumulates the official retrospective archive weekly and fills daily-sample gaps from the last three weeks of
  git history; can also be triggered manually (with a dry-run option)
- `.github/workflows/wind-now.yml` — fetches the NOAA GFS 10 m wind field every 6 hours (`tools/fetch_gfs_wind.py`) for the globe's "Wind now"
- `.github/workflows/standalone.yml` — rebuilds both single-file copies when site code or global data change and uploads them to the "standalone" Release (no commit, so git history does not grow by 25 MB each time)
- `.github/workflows/keepalive.yml` — on the 1st of each month, re-enables the scheduled workflows through the GitHub API so they are not disabled after 60 days without activity (no commits)
- `.github/workflows/pr-check.yml` — checks on every pull request: a Playwright smoke test (every page at desktop and phone widths, both single-file copies online and offline,
  `tools/smoke_test.js`), syntax, farm coordinates, generated documents being up to date, and the version and both changelogs when the site changes (`tools/check_version.py`);
  run it locally with `node tools/smoke_test.js http://localhost:8000/ --standalone`

## Deployment and local preview

- GitHub Pages serves this repo's `main` branch (root) at `https://dofliu.github.io/windfarmTaiwan/`; the six GitHub Actions
  workflows (live data, the weekly official backfill, Wind now, the single-file rebuild, the monthly keepalive and the PR checks) are
  running and need no further setup.
- Steps for deploying from scratch to another repo or host are in [DEPLOY.en.md](./DEPLOY.en.md); the monthly maintenance check is under
  "Maintenance" in DEPLOY.en.md.

> Local preview: run `python3 -m http.server` in the repo root and open `http://localhost:8000/`
> (opening `index.html` from disk can't load the JSON files over `file://`; to open the site straight
> from disk, use the single-file edition).

## Single-file edition (download and open)

`windfarmTaiwan-standalone.html` packs the whole site (Home, Taiwan live, the 3D globe and
Learn) into one HTML file of about 13 MB, published in the GitHub Release "[standalone](https://github.com/dofliu/windfarmTaiwan/releases/tag/standalone)" (a fixed tag whose files are overwritten on each rebuild):

- **Download**: "Download the single-file HTML" in the site footer or under Learn → Sources & method →
  About this site, or save `https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html`.
- **Online**: Taiwan live data is fetched fresh from the live site (updated about every 2 hours),
  zooming in on the globe loads Esri detail tiles, and farm cards look up Wikipedia.
- **Offline**: the global data, ~31,000 farm records, borders and the 2k relief/satellite basemaps are
  inside the file, so the globe works as usual; Taiwan live shows the data saved at build time, labelled
  "Offline snapshot". The satellite map on the Taiwan live page (Leaflet) needs a connection.
- **Updates**: pushes to `main` that touch `index.html`, `assets/` or `data/global/*.json` rebuild it
  automatically through GitHub Actions and upload it to the Release (the files are not in git); locally, run `python3 tools/build_standalone.py` (it stops if
  `WW.VERSION` has no entry in both changelogs). The footer shows the version, build time and commit.
  In the single-file edition the Share button always shares the live site's URL.
- **Public global wind map** `windfarmTaiwan-globe.html` (about 12 MB, `python3 tools/build_globe_lite.py`, also rebuilt and uploaded by
  Actions): a slimmed-down copy for the general public with just the 3D globe and the onshore, offshore and pipeline
  layers (country series, farm search, the Pipeline tab, Output, relief / satellite basemaps and deep links included); it loads
  no ports, foundations, events, sea zones, Wind now, milestone tour or live data and has no Home, Taiwan live or Learn pages; the footer
  links to the full site. Offline it only lacks the Esri detail tiles and Wikipedia summaries.

## Notes

- Uses a **public repo**: unlimited free Actions minutes.
- The schedule runs about every 2 hours; GitHub's cron isn't precise (runs can be late or occasionally
  skipped), which is fine here because the site does not need minute-by-minute data.
- A repo with 60 days of no activity gets its scheduled workflows auto-disabled; the `keepalive`
  workflow re-enables them every month to prevent this (how to check: "Maintenance" in DEPLOY.en.md).
- Every update creates a commit, so git history accumulates (harmless functionally). To avoid
  this, switch to a Cloudflare Worker Cron (see `DEPLOY.en.md`).
- Third-party services contacted while browsing: cdnjs (Leaflet, map tab only), Esri tiles (only
  when zoomed in on the globe) and Wikipedia / Wikimedia Commons (farm photos and summaries; links only when
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
# 3. Farm layer (curated farms × GEM Global Wind Power Tracker × Germany's MaStR)
#    Germany: range-fetch the wind file (about 10 MB) from the MaStR bulk export, match it to the site's farms and list the farms to add (matched against non-MaStR records only)
python tools/fetch_mastr.py mastr/ && python tools/build_mastr.py mastr/EinheitenWind.xml mastr/Katalogwerte.xml
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
#    Wind speed basemap (needs rasterio; reads only the overview of the Global Wind Atlas cloud GeoTIFF, not the whole 14 GB file; needs relief_4k.jpg first)
python tools/build_wind_resource.py
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
# 9. Turbine positions in other countries (OpenStreetMap, ODbL; the download takes 2–4 hours and retries when the public Overpass servers are busy, re-run to fill failed tiles; re-run the matching after rebuilding the farm layer)
python tools/fetch_osm_turbines.py osm_wind/
python tools/build_turbines_osm.py osm_wind/
# 10. Actual yearly output (EIA-923 publishes the previous year's final data around September, older years under archive/xls/; replace the two Taiwan CSVs with fresh downloads from Taipower open data; run step 8 first)
curl -LO https://www.eia.gov/electricity/data/eia923/xls/f923_2025.zip   # 2023 and 2024 are under .../eia923/archive/xls/
curl -LO https://www.eia.gov/electricity/data/eia860m/xls/august_generator2026.xlsx   # EIA-860M: generator capacity and in-service/retirement years (take the latest month)
#     Australia: python tools/au_output.py fetch 2022-01 2025-12 (AEMO MMSDM monthly files, about 30 MB a month and 20 minutes; move the last month on for a new year)
#     Denmark (optional): download the "Vinddata" and "Parkproduktion" workbooks from the Danish Energy Agency, https://ens.dk/analyser-og-statistik/data-oversigt-over-energisektoren (updated about every 2 months), and add them last
python tools/build_generation.py uswtdb_V9_1_20260928.csv f923_2023.zip f923_2024.zip f923_2025.zip august_generator2026.xlsx \
  data/global/sources/taipower_renewable_generation_17140.csv data/global/sources/taipower_wind_stations_17141.csv vinddata.xlsx parkproduktion.xlsx
```

### Corrections this site made to the data (all recorded in the data files and the site's "Sources")

- Taiwan 2005–2025 onshore/offshore now follows the official MOEA Energy Administration table (Energy
  Statistics Handbook 2025, Table 3-6; end-2025: 930.3 onshore, 3,586.9 MW offshore). The original counted
  offshore farms still being connected as onshore (e.g. 2,064 MW onshore in 2023, while the onshore fleet is ~0.9 GW)
- Japan 2011–2025 now follows JWPA year-end statistics (end-2025: 6,434.2 MW; offshore = full offshore +
  semi-offshore); the original used IRENA (6,249 MW)
- France 2025 onshore/offshore now follows the grid-connected capacity at end-2025 in the SDES wind dashboard (Q2 2026 issue),
  23,992 / 2,008 MW; the original used IRENA onshore 24,155 and offshore 1,500 MW (missing Yeu-Noirmoutier, 500 MW, fully
  connected in 2025)
- Taiwan and Japan farms were audited one by one: large offshore farms connected in stages count from their
  full-completion year (Yunlin 2025, Greater Changhua 1&2a and Changfang & Xidao 2024), and those not fully
  operating at end-2025 are under construction (Hai Long 2&3, Greater Changhua 2b&4, Taipower Offshore Phase 2,
  Kitakyushu Hibikinada, Goto floating). Japan also gains five semi-offshore/port sites, retired demonstrators,
  100 small farms missing from GEM (NEDO prefecture lists, windfarm.work) and 22 corrected GEM coordinates
- Formosa 1 Phase 1 and Formosa 2 years aligned with their actual grid connection / commercial dates
- Borders rebuilt from Natural Earth 1:50m (the original lacked the mainland Australia polygon);
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
- From late September 2026, checking the foundations and dimensions of Chinese and Vietnamese offshore farms produced further rules correcting
  duplicates, never-built farms, status, capacity, turbine models and locations (e.g. GEM's four records for the four sites of CTG Dafeng 800 MW,
  Xiangshan Tuci's connection year, Zhuanghe IV-2 now operating); 885 rules in all, each with its reason and source in [docs/data-cleanup.en.md](./docs/data-cleanup.en.md)
- English country names: Australia was labelled "Ashmore and Cartier Is." (which shares the AUS code); fixed

> The country profile's "farm-level coverage" = mapped operating capacity ÷ national year-end total
> (Taiwan ~89%, Japan ~87% in 2025); the gap is shown explicitly and never filled with synthetic farms.
> Elsewhere farms come from GEM at full nameplate, so sums can be slightly above or below national totals.
> Every country, suspected duplicates and the items still to verify are listed in
> [docs/data-coverage.en.md](./docs/data-coverage.en.md).

## Data sources & license

> **The data is not fully accurate**: the site compiles public data and keeps checking it record by record, but some locations, years and values are placeholders or estimates
> (shared placeholder points, unknown start years, farm records short of the national figures, estimated yearly output and so on), and some are not yet checked or complete
> (foundation types and hub heights of some offshore farms, ports, events and photos). On the site, see the top of the globe's "Sources" dialog (computed from the data now loaded)
> and Learn chapter 13, "Limits of the data"; each correction and its reason is in [docs/data-cleanup.en.md](./docs/data-cleanup.en.md) and coverage by country in [docs/data-coverage.en.md](./docs/data-coverage.en.md).

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

**Live data abroad**

- Australia's NEM: AEMO NEMWeb [Dispatch_SCADA](https://nemweb.com.au/Reports/Current/Dispatch_SCADA/) (measured output
  of every generating unit every 5 minutes); source: Australian Energy Market Operator (AEMO); unit list: AEMO NEM
  Registration and Exemption List
- Alberta: AESO [Current Supply Demand](http://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet) report.
  © 2026 THE INDEPENDENT SYSTEM OPERATOR ("ISO"). All rights reserved; used for non-commercial, educational purposes under
  [AESO's website terms](https://www.aeso.ca/legal/), values unmodified
- Ontario: IESO [Generators Output and Capability](https://reports-public.ieso.ca/public/GenOutputCapability/) report;
  unit names matched with IESO's [Transmission-Connected Generation](https://www.ieso.ca/en/Power-Data/Supply-Overview/Transmission-Connected-Generation) list.
  Copyright © 2004-2022 Independent Electricity System Operator, all rights reserved. This information is subject to the Terms of Use set out in the IESO's website (www.ieso.ca).
- Great Britain: Elexon BMRS [Generation by fuel type](https://bmrs.elexon.co.uk/generation-by-fuel-type) (FUELINST, every 5 minutes; only wind metered
  by the grid operator, so most turbines on the distribution network are not in it). Contains BMRS data © Elexon Limited copyright and database right 2026;
  under the [BMRS data licence](https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/)
- Germany: Bundesnetzagentur | [SMARD.de](https://www.smard.de/) (onshore and offshore generation every 15 minutes, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/);
  converted to average power and averaged by hour by this site)
- France: RTE éCO2mix national real-time data via [ODRÉ](https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/) (every 15 minutes,
  [Licence Ouverte v2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/))
- Denmark: Energinet ([www.energidataservice.dk](https://www.energidataservice.dk/tso-electricity/PowerSystemRightNow)) PowerSystemRightNow (every minute,
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); hourly means computed by this site)
- Texas: ERCOT [Fuel Mix](https://www.ercot.com/gridmktinfo/dashboards/fuelmix) dashboard (every 5 minutes, with the month's wind capacity); Source: Electric
  Reliability Council of Texas (under [ERCOT's terms of use](https://www.ercot.com/help/terms))
- California: California ISO [Today's Outlook](https://www.caiso.com/todays-outlook/supply) (every 5 minutes); Source: California ISO (under
  [CAISO's terms of use](https://www.caiso.com/privacy-terms-of-use))
- Belgium: Elia Open Data [ods086](https://opendata.elia.be/explore/dataset/ods086/) / ods031 (every 15 minutes, measured and upscaled to the whole fleet, with the monitored capacity);
  under the [Elia Open Data Licence](https://opendata.elia.be/pages/licence/) (CC BY 4.0); regions summed and hourly means computed by this site
- Poland: the live snapshot on PSE's homepage map "Mapa KSE" ([www.pse.pl](https://www.pse.pl/home); the widget's undocumented data endpoint), with earlier hours of the trend from the
  15-minute total wind generation PSE's report API publishes the next day; credited "Informacja pozyskana ze strony www.pse.pl, wg. stanu strony na dzień [date], przetworzona w części"
  under [PSE's conditions for reusing public-sector information](https://www.pse.pl/bip/ponowne-wykorzystanie-informacji-publicznej)
- Republic of Ireland and Northern Ireland: EirGrid [Smart Grid Dashboard](https://www.smartgriddashboard.com/) (wind generation estimates every 15 minutes; the page's undocumented data endpoint).
  Supported by EirGrid Group Data; under the [EirGrid Open Data Licence](https://www.smartgriddashboard.com/all/open-data-license/); hourly means computed by this site
- Korea: Korea Power Exchange (KPX) [real-time supply and demand by source](https://www.kpx.or.kr/powerinfoSubmain.es?mid=a10404030000) (5-minute instantaneous values). The KPX page carries
  no licence; used because the same series is listed as "이용허락범위 제한 없음" (no restriction on use) on Korea's public data portal ([data.go.kr 15142651](https://www.data.go.kr/data/15142651/openapi.do))
  and under Korea's Public Data Act; hourly means computed by this site
- Japan's grid operators all require consent before their data is republished, so Japan is not included
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
  February 2026 release (CC BY 4.0), the pipeline projects and Japanese farm list compiled in Sep 2026
  (NEDO, windfarm.work, operator pages), and the German Federal Network Agency's Market Master Data Register MaStR
  (© Bundesnetzagentur | Marktstammdatenregister, Data licence Germany – attribution – version 2.0; every German turbine and onshore farms GEM lacks)
- Pipeline country totals: GEM Global Wind Power Tracker, February 2026 release
- The timeline's "2026 (latest available)": official or industry statistics for 8 countries (Taiwan's Energy Administration, US EIA-860M, China's
  National Energy Administration, India's MNRE, Brazil's ANEEL, Germany's Deutsche WindGuard, France's SDES, the UK's DESNZ), with each country's source,
  data month and note in `tools/latest_wind.py`; national average capacity factors (for estimated yearly output): [Ember Yearly Electricity Data](https://ember-energy.org/data/yearly-electricity-data/) (CC BY 4.0)
- Turbine positions: the US [USWTDB](https://energy.usgs.gov/uswtdb/) (USGS, LBNL, American Clean Power Association; public domain); Germany's MaStR (above);
  elsewhere © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL 1.0; the derived `data/global/turbines_osm.json` is likewise shared under the ODbL)
- Foundations: OSPAR Offshore Renewable Energy Developments 2024 (CC0); every other farm's sources (developers, construction contractors, government documents,
  trade press) are in [docs/foundations.en.md](./docs/foundations.en.md)
- Major events and incidents, ports: each row cites a regulator, owner or trade press source ([docs/events.en.md](./docs/events.en.md), `data/global/ports.json`)
- Borders and relief: Natural Earth (public domain); satellite basemap: NASA Earth Observatory Blue
  Marble Next Generation (public domain)
- Wind speed basemap: Global Wind Atlas 3 (DTU Wind Energy / World Bank Group, CC BY 4.0)
- Sea zones: EEZ boundaries from the Flanders Marine Institute (VLIZ) [Marine Regions](https://www.marineregions.org/) Maritime Boundaries Geodatabase v12
  (2023, CC BY 4.0, simplified, no legal value); Taiwan's offshore wind potential sites from the Energy Administration's
  [potential sites dataset](https://data.gov.tw/dataset/36681) (Open Government Data License);
  Japan's promotion zones: 出典：[資源エネルギー庁ウェブサイト](https://www.enecho.meti.go.jp/category/saving_and_new/saiene/yojo_furyoku/kassei_sangyou.html)の促進区域指定の公告を加工して作成 (Public Data License PDL1.0);
  North Sea offshore wind areas (all simplified): Netherlands [Rijkswaterstaat, Aangewezen windgebieden](https://data.overheid.nl/en/dataset/46780-aangewezen-windgebieden-nwp) (CC0),
  Germany [Quelle: © BSH 2025 (Flächenentwicklungsplan 2025), vereinfacht](https://gdi.bsh.de/en/mapservice/Site-Development-Plan-in-the-German-Maritime-Area-2025-WFS) (GeoNutzV),
  Belgium [RBINS, Belgian Marine Data Centre: 2026 Belgian MSP – Energy, cable and pipeline zones](https://doi.org/10.24417/bmdc.be:dataset:3121) (CC BY 4.0),
  Denmark [Søfartsstyrelsen, Danmarks Havplan af 28. juni 2024](https://havplan.dk/) (CC BY 4.0),
  Scotland [Contains public sector information licensed under the Open Government Licence v3.0, from Crown Estate Scotland](https://www.arcgis.com/home/item.html?id=b9c7d514362f40ceb3fe299b47aeb8b3),
  Norway [Contains data under the Norwegian licence for Open Government data (NLOD) distributed by NVE](https://kart.nve.no/enterprise/rest/services/Mapservices/HavvindOnline/MapServer)
- Zoomed-in tiles: Esri World Imagery (Esri, Vantor, Earthstar Geographics) and Esri World Hillshade
  (Esri, USGS, NASA et al.), attributed on screen per Esri's terms
- Wind now: NOAA/NCEP Global Forecast System (GFS) 10 m wind (public domain), refreshed every 6 hours by a schedule
- Measured yearly output (the Output dialog and farm cards): U.S. Energy Information Administration Form EIA-923 and EIA-860M (public domain); Taiwan Power Company,
  generation of its own renewable stations and wind station list (data.gov.tw 17140 and 17141, Open Government Data License); Danish Energy Agency,
  [Energistyrelsen, Stamdataregister for vindkraftanlæg](https://ens.dk/analyser-og-statistik/data-oversigt-over-energisektoren) (Vinddata and Parkproduktion, retrieved October 2026; credited with the agency,
  the dataset and the retrieval date as the [agency's terms of use](https://dataforsyningen.dk/asset/PDF/rettigheder_vilkaar/Energistyrelsen%20-%20Vilk%C3%A5r%20for%20brug%20af%20data.pdf) require);
  [AEMO, MMS Data Model](https://nemweb.com.au/Data_Archive/Wholesale_Electricity/MMSDM/) (monthly DISPATCH_UNIT_SCADA and DUDETAIL; source: Australian Energy Market Operator,
  credited under [AEMO's copyright permissions](https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions))
- Farm photos: hand-checked Wikimedia Commons photos (`tools/farm_photos.py` → `tools/build_photos.py` → `data/global/photos.json`, each
  photo's author and licence shown on the card); other farms and summaries are looked up live from Wikipedia / Wikimedia Commons (per-image licences)
- Libraries: three.js r128 (MIT), Leaflet 1.9.4 (BSD-2)

Turbine counts, coordinates, and developer info are compiled from public sources; coordinates are
approximate.

## Developer & copyright

- Developed and maintained by **National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu** (國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室)
- Site code, design and text © 2026 Dof Lab; each dataset is used under the licence of its source
  listed above (Open Government Data License, CC BY 4.0, public domain, etc.).
- Found a data error or a better source? Please report it on [GitHub](https://github.com/dofliu/windfarmTaiwan/issues).
