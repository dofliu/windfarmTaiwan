"""風電里程碑動畫的展覽版：每章結尾接 4 秒地球儀實機畫面，片尾接 QR code · Exhibition cut of the wind-milestones film:
a 4-second clip of the real globe after every chapter, and a QR-code end card.

動畫本身由 history-timeline-film 技能產生；原始檔收在 tools/promo/history/（中文）與 history/en/（英文差異檔），
`setup [--lang en]` 還原成可渲染的專案 tools/promo/work_t_history[_en]/（不進 git），先在那裡渲染出 out/film_<lang>.mp4。
The film comes from the history-timeline-film skill; its sources live in tools/promo/history/ (Chinese) and history/en/ (the English
overrides), and `setup [--lang en]` restores a renderable project in tools/promo/work_t_history[_en]/ (not in git); render out/film_<lang>.mp4 there first.

  python3 tools/promo/history_film.py setup [--lang en]                # 從 history/ 還原專案 · restore the project
  python3 -m http.server 8765                                 # repo 根目錄 · serve the repo root
  python3 tools/promo/history_film.py globe [--lang en] [--only c03]   # 錄地球儀片段 · record the globe clips
  python3 tools/promo/history_film.py assemble [--lang en]              # 插入片段、加 QR 結尾、合成 · splice and assemble

時間：片頭 6 秒，每章 8 秒（120 BPM、4 小節），片尾 12 秒。地球儀片段 4 秒＝2 小節，配樂重複該章最後 2 小節，所以節拍不亂。
Timing: 6 s intro, 8 s per chapter (120 BPM, 4 bars), 12 s outro. Each globe clip is 4 s = 2 bars and repeats the chapter's last two bars of music, so the beat stays on the grid.
字卡不寫網址（使用者 2026-10 的決定）；結尾 QR code 依使用者 2026-11-16 同意。 · No URL in captions (owner, Oct 2026); the QR end card follows the owner's approval of 16 Nov 2026.
"""
import argparse, subprocess, sys, wave, struct
from pathlib import Path
from urllib.parse import quote
import capture as C
from capture import wheel

HERE = Path(__file__).parent
INTRO, CH, OUTRO, N, CLIP = 6.0, 8.0, 12.0, 10, 4.0
MS = lambda name, extra='': (extra + '&' if extra else '') + 'ms=' + quote(name)
# 拉近：對地圖畫布送合成的滾輪事件，滑鼠游標不進地圖，不會跳出風場提示框 · zoom with a synthetic wheel event on the canvas so the pointer never hovers a farm
ZOOM = ('js', "(()=>{const c=document.querySelector('#page-global canvas');if(c)c.dispatchEvent(new WheelEvent('wheel',{deltaY:-12,clientX:760,clientY:600,bubbles:true,cancelable:true}));})()")

# 章節 → 地球儀深連結（里程碑或事件卡片）與字卡 · chapter → globe deep link and caption
# Blyth 與 26 MW 級風機的事件沒有座標、26 MW 里程碑的點位（福建）與事件（山東東營）不一致（TODO 待查證）→ 這兩章開事件卡片
CLIPS = [
 ('c01', 'r=C%3AEurope&ev=WIND-153', ('布萊斯的布帆風車', 'James Blyth\'s windmill'), ('事件卡片：原文出處', 'Event card with its sources')),
 ('c02', MS("Smith–Putnam turbine, Grandpa's Knob, Vermont"), ('史密斯–帕特南風機', 'The Smith–Putnam turbine'), ('里程碑：位置與規格', 'Milestone: place and specs')),
 ('c03', MS('Gedser wind turbine'), ('Gedser 風機', 'The Gedser turbine'), ('里程碑：位置與規格', 'Milestone: place and specs')),
 ('c04', MS('Tvind turbine (Tvindkraft), Ulfborg'), ('Tvind 風機', 'The Tvind turbine'), ('里程碑：位置與規格', 'Milestone: place and specs')),
 ('c05', MS('Altamont Pass wind farm, California'), ('加州 Altamont 風場', 'Altamont Pass'), ('里程碑與附近的風場', 'The milestone and farms nearby')),
 ('c06', MS('Vindeby offshore wind farm'), ('Vindeby 離岸風場', 'Vindeby offshore wind farm'), ('里程碑：第一座離岸風場', 'Milestone: the first offshore farm')),
 ('c07', MS('Horns Rev 1'), ('Horns Rev 1', 'Horns Rev 1'), ('北海的離岸風場群', 'Offshore farms in the North Sea')),
 ('c08', MS('Hywind Scotland, Buchan Deep'), ('Hywind Scotland', 'Hywind Scotland'), ('浮動式風場的位置', 'Where the floating farm is')),
 ('c09', MS('Formosa 1 offshore wind farm, Miaoli'), ('海洋風電', 'Formosa 1'), ('台灣海峽的離岸風場', 'Offshore farms in the Taiwan Strait')),
 ('c10', 'r=CHN&ev=WIND-166', ('26 MW 級海上風機', 'A 26 MW-class turbine'), ('事件卡片：原文出處', 'Event card with its sources')),
]


