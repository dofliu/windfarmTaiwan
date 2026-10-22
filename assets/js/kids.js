/* 風電風情 · kids.js — 兒童版「跟著風去旅行」（給小學高年級到國中生，帶路角色「小風」）
   #/kids 開場 · #/kids/globe 地球與冒險路線 · #/kids/stop?n=1–8 一站 · #/kids/taiwan 台灣此刻的風 · #/kids/passport 風車護照
   #/kids/cert 完成證書（可列印） · #/kids/class?n=1–8 全班一起玩（投影用，不蓋章、不記錄進度）；「唸給我聽」用瀏覽器內建的語音合成。
   地球用 three.js 畫卡通國界（world_borders.json），各國依「時光機」那一年的累積容量上色（wind_global.json）。
   八站對應 wind_global.json 的里程碑（年份、位置、容量、葉輪直徑都從那裡讀），照片取自 photos.json（已人工核對的 Commons 照片），
   Hywind 的水深、輪轂與葉輪取自 foundations.json；台灣此刻的數字來自 WW.live（台電即時資料）。進度只記在這台裝置的瀏覽器裡。
   Kids' edition "Travel with the Wind": the numbers come from the site's data files, the photos from photos.json; progress stays in this browser. */
(() => {
'use strict';
const L = WW.L, esc = WW.esc, $ = id => document.getElementById(id);
const page = $('page-kids');
if (!page) return;

/* ---------------- 進度（只記在這台裝置） · progress, kept in this browser only ---------------- */
const KEY = 'wf_kids';
let P = {};
try { P = JSON.parse(WW.store.get(KEY, 'null')) || {}; } catch (e) { P = {}; }
if (!Array.isArray(P.s)) P.s = [];
P.s = P.s.filter(n => n >= 1 && n <= 8);
const save = () => WW.store.set(KEY, JSON.stringify(P));
const stamped = n => P.s.includes(n);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const nextStop = () => { for (let n = 1; n <= 8; n++) if (!stamped(n)) return n; return 0; };

/* ---------------- 小風（SVG，粗線條） · the guide, Breezy ---------------- */
const NAVY = '#12324A';
function sprite(mood, size, label) {
  const st = 'stroke="' + NAVY + '" stroke-width="5" stroke-linecap="round"';
  const eyes = mood === 'sleepy'
    ? '<path d="M84 124 Q92 130 100 124" fill="none" ' + st + '/><path d="M120 124 Q128 130 136 124" fill="none" ' + st + '/>'
    : mood === 'happy'
      ? '<path d="M84 126 Q92 114 100 126" fill="none" ' + st + '/><path d="M120 126 Q128 114 136 126" fill="none" ' + st + '/>'
      : '<ellipse cx="92" cy="122" rx="7" ry="10" fill="' + NAVY + '"/><circle cx="94.5" cy="118" r="2.6" fill="#fff"/>' +
        '<ellipse cx="128" cy="122" rx="7" ry="10" fill="' + NAVY + '"/><circle cx="130.5" cy="118" r="2.6" fill="#fff"/>';
  const mouth = mood === 'wow' ? '<ellipse cx="110" cy="148" rx="9" ry="7" fill="' + NAVY + '"/>'
    : mood === 'sleepy' ? '<path d="M102 146 Q110 150 118 146" fill="none" ' + st + '/>'
      : '<path d="M98 142 Q110 154 122 142" fill="none" ' + st + '/>';
  const top = mood === 'sleepy'
    ? '<text x="150" y="40" font-size="26" font-weight="800" fill="#5B7186">z</text><text x="172" y="22" font-size="20" font-weight="800" fill="#5B7186">z</text>'
    : '<path class="kwisp" d="M112 44 C 104 24, 132 16, 138 32 C 143 46, 122 50, 124 38" fill="none" ' + st + '/>';
  const tail = mood === 'sleepy'
    ? '<path d="M152 172 C 158 186, 156 200, 150 210 C 142 204, 140 190, 146 176 Z" fill="#FF7A59" stroke="' + NAVY + '" stroke-width="5" stroke-linejoin="round"/>'
    : '<path class="kscarf" d="M150 170 C 172 168, 182 186, 206 178 C 200 194, 180 200, 162 190 C 156 186, 152 180, 150 170 Z" fill="#FF7A59" stroke="' + NAVY + '" stroke-width="5" stroke-linejoin="round"/>';
  const arm = (mood === 'wave' || mood === 'happy')
    ? '<path d="M47 128 C 28 120, 22 102, 28 88" fill="none" ' + st + '/><circle cx="29" cy="83" r="8" fill="#DFF3FF" stroke="' + NAVY + '" stroke-width="4"/>' : '';
  return '<svg class="ksprite k-' + mood + '" viewBox="0 0 220 220" width="' + size + '" height="' + size + '" ' +
    (label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"') + '>' + top +
    '<path d="M110 46 C 160 46, 178 86, 176 120 C 174 160, 146 182, 110 182 C 74 182, 46 160, 44 120 C 42 86, 60 46, 110 46 Z" fill="#DFF3FF" stroke="' + NAVY + '" stroke-width="5"/>' +
    '<ellipse cx="80" cy="70" rx="14" ry="7" fill="#fff"/>' +
    '<path d="M48 96 C 80 82, 140 82, 172 96" fill="none" stroke="' + NAVY + '" stroke-width="6"/>' +
    '<circle cx="86" cy="88" r="15" fill="#FFC845" stroke="' + NAVY + '" stroke-width="5"/><circle cx="86" cy="88" r="7" fill="#BFE9FF"/>' +
    '<circle cx="134" cy="88" r="15" fill="#FFC845" stroke="' + NAVY + '" stroke-width="5"/><circle cx="134" cy="88" r="7" fill="#BFE9FF"/>' +
    eyes + '<ellipse cx="72" cy="138" rx="9" ry="6" fill="#FFB4A2"/><ellipse cx="148" cy="138" rx="9" ry="6" fill="#FFB4A2"/>' + mouth +
    '<path d="M58 160 C 86 174, 134 174, 162 160 L 166 174 C 136 190, 84 190, 54 174 Z" fill="#FF7A59" stroke="' + NAVY + '" stroke-width="5" stroke-linejoin="round"/>' +
    tail + arm + '</svg>';
}
const ROTOR = (cls, fill, line, hub) => '<svg class="' + cls + '" viewBox="0 0 28 28" aria-hidden="true"><g fill="' + fill + '" stroke="' + line + '" stroke-width="1.6">' +
  [0, 120, 240].map(a => '<path d="M14 14 C12 9 12.5 3 14 1 C15.5 3 16 9 14 14 Z" transform="rotate(' + a + ' 14 14)"/>').join('') +
  '</g><circle cx="14" cy="14" r="2.6" fill="' + hub + '" stroke="' + line + '" stroke-width="1.4"/></svg>';
const I = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="11" r="3.5"/><path d="M9 17h6"/>',
  next: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  prev: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  house: '<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>',
  stamp: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" stroke-dasharray="2 2"/><path d="M9.5 12l1.8 1.8 3.4-3.6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  wave: '<path d="M3 17c2 0 2-1.5 4.5-1.5S10 17 12 17s2-1.5 4.5-1.5S19 17 21 17"/><path d="M12 13V4"/><path d="M12 4l-3 4M12 4l3 4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  speak: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  board: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  unfull: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>'
};
const ico = (n, sz) => '<svg class="kico" viewBox="0 0 24 24" width="' + (sz || 22) + '" height="' + (sz || 22) + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[n] + '</svg>';

/* ---------------- 唸給我聽（瀏覽器內建語音合成，不連外） · read aloud with the browser's own speech ----------------
   每個畫面把要唸的文字標成 data-say（有值就唸值，沒有就唸文字內容），依畫面順序一段一段唸。 */
const SS = window.speechSynthesis, CAN_SAY = !!(SS && window.SpeechSynthesisUtterance);
let saying = false, sayGen = 0;
function sayVoice() {
  const vs = SS.getVoices() || [];
  if (!vs.length) return undefined;                                   // 清單還沒載入：交給瀏覽器依語言挑
  return WW.lang === 'en' ? vs.find(v => /^en[-_](GB|US)/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null
    : vs.find(v => /^(zh[-_]TW|cmn[-_]Hant)/i.test(v.lang)) || vs.find(v => /^(zh|cmn)/i.test(v.lang)) || null;
}
const sayFix = t => WW.lang === 'en'                                  // 單位唸成字 · units read as words
  ? t.replace(/(\d)\s*GW\b/g, '$1 gigawatts').replace(/(\d)\s*MW\b/g, '$1 megawatts').replace(/(\d)\s*kWh\b/g, '$1 kilowatt hours').replace(/(\d)\s*kW\b/g, '$1 kilowatts')
    .replace(/(\d)\s*m\b/g, '$1 metres').replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2').replace(/\s*[=＝]\s*/g, ' equals ').replace(/·/g, ',')
  : t.replace(/(\d)\s*GW/g, '$1 十億瓦').replace(/(\d)\s*MW/g, '$1 百萬瓦').replace(/(\d)\s*kW/g, '$1 千瓦').replace(/(\d)\s*m\b/g, '$1 公尺')
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 到 $2').replace(/\s*[=＝]\s*/g, '等於').replace(/·/g, '，');
const sayParts = () => [...page.querySelectorAll('.kview [data-say]')].map(e => (e.dataset.say || e.textContent).replace(/\s+/g, ' ').trim()).filter(Boolean);
function speak(on) {
  sayGen++; saying = false;
  if (CAN_SAY) SS.cancel();
  const parts = on && CAN_SAY ? sayParts() : [];
  if (parts.length) {
    const g = sayGen, v = sayVoice(), done = () => { if (g === sayGen) { saying = false; paintSay(); } };
    const fail = e => {                                                // 裝置沒有語音引擎或語音包 · no speech engine or voice
      if (g === sayGen && e && e.error !== 'interrupted' && e.error !== 'canceled') { sayGen++; SS.cancel(); saying = false; paintSay(); WW.toast(L('這台裝置沒辦法唸出聲音（沒有語音合成或中文語音）', 'This device can’t read aloud (no speech engine or voice)')); }
      else done();
    };
    parts.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(sayFix(t));
      u.lang = WW.lang === 'en' ? 'en-GB' : 'zh-TW'; if (v) u.voice = v; u.rate = 0.95;
      u.onerror = fail; if (i === parts.length - 1) u.onend = done;
      SS.speak(u);
    });
    saying = true;
  }
  paintSay();
}
const spkBtn = cls => CAN_SAY ? '<button type="button" class="kspk ' + (cls || '') + '" aria-pressed="false"></button>' : '';
function paintSay() {
  const none = CAN_SAY && SS.getVoices().length > 0 && sayVoice() === null;     // 裝置上沒有這個語言的語音
  page.querySelectorAll('.kspk').forEach(b => {
    b.disabled = none;
    b.setAttribute('aria-pressed', saying ? 'true' : 'false');
    b.title = none ? L('這台裝置沒有中文語音', 'No English voice on this device') : '';
    b.innerHTML = ico(saying ? 'stop' : 'speak') + '<span>' + (saying ? L('停止', 'Stop') : L('唸給我聽', 'Read to me')) + '</span>';
  });
}
if (CAN_SAY) SS.addEventListener && SS.addEventListener('voiceschanged', paintSay);
page.addEventListener('click', e => { const b = e.target.closest('.kspk'); if (b && !b.disabled) speak(!saying); });

/* 全螢幕（全班一起玩） · full screen for the class mode */
const FS_OK = !!(document.fullscreenEnabled && page.requestFullscreen);
const fsBtn = cls => FS_OK ? '<button type="button" class="kfs ' + (cls || '') + '"></button>' : '';
function paintFS() {
  const on = document.fullscreenElement === page;
  page.querySelectorAll('.kfs').forEach(b => { b.innerHTML = ico(on ? 'unfull' : 'full') + '<span>' + (on ? L('離開全螢幕', 'Exit full screen') : L('全螢幕', 'Full screen')) + '</span>'; });
}
const toggleFS = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else page.requestFullscreen().catch(() => {}); };
if (FS_OK) document.addEventListener('fullscreenchange', paintFS);
page.addEventListener('click', e => { if (e.target.closest('.kfs')) toggleFS(); });

