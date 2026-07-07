import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '../../')

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  retries: 0,
  globalSetup: resolve(__dirname, './global-setup.ts'),
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'bash -c "cd ' + repoRoot + ' && exec ./bin/dev-e2e"',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000
  }
})
