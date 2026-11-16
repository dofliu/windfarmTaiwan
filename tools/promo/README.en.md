# Promo video: the global wind power globe

English (this page) ｜ [中文](./README.md)

Scripts for the roughly three-minute introduction video made in October 2026 (Chinese and English versions, 1920×1080, 30 fps).
The finished files are about 70 MB (about 27 MB for the shareable copies) and are not kept in git; rebuild them with these scripts when needed.

## Content rules

- For now the video does not say "open source" and shows no URL (the owner's decision in October 2026; this may change later).
- The themed exhibition videos (offshore wind from seabed to sea surface, ports and supply chain, events and lessons, key farms and milestones, Taiwan; one Chinese and one English edition each) may end with a QR code to the site (approved by the owner on 16 Nov 2026); the events video leaves out events from the three years before production and covers all countries without singling out Taiwan.
- The figures on the captions (countries, farms, turbines, events, milestones and so on) are from the time of making. Before rebuilding,
  check them against the site and update the captions in `capture.py` (`SCENES` and `CAP_EN`) and the content of `make_scenes.py` and `make_scenes_en.py`.
- The background music is the intro-video skill's default track and is not in the repo.

## Requirements

- Python 3, Playwright (Chromium) and ffmpeg.
- The intro-video skill, which provides the scene template, the virtual clock and the render and assemble scripts. Point `INTRO_VIDEO_DIR`
  at the skill's folder, or keep it under `~/.claude/skills/` so `skill_path.py` finds it.
- Optional environment variables: `PROMO_BASE` (the site to record, default `http://localhost:8765/`) and `CHROMIUM_PATH` (Playwright's own Chromium when unset).

## Files

| File | Purpose |
|---|---|
| `capture.py` | Records the globe (12 clips): captures the real site frame by frame on a virtual clock and overlays the captions, into `work/` (English: `work_en/`) |
| `hero.py` | The full-screen hero image for the opening and closing, `assets/hero_globe.png` |
| `make_scenes.py`, `make_scenes_en.py` | HTML for the 6 designed scenes (opening, why, claim, scale, portable, closing) |
| `storyboard.json`, `storyboard_en.json` | Order, length and transitions of all 18 scenes |
| `storyboard_design.json`, `storyboard_design_en.json` | The 6 designed scenes only, for the renderer |
| `skill_path.py` | Finds the intro-video skill |
| `themes.py` | Themed tour videos for exhibitions (see "Themed tour videos" below): each theme's recorded clips, title and end cards (with the QR code) and assembly |

## Steps

```bash
# 1. Serve the repo root locally (capture.py records this by default)
python3 -m http.server 8765 &

# 2. Hero image, globe clips, designed scenes
cd tools/promo
S=$(python3 -c "from skill_path import intro_video_dir; print(intro_video_dir())")/scripts
python3 hero.py
python3 capture.py                    # English: --lang en; one clip: --only s05_taiwan; a few test frames: --preview
python3 make_scenes.py && python3 make_scenes_en.py
python3 $S/render_scenes.py storyboard_design.json --workdir work           # English: storyboard_design_en.json --workdir work_en

# 3. Assemble (with the default music)
python3 $S/assemble_video.py storyboard.json --workdir work --out windfarmTaiwan_globe_promo.mp4 --music default
python3 $S/assemble_video.py storyboard_en.json --workdir work_en --out windfarmTaiwan_globe_promo_en.mp4 --music default

# 4. Shareable copy (about 27 MB: two-pass encode, 1,150 kbps video)
ffmpeg -y -i windfarmTaiwan_globe_promo.mp4 -c:v libx264 -preset slow -b:v 1150k -pass 1 -passlogfile zh -an -f null /dev/null
ffmpeg -y -i windfarmTaiwan_globe_promo.mp4 -c:v libx264 -preset slow -b:v 1150k -pass 2 -passlogfile zh \
  -c:a aac -b:a 96k -movflags +faststart windfarmTaiwan_globe_promo_share.mp4
```

The globe clips are captured with SwiftShader software rendering, about 5–12 minutes per clip and about 1.5 hours for all 12.
After each clip, `work/check_<clip>.png` holds a frame near its end for checking that captions and content do not overlap.
Intermediate files (`work*/`, `assets/`, the generated `s*.html`) and the videos are in `.gitignore` and stay out of git.

## Themed tour videos (for exhibitions)

The owner approved five on 16 Nov 2026, each 60–90 seconds in a Chinese and an English edition: ① offshore wind from seabed to sea surface, ② ports and the supply chain, ③ events and lessons, ④ key farms and milestones, ⑤ Taiwan.
The weekly schedule makes one at a time, in that order; finished themes live in `THEMES` in `themes.py`.

- No voice-over; captions larger than in the introduction video; the film fades in from and out to the same dark background so it can loop.
- The end card carries a QR code to the site (an SVG made with the `qrcode` package, no Pillow needed, pointing at `https://dofliu.github.io/windfarmTaiwan/`).
- Captions avoid figures that go stale; when one is needed it is computed from the site's data, never hard-coded. Vessel shots always say "illustrative, not live positions, not to scale".
- The events video leaves out events from the three years before production and covers all countries without singling out Taiwan.

| Theme | `THEMES` key | Clips | Status |
|---|---|---|---|
| ① Offshore wind: from seabed to sea surface | `offshore` | Title card, foundation colours (Europe → Gemini), to-scale profile (Hywind Scotland), floating-wind story tour, sea-level view sailing out of the port (Hornsea Two), illustrative vessels (Hornsea Two), QR end card | Done 16 Nov 2026 |

```bash
python3 -m http.server 8765 &                            # repo root
cd tools/promo
python3 themes.py offshore --preview                     # 5 frames per clip first (work_t_offshore/pv_*.png)
python3 themes.py offshore                               # record + cards + assemble → theme_offshore.mp4, theme_offshore_share.mp4
python3 themes.py offshore --lang en                     # English → theme_offshore_en.mp4
python3 themes.py offshore --only o4_sea                 # re-record one clip; --cards or --assemble for cards or assembly only
```

Each clip takes about 5–10 minutes to record (SwiftShader software rendering), about 40–60 minutes per film.
