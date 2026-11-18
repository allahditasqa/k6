/*
 * Module-wise HTML + CSV reports and the history index (no dependencies).
 *
 * Layout (never edited by hand, every run adds new files, old runs are kept):
 *   reports/index.html, reports/history.json
 *   reports/<module-slug>/<Module Name> test <DD-MM-YYYY>_<HH-mm-ss>.html        (self-contained)
 *   reports/<module-slug>/<Module Name> test cases <DD-MM-YYYY>_<HH-mm-ss>.csv   (steps, expected, REAL result)
 */
const fs = require('fs');
const path = require('path');

const CSS = `
:root{--bg:#f6f7f9;--fg:#1c1f24;--card:#fff;--line:#dde1e6;--pass:#1a7f37;--fail:#cf222e;--skip:#8a6d00;--mute:#6b7380}
@media(prefers-color-scheme:dark){:root{--bg:#14161a;--fg:#e6e8eb;--card:#1d2026;--line:#2e333b;--pass:#3fb950;--fail:#ff7b72;--skip:#d4a72c;--mute:#9aa3b0}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,Segoe UI,sans-serif}
main{max-width:1100px;margin:auto}h1{margin:0 0 4px}h2{margin:28px 0 8px}.meta{color:var(--mute);font-size:13px}a{color:inherit}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.sum div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 16px}
.sum b{font-size:22px;display:block}.card{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;padding:12px 16px;margin:12px 0}
.card.passed{border-left-color:var(--pass)}.card.failed{border-left-color:var(--fail)}.card.skipped{border-left-color:var(--skip)}
.head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.badge{font-size:12px;text-transform:uppercase;padding:2px 8px;border-radius:99px;border:1px solid currentColor}
.badge.passed{color:var(--pass)}.badge.failed{color:var(--fail)}.badge.skipped{color:var(--skip)}
pre{background:var(--bg);padding:10px;border-radius:6px;overflow:auto;white-space:pre-wrap}pre.err{color:var(--fail)}
.shots{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}figure{margin:0}img{max-width:300px;border:1px solid var(--line);border-radius:6px;cursor:zoom-in}
img.big{max-width:100%;cursor:zoom-out}figcaption{font-size:12px;color:var(--mute)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line)}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.passed-t{color:var(--pass)}.failed-t{color:var(--fail)}.skipped-t{color:var(--skip)}
`;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const p2 = (n) => String(n).padStart(2, '0');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stampFile = (d) => `${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()}_${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`;
const stampHuman = (d) => `${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const label = { passed: 'Pass', failed: 'Fail', skipped: 'Skip' };
const br = (s) => esc(s).replace(/\s(?=\d+\.\s)/g, '<br>');

function counts(cases) {
  return {
    Total: cases.length,
    Passed: cases.filter((c) => c.status === 'passed').length,
    Failed: cases.filter((c) => c.status === 'failed').length,
    Skipped: cases.filter((c) => c.status === 'skipped').length,
  };
}

function summaryHtml(c) {
  return `<div class="sum"><div><b>${c.Total}</b>total</div><div><b class="passed-t">${c.Passed}</b>passed</div><div><b class="${c.Failed ? 'failed-t' : ''}">${c.Failed}</b>failed</div><div><b class="skipped-t">${c.Skipped}</b>skipped</div></div>`;
}

function moduleHtml(mod, started, durationSeconds, env) {
  const c = counts(mod.cases);
  const cards = mod.cases.map((t) => {
    const shots = (t.screenshots || []).map((s) => `<figure><img src="${s.dataUri}" alt="${esc(s.caption)}" onclick="this.classList.toggle('big')"><figcaption>${esc(s.caption)}</figcaption></figure>`).join('');
    return `<section class="card ${t.status}"><div class="head"><span class="badge ${t.status}">${t.status}</span><b>${esc(t.id)} - ${esc(t.title)}</b><span class="meta">${esc(t.testName || t.testFile)} &middot; ${Number(t.duration).toFixed(1)}s</span></div>`
      + `<div class="meta">${esc(t.priority)} &middot; ${esc(t.type)}</div>`
      + `<details><summary class="meta">Test case details</summary><table>`
      + `<tr><th>Preconditions</th><td>${esc(t.pre)}</td></tr><tr><th>Test steps</th><td>${br(t.steps)}</td></tr>`
      + `<tr><th>Test data</th><td>${esc(t.data)}</td></tr><tr><th>Expected result</th><td>${esc(t.expected)}</td></tr></table></details>`
      + `<div class="meta">Actual result:</div><pre${t.status === 'failed' ? ' class="err"' : ''}>${esc(t.actual)}</pre>`
      + (shots ? `<div class="shots">${shots}</div>` : '') + '</section>';
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(mod.name)} Test Report ${stampHuman(started)}</title><style>${CSS}</style></head><body><main>`
    + `<p class="meta"><a href="../index.html">&larr; All reports</a></p><h1>${esc(mod.name)}</h1>`
    + `<div class="meta">Run: ${stampHuman(started)} &middot; duration ${Math.round(mod.durationSeconds ?? durationSeconds)}s &middot; overall: ${c.Failed ? 'failed' : 'passed'} &middot; ${esc(env)} &middot; click a screenshot to enlarge</div>`
    + summaryHtml(c) + cards + '</main></body></html>';
}

