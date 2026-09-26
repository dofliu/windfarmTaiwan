# 其他國家的即時風電資料：可行性評估

[English](./live-data-sources.en.md) ｜ 中文（本頁）

> 2026-09-26（UTC 10:40–11:02）以 `curl` 逐一實測各國公開端點，並帶 `Origin: https://dofliu.github.io`
> 檢查瀏覽器能否直接讀取（CORS）。沒有註冊任何帳號、沒有使用任何金鑰（美國 EIA 官方公開的測試用 `DEMO_KEY` 除外）。
> 沒能實測成功的項目另列在最後一節。

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
| 巴西 | ONS 即時（未公開文件的端點） | 全國、子系統 | 1 分鐘 · 約 2 分鐘 | 不需要 | 是 |
| 丹麥 | Energinet `PowerSystemRightNow` | 全國、DK1／DK2 | 1 分鐘 · 約 1 分鐘 | 不需要 | 否（帶網站來源時回傳空資料） |
| 愛爾蘭 | EirGrid Smart Grid Dashboard（未公開文件的端點） | 全島、愛爾蘭共和國 | 15 分鐘 · 約 15 分鐘 | 不需要 | 否 |
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

- Elexon BMRS 授權：可商用，需標示來源
- AEMO：任何用途，需標示來源
- Energinet、SMARD：CC BY 4.0
- ODRÉ：Licence Ouverte 2.0
- Elia：自有開放資料授權
- ONS：創用 CC 姓名標示
- IESO、AESO、EirGrid、NED、SEMO：尚未查到

## 建議的接入順序

1. **澳洲 NEM（AEMO Dispatch_SCADA）**：最像台電，約 100 座風場、每 5 分鐘實測、不需金鑰、只需標示來源。
   做法：Actions 讀資料夾清單、解壓最新一檔、只留風電機組，寫出 `au_realtime.json`。
2. **加拿大亞伯達＋安大略**：逐場、不需金鑰，合計約 95 座。Actions 解析 AESO 的 HTML 與 IESO 的 XML。
3. **英國**：以預定出力（PN）套用調度指令（BOALF），再依全國實測（FUELINST）等比例校正，標示「估計」。不需金鑰。
4. **荷蘭離岸（NED）或 ENTSO-E 逐機組**：需要免費金鑰（存成 GitHub Secrets），只能由伺服器端抓；實際延遲要再測。

**快速成果**：國家層級的「此刻風電出力」面板。英國、德國、法國、比利時、波蘭、巴西可以由瀏覽器直接讀；
丹麥、愛爾蘭、德州、加州、日本、韓國要經 Actions。

## 接入時要注意

- **沒有座標**：所有逐場來源都只給機組代碼或名稱，需要一份人工維護的對照表（機組代碼 → `wind_farms.json` 的風場），合計數百列。
- **repo 體積**：每 15 分鐘多一個國家的 commit 會讓 git 歷史更快變大。建議併進現有 `scrape.yml` 的同一次 commit，
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
- IESO、AESO、EirGrid、NED、SEMO 的授權條款
- EIA 約 31 小時、B1610 約 14 天的延遲各只觀察到一次

## 參考連結

- [Elexon BMRS 資料授權](https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/)
- [ENTSO-E：取得 security token](https://transparencyplatform.zendesk.com/hc/en-us/articles/12845911031188-How-to-get-security-token)
- [ENTSO-E 16.1.A 逐機組實際出力](https://transparencyplatform.zendesk.com/hc/en-us/articles/16648326220564-Actual-Generation-per-Generation-Unit-16-1-A)
- [Energinet 使用條款](https://www.energidataservice.dk/terms-and-conditions)
- [SMARD 資料使用](https://www.smard.de/en/datennutzung)
- [AEMO 著作權](https://www.aemo.com.au/privacy-and-legal-notices/copyright-permissions)
- [Open Electricity](https://docs.openelectricity.org.au/introduction)
- [Electricity Maps 免費方案](https://ww2.electricitymaps.com/free-tier-api)
- [NED API 手冊](https://ned.nl/nl/handleiding-api)
- [KPX 開放 API](https://www.data.go.kr/data/15056640/openapi.do)
- [OCCTO 逐機組發電公開](https://hatsuden-kokai.occto.or.jp/hks-web-public/home)
- [REE REData](https://www.ree.es/en/datos/apidata)
