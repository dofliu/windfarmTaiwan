# 其他國家的即時風電資料：可行性評估

[English](./live-data-sources.en.md) ｜ 中文（本頁）

> 2026-09-26（UTC 10:40–11:02）以 `curl` 逐一實測各國公開端點，並帶 `Origin: https://dofliu.github.io`
> 檢查瀏覽器能否直接讀取（CORS）。沒有註冊任何帳號、沒有使用任何金鑰（美國 EIA 官方公開的測試用 `DEMO_KEY` 除外）。
> 沒能實測成功的項目另列在最後一節。2026-10-10 接入國家層級的總量時，再實測一次英國、德國、法國、丹麥、德州、加州的端點並查了授權。

## 目前狀態（2026-10 更新）

**已接入（逐場）**：澳洲東部電網（AEMO）、加拿大亞伯達（AESO）與安大略（IESO），由 `intl_wind_scraper.py` 約每 2 小時抓取，
輸出 `data/live/intl_realtime.json`。

**已接入（只有總量，v2.31.0；比利時、波蘭 v2.32.0；愛爾蘭、北愛爾蘭、韓國 v2.33.0；巴西 v2.34.0）**：大不列顛、北愛爾蘭、愛爾蘭、德國、法國、丹麥、比利時、波蘭、韓國、巴西全國，以及美國德州（ERCOT）、加州（CAISO）電網的風電總出力，
同一支程式、同一次 commit，寫在同一檔的 `nat`。每個來源存最新一筆（時間、MW；德、法、丹另有陸域／離岸）與過去 48 小時每個整點的平均；
ERCOT 另存同一儀表板的當月風電容量、比利時另存 Elia 的監測容量，國家概況只對這兩個顯示「約為容量的幾 %」，其他來源沒有同口徑的容量，不算百分比。
任一來源失敗時保留上一次的數值並標示 `ok: false`。

