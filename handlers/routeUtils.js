/**
 * Store Route Utilities
 *
 * Helper functions for loading shop content in different contexts
 */

import { medusaServerClient } from '@lib/medusa/server-client.js'
import { Logger } from '@lib/utils/Logger.js'
import { getStoreConfig } from '../config/index.js'
import { redirect, error } from '@sveltejs/kit'

const logger = new Logger('StoreRouteUtils')

/**
 * Loads data for the main shop index page
 * @param {string} lang - The language code for which to load the index
 * @param {Object} config - Shop configuration
 * @param {Object} options - Additional options
 * @param {boolean} options.initialLoad - If true, only return first batch for SSR
 * @returns {Promise<object>} An object containing page data
 */
export async function loadShopIndex(lang, config = null, options = {}) {
	const _finalConfig = config || getStoreConfig()
	const { initialLoad = false } = options

	try {
		// Get regions first for pricing context
		const { regions } = await medusaServerClient.regions.list()
		const defaultRegion = regions && regions.length > 0 ? regions[0] : null

		// Fetch products from Medusa
		const limit = initialLoad
			? _finalConfig.pagination?.productsPerBatch || 12
			: 50

		const queryParams = {
			limit,
			// Request pricing calculations for variants
			fields: '+variants.calculated_price'
		}

		// Add region context if available for pricing
		if (defaultRegion?.id) {
			queryParams.region_id = defaultRegion.id
		}

		const { products, count } = await medusaServerClient.products.list(queryParams)

		// Get product categories for filtering
		const { product_categories } = await medusaServerClient.productCategories.list({
			limit: 100
		})

		// Get collections for filtering
		const { collections } = await medusaServerClient.collections.list({
			limit: 100
		})

		return {
			pageType: 'index',
			products,
			productsCount: count,
			totalProducts: count,
			hasMoreProducts: count > limit,
			regions,
			defaultRegion,
			categories: product_categories || [],
			collections: collections || [],
			lang
		}
	} catch (err) {
		logger.error('Error loading shop index:', err)
		const error = new Error('Error loading products from Medusa')
		error.status = 500
		error.details = err.message
		throw error
	}
}

/**
 * Loads data for a specific product page
 * @param {string} productHandle - The handle/slug of the product
 * @param {string} lang - The language code
 * @param {Object} config - Shop configuration
 * @returns {Promise<object>} An object containing page data for the product
 * @throws {Error} If the product is not found
 */
export async function loadProduct(productHandle, lang, config = null) {
	const _finalConfig = config || getStoreConfig()

	try {
		// Get regions first for pricing context
		const { regions } = await medusaServerClient.regions.list()
		const defaultRegion = regions && regions.length > 0 ? regions[0] : null

		// Fetch the product by handle (slug) with pricing information
		const queryParams = {
			handle: productHandle,
			// Request pricing calculations for variants
			fields: '+variants.calculated_price'
		}

		// Add region context if available for pricing
		if (defaultRegion?.id) {
			queryParams.region_id = defaultRegion.id
			// Note: currency_code is not a valid query param in Medusa v2
			// Currency is determined by the region
		}

		const { products } = await medusaServerClient.products.list(queryParams)

		if (!products || products.length === 0) {
			throw error(404, `Product with handle "${ productHandle }" not found`)
		}

		const product = products[0]

		// Fetch related products in the same collection or with similar tags
		let relatedProducts = []
		if (product.collection_id) {
			const { products: collectionProducts } = await medusaServerClient.products.list({
				collection_id: [ product.collection_id ],
				limit: 4
			})

			// Remove the current product from related products
			relatedProducts = collectionProducts.filter(p => p.id !== product.id)
		}

		return {
			pageType: 'product',
			product,
			relatedProducts,
			regions,
			defaultRegion,
			lang
		}
	} catch (err) {
		// Re-throw SvelteKit errors (like 404) directly
		if (err.status) {
			throw err
		}

		// Log and wrap other errors
		logger.error('Error loading product:', err)
		throw error(500, 'Error loading product from Medusa')
	}
}

