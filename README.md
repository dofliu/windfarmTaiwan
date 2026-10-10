# 風電風情 · Taiwan Wind Watch

[English](./README.en.md) ｜ 中文（本頁）

台灣風力發電即時資訊 × 全球風電發展 1980–2025（時間軸另有「2026 最新可得」）。一個網站兩種尺度：

- **台灣此刻**：以水庫水情般的「出力量柱」呈現全台 30 個風力機組／風場的即時發電，資料直接對接台電與政府開放資料。
- **全球 45 年**：3D 地球儀重播 1980 年以來各國風電的成長，可一路放大到單一風場（約 3.1 萬筆風場紀錄：營運中約 2.1 萬座，另有約 9,600 個興建中與規劃中專案），
  並以 13 章「風電知識」說明歷史、技術、各國發展與台灣的位置。

線上：`https://dofliu.github.io/windfarmTaiwan/`

開發者：國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室（National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu）

## 文件

所有文件都有中文與英文兩個版本，內容一致；網站介面也是中英雙語（右上角切換）。

| 文件 | 中文 | English | 內容 |
|---|---|---|---|
| 說明（本頁） | [README.md](./README.md) | [README.en.md](./README.en.md) | 功能摘要、架構、檔案、資料更新、來源與授權 |
| **使用說明** | [docs/user-guide.md](./docs/user-guide.md) | [docs/user-guide.en.md](./docs/user-guide.en.md) | 每一頁、每個按鈕與圖層怎麼用，網址參數，常見問題 |
| 更新紀錄 | [CHANGELOG.md](./CHANGELOG.md) | [CHANGELOG.en.md](./CHANGELOG.en.md) | 每個版本改了什麼（網站頁尾顯示目前版本） |
| 路線圖 | [ROADMAP.md](./ROADMAP.md) | [ROADMAP.en.md](./ROADMAP.en.md) | 目前狀態、已知限制、規劃與評估過但暫緩的方向 |
| 待辦 | [TODO.md](./TODO.md) | [TODO.en.md](./TODO.en.md) | 進行中的工作與交接、具體待辦 |
| 部署 | [DEPLOY.md](./DEPLOY.md) | [DEPLOY.en.md](./DEPLOY.en.md) | 部署方案與每月維護檢查 |
| 資料覆蓋率 | [docs/data-coverage.md](./docs/data-coverage.md) | [docs/data-coverage.en.md](./docs/data-coverage.en.md) | 各國逐場資料覆蓋率、疑似重複與待查證項目（程式產生） |
| 資料清理紀錄 | [docs/data-cleanup.md](./docs/data-cleanup.md) | [docs/data-cleanup.en.md](./docs/data-cleanup.en.md) | 逐筆刪除或更正的風場紀錄與理由（程式產生） |
| 水下基礎 | [docs/foundations.md](./docs/foundations.md) | [docs/foundations.en.md](./docs/foundations.en.md) | 離岸風場的水下基礎型式與尺寸逐場清單（程式產生） |
| 重大事件與事故 | [docs/events.md](./docs/events.md) | [docs/events.en.md](./docs/events.en.md) | 事件圖層的逐筆清單（程式產生） |
| 即時資料來源評估 | [docs/live-data-sources.md](./docs/live-data-sources.md) | [docs/live-data-sources.en.md](./docs/live-data-sources.en.md) | 其他國家即時發電資料的可行性 |
| 宣傳影片 | [tools/promo/README.md](./tools/promo/README.md) | [tools/promo/README.en.md](./tools/promo/README.en.md) | 地球儀宣傳影片的製作程式 |
| 專案慣例 | [CLAUDE.md](./CLAUDE.md)（中英並列） | | 給開發者與 AI：文件、資料、測試、版本的規則 |

## 下載（不需架站，離線也能開）

- **單檔版**：[windfarmTaiwan-standalone.html](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html)（約 13 MB），整個網站；詳見下方「單檔版」。
- **全球風電地圖公開版**（給一般人）：[windfarmTaiwan-globe.html](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-globe.html)（約 12 MB），只有 3D 地球儀與陸域、離岸、規劃中三個基本圖層。

**專案狀態（2026-10-07，v2.30.2）**：主要功能已完成，2026-09-27 起進入維護期，之後依使用者的要求逐項補強（每項一個 PR，見 CHANGELOG）。
台灣與國外即時資料的自動更新照常運作；維護要注意的事見 [DEPLOY.md](./DEPLOY.md)「維護」，之後要接續的工作見 [TODO.md](./TODO.md) 最上面。

## 快速上手（第一次來看這裡）

網站上方的導覽列有四個頁面：

| 頁面 | 看什麼 |
|---|---|
| **首頁** | 一頁看完：台灣此刻的風電出力、全球 1980–2025 年的風電成長、台灣在全球排第幾 |
| **台灣即時** | 全台 30 個風場此刻各發多少電（約每 2 小時更新），點任何一座看它的詳情 |
| **全球發展** | 3D 地球儀：各國風電的成長動畫，可一路放大到單一風場 |
| **風電知識** | 13 章圖文，從 1888 年第一部發電風機講到台灣的離岸風電，最後有名詞小辭典與「大家常問」 |

第一次來，建議這樣看（約 5 分鐘）：

1. **首頁**：先看最上面兩個大數字——台灣此刻的風電出力、全球累計裝置容量。
2. **台灣即時**：點任何一座風場（例：大彰化、海能），會打開它的詳情：即時趨勢、附近風速、規格與開發歷程。
   上方可切換「儀表／風場牆／數據／地圖」四種看法。
3. **全球發展**：按工具列的 **▶ 導覽**，選「自動導覽」看一遍風電發展的重要時刻，或選四個故事導覽之一（台灣離岸之路、歐洲離岸、中國崛起、浮動式風電），跟著旁白一站站看；或按時間軸的播放鍵，看各國從 1980 年長到今天。
   按 **🔍 搜尋**（或按 / 鍵）輸入風場名稱，例如「Hornsea」或「海龍」，點結果就會飛到那座風場。
   結果若寫「這一年不在地圖上」，是因為時間軸還停在較早的年份，按「移到最新年份」即可。
4. **風電知識**：想知道風電怎麼來的、為什麼要發展風電，從第一章讀起；每章都有按鈕可以跳到地球儀重播那一段。

小提醒：

