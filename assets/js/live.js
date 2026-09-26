/* 風電風情 · live.js — 台灣風電即時（台電開放資料＋中央氣象署），對齊台電 genary 風力四類三十機組
   即時資料：DATA_ENDPOINT（GitHub Actions 每 15 分鐘由 taipower_wind_scraper.py 產生的 wind_realtime.json）。
   未連線時：以 6/29 16:13 台電實際快照為基準，做模擬浮動（已明確標示，非真實即時）。
   資料端點與政府開放資料的對接（8931 即時、37331 歷史、19995 供需、CWA 風速）全部沿用，未更動。 */
(function () {
'use strict';
const WW = window.WW;
const DATA_ENDPOINT = "./wind_realtime.json";   // 例如 "https://your-host/wind_realtime.json"
const HIST_ENDPOINT = "./wind_history.json";
const GRID_ENDPOINT = "./grid_status.json";
const ARCH_ENDPOINT = "./wind_archive_daily.json";

/* tp=台電 genary 機組名稱(用於即時對應) ; cap=裝置容量MW(null=台電未列,註10)
   snap=6/29 16:13 實際出力MW ; grp: on-tpc|on-ppa|off-tpc|off-ppa */
const FARMS=[
 // ===== 陸域風力 · 台電自有 =====
 {id:"guanyuan",tp:"觀園",name:"觀園風場",grp:"on-tpc",cap:30.0,snap:8.5,lat:25.03,lng:121.07,
  dev:"台灣電力公司",site:"桃園市觀音、大園沿海",model:"陸域機組（2–3 MW 級）",unit:"2–3 MW",cod:"早期陸域",
  tl:[["—","台電西海岸陸域風場之一","done"]],note:"台電自有陸域風場。座標為概略位置。"},
 {id:"taichungport",tp:"台中港",name:"台中港風場",grp:"on-tpc",cap:35.0,snap:5.8,lat:24.29,lng:120.53,
  dev:"台灣電力公司",site:"台中港北堤",model:"陸域機組（2–3 MW 級）",unit:"2–3 MW",cod:"早期陸域",
  tl:[["—","台中港區陸域風場","done"]],note:"座標為概略位置。"},
 {id:"wanggong",tp:"王功",name:"王功風場",grp:"on-tpc",cap:23.0,snap:6.0,lat:23.99,lng:120.31,
  dev:"台灣電力公司",site:"彰化縣芳苑鄉王功",model:"陸域機組（2–3 MW 級）",unit:"2–3 MW",cod:"早期陸域",
  tl:[["—","彰化沿海陸域風場","done"]],note:"座標為概略位置。"},
 {id:"changgong",tp:"彰工",name:"彰工風場",grp:"on-tpc",cap:86.2,snap:10.9,lat:24.13,lng:120.45,
  dev:"台灣電力公司",site:"彰化縣線西、伸港（彰濱工業區）",model:"陸域機組（2–3 MW 級）",unit:"2–3 MW",cod:"早期陸域",
  tl:[["—","彰濱工業區陸域風場，台電陸域容量最大者之一","done"]],note:"座標為概略位置。"},
 {id:"yunmai",tp:"雲麥",name:"雲麥風場",grp:"on-tpc",cap:46.0,snap:9.9,lat:23.79,lng:120.24,
  dev:"台灣電力公司",site:"雲林縣麥寮",model:"陸域機組（2–3 MW 級）",unit:"2–3 MW",cod:"早期陸域",
  tl:[["—","雲林麥寮沿海陸域風場","done"]],note:"座標為概略位置。"},
 {id:"sihu",tp:"四湖",name:"四湖風場",grp:"on-tpc",cap:28.0,snap:7.9,lat:23.64,lng:120.22,
  dev:"台灣電力公司",site:"雲林縣四湖",model:"陸域機組（2–3 MW 級）",unit:"2–3 MW",cod:"早期陸域",
  tl:[["—","雲林四湖沿海陸域風場","done"]],note:"座標為概略位置。"},
 {id:"tpc-other-on",tp:"其它台電自有",name:"其它台電自有（陸域）",grp:"on-tpc",cap:84.7,snap:23.6,lat:24.80,lng:120.90,agg:true,
  dev:"台灣電力公司",site:"新竹香山、桃園、其他多處",model:"多型號彙總",unit:"2–3 MW",cod:"—",
  tl:[["—","台電其餘陸域風場彙總（香山、大潭等多處）","done"]],note:"此為多座風場彙總，非單一風場；座標僅示意。"},

 // ===== 陸域風力 · 購電（民營） =====
 {id:"dapeng",tp:"苗栗大鵬",name:"苗栗大鵬風場",grp:"on-ppa",cap:42.0,snap:12.2,lat:24.52,lng:120.72,
  dev:"民營購電",site:"苗栗後龍、通霄一帶",model:"陸域機組",unit:"2–3 MW",cod:"—",
  tl:[["—","民營陸域風場，售電予台電","done"]],note:"民營風場（購電），開發商以台電購電合約揭露。座標為概略位置。"},
 {id:"luwei",tp:"鹿威彰濱",name:"鹿威彰濱風場",grp:"on-ppa",cap:55.2,snap:7.0,lat:24.05,lng:120.43,
  dev:"民營購電（達德能源 wpd 系統）",site:"彰化彰濱、鹿港",model:"陸域機組",unit:"2–3 MW",cod:"—",
  tl:[["—","彰濱地區民營陸域風場","done"]],note:"民營風場（購電）。座標為概略位置。"},
 {id:"guanwei",tp:"觀威觀音&桃威新屋",name:"觀威觀音 & 桃威新屋",grp:"on-ppa",cap:48.3,snap:14.5,lat:25.00,lng:121.04,
  dev:"民營購電（達德能源 wpd 系統）",site:"桃園觀音、新屋",model:"陸域機組",unit:"2–3 MW",cod:"—",
  tl:[["—","桃園沿海民營陸域風場","done"]],note:"民營風場（購電）。座標為概略位置。"},
 {id:"zhongwei",tp:"中威大安",name:"中威大安風場",grp:"on-ppa",cap:75.9,snap:3.9,lat:24.35,lng:120.57,
  dev:"民營購電（達德能源 wpd 系統）",site:"台中大安",model:"陸域機組",unit:"2–3 MW",cod:"—",
  tl:[["—","台中大安沿海民營陸域風場","done"]],note:"民營風場（購電）。座標為概略位置。"},
 {id:"chuangwei",tp:"創維風",name:"創維風場",grp:"on-ppa",cap:49.2,snap:24.6,lat:24.20,lng:120.50,
  dev:"民營購電",site:"中部沿海",model:"陸域機組",unit:"2–3 MW",cod:"—",
  tl:[["—","民營陸域風場","done"]],note:"民營風場（購電）。座標為概略位置，待校正。"},
 {id:"xinyuan",tp:"新源崙背",name:"新源崙背風場",grp:"on-ppa",cap:25.2,snap:17.7,lat:23.76,lng:120.35,
  dev:"民營購電",site:"雲林崙背",model:"陸域機組",unit:"2–3 MW",cod:"—",
  tl:[["—","雲林崙背民營陸域風場","done"]],note:"民營風場（購電）。座標為概略位置。"},
 {id:"changpin",tp:"彰品風",name:"彰品風場",grp:"on-ppa",cap:null,snap:0.0,lat:24.00,lng:120.40,pending:true,
  dev:"民營購電",site:"彰化",model:"陸域機組",unit:"—",cod:"開發中",
  tl:[["—","台電資料註記為尚未列裝置容量（註10）",""]],note:"台電 genary 標示為「-（註10）」，尚未列裝置容量／商轉。座標為概略位置。"},
 {id:"ppa-other-on",tp:"其它購電風力",name:"其它購電風力（陸域）",grp:"on-ppa",cap:178.4,snap:26.3,lat:24.40,lng:120.60,agg:true,
  dev:"民營購電",site:"西海岸多處",model:"多型號彙總",unit:"2–3 MW",cod:"—",
  tl:[["—","其餘民營陸域風場彙總","done"]],note:"此為多座民營風場彙總，非單一風場；座標僅示意。"},

 // ===== 離岸風力 · 台電自有 =====
 {id:"offshore1",tp:"離岸一期",name:"台電離岸一期",grp:"off-tpc",cap:109.2,snap:75.0,lat:24.10,lng:120.30,
  dev:"台灣電力公司",site:"彰化芳苑外海",model:"Hitachi 5.2 MW",unit:"5.2 MW",depth:"約 20 m",dist:"約 8 km",turbines:21,
  cod:"2021",annual:"約 3.6 億度",homes:"約 9 萬戶",
  tl:[["2015/06","環評審查通過","done"],["2018/02","比利時 DEME 與日立團隊得標統包","done"],["2020/01","完成首支水下基礎，台電自建離岸首例","done"],["2021/08","21 部機組完成初始併聯，全台第 2 座商轉離岸風場","done"]],note:""},
 {id:"offshore2",tp:"離岸二期",name:"台電離岸二期",grp:"off-tpc",cap:null,snap:0.9,lat:24.15,lng:120.19,pending:true,
  dev:"台灣電力公司（富崴能源統包）",site:"彰化鹿港外海",model:"9.5 MW 級",unit:"9.5 MW",depth:"37–49 m",dist:"鹿港外海",turbines:31,planned:294.5,
  cod:"預計 2027",annual:"逾 10 億度",homes:"約 27 萬戶",
  tl:[["2018","取得開發資格","done"],["2020/06","富崴能源決標，628.88 億元統包＋運維","done"],["2026","工程進度逾九成，機組陸續安裝中","done"],["2027","規劃全數機組併聯商轉（原規劃 2026 年已延後）",""]],
  note:"富崴能源受通膨與船期延誤影響代墊款增加，經濟部已核准價金調整，工程未受母公司下市影響；完工時程較原規劃延後至 2027 年上半年。"},

 // ===== 離岸風力 · 購電 =====
 {id:"formosa1",tp:"海洋竹南",name:"海洋風場 Formosa 1",grp:"off-ppa",cap:128.0,snap:96.2,lat:24.71,lng:120.85,
  dev:"海洋風電（JERA・麥格理・上緯）",site:"苗栗竹南外海",model:"Siemens SWT 4.0 / 6.0",unit:"4–6 MW",depth:"15–30 m",dist:"2–6 km",turbines:22,
  cod:"2019",annual:"約 4.8 億度",homes:"約 12.8 萬戶",
  tl:[["2013/11","環評通過","done"],["2017/04","示範機組商轉，全台首度離岸風電併網","done"],["2018/06","完成財務結案，全台離岸風電首件專案融資","done"],["2019/12","22 部機組全數商轉，全台首座商業規模離岸風場","done"]],note:"台灣離岸風電起點。"},
 {id:"formosa2",tp:"海能風",name:"海能風場 Formosa 2",grp:"off-ppa",cap:376.0,snap:308.3,lat:24.78,lng:120.73,
  dev:"海能風力發電（JERA 等）",site:"苗栗外海",model:"Siemens Gamesa SG 8.0-167 DD",unit:"8 MW",depth:"20–40 m",dist:"4–10 km",turbines:47,
  cod:"2023",annual:"約 14 億度",homes:"約 38 萬戶",
  tl:[["2018/03","環評大會通過","done"],["2019/10","完成財務結案，約 620 億元聯貸","done"],["2022/07","首度送電，機組併網試運轉","done"],["2023/09","47 部機組全數正式商轉","done"]],note:""},
 {id:"wo1",tp:"沃一風",name:"大彰化一階（沃一風）",grp:"off-ppa",cap:605.2,snap:470.4,lat:24.01,lng:120.05,
  dev:"沃旭能源 Ørsted",site:"彰化外海 35–60 km",model:"Siemens Gamesa SG 8.0-167",unit:"8 MW",depth:"30–45 m",dist:"35–60 km",turbines:"—",
  cod:"2024",annual:"—",homes:"—",
  tl:[["2018/02","四案通過環評大會審查","done"],["2019/04","沃旭宣布最終投資決定（FID）","done"],["2021/02","取得施工許可，海上施工開始","done"],["2024/04","900 MW 全數完工併聯，啟用時為亞太最大運轉中離岸風場","done"]],
  note:"大彰化東南及西南第一階段（沃旭）併網點之一；與沃二風合計 900 MW。"},
 {id:"wo2",tp:"沃二風",name:"大彰化一階（沃二風）",grp:"off-ppa",cap:294.8,snap:211.1,lat:24.03,lng:120.00,
  dev:"沃旭能源 Ørsted",site:"彰化外海 35–60 km",model:"Siemens Gamesa SG 8.0-167",unit:"8 MW",depth:"30–45 m",dist:"35–60 km",turbines:"—",
  cod:"2024",annual:"—",homes:"—",
  tl:[["2019/04","沃旭宣布最終投資決定（FID）","done"],["2024/04","大彰化一階 900 MW 全數商轉，啟用時為亞太最大","done"]],
  note:"大彰化東南及西南第一階段（沃旭）併網點之一；與沃一風合計 900 MW。"},
 {id:"wo4",tp:"沃四風",name:"大彰化西北（沃四風）",grp:"off-ppa",cap:null,snap:374.2,lat:23.96,lng:119.93,pending:true,
  dev:"沃旭能源 Ørsted",site:"彰化外海",model:"Siemens Gamesa SG 14-236 DD",unit:"14 MW",depth:"30–45 m",dist:"35–60 km",turbines:"—",planned:"—",
  cod:"開發中",annual:"—",homes:"—",
  tl:[["2023/03","920 MW 計畫（2b&4）最終投資決定（FID）","done"],["2025/02","啟動 920 MW 海上建置工程","done"],["2025/07","首座風機併網，全球首座專供台積電之離岸風場","done"],["2026","規劃第三季全數商轉",""]],
  note:"台電 genary 仍標示「-（註10）」。與沃南風為同一 920 MW 計畫（大彰化 2b&4）之不同並網計量點，共用同一開發時程。"},
 {id:"wonan",tp:"沃南風",name:"大彰化西南二階（沃南風）",grp:"off-ppa",cap:null,snap:0.0,lat:23.93,lng:119.97,pending:true,
  dev:"沃旭能源 Ørsted",site:"彰化外海",model:"Siemens Gamesa SG 14-236 DD",unit:"14 MW",depth:"30–45 m",dist:"35–60 km",turbines:"—",planned:"—",
  cod:"開發中",annual:"—",homes:"—",
  tl:[["2020/07","台積電與沃旭簽署 20 年購售電合約，承購 920 MW 全部發電量","done"],["2023/03","920 MW 計畫（2b&4）最終投資決定（FID）","done"],["2026/01","66 座風機全數安裝完成","done"],["2026","規劃第三季全數商轉",""]],
  note:"台電 genary 仍標示「-（註10）」。與沃四風為同一 920 MW 計畫（大彰化 2b&4）之不同並網計量點，共用同一開發時程；全球首座專為單一企業（台積電）供電之離岸風場計畫。"},
 {id:"fang1",tp:"芳一風",name:"彰芳一期（芳一風）",grp:"off-ppa",cap:96.0,snap:62.2,lat:24.09,lng:120.16,
  dev:"哥本哈根基礎建設基金 CIP",site:"彰化外海",model:"Vestas V174-9.5MW",unit:"9.5 MW",depth:"30–40 m",dist:"30–45 km",turbines:"—",
  cod:"2022–2023",annual:"—",homes:"—",
  tl:[["2018/01","環評審查結論公告","done"],["2020/02","完成財務結案，約 30 億美元","done"],["2022/11","首度發電併網","done"],["2024/05","一、二期合計完工啟用，CIP 亞太首座完工風場","done"]],
  note:"彰芳暨西島計畫（CIP）一期；與芳二風合計約 595 MW。"},
 {id:"fang2",tp:"芳二風",name:"彰芳二期暨西島（芳二風）",grp:"off-ppa",cap:499.2,snap:248.1,lat:24.06,lng:120.12,
  dev:"哥本哈根基礎建設基金 CIP",site:"彰化外海",model:"Vestas V174-9.5MW",unit:"9.5 MW",depth:"30–40 m",dist:"30–45 km",turbines:"—",
  cod:"2024",annual:"—",homes:"—",
  tl:[["2020/02","完成財務結案，約 30 億美元","done"],["2023/07","62 座水下基礎全數安裝完成","done"],["2024/05","彰芳暨西島完工啟用，CIP 亞太首座完工風場","done"]],
  note:"彰芳暨西島計畫（CIP）二期含西島；與芳一風合計約 595 MW。"},
 {id:"yunhu",tp:"允湖",name:"允能（允湖）",grp:"off-ppa",cap:320.0,snap:7.8,lat:23.87,lng:120.13,
  dev:"達德能源 wpd",site:"雲林外海",model:"Siemens Gamesa SG 8.0-167",unit:"8 MW",depth:"7–35 m",dist:"約 8 km",turbines:"—",
  cod:"2025",annual:"—",homes:"—",
  tl:[["2019/05","完成 940 億元專案融資","done"],["2020/12","首支水下基礎安裝，海事工程啟動","done"],["2022/08","台灣首座國產化達成率逾 100% 離岸風場","done"],["2025/08","640 MW 全數機組正式全面商轉","done"]],
  note:"允能風場（達德 wpd）併網點之一；與允西合計 640 MW。"},
 {id:"yunxi",tp:"允西",name:"允能（允西）",grp:"off-ppa",cap:320.0,snap:146.2,lat:23.82,lng:120.07,
  dev:"達德能源 wpd",site:"雲林外海",model:"Siemens Gamesa SG 8.0-167",unit:"8 MW",depth:"7–35 m",dist:"約 8 km",turbines:"—",
  cod:"2025",annual:"—",homes:"—",
  tl:[["2021/04","首支風機完成安裝","done"],["2024/10","最後一支風機安裝完成，80 機全數就位","done"],["2025/08","允能 640 MW 全數商轉","done"]],
  note:"允能風場（達德 wpd）併網點之一；快照時段出力達 210 MW，為當下全台風電主力。"},
 {id:"zhongneng",tp:"中能風",name:"中能風場 Zhong Neng",grp:"off-ppa",cap:294.5,snap:206.5,lat:24.12,lng:120.21,
  dev:"中能發電（中鋼集團）",site:"彰化外海",model:"Vestas V174-9.5MW",unit:"9.5 MW",depth:"約 35 m",dist:"約 30 km",turbines:31,
  cod:"2024",annual:"約 11 億度",homes:"約 28 萬戶",
  tl:[["2018/12","中鋼與丹麥 CIP 合資成立","done"],["2021/06","完成 452 億元專案融資","done"],["2023/03","水下基礎海事工程開工","done"],["2024/08","31 座風機全數安裝完成","done"]],note:"中鋼集團主導，帶動國產化供應鏈。"},
 {id:"longA",tp:"龍A風",name:"海龍（龍A風）",grp:"off-ppa",cap:null,snap:254.6,lat:23.90,lng:119.90,pending:true,
  dev:"海龍（Northland・三井・Gentari）",site:"彰化外海 45–70 km",model:"Siemens Gamesa SG 14-222 DD",unit:"14 MW",depth:"30–55 m",dist:"45–70 km",turbines:"—",planned:"—",
  cod:"開發中",annual:"—",homes:"—",
  tl:[["2023/09","完成最終投資決定與財務結案，約 1,170 億元融資","done"],["2024/04","舉行開工儀式，首階段海事工程展開","done"],["2025/06","首度將綠電併入電網，第一支機組併網","done"],["2025/10","海龍二號全數機組安裝完成","done"]],
  note:"台電 genary 仍標示「-（註10）」。海龍二號及三號計畫（約 1 GW）併網點之一。"},
 {id:"longB",tp:"龍B風",name:"海龍（龍B風）",grp:"off-ppa",cap:null,snap:139.1,lat:23.88,lng:119.87,pending:true,
  dev:"海龍（Northland・三井・Gentari）",site:"彰化外海 45–70 km",model:"Siemens Gamesa SG 14-222 DD",unit:"14 MW",depth:"30–55 m",dist:"45–70 km",turbines:"—",planned:"—",
  cod:"開發中",annual:"—",homes:"—",
  tl:[["2023/09","完成最終投資決定與財務結案","done"],["2025/06","海龍首度併網發電","done"],["2026/03","海龍三號首支機組安裝完成","done"],["2027","據最新報導，全案商轉時程已延至 2027 年（原規劃 2026 年）",""]],
  note:"台電 genary 仍標示「-（註10）」。海龍二號及三號計畫併網點之一；原規劃 2026 年商轉，最新報導顯示已順延。"},
];

const GROUPS=[
 {key:"off-ppa",label:"離岸風力 · 購電",tag:"ppa",cls:"off"},
 {key:"off-tpc",label:"離岸風力 · 台電自有",tag:"tpc",cls:"off"},
 {key:"on-ppa", label:"陸域風力 · 購電",tag:"ppa",cls:"on"},
 {key:"on-tpc", label:"陸域風力 · 台電自有",tag:"tpc",cls:"on"},
];
const isOffshore=f=>f.grp.startsWith("off");

/* 即時機組 ↔ 3D 地球儀（全球資料集）的風場名稱，兩邊互相連結用 */
const GLOBE_FARM={guanyuan:"Dayuan Guanyuan",taichungport:"Taichung Port",wanggong:"Wanggong",changgong:"Changgong (Changbin Xianxi)",
  yunmai:"Yunmai (Mailiao)",sihu:"Sihu",dapeng:"Dapeng (Miaoli Houlong)",luwei:"Changbin Lukang (incl. Lunwei)",guanwei:"Guanyin",
  zhongwei:"Taichung (Da'an/Dajia)",chuangwei:"Chuangwei wind farm",xinyuan:"Yunlin Lunbei",offshore1:"Taipower Offshore Phase 1 (Changhua)",
  offshore2:"Taipower Offshore Phase 2",formosa1:"Formosa 1 Phase 2",formosa2:"Formosa 2",wo1:"Greater Changhua 1 & 2a",wo2:"Greater Changhua 1 & 2a",
  wo4:"Greater Changhua 2b & 4",wonan:"Greater Changhua 2b & 4",fang1:"Changfang & Xidao",fang2:"Changfang & Xidao",yunhu:"Yunlin",yunxi:"Yunlin",
  zhongneng:"Zhong Neng",longA:"Hai Long 2 & 3",longB:"Hai Long 2 & 3"};

const t=WW.t;
WW.addI18n({
  loading:{zh:"載入中…",en:"Loading…"},
  live:{zh:"即時",en:"Live"},updatedAt:{zh:"台電",en:"Taipower"},simShort:{zh:"模擬浮動",en:"Simulated"},snapShort:{zh:"離線快照",en:"Offline snapshot"},
  toolbarToggle:{zh:"排序與篩選",en:"Sort & filter"},
  sortBy:{zh:"排序",en:"Sort"},s_output:{zh:"即時出力",en:"Output"},s_ratio:{zh:"可用率",en:"Availability"},
  s_cap:{zh:"裝置容量",en:"Capacity"},s_name:{zh:"名稱",en:"Name"},
  groupBy:{zh:"分組",en:"Group"},g_type:{zh:"依類型",en:"By type"},g_dev:{zh:"依開發商",en:"By developer"},
  f_all:{zh:"全部",en:"All"},f_offshore:{zh:"離岸",en:"Offshore"},f_onshore:{zh:"陸域",en:"Onshore"},
  f_commercial:{zh:"已商轉",en:"Operating"},f_building:{zh:"開發中",en:"In dev."},
  allDev:{zh:"全部開發商",en:"All developers"},allBrand:{zh:"全部廠牌",en:"All turbine makers"},
  allCap:{zh:"全部容量",en:"All sizes"},capL:{zh:"大型 >300MW",en:"Large >300MW"},capM:{zh:"中型 100–300MW",en:"Medium 100–300MW"},capS:{zh:"小型 <100MW",en:"Small <100MW"},
  aria_dev:{zh:"依開發商篩選",en:"Filter by developer"},aria_brand:{zh:"依風機廠牌篩選",en:"Filter by turbine maker"},aria_cap:{zh:"依裝置容量篩選",en:"Filter by capacity"},
  close:{zh:"關閉",en:"Close"},
  windTotal:{zh:"全台風電即時出力",en:"National wind output"},totalCap:{zh:"總裝置容量",en:"Total capacity"},
  overallAvail:{zh:"整體可用率",en:"Overall availability"},co2hr:{zh:"每小時減碳（估算）",en:"CO₂ avoided / hr (est.)"},
  grid_ample:{zh:"供電充裕",en:"Ample supply"},grid_tight:{zh:"供電吃緊",en:"Tight supply"},
  grid_warn:{zh:"供電警戒",en:"Supply warning"},grid_alert:{zh:"限電警戒",en:"Shortage alert"},
  grid_reserve:{zh:"備轉容量率",en:"operating reserve"},
  grid_wind:{zh:"風電此刻貢獻電網",en:"Wind is contributing"},
  grid_src:{zh:"台電電力供需即時報表",en:"Taipower real-time supply-demand"},
  grid_src_daily:{zh:"官方每日資料，非即時，截至",en:"Official daily data, not live, as of"},
  unitsFarms:{zh:"運轉機組／風場",en:"Units / farms generating"},tonHr:{zh:"噸",en:"t"},
  imp_homes:{zh:"可同時供應家庭用電（估算）",en:"Homes powered now (est.)"},imp_share:{zh:"風電佔全國即時發電",en:"Share of national generation"},
  imp_today:{zh:"今日累積發電量",en:"Energy generated today"},imp_trees:{zh:"今日減碳≈種樹年吸碳量",en:"CO₂ cut today ≈ trees/yr"},
  unit_homes:{zh:"萬戶",en:"k homes"},unit_trees:{zh:"棵",en:"trees"},accruing:{zh:"累積中",en:"accruing"},
  wallAll:{zh:"全部",en:"All"},wallFarms:{zh:"座風場 · 即時總出力",en:"farms · live total"},
  lg_high:{zh:"可用率高",en:"High"},lg_mid:{zh:"中",en:"Mid"},lg_low:{zh:"低",en:"Low"},lg_dev:{zh:"開發中",en:"In dev."},
  c_bar:{zh:"排行長條",en:"Ranking"},c_donut:{zh:"出力組成",en:"Output mix"},c_hist:{zh:"長期趨勢",en:"Long-term"},
  cn_bar:{zh:"全部風場依即時出力排名 · 顏色越亮＝可用率越高 · 點一下看詳情",en:"All farms ranked by live output · brighter = higher availability · click for details"},
  cn_donut:{zh:"此刻出力由哪些開發商、哪種類型貢獻",en:"Who is generating right now, by developer and by type"},
  cn_hist:{zh:"官方回溯資料（開放資料集 37331）· 台電自有風力機組小計，不含民營購電 · 季度回溯檔，非即時",en:"Official retrospective data (dataset 37331) · Taipower-owned wind only (excl. IPP) · quarterly archive, not live"},
  hist_loading:{zh:"長期趨勢資料載入中…",en:"Loading long-term data…"},
  hist_none:{zh:"尚無長期存檔資料（backfill 尚未執行或抓取失敗）",en:"No long-term archive yet (backfill not run or fetch failed)"},
  hist_avg:{zh:"單日平均",en:"Daily average"},hist_max:{zh:"單日最大",en:"Daily max"},
  hist_all:{zh:"全部（台電自有）",en:"All (Taipower-owned)"},
  donutDev:{zh:"依開發商",en:"By developer"},donutType:{zh:"依類型（離岸／陸域）",en:"By type (offshore / onshore)"},
  noGen:{zh:"目前沒有發電中的風場 🌙",en:"No farms generating right now 🌙"},noMatch:{zh:"查無符合條件的風場，試試放寬篩選 🔍",en:"No farms match — try relaxing filters 🔍"},
  tpcOwn:{zh:"台電自有",en:"Taipower"},ppa:{zh:"購電",en:"PPA"},devTag:{zh:"開發商",en:"Developer"},
  d_output:{zh:"即時出力",en:"Live output"},d_avail:{zh:"可用率",en:"Availability"},d_cap:{zh:"裝置容量",en:"Capacity"},
  d_status:{zh:"狀態",en:"Status"},d_turbines:{zh:"風機數量",en:"Turbines"},d_unit:{zh:"單機容量",en:"Unit size"},
  d_model:{zh:"風機型號",en:"Turbine model"},d_depth:{zh:"水深",en:"Water depth"},d_dist:{zh:"離岸距離",en:"Dist. offshore"},
  d_annual:{zh:"年發電量",en:"Annual output"},d_homes:{zh:"可供應",en:"Homes"},d_site:{zh:"地點",en:"Location"},d_type2:{zh:"機型",en:"Type"},
  st_run:{zh:"商轉中",en:"Operating"},st_test:{zh:"試運轉（台電未列裝置容量·註10）",en:"Testing (capacity not yet listed)"},st_agg:{zh:"彙總",en:"Aggregate"},
  b_run:{zh:"商轉",en:"Operating"},b_dev:{zh:"試運轉",en:"Testing"},b_agg:{zh:"彙總",en:"Aggregate"},
  timeline:{zh:"開發與營運歷程",en:"Development timeline"},
  r_6h:{zh:"近6時",en:"6 h"},r_24h:{zh:"近24時",en:"24 h"},r_7d:{zh:"近7日",en:"7 d"},m_out:{zh:"出力",en:"Output"},m_wind:{zh:"風速",en:"Wind"},
  windNote:{zh:"鄰近測站風速",en:"Nearest station wind"},windRef:{zh:"沿海參考值，非風機輪轂高度實測",en:"coastal reference, not hub-height"},
  mapHint:{zh:"點選風場圖示查看即時出力與專案資訊 · 共 30 個機組 / 風場",en:"Tap a marker for live output & project info · 30 units/farms"},
  legendTitle:{zh:"圖示說明",en:"Legend"},lg_size:{zh:"圈圈大小 ＝ 裝置容量",en:"Circle size = capacity"},
  mlg_high:{zh:"可用率高（≥45%）",en:"High availability (≥45%)"},mlg_mid:{zh:"可用率中（20–45%）",en:"Mid (20–45%)"},
  mlg_low:{zh:"可用率低（<20%）",en:"Low (<20%)"},mlg_dev:{zh:"開發中／未列容量",en:"In dev. / not listed"},
  grp_offppa:{zh:"離岸風力 · 購電",en:"Offshore · PPA"},grp_offtpc:{zh:"離岸風力 · 台電自有",en:"Offshore · Taipower"},
  grp_onppa:{zh:"陸域風力 · 購電",en:"Onshore · PPA"},grp_ontpc:{zh:"陸域風力 · 台電自有",en:"Onshore · Taipower"},
  simTag:{zh:"（模擬·基準快照）",en:"(simulated snapshot)"},planned:{zh:"規劃",en:"planned"},notListed:{zh:"台電未列（註10）",en:"not yet listed"},
  onGlobe:{zh:"在 3D 地球儀上看這座風場",en:"See this farm on the 3D globe"},
  popMore:{zh:"查看專案資訊 →",en:"Project details →"},popUnit:{zh:"台電機組",en:"Taipower unit"},
  foot_main:{zh:'機組分類、名稱與容量：依台電「各機組發電量」（genary.json）四類揭露整理 · 容量／出力以台電公布為準<br>影響力數字為換算估算：家戶 0.5kW、家戶日用電約 10 度、排碳係數 0.495 kg/度、單樹年吸碳 12kg；發電與佔比之底層 MW 為台電實測值<br>風速為中央氣象署自動氣象站觀測，取各風場「最近測站」當沿海參考值，非風機輪轂高度實測（外海風場尤其僅供參考）',
    en:'Unit classification, names & capacity: from Taipower "unit generation" (genary.json), four disclosure classes · capacity/output per Taipower<br>Impact figures are conversions/estimates: 0.5 kW/home, ~10 kWh/home-day, 0.495 kg CO₂/kWh, 12 kg CO₂/tree-yr; underlying MW for output & share are Taipower measured values<br>Wind speed from CWA automatic weather stations — nearest station as a coastal reference, not hub-height (offshore farms especially indicative only)'}
});

let LIVE=false,lastUpdate=null,srcTime=null,sortKey="output",filt="all",devFilt="all",brandFilt="all",capFilt="all",groupMode="type";
let drawerFarm=null;                           // 目前開啟詳情的風場(語言切換時重繪用)
let HIST={points:[]};                          // 真實滾動歷史(scraper 每 15 分累積 + 官方資料集 37331 每日回填)
let sysTotal=null;                             // 全國即時淨發電量(MW)，來自 live JSON
let GRID=null;                                 // 電力供需即時報表
let WIND={};                                   // 各風場鄰近測站風速{id:{mps,station,km}}，來源中央氣象署
const windOf=f=>WIND[f.id]||null;
const HH_KW=0.5;                               // 家戶平均用電功率估算(年約3600度÷8760h≈0.41kW，取0.5保守)
const CO2_KG_PER_KWH=0.495;                    // 台灣電力排碳係數估算(kg CO2/度)
const TREE_KG_PER_YR=12;                       // 一棵樹年吸碳量估算(kg/年)
const RT={};
const EN=()=>WW.lang==="en";
const subs=[];                                 // 資料更新時通知首頁／地球儀
function notify(){subs.forEach(fn=>{try{fn()}catch(e){console.error(e)}});}

// 台電 opendata 的「資料時間」(source_time，台北時間無時區) → 顯示用字串
function fmtSrc(s){if(!s)return"";const d=new Date(s);if(isNaN(d))return s;
  const p=n=>String(n).padStart(2,"0");
  return `${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function seeded(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return((h>>>0)%1000)/1000}
function windDrift(){const tt=Date.now()/1000;return 1+0.35*Math.sin(tt/360)+0.12*Math.sin(tt/64);}
function simOutput(f){
  const drift=windDrift();
  const noise=1+0.10*Math.sin(Date.now()/2200+seeded(f.tp)*7);
  if(f.pending){                       // 註10 試運轉機組：會發電，但無裝置容量上限可夾
    const v=f.snap*drift*noise;
    return +Math.max(0,Math.min(f.snap*1.45,v)).toFixed(1);
  }
  const cap=f.cap||0;
  let v=f.snap*drift*noise;
  v=Math.max(0,Math.min(cap,v));
  return +v.toFixed(1);
}
function refresh(){if(LIVE)return;            // 即時模式：不跑模擬，保留台電真實值不被覆蓋
  FARMS.forEach(f=>RT[f.id]=simOutput(f));lastUpdate=new Date();paint();}
async function tryLive(){
  if(!DATA_ENDPOINT){setFeed(false);return;}
  try{const j=await WW.getLiveJSON(DATA_ENDPOINT);
    if(j&&j.farms){FARMS.forEach(f=>{if(j.farms[f.id]!=null)RT[f.id]=j.farms[f.id]});
      srcTime=j.source_time||null;sysTotal=(typeof j.system_total_mw==="number")?j.system_total_mw:null;
      WIND=(j.farm_wind&&typeof j.farm_wind==="object")?j.farm_wind:{};
      lastUpdate=j.updated?new Date(j.updated):new Date();setFeed(true);paint();return;}
    setFeed(false);}catch(e){setFeed(false)}
}
async function tryHistory(){                    // 抓真實滾動歷史(供出力趨勢線、今日發電量)
  try{const j=await WW.getLiveJSON(HIST_ENDPOINT);
    if(j&&Array.isArray(j.points)){HIST=j;paintImpact();paintHero();notify();}}catch(e){/* 尚無歷史檔時靜默忽略 */}
}
async function tryGrid(){                       // 抓電力供需即時報表(獨立來源，失敗靜默略過)
  try{const j=await WW.getLiveJSON(GRID_ENDPOINT);
    if(j&&(typeof j.reserve_pct==="number"||typeof j.status_text==="string")){GRID=j;paintGrid();}}
  catch(e){/* 尚無此檔或抓取失敗：不顯示電網狀態列，非致命 */}
}
function setFeed(live){
  LIVE=live;
  const snap=live&&WW.standalone&&WW.standalone.usedSnapshot;   // 單檔版離線：真實資料但不是即時
  const cls=live&&!snap?"dot live":"dot sim";
  const short=snap?`${t("snapShort")} · ${fmtSrc(srcTime)}`:live?(srcTime?`${t("live")} · ${t("updatedAt")} ${fmtSrc(srcTime)}`:`${t("live")}`):t("simShort");
  ["feeddot","hh-dot"].forEach(id=>{const d=document.getElementById(id);if(d)d.className=cls;});
  ["feedtxt","hh-feedtxt"].forEach(id=>{const d=document.getElementById(id);if(d)d.textContent=short;});
  const dm=document.getElementById("lv-datamode"),sl=document.getElementById("lv-srcline");
  const long=snap?(EN()?`◐ Offline snapshot saved in this single-file copy · Taipower data time ${fmtSrc(srcTime)}`:`◐ 離線快照：單檔版建置時儲存的台電資料 · 資料時間 ${fmtSrc(srcTime)}`)
    :live?(srcTime?(EN()?`● Live · backend connected · Taipower data time ${fmtSrc(srcTime)}`:`● 即時：已連線後端端點 · 台電資料時間 ${fmtSrc(srcTime)}`):(EN()?"● Live · backend connected":"● 即時：已連線後端端點"))
    :(EN()?"◐ Simulated (baseline: Taipower open-data snapshot) · live data not reachable":"◐ 模擬浮動（基準：台電開放資料快照）· 目前無法取得即時資料");
  if(dm)dm.textContent=long;
  if(sl)sl.textContent=snap?(EN()?`Offline snapshot · ${fmtSrc(srcTime)}`:`離線快照 · ${fmtSrc(srcTime)}`):live?(EN()?`Taipower open data · ${fmtSrc(srcTime)} · updates every 10 min`:`台電開放資料 · ${fmtSrc(srcTime)} · 每 10 分鐘更新`):(EN()?"Simulated from a Taipower snapshot":"以台電快照模擬");
}
const capOf=f=>f.cap||f.planned||0;
const sizeMW=f=>{const c=(typeof f.cap==="number"?f.cap:0)||(typeof f.planned==="number"?f.planned:0);
  return c>0?c:Math.max(20,(f.snap||0)*1.2);};   // 註10無容量者用出力推估marker大小
const ratioOf=f=>{const c=f.cap||0;return c>0?RT[f.id]/c:0;};
/* 可用率有序三階（同一色相，越亮＝越高；經 dataviz validator --ordinal 驗證）；未列容量＝灰 */
const GEN={hi:"#3fdcb0",mid:"#24a886",lo:"#197a62",na:"#5b6b80"};
function tier(f){if(f.pending||!f.cap)return"na";const r=ratioOf(f);return r>=0.45?"hi":r>=0.20?"mid":"lo";}
const hexColor=f=>GEN[tier(f)];
const cssColor=hexColor;

// 風機轉速：可用率越高轉越快；停機(出力≈0)不轉。回傳秒/圈，0=不轉。
function spinDur(f){
  const out=RT[f.id]||0;
  if(out<=0.1)return 0;
  let r=f.cap?ratioOf(f):Math.min(1,out/300);   // 無容量(註10)者以 300MW 當參考
  r=Math.max(0.04,Math.min(1,r));
  return +(0.5+(1-r)*4.5).toFixed(2);            // 0.5s(滿載)~5s(微載)
}
function turbineSVG(f){
  const col=cssColor(f),dur=spinDur(f);
  const anim=dur>0?`animation-duration:${dur}s`:"animation:none";
  const blade=`<path d="M30 30 L28.4 9 Q30 4.5 31.6 9 Z" fill="${col}"/>`;   // 單葉，繞輪轂(30,30)
  return `<svg class="turb" viewBox="0 0 60 92" aria-hidden="true">
    <rect x="28.7" y="30" width="2.6" height="58" rx="1.2" fill="#5b6b80"/>
    <rect x="26.3" y="26.5" width="7.4" height="6.2" rx="2.4" fill="#7d8ca3"/>
    <g class="rotor" style="${anim}">
      <g transform="rotate(0 30 30)">${blade}</g>
      <g transform="rotate(120 30 30)">${blade}</g>
      <g transform="rotate(240 30 30)">${blade}</g>
      <circle cx="30" cy="30" r="3.6" fill="${col}"/><circle cx="30" cy="30" r="1.7" fill="#0d1829"/>
    </g></svg>`;
}
// 只有轉子的小圖示(無塔架)，供風場牆等小尺寸場合使用
function rotorSVG(f){
  const col=cssColor(f),dur=spinDur(f);
  const anim=dur>0?`animation-duration:${dur}s`:"animation:none";
  const blade=`<path d="M20 20 L18.6 3.5 Q20 0.5 21.4 3.5 Z" fill="${col}"/>`;
  return `<svg class="rotor-ic" viewBox="0 0 40 40" aria-hidden="true"><g class="rotor" style="${anim}">
    <g transform="rotate(0 20 20)">${blade}</g><g transform="rotate(120 20 20)">${blade}</g><g transform="rotate(240 20 20)">${blade}</g>
    <circle cx="20" cy="20" r="2.8" fill="${col}"/></g></svg>`;
}
const esc=WW.esc;
function paint(){paintKPIs();paintHero();paintGrid();paintImpact();paintGroups();
  if(curView==="wall")paintWall();if(curView==="charts")paintChart();updateMarkers();notify();}

/* ---------------- 儀表：KPI ---------------- */
function totals(){
  const total=FARMS.reduce((s,f)=>s+(RT[f.id]||0),0),cap=FARMS.reduce((s,f)=>s+(f.cap||0),0);
  return{total,cap,ratio:cap>0?total/cap:0,op:FARMS.filter(f=>!f.pending).length,gen:FARMS.filter(f=>(RT[f.id]||0)>0.1).length,
    pending:FARMS.filter(f=>f.pending).length};
}
function paintKPIs(){
  const el=document.getElementById("lv-kpis");if(!el)return;
  const T=totals(),co2=Math.round(T.total*CO2_KG_PER_KWH);   // 噸/小時(總出力MW×排碳係數)
  const stat=(cls,k,v,u,s,meter)=>`<div class="stat ${cls}"><div class="k">${k}</div><div class="v">${v}${u?`<small>${u}</small>`:""}</div>${meter!=null?`<div class="meter"><i style="width:${Math.min(100,meter).toFixed(1)}%"></i></div>`:""}${s?`<div class="s">${s}</div>`:""}</div>`;
  el.innerHTML=
    stat("hero",t("windTotal"),WW.int(T.total),"MW",LIVE?(EN()?`Taipower data ${fmtSrc(srcTime)} · every 10 min`:`台電資料 ${fmtSrc(srcTime)} · 每 10 分鐘更新`):(EN()?"Simulated from a Taipower snapshot":"以台電快照模擬浮動"))+
    stat("",t("totalCap"),WW.int(T.cap),"MW",EN()?`+ ${T.pending} units testing (capacity not yet listed)`:`另有 ${T.pending} 個試運轉機組未列容量`)+
    stat("",t("overallAvail"),(T.ratio*100).toFixed(1),"%","",T.ratio*100)+
    stat("",t("co2hr"),WW.int(co2),t("tonHr"),EN()?"output × 0.495 kg/kWh":"出力 × 0.495 kg/度")+
    stat("",t("unitsFarms"),T.gen,`／${FARMS.length}`,EN()?"generating > 0.1 MW now":"此刻出力 > 0.1 MW");
}
// 依整體可用率產生口語化問候(生動/幽默)
function heroMood(r){
  if(r>=0.45)return{e:"💨",t:EN()?"Big wind! Turbines across Taiwan are going full throttle.":"狂風時刻！全台風機火力全開，正在猛灌綠電。"};
  if(r>=0.28)return{e:"🌬️",t:EN()?"Good breeze — turbines are humming along steadily.":"風勢不錯，風機們穩穩出力中。"};
  if(r>=0.13)return{e:"🍃",t:EN()?"Light winds — turbines turning at an easy pace.":"微風徐徐，風機悠閒地轉著。"};
  return{e:"😴",t:EN()?"Calm out there — turbines resting, waiting for the winter monsoon.":"風有點懶，風機正在放假曬太陽，等東北季風回來上工。"};
}
function moodParts(){
  const T=totals(),m=heroMood(T.ratio);
  const ops=FARMS.filter(f=>f.cap&&!f.pending);
  const top=ops.filter(f=>RT[f.id]>0.1).sort((a,b)=>ratioOf(b)-ratioOf(a))[0];
  const resting=ops.filter(f=>RT[f.id]<=0.1).length;
  const mwh=todayEnergyMWh();
  const story=mwh!=null
    ?(EN()?`So far today, Taiwan's wind has generated ~<b>${WW.int(mwh)} MWh</b> ⚡ ≈ a full day's power for <b>${WW.int(mwh*100)}</b> homes 🏠 (still accruing)`
        :`今天到現在，台灣的風已轉出約 <b>${WW.int(mwh*1000)} 度</b>電 ⚡ ≈ <b>${WW.int(mwh*100)} 戶</b>家庭一整天的用電 🏠（仍在累積中）`)
    :(EN()?`Today's total is still adding up — check back soon 📖`:`今日發電量正在累積中，過一段時間就會說書給你聽 📖`);
  const topChip=top?(EN()?`🏆 Top performer: <b>${esc(top.tp)}</b> (${(ratioOf(top)*100).toFixed(0)}%)`:`🏆 此刻最賣力：<b>${esc(top.name)}</b>（可用率 ${(ratioOf(top)*100).toFixed(0)}%）`)
    :(EN()?"🏆 No farms generating now":"🏆 此刻暫無風場運轉");
  const restChip=EN()?`😎 Resting now: <b>${resting}</b> farms`:`😎 此刻休息中：<b>${resting}</b> 座風場`;
  return{m,story,topChip,restChip};
}
function paintHero(){
  const el=document.getElementById("lv-mood");if(!el)return;
  const p=moodParts();
  el.innerHTML=`<div class="mg"><span class="me" aria-hidden="true">${p.m.e}</span><span>${p.m.t}</span></div>
    <div class="ms">${p.story}</div><div class="mc"><span>${p.topChip}</span><span>${p.restChip}</span></div>`;
}
// 備轉容量率燈號：優先依官方 status_text 的關鍵字判斷(文字與顏色一致)；
// 官方未給文字時，才退化用台電公開的分級門檻(≥10 綠燈充裕／6–10 黃燈吃緊／3–6 橘燈警戒／<3 紅燈限電)。
function reserveTier(pct,statusText){
  if(statusText){
    if(statusText.includes("限電"))return{c:"var(--critical)",k:"grid_alert"};
    if(statusText.includes("警戒"))return{c:"var(--serious)",k:"grid_warn"};
    if(statusText.includes("吃緊"))return{c:"var(--warn)",k:"grid_tight"};
    if(statusText.includes("充裕"))return{c:"var(--good)",k:"grid_ample"};
  }
  if(typeof pct==="number"){
    if(pct>=10)return{c:"var(--good)",k:"grid_ample"};
    if(pct>=6)return{c:"var(--warn)",k:"grid_tight"};
    if(pct>=3)return{c:"var(--serious)",k:"grid_warn"};
    return{c:"var(--critical)",k:"grid_alert"};
  }
  return{c:"var(--gen-na)",k:null};
}
function paintGrid(){
  const el=document.getElementById("gridbar");if(!el)return;
  if(!GRID||typeof GRID.reserve_pct!=="number"){el.innerHTML="";return;}
  const tier=reserveTier(GRID.reserve_pct,GRID.status_text);
  const label=(!EN()&&GRID.status_text)||t(tier.k);
  const isDaily=GRID.granularity==="daily";
  const total=totals().total;
  // 備援(每日/非即時)資料不與「此刻」風電出力並列，避免誤導成同一時間點的數字
  const windTxt=(!isDaily&&LIVE&&total>0)?`<span class="gsep">·</span><span class="gw">🌬️ ${t("grid_wind")} <b>${WW.int(total)} MW</b></span>`:"";
  const srcLabel=isDaily?t("grid_src_daily"):t("grid_src");
  const st=GRID.source_time?(isDaily?GRID.source_time.slice(0,10):fmtSrc(GRID.source_time)):"";
  el.innerHTML=`<span class="gi"><span class="gdot" style="background:${tier.c}" aria-hidden="true"></span>${esc(label)}</span><span class="gsep">·</span>
    <span class="gw"><b>${GRID.reserve_pct.toFixed(1)}%</b> ${t("grid_reserve")}</span>${windTxt}
    <span class="gsrc">${srcLabel}${st?` ${st}`:""}</span>`;
}
// 今日(台北)累積發電量(MWh)：用真實歷史的 total 對時間梯形積分；不足則回 null
function todayEnergyMWh(){
  const pts=(HIST.points||[]).filter(p=>p&&typeof p.total==="number");
  if(pts.length<2)return null;
  const n=new Date(),y=n.getFullYear(),m=n.getMonth(),d=n.getDate();
  const td=pts.filter(p=>{const tt=new Date(p.t);return tt.getFullYear()===y&&tt.getMonth()===m&&tt.getDate()===d;});
  if(td.length<2)return null;
  let e=0;
  for(let i=1;i<td.length;i++){
    const dtH=(new Date(td[i].t)-new Date(td[i-1].t))/3600000;
    if(dtH>0&&dtH<1.05)e+=(td[i].total+td[i-1].total)/2*dtH;   // MWh；跨距>1h視為斷點不積
  }
  return e;
}
function impactVals(){
  const total=totals().total;
  const homes=total*1000/HH_KW/10000;                          // 萬戶(即時出力可同時供應)
  const share=(LIVE&&sysTotal>0)?(total/sysTotal*100):null;    // 風電佔全國發電%
  const mwh=todayEnergyMWh();                                  // 今日累積發電(MWh)
  const trees=mwh!=null?(mwh*1000*CO2_KG_PER_KWH/TREE_KG_PER_YR):null;  // 今日減碳等效樹(棵·年)
  return{total,homes,share,mwh,trees};
}
function paintImpact(){
  const el=document.getElementById("lv-impact");if(!el)return;
  const v=impactVals();
  const card=(ic,iv,unit,k)=>`<div class="imp"><div class="ic" aria-hidden="true">${ic}</div><div>
    <div class="iv">${iv}${unit?`<small>${unit}</small>`:""}</div><div class="ik">${k}</div></div></div>`;
  const homesV=EN()?WW.int(v.homes*10):v.homes.toFixed(v.homes<10?1:0);
  const todayV=v.mwh!=null?(EN()?WW.int(v.mwh):(v.mwh/10).toFixed(v.mwh/10<10?2:1)):t("accruing"),todayU=v.mwh!=null?(EN()?"MWh":"萬度"):"";
  el.innerHTML=card("🏠",homesV,t("unit_homes"),t("imp_homes"))+
    card("⚡",v.share!=null?v.share.toFixed(1):"—",v.share!=null?"%":"",t("imp_share"))+
    card("💡",todayV,todayU,t("imp_today"))+
    card("🌳",v.trees!=null?WW.int(v.trees):t("accruing"),v.trees!=null?t("unit_trees"):"",t("imp_trees"));
}
/* 台灣在世界：從全球資料集算離岸排名（與 3D 地球儀同一份資料） */
function paintTwRank(){
  const el=document.getElementById("lv-twrank");if(!el)return;
  WW.globalData().then(D=>{
    const i=D.years.length-1,Y=D.Y1,tw=D._idx.TWN;if(!tw)return;
    const ro=D.countries.slice().sort((a,b)=>b.off[i]-a.off[i]);const rk=ro.indexOf(tw)+1;
    const woff=D.countries.reduce((s,c)=>s+c.off[i],0);
    el.innerHTML=EN()
      ?`🌏 <span>Taiwan had about <b>${WW.fmtMW(tw.off[i])}</b> of offshore wind at the end of ${Y} — <b>#${rk}</b> in the world (${(tw.off[i]/woff*100).toFixed(1)}% of global offshore).</span><a class="btn sm hist" href="#/global?r=TWN">See it on the globe →</a>`
      :`🌏 <span>台灣 ${Y} 年底離岸風電約 <b>${WW.fmtMW(tw.off[i])}</b>，名列全球第 <b>${rk}</b>，約佔全球離岸容量 ${(tw.off[i]/woff*100).toFixed(1)}%。</span><a class="btn sm hist" href="#/global?r=TWN">在地球儀上看 →</a>`;
    el.hidden=false;
  }).catch(()=>{});
}

/* ---------------- 儀表：風場卡片 ---------------- */
function sortFarms(a){const c=[...a];
  if(sortKey==="output")c.sort((x,y)=>RT[y.id]-RT[x.id]);
  else if(sortKey==="ratio")c.sort((x,y)=>ratioOf(y)-ratioOf(x));
  else if(sortKey==="cap")c.sort((x,y)=>sizeMW(y)-sizeMW(x));
  else c.sort((x,y)=>x.name.localeCompare(y.name,"zh-Hant"));
  return c;}
function cardHTML(f){
  const has=f.cap&&!f.pending;
  const pct=has?Math.max(0,Math.min(100,ratioOf(f)*100)):0;
  const capTxt=f.cap?`/ ${f.cap} MW`:(f.planned&&f.planned!=="—"?`/ ${t("planned")} ${f.planned}`:(EN()?"/ not listed":"/ 未列容量"));
  const badge=f.pending?`<span class="badge dev">${t("b_dev")}</span>`:(f.agg?`<span class="badge">${t("b_agg")}</span>`:`<span class="badge run">${t("b_run")}</span>`);
  const typeB=`<span class="badge ${isOffshore(f)?"offshore":"onshore"}">${isOffshore(f)?t("f_offshore"):t("f_onshore")}</span>`;
  const w=windOf(f),windMW=w?`<span class="fw" title="${esc(w.station)}${EN()?" station · "+w.km+" km · coastal ref.":"測站 · 距 "+w.km+" km · 沿海參考值"}">🌬 ${w.mps.toFixed(1)} m/s</span>`:"";
  return `<button type="button" class="fcard${f.pending?" pending":""}" data-id="${f.id}" aria-label="${esc(f.name)}">
    <span class="tw">${turbineSVG(f)}<span class="pct">${has?pct.toFixed(0)+"%":(f.pending?t("b_dev"):"—")}</span></span>
    <span class="fb">
      <span class="fn" style="display:block">${esc(EN()?f.tp:f.name)}</span>
      <span class="fd" style="display:block">${esc(f.dev)}</span>
      <span class="fo"><span class="big">${(RT[f.id]||0).toFixed(1)}</span><span class="cap">MW ${capTxt}</span></span>
      <span class="fm" style="display:block"><i style="width:${has?pct:0}%;background:${hexColor(f)}"></i></span>
      <span class="fx">${badge}${typeB}${windMW}</span>
    </span></button>`;
}
// 由台電購電合約揭露的開發商字串歸納為簡短名稱(供篩選)
function devShort(f){
  const d=f.dev||"";
  if(/台灣電力|台電/.test(d))return"台電";
  if(/沃旭|Ørsted|Orsted/i.test(d))return"沃旭 Ørsted";
  if(/CIP|哥本哈根/i.test(d))return"CIP";
  if(/達德|wpd/i.test(d))return"達德 wpd";
  if(/海龍/.test(d))return"海龍";
  if(/中能|中鋼/.test(d))return"中能（中鋼）";
  if(/海洋風電|海能|JERA/i.test(d))return"JERA 系";
  return"其他民營";
}
// 由風機型號字串歸納為廠牌(供篩選)；資料來源為各風場 model 欄位
function farmBrand(f){
  const m=f.model||"";
  if(/Siemens Gamesa/i.test(m))return"Siemens Gamesa";
  if(/Siemens/i.test(m))return"Siemens";
  if(/Vestas/i.test(m))return"Vestas";
  if(/Hitachi/i.test(m))return"Hitachi";
  return"其他／未列";
}
function farmPass(f){
  if(filt==="offshore"&&!isOffshore(f))return false;
  if(filt==="onshore"&&isOffshore(f))return false;
  if(filt==="commercial"&&f.pending)return false;   // 已商轉 = 非試運轉
  if(filt==="building"&&!f.pending)return false;     // 開發中 = 試運轉(註10)
  if(devFilt!=="all"&&devShort(f)!==devFilt)return false;
  if(brandFilt!=="all"&&farmBrand(f)!==brandFilt)return false;
  if(capFilt!=="all"){const c=f.cap||0;
    if(capFilt==="L"&&!(c>300))return false;
    if(capFilt==="M"&&!(c>=100&&c<=300))return false;
    if(capFilt==="S"&&!(c>0&&c<100))return false;}
  return true;
}
function buildFilterSelects(){                       // 依實際資料動態建立下拉，避免硬寫錯
  const ds=document.getElementById("devsel"),bs=document.getElementById("brandsel");
  const devs=[...new Set(FARMS.map(devShort))],brands=[...new Set(FARMS.map(farmBrand))];
  ds.innerHTML=`<option value="all">${t("allDev")}</option>`+devs.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("");
  bs.innerHTML=`<option value="all">${t("allBrand")}</option>`+brands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("");
  ds.value=devFilt;bs.value=brandFilt;              // 還原選取(語言切換時)
  ds.onchange=()=>{devFilt=ds.value;paintGroups();};
  bs.onchange=()=>{brandFilt=bs.value;paintGroups();};
  const cs=document.getElementById("capsel");cs.value=capFilt;cs.onchange=e=>{capFilt=e.target.value;paintGroups();};
}
function groupsFor(){                                // 依分組模式回傳 [{label,tag,cls,farms}]
  if(groupMode==="dev"){
    const map={};FARMS.forEach(f=>{const k=devShort(f);(map[k]=map[k]||[]).push(f);});
    return Object.keys(map).map(k=>({label:k,tag:/台電/.test(k)?"tpc":"ppa",cls:"",farms:map[k]}))
      .sort((a,b)=>b.farms.reduce((s,f)=>s+RT[f.id],0)-a.farms.reduce((s,f)=>s+RT[f.id],0));
  }
  return GROUPS.map(g=>({label:t("grp_"+g.key.replace("-","")),tag:g.tag,cls:g.cls,farms:FARMS.filter(f=>f.grp===g.key)}));
}
function paintGroups(){
  updateToolbarBadge();
  const wrap=document.getElementById("groups");if(!wrap)return;let html="",shown=0;
  groupsFor().forEach(g=>{
    const list=sortFarms(g.farms.filter(farmPass));
    if(!list.length)return;                          // 篩選後該組無風場 → 隱藏整組
    shown+=list.length;
    const out=list.reduce((s,f)=>s+RT[f.id],0),cap=list.reduce((s,f)=>s+(f.cap||0),0);
    const tagTxt=groupMode==="dev"?t("devTag"):(g.tag==="tpc"?t("tpcOwn"):t("ppa"));
    html+=`<div class="grouphead"><span class="gtag ${g.cls}">${tagTxt}</span>
      <h2>${esc(g.label)}</h2><div class="rule"></div>
      <div class="sum num">${out.toFixed(1)} / ${WW.int(cap)} MW · ${cap>0?(out/cap*100).toFixed(0):0}%</div></div>
      <div class="fgrid">${list.map(cardHTML).join("")}</div>`;
  });
  wrap.innerHTML=shown?html:`<div class="empty">${t("noMatch")}</div>`;
  wrap.querySelectorAll(".fcard").forEach(c=>{c.onclick=()=>openDrawer(c.dataset.id);});
}
function updateToolbarBadge(){
  const n=(sortKey!=="output")+(groupMode!=="type")+(filt!=="all")+(devFilt!=="all")+(brandFilt!=="all")+(capFilt!=="all");
  const badge=document.getElementById("tbbadge");if(!badge)return;
  badge.hidden=n===0;badge.textContent=n;
}

/* ---------------- 風場牆 ---------------- */
function wallTile(f){
  const has=f.cap&&!f.pending,w=windOf(f);
  const wtxt=w?` · 🌬${Math.round(w.mps)}m/s`:"";
  const st=has?`${Math.round(ratioOf(f)*100)}%${w?"":" "+t("s_ratio")}${wtxt}`:((f.pending?t("b_dev"):"—")+wtxt);
  return `<button type="button" class="wtile" data-id="${f.id}" aria-label="${esc(f.name)}" style="border-left-color:${hexColor(f)}">
    <span class="wric">${rotorSVG(f)}</span>
    <span class="wn">${esc(f.tp)}</span>
    <span class="wv">${(RT[f.id]||0).toFixed(1)}<small>MW</small></span>
    <span class="ws">${st}</span></button>`;
}
function paintWall(){
  const wall=document.getElementById("wall");if(!wall)return;
  const list=[...FARMS].sort((a,b)=>RT[b.id]-RT[a.id]);   // 出力高者排前(亮色聚在左上)
  wall.innerHTML=list.map(wallTile).join("");
  wall.querySelectorAll(".wtile").forEach(c=>{c.onclick=()=>openDrawer(c.dataset.id);});
  const total=totals().total;
  document.getElementById("wallbar").innerHTML=
    `<span><b>${t("wallAll")} ${FARMS.length}</b> ${t("wallFarms")} <b>${WW.int(total)} MW</b></span>
     <span class="lgd"><i class="sw" style="background:${GEN.hi}"></i>${t("lg_high")}</span>
     <span class="lgd"><i class="sw" style="background:${GEN.mid}"></i>${t("lg_mid")}</span>
     <span class="lgd"><i class="sw" style="background:${GEN.lo}"></i>${t("lg_low")}</span>
     <span class="lgd"><i class="sw" style="background:${GEN.na}"></i>${t("lg_dev")}</span>`;
}

/* ---------------- 數據 ---------------- */
let chartMode="bar";
function chartBar(wrap){
  const list=[...FARMS].sort((a,b)=>RT[b.id]-RT[a.id]);
  const max=Math.max(1,...list.map(f=>RT[f.id]));
  wrap.innerHTML=`<div class="rankbars">`+list.map(f=>`<button type="button" class="rrow" data-id="${f.id}">
    <span class="rn">${esc(EN()?f.tp:f.tp)}</span>
    <span class="rt"><i style="width:${(RT[f.id]/max*100).toFixed(1)}%;background:${hexColor(f)}"></i></span>
    <span class="rv">${(RT[f.id]||0).toFixed(1)}<small> MW</small></span></button>`).join("")+`</div>`;
  wrap.querySelectorAll("[data-id]").forEach(el=>{el.onclick=()=>openDrawer(el.dataset.id);});
}
function chartMix(wrap){
  const total=totals().total||1;
  const dm={};FARMS.forEach(f=>{const k=devShort(f);dm[k]=(dm[k]||0)+(RT[f.id]||0);});
  const devRows=Object.entries(dm).map(([label,v])=>({label,parts:[v]})).filter(r=>r.parts[0]>0.1).sort((a,b)=>b.parts[0]-a.parts[0]);
  const box=WW.el("div",{class:"shares"});wrap.appendChild(box);
  const a=WW.el("div"),b=WW.el("div");box.appendChild(a);box.appendChild(b);
  if(!devRows.length){a.innerHTML=`<div class="empty">${t("noGen")}</div>`;return;}
  const vf=v=>`${WW.int(v)} MW · ${(v/total*100).toFixed(0)}%`;
  WW.chart.hbar(a,{title:t("donutDev"),series:[{name:t("d_output"),color:GEN.hi}],rows:devRows,valueFmt:vf,
    table:{head:[t("devTag"),"MW","%"],rows:devRows.map(r=>[r.label,r.parts[0].toFixed(1),(r.parts[0]/total*100).toFixed(1)])}});
  let off=0,on=0;FARMS.forEach(f=>{if(isOffshore(f))off+=RT[f.id]||0;else on+=RT[f.id]||0;});
  WW.chart.hbar(b,{title:t("donutType"),series:[{name:t("f_offshore"),color:"#3B8FE0"},{name:t("f_onshore"),color:"#B8892F"}],
    rows:[{label:EN()?"Taiwan":"全台",parts:[off,on]}],valueFmt:v=>`${WW.int(v)} MW`,rowH:44,
    table:{head:[EN()?"Type":"類型","MW","%"],rows:[[t("f_offshore"),off.toFixed(1),(off/total*100).toFixed(1)],[t("f_onshore"),on.toFixed(1),(on/total*100).toFixed(1)]]}});
  const pct=WW.el("div",{class:"note"},EN()?`Offshore ${(off/total*100).toFixed(0)}% · onshore ${(on/total*100).toFixed(0)}% of the output right now.`
    :`此刻出力：離岸 ${(off/total*100).toFixed(0)}%、陸域 ${(on/total*100).toFixed(0)}%。`);
  b.appendChild(pct);
}
function paintChart(){
  const wrap=document.getElementById("chartwrap");if(!wrap)return;
  const note=document.getElementById("chartnote");
  document.querySelectorAll("#chartmode button").forEach(x=>{const on=x.dataset.c===chartMode;x.classList.toggle("is-on",on);x.setAttribute("aria-selected",on?"true":"false");});
  if(chartMode==="hist"){note.textContent=t("cn_hist");chartHist(wrap);return;}
  wrap.textContent="";
  if(chartMode==="bar"){chartBar(wrap);note.textContent=t("cn_bar");}
  else{chartMix(wrap);note.textContent=t("cn_donut");}
}
// ===== 長期趨勢：官方回溯每日摘要(wind_archive_daily.json，由 backfill_history.py 產生) =====
let ARCHD=null,ARCHD_STATE="idle",histUnit=null;   // idle→loading→ok/fail；histUnit=null 為全部
function histRows(){                                // 目前選擇的 [{d,avg,max}]
  const ds=ARCHD.days||[];
  if(!histUnit)return ds.filter(r=>typeof r.avg==="number"&&typeof r.max==="number");
  return ds.filter(r=>r.u&&Array.isArray(r.u[histUnit])).map(r=>({d:r.d,avg:r.u[histUnit][0],max:r.u[histUnit][1]}));
}
function histUnits(){                               // 機組清單(依期間平均出力排序)
  const s={};(ARCHD.days||[]).forEach(r=>{if(r.u)for(const k in r.u)s[k]=(s[k]||0)+r.u[k][0];});
  return Object.keys(s).sort((a,b)=>s[b]-s[a]);
}
const HIST_RAMP=["#16283d","#154a45","#1a6e5a","#23a383","#3fdcb0"];   // 風況日曆 5 階（同色相，越亮＝風越大）
const MN=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function histCalendar(ds){
  const peak=Math.max(...ds.map(r=>r.avg),1);
  const months={};ds.forEach(r=>{(months[r.d.slice(0,7)]=months[r.d.slice(0,7)]||[]).push(r);});
  return `<div class="histcal">${Object.keys(months).sort().map(m=>{
    const rows=months[m],[y,mo]=m.split("-");
    const lead=new Date(rows[0].d+"T00:00:00").getDay();          // 週日=0 起排
    const cells=Array(lead).fill(`<div class="hcell" style="visibility:hidden"></div>`)
      .concat(rows.map(r=>{const lv=r.avg<=0?0:Math.min(4,Math.floor(r.avg/peak*4.999));
        const tip=EN()?`${r.d}\navg ${r.avg} MW · max ${r.max} MW`:`${r.d}\n平均 ${r.avg} MW · 最大 ${r.max} MW`;
        return `<div class="hcell" style="background:${HIST_RAMP[lv]}" title="${tip}"></div>`;}));
    return `<div class="hmon"><div class="mt">${EN()?`${MN[+mo]} ${y}`:`${y}/${+mo}月`}</div><div class="hgrid">${cells.join("")}</div></div>`;
  }).join("")}</div>
  <div class="ramp">${EN()?"calm":"風小"} ${HIST_RAMP.map(c=>`<i style="background:${c}"></i>`).join("")} ${EN()?"windy":"風大"}</div>`;
}
function histCards(ds){
  const best=ds.reduce((a,b)=>b.avg>a.avg?b:a),calm=ds.reduce((a,b)=>b.avg<a.avg?b:a);
  const mean=ds.reduce((s,r)=>s+r.avg,0)/ds.length;
  const mwh=ds.reduce((s,r)=>s+r.avg*24,0);                       // 期間累積發電(MWh，日均×24h)
  const homes=best.avg*1000/HH_KW/10000;                          // 最強日可同時供應(萬戶)
  const co2=mwh*CO2_KG_PER_KWH;                                   // 期間減碳(噸)＝MWh×1000度×0.495kg÷1000kg
  const md=d=>{const[,m,dd]=d.split("-");return `${+m}/${+dd}`;};
  const energyTxt=EN()?(mwh>=1e5?`${(mwh/1000).toFixed(0)}<small>GWh</small>`:`${WW.int(mwh)}<small>MWh</small>`)
                    :(mwh>=1e5?`${(mwh/1e5).toFixed(1)}<small>億度</small>`:`${WW.int(mwh/10)}<small>萬度</small>`);
  const card=(ti,v,k)=>`<div class="histcard"><div class="ht">${ti}</div><div class="hv">${v}</div><div class="hk">${k}</div></div>`;
  return `<div class="histcards">${
    card(EN()?"🏆 Windiest day":"🏆 風神最給力的一天",`${md(best.d)} · ${WW.int(best.avg)}<small>MW</small>`,
         EN()?`could power ~${WW.int(homes*10)}k homes at once`:`約可同時供應 ${homes.toFixed(0)} 萬戶家庭用電`)}${
    card(EN()?"⚡ Energy over the period":"⚡ 這段期間吹出的電",energyTxt,
         EN()?`≈ ${co2>=1e4?(co2/1e3).toFixed(0)+"k":WW.int(co2)} t CO₂ avoided · daily avg ${Math.round(mean)} MW`
           :`約減碳 ${co2>=1e4?(co2/1e4).toFixed(1)+" 萬噸":WW.int(co2)+" 噸"} · 日平均出力 ${Math.round(mean)} MW`)}${
    card(EN()?"😴 Calmest day":"😴 風神休假的一天",`${md(calm.d)} · ${WW.int(calm.avg)}<small>MW</small>`,
         EN()?"wind rests too — that's why the grid mixes sources":"風也有休息的時候——這正是電網要多元電源互補的原因")}</div>`;
}
function chartHist(wrap){
  if(ARCHD_STATE!=="ok"){
    if(ARCHD_STATE==="idle"){
      ARCHD_STATE="loading";
      WW.getLiveJSON(ARCH_ENDPOINT).then(j=>{ARCHD=j;ARCHD_STATE="ok";}).catch(()=>{ARCHD_STATE="fail";})
        .finally(()=>{if(chartMode==="hist"&&curView==="charts")paintChart();});
    }
    wrap.innerHTML=`<div class="empty">${t(ARCHD_STATE==="fail"?"hist_none":"hist_loading")}</div>`;return;
  }
  const ds=histRows();
  if(ds.length<2){wrap.innerHTML=`<div class="empty">${t("hist_none")}</div>`;return;}
  const units=histUnits();
  const chips=units.length?`<div class="histchips"><button type="button" class="chip ${histUnit?"":"is-on"}">${t("hist_all")}</button>${
    units.map(u=>`<button type="button" class="chip ${histUnit===u?"is-on":""}" data-u="${esc(u)}">${esc(u)}</button>`).join("")}</div>`:"";
  wrap.innerHTML=`<div class="histpanel">${chips}${histCards(ds)}
    <div class="histsec">${EN()?"🗓️ Wind calendar · brighter = windier day (daily average)":"🗓️ 風況日曆 · 顏色越亮＝那天風越大（單日平均）"}</div>
    ${histCalendar(ds)}<div id="histline"></div></div>`;
  wrap.querySelectorAll(".histchips button").forEach(b=>b.onclick=()=>{histUnit=b.dataset.u||null;paintChart();});
  const lbl=d=>{const[y,m,dd]=d.split("-");return EN()?`${MN[+m]} ${+dd}, ${y}`:`${y}/${+m}/${+dd}`;};
  WW.chart.line(document.getElementById("histline"),{
    title:EN()?"📈 Daily trend (MW)":"📈 每日趨勢（MW）",
    subtitle:`${ds[0].d} ～ ${ds[ds.length-1].d}${histUnit?` · ${histUnit}`:""}`,
    x:ds.map((r,i)=>i),xFmt:i=>lbl(ds[i].d),xEvery:Math.max(7,Math.round(ds.length/6)),
    series:[{name:t("hist_max"),color:"#6fb3ff",values:ds.map(r=>r.max)},{name:t("hist_avg"),color:GEN.hi,values:ds.map(r=>r.avg),area:true}],
    yFmt:v=>WW.int(v),height:300,
    table:{head:[EN()?"Date":"日期",t("hist_avg")+" (MW)",t("hist_max")+" (MW)"],rows:ds.map(r=>[r.d,String(r.avg),String(r.max)])},
    source:t("cn_hist")});
}

/* ---------------- 詳情抽屜 ---------------- */
let sparkWin=6, sparkMetric="out";             // 趨勢範圍(小時) 與 指標(out=出力 / wind=風速)
const SPARK_RANGES=[[6,"r_6h"],[24,"r_24h"],[168,"r_7d"]];
function sparkSeries(f){                        // 取該風場最近 N 小時真實資料(依指標)
  // 用「時間窗」而非固定筆數：歷史點密度不均(即時抓取每 15 分一筆、官方回填每 10 分一筆)
  const key=sparkMetric==="wind"?"wind":"farms",pts=HIST.points||[];
  if(!pts.length)return[];
  const cut=new Date(pts[pts.length-1].t).getTime()-sparkWin*3600000;
  return pts.filter(p=>p&&p[key]&&typeof p[key][f.id]==="number"&&new Date(p.t).getTime()>=cut).map(p=>({t:p.t,v:p[key][f.id]}));
}
function sparkSVG(f){
  const s=sparkSeries(f),w=380,h=52;
  const col=sparkMetric==="wind"?"#6fb3ff":(hexColor(f)===GEN.na?"#9fb0c6":hexColor(f));
  if(s.length<2)
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="${h-2}" x2="${w}" y2="${h-2}" stroke="${col}" stroke-width="2" opacity=".4"/></svg>`;
  const vals=s.map(p=>p.v),base=sparkMetric==="wind"?2:(f.cap||1)*0.1,max=Math.max(...vals,base,0.5);
  const d=vals.map((v,i)=>`${(i/(vals.length-1)*w).toFixed(1)},${(h-v/max*h*0.9-2).toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(sparkLabel(f))}">
    <polyline points="0,${h} ${d} ${w},${h}" fill="${col}" opacity="0.12" stroke="none"/>
    <polyline points="${d}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}
function sparkLabel(f){
  const s=sparkSeries(f);
  const name=sparkMetric==="wind"?(EN()?"wind":"風速"):(EN()?"output":"出力");
  const src=sparkMetric==="wind"?(EN()?"nearest station · ref.":"鄰近測站·參考"):(EN()?"Taipower":"台電資料");
  if(s.length<2)return EN()?`${name} trend accruing (${s.length} pts so far · every 10–15 min)`:`${name}趨勢累積中（目前 ${s.length} 筆 · 每 10–15 分鐘一筆）`;
  const a=fmtSrc(s[0].t),b=fmtSrc(s[s.length-1].t).split(" ").pop();
  const vals=s.map(p=>p.v),peak=Math.max(...vals);
  const unit=sparkMetric==="wind"?"m/s":"MW";
  return EN()?`${a}–${b} actual ${name} · every 10–15 min (${src}) · peak ${peak.toFixed(1)} ${unit}`:`${a}–${b} 實際${name} · 每 10–15 分鐘一筆（${src}）· 峰值 ${peak.toFixed(1)} ${unit}`;
}
function renderSparkBox(f){return `${sparkSVG(f)}<div class="note" style="margin-top:6px">${esc(sparkLabel(f))}</div>`;}
let lastFocus=null;
function openDrawer(id){
  const f=FARMS.find(x=>x.id===id);if(!f)return;drawerFarm=f;
  lastFocus=document.activeElement;
  document.getElementById("dname").textContent=EN()?f.tp:f.name;
  document.getElementById("dsub").textContent=`${EN()?"Taipower unit":"台電機組名稱"}：${f.tp} · ${f.dev}`;
  const r=ratioOf(f)*100,off=isOffshore(f);
  const stxt=f.pending?t("st_test"):(f.agg?t("st_agg"):t("st_run"));
  const capTxt=f.cap?`${f.cap} MW`:(f.planned&&f.planned!=="—"?`${t("planned")} ${f.planned} MW`:t("notListed"));
  const specs=[
    [t("d_cap"),capTxt],[t("d_status"),stxt],
    ...(off?[[t("d_turbines"),f.turbines||"—"],[t("d_unit"),f.unit||"—"],
            [t("d_model"),f.model||"—",true],[t("d_depth"),f.depth||"—"],[t("d_dist"),f.dist||"—"],
            [t("d_annual"),f.annual||"—"],[t("d_homes"),f.homes||"—"]]
          :[[t("d_site"),f.site||"—",true],[t("d_type2"),f.model||"—"],[t("d_unit"),f.unit||"—"]]),
  ];
  const gname=GLOBE_FARM[f.id];
  document.getElementById("dbody").innerHTML=`
    <div class="liveblock">
      <div class="lt">
        <div><div class="lab">${t("d_output")} ${LIVE?"":t("simTag")}</div>
          <div class="out">${(RT[f.id]||0).toFixed(1)}<small>MW</small></div></div>
        <div class="ratio"><div class="v">${f.cap?r.toFixed(0)+"%":"—"}</div><div class="lab">${t("d_avail")}</div></div>
      </div>
      <div class="sparkctl">
        <div class="segctl sm" id="sparkRange">${SPARK_RANGES.map(([wv,l])=>`<button type="button" data-w="${wv}" class="${sparkWin===wv?'is-on':''}">${t(l)}</button>`).join("")}</div>
        <div class="segctl sm" id="sparkMetric"><button type="button" data-m="out" class="${sparkMetric==='out'?'is-on':''}">${t("m_out")}</button><button type="button" data-m="wind" class="${sparkMetric==='wind'?'is-on':''}">${t("m_wind")}</button></div>
      </div>
      <div id="sparkbox">${renderSparkBox(f)}</div>
      ${(()=>{const w=windOf(f);return w?`<div class="windnote">🌬 ${t("windNote")} <b>${w.mps.toFixed(1)} m/s</b>（${esc(w.station)}${EN()?" station · "+w.km+" km · ":"測站 · 距 "+w.km+" km · "}${t("windRef")}）</div>`:"";})()}</div>
    <div class="specs">${specs.map(s=>`<div class="sp${s[2]?" wide":""}"><div class="l">${s[0]}</div>
      <div class="v" style="font-size:${s[2]?"13px":"14px"}">${esc(s[1])}</div></div>`).join("")}</div>
    <div class="timeline"><div class="tlh">${t("timeline")}</div>
      <div class="tl">${f.tl.map(x=>`<div class="tlitem ${x[2]}"><div class="d">${esc(x[0])}</div><div class="t">${esc(x[1])}</div></div>`).join("")}</div></div>
    ${f.note?`<div class="dnote">${esc(f.note)}</div>`:""}
    ${gname?`<a class="btn hist dglobe" href="${WW.hashFor("global",null,{f:gname})}">🌍 ${t("onGlobe")} <span class="arr">→</span></a>`:""}`;
  const rerender=()=>{document.getElementById("sparkbox").innerHTML=renderSparkBox(f);};
  document.getElementById("sparkRange").onclick=e=>{const b=e.target.closest("button");if(!b)return;
    document.querySelectorAll("#sparkRange button").forEach(x=>x.classList.toggle("is-on",x===b));sparkWin=+b.dataset.w;rerender();};
  document.getElementById("sparkMetric").onclick=e=>{const b=e.target.closest("button");if(!b)return;
    document.querySelectorAll("#sparkMetric button").forEach(x=>x.classList.toggle("is-on",x===b));sparkMetric=b.dataset.m;rerender();};
  const dr=document.getElementById("drawer");
  const gl=dr.querySelector(".dglobe");if(gl)gl.addEventListener("click",()=>closeDrawer(true));
  dr.hidden=false;
  requestAnimationFrame(()=>{document.getElementById("scrim").classList.add("is-on");dr.classList.add("is-on");document.getElementById("dclose").focus();});
}
function closeDrawer(noRestore){
  const dr=document.getElementById("drawer");if(!dr.classList.contains("is-on"))return;
  document.getElementById("scrim").classList.remove("is-on");dr.classList.remove("is-on");drawerFarm=null;
  setTimeout(()=>{if(!dr.classList.contains("is-on"))dr.hidden=true;},360);
  if(!noRestore&&lastFocus&&lastFocus.focus)lastFocus.focus();
}
document.getElementById("dclose").onclick=()=>closeDrawer();
document.getElementById("scrim").onclick=()=>closeDrawer();
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer();});

/* ---------------- 地圖（Leaflet 延遲載入） ---------------- */
let map=null,markers={};
const LEAFLET_CSS="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",LEAFLET_JS="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
async function initMap(){
  if(map){map.invalidateSize();return;}
  try{await Promise.all([WW.loadCSS(LEAFLET_CSS),WW.loadScript(LEAFLET_JS)]);}
  catch(e){document.getElementById("map").innerHTML=`<div class="empty">${EN()?"Map library could not be loaded (offline?).":"地圖元件載入失敗（可能離線）。"}</div>`;return;}
  if(map)return;
  map=L.map("map",{zoomControl:true}).setView([24.1,120.3],8);
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {maxZoom:18,attribution:"Tiles © Esri"}).addTo(map);
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {maxZoom:18,opacity:.9}).addTo(map);
  FARMS.forEach(f=>{
    const m=L.circleMarker([f.lat,f.lng],{radius:Math.max(6,Math.sqrt(sizeMW(f))*0.85),
      color:"#fff",weight:1.1,fillColor:hexColor(f),fillOpacity:.85}).addTo(map);
    m.bindPopup(popHTML(f),{maxWidth:280});
    m.on("popupopen",()=>{const b=document.getElementById(`pop-${f.id}`);if(b)b.onclick=()=>{map.closePopup();openDrawer(f.id);};});
    markers[f.id]=m;});
  setTimeout(()=>map.invalidateSize(),60);
}
function popHTML(f){
  const r=f.cap?Math.max(0,Math.min(100,ratioOf(f)*100)):0;
  const capTxt=f.cap?`${f.cap} MW`:(f.planned&&f.planned!=="—"?`${t("planned")} ${f.planned} MW`:t("notListed"));
  return `<div class="pop"><h3>${esc(EN()?f.tp:f.name)}</h3>
    <div class="pr"><span>${t("popUnit")}</span><b>${esc(f.tp)}</b></div>
    <div class="pr"><span>${t("d_output")}</span><b class="num">${(RT[f.id]||0).toFixed(1)} MW</b></div>
    <div class="pr"><span>${t("d_cap")}</span><b class="num">${esc(capTxt)}</b></div>
    ${f.cap?`<div class="pr"><span>${t("d_avail")}</span><b class="num">${r.toFixed(0)}%</b></div>
    <div class="pbar"><i style="width:${r}%;background:${hexColor(f)}"></i></div>`:""}
    <div class="pr"><span>${esc(f.dev)}</span></div>
    <button type="button" id="pop-${f.id}">${t("popMore")}</button></div>`;
}
function updateMarkers(){if(!map)return;FARMS.forEach(f=>{const m=markers[f.id];if(m){m.setStyle({fillColor:hexColor(f)});
  if(m.isPopupOpen())m.setPopupContent(popHTML(f));}});}

