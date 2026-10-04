"""時間軸的「最新可得」年份 · The "latest available" point on the globe's timeline

各國官方今年已公布的累計風電裝置容量（MW），每列附出處、資料月份與中英文說明；由 tools/build_country_stats.py 讀取，
寫進 data/global/country_stats.json 的 latest。地球儀在 2025 年之後多一個 2026 年，這些國家用這裡的數字，其他國家沿用 2025 年底並標示。

本站 2025 年的數字與這些來源的口徑不一定相同（例：美國本站用 IRENA、這裡用 EIA-860M 銘牌容量）。為了不因為換來源而出現假的跳動，
預設用「本站 2025 年＋該來源從 2025 年底到最新月份的增量」（mode 'delta'，地圖上標示為估計）；本站 2025 年已知有誤的，
直接用來源的數字（mode 'abs'）並在說明寫出原因。base_* 是同一個來源的 2025 年底數字，要與最新數字取自同一份（或同一系列）資料。
數字核對：PDF／網頁的原文用 tools/check_quotes.py 核對；只在官方試算表裡的數字（EIA-860M、DESNZ ET 6.1）直接讀儲存格核對。
查證紀錄見 tools/research/national_2026_*.json（寫進本表後刪除）。

Official cumulative wind capacity (MW) published so far this year, each row with its source, data month and bilingual note.
Read by tools/build_country_stats.py into data/global/country_stats.json ("latest"). The globe gets a 2026 point after 2025: these
countries use these figures, the rest carry their end-2025 value and are marked as such. The site's 2025 figures do not always share
a source's scope, so by default the 2026 value is "site 2025 + the source's growth since end-2025" (mode 'delta', shown as an
estimate) to avoid a fake jump from switching sources; where the site's 2025 value is known to be wrong, the source's figure is used
directly (mode 'abs') with the reason in the note. base_* is the same source's end-2025 figure from the same publication or series.
"""
import json
from pathlib import Path

YEAR = 2026
ROOT = Path(__file__).resolve().parent.parent

