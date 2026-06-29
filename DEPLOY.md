# 風電風情 — 部署說明

## 方案 A：GitHub Pages + GitHub Actions（免費、零維運，推薦先用這個）

GitHub Pages 只服務靜態檔；自動跑 Python 由 GitHub Actions 排程負責，
產生的 `wind_realtime.json` commit 回 repo，Pages 再一起服務。
HTML 與 JSON 同網域，**沒有 CORS 問題**。

### Repo 結構

```
your-repo/
├─ index.html                 # 由 wind-power-monitor.html 改名而來
├─ taipower_wind_scraper.py
├─ wind_realtime.json         # 由 Actions 自動產生/更新（第一次可先放空檔或讓它自己生）
└─ .github/workflows/scrape.yml
```

### 步驟

1. 建一個 **public** repo（公開 repo 的 Actions 分鐘數無限、免費；私有 repo 每月只有 2000 分鐘，每 15 分鐘跑會超量）。
2. 把 `wind-power-monitor.html` 改名為 `index.html` 放進 repo 根目錄。
3. 把 `taipower_wind_scraper.py` 放根目錄。
4. 把 `scrape.yml` 放到 `.github/workflows/scrape.yml`。
5. 編輯 `index.html`，把：
   ```js
   const DATA_ENDPOINT = "";
   ```
   改成（相對路徑即可，同網域）：
   ```js
   const DATA_ENDPOINT = "./wind_realtime.json";
   ```
6. Settings → Pages → Source 選 `main` branch、`/ (root)`，存檔。
7. Actions 頁面手動跑一次 `scrape-taipower-wind`（workflow_dispatch），確認 `wind_realtime.json` 有被 commit。
8. 開 `https://<帳號>.github.io/<repo>/` → 右上角會由「模擬」轉成綠點「即時」。

### 必須知道的限制（誠實說明）

- **排程不精準**：GitHub 的 `schedule` 不保證準時，常延遲數分鐘、尖峰偶爾略過。台電本來就是每 10 分更新，這個用途可接受，但不是「秒級即時」。
- **60 天自動停用**：repo 連續 60 天無活動，排程 workflow 會被自動停用；而且用預設 `GITHUB_TOKEN` 的 bot commit 在某些情況不被算作「活動」。對策：每月手動觸發一次，或改用個人 PAT 來 push，或加一支 keepalive。
- **commit 會累積**：每 15 分鐘一次 commit，一年數萬筆 git 歷史。功能無礙，但 repo 會變肥。可接受，或定期 squash，或改用方案 B。
- Actions runner 在海外（Azure），抓台電公開 opendata 端點沒問題（伺服器端抓取不受 CORS 限制）。

---

## 方案 B：Cloudflare Pages + Worker Cron（更穩、無 commit 累積；你已有 Cloudflare 基礎設施）

- **Cloudflare Pages** 放靜態 `index.html`。
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

---

## 資料來源與授權

- 端點：`https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json`
- 來源：政府資料開放平臺「台灣電力公司各機組發電量即時資訊」，每 10 分更新
- 授權：政府資料開放授權條款－第 1 版（標示來源即可，適合公開站台）
