import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import path from "node:path";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
	plugins: [
		devtoolsJson(),
		tanstackStart({
			srcDirectory: "src",
		}),
		nitro({
			output: { dir: path.join(import.meta.dirname, "dist") },
			preset: "bun",
		}),
		viteReact(),
		tailwindcss(),
	],
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		port: 3000,
	},
});
