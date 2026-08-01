import { defineConfig, devices } from '@playwright/test';

const rawBaseUrl =
  process.env.STAGING_BASE_URL?.trim() ||
  process.env.PLAYWRIGHT_BASE_URL?.trim();
if (!rawBaseUrl) {
  throw new Error('STAGING_BASE_URL is required for staging browser checks.');
}

const stagingUrl = new URL(rawBaseUrl);
if (
  stagingUrl.protocol !== 'https:' &&
  process.env.STAGING_ALLOW_HTTP !== 'true'
) {
  throw new Error('Staging browser checks require HTTPS.');
}
stagingUrl.pathname = '/';
stagingUrl.search = '';
stagingUrl.hash = '';
const baseURL = stagingUrl.origin;

const authHeaderName = process.env.STAGING_AUTH_HEADER_NAME?.trim();
const authHeaderValue = process.env.STAGING_AUTH_HEADER_VALUE?.trim();
if (Boolean(authHeaderName) !== Boolean(authHeaderValue)) {
  throw new Error(
    'STAGING_AUTH_HEADER_NAME and STAGING_AUTH_HEADER_VALUE must be configured together.',
  );
}
if (
  /\r|\n/.test(authHeaderName || '') ||
  /\r|\n/.test(authHeaderValue || '')
) {
  throw new Error('Staging authentication headers cannot contain newlines.');
}
const extraHTTPHeaders =
  authHeaderName && authHeaderValue
    ? { [authHeaderName]: authHeaderValue }
    : undefined;

export default defineConfig({
  testDir: './e2e',
  testMatch: /staging-deployment\.spec\.ts/,
  outputDir: 'staging-test-results/playwright',
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ['line'],
    [
      'html',
      {
        outputFolder: 'staging-playwright-report',
        open: 'never',
      },
    ],
  ],
  use: {
    baseURL,
    extraHTTPHeaders,
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    locale: 'en-US',
    timezoneId: 'Asia/Baghdad',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'staging-chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'staging-chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'staging-firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
