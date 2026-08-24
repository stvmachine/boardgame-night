import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password: string) {
	await page.goto("/login");
	await page.waitForSelector('label:has-text("Email")', { timeout: 10_000 });
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Log in" }).click();
	await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 30_000 });
}

test("desktop top nav shows logo, nav items, and logout", async ({ page }) => {
	await signIn(page, "e2e_alice@example.com", "password");
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto("/");

	const nav = page.getByRole("navigation", { name: "Main" });
	await expect(nav).toBeVisible();
	await expect(nav.getByRole("link", { name: "BoardGameNight" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Collection", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Groups", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Account", exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeVisible();
});

test("clicking Collection nav item navigates to /collection", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto("/");

	await page.getByRole("link", { name: "Collection", exact: true }).click();

	await expect(page).toHaveURL("/collection");
});

test("mobile hides desktop links and opens menu from hamburger toggle", async ({ page }) => {
	await signIn(page, "e2e_alice@example.com", "password");
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto("/");

	await expect(page.getByTestId("mobile-menu")).toHaveCount(0);

	const toggle = page.getByRole("button", { name: "Open menu" });
	await expect(toggle).toBeVisible();

	await toggle.click();

	const mobileMenu = page.getByTestId("mobile-menu");
	await expect(mobileMenu).toBeVisible();
	await expect(mobileMenu.getByRole("link", { name: "Collection", exact: true })).toBeVisible();
	await expect(mobileMenu.getByRole("link", { name: "Groups", exact: true })).toBeVisible();
});

test("active nav item uses primary text color", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto("/collection");

	const collectionLink = page.getByRole("link", { name: "Collection", exact: true });
	await expect(collectionLink).toHaveClass(/text-primary/);
});
