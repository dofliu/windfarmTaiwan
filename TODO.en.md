# To do · TODO

English (this page) ｜ [中文](./TODO.md)

Concrete, actionable tasks. Background, the reasons behind decisions and the phased plan are in
[ROADMAP.en.md](./ROADMAP.en.md).

## In progress (hand-off, 10 Oct 2026: v2.32.0 national live output plus Belgium and Poland; the next conversation starts here)

Read this section first in a new session (see section 8 of CLAUDE.md); when you stop, rewrite it as the next piece of work in progress
and move finished items to the topic lists below.

### Live data (10 Oct 2026, v2.31.0–v2.32.0)

On 10 Oct 2026 the owner chose "national output right now": `intl_wind_scraper.py` now also fetches Great Britain (Elexon FUELINST), Germany (SMARD onshore 4067 +
offshore 1225), France (ODRÉ éCO2mix), Denmark (Energinet PowerSystemRightNow) and the Texas (ERCOT fuel-mix) and California (CAISO fuelsource) grids into `nat` in
`intl_realtime.json` (latest value + hourly means for 48 hours), shown in the country profile's "now" box and the world/continent "Wind output right now" list (`natRow` and
`liveWorldBox` in `globe.js`). Sources, coverage and licences are in [docs/live-data-sources.en.md](./docs/live-data-sources.en.md).
v2.31.0 is merged; a manual scheduled run at 06:02 UTC on 10 Oct 2026 succeeded for all six sources. The owner then asked to check the Belgian and Polish licences and,
once they were clear, to add both (v2.32.0): Belgium from Elia Open Data ods086 + ods031 (Elia Open Data Licence = CC BY 4.0, with the monitored capacity); Poland's current
value from `transmissionMapService` behind the www.pse.pl homepage map (undocumented), with earlier hours of the trend from `his-wlk-cal` on `api.raporty.pse.pl`
(published the next day), credited with the source, retrieval date and "przetworzona w części" under PSE's conditions for reusing public-sector information.

- After v2.32.0 is merged, check that the scheduled `scrape` run succeeds for all eight sources (one line per source in the Actions log; ERCOT occasionally answers 403 and
  the script retries once); ERCOT's 48-hour trend fills up only after a day (the source has just yesterday and today), and today's part of Poland's trend only has the
  scheduled snapshots. Poland's map endpoint is undocumented: if it stops working, fall back to `his-wlk-cal` (a day late, so not a current value) or drop it, and update the docs.
- More could be added (each needs its licence checked first): Ireland's EirGrid, Japan's utility areas,
  Korea's KPX and Brazil's ONS; other US regions only have EIA-930 (key needed, about 31 hours behind, not live). UK per-farm estimates and NED/ENTSO-E still need the owner's approval.
- The UK figure leaves out most turbines on the distribution network (NESO publishes an "embedded wind" estimate; adding it would be an estimate, so ask the owner first and label it).

### Next-step options (9 Oct 2026, for the owner to choose)

After round 23 the owner asked what else there is to do besides the doubts; the answer is below (details in the topic lists of this file and in phases 2–3 of
[ROADMAP.en.md](./ROADMAP.en.md)). In a new conversation, ask the owner to pick one first:

1. **Time-sensitive checks, due soon**
   - The quarterly "latest available" update at the end of October: Taiwan's September data and China's third quarter at the end of October, the US EIA-860M on 23 October,
     India and Brazil in mid-October; edit `tools/latest_wind.py`, then run `tools/build_country_stats.py`.
   - Taiwan offshore: Taipower Offshore Phase 2 (grid connection targeted for the end of the year), Greater Changhua 4 (wait for Ørsted's full-operation notice), Hai Long (Northland's Q3 report);
     move Yude and Huanyang to `PIPE_DROP` once their termination is formal.
   - Offshore farms under construction elsewhere: Vineyard Wind 1, Revolution Wind, Baltic Power, Sofia, Dieppe-Le Tréport, Qingzhou 5 and 7 (target Dec 2026); switch them to operating
     once fully commissioned.
   - Routine: check the data times and Actions monthly ("Maintenance" in [DEPLOY.en.md](./DEPLOY.en.md)); re-run `tools/build_live_units.py` quarterly (Elaine, Yawong and Forty Mile
     Bow Island are still missing).
2. **Yearly data updates (early 2027)**: IRENA (about March), the Energy Administration's handbook, JWPA (about February); merge the 2026 yearly statistics into `wind_global.json` and move
   "latest available" to 2027; add full-year 2026 measured output for Denmark (the early-2027 files), Australia (AEMO through 2026-12) and the US (EIA-923); when GEM publishes a new release,
   rebuild the farm layer and re-check the clean-up rules one by one.
3. **Data quality beyond the doubts**: 130 shared placeholder points remain (about 1,310 operating farms, mostly Chinese province centres); coverage gaps of about 98 GW in China and 16 GW in
   India (assess national registries, phase 1, large); foundation types unknown for 38 Chinese and 5 Vietnamese farms, hub heights missing for about 91; ports (none in China yet, about 20 in
   Europe, quay coordinates for 5 in the US); 7 events not yet linked to a farm and several incidents awaiting official findings; no free-licence photos yet for major farms such as
   Greater Changhua and Hornsea.
   On 10 Oct 2026 the owner decided to keep working on this group when there is time and to explain it on the site: from v2.30.19 the globe's "Sources" dialog opens with
   "Limits of the data and open questions", computing these counts from the loaded data (`dataLimits` in `globe.js`); the attribution line says the data is still being checked and not
   fully accurate, and Learn chapter 13 and sections 4.10 and 9 of the user guide explain it in words (no figures). When things change (ports in China added, photos filled in), update
   the chapter-13 and README wording too.
4. **Features not yet built (ROADMAP phases 2–3)**: country comparison (2–4 countries side by side, medium), more indicators (capacity per person, wind's share of generation, capacity factor;
   Ember, CC BY 4.0; the map can be coloured by them; medium), yearly additions (small), turbine-maker and developer shares (medium), teaching interactives (power curve, capacity factor,
   wake effect, falling costs; medium), farm details v2 (UK REPD and the Danish turbine register for positions, a common-model spec table, UK per-farm output), Taiwan's offshore phases
   (`ph` field), and small onshore farms in Taiwan (GEM leaves out those under 10 MW). **Ask the owner first**: UK estimates and live data from NED (Netherlands) and ENTSO-E (free keys
   needed), a long-term archive and trend chart for the grid status, and the grid-status source's WAF 403 (needs another runtime, not a code fix). Other energy sources: the owner chose to defer.

Recommendation: at the end of October do the quarterly update and the Taiwan offshore status check from group 1 first (fixed dates, small changes); for new features start with
"country comparison + Ember indicators + yearly additions" (no keys, clear licences, and they reuse the globe's existing timeline and country data).

### Where things stand

- The project is in maintenance (since 27 Sep 2026); automatic updates keep running and the `keepalive` workflow re-enables the
  schedules every month. A **monthly check** of the data times and Actions is still advised (steps under "Maintenance" in
  [DEPLOY.en.md](./DEPLOY.en.md)): when a fetch fails the site shows no error, it just keeps showing the last data.
- Work done at the owner's request from 28 Sep to 4 Oct 2026 (one PR each; details in [CHANGELOG.en.md](./CHANGELOG.en.md)):
  - v2.12.x: the events layer (91 events now), the public single-file "Global wind map", a compact phone layout.
  - v2.13.x: the farm layer upgraded to GEM 2026-02 (about 26,000 records), with every clean-up rule re-checked; foundation step 5
    (China and Vietnam) in batches.
  - v2.14.0–v2.17.0 visual upgrades: close-up turbines on their foundation type, the farm-card cross-section, a chart of new offshore
    capacity per year by foundation type, Learn chapter 7 on foundations, arcs from ports to the farms served, and water depth / hub
    height / rotor diameter fields with the cross-section and close-up drawn to scale.
  - v2.16.1–v2.17.7 data checks: one round of anomaly checks, turbine-field fixes, farms lost to wrong merges restored with a build
    check (`ORPHAN_OK`), five rounds of dimension research, the Wailuo 1 / Zhong Neng / Provence Grand Large turbine models settled,
    and the GEM 2026-02 differences checked one by one (Taiwan Round 3.2, Jwasari, Kakegawa, Sørmarkfjellet).
- 2026-10-04 (v2.18.0): the globe's timeline gains a "2026 (latest available)" point (official figures for 8 countries in `tools/latest_wind.py`,
  refreshed quarterly); 967 US farms draw their real USWTDB turbine positions; farm cards add distance to shore and estimated yearly output;
  four offshore farms completed in 2026 are now operating. The multi-energy mock-ups discussed the same day are deferred (ROADMAP,
  "Directions evaluated and deferred").
- 4 Oct 2026 (v2.20.0): "Actual yearly output" on farm cards: 876 US farms (EIA-923) and 13 Taipower farms in Taiwan (Taipower open data).
- 5 Oct 2026 (v2.21.0): a "Wind speed" basemap on the globe (Global Wind Atlas, `tools/build_wind_resource.py`). 
- 5 Oct 2026 (v2.22.1): clean-up checks: Germany's suspected duplicates cleared, Taipower-owned farms corrected from Taipower's station list
  (Zhongtun dismantled); Datan and Offshore Phase 1's coordinates remain unverified (see "Farm details").
- 5 Oct 2026 (v2.24.1–v2.24.3): Taiwan's availability fix, farm-grid project labels, a round of checks on unverified data (Datan, Yongxing,
  Longmen, Taipower Offshore Phase 1's position, Pentland, Ulsan, Linghang, new Haiyou Anlan).
- 5 Oct 2026 (v2.26.0): the globe's "📊 Output" dialog: total output and capacity factor rankings and a same-model comparison of measured per-farm output
  for Taiwan (19 Taipower-owned farms) and the US (EIA-923); `generation.json` gained a model field `m`; v2.26.1 puts US capacity factors on the EIA-860M nameplate capacity (the USWTDB sum inflated them when USWTDB lacked turbines). Private farms have no official per-farm yearly output and are
  left out of the official ranking.
- 6 Oct 2026 (v2.27.0): with the owner's approval, "Taiwan · live samples": `data/archive/farm_daily.json` (added to by the scraper on every run;
  `tools/build_farm_daily.py` backfills it from the git history, from June 2026) lets the Output dialog compare the average output, capacity factor and
  same-model performance of every grid unit including private farms; farm cards and the Taiwan live page's Charts tab link to it. Against July 2026,
  Taipower's 7 own farms are within 0–2 percentage points of the official monthly generation. Re-check each month against the new 17140 data;
  after a year of samples, consider a "last 365 days" or per-year option.
- 6 Oct 2026 (v2.27.0, same release): with the owner's approval, Danish measured output: `tools/dk_output.py` (called by `build_generation.py`) reads the
  Danish Energy Agency's turbine register workbooks "Vinddata" and "Parkproduktion"; 54 farms go into `generation.json` and 1,848 individually metered turbines
  into `data/global/turbine_output.json`. The Output dialog gains "Denmark · farms" and "Denmark · single turbines", and single turbines have their own card.
  Matching leaves out older turbines nearby, connected more than a year before the farm (11 onshore farms had reached the capacity threshold only with them).
  The agency updates about every two months (the current files run to Aug 2026); full-year 2026 figures need the early-2027 files. To refresh, download the
  new files and add them last to the `build_generation.py` arguments; the retrieval month updates itself.
- 6 Oct 2026 (v2.27.0, same release): a round of data checks (every quote checked with `check_quotes.py`): three Chinese offshore records listed as
  operating — Danzhou CZ3 split into sites 1 and 2 (site 2 under construction), Changle Waihai B never built (GEM's pre-construction record now stands
  for it), Peninsula North BW's point corrected; three GEM duplicates in Morocco (farm total 120% → 94%); card photos for 24 more farms (64 in all).
- 6 Oct 2026 (v2.28.0): two items the owner approved:
  1. PR checks in `.github/workflows/pr-check.yml`: `tools/smoke_test.js` (Playwright over every page at desktop and phone widths, both single-file copies
     online and offline), syntax, `qa_farms.py --max 19`, generated documents being up to date, and `tools/check_version.py` (a site change must raise the
     version and add to both changelogs). Raise `--max` together with any new legitimate coordinate exception.
  2. Australia in the Output dialog: `tools/au_output.py fetch` downloads AEMO's MMSDM monthly files (2022-01 to 2025-12, about 1.4 GB, 20 minutes) into
     `data/global/sources/aemo_wind_monthly.json` (109 kB, committed), which `build_generation.py` reads; 62 farms (60 in 2025, about 66% of the site's
     operating Australian capacity). Capacity factors everywhere now use the hours in the year (8,784 in 2024). Early in 2027, fetch through 2026-12 and
     rebuild `generation.json`. Rye Park and Cullerin Range capacities and Lal Lal's model were corrected on the way, and `data/live/units.json` was rebuilt
     (Lal Lal and Crookwell mappings).
- 7 Oct 2026 (v2.29.0): three items the owner asked for:
  1. The globe's "Sea zones" layer (`tools/build_offshore_zones.py` → `data/global/offshore_zones.json`): Marine Regions v12 EEZ boundaries (agreed /
     median and outer limits / unsettled) and Taiwan's offshore wind potential sites from Energy Administration open data 36681 (all 36 drawn since v2.30.0).
  2. The promo video tooling is in `tools/promo/` (README in both languages); the video does not say "open source" and shows no URL. Update the figures
     on the captions before rebuilding.
  3. Foundation and hub height research (three sub-agents in parallel, every quote checked with `check_quotes.py`): all 64 unknown Chinese and
     9 Vietnamese farms were searched again and 3 written (SPIC Peninsula South U1 all monopiles, Shanghai Lingang Phase 2 all high-rise pile caps,
     Hiep Thanh in Vietnam all monopiles); the rest only have leads (single lots, tender designs, no per-type counts), kept with the data problems in
     `tools/research/cn_vn_dims_2026-10c.json` (127 sources, all OK). Dimensions for 7 farms (hub: Peninsula South V 117–130 m, Haiyou Anlan about 150 m).
     The search limit ran out, so about 36 Chinese farms without a hub height were not searched this round (pick them from the empty hub column of
     `docs/foundations.en.md`); next time search "<farm> 竣工环境保护验收调查报告" first.
