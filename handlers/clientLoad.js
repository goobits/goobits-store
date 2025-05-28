/**
 * Client-side load utilities for store routes
 * Used for client-side navigation and data fetching
 */

/**
 * Creates a client-side load function for shop pages
 * @param {Object} _options - Configuration options (unused for now)
 * @returns {Function} Client load function
 */
export function createShopClientLoad(_options = {}) {
	return async ({ params, url }) => {
		// For client-side navigation, we can add any additional
		// client-specific logic here if needed
		return {
			slug: params.slug || '',
			searchParams: Object.fromEntries(url.searchParams.entries())
		}
	}
}