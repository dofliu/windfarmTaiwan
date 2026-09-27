# 離岸風場水下基礎型式

[English](foundations.en.md) ｜ 中文（本頁）

> 由 `tools/build_foundations.py` 依 `tools/farm_foundations.py` 的逐場對照表產生，請勿手動編輯。整理時間：2026-09。

地球儀的「顯示」選單有「離岸：水下基礎」圖層，依基礎型式為離岸風場上色。資料一步一步收集：

1. **北海與東北大西洋（OSPAR 涵蓋範圍）**：已完成（2026-09）。
2. **歐洲其他風場**（波羅的海、地中海、艾瑟爾湖，以及 OSPAR 2024 之後才完工的風場）：已完成（2026-09）。
3. **浮動式風場的細分型式**（全球）：進行中。
4. 台灣、日本、韓國、美國。
5. 中國、越南：前四步完成後再決定。

本頁是前兩步的結果。還沒查到的離岸風場標「型式不詳」，不臆測。

## 來源與方法

- **OSPAR Offshore Renewable Energy Developments 2024**（[ODIMS](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/)，CC0，資料時間 2024-01-01）是唯一逐場列出基礎型式的開放資料。取其中「營運中」的風機紀錄，逐筆比對本站風場的名稱、位置（OSPAR 範圍圖）與容量；`data/global/sources/ospar_offshore_renewables_2024.csv` 是取出的原始值。
- OSPAR 不一定是建成後的樣子：德國的紀錄有 10 筆只寫「單樁／三腳／三樁／套管／重力式／其他」任一種，Merkur、Veja Mate、Trianel Borkum II、alpha ventus 與建成紀錄不符；英國 Hornsea One 西區也不符。所以德國每一座都以德文維基百科（附建造紀錄）為準，其他不符的逐筆附第二來源與說明。
- **第 2 步**：OSPAR 不涵蓋波羅的海與地中海，2024 年以後才完工的風場也只有核准階段的設計（設計可能改變）。這些風場逐座查開發商、施工廠商、產業新聞、政府文件或維基百科，每座都附出處，引用的原文逐筆核對過；OSPAR 有核准階段紀錄的，一律再附施工紀錄（建置時檢查）。
- 下表「來源」欄：OSPAR 紀錄附上它寫的原值；其他連結是第二來源，或沒有 OSPAR 紀錄時的出處。
- 地圖上色依結構歸成四組（多於三種顏色在地圖上分不清）：單樁、鋼構框架（套管、三腳架、三樁）、浮動式、其他固定式（重力式、高樁承台、圍堰式、岩錨式、混合）；風場卡片與本頁寫出確切型式。

## 各國進度（營運中的離岸風場）

合計：已知型式 147／371 座，占容量 38.3%（浮動式風場本來就知道是浮動式，細分型式在第 3 步補）。

| 國家 | 營運中 | 已知型式 | 占容量 | 單樁 | 鋼構框架 | 浮動式 | 其他固定式 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 中國大陸 | 169 | 3 | <1% |  |  | 3 |  |
| 英國 | 44 | 44 | 100% | 33 | 8 | 2 | 1 |
| 德國 | 35 | 35 | 100% | 25 | 5 |  | 5 |
| 荷蘭 | 13 | 13 | 100% | 12 |  |  | 1 |
| 台灣 | 8 | 0 | 0% |  |  |  |  |
| 丹麥 | 17 | 16 | 99% | 8 |  |  | 8 |
| 比利時 | 12 | 12 | 100% | 8 | 3 |  | 1 |
| 法國 | 8 | 8 | 100% | 2 | 1 | 4 | 1 |
| 越南 | 28 | 0 | 0% |  |  |  |  |
| 美國 | 4 | 0 | 0% |  |  |  |  |
| 南韓 | 8 | 1 | <1% |  |  | 1 |  |
| 日本 | 12 | 2 | 1% |  |  | 2 |  |
| 瑞典 | 4 | 4 | 100% | 1 |  |  | 3 |
| 挪威 | 3 | 3 | 100% |  |  | 3 |  |
| 芬蘭 | 1 | 1 | 100% |  |  |  | 1 |
| 義大利 | 1 | 1 | 100% | 1 |  |  |  |
| 西班牙 | 3 | 3 | 100% |  |  | 2 | 1 |
| 葡萄牙 | 1 | 1 | 100% |  |  | 1 |  |

## 逐場清單

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
| TetraSpar Demonstrator (METCentre) | 3.6 | 2021 | 浮動式 | [OSPAR NO018](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「other」 |  |

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
| Fécamp | 497 | 2024 | 重力式 | [OSPAR FR04](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「gravitation」<br>[fr.wikipedia.org](https://fr.wikipedia.org/wiki/Parc_%C3%A9olien_en_mer_de_F%C3%A9camp) | 71 座混凝土重力式基礎（每座約 5,000 噸） |
| Provence Grand Large | 25.0 | 2024 | 浮動式 | [OSPAR FR11](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「other」 |  |
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
| Kentish Flats | 90.0 | 2005 | 單樁 | [OSPAR UK057](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
| Kentish Flats Extension | 49.5 | 2015 | 單樁 | [OSPAR UK056](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/) 「monopile」 |  |
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

### 西班牙

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Elican / Elisa (Gran Canaria) | 5.0 | 2019 | 重力式 | [cordis.europa.eu](https://cordis.europa.eu/project/id/691919) | 重力式基礎配伸縮式塔架，可自行安裝的原型機 |

## 查過但暫不列入的風場

| 風場 | OSPAR | 理由 |
|---|---|---|
| 丹麥 · Frederikshavn | DK03 | 試驗場：丹麥能源署記載 2003 年在海上設 3 部（7.6 MW），港口擴建後兩部已在陸地上、海上只剩 1 部 2.3 MW，但沒寫是哪一部；各機組的基礎不同（其中一部 V90 用吸力桶試驗基礎），OSPAR 寫全為單樁、14 MW 也對不上，先不列 |
