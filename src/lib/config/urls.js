/**
 * URL Configuration Utility
 *
 * Centralized management of application URLs to eliminate hardcoded values
 * and ensure consistency across the codebase.
 */

/**
 * Get the Medusa backend API URL
 * @param {string} [envValue] - Optional environment value to use
 * @returns {string} Backend URL
 */
export function getBackendUrl(envValue) {
	// Use provided value first
	if (envValue) {
		return envValue
	}
	// Server-side (Node.js)
	if (typeof process !== 'undefined' && process.env?.PUBLIC_MEDUSA_BACKEND_URL) {
		return process.env.PUBLIC_MEDUSA_BACKEND_URL
	}
	// Fallback for client-side or development
	return 'http://localhost:3282'
}

/**
 * Get the application frontend URL
 * @param {string} [envValue] - Optional environment value to use
 * @returns {string} Application URL
 */
export function getAppUrl(envValue) {
	// Use provided value first
	if (envValue) {
		return envValue
	}
	// Server-side (Node.js)
	if (typeof process !== 'undefined' && process.env?.PUBLIC_APP_URL) {
		return process.env.PUBLIC_APP_URL
	}
	// Fallback for development
	return 'http://localhost:3280'
}

/**
 * Get Medusa publishable key
 * @param {string} [envValue] - Optional environment value to use
 * @returns {string} Publishable key
 */
export function getPublishableKey(envValue) {
	// Use provided value first
	if (envValue) {
		return envValue
	}
	// Server-side (Node.js)
	if (typeof process !== 'undefined' && process.env?.PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
		return process.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY
	}
	// Fallback: try to get from window if it was injected
	if (typeof window !== 'undefined' && window.__MEDUSA_PUBLISHABLE_KEY__) {
		return window.__MEDUSA_PUBLISHABLE_KEY__
	}
	// Log warning in development
	if (typeof process === 'undefined' || (process.env?.NODE_ENV !== 'production')) {
		console.warn('[URLConfig] Publishable key not found. Make sure PUBLIC_MEDUSA_PUBLISHABLE_KEY is set in your .env file.')
	}
	return ''
}

/**
 * Check if running in development mode
 * @returns {boolean}
 */
export function isDevelopment() {
	if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
		return true
	}
	return false
}

/**
 * Check if running in production mode
 * @returns {boolean}
 */
export function isProduction() {
	if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
		return true
	}
	return false
}
