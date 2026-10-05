#!/usr/bin/env python3
"""「此刻的風」的資料 · Wind right now → data/live/wind_now.webp + data/live/wind_now.json

  pip install eccodes pillow numpy
  python3 tools/fetch_gfs_wind.py

來源：美國 NOAA／NCEP 全球預報系統 GFS（公有領域）。從 NOMADS 的 grib filter 只取離地 10 m 的東西向（U）與南北向（V）風速，
1° 解析度（360×181 格），取最新一次預報（每 6 小時一次，約 3.5–5 小時後公布）的分析場（f000）。
輸出成一張無損 WebP：R＝U、G＝V，值＝min＋像素×scale（0.5 m/s 一階，約 50 KB；排程每 6 小時 commit 一次，檔案小才不會讓 repo 長太快），
地球儀的流動粒子讀它。由 .github/workflows/wind-now.yml 排程執行。

Source: NOAA/NCEP Global Forecast System (public domain). Only the 10 m U and V wind components at 1° (360×181) are taken from
the NOMADS grib filter, from the newest cycle's analysis (f000; a cycle every 6 hours, published about 3.5–5 hours later).
They are written as a lossless WebP (R = U, G = V, value = min + pixel × scale, 0.5 m/s steps, about 50 KB so the 6-hourly commits keep the
repo small) that the globe's flow particles read. Run on a schedule by .github/workflows/wind-now.yml.
"""
import datetime as dt
import json
import sys
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/live'
URL = ('https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl?dir=%2Fgfs.{d}%2F{h:02d}%2Fatmos&file=gfs.t{h:02d}z.pgrb2.1p00.f000'
       '&var_UGRD=on&var_VGRD=on&lev_10_m_above_ground=on')
UA = {'User-Agent': 'windfarmTaiwan/gfs (github.com/dofliu/windfarmTaiwan)'}
MIN, STEP = -40.0, 0.5                     # m/s：像素 0–255 → −40～87.5 m/s（離地 10 m 的 U、V 極少超出 ±40）


def fetch():
    now = dt.datetime.now(dt.timezone.utc)
    for back in range(0, 30, 6):           # 從最近的一次往前找，直到找到已公布的
        t = now - dt.timedelta(hours=back + 3)
        run = t.replace(hour=t.hour // 6 * 6, minute=0, second=0, microsecond=0)
        url = URL.format(d=run.strftime('%Y%m%d'), h=run.hour)
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
        except OSError:
            continue
        if data[:4] == b'GRIB':
            return run, data
    sys.exit('no GFS cycle found on NOMADS')


def decode(data):
    import eccodes
    out = {}
    with tempfile.NamedTemporaryFile(suffix='.grb2') as f:
        f.write(data)
        f.flush()
        with open(f.name, 'rb') as fh:
            while (h := eccodes.codes_grib_new_from_file(fh)) is not None:
                name = eccodes.codes_get(h, 'shortName')
                ni, nj = eccodes.codes_get(h, 'Ni'), eccodes.codes_get(h, 'Nj')
                vals = eccodes.codes_get_values(h).reshape(nj, ni)
                lat0, lon0 = eccodes.codes_get(h, 'latitudeOfFirstGridPointInDegrees'), eccodes.codes_get(h, 'longitudeOfFirstGridPointInDegrees')
                out[name] = (vals, lat0, lon0)
                eccodes.codes_release(h)
    return out


def main():
    run, data = fetch()
    g = decode(data)
    (u, lat0, lon0), (v, _, _) = g['10u'], g['10v']
    if lat0 < 0:                            # 統一成北到南
        u, v = u[::-1], v[::-1]
    # GFS 經度 0..359：轉成 -180..179，與地球儀底圖一致（x＝(lon+180)/360）
    shift = int(round((180 - lon0) % 360))
    u, v = np.roll(u, shift, axis=1), np.roll(v, shift, axis=1)
    enc = lambda a: np.clip(np.round((a - MIN) / STEP), 0, 255).astype(np.uint8)   # noqa: E731
    img = np.stack([enc(u), enc(v), np.zeros_like(enc(u))], -1)
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(img, 'RGB').save(OUT / 'wind_now.webp', 'WEBP', lossless=True, quality=100, method=6)
    meta = {'run': run.strftime('%Y-%m-%dT%H:%MZ'), 'w': int(u.shape[1]), 'h': int(u.shape[0]), 'lon0': -180, 'lat0': 90, 'step': 1,
            'min': MIN, 'scale': STEP, 'height': 10, 'maxSpeed': round(float(np.hypot(u, v).max()), 1),
            'source': 'NOAA/NCEP Global Forecast System (GFS), 10 m wind, 1°, analysis (f000)', 'license': 'Public domain (U.S. Government work)',
            'url': 'https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast'}
    (OUT / 'wind_now.json').write_text(json.dumps(meta), encoding='utf-8')
    print(meta['run'], (OUT / 'wind_now.webp').stat().st_size, 'bytes, max', meta['maxSpeed'], 'm/s')


if __name__ == '__main__':
    main()
