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
      needed (remove the ones fixed upstream). If a clean-up rule in `tools/farm_cleanup.py` no longer
      matches, the build stops and lists the rules: re-check each one, delete it if fixed upstream, or
      update the name if the record was renamed
- [x] Verify Pohjoinen wind farm in Finland: it is Norway's Sørfjord (same 99 MW, 2020, Fortum, identical
      coordinates); removed (Sep 2026)
- [ ] If stage-by-stage grid-connection figures become available for Taiwan's phased offshore farms
      (Hai Long 2 & 3, Greater Changhua 2b & 4, Taipower Offshore Phase 2), fill in the `ph` field
- [ ] After every rebuild of the farm data, run `tools/coverage_report.py` to refresh
      `docs/data-coverage.md` / `.en.md`
- [ ] Every quarter, rerun `tools/build_live_units.py` for the Australian/Canadian unit mapping
      (`data/live/units.json`) and check the "unmapped" list when new farms connect or units are renamed;
      the data currently lacks the Elaine and Yawong farms (Victoria, Australia) and Forty Mile Bow Island (Alberta)

## Data quality (from [docs/data-coverage.en.md](./docs/data-coverage.en.md), generated Sep 2026)

The phase-1 data clean-up was done in Sep 2026: after checking record by record, 77 records were removed
and 52 fixed. The reason and source for each are in [docs/data-cleanup.en.md](./docs/data-cleanup.en.md);
the rules are in `tools/farm_cleanup.py`.

- [x] The 9 "suspected duplicates A": done (only Japan's Enshu Kakegawa / Kakegawa is left to confirm)
- [x] The 12 countries whose farm sum was above 110% of the national figure: the Philippines (Pagudpud
      was completed in 2024–25 and IRENA may not count it yet) and Iran remain
- [x] Duplicates found while adding live data: Whitla (Alberta), Snowtown, Bluff Point (Tasmania) and
      Yambuk (Victoria)
- [x] Shared coordinate points: the map fans the farms out around the point and their cards say the
      position is schematic (`flags` 4)
- [ ] 135 shared coordinate points remain (1,338 operating farms, mostly province-centre placeholders in
      China): add real coordinates from a newer GEM release or local data
- [ ] Items the clean-up could not find or confirm: whether Iran's Tizbaad (99 MW) and Aqkand (50 MW) are
      operating (SATBA data); China's curated "CGN Taizhou 1" (300 MW; no CGN offshore project in Taizhou
      was found) and "Guoxin Sheyang H1" (300 MW; Sheyang H1 is Huaneng's), and GEM's Sheyang South H5
      (400 MW, possibly not yet operating); Vietnam's Song An (46.2 MW, no commissioning found); the
      repowering history of Kemi Ajos in Finland; why the Dominican Republic is about 50 MW below IRENA
- [ ] Farms missing from the data (found while checking): Hanuman 10 in Thailand (80 MW), Lạc Hòa 2
      (123.6 MW) and the other 105.5 MW of Chơ Long in Vietnam, Pantelimon in Romania (123 MW), Carreto in
      Colombia (9.6 MW, 2025)
- [ ] 11 "suspected duplicates B" remain (different names, same capacity, close by), e.g. Solano / Shiloh
      and Big Smile / Dempsey Ridge in the US, Dreiberg / Druiberg in Germany: confirm pair by pair
- [ ] 587 pipeline projects whose expected year has already passed (101 GW): update their status from a
      newer GEM release or the news
- [ ] 46 GW of operating farms have no commissioning year (mostly in China and India), so the map can
      only show them from 2025: add years where they can be found
- [ ] Large countries with low coverage (China 144 GW short, Germany 27 GW, India 15 GW): assess filling
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
- [ ] Live wind data from more countries (assessment in [docs/live-data-sources.en.md](./docs/live-data-sources.en.md)):
      Australia NEM, Alberta and Ontario were added in Sep 2026; the UK (estimates), the Dutch NED and ENTSO-E
      (free key, stored as a GitHub secret) are still to be decided
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
