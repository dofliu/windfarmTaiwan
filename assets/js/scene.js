/* 風電風情 · scene.js — 地球儀的「實景視角」：站在海面（或地面）看一座真實排列的風場
   從風場卡片按「從港口出海看風場」進入：鏡頭從該風場的組裝／運維港口（data/global/ports.json 的「服務過的風場」）出發，3–4 秒飛到風場外緣，
   以約 30° 的俯瞰角停下，之後可用滑鼠／觸控轉動、縮放、平移；「海面視角」把鏡頭放到約 16 m 高（船橋高度）；「回到地球儀」只是關掉這一層，地球儀的狀態原封不動。
   風機位置只用本站已有的實際機位（USWTDB、MaStR、OpenStreetMap），沒有的風場用與近看相同的示意排列並寫明；輪轂高度與葉輪直徑用本站查證或登記檔的值，沒有的標示為估計；
   水下基礎段沿用地球儀近看的型式外觀。地面與海面貼 Esri 衛星影像（拍攝日期常早於風場完工，所以影像裡看不到風機；港區只有影像，不畫建物）。
   台灣、澳洲、加拿大有即時資料的風場，葉片依此刻出力轉動。three.js 已由地球儀載入；本檔只在第一次按下按鈕時載入。
   The globe's "sea-level view": a first-person look at a farm's real layout. The camera starts at the farm's port (from ports.json), flies to the farm edge in a few seconds and settles
   at a ~30° oblique view; orbit/zoom/pan follow. Turbine positions are the site's real ones where available (otherwise the close-up's schematic layout, labelled), dimensions from the
   site's checked values or the registers (otherwise labelled estimates), foundation bases as in the close-up. Ground/sea carry Esri imagery (often older than the farm; no buildings are
   invented). "Back to the globe" simply removes the overlay, leaving the globe state untouched. */
(function () {
'use strict';
const WW = window.WW;
const L = (zh, en) => WW.lang === 'en' ? en : zh, esc = WW.esc;
const D2R = Math.PI / 180, TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';
const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let cur = null;                                       // 目前開著的場景 · the open scene

/* ---------- 衛星影像：把 Web Mercator 圖磚畫進一張畫布（緯度分條換算成等距），回傳貼圖與它涵蓋的公尺範圍 ---------- */
function tileXY(lon, lat, z) { const n = 2 ** z; return [(lon + 180) / 360 * n, (1 - Math.log(Math.tan(lat * D2R) + 1 / Math.cos(lat * D2R)) / Math.PI) / 2 * n]; }
const tileLat = (y, z) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** z))) / D2R;
function imagery(loc, lon0, lat0, lon1, lat1, maxTiles, px, onTile) {
  let z = 17;
  while (z > 3) { const a = tileXY(lon0, lat0, z), b = tileXY(lon1, lat1, z); if ((Math.floor(b[0]) - Math.floor(a[0]) + 1) * (Math.floor(a[1]) - Math.floor(b[1]) + 1) <= maxTiles) break; z--; }
  const a = tileXY(lon0, lat0, z), b = tileXY(lon1, lat1, z), n = 2 ** z;
  const tx0 = Math.floor(a[0]), tx1 = Math.floor(b[0]), ty0 = Math.floor(b[1]), ty1 = Math.floor(a[1]);
  const bl0 = tx0 / n * 360 - 180, bl1 = (tx1 + 1) / n * 360 - 180, bt1 = tileLat(ty0, z), bt0 = tileLat(ty1 + 1, z);
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
  g.fillStyle = loc.sea ? '#28506b' : '#6f7f5a'; g.fillRect(0, 0, px, px);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
  const sx = px / (bl1 - bl0), sy = px / (bt1 - bt0);
  let pending = 0, failed = 0;
  for (let x = tx0; x <= tx1; x++) for (let y = ty0; y <= ty1; y++) {
    const img = new Image(); img.crossOrigin = 'anonymous'; pending++;
    img.onload = () => {
      const lonW = x / n * 360 - 180, lonE = (x + 1) / n * 360 - 180, strips = 8;
      for (let s = 0; s < strips; s++) {
        const latT = tileLat(y + s / strips, z), latB = tileLat(y + (s + 1) / strips, z);
        g.drawImage(img, 0, s * 256 / strips, 256, 256 / strips, (lonW - bl0) * sx, (bt1 - latT) * sy, (lonE - lonW) * sx, (latT - latB) * sy + 0.6);
      }
      tex.needsUpdate = true; pending--; if (onTile) onTile(pending, failed);
    };
    img.onerror = () => { pending--; failed++; if (onTile) onTile(pending, failed); };
    img.src = TILE + z + '/' + y + '/' + x;
  }
  const [x0, y0] = loc.xy(bl0, bt0), [x1, y1] = loc.xy(bl1, bt1);
  return { tex, x0, y0, x1, y1, z, tiles: (tx1 - tx0 + 1) * (ty1 - ty0 + 1) };
}

