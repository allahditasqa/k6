#!/usr/bin/env node
/*
 * Runs every k6 scenario with a SHORT profile (polite to the shared demo service) and writes module-wise
 * reports from the real results. One module = one scenario script; one test case = one threshold.
 *
 *   node tools/run-k6.js               all scenarios
 *   node tools/run-k6.js smoke load    only these
 * The k6 binary is taken from the K6 environment variable, or "k6" from the PATH.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseDocs, ROOT } = require('./docs');
const { writeRun } = require('./report-lib');

const K6 = process.env.K6 || 'k6';
const PROFILES = {
  smoke: { module: 'Smoke', env: { DURATION: '10s' } },
  load: { module: 'Load', env: { VUS: '3', RAMP_UP: '5s', HOLD: '15s', RAMP_DOWN: '5s' } },
  stress: { module: 'Stress', env: { SCALE: '0.1', STEP: '8s' } },
  spike: { module: 'Spike', env: { SCALE: '0.2', WARM: '5s', SURGE: '5s', HOLD: '10s', DROP: '5s', RECOVER: '10s' } },
  soak: { module: 'Soak', env: { VUS: '3', RAMP: '5s', HOLD: '20s' } },
};
const wanted = process.argv.slice(2);
const scenarios = Object.keys(PROFILES).filter((s) => !wanted.length || wanted.includes(s));
const docCases = parseDocs().flatMap((d) => d.cases);

function evaluate(metric, expr) {
  const m = /^([\w.()]+)\s*(<=|>=|<|>|==)\s*([\d.]+)$/.exec(expr.trim());
  if (!m || !metric) return { ok: null, text: `${expr}: could not evaluate` };
  const [, agg, op, limitText] = m;
  const limit = Number(limitText);
  const value = agg === 'rate' && metric.value !== undefined ? metric.value : metric[agg];
  if (value === undefined) return { ok: null, text: `${expr}: value "${agg}" is not in the summary` };
  const ok = { '<': value < limit, '<=': value <= limit, '>': value > limit, '>=': value >= limit, '==': value === limit }[op];
  const shown = agg.startsWith('p(') || agg === 'avg' ? `${value.toFixed(1)} ms` : `${(value * 100).toFixed(2)} %`;
  return { ok, text: `${agg} = ${shown}, limit ${op} ${limitText}${agg === 'rate' ? '' : ' ms'}`, flag: metric.thresholds?.[expr.trim()] };
}

const started = new Date();
const modules = [];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'k6-'));
let k6Version = 'k6';

for (const scenario of scenarios) {
  const { module, env } = PROFILES[scenario];
  const summaryFile = path.join(tmp, `${scenario}.json`);
  const args = ['run', '-q', '--summary-trend-stats', 'min,avg,med,max,p(90),p(95),p(99)', '--summary-export', summaryFile, ...Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]), `scripts/${scenario}.js`];
  const t0 = Date.now();
  const run = spawnSync(K6, args, { cwd: ROOT, encoding: 'utf8' });
  const seconds = (Date.now() - t0) / 1000;
  if (!fs.existsSync(summaryFile)) throw new Error(`k6 produced no summary for ${scenario}:\n${run.stderr || run.stdout}`);
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  const metrics = summary.metrics;
  const profile = Object.entries(env).map(([k, v]) => `${k}=${v}`).join(' ');
  const facts = `profile ${profile}; ${metrics.http_reqs?.count ?? 0} requests, ${metrics.iterations?.count ?? 0} iterations, max ${metrics.vus_max?.value ?? '?'} VUs, ${seconds.toFixed(0)} s`;
  const cases = docCases.filter((c) => c.module === module).map((c) => {
    const key = c.testName;
    const split = key.lastIndexOf(': ');
    const metricName = key.slice(0, split);
    const exprs = key.slice(split + 2).split(',').map((e) => e.trim());
    const results = exprs.map((e) => evaluate(metrics[metricName], e));
    const failed = results.some((r) => r.ok === false || r.flag === true || r.ok === null);
    const lines = [`${metricName}:`, ...results.map((r, i) => `  ${r.ok && r.flag !== true ? 'ok  ' : 'FAIL'} ${exprs[i]}  (${r.text})`), facts];
    return {
      id: c.id, title: c.title, priority: c.priority, type: c.type, pre: c.pre, data: c.data, steps: c.steps, expected: c.expected,
      actual: lines.join('\n'), status: failed ? 'failed' : 'passed', duration: seconds, testFile: c.testFile, testName: c.testName,
    };
  });
  cases.sort((a, b) => a.id.localeCompare(b.id));
  modules.push({ name: module, durationSeconds: seconds, cases });
  console.log(`${module}: ${cases.filter((c) => c.status === 'passed').length}/${cases.length} thresholds passed (k6 exit code ${run.status})`);
}

const v = spawnSync(K6, ['version'], { encoding: 'utf8' }).stdout.trim().split('\n')[0];
if (v) k6Version = v.replace(/\s*\(.*$/, '');
const entry = writeRun({
  reportsDir: path.join(ROOT, 'reports'), title: 'k6', started, durationSeconds: (Date.now() - started) / 1000,
  environment: `${k6Version}, short profile - https://quickpizza.grafana.com`, modules,
});
const failed = entry.Modules.reduce((a, m) => a + m.Failed, 0);
console.log(`Reports: reports/index.html (${failed} failed case(s))`);
process.exit(failed ? 1 : 0);
