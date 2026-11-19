# 宣傳影片：全球風電 3D 地球儀

[English](./README.en.md) ｜ 中文（本頁）

2026 年 10 月製作的約 3 分鐘介紹影片（中文版與英文版，1920×1080、30 fps）的製作程式。
成品約 70 MB（分享版約 27 MB），不放進 git；需要時用這裡的程式重做。

## 內容規則

- 目前不寫「開源」、不放網址（使用者 2026 年 10 月的決定，之後可能另有安排）。
- 展覽用的主題導覽影片（離岸風電從海床到海面、港口與供應鏈、事件與教訓、關鍵風場與里程碑、台灣；中英文各一版）可在結尾放網站的 QR code（使用者 2026 年 11 月 16 日同意）；事件片不放製作日前三年內的事件，各國都可，不刻意放台灣。
- 字卡上的數字（國家數、風場數、風機數、事件數、里程碑數等）是製作當時的。重做前先對照網站，
  更新 `capture.py` 的字卡（`SCENES` 與 `CAP_EN`）和 `make_scenes.py`、`make_scenes_en.py` 的內容。
- 背景音樂用 intro-video 技能的預設曲，不放進 repo。

## 需要的工具

- Python 3、Playwright（Chromium）、ffmpeg。
- intro-video 技能：提供場景模板、虛擬時鐘、渲染與合成程式。設環境變數 `INTRO_VIDEO_DIR` 指到技能的資料夾，
  或放在 `~/.claude/skills/` 底下讓 `skill_path.py` 自動找到。
- 選用的環境變數：`PROMO_BASE`（要錄製的網站，預設 `http://localhost:8765/`）、`CHROMIUM_PATH`（不設就用 Playwright 內建的 Chromium）。

## 檔案

| 檔案 | 用途 |
|---|---|
| `capture.py` | 地球儀實機錄製（12 段）：在網站上用虛擬時鐘逐格擷取畫面、疊上字卡，輸出 `work/`（英文版 `work_en/`） |
| `hero.py` | 開場與結尾的滿版主視覺 `assets/hero_globe.png` |
| `make_scenes.py`、`make_scenes_en.py` | 6 個設計景（開場、為什麼、核心主張、規模、隨手帶走、結尾）的 HTML |
| `storyboard.json`、`storyboard_en.json` | 整支影片 18 景的順序、長度與轉場 |
| `storyboard_design.json`、`storyboard_design_en.json` | 只含 6 個設計景，給渲染程式用 |
| `skill_path.py` | 尋找 intro-video 技能的位置 |
| `themes.py` | 主題導覽影片（展覽用，見下面「主題導覽影片」）：每個主題的錄製段落、開場與結尾字卡（含 QR code）與合成 |
| `history_film.py` | 風電里程碑動畫的展覽版：每章結尾接 4 秒地球儀實機畫面、片尾接 QR code（見下面「風電里程碑動畫」） |

## 步驟

```bash
# 1. 在 repo 根目錄開本機預覽（capture.py 預設錄這裡）
python3 -m http.server 8765 &

# 2. 主視覺、地球儀實機畫面、設計景
cd tools/promo
S=$(python3 -c "from skill_path import intro_video_dir; print(intro_video_dir())")/scripts
python3 hero.py
python3 capture.py                    # 英文版加 --lang en；只錄一段：--only s05_taiwan；先看幾格：--preview
python3 make_scenes.py && python3 make_scenes_en.py
python3 $S/render_scenes.py storyboard_design.json --workdir work           # 英文版：storyboard_design_en.json --workdir work_en

# 3. 合成（加預設背景音樂）
python3 $S/assemble_video.py storyboard.json --workdir work --out windfarmTaiwan_globe_promo.mp4 --music default
python3 $S/assemble_video.py storyboard_en.json --workdir work_en --out windfarmTaiwan_globe_promo_en.mp4 --music default

# 4. 分享版（約 27 MB：兩階段編碼，影像 1,150 kbps）
ffmpeg -y -i windfarmTaiwan_globe_promo.mp4 -c:v libx264 -preset slow -b:v 1150k -pass 1 -passlogfile zh -an -f null /dev/null
ffmpeg -y -i windfarmTaiwan_globe_promo.mp4 -c:v libx264 -preset slow -b:v 1150k -pass 2 -passlogfile zh \
  -c:a aac -b:a 96k -movflags +faststart windfarmTaiwan_globe_promo_share.mp4
```

地球儀實機錄製是用 SwiftShader 軟體繪圖逐格截圖，每段約 5–12 分鐘，12 段約 1.5 小時。
每段錄完會在 `work/check_<段名>.png` 留一張接近結尾的畫面，方便檢查字卡與畫面有沒有重疊。
中間檔（`work*/`、`assets/`、產生的 `s*.html`）與成品都列在 `.gitignore`，不會進 git。

## 主題導覽影片（展覽用）

使用者 2026-11-16 核准 5 支、每支中英文各一版、60–90 秒：①離岸風電：從海床到海面 ②港口與供應鏈 ③事件與教訓 ④關鍵風場與里程碑 ⑤台灣。
每週排程依序做一支；完成的主題寫在 `themes.py` 的 `THEMES`。

