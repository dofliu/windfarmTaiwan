#!/usr/bin/env python3
"""從 MaStR 全國匯出檔只取出風機與代碼表 · Fetch only the wind-unit and catalogue files from the MaStR bulk export

  python3 tools/fetch_mastr.py mastr/          # → mastr/EinheitenWind.xml、mastr/Katalogwerte.xml

聯邦網路局每天更新「Gesamtdatenexport」（約 3 GB 的 zip，https://www.marktstammdatenregister.de/MaStR/Datendownload）。
這支程式從下載頁找出最新的檔名，用 HTTP 分段下載只讀 zip 的目錄與需要的兩個檔（壓縮後約 10 MB），不用下載整個 zip。
之後跑 tools/build_mastr.py。授權：Datenlizenz Deutschland – Namensnennung – Version 2.0。

The Federal Network Agency publishes the full export daily (about 3 GB). This script finds the newest file on the download page and
uses HTTP range requests to read only the zip directory and the two files needed (about 10 MB compressed). Then run tools/build_mastr.py.
"""
import io
import re
import sys
import urllib.request
import zipfile
from pathlib import Path

PAGE = 'https://www.marktstammdatenregister.de/MaStR/Datendownload'
WANT = ('EinheitenWind.xml', 'Katalogwerte.xml')
UA = {'User-Agent': 'windfarmTaiwan/mastr (github.com/dofliu/windfarmTaiwan)'}


class RangeFile(io.RawIOBase):
    """以 HTTP Range 讀取遠端檔案的可 seek 檔案物件"""

    def __init__(self, url):
        self.url, self.pos = url, 0
        self.size = int(urllib.request.urlopen(urllib.request.Request(url, method='HEAD', headers=UA), timeout=60).headers['Content-Length'])

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else self.pos + off if whence == 1 else self.size + off
        return self.pos

    def readinto(self, b):
        if self.pos >= self.size or not len(b):
            return 0
        end = min(self.size, self.pos + len(b)) - 1
        for attempt in range(5):
            try:
                req = urllib.request.Request(self.url, headers=dict(UA, Range=f'bytes={self.pos}-{end}'))
                data = urllib.request.urlopen(req, timeout=300).read()
                break
            except OSError:
                if attempt == 4:
                    raise
        b[:len(data)] = data
        self.pos += len(data)
        return len(data)


def main(out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    html = urllib.request.urlopen(urllib.request.Request(PAGE, headers=UA), timeout=60).read().decode('utf-8', 'replace')
    urls = sorted(set(re.findall(r'https://download\.marktstammdatenregister\.de/Gesamtdatenexport_\d{8}_[\d.]+\.zip', html)))
    if not urls:
        sys.exit('no Gesamtdatenexport link found on ' + PAGE)
    url = urls[-1]
    print('export:', url, flush=True)
    z = zipfile.ZipFile(io.BufferedReader(RangeFile(url), buffer_size=8 << 20))
    for info in z.infolist():
        if info.filename in WANT:
            with z.open(info) as src, open(out / info.filename, 'wb') as dst:
                while chunk := src.read(8 << 20):
                    dst.write(chunk)
            print(f'{info.filename}: {info.file_size / 1e6:.0f} MB', flush=True)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
