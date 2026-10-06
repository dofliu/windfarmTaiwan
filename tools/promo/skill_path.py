"""找 intro-video 技能的位置（場景模板、虛擬時鐘、渲染與合成程式）· Locate the intro-video skill (scene template, virtual clock, render/assemble scripts)

設環境變數 INTRO_VIDEO_DIR，或讓程式在 ~/.claude/skills/ 底下自動尋找。
Set INTRO_VIDEO_DIR, or let it search under ~/.claude/skills/.
"""
import os
from pathlib import Path


def intro_video_dir():
    d = os.environ.get('INTRO_VIDEO_DIR')
    if d:
        return Path(d)
    for p in sorted(Path.home().glob('.claude/skills/**/intro-video/SKILL.md')):
        return p.parent
    raise SystemExit('intro-video skill not found: set INTRO_VIDEO_DIR · 找不到 intro-video 技能，請設定 INTRO_VIDEO_DIR')
