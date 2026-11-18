#!/usr/bin/env node
/*
 * Test case documentation tool (no dependencies, Node 18+).
 *
 *   node tools/docs.js csv     regenerate the master CSV of every docs/test-cases/*.md
 *   node tools/docs.js check   fail when documents, master CSVs and test code do not agree
 *
 * The Markdown documents are the single source of truth. A test case row looks like:
 *   | ID | Title | Priority | Type | Preconditions | Test data | Steps | Expected result | Automated in |
 * "Automated in" is `<path of the test file>::<test name>`; the path must exist.
 * Configuration (optional) in tools/docs.config.json: { "code": ["src/test"], "extensions": [".java"] }
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs', 'test-cases');
const ID_RE = /\bTC_[A-Z0-9]+(?:_[A-Z0-9]+)*_\d{2,3}\b/g;
const COLUMNS = [
  'ID', 'Module', 'Title', 'Priority', 'Type', 'Preconditions', 'Test Data',
  'Steps', 'Expected Result', 'Automation', 'Test File', 'Regression', 'Last Updated',
];

function config() {
  const file = path.join(__dirname, 'docs.config.json');
  const cfg = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  return { code: cfg.code || ['src', 'tests', 'scripts', 'test-plans', 'collections'], extensions: cfg.extensions || ['.java', '.js', '.json', '.jmx', '.ts'] };
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function splitRow(line) {
  const cells = [];
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\' && line[i + 1] === '|') { cur += '|'; i++; continue; }
    if (line[i] === '|') { cells.push(cur.trim()); cur = ''; continue; }
    cur += line[i];
  }
  cells.push(cur.trim());
  return cells.slice(1, -1);
}

/** Parses every docs/test-cases/*.md into [{file, module, cases:[...]}]. */
function parseDocs(docsDir = DOCS_DIR) {
  if (!fs.existsSync(docsDir)) return [];
  return fs.readdirSync(docsDir).filter((f) => f.endsWith('.md')).sort().map((file) => {
    const lines = fs.readFileSync(path.join(docsDir, file), 'utf8').split(/\r?\n/);
    const moduleLine = lines.find((l) => /^\*\*Module:\*\*/.test(l));
    const module = moduleLine ? moduleLine.replace(/^\*\*Module:\*\*\s*/, '').trim() : file.replace(/\.md$/, '');
    let group = '';
    const cases = [];
    for (const line of lines) {
      const h = /^##\s+(.*)$/.exec(line);
      if (h) group = h[1].replace(/^[A-Z]\.\s*/, '').trim();
      if (!/^\|\s*TC_/.test(line)) continue;
      const c = splitRow(line);
      if (c.length < 9) throw new Error(`${file}: row has ${c.length} cells, expected 9: ${line.slice(0, 60)}`);
      const [id, title, priority, type, pre, data, steps, expected, automated] = c;
      const [testFile, testName] = automated.replace(/`/g, '').split('::');
      cases.push({ id, module, group, title, priority, type, pre, data, steps, expected, testFile: testFile.trim(), testName: (testName || '').trim() });
    }
    return { file, module, cases };
  });
}

function csvCell(v) { return `"${String(v).replace(/"/g, '""')}"`; }

function parseCsv(text) {
  const rows = [];
  let row = [], cur = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function buildRows(doc, previous) {
  const prev = new Map(previous.map((r) => [r.ID, r]));
  return doc.cases.map((c) => {
    const row = {
      ID: c.id, Module: c.module, Title: c.title, Priority: c.priority, Type: c.type, Preconditions: c.pre,
      'Test Data': c.data, Steps: c.steps, 'Expected Result': c.expected, Automation: 'Automated',
      'Test File': c.testName ? `${c.testFile}::${c.testName}` : c.testFile, Regression: 'Yes', 'Last Updated': today(),
    };
    const old = prev.get(c.id);
    if (old && COLUMNS.filter((k) => k !== 'Last Updated').every((k) => old[k] === row[k])) row['Last Updated'] = old['Last Updated'];
    return row;
  });
}

function readCsvRows(file) {
  if (!fs.existsSync(file)) return [];
  const [header, ...rows] = parseCsv(fs.readFileSync(file, 'utf8'));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

function writeCsv(file, rows) {
  const lines = [COLUMNS.map(csvCell).join(',')].concat(rows.map((r) => COLUMNS.map((k) => csvCell(r[k])).join(',')));
  fs.writeFileSync(file, '﻿' + lines.join('\r\n') + '\r\n');
}

function codeIds() {
  const { code, extensions } = config();
  const found = new Map(); // id -> [files]
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'target', '.git', 'reports'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (extensions.includes(path.extname(e.name))) {
        for (const id of new Set(fs.readFileSync(p, 'utf8').match(ID_RE) || [])) {
          if (!found.has(id)) found.set(id, []);
          found.get(id).push(path.relative(ROOT, p).replace(/\\/g, '/'));
        }
      }
    }
  };
  code.forEach((d) => walk(path.join(ROOT, d)));
  return found;
}

function cmdCsv() {
  for (const doc of parseDocs()) {
    const csv = path.join(DOCS_DIR, doc.file.replace(/\.md$/, '.csv'));
    writeCsv(csv, buildRows(doc, readCsvRows(csv)));
    console.log(`wrote ${path.relative(ROOT, csv)} (${doc.cases.length} cases)`);
  }
}

function cmdCheck() {
  const problems = [];
  const docs = parseDocs();
  const docIds = new Map();
  for (const doc of docs) {
    for (const c of doc.cases) {
      if (docIds.has(c.id)) problems.push(`duplicate ID ${c.id} (${doc.file} and ${docIds.get(c.id)})`);
      docIds.set(c.id, doc.file);
      if (!fs.existsSync(path.join(ROOT, c.testFile))) problems.push(`${c.id}: test file not found: ${c.testFile}`);
    }
    const csv = path.join(DOCS_DIR, doc.file.replace(/\.md$/, '.csv'));
    const current = readCsvRows(csv);
    const expected = buildRows(doc, current);
    const strip = (r) => COLUMNS.filter((k) => k !== 'Last Updated').map((k) => r[k]).join('\u0001');
    if (current.length !== expected.length || expected.some((r, i) => strip(r) !== strip(current[i] || {}))) {
      problems.push(`${path.relative(ROOT, csv)} is out of date - run: node tools/docs.js csv`);
    }
  }
  const inCode = codeIds();
  for (const [id, doc] of docIds) if (!inCode.has(id)) problems.push(`${id} (${doc}) is documented but not found in the test code`);
  for (const [id, files] of inCode) if (!docIds.has(id)) problems.push(`${id} is in the code (${files[0]}) but not documented`);
  if (problems.length) {
    console.error(`Traceability check FAILED (${problems.length} problem(s)):`);
    problems.forEach((p) => console.error(' - ' + p));
    process.exit(1);
  }
  console.log(`Traceability check passed: ${docIds.size} test cases, documents, master CSVs and code agree.`);
}

module.exports = { parseDocs, parseCsv, readCsvRows, DOCS_DIR, ROOT };

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'csv') cmdCsv();
  else if (cmd === 'check') cmdCheck();
  else { console.error('usage: node tools/docs.js csv|check'); process.exit(2); }
}
