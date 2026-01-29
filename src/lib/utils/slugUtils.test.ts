/**
 * Slug Utils Tests
 *
 * These tests probe edge cases in slug generation that could cause
 * broken URLs, 404s, or routing failures.
 */

import { describe, it, expect } from 'vitest'
import {
	generateKebabCasePart,
	generateSlugFromPath,
	cleanContentPath
} from './slugUtils'

describe('generateKebabCasePart', () => {
	describe('PascalCase conversion', () => {
		it('should convert PascalCase to kebab-case', () => {
			expect(generateKebabCasePart('AboutUs')).toBe('about-us')
		})

		it('should convert single word PascalCase', () => {
			expect(generateKebabCasePart('About')).toBe('about')
		})

		it('should handle multiple words', () => {
			expect(generateKebabCasePart('PrivacyPolicyPage')).toBe('privacy-policy-page')
		})
	})

	describe('camelCase conversion', () => {
		it('should convert camelCase to kebab-case', () => {
			expect(generateKebabCasePart('aboutUs')).toBe('about-us')
		})

		it('should handle already lowercase', () => {
			expect(generateKebabCasePart('about')).toBe('about')
		})
	})

	describe('consecutive capitals (acronyms)', () => {
		it('should handle FAQ correctly', () => {
			// FAQPage should become faq-page, not f-a-q-page
			expect(generateKebabCasePart('FAQPage')).toBe('faq-page')
		})

		it('should handle all-caps word', () => {
			expect(generateKebabCasePart('FAQ')).toBe('faq')
		})

		it('should handle XMLParser pattern', () => {
			// XMLParser should become xml-parser
			expect(generateKebabCasePart('XMLParser')).toBe('xml-parser')
		})

		it('should handle HTTPSConnection pattern', () => {
			expect(generateKebabCasePart('HTTPSConnection')).toBe('https-connection')
		})
	})

	describe('spaces', () => {
		it('should convert spaces to hyphens', () => {
			expect(generateKebabCasePart('Privacy Policy')).toBe('privacy-policy')
		})

		it('should collapse multiple spaces into single hyphen', () => {
			// Multiple spaces become single hyphen (good behavior - prevents ugly URLs)
			expect(generateKebabCasePart('Terms  And  Conditions')).toBe('terms-and-conditions')
		})
	})

	describe('numbers', () => {
		it('should preserve numbers', () => {
			expect(generateKebabCasePart('Section2')).toBe('section2')
		})

		it('should handle number followed by capital', () => {
			expect(generateKebabCasePart('Page2Summary')).toBe('page2-summary')
		})
	})

	describe('edge cases', () => {
		it('should handle empty string', () => {
			expect(generateKebabCasePart('')).toBe('')
		})

		it('should handle already kebab-case', () => {
			expect(generateKebabCasePart('already-kebab')).toBe('already-kebab')
		})

		it('should lowercase everything', () => {
			expect(generateKebabCasePart('ALLCAPS')).toBe('allcaps')
		})
	})
})

describe('generateSlugFromPath', () => {
	it('should convert simple path', () => {
		expect(generateSlugFromPath('AboutUs')).toBe('about-us')
	})

	it('should convert nested path', () => {
		expect(generateSlugFromPath('Legal/PrivacyPolicy')).toBe('legal/privacy-policy')
	})

	it('should convert deeply nested path', () => {
		expect(generateSlugFromPath('Docs/API/GettingStarted')).toBe('docs/api/getting-started')
	})

	it('should handle path with spaces in segments', () => {
		expect(generateSlugFromPath('Legal/Privacy Policy')).toBe('legal/privacy-policy')
	})

	it('should preserve forward slashes', () => {
		const result = generateSlugFromPath('a/b/c')
		expect(result.split('/')).toHaveLength(3)
	})

	it('should handle empty path', () => {
		expect(generateSlugFromPath('')).toBe('')
	})
})

describe('cleanContentPath', () => {
	it('should remove /src/content/ prefix', () => {
		expect(cleanContentPath('/src/content/AboutUs.md')).toBe('AboutUs')
	})

	it('should remove @content/ prefix', () => {
		expect(cleanContentPath('@content/AboutUs.md')).toBe('AboutUs')
	})

	it('should remove src/content/ prefix (no leading slash)', () => {
		expect(cleanContentPath('src/content/AboutUs.md')).toBe('AboutUs')
	})

	it('should remove .md extension', () => {
		expect(cleanContentPath('AboutUs.md')).toBe('AboutUs')
	})

	it('should handle nested paths', () => {
		expect(cleanContentPath('/src/content/Legal/Privacy.md')).toBe('Legal/Privacy')
	})

	it('should handle path without prefix or extension', () => {
		expect(cleanContentPath('SomePage')).toBe('SomePage')
	})

	it('should handle empty string', () => {
		expect(cleanContentPath('')).toBe('')
	})

	it('should only remove first occurrence of .md', () => {
		// If someone has a weird filename like "ReadMe.md.backup.md"
		// The current implementation only removes '.md' once
		expect(cleanContentPath('ReadMe.md.backup.md')).toBe('ReadMe.backup.md')
	})
})
