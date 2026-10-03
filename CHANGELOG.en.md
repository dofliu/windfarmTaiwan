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

## v2.17.3 — 2026-10-03

- Three onshore farms that the build had merged away are restored: **Gansu Minqin Hongshagang No. 1** (CGN, 400 MW), **Yeongyang (Hanwha)**
  (76 MW, 22 turbines of the 3.45 MW class, finished in 2020; GEM says 2017) and **Yeongyang No. 2** (GS E&R and Korea Midland Power, 42 MW, 10 turbines
  of the 4.2 MW class, commercial operation from May 2023; GEM says 2022). All three are in `GEM_KEEP`, with quotes verified by `check_quotes.py`;
  South Korea's farm-level coverage rises from 63% to 67%.
- The build gains a check: when a GEM record was merged into a curated record that a clean-up rule later removes, the build stops until the record
  is listed in `GEM_KEEP` (kept) or the new `ORPHAN_OK` (confirmed to be covered by another record: Sheyang South H1, Cangnan 1, the Mori area total),
  so no farm can silently vanish again; CLAUDE.md describes the rule.

## v2.17.2 — 2026-10-03

- Three offshore farms restored. **CTG Pingtan Waihai** (111 MW, eleven 8–16 MW test turbines, fully connected September 2023, jackets on suction
  buckets) and **GCL Rudong H13** (150 MW, 30 Haizhuang 5 MW turbines, November 2021, monopiles) were already in GEM, but the build merged them into
  other curated records and they vanished; they are now in `GEM_KEEP`, with clean-up rules filling their fields. **Guoneng Gongxiang** (the Nanri Island
  floating wind-and-fish-farming platform, a 4 MW three-column semi-submersible, June 2024) is added as a curated record at an approximate location.
  All three carry a foundation type; Pingtan Waihai and Guoneng Gongxiang also get water depth and rotor diameter.
- Third round of dimension research: 17 farms gain values, including the two restored ones (hub height +10, depth +5, rotor diameter +5); 229 of the 236 operating offshore farms now have at
  least one value (hub height 166, all three 159). Every quote is verified with `check_quotes.py`; consent limits, EIA design values, phase-only and
  conflicting figures are not used.

## v2.17.1 — 2026-10-03

- Data corrections: 12 turbine-field errors found while researching farm dimensions are written as clean-up rules (quotes verified with
  `check_quotes.py`). China: Dongtai IV becomes 63 Shanghai Electric SWT-4.0-130 plus 12 Envision EN136-4.2, Huaneng Dafeng phase I becomes 48 Envision
  EN136-4.2 plus 20 Haizhuang H151-5.0 (owner Huaneng Renewables), Sheyang South H1 becomes 67 Envision EN148-4.5, and “Longyuan Dafeng H3 (Huaneng
  Dafeng)” is renamed SPIC Dafeng H3 (72 Envision EN136-4.2). Vietnam: Hoa Binh 1 phases 1–2 and Hoa Binh 2 become Vestas V150-4.2, Tan Thuan Siemens
  Gamesa SG 5.0-145, Tra Vinh V1-2 Goldwind GW155-4.5, V1-3 Vestas V150-4.2, Tra Vinh Dong Hai 1 SG 5.0-145, and Thanh Hai No. 5 gains its 28 turbines
  and the SG 4.5-145 of phases 1–2.

## v2.17.0 — 2026-10-03

- Offshore farms gain three new fields, **water depth, hub height (or tower height) and rotor diameter**: a farm-by-farm table in
  `tools/farm_dimensions.py` (two rounds, thirteen sub-agents, every quoted passage verified with `check_quotes.py`; where a source gives only tip height and rotor diameter, the hub height is derived from both and says so), merged at build time into
  `foundations.json` and `docs/foundations*.md` (three new columns). Of the 233 operating offshore farms with a known foundation type, 226 now have at
  least one value (depth 204, hub height 156, rotor diameter 211; all three 149); unknown values stay blank, never filled with typical values.
