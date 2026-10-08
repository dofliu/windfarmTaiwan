/* 風電風情 · globe.js — 全球風電發展 3D 地球儀 1980–2025＋最新可得年份（three.js r128）
   改寫自使用者提供的「全球風電發展觀察地圖」(wind-history-map v3)：
   · 資料抽成 data/global/*.json；本檔與 three.js 只在進入「全球發展」頁時才載入，離開頁面即停止繪圖迴圈
   · 風場層改用 InstancedMesh，可同時繪製上萬座風場（GEM 全球風電追蹤 2026-02 ＋ 附件精選風場）
   · 新增：規劃中圖層（興建中／前期開發／已宣布）、國家概況、地貌底圖（地形／衛星／簡潔）與
     放大後的 Esri 圖磚細節、台灣風場連動台電即時出力、全程 MW 單位、深連結（?y=&r=&ms=&f=…）
   · 無 WebGL 時自動退回長條圖排名模式 */
(function () {
'use strict';
const WW = window.WW;
const $ = id => document.getElementById(id);
const host = $('globe');

/* ================= i18n ================= */
const I18N = {
  zh: {
    title: '全球風電發展地圖', vMap: '地圖', vSplit: '地圖＋長條', vBars: '長條排名', mGlobe: '3D 地球', mFlat: '2.5D 平面',
    region: '範圍', base: '底圖', bRelief: '地形', bSat: '衛星', bPlain: '簡潔', bWind: '平均風速', pipe: '規劃中', flow: '此刻的風', zones: '海域', rotate: '自動旋轉', tour: '▶ 導覽', labels: '標籤', sources: '資料來源',
    speed: '速度', layer: '顯示', lBoth: '陸域＋離岸', lOn: '只看陸域', lOff: '只看離岸', lFd: '離岸：水下基礎',
    fdTitle: '水下基礎型式', fdGroup: { mp: '單樁', frame: '鋼構框架', fl: '浮動式', other: '其他固定式', unk: '型式不詳' },
    fdGroupTip: { mp: '單樁（Monopile）', frame: '套管式、三腳架、三樁', fl: '浮動式：單柱式、半潛式、駁船式、張力腳', other: '重力式、高樁承台、圍堰式、岩錨式、複合筒、混合', unk: '還沒查證的固定式離岸風場' },
    fdCov: (n, t, p) => `已知型式 ${n}／${t} 座 · 占容量 ${p}`, fdIso: '點一組只看這一組，再點一次恢復全部', fdNoFarm: '範圍內沒有營運中的離岸風場',
    fdLabel: '水下基礎', fdUnknown: '型式不詳（尚未查證）', fdFloatSub: '細分型式待查', fdFlBy: '浮動式細分', fdSecond: '第二來源', fdSrc: '來源', fdDoc: '逐場清單',
    fdStep: '逐步收集中：歐洲、全球浮動式風場與台灣、日本、韓國、美國已完成；中國、越南進行中，還沒查明的暫列型式不詳', fdProf: '水下基礎（營運中離岸風場，依容量）',
    dimDepth: '水深', dimHub: '輪轂高度', dimTower: '塔高', dimRotor: '葉輪直徑', fdScaled: '依該場的水深、輪轂高度與葉輪直徑等比例繪製；近景風機的塔與葉輪比例也依此。', fdPartScaled: '有數值的部分（{v}）按比例，其餘為示意。', fdDimSrc: '尺寸出處', portArcs: '地圖上以淺藍弧線連到這些風場',
    fdYears: '各年新增離岸容量（依水下基礎型式）', fdYearsNote: '以商轉年計，分期風場依各期；已除役的也算入當年新增',
    hint: '拖曳旋轉 · 滾輪縮放（可一路放大到風場） · 點國家或風場直接飛過去 · 空白鍵播放/暫停',
    hintTouch: '單指旋轉 · 雙指縮放 · 點國家或風場直接飛過去',
    barTitle: '累計裝置容量排名（MW）', onshore: '陸域', offshore: '離岸', total: '合計',
    barFoot: '年底累計（MW）· 點長條聚焦該國 · 資料：IRENA / OWID、GWEC、WFO、EWEA、BTM Consult（1980–99 為估算）',
    world: '全世界', worldTotal: '全球累計', countriesWith: '個國家有風電', top15: n => '全球前 ' + n + ' 名', inRegion: n => '區域內前 ' + n + ' 名',
    cont: { Asia: '亞洲', Europe: '歐洲', 'North America': '北美洲', 'South America': '南美洲', Africa: '非洲', Oceania: '大洋洲' },
    turbine: '單機', farm: '風場', rotor: '葉輪直徑', type: { onshore: '陸域', offshore: '離岸', floating: '浮動式' },
    st: ['營運中', '興建中', '前期開發', '已宣布', '已除役'],
    srcTitle: '資料來源與說明', msTitle: '里程碑', farmsTab: '風場', profTab: '概況',
    msFocus: '點里程碑可跳到該年份並把鏡頭飛到現場',
    play: '播放', pause: '暫停', farmLayer: '風場層', farmShown: '已出現', farmNone: '此國家尚無風場層級資料',
    farmsLoading: '風場資料載入中…',
    dens: ['關閉', '精簡', '標準', '詳細'],
    tbLabel: '機組', tbModels: n => '等 ' + n + ' 種機型', tbNote: '近景依 USWTDB 的實際機位與尺寸繪製', tbSrcT: '美國風機資料庫 USWTDB（美國地質調查所、勞倫斯柏克萊國家實驗室，公有領域）', tbOsmNote: '近景依 OpenStreetMap 志工標示的機位繪製；機組數是標示的風機數，可能與實際略有出入', tbOsmCr: '© OpenStreetMap 貢獻者', tbOsmT: 'OpenStreetMap 資料，開放資料庫授權 ODbL', tbDeNote: '近景依德國聯邦網路局「市場主資料登錄」（MaStR）的機位與尺寸繪製', tbDeCr: '© Bundesnetzagentur | MaStR', tbDeT: '德國聯邦網路局 市場主資料登錄（Marktstammdatenregister），Datenlizenz Deutschland – Namensnennung 2.0',
    coastLabel: '離岸距離', coastNote: '到最近海岸線的直線距離，依 Natural Earth 1:50m 海岸線估算（不含小島）',
    actLabel: '實際年發電量', actCf: '容量因數', actNote: (mw, src, iso) => (iso === 'DNK' ? '計量發電量取自' : iso === 'AUS' ? '每 5 分鐘實測出力的加總，取自' : '淨發電量取自') + src + '；容量因數以' + (iso === 'USA' ? ' EIA 登記的裝置容量 ' : iso === 'DNK' ? '有公布發電量的機組的登記容量 ' : iso === 'AUS' ? ' AEMO 登記容量 ' : '台電公布的裝置容量 ') + mw + ' MW 計，只列全年運轉的年份' + (iso === 'AUS' ? '；實測值含限電與負電價時的自主降載' : ''), actSrc: { USA: ['美國能源資訊署 EIA-923', 'EIA-923', '美國能源資訊署 EIA-923 各電廠逐月淨發電量（公有領域）'], TWN: ['台電開放資料「自建之各類再生能源發電量」（只有台電自有的風場）', '台電開放資料', '台灣電力公司 自建之各類再生能源發電量（政府資料開放平臺 17140，政府資料開放授權條款）'], DNK: ['丹麥能源署（Energistyrelsen）的風機登記檔（只有公司持有的風機有公布發電量）', 'Energistyrelsen', 'Energistyrelsen, Stamdataregister for vindkraftanlæg（Vinddata、Parkproduktion）'], AUS: ['澳洲能源市場營運機構（AEMO）各機組的 SCADA 實測出力（MMS 資料模型月檔）', 'AEMO', 'Australian Energy Market Operator（AEMO）MMS Data Model：DISPATCH_UNIT_SCADA、DUDETAIL（依 AEMO 版權許可標示來源）'] },
    genLabel: '估計年發電量', genNote: (cn, cf, y) => '容量 × ' + cn + ' ' + y + ' 年風電平均容量因數 ' + cf + '%（Ember）；是估計，不是實測', genOff: '；離岸風場的容量因數通常高於全國平均',
    totalCap: '容量', units: '部', clickMore: '點擊：拉近並查看照片與連結', clickFarm: '點擊：拉近、畫出全部風機，並查看照片與連結',
    wikiLoading: '正在查詢維基百科…', wikiNone: '找不到對應的維基百科條目，可用下方連結搜尋。', wikiOffline: '目前無法連線維基百科（離線或網路受限），可用下方連結查詢。',
    lnkWiki: '維基百科', lnkMap: '衛星地圖', lnkPhoto: '搜尋照片', lnkGem: 'GEM 專案頁', photoBy: '照片：', photoWiki: '維基百科條目圖片', photoFarmOnly: n => '風場照片（' + n + '，不是事件當時）',
    whyFirstOff: c => c + '第一座離岸風場', whyFirstOn: c => c + '資料中最早的陸域風場', whyRecOff: c => '併網時為' + c + '規模最大的離岸風場', whyRecOn: c => '併網時為' + c + '規模最大的陸域風場', whyTop: c => c + '規模最大的風場之一',
    tourAuto: '自動導覽（目前範圍）', tourStory: { tw: '台灣離岸之路', eu: '歐洲離岸：從 Vindeby 到 GW 級', cn: '中國崛起', fl: '浮動式風電' },
    tourStoryT: { tw: '從 2017 年兩部示範機到兩座 GW 級風場：台灣離岸風電十年', eu: '1991 年 11 部 450 kW 到單場 1.3 GW：歐洲怎麼把離岸風電做大', cn: '從新疆達坂城到全球一半的風電：中國三十年', fl: '從一部示範機到浮動式風場：把風機帶到深海' },
    tourEnd: '導覽結束', decom: '已除役', yearUnknown: '商轉年份不詳', posStack: '位置示意：與另外 {n} 筆共用同一座標（多為省或國家中心的代用點），地圖上以該點為中心排開，不是實際位置。', posApprox: '座標為概略位置（資料來源標示）。', tipStack: '位置示意（共用代用座標）', expected: '預計', pipeNote: '規劃中專案拉到最新年份才會顯示',
    liveNow: '此刻即時出力', liveLegend: '綠色外圈：有即時資料的風場，葉片轉速依此刻出力', liveSee: '看即時詳情', availability: '可用率', open: '開啟', more: '顯示更多', search: '搜尋風場名稱',
    fAll: '全部', fOp: '營運中', fPipe: '規劃中', sortMw: '依容量', sortYear: '依年份',
    profCap: '年底累計', profRank: '全球排名', profOnOff: '陸域／離岸', profTen: '10 年前', profGrowth: '成長', profShare: '佔全球',
    profFarms: '資料中的風場', profLargest: '最大風場', profEarliest: '最早風場',
    tourCountry: '▶ 導覽這個國家', seeFarms: '風場清單', seeLive: '台灣即時儀表 →', noWebgl: '此裝置無法啟用 3D（WebGL），已切換為長條圖排名。',
    attrWind: '平均風速：Global Wind Atlas（DTU、世界銀行，CC BY 4.0）· 國界：Natural Earth', windLegT: '離地 100 m 年平均風速', flowLegT: '此刻的風', zoneLegT: '海域', zEezA: '專屬經濟區界線：協議或判決', zEezM: '中線與 200 浬外界', zEezU: '未定或有爭議（虛線）', zSites: '離岸風電規劃區：台灣潛力場址、日本促進區域、北海周邊國家', zSite: '潛力場址', zArea: '離岸風電規劃區', zAreaSrc: '規劃區出處（皆已簡化）：', zNote: '界線取自 Marine Regions（CC BY 4.0），已簡化，不具法律效力，也不代表本站對任何爭議海域的立場', zSkip: '新竹縣場址的點位順序無法確定，未畫出', zSrcE: 'Marine Regions', zSrcT: '能源署開放資料', zSrcA: '各國規劃區出處見「資料來源」', zErr: '海域圖層載入失敗（離線或資料暫時無法取得）', regionEmpty: y => '時間軸在 ' + y + ' 年，這時這裡還沒有運轉中的風場；把時間軸拉到最新年份就看得到', flowLegSub: '離地 10 m，越亮風越強', flowTime: t => '資料時間 ' + t + '（台灣時間）', flowYearNote: y => '時間軸停在 ' + y + ' 年，但風是此刻的天氣，不是當年的', flowSrc: 'NOAA GFS 預報（公有領域）', windLegSrc: 'Global Wind Atlas 3（DTU、世界銀行集團，CC BY 4.0）；陸地與離岸約 200 km 內，深色＝沒有資料',
    attrPlain: '國界：Natural Earth', credit: '© 2026 勤益科大 劉瑞弘研究室', attrRelief: '地形與國界：Natural Earth', attrSat: '影像：NASA Blue Marble · 國界：Natural Earth',
    attrTileRelief: '山影 © Esri, USGS, NASA 等', attrTileSat: '影像 © Esri, Vantor, Earthstar Geographics',
    worldCap: '年底累計裝置容量', ltYear: y => y + '（最新可得）', ltCap: '各國最新官方數字',
    ltWorld: (n, m) => n + ' 國已有今年官方數字（截至 ' + m + '），其他國家沿用去年底',
    ltOk: (m, s) => '截至 ' + m + ' · ' + s, ltCarry: y => '尚無今年官方數字，沿用 ' + y + ' 年底', ltEst: '＝本站去年底數字＋該來源今年的增量（估計）', ltHatch: '斜線＝沿用去年底',
    pipeTab: '規劃', pipeHead: '規劃中與興建中專案', gemTotals: 'GEM 2026-02 開發管線（各國總量）',
    pipeCaveat: '狀態與時程會變動，座標多為概略位置。逐案資料與各國總量：GEM 2026-02，另加 2026 年 9 月整理的清單（台灣第三階段區塊開發、歐洲大型離岸案等）。',
    pipeLegendT: '規劃中（虛線環）', pipeInData: (n, mw) => `資料中逐案 ${n} 案 · ${mw}`, pipeSee: '看規劃清單 →',
    coverage: '逐場資料覆蓋率', covMapped: '已逐場標示', covGap: '差額（未逐場標示）', covOver: '風場加總高於國家統計（口徑不同）',
    lnkSrc: '來源', tbd: '時程未定', auditSrc: '官方統計稽核',
    lnkOsm: 'OpenStreetMap', lnkWd: 'Wikidata', lnkGwa: '風能資源地圖', lnkGwaT: 'Global Wind Atlas：這個地點的平均風速等風能資源',
    rankHead: y => `在國內的地位 · ${y} 年底`, rankHeadPipe: '在國內的地位 · 規劃中專案',
    rankOf: (cn, n) => `本站收錄的${cn} ${n} 座運轉中風場`, rankOfPipe: (cn, n) => `本站收錄的${cn} ${n} 個規劃中專案`,
    rankNo: k => `第 ${k} 大`, rankType: (t, k) => `${t}第 ${k} 大`, shareOf: cn => `占${cn}風電總裝置容量`,
    phTitle: '分期（虛線框＝時間軸年份還沒完工）',
    near: '附近風場（30 km 內）', nearNone: '30 km 內沒有其他收錄的風場。',
    sameOwner: '同開發商', ownNote: '依業主名稱比對；各來源寫法不一，可能有遺漏。本國優先，依容量排序。',
    relMore: n => `顯示全部 ${n} 座`, relMoreT: n => `顯示全部 ${n} 部`, relCap: n => `另有 ${n} 座未列出`,
    copyLink: '複製此風場連結', copyLinkMs: '複製此里程碑連結', copied: '已複製連結 ✓', copyFail: '無法自動複製，請手動複製下方連結',
    report: '回報資料錯誤', reportT: '在 GitHub 開一則 issue（需登入），已預填名稱、座標與連結',
    btnSearch: '🔍 搜尋', btnPorts: '⚓ 港口', portsTab: '港口',
    btnOut: '📊 發電表現', outTitle: '風場發電表現', outGen: '總發電量', outCf: '容量因數', outModel: '同機型比較', outYear: '年份',
    outHigh: '高→低', outLow: '低→高', outByN: '依座數', outByMed: '依中位數', outPh: '找風場、機型…', outMed: '中位數', outMedM: '虛線＝該機型的中位數',
    outSum: (y, n, g, m) => `${y} 年 · ${n} 座風場有實測年發電量 · 合計 ${g} · 容量因數中位數 ${m}%`,
    outCov: (iso, y, n, mw, k, kmw, p) => iso === 'TWN' ? `本站台灣 ${y} 年底運轉中的風場 ${n} 座、${mw}；有逐場官方年發電量的只有台電自有的 ${k} 座、${kmw}（約 ${p}%）。民營風場（包括台電離岸一期以外的離岸風場）沒有逐場的官方年發電量，不列入；它們此刻的出力可在台灣即時頁看。`
      : iso === 'AUS' ? `本站澳洲 ${y} 年底運轉中的風場 ${n} 座、${mw}；有 AEMO 全年實測的 ${k} 座、${kmw}（約 ${p}%）。只有東部電網（NEM）的風場有 AEMO 資料，西澳與北領地沒有；機組依 AEMO 登錄清單對到本站風場（與即時出力用的對照相同），一個機組涵蓋好幾座風場的、AEMO 登記容量與本站紀錄相差 15% 以上的不用。新風場常分段併網、受 AEMO 限制出力半年到一年，所以前一年 1 月時還沒發電、或當年登記容量有變動的年份不列入。實測值含限電與負電價時的自主降載。`
      : iso === 'DNK' ? `本站丹麥 ${y} 年底運轉中的風場 ${n} 座、${mw}；對得到丹麥能源署計量發電量的 ${k} 座、${kmw}（約 ${p}%）。能源署只公布公司持有風機的發電量（個人、獨資與合夥持有的不公布）；機組依位置歸到本站風場，容量要與紀錄相差 15% 以內才用（差太多多半有沒公布的機組），當年有機組併網或除役的年份不列入；容量因數以有公布發電量的機組的登記容量計。`
      : `本站美國 ${y} 年底運轉中的風場 ${n} 座、${mw}；有完整年度 EIA-923 實測的 ${k} 座、${kmw}（約 ${p}%）。EIA 電廠跨好幾座風場、USWTDB 與 EIA 登記容量相差 10% 以上、或當年有機組新增或改裝的不列入；容量因數以 EIA 登記的裝置容量計。`,
    outNote: { gen: () => '年發電量＝當年的淨發電量。風場越大通常發得越多；要比每 1 MW 的發電效率，請看「容量因數」。', cf: () => '容量因數＝年發電量 ÷（額定容量 × 當年時數：8,760 小時，閏年 8,784）。主要反映風場所在地的風況，也受停機、限電與機型影響。虛線是中位數。',
      model: iso => '只列整座風場只有一種機型、而且這一年有兩座以上風場有實測數字的機型；每個點是一座風場，點一下飛到那座風場，按 ▾ 列出各場數字。' + (iso === 'TWN' ? '台灣的機型取自本站風場紀錄，台電發電站容量與紀錄相差 3% 以上（可能含其他機組）的不列入，例如彰工；混合機型的台中港、大潭也不列入。' : iso === 'DNK' ? '丹麥的機型依能源署登記檔的廠牌＋葉輪直徑＋單機容量分組（同一型號有好幾種寫法）。' : iso === 'AUS' ? '澳洲的機型取自本站風場紀錄（多數紀錄沒有寫機型），AEMO 登記容量與紀錄相差 3% 以內才寫。' : '機型取自 USWTDB（同一型號、同一單機容量）。') + '同一機型的差異主要來自風況、輪轂高度與停機／限電，不只是機型本身。' },
    outGrp: (n, m, lo, hi) => `${n} 座 · 中位數 ${m}% · ${lo}–${hi}%`, outExpand: '列出各風場', outNoModel: '這一年沒有兩座以上風場使用同一機型的資料。',
    outRank: (y, a, n, b) => `${y} 年容量因數第 ${a}／${n} 名、年發電量第 ${b} 名`, outSee: '看排名 →', outCountry: '📊 發電表現排名',
    outIso: { TWN: '台灣・官方年資料', TWS: '台灣・即時取樣', USA: '美國', AUS: '澳洲', DNK: '丹麥・風場', DKT: '丹麥・單部風機' }, outGenS: '平均出力', outPer: '期間', outData: '資料',
    outSumT: (y, n, g, m) => `${y} 年 · ${n} 部風機有實測年發電量 · 合計 ${g} · 容量因數中位數 ${m}%`,
    outCovT: (y, n) => `丹麥能源署公布公司持有風機的逐月發電量（個人、獨資與合夥持有的不公布）；整座一起計量的風場（例如 Horns Rev、Anholt）只有整場合計，見「丹麥・風場」。這裡列出 ${y} 年全年運轉、單獨計量的 ${n} 部風機；容量因數以登記的單機容量計，5–65% 以外的不列（多為停機或資料錯誤）。`,
    outCreditAU: '資料來源：Australian Energy Market Operator（AEMO），MMS Data Model（DISPATCH_UNIT_SCADA、DUDETAIL）', outTermsAU: 'AEMO 版權許可',
    outCredit: m => '資料：Energistyrelsen（丹麥能源署）Stamdataregister for vindkraftanlæg（風機登記檔 Vinddata、Parkproduktion）' + (m ? '，' + m + '取用' : ''), outTerms: '使用條款', outTurbErr: '單部風機的資料無法載入。',
    outNoteT: { gen: () => '年發電量＝當年的計量發電量。單機容量越大通常發得越多；要比每 1 MW 的效率，請看「容量因數」。',
      cf: () => '容量因數＝年發電量 ÷（登記的單機容量 × 當年時數：8,760 小時，閏年 8,784）。主要反映所在地的風況與輪轂高度，也受停機與機齡影響。虛線是中位數。',
      model: () => '依登記檔的廠牌＋葉輪直徑＋單機容量分組（同一型號有好幾種寫法，名稱取最常見的），只列這一年有 5 部以上有數字的組。每個點是一部風機，數量多時改畫分布（每格 1 個百分點）；點一下飛到那部風機，按 ▾ 列出各部數字。同機型的差異主要來自風況、輪轂高度與停機。' },
    outGrpT: (n, m, lo, hi) => `${n} 部 · 中位數 ${m}% · ${lo}–${hi}%`, outExpandT: '列出各部風機', outPhT: '找自治市、機型…',
    outSpec: (rd, u) => `葉輪 ${rd} m · 單機 ${u}`, outConn: y => `${y} 年併網`, outBin: (a, n) => `容量因數 ${a}–${a + 1}%：${WW.int(n)} 部`,
    turbNoModel: '機型不詳', turbMuni: m => `${m} 自治市`, turbTag: '單部風機',
    turbNote: u => `計量發電量取自丹麥能源署的風機登記檔；容量因數以登記的單機容量 ${u} 計，只列全年運轉的年份。`,
    turbRank: (y, a, n) => `${y} 年容量因數第 ${a}／${n} 名（丹麥單獨計量的風機）。`,
    outPerOpt: (v, first) => v === 'all' ? `全部（${first} 起）` : `近 ${v} 天`,
    outSumS: (a, b, n, k, m) => `${a} 至 ${b} · ${n} 次取樣 · ${k} 個併網點 · 容量因數中位數 ${m}%`,
    outSrcS: ['台電即時資料', '台灣電力公司 各機組發電量即時資訊（政府資料開放平臺 8931，政府資料開放授權條款）'],
    outCovS: sk => '以台電即時資料的併網點為單位（例如大彰化 1&2a 分成沃一風、沃二風），含民營風場。抓取程式約每 2 小時記下一次各併網點的瞬間出力；平均出力是這些取樣的平均，容量因數只計台電已列出裝置容量的時段。以 2026 年 7 月比對，台電自有 7 座風場的取樣容量因數與官方月發電量相差 0–2 個百分點。' +
      (sk.length ? '試運轉中或取樣不足、不列入：' + sk.join('、') + '。' : '') + '台電的「其它台電自有」「其它購電風力」是多座風場的彙總，不列入。',
    outSampErr: '即時取樣資料無法載入。',
    outNoteS: { gen: () => '平均出力＝期間內各次取樣的出力平均（MW），是瞬間值的取樣估計，不是官方發電量。規模越大通常越高；要比效率請看「容量因數」。',
      cf: () => '取樣容量因數＝取樣出力加總 ÷ 同時段裝置容量加總，只反映所選期間：台灣的風季是冬季東北季風，夏季（約 5–9 月）的容量因數會遠低於全年。虛線是中位數。',
      model: () => '只列所屬風場只有一種機型、而且有兩個以上併網點有數字的機型；同一座風場的併網點（如沃一風、沃二風）會一起出現。每個點是一個併網點，點一下飛到所屬風場。差異主要來自風況、位置與停機，不只是機型。' },
    outSmp: n => `${n} 次取樣`, outGrpS: (n, m, lo, hi) => `${n} 個併網點 · 中位數 ${m}% · ${lo}–${hi}%`,
    sampLabel: '即時取樣（近 90 天）', sampVal: (o, c) => `平均出力 ${o} · 容量因數 ${c}%`,
    sampNote: (a, b, u, part) => `${a} 至 ${b}，台電即時資料每 2 小時取樣（${u}）；是取樣估計、不是官方年發電量，夏季為風力淡季。` + (part ? '部分併網點試運轉中，只計已列出裝置容量者。' : ''),
    fsPh: '搜尋風場、開發商、機型、國家或港口…', fsSt: '狀態', fsTy: '類型', fsMin: '容量', fsYear: '年份', fsSort: '排序', fsAny: '不限', fsName: '名稱',
    fsClear: '清除篩選', fsWorld: '改搜全球', fsScope: s => `範圍：${s}`, fsCount: (n, mw) => `符合 ${n} 座 · ${mw}`, fsAll: (n, mw) => `共 ${n} 座 · ${mw}`,
    fsMapOnly: '地圖只顯示符合條件的風場', fsHidden: (y, n) => `時間軸在 ${y} 年：其中 ${n} 座這一年不在地圖上（尚未完工、已除役，或是規劃中而未開啟「規劃中」）`, fsToLatest: '移到最新年份',
    fsHud: n => `🔍 篩選中：地圖只顯示符合的 ${n} 座風場`, fsNone: '沒有符合條件的風場。', fsKey: '按 / 開始搜尋',
    role: { marshalling: '組裝出港', foundation: '水下基礎製造', tower: '塔架製造', blade: '葉片製造', nacelle: '機艙組裝', cable: '海纜製造', floating: '浮動式組裝', om: '運維基地' },
    portTag: '港口', portDev: '開發中', portOld: '已停止', portSince: y => `${y} 年起`, portFarms: '服務過的風場', portOther: '其他專案：',
    portSrcT: '出處', portsHead: n => `收錄 ${n} 個港口`, portNone: '這個範圍沒有收錄的港口。', portsAll: '看全部港口 →', copyLinkPort: '複製此港口連結',
    portNote: '離岸風電的組裝出港、製造與運維港口（2026 年 9 月整理，每個港口附出處）。橘色錨＝使用中，虛線＝開發中，灰色＝離岸風電用途已停止。',
    btnEvents: '⚑ 事件', evTab: '事件', evCat: { ms: '里程碑', inc: '事故／故障', pol: '政策與社會' }, evPh: '搜尋事件、風場、國家、機型…',
    evHead: n => `收錄 ${n} 筆事件`, evNone: '這個範圍沒有符合的事件。', evLater: (y, n) => `時間軸在 ${y} 年：另有 ${n} 筆在之後`,
    evNote: '2026 年 9 月人工查證的重大事件與事故（每筆附主管機關或業主的一手來源）；時間軸到達事件年份才出現，2026 年的事件在最新年份顯示。紅色＝事故／故障，白色＝里程碑，紫色＝政策與社會。沒有座標的事件只列在這裡。',
    evStage: '階段', evMw: '風場規模', evMwEvent: '本次涉及', evFd: '基礎', evDeaths: n => `死亡 ${n} 人`, evInjured: n => `受傷 ${n} 人`,
    evCap: '容量口徑', evStart: '開工', evCod: '完成／商轉', evNoteT: '註記', evCoord: '座標說明', evPosFarm: '事件本身沒有座標，位置依對應風場標示。', evNoPos: '沒有座標，不標在地圖上。',
    evFarms: '相關風場', evOfFarm: '相關事件', evSrcT: '出處', evOrg: '主要來源', evChecked: d => `查證日期 ${d}`, evPhoto: '照片頁面（本站不轉載，權利見說明）', copyLinkEv: '複製此事件連結',
    evDatePrec: { m: '（月）', y: '（年）' }
  },
  en: {
    title: 'Global wind power map', vMap: 'Map', vSplit: 'Map + bars', vBars: 'Bar race', mGlobe: '3D globe', mFlat: '2.5D map',
    region: 'Focus', base: 'Basemap', bRelief: 'Relief', bSat: 'Satellite', bPlain: 'Plain', bWind: 'Wind speed', pipe: 'Pipeline', flow: 'Wind now', zones: 'Sea zones', rotate: 'Auto-rotate', tour: '▶ Tour', labels: 'Labels', sources: 'Sources',
    speed: 'Speed', layer: 'Show', lBoth: 'Onshore + offshore', lOn: 'Onshore only', lOff: 'Offshore only', lFd: 'Offshore: foundations',
    fdTitle: 'Foundation type', fdGroup: { mp: 'Monopile', frame: 'Steel frame', fl: 'Floating', other: 'Other fixed', unk: 'Type unknown' },
    fdGroupTip: { mp: 'Monopile', frame: 'Jacket, tripod, tripile', fl: 'Floating: spar, semi-submersible, barge, tension-leg', other: 'Gravity-based, high-rise pile cap, cofferdam, rock-anchored, composite bucket, mixed', unk: 'Fixed-bottom offshore farms not yet checked' },
    fdCov: (n, t, p) => `Type known for ${n} of ${t} farms · ${p} of capacity`, fdIso: 'Click a group to show only it; click again for all', fdNoFarm: 'No operating offshore farms in scope',
    fdLabel: 'Foundation', fdUnknown: 'Type unknown (not yet checked)', fdFloatSub: 'sub-type to be checked', fdFlBy: 'Floating by type', fdSecond: 'second source', fdSrc: 'source', fdDoc: 'Farm-by-farm list',
    fdStep: 'Collected step by step: Europe, floating farms worldwide and Taiwan, Japan, Korea and the USA are done; China and Vietnam are under way, and farms not yet checked show as type unknown', fdProf: 'Foundations (operating offshore farms, by capacity)',
    dimDepth: 'Water depth', dimHub: 'Hub height', dimTower: 'Tower height', dimRotor: 'Rotor diameter', fdScaled: 'Drawn to scale from this farm’s water depth, hub height and rotor diameter; the close-up turbines use the same tower-to-rotor ratio.', fdPartScaled: 'Known values ({v}) to scale, the rest schematic.', fdDimSrc: 'dimension source', portArcs: 'Light-blue arcs on the map link the port to these farms',
    fdYears: 'Offshore capacity added per year (by foundation type)', fdYearsNote: 'By commissioning year, phased farms by phase; decommissioned farms still count in their year',
    hint: 'Drag to rotate · scroll to zoom (down to farms) · click a country or farm to fly there · Space = play/pause',
    hintTouch: 'One finger to rotate · pinch to zoom · tap a country or farm to fly there',
    barTitle: 'Cumulative capacity ranking (MW)', onshore: 'Onshore', offshore: 'Offshore', total: 'Total',
    barFoot: 'Year-end cumulative (MW) · click a bar to focus · Data: IRENA / OWID, GWEC, WFO, EWEA, BTM Consult (1980–99 estimated)',
    world: 'World', worldTotal: 'World total', countriesWith: 'countries with wind power', top15: n => 'World top ' + n, inRegion: n => 'Top ' + n + ' in region',
    cont: { Asia: 'Asia', Europe: 'Europe', 'North America': 'North America', 'South America': 'South America', Africa: 'Africa', Oceania: 'Oceania' },
    turbine: 'Turbine', farm: 'Farm', rotor: 'Rotor Ø', type: { onshore: 'onshore', offshore: 'offshore', floating: 'floating' },
    st: ['operating', 'construction', 'pre-construction', 'announced', 'retired'],
    srcTitle: 'Data sources & notes', msTitle: 'Milestones', farmsTab: 'Farms', profTab: 'Profile',
    msFocus: 'Click a milestone to jump to that year and fly there',
    play: 'Play', pause: 'Pause', farmLayer: 'Farm layer', farmShown: 'shown', farmNone: 'No farm-level data for this country yet',
    farmsLoading: 'Loading farm data…',
    dens: ['Off', 'Minimal', 'Standard', 'Detailed'],
    tbLabel: 'Turbines', tbModels: n => n + ' models', tbNote: 'The close-up uses the real turbine positions and sizes from USWTDB', tbSrcT: 'U.S. Wind Turbine Database (USGS / Lawrence Berkeley National Laboratory, public domain)', tbOsmNote: 'The close-up uses turbine positions mapped by OpenStreetMap volunteers; the count is the number of mapped turbines and may differ slightly from the real one', tbOsmCr: '© OpenStreetMap contributors', tbOsmT: 'OpenStreetMap data, Open Database License (ODbL)', tbDeNote: 'The close-up uses the turbine positions and sizes in the Federal Network Agency\'s Market Master Data Register (MaStR)', tbDeCr: '© Bundesnetzagentur | MaStR', tbDeT: 'German Federal Network Agency, Marktstammdatenregister; Data licence Germany – attribution – 2.0',
    coastLabel: 'Distance to shore', coastNote: 'Straight line to the nearest coastline, estimated from the Natural Earth 1:50m coastline (small islands not included)',
    actLabel: 'Actual yearly output', actCf: 'capacity factor', actNote: (mw, src, iso) => (iso === 'DNK' ? 'Metered generation from ' : iso === 'AUS' ? 'Sum of 5-minute measured output from ' : 'Net generation from ') + src + '; capacity factor on the ' + mw + ' MW ' + (iso === 'USA' ? 'nameplate capacity registered with the EIA' : iso === 'DNK' ? 'registered capacity of the turbines with published production' : iso === 'AUS' ? 'capacity registered with AEMO' : 'capacity stated by Taipower') + ', full years only' + (iso === 'AUS' ? '; measured output includes curtailment and self-curtailment at negative prices' : ''), actSrc: { USA: ['the U.S. EIA (Form EIA-923)', 'EIA-923', 'U.S. Energy Information Administration, Form EIA-923 monthly net generation by plant (public domain)'], TWN: ['Taipower open data on its own renewable stations (Taipower-owned farms only)', 'Taipower open data', 'Taiwan Power Company, generation of its own renewable stations (data.gov.tw 17140, Open Government Data License)'], DNK: ['the Danish Energy Agency\'s turbine register (production is published for company-owned turbines only)', 'Energistyrelsen', 'Energistyrelsen, Stamdataregister for vindkraftanlæg (Vinddata, Parkproduktion)'], AUS: ['the SCADA output of each unit published by the Australian Energy Market Operator (AEMO; MMS Data Model monthly archive)', 'AEMO', 'Australian Energy Market Operator (AEMO), MMS Data Model: DISPATCH_UNIT_SCADA, DUDETAIL (credited under AEMO\'s copyright permissions)'] },
    genLabel: 'Estimated yearly output', genNote: (cn, cf, y) => 'capacity × the ' + y + ' average wind capacity factor of ' + cn + ', ' + cf + '% (Ember); an estimate, not a measurement', genOff: '; offshore farms usually run above the national average',
    totalCap: 'Capacity', units: 'units', clickMore: 'Click to zoom in and see photo & links', clickFarm: 'Click to zoom in, draw all its turbines and see photo & links',
    wikiLoading: 'Looking up Wikipedia…', wikiNone: 'No matching Wikipedia article found — try the links below.', wikiOffline: 'Wikipedia is unreachable right now (offline or blocked) — try the links below.',
    lnkWiki: 'Wikipedia', lnkMap: 'Satellite map', lnkPhoto: 'Search photos', lnkGem: 'GEM project page', photoBy: 'Photo: ', photoWiki: 'Wikipedia article image', photoFarmOnly: n => 'Photo of the farm (' + n + '), not of the event',
    whyFirstOff: c => 'First offshore wind farm in ' + c, whyFirstOn: c => 'Earliest onshore wind farm in the dataset for ' + c, whyRecOff: c => 'Largest offshore wind farm in ' + c + ' when commissioned', whyRecOn: c => 'Largest onshore wind farm in ' + c + ' when commissioned', whyTop: c => 'One of the largest wind farms in ' + c,
    tourAuto: 'Auto tour (current focus)', tourStory: { tw: 'Taiwan\'s road to offshore wind', eu: 'Europe offshore: from Vindeby to gigawatts', cn: 'China\'s rise', fl: 'Floating wind' },
    tourStoryT: { tw: 'From two demonstration turbines in 2017 to gigawatt-scale farms: ten years of offshore wind in Taiwan', eu: 'From eleven 450 kW turbines in 1991 to 1.3 GW in one farm: how Europe scaled up offshore wind', cn: 'From Dabancheng to half the world\'s wind power: China in thirty years', fl: 'From one demonstrator to floating farms: taking turbines into deep water' },
    tourEnd: 'Tour finished', decom: 'decommissioned', yearUnknown: 'start year unknown', posStack: 'Schematic position: shares one point with {n} other records (usually a province or country centre used as a placeholder), so they are fanned out around it on the map; this is not the real location.', posApprox: 'Approximate location (as marked by the source).', tipStack: 'Schematic position (shared placeholder point)', expected: 'expected', pipeNote: 'Pipeline projects appear at the latest year',
    liveNow: 'Live output now', liveLegend: 'Green ring: farms with live data; rotors spin with their current output', liveSee: 'Live details', availability: 'availability', open: 'Open', more: 'Show more', search: 'Search farms',
    fAll: 'All', fOp: 'Operating', fPipe: 'Pipeline', sortMw: 'By size', sortYear: 'By year',
    profCap: 'Year-end total', profRank: 'World rank', profOnOff: 'Onshore / offshore', profTen: '10 years earlier', profGrowth: 'Growth', profShare: 'Share of world',
    profFarms: 'Farms in the dataset', profLargest: 'Largest farm', profEarliest: 'Earliest farm',
    tourCountry: '▶ Tour this country', seeFarms: 'Farm list', seeLive: 'Taiwan live dashboard →', noWebgl: 'This device cannot run 3D (WebGL); showing the bar race instead.',
    attrWind: 'Wind speed: Global Wind Atlas (DTU, World Bank, CC BY 4.0) · Borders: Natural Earth', windLegT: 'Mean wind speed at 100 m', flowLegT: 'Wind now', zoneLegT: 'Sea zones', zEezA: 'EEZ boundaries: agreed or ruled', zEezM: 'Median lines and 200 NM limits', zEezU: 'Unsettled or disputed (dashed)', zSites: 'Offshore wind areas: Taiwan potential sites, Japan promotion zones, North Sea countries', zSite: 'Potential site', zArea: 'Offshore wind area', zAreaSrc: 'Area sources (all simplified): ', zNote: 'Boundaries from Marine Regions (CC BY 4.0), simplified; they have no legal value and imply no position on any disputed area', zSkip: 'The Hsinchu County site is not drawn: its vertex order cannot be determined', zSrcE: 'Marine Regions', zSrcT: 'Energy Administration open data', zSrcA: 'other countries: see Sources', zErr: 'Sea zones failed to load (offline or data unavailable)', regionEmpty: y => 'The timeline is at ' + y + ' and no farm here was operating yet; move the timeline to the latest year to see them', flowLegSub: '10 m above ground; brighter = stronger', flowTime: t => 'Data time ' + t + ' (Taiwan time)', flowYearNote: y => 'The timeline is at ' + y + ', but the wind is today\'s weather, not that year\'s', flowSrc: 'NOAA GFS forecast (public domain)', windLegSrc: 'Global Wind Atlas 3 (DTU / World Bank Group, CC BY 4.0); land and up to about 200 km offshore, dark = no data',
    attrPlain: 'Borders: Natural Earth', credit: '© 2026 Dof Lab, NCUT', attrRelief: 'Relief & borders: Natural Earth', attrSat: 'Imagery: NASA Blue Marble · Borders: Natural Earth',
    attrTileRelief: 'Hillshade © Esri, USGS, NASA et al.', attrTileSat: 'Imagery © Esri, Vantor, Earthstar Geographics',
    worldCap: 'Year-end cumulative installed capacity', ltYear: y => y + ' (latest available)', ltCap: 'Latest official figures by country',
    ltWorld: (n, m) => n + ' countries have official figures for this year (up to ' + m + '); the rest carry last year-end',
    ltOk: (m, s) => 'as of ' + m + ' · ' + s, ltCarry: y => 'no official figure yet this year; carries end-' + y, ltEst: ' = the site\'s last year-end figure + this source\'s growth this year (estimate)', ltHatch: 'hatched = carries last year-end',
    pipeTab: 'Pipeline', pipeHead: 'Projects in the pipeline', gemTotals: 'GEM pipeline, Feb 2026 (country totals)',
    pipeCaveat: 'Status and timing change often; coordinates are mostly approximate. Projects and country totals: GEM Feb 2026, plus a list curated in Sep 2026 (Taiwan Round 3 zones, large European offshore projects, etc.).',
    pipeLegendT: 'Pipeline (dashed rings)', pipeInData: (n, mw) => `${n} projects in the data · ${mw}`, pipeSee: 'Pipeline list →',
    coverage: 'Farm-level coverage', covMapped: 'Mapped', covGap: 'Gap (not mapped)', covOver: 'Farm sum exceeds the national total (different scope)',
    lnkSrc: 'Source', tbd: 'timing TBD', auditSrc: 'Official statistics audit',
    lnkOsm: 'OpenStreetMap', lnkWd: 'Wikidata', lnkGwa: 'Wind resource map', lnkGwaT: 'Global Wind Atlas: mean wind speed and other wind-resource data at this site',
    rankHead: y => `Within the country · end of ${y}`, rankHeadPipe: 'Within the country · pipeline projects',
    rankOf: (cn, n) => `of ${n} operating farms listed for ${cn}`, rankOfPipe: (cn, n) => `of ${n} pipeline projects listed for ${cn}`,
    rankNo: k => `#${k}`, rankType: (t, k) => `#${k} ${t.toLowerCase()}`, shareOf: cn => `of ${cn}’s total installed wind capacity`,
    phTitle: 'Phases (dashed = not yet built at the timeline year)',
    near: 'Nearby farms (within 30 km)', nearNone: 'No other listed farm within 30 km.',
    sameOwner: 'Same developer', ownNote: 'Matched by owner name; sources spell names differently, so some may be missing. Same country first, then by capacity.',
    relMore: n => `Show all ${n}`, relMoreT: n => `Show all ${n}`, relCap: n => `${n} more not listed`,
    copyLink: 'Copy link to this farm', copyLinkMs: 'Copy link to this milestone', copied: 'Link copied ✓', copyFail: 'Could not copy automatically — copy the link below',
    report: 'Report a data error', reportT: 'Opens a GitHub issue (sign-in needed) pre-filled with the name, coordinates and link',
    btnSearch: '🔍 Search', btnPorts: '⚓ Ports', portsTab: 'Ports',
    btnOut: '📊 Output', outTitle: 'Wind farm output', outGen: 'Total output', outCf: 'Capacity factor', outModel: 'Same turbine model', outYear: 'Year',
    outHigh: 'High → low', outLow: 'Low → high', outByN: 'By farm count', outByMed: 'By median', outPh: 'Find a farm or model…', outMed: 'Median', outMedM: 'Dashed line = median for the model',
    outSum: (y, n, g, m) => `${y} · ${n} farms with measured yearly output · ${g} in total · median capacity factor ${m}%`,
    outCov: (iso, y, n, mw, k, kmw, p) => iso === 'TWN' ? `The site lists ${n} farms (${mw}) operating in Taiwan at the end of ${y}; only the ${k} Taipower-owned farms (${kmw}, about ${p}%) have official per-farm yearly output. Private farms (including every offshore farm except Taipower Offshore Phase 1) have no official per-farm figures and are not ranked; their output right now is on the Taiwan live page.`
      : iso === 'AUS' ? `The site lists ${n} Australian farms (${mw}) operating at the end of ${y}; ${k} of them (${kmw}, about ${p}%) have a full year measured by AEMO. Only farms on the eastern grid (NEM) have AEMO data, not those in Western Australia or the Northern Territory; units are matched to the site's farms through AEMO's registration list (the same mapping as the live output), and units covering several farms or farms whose AEMO registered capacity differs from the record by 15% or more are left out. New farms often connect in stages and are held to part of their output by AEMO for six months to a year, so a year is left out when the farm was not yet generating in January of the year before or its registered capacity changed. Measured output includes curtailment and self-curtailment at negative prices.`
      : iso === 'DNK' ? `The site lists ${n} Danish farms (${mw}) operating at the end of ${y}; ${k} of them (${kmw}, about ${p}%) match metered output published by the Danish Energy Agency. The agency publishes production for company-owned turbines only, not for those owned by private persons, sole proprietors or partnerships; turbines are matched to the site's farms by location, a farm is used only when their capacity is within 15% of its record (a larger gap usually means unpublished turbines), and years with turbines connected or decommissioned are left out; the capacity factor uses the registered capacity of the turbines with published production.`
      : `The site lists ${n} US farms (${mw}) operating at the end of ${y}; ${k} of them (${kmw}, about ${p}%) have a full year of measured EIA-923 output. EIA plants spread over several farms, farms whose USWTDB and EIA capacities differ by 10% or more, and years with turbines added or retrofitted are left out; the capacity factor uses the capacity registered with the EIA.`,
    outNote: { gen: () => 'Yearly output = net generation in that year. Larger farms usually produce more; to compare output per MW, see "Capacity factor".', cf: () => 'Capacity factor = yearly output ÷ (rated capacity × the hours in the year: 8,760, or 8,784 in a leap year). It mostly reflects the wind at the site, and also downtime, curtailment and the turbine. The dashed line is the median.',
      model: iso => 'Only models that are the sole model of a whole farm, used by two or more farms with measured output in that year. Each dot is a farm: click it to fly there, or press ▾ to list the farms. ' + (iso === 'TWN' ? 'Taiwanese models come from the site\'s farm records; farms whose Taipower station capacity differs from the record by 3% or more (it may include other machines), such as Changgong, are left out, as are the mixed-model Taichung Port and Datan. ' : iso === 'DNK' ? 'Danish models are grouped by make + rotor diameter + unit rating from the agency\'s register (one model is spelled several ways). ' : iso === 'AUS' ? 'Australian models come from the site\'s farm records (most records have none), only when AEMO\'s registered capacity is within 3% of the record. ' : 'Models come from USWTDB (same model and unit rating). ') + 'Differences within a model mostly come from the wind, hub height and downtime or curtailment, not the machine alone.' },
    outGrp: (n, m, lo, hi) => `${n} farms · median ${m}% · ${lo}–${hi}%`, outExpand: 'List the farms', outNoModel: 'No turbine model is used by two or more farms with data in this year.',
    outRank: (y, a, n, b) => `${y}: capacity factor #${a} of ${n}, output #${b}`, outSee: 'See rankings →', outCountry: '📊 Output rankings',
    outIso: { TWN: 'Taiwan · official yearly', TWS: 'Taiwan · live samples', USA: 'United States', AUS: 'Australia', DNK: 'Denmark · farms', DKT: 'Denmark · single turbines' }, outGenS: 'Average output', outPer: 'Period', outData: 'Data',
    outSumT: (y, n, g, m) => `${y} · ${n} turbines with measured yearly output · ${g} in total · median capacity factor ${m}%`,
    outCovT: (y, n) => `The Danish Energy Agency publishes monthly production for company-owned turbines (not for those owned by private persons, sole proprietors or partnerships); farms metered as a whole (Horns Rev and Anholt, for example) only have a farm total, under "Denmark · farms". Listed here: ${n} individually metered turbines that ran all of ${y}; the capacity factor uses the registered unit rating, and values outside 5–65% (mostly downtime or data errors) are left out.`,
    outCreditAU: 'Source: Australian Energy Market Operator (AEMO), MMS Data Model (DISPATCH_UNIT_SCADA, DUDETAIL)', outTermsAU: 'AEMO copyright permissions',
    outCredit: m => 'Data: Energistyrelsen (Danish Energy Agency), Stamdataregister for vindkraftanlæg (turbine register, Vinddata and Parkproduktion)' + (m ? ', retrieved ' + m : ''), outTerms: 'terms of use', outTurbErr: 'The single-turbine data could not be loaded.',
    outNoteT: { gen: () => 'Yearly output = metered production in that year. Larger turbines usually produce more; to compare output per MW, see "Capacity factor".',
      cf: () => 'Capacity factor = yearly output ÷ (registered unit rating × the hours in the year: 8,760, or 8,784 in a leap year). It mostly reflects the wind at the site and the hub height, and also downtime and age. The dashed line is the median.',
      model: () => 'Grouped by make + rotor diameter + unit rating from the register (one model is spelled several ways; the name is the most common spelling), only groups with 5 or more turbines reporting in that year. Each dot is a turbine, drawn as a distribution (1-point bins) when there are many; click to fly to the turbine, or press ▾ to list them. Differences within a model mostly come from the wind, hub height and downtime.' },
    outGrpT: (n, m, lo, hi) => `${n} turbines · median ${m}% · ${lo}–${hi}%`, outExpandT: 'List the turbines', outPhT: 'Find a municipality or model…',
    outSpec: (rd, u) => `rotor ${rd} m · ${u} each`, outConn: y => `connected ${y}`, outBin: (a, n) => `capacity factor ${a}–${a + 1}%: ${WW.int(n)} turbine${n === 1 ? '' : 's'}`,
    turbNoModel: 'Model unknown', turbMuni: m => `${m} Municipality`, turbTag: 'Single turbine',
    turbNote: u => `Metered production from the Danish Energy Agency's turbine register; capacity factor on the registered unit rating of ${u}, full years only.`,
    turbRank: (y, a, n) => `${y}: capacity factor #${a} of ${n} individually metered Danish turbines.`,
    outPerOpt: (v, first) => v === 'all' ? `All (since ${first})` : `Last ${v} days`,
    outSumS: (a, b, n, k, m) => `${a} to ${b} · ${n} samples · ${k} grid units · median capacity factor ${m}%`,
    outSrcS: ['Taipower live data', 'Taiwan Power Company, real-time generation by unit (data.gov.tw 8931, Open Government Data License)'],
    outCovS: sk => 'Grid units as named in Taipower\'s live data (Greater Changhua 1 & 2a, for example, is split into two units), private farms included. The scraper records each unit\'s instantaneous output about every 2 hours; average output is the mean of these samples, and the capacity factor counts only times when Taipower lists the unit\'s capacity. Checked against July 2026, the sampled capacity factors of Taipower\'s 7 own farms are within 0–2 percentage points of the official monthly generation.' +
      (sk.length ? ' Not ranked (in testing or too few samples): ' + sk.join(', ') + '.' : '') + ' Taipower\'s "other Taipower-owned" and "other purchased wind" rows combine several farms and are left out.',
    outSampErr: 'The live sample archive could not be loaded.',
    outNoteS: { gen: () => 'Average output = mean of the sampled outputs over the period (MW): an estimate from instantaneous values, not official generation. Larger units usually score higher; to compare efficiency, see "Capacity factor".',
      cf: () => 'Sampled capacity factor = sum of sampled output ÷ sum of listed capacity at the same times. It reflects only the chosen period: Taiwan\'s windy season is the winter monsoon, so summer (about May–September) values are far below the yearly figure. The dashed line is the median.',
      model: () => 'Only models that are the sole model of the unit\'s farm, with two or more units reporting; units of one farm appear side by side. Each dot is a grid unit; click it to fly to its farm. Differences mostly come from the wind, location and downtime, not the machine alone.' },
    outSmp: n => `${n} samples`, outGrpS: (n, m, lo, hi) => `${n} units · median ${m}% · ${lo}–${hi}%`,
    sampLabel: 'Live samples (last 90 days)', sampVal: (o, c) => `average output ${o} · capacity factor ${c}%`,
    sampNote: (a, b, u, part) => `${a} to ${b}, Taipower live data sampled every 2 hours (${u}); an estimate from samples, not official yearly generation, and summer is the low-wind season.` + (part ? ' Some units are still in testing; only units with a listed capacity count.' : ''),
    fsPh: 'Search farms, developers, turbines, countries or ports…', fsSt: 'Status', fsTy: 'Type', fsMin: 'Size', fsYear: 'Year', fsSort: 'Sort', fsAny: 'Any', fsName: 'Name',
    fsClear: 'Clear filters', fsWorld: 'Search worldwide', fsScope: s => `Scope: ${s}`, fsCount: (n, mw) => `${n} matching · ${mw}`, fsAll: (n, mw) => `${n} farms · ${mw}`,
    fsMapOnly: 'The map shows only the matching farms', fsHidden: (y, n) => `Timeline at ${y}: ${n} of them are not on the map for this year (not built yet, decommissioned, or pipeline projects with “Pipeline” off)`, fsToLatest: 'Go to the latest year',
    fsHud: n => `🔍 Filter on: the map shows only the ${n} matching farms`, fsNone: 'No farms match.', fsKey: 'Press / to search',
    role: { marshalling: 'Marshalling', foundation: 'Foundations', tower: 'Towers', blade: 'Blades', nacelle: 'Nacelles', cable: 'Cables', floating: 'Floating assembly', om: 'O&M base' },
    portTag: 'Port', portDev: 'in development', portOld: 'no longer active', portSince: y => `since ${y}`, portFarms: 'Wind farms served', portOther: 'Other projects: ',
    portSrcT: 'Sources', portsHead: n => `${n} ports listed`, portNone: 'No listed ports in this area.', portsAll: 'All ports →', copyLinkPort: 'Copy link to this port',
    portNote: 'Offshore wind marshalling, manufacturing and O&M ports (compiled Sep 2026, each with sources). Orange anchor = in use, dashed = in development, grey = offshore wind role has ended.',
    btnEvents: '⚑ Events', evTab: 'Events', evCat: { ms: 'Milestone', inc: 'Incident / failure', pol: 'Policy & society' }, evPh: 'Search events, farms, countries, turbines…',
    evHead: n => `${n} events listed`, evNone: 'No matching events in this area.', evLater: (y, n) => `Timeline at ${y}: ${n} more happen later`,
    evNote: 'Major events and incidents verified by hand in Sep 2026 (each with a primary source from a regulator or the owner); an event appears once the timeline reaches its year, and 2026 events show at the latest year. Red = incident / failure, white = milestone, purple = policy & society. Events without coordinates are listed here only.',
    evStage: 'Stage', evMw: 'Farm size', evMwEvent: 'Affected', evFd: 'Foundation', evDeaths: n => `${n} dead`, evInjured: n => `${n} injured`,
    evCap: 'Capacity basis', evStart: 'Start', evCod: 'Completion / operation', evNoteT: 'Note', evCoord: 'Coordinates', evPosFarm: 'The event has no coordinates of its own; it is placed at the linked farm.', evNoPos: 'No coordinates; not shown on the map.',
    evFarms: 'Related farms', evOfFarm: 'Related events', evSrcT: 'Sources', evOrg: 'Main source', evChecked: d => `verified ${d}`, evPhoto: 'Photo page (not reproduced here; see rights note)', copyLinkEv: 'Copy link to this event',
    evDatePrec: { m: '(month)', y: '(year)' }
  }
};
let lang = WW.lang;
/* 單檔公開版（tools/build_globe_lite.py）：只有陸域、離岸與規劃中三個基本圖層——不載入港口、水下基礎、事件、里程碑導覽與即時出力 */
const LITE = !!(WW.standalone && WW.standalone.lite);
const T = k => I18N[lang][k];
const L = (zh, en) => lang === 'en' ? en : zh;

/* ================= markup ================= */
const loadingEl = $('globe-loading');     // 資料載入完成前保留「載入中」遮罩
host.innerHTML = `
<div id="g-top">
  <span class="gtitle" data-gi="title"></span>
  <div class="gseg" id="g-viewSeg" role="group"><button data-view="map" class="active" data-gi="vMap"></button><button data-view="split" data-gi="vSplit"></button><button data-view="bars" data-gi="vBars"></button></div>
  <div class="gseg" id="g-modeSeg" role="group"><button data-mode="globe" class="active" data-gi="mGlobe"></button><button data-mode="flat" data-gi="mFlat"></button></div>
  <div class="ggrp"><label for="g-regionSel" data-gi="region"></label><select id="g-regionSel"></select></div>
  <button id="g-btnSearch" type="button" data-gi="btnSearch"></button>
  <button id="g-btnOut" type="button" data-gi="btnOut" aria-haspopup="dialog"></button>
  <div class="ggrp"><label for="g-baseSel" data-gi="base"></label><select id="g-baseSel"><option value="relief" data-gi="bRelief"></option><option value="sat" data-gi="bSat"></option><option value="plain" data-gi="bPlain"></option><option value="wind" data-gi="bWind"></option></select></div>
  <button id="g-btnPipe" type="button" aria-pressed="true" data-gi="pipe"></button>
  <button id="g-btnFlow" type="button" aria-pressed="false" data-gi="flow"></button>
  <button id="g-btnZones" type="button" aria-pressed="false" data-gi="zones"></button>
  <button id="g-btnPorts" type="button" aria-pressed="true" data-gi="btnPorts"></button>
  <button id="g-btnEvents" type="button" aria-pressed="true" data-gi="btnEvents"></button>
  <span class="gsp"></span>
  <button id="g-btnRotate" type="button" aria-pressed="false" data-gi="rotate"></button>
  <span class="gtourwrap"><button id="g-btnTour" type="button" data-gi="tour" aria-haspopup="true"></button><span id="g-tourMenu" hidden></span></span>
  <div class="ggrp"><label for="g-densSel" data-gi="labels"></label><select id="g-densSel"><option value="0"></option><option value="1" selected></option><option value="2"></option><option value="3"></option></select></div>
  <button id="g-btnSources" type="button" data-gi="sources"></button>
</div>
<div id="g-stage" class="mapOnly">
  <div id="g-mapPane">
    <canvas id="g-gl" aria-label="3D globe"></canvas>
    <div id="g-ports" aria-hidden="true"></div>
    <div id="g-events" aria-hidden="true"></div>
    <div id="g-labels"></div>
    <div id="g-yearBig">1980<small></small></div>
    <div id="g-worldStat"></div>
    <div id="g-msPanel">
      <div class="ph"><span class="gseg" role="tablist"><button id="g-tabProf" type="button" data-gi="profTab"></button><button id="g-tabMs" type="button" class="active" data-gi="msTitle"></button><button id="g-tabFarms" type="button" data-gi="farmsTab"></button><button id="g-tabPipe" type="button" data-gi="pipeTab"></button><button id="g-tabPorts" type="button" data-gi="portsTab"></button><button id="g-tabEvents" type="button" data-gi="evTab"></button></span><button id="g-msToggle" type="button" aria-label="collapse">–</button></div>
      <div class="gpbody prof" id="g-profBody" hidden></div>
      <div class="gpbody" id="g-msList"></div>
      <div class="gpbody" id="g-farmList" hidden></div>
      <div class="gpbody" id="g-pipeList" hidden></div>
      <div class="gpbody" id="g-portList" hidden></div>
      <div class="gpbody" id="g-evList" hidden></div>
    </div>
    <div id="g-pipeLegend" hidden></div><div id="g-liveLegend" hidden></div><div id="g-fdLegend" hidden></div><div id="g-windLegend" hidden></div><div id="g-flowLegend" hidden></div><div id="g-zoneLegend" hidden></div><div id="g-hint"></div><div id="g-attr"></div><div id="g-notice" role="status"></div><div id="g-tip"></div>
    <div id="g-infoCard" role="dialog"><button class="gx" type="button" aria-label="close">✕</button><div class="cb"></div>
      <div id="g-tourBar"><button class="tprev" type="button" aria-label="previous">⏮</button><button class="tp" type="button" aria-label="pause">❚❚</button><button class="tnext" type="button" aria-label="next">⏭</button><span class="cnt"></span><div class="prog"><i></i></div><button class="tx" type="button" aria-label="exit">✕</button></div>
    </div>
  </div>
  <div id="g-barPane"><div class="gin">
    <div id="g-barHead"><h2 data-gi="barTitle"></h2><div class="yr" id="g-barYear">1980</div></div>
    <div class="glegend"><span><i class="gsw" style="background:var(--on)"></i><span data-gi="onshore"></span></span><span><i class="gsw" style="background:var(--off)"></i><span data-gi="offshore"></span></span><span id="g-barScope"></span></div>
    <div id="g-bars"><div id="g-axis"></div></div>
    <div id="g-barFoot" data-gi="barFoot"></div>
  </div></div>
</div>
<div id="g-bottom">
  <button id="g-play" type="button">▶</button>
  <div id="g-yearNow">1980</div>
  <input type="range" id="g-slider" min="1980" max="2026" step="0.02" value="1980">
  <div class="ggrp"><label for="g-speedSel" data-gi="speed"></label><select id="g-speedSel"><option value="0.1"></option><option value="0.2"></option><option value="0.333"></option><option value="0.5"></option><option value="1" selected></option><option value="2"></option><option value="4"></option></select></div>
  <div class="ggrp"><label for="g-layerSel" data-gi="layer"></label><select id="g-layerSel"><option value="both" data-gi="lBoth"></option><option value="on" data-gi="lOn"></option><option value="off" data-gi="lOff"></option><option value="fd" data-gi="lFd"></option></select></div>
</div>
<div id="g-modal"><div class="box"><button class="gclose" id="g-modalClose" type="button" aria-label="close">✕</button><div id="g-modalBody"></div></div></div>`;
if (loadingEl) { loadingEl.classList.add('gload'); host.appendChild(loadingEl); }

/* ================= helpers ================= */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const D2R = Math.PI / 180;
const esc = WW.esc;
/* 容量一律以 MW 顯示（千分位），數字更有感 */
const fmtMW = mw => (mw < 10 ? (Math.round(mw * 10) / 10).toLocaleString('en-US') : WW.int(mw)) + ' MW';
const fmtAxis = mw => WW.int(mw);
const cname = c => lang === 'zh' ? c.zh : c.name;
const fname = f => (lang === 'zh' && f.zh) ? f.zh : f.name;
const isTouch = matchMedia('(pointer: coarse)').matches;

let D = null, YEARS, Y0, Y1, C, byIso = {}, DATA_Y, LT = null;     // DATA_Y：年度統計的最後一年；LT：之後的「最新可得」年份
const S = { year: 1980, playing: false, speed: 1, mode: 'globe', view: 'map', region: 'WORLD', layer: 'both', rotate: false, density: 1, lastT: 0, modeT: 0,
  pipe: WW.store.get('ww_globe_pipe', '1') === '1', base: WW.store.get('ww_globe_base', 'relief') };
if (!['relief', 'sat', 'plain', 'wind'].includes(S.base)) S.base = 'relief';
let active = false, running = false, farmsReady = false, firstEnter = true;

function valAt(arr, y) {
  const i = Math.floor(y) - Y0;
  if (i <= 0) return arr[0] * clamp(y - Y0 + 1, 0, 1);
  if (i >= arr.length - 1) return arr[arr.length - 1];
  return arr[i] + (arr[i + 1] - arr[i]) * (y - Math.floor(y));
}
const atLT = () => !!LT && Math.floor(S.year + 1e-6) >= LT.year;        // 時間軸在「最新可得」年份
const carried = c => atLT() && !c.lt;                                   // 這一國還沒有今年的官方數字
function ltLine(c) {                                                    // 國家：今年數字的來源或「沿用去年底」
  if (!atLT()) return '';
  if (!c) return T('ltWorld')(LT.n, LT.range);
  return c.lt ? T('ltOk')(c.lt.asof, c.lt.src[lang === 'zh' ? 0 : 1]) : T('ltCarry')(DATA_Y);
}
function capOf(c, y) {
  const on = valAt(c.on, y), off = valAt(c.off, y);
  const a = S.layer === 'off' || S.layer === 'fd' ? 0 : on, b = S.layer === 'on' ? 0 : off;
  return { on: a, off: b, tot: a + b };
}
function inScope(iso, region) {
  region = region || S.region;
  if (region === 'WORLD') return true;
  if (region.startsWith('C:')) return !!byIso[iso] && byIso[iso].cont === region.slice(2);
  return iso === region;
}
const inRegion = c => inScope(c.iso);
function scopeName(region) {
  region = region || S.region;
  if (region === 'WORLD') return L('全球', 'the world');
  if (region.startsWith('C:')) return T('cont')[region.slice(2)];
  return byIso[region] ? cname(byIso[region]) : region;
}
function layerOk(type) { return S.layer === 'both' || (S.layer === 'on' ? type === 'onshore' : type !== 'onshore'); }
/* 地圖上要不要畫：水下基礎圖層只畫營運中的離岸風場（規劃中的虛線環顏色會和「其他固定式」「型式不詳」混淆），可再只看一組 */
function layerChanged() {
  clusters.forEach((g, f) => removeCluster(f));              // 風機群的材質依圖層不同，下一次更新時重建
  const pk = $('g-ports'); if (pk) pk.classList.toggle('fdm', S.layer === 'fd');   // 港口的橘色和「鋼構框架」太像：這一層改用中性樣式
}
function showFarm(f) { return layerOk(f.type) && (S.layer !== 'fd' || (!f.pipe && (!S.fdOnly || fdGroup(f) === S.fdOnly))); }
const PIPE_HEX = [0, 0xe3eaf5, 0x9fb0c9, 0x6a7c97];                // 興建中 → 前期開發 → 已宣布（有序，越接近完工越亮）
const stCls = f => f.st === 1 ? 'p1' : f.st === 2 ? 'p2' : f.st === 3 ? 'p3' : f.st === 4 ? 'ret' : (f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'floating' : 'off');

/* ================= boot ================= */
let THREEOK = true;
let STATS = null;                                                 // data/global/country_stats.json：各國容量因數（tools/build_country_stats.py）
const ready = Promise.all([WW.globalData(), WW.getJSON(WW.DATA.borders), WW.getJSON(WW.DATA.stats).catch(() => null)]).then(([G, B, ST]) => {
  STATS = ST;
  D = Object.assign({}, G, { borders: B.borders, ringIso: B.ringIso, farms: [] });
  DATA_Y = G.years[G.years.length - 1];
  // 「最新可得」年份（country_stats.json 的 latest）：有今年官方數字的國家用它，其他國家沿用去年底（c.lt＝null）。
  // 首頁也用同一份 wind_global.json：這裡複製陣列與國家物件，不改到共用的資料
  LT = ST && ST.latest && ST.latest.year === DATA_Y + 1 ? ST.latest : null;
  if (LT) {
    D.years = G.years.concat([LT.year]);
    D.countries = G.countries.map(c => { const u = LT.countries[c.iso] || null, k = c.on.length - 1;
      return Object.assign({}, c, { on: c.on.concat([u ? u.on : c.on[k]]), off: c.off.concat([u ? u.off : c.off[k]]), lt: u }); });
    const ms = Object.values(LT.countries).map(u => u.asof).sort();
    LT.n = ms.length; LT.range = ms.length ? (ms[0] === ms[ms.length - 1] ? ms[0] : ms[0] + '–' + ms[ms.length - 1].slice(5)) : '';
  }
  YEARS = D.years; Y0 = YEARS[0]; Y1 = YEARS[YEARS.length - 1]; C = D.countries;
  C.forEach(c => { byIso[c.iso] = c; });
  S.year = Y0;
  $('g-slider').min = Y0; $('g-slider').max = Y1;
  init();
  WW.getJSON(WW.DATA.farms).then(expandFarms).catch(e => { console.error(e); notice(L('風場資料載入失敗', 'Farm data failed to load')); });
  if (LITE) liteSetup(); else { loadPorts(); loadFoundations(); loadEvents(); }
});
/* 單檔公開版：藏起進階功能的按鈕與分頁，里程碑清空（地圖上的星號與導覽都不出現），圖層選單去掉水下基礎 */
function liteSetup() {
  D.milestones = [];
  ['g-btnPorts', 'g-btnEvents', 'g-btnTour', 'g-btnFlow', 'g-btnZones', 'g-viewSeg', 'g-tabProf', 'g-tabMs', 'g-tabPorts', 'g-tabEvents'].forEach(id => { const el = $(id); if (el) el.hidden = true; });
  const fd = $('g-layerSel').querySelector('option[value="fd"]'); if (fd) fd.remove();
  panelTab = 'farms';
}

const STACK_STEP = 0.045;     // 共用座標排開的間距（度，約 5 km）
const AGG_RE = /\bbase\b|cluster|corridor|aggregate|remainder|placeholder|smaller projects|unnamed/i;   // 整區彙總列的名稱
function expandFarms(J) {
  const TY = ['onshore', 'offshore', 'floating'];
  D.farms = J.rows.map(r => {
    const f = { name: r[0], zh: r[1] || null, iso: r[2], lat: r[3], lon: r[4], mw: r[5], year: r[6], type: TY[r[7]] || 'onshore', st: r[8],
      end: r[9] || null, owner: r[10] || null, turbine: r[11] || null, flags: r[12], src: r[13], ph: r[14] || null, note: r[15] || null, url: r[16] || null };
    if (f.flags & 2) { f.yu = true; f.year = DATA_Y; }
    if (f.st >= 1 && f.st <= 3) f.pipe = true;
    if (f.st === 4 && !f.end) f.end = f.year + 20;
    return f;
  });
  // 共用同一座標的紀錄（flags 4，多為省或國家中心的代用點）：以該點為中心、依容量由內而外排成向日葵狀，每一座才點得到；
  // 原座標留在 lat0／lon0（地圖連結用），卡片註明位置為示意
  const stacks = new Map();
  D.farms.forEach(f => { if (f.flags & 4) { const k = f.iso + '|' + f.lat + '|' + f.lon; if (!stacks.has(k)) stacks.set(k, []); stacks.get(k).push(f); } });
  stacks.forEach(list => {
    list.sort((a, b) => b.mw - a.mw || (a.name < b.name ? -1 : 1));
    const lat0 = list[0].lat, lon0 = list[0].lon, cl = Math.max(0.2, Math.cos(lat0 * Math.PI / 180));
    list.forEach((f, i) => {
      const r = STACK_STEP * Math.sqrt(i + 0.5), a = i * 2.39996;
      f.lat0 = lat0; f.lon0 = lon0; f.nStack = list.length;
      f.lat = lat0 + r * Math.cos(a); f.lon = lon0 + r * Math.sin(a) / cl;
    });
  });
  D.pipelineCuratedAsOf = J.meta && J.meta.pipeline_curated_asof;
  farmsByIso = {};
  D.farms.forEach(f => { (farmsByIso[f.iso] = farmsByIso[f.iso] || []).push(f); });
  farmsReady = true;
  farmLayerDirty = true;
  renderFarmList(true); renderProfile(); renderPipeList(true); renderOutput();
  if (pendingParams) { const p = pendingParams; pendingParams = null; applyParams(p, true); }
  if (cardItem && cardItem.kind === 'port') renderCard(cardItem);     // 港口卡片比風場資料先開：補上服務過的風場
  applyFoundations();
  warmOwners();
  layoutEvents();                                                 // 沒有座標的事件改用對應風場的位置
  if (panelTab === 'events') renderEventList(true);
  if (cardItem && cardItem.kind === 'event') { const e = cardItem.e; evFocus(e, true); renderCard(eventItem(e)); }
}
function notice(msg, ms) {
  const n = $('g-notice'); n.textContent = msg; n.style.display = 'block';
  clearTimeout(notice._t); notice._t = setTimeout(() => { n.style.display = 'none'; }, ms || 4200);
}

/* ================= three.js scene (built in init) ================= */
let renderer, scene, camera, vcam, controls, canvas, globe, atmo, plane, bordersG, bordersF, landTex, texCanvas, ambL;
const R = 100, FS = 1.6, KM = 0.015;
const G_MIN_ALT = 0.12, G_MAX_ALT = 520, CL_ALT = 3.2;
const OCEAN = '#0c1830', LAND = '#33486a';
let RINGS, RING_ISO, ringBox, isoRings;
let farmsByIso = {};
let W = 1, H = 1;

function init() {
  canvas = $('g-gl');
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.6 : 2));
  } catch (e) { renderer = null; THREEOK = false; }
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.5, 3000);
  vcam = new THREE.PerspectiveCamera(40, 1, 0.5, 3000);
  vcam.position.set(0, 60, 300);
  controls = new THREE.OrbitControls(vcam, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.5; controls.enablePan = false;
  controls.minDistance = 1; controls.maxDistance = 1e5;
  ambL = new THREE.AmbientLight(0xffffff, 0.55); scene.add(ambL);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(200, 250, 300); scene.add(sun);
  const fillL = new THREE.DirectionalLight(0x88aaff, 0.35); fillL.position.set(-200, -50, -100); scene.add(fillL);
  buildBase();
  buildBordersAll();
  buildSymbols();
  wireUI();
  applyI18n();
  setBase(S.base, true);
  if (!renderer) {
    S.view = 'bars'; setView('bars');
    document.querySelectorAll('#g-viewSeg button, #g-modeSeg button').forEach(b => { if (b.dataset.view !== 'bars') b.disabled = true; });
    notice(T('noWebgl'), 8000);
  }
  layoutAnchors();
  flyToRegion(true);
  syncYearUI(); updateBars(true);
  new ResizeObserver(() => resize()).observe($('g-mapPane'));
  resize();
}

/* ---------------- base texture & geometry ---------------- */
let TEXW = 4096, TEXH = 2048;
function buildBase() {
  const small = Math.min(screen.width, screen.height) < 820 || (navigator.deviceMemory && navigator.deviceMemory < 4) || (renderer && renderer.capabilities.maxTextureSize < 4096);
  if (small) { TEXW = 2048; TEXH = 1024; }
  texCanvas = document.createElement('canvas'); texCanvas.width = TEXW; texCanvas.height = TEXH;
  landTex = new THREE.CanvasTexture(texCanvas); landTex.anisotropy = 4;
  RINGS = D.borders; RING_ISO = D.ringIso;
  ringBox = RINGS.map(r => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (let i = 0; i < r.length; i += 2) { const x = r[i], y = r[i + 1]; if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; } return [a, b, c, d]; });
  isoRings = {}; RING_ISO.forEach((iso, i) => { if (iso) (isoRings[iso] = isoRings[iso] || []).push(i); });
  drawBaseTexture();
  globe = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 100), new THREE.MeshPhongMaterial({ map: landTex, shininess: 8, specular: 0x223344 })); scene.add(globe);
  atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 64, 48), new THREE.MeshBasicMaterial({ color: 0x3b8fe0, transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false })); scene.add(atmo);
  plane = new THREE.Mesh(new THREE.PlaneGeometry(360 * FS, 180 * FS), new THREE.MeshPhongMaterial({ map: landTex, shininess: 6, specular: 0x223344 }));
  plane.rotation.x = -Math.PI / 2; plane.visible = false; scene.add(plane);
}
function drawBaseTexture() {   // 向量繪製的陸地遮罩（「簡潔」底圖）
  const g = texCanvas.getContext('2d'), TW = TEXW, TH = TEXH;
  g.fillStyle = OCEAN; g.fillRect(0, 0, TW, TH);
  g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 1;
  for (let i = 0; i <= 12; i++) { g.beginPath(); g.moveTo(i * TW / 12, 0); g.lineTo(i * TW / 12, TH); g.stroke(); }
  for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(0, i * TH / 6); g.lineTo(TW, i * TH / 6); g.stroke(); }
  g.fillStyle = LAND;
  RINGS.forEach(r => { g.beginPath(); for (let i = 0; i < r.length; i += 2) { const x = (r[i] + 180) / 360 * TW, y = (90 - r[i + 1]) / 180 * TH; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.closePath(); g.fill(); });
  landTex.needsUpdate = true;
}
/* 底圖：地形（Natural Earth 陰影地形上色）／衛星（NASA Blue Marble）／簡潔（向量）／平均風速（Global Wind Atlas，tools/build_wind_resource.py） */
const BASE_URL = { relief: 'assets/img/globe/relief_', sat: 'assets/img/globe/sat_', wind: 'assets/img/globe/wind_' };
const baseTex = {}, baseImg = {};
function setBase(b, silent) {
  S.base = b; WW.store.set('ww_globe_base', b); $('g-baseSel').value = b;
  renderWindLegend();
  const apply = tex => { globe.material.map = tex; plane.material.map = tex; globe.material.needsUpdate = true; plane.material.needsUpdate = true; patchInfo = null; updateAttr(); };
  if (b === 'plain') { apply(landTex); return; }
  if (baseTex[b]) { apply(baseTex[b]); return; }
  const img = new Image(); img.decoding = 'async';
  img.onload = () => { const t = new THREE.Texture(img); t.anisotropy = 4; t.needsUpdate = true; baseTex[b] = t; baseImg[b] = img; if (S.base === b) apply(t); };
  img.onerror = () => { if (!silent) notice(L('底圖載入失敗，改用簡潔底圖', 'Basemap failed to load; using plain')); if (S.base === b) apply(landTex); };
  let src = BASE_URL[b] + (TEXW >= 4096 ? '4k' : '2k') + '.jpg';
  if (WW.standalone && !WW.standalone.url(src)) src = BASE_URL[b] + '2k.jpg';   // 單檔版只內嵌 2k 底圖
  img.src = WW.asset(src);
  apply(landTex);   // 載入前先用向量底圖
}
/* 平均風速圖例：分級與顏色讀 wind_resource.json（與底圖由同一支程式產生） */
let WR = null, wrP = null;
function renderWindLegend() {
  const el = $('g-windLegend'); if (!el) return;
  if (S.flow) renderFlowLegend();
  if (S.base !== 'wind') { el.hidden = true; return; }
  if (!WR) { if (!wrP) wrP = WW.getJSON(WW.DATA.windResource).then(j => { WR = j; renderWindLegend(); }).catch(e => { console.warn(e); wrP = null; }); return; }
  const e = WR.edges, lab = i => i === 0 ? '<' + e[0] : i === e.length ? '≥' + e[e.length - 1] : e[i - 1] + '–' + e[i];
  el.innerHTML = '<div class="wlh"><b>' + esc(T('windLegT')) + '</b> (m/s)</div><div class="wlbar">' +
    WR.colors.map((c, i) => '<span title="' + esc(lab(i) + ' m/s') + '"><i style="background:' + c + '"></i><em>' + esc(lab(i)) + '</em></span>').join('') + '</div>' +
    '<div class="wln"><a href="' + esc(WR.url) + '" target="_blank" rel="noopener">' + esc(T('windLegSrc')) + '</a></div>';
  el.hidden = false;
}
function updateAttr() {
  const tiles = patch && patch.visible && S.base !== 'plain' && tileAttrOn;
  const parts = [T('credit') + ' · v' + WW.VERSION, S.base === 'relief' ? T('attrRelief') : S.base === 'sat' ? T('attrSat') : S.base === 'wind' ? T('attrWind') : T('attrPlain')];
  if (S.flow) parts.push(L('風：NOAA GFS', 'Wind: NOAA GFS'));
  if (S.zones) parts.push(L('海域：Marine Regions（CC BY 4.0）、能源署與各國規劃單位（見「資料來源」）', 'Sea zones: Marine Regions (CC BY 4.0), Energy Administration and national planning bodies (see Sources)'));
  if (tiles) parts.push(S.base === 'sat' ? T('attrTileSat') : T('attrTileRelief'));
  $('g-attr').textContent = parts.join(' · ');
}

/* ---------------- coordinates ---------------- */
function globePos(lon, lat, h, out) {
  const phi = (lon + 180) * D2R, th = (90 - lat) * D2R, r = R + (h || 0);
  out = out || new THREE.Vector3();
  return out.set(-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th));
}
function flatPos(lon, lat, h, out) { out = out || new THREE.Vector3(); return out.set(lon * FS, h || 0, -lat * FS); }
function posAt(lon, lat, h, out) {
  out = out || new THREE.Vector3();
  if (S.modeT <= 0) return globePos(lon, lat, h, out);
  if (S.modeT >= 1) return flatPos(lon, lat, h, out);
  return out.copy(globePos(lon, lat, h)).lerp(flatPos(lon, lat, h), S.modeT);
}
const UP = new THREE.Vector3(0, 1, 0);
const _qg = new THREE.Quaternion(), _qid = new THREE.Quaternion(), _gp = new THREE.Vector3();
function quatAt(lon, lat, out) {
  out = out || new THREE.Quaternion();
  _qg.setFromUnitVectors(UP, globePos(lon, lat, 0, _gp).normalize());
  if (S.modeT <= 0) return out.copy(_qg);
  if (S.modeT >= 1) return out.identity();
  return out.copy(_qg).slerp(_qid, S.modeT);
}
/* 風機群本地座標（x, z）裡「往東」與「往北」的方向：地球儀上依 quatAt 的旋轉而定，平面模式是 +x 與 −z */
const _qe = new THREE.Quaternion(), _ve = new THREE.Vector3(), _vn = new THREE.Vector3(), _vc = new THREE.Vector3();
function localEN(lon, lat) {
  if (S.modeT >= 1) return { e: [1, 0], n: [0, -1] };
  globePos(lon, lat, 0, _vc); _qe.setFromUnitVectors(UP, _ve.copy(_vc).normalize()).invert();
  globePos(lon + 0.01, lat, 0, _ve).sub(_vc).normalize().applyQuaternion(_qe);
  globePos(lon, lat + 0.01, 0, _vn).sub(_vc).normalize().applyQuaternion(_qe);
  return { e: [_ve.x, _ve.z], n: [_vn.x, _vn.z] };
}
function xyzToLonLat(p) {
  if (S.mode === 'flat') return { lon: p.x / FS, lat: -p.z / FS };
  const r = p.length(); const lat = Math.asin(clamp(p.y / r, -1, 1)) / D2R;
  let lon = Math.atan2(p.z, -p.x) / D2R - 180; if (lon < -180) lon += 360; if (lon > 180) lon -= 360;
  return { lon, lat };
}
function curAlt() { return S.mode === 'globe' ? vcam.position.length() - R : vcam.position.distanceTo(controls.target); }
function focusLonLat() { return S.mode === 'globe' ? xyzToLonLat(vcam.position) : xyzToLonLat(controls.target); }

/* ---------------- borders & country highlight ---------------- */
function buildBorders(flat) {
  const pts = [], a = new THREE.Vector3(), b = new THREE.Vector3();
  RINGS.forEach(r => { for (let i = 0; i < r.length - 2; i += 2) {
    if (flat) { flatPos(r[i], r[i + 1], 0, a); flatPos(r[i + 2], r[i + 3], 0, b); } else { globePos(r[i], r[i + 1], 0, a); globePos(r[i + 2], r[i + 3], 0, b); }
    pts.push(a.x, a.y, a.z, b.x, b.y, b.z); } });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9db0cf, transparent: true, opacity: 0.4 }));
}
function buildBordersAll() {
  bordersG = buildBorders(false); bordersF = buildBorders(true);
  bordersF.visible = false; scene.add(bordersG, bordersF);
}
let hiLines = null, hiIso = null;
function setHighlight(iso) {
  hiIso = iso;
  if (hiLines) { scene.remove(hiLines); hiLines.geometry.dispose(); hiLines = null; }
  const idx = isoRings[iso]; if (!idx) return;
  const pts = [], a = new THREE.Vector3(), b = new THREE.Vector3();
  idx.forEach(k => { const r = RINGS[k]; for (let i = 0; i < r.length - 2; i += 2) { posAt(r[i], r[i + 1], 0, a); posAt(r[i + 2], r[i + 3], 0, b); pts.push(a.x, a.y, a.z, b.x, b.y, b.z); } });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  hiLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xf0c86a, transparent: true, opacity: 0.9 }));
  scene.add(hiLines);
}
function countryAt(lon, lat) {
  for (const iso in isoRings) {
    for (const k of isoRings[iso]) {
      const bx = ringBox[k]; if (lon < bx[0] || lon > bx[2] || lat < bx[1] || lat > bx[3]) continue;
      const r = RINGS[k]; let inside = false;
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
        if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
      }
      if (inside) return iso;
    }
  }
  return null;
}

/* ================= high-resolution detail patch (sharp coasts; Esri tiles when zoomed in) ================= */
const PW = 2048, PH = 2048;
let patchCanvas, patchTex, patchMat, patch = null, patchInfo = null, lastPatchT = 0, tileAttrOn = false;
const tileCache = new Map();          // key -> {img, ok}
let patchDirty = false;
function tileURL(z, x, y) {
  return S.base === 'sat'
    ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
    : `https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${z}/${y}/${x}`;
}
const tileLat = (y, z) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / Math.pow(2, z)))) / D2R;
function getTile(z, x, y, cb) {
  const key = S.base + '/' + z + '/' + x + '/' + y;
  let t = tileCache.get(key);
  if (t) { if (t.ok) return t.img; if (!t.failed) t.cbs.push(cb); return null; }
  const img = new Image(); img.crossOrigin = 'anonymous';
  t = { img, ok: false, failed: false, cbs: [cb] }; tileCache.set(key, t);
  img.onload = () => { t.ok = true; t.cbs.forEach(f => f(key)); t.cbs = []; };
  img.onerror = () => { t.failed = true; t.cbs = []; };
  img.src = tileURL(z, x, y);
  if (tileCache.size > 400) { const k0 = tileCache.keys().next().value; tileCache.delete(k0); }
  return null;
}
function drawTileInto(g, img, z, x, y, P) {
  // Web Mercator 圖磚 → 等距圓柱 patch：垂直分 8 條分別換算緯度，誤差可忽略
  const n = Math.pow(2, z), lonW = x / n * 360 - 180, lonE = (x + 1) / n * 360 - 180;
  const px0 = (lonW - P.lon0) * P.sx, pw = (lonE - lonW) * P.sx;
  const strips = 8;
  for (let s = 0; s < strips; s++) {
    const yt = y + s / strips, yb = y + (s + 1) / strips;
    const latT = tileLat(yt, z), latB = tileLat(yb, z);
    const py0 = (P.lat1 - latT) * P.sy, ph = (latT - latB) * P.sy;
    if (py0 > PH || py0 + ph < 0) continue;
    g.drawImage(img, 0, s * 256 / strips, 256, 256 / strips, px0, py0, pw, ph + 0.6);
  }
}
function drawPatch(lon0, lat0, lonSpan, latSpan) {
  const g = patchCanvas.getContext('2d');
  const lat1 = lat0 + latSpan, lon1 = lon0 + lonSpan;
  const P = { lon0, lat1, sx: PW / lonSpan, sy: PH / latSpan };
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const img = S.base !== 'plain' && baseImg[S.base];
  if (img) {
    // 先畫底圖貼圖的對應區塊（立即可見），跨越換日線時分兩段
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const sy0 = (90 - lat1) / 180 * ih, sh = latSpan / 180 * ih;
    const seg = (a, b, dx) => { const sx0 = (a + 180) / 360 * iw, sw = (b - a) / 360 * iw; g.drawImage(img, sx0, sy0, sw, sh, dx, 0, (b - a) * P.sx, PH); };
    if (lon0 < -180) { seg(lon0 + 360, 180, 0); seg(-180, lon1, (-180 - lon0) * P.sx); }
    else if (lon1 > 180) { seg(lon0, 180, 0); seg(-180, lon1 - 360, (180 - lon0) * P.sx); }
    else seg(lon0, lon1, 0);
  } else {
    g.fillStyle = OCEAN; g.fillRect(0, 0, PW, PH);
    g.fillStyle = LAND;
    for (let k = 0; k < RINGS.length; k++) {
      const bx = ringBox[k]; if (bx[2] < lon0 || bx[0] > lon1 || bx[3] < lat0 || bx[1] > lat1) continue;
      const r = RINGS[k]; g.beginPath();
      for (let i = 0; i < r.length; i += 2) { const x = (r[i] - lon0) * P.sx, y = (lat1 - r[i + 1]) * P.sy; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.closePath(); g.fill();
    }
  }
  patchTex.needsUpdate = true;
  tileAttrOn = false;
  if (S.base === 'plain' || S.base === 'wind' || latSpan > 30) { updateAttr(); return; }   // 風速底圖沒有對應的高解析圖磚
  // 圖磚：地形＝World_Hillshade 以色彩增值疊在深色地形上（海面不變）；衛星＝World_Imagery 再略為壓暗
  let z = Math.floor(Math.log2(PW / lonSpan * 360 / 256)) - (isTouch ? 1 : 0);
  z = clamp(z, 3, S.base === 'sat' ? 17 : 15);
  const n = Math.pow(2, z);
  const merc = lat => (1 - Math.log(Math.tan(clamp(lat, -85, 85) * D2R) + 1 / Math.cos(clamp(lat, -85, 85) * D2R)) / Math.PI) / 2 * n;
  const x0 = Math.floor((lon0 + 180) / 360 * n), x1 = Math.floor((lon1 + 180) / 360 * n);
  const y0 = Math.floor(merc(lat1)), y1 = Math.floor(merc(lat0));
  if ((x1 - x0 + 1) * (y1 - y0 + 1) > 100) { updateAttr(); return; }     // 2048 px 的 patch 最多約 9×9 張 256 px 圖磚
  const myInfo = patchInfo;
  let any = false;
  for (let x = x0; x <= x1; x++) for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++) {
    const xw = ((x % n) + n) % n;
    const im = getTile(z, xw, y, () => { if (patchInfo !== myInfo) return; drawOneWrapped(x, y); });
    if (im) { drawOneWrapped(x, y, im); any = true; }
  }
  function drawOneWrapped(x, y, imArg) {
    const xw = ((x % n) + n) % n; const t = tileCache.get(S.base + '/' + z + '/' + xw + '/' + y); const im = imArg || (t && t.img);
    if (!im) return;
    g.save();
    if (S.base === 'sat') { drawTileInto(g, im, z, x, y, P); g.globalAlpha = 0.08; g.fillStyle = '#000'; const lonW = x / n * 360 - 180; g.fillRect((lonW - lon0) * P.sx, 0, 360 / n * P.sx, PH); }
    else { g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.9; drawTileInto(g, im, z, x, y, P); }
    g.restore();
    patchDirty = true;
    if (!tileAttrOn) { tileAttrOn = true; updateAttr(); }
  }
  if (any) patchDirty = true;
  updateAttr();
}
function updatePatch(now) {
  if (!patchCanvas) {
    patchCanvas = document.createElement('canvas'); patchCanvas.width = PW; patchCanvas.height = PH;
    patchTex = new THREE.CanvasTexture(patchCanvas); patchTex.anisotropy = 4;
    patchMat = new THREE.MeshPhongMaterial({ map: patchTex, shininess: 8, specular: 0x223344 });
  }
  if (patchDirty) { patchTex.needsUpdate = true; patchDirty = false; }
  if (modeAnim) { if (patch) patch.visible = false; return; }
  const alt = curAlt(); const limit = S.base === 'plain' ? (S.mode === 'globe' ? 150 : 200) : (S.mode === 'globe' ? 60 : 90);
  if (alt > limit) { if (patch && patch.visible) { patch.visible = false; updateAttr(); } patchInfo = null; return; }
  if (now - lastPatchT < 300 && patchInfo) { if (patch) patch.visible = true; return; }
  const fc = focusLonLat();
  const latSpan = clamp(alt * 0.6 * 6.5, 0.8, 80);
  const lonSpan = Math.min(170, latSpan / Math.max(0.25, Math.cos(fc.lat * D2R)));
  if (patchInfo && patchInfo.mode === S.mode && patchInfo.base === S.base && Math.abs(fc.lat - patchInfo.clat) < patchInfo.latSpan * 0.18 && Math.abs(fc.lon - patchInfo.clon) < patchInfo.lonSpan * 0.18
     && latSpan / patchInfo.latSpan > 0.62 && latSpan / patchInfo.latSpan < 1.5) { if (patch) patch.visible = true; return; }
  lastPatchT = now;
  const lat0 = clamp(fc.lat - latSpan / 2, -89.5, 89.5 - latSpan), lon0 = fc.lon - lonSpan / 2;
  patchInfo = { mode: S.mode, base: S.base, clat: fc.lat, clon: fc.lon, latSpan, lonSpan };
  drawPatch(lon0, lat0, lonSpan, latSpan);
  let geo;
  if (S.mode === 'globe') geo = new THREE.SphereGeometry(R, 72, 72, (lon0 + 180) * D2R, lonSpan * D2R, (90 - (lat0 + latSpan)) * D2R, latSpan * D2R);
  else { geo = new THREE.PlaneGeometry(lonSpan * FS, latSpan * FS); geo.rotateX(-Math.PI / 2); geo.translate((lon0 + lonSpan / 2) * FS, 0, -(lat0 + latSpan / 2) * FS); }
  if (!patch) { patch = new THREE.Mesh(geo, patchMat); scene.add(patch); }
  else { patch.geometry.dispose(); patch.geometry = geo; }
  patch.visible = true;
  updateAttr();
}

/* ================= symbols: turbines, milestones, farm layer, clusters ================= */
let towerGeo, nacGeo, hubGeo, bladeGeo, ringGeo, discGeo, rotorGeo, dashRingGeo, thinRingGeo, thinDashGeo;
const COL = { on: 0xB8892F, onB: 0xe3b458, off: 0x3B8FE0, offB: 0x6fb3ff, fl: 0x1f9e8a, flB: 0x9be8d8 };
let surfaceRoot, countryRoot, msRoot, clusterRoot;
const cGroups = [];
let msMarkers = [];
let countryPicks = [];
function mergeGeos(parts) {
  const pos = [], nor = [];
  parts.forEach(([geo, m]) => { const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(m); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); });
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return out;
}
function makeTurbine(kind) {
  const col = kind === 'on' ? COL.on : COL.off, colB = kind === 'on' ? COL.onB : COL.offB;
  const mTower = new THREE.MeshPhongMaterial({ color: 0xdfe6f0, transparent: true });
  const mBlade = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: colB, emissiveIntensity: 0.25, transparent: true });
  const mNac = new THREE.MeshPhongMaterial({ color: col, transparent: true });
  const g = new THREE.Group();
  const tower = new THREE.Mesh(towerGeo, mTower), nac = new THREE.Mesh(nacGeo, mNac);
  const rotor = new THREE.Mesh(rotorGeo, mBlade); rotor.position.set(0, 1.0, 0.12);
  g.add(tower, nac, rotor);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, depthWrite: false }));
  const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, depthWrite: false }));
  g.add(ring, disc);
  g.userData = { kind, tower, nac, rotor, ring, disc, mats: [mTower, mBlade, mNac, ring.material, disc.material], h: 0, r: 0 };
  return g;
}
const heightOf = mw => mw <= 0 ? 0 : Math.max(1.2, 0.16 * Math.pow(mw, 0.40));
const radiusOf = mw => mw <= 0 ? 0 : Math.max(0.6, 0.02 * Math.sqrt(mw));
function buildSymbols() {
  towerGeo = new THREE.CylinderGeometry(0.035, 0.06, 1, 10); towerGeo.translate(0, 0.5, 0);
  nacGeo = new THREE.BoxGeometry(0.10, 0.09, 0.18); nacGeo.translate(0, 1.0, 0.02);
  hubGeo = new THREE.SphereGeometry(0.045, 10, 8);
  bladeGeo = new THREE.BoxGeometry(0.035, 0.52, 0.012); bladeGeo.translate(0, 0.28, 0);
  ringGeo = new THREE.RingGeometry(0.75, 1, 48); ringGeo.rotateX(-Math.PI / 2);
  thinRingGeo = new THREE.RingGeometry(0.95, 1, 72); thinRingGeo.rotateX(-Math.PI / 2);
  discGeo = new THREE.CircleGeometry(0.75, 48); discGeo.rotateX(-Math.PI / 2);
  rotorGeo = mergeGeos([[hubGeo, new THREE.Matrix4()], ...[0, 1, 2].map(i => [bladeGeo, new THREE.Matrix4().makeRotationZ(i * Math.PI * 2 / 3)])]);
  // 規劃中專案：虛線環（尚未蓋好，不畫風機）
  dashRingGeo = mergeGeos([...Array(14)].map((_, i) => [new THREE.RingGeometry(0.8, 1, 5, 1, i * Math.PI / 7, Math.PI / 7 * 0.58), new THREE.Matrix4()])); dashRingGeo.rotateX(-Math.PI / 2);
  surfaceRoot = new THREE.Group(); scene.add(surfaceRoot);
  countryRoot = new THREE.Group(); surfaceRoot.add(countryRoot);
  C.forEach(c => {
    const anchor = new THREE.Group(); const tOn = makeTurbine('on'), tOff = makeTurbine('off');
    anchor.add(tOn, tOff); anchor.userData = { c, tOn, tOff, dim: 1 };
    countryRoot.add(anchor); cGroups.push(anchor);
    [tOn, tOff].forEach(t => [t.userData.tower, t.userData.nac, t.userData.disc].forEach(m => { m.userData.anchor = anchor; }));
  });
  countryPicks = []; cGroups.forEach(a => { [a.userData.tOn, a.userData.tOff].forEach(t => countryPicks.push(t.userData.tower, t.userData.nac, t.userData.disc)); });
  msRoot = new THREE.Group(); surfaceRoot.add(msRoot);
  const pinGeo = new THREE.ConeGeometry(0.5, 2.2, 8), haloGeo = new THREE.RingGeometry(0.8, 1.1, 32);
  msMarkers = D.milestones.map(m => {
    const g = new THREE.Group();
    const pin = new THREE.Mesh(pinGeo, new THREE.MeshPhongMaterial({ color: 0xf0c86a, emissive: 0xf0c86a, emissiveIntensity: 0.5 }));
    pin.rotation.x = Math.PI; pin.position.y = 1.4;
    const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: 0xf0c86a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.15;
    g.add(pin, halo); g.visible = false; g.userData = { m, pin, halo };
    pin.userData.ms = m; msRoot.add(g); return g;
  });
  buildFarmLayer();
  clusterRoot = new THREE.Group(); surfaceRoot.add(clusterRoot);
  clusterMats = {
    on: { disc: new THREE.MeshBasicMaterial({ color: COL.on, transparent: true, opacity: 0.16, depthWrite: false }), ring: new THREE.MeshBasicMaterial({ color: COL.on, transparent: true, opacity: 0.55, depthWrite: false }), tower: new THREE.MeshPhongMaterial({ color: 0xe6ebf2 }), nac: new THREE.MeshPhongMaterial({ color: COL.on }), blade: new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: COL.onB, emissiveIntensity: 0.18 }) },
    off: { disc: new THREE.MeshBasicMaterial({ color: COL.off, transparent: true, opacity: 0.16, depthWrite: false }), ring: new THREE.MeshBasicMaterial({ color: COL.off, transparent: true, opacity: 0.6, depthWrite: false }), tower: new THREE.MeshPhongMaterial({ color: 0xe6ebf2 }), nac: new THREE.MeshPhongMaterial({ color: COL.off }), blade: new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: COL.offB, emissiveIntensity: 0.18 }) }
  };
  // 點選規劃中專案時畫成半透明「預定配置」：風機不轉，外圈為依狀態上色的虛線
  const ghost = () => new THREE.MeshPhongMaterial({ color: 0xdfe6f0, transparent: true, opacity: 0.38, depthWrite: false });
  [1, 2, 3].forEach(st => {
    clusterMats['p' + st] = { disc: new THREE.MeshBasicMaterial({ color: PIPE_HEX[st], transparent: true, opacity: 0.06, depthWrite: false }),
      ring: new THREE.MeshBasicMaterial({ color: PIPE_HEX[st], transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
      tower: ghost(), nac: ghost(), blade: ghost() };
  });
  clusterMats.liveRing = new THREE.MeshBasicMaterial({ color: LIVE_HEX, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
  thinDashGeo = mergeGeos([...Array(36)].map((_, i) => [new THREE.RingGeometry(0.96, 1, 3, 1, i * Math.PI / 18, Math.PI / 18 * 0.55), new THREE.Matrix4()])); thinDashGeo.rotateX(-Math.PI / 2);
}

/* ---------------- farm layer: InstancedMesh（營運中一組、規劃中一組） ---------------- */
const FARM_MAX = 6000, ROTOR_ANIM = 700;
const FL = { op: null, pp: null };
let farmLayerDirty = true, lastFarmBuild = 0, farmBuildKey = '';
let farmK = 1, farmRefAlt = 20;
const fHeight = mw => Math.max(0.16, 0.075 * Math.pow(mw, 0.35));
const fRadius = mw => Math.max(0.09, 0.013 * Math.sqrt(mw));
function makeInst(isPipe) {
  const mk = (geo, mat) => { const m = new THREE.InstancedMesh(geo, mat, FARM_MAX); m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return m; };
  const tower = isPipe ? null : mk(towerGeo, new THREE.MeshPhongMaterial({ color: 0xdfe6f0 }));
  const nac = isPipe ? null : mk(nacGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
  const rotor = isPipe ? null : mk(rotorGeo, new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x333333, emissiveIntensity: 0.4 }));
  const ring = mk(isPipe ? dashRingGeo : ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: isPipe ? 0.9 : 0.55, depthWrite: false, side: THREE.DoubleSide }));
  const disc = mk(discGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: isPipe ? 0.06 : 0.16, depthWrite: false }));
  const meshes = [tower, nac, rotor, ring, disc].filter(Boolean);
  // 先建立完整大小的逐實例顏色緩衝：three.js 在第一次繪製時決定著色器是否支援逐實例顏色（之後才加的會被忽略），
  // 而 setColorAt 會依當下的 count（此時為 0）配置緩衝，所以要自己配置 FARM_MAX 筆
  [nac, ring, disc].filter(Boolean).forEach(m => { m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(FARM_MAX * 3).fill(1), 3); m.instanceColor.setUsage(THREE.DynamicDrawUsage); });
  const grp = new THREE.Group(); grp.add(...meshes);
  return { grp, tower, nac, rotor, ring, disc, meshes, list: [], idx: new Map(), h: new Float32Array(FARM_MAX), r: new Float32Array(FARM_MAX), pos: [], quat: [], phase: new Float32Array(FARM_MAX), ang: 0, isPipe,
    spin: new Float32Array(FARM_MAX).fill(1), angF: new Float32Array(FARM_MAX) };
}
function buildFarmLayer() {
  FL.op = makeInst(false); FL.pp = makeInst(true);
  surfaceRoot.add(FL.op.grp, FL.pp.grp);
}
const _col = new THREE.Color();
/* 水下基礎：多於三種色相在地圖上分不清（dataviz 色盲檢查，--pairs all），所以依結構歸成三個色相＋兩個中性色：
   單樁（藍）、鋼構框架＝套管／三腳／三樁（橘）、浮動式（青綠）、其他固定式＝重力式／高樁承台／圍堰式／岩錨式／複合筒／混合（近白）、型式不詳（淺灰）。
   確切型式寫在卡片與提示框；圖例可只看一組。資料：data/global/foundations.json（tools/build_foundations.py） */
const FD_GROUPS = ['mp', 'frame', 'fl', 'other', 'unk'];
const FD_HEX = { mp: 0x3987e5, frame: 0xd95926, fl: 0x199e70, other: 0xdfe3ea, unk: 0xa7adb6 };
let FD = null;
function fdGroup(f) { return f.fd ? ((FD && FD.meta.types[f.fd.t]) || [0, 0, 'unk'])[2] : (f.type === 'floating' ? 'fl' : 'unk'); }
function fdTypeName(t) { const x = FD && FD.meta.types[t]; return x ? x[lang === 'zh' ? 0 : 1] : ''; }
function fdSubName(k) { const x = FD && FD.meta.subs[k]; return x ? x[lang === 'zh' ? 0 : 1] : ''; }
/* 型式文字：確切型式＋細分（吸力桶、單柱式…）＋混合型的組成 */
function fdText(f) {
  if (!f.fd) return f.type === 'floating' ? T('fdGroup').fl + L('（', ' (') + T('fdFloatSub') + L('）', ')') : T('fdUnknown');
  let s = fdTypeName(f.fd.t);
  if (f.fd.p) s += L('：', ': ') + f.fd.p.map(p => fdTypeName(p[0]) + ' ' + p[1]).join(L('、', ', '));
  if (f.fd.s) s += L('（', ' (') + fdSubName(f.fd.s) + L('）', ')');
  return s;
}
function loadFoundations() {
  return WW.getJSON(WW.DATA.foundations).then(j => { FD = j; applyFoundations(); }).catch(e => { console.error(e); });
}
function applyFoundations() {
  if (!FD || !farmsReady) return;
  const x = FD.x || {};
  D.farms.forEach(f => {
    if (f.type === 'onshore') return;
    if (FD.farms[f.name]) f.fd = FD.farms[f.name];
    else if (x[f.name]) f.fdx = x[f.name];                 // 查過但找不到可引用出處：卡片寫出理由
  });
  farmLayerDirty = true; fdLegendKey = '';
  if (S.layer === 'fd') layerChanged();
  if (panelTab === 'prof') renderProfile();
  if (cardItem && cardItem.kind === 'farm') renderCard(cardItem);
}
function farmColor(f) {
  if (f.pipe) return PIPE_HEX[f.st];
  if (S.layer === 'fd') return FD_HEX[fdGroup(f)];
  return f.type === 'onshore' ? COL.on : f.type === 'floating' ? COL.fl : COL.off;
}
/* 時間軸上的 Y.0 代表「Y 年底」：風場在商轉那一年的最後 BUILD 年內逐步蓋好，年底完工（與國家年底累計一致） */
const BUILD = 0.6;
const fAge = (f, y) => (y == null ? S.year : y) - f.year + BUILD;
function farmMwAt(f, y) {
  if (!f.ph) return f.mw;
  let s = 0; for (const p of f.ph) { if (!p[0] || p[0] - BUILD <= y) s += p[1]; }
  return s || f.ph[0][1];
}
function farmActive(f, y) {
  if (f.pipe) return S.pipe && y >= Y1 - 0.02;
  return fAge(f, y) >= 0 && !(f.end && y >= f.end);
}
/* 選出要畫的風場：選定國家的全部風場＋放大時視野內的風場（上限 FARM_MAX，依容量） */
function pickFarms() {
  if (!farmsReady) return [];
  if (fsActive()) { fsResults(); return fsCache.byMw.slice(0, FARM_MAX * 2); }     // 搜尋／篩選中：地圖與清單同一份結果
  const want = new Map();
  const iso = byIso[S.region] ? S.region : null;
  if (iso && farmsByIso[iso]) farmsByIso[iso].forEach(f => want.set(f, 1));
  const alt = curAlt();
  // 選了國家時只畫該國風場，拉得很近（跨境）才加入鄰國；全球／洲別視角放大即顯示視野內風場
  const zoomAlt = iso ? (S.mode === 'globe' ? 12 : 20) : (S.mode === 'globe' ? 45 : 70);
  if (alt < zoomAlt && !modeAnim) {
    const fc = focusLonLat(), cosl = Math.max(0.2, Math.cos(fc.lat * D2R));
    const rad = clamp(alt * (S.mode === 'globe' ? 0.9 : 0.55), 1.5, 40);
    for (const f of D.farms) {
      const dl = f.lat - fc.lat, dn = (f.lon - fc.lon) * cosl;
      if (dl * dl + dn * dn < rad * rad) want.set(f, 1);
    }
  }
  let arr = [...want.keys()];
  arr.sort((a, b) => b.mw - a.mw);
  if (arr.length > FARM_MAX * 2) arr = arr.slice(0, FARM_MAX * 2);
  return arr;
}
function rebuildFarmInstances(now, force) {
  if (!force && now - lastFarmBuild < 450) return;
  lastFarmBuild = now;
  const fc = focusLonLat(), alt = curAlt();
  const key = [S.region, S.mode, S.pipe, S.layer, farmsReady, liveOn(), fsRev, (fc.lat / Math.max(1, alt * 0.3)).toFixed(0), (fc.lon / Math.max(1, alt * 0.3)).toFixed(0), Math.round(Math.log2(Math.max(0.1, alt)) * 2)].join('|');
  if (!force && !farmLayerDirty && key === farmBuildKey) return;
  farmBuildKey = key; farmLayerDirty = false;
  const list = pickFarms();
  const byKind = { op: [], pp: [] };
  liveSeen = false;
  for (const f of list) {
    if (f.pipe) { if (S.pipe && byKind.pp.length < FARM_MAX) byKind.pp.push(f); }
    else if (byKind.op.length < FARM_MAX) byKind.op.push(f);
  }
  ['op', 'pp'].forEach(k => {
    const L2 = FL[k], nl = byKind[k], old = new Map(L2.list.map((f, i) => [f, i]));
    const h = new Float32Array(FARM_MAX), r = new Float32Array(FARM_MAX), angF = new Float32Array(FARM_MAX), spin = new Float32Array(FARM_MAX);
    nl.forEach((f, i) => { const j = old.get(f); if (j != null) { h[i] = L2.h[j]; r[i] = L2.r[j]; angF[i] = L2.angF[j]; } });
    L2.h = h; L2.r = r; L2.angF = angF; L2.spin = spin; L2.list = nl; L2.idx = new Map(nl.map((f, i) => [f, i]));
    const colored = [L2.nac, L2.ring, L2.disc].filter(Boolean);
    nl.forEach((f, i) => {
      _col.setHex(farmColor(f)); colored.forEach(m => m.setColorAt(i, _col)); L2.phase[i] = (i * 2.399) % 6.283;
      const lv = liveOn() && liveFor(f);
      spin[i] = lv ? spinOf(lv) : 1;
      if (lv && S.layer !== 'fd') { _col.setHex(LIVE_HEX); L2.ring.setColorAt(i, _col); liveSeen = true; }   // 有即時資料：外圈改為即時綠（水下基礎圖層不改，免得混淆）
    });
    colored.forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    L2.meshes.forEach(m => { m.count = nl.length; });
    layoutFarmKind(L2);
    L2._force = true;          // 每個 slot 都重寫矩陣，避免沿用上一座風場的矩陣（殘影）
  });
  const iso = byIso[S.region] ? S.region : null;
  if (iso) { const rc = regionCenter(); farmK = clamp(rc.span / 25, 0.8, 1.8); farmRefAlt = regionAlt(rc); }
  else { farmK = 1; farmRefAlt = 20; }
}
function layoutFarmKind(L2) {
  L2.pos = L2.list.map(f => posAt(f.lon, f.lat, 0));
  L2.quat = L2.list.map(f => quatAt(f.lon, f.lat));
}
function layoutFarms() { if (FL.op) { layoutFarmKind(FL.op); layoutFarmKind(FL.pp); } }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3(), _p3 = new THREE.Vector3(), _zAxis = new THREE.Vector3(0, 0, 1), _off = new THREE.Vector3();
const _m4b = new THREE.Matrix4(), _m4c = new THREE.Matrix4();
function animateFarmKind(L2, dt, farmScale) {
  const n = L2.list.length; if (!n) return;
  L2.ang += dt * 3;
  let dirty = false;
  const k = Math.min(1, dt * 4);
  for (let i = 0; i < n; i++) {
    const f = L2.list[i];
    const act = farmActive(f, S.year) && showFarm(f) && !clusters.has(f);     // 拉近時也保留一支風機；被點選、畫成風機群的那座才藏起來
    const mw = act ? farmMwAt(f, S.year) : 0;
    const hT = act ? fHeight(mw) * farmScale : 0, rT = act ? fRadius(mw) * farmScale : 0;
    const h0 = L2.h[i], r0 = L2.r[i];
    const h = Math.abs(hT - h0) < 1e-5 ? hT : h0 + (hT - h0) * k, r = Math.abs(rT - r0) < 1e-5 ? rT : r0 + (rT - r0) * k;
    const grow = h !== h0 || r !== r0 || L2._force;
    L2.h[i] = h; L2.r[i] = r;
    const q = L2.quat[i], p = L2.pos[i];
    if (grow) {
      const hs = h > 0.0003 ? h : 0;
      if (L2.tower) { _s.set(hs, hs, hs); _m4.compose(p, q, _s); L2.tower.setMatrixAt(i, _m4); L2.nac.setMatrixAt(i, _m4); }
      const age = fAge(f), pulse = (!f.pipe && !f.yu && age >= 0 && age < 1.5) ? 1 + (1.5 - age) * 0.4 : 1;
      const rs = h > 0.0003 ? r : 0;
      _s.set(rs * pulse, 1, rs * pulse); _m4.compose(p, q, _s); L2.ring.setMatrixAt(i, _m4);
      _s.set(rs, 1, rs); _m4.compose(p, q, _s); L2.disc.setMatrixAt(i, _m4);
      dirty = true;
    }
    if (L2.rotor && (i < ROTOR_ANIM || grow)) {
      const hs = h > 0.0003 ? h : 0;
      // rotor：位置在塔頂前方，繞本地 Z 軸旋轉
      _off.set(0, hs, 0.12 * hs).applyQuaternion(q);
      _p3.copy(p).add(_off);
      if (!f.pipe) L2.angF[i] += dt * 3 * L2.spin[i];          // 有即時資料的風場：轉速依此刻出力
      _q2.setFromAxisAngle(_zAxis, (f.pipe ? 0 : L2.angF[i]) + L2.phase[i]);
      _q.copy(q).multiply(_q2);
      _s.set(hs, hs, hs); _m4.compose(_p3, _q, _s); L2.rotor.setMatrixAt(i, _m4);
    }
  }
  L2._force = false;
  if (dirty) { L2.meshes.forEach(m => { if (m !== L2.rotor) m.instanceMatrix.needsUpdate = true; }); }
  if (L2.rotor) L2.rotor.instanceMatrix.needsUpdate = true;
}

/* ---------------- 每部風機的實際位置與尺寸（第一次點到該區的風場才載入）：
   美國＝USWTDB（tools/build_turbines.py → turbines.json，公有領域）；德國＝MaStR（tools/build_mastr.py → turbines_de.json，dl-de/by-2-0）；
   其他國家＝OpenStreetMap（tools/build_turbines_osm.py → turbines_osm.json，ODbL） ---------------- */
let TB = null, TBO = null, TBD = null;
const tbLoad = {}, TB_FILES = { us: 'turbines', osm: 'turbinesOsm', de: 'turbinesDe' };
const tbOf = f => {
  if (!f || f.pseudo || f.pipe) return null;
  if (f.iso === 'USA') return TB ? TB.farms[f.name] || null : null;
  const k = f.iso + '|' + f.name;
  return (f.iso === 'DEU' && TBD && TBD.farms[k]) || (TBO ? TBO.farms[k] || null : null);   // 德國：MaStR 優先，其次 OSM
};
function needTurbines(f) {
  if (!f || f.pseudo || f.pipe) return;
  (f.iso === 'USA' ? ['us'] : f.iso === 'DEU' ? ['de', 'osm'] : ['osm']).forEach(kind => {
    if (tbLoad[kind]) return;
    tbLoad[kind] = WW.getJSON(WW.DATA[TB_FILES[kind]]).then(j => {
      Object.values(j.farms).forEach(v => v.src = kind);
      if (kind === 'us') TB = j; else if (kind === 'de') TBD = j; else TBO = j;
      D.farms.forEach(x => { if (tbOf(x) && tbOf(x).src === kind) { x._spec = null; removeCluster(x); } });
      updateClusters(0, true);
      if (cardItem && cardItem.kind === 'farm' && tbOf(cardItem.f)) renderCard(cardItem);
    }).catch(e => { console.warn(e); tbLoad[kind] = null; });
  });
}
/* 實際年發電量（tools/build_generation.py → generation.json；美國＝EIA-923）：第一次打開風場卡片時才載入 */
let GEN = null, genP = null;
const genOf = f => GEN && f && !f.pipe && !f.pseudo ? GEN.farms[f.iso + '|' + f.name] || null : null;
function needGen() {
  if (GEN || genP) return;
  genP = WW.getJSON(WW.DATA.generation).then(j => { GEN = j; if (cardItem && cardItem.kind === 'farm' && genOf(cardItem.f)) renderCard(cardItem); })
    .catch(e => { console.warn(e); genP = null; });
}
function tbKm(tb) {                                                 // 各機位相對中心的 [東, 北]（公里）
  if (tb._km) return tb._km;
  const kx = 111.32 * Math.cos(tb.c[1] * D2R) * 1e-5, ky = 110.574e-5, out = [];
  for (let i = 0; i < tb.p.length; i += 2) out.push([tb.p[i] * kx, tb.p[i + 1] * ky]);
  return (tb._km = out);
}
const clusterLL = f => { const tb = tbOf(f); return tb ? { lon: tb.c[0], lat: tb.c[1] } : f; };
/* ---------------- turbine clusters (close-range view of real farm layouts) ---------------- */
let clusterMats;
function defaultUnit(type, y) {
  if (type === 'onshore') return y < 1990 ? 0.1 : y < 1995 ? 0.3 : y < 2000 ? 0.6 : y < 2005 ? 1.5 : y < 2010 ? 2 : y < 2015 ? 2.3 : y < 2020 ? 3 : 4.2;
  return y < 2000 ? 0.5 : y < 2005 ? 2 : y < 2010 ? 3 : y < 2015 ? 3.6 : y < 2019 ? 6 : y < 2022 ? 8 : 12;
}
const clamp1 = clamp;
function turbSpec(f) {
  if (f._spec) return f._spec;
  const tb = tbOf(f);
  if (tb) {                                                        // 有實際機位：機組數、間距與範圍都用實測值
    const P = tbKm(tb), n = P.length, nn = [];
    let ext = 0;
    P.forEach((p, i) => { let d = Infinity; P.forEach((q, j) => { if (i !== j) { const v = Math.hypot(p[0] - q[0], p[1] - q[1]); if (v < d) d = v; } }); if (d < Infinity) nn.push(d); ext = Math.max(ext, Math.hypot(p[0], p[1])); });
    nn.sort((a, b) => a - b);
    const spacing = Math.max(0.15, nn.length ? nn[nn.length >> 1] : 0.5);
    f._spec = { n, unit: tb.kw / 1000 / n, extent: Math.max(0.6, ext * 2), spacing, hKm: n <= 3 ? 1.1 : clamp(spacing * 0.85, 0.3, 2.6), real: true };
    return f._spec;
  }
  const t = f.turbine || ''; let n = null, unit = null, m;
  if ((m = t.match(/(\d+)\s*[x×]\s/)) || (m = t.match(/(?:MW|\s)\s*[x×]\s*(\d+)\b/)) || (m = t.match(/(\d+)\s*(?:turbines|units|部)/i))) n = +m[1];
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*MW/i))) unit = +m[1];
  if (!unit && ((m = t.match(/SWT-(\d+(?:\.\d+)?)/i)) || (m = t.match(/\bV\d+-(\d+(?:\.\d+)?)/)) || (m = t.match(/SG\s*(\d+(?:\.\d+)?)-/i)) || (m = t.match(/MySE\s*(\d+(?:\.\d+)?)/i)) || (m = t.match(/Haliade-X\s*(\d+)/i)))) unit = +m[1];
  if (unit && unit > 30) unit = null;
  if (!unit && n) unit = f.mw / n;
  if (!unit) unit = f._unit || defaultUnit(f.type, f.year);
  if (!n) n = f._n || Math.round(f.mw / unit);
  n = clamp1(Math.round(n), 1, 160);
  const areaKm2 = f.mw * (f.type === 'onshore' ? 0.25 : 0.15);
  const extent = Math.max(0.6, Math.sqrt(areaKm2));
  const spacing = n > 1 ? Math.max(0.35, extent / Math.sqrt(n)) : 0.5;
  const hKm = n <= 3 ? 1.1 : clamp(spacing * 0.85, 0.3, 2.6);
  f._spec = { n, unit, extent, spacing, hKm };
  return f._spec;
}
function farmAlt(f) { const sp = turbSpec(f); return clamp(sp.extent * KM * 3.0, 0.2, 2.0); }
function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
const clusters = new Map();
function makeCluster(f) {
  const sp = turbSpec(f), kind = f.pipe ? 'p' + f.st : S.layer === 'fd' && f.type !== 'onshore' ? fdMats(fdGroup(f)) : f.type === 'onshore' ? 'on' : 'off', mats = clusterMats[kind];
  const rnd = seeded(f.name + f.lat), tb = tbOf(f), cl = clusterLL(f);
  let P;
  if (tb) { const en = localEN(cl.lon, cl.lat); P = tbKm(tb).map(([e, n]) => [(e * en.e[0] + n * en.n[0]) * KM, (e * en.e[1] + n * en.n[1]) * KM]); }   // 實際機位
  else {                                                           // 推算：依機組數排成六角格，略加擾動
    const r = Math.ceil(Math.sqrt(sp.n)) + 2, pts = [];
    for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) { const x = i + (j & 1) * 0.5, z = j * 0.866; pts.push([x, z, x * x + z * z]); }
    pts.sort((a, b) => a[2] - b[2]);
    P = pts.slice(0, sp.n).map(p => [(p[0] + (rnd() - 0.5) * 0.25) * sp.spacing * KM, (p[1] + (rnd() - 0.5) * 0.25) * sp.spacing * KM]);
  }
  const h = sp.hKm * KM;
  const tower = new THREE.InstancedMesh(towerGeo, mats.tower, sp.n), nac = new THREE.InstancedMesh(nacGeo, mats.nac, sp.n), rotor = new THREE.InstancedMesh(rotorGeo, mats.blade, sp.n);
  _q.identity(); _s.set(h, h, h);
  P.forEach((p, i) => { _p3.set(p[0], 0, p[1]); _m4.compose(_p3, _q, _s); tower.setMatrixAt(i, _m4); nac.setMatrixAt(i, _m4); });
  [tower, nac, rotor].forEach(m => { m.userData.farm = f; m.instanceMatrix.needsUpdate = true; });
  const g = new THREE.Group(); g.add(tower, nac, rotor);
  const bases = addBases(g, f, P, h);                                // 離岸：依水下基礎型式畫基座段（示意）
  let rad = 0; P.forEach(p => { rad = Math.max(rad, Math.hypot(p[0], p[1])); }); rad += sp.spacing * KM * 0.8;
  const disc = new THREE.Mesh(discGeo, clusterMats[kind].disc), ring = new THREE.Mesh(f.pipe ? thinDashGeo : thinRingGeo, clusterMats[kind].ring);
  disc.scale.set(rad / 0.75, 1, rad / 0.75); ring.scale.set(rad, 1, rad); disc.position.y = ring.position.y = h * 0.02;
  disc.userData.farm = f; g.add(disc, ring);
  const dmc = fdDims(f), hr = dmc && dmc.hub && dmc.rotor ? [dmc.hub, dmc.rotor] : tb && tb.hh && tb.rd ? [(tb.hh[0] + tb.hh[1]) / 2, (tb.rd[0] + tb.rd[1]) / 2] : null;
  const rs = hr ? h * clamp((hr[1] / 2) / hr[0] / 0.54, 0.6, 1.9) : h;   // 有輪轂高度與葉輪直徑：葉輪依實際比例（預設葉輪半徑＝0.54 塔高）
  g.userData = { f, P, h, rs, tower, nac, rotor, bases, disc, ring, ringMat: ring.material, live: false, phase: P.map(() => rnd() * 6.28), ang: 0, count: -1 };
  const q = new THREE.Quaternion(); posAt(cl.lon, cl.lat, 0, g.position); g.quaternion.copy(quatAt(cl.lon, cl.lat, q));
  clusterRoot.add(g); return g;
}
/* 水下基礎圖層的風機群材質（依型式組別，第一次用到才建） */
function fdMats(g) {
  const k = 'fd-' + g;
  if (!clusterMats[k]) {
    const c = FD_HEX[g];
    clusterMats[k] = { disc: new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.16, depthWrite: false }), ring: new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.6, depthWrite: false }),
      tower: new THREE.MeshPhongMaterial({ color: 0xe6ebf2 }), nac: new THREE.MeshPhongMaterial({ color: c }), blade: new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: c, emissiveIntensity: 0.18 }) };
  }
  return k;
}
/* ---------------- 近景的基座段：依水下基礎型式畫出水面以上看得到的部分（示意，尺寸以塔高為 1） ----------------
   單樁＝灰樁身＋黃色過渡段（TP）與工作平台；套管＝四腿格構＋黃色過渡段；三腳架＝中柱＋三斜撐；三樁＝三根直樁＋連接架；
   重力式＝混凝土錐台；高樁承台＝群樁＋混凝土承台；圍堰式／複合筒＝寬筒；浮動式依細分型式畫半潛式三立柱、單柱式、駁船式或張力腳平台；
   混合型依各型式座數分配到機位；型式不詳不畫基座。水面以下不畫（地球面就是海面）。 */
const BASE_COL = { tp: 0xf2c230, steel: 0x9aa3ad, conc: 0xc9c3b6, hull: 0xe3e8ee };
const baseGeoCache = {};
let baseMats = null;
function legGeo(x0, z0, y0, x1, z1, y1, r) {           // 從 (x0,y0,z0) 到 (x1,y1,z1) 的細圓柱
  const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), d = b.clone().sub(a), len = d.length();
  const g = new THREE.CylinderGeometry(r, r, len, 6); g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return [g, new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, 1, 1))];
}
const M = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
function baseParts(key) {
  if (baseGeoCache[key]) return baseGeoCache[key];
  if (!baseMats) baseMats = { tp: new THREE.MeshPhongMaterial({ color: BASE_COL.tp }), steel: new THREE.MeshPhongMaterial({ color: BASE_COL.steel }),
    conc: new THREE.MeshPhongMaterial({ color: BASE_COL.conc }), hull: new THREE.MeshPhongMaterial({ color: BASE_COL.hull }) };
  const [t, sub] = key.split(':'), parts = [];
  const tpRing = (r, y0, y1) => [new THREE.CylinderGeometry(r, r, y1 - y0, 10), M(0, (y0 + y1) / 2, 0)];
  const platform = (r, y) => [new THREE.CylinderGeometry(r, r, 0.012, 12), M(0, y, 0)];
  const legs = (n, spread0, spread1, y1, r) => [...Array(n)].map((_, i) => { const a = i * Math.PI * 2 / n + Math.PI / 4; return legGeo(Math.cos(a) * spread0, Math.sin(a) * spread0, 0, Math.cos(a) * spread1, Math.sin(a) * spread1, y1, r); });
  if (t === 'mp') { parts.push(['steel', [tpRing(0.062, -0.02, 0.03)]]); parts.push(['tp', [tpRing(0.07, 0.03, 0.15), platform(0.105, 0.15)]]); }
  else if (t === 'jk') { parts.push(['steel', [...legs(4, 0.19, 0.085, 0.24, 0.012), ...[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4, b = a + Math.PI / 2, s = 0.145; return legGeo(Math.cos(a) * s, Math.sin(a) * s, 0.1, Math.cos(b) * s, Math.sin(b) * s, 0.1, 0.007); })]]);
    parts.push(['tp', [[new THREE.BoxGeometry(0.19, 0.06, 0.19), M(0, 0.27, 0)], tpRing(0.065, 0.24, 0.3)]]); }
  else if (t === 'tp') { parts.push(['steel', [tpRing(0.05, -0.02, 0.22), ...legs(3, 0.2, 0.05, 0.16, 0.014), ...[0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3 + Math.PI / 4; return legGeo(Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0, Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.06, 0.02); })]]);
    parts.push(['tp', [tpRing(0.06, 0.22, 0.3), platform(0.09, 0.3)]]); }
  else if (t === 'tl') { parts.push(['steel', [...legs(3, 0.12, 0.12, 0.2, 0.028)]]); parts.push(['tp', [[new THREE.CylinderGeometry(0.17, 0.17, 0.05, 3), M(0, 0.225, 0)], tpRing(0.06, 0.22, 0.3)]]); }
  else if (t === 'gb') { parts.push(['conc', [[new THREE.CylinderGeometry(0.075, 0.2, 0.16, 14), M(0, 0.08, 0)], platform(0.1, 0.16)]]); }
  else if (t === 'pc') { parts.push(['conc', [[new THREE.CylinderGeometry(0.17, 0.17, 0.07, 14), M(0, 0.1, 0)]]]); parts.push(['steel', [...legs(6, 0.12, 0.12, 0.07, 0.016)]]); }
  else if (t === 'cf' || t === 'bk') { parts.push([t === 'cf' ? 'steel' : 'conc', [[new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14), M(0, 0.05, 0)]]]); parts.push(['tp', [tpRing(0.065, 0.1, 0.2), platform(0.1, 0.2)]]); }
  else if (t === 'ra') { parts.push(['steel', [tpRing(0.08, 0, 0.06)]]); parts.push(['tp', [tpRing(0.065, 0.06, 0.15), platform(0.1, 0.15)]]); }
  else if (t === 'fl') {
    if (sub === 'spar') parts.push(['hull', [tpRing(0.075, -0.04, 0.14), platform(0.1, 0.14)]]);
    else if (sub === 'barge') parts.push(['hull', [[new THREE.BoxGeometry(0.5, 0.07, 0.5), M(0, 0.035, 0)], [new THREE.BoxGeometry(0.42, 0.02, 0.42), M(0, 0.08, 0)]]]);
    else if (sub === 'tlp') { parts.push(['hull', [[new THREE.BoxGeometry(0.3, 0.07, 0.3), M(0, 0.1, 0)], ...[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return [new THREE.CylinderGeometry(0.04, 0.04, 0.14, 10), M(Math.cos(a) * 0.19, 0.04, Math.sin(a) * 0.19)]; })]]); }
    else { // 半潛式（細分型式不詳的浮動式也用這個）
      parts.push(['hull', [...[0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3 + Math.PI / 2; return [new THREE.CylinderGeometry(0.055, 0.055, 0.17, 12), M(Math.cos(a) * 0.22, 0.045, Math.sin(a) * 0.22)]; }),
        ...[0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3 + Math.PI / 2, b = a + Math.PI * 2 / 3, r = 0.22; return legGeo(Math.cos(a) * r, Math.sin(a) * r, 0.02, Math.cos(b) * r, Math.sin(b) * r, 0.02, 0.022); }),
        ...[0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3 + Math.PI / 2, r = 0.22; return legGeo(Math.cos(a) * r, Math.sin(a) * r, 0.1, 0, 0, 0.1, 0.014); })]]);
    }
  }
  const out = parts.map(([mat, geos]) => ({ geo: mergeGeos(geos), mat: baseMats[mat] }));
  baseGeoCache[key] = out; return out;
}
/* 每個機位的基座型式鍵（'mp'、'jk'、'fl:semi'…）；混合型依各型式座數由內而外分配；型式不詳回傳 null */
function baseKeys(f, n) {
  if (f.type === 'onshore' || f.pipe) return null;
  const r = f.fd;
  if (!r) return f.type === 'floating' ? Array(n).fill('fl:') : null;
  if (r.t === 'mx' && r.p && r.p.length) {
    const tot = r.p.reduce((a, p) => a + (p[1] || 0), 0) || 1, keys = [];
    r.p.forEach((p, i) => { const k = Math.round(n * (p[1] || 0) / tot); for (let j = 0; j < k && keys.length < n; j++) keys.push(p[0] === 'fl' ? 'fl:' + (r.s || '') : p[0]); });
    while (keys.length < n) keys.push(r.p[r.p.length - 1][0]);
    return keys;
  }
  if (r.t === 'mx') return null;
  return Array(n).fill(r.t === 'fl' || f.type === 'floating' ? 'fl:' + (r.s || '') : r.t);
}
/* 在風機群底下加基座段：依型式分組各建一個 InstancedMesh，矩陣與塔架相同 */
function addBases(g, f, P, h) {
  const keys = baseKeys(f, P.length); if (!keys) return [];
  const byKey = new Map(); keys.forEach((k, i) => { if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(i); });
  const meshes = []; _q.identity(); _s.set(h, h, h);
  byKey.forEach((idx, key) => {
    baseParts(key).forEach(part => {
      const m = new THREE.InstancedMesh(part.geo, part.mat, idx.length);
      idx.forEach((i, j) => { _p3.set(P[i][0], 0, P[i][1]); _m4.compose(_p3, _q, _s); m.setMatrixAt(j, _m4); });
      m.instanceMatrix.needsUpdate = true; m.userData.farm = f; g.add(m); meshes.push(m);
    });
  });
  return meshes;
}
function removeCluster(f) { const g = clusters.get(f); if (!g) return; clusterRoot.remove(g); [g.userData.tower, g.userData.nac, g.userData.rotor, ...(g.userData.bases || [])].forEach(m => m.dispose && m.dispose()); clusters.delete(f); }
function layoutClusters() { const q = new THREE.Quaternion(); clusters.forEach((g, f) => { const c = clusterLL(f); posAt(c.lon, c.lat, 0, g.position); g.quaternion.copy(quatAt(c.lon, c.lat, q)); }); }
let lastClusterT = 0, focusFarm = null, nearFarms = [];
/* 拉近時每座風場仍以一支風機代表；只有使用者點選（或導覽停留）的風場才依機組數量畫出所有風機（2026-09 使用者決定）。
   視野中心附近的風場另外記下來補名稱標籤：風場層的標籤只從容量前 120 大取，拉近時附近的小風場也要有名字 */
function updateClusters(now, force) {
  if (!force && now - lastClusterT < 280) return; lastClusterT = now;
  const alt = curAlt();
  const want = new Set(); let near = [];
  if (alt < CL_ALT && !modeAnim && farmsReady) {
    if (focusFarm && farmActive(focusFarm, S.year)) want.add(focusFarm);
    const fc = focusLonLat(), cosl = Math.max(0.2, Math.cos(fc.lat * D2R));
    const rad = Math.max(0.35, alt * 0.6 * 2.6);
    const cands = [], fsOn = fsActive();
    for (const f of D.farms) {
      if (!farmActive(f, S.year) || !showFarm(f)) continue;          // 規劃中：開啟「規劃中」且在時間軸終點才出現
      if (fsOn && (!inScope(f.iso) || !fsMatch(f))) continue;           // 搜尋／篩選中：只替符合的風場補標籤
      const dl = (f.lat - fc.lat), dn = (f.lon - fc.lon) * cosl, d = Math.sqrt(dl * dl + dn * dn);
      if (d < rad + 0.15) cands.push([d, f]);
    }
    cands.sort((a, b) => a[0] - b[0]); near = cands.slice(0, 24).map(c => c[1]);
  }
  nearFarms = near;
  clusters.forEach((g, f) => { if (!want.has(f)) removeCluster(f); });
  want.forEach(f => { if (!clusters.has(f)) clusters.set(f, makeCluster(f)); });
}
function animateClusters(dt) {
  clusters.forEach((g, f) => {
    const u = g.userData, n = u.P.length;
    const built = (f.yu || f.pipe) ? n : clamp(Math.ceil(n * fAge(f) / BUILD), 0, n);
    if (built !== u.count) { u.count = built; u.tower.count = built; u.nac.count = built; u.rotor.count = built; }
    const lv = liveOn() && liveFor(f);
    if (!!lv !== u.live) { u.live = !!lv; u.ring.material = lv ? clusterMats.liveRing : u.ringMat; }   // 有即時資料：外圈改為即時綠
    u.ang += dt * 1.6 * (lv ? spinOf(lv) : f.pipe ? 0 : 1);   // 近看的風機群：轉速依此刻出力（興建中但已併網發電者也會轉）
    _s.set(u.rs, u.rs, u.rs);
    for (let i = 0; i < built; i++) { _p3.set(u.P[i][0], u.h, u.P[i][1] + 0.12 * u.h); _q.setFromAxisAngle(_zAxis, u.ang + u.phase[i]); _m4.compose(_p3, _q, _s); u.rotor.setMatrixAt(i, _m4); }
    u.rotor.instanceMatrix.needsUpdate = true;
  });
}
function layoutAnchors() {
  const q = new THREE.Quaternion();
  cGroups.forEach(a => { const c = a.userData.c; posAt(c.lon, c.lat, 0, a.position); a.quaternion.copy(quatAt(c.lon, c.lat, q)); });
  msMarkers.forEach(g => { const m = g.userData.m; posAt(m.lon, m.lat, 0, g.position); g.quaternion.copy(quatAt(m.lon, m.lat, q)); });
  if (hiLines) setHighlight(hiIso);
  layoutFarms(); if (FL.op) { FL.op._force = true; FL.pp._force = true; }
  layoutClusters(); layoutPorts(); layoutEvents();
}

/* ================= camera: regions, tweens, auto-tilt ================= */
function regionCenter(region) {
  region = region || S.region;
  if (region === 'WORLD') return { lon: 30, lat: S.mode === 'flat' ? 12 : 25, span: 170 };
  if (region.startsWith('C:')) {
    const presets = { Asia: { lon: 95, lat: 32, span: 110 }, Europe: { lon: 12, lat: 52, span: 45 }, 'North America': { lon: -98, lat: 42, span: 80 }, 'South America': { lon: -60, lat: -18, span: 70 }, Africa: { lon: 20, lat: 5, span: 80 }, Oceania: { lon: 145, lat: -30, span: 70 } };
    return presets[region.slice(2)];
  }
  const c = byIso[region];
  return { lon: c.lon, lat: c.lat, country: true, span: Math.max(10, Math.max(c.bbox[2] - c.bbox[0], (c.bbox[3] - c.bbox[1]) * 1.3)) };
}
function regionAlt(rc) {
  if (S.mode === 'globe') return Math.min(320, Math.max(14, rc.span * (rc.country ? (rc.span > 40 ? 1.6 : 1.2) : 1.9)));
  return Math.min(700, Math.max(18, rc.span * FS * (rc.country ? (rc.span > 40 ? 1.4 : 0.9) : 1.9)));
}
let camTween = null;
function tweenTo(pos, tgt, dur) {
  const p0 = vcam.position.clone(), t0 = controls.target.clone();
  const spherical = S.mode === 'globe' && t0.length() < 1 && tgt.length() < 1;
  let bump = 0, d = dur;
  if (spherical) {
    const ang = p0.clone().normalize().angleTo(pos.clone().normalize());
    const a0 = p0.length() - R, a1 = pos.length() - R;
    bump = Math.max(0, Math.min(240, ang * R * 0.85) - (a0 + a1) * 0.35);
    d = d || clamp(1.3 + ang * 1.3 + Math.abs(Math.log(Math.max(a1, 0.1) / Math.max(a0, 0.1))) * 0.16, 1.3, 4.2);
  } else {
    const dist = t0.distanceTo(tgt);
    bump = S.mode === 'flat' ? Math.min(250, dist * 0.45) : 0;
    d = d || clamp(1.3 + dist / 220, 1.3, 3.6);
  }
  camTween = { t: 0, dur: d, p0, p1: pos.clone(), t0, t1: tgt.clone(), spherical, bump };
  return d;
}
function stepTween(dt) {
  if (!camTween) return;
  const c = camTween; c.t += dt; const k = Math.min(1, c.t / c.dur), e = easeIO(k);
  if (c.spherical) {
    const d0 = c.p0.clone().normalize(), d1 = c.p1.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(d0, d1), qe = new THREE.Quaternion().slerp(q, e);
    const a0 = Math.max(0.05, c.p0.length() - R), a1 = Math.max(0.05, c.p1.length() - R);
    const alt = Math.exp(lerp(Math.log(a0), Math.log(a1), e)) + c.bump * Math.sin(Math.PI * e);
    vcam.position.copy(d0.applyQuaternion(qe)).multiplyScalar(R + alt); controls.target.set(0, 0, 0);
  } else {
    vcam.position.lerpVectors(c.p0, c.p1, e); controls.target.lerpVectors(c.t0, c.t1, e);
    vcam.position.y += c.bump * Math.sin(Math.PI * e);
  }
  if (k >= 1) camTween = null;
}
function flyToRegion(instant) {
  const rc = regionCenter(), alt = regionAlt(rc);
  let pos, tgt;
  if (S.mode === 'globe') { pos = globePos(rc.lon, rc.lat, alt); tgt = new THREE.Vector3(); }
  else { tgt = flatPos(rc.lon, rc.lat, 0); const tilt = rc.span > 120 ? 0.42 : rc.country ? 0.6 : 0.75; pos = tgt.clone().add(new THREE.Vector3(0, alt * Math.cos(tilt), alt * Math.sin(tilt))); }
  if (instant) { vcam.position.copy(pos); controls.target.copy(tgt); camTween = null; return 0; }
  return tweenTo(pos, tgt);
}
function flyToLonLat(lon, lat, alt, dur) {
  let pos, tgt;
  if (S.mode === 'globe') { pos = globePos(lon, lat, alt); tgt = new THREE.Vector3(); }
  else { tgt = flatPos(lon, lat, 0); const tl = 0.95; pos = tgt.clone().add(new THREE.Vector3(0, alt * Math.cos(tl), alt * Math.sin(tl))); }
  return tweenTo(pos, tgt, dur);
}
let tiltBlend = 0;
const _n = new THREE.Vector3(), _u = new THREE.Vector3(), _F = new THREE.Vector3();
function syncRenderCamera(dt) {
  const want = (S.mode === 'globe' && !modeAnim && controls.target.lengthSq() < 1) ? 1 : 0;
  tiltBlend += (want - tiltBlend) * Math.min(1, dt * 4);
  const P = vcam.position;
  let alt;
  if (S.mode === 'globe' && controls.target.lengthSq() < 1 && tiltBlend > 0.001) {
    alt = P.length() - R;
    const s = clamp(1 - alt / 75, 0, 1), a = tiltBlend * 1.0 * s * s * (3 - 2 * s);
    _n.copy(P).normalize(); _F.copy(_n).multiplyScalar(R);
    _u.set(0, 1, 0).applyQuaternion(vcam.quaternion); _u.addScaledVector(_n, -_u.dot(_n)).normalize();
    camera.position.copy(_F).addScaledVector(_n, alt * Math.cos(a)).addScaledVector(_u, -alt * Math.sin(a));
    camera.up.copy(_u).multiplyScalar(Math.cos(a)).addScaledVector(_n, Math.sin(a)).normalize();
    camera.lookAt(_F);
  } else {
    alt = curAlt();
    camera.position.copy(P); camera.quaternion.copy(vcam.quaternion); camera.up.copy(vcam.up);
  }
  const near = clamp(alt * 0.2, 0.004, 5), far = S.mode === 'globe' ? (R + alt) * 2.2 + 60 : Math.max(1500, alt * 6);
  if (Math.abs(camera.near - near) > near * 0.05 || camera.far !== far) { camera.near = near; camera.far = far; camera.updateProjectionMatrix(); }
}

/* 自動旋轉：以秒計速（與畫面更新率無關），任何範圍、兩種模式都有效。
   3D 地球繞地軸由西向東自轉，全球視角約 60 秒一圈，拉近時等比放慢，畫面上的移動速度維持一致；
   2.5D 平面則繞畫面中心緩慢旋轉。拖曳、飛行途中與導覽時暫停。 */
const _qs = new THREE.Quaternion(), _sv = new THREE.Vector3();
function autoSpin(dt) {
  if (S.mode === 'globe') {
    const degPerSec = 6 * clamp(curAlt() / 320, 0.0005, 1.5);
    _qs.setFromAxisAngle(UP, -degPerSec * D2R * dt);
    vcam.position.applyQuaternion(_qs);
  } else {
    _qs.setFromAxisAngle(UP, 5 * D2R * dt);
    _sv.copy(vcam.position).sub(controls.target).applyQuaternion(_qs);
    vcam.position.copy(controls.target).add(_sv);
  }
}

/* ================= mode switch ================= */
let modeAnim = null;
function setMode(m) {
  if (S.mode === m || !renderer) return;
  S.mode = m;
  document.querySelectorAll('#g-modeSeg button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  modeAnim = { from: S.modeT, to: m === 'flat' ? 1 : 0, t: 0, dur: 1.1 };
  if (m === 'flat') { controls.minDistance = 0.15; controls.maxDistance = 900; controls.zoomSpeed = 2.2; controls.enablePan = true; controls.maxPolarAngle = Math.PI / 2 - 0.08; }
  else { controls.minDistance = 1; controls.maxDistance = 1e5; controls.zoomSpeed = 1; controls.enablePan = false; controls.maxPolarAngle = Math.PI; }
  clusters.forEach((g, f) => removeCluster(f)); patchInfo = null; farmLayerDirty = true;
  if (TOUR) tourShowStop(TOUR.i, true); else if (focusFarm) flyToLonLat(focusFarm.lon, focusFarm.lat, farmAlt(focusFarm)); else flyToRegion(false);
  syncURL();
}
function applyModeT() {
  const flat = S.modeT > 0.5;
  globe.visible = !flat; atmo.visible = !flat; bordersG.visible = !flat; plane.visible = flat; bordersF.visible = flat; zonesVisible();
  globe.scale.setScalar(Math.max(0.001, 1 - Math.min(1, S.modeT * 2) * 0.999)); plane.scale.setScalar(clamp((S.modeT - 0.5) * 2, 0.001, 1));
  layoutAnchors();
}

/* ================= region select & side panel ================= */
function buildRegionSelect() {
  const sel = $('g-regionSel'); const cur = S.region; sel.innerHTML = '';
  const add = (v, txt, grp) => { const o = document.createElement('option'); o.value = v; o.textContent = txt; (grp || sel).appendChild(o); };
  add('WORLD', '🌍 ' + T('world'));
  const og = document.createElement('optgroup'); og.label = L('洲別', 'Continents'); sel.appendChild(og);
  ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'].forEach(k => add('C:' + k, T('cont')[k], og));
  const og2 = document.createElement('optgroup'); og2.label = L('國家／地區（依 ' + Y1 + ' 容量排序）', 'Countries (by ' + Y1 + ' capacity)'); sel.appendChild(og2);
  C.forEach(c => add(c.iso, cname(c), og2));
  sel.value = cur;
}
function setRegion(r, noFly) {
  if (r !== 'WORLD' && !r.startsWith('C:') && !byIso[r]) r = 'WORLD';
  S.region = r; $('g-regionSel').value = r;
  setHighlight(byIso[r] ? r : null);
  farmLayerDirty = true;
  focusFarm = null;
  setPanelTab(panelTab === 'pipe' || panelTab === 'farms' || panelTab === 'ports' || panelTab === 'events' ? panelTab : (LITE ? 'farms' : byIso[r] ? 'prof' : 'ms'));
  if (!noFly) flyToRegion(false);
  updateBars(true); renderMilestones(true); renderProfile();
  if (farmsReady && byIso[r] && !TOUR) {          // 這一年該國還沒有風場（時間軸停在早期）：提醒，免得以為資料不見了
    const yr = Math.floor(S.year), all = D.farms.filter(f => f.iso === r && !f.pipe);
    if (all.length && !all.some(f => f.year <= S.year && (!f.end || f.end > S.year))) notice(T('regionEmpty')(yr), 4000);
  }
  syncURL();
}
let panelTab = 'ms';
function setPanelTab(t) {
  panelTab = t;
  [['prof', 'g-tabProf', 'g-profBody'], ['ms', 'g-tabMs', 'g-msList'], ['farms', 'g-tabFarms', 'g-farmList'], ['pipe', 'g-tabPipe', 'g-pipeList'], ['ports', 'g-tabPorts', 'g-portList'], ['events', 'g-tabEvents', 'g-evList']].forEach(([k, b, body]) => {
    $(b).classList.toggle('active', k === t); $(b).setAttribute('aria-selected', k === t ? 'true' : 'false'); $(body).hidden = k !== t;
  });
  $('g-tabProf').hidden = LITE || !(byIso[S.region] || S.region.startsWith('C:') || S.region === 'WORLD');
  if (t === 'farms') renderFarmList(true);
  if (t === 'prof') renderProfile();
  if (t === 'pipe') renderPipeList(true);
  if (t === 'ports') renderPortList(true);
  if (t === 'events') renderEventList(true);
}

/* ================= labels ================= */
let labelsEl, labelPool = [];
function getLabel(i) { while (labelPool.length <= i) { const d = document.createElement('div'); d.className = 'lbl'; labelsEl.appendChild(d); labelPool.push(d); } return labelPool[i]; }
const _pp = new THREE.Vector3();
function project(v) { _pp.copy(v).project(camera); return { x: (_pp.x + 1) / 2 * W, y: (1 - _pp.y) / 2 * H, z: _pp.z }; }
function facing(worldPos) {
  if (S.modeT > 0.5) return true;
  _n.copy(worldPos).normalize();
  return _pp.copy(camera.position).sub(worldPos).dot(_n) > 0;
}
function textW(s, px) { let w = 0; for (const ch of s) w += /[⺀-鿿豈-￯]/.test(ch) ? px * 1.02 : px * 0.57; return w; }
const DENS = [{ c: 0, f: 0, m: 0, n: 0, p: 0, e: 0, z: 0 }, { c: 7, f: 5, m: 1, n: 3, p: 3, e: 2, z: 6 }, { c: 12, f: 11, m: 3, n: 5, p: 6, e: 4, z: 12 }, { c: 22, f: 24, m: 5, n: 8, p: 12, e: 8, z: 24 }];
function upAt(p) { return S.modeT > 0.5 ? UP : _u.copy(p).normalize(); }

/* ================= main loop ================= */
function resize() {
  const pane = $('g-mapPane'); W = pane.clientWidth || 1; H = pane.clientHeight || 1;
  if (renderer) renderer.setSize(W, H, false);
  camera.aspect = vcam.aspect = W / H; camera.updateProjectionMatrix(); vcam.updateProjectionMatrix();
}
const tmpV = new THREE.Vector3(), tmpW = new THREE.Vector3();
function start() { if (running) return; running = true; S.lastT = performance.now(); requestAnimationFrame(frame); }
function stop() { running = false; }
function frame(now) {
  if (!running) return;
  requestAnimationFrame(frame);
  const dt = Math.min(0.25, (now - S.lastT) / 1000 || 0); S.lastT = now; S.frames = (S.frames || 0) + 1;

  if (S.playing) { S.year += dt * S.speed; if (S.year >= Y1) { S.year = Y1; setPlaying(false); } syncYearUI(); }
  if (TOUR) tourTick(dt);
  if (S.flow && (S.frames & 1)) {             // 隔一格更新一次：畫布貼圖每次都要整張上傳到顯示卡，減半負擔
    try { flowTick(dt * 2, now); } catch (e) { console.error(e); toggleFlow(false); }   // 出錯就關掉，不拖累風場層的繪製
  }
  if (!renderer) { updateHUD(); if (now - (S.lastBar || 0) > 90) { S.lastBar = now; updateBars(false); } return; }

  if (modeAnim) { modeAnim.t += dt; const k = Math.min(1, modeAnim.t / modeAnim.dur); const e = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
    S.modeT = modeAnim.from + (modeAnim.to - modeAnim.from) * e; applyModeT(); if (k >= 1) { modeAnim = null; S.modeT = S.mode === 'flat' ? 1 : 0; applyModeT(); } }

  stepTween(dt);
  // OrbitControls 在事件中直接改距離：以「高度」空間修正滾輪縮放，讓近地面也能細緻縮放
  const zoomFix = () => {
    if (S.mode !== 'globe' || camTween || modeAnim || !S.lastDist) return;
    const cur = vcam.position.length();
    if (Math.abs(cur - S.lastDist) > 1e-7) {
      const newAlt = clamp((S.lastDist - R) * Math.pow(cur / S.lastDist, 3.4), G_MIN_ALT, G_MAX_ALT);
      vcam.position.setLength(R + newAlt);
    }
  };
  zoomFix();
  if (S.rotate && !camTween && !TOUR && !modeAnim && !S.dragging) autoSpin(dt);
  const alt0 = curAlt();
  if (S.mode === 'globe') controls.rotateSpeed = clamp(0.0013 * alt0, 0.00008, 0.5);
  S.lastDist = vcam.position.length();
  controls.update();
  zoomFix();
  S.lastDist = vcam.position.length();
  syncRenderCamera(dt);
  const alt = curAlt();

  updatePatch(now);
  ambL.intensity = 0.55 + 0.35 * clamp(1 - alt / 40, 0, 1);     // 近地面時提高環境光，衛星影像／山影才看得清楚
  const lift = clamp(alt * 0.004, 0.0015, 0.4);
  if (!modeAnim) {
    if (S.mode === 'globe') {
      const s = r => (R + r) / R;
      if (patch) patch.scale.setScalar(s(lift)); bordersG.scale.setScalar(s(lift * 1.7)); if (hiLines) hiLines.scale.setScalar(s(lift * 1.9));
      if (ZONE_G) ZONE_G.g.scale.setScalar(s(lift * 1.8));
      surfaceRoot.scale.setScalar(s(lift * 1.3)); surfaceRoot.position.set(0, 0, 0);
    } else {
      if (patch) { patch.scale.setScalar(1); patch.position.y = lift; } bordersF.position.y = lift * 1.7; if (hiLines) { hiLines.scale.setScalar(1); hiLines.position.y = lift * 1.9; }
      if (ZONE_G) ZONE_G.f.position.y = lift * 1.8;
      surfaceRoot.scale.setScalar(1); surfaceRoot.position.y = lift * 1.3;
    }
  } else { surfaceRoot.scale.setScalar(1); surfaceRoot.position.set(0, 0, 0); if (hiLines) { hiLines.scale.setScalar(1); hiLines.position.set(0, 0, 0); } }
  surfaceRoot.updateMatrixWorld();

  updateClusters(now, false);
  animateClusters(dt);
  updatePortArcs();
  rebuildFarmInstances(now, false);
  const deep = alt < CL_ALT;

  const sizeK = S.mode === 'globe' ? clamp(alt / 65, 0.02, 1) : clamp(alt / 220, 0.02, 1.4);
  const fsOn = farmsReady && fsActive();
  const farmScale = farmK * clamp(Math.pow(alt / Math.max(1, farmRefAlt), 0.75), 0.015, 1.3) * (fsOn && !byIso[S.region] ? clamp(alt / 30, 1, 6) : 1);   // 篩選結果在全球視角也看得到
  const pinK = clamp(Math.pow(alt / 150, 0.85), 0.004, 1) * (FL.op.list.length ? 0.5 : 1);
  const selHasFarms = !!(byIso[S.region] && farmsByIso[S.region] && farmsByIso[S.region].length);

  const dens = DENS[S.density];
  const cands = [];
  let worldOn = 0, worldOff = 0, nWith = 0;
  const zoomFarms = FL.op.list.length > 0 && alt < (S.mode === 'globe' ? 45 : 70);
  cGroups.forEach(a => {
    const c = a.userData.c, cap = capOf(c, S.year), inR = inRegion(c);
    const hasFarms = selHasFarms && S.region === c.iso;
    const dimT = (hasFarms || (selHasFarms && !inR) || deep || zoomFarms || fsOn) ? 0 : (inR ? 1 : 0.18);
    a.userData.dim += (dimT - a.userData.dim) * Math.min(1, dt * 6);
    a.visible = a.userData.dim > 0.02;
    worldOn += valAt(c.on, S.year); worldOff += valAt(c.off, S.year); if (cap.tot > 0.5) nWith++;
    if (!a.visible) return;
    [['on', a.userData.tOn, cap.on], ['off', a.userData.tOff, cap.off]].forEach(([k, t, mw]) => {
      const u = t.userData;
      const hT = heightOf(mw) * sizeK, rT = radiusOf(mw) * sizeK;
      u.h += (hT - u.h) * Math.min(1, dt * 5); u.r += (rT - u.r) * Math.min(1, dt * 5);
      const on = mw > 0.5 && u.h > 0.0005; t.visible = on; if (!on) return;
      u.tower.scale.setScalar(u.h); u.nac.scale.setScalar(u.h); u.rotor.scale.setScalar(u.h); u.rotor.position.set(0, u.h, 0.12 * u.h);
      u.ring.scale.set(u.r, 1, u.r); u.disc.scale.set(u.r, 1, u.r);
      u.rotor.rotation.z += dt * 2.2 * (k === 'on' ? 1 : 0.9);
      const op = a.userData.dim; u.mats[0].opacity = op; u.mats[1].opacity = op; u.mats[2].opacity = op; u.mats[3].opacity = 0.55 * op; u.mats[4].opacity = 0.16 * op;
    });
    const sep = (a.userData.tOn.userData.r + a.userData.tOff.userData.r) * 0.6 + 0.8 * sizeK;
    a.userData.tOn.position.set(cap.off > 0.5 ? -sep * 0.5 : 0, 0, 0); a.userData.tOff.position.set(sep * 0.5, 0, 0);
    if (inR && cap.tot > 0.5 && !hasFarms && a.userData.dim > 0.5) {
      a.getWorldPosition(tmpV); const h = Math.max(a.userData.tOn.userData.h, a.userData.tOff.userData.h) * surfaceRoot.scale.x;
      cands.push({ cat: 'c', pri: cap.tot, pos: tmpV.clone().addScaledVector(upAt(tmpV), h * 1.15 + 1.2 * sizeK), name: cname(c), val: fmtMW(cap.tot), cls: '', key: 'c' + c.iso });
    }
  });
  S.worldOn = worldOn; S.worldOff = worldOff; S.nWith = nWith;

  // 風場層（InstancedMesh）＋標籤候選（只取容量最大的一批）
  animateFarmKind(FL.op, dt, farmScale);
  animateFarmKind(FL.pp, dt, farmScale);
  [FL.op, FL.pp].forEach(L2 => {
    const lim = Math.min(L2.list.length, 120);
    const add = i => {
      const f = L2.list[i], h = L2.h[i]; if (h < 0.0003) return;
      tmpW.copy(L2.pos[i]).applyMatrix4(surfaceRoot.matrixWorld);
      const age = fAge(f), isNew = !f.pipe && !f.yu && age >= 0 && age < 1.5;
      cands.push({ cat: isNew ? 'n' : 'f', pri: f.mw + (f === focusFarm ? 1e9 : 0) - (f.pipe ? 1e5 : 0), pos: tmpW.clone().addScaledVector(upAt(tmpW), h * (L2.isPipe ? 0.25 : 1.2) * surfaceRoot.scale.x + 0.25 * farmScale),
        name: fname(f), val: f.pipe ? T('st')[f.st] + ' · ' + fmtMW(f.mw) : (f.yu ? '' : f.year + ' · ') + fmtMW(farmMwAt(f, S.year)), cls: f.pipe ? 'pipe' : isNew ? 'fnew' : 'farm', key: 'f' + f.name + f.lat });
    };
    for (let i = 0; i < lim; i++) add(i);
    if (deep) nearFarms.forEach(f => { const i = L2.idx.get(f); if (i != null && i >= lim) add(i); });     // 拉近時：視野附近的小風場也有名字
  });
  clusters.forEach((g, f) => {
    if (g.userData.count <= 0 || f.pseudo) return;     // 里程碑的示意風場：由里程碑標籤代表
    g.getWorldPosition(tmpV);
    const isNew = !f.yu && fAge(f) < 1.5;
    const val = f.pipe ? T('st')[f.st] + (f.year ? ' · ' + T('expected') + ' ' + f.year : '') + ' · ' + fmtMW(f.mw) : (f.yu ? '' : f.year + ' · ') + fmtMW(f.mw);
    cands.push({ cat: f === focusFarm ? 'm' : (isNew && !f.pipe ? 'n' : 'f'), pri: f.mw + (f === focusFarm ? 1e9 : 0) - (f.pipe ? 1e5 : 0), pos: tmpV.clone().addScaledVector(upAt(tmpV), g.userData.h * 2.2), name: fname(f), val, cls: f === focusFarm ? 'focus' : f.pipe ? 'pipe' : (isNew ? 'fnew' : 'farm'), key: 'k' + f.name + f.lat });
  });
  const tourMs = TOUR && TOUR.stops[TOUR.i] && TOUR.stops[TOUR.i].m;
  msMarkers.forEach(g => {
    const m = g.userData.m;
    const isTour = tourMs === m;
    const show = isTour || (S.year >= m.year && S.year < m.year + 4 && inScope(m.iso) && (!TOUR));
    g.visible = show && !(isTour && focusFarm && clusters.has(focusFarm)); if (!show) return;
    const age = Math.max(0, S.year - Math.max(m.year, Y0)); const pulse = 1 + 0.35 * Math.sin(now / 250);
    g.scale.setScalar(pinK);
    g.userData.halo.scale.setScalar(pulse * (1 + Math.min(age, 2) * 0.6)); g.userData.halo.material.opacity = isTour ? 0.8 : Math.max(0, 0.8 - age * 0.2);
    g.userData.pin.position.y = 1.4 + 0.3 * Math.sin(now / 300);
    if (isTour || age < 1.5) { g.getWorldPosition(tmpV); cands.push({ cat: 'm', pri: isTour ? 2e9 : 1e8, pos: tmpV.clone().addScaledVector(upAt(tmpV), 3.4 * pinK * surfaceRoot.scale.x), name: '★ ' + m.name, val: m.year + (m.farm ? ' · ' + fmtMW(m.farm) : m.mw ? ' · ' + T('turbine') + ' ' + (m.mw < 1 ? WW.int(m.mw * 1000) + ' kW' : m.mw + ' MW') : ''), cls: 'ms', key: 'm' + m.name }); }
  });

  updatePorts(alt, cands); updateEvents(alt, cands); zoneLabels(alt, cands);
  let li = 0;
  if (S.density > 0 || TOUR) {
    const rects = [];
    const pr = $('g-mapPane').getBoundingClientRect();
    ['g-yearBig', 'g-worldStat', 'g-msPanel', 'g-infoCard'].forEach(id => { const el = $(id); if (!el || el.offsetParent === null) return; const b = el.getBoundingClientRect(); if (b.width) rects.push([b.left - pr.left, b.top - pr.top, b.right - pr.left, b.bottom - pr.top]); });
    const used = { c: 0, f: 0, m: 0, n: 0, p: 0, e: 0, z: 0 };
    const lim = S.density > 0 ? dens : { c: 0, f: 0, m: 1, n: 0, p: 0, e: 0, z: 0 };
    cands.sort((a, b) => b.pri - a.pri);
    for (const cd of cands) {
      if (used[cd.cat] >= lim[cd.cat] && cd.pri < 1e9) continue;
      if (!facing(cd.pos)) continue;
      const p = project(cd.pos); if (cd.dy) p.y -= cd.dy; if (p.z > 1 || p.y < 31 || p.y > H + 10) continue;     // 標籤高 29px，錨點在底部：上緣也要在畫面內
      const w = Math.max(textW(cd.name, 12), textW(cd.val, 10.5)) + 6, h = 29;
      if (p.x - w / 2 < 2 || p.x + w / 2 > W - 2) continue;             // 標籤要完整落在畫面內
      const r = [p.x - w / 2 - 3, p.y - h - 2, p.x + w / 2 + 3, p.y + 2];
      if (rects.some(q => !(r[2] < q[0] || r[0] > q[2] || r[3] < q[1] || r[1] > q[3]))) continue;
      rects.push(r); used[cd.cat]++;
      const el = getLabel(li++);
      if (el._key !== cd.key) { el._key = cd.key; el.innerHTML = '<b>' + esc(cd.name) + '</b><span class="v">' + esc(cd.val) + '</span>'; el.className = 'lbl ' + cd.cls; el._val = cd.val; }
      else if (el._val !== cd.val) { el._val = cd.val; el.lastChild.textContent = cd.val; }
      el.style.display = 'block'; el.style.transform = 'translate(' + (p.x | 0) + 'px,' + (p.y | 0) + 'px) translate(-50%,-100%)';
    }
  }
  for (let i = li; i < labelPool.length; i++) { if (labelPool[i].style.display !== 'none') { labelPool[i].style.display = 'none'; labelPool[i]._key = null; } }

  if (S.view !== 'bars') renderer.render(scene, camera);
  updateHUD();
  if (now - (S.lastBar || 0) > 90) { S.lastBar = now; updateBars(false); }
}

/* ================= HUD ================= */
let hudCache = '';
function farmStats() {
  const iso = byIso[S.region] ? S.region : null;
  const list = (iso && farmsByIso[iso]) || []; let n = 0, mw = 0, pn = 0, pmw = 0;
  list.forEach(f => { if (f.pipe) { pn++; pmw += f.mw; } else if (farmActive(f, S.year)) { n++; mw += farmMwAt(f, S.year); } });
  return { n, mw, total: list.filter(f => !f.pipe).length, pn, pmw };
}
function updateHUD() {
  const yr = Math.floor(S.year);
  let sOn = S.worldOn || 0, sOff = S.worldOff || 0;
  if (S.region !== 'WORLD' || !renderer) { sOn = 0; sOff = 0; C.filter(inRegion).forEach(c => { sOn += valAt(c.on, S.year); sOff += valAt(c.off, S.year); }); }
  const nm = S.region === 'WORLD' ? T('worldTotal') : scopeName();
  let html = '<div>' + esc(nm) + ' <b>' + fmtMW(sOn + sOff) + '</b></div>' +
    '<div><i class="gsw" style="background:var(--on)"></i>' + T('onshore') + ' ' + fmtMW(sOn) + ' &nbsp; <i class="gsw" style="background:var(--off)"></i>' + T('offshore') + ' ' + fmtMW(sOff) + '</div>' +
    (S.region === 'WORLD' ? '<div>' + (S.nWith || C.filter(c => capOf(c, S.year).tot > 0.5).length) + ' ' + T('countriesWith') + '</div>' : '');
  if (byIso[S.region]) {
    if (!farmsReady) html += '<div style="margin-top:4px;color:var(--ginkm)">' + T('farmsLoading') + '</div>';
    else {
      const st = farmStats();
      if (st.total || st.pn) {
        html += '<div style="margin-top:4px;color:var(--acc)">' + T('farmLayer') + L('：', ': ') + L(`已出現 ${st.n} / ${st.total} 座 · ${fmtMW(st.mw)}`, `${st.n} of ${st.total} shown · ${fmtMW(st.mw)}`) + '</div>';
        if (S.pipe && st.pn) html += '<div class="pl">' + (S.year >= Y1 - 0.02 ? L(`規劃中 ${st.pn} 案 · ${fmtMW(st.pmw)}（虛線環）`, `Pipeline: ${st.pn} projects · ${fmtMW(st.pmw)} (dashed rings)`) : T('pipeNote')) + '</div>';
      } else html += '<div style="margin-top:4px;color:var(--ginkm)">' + T('farmNone') + '</div>';
    }
  }
  if (farmsReady && fsActive()) html += '<div style="margin-top:4px;color:var(--acc)">' + esc(T('fsHud')(WW.int(fsResults().length))) + '</div>';
  if (atLT()) html += '<div class="ltn">' + esc(ltLine(byIso[S.region] || null)) + '</div>';
  const key = yr + '|' + html;
  if (key !== hudCache) { hudCache = key; $('g-yearBig').childNodes[0].nodeValue = yr; $('g-yearBig').querySelector('small').textContent = atLT() ? T('ltYear')(yr) + L(' · ', ' · ') + T('ltCap') : L(yr + ' 年 · ' + T('worldCap'), T('worldCap')); $('g-worldStat').innerHTML = html; }
  if (panelTab === 'farms') renderFarmResults(false);
  if (panelTab === 'prof' && Math.floor(S.year) !== profYear) renderProfile();
  const ll = $('g-liveLegend'), showLl = liveSeen && liveOn() && !!renderer && S.view !== 'bars' && farmsReady && S.layer !== 'fd';
  if (ll.hidden === showLl || ll._lang !== lang) { ll.hidden = !showLl; ll._lang = lang; ll.innerHTML = '<i class="gsw" style="background:var(--live)"></i>' + T('liveLegend'); }
  const lg = $('g-pipeLegend'), showLg = S.pipe && S.year >= Y1 - 0.02 && !!renderer && S.view !== 'bars' && farmsReady && S.layer !== 'fd';
  ll.classList.toggle('up', showLg);
  if (lg.hidden === showLg) {
    lg.hidden = !showLg;
    if (showLg) lg.innerHTML = '<span>' + T('pipeLegendT') + '</span>' + [1, 2, 3].map(k => '<span><i class="gsw dash p' + k + '"></i>' + T('st')[k] + '</span>').join('');
  }
  renderFdLegend();
}
/* 水下基礎圖例：範圍內、此刻營運中的離岸風場依型式分組的座數，已知型式的座數與容量占比；點一組只看這一組 */
let fdLegendKey = '';
const FL_SUBS = ['spar', 'semi', 'barge', 'tlp'];
function fdStats(region, y) {
  const n = {}, mw = {}, fls = {}; FD_GROUPS.forEach(g => { n[g] = 0; mw[g] = 0; });
  (farmsReady ? D.farms : []).forEach(f => {
    if (f.pipe || f.type === 'onshore' || !inScope(f.iso, region) || !farmActive(f, y)) return;
    const g = fdGroup(f); n[g]++; mw[g] += farmMwAt(f, y);
    if (g === 'fl') { const k = f.fd && FL_SUBS.includes(f.fd.s) ? f.fd.s : '?'; fls[k] = (fls[k] || 0) + 1; }   // 浮動式的細分型式
  });
  const tot = FD_GROUPS.reduce((a, g) => a + n[g], 0), totMw = FD_GROUPS.reduce((a, g) => a + mw[g], 0);
  return { n, mw, fls, tot, totMw, known: tot - n.unk, knownMw: totMw - mw.unk };
}
function fdPct(a, b) { const x = b ? a / b * 100 : 0; return a >= b ? '100%' : x > 0 && x < 1 ? '<1%' : Math.min(99, Math.floor(x)) + '%'; }
function renderFdLegend() {
  const el = $('g-fdLegend'), show = S.layer === 'fd' && !!renderer && S.view !== 'bars' && farmsReady;
  if (!show) { if (!el.hidden) { el.hidden = true; fdLegendKey = ''; } return; }
  const yr = Math.floor(S.year), key = [lang, yr, S.region, S.fdOnly || '', !!FD, S.pipe && S.year >= Y1 - 0.02].join('|');
  if (key === fdLegendKey && !el.hidden) return;
  fdLegendKey = key; el.hidden = false;
  const st = fdStats(S.region, S.year);
  el.innerHTML = '<div class="fdh"><b>' + esc(T('fdTitle')) + '</b> · ' + esc(st.tot ? T('fdCov')(WW.int(st.known), WW.int(st.tot), fdPct(st.knownMw, st.totMw)) : T('fdNoFarm')) + '</div>' +
    '<div class="fdrow" role="group" aria-label="' + esc(T('fdTitle')) + '">' + FD_GROUPS.map(g => '<button type="button" class="fdchip' + (S.fdOnly === g ? ' on' : '') + (S.fdOnly && S.fdOnly !== g ? ' off' : '') +
      '" data-g="' + g + '" aria-pressed="' + (S.fdOnly === g) + '" title="' + esc(T('fdGroupTip')[g]) + '"><i class="fdsw fd-' + g + '"></i>' + esc(T('fdGroup')[g]) + ' <b>' + WW.int(st.n[g]) + '</b></button>').join('') + '</div>' +
    '<div class="fdn">' + esc(T('fdIso')) + ' · <a href="https://github.com/dofliu/windfarmTaiwan/blob/main/docs/foundations' + (lang === 'en' ? '.en' : '') + '.md" target="_blank" rel="noopener">' + esc(T('fdDoc')) + '</a></div>';
  el.querySelectorAll('.fdchip').forEach(b => { b.onclick = () => { S.fdOnly = S.fdOnly === b.dataset.g ? null : b.dataset.g; fdLegendKey = ''; renderFdLegend(); updateClusters(0, true); syncURL(); }; });
}

/* ================= side panel: milestones, farms, profile ================= */
let msRendered = -1;
function renderMilestones(force) {
  const yr = Math.floor(S.year);
  const shown = D.milestones.filter(m => m.year <= yr && inScope(m.iso));
  if (!force && shown.length === msRendered) return;
  msRendered = shown.length;
  const box = $('g-msList');
  box.innerHTML = '<div class="gnote">' + T('msFocus') + '</div>';
  shown.slice().reverse().forEach((m, i) => {
    const d = document.createElement('button'); d.type = 'button'; d.className = 'msItem' + (i === 0 ? ' new' : '');
    const c = byIso[m.iso]; const cn = c ? cname(c) : m.iso;
    d.innerHTML = '<span class="y">' + m.year + '</span><span class="n">' + esc(m.name) + '</span>' +
      '<span class="t"><span class="gtag ' + stCls({ type: m.type }) + '">' + T('type')[m.type] + '</span>' + esc(cn) + (m.maker ? ' · ' + esc(m.maker) : '') + '</span>';
    d.onclick = () => openStop(msStop(m));
    box.appendChild(d);
  });
}
/* ================= 全球風場搜尋與篩選 =================
   依名稱、中文名、開發商、機型、國名搜尋，依狀態、類型、容量、年份篩選；範圍跟著「範圍」選單（全世界／洲／國家）。
   有任何條件時，地圖只畫符合的風場（見 pickFarms），國家的風機符號淡出——清單與地圖用同一份結果。 */
const SQ_ST = ['op', 'p1', 'p2', 'p3', 'ret'];                 // 依序對應 f.st 0–4
const SQ_TY = ['on', 'off', 'fl'];
const SQ_MIN = [0, 10, 50, 100, 300, 1000];
const SQ = { q: '', st: [], ty: [], min: 0, y0: 0, y1: 0, sort: 'mw', limit: 200 };
let fsTokens = [], fsCache = null, fsRev = 0, fsTimer = 0, farmRendered = '';
const fsActive = () => !!(SQ.q || SQ.st.length || SQ.ty.length || SQ.min || SQ.y0 || SQ.y1);
const tyKey = f => f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'fl' : 'off';
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/ł/g, 'l').replace(/đ/g, 'd');   // Ørsted＝Orsted
function hayOf(f) {                          // 搜尋用的字串：名稱、中文名、開發商、機型、國名（中英）
  if (f._hay) return f._hay;
  const c = byIso[f.iso];
  return (f._hay = fold([f.name, f.zh, f.owner, f.turbine, c && c.name, c && c.zh, f.iso].filter(Boolean).join(' | ')));
}
function fsMatch(f) {
  if (SQ.st.length && !SQ.st.includes(SQ_ST[f.st])) return false;
  if (SQ.ty.length && !SQ.ty.includes(tyKey(f))) return false;
  if (SQ.min && !(f.mw >= SQ.min)) return false;
  if ((SQ.y0 || SQ.y1) && (f.yu || !f.year || (SQ.y0 && f.year < SQ.y0) || (SQ.y1 && f.year > SQ.y1))) return false;
  if (fsTokens.length) { const h = hayOf(f); for (const t of fsTokens) if (!h.includes(t)) return false; }
  return true;
}
/* 範圍內符合條件的風場（清單依選定的排序；地圖另用依容量排序的一份）；同一組條件只算一次 */
function fsResults() {
  const key = [fsRev, S.region, SQ.sort, lang, farmsReady].join('|');
  if (fsCache && fsCache.key === key) return fsCache.list;
  const list = farmsReady ? D.farms.filter(f => inScope(f.iso) && fsMatch(f)) : [];
  const byMw = list.slice().sort((a, b) => b.mw - a.mw);
  if (SQ.sort === 'year') list.sort((a, b) => (b.yu ? 0 : b.year || 0) - (a.yu ? 0 : a.year || 0) || b.mw - a.mw);
  else if (SQ.sort === 'name') { const co = new Intl.Collator(lang === 'zh' ? 'zh-Hant-TW' : 'en'); list.sort((a, b) => co.compare(fname(a), fname(b))); }
  else list.sort((a, b) => b.mw - a.mw);
  fsCache = { key, list, byMw };
  return list;
}
function fsChanged() {                        // 條件改變：清單、地圖、網址一起更新
  fsRev++; fsTokens = fold(SQ.q).split(/\s+/).filter(Boolean); SQ.limit = 200;
  farmLayerDirty = true; hudCache = '';
  renderFarmResults(true); syncURL();
}
function fsReset() { Object.assign(SQ, { q: '', st: [], ty: [], min: 0, y0: 0, y1: 0 }); fsChanged(); renderFarmList(true); }
let fsMaxYear = 0;
function yearOpts(sel) {
  if (!fsMaxYear) fsMaxYear = farmsReady ? D.farms.reduce((m, f) => f.year && f.year < 2100 && f.year > m ? f.year : m, Y1) : Y1;
  let o = '<option value="0">' + esc(T('fsAny')) + '</option>';
  for (let y = Y0; y <= fsMaxYear; y++) o += '<option value="' + y + '"' + (sel === y ? ' selected' : '') + '>' + y + '</option>';
  return o;
}
/* 「風場」分頁：控制項只在開分頁、換語言或換範圍時重建（打字時不重建輸入框），結果區另外更新 */
function renderFarmList() {
  if (panelTab !== 'farms') return;
  const box = $('g-farmList');
  if (!farmsReady) { box.innerHTML = '<div class="gnote">' + T('farmsLoading') + '</div>'; farmRendered = ''; return; }
  const chips = (g, items) => '<div class="gchips" role="group" data-g="' + g + '">' + items.map(([v, t]) => { const on = SQ[g].includes(v); return '<button type="button" data-v="' + v + '" aria-pressed="' + on + '"' + (on ? ' class="active"' : '') + '>' + esc(t) + '</button>'; }).join('') + '</div>';
  const opt = (v, t, cur) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + esc(t) + '</option>';
  box.innerHTML = '<div class="fsx">' +
    '<input type="search" id="g-fq" placeholder="' + esc(T('fsPh')) + '" aria-label="' + esc(T('fsPh')) + '" value="' + esc(SQ.q) + '" autocomplete="off">' +
    '<div class="fsrow"><span class="fsl">' + esc(T('fsSt')) + '</span>' + chips('st', SQ_ST.map((k, i) => [k, T('st')[i]])) + '</div>' +
    '<div class="fsrow"><span class="fsl">' + esc(T('fsTy')) + '</span>' + chips('ty', [['on', T('type').onshore], ['off', T('type').offshore], ['fl', T('type').floating]]) + '</div>' +
    '<div class="fsrow fsel"><label>' + esc(T('fsMin')) + ' <select id="g-fmin">' + SQ_MIN.map(v => opt(v, v ? '≥ ' + WW.int(v) + ' MW' : T('fsAny'), SQ.min)).join('') + '</select></label>' +
      '<label>' + esc(T('fsYear')) + ' <select id="g-fy0">' + yearOpts(SQ.y0) + '</select></label><label aria-label="' + esc(T('fsYear')) + '">– <select id="g-fy1">' + yearOpts(SQ.y1) + '</select></label>' +
      '<label>' + esc(T('fsSort')) + ' <select id="g-fsort">' + opt('mw', T('fsMin'), SQ.sort) + opt('year', T('fsYear'), SQ.sort) + opt('name', T('fsName'), SQ.sort) + '</select></label></div>' +
    '<div class="fsrow fsbar"><button type="button" class="fsclr">' + esc(T('fsClear')) + '</button>' + (S.region !== 'WORLD' ? '<button type="button" class="fsworld">' + esc(T('fsWorld')) + '</button>' : '') + '</div>' +
    '</div><div class="fres"></div>';
  const q = box.querySelector('#g-fq');
  q.oninput = () => { clearTimeout(fsTimer); fsTimer = setTimeout(() => { if (SQ.q !== q.value.trim()) { SQ.q = q.value.trim(); fsChanged(); } }, 160); };
  q.onkeydown = e => { if (e.key === 'Enter') { const r = fsResults(); if (r.length) selectFarm(r[0]); } };
  box.querySelectorAll('.gchips[data-g]').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => {
    const arr = SQ[g.dataset.g], v = b.dataset.v, i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else arr.push(v);
    b.classList.toggle('active', i < 0); b.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
    fsChanged();
  }));
  box.querySelector('#g-fmin').onchange = e => { SQ.min = +e.target.value || 0; fsChanged(); };
  box.querySelector('#g-fy0').onchange = e => { SQ.y0 = +e.target.value || 0; fsChanged(); };
  box.querySelector('#g-fy1').onchange = e => { SQ.y1 = +e.target.value || 0; fsChanged(); };
  box.querySelector('#g-fsort').onchange = e => { SQ.sort = e.target.value; SQ.limit = 200; renderFarmResults(true); };
  box.querySelector('.fsclr').onclick = fsReset;
  const w = box.querySelector('.fsworld'); if (w) w.onclick = () => setRegion('WORLD');
  farmRendered = '';
  renderFarmResults(true);
}
function farmRow(f) {
  const d = document.createElement('button'); d.type = 'button';
  const gone = (f.end && S.year >= f.end) || (!f.pipe && fAge(f) < 0);           // 這個年份不在地圖上：淡色
  d.className = 'msItem' + (!f.pipe && !f.yu && fAge(f) >= 0 && fAge(f) < 1.5 ? ' new' : '') + (gone ? ' gone' : '') + (f.pipe ? ' pipe' : '');
  const yr = f.pipe ? (f.year ? T('expected') + ' ' + f.year : T('st')[f.st]) : (f.yu ? '—' : f.year + (f.end ? '–' + f.end : ''));
  const where = S.region !== f.iso && byIso[f.iso] ? ' · ' + esc(cname(byIso[f.iso])) : '';
  d.innerHTML = '<span class="y">' + esc(String(yr)) + '</span><span class="n">' + esc(fname(f)) + '</span>' +
    '<span class="t"><span class="gtag ' + stCls(f) + '">' + (f.pipe ? T('st')[f.st] : T('type')[f.type]) + '</span>' + fmtMW(f.mw) + where + (f.turbine ? ' · ' + esc(f.turbine) : f.owner ? ' · ' + esc(f.owner) : '') + '</span>';
  const lv = liveOn() && liveFor(f);
  if (lv) d.querySelector('.t').insertAdjacentHTML('beforeend', ' · <b class="lv">● ' + WW.num(lv.mw, lv.mw < 100 ? 1 : 0) + ' MW</b>');
  d.onclick = () => selectFarm(f);
  return d;
}
function renderFarmResults(force) {
  if (panelTab !== 'farms' || !farmsReady) return;
  const box = $('g-farmList').querySelector('.fres'); if (!box) return;
  const list = fsResults(), on = fsActive(), yr = Math.floor(S.year + 1e-6);
  const key = [fsCache.key, SQ.limit, yr, S.pipe, S.layer, S.fdOnly, liveOn(), portsReady].join('|');
  if (!force && key === farmRendered) return; farmRendered = key;
  const mw = list.reduce((s, f) => s + f.mw, 0), scope = S.region === 'WORLD' ? L('全球', 'worldwide') : scopeName();
  let html = '<div class="gnote fshead">' + esc((on ? T('fsCount') : T('fsAll'))(WW.int(list.length), fmtMW(mw))) + ' · ' + esc(T('fsScope')(scope)) + (on ? '<br>' + esc(T('fsMapOnly')) : '') + '</div>';
  if (on && list.length) {
    const hidden = list.filter(f => !farmActive(f, S.year) || !showFarm(f)).length;
    const fix = S.year < Y1 - 0.02 || (!S.pipe && list.some(f => f.pipe)) || S.layer !== 'both';
    if (hidden) html += '<div class="gnote fshide">' + esc(T('fsHidden')(yr, WW.int(hidden))) + (fix ? ' <button type="button" class="fslatest">' + esc(T('fsToLatest')) + '</button>' : '') + '</div>';
  }
  if (fsTokens.length && portsReady) {                  // 名稱也符合的港口列在最前面
    const pm = PORTS.filter(p => inScope(p.iso) && portMatch(p, fsTokens));
    if (pm.length) html += '<div class="fsports"><div class="fh">⚓ ' + esc(T('portsTab')) + '</div>' + pm.slice(0, 5).map(portRowHTML).join('') +
      (pm.length > 5 ? '<button type="button" class="gmore fsallports">' + esc(T('portsAll')) + '</button>' : '') + '</div>';
  }
  box.innerHTML = html;
  const lb = box.querySelector('.fslatest');
  if (lb) lb.onclick = () => { if (list.some(f => f.pipe) && !S.pipe) togglePipe(true); if (S.layer !== 'both') { S.layer = 'both'; S.fdOnly = null; $('g-layerSel').value = 'both'; layerChanged(); updateBars(true); farmLayerDirty = true; } S.year = Y1; syncYearUI(); syncURL(); renderFarmResults(true); };
  box.querySelectorAll('[data-port]').forEach(b => b.onclick = () => { const p = PORTS.find(x => x.id === b.dataset.port); if (p) selectPort(p); });
  const ap = box.querySelector('.fsallports'); if (ap) ap.onclick = () => { PT_UI.q = SQ.q; setPanelTab('ports'); };
  list.slice(0, SQ.limit).forEach(f => box.appendChild(farmRow(f)));
  if (!list.length) box.insertAdjacentHTML('beforeend', '<div class="gnote">' + esc(T('fsNone')) + '</div>');
  if (list.length > SQ.limit) {
    const m = document.createElement('button'); m.type = 'button'; m.className = 'gmore'; m.textContent = T('more') + ` (${WW.int(list.length - SQ.limit)})`;
    m.onclick = () => { SQ.limit += 300; renderFarmResults(true); }; box.appendChild(m);
  }
}
function expandPanel() { const pn = $('g-msPanel'); if (pn.classList.contains('collapsed')) { pn.classList.remove('collapsed'); $('g-msToggle').textContent = '–'; } }
function openSearch() {                        // 工具列「搜尋」與 / 鍵
  if (TOUR) tourEnd(false);
  if (cardItem && window.innerWidth <= 900) closeCard();            // 手機：資訊卡會蓋住面板
  expandPanel();
  setPanelTab('farms');
  const q = $('g-fq'); if (q) { q.focus(); q.select(); }
}
/* ================= 港口：離岸風電的組裝出港、製造與運維港口（data/global/ports.json，2026-09 整理，每港附出處） =================
   地圖上以 DOM 錨點標示（全球視角縮成小點，拉近才有圖示與名稱標籤）；點選開港口卡片，可搜尋，也有「港口」分頁 */
const PORT_ROLES = ['marshalling', 'foundation', 'tower', 'blade', 'nacelle', 'cable', 'floating', 'om'];
let PORTS = [], portsReady = false, focusPort = null, pendingPort = null, portRendered = '';
const PT_UI = { q: '', role: '' };
S.ports = WW.store.get('ww_globe_ports', '1') === '1';
const pname = p => lang === 'zh' && p.zh ? p.zh : p.name;
const portRoles = (p, n) => p.roles.slice(0, n || 9).map(r => T('role')[r]).join(lang === 'zh' ? '、' : ', ');
function portHay(p) {
  if (p._hay) return p._hay;
  const c = byIso[p.iso];
  return (p._hay = fold([p.name, p.zh, c && c.name, c && c.zh, p.iso, ...p.roles.map(r => I18N.zh.role[r] + ' ' + I18N.en.role[r]), ...(p.farms || []), ...(p.farmsOther || [])].filter(Boolean).join(' | ')));
}
const portMatch = (p, toks) => { const h = portHay(p); return toks.every(t => h.includes(t)); };
function loadPorts() {
  return WW.getJSON(WW.DATA.ports).then(j => {
    const box = $('g-ports');
    PORTS = (j.ports || []).filter(p => isFinite(p.lat) && isFinite(p.lon) && p.id);
    PORTS.forEach(p => {
      p.roles = (p.roles || []).filter(r => PORT_ROLES.includes(r));
      const b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1;          // 鍵盤改用「港口」分頁的清單
      b.className = 'pmk' + (p.status === 'developing' ? ' dev' : p.status === 'former' ? ' old' : ''); b.textContent = '⚓'; b.style.display = 'none';
      b.onclick = e => { e.stopPropagation(); selectPort(p); };
      b.onmouseenter = ev => showTip(ev, tipPort(p), $('g-mapPane'));
      b.onmousemove = ev => moveTip(ev, $('g-mapPane'));
      b.onmouseleave = hideTip;
      p._el = b; p._vis = false; box.appendChild(b);
    });
    layoutPorts(); portsReady = true; farmRendered = '';
    if (panelTab === 'ports') renderPortList(true);
    if (panelTab === 'farms') renderFarmResults(true);
    if (pendingPort) { const id = pendingPort; pendingPort = null; const p = PORTS.find(x => x.id === id); if (p) selectPort(p); }
  }).catch(e => { console.error(e); });
}
function layoutPorts() { PORTS.forEach(p => { p._pos = posAt(p.lon, p.lat, 0, p._pos); }); }
function tipPort(p) {
  const st = p.status === 'developing' ? T('portDev') : p.status === 'former' ? T('portOld') : '';
  return '<b>⚓ ' + esc(pname(p)) + '</b>' + (st ? ' <span style="color:var(--ink-2)">(' + esc(st) + ')</span>' : '') +
    '<br>' + esc(portRoles(p)) + '<br><span style="color:var(--ink-2)">' + esc(lang === 'zh' ? p.zhNote || p.en : p.en) + '</span><div class="hint2">' + T('clickMore') + '</div>';
}
/* 每一格：錨點跟著地球轉；背面或畫面外就藏起來。全球視角縮成小點，拉近或被選取時才有圖示與名稱標籤 */
function updatePorts(alt, cands) {
  if (!portsReady) return;
  const show = S.ports && S.view !== 'bars' && !TOUR, far = alt > 60;
  const scoped = S.region === 'WORLD' || S.region.startsWith('C:');
  for (const p of PORTS) {
    let vis = show && (scoped ? inScope(p.iso) : (p.iso === S.region || alt < 25 || p === focusPort));
    if (vis) {
      tmpW.copy(p._pos).applyMatrix4(surfaceRoot.matrixWorld);
      vis = facing(tmpW);
      if (vis) {
        const q = project(tmpW);
        vis = q.z <= 1 && q.x > -12 && q.x < W + 12 && q.y > -12 && q.y < H + 12;
        if (vis) {
          p._el.style.transform = 'translate(' + (q.x | 0) + 'px,' + (q.y | 0) + 'px) translate(-50%,-50%)';
          if (!far || p === focusPort) cands.push({ cat: 'p', pri: p === focusPort ? 2e9 : 5e7 + p.roles.length * 1e5, pos: tmpW.clone(), dy: 12,
            name: '⚓ ' + pname(p), val: portRoles(p, 2), cls: 'port' + (p === focusPort ? ' focus' : ''), key: 'p' + p.id });
        }
      }
    }
    if (p._vis !== vis) { p._vis = vis; p._el.style.display = vis ? '' : 'none'; }
    const small = far && p !== focusPort; if (p._far !== small) { p._far = small; p._el.classList.toggle('far', small); }
    const sel = p === focusPort; if (p._sel !== sel) { p._sel = sel; p._el.classList.toggle('sel', sel); }
  }
}
function togglePorts(on) {
  S.ports = on != null ? on : !S.ports; WW.store.set('ww_globe_ports', S.ports ? '1' : '0');
  const b = $('g-btnPorts'); b.classList.toggle('active', S.ports); b.setAttribute('aria-pressed', S.ports ? 'true' : 'false');
}
const portItem = p => ({ kind: 'port', p, name: p.name, zh: p.zh, lat: p.lat, lon: p.lon, iso: p.iso, year: p.since || null });
function selectPort(p) {
  setPlaying(false); if (TOUR) tourEnd(false);
  if (!S.ports) togglePorts(true);
  if (byIso[p.iso] && S.region !== p.iso) setRegion(p.iso, true);
  focusFarm = null; focusPort = p; focusEvent = null;
  flyToLonLat(p.lon, p.lat, 1.3);
  renderCard(portItem(p));
  syncURL();
}
/* 港口 → 服務過的風場：選取港口時從碼頭畫弧線到每座對得到資料的風場（弧高依距離；球面與平面都重畫）。
   弧線掛在 surfaceRoot 底下，跟著放大與投影切換；港口取消選取或港口層關閉時移除 */
let portArcs = null, portArcsKey = '';
function updatePortArcs() {
  const p = focusPort && S.ports && S.view !== 'bars' && farmsReady ? focusPort : null;
  const key = p ? [p.id, S.modeT.toFixed(3), lang].join('|') : '';
  if (key === portArcsKey) return; portArcsKey = key;
  if (portArcs) { surfaceRoot.remove(portArcs); portArcs.geometry.dispose(); portArcs.material.dispose(); portArcs = null; }
  if (!p) return;
  const farms = (p.farms || []).map(farmNamed).filter(Boolean); if (!farms.length) return;
  const pts = [], a = new THREE.Vector3(), N = 28;
  farms.forEach(f => {
    const dLon = f.lon - p.lon, dLat = f.lat - p.lat, dist = Math.sqrt(dLon * dLon * Math.cos(p.lat * D2R) ** 2 + dLat * dLat);   // 度
    const hMax = clamp(dist * 0.12, 0.02, 0.8);
    for (let i = 0; i <= N; i++) {
      const t = i / N; posAt(p.lon + dLon * t, p.lat + dLat * t, Math.sin(t * Math.PI) * hMax, a);
      if (i > 0 && i < N) pts.push(a.x, a.y, a.z);                 // 每個中間點出現兩次（線段的終點與下一段起點）
      pts.push(a.x, a.y, a.z);
    }
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  portArcs = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.85 }));
  portArcs.renderOrder = 5; surfaceRoot.add(portArcs);
}
let farmByName = null;
function farmNamed(n) {
  if (!farmsReady) return null;
  if (!farmByName) { farmByName = new Map(); D.farms.forEach(f => farmByName.set(f.name, f)); }
  return farmByName.get(n) || null;
}
const portStatusTag = p => p.status === 'developing' ? '<span class="gtag p2">' + esc(T('portDev')) + '</span>' : p.status === 'former' ? '<span class="gtag ret">' + esc(T('portOld')) + '</span>' : '';
const portRowHTML = p => '<button type="button" class="msItem port' + (p.status === 'developing' ? ' pipe' : p.status === 'former' ? ' gone' : '') + '" data-port="' + esc(p.id) + '"><span class="y">⚓</span><span class="n">' + esc(pname(p)) + '</span>' +
  '<span class="t">' + (byIso[p.iso] ? esc(cname(byIso[p.iso])) + ' · ' : '') + portStatusTag(p) + esc(portRoles(p)) + '</span></button>';
/* 「港口」分頁：範圍內的港口，可搜尋、依角色篩選 */
function renderPortList() {
  if (panelTab !== 'ports') return;
  const box = $('g-portList');
  if (!portsReady) { box.innerHTML = '<div class="gnote">' + T('farmsLoading') + '</div>'; portRendered = ''; return; }
  box.innerHTML = '<div class="fsx"><input type="search" id="g-pq" placeholder="' + esc(T('fsPh')) + '" aria-label="' + esc(T('portsTab')) + '" value="' + esc(PT_UI.q) + '" autocomplete="off">' +
    '<div class="gchips" role="group">' + [''].concat(PORT_ROLES).map(r => '<button type="button" data-r="' + r + '" aria-pressed="' + (PT_UI.role === r) + '"' + (PT_UI.role === r ? ' class="active"' : '') + '>' + esc(r ? T('role')[r] : T('fAll')) + '</button>').join('') + '</div></div><div class="pres"></div>';
  const q = box.querySelector('#g-pq');
  q.oninput = () => { PT_UI.q = q.value.trim(); renderPortResults(); };
  box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { PT_UI.role = b.dataset.r; box.querySelectorAll('[data-r]').forEach(x => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); renderPortResults(); });
  renderPortResults();
}
function renderPortResults() {
  const box = $('g-portList').querySelector('.pres'); if (!box) return;
  const toks = fold(PT_UI.q).split(/\s+/).filter(Boolean);
  const list = PORTS.filter(p => inScope(p.iso) && (!PT_UI.role || p.roles.includes(PT_UI.role)) && (!toks.length || portMatch(p, toks)));
  const co = new Intl.Collator(lang === 'zh' ? 'zh-Hant-TW' : 'en');
  list.sort((a, b) => co.compare(byIso[a.iso] ? cname(byIso[a.iso]) : a.iso, byIso[b.iso] ? cname(byIso[b.iso]) : b.iso) || co.compare(pname(a), pname(b)));
  box.innerHTML = '<div class="gnote">' + esc(T('portsHead')(list.length)) + ' · ' + esc(T('fsScope')(S.region === 'WORLD' ? L('全球', 'worldwide') : scopeName())) + '<br>' + esc(T('portNote')) + '</div>' +
    (list.length ? list.map(portRowHTML).join('') : '<div class="gnote">' + esc(T('portNone')) + '</div>');
  box.querySelectorAll('[data-port]').forEach(b => b.onclick = () => { const p = PORTS.find(x => x.id === b.dataset.port); if (p) selectPort(p); });
}
/* ================= 重大事件與事故（data/global/events.json，tools/build_events.py 自 2026-09 人工查證的 CSV 產生；每筆附一手來源） =================
   地圖上以 DOM 標記標示：時間軸到達事件年份才出現（2026 年的在最新年份顯示）；沒有座標但對得到風場的用風場位置；「事件」分頁可搜尋、依類型篩選；
   點選開事件卡（摘要、容量口徑、傷亡、出處、照片頁面與權利狀態、相關風場）。風場卡片也列出該場的相關事件。 */
let EVENTS = [], eventsReady = false, focusEvent = null, pendingEvent = null, evRendered = '';
const EV_UI = { q: '', cat: '' };
const EV_CATS = ['ms', 'inc', 'pol'];
const EV_ICON = { ms: '✦', inc: '!', pol: '§' };
S.events = WW.store.get('ww_globe_events', '1') === '1';
const evL = a => Array.isArray(a) ? (lang === 'zh' ? (a[0] || a[1]) : (a[1] || a[0])) : (a || '');
const evTitle = e => evL(e.title);
const evDate = e => e.date + (e.prec !== 'd' && T('evDatePrec')[e.prec] ? ' ' + T('evDatePrec')[e.prec] : '');
const evShown = e => e.year <= Math.floor(S.year) || (e.year > Y1 && S.year >= Y1 - 0.02);   // 時間軸只到 Y1：之後的事件在最新年份顯示
function evHay(e) {
  if (e._hay) return e._hay;
  const c = byIso[e.iso];
  return (e._hay = fold([e.id, e.title[0], e.title[1], e.project[0], e.project[1], e.area[0], e.area[1], e.sub[0], e.sub[1], e.owner, e.turbine, e.org && e.org[0], e.org && e.org[1], c && c.name, c && c.zh, e.iso, ...(e.farms || [])].filter(Boolean).join(' | ')));
}
function evPos(e) {                            // 事件座標；沒有的用第一個對得到的風場（風場資料載入後才有）
  if (e.lat != null && e.lon != null) return { lat: e.lat, lon: e.lon, byFarm: false };
  for (const n of e.farms || []) { const f = farmNamed(n); if (f) return { lat: f.lat0 != null ? f.lat0 : f.lat, lon: f.lon0 != null ? f.lon0 : f.lon, byFarm: true }; }
  return null;
}
function loadEvents() {
  return WW.getJSON(WW.DATA.events).then(j => {
    const box = $('g-events');
    EVENTS = (j.events || []).filter(e => e.id && e.year && EV_CATS.includes(e.cat));
    D.eventsMeta = j.meta || null;
    EVENTS.forEach(e => {
      const b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1;          // 鍵盤改用「事件」分頁的清單
      b.className = 'emk ' + e.cat; b.textContent = EV_ICON[e.cat]; b.style.display = 'none';
      b.onclick = ev => { ev.stopPropagation(); selectEvent(e); };
      b.onmouseenter = ev => showTip(ev, tipEvent(e), $('g-mapPane'));
      b.onmousemove = ev => moveTip(ev, $('g-mapPane'));
      b.onmouseleave = hideTip;
      e._el = b; e._vis = false; box.appendChild(b);
    });
    eventsReady = true; layoutEvents();
    if (panelTab === 'events') renderEventList(true);
    if (cardItem && cardItem.kind === 'farm') renderCard(cardItem);          // 風場卡片比事件資料先開：補上相關事件
    if (pendingEvent) { const id = pendingEvent; pendingEvent = null; const e = EVENTS.find(x => x.id === id); if (e) selectEvent(e); }
  }).catch(e => { console.error(e); });
}
function layoutEvents() { EVENTS.forEach(e => { const p = evPos(e); e._p = p; e._pos = p ? posAt(p.lon, p.lat, 0, e._pos || undefined) : null; }); }
function tipEvent(e) {
  return '<b>' + esc(EV_ICON[e.cat] + ' ' + evTitle(e)) + '</b><br>' + esc(evDate(e)) + ' · ' + esc(T('evCat')[e.cat]) + ' · ' + esc(evL(e.sub)) +
    '<br><span style="color:var(--ink-2)">' + esc(evL(e.project)) + '</span><div class="hint2">' + T('clickMore') + '</div>';
}
/* 每一格：標記跟著地球轉；背面、畫面外或時間軸還沒到就藏起來。全球視角縮成小點，拉近、剛發生或被選取時才有圖示與標籤 */
function updateEvents(alt, cands) {
  if (!eventsReady) return;
  const show = S.events && S.view !== 'bars' && !TOUR, far = alt > 60;
  const scoped = S.region === 'WORLD' || S.region.startsWith('C:');
  for (const e of EVENTS) {
    let vis = show && !!e._pos && evShown(e) && (scoped ? inScope(e.iso) : (e.iso === S.region || alt < 25 || e === focusEvent));
    if (vis) {
      tmpW.copy(e._pos).applyMatrix4(surfaceRoot.matrixWorld);
      vis = facing(tmpW);
      if (vis) {
        const q = project(tmpW);
        vis = q.z <= 1 && q.x > -12 && q.x < W + 12 && q.y > -12 && q.y < H + 12;
        if (vis) {
          e._el.style.transform = 'translate(' + (q.x | 0) + 'px,' + (q.y | 0) + 'px) translate(-50%,-50%)';
          const recent = S.year - e.year < 1.5 && S.year < Y1 - 0.02;
          if (!far || e === focusEvent || recent) cands.push({ cat: 'e', pri: e === focusEvent ? 2e9 : (recent ? 9e7 : 4e7) + (3 - e.pri) * 1e6 + (e.cat === 'inc' ? 5e5 : 0), pos: tmpW.clone(), dy: 12,
            name: EV_ICON[e.cat] + ' ' + evTitle(e), val: evDate(e) + ' · ' + evL(e.project), cls: 'ev ' + e.cat + (e === focusEvent ? ' focus' : ''), key: 'e' + e.id });
        }
      }
    }
    if (e._vis !== vis) { e._vis = vis; e._el.style.display = vis ? '' : 'none'; }
    const small = far && e !== focusEvent; if (e._far !== small) { e._far = small; e._el.classList.toggle('far', small); }
    const sel = e === focusEvent; if (e._sel !== sel) { e._sel = sel; e._el.classList.toggle('sel', sel); }
  }
}
function toggleEvents(on) {
  S.events = on != null ? on : !S.events; WW.store.set('ww_globe_events', S.events ? '1' : '0');
  const b = $('g-btnEvents'); b.classList.toggle('active', S.events); b.setAttribute('aria-pressed', S.events ? 'true' : 'false');
}
const eventItem = e => { const p = e._p || evPos(e); return { kind: 'event', e, name: e.title[1] || e.title[0], zh: e.title[0], lat: p ? p.lat : null, lon: p ? p.lon : null, byFarm: !!(p && p.byFarm), iso: e.iso, year: e.year }; };
/* 鏡頭飛到事件；對得到風場的把那座風場設為焦點（畫出全部風機） */
function evFocus(e, fly) {
  const p = e._p || (e._p = evPos(e));
  const f = (e.farms || []).map(farmNamed).find(Boolean) || null;
  focusFarm = f; focusPort = null; updateClusters(0, true);
  if (p && fly) flyToLonLat(p.lon, p.lat, f ? farmAlt(f) * 1.25 : 1.3);
  return p;
}
function selectEvent(e) {
  setPlaying(false); if (TOUR) tourEnd(false);
  if (!S.events) toggleEvents(true);
  if (!evShown(e)) { S.year = clamp(e.year + 0.5, Y0, Y1); syncYearUI(); }
  if (byIso[e.iso] && S.region !== e.iso) setRegion(e.iso, true);
  focusEvent = e; if (!evFocus(e, true)) flyToRegion(false);          // 沒有座標也對不到風場：至少飛到該國
  renderCard(eventItem(e));
  syncURL();
}
const evCatTag = e => '<span class="gtag ev ' + e.cat + '">' + esc(T('evCat')[e.cat]) + '</span>';
const evRowHTML = e => '<button type="button" class="msItem ev ' + e.cat + '" data-ev="' + esc(e.id) + '"><span class="y">' + esc(evDate(e)) + '</span><span class="n">' + esc(evTitle(e)) + '</span>' +
  '<span class="t">' + evCatTag(e) + esc((byIso[e.iso] ? cname(byIso[e.iso]) + ' · ' : '') + evL(e.project) + (e.deaths ? ' · ' + T('evDeaths')(e.deaths) : '')) + '</span></button>';
const wireEvRows = root => root.querySelectorAll('[data-ev]').forEach(b => { b.onclick = () => { const e = EVENTS.find(x => x.id === b.dataset.ev); if (e) selectEvent(e); }; });
/* 「事件」分頁：範圍內、時間軸已到的事件，可搜尋、依類型篩選，最新的在上面 */
function renderEventList() {
  if (panelTab !== 'events') return;
  const box = $('g-evList');
  if (!eventsReady) { box.innerHTML = '<div class="gnote">' + T('farmsLoading') + '</div>'; evRendered = ''; return; }
  box.innerHTML = '<div class="fsx"><input type="search" id="g-eq" placeholder="' + esc(T('evPh')) + '" aria-label="' + esc(T('evTab')) + '" value="' + esc(EV_UI.q) + '" autocomplete="off">' +
    '<div class="gchips" role="group">' + [''].concat(EV_CATS).map(c => '<button type="button" data-c="' + c + '" aria-pressed="' + (EV_UI.cat === c) + '"' + (EV_UI.cat === c ? ' class="active"' : '') + '>' + esc(c ? T('evCat')[c] : T('fAll')) + '</button>').join('') + '</div></div><div class="eres"></div>';
  const q = box.querySelector('#g-eq');
  q.oninput = () => { EV_UI.q = q.value.trim(); renderEventResults(true); };
  box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { EV_UI.cat = b.dataset.c; box.querySelectorAll('[data-c]').forEach(x => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); renderEventResults(true); });
  evRendered = ''; renderEventResults(true);
}
function renderEventResults(force) {
  const box = $('g-evList').querySelector('.eres'); if (!box || !eventsReady) return;
  const toks = fold(EV_UI.q).split(/\s+/).filter(Boolean);
  const all = EVENTS.filter(e => inScope(e.iso) && (!EV_UI.cat || e.cat === EV_UI.cat) && (!toks.length || toks.every(t => evHay(e).includes(t))));
  const list = all.filter(evShown), later = all.length - list.length;
  const key = [S.region, EV_UI.cat, EV_UI.q, list.length, later, Math.floor(S.year), lang].join('|');
  if (!force && key === evRendered) return;
  evRendered = key;
  list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  box.innerHTML = '<div class="gnote">' + esc(T('evHead')(list.length)) + ' · ' + esc(T('fsScope')(S.region === 'WORLD' ? L('全球', 'worldwide') : scopeName())) +
    (later ? '<br>' + esc(T('evLater')(Math.floor(S.year), later)) + ' <button type="button" class="fslatest">' + esc(T('fsToLatest')) + '</button>' : '') + '<br>' + esc(T('evNote')) + '</div>' +
    (list.length ? list.map(evRowHTML).join('') : '<div class="gnote">' + esc(T('evNone')) + (S.region !== 'WORLD' ? ' <button type="button" class="fsworld">' + esc(T('fsWorld')) + '</button>' : '') + '</div>');
  wireEvRows(box);
  const ww = box.querySelector('.fsworld'); if (ww) ww.onclick = () => { closeCard(); setRegion('WORLD'); };
  const lt = box.querySelector('.fslatest'); if (lt) lt.onclick = () => { S.year = Y1; syncYearUI(); };
}
const eventsForFarm = f => eventsReady && f && !f.pseudo ? EVENTS.filter(e => e.farms && e.farms.includes(f.name)).sort((a, b) => (a.date < b.date ? 1 : -1)) : [];
/* 風場卡片裡的「相關事件」 */
function evFarmSection(f) {
  const evs = eventsForFarm(f); if (!evs.length) return '';
  return '<details class="frel evrel" data-k="fev"' + (WW.store.get('ww_card_fev', '1') === '1' ? ' open' : '') + '><summary>' + esc(T('evOfFarm')) + '<span class="cnt">' + evs.length + '</span></summary>' + evs.map(evRowHTML).join('') + '</details>';
}
/* 事件卡片的內容（摘要之外的部分）：傷亡、各項註記、相關風場、出處、照片頁面 */
function evCardExtra(it) {
  const e = it.e; let ex = '';
  const cas = [e.deaths != null ? T('evDeaths')(e.deaths) : null, e.injuries != null ? T('evInjured')(e.injuries) : null].filter(Boolean).join(' · ');
  if (cas || e.casNote) ex += '<p class="fnote' + (e.deaths ? ' evcas' : '') + '">' + esc(cas) + (e.casNote ? (cas ? ' — ' : '') + esc(evL(e.casNote)) : '') + '</p>';
  [['capNote', 'evCap'], ['start', 'evStart'], ['cod', 'evCod'], ['note', 'evNoteT'], ['coordNote', 'evCoord']].forEach(([k, t]) => { if (e[k]) ex += '<p class="fnote">' + esc(T(t)) + L('：', ': ') + esc(evL(e[k])) + '</p>'; });
  if (it.byFarm) ex += '<p class="fnote pos">' + esc(T('evPosFarm')) + '</p>'; else if (it.lat == null) ex += '<p class="fnote pos">' + esc(T('evNoPos')) + '</p>';
  const linked = (e.farms || []).map(farmNamed).filter(Boolean);
  if (linked.length) ex += relSection('evfarms', T('evFarms'), linked, { iso: e.iso }, false);
  ex += '<details class="frel" data-k="evsrc"' + (WW.store.get('ww_card_evsrc', '1') === '1' ? ' open' : '') + '><summary>' + esc(T('evSrcT')) + '<span class="cnt">' + e.src.length + '</span></summary><ol class="psrc">' +
    e.src.map(u => '<li><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(srcLabel(u)) + '</a></li>').join('') + '</ol>' +
    '<div class="gnote">' + esc(T('evOrg') + L('：', ': ') + evL(e.org)) + (e.verify ? ' · ' + esc(evL(e.verify)) : '') + (e.checked ? ' · ' + esc(T('evChecked')(e.checked)) : '') + '</div>' +
    (e.photo ? '<div class="gnote">' + esc(T('evPhoto')) + L('：', ': ') + '<a href="' + esc(e.photo.url) + '" target="_blank" rel="noopener">' + esc(hostOf(e.photo.url)) + '</a> — ' + esc(evL(e.photo.kind)) + (e.photo.rights && e.photo.rights[0] ? L('；', '; ') + esc(evL(e.photo.rights)) : '') + '</div>' : '') + '</details>';
  return ex;
}

/* 規劃中清單（規劃分頁）：範圍內逐案專案，依狀態、預計年份、容量排序；上方是逐案合計與 GEM 2026-02 各國總量 */
const PL_UI = { st: 0, q: '', limit: 150 };
let pipeRendered = '';
function gemTotalsFor(region) {
  const P = D.pipelineTotals; if (!P) return null;
  if (region === 'WORLD') return P.world;
  const out = { operating: 0, construction: 0, preconstruction: 0, announced: 0 };
  C.filter(c => inScope(c.iso, region)).forEach(c => { const g = P.byIso[c.iso]; if (g) for (const k in out) out[k] += g[k] || 0; });
  return out;
}
function pipeBar(g) {
  const parts = [['construction', 1], ['preconstruction', 2], ['announced', 3]];
  const tot = parts.reduce((a, [k]) => a + (g[k] || 0), 0);
  if (!tot) return '';
  return '<div class="pbar" role="img" aria-label="' + esc(parts.map(([k, st]) => T('st')[st] + ' ' + fmtMW(g[k] || 0)).join(', ')) + '">' +
    parts.map(([k, st]) => g[k] ? '<i class="p' + st + '" style="flex:' + g[k] + '"></i>' : '').join('') + '</div>' +
    '<div class="pleg">' + parts.map(([k, st]) => '<span><i class="gsw dash p' + st + '"></i>' + T('st')[st] + ' <b>' + fmtMW(g[k] || 0) + '</b></span>').join('') + '</div>';
}
function renderPipeList(force) {
  if (panelTab !== 'pipe') return;
  const box = $('g-pipeList');
  if (!farmsReady) { box.innerHTML = '<div class="gnote">' + T('farmsLoading') + '</div>'; return; }
  const all = D.farms.filter(f => f.pipe && inScope(f.iso) && layerOk(f.type));
  const cnt = [0, 0, 0, 0], mw = [0, 0, 0, 0];
  all.forEach(f => { cnt[f.st]++; mw[f.st] += f.mw; });
  let list = PL_UI.st ? all.filter(f => f.st === PL_UI.st) : all;
  if (PL_UI.q) { const q = PL_UI.q.toLowerCase(); list = list.filter(f => (f.name + ' ' + (f.zh || '') + ' ' + (f.owner || '')).toLowerCase().includes(q)); }
  const key = [S.region, S.layer, PL_UI.st, PL_UI.q, PL_UI.limit, lang, list.length].join('|');
  if (!force && key === pipeRendered) return; pipeRendered = key;
  list.sort((a, b) => a.st - b.st || (a.year || 9999) - (b.year || 9999) || b.mw - a.mw);
  const g = gemTotalsFor(S.region);
  box.innerHTML = '';
  const head = document.createElement('div'); head.className = 'phead';
  head.innerHTML = '<h4>' + esc(scopeName()) + '</h4><div class="gnote">' + T('pipeHead') + ' · ' + T('pipeInData')(cnt[1] + cnt[2] + cnt[3], fmtMW(mw[1] + mw[2] + mw[3])) + '</div>' +
    pipeBar({ construction: mw[1], preconstruction: mw[2], announced: mw[3] }) +
    (g ? '<div class="pipeh">' + T('gemTotals') + '</div><div class="gnote">' + L('營運中', 'Operating') + ' ' + fmtMW(g.operating) + '</div>' + pipeBar(g) : '') +
    '<div class="gnote" style="margin-top:6px">' + T('pipeCaveat') + '</div>';
  box.appendChild(head);
  const ctl = document.createElement('div'); ctl.style.cssText = 'display:flex;flex-direction:column;gap:6px';
  ctl.innerHTML = '<input type="search" id="g-pq" placeholder="' + esc(T('search')) + '" value="' + esc(PL_UI.q) + '"><div class="gchips">' +
    [0, 1, 2, 3].map(k => '<button type="button" data-ps="' + k + '" class="' + (PL_UI.st === k ? 'active' : '') + '">' + (k ? T('st')[k] + ' ' + cnt[k] : T('fAll')) + '</button>').join('') + '</div>';
  box.appendChild(ctl);
  const q = ctl.querySelector('#g-pq');
  q.oninput = () => { PL_UI.q = q.value.trim(); PL_UI.limit = 150; renderPipeList(true); const nq = $('g-pq'); if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); } };
  ctl.querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { PL_UI.st = +b.dataset.ps; PL_UI.limit = 150; renderPipeList(true); });
  list.slice(0, PL_UI.limit).forEach(f => {
    const d = document.createElement('button'); d.type = 'button'; d.className = 'msItem pipe';
    const c = byIso[f.iso];
    d.innerHTML = '<span class="y">' + (f.year ? esc(String(f.year)) : '—') + '</span><span class="n">' + esc(fname(f)) + '</span>' +
      '<span class="t"><span class="gtag p' + f.st + '">' + T('st')[f.st] + '</span>' + (byIso[S.region] ? '' : esc(c ? cname(c) : f.iso) + ' · ') + fmtMW(f.mw) +
      (f.owner ? ' · ' + esc(f.owner) : '') + (f.year ? '' : ' · ' + T('tbd')) + '</span>';
    d.onclick = () => selectFarm(f);
    box.appendChild(d);
  });
  if (list.length > PL_UI.limit) {
    const m = document.createElement('button'); m.type = 'button'; m.className = 'gmore'; m.textContent = T('more') + ` (${list.length - PL_UI.limit})`;
    m.onclick = () => { PL_UI.limit += 300; renderPipeList(true); }; box.appendChild(m);
  }
}
/* 國家概況：自動由資料計算＋主要國家的簡介 */
const NOTE = {
  CHN: ['全球最大的風電市場。2005 年《可再生能源法》後快速成長，在甘肅、新疆、內蒙古等地建設大型風電基地；2021 年起也是離岸風電第一大國，江蘇、廣東、福建沿海是主要場址。', "The world's largest wind market. Growth took off after the 2005 Renewable Energy Law, with giant wind bases in Gansu, Xinjiang and Inner Mongolia; since 2021 China is also the largest offshore market, led by Jiangsu, Guangdong and Fujian."],
  USA: ['1980 年代加州風潮的發源地；今日德州、愛荷華、奧克拉荷馬等中部「風帶」州是主力，聯邦生產稅額抵減（PTC）長期影響市場起伏。離岸風電起步較晚（2016 年 Block Island）。', 'Birthplace of the 1980s California wind rush; today the central "wind belt" states such as Texas, Iowa and Oklahoma dominate, and the federal Production Tax Credit has long shaped the market cycle. Offshore wind started late (Block Island, 2016).'],
  DEU: ['1991 年的饋網法與 2000 年《再生能源法》（EEG）帶動風電，1997–2007 年為全球第一；北海與波羅的海另有近 10 GW 離岸風電。', "The 1991 feed-in law and the 2000 Renewable Energy Sources Act (EEG) built the industry; Germany led the world from 1997 to 2007 and has close to 10 GW offshore in the North and Baltic seas."],
  IND: ['1986 年坦米爾納德邦 Muppandal 起步，風場集中在古吉拉特、坦米爾納德、卡納塔克、拉賈斯坦等西部與南部各邦；目前尚無商轉的離岸風場。', 'Started at Muppandal, Tamil Nadu, in 1986; farms are concentrated in western and southern states such as Gujarat, Tamil Nadu, Karnataka and Rajasthan. No offshore farm is operating yet.'],
  BRA: ['東北部（北里約格蘭德、巴伊亞、塞阿拉）風況極佳，2009 年起透過能源拍賣快速成長，陸域容量已進入全球前五。', 'The northeast (Rio Grande do Norte, Bahia, Ceará) has excellent winds; energy auctions since 2009 drove rapid growth into the global top five.'],
  ESP: ['2000 年代歐洲成長最快的風電國之一，以陸域為主；風機製造商 Gamesa（今 Siemens Gamesa）即源自西班牙。', "One of Europe's fastest-growing wind countries in the 2000s, mostly onshore; the turbine maker Gamesa (now Siemens Gamesa) is Spanish."],
  GBR: ['離岸風電的先行者，2008–2020 年離岸容量全球第一；透過差價合約（CfD）競標建成 Hornsea、Dogger Bank 等巨型風場，約一半風電容量在海上。', 'An offshore pioneer that led the world from 2008 to 2020; Contracts for Difference auctions delivered giants such as Hornsea and Dogger Bank, and about half of its wind capacity is at sea.'],
  FRA: ['陸域風電穩定成長，離岸起步較晚：2022 年第一座商轉離岸風場 Saint-Nazaire，並在地中海發展浮動式風場。', 'Steady onshore growth; offshore came later, with the first commercial farm at Saint-Nazaire in 2022 and floating projects in the Mediterranean.'],
  DNK: ['現代風電的發源地之一：Gedser、Tvind、Vindeby（1991 年世界第一座離岸風場）、Horns Rev 都在這裡，Vestas 與 Ørsted 也是丹麥企業；風電占其發電量一半以上。', 'A cradle of modern wind power: Gedser, Tvind, Vindeby (the first offshore farm, 1991) and Horns Rev are all here, as are Vestas and Ørsted; wind supplies more than half of its electricity.'],
  NLD: ['從 IJsselmeer 湖區風場到北海大型離岸風場；2018 年 Hollandse Kust Zuid 以零補貼得標。', 'From lake farms on the IJsselmeer to large North Sea projects; Hollandse Kust Zuid was won with zero subsidy in 2018.'],
  TWN: ['2000 年麥寮示範起步，2017 年第一部離岸風機併網；2025 年底離岸容量名列全球第 5，是中國以外亞洲最大的離岸市場。', "Started with the Mailiao demonstration in 2000 and connected its first offshore turbines in 2017; by the end of 2025 its offshore fleet ranked fifth in the world, Asia's largest outside China."],
  JPN: ['多山、平地少，陸域風場多在北海道與東北沿海；2022–2023 年秋田港、能代港啟動首批商業規模離岸風場，並積極發展浮動式技術。', 'Mountainous with little flat land, Japan builds onshore farms mainly on the coasts of Hokkaido and Tohoku; its first commercial-scale offshore farms at Akita and Noshiro ports started in 2022–2023, and it is investing in floating technology.'],
  KOR: ['陸域風場主要在濟州島與東部山區；政府規劃大規模離岸風電（含蔚山浮動式），多數仍在開發階段。', 'Onshore farms are mainly on Jeju and in the eastern mountains; large offshore plans (including floating wind off Ulsan) are mostly still in development.'],
  VNM: ['湄公河三角洲的潮間帶風場（如 Bac Lieu）是特色，2021 年躉購期限前出現大量搶裝。', 'Known for intertidal farms in the Mekong Delta such as Bac Lieu, with a rush of installations before the 2021 feed-in-tariff deadline.'],
  SWE: ['北部森林與山區有大型陸域風場（如 Markbygden），近十年成長快速。', 'Large onshore farms in the northern forests and uplands, such as Markbygden, have grown quickly over the past decade.'],
  AUS: ['南澳、維多利亞與新南威爾斯為主要市場；2024 年完工的 MacIntyre（923 MW）是最大的陸域風場之一。', 'South Australia, Victoria and New South Wales lead; MacIntyre (923 MW, 2024) is one of the largest onshore farms.'],
  TUR: ['愛琴海與馬爾馬拉海沿岸風況佳，近十年穩定成長。', 'Good winds along the Aegean and Marmara coasts have supported steady growth over the past decade.'],
  CAN: ['安大略、魁北克與亞伯達為主要市場，以陸域風場為主。', 'Ontario, Quebec and Alberta are the main markets, almost entirely onshore.']
};
let profYear = -1;
function sparkSVG(on, off, yi) {
  const n = on.length, w = 280, h = 56, max = Math.max(1, ...on.map((v, i) => v + off[i]));
  const X = i => i / (n - 1) * w, Y = v => h - 2 - v / max * (h - 6);
  const top = on.map((v, i) => `${X(i).toFixed(1)},${Y(v + off[i]).toFixed(1)}`), mid = on.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
  const cx = X(yi);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${h} ${mid.join(' ')} ${w},${h}" fill="#B8892F" fill-opacity=".35"/><polygon points="${mid.join(' ')} ${top.slice().reverse().join(' ')}" fill="#3B8FE0" fill-opacity=".45"/><polyline points="${top.join(' ')}" fill="none" stroke="#eaf1f8" stroke-width="1.5" vector-effect="non-scaling-stroke"/><line x1="${cx}" x2="${cx}" y1="0" y2="${h}" stroke="#f0c86a" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}
function renderProfile() {
  if (panelTab !== 'prof' || !D) return;
  const box = $('g-profBody'); profYear = Math.floor(S.year);
  const yi = clamp(profYear - Y0, 0, YEARS.length - 1), y = YEARS[yi];
  const rowsHTML = rows => '<div class="rows">' + rows.map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('') + '</div>';
  if (!byIso[S.region]) {
    const list = C.filter(inRegion);
    const on = YEARS.map((_, k) => list.reduce((s, c) => s + c.on[k], 0)), off = YEARS.map((_, k) => list.reduce((s, c) => s + c.off[k], 0));
    const top = list.slice().sort((a, b) => (b.on[yi] + b.off[yi]) - (a.on[yi] + a.off[yi])).slice(0, 5);
    box.innerHTML = `<h4>${esc(scopeName())}</h4><div class="sub">${y === (LT && LT.year) ? esc(T('ltYear')(y)) + ' · ' + esc(T('ltCap')) : y + ' · ' + T('worldCap')}</div>${y === (LT && LT.year) ? '<div class="ltbox">' + esc(ltLine(null)) + L('：', ': ') + C.filter(x => x.lt && inRegion(x)).map(x => esc(cname(x)) + ' ' + esc(x.lt.asof)).join(L('、', ', ')) + '</div>' : ''}
      <div class="big">${WW.int(on[yi] + off[yi])}<small>MW</small></div>${sparkSVG(on, off, yi)}
      ${rowsHTML([[T('profOnOff'), `${WW.int(on[yi])} / ${WW.int(off[yi])}`], ...top.map((c, k) => [`#${k + 1} ${esc(cname(c))}`, WW.int(c.on[yi] + c.off[yi])])])}
      ${fdBox(S.region)}${pipeBlock(S.region)}
      <div class="gnote" style="margin-top:8px">${L('在「範圍」選一個國家，可看該國概況、風場與規劃中專案。', 'Pick a country in “Focus” to see its profile, farms and pipeline.')}</div>`;
    const ps0 = box.querySelector('[data-act="pipe"]'); if (ps0) ps0.onclick = e => { e.preventDefault(); setPanelTab('pipe'); };
    wireFdLink(box);
    return;
  }
  const c = byIso[S.region];
  const rank = C.slice().sort((a, b) => (b.on[yi] + b.off[yi]) - (a.on[yi] + a.off[yi])).indexOf(c) + 1;
  const tot = c.on[yi] + c.off[yi], world = C.reduce((s, x) => s + x.on[yi] + x.off[yi], 0);
  const y10 = Math.max(0, yi - 10), tot10 = c.on[y10] + c.off[y10];
  const rows = [[T('profCap'), `${WW.int(tot)} MW`], [T('profRank'), '#' + rank], [T('profOnOff'), `${WW.int(c.on[yi])} / ${WW.int(c.off[yi])} MW`], [T('profShare'), (tot / world * 100).toFixed(2) + '%']];
  if (tot10 > 0) rows.push([T('profTen') + ` (${YEARS[y10]})`, `${WW.int(tot10)} MW · ×${(tot / tot10).toFixed(1)}`]);
  if (c.off[yi] > 0) { const ro = C.slice().sort((a, b) => b.off[yi] - a.off[yi]).indexOf(c) + 1; rows.push([L('離岸全球排名', 'Offshore rank'), '#' + ro]); }
  let farmsHTML = '';
  if (farmsReady && farmsByIso[c.iso]) {
    const fl = farmsByIso[c.iso], op = fl.filter(f => !f.pipe && farmActive(f, S.year));
    // 「最大風場」不取整區彙總列（例：新疆哈密風電基地），那不是單一座風場
    const big = op.filter(f => !AGG_RE.test(f.name)).sort((a, b) => b.mw - a.mw)[0], early = fl.filter(f => !f.pipe && !f.yu).sort((a, b) => a.year - b.year)[0];
    const fr = [[T('profFarms'), L(`${op.length} 座 · ${fmtMW(op.reduce((s, f) => s + farmMwAt(f, S.year), 0))}`, `${op.length} · ${fmtMW(op.reduce((s, f) => s + farmMwAt(f, S.year), 0))}`)]];
    if (big) fr.push([T('profLargest'), `<a href="#" data-farm="${esc(big.name)}">${esc(fname(big))}</a> · ${fmtMW(big.mw)}`]);
    if (early) fr.push([T('profEarliest'), `<a href="#" data-farm="${esc(early.name)}">${esc(fname(early))}</a> · ${early.year}`]);
    farmsHTML = rowsHTML(fr) + coverageBox(op.reduce((a, f) => a + farmMwAt(f, S.year), 0), tot) + fdBox(c.iso);
  } else if (!farmsReady) farmsHTML = '<div class="gnote" style="margin-top:8px">' + T('farmsLoading') + '</div>';
  const note = NOTE[c.iso] ? `<div class="blurb">${esc(NOTE[c.iso][lang === 'en' ? 1 : 0])}</div>` : '';
  let live = intlProfileBox(c.iso);
  if (c.iso === 'TWN' && WW.live) {
    const Tt = WW.live.totals();
    live = `<div class="livebox">🌬 ${T('liveNow')}：<b>${WW.int(Tt.total)} MW</b>（${WW.live.isLive() ? L('台電', 'Taipower') + ' ' + WW.live.fmtSrc(WW.live.srcTime()) : L('模擬', 'simulated')}）· ${T('availability')} ${(Tt.ratio * 100).toFixed(1)}%${Tt.testOut > 0.5 ? L('（不含試運轉機組的 ', ' (excl. ') + WW.int(Tt.testOut) + L(' MW）', ' MW from units in testing)') : ''}</div>`;
  }
  const ltBox = y === (LT && LT.year) ? `<div class="ltbox">${c.lt ? `${esc(T('ltOk')(c.lt.asof, ''))}<a href="${esc(c.lt.url)}" target="_blank" rel="noopener">${esc(c.lt.src[lang === 'zh' ? 0 : 1])}</a>${c.lt.est ? esc(T('ltEst')) : ''}<div class="gnote">${esc(c.lt.note[lang === 'zh' ? 0 : 1])}</div>` : esc(T('ltCarry')(DATA_Y))}</div>` : '';
  box.innerHTML = `<h4>${esc(cname(c))}</h4><div class="sub">${esc(T('cont')[c.cont] || c.cont)} · ${y === (LT && LT.year) ? esc(T('ltYear')(y)) : y}</div>
    <div class="big">${WW.int(tot)}<small>MW</small></div>${sparkSVG(c.on, c.off, yi)}${ltBox}${rowsHTML(rows)}${auditBox(c.iso)}${live}${note}${farmsHTML}${pipeBlock(c.iso)}
    <div class="acts"><button type="button" data-act="tour">${T('tourCountry')}</button><button type="button" data-act="farms">${T('seeFarms')}</button>${OUT_ISO.includes(c.iso) ? `<button type="button" data-act="out">${T('outCountry')}</button>` : ''}${c.iso === 'TWN' ? `<a href="#/live">${T('seeLive')}</a>` : ''}</div>`;
  box.querySelectorAll('[data-farm]').forEach(a => a.onclick = e => { e.preventDefault(); const f = D.farms.find(x => x.name === a.dataset.farm && x.iso === c.iso); if (f) selectFarm(f); });
  box.querySelector('[data-act="tour"]').onclick = () => tourStart();
  box.querySelector('[data-act="farms"]').onclick = () => setPanelTab('farms');
  const ob = box.querySelector('[data-act="out"]'); if (ob) ob.onclick = () => openOutput({ iso: c.iso });
  const ps1 = box.querySelector('[data-act="pipe"]'); if (ps1) ps1.onclick = e => { e.preventDefault(); setPanelTab('pipe'); };
  wireFdLink(box);
}
/* 國家概況：各年新增離岸容量依水下基礎分組的堆疊長條（SVG；每根長條有 <title> 列出該年各組容量；時間軸所在年以金色框標示） */
function fdYearAdds(region, yEnd) {
  const by = new Map();                                           // year -> { group -> MW }
  (farmsReady ? D.farms : []).forEach(f => {
    if (f.pipe || f.type === 'onshore' || !f.year || f.year > yEnd || !inScope(f.iso, region)) return;
    const g = fdGroup(f), last = Math.min(yEnd, f.end ? f.end - 1 : yEnd);
    for (let y = f.year; y <= last; y++) {
      const add = y === f.year ? farmMwAt(f, y) : farmMwAt(f, y) - farmMwAt(f, y - 1);
      if (add <= 0) continue;
      if (!by.has(y)) by.set(y, {}); const o = by.get(y); o[g] = (o[g] || 0) + add;
    }
  });
  return by;
}
function fdYearChart(region) {
  const yEnd = Math.floor(S.year), by = fdYearAdds(region, yEnd);
  if (by.size < 2) return '';
  const y0 = Math.min(...by.keys()), years = []; for (let y = y0; y <= yEnd; y++) years.push(y);
  const W = 280, H = 76, PAD_T = 12, PAD_B = 12, bw = W / years.length, gap = bw > 6 ? 1.5 : 0.5;
  const tot = y => Object.values(by.get(y) || {}).reduce((a, v) => a + v, 0), max = Math.max(1, ...years.map(tot));
  const Y = v => PAD_T + (H - PAD_T - PAD_B) * (1 - v / max), col = { mp: 'var(--fd-mp)', frame: 'var(--fd-frame)', fl: 'var(--fd-fl)', other: 'var(--fd-other)', unk: 'var(--fd-unk)' };
  const P = [];
  years.forEach((y, i) => {
    const o = by.get(y), x = i * bw + gap / 2, w = Math.max(1, bw - gap);
    const tip = y + ' · ' + fmtMW(tot(y)) + (o ? '\n' + FD_GROUPS.filter(g => o[g]).map(g => T('fdGroup')[g] + ' ' + fmtMW(o[g])).join('\n') : '');
    let acc = 0, rects = '';
    if (o) FD_GROUPS.forEach(g => { if (!o[g]) return; const y1 = Y(acc), y2 = Y(acc + o[g]); acc += o[g]; rects += '<rect x="' + x.toFixed(1) + '" y="' + y2.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(0.6, y1 - y2).toFixed(1) + '" fill="' + col[g] + '"/>'; });
    P.push('<g' + (y === yEnd ? ' class="cur"' : '') + '><title>' + esc(tip) + '</title><rect x="' + x.toFixed(1) + '" y="' + PAD_T + '" width="' + w.toFixed(1) + '" height="' + (H - PAD_T - PAD_B) + '" fill="transparent"/>' + rects +
      (y === yEnd ? '<rect x="' + (x - 0.75).toFixed(1) + '" y="' + (Y(tot(y)) - 1).toFixed(1) + '" width="' + (w + 1.5).toFixed(1) + '" height="' + (H - PAD_B - Y(tot(y)) + 1).toFixed(1) + '" fill="none" stroke="#f0c86a" stroke-width="1.2"/>' : '') + '</g>');
  });
  const step = years.length > 24 ? 10 : years.length > 12 ? 5 : years.length > 6 ? 2 : 1;
  years.forEach((y, i) => { if (y % step === 0 || (i === 0 && (step - y % step) * bw >= 24)) P.push('<text x="' + (i * bw + bw / 2 < 12 ? 1 : i * bw + bw / 2).toFixed(1) + '" y="' + (H - 2) + '" text-anchor="' + (i * bw + bw / 2 < 12 ? 'start' : 'middle') + '" font-size="8.5" fill="currentColor" opacity=".75">' + y + '</text>'); });   // 第一年與下一個整數年太近時省略；貼左緣的靠左對齊
  P.push('<text x="1" y="9" font-size="8.5" fill="currentColor" opacity=".75">' + esc(fmtMW(max)) + '</text>');
  return '<div class="pipeh">' + esc(T('fdYears')) + '</div><svg class="fdyears" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(T('fdYears')) + '">' + P.join('') + '</svg>' +
    '<div class="gnote" style="margin-top:2px">' + esc(T('fdYearsNote')) + '</div>';
}
/* 國家概況：營運中離岸風場依水下基礎分組的容量長條（相鄰色塊之間留 2px 間隙；確切數字在圖例） */
function fdBox(region) {
  if (!farmsReady || !FD) return '';
  const st = fdStats(region, S.year);
  if (!st.tot) return '';
  const gs = FD_GROUPS.filter(g => st.n[g]);
  return '<div class="pipeh">' + esc(T('fdProf')) + '</div><div class="pbar fdbar" role="img" aria-label="' + esc(gs.map(g => T('fdGroup')[g] + ' ' + fmtMW(st.mw[g])).join(', ')) + '">' +
    gs.map(g => '<i class="fd-' + g + '" style="flex:' + Math.max(st.mw[g], st.totMw * 0.004) + '"></i>').join('') + '</div>' +
    '<div class="pleg">' + gs.map(g => '<span><i class="gsw fd-' + g + '"></i>' + esc(T('fdGroup')[g]) + ' <b>' + st.n[g] + '</b></span>').join('') + '</div>' +
    fdYearChart(region) +
    (st.n.fl ? '<div class="gnote" style="margin-top:4px">' + esc(T('fdFlBy') + L('：', ': ') + FL_SUBS.concat('?').filter(k => st.fls[k])
      .map(k => (k === '?' ? T('fdFloatSub') : fdSubName(k)) + ' ' + st.fls[k]).join(' · ')) + '</div>' : '') +
    '<div class="gnote" style="margin-top:4px">' + esc(T('fdCov')(WW.int(st.known), WW.int(st.tot), fdPct(st.knownMw, st.totMw))) +
    (S.layer !== 'fd' ? ' · <a href="#" data-act="fdlayer">' + esc(T('lFd')) + ' →</a>' : '') + '</div>';
}
function wireFdLink(box) {
  const a = box.querySelector('[data-act="fdlayer"]');
  if (a) a.onclick = e => { e.preventDefault(); const sel = $('g-layerSel'); sel.value = 'fd'; sel.onchange({ target: sel }); renderProfile(); };
}
/* 逐場資料覆蓋率：已逐場標示的營運中容量 ÷ 國家年底統計；差額明白列出，不補虛構風場 */
function coverageBox(mapped, national) {
  if (!national) return '';
  const pct = mapped / national * 100;
  return '<div class="cov"><div class="covh"><span>' + T('coverage') + '</span><b>' + pct.toFixed(0) + '%</b></div>' +
    '<div class="covr" role="img" aria-label="' + T('coverage') + ' ' + pct.toFixed(0) + '%"><i style="width:' + Math.min(100, pct).toFixed(1) + '%"></i></div>' +
    '<div class="covm"><span>' + T('covMapped') + ' ' + fmtMW(mapped) + '</span><span>' + (pct > 100.5 ? T('covOver') : T('covGap') + ' ' + fmtMW(Math.max(0, national - mapped))) + '</span></div></div>';
}
/* 台灣、日本：官方統計稽核標記與來源 */
function auditBox(iso) {
  const a = D.audit && D.audit[iso]; if (!a) return '';
  const zh = lang === 'zh';
  return '<div class="audit"><b>✓ ' + esc(zh ? a.badgeZh : a.badgeEn) + '</b> · ' + esc(zh ? a.periodZh : a.periodEn) +
    '<div class="gnote" style="margin-top:3px">' + esc(zh ? a.methodZh : a.methodEn) + '</div><div class="alinks">' +
    (a.sources || []).map(x => '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name) + '</a>').join('') + '</div></div>';
}
/* 規劃中區塊：逐案資料合計＋GEM 2026-02 總量 */
function pipeBlock(region) {
  if (!farmsReady) return '';
  const fl = D.farms.filter(f => f.pipe && inScope(f.iso, region));
  const n = fl.length, mw = fl.reduce((a, f) => a + f.mw, 0);
  const g = gemTotalsFor(region);
  if (!n && !(g && (g.construction || g.preconstruction || g.announced))) return '';
  return '<div class="pipeh">' + T('gemTotals') + '</div>' + (g ? pipeBar(g) : '') +
    '<div class="gnote" style="margin-top:4px">' + T('pipeInData')(n, fmtMW(mw)) + ' · <a href="#" data-act="pipe">' + T('pipeSee') + '</a></div>';
}

/* ================= bar chart race（MW） ================= */
const rowEls = {}; const NBAR = 15;
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const m = v / p; const n = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => m <= x); return n * p; }
function updateBars(force) {
  if (S.view === 'map' && !force) return;
  const barsEl = $('g-bars'), axisEl = $('g-axis');
  const scoped = S.region === 'WORLD' || !S.region.startsWith('C:') ? C : C.filter(inRegion);
  const all = scoped.map(c => ({ c, cap: capOf(c, S.year) })).filter(r => r.cap.tot > 0.5).sort((a, b) => b.cap.tot - a.cap.tot);
  all.forEach((r, i) => r.rank = i + 1);
  const NB = clamp(Math.floor((barsEl.clientHeight - 22) / 19) - 2, 5, NBAR);   // 窄螢幕自動減少列數
  $('g-barScope').textContent = (S.region.startsWith('C:') ? T('inRegion') : T('top15'))(NB) + (atLT() ? ' · ' + T('ltHatch') : '');
  const rows = all.slice(0, NB);
  const extra = iso => { if (!rows.some(r => r.c.iso === iso)) { const r = all.find(r => r.c.iso === iso); if (r) rows.push(r); } };
  if (byIso[S.region]) extra(S.region);
  extra('TWN');
  const maxV = niceMax(rows.length ? rows[0].cap.tot * 1.05 : 1);
  const nRows = Math.max(NB, rows.length);
  const AX = 18;                                  // 上方留給軸標籤
  const rowH = Math.max(18, Math.min(34, (barsEl.clientHeight - 4 - AX) / (nRows + 1)));
  $('g-barYear').textContent = Math.floor(S.year);
  let ax = ''; for (let i = 1; i <= 4; i++) { ax += '<div style="left:' + (i * 25) + '%">' + fmtAxis(maxV * i / 4) + '</div>'; }
  axisEl.innerHTML = ax;
  const seen = new Set();
  rows.forEach((r, i) => {
    seen.add(r.c.iso);
    let el = rowEls[r.c.iso];
    if (!el) { el = document.createElement('div'); el.className = 'brow'; el.innerHTML = '<div class="nm"><small></small><span></span></div><div class="bar"><i class="on"></i><i class="off"></i></div><div class="val"></div>';
      el.style.transform = 'translateY(' + (AX + nRows * rowH + 20) + 'px)'; el.style.opacity = 0; barsEl.appendChild(el); rowEls[r.c.iso] = el;
      const c = r.c;
      el.onmouseenter = ev => showTip(ev, tipCountry(c), $('g-barPane')); el.onmousemove = ev => moveTip(ev, $('g-barPane')); el.onmouseleave = hideTip;
      el.onclick = () => { if (S.view === 'bars' && renderer) setView('split'); setRegion(c.iso); }; }
    el.style.height = rowH + 'px';
    el.querySelector('.nm small').textContent = r.rank; el.querySelector('.nm span').textContent = cname(r.c);
    el.querySelector('i.on').style.width = (r.cap.on / maxV * 100) + '%'; el.querySelector('i.off').style.width = (r.cap.off / maxV * 100) + '%';
    el.querySelector('i.off').style.display = r.cap.off > 0.5 ? 'block' : 'none';
    el.querySelector('.val').textContent = fmtMW(r.cap.tot);
    el.classList.toggle('sel', S.region === r.c.iso);
    el.classList.toggle('tw', r.c.iso === 'TWN');
    el.classList.toggle('carry', carried(r.c));
    const slot = i < NB ? i : NB + 0.4 + (i - NB);
    requestAnimationFrame(() => { el.style.transform = 'translateY(' + (AX + slot * rowH) + 'px)'; el.style.opacity = 1; });
  });
  Object.keys(rowEls).forEach(iso => { if (!seen.has(iso)) { const el = rowEls[iso]; el.style.transform = 'translateY(' + (AX + nRows * rowH + 20) + 'px)'; el.style.opacity = 0; } });
}

/* ================= Wikipedia lookup (photo, summary, link) ================= */
const wikiCache = {};
const STOP_EN = new Set(['wind', 'farm', 'farms', 'offshore', 'onshore', 'park', 'windpark', 'project', 'energy', 'power', 'the', 'and', 'phase', 'turbine', 'turbines', 'prototype', 'centre', 'center', 'station', 'parque', 'eolico', 'eólico', 'windfarm', 'demo', 'demonstrator', 'ltd', 'gmbh', 'co', 'kg', 'plant']);
function titleMatch(q, title) {
  const t = title.toLowerCase();
  if (/[一-鿿]/.test(q)) {
    const core = q.replace(/[（(].*?[)）]/g, '').replace(/離岸|离岸|海上|陸域|陆域|風力發電|风力发电|風電|风电|風場|风场|發電|发电|計畫|计划|項目|项目|[一二三四五]期|第|階段|示範|示范/g, '');
    for (let i = 0; i < core.length - 1; i++) { if (t.includes(core.slice(i, i + 2))) return true; }
    return false;
  }
  const toks = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP_EN.has(w) && !/^\d+$/.test(w));
  if (!toks.length) return false;
  const tt = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const hit = toks.filter(w => tt.includes(w)).length;
  return hit >= Math.max(1, Math.ceil(toks.length * 0.5));
}
async function wikiSearch(hostName, q) {
  const clean = q.replace(/\(.*?\)|（.*?）/g, ' ').replace(/\s+/g, ' ').trim();
  const sq = hostName === 'en' && !/wind|turbine|farm|park/i.test(clean) ? clean + ' wind' : clean;
  const url = 'https://' + hostName + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=4&gsrsearch=' + encodeURIComponent(sq) +
    '&prop=pageimages%7Cextracts%7Cinfo%7Cpageprops&ppprop=wikibase_item&piprop=thumbnail%7Cname&pithumbsize=520&exintro=1&explaintext=1&exsentences=3&inprop=url&redirects=1' + (hostName === 'zh' ? '&variant=zh-tw' : '');
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctl.signal }); const j = await res.json();
    const pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index);
    for (const p of pages) { if (titleMatch(clean, p.title)) return { title: p.title, url: hostName === 'zh' ? 'https://zh.wikipedia.org/zh-tw/' + encodeURIComponent(p.title.replace(/ /g, '_')) : (p.fullurl || ('https://en.wikipedia.org/wiki/' + encodeURIComponent(p.title))), extract: p.extract || '', thumb: p.thumbnail && p.thumbnail.source, file: p.pageimage || null, host: hostName, qid: p.pageprops && p.pageprops.wikibase_item }; }
  } finally { clearTimeout(to); }
  return null;
}
function wikiLookup(it) {
  const key = lang + '|' + it.name;
  if (wikiCache[key]) return wikiCache[key];
  const tries = [];
  if (lang === 'zh' && it.zh) tries.push(['zh', it.zh]);
  tries.push(['en', it.name.replace(/ · .*$/, '')]);
  if (lang !== 'zh' && it.zh) tries.push(['zh', it.zh]);
  wikiCache[key] = (async () => { let net = false; for (const [h, q] of tries) { try { const r = await wikiSearch(h, q); if (r) return r; } catch (e) { net = true; } } if (net) delete wikiCache[key]; return net ? 'ERR' : null; })();
  return wikiCache[key];
}

/* ================= 照片：人工核對的 Commons 照片優先，其次是看得出是風機的維基百科條目圖片 =================
   photos.json 由 tools/build_photos.py 產生（tools/farm_photos.py 的照片都逐張看過、出自該風場的 Commons 分類）。
   沒有核對過的照片時，維基百科條目圖片要在 Commons 上屬於跟風電有關的分類才顯示：很多條目的圖片是當地風景、地圖或標誌，寧可不放。 */
let PHOTOS = null, photosP = null;
function loadPhotos() {
  if (!photosP) photosP = WW.getJSON(WW.DATA.photos).then(j => { PHOTOS = j; }).catch(() => { PHOTOS = { farms: {}, ms: {}, events: {} }; });
  return photosP;
}
function photoOf(it) {
  if (!PHOTOS || !it) return null;
  const pf = f => f && !f.pseudo ? PHOTOS.farms[f.iso + '|' + f.name] : null;
  if (it.kind === 'farm') return pf(it.f) || null;
  if (it.kind === 'ms') return PHOTOS.ms[it.name] || null;
  if (it.kind === 'event') {
    if (PHOTOS.events[it.e.id]) return PHOTOS.events[it.e.id];
    for (const n of it.e.farms || []) { const f = farmNamed(n), p = pf(f); if (p) return Object.assign({ farmOnly: fname(f) }, p); }
  }
  return null;
}
const WIND_CAT = /wind|turbin|windkraft|windpark|vindkraft|vindm|[ée]olien|e[óo]lic|風力|风力|風電|风电|風車|风车|風場|风场|風力発電/i;
const NOT_PHOTO = /\bmaps?\b|locator|location|logo|diagram|chart|graph|\.svg\b|\.pdf\b/i;
const commonsCache = {};
function wikiPhoto(file) {
  if (!file) return Promise.resolve(null);
  if (!commonsCache[file]) commonsCache[file] = fetch('https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&prop=categories%7Cimageinfo&clshow=!hidden&cllimit=50' +
    '&iiprop=url%7Cextmetadata&iiurlwidth=500&iiextmetadatafilter=Artist%7CLicenseShortName&titles=' + encodeURIComponent('File:' + file)).then(r => r.json()).then(j => {
    const p = j.query && j.query.pages && j.query.pages[0];
    if (!p || p.missing || !p.imageinfo) return null;           // 維基百科本地的檔案（多為合理使用）不用
    const cats = (p.categories || []).map(c => c.title).join(' | ');
    if (!WIND_CAT.test(cats) || NOT_PHOTO.test(file + ' | ' + cats)) return null;
    const ii = p.imageinfo[0], m = ii.extmetadata || {};
    const txt = v => v && v.value ? String(v.value).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim().slice(0, 120) : '';
    return { src: ii.thumburl, page: ii.descriptionurl, by: txt(m.Artist), lic: txt(m.LicenseShortName), wiki: true };
  }).catch(() => null);
  return commonsCache[file];
}
/* 卡片與滑鼠提示共用：先查核對過的照片，沒有再查維基百科條目圖片（港口、事件不查維基百科） */
function itemPhoto(it) {
  return loadPhotos().then(() => {
    const p = photoOf(it);
    if (p || it.kind === 'port' || it.kind === 'event' || it.kind === 'turb') return p;
    return wikiLookup(it).then(w => w && w !== 'ERR' && w.file ? wikiPhoto(w.file) : null);
  });
}
function setCardPhoto(card, p) {
  const ph = card.querySelector('.gph'); if (!ph || !p || !p.src) return;
  const img = ph.querySelector('img'), cr = ph.querySelector('.cr');
  cr.innerHTML = (p.farmOnly ? esc(T('photoFarmOnly')(p.farmOnly)) + ' · ' : '') + '<a href="' + esc(p.page) + '" target="_blank" rel="noopener">' + esc(T('photoBy')) +
    esc(p.by || 'Wikimedia Commons') + (p.lic ? ' · ' + esc(p.lic) : '') + (p.wiki ? ' · ' + esc(T('photoWiki')) : '') + '</a>';
  img.onload = () => { ph.hidden = false; }; img.onerror = () => { ph.hidden = true; };
  img.src = p.src;
}

/* ================= items (farm / milestone) and info card ================= */
const noteOf = f => f && f.note ? (lang === 'en' ? (f.note[1] || f.note[0]) : (f.note[0] || f.note[1])) : '';
const posNote = f => !f || f.pseudo ? '' : f.nStack ? T('posStack').replace('{n}', f.nStack - 1) : (f.flags & 1) ? T('posApprox') : '';
function farmItem(f, why) { return { kind: 'farm', f, name: f.name, zh: f.zh, lat: f.lat0 != null ? f.lat0 : f.lat, lon: f.lon0 != null ? f.lon0 : f.lon, year: f.year, end: f.end, type: f.type, mw: f.mw, turbine: f.turbine, owner: f.owner, iso: f.iso, why }; }
function msPseudoFarm(m) {
  let best = null, bs = 0;
  for (const f of D.farms) {
    if (f.iso !== m.iso || f.pipe || Math.abs(f.lat - m.lat) > 0.3 || Math.abs(f.lon - m.lon) > 0.3) continue;
    const nm = titleMatch(f.name, m.name) || titleMatch(m.name, f.name);
    const dy = Math.abs(f.year - m.year), dd = Math.hypot(f.lat - m.lat, f.lon - m.lon);
    let sc = 0;
    if (nm && dy <= 3) sc = 10 - dy; else if (dy <= 1 && dd < 0.12) sc = 3 - dy;
    if (f.src === 0) sc += 0.5;
    if (sc > bs) { bs = sc; best = f; }
  }
  if (best) return best;
  if (!m._pf) { const n = (m.farm && m.mw) ? Math.max(1, Math.round(m.farm / m.mw)) : 1;
    m._pf = { name: m.name, iso: m.iso, lat: m.lat, lon: m.lon, mw: m.farm || m.mw || 1, year: Math.max(m.year, Y0 - 1), type: m.type, turbine: (n > 1 ? n + ' x ' : '') + (m.mw ? m.mw + ' MW' : ''), _n: n, _unit: m.mw || null, pseudo: true, st: 0 }; }
  return m._pf;
}
function msStop(m) { return { kind: 'ms', m, name: m.name, zh: null, lat: m.lat, lon: m.lon, year: m.year, type: m.type, iso: m.iso, farm: farmsReady ? msPseudoFarm(m) : null }; }
let cardItem = null;
/* ================= 澳洲、加拿大即時出力（intl_wind_scraper.py 約每 2 小時更新 data/live/intl_realtime.json） ================= */
// 超過 LIVE_STALE_MS 的電網資料不再疊到風場上：排程約每 2 小時，容許漏跑一兩次（安大略的資料本身還晚約 1 小時）
const INTL_URL = 'data/live/intl_realtime.json', LIVE_HEX = 0x3fdcb0, LIVE_STALE_MS = 6 * 3600e3;
const GRID_TZ = { AEMO: 'Australia/Brisbane', AESO: 'America/Edmonton', IESO: 'America/Toronto' };
const GRID_SRC = { AEMO: 'https://nemweb.com.au/Reports/Current/Dispatch_SCADA/', AESO: 'http://ets.aeso.ca/ets_web/ip/Market/Reports/CSDReportServlet',
  IESO: 'https://reports-public.ieso.ca/public/GenOutputCapability/PUB_GenOutputCapability.xml' };
let INTL = null, intlByKey = new Map(), intlTimer = null, liveSeen = false;
function loadIntl() {
  return WW.getLiveJSON(INTL_URL).then(j => {
    if (!j || !j.grids) return;
    INTL = j; intlByKey = new Map((j.farms || []).map(x => [x.iso + '|' + x.name, x]));
    liveChanged();
  }).catch(() => { /* 沒有即時檔或離線：不顯示即時資訊 */ });
}
function liveChanged() {
  farmLayerDirty = true;
  if (!active || !farmsReady) return;
  if (panelTab === 'prof' && (S.region === 'AUS' || S.region === 'CAN' || S.region === 'TWN')) renderProfile();
  if (panelTab === 'farms') renderFarmResults(true);
  refreshLiveBox();
}
const liveOn = () => S.year >= Y1 - 0.02;                                   // 時間軸在最新年份時才疊上「此刻」
const gridFresh = g => !!g && g.ok !== false && Date.now() - Date.parse(g.time) < LIVE_STALE_MS;
const spinOf = x => { const cf = x.cap ? clamp(x.mw / x.cap, 0, 1) : 0; return cf < 0.01 ? 0 : 0.25 + 1.75 * cf; };
/* 一座風場此刻的出力；沒有即時資料時為 null。台灣來自台電，澳洲、加拿大來自各電網 */
function liveFor(f) {
  if (!f) return null;
  if (f.iso === 'TWN') {
    if (!WW.live || !WW.live.isLive()) return null;
    const units = WW.live.unitsForGlobalFarm(f.name); if (!units.length) return null;
    return { mw: units.reduce((s, u) => s + (WW.live.RT[u.id] || 0), 0), cap: units.reduce((s, u) => s + (u.cap || 0), 0), grid: 'TPC' };
  }
  const x = INTL && intlByKey.get(f.iso + '|' + f.name);
  return x && gridFresh(INTL.grids[x.grid]) ? x : null;
}
function gridName(g) { return ({ AEMO: L('澳洲東部電網（AEMO）', 'Australia NEM (AEMO)'), AESO: L('亞伯達（AESO）', 'Alberta (AESO)'), IESO: L('安大略（IESO）', 'Ontario (IESO)') })[g] || g; }
function gridRes(g) { return ({ '5min': L('每 5 分鐘實測', 'measured every 5 min'), snapshot: L('約 1 分鐘的即時值', 'real-time value (~1 min)'), hourly: L('每小時平均', 'hourly average') })[g.res] || ''; }
function gridTime(key, g) {
  const t = new Date(g.time), mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  let local = '';
  try { local = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'zh-TW', { timeZone: GRID_TZ[key], month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(t); } catch (e) { local = g.time; }
  const zone = ({ AEMO: L('澳洲東部時間', 'AEST'), AESO: L('亞伯達時間', 'Alberta time'), IESO: L('安大略時間', 'Ontario time') })[key] || '';
  const ago = mins < 90 ? L(mins + ' 分鐘前', mins + ' min ago') : L(Math.round(mins / 60) + ' 小時前', Math.round(mins / 60) + ' h ago');
  return `${local}（${zone}，${ago}）`.replace('（', lang === 'en' ? ' (' : '（').replace('，', lang === 'en' ? ', ' : '，').replace('）', lang === 'en' ? ')' : '）');
}
function gridNotice(key) { return INTL && INTL.notice && INTL.notice[key] ? '<div class="gnote lic">' + esc(INTL.notice[key]) + '</div>' : ''; }
function liveSpark(pts, cap) {
  if (!pts || pts.length < 2) return '';
  const W = 250, H = 36, t0 = Date.parse(pts[0][0]), t1 = Date.parse(pts[pts.length - 1][0]) || t0 + 1, ym = Math.max(cap || 0, ...pts.map(p => p[1])) || 1;
  const xy = pts.map(p => [((Date.parse(p[0]) - t0) / (t1 - t0 || 1)) * W, H - 2 - (p[1] / ym) * (H - 4)]);
  const last = xy[xy.length - 1];
  return `<svg class="lspark" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(L('過去 48 小時風電出力', 'Wind output, last 48 hours'))}"><polyline fill="none" stroke="var(--live)" stroke-width="1.5" points="${xy.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.5" fill="var(--live)"/></svg>`;
}
/* 國家概況：澳洲、加拿大此刻的風電總出力（各電網）與 48 小時趨勢 */
function intlProfileBox(iso) {
  if (!INTL || (iso !== 'AUS' && iso !== 'CAN')) return '';
  const keys = Object.keys(INTL.grids).filter(k => INTL.grids[k].iso === iso);
  if (!keys.length) return '';
  const rows = keys.map(k => {
    const g = INTL.grids[k], fresh = gridFresh(g);
    return `<div class="lrow"><div>${esc(gridName(k))}${L('：', ': ')}<b>${fresh ? WW.int(g.mw) + ' MW' : L('資料延遲', 'delayed')}</b>` +
      (fresh && g.cap_listed ? ` · ${L('約為已登錄容量 ' + fmtMW(g.cap_listed) + ' 的 ', 'about ')}${(g.mw / g.cap_listed * 100).toFixed(0)}%${L('', ' of ' + fmtMW(g.cap_listed) + ' registered')}` : '') +
      `</div><div class="gnote">${esc(gridRes(g))} · ${esc(gridTime(k, g))}</div>${liveSpark(INTL.hist && INTL.hist[k], g.cap_listed)}</div>`;
  }).join('');
  const other = iso === 'AUS' ? L('西澳與北領地不在東部電網，沒有即時資料。', 'Western Australia and the Northern Territory are outside the NEM and have no live data here.')
    : L('其他省份沒有公開的即時資料。', 'Other provinces publish no live data.');
  return `<div class="livebox intl">🌬 ${T('liveNow')}${rows}<div class="gnote">${other} ${L('地圖上綠色外圈的風場有即時資料。', 'Farms with a green ring on the map have live data.')}</div>${keys.map(gridNotice).join('')}</div>`;
}
function liveBoxFor(f) {
  if (f.iso === 'AUS' || f.iso === 'CAN') {
    const x = liveFor(f);
    if (!x) return INTL && !f.pipe ? '<div class="livebox none" data-live><span class="gnote">' + L('這座風場沒有公開的即時資料（目前只有澳洲東部電網、亞伯達與安大略的風場有）。', 'No live data for this farm (only farms on Australia’s NEM, in Alberta and in Ontario have it).') + '</span></div>' : '';
    const g = INTL.grids[x.grid], pct = x.cap ? (x.mw / x.cap * 100).toFixed(0) : null;
    return `<div class="livebox" data-live>🌬 ${T('liveNow')}${L('：', ': ')}<b>${WW.num(x.mw, x.mw < 100 ? 1 : 0)} MW</b>${pct != null ? ` · ${L('約為裝置容量的 ' + pct + '%', pct + '% of capacity')}` : ''}` +
      `<br><span class="gnote">${esc(gridName(x.grid))} · ${esc(gridRes(g))} · ${esc(gridTime(x.grid, g))}${x.est ? '<br>' + esc(L('一個發電機組涵蓋數座風場，依容量比例估算。', 'One grid unit covers several farms; split by capacity (estimate).')) : ''}</span>` +
      gridNotice(x.grid) + `<div class="links" style="margin-top:6px"><a href="${esc(GRID_SRC[x.grid])}" target="_blank" rel="noopener">${T('lnkSrc')} ↗</a></div></div>`;
  }
  if (!WW.live || f.iso !== 'TWN') return '';
  const units = WW.live.unitsForGlobalFarm(f.name); if (!units.length) return '';
  const out = units.reduce((s, u) => s + (WW.live.RT[u.id] || 0), 0), cap = units.reduce((s, u) => s + (u.cap || 0), 0);
  const when = WW.live.isLive() ? L('台電', 'Taipower') + ' ' + WW.live.fmtSrc(WW.live.srcTime()) : L('模擬', 'simulated');
  return `<div class="livebox" data-live>🌬 ${T('liveNow')}：<b>${out.toFixed(1)} MW</b>${cap ? ` · ${T('availability')} ${(out / cap * 100).toFixed(0)}%` : ''}<br><span class="gnote">${esc(units.map(u => u.tp).join(' + '))} · ${esc(when)}</span>
    <div class="links" style="margin-top:6px"><a href="#/live?farm=${esc(units[0].id)}">${T('liveSee')} →</a></div></div>`;
}
/* ================= 風場詳情：國內地位、分期、附近與同開發商風場、更多連結、回報錯誤、複製連結 ================= */
const REPO_URL = 'https://github.com/dofliu/windfarmTaiwan';
const NEAR_KM = 30, REL_SHOW = 6, REL_CAP = 60;
function kmBetween(la1, lo1, la2, lo2) {
  const s1 = Math.sin((la2 - la1) * D2R / 2), s2 = Math.sin((lo2 - lo1) * D2R / 2);
  return 12742 * Math.asin(Math.min(1, Math.sqrt(s1 * s1 + Math.cos(la1 * D2R) * Math.cos(la2 * D2R) * s2 * s2)));
}
/* 30 km 內的其他風場（跨國也算，依距離排序）；共用代用座標的紀錄位置不實：不替它找附近，也不列進別人的附近 */
function nearbyFarms(f) {
  if (f.pseudo || f.nStack) return null;
  const dLat = NEAR_KM / 111, dLon = dLat / Math.max(0.05, Math.cos(f.lat * D2R)), out = [];
  for (const g of D.farms) {
    if (g === f || g.nStack || Math.abs(g.lat - f.lat) > dLat) continue;
    const dl = Math.abs(g.lon - f.lon); if (Math.min(dl, 360 - dl) > dLon || isAgg(g)) continue;
    const km = kmBetween(f.lat, f.lon, g.lat, g.lon);
    if (km <= NEAR_KM) out.push({ g, km });
  }
  return out.sort((a, b) => a.km - b.km);
}
/* 同開發商：業主欄位（GEM、GPPD、精選清單）寫法不一，比對前先正規化——去重音、括號與公司型態字尾（Co Ltd、A/S…），
   再去掉「能源、電力、國名」這類泛稱字尾，但剩下的字若全是泛稱或地名就停（Shanghai Electric Power 不會縮成 Shanghai）；
   幾個常見集團的不同寫法另外對照（例：China Three Gorges／Three Gorges）。
   build_farms.py 把業主截在 60 字，被截斷的最後一段只比對開頭。寧可少配，不要配錯。 */
const OWN_LEGAL = new Set('co ltd limited inc incorporated llc lp llp plc corp corporation company sa ag se ab as asa ps aps gmbh bv nv spa srl sas sl slu sau oy oyj pty kk group holding holdings jsc pjsc bhd sdn pte tbk ltda sarl kg cv'.split(' '));
const OWN_WEAK = new Set(('energy energia energie power renewable renewables renovables wind windkraft windenergie vindkraft vind eolica eolico eolien eolienne solar offshore onshore ' +
  'green clean new investment investments development generation resources electric electricity capital international global ' +
  'taiwan japan korea china uk usa us america americas north europe germany deutschland france italia italy spain espana portugal polska poland greece hellas ' +
  'sweden sverige norway norge denmark danmark finland netherlands nederland belgium ireland australia canada brasil brazil mexico chile india vietnam philippines turkey romania').split(' '));
const OWN_PLACE = new Set(('state national provincial municipal city county province region inner mongolia anhui beijing chongqing fujian gansu guangdong guangxi guizhou hainan hebei heilongjiang ' +
  'henan hubei hunan jiangsu jiangxi jilin liaoning ningxia qinghai shaanxi shandong shanghai shanxi sichuan tianjin tibet xinjiang yunnan zhejiang hong kong').split(' '));
const OWN_PREFIX = [['taiwan power', 'taipower'], ['copenhagen infrastructure', 'cip'], ['china three gorges', 'three gorges'], ['china resources', 'china resources'], ['huarun', 'china resources'],
  ['state power investment', 'spic'], ['china general nuclear', 'cgn'], ['china guangdong nuclear', 'cgn'], ['china longyuan', 'longyuan'], ['china datang', 'datang'], ['china huadian', 'huadian'],
  ['china huaneng', 'huaneng'], ['china energy investment', 'china energy'], ['dong energy', 'orsted']];
const OWN_ALIAS = { cip: 'cip', dong: 'orsted' };
const ownGeneric = t => OWN_WEAK.has(t) || OWN_PLACE.has(t) || t.length < 3;
function ownerParts(f) {
  if (f._own) return f._own;
  const raw = f.owner || '', cut = raw.length >= 60 && !raw.endsWith('…'), seen = new Set();
  const segs = raw.replace(/…$/, '').split(/\s*;\s*|\s+\/\s+/).filter(Boolean);
  f._own = segs.map((seg, i) => {
    let w = (/[^\x00-\x7f]/.test(seg) ? seg.normalize('NFD').replace(/[̀-ͯ]/g, '') : seg).toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/ł/g, 'l').replace(/đ/g, 'd')
      .replace(/\([^)]*\)?/g, ' ').replace(/\b([a-z])\/([a-z])\b/g, '$1$2').replace(/[.'’]/g, '').replace(/windpower/g, 'wind power').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
    if (w[0] === 'the') w.shift();
    const rawKey = w.join(' ');
    if (!rawKey) { const k = seg.replace(/[^぀-ヿ㐀-鿿가-힯]/g, ''); return k.length >= 2 ? { label: seg.trim(), key: k, raw: k, trunc: false } : null; }
    if (/^(unknown|n a|na|none|other|others|various)$/.test(rawKey)) return null;
    const pre = OWN_PREFIX.find(([x]) => rawKey === x || rawKey.startsWith(x + ' '));
    let key;
    if (pre) key = pre[1];
    else {
      let weak = false;
      while (w.length > 1) {
        const last = w[w.length - 1];
        if (OWN_LEGAL.has(last)) { w.pop(); continue; }
        if (!OWN_WEAK.has(last) || w.slice(0, -1).every(ownGeneric)) break;     // 剩下的字全是泛稱或地名：停
        w.pop(); weak = true;
      }
      if (w[0] === 'china' && w.length > 1 && !ownGeneric(w[1])) w.shift();   // China Longyuan＝Longyuan
      key = w.join(' ');
      if (weak && key.length < 3) key = rawKey;                                   // 去掉泛稱後只剩兩三個字母：不拿來比
      key = OWN_ALIAS[key] || key;
    }
    return { label: seg.trim(), key, raw: rawKey, trunc: cut && i === segs.length - 1 };
  }).filter(p => p && !seen.has(p.key) && seen.add(p.key));
  return f._own;
}
/* 正規化全部業主約需 0.1 秒（手機更久）：風場資料載入後利用瀏覽器空檔先算好，第一次開卡片才不會卡頓 */
function warmOwners() {
  const list = D.farms.filter(f => !f._hay || (f.owner && !f._own));          // 也順便算好搜尋用字串，第一次搜尋不卡頓
  const idle = window.requestIdleCallback ? fn => requestIdleCallback(fn, { timeout: 1000 })      // 繪圖迴圈一直忙時也至少每秒做一小段
    : fn => setTimeout(() => { const t = performance.now(); fn({ timeRemaining: () => 8 - (performance.now() - t) }); }, 60);
  let i = 0;
  const step = dl => {
    do { for (const e = Math.min(list.length, i + (dl.didTimeout ? 1000 : 200)); i < e; i++) { hayOf(list[i]); if (list[i].owner) ownerParts(list[i]); } } while (i < list.length && dl.timeRemaining() > 2);
    if (i < list.length) idle(step);
  };
  idle(step);
}
const ownerMatch = (a, b) => a.key === b.key || (a.trunc && a.raw.length >= 12 && b.raw.startsWith(a.raw)) || (b.trunc && b.raw.length >= 12 && a.raw.startsWith(b.raw));
function sameOwnerLists(f) {
  const res = ownerParts(f).slice(0, 2).map(p => ({ p, list: [] }));
  if (!res.length) return res;
  for (const g of D.farms) {
    if (g === f || !g.owner || isAgg(g)) continue;
    const gp = ownerParts(g);
    for (const r of res) if (gp.some(q => ownerMatch(r.p, q))) r.list.push(g);
  }
  res.forEach(r => r.list.sort((a, b) => (b.iso === f.iso) - (a.iso === f.iso) || b.mw - a.mw));
  return res.filter(r => r.list.length);
}
/* 國內地位：以時間軸年份（年底）計，已除役的以最後運轉的一年；排名只比本站收錄的逐場紀錄（不含整區彙總），
   占比的分母是國家年底累計裝置容量（台灣＝能源署、日本＝JWPA、其他＝IRENA） */
function rankYear(f) {
  let y = Math.min(Y1, Math.floor(S.year + 1e-6));
  if (f.end && y >= f.end) y = f.end - 1;
  return Math.max(y, f.year);
}
const phaseDone = (f, p) => !f.pipe && (!p[0] || p[0] - BUILD <= S.year);
const cardYearKeyOf = f => rankYear(f) + '|' + (f.ph ? f.ph.filter(p => phaseDone(f, p)).length : 0);
function rankHTML(f) {
  if (!farmsReady || f.pseudo || isAgg(f)) return '';
  const c = byIso[f.iso], cn = c ? cname(c) : L('該國', 'this country');     // 沒有國家統計的地區（例：波士尼亞）只列排名
  const all = (farmsByIso[f.iso] || []).filter(g => !isAgg(g));
  const tile = (big, small) => '<div><b>' + esc(big) + '</b><span>' + esc(small) + '</span></div>';
  if (f.pipe) {
    const pl = all.filter(g => g.pipe);
    return pl.length < 2 ? '' : '<div class="fh">' + esc(T('rankHeadPipe')) + '</div><div class="ftiles">' + tile(T('rankNo')(1 + pl.filter(g => g.mw > f.mw).length), T('rankOfPipe')(cn, pl.length)) + '</div>';
  }
  const y = rankYear(f), mw = farmMwAt(f, y), isOff = t => t !== 'onshore';
  const act = all.filter(g => !g.pipe && farmActive(g, y)), same = act.filter(g => isOff(g.type) === isOff(f.type));
  const above = list => list.filter(g => farmMwAt(g, y) > mw).length;
  const tiles = [];
  if (act.length >= 2) {
    let small = T('rankOf')(cn, act.length);
    if (same.length >= 3 && same.length < act.length) small += L('；', ' · ') + T('rankType')(T('type')[isOff(f.type) ? 'offshore' : 'onshore'], 1 + above(same));
    tiles.push(tile(T('rankNo')(1 + above(act)), small));
  }
  const i = y - Y0, nat = c && i >= 0 ? (c.on[i] || 0) + (c.off[i] || 0) : 0;
  if (nat > 0 && mw > 0 && mw <= nat) { const p = mw / nat * 100; tiles.push(tile((p >= 10 ? Math.round(p) : p >= 0.1 ? p.toFixed(1) : '<0.1') + '%', T('shareOf')(cn))); }
  return tiles.length ? '<div class="fh">' + esc(T('rankHead')(y)) + '</div><div class="ftiles">' + tiles.join('') + '</div>' : '';
}
/* 分期時間軸（兩期以上）：每一期一列，長條接在前一期之後（累積到全場容量）；時間軸年份還沒完工的一期畫成虛線框 */
function phaseHTML(f) {
  if (!f.ph || f.ph.length < 2) return '';
  const tot = f.ph.reduce((s, p) => s + p[1], 0) || 1, cls = f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'fl' : 'off';
  let cum = 0;
  const rows = f.ph.map(p => {
    const x = cum / tot * 100, w = p[1] / tot * 100; cum += p[1];
    return '<li' + (phaseDone(f, p) ? '' : ' class="todo"') + '><span class="y">' + (p[0] || '?') + '</span><span class="tr"><i class="' + cls + '" style="left:' + x.toFixed(2) + '%;width:' + Math.max(w, 1.5).toFixed(2) + '%"></i></span><span class="v">+' + esc(fmtMW(p[1])) + '</span></li>';
  }).join('');
  return '<div class="fh">' + esc(T('phTitle')) + '</div><ul class="fphase" role="list">' + rows + '</ul>';
}
let cardYearKey = '';
function refreshCardYear() {                 // 時間軸年份改變：只重畫國內地位與分期（不動卡片其他部分與捲動位置）
  const f = cardItem && cardItem.kind === 'farm' ? cardItem.f : null;
  if (!f || f.pseudo) return;
  const k = cardYearKeyOf(f); if (k === cardYearKey) return; cardYearKey = k;
  const card = $('g-infoCard'), a = card.querySelector('.fstat'), b = card.querySelector('.fphw');
  if (a) a.innerHTML = rankHTML(f);
  if (b) b.innerHTML = phaseHTML(f);
}
/* 可點選的風場清單（附近、同開發商）：連結本身就是深連結，可另開分頁；一般點選則直接切換卡片 */
let relFarms = [];
function relItem(g, f, km) {
  const i = relFarms.push(g) - 1;
  const when = g.pipe ? (g.year ? T('expected') + ' ' + g.year : T('tbd')) : g.yu ? T('yearUnknown') : g.year + (g.end ? '–' + g.end : '');
  const bits = [fmtMW(g.mw), String(when)];
  if (g.iso !== f.iso && byIso[g.iso]) bits.push(cname(byIso[g.iso]));
  if (km != null) bits.push((km < 10 ? km.toFixed(1) : Math.round(km)) + ' km');
  return '<li><a href="' + esc(WW.hashFor('global', null, { r: byIso[g.iso] ? g.iso : null, f: g.name })) + '" data-rel="' + i + '"><span class="n">' + esc(fname(g)) + '</span><span class="m">' +
    '<span class="gtag ' + stCls(g) + '">' + (g.pipe || g.st === 4 ? T('st')[g.st] : T('type')[g.type]) + '</span>' + esc(bits.join(' · ')) + '</span></a></li>';
}
function relSection(key, title, list, f, withKm, note) {
  const shown = list.slice(0, REL_CAP), open = WW.store.get('ww_card_' + key, '1') === '1';
  return '<details class="frel" data-k="' + key + '"' + (open ? ' open' : '') + '><summary>' + esc(title) + '<span class="cnt">' + list.length + '</span></summary>' +
    '<ul' + (shown.length > REL_SHOW ? ' class="clip"' : '') + '>' + shown.map(x => withKm ? relItem(x.g, f, x.km) : relItem(x, f)).join('') + '</ul>' +
    (shown.length > REL_SHOW ? '<button type="button" class="frmore">' + esc(T('relMore')(shown.length)) + '</button>' : '') +
    (list.length > REL_CAP ? '<div class="gnote">' + esc(T('relCap')(list.length - REL_CAP)) + '</div>' : '') + (note ? '<div class="gnote">' + esc(note) + '</div>' : '') + '</details>';
}
/* 深連結（複製連結、回報錯誤用）：單檔版一律指向正式網站 */
function itemLink(it) {
  const p = { r: byIso[it.iso] ? it.iso : null };
  if (it.kind === 'ms') p.ms = it.m.name; else if (it.kind === 'port') p.port = it.p.id; else if (it.kind === 'event') p.ev = it.e.id; else p.f = it.f.name;
  return WW.pageURL(WW.hashFor('global', null, p));
}
/* 「回報資料錯誤」：開一則預填好的 GitHub issue（標題與欄位中英並列，方便維護者與回報者） */
function reportURL(it) {
  const f = it.f, c = byIso[it.iso], Z = I18N.zh, E = I18N.en;
  const both = (z, e) => z === e ? z : z + ' / ' + e;
  const rows = [
    (it.kind === 'ms' ? '里程碑 Milestone' : it.kind === 'port' ? '港口 Port' : it.kind === 'event' ? '事件 Event ' + it.e.id : '風場 Farm') + ': ' + it.name + (it.zh && it.zh !== it.name ? ' / ' + it.zh : ''),
    '國家 Country: ' + (c ? c.zh + ' / ' + c.name : (it.iso || '—')),
    '座標 Coordinates: ' + (it.lat == null ? '—' : (+it.lat).toFixed(4) + ', ' + (+it.lon).toFixed(4)) + (f && f.nStack ? '（共用代用座標 shared placeholder point）' : f && (f.flags & 1) ? '（概略位置 approximate）' : '')
  ];
  if (f && !f.pseudo) {
    rows.push('容量 Capacity: ' + f.mw + ' MW' + (f.ph ? '（' + f.ph.map(p => (p[0] || '?') + ': ' + p[1]).join(', ') + '）' : ''));
    rows.push('狀態 Status: ' + both(Z.st[f.st], E.st[f.st]) + ' · ' + both(Z.type[f.type], E.type[f.type]) + ' · ' + (f.yu ? '年份不詳 year unknown' : (f.pipe ? '預計 expected ' : '') + (f.year || '—') + (f.end ? '–' + f.end : '')));
    if (f.owner) rows.push('業主 Owner: ' + f.owner);
    if (f.turbine) rows.push('機型 Turbines: ' + f.turbine);
    rows.push('資料集 Dataset: ' + (['精選清單 curated list', 'GPPD (WRI)', 'GEM Global Wind Power Tracker', '2026 年整理清單 2026 compilation', '德國 MaStR (Bundesnetzagentur)'][f.src] || '—'));
  } else if (it.kind === 'ms') rows.push('年份 Year: ' + it.m.year);
  else if (it.kind === 'event') { rows.push('日期 Date: ' + it.e.date); rows.push('出處 Sources: ' + it.e.src.join(' ')); }
  else if (it.kind === 'port') {
    const pt = it.p;
    rows.push('角色 Roles: ' + pt.roles.map(r => I18N.zh.role[r] + ' / ' + I18N.en.role[r]).join('; '));
    rows.push('狀態 Status: ' + (pt.status === 'developing' ? '開發中 / in development' : pt.status === 'former' ? '已停止 / no longer active' : '使用中 / in use') + (pt.since ? ' · ' + pt.since : ''));
    if (pt.farms && pt.farms.length) rows.push('服務過的風場 Farms served: ' + pt.farms.join('; '));
    rows.push('出處 Sources: ' + (pt.src || []).join(' '));
  }
  rows.push('連結 Link: ' + itemLink(it));
  const body = rows.map(r => '- ' + r).join('\n') + '\n\n### 哪裡有錯？正確的資料是什麼？ What is wrong, and what is correct?\n\n\n### 出處 Source (URL or document)\n\n';
  const title = '資料錯誤 Data error: ' + it.name + (c ? ' (' + c.name + ')' : '');
  return REPO_URL + '/issues/new?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
}
/* 風場卡片的水下基礎列：有逐場紀錄就一律顯示（附出處）；沒有紀錄的只在水下基礎圖層顯示「型式不詳」 */
function fdHTML(f) {
  if (!f || f.pipe || f.pseudo || f.type === 'onshore' || !FD || (!f.fd && S.layer !== 'fd')) return '';
  const r = f.fd, note = r && (lang === 'zh' ? r.zh : r.en);
  const src = r ? (r.o || []).map(id => '<a href="' + esc(FD.meta.ospar.url) + '" target="_blank" rel="noopener" title="' + esc(FD.meta.ospar.title) + '">OSPAR ' + esc(id) + '</a>')
    .concat(r.u ? ['<a href="' + esc(r.u) + '" target="_blank" rel="noopener" title="' + esc(T(r.o ? 'fdSecond' : 'fdSrc')) + '">' + esc(hostOf(r.u)) + '</a>'] : []) : [];
  return '<div class="ffd"><i class="fdsw fd-' + fdGroup(f) + '"></i><b>' + esc(T('fdLabel')) + '</b>' + esc(L('：', ': ') + fdText(f)) +
    (src.length ? '<span class="fds">' + src.join('') + '</span>' : '') + (note ? '<div class="gnote">' + esc(note) + '</div>' : '') +
    (!r && (f.fdx || f.type !== 'floating') ? '<div class="gnote">' + esc(f.fdx ? f.fdx[lang === 'zh' ? 0 : 1] : T('fdStep')) + '</div>' : '') +
    (fdDimText(f) ? '<div class="fdim">' + esc(fdDimText(f)) + (r.du ? '<span class="fds"><a href="' + esc(r.du) + '" target="_blank" rel="noopener" title="' + esc(T('fdDimSrc')) + '">' + esc(hostOf(r.du)) + '</a></span>' : '') + (r.dz ? '<div class="gnote">' + esc(lang === 'zh' ? r.dz : r.de) + '</div>' : '') + '</div>' : '') +
    fdSVG(f) + '</div>';
}
/* 風場卡片的補充列：USWTDB 的機組與尺寸（美國）、離岸距離（由海岸線計算）、實際年發電量（EIA-923）或估計年發電量（容量 × 該國風電平均容量因數） */
function factsHTML(f) {
  if (!f || f.pipe || f.pseudo) return '';
  const rows = [], row = (label, text, note, link) => '<div class="ffact"><b>' + esc(label) + '</b>' + esc(L('：', ': ') + text) + (link || '') + (note ? '<div class="gnote">' + esc(note) + '</div>' : '') + '</div>';
  const tb = tbOf(f);
  if (tb) {
    const rng = v => v[0] === v[1] ? fmtNum(v[0]) : fmtNum(v[0]) + '–' + fmtNum(v[1]), dm = fdDims(f);   // 已有查證過的尺寸（水下基礎列）就不重複列 USWTDB 的
    const txt = [tb.n + ' ' + T('units'), tb.m ? tb.m + (tb.mn > 1 ? L('（', ' (') + T('tbModels')(tb.mn) + L('）', ')') : '') : null,
      tb.hh && !(dm && dm.hub != null) ? T('dimHub') + ' ' + rng(tb.hh) + ' m' : null, tb.rd && !(dm && dm.rotor) ? T('dimRotor') + ' ' + rng(tb.rd) + ' m' : null].filter(Boolean).join(' · ');
    const link = tb.src === 'us' ? '<span class="fds"><a href="' + esc(TB.meta.url) + '" target="_blank" rel="noopener" title="' + esc(T('tbSrcT') + ' ' + (TB.meta.version || '')) + '">USWTDB</a></span>'
      : tb.src === 'de' ? '<span class="fds"><a href="' + esc(TBD.meta.url) + '" target="_blank" rel="noopener" title="' + esc(T('tbDeT')) + '">' + esc(T('tbDeCr')) + '</a></span>'
      : '<span class="fds"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" title="' + esc(T('tbOsmT')) + '">' + esc(T('tbOsmCr')) + '</a></span>';
    rows.push(row(T('tbLabel'), txt, tb.src === 'us' ? T('tbNote') : tb.src === 'de' ? T('tbDeNote') : T('tbOsmNote'), link));
  }
  const ck = f.type !== 'onshore' && !f.nStack ? coastKm(f) : null;
  if (ck != null) rows.push(row(T('coastLabel'), L('約 ', 'about ') + (ck < 10 ? ck.toFixed(1) : Math.round(ck)) + ' km', T('coastNote')));
  const ag = genOf(f), cf = STATS && STATS.cf && STATS.cf[f.iso];
  if (ag) {                                                        // 實測值：最近一年＋各年
    const ys = Object.keys(ag.y).sort(), last = ys[ys.length - 1], fy = y => fmtGWh(ag.y[y][0]) + L('（', ' (') + T('actCf') + ' ' + ag.y[y][1].toFixed(1) + '%' + L('）', ')');
    const src = T('actSrc')[f.iso] || ['', '', ''];
    const link = '<span class="fds"><a href="' + esc(GEN.meta.url[f.iso] || '') + '" target="_blank" rel="noopener" title="' + esc(src[2]) + '">' + esc(src[1]) + '</a></span>';
    const rk = outRankOf(f);
    rows.push(row(T('actLabel'), last + L(' 年 ', ': ') + fy(last),
      (ys.length > 1 ? ys.slice(0, -1).map(y => y + L(' 年 ', ': ') + fy(y)).join(L('；', '; ')) + L('。', '. ') : '') + T('actNote')(fmtNum(ag.mw), src[0], f.iso) +
      (rk ? L('。', '. ') + T('outRank')(rk.y, rk.cf, rk.n, rk.gen) : '') + (f.iso === 'DNK' ? L('。', '. ') + T('outCredit')(dkGot()) : f.iso === 'AUS' ? L('。', '. ') + T('outCreditAU') : ''), link + (rk ? ' <button type="button" class="fout">' + esc(T('outSee')) + '</button>' : '')));
  } else if (cf && f.st === 0 && !(f.end && S.year >= f.end)) {
    const gwh = f.mw * cf.cf * 8.76, c = byIso[f.iso];
    rows.push(row(T('genLabel'), L('約 ', 'about ') + fmtGWh(gwh), T('genNote')(c ? cname(c) : f.iso, (cf.cf * 100).toFixed(1), cf.y[0] + '–' + cf.y[1]) + (f.type !== 'onshore' ? T('genOff') : '')));
  }
  if (f.iso === 'TWN' && !LITE && WW.live && WW.live.unitsForGlobalFarm(f.name).length) {   // 台灣即時取樣（含民營）
    if (!SAMP) needSamp();
    const sp = sampOfFarm(f);
    if (sp) rows.push(row(T('sampLabel'), T('sampVal')(fmtMWv(sp.out), sp.cf.toFixed(1)),
      T('sampNote')(sp.from, sp.to, sp.units.map(k => WW.live.unitName(k)).join(L('、', ', ')), sp.part),
      ' <button type="button" class="fout" data-out="TWS" data-k="' + esc(sp.units[0]) + '">' + esc(T('outSee')) + '</button>'));
  }
  return rows.length ? '<div class="ffacts">' + rows.join('') + '</div>' : '';
}
const fmtGWh = v => v >= 1000 ? (v / 1000).toLocaleString('en-US', { maximumFractionDigits: v >= 10000 ? 0 : 1 }) + ' TWh' : (v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' GWh';
/* 到最近海岸線的距離（公里）：Natural Earth 1:50m 國界多邊形的邊（沿海的邊就是海岸線），只看附近 4 度內的多邊形 */
function coastKm(f) {
  if (f._coast !== undefined) return f._coast;
  const lat = f.lat, lon = f.lon, kx = 111.32 * Math.cos(lat * D2R), ky = 110.574;
  let best = Infinity;
  for (let k = 0; k < RINGS.length; k++) {
    const bx = ringBox[k]; if (bx[2] < lon - 4 || bx[0] > lon + 4 || bx[3] < lat - 4 || bx[1] > lat + 4) continue;
    const r = RINGS[k];
    for (let i = 0; i < r.length - 2; i += 2) {
      const ax = (r[i] - lon) * kx, ay = (r[i + 1] - lat) * ky, bx_ = (r[i + 2] - lon) * kx, by = (r[i + 3] - lat) * ky;
      const dx = bx_ - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? clamp(-(ax * dx + ay * dy) / l2, 0, 1) : 0;
      const d = Math.hypot(ax + t * dx, ay + t * dy); if (d < best) best = d;
    }
  }
  return (f._coast = best < Infinity && best < 400 ? best : null);
}
/* 風場的尺寸（公尺）：水深取範圍上限、輪轂高度取範圍平均；沒有值的回傳 null */
function fdDims(f) {
  const r = f && f.fd; if (!r) return null;
  const avg = v => Array.isArray(v) ? (v[0] + v[1]) / 2 : v;
  const o = { depth: r.d ? r.d[1] : null, depthRange: r.d || null, hub: r.h != null ? avg(r.h) : null, hubRange: r.h, rotor: r.r || null, tower: r.hk === 'tower', url: r.du || null };
  return (o.depth != null || o.hub != null || o.rotor != null) ? o : null;
}
const fmtRange = v => Array.isArray(v) ? (v[0] == null ? '≤' + fmtNum(v[1]) : v[0] === v[1] ? fmtNum(v[0]) : fmtNum(v[0]) + '–' + fmtNum(v[1])) : fmtNum(v);   // [null, max]＝來源只寫最大水深
const fmtNum = v => (Math.round(v * 10) / 10).toLocaleString('en-US');
function fdDimText(f) {                                             // 「水深 15–20 m · 輪轂高度 90 m · 葉輪直徑 120 m」
  const d = fdDims(f); if (!d) return '';
  const parts = [];
  if (d.depthRange) parts.push(T('dimDepth') + ' ' + fmtRange(d.depthRange) + ' m');
  if (d.hub != null) parts.push(T(d.tower ? 'dimTower' : 'dimHub') + ' ' + fmtRange(d.hubRange) + ' m');
  if (d.rotor) parts.push(T('dimRotor') + ' ' + fmtNum(d.rotor) + ' m');
  return parts.join(' · ');
}
/* 風場卡片的剖面圖：海面、海床、風機與水下基礎型式。有水深、輪轂高度、葉輪直徑的風場依實際數值等比例畫（三者缺的用示意值補位），
   沒有的維持示意圖（非等比例） */
const SVG_COL = WW.FD_SVG_COL;
function fdSVG(f) {
  const r = f.fd, zh = lang === 'zh';
  const typeKey = t => (t === 'fl' || f.type === 'floating') ? 'fl:' + ((r && r.s) || '') : t;
  let items;                                                     // [{key, label, n}]
  if (!r) items = f.type === 'floating' ? [{ key: 'fl:' }] : null;
  else if (r.t === 'mx') items = (r.p || []).slice(0, 3).map(p => ({ key: typeKey(p[0]), n: p[1], label: fdTypeName(p[0]) }));
  else items = [{ key: typeKey(r.t) }];
  if (!items || !items.length) return '';
  const dm = fdDims(f), scaled = !!dm, k = items.length, W = 320;
  // 等比例：以公尺換算像素；缺的量用示意值補位（水深 25、輪轂 90、葉輪 130 m），並確保海床帶至少 28 px 讓基礎畫得出來
  const depthM = dm && dm.depth != null ? dm.depth : 25, hubM = dm && dm.hub != null ? dm.hub : 90, rotM = dm && dm.rotor ? dm.rotor : 130;
  const H = scaled ? 200 : 168, PAD_T = 8, PAD_B = 20;
  const px = scaled ? (H - PAD_T - PAD_B) / (hubM + rotM / 2 + Math.max(depthM, 8)) : 0;
  const SEA = scaled ? Math.round(PAD_T + (hubM + rotM / 2) * px) : 86, BED = scaled ? Math.min(H - PAD_B + 6, SEA + Math.max(28, Math.round(depthM * px))) : 148, slot = W / k;
  const geom = scaled ? { hubY: Math.round(SEA - hubM * px), rr: Math.max(6, rotM / 2 * px) } : null;
  const L_ = (a, b) => zh ? a : b, P = [];
  P.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="rgba(255,255,255,.04)"/>');
  P.push('<rect x="0" y="' + SEA + '" width="' + W + '" height="' + (BED - SEA) + '" fill="' + SVG_COL.sea + '"/>');
  P.push('<rect x="0" y="' + BED + '" width="' + W + '" height="' + (H - BED) + '" fill="' + SVG_COL.bed + '"/>');
  P.push('<line x1="0" y1="' + SEA + '" x2="' + W + '" y2="' + SEA + '" stroke="' + SVG_COL.seaLine + '" stroke-width="1" stroke-dasharray="4 3"/>');
  P.push('<text x="4" y="' + (SEA - 4) + '" font-size="9" fill="' + SVG_COL.txt + '" opacity=".75">' + L_('海面', 'sea level') + '</text>');
  P.push('<text x="4" y="' + (k > 1 ? BED + 9 : H - 4) + '" font-size="9" fill="' + SVG_COL.txt + '" opacity=".75">' + L_('海床', 'seabed') + '</text>');   // 混合型：底排留給各型式的標籤
  items.forEach((it, i) => {
    const cx = slot * (i + 0.5), [t, sub] = it.key.split(':'), sc = k === 1 ? 1 : 0.8;
    const sh = WW.fdDraw(t, sub, cx, SEA, BED, SVG_COL); P.push(sh.svg); const top = sh.top;   // 基礎本體（與風電知識頁共用 core.js 的繪製）
    P.push(WW.fdTurbine(cx, top, sc, SVG_COL, geom && { hubY: Math.min(geom.hubY, top - 10), rr: geom.rr }));   // 風機：塔、機艙、葉輪（等比例時依實際高度）
    if (k > 1) P.push('<text x="' + cx + '" y="' + (H - 4) + '" text-anchor="middle" font-size="9" fill="' + SVG_COL.txt + '" opacity=".9">' + esc((it.label || '') + (it.n ? ' × ' + it.n : '')) + '</text>');
  });
  let note = L_('剖面示意圖，非等比例；近景的風機基座也依此型式繪製。', 'Schematic cross-section, not to scale; the close-up turbines carry the same base type.');
  if (scaled) {                                                  // 標示實際數值；三個都有才算完整等比例
    const txt = (x, y, t, anchor) => '<text x="' + x + '" y="' + y + '" font-size="9" fill="' + SVG_COL.txt + '" opacity=".85"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(t) + '</text>';
    if (dm.depthRange) P.push(txt(W - 4, BED - 4, T('dimDepth') + ' ' + fmtRange(dm.depthRange) + ' m', 'end'));
    if (dm.hub != null) P.push(txt(W - 4, Math.max(PAD_T + 9, geom.hubY + 3), T(dm.tower ? 'dimTower' : 'dimHub') + ' ' + fmtRange(dm.hubRange) + ' m', 'end'));
    if (dm.rotor) P.push(txt(W - 4, Math.max(PAD_T + 9, geom.hubY - geom.rr + 3), T('dimRotor') + ' ' + fmtNum(dm.rotor) + ' m', 'end'));
    const have = [dm.depthRange && T('dimDepth'), dm.hub != null && T(dm.tower ? 'dimTower' : 'dimHub'), dm.rotor && T('dimRotor')].filter(Boolean);
    note = have.length === 3 ? T('fdScaled') : T('fdPartScaled').replace('{v}', have.join(L_('、', ', ')));
  }
  return '<svg class="fdsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(T('fdLabel') + ': ' + fdText(f) + (scaled ? ' · ' + fdDimText(f) : '')) + '">' + P.join('') + '</svg>' +
    '<div class="gnote fdnote">' + note + '</div>';
}
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
const srcLabel = u => { try { const x = new URL(u), path = decodeURIComponent(x.pathname).replace(/\/$/, ''); return hostOf(u) + (path.length > 38 ? path.slice(0, 36) + '…' : path); } catch (e) { return u; } };
async function copyText(s) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(s); return true; } } catch (e) { /* 改用下面的舊方法 */ }
  const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove(); return ok;
}
function refreshLiveBox() {                  // 即時資料更新：只換卡片裡的即時框
  const slot = cardItem && $('g-infoCard').querySelector('.lvslot'); if (!slot) return;
  const f = cardItem.f || cardItem.farm; slot.innerHTML = f ? liveBoxFor(f) : '';
}
function renderCard(it) {
  const same = it === cardItem;               // 同一張卡重畫（換語言）：保留捲動位置
  cardItem = it; relFarms = [];
  const card = $('g-infoCard');
  const c = byIso[it.iso]; const cn = c ? cname(c) : (it.iso || '');
  let title, sub = '', spec = '', desc = '', tag;
  const f = it.f;
  const real = !!f && !f.pseudo, full = !TOUR;   // 導覽時卡片保持精簡：不列附近／同開發商與動作列
  if (it.kind === 'ms') {
    const m = it.m; title = m.name;
    tag = '<span class="gtag ' + stCls({ type: it.type }) + '">' + T('type')[it.type] + '</span>';
    spec = [m.mw ? T('turbine') + ' ' + (m.mw < 1 ? (m.mw * 1000).toFixed(0) + ' kW' : m.mw + ' MW') : null, m.farm ? T('farm') + ' ' + WW.int(m.farm) + ' MW' : null, m.rotor ? T('rotor') + ' ' + m.rotor + ' m' : null, m.maker ? esc(m.maker) : null].filter(Boolean).join(' · ');
    desc = it.why || (lang === 'zh' ? m.zh : m.en);
  } else if (it.kind === 'event') {
    const e = it.e; title = evTitle(e);
    tag = evCatTag(e) + '<span class="gtag ' + (e.site === 'on' ? 'on' : 'off') + '">' + esc(evL(e.sub)) + '</span>';
    spec = [esc(evL(e.project)), e.stage ? esc(T('evStage') + ' ' + evL(e.stage)) : null, e.mw != null ? esc(T('evMw') + ' ' + fmtMW(e.mw)) : null, e.mwEvent != null ? esc(T('evMwEvent') + ' ' + fmtMW(e.mwEvent)) : null,
      e.turbine ? esc(e.turbine + (e.unitMw ? ' (' + e.unitMw + ' MW)' : '')) : null, e.foundation ? esc(T('evFd') + ' ' + evL(e.foundation)) : null, e.owner ? esc(e.owner) : null].filter(Boolean).join(' · ');
    desc = evL(e.summary);
  } else if (it.kind === 'turb') {                                // 丹麥單部風機（發電表現「丹麥・單部風機」）
    const r = it.r; title = r.v.m || T('turbNoModel'); sub = T('turbMuni')(r.name);
    tag = '<span class="gtag ' + (r.type === 'onshore' ? 'on' : 'off') + '">' + esc(T('turbTag')) + '</span>';
    spec = [fmtUnit(r.v.mw), r.v.rd ? T('dimRotor') + ' ' + r.v.rd + ' m' : null, r.v.hh ? T('dimHub') + ' ' + r.v.hh + ' m' : null].filter(Boolean).map(esc).join(' · ');
  } else if (it.kind === 'port') {
    const pt = it.p; title = pname(pt); if (lang === 'zh' && pt.zh) sub = pt.name;
    tag = '<span class="gtag port">⚓ ' + esc(T('portTag')) + '</span>' + portStatusTag(pt);
    spec = '<div class="proles">' + pt.roles.map(r => '<span>' + esc(T('role')[r]) + '</span>').join('') + '</div>';
    desc = lang === 'zh' ? (pt.zhNote || pt.en) : pt.en;
  } else {
    title = fname(f); if (lang === 'zh' && f.zh) sub = f.name;
    tag = '<span class="gtag ' + stCls(f) + '">' + (f.pipe ? T('st')[f.st] : T('type')[f.type]) + '</span>' + (f.pipe ? '<span class="gtag ' + (f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'floating' : 'off') + '">' + T('type')[f.type] + '</span>' : '');
    needTurbines(f); needGen();
    const sp = turbSpec(f);
    const phases = f.ph && f.ph.length < 2 ? ' · ' + f.ph.map(p => (p[0] || '?') + ': ' + WW.int(p[1])).join(', ') + ' MW' : '';   // 兩期以上另畫分期時間軸
    spec = T('totalCap') + ' ' + fmtMW(f.mw) + phases + (f.turbine ? ' · ' + esc(f.turbine) : (sp.n > 1 && !f.pseudo && !f.pipe ? ' · ' + (sp.real ? '' : '~') + sp.n + ' ' + T('units') : '')) + (f.owner ? ' · ' + esc(f.owner) : '');
    desc = it.why || '';
  }
  const yrs = it.kind === 'turb' ? (it.year ? T('outConn')(it.year) : '') : it.kind === 'event' ? evDate(it.e) + ' · ' + evL(it.e.area) : it.kind === 'port' ? (it.p.since ? T('portSince')(it.p.since) : '') : f && f.pipe ? (f.year ? T('expected') + ' ' + f.year : '') : (f && f.yu ? T('yearUnknown') : it.year + (it.end ? '–' + it.end + ' (' + T('decom') + ')' : ''));
  const bare = it.name.replace(/ · .*$/, ''), la = (+it.lat).toFixed(5), lo = (+it.lon).toFixed(5);
  const q = encodeURIComponent(it.kind === 'port' ? (it.zh && lang === 'zh' ? it.zh + ' 離岸風電' : bare + ' offshore wind')
    : (it.zh && lang === 'zh' ? it.zh : bare) + (/wind|turbine|風/i.test(it.name) ? '' : ' wind farm'));
  const ext = (href, text, cls, tip) => '<a href="' + esc(href) + '" target="_blank" rel="noopener"' + (cls ? ' class="' + cls + '"' : '') + (tip ? ' title="' + esc(tip) + '"' : '') + '>' + esc(text) + '</a>';
  let links = ext('https://www.google.com/maps/@' + it.lat + ',' + it.lon + ',' + (it.kind === 'ms' && !(it.m.farm) ? 14 : 11) + 'z/data=!3m1!1e3', T('lnkMap')) +
    ext('https://www.openstreetmap.org/?mlat=' + la + '&mlon=' + lo + '#map=13/' + la + '/' + lo, T('lnkOsm'));
  // Global Wind Atlas：/shared/ 後接 GeoJSON 點，開啟即拉近到該點並顯示平均風速圖層（2026-09 實測）；共用代用座標的風場不給
  if (it.kind !== 'port' && !(f && f.nStack)) links += ext('https://globalwindatlas.info/' + (lang === 'zh' ? 'zh' : 'en') + '/shared/' + encodeURIComponent(JSON.stringify({ type: 'Feature', properties: { type: 'marker' }, geometry: { type: 'Point', coordinates: [+lo, +la] } })), T('lnkGwa'), '', T('lnkGwaT'));
  links += ext('https://www.google.com/search?tbm=isch&q=' + q, T('lnkPhoto'));
  if (f && f.src === 2) links += ext('https://www.gem.wiki/' + encodeURIComponent(bare.replace(/ /g, '_')), T('lnkGem'));
  if (it.kind !== 'port') links += ext('https://www.wikidata.org/w/index.php?search=' + encodeURIComponent(bare), T('lnkWd'), 'wd');
  if (f && f.url) links += ext(f.url, T('lnkSrc'));
  if (it.kind === 'turb') links = ext('https://www.google.com/maps/@' + la + ',' + lo + ',17z/data=!3m1!1e3', T('lnkMap')) + ext('https://www.openstreetmap.org/?mlat=' + la + '&mlon=' + lo + '#map=17/' + la + '/' + lo, T('lnkOsm')) +
    ext('https://globalwindatlas.info/' + (lang === 'zh' ? 'zh' : 'en') + '/shared/' + encodeURIComponent(JSON.stringify({ type: 'Feature', properties: { type: 'marker' }, geometry: { type: 'Point', coordinates: [+lo, +la] } })), T('lnkGwa'), '', T('lnkGwaT'));
  if (it.kind === 'event') links = it.lat == null ? '' : ext('https://www.google.com/maps/@' + it.lat + ',' + it.lon + ',11z/data=!3m1!1e3', T('lnkMap')) + ext('https://www.openstreetmap.org/?mlat=' + la + '&mlon=' + lo + '#map=12/' + la + '/' + lo, T('lnkOsm'));
  let rel = '';
  if (it.kind === 'event' && full) rel += evCardExtra(it);
  if (it.kind === 'port' && full) {                  // 港口：服務過的風場（對得到資料的可點選），其他專案列文字
    const served = (it.p.farms || []).map(farmNamed).filter(Boolean), other = (it.p.farmsOther || []).join(lang === 'zh' ? '、' : ', ');
    if (served.length) rel += relSection('pserved', T('portFarms'), served, { iso: it.p.iso }, false, (other ? T('portOther') + other + ' · ' : '') + T('portArcs'));
    else if (other) rel += '<p class="gnote fnear0">' + esc(T('portFarms') + L('：', ': ') + other) + '</p>';
    const src = it.p.src || [];                     // 出處可能很多：收成可展開的編號清單（網站＋路徑），不塞在連結列
    if (src.length) rel += '<details class="frel" data-k="psrc"' + (WW.store.get('ww_card_psrc', '1') === '1' ? ' open' : '') + '><summary>' + esc(T('portSrcT')) + '<span class="cnt">' + src.length + '</span></summary><ol class="psrc">' +
      src.map(u => '<li><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(srcLabel(u)) + '</a></li>').join('') + '</ol></details>';
  }
  if (real && full) {
    const near = nearbyFarms(f);
    if (near) rel += near.length ? relSection('near', T('near'), near, f, true) : '<p class="gnote fnear0">' + esc(T('nearNone')) + '</p>';
    sameOwnerLists(f).forEach(o => { rel += relSection('own', T('sameOwner') + L('：', ': ') + o.p.label, o.list, f, false, T('ownNote')); });
    rel += evFarmSection(f);
  }
  card.querySelector('.cb').innerHTML =
    '<div class="gph" hidden><img alt=""><span class="cr"></span></div>' +
    '<div class="kick">' + tag + (yrs !== '' ? esc(String(yrs)) + ' · ' : '') + esc(cn) + '</div>' +
    '<h3>' + esc(title) + '</h3>' + (sub ? '<div class="csub">' + esc(sub) + '</div>' : '') +
    (it.story && desc ? '<p class="desc story"><b>' + esc(T('tourStory')[it.story]) + (TOUR ? ' · ' + (TOUR.i + 1) + ' / ' + TOUR.stops.length : '') + '</b>' + esc(desc) + '</p>' : '') +
    (spec ? '<div class="spec">' + spec + '</div>' : '') +
    (real ? fdHTML(f) + factsHTML(f) : '') + (it.kind === 'turb' ? turbFacts(it.r) : '') +
    (real ? '<div class="fstat">' + rankHTML(f) + '</div><div class="fphw">' + phaseHTML(f) + '</div>' : '') +
    (desc && !it.story ? '<p class="desc">' + esc(desc) + '</p>' : '') +
    (noteOf(f) ? '<p class="fnote">' + esc(noteOf(f)) + '</p>' : '') +
    (posNote(f) ? '<p class="fnote pos">' + esc(posNote(f)) + '</p>' : '') +
    '<div class="lvslot">' + (f ? liveBoxFor(f) : (it.farm ? liveBoxFor(it.farm) : '')) + '</div>' +
    '<p class="wx">' + T('wikiLoading') + '</p><div class="links xl">' + links + '</div>' + rel +
    (full && it.kind !== 'turb' ? '<div class="factions"><button type="button" class="fcopy">🔗 ' + esc(T(it.kind === 'ms' ? 'copyLinkMs' : it.kind === 'port' ? 'copyLinkPort' : it.kind === 'event' ? 'copyLinkEv' : 'copyLink')) + '</button>' +
      '<a class="freport" href="' + esc(reportURL(it)) + '" target="_blank" rel="noopener" title="' + esc(T('reportT')) + '">⚑ ' + esc(T('report')) + '</a></div>' : '');
  card.classList.add('show'); $('g-mapPane').classList.add('carded');
  if (!same) card.scrollTop = 0;
  cardYearKey = real ? cardYearKeyOf(f) : '';
  card.querySelectorAll('[data-rel]').forEach(a => a.onclick = e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;       // 另開分頁：交給瀏覽器
    e.preventDefault(); const g = relFarms[+a.dataset.rel]; if (g) selectFarm(g);
  });
  card.querySelectorAll('details.frel').forEach(d => d.addEventListener('toggle', () => WW.store.set('ww_card_' + d.dataset.k, d.open ? '1' : '0')));
  wireEvRows(card);
  card.querySelectorAll('.frmore').forEach(b => b.onclick = () => { b.previousElementSibling.classList.remove('clip'); b.remove(); });
  card.querySelectorAll('.fout').forEach(b => {
    b.onclick = () => b.dataset.out === 'TWS' ? openOutput({ iso: 'TWS', view: 'cf', per: '90', hl: b.dataset.k })
      : b.dataset.out === 'DKT' ? openOutput({ iso: 'DKT', view: 'cf', year: b.dataset.y, hl: b.dataset.k }) : f && openOutput({ iso: f.iso, view: 'cf', hl: f.iso + '|' + f.name });
  });
  const cp = card.querySelector('.fcopy');
  if (cp) cp.onclick = async () => {
    const url = itemLink(it);
    if (await copyText(url)) { WW.toast(T('copied')); return; }
    WW.toast(T('copyFail'));
    const box = card.querySelector('.factions'); let inp = box.querySelector('.flink');
    if (!inp) { inp = document.createElement('input'); inp.className = 'flink'; inp.readOnly = true; inp.setAttribute('aria-label', T('copyLink')); box.appendChild(inp); }
    inp.value = url; inp.focus(); inp.select();
  };
  const myIt = it;
  itemPhoto(it).then(p => { if (cardItem === myIt) setCardPhoto(card, p); });
  if (it.kind === 'port' || it.kind === 'event' || it.kind === 'turb') { card.querySelector('.wx').remove(); return; }      // 港口、事件：維基百科比對容易誤配，改列出處；單部風機沒有條目
  wikiLookup(it).then(w => {
    if (cardItem !== myIt) return;
    const wx = card.querySelector('.wx');
    if (!w || w === 'ERR') { wx.textContent = w === 'ERR' ? T('wikiOffline') : T('wikiNone'); return; }
    wx.textContent = w.extract ? (w.extract.length > 260 ? w.extract.slice(0, 260) + '…' : w.extract) : '';
    const a = document.createElement('a'); a.href = w.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = T('lnkWiki') + ' · ' + w.title;
    card.querySelector('.links.xl').prepend(a);                   // 不是即時框裡的 .links
    const wd = card.querySelector('.links.xl .wd'); if (wd && w.qid) wd.href = 'https://www.wikidata.org/wiki/' + w.qid;   // 找到維基百科條目：直接連到它的 Wikidata 項目
  });
}
function closeCard() { $('g-infoCard').classList.remove('show'); $('g-mapPane').classList.remove('carded'); cardItem = null; focusPort = null; focusEvent = null; if (!TOUR) focusFarm = null; updateClusters(0, true); syncURL(); }
function selectFarm(f) {
  setPlaying(false);
  if (f.pipe) { if (!S.pipe) togglePipe(true); S.year = Y1; syncYearUI(); }
  else if (fAge(f) < BUILD) { S.year = Math.min(Y1, f.year + 0.5); syncYearUI(); }
  else if (f.end && S.year >= f.end) { S.year = Math.max(f.year + 0.5, f.end - 0.5); syncYearUI(); }     // 已除役：回到它還在運轉的年份
  if (f.iso && byIso[f.iso] && S.region !== f.iso) setRegion(f.iso, true);
  focusFarm = f; focusPort = null; focusEvent = null; updateClusters(0, true);
  flyToLonLat(f.lon, f.lat, farmAlt(f));
  renderCard(farmItem(f));
  syncURL();
}
function openStop(st) {
  setPlaying(false);
  S.year = clamp(st.year + 0.7, Y0, Y1); syncYearUI();
  if (st.kind === 'ms' && !st.farm && farmsReady) st.farm = msPseudoFarm(st.m);
  focusFarm = st.farm || st.f || null;
  const tf = (st.farm && !st.farm.pseudo) ? st.farm : st;
  flyToLonLat(tf.lon, tf.lat, stopAlt(st));
  renderCard(st.kind === 'ms' ? st : Object.assign(farmItem(st.f, st.why), { story: st.story || null }));
}
function stopAlt(st) { const f = st.farm || st.f; return f ? farmAlt(f) * 1.25 : 0.5; }

/* ================= tour mode ================= */
let TOUR = null;
function isAgg(f) { return /remainder|placeholder|aggregate|misc|corridor|cluster|\bbase\b|smaller projects|unnamed|其他|合計/i.test(f.name + ' ' + (f.zh || '')); }
function buildTourStops(region) {
  const stops = [];
  D.milestones.forEach(m => { if (inScope(m.iso, region)) stops.push(msStop(m)); });
  const sn = region === 'WORLD' ? L('全球', 'the world') : scopeName(region);
  const add = (f, why) => {
    const dup = stops.find(s => Math.abs(s.lat - f.lat) < 0.3 && Math.abs(s.lon - f.lon) < 0.3 && Math.abs(s.year - f.year) <= 2);
    if (dup) { if (dup.kind === 'ms') { dup.farm = f; } return; }
    stops.push({ kind: 'farm', f, name: f.name, zh: f.zh, lat: f.lat, lon: f.lon, year: f.year, type: f.type, iso: f.iso, why });
  };
  const farms = D.farms.filter(f => inScope(f.iso, region) && !isAgg(f) && !f.pipe && f.st === 0 && !f.yu).sort((a, b) => a.year - b.year || b.mw - a.mw);
  const types = region === 'WORLD' ? ['off'] : ['off', 'on'];
  types.forEach(tp => {
    const list = farms.filter(f => tp === 'off' ? f.type !== 'onshore' : f.type === 'onshore');
    let rec = 0;
    list.forEach((f, i) => {
      if (i === 0 && region !== 'WORLD') { add(f, T(tp === 'off' ? 'whyFirstOff' : 'whyFirstOn')(sn)); rec = f.mw; return; }
      if (f.mw >= rec * 1.3 && f.mw >= (region === 'WORLD' ? 40 : 10)) { add(f, T(tp === 'off' ? 'whyRecOff' : 'whyRecOn')(sn)); rec = f.mw; }
    });
  });
  if (region !== 'WORLD') { farms.slice().sort((a, b) => b.mw - a.mw).slice(0, 3).forEach(f => add(f, T('whyTop')(sn))); }
  stops.sort((a, b) => a.year - b.year || a.lat - b.lat);
  const cap = region === 'WORLD' ? 60 : 20;
  return stops.slice(0, cap);
}
/* 故事導覽：每一站指定一座風場（名稱與 wind_farms.json 完全一致），說明只用本站已查證的資料（風場紀錄、里程碑、事件圖層、實際年發電量、
   tools/latest_wind.py 與 tools/farm_cleanup.py 的出處）；風場改名時要一起改，找不到的站會略過並在主控台警告 */
const STORIES = {
  tw: { region: 'TWN', dwell: 11, stops: [
    ['Formosa 1 Phase 1', '2017 年，海洋風電在苗栗竹南外海立起 2 部 Siemens 4 MW 示範機，是台灣第一批離岸風機。',
      'In 2017 Formosa 1 put up two Siemens 4 MW demonstration turbines off Zhunan, Miaoli: Taiwan\'s first offshore wind turbines.'],
    ['Formosa 1 Phase 2', '2019 年再增 20 部 6 MW，海洋風電成為台灣第一座商業離岸風場（2020 年 1 月正式商轉），也是台灣離岸風電計畫的起點。',
      'Twenty 6 MW turbines followed in 2019, making Formosa 1 Taiwan\'s first commercial offshore wind farm (commercial operation in January 2020) and the starting point of the national programme.'],
    ['Taipower Offshore Phase 1 (Changhua)', '台電第一座離岸風場：21 部日立 5.2 MW、109.2 MW，位在彰化芳苑外海 7.2–8.7 km，2021 年完工；2025 年淨發電 306 GWh、容量因數 31.9%（台電開放資料）。',
      'Taipower\'s first offshore farm: 21 Hitachi 5.2 MW turbines, 109.2 MW, 7.2–8.7 km off Fangyuan, Changhua, completed in 2021; net generation of 306 GWh in 2025, a capacity factor of 31.9% (Taipower open data).'],
    ['Formosa 2', '海能風電 47 部 8 MW、376 MW：2022 年 7 月首度併網、2023 年 9 月全數商轉，台灣從示範計畫邁向公用事業規模。',
      'Formosa 2, 47 × 8 MW and 376 MW: first power in July 2022 and full commercial operation in September 2023, taking Taiwan from demonstration projects to utility scale.'],
    ['Greater Changhua 1 & 2a', '沃旭大彰化東南及西南第一階段 900 MW、111 部機組，2024 年 4 月全面併網；距彰化外海約 35–60 km，完工時是台灣最大的離岸風場。',
      'Ørsted\'s Greater Changhua 1 & 2a, 900 MW with 111 turbines, fully connected in April 2024; 35–60 km off Changhua, it was Taiwan\'s largest offshore farm when completed.'],
    ['Changfang & Xidao', '彰芳暨西島 62 部 Vestas 9.5 MW，2024 年 5 月建置完成。',
      'Changfang & Xidao, 62 Vestas 9.5 MW turbines, construction completed in May 2024.'],
    ['Yunlin', '允能雲林 80 部 8 MW、640 MW，2025 年 8 月 21 日全面商轉。',
      'Yunlin, 80 × 8 MW and 640 MW, in full commercial operation from 21 August 2025.'],
    ['Zhong Neng', '中能 31 部 Vestas 9.5 MW、294.5 MW，2025 年完工。',
      'Zhong Neng, 31 Vestas 9.5 MW turbines and 294.5 MW, completed in 2025.'],
    ['Greater Changhua 2b & 4', '大彰化西南第二階段與西北 920 MW、66 部 14 MW 機組：2026 年 9 月 1 日完工典禮、進入最後試運轉（8 月有一部 14 MW 機組起火）。',
      'Greater Changhua 2b & 4, 920 MW with 66 × 14 MW turbines: completion ceremony on 1 September 2026 and final commissioning under way (one 14 MW turbine caught fire in August).'],
    ['Hai Long 2 & 3', '海龍 73 部 14 MW、1,044 MW：2026 年第二季已裝 71 部、59 部發電，預計 2027 年全面商轉。',
      'Hai Long, 73 × 14 MW and 1,044 MW: by Q2 2026, 71 installed and 59 generating; full commercial operation expected in 2027.'],
    ['Taipower Offshore Phase 2', '台電離岸二期 31 部 Vestas 9.5 MW：2026 年 7 月台電依契約接管風機安裝，30 座待裝，以年底前完成併網為目標（中央社）。到 2026 年 8 月，台灣離岸風電累計 4,984.9 MW（能源署月報表）。',
      'Taipower Offshore Phase 2, 31 Vestas 9.5 MW turbines: in July 2026 Taipower took over turbine installation under the contract, with 30 still to install and grid connection targeted by the end of the year (CNA). By August 2026 Taiwan had 4,984.9 MW of offshore wind (Energy Administration monthly statistics).'],
  ] },
  /* 第 4 欄是國別（與本章 region 不同時）；'ms' 表示這一站是里程碑（名稱與 wind_global.json 一致） */
  eu: { region: 'C:Europe', dwell: 11, stops: [
    ['Vindeby', '1991 年，丹麥 Lolland 外海 11 部 Bonus 450 kW 風機（約 5 MW）組成世界第一座離岸風場，運轉到 2017 年退役。',
      'In 1991 eleven Bonus 450 kW turbines (about 5 MW) off Lolland, Denmark, formed the world\'s first offshore wind farm; it ran until it was decommissioned in 2017.', 'DNK'],
    ['Middelgrunden', '2000 年，哥本哈根外海弧形排列的 20 部 2 MW 風機（40 MW）：建成時是全球最大的離岸風場，也是社區共同持有的典範。',
      'In 2000 twenty 2 MW turbines in a curved row off Copenhagen (40 MW) became the world\'s largest offshore wind farm and a landmark of community co-ownership.', 'DNK'],
    ['Horns Rev 1', '2002 年，北海的 80 部 Vestas V80 2 MW（160 MW）：第一座大型離岸風場，也是第一座真正處於外海環境的風場。',
      'In 2002 eighty Vestas V80 2 MW turbines in the North Sea (160 MW) made Horns Rev 1 the first large-scale offshore wind farm and the first in true open-sea conditions.', 'DNK'],
    ['alpha ventus', '2010 年，德國北海的 alpha ventus：6 部 Areva Multibrid M5000 與 6 部 REpower 5M，共 60 MW，同一座風場裡用了兩種 5 MW 機型。',
      'In 2010 Germany\'s alpha ventus in the North Sea combined six Areva Multibrid M5000 and six REpower 5M turbines, 60 MW with two different 5 MW models in one farm.', 'DEU'],
    ['London Array', '2013 年 7 月正式啟用的 London Array：175 部 Siemens 3.6 MW、630 MW，2013 至 2017 年間是全球最大的離岸風場。',
      'London Array, officially opened in July 2013: 175 Siemens 3.6 MW turbines and 630 MW, the world\'s largest offshore wind farm from 2013 to 2017.', 'GBR'],
    ['Hornsea One', '2019 年 Hornsea One 投運：174 部 Siemens Gamesa 7 MW、1,218 MW，單一風場首度跨過 1 GW。',
      'Hornsea One was commissioned in 2019: 174 Siemens Gamesa 7 MW turbines and 1,218 MW, the first single wind farm past 1 GW.', 'GBR'],
    ['Hornsea Two', '2022 年 8 月 Hornsea Two 全面營運：165 部 Siemens Gamesa 8 MW 級、約 1.3 GW，宣布時是全球最大的營運中離岸風場。',
      'Hornsea Two became fully operational in August 2022: 165 Siemens Gamesa 8 MW-class turbines and about 1.3 GW, the world\'s largest operating offshore wind farm when announced.', 'GBR'],
    ['Hollandse Kust Zuid I & II', '荷蘭 Hollandse Kust Zuid 2018 年以零補貼得標，2023 年 9 月揭幕：I–IV 期共 139 部 Siemens Gamesa 11 MW、約 1.5 GW，第一座不靠價格補貼興建的離岸風場。',
      'The Netherlands\' Hollandse Kust Zuid was won without subsidy in 2018 and inaugurated in September 2023: 139 Siemens Gamesa 11 MW turbines across phases I–IV, about 1.5 GW, the first offshore wind farm built without price support.', 'NLD'],
    ['Seagreen Phase 1', '2023 年 10 月全面營運的 Seagreen：114 部 Vestas V164-10 MW、1,075 MW，最深的基礎在水深 58.7 m，是固定式基礎最深的大型離岸風場。',
      'Seagreen, fully operational in October 2023: 114 Vestas V164-10 MW turbines and 1,075 MW, with its deepest foundation in 58.7 m of water, the deepest large fixed-bottom offshore wind farm.', 'GBR'],
    ['Dogger Bank A', '2023 年 10 月，Dogger Bank A 的 GE Haliade-X 13 MW 首度發電：95 部、1,200 MW；Dogger Bank A、B、C 三期合計 3.6 GW。',
      'Dogger Bank A delivered first power from GE Haliade-X 13 MW turbines in October 2023: 95 units and 1,200 MW; phases A, B and C total 3.6 GW.', 'GBR'],
    ['Moray West', '2025 年完工的 Moray West：60 部 Siemens Gamesa 14 MW、882 MW，單機容量約是 1991 年 Vindeby 的 31 倍。2025 年底，英國離岸累計 16.1 GW、德國 9.9 GW、荷蘭 5.4 GW、丹麥 2.7 GW（本站國家數列）。',
      'Moray West, completed in 2025: 60 Siemens Gamesa 14 MW turbines and 882 MW, each about 31 times Vindeby\'s 1991 units. At the end of 2025 the UK had 16.1 GW offshore, Germany 9.9 GW, the Netherlands 5.4 GW and Denmark 2.7 GW (the site\'s national series).', 'GBR'],
  ] },
  cn: { region: 'CHN', dwell: 11, stops: [
    ['Dabancheng wind farm, Xinjiang', '新疆達坂城：中國第一座大型風場（2000 年超過 100 MW），也是中國先驅風機製造商金風科技的發源地。2000 年中國風電累計 341 MW（本站國家數列）。',
      'Dabancheng, Xinjiang: China\'s first large wind farm (over 100 MW by 2000) and the birthplace of Goldwind, China\'s pioneering turbine maker. China had 341 MW of wind power in 2000 (the site\'s national series).', 'ms'],
    ['Inner Mongolia Chayouzhong Banner Huitengxile (Huadian) wind farm', '內蒙古輝騰錫勒草原：華電 121 MW 風場 2006 年商轉。這一年中國風電累計從 1.06 GW 增加到 2.07 GW，此後連年快速成長。',
      'The Huitengxile grassland in Inner Mongolia: Huadian\'s 121 MW farm started in 2006, the year China\'s wind capacity doubled from 1.06 GW to 2.07 GW and began years of rapid growth.'],
    ['Gansu Guazhou / Jiuquan wind base', '甘肅戈壁的酒泉風電基地自 2009 年起建，成為全球最大的陸域風電基地（本站紀錄 10,450 MW）；2011 年 2 月一次電纜頭故障讓 16 個風場、598 部風機脫網，併網成了下一個課題。',
      'The Jiuquan base in the Gansu Gobi, begun in 2009, became the world\'s largest onshore wind complex (10,450 MW in the site\'s records); in February 2011 one cable-terminal fault disconnected 598 turbines at 16 farms, making grid integration the next challenge.'],
    ['Donghai Bridge', '2010 年 6 月 8 日，上海東海大橋旁 34 部華銳 3 MW 機組全數併網（102 MW），中國第一座商業離岸風場。',
      'On 8 June 2010 all thirty-four Sinovel 3 MW turbines beside Shanghai\'s Donghai Bridge were connected (102 MW): China\'s first commercial offshore wind farm.'],
    ['Longyuan Rudong Intertidal 150 MW Demo', '江蘇如東的潮間帶：龍源 150 MW 示範風場 2012 年完工，混用華銳 3 MW、Siemens 2.38 MW 與金風 2.5 MW 三種機組。',
      'The Rudong tidal flats in Jiangsu: Longyuan\'s 150 MW intertidal demonstration farm was completed in 2012 with three turbine types, Sinovel 3 MW, Siemens 2.38 MW and Goldwind 2.5 MW.'],
    ['CTG Yangjiang Shapa Phase 1', '2021 年是中國離岸風電的搶裝年：離岸累計從 10.0 GW 增加到 26.4 GW，一年新增約 16.4 GW。廣東陽江沙扒一到五期（共 1.8 GW）都在這一年完工。',
      '2021 was China\'s offshore rush year: offshore capacity rose from 10.0 GW to 26.4 GW, about 16.4 GW in one year. All five Shapa phases off Yangjiang, Guangdong (1.8 GW together) were completed that year.'],
    ['Hinggan (Xing\'an) League base', '內蒙古興安盟 3,000 MW 陸域風電基地：中廣核稱 2023 年投入運作，當時是中國最大的營運中陸域風電基地。',
      'The 3,000 MW onshore base in Hinggan League, Inner Mongolia: CGN says it entered operation in 2023, then China\'s largest operating onshore wind base.'],
    ['CTG Zhangpu Liu\'ao Phase 2', '2024 年 6 月，福建漳浦六鰲二期全容量併網：28 部、400.2 MW，其中 6 部 16 MW，是第一個批量使用 16 MW 級機組的風場。',
      'In June 2024 Zhangpu Liu\'ao Phase 2 in Fujian reached full-capacity connection: 28 turbines and 400.2 MW, six of them 16 MW, the first farm to use 16 MW-class turbines in volume.'],
    ['CTG Yangjiang Qingzhou 6', '2024 年 12 月，廣東陽江青洲六全容量併網：74 部海上風機、1,000 MW 的深水離岸風場。',
      'In December 2024 Qingzhou 6 off Yangjiang, Guangdong, reached full-capacity connection: a 1,000 MW deep-water offshore farm with 74 turbines.'],
    ['Mingyang MySE 18.X-20 MW, Hainan', '明陽智能 18–20 MW 平台、260–292 m 葉輪，2024 年在海南安裝，當時是史上功率最大的風力機。',
      'Mingyang\'s 18–20 MW platform with a 260–292 m rotor, installed in Hainan in 2024, was the most powerful wind turbine ever built at the time.', 'ms'],
    ['Dongfang 26 MW offshore turbine, Fujian', '東方電氣 26 MW、310 m 葉輪的風機 2025 年安裝測試，單機容量突破 25 MW。2025 年底，中國風電累計 640.6 GW（離岸 48.4 GW），約占全球 1,288 GW 的一半（本站國家數列）。',
      'Dongfang Electric\'s 26 MW turbine with a 310 m rotor was installed for testing in 2025, taking a single turbine past 25 MW. At the end of 2025 China had 640.6 GW of wind power (48.4 GW offshore), about half of the world\'s 1,288 GW (the site\'s national series).', 'ms'],
  ] },
  fl: { region: 'WORLD', dwell: 11, stops: [
    ['Hywind Demo (Karmøy)', '2009 年，挪威 Karmøy 外海 220 m 水深的單柱浮筒上，Siemens 2.3 MW 成為全球第一部全尺寸浮動式風力機，證明浮動式風電技術可行。',
      'In 2009 a Siemens 2.3 MW turbine on a spar buoy in 220 m of water off Karmøy, Norway, became the world\'s first full-scale floating wind turbine, proving floating wind was technically feasible.', 'NOR'],
    ['WindFloat 1 (Aguçadoura demo)', '2011 年，葡萄牙 Aguçadoura 外海的 WindFloat 1：一部 Vestas V80 2 MW 裝在半潛式浮台上。',
      'In 2011 WindFloat 1 off Aguçadoura, Portugal, put a Vestas V80 2 MW turbine on a semi-submersible platform.', 'PRT'],
    ['Fukushima FORWARD floating demo', '日本福島外海的浮動式實證（2013 年起）：先後裝了日立 2 MW、三菱重工 7 MW、日立 5 MW 三部風機，現已除役。',
      'The floating demonstration off Fukushima, Japan (from 2013) installed a Hitachi 2 MW, an MHI 7 MW and a Hitachi 5 MW turbine in turn; it has since been decommissioned.', 'JPN'],
    ['Hywind Scotland', '2017 年 10 月，蘇格蘭 Peterhead 外海 5 部 6 MW 單柱式浮動風機開始發電：全球第一座商業浮動式風場。',
      'In October 2017 five 6 MW spar-type floating turbines off Peterhead, Scotland, started generating: the world\'s first commercial floating wind farm.', 'GBR'],
    ['Floatgen (SEM-REV)', '法國 SEM-REV 試驗場的 Floatgen（2018 年）：一部 Vestas V80 2 MW 裝在駁船式浮台上。',
      'Floatgen at France\'s SEM-REV test site (2018): a Vestas V80 2 MW turbine on a barge-type floater.', 'FRA'],
    ['WindFloat Atlantic', '2020 年，葡萄牙 WindFloat Atlantic：3 部 MHI Vestas V164-8.4 MW 裝在半潛式浮台上，共 25.2 MW。',
      'WindFloat Atlantic, Portugal, 2020: three MHI Vestas V164-8.4 MW turbines on semi-submersible floaters, 25.2 MW.', 'PRT'],
    ['Kincardine', '2021 年，蘇格蘭 Kincardine：5 部 MHI Vestas V164-9.5 MW 半潛式浮動風機，共 47.5 MW。',
      'Kincardine, Scotland, 2021: five MHI Vestas V164-9.5 MW turbines on semi-submersible floaters, 47.5 MW.', 'GBR'],
    ['Yangjiang Shapa \'Sanxia Yinling\' floating', '中國三峽「引領號」（2021 年）：明陽 5.5 MW 半潛式浮動風機，裝在廣東陽江的沙扒風場。',
      'China Three Gorges\' "Yinling" (2021): a Mingyang 5.5 MW turbine on a semi-submersible floater at the Shapa wind farm off Yangjiang, Guangdong.', 'CHN'],
    ['Hywind Tampen', '2023 年 8 月揭幕的 Hywind Tampen：11 部 8.6 MW 單柱式浮動風機、88 MW，直接供電給北海的油氣平台。',
      'Hywind Tampen, opened in August 2023: eleven 8.6 MW spar-type floating turbines and 88 MW, supplying offshore oil and gas platforms in the North Sea.', 'NOR'],
    ['Provence Grand Large', '法國 Provence Grand Large：3 部 8.4 MW 風機裝在張力腳式浮台上，2025 年 6 月全面商轉，是法國第一座浮動式風場。',
      'Provence Grand Large: three 8.4 MW turbines on tension-leg platforms, in full commercial operation from June 2025, France\'s first floating wind farm.', 'FRA'],
    ['Goto City Offshore floating project', '2026 年 1 月，長崎五島的浮動式風場開始營運：8 部日立 2.1 MW、16.8 MW，鋼與混凝土混合的單柱式浮體（浮體製造缺陷讓商轉從 2024 年延到 2026 年），是日本第一座商業浮動式風場。',
      'In January 2026 the floating farm off Goto, Nagasaki, started operating: eight Hitachi 2.1 MW turbines and 16.8 MW on hybrid steel-concrete spar floaters (floater defects pushed commercial operation from 2024 to 2026), Japan\'s first commercial floating wind farm.', 'JPN'],
  ] },
};
function storyStops(key) {
  const sd = STORIES[key], out = [];
  sd.stops.forEach(([name, zh, en, iso]) => {
    const why = lang === 'zh' ? zh : en;
    if (iso === 'ms') {
      const m = D.milestones.find(x => x.name === name);
      if (!m) { console.warn('story stop not found:', name); return; }
      out.push(Object.assign(msStop(m), { why, story: key })); return;
    }
    const f = D.farms.find(x => x.iso === (iso || sd.region) && x.name === name);
    if (!f) { console.warn('story stop not found:', name); return; }
    out.push({ kind: 'farm', f, name: f.name, zh: f.zh, lat: f.lat, lon: f.lon, year: f.year, type: f.type, iso: f.iso, why, story: key });
  });
  return out;
}
function tourMenu(show) {
  const m = $('g-tourMenu'); if (!m) return;
  if (show === undefined) show = m.hidden;
  if (show) m.innerHTML = '<button type="button" data-k="">' + esc(T('tourAuto')) + '</button>' +
    Object.keys(STORIES).map(k => '<button type="button" data-k="' + k + '" title="' + esc(T('tourStoryT')[k]) + '">★ ' + esc(T('tourStory')[k]) + '</button>').join('');
  m.hidden = !show;
  if (show) {                       // 工具列在手機上可橫向捲動（會裁掉下拉選單）：選單用固定定位、貼在按鈕下方
    const r = $('g-btnTour').getBoundingClientRect();
    m.style.top = Math.round(r.bottom + 4) + 'px';
    m.style.left = Math.round(Math.max(8, Math.min(r.left, innerWidth - m.offsetWidth - 8))) + 'px';
  }
  if (show) m.querySelectorAll('button').forEach(b => { b.onclick = () => { m.hidden = true; tourStart(b.dataset.k || null); }; });
}
function tourStart(story) {
  if (!farmsReady) { notice(T('farmsLoading'), 2000); pendingParams = Object.assign(pendingParams || {}, { tour: story || '1' }); return; }
  if (story && STORIES[story]) { setRegion(STORIES[story].region, true); if (!S.pipe) togglePipe(true); }
  const stops = story && STORIES[story] ? storyStops(story) : buildTourStops(S.region);
  if (!stops.length) return;
  TOUR = { stops, i: -1, phase: 'fly', t: 0, flyDur: 1, dwell: story && STORIES[story] ? STORIES[story].dwell : 9, paused: false, region: S.region, story: story || null, y0: S.year };
  setPlaying(false);
  host.classList.add('touring');
  $('g-btnTour').classList.add('active');
  tourShowStop(0);
}
function tourShowStop(i, keepYear) {
  if (!TOUR) return;
  if (i >= TOUR.stops.length) { tourEnd(true); return; }
  i = Math.max(0, i);
  TOUR.i = i; const st = TOUR.stops[i];
  TOUR.yFrom = S.year; TOUR.yTo = clamp(st.year + 0.75, Y0, Y1);
  if (keepYear) TOUR.yFrom = TOUR.yTo;
  focusFarm = st.farm || st.f || null;
  const tf = (st.farm && !st.farm.pseudo) ? st.farm : st;
  TOUR.flyDur = flyToLonLat(tf.lon, tf.lat, stopAlt(st)) || 1.5;
  TOUR.phase = 'fly'; TOUR.t = 0;
  renderCard(st.kind === 'ms' ? st : Object.assign(farmItem(st.f, st.why), { story: st.story || null }));
  tourPause(false);
  $('g-tourBar').querySelector('.cnt').textContent = (i + 1) + ' / ' + TOUR.stops.length;
}
function tourTick(dt) {
  if (TOUR.paused) return;
  TOUR.t += dt;
  const prog = $('g-tourBar').querySelector('.prog i');
  if (TOUR.phase === 'fly') {
    S.year = lerp(TOUR.yFrom, TOUR.yTo, easeIO(Math.min(1, TOUR.t / TOUR.flyDur))); syncYearUI();
    if (TOUR.t >= TOUR.flyDur) { TOUR.phase = 'dwell'; TOUR.t = 0; }
    prog.style.width = '0%';
  } else {
    prog.style.width = Math.min(100, TOUR.t / TOUR.dwell * 100) + '%';
    if (TOUR.t >= TOUR.dwell) tourShowStop(TOUR.i + 1);
  }
}
function tourPause(p) { if (!TOUR) return; TOUR.paused = p; $('g-tourBar').querySelector('.tp').textContent = p ? '▶' : '❚❚'; }
function tourEnd(finished) {
  const y0 = TOUR && TOUR.y0;
  TOUR = null; host.classList.remove('touring'); $('g-btnTour').classList.remove('active');
  if (y0 != null && !S.playing) { S.year = y0; syncYearUI(); farmLayerDirty = true; }   // 時間軸回到導覽前的年份（不然會停在最後一站，例如 1991 年）
  if (finished) { closeCard(); flyToRegion(false); notice(T('tourEnd'), 2500); }
  else if (cardItem) renderCard(cardItem);     // 中途離開導覽：卡片補上完整內容
}

/* ================= tooltip & picking ================= */
let tipPane = null, hoverKey = null, hoverTimer = null;
function tipCountry(c) {
  const on = valAt(c.on, S.year), off = valAt(c.off, S.year);
  return '<b>' + esc(cname(c)) + '</b> · ' + Math.floor(S.year) + '<br><i class="gsw" style="background:var(--on)"></i>' + T('onshore') + ' ' + fmtMW(on) + '<br><i class="gsw" style="background:var(--off)"></i>' + T('offshore') + ' ' + fmtMW(off) + '<br>' + T('total') + ' <b>' + fmtMW(on + off) + '</b>' +
    (atLT() ? '<br><span style="color:var(--ginkm)">' + esc(ltLine(c)) + '</span>' : '');
}
function liveTip(f) {
  const x = liveOn() && liveFor(f); if (!x) return '';
  return '<div class="tlive">● ' + T('liveNow') + ' <b>' + WW.num(x.mw, x.mw < 100 ? 1 : 0) + ' MW</b>' + (x.cap ? ' · ' + (x.mw / x.cap * 100).toFixed(0) + '%' : '') + '</div>';
}
function tipFarm(f, p) {
  const sp = turbSpec(f);
  const col = f.pipe ? 'var(--p' + f.st + ')' : 'var(--' + (f.type === 'onshore' ? 'on' : f.type === 'floating' ? 'fl' : 'off') + ')';
  const when = f.pipe ? T('st')[f.st] + (f.year ? ' · ' + T('expected') + ' ' + f.year : '') : (f.yu ? T('yearUnknown') : f.year + (f.end ? '–' + f.end : ''));
  return (p && p.src ? '<img class="tph" src="' + esc(p.src) + '" alt="">' : '') +
    '<b>' + esc(fname(f)) + '</b>' + (f.zh && lang === 'zh' ? '<br><span style="color:var(--ink-2)">' + esc(f.name) + '</span>' : '') +
    '<br><i class="gsw" style="background:' + col + '"></i>' + T('type')[f.type] + ' · ' + esc(String(when)) +
    '<br>' + T('totalCap') + ' <b>' + fmtMW(f.pipe ? f.mw : farmMwAt(f, S.year)) + '</b>' + (f.turbine ? '<br>' + esc(f.turbine) : (sp.n > 1 && !f.pseudo && !f.pipe ? ' · ' + (sp.real ? '' : '~') + sp.n + ' ' + T('units') : '')) + (f.owner ? '<br><span style="color:var(--ink-2)">' + esc(f.owner) + '</span>' : '') +
    (S.layer === 'fd' && !f.pipe && f.type !== 'onshore' ? '<br><i class="fdsw fd-' + fdGroup(f) + '"></i>' + esc(T('fdLabel') + L('：', ': ') + fdText(f)) : '') +
    (noteOf(f) ? '<div class="tnote">' + esc(noteOf(f).length > 140 ? noteOf(f).slice(0, 140) + '…' : noteOf(f)) + '</div>' : '') +
    (f.nStack ? '<div class="tnote">' + T('tipStack') + '</div>' : '') +
    liveTip(f) + '<div class="hint2">' + T('clickFarm') + '</div>';
}
function tipMs(m) { return '<b>★ ' + esc(m.name) + '</b><br>' + m.year + ' · ' + T('type')[m.type] + '<br><span style="color:var(--ink-2)">' + esc(lang === 'zh' ? m.zh : m.en) + '</span><div class="hint2">' + T('clickMore') + '</div>'; }
function showTip(ev, html, pane) { const tip = $('g-tip'); tip.style.display = 'block'; tip.innerHTML = html; if (tip.parentElement !== pane) pane.appendChild(tip); tipPane = pane; moveTip(ev, pane); }
function moveTip(ev, pane) {
  const tip = $('g-tip');
  const r = pane.getBoundingClientRect(); const tw = tip.offsetWidth || 200, th = tip.offsetHeight || 100;
  let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14; if (x + tw > r.width - 8) x = ev.clientX - r.left - tw - 14; if (y + th > r.height - 8) y = Math.max(8, ev.clientY - r.top - th - 10);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { $('g-tip').style.display = 'none'; hoverKey = null; }
const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2();
function visibleDeep(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
/* 風場層用螢幕座標挑選（上萬個 instance 做射線檢測太慢） */
function pickFarmScreen(ev) {
  const r = canvas.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
  let best = null, bd = 1e9;
  [FL.op, FL.pp].forEach(L2 => {
    for (let i = 0; i < L2.list.length; i++) {
      const h = L2.h[i]; if (h < 0.0003) continue;
      tmpW.copy(L2.pos[i]).applyMatrix4(surfaceRoot.matrixWorld);
      if (!facing(tmpW)) continue;
      const p = project(tmpW); if (p.z > 1) continue;
      // 以 ring 半徑換算成螢幕像素當命中範圍（至少 10px）
      _p3.copy(tmpW).addScaledVector(upAt(tmpW), h * surfaceRoot.scale.x * 0.8);
      const pt = project(_p3);
      const rad = Math.max(10, Math.hypot(pt.x - p.x, pt.y - p.y) * 0.9);
      const d = Math.min(Math.hypot(mx - p.x, my - p.y), Math.hypot(mx - pt.x, my - pt.y));
      if (d < rad && d < bd) { bd = d; best = L2.list[i]; }
    }
  });
  return best;
}
function pick(ev) {
  const r = canvas.getBoundingClientRect(); mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1; mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(mouse, camera);
  const objs = [];
  clusters.forEach(g => { if (g.userData.count > 0) objs.push(g.userData.tower, g.userData.nac, g.userData.rotor, g.userData.disc); });
  msMarkers.forEach(g => { if (g.visible) objs.push(g.userData.pin); });
  countryPicks.forEach(o => { if (visibleDeep(o) && o.userData.anchor.userData.dim > 0.5) objs.push(o); });
  const hit = ray.intersectObjects(objs, false)[0];
  if (hit) { const u = hit.object.userData; if (u.farm) return { farm: u.farm }; if (u.ms) return { ms: u.ms }; if (u.anchor) return { country: u.anchor.userData.c }; }
  const f = pickFarmScreen(ev); if (f) return { farm: f };
  return null;
}
function groundAt(ev) {
  const r = canvas.getBoundingClientRect(); mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1; mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(mouse, camera); const p = new THREE.Vector3();
  const ok = S.mode === 'globe' ? ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), R), p) : ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p);
  return ok ? xyzToLonLat(p) : null;
}

/* ================= year / view / misc controls ================= */
function syncYearUI() { if (S.flow) renderFlowLegend(); const sl = $('g-slider'); sl.value = S.year; sl.style.setProperty('--p', ((S.year - Y0) / (Y1 - Y0) * 100) + '%'); $('g-yearNow').textContent = Math.floor(S.year); renderMilestones(false); refreshCardYear(); if (panelTab === 'events') renderEventResults(); }
function setPlaying(p) { if (p && S.year >= Y1) S.year = Y0; if (p && TOUR) tourEnd(false); S.playing = p; $('g-play').textContent = p ? '❚❚' : '▶'; $('g-play').setAttribute('aria-label', p ? T('pause') : T('play')); if (!p) syncURL(); }
function setView(v) {
  if (!renderer) v = 'bars';
  S.view = v; const st = $('g-stage'); st.className = v === 'map' ? 'mapOnly' : v === 'bars' ? 'barOnly' : 'split';
  document.querySelectorAll('#g-viewSeg button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  setTimeout(() => { resize(); updateBars(true); }, 30);
  zonesVisible(); renderZoneLegend();
  syncURL();
}
/* ================= 此刻的風：NOAA GFS 離地 10 m 風場（公有領域，tools/fetch_gfs_wind.py → data/live/wind_now.png）畫成流動的粒子 =================
   粒子畫在一張等距圓柱的畫布上，當成半透明貼圖蓋在地球（或 2.5D 平面）上；每格依雙線性內插取 U、V，往風吹的方向移動，舊軌跡逐格淡出。 */
let FLOW = null;
function flowLoad() {
  if (FLOW && FLOW.p) return FLOW.p;
  FLOW = FLOW || {};
  const metaP = WW.standalone ? Promise.resolve(WW.standalone.json(WW.DATA.windNow)) : WW.getLiveJSON(WW.DATA.windNow);   // 單檔版：用建置當下內嵌的那一份，與內嵌的圖一致
  FLOW.p = metaP.then(meta => new Promise((ok, no) => {
    const img = new Image(); img.onload = () => ok([meta, img]); img.onerror = no;
    img.src = WW.standalone ? WW.asset(WW.DATA.windNowImg) : WW.DATA.windNowImg + '?v=' + encodeURIComponent(meta.run);
  })).then(([meta, img]) => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); const px = g.getImageData(0, 0, img.width, img.height).data;
    const n = img.width * img.height, U = new Float32Array(n), V = new Float32Array(n), k = meta.scale;
    for (let i = 0; i < n; i++) { U[i] = px[i * 4] * k + meta.min; V[i] = px[i * 4 + 1] * k + meta.min; }
    Object.assign(FLOW, { meta, U, V, w: img.width, h: img.height });
    flowSetup();
  });
  return FLOW.p;
}
function flowAt(lon, lat) {                          // 雙線性內插（m/s）；經度環繞
  const F = FLOW, x = (lon - F.meta.lon0) / F.meta.step, y = (F.meta.lat0 - lat) / F.meta.step;
  const x0 = Math.floor(x), y0 = Math.max(0, Math.min(F.h - 2, Math.floor(y))), fx = x - x0, fy = y - y0;
  const a = ((x0 % F.w) + F.w) % F.w, b = (a + 1) % F.w, i00 = y0 * F.w + a, i10 = y0 * F.w + b, i01 = i00 + F.w, i11 = i10 + F.w;
  const L = (A) => (A[i00] * (1 - fx) + A[i10] * fx) * (1 - fy) + (A[i01] * (1 - fx) + A[i11] * fx) * fy;
  return [L(F.U), L(F.V)];
}
function flowSetup() {
  const F = FLOW;
  F.cv = document.createElement('canvas'); F.cv.width = 2048; F.cv.height = 1024; F.g = F.cv.getContext('2d');
  F.tex = new THREE.CanvasTexture(F.cv); F.tex.generateMipmaps = false; F.tex.minFilter = THREE.LinearFilter;   // 不用 mipmap：畫布可以不是 2 的次方
  F.mat = new THREE.MeshBasicMaterial({ map: F.tex, transparent: true, depthWrite: false });
  F.lon = new Float32Array(9000); F.lat = new Float32Array(9000); F.age = new Float32Array(9000);
  F.win = null;
}
/* 視窗：拉遠時整個地球；拉近時只畫看得到的範圍（與高解析圖磚同一套算法、放大 1.6 倍留邊），畫布解析度才夠 */
function flowWindow(now) {
  const F = FLOW, flat = S.modeT > 0.5, alt = curAlt();
  let w;
  if (alt > (flat ? 160 : 110)) w = { lon0: -180, lat0: -90, lonSpan: 360, latSpan: 180, full: true };
  else {
    const fc = focusLonLat(), latSpan = clamp(alt * 0.6 * 6.5 * 1.15, 2, 120), lonSpan = Math.min(360, latSpan / Math.max(0.25, Math.cos(fc.lat * D2R)));
    w = { lon0: fc.lon - lonSpan / 2, lat0: clamp(fc.lat - latSpan / 2, -89.5, 89.5 - latSpan), lonSpan, latSpan, clon: fc.lon, clat: fc.lat };
  }
  const o = F.win;
  if (o && o.flat === flat && (w.full ? o.full : !o.full && Math.abs(w.clat - o.clat) < o.latSpan * 0.15 && Math.abs(w.clon - o.clon) < o.lonSpan * 0.15
      && w.latSpan / o.latSpan > 0.7 && w.latSpan / o.latSpan < 1.4)) return;
  if (o && now - (F.winT || 0) < 250) return;
  F.winT = now; w.flat = flat; F.win = w;
  let geo;
  if (!flat) geo = new THREE.SphereGeometry(R * 1.002, w.full ? 160 : 72, w.full ? 100 : 72, (w.lon0 + 180) * D2R, w.lonSpan * D2R, (90 - (w.lat0 + w.latSpan)) * D2R, w.latSpan * D2R);
  else { geo = new THREE.PlaneGeometry(w.lonSpan * FS, w.latSpan * FS); geo.rotateX(-Math.PI / 2); geo.translate((w.lon0 + w.lonSpan / 2) * FS, 0.03, -(w.lat0 + w.latSpan / 2) * FS); }
  if (!F.mesh) { F.mesh = new THREE.Mesh(geo, F.mat); F.mesh.renderOrder = 2; scene.add(F.mesh); } else { F.mesh.geometry.dispose(); F.mesh.geometry = geo; }
  F.n = w.full ? 9000 : 3500;
  const side = Math.min(2048, Math.round(innerHeight * Math.min(2, devicePixelRatio || 1) * 1.3 / 64) * 64);       // 拉近時用方形畫布（經緯跨度相近），大小約為畫面的 1.6 倍
  F.cv.width = w.full ? 2048 : side; F.cv.height = w.full ? 1024 : side;
  F.g = F.cv.getContext('2d'); F.g.clearRect(0, 0, F.cv.width, F.cv.height);
  for (let i = 0; i < F.n; i++) flowSpawn(i, true);
}
function flowSpawn(i, first) {                        // 依面積均勻撒在視窗裡（高緯度不擠在一起）
  const F = FLOW, w = F.win, s0 = Math.sin(Math.max(-85, w.lat0) * D2R), s1 = Math.sin(Math.min(85, w.lat0 + w.latSpan) * D2R);
  F.lon[i] = w.lon0 + Math.random() * w.lonSpan; F.lat[i] = Math.asin(s0 + Math.random() * (s1 - s0)) / D2R;
  F.age[i] = first ? Math.random() * 170 : 0;
}
function flowVisible() {
  if (!FLOW || !FLOW.mesh) return;
  FLOW.mesh.visible = !!S.flow && !modeAnim;
}
function flowTick(dt, now) {
  const F = FLOW; if (!S.flow || !F || !F.g) return;
  flowWindow(now); flowVisible();
  if (modeAnim) return;
  const g = F.g, w = F.win, CW = F.cv.width, CH = F.cv.height, sx = CW / w.lonSpan, sy = CH / w.latSpan, top = w.lat0 + w.latSpan;
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = 'rgba(0,0,0,0.88)'; g.fillRect(0, 0, CW, CH);   // 舊軌跡淡出
  g.globalCompositeOperation = 'source-over'; g.lineWidth = w.full ? 0.8 : 1.0; g.lineCap = 'round';
  const step = 0.006 * Math.min(4, dt * 60) * (w.full ? clamp(curAlt() / 110, 1, 3) : clamp(w.latSpan / 60, 0.08, 1));   // 示意速度：畫面上看起來的速度大致固定   // 示意速度：拉近時放慢，畫面上的速度大致一樣
  const BANDS = S.base === 'sat'                    // 衛星底圖有白色雲雪：改用帶藍紫的顏色才看得出來
    ? [[3, 'rgba(150,170,255,0.45)'], [7, 'rgba(165,185,255,0.7)'], [12, 'rgba(190,205,255,0.85)'], [99, 'rgba(215,225,255,0.95)']]
    : [[3, 'rgba(225,225,245,0.35)'], [7, 'rgba(235,235,250,0.6)'], [12, 'rgba(245,245,255,0.8)'], [99, 'rgba(255,255,255,0.95)']];
  const paths = BANDS.map(() => []);
  const X = lon => { let d = (lon - w.lon0) % 360; if (d < 0) d += 360; return d * sx; };
  for (let i = 0; i < F.n; i++) {
    if ((F.age[i] += 2) > 180) { flowSpawn(i); continue; }
    const lo = F.lon[i], la = F.lat[i], [u, v] = flowAt(lo, la), sp = Math.hypot(u, v);
    let nlo = lo + u * step / Math.max(0.2, Math.cos(la * D2R)), nla = la + v * step;
    if (nla > 85 || nla < -85 || nla < w.lat0 || nla > top) { flowSpawn(i); continue; }
    if (nlo > 180) nlo -= 360; else if (nlo < -180) nlo += 360;
    F.lon[i] = nlo; F.lat[i] = nla;
    const x0 = X(lo), x1 = X(nlo);
    if (Math.abs(x1 - x0) > CW / 2) continue;   // 跨過畫布邊緣（換日線）：這一格不畫
    if (!w.full && x1 > CW) { flowSpawn(i); continue; }
    let b = 0; while (sp > BANDS[b][0]) b++;
    paths[b].push(x0, (top - la) * sy, x1, (top - nla) * sy);
  }
  paths.forEach((p, b) => { g.strokeStyle = BANDS[b][1]; g.beginPath(); for (let k = 0; k < p.length; k += 4) { g.moveTo(p[k], p[k + 1]); g.lineTo(p[k + 2], p[k + 3]); } g.stroke(); });
  F.tex.needsUpdate = true;
}
function renderFlowLegend() {
  const el = $('g-flowLegend'); if (!el) return;
  if (!S.flow || !FLOW || !FLOW.meta) { el.hidden = true; return; }
  const d = new Date(FLOW.meta.run.replace('Z', ':00Z')), tw = new Date(d.getTime() + 8 * 3600e3);
  const when = (tw.getUTCMonth() + 1) + '/' + tw.getUTCDate() + ' ' + String(tw.getUTCHours()).padStart(2, '0') + ':00';
  const sw = [['<3', 0.35], ['3–7', 0.6], ['7–12', 0.8], ['≥12', 0.95]];
  el.innerHTML = '<div class="wlh"><b>' + esc(T('flowLegT')) + '</b> · ' + esc(T('flowLegSub')) + '</div><div class="wlbar">' +
    sw.map(([l, a]) => '<span><i style="background:rgba(240,240,255,' + a + ')"></i><em>' + l + ' m/s</em></span>').join('') + '</div>' +
    '<div class="wln">' + esc(T('flowTime')(when)) + ' · <a href="' + esc(FLOW.meta.url) + '" target="_blank" rel="noopener">' + esc(T('flowSrc')) + '</a></div>' +
    (Math.floor(S.year) < Y1 ? '<div class="wln fly">' + esc(T('flowYearNote')(Math.floor(S.year))) + '</div>' : '');
  el.classList.toggle('below', S.base === 'wind');
  el.hidden = false;
}
function toggleFlow(on) {
  S.flow = on != null ? on : !S.flow;
  const b = $('g-btnFlow'); b.classList.toggle('active', S.flow); b.setAttribute('aria-pressed', S.flow ? 'true' : 'false');
  updateAttr();
  if (S.flow) flowLoad().then(() => { flowVisible(); renderFlowLegend(); })
    .catch(e => { console.error(e); FLOW = null; notice(L('此刻的風載入失敗（離線或資料暫時無法取得）', 'Wind now failed to load (offline or data unavailable)')); S.flow = false; b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  else { flowVisible(); renderFlowLegend(); }
  syncURL();
}
/* ================= 海域圖層：專屬經濟區界線（Marine Regions）＋台灣離岸風電潛力場址（能源署）=================
   tools/build_offshore_zones.py → data/global/offshore_zones.json。線跟國界一樣畫成球面、平面兩份，依投影切換，並跟國界一起抬高；
   預設關閉，網址 zones=1。單檔公開版不提供。顏色依 dataviz 色盲檢查：界線藍、潛力場址玫瑰紅（另有編號標籤）。 */
let ZONES = null, zonesP = null, ZONE_G = null;
const ZONE_HEX = { eez: 0x3a9fd8, site: 0xd06a9a };
function zonesLoad() {
  if (!zonesP) zonesP = WW.getJSON(WW.DATA.zones).then(j => { ZONES = j; buildZones(); }).catch(e => { zonesP = null; throw e; });
  return zonesP;
}
function zoneLines(flat, rings, color, opacity, dash) {
  const pts = [], a = new THREE.Vector3(), b = new THREE.Vector3(), P = flat ? flatPos : globePos;
  rings.forEach(r => { for (let i = 0; i < r.length - 2; i += 2) { P(r[i], r[i + 1], 0, a); P(r[i + 2], r[i + 3], 0, b); pts.push(a.x, a.y, a.z, b.x, b.y, b.z); } });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = dash ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.3, gapSize: 0.22 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const m = new THREE.LineSegments(geo, mat); if (dash) m.computeLineDistances(); m.renderOrder = 4;
  return m;
}
function buildZones() {
  const groups = [[], [], []]; ZONES.eez.forEach(([g, r]) => groups[g].push(r));
  const sites = [], close = p => p.concat(p.slice(0, 2));      // 補上閉合的最後一段
  ZONES.tw.forEach(t => t.polys.forEach(p => sites.push(close(p))));
  (ZONES.areas || []).forEach(a => a.polys.forEach(p => sites.push(a.open ? p : close(p))));     // open：以陸岸為界，只畫公告的連線
  const make = flat => { const g = new THREE.Group();
    g.add(zoneLines(flat, groups[0], ZONE_HEX.eez, 0.85), zoneLines(flat, groups[1], ZONE_HEX.eez, 0.45), zoneLines(flat, groups[2], ZONE_HEX.eez, 0.9, true),
      zoneLines(flat, sites, ZONE_HEX.site, 0.95));
    return g; };
  ZONE_G = { g: make(false), f: make(true) }; scene.add(ZONE_G.g, ZONE_G.f);
  const ctr = t => { const p = t.polys[0]; let x = 0, y = 0; for (let i = 0; i < p.length; i += 2) { x += p[i]; y += p[i + 1]; } t._c = [x / (p.length / 2), y / (p.length / 2)]; };
  ZONES.tw.forEach(ctr); (ZONES.areas || []).forEach(ctr);
  zonesVisible();
}
function zonesVisible() {
  if (!ZONE_G) return;
  const flat = S.modeT > 0.5, on = !!S.zones && S.view !== 'bars';
  ZONE_G.g.visible = on && !flat; ZONE_G.f.visible = on && flat;
}
/* 拉近到台灣附近時，潛力場址標出編號與名稱（跟其他標籤一起排版，數量依「標籤」設定） */
function zoneLabels(alt, cands) {
  if (!S.zones || !ZONES || S.view === 'bars' || TOUR || alt > 20) return;
  ZONES.tw.forEach(t => {
    const pos = posAt(t._c[0], t._c[1], 0, new THREE.Vector3()).applyMatrix4(surfaceRoot.matrixWorld);
    cands.push({ cat: 'z', pri: 3e7 + t.area * 1e3, pos, name: T('zSite') + ' #' + t.n, val: (lang === 'zh' ? t.zh : t.en) + ' · ' + t.area + ' km²', cls: 'zone', key: 'z' + t.n });
  });
  (ZONES.areas || []).forEach((a, i) => {
    const pos = posAt(a._c[0], a._c[1], 0, new THREE.Vector3()).applyMatrix4(surfaceRoot.matrixWorld);
    cands.push({ cat: 'z', pri: 3e7 + a.km2 * 1e3, pos, name: lang === 'en' && a.en ? a.en : a.n, val: (byIso[a.c] ? cname(byIso[a.c]) : a.c) + ' · ' + T('zArea') + ' · ' + Math.round(a.km2).toLocaleString() + ' km²', cls: 'zone', key: 'za' + i });
  });
}
function renderZoneLegend() {
  const el = $('g-zoneLegend'); if (!el) return;
  if (!S.zones || !ZONES || S.view === 'bars') { el.hidden = true; return; }
  const sw = (cls, txt) => '<div class="zl"><i class="' + cls + '"></i><span>' + esc(txt) + '</span></div>';
  el.innerHTML = '<div class="wlh"><b>' + esc(T('zoneLegT')) + '</b></div>' + sw('za', T('zEezA')) + sw('zm', T('zEezM')) + sw('zu', T('zEezU')) + sw('zs', T('zSites')) +
    '<div class="wln zn">' + esc(T('zNote')) + (ZONES.meta.tw.skipped.length ? L('；', '; ') + esc(T('zSkip')) : '') + L('。', '.') +
      (ZONES.meta.areas ? ' ' + esc(T('zAreaSrc')) + Object.keys(ZONES.meta.areas).map(c => { const m = ZONES.meta.areas[c];
        return '<a href="' + esc(m.page) + '" target="_blank" rel="noopener">' + esc((byIso[c] ? cname(byIso[c]) : c) + ' ' + m.by) + '</a>' + L('（', ' (') + esc(m.lic) + L('）', ')'); }).join(L('、', ', ')) + L('。', '.') : '') + '</div>' +
    '<div class="wln"><a href="' + esc(ZONES.meta.eez.url) + '" target="_blank" rel="noopener">' + esc(T('zSrcE')) + '</a> · <a href="' + esc(ZONES.meta.tw.url) + '" target="_blank" rel="noopener">' + esc(T('zSrcT')) + '</a>' +
      (ZONES.meta.areas ? ' · ' + esc(T('zSrcA')) : '') + '</div>';
  el.onclick = e => { if (e.target.tagName !== 'A') el.classList.toggle('open'); };   // 手機上說明預設收起，點一下展開
  el.hidden = false;
}
/* 「資料來源」視窗裡各國離岸風電規劃區的出處（與 tools/build_offshore_zones.py 的 AREA_SOURCES 一致） */
const ZONE_AREA_SRC = [
  ['JPN', 'https://www.enecho.meti.go.jp/category/saving_and_new/saiene/yojo_furyoku/kassei_sangyou.html', '出典：資源エネルギー庁ウェブサイトの促進区域指定の公告を加工して作成', 'PDL1.0', '再生能源海域利用法的促進區域（13 處，點位取自各區指定的公告）；以「點位連線與陸岸」為界的 10 處只畫公告的連線、不自行補海岸線，公告面積不含港區、漁港與海岸保全區', 'promotion zones under the Act on Promoting the Utilization of Sea Areas (13, points from each designation notice); the 10 zones bounded by "the lines through the points and the shore" are drawn as the published lines only, without a self-made coastline, and published areas exclude port, fishery port and coastal protection areas'],
  ['NLD', 'https://data.overheid.nl/en/dataset/46780-aangewezen-windgebieden-nwp', 'Rijkswaterstaat, Aangewezen windgebieden (Programma Noordzee 2022–2027)', 'CC0 1.0', '已指定的離岸風電區', 'designated wind energy areas'],
  ['DEU', 'https://gdi.bsh.de/en/mapservice/Site-Development-Plan-in-the-German-Maritime-Area-2025-WFS', 'Quelle: © BSH 2025 (Flächenentwicklungsplan 2025), vereinfacht', 'GeoNutzV', '離岸風電區域發展計畫（FEP 2025）的區域，只限專屬經濟區、不含審查中的區域', 'areas of the Site Development Plan (FEP 2025), EEZ only, areas under review left out'],
  ['BEL', 'https://doi.org/10.24417/bmdc.be:dataset:3121', 'RBINS, Belgian Marine Data Centre: 2026 Belgian MSP – Energy, cable and pipeline zones (doi:10.24417/bmdc.be:dataset:3121)', 'CC BY 4.0', '海洋空間計畫 2026–2034 的再生能源區（含伊莉莎白公主區）', 'renewable energy zones of the 2026–2034 marine spatial plan (including the Princess Elisabeth Zone)'],
  ['DNK', 'https://havplan.dk/', 'Søfartsstyrelsen (Danish Maritime Authority), Danmarks Havplan af 28. juni 2024', 'CC BY 4.0', '海洋空間計畫的再生能源發展區（Ev）與能源島區（Ei），只有編號沒有名稱', 'renewable energy (Ev) and energy island (Ei) development zones of the maritime spatial plan, numbered only'],
  ['GBR', 'https://www.arcgis.com/home/item.html?id=b9c7d514362f40ceb3fe299b47aeb8b3', 'Contains public sector information licensed under the Open Government Licence v3.0, from Crown Estate Scotland', 'OGL v3.0', '只有蘇格蘭（各風場的海床租約與選擇權範圍，不是計畫層級的區域）；英格蘭、威爾斯與北愛爾蘭的 The Crown Estate 資料授權另有限制，不收錄', 'Scotland only (seabed lease and option areas of individual projects, not plan-level zones); England, Wales and Northern Ireland (The Crown Estate) are not included because its licence adds restrictions'],
  ['NOR', 'https://kart.nve.no/enterprise/rest/services/Mapservices/HavvindOnline/MapServer', 'Contains data under the Norwegian licence for Open Government data (NLOD) distributed by NVE', 'NLOD 2.0', '已開放申請的離岸風電區（Utsira Nord、Sørlige Nordsjø II）', 'areas opened for offshore wind (Utsira Nord, Sørlige Nordsjø II)'],
];
function zoneAreaSources(zh) {
  return '<li>' + (zh ? '離岸風電規劃區（粉紅色外框，與台灣潛力場址同色）：各國官方開放圖層，只留風電區、簡化到約 200 m 供地圖顯示：' : 'Offshore wind areas (pink outlines, like Taiwan\'s potential sites): official open layers of each country, wind areas only, simplified to about 200 m for display: ') +
    '<ul>' + ZONE_AREA_SRC.map(([c, url, credit, lic, z, e]) => '<li>' + esc(byIso[c] ? cname(byIso[c]) : c) + (zh ? '：' + z + '。' : ': ' + e + '. ') +
      '<a href="' + url + '" target="_blank" rel="noopener">' + esc(credit) + '</a>' + (zh ? '（' + lic + '）' : ' (' + lic + ')') + '</li>').join('') + '</ul></li>';
}
function toggleZones(on) {
  S.zones = on != null ? on : !S.zones;
  const b = $('g-btnZones'); b.classList.toggle('active', S.zones); b.setAttribute('aria-pressed', S.zones ? 'true' : 'false');
  updateAttr();
  if (S.zones) zonesLoad().then(() => { zonesVisible(); renderZoneLegend(); })
    .catch(e => { console.error(e); notice(T('zErr')); S.zones = false; b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); updateAttr(); });
  else { zonesVisible(); renderZoneLegend(); }
  syncURL();
}
function togglePipe(on) {
  S.pipe = on != null ? on : !S.pipe; WW.store.set('ww_globe_pipe', S.pipe ? '1' : '0');
  const b = $('g-btnPipe'); b.classList.toggle('active', S.pipe); b.setAttribute('aria-pressed', S.pipe ? 'true' : 'false');
  farmLayerDirty = true; hudCache = ''; updateClusters(0, true);
  if (S.pipe && S.year < Y1 - 0.02 && !S.playing) notice(T('pipeNote'), 3500);
  renderFarmResults(true); renderPipeList(true);
}
function applyI18n() {
  host.querySelectorAll('[data-gi]').forEach(el => { const v = T(el.dataset.gi); if (typeof v === 'string') el.textContent = v; });
  host.querySelector('.gtitle').innerHTML = esc(T('title')) + '<small>' + Y0 + '–' + Y1 + '</small>';
  document.querySelectorAll('#g-speedSel option').forEach(o => { const v = parseFloat(o.value); o.textContent = v < 1 ? (lang === 'zh' ? '1 年 ' + Math.round(1 / v) + ' 秒' : Math.round(1 / v) + ' s / yr') : (lang === 'zh' ? v + ' 年/秒' : v + ' yr/s'); });
  document.querySelectorAll('#g-densSel option').forEach(o => { o.textContent = T('dens')[+o.value]; });
  $('g-hint').textContent = isTouch ? T('hintTouch') : T('hint');
  buildRegionSelect();
  hudCache = ''; msRendered = -1; renderMilestones(true); renderFarmList(true); renderProfile(); renderPipeList(true); renderPortList(); renderEventList(true); updateAttr();
  $('g-btnSearch').title = T('fsKey');
  $('g-pipeLegend').hidden = true;      // 下一個 HUD 更新時依新語言重畫圖例
  renderWindLegend(); renderZoneLegend();
  renderOutput();
  labelPool.forEach(l => { l._key = null; });          // 地圖標籤依語言重畫
  Object.keys(rowEls).forEach(k => { rowEls[k].querySelector('.nm span').textContent = cname(byIso[k]); });
}
/* 資料統計：從已載入的資料即時計算，不寫死數字（資料來源視窗用） */
function dataStats(zh) {
  const n = v => WW.int(v), li = [];
  if (D && D.countries && D.years) li.push(zh ? '國家年度統計：' + n(D.countries.length) + ' 國，' + D.years[0] + '–' + D.years[D.years.length - 1] + ' 年，陸域與離岸分開'
                                           : 'Country statistics: ' + n(D.countries.length) + ' countries, ' + D.years[0] + '–' + D.years[D.years.length - 1] + ', onshore and offshore separately');
  if (LT) li.push(zh ? LT.year + ' 年（最新可得）：' + n(LT.n) + ' 國有今年官方數字（' + C.filter(c => c.lt).map(c => cname(c) + ' ' + c.lt.asof).join('、') + '），其他國家沿用 ' + DATA_Y + ' 年底'
                     : LT.year + ' (latest available): official figures for ' + n(LT.n) + ' countries (' + C.filter(c => c.lt).map(c => cname(c) + ' ' + c.lt.asof).join(', ') + '); the rest carry end-' + DATA_Y);
  if (TB) li.push(zh ? '每部風機的位置與規格：美國 ' + n(TB.meta.farms) + ' 座風場、' + n(TB.meta.turbines) + ' 部（USWTDB ' + (TB.meta.version || '') + '）' : 'Turbine positions and specs: ' + n(TB.meta.turbines) + ' turbines in ' + n(TB.meta.farms) + ' US farms (USWTDB ' + (TB.meta.version || '') + ')');
  if (GEN) li.push(zh ? '實際年發電量：美國 ' + n(GEN.meta.by_iso.USA || 0) + ' 座風場（EIA-923）、台灣 ' + n(GEN.meta.by_iso.TWN || 0) + ' 座台電風場（台電開放資料）、澳洲 ' + n(GEN.meta.by_iso.AUS || 0) + ' 座風場（AEMO）、丹麥 ' + n(GEN.meta.by_iso.DNK || 0) + ' 座風場（丹麥能源署）'
    : 'Actual yearly output: ' + n(GEN.meta.by_iso.USA || 0) + ' US farms (EIA-923), ' + n(GEN.meta.by_iso.TWN || 0) + ' Taipower farms in Taiwan (Taipower open data), ' + n(GEN.meta.by_iso.AUS || 0) + ' Australian farms (AEMO) and ' + n(GEN.meta.by_iso.DNK || 0) + ' Danish farms (Danish Energy Agency)');
  if (TBD) li.push(zh ? '德國每部風機的位置與規格：' + n(TBD.meta.farms) + ' 座風場、' + n(TBD.meta.turbines) + ' 部（MaStR）' : 'German turbine positions and specs: ' + n(TBD.meta.turbines) + ' turbines in ' + n(TBD.meta.farms) + ' farms (MaStR)');
  if (TBO) li.push(zh ? '其他國家的風機位置：' + n(TBO.meta.farms) + ' 座風場、' + n(TBO.meta.turbines) + ' 部（© OpenStreetMap 貢獻者，ODbL）' : 'Turbine positions elsewhere: ' + n(TBO.meta.turbines) + ' turbines in ' + n(TBO.meta.farms) + ' farms (© OpenStreetMap contributors, ODbL)');
  if (farmsReady && D.farms) {
    const F = D.farms, isos = new Set(F.map(f => f.iso)), op = F.filter(f => f.st === 0 && !f.end);
    const c = (arr, fn) => arr.filter(fn).length, mw = arr => n(Math.round(arr.reduce((a, f) => a + (f.mw || 0), 0)));
    li.push(zh ? '風場逐筆資料：' + n(F.length) + ' 座、' + n(isos.size) + ' 國——營運中 ' + n(op.length) + ' 座（陸域 ' + n(c(op, f => f.type === 'onshore')) + '、離岸 ' + n(c(op, f => f.type === 'offshore')) + '、浮動式 ' + n(c(op, f => f.type === 'floating')) + '，合計 ' + mw(op) + ' MW）、興建中 ' + n(c(F, f => f.st === 1)) + '、前期開發與已宣布 ' + n(c(F, f => f.st === 2 || f.st === 3)) + '、已除役 ' + n(c(F, f => f.st === 4 || f.end))
               : 'Farm-level records: ' + n(F.length) + ' farms in ' + n(isos.size) + ' countries — ' + n(op.length) + ' operating (' + n(c(op, f => f.type === 'onshore')) + ' onshore, ' + n(c(op, f => f.type === 'offshore')) + ' offshore, ' + n(c(op, f => f.type === 'floating')) + ' floating; ' + mw(op) + ' MW), ' + n(c(F, f => f.st === 1)) + ' under construction, ' + n(c(F, f => f.st === 2 || f.st === 3)) + ' in pre-construction or announced, ' + n(c(F, f => f.st === 4 || f.end)) + ' retired');
    if (FD && FD.farms) {
      const off = op.filter(f => f.type !== 'onshore'), known = off.filter(f => FD.farms[f.name]);
      li.push(zh ? '水下基礎型式：' + n(Object.keys(FD.farms).length) + ' 座離岸風場已查明（營運中離岸風場 ' + n(off.length) + ' 座中 ' + n(known.length) + ' 座，占容量 ' + Math.round(100 * known.reduce((a, f) => a + (f.mw || 0), 0) / Math.max(1, off.reduce((a, f) => a + (f.mw || 0), 0))) + '%；' + n(Object.values(FD.farms).filter(x => x.d || x.h || x.r).length) + ' 座另有水深、輪轂高度或葉輪直徑）'
                 : 'Foundation types: ' + n(Object.keys(FD.farms).length) + ' offshore farms classified (' + n(known.length) + ' of the ' + n(off.length) + ' operating offshore farms, ' + Math.round(100 * known.reduce((a, f) => a + (f.mw || 0), 0) / Math.max(1, off.reduce((a, f) => a + (f.mw || 0), 0))) + '% of their capacity; ' + n(Object.values(FD.farms).filter(x => x.d || x.h || x.r).length) + ' of them also carry water depth, hub height or rotor diameter)');
    }
  }
  if (!LITE && PORTS.length) li.push(zh ? '離岸風電港口：' + n(PORTS.length) + ' 座、' + n(new Set(PORTS.map(p => p.iso)).size) + ' 國，' + n(PORTS.reduce((a, p) => a + (p.farms || []).length, 0)) + ' 條「服務過的風場」連結，每港附出處'
                                       : 'Offshore wind ports: ' + n(PORTS.length) + ' ports in ' + n(new Set(PORTS.map(p => p.iso)).size) + ' countries with ' + n(PORTS.reduce((a, p) => a + (p.farms || []).length, 0)) + ' farm links, each port sourced');
  if (EVENTS.length) li.push(zh ? '重大事件與事故：' + n(EVENTS.length) + ' 筆，每筆附主管機關、業者或媒體出處'
                                : 'Major events and incidents: ' + n(EVENTS.length) + ' entries, each with a regulator, operator or press source');
  if (!LITE) li.push(zh ? '即時出力：台灣台電逐機組（每 10 分鐘，另存歷史存檔）；澳洲 AEMO、亞伯達 AESO、安大略 IESO 三個電網的逐機組與電網總量'
                        : 'Live output: Taipower unit by unit (every 10 minutes, with a history archive); unit-level and grid totals from AEMO (Australia), AESO (Alberta) and IESO (Ontario)');
  if (!li.length) return '';
  return '<h4>' + (zh ? '資料統計（依目前載入的資料即時計算）' : 'Data inventory (computed from the data now loaded)') + '</h4><ul><li>' + li.join('</li><li>') + '</li></ul>';
}

function showSources() {
  if (!GEN) {                                                       // 發電量資料（筆數、丹麥能源署的取用月份）還沒載入：載入後若視窗仍開著就重畫
    needGen();
    if (genP) genP.then(() => { if (GEN && $('g-modal').classList.contains('show') && $('g-modalBody').querySelector('.gsrcs')) showSources(); });
  }
  const src = D.sources, n = D.notes;
  const li = arr => (arr || []).map(s => '<li>' + (/^https?:/.test(s) ? '<a href="' + esc(s.split(' ')[0]) + '" target="_blank" rel="noopener">' + esc(s) + '</a>' : esc(s)) + '</li>').join('');
  const zh = lang === 'zh';
  $('g-modal').querySelector('.box').classList.remove('wide');
  $('g-modalBody').innerHTML = '<h2 class="gsrcs">' + T('srcTitle') + '</h2>' +
    (zh ? '<p>地圖顯示各國<b>年底累計裝置容量</b>（MW），陸域與離岸分開統計，離岸含潮間帶／近岸（GWEC 口徑）。國家層級的風機高度以容量的 0.4 次方縮放；選擇單一國家或放大時改以風場為單位，每座風場以一支風機代表；點選某座風場時，才依它的機組數量與間距畫出全部風機（機組位置為示意排列，非實際座標）。虛線環為規劃中專案（越亮越接近完工；「規劃」分頁有逐案清單與 GEM 2026-02 各國總量，點選專案時以半透明風機顯示預定配置）。台灣與日本的國家數字採官方統計（能源署、JWPA），兩國風場另經逐場稽核。1980–1999 年多數國家的逐年數字為估計值，僅供趨勢觀察。風場照片優先用人工核對過的 Wikimedia Commons 照片（tools/farm_photos.py，逐張看過、出自該風場的 Commons 分類，卡片寫出作者與授權）；沒有的話才用維基百科條目圖片，而且要在 Commons 上屬於風電相關分類才顯示。簡介於瀏覽時即時查詢維基百科，離線時照片與簡介都不會顯示。</p>'
        : '<p>The map shows <b>year-end cumulative installed capacity</b> per country (MW), onshore and offshore separately (offshore includes intertidal/nearshore, GWEC convention). Country turbine height scales with capacity^0.4; with a country selected or when zoomed in the map switches to individual farms, each shown as a single turbine; clicking a farm draws all of its turbines from its unit count and spacing (schematic layout). Dashed rings are pipeline projects (brighter = closer to completion; the Pipeline tab lists them with GEM’s February 2026 country totals, and clicking a project shows its planned layout as translucent turbines). Taiwan’s and Japan’s national figures come from official statistics (Energy Administration, JWPA), and their farms were audited one by one. Most 1980–1999 country series are estimates. Farm photos come first from hand-checked Wikimedia Commons photos (tools/farm_photos.py: each looked at, taken from the farm\'s own Commons category, with author and licence on the card); otherwise a Wikipedia article image is used only if Commons files it under a wind-power category. Summaries are looked up live from Wikipedia; offline, neither is shown.</p>') +
    dataStats(zh) +
    '<h4>' + (zh ? '本站修正' : 'Corrections by this site') + '</h4><ul>' + li((D.meta && D.meta.edits) || []) +
    '<li>' + (zh ? '2026 年 9 月逐筆查證：刪除重複、從未建成或查無此場的風場紀錄，修正座標、容量、年份、分期或狀態；共用省或國家中心代用座標的風場在地圖上示意排開（卡片註明「位置示意」）。逐筆理由見'
      : 'Checked record by record in Sep 2026: duplicate, never-built or non-existent farm records were removed and locations, capacities, years, phases or statuses fixed; farms sharing a province or country centre as a placeholder are fanned out on the map (their cards say the position is schematic). Every record is in the') +
    ' <a href="https://github.com/dofliu/windfarmTaiwan/blob/main/docs/data-cleanup' + (zh ? '' : '.en') + '.md" target="_blank" rel="noopener">' + (zh ? '資料清理紀錄' : 'clean-up log') + '</a>' + (zh ? '。' : '.') + '</li><li>' + (zh ? '國界改以 Natural Earth 1:50m 重建（原資料缺澳洲本土；克里米亞依聯合國大會第 68/262 號決議劃歸烏克蘭）；風場與 GEM 全球風電追蹤（2025-02，CC BY 4.0）合併並加入規劃中專案；GEM 同一場址相距 25 km 以上的分期分開標示，3 筆明顯的座標錯誤已修正。' : 'Borders rebuilt from Natural Earth 1:50m (the original lacked mainland Australia; Crimea shown as part of Ukraine per UN GA resolution 68/262); farms merged with the GEM Global Wind Power Tracker (Feb 2025, CC BY 4.0), adding pipeline projects; GEM phases more than 25 km apart are shown separately and three obvious coordinate errors were corrected.') + '</li></ul>' +
    '<h4>' + (zh ? '總容量 2000–2025' : 'Total capacity 2000–2025') + '</h4><ul><li>Our World in Data — Installed wind energy capacity (IRENA Renewable Capacity Statistics): <a href="https://ourworldindata.org/grapher/cumulative-installed-wind-energy-capacity-gigawatts" target="_blank" rel="noopener">ourworldindata.org</a></li></ul>' +
    '<h4>' + (zh ? '離岸容量 1991–2025' : 'Offshore capacity 1991–2025') + '</h4><ul>' + li(src.offshore) + '</ul>' +
    (LT ? '<h4>' + LT.year + (zh ? ' 年（最新可得）' : ' (latest available)') + '</h4><ul>' + C.filter(c => c.lt).map(c => '<li>' + esc(cname(c)) + (zh ? '（截至 ' : ' (as of ') + esc(c.lt.asof) + (zh ? '）：' : '): ') + '<a href="' + esc(c.lt.url) + '" target="_blank" rel="noopener">' + esc(c.lt.src[zh ? 0 : 1]) + '</a>' + (c.lt.est ? esc(zh ? '；本站 ' + DATA_Y + ' 年底數字＋該來源今年的增量（估計）' : '; the site\'s end-' + DATA_Y + ' figure + this source\'s growth this year (estimate)') : '') + '</li>').join('') +
      '<li>' + esc(zh ? '其他國家沿用 ' + DATA_Y + ' 年底數字（長條圖以斜線標示）。數字與出處寫在 tools/latest_wind.py。' : 'Other countries carry their end-' + DATA_Y + ' figure (hatched bars). Figures and sources are in tools/latest_wind.py.') + '</li></ul>' : '') +
    '<h4>' + (zh ? '風場卡片的實際年發電量' : 'Actual yearly output on farm cards') + '</h4><ul><li><a href="https://www.eia.gov/electricity/data/eia923/" target="_blank" rel="noopener">U.S. Energy Information Administration, Form EIA-923</a>' + (zh ? '（各電廠逐月淨發電量，公有領域）：依 USWTDB 每部風機的 EIA 電廠代碼接到本站的美國風場；電廠跨好幾座風場的不用，只列所有機組全年運轉的年份；容量因數以 EIA-860M 登記的裝置容量計，USWTDB 與 EIA 的容量相差 10% 以上（風場與電廠對不乾淨）的不用（tools/build_generation.py）。' : ' (monthly net generation by plant, public domain): linked to the site\'s US farms through the EIA plant code USWTDB gives each turbine; plants spread over several farms are left out, only years with every turbine in service all year are shown; the capacity factor uses the nameplate capacity in EIA-860M, and farms whose USWTDB and EIA capacities differ by 10% or more (farm and plant do not line up cleanly) are left out (tools/build_generation.py).') + '</li><li><a href="https://data.gov.tw/dataset/17140" target="_blank" rel="noopener">' + (zh ? '台灣電力公司「自建之各類再生能源發電量」' : 'Taiwan Power Company, generation of its own renewable stations') + '</a>' + (zh ? '（政府資料開放平臺 17140，各發電站逐月淨發電量，政府資料開放授權條款）：只有台電自有的風場；台電公布的裝置容量要與本站紀錄相差 15% 以內才用，只列 12 個月都有數字的年份。民營風場沒有逐場的官方發電量，仍顯示估計值。' : ' (data.gov.tw 17140, monthly net generation by station, Open Government Data License): Taipower-owned farms only, used when Taipower\'s stated capacity is within 15% of the site\'s record, full years only. Private farms have no official per-farm figures and keep the estimate.') + '</li>' +
      '<li><a href="https://ens.dk/analyser-og-statistik/data-oversigt-over-energisektoren" target="_blank" rel="noopener">Energistyrelsen, Stamdataregister for vindkraftanlæg</a>' + (zh
        ? '（丹麥能源署的風機登記檔 Vinddata 與 Parkproduktion' + (dkGot() ? '，' + dkGot() + '取用' : '') + '，依能源署的<a href="' + DK_TERMS + '" target="_blank" rel="noopener">資料使用條款</a>標示出處）：每部風機的容量、葉輪、輪轂、機型、座標與逐月計量發電量（約每 2 個月更新）；只有公司持有的風機有公布發電量（個人、獨資與合夥持有的沒有）。整場一起計量的風場與單獨計量的風機依位置歸到本站丹麥風場（陸域 3 km、離岸 12 km 內，併網年不早於風場商轉年的前一年），容量與本站紀錄相差 15% 以內才用；單獨計量的風機另列「丹麥・單部風機」。只列全年運轉、容量因數 5–65% 的年份（tools/dk_output.py）。'
        : ' (the Danish Energy Agency\'s turbine register, Vinddata and Parkproduktion' + (dkGot() ? ', retrieved ' + dkGot() : '') + ', credited under the agency\'s <a href="' + DK_TERMS + '" target="_blank" rel="noopener">terms of use</a>): capacity, rotor, hub height, model, position and monthly metered production of every turbine (updated about every 2 months); production is published for company-owned turbines only (not for private persons, sole proprietors or partnerships). Farms metered as a whole and individually metered turbines are matched to the site\'s Danish farms by location (within 3 km onshore or 12 km offshore, connected no earlier than the year before the farm\'s start), and used when the capacity is within 15% of the site\'s record; individually metered turbines are also listed under "Denmark · single turbines". Full years with a capacity factor of 5–65% only (tools/dk_output.py).') + '</li><li><a href="https://nemweb.com.au/Data_Archive/Wholesale_Electricity/MMSDM/" target="_blank" rel="noopener">AEMO, MMS Data Model</a>' + (zh
        ? '（月檔 DISPATCH_UNIT_SCADA：每個機組每 5 分鐘的 SCADA 實測出力；DUDETAIL：登記容量。資料來源：Australian Energy Market Operator（AEMO），依 <a href="' + AU_TERMS + '" target="_blank" rel="noopener">AEMO 版權許可</a>標示）：只有東部電網（NEM）。出力乘以 5 分鐘加總成年發電量，經機組與風場的對照（與即時出力相同）接到本站澳洲風場；一個機組涵蓋好幾座風場的不用，AEMO 登記容量與本站紀錄相差 15% 以內才用。新風場常分段併網，只列前一年 1 月時已在發電、當年登記容量沒變、5 分鐘資料 98% 以上、容量因數 5–65% 的年份；實測值含限電與負電價時的自主降載（tools/au_output.py）。'
        : ' (monthly DISPATCH_UNIT_SCADA, the 5-minute SCADA output of every unit, and DUDETAIL, registered capacity; source: Australian Energy Market Operator (AEMO), credited under <a href="' + AU_TERMS + '" target="_blank" rel="noopener">AEMO\'s copyright permissions</a>): eastern grid (NEM) only. Output × 5 minutes is summed into yearly output and linked to the site\'s Australian farms through the same unit mapping as the live output; units covering several farms are left out, and farms are used when AEMO\'s registered capacity is within 15% of the site\'s record. New farms often connect in stages, so only years in which the farm was already generating in January of the year before, kept its registered capacity, has 98% of the 5-minute data and a capacity factor of 5–65% are shown; measured output includes curtailment and self-curtailment at negative prices (tools/au_output.py).') + '</li><li>' +
      (zh ? '台灣即時取樣（發電表現「台灣・即時取樣」與風場卡片）：抓取程式約每 2 小時記下台電即時資料（資料集 8931）各併網點的瞬間出力，累積成 data/archive/farm_daily.json（2026-06 起，含民營風場；tools/build_farm_daily.py 可從 git 歷史回補）。平均出力是取樣平均，容量因數只計已列裝置容量的時段；是取樣估計，不是官方發電量。以 2026 年 7 月比對，台電自有 7 座風場與官方月發電量相差 0–2 個百分點。'
        : 'Taiwan live samples (the Output dialog\'s "Taiwan · live samples" and farm cards): the scraper records the instantaneous output of every grid unit in Taipower\'s live data (dataset 8931) about every 2 hours into data/archive/farm_daily.json (from June 2026, private farms included; tools/build_farm_daily.py backfills it from the git history). Average output is the mean of the samples and the capacity factor counts only times with a listed capacity: an estimate from samples, not official generation. Against July 2026, Taipower\'s 7 own farms are within 0–2 percentage points of the official monthly generation.') + '</li></ul>' +
    '<h4>' + (zh ? '風場卡片的估計年發電量' : 'Estimated yearly output on farm cards') + '</h4><ul><li>' + (zh ? '容量 × 該國 2023–2025 年風電平均容量因數，取自 ' : 'Capacity × the country\'s 2023–2025 average wind capacity factor, from ') + '<a href="https://ember-energy.org/data/yearly-electricity-data/" target="_blank" rel="noopener">Ember, Yearly Electricity Data</a> (CC BY 4.0)' + (zh ? '；是估計，不是實測。' : '; an estimate, not a measurement.') + '</li></ul>' +
    '<h4>' + (zh ? '其他國家的風機位置' : 'Turbine positions in other countries') + '</h4><ul><li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap ' + (zh ? '貢獻者' : 'contributors') + '</a>' + (zh ? '，開放資料庫授權（ODbL）；由 tools/build_turbines_osm.py 依 OSM 的風場範圍（名稱、容量）或空間群聚（單機容量要合理）對到本站的風場，衍生的 data/global/turbines_osm.json 同樣以 ODbL 分享。' : ', Open Database License (ODbL); matched to the site\'s farms by OSM wind-plant areas (name, capacity) or by spatial groups (plausible unit size) in tools/build_turbines_osm.py; the derived data/global/turbines_osm.json is likewise shared under the ODbL.') + '</li></ul>' +
    '<h4>' + (zh ? '德國的風場與風機' : 'German farms and turbines') + '</h4><ul><li><a href="https://www.marktstammdatenregister.de/MaStR/Datendownload" target="_blank" rel="noopener">© Bundesnetzagentur | Marktstammdatenregister (MaStR)</a>' + (zh ? '，Datenlizenz Deutschland – Namensnennung – Version 2.0：每部營運中風機的座標、機型、輪轂高度、葉輪直徑與商轉日。依風場名稱與位置分群後，對到本站已有的德國風場（近景改畫實際機位），其餘 1 MW 以上、附近沒有可能相同之本站紀錄的陸域風場加進風場層（tools/build_mastr.py）。' : ', Data licence Germany – attribution – version 2.0: position, model, hub height, rotor diameter and commissioning date of every operating turbine. Grouped by wind-farm name and location, matched to the site\'s German farms (whose close-ups now use the real positions); onshore groups of 1 MW or more with no possibly identical site record nearby are added to the farm layer (tools/build_mastr.py).') + '</li></ul>' +
    '<h4>' + (zh ? '美國每部風機的位置與規格' : 'US turbine positions and specs') + '</h4><ul><li><a href="https://energy.usgs.gov/uswtdb/" target="_blank" rel="noopener">U.S. Wind Turbine Database (USWTDB)</a>' + (zh ? '，美國地質調查所、勞倫斯柏克萊國家實驗室與美國潔淨電力協會，公有領域；由 tools/build_turbines.py 依名稱、距離與容量（±15%）對到本站的風場，對不上的維持推算的排列。' : ', USGS, Lawrence Berkeley National Laboratory and American Clean Power Association, public domain; matched to the site\'s farms by name, distance and capacity (±15%) in tools/build_turbines.py; unmatched farms keep the estimated layout.') + '</li></ul>' +
    '<h4>' + (zh ? '1980–1999 早期資料' : 'Early data 1980–1999') + '</h4><ul>' + li(src.early) + '</ul>' +
    '<h4>' + (zh ? '風場層級資料' : 'Farm-level data') + '</h4><ul><li>Global Energy Monitor, Global Wind Power Tracker, February 2026 release (CC BY 4.0): <a href="https://globalenergymonitor.org/projects/global-wind-power-tracker/" target="_blank" rel="noopener">globalenergymonitor.org</a></li>' + li(src.farms) + '</ul>' +
    (LITE ? '' : '<h4>' + (zh ? '離岸風電港口' : 'Offshore wind ports') + '</h4><ul><li>' + (zh ? '2026 年 9 月人工整理：港務機關、政府、開發商與製造商的公告，以及產業新聞（offshoreWIND.biz、Recharge 等）；每個港口的卡片列出出處，「服務過的風場」只列有出處佐證的。' : 'Compiled by hand in Sep 2026 from port authorities, governments, developer and manufacturer announcements and trade press (offshoreWIND.biz, Recharge and others); each port card lists its sources, and “wind farms served” only lists farms a source ties to the port.') + '</li></ul>' +
    '<h4>' + (zh ? '水下基礎型式' : 'Foundation types') + '</h4><ul><li>' + (zh ? 'OSPAR Offshore Renewable Energy Developments 2024（CC0，資料時間 2024-01-01）：北海與東北大西洋逐場的基礎型式；逐筆比對本站風場。OSPAR 與建成紀錄不符或沒寫具體型式的（德國每一座、英國 Hornsea One 等），改以德文維基百科或建造新聞為準。歐洲其他風場（波羅的海、地中海、艾瑟爾湖）與 2024 年以後才完工的風場，逐座查開發商、施工廠商、產業新聞或維基百科；全球浮動式風場的細分型式（單柱式、半潛式、駁船式、張力腳）逐座查技術供應商與開發商資料。台灣、日本、韓國、美國逐座查開發商、施工廠商、政府文件或產業新聞（日本港灣內的風場以 NEDO 的支持構造分類為準，「ドルフィン」即高樁承台）。卡片列出每座的出處。中國與越南逐座查開發商、施工廠商、地方政府（含竣工環保驗收報告）或產業新聞，出處原文逐筆核對：2026 年 10 月中國營運中的離岸風場 141 座已查明 96 座（約占容量 71%）、越南 20 座查明 15 座，其餘仍暫列「型式不詳」；逐場清單見 GitHub 的 docs/foundations.md。' : 'OSPAR Offshore Renewable Energy Developments 2024 (CC0, data as of 1 Jan 2024): foundation type per farm for the North Sea and NE Atlantic, matched to this site’s farms one by one. Where OSPAR differs from what was built or gives no specific type (every German farm, the UK’s Hornsea One and a few others), German Wikipedia or construction news is used instead. The rest of Europe (the Baltic, the Mediterranean, the IJsselmeer) and farms finished after 2024 were checked one by one against developers, construction contractors, trade press or Wikipedia, and floating farms worldwide got their sub-type (spar, semi-submersible, barge, tension-leg) from technology providers and developers. Taiwan, Japan, Korea and the USA were checked the same way against developers, contractors, government documents and trade press (farms inside Japanese ports follow NEDO’s classification of support structures, where a “dolphin” is a high-rise pile cap). Each farm card lists its sources. China and Vietnam are checked farm by farm against developers, construction contractors, local governments (including completion environmental acceptance reports) or trade press, with every quoted passage verified: as of October 2026, 96 of China’s 141 operating offshore farms are known (about 71% of the capacity) and 15 of Vietnam’s 20; the rest still show “type unknown”. The farm-by-farm list is docs/foundations.en.md on GitHub.') + '</li></ul>' +
    '<h4>' + (zh ? '重大事件與事故' : 'Major events & incidents') + '</h4><ul><li>' + (zh ? '2026 年 9 月 28 日人工查證的清單（' + (EVENTS.length || 59) + ' 筆）：每筆附主管機關或業主的一手來源（能源署、BSEE、OSHA、METI、韓國氣候能源環境部、AEMO、各業主新聞稿等）；傷亡人數與根因只寫官方已確認的，未確認的留空；照片只記錄頁面網址與權利狀態，本站不轉載。逐筆清單見 GitHub 的 docs/events.md。' : 'A list verified by hand on 28 Sep 2026 (' + (EVENTS.length || 59) + ' events): each with a primary source from a regulator or the owner (Energy Administration, BSEE, OSHA, METI, Korea’s climate and energy ministry, AEMO, owners’ press releases and others); casualties and root causes are recorded only when officially confirmed; photos are recorded as page URLs with their rights status and are not reproduced here. The full list is docs/events.en.md on GitHub.') + '</li></ul>') +
    '<h4>' + (zh ? '備註（離岸）' : 'Notes (offshore)') + '</h4><ul>' + li(n.offshore) + '</ul>' +
    '<h4>' + (zh ? '備註（早期）' : 'Notes (early)') + '</h4><ul>' + li(n.early) + '</ul>' +
    '<h4>' + (zh ? '備註（風場）' : 'Notes (farms)') + '</h4><ul>' + li(n.farms) + '</ul>' +
    '<h4>' + (zh ? '台灣、日本官方統計稽核' : 'Taiwan & Japan official-statistics audit') + '</h4><ul>' + li(src.audit) + li(n.audit) + '</ul>' +
    '<h4>' + (zh ? '規劃中專案' : 'Pipeline projects') + '</h4><ul>' +
      '<li>' + (zh ? '逐案：GEM 全球風電追蹤 2026-02（興建中、前期開發、已宣布）；2026 年 9 月人工整理的 177 個重點專案（' : 'Projects: GEM Global Wind Power Tracker, Feb 2026 (construction, pre-construction, announced); 177 key projects curated in Sep 2026 (') +
      esc(D.pipelineCuratedAsOf || '2026') + (zh ? '），用來更新狀態與預計商轉年，GEM 沒有的才新增；「暫緩」不收錄。' : '), used to update status and expected commissioning year and to add projects GEM lacks; on-hold projects are left out.') + '</li>' +
      (D.pipelineTotals ? '<li>' + (zh ? '各國總量：' : 'Country totals: ') + esc(D.pipelineTotals.source) + ' · ' + esc(D.pipelineTotals.release) + ' — <a href="' + esc(D.pipelineTotals.url) + '" target="_blank" rel="noopener">globalenergymonitor.org</a></li>' : '') +
      '<li>' + (zh ? '日本另補 NEDO 各縣風場清單（1 MW 以上，至 2018 年 3 月）與 windfarm.work／營運商資料中 GEM 未收錄的小型風場，並據以修正 GEM 錯置的座標。' : 'Japan adds small farms missing from GEM from the NEDO prefecture lists (≥1 MW, to March 2018) and windfarm.work / operator pages, which were also used to correct misplaced GEM coordinates.') + '</li></ul>' +
    (LITE ? '' : '<h4>' + (zh ? '即時出力（台灣、澳洲、加拿大）' : 'Live output (Taiwan, Australia, Canada)') + '</h4><ul>' +
      '<li>' + (zh ? '台灣：台電「各機組發電量即時資訊」（政府資料開放平臺資料集 8931）。' : 'Taiwan: Taipower real-time generation by unit (government open data, dataset 8931).') + '</li>' +
      '<li>' + (zh ? '澳洲東部電網：AEMO NEMWeb Dispatch_SCADA（每 5 分鐘）。資料來源：Australian Energy Market Operator (AEMO)。' : 'Australia NEM: AEMO NEMWeb Dispatch_SCADA (every 5 minutes). Source: Australian Energy Market Operator (AEMO).') + '</li>' +
      '<li>' + (zh ? '亞伯達：AESO Current Supply Demand 報表（約 1 分鐘）。© 2026 THE INDEPENDENT SYSTEM OPERATOR ("ISO"). All rights reserved；非商業與教育用途，數值未修改。' : 'Alberta: AESO Current Supply Demand report (about 1 minute). © 2026 THE INDEPENDENT SYSTEM OPERATOR ("ISO"). All rights reserved; non-commercial, educational use, values unmodified.') + '</li>' +
      '<li>' + (zh ? '安大略：IESO Generators Output and Capability 報表（每小時）。' : 'Ontario: IESO Generators Output and Capability report (hourly). ') + 'Copyright © 2004-2022 Independent Electricity System Operator, all rights reserved. This information is subject to the Terms of Use set out in the IESO\'s website (www.ieso.ca).</li>' +
      '<li>' + (zh ? '機組與風場的對照以 AEMO 登錄清單與 IESO「Transmission-Connected Generation」人工核對；對不到的機組只計入電網總量。綠色外圈只在時間軸位於最新年份時顯示。' : 'Units are matched to farms using AEMO’s registration list and IESO’s “Transmission-Connected Generation” page, checked by hand; unmatched units only count toward the grid total. Green rings only show when the timeline is at the latest year.') + '</li></ul>') +
    '<h4>' + (zh ? '海域（工具列「海域」）' : 'Sea zones (toolbar “Sea zones”)') + '</h4><ul><li><a href="https://www.marineregions.org/" target="_blank" rel="noopener">Flanders Marine Institute (VLIZ), Marine Regions: Maritime Boundaries Geodatabase v12 (2023)</a>' +
      (zh ? '（CC BY 4.0）的專屬經濟區界線：不畫基線，依類型分成協議或判決、中線與 200 浬外界、未定或有爭議（虛線）三種，簡化到約 2 km 供地圖顯示（tools/build_offshore_zones.py）。界線不具法律效力，也不代表本站對任何爭議海域的立場；完整資料請到 marineregions.org。'
        : ' (CC BY 4.0), exclusive economic zone boundaries: baselines left out, grouped as agreed or ruled, median lines and 200 NM limits, and unsettled or disputed (dashed), simplified to about 2 km for display (tools/build_offshore_zones.py). The lines have no legal value and imply no position on any disputed area; for the data itself, see marineregions.org.') +
      '</li><li><a href="https://data.gov.tw/dataset/36681" target="_blank" rel="noopener">' + (zh ? '經濟部能源署「台灣離岸風電潛力場址地理資訊」' : 'Energy Administration, Taiwan offshore wind potential sites') + '</a>' +
      (zh ? '（政府資料開放平臺 36681，政府資料開放授權條款）：2015 年公告的 36 處潛力場址，TWD97 座標轉成經緯度；檔案只列頂點，每一處都用公告面積核對：先照檔案順序，不合時試依檔案順序分成兩塊或外框加挖空（新竹縣場址是外框扣掉中間一塊），最後才試重排點位，順序無法唯一確定的不畫。'
        : ' (data.gov.tw 36681, Open Government Data License): the 36 potential sites published in 2015, TWD97 coordinates converted to latitude and longitude; the file lists vertices only, so each site is checked against its published area: file order first, then two rings in file order (two parts, or an outer ring with a hole, as for the Hsinchu County site), and only then a reordering, which must be unique; otherwise the site is not drawn.') + '</li>' + zoneAreaSources(zh) + '</ul>' +
    '<h4>' + (zh ? '底圖與元件' : 'Basemaps & libraries') + '</h4><ul><li>Natural Earth 1:50m Admin-0 & Gray Earth shaded relief (public domain) · NASA Blue Marble Next Generation with topography & bathymetry (public domain) · ' + (zh ? '平均風速：' : 'Wind speed: ') + '<a href="https://globalwindatlas.info/" target="_blank" rel="noopener">Global Wind Atlas 3</a> (DTU Wind Energy / World Bank Group, CC BY 4.0)' + (zh ? '，離地 100 m 年平均風速，取 1/32 縮圖層（約 9 km）依 1 m/s 分級（tools/build_wind_resource.py）' : ', mean wind speed at 100 m, 1/32 overview (about 9 km) binned at 1 m/s (tools/build_wind_resource.py)') + '</li><li>Esri World Imagery (Esri, Vantor, Earthstar Geographics) · Esri World Hillshade (Esri, USGS, NASA et al.) — zoomed-in detail</li><li>three.js r128 (MIT) · Wikimedia Commons ' + (zh ? '照片（各張作者與授權寫在卡片上，連到原檔案頁）' : 'photos (author and licence of each on the card, linked to the file page)') + ' · Wikipedia (live lookup)</li><li>' + (zh ? '此刻的風：' : 'Wind now: ') + '<a href="https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast" target="_blank" rel="noopener">NOAA/NCEP Global Forecast System (GFS)</a>' + (zh ? '（公有領域）離地 10 m 風場，1° 解析度，取最新一次預報的分析場，排程每 6 小時更新（tools/fetch_gfs_wind.py）；粒子的移動速度是示意，亮度對應風速' : ' (public domain) 10 m wind at 1°, the analysis of the newest cycle, refreshed every 6 hours by a schedule (tools/fetch_gfs_wind.py); particle speed is illustrative, brightness follows wind speed') + '</li></ul>' +
    '<h4>' + (zh ? '開發者與版權' : 'Developer & copyright') + '</h4><p>國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室<br>National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu<br>' +
    (zh ? '網站程式、設計與文字 © 2026 劉瑞弘研究室；各項資料依上列來源的授權使用。' : 'Site code, design and text © 2026 Dof Lab; each dataset is used under the licence of its source listed above.') +
    '<br><a href="https://github.com/dofliu/windfarmTaiwan" target="_blank" rel="noopener">GitHub · dofliu/windfarmTaiwan</a> · <a href="https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-standalone.html">' + (zh ? '下載單檔版 HTML' : 'Download the single-file HTML') + '</a> · <a href="https://github.com/dofliu/windfarmTaiwan/releases/download/standalone/windfarmTaiwan-globe.html">' + (zh ? '下載全球風電地圖公開版（只有地球儀）' : 'Download the public global wind map (globe only)') + '</a>' +
    '<br>' + (zh ? '網站版本 ' : 'Site version ') + '<a href="' + WW.changelogURL() + '" target="_blank" rel="noopener">v' + WW.VERSION + '</a>' + (zh ? '（點版本號看更新紀錄）' : ' (click for the changelog)') + '</p>';
  $('g-modal').classList.add('show');
  $('g-modalClose').focus();
}

/* ================= 發電表現：實測年發電量與容量因數的排名、同機型比較 =================
   兩種資料，不混在同一張排名裡：
   · 官方年資料：generation.json（美國＝EIA-923，台灣＝台電自有風場，丹麥＝丹麥能源署風機登記檔）；國家平均推估的值不排名。
   · 丹麥單部風機：turbine_output.json（同一登記檔裡單獨計量、公司持有的風機；整場計量的風場只有合計，在 generation.json）。
   · 台灣即時取樣：data/archive/farm_daily.json（抓取程式每 2 小時一次記下台電各併網點的瞬間出力，含民營風場）。
     是取樣估計、不是官方發電量；以台電併網點為單位（沃一風、沃二風…），所屬風場由 live.js 的 GLOBE_FARM 對到地球儀。
   同機型：整座風場只有一種機型（官方年資料用 build_generation.py 寫的 m 欄；即時取樣取地球儀風場紀錄的機型，
   併網點容量超過風場紀錄 3% 以上時不列機型），而且有兩個以上單位有數字的機型。 */
const OUT_ISO = LITE ? ['TWN', 'USA', 'AUS', 'DNK', 'DKT'] : ['TWN', 'TWS', 'USA', 'AUS', 'DNK', 'DKT'], OUT_VIEWS = ['gen', 'cf', 'model'], OUT_PER = ['30', '90', 'all'];
const AU_TERMS = 'https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions';   // AEMO 版權許可（須標示 AEMO 與資料來源）
const DK_TERMS = 'https://dataforsyningen.dk/asset/PDF/rettigheder_vilkaar/Energistyrelsen%20-%20Vilk%C3%A5r%20for%20brug%20af%20data.pdf';   // 丹麥能源署資料使用條款
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtYM = ym => { const y = ym.slice(0, 4), m = +ym.slice(5, 7); return lang === 'zh' ? y + ' 年 ' + m + ' 月' : MONTHS_EN[m - 1] + ' ' + y; };
/* 丹麥能源署資料的取用月份（條款要求標示）：由 tools/build_generation.py 依下載檔的時間寫進 generation.json 與 turbine_output.json */
const dkGot = () => { const ym = (GEN && GEN.meta.retrieved && GEN.meta.retrieved.DNK) || (TOUT && TOUT.meta && TOUT.meta.retrieved); return ym ? fmtYM(ym) : ''; };
const OUT = { iso: 'TWN', view: 'cf', year: null, per: '90', desc: true, msort: 'n', q: '', all: false, open: null, hl: null };
const OUT_LIMIT = 50;
const outShown = () => $('g-modal').classList.contains('show') && !!$('g-modalBody').querySelector('.oout');
const median = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
const fmtG = v => (v >= 100 ? WW.int(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' GWh';     // 排名裡同一欄維持 GWh，不混用 TWh
const fmtMWv = v => (v >= 100 ? WW.int(v) : v.toFixed(1)) + ' MW';
const tcls = t => t === 'offshore' ? 'off' : t === 'floating' ? 'fl' : 'on';
const isSamp = () => OUT.iso === 'TWS', isTurb = () => OUT.iso === 'DKT';
const fmtUnit = mw => mw < 1 ? WW.int(mw * 1000) + ' kW' : (Math.round(mw * 1000) / 1000).toLocaleString('en-US') + ' MW';     // 單機容量：3.075 MW、660 kW
let outRowMap = {};                                               // 目前清單的 key → 列（點列飛到風場、點的提示用）
function outFarm(k) {
  const i = k.indexOf('|'), iso = k.slice(0, i), name = k.slice(i + 1);
  return (farmsByIso[iso] || []).find(f => f.name === name && !f.pipe) || null;
}
function outYears(iso) {
  return [...new Set(Object.keys(GEN.farms).filter(k => k.startsWith(iso + '|')).flatMap(k => Object.keys(GEN.farms[k].y)))].sort();
}
function outRows(iso, y) {
  return Object.keys(GEN.farms).filter(k => k.startsWith(iso + '|') && GEN.farms[k].y[y]).map(k => {
    const v = GEN.farms[k], f = outFarm(k);
    return { k, v, f, gwh: v.y[y][0], cf: v.y[y][1], name: f ? fname(f) : k.slice(iso.length + 1), type: f ? f.type : 'onshore' };
  });
}
/* ---- 台灣即時取樣（farm_daily.json）---- */
let SAMP = null, sampP = null;
function needSamp() {
  if (SAMP || sampP || LITE) return sampP;
  sampP = WW.getLiveJSON(WW.DATA.farmDaily).then(j => { SAMP = j; }, e => { console.warn(e); SAMP = { days: {}, err: true }; })
    .then(() => { renderOutput(); if (cardItem && cardItem.kind === 'farm' && cardItem.iso === 'TWN') renderCard(cardItem); });
  return sampP;
}
const SAMP_SKIP = new Set(['tpc-other-on', 'ppa-other-on']);    // 台電把好幾座風場合成一列的彙總，不是單一風場
const SAMP_MIN = 60;                                             // 有裝置容量的取樣少於 60 次（約 5 天）不排名
function sampDays(per) {
  const ds = Object.keys(SAMP.days).sort(); if (per === 'all' || !ds.length) return ds;
  const from = new Date(Date.parse(ds[ds.length - 1] + 'T00:00:00Z') - (+per - 1) * 864e5).toISOString().slice(0, 10);
  return ds.filter(d => d >= from);
}
function unitModel(f, cap) {                                      // 與 tools/build_generation.py 的 tw_model 同一規則
  const t = String((f && f.turbine) || '').trim();
  if (!t || t.includes('+') || (cap && f.mw && cap > f.mw * 1.03)) return null;
  const m = t.replace(/^\d+\s*[x×]\s*/, '').replace(/\s*[x×]\s*\d+.*$/, '').trim();
  return /^[A-Za-z]/.test(m) ? m : null;
}
function sampAgg(ds) {
  const acc = {};
  ds.forEach(d => { const u = SAMP.days[d].u; for (const k in u) { const a = acc[k] || (acc[k] = [0, 0, 0, 0, 0]); for (let i = 0; i < 5; i++) a[i] += u[k][i]; } });
  return acc;
}
function sampRows(per) {
  const ds = sampDays(per), acc = sampAgg(ds), L = WW.live, rows = [], skipped = [];
  for (const k in acc) {
    const a = acc[k];
    if (SAMP_SKIP.has(k)) continue;
    const name = (L && L.unitName(k)) || (SAMP.names && SAMP.names[k]) || k.replace(/^u:/, '');
    if (a[2] < SAMP_MIN || !a[4]) { skipped.push(name); continue; }
    const gname = L && L.GLOBE_FARM[k], f = gname ? (farmsByIso.TWN || []).find(x => x.name === gname && !x.pipe) || null : null;
    const lf = L && L.FARMS.find(x => x.id === k), cap = a[4] / a[2];
    rows.push({ k, f, name, type: f ? f.type : lf && /^off/.test(lf.grp) ? 'offshore' : 'onshore', gwh: a[1] / a[0], cf: a[3] / a[4] * 100, n: a[0],
      v: { mw: cap, m: unitModel(f, cap), proj: L ? L.unitProj(k) : '' } });
  }
  return { rows, skipped, days: ds, samples: ds.reduce((s, d) => s + SAMP.days[d].t.length, 0) };
}
/* 地球儀風場 → 即時取樣（近 90 天，合併該風場的各併網點）；給風場卡片用 */
function sampOfFarm(f) {
  if (!SAMP || SAMP.err || !WW.live || !f || f.iso !== 'TWN') return null;
  const units = WW.live.unitsForGlobalFarm(f.name).map(u => u.id); if (!units.length) return null;
  const ds = sampDays('90'), acc = sampAgg(ds), have = units.filter(k => acc[k] && acc[k][2] >= SAMP_MIN && acc[k][4]);
  if (!have.length) return null;
  const out = have.reduce((s, k) => s + acc[k][1] / acc[k][0], 0), cf = have.reduce((s, k) => s + acc[k][3], 0) / have.reduce((s, k) => s + acc[k][4], 0) * 100;
  const all = sampRows('90').rows, rank = all.filter(r => r.cf > cf).length + 1;
  return { out, cf, from: ds[0], to: ds[ds.length - 1], units: have, part: have.length < units.length, rank, n: all.length };
}
/* ---- 丹麥單部風機（turbine_output.json：丹麥能源署登記檔裡單獨計量、公司持有的風機）---- */
let TOUT = null, toutP = null;
function needTout() {
  if (TOUT || toutP) return toutP;
  toutP = WW.getJSON(WW.DATA.turbineOutput).then(j => { TOUT = j; }, e => { console.warn(e); TOUT = { err: true }; }).then(renderOutput);
  return toutP;
}
function turbRows(y) {
  const D = TOUT && TOUT.DNK, out = []; if (!D) return out;
  D.rows.forEach((r, i) => {                                       // [lat, lon, kW, 葉輪, 輪轂, 機型組, 離岸, 自治市, 併網年, {年: [GWh, 容量因數]}]
    const v = r[9][y]; if (!v) return;
    const g = r[5] >= 0 ? r[5] : -1;
    out.push({ k: 'DKT|' + i, t: 1, f: null, ll: [r[0], r[1]], name: r[7] >= 0 ? D.munis[r[7]] : '—', type: r[6] ? 'offshore' : 'onshore', gwh: v[0], cf: v[1],
      v: { mw: r[2] / 1000, m: g >= 0 ? D.models[g] : null, mk: g >= 0 ? D.mkeys[g] : null, hh: r[4] ? Math.round(r[4]) : null, rd: r[3] ? Math.round(r[3]) : null, yr: r[8], y: r[9] } });
  });
  return out;
}
const curRows = () => isSamp() ? sampRows(OUT.per).rows : isTurb() ? turbRows(OUT.year) : outRows(OUT.iso, OUT.year);
/* 某國某年：全部風場的一列名次（容量因數或年發電量），給風場卡片用 */
function outRankOf(f) {
  if (!GEN || !f || !OUT_ISO.includes(f.iso)) return null;
  const k = f.iso + '|' + f.name, g = GEN.farms[k]; if (!g) return null;
  const ys = Object.keys(g.y).sort(), y = ys[ys.length - 1], rows = outRows(f.iso, y);
  return { y, n: rows.length, cf: rows.filter(r => r.cf > g.y[y][1]).length + 1, gen: rows.filter(r => r.gwh > g.y[y][0]).length + 1 };
}
function openOutput(o) {
  Object.assign(OUT, { q: '', all: false, open: null, hl: null }, o || {});
  if (!OUT_ISO.includes(OUT.iso)) OUT.iso = 'TWN';
  if (!OUT_VIEWS.includes(OUT.view)) OUT.view = 'cf';
  if (!OUT_PER.includes(OUT.per)) OUT.per = '90';
  // 從風場或風機卡片來（OUT.hl）：清單會延伸到那一列（fillOutList），開啟後捲過去
  $('g-modal').querySelector('.box').classList.add('wide');
  $('g-modalBody').innerHTML = '<div class="oout"></div>';
  $('g-modal').classList.add('show');
  renderOutput();
  $('g-modalClose').focus();
  const sel = $('g-modalBody').querySelector('.orow.sel'); if (sel) sel.scrollIntoView({ block: 'center' });
  syncURL();
}
function renderOutput() {
  if (!outShown()) return;
  const el = $('g-modalBody').querySelector('.oout');
  const wait = () => { el.innerHTML = '<h2>' + esc(T('outTitle')) + '</h2><div class="gnote">' + esc(T('farmsLoading')) + '</div>'; };
  if (!GEN || !farmsReady) {
    wait();
    if (!GEN) { needGen(); if (genP) genP.then(renderOutput); }
    return;                                                       // 風場資料載入後由 loadFarms 再呼叫一次
  }
  if (isSamp() && !SAMP) { wait(); needSamp(); return; }
  if (isTurb() && !TOUT) { wait(); needTout(); return; }
  const iso = OUT.iso, samp = isSamp(), turb = isTurb();
  const yearPick = ys => '<label class="oyl">' + esc(T('outYear')) + ' <select class="oyear">' + ys.map(v => `<option${v === OUT.year ? ' selected' : ''}>${v}</option>`).join('') + '</select></label>';
  const seg = (name, items, cur) => '<span class="gseg" role="group">' + items.map(([v, lab]) => `<button type="button" data-${name}="${v}" aria-pressed="${v === cur}"${v === cur ? ' class="active"' : ''}>${esc(lab)}</button>`).join('') + '</span>';
  let rows, sum, cov, pick;
  if (samp) {
    const S = SAMP.err ? null : sampRows(OUT.per);
    rows = S ? S.rows : [];
    const first = Object.keys(SAMP.days).sort()[0] || '';
    pick = '<label class="oyl">' + esc(T('outPer')) + ' <select class="oper">' + OUT_PER.map(v => `<option value="${v}"${v === OUT.per ? ' selected' : ''}>${esc(T('outPerOpt')(v, first))}</option>`).join('') + '</select></label>';
    sum = S && rows.length ? `<div class="osum">${esc(T('outSumS')(S.days[0], S.days[S.days.length - 1], WW.int(S.samples), rows.length, median(rows.map(r => r.cf)).toFixed(1)))} · <a href="https://data.gov.tw/dataset/8931" target="_blank" rel="noopener" title="${esc(T('outSrcS')[1])}">${esc(T('outSrcS')[0])}</a></div>` : '';
    cov = S ? T('outCovS')(S.skipped) : T('outSampErr');
  } else if (turb) {
    const ys = TOUT.err ? [] : TOUT.meta.years;
    if (!ys.includes(String(OUT.year))) OUT.year = ys[ys.length - 1];
    rows = turbRows(OUT.year);
    pick = ys.length ? yearPick(ys) : '';
    sum = rows.length ? `<div class="osum">${esc(T('outSumT')(OUT.year, WW.int(rows.length), fmtGWh(rows.reduce((s, r) => s + r.gwh, 0)), median(rows.map(r => r.cf)).toFixed(1)))} · <a href="${esc(TOUT.meta.url)}" target="_blank" rel="noopener" title="${esc(T('actSrc').DNK[2])}">Energistyrelsen</a></div>` : '';
    cov = TOUT.err ? T('outTurbErr') : T('outCovT')(OUT.year, WW.int(rows.length));
  } else {
    const ys = outYears(iso);
    if (!ys.includes(String(OUT.year))) OUT.year = ys[ys.length - 1];
    rows = outRows(iso, OUT.year);
    const src = T('actSrc')[iso], tot = rows.reduce((s, r) => s + r.gwh, 0);
    pick = yearPick(ys);
    sum = `<div class="osum">${esc(T('outSum')(OUT.year, WW.int(rows.length), fmtGWh(tot), median(rows.map(r => r.cf)).toFixed(1)))} · <a href="${esc(GEN.meta.url[iso] || '')}" target="_blank" rel="noopener" title="${esc(src[2])}">${esc(src[1])}</a></div>`;
    cov = outCoverage(iso, +OUT.year, rows);
  }
  const med = median(rows.map(r => r.cf));
  const credit = iso === 'DNK' || turb ? `<div class="ocov">${esc(T('outCredit')(dkGot()) + L('；', '; '))}<a href="${DK_TERMS}" target="_blank" rel="noopener">${esc(T('outTerms'))}</a></div>`
    : iso === 'AUS' ? `<div class="ocov">${esc(T('outCreditAU') + L('；', '; '))}<a href="${AU_TERMS}" target="_blank" rel="noopener">${esc(T('outTermsAU'))}</a></div>` : '';   // 丹麥能源署要求標示機關、資料集與取用時間
  el.innerHTML = '<h2>' + esc(T('outTitle')) + '</h2><div class="otop">' +
    '<label class="oyl">' + esc(T('outData')) + ' <select class="oiso">' + OUT_ISO.map(c => `<option value="${c}"${c === iso ? ' selected' : ''}>${esc(T('outIso')[c] || (byIso[c] ? cname(byIso[c]) : c))}</option>`).join('') + '</select></label>' +
    seg('view', [['gen', T(samp ? 'outGenS' : 'outGen')], ['cf', T('outCf')], ['model', T('outModel')]], OUT.view) + pick +
    (OUT.view === 'model' ? seg('msort', [['n', T('outByN')], ['med', T('outByMed')]], OUT.msort) : seg('dir', [['1', T('outHigh')], ['0', T('outLow')]], OUT.desc ? '1' : '0')) +
    (OUT.view !== 'model' && rows.length > 20 ? `<input type="search" class="oq" placeholder="${esc(T(turb ? 'outPhT' : 'outPh'))}" aria-label="${esc(T(turb ? 'outPhT' : 'outPh'))}" value="${esc(OUT.q)}" autocomplete="off">` : '') + '</div>' +
    sum + `<div class="ocov">${esc(cov)}</div>` + credit + '<div class="olist"></div>' +
    `<div class="onote">${esc((samp ? T('outNoteS') : turb ? T('outNoteT') : T('outNote'))[OUT.view](iso))}</div><div class="otip" role="tooltip"></div>`;
  fillOutList(el, rows, med);
  const is = el.querySelector('.oiso'); if (is) is.onchange = e => { OUT.iso = e.target.value; OUT.q = ''; OUT.all = false; OUT.open = null; OUT.hl = null; renderOutput(); syncURL(); };
  el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { OUT.view = b.dataset.view; OUT.all = false; renderOutput(); syncURL(); });
  el.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => { OUT.desc = b.dataset.dir === '1'; renderOutput(); });
  el.querySelectorAll('[data-msort]').forEach(b => b.onclick = () => { OUT.msort = b.dataset.msort; renderOutput(); });
  const ys = el.querySelector('.oyear'); if (ys) ys.onchange = e => { OUT.year = e.target.value; renderOutput(); };
  const ps = el.querySelector('.oper'); if (ps) ps.onchange = e => { OUT.per = e.target.value; renderOutput(); syncURL(); };
  const q = el.querySelector('.oq'); if (q) q.oninput = () => { OUT.q = q.value.slice(0, 60); fillOutList(el, rows, med); };
}
function outCoverage(iso, y, rows) {
  const op = (farmsByIso[iso] || []).filter(f => !f.pipe && !AGG_RE.test(f.name) && farmActive(f, y + 0.99));
  const opMw = op.reduce((s, f) => s + farmMwAt(f, y + 0.99), 0), haveMw = rows.reduce((s, r) => s + r.v.mw, 0);
  return T('outCov')(iso, y, WW.int(op.length), fmtMW(opMw), WW.int(rows.length), fmtMW(haveMw), opMw ? Math.round(haveMw / opMw * 100) : 0);
}
function outSub(r) {
  return [r.v.proj || null, (r.t ? fmtUnit : fmtMW)(r.v.mw), r.v.m || (r.t ? T('turbNoModel') : null), r.v.hh ? T('dimHub') + ' ' + r.v.hh + ' m' : null, r.n ? T('outSmp')(WW.int(r.n)) : null,
    r.v.yr ? T('outConn')(r.v.yr) : null].filter(Boolean).join(' · ');
}
const outGenTxt = r => isSamp() ? fmtMWv(r.gwh) : fmtG(r.gwh);
function outRow(r, key, mx, med) {
  const w = mx ? r[key] / mx * 100 : 0;
  return `<button type="button" class="orow${r.k === OUT.hl ? ' sel' : ''}" data-k="${esc(r.k)}"><span class="ork">#${r.rank}</span>` +
    `<span class="onm"><b>${esc(r.name)}</b><small>${esc(outSub(r))}</small></span>` +
    `<span class="obar"><i class="${tcls(r.type)}" style="width:${w.toFixed(1)}%"></i>${med != null ? `<s style="left:${(med / mx * 100).toFixed(1)}%"></s>` : ''}</span>` +
    `<span class="oval">${key === 'gwh' ? outGenTxt(r) : r.cf.toFixed(1) + '%'}<small>${key === 'gwh' ? T('actCf') + ' ' + r.cf.toFixed(1) + '%' : outGenTxt(r)}</small></span></button>`;
}
function fillOutList(el, rows, med) {
  const box = el.querySelector('.olist');
  outRowMap = {}; rows.forEach(r => { outRowMap[r.k] = r; });
  if (!rows.length) { box.innerHTML = '<div class="gnote">' + esc(T('fsNone')) + '</div>'; return; }
  const types = new Set(rows.map(r => tcls(r.type)));
  const legend = '<div class="olegend">' + (types.size > 1 ? [...types].map(t => `<span><i class="osw ${t}"></i>${esc(T(t === 'on' ? 'onshore' : t === 'off' ? 'offshore' : 'floating'))}</span>`).join('') : '') +
    (OUT.view === 'cf' ? `<span><i class="omed"></i>${esc(T('outMed'))} ${med.toFixed(1)}%</span>` : OUT.view === 'model' ? `<span><i class="omed"></i>${esc(T('outMedM'))}</span>` : '') + '</div>';
  if (OUT.view === 'model') { box.innerHTML = legend + outModels(rows, med); wireOutList(el); return; }
  const key = OUT.view === 'gen' ? 'gwh' : 'cf';
  const list = rows.slice().sort((a, b) => b[key] - a[key]);
  list.forEach((r, i) => { r.rank = i + 1; });
  if (!OUT.desc) list.reverse();
  const toks = fold(OUT.q).split(/\s+/).filter(Boolean);
  const hit = toks.length ? list.filter(r => { const s = fold(r.name + ' ' + r.k + ' ' + (r.v.m || '') + ' ' + (r.v.proj || '')); return toks.every(t => s.includes(t)); }) : list;
  const need = OUT.hl ? hit.findIndex(r => r.k === OUT.hl) + 6 : 0;           // 從卡片來：延伸到那一列
  const lim = OUT.all || toks.length ? hit : hit.slice(0, Math.max(OUT_LIMIT, need));
  const mx = Math.max(...rows.map(r => r[key]));
  box.innerHTML = legend + (hit.length ? lim.map(r => outRow(r, key, mx, key === 'cf' ? med : null)).join('') : '<div class="gnote">' + esc(T('fsNone')) + '</div>') +
    (lim.length < hit.length ? `<button type="button" class="omore">${esc(T(isTurb() ? 'relMoreT' : 'relMore')(WW.int(hit.length)))}</button>` : '');
  wireOutList(el);
}
const topName = a => { const c = new Map(); a.forEach(r => c.set(r.v.m, (c.get(r.v.m) || 0) + 1)); return [...c].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))[0][0]; };   // 組內最常見的寫法
const mkSpec = k => { const p = String(k).split('|'); return p.length === 3 ? T('outSpec')(p[1], fmtUnit(+p[2] / 1000)) : ''; };              // 丹麥：廠牌|葉輪|單機 kW
function outModels(rows, med) {
  const by = new Map(), turb = isTurb(), min = turb ? 5 : 2;      // 單部風機：5 部以上才成一組
  rows.forEach(r => { const k = r.v.m && (r.v.mk || r.v.m); if (k) { if (!by.has(k)) by.set(k, []); by.get(k).push(r); } });
  const gs = [...by].filter(([, a]) => a.length >= min).map(([k, a]) => ({ k, m: topName(a), a: a.sort((x, z) => z.cf - x.cf), med: median(a.map(r => r.cf)) }));
  if (!gs.length) return '<div class="gnote">' + esc(T('outNoModel')) + '</div>';
  gs.sort(OUT.msort === 'med' ? (a, b) => b.med - a.med || b.a.length - a.a.length : (a, b) => b.a.length - a.a.length || b.med - a.med);
  const mx = Math.max(10, Math.ceil(Math.max(...rows.map(r => r.cf)) / 10) * 10), X = v => (v / mx * 100).toFixed(1) + '%';
  const ticks = []; for (let v = 0; v <= mx; v += 10) ticks.push(`<span style="left:${X(v)}">${v}%</span>`);
  const hist = g => {                                             // 數量多（單部風機）：改畫分布，每格 1 個百分點，顏色依格內多數的類型
    const bins = new Map(); g.a.forEach(r => { const b = Math.floor(r.cf), e = bins.get(b) || { n: 0, off: 0 }; e.n++; if (r.type !== 'onshore') e.off++; bins.set(b, e); });
    const hm = Math.max(...[...bins.values()].map(e => e.n));
    return [...bins].map(([b, e]) => `<i class="ohist ${e.off * 2 > e.n ? 'off' : 'on'}" data-b="${b}" data-n="${e.n}" style="left:${X(b)};width:calc(${(100 / mx).toFixed(2)}% - 1px);height:${Math.max(8, e.n / hm * 92).toFixed(0)}%"></i>`).join('') + `<s style="left:${X(g.med)}"></s>`;
  };
  const dots = g => {                                             // 數值相近的點錯開成三排，避免整個疊住
    if (g.a.length > 40) return hist(g);
    const lanes = [-1e9, -1e9, -1e9];
    return g.a.slice().sort((p, q) => p.cf - q.cf).map(r => {
      const x = r.cf / mx * 100; let li = lanes.findIndex(v => x - v >= 2.2); if (li < 0) li = lanes.indexOf(Math.min(...lanes)); lanes[li] = x;
      return `<button type="button" class="odot ${tcls(r.type)}" data-k="${esc(r.k)}" style="left:${x.toFixed(1)}%;top:${25 + li * 25}%" aria-label="${esc(r.name + ' ' + r.cf.toFixed(1) + '%')}"></button>`;
    }).join('') + `<s style="left:${X(g.med)}"></s>`;
  };
  return `<div class="oaxis"><span></span><span class="oticks">${ticks.join('')}</span><span></span></div>` + gs.map(g => {
    const open = OUT.open === g.k, lo = g.a[g.a.length - 1].cf, hi = g.a[0].cf, hh = g.a.map(r => r.v.hh).filter(Boolean), sp = mkSpec(g.k);
    const sub = T(isSamp() ? 'outGrpS' : turb ? 'outGrpT' : 'outGrp')(g.a.length, g.med.toFixed(1), lo.toFixed(1), hi.toFixed(1)) + (sp ? ' · ' + sp : '') + (hh.length ? ' · ' + T('dimHub') + ' ' + (Math.min(...hh) === Math.max(...hh) ? hh[0] : Math.min(...hh) + '–' + Math.max(...hh)) + ' m' : '');
    const gmx = Math.max(...g.a.map(r => r.cf));
    g.a.forEach((r, i) => { r.rank = i + 1; });
    const shown = open ? (OUT.all ? g.a : g.a.slice(0, OUT_LIMIT)) : [];
    return `<div class="omod${open ? ' open' : ''}" data-m="${esc(g.k)}"><div class="omh"><span class="onm"><b>${esc(g.m)}</b><small>${esc(sub)}</small></span>` +
      `<span class="odots${g.a.length > 40 ? ' oh' : ''}">${dots(g)}</span><button type="button" class="oexp" aria-expanded="${open}" aria-label="${esc(T(turb ? 'outExpandT' : 'outExpand'))}">${open ? '▴' : '▾'}</button></div>` +
      (open ? '<div class="omb">' + shown.map(r => outRow(r, 'cf', gmx, g.med)).join('') + (shown.length < g.a.length ? `<button type="button" class="omore">${esc(T(turb ? 'relMoreT' : 'relMore')(WW.int(g.a.length)))}</button>` : '') + '</div>' : '') + '</div>';
  }).join('');
}
function wireOutList(el) {
  const go = k => {
    const r = outRowMap[k]; if (!r) return;
    if (r.t) { $('g-modal').classList.remove('show'); selectTurb(r); return; }      // 丹麥單部風機：飛到那部風機
    if (!r.f) return; $('g-modal').classList.remove('show'); selectFarm(r.f);
  };
  el.querySelectorAll('.orow').forEach(b => b.onclick = () => go(b.dataset.k));
  const refill = () => { const rows = curRows(); fillOutList(el, rows, median(rows.map(r => r.cf))); };
  const more = el.querySelector('.omore'); if (more) more.onclick = () => { OUT.all = true; refill(); };
  el.querySelectorAll('.omh').forEach(h => h.onclick = e => {
    if (e.target.closest('.odot')) return;
    const m = h.parentNode.dataset.m; OUT.open = OUT.open === m ? null : m; OUT.all = false;
    refill();
    const g = el.querySelector('.omod.open'); if (g) g.scrollIntoView({ block: 'nearest' });
  });
  const tip = el.querySelector('.otip');
  el.querySelectorAll('.odot').forEach(d => {
    d.onclick = e => { e.stopPropagation(); go(d.dataset.k); };
    const show = () => {
      const r = outRowMap[d.dataset.k]; if (!r) return;
      tip.innerHTML = '<b>' + esc(r.name) + '</b> · ' + r.cf.toFixed(1) + '% · ' + esc(outGenTxt(r)) + '<br><small>' + esc([r.v.proj || null, fmtMW(r.v.mw), r.v.hh ? T('dimHub') + ' ' + r.v.hh + ' m' : null].filter(Boolean).join(' · ')) + '</small>';
      const a = d.getBoundingClientRect(), b = el.getBoundingClientRect();
      tip.style.display = 'block';
      tip.style.left = clamp(a.left + a.width / 2 - b.left - tip.offsetWidth / 2, 0, b.width - tip.offsetWidth) + 'px';
      tip.style.top = (a.top - b.top - tip.offsetHeight - 6) + 'px';
    };
    d.onpointerenter = show; d.onfocus = show;
    d.onpointerleave = d.onblur = () => { tip.style.display = 'none'; };
  });
  el.querySelectorAll('.ohist').forEach(d => {                    // 分布的格子：滑過顯示區間與部數
    d.onpointerenter = () => {
      tip.innerHTML = esc(T('outBin')(+d.dataset.b, +d.dataset.n));
      const a = d.getBoundingClientRect(), b = el.getBoundingClientRect();
      tip.style.display = 'block';
      tip.style.left = clamp(a.left + a.width / 2 - b.left - tip.offsetWidth / 2, 0, b.width - tip.offsetWidth) + 'px';
      tip.style.top = (a.top - b.top - tip.offsetHeight - 6) + 'px';
    };
    d.onpointerleave = () => { tip.style.display = 'none'; };
  });
}
/* 丹麥單部風機：飛到那部風機，卡片列出規格與各年實測（沒有對應的本站風場紀錄，不畫標記） */
function selectTurb(r) {
  setPlaying(false); if (TOUR) tourEnd(false);
  if (byIso.DNK && S.region !== 'DNK') setRegion('DNK', true);
  focusFarm = null; focusPort = null; focusEvent = null; updateClusters(0, true);
  flyToLonLat(r.ll[1], r.ll[0], 0.2);
  renderCard({ kind: 'turb', r, name: r.v.m || T('turbNoModel'), iso: 'DNK', lat: r.ll[0], lon: r.ll[1], year: r.v.yr, type: r.type });
  syncURL();
}
function turbFacts(r) {
  const ys = Object.keys(r.v.y).sort(), last = ys[ys.length - 1], fy = y => fmtGWh(r.v.y[y][0]) + L('（', ' (') + T('actCf') + ' ' + r.v.y[y][1].toFixed(1) + '%' + L('）', ')');
  const all = turbRows(last), rank = all.filter(x => x.cf > r.v.y[last][1]).length + 1;
  const link = '<span class="fds"><a href="' + esc(TOUT.meta.url) + '" target="_blank" rel="noopener" title="' + esc(T('actSrc').DNK[2]) + '">Energistyrelsen</a></span>';
  const note = (ys.length > 1 ? ys.slice(0, -1).map(y => y + L(' 年 ', ': ') + fy(y)).join(L('；', '; ')) + L('。', '. ') : '') + T('turbNote')(fmtUnit(r.v.mw)) + ' ' + T('turbRank')(last, rank, WW.int(all.length));
  return '<div class="ffacts"><div class="ffact"><b>' + esc(T('actLabel')) + '</b>' + esc(L('：', ': ') + last + L(' 年 ', ': ') + fy(last)) + link +
    ' <button type="button" class="fout" data-out="DKT" data-y="' + last + '" data-k="' + esc(r.k) + '">' + esc(T('outSee')) + '</button><div class="gnote">' + esc(note) + ' ' + esc(T('outCredit')(dkGot()) + L('；', '; ')) +
    '<a href="' + DK_TERMS + '" target="_blank" rel="noopener">' + esc(T('outTerms')) + '</a></div></div></div>';
}

/* ================= URL state (shareable deep links) ================= */
let urlT = 0;
function stateParams() {
  const p = {};
  if (S.region !== 'WORLD') p.r = S.region;
  if (!S.playing && Math.floor(S.year) !== Y1) p.y = Math.floor(S.year);
  if (S.view !== 'map') p.v = S.view;
  if (S.mode !== 'globe') p.mode = S.mode;
  if (S.layer !== 'both') p.layer = S.layer;
  if (S.flow) p.flow = '1';
  if (S.zones) p.zones = '1';
  if (outShown()) { p.out = OUT.iso + '.' + OUT.view; if (isSamp() && OUT.per !== '90') p.op = OUT.per; }
  if (S.layer === 'fd' && S.fdOnly) p.fdg = S.fdOnly;
  if (focusFarm && !focusFarm.pseudo && cardItem && cardItem.kind === 'farm') p.f = focusFarm.name;
  if (cardItem && cardItem.kind === 'ms') p.ms = cardItem.m.name;
  if (focusPort && cardItem && cardItem.kind === 'port') p.port = focusPort.id;
  if (focusEvent && cardItem && cardItem.kind === 'event') p.ev = focusEvent.id;
  if (SQ.q) p.q = SQ.q;                              // 搜尋與篩選也寫進網址，可分享
  if (SQ.st.length) p.fst = SQ.st.join(',');
  if (SQ.ty.length) p.fty = SQ.ty.join(',');
  if (SQ.min) p.fmin = SQ.min;
  if (SQ.y0 || SQ.y1) p.fy = (SQ.y0 || '') + '-' + (SQ.y1 || '');
  return p;
}
function syncURL() {
  if (!active || WW.currentPage() !== 'global') return;
  clearTimeout(urlT);
  const at = location.hash;
  urlT = setTimeout(() => {
    if (!active || WW.currentPage() !== 'global' || location.hash !== at) return;     // 250 ms 內已換頁或開了別的深連結：不可覆寫
    const h = WW.hashFor('global', null, stateParams()); if (location.hash !== h) history.replaceState(null, '', h);
  }, 250);
}
let pendingParams = null;
function applyParams(p, fromFarms) {
  if (!p) return;
  if (TOUR && p.tour !== '1' && !STORIES[p.tour]) tourEnd(false);     // 導覽中打開分享連結（或按上一頁）：結束導覽，與點地球、換範圍、搜尋一致
  if (p.base && ['relief', 'sat', 'plain', 'wind'].includes(p.base)) setBase(p.base);
  if (p.mode === 'flat' || p.mode === 'globe') setMode(p.mode);
  if (p.v && ['map', 'split', 'bars'].includes(p.v)) setView(p.v);
  if (p.layer && ['both', 'on', 'off', 'fd'].includes(p.layer)) { S.layer = p.layer; $('g-layerSel').value = p.layer; layerChanged(); updateBars(true); farmLayerDirty = true; }
  S.fdOnly = S.layer === 'fd' && FD_GROUPS.includes(p.fdg) ? p.fdg : null;
  if (p.pipe != null) togglePipe(p.pipe !== '0');
  if (p.flow != null && (p.flow === '1') !== !!S.flow) toggleFlow(p.flow === '1');
  if ((p.zones === '1') !== !!S.zones && !LITE) toggleZones(p.zones === '1');
  if (p.r && !fromFarms) setRegion(p.r);
  if (p.y && !isNaN(+p.y)) { S.year = clamp(+p.y, Y0, Y1); syncYearUI(); }
  else if (!fromFarms && p.play !== '1') { S.year = Y1; syncYearUI(); }     // 連結省略 y ＝ 最新年份（見 stateParams）
  if (p.ms) {
    const m = D.milestones.find(x => x.name === p.ms) || D.milestones.find(x => x.name.toLowerCase().startsWith(String(p.ms).toLowerCase()));
    if (m) { if (!farmsReady) { pendingParams = { ms: p.ms }; } openStop(msStop(m)); }
  }
  if (p.f) {
    if (!farmsReady) { pendingParams = Object.assign(pendingParams || {}, { f: p.f }); }
    else { const f = D.farms.find(x => x.name === p.f && x.src === 0) || D.farms.find(x => x.name === p.f) || D.farms.find(x => x.name.toLowerCase().startsWith(String(p.f).toLowerCase())); if (f) selectFarm(f); }
  }
  if (!fromFarms) {                          // 網址即狀態：套用連結裡的搜尋條件，連結沒有就清空
    const had = fsActive();
    SQ.q = String(p.q || '').slice(0, 100);
    SQ.st = String(p.fst || '').split(',').filter(k => SQ_ST.includes(k));
    SQ.ty = String(p.fty || '').split(',').filter(k => SQ_TY.includes(k));
    SQ.min = SQ_MIN.includes(+p.fmin) ? +p.fmin : 0;
    const fy = String(p.fy || '').split('-'); SQ.y0 = clamp(+fy[0] || 0, 0, 2100); SQ.y1 = clamp(+fy[1] || 0, 0, 2100);
    if (had || fsActive()) {
      fsRev++; fsTokens = fold(SQ.q).split(/\s+/).filter(Boolean); SQ.limit = 200; farmLayerDirty = true; hudCache = '';
      if (fsActive() && !p.f && !p.ms && !p.port && !p.ev) { expandPanel(); setPanelTab('farms'); } else renderFarmList();   // 分享的搜尋連結：直接看到結果
    }
  }
  if (p.port) { if (!portsReady) pendingPort = p.port; else { const pt = PORTS.find(x => x.id === p.port); if (pt) selectPort(pt); } }
  if (p.ev) { if (!eventsReady) pendingEvent = p.ev; else { const e = EVENTS.find(x => x.id === p.ev); if (e) selectEvent(e); } }
  if (p.out) { const [oi, ov] = String(p.out).split('.'); openOutput({ iso: oi, view: ov, per: OUT_PER.includes(p.op) ? p.op : '90' }); }
  if (p.play === '1') { if (!p.y) S.year = Y0; setPlaying(true); }
  if (p.tour === '1' || STORIES[p.tour]) { const k = STORIES[p.tour] ? p.tour : null; if (farmsReady) tourStart(k); else pendingParams = Object.assign(pendingParams || {}, { tour: p.tour }); }
}

/* ================= UI wiring ================= */
function wireUI() {
  labelsEl = $('g-labels');
  controls.addEventListener('start', () => { S.dragging = true; camTween = null; if (TOUR && !TOUR.paused) tourPause(true); });
  controls.addEventListener('end', () => { S.dragging = false; });
  canvas.addEventListener('mousemove', ev => {
    if (ev.buttons) { hideTip(); return; }
    const h = pick(ev), pane = $('g-mapPane');
    if (!h) { hideTip(); canvas.style.cursor = 'grab'; return; }
    canvas.style.cursor = 'pointer';
    const key = h.farm ? 'f' + h.farm.name + h.farm.lat : h.ms ? 'm' + h.ms.name : 'c' + h.country.iso;
    if (key === hoverKey) { moveTip(ev, pane); return; }
    hoverKey = key; clearTimeout(hoverTimer);
    if (h.farm) {
      showTip(ev, tipFarm(h.farm), pane);
      const f = h.farm;
      hoverTimer = setTimeout(() => { itemPhoto(farmItem(f)).then(p => { if (hoverKey === key && p) { $('g-tip').innerHTML = tipFarm(f, p); } }); }, 350);
    } else if (h.ms) showTip(ev, tipMs(h.ms), pane);
    else showTip(ev, tipCountry(h.country), pane);
  });
  canvas.addEventListener('mouseleave', hideTip);
  let downAt = null;
  canvas.tabIndex = 0;              // 點過地圖後，空白鍵／方向鍵等快捷鍵即可使用
  canvas.addEventListener('pointerdown', ev => { downAt = { x: ev.clientX, y: ev.clientY, t: performance.now() }; canvas.focus({ preventScroll: true }); });
  canvas.addEventListener('pointerup', ev => {
    if (!downAt) return; const d = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y), dtm = performance.now() - downAt.t; downAt = null;
    if (d > 6 || dtm > 600) return;
    hideTip();
    if (TOUR) { tourEnd(false); }
    const h = pick(ev);
    if (h && h.farm) { selectFarm(h.farm); return; }
    if (h && h.ms) { openStop(msStop(h.ms)); return; }
    if (h && h.country) { closeCard(); setRegion(h.country.iso); return; }
    const g = groundAt(ev); if (!g) return;
    const iso = countryAt(g.lon, g.lat);
    if (iso && iso !== S.region && byIso[iso]) { closeCard(); setRegion(iso); return; }
    const alt = curAlt(); flyToLonLat(g.lon, g.lat, Math.max(S.mode === 'globe' ? G_MIN_ALT : 0.2, alt * 0.45), 1.1);
  });
  $('g-infoCard').querySelector('.gx').onclick = () => { if (TOUR) tourEnd(); closeCard(); };
  const tb = $('g-tourBar');
  tb.querySelector('.tprev').onclick = () => TOUR && tourShowStop(TOUR.i - 1);
  tb.querySelector('.tnext').onclick = () => TOUR && tourShowStop(TOUR.i + 1);
  tb.querySelector('.tp').onclick = () => TOUR && tourPause(!TOUR.paused);
  tb.querySelector('.tx').onclick = () => { tourEnd(false); closeCard(); };
  $('g-btnTour').onclick = e => { e.stopPropagation(); if (TOUR) { tourEnd(false); closeCard(); } else tourMenu(); };
  document.addEventListener('click', e => { const m = $('g-tourMenu'); if (m && !m.hidden && !m.contains(e.target)) m.hidden = true; });
  $('g-tabProf').onclick = () => setPanelTab('prof'); $('g-tabMs').onclick = () => setPanelTab('ms'); $('g-tabFarms').onclick = () => setPanelTab('farms'); $('g-tabPipe').onclick = () => setPanelTab('pipe'); $('g-tabPorts').onclick = () => setPanelTab('ports'); $('g-tabEvents').onclick = () => setPanelTab('events');
  if (LITE) setPanelTab('farms');
  $('g-msToggle').onclick = e => { const p = $('g-msPanel'); p.classList.toggle('collapsed'); e.currentTarget.textContent = p.classList.contains('collapsed') ? '+' : '–'; };
  if (window.innerWidth < 700) { $('g-msPanel').classList.add('collapsed'); $('g-msToggle').textContent = '+'; }
  // 手機精簡版：速度與顯示選單搬到（可橫向捲動的）工具列，播放列只留播放鍵、年份與滑桿 · phone: move the two selects into the toolbar
  if (window.innerWidth <= 640) { const top = $('g-top'), src = $('g-btnSources'); ['g-speedSel', 'g-layerSel'].forEach(id => top.insertBefore($(id).parentNode, src)); }
  $('g-play').onclick = () => setPlaying(!S.playing);
  $('g-slider').oninput = () => { if (TOUR) tourPause(true); S.year = parseFloat($('g-slider').value); syncYearUI(); };
  $('g-slider').onchange = () => syncURL();
  $('g-speedSel').onchange = e => { S.speed = parseFloat(e.target.value); };
  $('g-layerSel').onchange = e => { S.layer = e.target.value; if (S.layer !== 'fd') S.fdOnly = null; layerChanged(); updateBars(true); updateClusters(0, true); farmLayerDirty = true; renderPipeList(true); if (cardItem && cardItem.kind === 'farm') renderCard(cardItem); syncURL(); };
  $('g-densSel').onchange = e => { S.density = +e.target.value; };
  $('g-regionSel').onchange = e => { if (TOUR) tourEnd(false); closeCard(); setRegion(e.target.value); };
  $('g-baseSel').onchange = e => setBase(e.target.value);
  $('g-btnFlow').onclick = () => toggleFlow();
  $('g-btnZones').onclick = () => toggleZones();
  $('g-btnOut').onclick = () => openOutput({ iso: OUT_ISO.includes(S.region) ? S.region : OUT.iso });
  $('g-btnPipe').onclick = () => { togglePipe(); if (S.pipe && S.year < Y1 - 0.02 && !S.playing) { S.year = Y1; syncYearUI(); } if (S.pipe) setPanelTab('pipe'); };
  $('g-btnPipe').classList.toggle('active', S.pipe); $('g-btnPipe').setAttribute('aria-pressed', S.pipe ? 'true' : 'false');
  $('g-btnPorts').onclick = () => { togglePorts(); if (S.ports) setPanelTab('ports'); };
  togglePorts(S.ports);
  $('g-btnEvents').onclick = () => { toggleEvents(); if (S.events) setPanelTab('events'); };
  toggleEvents(S.events);
  $('g-btnSearch').onclick = openSearch;
  document.querySelectorAll('#g-viewSeg button').forEach(b => b.onclick = () => setView(b.dataset.view));
  document.querySelectorAll('#g-modeSeg button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('g-btnRotate').onclick = e => { S.rotate = !S.rotate; e.currentTarget.classList.toggle('active', S.rotate); e.currentTarget.setAttribute('aria-pressed', S.rotate ? 'true' : 'false'); };
  $('g-btnSources').onclick = showSources;
  $('g-modalClose').onclick = () => { $('g-modal').classList.remove('show'); syncURL(); };
  $('g-modal').onclick = e => { if (e.target.id === 'g-modal') { e.target.classList.remove('show'); syncURL(); } };
  window.addEventListener('keydown', e => {
    if (!active || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') {        // Esc 不論焦點在哪都有效：先關來源說明，再關資訊卡／導覽
      if ($('g-modal').classList.contains('show')) { const wasOut = outShown(); $('g-modal').classList.remove('show'); $('g-' + (wasOut ? 'btnOut' : 'btnSources')).focus(); syncURL(); return; }
      if (TOUR) tourEnd(false); if (cardItem) closeCard(); return;
    }
    const tg = e.target.tagName;
    if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA' || tg === 'BUTTON' || tg === 'A') return;
    if (e.key === '/') { e.preventDefault(); openSearch(); return; }
    if (e.code === 'Space') { e.preventDefault(); if (TOUR) tourPause(!TOUR.paused); else setPlaying(!S.playing); }
    if (e.key === 'ArrowRight') { if (TOUR) tourShowStop(TOUR.i + 1); else { S.year = Math.min(Y1, Math.floor(S.year) + 1); syncYearUI(); } }
    if (e.key === 'ArrowLeft') { if (TOUR) tourShowStop(TOUR.i - 1); else { S.year = Math.max(Y0, Math.ceil(S.year) - 1); syncYearUI(); } }
  });
}

/* ================= page lifecycle ================= */
WW.globe = {
  ready,
  enter(r) {
    active = true;
    ready.then(() => {
      if (!active) return;
      if (loadingEl && loadingEl.parentNode) loadingEl.remove();
      resize(); start();
      clearInterval(intlTimer);
      if (!LITE) { loadIntl(); intlTimer = setInterval(() => { if (active) loadIntl(); }, 5 * 60e3); }   // 每 5 分鐘重抓澳洲、加拿大即時資料
      const p = r && r.params ? r.params : {};
      const hasParams = Object.keys(p).length > 0;
      if (hasParams) applyParams(p);
      else if (firstEnter) setTimeout(() => { if (active && !TOUR && S.year === Y0 && !S.playing) setPlaying(true); }, 900);
      if (!hasParams && fsActive()) syncURL();          // 回到本頁時網址補上仍有效的搜尋條件
      firstEnter = false;
      if (lang !== WW.lang) { lang = WW.lang; applyI18n(); }
    }, e => {
      console.error(e);
      if (loadingEl) loadingEl.textContent = L('全球資料載入失敗，請檢查網路後重新整理。', 'Global data failed to load. Check your connection and reload.');
    });
  },
  leave() { active = false; clearTimeout(urlT); clearInterval(intlTimer); intlTimer = null; stop(); setPlaying(false); if (TOUR) tourPause(true); hideTip(); },
  api: () => ({ S, D, setRegion, selectFarm, tourStart, setMode, setBase, flyToLonLat, curAlt, FL, clusters, get portArcs() { return portArcs; }, get TOUR() { return TOUR; },
    cam: () => { const f = focusLonLat(); return { lon: +f.lon.toFixed(3), lat: +f.lat.toFixed(3), alt: +curAlt().toFixed(1), frames: S.frames || 0, rotate: S.rotate }; },
    patchState: () => ({ info: patchInfo, tiles: tileAttrOn, visible: !!(patch && patch.visible), cache: tileCache.size, ok: [...tileCache.values()].filter(t => t.ok).length }) })
};
WW.onLang(l => { lang = l; if (D) { applyI18n(); updateBars(true); if (cardItem) renderCard(cardItem); } });
if (WW.live) WW.live.onUpdate(() => { farmLayerDirty = true; if (active && panelTab === 'prof' && S.region === 'TWN') renderProfile(); if (active && cardItem && cardItem.iso === 'TWN') refreshLiveBox(); });
})();
