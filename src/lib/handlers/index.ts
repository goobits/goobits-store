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
	generateShopEntries,
	type ShopIndexData,
	type ProductPageData,
	type CategoryPageData,
	type CollectionPageData,
	type CheckoutPageData,
	type CartPageData,
	type ShopEntry
} from './routeUtils'

// Handler options interfaces
interface ShopIndexHandlerOptions {
	prerender?: boolean
	getLanguage?: (locals: App.Locals) => string
	config?: ShopConfig | null
}

interface ShopSlugHandlerOptions {
	prerender?: boolean
	trailingSlash?: 'ignore' | 'always' | 'never'
	getLanguage?: (locals: App.Locals) => string
	languages?: string[]
	config?: ShopConfig | null
}

// Simple page data for static pages
interface SimplePageData {
	pageType: string
	lang: string
}

// Route params
interface ShopParams {
	slug?: string
	url?: URL
}

// Load event with locals
interface ShopLoadEvent {
	params: ShopParams
	locals: App.Locals
}

// Union type for all possible page data
type ShopPageData = ShopIndexData | ProductPageData | CategoryPageData | CollectionPageData | CheckoutPageData | CartPageData | SimplePageData

// Shop index handler return type
interface ShopIndexHandler {
	prerender: boolean
	load: (event: ShopLoadEvent) => Promise<ShopIndexData>
}

// Shop slug handler return type
interface ShopSlugHandler {
	prerender: boolean
	trailingSlash: 'ignore' | 'always' | 'never'
	entries?: () => Promise<ShopEntry[]>
	load: (event: ShopLoadEvent) => Promise<ShopPageData>
}

/**
 * Creates a shop index handler for +page.server.js
 *
 * @example
 * // In your routes/shop/+page.server.js
 * import { createShopIndexHandler } from '@goobits/store/handlers'
 * export const { load, prerender } = createShopIndexHandler({ prerender: false })
 */
export function createShopIndexHandler(options: ShopIndexHandlerOptions = {}): ShopIndexHandler {
	const {
		prerender = false, // Shop pages need dynamic data by default
		getLanguage = (locals: App.Locals) => (locals as { paraglideLocale?: string })?.paraglideLocale || 'en',
		config = null
	} = options

	return {
		prerender,
		load: ({ params: _params, locals }: ShopLoadEvent): Promise<ShopIndexData> => {
			const lang = getLanguage(locals)
			return loadShopIndex(lang, config, { initialLoad: true })
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
 */
export function createShopSlugHandler(options: ShopSlugHandlerOptions = {}): ShopSlugHandler {
	const {
		prerender = false, // Shop pages need dynamic data by default
		trailingSlash = 'ignore',
		getLanguage = (locals: App.Locals) => (locals as { paraglideLocale?: string })?.paraglideLocale || 'en',
		languages = [ 'en' ],
		config = null
	} = options

	return {
		prerender,
		trailingSlash,
		entries: prerender ? () => generateShopEntries(languages, config) : undefined,
		load: ({ params, locals }: ShopLoadEvent): Promise<ShopPageData> => {
			const { slug } = params
			const lang = getLanguage(locals)

			// Router logic - normalize slug by removing trailing slashes
			const normalizedSlug = slug ? slug.replace(/\/$/, '') : ''

			if (!normalizedSlug || normalizedSlug === '') {
				return loadShopIndex(lang, config)
			}

			if (normalizedSlug.startsWith('category/')) {
				const categorySlug = normalizedSlug.replace('category/', '')
				return loadCategory(categorySlug, lang, config)
			}

			if (normalizedSlug.startsWith('collection/')) {
				const collectionSlug = normalizedSlug.replace('collection/', '')
				return loadCollection(collectionSlug, lang, config)
			}

			// Handle special shop pages
			if (normalizedSlug === 'products') {
				// Products listing page - same as shop index
				return loadShopIndex(lang, config)
			}

			// Handle product pages: /shop/products/{handle}
			if (normalizedSlug.startsWith('products/')) {
				const productHandle = normalizedSlug.replace('products/', '')
				return loadProduct(productHandle, lang, config)
			}

			if (normalizedSlug === 'account') {
				return Promise.resolve({ pageType: 'account', lang })
			}

			if (normalizedSlug === 'cart') {
				return loadCart(lang, config)
			}

			if (normalizedSlug === 'login') {
				return Promise.resolve({ pageType: 'login', lang })
			}

			if (normalizedSlug === 'register' || normalizedSlug === 'signup') {
				return Promise.resolve({ pageType: 'register', lang })
			}

			if (normalizedSlug === 'plans') {
				return Promise.resolve({ pageType: 'plans', lang })
			}

			if (normalizedSlug === 'checkout') {
				return loadCheckout(lang, config, { url: params.url })
			}

			// Default: treat as product handle/slug
			return loadProduct(normalizedSlug, lang, config)
		}
	}
}

export { createCheckoutHandler } from './checkoutHandler.js'

export * from './routeUtils.js'
export * from './clientLoad.js'
