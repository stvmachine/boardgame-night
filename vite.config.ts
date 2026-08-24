import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import RubyPlugin from "vite-plugin-ruby";

export default defineConfig({
	plugins: [RubyPlugin(), react(), tailwindcss()],
	resolve: {
		alias: { "@": resolve(__dirname, "app/frontend") },
	},
	server: {
		port: 5173,
		proxy: {
			"/graphql": "http://localhost:3001",
			// REST authentication endpoints (authentication-zero, --api).
			"/sign_in": "http://localhost:3001",
			"/sign_up": "http://localhost:3001",
			"/sudo": "http://localhost:3001",
			"/password": "http://localhost:3001",
			"/sessions": "http://localhost:3001",
			"/identity": "http://localhost:3001",
			"/authentications": "http://localhost:3001",
			"/cable": {
				target: "http://localhost:3001",
				ws: true,
			},
		},
	},
});
