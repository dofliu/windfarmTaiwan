/* 風電風情 · status.js — 排程狀態頁 #/status：每個資料來源最後一次的資料時間、與預期更新週期相比是否過期，以及 GitHub Actions 各排程最近一次的結果
   資料時間直接讀網站自己發布的即時檔（不經快取）：wind_realtime.json（台電）、grid_status.json（電力供需）、data/live/intl_realtime.json（各國）、
   data/live/wind_now.json（GFS）、data/archive/farm_daily.json（每日取樣）、wind_archive_daily.json（官方回溯存檔）；
   排程結果讀 GitHub 公開 API（api.github.com，不需登入，每小時每 IP 60 次；失敗時只顯示資料時間），單檔版的 GitHub Release 也從那裡讀上傳時間。
   顏色：綠＝在預期週期內、黃＝遲了、紅＝遠超過或最近一次失敗；頁面打開時每 5 分鐘重新整理。取代 DEPLOY.md「維護」的每月人工檢查。
   The schedule status page: last data time of every source against its expected cadence, the latest GitHub Actions run of each schedule
   (public API, no login) and the single-file release; green = on time, amber = late, red = far behind or failed. Refreshes every 5 minutes while open. */
(function () {
'use strict';
const WW = window.WW;
const host = document.getElementById('page-status');
if (!host) return;
const L = WW.L, esc = WW.esc;
const REPO = 'dofliu/windfarmTaiwan';
const tms = s => { if (!s) return NaN; const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + '+08:00'); return isNaN(t) ? Date.parse(s) : t; };
const H = 36e5, D = 864e5;
const p2 = n => String(n).padStart(2, '0');
const twTime = ms => { if (isNaN(ms)) return '—'; const d = new Date(ms + 288e5); return d.getUTCFullYear() + '/' + (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + ' ' + p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); };
const ago = ms => {
  if (isNaN(ms)) return L('沒有時間', 'no time');
  const m = Math.round((Date.now() - ms) / 6e4);
  if (m < 1) return L('剛剛', 'just now');
  if (m < 90) return L(m + ' 分鐘前', m + ' min ago');
  const h = Math.round(m / 60); if (h < 48) return L(h + ' 小時前', h + ' h ago');
  return L(Math.round(h / 24) + ' 天前', Math.round(h / 24) + ' days ago');
};
/* 每一列的判斷：warn／bad 是距今多久算遲到、算異常（毫秒）· thresholds for amber and red */
const grade = (t, warn, bad) => isNaN(t) ? 'bad' : Date.now() - t > bad ? 'bad' : Date.now() - t > warn ? 'warn' : 'ok';
const row = (g, name, when, note, link) => ({ g, name, when, note, link });
const live = u => WW.getLiveJSON(u).catch(() => null);

/* ---------- 資料來源 ---------- */
async function dataRows() {
  const [tw, grid, intl, wn, fd, arch] = await Promise.all([live('wind_realtime.json'), live('grid_status.json'), live(WW.DATA.intl || 'data/live/intl_realtime.json'), live(WW.DATA.windNow), live(WW.DATA.farmDaily), live('wind_archive_daily.json')]);
  const R = [];
  if (tw) { const t = tms(tw.source_time); R.push(row(grade(t, 1.5 * H, 3 * H), L('台電即時風力', 'Taipower live wind'), t, L('台電每 10 分鐘更新，本站約每 30 分鐘抓一次（外部排程）；抓取時間 ' + twTime(tms(tw.updated)), 'Taipower updates every 10 min; fetched about every 30 min (external trigger); fetched at ' + twTime(tms(tw.updated))))); }
  else R.push(row('bad', L('台電即時風力', 'Taipower live wind'), NaN, L('讀不到 wind_realtime.json', 'wind_realtime.json could not be read')));
  if (fd && fd.meta) { const t = tms(fd.meta.updated), days = Object.keys(fd.days || {}); R.push(row(grade(t, 1.5 * H, 3 * H), L('每日取樣累積', 'Daily samples'), t, L('每次抓取後累加；共 ' + days.length + ' 天（' + (days[0] || '') + ' 起）', 'Added after every fetch; ' + days.length + ' days since ' + (days[0] || '')))); }
  if (grid) { const t = tms(grid.source_time); R.push(row(grade(t, 45 * D, 75 * D), L('電力供需（每日資料，每月更新）', 'Supply and demand (daily data, monthly release)'), t, L('政府開放資料 19995，約每月 5 日更新到上個月底；資料日期 ' + (grid.source_time || '—'), 'Open data 19995, updated around the 5th of each month through the end of the previous month; data date ' + (grid.source_time || '—')))); }
  if (intl) {
    const t = tms(intl.updated); R.push(row(grade(t, 1.5 * H, 3 * H), L('各國即時出力（整批）', 'Live output abroad (batch)'), t, L('與台電同一個排程', 'Same schedule as the Taipower fetch')));
    const srcs = Object.assign({}, intl.grids || {}, intl.nat || {});
    Object.keys(srcs).forEach(k => { const s = srcs[k], t = tms(s.time); R.push(row(s.ok === false ? 'bad' : grade(t, 3 * H, 12 * H), '　' + k + (s.area ? ' · ' + s.area : ''), t, s.ok === false ? L('最近一次抓取失敗（沿用上一次的值）', 'Last fetch failed (previous value kept)') : (s.res ? L('來源解析度 ' + s.res, 'Source resolution ' + s.res) : ''), s.url)); });
  }
  if (wn) { const t = Date.parse(String(wn.run).replace(/Z$/, ':00Z')); R.push(row(grade(t, 9 * H, 15 * H), L('此刻的風（GFS）', 'Wind now (GFS)'), t, L('每 6 小時抓 NOAA GFS 分析場；顯示的是模式時間', 'NOAA GFS analysis every 6 hours; the model time is shown'))); }
  if (arch) { const t = tms(arch.updated), days = arch.days || []; R.push(row(grade(t, 130 * D, 200 * D), L('台電官方回溯存檔', 'Taipower retrospective archive'), t, L('開放資料 37331，季度檔，每週一檢查、有新資料才變動；' + days.length + ' 天（到 ' + (days.length ? days[days.length - 1].d : '—') + '）', 'Open data 37331, quarterly file, checked every Monday and changed only when new data appears; ' + days.length + ' days (to ' + (days.length ? days[days.length - 1].d : '—') + ')'))); }
  return R;
}

/* ---------- GitHub Actions 與 Release ---------- */
const JOBS = [      // 名稱、預期間隔（warn, bad）、說明 · workflow name, expected gap, note
  ['scrape-taipower-wind', 2.5 * H, 6 * H, ['外部排程約每 30 分鐘，GitHub 每 2 小時備援', 'External trigger about every 30 min, GitHub schedule every 2 h as fallback']],
  ['wind-now', 7 * H, 13 * H, ['每 6 小時', 'Every 6 hours']],
  ['backfill-taipower-wind-history', 8 * D, 15 * D, ['每週一', 'Every Monday']],
  ['keepalive', 32 * D, 62 * D, ['每月 1 日，重新啟用排程', 'On the 1st of each month; re-enables the schedules']],
  ['build-standalone', Infinity, Infinity, ['main 的網站或全球資料變更時', 'When site code or global data change on main']],
  ['pages build and deployment', Infinity, Infinity, ['每次 push 到 main', 'On every push to main']]
];
async function actionRows() {
  const R = [];
  try {
    const r = await fetch('https://api.github.com/repos/' + REPO + '/actions/runs?per_page=60', { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(r.status);
    const runs = (await r.json()).workflow_runs || [], seen = {};
    runs.forEach(x => { if (!seen[x.name]) seen[x.name] = x; });
    JOBS.forEach(([name, warn, bad, note]) => {
      const x = seen[name];
      if (!x) { R.push(row('warn', name, NaN, L('最近 60 次執行裡沒有它', 'Not among the last 60 runs') + ' · ' + L(note[0], note[1]))); return; }
      const t = Date.parse(x.updated_at), fail = x.status === 'completed' && x.conclusion && x.conclusion !== 'success';
      R.push(row(fail ? 'bad' : x.status !== 'completed' ? 'ok' : grade(t, warn, bad), name, t,
        (x.status !== 'completed' ? L('執行中', 'running') : x.conclusion) + ' · ' + L(note[0], note[1]) + (x.event === 'workflow_dispatch' && name === 'scrape-taipower-wind' ? L('（由外部排程觸發）', ' (started by the external trigger)') : ''), x.html_url));
    });
  } catch (e) {
    R.push(row('warn', L('GitHub Actions', 'GitHub Actions'), NaN, L('讀不到 GitHub API（可能是每小時 60 次的限制），請直接看 Actions 分頁', 'GitHub API unavailable (perhaps the 60/hour limit); see the Actions tab directly'), 'https://github.com/' + REPO + '/actions'));
  }
  try {
    const r = await fetch('https://api.github.com/repos/' + REPO + '/releases/tags/standalone', { headers: { Accept: 'application/vnd.github+json' } });
    if (r.ok) { const rel = await r.json(); (rel.assets || []).forEach(a => { const t = Date.parse(a.updated_at); R.push(row(grade(t, Infinity, Infinity), L('單檔版 ', 'Single-file ') + a.name, t, (a.size / 1048576).toFixed(1) + ' MB · ' + L('下載 ' + WW.int(a.download_count) + ' 次', WW.int(a.download_count) + ' downloads'), a.browser_download_url)); }); }
  } catch (e) { /* 沒有也沒關係 */ }
  return R;
}

/* ---------- 畫面 ---------- */
const DOT = { ok: ['正常', 'ok'], warn: ['遲了', 'late'], bad: ['異常', 'problem'] };
function table(title, rows) {
  return `<h2 class="h3">${title}</h2><div class="sttbl"><table><thead><tr><th>${L('狀態', 'Status')}</th><th>${L('項目', 'Item')}</th><th>${L('最後資料／執行時間', 'Last data / run')}</th><th>${L('說明', 'Note')}</th></tr></thead><tbody>` +
    rows.map(r => `<tr class="st-${r.g}"><td><span class="stdot" aria-hidden="true"></span>${L(DOT[r.g][0], DOT[r.g][1])}</td><td>${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.name)}</a>` : esc(r.name)}</td><td><b>${ago(r.when)}</b><br><small>${twTime(r.when)}</small></td><td>${esc(r.note || '')}</td></tr>`).join('') + '</tbody></table></div>';
}
let timer = null, busy = false;
async function paint() {
  if (busy) return; busy = true;
  const body = host.querySelector('.stbody');
  body.innerHTML = `<p class="note">${L('讀取中…', 'Loading…')}</p>`;
  try {
    const [d, a] = await Promise.all([dataRows(), actionRows()]);
    const all = d.concat(a), bad = all.filter(r => r.g === 'bad'), warn = all.filter(r => r.g === 'warn');
    const sum = bad.length ? `<div class="stsum st-bad">${L(`${bad.length} 項異常`, `${bad.length} problem${bad.length > 1 ? 's' : ''}`)}${warn.length ? L(`、${warn.length} 項遲了`, `, ${warn.length} late`) : ''}：${esc(bad.map(r => r.name.trim()).join('、'))}</div>`
      : warn.length ? `<div class="stsum st-warn">${L(`${warn.length} 項遲了`, `${warn.length} late`)}：${esc(warn.map(r => r.name.trim()).join('、'))}</div>`
        : `<div class="stsum st-ok">${L('全部正常', 'All running normally')}</div>`;
    body.innerHTML = sum + table(L('資料來源', 'Data sources'), d) + table(L('排程（GitHub Actions）與單檔版', 'Schedules (GitHub Actions) and the single-file copies'), a) +
      `<p class="note">${L('時間為台灣時間；本頁每 5 分鐘重新讀取。判斷門檻依各來源的更新週期：綠＝在週期內、黃＝遲了、紅＝遠超過或最近一次失敗。排程結果來自 GitHub 公開 API（不需登入）。維護方式見 DEPLOY.md「維護」。', 'Times are Taiwan time; this page reloads every 5 minutes. Thresholds follow each source\'s cadence: green = on time, amber = late, red = far behind or failed. Schedule results come from GitHub\'s public API (no login). See "Maintenance" in DEPLOY.en.md.')}
      ${L('更新於 ', 'Checked at ') + twTime(Date.now())}</p>`;
  } catch (e) { body.innerHTML = `<p class="note">${L('讀取失敗：', 'Could not load: ') + esc(String(e && e.message || e))}</p>`; }
  busy = false;
}
function enter() {
  host.innerHTML = `<div class="wrap status"><h1 class="h2">${L('排程狀態', 'Schedule status')}</h1><p class="lead">${L('每個資料來源最後一次的資料時間，與各排程最近一次的執行結果。', 'The last data time of every source and the latest run of every schedule.')}</p><div class="stbody"></div></div>`;
  paint();
  clearInterval(timer); timer = setInterval(() => { if (WW.currentPage() === 'status') paint(); }, 300000);
}
WW.registerPage('status', { enter, leave() { clearInterval(timer); timer = null; } });
WW.onLang(() => { if (WW.currentPage() === 'status') enter(); });
})();
