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

## v2.28.0 — 2026-10-06

- The Output dialog adds Australia: measured yearly output and capacity factors of 62 farms from the MMS Data Model monthly archive of the
  Australian Energy Market Operator (AEMO) — each unit's 5-minute SCADA output summed, 2023–2025, credited under AEMO's copyright permissions.
  - Units are linked to the site's farms through the same mapping as the live output; units shared between farms are left out, as are farms whose AEMO
    registered capacity differs from the site record by 15% or more.
  - New farms often connect in stages and are held to part of their output by AEMO for six months to a year, so a year is left out when the farm was not yet
    generating in January of the year before, its registered capacity changed, or under 98% of the 5-minute data is present.
  - 2025: 60 farms and 10,030 MW (about 66% of the site's operating Australian capacity), median capacity factor 30.6%; for example Woolnorth 39.3%,
    Stockyard Hill 39.1%, Hornsdale 38.5% and Rye Park 35.1%. Measured output includes curtailment and self-curtailment at negative prices (Macarthur was
    almost idle in June and July 2024 and reached 13.3% for the year).
  - Check: Macarthur's 2022 and 2023 output is within 0.01% of the yearly figures English Wikipedia compiles from AEMO data.
  - New tool `tools/au_output.py` (downloads and aggregates the AEMO monthly files into `data/global/sources/aemo_wind_monthly.json`). Australia's country
    profile gains the "Output rankings" button.
- Capacity factors in every country now divide by the hours in the year: 2024 (a leap year) uses 8,784 hours, so the 2024 factors of the US, Taiwan and
  Denmark drop slightly (about 0.1 percentage points).
- Data corrections found against AEMO's registered capacities (every quote checked): Rye Park 327 → 396 MW (66 Vestas V162-6.2 run in 6.0 MW mode);
  Cullerin Range 26 → 30 MW; Lal Lal's model corrected to Vestas V136-3.45 (3.8 MW each).
- The unit mapping for live output in Australia and Canada was rebuilt: Lal Lal's Yendon and Elaine sections and Crookwell 2 and 3 now map to the right farms
  (Crookwell 2 and 3 had been counted on the 4.8 MW Crookwell 1 of 1998), and a few mappings broken by farm renames (Goyder South, MacIntyre, Wambo,
  Forty Mile, Paintearth) work again.
- Automatic checks on every pull request (GitHub Actions `pr-check`): a Playwright smoke test walks every page at desktop and phone widths and opens both
  single-file copies over `file://` online and offline, plus syntax, farm coordinates, generated documents being up to date, and the version and both
  changelogs when the site changes (`tools/smoke_test.js`, `tools/check_version.py`, `qa_farms.py --max`).

## v2.27.0 — 2026-10-06

- The Output dialog gains "Taiwan · live samples": Taipower's live data (each unit's instantaneous output every 10 minutes), sampled every 2 hours and
  accumulated, compares the average output, capacity factor and same-model performance of every grid unit **including private farms** (last 30 or 90 days, or everything).
  - Sample archive `data/archive/farm_daily.json`: added to by the scraper on every run (each Taipower data time counts once); `tools/build_farm_daily.py`
    restored the 1,290 samples since June 2026 from the git history, and the weekly backfill run fills any missed snapshots from the last three weeks of history.
  - Validation: for July 2026, the sampled capacity factors of Taipower's 7 own farms are within 0–2 percentage points of the official monthly generation
    (dataset 17140; e.g. Offshore Phase 1 16.5% vs 16.9%).
  - The dialog always says these are estimates from samples, not official yearly generation, and that summer is the low-wind season; they are kept apart
    from the official yearly data. Units in testing, units with too few samples and Taipower's multi-farm rows are not ranked.
  - Same-model comparison: SG 8.0-167 DD (Greater Changhua 1 & 2a's two units, Formosa 2, Yunlin's two units), V174-9.5, E-70 2.3, V80 and more.
