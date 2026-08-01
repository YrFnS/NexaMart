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