| 代碼 | 來源 | 範圍與注意事項 | 解析度 · 實測延遲（10/10） |
|---|---|---|---|
| GB | Elexon BMRS `FUELINST`（`fuelType=WIND`） | 大不列顛（不含北愛爾蘭）由電網營運計量的風電；大部分接在配電網的風機沒有營運計量（[英國能源部 2012 年的說明](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/65923/6487-nat-grid-metering-data-et-article-sep12.pdf)：「generation units connected to the low voltage distribution system ("embedded" generation) are excluded from operational metering」），所以低於全國實際出力；陸域、離岸不分 | 5 分鐘 · 約 5 分鐘 |
| DE | SMARD `chart_data`（陸域 4067、離岸 1225，`quarterhour`） | 德國全國。數值是每 15 分鐘的發電量（MWh）：同一小時的四個 15 分鐘值相加等於小時檔的值，所以 × 4 才是平均功率（MW）。每週一個檔，跨週時多讀前一週 | 15 分鐘 · 約 45 分鐘 |
| FR | ODRÉ `eco2mix-national-tr`（`exports/json`） | RTE 的即時資料，資料集說明寫明是遙測值加上估計值（「complétées par des forfaits et estimations」），之後換成結算數字；每位使用者每月限 50,000 次 API 呼叫（本站每天 12 次） | 15 分鐘 · 約 15 分鐘 |
| DK | Energinet `PowerSystemRightNow` | DK1＋DK2，陸域與離岸分開 | 1 分鐘 · 約 1 分鐘 |
| ERCOT | `ercot.com/api/1/services/read/dashboards/fuel-mix.json` | ERCOT 約占德州用電的九成（[ERCOT 簡介](https://www.ercot.com/about)：「about 90 percent of the state's electric load」）；只有昨天與今天，較早的小時沿用上一次的檔案。偶爾回 403，程式等 10 秒重試一次 | 5 分鐘 · 約 5 分鐘 |
| CAISO | `caiso.com/outlook/current/fuelsource.csv`＋`outlook/history/日期/fuelsource.csv` | CAISO 約供應加州八成的用電（[CAISO 2024 年 10 月 Key Statistics](https://www.caiso.com/documents/key-statistics-oct-2024.pdf)：「Serve ~80% of California demand」）；檔內只有當地時間，依太平洋時間換算 | 5 分鐘 · 約 5 分鐘 |
| BE | Elia 開放資料 `ods086`（近即時）＋`ods031`（歷史），`exports/json` | 比利時全國：離岸（Federal）、法蘭德斯與瓦隆的陸域，各分輸電網與配電網，每個時段 5 列，五列齊全才加總。欄位是「Measured & upscaled」：有監測的風場實測後推估到全部容量；另有「監測容量」合計約 6.0 GW，國家概況以它算百分比。近即時資料集只有今天，較早的時段用歷史資料集（同樣 5 列） | 15 分鐘 · 約 25 分鐘 |
| PL | PSE 首頁「Mapa KSE」的 `www.pse.pl/transmissionMapService`（此刻）＋`api.raporty.pse.pl` 的 `his-wlk-cal`（趨勢） | 此刻值是網頁地圖小工具的資料端點（陸域、離岸風電，沒有公開文件，可能變動），只有一筆快照、沒有歷史；PSE 報表 API 的實際風電（`wi`＝「Sumaryczna generacja Źródeł Wiatrowych / Total generation of Wind Sources」，見 [EndpointsMap.pdf](https://api.raporty.pse.pl/EndpointsMap.pdf)）次日約 00:52 UTC 才公布，所以趨勢的前一天以前用它（`dtime_utc` 是時段結束），今天只有本站約每 2 小時的快照；API 其他有風電欄位的端點都是預測或日前計畫 | 快照 · 約 1 分鐘（趨勢的官方值晚一天） |
| IE、NI | EirGrid Smart Grid Dashboard 的 `smartgriddashboard.com/api/chart/?region=ROI\|NI&chartType=wind&dateRange=day&areas=windactual` | 愛爾蘭共和國（ROI）放在愛爾蘭的概況、北愛爾蘭（NI，SONI 區域）放在英國的概況（大不列顛的數字不含北愛爾蘭）；全島（ALL）＝ROI＋NI。數值是 EirGrid 對全部風場出力的估計（[風電頁](https://www.smartgriddashboard.com/all/wind/)：「Wind Generation is an estimate of the total electrical output of all wind farms on the system」）。網頁背後的資料端點，沒有公開文件（EirGrid 已換過一次端點）；時間是愛爾蘭當地時間、不帶時區，沒說明是時段起點、終點還是瞬時值；一次可取多天，取三天剛好涵蓋 48 小時。沒有同口徑的裝置容量（年報的兩地資料日期不同），不算百分比 | 15 分鐘 · 約 2–6 分鐘 |
| KR | KPX `powerSource.es?mid=a10404030000&device=chart&view_sdate=…&view_edate=…` | 韓國全國每 5 分鐘的瞬時值（網頁註明「실시간 전력수급현황은 5분주기 순시자료 입니다」，2024-11-23 起風電單獨列出），網頁內嵌 `var ictArr = [...]`，以日期區間一次取三天（約 1.3 MB）。KPX 說會限制海外 IP 連線，本環境與 GitHub Actions 都連得上（2026-10-10 確認）；容量有兩個數列且彼此不一致，不算百分比 | 5 分鐘 · 約 4–7 分鐘 |
| BR | ONS「Energia Agora」頁背後的 `tr.ons.org.br/Content/Get/Geracao_SIN_Eolica` | 巴西全國互聯電網（SIN）每分鐘的風電，大部分在東北部；頁面註明 2021-03-02 起含「usinas não supervisionadas e sem relacionamento com o ONS」。Google Charts 格式（分鐘序號、MW），只有巴西利亞時間（UTC−3）當天的資料，所以 48 小時趨勢由每次執行累積（午夜前最後約 1 小時可能缺）；更早的同一數列在開放資料入口網站 `balanco-energia-subsistema`（每小時，晚約 30 小時）。ONS 開放資料的風電容量約 33.8 GW 只含 ONS 調度的電廠，與即時值口徑不同，不算百分比 | 1 分鐘（約每 9 分鐘一批）· 最多約 15 分鐘 |

- **地球儀上的顯示**：英（含北愛爾蘭）、愛、德、法、丹、比、波、韓、巴西、美國的國家概況有「此刻」方塊（此刻值、陸域／離岸、48 小時趨勢、範圍說明、授權標示與連結）；
  全球與各洲的概況另有「各地此刻的風電出力」清單（含台灣、澳洲、加拿大），依出力排序、不加總，點名稱進該國概況。
  工具列「即時資料」圖層（v2.35.0）依這些來源替國家上色：涵蓋全國的塗實心青綠，只涵蓋部分地區的（英國、美國、澳洲、加拿大）塗紫色斜線並寫出原因；法國只塗本土。
- **比利時、波蘭的授權（2026-10-10 查明）**：見下面「授權」一節。波蘭的此刻值來自沒有公開文件的網頁端點，網站上寫明；端點失效時保留上一次的數值並標示資料延遲。
- **檔案大小**：`intl_realtime.json` 從約 18 KB 增為約 25 KB（每小時平均以整數 MW、起始時間加陣列存放）。

- **地球儀上的顯示**：國家概況有各電網此刻的總出力與 48 小時趨勢；對應到的風場在卡片、提示與風場清單顯示此刻出力。
  時間軸在最新年份時，這些風場外圈為綠色，葉片轉速依此刻出力。
- **機組對照**（`data/live/units.json`，由 `tools/build_live_units.py` 產生）：
  - 澳洲：108 個風電機組中 104 個對應到風場。
  - 亞伯達：50 個中 49 個。
  - 安大略：45 個全部對應，依 IESO「Transmission-Connected Generation」頁的設施對照人工核對。
  - 對不到的機組只計入電網總量：資料中沒有 Elaine、Yawong、Forty Mile Bow Island 三座風場；Golden Plains 西區在資料中是興建中的整體專案列。
- **授權標示**：AEMO 標示來源；AESO 附版權聲明，限非商業與教育用途、數值不修改；IESO 附其規定的版權聲明全文。
  全國總量的標示（Elexon、SMARD、ODRÉ、Energinet、ERCOT、CAISO）見下面「授權」一節，網站顯示在數值旁，並在「資料來源」視窗列出。

## 結論

可以，但能像台灣一樣「逐座風場、接近即時」的地方不多：

- **澳洲東部電網（NEM）**：約 100 座風場，每 5 分鐘的實測出力（SCADA），延遲約 4 分鐘，不需金鑰。最接近台電的做法。
- **加拿大亞伯達省與安大略省**：亞伯達約 50 座（約 1 分鐘的快照）、安大略 45 座（每小時），不需金鑰。
- **英國**：約 290 個風電機組。逐機組的「預定出力」即時公開，實際計量值卻要約兩週後才公開，所以即時的逐場數字只能是估計值，必須標示「估計」。
- **荷蘭 8 座離岸風場**（NED）與**歐洲 100 MW 以上機組**（ENTSO-E）：都需要免費金鑰，只能由伺服器端（GitHub Actions）抓取；ENTSO-E 的逐機組資料最晚 5 天後才公開。

其他多數國家只公開**國家或區域層級**的即時總量（每 1–15 分鐘一筆）：英國、德國、法國、比利時、波蘭、丹麥、愛爾蘭、美國德州與加州、巴西、日本各電力區域、韓國。
中國與印度找不到可用的公開即時資料。

## 逐座風場的來源（可以在地球儀上點亮個別風場）

| 地區 | 來源 | 風電機組數 | 解析度 · 延遲 | 金鑰 | 瀏覽器可直接讀 | 機組代碼與對照 |
|---|---|---|---|---|---|---|
| 澳洲 NEM | AEMO NEMWeb `Reports/Current/Dispatch_SCADA/`（zip） | 登錄清單 109 個（15.1 GW），最新一檔有 96 個 | 5 分鐘 · 約 4 分鐘 | 不需要 | 否（zip，需 Actions） | DUID（例 `MACARTH1`）；AEMO 登錄清單有名稱、區域、容量，沒有經緯度 |
| 澳洲西澳 | AEMO WA `facilityScada`（JSON） | 17 座 | 5 分鐘 · 隔天 | 不需要 | 是 | — |
| 加拿大亞伯達 | AESO Current Supply Demand 報表（HTML） | 50 個 | 快照 · 約 1 分鐘 | 不需要 | 否 | 資產代碼（例 `BSR1`＝Blackspring Ridge），名稱見 AESO Asset List；沒有座標。本次只有 http 成功（https 經本環境代理失敗，要在 Actions 再確認） |
| 加拿大安大略 | IESO `GenOutputCapability`（XML） | 45 個 | 每小時 · 約 15 分鐘 | 不需要 | 否 | 以名稱識別；沒有座標 |
| 英國 | Elexon Insights：`PN`（預定出力）＋`BOALF`（調度指令）＋`FUELINST`（全國實測） | 287 個 BMU（約 31 GW） | 預定出力 1 分鐘；實際計量 `B1610` 文件寫 D+5，本次實測最新只到 9/12 | 不需要 | 是 | BMU（例 `T_HOWAO-1`＝Hornsea 1A）；OSUKED Power-Station-Dictionary（MIT）可對到 WRI GPPD／REPD／Wikidata，涵蓋 228／287 個（缺 Dogger Bank、Neart na Gaoithe、Moray West） |
| 荷蘭 | NED API | 8 座離岸風場 | 10 分鐘 · 延遲待測 | 免費金鑰 | 是 | point ID 28–31、33–36（Luchterduinen、Prinses Amalia、Egmond aan Zee、Gemini、Borssele I&II、Borssele III&IV、Hollandse Kust Zuid、Hollandse Kust Noord） |
| 歐洲 | ENTSO-E Transparency Platform 16.1.A | 100 MW 以上機組 | 逐機組最晚 D+5 | 免費 token（註冊後以 email 申請） | 否（瀏覽器來源回 403） | EIC 代碼；JRC-PPDB-OPEN 可對到座標（內容未查驗） |
| 愛爾蘭全島 | SEMO 每日計量報表（XML） | 350 個機組（未找到哪些是風電的清單） | 30 分鐘 · 隔天 | 不需要 | 是 | `GU_` 代碼 |
| 巴西 | ONS 開放資料（CSV） | 每小時約 168 列風電（多為風場群組） | 每小時 · 1–2 天 | 不需要 | 否 | 群組代碼 `CJU_…`、ANEEL `ceg` |

英國的預定出力不等於實際出力：9/26 10:30（UTC）全部風電機組的預定出力加總 8.75 GW，全國實測風電只有 6.0 GW；
套用調度指令（BOALF）後為 6.9 GW。所以英國的逐場數字只能當估計值。

日本的 OCCTO「逐機組發電公開」只收 100 MW 以上、業者自願公開的機組，而且隔天才公開；本次檢查北海道的逐機組檔，裡面沒有風電機組。

## 國家／區域層級的即時總量

| 地區 | 來源 | 範圍 | 解析度 · 延遲 | 金鑰 | 瀏覽器可直接讀 |
|---|---|---|---|---|---|
| 英國 | Elexon `FUELINST` | 全國 | 5 分鐘 · 約 5 分鐘 | 不需要 | 是 |
| 德國 | SMARD（陸域 4067、離岸 1225） | 全國＋4 個輸電區 | 15 分鐘 · 30–45 分鐘 | 不需要 | 是 |
| 法國 | RTE éCO2mix（ODRÉ） | 全國、12 個大區 | 15 分鐘 · 約 30 分鐘（大區約 1 小時） | 不需要 | 是 |
| 比利時 | Elia `ods086` | 離岸、法蘭德斯、瓦隆 | 15 分鐘 · 約 30 分鐘 | 不需要 | 是 |
| 波蘭 | PSE `api.raporty.pse.pl` | 全國 | 15 分鐘 | 不需要 | 是 |
| 巴西 | ONS 即時（未公開文件的端點） | 全國、子系統 | 1 分鐘 · 最多約 15 分鐘 | 不需要 | 是 |
| 丹麥 | Energinet `PowerSystemRightNow` | 全國、DK1／DK2 | 1 分鐘 · 約 1 分鐘 | 不需要 | 否（帶網站來源時回傳空資料） |
| 愛爾蘭 | EirGrid Smart Grid Dashboard（未公開文件的端點） | 全島、愛爾蘭共和國、北愛爾蘭 | 15 分鐘 · 約 2–6 分鐘 | 不需要 | 否 |
| 美國德州 | ERCOT `fuel-mix.json` | 全系統 | 5 分鐘 · 約 2 分鐘 | 不需要 | 否 |
| 美國加州 | CAISO `fuelsource.csv` | CAISO 區 | 5 分鐘 · 約 5 分鐘 | 不需要 | 否 |
| 日本 | 各電力網公司的需給實績（例：東北、北海道） | 供電區域（含風電與風電抑制量） | 30 分鐘 · 約 20 分鐘 | 不需要 | 否；東京電力回 CDN 403 |
| 韓國 | KPX 網頁表格 | 全國 | 5 分鐘 · 約 2 分鐘 | 不需要 | 否（HTML） |
| 美國各調度區 | EIA-930 | 各電力調度區 | 每小時 · 最新一筆約 31 小時前 | 免費金鑰 | 是 → 不算即時 |
| 中國、印度 | — | 中國只有月統計；印度 `grid-india.in` 無法連線 | — | — | — |

## 彙整平台

- **Electricity Maps**：需要 token；免費方案限個人非商業、1 個區域、每小時 50 次，不適合公開網站。
- **Ember**：需要金鑰，只有月與年資料。適合做「風電占發電量比例」等指標，不是即時資料。
- **Open Electricity**（澳洲）：資料授權為 CC BY-NC（限非商業）。

## 授權（已查到的）

- Elexon BMRS 授權：可商用，需標示「Contains BMRS data © Elexon Limited copyright and database right [年]」，可行時附授權連結
- AEMO：任何用途，需標示來源
- Energinet、SMARD：CC BY 4.0（Energinet 標示「Source: Energinet (www.energidataservice.dk)」，SMARD 標示「Bundesnetzagentur | SMARD.de」；有修改要註明，本站寫明「每小時平均由本站計算」）
- ODRÉ：Licence Ouverte 2.0（標示來源與資料時間）
- ERCOT：網站公開部分的原始資料可用於彙編、圖表與分析（[使用條款](https://www.ercot.com/help/terms)：「raw data provided in public portions of this website may be used, reproduced, and redistributed in compilations, charts, and analyses」）
- CAISO：可使用，須保留版權等聲明並標示 California ISO（[使用條款](https://www.caiso.com/privacy-terms-of-use)）
- Elia：資料集標示「Elia Open Data Licence」，[授權頁](https://opendata.elia.be/pages/licence/)寫明「The data provided for are governed by Creative Commons Attribution 4.0 International Public License」（即 CC BY 4.0，適用比利時法、爭議由布魯塞爾法院管轄；頁面由 JavaScript 產生，原文在網頁原始碼裡）。標示 Elia、授權連結並註明本站的加總與平均
- PSE：[公共資訊再利用條件](https://www.pse.pl/bip/ponowne-wykorzystanie-informacji-publicznej)（2016 年依當時的《公共部門資訊再利用法》訂定）適用於 www.pse.pl 上公布的資訊：可免費用於商業或非商業目的；須註明「Informacja pozyskana ze strony www.pse.pl」與取用日期、移除 PSE 標誌、加工過的要告知並註明「przetworzona w całości/w części」、不得誤導。此刻值的端點就在 www.pse.pl；報表 API 在 `raporty.pse.pl`，pse.pl 的「資料」頁說新的報表都移到那裡，但條件原文沒有點名這個子網域
- ONS：開放資料入口網站的資料集都標示「Licença Creative Commons Atribuição」（CKAN `license_id` 為 `cc-by`；AWS 開放資料目錄寫 CC BY 4.0），[資料集頁](https://dados.ons.org.br/dataset/balanco-energia-subsistema)寫明可散布、修改，「desde que seja dado o crédito apropriado ao criador(ONS) e que informe quais alterações foram feitas」；入口網站自稱提供「dados históricos」。ONS 網站與「Energia Agora」即時資料沒有使用條款或授權，只有「© - Copyright - ONS」，也沒有禁止轉載或自動取得的文字；本站比照韓國，依同一數列在開放資料入口網站以 CC BY 公布而使用，標示 ONS 與本站的計算
- IESO：可使用與轉載，須在轉載處附上 IESO 規定的版權聲明（[使用條款](https://www.ieso.ca/Terms-of-Use)）
- AESO：限非商業、個人或教育用途，不得修改，並保留版權聲明（[法律聲明](https://www.aeso.ca/legal/)）
- EirGrid（含 SONI）：Smart Grid Dashboard 的 [Open Data Licence](https://www.smartgriddashboard.com/all/open-data-license/) 適用於儀表板資料：「You are free to: copy, publish, distribute and transmit the Information; adapt the Information; exploit the Information commercially and non-commercially」；須標示「Supported by EirGrid Group Data」、不得使用標誌或暗示背書；EirGrid 保留在使用過量時限制存取的權利，也可不經通知修改授權。eirgrid.ie 與 SONI 網站本身的版權聲明另有「未經書面同意不得重製」，授權頁明列適用於「Smart Grid Dashboards」與「SONI Libraries」
- KPX：KPX 網頁本身沒有授權條款，只有頁尾「ALL RIGHTS RESERVED」；同一數列（5 分鐘發電源別，含風電 `fuelPwr9`）在[公共資料入口網站](https://www.data.go.kr/data/15142651/openapi.do)標示「이용허락범위 제한 없음」，KPX 的開放資料頁說明「개방」是賦予「영리적·비영리적으로 이용할 권한」，韓國《公共資料法》第 3 條第 3、4 項禁止公共機關限制公開資料的使用（含商業使用）。robots.txt 為 `Allow: /`。官方 API 需要公共資料入口網站的金鑰，沒有申請
- 日本各電力區域（2026-10-10 查）：北海道、東北、北陸、關西、中國、四國的網站條款都寫明，除私人使用與著作權法允許的情形外，未經事前同意不得複製、傳送、散布（關西連設連結都要先取得許可）；中部禁止私人使用以外的二次利用；九州另禁止以程式自動取得（「スクレイピング等」），除非事前許可；東京電力與沖繩的條款頁在本環境被 CDN 擋住，沒讀到。OCCTO 的網站條款可自由利用（註明出處與加工），但 OCCTO 沒有公布各區的風電實績。所以日本暫不收錄；若要加，先向北海道、東北、九州等申請同意
- NED、SEMO：尚未查到

## 建議的接入順序

1. **澳洲 NEM（AEMO Dispatch_SCADA）**：最像台電，約 100 座風場、每 5 分鐘實測、不需金鑰、只需標示來源。
   做法：Actions 讀資料夾清單、解壓最新一檔、只留風電機組，寫出 `au_realtime.json`。
2. **加拿大亞伯達＋安大略**：逐場、不需金鑰，合計約 95 座。Actions 解析 AESO 的 HTML 與 IESO 的 XML。
3. **英國**：以預定出力（PN）套用調度指令（BOALF），再依全國實測（FUELINST）等比例校正，標示「估計」。不需金鑰。
4. **荷蘭離岸（NED）或 ENTSO-E 逐機組**：需要免費金鑰（存成 GitHub Secrets），只能由伺服器端抓；實際延遲要再測。

**快速成果**：國家層級的「此刻風電出力」面板。英國、德國、法國、比利時、波蘭、巴西可以由瀏覽器直接讀；
丹麥、愛爾蘭、德州、加州、日本、韓國要經 Actions。→ 2026-10 已接入英、德、法、丹、德州、加州（一律經 Actions，與其他即時資料同一次 commit）；
2026-10-10 再加比利時、波蘭、愛爾蘭（含北愛爾蘭）、韓國、巴西；日本各電力區域要先取得同意（見「授權」）。

## 接入時要注意

- **沒有座標**：所有逐場來源都只給機組代碼或名稱，需要一份人工維護的對照表（機組代碼 → `wind_farms.json` 的風場），合計數百列。
- **repo 體積**：每個國家各自 commit 會讓 git 歷史更快變大。建議併進現有 `scrape.yml` 的同一次 commit，
  或改用 Cloudflare Worker（見 [DEPLOY.md](../DEPLOY.md) 方案 B）。
- **金鑰**：需要註冊或金鑰的來源（ENTSO-E、NED、EIA）先經網站負責人同意；金鑰存成 GitHub Secrets，不寫進程式。
- **標示**：英國的逐場值要標示「估計」；延遲一天以上的來源（巴西、愛爾蘭 SEMO、西澳）不能標成「即時」。
- **單檔版**：連網時比照台灣即時，向正式網站抓這些 JSON。

## 尚未驗證

- ENTSO-E 逐機組資料的風電涵蓋範圍與實際延遲（沒有 token）
- NED 的資料內容與延遲（沒有金鑰）
- RTE 逐機組資料（需要 OAuth）
- SMARD 的 100 MW 以上機組下載（只看過文件）
- 西班牙 REE（WAF 封鎖）、東京電力（CDN 封鎖）、印度（無法連線）、智利逐廠 SCADA 頁面（Cloudflare 403 與 TLS 錯誤）
- SEMO 機組代碼、巴西 `ceg` 代碼對應名稱與座標的清單
- NED、SEMO 的授權條款；東京電力、沖繩電力的網站條款（本環境無法讀取）
- PSE 的再利用條件是否明文涵蓋 `raporty.pse.pl`（條件只寫 www.pse.pl）
- EIA 約 31 小時、B1610 約 14 天的延遲各只觀察到一次

## 參考連結

- [Elexon BMRS 資料授權](https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/)
- [ENTSO-E：取得 security token](https://transparencyplatform.zendesk.com/hc/en-us/articles/12845911031188-How-to-get-security-token)
- [ENTSO-E 16.1.A 逐機組實際出力](https://transparencyplatform.zendesk.com/hc/en-us/articles/16648326220564-Actual-Generation-per-Generation-Unit-16-1-A)
- [Energinet 使用條款](https://www.energidataservice.dk/terms-and-conditions)
- [ONS 開放資料：各子系統能量平衡（含風電）](https://dados.ons.org.br/dataset/balanco-energia-subsistema)
- [ONS Energia Agora](https://www.ons.org.br/paginas/energia-agora/carga-e-geracao)
- [ODRÉ éCO2mix 全國即時資料](https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/)
- [ERCOT 使用條款](https://www.ercot.com/help/terms)
- [CAISO 使用條款](https://www.caiso.com/privacy-terms-of-use)
- [Elia 開放資料授權](https://opendata.elia.be/pages/licence/)
- [PSE 公共資訊再利用條件](https://www.pse.pl/bip/ponowne-wykorzystanie-informacji-publicznej)
- [SMARD 資料使用](https://www.smard.de/en/datennutzung)
- [AEMO 著作權](https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions)
- [Open Electricity](https://docs.openelectricity.org.au/introduction)
- [Electricity Maps 免費方案](https://ww2.electricitymaps.com/free-tier-api)
- [NED API 手冊](https://ned.nl/nl/handleiding-api)
- [KPX 開放 API](https://www.data.go.kr/data/15056640/openapi.do)
- [KPX 發電源別 5 分鐘 API（含風電）](https://www.data.go.kr/data/15142651/openapi.do)
- [EirGrid Smart Grid Dashboard 開放資料授權](https://www.smartgriddashboard.com/all/open-data-license/)
- [OCCTO 逐機組發電公開](https://hatsuden-kokai.occto.or.jp/hks-web-public/home)
- [REE REData](https://www.ree.es/en/datos/apidata)
