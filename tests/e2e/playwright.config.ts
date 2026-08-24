import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../../");

export default defineConfig({
	testDir: ".",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 60_000,
	globalSetup: resolve(__dirname, "./global-setup.ts"),
	globalTeardown: resolve(__dirname, "./global-teardown.ts"),
	use: {
		baseURL: "http://localhost:5173",
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: {
				browserName: "chromium",
			},
		},
	],
	reporter: [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]],
	webServer: {
		command: 'bash -c "cd ' + repoRoot + ' && exec ./bin/dev-e2e"',
		// Vite is ready before Rails on a cold start. Waiting for the Rails health
		// endpoint prevents the first browser GraphQL request from racing Puma.
		url: "http://localhost:3000/up",
		reuseExistingServer: true,
		timeout: 60_000,
	},
});