- Taiwanese farm cards gain a "Live samples (last 90 days)" row (average output and capacity factor, with "See rankings").
- The Taiwan live page's Charts tab links to "Capacity factor rankings (live samples)"; the dialog title is now "Wind farm output".
- The Output dialog adds Denmark, from the Danish Energy Agency's (Energistyrelsen) turbine register, Stamdataregister for vindkraftanlæg (monthly metered
  production, updated about every two months; published for company-owned turbines only):
  - "Denmark · farms": farms metered as a whole and individually metered turbines are matched to the site's Danish farms by location and used when the
    capacity is within 15% of the record; older turbines nearby, connected more than a year before the farm, are left out so they cannot make up the numbers.
    54 farms (51 in 2025, 3,359 MW, about 67% of the site's operating Danish capacity); in 2025, for example, Vesterhav Nord 45.1%, Anholt 43.2%,
    Horns Rev 3 42.9% and Kriegers Flak 39.1%. Farm cards show the measured output and rank.
  - "Denmark · single turbines" (`out=DKT.cf`): 1,848 individually metered turbines (1,776 in 2025, median capacity factor 18.5%) ranked one by one; the
    same-model comparison groups by make + rotor diameter + unit rating (the register spells one model several ways) and draws large groups as a distribution;
    clicking a turbine flies to it, and its card lists the specs and each year's output.
  - Credited with the agency, the dataset and the retrieval date as the agency's terms require (the build writes the retrieval month into the data files).
    New tool `tools/dk_output.py`; single turbines are in `data/global/turbine_output.json`.
- The Output dialog's data sets are now picked from a drop-down (Taiwan official, Taiwan live samples, US, Denmark farms, Denmark single turbines).
- Taiwan offshore status check (6 Oct 2026, every quote checked against its source): Greater Changhua 2b (Wo-Nan, 337.1 MW) has been counted in Taipower's
  installed capacity since 18 Sep 2026, and the live page now counts it too; Greater Changhua 4 is still in trial operation, so the project is not yet fully
  operating; Ørsted and Cathay Life each own 50% of 4. Taipower Offshore Phase 2 is corrected to 294.5 MW (31 × 9.5 MW); its installation vessel sailed on
  28 Sep with 1 of 31 turbines in place. Haiding 3's owner is now Corio and TotalEnergies (JERA left in 2023). None of the "latest available" national sources
  has a newer release.
- The Taiwan live page now takes installed capacity and the "in testing" status from Taipower's live data (including its note-10 flag), so units are counted
  automatically when their trial operation ends; four farm notes gain their English text (the English page showed them in Chinese).
- Data corrections: Taichung Power Plant's turbines started in 2006 (not 2005) and Taichung Port's in 2007 (not 2006), per the Control Yuan's 2010 investigation
  report; Iran's Tizbaad (100 MW) has no evidence of operation and becomes pre-construction with the year unknown (Iran's farm total drops from 116% to 90% of
  the national figure); CTG Yangjiang Shapa phase 5 is 300 MW, not 400 (47 Mingyang MySE6.45-180), so the six Shapa records add up to CTG's 1,705.5 MW and
  269 turbines.
- Foundations: 15 more Chinese farms from construction, completion or completion-acceptance records (every quote checked), for example Lemen II, Shenquan I
  and II, Qingzhou 3 and 4, Peninsula South V, Rudong H4 and H7 and Shengsi 2 (31 pile caps + 32 monopiles); Changle Waihai A's note now says it has
  jackets of two kinds (four-pile and suction-bucket). Operating offshore farms with a known type: 257 of 333, 78.7% of the capacity (was 242 and 71.5%);
  77 of China's 141.
- More data corrections (every quote checked against its source):
  - Three Chinese offshore records listed as operating were re-checked. Datang Danzhou CZ3 has only site 1 (600 MW) in operation (2025); site 2 (600 MW,
    Mingyang 10 MW) only broke ground on 16 Dec 2025 and was still under offshore construction in October 2026, so the record is split in two with site 2
    under construction, and GEM's duplicate of site 2 is removed. Changle Waihai B was never built (the record had 400 MW operating since 2022): the only
    area-B project is Zhongmin Energy's "Changle B (adjusted)", whose EPC contract was only tendered in September 2026, so GEM's pre-construction record
    (102 MW, expected 2027) now stands for it. Huaneng Peninsula North BW really is operating; its point moves from the sea north of Weihai to north-west of
    Sangdao island off Longkou (it was about 140 km too far east). China's operating offshore capacity drops by 1,000 MW (by 400 MW for 2025).
  - Morocco's farm total drops from 120% to 94% of the national figure: GEM's Tarfaya (placed in Tetouan Province in the north), Tangier and Akhfenir
    records duplicated the site's own and are removed; Tarfaya's owner is now Tarec, a 50:50 venture of ENGIE and Nareva, and Akhfennir moves to GEM's
    exact point (it was about 17 km to the north-west).
- Card photos for 24 more farms (Commons photos, each looked at): Gwynt y Môr, Burbo Bank, Robin Rigg, Sheringham Shoal, Nysted, Rødsand II, Belwind,
  Arkona, Jaisalmer, Roscoe, Lillgrund, Egmond aan Zee, Prinses Amalia, Thanet, Kentish Flats, Scroby Sands, North Hoyle, Rampion, Whitelee,
  Fântânele-Cogealac, Tafila, Tarfaya, Jeffreys Bay and Shepherds Flat, 64 in all.

