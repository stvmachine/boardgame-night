import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '../../')

const fixturesDir = resolve(__dirname, 'fixtures')
const backupDir = '/var/folders/yr/v0ygzpgd79b5pr9vlt83fswc0000gn/T/opencode/phase10-picking'
const fixtureNames = ['e2e_group.json', 'e2e_session.json']

export default function globalSetup() {
  mkdirSync(backupDir, { recursive: true })

  for (const name of fixtureNames) {
    const source = resolve(fixturesDir, name)
    const backup = resolve(backupDir, name)
    copyFileSync(source, backup)
  }

  execSync('bin/e2e-seed', {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, DISABLE_SPRING: '1' }
  })

  return function restoreFixtures() {
    for (const name of fixtureNames) {
      const source = resolve(backupDir, name)
      const dest = resolve(fixturesDir, name)
      if (existsSync(source)) {
        copyFileSync(source, dest)
      }
    }
  }
}
