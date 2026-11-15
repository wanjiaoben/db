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
assert.equal(valid.releaseTarget, 'both');
for (const [suffix, annotation, expected] of [
  ['analytics', 'Release-Target: analytics-only', 'analytics-only'],
  ['both', 'Release-Target: both', 'both'],
]) {
  const tagName = 'worker-prod-scope-' + suffix;
  git(cwd, ['tag', '-a', tagName, '-m', 'Wan-Verified: yes\n' + annotation]);
  const outputFile = path.join(cwd, suffix + '.output');
  const actual = verifyReleaseRef({ cwd, tagName, outputFile, fetchRemote: false });
  assert.equal(actual.releaseTarget, expected);
  assert.match(fs.readFileSync(outputFile, 'utf8'), new RegExp('target=' + expected + '\\n'));
}
for (const [suffix, annotation] of [
  ['unknown', 'Release-Target: private-only'],
  ['duplicate', 'Release-Target: analytics-only\nRelease-Target: both'],
]) {
  const tagName = 'worker-prod-bad-' + suffix;
  git(cwd, ['tag', '-a', tagName, '-m', 'Wan-Verified: yes\n' + annotation]);
  assert.throws(() => verifyReleaseRef({ cwd, tagName, fetchRemote: false }), /Release-Target/);
}


fs.writeFileSync(path.join(cwd, 'fixture.txt'), 'off-main\n');
git(cwd, ['add', 'fixture.txt']);
git(cwd, ['commit', '-qm', 'off-main fixture']);
git(cwd, ['tag', '-a', 'worker-prod-off-main', '-m', 'DB Workers release\n\nWan-Verified: yes']);
assert.throws(
  () => verifyReleaseRef({ cwd, tagName: 'worker-prod-off-main', fetchRemote: false }),
  /contained in origin\/main/
);

console.log('PASS release ref tests: no tag, lightweight, unverified, and off-main rejected; valid tag accepted');