/* ---------------- 八站（內容的數字都取自里程碑與基礎資料） · the eight stops ---------------- */
const fmtKW = mw => mw < 1 ? WW.int(mw * 1000) + ' kW' : WW.num(mw, mw % 1 ? 1 : 0) + ' MW';
const STOPS = [
  { n: 1, ms: 'Brush wind turbine', photo: ['ms', 'Brush wind turbine, Cleveland'], scene: 'land',
    place: ['美國 克里夫蘭', 'Cleveland, USA'], title: ['第一部會自己發電的風車', 'The first turbine that ran by itself to make power'],
    stamp: ['第一部\n發電風車', 'First power\nturbine'],
    tease: ['1888 年的美國，有人在家旁邊蓋了一部超大的風車……', 'In 1888 an American built a huge windmill next to his house…'],
    facts: m => [
      ['1888 年，美國發明家布拉許（Charles Brush）在克里夫蘭的大宅子旁蓋了一部風車，用來發電。', 'In 1888 the American inventor Charles Brush built a wind turbine beside his mansion in Cleveland to make electricity.'],
      ['它有 144 片葉片，像一把大扇子，葉輪直徑 ' + m.rotor + ' 公尺，可以發出 ' + fmtKW(m.mw) + ' 的電。', 'It had 144 blades, like a giant fan, a ' + m.rotor + ' m rotor and ' + fmtKW(m.mw) + ' of power.'],
      ['發出的電存進蓄電池給家裡用。這是第一部會自己運轉的發電風車。', 'The power charged batteries for the house. It was the first wind turbine that ran by itself to make electricity.']],
    quiz: { q: ['布拉許的風車有幾片葉片？', 'How many blades did Brush’s turbine have?'],
      o: [[['3 片', '3'], ['今天的風機才是 3 片，1888 年的這部可多得多。', 'Today’s turbines have 3 — this 1888 machine had far more.']],
        [['144 片', '144']],
        [['1 片', '1'], ['只有 1 片轉不太起來喔，再想想！', 'One blade would hardly turn — try again!']]],
      a: 1, ok: ['144 片葉片，看起來像一把超大的扇子。', '144 blades — it looked like a giant fan.'] } },
  { n: 2, ms: 'Gedser wind turbine', photo: ['ms', 'Gedser wind turbine'], scene: 'land',
    place: ['丹麥 蓋瑟', 'Gedser, Denmark'], title: ['三片葉片的祖先', 'The grandparent of three-blade turbines'],
    stamp: ['三片葉片\n的祖先', 'Three-blade\nancestor'],
    tease: ['今天的風車為什麼都長得差不多？答案在丹麥。', 'Why do today’s turbines all look alike? The answer is in Denmark.'],
    facts: m => [
      [m.year + ' 年，丹麥南部的蓋瑟（Gedser）立起一部 ' + fmtKW(m.mw) + ' 的風機，葉輪直徑 ' + m.rotor + ' 公尺。', 'In ' + m.year + ' a ' + fmtKW(m.mw) + ' turbine with a ' + m.rotor + ' m rotor went up at Gedser in southern Denmark.'],
      ['它有三片葉片，葉片在塔的前面，迎著風轉。', 'It had three blades, turning on the side of the tower that faces the wind.'],
      ['這種「丹麥設計」成了現代風機的範本，今天大部分的風機都長這樣。', 'This “Danish concept” became the template for modern turbines — most turbines today look like it.']],
    quiz: { q: ['今天大部分的大型風機有幾片葉片？', 'How many blades do most big turbines have today?'],
      o: [[['2 片', '2'], ['也有兩片的風機，但不是大部分。再想想蓋瑟風機的樣子！', 'Some turbines have two, but not most. Think of the Gedser turbine!']],
        [['3 片', '3']],
        [['5 片', '5'], ['再想想蓋瑟風機的樣子！', 'Think of the Gedser turbine!']]],
      a: 1, ok: ['就跟蓋瑟風機一樣是三片。', 'Three, just like the Gedser turbine.'] } },
  { n: 3, ms: 'Muppandal wind farm', photo: ['ms', 'Muppandal wind farm (first phase), Tamil Nadu'], scene: 'land',
    place: ['印度 穆潘達爾', 'Muppandal, India'], title: ['山口的強風', 'Wind through a mountain pass'],
    stamp: ['山口的\n強風', 'Windy\nmountain pass'],
    tease: ['印度南端有個山口，蓋滿了風車。', 'At the southern tip of India, turbines fill a mountain pass.'],
    facts: m => [
      ['印度南端的穆潘達爾（Muppandal），就在 Aralvaimozhi 山口旁邊。', 'Muppandal, at the southern tip of India, sits by the Aralvaimozhi mountain pass.'],
      ['兩邊是山、中間有缺口，風從缺口吹過時常常特別強，很適合蓋風車。', 'With mountains on both sides, the wind blowing through the gap is often especially strong — good for turbines.'],
      [m.year + ' 年開始在這裡蓋風場，後來超過 ' + WW.int(m.farm) + ' MW，成為印度最大的陸上風場聚落。', 'Wind farms started here in ' + m.year + ' and grew past ' + WW.int(m.farm) + ' MW — India’s largest onshore wind cluster.']],
    quiz: { q: ['為什麼風車喜歡蓋在山口？', 'Why do turbines like mountain passes?'],
      o: [[['山口的風常常比較強', 'The wind there is often stronger']],
        [['山口比較涼快', 'It is cooler there'], ['涼不涼快不重要，風車要的是風！', 'Coolness doesn’t matter — turbines need wind!']],
        [['山口的路比較好走', 'The roads are easier'], ['路好不好走不是原因，再想想風車需要什麼。', 'Roads aren’t the reason — what does a turbine need?']]],
      a: 0, ok: ['風從山的缺口吹過去，常常變得更強。', 'Wind squeezing through the gap often gets stronger.'] } },
  { n: 4, ms: 'Vindeby offshore wind farm', photo: null, scene: 'sea', count: 11,
    place: ['丹麥 洛蘭島外海', 'Off Lolland, Denmark'], title: ['第一座海上風場', 'The first wind farm at sea'],
    stamp: ['第一座\n海上風場', 'First farm\nat sea'],
    tease: ['1991 年，有人想到：把風車搬到海上試試看！', 'In 1991 someone had an idea: let’s try turbines at sea!'],
    facts: m => [
      [m.year + ' 年，丹麥洛蘭島（Lolland）外海立起 11 部風機，這是世界第一座海上風場。', 'In ' + m.year + ', 11 turbines went up off Lolland in Denmark — the world’s first offshore wind farm.'],
      ['每部 ' + fmtKW(m.mw) + '，加起來大約 ' + WW.num(m.farm, 0) + ' MW。', 'Each made ' + fmtKW(m.mw) + ', about ' + WW.num(m.farm, 0) + ' MW in all.'],
      ['它一直轉到 2017 年才退休，工作了 ' + (2017 - m.year) + ' 年。', 'It kept turning until 2017 — ' + (2017 - m.year) + ' years of work.']],
    quiz: { q: ['為什麼要把風車搬到海上？', 'Why move turbines out to sea?'],
      o: [[['海上的風通常比較強、比較穩', 'Wind at sea is usually stronger and steadier']],
        [['在海上比較好蓋', 'It’s easier to build at sea'], ['其實在海上蓋比陸上難多了，要用大船和特別的基礎。', 'Building at sea is much harder — it takes big ships and special foundations.']],
        [['魚喜歡看風車', 'Fish like to watch turbines'], ['哈，這不是原因喔！', 'Ha, that’s not the reason!']]],
      a: 0, ok: ['海面又平又寬，沒有山和房子擋，風通常比較強也比較穩。', 'The sea is flat and open, with no hills or houses in the way, so the wind is usually stronger and steadier.'] } },
  { n: 5, ms: 'Jiuquan (Gansu)', photo: ['ms', 'Jiuquan (Gansu) Wind Power Base'], scene: 'land',
    place: ['中國 酒泉', 'Jiuquan, China'], title: ['戈壁上的風電基地', 'A wind power base by the Gobi'],
    stamp: ['戈壁上的\n風電基地', 'Gobi wind\nbase'],
    tease: ['沙漠旁邊，有全世界最大的陸上風電基地。', 'By the desert lies the world’s largest onshore wind base.'],
    facts: m => [
      ['中國甘肅省的酒泉，旁邊是一大片戈壁沙漠。', 'Jiuquan, in China’s Gansu province, lies next to the vast Gobi desert.'],
      [m.year + ' 年開始在這裡蓋風場，後來超過 ' + WW.int(m.farm / 1000) + ' GW。', 'Building started here in ' + m.year + ', and it grew past ' + WW.int(m.farm / 1000) + ' GW.'],
      ['它是全世界最大的陸上風電基地。', 'It is the world’s largest onshore wind power base.']],
    quiz: { q: ['8 GW 等於多少 MW？', 'How many MW is 8 GW?'],
      o: [[['8 MW', '8 MW'], ['1 GW 是 1,000 MW，所以 8 GW 不只 8 MW 喔。', '1 GW is 1,000 MW, so 8 GW is much more than 8 MW.']],
        [['800 MW', '800 MW'], ['差一點！1 GW＝1,000 MW。', 'Close! 1 GW = 1,000 MW.']],
        [['8,000 MW', '8,000 MW']]],
      a: 2, ok: ['1 GW＝1,000 MW，8 GW 就是 8,000 MW。', '1 GW = 1,000 MW, so 8 GW is 8,000 MW.'] } },
  { n: 6, ms: 'Hywind Scotland', photo: ['ms', 'Hywind Scotland, Buchan Deep'], scene: 'float', fd: 'Hywind Scotland',
    place: ['蘇格蘭 Peterhead 外海', 'Off Peterhead, Scotland'], title: ['會浮在海上的風車', 'Turbines that float'],
    stamp: ['浮在海上\n的風車', 'Floating\nturbines'],
    tease: ['那裡的風車沒有插在海底，竟然是……浮在海上？', 'Those turbines aren’t fixed to the seabed — they… float?'],
    facts: (m, F) => [
      ['這裡的海有 ' + F.d[0] + ' 到 ' + F.d[1] + ' 公尺深，想把柱子插進海底，太深了。', 'The sea here is ' + F.d[0] + '–' + F.d[1] + ' m deep — too deep to stand a tower on the seabed.'],
      ['工程師把風車裝在一根長長的浮筒上，底部很重，像不倒翁一樣站得穩，再用纜繩和錨拉住。', 'Engineers put each turbine on a long floating column, heavy at the bottom so it stays upright like a roly-poly toy, held in place by cables and anchors.'],
      [m.year + ' 年，' + (m.farm / m.mw) + ' 部 ' + fmtKW(m.mw) + ' 的風機在這裡開始發電，是世界第一座商業運轉的浮動式風場。', 'In ' + m.year + ', ' + (m.farm / m.mw) + ' turbines of ' + fmtKW(m.mw) + ' started generating here — the world’s first commercial floating wind farm.']],
    quiz: { q: ['浮動式風車靠什麼留在原地？', 'What keeps a floating turbine in place?'],
      o: [[['把長長的樁打進海底', 'Long piles driven into the seabed'], ['這裡的海太深，一般海上風車的樁打不到這麼深。再試一次！', 'The sea is too deep here for the usual offshore piles. Try again!']],
        [['用纜繩和錨拉住', 'Cables and anchors']],
        [['靠船一直推著它', 'A boat pushing it all the time'], ['船要一直開，太耗油了，風浪大的時候也推不住。再想想！', 'A boat would burn too much fuel and couldn’t hold it in big waves. Think again!']]],
      a: 1, ok: ['浮筒底部很重讓它站得穩，纜繩和錨讓它不會漂走。', 'The heavy bottom keeps it upright, and cables and anchors stop it drifting away.'] } },
  { n: 7, ms: 'Formosa 1', photo: ['farms', 'TWN|Formosa 1 Phase 1'], scene: 'sea', count: 2,
    place: ['台灣 苗栗外海', 'Off Miaoli, Taiwan'], title: ['台灣第一座海上風場', 'Taiwan’s first offshore wind farm'],
    stamp: ['台灣第一座\n海上風場', 'Taiwan’s first\nat sea'],
    tease: ['回到台灣！看看台灣的第一座海上風場。', 'Back to Taiwan! Let’s see Taiwan’s first offshore wind farm.'],
    facts: (m, F, X) => [
      ['2017 年，苗栗外海立起台灣第一批海上風車：2 部 4 MW 的示範機。', 'In 2017 Taiwan’s first offshore turbines went up off Miaoli: two 4 MW demonstrators.'],
      [m.year + ' 年再加 20 部 ' + fmtKW(m.mw) + '，成為台灣第一座商業離岸風場。', 'In ' + m.year + ' twenty ' + fmtKW(m.mw) + ' turbines were added, making it Taiwan’s first commercial offshore wind farm.'],
      X.twOffRank ? [X.Y1 + ' 年底，台灣的海上風電排全世界第 ' + X.twOffRank + ' 名。', 'By the end of ' + X.Y1 + ', Taiwan ranked No. ' + X.twOffRank + ' in the world for offshore wind.'] : null].filter(Boolean),
    quiz: { q: ['台灣的海上風車主要蓋在哪裡？', 'Where are Taiwan’s offshore turbines mostly built?'],
      o: [[['台灣海峽', 'The Taiwan Strait']],
        [['日月潭', 'Sun Moon Lake'], ['日月潭是湖，不是海喔！', 'Sun Moon Lake is a lake, not the sea!']],
        [['玉山上', 'On Yushan'], ['玉山是高山，海上風車要蓋在海上喔。', 'Yushan is a mountain — offshore turbines stand in the sea.']]],
      a: 0, ok: ['台灣的海上風場都在西邊的台灣海峽。', 'Taiwan’s offshore wind farms are all in the Taiwan Strait to the west.'] } },
  { n: 8, ms: 'Dongfang 26 MW', photo: null, scene: 'giant',
    place: ['中國 福建外海', 'Off Fujian, China'], title: ['史上最大的風車', 'The biggest turbine yet'],
    stamp: ['史上最大\n的風車', 'Biggest\nturbine yet'],
    tease: ['最後一站，去看看現在最大的風車有多大！', 'Last stop: how big is the biggest turbine today?'],
    facts: (m, F, X) => [
      [m.year + ' 年，中國福建外海裝上一部 ' + fmtKW(m.mw) + ' 的風機，正在測試。', 'In ' + m.year + ' a ' + fmtKW(m.mw) + ' turbine was installed off Fujian, China, for testing.'],
      ['它的葉輪直徑 ' + m.rotor + ' 公尺，比台北 101 的一半（254 公尺）還大。', 'Its rotor is ' + m.rotor + ' m across — more than half the height of Taipei 101 (254 m).'],
      ['跟 1888 年布拉許的 ' + fmtKW(X.m1.mw) + ' 風車比，它的功率是兩千多倍。', 'Compared with Brush’s ' + fmtKW(X.m1.mw) + ' turbine of 1888, it has over 2,000 times the power.']],
    quiz: { q: ['26 MW 等於多少 kW？', 'How many kW is 26 MW?'],
      o: [[['26 kW', '26 kW'], ['1 MW 是 1,000 kW 喔。', '1 MW is 1,000 kW.']],
        [['2,600 kW', '2,600 kW'], ['差一點！1 MW＝1,000 kW。', 'Close! 1 MW = 1,000 kW.']],
        [['26,000 kW', '26,000 kW']]],
      a: 2, ok: ['26 MW＝26,000 kW，是布拉許風車的兩千多倍。', '26 MW = 26,000 kW — over 2,000 times Brush’s turbine.'] } }
];
const T = (p) => p ? L(p[0], p[1]) : '';

