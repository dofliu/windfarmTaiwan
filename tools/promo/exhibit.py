#!/usr/bin/env python3
"""展覽用主題導覽影片：五支、各有中英文版（使用者 2026-11-16 決定）。在真正的網站上以虛擬時鐘逐格錄製，加片頭與 QR code 結尾，合成 MP4。
Themed tour videos for exhibitions: five films, each in Chinese and English (owner's decision, 16 Nov 2026). Records the real site frame by
frame on a virtual clock, adds a title card and a QR-code end card, and assembles the MP4.

  python3 -m http.server 8765                                    # 在 repo 根目錄開本機預覽 · serve the repo root first
  python3 tools/promo/exhibit.py f1 [--lang zh|en|both] [--only seg_id …] [--preview] [--force] [--no-assemble]

輸出 · output: tools/promo/exhibit/<film>/<lang>/（中間檔）與 tools/promo/exhibit/out/<film>_<lang>.mp4、<film>_<lang>_share.mp4（都不進 git）。
內容規則 · rules（CLAUDE.md、tools/promo/README.md）：
  - 不寫「開源」；展覽版結尾可放網站的 QR code（2026-11-16 同意），不另寫網址文字。
  - 事件片不放製作日前三年內的事件（EVENT_CUTOFF），各國都可，不刻意放台灣。
  - 字卡上的數字是製作當時的，重做前先對照網站與資料檔（本檔的 FACTS 由資料檔即時計算）。
  - 船隻是示意（網站圖例會寫），字卡也要寫「示意」。
"""
import argparse, datetime, json, os, re, shutil, subprocess, sys, tempfile, time
from pathlib import Path
from urllib.parse import quote
import capture as C                                    # VIRTUAL_CLOCK_JS、OVERLAY_JS、run_act、adv、H、F、click、speed、wheel
from skill_path import intro_video_dir
from playwright.sync_api import sync_playwright

SK = intro_video_dir()
sys.path.insert(0, str(SK / 'scripts'))
from render_scenes import render_scene

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
OUT = HERE / 'exhibit' / 'out'
FPS = C.FPS
SITE = 'https://dofliu.github.io/windfarmTaiwan/'
EVENT_CUTOFF = (datetime.date.today() - datetime.timedelta(days=3 * 365 + 1)).isoformat()   # 製作日前三年 · three years before production
H, F, click, speed, wheel = C.H, C.F, C.click, C.speed, C.wheel
NEXT = click('#g-tourBar .tnext')
EV_Y = 'y=' + str(int(EVENT_CUTOFF[:4]) - 1)   # 事件片的時間軸停在截止日前一年底，地圖上不會出現近三年的事件記號 · keeps recent event markers off the map


def page(h):                                           # 地球儀以外的頁面 · a page other than the globe
    return ('hash', h)


# ---------------- 由資料檔算出的數字（字卡用） · figures for the captions, computed from the data files ----------------
def facts():
    g = lambda p: json.loads((ROOT / 'data' / 'global' / p).read_text(encoding='utf-8'))
    ports = g('ports.json')['ports']
    ev = [e for e in g('events.json')['events'] if (e.get('date') or '') < EVENT_CUTOFF]
    return {'ports': len(ports), 'port_iso': len({p['iso'] for p in ports}), 'esbjerg': len(next(p for p in ports if p['id'] == 'dnk-esbjerg')['farms']),
            'events_old': len(ev),
            'ms': len(g('wind_global.json')['milestones'])}


def check_events(film):                                # 事件片：確認沒有用到製作日前三年內的事件 · no events from the last three years
    ev = {e['id']: e for e in json.loads((ROOT / 'data' / 'global' / 'events.json').read_text(encoding='utf-8'))['events']}
    ylim = int(EVENT_CUTOFF[:4]) - 1
    for s in film['segs']:
        hashes = [s['start']] + [a[1] for _, a in s.get('acts', []) if a[0] == 'hash']
        if not any('y=' in h for h in hashes) and s['id'] != 'timeline':
            raise SystemExit(f"{s['id']}: the events film must pin the timeline year (y=…) so recent event markers stay off the map")
        for h in hashes:
            m = re.search(r'\by=(\d{4})', h)
            if m and int(m.group(1)) > ylim:
                raise SystemExit(f"{s['id']}: y={m.group(1)} is later than {ylim}; recent events would show on the map")
        for _, a in s.get('acts', []):
            if a[0] == 'hash' and 'ev=' in a[1]:
                i = a[1].split('ev=')[1].split('&')[0]
                if (ev[i].get('date') or '') >= EVENT_CUTOFF:
                    raise SystemExit(f'{i} ({ev[i]["date"]}) is within three years of today; the events film must not use it')


