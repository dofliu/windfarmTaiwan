# 專案慣例 · Project conventions

給之後在這個 repo 工作的人與 AI（Claude Code 會自動讀這個檔）。
For people and AI agents working in this repo (Claude Code reads this file automatically).

## 1. 文件一律中英對照 · Documentation is always bilingual

- 每份說明文件都有中文版 `X.md`（台灣正體中文）與英文版 `X.en.md`，開頭互相連結：
  `[English](./X.en.md) ｜ 中文（本頁）`／`English (this page) ｜ [中文](./X.md)`。
  Every document has a Traditional Chinese `X.md` and an English `X.en.md`, cross-linked on the first lines.
- 修改文件時兩個版本在同一個 commit 一起更新，數字、步驟、連結要一致；新增文件時兩個版本一起新增。
  Change both versions in the same commit, keeping numbers, steps and links identical; add new documents in both languages.
- 由程式產生的文件（例：`docs/data-coverage*.md`、`docs/data-cleanup*.md`、`docs/foundations*.md`）由產生程式同時輸出兩種語言，不要手動改。
  Generated documents (e.g. `docs/data-coverage*.md`, `docs/data-cleanup*.md`, `docs/foundations*.md`) are written in both languages by their generator; do not edit them by hand.
- 網站介面文字也一律雙語：HTML 用 `data-l="zh"`／`data-l="en"`，JS 用 `WW.L(zh, en)` 或各模組的 i18n 字典。
  All UI text is bilingual as well: `data-l="zh"` / `data-l="en"` in HTML, `WW.L(zh, en)` or the module's i18n table in JS.
- 目前的文件 · Current documents：README、DEPLOY、ROADMAP、TODO、CHANGELOG、docs/data-coverage、docs/data-cleanup、docs/foundations、docs/live-data-sources。
  `CLAUDE.md` 本身以中英並列寫在同一個檔。This file itself keeps both languages side by side.

## 2. 版權與開發者 · Copyright and developer

- 國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室 ·
  National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu
- 出現在：頁尾、風電知識「資料來源與方法」的「關於本站」、地球儀「資料來源」視窗與地圖出處列、`<meta name="author">`、README。
  文字要一致；更改時全部一起改。
  It appears in the footer, the "About this site" block of the Sources chapter, the globe's sources dialog and
  attribution line, `<meta name="author">` and the READMEs; keep the wording identical everywhere.

## 3. 單檔版 HTML · Single-file HTML

- 單檔版 `windfarmTaiwan-standalone.html` 與公開版 `windfarmTaiwan-globe.html` 由 `tools/build_standalone.py`／`tools/build_globe_lite.py` 產生到 `standalone/`（不進 git），不要手動改。
  Both single-file copies are generated into `standalone/` (not in git) by the two build scripts; never edit them by hand.
- push 到 `main` 且改到 `index.html`、`assets/`、`data/global/*.json` 或建置程式時，GitHub Actions
  `build-standalone`（`.github/workflows/standalone.yml`）會自動重建並上傳到 GitHub Release「standalone」（固定標籤，覆蓋同名檔案；下載網址
  `https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/<檔名>`）；本機改完也可以自己跑一次確認。
  The `build-standalone` workflow rebuilds them after such pushes and uploads them to the GitHub Release tagged `standalone` (fixed tag,
  assets overwritten; download URL `https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/<file>`); you can also run the scripts locally.
- 新增執行時載入的檔案（JS、CSS、JSON、圖檔）時，要加進建置程式的清單（`PAGE_SCRIPTS`、`LAZY`、`DATA`、`LIVE`、`IMAGES`）。
  資料一律經 `WW.getJSON`／`WW.getLiveJSON` 讀取，程式經 `WW.loadScript`／`WW.loadCSS` 載入，圖檔經 `WW.asset()` 取得網址，
  單檔版才能改用內嵌內容。
  When adding a runtime resource, add it to the lists in the build script, and load it through
  `WW.getJSON` / `WW.getLiveJSON`, `WW.loadScript` / `WW.loadCSS` or `WW.asset()` so the single-file copy can serve it.

