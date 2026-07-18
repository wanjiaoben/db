import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function git(cwd, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', shell: false });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

export function verifyReleaseRef({ cwd = process.cwd(), tagName, outputFile, fetchRemote = true }) {
  if (!/^worker-prod-[A-Za-z0-9._-]+$/.test(tagName || '')) {
    throw new Error('Production release requires a worker-prod-* tag');
  }

  const tagRef = `refs/tags/${tagName}`;
  if (fetchRemote) git(cwd, ['fetch', '--force', 'origin', `${tagRef}:${tagRef}`]);
  const type = git(cwd, ['cat-file', '-t', tagRef]).stdout.trim();
  if (type !== 'tag') throw new Error('Production release requires an annotated tag');

  const annotation = git(cwd, ['for-each-ref', '--format=%(contents)', tagRef]).stdout;
  if (!annotation.split(/\r?\n/).includes('Wan-Verified: yes')) {
    throw new Error('Production release tag must contain: Wan-Verified: yes');
  }

  const tagCommit = git(cwd, ['rev-list', '-n', '1', tagRef]).stdout.trim();
  if (fetchRemote) git(cwd, ['fetch', 'origin', 'main']);
  const onMain = git(cwd, ['merge-base', '--is-ancestor', tagCommit, 'origin/main'], { allowFailure: true });
  if (onMain.status !== 0) {
    throw new Error('Production release tag must point to a commit contained in origin/main');
  }

  if (outputFile) appendFileSync(outputFile, `tag=${tagName}\ncommit=${tagCommit}\n`);
  return { tagName, tagCommit };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = verifyReleaseRef({
      tagName: process.env.DB_RELEASE_TAG,
      outputFile: process.env.GITHUB_OUTPUT
    });
    console.log(`RELEASE_REF_VERIFIED tag=${result.tagName} commit=${result.tagCommit}`);
  } catch (error) {
    console.error(`FAIL release ref gate: ${error.message}`);
    process.exit(1);
  }
}
