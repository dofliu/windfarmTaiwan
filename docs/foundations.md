# 離岸風場水下基礎型式

[English](foundations.en.md) ｜ 中文（本頁）

> 由 `tools/build_foundations.py` 依 `tools/farm_foundations.py` 的逐場對照表產生，請勿手動編輯。整理時間：2026-09。

地球儀的「顯示」選單有「離岸：水下基礎」圖層，依基礎型式為離岸風場上色。資料一步一步收集：

1. **北海與東北大西洋（OSPAR 涵蓋範圍）**：已完成（2026-09）。
2. **歐洲其他風場**（波羅的海、地中海、艾瑟爾湖，以及 OSPAR 2024 之後才完工的風場）：已完成（2026-09）。
3. **浮動式風場的細分型式**（全球）：已完成（2026-09）。
4. **台灣、日本、韓國、美國**：已完成（2026-09）。
5. **中國、越南**：進行中：已依使用者 2026-09 的逐案覆核補上中國 55 座，出處原文待核對。

本頁是前四步與第 5 步已完成部分的結果。還沒查到的離岸風場標「型式不詳」，不臆測。

## 來源與方法

- **OSPAR Offshore Renewable Energy Developments 2024**（[ODIMS](https://odims.ospar.org/en/submissions/ospar_offshore_renewables_2024_01/)，CC0，資料時間 2024-01-01）是唯一逐場列出基礎型式的開放資料。取其中「營運中」的風機紀錄，逐筆比對本站風場的名稱、位置（OSPAR 範圍圖）與容量；`data/global/sources/ospar_offshore_renewables_2024.csv` 是取出的原始值。
- OSPAR 不一定是建成後的樣子：德國的紀錄有 10 筆只寫「單樁／三腳／三樁／套管／重力式／其他」任一種，Merkur、Veja Mate、Trianel Borkum II、alpha ventus 與建成紀錄不符；英國 Hornsea One 西區也不符。所以德國每一座都以德文維基百科（附建造紀錄）為準，其他不符的逐筆附第二來源與說明。
- **第 2 步**：OSPAR 不涵蓋波羅的海與地中海，2024 年以後才完工的風場也只有核准階段的設計（設計可能改變）。這些風場逐座查開發商、施工廠商、產業新聞、政府文件或維基百科，每座都附出處，引用的原文逐筆核對過；OSPAR 有核准階段紀錄的，一律再附施工紀錄（建置時檢查）。
- **第 3 步**：全球的浮動式風場補上細分型式：單柱式（spar）、半潛式、駁船式（含阻尼池式）、張力腳平台，逐座查技術供應商、開發商或產業新聞，引用的原文逐筆核對過；同一筆紀錄含不同型式的機組時，在說明欄逐部寫出。
- **第 4 步**：台灣、日本、韓國、美國的離岸風場都沒有 OSPAR 紀錄，逐座查開發商、施工廠商、政府文件或產業新聞，引用的原文逐筆核對過（日文、韓文網頁依網頁編碼比對，PDF 逐頁比對），不引用 4C Offshore；日本港灣內的風場以 NEDO 的支持構造分類為準（NEDO 明寫「ドルフィン」就是 High-Rise Pile Cap 高樁承台）。查不到型式的列在下方「查過但暫不列入」。
- **第 5 步（進行中）**：依使用者 2026-09-27 整理的《全球離岸風場資料庫｜亞洲查核版 v2》「亞洲逐案覆核」補上中國 55 座，出處為該表各列的第一手來源（三峽集團、上海市政府、中廣核）；這批原文尚未以 `tools/check_quotes.py` 核對（整理時的工作環境無法連線），列在 TODO 待補。越南各案該表只寫潮間帶／近岸、細分待查，未列入。新增「複合筒」型式，歸在「其他固定式」色組。
- 下表「來源」欄：OSPAR 紀錄附上它寫的原值；其他連結是第二來源，或沒有 OSPAR 紀錄時的出處。
- 地圖上色依結構歸成四組（多於三種顏色在地圖上分不清）：單樁、鋼構框架（套管、三腳架、三樁）、浮動式、其他固定式（重力式、高樁承台、圍堰式、岩錨式、複合筒、混合）；風場卡片與本頁寫出確切型式。

## 各國進度（營運中的離岸風場）

合計：已知型式 235／351 座，占容量 66.5%（浮動式風場本來就知道是浮動式，細分型式見下方「浮動式風場」）。

| 國家 | 營運中 | 已知型式 | 占容量 | 單樁 | 鋼構框架 | 浮動式 | 其他固定式 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 中國大陸 | 160 | 58 | 40% | 30 | 10 | 3 | 15 |
| 英國 | 44 | 44 | 100% | 33 | 8 | 2 | 1 |
| 德國 | 35 | 35 | 100% | 25 | 5 |  | 5 |
| 荷蘭 | 13 | 13 | 100% | 12 |  |  | 1 |
| 台灣 | 8 | 8 | 100% | 3 | 5 |  |  |
| 丹麥 | 17 | 16 | 99% | 8 |  |  | 8 |
| 比利時 | 12 | 12 | 100% | 8 | 3 |  | 1 |
| 法國 | 6 | 6 | 100% | 2 | 1 | 2 | 1 |
| 越南 | 24 | 13 | 49% | 2 |  |  | 11 |
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
| 中廣核陽江帆石一（CGN Fanshi I） | 1,000 | 2026 | 套管式 | [yjrb.com.cn](https://www.yjrb.com.cn/content/c211953.html) | 73 部（22 部 13.6 MW＋51 部 14 MW）用四樁套管，水深 40–48 m（陽江日報的施工報導，32 號機位四根套管樁） |
| 中廣核惠州港口一、二（CGN Huizhou Gangkou I & II） | 1,000 | 2021 | 套管式 | [news.cn](http://www.news.cn/fortune/2023-12/13/c_1130023531.htm) | 共104座：一期25萬kW（6.45 MW機組）2021-12-28全容量併網，二期75萬kW（PA區10×8.5＋20×12＋9×14 MW等）2023-12-12投產；新華社說該項目「創新研發了具有新型過渡段結構的深水區導管架基礎」，一期招標亦為導管架預製與施工（Ⅲ標段12套預製、20套沉樁施工），2021-07「秦航工2300」在惠州海域吊裝導管架（新華網2023-12-13、國資委2023-12-15、中國能建2023-12-18、中國電力招標網2020-06-27、搜狐2021-07-21）。 |
| 中廣核岱山4號（CGN Jiaxing 2 (Zhoushan Daishan 4)） | 300 | 2021 | 高樁承台 | [baijiahao.baidu.com](https://baijiahao.baidu.com/s?id=1671060059350234305&wfr=spider&for=pc) | 中廣核浙江岱山4#為234MW、54台（西區18台4MW、東區36台4.5MW），全場採高樁承台基礎（八樁，鋼管樁直徑1.6m；一期50台承台2020年7月澆築完成，西區144根樁2019年5月31日沉樁完成），2020年12月25日54台全容量投產。來源：全國能源信息平台（百家號）2020-07-02、浙江日報（百家號）2019-06-06、人民網浙江 2020-12-28、讀特 2020-12-25。 |
| 中廣核如東海上風電示範（CGN Rudong Demonstration） | 152 | 2016 | 單樁 | [china.cnr.cn](http://china.cnr.cn/gdgg/20160908/t20160908_523123451.shtml) | 38台、152MW，2016-09全場投運；採可拆卸穩樁平台浮吊沉樁，首個深水區無過渡段單樁（央廣網 2016-09-08；中國電器工業協會轉新華網 2016-09-14）；來源未明說38座全為單樁。 |
| 中廣核如東H8（CGN Rudong H8） | 300 | 2021 | 混合：單樁 49、複合筒 16 | [ecp.cgnpc.com.cn](https://ecp.cgnpc.com.cn/view/staticpags/zgh_zbgg/8a488fc36fae46600171bacf23d163d0.html) | 65 部風機：49 座單樁、16 座全鋼筒型（與複合筒同為以負壓沉入的單筒基礎，筒體與過渡段全為鋼製）；2021 年 12 月全容量併網 |
| 中廣核汕尾後湖（CGN Shanwei Houhu） | 500 | 2021 | 混合：單樁 82、套管式 9 | [chinanews.com](https://www.chinanews.com/m/cj/2021/11-25/9616090.shtml) | 91 部 5.5 MW：82 座單樁、8 座四樁套管、1 座吸力筒套管（中新網 2021 年 11 月全數併網報導） |
| 中廣核陽江南鵬島（CGN Yangjiang Nanpeng Island） | 402 | 2020 | 混合：套管式 41、單樁 32 | [ne21.com](https://www.ne21.com/news/show-135824.html) | 中廣核陽江南鵬島400 MW（73台5.5MW）：四樁導管架41台、普通大直徑單樁29台、嵌岩單樁3台（合計單樁32台），2020-11-17全部73台基礎完工，2020-12中旬全容量併網（中廣核新能源2020-11-19、陽江廣播電視台2021-01-26，世紀新能源網轉載）。 |
| 華潤連江外海（CR Power Lianjiang Waihai） | 700 | 2025 | 混合：單樁 7、套管式 32 | [chinapower.com.cn](http://www.chinapower.com.cn/flfd/xmjz/20240429/244321.html) | 39 部 18 MW 機組：7 座單樁（直徑 10 m）、32 座套管（中國電力網 2024 年 4 月的塔筒供貨報導） |
| 三峽大豐H8-1（CTG Dafeng H8-1 (800 MW)） | 800 | 2025 | 單樁 | [js.chinanews.com.cn](https://www.js.chinanews.com.cn/news/2025/0916/230110.html) | 98 部風機全部為單樁（樁徑 7–9 m、最長 97 m、最重 1,713 t，中新網 2025 年 9 月）；2025 年 12 月 15 日全容量併網 |
| 三峽長樂外海A區（CTG Fujian Changle Waihai A） | 300 | 2021 | 套管式 | [thepaper.cn](https://www.thepaper.cn/newsDetail_forward_9187135) | 37座風機全部為四樁導管架（套管）基礎：中鐵大橋局2020年9月安裝國內首台深水四樁導管架，泰勝藍島承製A區10MW四樁導管架，全場風機基礎鋼管樁直徑僅3.0–3.5 m（導管架樁），未見單樁；37台＝6.7MW×14＋8MW×13＋10MW×10（澎湃新聞2020-09-15、世紀新能源網2020-11-20、2021-05）。 |
| 三峽如東H10（CTG Rudong H10） | 400 | 2021 | 混合：單樁 77、複合筒 23 | [eps.ctg.com.cn](https://eps.ctg.com.cn/cms/channel/1ywgg1/19830.htm) | 100 部 4 MW 風機：77 座單樁、23 座複合筒（2021 年 12 月全容量併網） |
| 三峽如東H6（CTG Rudong H6） | 400 | 2021 | 單樁 | [eps.ctg.com.cn](https://eps.ctg.com.cn/cms/channel/1ywgg1/17129.htm) | 100 部 4 MW 風機，全部為單樁（2021 年 12 月全容量併網；與 H10 共用柔性直流送出） |
| 三峽陽江沙扒二期（CTG Yangjiang Shapa Phase 2） | 400 | 2021 | 套管式 | [ne21.com](https://www.ne21.com/news/show-166702.html) | 三峽陽江沙扒二期400 MW（62台6.45MW，水深28–32 m），2021-11-27全部機組投產。基礎為導管架：項目設計四樁非嵌岩導管架、芯柱式嵌岩三樁導管架、植入式嵌岩導管架多種型式（三峽新能源2020-08-31），投產報導稱完成國內首個大直徑非嵌岩四樁導管架與芯柱嵌岩三樁導管架施工（三峽能源珠江公司2021-11-29，世紀新能源網轉載）。各型式座數未查到。 |
| 三峽漳浦六鰲二期（CTG Zhangpu Liu'ao Phase 2） | 400 | 2024 | 套管式 | [gxt.fj.gov.cn](https://gxt.fj.gov.cn/zwgk/xw/hydt/snhydt/202405/t20240523_6453562.htm) | 四樁套管（福建省工信廳：機位水深逾 46 m，設計團隊採「4 樁導管架」）；28 部 13 MW 以上機組（含 6 部 16 MW），2024 年 6 月全容量併網（澎湃新聞） |
| 東海大橋海上風電場（Donghai Bridge） | 102 | 2010 | 高樁承台 | [shanghai.gov.cn](https://www.shanghai.gov.cn/nw5827/20200905/0001-5827_437507.html) | 34 部 3 MW 風機立在高樁混凝土承台上（上海市政府：2010 年 6 月 8 日全部風機併網），中國第一座大型離岸風場 |
| 東海大橋海上風電場二期（Donghai Bridge Phase II） | 102 | 2015 | 高樁承台 | [geoseu.cn](https://www.geoseu.cn/yanjiuyuan/5136.html) | 二期 28 台（27 台上海電氣 3.6MW＋1 台華銳 5MW）2015 年 2 月 12 日併網（澎湃新聞 2019）；鑒衡認證專文（geoseu.cn）指東海大橋風電場全場 20.4 萬千瓦、安裝 3.0MW 與 5.0MW 機組，採用斜高樁承台基礎。 |
| 福清海壇海峽（Fuqing Haitan Strait） | 300 | 2021 | 高樁承台 | [ne21.com](https://www.ne21.com/news/show-160542.html) | 46座風機全部採嵌岩高樁承台（六樁直樁高樁承台）：華電重工2021-04-16完成46個機位全部沉樁，2021-10-02全部吊裝，2021-11-18全部並網（世紀新能源網2021-04-30、2021-10-09；廣東省水力和新能源發電工程學會轉中國電力新聞網2021-11-22）。 |
| 福清興化灣一期樣機試驗風場（Fuqing Xinghua Bay Phase 1 (demo)） | 77.4 | 2018 | 高樁承台 | [geoseu.cn](https://www.geoseu.cn/yanjiuyuan/5136.html) | 樣機試驗風場 14 台（7 家廠商，5–6.7MW，共 79.4MW）全部採用大直徑直高樁承台基礎（鑒衡認證專文，geoseu.cn；水深 5–16m、淺覆蓋層）。 |
| 粵電陽江青洲一、二（Guangdong Energy Yangjiang Qingzhou 1&2） | 1,000 | 2024 | 套管式 | [ccedia.com](https://www.ccedia.com/gas_detail/c-_detailId=1632992535936905216.html) | 92 部 11 MW 全部為套管（水深 35–43 m；施工標段為 92 座套管與基礎鋼管樁，中國能源新聞網另提「新型過渡段結構的深水區導管架基礎」）；2023 年 12 月 12 日全容量併網 |
| 粵電湛江外羅一期（Guangdong Energy Zhanjiang Wailuo Phase 1） | 200 | 2019 | 單樁 | [sasac.gov.cn](http://www.sasac.gov.cn/n2588025/n2588124/c11303731/content.html) | 粵電湛江外羅 198MW：36 台 5.5MW，36 根大直徑單樁 2019-05-20 全部沉樁完成（中國能建稿，國資委 2019-05-28）。 |
| 粵電湛江外羅二期（Guangdong Energy Zhanjiang Wailuo Phase 2） | 200 | 2021 | 單樁 | [ne21.com](https://www.ne21.com/news/show-165743.html) | 200MW、32台6.25MW機組，採大直徑單樁基礎（樁重817t、長64m），2021-09-06全部吊裝完成（世紀新能源網 2021-09）。 |
| 粵電珠海金灣（Guangdong Energy Zhuhai Jinwan） | 300 | 2021 | 單樁 | [kb.southcn.com](https://kb.southcn.com/kb/d69d07d3be.shtml) | 55台5.5MW全部採單樁（單根鋼管樁，直徑7.5–8.5 m，最重1470 t），2020-05-16完成最後一座基礎沉樁，2021-04-02全部55台並網（南方網2020-05-17、廣東省國資委2021-04-07）。 |
| 广东阳江南鹏岛海上风电项目 (中节能)（Guangdong Yangjiang Nanpengdao (China Energy Conservation) Offshore wind farm） | 302 | 2021 | 套管式 | [cecep.cn](https://www.cecep.cn/cecep/news/xsqydt/2025/6/phoneI1384972707912744960.html) | 55 台 5.5 MW 全部採四樁導管架（中國節能集團 2025-06；新浪財經轉陽江日報 2023）；2021-11 全容量投產。 |
| 广东阳江沙扒海上风电场（粤电）（Guangdong Yangjiang Shaba (Guangdong Energy) Offshore wind farm） | 300 | 2021 | 套管式 | [ne21.com](https://www.ne21.com/news/show-134345.html) | 47台（46台6.45MW＋1台5.5MW，中新網2021-08-31）全為導管架類基礎：A標段（廣東火電）為嵌岩與非嵌岩四樁導管架，B標段（中鐵大橋局）含植入式嵌岩三樁導管架，另有三桶吸力樁型式；2021-08-31全部風機基礎完工（世紀新能源網2020-05；中新網／微信轉載，後者無法機器核對）。各型式座數未查到。 |
| 广东湛江徐闻海上风电场（Guangdong Zhanjiang Xuwen Offshore wind farm） | 906 | 2022 | 單樁 | [m.gdzjdaily.com.cn](https://m.gdzjdaily.com.cn/p/2816813.html) | 原場600 MW＝94×6.45 MW，2021-11-26全部併網，報導稱「30天內完成單樁沉樁20根」（湛江日報2021-11-26）；300 MW增容＝25×12 MW，「風機基礎全部採用單樁基礎」（樁徑8.75–9.7 m），2024-12-17全容量併網（搜狐／龍船風電網2023-09-21、2024-07-03，CPEM 2024）。原場94座未見逐場型式說明，僅有單樁沉樁報導。 |
| 廣西防城港海上風電示範項目A場址（Guangxi Fangchenggang A） | 700 | 2024 | 套管式 | [sasac.gov.cn](http://www.sasac.gov.cn/n2588025/n2588129/c32426404/content.html) | 83 部 8.5 MW 全部為三樁嵌岩套管：岩基海床，鋼管樁鑽孔嵌岩後灌漿，套管三腳插入樁內（國資委、新華網）；中國第一座全場採嵌岩基礎的離岸風場 |
| 國電舟山普陀6號2區（Guodian Zhoushan Putuo 6#2） | 252 | 2019 | 高樁承台 | [ceic.com](https://www.ceic.com/gjnyjtww/chnyxfc/202006/e5a14799afc44f2a890f4e1784673ac0.shtml) | 國電電力舟山普陀6號2區：63 台西門子 4MW 風機採「高樁高承台改進型」基礎，2019-04 全部併網（國家能源集團 2020-06）。 |
| 國華東台四期H2（Guohua Dongtai IV (H2)） | 300 | 2019 | 單樁 | [baijiahao.baidu.com](https://baijiahao.baidu.com/s?id=1639399792956561145&wfr=spider&for=pc) | 302.4MW，63台上海電氣4.0MW＋12台遠景4.2MW，共75台；2019年7月16日「16號單樁沉樁結束，單樁基礎施工宣告完成」，百度摘要稱工程含73台單樁基礎及75台風機安裝（其餘2台基礎型式未查明）；16號機位為全球首次單樁基礎整機吊裝；2019年12月全部並網。來源：東台市委宣傳部（幸福東台）2019-07-18、澎湃／國家能源集團 2019-12、三航新能源（搜狐）2018-12。 |
| 國華如東H14（Guohua Rudong H14） | 300 | 2021 | 單樁 | [news.96189.com](https://news.96189.com/w/2008/ebbbbcec80b94ed8a6b9441a968e997c.html) | 如東H14為魯能新能源（中國綠發）200MW、50台4MW上海電氣機組，50根單樁基礎於2020年8月全部完工（亞洲首次大直徑單樁浮運沉樁），2020年12月全場並網。來源：南通發布（96189）2020-08-29、電力科技網 2020-07-31、新華網 2023-08-17。 |
| 國能大豐H5（Guoneng Dafeng H5） | 200 | 2021 | 單樁 | [ne21.com](https://www.ne21.com/news/show-155282.html) | 32台GW184-6.45MW、206.4MW，風機基礎全部採無過渡段單樁（華電重工／世紀新能源網 2021-01-05；大豐區政府 2024-12）；2021年12月全容量併網（江蘇省國資委 2022-04）。 |
| 國信大豐85萬千瓦海上風電（Guoxin Dafeng 850 MW） | 850 | 2025 | 單樁 | [ddx.gubit.cn](http://ddx.gubit.cn/fenxi/002608/202510081600.html) | 100×8.5 MW，「風機基礎全部採用大直徑單樁結構」，2025年完成100根單樁基礎施工，2025-12-29全部風機併網（查股網／交匯點2025-10-08、國資委2026）。 |
| 海油觀瀾號（Haiyou Guanlan (CNOOC floating)） | 7.2 | 2023 | 浮動式（半潛式） | [offshorewind.biz](https://www.offshorewind.biz/2023/05/22/china-connects-deepwater-floating-wind-platform-to-wenchang-oil-field/) | 半潛式；供電給文昌油田群，不接公用電網 |
| 華能大豐海上風電（Huaneng Dafeng） | 300 | 2019 | 單樁 | [baijiahao.baidu.com](https://baijiahao.baidu.com/s?id=1642946831276885180&wfr=spider&for=pc) | 華能江蘇大豐300MW（毛竹沙海域，離岸55km）分標段施工：中天海洋工程標段共沉樁31根（5MW級單樁，2019年8月完成）；中交一航局Ⅰ標段33根鋼管樁、34台風機（2019年8月20日沉樁完成，9月29日最後一台吊裝並網）。兩標段皆為單樁／鋼管樁，但全場機組總數與是否尚有其他標段未查得。來源：中天科技（百家號）2019、中交一航局（澎湃）2019。 |
| 華能灌雲海上風電（Huaneng Guanyun） | 300 | 2021 | 單樁 | [jsnews.jschina.com.cn](https://jsnews.jschina.com.cn/lyg/a/201910/t20191016_2407402.shtml) | 一期300MW、48台（46台6.45MW＋2台3MW），風機基礎為單樁（2019年10月已完成10根單樁沉樁），2021年6月29日48台全部吊裝，2021年7月30日全容量並網。單樁全數完成的紀錄未抓到。來源：中國江蘇網 2019-10-16、風能產業網（CWEEA）2021-07-05、華能國際（中證網）2021。 |
| 華能臨高CZ1（Huaneng Lingao CZ1） | 600 | 2025 | 單樁 | [mm.chinapower.com.cn](http://mm.chinapower.com.cn/flfd/xmjz/20241118/267592.html) | 60 部 10 MW 全部為單樁（直徑 8.25–9.6 m、長 82–109 m、重 1,191–1,938 t；2024 年 11 月 17 日全部沉樁完成，中國電力網） |
| 華能射陽H1（Huaneng Sheyang H1 / Yancheng） | 300 | 2021 | 單樁 | [baijiahao.baidu.com](https://baijiahao.baidu.com/s?id=1663862963857905743&wfr=spider&for=pc) | 華能射陽海上南區H1#300MW：67台風機，67根單樁基礎於2020年4月1日全部沉樁完成（華電重工承建其中37根），2020年11月1日67台全部吊裝完成。來源：中國華能（百家號）2020-04、中國縣域經濟報（百家號）2020-11-05。 |
| 華潤電力蒼南1號（Huarun Cangnan 1 / CR Power） | 400 | 2022 | 單樁 | [cpem.org.cn](https://www.cpem.org.cn/list68/64746.html) | 49 部（6.25 與 10 MW）全部為單樁：原設計 29 座單樁＋48 座高樁承台，改為全場單樁（華潤電力建設紀實，CPEM 轉載）；2022 年 12 月 28 日全容量併網 |
| 江苏竹根沙H1#海上风电场（Jiangsu Dongtai Zhugensha H1 Offshore wind farm） | 200 | 2021 | 單樁 | [bioffshore.com](http://www.bioffshore.com/news/1.html) | 國華竹根沙H1# 200MW、50台4.0MW，風機基礎鋼管樁全由泰勝藍島承製，2021-05-04最後一套單樁交付（南通泰勝藍島 2021-05-08）。 |
| 啟東H1、H2（Jiangsu Qidong H1+H2） | 503 | 2021 | 單樁 | [ne21.com](https://www.ne21.com/news/show-163136.html) | H1、H2 共 84 部風機各一根單樁（中交一航局承建 84 根，2021 年 6 月打到第 64 根；南通發布） |
| 华能大连庄河Ⅳ海上风电场1场址（Liaoning Dalian Zhuanghe 4 Area I Offshore wind farm） | 350 | 2021 | 單樁 | [news.qq.com](https://news.qq.com/rain/a/20210702A0AYV400) | 51 台（26×7.5 MW＋25×6.2 MW，惠生海工）；中新網 2021-07-02：單根鋼管樁（頂徑 6.5 m、底徑 7.2 m、長 78 m、1080 t）即為 2 號機位的基礎結構，為大直徑單樁；2021-12-29 全容量併網（新華網）。新華網另註明吸力桶導管架用於 Ⅱ 風場，非 Ⅳ1。 |
| 大豐H3海上風電（Longyuan Dafeng H3 (Huaneng Dafeng)） | 300 | 2018 | 單樁 | [hhi.com.cn](http://www.hhi.com.cn/webfront/webpage/web/contentPage/id/d9cce3cb2d854c7aa1568d2539cbf481) | 大豐H3#300MW（302.4MW，72台4.2MW）由華電重工承建，合同即為「單樁與海上升壓站基礎施工」；2018年9月已完成65根單樁，同年10月22日全部72根單樁完成（東方風力發電網／北極星，無法抓取）；2018年12月20日全容量投產。來源：華電科工官網 2018-09-19、國家電投江蘇公司（ne21 轉載）2022-01-18。 |
| 明陽天成號浮式（Mingyang OceanX (Tiancheng) floating） | 16.6 | 2024 | 浮動式（半潛式） | [mlit.go.jp](https://www.mlit.go.jp/kowan/content/001869831.pdf) | 一座浮台上兩部 8.3 MW 風機，浮台由浮筒與混凝土構件組成（日本國土交通省的調查列為半潛式） |
| 國家電投濱海北H1（SPIC Binhai North H1） | 100 | 2016 | 單樁 | [ceeia.com](https://www.ceeia.com/QYDT/d/201711/71378.html) | 25 台西門子 4MW 全部採用 6m 以上超大直徑無過渡段單樁（國內首次），2015 年 10 月 3 日開工、2016 年 6 月 6 日整體投運（中國電器工業協會 2017 年 11 月，轉載國家優質工程金獎報導）。 |
| 國家電投濱海北H2（SPIC Binhai North H2） | 400 | 2018 | 單樁 | [jsea.org.cn](http://www.jsea.org.cn/end.asp?id=1674) | 100 部 4 MW 全部為大直徑無過渡段單樁（2017 年 5 月至 2018 年 3 月沉樁；江蘇省電機工程學會的華電重工工法介紹） |
| 國家電投濱海南H3（SPIC Binhai South H3） | 300 | 2019 | 單樁 | [baijiahao.baidu.com](https://baijiahao.baidu.com/s?id=1686861092320507372&wfr=spider&for=pc) | 75台4.0MW，全部採用直徑5.5–7m無過渡段鋼管樁（單樁）基礎；2020年12月9日75根樁全部沉樁完成，2020年12月底建成投產。來源：全國能源信息平台（百家號）2020-12、國家電投江蘇公司（ne21 轉載）2022-01-18。 |
| 山東渤中B2（Shandong Bozhong B2） | 502 | 2023 | 單樁 | [cpem.org.cn](http://www.cpem.org.cn/list68/44814.html) | 59 部 8.5 MW 全部為單樁（2022 年 10 月首樁直徑 7.2 m、長 82 m、重 967 t；CPEM 轉載國家能源集團報導，國家能源集團 2023 年 6 月全容量併網報導寫 59 部） |
| 山東能源渤中A（Shandong Energy Bozhong A） | 501 | 2022 | 單樁 | [news.bandao.cn](http://news.bandao.cn/a/620265.html) | 60×8.35 MW（501 MW），全場單樁60根（大金重工製30根、煙台打撈局施工30台單樁基礎，2022-04-16首樁沉樁）（半島網／新華社2022-05-04、搜狐／煙台打撈局2022-04-19）。 |
| 山東海衛半島南U（Shandong Haiwei Peninsula South U） | 450 | 2025 | 單樁 | [ne21.com](https://www.ne21.com/news/show-201133.html) | 53 座單樁（龍源振華 2024 年 9 月全部沉樁完成；53 部 8.5 MW） |
| 华能山东半岛北L场址海上风电项目（Shandong Huaneng Offshore L Area wind farm） | 504 | 2026 | 套管式 | [wap.sasac.gov.cn](http://wap.sasac.gov.cn/n2588025/n2588124/c35402269/content.html) | 42 部 12 MW 全部用四樁套管（最高 83.9 m），水深 52–56 m、離岸約 70 km，中國水深最深的商轉離岸風場；2026 年 4 月 7 日全容量併網（國資委、人民日報） |
| 上海金山海上风电场一期（Shanghai Jinshan Offshore wind farm） | 306 | 2025 | 單樁 | [cweea.com.cn](https://www.cweea.com.cn/xwdt/html/40620.html) | 36 根單樁基礎、36 台 8.5 MW（中交三航局施工內容，風能產業網 2025）；2025-09-23 全容量併網（人民網上海 2025-09-25）。 |
| 上海臨港海上風電一期（Shanghai Lingang Demonstration Phase 1） | 102 | 2019 | 高樁承台 | [fegroup.com.cn](https://www.fegroup.com.cn/ydkg/xwzx79/gsxw10/577818/index.html) | 一期示範項目 25 台 4MW（上海電氣 W4000）全部採用高樁承台：遠東集團 2019 年報導「從沉樁、承台澆築到完成全部 25 台風機安裝」，2018 年 5 月 8 日開工、主體 238 天完成。 |
| 申能海南CZ2（Shenergy Hainan CZ2 (Dongfang)） | 600 | 2024 | 單樁 | [finance.sina.com.cn](https://finance.sina.com.cn/jjxw/2024-05-26/doc-inawpazx5145233.shtml) | 67 部 9 MW 風機各立在一根單樁上（海南日報 2024 年 5 月的施工報導，單樁長 95.7 m、直徑 8.8 m、重 1,639 t） |
| 三峽引領號（Yangjiang Shapa 'Sanxia Yinling' floating） | 5.5 | 2021 | 浮動式（半潛式） | [sasac.gov.cn](http://www.sasac.gov.cn/n4470048/n22624391/n26705666/n26705673/n26705740/c26786615/content.html) | 半潛式平台 |
| 苍南 2 号二期海上风电项目（Zhejiang Cangnan 2 Offshore wind farm） | 301 | 2023 | 單樁 | [news.qq.com](https://news.qq.com/rain/a/20230419A0355R00) | 華能蒼南 2 號 36 部 8.5 MW 全部為單樁（新京報 2023 年 4 月「國內在建最大單樁風電項目」報導；最長樁 118 m、2,328 t，CPEM） |
| 浙能嘉興1號（Zhejiang Energy Jiaxing 1） | 300 | 2021 | 混合：高樁承台 37、單樁 37 | [news.qq.com](https://news.qq.com/rain/a/20211121A08Z6200) | 301.2MW、74台：37台採多樁（8根1.6m鋼樁的高樁承台）基礎、37台採單樁基礎，共333根樁；2019年10月7日開始打樁，2021年10月29日74台吊裝完成，2021年11月21日全容量並網。來源：錢江晚報／潮新聞（騰訊）2021-11-21、浙江在線 2021-11-22、浙江省國資委（國資委網）2021-11-23。 |
| 浙江嵊泗5# 6#海上风电（Zhejiang Shengsi 5, 6 Offshore wind farm） | 281 | 2021 | 高樁承台 | [offshorecable.com.cn](http://www.offshorecable.com.cn/news/show.php?itemid=17825) | 中廣核嵊泗5#6#：45 台 6.25MW 風機全部採八樁高樁承台基礎，360 根鋼管樁 2021-02-02 沉樁收官（中廣核新能源稿，中國海上風電網 2021-02-03）。 |
| 浙江象山1#海上风电场二期（Zhejiang Xiangshan 1 Offshore wind farm） | 758 | 2021 | 混合：高樁承台 43、單樁 54 | [ceic.com](https://www.ceic.com/gjnyjtww/chnyxfc/202101/e0582b74a0ef45c88a70e33ecc70a6ff.shtml) | 一期 41 部 6.2 MW：23 座高樁承台＋18 座單樁（國家能源集團）；二期 56 部 9 MW：36 座單樁＋160 根群樁（象山發布經中國線纜網），即 20 座高樁承台；兩期合計 43 座承台、54 座單樁 |
| 莊河V（Zhuanghe V） | 250 | 2025 | 單樁 | [finance.sina.com.cn](https://finance.sina.com.cn/jjxw/2025-04-13/doc-inesycqi0944554.shtml) | 招商局太平灣與三峽能源的大連莊河海上風電場址V項目250 MW（24台9MW＋4台8.5MW），風機基礎全部採單樁—摩擦筒結構，2025-03-31基礎全部完工、2025-04-20主體完工（大連天健網／中新網遼寧2025-04-22、新浪財經2025-04-13；中交一航局2025-03-31報導因網站拒絕存取未能抓取）。 |

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
| Vindeby | 5.0 | 1991 | 重力式 | [windpowermonthly.com](https://www.windpowermonthly.com/article/1427436/dong-begins-vindeby-decommissioning-pictures) | 世界第一座離岸風場：11 部 450 kW 坐在混凝土重力式基礎上（Ørsted 稱基礎以燈塔基礎為本，澆灌後浮運到場填砂）；2017 年 9 月拆除完畢 |

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
| Yttre Stengrund | 10.0 | 2001 | 單樁 | [windpowermonthly.com](https://www.windpowermonthly.com/article/1375616/yttre-stengrund-decommissioning-begins) | 5 部 2 MW 立在單樁上；2015 年 11 月除役，單樁切至海床面（Windpower Monthly） |

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
| Beatrice Demonstrator | 10.0 | 2007 | 套管式 | [en.wikipedia.org](https://en.wikipedia.org/wiki/Beatrice_Wind_Farm) | 2 部 5 MW 示範機立在四腳套管上（每座用四根 1.8 m 樁固定，水深約 45 m，2007 年）；油田 2015 年停產，示範機預定 2024 至 2027 年間除役 |
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
| Lely (Medemblik) | 2.0 | 1994 | 單樁 | [offshorewind.biz](https://www.offshorewind.biz/2016/12/07/lely-wind-farm-fully-decommissioned-video/) | 荷蘭第一座離岸風場：4 部 500 kW 各立在一根單樁上（樁長 26 m、直徑 3.2–3.7 m）；2016 年底以振動錘整根拔除 |
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

### 越南

| 風場 | MW | 年份 | 型式 | 來源 | 說明 |
|---|---:|---:|---|---|---|
| Bến Tre 10 Bình Đại 1 Offshore wind farm | 128 | 2021 | 單樁 | [nangluongvietnam.vn](https://nangluongvietnam.vn/khoi-cong-lap-dat-cac-tru-mong-du-an-dien-gio-ngoai-khoi-binh-dai-25662.html) | Gulf 旗下湄公風電平大風場：2020-11 開工打設單樁（越南首個 monopile 專案）；PTSC PPS 2023 年基礎檢查資料寫全場 31 座、單樁直徑 5.5 m、總容量 128 MW。 |
| Dong Hai 1 Offshore wind farm | 100 | 2021 | 高樁承台 | [plc-corp.vn](https://plc-corp.vn/cong-ty-thi-cong-dong-coc-tren-bien.html) | 北方能源薄寮東海1號 26 座 Vestas V150-4.0（一期 13＋二期 13）：PLC 公司說明在薄寮東海1號與和平1、2 打設 63–76 m 超長 PHC D800 樁作風機基礎，即 PHC 群樁＋承台。 |
| 東海1號（茶榮）（Dong Hai 1 – Tra Vinh (Trungnam)） | 100 | 2021 | 高樁承台 | [bactrungnam-vn.com](https://bactrungnam-vn.com/nha-may-dien-gio-dong-hai-1-v7-1-2/) | 中南集團茶榮東海1號 25 座：分包商北中南建設說明基礎為預應力離心混凝土樁（每座 34 支 D1000 或 44 支 D800）加鋼筋混凝土承台，2021-02～07 施工。 |
| 和平1號一期（Hoa Binh 1 Phase 1） | 50.0 | 2021 | 高樁承台 | [plc-corp.vn](https://plc-corp.vn/cong-ty-thi-cong-dong-coc-tren-bien.html) | 方英集團和平1號一期 13 座 Vestas（2021-07-02 送電）：PLC 與 Vinaincon 均記載和平1、2 風機基礎為 PHC D500C／D800C 預應力離心混凝土樁，即群樁＋承台。 |
| 和平1號二期（Hoa Binh 1 Phase 2） | 50.0 | 2021 | 高樁承台 | [plc-corp.vn](https://plc-corp.vn/cong-ty-thi-cong-dong-coc-tren-bien.html) | 和平1號二期 13 座（和平1號二期＋和平2號共 26 座，2021-08-05 送電；業主方英集團）：基礎同一期，PHC 預應力混凝土樁群＋承台。 |
| 和平2號（Hoa Binh 2） | 50.0 | 2021 | 高樁承台 | [plc-corp.vn](https://plc-corp.vn/cong-ty-thi-cong-dong-coc-tren-bien.html) | 和平2號 13 座（2021-09-15 送電，和平1、2 共 39 座；業主方英集團）：PHC 預應力混凝土樁群＋承台。 |
| 朔莊7號一期（Soc Trang 7 Phase 1） | 30.0 | 2021 | 高樁承台 | [baoxaydung.vn](https://baoxaydung.vn/ngam-canh-dong-dien-gio-tren-bien-soc-trang-192240422101537121.htm) | 春球朔莊7號一期 7 座 4.2 MW（2021-10 運轉）：建設報 2024-04 寫「多樁基礎，每座由 40 支混凝土樁組成」，即混凝土群樁＋承台。 |
| 新富東1號（Tan Phu Dong 1 (Tien Giang, GEC)） | 100 | 2023 | 高樁承台 | [lethycorp.com](https://lethycorp.com/en/du-an-da-thi-cong/tan-phu-dong-1-html) | GEC 新富東1號 24 座（PC1 EPC，2022-10 裝完最後一座）：黎蒂建設承做 PHC D800 樁打設，建設雜誌 2022-05 報導 24 座基礎供應混凝土，即 PHC 群樁＋承台。 |
| 新順風場（Tan Thuan (PECC2) Phase 1+2） | 75.0 | 2021 | 高樁承台 | [phanvu.vn](https://www.phanvu.vn/truyen-thong/tin-hoat-dong/dien-gio-tan-thuan-chao-mung-25-nam-ngay-thanh-lap-phan-vu) | 金甌新順 75 MW、18 座（PECC2 EPC，2021-10-30 COD）：潘武集團承做全部 18 座的混凝土樁打設與承台，2021-05 樁全部完成，即混凝土群樁＋承台。 |
| Thanh Hải No. 5 Offshore wind farm | 120 | 2021 | 高樁承台 | [evn.com.vn](https://www.evn.com.vn/d6/news/Khanh-thanh-Nha-may-dien-gio-so-5-Thanh-Hai-Ben-Tre-100-668-55952.aspx) | 新環球檳椥（Tân Hoàn Cầu Bến Tre）5號風場：成海1–4 共 28 座、120 MW（EVN 2022-07）；黎蒂建設負責「打設 D800 預應力混凝土樁並完成基礎」，一期 7 座、二期 21 座，即 PHC 群樁＋承台。 |
| 茶榮V1-2（V1-2 Truong Long Hoa (Tra Vinh)） | 48.0 | 2021 | 單樁 | [ttvngroup.vn](https://www.ttvngroup.vn/en/hoa-hoi-solar-power-plant-and-v1-2-wind-power-plant-owned-by-the-joint-venture-of-ttvn-group-and-thailand-partners-awarded-as-2021typical-renweable-energy-project/) | V1-2 48 MW、12 座：長城越南集團（TTVN）與企業論壇報 2021 年記載採 5.5 m 直徑鋼製單樁（monopile）以法蘭螺栓接塔，12/12 全部完成。 |
| 茶榮V1-3（V1-3 Truong Long Hoa 48 MW (REE, Tra Vinh No.3)） | 48.0 | 2021 | 高樁承台 | [vssmge.org](https://vssmge.org/thiet-ke-va-thi-cong-mong-tru-dien-gio-tai-cac-du-an-cua-fecon/) | REE 茶榮 V1-3 48 MW：FECON 承做 PHC D800C／D500C 樁與風機基礎，越南土力學會論文列「12 móng cọc PHC（D m = 21,5 m）」，即 PHC 群樁＋承台。 |
| 檳椥VPL（VPL Ben Tre (Nexif Ben Tre 1)） | 30.0 | 2021 | 高樁承台 | [phanvu.vn](https://www.phanvu.vn/en-US/vpl-ben-tre-wind-power-plant-p1) | VPL 檳椥一期 30 MW（平大縣淺水區）：潘武集團供應 D800C 離心混凝土樁（客戶陸路3公司），即混凝土群樁＋承台；座數未查到。 |

## 查過但暫不列入的風場

| 風場 | OSPAR | 理由 |
|---|---|---|
| 南韓 · Ulsan Dongbu floating demo (Vindmøllen 750 kW) | — | 計畫中的 750 kW 半潛式試驗機；2019 年 11 月仍因許可未發而沒有安裝，查不到之後在海上發電的紀錄，待查證 |
| 丹麥 · Frederikshavn | DK03 | 試驗場：丹麥能源署記載 2003 年在海上設 3 部（7.6 MW），港口擴建後兩部已在陸地上、海上只剩 1 部 2.3 MW，但沒寫是哪一部；各機組的基礎不同（其中一部 V90 用吸力桶試驗基礎），OSPAR 寫全為單樁、14 MW 也對不上，先不列 |
| 日本 · Eurus Akita Port semi-offshore | — | JWPA 另計為「セミ洋上」的 1 部 3 MW：ユーラス秋田港ウインドファーム（6 部 3 MW，2015 年 2 月運轉）中立在水中的那一部；查不到業主、施工廠商、NEDO、國土交通省或 JWPA 的文件寫出它的基礎型式 |
| 南韓 · Yeonggwang Wind offshore wind farm | — | 靈光風電陸海混合風場（35 部、79.6 MW）中立在潮間帶的 15 部 2.3 MW，退潮時周圍是灘地；查不到開發商、施工廠商或政府文件寫出這 15 部的基礎型式 |
