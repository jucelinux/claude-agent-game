import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './scripts/visual',
  testMatch: 'capture-review.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  outputDir: './test-results/visual-review-capture',
  use: {
    baseURL: 'http://127.0.0.1:5187',
    headless: true,
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: 'npm run dev:test',
    url: 'http://127.0.0.1:5187',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