# ---------------- 五支影片 · the five films ----------------
# 每段：id、start（地球儀的網址參數，或以 # 開頭的完整頁面）、dur（秒）、settle（開始錄之前推進的秒數）、setup、acts（[秒, 動作]）、cap（中英字卡）、pad／pos（字卡位置）
CARD_PAD = [0, 560]                                    # 右側有卡片時，字卡置中在地圖區 · centre the caption in the map when the card is open
FILMS = {
    'f1': {
        'title': {'zh': ('OFFSHORE WIND', '離岸風電：從海床到海面', '水下基礎、浮動式、海上作業，一次看懂'),
                  'en': ('OFFSHORE WIND', 'From seabed to sea surface', 'Foundations, floating wind and work at sea')},
        'hero': ('layer=fd&r=C%3AEurope', [], 3),
        'segs': [
            dict(id='fd_europe', start='layer=fd&r=C%3AEurope', dur=12, settle=3, acts=[(5.0, F('Gemini', 'layer=fd'))],
                 cap={'zh': ('FOUNDATIONS', '水下基礎，逐場查證上色', '單樁、套管、重力式、浮動式，每座附出處'),
                      'en': ('FOUNDATIONS', 'Foundations, checked farm by farm', 'Monopile, jacket, gravity base, floating — each sourced')}),
            dict(id='profile', start='layer=fd&f=' + quote('Hywind Scotland'), dur=9, settle=4, acts=[], pad=CARD_PAD,
                 cap={'zh': ('TO SCALE', '水深、輪轂、葉輪按比例畫出', '依每座風場自己的數字'),
                      'en': ('TO SCALE', 'Depth, hub and rotor to scale', "Drawn from each farm's own figures")}),
            dict(id='floating', start='', dur=15, settle=1, acts=[(0.3, H('tour=fl')), (4.6, NEXT), (8.8, NEXT)],
                 cap={'zh': ('FLOATING WIND', '浮動式：把風機帶到深海', '故事導覽，一站一站飛過去'),
                      'en': ('FLOATING WIND', 'Floating wind: into deep water', 'A guided story, stop by stop')}),
            dict(id='build', start='f=Sofia', dur=10, settle=3, acts=[], pad=CARD_PAD,
                 cap={'zh': ('AT SEA · ILLUSTRATIVE', '興建中：安裝船在海上施工', '船隻為示意，不是即時船位'),
                      'en': ('AT SEA · ILLUSTRATIVE', 'Under construction: the jack-up at work', 'Vessels are illustrative, not live positions')}),
            dict(id='service', start='f=' + quote('Hornsea One'), dur=11, settle=3, acts=[], pad=CARD_PAD,
                 cap={'zh': ('AT SEA · ILLUSTRATIVE', '營運中：CTV 與 SOV 出海維護', '航線依港口資料，船隻為示意'),
                      'en': ('AT SEA · ILLUSTRATIVE', 'In service: CTVs and an SOV', 'Routes from the port data; vessels are illustrative')}),
            dict(id='sealevel', start='f=' + quote('Formosa 1 Phase 2') + '&sv=1', dur=14, settle=1.5, acts=[],
                 cap={'zh': ('SEA-LEVEL VIEW', '從港口出海看風場', '實際機位與尺寸，3D 呈現'),
                      'en': ('SEA-LEVEL VIEW', 'Sail out from the port', 'Real turbine positions and sizes in 3D')}),
        ]},
    'f2': {
        'title': {'zh': ('PORTS', '港口與供應鏈', '風機從哪裡出港、在哪裡製造、由誰維護'),
                  'en': ('PORTS', 'Ports and the supply chain', 'Where turbines are built, shipped and serviced')},
        'hero': ('r=C%3AEurope', [wheel(-150, 960, 560), wheel(-150, 960, 560)], 3),
        'segs': [
            dict(id='europe', start='r=C%3AEurope', dur=12, settle=2, acts=[(4.6, H('port=dnk-esbjerg'))],
                 cap={'zh': ('PORTS', '{ports} 個離岸風電港口，每港附出處', '組裝出港、製造、海纜、浮動式組裝、運維'),
                      'en': ('PORTS', '{ports} offshore wind ports, each sourced', 'Marshalling, manufacturing, cables, floating, O&M')}),
            dict(id='esbjerg', start='port=dnk-esbjerg', dur=9, settle=3, acts=[], pad=CARD_PAD,
                 cap={'zh': ('MARSHALLING · O&M', '埃斯比約：連到 {esbjerg} 座服務過的風場', '弧線只連有出處佐證的風場'),
                      'en': ('MARSHALLING · O&M', 'Esbjerg and the {esbjerg} farms it served', 'Arcs only to farms a source ties to the port')}),
            dict(id='hull', start='port=gbr-hull', dur=9, settle=3, acts=[], pad=CARD_PAD,
                 cap={'zh': ('BLADES · LOAD-OUT', '赫爾：葉片工廠就在出港碼頭', '製造基地依產品分類'),
                      'en': ('BLADES · LOAD-OUT', 'Hull: a blade factory on the quay', 'Factories coded by what they make')}),
            dict(id='cuxhaven', start='port=deu-cuxhaven', dur=9, settle=3, acts=[], pad=CARD_PAD,
                 cap={'zh': ('NACELLES', '庫克斯港：機艙廠緊鄰碼頭', '從工廠直接裝船出海'),
                      'en': ('NACELLES', 'Cuxhaven: a nacelle plant on the quay', 'From the factory straight onto the ship')}),
            dict(id='fuqing', start='port=chn-fuqing-jiangyin', dur=9, settle=3, acts=[], pad=CARD_PAD,
                 cap={'zh': ('FULL SUPPLY CHAIN', '福清江陰：機艙、葉片與出港', '中國的海上風電產業園'),
                      'en': ('FULL SUPPLY CHAIN', 'Fuqing Jiangyin: nacelles, blades, load-out', "A Chinese offshore wind industrial park")}),
            dict(id='taichung', start='port=twn-taichung', dur=9, settle=3, acts=[], pad=CARD_PAD,
                 cap={'zh': ('ASSEMBLY HUB', '台中港：組裝、製造與運維', '台灣最主要的離岸風電港'),
                      'en': ('ASSEMBLY HUB', 'Taichung: assembly, factories and O&M', "Taiwan's main offshore wind port")}),
        ]},
    'f3': {
        'title': {'zh': ('EVENTS', '事件與教訓', '颱風、基礎、電網——每一則都附官方出處'),
                  'en': ('EVENTS', 'Events and lessons', 'Typhoons, foundations, the grid — each with an official source')},
        'hero': ('y=2015&r=C%3AEurope', [], 3),
        'segs': [
            dict(id='timeline', start='y=2002', dur=10, settle=1, setup=[speed(2)], acts=[(0.4, click('#g-play'))],
                 cap={'zh': ('EVENTS', '重大事件與事故，隨時間出現', '紅點是事故與故障，逐筆附出處'),
                      'en': ('EVENTS', 'Major events and incidents over time', 'Red marks are incidents and failures, each sourced')}),
            dict(id='typhoon', start=EV_Y, dur=9, settle=1, acts=[(0.3, H(EV_Y + '&ev=WIND-063'))], pad=CARD_PAD,
                 cap={'zh': ('2003 · JAPAN', '颱風梅米吹倒宮古島 3 部風機', '颱風地區的風機設計'),
                      'en': ('2003 · JAPAN', 'Typhoon Maemi topples three turbines', 'Turbine design in typhoon regions')}),
            dict(id='grout', start=EV_Y, dur=9, settle=1, acts=[(0.3, H(EV_Y + '&ev=WIND-139'))], pad=CARD_PAD,
                 cap={'zh': ('2010 · UK', '單樁灌漿連接失效', '過渡段沿樁身下滑'),
                      'en': ('2010 · UK', 'Grouted connections fail', 'Transition pieces slip down the monopiles')}),
            dict(id='grid', start=EV_Y, dur=9, settle=1, acts=[(0.3, H(EV_Y + '&ev=WIND-150'))], pad=CARD_PAD,
                 cap={'zh': ('2019 · UK', '雷擊後風場未保持併網', '電網穩定與故障穿越'),
                      'en': ('2019 · UK', 'A farm fails to ride through a lightning strike', 'Grid stability and fault ride-through')}),
            dict(id='gravity', start=EV_Y, dur=9, settle=1, acts=[(0.3, H(EV_Y + '&ev=WIND-145'))], pad=CARD_PAD,
                 cap={'zh': ('2022 · DENMARK', '風機連同重力式基礎翻倒入海', '老風場的結構檢查'),
                      'en': ('2022 · DENMARK', 'A turbine topples with its gravity base', 'Inspecting ageing offshore structures')}),
        ]},
    'f4': {
        'title': {'zh': ('MILESTONES', '關鍵風場與里程碑', '從 12 kW 到 26 MW'),
                  'en': ('MILESTONES', 'Key farms and milestones', 'From 12 kW to 26 MW')},
        'hero': ('r=C%3AEurope', [], 3),
        'segs': [
            dict(id='brush', start='', dur=8, settle=1, acts=[(0.3, H('ms=' + quote('Brush wind turbine, Cleveland')))], pad=CARD_PAD,
                 cap={'zh': ('1888 · USA', 'Brush 風機：第一部自動運轉的發電風機', '12 kW、144 片葉片'),
                      'en': ('1888 · USA', 'Brush: the first automatic wind generator', '12 kW and 144 blades')}),
            dict(id='gedser', start='', dur=8, settle=1, acts=[(0.3, H('ms=' + quote('Gedser wind turbine')))], pad=CARD_PAD,
                 cap={'zh': ('1957 · DENMARK', 'Gedser：三葉片「丹麥概念」', '現代風力機的原型'),
                      'en': ('1957 · DENMARK', "Gedser: the three-blade 'Danish concept'", 'The template for modern turbines')}),
            dict(id='vindeby', start='', dur=8, settle=1, acts=[(0.3, H('ms=' + quote('Vindeby offshore wind farm')))], pad=CARD_PAD,
                 cap={'zh': ('1991 · DENMARK', 'Vindeby：世界第一座離岸風場', '11 部 450 kW 風機'),
                      'en': ('1991 · DENMARK', "Vindeby: the world's first offshore farm", 'Eleven 450 kW turbines')}),
            dict(id='hornsrev', start='', dur=8, settle=1, acts=[(0.3, H('ms=' + quote('Horns Rev 1')))], pad=CARD_PAD,
                 cap={'zh': ('2002 · DENMARK', 'Horns Rev 1：第一座大型離岸風場', '北海 80 部 Vestas V80'),
                      'en': ('2002 · DENMARK', 'Horns Rev 1: the first large offshore farm', '80 Vestas V80s in the North Sea')}),
            dict(id='hywind', start='', dur=8, settle=1, acts=[(0.3, H('ms=' + quote('Hywind Scotland')))], pad=CARD_PAD,
                 cap={'zh': ('2017 · UK', 'Hywind Scotland：第一座商業浮動式風場', '5 部 6 MW 單柱式浮動風機'),
                      'en': ('2017 · UK', 'Hywind Scotland: the first commercial floating farm', 'Five 6 MW spar-type turbines')}),
            dict(id='hornsea2', start='', dur=8, settle=1, acts=[(0.3, H('ms=' + quote('Hornsea 2')))], pad=CARD_PAD,
                 cap={'zh': ('2022 · UK', 'Hornsea 2：1,320 MW', '全數併網時是全球最大的離岸風場'),
                      'en': ('2022 · UK', 'Hornsea 2: 1,320 MW', 'The largest operating offshore farm when completed')}),
            dict(id='dongfang', start='', dur=8, settle=1, acts=[(0.3, H('ms=' + quote('Dongfang 26 MW')))], pad=CARD_PAD,
                 cap={'zh': ('2025 · CHINA', '東方電氣 26 MW 風機', '310 m 葉輪，單機突破 25 MW'),
                      'en': ('2025 · CHINA', 'Dongfang Electric 26 MW turbine', 'A 310 m rotor, past the 25 MW mark')}),
        ]},
    'f5': {
        'title': {'zh': ('TAIWAN', '台灣的風電', '從示範機到 GW 級離岸風場'),
                  'en': ('TAIWAN', 'Wind power in Taiwan', 'From demonstration turbines to gigawatt offshore farms')},
        'hero': ('r=TWN', [], 3),
        'segs': [
            dict(id='tour', start='', dur=15, settle=1, acts=[(0.3, H('tour=tw')), (4.6, NEXT), (8.8, NEXT)],
                 cap={'zh': ('STORY TOUR', '台灣離岸之路', '故事導覽，一站一站飛過去'),
                      'en': ('STORY TOUR', "Taiwan's road offshore", 'A guided story, stop by stop')}),
            dict(id='farms', start='y=2026', dur=13, settle=1, acts=[(0.4, H('r=TWN')), (6.5, F('Greater Changhua 1 & 2a', 'r=TWN'))],
                 cap={'zh': ('TAIWAN', '陸域與離岸，一座座看', '點風場看機組、基礎與出處'),
                      'en': ('TAIWAN', 'Onshore and offshore, farm by farm', 'Turbines, foundations and sources on every card')}),
            dict(id='hailong', start='r=TWN&f=' + quote('Hai Long 2 & 3'), dur=10, settle=3, acts=[], pad=CARD_PAD,
                 cap={'zh': ('AT SEA · ILLUSTRATIVE', '海上的運維船', '船隻為示意，不是即時船位'),
                      'en': ('AT SEA · ILLUSTRATIVE', 'Service vessels at sea', 'Vessels are illustrative, not live positions')}),
            dict(id='live', start='#/live', dur=10, settle=2, acts=[], pos='bl',
                 cap={'zh': ('LIVE', '台灣即時：此刻的風電出力', '台電開放資料'),
                      'en': ('LIVE', 'Taiwan right now: wind output', 'Taipower open data')}),
            dict(id='wall', start='#/live/wall', dur=9, settle=2, acts=[], pos='bl',
                 cap={'zh': ('LIVE', '風場牆：每座風場此刻的出力', '台電開放資料'),
                      'en': ('LIVE', 'The farm wall: every farm right now', 'Taipower open data')}),
        ]},
}
for k, f in FILMS.items():
    for s in f['segs']:
        s.setdefault('setup', [])

