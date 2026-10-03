# To do · TODO

English (this page) ｜ [中文](./TODO.md)

Concrete, actionable tasks. Background, the reasons behind decisions and the phased plan are in
[ROADMAP.en.md](./ROADMAP.en.md).

## In progress (hand-off, 2026-09-30: GEM 2026-02 upgrade done, project stays in maintenance)

Read this section first in a new session (see section 8 of CLAUDE.md); when you stop, rewrite it for the next piece of work in progress and move
finished items to the topic lists below.

### Where things stand

- Since 27 Sep 2026 (v2.11.1) the project is paused: the main features are finished, the owner decided not to add new features, and the
  project is in maintenance (what is done: "Current status" in [ROADMAP.en.md](./ROADMAP.en.md)).
- The automatic updates keep running; the `keepalive` workflow re-enables the schedules every month so GitHub does not disable them after
  60 days without activity. Still **check once a month** that the data time and Actions look right (steps under "Maintenance" in
  [DEPLOY.en.md](./DEPLOY.en.md)): when fetching fails the site shows no error, only the last data it got.
- **The events layer is concluded (28–29 Sep 2026, v2.12.0–v2.12.4)**: the Events layer was added from the owner's verified list (59 events),
  then a second batch of 29 events found by web search (WIND-060–088, 88 in all); every source of the second batch was checked with
  `tools/check_quotes.py` and the records corrected from the results (unverifiable figures removed; only the Maverick turbine make and the
  Screggagh wind speed remain marked "to be verified" in the CSV notes). The public single-file "Global wind map"
  (`standalone/windfarmTaiwan-globe.html`), the Mailiao event's farm link, fly-to-country for events without coordinates and the phone-width
  farm-card fix were added in the same series, and the whole site was tested. What remains is routine follow-up (linking farms, adding
  coordinates, photo rights, waiting for official findings), listed under "Major events & incidents" below; it is not work in progress.
- 30 Sep 2026 (v2.12.5–v2.12.6): compact phone layout; the quoted passages behind the five step-5 Chinese foundation rows and six clean-up
  rules are checked (checkable sources replace the unreachable CTG domains; Rudong H6 and H10 remain, see item 1 below); the Greater Changhua
  2b & 4, Hai Long and Taipower phase 2 timelines follow the July–September 2026 reports; the long-term archive is split by month and the
  single-file builds go to a Release.
- 30 Sep 2026 (v2.13.0): the farm layer moved to GEM 2026-02 (GeoJSON), 25,975 records; the clean-up rules were checked one by one against
  the new release (13 deleted, 4 renamed, 8 merge rules added); "expected year passed but still in the pipeline" fell from 583 projects to 2,
  and the project-level pipeline and the country totals are the same release. Differences found during the upgrade and kept as the site's
  own list for now are item 2 below.
- 2 Oct 2026 (v2.13.6, v2.14.0): the sources dialog gained a data inventory; first step of the visual upgrade: close-up turbines carry a base drawn
  to the foundation type (yellow transition piece) and the farm card shows a schematic cross-section. Follow-ups agreed with the owner, one PR
  each: (1) a stacked chart of offshore capacity added per year by foundation type in the Overview tab — **done (v2.15.0)**; (2) a foundation chapter in the Learn section
  and port-to-farm arcs — **done (v2.16.0)**; (3) a check of the data anomalies found in the step-5 sweep — **done (v2.16.1; open items under item 4)**; (4) water-depth, hub-height and rotor-diameter
  fields with the cross-section and close-up drawn to scale — **done (v2.17.0)**.
  Still missing after the fifth round (v2.17.6): of the 236 operating offshore farms, 234 have at least one value (depth 213, hub height 174,
  rotor diameter 222, all three 168). Two have none: Dongtai Zhugensha H1 (Guohua Dongtai phase 5, 50 × 4 MW) and Vietnam's Ben Tre 10; 62 lack a hub height.
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
- No code change was left half-done; below is the work to pick up, in order of priority.

### First things to do when work resumes (in order)

1. **The two step-5 rows that still cannot be checked**: the sources for Rudong H6 (100 turbines, all monopiles) and H10 (77 monopiles +
   23 all-steel single-column buckets) are only CTG's own pages and a Maritime Safety Administration notice; from the checking environment the
   TLS connection to eps/www.ctg.com.cn is cut and the MSA page returns 403 (30 Sep 2026). Run `tools/check_quotes.py` on them from a network
   that can reach them. Also only on CTG pages: "280 MW, fully connected March 2021" for Xinghua Bay phase 2 and the later 20 MW prototype at
   Liu'ao phase 2 (both already dropped from the notes).
