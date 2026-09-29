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

## v2.12.3 — 2026-09-29

- Second batch of events (WIND-060 to 088) checked source by source: all 54 sources pass `tools/check_quotes.py`; verification status is now
  "press reports (quoted passages checked)", with Okinawa Electric, the Nordex statement, the Øyfjellet Wind notice and OSHA Taiwan as primary
  sources. Corrections from the check: the Rei dos Ventos incident was at park 3 (the link to park 1 in the farm layer is removed, date now
  2021-02-07); the Fenner turbine was an Enron 1.5 MW (predecessor of the GE 1.5); Ardrossan, Lemnhult, Santo Agostinho, Screggagh, Frontier II,
  Jiuquan and Wenchang now cite checkable sources and their summaries follow the source text; unverified figures removed (Jiuquan's 840 MW of lost
  output and the low-voltage ride-through explanation, 5–6 damaged turbines at Wenchang, 32 turbines stopped at Harvest II, the 56 cylinders,
  NT$300,000 fine and the dates of death at Hai Long); Delta 6 now at month precision; "no casualties" added for Taichung Port 2008, Hwasun 2025
  and Harvest II 2019. Event-to-farm links 75 → 74.



- Fix the phone layout of the Taiwan live dashboard: the two-column farm-card grid used `1fr`, whose minimum width follows the content, so below
  640 px the page was laid out about 514 px wide, part of the farm drawer sat off-screen and its close button could not be reached. Now
  `minmax(0,1fr)`; no horizontal overflow at 320–414 px.
- Full functional check (28 Sep 2026): all data checks and build scripts pass and the generated files match the repository; Playwright walked
  Home, the four Taiwan-live views, the 12 Learn chapters, every globe view / layer / tab / tour / deep link, phone width, and both single-file
  copies online and offline, finding no functional problem other than the one above.



- Events: 29 more incidents compiled from web searches (WIND-060 to 088, 88 events in total): Taipower Taichung Port in Typhoon Jangmi 2008,
  Soudelor 2015 (7 collapses) and Megi 2016; Miyakojima in Typhoon Maemi 2003, Awaji 2018; Hornslet 2008 overspeed, Ardrossan 2011 fire,
  Lemnhult 2015, Aldermyrberget 2020, Haltern AV9 2021 and Herkentrup 2025 collapses; Fenner 2009, Chatham-Kent 2018, Maverick 2022 and
  Frontier II 2025 collapses; Screggagh 2015; the Øyfjellet 2024 rotor fall and Odal 2024 blade loss; Hwasun Geumseongsan 2025; Delta 6 2019,
  Rei dos Ventos 2021 and Santo Agostinho 2023 in Brazil; the Harvest II and Juniper Canyon fires of 2019; the Jiuquan 2011 grid disconnection;
  Wenchang in Typhoon Yagi 2024; the Hai Long substation CO2 leak of 2024 (3 dead); the He Dreiht 2026 blade failure; the Desert Hot Springs
  2020 fatal fall. This batch was compiled where only search-result summaries could be read: each row says so in its verification status and
  the quoted passages are still to be checked with `tools/check_quotes.py` (see TODO).
- The Taipower Mailiao turbine fire (WIND-057) is now linked to Yunmai (Mailiao) in the farm layer (Taipower's only Mailiao farm, Vestas V80
  2 MW ×23), so clicking it flies to the farm and draws its turbines.
- Clicking an event with no coordinates and no linked farm now flies to its country (the camera used to stay put). Event-to-farm links went
  from 53 to 75.



- New Events layer and tab: 59 major events and incidents verified by hand on 28 Sep 2026 (36 milestones, 21 incidents / failures, 2 policy & society),
  each with a primary source from a regulator or the owner; an event appears once the timeline reaches its year, and 2026 events show at the latest year.
  The 34 with coordinates are marked on the globe (red = incident / failure, white = milestone, purple = policy & society), events without coordinates
  but linked to a farm are placed at the farm, and the rest appear only in the tab. The event card shows the summary, capacity basis, casualties
  (officially confirmed only), notes, related farms, sources and the photo page (URL and rights status only; nothing is reproduced); farm cards list
  their related events. Searchable, filterable by type, deep link `?ev=WIND-0xx`. Source `data/global/sources/events_2026-09.csv`;
  `tools/build_events.py` writes `data/global/events.json` and `docs/events*.md` (English titles, summaries and notes live in the build script;
  event-to-farm links are listed one by one and checked against the farm layer at build time).
- New public single-file "Global wind map" `standalone/windfarmTaiwan-globe.html` (`tools/build_globe_lite.py`): just the 3D globe with the
  onshore, offshore and pipeline layers, for the general public to download and open offline; no ports, foundations, events, milestone tour or live data.
  Download links added to the footer and the Sources dialog; the `build-standalone` workflow rebuilds it too.
