import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-auto";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const server = {
	port: 5268,
	strictPort: true,
	allowedHosts: ["huey.ckefgisc.org"]
};

export default defineConfig({
	server,
	preview: server,
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) => filename.split(/[/\\]/).includes("node_modules") ? undefined : true
			},
			adapter: adapter(),
			paths: {
				base: "/rap-visualizer"
			}
		})
	]
});