- The farm card's cross-section is now drawn to scale from these values (metres to pixels, with depth, hub height and rotor diameter labelled;
  missing quantities use schematic placeholders and say so), the card gains a "water depth · hub height · rotor diameter" line with its source, and
  the close-up turbines use the real hub-to-rotor ratio. A source that only gives a maximum depth shows as "≤ 35 m".
- The data inventory in the sources dialog counts farms with dimension data.

## v2.16.1 — 2026-10-03

- Data corrections: the 72 anomalies in Chinese and Vietnamese offshore farm records noted during the step-5 sweep were re-checked one by one
  (five sub-agents in parallel, every quoted passage verified with `check_quotes.py`) and written as 70 clean-up rules: 4 records that are not
  offshore wind farms or do not exist were removed (the Guohua Kenli offshore solar plant, the Guangdong coastal test base and Dongying Dongfang test
  pad, Guodian Rudong H1), 14 duplicates merged (the Peninsula South U aggregate and U2, Peninsula South 4 and V, Dafeng H11 and H10, Dongtai V,
  Rudong H1-2, Shibeishan, Taizhou 1, Xiapu A, Pingtan Waihai, Guoxin Sheyang H1, Xinshun) and 52 records corrected in capacity, year, owner,
  turbines or status — for example Peninsula South U1 becomes SPIC's 900 MW, Bozhong B becomes Shandong Energy's, the Zhuanghe II/III owners are
  swapped back, Qidong H3 becomes Jiangsu Huawei's, Shantou Lemen is rewritten as Huaneng Lemen (II) 594 MW, Xuwen East 3, Yuetuo Island, Xiangyun
  Island and Bac Lieu 3 go back to under construction, Danzhou CZ3 and Shenquan I get phases, Rudong H3 becomes 400 MW and Tianjin Nangang 2018.
  The share of operating offshore capacity with a known foundation type rises from 66.5% to 71.0%.
- Items still open (status of CGN Xiangshan Tuci, CTG Pingtan Waihai 111 MW and GCL Rudong H13 to be added, the capacity of Shandong Bohai B1 and
  others) are listed under item 4 of the TODO.

## v2.16.0 — 2026-10-02

- The Learn section gains chapter 7, "Standing in the sea: foundation types": bilingual text on fixed foundations (monopile, jacket, tripod, tripile,
  gravity base, high-rise pile cap, suction bucket), the transition piece and floating platforms (spar, semi-submersible, barge, tension-leg), with a
  schematic gallery of 11 types (drawn by the same code as the globe's farm card), a share chart of operating offshore farms by foundation group
  (farms and capacity) and a stacked chart of offshore capacity added worldwide each year by type, both computed live from the site's data, plus a
  link to the globe's Foundations layer. Former chapters 7–12 become 8–13; cross-references and the "12 chapters" wording are updated everywhere.
- Globe: selecting a port now draws light-blue arcs from the quay to every farm in the card's "wind farms served" list that matches the farm data
  (arc height follows distance; redrawn in globe and flat mode), removed when the card closes; the port card notes this.
- The cross-section drawing moved to `core.js` (`WW.fdDraw`, `WW.fdTurbine`), shared by the farm card and the Learn page.

## v2.15.0 — 2026-10-02

- The foundation block of the globe's Overview tab gains a stacked bar chart "Offshore capacity added per year (by foundation type)": from the
  commissioning year of the first offshore farm in scope to the year on the timeline, each year stacked into monopile, steel frame, floating,
  other fixed and type unknown; phased farms count by phase and decommissioned farms still count in their year. Hovering a bar lists that year's
  capacity by group, and the timeline year is outlined in gold. Available for the world, each continent and each country, recomputed as the
  timeline moves.

## v2.14.0 — 2026-10-02

- Close-up turbines on the globe now carry a base drawn to the farm's foundation type: monopile, jacket, tripod, tripile, gravity base,
  high-rise pile cap, caisson/bucket and rock anchor, with floating farms split into spar, semi-submersible, barge and tension-leg; steel is
  grey, concrete off-white, floating hulls white and the transition piece above the waterline always yellow. Mixed farms distribute the types
  across the turbine positions by count; farms without a known type look as before.
- The farm card's foundation block gains a schematic cross-section (sea level, seabed, turbine and foundation; mixed farms show up to three
  types side by side with counts), bilingual and marked as not to scale.

