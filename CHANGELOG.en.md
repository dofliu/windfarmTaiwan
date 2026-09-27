# Changelog

English (this page) ｜ [中文](./CHANGELOG.md)

The site uses semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: a full redesign.
- **MINOR**: new features, pages, layers or data sources.
- **PATCH**: fixes, wording, small display changes and data corrections.

The current version is `WW.VERSION` in `assets/js/core.js`. It appears in the site footer, in "About this site" under the
Learn section's "Sources & method" chapter, and in the globe's attribution line and sources dialog. Clicking the version
number opens this page.

Dates are Taiwan time (UTC+8). Scheduled live-data updates and the bot's single-file rebuilds do not get version numbers.
Version numbers before v2.6.1 were assigned on 2026-09-27 from the GitHub merge history.

## v2.6.1 — 2026-09-27

- Globe: zoomed in, every farm is still drawn as a single turbine; nearby farms are no longer turned into groups of
  turbines automatically. A farm draws all of its turbines, from its unit count and spacing, only when you click it
  (or when the tour stops at it). A pipeline project you click shows its planned layout as translucent turbines.
  Small farms near the centre of the view now get name labels when zoomed in.
- Added a site version number and this changelog. The version appears in the footer, "About this site", and the
  globe's attribution line and sources dialog.
- Planning docs: the work-vessel status idea is dropped (owner's decision). Offshore foundation types will be
  collected step by step, starting with Europe (OSPAR).

## v2.6.0 — 2026-09-27 · [#20](https://github.com/dofliu/windfarmTaiwan/pull/20)

- Global farm search and filters: search about 23,000 farms by name, Chinese name, developer, turbine model or
  country, and filter by status, type, size and year. While any condition is set the map draws only the matching
  farms, and the conditions go into the URL so the view can be shared.
- Ports layer: 55 offshore wind ports in 15 countries, compiled by hand in Sep 2026 with sources for each port.
  Ports have cards, a Ports tab and a `port=` deep link, and `tools/qa_ports.py` checks the data.
- Fixed Australia's bounding box, which was a single point.
- ROADMAP records the owner's Sep 2026 plans: extending the timeline to 2026, a foundation-type layer, work-vessel
  status and ports.

## v2.5.0 — 2026-09-26 · [#19](https://github.com/dofliu/windfarmTaiwan/pull/19)

- Farm card details v1:
  - Standing within the country: capacity rank and share of national installed wind capacity at the timeline year.
  - A phase timeline.
  - Nearby farms (within 30 km) and other farms by the same developer, clickable to switch.
  - Links to OpenStreetMap, the Global Wind Atlas and Wikidata.
  - "Copy link to this farm" and "Report a data error".

## v2.4.1 — 2026-09-26 · [#18](https://github.com/dofliu/windfarmTaiwan/pull/18)

- The data scraper runs every 2 hours instead of every 15 minutes.
- Today's generation estimate tolerates longer gaps in the data, and Australian and Canadian live values stay on the
  farms for up to 6 hours.

## v2.4.0 — 2026-09-26 · [#17](https://github.com/dofliu/windfarmTaiwan/pull/17)

- Phase-1 farm data clean-up: 129 record-level rules, each with bilingual reasons and a source, written to
  `docs/data-cleanup.en.md`.
  - 77 records removed: duplicates, and farms that were never built or do not exist.
  - 52 records fixed: location, capacity, year, phases or status.
- Farms that share one placeholder point are fanned out on the map and labelled as such.

## v2.3.0 — 2026-09-26 · [#16](https://github.com/dofliu/windfarmTaiwan/pull/16)

- Live farm output for Australia (AEMO) and for Alberta (AESO) and Ontario (IESO) in Canada, shown on the globe's
  farms and in the country profiles.
- Units are matched to farms by hand, and unmatched units only count toward the grid total.

## v2.2.0 — 2026-09-26 · [#15](https://github.com/dofliu/windfarmTaiwan/pull/15)

- A single-file HTML edition: it opens offline and fetches the latest live data when online.
- Developer and copyright credit.
- A farm-level data coverage report by country (`docs/data-coverage.en.md`) and an assessment of live wind data
  outside Taiwan (`docs/live-data-sources.en.md`).
- Every document in both Chinese and English.

## v2.1.0 — 2026-09-26 · [#14](https://github.com/dofliu/windfarmTaiwan/pull/14)

- Merged the two other, parallel versions of the global map:
  - National figures for Taiwan (Energy Administration handbook, table 3-6) and Japan (JWPA) now come from official
    statistics, and both countries' farms were audited one by one.
  - Pipeline projects: 177 projects compiled in Sep 2026 update GEM's Feb 2025 pipeline, alongside GEM's Feb 2026
    country totals and a new Pipeline tab.
  - Japan gained 100 small farms, and 22 misplaced coordinates were corrected.
- Fixed the globe's auto-rotate.

## v2.0.0 — 2026-09-26 · [#13](https://github.com/dofliu/windfarmTaiwan/pull/13)

- Redesigned as a four-page static site (Home, Taiwan live, Global, Learn), fully bilingual. Every existing Taiwan
  live feature was carried over.
- Global: a 3D globe that replays each country's year-end cumulative capacity from 1980 to 2025. It draws about
  15,000 operating farms and about 7,800 pipeline projects (GEM, Feb 2025), with relief and satellite basemaps,
  country profiles, a guided tour and deep links.
- Learn: 12 chapters.

## v1 (2026-06-29 – 2026-07-21) · [#1](https://github.com/dofliu/windfarmTaiwan/pull/1)–[#12](https://github.com/dofliu/windfarmTaiwan/pull/12)

The Taiwan live wind monitor, before version numbers were kept:

- 2026-06-29: launched on GitHub Pages, with GitHub Actions fetching Taipower open data on a schedule. It had live
  output, spinning-turbine cards, impact figures, policy-target progress and a myths Q&A.
- 2026-07-11 – 07-12:
  - A farm overview.
  - Wind speed from each farm's nearest weather station (CWA).
  - A 7-day history and chart tabs.
  - An English version and a shareable live card.
- 2026-07-14 – 07-15 (#1–#10):
  - Gaps in the history backfilled from official dataset 37331, with long-term trend charts.
  - The live power supply and demand report built in.
  - A data-time badge on share cards.
  - Development timelines for 15 offshore farms.
  - English documentation.
- 2026-07-21 (#11–#12): the dashboard opens on the farm cards, and the toolbar starts collapsed.