2. **Differences from GEM 2026-02**: checked one by one on 3 Oct 2026 (v2.17.7) and written into `farm_cleanup.py`; still to follow:
   - Taiwan: Youde (Shinfox, 700 MW) — in August 2026 the Energy Administration said its termination was being processed — and Huanyang
     (EDF's Wei Lan Hai Changhua), also in termination, move to `PIPE_DROP` once that is final; Youde keeps GEM's point (near the Changhua
     coast; the site is about 38 km offshore) until a site coordinate is found. Haiding 3 (GEM's Formosa 3 · 3, 720 MW, announced) still
     lists JERA as owner; to check.
   - Korea: Jwasari still has no construction start or auction award; waiting for construction evidence. Its point now sits on Jwasari-do
     off Tongyeong (approximate) until a site coordinate is found.
   - Norway's Sørmarkfjellet: whether every turbine was back in service in 2026, and the cause of the March 2025 blade failure, have not
     been published by the owner.
   - Next GEM release: build with `CLEANUP_LENIENT=1` first to see the new names, then rewrite the rules one by one; 2026-02 has no retired
     year, and `sources/gem_retired_years_2025-02.json` only covers phases retired by 2025-02.
3. **Time-sensitive checks (one round done on 30 Sep 2026)**: Greater Changhua 2b & 4 was completed on 1 Sep 2026 and is in final
   commissioning, not yet fully operating; Hai Long stays at 2027 per Northland's Q2 report; Taipower phase 2 has Taipower installing the
   turbines itself, aiming for grid connection by the end of 2026. Next checks are under "Re-check periodically" below.
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
     see the 2026-10-03 block of `docs/data-cleanup.en.md`). Still open for a next round: the status of CGN's Xiangshan Tuci 280 MW (EIA in 2022,
     still tendering storage EPC in 2025, no construction or grid report found); (CTG's Pingtan Waihai, GCL's Rudong H13 and Longyuan's
     Guoneng Gongxiang were added in v2.17.2); GEM's "Shandong Bohai B1" says 500 MW but the Bozhong B1 tender was 100 MW; the curated "CGN Jiaxing 2
     (Zhoushan Daishan 4)" 300 MW does not match Daishan 4's 234 MW; the curated "Guohua Rudong H14" 300 MW matches no Rudong site (Luneng's H14
     is 200 MW); "Jiangsu Dafeng H10 (Guoxin)" may overlap the curated "Guoxin Dafeng 850 MW"; the Chinese name of "Zhoushan Liuheng / Zhejiang
     others" includes Jiaxing 2 and may double-count it; "Shandong Haiwei Peninsula South U" may be U1 phase 2; the year of Binhai South H3
     (2020?); Vietnam: whether Tan An 1's 2021–2025 phase (45 MW) is operating, and Hoa Binh's owner and turbines (Vestas). Peninsula South U2 is
     now represented by GEM's 603.5 MW under-construction record; its 36 connected phase-1 turbines could become a phase.
   - Mixed farms still without per-type counts: Xiangshui and Yangjiang Shapa phases 1–5; farms that only say "fixed": Fuqing Xinghua Bay
     and Qingzhou 6. Leads are in `tools/research/cn_mixed_2026-09.json` (Shapa phase 1's 39 monopiles / 10 jackets / 3 + 3 suction buckets
     appear only in a secondary article and are unchecked; phases 2–5 only have provisional tender numbers); add them once a first-hand
     source is found (for example CTG completion records the owner may have).
   - The other Chinese offshore farms (82 of the 140 operating) and Vietnam (28 farms, mostly intertidal; the owner's workbook only says
     intertidal / nearshore, no sub-type) are still "type unknown".
   - Same route as the first four steps: research notes in `tools/research/` (a quoted passage for every source, checked with
     `python3 tools/check_quotes.py file.json`, using only OK results) → rows in `tools/farm_foundations.py` with `F5(...)` (the count of
     Chinese farms in the docs is computed) → data problems found on the way into `tools/farm_cleanup.py` → rebuild and checks → site text
     (`fdStep` and the sources dialog in `assets/js/globe.js`, `assets/js/learn.js`) → the version number and both changelogs → Playwright
     at desktop and phone widths, the single-file copy online and offline → delete the notes in `tools/research/` once they are in the table.
5. **Two Danish foundation types to verify**: this site follows OSPAR (DK23, DK04) and lists Nissum Bredning Vind and Rønland as
   gravity-based; the owner's workbook cites Boundary Layer, which says jackets with concrete transition pieces and piled concrete
   foundations. Boundary Layer is ODbL (share-alike), so use it only as a lead: find a developer or Danish Energy Agency source before
   changing anything.

## Major events & incidents (data/global/sources/events_2026-09.csv → tools/build_events.py, 2026-09-28)

