"""主題導覽影片（展覽用，60–90 秒，中英文各一版，結尾放網站 QR code）· Themed tour videos for exhibitions (60–90 s, zh + en, QR code at the end)

  python3 -m http.server 8765                          # 在 repo 根目錄開本機預覽 · serve the repo root first
  python3 tools/promo/themes.py offshore [--lang en] [--only o2_profile] [--preview] [--cards] [--assemble]

不加 --cards／--assemble 時三步都做：錄製地球儀畫面 → 產生並渲染開場與結尾字卡 → 合成（預設背景音樂）。
Without --cards / --assemble all three steps run: record the globe → render the title and end cards → assemble (default music).
輸出在 tools/promo/work_t_<主題>[_en]/，成品 tools/promo/theme_<主題>[_en].mp4 與分享版 *_share.mp4（不進 git）。
Outputs go to tools/promo/work_t_<theme>[_en]/, the films to tools/promo/theme_<theme>[_en].mp4 and *_share.mp4 (not in git).

內容規則（使用者 2026-11-16）：不配旁白、字卡放大、頭尾同色可循環；展覽版結尾放 QR code；字卡不寫會過期的數字，
要寫數字時由 FIGURES 從網站資料當場算；船隻一律寫「示意」。
Content rules (owner, 16 Nov 2026): no voice-over, large captions, head and tail in the same colour so the film loops; the exhibition
cut ends with a QR code; captions avoid figures that go stale, and any figure is computed from the site's data by FIGURES; vessels are always labelled illustrative.
"""
import argparse, json, subprocess, sys
from pathlib import Path
from urllib.parse import quote
import capture as C
from capture import H, F, click, wheel
from skill_path import intro_video_dir

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
SITE = 'https://dofliu.github.io/windfarmTaiwan/'
SCRIPTS = intro_video_dir() / 'scripts'


# 展覽版字卡放大（使用者 2026-11-16：字卡放大）· larger captions for exhibition screens
C.OVERLAY_JS = (C.OVERLAY_JS.replace('font-size:46px', 'font-size:66px').replace('font-size:17px', 'font-size:23px')
                .replace('font-size:21px', 'font-size:30px').replace('padding:16px 40px 18px', 'padding:22px 56px 26px'))


def tnext():
    return click('#g-tourBar .tnext')


# 每個主題：開場字卡、實機錄製段落（格式同 capture.SCENES，cap=(kicker, 中文, 英文副標)，en=英文字卡）、結尾字卡
# Each theme: title card, recorded segments (same format as capture.SCENES; cap = kicker, Chinese, English subline; en = English card), end card
THEMES = {
 'offshore': dict(
  title=('OFFSHORE WIND', '離岸風電：從海床到海面', '水下基礎、浮動式與海上的風場',
         'Offshore wind: from seabed to sea surface', 'Foundations, floating turbines and the farms at sea'),
  scenes={
   'o1_fd': dict(dur=12, start='layer=fd&r=C%3AEurope', setup=[], settle=3.0,
      acts=[(5.5, F('Gemini', 'layer=fd'))],
      cap=('FOUNDATIONS', '海床上的基礎，逐場查證上色', 'Monopile, jacket, gravity, floating'),
      en=('FOUNDATIONS', 'What holds each turbine up', 'Checked farm by farm, colour-coded')),
   'o2_profile': dict(dur=10, start='layer=fd&f=' + quote('Hywind Scotland'), setup=[], settle=4.0, acts=[],
      cap=('TO SCALE', '水深、輪轂、葉輪，按比例畫出', 'Water depth, hub height and rotor'),
      en=('TO SCALE', 'Depth, hub and rotor to scale', "Drawn from each farm's own sources")),
   'o3_float': dict(dur=14, start='y=2026', setup=[], settle=1.0,
      acts=[(0.3, H('tour=fl')), (5.0, tnext()), (9.5, tnext())],
      cap=('FLOATING', '浮動式：把風機帶到深海', 'From one demonstrator to floating farms'),
      en=('FLOATING WIND', 'Taking turbines into deep water', 'From one demonstrator to floating farms')),
   'o4_sea': dict(dur=12, start='f=' + quote('Hornsea Two') + '&sv=1', setup=[], settle=0.5, acts=[],
      cap=('SEA LEVEL', '海面視角：站在風機旁', '船橋高度看出去，風機在實際機位'),
      en=('SEA-LEVEL VIEW', 'Stand among the turbines', 'From bridge height, turbines at their real positions')),
   'o5_ships': dict(dur=11, start='ships=1&f=' + quote('Hornsea Two'), setup=[], settle=2.0,
      acts=[(0.4 + k * 0.5, wheel(-120, 760, 640)) for k in range(5)] + [(3.0, wheel(0, 4, 1076))],
      cap=('VESSELS · ILLUSTRATIVE', '運維船與施工船（示意）', '不是即時船位，大小不是實際比例'),
      en=('VESSELS · ILLUSTRATIVE', 'Service and installation vessels', 'Illustrative: not live positions, not to scale')),
  },
  end=('掃描打開網站', '離岸風電、港口、事件與里程碑，都在這顆地球上', 'Scan to open the site', 'Offshore wind, ports, events and milestones on one globe'),
 ),
}


