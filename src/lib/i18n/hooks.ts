/**
 * Store i18n Hooks
 *
 * Utilities for integrating store with your i18n solution
 */

import { storeConfig } from '../config/index.js'

export interface I18nHandleEvent {
	url: URL;
	locals: {
		lang?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface I18nHandler {
	(event: I18nHandleEvent): Promise<void> | void;
}

export interface I18nLoadData {
	i18n?: {
		lang: string;
		supportedLanguages: string[];
	};
	[key: string]: unknown;
}

export interface I18nLoadEvent {
	url: URL;
	locals: {
		lang?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface I18nOriginalLoad {
	(event: I18nLoadEvent): Promise<I18nLoadData> | I18nLoadData;
}

/**
 * Server hook for handling i18n in incoming requests
 * This should be called from your main hooks.server.js handle function
 *
 * @param event - SvelteKit handle event
 * @param handler - Optional custom i18n handler
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
export async function handleStoreI18n(event: I18nHandleEvent, handler?: I18nHandler): Promise<void> {
	// Only run if i18n is enabled and the URL is related to the store
	// Using startsWith for path-based check instead of includes for better security
	if (storeConfig.i18n?.enabled &&
		event.url.pathname &&
		(event.url.pathname === storeConfig.shopUri ||
		 event.url.pathname.startsWith(`${storeConfig.shopUri  }/`))) {

		// Only call handler if it's actually a function
		if (typeof handler === 'function') {
			try {
				await handler(event)
			} catch (error) {
				// Import logger inline to avoid circular dependencies
				const { createLogger } = await import('../utils/logger.js')
				const logger = createLogger('StoreI18n')
				logger.error('Error in store i18n handler:', (error as Error).message)
				// Don't rethrow to avoid breaking the request flow
			}
		}
	}
}

/**
 * Page server load hook for handling i18n in page server loads
 * @param event - SvelteKit page server load event
 * @param originalLoad - The original load function if any
 * @returns The load function result with i18n data
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
export async function loadWithStoreI18n(
	event: I18nLoadEvent,
	originalLoad?: I18nOriginalLoad
): Promise<I18nLoadData> {
	// Call the original load function if provided and it's a function
	const originalData: I18nLoadData = (typeof originalLoad === 'function') ?
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
 * @param event - SvelteKit layout server load event
 * @param originalLoad - The original load function if any
 * @returns The load function result with i18n data
 */
export function layoutLoadWithStoreI18n(
	event: I18nLoadEvent,
	originalLoad?: I18nOriginalLoad
): Promise<I18nLoadData> {
	// This is similar to loadWithStoreI18n but typically used in +layout.server.js
	return loadWithStoreI18n(event, originalLoad)
}

export default {
	handleStoreI18n,
	loadWithStoreI18n,
	layoutLoadWithStoreI18n
}