- The full single-file copy now embeds the events data.

## v2.11.1 — 2026-09-27

- Foundations: CGN Rudong H8 added — mixed, 49 monopiles and 16 all-steel buckets (single buckets sunk by suction like the composite
  bucket, so filed under “composite bucket”). Sources are the owner's case-by-case review and CGN's foundation-monitoring contract; their
  quoted passages are still to be checked with `tools/check_quotes.py`. Operating offshore farms with a known type: 172 of 363 (43.6% of capacity).
- Xiangshui and Yangjiang Shapa phases 1–5 still have no as-built count per type (Shapa phase 1's figures appear only in a secondary article, and
  phases 2–5 only have provisional tender numbers), so they stay “type unknown”; the leads are in `tools/research/`.

## v2.11.0 — 2026-09-27

- Foundation step 5 (China and Vietnam) begins: from the owner's case-by-case review of 27 Sep 2026 (“Global offshore wind farm
  database, Asia review v2”), 4 Chinese farms are added — Donghai Bridge phase 1 (high-rise pile caps), CTG Rudong H6 (monopiles),
  CTG Rudong H10 (77 monopiles and 23 composite buckets) and Zhangpu Liu'ao phase 2 (four-pile jackets). Operating offshore farms
  with a known type go from 167 (42.3% of capacity) to 171 (43.3%).
- New “composite bucket” type (large steel buckets sunk into the seabed by suction, no piling), in the “other fixed-bottom” colour
  group; the map colours are unchanged (the colour-blind check was re-run with the same result).
- The sources are that compilation's first-hand documents (China Three Gorges, the Shanghai government); their quoted passages have
  not yet been checked with `tools/check_quotes.py`, which is recorded in TODO.
- Data corrections (6 record-level rules; see `docs/data-cleanup.en.md`):
  - Donghai Bridge phase 1: GEM's “Shanghai Donghai Bridge · 1” is the same farm as the curated record and is merged into it (its
    102 MW had been counted twice).
  - CTG Yangjiang Qingzhou 6 is 1,000 MW with 74 turbines, fully connected in December 2024 (it was listed as 500 MW); GEM's
    separate under-construction Qingzhou 6 record is merged into it.
  - The 202 MW Xiangshui nearshore farm belongs to China Three Gorges, not Longyuan (name and owner corrected).
  - Fuqing Xinghua Bay phase 2 is 280 MW with 45 turbines, fully connected in March 2021 (it was listed as 300 MW in 2020).
  - Hollandse Kust Zuid site 4 (Netherlands) has been operating since 2023 as part of Hollandse Kust Zuid III & IV; the duplicate
    record listing it as planned is removed.
- Site wording: the globe's foundation notes and sources dialog and the Learn chapter now say step 5 is under way.

## v2.10.2 — 2026-09-27

- Taiwan live page: farm names are in English in the English interface. Cards, the drawer and map popups use the full name
  (the project name for offshore farms, e.g. Greater Changhua 1 & 2a (Wo-1)); the farm grid, the ranking and the share image
  use a short name (e.g. Wo-1); grid connection points of one project carry the romanised Taipower unit name. The drawer
  subtitle still gives Taipower's unit name in Chinese.
- Notes that mention another grid connection point of the same project now use these short names in English too (e.g. 900 MW together with Wo-2).

## v2.10.1 — 2026-09-27

- Data correction: all 31 turbines at Zhong Neng were installed and grid-connected by August 2024, and commercial operation began
  with the electricity licence in April 2025; the allocated capacity is 300 MW and the installed capacity 31 × 9.5 MW = 294.5 MW.
  The Taiwan live page (which gave 2024 as the commercial-operation year; its timeline now adds April 2025) and the globe (which
  gave 298 MW; the card now notes the allocated and installed capacity) now agree.
- Fix: opening a shared link (or going back) while the globe's guided tour was running switched the card to the linked farm but
  left the tour bar in place, and “next” carried on with the tour; the tour now ends first, as it does when you click the globe,
  change the region or search.
- Taiwan live page: the timelines of all 30 farms (72 entries) now have English, shown when the site is in English; dates and
  figures match the Chinese (e.g. 628.88 億元 is written as NT$62.888 billion).
- Taiwan live page: farm notes, developer, site, turbine model, water depth, distance from shore, annual output and homes
  supplied, plus the group names and filter options for developers, now show in English in the English interface
  (82 values; annual output in GWh and homes as a count, e.g. 約 11 億度 → about 1,100 GWh). Filtering and grouping still
  match the original Chinese values.

## v2.10.0 — 2026-09-27

