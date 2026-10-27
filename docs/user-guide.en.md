# User guide

English (this page) ｜ [中文](./user-guide.md)

How to use the 風電風情 · Taiwan Wind Watch site (`https://dofliu.github.io/windfarmTaiwan/`), as of site version v3.5.0. For a quick first look, read "Quick start" in the [README](../README.en.md).

## Contents

1. [Before you start](#1-before-you-start)
2. [Home](#2-home)
3. [Taiwan live](#3-taiwan-live)
4. [Global (the 3D globe)](#4-global-the-3d-globe)
5. [Learn](#5-learn)
6. [Travel with the Wind (for young explorers)](#6-travel-with-the-wind-for-young-explorers)
   - [6.1 For teachers: lesson plans, worksheets and classroom activities](#61-for-teachers-lesson-plans-worksheets-and-classroom-activities)
   - [6.2 Data download: CSV and citation](#62-data-download-csv-and-citation)
7. [Links and sharing](#7-links-and-sharing)
8. [Single-file edition and public global wind map](#8-single-file-edition-and-public-global-wind-map)
9. [Phones and older devices](#9-phones-and-older-devices)
10. [How current the data is and how to read the figures](#10-how-current-the-data-is-and-how-to-read-the-figures)
11. [Frequently asked](#11-frequently-asked)

## 1. Before you start

- **Browser**: any recent Chrome, Edge, Firefox or Safari. The globe needs WebGL (3D graphics); devices without it get a bar-chart ranking instead (section 9).
- **Header** (on every page):

  | Item | What it does |
  |---|---|
  | Navigation | Four pages: **Home**, **Taiwan live** (the green dot means live data is coming in), **Global** and **Learn** |
  | Data-time pill | "Live · Taipower MM/DD HH:MM" is the time of Taipower's data; "Simulated" means no data could be fetched and the values are simulated; the single-file edition shows "Offline snapshot" when offline. Clicking it opens Taiwan live |
  | **Share** | On Home and Taiwan live you first pick a card format: **Square 1:1** (1080×1080, posts), **Wide 1.91:1** (1200×630, link previews and slides), **Story 9:16** (1080×1920, phone stories), or "Copy link only"; there are also "📊 This week's recap (square)" and "</> Embed on your site" (copies an `<iframe>` snippet that puts the small live card on your own page, section 7). Today's card shows the output right now, the first line of today's wind, availability / share of generation / homes supplied, the wind near Taiwan right now (GFS model, 10 m above ground, in the turbine colours of the globe's Wind now, with wind-direction ticks and the farms), the past 7 days, the data time with the year and the sources; shared directly on phones, downloaded as a PNG on computers. On other pages it shares or copies the current page's link |
  | **☀ / ☾** | Switches between light and dark. Light suits projectors and daytime classrooms; the browser remembers it. In light mode the Taiwan live map uses Esri's light grey base map (satellite imagery in dark mode); the 3D globe on Global always stays dark |
  | **EN / 中文** | Switches the language; the browser remembers it |

- **Footer**: data sources in four groups (Taiwan, live output abroad, yearly statistics & farms, maps & other), each group name linking to its part of "Sources & method"; plus "Sources & method", downloads of the single-file editions, links to this guide and to the **schedule status** page (`#/status`, section 7), and the site version (click it for the changelog).
- **Keyboard and assistive tools**: the first Tab stop on every page is "Skip to content"; every button and link shows a focus ring; with the system's "reduce motion" setting the site plays no animation; every PR is checked with axe-core against WCAG 2.1 AA (including contrast in light mode).
- Every view has its own link: copy the address and whoever opens it sees the same view (section 7).
- The **Back** button (browser or phone) first closes the farm details, globe card or dialog you opened; press it again to go back a page. Anything you closed with × or Esc needs no extra Back.

## 2. Home

`#/home`, the essentials on one page, top to bottom:

1. **Right now · Taiwan wind**: at the top is "today's wind": a headline computed from the data, with the next two lines as small chips below it. The lines come only from data: the GFS model's strongest wind over the sea near Taiwan (118.5–123.5°E, 21–26.5°N) with its Beaufort force (the model time is shown beside it; from 25 m/s it notes this is above the speed at which most turbines shut down), the output now against the site's samples over the past 7 days (highest, lowest, or 15% or more off the average), a change of 150 MW or more over the last 2–4 hours, availability of 60% or more (close to full output) or 10% or less (light winds), and homes supplied, in order of importance. The site's daily samples also decide records: whether yesterday was the windiest day since sampling began (15 Jun 2026) or so far this month, and whether now (or a moment earlier today) is the highest output the site has sampled (each day's highest sample is recorded from 26 Oct 2026 and compared once 14 days have built up). Below the headline, **📍 Wind near me** asks the browser for your location only when pressed and opens a map centred on you (the wind now in turbine colours with direction ticks, the 5 nearest operating farms with distances, a scale bar) and text: the wind speed, direction and turbine band where you are (GFS model, 10 m above ground, interpolated from a 1° grid: the wind over the wider area), and the nearest operating farm (direction, distance, type, capacity, year; in Taiwan also the nearest farm with live data and its output now), with links to the globe or the live details. Your position is used only in this browser: the farm list and the wind data are files the site already publishes, downloaded whole and compared on your device, so the coordinates are never sent anywhere or stored. Farms on shared placeholder points are left out, and maps under 150 km across draw no coastline (the 1:50m borders are off at that zoom). Then Taiwan's live wind output; below it, Taiwan's total output over the past 7 days (sampled on the site's schedule, with now and the 7-day high marked; hover or use the arrow keys for each point's time and output), overall availability, share of national generation, the number of households it could supply, and a line about the wind in four levels; buttons to the live dashboard, the farm map and the farm grid.
2. **1980–2025 · Global wind**: world cumulative capacity with its curve, the year's additions and the offshore part; a line below gives the world figure for "2026 (latest available)" and how it is made up (how many countries have this year's figures, the rest carrying the end of 2025, as on the globe); "Open the 3D globe" or "Play from 1980".
3. **This week in Taiwan's wind**: the last 7 complete days (Taiwan time, up to yesterday) against the 7 before: a headline (how much more or less), a two-week bar chart of daily average output (grey = the 7 days before, green = the last 7 days; hover for the date, average and sample count), the windiest and calmest days, the highest moment and the farm with the highest capacity factor (aggregates left out). The data is Taipower's live output as the site records it about every 30 minutes (`data/archive/farm_daily.json`, private farms included; about every 2 hours before 22 Oct 2026): estimates from samples, not official generation; days with fewer than 12 samples are hatched and the sample counts are given below. "Share this week" makes a square weekly card (also offered by Share in the header).
4. **Taiwan in the world**: Taiwan's world rank in offshore wind, its share of world offshore capacity and its rank in total wind; "Read Taiwan's path" opens Learn chapter 10.
5. **Explore**: four cards for the live dashboard, the 3D globe, the 13 Learn chapters and the long-term trend. On phones, "Taiwan in the world" and "Explore" are laid out in two columns. The banner under the cards, "For young explorers: Travel with the Wind", opens the version for students (section 6).
6. **Featured milestones**: click a card to fly to that farm on the globe; "▶ Guided tour" runs through the key moments in wind power.

## 3. Taiwan live

`#/live`. Taipower's open data updates about every 10 minutes and this site fetches it about every 30 minutes; the line under the title shows Taipower's data time. Four tabs at the top:

| Tab | Link | What it shows |
|---|---|---|
| **Dashboard** | `#/live` | National figures and an output gauge for every farm |
| **Farm grid** | `#/live/wall` | The 30 units / farms as tiles sorted by output, coloured by availability |
| **Charts** | `#/live/charts` | Ranking, output mix and the official long-term trend |
| **Map** | `#/live/map` | Farms on a satellite map; circle size = installed capacity; offline, a sketch of Taiwan instead |

### Dashboard

- **Five figures**: Taiwan's live wind output, total installed capacity, overall availability (= output ÷ installed capacity), CO₂ avoided per hour (estimate), and the number of units / farms running.
- **Grid**: the operating reserve light (ample / tight / alert / curtailment alert). When Taipower's live supply-demand report cannot be fetched from cloud servers, the daily government open-data figure is used and labelled "official daily data (published monthly), not live": it has one row per day but is only updated around the 5th of each month, up to the end of the previous month, so it can lag by up to about five weeks.
- **What this power means**: households supplied right now, wind's share of live national generation, today's generation so far, and today's avoided CO₂ as trees. **Tap the first card to compare with something else** (the dots show which one; the browser remembers it): homes (0.5 kW each on average; Taipower: the average home used 308 kWh a month outside summer and 418 kWh in summer in 2025) → 1-ton air conditioners running at once (~900 W each, Hsinchu County appliance table) → phones fully charged per hour (0.019 kWh each, US EPA) → Gogoro batteries charged per hour (1.74 kWh each, Gogoro) → Taipei Metro systems on average (stations + trains use ~700 GWh a year, Taipei Metro 2025 business plan, 2023 figure). These are conversions, not what the wind power actually supplies.
- **Sort & filter** (open the toolbar): sort by output, availability, capacity or name; group by type or developer; show only offshore, onshore, operating or in development; filter by developer, turbine maker or size.
  Your changes are remembered in this browser for the next visit and written into the link (e.g. `#/live?sort=cap&type=offshore`, section 7), so copying the link shares the same view; "Reset" goes back to all farms by output. Opening someone else's link does not change what you saved.
- **Farm cards**: four groups (offshore / onshore × purchased / Taipower-owned, or grouped by developer); the figure under the turbine is availability, and the badges show commercial or trial operation, offshore or onshore, and the wind speed at the nearest station. Click a card for details.
- **Compact view** (the default): "Generating now" at the top lists the cards of the farms with output (0.1 MW or more as shown) in the chosen order, at most 8 of them, with "N more generating · show all cards" when there are more; below it, "No output right now" lists only the names, by group, and a name opens the details. "Show all cards" or "Show as cards" lists every farm's card by group, and "Compact view" returns. Sorting and filters apply to both parts and grouping to the names and the all-cards view; when filters leave 8 farms or fewer, all cards are listed straight away.
- **Phones**: one farm per row, with the full name, the output on the right and the capacity bar below.

### Charts

- **Ranking**: every farm's output right now; click a bar for details. Farms with no output right now fold into one line, "N more with no output right now", which opens the rest.
- **Output mix**: by developer and by offshore / onshore.
- **Long-term**: Taipower's official retrospective data (open dataset 37331, Taipower-owned units only, about 4–5 months behind): the strongest and weakest days, generation over the period, a wind calendar heat map and the daily trend; one unit can be shown on its own.
- Every chart switches to a **table**, and the arrow keys step through the values.
- "📊 Capacity factor rankings (live samples)" opens the globe's Output dialog (4.8) to compare the sampled results of every grid unit, private farms included.

### Map

A satellite map (needs a connection). Click a farm for its live output, capacity and availability, then "Project details" for the details.

When the map library cannot be loaded (offline, or the single-file copy offline), an **offline sketch** is drawn instead: Natural Earth's outline of Taiwan with each farm's approximate position, in the same colours and sizes as the satellite map. Hover a circle for its name and output, and click it (or Tab to it and press Enter) for the details. The sketch cannot be zoomed.

### Farm details

Clicking a farm in any tab opens the details on the right:

- Live output and availability; the **output** or **nearby station wind speed** over the last 6 hours, 24 hours or 7 days (the wind speed is from the nearest Central Weather Administration station on land, not a hub-height measurement).
- Specs: offshore farms show capacity, status, number of turbines, unit size, model, water depth, distance to shore and yearly generation; onshore farms show location, model and unit size.
- **Development and operation timeline**: each date checked against a source; dates that could not be verified are left out.
- **📏 How big is one turbine?** (offshore farms with a checked hub height and rotor diameter): as on the globe's farm cards, see 4.6.
- "🌍 See this farm on the 3D globe" opens the same farm on the globe.
- **Previous / next**: ‹ › at the top move through the farms in the on-screen order (`←` `→` on a keyboard, or swipe sideways on the details on a phone), with the position shown between them. The dashboard follows its current sort and filters (including the cards folded under "show all cards"); the farm grid, charts and map follow the current output.
- Close with ×, Esc, a click beside the panel or Back (Back closes only the details and stays on the page). While the details are open the link carries `?farm=<id>` and can be shared; `#/live?farm=<id>` opens a farm directly (e.g. `#/live?farm=formosa1`).

## 4. Global (the 3D globe)

`#/global`. The first visit downloads a few MB (three.js, basemaps, about 31,000 farm records), so give it a moment. The first time it is opened without parameters it shows four **start cards** — watch wind power grow (play from 1980 to today), compare countries, see right now (live data) and hear the story (tours); pick one to begin, or close them with "Just show me the map" or Esc. Later visits without parameters play from 1980 automatically, and "✦ Start cards" in the "▶ Tour" menu reopens them.

### 4.1 Layout

- **Toolbar at the top**: Focus and Search, then the three menus View, Layers and Analyse, with Tour and Sources on the right (4.3).
- **Centre**: the globe or flat map; the readout at the top left shows the big year, the scope's cumulative capacity (onshore / offshore) and the year's additions; the legend panel at the bottom left lists only the layers and colourings that are on. The globe draws shapes only: event markers and milestone stars show their titles when hovered, selected or just reached while playing, while country and farm names follow the label density in View.
- **Side panel (context panel)**: a breadcrumb "World › continent › country" at the top (click an earlier step to go back), then "Profile", "Lists ▾" (Milestones, Farms, Pipeline, Ports and Events, each with its count in the current focus) and "Analyse ▾" (Output, Compare, Makers & owners; 4.5); collapse it with "–/+".
- **Timeline at the bottom**: play button, year slider and speed (4.4).
- **Card**: opens for a farm, port, event or milestone; on desktop it takes the side panel's place (the panel steps aside) and the panel returns when you close it with ✕ (4.6). On phones the card lives in the bottom drawer.
- **Phones (640 px and below)**: the map fills the screen; the top edge keeps only Focus, Search, Layers and "⋯" (View, Analyse, Tour, Sources and Speed sit inside ⋯). The timeline, the readout, the side panel and the card are all in the **bottom drawer**: its handle row holds the play button, the year, the scope's figures and the slider; drag the handle (or the panel header) up for half height and again for full, drag down to close, or tap the grip or the figures to switch between closed and half. Tapping a farm opens its card at half height in the drawer; drag up for the rest, and closing the card returns to the panel. The attribution line sits at the bottom of the handle row; tap it to read it in full.

### 4.2 Controls

| Action | Mouse | Touch | Keyboard |
|---|---|---|---|
| Rotate | Drag | One-finger drag | |
| Zoom | Wheel | Pinch | |
| Pick a country | Click it (Focus follows) | Tap | |
| Open a card | Click a farm, port, event or milestone | Tap | |
| Search | "🔍 Search" | "🔍 Search" | `/` |
| Play / pause | ▶ | ▶ | Space |
| Year back / forward | Drag the timeline | Drag the timeline | `←` `→` |
| Close | ✕ | ✕ | `Esc` (closes a dialog, then ends a tour, then closes the card) |

Clicking empty ground zooms in there. Click the map once before using the keys; they do nothing while the cursor is in a box or menu.
The browser's or phone's Back button first closes a card, the sources dialog or a maximised analysis you opened (analyses always open as a window on phones); press it again to leave. For a card opened from a shared link, Back returns to the previous view.

### 4.3 Toolbar

The toolbar keeps two primary controls; everything else sits in three drop-down menus (click outside or press Esc to close; one open at a time):

| Control | What it does |
|---|---|
| **Focus** | The world, a continent or one country (sorted by 2026 capacity); picking a country flies there and draws all its farms |
| **🔍 Search** | Opens the search in the Farms tab (4.5) |
| **📍 Near me** | Uses the browser's location to find the operating farm nearest to you: the timeline moves to the latest year, the map flies between you and the farm, its card opens and the map marks "📍 You are here". Your position is used only in this browser; it is never sent anywhere or stored |
| **View ▾** | **Layout**: the map alone, the map with country bars, or only the bar race (always in MW); **Projection**: 3D globe or 2.5D map; **Basemap**: Relief, Satellite, Plain or Wind speed (Global Wind Atlas at 100 m; zooming in adds sharper Esri tiles automatically, not on Wind speed); **Labels**: Off, Minimal, Standard, Detailed; **Auto-rotate** |
| **Layers ▾** | Six layer toggles, each with its legend colour and the record count in the current focus; the number on the button is how many layers are on. **Pipeline** (dashed rings, brighter when closer to completion; on by default), **⚓ Ports** (on by default), **⚑ Events** (on by default), **Sea zones**, **Live data**, **Wind now** (the latest NOAA GFS 10 m wind as flowing particles, refreshed every 6 hours; white particles get brighter and thicker with speed over a translucent colour wash; the legend switches the wash between **Speed** (more magenta = stronger) and **Turbines** (grey below 3 m/s = barely turning, blue-green 3–12 = output rising, bright green 12–25 = full output, magenta above 25 = shut down; indicative, from 10 m wind, which is weaker than at hub height, and models differ); today's weather, not tied to the timeline). Two menus below them: **Show** (onshore + offshore, onshore only, offshore only, Offshore: foundations) and **Colour by** (year-end capacity, per capita, wind share of generation, capacity factor or added this year; the bar race ranks by it too, 4.8a) |
| **Analyse ▾** | **📊 Output** (4.8), **⚖ Compare** (4.8a), **🏭 Makers & owners** (4.8b) |
| **▶ Tour** | "✦ Start cards" (the four starting points, see the start of section 4), the auto tour or one of four story tours (4.9); press it again during a tour to end it |
| **Sources** | Source, licence, data time and record count of every dataset |

The layers themselves are described in 4.7.

### 4.4 Timeline

- The timeline runs from 1980 to **2026 (latest available)**. 1980–2025 are each country's year-end cumulative capacity; for 2026 only the countries that have published this year's official figures (Taiwan, China, India, Brazil, the US, Germany, France and the UK) are new, and the rest carry their end-2025 figure, drawn hatched in the bars.
- **Speed**: from 1 year per 10 seconds to 4 years per second.
- **Show** (in the Layers menu): onshore + offshore, onshore only, offshore only, or "**Offshore: foundations**" (4.7).
- Farms appear in their commissioning year: with the timeline on an earlier year, farms finished later are not drawn.

### 4.5 Side panel tabs

The panel opens on "Profile" (world, continent or country); the five lists sit under "Lists ▾", and once one is chosen the button shows its name; the three analyses sit under "Analyse ▾" and open inside the panel on desktop (4.8). The breadcrumb takes you back to the continent or the world in one click.

- **Profile**: for a country, the year-end cumulative capacity with its curve, world rank, onshore / offshore, share of the world, the figure 10 years earlier, the offshore world rank, **added this year** (onshore / offshore), **per-capita capacity**, **wind share of generation**, **capacity factor (national average)** and a bar chart of the capacity added each year (4.8a); the number of farms in the data, the largest and earliest farms, **farm-level coverage** (capacity mapped farm by farm ÷ the national figure), foundation and pipeline totals;
  Taiwan and Japan carry an official-statistics audit badge. The "Live output right now" box: for Taiwan, Australia and Canada it shows each grid's total (with farm-level figures as well); for the UK (Great Britain, with Northern Ireland as a second row), Ireland, Germany, France, Denmark, Belgium, Poland, Korea and Brazil it shows national wind output (onshore/offshore for Germany, France, Denmark, Belgium and Poland), and for the US the Texas (ERCOT) and California (CAISO) grids — these are totals only, with nothing per farm. Each row has the data time (local time), the last 48 hours as a trend (hourly means), a coverage note (e.g. the UK figure leaves out most turbines on the distribution network, so it is low; Texas and Belgium also show the share of capacity; Poland's current value is a snapshot of PSE's homepage map, and today's part of its trend only has this site's points, about every 30 minutes) and the attribution. Buttons below: tour this country, farm list, Compare, Makers & owners, Output rankings (Taiwan, the US, Australia, Denmark) and the Taiwan live dashboard. With the world or a continent in focus, it lists the top five countries and a "Wind output right now" list, sorted by output and not summed (the sources differ in coverage and timing); a name opens that country's profile.
- **Milestones**: landmark farms in wind history; click one to jump to its year and fly there. The stars on the globe show their names only when hovered, selected, just reached while playing, or the current stop of a tour.
- **Farms**: search and filter every farm —
  - The search box takes a farm name, Chinese name, developer, turbine model, country or port.
  - Filters: status (operating, under construction, pre-construction, announced, retired), type (onshore, offshore, floating), minimum size (10, 50, 100, 300, 1,000 MW) and a year range; sort by capacity, year or name.
  - The search follows the Focus menu; "Search worldwide" searches the whole world at once. While any condition is set, the map shows only the matching farms (even at world zoom).
  - If a result says it is "not on the map for this year", the timeline is on an earlier year: press "Go to the latest year". Enter picks the first result.
- **Pipeline**: projects under construction, in pre-construction or announced within the focus, by status and expected year, with GEM's February 2026 country pipeline totals; clicking a project draws its planned layout as translucent turbines.
- **Ports**: filter by role (marshalling, foundations, towers, blades, nacelles, cables, floating assembly, O&M base).
- **Events**: filter by type (milestone, incident / failure, policy & society) and search.

### 4.6 Farm cards

Click a farm on the map, in the search results or in a list to open its card; on desktop it appears where the side panel was, and closing it brings the panel back. From top to bottom (each part shows only when there is data):

1. **Photo**: a hand-checked Wikimedia Commons photo with author and licence; otherwise a Wikipedia image only when it shows wind turbines.
2. Type, status, years, country and name; capacity, phases, turbine model and developer.
3. **Foundation** (offshore farms): type and sources; water depth, hub height and rotor diameter; a **cross-section** (to scale when the dimensions are known, otherwise marked as not to scale).
4. **Turbines**: where the close-up's turbine positions come from (USWTDB in the US, MaStR in Germany, OpenStreetMap elsewhere).
5. **Distance to shore**, **actual yearly output** and capacity factor (where official farm-level measurements exist; "See rankings" opens the Output dialog) or **estimated yearly output** (capacity × the country's average capacity factor, labelled as an estimate); Taiwanese farms also show "live samples (last 90 days)".
6. **📏 How big is one turbine?** (expand): where the hub height and rotor diameter are known, compares them with familiar things: the highest blade tip (hub height + rotor radius) with Taipei 101 (508 m, CTBUH), the rotor diameter with the length of a standard football pitch, and the area one turn sweeps in standard pitches (FIFA's recommended 105 × 68 m); below, a view from above draws the rotor disc and the pitches to the same scale. With mixed models the largest is used.
7. **Standing in the country**: capacity rank and share of the national total in the timeline year.
8. **Phases**: dashed boxes are phases not yet finished in the timeline year.
9. Description and data notes, including when the coordinates are only approximate (for example only the township or county centre) or a shared placeholder point.
10. **Live output right now**: farms with live data in Taiwan, Australia and Canada (with the timeline at the latest year they get a green ring and their rotors turn with their output); Taiwanese farms link to their live details.
11. Wikipedia summary; links to Wikipedia, a satellite map, OpenStreetMap, a wind resource map, a photo search, the GEM project page, Wikidata and the source.
12. **Nearby farms** (within 30 km), other farms by the **same developer** and **related events**; click to switch.
13. **🚢 Sail out to the farm** (onshore farms: **🧭 Walk into the farm**): opens the **sea-level view** (4.6a).
14. **🔗 Copy link to this farm** and **⚑ Report a data error** (opens a GitHub issue pre-filled with the farm's details).

### 4.6a Sea-level view

"Sail out to the farm" on the card replaces the map with a 3D scene: the camera starts at the farm's marshalling or O&M port (the nearest port whose "farms" list names it), flies to the edge of the farm in 3–4 seconds and settles at a roughly 30° oblique view. Then:

- Drag to orbit, scroll or pinch to zoom, right-drag or two-finger drag to pan; **Sea level** puts the camera about 16 m up (bridge height) just outside the turbine nearest the port (**Ground level**, eye height, on onshore farms); **Oblique 30°** returns to the arrival angle; **Sail again** replays the approach; **🔗 Copy link** copies the link with `sv=1`.
- **↩ Back to the globe** (or Esc) removes the scene; the globe comes back exactly as you left it, card and year included.
- The notes at the bottom left say where the farm's data comes from: whether the turbines stand at their real positions (USWTDB in the US, MaStR in Germany, OpenStreetMap elsewhere) or in a schematic layout; whether hub height and rotor diameter are the site's checked values, register values or estimates; the foundation type (the part above water is schematic); the port; and, for farms with live data in Taiwan, Australia and Canada, that the blades turn with the output right now.
- Ground and sea carry Esri imagery: it is often older than the farm, so the turbines themselves are usually not in it; there is no terrain relief, and the port area is imagery only, with no buildings drawn. Offline (the single-file copy without a network) the ground is a plain colour with a notice.
- **Neighbouring farms**: other operating farms within 10 km (the nearest 12, at most 600 turbines) are drawn in a paler colour with their own positions and sizes and named in the notes (schematic ones marked); the camera and the port follow the farm you chose. Where a farm's coordinates are only approximate, the notes warn that the scene may be off the real site.
- With the system setting "reduce motion" the approach is skipped and the view starts at the oblique angle.

Port cards list the roles, the farms served (drawn as arcs on the map) and the sources; event cards give the summary, capacity basis, casualties (officially confirmed only), related farms and sources.

### 4.7 Layers

- **Pipeline** (dashed rings): about 9,600 projects under construction, in pre-construction or announced; turning it on moves the timeline to the latest year.
- **⚓ Ports**: 103 offshore wind ports in 20 countries (marshalling, manufacturing, cables, floating assembly, O&M), each with sources; small dots at world zoom, icons and names when zoomed in.
- **⚑ Events**: 91 major events and incidents (red = incident / failure, white = milestone, purple = policy & society), shown once the timeline reaches their year; the title on a marker appears only when hovered, selected or just reached while playing; events without coordinates are placed at their farm or listed only in the Events tab. Full list: [events.en.md](./events.en.md).
- **Offshore: foundations** ("Show" in the Layers menu): colours operating offshore farms by type — monopile, steel frame (jacket, tripod, tripile), floating, other fixed-bottom (gravity-based, high-rise pile cap, low pile cap, cofferdam, rock-anchored, composite bucket, mixed) —
  with farms not yet checked as "type unknown". The legend counts each group in focus; click a group to show only that group. Farm-by-farm list: [foundations.en.md](./foundations.en.md).
- **Wind now**: see 4.3; the legend gives the data time (Taiwan time).
- **Sea zones**: EEZ boundaries (three kinds of line: agreed or ruled, median lines and 200 NM limits, unsettled or disputed); Taiwan's 36 offshore wind potential sites published by the Energy Administration, Japan's 13 promotion zones, and the planned or leased areas of 6 North Sea countries (Netherlands, Germany, Belgium, Denmark, Scotland, Norway), named with their area when zoomed in.
  **The lines have no legal value and imply no position on disputed waters.**
- **Live data**: countries for which the site has live wind output are coloured — **solid teal** = the whole country (Germany, France, Denmark, Belgium, Poland, Ireland, Korea, Brazil, Taiwan), **violet hatching** = only part of it (UK: Great Britain only has wind metered by the grid operator, and Northern Ireland is an estimate for the whole area; US: only Texas and California; Australia: only the eastern grid; Canada: only Alberta and Ontario); no colour = no live data the site may use. In the US, Canada and Australia only the covered states or provinces are coloured, with the national border dashed (state and province borders are approximate, since grids do not follow them exactly); both parts of the UK have data, but Great Britain leaves out most turbines on the distribution network, so the whole country is hatched. France is coloured on the mainland only. The colours only show whether there is data and how much of the country it covers, not how much is generated. Hover over land to see whether that country or state has data; the legend lists the countries, "Details" shows the reasons for the partial ones, and a name opens the current figure and 48-hour trend. The public single-file globe does not have this layer.
- **Wind speed** ("Basemap" in the View menu): Global Wind Atlas mean wind speed at 100 m, in 1 m/s bands with a legend.

### 4.8 Output

Open it from "📊 Output" in the toolbar's or the panel's Analyse menu, "Output rankings" in a country profile, or "See rankings" on a farm card. On desktop it shows in the panel's Analyse tab; "⤢ Maximise" turns it into a window over the map ("⤡ Back to panel" returns), and ✕ or switching tabs closes it. On phones it opens as a window straight away. Compare and Makers & owners work the same way.

- **Data**:
  - Taiwan · official yearly (19 Taipower-owned farms, Taipower open data)
  - Taiwan · live samples (every grid unit including private farms, sampled from Taipower's live data about every 30 minutes, every 2 hours before 22 Oct 2026; last 30 days, last 90 days or everything)
  - USA (EIA-923, 834 farms) and Australia (AEMO 5-minute measurements, 64 farms, curtailment included)
  - Denmark · farms (Danish Energy Agency, 54 farms) and Denmark · single turbines (about 1,800 individually metered turbines; the same-model view draws a distribution)
- **Three views**: total output (average output for samples), capacity factor, and same turbine model (one model's capacity factor across farms). Pick the year, high→low or low→high; search when there are more than 20 rows.
- Clicking a row closes the dialog and flies to the farm.
- **Samples are not measurements**: "Taiwan · live samples" are estimates from instantaneous output, with seasonality; they are never mixed into the official yearly ranking or turned into yearly generation. Private farms have no official farm-level figures.

### 4.8a Country comparison and indicators

**Country comparison**: open it from "⚖ Compare" in the toolbar's Analyse menu or "Compare" in a country profile; pick 2–4 countries (Taiwan, Denmark and Germany by default). Above is the cumulative-capacity curve from 1980 to the latest year, below a table for the chosen year: capacity at year end, onshore, offshore, world rank, share of the world, added this year, added in the last 5 years, growth over 10 years, per capita, wind share of generation, capacity factor (national average), the operating farms on this site (count and capacity) and the largest farm. You can change the year (in step with the timeline), add Taiwan and copy the link.

**Indicators** ("Colour by" in the Layers menu): the map colours countries in six steps of one hue (brighter = higher), with the steps, the source and the data year in the legend; countries without data stay uncoloured; hovering over a country shows its value; the bar race view ranks by the indicator as well. It cannot be combined with the "Live data" colouring.

| Indicator | How it is computed | Source |
|---|---|---|
| Capacity at year end | the site's national statistics (MW) | IRENA, the Energy Administration, JWPA and others |
| Per capita | site year-end capacity ÷ population of the year (W per person); population runs to 2023 and is carried forward with a label | Our World in Data, population (CC BY 4.0) |
| Wind share of generation | wind generation ÷ total generation (%) | Ember, Yearly Electricity Data (CC BY 4.0) |
| Capacity factor (national average) | wind generation ÷ (mean of the two year-end capacities × hours in the year); includes curtailment and partial years, blank outside 5–60% | Ember, Yearly Electricity Data (CC BY 4.0) |
| Added this year | year-on-year difference of the year-end totals (MW); negative when more was decommissioned than built | the site's national statistics |

Ember and the population series stop at their latest years (2025 and 2023 at present); later years carry the last value, labelled in the legend and the table. All of these are national averages, meant for trends and rough comparison only.

### 4.8b Turbine makers and owners

Open it from "🏭 Makers & owners" in the toolbar's Analyse menu or the button of the same name in a country profile; the scope starts at the selected world, continent or country and can be changed in the dialog.

- **Turbine makers**: the capacity of operating farms in the site's farm records at the end of the chosen year, ranked by maker (top 10 plus others), for all, onshore or offshore; below it, a stacked bar chart of the capacity added each year over the last 25 years by maker (one colour for each of the top 5, grey for the others and for unknown).
  Makers come from USWTDB per-turbine manufacturers for the US, MaStR per-turbine manufacturers for Germany (mixed farms split by each maker's capacity), and the turbine field of the farm records elsewhere; records naming several makers without their capacities count as unknown, and OpenStreetMap tags are not used.
  Brands are folded into today's companies along their history (e.g. NEG Micon, MHI Vestas → Vestas; Siemens, Gamesa, Bonus, Adwen → Siemens Gamesa; Enron Wind, Zond, Tacke, Alstom → GE Vernova).
- **Owners**: owners of operating units in Global Energy Monitor's (GEM) February 2026 release, with capacity split by their stakes (top 15 plus others); this is the current ownership, not tied to the timeline, and onshore is not split out. Subsidiaries are merged only when the group's name is part of their own.
- **Always read the coverage**: the top line says how much of the capacity has a known maker (or owner). The site knows the maker for about a quarter of the world's capacity (very little for China, India and Spain), about 70% of offshore, over 80% for the US and over 90% for Germany and Taiwan; below half a warning appears and the shares **must not be read as market shares**.
  Annual market-share statistics (GWEC, BNEF and others) are paid reports and are not included.

### 4.9 Tours

Press "▶ Tour":

- **✦ Start cards**: reopens the four cards of the first visit (explore, compare, live, story).
- **Auto tour (current focus)**: flies through the key moments within the focus.
- **Story tours** (11 stops each, narrated in both languages): ★ Taiwan's road to offshore wind, ★ Europe offshore: from Vindeby to gigawatts, ★ China's rise, ★ Floating wind.
- During a tour the card has ⏮ ❚❚ ⏭ and progress; Space pauses and the arrow keys change stops; dragging the map pauses, and clicking the map or pressing Esc ends it.

### 4.10 Sources

"Sources" in the toolbar lists the source, licence, data time and record count of each dataset, with the required credits (e.g. © OpenStreetMap contributors, AEMO, Energistyrelsen).

At the top of the dialog, "Limits of the data and open questions" lists, computed from the data now loaded, how many farms share placeholder points or have approximate locations, the farms with no known start year, the countries whose farm records fall furthest short of the national figure, the offshore farms whose foundation type or hub height is not yet checked, the countries with no port listed yet, the events not yet linked to a farm and the state of the photos, and says which figures are estimates. The attribution line under the globe also says the data is still being checked and not fully accurate.

## 5. Learn

`#/learn`, 13 illustrated chapters; the table of contents on the left marks the chapter you are reading. On phones and tablets (1100 px and below) the contents sit at the top, and once you scroll past them a "current chapter ▾" bar with reading progress appears under the header; tap it for the contents. Every chapter has a button that replays that part of the story on the globe, and chapters 5, 6, 8 and 10 also start their story tour.

| Ch. | Link | Title |
|---|---|---|
| 01 | `#/learn/glance` | At a glance |
| 02 | `#/learn/origins` | Origins 1888–1979 |
| 03 | `#/learn/takeoff` | Take-off 1980–1999 |
| 04 | `#/learn/scaleup` | Scale-up 2000–2010 |
| 05 | `#/learn/asia` | Asia's century 2010–2025 |
| 06 | `#/learn/offshore` | Going offshore |
| 07 | `#/learn/foundations` | Foundations |
| 08 | `#/learn/floating` | Floating wind |
| 09 | `#/learn/bigger` | Ever-larger turbines |
| 10 | `#/learn/taiwan` | Taiwan's path |
| 11 | `#/learn/why` | Why wind · myths (with "Frequently asked") |
| 12 | `#/learn/terms` | Glossary |
| 13 | `#/learn/sources` | Sources & method (with "Limits of the data" and "About this site") |

Charts can be switched to tables.

**Try it**: four hands-on panels with sliders, placed in the chapters they belong to: chapter 9 "One turbine's power curve" (wind speed, rotor diameter, rated power and power coefficient → output; a simplified model with the Betz limit dashed), chapter 6 "The wake effect" (the spacing of a row of 5 turbines → the wind and power each one behind gets; Jensen's 1983 single-wake model), chapter 11 "Capacity factor" (pick a farm with official measured yearly output to see how the factor is computed, then drag "if it ran at X% all year") and "Wind keeps getting cheaper" (IRENA's global weighted-average LCOE via Our World in Data, constant 2025 US$ per kWh; drag the year to see how far onshore and offshore fell from 2010). The first two are simplified physics with the assumptions stated under the panel; the other two use only the site's verified data. Switching language redraws them and keeps the slider values.

## 6. Travel with the Wind (for young explorers)

`#/kids`, a lighter version for upper primary and junior high students, to play alone or to project for a whole class. The guide is Breezy (小風), a little wind sprite; the page uses light colours, large type and big buttons.
Open it from the banner under "Explore" on the home page or from the link under "Project" in the footer. The site's navigation stays at the top; the page's own toolbar sits under it, with Breezy and the title on the left, the 8 stops as dots in the middle (green = stamped, yellow = the current stop) and "Read to me", "Globe" and "Passport n/8" on the right.

| View | Link | Contents |
|---|---|---|
| Welcome | `#/kids` | Breezy says hello; "Start the adventure" opens the globe, plus "Taiwan's wind right now"; once you have stamps, "continue with stop n" appears; below, "For teachers: play as a class" |
| Globe | `#/kids/globe` | A 3D globe (drag to spin, scroll or pinch to zoom) with countries in 6 shades by installed capacity at year end; the 8 numbers are the stops, tap one to open it. Beside it are Breezy's "Next" hint and "The route" (hover over or Tab to a stop and the globe turns to it); below are the "Time machine" (▶ plays 1980 to 2025, or drag the slider) and "Who has the most wind power?" (the top 5 and Taiwan, pole heights to scale) |
| Stop | `#/kids/stop?n=1` to `8` | A photo (Wikimedia Commons, with author and licence; an illustration when there is none or it cannot load), three key facts and a quick question; stops 6, 7 and 8 add "Compare", drawing Taipei 101 and the turbine to the same scale (stop 7 also lays the rotor circle over football pitches). A wrong answer explains why and lets you try again; the right one stamps your passport and shows "Next stop" |
| Taiwan's wind right now | `#/kids/taiwan` | Taiwan's wind output right now, roughly how many homes it could power at once (one small house = 10,000 homes), a comparison with the windiest moment of the past 7 days and how many of Taiwan's wind farms are generating; below them "This week's wind" (each of the last 7 days' average output, the windiest day in yellow, the same samples as Home's weekly recap) and "📍 Where is the nearest turbine to me?" (the browser asks for your location only when pressed; it is compared on this device only, never sent or stored; a map centred on you and, in kids' words, which way, how far and how big the nearest farm is); the same data as Taiwan live, labelled "Simulated" when Taipower's data cannot be reached |
| Passport | `#/kids/passport` | Your name, the 8 stamps and three badges (Time traveller: all 8 stops; Offshore expert: the 4 offshore stops; Taiwan wind fan: stop 7 plus a visit to "Taiwan's wind right now"); "Print passport" prints the page (without the buttons or the site's header and footer); with all 8 stamps a "Certificate" button appears; "Start over" clears every stamp |
| Certificate | `#/kids/cert` | Only with all 8 stamps: the "Wind Explorer Certificate" with your name (editable here), the 8 stamps and the date you finished; "Print" fits it on one A4 page. Before that it tells you how many stamps are missing |
| Play as a class | `#/kids/class` (`?n=1` to `8` starts at that stop) | For a teacher's projector, in large type: each stop has three steps, "Facts → Question → Answer". During a question, start the 10-second countdown, take a show of hands and tap the answer most of the class chose (a wrong one is explained and can be tried again), or reveal the answer. →, the space bar or a clicker's "next" moves on, ← goes back and F toggles full screen; the toolbar has "Read to me", "Full screen" and "End". This mode gives no stamps and keeps no one's progress |

The eight stops, by year:

| Stop | Year | Place | Topic |
|---|---|---|---|
| 1 | 1888 | Cleveland, USA | The first turbine that ran by itself to make power (Brush) |
| 2 | 1957 | Gedser, Denmark | The grandparent of three-blade turbines (the Gedser turbine) |
| 3 | 1986 | Muppandal, India | Wind through a mountain pass |
| 4 | 1991 | Off Lolland, Denmark | The first wind farm at sea (Vindeby) |
| 5 | 2009 | Jiuquan, China | A wind power base by the Gobi |
| 6 | 2017 | Off Peterhead, Scotland | Turbines that float (Hywind Scotland) |
| 7 | 2019 | Off Miaoli, Taiwan | Taiwan's first offshore wind farm (Formosa 1) |
| 8 | 2025 | Off Fujian, China | The biggest turbine yet (Dongfang Electric 26 MW) |

- Every figure comes from the site's own data: country capacity as on the globe, turbine specifications from the globe's milestones, stop 6's water depth and sizes from the foundation data, and Taiwan right now from Taiwan live.
- Progress (stamps and name) is kept only in this browser, with no sign-up and nothing uploaded; another computer, or clearing the browser's data, starts over.
- **Read to me**: the browser's own speech synthesis reads out the screen's facts, question and options (nothing is sent anywhere); press again to stop. Without speech synthesis or a voice for the language, the button is disabled or shows a notice.
- The language follows the EN / 中文 switch in the header.
- The full single-file edition includes it (it works offline; photos need a connection); the public global wind map does not.

### 6.1 For teachers: lesson plans, worksheets and classroom activities

`#/teach` ("For teachers" under "Explore" on the home page, or "Project" in the footer) is for teachers; no account and nothing to install:

- **Lesson plans and worksheets** (printable or saved as PDF, A4; "Print" at the top right hides the header and footer, and the worksheet and the teacher's key each start a new page):
  - `#/teach/jh` **Junior high · Science · 45 min, "How much power is Taiwan's wind making right now?"**: read the output now, the homes it serves, the windiest day this week and where the farms are from Home, the kids page "Taiwan's wind right now" and the globe, then answer the claim "no wind, no power" with evidence. Maps to science learning content Nc-Ⅳ-2, Nc-Ⅳ-4, Nc-Ⅳ-6, INa-Ⅳ-4 and energy-education issue items 能 J1, J3, J5.
  - `#/teach/sh` **Senior high · Scientific inquiry and practice · 2 periods, "Does a wind farm really generate all the time?"**: take official measured yearly output from the globe's Output dialog or the data page, compute the capacity factor = yearly generation ÷ (capacity × hours in the year), compare farms in Taiwan, Denmark, Australia and the US, argue and present in groups; with a rubric. Maps to the four inquiry items, chemistry CNc-Vc-1 and energy education 能 U6, U7, U9. The worked examples in the teacher's key are computed from the site's measured data when the page opens.
  - The curriculum and issue passages are the original wording of the National Academy for Educational Research's guidelines and its issues-integration handbook (English translations are the site's own); the figures in the plans differ every lesson, so the worksheets leave blanks for students to fill from the site.
- **Classroom activities**: one card each for the kids page, class mode, Taiwan's wind right now, Home, the four hands-on panels, the globe tours, the country comparison and the data page, with the suitable level, time and how to use it, a link and a QR code (pointing to the public site); "Print activity cards" prints them as a handout.
- **Projection and settings**: light mode, full screen, language, the single-file copy for classrooms without internet, location permission and data times.

### 6.2 Data download: CSV and citation

`#/data` ("Project" in the footer, or from the teacher hub) converts the data the site is using right now into CSV (UTF-8 with BOM; opens in Excel and Google Sheets; the file name carries the download date), so it is always current; every dataset lists its columns, source and licence, with a link to the raw JSON:

| Dataset | Content | Source |
|---|---|---|
| Taiwan daily samples per grid unit | each unit's daily average output, capacity factor and sample count (the site's sampled estimates) | Taipower live data (Open Government Data License) |
| Taiwan daily total output | each day's average total and highest sample | same |
| National capacity by year 1980–2025 | year-end cumulative, onshore and offshore | Energy Administration, JWPA, IRENA (via Our World in Data) |
| Measured yearly farm output | farms with official per-farm figures: generation and capacity factor | EIA-923, Taipower, the Danish Energy Agency, AEMO |
| Operating wind farms | name, position, capacity, start year, type | Global Energy Monitor, USWTDB, MaStR, the site's own records |
| Offshore foundations and dimensions | foundation type, water depth, hub height, rotor diameter, a source per row | OSPAR and the site's farm-by-farm checks |
| Global wind LCOE 1984–2025 | global weighted average onshore and offshore (constant 2025 US$ per kWh) | IRENA via Our World in Data |

- "Citing the site" at the bottom gives a suggested citation (with version and access date) and "Copy citation" copies it; when citing a dataset, also credit its original source and licence.
- OpenStreetMap turbine positions (ODbL) are not offered here; the limits of the data are in section 10 and in Learn's "Sources & method".

## 7. Links and sharing

The link is the view: share it and the other person sees the same thing. The globe keeps its link up to date as you use it.

**Taiwan live**: `#/live?farm=<id>` opens a farm's details (on any tab, e.g. `#/live/wall?farm=wo1`); `#/live/charts?mode=bar|donut|hist` picks the chart (ranking, mix, long-term).
Dashboard sort and filters (on `#/live` only; defaults are left out): `sort=ratio|cap|name` (availability, capacity, name; output by default), `group=dev` (group by developer), `type=offshore|onshore|commercial|building`, `size=L|M|S` (large >300 MW, medium 100–300 MW, small <100 MW), `dev` and `brand` (developer and maker, using the names in the toolbar menus; picking them there and copying the link is easiest). Example: `#/live?sort=cap&type=offshore`. A link that carries them wins; otherwise the dashboard uses what this browser remembered. These parameters, `farm` and `mode` are written into the link as you go.

**Schedule status**: `#/status` lists the last data time of every source (Taipower live, daily samples, supply and demand, each live source abroad, Wind now, the official retrospective archive), the latest run of every schedule (GitHub Actions) and the upload time of the single-file copies; green = within the expected cadence, amber = late, red = far behind or the last run failed, with a one-line summary at the top; the page reloads every 5 minutes while open. Run results come from GitHub's public API (no login, 60 requests per hour per IP; beyond that only the data times are shown).

**Embeddable card**: `#/embed` is a small card without the header or footer (output now, availability, homes supplied, share of national generation, the first line of today's wind, the past 7 days, the data time and a link back to the site) for schools or other sites to put in an `<iframe>`; `?l=en` for English and `?t=light` for light colours (this page only; the browser's saved settings are untouched). "Embed on your site" under Share in the header copies this snippet:

```html
<iframe src="https://dofliu.github.io/windfarmTaiwan/#/embed?l=en" width="100%" height="280" style="border:0;max-width:460px;border-radius:14px" title="Taiwan wind right now · Wind Watch" loading="lazy"></iframe>
```

**Travel with the Wind**: `#/kids`, `#/kids/globe`, `#/kids/stop?n=1` to `8`, `#/kids/taiwan`, `#/kids/passport`, `#/kids/cert`, `#/kids/class` (optionally `?n=1` to `8`) (section 6).

**Learn**: `#/learn/<chapter>` jumps to a chapter; `#/learn/sources?s=tw|intl|global|all` jumps to the Taiwan live, live abroad or global wind part of the sources, or opens "All sources and data notes".

**Globe** (combine parameters with `&`):

| Parameter | Meaning | Example |
|---|---|---|
| `r` | Focus: `WORLD`, a continent (`C:Asia`, `C:Europe`, `C:North America`, `C:South America`, `C:Africa`, `C:Oceania`) or a country code | `r=TWN` |
| `y` | Year (omitted = latest year) | `y=2020` |
| `v` | View: `map`, `split` (map + bars), `bars` | `v=bars` |
| `mode` | `globe` or `flat` | `mode=flat` |
| `layer` | Show: `both`, `on` (onshore), `off` (offshore), `fd` (foundations) | `layer=fd` |
| `fdg` | One foundation group: `mp`, `frame`, `fl`, `other`, `unk` (with `layer=fd`) | `fdg=fl` |
| `f` | Open a farm card (English name) | `f=Hornsea%20One` |
| `sv` | With `f`: open the sea-level view directly | `f=Formosa%201%20Phase%202&sv=1` |
| `ms` | Open a milestone | `ms=Horns%20Rev%201` |
| `port` | Open a port | `port=twn-taichung` |
| `ev` | Open an event | `ev=WIND-040` |
| `q`, `fst`, `fty`, `fmin`, `fy` | Search text, status (`op,p1,p2,p3,ret`), type (`on,off,fl`), minimum MW, year range (`2015-2025`) | `fty=fl&fst=op` |
| `out` | Output: `TWN`, `TWS`, `USA`, `AUS`, `DNK`, `DKT` plus `.gen`, `.cf` or `.model` | `out=USA.cf` |
| `op` | Live-sample period: `30`, `all` (90 days by default) | `op=30` |
| `ind` | Colour the map by an indicator: `cap`, `pc`, `share`, `cf`, `add` (4.8a) | `ind=share` |
| `cmp` | Open the country comparison with 2–4 country codes separated by commas | `cmp=TWN,DNK,DEU` |
| `mk`, `mkv`, `mkt` | Open makers & owners: scope (`WORLD`, a continent such as `C:Europe`, or a country code), `mkv=owner` for owners, `mkt=on` or `off` for onshore or offshore only | `mk=WORLD&mkt=off` |
| `flow=1`, `zones=1`, `live=1` | Turn on Wind now, Sea zones, live data coverage | `live=1` |
| `fc=t` | Colour the Wind now wash by turbine operation | `flow=1&fc=t` |
| `base` | Basemap: `relief`, `sat`, `plain`, `wind` | `base=wind` |
| `pipe` | Pipeline: `0` off, `1` on | `pipe=0` |
| `play=1` | Play from 1980 (or from `y`) | `play=1` |
| `tour` | `1` auto tour; `tw`, `eu`, `cn`, `fl` story tours | `tour=tw` |

Examples: `#/global?fty=fl&fst=op` (operating floating farms worldwide), `#/global?r=C:Europe&layer=fd` (foundations in Europe), `#/global?r=TWN&zones=1` (Taiwan with sea zones), `#/global?r=C:Europe&live=1` (live data coverage in Europe).
`base`, `pipe`, `play` and `tour` apply when a link is opened but are not written back; the Ports and Events toggles are remembered in the browser, not in the link.

## 8. Single-file edition and public global wind map

Both are HTML files you save and open in a browser, with no web server, published in the GitHub Release "standalone" and linked in the site footer:

| File | Size | Contents |
|---|---|---|
| [windfarmTaiwan-standalone.html](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html) | about 13 MB | The whole site (Home, Taiwan live, the globe, Learn, Travel with the Wind) |
| [windfarmTaiwan-globe.html](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-globe.html) | about 12 MB | A slim copy for everyone: just the globe with the onshore, offshore and pipeline layers, plus search, the Pipeline tab and Output |

- **Online**: Taiwan live fetches the latest data from the live site, zooming in on the globe loads detailed tiles, and farm cards look up Wikipedia.
- **Offline**: the global data, farms, borders and basemaps are inside the file, so the globe works as usual; Taiwan live shows the data saved at build time, labelled "Offline snapshot". Taiwan live's satellite map is replaced by a sketch of Taiwan; Wikipedia summaries and detailed tiles need a connection.
- The files are rebuilt automatically when the site code or global data change; the footer shows the version and build time. The Share button always shares the live site's link.

## 9. Phones and older devices

- The site works on phones: the header shrinks to icons; at 640 px and below the globe becomes a full-screen map with a bottom drawer (timeline, readout, side panel and cards all live in it; drag up to open; see 4.1) and the top edge keeps only Focus, Search, Layers and "⋯"; tablets at 641–900 px keep the swipeable one-row toolbar with the panel and cards sliding up from the bottom.
- Touch: one finger rotates, two fingers zoom, tap a country or farm to fly there.
- Devices with small screens or little memory get smaller basemaps, which download faster.
- **Without WebGL** the globe switches to the bar race and says so.

## 10. How current the data is and how to read the figures

| Data | Updated |
|---|---|
| Taiwan live output | Taipower updates about every 10 minutes; this site fetches it about every 30 minutes (every few hours if the external trigger stops) |
| Australia and Canada live output | Same schedule as Taiwan; about 150 farms |
| Wind totals for the UK, Ireland, Germany, France, Denmark, Belgium, Poland, Korea, Brazil, Texas and California | Same schedule as Taiwan; the sources publish every 1–15 minutes, about 1–45 minutes behind (Germany is slowest; Poland is a snapshot, with the official trend values a day later); totals only |
| Taiwan long-term trend (37331) | Added weekly; the official data is about 4–5 months behind and covers Taipower-owned units only |
| Wind now | Every 6 hours |
| National capacity | Year-end 1980–2025; 2026 (latest available) updated by hand every quarter |
| Farm by farm | GEM February 2026, plus Germany's MaStR and the site's checked corrections |
| Measured yearly output | The latest complete year from each of US EIA-923, Taipower, the Danish Energy Agency and Australia's AEMO |

When reading the figures:

- **The data is not fully accurate**: the site compiles public data and keeps checking it record by record, but some locations, years and values are placeholders or estimates and some are not yet checked; rely on the original sources. The live list of limits is at the top of the globe's "Sources" dialog (see 4.10), and the explanation is in Learn chapter 13, "Limits of the data".
- **Measured, estimated and sampled are different**: "actual yearly output" is official farm-level data; "estimated yearly output" is capacity × the country's average capacity factor; "live samples" are samples of instantaneous output. The site labels each and never ranks them together.
- **Farm totals ≠ national statistics**: the national figures are the official ones. Large offshore farms in Taiwan and Japan count from their full-completion year; farms elsewhere come from GEM at full nameplate capacity. The country profile's "farm-level coverage" shows the gap instead of filling it with made-up farms.
- **Coordinates are mostly approximate**, and most countries' figures for 1980–1999 are estimates, good for trends only.
- Farm-level coverage and items still to verify by country: [data-coverage.en.md](./data-coverage.en.md); removed or corrected records: [data-cleanup.en.md](./data-cleanup.en.md).

## 11. Frequently asked

- **Search found it, but it says "not on the map for this year"?** The timeline is before the farm was finished; press "Go to the latest year".
- **The globe stays blank or is slow?** The first visit downloads a few MB; reload once. Older devices without WebGL get the bar race instead.
- **The Taiwan live time has not moved for a long time?** Taipower's data or the site's schedule may have stopped. The site shows no error, only the last data it got; please report it on [GitHub](https://github.com/dofliu/windfarmTaiwan/issues).
- **Why is there no photo or summary for a farm?** Photos are used only when hand-checked and freely licensed; when Wikipedia has nothing, or you are offline, only the links show.
- **Found a data error?** "⚑ Report a data error" at the bottom of a farm card opens a pre-filled GitHub issue, or report it directly on [GitHub](https://github.com/dofliu/windfarmTaiwan/issues).
