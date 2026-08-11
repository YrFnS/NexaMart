import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDeploymentEnvironment,
  getRateLimitMode,
  getReleaseSha,
  isDeploymentReady,
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

test('production uses Redis first and Postgres otherwise', () => {
  assert.equal(
    getRateLimitMode({ NODE_ENV: 'production' }),
    'unavailable',
  );
  assert.equal(
    getRateLimitMode({
      DEPLOYMENT_ENV: 'staging',
      NODE_ENV: 'production',
    }),
    'memory-fallback',
  );
  assert.equal(
    getRateLimitMode({
      VERCEL_ENV: 'preview',
      NODE_ENV: 'production',
    }),
    'memory-fallback',
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
      DATABASE_URL: 'postgresql://database.example/nexamart',
    }),
    'postgres',
  );
  assert.equal(
    getRateLimitMode({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://database.example/nexamart',
      UPSTASH_REDIS_REST_URL: 'https://redis.example',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    }),
    'redis',
  );
});

test('production readiness requires a shared rate limiter', () => {
  assert.equal(
    isDeploymentReady({
      DEPLOYMENT_ENV: 'production',
      NODE_ENV: 'production',
      RATE_LIMIT_ALLOW_MEMORY_FALLBACK: 'true',
    }),
    false,
  );
  assert.equal(
    isDeploymentReady({
      DEPLOYMENT_ENV: 'production',
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://database.example/nexamart',
    }),
    true,
  );
  assert.equal(
    isDeploymentReady({
      DEPLOYMENT_ENV: 'production',
      NODE_ENV: 'production',
      UPSTASH_REDIS_REST_URL: 'https://redis.example',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    }),
    true,
  );
  assert.equal(
    isDeploymentReady({
      DEPLOYMENT_ENV: 'staging',
      NODE_ENV: 'production',
    }),
    true,
  );
  assert.equal(
    isDeploymentReady({
      VERCEL_ENV: 'preview',
      NODE_ENV: 'production',
    }),
    true,
  );
});

test('release identity prefers the provider commit over stale manual metadata', () => {
  assert.equal(
    getReleaseSha({
      RELEASE_SHA: 'stale-explicit-release',
      VERCEL_GIT_COMMIT_SHA: 'vercel-release',
    }),
    'vercel-release',
  );
  assert.equal(
    getReleaseSha({ RELEASE_SHA: 'explicit-release' }),
    'explicit-release',
  );
  assert.equal(getReleaseSha({}), null);
});
