#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DB_REPO = path.resolve(process.env.DB_REPO || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const GITHUB_ROOT = path.dirname(DB_REPO);
const BJT_REPO = path.join(GITHUB_ROOT, 'bjt');
const PROGRESS_REPO = path.join(GITHUB_ROOT, 'progress');
const OUTPUT_FILE = path.join(DB_REPO, 'data/content-stats.json');
const HISTORY_FILE = path.join(DB_REPO, 'data/content-stats-history.json');
const BJT_KV_NAMESPACE_ID = process.env.BJT_KV_NAMESPACE_ID || 'fc382800625e42b7bbfe13830dd39e82';
const NPX = process.env.WRANGLER_BIN || '/Users/jiajia/.nvm/versions/node/v24.16.0/bin/npx';
const NODE_BIN_DIR = '/Users/jiajia/.nvm/versions/node/v24.16.0/bin';

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(readText(file));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function nowJst() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function isoJst(date) {
  return date.toISOString().replace('Z', '+09:00');
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function countUniqueNums(files) {
  const values = new Set();
  const pattern = /\bnum\s*:\s*["']([^"']+)["']|"num"\s*:\s*"([^"]+)"/g;
  for (const file of files) {
    const text = readText(file);
    for (const match of text.matchAll(pattern)) {
      const value = (match[1] || match[2] || '').trim();
      if (value) values.add(value);
    }
  }
  return values.size;
}

function countMogiSets() {
  const dir = path.join(BJT_REPO, 'pro/data');
  return fs.readdirSync(dir)
    .filter((name) => /^mogi_set.*\.js$/.test(name))
    .filter((name) => /\bvar\s+MOGI_SET_\d+\s*=/.test(readText(path.join(dir, name))))
    .length;
}

function runWrangler(args) {
  return execFileSync(NPX, ['wrangler', ...args], {
    cwd: path.join(BJT_REPO, 'worker'),
    env: { ...process.env, PATH: `${NODE_BIN_DIR}:${process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin'}` },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function parseDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { dateOnly: text };
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : { date: d };
}

function isActiveMember(member, today) {
  const parsed = parseDate(member.expire_date);
  if (!parsed) return false;
  if (parsed.dateOnly) return parsed.dateOnly >= today;
  return parsed.date.getTime() >= Date.now();
}

function countActiveMembers(today) {
  const keys = JSON.parse(runWrangler([
    'kv', 'key', 'list',
    '--namespace-id', BJT_KV_NAMESPACE_ID,
    '--prefix', 'member:',
  ]));
  let active = 0;
  for (const item of keys) {
    if (!item.name) continue;
    const member = JSON.parse(runWrangler([
      'kv', 'key', 'get', item.name,
      '--namespace-id', BJT_KV_NAMESPACE_ID,
    ]));
    if (isActiveMember(member, today)) active += 1;
  }
  return active;
}

function countPattoWords() {
  const counts = { j1: 0, j2: 0, j3: 0 };
  const seen = new Set();
  const dir = path.join(BJT_REPO, 'audio/voca');
  const pattern = /\{[^{}]*?\bid\s*:\s*['"]([^'"]+)['"][^{}]*?\blevel\s*:\s*['"]([^'"]+)['"][^{}]*?\}/gs;
  for (const name of fs.readdirSync(dir).filter((n) => /^bank.*\.js$/.test(n)).sort()) {
    const text = readText(path.join(dir, name));
    for (const match of text.matchAll(pattern)) {
      const id = match[1];
      if (seen.has(id)) continue;
      seen.add(id);
      const level = match[2].trim().toUpperCase();
      if (level.startsWith('J1')) counts.j1 += 1;
      else if (level === 'J2') counts.j2 += 1;
      else if (level === 'J3') counts.j3 += 1;
    }
  }
  return counts;
}

function countProgressWords() {
  const data = readJson(path.join(PROGRESS_REPO, 'data/decks/gdp_top3.json'), []);
  return {
    en: data.filter((item) => item && item.en).length,
    jp: data.filter((item) => item && item.jp).length,
    cn: data.filter((item) => item && item.cn).length,
  };
}

function latestBefore(history, today) {
  const days = Object.keys(history).filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day) && day < today).sort();
  return days.length ? history[days[days.length - 1]] : null;
}

function stat(value, previous, key) {
  return { value, change: value - Number((previous || {})[key] ?? value) };
}

function git(args) {
  return execFileSync('git', ['-C', DB_REPO, ...args], { encoding: 'utf8', stdio: 'inherit' });
}

const now = nowJst();
const today = dateKey(now);
const patto = countPattoWords();
const progress = countProgressWords();
const flat = {
  'bjtPro.studyWords': countUniqueNums([
    path.join(BJT_REPO, 'pro/data/study_part12.js'),
    path.join(BJT_REPO, 'pro/data/study_part3.js'),
  ]),
  'bjtPro.mogiSets': countMogiSets(),
  'bjtPro.activeMembers': countActiveMembers(today),
  'patto.j1': patto.j1,
  'patto.j2': patto.j2,
  'patto.j3': patto.j3,
  'progress.en': progress.en,
  'progress.jp': progress.jp,
  'progress.cn': progress.cn,
};

const history = readJson(HISTORY_FILE, {});
const previous = latestBefore(history, today);
const output = {
  generatedAt: isoJst(now),
  bjtPro: {
    studyWords: stat(flat['bjtPro.studyWords'], previous, 'bjtPro.studyWords'),
    mogiSets: stat(flat['bjtPro.mogiSets'], previous, 'bjtPro.mogiSets'),
    activeMembers: stat(flat['bjtPro.activeMembers'], previous, 'bjtPro.activeMembers'),
  },
  patto: {
    j1: stat(flat['patto.j1'], previous, 'patto.j1'),
    j2: stat(flat['patto.j2'], previous, 'patto.j2'),
    j3: stat(flat['patto.j3'], previous, 'patto.j3'),
  },
  progress: {
    en: stat(flat['progress.en'], previous, 'progress.en'),
    jp: stat(flat['progress.jp'], previous, 'progress.jp'),
    cn: stat(flat['progress.cn'], previous, 'progress.cn'),
  },
};

history[today] = flat;
writeJson(HISTORY_FILE, Object.fromEntries(Object.entries(history).sort(([a], [b]) => a.localeCompare(b))));
writeJson(OUTPUT_FILE, output);

git(['pull', '--rebase']);
git(['add', 'data/content-stats.json', 'data/content-stats-history.json']);
try {
  execFileSync('git', ['-C', DB_REPO, 'diff', '--cached', '--quiet']);
  console.log('No content stats changes to commit.');
} catch {
  git(['commit', '-m', `update content stats ${output.generatedAt}`]);
  git(['push']);
}
