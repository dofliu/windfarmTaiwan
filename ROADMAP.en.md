# Roadmap

English (this page) ｜ [中文](./ROADMAP.md)

The phased plan for what comes next, the current known limitations, and the directions that were
evaluated and deferred — so that nobody (you or an AI) has to fall into the same holes again. The
concrete to-do list is in [TODO.en.md](./TODO.en.md); this file is about direction and background,
TODO is about what to do next.

## Next steps (compiled Sep 2026)

### Principles

- **Correct first, then richer**: data errors hurt credibility the most, so the duplicates, misplaced
  points and stale statuses listed in [docs/data-coverage.en.md](./docs/data-coverage.en.md) come first.
- **Every step keeps**: both languages (docs and UI), a working single-file edition, a fallback
  without WebGL, a usable phone layout, and a source for every number.
- **Ask the owner before anything that needs accounts or API keys, changes the deployment, or widens
  the site's scope.**
- Effort: small = within a day, medium = a few days, large = one to two weeks.

### Phase 1: data correctness + farm details v1 (suggested first)

| Item | What | Effort |
|---|---|---|
| Clean up duplicates and misplaced points | **Done (Sep 2026)**: after checking record by record, 77 duplicate, never-built or non-existent records were removed and 52 fixed (reasons and sources in [docs/data-cleanup.en.md](./docs/data-cleanup.en.md)); name matching now unifies Traditional and Simplified Chinese and compares zone codes; the countries whose farm sum exceeds the national figure went from 12 to 2; farms sharing a placeholder point are fanned out on the map. The remaining items to verify are in TODO | medium |
| Farm details v1 | **Done (Sep 2026)**: all of group A under "What farm details could add" below — standing within the country (capacity rank and share of national capacity at the timeline year), a phase timeline, nearby farms (within 30 km) and farms by the same developer (clickable to switch), OpenStreetMap / Wikidata / Global Wind Atlas links, report a data error, copy link to this farm | medium |
| Global farm search and filters | Search every farm by name, developer or turbine model; filter by type (onshore / offshore / floating), capacity, commissioning year and status, with map and list in sync | medium |
| Automated checks | GitHub Actions on pull requests: a Playwright smoke test (including the single-file edition over `file://`), `qa_farms.py` and the coverage report, flagging large changes in the numbers | small |

### Phase 2: live data from other countries + comparisons

| Item | What | Effort |
|---|---|---|
| Live output in other countries | **Done (Sep 2026)**: Australia NEM, Alberta and Ontario, about 150 farms; farms with live data get a green ring. Next: UK estimates and a national "wind output right now" panel (see [docs/live-data-sources.en.md](./docs/live-data-sources.en.md)) | medium–large |
| Country comparison | Put 2–4 countries side by side (small multiples): cumulative capacity, yearly additions, onshore / offshore, indexed growth | medium |
| More metrics | Capacity per person, wind's share of electricity generation, capacity factor (Ember yearly data, CC BY 4.0); colour the map by any metric | medium |
| Yearly additions | Show capacity added each year (not just cumulative) to reveal each country's build-out peaks and cycles | small |
| Turbine makers and developers | Derive the manufacturer from the turbine model strings to show market shares by country and year; developer portfolios | medium |

### Phase 3: context layers and deeper learning

| Item | What | Effort |
|---|---|---|
| Wind resource layer | Global Wind Atlas mean wind speed at 100 m (CC BY 4.0) on the globe — why farms are built where they are | medium |
| The wind right now | Wind from numerical forecasts such as NOAA GFS (public domain) drawn as flowing particles, refreshed every 6 hours by a scheduled job | large |
| Offshore zones and sea areas | Taiwan's offshore wind zones, Japan's promotion zones, the North Sea countries' sea areas, exclusive economic zones (Marine Regions, CC BY) | medium |
| Story tours | Chapter-style tours such as Taiwan's offshore journey, China's rise, North Sea offshore and floating wind, linked with the Learn pages | medium |
| Interactive teaching | Interactive charts for the power curve (wind speed → output), capacity factor, wake effects and falling costs (IRENA); a classroom mode | medium |

### Owner's new plans (Sep 2026)

Compiled 26 Sep 2026; data availability was checked the same day (anything not verified is marked as such).

**1. Extend the timeline into 2026 (latest available data)** · medium

- Goal: one more point after end-2025. Call it "2026 (latest available)" rather than "September 2026": each
  country's latest official figure ends in a different month, and in September 2026 no source has September data
  yet. Tooltips show each country's month and source.
