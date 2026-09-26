# 待辦 · TODO

[English](./TODO.en.md) ｜ 中文（本頁）

具體可執行的任務清單。背景、評估理由與分階段規劃見 [ROADMAP.md](./ROADMAP.md)。

## 需要定期回頭核對（時效敏感，非程式問題）

- [ ] 台電離岸二期：規劃完工時間目前寫「2027」，屆時（或每季）核對工程進度報導是否仍準確，
      需要時更新 `assets/js/live.js` 的 `FARMS` 陣列（`id:"offshore2"`）
- [ ] 沃四風／沃南風（大彰化 2b&4，920 MW）：規劃 2026 年第三季全數商轉，屆時核對是否如期，
      更新 `id:"wo4"` / `id:"wonan"` 的 `tl` 與 `cod`
- [ ] 海龍（龍B風）：全案商轉時程可能已由 2026 延至 2027，持續追蹤最新報導，更新 `id:"longB"`
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
- [ ] 重複的風場紀錄：美國 Sunrise Wind 同時有 GEM 的「Sunrise wind farm (United States)」與 2026 年整理清單的「Sunrise Wind」（同為 924 MW、興建中），下次清理時在 `tools/farm_cleanup.py` 加一條規則（2026-09 整理港口資料時發現）
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
- [ ] 整理港口資料時發現的重複風場紀錄，下次清理時在 `tools/farm_cleanup.py` 處理：英國 Sofia（精選「Sofia」營運中與 GEM「Sofia wind farm」
      興建中，同為 1,400 MW）；波蘭 Baltica 2（GEM「Baltica II Offshore wind farm」1,500 MW 前期開發與「EW Baltica 2 Offshore wind farm」
      210 MW 興建中，位置幾乎相同，實際為 1.5 GW、興建中）

## 風場詳情

- [x] 風場詳情 v1（2026-09）：國內地位、分期時間軸、附近與同開發商風場、OpenStreetMap／Wikidata／Global Wind Atlas 連結、
      回報資料錯誤、複製連結（細節見 ROADMAP「風場詳情可以加什麼」A 類）
- [ ] 同開發商靠業主名稱正規化比對（`assets/js/globe.js` 的 `OWN_LEGAL`／`OWN_WEAK`／`OWN_PLACE`／`OWN_PREFIX`）：
      GEM 的業主欄位只保留前兩個、截在 60 字，集團子公司寫法不一；有人回報漏配或配錯時，補進 `OWN_PREFIX` 別名表
- [ ] 風場詳情 v2（需要新資料）：估計年發電量、各國官方登錄連結、風機規格卡等，見 ROADMAP「風場詳情可以加什麼」B 類

## 待評估／待使用者決定方向（不要自作主張動工）

- [ ] 時間軸延伸到「2026（最新可得）」：8 國有官方 2026 年數字，其他國家沿用 2025 年並標示；確認做法後動工（見 ROADMAP「使用者 2026-09 提出的新規劃」第 1 項）
- [ ] 離岸水下基礎型式圖層：先做 OSPAR 涵蓋的歐洲、其他歐洲風場、浮動式與台日韓美（約 2–4 天）；中國、越南是否投入約 50–70 小時（同上第 2 項）
- [ ] 台灣風電工作船進出港（臺灣港務公司開放資料，免金鑰）是否要做；即時船位（AIS）已評估為暫不做（同上第 3 項）
- [ ] 是否要幫 `grid_status`（電力供需）做長期存檔 + 前端趨勢圖，比照風力的「即時→7天→90天」三層做法
- [ ] 是否要擴展成多能源別（genary 本身已含水力/太陽能/火力/核能資料，scraper 目前只取風力列）——
      這是網站範疇的重大決定，動工前務必先確認方向
- [ ] 是否要嘗試解決電力供需即時來源的 WAF 403（需要換執行環境，例如自架 runner 或非雲端 CI 的主機，
      不是單純改程式碼能解決）
- [ ] 其他國家的即時風電資料（評估見 [docs/live-data-sources.md](./docs/live-data-sources.md)）：澳洲 NEM、加拿大亞伯達與安大略
      已於 2026-09 接入；英國（估計值）、荷蘭 NED 與 ENTSO-E（需免費金鑰，存成 GitHub Secrets）待決定
- [ ] ROADMAP「下一步規劃」各階段的優先順序

## 維運

- [ ] 若開發頻率降低、擔心 60 天無活動被停用排程，考慮加一支簡單的月排程 keepalive workflow
- [ ] `wind_history_archive.json` 會持續成長（目前約 1.8MB），留意 repo 體積；必要時考慮定期歸檔壓縮

## 暫緩，不需要再研究（已有明確理由，見 ROADMAP.md「已評估過、暫緩的方向」）

- 能源署月/年統計 API（粒度太粗，與現有資料重疊）
- 中央氣象署浮標資料（數量少、多數離風場遠，效益不高）
- 環境部離岸風場生態監測資料（多為非結構化 PDF，暫無機器可讀格式）