## 4. 資料 · Data

- 重建 `data/global/wind_farms.json` 後跑 `python3 tools/qa_farms.py`（座標健檢）與
  `python3 tools/coverage_report.py`（更新 `docs/data-coverage*.md`）。
  After rebuilding the farm layer, run the coordinate check and regenerate the coverage report.
- 國家統計：台灣＝能源署《能源統計手冊》表 3-6（`TWN_OFFICIAL`），日本＝JWPA 年末累積導入量（`JPN_JWPA`），其他國家＝IRENA（經 Our World in Data）。
  National figures: Taiwan from the Energy Administration handbook, Japan from JWPA, other countries from IRENA via Our World in Data.
- 時間軸在 2025 年之後的「最新可得」年份寫在 `tools/latest_wind.py`：每國一列，附出處、資料月份與中英文說明；與本站 2025 年口徑不同的來源用「本站 2025 年＋該來源今年的增量」（標示估計），
  只有本站 2025 年已知有誤或與來源同一數列時才直接用來源的數字。改完跑 `python3 tools/build_country_stats.py`。新的一年有完整年度統計後，把年度數字併進 `wind_global.json`，再把這張表換成下一年。
  The "latest available" year after 2025 lives in `tools/latest_wind.py` (one row per country with source, data month and bilingual note);
  sources with a different scope from the site's 2025 figure add their growth to it (shown as an estimate), and a source's own figure is
  used only when the site's 2025 value is known to be wrong or comes from the same series. Run `python3 tools/build_country_stats.py` after editing.
- 美國每部風機的位置（`data/global/turbines.json`）由 `tools/build_turbines.py` 從 USWTDB 產生；對應規則寧可少配（名稱、30 km、容量 ±15%），重建風場層後要重跑。
  US turbine positions (`data/global/turbines.json`) are built from USWTDB by `tools/build_turbines.py` (conservative matching by name, 30 km and
  capacity ±15%); re-run it after rebuilding the farm layer.
