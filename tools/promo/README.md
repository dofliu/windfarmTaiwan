# 宣傳影片：全球風電 3D 地球儀

[English](./README.en.md) ｜ 中文（本頁）

2026 年 10 月製作的約 3 分鐘介紹影片（中文版與英文版，1920×1080、30 fps）的製作程式。
成品約 70 MB（分享版約 27 MB），不放進 git；需要時用這裡的程式重做。

## 內容規則

- 目前不寫「開源」、不放網址（使用者 2026 年 10 月的決定，之後可能另有安排）。
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