/* ---------------- 分享圖卡（1080×1080，含醒目資料時間） ---------------- */
function shareText(){
  const total=Math.round(totals().total);
  const sh=(LIVE&&sysTotal>0)?(EN()?`, ${(total/sysTotal*100).toFixed(1)}% of the national grid`:`，佔全國發電 ${(total/sysTotal*100).toFixed(1)}%`):"";
  return EN()?`🌬 Taiwan's wind power right now: ~${total.toLocaleString()} MW${sh}. See the live status 👉`
           :`🌬 台灣此刻風電即時出力約 ${total.toLocaleString()} MW${sh}。一起看台灣風電即時風況與全球發展 👉`;
}
function roundRect(x,X,Y,W,H,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+W,Y,X+W,Y+H,r);x.arcTo(X+W,Y+H,X,Y+H,r);x.arcTo(X,Y+H,X,Y,r);x.arcTo(X,Y,X+W,Y,r);x.closePath();}
function drawShareCard(){                       // 產生 1080×1080 即時風況圖卡(canvas)
  const S=1080,cv=document.createElement("canvas");cv.width=S;cv.height=S;
  const x=cv.getContext("2d"),CN='"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif',P=80;
  const g=x.createLinearGradient(0,0,S,S);g.addColorStop(0,"#10223a");g.addColorStop(1,"#060d18");
  x.fillStyle=g;x.fillRect(0,0,S,S);x.strokeStyle="rgba(255,255,255,.14)";x.lineWidth=2;roundRect(x,24,24,S-48,S-48,20);x.stroke();
  x.textBaseline="alphabetic";x.textAlign="left";
  x.fillStyle="#eaf1f8";x.font=`800 54px ${CN}`;x.fillText(EN()?"Taiwan Wind Watch":"風電風情 · 台灣風力發電",P,132);
  x.fillStyle="#7d8ca3";x.font="600 24px sans-serif";x.fillText("TAIWAN WIND WATCH",P,168);
  // 圖卡會脫離網站情境被轉傳，時間務必含年份且要醒目，否則事後無從得知是哪一年、容易被誤認成「當下」的數字。
  const fmtSrcFull=s=>{if(!s)return"";const d=new Date(s);if(isNaN(d))return s;
    const p=n=>String(n).padStart(2,"0");
    return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;};
  const st=srcTime?fmtSrcFull(srcTime):"";
  if(st){
    const dtText=(EN()?"As of ":"資料時間 ")+st;
    x.font=`700 30px ${CN}`;
    const dtW=x.measureText(dtText).width,padX=22,pillH=52,pillW=dtW+padX*2,pillX=S-P-pillW,pillY=186;
    roundRect(x,pillX,pillY,pillW,pillH,pillH/2);x.fillStyle="#0d1829";x.fill();x.strokeStyle="#3fdcb0";x.lineWidth=2;x.stroke();
    x.textAlign="right";x.fillStyle="#3fdcb0";x.fillText(dtText,pillX+pillW-padX,pillY+pillH/2+10);x.textAlign="left";
  }
  const total=Math.round(totals().total);
  x.fillStyle="#a9b7c9";x.font=`500 36px ${CN}`;x.fillText(EN()?"Taiwan's wind power right now":"台灣此刻風電即時出力",P,290);
  const ns=total.toLocaleString();x.fillStyle="#eaf1f8";x.font=`800 156px ${CN}`;
  const nw=x.measureText(ns).width;x.fillText(ns,P,432);   // 先量寬度(同字體)再畫，避免 MW 重疊
  x.fillStyle="#a9b7c9";x.font="700 58px sans-serif";x.fillText("MW",P+nw+26,432);
  const cap=FARMS.reduce((s,f)=>s+(f.cap||0),0),hm=Math.round(total*1000/0.5/10000);
  const blocks=[[cap>0?(total/cap*100).toFixed(0)+"%":"—",EN()?"Availability":"可用率"],
    [(LIVE&&sysTotal>0)?(total/sysTotal*100).toFixed(1)+"%":"—",EN()?"of national grid":"佔全國發電"],
    [EN()?(hm*10)+"k":hm+"萬戶",EN()?"homes (est.)":"可供家庭(估算)"]];
  let bx=P;const bw=(S-2*P-2*24)/3;
  blocks.forEach(b=>{roundRect(x,bx,500,bw,120,16);x.fillStyle="#0d1829";x.fill();x.strokeStyle="rgba(255,255,255,.14)";x.stroke();
    x.textAlign="center";x.fillStyle="#eaf1f8";x.font=`800 46px ${CN}`;x.fillText(b[0],bx+bw/2,560);
    x.fillStyle="#7d8ca3";x.font=`500 22px ${CN}`;x.fillText(b[1],bx+bw/2,598);x.textAlign="left";bx+=bw+24;});
  x.fillStyle="#a9b7c9";x.font=`600 26px ${CN}`;x.fillText(EN()?"Top farms right now":"此刻出力前段風場",P,700);
  const top=[...FARMS].sort((a,b)=>RT[b.id]-RT[a.id]).slice(0,6),mx=Math.max(1,...top.map(f=>RT[f.id]));
  let ty=726;const tX=P+176,tW=S-tX-P-118;
  top.forEach(f=>{x.textAlign="right";x.fillStyle="#a9b7c9";x.font=`600 23px ${CN}`;x.fillText(f.tp,P+160,ty+26);x.textAlign="left";
    x.fillStyle="#16243a";roundRect(x,tX,ty+8,tW,24,7);x.fill();
    x.fillStyle=hexColor(f);roundRect(x,tX,ty+8,Math.max(6,RT[f.id]/mx*tW),24,7);x.fill();
    x.fillStyle="#eaf1f8";x.font=`700 23px ${CN}`;x.fillText((RT[f.id]||0).toFixed(0)+" MW",tX+tW+12,ty+27);ty+=39;});
  x.fillStyle="#7d8ca3";x.font=`500 22px ${CN}`;
  x.fillText(EN()?"Data: Taipower + CWA":"資料：台電＋中央氣象署",P,992);
  x.fillStyle="#5b6b80";x.font=`400 18px ${CN}`;
  x.fillText(EN()?"Figures are rough estimates from public data, for reference only.":"以上數據為公開資料整理之粗略估算，僅供參考，非官方正式數字。",P,1020);
  x.fillStyle="#3fdcb0";x.font=`700 27px ${CN}`;x.fillText("dofliu.github.io/windfarmTaiwan",P,1052);
  return cv;
}
async function doShareText(){                   // 純文字/連結後援
  const url=WW.pageURL("#/live"),text=shareText();
  if(navigator.share){try{await navigator.share({title:"風電風情",text,url});return;}catch(e){if(e&&e.name==="AbortError")return;}}
  try{await navigator.clipboard.writeText(text+" "+url);WW.toast(EN()?"Copied ✓":"已複製分享文字與連結 ✓");}catch(e){WW.toast(EN()?"Please copy the URL manually":"請手動複製網址");}
}
function shareCard(){
  let cv;try{cv=drawShareCard();}catch(e){return doShareText();}
  const url=WW.pageURL("#/live");
  cv.toBlob(async blob=>{
    if(!blob)return doShareText();
    const file=new File([blob],"taiwan-wind.png",{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:"風電風情 Taiwan Wind Watch",text:shareText(),url});return;}catch(e){if(e&&e.name==="AbortError")return;}}
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="taiwan-wind.png";a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);WW.toast(EN()?"Card image downloaded ✓":"風況圖卡已下載 ✓");
  },"image/png");
}
WW.shareHandlers.live=shareCard;

