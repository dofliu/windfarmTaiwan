"""實機錄製：在真正的網站上以虛擬時鐘逐格擷取地球儀畫面，疊上字卡，輸出 work/<scene>.mp4（英文版 work_en/）。
Records the real site frame by frame on a virtual clock, overlays the captions and writes work/<scene>.mp4 (English: work_en/).

  python3 -m http.server 8765                       # 在 repo 根目錄開本機預覽 · serve the repo root first
  python3 tools/promo/capture.py [--only s03_timeline] [--preview] [--lang en]

環境變數 · environment: PROMO_BASE（預設 http://localhost:8765/）、CHROMIUM_PATH（不設就用 Playwright 內建的 Chromium）、
INTRO_VIDEO_DIR（intro-video 技能的位置，見 skill_path.py）。字卡上的數字（風場數、事件數等）是錄製當時的，重錄前先核對網站上的數字。
"""
import os, sys, time, json, subprocess, tempfile, argparse
from pathlib import Path
from urllib.parse import quote
from skill_path import intro_video_dir
sys.path.insert(0, str(intro_video_dir() / 'scripts'))
from render_scenes import VIRTUAL_CLOCK_JS
from playwright.sync_api import sync_playwright

EXE = os.environ.get('CHROMIUM_PATH') or None
BASE = os.environ.get('PROMO_BASE', 'http://localhost:8765/')
FPS = 30
HERE = Path(__file__).parent
WORK = HERE / 'work'

def H(q): return ('hash', '#/global' + (('?' + q) if q else ''))
def F(name, extra=''): return H((extra + '&' if extra else '') + 'f=' + quote(name))
def click(sel): return ('js', f"(()=>{{const e=document.querySelector({json.dumps(sel)}); if(e) e.click();}})()")
def speed(v): return ('js', f"(()=>{{const s=document.querySelector('#g-speedSel'); s.value='{v}'; s.dispatchEvent(new Event('change',{{bubbles:true}}));}})()")
def wheel(dy, x=960, y=560): return ('wheel', (x, y, dy))

SCENES = {
 's03_timeline': dict(dur=16, start='y=1980', setup=[speed(4), click('#g-btnRotate')], settle=1.0,
    acts=[(0.4, click('#g-play'))],
    cap=('TIMELINE · 1980 → 2026', '46 年，全球風電逐年長出來', 'Every country\'s wind fleet, growing year by year')),
 's04_bars': dict(dur=9, start='v=split&y=2000', setup=[speed(4), click('#g-msToggle')], settle=1.0, pad=[0, 770],
    acts=[(0.3, click('#g-play'))],
    cap=('RANKING', '各國裝置容量排名競賽', 'A bar-chart race of national capacity')),
 's05_taiwan': dict(dur=14, start='y=2026', setup=[], settle=1.0,
    acts=[(0.4, H('r=TWN')), (7.0, F('Greater Changhua 1 & 2a', 'r=TWN'))],
    cap=('TAIWAN', '台灣的陸域與離岸，一座座看', 'Every onshore and offshore farm in Taiwan')),
 's06_turbines': dict(dur=11, start='r=USA', setup=[], settle=2.0,
    acts=[(0.3, F('Roscoe', 'r=USA'))] + [(6.0 + k * 0.3, wheel(-60, 960, 990)) for k in range(4)],
    cap=('TURBINES', '22 萬部風機的真實位置', 'Real positions of 220,000+ turbines')),
 's07_foundations': dict(dur=12, start='layer=fd&r=C%3AEurope', setup=[], settle=3.0,
    acts=[(5.0, F('Gemini', 'layer=fd'))],
    cap=('FOUNDATIONS', '離岸水下基礎，逐場查證上色', 'Offshore foundation types, checked farm by farm')),
 's08_profile': dict(dur=9, start='layer=fd&' + 'f=' + quote('Hywind Scotland'), setup=[], settle=4.0,
    acts=[],
    cap=('TO SCALE', '水深、輪轂、葉輪，按比例畫出', 'Water depth, hub height and rotor, drawn to scale')),
 's09_china': dict(dur=12, start='r=CHN', setup=[], settle=2.0,
    acts=[(0.3, H('tour=cn')), (4.6, click('#g-tourBar .tnext')), (8.6, click('#g-tourBar .tnext'))],
    cap=('STORY TOUR', '故事導覽：中國崛起', 'Guided stories: the rise of China')),
 's10_milestones': dict(dur=12, start='', setup=[], settle=1.0,
    acts=[(0.3, H('ms=' + quote('Vindeby offshore wind farm'))), (6.3, H('ms=' + quote('Dongfang 26 MW offshore turbine, Fujian')))],
    cap=('MILESTONES', '從 450 kW 到 26 MW 的里程碑', '35 milestones, from 1888 to 26 MW turbines')),
 's11_events': dict(dur=11, start='r=C%3ANorth%20America', setup=[], settle=2.0,
    acts=[(0.3, H('ev=WIND-040'))],
    cap=('EVENTS', '91 則重大事件，附官方出處', 'Major events and incidents, each with a primary source')),
 's12_ports': dict(dur=9, start='r=TWN', setup=[], settle=2.0,
    acts=[(0.3, H('port=twn-taichung'))],
    cap=('PORTS', '離岸風電港口與服務過的風場', 'Offshore wind ports and the farms they served')),
 's13_windnow': dict(dur=11, start='flow=1', setup=[click('#g-btnRotate'), click('#g-msToggle'), wheel(-150, 300, 900), wheel(-150, 300, 900)], settle=2.5,
    acts=[],
    cap=('WIND NOW', '此刻的風：NOAA 全球風場', 'Today\'s wind from NOAA GFS, every 6 hours')),
 's14_output': dict(dur=11, start='r=TWN', setup=[], settle=2.0,
    acts=[(0.3, H('out=TWN.cf')), (6.0, H('out=USA.model'))],
    cap=('OUTPUT', '實測發電表現排名', 'Measured output, Taiwan and the US'), pos='bl'),
}

