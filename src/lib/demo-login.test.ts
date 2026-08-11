import assert from 'node:assert/strict';
import test from 'node:test';
import { isDemoLoginEnabled, isProductionRuntime } from './demo-login.ts';

test('production runtime is detected from hosting or Node metadata', () => {
  assert.equal(
    isProductionRuntime({ VERCEL_ENV: 'production', NODE_ENV: 'production' }),
    true,
  );
  assert.equal(
    isProductionRuntime({ DEPLOYMENT_ENV: 'production', NODE_ENV: 'development' }),
    true,
  );
  assert.equal(isProductionRuntime({ NODE_ENV: 'production' }), true);
  assert.equal(
    isProductionRuntime({ VERCEL_ENV: 'preview', NODE_ENV: 'production' }),
    false,
  );
  assert.equal(
    isProductionRuntime({ DEPLOYMENT_ENV: 'staging', NODE_ENV: 'production' }),
    false,
  );
});

test('demo login fails closed in every production runtime', () => {
  assert.equal(
    isDemoLoginEnabled({
      VERCEL_ENV: 'production',
      NODE_ENV: 'production',
      ENABLE_DEMO_LOGIN: 'true',
    }),
    false,
  );
  assert.equal(
    isDemoLoginEnabled({
      DEPLOYMENT_ENV: 'production',
      NODE_ENV: 'development',
      ENABLE_DEMO_LOGIN: 'true',
    }),
    false,
  );
  assert.equal(
    isDemoLoginEnabled({
      NODE_ENV: 'production',
      ENABLE_DEMO_LOGIN: 'true',
    }),
    false,
  );
});

test('preview, staging, and local development can still opt into demos', () => {
  assert.equal(
    isDemoLoginEnabled({
      VERCEL_ENV: 'preview',
      NODE_ENV: 'production',
    }),
    true,
  );
  assert.equal(
    isDemoLoginEnabled({
      DEPLOYMENT_ENV: 'staging',
      NODE_ENV: 'production',
      ENABLE_DEMO_LOGIN: 'true',
    }),
    true,
  );
  assert.equal(
    isDemoLoginEnabled({
      DEPLOYMENT_ENV: 'staging',
      NODE_ENV: 'production',
      ENABLE_DEMO_LOGIN: 'false',
    }),
    false,
  );
  assert.equal(
    isDemoLoginEnabled({ NODE_ENV: 'development' }),
    true,
  );
});
