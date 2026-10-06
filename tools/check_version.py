#!/usr/bin/env python3
"""PR 的版本號與更新紀錄檢查 · Version and changelog check for a pull request (CLAUDE.md §7)

  python3 tools/check_version.py origin/main

1. CHANGELOG.md 與 CHANGELOG.en.md 最上面一段要是同一個版本。
2. 改到網站的 PR（index.html、assets/、data/global/ 下網站讀取的檔案、data/live/units.json）：
   assets/js/core.js 的 WW.VERSION 要比基準分支新（語意化版本），兩份 CHANGELOG 最上面一段都要是這個版本。
只改文件或工具的 PR 不必改版號。GitHub Actions 的 pr-check 在每個 PR 跑這支。

1. The top entries of both changelogs must name the same version.
2. A PR that changes the site (index.html, assets/, files the site loads from data/global/, data/live/units.json) must raise
   WW.VERSION in assets/js/core.js above the base branch (semantic versioning), and both changelogs must start with that version.
PRs that only touch documents or tools need no version change. The pr-check workflow runs this on every pull request.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VER = re.compile(r"WW\.VERSION = '(\d+)\.(\d+)\.(\d+)'")


def git(*a):
    return subprocess.run(['git', *a], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def site_file(p):
    return p == 'index.html' or p.startswith('assets/') or p == 'data/live/units.json' or bool(re.match(r'data/global/[^/]+$', p))


def top(path):
    m = re.search(r'^## v(\d+\.\d+\.\d+)', (ROOT / path).read_text(encoding='utf-8'), re.M)
    return m.group(1) if m else None


def main(base):
    mb = git('merge-base', base, 'HEAD').strip()
    changed = [p for p in git('diff', '--name-only', mb, 'HEAD').split('\n') if p]
    site = [p for p in changed if site_file(p)]
    head = tuple(map(int, VER.search((ROOT / 'assets/js/core.js').read_text(encoding='utf-8')).groups()))
    was = tuple(map(int, VER.search(git('show', f'{mb}:assets/js/core.js')).groups()))
    v = '.'.join(map(str, head))
    zh, en = top('CHANGELOG.md'), top('CHANGELOG.en.md')
    errs = []
    if zh != en:
        errs.append(f'CHANGELOG.md starts with v{zh} but CHANGELOG.en.md with v{en} · 兩份 CHANGELOG 最上面的版本不同')
    if site:
        if head <= was:
            errs.append(f'the site changed ({len(site)} files, e.g. {site[0]}) but WW.VERSION is still v{v} (base v{".".join(map(str, was))}) · '
                        '改到網站要在 assets/js/core.js 提高版本號')
        if zh != v or en != v:
            errs.append(f'both changelogs must start with "## v{v} — date" (CHANGELOG.md: v{zh}, CHANGELOG.en.md: v{en}) · '
                        '兩份 CHANGELOG 最上面要加這個版本的一段')
    print(f'{len(changed)} files changed, {len(site)} site files; version v{".".join(map(str, was))} → v{v}; changelogs v{zh} / v{en}')
    for e in errs:
        print('::error::' + e)
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'origin/main'))