const CSV_HEAD = ['Test Case ID', 'Module', 'Test Case Title', 'Priority', 'Test Type', 'Preconditions', 'Test Steps', 'Test Data', 'Expected Result', 'Actual Result', 'Execution Status', 'Execution Type', 'Automation Method', 'Duration (s)', 'Executed On', 'Environment'];
function moduleCsv(mod, started, env) {
  const rows = mod.cases.map((t) => [t.id, mod.name, t.title, t.priority, t.type, t.pre, t.steps, t.data, t.expected, String(t.actual).replace(/\s*\n\s*/g, ' | '), label[t.status], 'Automated', `${t.testFile}::${t.testName}`, Number(t.duration).toFixed(1), stampHuman(started), env]);
  return '﻿' + [CSV_HEAD, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function indexHtml(title, history) {
  const runs = history.map((run) => {
    const t = run.Modules.reduce((a, m) => ({ T: a.T + m.Total, P: a.P + m.Passed, F: a.F + m.Failed, S: a.S + m.Skipped }), { T: 0, P: 0, F: 0, S: 0 });
    const d = new Date(run.StartedAt);
    const rows = run.Modules.map((m) => `<tr><td>${esc(m.Module)}</td><td>${m.Total}</td><td class="passed-t">${m.Passed}</td><td class="${m.Failed ? 'failed-t' : ''}">${m.Failed}</td><td class="skipped-t">${m.Skipped}</td><td class="${m.Failed ? 'failed-t' : 'passed-t'}">${m.Failed ? 'Failed' : 'Passed'}</td><td><a href="${encodeURI(m.ReportPath)}">HTML</a></td><td><a href="${encodeURI(m.CsvPath)}">CSV</a></td></tr>`).join('');
    return `<h2>${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()} &nbsp;&middot;&nbsp; ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())} <span class="meta">&nbsp;total ${t.T} &middot; <span class="passed-t">${t.P} pass</span> &middot; <span class="${t.F ? 'failed-t' : ''}">${t.F} fail</span> &middot; <span class="skipped-t">${t.S} skip</span> &middot; ${Math.round(run.DurationSeconds)}s</span></h2>`
      + `<table><thead><tr><th>Module</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Result</th><th>Report</th><th>Test cases</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} - Test Reports</title><style>${CSS}</style></head><body><main><h1>${esc(title)} - Test Reports</h1>`
    + `<div class="meta">History: newest run on top. Under each date-time you see the module-wise reports. Old runs are never overwritten or deleted.</div>${runs}</main></body></html>`;
}

/**
 * modules: [{ name, durationSeconds?, cases: [{ id, title, priority, type, pre, data, steps, expected, actual,
 *             status: 'passed'|'failed'|'skipped', duration, testFile, testName, screenshots?: [{dataUri, caption}] }] }]
 */
function writeRun({ reportsDir, title, started = new Date(), durationSeconds = 0, environment = '', modules }) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const stamp = stampFile(started);
  const entry = {
    RunId: `${started.getFullYear()}${p2(started.getMonth() + 1)}${p2(started.getDate())}-${p2(started.getHours())}${p2(started.getMinutes())}${p2(started.getSeconds())}`,
    StartedAt: started.toISOString(),
    DurationSeconds: Number(durationSeconds.toFixed(1)),
    Modules: [],
  };
  for (const mod of modules) {
    const dir = path.join(reportsDir, slug(mod.name));
    fs.mkdirSync(dir, { recursive: true });
    const htmlName = `${mod.name} test ${stamp}.html`;
    const csvName = `${mod.name} test cases ${stamp}.csv`;
    fs.writeFileSync(path.join(dir, htmlName), moduleHtml(mod, started, durationSeconds, environment));
    fs.writeFileSync(path.join(dir, csvName), moduleCsv(mod, started, environment));
    entry.Modules.push({ Module: mod.name, ReportPath: `${slug(mod.name)}/${htmlName}`, CsvPath: `${slug(mod.name)}/${csvName}`, ...counts(mod.cases), DurationSeconds: Number((mod.durationSeconds ?? durationSeconds).toFixed(1)) });
  }
  const historyFile = path.join(reportsDir, 'history.json');
  const history = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile, 'utf8')) : [];
  history.unshift(entry);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  fs.writeFileSync(path.join(reportsDir, 'index.html'), indexHtml(title, history));
  return entry;
}

module.exports = { writeRun, counts };
