# 待辦 · TODO

[English](./TODO.en.md) ｜ 中文（本頁）

具體可執行的任務清單。背景、評估理由與分階段規劃見 [ROADMAP.md](./ROADMAP.md)。

## 進行中（2026-09-27 交接：專案暫告段落）

開新的工作階段先讀這一段（見 CLAUDE.md 第 8 節）；做完後把這一段改寫成下一件進行中的工作，完成的項目移到下面各主題的清單。

### 現況

- 2026-09-27（v2.11.1）起專案暫告段落：主要功能已完成，使用者決定不再新增功能，進入維護期（完成的內容見 [ROADMAP.md](./ROADMAP.md)「目前狀態」）。
- 自動更新照常運作；**每月檢查一次**排程是否還在跑（步驟見 [DEPLOY.md](./DEPLOY.md)「維護」）。專案暫停後沒有功能開發，
  連續 60 天沒有活動時 GitHub 會停用排程，網站不會報錯、只會一直顯示最後一次的資料。
- 重啟時沒有做到一半的程式修改；下面是依優先順序排好的待接工作。

### 重啟時先做（依優先順序）

1. **補核對第 5 步的出處原文**：v2.11.0／v2.11.1 依使用者的《全球離岸風場資料庫｜亞洲查核版 v2》寫進的中國 5 座水下基礎
   （`tools/farm_foundations.py` 的 F5 列）與 6 條清理規則（`tools/farm_cleanup.py` 最後一段）引用三峽集團、上海市政府、中廣核網頁，
   原文還沒用 `tools/check_quotes.py` 核對（當時的工作環境連不到這些網站）。在能連線的環境逐筆補原文、跑核對，對不上就改或撤回。
2. **GEM 升級到 2026-02 版**（使用者 2026-09-27 要求）：GEM 2026-02 只以 GeoJSON 放在 `publicgemdata.nyc3.cdn.digitaloceanspaces.com`
   （wind/2026-02/wind_map_2026-02-05.geojson，GEM maps repo 的 trackers/wind/config.js），當時的工作環境網路政策擋掉了；GEM 的 GitHub repo
   只有 2025-02 版的 CSV。做法：把該網域加進允許清單或由使用者下載後上傳 → 改 `tools/build_farms.py` 讀 GeoJSON（欄位對照 2025-02 的 CSV）→
   重建風場層（README「全球資料更新」第 3 步）→ 逐條處理對不到的清理規則（`farm_cleanup.py`、`GEM_KEEP`、`PIPE_*` 都是依 2025-02 的名稱寫的）→
   `qa_farms`、`coverage_report`、`qa_ports`、`build_foundations` → 版本號與兩份 CHANGELOG（新資料來源版本：次版號）。
   升級後順便核對：韓國東海 1 號（使用者的工作簿依 GEM 2026 寫興建中、2030 年；本站為前期開發、2028 年）與左沙里（興建中、2031 年；本站為前期開發）。
3. **時效到期的核對**：大彰化 2b&4（沃四風／沃南風）規劃 2026 年第三季全數商轉，已到期，見下面「需要定期回頭核對」。
4. **水下基礎第 5 步其餘部分**：
   - 還沒有各型式座數的混合型：響水、陽江沙扒一至五期；只寫「固定式」的：福清興化灣、青洲六。查到的線索記在
     `tools/research/cn_mixed_2026-09.json`（沙扒一期 39 單樁／10 套管／3＋3 吸力桶只見於轉載文章、未核對；二至五期只有招標暫定數），
     等有一手出處（例：使用者手邊的三峽竣工資料）再補。
   - 其他中國離岸風場（營運中 168 座裡還有 160 座）與越南（28 座，多為潮間帶，使用者的工作簿只寫潮間帶／近岸、未細分）仍為「型式不詳」。
   - 流程同前四步：查證紀錄放 `tools/research/`（每個出處附原文，`python3 tools/check_quotes.py 檔案.json` 只採用 OK 的）→
     `tools/farm_foundations.py` 以 `F5(...)` 加列（文件裡的中國座數由程式計算）→ 查證時發現的資料問題寫進 `tools/farm_cleanup.py` →
     重建與檢查 → 網站文字（`assets/js/globe.js` 的 `fdStep` 與「資料來源」視窗、`assets/js/learn.js`）→ 版本號與兩份 CHANGELOG →
     Playwright 桌機與手機寬度、單檔版連網與離線 → 寫進對照表後刪掉 `tools/research/` 的紀錄。
