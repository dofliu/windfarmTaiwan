#!/usr/bin/env python3
"""地球儀的「平均風速」底圖 · The globe's mean wind speed basemap → assets/img/globe/wind_{2k,4k}.jpg + data/global/wind_resource.json

  pip install rasterio numpy pillow
  python3 tools/build_wind_resource.py                    # 直接從 Global Wind Atlas 的雲端最佳化 GeoTIFF 讀縮圖層（不用下載整個 14 GB 檔）
  python3 tools/build_wind_resource.py wind_speed_cog_100m.tif   # 或用已下載的檔案

來源：Global Wind Atlas 3（DTU 丹麥技術大學與世界銀行集團，CC BY 4.0）離地 100 m 的年平均風速，250 m 解析度、
陸地與離岸 200 km 內。這支程式只讀 1/32 的縮圖層（約 0.08°，約 9 km），依 1 m/s 分級上色，疊在淡化的地形陰影上；
沒有資料的地方（外海、南極、北緯 80° 以北）顯示淡化的地形底圖。分級與顏色寫進 wind_resource.json，地球儀的圖例讀它，兩邊不會不一致。
顏色：單一色相（紫）由暗到亮＝風速由低到高，避開風機標示用的金色（陸域）、藍色（離岸）、青綠（浮動式）；依 dataviz 原則，
序列色只用一個色相、亮度單調遞增（腳本最後會檢查）。

Source: Global Wind Atlas 3 (DTU / World Bank Group, CC BY 4.0), mean wind speed at 100 m, 250 m resolution, land and up to 200 km
offshore. Only the 1/32 overview (about 0.08°, ~9 km) is read from the cloud-optimised GeoTIFF, binned at 1 m/s, coloured with one hue
(violet, dark = calm, light = windy; chosen to stay clear of the gold/blue/teal farm markers) over a faint relief shading. Bins and
colours are written to wind_resource.json, which the globe's legend reads.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REMOTE = '/vsicurl/https://ndownloader.figshare.com/files/54328562'      # globalwindatlas.info/api/gis/global/wind-speed/100 轉址到這裡
PAGE = 'https://globalwindatlas.info/'
EDGES = [4, 5, 6, 7, 8, 9, 10]                    # m/s：<4、4–5、…、9–10、≥10，共 8 級
OCEAN = (12, 24, 48)                              # 與 globe.js 的 OCEAN 相同


def oklch_to_srgb(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_, m_, s_ = L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    rgb = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
           -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    enc = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055     # noqa: E731
    return tuple(int(round(min(1, max(0, enc(c))) * 255)) for c in rgb)


def ramp(n):
    """紫色單一色相：亮度 0.30→0.93 單調遞增，彩度在兩端收斂以留在色域內"""
    out = []
    for i in range(n):
        t = i / (n - 1)
        L = 0.30 + 0.63 * t
        C = 0.06 + 0.10 * math.sin(math.pi * min(1, t * 1.15))
        out.append(oklch_to_srgb(L, max(C, 0.03), 292))
    return out


def read_overview(src):
    import rasterio
    from rasterio.enums import Resampling
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', CPL_VSIL_CURL_USE_HEAD='NO', GDAL_HTTP_MAX_RETRY='5', GDAL_HTTP_RETRY_DELAY='3'):
        with rasterio.open(src) as d:
            h, w = d.height // 32, d.width // 32
            a = d.read(1, out_shape=(h, w), resampling=Resampling.average)
            return a, d.bounds


def main(src=REMOTE):
    a, b = read_overview(src)
    cols = ramp(len(EDGES) + 1)
    lum = [0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] for c in cols]
    assert all(x < y for x, y in zip(lum, lum[1:])), 'ramp lightness must increase'
    relief = Image.open(ROOT / 'assets/img/globe/relief_4k.jpg').convert('L')
    for W, H, tag in [(4096, 2048, '4k'), (2048, 1024, '2k')]:
        # 輸出格點（等距圓柱，整個地球）→ 資料格點（只有 b.bottom～b.top 緯度）
        lon = -180 + (np.arange(W) + 0.5) * 360 / W
        lat = 90 - (np.arange(H) + 0.5) * 180 / H
        ri = ((b.top - lat) / (b.top - b.bottom) * a.shape[0]).astype(int)
        ci = ((lon - b.left) / (b.right - b.left) * a.shape[1]).astype(int) % a.shape[1]
        inside = (ri >= 0) & (ri < a.shape[0])
        v = np.full((H, W), np.nan, dtype=np.float32)
        v[inside] = a[ri[inside]][:, ci]
        shade = np.asarray(relief.resize((W, H), Image.LANCZOS), dtype=np.float32) / 255
        base = np.stack([OCEAN[i] * 0.55 + shade * 255 * 0.35 for i in range(3)], -1)        # 沒資料：淡化的地形
        k = np.digitize(np.nan_to_num(v, nan=-1), EDGES)                                     # 0..8
        rgb = np.array(cols, dtype=np.float32)[k] * (0.94 + 0.12 * (shade[..., None] - 0.5))  # 很淡的地形陰影（太強會干擾分級）
        img = np.where(np.isfinite(v)[..., None], rgb, base).clip(0, 255).astype(np.uint8)
        out = ROOT / f'assets/img/globe/wind_{tag}.jpg'
        Image.fromarray(img).save(out, 'JPEG', quality=84 if tag == '4k' else 82, optimize=True, progressive=True)
        print(out, out.stat().st_size)
    hexes = ['#%02x%02x%02x' % c for c in cols]
    meta = {'edges': EDGES, 'colors': hexes, 'unit': 'm/s', 'height': 100,
            'source': 'Global Wind Atlas 3 (DTU Wind Energy / World Bank Group), mean wind speed at 100 m', 'url': PAGE,
            'license': 'CC BY 4.0', 'resolution': '1/32 overview of the 250 m grid (about 0.08°)'}
    (ROOT / 'data/global/wind_resource.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding='utf-8')
    print('colors', hexes)


if __name__ == '__main__':
    main(*sys.argv[1:2])
