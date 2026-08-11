import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const scriptPath = path.join(
  repositoryRoot,
  'scripts',
  'vercel-ignore-build.cjs',
);

function runIgnoredBuildStep(branch?: string) {
  const environment = { ...process.env };
  if (branch === undefined) {
    delete environment.VERCEL_GIT_COMMIT_REF;
  } else {
    environment.VERCEL_GIT_COMMIT_REF = branch;
  }

  return spawnSync(process.execPath, [scriptPath], {
    cwd: repositoryRoot,
    env: environment,
    encoding: 'utf8',
  });
}

test('skips automatic Vercel builds for high-churn internal branches', () => {
  for (const branch of [
    'agent/security-fix',
    'integration/all-branches',
    'refactor/cleanup',
  ]) {
    const result = runIgnoredBuildStep(branch);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Skipping automatic Vercel build/);
  }
});

test('continues production, staging, release, and normal feature builds', () => {
  for (const branch of [
    'main',
    'staging',
    'release/2026-08',
    'feat/buyer-search',
  ]) {
    const result = runIgnoredBuildStep(branch);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /Continuing Vercel build/);
  }
});

test('fails open when Vercel does not provide a branch name', () => {
  const result = runIgnoredBuildStep();
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /continuing the deployment fail-open/i);
});