5. **丹麥兩座的基礎型式待查證**：Nissum Bredning Vind 與 Rønland 本站依 OSPAR（DK23、DK04）列為重力式；使用者的工作簿引用
   Boundary Layer 寫套管式（混凝土過渡段）與打樁混凝土基礎。Boundary Layer 是 ODbL（相同方式分享），只能當線索：
   找開發商或丹麥能源署的一手出處再決定是否改。

## 需要定期回頭核對（時效敏感，非程式問題）

- [ ] 台電離岸二期：規劃完工時間目前寫「2027」，屆時（或每季）核對工程進度報導是否仍準確，
      需要時更新 `assets/js/live.js` 的 `FARMS` 陣列（`id:"offshore2"`）
- [ ] 沃四風／沃南風（大彰化 2b&4，920 MW）：規劃 2026 年第三季全數商轉，屆時核對是否如期，
      更新 `id:"wo4"` / `id:"wonan"` 的 `tl`（中英文）與 `cod`
- [ ] 海龍（龍B風）：全案商轉時程可能已由 2026 延至 2027，持續追蹤最新報導，更新 `id:"longB"`
- [ ] 水下基礎第 4 步留下的待查證（2026-09）：瀨棚何時停機（町公所 2026 年 4 月決定 2027 年度撤除）；海洋風電一期機型是
      SWT-4.0-120 還是 -130；銚子沖 2025 年以後是否仍運轉；濟州月汀試驗場現況（2 MW 自 2016 年 6 月停機）；
      韓國群山可能有一部吸力桶基礎的斗山 3 MW（2017 年，荷蘭 RVO 列為裝在陸上的試驗機）
- [ ] 仍為概略位置的座標（2026-09）：全南海上風電 1 號（自恩島西北約 9 km）、靈光風電潮間帶的 15 部（GEM 座標是公司地址）、
      神栖一、二期與 Eurus 秋田港（改用 OpenStreetMap 的風機位置）、Sunrise Wind（BOEM 租約區中心）
- [ ] 時間軸推進到 2026 年時，逐場改狀態與年份：北九州響灘（2026 年 3 月商轉）、靈光落月（預定 2026 年 12 月）、
      Vineyard Wind 1（2026 年 3 月完工、4 月商轉但未滿載）、Revolution Wind（2026 年內商轉）；
      CVOW 商業案、Sunrise Wind、Empire Wind 預定 2027 年
- [ ] 每季手動觸發一次 `backfill-taipower-wind-history` workflow 的 dry-run，確認 37331 資料集是否已
      更新到更近期的季度（若官方改善時效，回填 7 天窗的邏輯已就緒會自動生效，值得定期檢查）

## 全球資料（每年一次，見 README「全球資料更新」）

- [ ] 每年 IRENA《Renewable Capacity Statistics》（約 3 月）與 GWEC／WFO 年報（約春季）發布後，更新國家逐年容量（`data/global/wind_global.json`），
      並抽查前十大國家的官方統計（中國國家能源局、美國 EIA、德國 BNetzA 等）
- [ ] 能源署《能源統計手冊》新版（表 3-6 再生能源發電裝置容量）發布後，更新 `tools/extract_global_data.py` 的
      `TWN_OFFICIAL`；JWPA 年末累積導入量（每年約 2 月公布）發布後更新 `JPN_JWPA`，並重跑擷取程式
- [ ] 規劃中重點專案（`data/global/sources/pipeline_curated.json`，2026-09 整理）狀態變動快：
      台灣第三階段區塊開發（渢妙、福爾摩沙 4／6 號、海鼎一、德帥、佑德、大彰化東北）每季核對一次
- [ ] GEM 釋出新版 Global Wind Power Tracker 公開檔時重跑 `tools/build_farms.py`，再跑 `tools/qa_farms.py`
      檢查座標；確認 `COORD_FIX` 的修正是否仍需要（上游已修正者可移除）。`tools/farm_cleanup.py` 的清理規則若對不到資料，
      建置會中止並列出是哪幾條：逐條重新查證，上游已修正者刪除、改名者更新名稱
- [x] 查證芬蘭 Pohjoinen wind farm：就是挪威的 Sørfjord（同為 99 MW、2020、Fortum、座標相同），已刪除（2026-09）
- [ ] 台灣分批併網的離岸風場（海龍 2&3、大彰化 2b&4、台電離岸二期）若取得逐期併網容量，填進 `ph` 欄位
- [ ] 每次重建風場資料後跑 `tools/coverage_report.py`，更新 `docs/data-coverage.md`／`.en.md`
- [ ] 澳洲、加拿大即時資料的機組對照（`data/live/units.json`）每季重跑 `tools/build_live_units.py`：新風場併網、機組改名時
      檢查「未對應」清單；目前資料中缺 Elaine、Yawong（澳洲維多利亞）與 Forty Mile Bow Island（亞伯達）三座風場

