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
  return { tex, canvas: c, x0, y0, x1, y1, z, tiles: (tx1 - tx0 + 1) * (ty1 - ty0 + 1) };
}

/* ---------- 海面（示意）：波紋法線貼圖＋天空反射，只鋪在衛星影像判斷為海的地方 ----------
   Esri 影像的外海幾乎是一片均勻的深藍，看起來像平面；這裡加一層會反射天空、帶細浪的水面。法線貼圖是可平鋪的正弦波疊加（不是實際浪況），
   遮罩用 Natural Earth 1:50m 陸地多邊形（往外留約 700 m），所以陸地與港區不會被蓋上水面；近岸那一圈保留原本的影像。 */
function waveNormals(px) {
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'), im = g.createImageData(px, px), d = im.data;
  const W = [[3, 1, .9, .3], [1, 4, .7, 1.7], [5, 2, .45, 2.4], [2, 7, .35, .8], [8, 3, .22, 4.1], [11, 9, .12, 5.3]];   // [kx, ky, 振幅, 相位]：整數頻率才能無縫平鋪
  const h = (x, y) => W.reduce((s, w) => s + w[2] * Math.sin(2 * Math.PI * (w[0] * x + w[1] * y) / px + w[3]), 0);
  for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
    const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1), k = 1.6, nx = -dx * k, ny = -dy * k, nz = 1, l = Math.hypot(nx, ny, nz), i = (y * px + x) * 4;
    d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (nz / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function seaMask(loc, im, rings, px) {
  // 海＝白、陸地＝黑：陸地多邊形往外加粗約 700 m（1:50m 海岸線誤差約 1 km，寧可讓近岸留一圈原本的影像），再縮放模糊讓邊緣柔和；影像四邊淡出
  // sea white, land black: land rings drawn with a ~700 m stroke (the 1:50m coast is off by about 1 km; better to leave a strip of plain imagery), softened by down/up-scaling, edges faded
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
  const sx = px / (im.x1 - im.x0), sy = px / (im.y1 - im.y0), X = x => (x - im.x0) * sx, Y = y => (im.y1 - y) * sy;
  g.fillStyle = '#fff'; g.fillRect(0, 0, px, px);
  g.fillStyle = g.strokeStyle = '#000'; g.lineJoin = 'round'; g.lineWidth = Math.max(2, 1400 * sx);
  rings.forEach(r => { g.beginPath(); for (let i = 0; i < r.length; i += 2) { const [x, y] = loc.xy(r[i], r[i + 1]); if (i) g.lineTo(X(x), Y(y)); else g.moveTo(X(x), Y(y)); } g.closePath(); g.fill(); g.stroke(); });
  const e = px * .06;                                                  // 四邊淡出 · fade the four edges
  g.globalCompositeOperation = 'multiply';
  [[0, 0, e, px, 0, 0, e, 0], [px - e, 0, e, px, px, 0, px - e, 0], [0, 0, px, e, 0, 0, 0, e], [0, px - e, px, e, 0, px, 0, px - e]].forEach(([x, y, w, h, gx0, gy0, gx1, gy1]) => {
    const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(x, y, w, h); });
  const o = document.createElement('canvas'); o.width = o.height = px; const og = o.getContext('2d'), q = px / 8;   // 縮小再放大＝模糊 · cheap blur
  const t = document.createElement('canvas'); t.width = t.height = q; t.getContext('2d').drawImage(c, 0, 0, q, q);
  og.imageSmoothingEnabled = true; og.drawImage(t, 0, 0, px, px);
  const tex = new THREE.CanvasTexture(o); tex.anisotropy = 8; return tex;
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
  const NB = H.neighbours ? H.neighbours(f, 10) : [];        // 10 km 內其他營運中的風場（淡色一起畫）· neighbouring operating farms, drawn dimmer
  const hub = dm.hub, rotor = dm.rotor;
  let rad = 0; tb.P.forEach(p => { rad = Math.max(rad, Math.hypot(p[0], p[1])); }); rad = Math.max(rad, 300);
  let ext = rad; NB.forEach(nb => { const [ox, oy] = loc.xy(nb.lon, nb.lat); nb.off = [ox, oy]; nb.t.P.forEach(p => { ext = Math.max(ext, Math.hypot(ox + p[0], oy + p[1])); }); });

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
  let alive = true;
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
  // 近處那塊的外緣 10% 漸漸透明，接到遠處那塊時看不出接縫（Esri 低倍率的海面較暗）· the fine patch fades out over its outer 10%,
  // so its edge melts into the coarse patch (Esri's low-zoom sea is darker)
  let edgeA = null;
  const edgeFade = () => {
    if (edgeA) return edgeA;
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), d = g.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const e = Math.min(i, N - 1 - i, j, N - 1 - j) / (N * 0.1), t = Math.min(1, e), v = Math.round(255 * t * t * (3 - 2 * t)), k = (j * N + i) * 4;
      d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255;
    }
    g.putImageData(d, 0, 0); edgeA = new THREE.CanvasTexture(c); return edgeA;
  };
  const addPatch = (span, maxTiles, px, y, fade) => {
    const [lon0, lat0] = loc.ll(-span, -span), [lon1, lat1] = loc.ll(span, span);
    const im = imagery(loc, lon0, lat0, lon1, lat1, maxTiles, px, (pend, fail) => { if (!pend) { el.querySelector('.scn-load').hidden = true; if (fail) noteFail(fail); if (im.onDone) im.onDone(); } });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(im.x1 - im.x0, im.y1 - im.y0), groundMat(im.tex, sea ? .35 : 1));
    if (fade) { m.material.alphaMap = edgeFade(); m.material.transparent = true; m.material.depthWrite = false; m.renderOrder = -1; }   // 畫在遠處那塊之後、水面之前 · after the coarse patch, before the water
    m.rotation.x = -Math.PI / 2; m.position.set((im.x0 + im.x1) / 2, y, -(im.y0 + im.y1) / 2); scene.add(m); patches.push(m); return im;
  };
  const LOW = sea ? -6 : 0;                                          // 海上場景：影像放在水面下 6 m，避免遠處深度互搶 · sea scenes: imagery 6 m under the water to avoid depth fighting
  const fine = addPatch(Math.min(ext, rad + 8000) + 2500, 144, 3072, LOW, true);
  const reach = port ? Math.hypot(...loc.xy(port.lon, port.lat)) + 6000 : 25000;
  const coarse = addPatch(Math.max(reach, 20000), 100, 2048, LOW - 1.5);
  if (port) { const [px0, py0] = loc.xy(port.lon, port.lat); const [plon0, plat0] = loc.ll(px0 - 2500, py0 - 2500), [plon1, plat1] = loc.ll(px0 + 2500, py0 + 2500); const im = imagery(loc, plon0, plat0, plon1, plat1, 100, 2048); const m = new THREE.Mesh(new THREE.PlaneGeometry(im.x1 - im.x0, im.y1 - im.y0), groundMat(im.tex, .9)); m.rotation.x = -Math.PI / 2; m.position.set((im.x0 + im.x1) / 2, LOW + 0.4, -(im.y0 + im.y1) / 2); scene.add(m); patches.push(m); }
  // 海面層 · water layer (illustrative ripples and sky reflection), only where the fine imagery reads as sea
  let water = null;
  if (sea) {
    const pm = new THREE.PMREMGenerator(renderer), env = pm.fromEquirectangular(skyTex).texture; pm.dispose();
    // 水面鋪滿遠處那塊影像的範圍（邊緣在 20 km 外、藏在霧裡）；遮罩用同一塊影像算 · the water spans the coarse patch (edges 20 km+ away, in the fog)
    const nrm = waveNormals(256), span = coarse.x1 - coarse.x0, rep = Math.max(1, Math.round(span / 90));     // 一格約 90 m · one tile ≈ 90 m
    nrm.repeat.set(rep, rep);
    const wm = new THREE.MeshStandardMaterial({ color: 0x0d3a55, roughness: .16, metalness: 0, envMap: env, envMapIntensity: 1.1, normalMap: nrm, normalScale: new THREE.Vector2(.45, .45), transparent: true, opacity: .96, depthWrite: false });
    water = new THREE.Mesh(new THREE.PlaneGeometry(span, coarse.y1 - coarse.y0), wm);
    water.rotation.x = -Math.PI / 2; water.position.set((coarse.x0 + coarse.x1) / 2, 0, -(coarse.y0 + coarse.y1) / 2); water.renderOrder = 1; scene.add(water);
    const [ml0, mb0] = loc.ll(coarse.x0, coarse.y0), [ml1, mb1] = loc.ll(coarse.x1, coarse.y1);
    wm.alphaMap = seaMask(loc, coarse, H.land ? H.land(ml0, mb0, ml1, mb1) : [], 1024);
    water.userData.env = env;
  }
  if (sea) { const s = new THREE.Mesh(new THREE.CircleGeometry(70000, 48), new THREE.MeshStandardMaterial({ color: 0x0d3a55, roughness: .22, metalness: 0, envMap: water.userData.env, envMapIntensity: 1.1 })); s.rotation.x = -Math.PI / 2; s.position.y = -12; scene.add(s); }
  else { const s = new THREE.Mesh(new THREE.CircleGeometry(70000, 48), new THREE.MeshStandardMaterial({ color: 0x55653f, roughness: 1 })); s.rotation.x = -Math.PI / 2; s.position.y = -4; scene.add(s); }
  function noteFail(k) { const h = el.querySelector('.scn-hud'); if (h && !h.dataset.fail) { h.dataset.fail = '1'; h.insertAdjacentHTML('beforeend', '<div class="scn-warn">' + esc(L('部分衛星影像載不到（離線或網路受限），地面以單色代替。', 'Some imagery could not be loaded (offline or restricted network); plain colours are used instead.')) + '</div>'); } }
  // 風機與基座 · turbines and bases
  const mats = { white: new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: .55 }) };
  const rotors = [], bases = H.baseKeys(f, n);
  tb.P.forEach((p, i) => {
    const t = makeTurbine(mats, hub, rotor, sea); t.position.set(p[0], 0, -p[1]); t.userData.phase = Math.random() * 6.28; scene.add(t); rotors.push(t.userData.rot);
    if (bases) H.baseParts(bases[i]).forEach(part => { const m = new THREE.Mesh(part.geo, part.mat); m.scale.set(hub, hub, hub); m.position.set(p[0], 0, -p[1]); scene.add(m); });
  });
  // 相鄰風場：淡色、各自的機位與尺寸，最多 600 部 · neighbours: dimmer material, their own positions and sizes, at most 600 turbines
  const dimMats = { white: new THREE.MeshStandardMaterial({ color: 0xcfd5db, roughness: .7 }) };
  let nbCount = 0; const nbDrawn = [];
  NB.forEach(nb => {
    if (nbCount >= 600) return; const [ox, oy] = nb.off, nbBases = H.baseKeys(nb.f, nb.t.P.length);
    nb.t.P.forEach((p, i) => { if (nbCount >= 600) return; nbCount++;
      const t = makeTurbine(dimMats, nb.dims.hub, nb.dims.rotor, nb.f.type !== 'onshore'); t.position.set(ox + p[0], 0, -(oy + p[1])); t.userData.phase = Math.random() * 6.28; scene.add(t); rotors.push(t.userData.rot);
      if (nbBases) H.baseParts(nbBases[i]).forEach(part => { const m = new THREE.Mesh(part.geo, part.mat); m.scale.set(nb.dims.hub, nb.dims.hub, nb.dims.hub); m.position.set(ox + p[0], 0, -(oy + p[1])); scene.add(m); }); });
    nbDrawn.push(nb);
  });
  // 鏡頭與控制 · camera and controls
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.rotateSpeed = .5; controls.minDistance = 30; controls.maxDistance = 40000;
  controls.maxPolarAngle = Math.PI / 2 - 0.015; controls.screenSpacePanning = false; controls.enabled = false;
  if (controls.listenToKeyEvents) controls.listenToKeyEvents(window);
  const [sx, sy] = port ? loc.xy(port.lon, port.lat) : [rad * 2 + 6000, -(rad + 4000)];
  const ang = Math.atan2(sx, sy);                                    // 進場方向（從起點看風場）· approach bearing
  // 到達時的 30° 俯瞰：小風場看整座（以中心為目標）；大風場站在進場那一側的外緣、看向場內約 1.5 km，最近的風機才不會小到看不清
  // arrival view at 30°: small farms are framed whole; large farms are seen from just outside the edge on the approach side, looking about 1.5 km in
  let edge = 0; tb.P.forEach(p => { edge = Math.max(edge, p[0] * Math.sin(ang) + p[1] * Math.cos(ang)); });
  const inset = Math.min(1500, rad * .6), tgt = Math.max(0, edge - inset);
  const T = { x: Math.sin(ang) * tgt, z: -Math.cos(ang) * tgt };
  const dEnd = rad < 1600 ? Math.max(900, rad * 1.35) : Math.min(2600, Math.max(1600, inset + 900));
  scene.fog = new THREE.Fog(0xdfe9f2, Math.max(4000, dEnd * 3), Math.max(30000, dEnd * 14));
  const oblique = { x: T.x + Math.sin(ang) * dEnd, y: Math.tan(30 * D2R) * dEnd, z: T.z - Math.cos(ang) * dEnd };
  const start = { x: sx, y: 16, z: -sy };
  let fly = null;
  function flyIn() {
    controls.enabled = false; controls.target.set(T.x, 0, T.z);
    if (reduced()) { camera.position.set(oblique.x, oblique.y, oblique.z); camera.lookAt(T.x, 0, T.z); controls.enabled = true; return; }
    fly = { t0: performance.now(), dur: port ? 4.2 : 3 }; camera.position.set(start.x, start.y, start.z); camera.lookAt(T.x, 20, T.z);
  }
  function setView(v) {
    if (v === 'obl') { fly = null; camera.position.set(oblique.x, oblique.y, oblique.z); controls.target.set(T.x, 0, T.z); controls.enabled = true; controls.update(); }
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
    H.posNote && H.posNote(f) ? L('這座風場的座標只是概略位置（見卡片說明），畫面可能落在離實際位置幾公里的地方，甚至在陸地上。', 'This farm\'s coordinates are only approximate (see the card), so the scene may sit kilometres from the real site, even on land.') : null,
    nbDrawn.length ? L(`淡色風機是 10 km 內的其他風場（${nbDrawn.map(x => x.name + (x.t.real ? '（' + { us: 'USWTDB', de: 'MaStR', osm: 'OSM' }[x.t.src] + '）' : '［示意］')).join('、')}）`, `Pale turbines belong to other farms within 10 km (${nbDrawn.map(x => x.name + (x.t.real ? ' (' + { us: 'USWTDB', de: 'MaStR', osm: 'OSM' }[x.t.src] + ')' : ' [schematic]')).join(', ')})`) : null,
    sea ? L('海面的波紋與天空倒影為示意，不是當天的浪況', 'Ripples and sky reflection on the water are illustrative, not today\'s sea state') : null,
    L('衛星影像的拍攝日期常早於風場完工，所以影像裡通常看不到風機；海岸線與地形以影像為準，沒有高程。', 'The imagery is often older than the farm, so the turbines themselves are usually not in it; coastlines follow the imagery and there is no terrain relief.')
  ].filter(Boolean);
  el.querySelector('.scn-hud').innerHTML = '<ul>' + lines.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
  const srcs = new Set([tb.src].concat(nbDrawn.map(x => x.t.src)).filter(Boolean));   // 本場與畫出的相鄰風場用到的機位來源都要標示 · credit every position source drawn
  el.querySelector('.scn-cr').textContent = L('影像 © Esri, Vantor, Earthstar Geographics', 'Imagery © Esri, Vantor, Earthstar Geographics') + (srcs.has('osm') ? ' · © OpenStreetMap contributors (ODbL)' : '') + (srcs.has('de') ? ' · © Bundesnetzagentur | MaStR' : '') + (srcs.has('us') ? ' · USWTDB' : '');
  // 迴圈 · loop
  const spin = live ? H.spin(live) : 1;                                // 0–2：地球儀近看的轉速係數 · the close-up's speed factor
  const rpm = (spin == null ? 1 : spin) * 60 * 55 / (Math.PI * rotor);  // 葉尖約 55 m/s × 係數 · tip speed about 55 m/s × factor
  let last = performance.now(), raf = 0;
  function resize() { const w = pane.clientWidth || innerWidth, h = pane.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function frame(now) {
    if (!alive) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    rotors.forEach(r => { r.rotation.x = (r.parent.userData.phase || 0) + now / 1000 * rpm / 60 * 2 * Math.PI; });
    if (water && !reduced()) { const o = water.material.normalMap.offset; o.x = (o.x + dt * .006) % 1; o.y = (o.y + dt * .004) % 1; }
    if (fly) {
      const k = Math.min(1, (now - fly.t0) / 1000 / fly.dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.set(start.x + (oblique.x - start.x) * e, start.y + (oblique.y - start.y) * e * e, start.z + (oblique.z - start.z) * e);
      camera.lookAt(T.x, 20 * (1 - e), T.z);
      if (k >= 1) { fly = null; controls.target.set(T.x, 0, T.z); controls.enabled = true; controls.update(); }
    } else { controls.update(); if (camera.position.y < 3) { camera.position.y = 3; } }
    renderer.render(scene, camera);
  }
  const onKey = e => { if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); } };
  window.addEventListener('keydown', onKey, true); window.addEventListener('resize', resize);
  H.pause();
  resize(); flyIn(); raf = requestAnimationFrame(frame);
  cur = { el, stats: { turbines: n, neighbours: nbDrawn.length, neighbourTurbines: nbCount, real: tb.real, port: !!port }, dispose() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); window.removeEventListener('resize', resize); controls.dispose(); scene.traverse(o => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); }); patches.forEach(m => m.material.map && m.material.map.dispose()); if (edgeA) edgeA.dispose(); if (water) { ['normalMap', 'alphaMap', 'envMap'].forEach(k => water.material[k] && water.material[k].dispose()); water.material.dispose(); } renderer.dispose(); el.remove(); H.resume(); if (fromBtn && fromBtn.isConnected) fromBtn.focus(); }, f };
  setTimeout(() => { const b = el.querySelector('.scn-back'); if (b) b.focus({ preventScroll: true }); }, 50);
  window.dispatchEvent(new CustomEvent('ww-scene', { detail: { open: true, farm: f.name } }));
}
function close() { if (!cur) return; const c = cur; cur = null; c.dispose(); window.dispatchEvent(new CustomEvent('ww-scene', { detail: { open: false } })); }
WW.scene = { open, close, isOpen: () => !!cur, farm: () => cur && cur.f, stats: () => cur ? cur.stats : null };
})();