def setup(lang):
    """從 repo 的 history/（中文原始檔）與 history/en/（英文差異檔）還原出可渲染的專案，並安裝 esbuild · restore a renderable project"""
    import shutil
    src, dst = HERE / 'history', HERE / ('work_t_history' + ('_en' if lang == 'en' else ''))
    if dst.exists():
        raise SystemExit(f'{dst} already exists; remove it first · 目錄已存在，先刪除再還原')
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns('en'))
    if lang == 'en':
        for f in (src / 'en').rglob('*'):
            if f.is_file():
                (dst / f.relative_to(src / 'en')).write_bytes(f.read_bytes())
    subprocess.run(['npm', 'install', '--no-audit', '--no-fund'], cwd=dst, check=True)
    print('ready', dst)


def work(lang):
    d = HERE / ('work_h_globe' + ('_en' if lang == 'en' else ''))
    d.mkdir(exist_ok=True)
    return d


def record(lang, only):
    C.WORK, C.LANG = work(lang), lang
    for cid, start, title, sub in CLIPS:
        if only and cid not in only:
            continue
        k = ('ON THE GLOBE', '在地球儀上') if lang != 'en' else ('ON THE GLOBE', 'On the globe')
        cap = (k[0], title[0], sub[0]) if lang != 'en' else (k[0], title[1], sub[1])
        C.CAP_EN[cid] = cap
        # 船隻關掉、規劃中不畫；滑鼠停在左下角，不觸發地圖上的提示框 · vessels off, no pipeline rings, mouse parked in a corner
        sc = dict(dur=CLIP, start=start + '&pipe=0&ships=0', setup=[wheel(0, 4, 1076)], settle=5.0,
                  acts=[(0.2 + i * 0.7, ZOOM) for i in range(3)], cap=cap)
        C.capture(cid, sc)


def run(*a):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)


