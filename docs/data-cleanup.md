# 風場資料清理紀錄

[English](data-cleanup.en.md) ｜ 中文（本頁）

> 由 `tools/build_farms.py` 依 `tools/farm_cleanup.py` 的規則產生，請勿手動編輯。查證時間：2026-09（逐筆查證，理由與來源列於下表）。

合併各來源後，逐場資料仍有重複（同一座風場被兩個來源各收一次、或精選的「整區彙總」與 GEM 的逐場資料並存）、從未建成的案子被標為營運中，以及錯置的座標。這些以明確規則修正：每條規則指定剛好一筆紀錄，上游資料改版後若對不到就讓建置失敗，提醒重新查證。

- 規則 129 條：刪除 77 筆（其中營運中 24,471.8 MW），修正 52 筆。
- 另外，比對名稱時先把繁體字轉成簡體（精選清單用繁體、GEM 用簡體），並比對分區代號（H6、K 區…）與陸域／離岸，讓江蘇、廣東、山東等地重複收錄的離岸風場能自動併成一筆；`GEM_KEEP` 列出名稱相近但確認是不同風場的例外。
- 動作：**重複**＝與另一筆是同一座，刪除並把業主、分期併過去；**刪除**＝從未建成、查無此場或是重複的彙總；**修正**＝改正欄位。

| 國家 | 刪除 | 營運中 MW | 修正 |
|---|---:|---:|---:|
| 中國大陸 | 7 | 10,856 | 2 |
| 丹麥 | 1 | 180 | 1 |
| 伊朗 | 2 | 62 | 2 |
| 加拿大 | 1 | 353 | 0 |
| 南非 | 2 | 159 | 2 |
| 南韓 | 1 | 61.5 | 0 |
| 哥倫比亞 | 1 | 8 | 2 |
| 土耳其 | 1 | 135 | 1 |
| 塞內加爾 | 0 | 0 | 2 |
| 多明尼加 | 1 | 50 | 6 |
| 巴西 | 1 | 150 | 0 |
| 挪威 | 3 | 1,889 | 8 |
| 泰國 | 1 | 600 | 1 |
| 澳洲 | 3 | 193 | 3 |
| 烏拉圭 | 1 | 141.6 | 1 |
| 約旦 | 1 | 117 | 0 |
| 羅馬尼亞 | 16 | 2,439 | 10 |
| 美國 | 6 | 666.8 | 1 |
| 肯亞 | 1 | 310 | 3 |
| 芬蘭 | 2 | 129 | 0 |
| 英國 | 4 | 2,628 | 0 |
| 荷蘭 | 5 | 1,621 | 2 |
| 菲律賓 | 2 | 240 | 1 |
| 葡萄牙 | 3 | 28.9 | 0 |
| 越南 | 11 | 1,454 | 4 |

