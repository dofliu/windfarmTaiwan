"""離岸風場的尺寸：水深、輪轂高度（或塔高）、葉輪直徑，逐場對照表（2026-10 起）。

每列用國別與風場名稱指定一座（名稱與 wind_farms.json 完全一致，而且必須已在 tools/farm_foundations.py 的對照表裡）：
    D(iso, name, depth=(最小, 最大), hub=輪轂高度, rotor=葉輪直徑, url=出處, hub_kind='hub'|'tower', zh='', en='')
  · depth 以公尺計，單一值寫 (值, 值)，潮間帶可寫 (0, x)；hub 可為單值或 (最小, 最大)；rotor 單值。
  · 查不到的欄位留 None，不用「典型值」推估；三個都查不到的風場不要列。
  · url 必填：維基百科（任何語言）、開發商、風機廠商、政府文件或產業新聞；英文維基百科各國離岸風場清單的「Depth range」欄
    也可以用（url 寫清單頁）。不引用 4C Offshore。引用的原文都以 tools/check_quotes.py 核對過才寫進來。
  · hub_kind='tower' 表示來源寫的是塔高（塔筒高度），不是輪轂高度。
python3 tools/build_foundations.py 會檢查每列並把值併進 data/global/foundations.json（d、h、r、du）與 docs/foundations*.md。
地球儀的風場卡片剖面圖與近景風機依這些值等比例繪製；沒有值的風場維持示意圖。
"""

DIMS_ASOF = '2026-10'

WIKI_UK = 'https://en.wikipedia.org/wiki/List_of_offshore_wind_farms_in_the_United_Kingdom'
WIKI_DE = 'https://en.wikipedia.org/wiki/List_of_offshore_wind_farms_in_Germany'
WIKI_DK = 'https://en.wikipedia.org/wiki/List_of_offshore_wind_farms_in_Denmark'
WIKI_NL = 'https://en.wikipedia.org/wiki/List_of_offshore_wind_farms_in_the_Netherlands'
WIKI_CN = 'https://en.wikipedia.org/wiki/List_of_offshore_wind_farms_in_China'
WIKI_SE = 'https://en.wikipedia.org/wiki/List_of_offshore_wind_farms_in_Sweden'


def D(iso, name, depth=None, hub=None, rotor=None, url=None, hub_kind='hub', zh='', en=''):
    return dict(iso=iso, name=name, depth=list(depth) if depth is not None else None, hub=list(hub) if isinstance(hub, (list, tuple)) else hub,
                rotor=rotor, url=url, hub_kind=hub_kind, zh=zh, en=en)


DIMENSIONS = [
]
