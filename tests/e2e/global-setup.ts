import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '../../')

export default function globalSetup() {
  execSync('bin/e2e-seed', {
    cwd: repoRoot,
    stdio: 'inherit'
  })
}
