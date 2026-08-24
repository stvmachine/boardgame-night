import { test, expect, type Page } from "@playwright/test";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../../");

let fixture: any;

async function signIn(page: Page, email: string, password: string) {
	await page.goto("/login");
	await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 });
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Log in" }).click();
	await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 });
}

test.beforeAll(() => {
	// Reseed before this file so earlier tests (e.g. full_user_flow) don't pollute the group.
	execSync("bin/e2e-seed", { cwd: repoRoot, stdio: "ignore" });
	// Read fixture after reseed so IDs match the freshly seeded database.
	fixture = JSON.parse(readFileSync(resolve(__dirname, "fixtures", "e2e_group.json"), "utf-8"));
});

test.describe("group detail", () => {
	test("owner sees header, ordered sessions, and can create a night", async ({ page }) => {
		const { invite_code: inviteCode, owner_email: ownerEmail, session_ids: sessionIds } = fixture;

		await signIn(page, ownerEmail, "password");
		await page.goto(`/g/${inviteCode}`);

		await expect(page.getByRole("heading", { name: "e2e Night Owls" })).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByText("End-to-end test group for the Night Owls")).toBeVisible();
		await expect(page.getByText("2 members")).toBeVisible();
		await expect(page.getByRole("button", { name: "Create a night" })).toBeVisible();

		const rows = page.getByTestId("session-row");
		await expect(rows).toHaveCount(3);
		await expect(rows.nth(0).getByText("e2e Picking Night")).toBeVisible();
		await expect(rows.nth(0).getByRole("button", { name: "Choose a game" })).toBeVisible();
		await expect(rows.nth(1).getByText("e2e Friday Games")).toBeVisible();
		await expect(rows.nth(1).getByRole("button", { name: "View details" })).toBeVisible();
		await expect(rows.nth(2).getByText("e2e Draft Night")).toBeVisible();
		await expect(rows.nth(2).getByText("Date")).toBeVisible();
		await expect(rows.nth(2).getByText("TBD")).toBeVisible();
		await expect(rows.nth(2).getByRole("button", { name: "View details" })).toBeVisible();

		await expect(page.getByText("e2e Completed Night")).not.toBeVisible();
		await expect(page.getByText("e2e Cancelled Night")).not.toBeVisible();

		await rows.nth(0).getByRole("button", { name: "Choose a game" }).click();
		await page.waitForURL(`/s/${sessionIds.picking}`, { timeout: 10_000 });
	});

	test("member sees sessions but cannot create a night or see drafts", async ({ page }) => {
		const { invite_code: inviteCode, member_email: memberEmail } = fixture;

		await signIn(page, memberEmail, "password");
		await page.goto(`/g/${inviteCode}`);

		await expect(page.getByRole("heading", { name: "e2e Night Owls" })).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByRole("button", { name: "Create a night" })).not.toBeVisible();

		const rows = page.getByTestId("session-row");
		await expect(rows).toHaveCount(2);
		await expect(rows.nth(0).getByText("e2e Picking Night")).toBeVisible();
		await expect(rows.nth(1).getByText("e2e Friday Games")).toBeVisible();
		await expect(page.getByText("e2e Draft Night")).not.toBeVisible();
	});

	test("owner sees Members card and manager-only Invite people card", async ({ page }) => {
		const { invite_code: inviteCode, owner_email: ownerEmail } = fixture;

		await signIn(page, ownerEmail, "password");
		await page.goto(`/g/${inviteCode}`);

		// Card titles are <div data-slot="card-title">, not heading elements
		await expect(page.getByText("Members").first()).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Invite people").first()).toBeVisible();

		// Spotlight and Browse Library link are visible
		await expect(page.getByText("Shared collection spotlight").first()).toBeVisible();
		await expect(page.getByText("Browse Library")).toBeVisible();
	});

	test("owner can copy invite link and see Copied! feedback", async ({ page }) => {
		const { invite_code: inviteCode, owner_email: ownerEmail } = fixture;

		// Grant clipboard write permission
		await page.context().grantPermissions(["clipboard-write"]);

		await signIn(page, ownerEmail, "password");
		await page.goto(`/g/${inviteCode}`);

		const copyButton = page.getByRole("button", { name: "Copy" });
		await expect(copyButton).toBeVisible();

		await copyButton.click();

		// Copied! should appear in the live region
		await expect(page.getByText("Copied!")).toBeVisible({ timeout: 5_000 });
	});

	test("mobile viewport shows Create a night and five sections", async ({ page }) => {
		const { invite_code: inviteCode, owner_email: ownerEmail } = fixture;

		await signIn(page, ownerEmail, "password");
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto(`/g/${inviteCode}`);

		await expect(page.getByRole("button", { name: "Create a night" })).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByRole("heading", { name: "e2e Night Owls", exact: true })).toBeVisible();
		await expect(page.getByText("Upcoming sessions")).toBeVisible();
		await expect(page.getByText("Shared collection spotlight")).toBeVisible();
		await expect(page.getByText("Members").first()).toBeVisible();
		await expect(page.getByText("Invite people").first()).toBeVisible();
	});
});