/* ---------- 一部風機（公尺）：塔架、機艙、三片葉片；葉片外形為簡化的翼形 ---------- */
let bladeGeoCache = {};
function bladeGeo(R) {
  const k = Math.round(R); if (bladeGeoCache[k]) return bladeGeoCache[k];
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(R * .055, 0); s.lineTo(R * .05, R * .3); s.lineTo(R * .022, R); s.lineTo(-R * .012, R); s.lineTo(-R * .03, R * .3); s.lineTo(-R * .03, 0); s.closePath();
  return (bladeGeoCache[k] = new THREE.ExtrudeGeometry(s, { depth: R * .025, bevelEnabled: false }));
}
function makeTurbine(mats, hub, rotor, sea) {
  const g = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(hub * .022, hub * .038, hub, 14), mats.white); tower.position.y = hub / 2; g.add(tower);
  const nac = new THREE.Mesh(new THREE.BoxGeometry(hub * .11, hub * .045, hub * .045), mats.white); nac.position.set(0, hub, 0); g.add(nac);
  const rot = new THREE.Group(); rot.position.set(-hub * .065, hub, 0); g.add(rot);
  const bg = bladeGeo(rotor / 2);
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(bg, mats.white); b.rotation.y = Math.PI / 2; b.rotation.x = i * Math.PI * 2 / 3; rot.add(b); }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(hub * .026, hub * .05, 12), mats.white); cone.rotation.z = Math.PI / 2; cone.position.x = -hub * .028; rot.add(cone);
  g.userData.rot = rot; return g;
}