## 中國大陸 (CHN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Guangdong Yangjiang Shaba (Three Gorges) Offshore wind farm · 1,706 MW · 2021 | GEM | 刪除 | GEM 把三峽陽江沙扒一至五期合成一筆（1,706 MW）；精選資料已逐期列出 | 資料比對 |
| Dabancheng · 2,500 MW · 1989 | 精選 | 刪除 | 整區的概略彙總，標為 2,500 MW、1989 年；GEM 在 80 km 內已逐場列出同地名的 28 座（3,661 MW），各有自己的商轉年 | 資料比對 |
| Yumen Changma · 1,000 MW · 2009 | 精選 | 刪除 | 整區的概略彙總，GEM 在 80 km 內已逐場列出同地名的 23 座（2,679 MW），各有自己的商轉年 | 資料比對 |
| Minqin Hongshagang · 1,300 MW · 2016 | 精選 | 刪除 | 整區的概略彙總，GEM 在 80 km 內已逐場列出同地名的 9 座（1,200 MW），各有自己的商轉年 | 資料比對 |
| Mori wind complex · 2,200 MW · 2022 | 精選 | 刪除 | 整區的概略彙總，GEM 在 80 km 內已逐場列出同地名的 8 座（2,150 MW），各有自己的商轉年 | 資料比對 |
| Togtoh · 1,750 MW · 2022 | 精選 | 刪除 | 整區的概略彙總，GEM 已逐場列出這個送出基地的 3 座（1,750 MW，2024），各有自己的商轉年 | 資料比對 |
| Zhejiang Energy Taizhou Yuhuan 1 · 300 MW · 2021 | 精選 | 修正：名稱、中文名、容量、年份、分期、業主 | 玉環披山島西北的離岸風場是華電玉環1號：北區 154 MW（2021 年 12 月）、南區 75 MW（2024 年 6 月）；浙能台州1號（300 MW，臨海外海）是另一座，GEM 已列出 | [連結](https://www.cpnn.com.cn/news/xny/202406/t20240604_1706589.html) |
| Huadian Yuhuan 2 · 500 MW · 2024 | 精選 | 修正：名稱、中文名、容量、業主 | 開發商是華能（與晶科合作），不是華電；504 MW | [連結](https://m.bjx.com.cn/mnews/20240129/1358593.shtml) |
| Jiangsu Sheyang South H1 (Longyuan) · 400 MW · 2024 | 精選 | 重複（併入「Jiangsu Sheyang Southern Area H5 Offshore wind farm」） | 射陽南區 H1 屬華能（另有紀錄）；龍源的 400 MW 場址是 H5，即 GEM 這筆 | [連結](https://www.gem.wiki/Jiangsu_Sheyang_Southern_Area_H1_Offshore_wind_farm) |

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

## 巴西 (BRA)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Ventos Do Sul wind farm · 150 MW · 2006 | GEM | 重複（併入「Osório」） | Ventos do Sul Energia 就是 Osório 風場（150 MW，75 × 2 MW）的業主，同一座 | [連結](https://en.wikipedia.org/wiki/Os%C3%B3rio_wind_farm) |

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
| Yambuk wind farm · 30 MW · 2010 | GEM | 重複（併入「Portland (PWEP) Wind Energy Project · Yambuk wind farm」） | GEM 重複收錄；Yambuk（30 MW）是 Portland 風電計畫第一期，2007 年商轉 | [連結](https://en.wikipedia.org/wiki/Portland_Wind_Project) |
| Portland (PWEP) Wind Energy Project · Cape Bridgewater wind farm, Cape Nelson South wind farm, Cape Sir William Grant/Cape Nelson North, Codrington wind farm · 167 MW · 2001 | GEM | 修正：名稱、容量、年份、分期 | 扣除另有精選紀錄的 Codrington（18.2 MW，2001）：Cape Bridgewater 58 MW（2008）、Cape Nelson South 44 MW（2009）、Cape Sir William Grant 47 MW（2015） | [連結](https://en.wikipedia.org/wiki/Portland_Wind_Project) |

## 烏拉圭 (URY)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Pampa (Nordex) wind farm · 141.6 MW · 2016 | GEM | 重複（併入「Pampa (Tacuarembó)」） | 同一座風場（UTE 的 Pampa，141.6 MW） | 資料比對 |
| Pampa (Tacuarembó) · 141.6 MW · 2017 | 精選 | 修正：年份 | 2016 年 10 月開始運轉 | [連結](https://es.wikipedia.org/wiki/Parque_e%C3%B3lico_Pampa) |

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
| Criterion · 70 MW · 2011 | WRI GPPD | 重複（併入「Criterion wind farm · 1」） | WRI GPPD 舊資料；GEM 有同一座風場（2023 年除役，正在汰換） | 資料比對 |
| FPL Energy Story Wind LLC · 150 MW · 2009 | WRI GPPD | 重複（併入「Story County」） | Story County 第二期（150 MW，2009）；精選的 Story County（300 MW）已含兩期 | [連結](https://en.wikipedia.org/wiki/Story_County_Wind_Farm) |
| Story County · 300 MW · 2008 | 精選 | 修正：座標、分期 | 補上兩期（2008、2009 年各 150 MW），座標改到 Colo 以北的實際場址 | [連結](https://en.wikipedia.org/wiki/Story_County_Wind_Farm) |
| Prairie Winds SD1 · 162 MW · 2011 | WRI GPPD | 重複（併入「Crow Lake wind farm」） | PrairieWinds SD1 是 Basin Electric 持有 Crow Lake 風場（162 MW，2011）的子公司，同一座 | [連結](https://renewablesnow.com/news/basin-electrics-162-mw-crow-lake-wind-project-starts-operation-in-south-dakota-17914/) |
| Windy Point wind farm (United States) · 136.3 MW · 2009 | GEM | 重複（併入「Windy Point / Windy Flats」） | Windy Point 第一期（136.3 MW，2009）；精選紀錄（400 MW）已含第一期與 Windy Flats | [連結](https://en.wikipedia.org/wiki/Windy_Point/Windy_Flats) |

## 肯亞 (KEN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Lake Turkana · 310 MW · 2017 | WRI GPPD | 重複（併入「Lake Turkana」） | WRI GPPD 舊資料，與精選紀錄是同一座 | 資料比對 |
| Lake Turkana · 310 MW · 2019 | 精選 | 修正：年份 | 2018 年 9 月首次併網、10 月商轉（2019 年 7 月是落成典禮） | [連結](https://en.wikipedia.org/wiki/Lake_Turkana_Wind_Power_Station) |
| Chania Green Wind Project · 50 MW · 2021 | GEM | 修正：狀態、年份 | 尚在開發、未建成（GEM 標為 2021 年營運，沒有出處） | [連結](https://www.power-technology.com/marketdata/power-plant-profile-chania-green-wind-project-kenya/) |
| Kilifi wind farm · 36 MW · 2021 | GEM | 修正：年份 | 2019 年 12 月啟用；Mombasa Cement 的自備電廠，餘電併入國家電網 | [連結](https://en.wikipedia.org/wiki/Mombasa_Cement_Wind_Power_Station) |

## 芬蘭 (FIN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Pohjoinen wind farm · 99 MW · 2020 | GEM | 刪除 | 就是挪威的 Sørfjord 風場（同為 99 MW、2020 年、Fortum 持股、座標相同，挪威那筆已列出），國別被誤植為芬蘭 | 資料比對 |
| Kemi Ajos · 30 MW · 2008 | 精選 | 重複（併入「Ajos Retrofit wind farm」） | 同一場址；GEM 有完整沿革（2008 年的原機組 27 MW 到 2016 年，之後汰換為 43 MW），保留 GEM 的兩筆 | 資料比對 |

## 英國 (GBR)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Westermost Rough A wind farm · 210 MW · 2015 | GEM | 重複（併入「Westermost Rough」） | 同一座風場；GEM 座標在林肯郡外海，偏離約 80 km | [連結](https://en.wikipedia.org/wiki/Westermost_Rough_Wind_Farm) |
| Hornsea wind farm · 1 · 1,218 MW · 2019 | GEM | 重複（併入「Hornsea One」） | 同一座風場 | 資料比對 |
| Dogger Bank wind farm · 1,200 MW · 2023 | GEM | 重複（併入「Dogger Bank A」） | 同一座風場（Dogger Bank A，2023 年 10 月首次發電） | [連結](https://www.equinor.com/news/202310-dogger-bank) |
| Hornsea wind farm · 3, 4 · 5,000 MW | GEM | 刪除 | Hornsea 3 已由 2026 整理清單列為興建中；Hornsea 4 已於 2025 年 5 月由 Ørsted 停止開發 | [連結](https://orsted.com/en/company-announcement-list/2025/05/orsted-to-discontinue-the-hornsea-4-offshore-wind--143901911) |

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

## 菲律賓 (PHL)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Pagudpud wind farm · 160 MW · 2023 | GEM | 重複（併入「Balaoi & Caunayan」） | Bayog Wind Power 是 ACEN 這座 160 MW 風場的專案公司，同一座 | [連結](https://business.inquirer.net/323245/acen-shells-out-p3b-to-partly-fund-phs-biggest-windmill-farm) |
| Pagudpu wind farm · 80 MW · 2023 | GEM | 重複（併入「Balaoi & Caunayan」） | 同一座（GEM 把第一階段 80 MW 另列一筆） | [連結](https://www.gem.wiki/Pagudpu_wind_farm) |
| Bangui Bay · 33 MW · 2005 | 精選 | 修正：容量、分期 | 三期：2005 年 24.75 MW、2008 年 8.25 MW、2014 年 18.9 MW | [連結](https://en.wikipedia.org/wiki/Wind_power_in_the_Philippines) |

## 葡萄牙 (PRT)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Alto Do Talefe wind farm · 14 MW · 2005 | GEM | 重複（併入「Alto do Talefe」） | 同一座風場；實際位於 Cinfães（Montemuro 山），GEM 座標誤放在布拉加 | [連結](https://www.openstreetmap.org/relation/14053337) |
| Chaminé wind farm · 6.9 MW · 2004 | GEM | 重複（併入「Chaminé」） | 同一座風場；GEM 的概略座標是塞圖巴爾市，實際在錫尼什 | [連結](https://www.thewindpower.net/windfarm_en_2570_chamine.php) |
| Felgar wind farm · 8 MW · 2007 | GEM | 重複（併入「Felgar」） | 同一座風場；GEM 的概略座標是布拉干薩市，實際在 Torre de Moncorvo | [連結](https://www.thewindpower.net/windfarm_en_2641_felgar.php) |

## 越南 (VNM)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Tân Phú Đông 2 nearshore wind power plant · 50 MW · 2021 | GEM | 重複（併入「Tan Phu Dong 2 (Tien Giang, GEC)」） | 同一座風場 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Thuận Bắc Trungnam wind farm · 152 MW · 2019 | GEM | 重複（併入「Trung Nam Ninh Thuận」） | 同一座風場（Trung Nam，151.95 MW）；分期移到精選紀錄 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Chu Se wind farm · 700 MW | GEM | 刪除 | 查無此風場：唯一出處是沒有內容的 thewindpower 條目，也不在工貿部的商轉名單 | [連結](https://www.gem.wiki/Chu_Se_wind_farm) |
| Chu Pu wind farm · 200 MW | GEM | 刪除 | 無法證實：只有沒有出處的 thewindpower 條目，不在工貿部的商轉名單 | [連結](https://www.gem.wiki/Chu_Pu_wind_farm) |
| Cư An wind farm · 200 MW | GEM | 修正：名稱、容量、年份 | 應為 Cửu An 風場（嘉萊省安溪，46.2 MW，2021 年商轉）；200 MW 只見於沒有出處的條目 | [連結](https://sdic.vn/nha-may-dien-gio-cuu-an-462mw/) |
| BPP Vĩnh Châu wind farm · 30 MW | GEM | 修正：狀態、年份 | 2021 年動工，商轉日一再延後（預計 2025 年），尚未見商轉公告 | [連結](https://www.banpu.com/news/whyvietnam/) |
| Phuoc wind farm · 27 MW | GEM | 重複（併入「Phuoc Minh Revn wind farm」） | 應是同一座 Phước Minh 風場（27.2 MW，2021） | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Dong Hai 1 Phase 2 (Bac Lieu, Bac Phuong) · 50 MW · 2021 | 精選 | 重複（併入「Dong Hai 1 Offshore wind farm」） | 薄遼的東海1號（兩期各 50 MW）就是 GEM 這筆 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Dong Hai 1 Phase 1 (Tra Vinh, Trungnam) · 100 MW · 2021 | 精選 | 修正：名稱、中文名 | 茶榮的東海1號是獨立的風場，不是薄遼東海1號的一期 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Bến Tre 5 Thạnh Hải Offshore wind farm · 120 MW · 2022 | GEM | 刪除 | 120 MW 是四期（各 30 MW）的全部規劃；只證實一、二期完工，已以精選紀錄列出 | [連結](https://dongkhoi.baovinhlong.vn/tinh-hinh-van-hanh-cac-nha-may-dien-gio-tren-dia-ban-tinh-ben-tre-07092022-a105006.html) |
| Binh Dai 1 Phase 1 (TTC/Gulf, Ben Tre) · 30 MW · 2021 | 精選 | 重複（併入「Bến Tre 10 Bình Đại 1 Offshore wind farm」） | 平大1號的一部分；GEM 這筆含全部三期（128 MW） | [連結](https://www.ptsc.com.vn/en-US/news/ptsc-news-1/operating-news/pps-provides-services-at-binh-dai-wind-power-plant-ben-tre) |
| Binh Dai 1 Phase 2 · 30 MW · 2022 | 精選 | 重複（併入「Bến Tre 10 Bình Đại 1 Offshore wind farm」） | 平大1號的一部分；GEM 這筆含全部三期（128 MW） | [連結](https://www.ptsc.com.vn/en-US/news/ptsc-news-1/operating-news/pps-provides-services-at-binh-dai-wind-power-plant-ben-tre) |
| Tan An 1 Phase 1 (Ca Mau) · 30 MW · 2021 | 精選 | 重複（併入「Tân An 1 offshore wind farm」） | 同一座風場 | [連結](https://moit.gov.vn/tin-tuc/phat-trien-nang-luong/84-du-an-dien-gio-kip-van-hanh-thuong-mai-voi-tong-cong-suat-hon-3.980-mw.html) |
| Tân An 1 offshore wind farm · 115 MW · 2021 | GEM | 修正：容量、分期 | 只有第一期 25 MW 商轉（2021）；後續各期到 2024 年仍未併網 | [連結](https://thanhnien.vn/ca-mau-kiem-tra-phat-hien-thieu-sot-o-2-nha-may-dien-gio-18524042817170935.htm) |
| Hiệp Thành wind farm · 65 MW · 2023 | GEM | 重複（併入「Hiep Thanh (Tra Vinh)」） | 同一座風場（茶榮省沿海的 Hiệp Thạnh；GEM 列為陸域） | 資料比對 |

## 不當成重複的 GEM 專案

| 專案 | 理由 | 出處 |
|---|---|---|
| Guangdong Yangjiang Shaba (Guangdong Energy) Offshore wind farm (CHN) | 粵電陽江沙扒（300 MW，2021 年 12 月全容量併網）與三峽陽江沙扒是不同的風場 | [連結](https://m.bjx.com.cn/mnews/20211206/1191794.shtml) |
| Guangdong Yangjiang Nanpengdao (China Energy Conservation) Offshore wind farm (CHN) | 中節能陽江南鵬島（300 MW，2021 年 11 月全容量併網）與中廣核南鵬島是不同的風場 | [連結](https://wind.in-en.com/html/wind-2412533.shtml) |
| Jiangsu Dongtai Zhugensha H2 Offshore wind farm (CHN) | 竹根沙 H2（302 MW，浙江新能與中海油）與國華東台四期 H2 是不同的風場 | [連結](https://www.nbd.com.cn/articles/2021-11-03/1978454.html) |
