# To do · TODO

English (this page) ｜ [中文](./TODO.md)

Concrete, actionable tasks. Background, the reasons behind decisions and the phased plan are in
[ROADMAP.en.md](./ROADMAP.en.md).

## In progress (hand-off, 2026-09-27: project paused)

Read this section first in a new session (see section 8 of CLAUDE.md); when you stop, rewrite it for the next piece of work in progress and move
finished items to the topic lists below.

### Where things stand

- Since 27 Sep 2026 (v2.11.1) the project is paused: the main features are finished, the owner decided not to add new features, and the
  project is in maintenance (what is done: "Current status" in [ROADMAP.en.md](./ROADMAP.en.md)).
- The automatic updates keep running; the `keepalive` workflow re-enables the schedules every month so GitHub does not disable them after
  60 days without activity. Still **check once a month** that the data time and Actions look right (steps under "Maintenance" in
  [DEPLOY.en.md](./DEPLOY.en.md)): when fetching fails the site shows no error, only the last data it got.
- On 28 Sep 2026 (v2.12.0) the Events layer (59 major events and incidents from the owner's verified list) and the public
  single-file "Global wind map" (`standalone/windfarmTaiwan-globe.html`) were added; follow-ups are under "Major events & incidents" below.
- No code change was left half-done; below is the work to pick up, in order of priority.

### First things to do when work resumes (in order)

1. **Check the step-5 quotes**: the 5 Chinese foundation rows (the F5 rows in `tools/farm_foundations.py`) and 6 clean-up rules (the last
   block of `tools/farm_cleanup.py`) added in v2.11.0 / v2.11.1 from the owner's "Global offshore wind farm database, Asia review v2" cite
   China Three Gorges, Shanghai government and CGN pages whose quoted passages have not been checked with `tools/check_quotes.py` (the working
   environment could not reach those sites). Add the passages and run the check somewhere with network access; correct or withdraw any that fail.
2. **Upgrade GEM to the 2026-02 release** (requested by the owner on 27 Sep 2026): GEM 2026-02 is only published as a GeoJSON at
   `publicgemdata.nyc3.cdn.digitaloceanspaces.com` (wind/2026-02/wind_map_2026-02-05.geojson, per trackers/wind/config.js in GEM's maps repo),
   which the working environment's network policy blocked; GEM's GitHub repo only has the 2025-02 CSV. Steps: allow that host or have the owner
   download and upload the file → make `tools/build_farms.py` read the GeoJSON (mapping its fields to the 2025-02 CSV columns) → rebuild the
   farm layer (step 3 of "Updating the global data" in the README) → deal with every clean-up rule that no longer matches (`farm_cleanup.py`,
   `GEM_KEEP` and `PIPE_*` are written against 2025-02 names) → `qa_farms`, `coverage_report`, `qa_ports`, `build_foundations` → the version
   number and both changelogs (a new data-source release: MINOR).
   After the upgrade also check Korea's Donghae 1 (the owner's workbook, following GEM 2026, says under construction, 2030; this site says
   pre-construction, 2028) and Jwasari (under construction, 2031; this site says pre-construction).
3. **Checks that have fallen due**: Greater Changhua 2b & 4 (Wo-4 / Wo-Nan) was planned to be fully operating in Q3 2026, which has now
   passed; see "Re-check periodically" below.
4. **The rest of foundation step 5**:
   - Mixed farms still without per-type counts: Xiangshui and Yangjiang Shapa phases 1–5; farms that only say "fixed": Fuqing Xinghua Bay
     and Qingzhou 6. Leads are in `tools/research/cn_mixed_2026-09.json` (Shapa phase 1's 39 monopiles / 10 jackets / 3 + 3 suction buckets
     appear only in a secondary article and are unchecked; phases 2–5 only have provisional tender numbers); add them once a first-hand
     source is found (for example CTG completion records the owner may have).
   - The other Chinese offshore farms (160 of the 168 operating) and Vietnam (28 farms, mostly intertidal; the owner's workbook only says
     intertidal / nearshore, no sub-type) are still "type unknown".
   - Same route as the first four steps: research notes in `tools/research/` (a quoted passage for every source, checked with
     `python3 tools/check_quotes.py file.json`, using only OK results) → rows in `tools/farm_foundations.py` with `F5(...)` (the count of
     Chinese farms in the docs is computed) → data problems found on the way into `tools/farm_cleanup.py` → rebuild and checks → site text
     (`fdStep` and the sources dialog in `assets/js/globe.js`, `assets/js/learn.js`) → the version number and both changelogs → Playwright
     at desktop and phone widths, the single-file copy online and offline → delete the notes in `tools/research/` once they are in the table.
5. **Two Danish foundation types to verify**: this site follows OSPAR (DK23, DK04) and lists Nissum Bredning Vind and Rønland as
   gravity-based; the owner's workbook cites Boundary Layer, which says jackets with concrete transition pieces and piled concrete
   foundations. Boundary Layer is ODbL (share-alike), so use it only as a lead: find a developer or Danish Energy Agency source before
   changing anything.

## Major events & incidents (data/global/sources/events_2026-09.csv → tools/build_events.py, 2026-09-28)

- [ ] Adding an event: add a row to the CSV (same columns) → add the English title, summary, area and notes to `EN` in
      `tools/build_events.py` and any matching farm to `FARMS` (exact name from `wind_farms.json`) → `python3 tools/build_events.py` →
      version and both changelogs. The build checks that every event has English text and that farm names match.
- [ ] **Second batch (WIND-060 to 088, 29 incidents compiled from web searches on 2026-09-28): quoted passages still to be checked.** The
      environment could only read search-result summaries, not open pages, so each row's verification status says "checked against search-result
      summaries". In a connected environment open every source, copy a passage into a `tools/research/` JSON, run `python3 tools/check_quotes.py`,
      and rewrite or withdraw any row that does not check out; checked rows go back to "primary source" or "press report checked". Check the ones
      with casualties first: WIND-086 Hai Long CO2 (OSHA Taiwan page), WIND-088 Desert Hot Springs, WIND-080 Delta 6.
- [ ] 13 events not yet linked to a farm: WIND-001 Crotched Mountain, WIND-008 Kunimidake (the layer only has the 2027 project), WIND-010 and
      WIND-084 (grid-wide events), WIND-034 Ocean Wind 1/2 (cancelled), WIND-045 Rokewood (no official site name in the source), WIND-063
      Miyakojima 2003 (the layer's two records are a later batch from 2007/2008), WIND-064 the Awaji park turbine, WIND-065 Hornslet, WIND-068
      Haltern AV9 (the layer's Haltern Ennenberg is a different park), WIND-080 Delta 6, WIND-085 Wenchang (cannot confirm which record),
      WIND-088 (the reports do not name the farm). Add to `FARMS` when found; never guess.
- [ ] Events without coordinates: those linked to a farm are placed at the farm (the card says so), the rest appear only in the Events tab and
      clicking them flies to the country; add coordinates to the CSV only from a primary source (Miyakojima and Hornslet currently use approximate
      town positions, stated in the coordinate note).
- [ ] Photos are recorded as page URLs with their rights status only (the CSV says each needs the rights holder's permission); obtain
      permission before showing any of them on the site.
- [ ] Casualties and root causes are recorded only when officially confirmed: the Noshiro Port oil leak (WIND-031), the February Yeongdeok
      tower buckling (WIND-053), the Mailiao fire (WIND-057) and the Greater Changhua 4 fire (WIND-058) still await official findings; update the CSV when they are published.
- [ ] The timeline ends at 2025, so 2026 events show at the latest year; once `wind_global.json` extends past 2026 the `evShown` special case in `globe.js` can go.

## Re-check periodically (time-sensitive, not code problems)

- [ ] Taipower Offshore Phase 2: completion is currently given as "2027"; check progress reports then
      (or every quarter) and update the `FARMS` array in `assets/js/live.js` (`id:"offshore2"`) if needed
- [ ] Greater Changhua 2b & 4 (Ørsted, 920 MW): full commercial operation is planned for Q3 2026; check
      whether it happened on time and update `tl` (both languages) and `cod` of `id:"wo4"` / `id:"wonan"` (events list WIND-059: completion
      ceremony on 2026-09-01, the English notice says final commissioning is pending; WIND-050: the 2b export cable was damaged in 2025-08;
      WIND-058: one 14 MW unit of phase 4 caught fire on 2026-08-08)
- [ ] Hai Long (Hai Long B): full commercial operation may have slipped from 2026 to 2027; keep
      following the latest reports and update `id:"longB"`
- [ ] Left to verify from foundation step 4 (Sep 2026): when Setana stopped generating (the town decided in April 2026 to
      remove it in FY2027); whether Formosa 1 Phase 1 has SWT-4.0-120 or -130 turbines; whether Choshi still runs after
      2025; the present state of the Jeju Woljeong test site (its 2 MW unit has been idle since June 2016); and a possible
      Doosan 3 MW turbine on a suction bucket at Gunsan, Korea (2017; RVO lists it as a test turbine installed on land)
- [ ] Points that are still approximate (Sep 2026): Jeonnam Offshore Wind 1 (about 9 km north-west of Jaeun-do), the 15
      intertidal turbines of Yeonggwang Wind (GEM's point is the company address), Kamisu Phases 1 and 2 and Eurus Akita
      Port (moved to the turbine positions in OpenStreetMap), and Sunrise Wind (the centre of its BOEM lease area)
- [ ] When the timeline reaches 2026, update the status and year of each farm: Kitakyushu Hibikinada (operating from March
      2026), Yeonggwang Nakwol (planned for December 2026), Vineyard Wind 1 (completed March 2026, commercial operation
      April 2026 but below full capacity) and Revolution Wind (commercial operation expected during 2026); the CVOW
      commercial project, Sunrise Wind and Empire Wind are due in 2027
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
- [x] Duplicate farm records: the US Sunrise Wind appeared both as GEM's "Sunrise wind farm (United States)" and as "Sunrise Wind" from the 2026 compilation (both 924 MW, under construction); merged into one record in foundation step 4, at the centre of BOEM lease OCS-A 0487 (Sep 2026, v2.10.0)
- [x] Two Dutch duplicates (found while matching foundations): Borssele V and GEM's “Borssele Site V”, and Irene Vorrink and
      GEM's “Dronten”, were checked and merged (Sep 2026, v2.8.0)
- [ ] Dogger Bank pipeline projects: GEM's “Dogger Bank wind farm · D” (1,320 MW, pre-construction in GEM) now shows as under
      construction, expected 2027, with the note “first power 2025”. Those are the 2026 compilation's figures for Dogger Bank B,
      which was matched to phase D; check and fix it in the next pipeline update
- [ ] France's 2025 offshore capacity (1,500 MW in `wind_global.json`, the same as 2024) may be too low: the SDES Q2 2026 wind dashboard implies about 2.0 GW at end-2025; to be verified
- [ ] Offshore farm sums above the national series, to be verified: China's operating offshore farms add up to 58.9 GW against a 2025 national figure of 48.4 GW; Vietnam's 28 "offshore" farms (mostly intertidal) add up to 2.0 GW against 1.0 GW. Possibly farms counted at full capacity while still connecting in phases, or duplicates

## Ports data (data/global/ports.json, compiled by hand in Sep 2026)

- [x] Global farm search and filters, and the ports layer (55 ports in 15 countries, each with sources; checked by `tools/qa_ports.py`)
- [ ] Ports still missing (no citable source could be found in Sep 2026, so none was guessed):
      China (none yet, e.g. Rudong/Yangkou, Nantong/Qidong, Yangjiang, Shantou, Fuqing/Jiangyin, Penglai, Weihai, Dalian); Korea's Mokpo
      New Port, Ulsan and LS Cable's Donghae cable plant; the Philippines; in Europe Vlissingen, Den Helder, IJmuiden, Emden, Nordenham,
      Aalborg, Lindø/Odense, Brest, Port-la-Nouvelle, Fos-sur-Mer, Świnoujście, Gdańsk, Szczecin, Viana do Castelo, Taranto, Irish ports
      and Dundee
- [ ] Five US ports have sources but no checked quay coordinates yet, so they are left out: New Jersey Wind Port (finished 2024,
      never used), Long Beach Pier Wind (planned), Vineyard Haven (Vineyard Wind 1 O&M base), Quonset/Davisville (South Fork Wind
      O&M) and the Nexans Goose Creek cable plant
- [ ] Port status changes quickly (several US projects were halted or lost grants in 2025–26): re-check twice a year; mark ports
      whose role has ended as `former` (grey on the map) and run `tools/qa_ports.py` after editing
- [ ] Duplicate farm records found while compiling the ports, to handle in `tools/farm_cleanup.py` in the next clean-up: Poland's
      Baltica 2 (GEM's "Baltica II Offshore wind farm", 1,500 MW pre-construction, and "EW Baltica 2 Offshore wind farm", 210 MW
      under construction, at almost the same point; the real project is 1.5 GW and under construction). The UK's two Sofia
      records were merged in foundation step 2 (Sep 2026)

## Farm details

- [x] Farm details v1 (Sep 2026): standing within the country, a phase timeline, nearby farms and farms by the
      same developer, OpenStreetMap / Wikidata / Global Wind Atlas links, report a data error, copy link (details
      in group A of "What farm details could add" in ROADMAP.en.md)
- [ ] Same-developer matching relies on normalised owner names (`OWN_LEGAL` / `OWN_WEAK` / `OWN_PLACE` /
      `OWN_PREFIX` in `assets/js/globe.js`): GEM's owner field keeps only the first two owners, cut at 60
      characters, and group subsidiaries are spelled differently; when someone reports a missed or wrong match,
      add an alias to `OWN_PREFIX`
- [x] English for the farm timelines on the Taiwan live page (Sep 2026, v2.10.1): each `tl` entry in `assets/js/live.js`
      is [date, Chinese, status, English]; write both languages when adding or changing one
- [x] English for the farm notes and spec fields on the Taiwan live page (developer, site, turbine model, water depth,
      distance from shore, annual output, homes supplied; Sep 2026, v2.10.1): `ZH_EN` in `assets/js/live.js` maps each
      Chinese string to English; add the English when adding or changing a Chinese value
- [x] English farm names on the Taiwan live page in the English interface (Sep 2026, v2.10.2): `NAME_EN` in
      `assets/js/live.js` holds [full name, short name]; add both when adding a farm
- [ ] Farm details v2 (needs new data): estimated annual generation, links to national registers, turbine
      spec cards and so on — see group B of "What farm details could add" in ROADMAP.en.md

## Offshore foundation types (collected step by step, owner's decision of 2026-09-27; see item 2 of "Owner's new plans (Sep 2026)" in ROADMAP.en.md)

- [x] Step 1: Europe within OSPAR's coverage (North Sea and NE Atlantic): 99 farms — per-farm table `tools/farm_foundations.py`,
      checks and output by `tools/build_foundations.py`, and the globe's “Offshore: foundations” layer (Sep 2026, v2.7.0;
      farm-by-farm list in [docs/foundations.en.md](./docs/foundations.en.md))
- [x] Step 2: the rest of Europe (the Baltic, the Mediterranean, the IJsselmeer) plus farms finished after OSPAR 2024: 41 farms,
      each with a source whose quoted passage was checked; Hohe See and Belwind's Haliade demonstrator, left over from step 1,
      now have sources too; 26 more rules corrected farm records (Sep 2026, v2.8.0)
- [ ] The Frederikshavn test site in Denmark: the Danish Energy Agency says only one 2.3 MW turbine is left at sea after the
      harbour was extended, but not which one (the turbines had different foundations); once known, add it to the table and fix
      the capacity (still the 2003 figure of 3 turbines, 7.6 MW)
- [x] Step 3: floating farms: 19 get a sub-type, 15 of them operating; 20 more rules corrected the data (GEM's BiMEP test-site
      capacity was removed) (Sep 2026, v2.9.0)
- [ ] Floating units in China not yet in the data (their coordinates still need a source, never guessed): CSSC Haizhuang's Fuyao
      6.2 MW (2022, Luodousha off Zhanjiang, [National Energy Administration](http://www.nea.gov.cn/2022-06/24/c_1310631921.htm); running
      on a micro-grid; whether it reached the public grid is unverified) and Longyuan's Guoneng Gongxiang 4 MW three-column
      semi-submersible (grid-connected June 2024, off Nanri Island, Putian, Fujian; [China Daily](https://fj.chinadaily.com.cn/a/202406/28/WS667e79dba3107cd55d269125.html),
      [SASAC](http://www.sasac.gov.cn/n2588025/n2588124/c33362365/content.html)); CTG's Sanxia Linghang 16 MW semi-submersible (Yangjiang,
      [Xinhua](https://www.news.cn/tech/20260503/76ea04db45f242819a7f2b39dc191b94/c.html)) and CNOOC's Haiyou Anlan 16 MW tension-leg
      platform (Lufeng oilfield, [Xinhua](https://www.news.cn/tech/20260806/18f047cf51d840c489e283b9d1669742/c.html)), which only
      started in 2026, wait for the timeline to reach 2026
- [ ] Possible double counts, to be verified: Mingyang's OceanX (16.6 MW) sits in the Qingzhou IV farm (500 MW, whose card says
      "incl. OceanX"), and Sanxia Yinling (5.5 MW) in Shapa III (400 MW); no source says whether the big farms' capacities include them
- [ ] Korea's Ulsan 750 kW floating pilot: in November 2019 it was still not installed because permits were withheld, and there is no
      record of it generating at sea afterwards; remove it once it is confirmed that it never operated
- [ ] The UK's Pentland floating farm has two GEM records ("Pentland Floating Offshore wind farm" and "Pentland wind farm", both
      100 MW); whether they are the same project is still to be checked
- [x] Step 4: Taiwan, Japan, Korea and the USA: 36 farms (Sep 2026, v2.10.0)
- [ ] Step 5: China and Vietnam (the owner decided on 2026-09-27 to keep collecting step by step): 5 Chinese farms added (v2.11.0, v2.11.1); the rest is item 4 of "First things to do" at the top

## To assess / waiting for the owner's decision (do not start on your own)

- [ ] Extend the timeline to "2026 (latest available)": 8 countries have official 2026 figures, the others carry 2025 forward, clearly marked; start once the approach is agreed (see item 1 of "Owner's new plans (Sep 2026)" in ROADMAP.en.md)
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

- [x] Monthly keepalive workflow (`.github/workflows/keepalive.yml`, Sep 2026): re-enables the schedules through the GitHub API on the
      1st of each month so they are not disabled after 60 days without activity
- [ ] Check once a month that the data time and Actions look right, and trigger a run by hand if needed (steps under "Maintenance" in DEPLOY.en.md)
- [ ] `wind_history_archive.json` keeps growing (about 3.2 MB in Sep 2026); keep an eye on repo size and
      archive or compress it periodically if needed

## Deferred — no need to research again (clear reasons in "Directions evaluated and deferred" in ROADMAP.en.md)

- Energy Administration monthly/annual statistics API (too coarse, overlaps existing data)
- Central Weather Administration buoy data (few buoys, most far from the farms, low benefit)
- Ministry of Environment offshore-wind ecological monitoring data (mostly unstructured PDFs, nothing
  machine-readable yet)
- Work-vessel status: live AIS positions and Taiwan International Ports Corporation port calls (the owner
  decided on 2026-09-27 not to do it)
