/**
 * Store i18n Hooks
 *
 * Utilities for integrating store with your i18n solution
 */

import { storeConfig } from '../config/index.js'

/**
 * Server hook for handling i18n in incoming requests
 * This should be called from your main hooks.server.js handle function
 *
 * @param {Object} event - SvelteKit handle event
 * @param {Function} [handler] - Optional custom i18n handler
 * @returns {Promise<void>}
 *
 * @example
 * // In hooks.server.js
 * import { handleStoreI18n } from '@goobits/store/i18n'
 *
 * export async function handle({ event, resolve }) {
 *   // Handle store i18n
 *   await handleStoreI18n(event)
 *
 *   // Your other handlers...
 *
 *   // Resolve the request
 *   return await resolve(event)
 * }
 */
export async function handleStoreI18n(event, handler) {
	// Only run if i18n is enabled and the URL is related to the store
	// Using startsWith for path-based check instead of includes for better security
	if (storeConfig.i18n?.enabled &&
		event.url.pathname &&
		(event.url.pathname === storeConfig.shopUri ||
		 event.url.pathname.startsWith(storeConfig.shopUri + '/'))) {

		// Only call handler if it's actually a function
		if (typeof handler === 'function') {
			try {
				await handler(event)
			} catch (error) {
				// Import logger inline to avoid circular dependencies
				const { createLogger } = await import('../utils/logger.js')
				const logger = createLogger('StoreI18n')
				logger.error('Error in store i18n handler:', error.message)
				// Don't rethrow to avoid breaking the request flow
			}
		}
	}
}

/**
 * Page server load hook for handling i18n in page server loads
 * @param {Object} event - SvelteKit page server load event
 * @param {Function} [originalLoad] - The original load function if any
 * @returns {Promise<Object>} The load function result with i18n data
 *
 * @example
 * // In +page.server.js
 * import { loadWithStoreI18n } from '@goobits/store/i18n'
 *
 * export const load = async (event) => {
 *   // Your original load function
 *   const originalLoad = async () => {
 *     return { yourData: 'here' }
 *   }
 *
 *   // Use the i18n-enhanced load function
 *   return await loadWithStoreI18n(event, originalLoad)
 * }
 */
export async function loadWithStoreI18n(event, originalLoad) {
	// Call the original load function if provided and it's a function
	const originalData = (typeof originalLoad === 'function') ?
		await originalLoad(event) : {}

	// Skip if i18n is not enabled
	if (!storeConfig.i18n?.enabled) {
		return originalData
	}

	// Get the language from locals or url
	const lang = event.locals?.lang || storeConfig.i18n.defaultLanguage

	// Return the data with i18n information
	return {
		...originalData,
		i18n: {
			lang,
			supportedLanguages: storeConfig.i18n.supportedLanguages
		}
	}
}

/**
 * Layout server load hook for adding i18n data to layouts
 * @param {Object} event - SvelteKit layout server load event
 * @param {Function} [originalLoad] - The original load function if any
 * @returns {Promise<Object>} The load function result with i18n data
 */
export async function layoutLoadWithStoreI18n(event, originalLoad) {
	// This is similar to loadWithStoreI18n but typically used in +layout.server.js
	return await loadWithStoreI18n(event, originalLoad)
}

export default {
	handleStoreI18n,
	loadWithStoreI18n,
	layoutLoadWithStoreI18n
}