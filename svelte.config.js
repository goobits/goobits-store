import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = process.env.SVELTE_PACKAGE_NO_PREPROCESS === '1'
	? {}
	: { preprocess: vitePreprocess() }

export default config
