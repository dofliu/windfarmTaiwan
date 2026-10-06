#!/usr/bin/env python3
"""每日取樣累積的回補 · Backfill data/archive/farm_daily.json from the git history of wind_realtime.json

  python3 tools/build_farm_daily.py                  # 重播全部歷史（第一次建檔用；需要完整的 git 歷史，淺複本先 git fetch --unshallow）
  python3 tools/build_farm_daily.py --since "21 days ago"   # 只重播最近的提交（每週排程用，補抓取程式漏記的取樣）

taipower_wind_scraper.py 每次抓到台電即時資料都會把快照累積進 farm_daily.json；排程每次也把 wind_realtime.json 提交進 git，
所以 git 歷史裡的每一版 wind_realtime.json 就是一次取樣。這支程式依時間順序重播那些版本，用與抓取程式相同的函式
（add_daily_sample，同一台電資料時間只算一次）補進存檔：可以重複執行，已有的取樣不會重算。

The scraper adds each snapshot to farm_daily.json, and every scrape also commits wind_realtime.json, so each committed version
is one sample. This replays them in order with the scraper's own add_daily_sample (a Taipower data time counts once), so it can
be re-run safely: samples already in the archive are skipped.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from taipower_wind_scraper import FARM_DAILY, add_daily_sample, load_farm_daily, save_farm_daily   # noqa: E402


def git(*args):
    return subprocess.run(['git', '-C', str(ROOT), *args], capture_output=True, check=True).stdout


def main(since=None):
    if git('rev-parse', '--is-shallow-repository').strip() == b'true' and not since:
        sys.exit('shallow clone: run "git fetch --unshallow" first, or pass --since')
    log = ['log', '--reverse', '--format=%H']
    if since:
        log.append('--since=' + since)
    shas = git(*log, '--', 'wind_realtime.json').decode().split()
    store = load_farm_daily()
    added = skipped = bad = 0
    for sha in shas:
        try:
            snap = json.loads(git('show', f'{sha}:wind_realtime.json').decode('utf-8'))
        except (subprocess.CalledProcessError, ValueError):
            bad += 1
            continue
        if add_daily_sample(store, snap.get('raw_wind_units'), snap.get('source_time') or snap.get('updated')):
            added += 1
        else:
            skipped += 1
    cur = ROOT / 'wind_realtime.json'                      # 工作目錄裡還沒提交的最新一版
    if cur.exists():
        snap = json.loads(cur.read_text(encoding='utf-8'))
        added += add_daily_sample(store, snap.get('raw_wind_units'), snap.get('source_time') or snap.get('updated'))
    save_farm_daily(store)
    days = store['days']
    print(f'{FARM_DAILY.relative_to(ROOT)}: {len(shas)} commits replayed, {added} samples added, {skipped} already there or '
          f'repeated data times, {bad} unreadable; {len(days)} days ({min(days) if days else "-"} – {max(days) if days else "-"}), '
          f'{sum(len(d["t"]) for d in days.values())} samples, {FARM_DAILY.stat().st_size / 1e3:.0f} kB')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--since', default=None, help='git date, e.g. "21 days ago"')
    main(ap.parse_args().since)