- 不配旁白；字卡比介紹影片大；開場與結尾都從同一個深色背景淡入淡出，可以循環播放。
- 結尾字卡放網站的 QR code（`qrcode` 套件產生 SVG，不需要 Pillow，指向 `https://dofliu.github.io/windfarmTaiwan/`）。
- 字卡不寫會過期的數字；一定要寫時從網站資料當場算，不寫死。船隻畫面一律寫明「示意、不是即時船位、大小不是實際比例」。
- 事件片不放製作日前三年內的事件，各國都可，不刻意放台灣：`themes.py` 的 `EV_Y` 把時間軸固定在那之前的年份（事件以整年篩選），字卡只寫事件摘要裡有的內容。
- 里程碑片只用 `wind_global.json` 的里程碑（名稱完全一致），字卡只寫各筆說明裡有的年份、容量與葉輪直徑。
- 段落可加 `ls`：開頁前寫進瀏覽器的圖層開關（例：港口片用 `QUIET` 關掉事件與船隻），網址參數管不到的圖層用這個。
- 段落可加 `route`：錄地球儀以外的頁面（例：台灣片的 `live/dash`）。即時畫面只在台電資料是新的時候錄；排程 `scrape.yml` 停著時，先在本機跑一次 `python3 taipower_wind_scraper.py`，錄完用 `git checkout` 還原 `wind_realtime.json`、`wind_history.json`、`grid_status.json`、`data/archive/`，不要提交。

| 主題 | `THEMES` 鍵 | 段落 | 狀態 |
|---|---|---|---|
| ① 離岸風電：從海床到海面 | `offshore` | 開場字卡、水下基礎上色（歐洲→Gemini）、按比例剖面（Hywind Scotland）、浮動式故事導覽、實景視角從港口出海（Hornsea Two）、船隻示意（Hornsea Two）、QR code 結尾 | 2026-11-16 完成 |
| ② 港口與供應鏈 | `ports` | 開場字卡、歐洲港口總覽、組裝出港港口與服務過的風場弧線（埃斯比約）、港邊製造（庫克斯港機艙廠→勒哈佛葉片與機艙廠）、亞洲（福清江陰產業園→台中港）、實景視角從港口出海（Horns Rev 3）、QR code 結尾 | 2026-11-17 完成 |
| ③ 事件與教訓 | `events` | 開場字卡、歐洲事件清單（篩選「事故／故障」）、颱風（宮古島 2003→和歌山 2018）、機艙火災（Ardrossan 2011→密西根 2019）、海上基礎失效（Robin Rigg 2010→Nysted 2022）、電網擾動（南澳 2016→英國 2019）、QR code 結尾；時間軸固定在 2022 年（`EV_Y`），地圖與清單都看不到之後的事件 | 2026-11-17 完成 |
| ④ 關鍵風場與里程碑 | `milestones` | 開場字卡、播放時間軸看里程碑出現（1980 起）、先驅（克里夫蘭 Brush 1888→Gedser 1957）、陸上風場（Altamont Pass 1981→達坂城 1997）、走向海上（Vindeby 1991→London Array 2013）、巨型風機（Østerild V236 2023→海南明陽 18–20 MW 2024）、QR code 結尾；字卡只寫里程碑說明裡有的內容，東方 26 MW 地點待查證先不用 | 2026-11-18 完成 |
| ⑤ 台灣 | `taiwan` | 開場字卡、台灣離岸之路導覽（`tour=tw`：海洋風電 2017 示範機→2019 二期）、大型風場（大彰化 1&2a→允能）、台中港與服務過的風場弧線、海面視角（海能風電，起點台中港）、台灣即時（儀表→風場牆）、QR code 結尾；字卡不寫數字（即時數字在畫面上、附資料時間） | 2026-11-19 完成 |

```bash
python3 -m http.server 8765 &                            # repo 根目錄
cd tools/promo
python3 themes.py offshore --preview                     # 先看每段 5 格（work_t_offshore/pv_*.png）
python3 themes.py offshore                               # 錄製＋字卡＋合成 → theme_offshore.mp4、theme_offshore_share.mp4
python3 themes.py offshore --lang en                     # 英文版 → theme_offshore_en.mp4
python3 themes.py offshore --only o4_sea                 # 只重錄一段；再用 --cards、--assemble 只做字卡或合成
```

每段錄製約 5–10 分鐘（SwiftShader 軟體繪圖），一支約 40–60 分鐘。

## 風電里程碑動畫（展覽用，試作）

使用者 2026-11-17 看過試作後要「英文版、接上地球儀」。動畫本身用 history-timeline-film 技能做：10 章（1887 布萊斯布帆風車 → 2025 年 26 MW 級風機），每章一種該時代的畫風，配樂由瀏覽器合成；章節的事實取自本站查證過的事件與里程碑（新增的引文以 `check_quotes.py` 核對）。

- 專案：`work_t_history/`（中文）與 `work_t_history_en/`（英文），都不進 git；在專案裡用技能的 `check_film.mjs` 檢查，`tools/render-audio.mjs`＋`tools/render.mjs --audio out/soundtrack.wav --jpeg --out out/film_zh.mp4`（英文 `film_en.mp4`）渲染。
- 展覽版：`history_film.py globe [--lang en]` 錄 10 段地球儀片段（開該章的里程碑或事件卡片），`history_film.py assemble [--lang en]` 把片段插在每章之後（配樂重複該章最後 2 小節，節拍不亂），片尾接 6 秒 QR code（用片頭的風鈴聲淡出，可循環），輸出 `history_milestones_globe_zh.mp4`／`_en.mp4` 與分享版。
- 1887 年與 26 MW 級風機兩章開事件卡片：事件沒有座標，且 26 MW 里程碑的點位（福建）與事件（山東東營）不一致，待查證。
