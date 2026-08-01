import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI
    ? [
        ['line'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ]
    : [['list']],
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    locale: 'en-US',
    timezoneId: 'Asia/Baghdad',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npx next start -H 127.0.0.1 -p 3000',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium-desktop',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      testMatch: /.*(public-smoke|rtl-mobile)\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'firefox-desktop',
      testMatch: /.*public-smoke\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
