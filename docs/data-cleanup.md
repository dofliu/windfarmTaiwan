# 風場資料清理紀錄

[English](data-cleanup.en.md) ｜ 中文（本頁）

> 由 `tools/build_farms.py` 依 `tools/farm_cleanup.py` 的規則產生，請勿手動編輯。查證時間：2026-09（逐筆查證，理由與來源列於下表）。

合併各來源後，逐場資料仍有重複（同一座風場被兩個來源各收一次、或精選的「整區彙總」與 GEM 的逐場資料並存）、從未建成的案子被標為營運中，以及錯置的座標。這些以明確規則修正：每條規則指定剛好一筆紀錄，上游資料改版後若對不到就讓建置失敗，提醒重新查證。

- 規則 207 條：刪除 99 筆（其中營運中 30,071.7 MW），修正 108 筆。
- 另外，比對名稱時先把繁體字轉成簡體（精選清單用繁體、GEM 用簡體），並比對分區代號（H6、K 區…）與陸域／離岸，讓江蘇、廣東、山東等地重複收錄的離岸風場能自動併成一筆；`GEM_KEEP` 列出名稱相近但確認是不同風場的例外。
- 動作：**重複**＝與另一筆是同一座，刪除並把業主、分期併過去；**刪除**＝從未建成、查無此場或是重複的彙總；**修正**＝改正欄位。

| 國家 | 刪除 | 營運中 MW | 修正 |
|---|---:|---:|---:|
| 中國大陸 | 12 | 12,758 | 8 |
| 丹麥 | 1 | 180 | 1 |
| 伊朗 | 2 | 62 | 2 |
| 加拿大 | 1 | 353 | 0 |
| 南非 | 2 | 159 | 2 |
| 南韓 | 3 | 157.5 | 7 |
| 台灣 | 0 | 0 | 2 |
| 哥倫比亞 | 1 | 8 | 2 |
| 土耳其 | 2 | 270 | 1 |
| 埃及 | 2 | 1,082 | 0 |
| 塞內加爾 | 0 | 0 | 2 |
| 多明尼加 | 1 | 50 | 6 |
| 奧蘭 | 0 | 0 | 1 |
| 巴西 | 1 | 150 | 0 |
| 德國 | 0 | 0 | 3 |
| 愛爾蘭 | 0 | 0 | 1 |
| 挪威 | 7 | 1,939 | 9 |
| 日本 | 2 | 30 | 10 |
| 比利時 | 1 | 325 | 0 |
| 法國 | 2 | 0 | 5 |
| 泰國 | 1 | 600 | 1 |
| 澳洲 | 4 | 1,161 | 3 |
| 烏拉圭 | 1 | 141.6 | 1 |
| 瑞典 | 0 | 0 | 3 |
| 約旦 | 1 | 117 | 0 |
| 羅馬尼亞 | 16 | 2,439 | 10 |
| 美國 | 6 | 811.6 | 6 |
| 肯亞 | 2 | 410 | 3 |
| 芬蘭 | 1 | 30 | 0 |
| 英國 | 7 | 3,485 | 5 |
| 荷蘭 | 8 | 1,852 | 6 |
| 菲律賓 | 1 | 160 | 1 |
| 葡萄牙 | 1 | 14 | 2 |
| 西班牙 | 1 | 20 | 1 |
| 越南 | 9 | 1,307 | 4 |

