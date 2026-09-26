# Wind Watch (風電風情) — Deployment

English (this page) ｜ [中文](./DEPLOY.md)

## Option A: GitHub Pages + GitHub Actions (free, no maintenance — what this repo uses)

GitHub Pages only serves static files. The Python scripts run on a GitHub Actions schedule; the JSON
they produce is committed back to the repo and served by Pages alongside the site. The HTML and the
JSON share one origin, so there is **no CORS issue**.

### Repo layout

```
windfarmTaiwan/
├─ index.html                       # site shell (four pages: Home / Taiwan live / Global / Learn)
├─ assets/
│  ├─ css/                          # site.css (design system), globe.css (globe)
│  ├─ js/                           # core / live / charts / home / learn / globe (lazy-loaded per page)
│  ├─ vendor/                       # three.js r128 + OrbitControls (loaded only on the Global page)
│  └─ img/globe/                    # relief / satellite basemaps
├─ data/global/                     # global data: country capacity by year, farm layer, borders (built by tools/, not scheduled)
├─ tools/                           # generators for the global data, basemaps, the single-file HTML and the coverage report
├─ standalone/                      # single-file HTML (built by tools/build_standalone.py; download and open offline)
├─ docs/                            # data coverage report, data clean-up log, live-data source assessment (one Chinese and one English copy each)
├─ taipower_wind_scraper.py         # every 15 min: live wind + live supply/demand
├─ intl_wind_scraper.py             # every 15 min: live wind farm output in Australia's NEM, Alberta and Ontario → data/live/
├─ backfill_history.py              # every Monday: official retrospective history backfill
├─ wind_realtime.json               # live wind data (auto-updated by Actions)
├─ wind_history.json                # rolling 7-day wind history
├─ wind_history_archive.json        # long-term wind archive (never trimmed)
├─ wind_archive_daily.json          # daily digest of the archive (read by the long-term trend chart)
├─ grid_status.json                 # live power supply/demand report
└─ .github/workflows/
   ├─ scrape.yml                    # runs taipower_wind_scraper.py and intl_wind_scraper.py every 15 minutes
   ├─ backfill.yml                  # runs backfill_history.py every Monday
   └─ standalone.yml                # rebuilds the single-file HTML when site code or global data change
```

To set up a new project from scratch (instead of using this repo directly):

### Steps

1. Create a **public** repo (public repos get unlimited free Actions minutes; private repos get
   2,000 minutes a month, which a 15-minute schedule would exceed).
2. Put `index.html`, `assets/`, `data/`, `taipower_wind_scraper.py`, `intl_wind_scraper.py` and
   `backfill_history.py` in the repo root (`tools/` is only needed to update the global data).
3. Put `.github/workflows/scrape.yml`, `backfill.yml` and `standalone.yml` in place.
4. Make sure `DATA_ENDPOINT` and the other constants at the top of `assets/js/live.js` point to
   relative paths on the same origin (e.g. `./wind_realtime.json`). No change is needed if you fork
   or clone this repo.
5. Settings → Pages → Source: branch `main`, folder `/ (root)`, and save.
6. On the Actions page, run `scrape-taipower-wind` once by hand (workflow_dispatch) and check that
   `wind_realtime.json` gets committed; then run `backfill-taipower-wind-history` once and check that
   the long-term archive files are created.
7. Open `https://<account>.github.io/<repo>/` — the top-right indicator changes from "Simulated" to a
   green "Live" dot.

### Limits to know about

- **The schedule is not precise**: GitHub's `schedule` is not guaranteed to run on time; runs are
  often a few minutes late and occasionally skipped at peak times. Taipower only updates every 10
  minutes, so this is acceptable here, but it is not second-level real time.
- **Disabled after 60 days**: if a repo has no activity for 60 days, its scheduled workflows are
  disabled automatically, and bot commits made with the default `GITHUB_TOKEN` do not always count as
  activity. Remedies: trigger a run by hand once a month, push with a personal PAT, or add a keepalive
  workflow (see "Deployment stability" in `ROADMAP.en.md`).
- **Commits pile up**: one commit every 15 minutes means tens of thousands a year. It works fine, but
  the repo grows; `wind_history_archive.json` also keeps growing with each weekly backfill (about
  1.8 MB now). Accept it, squash history now and then, or switch to option B.
- **The live supply/demand source is blocked by a WAF**: the primary source for `grid_status.json`
  returns 403 from GitHub Actions (see "Known limitations" in `ROADMAP.en.md`), so the daily fallback
  is used. Truly live figures need a non-cloud-CI host (see option C).
- The Actions runners are overseas (Azure); fetching Taipower's public open-data endpoints works
  fine (server-side fetches are not subject to CORS).

---

## Option B: Cloudflare Pages + Worker Cron (more reliable, no commit pile-up; you already use Cloudflare)

- **Cloudflare Pages** hosts the static site (`index.html`, `assets/`, `data/`).
- A **Cloudflare Worker + Cron Trigger** (every 10 minutes, more punctual than GitHub) fetches
  Taipower's open data, writes the result to **KV** or **R2**, and serves it as JSON from a Worker
  endpoint (adding CORS headers itself).
- Point `DATA_ENDPOINT` at the Worker URL.

Pros: punctual cron, no git history growth, generous free tier, consistent with your existing
Cloudflare Tunnel setup. Cost: Workers run JS/TS, so the `parse_wind` parsing logic (about 30 lines)
has to be ported to JavaScript (a small job).

---

## Option C: your RTX 4080 Windows 11 machine + Cloudflare Tunnel

- Windows Task Scheduler runs `taipower_wind_scraper.py` every 10 minutes → `wind_realtime.json`
  is produced locally
- Serve that JSON publicly through a Cloudflare Tunnel (the same approach as CloudDataProduction)
- Drawback: the machine must stay on 24 hours a day, which is less reliable for a public-information
  site.
- **Extra benefit**: requests come from a non-cloud-CI IP, which should get past the WAF block that
  the live supply/demand source (`sys_dem_sup.csv`) applies to cloud CI ranges. If you want
  `grid_status.json` truly live rather than the daily fallback, this is the only known fix so far
  (see `ROADMAP.en.md`).

---

## Data source & licence

- Endpoint: `https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json`
- Source: Government open data platform, "Taiwan Power Company real-time generation by unit",
  updated every 10 minutes
- Licence: Open Government Data License, version 1.0 (attribution is enough; suitable for a public site)
- The other sources (history backfill, supply/demand, wind-speed reference) are listed under
  "Data sources & license" in `README.en.md`.
