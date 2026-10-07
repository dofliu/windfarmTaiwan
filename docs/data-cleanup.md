# 風場資料清理紀錄

[English](data-cleanup.en.md) ｜ 中文（本頁）

> 由 `tools/build_farms.py` 依 `tools/farm_cleanup.py` 的規則產生，請勿手動編輯。查證時間：2026-09（逐筆查證，理由與來源列於下表）。

合併各來源後，逐場資料仍有重複（同一座風場被兩個來源各收一次、或精選的「整區彙總」與 GEM 的逐場資料並存）、從未建成的案子被標為營運中，以及錯置的座標。這些以明確規則修正：每條規則指定剛好一筆紀錄，上游資料改版後若對不到就讓建置失敗，提醒重新查證。

- 規則 478 條：刪除 160 筆（其中營運中 45,178.8 MW），修正 318 筆。
- 另外，比對名稱時先把繁體字轉成簡體（精選清單用繁體、GEM 用簡體），並比對分區代號（H6、K 區…）與陸域／離岸，讓江蘇、廣東、山東等地重複收錄的離岸風場能自動併成一筆；`GEM_KEEP` 列出名稱相近但確認是不同風場的例外。
- 動作：**重複**＝與另一筆是同一座，刪除並把業主、分期併過去；**刪除**＝從未建成、查無此場或是重複的彙總；**修正**＝改正欄位。

