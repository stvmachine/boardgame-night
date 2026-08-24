import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixture = JSON.parse(readFileSync(resolve(__dirname, "fixtures", "e2e_group.json"), "utf-8"));

async function signIn(page: Page, email: string, password: string) {
	await page.goto("/login");
	await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 });
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Log in" }).click();
	await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 });
}

const NEW_USER = {
	username: `e2e_flow_${Date.now()}`,
	email: `e2e_flow_${Date.now()}@example.com`,
	password: "password123",
};

// ── Test 1: Signup → create group → verify group page ──────────────────────
// A brand-new user has no BGG collection, so we only verify the signup and
// group creation path (no session picking — that requires games in the DB).
test.describe("signup flow", () => {
	test("signup → create group → verify group page", async ({ page }) => {
		// 1. Sign up a fresh user
		await page.goto("/signup");
		await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 });
		await page.getByLabel("Name", { exact: true }).fill(NEW_USER.username);
		await page.getByLabel("Email").fill(NEW_USER.email);
		await page.getByLabel("Password").fill(NEW_USER.password);
		await page.getByLabel("BoardGameGeek username", { exact: true }).fill(NEW_USER.username);
		await page.getByRole("button", { name: "Create account" }).click();
		await page.waitForURL(/^(?!.*\/signup).*$/, { timeout: 30_000 });

		// 2. Should land on collection onboarding page
		await expect(page).toHaveURL("/collection", { timeout: 10_000 });

		// 3. Navigate to groups page and create a group
		await page.goto("/groups");
		await expect(page.getByRole("heading", { name: "Create a group" })).toBeVisible({
			timeout: 10_000,
		});
		await page.getByLabel("Group name").fill("E2E Flow Test Group");
		await page.getByLabel("Description").fill("Automated E2E test group");
		await page.getByRole("button", { name: "Create group" }).click();

		// 4. Should redirect to the new group page
		await expect(page.getByRole("heading", { name: "E2E Flow Test Group" })).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByText("1 members")).toBeVisible();
		await expect(page.getByText("Automated E2E test group")).toBeVisible();
	});
});

// ── Test 2: Create session → schedule → start picking ──────────────────────
// Creates a new session via the UI. A brand-new session has no attendees, so
// suggestions won't appear until someone RSVPs. This test validates the
// creation/scheduling/state-machine flow without asserting game suggestions.
test.describe("create and schedule session", () => {
	test("create session → schedule → start picking", async ({ page }) => {
		// 1. Sign in as the seeded owner
		await signIn(page, fixture.owner_email, "password");

		// 2. Navigate to the seeded group
		await page.goto(`/g/${fixture.invite_code}`);
		await expect(page.getByRole("heading", { name: "e2e Night Owls", exact: true })).toBeVisible({
			timeout: 10_000,
		});

		// 3. Create a night session (two responsive buttons — desktop + mobile)
		await page.getByRole("button", { name: "Create a night" }).first().click();

		// 4. Should redirect to the session page (DRAFT state)
		//    Title defaults to "${groupName} game night" from createNightSession
		const defaultTitle = "e2e Night Owls game night";
		await expect(page.getByText("DRAFT", { exact: true })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText(/Hosted by/)).toBeVisible();

		// 5. Fill in session details and schedule
		await page.getByLabel("Location").fill("Test Location");
		await page.getByLabel("Capacity").fill("4");
		await page.getByRole("button", { name: "Schedule & send invites" }).click();

		// 6. Should transition to INVITED state
		await expect(page.getByText("INVITED")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole("heading", { name: defaultTitle })).toBeVisible();

		// 7. Start picking (as host) — no suggestions yet since no attendees RSVPed
		await page.getByRole("button", { name: "Start picking" }).click();
		await expect(page.getByText("PICKING", { exact: true })).toBeVisible({ timeout: 10_000 });

		// 8. GamePicker should render but show empty state (0 attendees → no suggestions)
		await expect(page.getByText("No confirmed players yet")).toBeVisible({ timeout: 10_000 });
	});
});

// ── Test 3: Seeded picking session → pick game → complete ──────────────────
// Uses the seeded picking session (e2e_alice is host, e2e_bob RSVPed, both
// have BGG collection items) to exercise the game-picking flow end-to-end.
test.describe("pick game from seeded session", () => {
	test("open picking session → pick game → verify complete", async ({ page }) => {
		// 1. Sign in as the seeded owner
		await signIn(page, fixture.owner_email, "password");

		// 2. Navigate directly to the seeded picking session
		const pickingId = fixture.session_ids.picking;
		await page.goto(`/s/${pickingId}`);

		// 3. Should show PICKING state with suggestions (alice+bob have collection items)
		await expect(page.getByText("PICKING", { exact: true })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole("heading", { name: /Game Suggestions/ })).toBeVisible({
			timeout: 10_000,
		});

		// 4. Pick the first suggested game
		const firstPickButton = page.getByRole("button", { name: "Pick this game" }).first();
		await expect(firstPickButton).toBeVisible({ timeout: 10_000 });
		await firstPickButton.click();

		// 5. Should transition to COMPLETED state
		await expect(page.getByText("COMPLETED")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Picked game")).toBeVisible();
	});
});

// ── Test 3: Seeded user → view group → past sessions ───────────────────────
test.describe("past sessions (seeded user)", () => {
	test("sign in → view group → view past sessions", async ({ page }) => {
		// 1. Sign in with seeded user
		await signIn(page, fixture.owner_email, "password");

		// 2. Navigate to group
		await page.goto(`/g/${fixture.invite_code}`);
		await expect(page.getByRole("heading", { name: "e2e Night Owls", exact: true })).toBeVisible({
			timeout: 10_000,
		});

		// 3. Verify group detail sections are visible
		await expect(page.getByText("Members").first()).toBeVisible();
		await expect(page.getByText("Invite people").first()).toBeVisible();
		await expect(page.getByText("Shared collection spotlight").first()).toBeVisible();
		await expect(page.getByText("Browse Library")).toBeVisible();

		// 4. Navigate to past sessions page
		await page.getByRole("link", { name: "View all" }).click();
		await expect(page).toHaveURL(new RegExp(`/g/${fixture.invite_code}/sessions`), {
			timeout: 10_000,
		});

		// 5. Should show completed and cancelled sessions
		await expect(page.getByText("e2e Completed Night")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("e2e Cancelled Night")).toBeVisible();
	});
});