def card_html(path, dur, kicker, title, sub, qr=None, lang='zh'):
    """開場／結尾字卡（以 intro-video 的場景模板為底；背景與地球儀頁同色，接得上循環）· title / end card on the skill's template"""
    T = (intro_video_dir() / 'assets' / 'scene_template.html').read_text(encoding='utf-8')
    A, B = '<!-- ▼▼ 本景內容(範例:開場 hero,整段換掉) ▼▼ -->', '<!-- ▲▲ 本景內容到此 ▲▲ -->'
    pre, rest = T.split(A); _, post = rest.split(B)
    css = """
.bg{background:radial-gradient(1100px 760px at 50% 46%,rgba(45,212,191,.10),transparent 65%),#04070d}
.t1{font-size:112px;font-weight:900;color:#f4f8ff;line-height:1.15}
.t2{font-size:40px;color:rgba(232,238,247,.78);margin-top:30px}
.qr{width:420px;height:420px;border-radius:28px;background:#fff;padding:26px;box-sizing:border-box;margin-top:46px;
 box-shadow:0 0 90px rgba(45,212,191,.35)}
.qr img{width:100%;height:100%;display:block}
.url{font-size:30px;letter-spacing:.04em;color:#7ff0df;margin-top:26px;font-weight:700}
.fadeout{position:fixed;inset:0;background:#04070d;opacity:0;animation:fo .9s ease calc(var(--dur) - .9s) both;z-index:50}
@keyframes fo{to{opacity:1}}
"""
    if qr:
        body = f"""
 <div class="kicker in" style="--d:.1s">{kicker}</div>
 <div class="t1 pop" style="--d:.35s;font-size:92px;margin-top:18px">{title}</div>
 <div class="qr pop" style="--d:.8s"><img src="{qr}"></div>
 <div class="url in" style="--d:1.3s">{SITE.replace('https://', '').rstrip('/')}</div>
 <div class="t2 in" style="--d:1.6s;font-size:34px">{sub}</div>
 <div class="fadeout"></div>
"""
    else:
        body = f"""
 <div class="kicker in" style="--d:.2s">{kicker}</div>
 <div class="t1 pop" style="--d:.6s;margin-top:26px;{'font-size:84px;' if lang == 'en' else ''}max-width:1760px;white-space:normal">{title}</div>
 <div class="t2 in" style="--d:1.3s">{sub}</div>
"""
    h = pre.replace('<title>SceneXX 標題</title>', f'<title>{title}</title>')
    h = h.replace('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */', '/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */\n' + css)
    h = h.replace('--dur:7s', f'--dur:{dur}s')
    if lang == 'en':
        h = h.replace('lang="zh-Hant"', 'lang="en"')
    path.write_text(h + body + B + post, encoding='utf-8')


def make_qr(path):
    import qrcode, qrcode.image.svg                      # SVG：不需要 Pillow · SVG output, no Pillow needed
    q = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M, image_factory=qrcode.image.svg.SvgPathFillImage)
    q.add_data(SITE); q.make(fit=True)
    q.make_image().save(str(path))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('theme', choices=sorted(THEMES))
    ap.add_argument('--lang', default='zh', choices=['zh', 'en'])
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--preview', action='store_true')
    ap.add_argument('--cards', action='store_true', help='只做字卡 · cards only')
    ap.add_argument('--assemble', action='store_true', help='只合成 · assemble only')
    a = ap.parse_args()
    th = THEMES[a.theme]; en = a.lang == 'en'
    work = HERE / ('work_t_' + a.theme + ('_en' if en else ''))
    work.mkdir(exist_ok=True)
    C.WORK, C.LANG = work, a.lang
    do_all = not (a.cards or a.assemble or a.preview or a.only)
    # 1 錄製 · record
    if do_all or a.preview or a.only:
        for name, sc in th['scenes'].items():
            if a.only and name not in a.only:
                continue
            C.CAP_EN[name] = sc['en']
            C.capture(name, sc, a.preview)
    # 2 字卡 · cards
    sfx = '_en' if en else ''
    open_f, end_f = f'{a.theme}_open{sfx}.html', f'{a.theme}_end{sfx}.html'
    if do_all or a.cards:
        k, tz, sz, te, se = th['title']
        ez, ezs, ee, ees = th['end']
        make_qr(work / 'qr.svg')
        card_html(work / open_f, 6, k, te if en else tz, se if en else sz, lang=a.lang)
        card_html(work / end_f, 8, 'TAIWAN WIND WATCH', ee if en else ez, ees if en else ezs, qr='qr.svg', lang=a.lang)
        sb = dict(fps=30, width=1920, height=1080, xfade=0.6,
                  scenes=[dict(file=open_f, duration=6, transition='fade'), dict(file=end_f, duration=8, transition='fade')])
        (work / 'cards.json').write_text(json.dumps(sb, indent=1), encoding='utf-8')
        subprocess.run([sys.executable, str(SCRIPTS / 'render_scenes.py'), str(work / 'cards.json'), '--workdir', str(work)], check=True)
    # 3 合成 · assemble
    if do_all or a.assemble:
        tr = ['smoothleft', 'fade', 'smoothup', 'fade', 'smoothleft', 'fade']
        scenes = [dict(file=open_f, duration=6, transition='fade')]
        scenes += [dict(file=n + '.html', duration=sc['dur'], transition=tr[i % len(tr)]) for i, (n, sc) in enumerate(th['scenes'].items())]
        scenes += [dict(file=end_f, duration=8, transition='fade')]
        sb = dict(fps=30, width=1920, height=1080, xfade=0.6, scenes=scenes)
        (work / 'storyboard.json').write_text(json.dumps(sb, indent=1), encoding='utf-8')
        out = HERE / f'theme_{a.theme}{sfx}.mp4'
        subprocess.run([sys.executable, str(SCRIPTS / 'assemble_video.py'), str(work / 'storyboard.json'), '--workdir', str(work),
                        '--out', str(out), '--music', 'default'], check=True)
        share = HERE / f'theme_{a.theme}{sfx}_share.mp4'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out), '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
                        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(share)], check=True)
        print('done', out, share)


if __name__ == '__main__':
    main()