/**
 * Loads data for a specific category page
 * @param {string} categoryHandle - The handle/slug of the category
 * @param {string} lang - The language code
 * @param {Object} config - Shop configuration
 * @returns {Promise<object>} An object containing page data for the category
 * @throws {Error} If the category is not found
 */
export async function loadCategory(categoryHandle, lang, config = null) {
	const _finalConfig = config || getStoreConfig()

	try {
		// First, find the category by handle
		const { product_categories } = await medusaServerClient.productCategories.list({
			handle: categoryHandle
		})

		if (!product_categories || product_categories.length === 0) {
			throw error(404, `Category with handle "${ categoryHandle }" not found`)
		}

		const category = product_categories[0]

		// Fetch products in this category
		const { products, count } = await medusaServerClient.products.list({
			category_id: [ category.id ],
			limit: 50
		})

		// Get regions for pricing
		const { regions } = await medusaServerClient.regions.list()

		// Default to first region if available
		const defaultRegion = regions && regions.length > 0 ? regions[0] : null

		return {
			pageType: 'category',
			category,
			products,
			productsCount: count,
			regions,
			defaultRegion,
			lang
		}
	} catch (err) {
		// Re-throw SvelteKit errors (like 404) directly
		if (err.status) {
			throw err
		}

		// Log and wrap other errors
		logger.error('Error loading category:', err)
		throw error(500, 'Error loading category from Medusa')
	}
}

/**
 * Loads data for a specific collection page
 * @param {string} collectionHandle - The handle/slug of the collection
 * @param {string} lang - The language code
 * @param {Object} config - Shop configuration
 * @returns {Promise<object>} An object containing page data for the collection
 * @throws {Error} If the collection is not found
 */
export async function loadCollection(collectionHandle, lang, config = null) {
	const _finalConfig = config || getStoreConfig()

	try {
		// First, find the collection by handle
		const { collections } = await medusaServerClient.collections.list({
			handle: collectionHandle
		})

		if (!collections || collections.length === 0) {
			throw error(404, `Collection with handle "${ collectionHandle }" not found`)
		}

		const collection = collections[0]

		// Fetch products in this collection
		const { products, count } = await medusaServerClient.products.list({
			collection_id: [ collection.id ],
			limit: 50
		})

		// Get regions for pricing
		const { regions } = await medusaServerClient.regions.list()

		// Default to first region if available
		const defaultRegion = regions && regions.length > 0 ? regions[0] : null

		return {
			pageType: 'collection',
			collection,
			products,
			productsCount: count,
			regions,
			defaultRegion,
			lang
		}
	} catch (err) {
		// Re-throw SvelteKit errors (like 404) directly
		if (err.status) {
			throw err
		}

		// Log and wrap other errors
		logger.error('Error loading collection:', err)
		throw error(500, 'Error loading collection from Medusa')
	}
}

/**
 * Generates entries for prerendering based on all possible shop routes
 * Note: Usually not used since shop pages require dynamic data
 * @param {string[]} languages - Array of supported language codes
 * @param {Object} config - Shop configuration
 * @returns {Promise<object[]>} Array of entry objects for prerendering
 */
export async function generateShopEntries(languages = [ 'en' ], config = null) {
	const _finalConfig = config || getStoreConfig()

	try {
		const generatedEntries = []

		// Generate product entries
		const { products } = await medusaServerClient.products.list({ limit: 1000 })

		products.forEach(product => {
			if (!product.handle) return

			languages.forEach(lang => {
				generatedEntries.push({
					slug: product.handle,
					lang
				})
			})
		})

		// Generate category entries
		const { product_categories } = await medusaServerClient.productCategories.list({ limit: 100 })

		product_categories.forEach(category => {
			if (!category.handle) return

			languages.forEach(lang => {
				generatedEntries.push({
					slug: `category/${ category.handle }`,
					lang
				})
			})
		})

		// Generate collection entries
		const { collections } = await medusaServerClient.collections.list({ limit: 100 })

		collections.forEach(collection => {
			if (!collection.handle) return

			languages.forEach(lang => {
				generatedEntries.push({
					slug: `collection/${ collection.handle }`,
					lang
				})
			})
		})

		return generatedEntries
	} catch (err) {
		logger.error('Error generating shop entries:', err)
		return [] // Return empty array on error for prerendering
	}
}

