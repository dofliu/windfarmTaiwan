"""產生中文版設計景 HTML（以 intro-video 技能的場景模板為底，替換專屬 CSS 與內容），寫在 tools/promo/。
Writes the Chinese designed scenes (built on the intro-video scene template) into tools/promo/.  python3 tools/promo/make_scenes.py
內容規則：目前不寫「開源」、不放網址（使用者 2026-10 的決定）；數字是製作當時的，重做前先核對網站。
Content rules: no "open source" and no URL for now (owner's decision, Oct 2026); the figures are from the time of making, re-check them first.
"""
from pathlib import Path
from skill_path import intro_video_dir
HERE = Path(__file__).parent
T = (intro_video_dir() / 'assets' / 'scene_template.html').read_text(encoding='utf-8')
A, B = '<!-- ▼▼ 本景內容(範例:開場 hero,整段換掉) ▼▼ -->', '<!-- ▲▲ 本景內容到此 ▲▲ -->'
pre, rest = T.split(A); _, post = rest.split(B)
PARTICLES = pre[pre.index('<canvas id="fx"'):pre.index('</script>') + 9]

def scene(fn, title, dur, css, body, particles=True, hero=None, bg_hue=None):
    h = pre.replace('<title>SceneXX 標題</title>', f'<title>{title}</title>')
    h = h.replace('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */', '/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */\n' + css)
    if not particles:
        h = h.replace(PARTICLES, '')
    if hero:
        h = h.replace('<div class="bg"></div>', f'<div class="bg"></div><div class="hero-img"><img src="{hero}"></div><div class="scrim"></div>')
    if bg_hue:
        h = h.replace('<div class="bg"></div>', f'<div class="bg" style="filter:hue-rotate({bg_hue}deg)"></div>', 1)
    h = h.replace('--dur:7s', f'--dur:{dur}s')
    (HERE / fn).write_text(h + body + B + post, encoding='utf-8')

# 1 開場
scene('s01_open.html', '開場', 9, """
.badges{display:flex;gap:22px;margin-top:54px}
.hero-img img{opacity:.9;filter:saturate(1)}
.scrim{--scrim:.5}
""", """
 <div class="kicker in" style="--d:.2s">TAIWAN WIND WATCH · 風電風情</div>
 <div class="h1 pop" style="--d:.6s;margin-top:28px;font-size:150px">全球風電 3D 地球儀</div>
 <div class="sub in" style="--d:1.3s;margin-top:34px">1888 → 2026　151 國、30,798 座風場，一顆地球看完</div>
 <div class="badges"><span class="badge in" style="--d:2.0s">中英雙語</span><span class="badge in" style="--d:2.2s">每筆附出處</span><span class="badge in" style="--d:2.4s">離線也能開</span></div>
""", hero='assets/hero_globe.png')

# 2 為什麼
SRC = [('IRENA', -760, -300), ('Global Energy Monitor', 520, -330), ('USWTDB 美國風機資料庫', -820, 40), ('德國 MaStR', 700, 10),
       ('OSPAR 北海基礎', -600, 300), ('台電開放資料', 560, 300), ('EIA-923', -260, -380), ('NOAA GFS', 220, 390),
       ('OpenStreetMap', -180, 400), ('能源署統計', 300, -400)]
