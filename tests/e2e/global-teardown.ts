import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { teardownGuard } from './fixture-guard'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixturesDir = resolve(__dirname, 'fixtures')

/**
 * Repository-owned global teardown for Playwright.
 *
 * Restores both fixture files from the unique temporary backup created by
 * global-setup, verifies SHA-256 byte equality, and removes the backup
 * directory and shared state file only after verified success.
 *
 * This runs unconditionally after every suite regardless of pass/fail.
 * If no valid guard exists or verification fails, this throws to make
 * fixture integrity failures visible rather than silently logging.
 *
 * A missing guard is treated as an integrity failure. Playwright should invoke
 * this configured teardown exactly once; process-exit restoration is a separate
 * best-effort fallback for interrupted runs.
 */
export default function globalTeardown(): void {
  const ok = teardownGuard(fixturesDir)
  if (!ok) {
    throw new Error(
      'fixture-guard teardown failed: could not restore and verify fixture bytes. ' +
      'This may mean no guard state existed (already cleaned up, or setup never ran), ' +
      'or that restored bytes did not match the original backup hashes. ' +
      'Check test-results/ for diagnostic screenshots/traces and the guard backup ' +
      'directory under os.tmpdir()/opencode/ for recovery evidence.'
    )
  }
}
