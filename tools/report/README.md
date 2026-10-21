# 全球風電發展觀察報告 · 產生程式

[English](./README.en.md) ｜ 中文（本頁）

把本站收集的資料整理成一份 A4 直式的觀察報告（年報雜誌風格，2026-10 使用者選定），輸出 HTML 與 PDF。
報告的文字、圖表設計與版面保留一切權利（見 [LICENSE](../../LICENSE)）；各項資料依其來源的授權使用。

## 產生

```bash
python3 -m http.server 8000 &               # 截圖要先開本機預覽
node tools/report/shots.js                  # 網站截圖到 report/shots/（只在網站畫面改變時重拍）
python3 tools/report/build_report.py zh     # 中文版：report/observation-report.zh.html 與 .pdf
python3 tools/report/build_report.py en     # 英文版：report/observation-report.en.html 與 .pdf
pdftoppm -r 50 -png report/observation-report.zh.pdf /tmp/p   # 逐頁預覽（選用）
```

需要 Python 3、Pillow、Node.js 與 Playwright（Chromium 131 以上，頁尾與頁碼用 `@page` 的頁邊框）；字型由 Google Fonts 載入（Noto Sans TC、Noto Serif TC）。
輸出在 `report/`（不進 git）。

發布：在 GitHub Actions 手動執行 `build-report`（`.github/workflows/report.yml`），它在 CI 重拍截圖、產生兩份 PDF，上傳到 GitHub Release「report」（固定標籤，覆蓋同名檔案）：
[中文版](https://github.com/dofliu/windfarmTaiwan/releases/download/report/observation-report.zh.pdf)、[英文版](https://github.com/dofliu/windfarmTaiwan/releases/download/report/observation-report.en.pdf)。

## 檔案

| 檔案 | 內容 |
|---|---|
| `analysis.py` | 從 `data/global/` 計算報告用的所有數字與數列；報告不寫死數字 |
| `charts.py` | SVG 圖表（面積、直條、折線、點狀分布、排名橫條）；色盤經色盲檢查 |
| `text_zh.py`、`text_en.py` | 中文版與英文版文字（兩檔的鍵相同；改一邊時另一邊同時改） |
| `build_report.py` | 版面：封面、目次、摘要、10 章、觀察、附錄與封底；章與章之間換頁，章內由瀏覽器自動分頁 |
| `outlook_quotes.json` | 第 10 章各機構展望的出處與原文，以 `python3 tools/check_quotes.py tools/report/outlook_quotes.json` 核對 |
| `shots.js` | 網站截圖（1440×900，2 倍） |
| `pdf.js` | HTML 轉 PDF |

## 規則

- 數字一律在 `analysis.py` 由資料計算，再由文字檔帶入；外部機構的數字只用 `outlook_quotes.json` 裡核對過的原文。
- 沒有出處的因果說法不寫；廠牌比例一律寫出覆蓋率、不當成市占；實測發電與估計值不混排（與網站相同的規則，見 CLAUDE.md）。
- 資料更新後重跑 `build_report.py`，並把各章文字從頭讀一次：有些句子描述的是排序或趨勢（例如「最多」「超過」），資料變了可能要改寫。
