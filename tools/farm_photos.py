"""風場卡片的照片清單 · Photos for the globe's cards（tools/build_photos.py 讀這個檔）

每一張都人工看過才列進來：
- 照片要看得到這座風場（或這部里程碑風機）的風機，不是地圖、標誌、典禮人群、只拍船或零件、或風機小到看不清的風景；
- 出自該風場自己的 Commons 分類（第 4 欄；建置會檢查照片真的在這個分類裡），授權是 CC0／公有領域／CC BY／CC BY-SA（建置會檢查）；
- 最後一欄寫看到什麼，方便之後複查。找候選用 `python3 tools/find_photos.py 風場名稱 --save 目錄`。
事件只放拍到該事件本身的照片；沒有的話卡片會改用相關風場的照片，並註明不是事件當時。

Every photo here was looked at by hand: it shows this farm's (or milestone machine's) turbines rather than a map, logo,
ceremony crowd, vessel, component or distant scenery; it comes from the farm's own Commons category (column 4, checked by the
build) under CC0 / public domain / CC BY / CC BY-SA (checked by the build); the last column says what the photo shows.
Event photos must show the event itself; otherwise the card uses a related farm's photo and says it is not of the event.
"""

# (國別, 風場名稱（與 wind_farms.json 完全一致）, Commons 檔名, Commons 分類, 照片內容)
FARMS = [
]

# (里程碑名稱（與 wind_global.json 完全一致）, Commons 檔名, Commons 分類, 照片內容)
MILESTONES = [
]

# (事件代碼, Commons 檔名, Commons 分類, 照片內容)
EVENTS = [
]
