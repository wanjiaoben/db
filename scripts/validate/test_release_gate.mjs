import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { verifyReleaseRef } from '../release/verify-release-ref.mjs';

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', shell: false });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'db-release-gate-'));
git(cwd, ['init', '-q']);
git(cwd, ['config', 'user.email', 'ci@example.invalid']);
git(cwd, ['config', 'user.name', 'DB Release Gate CI']);
fs.writeFileSync(path.join(cwd, 'fixture.txt'), 'main\n');
git(cwd, ['add', 'fixture.txt']);
git(cwd, ['commit', '-qm', 'main fixture']);
const mainCommit = git(cwd, ['rev-parse', 'HEAD']);
git(cwd, ['update-ref', 'refs/remotes/origin/main', mainCommit]);

assert.throws(
  () => verifyReleaseRef({ cwd, tagName: '', fetchRemote: false }),
  /worker-prod-\* tag/
);

git(cwd, ['tag', 'worker-prod-lightweight']);
assert.throws(
  () => verifyReleaseRef({ cwd, tagName: 'worker-prod-lightweight', fetchRemote: false }),
  /annotated tag/
);

git(cwd, ['tag', '-a', 'worker-prod-unverified', '-m', 'release without approval']);
assert.throws(
  () => verifyReleaseRef({ cwd, tagName: 'worker-prod-unverified', fetchRemote: false }),
  /Wan-Verified: yes/
);

git(cwd, ['tag', '-a', 'worker-prod-valid', '-m', 'DB Workers release\n\nWan-Verified: yes']);
const valid = verifyReleaseRef({ cwd, tagName: 'worker-prod-valid', fetchRemote: false });
assert.equal(valid.tagCommit, mainCommit);

fs.writeFileSync(path.join(cwd, 'fixture.txt'), 'off-main\n');
git(cwd, ['add', 'fixture.txt']);
git(cwd, ['commit', '-qm', 'off-main fixture']);
git(cwd, ['tag', '-a', 'worker-prod-off-main', '-m', 'DB Workers release\n\nWan-Verified: yes']);
assert.throws(
  () => verifyReleaseRef({ cwd, tagName: 'worker-prod-off-main', fetchRemote: false }),
  /contained in origin\/main/
);

console.log('PASS release ref tests: no tag, lightweight, unverified, and off-main rejected; valid tag accepted');
