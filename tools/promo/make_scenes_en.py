"""英文版設計景（檔名加 _en），沿用 make_scenes.py 的 scene()。· English designed scenes (files end in _en), using scene() from make_scenes.py.
  python3 tools/promo/make_scenes_en.py"""
import make_scenes as M          # 匯入時會順便重寫中文版 HTML（內容相同）
scene = M.scene

scene('s01_open_en.html', 'Opening', 9, """
.badges{display:flex;gap:22px;margin-top:54px}
.hero-img img{opacity:.9;filter:saturate(1)}
.scrim{--scrim:.5}
""", """
 <div class="kicker in" style="--d:.2s">TAIWAN WIND WATCH</div>
 <div class="h1 pop" style="--d:.6s;margin-top:28px;font-size:118px">Global Wind Power in 3D</div>
 <div class="sub in" style="--d:1.3s;margin-top:34px">1888 → 2026 · 151 countries · 30,798 wind farms · one globe</div>
 <div class="badges"><span class="badge in" style="--d:2.0s">Bilingual</span><span class="badge in" style="--d:2.2s">Every number sourced</span><span class="badge in" style="--d:2.4s">Works offline</span></div>
""", hero='assets/hero_globe.png')

SRC = [('IRENA', -760, -300), ('Global Energy Monitor', 520, -330), ('USWTDB (US turbines)', -820, 40), ('Germany MaStR', 700, 10),
       ('OSPAR (North Sea)', -600, 300), ('Taipower open data', 560, 300), ('EIA-923', -260, -380), ('NOAA GFS', 220, 390),
       ('OpenStreetMap', -180, 400), ('Energy Administration', 300, -400)]
chips = ''.join(f'<span class="src" style="--x:{x}px;--y:{y}px;--d:{0.2 + i * 0.12:.2f}s">{n}</span>' for i, (n, x, y) in enumerate(SRC))
css2 = open(M.HERE / 's02_why.html', encoding='utf-8').read()
css2 = css2[css2.index('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */') + len('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */'):css2.index('/* ▲▲ 本景專屬 CSS 到此 ▲▲ */')]
scene('s02_why_en.html', 'Why', 8, css2, f"""
 <div class="wrap">
  <div class="head"><div class="kicker in" style="--d:.1s">THE PROBLEM</div>
   <div class="h1 in" style="--d:.3s;font-size:78px;margin-top:14px">Wind data is scattered everywhere</div></div>
  {chips}
  <div class="orb"></div>
  <div class="orbt in" style="--d:5.3s">National statistics, databases, developer notices → <span class="accent">one globe</span></div>
 </div>
""", particles=False)

css15 = open(M.HERE / 's15_claim.html', encoding='utf-8').read()
css15 = css15[css15.index('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */') + len('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */'):css15.index('/* ▲▲ 本景專屬 CSS 到此 ▲▲ */')]
scene('s15_claim_en.html', 'Claim', 9, css15, """
 <div class="l1 in" style="--d:.3s">Every number</div>
 <div class="l2">has a source.</div>
 <div class="facts"><span class="chip in" style="--d:3.2s">359 record-level fixes</span><span class="chip in" style="--d:3.5s">Quotes checked at the source</span><span class="chip in" style="--d:3.8s">Unverified? We say so.</span></div>
""", particles=False)

STATS = [(30798, 'wind farms'), (151, 'countries'), (225269, 'turbine positions'), (345, 'offshore farms operating'), (91, 'major events'), (55, 'wind ports')]
tiles = ''.join(f'<div class="tile card pop" style="--d:{0.3 + i * 0.18:.2f}s"><div class="num" data-n="{n}" data-d="{0.5 + i * 0.18:.2f}">0</div><div class="lab">{z}</div></div>' for i, (n, z) in enumerate(STATS))
css16 = open(M.HERE / 's16_scale.html', encoding='utf-8').read()
css16 = css16[css16.index('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */') + len('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */'):css16.index('/* ▲▲ 本景專屬 CSS 到此 ▲▲ */')]
body16 = open(M.HERE / 's16_scale.html', encoding='utf-8').read()
script16 = body16[body16.index(' <script>\n (function(){'):body16.index(' </script>') + 10]
scene('s16_scale_en.html', 'Scale', 9, css16, f"""
 <div class="kicker in" style="--d:.1s">BY THE NUMBERS</div>
 <div class="h1 in" style="--d:.25s;font-size:80px;margin-top:12px">The world's wind power, in one place</div>
 <div class="gridt">{tiles}</div>
{script16}
""", particles=False)

css17 = open(M.HERE / 's17_portable.html', encoding='utf-8').read()
css17 = css17[css17.index('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */') + len('/* ▼▼ 本景專屬 CSS 寫在這 ▼▼ */'):css17.index('/* ▲▲ 本景專屬 CSS 到此 ▲▲ */')]
scene('s17_portable_en.html', 'Portable', 8, css17 + '.pc .t{font-size:44px}', """
 <div class="kicker in" style="--d:.1s">TAKE IT ANYWHERE</div>
 <div class="h1 in" style="--d:.25s;font-size:84px;margin-top:12px">Just open a browser</div>
 <div class="row">
  <div class="pc card in" style="--d:.7s"><div class="ic">📄</div><div class="t">One HTML file, works offline</div>
   <div class="d">The whole globe and all its data in a single file — for classes, exhibitions, or no network at all.</div>
   <div class="file"><b>windfarmTaiwan-globe.html</b><span>about 12 MB</span></div></div>
  <div class="pc card in" style="--d:1.0s"><div class="ic">🌬️</div><div class="t">Taiwan's wind, live</div>
   <div class="d">Taipower unit-level data every 10 minutes, with a dashboard, farm wall, charts and a map.</div>
   <div class="tabs"><span class="badge pop" style="--d:1.5s">Dashboard</span><span class="badge pop" style="--d:1.65s">Farm wall</span><span class="badge pop" style="--d:1.8s">Charts</span><span class="badge pop" style="--d:1.95s">Map</span></div></div>
 </div>
""", particles=False)

scene('s18_cta_en.html', 'Closing', 10, """
.hero-img img{opacity:.75}
.scrim{--scrim:.62}
.tag{margin-top:46px;font-size:46px;font-weight:800;color:#7ff0df}
.cred{margin-top:64px;font-size:30px;color:rgba(232,238,247,.85);text-align:center;line-height:1.6}
.cred small{display:block;font-size:24px;color:rgba(232,238,247,.55)}
.three{display:flex;gap:20px;margin-top:40px}
""", """
 <div class="kicker in" style="--d:.15s">風電風情</div>
 <div class="h1 pop glow" style="--d:.45s;font-size:140px;margin-top:20px">Taiwan Wind Watch</div>
 <div class="three"><span class="badge in" style="--d:1.2s">3D Globe</span><span class="badge in" style="--d:1.35s">Taiwan Live</span><span class="badge in" style="--d:1.5s">Learn</span></div>
 <div class="tag in" style="--d:1.9s">One globe for the world's wind power</div>
 <div class="cred in" style="--d:2.6s">Dof Lab by Juihung Liu<small>National Chin-Yi University of Technology · Dept. Intelligent Automation Engineering</small></div>
""", hero='assets/hero_globe.png')
print('en ok')