/* ---------------- 資料 · data ---------------- */
let D = null, PH = null, FD = null, X = {}, ready = null;
function loadData() {
  if (ready) return ready;
  ready = Promise.all([
    WW.globalData(),
    WW.getJSON(WW.DATA.photos).catch(() => null),
    WW.getJSON(WW.DATA.foundations).catch(() => null)
  ]).then(([d, ph, fd]) => {
    D = d; PH = ph; FD = fd;
    STOPS.forEach(s => { s.m = D.milestones.find(m => m.name.startsWith(s.ms)); });
    if (STOPS.some(s => !s.m)) throw new Error('kids: milestone missing');
    X.Y0 = D.Y0; X.Y1 = D.Y1; X.m1 = STOPS[0].m;
    const yi = D.years.length - 1, off = D.countries.map(c => ({ iso: c.iso, v: c.off[yi] || 0 })).sort((a, b) => b.v - a.v);
    const r = off.findIndex(c => c.iso === 'TWN'); X.twOffRank = r >= 0 && off[r].v > 0 ? r + 1 : 0;
    X.maxGW = Math.max(...D.countries.map(c => Math.max(...c.on.map((v, i) => (v || 0) + (c.off[i] || 0))))) / 1000;
  });
  return ready;
}
const capGW = (c, yi) => ((c.on[yi] || 0) + (c.off[yi] || 0)) / 1000;
const fmtGW = gw => gw >= 100 ? WW.int(gw) + ' GW' : gw >= 10 ? WW.num(gw, 0) + ' GW' : gw >= 1 ? WW.num(gw, 1) + ' GW' : WW.int(gw * 1000) + ' MW';
const cname = c => c ? (WW.lang === 'en' ? c.name : c.zh) : '';

/* ---------------- 版面骨架 · shell ---------------- */
let view = 'home', stopN = 0, year = null;
page.innerHTML = '<div class="kbar" id="kbar" hidden></div><div class="kview" id="kview"><div class="kload">' + L('載入中…', 'Loading…') + '</div></div>';
const bar = $('kbar'), host = $('kview');

function paintBar() {
  bar.hidden = view === 'home';
  if (bar.hidden) return;
  const homeA = '<a class="kb-home" href="#/kids">' + sprite('wave', 34) + '<span>' + L('跟著風去旅行', 'Travel with the Wind') + '</span></a>';
  if (view === 'class') {                                            // 全班一起玩：沒有護照與站點進度 · no personal progress in class mode
    bar.innerHTML = '<div class="kbin">' + homeA + '<span class="kcl-t">' + ico('board') + L('全班一起玩', 'Play as a class') + (CL.n >= 1 && CL.n <= 8 ? L(' · 第 ' + CL.n + ' 站 / 8', ' · stop ' + CL.n + ' / 8') : '') + '</span>' +
      '<div class="kb-r">' + spkBtn('kpill') + fsBtn('kpill') + '<a class="kpill" href="#/kids">' + L('結束', 'End') + '</a></div></div>';
    paintSay(); paintFS();
    return;
  }
  const dots = STOPS.map(s => '<a class="kdot' + (stamped(s.n) ? ' done' : '') + (view === 'stop' && s.n === stopN ? ' cur' : '') + '" href="#/kids/stop?n=' + s.n + '" aria-label="' +
    esc(L('第 ' + s.n + ' 站：' + T(s.place), 'Stop ' + s.n + ': ' + T(s.place)) + (stamped(s.n) ? L('（已蓋章）', ' (stamped)') : '')) + '"></a>').join('');
  bar.innerHTML = '<div class="kbin">' + homeA +
    '<nav class="kdots" aria-label="' + esc(L('八站', 'Eight stops')) + '"><span class="kdl">' + (view === 'stop' ? L('第 ' + stopN + ' 站 / 8', 'Stop ' + stopN + ' / 8') : L('冒險路線', 'Route')) + '</span>' + dots + '</nav>' +
    '<div class="kb-r">' + spkBtn('kpill') + '<a class="kpill' + (view === 'globe' ? ' on' : '') + '" href="#/kids/globe">' + ico('globe') + '<span>' + L('地球', 'Globe') + '</span></a>' +
    '<a class="kpill' + (view === 'passport' || view === 'cert' ? ' on' : '') + '" href="#/kids/passport">' + ico('passport') + '<span>' + L('護照 ', 'Passport ') + P.s.length + '/8</span></a></div></div>';
  paintSay();
}

/* ---------------- 開場 · welcome ---------------- */
function viewHome() {
  const nx = nextStop();
  const resume = P.s.length ? '<a class="kresume" href="' + (nx ? '#/kids/stop?n=' + nx : '#/kids/passport') + '">' + ico('passport') +
    (nx ? L('已經蓋了 ' + P.s.length + ' 個章 · 繼續第 ' + nx + ' 站', P.s.length + (P.s.length === 1 ? ' stamp' : ' stamps') + ' so far · continue with stop ' + nx) : L('8 個章都蓋滿了！看我的護照', 'All 8 stamps collected! See my passport')) + '</a>' : '';
  host.innerHTML = '<div class="kwrap khome">' +
    '<div class="kh-main"><div class="kh-text">' +
      '<span class="kchip">' + L('8 站環遊世界 · 邊玩邊認識風力發電', '8 stops around the world · learn about wind power as you play') + '</span>' +
      '<h1>' + L('跟著風去旅行', 'Travel with the Wind') + '</h1>' +
      '<p class="klead" data-say>' + L('從 1888 年第一部會自己運轉發電的風車，到葉輪比台北 101 一半還大的海上巨無霸，一站一站看懂風怎麼變成電。',
        'From the first turbine that ran by itself to make power in 1888 to an offshore giant whose rotor is bigger than half of Taipei 101, see stop by stop how wind becomes electricity.') + '</p>' +
      '<div class="kbtns"><a class="kbtn primary" href="#/kids/globe">' + L('開始冒險', 'Start the adventure') + ico('next', 24) + '</a>' +
      '<a class="kbtn" href="#/kids/taiwan">' + L('台灣此刻的風', 'Taiwan’s wind right now') + '</a></div>' + resume +
    '</div><div class="kh-guide"><div class="kbubble" data-say>' + L('嗨！我是<b>小風</b>，風去哪裡我就去哪裡。今天帶你去 8 個地方看風車，準備好了嗎？',
      'Hi! I’m <b>Breezy</b>. I go wherever the wind goes. Today I’ll take you to see turbines in 8 places — ready?') + '</div>' + sprite('wave', 260, L('帶路角色小風在揮手', 'Breezy, your guide, waving')) + spkBtn('kpill') + '</div></div>' +
    '<div class="kfeat">' +
      '<div><span class="kfi t">' + ico('globe', 30) + '</span><b>' + L('轉地球找風車', 'Spin the globe') + '</b><span>' + L('拖拉地球，用時光機看 1980 年到現在，世界各地的風車一年年變多。', 'Drag the globe and use the time machine to watch wind power grow around the world since 1980.') + '</span></div>' +
      '<div><span class="kfi c">' + ico('stamp', 30) + '</span><b>' + L('答題蓋章', 'Answer and collect stamps') + '</b><span>' + L('每站一題小問題，答對就在風車護照蓋一個章。', 'Each stop has a question; answer it to get a stamp in your wind passport.') + '</span></div>' +
      '<div><span class="kfi s">' + ico('house', 30) + '</span><b>' + L('台灣此刻', 'Taiwan right now') + '</b><span>' + L('看看台灣的風車，現在正在幫多少個家庭供電。', 'See how many homes Taiwan’s turbines are powering right now.') + '</span></div>' +
    '</div><a class="kteach" href="#/kids/class"><span class="kfi t">' + ico('board', 30) + '</span><span><b>' + L('給老師：全班一起玩', 'For teachers: play as a class') + '</b>' +
      '<span>' + L('投影到大螢幕，一站一站看、全班舉手作答，可以倒數計時和全螢幕；這個模式不蓋章，也不記錄任何人的進度。',
        'Project it on the big screen: stop by stop, the class answers by show of hands, with a countdown and full screen; this mode gives no stamps and keeps no one’s progress.') + '</span></span>' + ico('next', 26) + '</a>' +
    '<p class="knote">' + L('數字都來自風電風情網站的資料；進度只記在這台裝置的瀏覽器裡，不用註冊。', 'All figures come from Wind Watch’s data; your progress stays in this browser, with no sign-up.') + '</p></div>';
  paintSay();
}

