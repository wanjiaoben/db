#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DATABASE = process.env.NICE_ANALYTICS_D1_DATABASE || 'nice_analytics';
const BUCKET = process.env.NICE_ANALYTICS_BACKUP_BUCKET || 'progress-backup';
const PREFIX = stripSlashes(process.env.NICE_ANALYTICS_BACKUP_PREFIX || 'd1/nice_analytics/production');
const RETENTION_DAYS = Number(process.env.NICE_ANALYTICS_BACKUP_RETENTION_DAYS || 30);
const MONTHLY_KEEP_DAY = Number(process.env.NICE_ANALYTICS_BACKUP_MONTHLY_KEEP_DAY || 1);
const WRANGLER_VERSION = process.env.NICE_ANALYTICS_BACKUP_WRANGLER_VERSION || '4.112.0';
const maxWranglerAttempts = Number(process.env.NICE_ANALYTICS_BACKUP_WRANGLER_ATTEMPTS || 3);
const protectedRetentionKeys = new Set([
  `${PREFIX}/latest.json`,
  `${PREFIX}/index.json`,
]);

if (process.env.GITHUB_ACTIONS === 'true' && !process.env.CLOUDFLARE_API_TOKEN) {
  throw new Error('CLOUDFLARE_API_TOKEN GitHub secret is required for nice_analytics D1 backup.');
}
if (process.env.GITHUB_ACTIONS === 'true' && !process.env.CLOUDFLARE_ACCOUNT_ID) {
  throw new Error('CLOUDFLARE_ACCOUNT_ID GitHub secret is required for nice_analytics D1 backup.');
}
if (!Number.isFinite(RETENTION_DAYS) || RETENTION_DAYS < 1) {
  throw new Error(`Invalid NICE_ANALYTICS_BACKUP_RETENTION_DAYS: ${RETENTION_DAYS}`);
}
if (process.argv.includes('--self-test')) {
  runRetentionDeleteSelfTest();
  process.exit(0);
}

const rootWrangler = join(process.cwd(), 'node_modules', '.bin', 'wrangler');
const analyticsWrangler = join(process.cwd(), 'analytics-worker', 'node_modules', '.bin', 'wrangler');
const wranglerCommand = process.env.WRANGLER_BIN
  || (existsSync(rootWrangler) ? rootWrangler : null)
  || (existsSync(analyticsWrangler) ? analyticsWrangler : 'npx');
const wranglerPrefixArgs = wranglerCommand === 'npx' ? [`wrangler@${WRANGLER_VERSION}`] : [];

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, '-');
const datePath = now.toISOString().slice(0, 10);
const tmp = mkdtempSync(join(tmpdir(), 'nice-analytics-d1-backup-'));
const exportPath = join(tmp, `nice_analytics-${stamp}.sql`);
const readBackPath = join(tmp, `nice_analytics-${stamp}.readback.sql`);
const manifestPath = join(tmp, `nice_analytics-${stamp}.manifest.json`);
const indexPath = join(tmp, `nice_analytics-${stamp}.index.json`);
const priorIndexPath = join(tmp, 'prior-index.json');