HIDE_UI = """header,.site-header,#g-top,#g-bottom,#g-msPanel,#g-yearBig,#g-worldStat,#g-hint,#g-attr,#g-labels,#g-legStack,
  #g-events,#g-ports,#g-notice,#g-infoCard,#g-tourBar,footer,nav{visibility:hidden!important}"""


def launch(pw):
    return pw.chromium.launch(**({'executable_path': C.EXE} if C.EXE else {}), args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'])


def open_page(b, lang, start):
    pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script(C.VIRTUAL_CLOCK_JS)
    pg.add_init_script("try{localStorage.setItem('ww_lang',%s);localStorage.setItem('ww_globe_seen','1');localStorage.setItem('ww_globe_ships','1');"
                       "localStorage.setItem('ww_globe_ports','1');localStorage.setItem('ww_theme','dark')}catch(e){}" % json.dumps(lang))
    # 卡片上的維基百科摘要：時有時無（API 限流），內容也不是本站查證的，錄影時不查、整段藏起來 · Wikipedia extracts: rate-limited and not
    # checked by this site, so they are neither fetched nor shown in the recordings
    pg.route(re.compile(r'wikipedia\.org/w/api\.php'), lambda r: r.abort())
    pg.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#g-infoCard .wx{display:none!important}';document.head.appendChild(s)})")
    url = C.BASE + (start if start.startswith('#') else '#/global' + ('?' + start if start else ''))
    pg.goto(url)
    t0 = time.time()
    while time.time() - t0 < 14:                       # 資料載入（真實時間）期間推進虛擬時間 · advance virtual time while data loads
        C.adv(pg); time.sleep(0.03)
    return pg, errs


def record(seg, lang, work, preview=False):
    name, total = seg['id'], round(seg['dur'] * FPS)
    with sync_playwright() as pw:
        b = launch(pw)
        pg, errs = open_page(b, lang, seg['start'])
        for a in seg['setup']:
            C.run_act(pg, a)
        C.adv(pg, round(seg['settle'] * FPS))
        pg.evaluate(C.OVERLAY_JS, [list(seg['cap'][lang]), seg.get('pad'), seg.get('pos')])
        acts = sorted(seg['acts'], key=lambda x: x[0]); ai = 0
        td = Path(tempfile.mkdtemp(prefix='ex_' + name + '_'))
        shots = set(round(total * f) for f in (0.05, 0.3, 0.55, 0.8, 0.98)) if preview else None
        t1 = time.time()
        for i in range(total):
            t = i / FPS
            while ai < len(acts) and acts[ai][0] <= t:
                C.run_act(pg, acts[ai][1]); ai += 1
            pg.evaluate("t=>window.__ov&&window.__ov(t)", t)
            if preview:
                if i in shots: pg.screenshot(path=str(work / f'pv_{name}_{i:04d}.png'))
            else:
                pg.screenshot(path=str(td / f'f_{i + 1:06d}.png'))
            C.adv(pg)
        b.close()
    print(f'  {name} [{lang}]: {total} frames in {time.time() - t1:.0f}s', errs[:3], flush=True)
    if not preview:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(td / 'f_%06d.png'),
                        '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', str(work / f'{name}.mp4')], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f"{seg['dur'] * 0.85:.2f}", '-i', str(work / f'{name}.mp4'),
                        '-frames:v', '1', str(work / f'check_{name}.png')], check=True)
    shutil.rmtree(td, ignore_errors=True)