## 資料品質（來自 [docs/data-coverage.md](./docs/data-coverage.md)，2026-09 產生）

第一階段資料清理已於 2026-09 完成：逐筆查證後刪除 77 筆、修正 52 筆，每筆的理由與出處見
[docs/data-cleanup.md](./docs/data-cleanup.md)，規則在 `tools/farm_cleanup.py`。

- [x] 9 組「疑似重複 A」：已處理（剩日本遠州掛川／掛川一組，待確認是否為同一座）
- [x] 12 個「逐場加總高於國家統計 110%」的國家：剩菲律賓（Pagudpud 2024–25 年才完工，IRENA 可能尚未計入）與伊朗
- [x] 接入即時資料時發現的重複：亞伯達 Whitla、澳洲 Snowtown、塔斯馬尼亞 Bluff Point、維多利亞 Yambuk
- [x] 共用座標點：地圖上以該點為中心示意排開、卡片註明「位置示意」（`flags` 4）
- [ ] 共用座標點仍有 135 個（1,338 座營運中風場，多為中國的省份中心代用座標）：以 GEM 新版或在地資料補上實際座標
- [ ] 清理時查不到或未能證實的項目：伊朗 Tizbaad（99 MW）與 Aqkand（50 MW）是否已運轉（SATBA 資料）；
      中國精選的「CGN Taizhou 1」（300 MW，查無中廣核在台州的離岸案）與「Guoxin Sheyang H1」（300 MW，射陽 H1 屬華能）、
      GEM 的射陽南區 H5（400 MW，可能尚未運轉）；越南 Song An（46.2 MW，未見商轉）；芬蘭 Kemi Ajos 的汰換沿革；
      多明尼加比 IRENA 少約 50 MW 的原因
- [ ] 資料中缺的風場（查證時發現）：泰國 Hanuman 10（80 MW）、越南 Lạc Hòa 2（123.6 MW）與 Chơ Long 其餘 105.5 MW、
      羅馬尼亞 Pantelimon（123 MW）、哥倫比亞 Carreto（9.6 MW，2025）
- [ ] 剩下 11 組「疑似重複 B」（名稱不同、容量相同、位置相近），例：美國 Solano／Shiloh、Big Smile／Dempsey Ridge、
      德國 Dreiberg／Druiberg：逐組確認
- [ ] 587 個預計商轉年已過卻仍列規劃中的專案（101 GW）：以 GEM 新版或新聞更新狀態
- [ ] 46 GW 營運中風場沒有商轉年（多在中國、印度），地圖只能從 2025 年顯示：找得到年份的補上
- [ ] 覆蓋率較低的大國（中國差 144 GW、德國 27 GW、印度 15 GW）：評估以各國官方登錄資料補齊（見 ROADMAP 第 1 階段）
- [x] 重複的風場紀錄：美國 Sunrise Wind 同時有 GEM 的「Sunrise wind farm (United States)」與 2026 年整理清單的「Sunrise Wind」（同為 924 MW、興建中）：已在水下基礎第 4 步合併為一筆，座標改到 BOEM 租約區 OCS-A 0487 的中心（2026-09，v2.10.0）
- [x] 荷蘭的兩組重複（比對水下基礎時發現）：Borssele V 與 GEM 的「Borssele Site V」、Irene Vorrink 與 GEM 的「Dronten」已查證合併（2026-09，v2.8.0）
- [ ] Dogger Bank 規劃中專案：GEM 的「Dogger Bank wind farm · D」（1,320 MW，GEM 列為前期開發）現在顯示為興建中、預計 2027 年並註「first power 2025」，
      這是 2026 整理清單中 Dogger Bank B 的資料（比對時對到 D 期）；下次整理規劃中專案時查證修正
- [ ] 法國 2025 年離岸容量（`wind_global.json` 為 1,500 MW，與 2024 年相同）可能偏低：SDES 2026 年第 2 季風電儀表板推算 2025 年底約 2.0 GW，待查證
- [ ] 離岸逐場加總高於國家數列，待查證：中國營運中離岸風場加總 58.9 GW，國家數列 2025 年為 48.4 GW；越南 28 座「離岸」（多為潮間帶）加總 2.0 GW，國家數列為 1.0 GW。可能是分批併網卻以全場容量計入，或有重複

## 港口資料（data/global/ports.json，2026-09 人工整理）