try {
  wrangler(['d1', 'export', DATABASE, '--remote', '--output', exportPath]);
  const sql = readFileSync(exportPath);
  const sha256 = sha256Hex(sql);
  const bytes = statSync(exportPath).size;
  const tableCounts = await collectTableCounts();
  const objectKey = `${PREFIX}/${datePath}/nice_analytics-d1-${stamp}.sql`;
  const manifestKey = `${PREFIX}/${datePath}/manifest-${stamp}.json`;
  const latestKey = `${PREFIX}/latest.json`;
  const indexKey = `${PREFIX}/index.json`;
  const priorIndex = await readPriorIndex(indexKey);
  const retentionPlan = planRetention(now, priorIndex.backups || []);

  const manifest = {
    kind: 'nice-analytics-d1-backup',
    version: 1,
    database: DATABASE,
    environment: 'production',
    bucket: BUCKET,
    prefix: PREFIX,
    generated_at: now.toISOString(),
    object_key: objectKey,
    manifest_key: manifestKey,
    index_key: indexKey,
    size_bytes: bytes,
    sha256,
    table_counts: tableCounts,
    row_count: Object.values(tableCounts).reduce((sum, count) => sum + count, 0),
    failures: [],
    retention: {
      daily_days: RETENTION_DAYS,
      policy: 'keep daily backups for 30 days, then keep one backup per UTC month',
      planned_delete_objects: retentionPlan.deleteKeys.length,
      deleted_objects: 0,
      kept_monthly: retentionPlan.keptMonthly,
    },
  };

  await putObject(objectKey, exportPath, 'application/sql; charset=utf-8');

  for (const key of retentionPlan.deleteKeys) {
    try {
      deleteRetentionObject(key);
      manifest.retention.deleted_objects += 1;
    } catch (error) {
      manifest.failures.push({
        stage: 'retention_delete',
        key,
        error: cleanError(error),
      });
    }
  }

  const index = {
    kind: 'nice-analytics-d1-backup-index',
    version: 1,
    database: DATABASE,
    environment: 'production',
    bucket: BUCKET,
    prefix: PREFIX,
    updated_at: now.toISOString(),
    retention: manifest.retention,
    backups: [
      ...retentionPlan.keepEntries,
      {
        generated_at: manifest.generated_at,
        object_key: objectKey,
        manifest_key: manifestKey,
        size_bytes: bytes,
        sha256,
        row_count: manifest.row_count,
      },
    ].sort((a, b) => String(b.generated_at).localeCompare(String(a.generated_at))),
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
  await putObject(manifestKey, manifestPath, 'application/json; charset=utf-8');
  await putObject(latestKey, manifestPath, 'application/json; charset=utf-8');
  await putObject(indexKey, indexPath, 'application/json; charset=utf-8');

  wrangler(['r2', 'object', 'get', `${BUCKET}/${objectKey}`, '--file', readBackPath, '--remote'], { stdio: 'inherit' });
  const readBackSha256 = sha256Hex(readFileSync(readBackPath));
  if (readBackSha256 !== sha256) {
    throw new Error(`R2 read-back sha256 mismatch for ${objectKey}: local=${sha256} readback=${readBackSha256}`);
  }

  console.log(JSON.stringify({
    ok: true,
    database: DATABASE,
    object_key: objectKey,
    manifest_key: manifestKey,
    latest_key: latestKey,
    index_key: indexKey,
    size_bytes: bytes,
    sha256,
    table_count: Object.keys(tableCounts).length,
    row_count: manifest.row_count,
    deleted_objects: manifest.retention.deleted_objects,
    failures: manifest.failures,
  }, null, 2));
  if (manifest.failures.length) {
    throw new Error(`Backup completed but retention had failures: ${manifest.failures.length}`);
  }
} catch (error) {
  console.error(error?.message || String(error));
  process.exitCode = 1;
} finally {
  if (process.env.NICE_ANALYTICS_BACKUP_KEEP_TMP !== '1') {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function stripSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function wrangler(args, options = {}) {
  const commandArgs = [...wranglerPrefixArgs, ...args];
  const attempts = Number(options.attempts || maxWranglerAttempts);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return execFileSync(wranglerCommand, commandArgs, {
        encoding: options.encoding || 'utf8',
        stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024 * 128,
      });
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delayMs = Math.min(30000, 1000 * 2 ** (attempt - 1));
      console.warn(`wrangler ${args.slice(0, 3).join(' ')} failed on attempt ${attempt}; retrying in ${delayMs}ms.`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
    }
  }
  throw lastError;
}

async function putObject(key, file, contentType) {
  wrangler([
    'r2', 'object', 'put', `${BUCKET}/${key}`,
    '--file', file,
    '--content-type', contentType,
    '--remote',
  ], { stdio: 'inherit' });
}

function deleteRetentionObject(key) {
  assertRetentionDeleteKeyAllowed(key);
  wrangler(['r2', 'object', 'delete', `${BUCKET}/${key}`, '--remote'], { stdio: 'inherit' });
}

function assertRetentionDeleteKeyAllowed(key) {
  const normalized = stripSlashes(key);
  const allowedPrefix = `${PREFIX}/`;
  if (!normalized.startsWith(allowedPrefix)) {
    throw new Error(`Refusing retention delete outside ${allowedPrefix}: ${key}`);
  }
  if (protectedRetentionKeys.has(normalized)) {
    throw new Error(`Refusing retention delete of protected index object: ${key}`);
  }
  return normalized;
}

async function readPriorIndex(key) {
  try {
    wrangler(['r2', 'object', 'get', `${BUCKET}/${key}`, '--file', priorIndexPath, '--remote'], { attempts: 1 });
    return JSON.parse(readFileSync(priorIndexPath, 'utf8'));
  } catch (error) {
    return { backups: [] };
  }
}

async function collectTableCounts() {
  const tables = await d1Results(`
    SELECT name
    FROM sqlite_schema
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_cf_%'
    ORDER BY name
  `);
  const counts = {};
  for (const row of tables) {
    const tableName = String(row.name || '');
    if (!tableName) continue;
    const result = await d1Results(`SELECT COUNT(*) AS count FROM ${quoteSqlIdent(tableName)}`);
    counts[tableName] = Number(result[0]?.count || 0);
  }
  return counts;
}

async function d1Results(sql) {
  const raw = wrangler(['d1', 'execute', DATABASE, '--remote', '--json', '--command', sql]);
  const parsed = parseWranglerJson(raw);
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!first?.success) {
    throw new Error(`D1 query failed: ${sql.replace(/\s+/g, ' ').trim()}`);
  }
  return first.results || [];
}

function parseWranglerJson(raw) {
  const trimmed = String(raw || '').trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const start = trimmed.indexOf('[');
    const end = trimmed.lastIndexOf(']');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw error;
  }
}

function quoteSqlIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function planRetention(referenceDate, entries) {
  const cutoff = referenceDate.getTime() - RETENTION_DAYS * 86400000;
  const keep = [];
  const deleteKeys = [];
  const monthly = new Map();
  const sorted = [...entries].sort((a, b) => String(a.generated_at).localeCompare(String(b.generated_at)));

  for (const entry of sorted) {
    const generated = parseDateSafe(entry.generated_at) || objectKeyDate(entry.object_key);
    if (!generated || generated.getTime() >= cutoff) {
      keep.push(entry);
      continue;
    }
    const month = generated.toISOString().slice(0, 7);
    const preferred = Number(generated.toISOString().slice(8, 10)) === MONTHLY_KEEP_DAY;
    const current = monthly.get(month);
    if (!current || (preferred && !current.preferred)) {
      if (current) deleteKeys.push(...entryKeys(current.entry));
      monthly.set(month, { entry, preferred });
    } else {
      deleteKeys.push(...entryKeys(entry));
    }
  }

  for (const item of monthly.values()) {
    keep.push(item.entry);
  }
  return {
    keepEntries: keep,
    deleteKeys: [...new Set(deleteKeys)].sort(),
    keptMonthly: Array.from(monthly.values()).map((item) => item.entry.object_key).sort(),
  };
}

function entryKeys(entry) {
  return [entry.object_key, entry.manifest_key].filter(Boolean);
}

function runRetentionDeleteSelfTest() {
  const candidateKeys = [
    'd1/daily/2026-08-01/progress-d1-2026-08-01.sql',
    'd1/manual/m0807-66/progress-manual-backup.sql',
    `${PREFIX}/latest.json`,
    `${PREFIX}/index.json`,
    'audio/_sync/latest.json',
    'progress-audio/audio/female/en/sample.mp3',
    `${PREFIX}/2026-06-01/nice_analytics-d1-2026-06-01T00-00-00-000Z.sql`,
    `${PREFIX}/2026-06-01/manifest-2026-06-01T00-00-00-000Z.json`,
  ];
  const blocked = [];
  const allowed = [];
  for (const key of candidateKeys) {
    try {
      allowed.push(assertRetentionDeleteKeyAllowed(key));
    } catch (error) {
      blocked.push({
        key,
        reason: cleanError(error),
      });
    }
  }
  const summary = {
    ok: true,
    mode: 'retention-delete-self-test',
    bucket: BUCKET,
    required_prefix: `${PREFIX}/`,
    protected_keys: [...protectedRetentionKeys].sort(),
    blocked,
    allowed,
  };
  const requiredBlocked = [
    'd1/daily/2026-08-01/progress-d1-2026-08-01.sql',
    'd1/manual/m0807-66/progress-manual-backup.sql',
    `${PREFIX}/latest.json`,
    `${PREFIX}/index.json`,
    'audio/_sync/latest.json',
    'progress-audio/audio/female/en/sample.mp3',
  ];
  for (const key of requiredBlocked) {
    if (!blocked.some((item) => item.key === key)) {
      throw new Error(`Self-test failed: expected blocked key ${key}`);
    }
  }
  if (allowed.length !== 2) {
    throw new Error(`Self-test failed: expected 2 allowed keys, got ${allowed.length}`);
  }
  console.log(JSON.stringify(summary, null, 2));
}

function objectKeyDate(key) {
  const match = String(key).match(/\/(\d{4}-\d{2}-\d{2})\//);
  return match ? new Date(`${match[1]}T00:00:00.000Z`) : null;
}

function parseDateSafe(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cleanError(error) {
  return String(error?.message || error || '').replace(/https:\/\/\S+/g, '<redacted-url>').slice(0, 500);
}