CAP_EN = {
 's03_timeline': ('TIMELINE · 1980 → 2026', '46 years of global wind power', "Every country's fleet, growing year by year"),
 's04_bars': ('RANKING', 'The race between nations', 'Installed capacity, country by country'),
 's05_taiwan': ('TAIWAN', 'Taiwan, farm by farm', 'Every onshore and offshore wind farm'),
 's06_turbines': ('TURBINES', '220,000+ real turbine positions', 'From USWTDB, MaStR and OpenStreetMap'),
 's07_foundations': ('FOUNDATIONS', 'Offshore foundations, verified', 'Checked farm by farm and colour-coded'),
 's08_profile': ('TO SCALE', 'Depth, hub and rotor to scale', "Drawn from each farm's own data"),
 's09_china': ('STORY TOURS', 'Guided story: the rise of China', 'Narrated stops around the globe'),
 's10_milestones': ('MILESTONES', 'From 450 kW to 26 MW', '35 milestones since 1888'),
 's11_events': ('EVENTS', '91 major events, all sourced', 'Incidents and policy, each with a primary source'),
 's12_ports': ('PORTS', 'Ports and the farms they built', 'Offshore wind ports, each with sources'),
 's13_windnow': ('WIND NOW', "Today's wind, worldwide", 'NOAA GFS, refreshed every 6 hours'),
 's14_output': ('OUTPUT', 'Measured output rankings', 'Taiwan and the US'),
}
LANG = 'zh'

OVERLAY_JS = r"""
([cap, pad, pos]) => {
  const css = document.createElement('style');
  css.textContent = `#promo-wrap{position:fixed;left:0;right:0;top:126px;z-index:99999;pointer-events:none;display:flex;justify-content:center}
   #promo-ov{font-family:"Noto Sans CJK TC","Noto Sans CJK JP",sans-serif;opacity:0;text-align:center;
    padding:16px 40px 18px;border-radius:18px;background:linear-gradient(160deg,rgba(9,18,32,.88),rgba(6,11,20,.92));
    border:1.5px solid rgba(150,200,255,.18);box-shadow:0 20px 50px rgba(0,0,0,.5);border-top:4px solid #2dd4bf}
   #promo-ov .k{font-size:17px;font-weight:700;letter-spacing:.42em;text-indent:.42em;color:#2dd4bf;white-space:nowrap}
   #promo-ov .t{font-size:46px;font-weight:900;line-height:1.2;color:#f4f8ff;margin-top:6px;white-space:nowrap}
   #promo-ov .e{font-size:21px;color:rgba(232,238,247,.72);margin-top:4px;white-space:nowrap}
   #g-hint{visibility:hidden}`;
  document.head.appendChild(css);
  const w = document.createElement('div'); w.id = 'promo-wrap'; const d = document.createElement('div'); d.id = 'promo-ov'; w.appendChild(d);
  d.innerHTML = '<div class="k"></div><div class="t"></div><div class="e"></div>';
  d.querySelector('.k').textContent = cap[0]; d.querySelector('.t').textContent = cap[1]; d.querySelector('.e').textContent = cap[2];
  if (pad) { w.style.left = pad[0] + 'px'; w.style.right = pad[1] + 'px'; }
  if (pos === 'bl') { w.style.top = 'auto'; w.style.bottom = '64px'; w.style.left = '24px'; w.style.right = 'auto'; d.style.textAlign = 'left'; d.style.borderTop = '1.5px solid rgba(150,200,255,.18)'; d.style.borderLeft = '4px solid #2dd4bf'; }
  document.body.appendChild(w);
  window.__ov = (t) => { const a = Math.max(0, Math.min(1, (t - 0.35) / 0.8)); const e = 1 - Math.pow(1 - a, 3);
    d.style.opacity = e; d.style.transform = 'translateY(' + ((e - 1) * 30).toFixed(1) + 'px)'; };
}
"""

