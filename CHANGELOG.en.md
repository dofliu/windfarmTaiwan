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

## v3.17.2 — 2026-10-31

- **Readable country labels**: country names and capacities at continent and world zoom get a faint dark backing, so tall turbines of neighbouring countries no longer cut through the text; far event and port dots under a label are hidden (they come back when zoomed in, selected or hovered), so figures such as "Netherlands 11,762 MW" in the Europe view are no longer covered by red and white dots.
- **Imagery seam in the sea-level view**: the outer 10% or so of the fine satellite patch now fades out, so where it meets the coarse patch there is no visible straight line (the two often differ in tone).

## v3.17.1 — 2026-10-31

- **Whole farm in the close-up**: when a farm is picked, the camera height now follows the whole farm's extent (its real turbine positions where known) and the part of the map that is not covered, and the farm is centred in that part: above the bottom drawer on phones, left of the card on desktop. Before, phones aimed only at the record's coordinates on a narrow portrait screen and often showed one or two turbines with the rest under the drawer. When the turbine-position file finishes loading during the flight, the view is reframed on the real layout (not after the map has been dragged).
- **Last step of a camera flight**: at low frame rates the final step was taken for a wheel zoom and the height jumped several times over; fixed.
- **Card notes folded**: the research notes on foundations and dimensions and the notes on how positions and distance to shore are worked out now sit behind a "Sources and method notes" button (with how many there are), opened with one click and remembered by the browser. The caveats on measured, sampled and estimated output, approximate positions and data notes still show as before.

## v3.17.0 — 2026-10-31

