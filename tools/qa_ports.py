#!/usr/bin/env python3
"""港口資料健檢 · Check data/global/ports.json

離岸風電港口（組裝出港、製造、運維）是人工整理、逐港附出處的資料。改完 ports.json 後執行：
  python3 tools/qa_ports.py
檢查欄位、角色、座標是否落在該國範圍內、出處連結，以及「服務過的風場」是否對得到 wind_farms.json 的名稱。
有錯誤時以非零狀態結束。

The offshore wind ports layer is curated by hand, with sources for every port. Run this after editing
ports.json: it checks fields, roles, that coordinates fall inside the country's bounding box, source links,
and that every farm listed under "farms" matches a name in wind_farms.json exactly. Exits non-zero on errors.
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROLES = {"marshalling", "foundation", "tower", "blade", "nacelle", "cable", "floating", "om"}
STATUS = {"operating", "developing"}
REQUIRED = ["id", "name", "zh", "iso", "lat", "lon", "roles", "status", "en", "zhNote", "src"]
MARGIN = 0.6  # 度：港口可以在國界外框稍外（離岸島嶼、港口外堤）


def main():
    ports = json.loads((ROOT / "data/global/ports.json").read_text(encoding="utf-8"))["ports"]
    farms = {r[0] for r in json.loads((ROOT / "data/global/wind_farms.json").read_text(encoding="utf-8"))["rows"]}
    countries = {c["iso"]: c for c in json.loads((ROOT / "data/global/wind_global.json").read_text(encoding="utf-8"))["countries"]}
    errors, warns = [], []
    ids = Counter(p.get("id") for p in ports)
    for i, p in enumerate(ports):
        tag = f"{p.get('id') or '#' + str(i)}"
        for k in REQUIRED:
            if p.get(k) in (None, "", []):
                errors.append(f"{tag}: missing {k}")
        if ids[p.get("id")] > 1:
            errors.append(f"{tag}: duplicate id")
        bad = set(p.get("roles") or []) - ROLES
        if bad:
            errors.append(f"{tag}: unknown roles {sorted(bad)}")
        if p.get("status") not in STATUS:
            errors.append(f"{tag}: status must be one of {sorted(STATUS)}")
        lat, lon = p.get("lat"), p.get("lon")
        if not (isinstance(lat, (int, float)) and isinstance(lon, (int, float)) and -90 <= lat <= 90 and -180 <= lon <= 180):
            errors.append(f"{tag}: bad coordinates {lat}, {lon}")
        else:
            c = countries.get(p.get("iso"))
            if not c:
                warns.append(f"{tag}: {p.get('iso')} has no country entry (no national statistics); card shows the ISO code")
            elif c.get("bbox"):
                w, s, e, n = c["bbox"]
                if not (w - MARGIN <= lon <= e + MARGIN and s - MARGIN <= lat <= n + MARGIN):
                    errors.append(f"{tag}: {lat}, {lon} is outside {p['iso']} bounding box {c['bbox']}")
        for u in p.get("src") or []:
            if not str(u).startswith("https://") and not str(u).startswith("http://"):
                errors.append(f"{tag}: source is not a URL: {u}")
        for f in p.get("farms") or []:
            if f not in farms:
                errors.append(f"{tag}: farm not in wind_farms.json: {f!r} (move it to farmsOther or fix the name)")
        since = p.get("since")
        if since is not None and not (1990 <= since <= 2030):
            errors.append(f"{tag}: implausible since={since}")
        if len(p.get("en") or "") > 260:
            warns.append(f"{tag}: en note longer than 260 characters")
        if len(p.get("zhNote") or "") > 120:
            warns.append(f"{tag}: zhNote longer than 120 characters")
    by_iso = Counter(p.get("iso") for p in ports)
    by_role = Counter(r for p in ports for r in p.get("roles") or [])
    print(f"{len(ports)} ports in {len(by_iso)} countries; {sum(1 for p in ports if p.get('status') == 'developing')} in development")
    print("by country:", ", ".join(f"{k} {v}" for k, v in by_iso.most_common()))
    print("by role:", ", ".join(f"{k} {v}" for k, v in by_role.most_common()))
    print(f"farms linked: {sum(len(p.get('farms') or []) for p in ports)}; other projects (text only): {sum(len(p.get('farmsOther') or []) for p in ports)}")
    for w in warns:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    if errors:
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