## 中國大陸 (CHN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Mingyang Qingzhou 4 floating 'OceanX' & Tiancheng · 16.6 MW · 2024 | 精選 | 修正：名稱 | 「OceanX」與「明陽天成號」是同一座浮台（一座浮台上兩部 8.3 MW 風機，共 16.6 MW），名稱合為一個 | [連結](https://www.ditan.com/industry/energy/4497.html) |
| Haiyou Guanlan (CNOOC floating) · 7.2 MW · 2023 | 精選 | 修正：容量 | 裝機容量 7.25 MW | [連結](http://finance.people.com.cn/n1/2023/0520/c1004-32690779.html) |
| Guangdong Yangjiang Shaba (Three Gorges) Offshore wind farm · 1,706 MW · 2021 | GEM | 刪除 | GEM 把三峽陽江沙扒一至五期合成一筆（1,706 MW）；精選資料已逐期列出 | 資料比對 |
| Dabancheng · 2,500 MW · 1989 | 精選 | 刪除 | 整區的概略彙總，標為 2,500 MW、1989 年；GEM 在 80 km 內已逐場列出同地名的 28 座（3,661 MW），各有自己的商轉年 | 資料比對 |
| Yumen Changma · 1,000 MW · 2009 | 精選 | 刪除 | 整區的概略彙總，GEM 在 80 km 內已逐場列出同地名的 23 座（2,679 MW），各有自己的商轉年 | 資料比對 |
| Minqin Hongshagang · 1,300 MW · 2016 | 精選 | 刪除 | 整區的概略彙總，GEM 在 80 km 內已逐場列出同地名的 9 座（1,200 MW），各有自己的商轉年 | 資料比對 |
| Mori wind complex · 2,200 MW · 2022 | 精選 | 刪除 | 整區的概略彙總，GEM 在 80 km 內已逐場列出同地名的 8 座（2,150 MW），各有自己的商轉年 | 資料比對 |
| Togtoh · 1,750 MW · 2022 | 精選 | 刪除 | 整區的概略彙總，GEM 已逐場列出這個送出基地的 3 座（1,750 MW，2024），各有自己的商轉年 | 資料比對 |
| Zhejiang Energy Taizhou Yuhuan 1 · 300 MW · 2021 | 精選 | 修正：名稱、中文名、容量、年份、分期、業主 | 玉環披山島西北的離岸風場是華電玉環1號：北區 154 MW（2021 年 12 月）、南區 75 MW（2024 年 6 月）；浙能台州1號（300 MW，臨海外海）是另一座，GEM 已列出 | [連結](https://www.cpnn.com.cn/news/xny/202406/t20240604_1706589.html) |
| Huadian Yuhuan 2 · 500 MW · 2024 | 精選 | 修正：名稱、中文名、容量、業主 | 開發商是華能（與晶科合作），不是華電；504 MW | [連結](https://m.bjx.com.cn/mnews/20240129/1358593.shtml) |
| Jiangsu Sheyang South H1 (Longyuan) · 400 MW · 2024 | 精選 | 重複（併入「Jiangsu Sheyang Southern Area H5 Offshore wind farm」） | 射陽南區 H1 屬華能（另有紀錄）；龍源的 400 MW 場址是 H5，即 GEM 這筆 | [連結](https://www.gem.wiki/Jiangsu_Sheyang_Southern_Area_H1_Offshore_wind_farm) |
| Shanghai Donghai Bridge Offshore wind farm · 1 · 102 MW · 2009 | GEM | 重複（併入「Donghai Bridge」） | 同一座風場：GEM 的中文名就是「東海大橋海上風電項目一期 102.2MW」（34 部 3 MW，上海市政府：2010 年 6 月 8 日全部風機併網）；GEM 座標偏北約 110 km | [連結](https://www.shanghai.gov.cn/nw5827/20200905/0001-5827_667816.html) |
| CTG Yangjiang Qingzhou 6 · 500 MW · 2024 | 精選 | 修正：容量、座標 | 青洲六為 1,000 MW、74 部，2024 年 12 月 27 日全容量併網（補貼公示；原本寫 500 MW）；座標改用 GEM 的精確位置 | [連結](https://finance.sina.com.cn/roll/2025-12-19/doc-inhcipui7654969.shtml) |
| Guangdong Yangjiang Qingzhou VI Offshore wind farm · 1,000 MW | GEM | 重複（併入「CTG Yangjiang Qingzhou 6」） | 同一座風場（三峽陽江青洲六，1,000 MW）；GEM 2026-02 版仍列興建中，補貼公示寫 2024 年 12 月 27 日全容量併網 | [連結](https://finance.sina.com.cn/roll/2025-12-19/doc-inhcipui7654969.shtml) |
| Longyuan Jiangsu Xiangshui · 202 MW · 2016 | 精選 | 修正：名稱、中文名、業主 | 響水近海風電（202 MW，2016 年 10 月 17 日全數併網）是三峽集團的第一座離岸風場，不是龍源 | [連結](http://newenergy.giec.cas.cn/fn/cydt/201804/t20180426_736984.html) |
| Fuqing Xinghua Bay Phase 2 · 300 MW · 2020 | 精選 | 修正：容量、年份 | 二期為 280 MW、45 部（2021 年安裝，全為國產機組，含國內首部 10 MW 示範機），2021 年全容量併網（原本寫 300 MW、2020 年） | [連結](https://gxt.fujian.gov.cn/zwgk/xw/jxyw/202412/t20241211_6590606.htm) |
| CGN Yangjiang Qingzhou 1&2 · 1,000 MW · 2024 | 精選 | 修正：名稱、中文名、業主 | 青洲一、二是廣東能源集團（粵電）的風場，不是中廣核：青洲一 400 MW（37 部）＋青洲二 600 MW（55 部）共 92 部 11 MW，2023 年 12 月 12 日全容量併網 | [連結](https://cpnn.com.cn/news/hy/202312/t20231212_1659356.html) |
| Hainan CZ2 Demonstration Offshore wind farm · 600 MW · 2025 | GEM | 重複（併入「Shenergy Hainan CZ2 (Dongfang)」） | 同一座風場（申能海南 CZ2 示範風場，67 部 9 MW） | [連結](https://finance.sina.com.cn/jjxw/2024-05-26/doc-inawpazx5145233.shtml) |
| Hainan Danzhou CZ3 (Datang) Offshore wind farm · 600 MW · 2025 | GEM | 重複（併入「Datang Danzhou CZ3」） | 大唐儋州 120 萬瓩（120 部 10 MW）的二期 60 萬瓩；精選紀錄已含兩期 | [連結](http://paper.people.com.cn/zgnyb/html/2024-02/05/content_26043679.htm) |
| Hainan CZ3 Demonstration Offshore wind farm · 600 MW · 2025 | GEM | 重複（併入「Datang Danzhou CZ3」） | 同一案的一期 60 萬瓩；精選紀錄已含兩期 | [連結](http://paper.people.com.cn/zgnyb/html/2024-02/05/content_26043679.htm) |

## 丹麥 (DNK)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Vesterhav Offshore wind farm · Nord · 180 MW · 2024 | GEM | 重複（併入「Vesterhav Nord」） | 同一座風場 | [連結](https://powerplants.vattenfall.com/vesterhav-nord/) |
| Vesterhav Nord · 176.4 MW · 2024 | 精選 | 修正：座標 | 座標改到 Thyborøn 與 Ferring Sø 之間的外海（原座標偏南約 20 km） | [連結](https://powerplants.vattenfall.com/vesterhav-nord/) |

## 伊朗 (IRN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Siahpoush (Manjil) wind farm · 48 MW | GEM | 重複（併入「Manjil wind farm」） | Manjil 風場群（Manjil、Rudbar、Harzevil、Siahpoush，共 92.2 MW）中的 Siahpoush 區 | [連結](https://en.wikipedia.org/wiki/Manjil_and_Rudbar_Wind_Farm) |
| Harzvil wind farm · 14 MW | GEM | 重複（併入「Manjil wind farm」） | Manjil 風場群中的 Harzevil 區 | [連結](https://en.wikipedia.org/wiki/Manjil_and_Rudbar_Wind_Farm) |
| Manjil wind farm · 93 MW | GEM | 修正：容量 | Manjil 風場群合計 92.2 MW，1995 年起分期興建、2015 年完工 | [連結](https://en.wikipedia.org/wiki/Manjil_and_Rudbar_Wind_Farm) |
| Binalood wind farm · 28 MW · 2017 | GEM | 修正：年份 | 2008 年啟用（43 × 660 kW） | [連結](https://en.wikipedia.org/wiki/Binalood_Wind_Farm) |

## 加拿大 (CAN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Whitla wind farm · 353 MW · 2019 | GEM | 重複（併入「Whitla」） | 同一座風場；GEM 座標在班夫附近，偏離約 300 km（實際位於 Forty Mile 郡） | [連結](https://www.capitalpower.com/operations/whitla-wind-2-3/) |

## 南非 (ZAF)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Amakhala Emoyeni wind farm · 134 MW · 2016 | GEM | 重複（併入「Amakhala Emoyeni」） | 同一座風場 | 資料比對 |
| Amakhala Emoyeni · 134 MW · 2016 | 精選 | 修正：座標、容量 | 座標改到 Bedford／Cookhouse 一帶（原座標偏西南約 50 km）；容量 134.4 MW（56 × 2.4 MW） | [連結](https://www.power-technology.com/projects/amakhala-emoyeni-wind-farm-bedford/) |
| Waainek wind farm · 25 MW · 2016 | GEM | 重複（併入「Waainek Wind Farm」） | 同一座風場；GEM 座標偏北約 80 km，保留位置正確的 WRI 紀錄 | [連結](https://southafrica.edf-powersolutions.com/operational/waainek/) |
| Waainek Wind Farm · 23 MW · 2016 | WRI GPPD | 修正：容量 | 容量 24.6 MW（8 × 3.075 MW） | [連結](https://southafrica.edf-powersolutions.com/operational/waainek/) |

## 南韓 (KOR)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Yeongyang · 61.5 MW · 2015 | 精選 | 重複（併入「Yeong Yang (Macquarie Group) wind farm」） | 同一座風場（孟洞山 41 × 1.5 MW，2008–2009 年完工）；精選紀錄的年份（2015）、座標（郡中心）與業主都誤植，保留 GEM 這筆 | [連結](https://www.epj.co.kr/news/articleView.html?idxno=4315) |
| Firefly (Bandibuli) floating offshore wind farm · 750 MW · 2031 | GEM | 刪除 | Equinor 於 2026 年 5 月停止開發 | [連結](https://www.equinor.co.kr/en/news/important-notice-on-bandibuli-project_en) |
| Jeonnam (SK E&C) wind farm · 96 MW · 2025 | GEM | 重複（併入「Jeonnam Shinan 1 / others」） | 同一座風場：全南海上風電 1 號（96 MW，SK Innovation E&S 與 CIP），在新安郡自恩島西北約 9 km | [連結](https://cop.dk/jeonnam-1-offshore-wind-project-begins-commercial-operations/) |
| Jeonnam Shinan 1 / others · 96 MW · 2025 | 精選 | 修正：名稱、中文名、機組 | 正式名稱為全南海上風電 1 號；機組是 10 部西門子歌美颯 SG 10.0-193 DD（降額為 9.6 MW），2025 年 5 月 16 日起全面運轉 | [連結](https://www.offshorewind.biz/2025/05/21/largest-privately-led-offshore-wind-farm-in-south-korea-enters-commercial-operation/) |
| Jeonnam Offshore Wind 1 · 96 MW · 2025 | 精選 | 修正：座標 | 座標改到自恩島西北約 9 km 的海域（概略位置；原座標偏東南約 19 km） | [連結](https://cop.dk/jeonnam-1-offshore-wind-project-begins-commercial-operations/) |
| Yeonggwang Nakwol · 364.8 MW · 2025 | 精選 | 修正：狀態、年份、機組 | 2025 年 12 月起部分商轉（年底只裝好 7 部風機）；2026 年 8 月 64 座單樁完成、47 部豎立、33 部商轉，預定 2026 年 12 月全面商轉。機組是 Vensys 5.7 MW（原本寫斗山） | [連結](https://www.mt.co.kr/industry/2026/08/24/2026082407272061046) |
| Jeju Woljeong test (Doosan) · 5 MW · 2012 | 精選 | 修正：機組 | 第二部是 STX 重工 2 MW（能源技術研究院，2011–12 年），不是 2015 年的曉星；該部 2016 年 6 月起停機，荷蘭 RVO 2021 年說試驗場沒有運轉（現況待查證） | [連結](https://www.epj.co.kr/news/articleView.html?idxno=37661) |
| Tamra (Jeju Hallim/Hangyeong) · 30 MW · 2017 | 精選 | 修正：名稱 | 耽羅海上風電在濟州翰京面（Hangyeong-myeon）海域，不在翰林（翰林另有一座風場） | [連結](http://tamra-owp.co.kr/2019/sub0201.php) |
| Jwasari Offshore wind farm · 360 MW · 2031 | GEM | 修正：狀態、年份、容量 | 還在環評階段（2025 年 3 月舉行環評初稿公聽會），規劃已改為 360 MW（24 部 15 MW） | [連結](https://www.hansannews.com/news/articleView.html?idxno=95554) |
| Yeonggwang Wind offshore wind farm · 35 MW · 2018 | GEM | 修正：容量、機組、座標 | 靈光風電（35 部、79.6 MW）中立在潮間帶的 15 部 2.3 MW＝34.5 MW；GEM 的座標是公司登記地址，位置只能當概略值 | [連結](https://m.etnews.com/20200221000242) |

## 台灣 (TWN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Zhong Neng · 298 MW · 2024 | 精選 | 修正：年份、容量 | 31 部風機 2024 年 8 月全數安裝併網，2025 年 4 月取得電業執照正式商轉；獲配容量 300 MW，實際裝置 31 部 × 9.5 MW＝294.5 MW | [連結](https://www.csc.com.tw/csc/esg/env/env2_1.html) |
| Taipower Offshore Phase 1 (Changhua) · 109.2 MW · 2021 | 精選 | 修正：機組 | 機組是日立 HTW5.2-127（葉片 127 m），不是 HTW5.2-136 | [連結](https://www.hitachihyoron.com/rev/archive/2019/r2019_02/01/index.html) |

## 哥倫比亞 (COL)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Vientos De Galerazamba wind farm · 69.9 MW · 2020 | GEM | 修正：狀態、年份 | 仍是規劃案，未見施工或商轉 | [連結](https://www.bnamericas.com/en/project-profile/wind-farm-winds-galerazamba) |
| WESP 01 wind farm · 12 MW | GEM | 修正：年份 | 2022 年加入運轉（ISAGEN，與 Guajira I 相鄰） | [連結](https://www.valoraanalitik.com/2022/01/19/extension-guajira-1-wesp-01-operacion-julio-2022/) |
| El Morro wind farm · 8 MW | GEM | 刪除 | 查無此風場；Grupo Argos 旗下唯一的風場是 2025 年在大西洋省啟用的 Carreto（9.6 MW） | [連結](https://www.eltiempo.com/colombia/barranquilla/el-atlantico-entra-a-la-era-de-la-energia-eolica-con-el-primer-parque-de-celsia-en-colombia-3460285) |

## 土耳其 (TUR)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Gökçedag wind farm · 135 MW · 2009 | GEM | 重複（併入「Gökçedağ (Osmaniye)」） | 同一座風場（又稱 Bahçe 風場） | [連結](https://en.wikipedia.org/wiki/Bah%C3%A7e_Wind_Farm) |
| Gökçedağ (Osmaniye) · 135 MW · 2010 | 精選 | 修正：座標 | 座標改到 Bahçe 與 Hasanbeyli 之間的 Gökçedağ 稜線（原座標偏離約 30 km） | [連結](https://www.openstreetmap.org/relation/12270025) |
| Gökçedağ wind farm · 135 MW | GEM | 重複（併入「Gökçedağ (Osmaniye)」） | 同一座風場（奧斯曼尼耶，135 MW，Zorlu 集團的 Rotor Elektrik）；GEM 沒有商轉年 | [連結](https://www.gem.wiki/G%C3%B6k%C3%A7eda%C4%9F_wind_farm) |

## 埃及 (EGY)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Amunet wind farm · 502 MW · 2025 | GEM | 重複（併入「Amunet (AMEA Power) Red Sea」） | 同一座風場（AMEA Power，紅海 Ras Ghareb）；GEM 寫 502 MW、2025 年全數商轉，本站依首批併網列 2024 年 | [連結](https://www.gem.wiki/Amunet_wind_farm) |
| Gulf Of Ziet Wind Complex · 580 MW · 2018 | GEM | 重複（併入「Gabal El Zeit (I-III)」） | GEM 專案頁的別名就是 Gabal El-Zayt（NREA 三期共 580 MW）；GEM 的座標落在庫塞爾附近，偏南約 250 km | [連結](https://www.gem.wiki/Gulf_Of_Ziet_Wind_Complex) |

## 塞內加爾 (SEN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Léona wind farm · 50 MW | GEM | 修正：狀態、年份 | 仍在開發（2010 年設測風塔，未見融資或施工） | [連結](http://www.arei.info/fr_EleQtra_Wind___Leona_50_MW__Wind.html) |
| Taiba N’Diaye wind farm · 158 MW · 2019 | GEM | 修正：容量、分期 | 三期：2019、2020 年各 55.2 MW，2021 年 48.3 MW | [連結](https://en.wikipedia.org/wiki/Taiba_N%27Diaye_Wind_Power_Station) |

## 多明尼加 (DOM)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Granadillos wind farm · 50 MW | GEM | 修正：狀態、年份 | 開發商表示仍在開發階段 | [連結](https://gedom.do/los-granadillos/) |
| La Isabela wind farm · 50 MW | GEM | 修正：狀態、年份 | 只有特許權，未見施工或啟用 | [連結](https://cne.gob.do/parque-eolico-la-isabela/) |
| Puerto Plata-Imbert wind farm · 46 MW | GEM | 修正：狀態、年份 | 只有特許權、未見施工；當地實際建成的是 Los Guzmancito | [連結](https://cne.gob.do/parque-eolico-puerto-plata-lmbert/) |
| Pecasa wind farm · 50 MW · 2019 | GEM | 重複（併入「Guanillo wind farm」） | PECASA（Parques Eólicos del Caribe）就是 El Guanillo 風場的業主：同一場址、同樣 25 部風機 | [連結](https://www.proparco.fr/en/carte-des-projets/pecasa) |
| Los Cocos wind farm · 87.3 MW · 2011 | GEM | 修正：容量、分期 | 77.2 MW（一期 25.2 MW 2011、二期 52 MW 2013）；GEM 的 87.3 MW 把 Quilvio Cabrera 也算進去 | [連結](https://www.egehaina.com/Centrales?name=LOSCOCOS) |
| Los Guzmancito wind farm · 98 MW · 2019 | GEM | 修正：容量、分期 | 兩期：2019 年 48.3 MW、2023 年 50 MW | [連結](https://www.diariolibre.com/actualidad/nacional/2023/07/01/inauguran-parque-eolico-los-guzmancito-en-puerto-plata/2391911) |
| Matafongo wind farm · 34 MW · 2019 | GEM | 修正：容量、分期 | 2024 年 10 月擴建 15.6 MW（3 × 5.2 MW） | [連結](https://listindiario.com/economia/energia/20241016/interenergy-instala-turbinas-eolicas-mas-grandes-centroamerica-caribe_829793.html) |

## 奧蘭 (ALA)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Långnabba wind farm · 40 MW · 2022 | GEM | 修正：類型 | 在奧蘭 Eckerö 南端的陸地上（只有輸電海纜在海底），不是離岸風場 | [連結](https://www.hbl.fi/2023-07-16/det-behovs-en-alanning-pa-varje-vindkraftverk-nu-har-alands-mr-vindkraft-fastnat-for-gront-vate/) |

## 巴西 (BRA)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Ventos Do Sul wind farm · 150 MW · 2006 | GEM | 重複（併入「Osório」） | Ventos do Sul Energia 就是 Osório 風場（150 MW，75 × 2 MW）的業主，同一座 | [連結](https://en.wikipedia.org/wiki/Os%C3%B3rio_wind_farm) |

## 德國 (DEU)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Borkum Riffgrund 3 · 913 MW · 2025 | 精選 | 修正：座標 | 座標改到建成風場範圍的中心（原座標偏東南約 18 km，落在 Borkum Riffgrund 1、2 旁） | [連結](https://www.openstreetmap.org/way/1271257138) |
| Hohe See · 497 MW · 2019 | 精選 | 修正：座標 | 座標改到建成風場範圍的中心（原座標偏東約 9 km） | [連結](https://www.openstreetmap.org/way/344491479) |
| Hooksiel (BARD test turbine) · 5 MW · 2008 | 精選 | 修正：除役年 | 2016 年 5 月拆除（當時已停機約四年） | [連結](https://www.thb.info/rubriken/offshore-windenergie/detail/news/ein-pionier-windrad-verlaesst-hooksiel.html) |

## 愛爾蘭 (IRL)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Arklow Bank Phase 1 · 25.2 MW · 2004 | 精選 | 修正：除役年 | 最後三部風機 2024 年 5 月因安全原因停機，此後不再發電；業者 2026 年 9 月表示將申請拆除 | [連結](https://www.rte.ie/news/business/2026/0910/1591020-plans-lodged-to-dismantle-constructed-off-shore-wind-farm/) |

## 挪威 (NOR)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Fosen Vind (six farms) · 1,057 MW · 2018 | 精選 | 刪除 | 六座風場的彙總（Roan、Storheia、Harbaksfjellet、Kvenndalsfjellet、Geitfjellet、Hitra 2，合計 1,057.6 MW），各座已逐場列出 | [連結](https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge) |
| Smola wind farm · 150 MW · 2002 | GEM | 重複（併入「Smøla」） | 同一座風場；分期（2002 年 40 MW、2005 年 110 MW）與業主移到精選紀錄 | [連結](https://en.wikipedia.org/wiki/Sm%C3%B8la_Wind_Farm) |
| Hordavind wind farm · 682 MW | GEM | 刪除 | 從未建成：1,500 MW 的申請在 2026 年 2 月被 NVE 駁回 | [連結](https://www.nve.no/konsesjon/konsesjonssaker/konsesjonssak?id=7412&type=A-6) |
| Sormarkfjellet wind farm · 130 MW | GEM | 修正：年份、容量 | 補上商轉年 2021（130.2 MW） | [連結](https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge) |
| Stokkfjellet wind farm · 88 MW | GEM | 修正：年份、容量 | 補上商轉年 2021（88.2 MW） | [連結](https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge) |
| Lutelandet wind farm · 51 MW | GEM | 修正：年份、容量 | 補上商轉年 2021（51.1 MW） | [連結](https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge) |
| Tysvaer wind farm · 47 MW | GEM | 修正：年份、容量 | 補上商轉年 2021（47.3 MW） | [連結](https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge) |
| Haram wind farm · 34 MW | GEM | 修正：年份、容量 | 補上商轉年 2021（34 MW） | [連結](https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge) |
| Svaheia wind farm · 25 MW | GEM | 修正：年份、容量 | 補上商轉年 2018（25.2 MW） | [連結](https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge) |
| Gismarvik wind farm · 12.6 MW | GEM | 修正：年份、容量 | 補上商轉年 2021（12.6 MW） | [連結](https://no.wikipedia.org/wiki/Liste_over_vindkraftverk_i_Norge) |
| Havøygavlen wind farm · 38 MW | GEM | 修正：年份、容量 | 2020–21 年汰換為 9 部 V117（另保留 1 部 2010 年的 3 MW 測試機），合計 41.4 MW | [連結](https://finnmarkkraft.no/prosjekter/havoygavlen-vindpark) |
| Karmoy Wind Turbine Demonstration Area · 10 MW · 2020 | GEM | 刪除 | 只取得許可、從未興建：NVE 2010 年核准兩部固定式示範機組（最多 10 MW），METCentre 於 2024 年 7 月撤回許可 | [連結](https://www.nve.no/konsesjon/konsesjonssaker/konsesjonssak/?type=A-6&id=193) |
| Kvitsoy Wind Turbine Demonstration Area · 10 MW · 2021 | GEM | 刪除 | 只取得許可、從未興建：NVE 的資料列為「許可已撤回」，沒有運轉日期 | [連結](https://kart.nve.no/enterprise/rest/services/Vindkraft2/MapServer/5/query?where=saksid+in+(192,193,194)&outFields=saksid,anleggnavn,kommune,stadium,sakskategori,status,forsteidriftdato,effekt_mw&returnGeometry=false&f=json) |
| Rennesoy Wind Turbine Demonstration Area · 10 MW · 2010 | GEM | 刪除 | 只取得許可（NVE 2010 年）、從未興建：NVE 的已建成風場圖層在這一帶只有 Tysvær、Gismarvik、Zephyros、Utsira、Storøy | [連結](https://kart.nve.no/enterprise/rest/services/Vindkraft2/MapServer/0/query?where=1%3D1&geometry=4.8,58.9,5.8,59.4&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=saksid,anleggnavn,kommune,status,effekt_mw&returnGeometry=false&f=json) |
| Marine Energy Test Centre wind farm · 20 MW · 2009 | GEM | 刪除 | METCentre 測試場許可的容量（浮動式 10 MW＋固定式 10 MW），不是一座風場：實際只有 Hywind Demo（Zefyros）與 TetraSpar 兩部浮動式機組，本站已分別列出；固定式從未興建 | [連結](https://www.norwegianoffshorewind.no/about/initiatives/met-centre/) |
| TetraSpar Demonstrator (METCentre) · 3.6 MW · 2021 | 精選 | 修正：除役年 | 2026 年夏天除役，拖回港口 | [連結](https://www.rwe.com/en/our-energy/discover-renewables/floating-offshore-wind/tetraspar/) |

## 日本 (JPN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Fukushima FORWARD floating demo · 14 MW · 2013 | 精選 | 修正：分期 | 三部浮動式機組：2013 年 11 月 2 MW（半潛式）、2015 年 12 月 7 MW（V 型半潛式）、2017 年 2 月 5 MW（單柱式）開始運轉；7 MW 於 2018 年決定停機、2020 年撤除，其餘兩部 2021 年 2 月起撤除 | [連結](https://www.fukushima-forward.jp/reference/pdf/study086.pdf) |
| Goto City Offshore floating project · 16.8 MW · 2026 | 精選 | 修正：中文名 | 2026 年 1 月 5 日開始商轉（8 部 2.1 MW，五島洋上風場）；本站時間軸目前到 2025 年，2025 年底還在興建，所以先列為興建中 | [連結](https://www.toda.co.jp/news/2026/20260105_006181.html) |
| Kyushu floating wind farm · 1,000 MW | GEM | 重複（併入「Kyushu - GIP floating wind farm」） | 同一個規劃案（Skyborn，1 GW，五島外海）；GEM 有兩筆 | [連結](https://www.gem.wiki/Kyushu_floating_wind_farm) |
| Kamis Offshore wind farm · 30 MW · 2010 | GEM | 刪除 | GEM 把神栖一期（2010 年 14 MW）與二期（2013 年 16 MW）合成一筆，本站兩期各有紀錄 | [連結](https://www.gem.wiki/Kamis_Offshore_wind_farm) |
| Kamisu Phase 1 (Wind Power Ibaraki) · 14 MW · 2010 | 精選 | 修正：座標 | 一期在南濱外海（神栖市資料）；原座標在內陸約 1.5–2 km，改用 OpenStreetMap 的風機位置（概略位置） | [連結](https://www.city.kamisu.ibaraki.jp/shisei/machi/1007515/1002412.html) |
| Kamisu Phase 2 · 16 MW · 2013 | 精選 | 修正：座標 | 二期在北濱外海、位於一期北邊（原座標在一期南邊的內陸，南北顛倒）；改用 OpenStreetMap 的風機位置（概略位置） | [連結](https://www.city.kamisu.ibaraki.jp/shisei/machi/1007515/1002412.html) |
| Setana semi-offshore · 1.2 MW · 2004 | 精選 | 修正：除役年 | 因故障與老化停機（確切停機時間待查證，2025 年 7 月已報導決定撤除）；瀨棚町 2026 年 4 月決定 2027 年度撤除 | [連結](https://www.hokkaido-np.co.jp/article/1305209/) |
| Setana semi-offshore · 1.2 MW · 2004 | 精選 | 修正：座標 | 座標改到瀨棚港東外防波堤內側的風機位置（OpenStreetMap，概略位置；原座標偏東北約 1 km） | [連結](https://www.khi.co.jp/pressrelease/detail/c3040209-1.html) |
| Kitakyushu Offshore Demonstration (NEDO/J-Power) · 2 MW · 2013 | 精選 | 修正：除役年 | 2019 年 9 月撤除風機與上部結構（10 月起以 SEP 船施工），不是 2023 年；重力式底版留作 J-POWER 的研究設施 | [連結](https://www.jpower.co.jp/oshirase/2019/10/oshirase191001.html) |
| Kitakyushu Hibikinada · 220 MW · 2026 | 精選 | 修正：機組 | 2026 年 3 月 2 日開始商業運轉（25 部 9.6 MW，併網上限 220 MW）；本站時間軸目前到 2025 年，2025 年底還在興建，所以先列為興建中 | [連結](https://hibikiwindenergy.co.jp/news/2026/0301.html) |
| Eurus Akita Port semi-offshore · 3 MW · 2015 | 精選 | 修正：座標 | 這 1 部屬ユーラス秋田港ウインドファーム，在秋田市向濱；原座標落在秋田港洋上風場上，改為向濱的概略位置 | [連結](https://www.fuji-gab-mesh.co.jp/zisseki/zissekidetail/tikutei24.html) |
| Hokkaido Ishikari Bay Offshore wind farm · 1,000 MW | GEM | 修正：狀態 | 不是興建中：丸紅的石狩灣專案只有 2021 年 2 月的計畫階段環境配慮書，海域尚未指定為促進區域 | [連結](https://www.meti.go.jp/policy/safety_security/industrial_safety/sangyo/electric/detail/furyoku_hokkaidoishikariwan.html) |

## 比利時 (BEL)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| C-Power Offshore Wind Project · 325 MW · 2009 | GEM | 刪除 | Thorntonbank 風場（營運商 C-Power）的整場合計；三期已由精選的 Thornton Bank I、II、III 逐期列出（30 + 184.5 + 110.7 MW） | [連結](https://en.wikipedia.org/wiki/Thorntonbank_Wind_Farm) |

## 法國 (FRA)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Îles d'Yeu et de Noirmoutier · 496 MW · 2025 | 精選 | 修正：容量、機組、分期 | 實際為 61 部 × 8 MW＝488 MW（原本寫 62 部、496 MW）；2025 年 6 月開始發電，年底已併網 408 MW，2026 年 4 月全部完工 | [連結](https://www.meretmarine.com/fr/energies-marines/parc-de-yeu-noirmoutier-toutes-les-eoliennes-ont-ete-installees) |
| Calvados (Courseulles-sur-Mer) · 450 MW · 2025 | 精選 | 修正：狀態、年份 | 興建中：比原計畫延後約兩年，EDF 預計 2027 年底商轉（原本誤列為 2025 年營運中） | [連結](https://www.connaissancedesenergies.org/afp/en-normandie-la-mise-en-service-du-parc-eolien-calvados-reportee-de-2-ans-250705) |
| EFGL wind farm · 30 MW · 2026 | GEM | 重複（併入「Les Éoliennes Flottantes du Golfe du Lion (EFGL)」） | 同一座風場（Leucate 外海，30 MW） | [連結](https://www.gem.wiki/EFGL_wind_farm) |
| Les Éoliennes Flottantes du Golfe du Lion (EFGL) · 30 MW · 2025 | 精選 | 修正：狀態、年份、業主 | 2026 年 5 月開始發電、7 月全面運轉，業主是 Ocean Winds 與 Banque des Territoires；本站時間軸目前到 2025 年，2025 年底還在興建，所以先列為興建中 | [連結](https://www.offshorewind.biz/2026/07/10/floating-wind-farm-offshore-france-reaches-full-power/) |
| Eolmed Floating wind farm · 30 MW | GEM | 重複（併入「EolMed (Gruissan)」） | 同一座風場（Gruissan 外海，30 MW） | [連結](https://www.gem.wiki/Eolmed_Floating_wind_farm) |
| EolMed (Gruissan) · 30 MW · 2025 | 精選 | 修正：狀態、年份 | 2026 年 4 月開始發電、5 月全面運轉；本站時間軸目前到 2025 年，2025 年底還在興建，所以先列為興建中 | [連結](https://www.bw-ideol.com/en/eolmed-project) |
| Provence Grand Large · 25 MW · 2024 | 精選 | 修正：機組 | 機組是西門子歌美颯的 8.4 MW 風機，不是 Vestas | [連結](https://www.sbmoffshore.com/newsroom/sbm-offshore-announces-successful-installation-3-floating-wind-units/) |

## 泰國 (THA)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Jhimpir Power (Energy Absolute) wind farm · 600 MW · 2019 | GEM | 刪除 | 不存在：Jhimpir 在巴基斯坦，Energy Absolute 在泰國沒有 600 MW 風場（它在猜也蓬的 Hanuman 各場另有紀錄） | [連結](https://www.energyabsolute.co.th/en/our-businesses/renewable-business/wind-power-plants) |
| Subyai (Chaiyaphum) · 90 MW · 2016 | 精選 | 修正：容量、業主 | EGCO 的 Chaiyaphum 風場：80 MW（32 × 2.5 MW），2016 年 12 月商轉；業主名稱原本拼錯 | [連結](https://www.bangkokpost.com/business/1163661/egco-kicks-off-latest-wind-farm) |

## 澳洲 (AUS)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Snowtown I wind farm · 99 MW · 2008 | GEM | 重複（併入「Snowtown」） | Snowtown 第一期；精選的 Snowtown 已含兩期 | [連結](https://en.wikipedia.org/wiki/Snowtown_Wind_Farm) |
| Snowtown · 370 MW · 2008 | 精選 | 修正：容量、分期 | 補上兩期：2008 年 98.7 MW、2014 年 270 MW（北 144 + 南 126） | [連結](https://en.wikipedia.org/wiki/Snowtown_Wind_Farm) |
| Bluff Point wind farm · 64 MW · 2002 | GEM | 重複（併入「Woolnorth (Bluff Point / Studland Bay)」） | Woolnorth 的 Bluff Point 部分；精選紀錄已含 Bluff Point 與 Studland Bay | [連結](https://en.wikipedia.org/wiki/Woolnorth_Wind_Farm) |
| Woolnorth (Bluff Point / Studland Bay) · 140 MW · 2002 | 精選 | 修正：容量、分期 | 補上分期：Bluff Point 2002 年 10.5 MW、2004 年 54.3 MW，Studland Bay 2007 年 75 MW | [連結](https://en.wikipedia.org/wiki/Woolnorth_Wind_Farm) |
| Portland (PWEP) Wind Energy Project · Codrington wind farm, Yambuk wind farm · 48 MW · 2001 | GEM | 修正：名稱、容量、年份、分期 | 扣除另有精選紀錄的 Codrington（18.2 MW，2001）：只留 Yambuk 30 MW（2007 年，Portland 風電計畫第四個場址） | [連結](https://en.wikipedia.org/wiki/Portland_Wind_Project) |
| MacIntyre · 923 MW · 2024 | 精選 | 重複（併入「MacIntyre precinct wind farm」） | 同一座風場（923 MW，2024 年）；GEM 的座標在 Karara 附近的實際場址，精選紀錄的座標偏東約 40 km，改留 GEM 這筆 | [連結](https://www.gem.wiki/MacIntyre_precinct_wind_farm) |
| Studland Bay wind farm · 75 MW · 2007 | GEM | 重複（併入「Woolnorth (Bluff Point / Studland Bay)」） | GEM 專案頁的別名就是 Woolnorth：75 MW（2007 年）已含在精選的 Woolnorth 紀錄的分期裡 | [連結](https://www.gem.wiki/Studland_Bay_wind_farm) |

## 烏拉圭 (URY)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Pampa (Nordex) wind farm · 141.6 MW · 2016 | GEM | 重複（併入「Pampa (Tacuarembó)」） | 同一座風場（UTE 的 Pampa，141.6 MW） | 資料比對 |
| Pampa (Tacuarembó) · 141.6 MW · 2017 | 精選 | 修正：年份 | 2016 年 10 月開始運轉 | [連結](https://es.wikipedia.org/wiki/Parque_e%C3%B3lico_Pampa) |

## 瑞典 (SWE)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Utgrunden I · 10.5 MW · 2000 | 精選 | 修正：除役年 | 2018 年由 Vattenfall 拆除 | [連結](https://www.offshorewind.biz/2018/10/04/swedish-offshore-wind-farm-is-no-more/) |
| Bockstigen · 2.8 MW · 1998 | 精選 | 修正：容量、分期 | 2018 年換上整修過的 Vestas V47（660 kW）機艙與葉片，沿用原本的塔架與基礎，容量由 2.8 MW 增為 3.3 MW | [連結](https://www.offshorewind.biz/2018/12/05/swedish-old-timer-gains-momentum/) |
| Vindpark Vänern (Gässlingegrund) · 30 MW · 2010 | 精選 | 修正：座標 | 座標改到維納恩湖 Gässlingegrund 的 10 部風機（原座標偏南約 27 km） | [連結](https://www.openstreetmap.org/relation/14399986) |

## 約旦 (JOR)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Tafilah wind farm · 117 MW · 2017 | GEM | 重複（併入「Tafila」） | 同一座風場（JWPC，117 MW，2015 年 9 月商轉） | [連結](https://masdar.ae/en/renewables/our-projects/tafila-wind-farm) |

## 羅馬尼亞 (ROU)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Adamdel wind farm · 484 MW | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄 | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Banca wind farm · 300 MW · 2012 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄 | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Cwp Independenta I Wind Farm wind farm · 226 MW · 2013 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄 | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Falciu wind farm · 198 MW · 2012 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄 | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Auseu-Borod wind farm · 65 MW · 2012 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄 | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Monsson Orsova wind farm · 35 MW · 2012 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄 | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Monsson Serbotesti wind farm · 150 MW · 2012 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄（Monsson 唯一的 150 MW 級案場是 Pantelimon） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Windkraft Sfanta Elena wind farm · 84 MW · 2013 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄；唯一的 Sfânta Elena 風場是 48.3 MW 那座，已列為 Moldova Noua | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Pestera Sorgenia wind farm · 50 MW · 2012 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄；Verbund 的風場不含它合計已達 226 MW | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Gebelesis Enel wind farm · 27 MW · 2012 | GEM | 刪除 | 不在輸電公司 Transelectrica 2024 年 2 月的風場清單（逐場加總等於全國總量），查無建成紀錄；PPC（原 Enel）的 8 座不含它合計 498.7 MW | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Iberdrola Cogealac wind farm · 322 MW · 2012 | GEM | 刪除 | Iberdrola（Eolica Dobrogea）在羅馬尼亞只建成 Mihai Viteazu（80 MW），此案未興建 | [連結](https://www.iberdrola.com/press-room/news/detail/iberdrola-sells-its-wind-power-assets-in-romania-for-88-million-euro) |
| Iberdrola Sacele wind farm · 162 MW · 2013 | GEM | 刪除 | Iberdrola（Eolica Dobrogea）在羅馬尼亞只建成 Mihai Viteazu（80 MW），此案未興建 | [連結](https://www.iberdrola.com/press-room/news/detail/iberdrola-sells-its-wind-power-assets-in-romania-for-88-million-euro) |
| Iberdrola Piatra wind farms · 64 MW · 2013 | GEM | 刪除 | Iberdrola（Eolica Dobrogea）在羅馬尼亞只建成 Mihai Viteazu（80 MW），此案未興建 | [連結](https://www.iberdrola.com/press-room/news/detail/iberdrola-sells-its-wind-power-assets-in-romania-for-88-million-euro) |
| Beidaud wind farm · 128 MW · 2010 | GEM | 刪除 | Iberdrola（Eolica Dobrogea）在羅馬尼亞只建成 Mihai Viteazu（80 MW），此案未興建 | [連結](https://www.iberdrola.com/press-room/news/detail/iberdrola-sells-its-wind-power-assets-in-romania-for-88-million-euro) |
| Istria wind farm · 74 MW · 2012 | GEM | 刪除 | Iberdrola（Eolica Dobrogea）在羅馬尼亞只建成 Mihai Viteazu（80 MW），此案未興建 | [連結](https://www.iberdrola.com/press-room/news/detail/iberdrola-sells-its-wind-power-assets-in-romania-for-88-million-euro) |
| Valea Nucarilor wind farm · 70 MW · 2011 | GEM | 重複（併入「Salbatica wind farm · 2」） | 與 Salbatica 二期是同一筆 70 MW；Transelectrica 的 Valea Nucarilor 是 34 MW（即 Agighiol 那筆） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Casimcea Verbund wind farm · 200 MW · 2012 | GEM | 修正：名稱、容量、座標 | Verbund 在 Casimcea 的三座是 Alpha Wind Nord 81.3、Ventus Nord 2 69 與 Cas Sud 2 75.9 MW；這筆 200 MW 是重複的彙總，改為 Cas Sud 2 | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Alpha Wind Nord wind farm · 81 MW · 2017 | GEM | 修正：座標 | 位於圖爾恰縣 Casimcea（原座標是羅馬尼亞國土中心的代用點） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Ventus Nord-2 wind farm · 69 MW | GEM | 修正：座標 | 位於圖爾恰縣 Casimcea（原座標是羅馬尼亞國土中心的代用點） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Casimcea wind farm · 1 · 10 MW · 2015 | GEM | 修正：座標 | 位於圖爾恰縣 Casimcea（原座標是羅馬尼亞國土中心的代用點） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Corugea wind farm · 70 MW · 2011 | GEM | 修正：座標 | 位於圖爾恰縣 Casimcea（原座標是羅馬尼亞國土中心的代用點） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Salbatica wind farm · 2 · 70 MW · 2011 | GEM | 修正：座標 | 與一期同在圖爾恰縣 Sălbatica（原座標是羅馬尼亞國土中心的代用點） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Casimcea wind farm · 2 · 10 MW | GEM | 修正：容量 | 容量 5.8 MW（業主 Renovatio Trading） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Babadag wind farm · 66 MW · 2012 | GEM | 修正：容量 | Transelectrica 清單只有 Babadag 3（30 MW） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Baia Holrom wind farm · 17 MW · 2011 | GEM | 修正：容量 | Transelectrica 清單的 Baia 4（Holrom）是 10 MW | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |
| Ruginoasa wind farm · 60 MW · 2024 | GEM | 修正：年份 | 2023 年 11 月完工 | [連結](https://balkangreenenergynews.com/ukrainian-billionaire-akhmetov-completes-60-mw-ruginoasa-wind-farm-in-romania/) |

## 美國 (USA)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Chanarambie Power Partners  LLC · 85.5 MW · 2004 | WRI GPPD | 重複（併入「Chanarambie wind farm」） | WRI GPPD 舊資料；GEM 有同一座風場（已於 2022 年除役） | 資料比對 |
| Snyder Wind Farm · 63 MW · 2008 | WRI GPPD | 重複（併入「Snyder wind farm」） | WRI GPPD 舊資料；GEM 有同一座風場（已於 2021 年除役） | 資料比對 |
| FPL Energy Story Wind LLC · 150 MW · 2009 | WRI GPPD | 重複（併入「Story County」） | Story County 第二期（150 MW，2009）；精選的 Story County（300 MW）已含兩期 | [連結](https://en.wikipedia.org/wiki/Story_County_Wind_Farm) |
| Story County · 300 MW · 2008 | 精選 | 修正：座標、分期 | 補上兩期（2008、2009 年各 150 MW），座標改到 Colo 以北的實際場址 | [連結](https://en.wikipedia.org/wiki/Story_County_Wind_Farm) |
| Prairie Winds SD1 · 162 MW · 2011 | WRI GPPD | 重複（併入「Crow Lake wind farm」） | PrairieWinds SD1 是 Basin Electric 持有 Crow Lake 風場（162 MW，2011）的子公司，同一座 | [連結](https://renewablesnow.com/news/basin-electrics-162-mw-crow-lake-wind-project-starts-operation-in-south-dakota-17914/) |
| Windy Point wind farm (United States) · 136.3 MW · 2009 | GEM | 重複（併入「Windy Point / Windy Flats」） | Windy Point 第一期（136.3 MW，2009）；精選紀錄（400 MW）已含第一期與 Windy Flats | [連結](https://en.wikipedia.org/wiki/Windy_Point/Windy_Flats) |
| Sunrise wind farm (United States) · 924 MW · 2027 | GEM | 修正：名稱、座標 | 與 2026 整理清單的「Sunrise Wind」是同一座（Ørsted，924 MW，BOEM 租約 OCS-A 0487）：GEM 的座標其實落在 Revolution Wind 的租約區內，改到 OCS-A 0487 的中心（概略位置）並改用專案名稱，清單那筆就會併進來、不再重複 | [連結](https://www.boem.gov/renewable-energy/state-activities/sunrise-wind) |
| Vineyard Wind 1 · 806 MW · 2025 | 精選 | 修正：狀態、年份 | 最後一部風機 2026 年 3 月 13 日才裝好（開發商 2026 年 1 月的訴狀說 2025 年底 62 部中只有 44 部運轉、約 572 MW）；依本站慣例改列興建中、年份 2026 | [連結](https://www.wbur.org/news/2026/03/14/vineyard-wind-construction-complete-massachusetts-offshore-wind) |
| Coastal Virginia Offshore Wind (CVOW) Commercial Project · 2,640 MW · 2027 | GEM | 修正：機組 | 完工時間延到 2027 年底：2026 年 8 月時 176 部風機裝好 31 部，2026 年 3 月起首批運轉約 450 MW（清單的預計完工年也一併改為 2027，見 PIPE_FIX） | [連結](https://www.offshorewind.biz/2026/08/03/largest-us-offshore-wind-farm-81-pct-complete-final-turbine-expected-by-end-of-2027) |
| Revolution Wind · 715 MW · 2026 | GEM | 修正：容量 | 開發商的容量是 704 MW（羅德島 400 MW＋康乃狄克 304 MW）；65 部 × 11 MW 的銘牌合計為 715 MW | [連結](https://www.offshorewind.biz/2026/09/18/us-gets-new-offshore-wind-farm-as-all-turbines-installed-at-704-mw-revolution-wind) |
| Empire wind farm · 816 MW · 2027 | GEM | 修正：容量 | 開發商的容量是 810 MW（54 部 Vestas V236-15 MW） | [連結](https://www.empirewind.com/project/) |
| Kingman Wind · 214.8 MW · 2017 | WRI GPPD | 重複（併入「Kingman Wind Energy Center」） | WRI GPPD 舊資料；GEM 專案頁的別名就是 Kingman Wind（214.8 MW，2016 年） | [連結](https://www.gem.wiki/Kingman_Wind_Energy_Center) |

## 肯亞 (KEN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Lake Turkana · 310 MW · 2017 | WRI GPPD | 重複（併入「Lake Turkana」） | WRI GPPD 舊資料，與精選紀錄是同一座 | 資料比對 |
| Lake Turkana · 310 MW · 2019 | 精選 | 修正：年份 | 2018 年 9 月首次併網、10 月商轉（2019 年 7 月是落成典禮） | [連結](https://en.wikipedia.org/wiki/Lake_Turkana_Wind_Power_Station) |
| Chania Green Wind Project · 50 MW · 2021 | GEM | 修正：狀態、年份 | 尚在開發、未建成（GEM 標為 2021 年營運，沒有出處） | [連結](https://www.power-technology.com/marketdata/power-plant-profile-chania-green-wind-project-kenya/) |
| Kilifi wind farm · 36 MW · 2021 | GEM | 修正：年份 | 2019 年 12 月啟用；Mombasa Cement 的自備電廠，餘電併入國家電網 | [連結](https://en.wikipedia.org/wiki/Mombasa_Cement_Wind_Power_Station) |
| Kajiado wind farm · 100 MW · 2021 | GEM | 重複（併入「Kipeto」） | GEM 專案頁的別名就是 Kipeto Project（100 MW，2021 年） | [連結](https://www.gem.wiki/Kajiado_wind_farm) |

## 芬蘭 (FIN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Kemi Ajos · 30 MW · 2008 | 精選 | 重複（併入「Ajos Retrofit wind farm」） | 同一場址；GEM 有完整沿革（2008 年的原機組 27 MW 到 2016 年，之後汰換為 43 MW），保留 GEM 的兩筆 | 資料比對 |

## 英國 (GBR)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Westermost Rough A wind farm · 210 MW · 2015 | GEM | 重複（併入「Westermost Rough」） | 同一座風場；GEM 座標在林肯郡外海，偏離約 80 km | [連結](https://en.wikipedia.org/wiki/Westermost_Rough_Wind_Farm) |
| Hornsea wind farm · 1 · 1,218 MW · 2019 | GEM | 重複（併入「Hornsea One」） | 同一座風場 | 資料比對 |
| Dogger Bank wind farm · 1,200 MW · 2023 | GEM | 重複（併入「Dogger Bank A」） | 同一座風場（Dogger Bank A，2023 年 10 月首次發電） | [連結](https://www.equinor.com/news/202310-dogger-bank) |
| Hornsea wind farm · 3, 4 · 5,555 MW | GEM | 刪除 | Hornsea 3 已由 2026 整理清單列為興建中；Hornsea 4 已於 2025 年 5 月由 Ørsted 停止開發 | [連結](https://orsted.com/en/company-announcement-list/2025/05/orsted-to-discontinue-the-hornsea-4-offshore-wind--143901911) |
| Sofia · 1,400 MW · 2025 | 精選 | 修正：狀態、年份 | 興建中：100 部風機 2026 年 6 月 10 日全部裝好，仍在試運轉（原本誤列為 2025 年營運中；2025 年還沒有發電） | [連結](https://www.rwe.com/en/press/rwe-ag/2026-06-11-rwe-completes-installation-of-all-turbines-at-sofia-offshore-wind-farm/) |
| Sofia · 1,400 MW · 2026 | 精選 | 修正：座標 | 座標改到核准風場範圍（Dogger Bank Teesside B，592 km²）的中心；原座標在範圍外約 38 km | [連結](https://www.legislation.gov.uk/uksi/2015/1592/schedule/1/made) |
| Sofia wind farm · 1,400 MW | GEM | 重複（併入「Sofia」） | 同一座風場（RWE，1.4 GW）；GEM 座標是整個 Dogger Bank 區的代用點 | [連結](https://www.rwe.com/en/press/rwe-ag/2026-06-11-rwe-completes-installation-of-all-turbines-at-sofia-offshore-wind-farm/) |
| Dogger Bank A · 1,200 MW · 2025 | 精選 | 修正：業主 | 業主改為 Equinor、SSE Renewables 與 Vårgrønn 的合資；原欄位是 Dogger Bank South 的業主 | [連結](https://www.equinor.com/news/202310-dogger-bank) |
| Dogger Bank A · 1,200 MW · 2025 | 精選 | 修正：年份、分期 | 逐年併網（WindEurope 年度統計）：2023 年 1 部（13 MW）、2024 年 63 MW、2025 年 66 部（834 MW）；95 部風機 2026 年 2 月全部裝好，其餘仍在試運轉 | [連結](https://proceedings.windeurope.org/biplatform/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBa01LIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--8aebcd72a09f63bec00d2131e13a2a48069695a4/WindEurope-European-Stats-2025.pdf) |
| Dounreay Tr‚àö¬®  Floating Wind Demonstration · 10 MW | GEM | 刪除 | 從未興建：這個兩部風機的示範案已經中止，同一場址後來改由 Pentland 浮動式風場開發（另列） | [連結](https://www.offshorewind.biz/2021/06/18/cip-revives-floating-wind-project-offshore-scotland/) |
| Kincardine · 49.5 MW · 2021 | 精選 | 修正：容量、機組 | 現在是 5 部 9.5 MW（47.5 MW）；2018–2020 年曾有 1 部 2 MW 試驗機（原 WindFloat 1），2020 年移走 | [連結](https://marine.gov.scot/sites/default/files/250403_-_kincardine_offshore_windfarm_-_project_environmental_monitoring_programme_-_revision_c10.pdf) |
| Triton Knoll (Innogy) wind farm · 857 MW · 2022 | GEM | 重複（併入「Triton Knoll」） | 同一座風場（857 MW）；GEM 寫 2022 年，本站依全數風機 2021 年發電列 2021 年 | [連結](https://www.gem.wiki/Triton_Knoll_(Innogy)_wind_farm) |

## 荷蘭 (NLD)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Beaufort wind farm · 350 MW · 2009 | GEM | 刪除 | 從未建成：2009 年取得許可但未獲補貼，許可延到 2020 年仍未興建 | [連結](https://group.vattenfall.com/nl/newsroom/archive/nieuws/2012/vergunning-nuon-windpark-beaufort-verlengd-tot-2020) |
| Amazon Shell HKN offshore wind farm · 759 MW · 2023 | GEM | 重複（併入「Hollandse Kust Noord」） | 就是 Hollandse Kust Noord（CrossWind：Shell 與 Eneco；Amazon 只是購電方） | [連結](https://en.wikipedia.org/wiki/Hollandse_Kust_Noord_Offshore_Wind_Farm) |
| Hollandse Kust Noord · 759 MW · 2023 | 精選 | 修正：業主 | 業主改為 CrossWind（Shell、Eneco）；原欄位是鄰近風場的業主 | [連結](https://en.wikipedia.org/wiki/Hollandse_Kust_Noord_Offshore_Wind_Farm) |
| Noordoostpolder-Westermeerwind Windpark · 429 MW · 2017 | GEM | 重複（併入「Noordoostpolder (incl. Westermeerwind nearshore)」） | 同一座風場（GEM 座標偏西約 80 km，落在北海） | [連結](https://nl.wikipedia.org/wiki/Windpark_Noordoostpolder) |
| Noordoostpolder Buitendijks wind farm · 15 MW | GEM | 重複（併入「Westermeerwind」） | Westermeerwind 位於弗里斯蘭省水域的幾部風機 | [連結](https://www.gem.wiki/Noordoostpolder_Buitendijks_wind_farm) |
| Binnenjijks wind farm · 68 MW | GEM | 重複（併入「Noordoostpolder (incl. Westermeerwind nearshore)」） | Noordoostpolder 堤內（binnendijks）的陸上風機 | [連結](https://www.gem.wiki/Binnenjijks_wind_farm) |
| Noordoostpolder (incl. Westermeerwind nearshore) · 429 MW · 2016 | 精選 | 修正：名稱、容量、年份、分期 | 全區 429 MW＝湖中的 Westermeerwind 144 MW（另列一筆）＋堤岸上的 NOP Agrowind 195 MW（2016）與 Zuidwester 90 MW（2017）；原本的 429 MW 重複計入 Westermeerwind | [連結](https://nl.wikipedia.org/wiki/Windpark_Noordoostpolder) |
| Windpark Fryslân · 382.7 MW · 2021 | 精選 | 修正：座標 | 座標改到 89 部風機的中心（原座標偏東約 6 km，在最東一排風機外） | [連結](https://www.openstreetmap.org/way/672905354) |
| Irene Vorrink (Dronten) · 16.8 MW · 1996 | 精選 | 修正：除役年、座標 | 2022 年 3 月起拆除，由 Windplanblauw 取代；原座標在陸上，改到萊利斯塔德北邊艾瑟爾湖堤外的水域（概略位置） | [連結](https://group.vattenfall.com/press-and-media/newsroom/2022/dismantling-of-irene-vorrink-wind-farm-after-25-years-of-faithful-service) |
| Dronten offshore wind farm · 17 MW · 1996 | GEM | 重複（併入「Irene Vorrink (Dronten)」） | 同一座風場：早年的離岸風場清單把艾瑟爾湖 Dronten 的 Nordtank 600 kW 風機（1996 年起）列為「Dronten」，就是 Irene Vorrink；GEM 座標在北海 | [連結](https://www.techniques-ingenieur.fr/actualite/articles/10-parcs-eoliens-offshore-dans-le-monde-et-tous-en-europe-6521/) |
| NOP Agrowind wind farm · 195 MW · 2017 | GEM | 重複（併入「Noordoostpolder (incl. Westermeerwind nearshore)」） | 就是 Noordoostpolder 風場堤岸上的 NOP Agrowind（26 部 Enercon E-126，195 MW），在陸上，不是離岸 | [連結](https://nopagrowind.nl/) |
| Windplanblauw offshore wind farm · 132 MW · 2024 | GEM | 修正：座標 | 座標改到艾瑟爾湖中兩排共 24 部風機的位置（原座標在北海，偏西約 82 km）；132 MW 是湖中部分，另有 37 部在陸上 | [連結](https://www.openstreetmap.org/relation/12695731) |
| Borssele V (Two Towers innovation site) · 19 MW · 2021 | 精選 | 修正：座標 | 座標改到兩部風機的位置（原座標偏東北約 3 km） | [連結](https://www.openstreetmap.org/node/7680250702) |
| Borssele Site V wind farm · 19 MW · 2021 | GEM | 重複（併入「Borssele V (Two Towers innovation site)」） | 同一座風場（兩部 V164-9.5 MW，2022 年由 Octopus Energy 買下）；GEM 座標偏北約 85 km | [連結](https://www.offshorewind.biz/2022/06/29/dutch-offshore-wind-innovation-site-gets-new-owner/) |

## 菲律賓 (PHL)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Pagudpud (ACEN) Wind Power Project · 160 MW · 2024 | GEM | 重複（併入「Balaoi & Caunayan」） | Bayog Wind Power 是 ACEN 這座 160 MW 風場的專案公司，同一座 | [連結](https://business.inquirer.net/323245/acen-shells-out-p3b-to-partly-fund-phs-biggest-windmill-farm) |
| Bangui Bay · 33 MW · 2005 | 精選 | 修正：容量、分期 | 三期：2005 年 24.75 MW、2008 年 8.25 MW、2014 年 18.9 MW | [連結](https://en.wikipedia.org/wiki/Wind_power_in_the_Philippines) |

## 葡萄牙 (PRT)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Alto Do Talefe wind farm · 14 MW · 2005 | GEM | 重複（併入「Alto do Talefe」） | 同一座風場；實際位於 Cinfães（Montemuro 山），GEM 座標誤放在布拉加 | [連結](https://www.openstreetmap.org/relation/14053337) |
| WindFloat 1 (Aguçadoura demo) · 2 MW · 2011 | 精選 | 修正：座標 | 座標改到阿古薩杜拉外海約 5 km（概略位置；原座標偏西約 13 km） | [連結](https://www.principlepower.com/projects/windfloat1) |
| WindFloat Atlantic · 25.2 MW · 2020 | 精選 | 修正：業主 | 業主改為專案出資方 Ocean Winds、東京瓦斯與 Repsol；原欄位是比對錯的公司名 | [連結](https://www.principlepower.com/projects/windfloat-atlantic) |

## 西班牙 (ESP)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Biscay Marine Energy Platform wind farm · 20 MW · 2015 | GEM | 刪除 | BiMEP 測試場的併網容量（四條 5 MW 海纜），不是一座風場；測試場唯一裝過的風機 DemoSATH 已另列 | [連結](https://www.bimep.com/en/bimep-area/technical-characteristics/) |
| Timanfaya Floating Offshore wind farm · 50 MW | GEM | 修正：類型 | 浮動式：開發商 Capital Energy 的專案採浮動式技術（GEM 誤列為固定式） | [連結](https://www.evwind.es/2023/02/17/capital-energy-will-invest-2500-million-in-four-wind-farms-in-the-canary-islands-three-of-them-offshore/90273) |

## 越南 (VNM)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Tân Phú Đông 2 nearshore wind power plant · 50 MW · 2021 | GEM | 重複（併入「Tan Phu Dong 2 (Tien Giang, GEC)」） | 同一座風場 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Thuận Bắc Trungnam wind farm · 152 MW · 2019 | GEM | 重複（併入「Trung Nam Ninh Thuận」） | 同一座風場（Trung Nam，151.95 MW）；分期移到精選紀錄 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Chu Se wind farm · 700 MW | GEM | 刪除 | 查無此風場：唯一出處是沒有內容的 thewindpower 條目，也不在工貿部的商轉名單 | [連結](https://www.gem.wiki/Chu_Se_wind_farm) |
| Chu Pu wind farm · 200 MW | GEM | 刪除 | 無法證實：只有沒有出處的 thewindpower 條目，不在工貿部的商轉名單 | [連結](https://www.gem.wiki/Chu_Pu_wind_farm) |
| Cư An wind farm · 200 MW | GEM | 修正：名稱、容量、年份 | 應為 Cửu An 風場（嘉萊省安溪，46.2 MW，2021 年商轉）；200 MW 只見於沒有出處的條目 | [連結](https://sdic.vn/nha-may-dien-gio-cuu-an-462mw/) |
| BPP Vĩnh Châu wind farm · 30 MW | GEM | 修正：狀態、年份 | 2021 年動工，商轉日一再延後（預計 2025 年），尚未見商轉公告 | [連結](https://www.banpu.com/news/whyvietnam/) |
| Dong Hai 1 Phase 2 (Bac Lieu, Bac Phuong) · 50 MW · 2021 | 精選 | 重複（併入「Dong Hai 1 Offshore wind farm」） | 薄遼的東海1號（兩期各 50 MW）就是 GEM 這筆 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Dong Hai 1 Phase 1 (Tra Vinh, Trungnam) · 100 MW · 2021 | 精選 | 修正：名稱、中文名 | 茶榮的東海1號是獨立的風場，不是薄遼東海1號的一期 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Binh Dai 1 Phase 1 (TTC/Gulf, Ben Tre) · 30 MW · 2021 | 精選 | 重複（併入「Bến Tre 10 Bình Đại 1 Offshore wind farm」） | 平大1號的一部分；GEM 這筆含全部三期（128 MW） | [連結](https://www.ptsc.com.vn/en-US/news/ptsc-news-1/operating-news/pps-provides-services-at-binh-dai-wind-power-plant-ben-tre) |
| Binh Dai 1 Phase 2 · 30 MW · 2022 | 精選 | 重複（併入「Bến Tre 10 Bình Đại 1 Offshore wind farm」） | 平大1號的一部分；GEM 這筆含全部三期（128 MW） | [連結](https://www.ptsc.com.vn/en-US/news/ptsc-news-1/operating-news/pps-provides-services-at-binh-dai-wind-power-plant-ben-tre) |
| Tan An 1 Phase 1 (Ca Mau) · 30 MW · 2021 | 精選 | 重複（併入「Tân An 1 offshore wind farm」） | 同一座風場 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Tân An 1 offshore wind farm · 115 MW · 2021 | GEM | 修正：容量、分期 | 只有第一期 25 MW 商轉（2021）；後續各期到 2024 年仍未併網 | [連結](https://thanhnien.vn/ca-mau-kiem-tra-phat-hien-thieu-sot-o-2-nha-may-dien-gio-18524042817170935.htm) |
| Hiệp Thành wind farm · 65 MW · 2023 | GEM | 重複（併入「Hiep Thanh (Tra Vinh)」） | 同一座風場（茶榮省沿海的 Hiệp Thạnh；GEM 列為陸域） | 資料比對 |

## 規劃中專案清單（2026 整理）裡不收錄的專案

| 專案 | 理由 | 出處 |
|---|---|---|
| Firefly (Bandibuli) (KOR) | Equinor 於 2026 年 5 月停止開發 | [連結](https://www.equinor.co.kr/en/news/important-notice-on-bandibuli-project_en) |
| Red Sea Wind Energy (Ras Ghareb) (EGY) | 已於 2025 年 7 月 2 日全面商轉（650 MW，比原訂第三季提前）；GEM 2026-02 以「Ras Ghareb wind farm」第 2、3 期列為營運中，不再當規劃案 | [連結](https://orascom.com/updates/engie-orascom-construction-ttc-eurus-consortium-starts-full-commercial-operations-of-650-mw-wind-farm-in-egypt-ahead-of-schedule/) |
| Dogger Bank B (GBR) | GEM 2026-02 已把 B、C 兩期（1,235＋1,218 MW）合成一筆「Dogger Bank wind farm · B, C」列為興建中（2026），清單不再需要；2025-02 版時清單的這筆會誤對到 Dogger Bank South | [連結](https://www.gem.wiki/Dogger_Bank_wind_farm) |
| Dogger Bank C (GBR) | 同上：GEM 2026-02 的「Dogger Bank wind farm · B, C」已含 C 期 | [連結](https://www.gem.wiki/Dogger_Bank_wind_farm) |

## 規劃中專案清單（2026 整理）之後才變動的欄位

| 專案 | 修正 | 理由 | 出處 |
|---|---|---|---|
| Coastal Virginia Offshore Wind (CVOW) (USA) | expected=2027 | 預計完工年由 2026 改為 2027：2026 年 8 月開發商表示最後一批風機要到 2027 年底才裝完（當時 176 部裝好 31 部） | [連結](https://www.offshorewind.biz/2026/08/03/largest-us-offshore-wind-farm-81-pct-complete-final-turbine-expected-by-end-of-2027) |

## 不當成重複的 GEM 專案

| 專案 | 理由 | 出處 |
|---|---|---|
| Guangdong Yangjiang Shaba (Guangdong Energy) Offshore wind farm (CHN) | 粵電陽江沙扒（300 MW，2021 年 12 月全容量併網）與三峽陽江沙扒是不同的風場 | [連結](https://m.bjx.com.cn/mnews/20211206/1191794.shtml) |
| Guangdong Yangjiang Nanpengdao (China Energy Conservation) Offshore wind farm (CHN) | 中節能陽江南鵬島（300 MW，2021 年 11 月全容量併網）與中廣核南鵬島是不同的風場 | [連結](https://wind.in-en.com/html/wind-2412533.shtml) |
| Jiangsu Dongtai Zhugensha H2 Offshore wind farm (CHN) | 竹根沙 H2（302 MW，浙江新能與中海油）與國華東台四期 H2 是不同的風場 | [連結](https://www.nbd.com.cn/articles/2021-11-03/1978454.html) |