/* ---------------- 地球（three.js） · the globe ---------------- */
const G = {};
const TINT = ['#F7E8BC', '#D6F0DC', '#A6DDBE', '#6DC4A0', '#33A383', '#0F7A66'];     // 沒有／<1／1–10／10–50／50–200／≥200 GW（單一色相由淺到深）
const tintOf = gw => gw <= 0 ? TINT[0] : gw < 1 ? TINT[1] : gw < 10 ? TINT[2] : gw < 50 ? TINT[3] : gw < 200 ? TINT[4] : TINT[5];
function ll2v(lat, lon, r) {
  const phi = (lon + 180) * Math.PI / 180, th = lat * Math.PI / 180;
  return new THREE.Vector3(-Math.cos(phi) * Math.cos(th) * r, Math.sin(th) * r, Math.sin(phi) * Math.cos(th) * r);
}
const OFFS = { 2: [26, 10], 4: [6, -30], 6: [-28, -14], 7: [22, 14], 8: [-22, -14] };    // 靠得很近的站：圖釘錯開一點，用細線連回實際位置
function initGlobe() {
  if (G.init) return G.init;
  G.init = WW.getJSON(WW.DATA.borders).then(B => {
    if (!window.THREE) throw new Error('three.js missing');
    const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024;
    const g = cv.getContext('2d'), Xp = lon => (lon + 180) / 360 * 2048, Yp = lat => (90 - lat) / 180 * 1024;
    const paths = {};
    B.borders.forEach((r, i) => {
      const iso = B.ringIso[i], p = paths[iso] || (paths[iso] = new Path2D());
      for (let k = 0; k < r.length; k += 2) { const x = Xp(r[k]), y = Yp(r[k + 1]); k ? p.lineTo(x, y) : p.moveTo(x, y); }
      p.closePath();
    });
    let rnd;
    try { rnd = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { G.fail = true; return; }
    rnd.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = Math.min(8, rnd.capabilities.getMaxAnisotropy());
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshLambertMaterial({ map: tex })));
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 48), new THREE.MeshBasicMaterial({ color: 0x12324a, side: THREE.BackSide })));
    scene.add(new THREE.AmbientLight(0xffffff, 0.86));
    const sun = new THREE.DirectionalLight(0xffffff, 0.32); sun.position.set(-2, 2, 3); cam.add(sun); scene.add(cam);
    const ctl = new THREE.OrbitControls(cam, rnd.domElement);
    Object.assign(ctl, { enablePan: false, enableDamping: true, dampingFactor: 0.08, rotateSpeed: 0.55, zoomSpeed: 0.6, minDistance: 2.1, maxDistance: 6, autoRotate: true, autoRotateSpeed: 0.45 });
    ctl.addEventListener('start', () => { ctl.autoRotate = false; G.fly = null; });
    const wrap = document.createElement('div'); wrap.className = 'kglobe';
    rnd.domElement.setAttribute('aria-hidden', 'true');
    const pinsEl = document.createElement('div'); pinsEl.className = 'kpins';
    wrap.append(rnd.domElement, pinsEl);
    const pins = STOPS.map(s => {
      const a = document.createElement('a'), o = OFFS[s.n] || [0, 0], len = Math.hypot(o[0], o[1]), ang = Math.atan2(o[1], o[0]) * 180 / Math.PI;
      a.className = 'kpin'; a.href = '#/kids/stop?n=' + s.n;
      a.innerHTML = (len ? '<i class="kstem" style="width:' + len.toFixed(1) + 'px;transform:rotate(' + ang.toFixed(1) + 'deg)"></i>' : '') + '<i class="kdotp"></i>' +
        '<b style="transform:translate(calc(-50% + ' + o[0] + 'px),calc(-50% + ' + o[1] + 'px))">' + s.n + '</b><span class="ktag" style="margin-left:' + o[0] + 'px;margin-top:' + o[1] + 'px"></span>';
      pinsEl.appendChild(a);
      return { s, el: a, p: ll2v(s.m.lat, s.m.lon, 1) };
    });
    const tw = document.createElement('span'); tw.className = 'ktw'; pinsEl.appendChild(tw);
    Object.assign(G, { cv, g, paths, tex, rnd, scene, cam, ctl, wrap, pins, tw, twP: ll2v(23.7, 121, 1) });
    G.resize = () => { const w = wrap.clientWidth || 300; rnd.setSize(w, w, false); rnd.domElement.style.width = rnd.domElement.style.height = w + 'px'; cam.aspect = 1; cam.updateProjectionMatrix(); };
    if ('ResizeObserver' in window) new ResizeObserver(() => G.resize()).observe(wrap);
    lookAt(23.7, 121, true);
  }).catch(e => { console.error(e); G.fail = true; });
  return G.init;
}
function paintTex(y) {
  const yi = D.years.indexOf(y), g = G.g;
  g.fillStyle = '#7CC6E8'; g.fillRect(0, 0, 2048, 1024);
  g.strokeStyle = 'rgba(255,255,255,.32)'; g.lineWidth = 2;
  for (let lon = -180; lon <= 180; lon += 30) { const x = (lon + 180) / 360 * 2048; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { const yy = (90 - lat) / 180 * 1024; g.beginPath(); g.moveTo(0, yy); g.lineTo(2048, yy); g.stroke(); }
  for (const iso in G.paths) { const c = D._idx[iso]; g.fillStyle = tintOf(c ? capGW(c, yi) : 0); g.fill(G.paths[iso]); }
  g.strokeStyle = '#C9AE70'; g.lineWidth = 1.4; for (const iso in G.paths) g.stroke(G.paths[iso]);
  if (G.paths.TWN) { g.strokeStyle = '#E8603C'; g.lineWidth = 5; g.stroke(G.paths.TWN); }
  G.tex.needsUpdate = true;
}
function lookAt(lat, lon, now) {
  const to = ll2v(lat, lon, 1).normalize();
  if (now) { G.cam.position.copy(to.clone().multiplyScalar(3.9)); G.cam.lookAt(0, 0, 0); return; }
  G.fly = { from: G.cam.position.clone(), to, t0: performance.now() };
  G.ctl.autoRotate = false;
}
const vtmp = () => new THREE.Vector3();
function tick() {
  if (!G.run) return;
  G.raf = requestAnimationFrame(tick);
  if (G.fly) {
    const k = Math.min(1, (performance.now() - G.fly.t0) / 1200), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const d = G.fly.from.length(), a = G.fly.from.clone().normalize();
    G.cam.position.copy(a.lerp(G.fly.to, e).normalize().multiplyScalar(d));
    if (k >= 1) G.fly = null;
  }
  G.ctl.update();
  const w = G.wrap.clientWidth, cd = G.cam.position.clone().normalize(), v = G.v || (G.v = vtmp());
  const place = (el, p) => {
    const vis = p.dot(cd) > 0.12; el.style.display = vis ? '' : 'none'; if (!vis) return;
    v.copy(p).project(G.cam); el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * w).toFixed(1) + 'px)';
  };
  G.pins.forEach(pn => place(pn.el, pn.p));
  place(G.tw, G.twP);
  G.rnd.render(G.scene, G.cam);
}
function startGlobe() { if (G.run || !G.rnd) return; G.run = true; G.resize(); tick(); }
function stopGlobe() { G.run = false; if (G.raf) cancelAnimationFrame(G.raf); }

/* 時光機與「誰的風車最多」 · time machine and the skyline */
function skyline(yi) {
  const rows = D.countries.map(c => ({ c, gw: capGW(c, yi) })).sort((a, b) => b.gw - a.gw);
  const top = rows.slice(0, 5), twR = rows.findIndex(r => r.c.iso === 'TWN'), tw = rows[twR];
  const col = (r, cls, rank) => '<div class="ksk' + cls + '"><div class="ksk-t">' + ROTOR('ksk-r', '#fff', cls ? '#B5401E' : NAVY, cls ? '#FF7A59' : '#FFC845') +
    '<i style="height:' + Math.max(1, r.gw / X.maxGW * 150).toFixed(1) + 'px"></i></div><b>' + esc(cname(r.c)) + '</b><span>' + (rank ? L('第 ' + rank + ' 名 · ', 'No. ' + rank + ' · ') : '') + fmtGW(r.gw) + '</span></div>';
  return top.map(r => col(r, '', 0)).join('') + (twR >= 5 && tw ? '<div class="ksk gap" aria-hidden="true">⋯</div>' + col(tw, ' tw', twR + 1) : '');
}
function paintYear() {
  const yi = D.years.indexOf(year), wt = D.worldTotal[yi] / 1000;
  if (G.rnd) paintTex(year);
  const el = $('kyr'); if (el) el.textContent = L(year + ' 年 · 全世界 ', year + ' · world ') + fmtGW(wt);
  const sl = $('ksl'); if (sl) sl.value = year;
  const sk = $('ksky'); if (sk) sk.innerHTML = skyline(yi);
}
let playT = null;
function setPlay(on) {
  clearInterval(playT); playT = null;
  const b = $('kplay'); if (b) { b.innerHTML = ico(on ? 'pause' : 'play', 28); b.setAttribute('aria-label', on ? L('暫停時光機', 'Pause the time machine') : L('播放時光機', 'Play the time machine')); }
  if (!on) return;
  if (year >= X.Y1) year = X.Y0;
  playT = setInterval(() => { year = Math.min(X.Y1, year + 1); paintYear(); if (year >= X.Y1) setPlay(false); }, 260);
}