## v2.13.6 — 2026-10-02

- The globe's "Data sources & notes" dialog gains a "Data inventory" block computed live from the loaded data: farm records by status and type with
  operating capacity, the number of countries and year range of the national statistics, the offshore farms with a known foundation type and their
  share of capacity, port and event counts, and the live-output sources; nothing is hard-coded, so it follows the data.

## v2.13.5 — 2026-10-01

- Foundation step 5, full sweep: every operating offshore farm still without a type (143 in China, 27 in Vietnam, 4 early European pilots) was
  researched in nine groups by sub-agents and every quoted passage re-checked with `check_quotes.py`; only farms whose construction or completion
  records name the type were written in, 51 in all — 34 in China (e.g. Huizhou Gangkou I & II 104 jackets, Guoxin Dafeng 100 monopiles, Bozhong A
  60 monopiles, Nanpeng Island 41 jackets + 32 monopiles, CTG Shapa 2 and Guangdong Energy Shaba all jacket types, Changle Waihai A 37 jackets,
  Haitan Strait 46 rock-socketed pile caps, Jinwan 55 monopiles, Shengsi 5/6 45 pile caps, Putuo 6 63 pile caps, Donghai Bridge II and Lingang
  phase 1 pile caps, Binhai North H1 and Binhai South H3 monopiles, Jiaxing 1 37 caps + 37 monopiles, Daishan 4 54 caps, Zhuanghe V
  monopile-friction-bucket, Zhuanghe IV-1 monopiles), 13 in Vietnam (mostly prestressed-concrete pile caps; Ben Tre Binh Dai 1 and Tra Vinh V1-2
  on monopiles) and 4 in Europe (Vindeby gravity base, Beatrice demonstrator jackets, Lely and Yttre Stengrund monopiles, all decommissioned).
  The share of operating offshore capacity worldwide with a known type rises from 53.3% to 66.5% (235 of 351 farms); 58 of China's 160 and 13 of
  Vietnam's 24 operating offshore farms are now classified.
- Data corrections (13 rules): duplicate records of Huaneng Cangnan 2, Guangxi Fangchenggang A, Zhuanghe IV-1, Putuo 6, Changyi Laizhou Bay,
  Xuwen, the two Ben Tre No. 5 phases and VPL Ben Tre merged; Zhuanghe V corrected to 250 MW and renamed; Sheyang South H5 back to under
  construction (its monopiles were only started in April 2026); Lingang phase 1 corrected to 2019 and 25 × 4 MW; Ben Tre No. 5's owner corrected
  to Tan Hoan Cau Ben Tre, 120 MW.
- Types known only from tenders or EIAs, farms with only one bid section found, mixed farms without per-type counts, and the data anomalies found
  on the way (overlapping Peninsula South U records, Yuetuo and Xiangyun islands still under construction, no completion record for Xiapu A or
  "CGN Taizhou 1", several wrong owners and years) are listed in TODO, with the quotes kept in `tools/research/cn_vn_step5e_2026-10.json`.

## v2.13.4 — 2026-10-01

