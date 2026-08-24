import { tmpdir } from "os";
import { resolve, relative } from "path";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	readFileSync,
	writeFileSync,
	readdirSync,
} from "fs";
import { createHash } from "crypto";

export interface GuardMeta {
	backupDir: string;
	fixtureHashes: Record<string, string>;
}

export interface GuardState {
	backupDir: string;
	fixtureHashes: Record<string, string>;
	createdAt: string;
}

const FIXTURE_NAMES = ["e2e_group.json", "e2e_session.json"];
const STALE_MARKER = ".fixture-guard-active";
const STATE_DIR = resolve(tmpdir(), "opencode");
const STATE_FILE = resolve(STATE_DIR, ".fixture-guard-state.json");
const GUARD_PREFIX = "phase11-guard-";

function sha256(content: Buffer): string {
	return createHash("sha256").update(content).digest("hex");
}

/** Validate that a persisted backupDir is an expected child of STATE_DIR. */
function isValidBackupPath(candidate: string): boolean {
	try {
		const rel = relative(STATE_DIR, candidate);
		return !rel.startsWith("..") && !rel.startsWith("/") && rel.startsWith(GUARD_PREFIX);
	} catch {
		return false;
	}
}

export function removeGuardState(): void {
	try {
		if (existsSync(STATE_FILE)) rmSync(STATE_FILE);
	} catch {
		/* best-effort */
	}
}

function readGuardState(): GuardState | null {
	try {
		if (!existsSync(STATE_FILE)) return null;
		const raw = readFileSync(STATE_FILE, "utf-8");
		return JSON.parse(raw) as GuardState;
	} catch {
		return null;
	}
}

/**
 * Create a unique temporary backup of both fixture files using mkdtempSync
 * under the opencode state directory. Returns metadata for restore/verify.
 */
export function createFixtureBackup(fixturesDir: string): GuardMeta {
	mkdirSync(STATE_DIR, { recursive: true });
	const backupDir = mkdtempSync(resolve(STATE_DIR, GUARD_PREFIX));

	const fixtureHashes: Record<string, string> = {};

	for (const name of FIXTURE_NAMES) {
		const source = resolve(fixturesDir, name);
		const content = readFileSync(source);
		fixtureHashes[name] = sha256(content);
		copyFileSync(source, resolve(backupDir, name));
	}

	// Write stale marker so a crashed run can be recovered.
	writeFileSync(resolve(backupDir, STALE_MARKER), "");

	return { backupDir, fixtureHashes };
}

/**
 * Restore both fixture files from the backup. Safe to call on missing dir.
 */
export function restoreFixtureBackup(meta: GuardMeta, fixturesDir: string): void {
	if (!existsSync(meta.backupDir)) return;
	for (const name of FIXTURE_NAMES) {
		const backup = resolve(meta.backupDir, name);
		const dest = resolve(fixturesDir, name);
		if (existsSync(backup)) {
			copyFileSync(backup, dest);
		}
	}
}

/**
 * Verify that current fixture bytes match the backed-up hashes.
 */
export function verifyFixtureBytes(meta: GuardMeta, fixturesDir: string): boolean {
	for (const name of FIXTURE_NAMES) {
		const current = resolve(fixturesDir, name);
		if (!existsSync(current)) return false;
		const content = readFileSync(current);
		if (sha256(content) !== meta.fixtureHashes[name]) return false;
	}
	return true;
}

/**
 * Remove the backup directory and state file.
 * Only call this AFTER successful restore+verify so that failed recovery
 * still has backup evidence available.
 */
export function cleanupBackup(meta: GuardMeta): void {
	if (existsSync(meta.backupDir)) {
		rmSync(meta.backupDir, { recursive: true, force: true });
	}
}

/**
 * Persist backup metadata so global-teardown can find it.
 */
