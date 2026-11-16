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

## 展覽用主題導覽影片（`exhibit.py`，2026-11-16 起）

五支 60–90 秒的短片，每支中英文各一版，結尾放網站的 QR code，不配旁白、頭尾接得上可循環播放：

| 代號 | 片名 | 內容 |
|---|---|---|
| `f1` | 離岸風電：從海床到海面 | 水下基礎上色、按比例剖面、浮動式故事導覽、施工船與運維船（示意）、實景視角 |
| `f2` | 港口與供應鏈 | 港口圖層、埃斯比約的服務弧線、赫爾（葉片）、庫克斯港（機艙）、福清江陰、台中港 |
| `f3` | 事件與教訓 | 事件隨時間出現，再看四則（日本颱風、英國灌漿連接、英國電網、丹麥重力式基礎）；不放製作日前三年內的事件，程式會檢查 |
| `f4` | 關鍵風場與里程碑 | Brush、Gedser、Vindeby、Horns Rev 1、Hywind Scotland、Hornsea 2、東方電氣 26 MW |
| `f5` | 台灣的風電 | 台灣離岸之路故事導覽、台灣風場、海上的運維船（示意）、台灣即時與風場牆 |

```bash
python3 -m http.server 8765 &                       # 在 repo 根目錄
cd tools/promo
python3 exhibit.py f1                               # 一支兩種語言；all＝五支
python3 exhibit.py f1 --lang en --only sealevel     # 只重錄一段（再重新合成）
python3 exhibit.py f2 --lang zh --only open end     # 只重做片頭與結尾
python3 exhibit.py f3 --preview                     # 每段只存 5 張預覽圖
```

- 需要 Python 的 `playwright` 與 `qrcode`；預裝的 Chromium 用 `CHROMIUM_PATH` 指定。
- 字卡上的數字（港口數、埃斯比約服務過的風場數）由資料檔即時代入；錄影時卡片上的維基百科摘要不查也不顯示（API 限流，內容也不是本站查證的）。
- 每段約 4–15 分鐘（實景視角最久），一支兩種語言約 1 小時；兩支可以同時跑。
- 中間檔在 `exhibit/<代號>/<語言>/`，成品在 `exhibit/out/<代號>_<語言>.mp4` 與分享版 `_share.mp4`，都不進 git。
