# 離岸風場水下基礎型式

[English](foundations.en.md) ｜ 中文（本頁）

> 由 `tools/build_foundations.py` 依 `tools/farm_foundations.py` 的逐場對照表產生，請勿手動編輯。整理時間：2026-09。

地球儀的「顯示」選單有「離岸：水下基礎」圖層，依基礎型式為離岸風場上色。資料一步一步收集：

1. **北海與東北大西洋（OSPAR 涵蓋範圍）**：已完成（2026-09）。
2. **歐洲其他風場**（波羅的海、地中海、艾瑟爾湖，以及 OSPAR 2024 之後才完工的風場）：已完成（2026-09）。
3. **浮動式風場的細分型式**（全球）：已完成（2026-09）。
4. **台灣、日本、韓國、美國**：已完成（2026-09）。
5. **中國、越南**：進行中：已依使用者 2026-09 的逐案覆核補上中國 5 座，出處原文待核對。

本頁是前四步與第 5 步已完成部分的結果。還沒查到的離岸風場標「型式不詳」，不臆測。

## 來源與方法

- **OSPAR Offshore Renewable Energy Developments 2024**（[ODIMS](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/)，CC0，資料時間 2024-01-01）是唯一逐場列出基礎型式的開放資料。取其中「營運中」的風機紀錄，逐筆比對本站風場的名稱、位置（OSPAR 範圍圖）與容量；`data/global/sources/ospar_offshore_renewables_2024.csv` 是取出的原始值。
- OSPAR 不一定是建成後的樣子：德國的紀錄有 10 筆只寫「單樁／三腳／三樁／套管／重力式／其他」任一種，Merkur、Veja Mate、Trianel Borkum II、alpha ventus 與建成紀錄不符；英國 Hornsea One 西區也不符。所以德國每一座都以德文維基百科（附建造紀錄）為準，其他不符的逐筆附第二來源與說明。
- **第 2 步**：OSPAR 不涵蓋波羅的海與地中海，2024 年以後才完工的風場也只有核准階段的設計（設計可能改變）。這些風場逐座查開發商、施工廠商、產業新聞、政府文件或維基百科，每座都附出處，引用的原文逐筆核對過；OSPAR 有核准階段紀錄的，一律再附施工紀錄（建置時檢查）。
- **第 3 步**：全球的浮動式風場補上細分型式：單柱式（spar）、半潛式、駁船式（含阻尼池式）、張力腳平台，逐座查技術供應商、開發商或產業新聞，引用的原文逐筆核對過；同一筆紀錄含不同型式的機組時，在說明欄逐部寫出。
- **第 4 步**：台灣、日本、韓國、美國的離岸風場都沒有 OSPAR 紀錄，逐座查開發商、施工廠商、政府文件或產業新聞，引用的原文逐筆核對過（日文、韓文網頁依網頁編碼比對，PDF 逐頁比對），不引用 4C Offshore；日本港灣內的風場以 NEDO 的支持構造分類為準（NEDO 明寫「ドルフィン」就是 High-Rise Pile Cap 高樁承台）。查不到型式的列在下方「查過但暫不列入」。
- **第 5 步（進行中）**：依使用者 2026-09-27 整理的《全球離岸風場資料庫｜亞洲查核版 v2》「亞洲逐案覆核」補上中國 5 座，出處為該表各列的第一手來源（三峽集團、上海市政府、中廣核）；這批原文尚未以 `tools/check_quotes.py` 核對（整理時的工作環境無法連線），列在 TODO 待補。越南各案該表只寫潮間帶／近岸、細分待查，未列入。新增「複合筒」型式，歸在「其他固定式」色組。
- 下表「來源」欄：OSPAR 紀錄附上它寫的原值；其他連結是第二來源，或沒有 OSPAR 紀錄時的出處。
- 地圖上色依結構歸成四組（多於三種顏色在地圖上分不清）：單樁、鋼構框架（套管、三腳架、三樁）、浮動式、其他固定式（重力式、高樁承台、圍堰式、岩錨式、複合筒、混合）；風場卡片與本頁寫出確切型式。

## 各國進度（營運中的離岸風場）

合計：已知型式 172／371 座，占容量 41.6%（浮動式風場本來就知道是浮動式，細分型式見下方「浮動式風場」）。

| 國家 | 營運中 | 已知型式 | 占容量 | 單樁 | 鋼構框架 | 浮動式 | 其他固定式 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 中國大陸 | 177 | 8 | 2% | 1 | 1 | 3 | 3 |
| 英國 | 44 | 44 | 100% | 33 | 8 | 2 | 1 |
| 德國 | 35 | 35 | 100% | 25 | 5 |  | 5 |
| 荷蘭 | 13 | 13 | 100% | 12 |  |  | 1 |
| 台灣 | 8 | 8 | 100% | 3 | 5 |  |  |
| 丹麥 | 17 | 16 | 99% | 8 |  |  | 8 |
| 比利時 | 12 | 12 | 100% | 8 | 3 |  | 1 |
| 法國 | 6 | 6 | 100% | 2 | 1 | 2 | 1 |
| 越南 | 27 | 0 | 0% |  |  |  |  |
| 南韓 | 7 | 6 | 89% | 1 | 4 | 1 |  |
| 日本 | 10 | 9 | 98% | 5 | 1 | 2 | 1 |
| 瑞典 | 4 | 4 | 100% | 1 |  |  | 3 |
| 美國 | 3 | 3 | 100% | 2 | 1 |  |  |
| 挪威 | 3 | 3 | 100% |  |  | 3 |  |
| 芬蘭 | 1 | 1 | 100% |  |  |  | 1 |
| 義大利 | 1 | 1 | 100% | 1 |  |  |  |
| 葡萄牙 | 1 | 1 | 100% |  |  | 1 |  |
| 西班牙 | 2 | 2 | 100% |  |  | 1 | 1 |

## 浮動式風場（營運中）

共 15 座、260.8 MW：單柱式 5、半潛式 5、駁船式 3、張力腳 1、細分型式不詳或混合 1。

## 逐場清單