- [x] 全球風場搜尋與篩選、港口圖層（55 個港口、15 國，每港附出處；`tools/qa_ports.py` 檢查）
- [ ] 待補的港口（2026-09 查證時找不到可引用的出處，沒有猜）：
      中國（一個都還沒有，例：如東洋口、南通啟東、陽江、汕頭、福清江陰、蓬萊、威海、大連）；韓國木浦新港、蔚山、LS 電線東海海纜廠；菲律賓；
      歐洲 Vlissingen、Den Helder、IJmuiden、Emden、Nordenham、Aalborg、Lindø／Odense、Brest、Port-la-Nouvelle、Fos-sur-Mer、Świnoujście、
      Gdańsk、Szczecin、Viana do Castelo、Taranto、愛爾蘭各港、Dundee
- [ ] 美國 5 個港口已有出處、但碼頭座標還沒核對，先不列：紐澤西風電港（2024 年完工、從未使用）、長灘 Pier Wind（規劃中）、
      Vineyard Haven（Vineyard Wind 1 運維基地）、Quonset／Davisville（South Fork Wind 運維）、Nexans Goose Creek 海纜廠
- [ ] 港口狀態變動快（美國多個計畫 2025–26 年喊停、補助取消）：每半年核對一次；角色已結束的港口改標 `former`（地圖為灰色），改完跑 `tools/qa_ports.py`
- [ ] 整理港口資料時發現的重複風場紀錄，下次清理時在 `tools/farm_cleanup.py` 處理：波蘭 Baltica 2（GEM「Baltica II Offshore wind farm」
      1,500 MW 前期開發與「EW Baltica 2 Offshore wind farm」210 MW 興建中，位置幾乎相同，實際為 1.5 GW、興建中）。
      英國 Sofia 的兩筆已在水下基礎第 2 步合併（2026-09）

## 風場詳情

- [x] 風場詳情 v1（2026-09）：國內地位、分期時間軸、附近與同開發商風場、OpenStreetMap／Wikidata／Global Wind Atlas 連結、
      回報資料錯誤、複製連結（細節見 ROADMAP「風場詳情可以加什麼」A 類）
- [ ] 同開發商靠業主名稱正規化比對（`assets/js/globe.js` 的 `OWN_LEGAL`／`OWN_WEAK`／`OWN_PLACE`／`OWN_PREFIX`）：
      GEM 的業主欄位只保留前兩個、截在 60 字，集團子公司寫法不一；有人回報漏配或配錯時，補進 `OWN_PREFIX` 別名表
- [x] 台灣即時頁的風場時間軸補上英文（2026-09，v2.10.1）：`assets/js/live.js` 的 `tl` 每條是［日期, 中文, 狀態, English］，新增或修改時中英文一起寫
- [x] 台灣即時頁風場的說明與規格欄（開發商、場址、機型、水深、離岸距離、年發電量、供電戶數）補上英文（2026-09，v2.10.1）：`assets/js/live.js` 的 `ZH_EN` 以中文原字串對照，新增或修改中文值時一起補英文
- [x] 台灣即時頁的風場名稱在英文介面改用英文（2026-09，v2.10.2）：`assets/js/live.js` 的 `NAME_EN`［完整名稱, 短名稱］，新增風場時一起補
- [ ] 風場詳情 v2（需要新資料）：估計年發電量、各國官方登錄連結、風機規格卡等，見 ROADMAP「風場詳情可以加什麼」B 類

## 離岸水下基礎型式（2026-09-27 使用者決定逐步收集，見 ROADMAP「使用者 2026-09 提出的新規劃」第 2 項）

- [x] 第 1 步：歐洲 OSPAR 涵蓋範圍（北海、東北大西洋）：99 座，逐場對照表 `tools/farm_foundations.py`、檢查與產生程式
      `tools/build_foundations.py`、地球儀「離岸：水下基礎」圖層（2026-09，v2.7.0；逐場清單見 [docs/foundations.md](./docs/foundations.md)）
- [x] 第 2 步：歐洲其他風場（波羅的海、地中海、艾瑟爾湖），以及 OSPAR 2024 之後才完工的風場：41 座，每座附出處、引用原文逐筆核對；
      第 1 步留下的 Hohe See 與 Belwind 的 Haliade 示範機也補上出處；另以 26 條規則更正風場紀錄（2026-09，v2.8.0）
- [ ] 丹麥 Frederikshavn 試驗場：丹麥能源署記載港口擴建後海上只剩 1 部 2.3 MW，但沒寫是哪一部（各機組基礎不同）；
      查到是哪一部後補進對照表，並更正容量（目前仍是 2003 年的 3 部、7.6 MW）
