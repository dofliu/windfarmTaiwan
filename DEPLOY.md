# 風電風情 — 部署說明

[English](./DEPLOY.en.md) ｜ 中文（本頁）

## 方案 A：GitHub Pages + GitHub Actions（免費、零維運，本 repo 目前採用）

GitHub Pages 只服務靜態檔；自動跑 Python 由 GitHub Actions 排程負責，
產生的 JSON commit 回 repo，Pages 再一起服務。
HTML 與 JSON 同網域，**沒有 CORS 問題**。

### 現有 Repo 結構

```
windfarmTaiwan/
├─ index.html                       # 網站外殼（四個頁面：首頁／台灣即時／全球發展／風電知識）
├─ assets/
│  ├─ css/                          # site.css（設計系統）、globe.css（地球儀）
│  ├─ js/                           # core / live / charts / home / learn / globe（依頁面延遲載入）
│  ├─ vendor/                       # three.js r128 + OrbitControls（只在全球發展頁載入）
│  └─ img/globe/                    # 地形／衛星底圖
├─ data/global/                     # 全球資料：國家逐年容量、風場層、國界（由 tools/ 產生，非排程）
├─ tools/                           # 全球資料、底圖、單檔版與覆蓋率報告的產生程式
├─ standalone/                      # 本機建置單檔版 HTML 的輸出位置（不進 git；正式檔案在 GitHub Release「standalone」）
├─ data/archive/                    # 台電官方回溯長期存檔（依月分檔 wind_history_archive_YYYY-MM.json）與各併網點的每日取樣 farm_daily.json
├─ docs/                            # 使用說明、資料覆蓋率報告、資料清理紀錄、水下基礎逐場清單、事件清單、即時資料來源評估（中英文各一份）
├─ data/live/                       # 澳洲、加拿大即時出力（intl_realtime.json，排程更新）與機組對照（units.json）
├─ taipower_wind_scraper.py         # 約每 30 分鐘：風力即時 + 電力供需即時
├─ intl_wind_scraper.py             # 約每 30 分鐘：澳洲東部電網、亞伯達、安大略的風場即時出力 → data/live/
├─ backfill_history.py             # 每週一：官方回溯歷史回填
├─ wind_realtime.json               # 風力即時資料（Actions 自動更新）
├─ wind_history.json                # 風力滾動 7 天歷史
├─ wind_archive_daily.json          # 長期存檔的每日摘要（前端長期趨勢圖讀這個）
├─ grid_status.json                 # 電力供需即時報表
└─ .github/workflows/
   ├─ scrape.yml                    # 約每 30 分鐘執行 taipower_wind_scraper.py 與 intl_wind_scraper.py
   ├─ backfill.yml                  # 每週一執行 backfill_history.py
   ├─ wind-now.yml                  # 每 6 小時執行 tools/fetch_gfs_wind.py（地球儀「此刻的風」，NOAA GFS）
   ├─ standalone.yml                # 網站程式或全球資料有變更時重建單檔版 HTML 並上傳到 Release「standalone」
   ├─ keepalive.yml                 # 每月 1 日重新啟用各排程，避免 60 天無活動被停用
   └─ pr-check.yml                  # 每個 PR 的自動檢查：Playwright 冒煙測試、語法、座標健檢、產生的文件、版本號（選用）
```

若要從零建立新專案（而非直接使用本 repo），步驟如下：

### 步驟

1. 建一個 **public** repo（公開 repo 的 Actions 分鐘數無限、免費；私有 repo 每月只有 2000 分鐘；目前約每 30 分鐘跑一次、每月約 1,400 次，私有 repo 會超量）。
2. 把 `index.html`、`assets/`、`data/`、`taipower_wind_scraper.py`、`intl_wind_scraper.py`、`backfill_history.py` 放進 repo 根目錄（`tools/` 只在更新全球資料時需要）。
3. 把 `.github/workflows/scrape.yml`、`backfill.yml`、`wind-now.yml`、`standalone.yml` 與 `keepalive.yml` 放進對應位置（`pr-check.yml` 只檢查 PR，可不放）。
4. 確認 `assets/js/live.js` 開頭的 `DATA_ENDPOINT` 等常數指向相對路徑（同網域，例如 `./wind_realtime.json`），
   若是直接 fork/clone 本 repo 則不需修改。
5. Settings → Pages → Source 選 `main` branch、`/ (root)`，存檔。
6. Actions 頁面手動跑一次 `scrape-taipower-wind`（workflow_dispatch），確認 `wind_realtime.json` 有被 commit；
   再手動跑一次 `backfill-taipower-wind-history`，確認長期存檔檔案有被建立。
7. 開 `https://<帳號>.github.io/<repo>/` → 右上角會由「模擬」轉成綠點「即時」。
8. 設定外部排程（下一節），讓即時資料約每 30 分鐘更新；不設定的話只靠 GitHub 排程，實際約 3–6 小時才更新一次。

### 外部排程：約每 30 分鐘觸發一次更新