- 實際年發電量（`data/global/generation.json`）由 `tools/build_generation.py` 產生：美國用 EIA-923，經 USWTDB 每部風機的 EIA 電廠代碼接到風場（電廠跨好幾座風場的不用、只列全年運轉的年份），容量因數的分母用 EIA-860M 登記的裝置容量（不用 USWTDB 加總：USWTDB 常少收機組，會把容量因數算高），USWTDB 與 EIA 容量相差 10% 以上的不用；
  台灣只有台電自有風場（台電開放資料 17140／17141，發電站對應寫在 `TW_STATIONS`，容量差 15% 以上不用）。民營風場沒有逐場官方數字，不要用憑證量或推估值充當實測。
  地球儀「發電表現」（排名與同機型比較）只用這個檔的實測值，不排名國家平均推估的值；同機型比較用的機型欄（`m`）寧可不寫：整座風場只有一種型號才寫（台灣另要求發電站容量與紀錄相差 3% 以內）。
  台灣另有「即時取樣」：`data/archive/farm_daily.json` 由 `taipower_wind_scraper.py` 每次執行時累加（台電即時資料各併網點的瞬間出力，含民營；同一資料時間只算一次），
  `tools/build_farm_daily.py` 可從 git 歷史回補。它是取樣估計：介面一律寫「取樣」並註明期間與季節性，不與官方年發電量混排，也不要換算成年發電量當成實測。
  Actual yearly output (`data/global/generation.json`) is built by `tools/build_generation.py`: US farms from EIA-923 through the EIA plant code USWTDB gives
  each turbine (plants spread over several farms and partial years are left out), with the capacity factor on the EIA-860M nameplate capacity (not the USWTDB sum: USWTDB often lacks turbines, inflating the factor), dropping farms whose USWTDB and EIA capacities differ by 10% or more; in Taiwan only Taipower-owned farms (open data 17140/17141, stations
  mapped in `TW_STATIONS`, skipped when capacities differ by more than 15%). Private farms have no official per-farm figures; never pass certificates or estimates off as measured output.
  The globe's Output dialog (rankings and same-model comparison) uses only these measured values, never the country-average estimates; the model field (`m`)
  is written only when a whole farm has one model (in Taiwan also only when the station capacity is within 3% of the record).
  Taiwan also has "live samples": `data/archive/farm_daily.json` is added to by `taipower_wind_scraper.py` on every run (instantaneous output of every grid unit
  in Taipower's live data, private farms included; a data time counts once), and `tools/build_farm_daily.py` backfills it from the git history. These are
  estimates from samples: always label them as samples with the period and the seasonality, never mix them into the official ranking, and never turn them into yearly generation presented as measured.
- 德國（`tools/build_mastr.py`，MaStR，Datenlizenz Deutschland – Namensnennung 2.0，標示「© Bundesnetzagentur | Marktstammdatenregister」）：每部風機依風場名稱與位置分群，
  對到本站德國風場（名稱、距離、容量 ±20%）就寫進 `turbines_de.json`；其餘 1 MW 以上的陸域群在附近沒有可能相同的本站紀錄時，才列進 `sources/mastr_parks_DEU.json`
  由 `build_farms.py` 加進風場層（來源代碼 4）。建置會檢查「本站陸域＋新增」不超過 MaStR 陸域容量的 102%，超過表示重複，要找出原因，不要放寬門檻了事。
  Germany (`tools/build_mastr.py`, MaStR, Data licence Germany – attribution 2.0, credit "© Bundesnetzagentur | Marktstammdatenregister"): turbines are grouped
  by farm name and location; groups matched to a site farm (name, distance, capacity ±20%) go to `turbines_de.json`; other onshore groups of 1 MW+ with no
  possibly identical site record nearby go to `sources/mastr_parks_DEU.json`, added by `build_farms.py` as source code 4. The build stops if site onshore +
  added exceeds 102% of the MaStR onshore total (duplicates): find the cause rather than loosening the thresholds.
- 其他國家的風機位置（`data/global/turbines_osm.json`）來自 OpenStreetMap，以 ODbL 分享：檔案的 meta、README、卡片與「資料來源」都要標示「© OpenStreetMap 貢獻者」，
  不要把它併進其他授權的資料檔。對應規則在 `tools/build_turbines_osm.py`（風場範圍的名稱與容量，或空間群聚加單機容量檢查），寧可少配。
  Turbine positions elsewhere (`data/global/turbines_osm.json`) come from OpenStreetMap and are shared under the ODbL: keep "© OpenStreetMap
  contributors" in the file's meta, the README, the card and the sources dialog, and never merge it into a file under another licence.
  Matching rules live in `tools/build_turbines_osm.py` (plant name and capacity, or spatial groups with a unit-size check), conservative.
- 數字寫進網站或文件前先對照原始資料；查不到的不要臆測，寫明「待查證」。
  Check numbers against the original source before publishing them; if something cannot be verified, say so instead of guessing.
- 風場的逐筆修正（重複、從未建成、錯置、數字錯誤）寫在 `tools/farm_cleanup.py`：每條規則用（國別, 名稱, 來源）指定剛好一筆，
  附中英文理由與出處連結，建置時輸出 `docs/data-cleanup*.md`。規則對不到資料時建置會中止，要逐條重新查證，不要直接刪掉規則了事。
  確認是不同風場、但名稱相近會被當成重複的 GEM 專案，列在同一檔的 `GEM_KEEP`；2026 年整理的規劃中專案清單裡、之後已停止的專案列在 `PIPE_DROP`。
  GEM 專案被併進某筆精選紀錄、而那筆精選紀錄之後被 dup／drop 刪掉時，建置會中止（否則整座風場會消失）：是另一座就列 `GEM_KEEP`，確認已由別的紀錄涵蓋才列 `ORPHAN_OK`。
  Record-level farm fixes (duplicates, never built, misplaced, wrong figures) live in `tools/farm_cleanup.py`: each rule names
  exactly one record by (country, name, source) with bilingual reasons and a source link, and the build writes `docs/data-cleanup*.md`.
  If a rule stops matching, the build stops: re-check it rather than just deleting it. GEM projects that are confirmed to be
  different farms but have look-alike names go in `GEM_KEEP` in the same file, and projects in the 2026 pipeline compilation that have
  since stopped go in `PIPE_DROP`.
  If a GEM project was merged into a curated record that a dup/drop rule later removes, the build stops (otherwise the farm would
  vanish): list it in `GEM_KEEP` if it is a separate farm, or in `ORPHAN_OK` only when another record is confirmed to cover it.

- 卡片照片寫在 `tools/farm_photos.py`：每張都要人工看過（看得到該風場或里程碑風機的風機，不是地圖、標誌、典禮或遠景），出自該風場自己的 Wikimedia Commons 分類（沒有分類時，檔名或說明要寫明是這座風場），
  授權是 CC0／公有領域／CC BY／CC BY-SA／Attribution；改完跑 `python3 tools/build_photos.py`（檢查名稱、分類與授權，輸出 `data/global/photos.json`），卡片會寫出作者與授權。
  事件只放拍到該事件本身的照片。找候選用 `python3 tools/find_photos.py 名稱 --save 目錄`。照片不存進 repo，網頁直接載入 Commons 縮圖。
  Card photos live in `tools/farm_photos.py`: each one looked at by hand (it shows the farm's or milestone machine's turbines, not a map,
  logo, ceremony or distant view), taken from the farm's own Wikimedia Commons category (or named as that farm in its title or description), under CC0 / public domain / CC BY / CC BY-SA / Attribution.
  Run `python3 tools/build_photos.py` after editing (it checks names, categories and licences and writes `data/global/photos.json`); the card
  credits author and licence. Event photos must show the event itself. Photos are not stored in the repo; the page loads Commons thumbnails.

- 港口資料 `data/global/ports.json` 是人工整理、每港附出處：座標標在碼頭或港池（`coordNote` 說明是哪裡），「服務過的風場」只列有出處佐證的，
  名稱要與 `wind_farms.json` 完全一致；角色已結束的港口標 `former`。改完跑 `python3 tools/qa_ports.py`。查不到的港口不要猜，列在 TODO。
  Ports (`data/global/ports.json`) are curated by hand with sources for every port: coordinates mark the quay or harbour basin
  (`coordNote` says which), "farms" lists only farms a source ties to the port, using exact names from `wind_farms.json`, and ports
  whose role has ended are marked `former`. Run `python3 tools/qa_ports.py` after editing. Never guess a port — list missing ones in TODO.

- 離岸風場水下基礎型式：逐場對照表在 `tools/farm_foundations.py`（每列用國別與風場名稱指定一座，名稱與 `wind_farms.json` 完全一致），
  改完跑 `python3 tools/build_foundations.py`，輸出 `data/global/foundations.json` 與 `docs/foundations*.md`。OSPAR 的值不一定是建成的樣子
  （德國的紀錄尤其不可靠）：與 OSPAR 不符或 OSPAR 沒寫明的，一定要附第二來源與中英文說明；OSPAR 只有核准階段設計（authorised 等）的，一定要附施工紀錄；沒有 OSPAR 紀錄的每列都要附出處。浮動式的列一定要有細分型式（單柱式、半潛式、駁船式、張力腳），同一筆含不同型式的機組時改寫中英文說明。以上建置都會檢查；查不到的列在 `EXCLUDED`（卡片會寫出理由）或 TODO，不臆測。
  地圖依結構歸成四組上色（三個色相＋兩個中性色，dataviz 色盲檢查）；新增型式或改色前先重跑色盲檢查。重建風場層後也要重跑一次。
  Offshore foundation types: the per-farm table is `tools/farm_foundations.py` (each row names one farm by country and exact name);
  run `python3 tools/build_foundations.py` after editing to write `data/global/foundations.json` and `docs/foundations*.md`. OSPAR does
  not always describe what was built (German records especially): any row that differs from OSPAR, or where OSPAR gives no specific
  type, needs a second source and a bilingual note; where OSPAR only has a consent-stage design (authorised and so on), a construction
  source is required; rows without an OSPAR record need a source of their own; a floating row needs a floating sub-type (spar, semi-submersible, barge, tension-leg), or a bilingual note when one record holds units of different types. The build checks all of this. Leave unverifiable farms
  in `EXCLUDED` (the farm card shows the reason) or TODO; never guess. The map folds types into four colour groups (three hues plus two neutrals, checked for colour-blind readers); re-run that
  check before adding a type or changing a colour. Re-run the build after rebuilding the farm layer.
- 查證（水下基礎、風場更正）時每個出處都附一段原文，寫成 `[{"farm": ..., "sources": [{"url": ..., "quote": ...}]}]` 的 JSON，
  用 `python3 tools/check_quotes.py 檔案.json` 逐筆核對原文真的在網頁上（中日韓文網頁依編碼比對，PDF 需要 pypdf），只採用 OK 的結果；
  不引用 4C Offshore（付費、禁止轉載）。還沒寫進對照表的查證紀錄放在 `tools/research/`，寫進去之後刪掉。
  找可引用的原文時用 `python3 tools/grab_page.py URL 關鍵字…` 印出含關鍵字的片段（與核對用同一套下載與轉文字），只引用它印出的連續文字；
  搜尋結果的摘要不能當引文。
- 離岸風場尺寸（水深、輪轂高度、葉輪直徑）寫在 `tools/farm_dimensions.py`（每列附出處與中英文說明），由 `tools/build_foundations.py` 一起輸出。
  只採用建成值：核准上限、環評設計值、吊裝或機艙高度、只屬一期或部分機組的值都不用（寫進說明或 TODO）；葉尖高減葉輪半徑推算時兩個數字要在同一段原文、
  基準是海平面。同場不同機型時輪轂高度可寫範圍，葉輪直徑取最大機型。
  When researching (foundation types, farm fixes), give every source a quoted passage in a JSON list of
  `{"farm": ..., "sources": [{"url": ..., "quote": ...}]}` and run `python3 tools/check_quotes.py file.json` to confirm each quote is on
  its page (CJK pages are decoded by their charset; PDFs need pypdf); use only OK results. Never cite 4C Offshore (paid, no
  redistribution). Research notes not yet written into the tables live in `tools/research/`; delete them once they are.
  To find a quotable passage, `python3 tools/grab_page.py URL keyword…` prints the passages around the keywords (same fetching and
  text extraction as the check); quote only a continuous passage it prints. Search-result snippets are never quotes.
- Offshore dimensions (water depth, hub height, rotor diameter) live in `tools/farm_dimensions.py` (each row with sources and bilingual
  notes) and are written out by `tools/build_foundations.py`. Use only as-built values: no consent limits, EIA design values, lifting or
  nacelle heights, or values for only one phase or some units (put them in the note or TODO); a hub height derived as tip height minus
  rotor radius needs both numbers in the same quoted passage, measured from sea level. With mixed turbines, give the hub height as a
  range and the rotor diameter of the largest model.

- 「此刻的風」：`tools/fetch_gfs_wind.py`（排程 `wind-now`，每 6 小時）從 NOAA NOMADS 取 GFS 離地 10 m 的 U、V，寫成 `data/live/wind_now.webp`＋`wind_now.json`；
  檔案要維持小（約 50 KB，每次都會 commit），不要提高解析度或加欄位前先估算 repo 一年的增量。它是此刻的天氣，不隨時間軸變動，圖例要寫出資料時間。
  "Wind now": `tools/fetch_gfs_wind.py` (the 6-hourly `wind-now` schedule) takes GFS 10 m U and V from NOAA NOMADS and writes
  `data/live/wind_now.webp` + `wind_now.json`; keep the file small (about 50 KB, committed every time) and estimate the yearly repo growth
  before raising the resolution or adding fields. It is today's weather, not tied to the timeline, and the legend must show the data time.

- 澳洲、加拿大即時資料：`intl_wind_scraper.py`（排程，只用標準函式庫）讀 `data/live/units.json`；機組對照由
  `tools/build_live_units.py` 產生，人工核對的對照寫在它的 `MANUAL`，並附來源說明。對不到的機組不要猜，留在電網總量。
  各來源的授權標示（AEMO 來源、AESO 與 IESO 的版權聲明）顯示在資料旁，不要刪。
  Australian/Canadian live data: the scheduled `intl_wind_scraper.py` (standard library only) reads `data/live/units.json`,
  built by `tools/build_live_units.py`; hand-checked matches live in its `MANUAL` with their source. Never guess a match —
  leave unmatched units in the grid total. Keep each source's attribution (AEMO source, AESO and IESO copyright notices) next to the data.

## 5. 測試 · Testing

- 本機預覽：`python3 -m http.server 8000`，開 `http://localhost:8000/`。
  Local preview: `python3 -m http.server 8000`.
- 用 Playwright（Chromium，參數 `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`）走過首頁、台灣即時
  （儀表／風場牆／數據／地圖）、全球地球儀、風電知識，桌機與手機寬度都要沒有錯誤。
  Walk through every page with Playwright on desktop and phone widths and check for errors.
- 單檔版以 `file://` 開啟，連網與離線（封鎖所有 http/https 請求）各測一次：離線時即時資料應標示「離線快照」。
  Open the single-file copy over `file://` both online and offline; offline, the live data must be labelled as an offline snapshot.

## 6. 範疇 · Scope

- 網站聚焦風電。擴展成多能源別、改變部署方式或加入需要帳號／金鑰的資料源等決定，動工前先問使用者。
  The site is about wind power. Ask the owner before widening the scope (other energy sources, a different
  deployment, data sources that need accounts or API keys).

## 7. 版本 · Versioning

- 版本號只寫在 `assets/js/core.js` 的 `WW.VERSION`（語意化版本 主版.次版.修訂）；頁尾、「關於本站」、地球儀出處列與「資料來源」視窗
  都從這裡讀（HTML 用 `data-ver`），不要在別處寫死版本號。
  The version lives only in `WW.VERSION` in `assets/js/core.js` (semantic versioning); the footer, "About this site", the
  globe's attribution line and sources dialog read it (`data-ver` in HTML). Never hard-code it anywhere else.
- 每個改到網站的 PR 都要更新版本號，並在 `CHANGELOG.md` 與 `CHANGELOG.en.md` 最上面各加一段（同一個 commit，日期用台灣時間）。
  全面改版加主版號；新功能、新頁面、新圖層或新資料來源加次版號；修正、文字、小幅顯示調整與資料更正加修訂號。
  Every PR that changes the site bumps the version and adds an entry at the top of both changelogs in the same commit
  (dates in Taiwan time): MAJOR for a redesign, MINOR for new features, pages, layers or data sources, PATCH for fixes,
  wording, small display changes and data corrections.
- 排程更新的即時資料與機器人重建的單檔版不改版號。`tools/build_standalone.py` 會檢查兩份 CHANGELOG 都有目前版本，沒有就中止。
  Scheduled live-data commits and the bot's single-file rebuilds do not change the version. The single-file build stops if
  either changelog lacks the current version.

## 8. 接續工作 · Picking up work

- 進行中的工作、交接事項與下一步寫在 `TODO.md` 最上面的「進行中」段落（英文版 `TODO.en.md`）；開新的工作階段時先讀那裡。
  工作告一段落時更新那一段，完成的項目移到各主題的清單。
  Work in progress, hand-off notes and next steps are in the "In progress" section at the top of `TODO.en.md` (Chinese: `TODO.md`);
  read it first in a new session, and update it when you stop, moving finished items to their topic lists.