/**
 * Loads data for the checkout page
 * @param {string} lang - The language code
 * @param {Object} config - Shop configuration
 * @param {Object} url - URL object from SvelteKit
 * @returns {Promise<object>} An object containing page data for checkout
 * @throws {Error} If checkout data cannot be loaded
 */
export async function loadCheckout(lang, config = null, url) {
	const _finalConfig = config || getStoreConfig()
	const cartId = url.searchParams.get('cart_id')

	if (!cartId) {
		throw redirect(302, '/shop/cart')
	}

	try {
		// Get the cart from Medusa
		const { cart } = await medusaServerClient.carts.retrieve(cartId)

		if (!cart) {
			throw redirect(302, '/shop/cart')
		}

		// Get regions for shipping
		const { regions } = await medusaServerClient.regions.list()

		// Default to first region
		const defaultRegion = regions && regions.length > 0 ? regions[0] : null

		// Get shipping options for the region
		let shippingOptions = []
		if (defaultRegion) {
			const { shipping_options } = await medusaServerClient.shippingOptions.list({
				region_id: defaultRegion.id
			})

			shippingOptions = shipping_options || []
		}

		// Check if payment sessions exist, initialize if needed
		if (cart.payment_sessions === null && cart.shipping_methods && cart.shipping_methods.length > 0) {
			try {
				// Create payment sessions
				await medusaServerClient.carts.createPaymentSessions(cartId)

				// Get updated cart with payment sessions
				const { cart: updatedCart } = await medusaServerClient.carts.retrieve(cartId)

				// If Stripe payment method is available, select it
				if (updatedCart.payment_sessions && updatedCart.payment_sessions.some(s => s.provider_id === 'stripe')) {
					await medusaServerClient.carts.setPaymentSession(cartId, {
						provider_id: 'stripe'
					})

					// Get final cart with selected payment session
					const { cart: finalCart } = await medusaServerClient.carts.retrieve(cartId)
					return {
						pageType: 'checkout',
						cart: finalCart,
						regions,
						defaultRegion,
						shippingOptions,
						lang
					}
				}

				return {
					pageType: 'checkout',
					cart: updatedCart,
					regions,
					defaultRegion,
					shippingOptions,
					lang
				}
			} catch (e) {
				logger.error('Failed to initialize payment sessions:', e)
				// Continue with the original cart if payment session initialization fails
			}
		}

		return {
			pageType: 'checkout',
			cart,
			regions,
			defaultRegion,
			shippingOptions,
			lang
		}
	} catch (err) {
		logger.error('Error loading cart:', err)

		throw error(500, {
			message: 'Error loading checkout information',
			details: err.message
		})
	}
}

/**
 * Loads data for the cart page
 * @param {string} lang - The language code
 * @param {Object} config - Shop configuration
 * @returns {Promise<object>} An object containing page data for the cart
 */
export async function loadCart(lang, config = null) {
	try {
		// Get regions for cart creation
		const { regions } = await medusaServerClient.regions.list()

		// Default to first region if available
		const defaultRegion = regions && regions.length > 0 ? regions[0] : null

		return {
			pageType: 'cart',
			regions,
			defaultRegion,
			lang
		}
	} catch (err) {
		logger.error('Error loading cart page:', err)

		throw error(500, {
			message: 'Error loading cart information',
			details: err.message
		})
	}
}