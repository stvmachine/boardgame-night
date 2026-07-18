import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { existsSync } from 'fs'
import {
  recoverStaleBackup,
  createFixtureBackup,
  restoreFixtureBackup,
  verifyFixtureBytes,
  cleanupBackup,
  persistGuardMeta,
  removeGuardState,
  type GuardMeta
} from './fixture-guard'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '../../')
const fixturesDir = resolve(__dirname, 'fixtures')

let guardMeta: GuardMeta | null = null

/**
 * Attempt a single idempotent restore/verify/cleanup pass.
 * On failure the backup and state are preserved for later recovery.
 * Always sets guardMeta = null to prevent re-entry.
 */
function attemptRestore() {
  const meta = guardMeta
  guardMeta = null
  if (!meta || !existsSync(meta.backupDir)) return
  try {
    restoreFixtureBackup(meta, fixturesDir)
    if (verifyFixtureBytes(meta, fixturesDir)) {
      cleanupBackup(meta)
      removeGuardState()
    }
    // On verify failure: backup/state remain for recovery.
  } catch {
    // best-effort
  }
}

export default function globalSetup(): () => void {
  // 1. Recover any stale backup from a previous interrupted run.
  recoverStaleBackup(fixturesDir)

  // 2. Create a fresh byte-level backup before the deterministic seed mutates fixtures.
  guardMeta = createFixtureBackup(fixturesDir)

  // 3. Persist metadata for global-teardown to find.
  persistGuardMeta(guardMeta)

  try {
    execSync('bin/e2e-seed', {
      cwd: repoRoot,
      stdio: 'inherit',
      env: { ...process.env, DISABLE_SPRING: '1' }
    })
  } catch (err) {
    // 4. Seed failure: restore, verify, then clean up state only after verified success.
    attemptRestore()
    throw err
  }

  // 5. One-shot signal handlers: attempt restore then re-raise the original signal.
  //    The `exit` event is best-effort (no way to prevent shutdown).
  process.on('exit', attemptRestore)
  const signalHandler = (signal: string) => {
    process.removeListener(signal, signalHandler)
    attemptRestore()
    process.kill(process.pid, signal)
  }
  process.once('SIGINT', () => signalHandler('SIGINT'))
  process.once('SIGTERM', () => signalHandler('SIGTERM'))
  process.once('SIGHUP', () => signalHandler('SIGHUP'))

  // 6. Return a no-op teardown so the old-style return function does not compete.
  //    globalTeardown is the authoritative restoration path.
  return () => {}
}