- Foundation data, step 4: Taiwan, Japan, Korea and the USA, 36 farms in all (11 in Taiwan, 11 in Japan, 6 in Korea and
  8 in the USA). Operating offshore farms with a known type go from 144 (38.2% of capacity) to 167 (42.3%):
  - All eight operating Taiwanese farms now have a type: 3 monopile (Formosa 1 phases 1 and 2, Yunlin) and 5 jacket.
    Greater Changhua 2b & 4, under construction, is the first farm in Taiwan founded entirely on suction-bucket jackets
    (66 of them, no piling); Hai Long and Taipower phase 2 use piled jackets.
  - Japan: 5 monopile (Kamisu phases 1 and 2, Noshiro Port, Akita Port, Nyuzen), 2 jacket (Ishikari Bay New Port,
    Kitakyushu Hibikinada), 2 gravity-based (Choshi; the Kitakyushu demonstrator used a “hybrid gravity” base of a jacket
    on a concrete slab) and 2 high-rise pile caps (Setana and Sakata Port, which NEDO calls “dolphins”).
  - Korea: 4 piled jackets (the Woljeong test site, Tamra, Hanlim and the Southwest demonstration) and 2 monopile
    (Jeonnam Offshore Wind 1, Yeonggwang Nakwol); one of the 20 jackets at the Southwest demonstration is a
    suction-bucket jacket by KEPCO's research institute, which the note explains.
  - USA: Block Island is on piled jackets and the other seven (the CVOW pilot and commercial project, South Fork,
    Vineyard Wind 1, Revolution Wind, Empire Wind and Sunrise Wind) are on monopiles.
  - Every farm cites a developer, construction contractor, government document or trade press, and each quoted passage was
    checked against the page (Japanese and Korean pages in their own encodings, PDFs page by page); 4C Offshore is never
    cited. Farms inside Japanese ports follow NEDO's classification of support structures (a “dolphin” is a high-rise
    pile cap).
  - Two farms whose type could not be found are listed as “checked but left out”, with the reason on their cards: Eurus
    Akita Port in Japan (the one turbine of six that stands in the water) and the 15 intertidal turbines of Yeonggwang
    Wind in Korea.
- Data corrections (24 record-level rules; reasons and sources in `docs/data-cleanup.en.md`):
  - Taiwan: Zhong Neng only reached full commercial operation with its electricity licence in April 2025 (it was listed as
    2024); the Taipower phase 1 turbines are Hitachi HTW5.2-127.
  - Japan: GEM's record bundling Kamisu phases 1 and 2 is removed; the points for Phase 1 (Minamihama) and Phase 2
    (Kitahama) were inland and the wrong way round, and now follow the turbine positions; Setana is out of service after
    breakdowns and will be removed in the 2027 financial year; the Kitakyushu demonstrator was removed in September 2019
    (it was listed as 2023); Kitakyushu Hibikinada started commercial operation on 2 March 2026 with 25 × 9.6 MW turbines
    (still listed as under construction, with a note, while the timeline ends in 2025); Eurus Akita Port moves to
    Mukaihama; and GEM's 1 GW Hokkaido Ishikari Bay project, which has only filed a planning-stage document, is no longer
    shown as under construction.
  - Korea: Jeonnam Offshore Wind 1 and GEM's “Jeonnam (SK E&C)” are the same farm, merged into one record with its name,
    turbines and location corrected; Yeonggwang Nakwol was only partly operating at the end of 2025 (full operation is
    planned for December 2026) and its turbines are Vensys 5.7 MW; the second unit at the Woljeong test site is an STX
    2 MW (2011–12, idle since June 2016); Tamra stands off Hangyeong; GEM's Jwasari is still at the EIA stage (360 MW);
    and Yeonggwang Wind is 34.5 MW.
  - USA: the two Sunrise Wind records are merged into one, at the centre of BOEM lease OCS-A 0487; Vineyard Wind 1 only
    had its last turbine installed in March 2026 (44 of 62 were operating at the end of 2025), so it is listed as under
    construction; the CVOW commercial project now finishes at the end of 2027; Revolution Wind is 704 MW; and Empire Wind
    is 810 MW.
- Site wording: the globe's foundation legend and sources dialog and the Learn chapter on foundation types now say step 4
  is done and that fixed-bottom farms elsewhere, such as in China and Vietnam, are shown as type unknown.

## v2.9.0 — 2026-09-27

- Foundation data, step 3: floating farms worldwide get their sub-type — spar, semi-submersible, barge or tension-leg platform
  (19 floating farms in the table, including retired and under-construction ones):
  - The 15 operating floating farms (260.8 MW): 5 spar, 5 semi-submersible, 3 barge and 1 tension-leg platform; Korea's
    Ulsan 750 kW pilot has no record of generating at sea, and its card says it is to be verified.
  - Every farm cites a technology provider, developer, government document or trade press, and each quoted passage was
    checked against the page (Chinese and Japanese pages in their own encodings); Fukushima's three demonstrators had
    different types, so its note lists each one.
  - Country profiles count floating farms by sub-type, and the legend's floating chip lists the four sub-types.
