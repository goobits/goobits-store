/**
 * Store Route Handlers for SvelteKit
 *
 * Ready-to-use route handlers that can be imported into your SvelteKit routes
 * to quickly set up a shop on any website.
 */

import {
	loadShopIndex,
	loadProduct,
	loadCategory,
	loadCollection,
	loadCheckout,
	loadCart,
	generateShopEntries
} from './routeUtils.js'

/**
 * Creates a shop index handler for +page.server.js
 *
 * @example
 * // In your routes/shop/+page.server.js
 * import { createShopIndexHandler } from '@goobits/store/handlers'
 * export const { load, prerender } = createShopIndexHandler({ prerender: false })
 *
 * @param {Object} options - Configuration options
 * @param {boolean} [options.prerender=false] - Whether to prerender the page
 * @param {Function} [options.getLanguage] - Function to get language from locals
 * @param {Object} [options.config] - Shop configuration overrides
 * @returns {Object} Object with load function and prerender setting
 */
export function createShopIndexHandler(options = {}) {
	const {
		prerender = false, // Shop pages need dynamic data by default
		getLanguage = (locals) => locals?.paraglideLocale || 'en',
		config = null
	} = options

	return {
		prerender,
		load: async ({ params: _params, locals }) => {
			const lang = getLanguage(locals)
			return await loadShopIndex(lang, config, { initialLoad: true })
		}
	}
}

/**
 * Creates a shop slug handler for +page.server.js
 * Handles individual products, categories, and collections
 *
 * @example
 * // In your routes/shop/[...slug]/+page.server.js
 * import { createShopSlugHandler } from '@goobits/store/handlers'
 * export const { load, prerender } = createShopSlugHandler({ prerender: false })
 *
 * @param {Object} options - Configuration options
 * @param {boolean} [options.prerender=false] - Whether to prerender pages
 * @param {string} [options.trailingSlash='ignore'] - Trailing slash behavior
 * @param {Function} [options.getLanguage] - Function to get language from locals
 * @param {string[]} [options.languages] - List of supported languages
 * @param {Object} [options.config] - Shop configuration overrides
 * @returns {Object} Object with load function and settings
 */
export function createShopSlugHandler(options = {}) {
	const {
		prerender = false, // Shop pages need dynamic data by default
		trailingSlash = 'ignore',
		getLanguage = (locals) => locals?.paraglideLocale || 'en',
		languages = [ 'en' ],
		config = null
	} = options

	return {
		prerender,
		trailingSlash,
		entries: prerender ? async () => generateShopEntries(languages, config) : undefined,
		load: async ({ params, locals }) => {
			const { slug } = params
			const lang = getLanguage(locals)

			// Router logic - normalize slug by removing trailing slashes
			const normalizedSlug = slug ? slug.replace(/\/$/, '') : ''

			if (!normalizedSlug || normalizedSlug === '') {
				return await loadShopIndex(lang, config)
			}

			if (normalizedSlug.startsWith('category/')) {
				const categorySlug = normalizedSlug.replace('category/', '')
				return await loadCategory(categorySlug, lang, config)
			}

			if (normalizedSlug.startsWith('collection/')) {
				const collectionSlug = normalizedSlug.replace('collection/', '')
				return await loadCollection(collectionSlug, lang, config)
			}

			// Handle special shop pages
			if (normalizedSlug === 'products') {
				// Products listing page - same as shop index
				return await loadShopIndex(lang, config)
			}

			// Handle product pages: /shop/products/{handle}
			if (normalizedSlug.startsWith('products/')) {
				const productHandle = normalizedSlug.replace('products/', '')
				return await loadProduct(productHandle, lang, config)
			}

			if (normalizedSlug === 'account') {
				return { pageType: 'account', lang }
			}

			if (normalizedSlug === 'cart') {
				return await loadCart(lang, config)
			}

			if (normalizedSlug === 'login') {
				return { pageType: 'login', lang }
			}

			if (normalizedSlug === 'plans') {
				return { pageType: 'plans', lang }
			}

			if (normalizedSlug === 'checkout') {
				return await loadCheckout(lang, config, { url: params.url })
			}

			// Default: treat as product handle/slug
			return await loadProduct(normalizedSlug, lang, config)
		}
	}
}

export { createCheckoutHandler } from './checkoutHandler.js'

export * from './routeUtils.js'
export * from './clientLoad.js'