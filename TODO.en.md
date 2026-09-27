# To do · TODO

English (this page) ｜ [中文](./TODO.md)

Concrete, actionable tasks. Background, the reasons behind decisions and the phased plan are in
[ROADMAP.en.md](./ROADMAP.en.md).

## In progress (hand-off, 2026-09-27)

Read this section first in a new session (see section 8 of CLAUDE.md); when you stop, rewrite it for the next piece of work in progress and move
finished items to the topic lists below.

### Foundation types, step 4 (Taiwan, Japan, Korea and the USA): research done, not yet in the table

- Research notes: `tools/research/foundations_step4.json`, 42 records (Taiwan 11, Japan 14, Korea 9, USA 8), each matching one farm in
  `wind_farms.json` by its exact name. Fields: `type` (mp monopile, jk jacket, pc high-rise pile cap, gb gravity-based, mixed, unknown),
  `suction_bucket`, `count` (number of foundations), `detail_en`, `sources` (sources with quoted passages), `issues` (status, year, capacity,
  location and other data problems) and `issue_sources` (the passages quoted in the issues).
  `check` is the result of `tools/check_quotes.py`: 186 of 189 sources and 103 of 107 issue quotes are OK; every failure is a US SEC page (it
  blocks automated requests with HTTP 403); apart from Vineyard Wind 1's commercial operation date (24 April 2026), those facts have other sources too. Use only OK sources; re-run with
  `python3 tools/check_quotes.py tools/research/foundations_step4.json` (it checks `sources` and `issue_sources`).
