import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser/lib/index.js';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	{
		ignores: ['dist/**', 'node_modules/**', '.svelte-kit/**', '*.d.ts']
	},
	{
		files: ['**/*.js', '**/*.ts'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module'
			},
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			// TypeScript strict rules
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',

			// General strict rules
			'no-unused-vars': 'off', // Use TypeScript's version
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-alert': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'eqeqeq': ['error', 'always'],
			'curly': ['error', 'all'],
			'no-throw-literal': 'error',
			'no-return-await': 'error',
			'require-await': 'warn',
			'no-async-promise-executor': 'error',
			'no-promise-executor-return': 'error',
			'prefer-promise-reject-errors': 'error',
			'no-empty': ['error', { allowEmptyCatch: false }],
			'no-empty-function': 'warn',
			'no-lonely-if': 'error',
			'no-nested-ternary': 'warn',
			'no-unneeded-ternary': 'error',
			'no-useless-return': 'error',
			'no-useless-concat': 'error',
			'no-useless-computed-key': 'error',
			'no-duplicate-imports': 'error',
			'object-shorthand': ['error', 'always'],
			'prefer-template': 'error',
			'prefer-spread': 'error',
			'prefer-rest-params': 'error',
			'prefer-arrow-callback': 'error',
			'arrow-body-style': ['error', 'as-needed'],
			'no-param-reassign': 'warn',
			'default-case-last': 'error',
			'grouped-accessor-pairs': 'error',
			'no-constructor-return': 'error',
			'no-self-compare': 'error',
			'no-template-curly-in-string': 'warn',
			'no-unreachable-loop': 'error'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: ['.svelte']
			},
			globals: {
				...globals.browser
			}
		},
		plugins: {
			svelte: sveltePlugin,
			'@typescript-eslint': tsPlugin
		},
		rules: {
			...sveltePlugin.configs.recommended.rules,
			// Svelte-specific rules
			'svelte/no-at-html-tags': 'warn',
			'svelte/no-target-blank': 'error',
			'svelte/no-reactive-reassign': 'warn',
			'svelte/require-optimized-style-attribute': 'warn',
			'svelte/valid-compile': 'error',
			'svelte/no-unused-svelte-ignore': 'error',
			'svelte/no-useless-mustaches': 'error',
			'svelte/prefer-class-directive': 'warn',
			'svelte/prefer-style-directive': 'warn',
			'svelte/spaced-html-comment': 'error',
			'svelte/no-inner-declarations': 'error',

			// Same rules as JS/TS
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'no-unused-vars': 'off',
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'eqeqeq': ['error', 'always']
		}
	}
];