function viewGlobe() {
  if (year == null) year = X.Y1;
  const nx = nextStop(), ns = nx ? STOPS[nx - 1] : null;
  const legend = [[1, '<1'], [2, '1–10'], [3, '10–50'], [4, '50–200'], [5, '≥200']].map(([i, t]) => '<span><i style="background:' + TINT[i] + '"></i>' + t + '</span>').join('');
  host.innerHTML = '<div class="kwrap kglobev">' +
    '<div class="kg-left"><div class="kg-box" id="kgbox">' + (G.fail ? '<div class="kgfail">' + L('這台裝置無法顯示 3D 地球，可以從右邊的路線直接進入每一站。', 'This device can’t show the 3D globe — use the route list to open each stop.') + '</div>' : '') + '</div>' +
      '<div class="kg-hint">' + L('拖拉轉地球 · 滾輪或兩指縮放 · 點數字進入那一站', 'Drag to spin · scroll or pinch to zoom · tap a number to open that stop') + '</div>' +
      '<div class="kleg"><b>' + L('國家顏色＝累積裝置容量（GW）', 'Country colour = installed capacity (GW)') + '</b>' + legend + '</div></div>' +
    '<div class="kg-right">' +
      '<div class="kcard kguide">' + sprite(ns ? 'wow' : 'happy', 120) + '<div><p data-say>' + (ns ? L('下一站：第 ' + nx + ' 站，' + T(ns.place) + '！' + T(ns.tease), 'Next: stop ' + nx + ', ' + T(ns.place) + '! ' + T(ns.tease))
        : L('8 個章都蓋滿了！你已經是風車探險家了。', 'All 8 stamps collected — you’re a wind explorer now!')) + '</p>' +
        '<a class="kbtn primary sm" href="' + (ns ? '#/kids/stop?n=' + nx : '#/kids/passport') + '">' + (ns ? L('出發去第 ' + nx + ' 站', 'Go to stop ' + nx) : L('看我的護照', 'See my passport')) + ico('next') + '</a></div></div>' +
      '<div class="kcard"><div class="kch"><b>' + L('冒險路線', 'The route') + '</b><span>' + L('照年份排，從 1888 到 ', 'In time order, 1888 to ') + STOPS[7].m.year + '</span></div><ol class="kroute">' +
        STOPS.map(s => '<li><a href="#/kids/stop?n=' + s.n + '" data-fly="' + s.n + '"><b class="' + (stamped(s.n) ? 'done' : s.n === nx ? 'nx' : '') + '">' + s.n + '</b><span class="ky">' + s.m.year + '</span><span class="kpl">' + esc(T(s.place)) + '</span>' +
          (stamped(s.n) ? '<span class="kok">' + ico('stamp', 20) + '</span>' : '') + '</a></li>').join('') + '</ol></div>' +
    '</div>' +
    '<div class="ktime"><button type="button" class="kplay" id="kplay"></button><div class="kt-l"><b>' + L('時光機', 'Time machine') + '</b><span>' + L('看風車一年一年變多', 'Watch wind power grow year by year') + '</span></div>' +
      '<div class="kt-s"><input type="range" id="ksl" min="' + X.Y0 + '" max="' + X.Y1 + '" step="1" value="' + year + '" aria-label="' + esc(L('年份', 'Year')) + '"><div class="kt-ticks"><span>' + X.Y0 + '</span><span>2000</span><span>' + X.Y1 + '</span></div></div>' +
      '<div class="kt-r"><b id="kyr"></b><span>' + L(X.Y0 + ' 年只有 ', 'In ' + X.Y0 + ' only ') + fmtGW(D.worldTotal[0] / 1000) + '</span></div></div>' +
    '<div class="kcard ksky-c"><div class="kch"><b>' + L('誰的風車最多？', 'Who has the most wind power?') + '</b><span>' + L('年底累積裝置容量 · 柱子高度照比例', 'Installed capacity at year end · pole heights to scale') + '</span></div>' +
      '<div class="ksky" id="ksky"></div><p class="ksmall">' + L('1 GW＝10 億瓦。台灣的柱子很矮，但海上風電排全世界第 ' + X.twOffRank + ' 名（' + X.Y1 + ' 年底）。',
        '1 GW = a billion watts. Taiwan’s pole is short, but it ranks No. ' + X.twOffRank + ' in the world for offshore wind (end of ' + X.Y1 + ').') + '</p></div>' +
    '</div>';
  setPlay(false);
  $('kplay').onclick = () => setPlay(!playT);
  $('ksl').oninput = e => { setPlay(false); year = +e.target.value; paintYear(); };
  host.querySelectorAll('[data-fly]').forEach(a => {
    const s = STOPS[+a.dataset.fly - 1];
    a.addEventListener('mouseenter', () => { if (G.rnd) lookAt(s.m.lat, s.m.lon); });
    a.addEventListener('focus', () => { if (G.rnd) lookAt(s.m.lat, s.m.lon); });
  });
  if (G.fail || !G.wrap) { paintYear(); return; }
  $('kgbox').appendChild(G.wrap);
  G.pins.forEach(pn => {
    const s = pn.s, st = stamped(s.n) ? 'done' : s.n === nx ? 'nx' : '';
    pn.el.className = 'kpin ' + st;
    pn.el.setAttribute('aria-label', L('第 ' + s.n + ' 站：' + T(s.place) + '，' + s.m.year + ' 年', 'Stop ' + s.n + ': ' + T(s.place) + ', ' + s.m.year) + (stamped(s.n) ? L('（已蓋章）', ' (stamped)') : ''));
    pn.el.querySelector('.ktag').textContent = s.n === nx ? L('下一站：', 'Next: ') + T(s.place) : '';
  });
  G.tw.textContent = L('台灣', 'Taiwan');
  paintYear();
  if (ns) lookAt(ns.m.lat, ns.m.lon);
  startGlobe();
}

/* ---------------- 一站 · a stop ---------------- */
function photoHTML(s) {
  const ph = s.photo && PH && PH[s.photo[0]] && PH[s.photo[0]][s.photo[1]];
  if (ph) {
    const by = /unknown author/i.test(ph.by || '') ? L('作者不詳', 'Unknown author') : ph.by;
    return '<figure class="kphoto"><img src="' + esc(ph.src) + '" alt="' + esc(T(s.title) + ' · ' + T(s.place)) + '">' +
      '<figcaption><a href="' + esc(ph.page) + '" target="_blank" rel="noopener">' + esc(L('攝影 ', 'Photo: ') + (by || '') + ' · ' + (ph.lic || '')) + '</a> · Wikimedia Commons</figcaption></figure>';
  }
  return '<figure class="kphoto ill">' + scene(s) + '<figcaption>' + L('插畫（這裡沒有可用的照片）', 'Illustration (no usable photo for this stop)') + '</figcaption></figure>';
}
function scene(s) {
  const tb = (x, y, h, sc) => '<g transform="translate(' + x + ' ' + y + ')"><path d="M-2 0 L-1 ' + (-h) + ' L1 ' + (-h) + ' L2 0 Z" fill="#fff" stroke="' + NAVY + '" stroke-width="2"/>' +
    '<g transform="translate(0 ' + (-h) + ') scale(' + sc + ')">' + [0, 120, 240].map(a => '<path d="M0 0 C-2 -8 -1.5 -18 0 -22 C1.5 -18 2 -8 0 0 Z" fill="#fff" stroke="' + NAVY + '" stroke-width="1.6" transform="rotate(' + a + ')"/>').join('') +
    '<circle r="3" fill="#FFC845" stroke="' + NAVY + '" stroke-width="1.5"/></g></g>';
  let t = '';
  if (s.scene === 'giant') t = tb(300, 250, 120, 4.6);                 // 不畫其他東西當比例：等比例的比較在「比一比」
  else {
    const n = s.count || 9;
    for (let i = 0; i < n; i++) t += tb(120 + (i % 6) * 70 + (i >= 6 ? 35 : 0), 236 + (i >= 6 ? 26 : 0), 70, 1.6);
  }
  return '<svg viewBox="0 0 600 340" role="img" aria-label="' + esc(T(s.title)) + '"><rect width="600" height="340" fill="#D9EFFA"/><circle cx="520" cy="70" r="34" fill="#FFE08A"/>' +
    '<rect y="250" width="600" height="90" fill="' + (s.scene === 'giant' || s.scene === 'sea' ? '#7CC6E8' : '#CFE6B8') + '"/>' + t + '</svg>';
}
function compareHTML(s) {
  if (s.n === 6 && FD && FD.farms && FD.farms[s.fd] && FD.farms[s.fd].d) {
    const F = FD.farms[s.fd], k = 180 / 508, sea = 182, tip = F.h + F.r / 2, hub = sea - F.h * k, rr = F.r / 2 * k, d0 = sea + F.d[0] * k, d1 = sea + F.d[1] * k;
    const blades = [0, 120, 240].map(a => '<path d="M420 ' + hub.toFixed(1) + ' l-2.5 ' + (-rr * 0.55).toFixed(1) + ' l2.5 ' + (-rr * 0.45).toFixed(1) + ' l2.5 ' + (rr * 0.45).toFixed(1) + ' z" transform="rotate(' + a + ' 420 ' + hub.toFixed(1) + ')"/>').join('');
    return '<div class="kcard kcmp"><b>' + L('比一比：有多高、海有多深？', 'Compare: how tall, how deep?') + '</b><svg viewBox="0 0 560 236" role="img" aria-label="' +
      esc(L('台北 101 高 508 公尺；Hywind 風機最高點約 ' + Math.round(tip) + ' 公尺；海深 ' + F.d[0] + '–' + F.d[1] + ' 公尺，同一比例', 'Taipei 101 is 508 m tall; the Hywind turbine tip is about ' + Math.round(tip) + ' m; the sea is ' + F.d[0] + '–' + F.d[1] + ' m deep; same scale')) + '">' +
      '<rect x="0" y="' + sea + '" width="230" height="54" fill="#E9E1C8"/><rect x="230" y="' + sea + '" width="330" height="54" fill="#BFE6F7"/>' +
      '<path d="M230 ' + d1.toFixed(1) + ' C 320 ' + d0.toFixed(1) + ', 440 ' + d1.toFixed(1) + ', 560 ' + d0.toFixed(1) + ' L 560 236 L 230 236 Z" fill="#D9C99A"/>' +
      '<path d="M0 ' + sea + ' L560 ' + sea + '" stroke="' + NAVY + '" stroke-width="3"/>' +
      '<path d="M92 ' + sea + ' L96 34 L124 34 L128 ' + sea + ' Z" fill="#9DB7CC" stroke="' + NAVY + '" stroke-width="2"/><path d="M110 34 L110 2" stroke="' + NAVY + '" stroke-width="3"/>' +
      '<text x="140" y="18" font-size="15" font-weight="700" fill="' + NAVY + '">' + L('台北 101', 'Taipei 101') + '</text><text x="140" y="37" font-size="15" fill="' + NAVY + '">508 m</text>' +
      '<path d="M420 ' + sea + ' L420 ' + hub.toFixed(1) + '" stroke="' + NAVY + '" stroke-width="4"/><g fill="#fff" stroke="' + NAVY + '" stroke-width="1.6">' + blades + '</g>' +
      '<circle cx="420" cy="' + hub.toFixed(1) + '" r="3" fill="#FFC845" stroke="' + NAVY + '" stroke-width="1.5"/>' +
      '<rect x="414" y="' + sea + '" width="12" height="26" rx="5" fill="#FFC845" stroke="' + NAVY + '" stroke-width="2" stroke-dasharray="4 3"/>' +
      '<text x="442" y="' + (hub - 28).toFixed(0) + '" font-size="15" font-weight="700" fill="' + NAVY + '">' + L('風機最高點', 'Turbine tip') + '</text><text x="442" y="' + (hub - 10).toFixed(0) + '" font-size="15" fill="' + NAVY + '">' + L('約 ', 'about ') + Math.round(tip) + ' m</text>' +
      '<text x="250" y="' + (sea + 22) + '" font-size="14" fill="' + NAVY + '">' + L('海深 ', 'Sea depth ') + F.d[0] + '–' + F.d[1] + ' m</text>' +
      '<text x="434" y="' + (sea + 22) + '" font-size="12" fill="' + NAVY + '">' + L('浮筒（示意）', 'float (sketch)') + '</text></svg>' +
      '<p class="ksmall">' + L('陸地、風機和海深用同一個比例畫。最高點＝輪轂高 ' + F.h + ' m＋葉片長 ' + (F.r / 2) + ' m（葉輪直徑 ' + F.r + ' m）。浮筒在水下的長度沒有畫準。',
        'Land, turbine and sea are drawn to one scale. Tip = hub height ' + F.h + ' m + blade length ' + (F.r / 2) + ' m (rotor ' + F.r + ' m). The underwater float is not to scale.') + '</p></div>';
  }
  if (s.n === 8) {
    const k = 200 / 508, m = s.m, m1 = X.m1, R = m.rotor / 2 * k, r1 = Math.max(1.5, m1.rotor / 2 * k), base = 216;
    const circ = (cx, r) => '<circle cx="' + cx + '" cy="' + (base - r).toFixed(1) + '" r="' + r.toFixed(1) + '" fill="rgba(124,198,232,.25)" stroke="' + NAVY + '" stroke-width="2" stroke-dasharray="5 4"/>';
    return '<div class="kcard kcmp"><b>' + L('比一比：葉輪畫成圓有多大？', 'Compare: how big is the rotor circle?') + '</b><svg viewBox="0 0 560 236" role="img" aria-label="' +
      esc(L('同一比例：台北 101 高 508 公尺、這部風機葉輪直徑 ' + m.rotor + ' 公尺、1888 年布拉許風車葉輪直徑 ' + m1.rotor + ' 公尺', 'Same scale: Taipei 101 508 m tall, this rotor ' + m.rotor + ' m across, Brush’s 1888 rotor ' + m1.rotor + ' m across')) + '">' +
      '<path d="M0 ' + base + ' L560 ' + base + '" stroke="' + NAVY + '" stroke-width="3"/>' +
      '<path d="M70 ' + base + ' L75 ' + (base - 200 * 0.86).toFixed(0) + ' L101 ' + (base - 200 * 0.86).toFixed(0) + ' L106 ' + base + ' Z" fill="#9DB7CC" stroke="' + NAVY + '" stroke-width="2"/><path d="M88 ' + (base - 172) + ' L88 ' + (base - 200) + '" stroke="' + NAVY + '" stroke-width="3"/>' +
      '<text x="116" y="' + (base - 186) + '" font-size="15" font-weight="700" fill="' + NAVY + '">' + L('台北 101', 'Taipei 101') + '</text><text x="116" y="' + (base - 167) + '" font-size="15" fill="' + NAVY + '">508 m</text>' +
      circ(330, R) + '<text x="' + (330 - 60) + '" y="' + (base - 2 * R - 10).toFixed(0) + '" font-size="15" font-weight="700" fill="' + NAVY + '">' + m.year + ' · ' + m.rotor + ' m</text>' +
      circ(500, r1) + '<text x="462" y="' + (base - 24) + '" font-size="13" font-weight="700" fill="' + NAVY + '">1888 · ' + m1.rotor + ' m</text></svg>' +
      '<p class="ksmall">' + L('三個都用同一個比例畫：右邊那個小點，就是 1888 年布拉許風車的葉輪。', 'All three to one scale — the tiny dot on the right is Brush’s 1888 rotor.') + '</p></div>';
  }
  return '';
}
let pick = null;
function viewStop(n) {
  const s = STOPS[n - 1];
  if (!s) { location.hash = '#/kids/globe'; return; }
  host.innerHTML = '<div class="kwrap kstop">' +
    '<div class="ks-media">' + photoHTML(s) + compareHTML(s) + '</div>' +
    '<div class="ks-body"><span class="kchip">' + L('第 ' + s.n + ' 站 · ' + s.m.year + ' 年 · ' + T(s.place), 'Stop ' + s.n + ' · ' + s.m.year + ' · ' + T(s.place)) + '</span>' +
      '<h1 data-say>' + esc(T(s.title)) + '</h1>' + factsHTML(s) +
      '<div class="kcard kquiz" id="kquiz"></div>' +
      '<div class="ks-nav">' + (n > 1 ? '<a href="#/kids/stop?n=' + (n - 1) + '">' + ico('prev') + L('上一站', 'Previous') + '</a>' : '<a href="#/kids/globe">' + ico('globe') + L('回地球', 'Globe') + '</a>') +
        '<span id="knext"></span></div></div></div>';
  pick = null;
  paintQuiz(s);
  photoFallback(s);
}
function factsHTML(s) {
  const F = FD && FD.farms && s.fd ? FD.farms[s.fd] : null;
  return '<ol class="kfacts">' + s.facts(s.m, F || { d: ['?', '?'] }, X).map((f, i) => '<li><b>' + (i + 1) + '</b><span data-say>' + esc(T(f)) + '</span></li>').join('') + '</ol>';
}
function photoFallback(s) {                                          // 照片載不到（離線等）：改畫插畫
  const img = host.querySelector('.kphoto img');
  if (img) img.addEventListener('error', () => { const f = img.closest('figure'); if (f) { f.className = 'kphoto ill'; f.innerHTML = scene(s) + '<figcaption>' + L('插畫（照片暫時載不到）', 'Illustration (the photo could not be loaded)') + '</figcaption>'; } });
}
const optSay = (q, i) => esc('ABC'[i] + L('，', ': ') + T(q.o[i][0]));
function paintQuiz(s) {
  const q = s.quiz, done = stamped(s.n), right = pick === q.a, el = $('kquiz'); if (!el) return;
  el.innerHTML = '<b class="kq" data-say>' + L('小問題：', 'Quick question: ') + esc(T(q.q)) + '</b><div class="kopts">' +
    q.o.map((o, i) => '<button type="button" data-o="' + i + '" data-say="' + optSay(q, i) + '" class="kopt' + (pick === i ? (i === q.a ? ' right' : ' wrong') : '') + (done && i === q.a && pick == null ? ' right' : '') + '"><b>' + 'ABC'[i] + '</b><span>' + esc(T(o[0])) + '</span></button>').join('') + '</div>' +
    (right || (done && pick == null) ? '<div class="kfb ok" data-say>' + sprite('happy', 64) + '<span><b>' + L('答對了！', 'Correct! ') + '</b>' + esc(T(q.ok)) + (right ? L('第 ' + s.n + ' 站的章蓋好了！', ' Stop ' + s.n + ' is stamped!') : '') + '</span></div>'
      : pick != null ? '<div class="kfb no" data-say>' + esc(T(q.o[pick][1])) + '</div>' : '');
  el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
    pick = +b.dataset.o;
    if (pick === q.a && !stamped(s.n)) { P.s.push(s.n); P.s.sort((a, c) => a - c); if (P.s.length === 8 && !P.done) P.done = today(); save(); paintBar(); }
    paintQuiz(s);
    const f = el.querySelector('[data-o="' + pick + '"]'); if (f) f.focus();
  });
  const nx = $('knext');
  if (nx) nx.innerHTML = stamped(s.n) ? '<a class="kbtn primary sm" href="' + (s.n < 8 ? '#/kids/stop?n=' + (s.n + 1) : '#/kids/passport') + '">' + (s.n < 8 ? L('下一站', 'Next stop') : L('看我的護照', 'See my passport')) + ico('next') + '</a>'
    : '<span class="kwait">' + L('答對就能蓋章，再前往下一站', 'Answer correctly to get the stamp, then move on') + '</span>';
}