- 9 Oct 2026 (v2.30.18): research round 23 (four sub-agents: FA and FB the other 116 Indian farms without a commissioning year that no round had searched, FC the doubts in Europe, the Americas,
  Africa and Israel left by rounds 21–22, FD the doubts in China and India; every quote checked with `check_quotes.py`; results in `tools/research/years_2026-10t_FA.json`, `years_2026-10t_FB.json`,
  `doubts_2026-10t_FC.json` and `doubts_2026-10t_FD.json`, written entries deleted, leads kept). Clean-up rules 849 → 885 (`farm_cleanup.py`, 9 Oct 2026 "sixteenth batch"; the earlier Tournevents du COS
  rule now says 2017):
  1. Commissioning years: operating farms without a year go from 666 (32.1 GW) to 640 (31.1 GW); India 218 → 204. Useful sources: ICRA rationale PDFs (`icra.in/Rating/ShowRationalReportFilePdf?Id=`;
     the web pages need JavaScript), BSE annual-report PDFs, Orient Green's 2010 IPO prospectus (SEBI; turbine blocks with commissioning months), Cbonds company pages, and RIVM's national Dutch
     turbine snapshots.
  2. Proposals not taken or changed: Nipaniya (PTC)'s 2016 is inferred (no source states it); PTC India's 2016–17 annual report only says all five farms were commissioned by 31 Mar 2017, so their years
     remain 2016 or 2017; Anabaru's model rests only on The Wind Power and is not written; La Prévoterie's year is 2021, the year its whole capacity ran (the proposal said 2010), with the proposed phases;
     the removal of Poland's Klukowo/Samborsko is held back (the URE table also misses another farm).
  3. Still leads:
     - India: Nipaniya and PTC's other four; Bhendewade, Bengaluru (CleanMax), Vaingakullam, Kita (Kohinoor), Nani Sindhodi, Chakala and Muthiyampatti (Hindustan Zinc's 2011 expansion), Putluru, Niwade,
       Arasingundi (2007 or 2008; GEM may have swapped its location with Anabaru's), Bramanvel and Sadawaghapur (ADB), Theni (IEnergy), Tenkasi, Udumalpet I, Nettur, CEPCO's three, Gadag (Goyal),
       Tirunelvelli (Cape); possible duplicates: Satara (Bhilwara) and Kukudwad (both 50 MW, 2012), Hero's and PTC's Bableshwar (same village, both 50 MW Gamesa), Sogi and Harapanahalli, Kukru and Betul.
       Blocked: mprenewable.nic.in, MP SLDC, cea.nic.in (now behind a login), CDM and web.archive.org, Greenko, TPREL, Ramco, Ecoren.
     - China: the Chinese names and phases of Guangning Guangbei and Ji'an Qingyuan Futan (GEM's sources are all unreachable), the phase dates of Laizhou Huaneng distributed, Zhongyi B (first unit only),
       Bayan (CHN Energy) 200 MW is a separate project, Jushi Lianshui, TBEA Ruoqiang.
     - Elsewhere: the Netherlands' Noordertocht is dismantled (RIVM snapshots 2024 → 2026; removal year to find); the Zeewolde-area old turbines go only in 2026; Italy's Piano del Cornale / Campagna and
       Genzano / Banzi - Tre Titoli; Tunisia's Bizerte (2012, 2013 or 2014–15).
- 9 Oct 2026 (v2.30.17): research round 22 (four sub-agents: EA and EB India's 120 largest, EC Italy's 68 and ED 106 farms in other countries without a commissioning year, none researched before;
  every quote checked with `check_quotes.py`; results in `tools/research/years_2026-10s_EA.json`, `years_2026-10s_EB.json`, `years_2026-10s_EC.json` and `years_2026-10s_ED.json`, written entries
  deleted, leads kept). Clean-up rules 782 → 849 (`farm_cleanup.py`, 9 Oct 2026 "fifteenth batch"):
  1. Commissioning years: operating farms without a year go from 725 (34.9 GW) to 666 (32.1 GW); India 250 → 218, Italy 72 → 58. Useful sources: GlobalData plant profiles (the marketdata pages on
     power-technology.com / energymonitor, which answer 403 after many requests), Indian rating reports (CARE, CRISIL, Brickwork), Alerion's 2022 bond prospectus (each farm's month of first
     production) and NEDO's prefecture lists (Japan).
  2. Proposals not taken: for PTC Energy's five farms (Bableshwar, Devenkonda, Molagavalli, Kandimallayapalli, Payalakuntla), 2017 is only the date of the 3 Apr 2017 announcement, which says the
     projects were added in fiscal 2016–17, so the year may be 2016; only positions and capacity were written and the years left open.
  3. Still leads:
     - India: Animala has planned dates only; Bhesada (Mytrah)'s 2016 is in Mytrah's interim results (lse.co.uk blocks); Ratlam 2, Bhesada (ReNew), Zaheerabad, Satara (Hero) (32 MW, March 2014?);
       Sangli (REMC) still commissioning in May 2020; possible duplicates: Sogi and MSPL's "Sogi & Jajikallgudda", Kukru and Betul (same owner, point and source), Agar (Greenko) and Maliya (CDM name
       "Orange Agar Wind Power", seen only in a search result); which of the two 99.5 MW phases Betul (Atria) is; Kita (Orix) may be Wind Urja India (38.4 MW, 2010); Leap Green's Clover, Maple, Tulip,
       Olive, Vanila Jodhpur, Lotus, Iris, Violet and Citron I/II are SPV portfolios; Mahuva (KP Energy lists 67.8 MW). Blockers: Greenko's site fails TLS, web.archive.org resets, ICRA pages need
       JavaScript, the CDM site blocks bots.
     - Italy: Rotello (40 or 42 MW), Isola I (45.9 MW in phases), Alia/Sclafani has one phase only; possible duplicates: Cocullo / Pietrafitta, Marsica 2 At / Marsica II, Ponte Rotto / Ordona,
       Piano del Cornale / Campagna, Genzano di Lucania / Banzi - Tre Titoli; GlobalData dates Alcamo phase 1 to Feb 2012 (record 2011).
     - Elsewhere: the year of Tunisia's Bizerte Métline / Kchabta extension; Argentina's Energetica I may be Vientos Bonaerenses, and Santa Teresita was still unbuilt in Oct 2022 (GEM says operating);
       Poland's Klukowo/Samborsko and Reńska Wieś may never have been built, Tyszowce (Kresy I is 30 MW, the record 34); Cameroon's 100 MW "operating" conflicts with IRENA and is probably a GEM error;
       Israel's Afcon may duplicate WRI's Mount Gilboa; Lithuania's Strepeikiu may overlap Pagėgiai 13; most of the other 20 Dutch farms are old Zeewolde-area turbines due for removal in 2026 and may
       need to become retired; 5 farms in Costa Rica and 10 distributed farms in China have no year.