## v2.26.1 — 2026-10-05

- US capacity factors now use the nameplate capacity registered in EIA-860M as the denominator. They used the summed USWTDB turbine ratings,
  but USWTDB sometimes lacks part of a plant (Salt Fork: 64 turbines, 128 MW in USWTDB, 174 MW at the EIA) while the generation is the whole
  plant's, so the factor came out too high (Salt Fork showed 60.6%). Farms whose USWTDB and EIA capacities differ by 10% or more (farm and
  plant do not line up cleanly) are no longer listed, taking the US farms with measured output from 876 to 833, and years in which a generator
  entered service or retired are left out. After the fix the 2025 US median is 32.1% and the capacity-weighted average 34.0% (Lawrence Berkeley
  National Laboratory, Land-Based Wind Market Report 2024 edition: a US fleet-wide 33.5% in 2023); 12 farms are at 50% or more, mostly in the Great Plains
  wind belt (South Dakota, Iowa, Minnesota, Oklahoma) and at South Point, Hawaii. Taiwan's figures are unchanged.

## v2.26.0 — 2026-10-05

- New "📊 Output" dialog on the globe: measured yearly output of individual farms in Taiwan and the US, three ways —
  - **Total output** and **capacity factor rankings** (choose the year, high → low or low → high, search for a farm; the capacity
    factor ranking marks the median).
  - **Same turbine model**: one model's capacity factor across farms, a dot per farm, with ▾ to list the farms (76 models in the
    US in 2025; three in Taiwan: Vestas V80, Enercon E-70 and E-44).
  - Measured values only: EIA-923 in the US and the 19 Taipower-owned farms in Taiwan (Taipower open data). Private farms have no
    official per-farm yearly output and are not ranked; the dialog says what share of the site's operating farms that year has figures.
  - Opened from the toolbar, the Taiwan and US country profiles, and "See rankings" next to a farm card's actual yearly output (the card
    also gives the farm's rank); `out=TWN.cf` and `out=USA.model` links can be shared.
- `generation.json` now carries the turbine model: in the US from USWTDB, only when the whole farm has one model and unit rating (with
  hub height and rotor diameter); in Taiwan from the site's farm record, only when it names a single model and Taipower's station capacity
  is within 3% of the record (`tools/build_generation.py`).

## v2.25.1 — 2026-10-05

- "Wind now" particles are thinner and flow at half the speed with shorter trails; the canvas texture is uploaded to the GPU every other
  frame (half the load), and the particle animation switches itself off if it fails instead of holding up the farm layer.
- After a tour ends (finished or left midway) the timeline returns to the year it was on before the tour; it used to stay on the last
  stop's year (Europe offshore could stop at Vindeby in 1991), so farms seemed to vanish when switching to another country.
- When switching the focus to a country that had no operating farms in the timeline's year, a notice says to move the timeline to the latest year.

## v2.25.0 — 2026-10-05

- New on the globe: "Wind now" (toolbar button, off by default; `flow=1` in the URL), the newest NOAA/NCEP Global Forecast System (GFS)
  10 m wind field (public domain, 1°) drawn as flowing particles, brighter where the wind is stronger; zoomed in, only the visible area is
  drawn so the resolution goes up. The legend gives the data time (Taiwan time); it is today's weather and does not follow the timeline,
  and the legend says so when the timeline is on a past year. On the satellite basemap the particles turn pale blue-violet so they do not
  disappear into clouds and snow.
- New schedule `wind-now` (`.github/workflows/wind-now.yml`, every 6 hours): `tools/fetch_gfs_wind.py` takes only the 10 m U and V fields
  from NOAA NOMADS and writes `data/live/wind_now.webp` (about 50 KB, lossless, 0.5 m/s steps) and `wind_now.json`; `keepalive` re-enables it
  too. The single-file edition embeds the wind field from its build time (with the data time shown); the public globe copy has no button for it.

## v2.24.3 — 2026-10-05

