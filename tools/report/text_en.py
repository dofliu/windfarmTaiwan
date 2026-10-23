"""English text of the observation report · 觀察報告英文版文字.

Same keys as text_zh.py. Every figure comes from analysis.compute() / compute_more(); outside organisations' figures come
only from the checked quotes in outlook_quotes.json.
"""


def f0(v):
    return f'{v:,.0f}'


def gw(mw, d=1):
    return f'{mw/1000:,.{d}f}'


def lst(items):
    items = list(items)
    return items[0] if len(items) == 1 else ', '.join(items[:-1]) + ' and ' + items[-1]


def build(D):
    N = lambda iso: {'United States of America': 'United States'}.get(D['names'][iso]['en'], D['names'][iso]['en'])
    Y = D['years']
    i25 = Y.index(2025)
    w25 = D['total'][i25]
    th = D['thresholds']
    lead = ', '.join(f'{N(i)} ({a}–{b if b < 2025 else "today"})' for i, a, b in D['leaders'])
    cs = D['cont_share']
    by = {r['iso']: r for r in D['top10']}
    off = D['off_by_country']
    o = lambda iso, yr: off[iso][Y.index(yr)]
    fd = D['found']
    fpct = lambda reg, g: 100 * fd[reg]['mw'].get(g, 0) / fd[reg]['known']
    cf = D['cf']
    cfp = {r['period']: r for r in D['cf_us_period']}
    su, sd = D['size_us'], D['size_de']
    dims = D['offdims']
    mk = D['mk_off']
    tw = D['tw_latest']
    twg = D['tw_gen']['Taipower Offshore Phase 1 (Changhua)']
    pw = D['pipe_world']
    lt = D['latest']['countries']
    sh = D['share_series']
    s25 = lambda iso: sh[iso][-1]
    chn_add21 = o('CHN', 2021) - o('CHN', 2020)
    pt = D['pipe_top']
    pre = lst(f'{N(i)} ({gw(v["preconstruction"], 0)} GW)' for i, v in sorted(pt, key=lambda x: -x[1]['preconstruction'])[:5] if i != 'CHN')
    peak = D['add_prev_peak']
    up = 100 * (D['add'][i25] / peak['mw'] - 1)

    t = {}
    t['lang'] = 'en'
    t['title'] = 'Global Wind Power Observation Report'
    t['sub'] = '1980–2025: forty-five years of growth, shifts and what comes next'
    t['kicker'] = '風電風情 · TAIWAN WIND WATCH · OBSERVATION REPORT'
    t['lab'] = '國立勤益科技大學 智慧自動化工程系 劉瑞弘研究室'
    t['lab2'] = 'National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu'
    t['date'] = 'October 2026'
    t['cover_big'] = f'{gw(w25, 0)} GW'
    t['cover_big_sub'] = 'Global installed wind capacity at the end of 2025'
    t['footer'] = 'Global Wind Power Observation Report · 2026'
    t['site'] = 'Website: 風電風情 · Taiwan Wind Watch'
    t['see'] = 'On the site'
    t['fig'] = 'Figure'
    t['tab'] = 'Table'
    t['src'] = 'Source: '
    t['chap'] = 'Chapter {n}'

    # contents and about
    t['toc_title'] = 'Contents'
    t['about_title'] = 'About this report'
    t['about'] = [
        '風電風情 · Taiwan Wind Watch is a website that compiles public data on wind power worldwide. Its 3D globe shows every country\'s wind '
        'capacity for every year since 1980 and zooms all the way down to single farms and turbines; for Taiwan it also shows live output from '
        'Taipower\'s open data. This report turns the data the site has collected and checked record by record over more than four months into '
        'an observation that answers three questions with numbers: how wind power grew over the decades, how its centre of gravity moved, and where it is heading.',
        'Every figure names its sources, and most come with the matching view on the site and a link, so readers can open the same year, country or farm '
        'there for more detail. The numbers are the site\'s version as of October 2026. National statistics are compiled in different ways, so the site\'s '
        'figures can differ from those of international organisations by a few per cent; the differences and their reasons are given in the chapters and the appendix.',
        'Units: 1 GW = 1,000 MW = 1 million kW. Capacity factor = actual generation ÷ (installed capacity × hours in the year).',
    ]
    t['howto'] = [
        ('Coverage', f'Onshore and offshore capacity of 79 countries, 1980–2025; about {D["farms_total"]:,} farm records; foundation types of {D["foundations_n"]} offshore farms; measured output of {D["gen_meta"]["farms"]} farms'),
        ('Time', 'National statistics to the end of 2025; the latest official 2026 figures for 8 countries; projects in development from the Global Energy Monitor February 2026 release'),
        ('Website', '風電風情 · Taiwan Wind Watch (the globe in "Global", Taiwan live, Learn)'),
    ]

    # 00 summary
    t['sum_kick'] = 'SUMMARY'
    t['sum_title'] = 'Forty-five years on one map'
    t['sum_lede'] = (f'At the end of 2025 the world\'s wind fleet reached {gw(w25, 0)} GW, {D["mult_2000"]:.0f} times its size in 2000 — '
                     f'an average growth of {D["cagr_2000"]:.1f}% a year for twenty-five years. Its centre of gravity moved from North America to Europe '
                     'and then to Asia; turbines kept getting bigger and moving out to sea; and newer farms generate more electricity.')
    t['keys'] = [
        (gw(w25, 0), 'GW', 'Global installed capacity, end of 2025'),
        ('+' + gw(D['add'][i25]), 'GW', 'Added in 2025, the most in any year'),
        (f'{D["chn_share"]:.1f}', '%', f'China\'s share of the world, first since {D["leaders"][-1][1]}'),
        (gw(D['off25']), 'GW', f'Offshore wind, {D["off_pct25"]:.1f}% of the world'),
    ]
    t['pull'] = f'"The wind capacity added in 2025 alone ({gw(D["add"][i25])} GW) is more than the whole world had at the end of 2009 ({gw(D["w"][2009])} GW)."'
    t['findings'] = [
        ('Growth', f'World capacity passed 10 GW in 1999, 100 GW in {th[100]}, 500 GW in {th[500]} and 1,000 GW in {th[1000]}; {gw(D["add"][i25])} GW was added in 2025, about {up:.0f}% more than the previous peak ({peak["year"]}).'),
        ('Centre', f'North America held {cs[1990][2]:.0f}% in 1990, Europe {cs[2000][1]:.0f}% in 2000 and Asia {cs[2025][0]:.0f}% in 2025; Asia overtook Europe in {D["asia_passes_europe"]}.'),
        ('Turbines', f'New German turbines matched by the site grew from {sd[2000]["mw"]:.1f} MW on average in 2000 to {sd[2025]["mw"]:.1f} MW in 2025, and their rotors from {sd[2000]["rd"]:.0f} m to {sd[2025]["rd"]:.0f} m.'),
        ('Offshore', f'Offshore wind is {gw(D["off25"])} GW, {D["chn_off_share"]:.0f}% of it in China; the median rotor of offshore farms grew from {dims[0]["rd"][0]:.0f} m (before 2005) to {dims[-1]["rd"][0]:.0f} m (2023 on), and water depth from {dims[0]["dep"][0]:.0f} m to {dims[-1]["dep"][0]:.0f} m.'),
        ('Output', f'US farms commissioned from 2015 have a median measured capacity factor of about {cfp[(2015, 2019)]["med"]:.0f}%, about {cfp[(2015, 2019)]["med"]-cfp[(2005, 2009)]["med"]:.0f} points higher than those from 2005–2009 ({cfp[(2005, 2009)]["med"]:.0f}%).'),
        ('Industry', f'Of offshore capacity with a known maker (about {mk["cov"]:.0f}%), {mk["top"][0][0]} has {mk["top"][0][2]:.0f}%; the three largest owners worldwide are {D["ow_all"]["top"][0][0]}, {D["ow_all"]["top"][1][0]} and {D["ow_all"]["top"][2][0]}.'),
        ('Taiwan', f'Taiwan had {f0(D["tw_off"][-1])} MW offshore at the end of 2025, fifth in the world, and {f0(tw["off"])} MW by August 2026.'),
        ('Future', f'About {gw(pw["construction"], 0)} GW of wind is under construction worldwide and about {gw(pw["preconstruction"], 0)} GW in pre-construction; GWEC expects 969 GW to be added in 2026–2030, 194 GW a year on average.'),
    ]

    # 01
    t['c1_kick'] = 'CHAPTER ONE'
    t['c1_title'] = 'Forty-five years: from 11 MW to 1,288 GW'
    t['c1_lede'] = 'From a few hundred small turbines in California\'s mountain passes to a global industry adding more than 100 GW a year.'
    t['c1_p'] = [
        f'In 1980 all the power-generating wind turbines in the world added up to about {D["w"][1980]:.0f} MW, most of them in the United States. '
        'In the early 1980s rows of small turbines appeared in California passes such as Altamont, the first wind boom; in the 1990s Germany, Denmark and Spain '
        'took over, and turbines grew from tens of kilowatts to megawatt class.',
        f'Totals stayed small for twenty years: world capacity was about {gw(D["w"][1990])} GW in 1990, passed 10 GW only in 1999 and was {gw(D["w"][2000])} GW at the end of 2000. '
        f'The real acceleration came after 2005: world capacity passed 100 GW in {th[100]}, then 200 GW in {th[200]}, 400 GW in {th[400]} and 800 GW in {th[800]} — doubling '
        f'roughly every three to six years — and 1,000 GW in {th[1000]}.',
        f'In 2025 the world added {gw(D["add"][i25])} GW, the most ever and about {up:.0f}% more than the previous peak ({peak["year"]}, {gw(peak["mw"])} GW). '
        f'Offshore wind is only {D["off_pct25"]:.1f}% of the total, but it has been the fastest-growing part over the past decade (chapter 4).',
        'International figures differ slightly: the Global Wind Energy Council (GWEC) Global Wind Report 2026 gives 165 GW added in 2025 and 1,299 GW at the end of the year. '
        'The site\'s national series is mostly IRENA\'s grid-connected capacity (the Energy Administration for Taiwan, JWPA for Japan), while GWEC counts installations from '
        'an industry survey; the two differ by about 1% (cumulative) to 5% (yearly additions).',
    ]
    t['c1_fig1'] = 'Global cumulative wind capacity, 1980–2025'
    t['c1_fig1_src'] = 'The site\'s national series (IRENA via Our World in Data; Taiwan: Energy Administration; Japan: JWPA). Most countries\' 1980–1999 values are estimates (appendix).'
    t['c1_fig2'] = 'Wind capacity added worldwide each year, 1990–2025'
    t['c1_fig2_src'] = 'Year-on-year change of the year-end totals; negative where retirements exceeded new builds.'
    t['onshore'], t['offshore'], t['total'] = 'Onshore', 'Offshore', 'Total'
    t['gw'], t['gwy'], t['mw'] = 'GW', 'GW / year', 'MW'
    t['cross'] = 'Passed {v} in {y}'
    t['add_note'] = (f'2025: +{gw(D["add"][i25])} GW', 'the most ever')
    t['ms_title'] = 'From prototypes to an industry: milestones'
    t['ms_lede'] = 'From the 35 wind power milestones the site has compiled, these are the ones that changed turbine design or the scale of the industry. Each can be opened on the site\'s globe, with its sources.'
    t['ms_src'] = 'The site\'s milestones (each with sources); on the site: Global → Layers → Milestones.'

    # 02
    t['c2_kick'] = 'CHAPTER TWO'
    t['c2_title'] = 'The shift east: North America, Europe, Asia'
    t['c2_lede'] = 'In forty-five years, the centre of gravity of wind power moved twice.'
    t['c2_p'] = [
        f'The shares of the continents show two great shifts. In 1990, {cs[1990][2]:.0f}% of the world\'s wind capacity was in North America, mainly California\'s farms; '
        f'Germany, Denmark and Spain expanded quickly in the 1990s, and by 2000 Europe held {cs[2000][1]:.0f}%.',
        f'After 2010 China took the lead role: it overtook the United States in {D["leaders"][-1][1]} and had {D["chn_share"]:.1f}% of the world in 2025; '
        f'Asia passed Europe in {D["asia_passes_europe"]} and held {cs[2025][0]:.0f}% in 2025. The countries with the most capacity were, in turn: {lead} (the 1980s figures are mostly estimates).',
        'More capacity does not mean a bigger role in the power system. The "wind share" column of ⟨tab:top10⟩ comes from Ember\'s yearly electricity data: '
        f'among the top ten, wind supplies close to 30% in the United Kingdom ({by["GBR"]["gshare"]:.1f}%) and Germany ({by["DEU"]["gshare"]:.1f}%), '
        f'but about 10% in China ({by["CHN"]["gshare"]:.1f}%) and the United States ({by["USA"]["gshare"]:.1f}%). ⟨fig:share⟩ shows the long-term change in a few countries: '
        f'Denmark {s25("DNK"):.1f}% in 2025, Ireland {s25("IRL"):.1f}%, Taiwan {s25("TWN"):.1f}%.',
        'The capacity factor in the table is a national average (wind generation ÷ the mean of the start- and end-of-year capacity × hours in the year), including '
        f'curtailment and partial years, so it is only good for rough comparison; Brazil ({by["BRA"]["cf"]*100:.0f}%) and the United States ({by["USA"]["cf"]*100:.0f}%) '
        'are clearly higher than the mostly onshore European countries. Measured per-farm figures are in chapter 5.',
    ]
    t['cont'] = ['Asia', 'Europe', 'North America', 'Other']
    t['c2_fig3'] = 'Share of world cumulative capacity by continent'
    t['c2_fig3_src'] = 'As ⟨fig:cap⟩. "Other" = South America, Oceania and Africa.'
    t['c2_tab1'] = 'The top ten by cumulative capacity, 2025'
    t['c2_tab1_cols'] = ['#', 'Country', 'Onshore MW', 'Offshore MW', 'Total MW', 'World share', 'Wind share', 'Capacity factor']
    t['c2_tab1_src'] = 'Capacity as ⟨fig:cap⟩ (end of 2025); wind share of generation and capacity factor from Ember Yearly Electricity Data (CC BY 4.0), 2025.'
    t['c2_fig4'] = 'Wind share of electricity generation, 2000–2025'
    t['c2_fig4_src'] = 'Ember Yearly Electricity Data (CC BY 4.0). On the site: Global → Analyse → Indicator colouring.'

    # 03
    t['c3_kick'] = 'CHAPTER THREE'
    t['c3_title'] = 'Bigger turbines'
    t['c3_lede'] = 'The capacity of a single turbine grew from 12 kW to 26 MW.'
    t['c3_shot'] = 'Zoomed in on a farm: Sweetwater in Texas, each dot a turbine at its real position (USWTDB).'
    big = D['milestones'][-1]
    t['c3_p'] = [
        'The generating windmill Charles Brush built in Cleveland in 1888 had 12 kW; in 1957 Denmark\'s 200 kW Gedser turbine set the "Danish concept" of three blades, '
        'upwind rotor and stall control that became the model for the modern wind turbine. The United States and Germany tried a few megawatt-class prototypes in '
        'the 1970s and 1980s, but what the industry actually built in series were small machines of tens to hundreds of kilowatts.',
        f'⟨fig:ms⟩ shows the most representative turbines of each period among the site\'s milestones. Megawatt-class models matured in the 1990s, dedicated offshore '
        f'turbines appeared in the 2000s, and the 2020s reached the 10–20 MW class: the {big["name"].split(",")[0]} was installed for testing in {big["year"]}, '
        f'with {big["mw"]:.0f} MW and a {big["rotor"]} m rotor.',
        'The same trend shows in the ordinary turbines built every year. The site matches every turbine in the US USWTDB and the German MaStR to its farm; in farms '
        f'with a clear commissioning year, new German turbines grew from {sd[2000]["mw"]:.1f} MW on average in 2000 to {sd[2025]["mw"]:.1f} MW in 2025 and their rotors from '
        f'{sd[2000]["rd"]:.0f} m to {sd[2025]["rd"]:.0f} m; in the United States from {su[2005]["mw"]:.1f} MW and {su[2005]["rd"]:.0f} m in 2005 to {su[2025]["mw"]:.1f} MW and {su[2025]["rd"]:.0f} m in 2025.',
        f'The area swept by the rotor grew faster than the rating: in Germany the rating rose about {sd[2025]["mw"]/sd[2000]["mw"]:.1f} times from 2000 to 2025 and the swept area about '
        f'{(sd[2025]["rd"]/sd[2000]["rd"])**2:.1f} times; in the United States about {su[2025]["mw"]/su[2005]["mw"]:.1f} and {(su[2025]["rd"]/su[2005]["rd"])**2:.1f} times from 2005 to 2025. '
        'More rotor area per kilowatt means more output in light winds, one reason why newer farms have higher capacity factors (chapter 5).',
    ]
    t['c3_fig5'] = 'Ratings of milestone turbines (log scale)'
    t['c3_fig5_src'] = 'The site\'s milestones. Colours: onshore, offshore, floating.'
    t['kinds'] = {'onshore': 'Onshore', 'offshore': 'Offshore', 'floating': 'Floating'}
    t['c3_fig6'] = 'Average rating of new turbines'
    t['c3_fig7'] = 'Average rotor diameter of new turbines'
    t['us'], t['de'] = 'United States', 'Germany'
    t['c3_fig67_src'] = (f'United States: USWTDB {D["size_meta"]["us_version"]} (public domain); Germany: © Bundesnetzagentur | Marktstammdatenregister (dl-de/by-2-0). '
                         'Only turbines the site has matched to a farm commissioned in a single year, at least 40 a year; not all new turbines in the country.')
    t['mwu'], t['m'] = 'MW / turbine', 'm'

    # 04
    t['c4_kick'] = 'CHAPTER FOUR'
    t['c4_title'] = 'Out to sea'
    t['c4_lede'] = 'From eleven 450 kW turbines off Denmark to 92 GW of offshore wind worldwide.'
    t['c4_p'] = [
        'In 1991 Vindeby, off Lolland in Denmark, became the world\'s first offshore wind farm with eleven 450 kW turbines. For the next twenty years offshore wind stayed mostly around the North Sea: '
        f'the United Kingdom already had {gw(o("GBR", 2010))} GW in 2010 and {gw(o("GBR", 2025))} GW in 2025; Germany {gw(o("DEU", 2025))} GW in 2025.',
        f'China started with the Donghai Bridge farm in 2010, reached {gw(o("CHN", 2019))} GW in 2019 and {gw(o("CHN", 2020))} GW in 2020, '
        f'then added {gw(chn_add21)} GW in a single year to reach {gw(o("CHN", 2021))} GW in 2021, passing the United Kingdom; in 2025 it had {gw(o("CHN", 2025))} GW, {D["chn_off_share"]:.0f}% of the world\'s offshore wind. '
        f'Taiwan had {f0(D["tw_off"][-1])} MW in 2025, fifth in the world.',
        f'Offshore farms are getting bigger and deeper. The site has compiled water depth, hub height and rotor diameter for {D["offdims_n"]} operating offshore farms (as-built values only, each with sources): '
        f'farms commissioned before 2005 have a median rotor of {dims[0]["rd"][0]:.0f} m and a median maximum depth of {dims[0]["dep"][0]:.0f} m; '
        f'those commissioned from 2023 have {dims[-1]["rd"][0]:.0f} m and {dims[-1]["dep"][0]:.0f} m.',
        f'Foundations differ by region: Europe relies on monopiles ({fpct("EUR", "mp"):.0f}% of the capacity with a known type); in China monopiles have {fpct("CHN", "mp"):.0f}%, alongside locally developed '
        f'types such as high-rise pile caps and mixed foundations; elsewhere — Taiwan, Japan, Korea, the United States and others — jackets and other frames dominate ({fpct("OTH", "frame"):.0f}%).',
        f'Deeper waters need floating turbines. There are {len(D["floating"])} operating floating farms worldwide with {D["floating_mw"]:.0f} MW in total (including those commissioned in 2026), '
        'most of them demonstration or pilot projects; the largest is Hywind Tampen in Norway (88 MW).',
    ]
    t['c4_fig8'] = 'Cumulative offshore wind capacity by country, 2000–2025'
    t['c4_fig8_src'] = 'The site\'s national series (offshore: WFO, GWEC, WindEurope annual statistics and others; sources item by item in the site\'s "Sources").'
    t['other'] = 'Other'
    t['c4_tab2'] = 'Dimensions of operating offshore farms (by commissioning year, medians)'
    t['c4_tab2_cols'] = ['Commissioned', 'Farms', 'Rotor diameter', 'Hub height', 'Max. water depth']
    t['c4_tab2_src'] = 'The site\'s offshore dimension table (tools/farm_dimensions.py, as-built values only, each with sources); in brackets, the number of farms with that value.'
    t['fdg'] = ['Monopile', 'Frame (jacket, tripod, tripile)', 'Other fixed', 'Floating']
    t['regions'] = {'EUR': 'Europe', 'CHN': 'China', 'OTH': 'Elsewhere'}
    t['c4_fig9'] = 'Foundations of operating offshore farms (by capacity)'
    t['c4_fig9_src'] = (f'The site\'s foundation table (OSPAR and per-farm sources, {D["found_asof"]}). Capacity with a known type: '
                        + ', '.join(f'{t["regions"][k]} {100*fd[k]["known"]/fd[k]["total"]:.0f}%' for k in ('EUR', 'CHN', 'OTH')) + '. "Other fixed" includes gravity bases, high-rise pile caps and mixed foundations.')
    t['c4_tab3'] = 'Operating floating wind farms'
    t['c4_tab3_cols'] = ['Year', 'Farm', 'Country', 'MW']
    t['c4_tab3_src'] = 'The site\'s farm layer (GEM 2026-02 and hand-compiled records). On the site: Global → Search → type "Floating".'

    # 05
    t['c5_kick'] = 'CHAPTER FIVE'
    t['c5_title'] = 'Measured output: what farms really generate'
    t['c5_lede'] = 'Two farms of the same 100 MW can differ twofold in a year\'s output.'
    t['c5_shot'] = 'The site\'s Output dialog: US farms ranked by measured capacity factor in 2025 (EIA-923).'
    t['c5_p'] = [
        f'Capacity is "the most a farm can produce"; the capacity factor is "what it actually produced". The site holds official per-farm generation for {D["gen_meta"]["farms"]} farms: '
        f'{D["gen_meta"]["by_iso"]["USA"]} in the United States (EIA-923), {D["gen_meta"]["by_iso"]["AUS"]} in Australia (AEMO 5-minute measurements), '
        f'{D["gen_meta"]["by_iso"]["DNK"]} in Denmark (Danish Energy Agency) and Taipower\'s own {D["gen_meta"]["by_iso"]["TWN"]}. Only full years are used, and the figures include curtailment.',
        f'⟨fig:cfstrip⟩ shows each country\'s farms in their latest year. The medians are {cf["USA"]["med"]:.1f}% in the United States, {cf["AUS"]["med"]:.1f}% in Australia, {cf["DNK"]["med"]:.1f}% in Denmark and {cf["TWN"]["med"]:.1f}% in Taiwan; '
        f'the spread within a country is large — from {cf["USA"]["vals"][0]:.0f}% to {cf["USA"]["vals"][-1]:.0f}% in the United States. Taiwan\'s {cf["TWN"]["n"]} are mainly Taipower\'s early onshore farms; '
        f'Taipower Offshore Phase 1 had {twg["y"]["2025"][1]:.1f}% in 2025.',
        f'Newer farms generate more. Grouping US farms by commissioning year (⟨fig:cfper⟩), those from 2005–2009 have a median of {cfp[(2005, 2009)]["med"]:.1f}%, '
        f'those from 2015–2019 {cfp[(2015, 2019)]["med"]:.1f}% and those from 2020–2025 {cfp[(2020, 2025)]["med"]:.1f}%. '
        'The data and the year\'s winds are the same; part of the difference comes from the turbines (larger rotors, taller hubs; chapter 3) and part from siting.',
        'These are measured values, not estimates. Private farms in Taiwan have no official per-farm output; the site has "sample" estimates from Taipower\'s live data, but they are samples and are not compared here.',
    ]
    t['c5_fig10'] = 'Measured capacity factors of farms by country (latest year)'
    t['c5_fig10_src'] = ('United States: EIA-923 / EIA-860M (2025); Australia: AEMO MMS Data Model; Denmark: Energistyrelsen, Stamdataregister for vindkraftanlæg '
                         f'(retrieved {D["gen_meta"]["dk_retrieved"]}, data to {D["gen_meta"]["dk_through"]}; company-owned turbines only); Taiwan: Taipower open data 17140/17141. One dot per farm; lines mark the medians.')
    t['cty'] = {'USA': 'United States', 'AUS': 'Australia', 'DNK': 'Denmark', 'TWN': 'Taiwan'}
    t['c5_fig11'] = 'Capacity factor of US farms by commissioning year (medians)'
    t['c5_fig11_src'] = 'EIA-923 and EIA-860M, matched to the site\'s farms through USWTDB. Farms per group: '
    t['farms_n'] = '{n}'

    # 06
    t['c6_kick'] = 'CHAPTER SIX'
    t['c6_title'] = 'Who makes the turbines, who owns the farms'
    t['c6_lede'] = 'What the site\'s data can say, and what it cannot yet.'
    mus, mde = D['mk_us'], D['mk_de']
    t['c6_p'] = [
        f'First the limits: the site knows the maker for only {D["mk_world"]["cov"]:.0f}% of the world\'s capacity. The United States ({D["mk_cov"]["USA"]:.0f}%) and Germany ({D["mk_cov"]["DEU"]:.0f}%) '
        f'have official turbine-by-turbine registers, but China has only {D["mk_cov"]["CHN"]:.0f}%, so the shares below are shares of the known part, not world market shares; '
        'yearly global market shares come from paid reports, which this report does not cite.',
        f'Where the data are complete, the leaders differ a lot. Of the known US capacity, {mus["top"][0][0]} has {mus["top"][0][2]:.0f}% and {mus["top"][1][0]} {mus["top"][1][2]:.0f}%; '
        f'Germany is led by {mde["top"][0][0]} ({mde["top"][0][2]:.0f}%), followed by {mde["top"][1][0]} ({mde["top"][1][2]:.0f}%) and {mde["top"][2][0]} ({mde["top"][2][2]:.0f}%). '
        f'In offshore wind {mk["cov"]:.0f}% is known: {mk["top"][0][0]} {mk["top"][0][2]:.0f}%, {mk["top"][1][0]} {mk["top"][1][2]:.0f}%, {mk["top"][2][0]} {mk["top"][2][2]:.0f}%.',
        f'For owners, Global Energy Monitor lists the holders of the world\'s operating wind capacity ({100*D["ow_all"]["k"]/D["ow_all"]["t"]:.0f}% known). The largest are Chinese generating groups and '
        'European and American utilities: ' + ', '.join(f'{a} ({gw(b)} GW)' for a, b in D['ow_all']['top'][:5])
        + f'. The largest offshore owner is {D["ow_off"]["top"][0][0]} ({gw(D["ow_off"]["top"][0][1])} GW). Only subsidiaries whose names carry the group\'s name are merged, so large groups may in fact hold more.',
    ]
    t['c6_fig12'] = 'Shares of capacity with a known maker'
    t['c6_fig12_panels'] = [('United States (onshore + offshore)', mus), ('Germany (onshore + offshore)', mde), ('Offshore worldwide', mk)]
    t['c6_cov'] = '{c:.0f}% known'
    t['c6_fig12_src'] = ('Operating capacity. United States: USWTDB; Germany: MaStR; elsewhere: the turbine field of the site\'s farm records. Brand folding: NEG Micon, MHI Vestas → Vestas; Siemens, Gamesa, Bonus, Adwen → Siemens Gamesa; '
                         'Enron Wind, Zond, Tacke, Alstom → GE Vernova. Not yearly market shares.')
    t['c6_fig13'] = 'Wind farm owners worldwide (operating capacity, split by stake)'
    t['c6_fig13_src'] = 'Global Energy Monitor, Global Wind Power Tracker, February 2026 (CC BY 4.0).'

    # 07 (Taiwan, chapter 9 in the layout)
    t['c7_kick'] = 'CHAPTER SEVEN'
    t['c7_title'] = 'Taiwan in the world'
    t['c7_lede'] = 'A late, small start onshore; offshore, into the world\'s top five within ten years.'
    t['c7_p'] = [
        f'Taiwan\'s first commercial turbines started at Mailiao in 2000 ({D["tw_on"][0]:.1f} MW). Onshore wind grew quickly to {f0(D["tw_on"][D["tw_years"].index(2010)])} MW between 2005 and 2010, '
        f'then slowed; in 2025 onshore capacity was {f0(D["tw_on"][-1])} MW.',
        f'Offshore wind started with Formosa 1\'s two demonstration turbines in 2017 ({D["tw_off"][D["tw_years"].index(2017)]:.0f} MW); Formosa 1 Phase 2 was completed in 2019 and large farms have been connected since 2021: '
        f'{f0(D["tw_off"][-1])} MW at the end of 2025, fifth in the world; the Energy Administration\'s monthly table shows {f0(tw["off"])} MW in August 2026. '
        f'With onshore and offshore combined, Taiwan ranked {D["tw_rank_total"]}th in the world in 2025.',
        f'Wind\'s share of Taiwan\'s generation rose from {D["tw_share"][20]:.2f}% in 2020 to {D["tw_share"][25]:.2f}% in 2025 (Ember). '
        f'Taipower Offshore Phase 1 had a measured capacity factor of {twg["y"]["2025"][1]:.1f}% in 2025; the median of Taipower\'s own {cf["TWN"]["n"]} farms is {cf["TWN"]["med"]:.1f}% (Taipower open data).',
        'The plan the Ministry of Economic Affairs published in July 2026 sets cumulative offshore targets of 18.3–19.9 GW by 2035 and 24.7–27.9 GW by 2039, '
        f'with a zonal allocation round every four years releasing about 8 GW each. Against {gw(tw["off"])} GW in August 2026, the 2035 target is about {18300/tw["off"]:.1f}–{19900/tw["off"]:.1f} times today\'s capacity.',
    ]
    t['c7_fig14'] = 'Taiwan\'s cumulative wind capacity, 2000–2025'
    t['c7_fig14_src'] = 'MOEA Energy Administration, Energy Statistics Handbook 2025, table 3-6 (2005–2025). August 2026: the Energy Administration\'s monthly table 4-02.'
    t['c7_2026'] = 'August 2026'
    t['c7_tab4'] = 'Taiwan\'s offshore wind farms (operating and under construction)'
    t['c7_tab4_cols'] = ['Year', 'Farm', 'MW', 'Turbines', 'Foundation']
    t['c7_tab4_src'] = 'The site\'s farm records (audited farm by farm for Taiwan) and foundation table. Year = full completion; for farms under construction, the planned year.'
    t['building'] = 'building'
    t['c7_live'] = 'Taiwan live: output of every turbine in Taiwan, updated every 10 minutes (Taipower open data 8931).'

    # 08 (outlook, chapter 10 in the layout)
    t['c8_kick'] = 'CHAPTER EIGHT'
    t['c8_title'] = 'Next: projects in development and outlooks'
    t['c8_lede'] = 'Under construction, approved, and still on paper.'
    t['c8_shot'] = '2026 (latest available): operating and planned farms in Europe (site, with the "Pipeline" layer on).'
    t['c8_p'] = [
        f'Eight countries have published official figures for mid-2026 or the third quarter (⟨tab:latest⟩). China added about {gw(lt["CHN"]["on"]+lt["CHN"]["off"]-by["CHN"]["total"], 0)} GW in the first half; '
        f'India had {gw(lt["IND"]["on"])} GW by the end of September and Taiwan {gw(tw["on"]+tw["off"])} GW by the end of August.',
        f'Global Energy Monitor\'s February 2026 release tracks a global pipeline of {gw(pw["construction"], 0)} GW under construction, {gw(pw["preconstruction"], 0)} GW in pre-construction (seeking permits, land or financing) '
        f'and {gw(pw["announced"], 0)} GW announced. China has the most under construction ({gw(pt[0][1]["construction"], 0)} GW); '
        'pre-construction is largest in ' + pre + '. Not every project in the pipeline will be built, and the earlier the stage, the less certain it is.',
        'Outlooks: GWEC expects 969 GW to be added worldwide in 2026–2030 (194 GW a year on average), 840 GW onshore and 129 GW offshore. '
        'The International Energy Agency (IEA) in Renewables 2025 expects 732 GW onshore and 140 GW offshore to be added in 2025–2030, having cut its offshore forecast by 27% from the previous year.',
        'The COP28 decision of 2023 calls for tripling global renewable capacity by 2030 (the pledge says at least 11,000 GW). The IEA expects 2.6 times the 2022 level by 2030, still short. '
        'Wind has no separate target; GWEC\'s 1,299 GW at the end of 2025 plus the 969 GW it expects in 2026–2030 gives about 2,270 GW of wind in 2030 (before retirements).',
    ]
    t['c8_fig15'] = 'The global wind pipeline (GEM, February 2026)'
    t['pipe_st'] = ['Operating', 'Construction', 'Pre-construction', 'Announced']
    t['c8_fig15_src'] = 'Global Energy Monitor, Global Wind Power Tracker (CC BY 4.0), projects of 10 MW or more.'
    t['c8_fig16'] = 'Capacity under construction and in pre-construction, top 12 countries'
    t['c8_fig16_src'] = 'As ⟨fig:pipe⟩.'
    t['c8_tab5'] = 'The latest official figures for 2026'
    t['c8_tab5_cols'] = ['Country', 'As of', 'Onshore MW', 'Offshore MW', 'Source']
    t['c8_tab5_src'] = '"est." = the source differs in scope from the site\'s 2025 figure, so the site\'s 2025 value plus the source\'s growth this year is used. Notes per country in tools/latest_wind.py and the site\'s "Sources".'
    t['est'] = 'est.'
    t['c8_tab6'] = 'Outlooks of other organisations'
    t['c8_tab6_cols'] = ['Source', 'What it says']
    t['outlook'] = [
        ('GWEC, Global Wind Report 2026 (April 2026)', '165 GW added worldwide in 2025 (155 GW onshore, 9 GW offshore), 1,299 GW at year end; 969 GW expected in 2026–2030, 194 GW a year on average; 840 GW onshore and 129 GW offshore.'),
        ('IEA, Renewables 2025 (October 2025)', '732 GW onshore and 140 GW offshore added in 2025–2030; the offshore forecast cut by 27% from the previous year. Renewable capacity reaches about 2.6 times the 2022 level by 2030, short of tripling (about 11,500 GW).'),
        ('COP28 UAE Consensus (December 2023, decision 1/CMA.5, para. 28(a))', 'Triple global renewable capacity and double the yearly rate of energy-efficiency improvement by 2030; the pledge says at least 11,000 GW.'),
        ('Taiwan Ministry of Economic Affairs (23 July 2026)', 'Cumulative offshore targets of 18.3–19.9 GW by 2035 and 24.7–27.9 GW by 2039; an allocation round every four years, about 8 GW each.'),
    ]
    t['c8_tab6_src'] = 'Each item\'s quoted passage and URL are in the appendix, and tools/check_quotes.py confirmed that each passage is on its source page (tools/report/outlook_quotes.json). The GWEC report PDF is the copy archived by PNNL Tethys.'
    t['obs_title'] = 'Observations'

    # appendix
    t['ap_title'] = 'Appendix: data, methods and limits'
    t['ap_kick'] = 'APPENDIX'
    t['ap_sec'] = [
        ('National capacity', [
            '2000–2025: IRENA Renewable Capacity Statistics via Our World in Data; Taiwan: MOEA Energy Administration, Energy Statistics Handbook table 3-6; Japan: JWPA year-end cumulative capacity.',
            '1980–1999: BTM Consult, IEA Wind annual reports, the Danish Energy Agency, the US EIA and others. Most countries\' values are estimates (±50%), good for trends only.',
            'Offshore 1991–2025: WFO, GWEC and EWEA/WindEurope annual statistics. Latest available 2026: official or industry statistics for 8 countries (⟨tab:latest⟩).',
        ]),
        ('Farms and turbines', [
            f'About {D["farms_total"]:,} farm records, {D["farms_op"]:,} of them operating with {gw(D["farms_op_mw"], 0)} GW (including those commissioned in 2026): Global Energy Monitor Global Wind Power Tracker, {D["gem_release"]} release (CC BY 4.0); WRI Global Power Plant Database v1.3 (CC BY 4.0); Germany\'s MaStR; hand-compiled curated and pipeline projects.',
            f'{D["cleanup"]["rules"]} record-level corrections ({D["cleanup"]["removed"]} duplicates or never-built records removed, {D["cleanup"]["fixed"]} corrected), listed in docs/data-cleanup.en.md on the site.',
            f'About {gw(D["farms_noyear_mw"])} GW of operating farms have no commissioning year and are left out of analyses by year; some coordinates are township or county placeholders.',
            'Individual turbines: US USWTDB (public domain); Germany MaStR (© Bundesnetzagentur | Marktstammdatenregister, dl-de/by-2-0).',
        ]),
        ('Offshore foundations and dimensions', [
            f'Foundation types of {D["foundations_n"]} offshore farms (OSPAR and per-farm sources), water depth, hub height and rotor diameter; as-built values only, with a second source wherever OSPAR differs or has no record.',
        ]),
        ('Measured output', [
            'United States: EIA-923 and EIA-860M (public domain); Australia: AEMO MMS Data Model (credited under AEMO\'s copyright permissions); Denmark: Energistyrelsen, Stamdataregister for vindkraftanlæg '
            f'(retrieved {D["gen_meta"]["dk_retrieved"]}); Taiwan: Taipower open data 17140/17141 (Open Government Data License, version 1.0).',
            'Only full years and plants that lie wholly within one farm are used; capacity factors divide by the hours in the year (8,784 in leap years) and include curtailment.',
        ]),
        ('Other', [
            'Wind share of generation and national average capacity factor: Ember Yearly Electricity Data (CC BY 4.0). Makers: USWTDB, MaStR and the site\'s farm records; owners: GEM (CC BY 4.0).',
            'Terrain and borders in the site screenshots: Natural Earth (public domain); sea zones: Marine Regions (Flanders Marine Institute, CC BY 4.0) and national open layers. Boundaries have no legal value and imply no position on disputed areas.',
        ]),
    ]
    t['ap_quotes_title'] = 'Quoted passages for the outlook figures'
    t['ap_cov_title'] = 'Limits of the data'
    t['ap_cov'] = [
        'Operating farms the site lists one by one add up to about 92% of the national statistics; the gap is small farms missing from the databases, and neither the map nor this report invents farms to fill it.',
        'National capacity is mostly grid-connected capacity, which differs by about 1–5% from industry statistics counted by installation (GWEC).',
        'Makers are well covered only in the United States, Germany, Taiwan and offshore wind; owners are merged only when a subsidiary\'s name carries the group\'s name.',
        'Measured output covers four countries; capacity factors depend on the year\'s wind, curtailment and connection dates, so comparisons between countries show only broad differences.',
    ]
    t['copyright'] = ('© 2026 National Chin-Yi University of Technology, Dept. Intelligent Automation Engineering, Dof Lab by Juihung Liu. The text, chart design and layout of this report are all rights reserved, for viewing only; '
                      'please credit the source when quoting. Each dataset is used under the licence of its source.')
    t['back'] = '風電風情 · Taiwan Wind Watch'
    return more(D, t)