chips = ''.join(f'<span class="src" style="--x:{x}px;--y:{y}px;--d:{0.2 + i * 0.12:.2f}s">{n}</span>' for i, (n, x, y) in enumerate(SRC))
scene('s02_why.html', '為什麼', 8, """
.wrap{position:relative;width:1920px;height:1080px}
.src{position:absolute;left:50%;top:52%;white-space:nowrap;font-size:30px;font-weight:700;padding:14px 28px;border-radius:999px;
 background:rgba(20,32,52,.85);border:1.5px solid rgba(150,200,255,.25);color:#cfe3ff;opacity:0;
 animation:fly 5.6s cubic-bezier(.5,0,.3,1) var(--d) both}
@keyframes fly{0%{opacity:0;transform:translate(calc(var(--x)*1.5 - 50%),calc(var(--y)*1.5 - 50%)) scale(.9)}
 15%{opacity:1;transform:translate(calc(var(--x) - 50%),calc(var(--y) - 50%)) scale(1)}
 55%{opacity:1;transform:translate(calc(var(--x) - 50%),calc(var(--y) - 50%)) scale(1)}
 88%{opacity:0;transform:translate(-50%,-50%) scale(.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(.3)}}
.orb{position:absolute;left:810px;top:412px;width:300px;height:300px;border-radius:50%;opacity:0;
 background:radial-gradient(circle at 35% 30%,#7ff0df,#1d6f8c 45%,#0b2340 75%);box-shadow:0 0 120px rgba(45,212,191,.55);
 animation:orb 1.4s cubic-bezier(.2,1.3,.35,1) 4.6s both}
@keyframes orb{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}
.orbt{position:absolute;left:0;right:0;top:740px;text-align:center;font-size:44px;font-weight:800;color:#f4f8ff}
.head{position:absolute;left:0;right:0;top:110px;text-align:center}
""", f"""
 <div class="wrap">
  <div class="head"><div class="kicker in" style="--d:.1s">THE PROBLEM</div>
   <div class="h1 in" style="--d:.3s;font-size:84px;margin-top:14px">風電資訊，散落在各處</div></div>
  {chips}
  <div class="orb"></div>
  <div class="orbt in" style="--d:5.3s">各國統計、資料庫、開發商公告 → <span class="accent">匯成一顆地球</span></div>
 </div>
""", particles=False)

# 15 戲劇景
scene('s15_claim.html', '核心主張', 9, """
.l1{font-size:120px;font-weight:900;color:#f4f8ff;letter-spacing:.02em}
.l2{font-size:150px;font-weight:900;margin-top:10px;background:linear-gradient(100deg,#9be8db,#2dd4bf 40%,#c4b5fd);
 -webkit-background-clip:text;background-clip:text;color:transparent;animation:pop .8s cubic-bezier(.2,1.4,.35,1) 1.5s both,shake .5s ease 2.3s 1}
@keyframes shake{0%,100%{transform:none}20%{transform:translateX(-10px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
.facts{display:flex;gap:26px;margin-top:70px}
.bg{background:radial-gradient(1000px 700px at 50% 45%,rgba(45,212,191,.10),transparent 65%),#04070d}
.aur{display:none}
""", """
 <div class="l1 in" style="--d:.3s">每一個數字，</div>
 <div class="l2">都附出處。</div>
 <div class="facts"><span class="chip in" style="--d:3.2s">359 條逐筆更正</span><span class="chip in" style="--d:3.5s">原文引句逐一核對</span><span class="chip in" style="--d:3.8s">查不到就寫「待查證」</span></div>
""", particles=False)

# 16 規模
STATS = [(30798, '座風場', 'wind farms'), (151, '個國家', 'countries'), (225269, '部風機位置', 'turbine positions'),
         (345, '座離岸運轉中', 'offshore farms operating'), (91, '則重大事件', 'major events'), (55, '座風電港口', 'wind ports')]
tiles = ''.join(f'<div class="tile card pop" style="--d:{0.3 + i * 0.18:.2f}s"><div class="num" data-n="{n}" data-d="{0.5 + i * 0.18:.2f}">0</div><div class="lab">{z}</div><div class="en">{e}</div></div>' for i, (n, z, e) in enumerate(STATS))
scene('s16_scale.html', '規模', 9, """
.gridt{display:grid;grid-template-columns:repeat(3,480px);gap:34px;margin-top:56px}
.tile{padding:34px 38px;text-align:left}
.num{font-size:84px;font-weight:900;color:#f4f8ff;font-variant-numeric:tabular-nums;line-height:1.1}
.lab{font-size:34px;font-weight:700;color:#7ff0df;margin-top:6px}
.en{font-size:22px;color:rgba(232,238,247,.55);margin-top:4px;letter-spacing:.04em}
""", f"""
 <div class="kicker in" style="--d:.1s">BY THE NUMBERS</div>
 <div class="h1 in" style="--d:.25s;font-size:86px;margin-top:12px">一個網站，整理全世界的風電</div>
 <div class="gridt">{tiles}</div>
 <script>
 (function(){{const els=[...document.querySelectorAll('.num')];
  function tick(){{const t=performance.now()/1000;
   for(const el of els){{const n=+el.dataset.n,d=+el.dataset.d,p=Math.max(0,Math.min(1,(t-d)/2.2)),e=1-Math.pow(1-p,3);
    el.textContent=Math.round(n*e).toLocaleString('en-US');}}
   requestAnimationFrame(tick);}}
  requestAnimationFrame(tick);}})();
 </script>
""", particles=False, bg_hue=0)

