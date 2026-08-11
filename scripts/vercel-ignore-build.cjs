const branch = String(process.env.VERCEL_GIT_COMMIT_REF || '').trim();
const ignoredPrefixes = ['agent/', 'integration/', 'refactor/'];
const shouldIgnore =
  branch.length > 0 &&
  ignoredPrefixes.some((prefix) => branch.startsWith(prefix));

if (shouldIgnore) {
  console.log(`Skipping automatic Vercel build for internal branch: ${branch}`);
  process.exit(0);
}

if (!branch) {
  console.log(
    'VERCEL_GIT_COMMIT_REF is unavailable; continuing the deployment fail-open.',
  );
} else {
  console.log(`Continuing Vercel build for branch: ${branch}`);
}

process.exit(1);