- Types found (36 farms; the other records are 2 duplicates and 4 with no source or not yet built):
  - Taiwan 11: monopile 3 (Formosa 1 Phases 1 and 2, Yunlin); piled jacket 7 (Taipower Offshore Phases 1 and 2, Formosa 2, Greater
    Changhua 1 & 2a, Changfang & Xidao, Zhong Neng, Hai Long); suction-bucket jacket 1 (Greater Changhua 2b & 4, all 66, with `sub='sb'`).
  - Japan 11: monopile 5 (Kamisu Phases 1 and 2, Noshiro Port, Akita Port, Nyuzen); jacket 2 (Ishikari Bay New Port, Kitakyushu
    Hibikinada); high-rise pile cap 2 (Setana, Sakata Port; NEDO calls them “dolphins”); gravity-based 2 (Choshi; the Kitakyushu
    demonstrator used a “hybrid gravity” base, a jacket on a concrete base slab).
  - Korea 6: piled jacket 3 (the two Woljeong test turbines, Tamra, Hanlim); monopile 2 (Jeonnam Offshore Wind 1, Yeonggwang Nakwol); the
    20 Southwest demonstration foundations are all jackets (19 piled, 1 on suction buckets; say so in the note).
  - USA 8: Block Island is on piled jackets; the CVOW pilot and commercial project, South Fork, Vineyard Wind 1, Revolution Wind, Empire
    Wind 1 and Sunrise Wind are on monopiles.
  - No source for the type, so list them in `EXCLUDED` with the reason: Eurus Akita Port in Japan (the 1 of its 6 turbines that stands in the
    water) and the 15 intertidal turbines of Yeonggwang Wind in Korea (GEM's “Yeonggwang Wind offshore”). GEM's 1 GW Hokkaido Ishikari Bay
    and Korea's Jwasari are not built yet; only their status changes.
- Japan's “semi-offshore”: JWPA lists Setana, Kamisu Phases 1 and 2 and the one Eurus Akita Port turbine, which can be reached from land, as
  semi-offshore (セミ洋上), outside its full-scale offshore figures. Each stands in the water on its own foundation (not on a breakwater),
  so this site keeps them offshore.
- Rules to add to `tools/farm_cleanup.py` (sources in the research notes' `issues`):
  - Taiwan: Zhong Neng's year 2024 → 2025 (electricity licence in April 2025); Taipower Offshore Phase 1 turbines HTW5.2-136 → HTW5.2-127.
  - Japan: GEM's “Kamis Offshore wind farm” is Kamisu Phases 1 and 2 together; remove it. Phase 1 is at Minamihama and Phase 2 at Kitahama,
    and both points are on land and the wrong way round (use the turbine positions from OpenStreetMap, marked approximate). Setana is out of
    service after breakdowns and ageing, and the town has decided to remove it in FY2027 (when it stopped is still to be checked); its point
    moves about 1 km south-west. The Kitakyushu demonstrator was removed in autumn 2019, not 2023. Kitakyushu Hibikinada began commercial
    operation on 2 March 2026 with 25 × 9.6 MW turbines (output capped at 220 MW); by convention it stays under construction with a note on
    its card. Eurus Akita Port's point is on the Akita Port offshore farm (it is actually on the Mukaihama coast). GEM's 1 GW Hokkaido
    Ishikari Bay is not under construction (only a planning-stage environmental document exists).
  - Korea: GEM's “Jeonnam (SK E&C) wind farm · 1” and “Jeonnam Shinan 1 / others” are the same farm (Jeonnam Offshore Wind 1, 96 MW,
    10 Siemens Gamesa 9.6 MW turbines, in commercial operation since 16 May 2025); fix its name, turbines and location too. Yeonggwang
    Nakwol was only partly running at the end of 2025 (full operation planned for December 2026), and its turbines are Vensys 5.7 MW.
    Woljeong's second turbine is an STX 2 MW (2011–12, not a 2015 Hyosung), idle since June 2016, and the Netherlands' RVO said in 2021 that
    the test site was not operating (current state to be checked). Tamra is in Hangyeong, not Hallim (name). GEM's Jwasari was still at the
    environmental-assessment stage in 2025 (now planned at 360 MW). Yeonggwang Wind's 15 turbines are in the intertidal zone, and GEM's point
    is the company's address.
  - USA: Sunrise Wind has two records (remove GEM's, whose point is actually inside Revolution Wind's lease; move the other to about 40.99,
    -71.06, the centre of BOEM's lease area, with year 2027). Vineyard Wind 1 had 44 of its 62 turbines running at the end of 2025 (about
    572 MW) and was completed in March 2026, so by convention it becomes under construction, year 2026, with a note. CVOW's commercial
    project now finishes at the end of 2027. Revolution Wind is 704 MW according to the developer; Empire Wind 1 is 810 MW.
- Next steps:
  1. Add the rows to `tools/farm_foundations.py` with `F4(...)` (`F4`, the build's `NOTE[4]` and the report's step-4 wording are ready).
  2. The clean-up rules above; rebuild the farm layer (step 3 of “Updating the global data” in the README) and run `qa_farms`,
     `coverage_report`, `qa_ports` and `build_foundations`.
  3. Site text: `fdStep` (both languages) and the sources dialog in `assets/js/globe.js`, and the “Foundation types” part of
     `assets/js/learn.js`, now saying that step 4 is done and that elsewhere, such as China and Vietnam, fixed-bottom farms show “type
     unknown”.
  4. v2.10.0, both changelogs, README/ROADMAP/TODO; Playwright at desktop and phone widths, the single-file copy online and offline; delete
     `tools/research/foundations_step4.json` once it is in the table.
- Watch (no data change yet): Hai Long (Northland says commercial operation in 2027, the developer says completion and grid connection by
  the end of 2026), Taipower Offshore Phase 2 (the Minister of Economic Affairs expects grid connection in the first half of 2027), Greater
  Changhua 2b & 4 (full commercial operation planned for late Q3 2026). Still to be checked: whether Formosa 1 Phase 1 has SWT-4.0-120 or
  -130 turbines; whether Choshi still runs after 2025; a possible Doosan 3 MW turbine on a suction bucket at Gunsan, Korea (2017; RVO lists
  it as a test turbine installed on land).
- Once step 4 is in the table, ask the owner whether to do step 5 (China and Vietnam, about 50–70 hours).

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
- [ ] Duplicate farm records: the US Sunrise Wind appears both as GEM's "Sunrise wind farm (United States)" and as "Sunrise Wind" from the 2026 compilation (both 924 MW, under construction); add a rule to `tools/farm_cleanup.py` in the next clean-up (found while compiling the ports data, Sep 2026)
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
- [ ] Step 4: Taiwan, Japan, Korea and the USA (research done, not yet in the table; see “In progress” at the top)
- [ ] Whether China and Vietnam are worth about 50–70 hours: ask the owner after the first four steps

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

- [ ] If development slows down and the 60-day inactivity rule becomes a risk, add a simple monthly
      keepalive workflow
- [ ] `wind_history_archive.json` keeps growing (about 1.8 MB now); keep an eye on repo size and
      archive or compress it periodically if needed

## Deferred — no need to research again (clear reasons in "Directions evaluated and deferred" in ROADMAP.en.md)

- Energy Administration monthly/annual statistics API (too coarse, overlaps existing data)
- Central Weather Administration buoy data (few buoys, most far from the farms, low benefit)
- Ministry of Environment offshore-wind ecological monitoring data (mostly unstructured PDFs, nothing
  machine-readable yet)
- Work-vessel status: live AIS positions and Taiwan International Ports Corporation port calls (the owner
  decided on 2026-09-27 not to do it)
