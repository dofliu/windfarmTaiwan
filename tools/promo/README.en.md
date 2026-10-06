# Promo video: the global wind power globe

English (this page) ｜ [中文](./README.md)

Scripts for the roughly three-minute introduction video made in October 2026 (Chinese and English versions, 1920×1080, 30 fps).
The finished files are about 70 MB (about 27 MB for the shareable copies) and are not kept in git; rebuild them with these scripts when needed.

## Content rules

- For now the video does not say "open source" and shows no URL (the owner's decision in October 2026; this may change later).
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
