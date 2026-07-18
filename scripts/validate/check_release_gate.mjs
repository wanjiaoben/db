import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const workflowPath = '.github/workflows/atomic-release.yml';
const verifierPath = 'scripts/release/verify-release-ref.mjs';

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function walk(directory, matches = []) {
  if (!fs.existsSync(directory)) return matches;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'node_modules'].includes(entry.name)) walk(full, matches);
    } else {
      matches.push(full);
    }
  }
  return matches;
}

if (!fs.existsSync(path.join(root, workflowPath))) {
  fail(`${workflowPath} missing`);
} else {
  const workflow = read(workflowPath);
  for (const required of [
    'workflow_dispatch:',
    'release_ref:',
    'tags:',
    'worker-prod-*',
    'environment:',
    'production-worker',
    'DB_RELEASE_TAG:',
    "github.event_name == 'workflow_dispatch' && inputs.release_ref || github.ref_name",
    'scripts/release/verify-release-ref.mjs',
    'secrets.CLOUDFLARE_API_TOKEN',
    'working-directory: analytics-worker',
    'working-directory: private-worker',
    'wrangler@4.112.0 deploy',
  ]) {
    if (!workflow.includes(required)) fail(`${workflowPath} missing ${required}`);
  }

  const verifyIndex = workflow.indexOf('run: node scripts/release/verify-release-ref.mjs');
  const secretIndex = workflow.indexOf('name: Require Cloudflare deploy secret');
  const analyticsIndex = workflow.indexOf('name: Deploy nice-analytics');
  const privateIndex = workflow.indexOf('name: Deploy db-private');
  if (!(verifyIndex >= 0 && verifyIndex < secretIndex && secretIndex < analyticsIndex && analyticsIndex < privateIndex)) {
    fail('release order must be verify ref, require secret, deploy nice-analytics, then deploy db-private');
  }

  const cloudflareSecrets = [...workflow.matchAll(/secrets\.(CLOUDFLARE_[A-Z0-9_]+)/g)].map((match) => match[1]);
  const unexpectedSecrets = cloudflareSecrets.filter((name) => name !== 'CLOUDFLARE_API_TOKEN');
  if (unexpectedSecrets.length) {
    fail(`unexpected Cloudflare secret names: ${[...new Set(unexpectedSecrets)].join(', ')}`);
  }
}

if (!fs.existsSync(path.join(root, verifierPath))) {
  fail(`${verifierPath} missing`);
} else {
  const verifier = read(verifierPath);
  for (const required of [
    'worker-prod-',
    'annotated tag',
    'Wan-Verified: yes',
    'merge-base',
    'origin/main',
  ]) {
    if (!verifier.includes(required)) fail(`${verifierPath} missing ${required}`);
  }
}

for (const file of walk(path.join(root, '.github', 'workflows'))) {
  const relative = path.relative(root, file);
  const content = fs.readFileSync(file, 'utf8');
  if (relative !== workflowPath && /\bwrangler(?:@[0-9.]+)?\s+deploy\b/.test(content)) {
    fail(`${relative} must not deploy a Worker; ${workflowPath} is the only production entry`);
  }
}

for (const file of walk(root).filter((item) => path.basename(item) === 'package.json')) {
  const relative = path.relative(root, file);
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
    if (/\bwrangler(?:@[0-9.]+)?\s+deploy\b/.test(command)) {
      fail(`${relative} script ${name} must not expose a direct Worker deploy path`);
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL release gate: ${failure}`);
  process.exit(1);
}

console.log('PASS release gate: one validated entry deploys nice-analytics then db-private');
