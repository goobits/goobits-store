import { describe, it, expect } from 'vitest'
import { formatPhoneNumber } from '../formatters.js'

describe('formatPhoneNumber', () => {
	it('should format a 10-digit phone number', () => {
		expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567')
	})

	it('should format a phone number with country code', () => {
		expect(formatPhoneNumber('+15551234567')).toBe('(555) 123-4567')
		expect(formatPhoneNumber('15551234567')).toBe('(555) 123-4567')
	})

	it('should strip non-digit characters before formatting', () => {
		expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567')
		expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567')
		expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567')
	})

	it('should return original value for non-standard phone numbers', () => {
		expect(formatPhoneNumber('123')).toBe('123')
		expect(formatPhoneNumber('12345')).toBe('12345')
	})

	it('should handle empty and null values', () => {
		expect(formatPhoneNumber('')).toBe('')
		expect(formatPhoneNumber(null)).toBe('')
		expect(formatPhoneNumber(undefined)).toBe('')
	})
})