- 9 Oct 2026 (v2.30.16): research round 21 (five sub-agents: DA 45 more Chinese farms, DB 97 Spanish, DC 44 Turkish and 31 German farms without a commissioning year, DD the French duplicate and
  year leads left by rounds 19–20, DE the Spanish, German, Dutch and Turkish leads; every quote checked with `check_quotes.py`; results in `tools/research/years_2026-10r_DA.json`, `years_2026-10r_DB.json`,
  `years_2026-10r_DC.json`, `doubts_2026-10r_DD.json` and `doubts_2026-10r_DE.json`, written entries deleted, leads kept). Clean-up rules 675 → 782 (`farm_cleanup.py`, 9 Oct 2026 "fourteenth batch";
  Tripleville's earlier fix became a dup):
  1. Commissioning years: operating farms without a year go from 815 (37.3 GW) to 725 (34.9 GW); Spain 110 → 80, Turkey 48 → 28, France 62 → 40, Germany 32 → 21, China 138 → 133, the Netherlands 24 → 22.
     Useful new sources: Castilla y León's open data `analisis.datosabiertos.jcyl.es`, dataset parques-eolicos (`fecha_puesta_en_marcha`; early rows reuse the day field, so only the year is used),
     Aragón's environmental monitoring reports (aragon.es "plan-de-vigilancia-ambiental"), TÜREB's 2015–2022 statistics report PDFs (server.tureb.tr; the full reports from 2023 on are members-only),
     and MaStR's public JSON list and unit pages (no login; query pattern in `years_2026-10r_DC.json`).
  2. German MaStR: `build_mastr.py` re-run (inputs: EinheitenWind.xml and Katalogwerte.xml from the MaStR export); 11 groups that removed records used to hold are now farms of their own. Niedere Börde is in
     `MANUAL`; two of its groups (Biegen, A1) are registered about 16 km away, beyond MANUAL's 10 km, so its card draws 3 turbines. The Nessa proposal (move, 2012, 13.8 MW) would have stopped the build
     adding "UW Nessa" (49.8 MW, other operators' turbines included), so the GEM record was removed instead (its six turbines are already in UW Nessa).
  3. Proposals not taken: Tayakadin (the July 2022 rise from 41 to 50 MW may be a data correction), Gaoyou Sanduo (2025 is only the transfer to fixed assets, not a connection date), Buchhain (GEM's point
     is by the 2018 G114 farm); Kores is written as 2015, the year all of it was complete (TÜREB gives 2009/2012/2015 without phase sizes).
  4. Still leads:
     - China: Nong'an (Three Gorges), Qianguo, Dengzhou (CGN), Shangshui Tanzhuang and Zongyang Mabushan have first-connection dates only; Baigutun, Xinyi Guizi, Xiajin Huasheng and Wuchuan only an upper
       bound; Fuyu (Huadian), Zhenping Laozhuang, Jianping Sanjia and Taonan Yongmao Bao'an only construction starts; Guangning Guangbei carries the Chinese name of Ji'an Qingyuan Futan in Jiangxi;
       Qingyuan Futan's operating and announced records share one Chinese name; Xingyang Feilongding's capacity is in doubt (approved 48.6 MW, Zhengzhou counted 32.4 MW in 2022); the statuses of
       Laizhou Huaneng distributed phases 1 and 2 may be swapped; Tianjin Xiaowangzhuang (Longyuan) shares its point with Xiaowangzhuang 3; whether Taonan Rural Revitalization (31.7 MW) and the renamed
       22.1 MW project are one is unchecked.
     - Spain: 13 Aragón farms have only "operating year N" (Picador and Las Azubías about 2021; El Cabezo, Venta del Ginestar, La Rinconada, La Sarda, Tinajeros, Cañacoloma, Sierra de Luna, La Nava and
       Los Cierzos about 2020; El Saso, San Isidro); whether Hoya de Lucas operates; Tirapun's year (first power was planned for July 2019); the year of the Munilla extension; Greenalia's 7.3 MW
       Alto da Croa is not in the layer (no citable coordinates).
     - Turkey: Atares-1, Hacı Bey, Gazi-9, Şapdağı, İpektepe, Alares 2 and Hamzabeyli were not complete by July 2022 (later TÜREB reports are members-only); Metafor, Karaman, Aydos, Fener, Çandarlı and
       Karamürsel differ from GEM in capacity; Kalyon's four R3 farms (Bilecik-6, Ankara-2-1, Elazığ-1, Bayburt-5) are operating in GEM, but no completion was found.
     - Germany: Wulfen (GEM's point is a placeholder), Buchhain, Wölkisch, Görike-Schönhagen, Schoenermark, Gollmitz-Schönermark, Remlingen, Clauen and others have only inferred years.
     - France: the year of Tournevents du COS (WKN and DREAL say the whole farm ran from Nov–Dec 2017; the current rule follows the register's 2019); L'Huître et Granville (24 MW confirmed; register
       19 Dec 2009, Valorem February 2010); Naives-Rosières; Entre Seine Et Aube and La Prévoterie overlap (both include the 2010 phase); Mauléon (placed in the wrong département); Roman Road, Gourgançon;
       Roye's Bois Guillaume and Chemin Blanc are not in the layer; Les Chandelles may duplicate Breteuil-Esquennoy; Fortel en Artois may be InnoVent's Longue Rive; the outcome of Crouy et Cuffies' permit
       request is unknown (remove it if refused); switch La Chapelle Bâton to operating once it has a commissioning date.
- 9 Oct 2026 (v2.30.15): research round 20 (three sub-agents: CA 45 more Chinese farms, CB the remaining 119 French farms without a commissioning year, CC round-19 doubts and 32 Dutch farms;
  every quote checked with `check_quotes.py`; results in `tools/research/years_2026-10q_CA.json`, `years_2026-10q_CB.json` and `doubts_2026-10q_CC.json`, written entries deleted, leads kept).
  Clean-up rules 568 → 675 (`farm_cleanup.py`, 9 Oct 2026 "thirteenth batch"):
  1. Commissioning years: operating farms without a year go from 917 (40.1 GW) to 815 (37.3 GW); this round added 64 in France, 13 in China and 8 in the Netherlands. France was matched one by one
     against the full ODRÉ register by name, commune and capacity, with OpenStreetMap power-plant relations (name, capacity, start date) tying "Confidentiel" rows to farms; French farms without a
     year go from 155 to 62.
  2. Duplicates and aggregates: 13 French duplicates folded; Fère-Champenoise, Melle and Haut de Mergey were commune totals (removed; round 19's Fère-Champenoise-Euvy-Corroy dup became a drop);
     duplicates at Sant'Agata (Italy) and CGN's Chifeng folded.
  3. Proposals not taken: Gourgançon (which park the remaining 12 MW is was only inferred), Neeltje Jans – Vluchtheuvel (RVO says 2021, Wikipedia gives Vluchthaven 2022, and the name match was
     inferred), the owner of Woyang Baohe & Wujiahe (no quoted source; the year was written); Houlongshan's Chinese name uses the source's wording "盐源后龙山风电项目".
  4. Still leads: in France, L'Huître et Granville (2009 or 2010), Grande Combe (2019 or 2021), La Chapelle Bâton (connected, no commissioning date; perhaps under construction); possible duplicates
     Sommette-Eaucourt / Tournevents du COS, Kergrist Moelou / Rescotiou, Mont d'Ergny / Tripleville, Chapelle Vallon / Haut de Mergey; unproven duplicates Vaux-Andigny, Bois Madame, Naives-Rosières,
     Les Trois Fermes, the two Droupt records, Leury / Crouy et Cuffies, Sorbon 2, Esnouveaux, Fortel en Artois; Achery-Mayot registered Nov–Dec 2015 (record 2016); Roman Road probably = Voie Romaine;
     Gourgançon is still the 48 MW commune total. Netherlands: Epz (RVO 16.8 MW in 2022, record 24 MW), Kubbeweg (the 74 MW is the Kubbetocht/Zijdenettentocht repowering); Ritthem and Roompotsluis
     are not placed in Zeeland. China: Jingxing (CGN) export line approved only in Nov 2024; Liuwanshan phase 1 (42 MW) connected Dec 2020, phase 2 undated; Zhongyi B and Daqinghe salt pond have
     first-power dates only; Gushi Zushimiao and Fulaerji have power licences only; the Chinese names of Qinbei Wuning and Zhongyi point to other phases; Shayang, Hezhaike and Liuwanshan merge two
     phases in one record; "Heilongjiang Bayan wind farm" (200 MW, pre-construction) may duplicate Huadian Bayan phases 1–2; the Jushi Lianshui records may overlap; TBEA Ruoqiang (its 2024 annual
     report records selling the project company Ruoqiang Tongyang while under construction) is still open.
- 9 Oct 2026 (v2.30.14): research round 19 (three sub-agents: BA the next 40 Chinese farms and BB 55 French, Spanish and Italian farms without a commissioning year, BC the data doubts found in
  round 18; every quote checked with `check_quotes.py`; results in `tools/research/years_2026-10p_BA.json`, `years_2026-10p_BB.json` and `doubts_2026-10p_BC.json`, written entries deleted, leads kept).
  Clean-up rules 533 → 568 (`farm_cleanup.py`, 9 Oct 2026 "twelfth batch"):
  1. Commissioning years: operating farms without a year go from 948 (42.6 GW) to 917 (40.1 GW). Best sources: for France the national register of production installations (ODRÉ, open data, quotable
     CSV; query pattern in `years_2026-10p_BB.json`) and DREAL inspection reports; for China the annual reports and notices of listed owners (the cninfo announcement query API).
  2. Duplicates and removals: five in France, one in Italy, Atria II and GEM's Vankusawade in India; Saint-Georges-sur-Arnon (the sum of the commune's four 2009 parks) and India's Yermala
     (discontinued in 2017) are removed.
  3. Round-18 doubts settled: Drentse Monden (175.5 MW, 2021), Atria (one 120 MW farm, 54 V110, moved to Basavana Bagewadi town; two phases in operation from 18 Apr 2018, the third phase's
     date not found, so the farm's year is still unverified), the points of Liangjingzi and Jimunai (SPIC), Evergreen 250 MW (noted as a developer total).
  4. Still leads: GEM's alternative name and sources for TBEA's Ruoqiang Qiman are really TBEA's Ruoqiang River 1 GW project (Luobuzhuang wind area, 150 turbines, first turbine on 31 Dec 2024);
     neither the 750 MW "operating" nor the Qiman 1,000 MW has a construction record, to verify. Fengning wind-hydrogen was still under construction in Jan 2024; a double count is unproven. Envision's
     200 MW at Ejin Horo is its own entry on the 2021 grid list; whether it is part of the 440 MW zero-carbon park is unproven. Every Delta Maranhão model found is GE (the field's Vestas/Nordex has no
     source). Amistad still has no year (phases II–IV stalled for permits in 2022 and are not in the layer). TEECL and Dangri (Leap) remain placeholders. In France, Herbissonne (2014), Joyeux
     Developers, Plateau-de-Grès (2017) and Plaine d'Osne (2020) rest only on unnamed register rows; Melle and Miraumont equal their whole commune's total and overlap other records; Gourgançon is
     probably Mont de Bézard + Le Mont Grignon; Roman Road is probably Voie Romaine / La Guenelle; Corroy shares Fère-Champenoise's point; Voie Romaine should be 2014 and Les Tilleuls 2009 (register).
     Italy: three Sant'Agata records within 0.5 km may be one farm. China: the two CGN Chifeng poverty-alleviation records share name and capacity (one says Liaoning) and may be duplicates; Hanggin
     (China Resources) is about 600 km off; Houlongshan's Chinese name is phase 2; the three Jushi Lianshui records share a placeholder; Tailai was agreed for sale to CNNC Huineng in Nov 2024 (completion unverified).
- 9 Oct 2026 (v2.30.13): research round 18 (three sub-agents: AA China and AB elsewhere, the largest operating farms without a commissioning year; AC the events not yet linked to a farm plus two Chinese doubts;
  every quote checked with `check_quotes.py`; results in `tools/research/years_2026-10o_AA.json`, `years_2026-10o_AB.json` and `doubts_2026-10o_AC.json`, written entries deleted, leads kept). Clean-up rules 508 → 533
  (`farm_cleanup.py`, 9 Oct 2026 "eleventh batch"):
  1. Commissioning years: operating farms without a year go from 966 (48.2 GW) to 948 (42.6 GW), with years written for 14 (11 in China, 2 in Brazil, 1 in India). A useful new source: ANEEL's open data
     (`dadosabertos.aneel.gov.br/datastore/dump/75419902-c692-498b-a6ef-85f6d4beb5b2?q=…&format=csv`, the commercial-release date of every unit, quotable as is).
  2. Duplicates and status: Shangdu's Duolun section folds into the curated Huaneng Shangdu (1,600 MW, full connection 30 June 2023); Tongyu 2 GW phase 1 = Shihuadao (which moves to Tongyu county,
     approximate); Chile's La Cabana and WRI's Rei dos Ventos 1 in Brazil; the 1,350 MW Zhengxiangbai wind-hydrogen project is now pre-construction; Brazil's Ventos de São Rafael 08, 10 and 11 are operating.
  3. Events: 7 more placed at their farms (84 of 91); Crotched Mountain (1980, often called the world's first wind farm) is a new retired curated record, with an approximate end year of 1982 and the
     summit as an approximate point, both unverified.
  4. The Longyuan Rudong intertidal test farm's turbine field lists the 15 units of its O&M tenders; the capacity stays at 32 MW (the tenders say 27.5 MW, the units add up to 29.5 MW, and when the 16th
     unit left is unverified). Shapa phase 2 is 31 Mingyang + 31 Goldwind (GlobalData plus the lot values in CTG's prospectus).
  5. Still leads (years): in China, Mangya (Luneng), Jiuzhou, Jidian Weifang and Tieling county may not be fully operating yet; Chaoyang (first power May 2023), Hangjin (1 Jan 2023), Dashiqiao (June 2024)
     and Alashanyou have first-power dates only; Gaotai Beibutan, Changling Longfenghu and Yangyuan have planned dates only; GEM's "750 MW operating" for TBEA's Ruoqiang Qiman may belong to its separate
     Luobuzhuang project (Qiman was announced as 1,000 MW in two phases). Elsewhere: Amistad (planned Oct 2018; phase 1 188.1 MW), San Carlos (53 MW still added in Q1 2021), Santa Cruz (2020 or 2021),
     Monlora, Uygar (first phase May 2025), Evrencik and Dangri (Tata); several Indian farms found nothing.
  6. Data doubts (to verify): the Netherlands' Drentse Monden should be 45 × 3.9 MW = 175.5 MW (record 156.8); India's Atria I + II exceed the whole 120 MW farm; Atria I, Yermala, Vankusawade, Evergreen,
     TEECL and Dangri (Leap) sit on city or shared placeholder points; Evergreen's 250 MW looks like a developer total; Jimunai and Dabancheng Area 3 share a Xinjiang placeholder; Liangjingzi shared
     Shihuadao's wrong point (Liangjingzi is still there); Fengning's two 150 MW phases may be double-counted; Envision's two Ejin Horo records may overlap; Delta Maranhão's turbine field says
     Vestas/Nordex, but Delta 6 used GE.
- 9 Oct 2026 (v2.30.12): the owner decided to add the foundation type "low pile cap" (`lp`; the Chinese tidal-flat "low pile, tall pedestal", with the cap buried below the mud and a tall column carrying
  the tower), in the "other fixed" colour group, so the map colours do not change (colour-blind check re-run). Research round 17 the same day (one sub-agent, results in `tools/research/fd_2026-10n_Z.json`,
  every quote checked with `check_quotes.py`) looked for farms that use the type; **none could be written**:
  1. SinoHydro Rudong Intertidal: the other 10 units are collector line A, nos. 1#–10#, i.e. phase 1's 10 × 2 MW (connected May 2014), and still have no stated type. The designer (PowerChina Zhongnan)
     wrote in 2023, looking back, that the farm used "low pile, tall pedestal" and five-pile jacket foundations; inferring from that that the 10 are low pile caps would give 30 low pile caps + 12 jackets.
     Not used for now (the MSA notice gives no type for the 10); unverified.
  2. Tianjin Nangang phase 1: the only source naming the cap level is a Sept 2017 overview of projects under construction, "uses low pile-cap foundations" (a "sea-land combined" farm outside the
     south breakwater and inside the river-mouth training wall, which fits), while GlobalData says high-rise pile cap; no post-completion source (Tianjin government sites 403, the acceptance notice
     behind a captcha), so it stays a lead.
  3. Longyuan Rudong Intertidal Demo: early test units had concrete foundations built inside steel sheet-pile cofferdams (the low-pile-cap method), and at least 7 units are jackets plus some multi-pile
     foundations; no per-type counts. A 2019 tender lists 15 test turbines totalling 27.5 MW, against 32 MW in the record (to verify).
  4. No low pile caps found at the other untyped Chinese farms; Laoting Putidao's caps are high-rise ("15 high-pile concrete foundations"); none of the existing high-rise pile cap rows turned out to be low.
- 9 Oct 2026 (v2.30.11): research round 16 (two sub-agents: X Chinese foundations, Y the remaining doubts and a status sweep; every quote checked with `check_quotes.py`;
  results in `tools/research/fd_2026-10m_X.json` and `doubts_2026-10m_Y.json`, written entries deleted, leads kept). Clean-up rules 506 → 508 (`farm_cleanup.py`, 9 Oct 2026 "tenth batch"):
  1. Foundations: all 38 turbines of CGN Xiangshan Tuci stand on monopiles (CGN e-procurement, Aug 2025 corrosion and structural inspection tender for the built farm). The platform renders
     its notice pages by script, so the cited URL is the same notice's JSON (`https://ecp.cgnpc.com.cn/detail/<store>/<id>.json`; the list API is POST `/portalApi/connect/query`, parameters in X9 of `fd_2026-10m_X.json`).
  2. Longyuan Putian Nanri Island (called the "Sandun wind farm" after completion; area A 55 turbines, area B 45): turbines corrected to 100 Siemens SWT-4.0-130 and the year of full operation to 2021 (CHN Energy tenders).
     Chart depth 5–30 m is ready; for the type only lot VIII (12 units, rock-socketing and pile caps) and lot IX (18 units, cages) were found, the other lots predate the tender site, so it waits for the type.
  3. Zhuhai Guishan: the Guangzhou MSA completion notice (July 2025) gives 200 MW and 49 turbines. Phase 1 has 34 × 3 MW; in June 2021 the rest of the design was changed to 7 × 6.45 MW + 8 × 7 MW, 13 of which
     were connected at full capacity in December 2021 (GlobalData: 5 Mingyang MySE6.45-180 and 8 Dongfang DEW-D7000-186), and two units on bucket foundations were added in 2024 (models and ratings
     unpublished, unverified). Capacity now 200 MW, year still 2021. Foundations: phase 1's 34 four-pile jackets; the types and counts of the 15 later units are still unknown.
  4. Status sweep (9 Oct): Greater Changhua 2b & 4, Revolution Wind, Vineyard Wind 1, Baltic Power (all 76 turbines installed), Sofia, Qingzhou 5/7 (first batch connected 27 Sep) and Danzhou CZ3 site 2
     are all not yet fully commercial; no change.
  5. **Owner to decide**: the 20 "low pile, tall pedestal" (低桩高台柱) foundations of SinoHydro Rudong Intertidal have the pile cap buried below the mud and a tall column lifting the tower flange above the
     highest tide (patents of the owner and Sinohydro Bureau 4), unlike a high-rise pile cap standing clear of the seabed with free pile length. Options: (a) a new type "low pile cap", (b) file under
     high-rise pile cap with a note that the cap is buried, (c) keep it out. Either way the other 10 units' type is still unknown.
     → The owner chose (a) on 9 Oct 2026; added in v2.30.12 (see the item above).
  6. Still leads: Laizhou (a 2024 O&M tender calls "the monopile and cage" the turbine foundation but does not say all 38); Jiazi I's exact model (MSA rotor 168 m, GlobalData MySE6.45-180; nacelles being
     replaced one by one from July 2024 to Dec 2026); Jiazi I and II (2019 design: a 17-jacket lot and two 30-position monopile lots; Jiazi II re-tendered in 2022 for 50 × 8 MW, lots I and II with no type);
     Fanshi II (lot II: 11 × 18 MW on jackets; lots I and III counts unknown); Peninsula South U2 (no post-construction foundation tender yet); the Longyuan Rudong intertidal demo (the Huangang complex,
     155 turbines in five phases; at least 7 jackets in the 30 MW test farm); in Vietnam, Bac Lieu 1 and 2 (only a 2019 review says pile caps), Tan An 1, Duyen Hai V1-4 and V1-3 Ben Tre (nothing; one
     Vietnamese builder's list of types is copied from 4C Offshore and not used).
     New routes: the CHN Energy tender site works over http only (https blocks the IP), full-text API in X9 of `fd_2026-10m_X.json`; the Huaneng, Huadian, Datang and CTG procurement sites all block us.
  Offshore totals: 285 of 331 operating offshore farms have a known type (87.3%), 103 of China's 141 (about 76%), 15 of Vietnam's 20; dimensions for 278 farms, all three for 183.
- 8 Oct 2026 (v2.30.10): research round 15 (three sub-agents: U northern China, V southern China and Vietnam, W Asseln in Germany and Liu'ao; every quote checked with `check_quotes.py`;
  results in `tools/research/fd_2026-10l_U.json`, `fd_2026-10l_V.json` and `doubts_2026-10l_W.json`, with written entries removed and only leads kept). Clean-up rules 502 → 506 (the 8 Oct 2026
  "ninth batch" block of `farm_cleanup.py`):
  1. Foundations (Jiangsu MSA construction notices, mobile pages): Rudong H5 (75), GCL Rudong H15 (40), Guoxin Rudong H2 (70, plus depth 6–21 m from the seabed elevation), Huaneng Rudong H3 (80) and
     Jiangjiasha H1 phase 2 (15) all on monopiles; Huaneng Cangnan 4 on 42 monopiles + 35 high-rise pile caps (2025 scour-protection tender, dlztb.com). The provincial MSA mobile channel ids are in
     `fd_2026-10l_U.json`; northern completion notices rarely give the type, and the lists only go back to 2019–2020.
  2. Jiazi I's turbine field now reads just "78 Mingyang 6.45 MW": the MSA-filed 168 m rotor and 100 m hub do not fit the stored MySE6.45-180, whose suffix had no source (exact model unverified).
  3. Germany, Lichtenau-Asseln: GEM's Paderborn (36 MW) is the site of the 1993–98 Windpark Asseln (asseln.de's 62-turbine list includes Hakenberg's units of 1993–95); `MANUAL` in `build_mastr.py`
     gives it the 8 MaStR groups holding original units (38.37 MW); Asselner (GEM 19.5 MW) = MaStR "Asselner Windpark", with its 2018 extension now 24.75 MW; the MaStR-added "Windpark Asseln" and "AWP",
     which counted old units twice, fold into Paderborn, while WP Lichtenau and WP LA (2015–17) and Paderborn-Benhausen and Paderborn-Sande, which Paderborn had held back, are added; Paderborn's point
     moves to the German Wikipedia coordinates. The area now adds up to 130 MW against MaStR's 133.8 MW with no double counting; WP LA and Dahl are confirmed as different farms (`NOT_DUP`).
  4. Liu'ao area D's point moves to the "area D met mast No. 4" of a Zhangzhou MSA notice (approximate); area E appears nowhere in all 3,695 Fujian MSA notices and 921 warnings since 2020 and stays unverified.
  5. Still leads: SinoHydro Rudong intertidal (20 units on "low-pile high-platform-column" foundations, 12 five-pile jackets, 10 unstated; whether the first counts as a high-rise pile cap needs a
     decision), Huaneng Dafeng expansion (hub 96 m, type unknown), CTG Dafeng 300 MW = H11 (mixed, counts unknown), Zhuanghe II (monopiles and suction-bucket jackets, counts unknown), Peninsula South U2
     (accepted with 71 turbines in Aug 2026, type unknown); Jiazi I (lots I and II add up to 71 monopiles; the design was 70 monopiles + 8 jackets; the MSA as-built layout is a scanned file), Jiazi II
     (only the pre-construction all-monopile design), Yuhuan 1 south zone, Qingzhou 6 (depth 37–46 m ready), Danzhou CZ3 site 1 (monopiles and suction-bucket jackets), Nanri Island (lot VIII only).
     Zhuhai Guishan: two composite-bucket units were added after 2021 (the first in 2022, two turbines in 2024), so the record's 198 MW / 2021 predated them (v2.30.11 changed it to 200 MW with the turbine mix).
     New routes: dlztb.com's per-channel `search.php` (indexes only from about mid-2025) and the CHN Energy full-text tender search API (POST /bidfulltextsearch/rest/inteligentSearch/getFullTextData).
  Offshore sums: 284 of 331 operating offshore farms have a known type (87.0%), 102 of China's 141 (about 75%) and 15 of Vietnam's 20; dimensions for 278, all three for 183.
- 8 Oct 2026 (v2.30.8, v2.30.9): research round 14 (three sub-agents: R northern China foundations, S southern China and Vietnam foundations, T round 13's new leads;
  every quote checked with `check_quotes.py`; results in `tools/research/fd_2026-10k_R.json`, `fd_2026-10k_S.json` and `doubts_2026-10k_T.json`, with written entries removed and only
  leads kept). Items tried two or three times against blocked sites (the Lac Hoa 1, Jeonnam 1 and Youde coordinates, Song An's COD, Changle's 118 m hub) were not repeated.
  Clean-up rules 498 → 502 (the 8 Oct 2026 "eighth batch" block of `farm_cleanup.py`):
  1. Zhangpu Liu'ao: the Fujian industry department wrote in Feb 2023 that "the approved 800 MW consists of the Zhangpu area D project and the Zhangpu phase 2 project", and GEM lists them as
     separate projects, so the old "area D = phase 2" reading was wrong: the curated "Zhangpu Liu'ao Phase 1" is now a `drop` (with corrected reasons), GEM's Liu'ao project moves from
     `ORPHAN_OK` to `GEM_KEEP`, area D (402 MW) is pre-construction, and CTG's Liu'ao phase 2 moves to the centre of its turbine area from the Dec 2023 sea-use change approval (the old
     point was about 30 km off). Area E's point (22.733 N) may be a slip for 23.733 N, which cannot be shown; still to verify.
  2. Added CSSC Haizhuang's 6.2 MW "Fuyao" floating demonstrator (`data/global/sources/farms_attachment.json`): the position comes from MSA notice 795/2026 (a lone turbine at
     Luodousha with a cable of about 25.9 km), matching the 25.77 km cable to Wailuo phase 2 turbine no. 27 in Guangdong's EIA approval; the notice does not name the unit, and the card
     says the position is inferred; it ran off-grid on a micro-grid in 2023, and a public-grid connection is unverified.
  3. Germany: GEM's Lichtenau (11 MW) is part of Windpark Asseln (62 turbines, 36 MW, GEM's Paderborn) and is a `dup`. The MaStR matches of GEM's Paderborn and Asselner and MaStR's
     "Windpark Asseln" / "WP Asseln" around there were also off; sorted out from asseln.de's description in v2.30.10 (item 3 of round 15).
  4. Foundations, northern China: Qidong H3 all monopiles, Huaneng Rudong Baxianjiao 50 monopiles + 20 high-rise pile caps (2018 O&M vessel tender), Jiangjiasha H2 61 monopiles + 6
     multi-pile jackets (2024 O&M tender); a useful new source is the O&M tenders reposted by dlztb.com. Still leads: Datang Binhai (monopile sources for part of its 96 turbines only),
     Peninsula South U2 (EIA only), Laoting Putidao (conflicting pile-cap and monopile counts).
  5. Foundations, southern China and Vietnam: Zheneng Taizhou 1, 39 monopiles + 1 pile–bucket composite (listed as monopile); Vietnam's Tan Phu Dong 2 on PHC pile groups with caps;
     Pinghai Bay area F's turbines 3 × 6 MW + 26 × 7 MW. A useful new source: the MSA's mobile notice pages (`https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=…`; the
     desktop pages give 403; the list API is a POST to `/msacncms_wap/cmsarticle/selectPageByChannelId.jhtml`); post-completion navigation notices often give depth and turbine counts,
     sometimes hub and rotor. Dimensions ready but waiting for a foundation type: Jiazi I (depth 33–39 m, hub 100 m, rotor 168 m, which does not fit the record's MySE6.45-180, so check
     the model first), Jiazi II (32–37 m, hub 127 m), Cangnan 4 (26–34 m), Yuhuan 1 (7–15 m), Pinghai Bay area F (10–25 m). Zhuhai Guishan: the MSA says 200 MW and 49 turbines as built,
     while the record has the shareholder's 198 MW; to confirm. Xiangshan Tuci was built by 2024 with 38 × 8 MW.
  Offshore sums: 278 of 331 operating offshore farms have a known type (85.2%), 96 of China's 141 (about 71%) and 15 of Vietnam's 20; dimensions for 276, all three for 183.
- 8 Oct 2026 (v2.30.7): research round 13: the doubts left in TODO (four sub-agents in parallel for China, Vietnam and Thailand, Taiwan/Japan/Korea,
  and Europe/the Americas/Oceania; every quote checked with `check_quotes.py`; results in `tools/research/doubts_2026-10j_N/O/P/Q.json`, with written entries
  removed and only leads kept). Clean-up rules 478 → 498 (the 8 Oct 2026 "seventh batch" block of `farm_cleanup.py`):
  1. Thailand: GEM's Hanuman 10 (80 MW) had been dropped by the build as a duplicate of the curated Subyai and is back through `GEM_KEEP`; Hanuman 1, 5, 8, 9 and 10
     now sit at the turbine positions in Table 2 of the ADB environmental and social monitoring report for 2020 (1, 5, 9 and 10 shared one GEM point inside Hanuman 10);
     Subyai (EGCO's Chaiyaphum) moves to its OpenStreetMap wind-farm area.
  2. Vietnam: GEM's "Dong Hai V1-4" and "Dong Hai 1 · 3" are phases 4 and 3 of Dong Hai 1 in Ca Mau (formerly Bac Lieu; launched Aug 2026, due 2028 and 2029), renamed,
     owners added, set to pre-construction, with the approximate point of phases 1–2 for now (the second one sat in the South China Sea); Tra Vinh's Dong Hai 1 moves to
     the centre of the 25 turbines of its OSM wind-farm relation.
  3. Germany: `MANUAL` in `build_mastr.py` gains Erbes-Büdesheim (= MaStR "Windpark Offenheim", 2013), Lütjenholm (= "WPL"), Süderauerdorf (= "BWP Süderauerdorf",
     2 more turbines in 2023, 20.6 MW) and Schülp (wpd's 5 E-70 of 2014); Zettingen gets the year 2009 and Bornstedt-Holdenstedt 2006; 9 pairs confirmed as different
     farms (`NOT_DUP`). Every German "suspected duplicate B" is now checked (Lichtenau's units are still open, below).
  4. China: all four "suspected duplicate B" pairs are different farms (Dafeng H4 / H8-2, Jiaxing 1 / 2, Dafeng H12 / H7, Putian Shitang / Pinghai Bay phase 1); CTG Dafeng
     H8-2 and Jiaxing 1 and 2 move into the farm areas of MSA notices or named OpenStreetMap areas; the Fengxian Haiwan expansion becomes onshore (the original farm is one of
     Shanghai's onshore farms and the same owner's repowering is onshore in every DRC list; no source gives the expansion's turbine positions, and the card says so); GEM's
     "Fengxian Bay Retrofit and Upgrade" 48 MW and "Fengxian Haiwan 1" 62.5 MW are one repowering project; Changle Waihai C gains depth 31–45 m and rotor 185 m.
  5. Japan: Setana port's semi-offshore turbines stopped in 2024 (town council review of the accounts, Sept 2025: no generation from FY2024; `end=2024`); Enshu Kakegawa
     (8 Enercon E-82, 15.97 MW) and Kakegawa (6 E-82) are two farms, each with corrected turbines and moved to its OSM-named turbines. Enshu Kakegawa comes from the
     Japanese list, so it is corrected in `data/global/sources/farms_jp_compiled.json`, and `build_farms.py` gains `JP_DISTINCT` (it lies 7 km from Omaezaki phase 2 with
     the same capacity and year and would otherwise be taken as the same site).
  6. Poland: the list's Baltica 1 maps to GEM's Baltica I (`PIPE_SAME` and `PIPE_FIX` in `build_farms.py`; it lost the Dec 2025 CfD auction, so no expected year).
     Australia: GULLRWF2 is Biala (`build_live_units.py`).
  7. Still leads: Liu'ao area E's position (an unquotable summary says the approved 800 MW = area D + phase 2, which may conflict with the `GEM_KEEP` note on area D; to check);
     whether Changle's 118 m hub is in area A or C; Fuyao (MSA notice 795/2026 lays a cable at Luodousha to a single turbine at 20°18′50.4″N 110°34′48.7″E, but the notice
     does not name the unit); the KEPRI test turbine at Gunsan (two OSM nodes, each tagged 1.5 MW and 2017, do not fit one 3 MW unit of 2016); Lac Hoa 1's coordinates;
     Song An's COD; the Jeonnam 1 and Youde coordinates; the point of Bac Lieu's Dong Hai 1 phases 1–2 (apparently on the Hoa Binh 2 site); Lichtenau (GEM's 11 MW fits no set of units).
  Offshore sums: China has 140 operating offshore records (the Fengxian expansion is now onshore), 91 with a known foundation type (about 69% of capacity); worldwide 272 of 330 (83.8%).
- 7 Oct 2026 (v2.30.6): research round 12: the doubts left in TODO (four sub-agents in parallel for China, Vietnam and Thailand, Taiwan/Japan/Korea,
  and Europe/the Americas/Oceania; every quote checked with `check_quotes.py`; results in `tools/research/doubts_2026-10i_J/K/L/M.json`, with written entries
  removed and only leads kept). Clean-up rules 446 → 478 (the 7 Oct 2026 "sixth batch" block of `farm_cleanup.py`):
  1. German MaStR matching (`tools/build_mastr.py`): a start-year check (a farm whose matched units mostly started more than a year from its own start, with a
     weak match, moves to a group within 3 km that shares a name or municipality word and fits the year and capacity) and a hand-checked `MANUAL` table with
     sources. Gremersdorf, Borchen-Etteln, Dobberkau, Gägelow, Großenwiehe, Ruhlsdorf, Oederquart and Streumen now carry their own turbines, and the units they
     were wrongly given become added farms. The "suspected duplicates B" were checked pair by pair: 18 records confirmed as different farms went into `NOT_DUP`;
     most of the rest are neighbouring sister farms in China.
  2. Restored or corrected after wrong merges: Shiloh (USA) now has all four phases, 505 MW (phases III and IV were missing); Pantelimon in Romania (123 MW,
     `GEM_KEEP`); Esperanza in the Dominican Republic (49.5 MW, 2025). Duplicates removed: Dreiberg = Druiberg (Germany), Dempsey Ridge = Big Smile (USA),
     and the two Esperanza records.
  3. Status: Peninsula South U2 operating from 2024 (Weihai and Shandong reports: the whole U site, U2 included, 177 turbines, fully connected on 26 Oct 2024);
     Vietnam's Duyen Hai (V1-4) operating from 2026, offshore; the other 105.5 MW of Cho Long built but not in commercial operation (under construction);
     Carreto (Colombia) operating from 2025; Windanker expected in 2027; Korea's Ulsan 750 kW floating pilot never went to sea and is removed.
  4. Positions: Xiangshan Tuci (38 turbine positions from the Ningbo MSA, 300 MW), Pinghai Bay area F and Putian Shicheng (turbine centres in Fujian's sea-use
     approvals), Choshi (TEPCO RP's published turbine position), Yeonggwang Wind's 15 intertidal turbines (OpenStreetMap wind-farm relation), Revolution Wind
     (65 OSM turbines), Druiberg, Frederikshavn and Rønland.
  5. Denmark: Rønland now has only its four southern turbines (9.2 MW) at sea, on piled concrete caps (pc, owners' cooperative); Frederikshavn has only its
     Nordex N90 at sea (2.3 MW).
  6. Turbine and capacity fields: Changle Waihai C, Shapa phase 2, Binh Dai (Goldwind for phases 2–3), Soc Trang No. 7 (29.4 MW), Gullen Range (165.5 MW),
     Ajos/Kemi, Larimar, Gohlocher Wald (6 MW), Oederquart (22.4 MW), Streumen (13.2 MW) and Sørmarkfjellet; Formosa 1 phase 1 is confirmed as SWT-4.0-120
     (Ørsted and Siemens Gamesa material).
  7. Coverage: Dominican Republic 89% → 100%, Romania 84% → 88%; Colombia shows 122% (IRENA does not yet count Carreto; the report says so). The US turbine
     positions and measured output were rebuilt (Shiloh and Big Smile now match USWTDB/EIA).
  8. Still leads (see the topic lists): the Fengxian Haiwan expansion (Shanghai lists the same owner's repowering as onshore, but not the expansion itself),
     Liu'ao area E's position, Changle's 118 m hub (search snippets point to area A, nothing quotable), Setana's stop year (the town's FY2024 table gives 3 MWh,
     in an xlsx the checker cannot read), the Youde and Huanyang terminations, no records for Hanuman 10 (Thailand, 80 MW) and TDC's Lac Hoa 1 (Vietnam, 30 MW),
     no record for the Gunsan suction-bucket 3 MW test turbine (at sea since 2016), GULLRWF2 is very probably Biala, and Erbes-Büdesheim may be MaStR's Offenheim.
  Farm sums: China's operating offshore records are 141 and 47.2 GW (44.7 GW with years up to 2025) against a 2025 national figure of 48.4 GW; Vietnam's are 20 and 1.26 GW.
- 7 Oct 2026 (v2.30.5): research round 11: the farm data doubts in TODO (three sub-agents in parallel for Fujian / Zhejiang / Shanghai, Jiangsu / Guangdong / Shandong,
  and Vietnam and other countries; every quote checked with `check_quotes.py`; results in `tools/research/doubts_2026-10h_G/H/I.json`). Clean-up rules 414 → 446
  (the two 7 Oct 2026 "fifth batch" blocks of `farm_cleanup.py`):
  1. Farms that had vanished through wrong merges are back (`GEM_KEEP`): Datang Binhai 302 MW (was merged into Binhai South H3) and Pinghai Bay area F 200 MW (was merged into
     Pinghai Bay phase 3; GEM's rough point, turbines unverified); GEM's Changle Outer Ocean area I is a newer, separate project (under construction and pre-construction)
     and is no longer merged into CTG Changle Waihai A.
  2. Duplicates removed: GEM's four Guoxin Dafeng H1/H2/H10/H16 records (the curated "Guoxin Dafeng 850 MW" is the whole project), the 600 MW "Zhoushan Liuheng /
     Zhejiang others" aggregate (Putuo 6 zone 2 and Jiaxing 2 again), Vietnam's GEM "Bình Đại" 25.8 MW (part of Binh Dai phase 1) and "Công Lý Sóc Trăng" (Cong Ly
     Soc Trang phase 1); and Taiwan's GEM Haiding 3 (Formosa 3's development rights cancelled in 2025, Corio wound up in April 2026).
  3. Status and years: Huaneng Yuhuan 2 back to under construction (only back-energised onshore in April 2025, no full-connection report; 508 MW, 25 × 16 + 6 × 18 MW
     planned); GEM's Bozhong B1 cut to the 100 MW extension (its 500 MW counted the built 400 MW again); in Vietnam, Ca Mau 1 (350 MW) and Thanh Hai No. 5 (120 MW)
     back to under construction (EVN's transitional COD tracker still had them unfiled or only partly at COD in April 2025) and Cong Ly Soc Trang phase 1 onshore and
     under construction (nine of its ten turbines stand on land; 27 MW at COD only in Dec 2025). Years: Xuwen's original farm 2022 → 2021, Binhai South H3 2019 → 2020,
     Guishan 2018 → 2021, Fangchenggang A 2024 → 2025, Xiangshan Tuci (renamed CGN Xiangshan Tuci) 2023 (broker report and GEM; the owner's notice is unverified),
     and Binh Dai, VPL Ben Tre and Hiep Thanh → 2023 (only partly at COD in 2021); Tan An 1 is 99.4 MW (all three parts operating); Akhfennir phase 1 2013 (GEM's 2014 is wrong).
  4. Positions: Jiangjiasha H1 · 1 and H2 moved to turbine positions from maritime safety notices (they were in the Yangtze estuary); Changle Waihai A and C moved to the
     centres of their named OpenStreetMap farm areas (C's old point was inside area A).
  5. Turbine fields: Pinghai Bay phases 2 and 3, Rudong H2, Guoxin Dafeng, Huizhou Gangkou I & II, Binhai South H3, Bozhong B1, Fangchenggang A, the Pingtan bridge farm,
     Jiangjiasha H1, Guishan, Hoa Binh 2, Binh Dai, Cong Ly Soc Trang and Akhfennir; owners of Hoa Binh 1 phase 2 and Hoa Binh 2.
  6. Foundations: Nissum Bredning Vind becomes jacket (installer Aarsleff: three-legged steel jackets on driven raked piles with a concrete transition piece); Yttre
     Stengrund stays monopile with a note on Vattenfall's "concrete foundations" wording.
  7. Still leads: whether the Fengxian Haiwan expansion is offshore or on the sea wall (only the CDM document would say, behind a bot wall); Liu'ao area E's position;
     whether Changle's 118 m hub is in area A or C; whether Peninsula South U2 is fully connected (the claim that the whole U site was connected in Oct 2024 conflicts
     with U2's own under-construction listing); Vietnam's Duyen Hai (V1-4) 48 MW has run in full since March 2026 and may be GEM's "Duyên Hai wind farm · 1", but no
     source ties them; Rønland's foundations (the owners' 2024 application describes the four southern Bonus turbines on concrete foundations piled to about 50 m, the
     northern four are not described; OSPAR's gravity-based is kept); Zhongmin Energy dates Pinghai Bay phase 2's full production to Feb 2022 (the rule keeps 2021);
     Danzhou CZ3 site 2 was still in offshore construction in Oct 2026; Peninsula North BW 2024 can be closed.
  Farm sums: China's operating offshore records are 140 and 46.6 GW (44.1 GW with years up to 2025), now below the 2025 national figure of 48.4 GW; Vietnam's are 19 and
  1.2 GW (national about 1.0 GW). Vietnam's farm-level coverage falls from 86% to 78% as a result.
- 7 Oct 2026 (v2.30.4): research round 10 (the owner decided not to register with the CCER registry and asked to check other farms instead; four sub-agents in parallel,
  quotes checked with `check_quotes.py`):
  1. The 30 farms outside China without a hub height: 13 written (hubs for Vindeby, Blyth, Utgrunden I, Yttre Stengrund, Arklow phase 1, Hooksiel, the Beatrice demonstrator and Setana;
     depths or rotors for Kitakyushu Hibikinada, Lely, Irene Vorrink, TetraSpar and WindFloat 1). The Hooksiel and Arklow hubs come from reports during construction and the maker's project
     sheet, and Yttre Stengrund and Irene Vorrink from the EU's CA-OWEE database; the card notes say so, and they can be removed if the owner finds them too loose. The large farms (Hornsea Two,
     Dogger Bank A, East Anglia ONE, Borssele, Taiwan's Greater Changhua and Changfang-Xidao) still have no as-built hub height (`tools/research/dims_2026-10g_D.json`).
  2. Vietnam: V1-1's foundation (pile groups with caps) and rotor, V1-3's depth, Hiep Thanh's rotor, and Tan Phu Dong 2's turbine field (other leads in `tools/research/vn_2026-10g_E.json`;
     the status of Ca Mau and Soc Trang 1 and Binh Dai's turbine mix are still to be verified).
  3. Northern China: CHN Energy's tender site (chnenergybidding.com.cn) has operation and maintenance tenders that state each farm's foundations: Sheyang H2, H2-1 and Dafeng H4, H6 and H7
     are all monopiles, and Dafeng H12 has 40 monopiles + 40 jackets; also 5 depths and 4 turbine fields. Other leads in `tools/research/cn_fd_2026-10g_F1.json` (Zhuanghe I/II/III, Laizhou,
     Changyi, Bozhong B's 130 m hub and more); Peninsula North BW only started construction in Aug 2024 and was fully connected by June 2025, so its year is to be verified.
  4. Southern China: Shapa phase 1 (39 monopiles + 13 jackets + 3 composite buckets) and phase 3 (22 monopiles + 27 jackets + 12 high-rise pile caps) with dimensions, and Putian Shicheng on high-rise
     pile caps throughout; the Shapa 3 record no longer double-counts the floating "Sanxia Yinling" unit. Close leads: Jiazi II (designed all monopiles), Fanshi II (designed all four-pile jackets,
     no construction record for lot I), Qidong H3 (monopiles inferred from pile counts, not adopted); data doubts: Pinghai Bay area F has no record of its own, Pinghai Bay phase 3's turbine field,
     units missing from Zhuhai Guishan, and the "Zhoushan Liuheng / Zhejiang others" aggregate overlapping Jiaxing 2 (`tools/research/cn_fd_2026-10g_F2.json`).
  5. The OSM count fix from the previous version carries on; new `ne21.com` pages now return 403 (the quotes already checked are in the check cache).
- 7 Oct 2026 (v2.30.3): hub heights, round 9: all 51 operating Chinese offshore farms with a foundation type but no hub height were checked again (three sub-agents in parallel for
  Jiangsu, Guangdong / Hainan / Shandong and the other regions; every quote checked with `check_quotes.py`):
  1. Written: Huaneng Peninsula South 4 (completion environmental acceptance opinion published by the Yantai ecology bureau: hub 102 m, depth about 30 m), SPIC Peninsula South 3 (same: hub 99 m),
     Qingzhou 3 (supplementary sea-use report: depth 41–46 m, rotor 178 m) and SPIC Rudong H4 / H7 (average depth 16 / 19 m). The most useful source: the EIA-versus-acceptance change table
     ("105 m at the EIA stage, 102 m at acceptance").
  2. Data fixes: Guohua Dongtai IV is now 73 monopiles + 2 high-rise pile caps (CHN Energy tender notice, Apr 2026); Fanshi I's turbines (22 Goldwind GWH252-13.6MW + 51 Mingyang MySE14-260);
     turbine fields for Zhugensha H1, H2 and Xuwen; an older rule had turned Xuwen's "north lot of 47 fully connected on 19 Nov 2021" into a whole-farm connection on 26 Nov, now corrected from the source
     (the whole farm's connection date is still to be verified).
  3. OpenStreetMap matching: mixed-model turbine fields now sum their counts (only the first "N x" was read, so "22x … + 51x …" counted 22), which adds Xiangshui, Pingtan Changjiang'ao and Zhuhai Guishan;
     Rudong H8 and Daishan 4, which had matched groups covering only part of the farm, are no longer drawn.
  4. Still leads (`tools/research/cn_hub_2026-10f_A/B/C.json`): Qingzhou 3's "pre-set hub heights" of 110 / 115 m sit in the tender-stage model-selection paragraph; Fanshi I's Apr 2025 sea-use adjustment
     report gives hubs of 151.2 / 155.7 m and rotors of 252 / 258 m (values during construction); Qingzhou 4 (140 m in a report written during construction); Nanpeng Island (parameter table withheld);
     Peninsula South U1 (about 130 m for phase 1, the other units unidentified); Shenergy CZ2 (131 m for the first unit); Changle Waihai A / C (118 m for the first Dongfang 10 MW unit, zone not stated);
     Jiaxing 2 (one lot only); Huizhou Gangkou I and II (the post-construction reports are on land.huizhou.gov.cn, 503 here throughout); Lemen II (the report is only on Baidu Netdisk).
     **A lead that needs an account**: the national CCER registry (ccer.cets.org.cn) lists Rudong H6, H10, H7, H8 and H14, Dafeng H5 and H3 and Dongtai IV; section A.3 of each project design document
     gives the turbine parameters, but downloads need a login (by the project's rules, ask the owner before using a source that needs an account).
     Jiangsu's acceptance documents are mostly blocked by the Nantong ecology bureau (403), and the Yancheng ecology bureau has removed its articles from before Oct 2025.
- 7 Oct 2026 (v2.30.2): the owner asked for the project documents to be brought up to date:
  1. Both READMEs rewritten: a documents table at the top (Chinese and English link for every document), figures updated to v2.30.x (about 31,000 farm
     records, about 9,600 pipeline projects, single-file copies of about 13 / 12 MB, six workflows), the feature list turned into a summary that links to the
     user guide, the "Corrections" list fixed (a repeated France item had split the Crimea sentence), and the sources now credit the 2026 latest-available
     figures, Ember, USWTDB, OpenStreetMap, OSPAR, events and ports.
  2. A new user guide, `docs/user-guide.md` / `.en.md`: every page, the toolbar, side panel, farm cards, layers, Output, tours, URL parameters, the
     single-file copies, phones, data freshness and FAQ; linked from the site footer and "About this site". CLAUDE.md section 1 now says to update the guide
     in the same PR whenever something users see is added or changed.
  3. ROADMAP's "Current status" updated to v2.30.x, with the done state of step 5 and of farm-detail group B and the Taiwan offshore time checks; DEPLOY's
     docs / archive lines and "Maintenance"; the document list in CLAUDE.md (with events listed as generated).
  4. Also fixed: the Learn intro said "twelve chapters" (now 13); the globe's English pipeline caveat said GEM Feb 2025 (now 2026-02); the foundations
     document and the globe legend said "78 Chinese farms from the owner's review, quotes still to be checked", now the actual state (78 Chinese and 14
     Vietnamese records, all quotes checked except Rudong H6 and H10).
- 7 Oct 2026 (v2.30.1): the three follow-ups to v2.30.0 (three sub-agents in parallel, every quote checked with `check_quotes.py`):
  1. Foundations: Lemen I (monopiles), the Longyuan Rudong intertidal demo (37 monopiles + 21 multi-pile jackets), Shapa phase 4 (7 monopiles + 36 jackets) and
     phase 5 (11 pile caps + 23 jackets + 13 composite buckets). The best source type is the "supplementary sea-use reports" the Yangjiang natural resources bureau
     published in 2023 (written after construction, with the actual turbines, foundations and hubs). Still leads (`tools/research/cn_fd_2026-10e.json`): Jiazi II
     (monopiles only in the adjusted design), Changyi (only 25 monopiles known), Fanshi II (only lot II's jackets), Yuhuan 1 (north zone only), Xiangshui
     (sources disagree), Bozhong B and Laizhou (nothing found).
  2. Hub heights round 8: 34 of the 75 farms searched; hubs written for Lemen I, Shapa phase 4 and Guangdong Energy Shaba; Shapa phases 1 (110 m) and 3
     (106–112.5 m) are verified but have no foundation type yet (`tools/research/cn_dims_2026-10d.json`). Shapa phase 2's 111 / 109 m hubs are headed
     "recommended" and are not used. Nearly all of the 41 farms not reached are in Jiangsu (the Nantong ecology bureau's acceptance files are blocked).
     MingYang's MySE6.45-180 has a 178 m rotor: the "180 m" of Huizhou Gangkou phase I and Jiazi I came from the model name and should be checked against each farm's reports.
  3. Data doubts: Xiangshan Tuci is connected (year unverified, the card says so); eight turbine fields corrected; the four Dafeng H8-1/H9/H15/H17 duplicates
     removed; Zhuanghe IV-2 operating; Liu'ao area E back to pre-construction. Jiangjiasha's positions, Pinghai Bay area F, the turbine fields,
     Xuwen's year and Yuhuan 2 were settled in v2.30.5; still to verify: whether the Fengxian Haiwan expansion is on the sea wall or offshore, and Liu'ao area E's position.
- 7 Oct 2026 (v2.30.0): three follow-ups to the previous release:
  1. "Sea zones" adds national offshore wind areas: Japan's 13 promotion zones (`data/global/sources/jpn_promotion_zones.json`, vertices transcribed from each
     designation notice; zones bounded by the shore are drawn as the published lines only) and official open layers of six North Sea countries (Netherlands,
     Germany FEP 2025, Belgium, Denmark's maritime spatial plan, Scotland's Crown Estate Scotland, Norway's NVE; `AREA_SOURCES`, downloaded by the build).
     The Crown Estate layer for England, Wales and Northern Ireland (Wind Site Agreements) has a custom, revocable licence that bars use on a site offering
     "the same or similar services"; the owner decided on 7 Oct 2026 to leave it out. Japan's EEZ "募集区域" (in force from April
     2026) had no published coordinates by October 2026; the 9 promising zones have names only. Germany's FEP is revised yearly: switch to a 2026 WFS when there is
     one; the Danish Energy Agency's own offshore wind layer (with names) blocks automated downloads.
  2. The Hsinchu County site is, in file order, an outer ring with a hole, so all 36 sites are drawn; Taichung 1 is now drawn in file order as two parts (the
     reordered shape was wrong).
  3. Farm record fixes (the 2026-10-07 block of `farm_cleanup.py`): two duplicates removed (Haiwei Peninsula South U = U1 phase 2; Zhangpu Liu'ao Phase 1 = CTG's
     Liu'ao Phase 2, with GEM's area D in `ORPHAN_OK`); Zhuanghe I, Zhuanghe IV-1, the Fengxian Haiwan expansion, Vietnam's V1-1 and Hiep Thanh corrected. After the
     rebuild the OpenStreetMap matching dropped the Zhuanghe IV-1 and Zhuanghe V groups (counts no longer fit; fewer matches rather than wrong ones).
     Hub height round 7: 38 of the 100 Chinese farms without a hub height were searched; written: Shengsi 2, Huaneng Guanyun, Shanwei Houhu (rotor corrected to
     158 m) and Peninsula South U1's depth. Nine more (Lemen I hub 105 m, Fanshi II, Bozhong B, Changyi, Laizhou, the Rudong intertidal demo, Xiangshui, Jiazi II,
     Yuhuan 1) have verified depth or rotor values but no foundation type yet (the build only accepts farms in the foundation table); they are in
     `tools/research/cn_dims_2026-10d.json`, ready to write once a type is found. Data doubts found this round (to verify): Xiangshan Tuci may not be built (a
     2022–23 change report says "approved 2019, not yet built"); Putian Shicheng is 26 × 7 + 3 × 6 MW (Pinghai Bay area F); turbine fields that disagree with
     sources: Huaneng Cangnan 4 (Envision 5.2 MW), Jiazi II (50 × 8 MW), Huaneng Guanyun (46 × 6.45 + 2 × 3 MW), CTG Changyi (50 × 6 MW), Bozhong G (35 × 10 +
     4 × 12.6 MW), Fanshi II (33 × 18 + 25 × 16.2 MW); Tianjin Nangang uses Gamesa G132-5.0 (an onshore model: check it is offshore); CTG Dafeng H8-1 (800 MW)
     spans sites H8-1, H9, H15 and H17; Jiangjiasha H1 · 1 and H2 sit at GEM's rough point in the Yangtze estuary (correct position unknown); GEM's Liu'ao area E
     (404 MW) point is about 130 km south of Liu'ao and its under-construction status has no source; Zhuanghe IV-2 may be built (the gap in Zhuanghe's 1,500 MW
     built) but no direct source; whether the Fengxian Haiwan expansion stands on the sea wall or offshore is unverified.
- 5 Oct 2026 (v2.25.0): after seeing a sample the owner approved "Wind now" (off by default): `tools/fetch_gfs_wind.py` plus the `wind-now`
  schedule (every 6 hours, about 50 KB each). After merging, run `wind-now` once by hand on the Actions tab to check the schedule.
- 5 Oct 2026 (v2.24.0): three more story tours, "Europe offshore", "China's rise" and "Floating wind" (with buttons in the matching Learn
  chapters); card photos now come from hand-checked Commons photos (`tools/farm_photos.py`, 40 farms and 18 milestones), and Wikipedia article
  images are shown only when filed under wind power. Important farms still without a photo are listed under "Farm details".
- 5 Oct 2026 (v2.23.0): the first story tour, "Taiwan's road to offshore wind" (`STORIES` in `globe.js`, 11 stops with bilingual
  narration); the Taichung Power Plant and Taichung Port cards tell how their turbines moved. Other chapters (China's rise, North Sea
  offshore, floating wind) are in ROADMAP phase 3.
- 5 Oct 2026 (v2.22.0): Germany's MaStR: 6,489 farms draw real turbine positions and 4,780 onshore farms (23.7 GW) are added; German
  farm-level coverage 68% → 95%. All three items (actual output, wind speed basemap, MaStR) are done.
- 4 Oct 2026 (v2.19.2): a second check of offshore farms under construction "expected in 2026" (East Anglia TWO/THREE and Ecowende pinned in the
  pipeline matching, Hainan CZ2's year and position corrected and more; see the CHANGELOG).
- 4 Oct 2026 (v2.19.0–v2.19.1): the owner agreed to use OpenStreetMap (share-alike under the ODbL), so 6,886 farms outside the US with
  147,012 turbines now draw their real positions (`tools/fetch_osm_turbines.py` downloads in about 2–4 hours, `tools/build_turbines_osm.py`
  matches; re-run the matching after rebuilding the farm layer); France 2025 onshore and offshore both now come from SDES.
- Current figures (v2.30.18): 285 of 331 operating offshore farms have a known foundation type (87.3% of capacity); dimensions for 278 farms,
  all three for 183; 885 clean-up rules; card photos for 64 farms; 84 of 91 events linked to a farm.
- How research is done: every figure carries a quoted passage (`tools/grab_page.py` to find it, `tools/check_quotes.py` to verify);
  larger batches are split among a few sub-agents working in parallel, their results written as JSON and checked, then the main
  conversation decides what to adopt and writes it into the tables (rules in section 4 of CLAUDE.md).
- The v2.32.0 PR (Belgium and Poland live output) is open and waits for the owner to say it can be merged; no code change is left half-done and no sub-agent is running. In the next
  conversation, first check that the PR is merged, then ask the owner to pick from "Next-step options" above, or to name new work; to carry on with the doubts, pick from the
  leads each round recorded.

### First things to do when work resumes (in order)

1. **The two step-5 rows that still cannot be checked**: the sources for Rudong H6 (100 turbines, all monopiles) and H10 (77 monopiles +
   23 all-steel single-column buckets) are only CTG's own pages and a Maritime Safety Administration notice; from the checking environment the
   TLS connection to eps/www.ctg.com.cn is cut and the MSA page returns 403 (30 Sep 2026). Run `tools/check_quotes.py` on them from a network
   that can reach them. Also only on CTG pages: "280 MW, fully connected March 2021" for Xinghua Bay phase 2 and the later 20 MW prototype at
   Liu'ao phase 2 (both already dropped from the notes).
2. **Differences from GEM 2026-02**: checked one by one on 3 Oct 2026 (v2.17.7) and written into `farm_cleanup.py`; still to follow:
   - Taiwan: Youde (Shinfox, 700 MW) — in August 2026 the Energy Administration said its termination was being processed — and Huanyang
     (EDF's Wei Lan Hai Changhua), also in termination, move to `PIPE_DROP` once that is final; Youde keeps GEM's point (near the Changhua
     coast; the site is about 38 km offshore) until a site coordinate is found. Haiding 3 (GEM's Formosa 3 · 3) was removed in v2.30.5
     (Formosa 3's development rights cancelled in 2025, Corio wound up in April 2026). As of Oct 2026 neither the Youde nor the Huanyang termination has been announced as final (CNA, 26 Sep: the Round 3.3 expansion capacity only takes in the terminated Haixia 1, Haixia 2 and Haiding 2); the economy minister said on 23 Apr 2026 that Huanyang's 440 MW was dead and its site would go into the Round 3.4 tender (UDN), but in July the Energy Administration still called it in termination, so it stays in `PIPE_FIX` (checked again 8 Oct).
   - China: Datang aims to connect all of Danzhou CZ3 site 2 (60 Mingyang 10 MW) by the end of 2026; set it to operating when the grid connection
     is reported ("Datang Danzhou CZ3 (site 2)" in `farm_cleanup.py`); it was still in offshore construction in Oct 2026. Sheyang South H5 (400 MW) only
     lifted its offshore substation in June 2026; Xuwen Donger drove its first pile in Sept 2026; Qingzhou 5 and 7 had only the first 5 units connected in
     Sept 2026 (Yangjiang describes 12–16 MW units, so the turbine fields need checking).
   - Korea: Jwasari still has no construction start or auction award (none of the five winners of the H1 2026 fixed-price auction); waiting for construction evidence. Its point now sits on Jwasari-do
     off Tongyeong (approximate) until a site coordinate is found.
   - Norway's Sørmarkfjellet: the owner has not published the cause of the March 2025 blade failure; the farm closed again on 19 Dec 2025 after
     heavy icing damaged blades, with no reopening notice by Oct 2026 (a temporary stop does not change the status).
   - Next GEM release: build with `CLEANUP_LENIENT=1` first to see the new names, then rewrite the rules one by one; 2026-02 has no retired
     year, and `sources/gem_retired_years_2025-02.json` only covers phases retired by 2025-02.
3. **Time-sensitive checks (another round on 6 Oct 2026)**: Greater Changhua 2b (Wo-Nan, 337.1 MW) has been counted in Taipower's installed
   capacity since 18 Sep 2026, while 4 (Wo-4) still carries note 10, so the project is not yet fully operating; Hai Long stays at 2027 per
   Northland's Q2 report; Taipower phase 2's vessel sailed on 28 Sep with 1 of 31 turbines installed, Taipower aiming to finish by year-end;
   Youde and Huanyang are still in termination (not final, so they stay in `PIPE_FIX`). None of the eight "latest available" sources has a newer
   release, so `tools/latest_wind.py` is unchanged (next: Taiwan's September data in late October, China's Q3 in late October, the US EIA-860M on
   23 October, India and Brazil in mid-October). The live page now takes capacity and the testing flag from Taipower's live data (`syncCaps` in
   `live.js`), so Wo-4 and Hai Long will be counted automatically when their trial operation ends. Next checks are under "Re-check periodically" below.
   Second round (v2.13.3): CTG's Qingzhou 5 and 7 connected their first turbines only on 27 Sep 2026 and go back to under construction
   (due Dec 2026); CGN's Fanshi I and II reached full capacity on 24 Sep 2026.
4. **The rest of foundation step 5**:
   - A second batch of 6 farms was added on 30 Sep 2026 (v2.13.1); 160 of China's 174 operating offshore farms are still "type unknown".
     Leads found but not yet usable: Shenquan II, 50 monopiles (the NetEase "monopile installation completed" article does not open; the
     SASAC and NDRC pages only say "heaviest monopile driven"); Xiangshan 1 phase 2, 36 monopiles + 160 group piles (China Cable Net), with
     the type of phase 1's 41 turbines / 206 piles not found, and GEM's "Zhejiang Xiangshan 1" record covering both phases duplicates the
     curated "Guodian Xiangshan 1 Phase 2"; Datang Danzhou CZ3, 25 suction-bucket jackets (the other 95 unknown); CGN Jiazi I, planned
     70 monopiles + 8 four-pile jackets (secondary technical analysis only); Guoxin Dafeng 850 MW monopiles (only a geotechnical
     consultancy's project page); no foundation type found for Peninsula South U or Bozhong A / B; Xuwen 600 MW only has a "20 monopiles
     driven" record.
   - A third batch of 5 farms was added on 30 Sep 2026 (v2.13.2); 152 of China's 171 operating offshore farms are still "type unknown". Leads found
     but not yet usable (quotes checked, in `tools/research/cn_step5c_2026-09.json`): CGN Nanpeng Island, 73 turbines mostly on four-pile jackets but
     with one 8.7 m monopile driven too (Nanfang Plus), counts per type unknown; Huaneng Cangnan 4, 77 turbines, 466 steel piles and six piles at
     the first position (Hangzhou.com.cn) but also 2,400 t monopiles (Cangnan News), so a mix of high-rise pile caps and monopiles, where "48 caps
     + 29 monopiles" appears only in a search summary with no page found; Changle Waihai C, 57 turbines on 41 three-bucket suction jackets plus
     four-pile jackets (Wison), the jacket count unknown (the CCCC First Harbor page loads dynamically); Huadian Yuhuan 1, 10 monopiles in the
     south section (tender notice), the 22 northern turbines unknown; Rudong H4 / H7 (100 steel piles each), Binhai South H3 (75), Bozhong G
     (7.5 m monopiles) and Yuhuan 2 (the MSA notice says monopile driving) all have their monopile reports only on unreachable sites (BJX,
     in-en.com, hynyw.com, MSA); Huizhou Gangkou phase 2 is on deep-water four-pile jackets, the 40 turbines of phase 1 unknown.
   - A fourth batch of 5 farms was added on 1 Oct 2026 (v2.13.4); 143 of China's 167 operating offshore farms are still "type unknown". The
     Xiangshan 1 lead from batch 2 is resolved (phase 1: 23 pile caps + 18 monopiles; phase 2: 36 monopiles + 20 pile caps). Leads found but
     not yet usable (quotes checked, in `tools/research/cn_step5d_2026-10.json`): the Xuwen 300 MW expansion has all 25 turbines on monopiles
     (CPEM, from the Guangdong design institute), but GEM's single Xuwen record (906 MW) includes the original 600 MW, which still only has a
     "20 monopiles driven" record; Mingyang Qingzhou 4 has 18 turbines on four-pile jackets by Guangzhou Salvage (People's Daily) and the
     type of Longyuan Zhenhua's 25 is unknown; Huaneng Peninsula North BW's tender "reserved 9 positions for jackets, the rest monopiles"
     (CPEM) with no construction record; the EIA of Guoneng Peninsula South U2 phase 2 says monopiles, but it is still under construction.
   - Full sweep on 1 Oct 2026 (v2.13.5): every remaining farm was researched once and 51 were written in; 102 of China's 160 and 11 of
     Vietnam's 24 operating offshore farms are still "type unknown". The leads not written in (quotes checked, in
     `tools/research/cn_vn_step5e_2026-10.json`, each with note and anomalies) fall into three groups:
     (a) tender / EIA or a single bid section only: Peninsula South U1 / U2 (EIA says monopiles), Peninsula North BW (tender: 9 jackets, rest
         monopiles), Shenquan I and II (one section on monopiles each), Jiazi I (30 monopile positions plus a jacket section), Changle Waihai C
         (49 suction-bucket jackets planned), Qingzhou 3 (jacket report only on the unreachable imarine site), Qingzhou 4 (18 jackets), Changyi
         (25 monopiles), Taizhou 1 (section B: 19 monopiles + 1 pile-bucket), Jiaxing 2 (section I: 11 monopiles + 14 caps), Dafeng H8-2, Rudong
         H5, Zhuhai Guishan (phase 1: 34 jackets, phase 2 unknown), Yuhuan 1 (south: 10 monopiles), Ca Mau (only block A's caps confirmed), VPL;
     (b) mixed farms without per-type counts: Cangnan 4 (six-pile caps and monopiles, "48 + 29" unconfirmed), Shengsi 2, Pinghai Bay 2 and 3,
         Pingtan Dalian (7 types), Xiangshui (2 suction buckets), Shapa phases 1 and 4, Zhuanghe II (monopiles + suction-bucket jackets), Laoting
         Putidao (15 caps + monopiles), CTG Dafeng 300 MW (monopiles + composite buckets), Nanri Island, the two Longyuan Rudong demos, SinoHydro
         Rudong intertidal, Danzhou CZ3 (25 suction-bucket jackets);
     (c) nothing found: Qingzhou 6, Fanshi II, Yuhuan 2, Bozhong G, Bozhong B1, Peninsula South V, Peninsula South 3 / 4, Rudong H4 / H7, Rudong
         Baxianjiao, Rudong H3, Qidong H3, Sheyang H2, Guoxin Rudong H2, Dafeng H4 / H6 / H7 / H12, Laizhou wind-fishery, Jiangjiasha H2,
         Zhugensha H2, Xinghua Bay phase 2, Pingtan Changjiang'ao, the Zhoushan sites other than Daishan 4, Fengxian, Dongtai V, Rudong H15 / H14,
         Nan'ao Lemen, Shapa phases 3 / 5, Changle B, Liu'ao phase 1, Jiazi II, Nangang, Lingang phase 2, Pinghai Bay phase 1, and in Vietnam
         Bac Lieu phases 1–3, Hiep Thanh, Tan Phu Dong 2, V1-1, Soc Trang 1, Ben Tre V1-3 and Tan An 1.
   - Anomaly check (3 Oct 2026, v2.16.1): all 72 anomalies were re-checked and written as 70 clean-up rules (4 removed, 14 merged, 52 corrected;
     see the 2026-10-03 block of `docs/data-cleanup.en.md`). The curated "CGN Jiaxing 2 (Zhoushan Daishan 4)" and "Guohua Rudong H14" were
     merged into GEM's Daishan 4 and Rudong H14 by the 2026-10-04 rules; Xiangshan Tuci, Bozhong B1, Dafeng H10, the Zhoushan Liuheng aggregate,
     Binhai South H3, Tan An 1 and Hoa Binh 1/2 were settled in v2.30.5 and Peninsula South U2 in v2.30.6.
   - Mixed farms still without per-type counts: Xiangshui and Yangjiang Shapa phases 1–5; farms that only say "fixed": Fuqing Xinghua Bay
     and Qingzhou 6. Leads are in `tools/research/cn_mixed_2026-09.json` (Shapa phase 1's 39 monopiles / 10 jackets / 3 + 3 suction buckets
     appear only in a secondary article and are unchecked; phases 2–5 only have provisional tender numbers); add them once a first-hand
     source is found (for example CTG completion records the owner may have).
   - Fifth batch on 6 Oct 2026 (v2.27.0): 15 farms from construction, completion or completion-acceptance records (quotes checked): Lemen II,
     Shenquan I and II, Qingzhou 3 and 4, Peninsula South 3, 4 and V, Rudong H4 and H7, Shengsi 2, Zhugensha H2, Jiaxing 2, Fengxian and
     Changle Waihai C; Changle Waihai A's note now says it has jackets of two kinds (four-pile and suction-bucket). Leads not yet written are in
     `tools/research/cn_leads_2026-10b.json` (Huadian Yuhuan 1's south zone has only a self-media summary and a tender, Zhuanghe III only 55 units,
     Peninsula South U1 phase 2, Huaneng Yuhuan 2, Rudong H2 and H3, Sheyang H2, Dafeng H7, Cangnan 4, and Danzhou CZ3 — now split into sites 1 and 2, with 25 suction-bucket jackets among site 1's 60). Most promising: a Zhuanghe city
     page (dlzh.gov.cn, unreachable from here) reportedly gives Huaneng Zhuanghe II as 40 monopiles + 20 suction-bucket jackets; check it from another network.
     A good source type: search "<farm> 竣工环境保护验收调查报告" (completion acceptance reports published by local governments state the as-built type).
   - Sixth round on 7 Oct 2026 (v2.29.0): all 64 + 9 searched again, 3 written (Peninsula South U1, Lingang Phase 2, Hiep Thanh). Leads are in
     `tools/research/cn_vn_dims_2026-10c.json`; the closest to writable: Huadian Yuhuan 1 (22 pile caps in the north zone have a construction record; the
     10 south-zone monopiles only a tender and self-media), Longyuan Rudong 150 MW demo phase 1 (38 units: 17 monopiles + 21 multi-pile jackets; phase 2's
     20 unknown), Putian Shicheng (lot II: 19 pile caps of 29), Taizhou 1 (lot B: 19 monopiles + 1 pile-bucket), Changyi (25 monopiles), Danzhou CZ3 site 1
     (25 suction-bucket jackets) and Zhuanghe III (55 of 73).
     The data problems noted in this round were checked and fixed in v2.30.0 (see the v2.30.0 entry under "In progress").
   - The other Chinese offshore farms (38 of the 141 operating in v2.30.11) and Vietnam (5 of 20, mostly intertidal; the owner's workbook only says
     intertidal / nearshore, no sub-type) are still "type unknown".
   - Same route as the first four steps: research notes in `tools/research/` (a quoted passage for every source, checked with
     `python3 tools/check_quotes.py file.json`, using only OK results) → rows in `tools/farm_foundations.py` with `F5(...)` (the count of
     Chinese farms in the docs is computed) → data problems found on the way into `tools/farm_cleanup.py` → rebuild and checks → site text
     (`fdStep` and the sources dialog in `assets/js/globe.js`, `assets/js/learn.js`) → the version number and both changelogs → Playwright
     at desktop and phone widths, the single-file copy online and offline → delete the notes in `tools/research/` once they are in the table.
5. **Two Danish foundation types**: settled (Nissum Bredning Vind on jackets, v2.30.5; Rønland on caps over 48 driven concrete piles each, v2.30.6).

6. **Dimension gaps** (after the fifth round, v2.17.6; the values found but not used, and why, are kept here to avoid re-checking):
   272 operating offshore farms have at least one value (depth 247, hub height 193, rotor diameter 245, all three 182; after the tenth round, v2.30.4).
   Of the 284 operating farms with a foundation record, 12 have none of the three (11 in China) and 91 lack a hub height (56 in China, 13 in Vietnam, 7 in the UK).
   Found in the sixth round but not used: Kentish Flats Extension 83.6 m (the configuration it "will have" at the 2014 investment decision, not an
   as-built record), Seonam (MOTIR's 2015 plan values, 80/90 m), Shenquan II (about 128 m for the 11 MW units, only 34 of 50), Provence Grand Large
   (only a 174 m tip height and 75 m blades; blade length is not the radius). Unreachable: Iberdrola's East Anglia ONE PDF (403) and the Rudong
   H6/H10/H4 completion acceptance files (Nantong Ecology and Environment Bureau, 403).
   Nothing quotable after five rounds: Vietnam's intertidal farms (no depth at all), most Chinese farms of 2019–2021, in Europe Lynn and Inner
   Dowsing, Kentish Flats Extension, East Anglia ONE, Hornsea Two, Dogger Bank A and Borssele III–V, the hub heights of Taiwan's Greater Changhua
   1 & 2a and Changfang & Xidao, and the hub height of Rudong H8's main H171-5.0 type.
   Found but deliberately not used: consent limits or design ranges (Kentish Flats Extension 85 m, East Anglia ONE ≤ 120 m, the CVOW pilot's
   104–111 m), the column on a floater (CNOOC Guanlan: 83 m or 105 m), heights of unclear meaning (Shapa phase 2's 112 m, Zhuhai Jinwan's 100.63 m
   nacelle lift height, only overall or tip heights for Dogger Bank A and Hornsea Two, Blyth's approximate 105 m from consent), values for some units
   only (Huizhou Gangkou phase 2's 8.5 MW units at 135.9 m, Rudong H8's Shanghai Electric 4 MW units at 93 m, CR Cangnan 1's 10 MW units at 127 m
   (ccshj6.com unreachable), a MySE14-260 source for Fanshi I that does not name the farm) and values in the wrong field (Tethys' "Hub Height 200 m"
   for Hornsea Two is the tip height; Chinese Wikipedia's "hub height 167 m" for Greater Changhua is the rotor diameter).
   Leads worth retrying: Soc Trang 7's hub 96.5 m above the foundation (sigma.net.vn, consistent with the stored 105 m tower); the Qingzhou 2 EIA PDF
   (gdee.gd.gov.cn, no response), Nanpengdao (eworldship, SSL error), the Walney Extension scoping report (502).
   Data doubts corrected: the four from the third round (Guohua Rudong H14, Jiaxing 2 / Daishan 4, Rudong H8, Dafeng H5; v2.17.4), Tan Phu Dong 1's
   turbines from the fourth (v2.17.5) and Fuqing Haitan Strait's turbines and capacity from the fifth (v2.17.6). The onshore farms the build had
   merged away were restored in v2.17.3, and the build now checks for such cases (`ORPHAN_OK`).
   The three open turbine models were settled in v2.17.6: Wailuo phase 1's MySE5.5-155 has a 158 m rotor (the model name is not the diameter);
   Zhong Neng is V174-9.5 (the association page's V164 is wrong); Provence Grand Large is SWT-8.0-154 (run at 8.4 MW, 75 m blades; the source is
   RTE's 2020 project dossier, and construction-stage reports only say 8.4 MW).

## Major events & incidents (data/global/sources/events_2026-09.csv → tools/build_events.py, 2026-09-28)

- [ ] Adding an event: add a row to the CSV (same columns) → add the English title, summary, area and notes to `EN` in
      `tools/build_events.py` and any matching farm to `FARMS` (exact name from `wind_farms.json`) → `python3 tools/build_events.py` →
      version and both changelogs. The build checks that every event has English text and that farm names match.
- [x] Second batch (WIND-060 to 088) checked source by source with `check_quotes.py` on 2026-09-29 (all 54 sources OK; corrections in
      CHANGELOG v2.12.3). The four details that were only in the notes (Lemnhult date, Delta 6 date, Maverick farm name, Screggagh root cause)
      were checked against openable sources in v2.12.4; still unchecked and kept only in the notes: the Maverick turbine make (GE, KFOR 403)
      and the Screggagh wind speed of 9–10 m/s (E&T 403).
- [ ] 7 events not yet linked to a farm (re-checked in round 18, v2.30.13; the other 7 are now linked): WIND-008 Kunimidake (the 2002 farm, 2 × 900 kW, is not in the layer; only the 2027
      project is), WIND-010 (the South Australia blackout; AEMO names nine farms), WIND-034 Ocean Wind 1/2 (cancelled, not in the layer), WIND-063 Miyakojima 2003 (Okinawa Electric's Karimata and
      Shichimata test units, not in the layer), WIND-064 the Awaji park turbine (a single municipal turbine), WIND-065 Hornslet (Hyacintvej, five 600 kW turbines, not in the layer) and WIND-088 (the
      reports do not name the farm). Add to `FARMS` when found; never guess.
- [ ] Events without coordinates: those linked to a farm are placed at the farm (the card says so), the rest appear only in the Events tab and
      clicking them flies to the country; add coordinates to the CSV only from a primary source (Miyakojima and Hornslet currently use approximate
      town positions, stated in the coordinate note).
- [ ] Photos are recorded as page URLs with their rights status only (the CSV says each needs the rights holder's permission); obtain
      permission before showing any of them on the site.
- [ ] Casualties and root causes are recorded only when officially confirmed: the Noshiro Port oil leak (WIND-031), the February Yeongdeok
      tower buckling (WIND-053), the Mailiao fire (WIND-057) and the Greater Changhua 4 fire (WIND-058) still await official findings; update the CSV when they are published.
- [ ] The timeline ends at 2025, so 2026 events show at the latest year; once `wind_global.json` extends past 2026 the `evShown` special case in `globe.js` can go.

## Re-check periodically (time-sensitive, not code problems)

- [ ] CTG Yangjiang Qingzhou 5 and 7 (1,000 MW each, 163 turbines together): first 5 turbines connected on 27 Sep 2026, and Yangjiang's
      2025 key-project list gives December 2026 for commissioning; once fully connected, change `st=1, year=2026` in the two rules in
      `tools/farm_cleanup.py` to operating (CTG's own site is unreachable; the Yangjiang city government or China News Service report it).
- [ ] Taipower Offshore Phase 2: on 30 Jul 2026 Taipower took over turbine installation under the contract and agreed terms with Vestas,
      30 turbines to go, grid connection targeted for year-end (CNA); completion is still given as "2027". Check at year-end whether it
      connected and update the `FARMS` array in `assets/js/live.js` (`id:"offshore2"`) if needed
- [ ] Greater Changhua 2b & 4 (Ørsted, 920 MW): completion ceremony on 1 Sep 2026, now in O&M; Wo-Nan (2b) has been counted in Taipower's
      installed capacity since 18 Sep 2026 (updated in v2.27.0) while Wo-4 is still in trial operation; when Ørsted announces full commercial
      operation, set the last `tl` row of `id:"wo4"` / `id:"wonan"` to done, `cod` to the month, and the globe's "Greater Changhua 2b & 4" to
      operating (events list WIND-059: completion
      ceremony on 2026-09-01, the English notice says final commissioning is pending; WIND-050: the 2b export cable was damaged in 2025-08;
      WIND-058: one 14 MW unit of phase 4 caught fire on 2026-08-08)
- [ ] Hai Long (Hai Long B): Northland's Q2 2026 report (12 Aug 2026): 71 of 73 turbines installed, 59 generating, commercial operation
      in 2027; follow the Q3/Q4 reports and the commercial-operation announcement and update `id:"longB"`
- [ ] Left to verify from foundation step 4 (Sep 2026): the present state of the Jeju Woljeong test site (no output reported after 2016; nothing new on 8 Oct 2026);
      KEPCO Research Institute's Doosan 3 MW test turbine on a suction bucket at Gunsan port (installed at sea in October 2016, about 200 m from the shore; RVO's
      "on land" is wrong) has no record: OSM has two KEPRI-operated turbines with navigation lights off Gunsan port (nodes 9166584284 and 11773837241), but each is
      tagged 1.5 MW and 2017, which does not fit one 3 MW unit of 2016, so they are not used. (Setana's stop year is now 2024 from the town council minutes, v2.30.7;
      Formosa 1 Phase 1 is confirmed as SWT-4.0-120, and Choshi is still running and now uses TEPCO RP's published position, v2.30.6)
- [ ] Points that are still approximate (Sep 2026): Jeonnam Offshore Wind 1 (about 9 km north-west of Jaeun-do; searched again on 8 Oct 2026: no coordinates in OSM, navigational warnings or EIA documents), Kamisu Phases 1 and 2 (the OSM
      turbine names do not match the official counts), Eurus Akita Port (no source says which unit stands in the water) and Sunrise Wind (the centre
      of its BOEM lease area; the 84 OSM points are "provisional WTG placement" without a farm name). Yeonggwang Wind's 15 intertidal turbines now use
      the OSM wind-farm relation (v2.30.6)
- [x] Farm-by-farm check for the "2026 (latest available)" point (v2.18.0): Kitakyushu Hibikinada, Goto, EFGL and EolMed now operating
      in 2026; Hai Long, Taipower Phase 2 and Dogger Bank B/C moved to 2027; Baltic Power corrected to 1,140 MW and Windanker to 315 MW
      (rules in `tools/farm_cleanup.py`)
- [ ] Still under construction; watch for full commercial operation (research notes with checked quotes in `tools/research/farms_2026_status.json`):
      Vineyard Wind 1 (commercial operation declared 2026-04-24 but 36 turbines still idle in June, so kept under construction under the
      whole-farm rule), Greater Changhua 2b&4 (final commissioning), Revolution Wind (last turbine installed in September, COD expected this year),
      Yeonggwang Nakwol, Sofia (HVDC link in testing), Dieppe-Le Tréport, Qingzhou 5 and 7; Windanker due to finish by year-end and be fully
      commissioned in 2027; also Baltic Power and Bac Lieu 3 (its Q2 2026 target has passed). The CVOW commercial project, Sunrise Wind and Empire
      Wind are due in 2027. Re-checked on 2026-10-04 (v2.19.2): none of the above is in full commercial operation yet; CTG's 16 MW Three Gorges
      Lead is installed, grid connection unconfirmed; Hainan CZ7 phase 1, CZ9 phase 1 and Xuwen Donger now have an unknown completion year, to be
      filled in when announced. Re-checked on 2026-10-07 (v2.30.6): Vineyard Wind 1 said in September that "all turbines are capable of producing power"
      but has announced no full COD; Revolution Wind expects COD later this year; Baltic Power has all 76 turbines installed and over a third generating;
      Dieppe-Le Tréport had 31 of 62 installed in September; Sofia expects the end of the year; Bac Lieu 3 and Soc Trang 1 (Cong Ly) were promised for
      Aug–Sep by the owner and still had no announcement in October. All stay under construction; Windanker's year is now 2027
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

- [x] The 9 "suspected duplicates A": done (Japan's Enshu Kakegawa and Kakegawa are confirmed as two neighbouring farms, v2.30.7)
- [x] The 12 countries whose farm sum was above 110% of the national figure: after GEM 2026-02 there are 5 — Chile, Morocco and Ethiopia
      (farms connected in 2025 that IRENA's 2025 figures do not count yet), the Philippines (Pagudpud) and Iran
- [x] Duplicates found while adding live data: Whitla (Alberta), Snowtown, Bluff Point (Tasmania) and
      Yambuk (Victoria)
- [x] Shared coordinate points: the map fans the farms out around the point and their cards say the
      position is schematic (`flags` 4)
- [ ] 130 shared coordinate points remain (1,310 operating farms, mostly province-centre placeholders in
      China): add real coordinates from a newer GEM release or local data
- [ ] Items the clean-up could not find or confirm: Vietnam's Song An (46.2 MW) is operating, but its COD fell between Nov 2023 and May 2024 and the date
      is not published (year left blank; nothing new on 8 Oct 2026); GEM's point for Bac Lieu's Dong Hai 1 phases 1–2 is under 1 km from an OSM Hoa Binh 2
      turbine while the farm is in Long Dien Dong commune, with no citable coordinates (phases 3 and 4 use the same point for now) (CGN Taizhou 1 and Guoxin
      Sheyang H1 were handled by the 2026-10-04 rules; the Kemi Ajos history and the Dominican gap were settled in v2.30.6, Erbes-Büdesheim and Dong Hai V1-4 in v2.30.7)
- [ ] Farms missing from the data (found while checking; no citable coordinates, so not added yet): TDC's Lac Hoa 1 in Vietnam (Soc Trang No. 5: 25 of its 30 MW at COD in
      2021, the other 5 MW still not filed in Apr 2025), the 3 MW test turbine at Gunsan port in Korea, and China's 6.2 MW "Fuyao" floating unit (below).
      (Lac Hoa 2, Cho Long, Pantelimon and Carreto were handled in v2.30.6; Thailand's Hanuman 10 was in GEM all along, wrongly dropped, and is back in v2.30.7)
- [x] "Suspected duplicates B" (different names, same capacity, close by): all checked in v2.30.7 (none left): the 7 German pairs were re-matched or confirmed
      as different farms from owner and municipal sources, and the 4 Chinese pairs are all different farms. GEM's Lichtenau (11 MW, 1997, RWE) is part of
      Windpark Asseln (GEM's Paderborn) and was removed as a duplicate in v2.30.8; the MaStR matching around there was sorted out in v2.30.10 (item 3 of round 15 under "In progress")
- [x] 587 pipeline projects whose expected year had already passed (101 GW): only 2 remain after GEM 2026-02 (Monsoon in Laos, 600 MW,
      and BPP Vĩnh Châu in Vietnam, 30 MW, both under construction and expected in 2025)
- [ ] 640 operating farms, 31.1 GW, have no commissioning year (v2.30.18; mostly in India, China, Spain and Italy), so the map can
      only show them from 2025: add years where they can be found (rounds 18–23 checked about 1,060; leads under "In progress")
- [x] Germany filled from MaStR (v2.22.0): farm-level coverage 68% → 96%; the suspected duplicates were cleared in v2.22.1 (Flomborn-Stetten's
      misplaced point corrected, the other 7 pairs confirmed as different farms and listed in `NOT_DUP` in `farm_cleanup.py`)
- [ ] Large countries with low coverage (after GEM 2026-02: China 98 GW short, India 16 GW): assess filling
      the gap from national registries (see phase 1 in the ROADMAP)
- [x] Duplicate farm records: the US Sunrise Wind appeared both as GEM's "Sunrise wind farm (United States)" and as "Sunrise Wind" from the 2026 compilation (both 924 MW, under construction); merged into one record in foundation step 4, at the centre of BOEM lease OCS-A 0487 (Sep 2026, v2.10.0)
- [x] Two Dutch duplicates (found while matching foundations): Borssele V and GEM's “Borssele Site V”, and Irene Vorrink and
      GEM's “Dronten”, were checked and merged (Sep 2026, v2.8.0)
- [x] Dogger Bank pipeline projects: GEM 2026-02 lists phases B and C together as one record under construction (2026), so the list's B and C
      are in `PIPE_DROP`; D and the two Dogger Bank South projects are mapped explicitly (`PIPE_SAME`), and the matcher now lets only the
      first list project update a given GEM record (v2.13.0)
- [x] France 2025 onshore and offshore now use the SDES grid-connected capacity at end-2025, 23,992 / 2,008 MW (v2.19.0; the owner decided on 2026-10-04 to change both; `FRA_SDES` in `tools/extract_global_data.py`)
- [x] Offshore farm sums above the national series (in v2.30.6 China has 141 records and 47.2 GW, Vietnam 20 and 1.26 GW): after v2.30.5 removed duplicates and aggregates and moved unfinished farms to under construction, China's 140 operating offshore records add up to 46.6 GW (44.1 GW with years up to 2025), below the 2025 national figure of 48.4 GW; Vietnam's 19 add up to 1.2 GW against about 1.0 GW, and the gap cannot be attributed farm by farm (IRENA does not publish how it classifies intertidal farms).

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
- [x] Duplicate farm records found while compiling the ports (GEM 2026-02 merged them itself and "EW Baltica 2" no longer appears; confirmed in v2.30.7, when the list's
      Baltica 1 was also mapped to GEM's Baltica I): Poland's
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
- [x] Farm details v2, first step (v2.18.0): estimated yearly output (Ember national capacity factors), distance to shore (computed from the
      coastline), turbine count, model and size for US farms (USWTDB), with the close-up drawing the real turbine positions
- [x] Turbine positions in other countries (v2.19.1): OpenStreetMap (ODbL) matched to 6,886 farms and 147,012 turbines
- [x] Actual yearly output (v2.20.0): US from EIA-923, Taipower-owned farms in Taiwan from Taipower open data 17140
- [x] Taipower-owned farms checked against Taipower's station list (v2.22.1): Luzhu 7.2 MW / 2015, one turbine left at Taichung Power Plant,
      Taichung Port 35 MW, Wanggong 23 MW, Yongxing and Taixi 9.2 MW, Longmen 9 MW corrected, Zhongtun dismantled in 2025; actual output now for 18 stations
- [x] Taipower data checked (v2.24.3, from Taipower's monthly reports): Datan's unit #3 was decommissioned in June 2025, leaving 7 turbines and 13.6 MW
      (the station list's 15.1 MW predates it); Yongxing in commercial operation from 28 December 2020; Longmen connected on 1 June 2022; Taipower
      Offshore Phase 1 now sits at the centre of its 21 turbines mapped in OpenStreetMap (23.986 N, 120.242 E)
- [ ] Still open for Taipower data: private farms have no official per-farm figures (T-REC certificate volumes are not total output). (The start
      years of Taichung Power Plant, 2006, and Taichung Port, 2007, were corrected from the Control Yuan's 2010 investigation report in v2.27.0.)
- [ ] Important farms still without a checked photo (nothing usable on Commons in Oct 2026; `tools/farm_photos.py`): Greater Changhua 1 & 2a and
      2b & 4, Changfang & Xidao, Zhong Neng, Yunlin, Hai Long, Taipower Offshore Phase 2; Vindeby, Hornsea One/Two, Dogger Bank, Moray West,
      Seagreen, Hollandse Kust Zuid, Gemini, Borssele; Yangjiang Shapa, Yinling, the Fukushima demonstration, Hywind Tampen, Kincardine,
      Provence Grand Large, Goto; milestones V66 prototype, V236, Vineyard Wind 1, Mingyang 20 MW, Dongfang 26 MW. Add them when Commons gets
      new photos or an owner offers one under a free licence (look at each one). Event photos: Commons has no freely licensed photos of turbine
      damage from Typhoons Jangmi, Soudelor, Megi and others.
      Searched again on 6 Oct 2026 with nothing usable: Greater Gabbard, Triton Knoll, Kriegers Flak, Horns Rev 2/3, Lincs (cannot tell which farm),
      Lake Turkana (the photo is a portrait), Northwind and Macarthur (no Commons category for the farm); the photos in the Hornsea category date
      from 2017, before any turbines stood, so do not use them.
- [ ] The rest of farm details v2: other national registers (Danish turbine register, UK REPD; Germany's MaStR done in v2.22.0) could fill positions
      OSM lacks (OSM maps few turbines in China); a common turbine-model table
      (only about 14% of capacity has a model string, so limited value); per-farm actual output elsewhere (UK REPD / Ofgem and others; Australia's AEMO done in v2.28.0)

## Offshore foundation types (collected step by step, owner's decision of 2026-09-27; see item 2 of "Owner's new plans (Sep 2026)" in ROADMAP.en.md)

- [x] Step 1: Europe within OSPAR's coverage (North Sea and NE Atlantic): 99 farms — per-farm table `tools/farm_foundations.py`,
      checks and output by `tools/build_foundations.py`, and the globe's “Offshore: foundations” layer (Sep 2026, v2.7.0;
      farm-by-farm list in [docs/foundations.en.md](./docs/foundations.en.md))
- [x] Step 2: the rest of Europe (the Baltic, the Mediterranean, the IJsselmeer) plus farms finished after OSPAR 2024: 41 farms,
      each with a source whose quoted passage was checked; Hohe See and Belwind's Haliade demonstrator, left over from step 1,
      now have sources too; 26 more rules corrected farm records (Sep 2026, v2.8.0)
- [x] The Frederikshavn test site in Denmark: only the Nordex N90/2300 is left at sea; capacity set to 2.3 MW and the point moved to it (v2.30.6); its
      foundation is only described as "a heavy-duty foundation tied to the seabed by means of planking and piles", so it stays in `EXCLUDED`
- [x] Step 3: floating farms: 19 get a sub-type, 15 of them operating; 20 more rules corrected the data (GEM's BiMEP test-site
      capacity was removed) (Sep 2026, v2.9.0)
- [ ] Floating units in China: CSSC Haizhuang's Fuyao was added in v2.30.8 (position inferred from the MSA notice and the cable in the EIA approval; item 2 of round 14 under "In progress"; the notes below predate it): Fuyao
      6.2 MW (2022, Luodousha off Zhanjiang, [National Energy Administration](http://www.nea.gov.cn/2022-06/24/c_1310631921.htm); running
      on a micro-grid; whether it reached the public grid is unverified; MSA chart-correction notice 795/2026 lays a cable at Luodousha to a single turbine at
      20°18′50.4″N 110°34′48.7″E, very probably this one, but the notice does not name the unit, so it is not added yet) and Longyuan's Guoneng Gongxiang 4 MW three-column
      semi-submersible (added in v2.17.2 at an approximate location; grid-connected June 2024, off Nanri Island, Putian, Fujian; [China Daily](https://fj.chinadaily.com.cn/a/202406/28/WS667e79dba3107cd55d269125.html),
      [SASAC](http://www.sasac.gov.cn/n2588025/n2588124/c33362365/content.html)); CTG's Sanxia Linghang 16 MW semi-submersible was installed on 2026-05-02
      but no grid connection has been reported by October 2026, so it stays under construction (moved to its area more than 70 km offshore,
      near Qingzhou 5 and 7, approximate); CNOOC's Haiyou Anlan 16 MW tension-leg platform was added in v2.24.3
- [x] Mingyang's OceanX is not double-counted (checked in v2.24.3): Qingzhou IV's 500 MW is 44 fixed-bottom turbines, and OceanX started
      separately on 2024-12-11
- [ ] CTG Shapa: phase 5 is now 300 MW (v2.27.0) per the Yangjiang development and reform bureau, the Guangdong EIA approval, Mingyang's award
      notice and CTG's listing announcement, and the six records add up to exactly CTG's 1,705.5 MW and 269 turbines. Left: 171 units of 6.45 MW
      were designed and 170 built; the missing one is in phase 3 (replaced by the floating "Sanxia Yinling"); phase 2's 62 units are of two models,
      Mingyang MySE6.45-180 and Goldwind GW171/6450 (v2.30.6), split unknown
- [x] Korea's Ulsan 750 kW floating pilot: never went to sea (Ulju County rejected its design four times; KISTEP said in 2025 that Korea has no case of
      transporting and installing floating offshore wind), removed in v2.30.6
- [x] The UK's Pentland: GEM's two records are the same project (the current data has only "Pentland wind farm"); v2.24.3 sets 2030 as the
      planned year and moves it off Dounreay; if a later GEM release brings back the other record, merge it with a dup rule
- [x] Step 4: Taiwan, Japan, Korea and the USA: 36 farms (Sep 2026, v2.10.0)
- [ ] Step 5: China and Vietnam (the owner decided on 2026-09-27 to keep collecting step by step): 5 Chinese farms added (v2.11.0, v2.11.1); the rest is item 4 of "First things to do" at the top

## To assess / waiting for the owner's decision (do not start on your own)

- [x] Extend the timeline to "2026 (latest available)" (v2.18.0): official figures for 8 countries (`tools/latest_wind.py`); the others carry end-2025, shown hatched.
      Refresh the table quarterly (Taiwan EA monthly table, US EIA-860M monthly; China quarterly briefings; Germany WindGuard half-year reports;
      France SDES and UK DESNZ quarterly); in early 2027 merge the full 2026 statistics into `wind_global.json` and move the table to 2027
- [ ] Whether to give `grid_status` (supply/demand) a long-term archive and trend chart, following the
      wind data's "live → 7 days → 90 days" layers
- [x] Whether to expand to other energy sources: discussed with three mock-ups on 2026-10-04; the owner decided to stay with wind
      for now and discuss it again later (conclusions and decisions to keep are in "Directions evaluated and deferred" in ROADMAP.en.md)
- [ ] Whether to try to get past the WAF 403 on the live supply/demand source (needs a different
      execution environment, e.g. a self-hosted runner or a non-cloud-CI host; changing code alone
      cannot fix it)
- [ ] Live wind data from more countries (assessment in [docs/live-data-sources.en.md](./docs/live-data-sources.en.md)):
      Australia NEM, Alberta and Ontario were added in Sep 2026; the UK (estimates), the Dutch NED and ENTSO-E
      (free key, stored as a GitHub secret) are still to be decided
- [x] Whether the "Sea zones" layer should include The Crown Estate's offshore wind lease areas for England, Wales and Northern Ireland: the owner decided on 7 Oct 2026 to leave them out (Wind Site
      Agreements, downloadable without an account; its custom The Crown Estate Open Data Licence is revocable and bars use on a site offering "the same or
      similar services" to its portal; credit "Contains data provided by The Crown Estate…")
- [x] How to classify the "low pile, tall pedestal" (低桩高台柱) foundations (20 units at SinoHydro Rudong Intertidal; cap buried below the mud, a tall column carrying the tower): the owner decided
      on 9 Oct 2026 to add a type "low pile cap" (`lp`, v2.30.12), in the "other fixed" colour group (colour-blind check re-run, map colours unchanged)
- [ ] The priority order of the phases under "Next steps" in the ROADMAP

## Operations

- [x] Monthly keepalive workflow (`.github/workflows/keepalive.yml`, Sep 2026): re-enables the schedules through the GitHub API on the
      1st of each month so they are not disabled after 60 days without activity
- [ ] Check once a month that the data time and Actions look right, and trigger a run by hand if needed (steps under "Maintenance" in DEPLOY.en.md)
- [x] PR checks (`.github/workflows/pr-check.yml`, v2.28.0): smoke test, syntax, coordinates, generated documents, version and changelogs
- [ ] To verify for Australian measured output: Gullen Range is 165.5 MW on the site (73 Goldwind turbines) but AEMO registers 275 MW over two units; GULLRWF2
      (110 MW, 2020) is the Biala farm, which connects through the Gullen Range substation (AEMO name "Gullen Range 2"; mapped in `MANUAL` of `build_live_units.py`
      in v2.30.7, so Gullen Range itself maps only to GULLRWF1); Moorabool North and South share one unit, so their output cannot be split and is left out; the Crookwell II
      record includes Crookwell 3 (2024), so its first year with both parts generating all year is 2026
- [x] The long-term archive was split into monthly files on 30 Sep 2026 (`data/archive/wind_history_archive_YYYY-MM.json`), so the weekly
      backfill only rewrites the current month; the single-file builds now go to a Release instead of git

## Deferred — no need to research again (clear reasons in "Directions evaluated and deferred" in ROADMAP.en.md)

- Energy Administration monthly/annual statistics API (too coarse, overlaps existing data)
- Central Weather Administration buoy data (few buoys, most far from the farms, low benefit)
- Ministry of Environment offshore-wind ecological monitoring data (mostly unstructured PDFs, nothing
  machine-readable yet)
- Work-vessel status: live AIS positions and Taiwan International Ports Corporation port calls (the owner
  decided on 2026-09-27 not to do it)
- Other energy sources (solar, nuclear, fossil, hydro, etc.) and an energy-transition comparison (mock-ups made on
  2026-10-04; the owner decided to defer it and discuss again later)