### 中國大陸

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| 中廣核如東H8（CGN Rudong H8） | 300 | 2021 | 混合：單樁 49、複合筒 16 | [ecp.cgnpc.com.cn](https://ecp.cgnpc.com.cn/view/staticpags/zgh_zbgg/8a488fc36fae46600171bacf23d163d0.html) | 65 部風機：49 座單樁、16 座全鋼筒型（與複合筒同為以負壓沉入的單筒基礎，筒體與過渡段全為鋼製）；2021 年 12 月全容量併網 |
| 三峽如東H10（CTG Rudong H10） | 400 | 2021 | 混合：單樁 77、複合筒 23 | [eps.ctg.com.cn](https://eps.ctg.com.cn/cms/channel/1ywgg1/19830.htm) | 100 部 4 MW 風機：77 座單樁、23 座複合筒（2021 年 12 月全容量併網） |
| 三峽如東H6（CTG Rudong H6） | 400 | 2021 | 單樁 | [eps.ctg.com.cn](https://eps.ctg.com.cn/cms/channel/1ywgg1/17129.htm) | 100 部 4 MW 風機，全部為單樁（2021 年 12 月全容量併網；與 H10 共用柔性直流送出） |
| 三峽漳浦六鰲二期（CTG Zhangpu Liu'ao Phase 2） | 400 | 2024 | 套管式 | [gxt.fj.gov.cn](https://gxt.fj.gov.cn/zwgk/xw/hydt/snhydt/202405/t20240523_6453562.htm) | 四樁套管（福建省工信廳：機位水深逾 46 m，設計團隊採「4 樁導管架」）；28 部 13 MW 以上機組（含 6 部 16 MW），2024 年 6 月全容量併網（澎湃新聞） |
| 東海大橋海上風電場（Donghai Bridge） | 102 | 2010 | 高樁承台 | [shanghai.gov.cn](https://www.shanghai.gov.cn/nw5827/20200905/0001-5827_437507.html) | 34 部 3 MW 風機立在高樁混凝土承台上（上海市政府：2010 年 6 月 8 日全部風機併網），中國第一座大型離岸風場 |
| 海油觀瀾號（Haiyou Guanlan (CNOOC floating)） | 7.2 | 2023 | 浮動式（半潛式） | [offshorewind.biz](https://www.offshorewind.biz/2023/05/22/china-connects-deepwater-floating-wind-platform-to-wenchang-oil-field/) | 半潛式；供電給文昌油田群，不接公用電網 |
| 明陽天成號浮式（Mingyang OceanX (Tiancheng) floating） | 16.6 | 2024 | 浮動式（半潛式） | [mlit.go.jp](https://www.mlit.go.jp/kowan/content/001869831.pdf) | 一座浮台上兩部 8.3 MW 風機，浮台由浮筒與混凝土構件組成（日本國土交通省的調查列為半潛式） |
| 三峽引領號（Yangjiang Shapa 'Sanxia Yinling' floating） | 5.5 | 2021 | 浮動式（半潛式） | [sasac.gov.cn](http://www.sasac.gov.cn/n4470048/n22624391/n26705666/n26705673/n26705740/c26786615/content.html) | 半潛式平台 |

### 丹麥

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Anholt | 400 | 2013 | 單樁 | [OSPAR DK14](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Avedøre Holme | 10.8 | 2009 | 重力式 | [ens.dk](https://ens.dk/media/2599/download) | 3 座混凝土重力式基座，立在堤外約 2 m 深的水中（依 2008 年環評的設計） |
| Horns Rev 1 | 160 | 2002 | 單樁 | [OSPAR DK02](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Horns Rev 2 | 209 | 2009 | 單樁 | [OSPAR DK05](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Horns Rev 3 | 407 | 2019 | 單樁 | [OSPAR DK24](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Kriegers Flak | 605 | 2021 | 單樁 | [group.vattenfall.com](https://group.vattenfall.com/press-and-media/newsroom/2020/all-kriegers-flak-foundations-installed) | 72 座單樁 |
| Middelgrunden | 40.0 | 2000 | 重力式 | [ens.dk](https://ens.dk/media/6684/download) | 混凝土重力式基礎 |
| Nissum Bredning Vind | 28.0 | 2018 | 重力式 | [OSPAR DK23](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「gravity-based」 |  |
| Nysted (Rødsand I) | 166 | 2003 | 重力式 | [m.aarsleff.com](https://m.aarsleff.com/img/7435/0/0/Download/057-r%C3%B8dsand-uk) | 壓艙的混凝土沉箱；2022 年一部風機倒塌拆除、一部停用，其餘 70 部繼續運轉 |
| Rødsand II | 207 | 2010 | 重力式 | [m.aarsleff.com](https://m.aarsleff.com/img/6885/0/0/Download/180-r%C3%B8dsand-2-uk) | 混凝土沉箱重力式基礎（與 Nysted 相同） |
| Rønland | 17.2 | 2003 | 重力式 | [OSPAR DK04](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「gravity-based」 |  |
| Samsø | 23.0 | 2003 | 單樁 | [ens.dk](https://ens.dk/media/2563/download) | 10 座單樁，配混凝土轉接段 |
| Sprogø | 21.0 | 2009 | 重力式 | [boskalis.com](https://boskalis.com/about-us/projects/offshore-wind-farm-sprogo) | 混凝土重力式基礎（每座最重約 1,900 噸） |
| Tunø Knob | 5.0 | 1995 | 重力式 | [osti.gov](https://www.osti.gov/etdeweb/biblio/630721) | 箱型沉箱重力式基礎 |
| Vesterhav Nord | 176 | 2024 | 單樁 | [OSPAR DK27](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Vesterhav Syd | 168 | 2024 | 單樁 | [OSPAR DK26](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |

### 南韓

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| 濟州翰林海上風電（Jeju Hanlim） | 100 | 2024 | 套管式 | [kgs-m.org](https://www.kgs-m.org/magazine/kgsm/sm-35/pt-post/nd-582) | 18 座套管，採後打樁：先整平玄武岩放置套管，再以反循環（RCD）鑽孔打樁灌漿 |
| 濟州月汀試驗（Jeju Woljeong test (Doosan)） | 5.0 | 2012 | 套管式 | [cloudcdn.taiwantradeshows.com.tw](https://cloudcdn.taiwantradeshows.com.tw/2019/energytaiwan/download/Wind-Energy-Forum-KR.pdf) | 2 部試驗機各立在鋼製套管上：能源技術研究院說明 2 MW 那座是以短基樁固定的傾斜兩段式套管；斗山 3 MW 那座只有 2019 年的產業簡報寫明型式 |
| 全南海上風電 1 號（Jeonnam Offshore Wind 1） | 96.0 | 2025 | 單樁 | [epj.co.kr](https://www.epj.co.kr/news/articleView.html?idxno=37579) | 10 座單樁，韓國第一座以單樁為基礎的離岸風場 |
| 西南海海上風電示範（Southwest Offshore Demonstration (Seonam)） | 60.0 | 2020 | 套管式 | [e2news.com](http://www.e2news.com/news/articleView.html?idxno=101605) | 20 座套管：19 座打樁式（含 2 號機浦項的研發用套管），7 號機是韓電電力研究院的吸力桶套管 |
| 耽羅海上風電（Tamra (Jeju Hangyeong)） | 30.0 | 2017 | 套管式 | [tamra-owp.co.kr](http://tamra-owp.co.kr/2019/sub0206.php) | 10 座套管，基樁以反循環（RCD）鑽入玄武岩海床後灌漿固定 |
| 靈光落月海上風電（Yeonggwang Nakwol） | 365 | 2026 | 單樁 | [electimes.com](https://www.electimes.com/news/articleView.html?idxno=368993) | 64 座單樁（GS Entec 製，長 60.2–71.2 m、底部直徑 7.5 m）；韓國第一座改用單樁的大型離岸風場 |

### 台灣

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| 彰芳暨西島離岸風場（Changfang & Xidao） | 589 | 2024 | 套管式 | [offshorewind.biz](https://www.offshorewind.biz/2023/07/17/all-foundations-stand-at-changfang-xidao-wind-farms-offshore-taiwan/) | 62 座三腳套管（世紀風電製造），共 186 支基樁 |
| 海洋風電一期 (示範)（Formosa 1 Phase 1） | 8.0 | 2017 | 單樁 | [siemensgamesa.com](https://www.siemensgamesa.com/global/en/home/press-releases/siemens-gamesa-awarded-120-mw-expansion-of-taiwans-pioneering-formosa-1-offshore-wind-power-plant.html) | 2 座單樁，2016 年與兩部示範機組一起安裝 |
| 海洋風電二期（Formosa 1 Phase 2） | 120 | 2019 | 單樁 | [jandenul.com](https://www.jandenul.com/news/all-foundations-formosa-1-phase-2-installed) | 20 座單樁，配灌漿接合的轉接段 |
| 海能風電 (海洋二期)（Formosa 2） | 376 | 2023 | 套管式 | [jandenul.com](https://www.jandenul.com/news/jan-de-nul-completes-foundation-and-cable-installation-formosa-2-offshore-wind-farm) | 47 座套管，共 188 支基樁（2022 年裝完） |
| 大彰化東南及西南離岸風場（Greater Changhua 1 & 2a） | 900 | 2024 | 套管式 | [cdn.orsted.com](https://cdn.orsted.com/-/media/www/docs/corp/tw/en-chw-1-and-2a-case-study.pdf) | 111 座套管，每座 3 支基樁（共 333 支）；其中 6 座全部在台灣製造 |
| 大彰化西南第二階段及西北（Greater Changhua 2b & 4） | 920 | 2026 | 套管式（吸力桶） | [heerema.com](https://heerema.com/news/heerema-sets-down-last-suction-bucket-jacket-at-%C3%B8rsteds-greater-changhua-2a-4) | 66 座全數為吸力桶套管（不打樁）：大彰化西南第二階段 24 座、西北 42 座，是亞太第一座全用吸力桶的風場 |
| 海龍離岸風場（Hai Long 2 & 3） | 1,044 | 2026 | 套管式 | [cdwe.com.tw](https://www.cdwe.com.tw/news_detail.php?id=151) | 73 座套管，每座 3 支預打基樁（共 219 支），2025 年 8 月裝完 |
| 台電離岸風電一期（Taipower Offshore Phase 1 (Changhua)） | 109 | 2021 | 套管式 | [jandenul.com](https://www.jandenul.com/our-projects/offshore-windfarm-changhua-taiwan) | 21 座四腳套管配轉接段，各以 4 支預打的基樁灌漿固定（共 84 支） |
| 台電離岸風電二期（Taipower Offshore Phase 2） | 294 | 2026 | 套管式 | [tpc-offshorewind-p2.tw](https://tpc-offshorewind-p2.tw/foundation) | 31 座四腳套管配轉接段，以 124 支預打基樁灌漿固定 |
| 允能雲林離岸風場（Yunlin） | 640 | 2025 | 單樁 | [yunlin-offshore.com](https://www.yunlin-offshore.com/en/technology) | 80 座直徑 8 m 的單樁配轉接段（另有 3 座 2021–2023 年發生溜樁的單樁已移除，不計在內） |
| 中能離岸風場（Zhong Neng） | 294 | 2025 | 套管式 | [offshorewind.biz](https://www.offshorewind.biz/2024/03/04/all-foundations-in-at-zhong-neng-wind-farm-offshore-taiwan/) | 31 座套管（世鎧精密製造），共 93 支國產基樁 |

### 德國

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Albatros | 112 | 2019 | 單樁 | [OSPAR DE037](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Albatros) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Amrumbank West | 302 | 2015 | 單樁 | [OSPAR DE005](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Amrumbank_West) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Arcadis Ost 1 | 257 | 2023 | 單樁 | [parkwind.eu](https://parkwind.eu/news/ao1-monopile-installation-completed) | XXL 單樁 |
| Arkona | 385 | 2019 | 單樁 | [offshorewind.biz](https://www.offshorewind.biz/2017/11/09/all-monopiles-installed-at-arkona-offshore-wind-farm-tps-next/) | 60 座單樁 |
| BARD Offshore 1 | 400 | 2013 | 三樁 | [OSPAR DE021](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「tripile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/BARD_Offshore_1) |  |
| Baltic Eagle | 476 | 2024 | 單樁 | [energyglobal.com](https://www.energyglobal.com/wind/12092023/iberdrola-completes-installation-of-all-50-monopiles-at-baltic-eagle-offshore-wind-farm/) | 50 座單樁 |
| Borkum Riffgrund 1 | 312 | 2015 | 單樁 | [OSPAR DE004](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Borkum_Riffgrund) | 77 座單樁，另有 1 座吸力桶套管（試驗） |
| Borkum Riffgrund 2 | 450 | 2019 | 混合：單樁 36、套管式 20（吸力桶） | [OSPAR DE028](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Borkum_Riffgrund) | 36 座單樁、20 座吸力桶套管 |
| Borkum Riffgrund 3 | 913 | 2025 | 單樁 | [OSPAR DE130](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[jandenul.com](https://www.jandenul.com/news/jan-de-nul-kicks-orsteds-borkum-riffgrund-3-offshore-wind-farm-construction) | 83 座單樁 |
| Breitling (Rostock) | 2.5 | 2006 | 圍堰式 | [w3.windmesse.de](https://w3.windmesse.de/windenergie/news/2284-erste-offshore-turbine-in-deutschland-errichtet) | 水深約 2 m 處以鋼板樁圍成、用砂與混凝土築成的基座（直徑 18 m）；聯邦能源登錄（MaStR）把它列為陸域風機 |
| Butendiek | 288 | 2015 | 單樁 | [OSPAR DE008](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Butendiek) |  |
| DanTysk | 288 | 2015 | 單樁 | [OSPAR DE002](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_DanTysk) |  |
| Deutsche Bucht | 252 | 2019 | 單樁 | [OSPAR DE022](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Deutsche_Bucht) |  |
| Ems Emden (Enercon E-112 nearshore) | 4.5 | 2004 | 圍堰式 | [w3.windmesse.de](https://w3.windmesse.de/windenergie/news/1004-erstes-nearshore-projekt-mit-grosswindanlage) | 堤腳外約 40 m 的河口水域中，在鋼板樁圍堰內澆築、由 40 支鋼管樁支撐的混凝土基座；聯邦能源登錄（MaStR）把它列為陸域風機 |
| EnBW Baltic 1 | 48.3 | 2011 | 單樁 | [enbw.com](https://www.enbw.com/company/topics/wind-power/offshore-wind-farm-baltic-1/) |  |
| EnBW Baltic 2 | 288 | 2015 | 混合：單樁 39、套管式 41 | [enbw.com](https://www.enbw.com/company/topics/wind-power/offshore-wind-farm-baltic-2/) | 水深約 35 m 以內用單樁（39 座），更深處用套管（41 座） |
| EnBW He Dreiht | 960 | 2025 | 單樁 | [OSPAR DE017](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_He_dreiht) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Global Tech I | 400 | 2015 | 三腳架 | [OSPAR DE009](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「tripod/tripile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Global_Tech_I) |  |
| Gode Wind 1 | 330 | 2016 | 單樁 | [OSPAR DE013](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Gode_Wind_I) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Gode Wind 2 | 252 | 2016 | 單樁 | [OSPAR DE032](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Gode_Wind_II) |  |
| Gode Wind 3 | 253 | 2024 | 單樁 | [OSPAR DE074](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Gode_Wind_III) |  |
| Hohe See | 497 | 2019 | 單樁 | [OSPAR DE011](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[offshorewind.biz](https://www.offshorewind.biz/2019/04/11/hohe-see-albatros-foundations-stand-complete/) | OSPAR 只寫「任一種」、德文維基百科也沒寫；施工新聞：與相鄰的 Albatros 共 87 部風機全用單樁 |
| Hooksiel (BARD test turbine) | 5.0 | 2008 | 三樁 | [de.wikipedia.org](https://de.wikipedia.org/wiki/Tripile_(Gr%C3%BCndung)) | BARD 的三樁試驗機（2016 年拆除） |
| Kaskasi | 342 | 2022 | 單樁 | [OSPAR DE031](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Kaskasi) |  |
| Meerwind Süd/Ost | 288 | 2014 | 單樁 | [OSPAR DE036](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Meerwind) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Merkur | 396 | 2019 | 單樁 | [OSPAR DE024](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「tripod」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Merkur) | 66 座單樁；OSPAR 列為三腳架，與建成紀錄不符 |
| Nordergründe | 111 | 2017 | 單樁 | [OSPAR DE018](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Nordergr%C3%BCnde) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Nordsee One | 332 | 2017 | 單樁 | [OSPAR DE026](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Nordsee_One) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Nordsee Ost | 295 | 2015 | 套管式 | [OSPAR DE006](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Nordsee_Ost) |  |
| Riffgat | 113 | 2014 | 單樁 | [OSPAR DE019](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Riffgat) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Sandbank | 288 | 2017 | 單樁 | [OSPAR DE012](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/tripod/tripile/jacket/gravity-based/other」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Sandbank) | OSPAR 只寫「任一種」，改以德文維基百科（附建造紀錄）為準 |
| Trianel Windpark Borkum I | 200 | 2015 | 三腳架 | [OSPAR DE025a](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「tripod」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Trianel_Windpark_Borkum) |  |
| Trianel Windpark Borkum II | 203 | 2020 | 單樁 | [OSPAR DE025b](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「tripod/tripile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Trianel_Windpark_Borkum) | 第二期用單樁；OSPAR 列為三腳架／三樁 |
| Veja Mate | 402 | 2017 | 單樁 | [OSPAR DE034](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「tripod/tripile」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_Veja_Mate) | 67 座單樁（直徑 7.8 m）；OSPAR 列為三腳架／三樁 |
| Wikinger | 350 | 2018 | 套管式 | [offshorewind.biz](https://www.offshorewind.biz/2017/10/26/all-wikinger-turbines-up/) | 70 座套管 |
| alpha ventus | 60.0 | 2010 | 混合：三腳架 6、套管式 6 | [OSPAR DE001](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile/jacket」<br>[de.wikipedia.org](https://de.wikipedia.org/wiki/Offshore-Windpark_alpha_ventus) | 6 部三腳架、6 部套管；OSPAR 誤列為「單樁／套管」 |

### 愛爾蘭

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Arklow Bank Phase 1 | 25.2 | 2004 | 單樁 | [OSPAR IE01](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[ge.com](https://www.ge.com/news/press-releases/arklow-bank-wind-park-irish-sea-nearing-completion) | 7 座打入式單樁 |

### 挪威

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Hywind Demo (Karmøy) | 2.3 | 2009 | 浮動式（單柱式） | [OSPAR NO001](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「other」<br>[en.wikipedia.org](https://en.wikipedia.org/wiki/Hywind) | 2019 年起改名 Unitech Zefyros（OSPAR 用此名） |
| Hywind Tampen | 88.0 | 2023 | 浮動式（單柱式） | [OSPAR NO010](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「other」<br>[en.wikipedia.org](https://en.wikipedia.org/wiki/Hywind_Tampen) | 混凝土單柱式浮台 |
| TetraSpar Demonstrator (METCentre) | 3.6 | 2021 | 浮動式（單柱式） | [OSPAR NO018](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「other」<br>[stiesdaloffshore.com](https://stiesdaloffshore.com/projects/the-tetraspar-full-scale-demonstration-project/) | Stiesdal 的 Tetra 浮台，採單柱式配置（下方懸吊壓艙）；2026 年除役（細分型式於第 3 步補上） |

### 日本

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| 秋田港洋上風力（Akita Port） | 54.6 | 2023 | 單樁 | [kajima.co.jp](https://www.kajima.co.jp/news/press/202003/26c1-j.htm) | 13 座單樁配轉接段（鹿島與住友電工統包） |
| 銚子沖洋上風力実証（Choshi Offshore Demonstration (NEDO/TEPCO)） | 2.4 | 2019 | 重力式 | [kajima.co.jp](https://www.kajima.co.jp/news/press/201302/27c1-j.htm) | 預力混凝土沉箱重力式基礎（2,400 噸），半潛拖運到場後灌入銅爐碴壓艙，合計約 5,400 噸 |
| 福島浮体式洋上風力実証（Fukushima FORWARD floating demo） | 14.0 | 2013 | 浮動式 | [fukushima-forward.jp](https://www.fukushima-forward.jp/reference/pdf/study086.pdf) | 兩部半潛式（2 MW、7 MW V 型）與一部單柱式（5 MW），型式不同，所以不標單一細分型式 |
| 五島洋上風場（Goto City Offshore floating project） | 16.8 | 2026 | 浮動式（單柱式） | [toda.co.jp](https://www.toda.co.jp/news/2026/20260105_006181.html) | 8 座混合式單柱浮台（上段鋼、下段混凝土） |
| 五島崎山浮体式洋上風力（Goto Sakiyama floating demonstration） | 2.0 | 2016 | 浮動式（單柱式） | [toda.co.jp](https://www.toda.co.jp/business/ecology/haenkaze/about/facility.html) | 戶田建設的混合式單柱浮台「はえんかぜ」 |
| 北九州響灘浮体式実証（Hibiki floating demo (NEDO)） | 3.0 | 2019 | 浮動式（駁船式） | [nedo.go.jp](https://www.nedo.go.jp/news/press/AA5_101117.html) | 鋼製駁船式浮台，搭載兩葉片 3 MW 風機 |
| 石狩湾新港洋上風力（Ishikari Bay New Port） | 99.9 | 2024 | 套管式 | [eng.nipponsteel.com](https://www.eng.nipponsteel.com/news/detail/20220909/) | 14 座四腳套管，固定在預打的鋼管樁上（海床軟弱，是日本第一座套管式離岸風場） |
| 神栖洋上風力一期（Kamisu Phase 1 (Wind Power Ibaraki)） | 14.0 | 2010 | 單樁 | [jcmanet.or.jp](https://jcmanet.or.jp/bunken/kikanshi/2011/12/014.pdf) | 7 座直徑 3.5 m、長 24.5 m 的單樁，配灌漿接合的套管接頭，自岸上以履帶式吊車打設 |
| 神栖洋上風力二期（Kamisu Phase 2） | 16.0 | 2013 | 單樁 | [jepoc.or.jp](https://www.jepoc.or.jp/magazine/magazine.php?_w=magazine&_x=kikan_detail&kikan_m_id=17&kikan_n_id=444) | 8 座單樁；因鄰近 275 kV 輸電線，改以自升式平台船打樁 |
| 北九州響灘洋上風力（Kitakyushu Hibikinada） | 220 | 2026 | 套管式 | [hibikiwindenergy.co.jp](https://hibikiwindenergy.co.jp/news/2026/0601.html) | 25 座套管，分 4 樁與 8 樁兩型、共 144 支樁，依海床分別用全套管、RS-plus 與打擊三種工法（水深 8–30 m） |
| 北九州沖洋上風力実証（Kitakyushu Offshore Demonstration (NEDO/J-Power)） | 2.0 | 2013 | 重力式 | [nedo.go.jp](https://www.nedo.go.jp/content/100890005.pdf) | J-POWER 的「ハイブリッド重力式」：拋石基床上放預鑄混凝土底版，上面架內填混凝土的鋼製套管；2019 年 9 月撤除風機與上部結構，底版留作研究設施 |
| 能代港洋上風力（Noshiro Port） | 84.0 | 2022 | 單樁 | [kajima.co.jp](https://www.kajima.co.jp/news/press/202003/26c1-j.htm) | 20 座單樁配轉接段（鹿島與住友電工統包） |
| 入善洋上風力発電所（Nyuzen Offshore Wind Farm） | 7.5 | 2023 | 單樁 | [shimz.co.jp](https://www.shimz.co.jp/works/jp_ene_202308_nyuzen.html) | 3 座直徑 5.5 m、長 48.1–51.6 m 的單樁，不加轉接段（日本首例），清水建設設計施工 |
| 酒田港セミ洋上風力（Sakata Port semi-offshore） | 10.0 | 2004 | 高樁承台 | [nedo.go.jp](https://www.nedo.go.jp/content/100890000.pdf) | NEDO 稱「ドルフィン」，即高樁承台：8 支直樁（長 27 m、直徑 1 m）上加直徑 12 m、厚 2.5 m 的八角形混凝土承台；2023 年撤除 |
| 瀬棚港セミ洋上風力（Setana semi-offshore） | 1.2 | 2004 | 高樁承台 | [nedo.go.jp](https://www.nedo.go.jp/content/100889997.pdf) | NEDO 稱「ドルフィン」，即高樁承台：4 支直樁（長 27 m、直徑 1.1 m）上加寬約 10 m、厚 2 m 的混凝土承台 |

### 比利時

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Belwind Alstom Haliade demonstrator | 6.0 | 2013 | 套管式 | [OSPAR Be003](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[offshorewind.biz](https://www.offshorewind.biz/2013/11/20/belgium-alstom-installs-6mw-haliade-offshore-wind-turbine) | 61 m 高的套管，架在預先打入海床的樁上（2013 年）；OSPAR 把它併在 Belwind 一期（單樁）裡 |
| Belwind I (Bligh Bank) | 165 | 2010 | 單樁 | [OSPAR Be003](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Nobelwind (Bligh Bank II) | 165 | 2017 | 單樁 | [OSPAR Be009](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Norther | 370 | 2019 | 單樁 | [OSPAR Be005](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Northwester 2 | 219 | 2020 | 單樁 | [OSPAR Be008](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Northwind | 216 | 2014 | 單樁 | [OSPAR Be002](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Rentel | 309 | 2018 | 單樁 | [OSPAR Be004](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| SeaMade - Mermaid | 235 | 2020 | 單樁 | [OSPAR Be007](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| SeaMade - Seastar | 252 | 2020 | 單樁 | [OSPAR Be006](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Thornton Bank I | 30.0 | 2009 | 重力式 | [OSPAR Be001](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「gravity-based/jacket」<br>[en.wikipedia.org](https://en.wikipedia.org/wiki/Thorntonbank_Wind_Farm) | 第一期 6 部風機坐在混凝土重力式基礎上；OSPAR 把三期合成一筆「重力式／套管」 |
| Thornton Bank II | 184 | 2012 | 套管式 | [OSPAR Be001](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「gravity-based/jacket」<br>[en.wikipedia.org](https://en.wikipedia.org/wiki/Thorntonbank_Wind_Farm) | 第二、三期共 48 部風機用鋼製套管基礎（OWEC 設計） |
| Thornton Bank III | 111 | 2013 | 套管式 | [OSPAR Be001](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「gravity-based/jacket」<br>[en.wikipedia.org](https://en.wikipedia.org/wiki/Thorntonbank_Wind_Farm) | 第二、三期共 48 部風機用鋼製套管基礎（OWEC 設計） |

### 法國

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Calvados (Courseulles-sur-Mer) | 450 | 2027 | 單樁 | [OSPAR FR01](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[meretmarine.com](https://www.meretmarine.com/fr/energies-marines/parc-eolien-du-calvados-le-seaway-strashnov-est-arrive-au-havre-pour-installer-des-monopieux) | 64 座單樁（興建中） |
| EolMed (Gruissan) | 30.0 | 2026 | 浮動式（駁船式） | [bw-ideol.com](https://www.bw-ideol.com/en/eolmed-project) | BW Ideol 的阻尼池式駁船（鋼造） |
| Floatgen (SEM-REV) | 2.0 | 2018 | 浮動式（駁船式） | [bw-ideol.com](https://www.bw-ideol.com/en/floatgen-demonstrator) | BW Ideol 的阻尼池式駁船 |
| Fécamp | 497 | 2024 | 重力式 | [OSPAR FR04](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「gravitation」<br>[fr.wikipedia.org](https://fr.wikipedia.org/wiki/Parc_%C3%A9olien_en_mer_de_F%C3%A9camp) | 71 座混凝土重力式基礎（每座約 5,000 噸） |
| Les Éoliennes Flottantes du Golfe du Lion (EFGL) | 30.0 | 2026 | 浮動式（半潛式） | [principlepower.com](https://www.principlepower.com/projects/efgl) | Principle Power 的 WindFloat 半潛式平台 |
| Provence Grand Large | 25.0 | 2024 | 浮動式（張力腳） | [OSPAR FR11](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「other」<br>[edf.fr](https://www.edf.fr/en/the-edf-group/dedicated-sections/journalists/all-press-releases/provence-grand-large-full-commissioning-of-the-first-french-floating-offshore-wind-farm) | SBM Offshore 與 IFPEN 開發的張力腳平台（細分型式於第 3 步補上） |
| Saint-Brieuc | 496 | 2024 | 套管式 | [OSPAR FR02](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」 |  |
| Saint-Nazaire (Banc de Guérande) | 480 | 2022 | 單樁 | [OSPAR FR03](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[fr.wikipedia.org](https://fr.wikipedia.org/wiki/Parc_%C3%A9olien_en_mer_de_Saint-Nazaire) |  |
| Îles d'Yeu et de Noirmoutier | 488 | 2025 | 單樁 | [OSPAR FR06](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[deme-group.com](https://www.deme-group.com/news/all-foundations-installed-iles-dyeu-and-noirmoutier-offshore-wind-farm) | 61 座鑽孔植入的單樁 |

### 瑞典

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Bockstigen | 3.3 | 1998 | 單樁 | [osti.gov](https://www.osti.gov/etdeweb/biblio/679603) | 鑽孔植入石灰岩的單樁 |
| Kårehamn | 48.0 | 2013 | 重力式 | [offshorewind.biz](https://www.offshorewind.biz/2026/01/23/nordic-renewable-energy-company-acquiring-rwes-swedish-offshore-wind-farm) | 16 座重力式基礎 |
| Lillgrund | 110 | 2007 | 重力式 | [osti.gov](https://www.osti.gov/etdeweb/servlets/purl/979747) | 鋼筋混凝土重力式基礎，內填壓艙物 |
| Utgrunden I | 10.5 | 2000 | 單樁 | [offshorewind.biz](https://www.offshorewind.biz/2018/10/04/swedish-offshore-wind-farm-is-no-more/) | 7 座單樁（2018 年拆除） |
| Vindpark Vänern (Gässlingegrund) | 30.0 | 2010 | 岩錨式 | [evwind.aeeolica.org](https://evwind.aeeolica.org/2010/05/24/the-first-vanern-offshore-wind-farm-inaugurated/5723) | 錨定在湖底岩盤上的基礎（維納恩湖） |

### 美國

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Block Island | 30.0 | 2016 | 套管式 | [windpowerengineering.com](https://www.windpowerengineering.com/historic-milestone-for-u-s-offshore-wind-block-island-wind-farm-installs-steel-in-the-water/) | 5 座四腳套管（各約 400 噸），以穿過套管腳打入的基樁固定；美國第一座離岸風場 |
| Coastal Virginia Offshore Wind (CVOW) Commercial Project | 2,640 | 2027 | 單樁 | [eew-group.com](https://eew-group.com/projects-references/success-stories/news-detail/coastal-virginia-offshore-wind-project/) | 176 座單樁（最大直徑 9.5 m、1,538 噸），2024–2025 年安裝（3 座海上變電站另以基樁固定） |
| Coastal Virginia Offshore Wind (CVOW) Pilot | 12.0 | 2020 | 單樁 | [eew-group.com](https://eew-group.com/projects-references/success-stories/news-detail/coastal-virginia-offshore-wind-project/) | 2 座單樁（877 噸、直徑 7.8 m）配轉接段 |
| Empire wind farm | 810 | 2027 | 單樁 | [empirewind.com](https://www.empirewind.com/offshore-installation/) | 54 座單樁（Sif 製）配轉接段，2025 年夏秋安裝（海上變電站立在套管上） |
| Revolution Wind | 704 | 2026 | 單樁 | [oedigital.com](https://www.oedigital.com/news/513807-boskalis-installs-first-foundation-for-revolution-wind-project-offshore-us) | 65 座加大型（XXL）風機單樁，2024 年 5 月至 2025 年第 2 季安裝（2 座海上變電站另有更大的單樁） |
| South Fork Wind | 132 | 2024 | 單樁 | [offshorewind.biz](https://www.offshorewind.biz/2023/08/10/all-monopiles-up-for-new-yorks-first-offshore-wind-farm/) | 12 座風機單樁，2023 年 6–8 月安裝（海上變電站另立在第 13 座單樁上） |
| Sunrise Wind | 924 | 2027 | 單樁 | [orsted.com](https://orsted.com/en/media/news/2026/01/sunrise-wind-llc-to-file-preliminary-injunction-ag-1474210611) | 84 座風機單樁（2025 年年中開始安裝，2026 年 8 月已裝好 77 座）；海上變流站另為一座構造 |
| Vineyard Wind 1 | 806 | 2026 | 單樁 | [deme-group.com](https://www.deme-group.com/news/offshore-works-kick-vineyard-wind-farm-us-installation-first-foundation) | 62 座風機單樁配轉接段，2023 年 6 月起安裝（海上變電站另有單樁） |

### 義大利

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Beleolico (Taranto) | 30.0 | 2022 | 單樁 | [offshorewind.biz](https://www.offshorewind.biz/2022/01/13/foundations-stand-at-first-mediterranean-offshore-wind-farm/) | 10 座單樁；地中海第一座離岸風場 |

### 芬蘭

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Pori Tahkoluoto (Offshore Pori) | 42.0 | 2017 | 重力式 | [hyotytuuli.fi](https://hyotytuuli.fi/en/suomen-hyotytuuli-rakentaa-merituulipuiston-porin-tahkoluotoon-2/) | 填石的鋼製重力式基礎（海床是岩盤，無法打單樁；需抵抗海冰） |

### 英國

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Barrow | 90.0 | 2006 | 單樁 | [OSPAR UK002](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Beatrice | 588 | 2019 | 套管式 | [OSPAR UK003](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」 |  |
| Blyth Offshore | 4.0 | 2000 | 單樁 | [OSPAR UK007](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Blyth Offshore Demonstrator | 41.5 | 2017 | 重力式 | [OSPAR UK005](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「gravity-based」 |  |
| Burbo Bank | 90.0 | 2007 | 單樁 | [OSPAR UK013](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Burbo Bank Extension | 258 | 2017 | 單樁 | [OSPAR UK012](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Dogger Bank A | 1,200 | 2023 | 單樁 | [OSPAR UK014](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[doggerbank.com](https://doggerbank.com/construction/foundation-installation-campaign-begins-on-dogger-bank-b/) | 95 座單樁（附轉接段） |
| Dudgeon | 402 | 2017 | 單樁 | [OSPAR UK019](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| East Anglia ONE | 714 | 2020 | 套管式 | [OSPAR UK022](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」 |  |
| European Offshore Wind Deployment Centre (Aberdeen) | 93.2 | 2018 | 套管式（吸力桶） | [OSPAR UK001](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」<br>[en.wikipedia.org](https://en.wikipedia.org/wiki/European_Offshore_Wind_Deployment_Centre) | 11 座吸力桶套管 |
| Galloper | 353 | 2018 | 單樁 | [OSPAR UK034](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Greater Gabbard | 504 | 2012 | 單樁 | [OSPAR UK036](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Gunfleet Sands 1 & 2 | 173 | 2010 | 單樁 | [OSPAR UK038](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[OSPAR UK039](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Gunfleet Sands 3 Demonstration | 12.0 | 2013 | 單樁 | [OSPAR UK037](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Gwynt y Môr | 576 | 2015 | 單樁 | [OSPAR UK040](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Hornsea One | 1,218 | 2019 | 單樁 | [OSPAR UK043](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[OSPAR UK044](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」<br>[OSPAR UK045](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[offshorewind.biz](https://www.offshorewind.biz/2019/04/26/hornsea-one-foundations-all-in-place/) | 174 座全為單樁（2019 年 4 月完工）；OSPAR 把西區列為套管，與建成紀錄不符（DONG 2015 年曾規劃三分之一用吸力桶基礎） |
| Hornsea Two | 1,386 | 2022 | 單樁 | [OSPAR UK046](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[OSPAR UK046A](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「—」<br>[OSPAR UK046B](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「—」 |  |
| Humber Gateway | 219 | 2015 | 單樁 | [OSPAR UK049](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Hywind Scotland | 30.0 | 2017 | 浮動式（單柱式） | [equinor.com](https://www.equinor.com/energy/hywind-scotland) | Equinor 的單柱式浮台 |
| Kentish Flats | 90.0 | 2005 | 單樁 | [OSPAR UK057](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Kentish Flats Extension | 49.5 | 2015 | 單樁 | [OSPAR UK056](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Kincardine | 47.5 | 2021 | 浮動式（半潛式） | [principlepower.com](https://www.principlepower.com/projects/kincardine-offshore-wind-farm) | Principle Power 的 WindFloat 半潛式平台 |
| Levenmouth Demonstration (Methil) | 7.0 | 2013 | 套管式 | [OSPAR UK064](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」 |  |
| Lincs | 270 | 2013 | 單樁 | [OSPAR UK059](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| London Array | 630 | 2013 | 單樁 | [OSPAR UK060](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Lynn and Inner Dowsing | 194 | 2009 | 單樁 | [OSPAR UK061](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[OSPAR UK052](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Moray East | 950 | 2022 | 套管式 | [OSPAR UK141](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」 |  |
| Moray West | 882 | 2025 | 單樁 | [OSPAR UK142](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」<br>[moraywest.com](https://www.moraywest.com/news/moray-west-celebrates-final-monopile-installation) | 全部為單樁（2024 年 4 月裝完）；OSPAR 列為套管，與建成紀錄不符 |
| Neart na Gaoithe | 450 | 2025 | 套管式 | [OSPAR UK068](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」<br>[saipem.com](https://www.saipem.com/en/media/press-releases/2023-10-24/saipem-successfully-completed-installation-works-scotland-neart-na) | 54 座套管 |
| North Hoyle | 60.0 | 2003 | 單樁 | [OSPAR UK074](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Ormonde | 150 | 2012 | 套管式 | [OSPAR UK076](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「jacket」 |  |
| Race Bank | 573 | 2018 | 單樁 | [OSPAR UK079](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Rampion | 400 | 2018 | 單樁 | [OSPAR UK080](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Rhyl Flats | 90.0 | 2009 | 單樁 | [OSPAR UK082](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Robin Rigg | 174 | 2010 | 單樁 | [OSPAR UK083](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[OSPAR UK084](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Scroby Sands | 60.0 | 2004 | 單樁 | [OSPAR UK087](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Seagreen Phase 1 | 1,075 | 2023 | 套管式（吸力桶） | [OSPAR UK089](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「—」<br>[sserenewables.com](https://www.sserenewables.com/news-and-views/2023/04/final-jacket-foundation-installed-on-seagreen/) | 114 座吸力桶套管；OSPAR 這筆沒有寫型式 |
| Sheringham Shoal | 317 | 2012 | 單樁 | [OSPAR UK092](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Sofia | 1,400 | 2026 | 單樁 | [OSPAR UK138](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[rwe.com](https://www.rwe.com/en/press/rwe-offshore-wind-gmbh/2025-07-15-sofia-offshore-wind-farm-completes-installation-of-foundations/) | 100 座加長單樁（不另加轉接段） |
| Teesside (Redcar) | 62.1 | 2013 | 單樁 | [OSPAR UK102](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Thanet | 300 | 2010 | 單樁 | [OSPAR UK104](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Triton Knoll | 857 | 2021 | 單樁 | [OSPAR UK106](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Walney 1 & 2 | 367 | 2012 | 單樁 | [OSPAR UK107](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[OSPAR UK108](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Walney Extension | 659 | 2018 | 單樁 | [OSPAR UK109](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」<br>[OSPAR UK110](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| West of Duddon Sands | 389 | 2014 | 單樁 | [OSPAR UK113](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Westermost Rough | 210 | 2015 | 單樁 | [OSPAR UK114](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |

### 荷蘭

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Borssele I & II | 752 | 2020 | 單樁 | [OSPAR NL005](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Borssele III & IV (Blauwwind) | 732 | 2021 | 單樁 | [OSPAR NL006](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Borssele V (Two Towers innovation site) | 19.0 | 2021 | 單樁 | [offshore-energy.biz](https://www.offshore-energy.biz/the-borssele-series-innovation-site-for-the-ever-evolving-industry/) | 2 座單樁；其中一座試用 Slip Joint（單樁與轉接段以錐面套接） |
| Egmond aan Zee (OWEZ) | 108 | 2007 | 單樁 | [OSPAR NL001](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Gemini | 600 | 2017 | 單樁 | [OSPAR NL004](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Hollandse Kust Noord | 759 | 2023 | 單樁 | [OSPAR NL008](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Hollandse Kust Zuid I & II | 759 | 2023 | 單樁 | [OSPAR NL007](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Hollandse Kust Zuid III & IV | 770 | 2023 | 單樁 | [OSPAR NL007](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Irene Vorrink (Dronten) | 16.8 | 1996 | 單樁 | [windpowernl.com](https://windpowernl.com/2022/02/28/vattenfall-starts-decommissioning-of-one-of-the-oldest-operational-dutch-wind-farms/) | 28 座鋼製單樁，立在堤外的水中（2022 年拆除） |
| Luchterduinen | 129 | 2015 | 單樁 | [OSPAR NL003](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Prinses Amalia | 120 | 2008 | 單樁 | [OSPAR NL002](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Westermeerwind | 144 | 2016 | 單樁 | [offshore-energy.biz](https://www.offshore-energy.biz/westermeerwind-foundations-in-place/) | 48 座單樁（艾瑟爾湖） |
| Windpark Fryslân | 383 | 2021 | 單樁 | [offshorewind.biz](https://www.offshorewind.biz/2020/11/09/windpark-fryslan-monopiles-halfway-there/) | 89 座單樁（艾瑟爾湖） |
| Windplanblauw offshore wind farm | 132 | 2024 | 圍堰式 | [windpowernl.com](https://windpowernl.com/2024/08/30/festive-opening-of-dutch-on-and-nearshore-wind-project-windplanblauw/) | 湖中 24 部風機：每座以 22 支鋼管樁（間以板樁）圍成一圈、填砂，上面是直徑約 20 m 的混凝土基座 |

### 葡萄牙

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| WindFloat 1 (Aguçadoura demo) | 2.0 | 2011 | 浮動式（半潛式） | [principlepower.com](https://www.principlepower.com/projects/windfloat1) | 第一部裝在半潛式平台上的浮動式風機（2011–2016 年；之後移到蘇格蘭 Kincardine 再運轉到 2020 年） |
| WindFloat Atlantic | 25.2 | 2020 | 浮動式（半潛式） | [principlepower.com](https://www.principlepower.com/projects/windfloat-atlantic) | Principle Power 的 WindFloat 半潛式平台 |

### 西班牙

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| DemoSATH (BiMEP) | 2.0 | 2023 | 浮動式（駁船式） | [saitec-offshore.com](https://saitec-offshore.com/en/sath/) | Saitec 的 SATH 混凝土駁船 |
| Elican / Elisa (Gran Canaria) | 5.0 | 2019 | 重力式 | [cordis.europa.eu](https://cordis.europa.eu/project/id/691919) | 重力式基礎配伸縮式塔架，可自行安裝的原型機 |

## 查過但暫不列入的風場

| 風場 | OSPAR | 理由 |
|---|---|---|
| 南韓 · Ulsan Dongbu floating demo (Vindmøllen 750 kW) | — | 計畫中的 750 kW 半潛式試驗機；2019 年 11 月仍因許可未發而沒有安裝，查不到之後在海上發電的紀錄，待查證 |
| 丹麥 · Frederikshavn | DK03 | 試驗場：丹麥能源署記載 2003 年在海上設 3 部（7.6 MW），港口擴建後兩部已在陸地上、海上只剩 1 部 2.3 MW，但沒寫是哪一部；各機組的基礎不同（其中一部 V90 用吸力桶試驗基礎），OSPAR 寫全為單樁、14 MW 也對不上，先不列 |
| 日本 · Eurus Akita Port semi-offshore | — | JWPA 另計為「セミ洋上」的 1 部 3 MW：ユーラス秋田港ウインドファーム（6 部 3 MW，2015 年 2 月運轉）中立在水中的那一部；查不到業主、施工廠商、NEDO、國土交通省或 JWPA 的文件寫出它的基礎型式 |
| 南韓 · Yeonggwang Wind offshore wind farm | — | 靈光風電陸海混合風場（35 部、79.6 MW）中立在潮間帶的 15 部 2.3 MW，退潮時周圍是灘地；查不到開發商、施工廠商或政府文件寫出這 15 部的基礎型式 |
