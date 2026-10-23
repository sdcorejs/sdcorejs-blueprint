import { defineConfig, devices } from '@playwright/test';

// Standalone module suite: an external host supplies the running AOT consumer and API mocks.
export default defineConfig({
  testDir: '..', testMatch: '**/e2e/specs/**/*.e2e-spec.ts', fullyParallel: true, workers: 2,
  use: { ...devices['Desktop Chrome'], baseURL: process.env['BASE_URL'] ?? 'http://127.0.0.1:4317', trace: 'retain-on-failure' },
});
