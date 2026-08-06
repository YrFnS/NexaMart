import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDeploymentEnvironment,
  getRateLimitMode,
  getReleaseSha,
  isSearchIndexingAllowed,
} from './deployment.ts';

test('explicit staging environment wins and remains non-indexable', () => {
  const environment = {
    DEPLOYMENT_ENV: 'staging',
    VERCEL_ENV: 'production',
    NODE_ENV: 'production',
  };

  assert.equal(getDeploymentEnvironment(environment), 'staging');
  assert.equal(isSearchIndexingAllowed(environment), false);
});

test('only the production deployment is indexable', () => {
  assert.equal(
    isSearchIndexingAllowed({ NODE_ENV: 'production' }),
    true,
  );
  assert.equal(
    isSearchIndexingAllowed({ VERCEL_ENV: 'preview', NODE_ENV: 'production' }),
    false,
  );
});

test('production rate limiting requires both Redis REST credentials', () => {
  assert.equal(
    getRateLimitMode({ NODE_ENV: 'production' }),
    'unavailable',
  );
  assert.equal(
    getRateLimitMode({
      DEPLOYMENT_ENV: 'staging',
      NODE_ENV: 'production',
    }),
    'unavailable',
  );
  assert.equal(
    getRateLimitMode({
      NODE_ENV: 'production',
      RATE_LIMIT_ALLOW_MEMORY_FALLBACK: 'true',
    }),
    'memory-fallback',
  );
  assert.equal(
    getRateLimitMode({
      NODE_ENV: 'production',
      UPSTASH_REDIS_REST_URL: 'https://redis.example',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    }),
    'redis',
  );
});

test('release identity prefers an explicit deployment SHA', () => {
  assert.equal(
    getReleaseSha({
      RELEASE_SHA: 'explicit-release',
      VERCEL_GIT_COMMIT_SHA: 'vercel-release',
    }),
    'explicit-release',
  );
  assert.equal(getReleaseSha({}), null);
});