- [x] 第 3 步：浮動式風場：19 座補上細分型式，營運中 15 座；另以 20 條規則更正（BiMEP 測試場容量已刪除）（2026-09，v2.9.0）
- [ ] 中國還沒收錄的浮動式機組（座標要另外查證，不臆測）：中船海裝「扶搖號」6.2 MW（2022，湛江羅斗沙，
      [國家能源局](http://www.nea.gov.cn/2022-06/24/c_1310631921.htm)；微電網運轉，是否併入公用電網待查證）、
      龍源「國能共享號」4 MW 三立柱半潛式（2024 年 6 月併網，福建莆田南日島，[中國日報](https://fj.chinadaily.com.cn/a/202406/28/WS667e79dba3107cd55d269125.html)、
      [國資委](http://www.sasac.gov.cn/n2588025/n2588124/c33362365/content.html)）；2026 年才運轉的三峽「領航號」16 MW 半潛式（陽江，
      [新華網](https://www.news.cn/tech/20260503/76ea04db45f242819a7f2b39dc191b94/c.html)）與中國海油「海油安瀾號」16 MW 張力腳平台
      （陸豐油田，[新華網](https://www.news.cn/tech/20260806/18f047cf51d840c489e283b9d1669742/c.html)）待時間軸延伸後加入
- [ ] 可能重複計算，待查證：明陽 OceanX（16.6 MW）位於青洲四風場（500 MW，卡片寫「含 OceanX」），三峽引領號（5.5 MW）位於沙扒三期（400 MW）；
      查不到兩者的容量是否已含在大風場裡
- [ ] 韓國蔚山 750 kW 浮動式試驗機：2019 年 11 月仍因許可未發而沒有安裝，查不到之後在海上發電的紀錄；確認沒有運轉過就刪除
- [ ] 英國 Pentland 浮動式風場在 GEM 有兩筆（「Pentland Floating Offshore wind farm」與「Pentland wind farm」，同為 100 MW），是否同一案待查證
- [x] 第 4 步：台灣、日本、韓國、美國：36 座（2026-09，v2.10.0）
- [ ] 第 5 步：中國、越南（2026-09-27 使用者決定繼續逐步收集）：已補中國 5 座（v2.11.0、v2.11.1），其餘見最上面的「重啟時先做」第 4 項

## 待評估／待使用者決定方向（不要自作主張動工）

- [ ] 時間軸延伸到「2026（最新可得）」：8 國有官方 2026 年數字，其他國家沿用 2025 年並標示；確認做法後動工（見 ROADMAP「使用者 2026-09 提出的新規劃」第 1 項）
- [ ] 是否要幫 `grid_status`（電力供需）做長期存檔 + 前端趨勢圖，比照風力的「即時→7天→90天」三層做法
- [ ] 是否要擴展成多能源別（genary 本身已含水力/太陽能/火力/核能資料，scraper 目前只取風力列）——
      這是網站範疇的重大決定，動工前務必先確認方向
- [ ] 是否要嘗試解決電力供需即時來源的 WAF 403（需要換執行環境，例如自架 runner 或非雲端 CI 的主機，
      不是單純改程式碼能解決）
- [ ] 其他國家的即時風電資料（評估見 [docs/live-data-sources.md](./docs/live-data-sources.md)）：澳洲 NEM、加拿大亞伯達與安大略
      已於 2026-09 接入；英國（估計值）、荷蘭 NED 與 ENTSO-E（需免費金鑰，存成 GitHub Secrets）待決定
- [ ] ROADMAP「下一步規劃」各階段的優先順序

## 維運

- [ ] 每月檢查排程是否還在跑、必要時手動跑一次（步驟見 DEPLOY.md「維護」）：專案暫停後沒有功能開發，60 天無活動會被 GitHub 停用排程。
      也可以改加一支簡單的月排程 keepalive workflow（會改動排程設定，先問使用者）
- [ ] `wind_history_archive.json` 會持續成長（2026-09 約 3.2 MB），留意 repo 體積；必要時考慮定期歸檔壓縮

## 暫緩，不需要再研究（已有明確理由，見 ROADMAP.md「已評估過、暫緩的方向」）

- 能源署月/年統計 API（粒度太粗，與現有資料重疊）
- 中央氣象署浮標資料（數量少、多數離風場遠，效益不高）
- 環境部離岸風場生態監測資料（多為非結構化 PDF，暫無機器可讀格式）
- 工作船動態：AIS 即時船位與臺灣港務公司進出港資料（2026-09-27 使用者決定不做）
