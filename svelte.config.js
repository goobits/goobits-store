import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Preprocess .svelte files with Vite
	preprocess: vitePreprocess()
}

export default config
