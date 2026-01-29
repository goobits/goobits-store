/**
 * Validation Utils Tests
 *
 * These tests probe edge cases in email validation and string sanitization
 * that could allow invalid data or block valid users.
 */

import { describe, it, expect } from 'vitest'
import { validateEmail, sanitizeString } from './validation'

describe('validateEmail', () => {
	describe('valid emails', () => {
		it('should accept standard email', () => {
			expect(validateEmail('user@example.com')).toBe(true)
		})

		it('should accept email with subdomain', () => {
			expect(validateEmail('user@mail.example.com')).toBe(true)
		})

		it('should accept email with plus addressing', () => {
			expect(validateEmail('user+tag@example.com')).toBe(true)
		})

		it('should accept email with dots in local part', () => {
			expect(validateEmail('first.last@example.com')).toBe(true)
		})

		it('should accept email with numbers', () => {
			expect(validateEmail('user123@example456.com')).toBe(true)
		})

		it('should accept email with hyphen in domain', () => {
			expect(validateEmail('user@my-company.com')).toBe(true)
		})
	})

	describe('invalid emails - should reject', () => {
		it('should reject email without @', () => {
			expect(validateEmail('userexample.com')).toBe(false)
		})

		it('should reject email without domain', () => {
			expect(validateEmail('user@')).toBe(false)
		})

		it('should reject email without local part', () => {
			expect(validateEmail('@example.com')).toBe(false)
		})

		it('should reject email with multiple @', () => {
			expect(validateEmail('user@@example.com')).toBe(false)
		})

		it('should reject email with spaces', () => {
			expect(validateEmail('user @example.com')).toBe(false)
		})

		it('should reject empty string', () => {
			expect(validateEmail('')).toBe(false)
		})

		it('should reject null', () => {
			expect(validateEmail(null)).toBe(false)
		})

		it('should reject undefined', () => {
			expect(validateEmail(undefined)).toBe(false)
		})
	})

	describe('edge cases', () => {
		it('should reject email longer than 254 characters', () => {
			// RFC 5321 limits email to 254 characters
			const longLocal = 'a'.repeat(250)
			const longEmail = `${longLocal}@example.com`
			expect(validateEmail(longEmail)).toBe(false)
		})

		it('should accept email at exactly 254 characters', () => {
			// Build an email that's exactly 254 chars
			const domain = '@example.com' // 12 chars
			const local = 'a'.repeat(254 - 12)
			expect(validateEmail(local + domain)).toBe(true)
		})

		it('should handle email with unusual but valid TLD', () => {
			expect(validateEmail('user@example.photography')).toBe(true)
		})

		it('should reject email with only whitespace', () => {
			expect(validateEmail('   ')).toBe(false)
		})
	})
})

describe('sanitizeString', () => {
	describe('basic sanitization', () => {
		it('should trim whitespace', () => {
			expect(sanitizeString('  hello  ')).toBe('hello')
		})

		it('should remove < characters', () => {
			expect(sanitizeString('hello<script>')).toBe('helloscript')
		})

		it('should remove > characters', () => {
			expect(sanitizeString('hello>world')).toBe('helloworld')
		})

		it('should remove both < and >', () => {
			expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
		})
	})

	describe('length limiting', () => {
		it('should truncate strings longer than 1000 characters', () => {
			const longString = 'a'.repeat(2000)
			expect(sanitizeString(longString).length).toBe(1000)
		})

		it('should not modify strings under 1000 characters', () => {
			const shortString = 'a'.repeat(500)
			expect(sanitizeString(shortString).length).toBe(500)
		})
	})

	describe('non-string inputs', () => {
		it('should return empty string for number', () => {
			// @ts-expect-error Testing runtime behavior
			expect(sanitizeString(123)).toBe('')
		})

		it('should return empty string for null', () => {
			expect(sanitizeString(null)).toBe('')
		})

		it('should return empty string for undefined', () => {
			expect(sanitizeString(undefined)).toBe('')
		})

		it('should return empty string for object', () => {
			// @ts-expect-error Testing runtime behavior
			expect(sanitizeString({ foo: 'bar' })).toBe('')
		})

		it('should return empty string for array', () => {
			// @ts-expect-error Testing runtime behavior
			expect(sanitizeString(['a', 'b'])).toBe('')
		})
	})

	describe('preserves valid content', () => {
		it('should preserve normal text', () => {
			expect(sanitizeString('Hello, World!')).toBe('Hello, World!')
		})

		it('should preserve unicode characters', () => {
			expect(sanitizeString('Héllo Wörld 你好')).toBe('Héllo Wörld 你好')
		})

		it('should preserve newlines', () => {
			expect(sanitizeString('line1\nline2')).toBe('line1\nline2')
		})

		it('should preserve other special characters', () => {
			expect(sanitizeString('user@example.com & co.')).toBe('user@example.com & co.')
		})
	})
})