- Countries with an official 2026 figure (8, about 80% of the 2025 world total):
  - Taiwan: Energy Administration API (table 4-02, monthly, JSON, no key, onshore/offshore), July; it is the same
    series the site already uses for 2025.
  - USA: EIA-860M monthly generator inventory (Excel, onshore/offshore), August.
  - China: National Energy Administration, August total; onshore/offshore split only at quarterly press
    conferences (June).
  - India: MNRE monthly progress table, August.
  - Brazil: ANEEL SIGA open data (daily CSV, ODbL).
  - Germany: Deutsche WindGuard half-year reports (onshore and offshore), June.
  - France: SDES quarterly wind dashboard, June.
  - UK: DESNZ Energy Trends 6.1 (quarterly, onshore/offshore/floating), March; Q2 is due on 29 Sep 2026.
- Other countries carry their end-2025 figure forward, clearly marked (hollow or hatched), with no growth
  animation; the world total is labelled "some countries updated" or hidden.
- No-key automation: Taiwan, USA, Brazil, UK (the UK link changes with each release); China, India, Germany and
  France need manual monthly or quarterly entry.
- Where a source's scope differs from the site's, plot "site 2025 + this year's additions from that source",
  labelled as an estimate, to avoid false jumps from switching sources.
- Farm layer: farms commissioned in 2026 (e.g. Taiwan's Hai Long and Greater Changhua 2b & 4) need their status
  and year updated one by one.

**2. Offshore foundation-type layer** · medium (Europe, floating, Taiwan/Japan/Korea/USA) / large (China, Vietnam)

- Goal: a switchable layer, like onshore/offshore, that colours offshore farms on the same globe by foundation
  type: monopile, jacket (piled), jacket (suction bucket), tripod/tripile, gravity-based, high-rise pile cap
  (common in China), floating (semi-submersible, spar, barge, TLP), mixed, and "fixed-bottom, type unknown". The
  legend always says how many farms and what share of capacity are classified; country profiles add a bar per type.
- Data (checked Sep 2026):
  - The only open dataset with a foundation type per farm is OSPAR Offshore Renewables 2024 (CC0). It covers the
    North Sea and NE Atlantic only (not the Baltic or Mediterranean) and matches about 107 of the site's 393
    operating offshore farms (about 34% of their capacity).
  - EMODnet only says fixed or floating; GEM only hard mount or floating; Wikidata has no such property; English
    Wikipedia lists have no foundation column (German farm articles do, in the infobox); 4C Offshore is paid and
    forbids reuse, so it cannot be used; Taiwan has no official list, so each project needs the developer's pages or
    EIA documents.
- Method: a per-farm table like `tools/farm_cleanup.py` (country, name, source → type + source link, with a note
  for mixed farms). Seed it from OSPAR and confirm each match by hand, then add the rest of Europe, floating farms
  and Taiwan/Japan/Korea/USA: an estimated 2–4 days for about 199 farms (45% of capacity). China and Vietnam (about
  194 farms, 55% of capacity) need Chinese and Vietnamese sources, an estimated 50–70 hours; ask the owner before
  starting. Until then they show as "fixed-bottom, type unknown".

**3. Status of work vessels (installation vessels, "mother ships")** · verdict: no live positions for now

- Live positions need AIS. The only free real-time source, aisstream.io, needs an account and API key (which by
  project rule needs the owner's approval), has no written terms that allow public redisplay, and users report
  almost no data in Asia. Most of Taiwan's offshore farms are 45–85 km from the only volunteer receiver on the
  west-central coast (Changhua City), beyond the usual range of shore-based AIS.
- Other sources: Global Fishing Watch is about 4 days late, non-commercial only and needs a token; the Danish
  Maritime Authority's daily files are 2–3 days late; US MarineCadastre is about 3 months late; Norway's
  BarentsWatch covers Norwegian waters only; AISHub requires your own receiver; MarineTraffic, VesselFinder and
  Kpler (Spire) are paid and must not be scraped. There is also no complete, citable open list of installation
  vessels (it would have to be built from Wikidata and owners' fleet pages).
- A key-free alternative for Taiwan (about 1–2 days): Taiwan International Ports Corporation open data
  (Government Open Data License) lists berths and port calls; wind-farm work vessels are marked "wind farm work",
  and their previous/next port is a wind-farm code (e.g. TWOWP1 = Formosa 1, TWOWP6 = Zhong Neng). That would show
  which work vessel is in which port and which farm it is heading to — port calls, not live positions at sea.
  Whether to build it is the owner's call.

**4. Important transport and assembly ports** · **done (Sep 2026)**: see "Global farm search and filters" in phase 1.

### Engineering and open data

- **Data download**: export the farms and country data in the current view as CSV / GeoJSON (with
  licence and citation).
- **Embedding and sharing**: an `?embed=1` compact mode for iframes on the lab's website or in news
  stories; image cards and screenshots; export the year animation as a video.
- **Performance**: split the farm data into chunks or a binary format and parse it in a Web Worker to
  shorten the first wait on the globe; optionally a PWA offline cache (another offline option besides
  the single-file edition).
- **Accessibility**: keyboard operation, screen-reader summaries, colour-blind-safe colours and
  patterns; bar and table views side by side.
- **Data versions**: show the data version and date on the site and in the single-file edition after
  each data update.

### What farm details could add (full list)

Selecting a farm currently shows its name, status, commissioning year, country, total capacity,
turbine model, developer, audit notes and a Wikipedia photo and summary; its standing within the country
(at the timeline year: capacity rank among the country's operating farms listed here, rank among onshore
or offshore farms, and share of national installed wind capacity; pipeline projects are ranked among the
country's pipeline); a phase timeline for farms with two or more phases; nearby farms (within 30 km, by
distance) and other farms by the same developer (same country first, then by capacity), clickable to
switch; links to a satellite map, OpenStreetMap, a wind resource map (Global Wind Atlas), a photo search,
the GEM project page, Wikidata and the source; and at the bottom "Copy link to this farm" and "Report a
data error" (a GitHub issue pre-filled with the name, coordinates, capacity and deep link). Farms in
Taiwan, Australia and Canada also show live output. It could also show:

**A. No new data needed (phase 1) — done in Sep 2026**

- Nearby farms (within 30 km) and other farms by the same developer, clickable to switch. Farms on a
  shared placeholder point get no nearby list; developers are matched on normalised owner names (legal
  forms, generic words and country names removed, plus aliases for a few common groups), preferring a
  missed match to a wrong one
- A phase timeline (for farms with two or more phases); the farm's capacity rank and share within its country
- More links: OpenStreetMap, Wikidata (the item itself when a Wikipedia article is found, otherwise a
  search) and Global Wind Atlas — tested in Sep 2026, the URL format is
  `globalwindatlas.info/<language>/shared/<GeoJSON point>`, which opens zoomed in on the site with the
  mean wind speed layer (the full point analysis needs one more click on the point in GWA)
- "Report a data error": opens a GitHub issue pre-filled with the farm's name, country, coordinates,
  capacity, status, owner, dataset and deep link (field labels in both languages)
- A "copy link to this farm" button (the single-file edition copies the official site's link)

**B. Needs new data (phases 2 and 3)**

- Estimated annual generation, equivalent households and avoided CO₂: capacity × the country's
  average capacity factor (Ember), clearly labelled as an estimate
- Links and fields from national registries: the US USWTDB (location, model, hub height and rotor
  diameter of every turbine; public domain), Germany's MaStR (every unit), the Danish Energy Agency
  turbine register, the UK REPD (planning status), Taiwan's EIA document search
- A turbine spec card: model → rated power, rotor diameter, hub height (a table of common models)
- Live and historical output: Taiwan already has it; the UK, Australia and others can be done per farm
  (see phase 2); annual generation and capacity factor (US EIA-923 monthly plant data, Taiwan's
  dataset 37331, ENTSO-E)
- Offshore farms: distance to shore, water depth (GEBCO), foundation type

### Live generation in other countries

The results of testing each source in Sep 2026 are in [docs/live-data-sources.en.md](./docs/live-data-sources.en.md). In short:

- **Per farm, close to real time**: Australia's eastern grid (NEM; about 100 farms, measured every
  5 minutes, no key), Alberta (about 50 farms, about 1 minute) and Ontario (45 farms, hourly). For the
  UK's ~290 units only *planned* output is live and metered output comes about two weeks later, so
  per-farm values must be labelled as estimates.
- **Free key, server-side only**: eight Dutch offshore farms (NED) and European units of 100 MW or more
  (ENTSO-E, per unit up to 5 days later).
- **National or regional totals only**: the UK, Germany, France, Belgium, Poland and Brazil (readable
  straight from the browser); Denmark, Ireland, Texas and California, Japan and South Korea (need
  Actions). No usable public live data for China or India.
- **Suggested order**: Australia NEM → Alberta + Ontario → UK (estimates) → Netherlands / ENTSO-E (keys);
  the national panel can come first. No per-farm source has coordinates, so a hand-maintained
  "unit code → farm" table is needed (a few hundred rows); fold new countries into the existing
  scheduled commit.

## Known limitations (current state — not bugs, but worth knowing)

- **The supply/demand report cannot be truly live**: the primary source
  `www.taipower.com.tw/.../sys_dem_sup.csv` returns 403 when fetched from GitHub Actions, most likely a
  WAF blocking cloud-CI IP ranges; browser headers and a Referer do not help. The fallback is the
  government open dataset 19995, which is nominally "daily" but was observed to lag about six weeks,
  not just one day. The frontend labels it honestly as "not live, as of YYYY-MM-DD" and never pairs it
  with the live wind output.
- **The 37331 backfill is a quarterly file, not a daily one**: it was expected to fill gaps in the
  7-day trend window, but the data lag 4–5 months, so it can never fill recent gaps. It is now a
  long-term archive (`wind_history_archive.json` / `wind_archive_daily.json`) for monthly, quarterly and
  yearly trends; gaps in the recent trend still depend on the scraper's own sampling.
- **Development timelines were deepened for 15 offshore farms only**: individual onshore farms and
  aggregate items such as "other Taipower-owned / other purchased wind" have no verifiable public
  records (EIA, construction start dates, …), so they keep their short one-line descriptions; nothing
  was invented.
- **Wind speed is an onshore station reference only**: Central Weather Administration stations are on
  land or on the coast; offshore farms (especially those 35–60 km out) have no real hub-height (100 m+)
  measurements, so the nearest station is used as a reference, which the frontend states clearly. CWA
  buoys (offshore sea-state observations) were evaluated, but there are few of them and most are far
  from the farms, so that was deferred (see "Directions evaluated and deferred").
- **Time-sensitive farm progress needs re-checking**: the following were the latest known progress
  when written, but the projects are still moving and the dates will change:
  - Taipower Offshore Phase 2: planned completion moved from 2026 to 2027; still under construction
  - Hai Long (Hai Long B): the latest official reports suggest full commercial operation may slip from
    2026 to 2027
  - Greater Changhua 2b & 4 (Ørsted, one 920 MW project): full operation planned for Q3 2026; check
    whether it happened on time
- **Git history keeps growing**: `scrape.yml` commits about every 2 hours, over four thousand commits a
  year. It works, but the repo grows; `wind_history_archive.json` is already 1.8 MB and grows with each
  weekly backfill.

### Global (3D globe)

- **The global data is a yearly snapshot and does not update itself**: country capacity runs to the end
  of 2025; the farm layer is GEM's Global Wind Power Tracker, February 2025 release. Updating means
  running `tools/` by hand (see "Updating the global data" in the README); there is no schedule.
- **The two parallel versions have been merged into this site** (Sep 2026): the "Global wind power
  development map" wind-history-map (2026 edition) and the "Global wind development atlas v3, Taiwan/Japan
  audited" are no longer developed and are maintained only in this repo. Taken over: the audited
  version's official Taiwan/Japan series, the farm audit for both countries, GEM's February 2026 country
  totals and the coverage idea; the 2026 edition's 177 curated pipeline projects, its list of small
  Japanese farms and their coordinates. Deliberately left out (with reasons): the 2026 edition's German
  MaStR turbine clusters and PyPSA farms (they overlap GEM with different names and extents and would be
  counted twice), lake and river vectors (this site uses raster relief / satellite basemaps), and
  "on hold" projects (like GEM's shelved projects, not included); the audited version's "data coverage"
  map mode (here it is the coverage bar in the country profile). Auto-rotate only worked in the global
  view in all three versions and depended on the frame rate; this site now rotates by seconds and in
  any view.
- **Farm capacity vs national year-end statistics**: Taiwan's and Japan's farms count from their
  full-completion year and the difference is shown (farm-level coverage about 89% and 87%). Farms
  elsewhere come from GEM at full nameplate capacity, so a farm still being connected in stages may
  appear at full size in its commissioning year and sums can exceed the national figure; the national
  figures are the official statistics. Making farms appear stage by stage needs stage-by-stage grid
  connection data (see the ideas below).
- **GEM versions differ**: farms and pipeline projects are GEM's February 2025 release (the public map
  file), while the country pipeline totals are GEM's February 2026 release; the 2026 project-level data
  needs a registration to download — once it is available, rerun `tools/build_farms.py` to align them.
- **1980–1999 is mostly estimated**: most countries' early yearly figures are interpolated from a few
  years of statistics; use them for trends only.
- **GEM coordinates are often approximate**: errors that the project names make obvious have been fixed
  (see `COORD_FIX` in `tools/build_farms.py`) and phases more than 25 km apart are split; undiscovered
  errors may remain. `tools/qa_farms.py` lists farms outside their country's borders; the remaining
  ones are explainable exceptions, except Pohjoinen in Finland (coordinates in Norway), which could not
  be verified and is not fixed.
- **Small islands are not in the 1:50m borders**: islands such as Penghu and Shengsi have no border
  polygon, so their shape is missing on the "plain" basemap (the relief and satellite basemaps show
  them); their farms still work, but clicking empty island land does not select a country.
- **Third-party services**: the Wikipedia API is rate-limited (cloud environments were observed getting
  429), in which case the info card shows links only; the zoomed-in Esri tiles are attributed per
  Esri's terms, and if the service fails only the close-up detail is lost.
- **Crimea**: Natural Earth draws Crimea as part of Russia by default; this site assigns it to Ukraine
  per UN General Assembly resolution 68/262, matching the country GEM gives its wind farms
  (`tools/build_borders.py`).

## Directions evaluated and deferred (with reasons, to avoid repeating the research)

- **Live work-vessel positions (AIS)**: evaluated in Sep 2026. The free real-time source needs a key, has no redistribution terms and barely reaches Taiwan's waters; details and the Taiwan port-call alternative are in item 3 of "Owner's new plans (Sep 2026)" above.
- **Energy Administration monthly/annual statistics API**
  ([ea01.moeaea.gov.tw](https://ea01.moeaea.gov.tw/a0303/02/database/api/)): too coarse (monthly data)
  and overlapping heavily with the existing live + 90-day daily data; it would not tell a new story.
- **CWA buoy data** (offshore sea-state observations, not land stations): in theory it would improve
  the wind reference for offshore farms, but there are few buoys and most are not near the farms, so
  the benefit is limited.
- **Ministry of Environment offshore-wind ecological monitoring** (bird and white dolphin monitoring
  reports): local measurements would be more convincing than the international studies the information
  pages cite now, but the data are mostly PDF reports — unstructured and not machine-readable. Revisit
  when a structured source exists.
- **GEM's 2026 farm data**: GEM's public map repo only has the February 2025 file (the 2026 path returns
  404), and the full download needs a registration form, so CI cannot fetch it automatically. The
  February 2025 release is used until a new public file appears; then rerun `tools/build_farms.py`.
- **The WAF block on the live supply/demand report**: retrying with a real browser User-Agent and
  Referer still returned 403, so the block is at the IP-range level, not about headers. Fixing it needs
  a different execution environment (see TODO); a code change alone cannot solve it.

## Possible directions (ideas, not yet in TODO)

- **Long-term supply/demand trends**: wind already has three layers ("live → 7 days → 90-day long-term
  trend"), while supply/demand has only one (live, or the daily fallback). Following the wind approach,
  `grid_status` could get a rolling history, a long-term archive and a trend chart showing the operating
  reserve rate over time, perhaps overlaid with wind's contribution for a correlation analysis.
- **Other energy sources**: the site focuses on wind, but the genary data also covers hydro, solar,
  thermal and nuclear units (the scraper already fetches them and keeps only the wind rows). A
  "live monitor for all sources" would only be a frontend job, but it is a major scope decision — confirm
  with the owner first instead of turning this into a whole-grid monitoring site on your own.
- **Onshore farm timelines**: if more verifiable public information becomes available for onshore farms
  (e.g. local government releases, the EIA tracking system), fill them in the same way as the 15
  offshore farms.
- **Stage-by-stage grid connection**: with stage-by-stage connection data (for Taiwan, compiled from the
  Energy Administration and developer announcements), farms could appear stage by stage on the timeline
  and farm sums would track the national year-end figures more closely. The data format already
  supports it (`ph` in `wind_farms.json`: an array of [year, MW]).
- **Small onshore farms**: GEM only covers onshore farms of 10 MW and above; small onshore farms in
  Taiwan, Japan and elsewhere can be added from local data.

## Deployment stability

- GitHub disables scheduled workflows in a public repo after 60 days without activity; currently
  activity comes indirectly from feature work and there is no dedicated keepalive. If development slows
  down, add a simple monthly workflow to prevent this, or switch to a Cloudflare Worker Cron (option B in
  `DEPLOY.en.md`: more punctual, no commit pile-up).