- [ ] Adding an event: add a row to the CSV (same columns) → add the English title, summary, area and notes to `EN` in
      `tools/build_events.py` and any matching farm to `FARMS` (exact name from `wind_farms.json`) → `python3 tools/build_events.py` →
      version and both changelogs. The build checks that every event has English text and that farm names match.
- [x] Second batch (WIND-060 to 088) checked source by source with `check_quotes.py` on 2026-09-29 (all 54 sources OK; corrections in
      CHANGELOG v2.12.3). The four details that were only in the notes (Lemnhult date, Delta 6 date, Maverick farm name, Screggagh root cause)
      were checked against openable sources in v2.12.4; still unchecked and kept only in the notes: the Maverick turbine make (GE, KFOR 403)
      and the Screggagh wind speed of 9–10 m/s (E&T 403).
- [ ] 14 events not yet linked to a farm: WIND-001 Crotched Mountain, WIND-008 Kunimidake (the layer only has the 2027 project), WIND-010 and
      WIND-084 (grid-wide events), WIND-079 Rei dos Ventos (park 3; the layer only has park 1), WIND-034 Ocean Wind 1/2 (cancelled), WIND-045 Rokewood (no official site name in the source), WIND-063
      Miyakojima 2003 (the layer's two records are a later batch from 2007/2008), WIND-064 the Awaji park turbine, WIND-065 Hornslet, WIND-068
      Haltern AV9 (the layer's Haltern Ennenberg is a different park), WIND-080 Delta 6, WIND-085 Wenchang (cannot confirm which record),
      WIND-088 (the reports do not name the farm). Add to `FARMS` when found; never guess.
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
- [ ] Greater Changhua 2b & 4 (Ørsted, 920 MW): completion ceremony on 1 Sep 2026, now in O&M with final commissioning and testing under
      way, full commercial operation once approvals are in (cnyes); when Ørsted announces it, set the last `tl` row of `id:"wo4"` / `id:"wonan"`
      to done and `cod` to the month (events list WIND-059: completion
      ceremony on 2026-09-01, the English notice says final commissioning is pending; WIND-050: the 2b export cable was damaged in 2025-08;
      WIND-058: one 14 MW unit of phase 4 caught fire on 2026-08-08)
- [ ] Hai Long (Hai Long B): Northland's Q2 2026 report (12 Aug 2026): 71 of 73 turbines installed, 59 generating, commercial operation
      in 2027; follow the Q3/Q4 reports and the commercial-operation announcement and update `id:"longB"`
- [ ] Left to verify from foundation step 4 (Sep 2026): when Setana stopped generating (the town decided in April 2026 to
      remove it in FY2027); whether Formosa 1 Phase 1 has SWT-4.0-120 or -130 turbines; whether Choshi still runs after
      2025; the present state of the Jeju Woljeong test site (its 2 MW unit has been idle since June 2016); and a possible
      Doosan 3 MW turbine on a suction bucket at Gunsan, Korea (2017; RVO lists it as a test turbine installed on land)
- [ ] Points that are still approximate (Sep 2026): Jeonnam Offshore Wind 1 (about 9 km north-west of Jaeun-do), the 15
      intertidal turbines of Yeonggwang Wind (GEM's point is the company address), Kamisu Phases 1 and 2 and Eurus Akita
      Port (moved to the turbine positions in OpenStreetMap), and Sunrise Wind (the centre of its BOEM lease area)
- [ ] When the timeline reaches 2026, update the status and year of each farm: Kitakyushu Hibikinada (operating from March
      2026), Yeonggwang Nakwol (planned for December 2026), Vineyard Wind 1 (completed March 2026, commercial operation
      April 2026 but below full capacity) and Revolution Wind (commercial operation expected during 2026); the CVOW
      commercial project, Sunrise Wind and Empire Wind are due in 2027
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
- [x] The 12 countries whose farm sum was above 110% of the national figure: after GEM 2026-02 there are 5 — Chile, Morocco and Ethiopia
      (farms connected in 2025 that IRENA's 2025 figures do not count yet), the Philippines (Pagudpud) and Iran
- [x] Duplicates found while adding live data: Whitla (Alberta), Snowtown, Bluff Point (Tasmania) and
      Yambuk (Victoria)
- [x] Shared coordinate points: the map fans the farms out around the point and their cards say the
      position is schematic (`flags` 4)
- [ ] 130 shared coordinate points remain (1,310 operating farms, mostly province-centre placeholders in
      China): add real coordinates from a newer GEM release or local data
- [ ] Items the clean-up could not find or confirm: whether Iran's Tizbaad (99 MW) and Aqkand (50 MW) are
      operating (SATBA data); China's curated "CGN Taizhou 1" (300 MW; no CGN offshore project in Taizhou
      was found) and "Guoxin Sheyang H1" (300 MW; Sheyang H1 is Huaneng's), and GEM's Sheyang South H5
      (400 MW, possibly not yet operating); Vietnam's Song An (46.2 MW, no commissioning found); the
      repowering history of Kemi Ajos in Finland; why the Dominican Republic is about 50 MW below IRENA
- [ ] Farms missing from the data (found while checking): Hanuman 10 in Thailand (80 MW), Lạc Hòa 2
      (123.6 MW) and the other 105.5 MW of Chơ Long in Vietnam, Pantelimon in Romania (123 MW), Carreto in
      Colombia (9.6 MW, 2025)
- [ ] 10 "suspected duplicates B" remain (different names, same capacity, close by), e.g. Solano / Shiloh
      and Big Smile / Dempsey Ridge in the US, Dreiberg / Druiberg in Germany: confirm pair by pair
- [x] 587 pipeline projects whose expected year had already passed (101 GW): only 2 remain after GEM 2026-02 (Monsoon in Laos, 600 MW,
      and BPP Vĩnh Châu in Vietnam, 30 MW, both under construction and expected in 2025)
- [ ] 48 GW of operating farms have no commissioning year (mostly in China and India), so the map can
      only show them from 2025: add years where they can be found
- [ ] Large countries with low coverage (after GEM 2026-02: China 98 GW short, Germany 27 GW, India 16 GW): assess filling
      the gap from national registries (see phase 1 in the ROADMAP)
- [x] Duplicate farm records: the US Sunrise Wind appeared both as GEM's "Sunrise wind farm (United States)" and as "Sunrise Wind" from the 2026 compilation (both 924 MW, under construction); merged into one record in foundation step 4, at the centre of BOEM lease OCS-A 0487 (Sep 2026, v2.10.0)
- [x] Two Dutch duplicates (found while matching foundations): Borssele V and GEM's “Borssele Site V”, and Irene Vorrink and
      GEM's “Dronten”, were checked and merged (Sep 2026, v2.8.0)
- [x] Dogger Bank pipeline projects: GEM 2026-02 lists phases B and C together as one record under construction (2026), so the list's B and C
      are in `PIPE_DROP`; D and the two Dogger Bank South projects are mapped explicitly (`PIPE_SAME`), and the matcher now lets only the
      first list project update a given GEM record (v2.13.0)
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
- [x] English for the farm timelines on the Taiwan live page (Sep 2026, v2.10.1): each `tl` entry in `assets/js/live.js`
      is [date, Chinese, status, English]; write both languages when adding or changing one
- [x] English for the farm notes and spec fields on the Taiwan live page (developer, site, turbine model, water depth,
      distance from shore, annual output, homes supplied; Sep 2026, v2.10.1): `ZH_EN` in `assets/js/live.js` maps each
      Chinese string to English; add the English when adding or changing a Chinese value
- [x] English farm names on the Taiwan live page in the English interface (Sep 2026, v2.10.2): `NAME_EN` in
      `assets/js/live.js` holds [full name, short name]; add both when adding a farm
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
      semi-submersible (added in v2.17.2 at an approximate location; grid-connected June 2024, off Nanri Island, Putian, Fujian; [China Daily](https://fj.chinadaily.com.cn/a/202406/28/WS667e79dba3107cd55d269125.html),
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
- [x] Step 4: Taiwan, Japan, Korea and the USA: 36 farms (Sep 2026, v2.10.0)
- [ ] Step 5: China and Vietnam (the owner decided on 2026-09-27 to keep collecting step by step): 5 Chinese farms added (v2.11.0, v2.11.1); the rest is item 4 of "First things to do" at the top

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

- [x] Monthly keepalive workflow (`.github/workflows/keepalive.yml`, Sep 2026): re-enables the schedules through the GitHub API on the
      1st of each month so they are not disabled after 60 days without activity
- [ ] Check once a month that the data time and Actions look right, and trigger a run by hand if needed (steps under "Maintenance" in DEPLOY.en.md)
- [x] The long-term archive was split into monthly files on 30 Sep 2026 (`data/archive/wind_history_archive_YYYY-MM.json`), so the weekly
      backfill only rewrites the current month; the single-file builds now go to a Release instead of git

## Deferred — no need to research again (clear reasons in "Directions evaluated and deferred" in ROADMAP.en.md)

- Energy Administration monthly/annual statistics API (too coarse, overlaps existing data)
- Central Weather Administration buoy data (few buoys, most far from the farms, low benefit)
- Ministry of Environment offshore-wind ecological monitoring data (mostly unstructured PDFs, nothing
  machine-readable yet)
- Work-vessel status: live AIS positions and Taiwan International Ports Corporation port calls (the owner
  decided on 2026-09-27 not to do it)
