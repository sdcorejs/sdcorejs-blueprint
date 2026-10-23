import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testMatch: '**/e2e/specs/**/*.e2e-spec.ts',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4317', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'portal-chromium', testDir: './e2e', use: { ...devices['Desktop Chrome'] } },
    { name: 'mdm-chromium', testDir: './src/modules/mdm', use: { ...devices['Desktop Chrome'] } },
    { name: 'mdm-mobile', testDir: './src/modules/mdm', testMatch: '**/responsive.e2e-spec.ts', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4317', reuseExistingServer: false },
});