/* ---------------- 台灣此刻的風 · Taiwan right now ---------------- */
function viewTaiwan() {
  if (!P.tw) { P.tw = 1; save(); }
  const LV = WW.live;
  if (!LV) { host.innerHTML = '<div class="kwrap"><p>' + L('台灣即時資料載入失敗。', 'Taiwan’s live data could not be loaded.') + '</p></div>'; return; }
  const tt = LV.totals(), total = tt.total, homes = LV.impactVals().homes, ratio = tt.ratio;
  const gen = LV.FARMS.filter(f => (LV.RT[f.id] || 0) >= 0.05).length, nF = LV.FARMS.length;
  const live = LV.isLive(), snap = live && WW.standalone && WW.standalone.usedSnapshot;
  const when = live ? (snap ? L('離線快照 · ', 'Offline snapshot · ') : L('台電資料 ', 'Taipower data ')) + LV.fmtSrc(LV.srcTime()) : L('模擬資料（暫時拿不到台電資料）', 'Simulated (Taipower data unavailable for now)');
  const pts = ((LV.hist() || {}).points || []).filter(p => p && typeof p.total === 'number'), last = pts.length ? new Date(pts[pts.length - 1].t) : null;
  const wk = last ? pts.filter(p => last - new Date(p.t) <= 7 * 864e5) : [], mx = wk.reduce((a, p) => (!a || p.total > a.total ? p : a), null);
  const mood = ratio < 0.05 ? 'sleepy' : ratio < 0.3 ? 'talk' : 'happy';
  const say = mood === 'sleepy' ? L('今天風在休息，我也好想睡……風大的日子，台灣海峽的風車會轉得很起勁！', 'The wind is resting today, and I’m sleepy too… On windy days the turbines in the Taiwan Strait spin hard!')
    : mood === 'talk' ? L('今天有一點風，風車慢慢轉。', 'A little wind today — the turbines turn slowly.') : L('今天風好大！台灣海峽的風車轉得好起勁！', 'It’s windy today! The turbines in the Taiwan Strait are spinning hard!');
  const nH = Math.max(0, Math.round(homes)), shown = Math.min(nH, 40);
  const houses = Array.from({ length: shown }, () => '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 11l8-6 8 6v9H4z" fill="#12A594" stroke="#12324A" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 20v-5h4v5" fill="#fff" stroke="#12324A" stroke-width="1.6"/></svg>').join('');
  const mxD = mx ? new Date(mx.t) : null, mxS = mxD ? (mxD.getMonth() + 1) + '/' + mxD.getDate() + ' ' + String(mxD.getHours()).padStart(2, '0') + ':' + String(mxD.getMinutes()).padStart(2, '0') : '';
  const times = mx && total > 0 ? mx.total / total : 0;
  host.innerHTML = '<div class="kwrap ktwv">' +
    '<div class="kt-head"><h1>' + L('台灣此刻的風', 'Taiwan’s wind right now') + '</h1><span class="kchip">' + esc(when) + '</span></div>' +
    '<div class="kt-grid"><div class="kt-col">' +
      '<div class="kcard kbig" data-say="' + esc(L('全台風力發電機，此刻一共發出 ' + WW.num(total, 1) + ' MW，大約可以同時供應 ' + WW.num(homes, homes < 10 ? 1 : 0) + ' 萬戶家庭用電。',
        'All of Taiwan’s wind turbines are making ' + WW.num(total, 1) + ' MW right now, enough for about ' + WW.int(homes * 10000) + ' homes at once.')) + '"><span class="kl">' + L('全台風力發電機，此刻一共發出', 'All of Taiwan’s wind turbines are making') + '</span><div class="kmw"><b>' + WW.num(total, 1) + '</b> MW</div>' +
        '<span class="kl2">' + L('大約可以同時供應 <b>' + WW.num(homes, homes < 10 ? 1 : 0) + ' 萬戶</b> 家庭用電', 'enough for about <b>' + WW.int(homes * 10000) + ' homes</b> at once') + '</span>' +
        '<div class="khouses" role="img" aria-label="' + esc(L('房子圖示，一個代表一萬戶', 'House icons, each 10,000 homes')) + '">' + houses + (nH > shown ? '<span>＋' + (nH - shown) + '</span>' : '') + '<span class="ksmall">' + L('每個房子＝1 萬戶', 'each house = 10,000 homes') + '</span></div></div>' +
      (mx && mx.total > total * 1.5 ? '<div class="kcard"><b class="kq">' + L('風大的時候呢？', 'And on a windy day?') + '</b>' +
        '<div class="kbarrow"><span>' + L('現在', 'Now') + '</span><b>' + WW.num(total, 1) + ' MW</b></div><div class="ktrack"><i style="width:' + Math.max(1.5, total / mx.total * 100).toFixed(1) + '%"></i></div>' +
        '<div class="kbarrow"><span>' + L('這 7 天風最大的時候（' + mxS + '）', 'The windiest moment in the last 7 days (' + mxS + ')') + '</span><b>' + WW.num(mx.total, 1) + ' MW</b></div><div class="ktrack"><i class="d" style="width:100%"></i></div>' +
        '<p data-say>' + L('風大的時候，是現在的 <b>' + WW.int(times) + ' 倍</b>！風力發電要看天氣，所以還要搭配其他電源。', 'At that moment it was <b>' + WW.int(times) + ' times</b> the output right now! Wind power depends on the weather, so it works together with other power sources.') + '</p></div>' : '') +
    '</div><div class="kt-col">' +
      '<div class="kcard kguide">' + sprite(mood, 120) + '<p data-say>' + say + '</p></div>' +
      '<div class="kcard"><b class="kq" data-say>' + L('全台 ' + nF + ' 座風場，此刻有 ' + gen + ' 座在發電', gen + ' of Taiwan’s ' + nF + ' wind farms are generating now') + '</b>' +
        '<div class="kfarms" role="img" aria-label="' + esc(L(gen + ' 個綠色風車代表正在發電，' + (nF - gen) + ' 個灰色代表此刻沒有出力', gen + ' green turbines are generating, ' + (nF - gen) + ' grey ones have no output now')) + '">' +
        LV.FARMS.map(f => (LV.RT[f.id] || 0) >= 0.05 ? ROTOR('kf on', '#12A594', NAVY, '#FFC845') : ROTOR('kf', '#EEF3F7', '#9DB4C6', '#D3DEE7')).join('') + '</div>' +
        '<div class="klegend"><span><i class="g"></i>' + L('正在發電', 'Generating') + '</span><span><i></i>' + L('此刻沒有出力', 'No output now') + '</span></div></div>' +
      '<p class="ksmall">' + L('怎麼算的？家庭用電以每戶平均 0.5 kW 估算（一年約 3,600 度）。資料來自台電即時資料，本站約每 30 分鐘更新。', 'How is it worked out? A home uses about 0.5 kW on average (about 3,600 kWh a year). Data: Taipower’s live data, updated on this site about every 30 minutes.') +
        ' <a href="#/live">' + L('看大人版的台灣即時 →', 'See the full Taiwan live page →') + '</a></p>' +
    '</div></div></div>';
}

