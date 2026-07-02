import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'bin/dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000
  }
})