- A round of checks on the items TODO listed as unverified (quotes checked with `check_quotes.py`, rules in `tools/farm_cleanup.py`):
  - Taiwan (Taipower's monthly reports): Datan's unit #3 was decommissioned in June 2025, leaving 7 turbines and 13.6 MW (was 12.5 MW; the
    15.1 MW in Taipower's station list predates the decommissioning), and its card tells the 2005 start, 2011 expansion and decommissioning;
    Yongxing in commercial operation from 28 December 2020 (was 2024); Longmen connected on 1 June 2022 (was 2023); Taipower Offshore Phase 1
    moves to the centre of its 21 turbines mapped in OpenStreetMap (23.986 N, 120.242 E; the old point was at the coast), and its close-up now
    draws the real turbine positions.
  - The UK's Pentland floating wind farm: GEM's two records are the same project, consented and awarded a Contract for Difference in January
    2026, aiming to operate in 2030; the old point was on land and moves off Dounreay (approximate).
  - Korea's Ulsan 750 kW floating demonstrator: permits were blocked in 2019 and no later installation or generation can be found, so
    "operating since 2020" becomes pre-construction with the year unknown.
  - CTG's 16 MW Sanxia Linghang: the National Energy Administration puts it more than 70 km offshore, so it moves from just off Shapa town to
    near Qingzhou 5 and 7 (approximate); still under construction (no grid connection reported).
  - New: CNOOC's Haiyou Anlan, a 16 MW tension-leg floating platform connected to the Lufeng oilfield grid in August 2026 (approximate
    position), also in the foundations layer.
  - Mingyang's OceanX is confirmed not double-counted; Taichung Power Plant's start year, Iran's two farms and CTG Shapa's phases adding up
    to about 100 MW too much still lack a first-hand source and stay in TODO.
- Taipower-owned farms with actual yearly output rise from 18 to 19 (Datan's capacity now matches Taipower's data).

## v2.24.2 — 2026-10-05

