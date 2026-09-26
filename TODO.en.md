# To do · TODO

English (this page) ｜ [中文](./TODO.md)

Concrete, actionable tasks. Background, the reasons behind decisions and the phased plan are in
[ROADMAP.en.md](./ROADMAP.en.md).

## Re-check periodically (time-sensitive, not code problems)

- [ ] Taipower Offshore Phase 2: completion is currently given as "2027"; check progress reports then
      (or every quarter) and update the `FARMS` array in `assets/js/live.js` (`id:"offshore2"`) if needed
- [ ] Greater Changhua 2b & 4 (Ørsted, 920 MW): full commercial operation is planned for Q3 2026; check
      whether it happened on time and update `tl` and `cod` of `id:"wo4"` / `id:"wonan"`
- [ ] Hai Long (Hai Long B): full commercial operation may have slipped from 2026 to 2027; keep
      following the latest reports and update `id:"longB"`
- [ ] Once a quarter, run the `backfill-taipower-wind-history` workflow as a dry run to see whether
      dataset 37331 has moved to a more recent quarter (if the publisher improves timeliness, the
      7-day backfill logic is already in place and takes effect automatically)

## Global data (once a year; see "Updating the global data" in the README)

- [ ] After IRENA's *Renewable Capacity Statistics* (around March) and the GWEC / WFO annual reports
      (around spring) come out, update country capacity by year (`data/global/wind_global.json`) and
      spot-check the top ten countries against official statistics (China NEA, US EIA, Germany BNetzA, …)
- [ ] When a new Energy Statistics Handbook (Table 3-6, renewable generating capacity) is published,
      update `TWN_OFFICIAL` in `tools/extract_global_data.py`; when JWPA publishes its year-end
      cumulative capacity (around February), update `JPN_JWPA`; then rerun the extraction script
- [ ] The curated pipeline projects (`data/global/sources/pipeline_curated.json`, compiled Sep 2026)
      change quickly: check Taiwan's round-3 zonal projects (Fengmiao, Formosa 4 / 6, Haiding 1, DeShuai,
      YouDe, Greater Changhua Northeast) every quarter
- [ ] When GEM publishes a new public Global Wind Power Tracker file, rerun `tools/build_farms.py` and
      then `tools/qa_farms.py` to check coordinates; check whether the `COORD_FIX` corrections are still
      needed (remove the ones fixed upstream)
- [ ] Verify the location of Pohjoinen wind farm in Finland (99 MW, 2020, Fortum): GEM's coordinates
      68.04, 16.66 fall in Norway
- [ ] If stage-by-stage grid-connection figures become available for Taiwan's phased offshore farms
      (Hai Long 2 & 3, Greater Changhua 2b & 4, Taipower Offshore Phase 2), fill in the `ph` field
- [ ] After every rebuild of the farm data, run `tools/coverage_report.py` to refresh
      `docs/data-coverage.md` / `.en.md`

## Data quality (from [docs/data-coverage.en.md](./docs/data-coverage.en.md), generated Sep 2026)

- [ ] Resolve the 9 "suspected duplicates A" (different sources, same or similar name): confirm each
      pair and drop the duplicate in `tools/build_farms.py` — e.g. Kenya's Lake Turkana (one record from
      GPPD and one curated, 310 MW counted twice), Jiangsu Binhai North H1 / H2, Dafeng H5 / H7,
      Denmark's Vesterhav Nord, Japan's Kakegawa
- [ ] Review the 12 countries whose farm sum is above 110% of the national figure: Colombia, Kenya,
      Romania, the Philippines, Thailand, Norway, Iran, Senegal, the Dominican Republic, Vietnam, Jordan,
      Uruguay. Known causes: Norway's Fosen aggregate record sits next to its component farms (Storheia,
      Roan); five GEM farms in Romania share the country-centre coordinates; Pagudpud and Balaoi &
      Caunayan in the Philippines look like the same farm
- [ ] 137 shared coordinate points (1,357 operating farms stacked on one point each, mostly
      province-centre placeholders, mainly in China): update from a newer GEM release or local data
- [ ] 588 pipeline projects whose expected year has already passed (102 GW): update their status from a
      newer GEM release or the news
- [ ] 49 GW of operating farms have no commissioning year (mostly in China and India), so the map can
      only show them from 2025: add years where they can be found
- [ ] Large countries with low coverage (China 127 GW short, Germany 27 GW, India 15 GW): assess filling
      the gap from national registries (see phase 1 in the ROADMAP)

## To assess / waiting for the owner's decision (do not start on your own)

- [ ] Whether to give `grid_status` (supply/demand) a long-term archive and trend chart, following the
      wind data's "live → 7 days → 90 days" layers
- [ ] Whether to expand to all energy sources (genary already contains hydro, solar, thermal and
      nuclear units; the scraper currently keeps only the wind rows) — a major decision about the site's
      scope; confirm the direction before any work
- [ ] Whether to try to get past the WAF 403 on the live supply/demand source (needs a different
      execution environment, e.g. a self-hosted runner or a non-cloud-CI host; changing code alone
      cannot fix it)
- [ ] Whether to add live wind data from other countries (assessment in
      [docs/live-data-sources.en.md](./docs/live-data-sources.en.md)): some sources need a free API key
      (stored as a GitHub secret), so decide which countries first
- [ ] The priority order of the phases under "Next steps" in the ROADMAP

## Operations

- [ ] If development slows down and the 60-day inactivity rule becomes a risk, add a simple monthly
      keepalive workflow
- [ ] `wind_history_archive.json` keeps growing (about 1.8 MB now); keep an eye on repo size and
      archive or compress it periodically if needed

## Deferred — no need to research again (clear reasons in "Directions evaluated and deferred" in ROADMAP.en.md)

- Energy Administration monthly/annual statistics API (too coarse, overlaps existing data)
- Central Weather Administration buoy data (few buoys, most far from the farms, low benefit)
- Ministry of Environment offshore-wind ecological monitoring data (mostly unstructured PDFs, nothing
  machine-readable yet)
