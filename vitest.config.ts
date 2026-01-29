import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
	plugins: [svelte({ hot: false })],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'jsdom',
		globals: true
	},
	resolve: {
		alias: {
			'$app/environment': path.resolve(__dirname, './src/lib/__mocks__/app-environment.ts'),
			'$env/static/public': path.resolve(__dirname, './src/lib/__mocks__/env-static-public.ts'),
			'@goobits/logger': path.resolve(__dirname, './src/lib/__mocks__/goobits-logger.ts')
		}
	}
})