GitHub 的 `schedule` 常延遲或略過（2026-10 實測：`scrape.yml` 設定每 2 小時，實際一天只跑 3–6 次，最長隔 6 小時），
台電的即時資料又沒有開放跨網域讀取（沒有 CORS 標頭），網頁不能直接向台電抓。所以用免費的外部排程服務，每 30 分鐘呼叫 GitHub API
觸發 `scrape.yml`（`workflow_dispatch`）。`scrape.yml` 原本的每 2 小時排程保留當備援。

1. **建立權杖**：GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token。
   Repository access 選 **Only select repositories** → `dofliu/windfarmTaiwan`；Permissions → Repository permissions → **Actions: Read and write**
   （其他都不用給）。有效期限最長一年，記下到期日，到期前換新的權杖。
2. **建立排程**（以 [cron-job.org](https://cron-job.org) 為例，免費，需要註冊帳號）：Create cronjob →
   - URL：`https://api.github.com/repos/dofliu/windfarmTaiwan/actions/workflows/scrape.yml/dispatches`
   - Schedule：Every 30 minutes
   - Headers（四列）：`Authorization: Bearer <權杖>`、`Accept: application/vnd.github+json`、`X-GitHub-Api-Version: 2022-11-28`、
     `Content-Type: application/json`（Advanced 的藍色提示「Add Content-Type header now」可一鍵加上）
   - Advanced → Request method：**POST**；Request body：`{"ref":"main"}`
   - 沒有 `Authorization` 或權杖碰不到這個 repo 時，GitHub 回 **404**（不是 401）；方法是 GET 也是 404。
   - API 版本 `2022-11-28` 已標示淘汰，**2028-03-10 停用**；之前要把 `X-GitHub-Api-Version` 換成 GitHub 當時支援的版本（回應標頭的 `Sunset` 寫著日期）。
3. 按 **Test run**，回應是 `204 No Content` 就成功；到 Actions 分頁會看到一筆 `workflow_dispatch` 觸發的 `scrape-taipower-wind`。
4. 權杖只存在排程服務裡，不要寫進 repo 或貼到別處；外洩時到 GitHub 撤銷再換新的。

同時觸發的兩次執行會排隊（`concurrency`），不會互相衝突。趨勢檔 `wind_history.json` 約每小時才多一筆（`HISTORY_GAP_MIN`），檔案不會因為抓得更勤而變大。

### 必須知道的限制（誠實說明）

- **GitHub 排程不精準**：`scrape.yml` 自己的排程是每 2 小時一次（偶數小時的第 18 分，UTC），但 GitHub 的 `schedule` 不保證準時，常延遲、尖峰時段常略過，
  實際一天只跑 3–6 次。所以主要靠上一節的外部排程（約每 30 分鐘），GitHub 排程只當備援；外部排程停了，更新就會退回幾小時一次。
- **60 天自動停用**：repo 連續 60 天無活動，排程 workflow 會被自動停用；而且用預設 `GITHUB_TOKEN` 的 bot commit 在某些情況不被算作「活動」。對策：本 repo 的 `keepalive.yml` 每月 1 日以 GitHub API（`PUT /repos/{owner}/{repo}/actions/workflows/{workflow}/enable`，權限 `actions: write`）
  重新啟用 `scrape.yml`、`backfill.yml`、`wind-now.yml` 與它自己，重設計時、不產生 commit。它自己也是排程，所以要一直在跑；萬一整個 repo 的排程都已被停用，
  要到 Actions 分頁手動按 **Enable workflow**。
- **commit 會累積**：約每 30 分鐘一次 commit，一年約 1.7 萬筆 git 歷史（每筆壓縮後約 6 KB，一年約 100 MB）。功能無礙，但 repo 會變肥；長期存檔已依月分檔（`data/archive/`），每週回填只改寫當月檔（每月約 0.6 MB），單檔版也改放 Release 不進 git，剩下的主要是即時資料的小 commit。可接受，或定期 squash，或改用方案 B。
- **電力供需即時來源會被 WAF 擋**：`grid_status.json` 的主要來源從 GitHub Actions 執行會回 403（詳見 `ROADMAP.md`「已知限制」），落到每日備援；若要真正即時，需要換到非雲端 CI 的執行環境（見方案 C）。
- Actions runner 在海外（Azure），抓台電公開 opendata 端點沒問題（伺服器端抓取不受 CORS 限制）。

### 維護

2026-09-27（v2.11.1）起專案進入維護期，之後依使用者的要求逐項補強（見 CHANGELOG）。以下都是自動進行的，不需要人手：

- `scrape-taipower-wind`：約每 30 分鐘（外部排程經 API 觸發，GitHub 每 2 小時的排程當備援；權杖到期前要換新，見「外部排程」）抓台電即時風力、電力供需、澳洲與加拿大逐場的即時出力，以及英國、愛爾蘭、德國、法國、丹麥、比利時、波蘭、韓國、巴西與美國德州、加州的風電總出力（來源見 [docs/live-data-sources.md](./docs/live-data-sources.md)），有變動就 commit；國外來源失敗不影響台灣資料。
- `backfill-taipower-wind-history`：每週一（台北週二清晨）累積台電官方回溯存檔。
- `wind-now`：每 6 小時（05:37、11:37、17:37、23:37 UTC）抓 NOAA GFS 最新一次的離地 10 m 風場（公有領域，需要 `eccodes` 解 GRIB2），寫成 `data/live/wind_now.webp`（約 50 KB）與 `wind_now.json` 後 commit，地球儀「此刻的風」讀它。
- `build-standalone`：`main` 的網站程式或全球資料有變更時重建單檔版並上傳到 GitHub Release「standalone」（固定標籤，覆蓋同名檔案；不 commit）。排程更新的即時資料不會觸發重建，
  所以單檔版的「離線快照」停在最後一次重建的時間。
- `keepalive`：每月 1 日 04:41 UTC 以 GitHub API 重新啟用上面三個排程（`scrape`、`backfill`、`wind-now`）與它自己，避免連續 60 天無活動被 GitHub 停用；不產生 commit。

**每月檢查一次（約 5 分鐘）**：60 天停用已由 `keepalive` 處理，這個檢查主要是抓出資料來源的問題（例如台電改了格式）。

1. 開網站，看頁首「即時 · 台電 MM/DD HH:MM」的資料時間。平常落後不到 1 小時；落後好幾個小時，多半是外部排程停了（權杖過期或排程服務停用），到排程服務看最近的回應碼（401 是權杖失效）。超過半天沒有前進，表示排程停了或抓取失敗；
   網站不會顯示錯誤，只會一直顯示最後一次抓到的資料。地球儀國家概況的「此刻」方塊與全球「各地此刻的風電出力」清單也有各來源的資料時間。
2. 到 GitHub 的 **Actions** 分頁，看各排程 workflow 最近一次是不是綠色（`keepalive` 每月一次；`pr-check` 只在有 PR 時執行；`build-standalone` 只在 `main` 改到網站或全球資料時執行）。若有 workflow 顯示
   「This scheduled workflow is disabled…」（連續 60 天沒有活動會被 GitHub 自動停用），按 **Enable workflow**。
3. 資料時間停住時，在 `scrape-taipower-wind` 按 **Run workflow** 手動跑一次，確認 `wind_realtime.json` 有新的 commit，失敗就看執行紀錄。

**常見狀況**：

- `scrape-taipower-wind` 失敗（紅色）：先看執行紀錄。台電端點改了格式時，要改 `taipower_wind_scraper.py` 的解析；
  國外來源失敗不影響台灣資料（該步驟設了 `continue-on-error`），前端會標示該電網資料未更新。
- 風場卡片的風速不見了：中央氣象署授權碼（repo 的 Actions secret `CWA_API_KEY`）過期或失效，到 Settings → Secrets and variables →
  Actions 更新即可；沒有授權碼時只略過風速，其他資料照常。
- 電力供需一直是幾週前的日期：這是已知限制（主要來源擋雲端 CI，只能用政府開放資料的每日備援），不是故障。備援資料集 19995 是每天一筆、**每月更新一次**（約每月 5 日，內容到上個月底；資料集說明寫「今年度至上月份為止」），所以最多落後約 5 週。
- 每年一次的全球資料更新（國家容量、風場層）不在排程裡，步驟見 README「全球資料更新」與 TODO「全球資料」。

---

## 方案 B：Cloudflare Pages + Worker Cron（更穩、無 commit 累積；你已有 Cloudflare 基礎設施）

- **Cloudflare Pages** 放靜態網站（`index.html`、`assets/`、`data/`）。
- **Cloudflare Worker + Cron Trigger**（每 10 分，排程比 GitHub 準）抓台電 opendata，
  把結果寫進 **KV** 或 **R2**，並以 Worker 端點回應 JSON（自行加上 CORS 標頭）。
- `DATA_ENDPOINT` 指向 Worker 的 URL。

優點：cron 準時、無 git 歷史膨脹、免費額度充足、與你現有 Cloudflare Tunnel 一致。
代價：Worker 是 JS/TS，需要把 `parse_wind` 的解析邏輯（約 30 行）移植成 JavaScript（量很小）。

---

## 方案 C：你的 RTX 4080 Win11 主機 + Cloudflare Tunnel

- Windows 工作排程器每 10 分跑 `taipower_wind_scraper.py` → 本機產生 `wind_realtime.json`
- 用 Cloudflare Tunnel 對外服務該 JSON（與 CloudDataProduction 同套作法）
- 缺點：主機需 24h 開機，對「政府宣導用公開站台」的穩定性較不理想。
- **額外好處**：非雲端 CI 的來源 IP，可望繞過電力供需即時來源（`sys_dem_sup.csv`）對雲端 CI 網段的
  WAF 封鎖，若想要 `grid_status.json` 真正即時而非每日備援，這是目前唯一已知的解法（見 `ROADMAP.md`）。

---

## 資料來源與授權

- 端點：`https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json`
- 來源：政府資料開放平臺「台灣電力公司各機組發電量即時資訊」，每 10 分更新
- 授權：政府資料開放授權條款－第 1 版（標示來源即可，適合公開站台）
- 其餘資料源（歷史回填、電力供需、風速參考）詳見 `README.md`「資料來源與授權」。
