# 風電風情 · Taiwan Wind Watch

台灣風力發電即時資訊網站。以水庫水情般的「出力量柱」呈現全台 30 個風力機組／風場的即時發電狀況，
含衛星地圖與逐風場開發／營運資訊，協助綠能公開資訊揭露。

線上：`https://dofliu.github.io/windfarmTaiwan/`

## 架構

```
GitHub Actions (排程 cron) ── 跑 scraper ──► wind_realtime.json ──┐
                                                                  ├─► commit 回 repo
GitHub Pages 服務同一 repo:  index.html + wind_realtime.json ◄──┘
瀏覽器讀 index.html → fetch ./wind_realtime.json（同網域，無 CORS）
```

- `index.html` — 單檔前端（Leaflet 衛星地圖、儀表、抽屜式風場詳情）
- `taipower_wind_scraper.py` — 抓台電開放資料、解析風力 30 機組、產生 `wind_realtime.json`
- `wind_realtime.json` — 即時資料（由 Actions 自動更新；倉庫內已附一份 6/15 17:30 真實種子）
- `wind_history.json` — 滾動 7 天歷史（即時抓取累積 + 每日官方回填，供趨勢線）
- `backfill_history.py` — 以政府開放資料集 [37331「各機組過去發電量」](https://data.gov.tw/dataset/37331) 回填歷史缺口（Actions 排程被跳過時趨勢線不再破洞）
- `.github/workflows/scrape.yml` — 每 15 分鐘自動執行 scraper 並 commit
- `.github/workflows/backfill.yml` — 每日 03:23（台北）自動回填前一日缺口；首次啟用請手動跑一次

## 啟用步驟（只剩這些要你做）

1. 推上來後，到 **Settings → Pages → Source 選 `main` / `(root)`** 存檔，即啟用 Pages。
2. 到 **Actions** 分頁，手動跑一次 `scrape-taipower-wind`（Run workflow）確認 `wind_realtime.json` 會被更新。
3. 開 `https://dofliu.github.io/windfarmTaiwan/`，右上角應顯示綠點「即時」。

> 倉庫已附真實種子 `wind_realtime.json`，所以 Pages 一啟用、即使 Actions 還沒跑，畫面就是即時模式。

## 注意事項

- 用 **public repo**：Actions 分鐘數免費無限。
- GitHub 排程不保證準時（常延遲數分鐘），台電本就每 10 分更新，足夠。
- repo 連續 60 天無活動，排程會被自動停用；每月手動觸發一次即可維持。
- 每次更新會 commit 一筆，git 歷史會累積（功能無礙）。若要避免，可改用 Cloudflare Worker Cron。

## 資料來源與授權

- 即時端點：`https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json`
- 來源：政府資料開放平臺「台灣電力公司各機組發電量即時資訊」（[資料集 8931](https://data.gov.tw/dataset/8931)），每 10 分更新
- 歷史回填：政府資料開放平臺「台灣電力公司_各機組過去發電量」（[資料集 37331](https://data.gov.tw/dataset/37331)），
  資源網址由 `backfill_history.py` 於執行時透過 data.gov.tw metadata API 動態解析，回填每 10 分鐘官方回溯值
- 授權：政府資料開放授權條款－第 1 版
- 風機數量、座標、開發商等專案資訊為公開資料整理，座標為概略位置。