def read_wav(p):
    with wave.open(str(p)) as w:
        ch, sw, fr = w.getnchannels(), w.getsampwidth(), w.getframerate()
        data = w.readframes(w.getnframes())
    assert sw == 2
    return ch, fr, list(struct.unpack('<%dh' % (len(data) // 2), data))


def assemble(lang):
    sfx = '_en' if lang == 'en' else ''
    proj = HERE / ('work_t_history' + sfx)
    film = proj / 'out' / ('film_' + ('en' if lang == 'en' else 'zh') + '.mp4')
    wd = work(lang)
    seg = wd / 'seg'; seg.mkdir(exist_ok=True)
    # 1 影片片段 · video pieces (re-encoded for frame-accurate cuts)
    cuts = [0.0] + [INTRO + CH * i for i in range(1, N + 1)] + [INTRO + CH * N + OUTRO]
    parts = []
    for i in range(len(cuts) - 1):
        out = seg / f'f{i:02d}.mp4'
        run('-ss', f'{cuts[i]:.3f}', '-i', str(film), '-t', f'{cuts[i + 1] - cuts[i]:.3f}', '-an', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', str(out))
        parts.append(out)
        if i < N:                                   # 該章之後接地球儀片段（淡入淡出）· the globe clip after this chapter
            clip = wd / f'{CLIPS[i][0]}.mp4'
            out2 = seg / f'g{i:02d}.mp4'
            run('-i', str(clip), '-t', f'{CLIP:.3f}', '-vf', f'fade=t=in:st=0:d=0.25,fade=t=out:st={CLIP - 0.25:.2f}:d=0.25', '-an', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', str(out2))
            parts.append(out2)
    # QR 結尾（沿用主題影片的字卡；在這裡才載入，免得錄製時字卡也被放大）· QR end card from the themed videos (imported here so recording keeps normal captions)
    import themes as TH
    k, (tz, te), (sz, se) = 'TAIWAN WIND WATCH', ('掃描打開網站', 'Scan to open the site'), ('每一個里程碑，都在這顆地球上', 'Every milestone is on this globe')
    TH.make_qr(wd / 'qr.svg')
    endf = f'end{sfx}.html'
    TH.card_html(wd / endf, 6, k, te if lang == 'en' else tz, se if lang == 'en' else sz, qr='qr.svg', lang=lang)
    import json
    (wd / 'cards.json').write_text(json.dumps(dict(fps=30, width=1920, height=1080, xfade=0.6, scenes=[dict(file=endf, duration=6, transition='fade')])), encoding='utf-8')
    subprocess.run([sys.executable, str(TH.SCRIPTS / 'render_scenes.py'), str(wd / 'cards.json'), '--workdir', str(wd)], check=True)
    endmp4 = wd / endf.replace('.html', '.mp4')
    out3 = seg / 'zz_end.mp4'
    run('-i', str(endmp4), '-t', '6', '-an', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', str(out3))
    parts.append(out3)
    (seg / 'list.txt').write_text(''.join(f"file '{p.name}'\n" for p in parts), encoding='utf-8')
    video = wd / 'video.mp4'
    run('-f', 'concat', '-safe', '0', '-i', str(seg / 'list.txt'), '-c', 'copy', str(video))
    # 2 音軌：每段地球儀片段重複該章最後 2 小節；QR 結尾用片頭的風鈴（淡出），接得回片頭 · audio
    awav = wd / 'film.wav'
    run('-i', str(film), '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', str(awav))
    ch, fr, s = read_wav(awav)
    at = lambda t: int(round(t * fr)) * ch
    outs = []
    for i in range(len(cuts) - 1):
        outs.append(s[at(cuts[i]):at(cuts[i + 1])])
        if i < N:
            outs.append(s[at(cuts[i + 1] - CLIP):at(cuts[i + 1])])
    tail = s[at(0):at(6.0)]
    n = len(tail) // ch
    tail = [int(v * max(0.0, 1 - (j // ch) / n) ** 1.5) for j, v in enumerate(tail)]
    outs.append(tail)
    X = int(0.005 * fr) * ch                        # 5 ms 交叉淡化，避免接點喀聲 · 5 ms crossfades at the joins
    res = outs[0]
    for b in outs[1:]:
        for j in range(0, X, ch):
            w = j / X
            for c in range(ch):
                res[len(res) - X + j + c] = int(res[len(res) - X + j + c] * (1 - w) + b[j + c] * w)
        res = res + b[X:]
    aout = wd / 'audio.wav'
    with wave.open(str(aout), 'wb') as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(fr)
        w.writeframes(struct.pack('<%dh' % len(res), *[max(-32768, min(32767, v)) for v in res]))
    final = HERE / f'history_milestones_globe{sfx or "_zh"}.mp4'
    run('-i', str(video), '-i', str(aout), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', str(final))
    share = HERE / f'history_milestones_globe{sfx or "_zh"}_share.mp4'
    run('-i', str(final), '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(share))
    print('done', final, share)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('step', choices=['setup', 'globe', 'assemble'])
    ap.add_argument('--lang', default='zh', choices=['zh', 'en'])
    ap.add_argument('--only', nargs='*')
    a = ap.parse_args()
    {'setup': lambda: setup(a.lang), 'globe': lambda: record(a.lang, a.only), 'assemble': lambda: assemble(a.lang)}[a.step]()


if __name__ == '__main__':
    main()
