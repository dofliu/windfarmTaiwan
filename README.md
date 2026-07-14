# 風電風情 · Taiwan Wind Watch

[English](./README.en.md) ｜ 中文（本頁）

台灣風力發電即時資訊網站。以水庫水情般的「出力量柱」呈現全台 30 個風力機組／風場的即時發電狀況，
含衛星地圖、逐風場開發／營運歷程、長期趨勢與全國電力供需脈絡，協助綠能公開資訊揭露。

線上：`https://dofliu.github.io/windfarmTaiwan/`

後續規劃與待辦見 [ROADMAP.md](./ROADMAP.md)、[TODO.md](./TODO.md)。

## 功能

導覽列五個分頁：

- **儀表** — 即時總覽（全國風電出力、可用率、電網備轉容量率與風電對電網的貢獻、今日發電量估算）
- **總覽** — 全部風場一次看完的卡片牆
- **數據** — 排行長條／佔比圓環／**長期趨勢**（官方回溯 90 天日曆熱圖＋亮點卡片，可切換全部或單一機組）
- **地圖** — Leaflet 衛星地圖，點選風場看即時出力
- **資訊** — 風場逐一的開發歷程、政策進度、常見迷思與 Q&A

每座風場的抽屜式詳情卡含即時出力趨勢、鄰近測站風速（參考值）、規格，以及**開發與營運歷程時間軸**——
15 座離岸風場已深化為查證過的真實里程碑（環評、財務結案、動工、併網、商轉等，多數精確到年/月）。

右上角「分享」可產生含即時數據的圖卡，含醒目的資料時間徽章（含年份，避免圖卡脫離網站情境後被誤認為當下數據）。

## 架構

```
GitHub Actions (每 15 分鐘 cron) ── taipower_wind_scraper.py ──► wind_realtime.json / wind_history.json / grid_status.json ──┐
GitHub Actions (每週一 cron)     ── backfill_history.py      ──► wind_history_archive.json / wind_archive_daily.json ──────┤
                                                                                                                            ├─► commit 回 repo
GitHub Pages 服務同一 repo：index.html + 上述 JSON ◄───────────────────────────────────────────────────────────────────────┘
瀏覽器讀 index.html → fetch 各 JSON（同網域，無 CORS）
```

## 檔案

- `index.html` — 單檔前端（Leaflet 衛星地圖、儀表、抽屜式風場詳情、長期趨勢圖表、電網狀態列、分享圖卡）
- `taipower_wind_scraper.py` — 每 15 分鐘執行：抓台電開放資料、解析風力 30 機組 → `wind_realtime.json`；
  滾動累積 7 天歷史 → `wind_history.json`；同時抓電力供需即時報表 → `grid_status.json`
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
- `.github/workflows/scrape.yml` — 每 15 分鐘自動執行 scraper 並 commit
- `.github/workflows/backfill.yml` — 每週一自動累積官方回溯存檔；可手動觸發（含 dry_run 選項）
- `DEPLOY.md` — 詳細部署方案（GitHub Pages / Cloudflare Worker / 自架主機）
- `ROADMAP.md` / `TODO.md` — 已知限制、後續規劃與待辦事項

## 啟用步驟（只剩這些要你做）

1. 推上來後，到 **Settings → Pages → Source 選 `main` / `(root)`** 存檔，即啟用 Pages。
2. 到 **Actions** 分頁，手動跑一次 `scrape-taipower-wind`（Run workflow）確認 `wind_realtime.json` 會被更新。
3. 開 `https://dofliu.github.io/windfarmTaiwan/`，右上角應顯示綠點「即時」。

> 倉庫已附真實種子資料，所以 Pages 一啟用、即使 Actions 還沒跑，畫面就是即時模式。

## 注意事項

- 用 **public repo**：Actions 分鐘數免費無限。
- GitHub 排程不保證準時（常延遲數分鐘），台電本就每 10 分更新，足夠。
- repo 連續 60 天無活動，排程會被自動停用；每月手動觸發一次即可維持。
- 每次更新會 commit 一筆，git 歷史會累積（功能無礙）。若要避免，可改用 Cloudflare Worker Cron（見 `DEPLOY.md`）。

## 資料來源與授權

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
- 風機數量、座標、開發商等專案資訊為公開資料整理，座標為概略位置。