- The Taiwan live farm grid now shows which farm each Taipower grid-connection name belongs to: Wo1 and Wo2 = Greater Changhua 1 & 2a (900 MW
  together; the globe card's live output is their sum), Wo4 and Wonan = Greater Changhua 2b & 4, Fang1 and Fang2 = Changfang & Xidao, Yunxi and
  Yunhu = Yunlin, Long A and Long B = Hai Long 2 & 3. The grid used to show only Taipower's short names, so "Greater Changhua" was nowhere to be seen.

## v2.24.1 — 2026-10-05

- Fixed Taiwan's overall availability going above 100% (for example 113.7% at 13:40 on 5 Oct 2026): Greater Changhua 2b & 4 (Wo4, Wonan) and
  Hai Long A and B are still commissioning, so Taipower's live data carries their output (about 1,157 MW at the time) but no listed capacity;
  their output was counted in the numerator with no capacity in the denominator. Availability now uses only units with a listed capacity
  (about 83.6% at the time) and notes "excl. ○ MW from units in testing"; total output still includes them. Affects the Taiwan live
  dashboard, the home page and the globe's Taiwan profile.

## v2.24.0 — 2026-10-05

- Three more story tours (the "▶ Tour" menu, or `#/global?tour=eu` / `cn` / `fl`), 11 stops each with bilingual narration, all figures taken
  from the site's farm records, milestones, events layer and national series:
  - "Europe offshore: from Vindeby to gigawatts": Vindeby (1991), Middelgrunden, Horns Rev 1, alpha ventus, London Array, Hornsea One,
    Hornsea Two, Hollandse Kust Zuid, Seagreen, Dogger Bank A, Moray West.
  - "China's rise": Dabancheng, Huitengxile, Jiuquan, Donghai Bridge, the Rudong tidal flats, Yangjiang Shapa (the 2021 rush), Hinggan
    League, Zhangpu Liu'ao Phase 2, Qingzhou 6, Mingyang 20 MW, Dongfang 26 MW.
  - "Floating wind": Hywind Demo, WindFloat 1, the Fukushima demonstration, Hywind Scotland, Floatgen, WindFloat Atlantic, Kincardine,
    Yinling, Hywind Tampen, Provence Grand Large, Goto.
  - Story stops can now be milestones; the Learn chapters on Asia, offshore, floating wind and Taiwan gain buttons that open the matching tour.
- Card photos now come from hand-checked Wikimedia Commons photos (new `tools/farm_photos.py` → `tools/build_photos.py` → `data/global/photos.json`):
  - 40 farms (21 in Taiwan, including Formosa 1 phases 1 and 2, Taipower Offshore Phase 1, Formosa 2, Taichung Port at the Gaomei Wetland and
    Taichung Power Plant; plus European, Chinese and floating farms) and 18 milestones, each looked at by hand, taken from the farm's Commons
    category or named as that farm, under CC0 / public domain / CC BY / CC BY-SA / Attribution; the card credits author and licence with a link to the Commons file page.
  - For farms without a checked photo, a Wikipedia article image is shown only if Commons files it under a wind-power category (it was often
    local scenery, a map or a county montage).
  - Event cards use a related farm's photo, labelled as not taken at the time of the event; Commons has no freely licensed photos of the events themselves (toppled turbines and so on).
  - Changhua's offshore farms (Greater Changhua, Changfang & Xidao, Zhong Neng), Yunlin, Hai Long and Taipower Offshore Phase 2 have no usable photo on Commons yet; listed in TODO.
- Corrected the last stop of "Taiwan's road to offshore wind": Taipower took over Offshore Phase 2's turbine installation in July 2026 and aims
  to connect it by the end of the year (CNA), not in the first half of 2027.
- Taiwan's offshore farms under construction re-checked: no new commercial-operation announcements for Greater Changhua 2b & 4, Hai Long or
  Taipower Offshore Phase 2, so the data is unchanged.

## v2.23.0 — 2026-10-05

- A story tour on the globe, "Taiwan's road to offshore wind": "▶ Tour" in the toolbar now opens a menu; pick "★ Taiwan's road to offshore
  wind" (or open `#/global?tour=tw`) and the globe switches to Taiwan, shows planned projects and flies through 11 offshore farms, from
  Formosa 1's two demonstration turbines in 2017 through Formosa 1 Phase 2, Taipower Offshore Phase 1, Formosa 2, Greater Changhua 1 & 2a,
  Changfang & Xidao, Yunlin, Zhong Neng, Greater Changhua 2b & 4 and Hai Long 2 & 3 to Taipower Offshore Phase 2. Each stop's card carries a
  bilingual narration under its title ("Taiwan's road to offshore wind · stop n / 11"); figures come from the site's data and the Energy
  Administration's monthly report (4,984.9 MW in total by August 2026). The original milestone tour is renamed "Auto tour (current focus)".
- The cards of Taipower's Taichung Power Plant and Taichung Port (Gaomei Wetland) farms now tell how their turbines moved (Liberty Times
  2016 report, events WIND-060/061/062, Taipower's 2026 station list): Typhoon Jangmi toppled one at the port in 2008 and one turbine (P01)
  was moved from the power plant to replace it, leaving 3 there; Typhoon Soudelor toppled 6 at the port in 2015; in 2016 Taipower moved
  2 more from the power plant to the front row, leaving 1; Typhoon Megi broke unit 12's blades later in 2016. The port's Z72s went from
  18 to today's 13 (7 fewer in all), alongside 3 Enercon E82s.

## v2.22.1 — 2026-10-05

- Taipower-owned farms corrected against Taipower's wind station list (data.gov.tw 17141) and the Energy Administration's wind single window
  (quotes checked with `check_quotes.py`): Luzhu from an estimated 33.6 MW / 2025 to 8 Enercon E44, 7.2 MW, 2015; one Z72 (2 MW) left at
  Taichung Power Plant (2 were moved to Taichung Port in 2016); Taichung Port 13 Z72 + 3 E82 E4, 35 MW; Wanggong 10 Enercon E70, 23 MW;
  Yongxing and Taixi 4 E70 each, 9.2 MW; Longmen 3 E82 E4, 9 MW; Penghu Zhongtun's 8 turbines were dismantled by November 2025 and it is now
  retired. With the capacities matching, Taipower farms with actual yearly output on their cards rise from 13 to 18. Datan's two official
  figures disagree and Offshore Phase 1 has no official coordinates, so both stay as they are and are listed in TODO.
- Germany's suspected MaStR duplicates resolved: GEM's Flomborn-Stetten was about 25 km off and moves to MaStR's BVT farm; the same-name rule
  for new farms now skips a group only when the site farm's own matched groups do not share more name words, letting real neighbours
  (Windpark Flomborn, Stetten and others) in; the other 7 pairs (two Nortorfs, Heßloch, Welsow, Gnannenweiler and others) are confirmed as
  different farms and listed in a new `NOT_DUP` list (reasons in `docs/data-cleanup.en.md`), bringing the coverage report's suspected
  duplicates A to zero. German farm-level coverage is 96%.

## v2.22.0 — 2026-10-05

- Germany now uses the Federal Network Agency's Market Master Data Register MaStR (© Bundesnetzagentur | Marktstammdatenregister, Data
  licence Germany – attribution 2.0; full export of 4 Oct 2026):
  - The 32,204 operating turbines (82.6 GW) are grouped by farm name and location and matched to 1,709 of the site's German farms; these
    and the added farms, 6,489 in all, now draw MaStR's real turbine positions in the close-up, with turbine count, model, hub height and rotor
    diameter on the card (`data/global/turbines_de.json`, replacing OpenStreetMap).
  - 4,780 onshore farms GEM lacks are added (23.7 GW, 1 MW and up; phases from each turbine's commissioning year). Germany's farm-level
    coverage rises from 68% (53,313 MW) to 95% (74,366 MW).
  - Avoiding duplicates: groups sharing a name with a site record, or close to a site farm of similar capacity, are never added; the build
    checks that site onshore + added (66.2 GW) stays under MaStR onshore (71.1 GW). Four German pairs remain in the coverage report's
    "suspected duplicates A" for manual checking (for example two places called Nortorf).
  - New tools: `tools/fetch_mastr.py` range-fetches only the wind file (about 10 MB) from the 3 GB export; `tools/build_mastr.py` groups,
    matches and writes the output.
- The farm-layer description in Learn's "Sources & method" had mismatched figures between languages (the English said Feb 2025 and 15,000
  farms); both are corrected.