- 右上角 **EN／中文** 切換語言；**分享** 產生附資料時間的即時圖卡。網址可以直接分享，別人打開會看到同一個畫面。
- 手機也能用。地球儀第一次打開要下載幾 MB 的資料，要等一下；沒有 3D 繪圖能力的舊裝置會自動改用長條排名。
- 資料新舊：台灣即時約每 2 小時更新（頁首會寫台電的資料時間）；全球各國容量到 2025 年底，另有 8 國的 2026 年最新可得數字；逐場風場資料是 GEM 2026 年 2 月版。
- 沒有網路也想看：下載[單檔版](https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html)，存到電腦直接開啟。
- 發現資料有錯：風場卡片底部有「回報資料錯誤」，或到 [GitHub](https://github.com/dofliu/windfarmTaiwan/issues) 回報。
- 每個按鈕、圖層與網址參數的完整說明見 **[使用說明](./docs/user-guide.md)**。

## 功能

導覽列四個頁面（網址以 `#/` 路由，可直接分享）。以下是摘要，操作細節見[使用說明](./docs/user-guide.md)。

- **首頁** `#/home` — 台灣即時總出力與全球 1980–2025 累計容量並排；台灣在全球的位置；精選里程碑（點了直接飛到地球儀現場）
- **台灣即時** `#/live` — 全國風電出力、可用率、電網備轉容量率與風電貢獻、今日發電量估算、可排序與篩選的機組量柱；
  風場牆 `#/live/wall`、數據 `#/live/charts`（排行／出力組成、官方回溯資料的長期趨勢）、地圖 `#/live/map`（Leaflet 衛星地圖）；
  每座風場的詳情（即時趨勢、鄰近測站風速、規格、查證過的開發與營運歷程，`#/live?farm=<id>`）；「分享」產生含資料時間的即時圖卡
- **全球發展** `#/global` — 3D 地球儀（three.js，只在進入此頁才載入，離開即停止繪圖）：
  - 各國陸域／離岸**年底累計裝置容量**逐年動畫（1980–2025，加上 8 國官方數字的「2026（最新可得）」），長條排名一律以 MW 顯示；地圖／地圖＋長條／長條排名，3D 地球／2.5D 平面
  - **風場層**：合併精選風場、Global Energy Monitor 全球風電追蹤（2026-02）與德國 MaStR；選國家就畫出該國全部風場，點風場時依實際機位（美國 USWTDB、德國 MaStR、其他國家 OpenStreetMap）畫出風機
  - **規劃中**（虛線環）：約 9,600 個興建中、前期開發與已宣布的專案；「規劃」分頁依狀態與預計商轉年列出，附 GEM 各國開發管線總量
  - **搜尋與篩選**（🔍 或按 /）：依名稱、中文名、開發商、機型、國名搜尋全部風場，依狀態、類型、容量、年份篩選，條件寫進網址可分享
  - **國家概況**：歷年曲線、排名、10 年成長、最大與最早的風場、逐場資料覆蓋率、規劃中與水下基礎統計（台灣、日本附官方統計稽核標記）
  - **風場卡片**：人工核對的照片、維基百科簡介、水下基礎與按比例的剖面示意、離岸距離、實際或估計年發電量、國內排名、分期、附近與同開發商的風場、相關事件、即時出力、
    外部連結、「複製此風場連結」與「回報資料錯誤」
  - **📊 發電表現**：台灣（台電自有 19 座）、美國（EIA-923，833 座）、澳洲（AEMO，62 座）與丹麥（54 座風場、約 1,800 部單獨計量的風機）逐場實測年發電量的排名與同機型比較；
    另有含民營風場的「台灣・即時取樣」（取樣估計，不與官方數字混排）
  - **圖層**：港口（15 國 55 個，⚓）、重大事件與事故（91 筆，⚑，[docs/events.md](./docs/events.md)）、離岸水下基礎（營運中離岸風場 331 座中 285 座已知型式、占容量 87.3%，
    [docs/foundations.md](./docs/foundations.md)）、此刻的風（NOAA GFS，每 6 小時）、海域（專屬經濟區界線、台灣 36 處潛力場址、日本 13 處促進區域、北海周邊 6 國的規劃區）、
    平均風速底圖（Global Wind Atlas）
  - **導覽**：自動導覽與四個故事導覽（台灣離岸之路、歐洲離岸、中國崛起、浮動式風電，`#/global?tour=tw`／`eu`／`cn`／`fl`）
  - **澳洲、加拿大即時出力**：AEMO、AESO、IESO 約 150 座風場；時間軸在最新年份時，有即時資料的風場外圈為綠色、葉片依出力轉動
  - **各國此刻的風電總出力**：英國（大不列顛）、德國、法國、丹麥、比利時、波蘭全國與美國德州、加州電網的總量與 48 小時趨勢（只有總量），在國家概況與全球「各地此刻的風電出力」清單；說明見[使用說明 4.5](./docs/user-guide.md#45-側欄分頁)
  - 無 WebGL 的裝置自動改用長條排名
- **風電知識** `#/learn` — 13 章：從 1888 年 Brush 風機到 2025 年、陸域與離岸、水下基礎、浮動式、風機大型化、亞洲崛起、台灣的離岸風電、
  為什麼要發展風電、名詞解釋與完整資料來源；圖表皆由同一份全球資料集繪製，每章都能跳到地球儀重播那一段

## 架構

```
GitHub Actions（約每 2 小時）── taipower_wind_scraper.py ──► wind_realtime.json / wind_history.json / grid_status.json / data/archive/farm_daily.json ─┐
                               ── intl_wind_scraper.py    ──► data/live/intl_realtime.json（澳洲、加拿大）────────────────────────────────────────┤
GitHub Actions（每週一）       ── backfill_history.py      ──► data/archive/ 月檔 / wind_archive_daily.json ──────────────────────────────────────┤
GitHub Actions（每 6 小時）    ── tools/fetch_gfs_wind.py  ──► data/live/wind_now.webp / wind_now.json（此刻的風）──────────────────────────────────┤
                                                                                                                                                  ├─► commit 回 repo
tools/*.py（手動、低頻：資料改版時才跑） ──► data/global/*.json、assets/img/globe/*.jpg、docs/*（由程式產生的文件）──────────────────────────────┤
GitHub Pages 服務同一 repo：index.html + assets/ + data/ + 上述 JSON ◄──────────────────────────────────────────────────────────────────────────┘
GitHub Actions（push 到 main 且改到網站程式或全球資料）── tools/build_standalone.py、build_globe_lite.py ──► Release「standalone」的兩個 HTML（不 commit）
GitHub Actions（每個 PR）── tools/smoke_test.js 等 ──► 自動檢查（pr-check）
瀏覽器讀 index.html → 依頁面延遲載入模組與資料（同網域，無 CORS）
```

純靜態網站、沒有建置步驟：`index.html` 是外殼，`assets/js/` 各頁模組以 `WW.registerPage()` 向 hash 路由註冊。
地球儀頁的 three.js（約 600 KB）、底圖與 3.8 MB 的風場資料只在第一次進入 `#/global` 時下載；風機位置、發電量、海域等較大的檔案在用到時才載入。

## 檔案

- `index.html` — 網站外殼：頂部導覽、四個頁面的版面與雙語文案、抽屜與提示
- `assets/css/site.css` — 設計系統（深色資料風格、色票、元件、響應式）；`assets/css/globe.css` — 地球儀專用樣式
- `assets/js/core.js` — 共用核心：雙語、hash 路由、延遲載入、資料快取、數字格式、分享；版本號 `WW.VERSION`
- `assets/js/live.js` — 台灣即時（`FARMS` 30 個機組／風場的規格與開發歷程、即時／歷史／電網資料讀取、儀表、風場牆、圖表、地圖、抽屜、分享圖卡）
- `assets/js/charts.js` — 輕量 SVG 圖表（折線、柱狀、橫條、散佈；含提示框與表格檢視）
- `assets/js/home.js`、`assets/js/learn.js` — 首頁與風電知識頁
- `assets/js/globe.js` — 3D 地球儀（改寫自「全球風電發展觀察地圖」wind-history-map v3）
- `assets/vendor/` — three.js r128 與 OrbitControls（MIT，原樣內附）
- `assets/img/globe/` — 地形／衛星／平均風速底圖（4096×2048 與 2048×1024 兩種尺寸）
- `data/global/wind_global.json` — 國家逐年陸域／離岸容量 1980–2025、全球總量、里程碑、來源與註記（約 90 KB）
- `data/global/wind_farms.json` — 風場層級資料約 3.1 萬筆（營運中、規劃中、已除役；151 個國家與地區）
- `data/global/country_stats.json` — 地球儀時間軸的「最新可得」年份（2026：8 國官方數字，逐國出處寫在 `tools/latest_wind.py`）與各國風電平均容量因數
  （Ember，風場卡片估計年發電量用），由 `tools/build_country_stats.py` 產生
- `data/global/world_borders.json` — 國界（Natural Earth 1:50m）
- `data/global/turbines.json` — 美國每部風機的位置與規格（USWTDB，公有領域；967 座風場、約 6.1 萬部），由 `tools/build_turbines.py` 產生，點到美國風場時才載入
- `data/global/turbines_de.json` — 德國每部風機的位置與規格（MaStR；約 6,600 座風場、2.6 萬部），由 `tools/build_mastr.py` 產生；
  **以 Datenlizenz Deutschland – Namensnennung 2.0 分享（© Bundesnetzagentur | Marktstammdatenregister）**；`data/global/sources/mastr_parks_DEU.json` 是要加進風場層的德國風場
- `data/global/turbines_osm.json` — 其他國家的風機位置（OpenStreetMap；約 6,100 座風場、13.9 萬部），由 `tools/fetch_osm_turbines.py` 下載、`tools/build_turbines_osm.py` 對到本站風場；
  **這個檔案以開放資料庫授權 ODbL 1.0 分享（© OpenStreetMap 貢獻者）**，與網站其他資料的授權不同；點到美國以外的風場時才載入（德國以 MaStR 優先）
- `data/global/generation.json` — 風場的實際年發電量與容量因數（美國 833 座：EIA-923，容量以 EIA-860M 登記的裝置容量計，公有領域；台灣 19 座台電自有風場：台電開放資料 17140；
  丹麥 54 座：丹麥能源署風機登記檔，依位置歸到本站風場；澳洲 62 座：AEMO 每個機組每 5 分鐘的 SCADA 實測出力加總；風場只有一種機型時附機型，給「發電表現」的同機型比較），
  由 `tools/build_generation.py`（丹麥的規則在 `tools/dk_output.py`，澳洲在 `tools/au_output.py`）產生，第一次打開風場卡片時才載入；
  澳洲的來源彙整檔是 `data/global/sources/aemo_wind_monthly.json`（`python3 tools/au_output.py fetch` 下載 AEMO 月檔後產生）
- `data/global/turbine_output.json` — 丹麥單獨計量的 1,848 部風機的位置、規格與各年實測發電量（丹麥能源署；只有公司持有的風機有公布），
  與 `generation.json` 一起產生，「發電表現」選「丹麥・單部風機」時才載入
- `data/global/foundations.json` — 離岸風場的水下基礎型式與尺寸（由 `tools/build_foundations.py` 依 `tools/farm_foundations.py` 與 `tools/farm_dimensions.py` 的逐場對照表產生）
- `data/global/ports.json` — 離岸風電港口 55 個（人工整理、每港附出處；改完跑 `tools/qa_ports.py`）
- `data/global/events.json` — 重大事件與事故 91 筆（由 `tools/build_events.py` 自 `data/global/sources/events_2026-09.csv` 產生；
  英文標題、摘要、註記與事件對風場的對應寫在建置程式裡，建置時檢查每筆都有英文、風場名稱對得到）
- `data/global/photos.json` — 風場卡片的照片（64 座風場與 18 個里程碑；人工核對的 Wikimedia Commons 照片，由 `tools/build_photos.py` 依 `tools/farm_photos.py` 產生）
- `data/global/offshore_zones.json` — 海域圖層：專屬經濟區界線（Marine Regions 第 12 版，CC BY 4.0，簡化到約 2 km 供顯示）、台灣離岸風電潛力場址（能源署開放資料 36681）、
  日本促進區域與北海周邊國家的離岸風電規劃區，由 `tools/build_offshore_zones.py` 產生（潛力場址原始座標存在 `data/global/sources/twn_offshore_potential_sites_36681.csv`，
  日本促進區域的公告點位存在 `data/global/sources/jpn_promotion_zones.json`，北海各國由建置程式從官方開放圖層下載），開啟「海域」時才載入
- `data/global/wind_resource.json` — 平均風速底圖的分級與圖例（`tools/build_wind_resource.py` 產生）
- `data/global/sources/` — 合併前的精選風場（含台灣、日本稽核狀態）、2026 年整理的規劃中專案與日本風場清單、合併紀錄、
  OSPAR Offshore Renewables 2024 的風機紀錄（CC0，水下基礎用）與其他建置用的原始檔
- `data/live/` — 澳洲、加拿大即時出力與八個國家／電網的風電總量 `intl_realtime.json`、電網機組代碼 → 風場的對照 `units.json`（`tools/build_live_units.py` 產生；安大略依 IESO 公布的設施對照人工核對）、
  此刻的風 `wind_now.webp`＋`wind_now.json`（排程更新）
- `data/archive/wind_history_archive_YYYY-MM.json` — 台電官方回溯的長期存檔，依月分檔（`backfill_history.py` 產生）
- `data/archive/farm_daily.json` — 台電即時資料各併網點（含民營）的每日取樣累積（2026-06 起，抓取程式每次累加；`tools/build_farm_daily.py` 可從 git 歷史回補），
  「發電表現」的台灣即時取樣與風場卡片用；一天一行，欄位說明在檔案的 meta
- `tools/` — 全球資料與底圖的產生程式（見下方「全球資料更新」）；`tools/build_standalone.py`、`tools/build_globe_lite.py` 產生兩個單檔版、
  `tools/coverage_report.py` 產生資料覆蓋率報告、`tools/qa_farms.py` 檢查風場座標、`tools/qa_ports.py` 檢查港口資料、
  `tools/build_foundations.py` 產生水下基礎資料與逐場清單、`tools/check_quotes.py` 核對研究時引用的原文真的在出處網頁上（`tools/grab_page.py` 找可引用的片段）、
  `tools/smoke_test.js` 冒煙測試、`tools/check_version.py` 檢查版本號與 CHANGELOG；`tools/research/` 放還沒寫進對照表的查證紀錄（每個出處附原文與核對結果）
- `tools/promo/` — 全球風電 3D 地球儀宣傳影片的製作程式（地球儀實機錄製、設計景、分鏡；成品不進 git，見 [tools/promo/README.md](./tools/promo/README.md)）
- `standalone/`（不進 git）— 本機執行建置程式的輸出位置；正式的單檔版與全球風電地圖公開版由 Actions 建好後上傳到 GitHub Release「standalone」
- `docs/` — 使用說明（`user-guide.md`）、資料覆蓋率報告（`data-coverage.md`）、資料清理紀錄（`data-cleanup.md`）、水下基礎逐場清單（`foundations.md`）、
  重大事件與事故清單（`events.md`）與其他國家即時資料來源評估（`live-data-sources.md`），各有英文版 `.en.md`
- `CLAUDE.md` — 專案慣例（文件中英對照、單檔版、資料更新、測試與版本），給之後的開發者與 AI 參考
- `taipower_wind_scraper.py` — 約每 2 小時執行：抓台電開放資料、解析風力 30 機組 → `wind_realtime.json`；
  滾動累積 7 天歷史 → `wind_history.json`；累加各併網點的每日取樣 → `data/archive/farm_daily.json`；同時抓電力供需即時報表 → `grid_status.json`
- `intl_wind_scraper.py` — 約每 2 小時執行：抓澳洲東部電網（AEMO）、亞伯達（AESO）、安大略（IESO）各風場的即時出力，
  以及大不列顛、德國、法國、丹麥、比利時、波蘭、美國德州（ERCOT）、加州（CAISO）的風電總量 → `data/live/intl_realtime.json`
  （含各電網 48 小時總出力，全國總量存每小時平均）；任一來源失敗時保留上一次的數值並標示，不影響台灣資料
- `wind_realtime.json` — 即時資料（由 Actions 自動更新）
- `wind_history.json` — 滾動 7 天歷史（scraper 即時累積，供前端趨勢線）
- `grid_status.json` — 全國電力供需即時報表（尖峰負載/供電能力/備轉容量率）。
  **實測限制**：主要來源從 GitHub Actions 執行會被 403（疑似 WAF 封鎖雲端 CI 網段），
  故實務上大多落到政府開放資料備援（每日更新，實測落後約 6 週），前端會誠實標示「非即時，截至 YYYY-MM-DD」，
  不與即時風力出力並列。欄位無法辨識或兩個來源皆失敗時不寫檔，前端該區塊自動隱藏，不顯示臆測值。
- `backfill_history.py` — 每週一執行：抓政府開放資料集 [37331「各機組過去發電量」](https://data.gov.tw/dataset/37331)，
  累積長期存檔 `data/archive/wind_history_archive_YYYY-MM.json`（官方每 10 分鐘回溯值，依月分檔、不修剪，每週只改寫當月檔）與每日摘要 `wind_archive_daily.json`
  （前端「數據 → 長期趨勢」讀這個，含逐機組明細）。
  **時效注意**：37331 為季度回溯檔，落後約 4–5 個月，補不到近 7 天趨勢窗的缺口，主要價值是長期趨勢分析。
  **口徑注意**：37331 只含台電**自有**風力機組，不含民營購電，與即時資料的全系統數值不可混用比較。
- `.github/workflows/scrape.yml` — 約每 2 小時自動執行兩個 scraper 並 commit
- `.github/workflows/backfill.yml` — 每週一自動累積官方回溯存檔，並從最近三週的 git 歷史補上每日取樣漏記的快照；可手動觸發（含 dry_run 選項）
- `.github/workflows/wind-now.yml` — 每 6 小時抓 NOAA GFS 離地 10 m 風場（`tools/fetch_gfs_wind.py`），地球儀「此刻的風」用
- `.github/workflows/standalone.yml` — 網站程式或全球資料有變更時重建兩個單檔版，上傳到 Release「standalone」（不 commit，避免 git 歷史每次多 25 MB）
- `.github/workflows/keepalive.yml` — 每月 1 日以 GitHub API 重新啟用各排程，避免 60 天無活動被停用（不產生 commit）
- `.github/workflows/pr-check.yml` — 每個 PR 的自動檢查：Playwright 冒煙測試（全站各頁桌機與手機、兩個單檔版連網與離線，`tools/smoke_test.js`）、語法、座標健檢、
  由程式產生的文件是否已更新、改到網站時的版本號與兩份 CHANGELOG（`tools/check_version.py`）；本機可跑 `node tools/smoke_test.js http://localhost:8000/ --standalone`

## 部署現況與本機預覽

- 網站由 GitHub Pages 直接服務本 repo 的 `main`（根目錄），網址 `https://dofliu.github.io/windfarmTaiwan/`；六個 GitHub Actions workflow
  （即時資料、每週官方回溯、此刻的風、單檔版重建、每月保活、PR 自動檢查）都在運作，不需要另外設定。
- 從零部署到另一個 repo 或換成其他主機的步驟見 [DEPLOY.md](./DEPLOY.md)；每月的維護檢查見 DEPLOY.md「維護」。

> 本機預覽：在 repo 根目錄執行 `python3 -m http.server`，開 `http://localhost:8000/`（直接雙擊 `index.html` 會因 `file://` 無法讀取 JSON；
> 想直接雙擊開啟請用單檔版）。

## 單檔版（下載後直接開啟）

`windfarmTaiwan-standalone.html` 把整個網站（首頁、台灣即時、全球 3D 地球儀、風電知識）打包成一個約 13 MB 的 HTML，
放在 GitHub Release「[standalone](https://github.com/dofliu/windfarmTaiwan/releases/tag/standalone)」（固定標籤，每次重建覆蓋）：

- **下載**：網站頁尾或「風電知識 → 資料來源與方法 → 關於本站」的「下載單檔版 HTML」，
  或直接開 `https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html` 另存。
- **連網時**：台灣即時資料直接向正式網站抓最新的（約每 2 小時更新），放大地球儀會載入 Esri 高解析圖磚，風場卡片會查維基百科。
- **離線時**：全球資料、約 3.1 萬筆風場、國界與 2k 地形／衛星底圖都在檔案裡，地球儀照常運作；台灣即時改顯示建置當下的資料，
  並標示「離線快照」。台灣即時的衛星地圖（Leaflet）需要連網。
- **更新**：push 到 `main` 且改到 `index.html`、`assets/`、`data/global/*.json` 時，GitHub Actions 會自動重建並上傳到 Release（檔案不進 git）；
  本機也可以執行 `python3 tools/build_standalone.py`（`WW.VERSION` 在兩份 CHANGELOG 沒有對應段落時會中止）。
  頁尾標示版本號、建置時間與 commit。分享按鈕在單檔版一律分享正式網站的網址。
- **全球風電地圖公開版** `windfarmTaiwan-globe.html`（約 12 MB，`python3 tools/build_globe_lite.py`，Actions 同時重建並上傳）：給一般人的精簡版，
  只有 3D 地球儀與陸域、離岸、規劃中三個基本圖層（各國逐年容量、風場搜尋、規劃分頁、發電表現、地形／衛星底圖、深連結都在），不載入港口、水下基礎、
  事件、海域、此刻的風、里程碑導覽與任何即時資料，也沒有首頁、台灣即時與風電知識；頁尾連到完整網站。離線時只是沒有 Esri 高解析圖磚與維基百科簡介。

## 注意事項

- 用 **public repo**：Actions 分鐘數免費無限。
- 排程約每 2 小時一次；GitHub 排程不保證準時（可能延遲或略過一兩次），本站不需要逐分即時，足夠。
- repo 連續 60 天無活動，排程會被自動停用；`keepalive` workflow 每月自動重新啟用各排程來避免（檢查方式見 DEPLOY.md「維護」）。
- 每次更新會 commit 一筆，git 歷史會累積（功能無礙）。若要避免，可改用 Cloudflare Worker Cron（見 `DEPLOY.md`）。
- 瀏覽時會連到的第三方服務：cdnjs（Leaflet，僅地圖分頁）、Esri 圖磚（僅地球儀放大後）、維基百科與 Wikimedia Commons（風場照片與簡介，查不到或離線時只顯示連結）。
  這些服務失敗時網站其餘功能照常運作。

## 全球資料更新

全球資料是低頻資料（每年更新一次即可），由 `tools/` 的程式離線產生後 commit，不走排程：

```bash
# 1. 國家逐年容量、里程碑、GEM 2026-02 各國總量（來源：「全球風能發展圖譜 v3｜台灣・日本稽核版」單檔 HTML；
#    台灣、日本的官方序列寫在程式中，輸入原版 wind-history-map v3 也會得到相同數字）
python tools/extract_global_data.py global-wind-development-atlas-v3-tw-jp-audited.html data/global
#    另一平行開發版本的補充資料：2026 年整理的規劃中專案、日本風場清單
python tools/extract_curated_extras.py wind-history-map.html data/global/sources
# 2. 國界（Natural Earth 1:50m）
curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
python tools/build_borders.py ne_50m_admin_0_countries.geojson data/global/world_borders.json
# 3. 風場層（精選風場 × GEM 全球風電追蹤 × 德國 MaStR）
#    德國：先從 MaStR 全國匯出檔分段取出風機檔（約 10 MB），對到本站風場、列出要新增的風場（只拿非 MaStR 的紀錄比對）
python tools/fetch_mastr.py mastr/ && python tools/build_mastr.py mastr/EinheitenWind.xml mastr/Katalogwerte.xml
curl -LO https://publicgemdata.nyc3.cdn.digitaloceanspaces.com/interim_maps/gwpt_map_2026-02.geojson   # GEM 公開資料桶（約 55 MB）
python tools/build_farms.py data/global/sources/farms_attachment.json gwpt_map_2026-02.geojson data/global/wind_farms.json
#   對不到新版名稱的清理規則會讓建置中止；升級 GEM 版本時可先 CLEANUP_LENIENT=1 建置、看新名稱，再逐條改寫 tools/farm_cleanup.py
#    （會套用 tools/farm_cleanup.py 的逐筆清理規則，並輸出 docs/data-cleanup.md 與 .en.md）
python tools/qa_farms.py        # 座標健檢：列出落在國界外的風場
python tools/build_live_units.py # 澳洲、加拿大即時資料的機組→風場對照（需 openpyxl；新風場併網時重跑，並檢查「未對應」清單）
python tools/coverage_report.py # 資料覆蓋率報告：docs/data-coverage.md（中文）與 .en.md（英文）
python tools/qa_ports.py        # 港口資料健檢：欄位、國界內或離岸 15 km 內、出處、「服務過的風場」對得到風場名稱
python tools/build_foundations.py # 水下基礎：檢查逐場對照（風場名稱、OSPAR 的值、第二來源；OSPAR 只有核准階段設計的要附施工紀錄），輸出 foundations.json 與 docs/foundations*.md
# 4. 地貌底圖（需 Pillow + numpy；來源檔下載位置見程式說明）
python tools/build_basemaps.py world.topo.bathy.200412.3x5400x2700.jpg GRAY_50M_SR_OB.tif assets/img/globe
#    平均風速底圖（需 rasterio；直接讀 Global Wind Atlas 雲端 GeoTIFF 的縮圖層，不用下載整個 14 GB 檔；要先有 relief_4k.jpg）
python tools/build_wind_resource.py
# 5. 單檔版與全球風電地圖公開版（輸出到 standalone/，不進 git；push 到 main 後 Actions 會自動重建並上傳到 Release）
python tools/build_standalone.py
python tools/build_globe_lite.py
# 6. 重大事件與事故（改了 data/global/sources/events_2026-09.csv 或 tools/build_events.py 的英文與風場對應後）
python tools/build_events.py
# 7. 時間軸「最新可得」年份與各國容量因數（改了 tools/latest_wind.py，或更新 data/global/sources/ember_wind_2020-2025.csv 後）
python tools/build_country_stats.py
# 8. 美國每部風機的位置與規格（USWTDB 每季更新；重建風場層後也要重跑，名稱改了會對不到）
curl -LO https://energy.usgs.gov/uswtdb/assets/data/uswtdbCSV.zip && unzip uswtdbCSV.zip
python tools/build_turbines.py uswtdb_V9_1_20260928.csv
# 9. 其他國家的風機位置（OpenStreetMap，ODbL；下載約需 2–4 小時，Overpass 公用伺服器忙時會自動重試，失敗的區重跑時補；重建風場層後也要重跑對應）
python tools/fetch_osm_turbines.py osm_wind/
python tools/build_turbines_osm.py osm_wind/
# 10. 實際年發電量（美國 EIA-923 每年約 9 月出前一年的最終值，舊年份在 archive/xls/；台灣兩個 CSV 從台電開放資料重新下載後覆蓋；先跑第 8 步）
curl -LO https://www.eia.gov/electricity/data/eia923/xls/f923_2025.zip   # 2023、2024 年在 .../eia923/archive/xls/
curl -LO https://www.eia.gov/electricity/data/eia860m/xls/august_generator2026.xlsx   # EIA-860M：各機組的裝置容量與商轉、除役年（取最新一個月）
#     澳洲：python tools/au_output.py fetch 2022-01 2025-12（AEMO MMSDM 月檔，每月約 30 MB、約 20 分鐘；新的一年把迄月往後延）
#     丹麥（選用）：從丹麥能源署 https://ens.dk/analyser-og-statistik/data-oversigt-over-energisektoren 下載「Vinddata」與「Parkproduktion」兩個 Excel（約每 2 個月更新），接在最後
python tools/build_generation.py uswtdb_V9_1_20260928.csv f923_2023.zip f923_2024.zip f923_2025.zip august_generator2026.xlsx \
  data/global/sources/taipower_renewable_generation_17140.csv data/global/sources/taipower_wind_stations_17141.csv vinddata.xlsx parkproduktion.xlsx
```

### 本站對資料的修正（皆記錄在資料檔與網站「資料來源」中）

- 台灣 2005–2025 年陸域／離岸改採經濟部能源署《2025 能源統計手冊》表 3-6 官方年表（2025 年底陸域 930.3、離岸 3,586.9 MW）。
  原資料把分批併網中的離岸風場算成陸域（例如 2023 年陸域 2,064 MW，實際約 0.9 GW）
- 日本 2011–2025 年改採日本風力發電協會（JWPA）年末累積導入量（2025 年底 6,434.2 MW；洋上＝本格洋上＋セミ洋上），原資料為 IRENA（6,249 MW）
- 法國 2025 年陸域／離岸改採統計處 SDES 風電儀表板（2026 年第二季）的 2025 年底併網容量 23,992／2,008 MW；原資料為 IRENA 陸域 24,155、離岸 1,500 MW
  （漏了 2025 年全部併網的 Yeu-Noirmoutier 500 MW）
- 台灣、日本風場逐場稽核：分批併網的大型離岸風場以全場完工年計入（允能雲林 2025、大彰化 1&2a 與彰芳暨西島 2024），
  2025 年底尚未全場商轉者列為興建中（海龍 2&3、大彰化 2b&4、台電離岸二期、北九州響灘、五島浮體式）；日本另補 5 座セミ洋上／港灣風場、
  標記已除役的實證機，並補上 GEM 未收錄的 100 座小型風場（NEDO 各縣清單、windfarm.work），修正 22 筆 GEM 錯置的座標
- 海洋風電一期、海能風電（Formosa 2）年份對齊實際併網／商轉時間
- 國界改以 Natural Earth 1:50m 重建（原資料缺澳洲本土多邊形）；克里米亞依聯合國大會第 68/262 號決議劃歸烏克蘭，
  與風場資料（GEM 將克里米亞風場列於烏克蘭）一致
- GEM 同一場址下相距 25 km 以上的分期分開標示，不取平均座標（原本會把跨州專案平均到錯誤位置）；
  3 筆可由專案名稱確認的座標錯誤已修正（宮城加美、珠洲第 1、珠洲第 2 期），1 筆國別與座標不符的 WRI GPPD 舊資料已排除
- 2026 年 9 月第一階段資料清理：逐筆查證後刪除 77 筆重複、從未建成或查無此場的紀錄（例：泰國並不存在的 600 MW「Jhimpir」、
  從未獲准的挪威 Hordavind 682 MW、與逐場資料重複的中國達坂城等整區彙總、羅馬尼亞放在國土中心卻查無建成紀錄的 15 座），
  修正 52 筆的座標、容量、年份、分期或狀態；比對名稱時先把繁體轉成簡體並比較分區代號（江蘇等地同一座離岸風場不再重複收錄）；
  共用省或國家中心代用座標的風場在地圖上示意排開並註明。逐筆理由與出處見 [docs/data-cleanup.md](./docs/data-cleanup.md)
- 2026 年 9 月比對 OSPAR 離岸風場資料時，另刪除 2 筆重複：GEM 的比利時「C-Power」整場合計（與 Thornton Bank 一、二、三期重複），
  以及法國 Saint-Brieuc 座標偏離約 170 km 的第二筆
- 2026 年 9 月查歐洲離岸風場水下基礎（第 2 步）時，另以 26 條規則更正：英國 Sofia、法國 Calvados 原本誤列為 2025 年營運中（其實仍在興建）；
  Dogger Bank A 改依 WindEurope 統計逐年併網；Arklow Bank、Utgrunden I、Irene Vorrink 與 Hooksiel 試驗機已停機或拆除；
  Yeu-Noirmoutier 為 488 MW；刪除挪威三個從未興建的示範場、METCentre 測試場的許可容量與 4 筆重複；8 座風場的座標移到實際位置
- 2026 年 9 月查浮動式風場（水下基礎第 3 步）時，另以 20 條規則更正：法國 EFGL、EolMed 與日本五島洋上風場 2026 年才開始運轉
  （時間軸到 2025 年，先列為興建中並註明）；TetraSpar 2026 年除役；Kincardine 現為 47.5 MW；刪除 BiMEP 測試場容量、
  從未興建的 Dounreay Trì、已停止的南韓 Bandibuli 與 4 筆重複；2026 年整理的規劃清單中已停止的專案不再收錄（`PIPE_DROP`）
- 2026 年 9 月查台灣、日本、韓國、美國的水下基礎（第 4 步）時，另以 24 條規則更正：Sunrise Wind 與神栖、全南海上風電 1 號的重複紀錄
  合併為一筆；Vineyard Wind 1、靈光落月 2025 年底都還沒全場運轉（先列為興建中並註明）；CVOW 商業案完工延到 2027 年底；
  Revolution Wind 704 MW、Empire Wind 810 MW；瀨棚停機、北九州沖實證機 2019 年撤除；神栖一、二期與 Eurus 秋田港的座標移到實際位置
- 2026 年 9 月依使用者整理的逐案覆核（《全球離岸風場資料庫｜亞洲查核版 v2》），另以 6 條規則更正：東海大橋一期與青洲六、Hollandse Kust Zuid 第 4 區的
  重複紀錄合併；青洲六為 1,000 MW；響水近海 202 MW 屬三峽；福清興化灣二期為 280 MW、2021 年全容量併網
- 2026 年 9 月底起，查證中國、越南離岸風場的水下基礎與尺寸時，陸續以清理規則更正重複、從未建成、狀態、容量、機型與座標
  （例：三峽大豐 800 MW 的四個場址在 GEM 各有一筆、象山塗茨的併網年、莊河 IV2 已營運）；目前共 885 條規則，逐條理由與出處見 [docs/data-cleanup.md](./docs/data-cleanup.md)
- 英文國名：澳洲原被標成同屬 AUS 代碼的「Ashmore and Cartier Is.」，已改正

> 國家概況的「逐場資料覆蓋率」＝已逐場標示的營運中容量 ÷ 國家年底統計（台灣 2025 年約 89%、日本約 87%），差額明白列出，
> 不補虛構風場。其他國家的風場來自 GEM，容量為全場裝置容量，加總可能略高或略低於國家統計。
> 全部國家的明細、疑似重複與待查證項目見 [docs/data-coverage.md](./docs/data-coverage.md)。

## 資料來源與授權

> **資料並非完全準確**：本站整合公開資料並持續逐筆查證，但有些位置、年份與數值是代用或估計的（共用代用座標、商轉年不詳、逐場資料比國家統計少、估計年發電量等），
> 有些還沒查證或還沒收齊（部分離岸風場的水下基礎與輪轂高度、港口、事件與照片）。網站上的說明在地球儀「資料來源」視窗最上面（依目前資料即時計算）與風電知識第 13 章「資料的限制」；
> 逐筆修正與理由見 [docs/data-cleanup.md](./docs/data-cleanup.md)，各國覆蓋見 [docs/data-coverage.md](./docs/data-coverage.md)。

**台灣即時**

- 即時發電：政府資料開放平臺「台灣電力公司各機組發電量即時資訊」（[資料集 8931](https://data.gov.tw/dataset/8931)），
  端點 `https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json`，每 10 分更新
- 歷史存檔：政府資料開放平臺「台灣電力公司_各機組過去發電量」（[資料集 37331](https://data.gov.tw/dataset/37331)），
  由 `backfill_history.py` 透過 data.gov.tw metadata API 動態解析；為季度回溯檔，歷史機組採簡名（如「中港」＝台中港）
- 電力供需：台電「本日電力資訊」原始資料（無 opendata 授權鏡像），備援為政府資料開放平臺
  「台灣電力公司過去電力供需資訊」（[資料集 19995](https://data.gov.tw/dataset/19995)）
- 風速參考：中央氣象署自動氣象站觀測（[opendata.cwa.gov.tw](https://opendata.cwa.gov.tw/)），
  取各風場最近測站當沿海參考值，非風機輪轂高度實測
- 離岸風場開發歷程：整理自台電、沃旭能源、CIP、達德能源 wpd、中鋼集團、海龍等開發商官方新聞稿與媒體報導，
  逐條附來源查證，查無精確日期者不臆測填補
- 授權：政府資料開放授權條款－第 1 版

**國外即時**

- 澳洲東部電網：AEMO NEMWeb [Dispatch_SCADA](https://nemweb.com.au/Reports/Current/Dispatch_SCADA/)（每個發電機組每 5 分鐘的實測出力）；
  資料來源：Australian Energy Market Operator（AEMO）；機組清單：AEMO NEM Registration and Exemption List
- 亞伯達：AESO [Current Supply Demand](http://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet) 報表。
  © 2026 THE INDEPENDENT SYSTEM OPERATOR ("ISO"). All rights reserved；依 [AESO 網站條款](https://www.aeso.ca/legal/)供非商業與教育用途，數值未修改
- 安大略：IESO [Generators Output and Capability](https://reports-public.ieso.ca/public/GenOutputCapability/) 報表；機組名稱對照：
  IESO [Transmission-Connected Generation](https://www.ieso.ca/en/Power-Data/Supply-Overview/Transmission-Connected-Generation)。
  Copyright © 2004-2022 Independent Electricity System Operator, all rights reserved. This information is subject to the Terms of Use set out in the IESO's website (www.ieso.ca).
- 大不列顛：Elexon BMRS [Generation by fuel type](https://bmrs.elexon.co.uk/generation-by-fuel-type)（FUELINST，每 5 分鐘；只含電網營運計量的風電，大部分接在配電網的風機不在其中）。
  Contains BMRS data © Elexon Limited copyright and database right 2026；依 [BMRS 資料授權](https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/)
- 德國：Bundesnetzagentur | [SMARD.de](https://www.smard.de/)（陸域、離岸每 15 分鐘的發電量，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；本站換算成平均功率並計算每小時平均）
- 法國：RTE éCO2mix 全國即時資料，經 [ODRÉ](https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/) 取得（每 15 分鐘，[Licence Ouverte v2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/)）
- 丹麥：Energinet（[www.energidataservice.dk](https://www.energidataservice.dk/tso-electricity/PowerSystemRightNow)）PowerSystemRightNow（每分鐘，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；本站計算每小時平均）
- 美國德州：ERCOT [Fuel Mix](https://www.ercot.com/gridmktinfo/dashboards/fuelmix) 儀表板（每 5 分鐘，附當月風電容量）；Source: Electric Reliability Council of Texas（依 [ERCOT 使用條款](https://www.ercot.com/help/terms)）
- 美國加州：California ISO [Today's Outlook](https://www.caiso.com/todays-outlook/supply)（每 5 分鐘）；Source: California ISO（依 [CAISO 使用條款](https://www.caiso.com/privacy-terms-of-use)）
- 比利時：Elia 開放資料 [ods086](https://opendata.elia.be/explore/dataset/ods086/)／ods031（每 15 分鐘，實測並推估到全部容量，附監測容量）；依 [Elia Open Data Licence](https://opendata.elia.be/pages/licence/)（CC BY 4.0），本站加總各區並計算每小時平均
- 波蘭：PSE 首頁「Mapa KSE」地圖的即時快照（[www.pse.pl](https://www.pse.pl/home)；網頁小工具的資料端點，沒有公開文件），趨勢的較早時段用 PSE 報表 API 次日公布的每 15 分鐘風電總發電量；依 [PSE 公共資訊再利用條件](https://www.pse.pl/bip/ponowne-wykorzystanie-informacji-publicznej)標示「Informacja pozyskana ze strony www.pse.pl, wg. stanu strony na dzień [日期], przetworzona w części」
- 評估與未接入的國家見 [docs/live-data-sources.md](./docs/live-data-sources.md)

**全球發展**

- 國家總容量 2000–2025：Our World in Data／IRENA Renewable Capacity Statistics
- 離岸容量 1991–2025：WFO Global Offshore Wind Report、GWEC、EWEA／WindEurope 歷年統計（逐項來源列在網站「資料來源」）
- 1980–1999 早期資料：BTM Consult、IEA Wind 年報、丹麥能源署、美國 EIA 等各國能源統計（多數國家為估計值，僅供趨勢觀察）
- 台灣國家序列：[經濟部能源署《2025 能源統計手冊》表 3-6](https://ea01.moeaea.gov.tw/a0303/02/attachments/handbook/2025/docs/3-06.%E5%86%8D%E7%94%9F%E8%83%BD%E6%BA%90%E7%99%BC%E9%9B%BB%E8%A3%9D%E7%BD%AE%E5%AE%B9%E9%87%8F(114).pdf)；
  日本國家序列：[JWPA 年末累積導入量](https://jwpa.jp/information/12660/)
- 風場層：附件「全球風電發展觀察地圖」精選風場（台灣、日本經逐場稽核）、WRI Global Power Plant Database v1.3（CC BY 4.0）、
  Global Energy Monitor「[Global Wind Power Tracker](https://globalenergymonitor.org/projects/global-wind-power-tracker/)」2026 年 2 月版（CC BY 4.0）、
  2026 年 9 月整理的規劃中重點專案與日本風場清單（NEDO、windfarm.work、營運商資料）、德國聯邦網路局「市場主資料登錄」MaStR
  （© Bundesnetzagentur | Marktstammdatenregister，Datenlizenz Deutschland – Namensnennung – Version 2.0；德國每部風機與 GEM 沒收錄的陸域風場）
- 開發管線各國總量：GEM Global Wind Power Tracker 2026 年 2 月版
- 時間軸「2026（最新可得）」：8 國官方或產業統計（台灣能源署、美國 EIA-860M、中國國家能源局、印度 MNRE、巴西 ANEEL、德國 Deutsche WindGuard、法國 SDES、英國 DESNZ），
  逐國出處、資料月份與說明寫在 `tools/latest_wind.py`；各國平均容量因數（估計年發電量用）：[Ember Yearly Electricity Data](https://ember-energy.org/data/yearly-electricity-data/)（CC BY 4.0）
- 風機位置：美國 [USWTDB](https://energy.usgs.gov/uswtdb/)（USGS、LBNL、American Clean Power Association，公有領域）；德國 MaStR（見上）；
  其他國家 © [OpenStreetMap](https://www.openstreetmap.org/copyright) 貢獻者（ODbL 1.0，衍生的 `data/global/turbines_osm.json` 同樣以 ODbL 分享）
- 水下基礎：OSPAR Offshore Renewable Energy Developments 2024（CC0）；其他逐場出處（開發商、施工廠商、政府文件、產業新聞）寫在 [docs/foundations.md](./docs/foundations.md)
- 重大事件與事故、港口：逐筆附主管機關、業主或產業新聞的出處（[docs/events.md](./docs/events.md)、`data/global/ports.json`）
- 國界與地形：Natural Earth（公有領域）；衛星底圖：NASA Earth Observatory Blue Marble Next Generation（公有領域）
- 平均風速底圖：Global Wind Atlas 3（DTU 丹麥技術大學、世界銀行集團，CC BY 4.0）
- 海域：專屬經濟區界線取自 Flanders Marine Institute（VLIZ）[Marine Regions](https://www.marineregions.org/) Maritime Boundaries Geodatabase 第 12 版（2023，CC BY 4.0，已簡化，不具法律效力）；
  台灣離岸風電潛力場址取自經濟部能源署[台灣離岸風電潛力場址地理資訊](https://data.gov.tw/dataset/36681)（政府資料開放授權條款）；
  日本促進區域：出典：[資源エネルギー庁ウェブサイト](https://www.enecho.meti.go.jp/category/saving_and_new/saiene/yojo_furyoku/kassei_sangyou.html)の促進区域指定の公告を加工して作成（公共データ利用規約 PDL1.0）；
  北海周邊國家的規劃區（皆已簡化）：荷蘭 [Rijkswaterstaat, Aangewezen windgebieden](https://data.overheid.nl/en/dataset/46780-aangewezen-windgebieden-nwp)（CC0）、
  德國 [Quelle: © BSH 2025 (Flächenentwicklungsplan 2025), vereinfacht](https://gdi.bsh.de/en/mapservice/Site-Development-Plan-in-the-German-Maritime-Area-2025-WFS)（GeoNutzV）、
  比利時 [RBINS, Belgian Marine Data Centre: 2026 Belgian MSP – Energy, cable and pipeline zones](https://doi.org/10.24417/bmdc.be:dataset:3121)（CC BY 4.0）、
  丹麥 [Søfartsstyrelsen, Danmarks Havplan af 28. juni 2024](https://havplan.dk/)（CC BY 4.0）、
  蘇格蘭 [Contains public sector information licensed under the Open Government Licence v3.0, from Crown Estate Scotland](https://www.arcgis.com/home/item.html?id=b9c7d514362f40ceb3fe299b47aeb8b3)、
  挪威 [Contains data under the Norwegian licence for Open Government data (NLOD) distributed by NVE](https://kart.nve.no/enterprise/rest/services/Mapservices/HavvindOnline/MapServer)
- 放大後的圖磚：Esri World Imagery（Esri, Vantor, Earthstar Geographics）、Esri World Hillshade（Esri, USGS, NASA 等），依 Esri 使用條款顯示出處
- 此刻的風：NOAA／NCEP 全球預報系統 GFS 離地 10 m 風場（公有領域），每 6 小時由排程更新
- 風場實測年發電量（「發電表現」與風場卡片）：美國能源資訊署 EIA-923、EIA-860M（公有領域）；台灣電力公司「自建之各類再生能源發電量」與「風力發電站資料」
  （政府資料開放平臺 17140、17141，政府資料開放授權條款）；丹麥能源署 [Energistyrelsen, Stamdataregister for vindkraftanlæg](https://ens.dk/analyser-og-statistik/data-oversigt-over-energisektoren)
  （Vinddata、Parkproduktion，2026 年 10 月取用；依[能源署資料使用條款](https://dataforsyningen.dk/asset/PDF/rettigheder_vilkaar/Energistyrelsen%20-%20Vilk%C3%A5r%20for%20brug%20af%20data.pdf)標示機關、資料集與取用時間）；
  澳洲能源市場營運機構 [AEMO, MMS Data Model](https://nemweb.com.au/Data_Archive/Wholesale_Electricity/MMSDM/)（DISPATCH_UNIT_SCADA、DUDETAIL 月檔；資料來源：Australian Energy Market Operator，
  依 [AEMO 版權許可](https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions)標示）
- 風場照片：人工核對的 Wikimedia Commons 照片（`tools/farm_photos.py` → `tools/build_photos.py` → `data/global/photos.json`，每張的作者與授權寫在卡片上）；
  其餘風場與簡介瀏覽時即時查詢 Wikipedia／Wikimedia Commons（各圖授權依原頁面）
- 程式庫：three.js r128（MIT）、Leaflet 1.9.4（BSD-2）

風機數量、座標、開發商等專案資訊為公開資料整理，座標為概略位置。

## 開發者與版權

- 開發與維護：**國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室**（National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu）
- 網站程式、設計與文字 © 2026 劉瑞弘研究室；各項資料依上列來源的授權使用（政府資料開放授權條款、CC BY 4.0、公有領域等）。
- 發現資料錯誤或有更好的來源，歡迎在 [GitHub](https://github.com/dofliu/windfarmTaiwan/issues) 回報。