- Data corrections (20 record-level rules; reasons and sources in `docs/data-cleanup.en.md`):
  - EFGL and EolMed (France) only started generating in April–July 2026, and the Goto Offshore Wind Farm (Japan) began
    commercial operation in January 2026: the timeline on this site ends in 2025, so they are listed as under construction
    for now, with a note on their cards.
  - The TetraSpar demonstrator was decommissioned in summer 2026; Kincardine's 2 MW trial unit left in 2020, so it is 47.5 MW;
    Haiyou Guanlan is 7.25 MW; the Fukushima demonstrators are phased in 2013, 2015 and 2017.
  - 7 records removed: GEM's BiMEP test-site capacity, the never-built Dounreay Trì, Korea's Bandibuli (stopped by Equinor),
    and 4 duplicates (EFGL, EolMed, Golfe de Fos = Provence Grand Large, Kyushu).
  - Pipeline: Claveria (Philippines) and Timanfaya (Spain) are floating projects; projects in the Sep 2026 pipeline
    compilation that have since stopped are left out.
  - Also: Provence Grand Large has Siemens Gamesa turbines; WindFloat Atlantic's owners are corrected; WindFloat 1 is moved
    off Aguçadoura; Mingyang's OceanX and Tiancheng are one floater and now one record.

## v2.8.0 — 2026-09-27

- Foundation data, step 2: 41 more farms, so every operating offshore farm in Europe except one test site now has a known type
  (sub-types of floating farms come in step 3):
  - The Baltic (Germany, Denmark, Sweden, Finland), the Mediterranean (Italy) and the IJsselmeer (the Netherlands), plus UK,
    German and French farms finished after the OSPAR 2024 data.
  - Every farm cites a developer, construction contractor, trade press, government document or Wikipedia, and each quoted
    passage was checked against the page. Where OSPAR only has the consented design, a construction source is always added
    (Moray West, for example, was consented with jackets but built on monopiles).
  - Two new types in the “other fixed” colour group (the map colours are unchanged): cofferdam (a sheet-pile ring with a concrete
    base in shallow water near shore, e.g. Windplanblauw in the Netherlands) and rock-anchored (anchored to the bedrock of Lake
    Vänern in Sweden).
  - A farm that was checked but has no citable source (the Frederikshavn test site in Denmark) says why on its card.
- Data corrections (26 record-level rules; reasons and sources in `docs/data-cleanup.en.md`):
  - Status: Sofia (UK) and Calvados (France) were listed as operating in 2025 but are still under construction; Dogger Bank A
    now follows WindEurope's yearly grid-connection figures (2023–2025) and its owner is corrected; Arklow Bank (Ireland)
    stopped in 2024; the Hooksiel test turbine (2016), Utgrunden I (2018) and Irene Vorrink (2022) have been dismantled.
  - Capacity: Yeu-Noirmoutier (France) is 61 turbines, 488 MW; Bockstigen (Sweden) is 3.3 MW since its 2018 refit.
  - 8 records removed: three Norwegian demonstration areas that were licensed but never built, the METCentre test site's
    licensed capacity, and 4 duplicates (GEM's Sofia, Borssele V and Irene Vorrink records, and NOP Agrowind, which is on land).
  - Locations: 8 farms moved to where they are, including Sofia, Borkum Riffgrund 3, Hohe See, Windplanblauw (which was in the
    North Sea), Fryslân and Vänern; Långnabba on Åland is on land and is now onshore.

## v2.7.0 — 2026-09-27

- New “Offshore: foundations” layer on the globe (Show menu), colouring operating offshore farms by foundation type:
  - Monopile, steel frame (jacket, tripod, tripile), floating, and other fixed-bottom (gravity-based, high-rise pile cap,
    mixed); farms not yet checked are “type unknown”. The colours fold the types into four groups (three hues plus two
    neutrals, checked for colour-blind readers); farm cards and tooltips give the exact type.
  - The legend counts each group in scope and the share of capacity with a known type, and a click on a group shows only
    that group; country profiles get a capacity bar; the view can be shared (`layer=fd`).
- Foundation data, step 1: 99 farms in the North Sea and NE Atlantic within OSPAR (OSPAR Offshore Renewables 2024, CC0,
  matched one by one). Where OSPAR differs from what was built or gives no specific type (every German farm, the UK's
  Hornsea One and a few others), German Wikipedia or construction news is used, and every farm lists its sources; the
  farm-by-farm list is `docs/foundations.en.md`.
- Data clean-up: two duplicates found while matching OSPAR were removed (the whole-farm C-Power record in Belgium and a
  second Saint-Brieuc record in France placed about 170 km away).

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