## v2.21.0 — 2026-10-05

- A new "Wind speed" basemap on the globe (basemap menu): Global Wind Atlas 3 (DTU / World Bank Group, CC BY 4.0) mean wind speed at
  100 m over land and up to about 200 km offshore, in eight 1 m/s classes with a legend, showing why farms cluster in the Taiwan Strait,
  the North Sea, Patagonia and so on.
  - One hue (violet), dark = calm and light = windy, kept clear of the gold (onshore), blue (offshore) and teal (floating) farm markers.
  - New `tools/build_wind_resource.py` reads only the 1/32 overview (about 9 km) of the cloud GeoTIFF and writes `wind_2k.jpg`,
    `wind_4k.jpg` and the legend's `wind_resource.json`; both single-file copies embed the 2k image. This basemap adds no Esri tiles when zoomed in.

## v2.20.0 — 2026-10-04

- Farm cards gain "Actual yearly output": farms with official per-farm figures now show their measured yearly net generation and capacity
  factor (the others keep the estimate).
  - 876 US farms: U.S. EIA Form EIA-923 (2023–2025, public domain). USWTDB gives each turbine its EIA plant code, so plants link straight to
    the site's farms; plants spread over several farms (21) are left out, only years with every turbine in service all year are shown, and
    the capacity factor uses the USWTDB turbine ratings.
  - 13 Taipower-owned farms in Taiwan (including Offshore Phase 1: 306 GWh in 2025, capacity factor 31.9%): Taipower open data on the
    generation of its own renewable stations (17140, from 2024) and its wind stations (17141); 7 stations whose stated capacity differs from
    the site's record by 15% or more (Datan, Luzhu, Yongxing and others) are left out for now. Private farms have no official per-farm figures.
  - New `tools/build_generation.py`; `turbines.json` now carries each farm's EIA plant codes.

## v2.19.2 — 2026-10-04

