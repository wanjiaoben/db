#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dbRepo = path.resolve(process.env.DB_REPO || path.join(scriptDir, '..'));
const python = process.env.PYTHON_BIN || 'python3';

execFileSync(python, [path.join(scriptDir, 'content_stats.py'), '--no-push'], {
  cwd: dbRepo,
  env: { ...process.env, DB_REPO: dbRepo },
  stdio: 'inherit'
});
