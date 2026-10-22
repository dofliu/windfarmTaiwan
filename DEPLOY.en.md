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
├─ data/archive/                    # long-term archive of Taipower's official retrospective data (one file per month) and daily samples of every grid unit (farm_daily.json)
├─ docs/                            # user guide, data coverage report, data clean-up log, per-farm foundation list, events list, live-data source assessment (one Chinese and one English copy each)
├─ data/live/                       # live output in Australia and Canada (intl_realtime.json, scheduled) and the unit mapping (units.json)
├─ taipower_wind_scraper.py         # about every 30 minutes: live wind + live supply/demand
├─ intl_wind_scraper.py             # about every 30 minutes: live wind farm output in Australia's NEM, Alberta and Ontario → data/live/
├─ backfill_history.py              # every Monday: official retrospective history backfill
├─ wind_realtime.json               # live wind data (auto-updated by Actions)
├─ wind_history.json                # rolling 7-day wind history
├─ wind_archive_daily.json          # daily digest of the archive (read by the long-term trend chart)
├─ grid_status.json                 # live power supply/demand report
└─ .github/workflows/
   ├─ scrape.yml                    # runs taipower_wind_scraper.py and intl_wind_scraper.py about every 30 minutes
   ├─ backfill.yml                  # runs backfill_history.py every Monday
   ├─ wind-now.yml                  # runs tools/fetch_gfs_wind.py every 6 hours (the globe's "Wind now", NOAA GFS)
   ├─ standalone.yml                # rebuilds the single-file HTML when site code or global data change and uploads it to the "standalone" Release
   ├─ keepalive.yml                 # on the 1st of each month, re-enables the schedules so they are not disabled after 60 days
   └─ pr-check.yml                  # checks on every PR: Playwright smoke test, syntax, coordinates, generated documents, version (optional)
```

To set up a new project from scratch (instead of using this repo directly):

### Steps

1. Create a **public** repo (public repos get unlimited free Actions minutes; private repos get
   2,000 minutes a month; the current schedule, about every 30 minutes or roughly 1,400 runs a month, would
   exceed that).
2. Put `index.html`, `assets/`, `data/`, `taipower_wind_scraper.py`, `intl_wind_scraper.py` and
   `backfill_history.py` in the repo root (`tools/` is only needed to update the global data).
3. Put `.github/workflows/scrape.yml`, `backfill.yml`, `wind-now.yml`, `standalone.yml` and `keepalive.yml` in place (`pr-check.yml` only checks pull requests and is optional).
4. Make sure `DATA_ENDPOINT` and the other constants at the top of `assets/js/live.js` point to
   relative paths on the same origin (e.g. `./wind_realtime.json`). No change is needed if you fork
   or clone this repo.
5. Settings → Pages → Source: branch `main`, folder `/ (root)`, and save.
6. On the Actions page, run `scrape-taipower-wind` once by hand (workflow_dispatch) and check that
   `wind_realtime.json` gets committed; then run `backfill-taipower-wind-history` once and check that
   the long-term archive files are created.
7. Open `https://<account>.github.io/<repo>/` — the top-right indicator changes from "Simulated" to a
   green "Live" dot.
8. Set up the external trigger (next section) so the live data updates about every 30 minutes; without it only GitHub's
   schedule runs, which in practice means one update every 3–6 hours.

### External trigger: an update about every 30 minutes

GitHub's `schedule` is often late or skipped (measured in Oct 2026: `scrape.yml` was set to every 2 hours but ran only 3–6
times a day, up to 6 hours apart), and Taipower's live data does not allow cross-site reads (no CORS header), so the page cannot
fetch it directly. A free external cron service therefore calls the GitHub API every 30 minutes to start `scrape.yml`
(`workflow_dispatch`). The 2-hourly schedule in `scrape.yml` stays as a fallback.

1. **Create a token**: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   Repository access: **Only select repositories** → `dofliu/windfarmTaiwan`; Permissions → Repository permissions → **Actions: Read and write**
   (nothing else). Tokens last at most a year: note the expiry date and replace the token before it.