- Foundation step 5 (China), fourth batch: 5 farms added, every quoted passage checked with `check_quotes.py` — Huaneng Peninsula North L (42 four-pile
  jackets in 52–56 m of water; SASAC, People's Daily), Shandong Haiwei Peninsula South U (53 monopiles; Longyuan Zhenhua via Century New Energy),
  Huaneng Cangnan 2 (36 monopiles; Beijing News, CPEM), Huaneng Lingao CZ1 (60 monopiles; China Power) and Guodian Xiangshan 1 (phase 1: 23 pile
  caps + 18 monopiles; phase 2: 36 monopiles + 160 group piles, i.e. 20 pile caps; China Energy, Xiangshan government). 24 of China's 167 operating
  offshore farms are now classified, and the share of operating offshore capacity worldwide with a known type rises from 50.1% to 53.3%.
- Data corrections: Huaneng Peninsula North L (504 MW) was fully connected on 7 April 2026 and goes from under construction to operating; the
  1,000 MW aggregate "Shandong Energy Bohai / Peninsula North N2 / L" is dropped (its three projects have records of their own); Huaneng Peninsula
  North BW is corrected to 510 MW and its GEM duplicate merged; the curated Guodian Xiangshan 1 phase 2 record is merged into GEM's Xiangshan 1
  record, which already carries both phases. China's operating offshore farms go from 169 to 167 records.
- Leads found but not yet usable are in TODO: the Xuwen 300 MW expansion (25 monopiles; the original 600 MW still has only a partial record),
  Mingyang Qingzhou 4 (18 jackets, the other 25 turbines unknown) and Peninsula North BW (the tender reserved 9 positions for jackets and the rest
  for monopiles, but there is no construction record).

## v2.13.3 — 2026-09-30

- Time check on the Yangjiang deep-water sites (quotes checked with `check_quotes.py`): CTG's Qingzhou 5 and 7 (163 turbines, 2,000 MW together)
  connected their first 5 turbines only on 27 September 2026 and are due in December 2026, so they go from "operating" back to "under construction
  (2026)", Qingzhou 5's capacity is corrected from 500 to 1,000 MW and GEM's two Qingzhou V / VII records are merged; CGN's Fanshi I and II
  (2,000 MW, 131 turbines) reached full capacity on 24 September 2026 (was 2025), and Fanshi II belongs to CGN, not Guangdong Energy, so it is
  renamed "CGN Fanshi II". China's operating offshore capacity drops by 2,000 MW, and the share of operating offshore capacity worldwide with a
  known foundation type moves from 49.4% to 50.1%.

## v2.13.2 — 2026-09-30

- Foundation step 5 (China), third batch: 5 farms added, every quoted passage checked with `check_quotes.py` — SPIC Binhai North H2 (100 monopiles without
  transition piece, Jiangsu Society for Electrical Engineering), Guohua Bozhong B2 (59 monopiles, CPEM reprint of the China Energy report), CR Power
  Cangnan 1 (49 monopiles; the 48 high-rise pile caps in the original design were changed to monopiles; CR Power construction account), Qidong H1 + H2
  (84 monopiles, Nantong government release) and CGN Yangjiang Fanshi I (73 four-pile jackets, Yangjiang Daily). 19 of China's 171 operating offshore
  farms are now classified, and the share of operating offshore capacity worldwide with a known type rises from 46.3% to 49.4%.
- Data corrections: CR Power Cangnan 1 was fully connected on 28 December 2022 (was 2023) and "Zhejiang Energy Cangnan 1" is a duplicate record of the
  same farm, now merged; Shandong Energy Bozhong A had a GEM duplicate, merged; the curated Bozhong G record said 850 MW and 2024 and now records phase 1
  (400.4 MW, connected May 2025), with GEM's phase-1 record merged into it; CGN's Huizhou Gangkou farm has two phases totalling 1,000 MW and 104 turbines
  (phase 1 250 MW in 2021, phase 2 750 MW in 2023), was recorded as 400 MW only, and is renamed "CGN Huizhou Gangkou I & II" (event WIND-026 links to
  the new name). China's operating offshore farms go from 174 to 171 records.
- Leads found but not yet usable are in TODO: Nanpeng Island (mostly four-pile jackets plus one 8.7 m monopile, counts unknown), Huaneng Cangnan 4
  (a mix of six-pile high-rise pile caps and monopiles; "48 caps + 29 monopiles" appears only in a search summary), Changle Waihai C (41 suction-bucket
  jackets plus four-pile jackets, the latter uncounted), Huadian Yuhuan 1 (10 monopiles in the south section, north unknown), Rudong H4 / H7, Binhai
  South H3, Bozhong G and Yuhuan 2 (the monopile reports are all on unreachable sites) and Huizhou Gangkou phase 1 (phase 2 is on deep-water jackets,
  phase 1 unknown).

## v2.13.1 — 2026-09-30

- Foundation step 5 (China), second batch: 6 farms added, every quoted passage checked with `check_quotes.py` — CTG Dafeng H8-1 (98 monopiles, China News Service),
  Guangxi Fangchenggang A (83 three-pile rock-socketed jackets, SASAC and Xinhua), CR Power Lianjiang Waihai (7 monopiles + 32 jackets, China Power),
  Shenergy Hainan CZ2 (67 monopiles, Hainan Daily via Sina), CGN Shanwei Houhu (82 monopiles + 8 four-pile jackets + 1 suction-bucket jacket, China News
  Service) and Guangdong Energy Yangjiang Qingzhou 1 & 2 (92 jackets, CCEDIA and China Energy News). 14 of China's 174 operating offshore farms are now
  classified, and the share of operating offshore capacity worldwide with a known type rises from 41.6% to 46.3%.
- Data corrections: Qingzhou 1 & 2 belong to Guangdong Energy Group (Yudean), not CGN, and are renamed "Guangdong Energy Yangjiang Qingzhou 1&2"; the GEM
  duplicates of Hainan CZ2 (one record) and Datang Danzhou CZ3 (phases 1 and 2, two records) are merged into the curated records, removing 1,800 MW of
  double-counted operating offshore capacity in China.
- Leads found but not yet usable are in TODO: Shenquan II (the report of 50 monopiles could not be opened), Xiangshan 1 phase 2 (36 monopiles + 160 group
  piles), Danzhou CZ3 (25 suction-bucket jackets, the rest unknown) and Jiazi I (planned 70 monopiles + 8 jackets).

## v2.13.0 — 2026-09-30

- The farm layer moves to Global Energy Monitor's Global Wind Power Tracker, February 2026 release (a GeoJSON in GEM's public bucket; the 2025-02
  release was a CSV): `tools/build_farms.py` maps the GeoJSON fields back to the CSV names, fills the retired years the 2026-02 file lacks from
  `data/global/sources/gem_retired_years_2025-02.json` (the 2025-02 values), and infers offshore / floating from the project name when GEM gives no type.
  Farms grow from 23,391 to 25,975 records (16,133 operating, 9,590 pipeline, 252 retired); "expected year passed but still in the pipeline"
  drops from 583 projects to 2, and the project-level pipeline and the country totals are finally the same GEM release.