def hero(fid, film, dst):                              # 片頭與結尾的背景：隱藏介面的地球儀畫面 · background still, interface hidden
    start, setup, settle = film['hero']
    with sync_playwright() as pw:
        b = launch(pw)
        pg, _ = open_page(b, 'zh', start)
        for a in setup:
            C.run_act(pg, a); C.adv(pg, 8)
        C.adv(pg, round(settle * FPS))
        pg.add_style_tag(content=HIDE_UI)
        C.adv(pg, 30)
        pg.screenshot(path=str(dst))
        b.close()


# ---------------- 片頭與 QR 結尾（intro-video 的場景模板） · title and QR end cards on the intro-video scene template ----------------
TPL = (SK / 'assets' / 'scene_template.html').read_text(encoding='utf-8')
_A, _B = '<!-- ▼▼ 本景內容(範例:開場 hero,整段換掉) ▼▼ -->', '<!-- ▲▲ 本景內容到此 ▲▲ -->'
_pre, _rest = TPL.split(_A); _, _post = _rest.split(_B)
CREDIT = {'zh': '國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室',
          'en': 'National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu'}
BRAND = {'zh': '風電風情 · TAIWAN WIND WATCH', 'en': 'TAIWAN WIND WATCH · 風電風情'}


def card_html(title, dur, css, body):
    h = _pre.replace('<title>SceneXX 標題</title>', f'<title>{title}</title>')
    h = h.replace('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */', '/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */\n' + css)
    h = h.replace('<div class="bg"></div>', '<div class="bg"></div><div class="hero-img"><img src="hero.png"></div><div class="scrim"></div>')
    return h.replace('--dur:7s', f'--dur:{dur}s') + body + _B + _post