def more(D, t):
    """Second round: deeper analysis and the new chapters."""
    N = lambda iso: {'United States of America': 'United States'}.get(D['names'][iso]['en'], D['names'][iso]['en'])
    Y = D['years']
    i25 = Y.index(2025)
    cas = D['chn_add_share']
    dec = D['decades']
    ty = D['conc_years']
    k = lambda yr: ty.index(yr)
    pcd = dict(D['percap'])
    spu, spd = D['sp_us'], D['sp_de']
    oas = D['off_add_share']
    ofs = D['off_farm_size']
    cb = {r['b']: r for r in D['cf_rd_bins']}
    dk = D['cf_dk']
    mu, md = D['mk_us_period'], D['mk_de_period']
    pr = D['ports_roles']
    inc = D['inc_type']
    ao = D['asia_off']
    tm = dict((m, v) for m, v, n in D['tw_month'])
    pt = D['pipe_type']
    tw = D['tw_latest']
    ordn = lambda n: f'{n}{"th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")}'

    t['cover_note'] = 'Each country\'s turbine on the map is as tall as its cumulative capacity at the end of 2025'
    t['toc'] = [
        ('00', 'Summary'),
        ('01', 'Forty-five years: from 11 MW to 1,288 GW'),
        ('02', 'The shift east: North America, Europe, Asia'),
        ('03', 'Bigger turbines'),
        ('04', 'Out to sea'),
        ('05', 'Measured output: what farms really generate'),
        ('06', 'Who makes the turbines, who owns the farms'),
        ('07', 'Ports and the supply chain'),
        ('08', 'Incidents and risk'),
        ('09', 'Taiwan in the world'),
        ('10', 'Next: projects in development and outlooks'),
        ('◎', 'Observations'),
        ('A', 'Appendix: data, methods and limits'),
    ]

    # 1, more
    t['c1_shot'] = 'Altamont Pass, California, 1981: hundreds of small 50 kW-class turbines, the start of the first wind boom (site milestone).'
    t['c1_p2'] = [
        f'Where does each year\'s new capacity come from (⟨fig:addreg⟩)? China built {cas[2010]:.0f}% of the world\'s additions in 2010, {cas[2015]:.0f}% in 2015, {cas[2020]:.0f}% in 2020 '
        f'and {cas[2025]:.0f}% in 2025; over 2016–2025 as a whole, {D["chn_add_share_2016_25"]:.0f}% of the world\'s new capacity was in China. Over the same years Europe added about 9–19 GW a year and '
        'the United States about 1–14 GW, with no clear upward trend; the global acceleration came almost entirely from China.',
        f'⟨tab:dec⟩ breaks the growth into decades. The 1980s had the highest growth rate ({dec[0]["cagr"]:.0f}% a year) from a tiny base; the 2000s grew {dec[2]["cagr"]:.0f}% a year, '
        f'the 2010s {dec[3]["cagr"]:.0f}% and 2020–2025 {dec[4]["cagr"]:.0f}%. The rate is falling, but the amount added keeps rising: '
        f'the {dec[4]["add"]/1000:,.0f} GW added in the five years 2020–2025 already matches the whole 2010s ({dec[3]["add"]/1000:,.0f} GW).',
    ]
    t['regions4'] = {'CHN': 'China', 'EUR': 'Europe', 'USA': 'United States', 'OTH': 'Other'}
    t['c1_fig3'] = 'Where each year\'s new capacity came from, 2001–2025'
    t['c1_fig3_src'] = 'Year-on-year change of the site\'s national series, summed by country.'
    t['c1_tab'] = 'Growth by decade'
    t['c1_tab_cols'] = ['Period', 'Start GW', 'End GW', 'Added GW', 'Growth / year', 'Largest adder', 'Its share']
    t['c1_tab_src'] = 'As ⟨fig:cap⟩. The 1980s are mostly estimates.'

    # 2, more
    t['c2_shot'] = 'Three centres of gravity: the United States in 1990, Europe in 2000, Asia in 2025 (the site\'s globe, turbines drawn at one scale by each year\'s capacity).'
    t['c2_panels'] = [('na1990', '1990 · United States', f'North America {D["cont_share"][1990][2]:.0f}% of the world'), ('eu2000', '2000 · Europe', f'Europe {D["cont_share"][2000][1]:.0f}% of the world'),
                      ('as2025', '2025 · Asia', f'Asia {D["cont_share"][2025][0]:.0f}% of the world')]
    t['c2_p2'] = [
        f'Wind power is spreading. Only {D["n_1gw"][k(2000)]} countries had 1 GW or more in 2000, {D["n_1gw"][k(2010)]} in 2010 and {D["n_1gw"][k(2025)]} in 2025; '
        f'those with 10 GW or more grew from {D["n_10gw"][k(2010)]} in 2010 to {D["n_10gw"][k(2025)]} in 2025 (⟨fig:count⟩).',
        f'Yet the share of the top five has not fallen: {D["top5_share"][k(1990)]:.0f}% in 1990 (the United States alone had {D["cont_share"][1990][2]:.0f}%), down to {D["top5_share"][k(2010)]:.0f}% in 2010, '
        f'and back to {D["top5_share"][k(2025)]:.0f}% in 2025 as China grew. More and more countries build wind power, but a few build far more than the rest.',
        f'Per person the ranking looks completely different (⟨fig:percap⟩): Finland ({pcd["FIN"]:,.0f} W per person), Sweden ({pcd["SWE"]:,.0f} W) and Denmark ({pcd["DNK"]:,.0f} W) lead; '
        f'China has about {pcd["CHN"]:,.0f} W, the United States about {pcd["USA"]:,.0f} W and Taiwan about {pcd["TWN"]:,.0f} W, {ordn(D["twn_percap_rank"])} among countries with 0.5 GW or more.',
    ]
    t['c2_fig6'] = 'Countries with 1 GW and 10 GW of wind, 1990–2025'
    t['c2_fig6_src'] = 'As ⟨fig:cap⟩.'
    t['n1'], t['n10'] = '≥ 1 GW', '≥ 10 GW'
    t['c2_fig7'] = 'Wind capacity per person, 2025 (countries with 0.5 GW or more: the top 15 and Taiwan)'
    t['c2_fig7_src'] = 'Capacity as ⟨fig:cap⟩; population from Our World in Data (CC BY 4.0), latest available year. Unit: watts per person.'
    t['wpp'] = 'W / person'

    # 3, more
    t['c3_p2'] = [
        f'Dividing the rating by the swept area gives the "specific power" (W/m²); the lower it is, the larger the rotor for the same generator. New German turbines fell from about {spd[2000]:.0f} W/m² in 2000 to about {spd[2025]:.0f} W/m² in 2025, '
        f'US ones from about {spu[2005]:.0f} W/m² in 2005 to about {spu[2025]:.0f} W/m² in 2025 (⟨fig:sp⟩). The US value has always been lower than the German one.',
    ]
    t['c3_fig10'] = 'Specific power of new turbines (rating ÷ swept area)'
    t['c3_fig10_src'] = 'As ⟨fig:size⟩ and ⟨fig:rotor⟩. The lower the specific power, the more a turbine generates in light winds.'
    t['wm2'] = 'W/m²'

    # 4, more
    t['c4_shot'] = 'The North Sea: offshore farms off the United Kingdom, the Netherlands, Germany, Denmark and Belgium (site, offshore only).'
    t['c4_shot2'] = 'The Chinese coast: offshore farm clusters off Jiangsu, Guangdong and Fujian (site, offshore only).'
    big = D['off_biggest']
    t['c4_p2'] = [
        f'Offshore\'s share of each year\'s additions (⟨fig:offshare⟩) is mostly between 5% and 10%; it peaked at {oas[2021]:.0f}% in 2021, when China added 16 GW offshore in a single year, '
        f'and was {oas[2025]:.0f}% in 2025.',
        f'Single offshore farms are getting bigger too (⟨fig:offsize⟩): the median of those commissioned before 2005 was only {ofs[0]["med"]:.0f} MW, {ofs[3]["med"]:.0f} MW in 2015–2019 and {ofs[5]["med"]:.0f} MW from 2023. '
        f'The largest today are the United Kingdom\'s {big[0][0]} ({big[0][3]:,.0f} MW, {big[0][4]}) and {big[1][0]} ({big[1][3]:,.0f} MW).',
    ]
    t['c4_fig12'] = 'Offshore share of global yearly additions, 2005–2025'
    t['c4_fig12_src'] = 'The site\'s national series.'
    t['c4_fig13'] = 'Size of operating offshore farms (by commissioning year, medians)'
    t['c4_fig13_src'] = 'The site\'s farm layer, operating offshore farms with a commissioning year; medians above the bars; number of farms:'

    # 5, more
    t['c5_p2'] = [
        f'The larger the rotor, the higher the capacity factor (⟨fig:cfrd⟩). Among single-model US onshore farms the median is {cb[(0, 80)]["med"]:.1f}% for rotors under 80 m, '
        f'{cb[(80, 100)]["med"]:.1f}% for 80–100 m, and around 36% in all three groups above 100 m, with no further clear increase.',
        f'Offshore farms have higher capacity factors than onshore ones. In Denmark, the {dk["off"]["n"]} offshore farms the agency publishes have a median of {dk["off"]["med"]:.1f}% and the {dk["on"]["n"]} onshore farms {dk["on"]["med"]:.1f}%: '
        'the same data, the same country, about 10 points higher at sea.',
    ]
    t['c5_fig16'] = 'Capacity factor against rotor diameter, US onshore farms (2025)'
    t['c5_fig16_src'] = 'EIA-923 / EIA-860M and USWTDB; single-model onshore farms only. One dot per farm; lines mark the median of each range.'
    t['rd_m'] = 'Rotor diameter (m)'

    # 6, more
    t['c6_shot'] = 'The site\'s Makers & owners: shares of known makers in offshore wind worldwide.'
    t['c6_p2'] = [
        f'The market changes hands (⟨fig:mkper⟩). Of new US capacity with a known maker, GE Vernova\'s share rose from {mu[0]["shares"][0]:.0f}% in 1990–2004 to {mu[4]["shares"][0]:.0f}% from 2020, '
        f'while Siemens Gamesa fell from {mu[2]["shares"][2]:.0f}% in 2010–2014 to {mu[4]["shares"][2]:.0f}%. In Germany Enercon long led with {md[2]["shares"][0]:.0f}% in 2010–2014, '
        f'but fell to {md[4]["shares"][0]:.0f}% from 2020, overtaken by Vestas ({md[4]["shares"][1]:.0f}%).',
        f'Ownership is far more spread out: the ten largest owners together hold only {D["ow_top10_share"]:.0f}% of the known capacity, very different from the handful of makers that dominate.',
    ]
    t['c6_fig19'] = 'Maker shares of new capacity in the United States and Germany (by commissioning year, known makers)'
    t['c6_fig19_src'] = 'United States USWTDB, Germany MaStR; operating capacity grouped by commissioning year; known makers only.'
    t['mk_us_keys'] = ['GE Vernova', 'Vestas', 'Siemens Gamesa', 'Other']
    t['mk_de_keys'] = ['Enercon', 'Vestas', 'Nordex', 'Other']

    # 7 ports (new)
    t['c7p_kick'] = 'CHAPTER SEVEN'
    t['c7p_title'] = 'Ports and the supply chain'
    t['c7p_lede'] = 'Offshore wind is assembled in ports and goes to sea from them.'
    t['c7p_shot'] = 'Offshore wind ports in Europe (the site\'s Ports layer; every port has sources).'
    tws = D['ports_tw']
    mf = D['ports_most_farms']
    pbi = dict(D['ports_by_iso'])
    t['c7p_p'] = [
        'The foundations, towers, nacelles and blades of an offshore farm are stored and pre-assembled in a port, then carried out by installation vessels; once built, the farm needs an operations and maintenance port. '
        f'The site has compiled {D["ports_n"]} ports involved in offshore wind by hand, each with sources: {D["ports_status"]["operating"]} operating, {D["ports_status"]["developing"]} planned or being built, and {D["ports_status"]["former"]} whose role has ended.',
        f'By role (⟨fig:roles⟩), marshalling ports are the most common ({pr["marshalling"]}), followed by operations and maintenance ({pr["om"]}) and foundation fabrication ({pr["foundation"]}); '
        f'there are {pr["nacelle"]} nacelle, {pr["floating"]} floating-assembly, {pr["blade"]} blade, {pr["cable"]} cable and {pr["tower"]} tower sites. A port can have several roles.',
        f'By country, China ({pbi["CHN"]}), the United Kingdom ({pbi["GBR"]}) and the United States ({pbi["USA"]}) have the most; Taiwan has {len(tws)}. '
        f'The port that has served the most farms is {mf[0][1]} ({mf[0][3]} farms with sources), followed by Oostende in Belgium and Esbjerg in Denmark ({mf[1][3]} each).',
        'Planned or developing ports are concentrated where offshore wind is just starting: all 4 in the Philippines, 5 of 7 in Japan and 5 of 13 in the United States are still planned or being built.',
    ]
    t['roles'] = {'marshalling': 'Marshalling', 'om': 'Operations & maintenance', 'foundation': 'Foundation fabrication', 'nacelle': 'Nacelle assembly', 'floating': 'Floating assembly',
                  'blade': 'Blade manufacturing', 'cable': 'Cable manufacturing', 'tower': 'Tower manufacturing'}
    t['c7p_fig20'] = 'Roles of offshore wind ports'
    t['c7p_fig21'] = 'Offshore wind ports, top 12 countries'
    t['c7p_src'] = f'The site\'s port data ({D["ports_meta"]["asof"]}, compiled by hand with sources for every port). Not a complete list: ports without a source are left out.'
    t['c7p_tab'] = 'Taiwan\'s offshore wind ports'
    t['c7p_tab_cols'] = ['Port', 'Roles', 'Status', 'Farms served']
    t['pstatus'] = {'operating': 'Operating', 'developing': 'Planned or being built', 'former': 'Role ended'}
    t['port_shot'] = 'The port card for Taichung: roles, the farms it has served and sources.'

    # 8 incidents (new)
    t['c8i_kick'] = 'CHAPTER EIGHT'
    t['c8i_title'] = 'Incidents and risk'
    t['c8i_lede'] = 'Collapsed towers, broken blades, fires and typhoons: the risks of wind power in the public record.'
    t['c8i_shot'] = 'The site\'s events layer: Typhoon Soudelor blew down seven Taipower turbines in 2015 (every event has a primary source).'
    t['c8i_p'] = [
        f'The site has compiled {D["inc_n"]} wind power incidents and major events with primary sources (regulators, owners or investigation reports), each of which can be opened on the site\'s events layer. This is not complete incident statistics: '
        'the list leans towards recent years, and the many entries from 2024 on reflect when it was compiled and how much is published, not more incidents.',
        f'By type (⟨fig:inctype⟩), tower collapses (including foundation failures) are the most common ({inc["tower"]}), followed by broken blades or lost rotors ({inc["blade"]}) and fires ({inc["fire"]}); '
        f'{inc["other"]} are other kinds (grid events, oil leaks, cable damage, falls and so on). {D["inc_site"]["on"]} were onshore and {D["inc_site"]["off"]} offshore; {D["inc_typhoon"]} were related to typhoons, all in Taiwan, Japan and China.',
        f'{D["inc_with_deaths"]} incidents had officially confirmed deaths, {D["inc_deaths"]} people in all, every one of them a worker: falls during maintenance, nacelle fires, a blade that shifted during construction, '
        'and in 2024 a carbon-dioxide fire-suppression leak at the onshore substation of a Taiwanese offshore farm (3 deaths).',
        'For Taiwan, typhoons are the most direct risk: typhoons Jangmi (2008), Soudelor (2015) and Megi (2016) blew down Taiwanese turbines or broke their blades; in 2024 Super Typhoon Yagi also '
        'snapped several 6.25 MW typhoon-class turbines that were still under construction and not yet connected, at Wenchang in Hainan, China. '
        'The site\'s Wind now layer can switch to a turbine view that shows where the wind runs turbines at full output and where it is strong enough to shut them down (below).',
    ]
    t['inc_types'] = {'tower': 'Tower collapse', 'blade': 'Blade / rotor', 'fire': 'Fire', 'other': 'Other'}
    t['c8i_wind'] = f'The site\'s Wind now layer in the turbine view (NOAA GFS, {D["wind_run"]} Taiwan time): grey = barely turning, blue-green = output rising, bright green = full output, magenta = above 25 m/s, shut down. Indicative, from 10 m wind; it is the weather when the report was built, not an average.'
    t['c8i_fig22'] = 'Recorded incidents by type'
    t['c8i_fig23'] = 'Recorded incidents by year'
    t['c8i_src'] = f'The site\'s events data (compiled {D["ev_meta"]["compiled"]}, each with a primary source; casualties only when officially confirmed). The list leans towards recent years and is not an incident rate.'

    # 9 Taiwan, more
    t['c7_shot'] = 'Offshore farms off Taiwan\'s west coast (site, offshore only).'
    t['c7_p2'] = [
        f'Compared with its Asian neighbours (⟨fig:asiaoff⟩), Taiwan started offshore later than Japan and Korea, has led both since 2021 and passed Vietnam in 2023: in 2025 Taiwan had {ao["TWN"][-1]:,.0f} MW, '
        f'Japan {ao["JPN"][-1]:,.0f} MW, Korea {ao["KOR"][-1]:,.0f} MW and Vietnam {ao["VNM"][-1]:,.0f} MW. Outside China, Taiwan has the most offshore wind in Asia.',
        'The turbines in Taiwan\'s offshore farms keep growing (⟨tab:twfarms⟩): 4 MW demonstration units in 2017, 6 MW in 2019, 8–9.5 MW in 2023–2025, and 14–15 MW for the farms under construction.',
        f'Taiwan\'s wind is strongly seasonal. Taipower\'s own farms (Taipower\'s past generation by unit, every 10 minutes) averaged about {tm["2025-12"]:.0f}–{tm["2026-01"]:.0f} MW in December 2025 and January 2026 '
        f'and about {tm["2026-04"]:.0f} MW in April and May, so winter is about 2.5 times spring (⟨fig:twmonth⟩), in line with the northeast monsoon season. The data cover Taipower\'s own farms only, and the summer months are not yet in the archive.',
    ]
    t['c7_fig26'] = 'Cumulative offshore wind in Asia outside China, 2010–2025'
    t['c7_fig26_src'] = 'The site\'s national series.'
    t['c7_fig27'] = 'Monthly average output of Taipower\'s own farms, Dec 2025 – May 2026'
    t['c7_fig27_src'] = 'Taipower, past generation by unit (Government Open Data Platform 37331, every 10 minutes), subtotal of Taipower\'s own farms; private farms not included, and the set of units varies slightly by month.'

    # 10, more
    on_p = sum(pt.get((s, 'on'), 0) for s in (1, 2, 3))
    of_p = sum(pt.get((s, 'off'), 0) for s in (1, 2, 3))
    t['c8_p2'] = [
        f'Splitting the projects in development in the site\'s farm layer into onshore and offshore (⟨fig:pipetype⟩): construction is mostly onshore ({pt[(1, "on")]/1000:,.0f} GW onshore, {pt[(1, "off")]/1000:,.0f} GW offshore), '
        f'but the earlier the stage, the larger the offshore share — {pt[(2, "off")]/1000:,.0f} GW offshore in pre-construction and {pt[(3, "off")]/1000:,.0f} GW among announced projects, '
        f'{100*of_p/(on_p+of_p):.0f}% of all capacity in development. The earlier the project, the less certain it is.',
        '⟨fig:path⟩ puts the site\'s history next to GWEC\'s outlook: on GWEC\'s figures, the world\'s wind fleet grows from about 1.3 TW at the end of 2025 to about 2.3 TW in 2030. '
        'The dashed line is an outside organisation\'s outlook, not a projection by the site.',
    ]
    t['c8_fig31'] = 'Wind in development: onshore and offshore (site farm layer)'
    t['c8_fig31_src'] = 'The site\'s farm layer (GEM 2026-02 and hand-compiled pipeline projects); scope differs slightly from GEM\'s national totals in ⟨fig:pipe⟩.'
    t['on_off'] = ['Onshore', 'Offshore']
    t['c8_fig32'] = 'Global cumulative wind capacity and GWEC\'s outlook'
    t['c8_fig32_src'] = 'Solid: the site\'s national series (2000–2025). Dashed: GWEC Global Wind Report 2026, 1,299 GW at the end of 2025 plus the 969 GW expected in 2026–2030.'
    t['hist'], t['gwec'] = 'Site', 'GWEC outlook'
    t['obs'] = [
        ('Growth has not slowed', f'The {D["add"][i25]/1000:,.1f} GW added in 2025 is the most ever; GWEC expects 194 GW a year on average in 2026–2030, more still.'),
        ('Growth comes almost entirely from China', f'{D["chn_add_share_2016_25"]:.0f}% of the world\'s new capacity in 2016–2025 was in China; Europe\'s and the United States\' additions have not clearly grown.'),
        ('More countries, but no less concentration', f'Countries with 1 GW or more grew from {D["n_1gw"][k(2000)]} in 2000 to {D["n_1gw"][k(2025)]}, yet the top five still hold {D["top5_share"][k(2025)]:.0f}%.'),
        ('Larger rotors bring more electricity', 'The specific power of new turbines keeps falling; US farms commissioned from 2015 have a median measured capacity factor about 11 points higher than those from 2005–2009.'),
        ('Offshore grows fast, but slower than hoped', 'Offshore is only 7% of the total but has grown fastest over the past decade; the earlier the stage, the larger the offshore share of the pipeline, and the IEA has cut its offshore forecast to 2030 by 27%.'),
        ('Ports and worker safety', 'Offshore wind is assembled and shipped from ports, and the ports of newcomer countries are mostly still planned; all recorded deaths were workers, and typhoons are Taiwan\'s most direct risk.'),
        ('Taiwan leads offshore in Asia outside China', f'{D["tw_off"][-1]:,.0f} MW in 2025, fifth in the world; the 2035 target of 18.3–19.9 GW is roughly four times today\'s capacity.'),
        ('The data still have gaps', 'Per-farm makers and output for China and India, and measured per-farm output for most countries, are not yet public; the site will keep filling the gaps and labelling the limits of its data.'),
    ]
    t['ap_sec'] = t['ap_sec'] + [
        ('Ports, events and the Taiwan archive', [
            f'Ports: the {D["ports_n"]} offshore wind ports the site has compiled by hand ({D["ports_meta"]["asof"]}), each with sources; "farms served" lists only farms a source ties to the port.',
            f'Events: the {D["ev_meta"]["count"]} major events and incidents the site has compiled by hand ({D["ev_meta"]["compiled"]}), each with a primary source; casualties and causes only when officially confirmed. The list leans towards recent years and is not an incident rate.',
            'Taiwan monthly output: Taipower, past generation by unit (Government Open Data Platform 37331, every 10 minutes), subtotal of Taipower\'s own farms (Open Government Data License, version 1.0).',
            'Capacity per person: population from Our World in Data (CC BY 4.0), latest available year; the site divides year-end capacity by population.',
        ]),
    ]
    t['findings'] = t['findings'][:1] + [
        ('Source', f'{D["chn_add_share_2016_25"]:.0f}% of the world\'s new capacity in 2016–2025 was in China, {cas[2025]:.0f}% in 2025 alone.')] + t['findings'][1:5] + [
        ('Ports', f'Of the {D["ports_n"]} offshore wind ports the site has compiled, {pr["marshalling"]} are marshalling ports; Taichung has served the most farms.'),
        ('Risk', f'Tower collapses and broken blades dominate the {D["inc_n"]} recorded incidents; in all {D["inc_with_deaths"]} with officially confirmed deaths, the dead were workers.')] + t['findings'][5:]
    return t
