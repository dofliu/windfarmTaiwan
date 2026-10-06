"""開場與結尾的滿版主視覺：隱藏介面、只留地球（2026、北半球），存成 tools/promo/assets/hero_globe.png
Full-screen hero image for the opening and closing scenes (interface hidden, globe only).  python3 tools/promo/hero.py"""
import time
from capture import EXE, BASE, HERE, VIRTUAL_CLOCK_JS, adv, run_act, click
from playwright.sync_api import sync_playwright
(HERE / 'assets').mkdir(exist_ok=True)
with sync_playwright() as pw:
    b = pw.chromium.launch(**({'executable_path': EXE} if EXE else {}), args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'])
    page = b.new_page(viewport={'width': 1920, 'height': 1080})
    page.add_init_script(VIRTUAL_CLOCK_JS)
    page.goto(BASE + '#/global?r=C%3AAsia')
    t0 = time.time()
    while time.time() - t0 < 14:
        adv(page); time.sleep(0.03)
    adv(page, 90)
    page.add_style_tag(content="""header,.site-header,#g-top,#g-bottom,#g-msPanel,#g-yearBig,#g-worldStat,#g-hint,#g-attr,#g-labels,
      #g-pipeLegend,#g-liveLegend,#g-fdLegend,#g-windLegend,#g-flowLegend,#g-events,#g-ports,#g-notice,#g-infoCard,footer,nav{visibility:hidden!important}""")
    for k in range(3):
        page.mouse.move(960, 560); page.mouse.wheel(0, -150); adv(page, 8)
    adv(page, 60)
    page.screenshot(path=str(HERE / 'assets' / 'hero_globe.png'))
    b.close()
print('hero ok')
