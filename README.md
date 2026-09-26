# 風電風情 · Taiwan Wind Watch

[English](./README.en.md) ｜ 中文（本頁）

台灣風力發電即時資訊 × 全球風電發展 1980–2025。一個網站兩種尺度：

- **台灣此刻**：以水庫水情般的「出力量柱」呈現全台 30 個風力機組／風場的即時發電，資料直接對接台電與政府開放資料。
- **全球 45 年**：3D 地球儀重播 1980–2025 年各國風電成長，可一路放大到單一風場（約 2.3 萬座，含興建中與規劃中專案），
  並以 12 章「風電知識」說明歷史、技術、各國發展與台灣的位置。

線上：`https://dofliu.github.io/windfarmTaiwan/`

後續規劃與待辦見 [ROADMAP.md](./ROADMAP.md)、[TODO.md](./TODO.md)；各國風場資料覆蓋率與待查證項目見
[docs/data-coverage.md](./docs/data-coverage.md)，逐筆刪除或修正的風場紀錄與理由見 [docs/data-cleanup.md](./docs/data-cleanup.md)；
其他國家即時發電資料的可行性評估見 [docs/live-data-sources.md](./docs/live-data-sources.md)。

**單檔版**：[下載 windfarmTaiwan-standalone.html](https://dofliu.github.io/windfarmTaiwan/standalone/windfarmTaiwan-standalone.html)
（約 6 MB），存到電腦後直接用瀏覽器開啟即可，不需架站；詳見下方「單檔版」。

開發者：國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室（National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu）

## 功能

導覽列四個頁面（網址以 `#/` 路由，可直接分享）：

- **首頁** `#/home` — 台灣即時總出力與全球 1980–2025 累計容量並排；台灣在全球的位置；三個關鍵里程碑（點了直接飛到地球儀現場）
- **台灣即時** `#/live` — 原即時站的全部功能：
  - 儀表 — 全國風電出力、可用率、電網備轉容量率與風電貢獻、今日發電量估算、分組／篩選的機組量柱
  - 風場牆 `#/live/wall`、數據 `#/live/charts`（排行／佔比／分布、官方回溯 90 天長期趨勢）、地圖 `#/live/map`（Leaflet 衛星地圖）
  - 每座風場的抽屜式詳情（即時趨勢、鄰近測站風速、規格、查證過的開發與營運歷程）；可用 `#/live?farm=<id>` 直接開啟
  - 右上角「分享」產生含資料時間徽章的即時圖卡
- **全球發展** `#/global` — 3D 地球儀（three.js，只在進入此頁才載入，離開即停止繪圖）：
  - 各國陸域／離岸**年底累計裝置容量**逐年動畫，長條圖排名一律以 **MW** 顯示；可切換地圖／地圖＋長條／長條排名、3D 地球／2.5D 平面
  - **風場層**：合併附件精選風場與 Global Energy Monitor 全球風電追蹤（2025-02），營運中約 1.5 萬座；
    選一個國家就畫出該國全部風場，每座風場以一支風機代表（放大後也一樣）；點選風場時才依機組數量畫出它的全部風機
  - **規劃中圖層**（虛線環）：興建中／前期開發／已宣布約 7,850 案，越亮越接近完工；可用「規劃中」按鈕開關。
    「規劃」分頁依狀態與預計商轉年列出範圍內所有專案，並附 GEM 2026-02 各國開發管線總量；點選專案時以半透明風機顯示預定配置
  - **地貌底圖**：地形（Natural Earth 陰影地形＋海底地形）／衛星（NASA Blue Marble）／簡潔；放大後自動疊上 Esri 山影或衛星影像圖磚
  - 國家概況（歷年曲線、排名、10 年成長、最大／最早風場、逐場資料覆蓋率、規劃中統計、主要國家簡介；台灣、日本附官方統計稽核標記）、
    里程碑、可搜尋的風場清單
  - 導覽模式、深連結（例：`#/global?r=TWN&y=2020`、`#/global?ms=Horns%20Rev%201`、`#/global?f=Hai%20Long%202%20%26%203`）
  - **全球風場搜尋與篩選**：工具列「🔍 搜尋」或按 / 鍵，依名稱、中文名、開發商、機型、國名搜尋全部約 2.3 萬座風場，
    依狀態、類型（陸域／離岸／浮動式）、容量、年份篩選；範圍跟著「範圍」選單（全世界、洲或國家）。有條件時地圖只顯示符合的風場
    （全球視角也看得到），條件寫進網址可以分享（例：`#/global?fty=fl&fst=op` 全球營運中的浮動式風場）
  - **港口圖層**（⚓）：離岸風電的組裝出港、水下基礎與風機零組件製造、海纜、浮動式組裝與運維港口 55 個（15 國，2026-09 人工整理，
    每港附出處）；全球視角為小點，拉近才有圖示與名稱。港口卡片列出角色、服務過的風場（可點選切換）與出處，可以搜尋，
    也有「港口」分頁（例：`#/global?port=twn-taichung`）
  - **風場卡片**：點風場可看維基百科照片與簡介；在國內的地位（依時間軸年份的容量排名與占全國風電裝置容量比例）、
    分期時間軸、附近風場（30 km 內）與同開發商的其他風場（可直接點選切換）；衛星地圖、OpenStreetMap、
    風能資源地圖（Global Wind Atlas）、Wikidata 等連結；「複製此風場連結」與「回報資料錯誤」（開啟預填的 GitHub issue）
  - 台灣風場與即時資料連動：點台灣風場可看到台電此刻的出力並跳到即時詳情
  - **澳洲、加拿大即時出力**：澳洲東部電網（AEMO，每 5 分鐘實測）、亞伯達（AESO，約 1 分鐘）與安大略（IESO，每小時）
    約 150 座風場顯示此刻出力；國家概況有各電網總出力與 48 小時趨勢。時間軸在最新年份時，有即時資料的風場外圈為綠色、
    葉片轉速依此刻出力
  - 無 WebGL 的裝置自動改用長條圖排名
- **風電知識** `#/learn` — 12 章：從 1888 年 Brush 風機到 2025 年、陸域與離岸、浮動式、風機大型化、亞洲崛起、台灣的離岸風電、
  為什麼要發展風電、名詞解釋與完整資料來源；圖表皆由同一份全球資料集繪製，每章都能跳到地球儀重播那一段

全站中英雙語（右上角切換，記在瀏覽器）。

## 架構

```
GitHub Actions (每 2 小時 cron)  ── taipower_wind_scraper.py ──► wind_realtime.json / wind_history.json / grid_status.json ──┐
                                 ── intl_wind_scraper.py    ──► data/live/intl_realtime.json（澳洲、加拿大）──────────────────┤
GitHub Actions (每週一 cron)     ── backfill_history.py      ──► wind_history_archive.json / wind_archive_daily.json ──────┤
                                                                                                                            ├─► commit 回 repo
tools/*.py（手動、低頻：資料改版時才跑） ──► data/global/*.json、assets/img/globe/*.jpg ───────────────────────────────────┤
GitHub Actions（push 到 main 且改到網站程式或全球資料）── tools/build_standalone.py ──► standalone/*.html ─────────────────┤
GitHub Pages 服務同一 repo：index.html + assets/ + data/ + 上述 JSON ◄──────────────────────────────────────────────────────┘
瀏覽器讀 index.html → 依頁面延遲載入模組與資料（同網域，無 CORS）
```

純靜態網站、沒有建置步驟：`index.html` 是外殼，`assets/js/` 各頁模組以 `WW.registerPage()` 向 hash 路由註冊。
地球儀頁的 three.js（約 600 KB）、底圖與 2.7 MB 的風場資料只在第一次進入 `#/global` 時下載。

## 檔案

- `index.html` — 網站外殼：頂部導覽、四個頁面的版面與雙語文案、抽屜與提示
- `assets/css/site.css` — 設計系統（深色資料風格、色票、元件、響應式）；`assets/css/globe.css` — 地球儀專用樣式
- `assets/js/core.js` — 共用核心：雙語、hash 路由、延遲載入、資料快取、數字格式、分享
- `assets/js/live.js` — 台灣即時（`FARMS` 30 個機組／風場的規格與開發歷程、即時／歷史／電網資料讀取、儀表、風場牆、圖表、地圖、抽屜、分享圖卡）
- `assets/js/charts.js` — 輕量 SVG 圖表（折線、柱狀、橫條、散佈；含提示框與表格檢視）
- `assets/js/home.js`、`assets/js/learn.js` — 首頁與風電知識頁
- `assets/js/globe.js` — 3D 地球儀（改寫自「全球風電發展觀察地圖」wind-history-map v3）
- `assets/vendor/` — three.js r128 與 OrbitControls（MIT，原樣內附）
- `assets/img/globe/` — 地形／衛星底圖（4096×2048 與 2048×1024 兩種尺寸）
- `data/global/wind_global.json` — 國家逐年陸域／離岸容量 1980–2025、全球總量、里程碑、來源與註記（約 70 KB）
- `data/global/wind_farms.json` — 風場層級資料約 2.3 萬筆（營運中、規劃中、已除役）
- `data/global/world_borders.json` — 國界（Natural Earth 1:50m）
- `data/global/ports.json` — 離岸風電港口 55 個（人工整理、每港附出處；改完跑 `tools/qa_ports.py`）
- `data/global/sources/` — 合併前的精選風場（含台灣、日本稽核狀態）、2026 年整理的規劃中專案與日本風場清單、合併紀錄
- `tools/` — 全球資料與底圖的產生程式（見下方「全球資料更新」）；`tools/build_standalone.py` 產生單檔版、
  `tools/coverage_report.py` 產生資料覆蓋率報告、`tools/qa_farms.py` 檢查風場座標、`tools/qa_ports.py` 檢查港口資料
- `standalone/windfarmTaiwan-standalone.html` — 單檔版（自動產生，勿手動修改）
- `docs/` — 資料覆蓋率報告（`data-coverage.md`）、資料清理紀錄（`data-cleanup.md`）與其他國家即時資料來源評估（`live-data-sources.md`），各有英文版 `.en.md`
- `CLAUDE.md` — 專案慣例（文件中英對照、單檔版、資料更新與測試方式），給之後的開發者與 AI 參考
- `taipower_wind_scraper.py` — 約每 2 小時執行：抓台電開放資料、解析風力 30 機組 → `wind_realtime.json`；
  滾動累積 7 天歷史 → `wind_history.json`；同時抓電力供需即時報表 → `grid_status.json`
- `intl_wind_scraper.py` — 約每 2 小時執行：抓澳洲東部電網（AEMO）、亞伯達（AESO）、安大略（IESO）各風場的即時出力 →
  `data/live/intl_realtime.json`（含各電網 48 小時總出力）；任一來源失敗時保留上一次的數值並標示，不影響台灣資料
- `data/live/units.json` — 電網機組代碼 → 風場的對照表（`tools/build_live_units.py` 產生；安大略依 IESO 公布的設施對照人工核對）
- `wind_realtime.json` — 即時資料（由 Actions 自動更新）
- `wind_history.json` — 滾動 7 天歷史（scraper 即時累積，供前端趨勢線）
- `grid_status.json` — 全國電力供需即時報表（尖峰負載/供電能力/備轉容量率）。
  **實測限制**：主要來源從 GitHub Actions 執行會被 403（疑似 WAF 封鎖雲端 CI 網段），
  故實務上大多落到政府開放資料備援（每日更新，實測落後約 6 週），前端會誠實標示「非即時，截至 YYYY-MM-DD」，
  不與即時風力出力並列。欄位無法辨識或兩個來源皆失敗時不寫檔，前端該區塊自動隱藏，不顯示臆測值。
- `backfill_history.py` — 每週一執行：抓政府開放資料集 [37331「各機組過去發電量」](https://data.gov.tw/dataset/37331)，
  累積長期存檔 `wind_history_archive.json`（官方每 10 分鐘回溯值，不修剪）與每日摘要 `wind_archive_daily.json`
  （前端「數據 → 長期趨勢」讀這個，含逐機組明細）。
  **時效注意**：37331 為季度回溯檔，落後約 4–5 個月，補不到近 7 天趨勢窗的缺口，主要價值是長期趨勢分析。
  **口徑注意**：37331 只含台電**自有**風力機組，不含民營購電，與即時資料的全系統數值不可混用比較。
- `.github/workflows/scrape.yml` — 約每 2 小時自動執行 scraper 並 commit
- `.github/workflows/backfill.yml` — 每週一自動累積官方回溯存檔；可手動觸發（含 dry_run 選項）
- `.github/workflows/standalone.yml` — 網站程式或全球資料有變更時重建單檔版並 commit
- `DEPLOY.md` — 詳細部署方案（GitHub Pages / Cloudflare Worker / 自架主機）
- `ROADMAP.md` / `TODO.md` — 已知限制、後續規劃與待辦事項

所有說明文件都有英文版（`README.en.md`、`DEPLOY.en.md`、`ROADMAP.en.md`、`TODO.en.md`、`docs/*.en.md`）。

## 啟用步驟（只剩這些要你做）

1. 推上來後，到 **Settings → Pages → Source 選 `main` / `(root)`** 存檔，即啟用 Pages。
2. 到 **Actions** 分頁，手動跑一次 `scrape-taipower-wind`（Run workflow）確認 `wind_realtime.json` 會被更新。
3. 開 `https://dofliu.github.io/windfarmTaiwan/`，右上角應顯示綠點「即時」。

> 倉庫已附真實種子資料，所以 Pages 一啟用、即使 Actions 還沒跑，畫面就是即時模式。
> 本機預覽：在 repo 根目錄執行 `python3 -m http.server`，開 `http://localhost:8000/`（直接雙擊 `index.html` 會因 `file://` 無法讀取 JSON；
> 想直接雙擊開啟請用單檔版）。

## 單檔版（下載後直接開啟）

`standalone/windfarmTaiwan-standalone.html` 把整個網站（首頁、台灣即時、全球 3D 地球儀、風電知識）打包成一個約 6 MB 的 HTML：

- **下載**：網站頁尾或「風電知識 → 資料來源與方法 → 關於本站」的「下載單檔版 HTML」，
  或直接開 `https://dofliu.github.io/windfarmTaiwan/standalone/windfarmTaiwan-standalone.html` 另存。
- **連網時**：台灣即時資料直接向正式網站抓最新的（約每 2 小時更新），放大地球儀會載入 Esri 高解析圖磚，風場卡片會查維基百科。
- **離線時**：全球資料、約 2.3 萬筆風場、國界與 2k 地形／衛星底圖都在檔案裡，地球儀照常運作；台灣即時改顯示建置當下的資料，
  並標示「離線快照」。台灣即時的衛星地圖（Leaflet）需要連網。
- **更新**：push 到 `main` 且改到 `index.html`、`assets/`、`data/global/*.json` 時，GitHub Actions 會自動重建；
  本機也可以執行 `python3 tools/build_standalone.py`。分享按鈕在單檔版一律分享正式網站的網址。

## 注意事項

- 用 **public repo**：Actions 分鐘數免費無限。
- 排程約每 2 小時一次；GitHub 排程不保證準時（可能延遲或略過一兩次），本站不需要逐分即時，足夠。
- repo 連續 60 天無活動，排程會被自動停用；每月手動觸發一次即可維持。
- 每次更新會 commit 一筆，git 歷史會累積（功能無礙）。若要避免，可改用 Cloudflare Worker Cron（見 `DEPLOY.md`）。
- 瀏覽時會連到的第三方服務：cdnjs（Leaflet，僅地圖分頁）、Esri 圖磚（僅地球儀放大後）、維基百科 API（風場照片與簡介，查不到或離線時只顯示連結）。
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
# 3. 風場層（精選風場 × GEM 全球風電追蹤）
curl -LO https://raw.githubusercontent.com/GlobalEnergyMonitor/maps/main/trackers/wind/compilation_output/Wind-map-file-2025-02-04.csv
python tools/build_farms.py data/global/sources/farms_attachment.json Wind-map-file-2025-02-04.csv data/global/wind_farms.json
#    （會套用 tools/farm_cleanup.py 的逐筆清理規則，並輸出 docs/data-cleanup.md 與 .en.md）
python tools/qa_farms.py        # 座標健檢：列出落在國界外的風場
python tools/build_live_units.py # 澳洲、加拿大即時資料的機組→風場對照（需 openpyxl；新風場併網時重跑，並檢查「未對應」清單）
python tools/coverage_report.py # 資料覆蓋率報告：docs/data-coverage.md（中文）與 .en.md（英文）
python tools/qa_ports.py        # 港口資料健檢：欄位、國界內或離岸 15 km 內、出處、「服務過的風場」對得到風場名稱
# 4. 地貌底圖（需 Pillow + numpy；來源檔下載位置見程式說明）
python tools/build_basemaps.py world.topo.bathy.200412.3x5400x2700.jpg GRAY_50M_SR_OB.tif assets/img/globe
# 5. 單檔版（push 到 main 後 Actions 也會自動重建）
python tools/build_standalone.py
```

### 本站對資料的修正（皆記錄在資料檔與網站「資料來源」中）

- 台灣 2005–2025 年陸域／離岸改採經濟部能源署《2025 能源統計手冊》表 3-6 官方年表（2025 年底陸域 930.3、離岸 3,586.9 MW）。
  原資料把分批併網中的離岸風場算成陸域（例如 2023 年陸域 2,064 MW，實際約 0.9 GW）
- 日本 2011–2025 年改採日本風力發電協會（JWPA）年末累積導入量（2025 年底 6,434.2 MW；洋上＝本格洋上＋セミ洋上），原資料為 IRENA（6,249 MW）
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
- 英文國名：澳洲原被標成同屬 AUS 代碼的「Ashmore and Cartier Is.」，已改正

> 國家概況的「逐場資料覆蓋率」＝已逐場標示的營運中容量 ÷ 國家年底統計（台灣 2025 年約 89%、日本約 87%），差額明白列出，
> 不補虛構風場。其他國家的風場來自 GEM，容量為全場裝置容量，加總可能略高或略低於國家統計。
> 全部國家的明細、疑似重複與待查證項目見 [docs/data-coverage.md](./docs/data-coverage.md)。

## 資料來源與授權

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

**澳洲、加拿大即時**

- 澳洲東部電網：AEMO NEMWeb [Dispatch_SCADA](https://nemweb.com.au/Reports/Current/Dispatch_SCADA/)（每個發電機組每 5 分鐘的實測出力）；
  資料來源：Australian Energy Market Operator（AEMO）；機組清單：AEMO NEM Registration and Exemption List
- 亞伯達：AESO [Current Supply Demand](http://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet) 報表。
  © 2026 THE INDEPENDENT SYSTEM OPERATOR ("ISO"). All rights reserved；依 [AESO 網站條款](https://www.aeso.ca/legal/)供非商業與教育用途，數值未修改
- 安大略：IESO [Generators Output and Capability](https://reports-public.ieso.ca/public/GenOutputCapability/) 報表；機組名稱對照：
  IESO [Transmission-Connected Generation](https://www.ieso.ca/en/Power-Data/Supply-Overview/Transmission-Connected-Generation)。
  Copyright © 2004-2022 Independent Electricity System Operator, all rights reserved. This information is subject to the Terms of Use set out in the IESO's website (www.ieso.ca).
- 評估與未接入的國家見 [docs/live-data-sources.md](./docs/live-data-sources.md)

**全球發展**

- 國家總容量 2000–2025：Our World in Data／IRENA Renewable Capacity Statistics
- 離岸容量 1991–2025：WFO Global Offshore Wind Report、GWEC、EWEA／WindEurope 歷年統計（逐項來源列在網站「資料來源」）
- 1980–1999 早期資料：BTM Consult、IEA Wind 年報、丹麥能源署、美國 EIA 等各國能源統計（多數國家為估計值，僅供趨勢觀察）
- 台灣國家序列：[經濟部能源署《2025 能源統計手冊》表 3-6](https://ea01.moeaea.gov.tw/a0303/02/attachments/handbook/2025/docs/3-06.%E5%86%8D%E7%94%9F%E8%83%BD%E6%BA%90%E7%99%BC%E9%9B%BB%E8%A3%9D%E7%BD%AE%E5%AE%B9%E9%87%8F(114).pdf)；
  日本國家序列：[JWPA 年末累積導入量](https://jwpa.jp/information/12660/)
- 風場層：附件「全球風電發展觀察地圖」精選風場（台灣、日本經逐場稽核）、WRI Global Power Plant Database v1.3（CC BY 4.0）、
  Global Energy Monitor「[Global Wind Power Tracker](https://globalenergymonitor.org/projects/global-wind-power-tracker/)」2025 年 2 月版（CC BY 4.0）、
  2026 年 9 月整理的規劃中重點專案與日本風場清單（NEDO、windfarm.work、營運商資料）
- 開發管線各國總量：GEM Global Wind Power Tracker 2026 年 2 月版
- 國界與地形：Natural Earth（公有領域）；衛星底圖：NASA Earth Observatory Blue Marble Next Generation（公有領域）
- 放大後的圖磚：Esri World Imagery（Esri, Vantor, Earthstar Geographics）、Esri World Hillshade（Esri, USGS, NASA 等），依 Esri 使用條款顯示出處
- 風場照片與簡介：瀏覽時即時查詢 Wikipedia／Wikimedia Commons（各圖授權依原頁面）
- 程式庫：three.js r128（MIT）、Leaflet 1.9.4（BSD-2）

風機數量、座標、開發商等專案資訊為公開資料整理，座標為概略位置。

## 開發者與版權

- 開發與維護：**國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室**（National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu）
- 網站程式、設計與文字 © 2026 劉瑞弘研究室；各項資料依上列來源的授權使用（政府資料開放授權條款、CC BY 4.0、公有領域等）。
- 發現資料錯誤或有更好的來源，歡迎在 [GitHub](https://github.com/dofliu/windfarmTaiwan/issues) 回報。
