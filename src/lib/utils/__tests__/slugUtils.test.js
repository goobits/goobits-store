import { describe, it, expect } from 'vitest'
import {
	generateKebabCasePart,
	generateSlugFromPath,
	cleanContentPath
} from '../slugUtils.js'

describe('generateKebabCasePart', () => {
	describe('PascalCase conversion', () => {
		it('converts simple PascalCase to kebab-case', () => {
			expect(generateKebabCasePart('AboutUs')).toBe('about-us')
			expect(generateKebabCasePart('ContactPage')).toBe('contact-page')
		})

		it('handles multiple capital letters', () => {
			expect(generateKebabCasePart('MyPageComponent')).toBe('my-page-component')
		})

		it('handles acronyms followed by lowercase', () => {
			expect(generateKebabCasePart('FAQPage')).toBe('faq-page')
			expect(generateKebabCasePart('HTMLParser')).toBe('html-parser')
		})

		it('handles single word PascalCase', () => {
			expect(generateKebabCasePart('Home')).toBe('home')
		})
	})

	describe('camelCase conversion', () => {
		it('converts camelCase to kebab-case', () => {
			expect(generateKebabCasePart('aboutUs')).toBe('about-us')
			expect(generateKebabCasePart('myComponent')).toBe('my-component')
		})
	})

	describe('space handling', () => {
		it('converts spaces to hyphens', () => {
			expect(generateKebabCasePart('Privacy Policy')).toBe('privacy-policy')
			expect(generateKebabCasePart('Terms of Service')).toBe('terms-of-service')
		})

		it('collapses multiple spaces into single hyphen', () => {
			// \s+ matches one or more spaces, replaced with single hyphen
			expect(generateKebabCasePart('About  Us')).toBe('about-us')
		})
	})

	describe('already kebab-case', () => {
		it('preserves already kebab-case strings', () => {
			expect(generateKebabCasePart('about-us')).toBe('about-us')
			expect(generateKebabCasePart('privacy-policy')).toBe('privacy-policy')
		})
	})

	describe('lowercase input', () => {
		it('preserves lowercase strings', () => {
			expect(generateKebabCasePart('home')).toBe('home')
			expect(generateKebabCasePart('about')).toBe('about')
		})
	})

	describe('numbers in names', () => {
		it('handles numbers followed by capitals', () => {
			expect(generateKebabCasePart('Page2Title')).toBe('page2-title')
			expect(generateKebabCasePart('Version3Update')).toBe('version3-update')
		})
	})
})

describe('generateSlugFromPath', () => {
	it('converts simple path', () => {
		expect(generateSlugFromPath('AboutUs')).toBe('about-us')
	})

	it('converts nested path', () => {
		expect(generateSlugFromPath('Legal/PrivacyPolicy')).toBe('legal/privacy-policy')
	})

	it('converts deeply nested path', () => {
		expect(generateSlugFromPath('Docs/API/GettingStarted')).toBe('docs/api/getting-started')
	})

	it('handles paths with spaces', () => {
		expect(generateSlugFromPath('Legal/Privacy Policy')).toBe('legal/privacy-policy')
	})

	it('preserves already correct paths', () => {
		expect(generateSlugFromPath('about-us')).toBe('about-us')
		expect(generateSlugFromPath('legal/privacy')).toBe('legal/privacy')
	})
})

describe('cleanContentPath', () => {
	it('removes /src/content/ prefix', () => {
		expect(cleanContentPath('/src/content/AboutUs.md')).toBe('AboutUs')
	})

	it('removes @content/ prefix', () => {
		expect(cleanContentPath('@content/AboutUs.md')).toBe('AboutUs')
	})

	it('removes src/content/ prefix (no leading slash)', () => {
		expect(cleanContentPath('src/content/AboutUs.md')).toBe('AboutUs')
	})

	it('removes .md extension', () => {
		expect(cleanContentPath('AboutUs.md')).toBe('AboutUs')
	})

	it('handles nested paths', () => {
		expect(cleanContentPath('/src/content/Legal/Privacy.md')).toBe('Legal/Privacy')
	})

	it('preserves paths without known prefixes', () => {
		expect(cleanContentPath('other/path/File.md')).toBe('other/path/File')
	})
})