def qr_svg():
    import qrcode, qrcode.image.svg
    img = qrcode.make(SITE, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=2)
    s = img.to_string(encoding='unicode')
    return s[s.index('<svg'):]


def write_cards(film, lang, work, fx):
    k, t, e = film['title'][lang]
    big = 128 if lang == 'zh' else 104
    (work / 'open.html').write_text(card_html(t, 6, """
.hero-img img{opacity:.82;filter:saturate(1.05);transform:scale(1.2);transform-origin:50% 72%}
.scrim{--scrim:.55}
.brand{font-size:26px;letter-spacing:.32em;text-indent:.32em;color:rgba(232,238,247,.7);margin-top:46px}
""", f"""
 <div class="kicker in" style="--d:.2s">{k}</div>
 <div class="h1 pop" style="--d:.55s;margin-top:26px;font-size:{big}px">{t}</div>
 <div class="sub in" style="--d:1.2s;margin-top:30px">{e}</div>
 <div class="brand in" style="--d:1.8s">{BRAND[lang]}</div>
"""), encoding='utf-8')
    scan = '掃描 QR code，打開網站繼續探索' if lang == 'zh' else 'Scan the QR code to explore the site'
    (work / 'end.html').write_text(card_html('QR', 8, """
.hero-img img{opacity:.5;transform:scale(1.2);transform-origin:50% 72%}
.scrim{--scrim:.7}
.row{display:flex;align-items:center;gap:90px}
.qr{width:420px;height:420px;background:#fff;border-radius:28px;padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.55)}
.qr svg{width:100%;height:100%;display:block}
.qr path{fill:#0a1220}
.txt{display:flex;flex-direction:column;align-items:flex-start;max-width:900px}
.txt .h1{text-align:left}
.credit{font-size:24px;color:rgba(232,238,247,.62);margin-top:40px;line-height:1.5}
""", f"""
 <div class="row">
  <div class="qr pop" style="--d:.4s">{qr_svg()}</div>
  <div class="txt">
   <div class="kicker in" style="--d:.2s;text-indent:0">{BRAND[lang]}</div>
   <div class="h1 in" style="--d:.6s;font-size:{88 if lang == 'zh' else 72}px;margin-top:22px">{t}</div>
   <div class="sub in" style="--d:1.1s;margin-top:26px;text-align:left">{scan}</div>
   <div class="credit in" style="--d:1.6s">{CREDIT[lang]}</div>
  </div>
 </div>
"""), encoding='utf-8')


