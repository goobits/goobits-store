import { describe, it, expect } from 'vitest'
import { formatPhoneNumber } from '../formatters.js'

describe('formatPhoneNumber', () => {
	describe('standard US phone numbers', () => {
		it('formats a 10-digit number to (XXX) XXX-XXXX', () => {
			expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567')
			expect(formatPhoneNumber('2025551234')).toBe('(202) 555-1234')
		})

		it('formats number with +1 country code', () => {
			expect(formatPhoneNumber('+15551234567')).toBe('(555) 123-4567')
		})

		it('formats number with 1 country code (no plus)', () => {
			expect(formatPhoneNumber('15551234567')).toBe('(555) 123-4567')
		})
	})

	describe('input normalization', () => {
		it('strips parentheses and spaces', () => {
			expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567')
			expect(formatPhoneNumber('(555)123-4567')).toBe('(555) 123-4567')
		})

		it('strips dashes', () => {
			expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567')
		})

		it('strips dots', () => {
			expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567')
		})

		it('strips mixed separators', () => {
			expect(formatPhoneNumber('(555).123-4567')).toBe('(555) 123-4567')
			expect(formatPhoneNumber('555 123 4567')).toBe('(555) 123-4567')
		})
	})

	describe('non-standard input', () => {
		it('returns original for numbers with fewer than 10 digits', () => {
			expect(formatPhoneNumber('123')).toBe('123')
			expect(formatPhoneNumber('12345')).toBe('12345')
			expect(formatPhoneNumber('123456789')).toBe('123456789')
		})

		it('extracts last 10 digits for numbers with more than 11 digits', () => {
			// The function takes the last 10 digits, which may not be desired for international
			expect(formatPhoneNumber('442071234567')).toBe('(207) 123-4567')
		})
	})

	describe('empty and null handling', () => {
		it('returns empty string for empty input', () => {
			expect(formatPhoneNumber('')).toBe('')
		})

		it('returns empty string for null', () => {
			expect(formatPhoneNumber(null)).toBe('')
		})

		it('returns empty string for undefined', () => {
			expect(formatPhoneNumber(undefined)).toBe('')
		})
	})
})
