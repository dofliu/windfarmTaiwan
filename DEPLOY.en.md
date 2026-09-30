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
├─ standalone/                      # where the single-file HTML is written locally (not in git; the official files are in the GitHub Release "standalone")
├─ data/archive/                    # long-term archive of Taipower's official retrospective data, one file per month
├─ docs/                            # data coverage report, data clean-up log, per-farm foundation list, live-data source assessment (one Chinese and one English copy each)
├─ data/live/                       # live output in Australia and Canada (intl_realtime.json, scheduled) and the unit mapping (units.json)
├─ taipower_wind_scraper.py         # about every 2 hours: live wind + live supply/demand
├─ intl_wind_scraper.py             # about every 2 hours: live wind farm output in Australia's NEM, Alberta and Ontario → data/live/
├─ backfill_history.py              # every Monday: official retrospective history backfill
├─ wind_realtime.json               # live wind data (auto-updated by Actions)
├─ wind_history.json                # rolling 7-day wind history
├─ wind_archive_daily.json          # daily digest of the archive (read by the long-term trend chart)
├─ grid_status.json                 # live power supply/demand report
└─ .github/workflows/
   ├─ scrape.yml                    # runs taipower_wind_scraper.py and intl_wind_scraper.py about every 2 hours
   ├─ backfill.yml                  # runs backfill_history.py every Monday
   ├─ standalone.yml                # rebuilds the single-file HTML when site code or global data change and uploads it to the "standalone" Release
   └─ keepalive.yml                 # on the 1st of each month, re-enables the schedules so they are not disabled after 60 days
```

To set up a new project from scratch (instead of using this repo directly):

### Steps

1. Create a **public** repo (public repos get unlimited free Actions minutes; private repos get
   2,000 minutes a month; the current schedule, about every 2 hours or roughly 360 runs a month, is well within
   that, but a high-frequency schedule would exceed it).
2. Put `index.html`, `assets/`, `data/`, `taipower_wind_scraper.py`, `intl_wind_scraper.py` and
   `backfill_history.py` in the repo root (`tools/` is only needed to update the global data).
3. Put `.github/workflows/scrape.yml`, `backfill.yml`, `standalone.yml` and `keepalive.yml` in place.
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

- **The schedule is not precise**: `scrape.yml` runs every 2 hours (minute 18 of even hours, UTC). GitHub's
  `schedule` is not guaranteed to run on time; runs are often late and occasionally skipped at peak times,
  and high-frequency schedules (e.g. every 15 minutes) in practice stretch to one run every 3–5 hours.
  The site does not need minute-by-minute data, so this is acceptable.
- **Disabled after 60 days**: if a repo has no activity for 60 days, its scheduled workflows are
  disabled automatically, and bot commits made with the default `GITHUB_TOKEN` do not always count as
  activity. This repo's `keepalive.yml` handles it: on the 1st of each month it re-enables `scrape.yml`, `backfill.yml` and
  itself through the GitHub API (`PUT /repos/{owner}/{repo}/actions/workflows/{workflow}/enable`, permission `actions: write`),
  which resets the timer without making a commit. It is itself scheduled, so it has to keep running; if every schedule in the
  repo has already been disabled, press **Enable workflow** on the Actions tab by hand.
- **Commits pile up**: one commit about every 2 hours means over four thousand a year. It works fine, but
  the repo grows. The long-term archive is now split by month (`data/archive/`), so the weekly backfill only
  rewrites the current month (about 0.6 MB), and the single-file builds go to a Release instead of git; what remains
  is the small live-data commits. Accept it, squash history now and then, or switch to option B.
- **The live supply/demand source is blocked by a WAF**: the primary source for `grid_status.json`
  returns 403 from GitHub Actions (see "Known limitations" in `ROADMAP.en.md`), so the daily fallback
  is used. Truly live figures need a non-cloud-CI host (see option C).
- The Actions runners are overseas (Azure); fetching Taipower's public open-data endpoints works
  fine (server-side fetches are not subject to CORS).

### Maintenance (while development is paused)

The project has been paused since 27 Sep 2026 (v2.11.1). All of the following runs by itself:

- `scrape-taipower-wind`: about every 2 hours, fetches Taipower's live wind output, the supply/demand report and live output in
  Australia and Canada, and commits any change.
- `backfill-taipower-wind-history`: every Monday (early Tuesday in Taipei), adds to Taipower's official retrospective archive.
- `build-standalone`: rebuilds the single-file edition when site code or global data change on `main` and uploads it to the GitHub Release "standalone" (a fixed tag whose files are overwritten; nothing is committed). Scheduled live-data commits
  do not trigger it, so the single-file edition's offline snapshot stays at the time of its last rebuild.
- `keepalive`: at 04:41 UTC on the 1st of each month, re-enables the two schedules above and itself through the GitHub API, so
  GitHub does not disable them after 60 days without activity; it makes no commits.

**Check once a month (about 5 minutes)**: `keepalive` takes care of the 60-day rule, so this check is mainly for problems with the
data sources (for example Taipower changing its format).

1. Open the site and look at the data time in the header ("Live · Taipower MM/DD HH:MM"). If it has not moved for more than half a
   day, the schedule has stopped or fetching is failing; the site shows no error, it just keeps showing the last data it got.
2. On GitHub's **Actions** tab, check that the latest run of each of the four workflows is green (`keepalive` runs monthly). If a
   workflow says "This scheduled workflow is disabled…" (GitHub disables schedules after 60 days without activity), press **Enable workflow**.
3. If the data time has stopped, press **Run workflow** on `scrape-taipower-wind` to run it by hand and check that `wind_realtime.json`
   gets a new commit; if it fails, read the run log.

**Common situations**:

- `scrape-taipower-wind` fails (red): read the run log first. If Taipower changed its endpoint format, the parsing in
  `taipower_wind_scraper.py` needs updating. Failures of the international sources do not affect Taiwan's data (that step uses
  `continue-on-error`), and the site marks that grid's data as not updated.
- Wind speeds disappear from farm cards: the Central Weather Administration key (the repo's Actions secret `CWA_API_KEY`) has expired
  or stopped working; update it under Settings → Secrets and variables → Actions. Without a key only the wind speeds are skipped.
- Supply/demand keeps showing a date weeks ago: a known limitation (the primary source blocks cloud CI, so only the government
  open-data daily fallback is available), not a fault.
- The yearly global data update (country capacity, farm layer) is not scheduled; see "Updating the global data" in the README and
  "Global data" in TODO.

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
