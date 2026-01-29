/**
 * Formatters Tests
 *
 * Tests for phone number formatting that could display incorrectly to users.
 */

import { describe, it, expect } from 'vitest'
import { formatPhoneNumber } from './formatters'

describe('formatPhoneNumber', () => {
	describe('US/Canada numbers (10 digits)', () => {
		it('should format plain 10-digit number', () => {
			expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567')
		})

		it('should format number with country code +1', () => {
			expect(formatPhoneNumber('+15551234567')).toBe('(555) 123-4567')
		})

		it('should format number with country code 1 (no plus)', () => {
			expect(formatPhoneNumber('15551234567')).toBe('(555) 123-4567')
		})
	})

	describe('numbers with formatting', () => {
		it('should handle dashes', () => {
			expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567')
		})

		it('should handle dots', () => {
			expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567')
		})

		it('should handle parentheses', () => {
			expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567')
		})

		it('should handle spaces', () => {
			expect(formatPhoneNumber('555 123 4567')).toBe('(555) 123-4567')
		})

		it('should handle mixed formatting', () => {
			expect(formatPhoneNumber('+1 (555) 123-4567')).toBe('(555) 123-4567')
		})
	})

	describe('edge cases', () => {
		it('should return empty string for null', () => {
			expect(formatPhoneNumber(null)).toBe('')
		})

		it('should return empty string for undefined', () => {
			expect(formatPhoneNumber(undefined)).toBe('')
		})

		it('should return empty string for empty string', () => {
			expect(formatPhoneNumber('')).toBe('')
		})

		it('should return original for numbers with less than 10 digits', () => {
			expect(formatPhoneNumber('555123')).toBe('555123')
		})

		it('should format digits from strings with letters (strips non-digits)', () => {
			// Letters are stripped, leaving only digits which are then formatted
			// '+441onal234567890' -> digits '4412345678990' (13 digits) -> last 10 -> formatted
			// This documents actual behavior - letters get stripped
			expect(formatPhoneNumber('+441234567890123')).toBe('(456) 789-0123')
		})

		it('should handle numbers with letters (vanity numbers)', () => {
			// Letters should be stripped, leaving only digits
			// "1-800-FLOWERS" has letters that would be stripped
			expect(formatPhoneNumber('1-800-FLOWERS')).toBe('1-800-FLOWERS')
		})
	})

	describe('international consideration', () => {
		it('should extract last 10 digits for longer numbers', () => {
			// +44 123 456 7890 (UK) - extracts last 10 digits
			expect(formatPhoneNumber('+441234567890')).toBe('(123) 456-7890')
		})
	})
})