- The clean-up rules were checked one by one against the new release: 13 that GEM has fixed itself are deleted (the Yambuk duplicate, the
  Portland merge, the old GPPD records for Criterion / Chaminé / Felgar, Pohjoinen, Saint-Brieuc, Golfe de Fos, Claveria, Pagudpu, Phuoc,
  Bến Tre 5, HKZ site 4), 4 take GEM's new names (Dounreay Trì, Pagudpud (ACEN), Jeonnam SK E&C, Qingzhou VI), Portland follows GEM's new split;
  8 merge rules are added (MacIntyre, Studland Bay, Kingman, Triton Knoll, Gökçedağ, Kipeto / Kajiado, Amunet, Gabal El Zeit, sourced from the
  other names on GEM's project pages and checked with `check_quotes.py`). Red Sea Wind Energy (650 MW) reached full commercial operation on
  2 July 2025 and leaves the pipeline list; Sørmarkfjellet (Norway), mothballed in GEM, stays operating per owner Aneo's restart notice (`STATUS_FIX`).
- Taiwan: Hai Long phase 3 (under construction, newly split out by GEM) merges into the curated "Hai Long 2 & 3"; Huanyang maps to GEM's renamed
  record; Haiding 1 and DeShuai are cancelled / removed in GEM 2026-02 and Greater Changhua Northeast is cancelled, but the site keeps the Sep 2026
  compiled list for now (see TODO); Korea's Donghae 1 follows GEM to under construction, expected 2030.
- Event WIND-044 now links to GEM's "MacIntyre precinct wind farm"; the Vung Tau port links Baltica 2 under GEM's new name "Baltica II Offshore wind farm".
- Build: `farm_cleanup.py` gains `CLEANUP_LENIENT=1` (build first when upgrading GEM, then rewrite the rules); the coverage report's pipeline-totals
  section now words itself by whether the releases match; the README update steps, ROADMAP and the sources text in the globe and Learn pages say 2026-02.

## v2.12.6 — 2026-09-30

- Data: the quoted passages behind the five step-5 (China) foundation rows and six clean-up rules were checked with `check_quotes.py`. China Three
  Gorges' own domains cannot be reached from the checking environment, so checkable sources are used instead (Shanghai government, CAS Guangzhou
  Institute of Energy Conversion, a subsidy notice via Sina Finance, the Fujian industry department, The Paper, GEM wiki): Donghai Bridge's
  full-connection date becomes 8 June 2010 (was August); Qingzhou 6 now says 27 December 2024; the Xiangshui turbine split (37 + 18), "March 2021"
  for Xinghua Bay phase 2 and the 20 MW prototype at Liu'ao phase 2 are dropped from the notes as unverifiable; Rudong H6 and H10 keep the CTG
  pages as their source until they can be checked (see TODO).
