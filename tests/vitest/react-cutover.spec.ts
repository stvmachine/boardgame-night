import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..", "..");
const EXCLUDED_DIRS = new Set([
	".git",
	".planning",
	"node_modules",
	"board-game-night",
	"public",
	"public-test",
	"tmp",
	"log",
	"storage",
	"coverage",
]);

function walk(dir: string, callback: (file: string) => void) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const st = statSync(full);
		if (st.isDirectory()) {
			if (EXCLUDED_DIRS.has(entry)) continue;
			walk(full, callback);
		} else if (st.isFile()) {
			callback(full);
		}
	}
}

function readRoot(file: string) {
	return readFileSync(join(ROOT, file), "utf-8");
}

describe("React-only cutover guard", () => {
	it("has no .vue source files in the root production project", () => {
		const vueFiles: string[] = [];
		walk(ROOT, (file) => {
			if (file.endsWith(".vue")) {
				vueFiles.push(file.replace(ROOT + "/", ""));
			}
		});
		expect(vueFiles).toEqual([]);
	});

	it("uses React Vite entrypoint (main.tsx)", () => {
		const main = readRoot("app/frontend/entrypoints/main.tsx");
		expect(main).toContain("createRoot");
		expect(main).not.toContain("createApp");
		expect(main).not.toContain("Vue");
	});

	it("declares concrete React routes for every required page", () => {
		const app = readRoot("app/frontend/App.tsx");
		const routes = [
			{ path: "/", name: "Home" },
			{ path: "/collection", name: "Collection" },
			{ path: "/hot", name: "Hot" },
			{ path: "/groups", name: "Groups" },
			{ path: "/g/:token/sessions", name: "Group history" },
			{ path: "/s/:id", name: "Session" },
			{ path: "/invite/:token", name: "Invite" },
			{ path: "/login", name: "Auth login" },
			{ path: "/signup", name: "Auth signup" },
			{ path: "/account", name: "Account" },
		];
		for (const route of routes) {
			expect(app, `missing route for ${route.name}`).toContain(`path="${route.path}"`);
		}
	});

	it("has no Vue runtime or compiler packages in root package.json", () => {
		const pkg = JSON.parse(readRoot("package.json"));
		const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
		const vueTokens = Object.keys(allDeps).filter((name) =>
			/^(vue|@vue\/|vue-tsc|@vitejs\/plugin-vue)/i.test(name),
		);
		expect(vueTokens).toEqual([]);
	});

	it("uses React Apollo codegen plugin, not Vue Apollo", () => {
		const codegen = readRoot("codegen.ts");
		expect(codegen).toContain("typescript-react-apollo");
		expect(codegen).not.toContain("typescript-vue-apollo");
	});

	it("does not import the historical board-game-night directory", () => {
		const viteConfig = readRoot("vite.config.ts");
		const pkgScripts = JSON.parse(readRoot("package.json")).scripts;
		const dockerfile = readRoot("Dockerfile");
		const viteJson = readRoot("config/vite.json");

		const combined = [viteConfig, JSON.stringify(pkgScripts), dockerfile, viteJson].join("\n");

		expect(combined).not.toContain("board-game-night");
	});
});