def run_act(page, act):
    kind, arg = act
    if kind == 'hash':
        page.evaluate("(h)=>{location.hash=h}", arg)
    elif kind == 'js':
        page.evaluate(arg)
    elif kind == 'wheel':
        x, y, dy = arg
        page.mouse.move(x, y); page.mouse.wheel(0, dy)

def adv(page, n=1):
    for _ in range(n):
        page.evaluate("d=>window.__advanceFrame(d)", 1000 / FPS)

def capture(name, sc, preview=False):
    total = round(sc['dur'] * FPS)
    with sync_playwright() as pw:
        b = pw.chromium.launch(**({'executable_path': EXE} if EXE else {}), args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'])
        page = b.new_page(viewport={'width': 1920, 'height': 1080})
        errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        page.add_init_script(VIRTUAL_CLOCK_JS)
        if LANG == 'en':
            page.add_init_script("try{localStorage.setItem('ww_lang','en')}catch(e){}")
        page.goto(BASE + '#/global' + ('?' + sc['start'] if sc['start'] else ''))
        t0 = time.time()
        while time.time() - t0 < 14:                       # 資料載入（真實時間）期間推進虛擬時間
            adv(page); time.sleep(0.03)
        for a in sc['setup']:
            run_act(page, a)
        adv(page, round(sc['settle'] * FPS))
        page.evaluate(OVERLAY_JS, [list(CAP_EN[name] if LANG == 'en' else sc['cap']), sc.get('pad'), sc.get('pos')])
        acts = sorted(sc['acts'], key=lambda x: x[0]); ai = 0
        td = Path(tempfile.mkdtemp(prefix='cap_' + name + '_'))
        shots = set(round(total * f) for f in (0.05, 0.3, 0.55, 0.8, 0.98)) if preview else None
        t1 = time.time()
        for i in range(total):
            t = i / FPS
            while ai < len(acts) and acts[ai][0] <= t:
                run_act(page, acts[ai][1]); ai += 1
            page.evaluate("t=>window.__ov&&window.__ov(t)", t)
            if preview:
                if i in shots: page.screenshot(path=str(WORK / f'pv_{name}_{i:04d}.png'))
            else:
                page.screenshot(path=str(td / f'f_{i + 1:06d}.png'))
            adv(page)
        b.close()
    print(f'{name}: {total} frames in {time.time() - t1:.0f}s', errs[:3], flush=True)
    if not preview:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(td / 'f_%06d.png'),
                        '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', str(WORK / f'{name}.mp4')], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f"{sc['dur'] * 0.85:.2f}", '-i', str(WORK / f'{name}.mp4'),
                        '-frames:v', '1', str(WORK / f'check_{name}.png')], check=True)
        subprocess.run(['rm', '-rf', str(td)])

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--only', nargs='*'); ap.add_argument('--preview', action='store_true')
    ap.add_argument('--lang', default='zh')
    a = ap.parse_args()
    LANG = a.lang
    if LANG == 'en':
        WORK = HERE / 'work_en'
    WORK.mkdir(exist_ok=True)
    for name, sc in SCENES.items():
        if a.only and name not in a.only: continue
        capture(name, sc, a.preview)