- **Globe visuals tidied** (the owner asked on 31 Oct 2026 for the site's own critique of the visuals to be acted on):
  - **Water in the sea-level view**: open sea gets a water surface with ripples and a sky reflection (illustrative, said so in the notes), bright in the distance and darker close by instead of a flat blue; it covers the sea only, leaving land and about 700 m of the shore to the satellite imagery by the Natural Earth coastline. The imagery now sits 6 m under the water, so the jagged depth fighting in the distance is gone.
  - **Arrival camera in the sea-level view**: large farms are now seen from just outside their edge on the port side, looking about 1.5 km in (instead of from above the whole farm), so the nearest turbines read at their size; small farms are still framed whole.
  - **Coastline when zoomed in**: the base texture is about 10 km per pixel, so low land and shallow sea looked alike up close; the 1:50m land polygons now draw a crisp coast (land a little lighter, sea a little deeper), and near-shore farms show how far out they are.
  - **Live-data green ring**: the ring is 1.8% of the farm radius instead of 5% and less opaque, so a thick green ring no longer covers large farms.
  - **Globe edge**: country turbines fade out near the edge of the globe, so tall ones no longer stick out sideways into space.
  - **Dots at world zoom**: where event and port dots crowd together only one per 22 px shows (the more important first); all appear when zoomed in or selected.
  - **Owner text**: where the source data cuts an owner off mid-bracket (e.g. "JERA Co Inc ["), the bracket is dropped and "…" added.

## v3.16.1 — 2026-10-31

- **Port links, third batch** (Japan, Korea, Vietnam, China's Jiangsu/Fujian/Shandong, Denmark's Samsø): 17 farm–port links and 6 ports added (the floater yard at Fukue port, Goto; Hyundai Steel Industries' Yulchon plant on Gwangyang Bay; Horsens; Ba Son port at Phu My, Vietnam; Pingtan's Jinjing port area; the CNPC Offshore Engineering quay on Haixi Bay, Qingdao). Rudong's Xiaoyangkou wind-power mother port gains seven farms (H2, H3, H4, H6, H7, H8, H10: a Jiangsu feature states that all 13 Rudong farms were built from it), Sheyang port the Huaneng Sheyang H1 O&M base, Kitakyushu the floater assembly of the Hibiki demonstrator, Kashima the caisson load-out of the Choshi demonstrator. 136 → 142 ports; operating offshore farms with a port link 152 → 166 (173 of 330 with floating farms).
  Left out as plan-only or indirect: Nyuzen (Mitsui's 2018 plan to assemble at Shin Nihonkai Heavy Industries), the O&M ports of Jeju Hanlim and Goto Sakiyama, the control centres in Rudong's industrial park, Dafeng H8-1 "can ship from Dafeng port", Yanweigang (where a fish-release trip boarded); the 18 Mekong-delta farms in Vietnam still have no report naming a port.

## v3.16.0 — 2026-10-31

- **Faster loading (most visible on phones)**: the globe first loads a slim farm file (`wind_farms_core.json`: the columns needed to draw points, lists, filters and the timeline; about 0.8 MB compressed instead of 1.1 MB), then owners, turbines, notes and sources from a second file (`wind_farms_more.json`), updating cards and search when they arrive (the single-file copy keeps the embedded full file); the toolbar, panel and legend text is painted before any data arrives, and the heavy texture, border and symbol builds wait for the next frame. Learn now shows its text first and draws its charts one task at a time (nearest to the viewport first); the Taiwan live page no longer repaints itself while hidden (home, globe) and repaints once when entered. Local Lighthouse (mobile simulation): see the measurements in TODO.
- **Port links, second batch**: 26 farm–port links and 16 ports added (Putian Xiuyu, Wenzhou Dayu wharf, Haiyang, Qidong Blue Island, Ningbo Orient Cable, Cai Mep TCCT, Hartlepool, the Neptune dry dock on the Tyne, Blyth, Norddeich, Barhöft, Kårehamn, Pori Mäntyluoto, Copenhagen Refshaleøen, Kalundborg, Halifax); 120 → 136 ports, 21 → 23 countries, operating offshore farms with a port link 131 → 152. Four existing ports gain a role (Tyne marshalling, Gedser marshalling, Thyborøn O&M, Oostende foundations).
- GitHub Actions: the Playwright job of `pr-check` and `build-report` now run on `ubuntu-24.04` (`ubuntu-latest` moved to 26.04, where Playwright 1.56 cannot install Chromium's dependencies).
- **China's latest capacity** now comes from the National Energy Administration's Q3 2026 briefing (30 Oct): 58.21 GW onshore and 2.45 GW offshore added in January–September; the timeline's "latest available" moves to September 2026.

## v3.15.1 — 2026-10-28

- **Port links for the main European offshore farms**: 68 farm–port links added to the "farms served" lists in `ports.json` (37 offshore farms of 100 MW or more in the UK, Germany, the Netherlands, Denmark, Belgium, France and Sweden, plus Kentish Flats, Nordsee Ost and Shantou Lemen I), each with a source that states what the port did for the farm (owner or port news, government documents), quotes checked with `check_quotes.py`. 17 new ports (Ramsgate, Newhaven, Brightlingsea, Harland & Wolff Belfast, Zeebrugge, Klagshamn, Helgoland, Amsterdam, Harlingen, Urk, Hvide Sande, Thyborøn, Nyborg, Gedser, Rødbyhavn, Port-Joinville on Île d'Yeu, the Siemens Gamesa plant in Le Havre): 103 → 120 ports, 20 → 21 countries; Brest is back in use (Haizea Breizh tower assembly) and IJmuiden is now described as a multi-operator O&M hub. Operating offshore farms with a port link rise from 94 to 131 (116 of the 238 farms of 100 MW or more), so more farms start the sea-level view from a real port.
- `FAR_OK` in `qa_ports.py` can give a per-port distance (Helgoland 60 km). For 30 large farms in Jiangsu and Guangdong, Jeju Hanlim and the O&M port of Borssele III & IV no source naming both the port and the farm was found; they are listed in TODO.

## v3.15.0 — 2026-10-27

- **Sea-level view draws neighbouring farms**: other operating farms within 10 km (the nearest 12, at most 600 turbines) appear in a paler colour with their own positions (real or schematic) and sizes, named in the notes, so clustered farms (off Changhua and Miaoli, Fujian, the North Sea) no longer stand alone. Distances use the turbine-cluster centres, regional aggregates (such as the Jiuquan wind base) are never neighbours, and the credit line lists every position source used by the farm and its drawn neighbours. Where a farm's coordinates are only approximate, the notes warn that the scene may be off the real site, even on land.
- User guide 4.6a updated; the smoke test checks the neighbouring farms.

## v3.14.0 — 2026-10-27

- **Globe "sea-level view"** (`assets/js/scene.js`, loaded on first use; "🚢 Sail out to the farm" on the farm card, "🧭 Walk into the farm" for onshore farms; link `f=name&sv=1`): the camera starts at the farm's port (the nearest port whose "farms" list in `ports.json` names it), flies to the farm edge in 3–4 seconds and settles at a roughly 30° oblique view; orbit, zoom and pan follow, with "Sea level" (camera about 16 m up; eye height onshore), "Oblique 30°", "Sail again" and "Copy link"; "Back to the globe" or Esc removes the scene and the globe keeps its view, card and year.
  Turbines are drawn only at the site's real positions (USWTDB, MaStR, OpenStreetMap), otherwise in the close-up's schematic layout, labelled; hub height and rotor diameter come from checked or register values, otherwise labelled estimates; foundation bases follow the close-up; farms with live data in Taiwan, Australia and Canada turn their blades with the output now. Ground and sea carry Esri imagery (often older than the farm, as the notes say; the port area is imagery only with no buildings drawn; plain colours with a notice when offline). The approach is skipped under "reduce motion".
- User guide (4.6, 4.6a, `sv` in section 7), READMEs and CLAUDE.md (section 4) updated; the smoke test gains the sea-level view route.

## v3.13.0 — 2026-10-27

- **Teacher hub** `#/teach` ("For teachers" under "Explore" on Home and "Project" in the footer): activity cards (the kids page, class mode, Taiwan's wind right now, Home, the four hands-on panels, the globe tours, the country comparison, the data page), each with the suitable level, time, how to use it, a link and a QR code (`assets/vendor/qrcode-1.4.4.js`, MIT, generated in the browser; pointing to the public site), printable as a handout; projection and settings tips; a feedback link.
- **Two lesson plans with worksheets** (printable A4, worksheet and teacher's key on their own pages): `#/teach/jh`, junior-high science, 45 min, "How much power is Taiwan's wind making right now?" (live data, the weekly recap, where the farms are, arguing the "no wind, no power" myth; Nc-Ⅳ-2, Nc-Ⅳ-4, Nc-Ⅳ-6, INa-Ⅳ-4, 能 J1/J3/J5) and `#/teach/sh`, senior-high scientific inquiry and practice, 2 periods, "Does a wind farm really generate all the time?" (capacity factor from official measured output, comparison across countries, argument and sharing, a rubric; the four inquiry items, CNc-Vc-1, 能 U6/U7/U9). The curriculum and issue passages are the original wording of the academy's guidelines and its issues-integration handbook (checked with `check_quotes.py`); the worked examples in the key are computed from `generation.json` at render time.
- **Data page** `#/data`: seven datasets (Taiwan daily samples per grid unit, daily totals, national capacity by year, measured farm output, operating farms, offshore foundations and dimensions, global LCOE) converted to CSV in the browser (UTF-8 with BOM), each with columns, source, licence and a link to the raw JSON; a suggested citation with one-click copy.
- User guide (6.1, 6.2), READMEs and CLAUDE.md updated; the smoke test checks the four new pages and adds them to the performance budget.

## v3.12.0 — 2026-10-26

- **Schedule status page** `#/status` (linked under "Project" in the footer): the last data time of every source (Taipower live, daily samples, supply and demand, each live source abroad, Wind now, the official retrospective archive) graded against its expected cadence, the latest GitHub Actions run of every schedule (public API, no login) and the upload time of the single-file copies; a one-line summary at the top, reloaded every 5 minutes while open. The monthly check in DEPLOY's "Maintenance" now starts from this page.
- **Accessibility**: the smoke test gains axe-core (WCAG 2.1 A/AA and best-practice rules on every page; Home, Taiwan live, Learn and the status page again in light mode for contrast), a keyboard check (the first 14 Tab stops on Home visible with a focus ring) and a reduced-motion check. Findings fixed: light mode's green `--live` is now #0b7a5d (white text 5.3:1, was 4.3), the chapter number in the narrow-screen chapter bar is darker in light mode, footer headings are h2, Home and Taiwan live have an h1 (the embeddable card's title is an h1), the chart-tab buttons on the Charts tab and in the globe's side panel use `aria-pressed`, the globe's year slider and focus select have names, the kids page's "Read to me" and home icon buttons have names, charts that can be stepped with the arrow keys are `role="group"`, and "Skip to content" moves focus directly (it used to set the URL to `#main` and route back to Home).
- **Performance**: Learn's foundation charts read the new offshore extract `data/global/offshore_farms.json` (about 80 kB, built by `tools/build_farm_points.py`; they used to load the 4.3 MB farm file, giving an LCP of 9.3 s in Lighthouse's mobile simulation); number formatters are cached (Home formats hundreds of numbers on every update). The smoke test gains a performance budget: `tools/perf_budget.json` caps the same-origin bytes each page may load in a fresh tab. A new manual `lighthouse` workflow runs Lighthouse against the deployed site, with the scores in the job summary and the reports as artifacts.
- The user guide (footer, keyboard, schedule status), DEPLOY, the READMEs and CLAUDE.md (section 5, testing) are updated.

## v3.11.0 — 2026-10-26

- **Record notice** (today's wind on Home): the site's daily samples decide whether yesterday was the windiest day since sampling began (15 Jun 2026) or so far this month, and whether now (or a moment earlier today) is the highest output the site has sampled. Each day's highest sample (`mx` in `farm_daily.json`) is recorded by the scraper from today; `tools/build_farm_daily.py --remax` fills it from the samples already there (the weekly schedule now passes it), and the comparison starts once 14 days have built up.
- **Hands-on lessons in Learn** (`assets/js/lessons.js`): four slider panels: chapter 9 "One turbine's power curve" (wind speed, rotor diameter, rated power, power coefficient; a simplified model with the Betz limit dashed), chapter 6 "The wake effect" (the spacing of a row of 5 turbines; Jensen's 1983 single-wake model), chapter 11 "Capacity factor" (pick a farm with official measured yearly output to see how it is computed) and "Wind keeps getting cheaper" (global weighted-average LCOE, IRENA via Our World in Data, CC BY 4.0, constant 2025 US$ per kWh; the new data file `data/global/lcoe_wind.json` is built by `tools/build_lcoe.py`).
- **Kids page reuse**: stop 7's "Compare" draws the turbine of Taiwan's first offshore farm (hub 110 m, rotor 154 m) against Taipei 101 to scale and lays the rotor circle over football pitches; "Taiwan's wind right now" gains "This week's wind" (each of the last 7 days' average output) and "📍 Where is the nearest turbine to me?" (location only when pressed, never sent; direction, distance and size in kids' words).
- **Embeddable card** `#/embed`: Taiwan's wind right now as a small card without header or footer (output, availability, homes supplied, share of national generation, the first line of today's wind, the past 7 days, the data time and a link back to the site) for schools or other sites to put in an `<iframe>`; `?l=en` for English, `?t=light` for light colours. Share in the header gains "</> Embed on your site", which copies the `<iframe>` snippet.
- The user guide (Home, Learn, kids, links and sharing), the READMEs and CLAUDE.md are updated; the smoke test checks the four lessons, the embeddable card, stop 7 and the new cards on Taiwan's wind right now.

## v3.10.0 — 2026-10-25

- **This week in Taiwan's wind** (the owner chose the two-week bars plus a shareable card from samples on 25 Oct 2026, on Home): a new Home section compares the last 7 complete days with the 7 before, from the site's samples about every 30 minutes (private farms included): a headline, two weeks of daily average output as bars, the windiest and calmest days, the highest moment and the farm with the highest capacity factor; days with fewer than 12 samples are hatched with the sample counts given, and it says these are estimates from samples, not official generation. "Share this week" and Share in the header both make a square weekly card.
- **"Near me" loads faster**: it now reads the new slim `data/global/farm_points.json` (operating farms only, about 1.5 MB, 0.5 MB compressed, instead of the 4.4 MB farm file), built by `tools/build_farm_points.py` and re-checked by pr-check; the single-file copy keeps using its embedded full file.
- **Hub heights corrected**: Yunlin 87 → 110.5 m (developer Skyborn's English project page; with a 167 m rotor, 87 m would leave the tips 3.5 m above the sea, so it is a height above the platform), Hywind Tampen 95 → 106.5 m (derived from two Norwegian sources giving about 190 m to the tip above the sea and a 167 m rotor). "How big is one turbine" skips sizes that would leave the tips under 10 m above the sea.
- The user guide (Home, Share), the READMEs and CLAUDE.md (run `build_farm_points.py` after rebuilding the farm layer) are updated; the smoke test checks the weekly recap and the weekly card.

## v3.9.1 — 2026-10-25

- **US latest-available capacity updated**: EIA-860M September 2026 edition, onshore 165,970.0 MW (August edition 165,745.2 MW), offshore 972.0 MW (unchanged); the same method on the August edition reproduces the earlier figures. The US value for 2026 (latest available) on the globe follows.
- **Grid fallback wording corrected**: government open dataset 19995 has one row per day but is **published monthly** (around the 5th, up to the end of the previous month), not daily; the live page now says "official daily data (published monthly), not live", and the user guide, DEPLOY and ROADMAP say the same.
- Taiwan's September table 4-02 and China's NEA first-three-quarters figures were still unpublished on 25 Oct and will be checked again in early November (noted in TODO); the TODO and ROADMAP hand-off sections are updated to v3.9.1.

## v3.9.0 — 2026-10-25

- **📍 Wind near me** (the owner chose the map version from samples on 25 Oct 2026): a button under today's wind on Home asks the browser for your location only when pressed and opens a map centred on you (the wind now in turbine colours with direction ticks, the 5 nearest operating farms with distances, a scale bar), with the wind speed, direction and turbine band where you are (GFS, 10 m above ground, interpolated from a 1° grid) and the nearest operating farm; in Taiwan it also lists the nearest farm with live data and its output now. Your position is used only in this browser; it is never sent anywhere or stored.
- **Globe "📍 Near me"**: a new toolbar button that moves the timeline to the latest year, flies between you and the nearest operating farm, opens its card and marks "📍 You are here"; the public single-file globe has it too.
- The user guide (Home, globe toolbar) is updated; the smoke test checks both buttons.

## v3.8.0 — 2026-10-25

- **How big is one turbine** (the owner chose the three comparison cards plus the pitch drawing from samples on 25 Oct 2026): globe farm cards and the Taiwan live farm details (offshore) gain an expandable "📏 How big is one turbine?": the highest blade tip against Taipei 101 (508 m, CTBUH), the rotor diameter against a standard football pitch's length, and the area one turn sweeps in standard pitches (FIFA's recommended 105 × 68 m), with a view from above of the rotor disc and pitches to the same scale. Sizes come from the site's checked hub heights and rotor diameters (tower heights alone are not used), then USWTDB / MaStR turbine data; with mixed models the largest is used.
- **Compare with something else** (the owner chose "tap to change"): tapping the Taiwan live "homes" card cycles through 1-ton air conditioners (~900 W, Hsinchu County), phones charged per hour (0.019 kWh, US EPA), Gogoro batteries (1.74 kWh, Gogoro) and Taipei Metro systems on average (~700 GWh a year, Taipei Metro); the browser remembers the choice. The 0.5 kW per home now cites Taipower's 2025 average household use (308–418 kWh a month). Every source quote was checked with `check_quotes.py`; figures without an official source (Boeing 747 wingspan, train-only power for THSR and the MRT) are not used.
- The user guide (dashboard, farm details, farm cards) is updated; the smoke test checks the conversion card and the scale panel on farm cards.

## v3.7.0 — 2026-10-24

- **Today's wind on Home** (the owner chose the headline-plus-chips style from three samples on 24 Oct 2026): the top of the right-now block has a headline computed from the data, with two small chips below. The lines come only from data: the GFS model's strongest wind over the sea near Taiwan with its Beaufort force (with the model time), the output now against the site's samples over the past 7 days, the change over the last 2–4 hours, availability close to full or very low, and homes supplied, in order of importance.
- **Share cards in three formats**: Share on Home and Taiwan live first asks for Square 1:1 (1080×1080), Wide 1.91:1 (1200×630) or Story 9:16 (1080×1920), or copies the link only. The card adds the wind near Taiwan right now (GFS, 10 m above ground, in the turbine colours of the globe's Wind now, with wind-direction ticks, land and the farms), the first line of today's wind, the past 7 days and the data time with the year; it replaces the live page's old square card.
- **Light mode** (for projectors): the ☀ / ☾ button in the header, remembered by the browser; the site's colours now switch through tokens, and chart rings and grid lines follow. In light mode the Taiwan live map uses Esri's light grey base map; the 3D globe on Global stays dark.
- The user guide (header, Home) and the READMEs are updated; the smoke test checks today's wind, the three card sizes and the light-mode toggle.

## v3.6.0 — 2026-10-23

- **Wind now redesigned** (chosen by the owner on 23 Oct 2026 after nine samples):
  - The particles are white, brighter and thicker with speed, with a soft glow where they overlap; zoomed in, the canvas has twice the resolution and fast particles move in small steps, so trails are thin and continuous instead of dashed.
  - A translucent colour wash underneath shows wind speed, so a typhoon's extent is obvious at a glance; it is computed from the same wind file, which does not grow.
  - The legend switches the wash between **Speed** (more magenta = stronger, a 0–35+ m/s gradient) and **Turbines** (grey below 3 m/s = barely turning, blue-green 3–12 = output rising, bright green 12–25 = full output, magenta above 25 = shut down). The turbine view is indicative, from 10 m wind; the legend says hub-height wind is stronger and models differ. `fc=t` in the URL opens the turbine view. Colours checked for colour-blind readers.
- Fix: on the 2.5D flat map, zooming in hid Wind now under the high-resolution tiles (the tiles are raised; the wind layer now rises above them).
- The user guide (Wind now, URL parameters) is updated.

## v3.5.2 — 2026-10-23

- **Two more speed steps in Wind now** (the owner's request on 23 Oct 2026): the top step used to be "≥12 m/s"; it is now split into 12–25 m/s (light magenta) and 25 m/s and above (deep magenta, typhoon strength), while speeds below 12 m/s still get brighter with speed. The satellite and other base maps each have their own colours, and the legend follows. The user guide is updated.

## v3.5.1 — 2026-10-22

- **Taiwan live data updates more often** (the owner reported on 22 Oct 2026 that at noon the site still showed 7 a.m. data): GitHub's schedule is often late or skipped, so the 2-hourly job ran only 3–6 times a day, up to 6 hours apart, and Taipower's live data does not allow cross-site reads, so the page cannot fetch it directly. An external cron service now starts the fetch through the GitHub API about every 30 minutes (setup under "External trigger" in DEPLOY.en.md), with GitHub's 2-hourly schedule kept as a fallback.
- The trend file `wind_history.json` gains only about one point an hour, its last point always the newest data, so it does not grow with the more frequent fetching; the Taiwan live samples (`farm_daily.json`) get denser.
- The update-frequency wording on the site and in the user guide, README and DEPLOY now says "about every 30 minutes"; the sample notes say it was about every 2 hours before 22 Oct 2026.

## v3.5.0 — 2026-10-19

- **Travel with the Wind, second version** (started at the owner's request on 19 Oct 2026; the three items listed when the first version was handed over):
  - **Read to me**: a new button in the page's toolbar (under Breezy on the welcome screen) reads out the screen's facts, question and options with the browser's own speech synthesis, saying units such as MW and GW as words; press again to stop, and it stops on its own when the screen changes. Nothing is sent anywhere; without speech synthesis or a voice for the language, the button is disabled or shows a notice.
  - **Printing the passport, and a certificate**: the passport has "Print passport" (only the passport itself, without buttons or the site's header and footer); with all 8 stamps a "Certificate" button appears (`#/kids/cert`): the "Wind Explorer Certificate" carries the name, the 8 stamps and the date you finished, and "Print" fits it on one A4 page. The date is recorded when the eighth stamp is collected (for passports completed earlier, the day it is opened).
  - **Play as a class** (`#/kids/class`, `?n=1` to `8` starts at a stop): a large-type version for a teacher's projector with three steps per stop, "Facts → Question → Answer"; during a question start a 10-second countdown, tap the answer most of the class chose (a wrong one is explained) or reveal it. →, the space bar or a clicker's "next" moves on, ← goes back, and F puts the page in full screen. This mode gives no stamps and keeps no one's progress; the welcome screen links to it under "For teachers".
- User guide section 6 and the links section, and the README summaries, updated; the smoke test checks the read-aloud button and text, the three class steps without touching personal progress, and printing and the certificate once all 8 stamps are collected.

## v3.4.0 — 2026-10-19

- **New page: "Travel with the Wind" for young explorers** (`#/kids`; settled on 19 Oct 2026 after the owner reviewed the prototype on the design canvas: the guide character Breezy (小風) and eight stops): for upper primary and junior high students, to play alone or project in class. Light colours, large type and big buttons, in both languages following the header switch.
  - **Globe** (`#/kids/globe`): a 3D globe with countries in 6 shades by installed capacity at year end and the 8 stops as numbers; hovering over or tabbing to a stop in "The route" turns the globe to it; the "Time machine" plays 1980 to 2025; "Who has the most wind power?" draws the top 5 and Taiwan with poles to scale.
  - **Eight stops** (`#/kids/stop?n=1` to `8`): Brush 1888, Gedser 1957, Muppandal 1986, Vindeby 1991, Jiuquan 2009, Hywind Scotland 2017, Formosa 1 2019 and Dongfang Electric's 26 MW turbine 2025. Each has a photo (Wikimedia Commons; an illustration when there is none or it cannot load), three key facts and a quick question, with figures from the site's milestones, country capacity and foundation data; stops 6 and 8 compare the turbine with Taipei 101 at the same scale. A wrong answer explains why; the right one stamps the passport and offers the next stop.
  - **Taiwan's wind right now** (`#/kids/taiwan`): the live output turned into roughly how many homes, a comparison with the windiest moment of the past 7 days and how many farms are generating; labelled as simulated when Taipower's data cannot be reached, and as an offline snapshot in the single-file copy offline.
  - **Wind passport** (`#/kids/passport`): a name, 8 stamps and three badges; progress stays in this browser (no sign-up, nothing uploaded) and can be started over.
  - An entry banner under "Explore" on the home page and a link under "Project" in the footer. The page's script and styles load only when it is opened; the full single-file copy embeds them (build list `KIDS`), the public global wind map does not.
- New user guide section 6 (former sections 6–10 are now 7–11), with the page's links in the links section; README summaries updated; the smoke test checks the kids globe's 8 stops, that a wrong answer gives no stamp and the right one stamps and offers the next stop, that the passport remembers it, and the kids globe in the full single-file copy.

## v3.3.0 — 2026-10-18

- Easier to use (the first three items the owner picked on 18 Oct 2026):
  - **Back closes what is open first**: the farm details on Taiwan live, and the globe's info card, sources dialog and maximised analyses, close with the browser's or phone's Back button without leaving the page; closing them with × or Esc removes the extra history entry, so no second Back is needed. Things opened from a link (a shared link, or coming back with Back) add no entry, and the globe also closes a card or analysis when you go back to a link without one.
  - **The dashboard remembers its sort and filters and puts them in the link**: your own changes are saved in the browser for the next visit, and the link follows them (`#/live?sort=cap&type=offshore`; parameters `sort`, `group`, `type`, `dev`, `brand`, `size`), ready to share. A link that carries them wins without overwriting what you saved. "Reset" appears in the toolbar once anything is changed. The link also gains `farm=` while details are open, and `mode=` for the chart on the Charts tab.
  - **Previous / next farm in the details**: ‹ › at the top (← → keys, or a sideways swipe on phones), with the position shown; the dashboard follows its current sort and filters (folded cards included), the other tabs the current output.
- User guide sections 1, 3, 4.2 and 6 and the README summary updated; the smoke test now checks that filters reach the link and the browser, Reset, the next-farm button, and that Back closes only the details and the globe card.

## v3.2.1 — 2026-10-18

- **A compact view on the dashboard** (the compromise the owner chose after the before/after comparison; canvas board 7): "Generating now" lists at most 8 cards first (in the current order), with "N more generating · show all cards" when there are more; with all 30 farms generating in strong wind, the dashboard on a phone shrinks from about 4,700 px to about 2,300 px. "Show all cards" and "Show as cards" now open the same all-cards view (by group), and "Compact view" returns. Sorting, grouping and filters stay on the dashboard; the farm grid and the home page's Explore section are unchanged.
- The MW total of "Generating now" gets a thousands separator.
- User guide section 3 and TODO updated; the smoke test now checks that the compact view shows at most 8 cards and the all-cards view every farm.

## v3.2.0 — 2026-10-18

- Interface review, batch 3: home page, Learn, icons and footer (review canvas: https://claude.ai/artifact/4ZoaNBVQ4FAVhv9a46JiDe ):
  - **A 7-day output curve on the home page's Taiwan card**: Taiwan's total output over the past 7 days from the site's scheduled samples (`wind_history.json`), with now and the 7-day high marked; hover or use the arrow keys for each point's time and output, and the caption gives the number of samples (unevenly spaced). In light wind the middle of the card is no longer just one line of text.
  - **Home page on phones**: the four "Taiwan in the world" figures and the four "Explore" cards are in two columns, and the Explore cards keep only the icon, title and two lines of text.
  - **Learn**: on phones and tablets (1100 px and below), once you scroll past the contents at the top a "current chapter ▾" bar with reading progress appears under the header; tap it for the contents. Jumping to a chapter from another page now re-aligns once the charts above have drawn, instead of stopping short.
  - **Line icons instead of emoji**: the home page's Explore cards (green = live, amber = history) and the dashboard's four "How much is this power" tiles; the mood line's emoji became a four-level wind bar.
  - **Footer sources in four groups**: Taiwan, live output abroad, yearly statistics & farms, and maps & other, each group name linking to its part of "Sources & method" (`#/learn/sources?s=tw|intl|global|all`); the names are unchanged.
  - One threshold for "generating" across the site: the dashboard's unit count, the mood line's "resting now" and the "Generating now" section all count farms showing 0.1 MW or more.
  - User guide sections 1, 2, 5 and 6, ROADMAP and TODO updated; the smoke test checks the home page's 7-day curve, the footer links and the Learn current-chapter bar.

## v3.1.0 — 2026-10-18

- Interface review, batch 2: Taiwan live reads well in light wind too (review canvas: https://claude.ai/artifact/4ZoaNBVQ4FAVhv9a46JiDe ):
  - **The dashboard shows who is generating first**: when some farms are generating and others are not, "Generating now" at the top lists the cards of the farms with output (0.1 MW or more as shown) in the chosen order, and "No output right now" below lists only their names by group (click a name for details, or "Show as cards" for cards again). In strong wind, with every farm generating, the page looks as before. Sorting, grouping and filters apply to both parts, and the ranking chart uses the same threshold.
  - **Farm cards on phones are one per row**: full name, output on the right and the capacity bar below, so 6–7 farms fit on a screen (they were two columns with names often cut off).
  - **An offline sketch for the map**: when the map library (Leaflet, loaded from cdnjs) cannot be loaded — offline, or the single-file copy offline — the tab no longer just says it failed; it draws the 30 farms' approximate positions on Natural Earth's outline of Taiwan (the same borders file as the globe), in the same colours and sizes as the satellite map, labelled as an offline sketch. Click a circle, or select it with the keyboard and press Enter, for the details.
  - User guide sections 3 and 7 and the README updated to match; the smoke test checks that the dashboard folds and expands, that the map tab has the map or the sketch, and that the single-file copy draws the sketch offline.

## v3.0.1 — 2026-10-18

- Interface review, batch 1 (copy and small fixes; review canvas: https://claude.ai/artifact/4ZoaNBVQ4FAVhv9a46JiDe ):
  - **Home page figures corrected**: the globe card under "Explore" and the page description still said "15,000+ wind farms, nearly 8,000 pipeline projects", the figures from GEM 2025-02; they now give the current data, about 31,000 wind farm records (nearly 9,600 of them pipeline projects), and mention the national or grid live totals for 10 more countries (both languages).
  - **Home page global card**: a line under the end-2025 figure gives the world figure for "2026 (latest available)" and how it is made up (how many countries have this year's figures, up to which month, the rest carrying the end of 2025), computed the same way as on the globe.
  - **Taiwan live › Charts › Ranking**: farms with no output right now fold into one line, "N more with no output right now", which opens the rest; when every farm or no farm is generating, the full list shows as before.
  - **Globe**: values in the panel profile no longer break across two lines, with the onshore/offshore split of "Added this year" on a line of its own; on phones, labels now keep clear of the bottom drawer and the floating toolbar, and the attribution line moved to the bottom of the drawer's handle row (tap for the full text) instead of covering the port markers at the top of the map.
  - User guide sections 2, 3 and 4 updated to match.

## v3.0.0 — 2026-10-17

- Last step of the globe layout redesign (step 7 of the design canvas, "shapes only on the globe"). This completes the redesign begun at v2.40.0 (seven steps: grouped toolbar, merged readout and legends, context panel, analyses in the panel, phone bottom drawer, first-visit start cards, shapes only), which counts as a full redesign under the versioning rules, so the major version moves to 3.
  - **Shapes only on the globe**: event markers and milestone stars are still drawn, but their titles and names now appear only when hovered, selected or just reached while the timeline plays (never while paused); the current stop of a story tour keeps its name. Country and farm names still follow the label density in the View menu.
  - User guide 4.1, 4.5 and 4.7 updated; the smoke test checks that no event or milestone labels show while paused. ROADMAP and TODO status updated.

## v2.44.0 — 2026-10-17

- Fifth step of the globe layout redesign (step 6 of the design canvas, the "first-visit entry", direction C's optional piece):
  - **Start cards on the first visit**: opened without URL parameters for the first time, the globe now shows four cards — "Watch wind power grow" (play from 1980 to today), "Compare countries" (Taiwan, China, the US and Denmark side by side), "See right now" (the live-data layer plus the list of live output everywhere) and "Hear the story" (the four story tours and the auto tour) — instead of playing from 1980 straight away; "Just show me the map", ✕, a click outside or Esc closes them.
  - The visit is remembered in the browser, so later visits without parameters autoplay as before; "✦ Start cards" at the top of the "▶ Tour" menu reopens them. The public single-file copy has no cards.
  - User guide section 4 intro, 4.3 and 4.9 updated; the smoke test checks that the cards appear and that "explore" closes them and starts playing.

## v2.43.0 — 2026-10-17

- Fourth step of the globe layout redesign (step 5 of the design canvas, the "phone bottom drawer", 640 px and below):
  - **Full-screen map**: the toolbar floats at the top edge with only Focus, Search, Layers and "⋯" (View, Analyse, Tour, Sources and Speed sit inside ⋯); the legend is at the top left and the attribution at the top right.
  - **Bottom drawer**: the timeline, the readout, the side panel and the card all move into a drawer. Its handle row holds the play button, the year, the scope's figures and the slider (the figures sit next to your finger while you drag), and it has three heights: handle only, half (panel or card) and full. Drag the handle or the panel header up or down to change height; tap the grip or the figures to switch between closed and half; Search opens it fully to make room for the keyboard.
  - **Cards inside the drawer**: tapping a farm, port, event or milestone opens the card at half height (the upper map stays visible); drag up for the rest; closing the card returns to the panel; the story tour keeps it at half height.
  - Tablets (641–900 px) and desktop are unchanged. User guide 4.1 and section 8 updated; the smoke test checks the three drawer heights and that the card opens in the drawer at phone width.

## v2.42.0 — 2026-10-17

- Third step of the globe layout redesign (step 4 of the design canvas, "analyses into the panel"):
  - On desktop the three analyses (Output, Compare, Makers & owners) now show inside the side panel's "Analyse" tab in a narrow layout, with a new "Analyse ▾" menu in the panel; "⤢ Maximise" turns one into the former window over the map and "⤡ Back to panel" returns; ✕, Esc or switching tabs closes it. Phones (900 px and below) keep opening the window directly.
  - "See rankings" on a farm card now steps the card aside on desktop and opens the ranking in the panel, scrolled to that farm. The URL parameters `out`, `cmp` and `mk` are unchanged; shared links open in the panel on desktop.
  - User guide 4.1, 4.5 and 4.8 updated; the smoke test checks either container.

## v2.41.0 — 2026-10-17

- Second step of the globe layout redesign (step 3 of the design canvas, the "context panel"):
  - **The side panel becomes a context panel**: a breadcrumb "World › continent › country" at the top, with earlier steps clickable; the tabs are reduced to "Profile" and "Lists ▾", and the five lists (Milestones, Farms, Pipeline, Ports, Events) sit in a drop-down with their counts in the current focus, the button showing the chosen list's name. With no country selected the panel opens on the world or continent profile (it used to open on Milestones).
  - **Desktop cards take the panel's place**: clicking a farm, port, event or milestone makes the panel step aside and the card appear in the same spot; closing it brings the panel back, so the card no longer floats over the globe at the bottom left. Phones keep the card sliding up from the bottom. Panel and card are both 340 px wide.
  - User guide 4.1, 4.5 and 4.6 updated to match.

## v2.40.0 — 2026-10-17

- First step of the globe layout redesign (direction A of the design canvas of 17 Oct 2026; layout only, data, URL parameters and card content unchanged):
  - **Grouped toolbar**: only "Focus" and "🔍 Search" stay as primary controls; everything else moves into three drop-down menus — "View" (layout, projection, basemap, labels, auto-rotate), "Layers" (the six toggles Pipeline, Ports, Events, Sea zones, Live data and Wind now, each with its legend colour and the record count in the current focus;
    the "Show" menu from the timeline and the former stand-alone "Indicator" menu move here too) and "Analyse" (Output, Compare, Makers & owners). The "Layers" button shows how many layers are on; one menu opens at a time and closes on an outside click or Esc; on phones the toolbar no longer needs sideways swiping to reach a button.
  - **Readout**: the big year and the scope statistics at the top left become one block and gain "Added this year" (the year-on-year difference of the scope's year-end totals, following the onshore / offshore choice in "Show").
  - **Legend panel**: the legends for foundations, indicators, live data, sea zones, wind now, wind speed, pipeline and live output all move into one panel at the bottom left that lists only what is on, instead of sitting in different corners; it shifts right while a card is open.
  - User guide 4.1, 4.3, 4.4, 4.7 and 4.8 and the README updated to match.

## v2.39.1 — 2026-10-14

- "Makers & owners" now uses MaStR's per-turbine manufacturers for Germany: `tools/build_mastr.py` writes each maker's net rating (`mk`) for mixed-model farms and `tools/build_market_shares.py` splits by it (units filed as "Sonstige" count as unknown).
  Germany's capacity with a known maker rises from 54% to 93% (Enercon 34%, Vestas 26%, Siemens Gamesa 12%, Nordex 12%, Senvion 7%, GE Vernova 6%) and the world's from 23% to 26%.
  Only the `mk` computed from the 2026-10-13 export was merged into the existing `turbines_de.json` (the 1,695 farms whose unit count and capacity were unchanged); the farm matching was not rerun. User guide 4.8b and the sources texts are updated.

## v2.39.0 — 2026-10-14

- The globe gains "**🏭 Makers & owners**" (ROADMAP phase 2, "turbine makers and developers", picked by the owner on 14 Oct 2026): opened from the toolbar or a country profile, with the world, a continent or a country as scope and the URL parameters `mk`, `mkv` and `mkt`.
  - **Turbine makers**: the capacity of operating farms in the site's farm records at the end of the chosen year ranked by maker, for all, onshore or offshore, plus a stacked bar chart of the capacity added each year over the last 25 years by maker (one colour each for the top 5, checked with the dataviz colour-blind validator). Makers come from USWTDB for the US, MaStR for single-model German farms and the farm record's turbine field elsewhere, with brands folded along their history (NEG Micon, MHI Vestas → Vestas; Siemens, Gamesa, Bonus, Adwen → Siemens Gamesa; Enron Wind, Zond, Tacke, Alstom → GE Vernova; Acciona Windpower → Nordex; REpower → Senvion).
  - **Owners**: owners of GEM's February 2026 operating units with capacity split by stake, top 15 for the world, each continent and each country; subsidiaries are merged only when the group's name is part of their own.
  - **Coverage**: the share of capacity with a known maker (owner) is always shown, with a warning that the figures are not market shares when it is under half. A maker is known for about 23% of the world's capacity, 72% of offshore, 81% of the US, 96% of Taiwan and about 4% of China; an owner for about 72% of GEM's operating units.
  - New data `data/global/market_shares.json` (`tools/build_market_shares.py`, about 90 KB); `tools/build_turbines.py` adds each maker's summed rating for mixed US farms (`mk`, rebuilt from USWTDB V9.1, nothing else changed). The sources dialog, the Learn section's "Sources & method", the READMEs and the user guide (new section 4.8b) are updated; the English user guide's country-profile buttons now list "Compare".

## v2.38.1 — 2026-10-14

- Time-sensitive checks, first round ("Next-step options" group 1): on the timeline's "2026 (latest available)" India moves to MNRE's cumulative 59,201.07 MW at 30 Sep 2026 and Brazil to January–September (the SIGA plant list of 12 Oct 2026 still shows the same 3 farms, 184.5 MW, so the figure is unchanged); Taiwan's September table, the EIA-860M September edition and China's first-three-quarters briefing wait for their month-end releases.
  The Australian/Canadian live-unit mapping was rerun (only IESO's Wolfe Island registered capability changed, 171 → 140 MW). Taiwan's offshore projects (Taipower phase 2, Wo-4, Hai Long, Yude and Huanyang) and the offshore farms under construction elsewhere (Baltic Power with all 76 turbines installed on 7 Oct, Dieppe-Le Tréport at 41 of 62, and others) have reached neither full commercial operation nor formal termination, so no record changes; the verified notes are in `tools/research/`.

## v2.38.0 — 2026-10-14

- The globe gains a **country comparison**, **indicator colouring** and **yearly additions** (the three ROADMAP phase-2 items the owner picked on 14 Oct 2026):
  - **Country comparison**: "⚖ Compare" in the toolbar or the "Compare" button in a country profile puts 2–4 countries side by side (Taiwan, Denmark and Germany by default): cumulative-capacity curves from 1980 to the latest year plus a table for the year — capacity at year end, onshore, offshore, world rank, share of the world, added this year, added in the last 5 years, growth over 10 years, per capita, wind share of generation, capacity factor (national average), operating farms on this site (count and capacity) and the largest farm; the year can be changed (in step with the timeline), Taiwan added and the link copied. URL parameter `cmp=TWN,DNK,DEU`.
  - **Indicators**: the toolbar's "Indicator" menu colours the map by capacity at year end, per capita, wind share of generation, capacity factor or added this year (six steps of one hue with fixed breaks; the legend names the source and data year; countries without data stay uncoloured), hovering over a country shows its value, and the bar race ranks by the indicator as well. It cannot be combined with the "Live data" colouring. URL parameter `ind=share` and so on.
  - **Yearly additions**: country profiles gain four rows — added this year (onshore / offshore), per capita, wind share of generation, capacity factor — and a "capacity added each year" onshore / offshore bar chart (last 25 years, years with more decommissioning than new build below the baseline); the world and continent profiles show the chart too.
  - **New data**: `tools/build_country_indicators.py` builds `data/global/country_indicators.json` (79 countries, 2000–2025) from Ember's Yearly Electricity Data (wind share, generation, capacity, total generation; CC BY 4.0) and Our World in Data's population (CC BY 4.0, to 2023); the extracts are committed under `data/global/sources/`.
    Capacity factor = generation ÷ (mean of the two year-end capacities × hours in the year), a national average including curtailment, blank outside 5–60%; per capita = the site's year-end capacity ÷ the population of the year, carried forward with a label after the last population year. The sources dialog, the Learn section's "Sources & method" and the READMEs credit Ember and Our World in Data.
  - The user guide gains section 4.8a "Country comparison and indicators"; both single-file copies include the new data.

## v2.37.0 — 2026-10-11

- A data-quality push (the owner asked on 11 Oct 2026 to complete the "data quality beyond the open doubts" item in one go):
  - **Placeholder points moved to township or county centres**: the new `tools/fetch_gem_locations.py` reads the "Location" text (township / county / province) of each GEM project page, finds the matching Wikidata item through OpenStreetMap Nominatim and takes the item's coordinate (CC0; OSM is only the lookup index and no OSM data is written),
    accepting a result only when the province name matches, it lies within 800 km of the old placeholder and the two coordinates are within 50 km; townships without a coordinate or with a mismatch fall back to the county, then the city; where Nominatim finds nothing, Wikidata is searched directly (SPARQL: same country, has a coordinate, is a settlement or administrative area, and the chain of containing areas carries the county and province GEM names). The result, `data/global/sources/gem_locations.json` (1,204 farms: 422 townships, 752 counties or districts, 30 cities; China 905, India 204, Spain 49, Italy 16),
    is applied at build time by `GEM_LOC_RULES` in `farm_cleanup.py` as approximate positions (flag 1 kept; the 139 farms without a result stay on the province centre), listed in the new [docs/data-locations.en.md](./docs/data-locations.en.md).
    Operating farms on shared placeholder points fell from 1,349 on 172 points to 722 on 138 (farms in the same county now share the county centre). The card wording, the "Limits of the data" and "Sources" dialogs, Learn chapter 13, the README and the user guide were updated.
  - **Ports**: 16 in China (Rudong Xiaoyangkou, Yangjiang Jishu, Jieyang Qianzhan, Shantou, Fuqing Jiangyin, Dajin's Penglai and Caofeidian bases, Dongying Guangli, Zhoushan Liuheng, Shanwei Lufeng, Yancheng Sheyang and Dafeng, Putian Pinghai, Rushan, Wenzhou Zhuangyuan'ao, Xiangshan Hepu),
    4 in Korea (Mokpo New Port, Gunsan, Ulsan New Port, LS Cable Donghae), 4 in the Philippines (Currimao, Batangas, Jose Panganiban, Agila Subic), 19 in Europe (Vlissingen, Den Helder, IJmuiden, Emden, Nordenham, Aalborg, Lindø / Odense, Brest, Port-la-Nouvelle, Fos-sur-Mer, Świnoujście, Gdańsk, Szczecin, Viana do Castelo, Taranto, Rosslare, Cork, Shannon Foynes, Dundee) and 5 in the US (New Jersey Wind Port, Pier Wind Long Beach, Vineyard Haven, Quonset / Davisville, Nexans Goose Creek); the layer grows from 55 ports in 15 countries to 103 in 20, each with sources whose quotes were checked; the island port Zhuangyuan'ao is listed as an exception in `FAR_OK` of `qa_ports.py`.
  - **Events**: the 2016 South Australia blackout (WIND-010) is linked to 5 farms per AEMO's final report; the official causes were added for Hokuriku (WIND-008), Atlantic Shores (WIND-031) and the Mailiao turbine 17 fire (WIND-057, Control Yuan report);
    the Mailiao farm's phases were corrected from the Control Yuan report and Taipower's station list (15 turbines in 2009, 8 in 2010). WIND-053 and 058 still await official investigations.
  - **Hub heights**: Taizhou 1 126 m, East Anglia ONE 111 m, Huaneng Sheyang H1 90 m (rotor 148 m), Shanghai Lingang II 90 m; **foundations**: Laizhou offshore wind and aquaculture project (monopiles), Putian Pinghai Bay Phase 2 (mixed: 28 high-rise pile caps + 13 monopiles, NDB post-completion evaluation), Huadian Yuhuan 1 (mixed: 22 high-rise pile caps in the north zone + 10 monopiles in the south zone, construction record and piling contract).
    Leads that do not meet the as-built rule stay in `tools/research/`.
  - **Coverage gap in China and India**: official and open per-farm datasets were assessed one by one; the conclusion is to upgrade GEM first and not ingest registries (see Phase 1 in [ROADMAP.en.md](./ROADMAP.en.md)).
  - **Photos**: Wikimedia Commons checked again (its API rate-limits this environment, so the HTML pages were read; `build_photos.py` now also reads the file pages when the API answers 429): Moray West added (taken at sea in July 2026, CC0). Vindeby's category holds only an OSM location map, file searches for Greater Changhua return nothing, the only aerial photo in the Hornsea Two category predates the turbines, Dogger Bank has only onshore substation photos and no photo names the V236 prototype; Borssele and Seagreen only have distant horizon views, which the rule excludes; Changfang, Zhong Neng, Yunlin, Hai Long, Taipower Phase 2, Hywind Tampen, Kincardine, Provence Grand Large, Goto, Fukushima FORWARD, Shapa, Vineyard Wind 1 and the Mingyang and Dongfang milestone machines have no usable free-licence photo.

## v2.36.0 — 2026-10-10

- In the "Live data" layer, partly covered countries are now coloured only in the states or provinces with data: Texas (ERCOT) and California (CAISO) in the US, Alberta (AESO)
  and Ontario (IESO) in Canada, and the eastern-grid states and territories of Australia (Queensland, New South Wales, the ACT, Victoria, South Australia, Tasmania), with the
  national border dashed. The borders come from Natural Earth 1:50m (public domain, the same scale as the country borders) via the new `tools/build_live_regions.py`, which writes
  `data/global/live_regions.json` (about 37 KB, loaded when the layer is turned on); a state is coloured only while its source is present. Grids do not follow state and province
  borders exactly (ERCOT, for example, serves about 90% of Texas load), so the legend and tooltip call the areas approximate; hovering over land shows whether that state has data.
  Both parts of the UK have data, but Great Britain leaves out turbines on the distribution network, so the UK stays hatched as a whole. User guide, README and Sources dialog updated.

## v2.35.0 — 2026-10-10

- New "Live data" layer on the globe toolbar (URL `live=1`): countries are coloured by whether the site has live wind output for them — solid teal where it covers the whole country
  (Germany, France, Denmark, Belgium, Poland, Ireland, Korea, Brazil, Taiwan), violet hatching where it covers only part (the UK, the US, Australia and Canada, with the reason in the
  legend and tooltip); France is coloured on the mainland only. The legend lists the countries ("Details" opens the reasons), and a name opens the current figure and 48-hour trend; with the layer on, hovering over
  land also shows that country's coverage. The two colours pass the colour-blind check; the violet has low contrast on the land colour, so hatching and text labels are added. The public
  single-file globe has no live data and leaves the layer out. User guide, README and Sources dialog updated.

## v2.34.0 — 2026-10-10

- Brazil joins the national wind output right now: the data endpoint behind the "Energia Agora" page on the ONS website, wind output of the National Interconnected System
  (SIN) every minute (undocumented, with no licence of its own); as for Korea, it is used because the same series is published under CC BY 4.0 on the ONS open-data portal,
  crediting ONS and noting that the hourly means are computed by this site. The endpoint only holds the current day (Brasília time), so the 48-hour trend builds up run by run.
  The Sources dialog, Learn chapter 13, the footer source list, the user guide, the README and the live-data assessment are updated.

## v2.33.0 — 2026-10-10

- Ireland, Northern Ireland and Korea join the national wind output right now. Republic of Ireland and Northern Ireland: EirGrid Smart Grid Dashboard wind generation
  estimates every 15 minutes (the page's undocumented data endpoint), credited "Supported by EirGrid Group Data" under EirGrid's Open Data Licence; Northern Ireland sits
  in the UK profile (the Great Britain figure leaves it out). Korea: Korea Power Exchange (KPX) real-time supply and demand, 5-minute instantaneous values; the KPX page carries
  no licence, so the site relies on the same series being listed as "no restriction on use" on Korea's public data portal and on Korea's Public Data Act. Japan's grid operators
  all require consent before republishing (Kyushu also bans automated retrieval), so Japan is not included; the findings are in the live-data assessment. The Sources dialog,
  Learn chapter 13, the footer source list, the user guide and the README are updated.

## v2.32.0 — 2026-10-10

- Belgium and Poland join the national wind output right now. Belgium: Elia Open Data (near real-time ods086 + historical ods031), offshore and onshore (distribution grid
  included) every 15 minutes, "measured & upscaled" to the whole fleet, under the Elia Open Data Licence (CC BY 4.0), with the share of Elia's monitored capacity. Poland: the
  live snapshot on PSE's homepage map "Mapa KSE" (onshore and offshore; the widget's undocumented data endpoint), with earlier hours of the 48-hour trend from the 15-minute
  total wind generation PSE's report API publishes the next day, credited "Informacja pozyskana ze strony www.pse.pl" with the retrieval date and a processing note under
  PSE's conditions for reusing public-sector information. Trend lines now join points up to 3 hours apart (today Poland only has snapshots about every 2 hours). The Sources
  dialog, Learn chapter 13, the footer source list, the user guide, the README and the live-data assessment are updated.

## v2.31.0 — 2026-10-10

- National wind output right now: Great Britain (Elexon BMRS), Germany (SMARD, onshore/offshore), France (RTE éCO2mix via ODRÉ, onshore/offshore) and Denmark
  (Energinet, onshore/offshore) as a whole, plus the Texas (ERCOT) and California (CAISO) grids, fetched by `intl_wind_scraper.py` on the same schedule as the other
  live data, keeping the latest value and the hourly means of the past 48 hours. The country profile's "Live output now" box shows the current value, the data time
  (local time), the 48-hour trend, a coverage note (Great Britain leaves out most turbines on the distribution network, France's real-time values include estimates,
  ERCOT serves about 90% of Texas load, CAISO about 80% of California's demand) and the attribution; Texas also shows the share of the month's wind capacity. World
  and continent profiles get a "Wind output right now" list (with Taiwan, Australia and Canada), sorted by output and not summed; a name opens that country's profile.
  The Sources dialog, Learn chapter 13 (sources and "Limits of the data"), the footer source list, the user guide, the README and the live-data assessment are updated;
  Belgium and Poland stay out until their licence terms are clear.

## v2.30.19 — 2026-10-10

- The limits of the data are now explained on the site: the globe's "Sources" dialog opens with "Limits of the data and open questions (please read first)", which lists, computed from the
  data now loaded, the farms on shared placeholder points or approximate locations, the farms with no known start year, the countries whose farm records fall furthest short of the national
  figure, the offshore farms whose foundation type or hub height is not yet checked, the countries with no port listed yet, the events not yet linked to a farm and the state of the photos,
  and says which figures are estimates or schematic (estimated yearly output, live samples, "latest available", turbines laid out schematically); the attribution line under the globe now
  says the data is still being checked and not fully accurate; Learn chapter 13 opens with "Limits of the data". The user guide and README are updated too.

## v2.30.18 — 2026-10-09

- Research round 23 (quotes checked with `check_quotes.py`; see the 9 Oct 2026 "sixteenth batch" in the [clean-up log](docs/data-cleanup.en.md)):
  - Commissioning years added: operating farms without a year go from 666 (32.1 GW) to 640 (31.1 GW). India 218 → 204 (rating reports, Oil India and Tata Power releases, Orient Green's IPO
    prospectus and others; Oil India's Unchawas and Ludurva and Tata's Supa move from placeholder points to their villages, approximate); China's Alashanyou (SPIC) and Dengzhou (CGN) distributed get 2022.
  - Duplicates and farms that do not exist: Argentina's Energética I and Tres Picos fold into Vientos Bonaerenses; WRI's Mount Gilboa in Israel into Afcon; Lithuania's Strepeikiu into Pagėgiai 13;
    Italy's Cocullo, Marsica 2 At and Ponte Rotto into the records of the same farms; France's Les Chandelles into Breteuil-Esquennoy and Entre Seine Et Aube into La Prévoterie (now with its 2010, 2014
    and 2021 phases); India's Agar (Greenko), Dangri (Bhilwara) and Gopalpura folded. Cameroon's 100 MW "operating" farm does not exist (IRENA: 0 MW of wind in Cameroon in 2024) and Poland's
    Reńska Wieś is only an application, so both are removed; Argentina's Santa Teresita becomes pre-construction.
  - Corrections: Tournevents du COS becomes 2017 (DREAL: the whole farm running from 10 Nov 2017), L'Huître et Granville gets 2009 (register), Poland's Tyszowce 30 MW / 2016, Xingyang Feilongding's
    capacity becomes the 32.4 MW actually built, India's Kita (Orix) 38.4 MW; "Chennai wind farm (REMCL)" is really Southern Railway's 10.5 MW farm at Kayathar (renamed, 2019).

## v2.30.17 — 2026-10-09

- Research round 22 (quotes checked with `check_quotes.py`; see the 9 Oct 2026 "fifteenth batch" in the [clean-up log](docs/data-cleanup.en.md)):
  - Commissioning years added: operating farms without a year go from 725 (34.9 GW) to 666 (32.1 GW). India 250 → 218 (GlobalData plant profiles, rating reports, owners' announcements and an
    appellate tribunal judgment), Italy 72 → 58 (Alerion's 2022 bond prospectus lists each farm's start of production; GlobalData; an Enel press release), plus Sweden's Kölvallen (2025, 277.2 MW),
    Mexico's Coromuel and San Pedro, and one or two each in Croatia, Poland, Serbia, Israel, Namibia, the Netherlands, Japan and Australia.
  - Duplicates: 6 folded in Italy (Agrigento had three records for one farm: Wind Power Sud and Altopiano Petrasi folded in); India's Visapur folded into Girijashankarwadi.
  - Locations and names: India's "Dagri" is renamed Dangri (Oil India) (54 MW, 2013) and moves about 280 km to Dangri in Jaisalmer; PTC's Bableshwar, Devenkonda and Payalakuntla move from placeholder
    points to their villages (approximate; their years are 2016 or 2017 and left open); Italy's Lago Arancio, Messina Randazzo and Rocca Ficuzza move to their towns (approximate); Orchid, Tirunelveli (KPR)
    and Palghat are noted as owners' portfolios rather than single farms.

## v2.30.16 — 2026-10-09

- Research round 21 (quotes checked with `check_quotes.py`; see the 9 Oct 2026 "fourteenth batch" in the [clean-up log](docs/data-cleanup.en.md)):
  - Commissioning years added: operating farms without a year go from 815 (37.3 GW) to 725 (34.9 GW). 27 in Spain (Castilla y León's open-data register of operating farms and Aragón's
    environmental monitoring reports), 16 in Turkey (the Turkish Wind Energy Association TÜREB's 2015–2022 statistics reports), 8 in Germany (public unit pages of the Marktstammdatenregister, MaStR),
    10 in France (the national register of production installations, ODRÉ, and inspection reports; 3 more years corrected from the register), 5 in China and 2 in the Netherlands (Epz 16.8 MW and Kubbeweg 72 MW, RVO's yearly monitor).
  - Duplicates and aggregates: 8 French duplicates folded; Kergrist Moelou, Chapelle Vallon, Essigny-le-Grand, Esnouveaux, Lanques-sur-Rognon and the two Droupt records were totals or single
    delivery points of farms already listed and are removed; 7 duplicates in Turkey, 6 in Germany and 3 in Spain folded; Spain's Els Pessells (authorisation revoked in 2020, never built) is removed;
    Germany's Nessa is removed because its six turbines are already in the MaStR-derived "UW Nessa".
  - German MaStR matching rebuilt: Niedere Börde now has a hand-checked match (one of its turbines is registered as Borregaard I/S, no longer listed as a farm of its own); 11 MaStR groups that removed
    records used to hold are now farms of their own (e.g. WP Hemelingen in Bremen, 12.8 MW, 2018).
  - Names, locations and status: Taonan "Datang phase 2" is really a separate 22.1 MW distributed rural revitalisation project (renamed, with owner and Chinese name); Köhlen, Les Plaines and Leury move to
    their turbines and the longitude sign of Les Vents de Nord-Sarthe phase 2 is fixed; Crouy et Cuffies becomes pre-construction and La Chapelle Bâton under construction (connected, no commissioning
    date yet); capacities corrected for Kores (25 MW), Autremencourt (14.4 MW) and Croa (10.4 MW); Breteuil (11 MW, 2024) and Plaine du Moulin (20.2 MW, 2025) now describe the repowered farms.

## v2.30.15 — 2026-10-09

- Research round 20 (quotes checked with `check_quotes.py`; see the 9 Oct 2026 "thirteenth batch" in the [clean-up log](docs/data-cleanup.en.md)):
  - Commissioning years added: operating farms without a year go from 917 (40.1 GW) to 815 (37.3 GW). 119 French farms were matched one by one against the national register of production
    installations (ODRÉ), adding years for 64 of them (some with corrected capacity, phases or location), so French farms without a year go from 155 to 62; 13 in China (mostly from listed owners'
    annual reports); 8 in the Netherlands (RVO's yearly monitor and others).
  - Duplicates and aggregates: 13 French duplicates folded; Fère-Champenoise, Melle and Haut de Mergey were commune totals of farms already listed and are removed; Miraumont is now its own 23 MW;
    duplicates at Sant'Agata (Italy) and CGN's Chifeng folded.
  - Locations and names: Hanggin (China Resources) moves to Balagong town and a few misplaced French farms move back to their communes (approximate); Houlongshan gets 2023 and its Chinese name
    corrected (it was phase 2's).

## v2.30.14 — 2026-10-09

- Research round 19 (quotes checked with `check_quotes.py`; see the 9 Oct 2026 "twelfth batch" in the [clean-up log](docs/data-cleanup.en.md)):
  - Commissioning years added: operating farms without a year go from 948 (42.6 GW) to 917 (40.1 GW). France from the national register of production installations (ODRÉ) and inspection
    reports, 8 farms (Tulipes, Longues Roies, Cabalas, Vaux-Coulommes, Côte du Cerisat, Tortebesse, Chambon-Puyravault, Rembercourt, some with corrected capacity); Italy's Camporeale (50.4 MW after
    repowering, 2023) and Trapani Salemi (2009); 11 in China (Liaozhong, Binxian phase 2, Wuchuan, Zhangbei Zhanhai, Ruoqiang Luobuzhuang, Yuanling Rangjiaxi, Changling A, Gaotai Yanchitan,
    Pinglu Xiamiangao, Lixian, Tailai); the Netherlands' Drentse Monden (2021, capacity corrected to 45 Nordex N131, 175.5 MW).
  - Duplicates: Fontenelle-Montby, Pelade, Les Vignottes, Fère-Champenoise-Euvy-Corroy and Le Mont Hussard in France, Lercara Friddi in Italy, Atria II and GEM's Vankusawade in India; France's
    Saint-Georges-sur-Arnon 48 MW (the sum of the commune's four 2009 parks) and India's Yermala (discontinued in 2017) are removed.
  - Locations: India's Atria Basavana Bagewadi (was at Bengaluru), Jilin's Tongyu Liangjingzi and Xinjiang's Jimunai (SPIC) move to their towns (approximate); India's Evergreen 250 MW is noted as a developer total, not one farm.

## v2.30.13 — 2026-10-09

- Research round 18 (quotes checked with `check_quotes.py`; see the 9 Oct 2026 "eleventh batch" in the [clean-up log](docs/data-cleanup.en.md) and the [events](docs/events.en.md)):
  - Commissioning years added: operating farms without a year go from 966 (48.2 GW) to 948 (42.6 GW). In China: Huaneng Shangdu (2023, was 2022), three Huadian Dabancheng records, Jimunai, Wulatehou,
    Keyouqian, Jiangyong Shuimeitang, Alashanzuo Zongbieli, Subei Yinmaxia A (capacity now 150 MW), Tai'an (2024) and Zhangwu Xiliujiazi; Brazil's Ventos de São Rafael and Serra das Almas (2025, from ANEEL's
    unit-by-unit commercial-release data; two more GEM records listed as under construction or pre-construction have been operating since 2025–26) and India's Tanot (2015).
  - Duplicates and status: Shangdu's Duolun section, Tongyu 2 GW phase 1 (= Shihuadao), Chile's La Cabana and WRI's Rei dos Ventos 1 in Brazil were duplicates; the 1,350 MW Zhengxiangbai wind-hydrogen project has not started and is now pre-construction.
  - Locations: France's Village du Richebourg moves from Pas-de-Calais to the Aube; Tongyu's Shihuadao moves to Tongyu county (approximate).
  - Events: 7 more are placed at their farms (Golden Plains stage 1, Haltern AV 9, Ventus, Delta Maranhão, the Jiuquan base, the Wenchang repowering, and Crotched Mountain, added as a retired curated record), 84 of 91 in all.
  - The Longyuan Rudong intertidal test farm's turbine field now lists the 15 units of 8 models named in its O&M tenders; CTG Shapa phase 2 is now 31 Mingyang + 31 Goldwind.

## v2.30.12 — 2026-10-09

- New foundation type "low pile cap" (`lp`, the owner's decision of 9 Oct 2026): the Chinese tidal-flat "low pile, tall pedestal", where piles are driven inside a cofferdam, the cap is cast in a pit
  below the mud, and a tall column lifts the tower above the highest tide, unlike a high-rise pile cap whose cap sits near the waterline on piles with a free length. It is in the "other fixed" colour group, so the
  map colours do not change (colour-blind check re-run, same result); the type chart and text in chapter 7 of the Learn page, the farm card's cross-section and the close-up bases all include it.

## v2.30.11 — 2026-10-09

- Research round 16 (quotes checked with `check_quotes.py`; see the 9 Oct 2026 "tenth batch" in the [clean-up log](docs/data-cleanup.en.md) and [foundations](docs/foundations.en.md)):
  - CGN Xiangshan Tuci: all 38 turbines on monopiles (2025 inspection tender for the built farm).
  - Longyuan Putian Nanri Island (the Sandun wind farm): turbines corrected to 100 Siemens SWT-4.0-130, and the year of full operation to 2021.
  - Zhuhai Guishan: 200 MW and 49 turbines per the Guangzhou MSA completion notice of 2025 (phase 1's 34 × 3 MW; 5 Mingyang MySE6.45-180 and 8 Dongfang DEW-D7000-186 added by full capacity in 2021; two more units on bucket foundations in 2024, models unpublished); the year stays 2021.

## v2.30.10 — 2026-10-08

- Research round 15 (quotes checked with `check_quotes.py`; see [foundations](docs/foundations.en.md)):
  - From Jiangsu MSA construction notices: Rudong H5 (75), GCL Rudong H15 (40), Guoxin Rudong H2 (70, depth added), Huaneng Rudong H3 (80) and Jiangjiasha H1 phase 2 (15) all stand on monopiles.
  - Germany, Lichtenau-Asseln: GEM's Paderborn (the 1993–98 Windpark Asseln) and Asselner (2015) now carry their own MaStR turbines (`MANUAL` in `build_mastr.py`); the MaStR-added "Windpark Asseln" and "AWP", which counted old turbines a second time, fold into Paderborn; Asselner gains its 2018 extension (24.75 MW); Paderborn's point moves to the German Wikipedia coordinates of the park.
  - Liu'ao area D's point moves to the area D met mast of a Zhangzhou MSA notice (still approximate).
  - Huaneng Cangnan 4's 77 foundations: 42 monopiles + 35 high-rise pile caps (2025 scour-protection tender), plus depth 26–34 m; Jiazi I's turbine field now reads just "78 Mingyang 6.45 MW" (the MSA-filed 168 m rotor does not fit the stored MySE6.45-180; exact model unverified).
  - Operating offshore farms with a known foundation type: 284 of 331 (87.0% of capacity); 102 of China's 141 and 15 of Vietnam's 20.

## v2.30.9 — 2026-10-08

- Research round 14, second part: foundations in southern China and Vietnam (quotes checked with `check_quotes.py`; see [foundations](docs/foundations.en.md)):
  - Zheneng Taizhou 1: 39 of its 40 turbines on monopiles and one on a pile–bucket composite (still a monopile at its core, so the farm is listed as monopile; Zhejiang MSA completion notice, 2025); Vietnam's Tan Phu Dong 2: 12 turbines on PHC pile groups with caps.
  - Pinghai Bay area F's turbines filled in as 3 × 6 MW + 26 × 7 MW (Putian MSA completion notice).
  - Operating offshore farms with a known foundation type: 278 of 331 (85.2% of capacity); 96 of China's 141 and 15 of Vietnam's 20.

## v2.30.8 — 2026-10-08

- Research round 14 (quotes checked with `check_quotes.py`; see the 8 Oct 2026 "eighth batch" in the [clean-up log](docs/data-cleanup.en.md) and [foundations](docs/foundations.en.md)):
  - Zhangpu Liu'ao: a 2023 Fujian government report says the approved 800 MW consists of area D and phase 2, so the old "area D = phase 2" reading is corrected; area D (402 MW) is back as pre-construction, and CTG's Liu'ao phase 2 moves to its site from the sea-use approval's boundary points (the old point was about 30 km off).
  - Added CSSC Haizhuang's 6.2 MW "Fuyao" floating demonstrator (Luodousha off Zhanjiang; position inferred from an MSA notice and the cable in its EIA approval, running off-grid on a micro-grid, as the card says).
  - Germany: GEM's Lichtenau (11 MW) is part of Windpark Asseln (GEM's Paderborn, 36 MW) and is removed as a duplicate.
  - Foundations: Qidong H3 all monopiles, Huaneng Rudong Baxianjiao 50 monopiles + 20 high-rise pile caps, Jiangjiasha H2 61 monopiles + 6 multi-pile jackets.

## v2.30.7 — 2026-10-08

- Research round 13: the doubts left in TODO (quotes checked with `check_quotes.py`; clean-up rules 478 → 498, see the 8 Oct 2026 "seventh batch" in the [clean-up log](docs/data-cleanup.en.md)):
  - Thailand: Hanuman 10 (80 MW), which the build had dropped as a duplicate of Subyai, is back; Hanuman 1, 5, 8, 9 and 10 now sit at the turbine positions of an Asian Development Bank report (they shared one GEM point), and Subyai at its OpenStreetMap wind-farm area.
  - Vietnam: GEM's "Dong Hai V1-4" and "Dong Hai 1 · 3" are phases 4 and 3 of Dong Hai 1 in Ca Mau (formerly Bac Lieu; launched in Aug 2026, due 2028 and 2029), renamed with owners and set to pre-construction; the second one's point was in the middle of the South China Sea. Tra Vinh's Dong Hai 1 moves to its turbines.
  - China: the four "suspected duplicate" pairs (Dafeng H4 / H8-2, Jiaxing 1 / 2, Dafeng H12 / H7, Putian Shitang / Pinghai Bay phase 1) are all different farms; CTG Dafeng H8-2 and Jiaxing 1 and 2 move to their real sites; the Fengxian Haiwan expansion becomes onshore (the original farm and the same owner's repowering are both onshore wind); the two Fengxian Haiwan repowering records are merged; Changle Waihai C gains its depth and rotor. China now has 140 operating offshore farms.
  - Japan: Setana port's semi-offshore turbines stopped in 2024 (town council minutes: no generation from FY2024); Enshu Kakegawa (8 Enercon E-82, 15.97 MW) and Kakegawa (6 E-82) are two neighbouring farms, each with corrected turbines and moved to its turbines.
  - Germany: Erbes-Büdesheim, Lütjenholm, Süderauerdorf and Schülp now carry their own MaStR turbines, and the years of Zettingen, Bornstedt-Holdenstedt and Erbes-Büdesheim are corrected; every "suspected duplicate" pair is now checked.
  - Poland: the 2026 compilation's Baltica 1 and GEM's Baltica I are one project and are merged (it lost the Dec 2025 CfD auction, so the expected year is unknown).
  - Australia: AEMO unit GULLRWF2 ("Gullen Range 2") is Biala wind farm; its live and measured output now belong to Biala.
  - US turbine positions, measured output and OpenStreetMap turbine positions rebuilt with the farm layer. Operating offshore farms with a known foundation type: 272 of 330 (83.8% of capacity).

## v2.30.6 — 2026-10-07

- Research round 12: the doubts left in TODO (every quote checked with `check_quotes.py`; clean-up rules 446 → 478, see the 7 Oct 2026 "sixth batch" block of the [clean-up log](docs/data-cleanup.en.md)):
  - German MaStR matching gets a start-year check and a hand-checked table: 8 farms including Gremersdorf, Borchen-Etteln, Oederquart and Streumen now carry their own turbines, and the units they were wrongly given become added farms; the "suspected duplicates" were checked pair by pair, and 18 records confirmed as different farms are no longer flagged.
  - Restored after wrong merges: Shiloh (USA) with all four phases, 505 MW (phases III and IV were missing), Pantelimon (Romania) and Esperanza (Dominican Republic; its farm-level total goes from 89% to 100%); duplicates removed: Dreiberg (Germany) and Dempsey Ridge (USA).
  - Status: Peninsula South U2 (China) operating from 2024, Duyen Hai V1-4 (Vietnam) from 2026 and Carreto (Colombia) from 2025; the other 105.5 MW of Cho Long (Vietnam) is built but not yet in commercial operation; Korea's Ulsan 750 kW floating pilot never went to sea and is removed.
  - Positions: Xiangshan Tuci, Pinghai Bay area F and Putian Shicheng from turbine coordinates in maritime notices and sea-use approvals; Choshi, Yeonggwang Wind's intertidal turbines, Revolution Wind and others moved to their actual turbines.
  - Denmark: Rønland now has only its four southern turbines at sea (9.2 MW), and its foundation changes from gravity-based to piled concrete caps; Frederikshavn has a single turbine left at sea.
  - Turbine and capacity fields corrected for about 15 farms (Changle Waihai C, Shapa phase 2, Binh Dai, Soc Trang No. 7, Gullen Range, Gohlocher Wald and others); Formosa 1 phase 1 is confirmed as SWT-4.0-120.
  - US turbine positions, measured output and OpenStreetMap turbine matches were rebuilt with the farm layer (Shiloh and Big Smile now match USWTDB and EIA). 272 of the 331 operating offshore farms have a known foundation type (83.8% of capacity).

## v2.30.5 — 2026-10-07

- Research round 11: the farm data doubts listed in TODO (every quote checked with `check_quotes.py`; clean-up rules 414 → 446, see the 7 Oct 2026 "fifth batch" blocks of the [clean-up log](docs/data-cleanup.en.md)):
  - Farms that had vanished through wrong merges are back: Datang Binhai 302 MW and Putian Pinghai Bay area F 200 MW; GEM's Changle Outer Ocean area I is a separate project (under construction and pre-construction) and is no longer merged into CTG Changle Waihai A.
  - Duplicates removed: GEM's four Guoxin Dafeng sites (already in "Guoxin Dafeng 850 MW"), the 600 MW "Zhoushan Liuheng / Zhejiang others" aggregate, and Vietnam's GEM Binh Dai 25.8 MW and Cong Ly Soc Trang; Taiwan's Haiding 3 (Formosa 3's development rights were cancelled).
  - Back to under construction: Huaneng Yuhuan 2 (508 MW) and, in Vietnam, Ca Mau 1 (350 MW) and Thanh Hai No. 5 (120 MW); Cong Ly Soc Trang phase 1 becomes onshore and under construction; GEM's Bozhong B1 becomes the 100 MW extension.
  - Years: Xuwen's original farm 2021, Binhai South H3 2020, Zhuhai Guishan 2021, Fangchenggang A 2025, Xiangshan Tuci 2023 (renamed "CGN Xiangshan Tuci"), and Binh Dai, VPL Ben Tre and Hiep Thanh 2023; Tan An 1 is 99.4 MW; Morocco's Akhfennir phases 2013/2016.
  - Positions: Jiangjiasha H1 and H2 moved to turbine positions from maritime safety notices (they were in the Yangtze estuary), and Changle Waihai A and C to their named OpenStreetMap farm areas.
  - Turbine fields corrected for about 15 farms (Pinghai Bay phases 2 and 3, Rudong H2, Guoxin Dafeng, Huizhou Gangkou, Binhai South H3, Fangchenggang A, the Pingtan bridge farm, Hoa Binh 2, Akhfennir and others).
  - Foundations: Denmark's Nissum Bredning Vind changes from gravity-based to jacket (installer Aarsleff's project sheet); 272 of the 329 operating offshore farms now have a known type (84.4% of capacity), 14 of Vietnam's 19.
- China's operating offshore farms now add up to 46.6 GW instead of 47.2 GW, below the national series; Vietnam's farm-level coverage falls from 86% to 78% (unfinished farms moved to under construction).

## v2.30.4 — 2026-10-07

- Round 10 of the research (quotes checked with `check_quotes.py`):
  - Vietnam: Tra Vinh V1-1 (Korea–Tra Vinh phase 1) stands on pile groups with caps (Vestas' turnkey contract and construction reports) with 150 m rotors; V1-3 (REE)
    is in 3–7 m of water; Hiep Thanh has 145 m rotors. 15 of Vietnam's 22 operating offshore farms are now known.
  - Tan Phu Dong 2's turbines corrected to 12 Vestas V150-4.2 (was Envision).
  - Dimensions for early and demonstration farms outside China: Vindeby (hub 37.5 m, depth 2.1–5.1 m), Blyth (62 m), Utgrunden I (65 m), Yttre Stengrund (60 m), Arklow Bank phase 1
    (73.5 m), the Hooksiel BARD test turbine (90 m), the Beatrice demonstrator (88 m above lowest astronomical tide, 45 m of water) and Setana (40 m), plus depths and rotors for
    Kitakyushu Hibikinada, Lely, Irene Vorrink, TetraSpar and WindFloat 1. The Hooksiel and Arklow hubs come from reports during construction and the maker's project sheet (Arklow
    also from English Wikipedia), and Yttre Stengrund and Irene Vorrink from the EU's CA-OWEE offshore wind database; the card notes say so.
  - Southern China: foundations and dimensions for CTG Yangjiang Shapa phase 1 (39 monopiles + 13 jackets + 3 composite buckets) and phase 3 (22 monopiles + 27 jackets + 12
    high-rise pile caps), hubs 110 m / 111–112.5 m, from the post-construction supplementary reports published by the Yangjiang natural resources bureau; all 29 Putian Shicheng
    turbines stand on high-rise pile caps (two construction lots of 10 + 19).
  - The Shapa phase 3 record counted its floating unit too (400 MW), but that unit has its own record ("Sanxia Yinling"); it now counts the 61 fixed turbines only (393.45 MW).
  - Northern China: operation and maintenance tenders on CHN Energy's tender site state the foundations of Longyuan's Jiangsu farms: Sheyang H2 and H2-1 and Dafeng H4, H6 and H7
    are all monopiles, and Dafeng H12 has 40 monopiles + 40 jackets; also their depths and the turbine fields of Dafeng H4, H6 and H12 and Sheyang H2-1.
  - Operating offshore farms: foundation type known for 273 of 332, 83.6% of capacity (91 of China's 140, 15 of Vietnam's 22); dimensions for 272, hub height for 193, all three for 182.

## v2.30.3 — 2026-10-07

- Hub heights, round 9 (all 51 operating Chinese offshore farms with a foundation type but no hub height checked again; quotes checked with `check_quotes.py`):
  Huaneng Peninsula South 4 has a 102 m hub in about 30 m of water and SPIC Peninsula South 3 a 99 m hub (completion environmental acceptance opinions published by the
  Yantai ecology bureau, values at acceptance); Qingzhou 3 has 41–46 m of water and a 178 m rotor (supplementary sea-use report published by the Yangjiang natural resources
  bureau); SPIC Rudong H4 and H7 average 16 and 19 m of water. Operating offshore farms with dimensions: at least one value for 251, all three for 174. For the other farms
  only values from construction or for some units were found; they are kept in `tools/research/`.
- Farm record fixes (farm layer, foundations and OpenStreetMap turbine matching rebuilt):
  - Guohua Dongtai IV is now 73 monopiles + 2 high-rise pile caps (CHN Energy tender notice, 2026).
  - Turbine fields: Fanshi I (22 Goldwind GWH252-13.6MW + 51 Mingyang MySE14-260), Zhugensha H1 (50 Shanghai Electric 4.0-146), Zhugensha H2 (50 × 4.0 MW + 17 × 6.0 MW) and
    Xuwen (94 turbines, 600 MW, plus a 25 × 12 MW extension).
  - An older rule's text on Xuwen had turned "the north lot of 47 fully connected on 19 Nov 2021" into a whole-farm connection on 26 Nov; corrected from the source.
- OpenStreetMap turbine matching: mixed-model turbine fields now add up their counts (only the first "N x" was read, so "22x … + 51x …" counted 22). Xiangshui, Pingtan
  Changjiang'ao and Zhuhai Guishan now match groups of the right size; Rudong H8 and Daishan 4 had matched groups covering only part of the farm (35 of 65 and 36 of 54
  turbines) and are no longer drawn.

## v2.30.2 — 2026-10-07

- New user guide, [docs/user-guide.en.md](./docs/user-guide.en.md) (Chinese: `user-guide.md`): every page, the globe's toolbar, side panel, farm cards, layers,
  Output, tours, URL parameters, the single-file copies, phones, data freshness and FAQ. The site footer and "Learn → Sources & method → About this site"
  now link to it.
- Both READMEs tidied: a documents table at the top (Chinese and English link for every document), updated figures (about 31,000 farm records, about 9,600
  pipeline projects, single-file edition about 13 MB / public map about 12 MB, six workflows), and the feature list turned into a summary that links to the
  guide; the "Corrections" list no longer repeats the France item that had split the Crimea sentence; the sources now credit the 2026 latest-available figures,
  Ember, USWTDB, OpenStreetMap, OSPAR, events and ports.
- ROADMAP, TODO, DEPLOY and CLAUDE.md brought up to date (ROADMAP's done items and the Taiwan offshore time checks, document lists, maintenance notes).
- Fixed: the Learn intro said "twelve chapters", now thirteen; the globe's English pipeline caveat gave the farm data as GEM Feb 2025, now Feb 2026.
- The foundations legend and farm-by-farm list said "78 Chinese farms from the owner's case-by-case review, quotes still to be checked"; they now give the
  actual state: step 5 has 78 Chinese and 14 Vietnamese records, every quoted passage checked with `check_quotes.py` except the two rows for Rudong H6 and
  H10, whose source is China Three Gorges' own site, unreachable from the checking environment.

## v2.30.1 — 2026-10-07

- Foundation types (every quote checked with `check_quotes.py`): Datang Nan'ao Lemen I is all monopiles (post-construction sea-use report and completion
  acceptance), Longyuan Rudong Intertidal 150 MW Demo has 37 monopiles + 21 multi-pile jackets, CTG Yangjiang Shapa phase 4 has 7 monopiles + 36 jackets and
  phase 5 has 11 high-rise pile caps + 23 jackets + 13 composite buckets (supplementary sea-use reports published by the Yangjiang natural resources bureau in 2023).
  82 of China's 140 operating offshore farms are now known (about 64% of capacity); 263 of all 332 operating offshore farms, 81.1% of capacity.
- Dimensions: hub heights for Lemen I (105 m), Shapa phase 4 (113 m) and Guangdong Energy Yangjiang Shaba (103.6–113 m) from the same reports, plus water depth
  for the Rudong intertidal demo, Shapa phase 5 and Qingzhou 4; Shapa phase 2 now follows its report (depth 21–26 m, rotor 178 m: MingYang's MySE6.45-180 has a
  178 m rotor, the model number is not the diameter). Shapa phases 1 and 3 have verified dimensions but no foundation type yet; they wait in `tools/research/`.
- Farm record fixes (farm layer, foundations and OpenStreetMap turbine matching rebuilt):
  - Turbine fields corrected from as-built sources: Xiangshan Tuci (CSSC Haizhuang 8 MW class; its stored 2022 is wrong and the real connection year is
    unverified, which the card says), Huaneng Cangnan 4 (77 Envision 5.2 MW), Jiazi II (50 × 8 MW), Huaneng Guanyun (46 × 6.45 MW + 2 × 3 MW), CTG Changyi (50 × 6 MW),
    Bozhong G (35 × 10 MW + 4 × 12.6 MW), Fanshi II (33 × 18 MW + 25 × 16.2 MW), Putian Shicheng, Tianjin Nangang, Guangdong Energy Yangjiang Shaba, Shapa phase 3
    and Zhuanghe III.
  - GEM's four Dafeng H8-1, H9, H15 and H17 records are the four sites of CTG's Dafeng 800 MW and are removed as duplicates; Zhuanghe IV-2 reached full
    capacity in Sept 2024 and is now operating; Liu'ao area E has no construction record and moves back to pre-construction.
  - The OpenStreetMap turbine groups matched to Jiazi II and Shapa phases 3 and 5 no longer fit the corrected turbine counts and are no longer drawn (fewer
    matches rather than wrong ones).

## v2.30.0 — 2026-10-07

- The globe's "Sea zones" layer adds national offshore wind areas (pink outlines like Taiwan's potential sites; names and areas show up close):
  - Japan: the 13 promotion zones under the Act on Promoting the Utilization of Sea Areas (designation notices of the Agency for Natural Resources and Energy,
    Public Data License PDL1.0). The 3 zones enclosed by their points are drawn closed; the 10 bounded by "the lines through the points and the shore" are drawn as
    the published lines only, without a self-made coastline. Vertices are transcribed from the notices' degrees, minutes and seconds and checked point by point
    against the draft notices.
  - Around the North Sea: the Netherlands' designated wind areas (Rijkswaterstaat, CC0), Germany's Site Development Plan FEP 2025 (© BSH, GeoNutzV), Belgium's
    renewable energy zones of the 2026–2034 marine spatial plan (RBINS/BMDC, CC BY 4.0), Denmark's renewable energy and energy island zones of its maritime spatial
    plan (Søfartsstyrelsen, CC BY 4.0), Crown Estate Scotland's wind farm lease areas (OGL v3.0) and Norway's opened offshore wind areas (NVE, NLOD). All are
    official open layers needing no account, cut to the wind areas and simplified to about 200 m. England, Wales and Northern Ireland (The Crown Estate) are not
    included because its licence adds restrictions (revocable, and barred on sites offering similar services).
  - The legend and the sources dialog list each country's source and licence.
- All 36 Taiwanese potential sites are now drawn: the Hsinchu County site is, in file order, an outer ring with a hole (22.17 km², published 22.2 km²); Taichung 1
  is now drawn in file order as two parts (36.82 km², published 36.8 km²; the reordered shape with a long spike drawn before was wrong). The build tries the
  file-order readings first and reorders vertices only as a last resort.
- Farm record fixes (every quote checked with `check_quotes.py`; farm layer, foundations and OpenStreetMap turbine matching rebuilt):
  - Two duplicates removed: "Shandong Haiwei Peninsula South U" is phase 2 of SPIC Peninsula South U1 (450 MW counted twice), and "Zhangpu Liu'ao Phase 1" was
    really CTG's Zhangpu Liu'ao Phase 2 (area D, fully connected in 2024); no phase 1 was operating in 2022.
  - Zhuanghe I 200 → 98.8 MW (Datang, 19 MingYang MySE5.2-166); Zhuanghe IV-1 gains owner and turbines; Fengxian Haiwan expansion 15 → 14.75 MW; Vietnam's
    Tra Vinh V1-1 owner and turbines (12 Vestas V150-4.2, not Envision) and Hiep Thanh's turbines (18 Siemens Gamesa SG 5.0-145 run at 4.3 MW).
  - The OpenStreetMap turbine groups matched to Zhuanghe IV-1 and Zhuanghe V no longer fit the corrected turbine counts and are no longer drawn (fewer matches
    rather than wrong ones).
- Dimensions: Shengsi 2 hub 104 m and depth 9.2–12.2 m, Huaneng Guanyun hub 92–105.5 m (from the CGN Shengsi 7 EIA, which uses these two built farms as
  comparisons), CGN Shanwei Houhu hub 105 m and rotor corrected to 158 m (post-construction sea-use adjustment report), SPIC Peninsula South U1 depth 25–31 m.
  Nine more farms have verified depth or rotor values but no foundation type yet; they are kept in `tools/research/`.

## v2.29.0 — 2026-10-07

- The globe has a new "Sea zones" layer (the toolbar's "Sea zones" button, off by default; URL parameter `zones=1`):
  - Exclusive economic zone boundaries from the Flanders Marine Institute's (VLIZ) Marine Regions Maritime Boundaries v12 (CC BY 4.0), drawn three
    ways by the kind of line — agreed by treaty or ruling (solid), median lines and 200 NM limits (faint), unsettled or disputed (dashed) — 1,389 lines
    simplified for display (about 2 km), without baselines. The legend and the sources dialog say the lines have no legal value and imply no position on any disputed area.
  - Taiwan's offshore wind potential sites: Energy Administration open data 36681 (the 36 sites published in 2015, Open Government Data License v1); 35 are drawn,
    3,062 km² in all, labelled with number, county and area up close. The file lists vertices in no guaranteed order, so each site is checked against its
    published area; the Hsinchu County site (22.2 km²) has six vertex orders that match its area, so its shape cannot be determined and it is left out.
  - New tool `tools/build_offshore_zones.py`; the raw potential-site file is kept in `data/global/sources/`. Marine Regions' raw data is not kept in the repo (it asks
    users not to offer its data for download elsewhere).
- Offshore farm research (every quote checked with `check_quotes.py`):
  - Foundations: all 106 units of SPIC Peninsula South U1 on monopiles and all 28 of Shanghai Lingang Phase 2 on high-rise pile caps (79 of China's 141 operating offshore farms now known, about 62% of the capacity); Hiep Thanh in Vietnam, 18 monopiles (14 of Vietnam's 22).
    The other 62 Chinese and 8 Vietnamese farms were all searched again; only leads turned up (single lots, tender designs, or no per-type counts), kept with their quotes in `tools/research/cn_vn_dims_2026-10c.json` rather than guessed.
  - Dimensions: SPIC Peninsula South V (completion acceptance report: hub 117–130 m, rotor 225 m, depth 18–28 m) and Haiyou Anlan (hub about 150 m,
    rotor 260 m, depth 136 m), plus rotor diameter or depth for EFGL, EolMed, Goto, Kitakyushu Hibikinada and Huaneng Peninsula South 4. Planned values
    and values for only some units (Kentish Flats Extension, Seonam, Shenquan II and others) are not used.
- The promo video tooling is now in the repo: `tools/promo/` (globe capture, designed scenes, storyboards and the assembly steps; see its README). The videos
  and intermediate files stay out of git.

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