/* ---------------- 風車護照 · passport ---------------- */
function viewPassport() {
  const sea = [4, 6, 7, 8], nSea = sea.filter(stamped).length;
  const badges = [
    ['clock', L('時光旅人', 'Time traveller'), L('走完 1888 到 ' + STOPS[7].m.year + ' 年的 8 站', 'Visit all 8 stops from 1888 to ' + STOPS[7].m.year), P.s.length, 8],
    ['wave', L('海上風車達人', 'Offshore expert'), L('蓋滿 4 個海上的章', 'Collect the 4 offshore stamps'), nSea, 4],
    ['house', L('台灣風場通', 'Taiwan wind fan'), L('完成第 7 站，也看過「台灣此刻的風」', 'Finish stop 7 and visit “Taiwan right now”'), (stamped(7) ? 1 : 0) + (P.tw ? 1 : 0), 2]
  ];
  const COL = ['#B5401E', '#0A6B62', '#8A5B0C', '#1F5FA8'];     // 白底上的對比都在 4.5:1 以上
  host.innerHTML = '<div class="kwrap kpass">' +
    '<div class="kp-head"><h1 data-say="' + esc(L('我的風車護照。已經蓋了 ' + P.s.length + ' 個章，共 8 個。', 'My wind passport. ' + P.s.length + ' of 8 stamps collected.')) + '">' + L('我的風車護照', 'My wind passport') + '</h1>' +
      '<div class="kp-btns knp"><button type="button" class="kbtn sm" id="kprint">' + ico('print') + L('列印護照', 'Print passport') + '</button>' +
      (P.s.length >= 8 ? '<a class="kbtn sm" href="#/kids/cert">' + ico('award') + L('完成證書', 'Certificate') + '</a>' : '') +
      '<a class="kbtn primary sm" href="' + (nextStop() ? '#/kids/stop?n=' + nextStop() : '#/kids/globe') + '">' + L('繼續冒險', 'Keep exploring') + ico('next') + '</a></div></div>' +
    '<div class="kbook"><div class="kb-left">' +
      '<div class="kb-id">' + sprite('happy', 76) + '<div><b>' + L('風車護照', 'Wind passport') + '</b><span>' + L('跟著風去旅行 · 探險紀錄', 'Travel with the Wind · explorer’s record') + '</span></div></div>' +
      '<label class="kname">' + L('探險家', 'Explorer') + '<input type="text" id="kname" maxlength="20" autocomplete="off" placeholder="' + esc(L('寫上你的名字', 'Write your name')) + '"></label>' +
      '<div class="kprog"><div><b>' + L('已蓋 ' + P.s.length + ' 個章', P.s.length + (P.s.length === 1 ? ' stamp' : ' stamps') + ' collected') + '</b><span>' + L('共 8 個', 'of 8') + '</span></div><div class="ktrack"><i style="width:' + (P.s.length / 8 * 100) + '%"></i></div></div>' +
      '<b class="kq">' + L('徽章', 'Badges') + '</b><ul class="kbadges">' + badges.map(b => '<li class="' + (b[3] >= b[4] ? 'got' : '') + '"' + (b[3] >= b[4] ? ' data-say="' + esc(L('得到徽章：', 'Badge: ') + b[1]) + '"' : '') + '><span class="kbi">' + ico(b[3] >= b[4] ? b[0] : 'lock', 24) + '</span><span><b>' + b[1] + '</b><span>' + b[2] + ' · ' + Math.min(b[3], b[4]) + '/' + b[4] + '</span></span></li>').join('') + '</ul>' +
      (P.s.length < 8 ? '<p class="ksmall knp">' + ico('award', 18) + ' ' + L('集滿 8 個章，就能列印「風車探險家」完成證書。', 'Collect all 8 stamps to print your “Wind explorer” certificate.') + '</p>' : '') +
      '<p class="ksmall knp">' + L('進度只記在這台電腦或平板上，不用註冊，也不會上傳。', 'Progress is kept on this computer or tablet only — no sign-up, nothing uploaded.') + ' <button type="button" class="klink" id="kreset">' + L('重新開始', 'Start over') + '</button></p>' +
    '</div><div class="kstamps">' + STOPS.map((s, i) => {
      const ok = stamped(s.n), rot = [-8, 6, -4, 9, -6, 5, -3, 7][i];
      return '<a class="kst' + (ok ? ' ok' : '') + '" href="#/kids/stop?n=' + s.n + '" style="--c:' + COL[i % 4] + ';--r:' + rot + 'deg"><span class="kring"><span class="kin"><b>' + s.m.year + '</b><span>' + (ok ? esc(T(s.stamp)) : L('還沒\n蓋章', 'Not yet\nstamped')) + '</span></span></span>' +
        '<b class="kno">' + L('第 ' + s.n + ' 站', 'Stop ' + s.n) + '</b><span class="kspl">' + esc(T(s.place)) + '</span></a>';
    }).join('') + '</div></div></div>';
  const nm = $('kname'); nm.value = P.name || '';
  nm.oninput = () => { P.name = nm.value.slice(0, 20); save(); };
  $('kprint').onclick = () => window.print();
  $('kreset').onclick = () => { if (confirm(L('確定要清掉所有的章，重新開始嗎？', 'Clear all stamps and start over?'))) { P = { s: [] }; save(); render(); } };
}