def assemble(fid, film, lang, work):
    sb = {'fps': FPS, 'width': 1920, 'height': 1080, 'xfade': 0.6, 'scenes': [{'file': 'open.html', 'duration': 6, 'transition': 'fade'}]}
    trans = ['smoothleft', 'fade', 'smoothup', 'circleopen', 'fade', 'smoothleft', 'fade', 'smoothup']
    for i, s in enumerate(film['segs']):
        sb['scenes'].append({'file': s['id'] + '.html', 'duration': s['dur'], 'transition': trans[i % len(trans)] if i < len(film['segs']) - 1 else 'fadeblack'})
    sb['scenes'].append({'file': 'end.html', 'duration': 8})
    (work / 'storyboard.json').write_text(json.dumps(sb, ensure_ascii=False, indent=1), encoding='utf-8')
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f'{fid}_{lang}.mp4'
    subprocess.run([sys.executable, str(SK / 'scripts' / 'assemble_video.py'), str(work / 'storyboard.json'), '--workdir', str(work), '--out', str(out), '--music', 'default'], check=True)
    share = OUT / f'{fid}_{lang}_share.mp4'
    log = str(work / 'pass')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out), '-c:v', 'libx264', '-preset', 'slow', '-b:v', '1150k', '-pass', '1', '-passlogfile', log, '-an', '-f', 'null', '/dev/null'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out), '-c:v', 'libx264', '-preset', 'slow', '-b:v', '1150k', '-pass', '2', '-passlogfile', log,
                    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(share)], check=True)
    print('  wrote', out, f'({out.stat().st_size / 1e6:.1f} MB)', share, f'({share.stat().st_size / 1e6:.1f} MB)', flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('films', nargs='+', help='f1 … f5 or all')
    ap.add_argument('--lang', default='both', choices=['zh', 'en', 'both'])
    ap.add_argument('--only', nargs='*', help='segment ids (plus open, end) to (re)make')
    ap.add_argument('--preview', action='store_true'); ap.add_argument('--force', action='store_true'); ap.add_argument('--no-assemble', action='store_true')
    a = ap.parse_args()
    fx = facts()
    ids = list(FILMS) if a.films == ['all'] else a.films
    for fid in ids:
        film = FILMS[fid]
        if fid == 'f3':
            check_events(film)
        for s in film['segs']:                         # 字卡上的 {ports} 等由資料檔即時代入 · captions take live figures
            s['cap'] = {L: tuple(x.format(**fx) for x in v) for L, v in s['cap'].items()}
        base = HERE / 'exhibit' / fid; base.mkdir(parents=True, exist_ok=True)
        if a.force or not (base / 'hero.png').exists():
            if not a.preview: hero(fid, film, base / 'hero.png')
        for lang in (['zh', 'en'] if a.lang == 'both' else [a.lang]):
            work = base / lang; work.mkdir(parents=True, exist_ok=True)
            print(f'{fid} [{lang}]', flush=True)
            for s in film['segs']:
                if a.only and s['id'] not in a.only: continue
                if a.preview or a.force or a.only or not (work / f"check_{s['id']}.png").exists():   # 抽查格最後才寫：有它才算錄完 · the check frame is written last
                    record(s, lang, work, a.preview)
            if a.preview: continue
            shutil.copy(base / 'hero.png', work / 'hero.png')
            write_cards(film, lang, work, fx)
            for c, d in (('open', 6), ('end', 8)):
                if a.force or (a.only and c in a.only) or not (work / f'{c}.mp4').exists():
                    render_scene(work / f'{c}.html', work / f'{c}.mp4', duration=d, fps=FPS, width=1920, height=1080)
            if not a.no_assemble:
                assemble(fid, film, lang, work)


if __name__ == '__main__':
    main()
