/**
 * Validation utilities
 */

/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email
 */
export function validateEmail(email) {
	if (!email || typeof email !== 'string') {
		return false
	}

	// RFC 5322 compliant regex (simplified)
	const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

	return emailRegex.test(email) && email.length <= 254
}

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
	if (typeof input !== 'string') {
		return ''
	}

	return input
		.trim()
		.replace(/[<>]/g, '') // Remove potential HTML tags
		.slice(0, 1000) // Limit length
}