/* ---------------- 完成證書（集滿 8 個章，可列印） · certificate ---------------- */
function viewCert() {
  const left = 8 - P.s.length;
  if (left > 0) {
    host.innerHTML = '<div class="kwrap kcertv"><div class="kcard kguide">' + sprite('talk', 120) + '<div><p data-say>' +
      L('還差 ' + left + ' 個章，就能拿到「風車探險家」完成證書！', left + (left === 1 ? ' more stamp' : ' more stamps') + ' and you get your “Wind explorer” certificate!') + '</p>' +
      '<a class="kbtn primary sm" href="#/kids/stop?n=' + nextStop() + '">' + L('去第 ' + nextStop() + ' 站', 'Go to stop ' + nextStop()) + ico('next') + '</a></div></div></div>';
    return;
  }
  const d = P.done ? new Date(P.done + 'T12:00:00') : new Date();
  const ds = L(d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日', d.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getFullYear());
  const s1 = STOPS[0].m, s8 = STOPS[7].m, COL = ['#B5401E', '#0A6B62', '#8A5B0C', '#1F5FA8'];
  const txt = nm => L('恭喜' + (nm || '你') + '跟著小風走完了 8 站：從 ' + s1.year + ' 年美國的布拉許風車，到 ' + s8.year + ' 年中國福建外海 ' + fmtKW(s8.mw) + ' 的巨型風機，認識了風怎麼變成電。你是風車探險家！',
    'Congratulations, ' + (nm || 'explorer') + '! You travelled all 8 stops with Breezy, from Brush’s turbine in the USA in ' + s1.year + ' to a ' + fmtKW(s8.mw) + ' giant off Fujian, China, in ' + s8.year + ', and learned how wind becomes electricity. You are a wind explorer!');
  host.innerHTML = '<div class="kwrap kcertv">' +
    '<div class="kp-head knp"><h1>' + L('完成證書', 'Certificate') + '</h1><div class="kp-btns"><button type="button" class="kbtn sm" id="kprint">' + ico('print') + L('列印證書', 'Print') + '</button>' +
      '<a class="kbtn sm" href="#/kids/passport">' + ico('passport') + L('回護照', 'Passport') + '</a></div></div>' +
    '<div class="kcert">' + sprite('happy', 110) +
      '<span class="kc-top">' + L('風電風情 · 跟著風去旅行', 'Taiwan Wind Watch · Travel with the Wind') + '</span>' +
      '<h2>' + L('風車探險家證書', 'Wind Explorer Certificate') + '</h2>' +
      '<label class="kc-namel"><span class="knp">' + L('探險家的名字（可以修改）', 'Explorer’s name (you can edit it)') + '</span><input type="text" id="kname" class="kc-name" maxlength="20" autocomplete="off" placeholder="' + esc(L('寫上你的名字', 'Write your name')) + '"></label>' +
      '<p class="kc-txt" id="kctxt" data-say="' + esc(txt(P.name)) + '">' + L('跟著小風走完了 8 站：從 ' + s1.year + ' 年美國的布拉許風車，到 ' + s8.year + ' 年中國福建外海 ' + fmtKW(s8.mw) + ' 的巨型風機，認識了風怎麼變成電。',
        'travelled all 8 stops with Breezy, from Brush’s turbine in the USA in ' + s1.year + ' to a ' + fmtKW(s8.mw) + ' giant off Fujian, China, in ' + s8.year + ', and learned how wind becomes electricity.') + '</p>' +
      '<div class="kc-stamps" aria-hidden="true">' + STOPS.map((s, i) => '<span class="kst ok" style="--c:' + COL[i % 4] + ';--r:' + [-8, 6, -4, 9, -6, 5, -3, 7][i] + 'deg"><span class="kring"><span class="kin"><b>' + s.m.year + '</b></span></span></span>').join('') + '</div>' +
      '<div class="kc-foot"><span>' + L('日期：', 'Date: ') + ds + '</span><span>' + L('帶路：小風', 'Guide: Breezy') + '</span></div>' +
    '</div></div>';
  const nm = $('kname'); nm.value = P.name || '';
  nm.oninput = () => { P.name = nm.value.slice(0, 20); save(); $('kctxt').dataset.say = txt(P.name.trim()); };
  $('kprint').onclick = () => window.print();
}

/* ---------------- 全班一起玩（老師投影；不蓋章、不記錄進度） · class mode for a projector ----------------
   每站三步：看重點 → 小問題（可倒數 10 秒、點全班選的答案）→ 公布答案。→／空白鍵／簡報器下一頁＝下一步，←＝上一步，F＝全螢幕。 */
const CL = { n: 0, step: 0, pick: null, left: 0, timer: null };
const clStop = () => { clearInterval(CL.timer); CL.timer = null; CL.left = 0; };
function clGo(n, step) {
  clStop(); speak(false);
  CL.n = n; CL.step = step || 0; CL.pick = null;
  history.replaceState(history.state, '', '#/kids/class' + (n >= 1 && n <= 8 ? '?n=' + n : ''));
  paintBar(); viewClass(); window.scrollTo(0, 0);
}
function clNext() {
  if (CL.n < 1) clGo(1, 0);
  else if (CL.n > 8) return;
  else if (CL.step < 2) clGo(CL.n, CL.step + 1);
  else clGo(CL.n + 1, 0);
}
function clPrev() {
  if (CL.n > 8) clGo(8, 2);
  else if (CL.n < 1) return;
  else if (CL.step > 0) clGo(CL.n, CL.step - 1);
  else clGo(CL.n - 1, CL.n > 1 ? 2 : 0);
}
function viewClass() {
  if (CL.n < 1) {
    host.innerHTML = '<div class="kwrap kclass kc-intro">' +
      '<div class="kc-hero">' + sprite('wave', 170) + '<div><span class="kchip">' + L('給老師：投影這一頁，全班一起玩', 'For teachers: project this page and play together') + '</span>' +
        '<h1 data-say>' + L('全班一起玩', 'Play as a class') + '</h1>' +
        '<p data-say>' + L('一站一站看重點，每站一題小問題，大家舉手回答，老師再公布答案。這個模式不會蓋章，也不會記錄任何人的進度。',
          'Read each stop together, then answer its question by show of hands before the teacher reveals the answer. This mode gives no stamps and keeps no one’s progress.') + '</p>' +
        '<div class="kbtns"><button type="button" class="kbtn primary" data-cl="start">' + L('從第 1 站開始', 'Start at stop 1') + ico('next', 24) + '</button>' + fsBtn('kbtn') + '</div></div></div>' +
      '<div class="kcard"><b class="kq">' + L('從哪一站開始？', 'Start from another stop') + '</b><div class="kc-pick">' +
        STOPS.map(s => '<button type="button" data-cln="' + s.n + '"><b>' + s.n + '</b><span><span class="ky">' + s.m.year + '</span> ' + esc(T(s.place)) + '</span></button>').join('') + '</div></div>' +
      '<div class="kcard kc-keys"><b class="kq">' + L('操作方式', 'Controls') + '</b><ul>' +
        '<li>' + L('每站三步：看重點 → 小問題 → 公布答案', 'Three steps per stop: facts → question → answer') + '</li>' +
        '<li>' + L('→、空白鍵或簡報器的「下一頁」：下一步；←：上一步', '→, the space bar or a clicker’s “next”: next step; ←: back') + '</li>' +
        '<li>' + L('F：全螢幕；「唸給我聽」會唸出畫面上的重點或題目', 'F: full screen; “Read to me” reads out the facts or the question') + '</li>' +
        '<li>' + L('小問題時可以按「倒數 10 秒」，再點全班選最多的答案，或直接公布答案', 'During a question, start the 10-second countdown, then tap the answer most of the class chose, or reveal the answer') + '</li></ul></div></div>';
    paintFS();
    return;
  }
  if (CL.n > 8) {
    host.innerHTML = '<div class="kwrap kclass kc-end">' + sprite('happy', 200) +
      '<h1 data-say>' + L('全班完成 8 站！', 'The class finished all 8 stops!') + '</h1>' +
      '<p data-say>' + L('從 ' + STOPS[0].m.year + ' 年的布拉許風車到 ' + STOPS[7].m.year + ' 年的巨型風機，大家都是風車探險家了。想蓋章的同學，可以用自己的平板或電腦再玩一次。',
        'From Brush’s turbine of ' + STOPS[0].m.year + ' to the giant of ' + STOPS[7].m.year + ', everyone is a wind explorer now. Anyone who wants the stamps can play again on their own tablet or computer.') + '</p>' +
      '<div class="kbtns"><button type="button" class="kbtn primary" data-cl="restart">' + L('再玩一次', 'Play again') + '</button><a class="kbtn" href="#/kids">' + L('回探險版首頁', 'Back to the start') + '</a></div></div>' + clNav();
    return;
  }
  const s = STOPS[CL.n - 1], q = s.quiz;
  if (CL.step === 0) {
    host.innerHTML = '<div class="kwrap kclass kc-learn"><div class="ks-media">' + photoHTML(s) + compareHTML(s) + '</div>' +
      '<div class="kc-body"><span class="kchip">' + L('第 ' + s.n + ' 站 · ' + s.m.year + ' 年 · ' + T(s.place), 'Stop ' + s.n + ' · ' + s.m.year + ' · ' + T(s.place)) + '</span>' +
      '<h1 data-say>' + esc(T(s.title)) + '</h1>' + factsHTML(s) + '</div></div>' + clNav();
    photoFallback(s);
    return;
  }
  const ans = CL.step === 2, right = CL.pick === q.a;
  host.innerHTML = '<div class="kwrap kclass kc-quiz"><div class="kc-qhead">' + sprite(ans ? 'happy' : 'wow', 120) +
      '<div><span class="kchip">' + L('第 ' + s.n + ' 站 · 小問題', 'Stop ' + s.n + ' · question') + '</span><h1 data-say>' + esc(T(q.q)) + '</h1></div></div>' +
    '<div class="kc-opts">' + q.o.map((o, i) => '<button type="button" class="kc-opt' + (ans ? (i === q.a ? ' right' : ' dim') : CL.pick === i ? ' wrong' : '') + '" data-clo="' + i + '"' +
      (ans && i !== q.a ? '' : ' data-say="' + optSay(q, i) + '"') + (ans ? ' disabled' : '') + '><b>' + 'ABC'[i] + '</b><span>' + esc(T(o[0])) + '</span></button>').join('') + '</div>' +
    (ans ? '<div class="kfb ok kc-fb" data-say>' + sprite('happy', 64) + '<span><b>' + (right ? L('全班答對了！', 'The class got it! ') : L('答案是 ' + 'ABC'[q.a] + '。', 'The answer is ' + 'ABC'[q.a] + '. ')) + '</b>' + esc(T(q.ok)) + '</span></div>'
      : (CL.pick != null ? '<div class="kfb no kc-fb" data-say>' + esc(T(q.o[CL.pick][1])) + '</div>' : '') +
        '<div class="kc-tools"><button type="button" class="kbtn" data-cl="timer">' + ico('clock', 24) + L('倒數 10 秒', '10-second countdown') + '</button>' +
        '<span class="kc-timer" id="kctimer" aria-live="polite"></span>' +
        '<span class="ksmall">' + L('請大家舉手：選 A 的舉手、選 B 的舉手……再點全班選最多的答案。', 'Show of hands for A, then B, then C… and tap the answer most of the class chose.') + '</span></div>') +
    '</div>' + clNav();
  paintTimer();
}
function clNav() {
  const end = CL.n > 8, labels = [L('看重點', 'Facts'), L('小問題', 'Question'), L('答案', 'Answer')];
  const nextL = end ? '' : CL.step === 0 ? L('下一步：小問題', 'Next: question') : CL.step === 1 ? L('公布答案', 'Reveal the answer') : CL.n < 8 ? L('下一站', 'Next stop') : L('完成', 'Finish');
  return '<div class="kc-nav"><button type="button" class="kbtn sm" data-cl="prev">' + ico('prev') + L('上一步', 'Back') + '</button>' +
    (end ? '' : '<ol class="kc-steps" aria-label="' + esc(L('第 ' + CL.n + ' 站的步驟', 'Steps of stop ' + CL.n)) + '">' + labels.map((t, i) => '<li' + (i === CL.step ? ' class="on" aria-current="step"' : '') + '>' + t + '</li>').join('') + '</ol>' +
      '<button type="button" class="kbtn primary sm" data-cl="next">' + nextL + ico('next') + '</button>') + '</div>';
}
function paintTimer() {
  const el = $('kctimer'); if (!el) return;
  el.textContent = CL.timer ? CL.left : CL.left === 0 && el.dataset.done ? L('時間到！請舉手', 'Time’s up! Hands up') : '';
}
function startTimer() {
  clStop(); CL.left = 10;
  const el = $('kctimer'); if (el) delete el.dataset.done;
  CL.timer = setInterval(() => {
    CL.left--;
    if (CL.left <= 0) { clStop(); const e2 = $('kctimer'); if (e2) e2.dataset.done = '1'; }
    paintTimer();
  }, 1000);
  paintTimer();
}
page.addEventListener('click', e => {
  if (view !== 'class') return;
  const b = e.target.closest('[data-cl],[data-cln],[data-clo]'); if (!b) return;
  if (b.dataset.cln) return clGo(+b.dataset.cln, 0);
  if (b.dataset.clo) {                                               // 點全班選的答案 · the answer the class chose
    const i = +b.dataset.clo, q = STOPS[CL.n - 1].quiz;
    clStop();
    if (i === q.a) { CL.pick = i; CL.step = 2; } else CL.pick = i;
    speak(false); viewClass();
    return;
  }
  const a = b.dataset.cl;
  if (a === 'start' || a === 'restart') clGo(1, 0);
  else if (a === 'next') clNext();
  else if (a === 'prev') clPrev();
  else if (a === 'timer') startTimer();
});
document.addEventListener('keydown', e => {
  if (view !== 'class' || WW.currentPage() !== 'kids' || e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if ((e.key === ' ' || e.key === 'Enter') && tag === 'BUTTON') return;      // 按鈕上的空白鍵照按鈕本身的動作
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); clNext(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); clPrev(); }
  else if ((e.key === 'f' || e.key === 'F') && FS_OK) { e.preventDefault(); toggleFS(); }
});

/* ---------------- 路由 · routing ---------------- */
const VIEWS = { globe: 1, stop: 1, taiwan: 1, passport: 1, cert: 1, class: 1 };
function render() {
  if (!D) return;
  speak(false);
  if (view !== 'globe') { stopGlobe(); setPlay(false); }
  if (view !== 'class') clStop();
  paintBar();
  if (view === 'globe') viewGlobe();
  else if (view === 'stop') viewStop(stopN);
  else if (view === 'taiwan') viewTaiwan();
  else if (view === 'passport') viewPassport();
  else if (view === 'cert') viewCert();
  else if (view === 'class') viewClass();
  else viewHome();
  paintSay();
}
WW.kids = {
  enter(r) {
    view = VIEWS[r.sub] ? r.sub : 'home';
    stopN = Math.max(1, Math.min(8, parseInt(r.params.n, 10) || 1));
    if (view === 'class') { const n = parseInt(r.params.n, 10); CL.n = n >= 1 && n <= 8 ? n : 0; CL.step = 0; CL.pick = null; }
    loadData().then(() => (view === 'globe' ? initGlobe() : null)).then(() => {
      if (WW.currentPage() !== 'kids') return;
      render(); window.scrollTo(0, 0);
      if (view !== 'globe' && !G.init) initGlobe();          // 先在背景準備地球 · warm up the globe in the background
    }).catch(e => {
      console.error(e);
      host.innerHTML = '<div class="kwrap"><p>' + L('資料載入失敗，請檢查網路後重新整理。', 'The data failed to load. Check your connection and reload.') + '</p></div>';
    });
  },
  leave() {
    stopGlobe(); setPlay(false); speak(false); clStop();
    if (document.fullscreenElement === page) document.exitFullscreen().catch(() => {});
  },
  api: () => ({ G, P, STOPS, X, CL, sayParts, CAN_SAY })
};
WW.onLang(() => { if (WW.currentPage() === 'kids' && D) render(); });
if (WW.live) WW.live.onUpdate(() => { if (WW.currentPage() === 'kids' && view === 'taiwan') viewTaiwan(); });
})();