/* ---------------- 子分頁與路由 ---------------- */
let curView="dash";
const VIEWS=["dash","wall","charts","map"];
function syncSubbarH(){const sb=document.getElementById("lv-subbar");if(sb)document.documentElement.style.setProperty("--subbar-h",sb.offsetHeight+"px");}
function showView(v){
  if(!VIEWS.includes(v))v="dash";
  curView=v;
  document.querySelectorAll("#page-live .lv").forEach(el=>{el.hidden=el.dataset.lv!==v;});
  document.querySelectorAll("#lvnav a").forEach(a=>{if(a.dataset.lv===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  syncSubbarH();
  if(v==="wall")paintWall();
  if(v==="charts")paintChart();
  if(v==="map")initMap();
}
WW.registerPage("live",{
  enter(r){
    if(r.sub==="charts"&&r.params.mode&&["bar","donut","hist"].includes(r.params.mode))chartMode=r.params.mode;
    showView(r.sub||"dash");
    if(r.params.farm)openDrawer(r.params.farm);
  },
  leave(){closeDrawer(true);}
});
document.getElementById("chartmode").onclick=e=>{const b=e.target.closest("button");if(!b)return;chartMode=b.dataset.c;paintChart();};
document.getElementById("sort").onclick=e=>{const b=e.target.closest("button");if(!b)return;
  document.querySelectorAll("#sort button").forEach(x=>x.classList.toggle("is-on",x===b));sortKey=b.dataset.s;paintGroups();};
document.getElementById("filt").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;
  document.querySelectorAll("#filt .chip").forEach(x=>x.classList.toggle("is-on",x===b));filt=b.dataset.f;paintGroups();};
document.getElementById("grpmode").onclick=e=>{const b=e.target.closest("button");if(!b)return;
  document.querySelectorAll("#grpmode button").forEach(x=>x.classList.toggle("is-on",x===b));groupMode=b.dataset.g;paintGroups();};
// 儀表工具列(排序/分組/篩選)預設收合，避免蓋掉風場卡片牆；記住上次展開/收合狀態
const tbToggle=document.getElementById("tbtoggle"),tbBody=document.getElementById("tbbody");
function setToolbarOpen(open){
  tbBody.classList.toggle("is-open",open);
  tbToggle.setAttribute("aria-expanded",open?"true":"false");
  WW.store.set("wf_toolbar_open",open?"1":"0");
}
tbToggle.onclick=()=>setToolbarOpen(!tbBody.classList.contains("is-open"));
setToolbarOpen(WW.store.get("wf_toolbar_open","0")==="1");
window.addEventListener("resize",syncSubbarH);

WW.onLang(()=>{
  buildFilterSelects();setFeed(LIVE);paint();paintTwRank();
  if(drawerFarm)openDrawer(drawerFarm.id);
  if(map)FARMS.forEach(f=>{const m=markers[f.id];if(m)m.setPopupContent(popHTML(f));});
});

/* ---------------- 對外介面（首頁、地球儀用） ---------------- */
WW.live={
  FARMS,RT,GLOBE_FARM,
  isLive:()=>LIVE,srcTime:()=>srcTime,fmtSrc,
  totals,impactVals,moodParts,tier,hexColor,
  onUpdate(fn){subs.push(fn);},
  openDrawer,
  /* 全球資料集的風場名稱 → 對應的即時機組（例：大彰化 1&2a → 沃一風＋沃二風） */
  unitsForGlobalFarm(name){return FARMS.filter(f=>GLOBE_FARM[f.id]===name);}
};

buildFilterSelects();
refresh();tryLive();tryHistory();tryGrid();paintTwRank();
setInterval(refresh,15000);
if(DATA_ENDPOINT){setInterval(tryLive,600000);setInterval(tryHistory,600000);setInterval(tryGrid,600000);}
})();