ROWS = [
    dict(iso='TWN', asof='2026-08', on=940.2, off=4984.9, mode_on='abs', mode_off='abs',
         src=('經濟部能源署 能源統計月報表 4-02「再生能源發電裝置容量」', 'MOEA Energy Administration, monthly energy statistics table 4-02 (renewable generating capacity)'),
         url='https://ea01.moeaea.gov.tw/a0303/02/api/v1/zone/monthly/4/2',
         note=('2026 年 8 月：陸域 940.2 MW、離岸 4,984.9 MW。同一張表的 2025 年 12 月為陸域 930.3、離岸 3,586.9 MW，與本站 2025 年採用的《能源統計手冊》表 3-6 相同，所以直接用。月報表每月更新，近幾個月可能修正。',
               'August 2026: onshore 940.2 MW, offshore 4,984.9 MW. The same table gives 930.3 and 3,586.9 MW for December 2025, identical to the Energy Statistics Handbook table 3-6 the site uses for 2025, so the values are used as they are. The table is updated monthly and recent months may be revised.')),
    dict(iso='CHN', asof='2026-06', add_on=37780, add_off=840, mode_on='delta', mode_off='delta',
         src=('國家能源局 2026 年上半年可再生能源併網運行情況（2026-07-30 新聞發布會）', 'National Energy Administration, H1 2026 renewable grid-connection briefing (30 July 2026)'),
         url='https://www.nea.gov.cn/20260730/3ce671c387574eeeb120fc3825be0399/c.html',
         note=('上半年新增併網：陸上 3,778 萬千瓦、海上 84 萬千瓦（1 萬千瓦＝10 MW）；6 月底陸上約 6.3 億千瓦、海上 4,841 萬千瓦。國家能源局的 2025 年底數字只到 0.1 億千瓦，不能拿來相減，所以用本站 2025 年加上半年新增量。每月的新聞稿只有陸海合計，沒有分開。',
               'Added in H1 2026: onshore 37.78 GW, offshore 0.84 GW; end-June about 630 GW onshore and 48.41 GW offshore. The NEA\'s end-2025 figures are rounded to 10 GW, too coarse to subtract, so the site\'s 2025 values plus the H1 additions are used. The monthly releases give only the combined total.')),
    dict(iso='IND', asof='2026-08', on=58520.32, off=0, mode_on='abs', mode_off='abs',
         src=('印度新能源與再生能源部 MNRE〈Physical Progress〉（2026 年 8 月 31 日）', 'India MNRE, "Physical Progress" (as of 31 August 2026)'),
         url='https://mnre.gov.in/en/physical-progress/',
         note=('2026 年 8 月 31 日風電累計 58,520.32 MW。以 MNRE 自己的資料（2026 年 3 月底 56,094.84 MW 減去 1–3 月新增）推回 2025 年底為 54,510.93 MW，與本站 2025 年相同，所以直接用。印度的會計年度是 4 月到隔年 3 月。',
               'Cumulative wind 58,520.32 MW on 31 August 2026. Working back within MNRE\'s own data (56,094.84 MW at end-March 2026 minus the January–March additions) gives 54,510.93 MW at end-2025, the same as the site\'s 2025 value, so the figure is used as it is. India\'s fiscal year runs April to March.')),
    dict(iso='BRA', asof='2026-08', add_on=184.5, add_off=0, mode_on='delta', mode_off='delta',
         src=('巴西國家電力監理局 ANEEL 2026 年 1–8 月新增發電容量（開放資料 SIGA 逐廠清單）', 'Brazil ANEEL, generating capacity added January–August 2026 (SIGA open data, plant by plant)'),
         url='https://dadosabertos.aneel.gov.br/dataset/siga-sistema-de-informacoes-de-geracao-da-aneel',
         note=('2026 年 1–8 月有 3 座風場進入商轉，合計 184.5 MW（ANEEL 的月度發布由 pv magazine Brasil 等轉載；三座在 SIGA 逐廠清單裡的容量加總相同）。ANEEL 沒有以文字公布累計值，所以用本站 2025 年加上今年新增量。',
               'Three wind farms entered commercial operation in January–August 2026, 184.5 MW in total (ANEEL\'s monthly release as republished by pv magazine Brasil and others; the three plants\' rows in the SIGA plant list add up to the same). ANEEL does not state a running total in text, so the site\'s 2025 value plus this year\'s additions is used.')),
    dict(iso='USA', asof='2026-08', on=165745.2, off=972.0, base_on=159282.7, base_off=172.0, mode_on='delta', mode_off='delta',
         src=('美國能源資訊署 EIA-860M 每月發電機清單（2026 年 8 月版，營運中機組銘牌容量）', 'US EIA-860M monthly generator inventory (August 2026 edition, operating nameplate capacity)'),
         url='https://www.eia.gov/electricity/data/eia860m/',
         note=('2025 年底同一來源為陸域 159,282.7 MW、離岸 172.0 MW（2025 年 12 月版）。離岸增加的 800 MW 是 Vineyard Wind 1（EIA 自 2026 年 4 月起列為運轉中）。數字直接讀試算表「Operating」工作表。',
               'Same source at end-2025: onshore 159,282.7 MW, offshore 172.0 MW (December 2025 edition). The 800 MW offshore increase is Vineyard Wind 1 (listed by EIA as operating from April 2026). Values read from the "Operating" sheet.')),
    dict(iso='DEU', asof='2026-06', on=70018, off=10818, base_on=68090, base_off=9740, mode_on='delta', mode_off='delta',
         src=('Deutsche WindGuard《Status des Windenergieausbaus an Land／auf See》2026 年上半年', 'Deutsche WindGuard, "Status des Windenergieausbaus an Land / auf See", first half of 2026'),
         url='https://www.windguard.de/id-1-halbjahr-2026.html',
         note=('2026 年 6 月 30 日：陸域 70,018 MW（扣除除役 437 MW 後的淨增）、離岸 10,818 MW（只計已併網機組，另有 323 MW 已安裝未併網）；2025 年底同一系列為陸域 68,090 MW（半年報修正值）、離岸 9,740 MW。',
               '30 June 2026: onshore 70,018 MW (net of 437 MW decommissioned), offshore 10,818 MW (grid-feeding turbines only; another 323 MW installed but not connected); same series at end-2025: onshore 68,090 MW (as revised in the half-year report), offshore 9,740 MW.')),
    dict(iso='FRA', asof='2026-06', on=24387, off=2316, base_on=23992, base_off=2008, mode_on='abs', mode_off='abs',
         src=('法國生態轉型部統計處 SDES《Tableau de bord : éolien》2026 年第二季（暫定值）', 'SDES (French Ministry statistics), "Tableau de bord : éolien", Q2 2026 (provisional)'),
         url='https://www.statistiques.developpement-durable.gouv.fr/tableau-de-bord-eolien-deuxieme-trimestre-2026',
         note=('2026 年 6 月 30 日併網容量：陸域 24,387 MW、離岸 2,316 MW；2025 年底同一期為陸域 23,992 MW、離岸 2,008 MW，本站 2025 年也改用這兩個數字（同一數列），所以直接用。',
               'Grid-connected capacity on 30 June 2026: onshore 24,387 MW, offshore 2,316 MW; same issue at end-2025: onshore 23,992 MW, offshore 2,008 MW, which the site now also uses for 2025 (same series), so the figures are used as they are.')),
    dict(iso='GBR', asof='2026-06', on=16833.07, off=16732.68, base_on=16430.69, base_off=16649.68, mode_on='delta', mode_off='delta',
         src=('英國能源安全與淨零部 DESNZ《Energy Trends》表 6.1（2026 年 9 月 29 日發布，第二季暫定值）', 'UK DESNZ Energy Trends table 6.1 (released 29 September 2026, Q2 2026 provisional)'),
         url='https://www.gov.uk/government/statistics/energy-trends-section-6-renewables',
         note=('2026 年第二季末：陸域 16,833.07 MW、離岸 16,732.68 MW（固定式 16,653.05＋浮動式 79.63）；2025 年第四季末為陸域 16,430.69 MW、離岸 16,649.68 MW。數字直接讀試算表「Quarter」工作表。',
               'End of Q2 2026: onshore 16,833.07 MW, offshore 16,732.68 MW (fixed 16,653.05 + floating 79.63); end of Q4 2025: onshore 16,430.69 MW, offshore 16,649.68 MW. Values read from the "Quarter" sheet.')),
]


def build():
    G = json.loads((ROOT / 'data/global/wind_global.json').read_text(encoding='utf-8'))
    assert G['years'][-1] == YEAR - 1, 'wind_global.json 的最後一年應為 ' + str(YEAR - 1)
    by = {c['iso']: c for c in G['countries']}
    out = {}
    for r in ROWS:
        c = by[r['iso']]
        site_on, site_off = c['on'][-1], c['off'][-1]
        # delta：本站去年底＋該來源的增量（add_* 直接給增量；否則用 最新 − 同來源去年底）
        grow = lambda k: r['add_' + k] if 'add_' + k in r else r[k] - r['base_' + k]
        on = site_on + grow('on') if r['mode_on'] == 'delta' else r['on']
        off = site_off + grow('off') if r['mode_off'] == 'delta' else r['off']
        assert on >= 0 and off >= 0, r['iso']
        out[r['iso']] = {'on': round(on, 1), 'off': round(off, 1), 'asof': r['asof'], 'est': 'delta' in (r['mode_on'], r['mode_off']),
                         'src': list(r['src']), 'url': r['url'], 'note': list(r['note'])}
    return {'year': YEAR, 'countries': out}