/* ---------- 開啟 ---------- */
function open(f, H, fromBtn) {
  if (cur) close();
  const pane = document.getElementById('g-mapPane') || document.getElementById('globe'); if (!pane || !window.THREE) return;
  const c0 = H.center(f), sea = f.type !== 'onshore';
  const kx = 111320 * Math.cos(c0.lat * D2R), ky = 110574;
  const loc = { sea, xy: (lon, lat) => [(lon - c0.lon) * kx, (lat - c0.lat) * ky], ll: (x, y) => [c0.lon + x / kx, c0.lat + y / ky] };
  const tb = H.turbines(f), dm = H.dims(f), port = sea ? H.port(f) : null, n = tb.P.length;
  const hub = dm.hub, rotor = dm.rotor;
  let rad = 0; tb.P.forEach(p => { rad = Math.max(rad, Math.hypot(p[0], p[1])); }); rad = Math.max(rad, 300);

  // DOM
  const el = document.createElement('div'); el.id = 'g-scene'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', L('實景視角', 'Sea-level view'));
  el.innerHTML = `<canvas aria-label="${esc(L('風場實景視角的 3D 畫面', '3D first-person view of the wind farm'))}"></canvas>
    <div class="scn-bar"><button type="button" class="scn-back">↩ ${L('回到地球儀', 'Back to the globe')}</button><span class="scn-title">${esc(H.fname(f))}</span><span class="scn-sp"></span>
      <button type="button" data-v="sea">${sea ? L('海面視角', 'Sea level') : L('地面視角', 'Ground level')}</button><button type="button" data-v="obl">${L('俯瞰 30°', 'Oblique 30°')}</button><button type="button" data-v="replay">${port ? L('再出海一次', 'Sail again') : L('再飛一次', 'Fly again')}</button><button type="button" data-v="link">🔗 ${L('複製連結', 'Copy link')}</button></div>
    <div class="scn-hud"></div><div class="scn-cr"></div><div class="scn-load">${L('載入影像…', 'Loading imagery…')}</div>`;
  pane.appendChild(el);
  const canvas = el.querySelector('canvas');
  let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true }); } catch (e) { el.remove(); WW.toast(L('這個瀏覽器無法顯示 3D 畫面', 'This browser cannot show the 3D view')); return; }
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0xdfe9f2);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 2, 400000);
  // 天空、光 · sky and light
  const sc = document.createElement('canvas'); sc.width = 2; sc.height = 256; const sg = sc.getContext('2d'); const gr = sg.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#5b9be6'); gr.addColorStop(.55, '#a8cef2'); gr.addColorStop(.8, '#dbe9f5'); gr.addColorStop(1, '#eef3f6'); sg.fillStyle = gr; sg.fillRect(0, 0, 2, 256);
  const skyTex = new THREE.CanvasTexture(sc); skyTex.encoding = THREE.sRGBEncoding;
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(180000, 24, 12), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })));
  const sun = new THREE.DirectionalLight(0xfff3dd, 1.15); sun.position.set(-3000, 6000, 2500); scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xd6e6ff, sea ? 0x1d3a52 : 0x4a5a35, 0.85));
  // 地面：近處高解析、遠處低解析各一塊影像 · two imagery patches: fine near the farm, coarse to the horizon
  const groundMat = (tex, rough) => new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: sea ? .12 : 0, color: sea ? 0xa9cbdc : 0xffffff });
  const patches = [];
  const addPatch = (span, maxTiles, px, y) => {
    const [lon0, lat0] = loc.ll(-span, -span), [lon1, lat1] = loc.ll(span, span);
    const im = imagery(loc, lon0, lat0, lon1, lat1, maxTiles, px, (pend, fail) => { if (!pend) { el.querySelector('.scn-load').hidden = true; if (fail) noteFail(fail); } });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(im.x1 - im.x0, im.y1 - im.y0), groundMat(im.tex, sea ? .35 : 1));
    m.rotation.x = -Math.PI / 2; m.position.set((im.x0 + im.x1) / 2, y, -(im.y0 + im.y1) / 2); scene.add(m); patches.push(m); return im;
  };
  const fine = addPatch(rad + 2500, 144, 3072, 0);
  const reach = port ? Math.hypot(...loc.xy(port.lon, port.lat)) + 6000 : 25000;
  addPatch(Math.max(reach, 20000), 100, 2048, -1.5);
  if (port) { const [px0, py0] = loc.xy(port.lon, port.lat); const [plon0, plat0] = loc.ll(px0 - 2500, py0 - 2500), [plon1, plat1] = loc.ll(px0 + 2500, py0 + 2500); const im = imagery(loc, plon0, plat0, plon1, plat1, 100, 2048); const m = new THREE.Mesh(new THREE.PlaneGeometry(im.x1 - im.x0, im.y1 - im.y0), groundMat(im.tex, .9)); m.rotation.x = -Math.PI / 2; m.position.set((im.x0 + im.x1) / 2, 0.4, -(im.y0 + im.y1) / 2); scene.add(m); patches.push(m); }
  if (sea) { const s = new THREE.Mesh(new THREE.CircleGeometry(70000, 48), new THREE.MeshStandardMaterial({ color: 0x244f6b, roughness: .3, metalness: .2 })); s.rotation.x = -Math.PI / 2; s.position.y = -4; scene.add(s); }
  else { const s = new THREE.Mesh(new THREE.CircleGeometry(70000, 48), new THREE.MeshStandardMaterial({ color: 0x55653f, roughness: 1 })); s.rotation.x = -Math.PI / 2; s.position.y = -4; scene.add(s); }
  function noteFail(k) { const h = el.querySelector('.scn-hud'); if (h && !h.dataset.fail) { h.dataset.fail = '1'; h.insertAdjacentHTML('beforeend', '<div class="scn-warn">' + esc(L('部分衛星影像載不到（離線或網路受限），地面以單色代替。', 'Some imagery could not be loaded (offline or restricted network); plain colours are used instead.')) + '</div>'); } }
  // 風機與基座 · turbines and bases
  const mats = { white: new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: .55 }) };
  const rotors = [], bases = H.baseKeys(f, n);
  tb.P.forEach((p, i) => {
    const t = makeTurbine(mats, hub, rotor, sea); t.position.set(p[0], 0, -p[1]); t.userData.phase = Math.random() * 6.28; scene.add(t); rotors.push(t.userData.rot);
    if (bases) H.baseParts(bases[i]).forEach(part => { const m = new THREE.Mesh(part.geo, part.mat); m.scale.set(hub, hub, hub); m.position.set(p[0], 0, -p[1]); scene.add(m); });
  });
  // 鏡頭與控制 · camera and controls
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.rotateSpeed = .5; controls.minDistance = 30; controls.maxDistance = 40000;
  controls.maxPolarAngle = Math.PI / 2 - 0.015; controls.screenSpacePanning = false; controls.enabled = false;
  if (controls.listenToKeyEvents) controls.listenToKeyEvents(window);
  const [sx, sy] = port ? loc.xy(port.lon, port.lat) : [rad * 2 + 6000, -(rad + 4000)];
  const ang = Math.atan2(sx, sy);                                    // 進場方向（從起點看風場）· approach bearing
  const dEnd = Math.min(6000, Math.max(900, rad * 1.35)); scene.fog = new THREE.Fog(0xdfe9f2, Math.max(3000, dEnd * 2.5), Math.max(30000, dEnd * 12));
  const oblique = { x: Math.sin(ang) * dEnd, y: Math.tan(30 * D2R) * dEnd, z: -Math.cos(ang) * dEnd };
  const start = { x: sx, y: 16, z: -sy };
  let fly = null;
  function flyIn() {
    controls.enabled = false; controls.target.set(0, 0, 0);
    if (reduced()) { camera.position.set(oblique.x, oblique.y, oblique.z); camera.lookAt(0, 0, 0); controls.enabled = true; return; }
    fly = { t0: performance.now(), dur: port ? 4.2 : 3 }; camera.position.set(start.x, start.y, start.z); camera.lookAt(0, 20, 0);
  }
  function setView(v) {
    if (v === 'obl') { fly = null; camera.position.set(oblique.x, oblique.y, oblique.z); controls.target.set(0, 0, 0); controls.enabled = true; controls.update(); }
    else if (v === 'sea') {                                          // 船橋／人眼高度，站在最靠近進場方向的風機外側 · bridge or eye height outside the nearest turbine
      fly = null; let best = tb.P[0], bd = -Infinity; tb.P.forEach(p => { const d = p[0] * Math.sin(ang) + p[1] * Math.cos(ang); if (d > bd) { bd = d; best = p; } });
      const eye = sea ? 16 : 2.2, back = Math.max(250, rotor * 2.2), px = best[0] + Math.sin(ang) * back, pz = -(best[1] + Math.cos(ang) * back);
      camera.position.set(px, eye, pz); controls.target.set(best[0] - Math.sin(ang) * 400, eye * 0.6, -(best[1] - Math.cos(ang) * 400)); controls.enabled = true; controls.update();
    } else if (v === 'replay') flyIn();
    else if (v === 'link') { const h = location.hash.includes('sv=1') ? location.hash : location.hash + (location.hash.includes('?') ? '&' : '?') + 'sv=1'; const url = WW.SITE + h; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => WW.toast(L('已複製連結 ✓', 'Link copied ✓'))).catch(() => WW.toast(L('無法自動複製：', 'Could not copy: ') + url)); }
  }
  el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => setView(b.dataset.v));
  el.querySelector('.scn-back').onclick = () => close();
  // 說明與出處 · notes and credits
  const srcName = { us: L('USWTDB（美國風機資料庫，公有領域）', 'USWTDB (U.S. Wind Turbine Database, public domain)'), de: L('MaStR（© Bundesnetzagentur | Marktstammdatenregister）', 'MaStR (© Bundesnetzagentur | Marktstammdatenregister)'), osm: L('OpenStreetMap 志工標的位置（© OpenStreetMap 貢獻者，ODbL）', 'positions mapped by OpenStreetMap volunteers (© OpenStreetMap contributors, ODbL)') }[tb.src];
  const live = H.live(f);
  const lines = [
    tb.real ? L(`${n} 部風機在實際位置：`, `${n} turbines at their real positions: `) + srcName : L(`${n} 部風機為示意排列（依機組數推算，本站沒有這座風場的實際機位）`, `${n} turbines in a schematic layout (estimated from the unit count; no real positions on file)`),
    dm.est ? L(`尺寸為估計（輪轂約 ${Math.round(hub)} m、葉輪約 ${Math.round(rotor)} m，依機組容量與年份推算）`, `Dimensions estimated (hub about ${Math.round(hub)} m, rotor about ${Math.round(rotor)} m, from unit size and year)`) : L(`輪轂 ${Math.round(hub)} m、葉輪 ${Math.round(rotor)} m（${dm.src}）`, `Hub ${Math.round(hub)} m, rotor ${Math.round(rotor)} m (${dm.src})`),
    sea ? (H.fdName(f) ? L('水下基礎：', 'Foundation: ') + H.fdName(f) + L('（水面以上的基座段為示意）', ' (the part above water is schematic)') : L('水下基礎型式不詳，基座未畫', 'Foundation type unknown; no base drawn')) : null,
    port ? L('從', 'Starting from ') + (WW.lang === 'en' ? port.name : (port.zh || port.name)) + L('出發（港區只有衛星影像，不畫建物）', ' (the port area is imagery only; no buildings are drawn)') : (sea ? L('本站沒有這座風場對應的港口，從外海進場', 'No port on file for this farm; approaching from open water') : null),
    live ? L(`此刻出力 ${WW.int(live.mw)} MW，葉片依出力轉動`, `Output now ${WW.int(live.mw)} MW; the blades turn with it`) : L('葉片轉速為示意', 'Blade speed is illustrative'),
    L('衛星影像的拍攝日期常早於風場完工，所以影像裡通常看不到風機；海岸線與地形以影像為準，沒有高程。', 'The imagery is often older than the farm, so the turbines themselves are usually not in it; coastlines follow the imagery and there is no terrain relief.')
  ].filter(Boolean);
  el.querySelector('.scn-hud').innerHTML = '<ul>' + lines.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
  el.querySelector('.scn-cr').textContent = L('影像 © Esri, Vantor, Earthstar Geographics', 'Imagery © Esri, Vantor, Earthstar Geographics') + (tb.src === 'osm' ? ' · © OpenStreetMap contributors (ODbL)' : tb.src === 'de' ? ' · © Bundesnetzagentur | MaStR' : tb.src === 'us' ? ' · USWTDB' : '');
  // 迴圈 · loop
  const spin = live ? H.spin(live) : 1;                                // 0–2：地球儀近看的轉速係數 · the close-up's speed factor
  const rpm = (spin == null ? 1 : spin) * 60 * 55 / (Math.PI * rotor);  // 葉尖約 55 m/s × 係數 · tip speed about 55 m/s × factor
  let last = performance.now(), raf = 0, alive = true;
  function resize() { const w = pane.clientWidth || innerWidth, h = pane.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function frame(now) {
    if (!alive) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    rotors.forEach(r => { r.rotation.x = (r.parent.userData.phase || 0) + now / 1000 * rpm / 60 * 2 * Math.PI; });
    if (fly) {
      const k = Math.min(1, (now - fly.t0) / 1000 / fly.dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.set(start.x + (oblique.x - start.x) * e, start.y + (oblique.y - start.y) * e * e, start.z + (oblique.z - start.z) * e);
      camera.lookAt(0, 20 * (1 - e), 0);
      if (k >= 1) { fly = null; controls.target.set(0, 0, 0); controls.enabled = true; controls.update(); }
    } else { controls.update(); if (camera.position.y < 3) { camera.position.y = 3; } }
    renderer.render(scene, camera);
  }
  const onKey = e => { if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); } };
  window.addEventListener('keydown', onKey, true); window.addEventListener('resize', resize);
  H.pause();
  resize(); flyIn(); raf = requestAnimationFrame(frame);
  cur = { el, dispose() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); window.removeEventListener('resize', resize); controls.dispose(); scene.traverse(o => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); }); patches.forEach(m => m.material.map && m.material.map.dispose()); renderer.dispose(); el.remove(); H.resume(); if (fromBtn && fromBtn.isConnected) fromBtn.focus(); }, f };
  setTimeout(() => { const b = el.querySelector('.scn-back'); if (b) b.focus({ preventScroll: true }); }, 50);
  window.dispatchEvent(new CustomEvent('ww-scene', { detail: { open: true, farm: f.name } }));
}
function close() { if (!cur) return; const c = cur; cur = null; c.dispose(); window.dispatchEvent(new CustomEvent('ww-scene', { detail: { open: false } })); }
WW.scene = { open, close, isOpen: () => !!cur, farm: () => cur && cur.f };
})();
