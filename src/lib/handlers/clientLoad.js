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
	return ({ params, url, data }) => 
		// For client-side navigation, we can add any additional
		// client-specific logic here if needed
		// IMPORTANT: Merge with server data, don't override it
		 ({
			...data, // Preserve server data (pageType, etc)
			slug: params.slug || '',
			searchParams: Object.fromEntries(url.searchParams.entries())
		})
	
}