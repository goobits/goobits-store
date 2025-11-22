import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'

export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: null
			}
		}
	},
	{
		ignores: [
			'dist/**',
			'node_modules/**',
			'.svelte-kit/**',
			'coverage/**'
		]
	},
	{
		rules: {
			'no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_'
			}],
			'no-console': 'warn',
			'svelte/no-at-html-tags': 'warn',
			// These are too strict for a component library
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/prefer-svelte-reactivity': 'off',
			'svelte/no-unused-svelte-ignore': 'off',
			// Each blocks without keys are common in simple lists
			'svelte/require-each-key': 'warn',
			// $state + $effect pattern is valid in many cases
			'svelte/prefer-writable-derived': 'warn'
		}
	}
]
