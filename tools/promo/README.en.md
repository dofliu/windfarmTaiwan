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
| `history_film.py` | Exhibition cut of the wind-milestones film: a 4-second clip of the real globe after every chapter and a QR end card (see "Wind milestones film" below) |

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
- The events video leaves out events from the three years before production and covers all countries without singling out Taiwan: `EV_Y` in `themes.py` holds the timeline at an earlier year (events filter by whole year), and the captions say only what the event summaries say.
- The milestones film uses only milestones from `wind_global.json` (exact names), and its captions give only the years, ratings and rotor sizes their summaries state.
- A clip may set `ls`: layer toggles written to browser storage before the page opens (e.g. `QUIET` turns events and vessels off in the ports film), for layers the URL parameters do not control.

| Theme | `THEMES` key | Clips | Status |
|---|---|---|---|
| ① Offshore wind: from seabed to sea surface | `offshore` | Title card, foundation colours (Europe → Gemini), to-scale profile (Hywind Scotland), floating-wind story tour, sea-level view sailing out of the port (Hornsea Two), illustrative vessels (Hornsea Two), QR end card | Done 16 Nov 2026 |
| ② Ports and the supply chain | `ports` | Title card, overview of European ports, a marshalling port with arcs to the farms it served (Esbjerg), manufacturing at the quay (Cuxhaven nacelle plant → Le Havre blade and nacelle plant), Asia (Fuqing Jiangyin industrial park → Port of Taichung), sea-level view sailing out of the port (Horns Rev 3), QR end card | Done 17 Nov 2026 |
| ③ Events and lessons | `events` | Title card, the European events list (filtered to "Incident / failure"), typhoons (Miyakojima 2003 → Wakayama 2018), nacelle fires (Ardrossan 2011 → Michigan 2019), foundation failures at sea (Robin Rigg 2010 → Nysted 2022), grid disturbances (South Australia 2016 → Great Britain 2019), QR end card; the timeline is held at 2022 (`EV_Y`) so the map and the list show nothing later | Done 17 Nov 2026 |
| ④ Key farms and milestones | `milestones` | Title card, the timeline playing so milestones appear (from 1980), pioneers (Brush, Cleveland 1888 → Gedser 1957), wind farms on land (Altamont Pass 1981 → Dabancheng 1997), out to sea (Vindeby 1991 → London Array 2013), giant turbines (Østerild V236 2023 → Mingyang 18–20 MW, Hainan 2024), QR end card; captions say only what the milestone summaries say, and Dongfang 26 MW is left out until its location is checked | Done 18 Nov 2026 |

```bash
python3 -m http.server 8765 &                            # repo root
cd tools/promo
python3 themes.py offshore --preview                     # 5 frames per clip first (work_t_offshore/pv_*.png)
python3 themes.py offshore                               # record + cards + assemble → theme_offshore.mp4, theme_offshore_share.mp4
python3 themes.py offshore --lang en                     # English → theme_offshore_en.mp4
python3 themes.py offshore --only o4_sea                 # re-record one clip; --cards or --assemble for cards or assembly only
```

Each clip takes about 5–10 minutes to record (SwiftShader software rendering), about 40–60 minutes per film.

## Wind milestones film (for exhibitions, trial)

After seeing the trial on 17 Nov 2026 the owner asked for "an English edition, joined up with the globe". The film itself is made with the history-timeline-film skill: 10 chapters (James Blyth's cloth-sailed windmill of 1887 → a 26 MW-class turbine in 2025), each in an art medium of its period, with a soundtrack synthesised in the browser; the chapter facts come from the site's verified events and milestones (new quotes checked with `check_quotes.py`).

- Projects: `work_t_history/` (Chinese) and `work_t_history_en/` (English), not in git; check them with the skill's `check_film.mjs` and render with `tools/render-audio.mjs` + `tools/render.mjs --audio out/soundtrack.wav --jpeg --out out/film_zh.mp4` (English: `film_en.mp4`).
- Exhibition cut: `history_film.py globe [--lang en]` records 10 globe clips (opening the chapter's milestone or event card), and `history_film.py assemble [--lang en]` inserts them after each chapter (repeating the chapter's last two bars of music, so the beat holds) and ends with a 6-second QR card (the intro's wind chimes fading out, so it loops), writing `history_milestones_globe_zh.mp4` / `_en.mp4` and share copies.
- The 1887 and 26 MW-class chapters open event cards: those events have no coordinates, and the 26 MW milestone's position (Fujian) disagrees with the event (Dongying, Shandong) — to be verified.
