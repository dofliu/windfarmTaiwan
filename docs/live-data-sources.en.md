# Live wind generation data in other countries: feasibility

English (this page) ｜ [中文](./live-data-sources.md)

> Every public endpoint below was called with `curl` on 2026-09-26 (10:40–11:02 UTC), sending
> `Origin: https://dofliu.github.io` to check whether a browser could read it directly (CORS). No
> account was registered and no key was used (except the US EIA's public test key `DEMO_KEY`). Items
> that could not be verified are listed in the last section. When the national totals were added on
> 2026-10-10, the UK, German, French, Danish, Texas and California endpoints were tested again and their licences checked.

## Current status (updated Oct 2026)

**Integrated (per farm)**: Australia's NEM (AEMO), Alberta (AESO) and Ontario (IESO), fetched about every 2 hours by
`intl_wind_scraper.py` into `data/live/intl_realtime.json`.

**Integrated (totals only, v2.31.0; Belgium and Poland v2.32.0; Ireland, Northern Ireland and Korea v2.33.0; Brazil v2.34.0)**: wind output for Great Britain, Northern Ireland, Ireland, Germany, France, Denmark, Belgium, Poland, Korea and Brazil as a whole and for the
Texas (ERCOT) and California (CAISO) grids, from the same script and in the same commit, under `nat` in the same file.
Each source keeps its latest value (time, MW; onshore/offshore for Germany, France and Denmark) and the mean of every hour
over the past 48 hours. ERCOT also keeps the month's wind capacity from the same dashboard and Belgium Elia's monitored capacity, and only
these two get a "percent of capacity" in the country profile; the other sources have no capacity on the same footing, so no percentage is shown.
When a source fails, its previous values are kept and marked `ok: false`.

| Key | Source | Coverage and caveats | Resolution · delay seen (10 Oct) |
|---|---|---|---|
| GB | Elexon BMRS `FUELINST` (`fuelType=WIND`) | Wind metered by the grid operator in Great Britain (not Northern Ireland); most turbines on the distribution network have no operational metering ([UK energy department, 2012](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/65923/6487-nat-grid-metering-data-et-article-sep12.pdf): "generation units connected to the low voltage distribution system ("embedded" generation) are excluded from operational metering"), so it is below total GB output; onshore and offshore are not split | 5 min · about 5 min |
| DE | SMARD `chart_data` (onshore 4067, offshore 1225, `quarterhour`) | All of Germany. Values are energy per 15 minutes (MWh): the four quarter-hours of an hour add up to the hourly file's value, so × 4 gives average power (MW). One file per week; across a week boundary the previous week is read too | 15 min · about 45 min |
| FR | ODRÉ `eco2mix-national-tr` (`exports/json`) | RTE's real-time data; the dataset description says telemetry is completed with estimates ("complétées par des forfaits et estimations") and later replaced by settled figures; 50,000 API calls per user per month (the site makes 12 a day) | 15 min · about 15 min |
| DK | Energinet `PowerSystemRightNow` | DK1 + DK2, onshore and offshore separately | 1 min · about 1 min |
| ERCOT | `ercot.com/api/1/services/read/dashboards/fuel-mix.json` | ERCOT serves about 90% of Texas load ([About ERCOT](https://www.ercot.com/about): "about 90 percent of the state's electric load"); only yesterday and today, so earlier hours carry over from the previous file. It occasionally answers 403; the script waits 10 seconds and retries once | 5 min · about 5 min |
| CAISO | `caiso.com/outlook/current/fuelsource.csv` + `outlook/history/DATE/fuelsource.csv` | CAISO serves about 80% of California's demand ([CAISO Key Statistics, Oct 2024](https://www.caiso.com/documents/key-statistics-oct-2024.pdf): "Serve ~80% of California demand"); the file has local times only, converted from Pacific time | 5 min · about 5 min |
| BE | Elia Open Data `ods086` (near real-time) + `ods031` (historical), `exports/json` | All of Belgium: offshore (Federal) and onshore in Flanders and Wallonia, each split into transmission and distribution grid, so 5 rows per slot; a slot is summed only when all five are there. The field is "Measured & upscaled": monitored farms measured and scaled up to the whole fleet; the "monitored capacity" adds up to about 6.0 GW and the country profile uses it for the percentage. The near-real-time set only holds today, so earlier slots come from the historical set (same 5 rows) | 15 min · about 25 min |
| PL | `www.pse.pl/transmissionMapService` behind PSE's homepage map "Mapa KSE" (now) + `his-wlk-cal` on `api.raporty.pse.pl` (trend) | The current value is the map widget's data endpoint (onshore and offshore wind; undocumented, may change), a single snapshot with no history. The report API's actual wind (`wi` = "Sumaryczna generacja Źródeł Wiatrowych / Total generation of Wind Sources", see [EndpointsMap.pdf](https://api.raporty.pse.pl/EndpointsMap.pdf)) is published the next day around 00:52 UTC, so the trend uses it up to yesterday (`dtime_utc` is the end of the slot) and only this site's snapshots, about every 2 hours, for today; the API's other endpoints with wind fields are forecasts or day-ahead plans | snapshot · about 1 min (official trend values one day later) |
| IE, NI | EirGrid Smart Grid Dashboard `smartgriddashboard.com/api/chart/?region=ROI\|NI&chartType=wind&dateRange=day&areas=windactual` | The Republic of Ireland (ROI) goes in Ireland's profile and Northern Ireland (NI, the SONI area) in the UK's (the Great Britain figure leaves Northern Ireland out); all-island (ALL) = ROI + NI. The values are EirGrid's estimate of all wind farms' output ([wind page](https://www.smartgriddashboard.com/all/wind/): "Wind Generation is an estimate of the total electrical output of all wind farms on the system"). The page's undocumented data endpoint (EirGrid has replaced it once); times are Irish local time without a zone, and whether they mark the start or end of an interval or an instant is not stated; one call can return several days, and three days cover 48 hours. No capacity on the same footing (the annual report's two regions have different dates), so no percentage | 15 min · about 2–6 min |
| KR | KPX `powerSource.es?mid=a10404030000&device=chart&view_sdate=…&view_edate=…` | South Korea, nationwide 5-minute instantaneous values (the page says "실시간 전력수급현황은 5분주기 순시자료 입니다"; wind listed separately since 23 Nov 2024), embedded in the page as `var ictArr = [...]`; a date range returns three days in one call (about 1.3 MB). KPX says it restricts overseas IPs; both this environment and GitHub Actions reach it (confirmed 10 Oct 2026); the two capacity series disagree, so no percentage | 5 min · about 4–7 min |
| BR | `tr.ons.org.br/Content/Get/Geracao_SIN_Eolica` behind ONS's "Energia Agora" page | Wind output of Brazil's National Interconnected System (SIN) every minute, mostly in the Northeast; the page says that since 2 March 2021 it includes "usinas não supervisionadas e sem relacionamento com o ONS". Google Charts format (minute index, MW) holding only the current day in Brasília time (UTC−3), so the 48-hour trend is built up run by run (the last hour or so before midnight may be missing); earlier values of the same series are on the open-data portal as `balanco-energia-subsistema` (hourly, about 30 hours behind). The open data's 33.8 GW of wind covers ONS-dispatched plants only, a different scope from the live value, so no percentage | 1 min (batches about every 9 min) · up to about 15 min |

- **On the globe**: the profiles of the UK (with Northern Ireland), Ireland, Germany, France, Denmark, Belgium, Poland, Korea, Brazil and the US get a "now" box (current value,
  onshore/offshore, 48-hour trend, coverage note, attribution and links); the world and continent profiles get a
  "Wind output right now" list (with Taiwan, Australia and Canada), sorted by output and not summed; a name opens that country's profile.
  The "Live data" toolbar layer (v2.35.0) colours countries by these sources: solid teal where they cover the whole country, violet hatching with the reason where they cover only part
  (the UK, the US, Australia, Canada); France is coloured on the mainland only. Since v2.36.0 only the covered states or provinces of the US, Canada and Australia are coloured
  (`REGIONS` in `tools/build_live_regions.py` gives each state's source key).
- **Belgium and Poland licences (checked 10 Oct 2026)**: see "Licences found" below. Poland's current value comes from an
  undocumented web endpoint, which the site says; if it stops working, the previous value is kept and shown as delayed.
- **File size**: `intl_realtime.json` grew from about 18 KB to about 25 KB (hourly means stored as whole MW, a start time plus an array).

- **On the globe**: country profiles show each grid's current total and a 48-hour trend; matched farms show
  their current output in the card, the tooltip and the farm list. With the timeline at the latest year these
  farms get a green ring and their rotors spin with their current output.
- **Unit mapping** (`data/live/units.json`, built by `tools/build_live_units.py`):
  - Australia: 104 of 108 wind units are matched to farms.
  - Alberta: 49 of 50.
  - Ontario: all 45, checked by hand against the facility names on IESO's "Transmission-Connected Generation" page.
  - Unmatched units only count toward the grid total: the Elaine, Yawong and Forty Mile Bow Island farms are missing from
    the data, and Golden Plains West is the under-construction whole-project record.
- **Attribution**: AEMO is credited as the source; AESO's copyright notice is shown and its data is used for
  non-commercial, educational purposes without modification; IESO's required copyright notice is shown in full.
  The credits for the national totals (Elexon, SMARD, ODRÉ, Energinet, ERCOT, CAISO) are listed under "Licences found"
  below; the site shows them next to the values and in the Sources dialog.

## Conclusion

Yes, but only a few places match Taiwan's "per wind farm, close to real time":

- **Australia's eastern grid (NEM)**: about 100 wind farms, measured output (SCADA) every 5 minutes,
  about 4 minutes behind, no key. The closest match to Taipower's setup.
- **Alberta and Ontario, Canada**: about 50 farms in Alberta (a snapshot about 1 minute old) and 45 in
  Ontario (hourly), no key.
- **United Kingdom**: about 290 wind units. The *planned* output of each unit is published live, but
  *metered* output only about two weeks later, so live per-farm figures can only be estimates and must
  be labelled as such.
- **Eight Dutch offshore farms** (NED) and **European units of 100 MW or more** (ENTSO-E): both need a
  free key and can only be fetched server-side (GitHub Actions); ENTSO-E per-unit data is published up
  to 5 days later.

Most other countries publish **national or regional** live totals only (one value every 1–15 minutes):
the UK, Germany, France, Belgium, Poland, Denmark, Ireland, Texas and California in the US, Brazil,
Japan's grid areas and South Korea. No usable public live data was found for China or India.

## Per-farm sources (can light up individual farms on the globe)

| Region | Source | Wind units | Resolution · delay | Key | Browser-readable | Unit IDs and mapping |
|---|---|---|---|---|---|---|
| Australia NEM | AEMO NEMWeb `Reports/Current/Dispatch_SCADA/` (zip) | 109 in the registration list (15.1 GW), 96 in the latest file | 5 min · ~4 min | none | no (zip; needs Actions) | DUID (e.g. `MACARTH1`); AEMO's registration list has name, region and capacity but no coordinates |
| Western Australia | AEMO WA `facilityScada` (JSON) | 17 farms | 5 min · next day | none | yes | — |
| Alberta | AESO Current Supply Demand report (HTML) | 50 | snapshot · ~1 min | none | no | asset codes (e.g. `BSR1` = Blackspring Ridge), names in AESO's Asset List; no coordinates. Only plain http worked here (https failed through this environment's proxy; to be rechecked from Actions) |
| Ontario | IESO `GenOutputCapability` (XML) | 45 | hourly · ~15 min | none | no | identified by name; no coordinates |
| United Kingdom | Elexon Insights: `PN` (planned output) + `BOALF` (dispatch instructions) + `FUELINST` (national measured) | 287 BMUs (~31 GW) | planned output per minute; metered `B1610` documented as D+5, but the newest data on 26 Sep was from 12 Sep | none | yes | BMU (e.g. `T_HOWAO-1` = Hornsea 1A); the OSUKED Power-Station-Dictionary (MIT) links them to WRI GPPD / REPD / Wikidata for 228 of 287 (missing Dogger Bank, Neart na Gaoithe, Moray West) |
| Netherlands | NED API | 8 offshore farms | 10 min · delay to be tested | free key | yes | point IDs 28–31 and 33–36 (Luchterduinen, Prinses Amalia, Egmond aan Zee, Gemini, Borssele I&II, Borssele III&IV, Hollandse Kust Zuid, Hollandse Kust Noord) |
| Europe | ENTSO-E Transparency Platform 16.1.A | units of 100 MW or more | per unit up to D+5 | free token (register, then request by email) | no (403 for browser origins) | EIC codes; JRC-PPDB-OPEN links them to coordinates (contents not checked) |
| Island of Ireland | SEMO daily metered report (XML) | 350 units (no list of which are wind was found) | 30 min · next day | none | yes | `GU_` codes |
| Brazil | ONS open data (CSV) | ~168 wind rows per hour (mostly farm clusters) | hourly · 1–2 days | none | no | cluster codes `CJU_…`, ANEEL `ceg` |

In the UK, planned output is not actual output: at 10:30 UTC on 26 Sep the planned output of all wind
units summed to 8.75 GW while measured national wind was 6.0 GW; applying the dispatch instructions
(BOALF) gives 6.9 GW. UK per-farm figures can therefore only be estimates.

Japan's OCCTO per-unit disclosure only covers units of 100 MW or more whose owners opt in, published the
next day; Hokkaido's per-unit file checked here contained no wind units.

## National / regional live totals

| Region | Source | Scope | Resolution · delay | Key | Browser-readable |
|---|---|---|---|---|---|
| United Kingdom | Elexon `FUELINST` | national | 5 min · ~5 min | none | yes |
| Germany | SMARD (onshore 4067, offshore 1225) | national + 4 TSO areas | 15 min · 30–45 min | none | yes |
| France | RTE éCO2mix (ODRÉ) | national, 12 regions | 15 min · ~30 min (regions ~1 h) | none | yes |
| Belgium | Elia `ods086` | offshore, Flanders, Wallonia | 15 min · ~30 min | none | yes |
| Poland | PSE `api.raporty.pse.pl` | national | 15 min | none | yes |
| Brazil | ONS live (undocumented endpoint) | national, subsystems | 1 min · up to ~15 min | none | yes |
| Denmark | Energinet `PowerSystemRightNow` | national, DK1 / DK2 | 1 min · ~1 min | none | no (returns empty data when the site's Origin is sent) |
| Ireland | EirGrid Smart Grid Dashboard (undocumented endpoint) | all-island, Republic of Ireland, Northern Ireland | 15 min · ~2–6 min | none | no |
| Texas, US | ERCOT `fuel-mix.json` | whole system | 5 min · ~2 min | none | no |
| California, US | CAISO `fuelsource.csv` | CAISO area | 5 min · ~5 min | none | no |
| Japan | grid operators' supply–demand results (e.g. Tohoku, Hokkaido) | grid area (wind and wind curtailment) | 30 min · ~20 min | none | no; TEPCO returned a CDN 403 |
| South Korea | KPX web table | national | 5 min · ~2 min | none | no (HTML) |
| US balancing areas | EIA-930 | per balancing authority | hourly · newest value ~31 h old | free key | yes → not live |
| China, India | — | China: monthly statistics only; India: `grid-india.in` unreachable | — | — | — |

## Aggregators

- **Electricity Maps**: needs a token; the free tier is personal and non-commercial, one zone and
  50 requests an hour — not suitable for a public site.
- **Ember**: needs a key and has monthly and yearly data only. Good for metrics such as wind's share of
  generation, not for live data.
- **Open Electricity** (Australia): the data is licensed CC BY-NC (non-commercial).

## Licences found

- Elexon BMRS licence: commercial use allowed, crediting "Contains BMRS data © Elexon Limited copyright and database right [year]" with a link to the licence where possible
- AEMO: any use, with attribution
- Energinet, SMARD: CC BY 4.0 (credit "Source: Energinet (www.energidataservice.dk)" and "Bundesnetzagentur | SMARD.de"; changes must be indicated, so the site says the hourly means are its own)
- ODRÉ: Licence Ouverte 2.0 (credit the source and the data time)
- ERCOT: raw data from public parts of the site may be used in compilations, charts and analyses ([terms](https://www.ercot.com/help/terms): "raw data provided in public portions of this website may be used, reproduced, and redistributed in compilations, charts, and analyses")
- CAISO: may be used if copyright and other notices are kept and the California ISO is credited ([terms of use](https://www.caiso.com/privacy-terms-of-use))
- Elia: the datasets carry the "Elia Open Data Licence", whose [licence page](https://opendata.elia.be/pages/licence/) says "The data provided for are governed by Creative Commons Attribution 4.0 International Public License" (CC BY 4.0, under Belgian law with disputes before the Brussels courts; the page is built by JavaScript and the text is in its source). Credit Elia, link the licence and note the site's sums and means
- PSE: the [conditions for reusing public-sector information](https://www.pse.pl/bip/ponowne-wykorzystanie-informacji-publicznej) (set in 2016 under the public-sector information reuse act then in force) cover information published on www.pse.pl: free, for commercial or non-commercial use; credit "Informacja pozyskana ze strony www.pse.pl" with the retrieval date, remove the PSE logo, say when and how the data was processed ("przetworzona w całości/w części") and do not mislead. The current-value endpoint is on www.pse.pl; the report API is on `raporty.pse.pl`, which pse.pl's data page names as the new home of its reports, but the conditions do not name that subdomain
- ONS: every open-data portal dataset is marked "Licença Creative Commons Atribuição" (CKAN `license_id` `cc-by`; the AWS open-data registry says CC BY 4.0), and the [dataset page](https://dados.ons.org.br/dataset/balanco-energia-subsistema) allows distributing and modifying "desde que seja dado o crédito apropriado ao criador(ONS) e que informe quais alterações foram feitas"; the portal describes itself as offering "dados históricos". The ONS website and the "Energia Agora" live data carry no terms of use or licence, only "© - Copyright - ONS", and nothing forbidding reuse or automated access; as for Korea, the site relies on the same series being published under CC BY on the open-data portal, crediting ONS and its own calculations
- IESO: use and reproduction allowed with IESO's required copyright notice on every reproduction ([terms of use](https://www.ieso.ca/Terms-of-Use))
- AESO: non-commercial, personal or educational use only, unmodified, with copyright notices kept ([legal](https://www.aeso.ca/legal/))
- EirGrid (with SONI): the Smart Grid Dashboard's [Open Data Licence](https://www.smartgriddashboard.com/all/open-data-license/) covers the dashboard data: "You are free to: copy, publish, distribute and transmit the Information; adapt the Information; exploit the Information commercially and non-commercially"; credit "Supported by EirGrid Group Data", use no logos and imply no endorsement; EirGrid may limit access when use is excessive and may revise the licence without notice. The eirgrid.ie and SONI websites carry their own "no reproduction without written permission" notices, but the licence names "Smart Grid Dashboards" and "SONI Libraries"
- KPX: the KPX page has no licence of its own, only a footer "ALL RIGHTS RESERVED"; the same series (5-minute generation by source, wind `fuelPwr9`) is listed on the [public data portal](https://www.data.go.kr/data/15142651/openapi.do) as "이용허락범위 제한 없음" (no restriction on use), KPX's open-data page defines opening as granting the right "영리적·비영리적으로 이용할" (to use commercially or non-commercially), and Article 3(3)–(4) of Korea's Public Data Act bars public bodies from restricting the use, including commercial use, of data they publish. robots.txt is `Allow: /`. The official API needs a portal key, which was not requested
- Japan's grid operators (checked 10 Oct 2026): the site terms of Hokkaido, Tohoku, Hokuriku, Kansai, Chugoku and Shikoku all say that, beyond private use and what copyright law allows, copying, transmitting or distributing needs prior consent (Kansai even for links); Chubu bans any secondary use beyond private use; Kyushu also bans automated retrieval ("スクレイピング等") unless permitted in advance; TEPCO's and Okinawa's terms pages are blocked by their CDNs here and were not read. OCCTO's site terms allow free use with credit and a note of any processing, but OCCTO does not publish wind output by area. So Japan stays out; adding it means asking Hokkaido, Tohoku, Kyushu and others for consent first
- NED, SEMO: not found yet

## Suggested order of integration

1. **Australia NEM (AEMO Dispatch_SCADA)**: the closest match to Taipower — about 100 farms, measured
   every 5 minutes, no key, attribution only. How: Actions reads the folder listing, unzips the newest
   file, keeps the wind units and writes `au_realtime.json`.
2. **Alberta + Ontario**: per farm, no key, about 95 farms together. Actions parses AESO's HTML and
   IESO's XML.
3. **United Kingdom**: take the planned output (PN), apply the dispatch instructions (BOALF), then scale
   to the measured national total (FUELINST) and label it "estimate". No key.
4. **Dutch offshore (NED) or ENTSO-E per unit**: needs a free key (stored as a GitHub secret) and a
   server-side fetch; the actual delay still needs testing.

**Quick win**: a national "wind output right now" panel. The UK, Germany, France, Belgium, Poland and
Brazil can be read straight from the browser; Denmark, Ireland, Texas, California, Japan and Korea need
Actions. → Done in Oct 2026 for the UK, Germany, France, Denmark, Texas and California (all through Actions, in the same
commit as the other live data), and Belgium, Poland, Ireland (with Northern Ireland), Korea and Brazil on 10 Oct 2026; Japan's grid areas need consent first (see "Licences found").

## Things to watch when integrating

- **No coordinates**: every per-farm source gives only unit codes or names, so a hand-maintained
  mapping table (unit code → farm in `wind_farms.json`) is needed — a few hundred rows in total.
- **Repo size**: a separate commit per country makes the git history grow faster. Fold
  new countries into the existing `scrape.yml` commit, or move to a Cloudflare Worker (option B in
  [DEPLOY.en.md](../DEPLOY.en.md)).
- **Keys**: sources that need registration or a key (ENTSO-E, NED, EIA) need the site owner's approval
  first; keys are stored as GitHub secrets, never in code.
- **Labels**: UK per-farm values must say "estimate"; sources a day or more behind (Brazil, SEMO in
  Ireland, Western Australia) must not be labelled live.
- **Single-file edition**: when online, it fetches these JSON files from the live site, like Taiwan's
  live data.

## Not verified

- ENTSO-E per-unit wind coverage and actual delay (no token)
- NED data contents and delay (no key)
- RTE per-unit data (needs OAuth)
- SMARD downloads for units of 100 MW or more (docs only)
- Spain's REE (WAF block), TEPCO (CDN block), India (unreachable), Chile's per-plant SCADA page
  (Cloudflare 403 and a TLS error)
- Lists mapping SEMO unit codes and Brazil's `ceg` codes to names and coordinates
- The licences of NED and SEMO; TEPCO's and Okinawa Electric's site terms (unreadable from here)
- Whether PSE's reuse conditions explicitly cover `raporty.pse.pl` (they only name www.pse.pl)
- The ~31-hour EIA delay and the ~14-day B1610 delay were each observed only once

## References

- [ONS open data: energy balance by subsystem (with wind)](https://dados.ons.org.br/dataset/balanco-energia-subsistema)
- [ONS Energia Agora](https://www.ons.org.br/paginas/energia-agora/carga-e-geracao)
- [Elexon BMRS data licence](https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/)
- [ENTSO-E: how to get a security token](https://transparencyplatform.zendesk.com/hc/en-us/articles/12845911031188-How-to-get-security-token)
- [ENTSO-E 16.1.A actual generation per generation unit](https://transparencyplatform.zendesk.com/hc/en-us/articles/16648326220564-Actual-Generation-per-Generation-Unit-16-1-A)
- [Energinet terms and conditions](https://www.energidataservice.dk/terms-and-conditions)
- [ODRÉ éCO2mix national real-time data](https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/)
- [ERCOT terms of use](https://www.ercot.com/help/terms)
- [CAISO terms of use](https://www.caiso.com/privacy-terms-of-use)
- [Elia Open Data Licence](https://opendata.elia.be/pages/licence/)
- [PSE conditions for reusing public-sector information](https://www.pse.pl/bip/ponowne-wykorzystanie-informacji-publicznej)
- [SMARD data use](https://www.smard.de/en/datennutzung)
- [AEMO copyright permissions](https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions)
- [Open Electricity](https://docs.openelectricity.org.au/introduction)
- [Electricity Maps free tier](https://ww2.electricitymaps.com/free-tier-api)
- [NED API handbook](https://ned.nl/nl/handleiding-api)
- [KPX open API](https://www.data.go.kr/data/15056640/openapi.do)
- [KPX 5-minute generation by source API (with wind)](https://www.data.go.kr/data/15142651/openapi.do)
- [EirGrid Smart Grid Dashboard Open Data Licence](https://www.smartgriddashboard.com/all/open-data-license/)
- [OCCTO per-unit generation disclosure](https://hatsuden-kokai.occto.or.jp/hks-web-public/home)
- [REE REData](https://www.ree.es/en/datos/apidata)