# 17 隨手帶走
scene('s17_portable.html', '隨手帶走', 8, """
.row{display:flex;gap:56px;margin-top:60px}
.pc{width:640px;padding:44px 48px}
.pc .ic{font-size:64px}
.pc .t{font-size:48px;font-weight:900;color:#f4f8ff;margin-top:14px}
.pc .d{font-size:28px;color:rgba(232,238,247,.7);margin-top:12px;line-height:1.55}
.file{margin-top:26px;display:flex;align-items:center;gap:18px;padding:18px 24px;border-radius:14px;background:rgba(45,212,191,.10);border:1.5px solid rgba(45,212,191,.35)}
.file b{font-size:26px;color:#7ff0df;white-space:nowrap}.file span{font-size:22px;color:rgba(232,238,247,.6);white-space:nowrap}
.gauge{margin-top:26px;height:22px;border-radius:11px;background:rgba(255,255,255,.08);overflow:hidden}
.gauge i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2dd4bf,#a78bfa);animation:fill 2.4s cubic-bezier(.2,.8,.2,1) 1.4s both}
@keyframes fill{to{width:68%}}
.tabs{display:flex;gap:16px;margin-top:30px}
.mw{font-size:56px;font-weight:900;color:#f4f8ff;margin-top:14px;font-variant-numeric:tabular-nums}
.mw small{font-size:26px;color:rgba(232,238,247,.6);margin-left:10px;font-weight:500}
""", """
 <div class="kicker in" style="--d:.1s">TAKE IT ANYWHERE</div>
 <div class="h1 in" style="--d:.25s;font-size:84px;margin-top:12px">打開瀏覽器就能用</div>
 <div class="row">
  <div class="pc card in" style="--d:.7s"><div class="ic">📄</div><div class="t">單一 HTML，離線也能開</div>
   <div class="d">整顆地球儀與全部資料打包成一個檔案，上課、展示、沒有網路都能用。</div>
   <div class="file"><b>windfarmTaiwan-globe.html</b><span>約 12 MB</span></div></div>
  <div class="pc card in" style="--d:1.0s"><div class="ic">🌬️</div><div class="t">台灣風電即時出力</div>
   <div class="d">台電逐機組資料，每 10 分鐘更新；風場牆、趨勢圖與地圖一起看。</div>
   <div class="tabs"><span class="badge pop" style="--d:1.5s">儀表</span><span class="badge pop" style="--d:1.65s">風場牆</span><span class="badge pop" style="--d:1.8s">數據</span><span class="badge pop" style="--d:1.95s">地圖</span></div></div>
 </div>
""", particles=False)

# 18 CTA
scene('s18_cta.html', '結尾', 10, """
.hero-img img{opacity:.75}
.scrim{--scrim:.62}
.url{margin-top:44px;font-size:52px;font-weight:800;color:#7ff0df;letter-spacing:.01em}
.gh{margin-top:18px;font-size:32px;color:rgba(232,238,247,.75)}
.cred{margin-top:64px;font-size:30px;color:rgba(232,238,247,.82);text-align:center;line-height:1.6}
.cred small{display:block;font-size:22px;color:rgba(232,238,247,.5);letter-spacing:.04em}
.three{display:flex;gap:20px;margin-top:40px}
""", """
 <div class="kicker in" style="--d:.15s">TAIWAN WIND WATCH</div>
 <div class="h1 pop glow" style="--d:.45s;font-size:170px;margin-top:20px">風電風情</div>
 <div class="three"><span class="badge in" style="--d:1.2s">3D 地球儀</span><span class="badge in" style="--d:1.35s">台灣即時</span><span class="badge in" style="--d:1.5s">風電知識</span></div>
 <div class="url in" style="--d:1.9s">一顆地球，看懂全世界的風電</div>
 <div class="cred in" style="--d:2.7s">國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室<small>National Chin-Yi University of Technology · Dept. Intelligent Automation Engineering · Dof Lab by Juihung Liu</small></div>
""", hero='assets/hero_globe.png')
print('ok')
