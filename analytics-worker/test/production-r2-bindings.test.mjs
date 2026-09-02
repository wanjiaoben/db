import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

function quotedValue(line, key) {
  const match = line.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"\\s*$`));
  return match?.[1] || null;
}

/**
 * Extract only R2 bucket tables, keeping top-level and [env.preview] separate.
 * This intentionally does not grep the whole file: a preview-only declaration
 * must not satisfy the production contract.
 */
export function parseR2Bindings(toml) {
  const result = { production: {}, preview: {} };
  let scope = null;
  let binding = null;
  for (const line of toml.split(/\r?\n/)) {
    if (line.trim() === '[[r2_buckets]]') {
      scope = 'production';
      binding = null;
      continue;
    }
    if (line.trim() === '[[env.preview.r2_buckets]]') {
      scope = 'preview';
      binding = null;
      continue;
    }
    if (line.trim().startsWith('[') && !line.trim().startsWith('[[r2_buckets]]') && !line.trim().startsWith('[[env.preview.r2_buckets]]')) {
      scope = null;
      binding = null;
      continue;
    }
    if (!scope) continue;
    const parsedBinding = quotedValue(line, 'binding');
    if (parsedBinding) {
      binding = parsedBinding;
      result[scope][binding] = null;
      continue;
    }
    if (binding) {
      const bucket = quotedValue(line, 'bucket_name');
      if (bucket) result[scope][binding] = bucket;
    }
  }
  return result;
}

const configPath = fileURLToPath(new URL('../wrangler.toml', import.meta.url));

test('production and preview R2 bindings satisfy the isolated monitor contract', () => {
  const bindings = parseR2Bindings(readFileSync(configPath, 'utf8'));
  assert.equal(bindings.production.PROGRESS_BACKUP, 'progress-backup');
  assert.equal(bindings.production.PROGRESS_DB_BACKUP, 'progress-db-backup');
  assert.equal(bindings.production.PROGRESS_BACKUP_PREVIEW, 'progress-backup-preview');
  assert.equal(bindings.preview.PROGRESS_BACKUP, 'progress-backup');
  assert.equal(bindings.preview.PROGRESS_DB_BACKUP, 'progress-db-backup-preview');
  assert.equal(bindings.preview.PROGRESS_BACKUP_PREVIEW, 'progress-backup-preview');
});

test('preview-only PROGRESS_BACKUP_PREVIEW does not satisfy production', () => {
  const previewOnly = `
[[r2_buckets]]
binding = "PROGRESS_BACKUP"
bucket_name = "progress-backup"

[[env.preview.r2_buckets]]
binding = "PROGRESS_BACKUP_PREVIEW"
bucket_name = "progress-backup-preview"
`;
  const bindings = parseR2Bindings(previewOnly);
  assert.equal(bindings.production.PROGRESS_BACKUP_PREVIEW, undefined);
});
