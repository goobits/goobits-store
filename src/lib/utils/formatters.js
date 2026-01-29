/**
 * Utility functions for formatting various data types
 */

/**
 * Formats a phone number string into a readable format
 * Converts "+15551234567" to "(555) 123-4567"
 *
 * @param {string} phoneNumber - The phone number to format (with or without country code)
 * @returns {string} The formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
	if (!phoneNumber) {return ''}

	// Remove all non-digit characters
	const numbers = phoneNumber.replace(/\D/g, '')

	// Handle US/Canada numbers (with or without country code)
	const hasCountryCode = numbers.length > 10
	const digits = hasCountryCode ? numbers.slice(numbers.length - 10) : numbers

	// Format the number: (XXX) XXX-XXXX
	if (digits.length === 10) {
		return `(${ digits.substring(0, 3) }) ${ digits.substring(3, 6) }-${ digits.substring(6) }`
	}

	// Return original format if we can't parse it
	return phoneNumber
}