- Taiwan live: Greater Changhua 2b & 4 (wo4, wonan) get the 1 Sep 2026 completion ceremony, final commissioning and full commercial operation
  pending approvals (planned for Q3); Hai Long gets Northland's Q2 2026 report (71 of 73 turbines installed, 59 generating, commercial operation
  still 2027, NT$55 billion of incremental financing); Taipower offshore phase 2 gets Taipower's July 2026 takeover of turbine installation, 30
  turbines to go, grid connection targeted for year-end.
- Repository size: the long-term archive of Taipower's official retrospective data is now split by month into
  `data/archive/wind_history_archive_YYYY-MM.json` (the existing 21,744 points went into five files, Dec 2025 to Apr 2026), so the weekly backfill
  only rewrites the current month; the single-file edition and the public global wind map are no longer committed but uploaded by the
  `build-standalone` workflow to the GitHub Release "standalone", and the download links in the footer, the globe's sources dialog and the READMEs
  now point at `https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/…`.

## v2.12.5 — 2026-09-30

- Compact phone layout (widths up to 640px): the header is one row (logo only for the brand, the share button becomes an icon, the live
  status is only the green dot next to "Taiwan live"); the globe hides the big year in the corner (the play bar already shows it), folds
  the statistics into one strip, moves the attribution to a single line at the bottom, shrinks the toolbar and tab strip, moves the speed
  and display selects into the horizontally scrolling toolbar so the play bar keeps only play, year and slider, and tightens the farm and
  event cards. The Taiwan live sub-bar keeps only its four tabs and the map legend becomes a horizontal strip at the bottom. On a 390×844
  phone the visible globe grows from about 51% to about 80% of the screen height.

## v2.12.4 — 2026-09-29

- Events: the four details marked "not checked" in the previous version now have openable sources that pass `check_quotes.py`: the Lemnhult
  collapse date 2015-12-24 (Stena Renewable via reNEWS, and the SHK report page); the Delta 6 collapse date 2019-09-03 (GE statement via
  Recharge), back to day precision; the Maverick farm name and the Invenergy / PSO statements (Enid News & Eagle) with "no injuries" added,
  while the turbine make stays unverified and is left out; the Screggagh root cause, a unique fault in the blade control system (The Irish
  News and the owner's statement).



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
