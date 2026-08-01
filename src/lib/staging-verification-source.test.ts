import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('deployment health and indexing policy remain staging-aware', () => {
  const deployment = source('src/lib/deployment.ts');
  const health = source('src/app/api/health/route.ts');
  const robots = source('src/app/robots.ts');

  assert.match(deployment, /DEPLOYMENT_ENV/);
  assert.match(deployment, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(deployment, /UPSTASH_REDIS_REST_URL/);
  assert.match(deployment, /memory-fallback/);
  assert.match(deployment, /isSearchIndexingAllowed/);

  assert.match(health, /SELECT 1/);
  assert.match(health, /Cache-Control/);
  assert.match(health, /no-store/);
  assert.match(health, /status: ready \? 200 : 503/);
  assert.match(health, /release: \{ sha: releaseSha \}/);
  assert.match(health, /rateLimit/);

  assert.match(robots, /isSearchIndexingAllowed/);
  assert.match(robots, /disallow: '\/'/);
});

test('staging verification is read-only and retains browser evidence', () => {
  const verifier = source('scripts/verify-staging-deployment.ts');
  const config = source('playwright.staging.config.ts');
  const browser = source('e2e/staging-deployment.spec.ts');

  assert.match(verifier, /EXPECTED_RELEASE_SHA/);
  assert.match(verifier, /STAGING_REQUIRE_REDIS/);
  assert.match(verifier, /STAGING_EXPECT_NOINDEX/);
  assert.match(verifier, /x-content-type-options/);
  assert.match(verifier, /staging-test-results/);
  assert.match(verifier, /STAGING_AUTH_HEADER_NAME/);

  assert.match(config, /staging-deployment/);
  assert.match(config, /extraHTTPHeaders/);
  assert.match(config, /staging-chromium-mobile/);
  assert.match(config, /staging-firefox-desktop/);
  assert.doesNotMatch(config, /webServer\s*:/);

  assert.match(browser, /page\.request\.get/);
  assert.match(browser, /expectNoSeriousAccessibilityViolations/);
  assert.match(browser, /page\.screenshot/);
  assert.match(browser, /runtime-metrics/);
  assert.match(browser, /nexamart_locale/);
  assert.doesNotMatch(
    browser,
    /method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i,
  );
});

test('staging workflow and manual sign-off remain connected', () => {
  const workflow = source('.github/workflows/staging-verification.yml');
  const checklist = source('docs/STAGING_RELEASE_CHECKLIST.md');

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /vars\.STAGING_BASE_URL/);
  assert.match(workflow, /head\.repo\.full_name == github\.repository/);
  assert.match(workflow, /EXPECTED_RELEASE_SHA/);
  assert.match(workflow, /scripts\/verify-staging-deployment\.ts/);
  assert.match(workflow, /playwright\.staging\.config\.ts/);
  assert.match(workflow, /staging-evidence/);

  assert.match(checklist, /Physical-print sign-off/);
  assert.match(checklist, /Real assistive-technology sign-off/);
  assert.match(checklist, /Scheduled order expiration/);
  assert.match(checklist, /PostgreSQL behavior/);
  assert.match(checklist, /Launch-scope decision/);
});