2. **Create the job** (for example on [cron-job.org](https://cron-job.org), free, needs an account): Create cronjob →
   - URL: `https://api.github.com/repos/dofliu/windfarmTaiwan/actions/workflows/scrape.yml/dispatches`
   - Schedule: Every 30 minutes
   - Headers (four rows): `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`,
     `Content-Type: application/json` (the blue "Add Content-Type header now" hint under Advanced adds it in one click)
   - Advanced → Request method: **POST**; Request body: `{"ref":"main"}`
   - Without `Authorization`, or with a token that cannot reach this repo, GitHub answers **404** (not 401); a GET also gets 404.
   - API version `2022-11-28` is deprecated and **stops working on 10 Mar 2028**; before then, change `X-GitHub-Api-Version` to a version GitHub supports (the response's `Sunset` header gives the date).
3. Press **Test run**: a `204 No Content` response means it worked, and the Actions tab shows a `scrape-taipower-wind` run triggered by `workflow_dispatch`.
4. Keep the token only in the cron service, never in the repo or anywhere else; if it leaks, revoke it on GitHub and make a new one.

Two runs started at once queue up (`concurrency`) instead of clashing. The trend file `wind_history.json` gains only about one point an
hour (`HISTORY_GAP_MIN`), so it does not grow with the more frequent fetching.

### Limits to know about

- **GitHub's schedule is not precise**: `scrape.yml`'s own schedule is every 2 hours (minute 18 of even hours, UTC), but GitHub's
  `schedule` is not guaranteed to run on time; runs are often late and often skipped at peak times, so it actually runs 3–6 times a day.
  The external trigger in the previous section (about every 30 minutes) is therefore the main schedule and GitHub's is only a fallback;
  if the external trigger stops, updates fall back to one every few hours.
- **Disabled after 60 days**: if a repo has no activity for 60 days, its scheduled workflows are
  disabled automatically, and bot commits made with the default `GITHUB_TOKEN` do not always count as
  activity. This repo's `keepalive.yml` handles it: on the 1st of each month it re-enables `scrape.yml`, `backfill.yml`, `wind-now.yml` and
  itself through the GitHub API (`PUT /repos/{owner}/{repo}/actions/workflows/{workflow}/enable`, permission `actions: write`),
  which resets the timer without making a commit. It is itself scheduled, so it has to keep running; if every schedule in the
  repo has already been disabled, press **Enable workflow** on the Actions tab by hand.
- **Commits pile up**: one commit about every 30 minutes means about 17,000 a year (about 6 KB each once packed, about 100 MB a year). It works fine, but
  the repo grows. The long-term archive is now split by month (`data/archive/`), so the weekly backfill only
  rewrites the current month (about 0.6 MB), and the single-file builds go to a Release instead of git; what remains
  is the small live-data commits. Accept it, squash history now and then, or switch to option B.
- **The live supply/demand source is blocked by a WAF**: the primary source for `grid_status.json`
  returns 403 from GitHub Actions (see "Known limitations" in `ROADMAP.en.md`), so the daily fallback
  is used. Truly live figures need a non-cloud-CI host (see option C).
- The Actions runners are overseas (Azure); fetching Taipower's public open-data endpoints works
  fine (server-side fetches are not subject to CORS).

### Maintenance

The project has been in maintenance since 27 Sep 2026 (v2.11.1), with improvements made since as the owner asks (see the CHANGELOG). All of the following runs by itself:

- `scrape-taipower-wind`: about every 30 minutes (started through the API by the external trigger, with GitHub's 2-hourly schedule as a fallback; replace the token before it expires, see "External trigger"), fetches Taipower's live wind output, the supply/demand report, per-farm live output in
  Australia and Canada, and the national wind totals of the UK, Ireland, Germany, France, Denmark, Belgium, Poland, Korea and Brazil and the Texas and California grids (sources in [docs/live-data-sources.en.md](./docs/live-data-sources.en.md)), and commits any change; a failing foreign source does not affect the Taiwan data.
- `backfill-taipower-wind-history`: every Monday (early Tuesday in Taipei), adds to Taipower's official retrospective archive.
- `wind-now`: every 6 hours (05:37, 11:37, 17:37, 23:37 UTC) fetches the newest NOAA GFS 10 m wind field (public domain; needs `eccodes` to read GRIB2), writes `data/live/wind_now.webp` (about 50 KB) and `wind_now.json` and commits them; the globe's "Wind now" reads them.
- `build-standalone`: rebuilds the single-file edition when site code or global data change on `main` and uploads it to the GitHub Release "standalone" (a fixed tag whose files are overwritten; nothing is committed). Scheduled live-data commits
  do not trigger it, so the single-file edition's offline snapshot stays at the time of its last rebuild.
- `keepalive`: at 04:41 UTC on the 1st of each month, re-enables the three schedules above (`scrape`, `backfill`, `wind-now`) and itself through the GitHub API, so
  GitHub does not disable them after 60 days without activity; it makes no commits.

**Check once a month (about 5 minutes)**: `keepalive` takes care of the 60-day rule, so this check is mainly for problems with the
data sources (for example Taipower changing its format).

1. Open the site and look at the data time in the header ("Live · Taipower MM/DD HH:MM"). It is normally less than an hour behind; several hours
   behind usually means the external trigger has stopped (expired token or a paused job), so check the cron service's latest responses (401 means the token no longer works). If it has not moved for more than half a
   day, the schedule has stopped or fetching is failing; the site shows no error, it just keeps showing the last data it got. The "now" box of a globe country profile and the world list "Wind output right now" also show each source's data time.
2. On GitHub's **Actions** tab, check that the latest run of each scheduled workflow is green (`keepalive` runs monthly; `pr-check` only runs when there is a pull request; `build-standalone` only when site code or global data change on `main`). If a
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
