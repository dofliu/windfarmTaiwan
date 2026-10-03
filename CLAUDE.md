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
  When researching (foundation types, farm fixes), give every source a quoted passage in a JSON list of
  `{"farm": ..., "sources": [{"url": ..., "quote": ...}]}` and run `python3 tools/check_quotes.py file.json` to confirm each quote is on
  its page (CJK pages are decoded by their charset; PDFs need pypdf); use only OK results. Never cite 4C Offshore (paid, no
  redistribution). Research notes not yet written into the tables live in `tools/research/`; delete them once they are.

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