- Second check of offshore farms under construction "expected in 2026" (quotes checked with `check_quotes.py`; rules in `tools/farm_cleanup.py`):
  - Two automatic matches between the pipeline compilation and GEM were crossed and are now pinned (`PIPE_SAME` in `build_farms.py`): East Anglia
    THREE's "under construction, 2026" had been written onto East Anglia TWO, which is now pre-construction, 960 MW, expected 2028; Ecowende
    (Hollandse Kust West site VI, 760 MW) had been written onto site VIII, which has not been tendered yet and is back to announced, while
    Ecowende is under construction and moved into the wind-farm zone.
  - Hainan CZ2: Shenergy's CZ2 phase 1 reached full connection only in March 2025 (year 2024 → 2025) and lies off northern Danzhou (the name now says
    "Danzhou"; with the corrected point OpenStreetMap matches 66 turbines); GEM's 600 MW record is phase 2, which started construction in April 2026.
  - Completion year unknown instead of 2026, as nothing supports it: Hainan CZ7 phase 1 (GEM's Chinese name said phase 2), CZ9 phase 1 and Zhanjiang
    Xuwen Donger (first pile in September 2026); Vietnam's Đông Thành 1 is still awaiting investment approval and is now pre-construction.
  - CTG's 16 MW floating "Three Gorges Lead" was installed in May 2026; its grid connection is unconfirmed, so it stays under construction.
  - Greater Changhua 2b&4, Vineyard Wind 1, Baltic Power, Qingzhou 5 and 7, Bac Lieu 3 and others still had no full commercial operation by 4 October
    and stay under construction (watch list in `tools/research/farms_2026_status.json`).

## v2.19.1 — 2026-10-04

- OpenStreetMap turbine positions now cover the whole world (v2.19.0 had only test data around Taiwan): 6,886 operating farms outside
  the US, with 147,012 turbines, now draw their real positions (357 GW of the 902 GW operating in those countries; 61% without China,
  where OSM maps few turbines); OSM data as of 2026-10-04. 3,561 farms are matched by OSM wind-plant areas (name and capacity), 3,325 by
  spatial groups; the rest keep the computed layout. Spot checks: London Array 175, Hornsea One 174, Gemini 150, Horns Rev 1 80 and
  Yunlin 80 turbines, the actual counts.
- Matching fixes: most OSM wind farms are type=site relations whose members are the turbines, so the download now includes the members
  (it fetched tags only, so plant areas found no turbines); a plant whose stated capacity matches but which maps only some turbines (an
  implausible unit size) is no longer used.
- The download fetches four tiles at a time, splits a tile that keeps failing into four smaller boxes, and leaves a failed tile for the
  next run instead of stopping.

## v2.19.0 — 2026-10-04

- France 2025 now uses the SDES grid-connected capacity at end-2025: onshore 23,992 and offshore 2,008 MW (previously IRENA's 24,155 and
  1,500 MW, which left out Yeu-Noirmoutier, 500 MW, fully connected in 2025; the owner decided on 2026-10-04 to change both); the world
  total at end-2025 becomes 1,287,956 MW (about 1,288 GW), with about 158 GW added in 2025. France's 2026 point now uses the SDES figures
  directly (same series).
- Farms outside the US now draw their real turbine positions from OpenStreetMap (the owner agreed on 2026-10-04 to share alike under
  the ODbL): `tools/fetch_osm_turbines.py` downloads them and `tools/build_turbines_osm.py` matches them to the site's farms by OSM
  wind-plant areas (name, capacity) or spatial groups (plausible unit size), conservatively; the resulting `data/global/turbines_osm.json`
  is shared under the ODbL, with "© OpenStreetMap contributors" on the card and in the sources dialog.

## v2.18.0 — 2026-10-04

- The globe's timeline extends to "2026 (latest available)": 8 countries use this year's official figures — Taiwan (Energy Administration
  monthly table 4-02, August), the US (EIA-860M, August), China (NEA H1 briefing, June), India (MNRE, August), Brazil (ANEEL, August),
  Germany (WindGuard half-year reports, June), France (SDES Q2, June) and the UK (DESNZ Energy Trends 6.1, June) — while the others carry
  their end-2025 figure and are hatched in the bar chart; the country profile and the sources dialog give each country's source and data
  month. Sources with a different scope from the site's 2025 figure add their growth to it, marked as an estimate (figures and notes in
  `tools/latest_wind.py`). France's offshore uses the SDES figure of 2,316 MW directly: the site's 2025 value of 1,500 MW leaves out
  Yeu-Noirmoutier, fully connected in 2025 (noted in TODO).
- US wind farms now show their real turbine layout: 967 farms and 60,547 turbines from the U.S. Wind Turbine Database (USWTDB, public domain,
  2026-09-28 release) are matched to the site's records (name, 30 km, capacity ±15%; unmatched farms keep the estimated layout). The selected
  farm's close-up uses the real positions, hub height and rotor diameter, and the card lists the turbine count and model
  (`tools/build_turbines.py`; loaded only when a US farm is selected).
- Farm-by-farm check for 2026 (quotes checked with `check_quotes.py`): Kitakyushu Hibikinada (March), the Goto floating farm (January),
  EFGL (July) and EolMed (May) reached full commercial operation and are now operating in 2026; Hai Long, Taipower Offshore Phase 2 and
  Dogger Bank B/C move to 2027; Baltic Power corrected to 1,140 MW and Windanker to 315 MW.
- Farm cards add the distance to shore (computed from the Natural Earth 1:50m coastline) and an estimated yearly output (capacity × the
  country's 2023–2025 average wind capacity factor from Ember, CC BY 4.0; labelled as an estimate).
- Docs: the 2026-10-04 discussion of other energy sources (solar, nuclear, fossil, etc.), its mock-ups and the conclusion — back to wind for
  now, discuss again later — are recorded under "Directions evaluated and deferred" in ROADMAP.

## v2.17.7 — 2026-10-03

- The differences from GEM 2026-02 checked one by one (quotes verified with `check_quotes.py`):
  - Taiwan's Round 3.2 (Energy Administration, Aug 2024): Haiding 1 (360 MW) and DeShuai (240 MW) lost their development rights by May 2025,
    and Greater Changhua Northeast was dropped for overlapping Haiguang, so the three are removed; YouDe is corrected to Youde, 700 MW, and
    merged with GEM's “Datian Youde” (owner Shinfox, with a note that termination was being processed in August 2026); Fengmiao 2 becomes
    the 600 MW allocated; Huanyang gets a note that it is in termination.
  - GEM's “Formosa 3 · 2” is Round 3.1's Haiding 2 (600 MW), since terminated, and is removed; “Formosa 3 · 3” gets the Chinese name 海鼎三 (Haiding 3).
  - Korea's Jwasari still has no construction start and stays in pre-construction; the site is off Jwasari-do near Tongyeong, not off
    Yeosu, so its point is moved (approximate).
  - Japan's Kakegawa (Japan Wind Development, 6 × 2,300 kW, 13.8 MW, 2020) and Enshu Kakegawa (Kuroshio Wind Power, 2011) are two farms;
    listed in `GEM_KEEP`, and the coverage report no longer flags them as a suspected duplicate.
  - Norway's Sørmarkfjellet stays operating; the events layer gains its three 2025 blade incidents (a blade falling after a storm cut
    power in January, a blade failure that stopped the whole park in March, icing damage in December; Aneo notices), 91 events in all.