| 國家 | 刪除 | 營運中 MW | 修正 |
|---|---:|---:|---:|
| 中國大陸 | 58 | 26,824.5 | 134 |
| 丹麥 | 1 | 180 | 3 |
| 伊朗 | 2 | 62 | 3 |
| 加拿大 | 1 | 353 | 0 |
| 南非 | 2 | 159 | 2 |
| 南韓 | 4 | 158.3 | 9 |
| 台灣 | 2 | 0 | 21 |
| 哥倫比亞 | 1 | 8 | 3 |
| 土耳其 | 2 | 270 | 1 |
| 埃及 | 2 | 1,082 | 0 |
| 塞內加爾 | 0 | 0 | 2 |
| 多明尼加 | 2 | 50 | 8 |
| 奧蘭 | 0 | 0 | 1 |
| 巴西 | 1 | 150 | 0 |
| 德國 | 1 | 60 | 9 |
| 愛爾蘭 | 0 | 0 | 1 |
| 挪威 | 7 | 1,939 | 10 |
| 摩洛哥 | 3 | 642 | 3 |
| 日本 | 2 | 30 | 12 |
| 比利時 | 1 | 325 | 0 |
| 法國 | 2 | 0 | 5 |
| 波蘭 | 0 | 0 | 1 |
| 泰國 | 1 | 600 | 1 |
| 澳洲 | 4 | 1,161 | 7 |
| 烏拉圭 | 1 | 141.6 | 1 |
| 瑞典 | 0 | 0 | 3 |
| 約旦 | 1 | 117 | 0 |
| 羅馬尼亞 | 16 | 2,439 | 11 |
| 美國 | 7 | 943.6 | 8 |
| 肯亞 | 2 | 410 | 3 |
| 芬蘭 | 1 | 30 | 2 |
| 英國 | 7 | 3,485 | 7 |
| 荷蘭 | 8 | 1,852 | 7 |
| 菲律賓 | 1 | 160 | 1 |
| 葡萄牙 | 1 | 14 | 2 |
| 西班牙 | 1 | 20 | 1 |
| 越南 | 15 | 1,512.8 | 36 |

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
| Huadian Yuhuan 2 · 500 MW · 2024 | 精選 | 修正：名稱、中文名、業主 | 開發商是華能（與晶科合作），不是華電 | [連結](https://m.bjx.com.cn/mnews/20240129/1358593.shtml) |
| Huaneng Yuhuan 2 · 500 MW · 2024 | 精選 | 修正：容量、狀態、年份、機組 | 華能玉環 2 號核准變更後為 508 MW、31 部（25 部 16 MW＋6 部 18 MW；環評報告書報批稿，中國風能協會 2025-04 同）；原寫 504 MW（2023 年原核准的 36 部 14 MW）與「8–10 MW 級」。2025 年 4 月才完成陸上工頻系統倒送電（「向併網發電邁出關鍵一步」），GEM 2026-02 仍列興建中，查無全容量併網報導，所以「2024 年營運中」不對，改為興建中、年份未定 | [連結](https://www.cweea.com.cn/xwdt/html/40264.html) |
| Jiangsu Sheyang South H1 (Longyuan) · 400 MW · 2024 | 精選 | 重複（併入「Jiangsu Sheyang Southern Area H5 Offshore wind farm」） | 射陽南區 H1 屬華能（另有紀錄）；龍源的 400 MW 場址是 H5，即 GEM 這筆 | [連結](https://www.gem.wiki/Jiangsu_Sheyang_Southern_Area_H1_Offshore_wind_farm) |
| Shanghai Donghai Bridge Offshore wind farm · 1 · 102 MW · 2009 | GEM | 重複（併入「Donghai Bridge」） | 同一座風場：GEM 的中文名就是「東海大橋海上風電項目一期 102.2MW」（34 部 3 MW，上海市政府：2010 年 6 月 8 日全部風機併網）；GEM 座標偏北約 110 km | [連結](https://www.shanghai.gov.cn/nw5827/20200905/0001-5827_667816.html) |
| CTG Yangjiang Qingzhou 6 · 500 MW · 2024 | 精選 | 修正：容量、座標 | 青洲六為 1,000 MW、74 部，2024 年 12 月 27 日全容量併網（補貼公示；原本寫 500 MW）；座標改用 GEM 的精確位置 | [連結](https://finance.sina.com.cn/roll/2025-12-19/doc-inhcipui7654969.shtml) |
| Guangdong Yangjiang Qingzhou VI Offshore wind farm · 1,000 MW | GEM | 重複（併入「CTG Yangjiang Qingzhou 6」） | 同一座風場（三峽陽江青洲六，1,000 MW）；GEM 2026-02 版仍列興建中，補貼公示寫 2024 年 12 月 27 日全容量併網 | [連結](https://finance.sina.com.cn/roll/2025-12-19/doc-inhcipui7654969.shtml) |
| Longyuan Jiangsu Xiangshui · 202 MW · 2016 | 精選 | 修正：名稱、中文名、業主 | 響水近海風電（202 MW，2016 年 10 月 17 日全數併網）是三峽集團的第一座離岸風場，不是龍源 | [連結](http://newenergy.giec.cas.cn/fn/cydt/201804/t20180426_736984.html) |
| Fuqing Xinghua Bay Phase 2 · 300 MW · 2020 | 精選 | 修正：容量、年份 | 二期為 280 MW、45 部（2021 年安裝，全為國產機組，含國內首部 10 MW 示範機），2021 年全容量併網（原本寫 300 MW、2020 年） | [連結](https://gxt.fujian.gov.cn/zwgk/xw/jxyw/202412/t20241211_6590606.htm) |
| CGN Yangjiang Qingzhou 1&2 · 1,000 MW · 2024 | 精選 | 修正：名稱、中文名、業主 | 青洲一、二是廣東能源集團（粵電）的風場，不是中廣核：青洲一 400 MW（37 部）＋青洲二 600 MW（55 部）共 92 部 11 MW，2023 年 12 月 12 日全容量併網 | [連結](https://cpnn.com.cn/news/hy/202312/t20231212_1659356.html) |
| Hainan CZ2 Demonstration Offshore wind farm · 600 MW · 2025 | GEM | 重複（併入「Shenergy Hainan CZ2 (Dongfang)」） | 同一座風場（申能海南 CZ2 示範風場，67 部 9 MW） | [連結](https://finance.sina.com.cn/jjxw/2024-05-26/doc-inawpazx5145233.shtml) |
| Hainan Danzhou CZ3 (Datang) Offshore wind farm · 600 MW · 2025 | GEM | 重複（併入「Datang Danzhou CZ3」） | GEM 大唐儋州 120 萬瓩案的第 1 期（一場址 60 萬瓩，2025 年營運）；與精選紀錄（一場址）同一座。第 2 期（二場址）是另一筆「· 2」 | [連結](https://www.gem.wiki/Hainan_Danzhou_CZ3_(Datang)_Offshore_wind_farm) |
| Hainan CZ3 Demonstration Offshore wind farm · 600 MW · 2025 | GEM | 重複（併入「Datang Danzhou CZ3」） | GEM 把同一案又收了一次（大唐 CZ3 海上風場示範項目）；這筆是它的第 1 期，即一場址 60 萬瓩 | [連結](https://www.gem.wiki/Hainan_CZ3_Demonstration_Offshore_wind_farm) |
| Huarun Cangnan 1 / CR Power · 400 MW · 2023 | 精選 | 修正：年份 | 2022 年 12 月 28 日全容量併網（原寫 2023）；49 部 6.25／10 MW 機組 | [連結](https://www.cpem.org.cn/list68/64746.html) |
| Zhejiang Energy Cangnan 1 · 400 MW · 2022 | 精選 | 重複（併入「Huarun Cangnan 1 / CR Power」） | 蒼南 1 號是華潤電力的風場（浙能沒有蒼南 1 號），與「華潤電力蒼南1號」重複 | [連結](https://www.cpem.org.cn/list68/64746.html) |
| Shandong Bozhong (Yankuang GroupOffshore) wind farm · 500 MW · 2022 | GEM | 重複（併入「Shandong Energy Bozhong A」） | 同一座風場（山東能源渤中 A 場址：501 MW、60 部 8.35 MW，2022 年） | [連結](https://sdb.nea.gov.cn/dtyw/hyxx/202309/t20230919_112577.html) |
| Shandong Energy Bozhong G · 850 MW · 2024 | 精選 | 修正：容量、年份、中文名 | 一期 400.4 MW（35 部 10 MW＋4 部 12.6 MW）2025 年 5 月 31 日全容量併網；原寫 850 MW、2024 年 | [連結](https://news.iqilu.com/shandong/yuanchuang/2025/0531/5817656.shtml) |
| Shandong Bozhong G Offshore wind farm · 400 MW · 2025 | GEM | 重複（併入「Shandong Energy Bozhong G」） | 同一案的一期（GEM 記為 400 MW、2025） | [連結](https://news.iqilu.com/shandong/yuanchuang/2025/0531/5817656.shtml) |
| CGN Huizhou Gangkou I · 400 MW · 2022 | 精選 | 修正：名稱、中文名、容量、年份、分期 | 港口風場分兩期共 100 萬瓩、104 部：一期 25 萬瓩 2021 年 12 月 28 日全容量併網，二期 75 萬瓩 2023 年 12 月 12 日投產（新華社）；原只寫 400 MW | [連結](http://www.news.cn/fortune/2023-12/13/c_1130023531.htm) |
| CTG Yangjiang Qingzhou 5 · 500 MW · 2024 | 精選 | 修正：容量、狀態、年份 | 青洲五是 1,000 MW（原寫 500）、2021 年 11 月開工、預計 2026 年 12 月投產（陽江市 2025 年重點建設項目）；青洲五、七共 163 部、2,000 MW，2026 年 9 月 27 日才首批 5 部併網（陽江市政府），改為興建中 | [連結](https://www.yangjiang.gov.cn/yj/ywdt/bmzx/content/post_984170.html) |
| CTG Yangjiang Qingzhou 7 · 1,000 MW · 2025 | 精選 | 修正：狀態、年份 | 青洲七 1,000 MW，2021 年 11 月開工、預計 2026 年 12 月投產；與青洲五共 163 部，2026 年 9 月 27 日首批 5 部併網，改為興建中（原寫 2025 年營運） | [連結](https://www.yangjiang.gov.cn/yj/ywdt/bmzx/content/post_984170.html) |
| Guangdong Yangjiang Qingzhou V Offshore wind farm · 1,000 MW | GEM | 重複（併入「CTG Yangjiang Qingzhou 5」） | 同一座風場（三峽陽江青洲五，1,000 MW） | [連結](https://www.gdshe.org/article/24026.html) |
| Guangdong Yangjiang Qingzhou VII Offshore wind farm · 1,000 MW | GEM | 重複（併入「CTG Yangjiang Qingzhou 7」） | 同一座風場（三峽陽江青洲七，1,000 MW） | [連結](https://www.gdshe.org/article/24026.html) |
| CGN Fanshi I · 1,000 MW · 2025 | 精選 | 修正：年份 | 中廣核帆石一、二共 200 萬瓩、131 部，2026 年 9 月 24 日全容量投運（中新網）；原寫 2025 年 | [連結](https://www.chinanews.com.cn/cj/2026/09-24/10703009.shtml) |
| Guangdong Energy Fanshi II / Yangjiang · 1,000 MW · 2025 | 精選 | 修正：名稱、中文名、業主、年份、機組 | 帆石二是中廣核的風場，不是粵電；建成 33 部 18 MW＋25 部 16.2 MW（國資委轉中國能建，2026-06；陽江市 2025 年重點項目清單寫的 63 部 16 MW 是早期規劃），與帆石一同於 2026 年 9 月 24 日全容量投運（原寫 2025 年） | [連結](https://www.chinanews.com.cn/cj/2026/09-24/10703009.shtml) |
| Shandong Huaneng Offshore L Area wind farm · 504 MW | GEM | 修正：狀態、年份 | 華能半島北 L 場址（504 MW、42 部 12 MW）2026 年 4 月 7 日全容量併網（國資委）；GEM 2026-02 版仍列興建中 | [連結](http://wap.sasac.gov.cn/n2588025/n2588124/c35402269/content.html) |
| Shandong Energy Bohai / Peninsula North N2 / L · 1,000 MW · 2025 | 精選 | 刪除 | 三案合併的彙總：半島北 L（華能，504 MW，2026 年 4 月併網）與半島北 N2（上海電氣，900 MW，興建中）已各有 GEM 紀錄，山東能源渤海即渤中 G 一期（已有精選紀錄） | [連結](http://wap.sasac.gov.cn/n2588025/n2588124/c35402269/content.html) |
| Huaneng Peninsula North BW · 500 MW · 2024 | 精選 | 修正：容量 | 華能半島北 BW 是 510 MW（60 部 8.5 MW；原寫 500） | [連結](http://www.cpem.org.cn/list99/56313.html) |
| Shandong Bandaobei BW Offshore wind farm · 510 MW · 2024 | GEM | 重複（併入「Huaneng Peninsula North BW」） | 同一座風場（華能山東半島北 BW，510 MW，2024 年） | [連結](http://www.cpem.org.cn/list99/56313.html) |
| Guodian Xiangshan 1 Phase 2 · 500 MW · 2025 | 精選 | 重複（併入「Zhejiang Xiangshan 1 Offshore wind farm」） | 國電象山 1 號二期（504 MW、56 部 9 MW，2024 年 1 月主體完工）；GEM 的象山 1 號一筆已含一期 254 MW 與二期 504 MW 兩期 | [連結](http://mm.chinapower.com.cn/flfd/hsfd/20240102/230553.html) |
| CR Power Cangnan 2 / Wenzhou · 500 MW · 2024 | 精選 | 重複（併入「Zhejiang Cangnan 2 Offshore wind farm」） | 蒼南 2 號是華能的風場（36 部 8.5 MW、300 MW），不是華潤；這筆 500 MW 是蒼南 2 號與「溫州洞頭」等合併的彙總，GEM 已有蒼南 2 號本身的紀錄 | [連結](https://new.qq.com/rain/a/20230419A060DE00) |
| Guangxi Qinzhou / Fangchenggang B · 500 MW · 2025 | 精選 | 重複（併入「Guangxi Fangchenggang A」） | 廣西目前建成的只有防城港示範項目 A 場址（700 MW、83 部，2025 年 2 月 7 日全容量投產）；這筆「欽州／防城港 B」500 MW 是規劃場址，與 A 場址重複 | [連結](http://www.gx.xinhua.org/20250208/489586cf99ff4ed8908866faa90a118f/c.html) |
| Zhuanghe V / Liaoning 2025 · 500 MW · 2025 | 精選 | 修正：名稱、中文名、容量、業主 | 莊河場址 V 是 250 MW（24 部 9 MW＋4 部 8.5 MW，招商局太平灣與三峽能源），2025 年 4 月主體完工；原寫 500 MW、名稱混入「遼寧 2025」 | [連結](https://finance.sina.com.cn/jjxw/2025-04-13/doc-inesycqi0944554.shtml) |
| Jiangsu Sheyang Southern Area H5 Offshore wind farm · 400 MW · 2024 | GEM | 修正：狀態、年份 | 龍源射陽 100 萬瓩案一期（H4、H5，35 部 8.5 MW、297.5 MW）2026 年 4 月 30 日才開始製作單樁，仍在興建；GEM 列為 2024 年營運 | [連結](https://hykzsxny.jstec.com.cn/news/202612828050571160) |
| Huaneng Zhuanghe IV1 · 250 MW · 2021 | 精選 | 重複（併入「Liaoning Dalian Zhuanghe 4 Area I Offshore wind farm」） | 同一座風場（華能莊河 Ⅳ1，350 MW、51 部，2021 年 12 月 29 日全容量併網）；GEM 的容量正確 | [連結](https://www.chinanews.com/ny/2021/12-29/9640309.shtml) |
| Zhejiang Putuo 6 Offshore wind farm · 252 MW · 2019 | GEM | 重複（併入「Guodian Zhoushan Putuo 6#2」） | 同一座風場（國電電力舟山普陀 6 號 2 區，252 MW、63 部西門子 4 MW，2019 年） | [連結](https://www.ceic.com/gjnyjtww/chnyxfc/202006/e5a14799afc44f2a890f4e1784673ac0.shtml) |
| Shanghai Lingang Demonstration Phase 1 · 102 MW · 2016 | 精選 | 修正：年份、機組 | 臨港一期示範 25 部 4 MW（上海電氣 W4000）2018 年 5 月開工、2019 年完工，晚於二期；原寫 2016 年、3.6 MW 機組 | [連結](https://www.fegroup.com.cn/ydkg/xwzx79/gsxw10/577818/index.html) |
| Guangdong Energy Zhanjiang Xuwen · 300 MW · 2021 | 精選 | 重複（併入「Guangdong Zhanjiang Xuwen Offshore wind farm」） | 湛江徐聞 600 MW（南、北兩個標段各 47 台，94 台 2021 年 11 月 26 日全部併網）是國家電投的風場，這筆「粵電徐聞 300 MW」只是其中一半；GEM 的徐聞一筆已含 600 MW 原場與 300 MW 增容 | [連結](https://m.gdzjdaily.com.cn/p/2816813.html) |
| Shandong Changyi Laizhouwan Offshore wind farm · 300 MW · 2022 | GEM | 重複（併入「CTG Changyi」） | 同一座風場（三峽昌邑萊州灣一期／海洋牧場融合示範，300 MW、50 部 6 MW，2022 年） | [連結](http://www.sasac.gov.cn/n2588025/n2588124/c26784560/content.html) |
| Shandong Peninsula South U Site Offshore Wind Project · 1,503.5 MW · 2023 | GEM | 重複（併入「CGN Peninsula South U1」） | GEM這筆（中文名「國家電投…U場址一期」）把國家電投U1（900 MW，106×8.5 MW，2024-10-26全容量投運）與國能國華U2（603.5 MW）加總成1503.5 MW；U1已有精選紀錄「CGN Peninsula South U1」（同筆另修正業主、容量、年份），U2另有GEM紀錄「Shandong Bandaonan U2 (Guohua) Offshore wind farm」，故本筆為重複（騰訊／經濟導報2024-10-28、海報新聞2023-11）。 | [連結](https://news.qq.com/rain/a/20241028A054SE00) |
| Shandong Guohua Kenli Offshore wind farm · 1,000 MW · 2025 | GEM | 刪除 | 國華投資山東墾利100萬kW項目是海上光伏（東營離岸8 km、2934座光伏平台、2024-11首批併網），不是風場（中國中鐵2025-02-11）；查無同名海上風電。 | [連結](https://www.crecg.com/web/xwzx61/gsyw87/2025021110071850533/index.html) |
| Guoneng Peninsula South U2 / Laizhou · 500 MW · 2024 | 精選 | 重複（併入「Shandong Bandaonan U2 (Guohua) Offshore wind farm」） | 國華投資半島南U2場址位於威海乳山市海域（非萊州），603.5 MW、71台遠景EN226-8.5 MW分兩期（36＋35台），2023-07首台吊裝（山東省能源局2023-08-07）；資料庫已有 GEM 筆「Shandong Bandaonan U2 (Guohua) Offshore wind farm」（603.5 MW，座標36.571,121.745 正確），本筆容量500 MW、座標在萊州灣均錯，屬重複。 | [連結](http://nyj.shandong.gov.cn/art/2023/8/7/art_59966_10299976.html) |
| Shandong Bandaonan 4 Offshore wind farm · 302 MW · 2021 | GEM | 重複（併入「Huaneng Peninsula South 4」） | GEM 的「山东半岛南 4 号海上风电项目」（302 MW、2021、華能山東發電）與精選的「Huaneng Peninsula South 4」（301.6 MW、2021）是同一座：華能山東半島南4號 301.6 MW、58×5.2 MW，2021-12-10 全容量併網（世紀新能源網 2021-04-06；水母網 2021-12-28）。刪 GEM 筆，保留精選筆。 | [連結](https://m.ne21.com/news/show-159357.html) |
| Jiangsu Dafeng H11 (Three Gorges) Offshore wind farm · 300 MW · 2019 | GEM | 重複（併入「CTG Jiangsu Dafeng 300 MW」） | 「三峽大豐H11」就是三峽新能源江蘇大豐 300 MW 項目：採購公告寫明「三峡大丰海上风电场（H11项目）位于大丰市东沙沙洲北侧的小北槽-太平沙海域」（中國污水處理工程網轉三峽運維公告 2025-02-13），金風科技業績表亦列「三峡江苏大丰H11#30万千瓦项目 300 建成」（中國電機工程學會 2019-11）；該項目 2019-10-31 全部機組併網（CWEEA 2019-11-15）。與精選筆「CTG Jiangsu Dafeng 300 MW」為同一座，刪 GEM 筆。 | [連結](https://www.dowater.com/zhaobiao/2025-02-13/7570794.asp) |
| Guohua Dongtai V (H5) · 200 MW · 2021 | 精選 | 重複（併入「Jiangsu Dongtai Zhugensha H1 Offshore wind farm」） | 新華網江蘇 2021-11-21：國華投資江蘇東台項目由東台四期（北條子泥海域）與東台五期（竹根沙海域）組成，東台五期 20 萬千瓦、50 台風機，2021-11-20 全容量併網；南通泰勝藍島 2021-05 稱國華竹根沙H1# 為 50 台 4.0 MW、200 MW。兩筆是同一座風場，刪此筆、保留 GEM 的竹根沙H1#紀錄。 | [連結](http://js.news.cn/2021-11/21/c_1128085511.htm) |
| Guodian Rudong H1 · 200 MW · 2021 | 精選 | 刪除 | 如東 11 座海上風電場為國信H2、海裝H3及H3-2、國電投H4／H7、蘇交控H5、三峽H6／H10、中廣核H8、協鑫H13／H15（新華日報 2021-11-29），加上 2020 年投運的魯能H14；2018 年核准清單（浙商證券整理）中如東亦無 H1# 場址。查無「國電投／國能如東H1」，此精選占位紀錄（無業主、無中文來源）應刪除。 | [連結](https://www.163.com/dy/article/GQ0GC2VI05345ASA.html) |
| Jiangsu Rudong H1-2 (Xiexin) Offshore wind farm · 200 MW · 2024 | GEM | 重複（併入「Zhongtian Rudong H15」） | 江蘇省發改委 2018-11-30 核准「協鑫如東H1-2#海上風電場項目」（蘇發改能源發(2018)1181號）；浙商證券整理 2018 年核准清單寫「協鑫如東200MW海上風電項目（2018.12.16 獲核准）」，而協鑫同批另核准 H13# 為 150 MW。協鑫在如東建成的只有 H13（150 MW）與 H15（200 MW，2021-11-29 全容量併網），H1-2# 即 H15 的核准名稱，此筆（200 MW、2024 年）為重複。 | [連結](https://fzggw.jiangsu.gov.cn/art/2018/11/30/art_59371_372.html) |
| Jiangsu Dafeng H10 (Three Gorges) Offshore wind farm · 155 MW · 2021 | GEM | 重複（併入「Guoxin Dafeng 850 MW」） | 新浪財經 2025-03-13（國信集團稿）：江蘇國信大豐 85 萬千瓦項目包含大豐H1#、H2#、H10#、H16#，100 台 8.5 MW，2025 年全容量併網；大豐港務 2025-03 載三峽在大豐 2021 年建成的是 H8-2。查無「三峽大豐H10」155 MW／2021，大豐唯一的 H10# 場址屬國信（150 MW），已含在精選紀錄「Guoxin Dafeng 850 MW」，此筆刪除。 | [連結](https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml) |
| Guangdong Huilai Shibeishan Offshore wind farm · 100 MW · 2007 | GEM | 重複（併入「Guangdong Huilai Shibeishan wind farm」） | CPEM 2025-07-01（三一重能稿）：石碑山風電場為國家首批特許權項目，原裝機 100.2 MW、167 台 0.6 MW，2007 年 4 月全容量投運，「上大壓小」後機位由 167 個縮減至 15 個、釋放土地空間約 5 萬平方米——是陸上風場。資料庫已有陸上紀錄「Guangdong Huilai Shibeishan wind farm」（100 MW），此筆誤標離岸，刪除。 | [連結](https://www.cpem.org.cn/list123/109502.html) |
| Shangdong Dongying Dongfang offshore wind farm · 26 MW · 2025 | GEM | 刪除 | 東方電氣 26 MW 樣機 2025-08-29 吊裝於「東營風電裝備測試認證創新基地」（東方風電官網）。該基地是臨海滩涂上的陸上測試場：山東新聞聯播／搜狐 2026-09 說明過去企業須「自行到海上建設測試機位」，而此基地建於東營經開區土地上，單機位基礎混凝土 3500 m3 約為陸上風電基礎三倍；中國能建稱其為「專用臨海風電測試基地」，總裝機 240 MW。單機測試機位不在海上，不是離岸風場，刪除。 | [連結](https://dew.dongfang.com/info/1240/2190.htm) |
| Guangdong Coastal Test Site Single Offshore wind farm · 18 MW · 2024 | GEM | 刪除 | 「廣東省風電臨海試驗基地」是南方電網在汕頭濠江區岸上建的風機並網測試機位（央視網 2025-01-06：利用濠江區海峽狹管效應，試驗成本僅為海上的 1/3；1、2 號機位 2022 年底投入運行，3、4 號機位 2025 年初建成），東方電氣 18 MW 樣機只是在此做認證測試，不是海上風場。 | [連結](https://local.cctv.com/2025/01/06/ARTIzJUvELxU9Wo0PNcKiFUJ250106.shtml) |
| Datang Pingtan Waihai · 300 MW · 2021 | 精選 | 重複（併入「Fujian Pingtan Changjiang'Ao Offshore wind farm」） | 大唐在平潭唯一的海上風場是長江澳（一期 15 台約 185 MW，2024 年投產；二期 110 MW、11 台 10 MW 於 2024-12-25 全容量投產，世紀新能源網 2025-01-02），合計約 295 MW，與本筆 300 MW 相符，資料庫已另有「Fujian Pingtan Changjiang'Ao Offshore wind farm」（295 MW），本筆為重複；「平潭外海」之名實為三峽 111 MW 專案（2023-09 全容量，國資委）。 | [連結](https://www.ne21.com/news/show-206639.html) |
| Ningde Xiapu / Xiapu A · 300 MW · 2021 | 精選 | 重複（併入「Fujian Ningde Xiapu Offshore wind farm · B」） | 查無寧德霞浦海上風電 2021 年建成之紀錄：霞浦 A 區（200 MW）僅列規劃，B 區（300 MW）2023 年底由省發改委批准核准延期、2024 年才 EPC 開標（世紀新能源網 2023-12、2024-08），資料庫已有 A、B 區的規劃中紀錄，本筆 300 MW／2021 營運中為錯誤重複。 | [連結](https://www.ne21.com/news/show-185714.html) |
| CGN Taizhou 1 · 300 MW · 2022 | 精選 | 重複（併入「Zhejiang Taizhou 1 Offshore wind farm」） | 台州 1 號海上風電場為浙能專案（CPEM 轉中鐵大橋局 2023-09：浙能台州 1 號海上風電場位於臨海市雀兒岙島北側，40 台 7.5 MW、300 MW，2023-09-19 最後一台風機安裝完成、年底併網），查無中廣核在台州的營運中風場，本筆（Mingyang 6.45／2022）為「Zhejiang Taizhou 1 Offshore wind farm」之重複。 | [連結](https://www.cpem.org.cn/list68/82617.html) |
| Guoxin Sheyang H1 · 300 MW · 2021 | 精選 | 重複（併入「Huaneng Sheyang H1 / Yancheng」） | 射陽海上南區H1#30萬千瓦為華能項目（射陽縣第一個海上風電項目，67台2020-11吊裝完成，中國縣域經濟報百家號2020-11-05）；江蘇國信在射陽的海上風電是2026年才成立項目公司、尚未開工的射陽北區H1#75萬千瓦，與本筆（300MW、2021、33.8N 120.75E）不符。本筆與「Huaneng Sheyang H1 / Yancheng」同場址、同容量、同年份，判為重複。 | [連結](https://baijiahao.baidu.com/s?id=1682496439824355289&wfr=spider&for=pc) |
| Shandong Bandaonan V Offshore wind farm · 500 MW · 2022 | GEM | 重複（併入「SPIC Peninsula South V」） | 同一座風場（國家電投山東半島南 V 場址，500 MW、70 部 7 MW＋1 部 10 MW，2022 年 12 月 9 日全容量併網）；精選那筆同時更正容量與年份 | [連結](http://nyj.shandong.gov.cn/art/2023/2/15/art_253733_10296175.html) |
| SPIC Jieyang Shenquan II · 502 MW · 2022 | 精選 | 修正：機組、年份 | 揭陽市政府2022-12-28：神泉二總裝機502 MW，安裝34台11 MW＋16台8 MW共50台，2022-12-28全容量併網投產；資料庫50座正確，年份2022正確，機型欄改為實際組合。 | [連結](http://www.jieyang.gov.cn/xwdt/jyxw/content/post_734301.html) |
| Huadian Yangjiang Qingzhou 3 · 500.6 MW · 2022 | 精選 | 修正：年份 | 陽江市生態環境局驗收公示（2023-07-12）：500 MW、37台6.8 MW＋30台8.3 MW，2020-11-02開工、2021年12月全部67台風機併網完成；年份應為2021，非2022。 | [連結](https://www.yangjiang.gov.cn/yj/zwgk/zdlyxxgk/hjbh/jsxmjghbysxx/content/post_719318.html) |
| Guoneng Bozhong B1 / Bozhong B · 500 MW · 2022 | 精選 | 修正：名稱、中文名、業主、機組、容量、年份 | 渤中B場址是山東能源電力集團項目，非國能：47台上海電氣EW8.5-230，2022-09-08首吊、2022-12-30全容量併網，與A場址（60台海裝8.35 MW）合計90萬kW（國務院國資委2023-03-22）；國能／國華的渤中項目是另一筆「Shandong Bozhong B2」（59×8.5 MW，2023）。機型與業主改正，容量按47×8.5＝399.5 MW。 | [連結](http://www.sasac.gov.cn/n2588025/n2588129/c27500182/content.html) |
| Mingyang Yangjiang Qingzhou 4 · 500 MW · 2023 | 精選 | 修正：年份、機組 | 龍船風電網（搜狐轉載）2024-02-01：明陽陽江青洲四500 MW，44台固定式機組（25台MySE11-230＋19台MySE12-242），水深45–47 m，2024-02-01全容量併網；年份改2024、機型改正，浮式「明陽天成號」另有紀錄「Mingyang OceanX (Tiancheng) floating」。 | [連結](https://www.sohu.com/a/755731064_121194771) |
| CGN Peninsula South U1 · 500 MW · 2024 | 精選 | 修正：名稱、中文名、業主、容量、年份、機組 | 半島南U1為國家電投山東能源投資建設（非中廣核），90萬kW、106台8.5 MW分兩期：一期450 MW 2023-11-17投運、二期450 MW 2024-10-26全容量併網（中國電器工業協會2024-10-31、騰訊／IT之家2024-10-27）；位於乳山市南側海域。 | [連結](https://www.ceeia.com/XWZX/d/202410/1e56e39e98c44482a46066bc95bcdb07.html) |
| Changle Waihai C · 498 MW · 2021 | 精選 | 修正：容量、機組 | 疑點不成立：長樂外海C區由福建能源石化集團權屬福能海峽發電有限公司投資建設（福建日報／福州新聞網2026-07-03、福建省政府2026-01-29），資料庫業主「海峽發電49%＋福能」即此合資公司，非三峽；總裝機496 MW、57台（含20台東方10 MW，世紀新能源網2021-10-25），2020年底開工、一年後57台全容量併網，年份2021正確；容量改496、機型改正。 | [連結](https://news.fznews.com.cn/changle/20260703/4409ZM6r4S.shtml) |
| CTG Yangjiang Shapa Phase 3 · 400 MW · 2021 | 精選 | 修正：機組 | 三峽陽江沙扒三期400 MW於2021年底前建成併網、單機容量約6.45 MW（CPEM轉載研報）；浮式「三峽引領號」5.5 MW已另有紀錄「Yangjiang Shapa 'Sanxia Yinling' floating」（type 2），機型欄不應再含該浮式機組，刪去。 | [連結](https://www.cpem.org.cn/list99/51783.html) |
| SPIC Jieyang Shenquan I · 400 MW · 2021 | 精選 | 修正：機組、容量、年份、分期 | 神泉一400 MW分兩期：一期315 MW（16台7 MW＋37台5.5 MW）2021年底併網，二期91 MW（13台上海電氣7 MW）2022-04首樁、2023年4月全容量併網（世紀新能源網2022-01、2022-04-28、2024-01）；機型「上海電氣8 MW級」錯誤，全場併網年份為2023。 | [連結](https://www.ne21.com/news/show-166728.html) |
| Huaneng Cangnan 4 · 400 MW · 2023 | 精選 | 修正：年份 | 蒼南新聞網2022-09-06：華能蒼南4號海上風電（77台機組）建成投產，為全省迎峰度夏提供電源支撐；年份應為2022，非2023。 | [連結](https://www.cnxw.com.cn/system/2022/09/06/014531534.shtml) |
| Huaneng Zhanjiang Xuwen East · 400 MW · 2024 | 精選 | 修正：名稱、中文名、容量、年份、狀態、業主、機組 | 查無「華能」徐聞東風場；業主欄的明陽／巴斯夫對應的是「明陽巴斯夫湛江徐聞東三海上風電示範項目」：500 MW、核准方案 50×10 MW（湛江市政府 2024-05；CPEM 轉湛江發改 2024-12-20），2024-12-18 才開工動員，官方預計 2025 年底併網；2025-04 風機招標已改為 30×16.7 MW（新浪財經轉中國能建公告）。至今未查得併網報導，改為興建中、年份未定。 | [連結](https://www.cpem.org.cn/list68/103205.html) |
| Zhejiang Shengsi 2 Offshore wind farm · 400 MW · 2021 | GEM | 修正：業主、機組、容量 | 浙能嵊泗2號：核准 67×6.25 MW，實際建成 63 台、399.95 MW，2021-11-29 最後一台 88 號風機併網達全容量（中新網轉載於新浪科技 2021-11-29；浙江在線 2021-11-16）；報導寫明是「浙能集團」的重點工程，業主欄的國家電投浙江新能源不符。容量 400 MW 與年份 2021 正確。 | [連結](https://finance.sina.com.cn/tech/2021-11-29/doc-ikyakumx0940273.shtml) |
| Putian Pinghai Bay Phase 3 · 308 MW · 2021 | 精選 | 修正：年份、業主 | 三期為 308 MW（中閩能源 2024-06-08 公告：一、二、三期合計 604 MW，其中三期 308 MW），資料庫容量正確、312 MW 之疑點不成立；疑點的「2022 年 2 月全容量」其實是二期全部機組投產時間。三期由閩投海電（福建省投資開發集團控股子公司）投資營運，2019–2022 年陸續達到預定可使用狀態，2023 年已全部投產，故年份改 2022；業主欄的海峽發電／福能不符。 | [連結](https://epaper.stcn.com/pic/202406/08/67a30a8e71359fb86d66138561bf8a4e.pdf) |
| Tangshan Laoting Yuetuo Island Phase 1 · 304 MW · 2022 | 精選 | 修正：狀態、年份、機組 | 疑點屬實：資料庫寫 2022 年營運、Sewind/Envision 6–8 MW，但 2024-09 才招標設計與升壓站（30×10 MW＋1×4 MW、304 MW，計畫 2025-12-30 全容量併網，電力招標網），2025-01 才招標風機基礎與安裝（計畫 2025-02-15 首樁沉樁，中國低碳網轉國能 e 招），2025-08 業界進度梳理仍寫「因海事原因改機位，進度緩慢」（新浪財經 2025-08-26）。至今未查得併網報導，改為興建中、年份未定；業主國電申能唐山新能源正確。 | [連結](http://www.dlztb.com/news/202409/24/9839.html) |
| Shandong Laizhou Offshore Wind Farm And Acquaculture Integrated Project · 303 MW · 2022 | GEM | 修正：容量、業主、機組 | 中廣核萊州 304 MW、38×8 MW，由中廣核新能源與山東誠源集團共同投資（山東省能源局 2022-12-21 轉大眾日報）；2022-12-24 全場 38 台併網達全容量（中天科技 2022-12-27），年份 2022 正確。容量 303→304，業主補為中廣核新能源與山東誠源。 | [連結](http://nyj.shandong.gov.cn/art/2022/12/21/art_253733_10295458.html) |
| Huaneng Peninsula South 4 · 301.6 MW · 2021 | 精選 | 修正：業主、機組 | 與 GEM「Shandong Bandaonan 4 Offshore wind farm」重複，保留本筆並補業主（華能山東發電，GEM 紀錄）與風機：301.6 MW、58×5.2 MW（世紀新能源網 2021-04-06），2021-12-10 全容量併網（水母網 2021-12-28）。 | [連結](https://m.ne21.com/news/show-159357.html) |
| SPIC Peninsula South 3 · 301.5 MW · 2021 | 精選 | 修正：業主、容量、機組 | 國家電投山東半島南3號由國家電投山東能源發展有限公司投資開發建設，301.6 MW、58×5.2 MW，2021-12-16 全容量併網（央廣網 2024-01-01；水母網 2021-12-28）。補業主，容量 301.5→301.6，風機改 58×5.2 MW。 | [連結](https://www.cnr.cn/sd/tysd/20240101/t20240101_526543670.shtml) |
| Fujian Pingtan Changjiang'Ao Offshore wind farm · 295 MW · 2024 | GEM | 修正：容量、機組、業主、中文名 | 疑點屬實：大唐平潭長江澳（顯美風電場）總裝機 185 MW，15 台 5 MW＋11 台 10 MW，建設單位福建平潭大唐海上風電有限責任公司，已全部投運並獲評 2024 年度 AAAAA 級風電場（福建省政府網轉福建日報 2025-08-25）；2024-07 時 15 台已併網、11 台 10 MW 在建（世紀新能源網 2024-07-08），2024 年平潭新併網風電 110 MW 即此續建部分。295 MW 有誤，改 185 MW；年份 2024 維持。 | [連結](https://www.fujian.gov.cn/zwgk/ztzl/sxzygwzxsgzx/flsxkmh/202508/t20250825_6995046.htm) |
| Hebei Construction Investment Xiangyun Island · 250 MW · 2021 | 精選 | 修正：狀態、年份、機組、業主 | 疑點屬實：河北建投祥雲島 250 MW 擬裝 30 台 8.5 MW（環評公示；新浪財經 2025-04-16 轉風機採購中標候選人公示，三一重能預中標），2026-08-27 建投能源仍稱「祥雲島 25 萬千瓦……正在建設中」（騰訊新聞）。非 2021 年營運中風場，改興建中、預計 2026 年，風機改 30×8.5 MW。 | [連結](https://www.eiacloud.com/gs/detail/3?id=40708PouBn) |
| Putian Pinghai Bay Phase 2 · 246 MW · 2019 | 精選 | 修正：業主、年份 | 疑點屬實：平海灣二期 246 MW 由中閩能源全資子公司福建中閩海上風電有限公司投資營運，非龍源；該期自 2019 年起陸續併網、2021 年 12 月全容量併網投產（中閩能源 2024-06-08 公告），年份 2019→2021。 | [連結](https://epaper.stcn.com/pic/202406/08/67a30a8e71359fb86d66138561bf8a4e.pdf) |
| Datang Nan'ao Lemen I · 245 MW · 2021 | 精選 | 修正：機組、業主 | 疑點屬實：大唐南澳勒門Ⅰ 245 MW 安裝 35 台上海電氣 SWT7.0-154 7.0 MW 風機，2021-12-31 全容量投產（羊城晚報 2021-12-31），非明陽 6.45–7 MW；業主為中國大唐（大唐汕頭新能源有限公司，珠海特區報／汕頭橄欖台 2023-12-30）。 | [連結](https://ycpai.ycwb.com/ycppad/content/2021-12/31/content_40487673.html) |
| Huaneng Shantou Lemen · 245 MW · 2021 | 精選 | 修正：名稱、中文名、容量、年份、機組、業主 | 查無 2021 年 245 MW 的「華能汕頭勒門」：勒門海域 2021 年投產的 245 MW 是大唐南澳勒門Ⅰ（羊城晚報 2021-12-31），本筆數字顯然抄自它；華能在勒門的風場是勒門（二），總設計容量 594 MW（世紀新能源網轉華能招標 2022-04-28，招標人華能廣東汕頭海上風電有限責任公司），54 台上海電氣 11 MW，2023-12-29 併網投運（珠海特區報轉汕頭橄欖台 2023-12-30）。資料庫無其他勒門（二）紀錄，故改寫本筆而非刪除。 | [連結](https://ycpai.ycwb.com/ycppad/content/2021-12/31/content_40487673.html) |
| Zhejiang Daishan 4 Offshore wind farm · 234 MW · 2020 | GEM | 修正：年份 | 人民網浙江頻道 2021-05-17 報導岱山4號海上風電（234 MW）於 5 月 16 日正式併入電網，資料庫年份 2020 應改 2021；風機座數兩來源不一（世紀新能源網 2020-12 寫 50 台、人民網 2021-05 寫 54 台），機型欄維持空白。 | [連結](http://zj.people.com.cn/n2/2021/0517/c370990-34728482.html) |
| Shanghai Fengxian · 200 MW · 2021 | 精選 | 修正：容量、機組 | 國家能源局電力可靠性中心與世紀新能源網（2021-11）均載明奉賢海上風電總裝機 206.4 MW、32 台 6.45 MW 機組，2021 年 11 月 28 日主體完工、2021 年內併網；資料庫 200 MW 應改 206.4 MW，機型改為 32×6.45 MW。 | [連結](https://prpq.nea.gov.cn/gczl/6856.html) |
| Zhongtian Rudong H15 · 200 MW · 2021 | 精選 | 修正：名稱、中文名、機組 | 中國海裝官網 2021-12-20：協鑫江蘇如東 H13#、H15# 共採用 70 台中國海裝 H171-5MW 機組，2021-11-29 全容量併網；新華日報 2021-11-29 載 H13 為 30 台 5 MW，故 H15 為 40 台。業主為協鑫（資料庫已正確），「中天」只是承包商，名稱應改為協鑫如東H15；機型由 Envision 改為海裝 H171-5MW。 | [連結](http://www.hzwindpower.com/zongbuxinwen/20211220092246.html) |
| Longyuan Dafeng H7 · 200 MW · 2021 | 精選 | 修正：年份、機組 | 中國能源網 2019-06-27（金風科技稿）：龍源江蘇大豐H7 第 80 台風機併網，全場 80 台金風 GW130-2.5MW、20 萬千瓦；中國能源報 2019-08-05 亦載 80 台、20 萬千瓦。資料庫年份 2021、機型金風 6.45 MW 有誤（6.45 MW 是 2021 年的龍源大豐二期 94 台）。 | [連結](https://www.china5e.com/news/news-1061980-1.html) |
| Jiangsu Rudong H14 (Guangheng) Offshore wind farm · 200 MW · 2020 | GEM | 修正：業主、機組 | 瓯洋海工 2020-12-19：魯能如東H14# 200 MW 於 2020-12-19 全容量併網，由魯能新能源投資，安裝 50 台上海電氣 4.0 MW（SWT-4.0-146）；2018 年核准清單的項目公司為「如東廣恒新能源」。年份 2020、200 MW 已正確；業主補魯能新能源（2020 年起併入國家電投，故資料庫寫國家電投江蘇並非全錯），機型補 50×SWT-4.0-146。 | [連結](https://www.oyoffshore.co/detail/4.html) |
| Longyuan Rudong Intertidal 150 MW Demo · 150 MW · 2012 | 精選 | 修正：機組、分期 | 南通海洋水建：一期 100 MW 選用 17 台華銳 3 MW＋21 台西門子 2.38 MW，2011-06-21 開工、同年底投產；二期 50 MW 為 20 台金風 2.5 MW（2012）。機型欄改為實際組成（共 58 台），年份 2012 維持，加分期。 | [連結](http://www.ntoc-china.com/?m=home&c=View&a=index&aid=354) |
| SinoHydro Rudong Intertidal · 100 MW · 2016 | 精選 | 修正：機組、業主 | 風能產業網 2014-06-05：中國電建集團所屬水電新能源公司投資的如東凌洋外灘潮間帶風電場 100 MW，由 10 台 2 MW＋32 台 2.5 MW 組成，2014-05-25 首批併網；紅網 2022-12 稱 2016 年正式投產。機型改為 10×2 MW＋32×2.5 MW、業主補中國電建水電新能源；年份 2016 維持。 | [連結](https://www.cweea.com.cn/xwdt/html/4250.html) |
| Tianjin Nangang · 90 MW · 2021 | 精選 | 修正：年份、機組 | 國資委 2018-06-28（中國電建稿）：天津南港海上風電項目 2018 年 6 月 27 日按期併網，一期首批安裝 18 台 5 MW、90 MW，由中國電建集團所屬新能源公司投資。資料庫年份 2021 改 2018，機型「Sewind 6 MW」改為 18×5 MW。 | [連結](http://www.sasac.gov.cn/n2588025/n2588124/c9178300/content.html) |
| Jiangsu Xiangshui C1 Offshore wind farm · 12 MW · 2015 | GEM | 修正：容量、年份 | 鹽城市海洋與漁業局 2014-11-27 聽證公告：三峽響水試驗風機項目在陳港鎮沿海灘塗共 5 台、總裝機 12.5 MW（非 12）；三峽集團回顧（新浪 2026）稱 5 台潮間帶試驗機組於 2011 年安裝，2014 年聽證為補辦海域手續，故年份改 2011。 | [連結](http://www.yancheng.gov.cn/art/2014/11/27/art_13184_1456250.html) |
| CTG Yangjiang Shapa Phase 4 · 300 MW · 2021 | 精選 | 修正：機組 | 中新網四川 2024-09-10：三峽新能源陽江陽西沙扒四期項目現場，東方電氣研製供貨的 43 台 7 MW 海上風機在颱風「摩羯」期間正常運轉（43×7 ≈ 300 MW），機型非明陽 6.45 MW。 | [連結](https://www.sc.chinanews.com.cn/cjbd/2024-09-10/215587.html) |
| CTG Yangjiang Shapa Phase 5 · 400 MW · 2021 | 精選 | 修正：容量、機組 | 沙扒五期是 300 MW（47 部明陽 MySE6.45-180，303.15 MW）：陽江市發改局 2020-04-30 核准變更公示、廣東省生態環境廳粵環審〔2020〕85 號、明陽中標公告（三期 I 標＋五期共 78 部、50 萬千瓦）與三峽能源上市公告書都寫 300MW；本站原本的 400 MW 就是五期加總比三峽「全案 170 萬千瓦、269 部」多出約 100 MW 的原因 | [連結](http://www.yangjiang.gov.cn/yjfgw/gkmlpt/content/0/453/post_453906.html) |
| Datang Zhuanghe II · 300 MW · 2021 | 精選 | 修正：業主、機組、名稱、中文名 | 莊河海上風電場址 II（300 MW）業主為華能遼寧清潔能源有限責任公司（2019 年核准時為中船重工，世紀新能源網轉中國電力新聞網 2020-09-14），安裝 60 台海裝 H171-5.0MW（大連天健網 2019-06-26），非大唐、非金風；國資委報導其與 IV1 場址同於 2021 年底全容量並網。 | [連結](https://www.ne21.com/news/show-135438.html) |
| CTG Dafeng H8-2 · 300 MW · 2022 | 精選 | 修正：年份 | 中新網 2021-12-30：三峽能源江蘇大豐 30 萬千瓦 H8-2 海上風電項目於 2021-12-23 成功全容量並網發電，年份應為 2021 而非 2022。 | [連結](https://www.chinanews.com.cn/cj/2021/12-30/9640759.shtml) |
| SPIC Peninsula South V · 300 MW · 2023 | 精選 | 修正：容量、年份、機組、業主 | 世紀新能源網轉中國發展網 2023-02-16：國家電投山東半島南 V 場址總裝機 500 MW（非 300），70 台 7 MW＋1 台 10 MW，由國家電投山東分公司投資建設，2022-05-20 開工、2022-12-09 全容量並網（當年開工當年全容量），年份應為 2022。 | [連結](https://www.ne21.com/news/show-176154.html) |
| Zhejiang Jiaxing 2 Offshore wind farm · 300 MW · 2021 | GEM | 修正：機組 | 華能嘉興2號300MW、50台6.0MW；標段I風機2021-08-11全部安裝完成（中國海洋工程諮詢協會海上風電分會），新浪財經2022-05-18稱嘉興2號於2021年11月投產，資料庫年份2021正確，只補機型。 | [連結](https://www.chinaoffshorewind.cn/html/news/affairs/2021/0813/188.html) |
| Zhejiang Taizhou 1 Offshore wind farm · 300 MW · 2024 | GEM | 修正：年份、機組 | 浙能台州1號300MW、40台7.5MW（CPEM 2023-09）；浙能集團2023年度報告寫「台州1号海上风电项目实现全容量并网发电」，故年份應為2023而非2024。與「CGN Taizhou 1」是否重複無法證實：中廣核2020年浙江在建項目只有岱山4#、嵊泗5#/6#，查無中廣核台州項目。 | [連結](https://www.zjenergy.com.cn/ZNWW/contents/1423/23897.html) |
| Jiangsu Rudong H5 (Yunshan) Offshore wind farm · 300 MW · 2021 | GEM | 修正：機組 | 如東H5為75台4MW、300MW（世紀新能源網2020-05），機組為電氣風電（上海電氣），2021-08全部吊裝（世紀新能源網2021-08-12）；資料庫業主江蘇交通控股（苏交控）已正確，只補機型。 | [連結](https://www.ne21.com/news/show-164967.html) |
| Huaneng Rudong · 300 MW · 2017 | 精選 | 修正：機組、業主 | 如東八仙角300MW、70台（4MW、4.2MW、5MW三種機型、3個廠家），2017-09全部併網；其中20台為中國海裝5MW（19台H151-5MW＋1台H171-5MW），由華能江蘇清潔能源分公司投資建設（中國能源網2019-03、中國電力網2021-03、中國能源報2019-05）。資料庫「70x Sewind/Siemens 4.0-4.3 MW」有誤。 | [連結](https://www.china5e.com/news/news-1053335-1.html) |
| CTG Yangjiang Shapa Phase 1 · 300 MW · 2019 | 精選 | 修正：年份、業主 | 三峽陽西沙扒一期30萬千瓦：2019-11-19首批風機併網，2021-06-08全容量併網；投資主體為三峽新能源陽江發電有限公司（三峽珠江發電100%持股）（搜狐投資分析2024）；陽西縣政府2021-07-26證實55台5.5MW已全部投運。資料庫年份2019應改為2021，業主補上。 | [連結](https://www.sohu.com/a/789824114_121779604) |
| Tangshan Laoting Putidao · 300 MW · 2019 | 精選 | 修正：機組、業主 | 唐山樂亭菩提島300MW為75台4MW，開工時擬裝西門子SWT-4.0-130（中國電器工業協會2017-05），中交三航局安裝75台4.0MW風機（百家號2023）；項目名為「河北建投唐山乐亭菩提岛海上风电场300mw示范项目」（中國風能設備協會網）。資料庫機型「Goldwind/Envision 4-5 MW」有誤，業主應為河北建投海上風電有限公司。 | [連結](https://www.ceeia.com/XWZX/d/201705/69430.html) |
| CTG Jiangsu Dafeng 300 MW · 300 MW · 2020 | 精選 | 修正：年份、業主、機組 | 三峽新能源江蘇大豐300MW：73台風機，2019-10-31全部機組併網、全容量達產，首次批量應用6.45MW國產海上風機（三峽新能源澎湃號2019-11-15）。資料庫業主「Huaneng Jiangsu Clean Energy」與年份2020有誤。 | [連結](https://www.thepaper.cn/newsDetail_forward_4965158) |
| Huaneng Dalian Zhuanghe III · 300 MW · 2020 | 精選 | 修正：名稱、中文名、業主、年份 | 莊河Ⅲ（300MW）是三峽新能源的風場：新華社2020-11-27報導「三峡新能源大连庄河Ⅲ海上风电场近日实现全容量并网」，2017-03開工，為東北首座海上風場。華能在莊河的是Ⅱ（300MW）與Ⅳ1（350MW）（華東院）。資料庫無另一筆三峽莊河Ⅲ，故改名與改業主而非刪除；年份2020正確。 | [連結](https://www.cs.com.cn/xwzx/hg/202011/t20201127_6115516.html) |
| Huaneng Rudong H3 · 300 MW · 2021 | 精選 | 修正：容量、機組 | 華能盛東如東H3總裝機400MW、80台中國海裝5MW海上風機，2021-06-29完成全場吊裝（中國海裝官網2021-07-16；世紀新能源網2021-07-15）。資料庫300MW／Goldwind-Mingyang 5.5-6.45MW有誤。 | [連結](http://www.hzwindpower.com/zongbuxinwen/20210716151715.html) |
| Huaneng Qidong H3 · 300 MW · 2021 | 精選 | 修正：名稱、中文名、業主、機組 | 啟東H3為江蘇華威風力發電有限公司的啟東H1/H2/H3（802MW、134台）之一：華威2020-02與華東院簽H1 250MW、H2 250MW、H3 300MW EPC合同（世紀新能源網2020-03-11）；H3標段50台6種機型、300MW（人民網江蘇2021-10-30）；全項目2021-12-25全容量併網（新華網）。業主不是華能，資料庫業主「Qidong Huaerrui」與名稱應改。 | [連結](https://www.ne21.com/news/show-133715.html) |
| Longyuan Sheyang H2 · 300 MW · 2021 | 精選 | 修正：機組 | 龍源射陽H2採用遠景EN-148/4.5MW機組（新浪財經轉中國風電新聞網2025-02-07），2021-04-12全容量併網（射陽新聞網）；資料庫「Goldwind 6.45 MW」有誤。67台之數未能在可核對原文中證實，機型欄不寫台數。 | [連結](https://finance.sina.com.cn/roll/2025-02-07/doc-ineiqkks1306604.shtml) |
| Datang Danzhou CZ3 · 1,200 MW · 2025 | 精選 | 修正：名稱、中文名、容量、機組、座標 | 這筆只算儋州 120 萬瓩案的一場址：60 部 10 MW（600 MW，主機全部產自洋浦海上風電產業園），大唐稱 2024 年底併網發電、2026 年的產業報導寫 2025 年第一季併網發電，2025 年 6 月 30 日通過海洋環保竣工驗收；二場址（60 萬瓩，明陽 10 MW）2025 年 12 月 16 日才開工、2026 年 10 月仍在海上施工，改由「Datang Danzhou CZ3 (site 2)」一筆表示（原本把二場址算成 2026 年營運中，機型欄也寫成兩場址都是東方電氣）。座標改到儋州西北外海（GEM 概略位置；場址離岸約 34 公里），原座標在昌江縣海岸附近，偏西南約 75 公里 | [連結](https://m.sohu.com/a/1040969549_121194771) |
| Huaneng Peninsula North BW · 510 MW · 2024 | 精選 | 修正：機組 | 半島北 BW 的機組是 60 部 8.5 MW（大眾新聞 2024 年 9 月；原寫「金風 8–12 MW」，混入半島北 L 場址的 42 部 12 MW） | [連結](https://m.dzplus.dzng.com/share/general/0/NEWS1723611XKUKXREOUNYBW) |
| Guohua Dongtai IV (H2) · 300 MW · 2019 | 精選 | 修正：機組 | 東台四期是 63 部上海電氣 SWT-4.0-130（一期）加 12 部遠景 EN136-4.2（二期），不是 75 部金風 GW154-4.0（Power Technology 專案頁） | [連結](https://www.power-technology.com/data-insights/power-plant-profile-dongtai-iv-china/) |
| Huaneng Dafeng · 300 MW · 2019 | 精選 | 修正：機組、業主 | 華能大豐一期是 48 部遠景 EN136-4.2 加 20 部中國海裝 H151-5.0，業主為華能新能源（持股 100%）；原寫 75 部金風 4 MW、業主國家電投江蘇（Power Technology 專案頁） | [連結](https://power-technology.com/marketdata/huaneng-dafeng-phase-i-offshore-wind-farm-china) |
| Huaneng Sheyang H1 / Yancheng · 300 MW · 2021 | 精選 | 修正：機組 | 射陽南區 H1 是 67 部遠景 EN148-4.5，不是「6–8 MW 級」（Power Technology 專案頁） | [連結](https://www.power-technology.com/data-insights/power-plant-profile-sheyang-south-area-h1-wind-farm-china/) |
| Longyuan Dafeng H3 (Huaneng Dafeng) · 300 MW · 2018 | 精選 | 修正：名稱、中文名、業主、機組 | 大豐 H3 是國家電投（原中電投）的風場，72 部遠景 EN136-4.2；舊名稱裡的「龍源」「華能大豐」都不對（Power Technology 專案頁） | [連結](https://www.power-technology.com/marketdata/spic-jigansu-dafeng-h3-offshore-wind-farm-china/) |
| Fujian Pingtan Waihai Offshore wind farm · 111 MW · 2023 | GEM | 修正：名稱、中文名、容量、年份、座標、機組、業主 | 三峽平潭外海：111 MW、11 部 8–16 MW 試驗機組（4×8、5×10、1×13、1×16 MW），2023 年 9 月建成投產，建設單位平潭海峽發電；座標改用福建省海域使用核准的 11 個機位中心（GEM 點位為概略位置） | [連結](http://zrzyt.fj.gov.cn/zwgk/gsgg/202404/P020240429531356048270.pdf) |
| Jiangsu Rudong H13 (Xiexin) Offshore wind farm · 152 MW · 2021 | GEM | 修正：名稱、中文名、容量、年份、機組 | 協鑫如東 H13：裝機 15 萬瓩、30 部海裝 5 MW，2021 年 11 月 29 日全容量併網（GEM 寫 152 MW） | [連結](https://www.163.com/dy/article/GQ0GC2VI05345ASA.html) |
| Guohua Rudong H14 · 300 MW · 2021 | 精選 | 重複（併入「Jiangsu Rudong H14 (Guangheng) Offshore wind farm」） | 如東 H14 是魯能新能源的 200 MW 風場（50 部 4 MW，南通發布 2020-08），GEM 已有這筆；精選的「國華如東 H14」300 MW、金風 6.45 MW 是錯置，查無國華在如東 H14 的風場 | [連結](https://news.96189.com/w/2008/ebbbbcec80b94ed8a6b9441a968e997c.html) |
| CGN Jiaxing 2 (Zhoushan Daishan 4) · 300 MW · 2021 | 精選 | 重複（併入「Zhejiang Daishan 4 Offshore wind farm」） | 中廣核岱山 4 號是 234 MW、54 部（遠景 4.5 MW 與湘電 4 MW），GEM 已有這筆；精選紀錄的 300 MW、明陽 5.5 MW 與「嘉興 2」名稱都不對（嘉興 2 號是另一座風場） | [連結](https://www.power-technology.com/marketdata/daishan-no-4-offshore-wind-farm-china/) |
| Zhejiang Daishan 4 Offshore wind farm · 234 MW · 2021 | GEM | 修正：中文名、機組 | 機組：36 部遠景 EN148-4.5（一期 32＋4）與 18 部湘電 XE140-4.0（Power Technology） | [連結](https://www.power-technology.com/marketdata/daishan-no-4-offshore-wind-farm-china/) |
| CGN Rudong H8 · 300 MW · 2021 | 精選 | 修正：機組 | 中廣核如東 H8 是 40 部中國海裝 H171-5.0 加 25 部上海電氣 SWT-4.0-146，不是明陽 5.5 MW（Power Technology 專案頁） | [連結](https://www.power-technology.com/marketdata/power-plant-profile-cgn-jiangsu-rudong-h8-offshore-wind-power-project-china/) |
| Guoneng Dafeng H5 · 200 MW · 2021 | 精選 | 修正：容量、機組 | 國能大豐 H5 總裝機 206.4 MW、32 部金風 GW184-6.45（大豐區政府 2024-12）；原寫 200 MW、金風 5–6 MW 級 | [連結](https://www.dafeng.gov.cn/art/2024/12/13/art_45256_4270868.html) |
| Fuqing Haitan Strait · 300 MW · 2021 | 精選 | 修正：容量、機組 | 竣工海洋環保驗收報告：46 部，海裝 6.2 MW 21 部、5 MW 3 部、明陽 7.0 MW 22 部，總裝機 299.2 MW；原寫金風 6.45–8 MW、300 MW | [連結](https://www.cti-cert.com/upload/files/202511071148308464.pdf) |
| Shenergy Hainan CZ2 (Dongfang) · 600 MW · 2024 | 精選 | 修正：名稱、年份、座標 | 申能海南 CZ2 一期 67 部 9 MW 於 2025-03-24 全容量併網（2024 年只是首批併網），年份 2024→2025；場址在儋州市北面海域、中心離岸約 27 km，不在東方外海，座標改到儋州北面（概略位置），名稱的「Dongfang」改為「Danzhou」 | [連結](https://www.ne21.com/news/show-210615.html) |
| Hainan CZ2 Demonstration Offshore wind farm · 2 · 600 MW · 2026 | GEM | 修正：中文名、年份 | 這是 CZ2 二期：全案 120 萬千瓦、一期 60 萬千瓦已營運，二期 2026-04-30 才打下首樁，完工年份未公布；GEM 的中文名寫成一期 | [連結](https://www.hi.chinanews.com.cn/hnnew/2026-05-02/739814.html) |
| Hainan CZ7 Demonstration Offshore wind farm · 1 · 600 MW · 2026 | GEM | 修正：中文名、年份 | 這是 CZ7 一期（CZ7-1，600 MW，擬裝 60 部 10 MW 明陽機組），不是二期；2026 年只查到陸上集控中心與送出線路施工，未見海上施工，完工年份未公布 | [連結](https://finance.sina.com.cn/roll/2025-07-23/doc-infhncvn1132725.shtml) |
| Hainan CZ9 Demonstration Offshore wind farm · 1 · 600 MW · 2026 | GEM | 修正：年份 | 明陽東方 CZ9 一期 600 MW：2022-11-30 舉行開工儀式，但到 2026-10 查不到海上沉樁或吊裝，2026 年 7 月明陽仍把 CZ9 寫成規劃中的場址；2026 年完工的根據不足，年份改為不詳 | [連結](https://www.ewindpower.cn/news/show-htm-itemid-33855.html) |
| Guangdong Xuwen Donger Offshore wind farm · 300 MW · 2026 | GEM | 修正：年份、機組、業主、中文名 | 中核集團湛江徐聞東二：300 MW、21 部 14.3 MW；2026-09-04 才打下首根鋼管樁（原計畫 2025 年底全容量併網已延誤），完工年份未公布 | [連結](https://www.21jingji.com/article/20260906/herald/6b02ac88b4840ed91205ffeb9430edf6.html) |
| Guangdong Three Gorges Pilot Floating Offshore wind farm · 16 MW · 2026 | GEM | 修正：中文名、機組、座標 | 這是三峽「領航號」單機 16 MW 浮動式平台，2026-05-02 在陽江青洲海域完成安裝、6 月敷設 66 kV 動態海纜，接入青洲五、七的集電網路；查不到本身已併網的報導，維持興建中。GEM 的座標在沙扒鎮外海幾公里，但國家能源局寫「離岸超70公里、水深超50米」：改放在本站青洲五、七兩點之間（概略位置，沒有官方座標） | [連結](https://www.nea.gov.cn/20260508/6077d3ffe9cb4855b009df84347bfe80/c.html) |
| Hainan Danzhou CZ3 (Datang) Offshore wind farm · 2 · 600 MW · 2026 | GEM | 修正：名稱、中文名、狀態、機組 | 大唐儋州 120 萬瓩案的二場址：60 部明陽 10 MW（2025 年 12 月得標），2025 年 12 月 16 日開工；220 kV 送出海纜 2026 年 6 月才招標（工期 8 月 1 日至 10 月 15 日），10 月 2 日洋浦海事局仍為風機與基礎施工標段二增派施工船，查無任何機組併網的報導；大唐目標 2026 年底全容量併網（標段二合約工期到 2027 年 5 月）。GEM 2026-02 版列規劃中，改為興建中 | [連結](https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=78b6e0e798a44247b72f4720f2d6169b&channelId=5eb2863167464a6faaa1fca5bff0a2a9) |
| Hainan CZ3 Demonstration Offshore wind farm · 2 · 600 MW | GEM | 重複（併入「Hainan Danzhou CZ3 (Datang) Offshore wind farm · 2」） | GEM 第二次收錄的大唐 CZ3 案的第 2 期（600 MW、規劃中，誤標陸域；中文名沿用整案的「一期（一廠址）」）。全案只有兩個場址，營運中的一場址已是精選紀錄，這筆規劃中的 600 MW 與二場址重複 | [連結](https://www.gem.wiki/Hainan_CZ3_Demonstration_Offshore_wind_farm) |
| Huaneng Peninsula North BW · 510 MW · 2024 | 精選 | 修正：座標 | 座標改到龍口桑島西北外海（GEM 的精確位置；龍口市 2022 年公示：場址中心離岸約 18 km）；原座標在威海北方外海，偏東約 140 km。營運狀態無誤：2023 年 8 月開工、2024 年全容量併網 | [連結](https://www.gem.wiki/Shandong_Bandaobei_BW_Offshore_wind_farm) |
| Changle Waihai B · 400 MW · 2022 | 精選 | 重複（併入「Fujian Changle 'Outer Ocean' Area B Offshore wind farm」） | 長樂外海 B 區沒有建成的風場：唯一的 B 區案是中閩能源的「長樂 B 區（調整）」，2023 年競爭配置才選定業主、2024 年 11 月 30 日核准（114 MW、7 部），2026 年 9 月才招 EPC（不超過 102 MW、6 部，計畫 2027 年 12 月前全部併網）。這筆 400 MW、2022 年營運中有誤，GEM 已有該案的規劃中紀錄 | [連結](https://baijiahao.baidu.com/s?id=1875652994034298464&wfr=spider&for=pc) |
| Fujian Changle 'Outer Ocean' Area B Offshore wind farm · 114 MW | GEM | 修正：業主、容量、年份 | 業主是中閩能源（福建投資集團旗下；專案公司福建福州閩投海上風電由中閩能源持股 100%），不是華電；2024 年 11 月核准 114 MW、7 部，2026 年 9 月 EPC 招標為不超過 102 MW、6 部，計畫 2027 年 10 月前首部、12 月前全部併網 | [連結](https://fgw.fujian.gov.cn/zfxxgkzl/zfxxgkml/zdjsxmpzhss/202412/t20241202_6587050.htm) |
| Shandong Haiwei Peninsula South U · 450 MW · 2025 | 精選 | 重複（併入「CGN Peninsula South U1」） | 「山東海衛半島南 U 場址 450MW 海上風電項目」就是國家電投半島南 U 場址項目二期（53 部 8.5 MW、450.5 MW，乳山南側海域，世紀新能源網 2024-09）；精選紀錄「SPIC Peninsula South U1」已含兩期 900 MW（一期 2023-11-17 投運、二期 2024-10-26 全容量併網，中國電器工業協會 2024-10-31），本筆重複，年份 2025 也不對 | [連結](https://www.ne21.com/news/show-201133.html) |
| Zhangpu Liu'ao Phase 1 · 400 MW · 2022 | 精選 | 重複（併入「CTG Zhangpu Liu'ao Phase 2」） | 福能持股 35%、三峽 65% 的海峽發電在六鰲只有一個項目：2018 年券商報告寫「漳州六鰲 D 區項目（40.2 萬千瓦）」，2024 年中閩能源回覆上交所（引福能年報）寫成「漳浦六鰲二期 40.2 萬千瓦」，即 2023-02-04 開工（「閩南地區首個海上風電項目」）、2024-06-27 全容量併網的三峽漳浦六鰲二期；本筆「一期、2022 年營運」是 GEM 的 D 區併進精選紀錄後誤標，與二期重複 | [連結](https://epaper.cs.com.cn/zgzqb/images/2024-06/08/B075/zqB07508.pdf) |
| Zhuanghe I · 200 MW · 2021 | 精選 | 修正：容量、業主、機組 | 莊河場址 I 是大唐集團的 100 MW 項目：19 部明陽 MySE5.2-166（19 × 5.2 = 98.8 MW），EPC 於 2021 年由中國能建北方建投與上海院聯合體得標（世紀新能源網）；原寫 200 MW、業主空白、「4-6 MW class」都不對。併網年份沒有可引用的出處，2021 年待查證 | [連結](https://www.ne21.com/news/show-157836.html) |
| Liaoning Dalian Zhuanghe 4 Area I Offshore wind farm · 350 MW · 2021 | GEM | 修正：業主、機組 | 華能莊河 IV1（350 MW）：中新網寫 II、IV1 兩場共 650 MW、60 部 5 MW＋26 部 7.5 MW＋25 部 6.2 MW，II 場是 60 部 5 MW，所以 IV1 為 26 × 7.5＋25 × 6.2 = 350 MW，2021-12-29 全容量併網，由華能遼寧清潔能源建設運維；補上業主與機組 | [連結](https://www.chinanews.com/ny/2021/12-29/9640309.shtml) |
| Shanghai Fengxian Haiwan Expansion Offshore wind farm · 15 MW · 2012 | GEM | 修正：容量、業主 | 財政部 2013-03 可再生能源電價附加補助目錄：「上海新能源環保工程公司奉賢海灣風電場擴容 14.75MW 發電工程」，容量 14.75 MW；是海堤上的陸域還是海上沒有可引用的出處，型別待查證 | [連結](http://jjs.mof.gov.cn/tongzhigonggao/201303/P020130308403305257355.pdf) |
| CGN Xiangshan 1 Phase 1 (Tuci) · 280 MW · 2022 | 精選 | 修正：機組、名稱、年份 | 這筆是中廣核象山塗茨海上風電場（象山縣東北部塗茨外海，與 GEM 的 Xiangshan Tuci 同點），不是國電象山 1 號一期（鶴浦鎮東南海域，已含在 GEM 的象山 1 號），原名「Xiangshan 1 Phase 1」是混名。一期已併網（寧波日報 2025-07），風機由中國海裝供應（日立能源 2022-07 新聞稿、券商報告），8 MW 級；原寫「明陽 6.45 MW」不對。變更海域使用論證報告（2022-08 調整批覆後成稿）寫「目前尚未投產建設」，所以「2022 年」不對；中郵證券 2023-10 研報列「中廣核象山塗茨 280 MW、23 年已併網」，GEM 也寫 2023，年份改 2023（業主的全容量併網公告待查證）；寧波海事局 2024-11 通告寫「已建成投用」、38 台 8 MW（舊說的 35 部、280 MW 是調整前的數字） | [連結](https://file.iyanbao.com/pdf/3023a-06643cec-e616-4cde-aed1-4d8ef822d202.pdf) |
| Huaneng Cangnan 4 · 400 MW · 2022 | 精選 | 修正：機組 | 華能蒼南 4 號安裝 77 部機組（蒼南新聞網 2022-09），GlobalData 寫為遠景 5.2 MW（77 × 5.2 = 400.4 MW）；原寫「明陽 6.45–8 MW」沒有出處 | [連結](https://www.cnxw.com.cn/system/2022/09/06/014531534.shtml) |
| CGN Shanwei Jiazi II · 400 MW · 2022 | 精選 | 修正：機組 | 汕尾甲子 900 MW 全場「78 台 6.45 MW 和 50 台 8.0 MW」，甲子一是 78 台 6.45 MW，所以甲子二為 50 台 8.0 MW（中國證券報 2022-12-21；汕尾市政府補充論證報告同）；原寫 MySE6.45-180 | [連結](https://www.cs.com.cn/ssgs/gsxw/202212/t20221221_6314699.html) |
| Huaneng Guanyun · 300 MW · 2021 | 精選 | 修正：機組 | 華能灌雲 2021-07-30 全容量併網、共 48 台（中證網轉華能），中廣核嵊泗 7 號環評的類比表：46 台 6.45 MW＋2 台 3.0 MW；原寫「金風／遠景 4–5 MW」 | [連結](https://29634560.s21i.faiusr.com/61/ABUIABA9GAAgpofptwYorvi-iwM.pdf) |
| CTG Changyi · 300 MW · 2022 | 精選 | 修正：機組 | 三峽昌邑 300 MW 共 50 台 6 MW，2022 年入冬前全部吊裝（山東省能源局 2022-11；新華社 2026-06 寫 50 座風機、滿發時每台每小時 6,000 度）；原寫「明陽 5.5–6.45 MW」 | [連結](http://nyj.shandong.gov.cn/art/2022/11/9/art_253733_10294676.html) |
| Shandong Energy Bozhong G · 400.4 MW · 2025 | 精選 | 修正：機組 | 渤中 G 場址一期 400.4 MW 一次全容量併網，35 台 10 MW＋4 台 12.6 MW（齊魯網／大眾新聞 2025-05-31）；原寫「明陽／金風 8.5–16 MW」沒有出處 | [連結](https://news.iqilu.com/shandong/yuanchuang/2025/0531/5817656.shtml) |
| Putian Shicheng · 200 MW · 2021 | 精選 | 修正：機組 | 莆田石城 200 MW 為 26 台 7 MW＋3 台 6 MW（福建省自然資源廳 2024-05），GlobalData 寫上海電氣 SWT-7.0-154 與 SWT-6.0-154、2021-07 商轉；與平海灣 F 區是不同項目（券商報告分列） | [連結](https://zrzyt.fujian.gov.cn/zwgk/xwdt/zrzyyw/202405/t20240509_6445881.htm) |
| Tianjin Nangang · 90 MW · 2018 | 精選 | 修正：機組 | 天津南港海上風電一期 18 台 5 MW（國資委轉中國電建 2018-06），GlobalData 寫在渤海、高樁承台基礎、西門子歌美颯 G132-5.0；防波堤上的是另一案 | [連結](http://www.sasac.gov.cn/n2588025/n2588124/c9178300/content.html) |
| Jiangsu Dafeng H8-1 (Three Gorges) Offshore wind farm · 200 MW | GEM | 重複（併入「CTG Dafeng H8-1 (800 MW)」） | 三峽江蘇大豐 800 MW 由 H8-1、H9、H15、H17 四個場址組成、共 98 台，2025-12-15 全容量併網（揚子晚報 2025-09、紫牛新聞 2026-07）；GEM 的 H8-1 是其中一個場址，已由精選紀錄涵蓋 | [連結](https://www.yzwb.net/news/jiangsu/202509/t20250916_264564.html) |
| Jiangsu Dafeng H9 (Three Gorges) Offshore wind farm · 200 MW | GEM | 重複（併入「CTG Dafeng H8-1 (800 MW)」） | 三峽江蘇大豐 800 MW 由 H8-1、H9、H15、H17 四個場址組成、共 98 台，2025-12-15 全容量併網（揚子晚報 2025-09、紫牛新聞 2026-07）；GEM 的 H9 是其中一個場址，已由精選紀錄涵蓋 | [連結](https://www.yzwb.net/news/jiangsu/202509/t20250916_264564.html) |
| Jiangsu Dafeng H15 (Three Gorges) Offshore wind farm · 200 MW | GEM | 重複（併入「CTG Dafeng H8-1 (800 MW)」） | 三峽江蘇大豐 800 MW 由 H8-1、H9、H15、H17 四個場址組成、共 98 台，2025-12-15 全容量併網（揚子晚報 2025-09、紫牛新聞 2026-07）；GEM 的 H15 是其中一個場址，已由精選紀錄涵蓋 | [連結](https://www.yzwb.net/news/jiangsu/202509/t20250916_264564.html) |
| Jiangsu Dafeng H17 (Three Gorges) Offshore wind farm · 200 MW | GEM | 重複（併入「CTG Dafeng H8-1 (800 MW)」） | 三峽江蘇大豐 800 MW 由 H8-1、H9、H15、H17 四個場址組成、共 98 台，2025-12-15 全容量併網（揚子晚報 2025-09、紫牛新聞 2026-07）；GEM 的 H17 是其中一個場址，已由精選紀錄涵蓋 | [連結](https://www.yzwb.net/news/jiangsu/202509/t20250916_264564.html) |
| Liaoning Dalian Zhuanghe 4 Area II Offshore wind farm · 200 MW | GEM | 修正：狀態、年份、機組 | 華能大連莊河 Ⅳ2（石城島東部海域，200 MW、25 台 8.0 MW）2024-09-29 最後一台併網、全容量併網（遼寧省政府網 2024-09-30）；原列興建中 | [連結](https://www.ln.gov.cn/web/ywdt/jrln/wzxx2018/2024093014452334478/index.shtml) |
| Fujian Zhangpu Liu'Ao Offshore wind farm · E · 404 MW | GEM | 修正：狀態 | 六鰲 E 區（404 MW）查無開工紀錄：GlobalData（2024-10）仍列規劃中、預計 2025 年開工；改為前期開發。GEM 的點位在六鰲以南約 130 km，確切位置待查證 | [連結](https://power-technology.com/?p=213306) |
| Guangdong Yangjiang Shaba (Guangdong Energy) Offshore wind farm · 300 MW · 2021 | GEM | 修正：機組 | 粵電陽江沙扒已建 46 台明陽 MySE6.45-180＋1 台 MySE5.5-155（21 號機位）（海域使用補充論證報告書，2023-06）；原機型欄空白 | [連結](http://www.yangjiang.gov.cn/yjzrzy/attachment/0/43/43288/710896.pdf) |
| CTG Yangjiang Shapa Phase 3 · 400 MW · 2021 | 精選 | 修正：機組、容量 | 沙扒三期建成 61 台 6.45 MW 固定式（明陽 MySE6.45-180 與金風 GW171/6450）＋1 台 5.5 MW 漂浮式 MySE5.5-155（海域使用補充論證報告書，2023-09；2021-12-16 建設完成）；漂浮式那台已有自己的紀錄「三峽引領號」，這筆只算 61 台固定式（393.45 MW，原寫 400 MW） | [連結](http://www.yangjiang.gov.cn/yjzrzy/attachment/0/58/58158/731643.pdf) |
| CTG Dalian Zhuanghe III · 300 MW · 2020 | 精選 | 修正：機組 | 三峽莊河 III 布置 2 台 3 MW、50 台 3.3 MW、21 台 6.45 MW，裝機規模 300 MW（世紀新能源網轉龍源振華，2020-11）；原寫「金風／上海電氣 4–6 MW」 | [連結](https://www.ne21.com/news/show-135820.html) |
| CGN Fanshi I · 1,000 MW · 2026 | 精選 | 修正：機組 | 帆石一的機型是 22 台金風 GWH252-13.6MW 與 51 台明陽 MySE14-260（陽江市自然資源局 2025-04 公示的用海調整補充論證報告書「調整後風機主要設備特性表」；台數與陽江新聞網的 22 台 13.6 MW＋51 台 14 MW 相同）；原寫「明陽 11–16 MW」 | [連結](http://www.yangjiang.gov.cn/yjzrzy/attachment/0/70/70786/853372.pdf) |
| Guangdong Zhanjiang Xuwen Offshore wind farm · 906 MW · 2022 | GEM | 修正：機組 | 國家電投徐聞原場 60 萬千瓦、南北兩個標段各 47 台（世紀新能源網，2021-11）；300 MW 增容為 25 台 12 MW，2024 年 12 月 17 日全容量併網（國家電投），與這筆紀錄的分期（2024 年 300 MW）相符；原本機型欄空白 | [連結](http://www.spic.com.cn/xtdt1/202412/t20241218_324623.html) |
| Guangdong Zhanjiang Xuwen Offshore wind farm · 906 MW · 2022 | GEM | 修正：年份、分期 | 徐聞 600 MW 原場：北區 47 台 2021 年 11 月 19 日全容量併網，南區最後一台 S56 於 11 月 26 日併網，94 台 6.45 MW 全部併網（湛江日報 2021-11-26）；原場原寫 2022 年 | [連結](https://m.gdzjdaily.com.cn/p/2816813.html) |
| Jiangsu Dongtai Zhugensha H1 Offshore wind farm · 200 MW · 2021 | GEM | 修正：機組 | 國華東台五期（竹根沙 H1#）裝 50 台上海電氣 4.0-146（中國能源報，2020-06 首台吊裝）；原本機型欄空白 | [連結](https://paper.people.com.cn/zgnyb/html/2020-06/22/content_1993858.htm) |
| Jiangsu Dongtai Zhugensha H2 Offshore wind farm · 302 MW · 2021 | GEM | 修正：機組 | 竹根沙 H2# 總裝機 302 MW，含 50 台 4.0 MW 與 17 台 6.0 MW（中國可再生能源學會風能專委會轉 EPC 承包商，2020-09）；原本機型欄空白 | [連結](https://www.cweea.com.cn/xwdt/html/31056.html) |
| Jiangsu Dafeng H4 Offshore (Longyuan) wind farm · 303 MW · 2021 | GEM | 修正：機組 | 大豐 H4 竣工為 47 台 6.45 MW（龍源鹽城新能源 2025-11 招標公告）；原本機型欄空白 | [連結](http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20251129/c09f1385-66c8-4ffb-b075-750f71961119.html) |
| Jiangsu Dafeng H6 Offshore (Longyuan) wind farm · 303 MW · 2021 | GEM | 修正：機組 | 大豐 H6 為 47 台 6.45 MW（龍源鹽城新能源 2025-11 招標公告）；原本機型欄空白 | [連結](http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20251129/c09f1385-66c8-4ffb-b075-750f71961119.html) |
| Jiangsu Dafeng H12 Offshore (Longyuan) wind farm · 200 MW · 2018 | GEM | 修正：機組 | 大豐 H12 共 80 台（龍源 2020-10 招標公告），為金風 GW109/2500（中國能源網 2017 年施工中的概況，55 台在潮間帶、25 台在深水區）；原本機型欄空白 | [連結](https://www.china5e.com/news/news-1004814-1.html) |
| Jiangsu Sheyang Southern Area H2-1 Offshore wind farm · 104 MW · 2021 | GEM | 修正：機組 | 射陽南區 H2-1# 共 23 台（射陽龍源 2022-01 招標公告），海上射陽風電場共 90 台 4.5 MW（67＋23，江蘇海上龍源 2025-08）；原本機型欄空白 | [連結](http://www.chnenergybidding.com.cn/bidweb/001/001002/001002003/20220126/a64913cb-cf9d-4f39-8a5f-8d3af8011429.html) |
| Jiangsu Jiangjiasha H1 Offshore wind farm · 1 · 300 MW · 2018 | GEM | 修正：座標、機組 | 龍源海安蔣家沙 300 MW（2018 年建成，75 部遠景 4 MW；世紀新能源網 2025）：江蘇海事局 2022 年航行通告寫 67 號風機中心座標 32°39.011′N、121°07.280′E；座標改到這部風機（概略位置，風場範圍在其周圍），原點 31.773 N、121.105 E 在長江口，偏南約 100 km | [連結](https://www.js.msa.gov.cn/art/2022/5/27/art_75_1350583.html) |
| Jiangsu Jiangjiasha H2 Offshore wind farm · 302 MW · 2020 | GEM | 修正：座標 | 江蘇海事局 2022 年航行通告：蔣家沙（H2#）300MW 海上風電場 43 號風機座標 32°44′30.44″N、121°14′12.96″E（建設單位九思海上風力發電如東）；同年另一通告的維護作業水域（11 點連線）也在北緯 32.68–32.78°。座標改到 43 號風機（概略位置），原點 31.773 N、121.105 E 在長江口，偏南約 110 km | [連結](https://js.msa.gov.cn/art/2022/4/18/art_280_1339155.html) |
| Jiangsu Rudong H2 (Guoxin) Offshore wind farm · 350 MW · 2021 | GEM | 修正：機組 | 國信如東 H2#（350 MW）的 70 台中國海裝 H171-5MW 機組 2021 年 12 月 1 日全部並網（中國海裝新聞稿；江蘇省國資委寫共 70 台 5 MW、12 月 1 日全部機組並網）；原機型欄空白 | [連結](http://www.hzwindpower.com/zongbuxinwen/20211220092246.html) |
| Guoxin Dafeng 850 MW · 850 MW · 2025 | 精選 | 修正：機組 | 國信大豐 85 萬千瓦：四個場址（H1#、H2#、H10#、H16#）共 100 部 8.5 MW，2025 年 12 月 29 日全容量併網（中國能建，2026-01；人民日報 2026-01-06）；2024 年 6 月風機標由金風科技預中標。原寫「明陽／金風 10–16 MW」 | [連結](https://www.ceec.net.cn/art/2026/1/6/art_11019_2537923.html) |
| Jiangsu Dafeng H1 (Guoxin) Offshore wind farm · 200 MW | GEM | 重複（併入「Guoxin Dafeng 850 MW」） | 國信大豐 85 萬千瓦（H1#、H2#、H10#、H16# 四個場址，100 部 8.5 MW）2025 年 12 月 29 日全容量併網；精選紀錄「Guoxin Dafeng 850 MW」已是整案，GEM 的四個場址紀錄重複（這筆是 H1#，200 MW） | [連結](https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml) |
| Jiangsu Dafeng H2 (Guoxin) Offshore wind farm · 300 MW | GEM | 重複（併入「Guoxin Dafeng 850 MW」） | 國信大豐 85 萬千瓦（H1#、H2#、H10#、H16# 四個場址，100 部 8.5 MW）2025 年 12 月 29 日全容量併網；精選紀錄「Guoxin Dafeng 850 MW」已是整案，GEM 的四個場址紀錄重複（這筆是 H2#，300 MW） | [連結](https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml) |
| Jiangsu Dafeng H10 (Guoxin) Offshore wind farm · 150 MW | GEM | 重複（併入「Guoxin Dafeng 850 MW」） | 國信大豐 85 萬千瓦（H1#、H2#、H10#、H16# 四個場址，100 部 8.5 MW）2025 年 12 月 29 日全容量併網；精選紀錄「Guoxin Dafeng 850 MW」已是整案，GEM 的四個場址紀錄重複（這筆是 H10#，150 MW） | [連結](https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml) |
| Jiangsu Dafeng H16 (Guoxin) Offshore wind farm · 200 MW | GEM | 重複（併入「Guoxin Dafeng 850 MW」） | 國信大豐 85 萬千瓦（H1#、H2#、H10#、H16# 四個場址，100 部 8.5 MW）2025 年 12 月 29 日全容量併網；精選紀錄「Guoxin Dafeng 850 MW」已是整案，GEM 的四個場址紀錄重複（這筆是 H16#，200 MW） | [連結](https://finance.sina.com.cn/jjxw/2025-03-13/doc-inepmwyy5251190.shtml) |
| SPIC Binhai South H3 · 300 MW · 2019 | 精選 | 修正：年份、機組、業主 | 國家電投濱海南 H3（300 MW）2020 年 12 月 31 日全容量併網，裝 75 台上海電氣 W4000-146（電氣風電，2024）；原寫 2019 年，業主欄誤為大唐／國信（來自被自動併入的大唐濱海紀錄） | [連結](http://windpower.cpem.org.cn/contents/31/1370.html) |
| Shandong Bohai B1 offshore wind farm · 500 MW | GEM | 修正：名稱、中文名、容量、機組 | 渤中 B 場址規劃 1,000 MW，山東能源負責西側 500 MW：其中 400 MW（47 部 8.5 MW）2022 年底已建成，是精選紀錄「Shandong Energy Bozhong B」；剩下的 100 MW 才是「渤中海上風電基地 B1 項目」（8 部 8.5 MW＋4 部 8 MW，接入已建的 B 場址升壓站），2024 年 10 月招標、2025 年 6 月國資委仍寫「正在建設、將於近期併網」。GEM 的 500 MW 把已建的 400 MW 重算一次，改為 100 MW 的續建案，維持興建中 | [連結](https://www.ne21.com/news/show-202646.html) |
| CGN Huizhou Gangkou I & II · 1,000 MW · 2021 | 精選 | 修正：機組 | 港口一 250 MW 為 40 部明陽 MySE6.25-180；港口二 750 MW 為 10 部 8.5 MW、45 部 12 MW、9 部 14 MW（含 PA、PB 兩案），全場共 104 部，2023 年 12 月 12 日全容量併網（新華社；CPEM）；原寫「明陽 6.45–8 MW」 | [連結](https://www.cpem.org.cn/list40/89386.html) |
| Guangxi Fangchenggang A · 700 MW · 2024 | 精選 | 修正：年份、機組 | 防城港海上風電示範項目 A 場址（83 部 8.5 MW、700 MW）2024 年 1 月首批併網，2025 年 2 月初才全容量併網（廣西日報 2025-02-08、國資委）；原寫 2024 年、機型「明陽 8–16 MW」 | [連結](http://www.gx.xinhua.org/20250208/489586cf99ff4ed8908866faa90a118f/c.html) |
| Zhuhai Guishan · 198 MW · 2018 | 精選 | 修正：年份、機組 | 桂山海上風電場總裝機 198 MW，2021 年 12 月才全容量併網（股東廣州發展新能源，世紀新能源網 2023）；一期 120 MW 為 34 部 3 MW 加 3 部 6 MW，「一期後續及二期」2020 年底才開工、2021 年 2 月首台併網。原寫 2018 年（只是首批風機併網）。二期 15 部（世紀新能源網 2021-02），機型欄原寫的「15 部 5.5 MW」沒有出處，二期機型待查證 | [連結](https://www.ne21.com/news/show-178370.html) |
| Putian Pinghai Bay Phase 2 · 246 MW · 2021 | 精選 | 修正：機組 | 平海灣二期建成 41 部 6 MW、246 MW（新開發銀行 2024 年評價、秀嶼區 2021-07）；上海電氣以西門子 SWT-6.0-154 拿下二期第一、二批風機採購（界面新聞 2017-10），GlobalData 也寫 41 部上海電氣 SWT-6.0-154。原寫「金風／湘電 5–6.45 MW」沒有出處（機型依採購結果與資料庫，沒有相反的出處） | [連結](https://www.ndb.int/wp-content/uploads/2024/09/Evaluation-Lens-Issue-8_China-Putian-Bay-Offshore_CN.pdf) |
| Putian Pinghai Bay Phase 3 · 308 MW · 2022 | 精選 | 修正：機組 | 平海灣三期 44 部 7 MW、308 MW（秀嶼區 2021-07）；2019 年兩批風機採購都由上海電氣以 SWT-7.0-154 得標（14＋30＝44 部，世紀新能源網轉北極星），GlobalData 也寫 44 部 SWT-7.0-154。原寫「金風／明陽 6.45–7 MW」沒有出處（機型依得標結果與資料庫，沒有相反的出處） | [連結](https://www.ne21.com/news/show-131941.html) |
| Changle Waihai C · 496 MW · 2021 | 精選 | 修正：座標 | OpenStreetMap 的風場範圍 way 1455417021 標名「长乐外海风电场C区」（依海事局航行通告 1131/2025 繪製），範圍北緯 25.817–25.891°、東經 119.950–120.049°，內有 53 部 OSM 風機；點位改為範圍中心（北緯 25.854°、東經 119.999°）。原點位 25.75 N、120.0 E 落在 A 區的範圍（way 1343837215）裡 | [連結](https://www.openstreetmap.org/way/1455417021) |
| CTG Fujian Changle Waihai A · 300 MW · 2021 | 精選 | 修正：座標 | OpenStreetMap 的風場範圍 way 1343837215 標名「长乐外海风电场A区」（依海事局航行通告 472/2025 繪製），範圍北緯 25.740–25.800°、東經 119.956–120.023°，內有 31 部 OSM 風機，北接 C 區、南接平潭外海（way 1391515683）；點位改為範圍中心（北緯 25.770°、東經 119.989°），原點位在其西北約 17 km | [連結](https://www.openstreetmap.org/way/1343837215) |
| Fujian Pingtan Straits Road/Railroad Bridge Illumination Project Offshore Distributed wind farm · 34 MW · 2021 | GEM | 修正：機組、容量 | 平潭海峽公鐵大橋照明工程分散式海上風電：EPC 中標公告（2020-08-27，永福股份公告，格隆匯轉載）寫明建設 33.5 MW、5 部 GW154-6.7MW（輪轂 103 m）；福州新聞網 2022-01 寫全容量併網、33.5 MW、5 部，與 5 × 6.7 MW 相符。機型依得標公告，沒有相反的出處；容量 34→33.5 MW | [連結](https://www.usmart.hk/en/news-detail/6704560855457054924) |
| Zhoushan Liuheng / Zhejiang others · 600 MW · 2022 | 精選 | 刪除 | 沒有出處的彙總（600 MW、「舟山六橫、嘉興 2 號等」、機型 mixed）：六橫島東南側海域的離岸風場就是國電舟山普陀 6 號 2 區（252 MW、63 部西門子 4 MW，國家能源集團 2020-06），已是精選紀錄「Guodian Zhoushan Putuo 6#2」；華能嘉興 2 號（杭州灣嘉興海域，300 MW、50 部 6 MW）也有 GEM 紀錄。這筆把兩座重複計算，其餘「等」查無對應 | [連結](https://www.ceic.com/gjnyjtww/chnyxfc/202006/e5a14799afc44f2a890f4e1784673ac0.shtml) |
| Fujian Putian Pinghaiwan Offshore wind farm · 814 MW · 2016 | GEM | 修正：名稱、中文名、容量、年份、分期、業主 | 莆田平海灣海上風電場 F 區：福建省發改委 2017 年核准 20 萬千瓦（福能股份公告），三川海上風電（福能新能源 51%、海峽發電 39%、廈門華夏 10%）投資；2021 年 7 月與石城風電場一起併網發電（人民法院報 2026-04）。GEM 這個場址另含一至三期（各有精選紀錄），只留 F 區；29 部風機的位置依福建省 2024 年用海批覆（見 2026-10-07 第六批），機型待查證 | [連結](https://www.court.gov.cn/zixun/xiangqing/497381.html) |
| Changle Waihai C · 496 MW · 2021 | 精選 | 修正：機組 | 福建中科環境檢測（受福建省福能海峽發電委託做長樂外海 C 區施工期跟蹤監測與竣工環保驗收）的案例頁：C 區安裝上海電氣 8 MW 37 台和東方電氣 10 MW 20 台，共 57 台、實際總裝機 496 MW；機型欄補上 8 MW 的廠牌（部數不變） | [連結](http://www.zhongkejc.net/case_detail-199.html) |
| CGN Xiangshan Tuci · 280 MW · 2023 | 精選 | 修正：容量、機組、座標 | 寧波海事局 2024-11-11 通航要素通告（甬航通〔2024〕0532 號）：中廣核象山塗茨海上風電場「已建成投用」，場區有 38 台單機 8 MW 風機，並列出 38 台的座標；點位改為這 38 點的平均（北緯 29.531°、東經 122.057°；原點在西方約 10 km）。容量依調整後核准的 300 MW（38 台 8 MW，變更海域使用論證報告） | [連結](https://www.msa.gov.cn/msacncms_wap/pages/content.jhtml?articleId=BBC12C15A2FE47E6AC5CEB280B1BC877) |
| Putian Pinghai Bay Area F (Sanchuan) · 200 MW · 2021 | GEM | 修正：座標、機組 | 福建省政府 2024-09-18 平海灣 F 區變更用海批覆（閩政海域〔2024〕27 號）附件的界址點 1–29 號是 29 台風機的圓心；點位改為這 29 點的平均（北緯 25.164°、東經 119.470°，南日島南側；GEM 的概略點在西方約 18 km）。F 區 2018-08-21 開工、2021-07-15 與石城一起竣工投產（人民網福建）。機型待查證（GlobalData 寫 29 台 SWT-7.0-154、203 MW，與官方 200 MW 不符），只寫台數 | [連結](https://zrzyt.fujian.gov.cn/zwgk/zfxxgkzl/zfxxgkml/hygl/202409/t20240929_6537863.htm) |
| Putian Shicheng · 200 MW · 2021 | 精選 | 修正：座標 | 福建省政府 2024-04-19 莆田石城海上風電場用海批覆：用海位於秀嶼區埭頭鎮石城村東北側，附件宗海界址點 954–982 號是 29 台風機的圓心點；點位改為這 29 點的平均（北緯 25.297°、東經 119.373°；原點 25.12°N、119.30°E 在南方約 21 km） | [連結](https://zrzyt.fujian.gov.cn/zwgk/zfxxgkzl/zfxxgkml/hygl/202404/t20240423_6439224.htm) |
| CTG Yangjiang Shapa Phase 2 · 400 MW · 2021 | 精選 | 修正：機組 | 沙扒二期海域使用補充論證報告書（陽江市自然資源局，建成後）：62 台 6.45 MW，機型為明陽 MySE6.45-180 與金風 GW171/6450 兩種，2021-11-27 最後一台併網；兩種機型各幾台報告沒寫，機型欄改為兩種並列（原寫 62 台全為明陽） | [連結](http://www.yangjiang.gov.cn/yjzrzy/attachment/0/58/58162/731643.pdf) |
| Shandong Bandaonan U2 (Guohua) Offshore wind farm · 603.5 MW | GEM | 修正：狀態、年份、機組 | 山東半島南 U 場址（150 萬瓩，含國家電投 U1 的 90 萬瓩與國家能源集團 U2 的 60 萬瓩，共 177 台）2024-10-26 實現全容量併網（威海市委對外宣傳辦經澎湃新聞 2024-10-29；山東 2024-12 報導同）；國家能源集團 2025-09：U2 安裝 71 台 8.5 MW、603.5 MW（機型為遠景 EN226-8.5，世紀新能源網的專案介紹）。改為營運中 2024 年。中證鵬元 2025-06 評級報告把 U2 列在「截至 2024 年末在建、擬建項目」，應是會計上尚未結轉 | [連結](https://m.thepaper.cn/newsDetail_forward_29177936) |

## 丹麥 (DNK)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Vesterhav Offshore wind farm · Nord · 180 MW · 2024 | GEM | 重複（併入「Vesterhav Nord」） | 同一座風場 | [連結](https://powerplants.vattenfall.com/vesterhav-nord/) |
| Vesterhav Nord · 176.4 MW · 2024 | 精選 | 修正：座標 | 座標改到 Thyborøn 與 Ferring Sø 之間的外海（原座標偏南約 20 km） | [連結](https://powerplants.vattenfall.com/vesterhav-nord/) |
| Rønland · 17.2 MW · 2003 | 精選 | 修正：容量、機組、座標 | 丹麥能源署：羅恩蘭海上風場現在只有南側 4 部（9.2 MW）；北側 4 部 Vestas V80 因 Thyborøn 港擴建已與陸地相連（2003 年起原為 8 部、17.2 MW）。座標改到南側 4 部的中心（OpenStreetMap 關係「Rønland Vindmøllepark」） | [連結](https://ens.dk/energikilder/etablerede-havvindmoelleparker) |
| Frederikshavn · 7.6 MW · 2003 | 精選 | 修正：容量、機組、座標 | 丹麥能源署：2003 年在海上設 3 部（7.6 MW），港口擴建後兩部已與陸地相連，海上只剩 1 部 2.3 MW；OpenStreetMap 標為離岸的是 Nordex N90/2300（Bonus 2.3 MW 與 Vestas V90 已在陸上），座標改到這部風機 | [連結](https://ens.dk/energikilder/etablerede-havvindmoelleparker) |

## 伊朗 (IRN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Siahpoush (Manjil) wind farm · 48 MW | GEM | 重複（併入「Manjil wind farm」） | Manjil 風場群（Manjil、Rudbar、Harzevil、Siahpoush，共 92.2 MW）中的 Siahpoush 區 | [連結](https://en.wikipedia.org/wiki/Manjil_and_Rudbar_Wind_Farm) |
| Harzvil wind farm · 14 MW | GEM | 重複（併入「Manjil wind farm」） | Manjil 風場群中的 Harzevil 區 | [連結](https://en.wikipedia.org/wiki/Manjil_and_Rudbar_Wind_Farm) |
| Manjil wind farm · 93 MW | GEM | 修正：容量 | Manjil 風場群合計 92.2 MW，1995 年起分期興建、2015 年完工 | [連結](https://en.wikipedia.org/wiki/Manjil_and_Rudbar_Wind_Farm) |
| Binalood wind farm · 28 MW · 2017 | GEM | 修正：年份 | 2008 年啟用（43 × 660 kW） | [連結](https://en.wikipedia.org/wiki/Binalood_Wind_Farm) |
| Tizbaad wind farm · 100 MW · 2019 | GEM | 修正：狀態、年份 | 查無運轉證據：伊朗再生能源署（SATBA）2025 年 11 月底分省資料，整個禮薩呼羅珊省（含 28 MW 的 Binalood）風電只有 51.30 MW，容不下 Khaf 縣 100 MW 的 Tizbaad；2020 年 10 月全國風電僅 302.82 MW；2024 年 6 月 50 MW 的 Mil Nader 仍被稱為伊朗東部目前最大的風場。GEM 的「2019 年營運中」只根據開發商網站。改為施工前、年份不詳（確認從未興建後再刪除） | [連結](https://www.ice.it/it/news/notizie-dal-mondo/297574) |

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
| Jwasari Offshore wind farm · 360 MW · 2031 | GEM | 修正：狀態、年份、容量、座標 | 還在環評階段（2025 年 3 月舉行環評初稿公聽會），規劃已改為 360 MW（24 部 15 MW）；2026 年 9 月查證時仍無開工或競標得標紀錄（環評初稿的工期是 2028 年 3 月至 2031 年 9 月），不採 GEM 的「興建中」。場址在慶尚南道統營市欲知面左沙里島一帶海域，不在全羅南道麗水外海：座標改為左沙里島（概略位置） | [連結](https://www.hansannews.com/news/articleView.html?idxno=95554) |
| Yeonggwang Wind offshore wind farm · 35 MW · 2018 | GEM | 修正：容量、機組、座標 | 靈光風電（35 部、79.6 MW）中立在潮間帶的 15 部 2.3 MW＝34.5 MW（電子新聞 2020-02）；座標改為 OpenStreetMap 風場關係「영광 해상풍력」（relation 17551812：營運者영광풍력발전的 15 部 2.3 MW）的中心，北緯 35.259°、東經 126.326°（© OpenStreetMap 貢獻者）；GEM 原座標是公司登記地址 | [連結](https://www.openstreetmap.org/relation/17551812) |
| YEP wind farm · 76 MW · 2017 | GEM | 修正：名稱、中文名、年份、機組 | 韓華建設的英陽風場 76 MW、22 部 3.45 MW 級，2020 年完工（易投資日報 2021 年 1 月：「去年完工」）；GEM 寫 2017 年 | [連結](https://www.etoday.co.kr/news/view/1988572) |
| Yeongyang 2nd wind power generation · 42 MW · 2022 | GEM | 修正：中文名、年份、機組 | 英陽第二風場 42 MW、10 部 4.2 MW 級，2023 年 5 月起商業運轉（GEM 寫 2022 年，那是試運轉） | [連結](https://www.fnnews.com/news/202309241852426048) |
| Ulsan Dongbu floating demo (Vindmøllen 750 kW) · 0.8 MW · 2020 | 精選 | 刪除 | 蔚山 750 kW 浮動式示範機從未在海上安裝：2019 年 11 月蔚州郡四度退回細部設計、無法下海；2025 年政府的風電研發企畫報告說 750 kW 浮動式實證「曾嘗試」、因取得實證海域困難而受阻，2025 年 9 月 KISTEP 報告說韓國沒有浮動式離岸風電的運送安裝實例 | [連結](https://www.kistep.re.kr/boardDownload.es?bid=0067&list_no=94369&seq=1) |

## 台灣 (TWN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Zhong Neng · 298 MW · 2024 | 精選 | 修正：年份、容量 | 31 部風機 2024 年 8 月全數安裝併網，2025 年 4 月取得電業執照正式商轉；獲配容量 300 MW，實際裝置 31 部 × 9.5 MW＝294.5 MW | [連結](https://www.csc.com.tw/csc/esg/env/env2_1.html) |
| Taipower Offshore Phase 1 (Changhua) · 109.2 MW · 2021 | 精選 | 修正：機組、座標 | 機組是日立 HTW5.2-127（葉片 127 m），不是 HTW5.2-136。位置：台電只寫「芳苑外海 7.2–8.7 km」，改用 OpenStreetMap 標出的 21 部風機的中心（23.986 N、120.242 E，© OpenStreetMap 貢獻者）；原座標 24.05 N、120.35 E 在海岸邊，與官方的離岸距離不符 | [連結](https://www.openstreetmap.org/relation/15992407) |
| Formosa 3 offshore wind farm · 2 · 600 MW · 2027 | GEM | 刪除 | 這是海鼎二（3.1 期獲配 600 MW），Corio 退出後已解約，能源署 2026 年把海峽一、海峽二與海鼎二的解約場址納入 3.3 期擴充容量；GEM 的中文名誤寫為海鼎一 | [連結](https://www.cna.com.tw/news/afe/202609300338.aspx) |
| Datian Youde Offshore wind farm · 700 MW · 2029 | GEM | 修正：業主 | 又德在 3.2 期獲配 700 MW、預計 2029 年併網，開發商是森崴能源（Shinfox）；GEM 的業主 wpd 與「達天」是舊資料（達天 3.1 期只獲配 165 MW、未簽約，2023 年取消）。2026 年 8 月能源署表示業者未繳足履約保證金、正在簽報解約 | [連結](https://news.cts.com.tw/cna/money/202608/202608243070944.html) |
| Hai Long 2 & 3 · 1,044 MW · 2026 | 精選 | 修正：年份 | Northland 2026 年第二季報告：73 部已裝 71 部、59 部發電，全案商轉預計 2027 年 | [連結](https://northlandpower.com/northland-power-reports-second-quarter-2026-results-and-construction-progress-updates/) |
| Taipower Offshore Phase 2 · 294 MW · 2026 | 精選 | 修正：年份 | 2026 年 6 月經濟部長表示整體進度逾九成、只剩風機安裝，盼年底裝完、2027 年上半年併聯；10 月台電表示已接管船隊安裝風機、目標年底完工 | [連結](https://www.cna.com.tw/news/afe/202606170184.aspx) |
| Greater Changhua 2b & 4 · 920 MW · 2026 | 精選 | 修正： | 2b（337.1 MW，台電即時資料的「沃南風」）2026-09-18 起列入台電裝置容量（試運轉結束）；4（583 MW，「沃四風」）至 2026-10-06 仍標示註10（試運轉、暫不計入裝置容量），全案尚未全面商轉 | [連結](https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json) |
| Greater Changhua 2b & 4 · 920 MW · 2026 | 精選 | 修正：業主 | 沃旭：583 MW 的大彰化西北（4）由沃旭與國泰人壽各持有 50%；原寫沃旭 100% | [連結](https://orsted.com/en/media/news/2026/09/orsted-hosts-completion-ceremony-for-920-mw-greate-15125521) |
| Taipower Offshore Phase 2 · 294 MW · 2027 | 精選 | 修正：容量 | 31 部 9.5 MW 風機、共 294.5 MW；原寫 294 MW | [連結](https://technews.tw/2022/11/03/taipower-offshore-wind2/) |
| Taipower Offshore Phase 2 · 294.5 MW · 2027 | 精選 | 修正： | 31 座水下基礎與海纜都已完工；台電船機 2026-09-28 出海裝機（原訂 9/25），31 部風機已裝 1 部，台電力拚年底前完工、2027 年上半年併聯 | [連結](https://www.cna.com.tw/news/afe/202610020045.aspx) |
| Taoyuan Luzhu · 33.6 MW · 2025 | 精選 | 修正：容量、年份、機組 | 台電發電站清單與能源署單一窗口都只有蘆竹 8 部 Enercon E44（0.9 MW），共 7.2 MW，查無 33.6 MW 的新建或汰舊換新計畫；2015 年 2 月 2 日完工併聯商轉（維基百科）。原本的 33.6 MW、2025 年是估計值 | [連結](https://service.taipower.com.tw/data/opendata/apply/file/d693002/001.csv) |
| Taichung Power Plant · 8 MW · 2005 | 精選 | 修正：容量、機組 | 台中電廠原有 4 部 Zephyros Z72；2008 年薔蜜颱風吹倒台中港區一部後，從電廠移 1 部（P01）去補，電廠剩 3 部；2016 年台電因中龍鋼鐵等建物擋風，再移 2 部到高美濕地第 1 排補蘇迪勒颱風（2015）吹毀的機組，電廠只剩 1 部（2 MW）。台電 2026 年發電站清單與能源署單一窗口都是 1 部 | [連結](https://news.ltn.com.tw/news/life/breakingnews/1618036) |
| Taichung Port · 36 MW · 2006 | 精選 | 修正：容量、機組 | 高美濕地旁原有 18 部 Zephyros Z72（前排 10、後排 8）。2008 年薔蜜颱風吹斷 2 號機，由台中電廠移 1 部補上；2015 年蘇迪勒颱風吹倒 6 部（前後排各 3 部），台電 2016 年從台中電廠移 2 部補前排、後排的空缺另行新購；2016 年梅姬颱風又吹斷 12 號機葉片。台電 2026 年發電站清單：Z72 剩 13 部（共少了 7 部），另有 3 部 Enercon E82 E4，共 16 部 35 MW（能源署單一窗口同） | [連結](https://news.ltn.com.tw/news/life/breakingnews/1618036) |
| Taichung Power Plant · 2 MW · 2005 | 精選 | 修正：年份 | 監察院 2010 年調查報告（台電「風力發電第一期計畫臺中電廠及臺中港區風力發電機組及附屬設備採購帶安裝案」）：臺中電廠 4 部機組於 95 年（2006 年）6 月 1 日開始商業運轉；95 年 1 月已在做 24 小時負載測試，95 年 10 月首次 500 小時定檢時各機已運轉 1,197–2,169 小時；發電業執照 96 年 4 月 20 日核發。年份由 2005 改為 2006 | [連結](https://cybsbox.cy.gov.tw/CYBSBoxSSL/edoc/download/46805) |
| Taichung Port · 35 MW · 2006 | 精選 | 修正：年份 | 同一份監察院調查報告：台中港區 18 部 Zephyros Z72 自 96 年（2007 年）1 月 5 日起陸續商業運轉，97 年（2008 年）7 月 19 日全數商轉（96 年 5 月仍有 11 部未商轉）。年份由 2006 改為 2007 | [連結](https://cybsbox.cy.gov.tw/CYBSBoxSSL/edoc/download/46805) |
| Wanggong · 20 MW · 2011 | 精選 | 修正：容量、機組 | 台電發電站清單：彰化王功 10 部 Enercon E70，共 23 MW（不是 10 部 Vestas V80、20 MW） | [連結](https://service.taipower.com.tw/data/opendata/apply/file/d693002/001.csv) |
| Datan (Tatan) · 12.5 MW · 2005 | 精選 | 修正：容量、機組 | 大潭：2005 年 6 月 3 部 GE 1.5se 商轉，2011 年 7 月擴建 3 部 Vestas V80 2 MW 與 2 部 Enercon E70 2.3 MW（共 8 部 15.1 MW）；#3（GE 1.5se）2025 年 6 月 20 日變更電業執照除役，剩 7 部 13.6 MW（台電簡明月報、能源署單一窗口；台電發電站清單的 15.1 MW 是除役前的數字） | [連結](https://www.taipower.com.tw/media/1f4ew1jr/11508%E7%B0%A1%E6%98%8E%E6%9C%88%E5%A0%B1.pdf) |
| Yongxing (Fangyuan) · 16.8 MW · 2024 | 精選 | 修正：容量、機組、年份 | 台電發電站清單：彰化永興 4 部 Enercon E70，共 9.2 MW（原本的 16.8 MW、4.2 MW 機組是估計值）；台電簡明月報：2019 年 10 月併聯試運轉，2020 年 12 月 28 日商轉（原本寫 2024 年） | [連結](https://www.taipower.com.tw/media/yizfvrbn/10912%E7%B0%A1%E6%98%8E%E6%9C%88%E5%A0%B1.pdf) |
| Yunlin Taixi · 16.8 MW · 2024 | 精選 | 修正：容量、機組 | 台電發電站清單：雲林台西 4 部 Enercon E70 E4，共 9.2 MW，113 年（2024 年）10 月 24 日併聯、試運轉中（原本的 16.8 MW 是估計值） | [連結](https://service.taipower.com.tw/data/opendata/apply/file/d693002/001.csv) |
| Penghu Longmen · 6.9 MW · 2023 | 精選 | 修正：容量、機組、年份 | 台電發電站清單與能源署單一窗口：澎湖龍門 3 部 Enercon E82 E4，共 9 MW（原本的 6.9 MW 是估計值）；3 部風機 2019 年完工，台電簡明月報寫 2022 年 6 月 1 日併聯、試運轉到 2024 年 8 月（原本寫 2023 年，改用併聯發電的 2022 年） | [連結](https://www.taipower.com.tw/media/11zda1gx/11308%E7%B0%A1%E6%98%8E%E6%9C%88%E5%A0%B1.pdf) |
| Penghu Zhongtun · 4.8 MW · 2001 | 精選 | 修正：狀態、除役年 | 中屯 8 部風機運轉逾 20 年、無備品，台電 2023 年起辦理除役更新；更新計畫 2024 年 8 月通過環評但因地方反對暫緩，8 部風機 2025 年 11 月前拆除完成（自由時報 2025-11-15） | [連結](https://news.ltn.com.tw/news/life/breakingnews/5246753) |
| Formosa 3 offshore wind farm · 3 · 720 MW | GEM | 刪除 | 海鼎（Formosa 3）計畫已終止：Corio 2025 年決定退出台灣，經濟部 2025 年 5 月前解除海鼎一（3.2 期）開發權，海鼎二（3.1 期）也已解約、2026 年併入 3.3 期擴充容量；Infralogic 2026-02：與道達爾能源共有的 Formosa 3 開發權 2025 年已取消，Corio 本身 2026-04-01 起不存在。海鼎三從未獲配容量，已無開發商 | [連結](https://ionanalytics.com/insights/infralogic/macquarie-winds-down-offshore-platform-corio/) |
| Formosa 1 Phase 1 · 8 MW · 2017 | 精選 | 修正：機組 | 機組是西門子 SWT-4.0-120（葉輪直徑 120 m）：營運商沃旭 2019 年簡報列「4MW Siemens SWT 4.0-120」，西門子歌美颯 2018 年 1 月簡報的已安裝實績（統計至 2017 年 11 月）也列「Formosa: 2x SWT-4.0-120」；西門子歌美颯 2018 年 4 月新聞稿寫的 SWT-4.0-130 與這兩份不符，不採用 | [連結](https://www.asiawind.org/wp-content/uploads/2019/10/01-ORSTED-ULRIK-LANGE.pdf) |

## 哥倫比亞 (COL)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Vientos De Galerazamba wind farm · 69.9 MW · 2020 | GEM | 修正：狀態、年份 | 仍是規劃案，未見施工或商轉 | [連結](https://www.bnamericas.com/en/project-profile/wind-farm-winds-galerazamba) |
| WESP 01 wind farm · 12 MW | GEM | 修正：年份 | 2022 年加入運轉（ISAGEN，與 Guajira I 相鄰） | [連結](https://www.valoraanalitik.com/2022/01/19/extension-guajira-1-wesp-01-operacion-julio-2022/) |
| El Morro wind farm · 8 MW | GEM | 刪除 | 查無此風場；Grupo Argos 旗下唯一的風場是 2025 年在大西洋省啟用的 Carreto（9.6 MW） | [連結](https://www.eltiempo.com/colombia/barranquilla/el-atlantico-entra-a-la-era-de-la-energia-eolica-con-el-primer-parque-de-celsia-en-colombia-3460285) |
| Carreto wind farm · 9.9 MW | GEM | 修正：狀態、年份、容量、機組 | Celsia 的 Carreto 風場（大西洋省）9.6 MW、2 部 4.8 MW，2025 年 6 月完工、當月投入運轉（Celsia 2025 年成果：Carreto 風場投入運轉）；GEM 寫 9.9 MW、興建中 | [連結](https://www.eltiempo.com/colombia/barranquilla/el-atlantico-entra-a-la-era-de-la-energia-eolica-con-el-primer-parque-de-celsia-en-colombia-3460285) |

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
| Esperanza (Dominican Republic) wind farm · 50 MW · 2026 | GEM | 修正：狀態、年份、容量、機組、業主 | EGE Haina 的 Esperanza 風場 49.5 MW、11 部 Vestas V163-4.5 MW，2025 年開始運轉（2026 年 5 月與光電場一起舉行啟用典禮）；這就是本站逐場加總比 IRENA 少的約 50 MW | [連結](https://www.egehaina.com/Centrales?name=esperanzarenovable) |
| Esperanza wind farm (Dominican Republic) · 50 MW | GEM | 重複（併入「Esperanza (Dominican Republic) wind farm」） | 同一座風場（GEM 兩筆都是 EGE Haina 的 Esperanza 風場、50 MW；這筆座標只是概略位置） | [連結](https://www.egehaina.com/Centrales?name=esperanzarenovable) |
| Larimar wind farm · 98 MW · 2016 | GEM | 修正：容量、分期、機組 | 兩期：2016 年 3 月 15 部 Vestas V112-3.3（49.5 MW）、14 部 V117-3.45（48.3 MW），共 97.8 MW（EGE Haina） | [連結](https://www.egehaina.com/Centrales?name=Larimar) |

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
| Windanker wind farm · 300 MW · 2026 | GEM | 修正：容量、年份 | 容量 315 MW（21 部風機），不是 300 MW；2026 年 6 月才開始安裝風機，預計年底完工、2027 年全面運轉 | [連結](https://www.offshorewind.biz/2026/06/10/windanker-turbine-components-arriving-at-german-port-ahead-of-offshore-installation/) |
| Flomborn-Stetten wind farm · 15 MW · 2013 | GEM | 修正：座標 | BVT 集團的 Flomborn／Stetten 風場就是 MaStR 的「BVT Windpark Flomborn/Stetten」：5 部 3,075 kW、2013 年 12 月併網（SEE970097431950、SEE972537071986、SEE986793983570、SEE978061015458、SEE997638951548），位於 Alzey-Worms 縣 Flomborn；GEM 的座標在東北方約 25 km 外，改到這 5 部的中心 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Dreiberg wind farm · 60 MW · 1995 | GEM | 重複（併入「Windpark Druiberg (Dardesheim)」） | 同一座風場：GEM 的「Dreiberg」是 Dardesheim 的 Druiberg 風場拼錯，GEM 座標（51.990, 10.833）正是德文維基 Windpark Druiberg 的座標 | [連結](https://de.wikipedia.org/wiki/Windpark_Druiberg) |
| Windpark Druiberg (Dardesheim) · 62 MW · 1994 | 精選 | 修正：座標 | 座標改到 Druiberg 山上的風場（德文維基：北緯 51°59′23″、東經 10°50′0″；原座標是 Dardesheim 鎮） | [連結](https://de.wikipedia.org/wiki/Windpark_Druiberg) |
| Gohlocher Wald wind farm · 12 MW · 2018 | GEM | 修正：容量、機組 | Gohlocher Wald 風場在 Lebach，是 2 部 Nordex N131/3000、6 MW（GEM 寫 12 MW）；與 Püttlingen 的 Schwalbach 風場（4 部 E-115、12 MW）是不同風場 | [連結](https://www.energy3k.com/wp-gow-erste-kwh/) |
| Oederquart wind farm · 16 MW · 2019 | GEM | 修正：容量、機組 | Bürgerwindpark Oederquart 的 Seeweg 風場：7 部 Enercon E-115 E2（3.2 MW），共 22.4 MW，2019 年併網（GEM 寫 16 MW） | [連結](https://www.investmentcheck.de/produkt/buergerwindpark-oederquart/) |
| Streumen wind farm · 13 MW · 2016 | GEM | 修正：容量、機組 | Streumen/Glaubitz II 汰換案：2016 年、4 部 Vestas V126，13.2 MW（業者 Energieanlagen FB；GEM 也列 Glaubitz RI 為別名） | [連結](https://www.energie-fb.de/referenzen/) |

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
| Sormarkfjellet wind farm · 130.2 MW · 2021 | GEM | 修正：機組 | 31 部 Vestas V117、每部 4.2 MW（業主 Aneo 專案頁） | [連結](https://www.aneo.com/en/projects/sormarkfjellet-wind-farm) |

## 摩洛哥 (MAR)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Tarfaya wind farm · 300 MW · 2014 | GEM | 重複（併入「Tarfaya」） | 同一座塔爾法亞風場（300／301 MW、2014 年）：GEM 把它放在北部的得土安省，但這座風場在南部、距塔爾法亞 20 km，131 部 2.3 MW、共 301 MW（英文維基） | [連結](https://en.wikipedia.org/wiki/Tarfaya_Wind_Farm) |
| Tarfaya · 301 MW · 2014 | 精選 | 修正：業主 | 業主是 ENGIE 與 Nareva 各半的合資公司（Tarec）；併入的 GEM 紀錄寫 ONEE，屬於它誤放在得土安的資料 | [連結](https://en.wikipedia.org/wiki/Tarfaya_Wind_Farm) |
| Tangier wind farm · 140 MW · 2009 | GEM | 重複（併入「Tanger I (Dhar Saadane / Beni Mejmel)」） | 同一座丹吉爾一號風場（140 MW）：GEM 的別名就是 Parc Eolien De Tanger I，分期為 Dhar Saadane 與 Bni Majmel | [連結](https://www.gem.wiki/Tangier_wind_farm) |
| Akhfenir wind farm · 202 MW · 2014 | GEM | 重複（併入「Akhfennir I-II」） | 同一座阿赫費尼爾風場（Akhfennir I、II，約 200 MW，在塔爾法亞省） | [連結](https://www.gem.wiki/Akhfenir_wind_farm) |
| Akhfennir I-II · 200 MW · 2013 | 精選 | 修正：座標 | 座標改到 GEM 的精確位置（塔爾法亞省阿赫費尼爾）；原座標偏西北約 17 km，近景對不到 OpenStreetMap 標出的風機 | [連結](https://www.gem.wiki/Akhfenir_wind_farm) |
| Akhfennir I-II · 200 MW · 2013 | 精選 | 修正：分期、機組 | 阿赫費尼爾一期（101.87 MW、61 部 Alstom ECO 74）2013 年投入運轉：Nareva 執行長 2013-02 說 1 月起已有風機運轉、6 月全部投運；晨報 2014 寫「2013 年起運轉」，GlobalData 寫 2013 年 6 月投運；GEM 的 2014 不對。二期為 56 部 GE 1.7-100（GE 2014-09 合約）；原機型欄「Siemens Gamesa」不對 | [連結](https://lematin.ma/express/2014/energie-eolienne_tarfaya-abrite-le-premier-parc-en-afrique/200878.html) |

## 日本 (JPN)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Fukushima FORWARD floating demo · 14 MW · 2013 | 精選 | 修正：分期 | 三部浮動式機組：2013 年 11 月 2 MW（半潛式）、2015 年 12 月 7 MW（V 型半潛式）、2017 年 2 月 5 MW（單柱式）開始運轉；7 MW 於 2018 年決定停機、2020 年撤除，其餘兩部 2021 年 2 月起撤除 | [連結](https://www.fukushima-forward.jp/reference/pdf/study086.pdf) |
| Goto City Offshore floating project · 16.8 MW · 2026 | 精選 | 修正：中文名、狀態、年份 | 2026 年 1 月 5 日開始商轉（8 部 2.1 MW，五島洋上風場）；時間軸「2026（最新可得）」起列為營運中 | [連結](https://www.toda.co.jp/news/2026/20260105_006181.html) |
| Kyushu floating wind farm · 1,000 MW | GEM | 重複（併入「Kyushu - GIP floating wind farm」） | 同一個規劃案（Skyborn，1 GW，五島外海）；GEM 有兩筆 | [連結](https://www.gem.wiki/Kyushu_floating_wind_farm) |
| Kamis Offshore wind farm · 30 MW · 2010 | GEM | 刪除 | GEM 把神栖一期（2010 年 14 MW）與二期（2013 年 16 MW）合成一筆，本站兩期各有紀錄 | [連結](https://www.gem.wiki/Kamis_Offshore_wind_farm) |
| Kamisu Phase 1 (Wind Power Ibaraki) · 14 MW · 2010 | 精選 | 修正：座標 | 一期在南濱外海（神栖市資料）；原座標在內陸約 1.5–2 km，改用 OpenStreetMap 的風機位置（概略位置） | [連結](https://www.city.kamisu.ibaraki.jp/shisei/machi/1007515/1002412.html) |
| Kamisu Phase 2 · 16 MW · 2013 | 精選 | 修正：座標 | 二期在北濱外海、位於一期北邊（原座標在一期南邊的內陸，南北顛倒）；改用 OpenStreetMap 的風機位置（概略位置） | [連結](https://www.city.kamisu.ibaraki.jp/shisei/machi/1007515/1002412.html) |
| Setana semi-offshore · 1.2 MW · 2004 | 精選 | 修正：除役年 | 因故障與老化停機（確切停機時間待查證，2025 年 7 月已報導決定撤除）；瀨棚町 2026 年 4 月決定 2027 年度撤除 | [連結](https://www.hokkaido-np.co.jp/article/1305209/) |
| Setana semi-offshore · 1.2 MW · 2004 | 精選 | 修正：座標 | 座標改到瀨棚港東外防波堤內側的風機位置（OpenStreetMap，概略位置；原座標偏東北約 1 km） | [連結](https://www.khi.co.jp/pressrelease/detail/c3040209-1.html) |
| Kitakyushu Offshore Demonstration (NEDO/J-Power) · 2 MW · 2013 | 精選 | 修正：除役年 | 2019 年 9 月撤除風機與上部結構（10 月起以 SEP 船施工），不是 2023 年；重力式底版留作 J-POWER 的研究設施 | [連結](https://www.jpower.co.jp/oshirase/2019/10/oshirase191001.html) |
| Kitakyushu Hibikinada · 220 MW · 2026 | 精選 | 修正：機組、狀態、年份 | 2026 年 3 月 2 日開始商業運轉（25 部 9.6 MW，併網上限 220 MW）；時間軸「2026（最新可得）」起列為營運中 | [連結](https://www.jpower.co.jp/english/news_release/pdf/news260302e.pdf) |
| Eurus Akita Port semi-offshore · 3 MW · 2015 | 精選 | 修正：座標 | 這 1 部屬ユーラス秋田港ウインドファーム，在秋田市向濱；原座標落在秋田港洋上風場上，改為向濱的概略位置 | [連結](https://www.fuji-gab-mesh.co.jp/zisseki/zissekidetail/tikutei24.html) |
| Hokkaido Ishikari Bay Offshore wind farm · 1,000 MW | GEM | 修正：狀態 | 不是興建中：丸紅的石狩灣專案只有 2021 年 2 月的計畫階段環境配慮書，海域尚未指定為促進區域 | [連結](https://www.meti.go.jp/policy/safety_security/industrial_safety/sangyo/electric/detail/furyoku_hokkaidoishikariwan.html) |
| Kakegawa wind farm · 14 MW · 2020 | GEM | 修正：容量、機組 | 靜岡縣環評：掛川風力發電事業變更為 6 部 2,300 kW 級、13,800 kW（日本風力開發，2020 年運轉） | [連結](https://www.pref.shizuoka.jp/kurashikankyo/kankyo/assessetc/1002648/1017974.html) |
| Choshi Offshore Demonstration (NEDO/TEPCO) · 2.4 MW · 2019 | 精選 | 修正：座標 | 仍在運轉（2026 年 9 月報導：實證風車沒有撤除，2019 年轉為商轉後至今持續運轉）；座標改為東京電力 RP 公布的風車位置（北緯 35°40′54″、東經 140°49′13″，世界測地系；原座標偏東北約 3 km） | [連結](https://www.mlit.go.jp/sogoseisaku/ocean_policy/content/001388008.pdf) |

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
| Les Éoliennes Flottantes du Golfe du Lion (EFGL) · 30 MW · 2025 | 精選 | 修正：狀態、年份、業主 | 2026 年 5 月開始發電、7 月全面運轉，業主是 Ocean Winds 與 Banque des Territoires；時間軸「2026（最新可得）」起列為營運中 | [連結](https://www.renewableenergymagazine.com/wind/ocean-winds-reaches-full-power-from-first-20260717) |
| Eolmed Floating wind farm · 30 MW | GEM | 重複（併入「EolMed (Gruissan)」） | 同一座風場（Gruissan 外海，30 MW） | [連結](https://www.gem.wiki/Eolmed_Floating_wind_farm) |
| EolMed (Gruissan) · 30 MW · 2025 | 精選 | 修正：狀態、年份 | 2026 年 4 月開始發電、5 月全面運轉；時間軸「2026（最新可得）」起列為營運中 | [連結](https://www.bw-ideol.com/en/eolmed-project) |
| Provence Grand Large · 25 MW · 2024 | 精選 | 修正：機組 | 機組是西門子歌美颯 SWT-8.0-154（以 8.4 MW 運轉，葉片 75 m），不是 Vestas；RTE 專案文件寫明選用 SWT-8.0-154，SBM 寫 3 座浮動機組安裝完成 | [連結](https://www.sbmoffshore.com/newsroom/sbm-offshore-announces-successful-installation-3-floating-wind-units/) |

## 波蘭 (POL)

| 紀錄 | 來源 | 動作 | 理由 | 出處 |
|---|---|---|---|---|
| Baltic Power Offshore wind farm · 1,200 MW · 2026 | GEM | 修正：容量 | 76 部 15 MW 風機、共 1,140 MW（Northland 寫約 1.1 GW），不是 1,200 MW；2026 年 7 月首度發電，第二季末 76 部已裝 61 部，預計 2026 年下半年商轉 | [連結](https://northlandpower.com/northland-power-reports-second-quarter-2026-results-and-construction-progress-updates/) |

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
| Rye Park · 327 MW · 2024 | 精選 | 修正：容量、機組 | Rye Park 是 66 部 Vestas V162-6.2（以 6.0 MW 模式運轉），共 396 MW（Vestas 2021 年訂單新聞稿；AEMO 登記容量同），不是 327 MW | [連結](https://vestas.com/en/media/company-news/2021/vestas-wins-396-mw-enventus-order-for-wind-project-in-a-c3407249) |
| Cullerin Range wind farm · 26 MW · 2009 | GEM | 修正：容量、機組 | Cullerin Range 是 8 部 Senvion MM82 2 MW 加 7 部 MM92 2.05 MW，共 30 MW（英文維基；AEMO 登記容量 30 MW），不是 26 MW | [連結](https://en.wikipedia.org/wiki/Cullerin_Range_Wind_Farm) |
| Lal Lal · 228 MW · 2021 | 精選 | 修正：機組 | Lal Lal 的 60 部是 Vestas V136-3.45 平台、每部 3.8 MW（共 228 MW，英文維基），原寫「V136 3.6」與容量不符 | [連結](https://en.wikipedia.org/wiki/Lal_Lal_Wind_Farm) |
| Gullen Range wind farm · 165 MW · 2014 | GEM | 修正：容量、機組 | 73 部金風（56 部 GW100-2.5MW＋17 部 GW82-1.5MW），165.5 MW，2014 年 12 月全部運轉（風場年度環境報告） | [連結](https://gullenrangewindfarm.com/wp-content/uploads/2025/03/NGRWF-Annual-Environmental-Management-Report_2024-signed.pdf) |

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
| Crucea Nord · 108 MW · 2015 | 精選 | 修正：年份 | Crucea Nord（Crucea 鄉，108 MW）由 STEAG 開發，2014 年啟用（Transelectrica 風場清單的整理） | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |

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
| Shiloh · 300 MW · 2006 | 精選 | 修正：容量、分期、機組、業主 | Shiloh 共四期 505 MW：I 期 2006 年 4 月 150 MW（100 部 GE 1.5 MW，Iberdrola）、II 期 2009 年 1 月 150 MW（75 部 REpower MM92）、III 期 2011 年 12 月與 IV 期 2012 年 12 月各 102.5 MW（各 50 部 REpower 2.05 MW，II–IV 期屬 EDF）。建置把 GEM 四期 504 MW 的紀錄併進這筆 300 MW，III、IV 期因此不見；與 SMUD 的 Solano 是不同風場 | [連結](https://en.wikipedia.org/wiki/Shiloh_Wind_Power_Plant) |
| Dempsey Ridge Wind Farm · 132 MW · 2012 | WRI GPPD | 重複（併入「Big Smile wind farm」） | 同一座風場：Acciona 的 Dempsey Ridge 風場 2012 年改名為 Big Smile Wind Farm at Dempsey Ridge（132 MW，奧克拉荷馬州） | [連結](https://www.windpowerengineering.com/oklahoma-wind-farm-begins-operation-new-name/) |
| Revolution Wind · 704 MW · 2026 | GEM | 修正：座標 | 座標改到 65 部風機的中心（OpenStreetMap 標為 Revolution Wind LLC 營運的 SG 11.0-200 DD）；原座標在風場西北角外 | [連結](https://www.openstreetmap.org/node/13097062280) |

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
| Ajos Retrofit wind farm · 43 MW · 2016 | GEM | 修正：容量、年份、分期、機組 | OX2 2017 年 10 月把汰換後的 Ajos 風場交給 IKEA Finland：8 部 Siemens SWT-3.3-130（人工島與防波堤上）＋5 部 SWT-3.2-113（Ajos 島上），共 42.4 MW；新機組 2016–2017 年豎立，取代原本 10 部 WinWinD | [連結](https://news.cision.com/ox2/r/ox2-hands-over-ajos-wind-farm-to-ikea-finland,c2361999) |
| Kemi wind farm · 27 MW · 2008 | GEM | 修正：容量、機組 | PVO-Innopower 的原 Ajos 風場：10 部 WinWinD WWD-3（3 MW），2007–2008 年建成，共 30 MW（GEM 寫 27 MW）；2016 年起由 OX2 汰換 | [連結](https://fi.wikipedia.org/wiki/Kemin_tuulipuisto) |

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
| Dogger Bank wind farm · B, C · 2,400 MW · 2026 | GEM | 修正：年份 | B 期 2026 年 6 月才裝了 20 部，風機安裝持續到約 2027 年第二季，C 期在 B 期之後 | [連結](https://www.offshorewind.biz/2026/06/09/20-turbines-installed-at-dogger-bank-b-offshore-wind-farm/) |
| Pentland wind farm · 100 MW | GEM | 修正：年份、座標 | Pentland 浮動式風場（GEM 另一筆「Pentland Floating Offshore wind farm」是同一案，GEM 的頁面互列為別名）：2023-06-29 取得蘇格蘭海洋局 Section 36 許可，2026 年 1 月在第 7 輪差價合約得標，預計 2027 年最終投資決定、2030 年商轉，尚未施工；位置改用 GEM 另一筆在 Dounreay 外海約 7.5 km 的點（原座標在 Thurso 陸上，概略位置） | [連結](https://cop.dk/pentland-floating-offshore-wind-farm-secures-contract-for-difference-cfd/) |

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
| Ecowende Offshore wind farm · 780 MW · 2026 | GEM | 修正：機組、座標 | Ecowende（Hollandse Kust West 第 VI 區）52 部 Vestas V236-15.0、760 MW，2026 年 7 月首度送電、預定 2026 年底全面運轉；座標改為 Hollandse Kust West 風場區（原座標在海岸線上，概略位置）。容量、狀態與年份由 2026 年整理的規劃中清單帶入（見 build_farms.py 的 PIPE_SAME） | [連結](https://windpowernl.com/2026/07/06/ecowendes-hollandse-kust-west-offshore-wind-farm-delivers-first-power-to-dutch-grid/) |

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
| Tân An 1 offshore wind farm · 115 MW · 2021 | GEM | 修正：容量、年份、分期 | 新安 1 號三部分都已商轉：一期 25 MW（2021，工貿部 FIT 名單）、2021–2025 期 45 MW（EVN 2023-08-18 表已 COD；金甌工貿廳 2024-04 檢查的運轉中風場也列入）、2021–2025 期另 30 MW 的 7 部（29.4 MW，2025 年 1 月 31 日表仍未送件、2 月 28 日表已 COD）；合計 99.4 MW、2025 年全部完成。取代 2026-09 那條「後續各期到 2024 年仍未併網」的規則（它引用的青年報其實把 45 MW 列為運轉中） | [連結](https://www.evn.com.vn/userfile/User/giangtcdl/files/2025/3/28022025capnhatCODduanNLTTchuyentiep-20250311103857508.pdf) |
| Hiệp Thành wind farm · 65 MW · 2023 | GEM | 重複（併入「Hiep Thanh (Tra Vinh)」） | 同一座風場（茶榮省沿海的 Hiệp Thạnh；GEM 列為陸域） | 資料比對 |
| Thanh Hải No. 5 Offshore wind farm · 127 MW · 2021 | GEM | 修正：業主、容量 | 檳椥 5 號（成海）風場是新環球檳椥公司的案子，不是越南電力公司；全案 28 部、120 MW（EVN 落成報導） | [連結](https://www.evn.com.vn/d6/news/Khanh-thanh-Nha-may-dien-gio-so-5-Thanh-Hai-Ben-Tre-100-668-55952.aspx) |
| Ben Tre 5 Thanh Hai 1 · 30 MW · 2021 | 精選 | 重複（併入「Thanh Hải No. 5 Offshore wind farm」） | 5 號風場一期（成海 1，7 部 30 MW）；GEM 的一筆已含全案 | [連結](https://lethycorp.com/du-an-da-thi-cong/dien-gio-so-5.html) |
| Ben Tre 5 Thanh Hai 2 · 30 MW · 2022 | 精選 | 重複（併入「Thanh Hải No. 5 Offshore wind farm」） | 5 號風場二期（成海 2–4，21 部 90 MW）的一部分；GEM 的一筆已含全案 | [連結](https://lethycorp.com/du-an-da-thi-cong/dien-gio-so-5.html) |
| VPL 1 nearshore wind power plant · 30 MW · 2021 | GEM | 重複（併入「VPL Ben Tre (Nexif Ben Tre 1)」） | 同一座風場（Nexif 的 VPL 檳椥一期，30 MW，平大縣） | [連結](https://www.phanvu.vn/en-US/vpl-ben-tre-wind-power-plant-p1) |
| Xinshun offshore wind farm · 90 MW · 2021 | GEM | 重複（併入「Tan Thuan (PECC2) Phase 1+2」） | GEM 的「Xinshun」只引用 GlobalData 檔案；power-technology 的 GlobalData 檔案寫明該案在金甌省、18 台機組、2021 年 11 月商轉、EPC 為中國能建規劃設計集團，與金甌新順（Tân Thuận，漢語「新順」＝Xinshun）風場一致（18 台、2021 年底商轉、一期 25 MW＋二期 50 MW），座標誤放寧順外海、90 MW 為資料庫容量錯誤，屬重複。 | [連結](https://www.power-technology.com/data-insights/power-plant-profile-xinshun-offshore-wind-power-project-vietnam/) |
| Cà Mau wind farm · 352 MW · 2023 | GEM | 修正：容量、機組 | 國資委／走出去導航網（2023-04-13）：越南金甌 1 號風電項目總裝機 350 MW（非 352），分 A、B、C、D 四個風場，業主越南建設貿易股份公司（WTO），選用明陽 MySE5.0-166 海上風機；中國電建 2023 年 4 月完成的是 1A 區全部風機吊裝。 | [連結](http://www.sasac.gov.cn/n2588025/n2588124/c19372635/content.html) |
| Bac Lieu Phase 3 · 142 MW · 2025 | 精選 | 修正：狀態、年份、容量、機組 | 薄寮三期尚未完工：Mekong ASEAN 2025-04-24 報導 2025 年 4 月才恢復安裝首台機組，容量 141 MW、47 座金風 3 MW 無齒輪箱機組，2025 年內預計僅安裝 99 MW；越通社 2026-03-18 報導 47 座中完成 33 座，目標 2026 年第二季送電運轉，故改為興建中、預計 2026 年。 | [連結](https://mekongasean.vn/tiep-tuc-trien-khai-lap-dat-nha-may-dien-gio-bac-lieu-giai-doan-3-40791.html) |
| Soc Trang 1 Phase 1 (Cong Ly) · 30 MW · 2021 | 精選 | 修正：業主 | 越通社 2018-01-30 開工報導：朔莊公理風電廠由 Công ty Cổ phần Super Wind Energy Công Lý Sóc Trăng 投資（業主），一期原規劃 15 座、每座 2 MW、共 30 MW（建成為 10 部 3 MW，見 2026-10-07 第五批之二）。 | [連結](https://www.vietnamplus.vn/khoi-cong-xay-dung-nha-may-dien-gio-dau-tien-tai-soc-trang-post486569.vnp) |
| V1-3 Ben Tre (BTRE) · 30 MW · 2021 | 精選 | 修正：業主、機組 | 越南能源雜誌 2021-11-29 落成報導：檳椥 V1-3 風電廠由 Công ty cổ phần Năng lượng tái tạo Bến Tre（檳椥再生能源股份公司）投資，7 座 Vestas 4.2 MW 機組。 | [連結](https://nangluongvietnam.vn/khanh-thanh-nha-may-dien-gio-v1-3-ben-tre-27881.html) |
| Bac Lieu Phase 1 · 16 MW · 2013 | 精選 | 修正：業主 | 越南維基（引投資報、青年報）：薄寮風電廠三期皆由 Công ty TNHH Xây dựng - Thương mại và Du lịch Công Lý（公理建設貿易旅遊公司）投資，與資料庫二期業主相同；一期 10 座、16 MW 於 2012 年 10 月裝完。 | [連結](https://vi.wikipedia.org/wiki/Nh%C3%A0_m%C3%A1y_%C4%91i%E1%BB%87n_gi%C3%B3_B%E1%BA%A1c_Li%C3%AAu) |
| Hoa Binh 1 Phase 1 · 50 MW · 2021 | 精選 | 修正：機組 | 和平 1 號一期是 13 部 Vestas V150-4.2，不是金風（offshoreWIND.biz 2020-01） | [連結](https://www.offshorewind.biz/2020/01/02/vestas-secures-third-intertidal-turbine-order-in-vietnam/) |
| Hoa Binh 1 Phase 2 · 50 MW · 2021 | 精選 | 修正：機組 | 和平 1 號二期同樣是 13 部 Vestas V150-4.2，不是金風（Vestas 新聞稿 2020） | [連結](https://www.vestas.com/en/media/company-news/2020/vestas-surpasses-1-gw-of-order-intake-in-vietnam--winni-c3167101) |
| Hoa Binh 2 · 50 MW · 2021 | 精選 | 修正：機組 | 和平 1、2 號合計 39 部 Vestas V150 4.2 MW（吊裝商明煌），不是金風 | [連結](https://minhhoangcrane.com.vn/project/dien-gio-hoa-binh/) |
| Tan Thuan (PECC2) Phase 1+2 · 75 MW · 2021 | 精選 | 修正：機組 | 新順風場 75 MW、海上 18 座，用西門子歌美颯 SG 5.0-145，不是遠景 4.2 MW（西門子歌美颯新聞稿 2020-07；投資報落成報導） | [連結](https://www.siemensgamesa.com/global/en/home/press-releases/200715-siemens-gamesa-press-release-vietnam-nearshore-project.html) |
| V1-2 Truong Long Hoa (Tra Vinh) · 48 MW · 2021 | 精選 | 修正：機組 | 茶榮 V1-2 是 12 部金風 GW155-4.5，不是遠景（offshoreWIND.biz 2021-09） | [連結](https://www.offshorewind.biz/2021/09/01/all-wind-turbines-up-at-tra-vinh-v1-2-nearshore-wind-farm/) |
| V1-3 Truong Long Hoa 48 MW (REE, Tra Vinh No.3) · 48 MW · 2021 | 精選 | 修正：機組 | 茶榮 V1-3 是 12 部 Vestas V150-4.2（以 4.0 MW 運轉），不是西門子歌美颯（offshoreWIND.biz 2020-06） | [連結](https://www.offshorewind.biz/2020/06/17/vestas-wins-another-epc-intertidal-contract-in-vietnam/) |
| Dong Hai 1 – Tra Vinh (Trungnam) · 100 MW · 2021 | 精選 | 修正：機組 | 茶榮東海 1 號是 25 部西門子歌美颯 SG 5.0-145（每部以 4 MW 運轉），不是 SG 4.0-145（offshoreWIND.biz 2021-02；中南集團專案頁） | [連結](https://www.offshorewind.biz/2021/02/03/siemens-gamesa-lands-its-largest-nearshore-project-in-vietnam/) |
| Thanh Hải No. 5 Offshore wind farm · 120 MW · 2021 | GEM | 修正：機組 | 成海全案 28 部（EVN），其中第 1、2 期為西門子歌美颯 SG 4.5-145（Power Technology）；其餘各期的機型查不到 | [連結](https://www.power-technology.com/data-insights/power-plant-profile-thanh-hai-offshore-wind-farm-vietnam/) |
| Tan Phu Dong 1 (Tien Giang, GEC) · 100 MW · 2023 | 精選 | 修正：機組 | 新富東 1 號是 24 部 Vestas V150-4.2 MW，不是遠景（物流承包商 Infinity Logistics 專案頁） | [連結](https://infinitylog.com.vn/projects/tan-phu-dong-i-offshore-wind-farm-project/) |
| Đông Thành 1 - Thái Hòa offshore wind farm · 1 · 80 MW · 2026 | GEM | 修正：狀態、年份 | 東城 1（80 MW）2026 年 3 月永隆省工商廳仍在請上級對投資主張表示意見，查不到施工報導（GEM 的「施工中」只根據 2024 年的付費資料庫頁面）；改為施工前、年份不詳 | [連結](https://thuonghieucongluan.com.vn/vinh-long-phat-trien-dien-gio-tro-thanh-nganh-kinh-te-quan-trong-a310538.htm) |
| V1-1 Truong Long Hoa (Tra Vinh) · 48 MW · 2021 | 精選 | 修正：業主、機組 | 茶榮 V1-1 就是「韓國－茶榮」風場一期（48 MW）：2019-04-24 由茶榮 1 號風電公司在長隆和社 V1-1 位置動工，主要出資者 Climate Investor One 與韓國 Samtan（vietnamfinance）；Vestas 統包 12 部 V150-4.2 MW（offshoreWIND.biz 2021-09）。Sermsang 是 V1-2 的投資人，原寫的業主與「12x Envision 4 MW」都不對 | [連結](https://www.offshorewind.biz/2021/09/01/vestas-nears-finish-line-at-vietnamese-intertidal-wind-farm) |
| Hiep Thanh (Tra Vinh) · 78 MW · 2022 | 精選 | 修正：業主、機組 | 協成風場（78 MW）是 18 部西門子歌美颯 SG 5.0-145、每部以 4.3 MW 運轉（offshoreWIND.biz 2020-07 與 2021-08），不是遠景；開發商 EcoTech Tra Vinh Renewables，投資人 Janakuasa、Ecotech Vietnam、Climate Investor One 與 ST International | [連結](https://www.offshorewind.biz/2020/07/23/siemens-gamesa-lands-biggest-nearshore-contract-in-vietnam/) |
| Tan Phu Dong 2 (Tien Giang, GEC) · 50 MW · 2021 | 精選 | 修正：機組 | 新富東 2 號裝 12 部 Vestas V150-4.2 MW（Power Technology），不是遠景；EPC 為 PC1 | [連結](https://power-technology.com/?p=174203) |
| Cà Mau wind farm · 350 MW · 2023 | GEM | 修正：狀態、年份 | 越南電力集團（EVN）2025-04-30 轉型期風場 COD 進度表：金甌 1A（88 MW）、1B（88 MW）、1C（88 MW）、1D（86 MW）四座都「尚未送 COD 文件」；法律報 2023-08 仍列為施工中；中國電建 2023-04 只完成 1A 區全部吊裝。2026-07 金甌省（已併入薄遼）14 座商轉風場共 694.2 MW，正好等於不含金甌 1 號的各場加總。全案尚未商轉，改為興建中、完工年不詳（舊規則「2023 年 4 月完工」實為 1A 區吊裝完成） | [連結](https://www.evn.com.vn/userfile/User/giangtcdl/files/2025/5/30042025capnhatCODduanNLTTchuyentiep-20250513162804678.pdf) |
| Soc Trang 1 Phase 1 (Cong Ly) · 30 MW · 2021 | 精選 | 修正：類型、狀態、年份、機組 | 公理朔莊一期 30 MW 不是 2021 年商轉：2021 年底 FIT 期限前沒有通過 COD，EVN 2025-04-30 的轉型期風場表仍寫「尚未送 COD 文件」；業主母公司 Super Energy 2026-01-06 公布 2025-12-31 起 27 MW 商轉，其餘 3 MW 預計 2026 年第一季。10 部 3 MW（金風 GW155-3.3）中 9 部在陸上、1 部在近岸，改列陸域；全場是否已完成待查證，暫列興建中、預計 2026 | [連結](https://southeastasiainfra.com/super-energy-to-start-operations-on-a-30-mw-wind-power-plant-in-mekong-delta-by-2025/) |
| Công Lý Sóc Trăng wind farm · 30 MW | GEM | 重複（併入「Soc Trang 1 Phase 1 (Cong Ly)」） | 同一座公理朔莊風電廠一期（30 MW，Super Wind Energy Công Lý Sóc Trăng）；GEM 這筆列為施工中 | [連結](https://www.gem.wiki/C%C3%B4ng_L%C3%BD_S%C3%B3c_Tr%C4%83ng_wind_farm) |
| Bến Tre 10 Bình Đại 1 Offshore wind farm · 128 MW · 2021 | GEM | 修正：年份、分期、機組 | 平大風場三期 30／49／49 MW：一期 7 部西門子歌美颯（5.0 系列），二、三期 24 部金風（海事保證檢驗商 AqualisBraemar LOC 的施工階段報導，GlobalData 同；型號未查到）；共 31 部、128 MW（PTSC）。一期 2021 年 FIT 期限前只有 4.2 MW 通過 COD（工貿部），其餘 25.8 MW 與平大 2、3 號各 49 MW 都是轉型期專案，2023 年才通過 COD（EVN 2023-08-18 表），全場完工年改為 2023；GEM 的分期 2021／2022 不對 | [連結](https://www.evn.com.vn/userfile/User/honghoa/files/18082023_CapnhatCODduanNLTTchuyentiep.pdf) |
| Bình Đại wind farm · 25.8 MW · 2023 | GEM | 重複（併入「Bến Tre 10 Bình Đại 1 Offshore wind farm」） | GEM 這筆 25.8 MW「陸域」只引用 EVN 2023-08 的轉型期 COD 表，就是平大一期（30 MW）在 2021 年只通過 4.2 MW 之後剩下的 25.8 MW，不是另一座風場 | [連結](https://www.gem.wiki/B%C3%ACnh_%C4%90%E1%BA%A1i_wind_farm) |
| Thanh Hải No. 5 Offshore wind farm · 120 MW · 2021 | GEM | 修正：狀態、年份 | 成海 5 號共 4 座電廠、28 部（EVN 2022-07；打樁承包商 Lê Thy 寫 24 部，以 EVN 為準）。2021 年 FIT 期限前只有成海 1（30 MW）與成海 2 的 4.25 MW 通過 COD（工貿部）；成海 2 其餘 25.75 MW、成海 3、4（各 30 MW）在 EVN 2025-04-30 的轉型期表仍「未送 COD 文件」，全場尚未完成，改為興建中（完工年不詳）。機型：成海 1 為 7 部西門子歌美颯 SG 4.5-145（訂單），成海 2 為 7 部 SG 4.5-145（GlobalData；原訂單為附條件），成海 3、4 未查到 | [連結](https://www.evn.com.vn/userfile/User/giangtcdl/files/2025/5/30042025capnhatCODduanNLTTchuyentiep-20250513162804678.pdf) |
| Hoa Binh 1 Phase 2 · 50 MW · 2021 | 精選 | 修正：業主 | 和平 1 號二期與和平 2 號由方英建設投資貿易公司（Phương Anh 集團）投資（工貿部 2020-07 開工報導）；原本業主空白 | [連結](https://moit.gov.vn/phat-trien-ben-vung/bac-lieu-them-100mw-dien-gio-duoc-khoi-cong-xay-dung.html) |
| Hoa Binh 2 · 50 MW · 2021 | 精選 | 修正：業主、機組 | 和平 1、2 號共 150 MW、39 部（人民報），和平 1 號兩期各 13 部 V150-4.2，所以和平 2 號是 13 部；業主同為方英 | [連結](https://nhandan.vn/ocop/bac-lieu-tien-phong-phat-trien-dien-gio-ngoai-khoi-post733339.html) |
| VPL Ben Tre (Nexif Ben Tre 1) · 30 MW · 2021 | 精選 | 修正：容量、年份、分期 | VPL 檳椥 2021 年 FIT 期限前只有 25.2 MW 通過 COD（工貿部，部分），最後 4.2 MW（1 部）是轉型期專案，2023 年才 COD（EVN 2023-08-18 表），全場完成年改為 2023、共 29.4 MW | [連結](https://www.evn.com.vn/userfile/User/honghoa/files/18082023_CapnhatCODduanNLTTchuyentiep.pdf) |
| Hiep Thanh (Tra Vinh) · 78 MW · 2022 | 精選 | 修正：年份、分期 | 協成 2021 年 FIT 期限前只有 12.8 MW 通過 COD（工貿部，部分），其餘 64.5 MW 是轉型期專案，2023 年才 COD（EVN 2023-08-18 表），全場完成年由 2022 改為 2023 | [連結](https://www.evn.com.vn/userfile/User/honghoa/files/18082023_CapnhatCODduanNLTTchuyentiep.pdf) |
| Duyên Hai wind farm · 1 · 48 MW | GEM | 修正：狀態、年份、類型、業主 | GEM 這筆的別名就是「Duyen Hai Wind Power Plant (V1-4)／NMĐ gió Duyên Hải (V1-4)」，狀態引用的西貢經濟時報 2025-09 報導的是 REE 子公司 Duyên Hải 風電公司在 Đông Hải 等三個社的 48 MW 電廠；業主 Asian Energy／Uniso 是 2018 年已被茶榮省終止的舊案。人民報：Duyên Hải（V1-4）10／10 部 2026-03-16 起全部正式運轉（券商摘要：2026-03-16 商轉）；KB 證券 2025 年第三季報告稱為離岸（潮間帶）專案、10 座離岸風機塔已裝完。改為運轉中、2026、離岸，業主改為 REE 的 Duyen Hai Wind Power JSC；機組數各來源不一（10 或 8 部），機型未查到 | [連結](https://nhandan.vn/post-952529.html) |
| Lạc Hòa wind farm · 154 MW · 2023 | GEM | 修正：年份、分期 | GEM 這筆含兩座：二期 124 MW 就是 Lạc Hòa 2（EVN：40 部中 38 部、123.6 MW 於 2023-08-18 前通過 COD），一期 30 MW 是 UPC／AC Energy 的 Lạc Hòa 風電廠（和東社、6 部 V150-3.8＋2 部 V150-3.6，業主公告 2023-12-30 商轉；GEM 的 2025 年引用 2025-02 的進度表）。兩部分都在 2023 年，不再分期 | [連結](https://diengiolachoa.com/en/) |
| Chơ Long wind farm · 2 · 105.5 MW | GEM | 修正：狀態、業主 | 朱龍（Chơ Long）風電廠共 155 MW（Phong Điện Chơ Long 股份公司，原 Krông Chro 縣）：2021 年已建成，但只有 49.5 MW 在 FIT 期限前通過 COD；其餘 105.5 MW 因電能品質（諧波）試驗問題，到 2026-08 仍未商轉（嘉萊省 2026-08-04 向 EVN 陳情）。不是「規劃中」，改為興建中（已建成、未商轉） | [連結](https://www.tinnhanhchungkhoan.vn/gia-lai-tiep-tuc-kien-nghi-go-vuong-2-du-an-dien-gio-chua-van-hanh-thuong-mai-post395316.html) |
| Chơ Long wind farm · 49.5 MW | GEM | 修正：年份、業主 | 朱龍風電廠的 49.5 MW 在 2021-10-31 前通過 COD（EVN 名單「部分」，全廠 155 MW） | [連結](https://evn.com.vn/userfile/User/tcdl/files/Thong-tin-COD-dien-gio-den-het-ngay-31-10-2021_2.pdf) |
| Soc Trang 7 Phase 1 · 30 MW · 2021 | 精選 | 修正：容量、機組、業主 | 7 號風場一期是 7 部 4.2 MW、29.4 MW（EVN 2021 FIT 名單「Số 7 Sóc Trăng 29,40 全部」），業主朔莊能源股份公司與春求公司 | [連結](https://vietnamenergy.vn/the-first-wind-power-projects-in-soc-trang-province-have-started-the-power-generation-27557.html) |

## 規劃中專案清單（2026 整理）裡不收錄的專案

| 專案 | 理由 | 出處 |
|---|---|---|
| Haiding 1 (Formosa 3) (TWN) | 3.2 期獲配 360 MW（預計 2028 年），2025 年 5 月前經濟部已解除開發權（Corio 與 TotalEnergies 的 Formosa 3） | [連結](https://www.ctee.com.tw/news/20250525700516-430104) |
| DeShuai (TWN) | 3.2 期獲配 240 MW（預計 2028 年，德能英華威集團），2025 年 5 月前經濟部已解除開發權 | [連結](https://www.ctee.com.tw/news/20250525700516-430104) |
| Greater Changhua Northeast (TWN) | 3.2 期原排第 3，因與海廣風場高度重疊而未獲配容量，從未取得開發權（沃旭在 3.3 期改以大肚一號投標） | [連結](https://www.cna.com.tw/news/afe/202408050303.aspx) |
| Firefly (Bandibuli) (KOR) | Equinor 於 2026 年 5 月停止開發 | [連結](https://www.equinor.co.kr/en/news/important-notice-on-bandibuli-project_en) |
| Red Sea Wind Energy (Ras Ghareb) (EGY) | 已於 2025 年 7 月 2 日全面商轉（650 MW，比原訂第三季提前）；GEM 2026-02 以「Ras Ghareb wind farm」第 2、3 期列為營運中，不再當規劃案 | [連結](https://orascom.com/updates/engie-orascom-construction-ttc-eurus-consortium-starts-full-commercial-operations-of-650-mw-wind-farm-in-egypt-ahead-of-schedule/) |
| Dogger Bank B (GBR) | GEM 2026-02 已把 B、C 兩期（1,235＋1,218 MW）合成一筆「Dogger Bank wind farm · B, C」列為興建中（2026），清單不再需要；2025-02 版時清單的這筆會誤對到 Dogger Bank South | [連結](https://www.gem.wiki/Dogger_Bank_wind_farm) |
| Dogger Bank C (GBR) | 同上：GEM 2026-02 的「Dogger Bank wind farm · B, C」已含 C 期 | [連結](https://www.gem.wiki/Dogger_Bank_wind_farm) |

## 規劃中專案清單（2026 整理）之後才變動的欄位

| 專案 | 修正 | 理由 | 出處 |
|---|---|---|---|
| East Anglia TWO (GBR) | expected=2028, mw=960.0 | 預計運轉年由 2029 改為 2028、容量由 963 改為 960 MW：64 部單樁與轉接段 2026 年下半年才開始製造，預計 2027 年海上施工、2028 年運轉 | [連結](https://www.nsenergybusiness.com/projects/east-anglia-two-offshore-wind-farm/) |
| YouDe (TWN) | mw=700.0, zh=又德, note=Round 3.2 (2024, 700 MW); in August 2026 the Energy Administration said the termination was being processed | 名稱改為又德、容量由 1,000 MW 改為 3.2 期獲配的 700 MW；與 GEM 的「Datian Youde」是同一案，合成一筆 | [連結](https://www.cna.com.tw/news/afe/202408050303.aspx) |
| Fengmiao 2 (TWN) | mw=600.0 | 容量由 500 MW 改為 3.2 期獲配的 600 MW | [連結](https://www.cna.com.tw/news/afe/202408050303.aspx) |
| Huanyang (TWN) | note=Round 3.1; the Energy Administration said in 2026 that the termination was in process | 能源署 2026 年表示蔚藍海彰化（環洋）已在解約程序中，正式解約後再移除 | [連結](https://www.nownews.com/news/6859530) |
| Coastal Virginia Offshore Wind (CVOW) (USA) | expected=2027 | 預計完工年由 2026 改為 2027：2026 年 8 月開發商表示最後一批風機要到 2027 年底才裝完（當時 176 部裝好 31 部） | [連結](https://www.offshorewind.biz/2026/08/03/largest-us-offshore-wind-farm-81-pct-complete-final-turbine-expected-by-end-of-2027) |

## 不當成重複的 GEM 專案

| 專案 | 理由 | 出處 |
|---|---|---|
| Kakegawa wind farm (JPN) | 日本風力開發的掛川風力發電所（6 部 2,300 kW、13.8 MW，2020 年）與黑潮風力發電的遠州掛川風力發電所（7 部 Enercon，2011 年）是相鄰的兩座風場 | [連結](https://www.pref.shizuoka.jp/kurashikankyo/kankyo/assessetc/1002648/1017974.html) |
| Gansu Minqin Hongshagang 1 wind farm (CHN) | 民勤紅沙崗第一風電場（中廣核，400 MW）是紅沙崗基地裡獨立的一座；舊建置把它併進後來刪除的整區彙總「Minqin Hongshagang」，整座消失 | [連結](https://www.gem.wiki/Gansu_Minqin_Hongshagang_1_wind_farm) |
| YEP wind farm (KOR) | 韓華建設的英陽風場（76 MW、22 部 3.45 MW）與 2008 年 Macquarie 的英陽風場不同；舊建置把它併進後來判為重複刪除的精選「Yeongyang」 | [連結](https://www.etoday.co.kr/news/view/1988572) |
| Yeongyang 2nd wind power generation (KOR) | 英陽第二風場（GS E&R 70%、韓國中部發電 30%，42 MW）是 2023 年的新風場；舊建置把它併進後來判為重複刪除的精選「Yeongyang」 | [連結](https://www.fnnews.com/news/202309241852426048) |
| Fujian Pingtan Waihai Offshore wind farm (CHN) | 三峽平潭外海（111 MW、11 部試驗機組，2023 年 9 月全容量併網）與大唐平潭長江澳是不同的風場；舊建置把它併進後來被刪除的「Datang Pingtan Waihai」，整座消失 | [連結](http://www.sasac.gov.cn/n2588025/n2588124/c28906372/content.html) |
| Jiangsu Rudong H13 (Xiexin) Offshore wind farm (CHN) | 協鑫如東 H13（150 MW、30 部海裝 5 MW，2021 年 11 月全容量併網）與華能如東是不同的風場；舊建置把它誤併進「Huaneng Rudong」 | [連結](https://www.163.com/dy/article/GQ0GC2VI05345ASA.html) |
| Guangdong Yangjiang Shaba (Guangdong Energy) Offshore wind farm (CHN) | 粵電陽江沙扒（300 MW，2021 年 12 月全容量併網）與三峽陽江沙扒是不同的風場 | [連結](https://m.bjx.com.cn/mnews/20211206/1191794.shtml) |
| Guangdong Yangjiang Nanpengdao (China Energy Conservation) Offshore wind farm (CHN) | 中節能陽江南鵬島（300 MW，2021 年 11 月全容量併網）與中廣核南鵬島是不同的風場 | [連結](https://wind.in-en.com/html/wind-2412533.shtml) |
| Jiangsu Dongtai Zhugensha H2 Offshore wind farm (CHN) | 竹根沙 H2（302 MW，浙江新能與中海油）與國華東台四期 H2 是不同的風場 | [連結](https://www.nbd.com.cn/articles/2021-11-03/1978454.html) |
| Jiangsu Binhai (Datang) Offshore wind farm (CHN) | 大唐國信濱海 300 MW 海上風電（廢黃河口至扁擔港之間，3 MW 與 3.3 MW 機組）2019 年 12 月 25 日全部風機併網，是與國家電投濱海南 H3（2020 年底投產）不同的風場；舊建置因名稱都有「濱海」而把它併進濱海南 H3，整座消失 | [連結](https://www.ne21.com/news/show-132982.html) |
| Fujian Changle 'Outer Ocean' Area I Offshore wind farm (CHN) | 長樂外海 I 區是 2021–2023 年後才配置的新場址：I 區（南）2023 年競爭配置由福建投資集團與國投電力聯合體中選、2024-11-30 核准、2025-11 環評公示（16 部 18 MW＋1 部 26 MW，314 MW，離岸 54–61 km）；I 區（北）2024-06 核准給東方電氣的東福新能源（19 部，含 1 部 26 MW 試驗機）。兩案都要等長樂外海集中送出工程，都還沒建成，與 2021 年起營運的三峽長樂外海 A 區（37 部）不是同一座 | [連結](https://www.fuzhou.gov.cn/zgfzzt/shbj/xxgk/spgs/202511/P020251104372076206643.pdf) |
| Fujian Putian Pinghaiwan Offshore wind farm (CHN) | 莆田平海灣 F 區（三川海上風電，200 MW，2021 年 7 月與石城一起併網）沒有自己的紀錄；GEM 這個場址的 F 期被一起併進精選的平海灣三期而消失 | [連結](https://www.court.gov.cn/zixun/xiangqing/497381.html) |
| Pantelimon wind farm (ROU) | Pantelimon（Constanța 縣 Pantelimon 鄉，123 MW）與 Crucea Nord（Crucea 鄉，108 MW）是不同的風場（Transelectrica 清單分列）；舊建置把它當成 Crucea Nord 的重複而刪掉 | [連結](https://onoff.greatnews.ro/producatori-de-energie-eoliana-in-romania-lista-completa-a-centralelor-in-2024/) |

## 已查證不是重複（覆蓋率報告不再列）

| 風場 | 理由 | 出處 |
|---|---|---|
| Cửu An wind farm (VNM) | 嘉萊安溪的 Cửu An 與 Song An 是兩座 46.2 MW 風場，共用一座 110 kV 升壓站；Cửu An 2021 年在 FIT 期限前全廠 COD，Song An 是轉型期專案（EVN） | [連結](https://sdic.vn/nha-may-dien-gio-cuu-an-462mw/) |
| Quoc Vinh Soc Trang wind farm (VNM) | 國榮（6 號，陸上 7.5 ha、6 部，朔莊國榮風電公司）與 7 號（海上 3,100 ha 範圍、7 部 4.2 MW，朔莊能源公司與春求公司）是不同業主的兩座；EVN 的 FIT 名單分列國榮 30 MW 與 7 號 29.4 MW | [連結](https://vietnamenergy.vn/the-first-wind-power-projects-in-soc-trang-province-have-started-the-power-generation-27557.html) |
| Streumen (DEU) | MaStR 在 Streumen 有好幾群：GEM 的 Streumen（Streumen/Glaubitz II 汰換案，4 部 Vestas V126，2016 年）之外，這筆是 2011–2023 年陸續併網的另外 4 部（16.7 MW），是另一批機組 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Solano Wind Project (USA) | Montezuma Hills 有好幾座風場：Shiloh（四期 505 MW，Iberdrola 與 EDF）與 SMUD 的 Solano Wind 是不同電廠（英文維基分列） | [連結](https://en.wikipedia.org/wiki/Shiloh_Wind_Power_Plant) |
| Fonte Da Quelha wind farm (PRT) | Cinfães 風電計畫包含兩座風場：Fonte da Quelha 與 Alto do Talefe（各 13.5 MW、EDP、2004 年），相距約 10 km，OpenStreetMap 各有一筆風場關係 | [連結](https://www.edp.com/sites/default/files/document/2025-04/quelha_e_talefe_recape.pdf) |
| Gohlocher Wald wind farm (DEU) | Gohlocher Wald 在 Lebach（2 部 Nordex N131/3000，2018 年）；MaStR 的「CEE Windpark Schwalbach」在 Püttlingen（4 部 Enercon E-115、12 MW，2018 年）：不同風場 | [連結](https://www.energy3k.com/wp-gow-erste-kwh/) |
| Putian Pinghai Bay Area F (Sanchuan) (CHN) | 平海灣 F 區（三川海上風電，20 萬千瓦，2017 年核准）與平海灣二期（中閩海上風電，246 MW）是不同的項目；F 區 2021 年 7 月與石城風電場一起併網 | [連結](https://www.court.gov.cn/zixun/xiangqing/497381.html) |
| Windpark Nortorf (DEU) | MaStR 的「Windpark Nortorf」（2 部 Nordex N163，2025 年）在 Rendsburg-Eckernförde 縣的 Nortorf／Ellerdorf；GEM 的「Nortorf 2」（13 MW，2022 年）是 44 km 外 Steinburg 縣的 Nortorf，已對到 MaStR 的「Windpark Nortorf 2」（2 部 6.6 MW）：兩個同名的地方 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| BWP Kaiser-Wilhelm-Koog II (DEU) | MaStR 的「BWP Kaiser-Wilhelm-Koog II」是 2004 年的一部 Enercon E58（1,000 kW），與精選紀錄裡 1987 年的 Westküste 試驗風場不是同一批機組 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Windpark Flomborn (DEU) | MaStR 的「Windpark Flomborn」是 5 部 3,075 kW（2012-12 至 2013-02 併網），與 GEM「Flomborn-Stetten」對到的「BVT Windpark Flomborn/Stetten」（5 部，2013-12）是相鄰的另一座 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Windpark Stetten (DEU) | MaStR 的「Windpark Stetten」（Donnersbergkreis 的 Stetten，2012–2015 年）與 GEM「Flomborn-Stetten」對到的 BVT 那 5 部（2013-12）是不同機組 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Windpark Heßloch (DEU) | MaStR 的「Windpark Heßloch」是 2014–2015 年的 3 部 Senvion 3.4M104；GEM「Dittelsheim-Heßloch」已對到 2013 年的 4 部 Enercon E-82：同地點不同期 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Windpark Welsow (DEU) | MaStR 的「Windpark Welsow」是 2021 年的 2 部 Enercon E138；GEM「Kerkow-Welsow」已對到 2023 年的 2 部 Nordex N149：同地點不同期 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Gnannenweiler (DEU) | MaStR 的「Gnannenweiler」是 2021 年的 2 部 Enercon E138；GEM「Gnannenweiler Windnetz」已對到 2009 年的 Enercon E82：同地點不同期 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Gägelow (DEU) | MaStR 有兩群都叫「Gägelow」、相距 41 km：GEM 的 Gägelow（2002 年、14 MW）所在處是 8 部 ENERCON E-66（2002 年，14.4 MW）；這筆是 Gägelow 鄉（維斯馬附近）2014–2022 年陸續併網的 6 部（13.8 MW），是另一座 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| AW Windenergie Bramsche (DEU) | MaStR 的「AW Windenergie Bramsche」是 13 部 Senvion 3.0 M122（2016–2017 年併網，40.99 MW）；GEM 的「Kalkriese」（40 MW）在 MaStR 對到的是另外 12 部 Vestas V126（2016 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Windpark Neuengörs Repowering (DEU) | MaStR 的「Windpark Neuengörs Repowering」是 5 部 Nordex SE N163-6.x（2025 年併網，34 MW）；GEM 的「Bebensee」（33 MW）在 MaStR 對到的是另外 5 部 Nordex Germany N163/6.X（2025 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Windpark Mahlsdorf 2 (DEU) | MaStR 的「Windpark Mahlsdorf 2」是 4 部 Nordex Germany N175-6.8 MW（2025–2026 年併網，27.2 MW）；GEM 的「Illmersdorf」（28.5 MW）在 MaStR 對到的是另外 5 部 Nordex Energy N163-5.7 MW STE（2023–2024 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| 4.4-Wind (DEU) | MaStR 的「4.4-Wind」是 4 部 ENERCON E-115 EP3 E3（2023 年併網，16.8 MW）；GEM 的「Vettenbüttel」（17 MW）在 MaStR 對到的是另外 3 部 Nordex Energy N 149 - 5,7 MW（2022 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Sillerup Repowering II (DEU) | MaStR 的「Sillerup Repowering II」是 3 部 Nordex Energy N133/4.8（2023 年併網，13.2 MW）；GEM 的「Jörl-Stieglund」（13 MW）在 MaStR 對到的是另外 3 部 ENERCON E-115 EP3 E3（2024 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Windpark Sollwitt-Pobüll (DEU) | MaStR 的「Windpark Sollwitt-Pobüll」是 2 部 Siemens Gamesa Renewable Energy SG 6.0 155（2025 年併網，13.2 MW）；GEM 的「Jörl-Stieglund」（13 MW）在 MaStR 對到的是另外 3 部 ENERCON E-115 EP3 E3（2024 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Max Bögl Windpower Winnberg (DEU) | MaStR 的「Max Bögl Windpower Winnberg」是 4 部 Senvion 3.4M104（2010–2015 年併網，12.51 MW）；GEM 的「Zieger」（12 MW）在 MaStR 對到的是另外 5 部 ENERCON E-82 E2（2011 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Windpark Baaler Bruch (DEU) | MaStR 的「Windpark Baaler Bruch」是 5 部 ENERCON E92（2017 年併網，11.65 MW）；GEM 的「Kalbeck」（12 MW）在 MaStR 對到的是另外 4 部 ENERCON E115（2017 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| Loehrheide Nord (DEU) | MaStR 的「Loehrheide Nord」是 2 部 Nordex Energy N149（2024 年併網，11.4 MW）；GEM 的「Stepratherheide」（11 MW）在 MaStR 對到的是另外 2 部 Nordex SE N149（2024 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| WPGEL (DEU) | MaStR 的「WPGEL」是 2 部 Nordex SE Nordex Delta4000 N163/5.X（2025 年併網，11.4 MW）；GEM 的「Stepratherheide」（11 MW）在 MaStR 對到的是另外 2 部 Nordex SE N149（2024 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
| WP Uhlhorn (DEU) | MaStR 的「WP Uhlhorn」是 3 部 Vestas V-126（2018 年併網，10.35 MW）；GEM 的「Hengsterholz」（10 MW）在 MaStR 對到的是另外 3 部 Vestas V117-3,45MW（2017 年）：兩批不同的機組，是相鄰的兩座風場 | [連結](https://www.marktstammdatenregister.de/MaStR/Datendownload) |