export function persistGuardMeta(meta: GuardMeta): void {
	const state: GuardState = {
		backupDir: meta.backupDir,
		fixtureHashes: meta.fixtureHashes,
		createdAt: new Date().toISOString(),
	};
	mkdirSync(STATE_DIR, { recursive: true });
	writeFileSync(STATE_FILE, JSON.stringify(state));
}

/**
 * Load and validate persisted backup metadata.
 * Returns null if no valid state file exists or the path is unsafe.
 */
export function loadGuardMeta(): GuardMeta | null {
	const state = readGuardState();
	if (!state) return null;
	if (!isValidBackupPath(state.backupDir)) {
		// Tampered or invalid path — remove corrupt state and bail.
		removeGuardState();
		return null;
	}
	if (!existsSync(state.backupDir)) {
		// Backup dir vanished — state is stale; remove it.
		removeGuardState();
		return null;
	}
	return { backupDir: state.backupDir, fixtureHashes: state.fixtureHashes };
}

/**
 * Full restore-verify cycle for teardown.
 *
 * IMPORTANT: cleanup (backup dir + state removal) happens ONLY after
 * verified success. If restore or verify fails we return false but
 * leave backup and state intact so a subsequent recovery attempt can
 * use the evidence.
 */
export function teardownGuard(fixturesDir: string): boolean {
	const meta = loadGuardMeta();
	if (!meta) return false;

	restoreFixtureBackup(meta, fixturesDir);
	const ok = verifyFixtureBytes(meta, fixturesDir);

	if (ok) {
		cleanupBackup(meta);
		removeGuardState();
	}
	// On failure: backup dir and state remain for manual recovery.
	return ok;
}

/**
 * Detect and recover from a stale backup.
 *
 * Strategy:
 *  1) If a valid guard state exists, use it as the active guard (prefer exact match).
 *  2) Otherwise, scan the state dir for orphaned marker directories.
 *  3) Clean up only safe stale metadata — never delete a backup that
 *     matches the active guard state unless verified.
 */
export function recoverStaleBackup(fixturesDir: string): GuardMeta | null {
	if (!existsSync(STATE_DIR)) return null;

	// 1. Try the active guard first.
	const state = readGuardState();
	if (state && isValidBackupPath(state.backupDir) && existsSync(state.backupDir)) {
		const meta: GuardMeta = {
			backupDir: state.backupDir,
			fixtureHashes: state.fixtureHashes,
		};
		restoreFixtureBackup(meta, fixturesDir);
		const ok = verifyFixtureBytes(meta, fixturesDir);
		if (ok) {
			cleanupBackup(meta);
			removeGuardState();
			return meta;
		}
		// Guard backup exists but verification failed — do NOT delete;
		// leave for diagnostic inspection.
		return null;
	}

	// 2. If state was invalid/missing, scan for orphaned markers.
	//    Only trust directories matching the phase11-guard-* prefix contract.
	const entries = readdirSync(STATE_DIR);
	for (const entry of entries) {
		const fullPath = resolve(STATE_DIR, entry);
		if (!isValidBackupPath(fullPath)) continue;
		const marker = resolve(fullPath, STALE_MARKER);
		if (!existsSync(marker)) continue;

		const fixtureHashes: Record<string, string> = {};
		let valid = true;
		for (const name of FIXTURE_NAMES) {
			const backup = resolve(fullPath, name);
			if (existsSync(backup)) {
				fixtureHashes[name] = sha256(readFileSync(backup));
			} else {
				valid = false;
			}
		}
		if (!valid) {
			// Incomplete orphan — clean up the garbage.
			rmSync(fullPath, { recursive: true, force: true });
			continue;
		}
		const meta: GuardMeta = { backupDir: fullPath, fixtureHashes };
		restoreFixtureBackup(meta, fixturesDir);
		if (verifyFixtureBytes(meta, fixturesDir)) {
			rmSync(fullPath, { recursive: true, force: true });
			removeGuardState();
			return meta;
		}
		// Orphan with data but bad parity — leave for manual inspection.
	}
	return null;
}