- The Qingzhou 5 and 7 duplicates with GEM had already been merged by clean-up rules; removed from TODO.

## v2.17.6 — 2026-10-03

- Turbine models checked (quotes verified with `check_quotes.py`):
  - Wailuo phase 1's MySE5.5-155 has a 158 m rotor (Mingyang's spec sheet and a broker report); “155” is only the model name;
  - Zhong Neng has 31 V174-9.5 (Vestas's 2022 order and 2024 completion releases); the V164-9.5 on the Taiwan offshore wind association page is wrong;
  - Provence Grand Large becomes SWT-8.0-154 (run at 8.4 MW, 75 m blades), with the rotor changed from 167 m to 154 m.
- Data correction: Fuqing Haitan Strait follows its as-built marine environmental acceptance report: 299.2 MW with 21 Haizhuang 6.2 MW, 3 × 5 MW
  and 22 Mingyang 7.0 MW (was Goldwind, 300 MW), depth 1.6–20.5 m, hub 97–101 m and rotor 158 m (the earlier 90 m tower and 171 m rotor are dropped).
- Fifth dimension round: Neart na Gaoithe hub 119–125 m (pre-construction layout plan), Xiangshan 1 (depth 9–15 m, hub 131 m, rotor 225 m for the
  main WD225 type) and Shengsi 5 & 6 depth 12.5–14.5 m. 234 of the 236 operating offshore farms now have at least one dimension; 168 have all three.
- `tools/check_quotes.py`: no longer fails to cache PDF text containing surrogate characters, and retries with the next User-Agent when it only
  gets a short firewall challenge page.

## v2.17.5 — 2026-10-03

- More dimension data (fourth round, quotes verified with `check_quotes.py`) for 10 operating offshore farms: Peninsula North L (hub
  146.34 m, rotor 252 m, as-built figures from the sea-use adjustment report), Cangnan 2 (hub 136 m, rotor 226 m), Qingzhou 1 & 2 (hub about
  160 m), Rudong H14 (rotor 146 m), GCL Rudong H13 (rotor 171 m), Borkum Riffgrund 3 (hub 142.4 m), Walney Extension (hub about 111/113 m, tip
  height minus rotor radius), Korea's Southwest demonstration (depth 10–11 m), Sweden's Bockstigen (hub 41.5 m) and Vietnam's Tan Phu Dong 1
  (rotor 150 m).
- Data correction: Tan Phu Dong 1's turbines change from “Envision” to 24 Vestas V150-4.2.
- 232 of the 236 operating offshore farms now have at least one dimension; 165 have all three.

## v2.17.4 — 2026-10-03

- Data corrections (the four doubts from the third dimension round, quotes verified with `check_quotes.py`):
  - the curated “Guohua Rudong H14” (300 MW, Goldwind 6.45 MW) is a misplaced copy of Luneng's Rudong H14 and is merged into GEM's Luneng H14
    (200 MW, 50 × 4 MW);
  - the curated “CGN Jiaxing 2 (Zhoushan Daishan 4)” (300 MW) is merged into GEM's CGN Daishan 4 (234 MW), which gains its turbines (36 Envision
    EN148-4.5 plus 18 XEMC XE140-4.0);
  - CGN Rudong H8 becomes 40 Haizhuang H171-5.0 plus 25 Shanghai Electric SWT-4.0-146; Guoneng Dafeng H5 becomes 206.4 MW with 32 Goldwind GW184-6.45.
  The foundation and dimension data of the two merged curated records move to the records that are kept. 330 operating offshore farms; known
  foundation types cover 71.4% of their capacity.

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
