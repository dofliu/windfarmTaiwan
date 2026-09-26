# Live wind generation data in other countries: feasibility

English (this page) ｜ [中文](./live-data-sources.md)

> Every public endpoint below was called with `curl` on 2026-09-26 (10:40–11:02 UTC), sending
> `Origin: https://dofliu.github.io` to check whether a browser could read it directly (CORS). No
> account was registered and no key was used (except the US EIA's public test key `DEMO_KEY`). Items
> that could not be verified are listed in the last section.

## Current status (updated Sep 2026)

**Integrated**: Australia's NEM (AEMO), Alberta (AESO) and Ontario (IESO), fetched every 15 minutes by
`intl_wind_scraper.py` into `data/live/intl_realtime.json`.

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
| Brazil | ONS live (undocumented endpoint) | national, subsystems | 1 min · ~2 min | none | yes |
| Denmark | Energinet `PowerSystemRightNow` | national, DK1 / DK2 | 1 min · ~1 min | none | no (returns empty data when the site's Origin is sent) |
| Ireland | EirGrid Smart Grid Dashboard (undocumented endpoint) | all-island, Republic of Ireland | 15 min · ~15 min | none | no |
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

- Elexon BMRS licence: commercial use allowed, with attribution
- AEMO: any use, with attribution
- Energinet, SMARD: CC BY 4.0
- ODRÉ: Licence Ouverte 2.0
- Elia: its own open-data licence
- ONS: Creative Commons Attribution
- IESO: use and reproduction allowed with IESO's required copyright notice on every reproduction ([terms of use](https://www.ieso.ca/Terms-of-Use))
- AESO: non-commercial, personal or educational use only, unmodified, with copyright notices kept ([legal](https://www.aeso.ca/legal/))
- EirGrid, NED, SEMO: not found yet

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
Actions.

## Things to watch when integrating

- **No coordinates**: every per-farm source gives only unit codes or names, so a hand-maintained
  mapping table (unit code → farm in `wind_farms.json`) is needed — a few hundred rows in total.
- **Repo size**: one more commit per country every 15 minutes makes the git history grow faster. Fold
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
- The licences of EirGrid, NED and SEMO
- The ~31-hour EIA delay and the ~14-day B1610 delay were each observed only once

## References

- [Elexon BMRS data licence](https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/)
- [ENTSO-E: how to get a security token](https://transparencyplatform.zendesk.com/hc/en-us/articles/12845911031188-How-to-get-security-token)
- [ENTSO-E 16.1.A actual generation per generation unit](https://transparencyplatform.zendesk.com/hc/en-us/articles/16648326220564-Actual-Generation-per-Generation-Unit-16-1-A)
- [Energinet terms and conditions](https://www.energidataservice.dk/terms-and-conditions)
- [SMARD data use](https://www.smard.de/en/datennutzung)
- [AEMO copyright permissions](https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions)
- [Open Electricity](https://docs.openelectricity.org.au/introduction)
- [Electricity Maps free tier](https://ww2.electricitymaps.com/free-tier-api)
- [NED API handbook](https://ned.nl/nl/handleiding-api)
- [KPX open API](https://www.data.go.kr/data/15056640/openapi.do)
- [OCCTO per-unit generation disclosure](https://hatsuden-kokai.occto.or.jp/hks-web-public/home)
- [REE REData](https://www.ree.es/en/datos/apidata)
