#!/usr/bin/env python3
"""產生 3D 地球儀的地貌底圖（等距圓柱投影，2:1）。

    python tools/build_basemaps.py <world.topo.bathy.200412.3x5400x2700.jpg> <GRAY_50M_SR_OB.tif> assets/img/globe

來源（皆為公有領域）：
  · NASA Earth Observatory「Blue Marble Next Generation w/ Topography and Bathymetry」(2004-12)
    https://visibleearth.nasa.gov/images/73909 → 衛星地貌底圖 sat_*.jpg
  · Natural Earth「Gray Earth with Shaded Relief, Hypsography and Ocean Bottom」1:50m
    https://www.naturalearthdata.com/downloads/50m-raster-data/50m-gray-earth/ → 深色地形底圖 relief_*.jpg
    （以 data/global/world_borders.json 的國界多邊形當陸地遮罩，陸地與海洋分別上色，維持網站的深色資料風格）

輸出 4096×2048（桌機）與 2048×1024（手機／低記憶體）兩種尺寸。
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

Image.MAX_IMAGE_PIXELS = None
BM, GRAY, OUT = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
ROOT = Path(__file__).resolve().parent.parent
OUT.mkdir(parents=True, exist_ok=True)
SIZES = [(4096, 2048, "4k"), (2048, 1024, "2k")]


def save(img, name, q):
    p = OUT / name
    img.save(p, "JPEG", quality=q, optimize=True, progressive=True)
    print(p, p.stat().st_size)


# ---------------------------------------------------------------- satellite (Blue Marble)
bm = Image.open(BM).convert("RGB")
for w, h, tag in SIZES:
    im = bm.resize((w, h), Image.LANCZOS)
    # 稍微壓暗、降一點飽和，讓金色(陸域)/藍色(離岸)風機與標籤仍然是畫面主角
    im = ImageEnhance.Brightness(im).enhance(0.80)
    im = ImageEnhance.Color(im).enhance(0.88)
    save(im, f"sat_{tag}.jpg", 80 if tag == "4k" else 78)

# ---------------------------------------------------------------- dark relief (Natural Earth gray + tint)
gray = Image.open(GRAY).convert("L")
borders = json.loads((ROOT / "data/global/world_borders.json").read_text(encoding="utf-8"))["borders"]


def land_mask(w, h):
    m = Image.new("L", (w * 2, h * 2), 0)          # 2x 超取樣再縮小，海岸線平滑
    d = ImageDraw.Draw(m)
    for r in borders:
        pts = [((r[i] + 180) / 360 * w * 2, (90 - r[i + 1]) / 180 * h * 2) for i in range(0, len(r), 2)]
        if len(pts) >= 3:
            d.polygon(pts, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def hexrgb(s):
    s = s.lstrip("#")
    return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


for w, h, tag in SIZES:
    g = np.asarray(gray.resize((w, h), Image.LANCZOS), dtype=np.float32) / 255.0
    mask = np.asarray(land_mask(w, h), dtype=np.float32)[..., None] / 255.0
    # 陸地：陰影地形灰階（約 120–215）拉伸成暗岩藍 → 亮岩藍；海洋：海底地形（約 80–102，越淺越亮）拉伸成深海軍藍 → 陸棚藍
    land_lo, land_hi = hexrgb("#16233a"), hexrgb("#6b83a8")
    sea_lo, sea_hi = hexrgb("#070f20"), hexrgb("#17305a")
    s_land = np.clip((g * 255 - 120) / 95, 0, 1) ** 1.3
    s_sea = np.clip((g * 255 - 80) / 22, 0, 1) ** 1.5
    land = land_lo + (land_hi - land_lo) * s_land[..., None]
    sea = sea_lo + (sea_hi - sea_lo) * s_sea[..., None]
    rgb = sea * (1 - mask) + land * mask
    im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB")
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
    save(im, f"relief_{tag}.jpg", 82 if tag == "4k" else 80)
