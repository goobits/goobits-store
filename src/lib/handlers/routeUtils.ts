/**
 * Store Route Utilities
 *
 * Helper functions for loading shop content in different contexts
 */

 
// @ts-ignore - medusaServerClient module lacks type declarations
import { medusaServerClient } from '../utils/medusaServerClient.js'
import { createLogger } from '../utils/logger.js'
import { getStoreConfig } from '../config/index.js'
import { redirect, error } from '@sveltejs/kit'

const logger = createLogger('StoreRouteUtils')

// Medusa API response types
interface MedusaProductsResponse {
	products: MedusaProduct[]
	count: number
}

interface MedusaRegionsResponse {
	regions: MedusaRegion[]
}

interface MedusaCategoriesResponse {
	product_categories: MedusaCategory[]
}

interface MedusaCollectionsResponse {
	collections: MedusaCollection[]
}

interface MedusaCartResponse {
	cart: MedusaCart
}

interface MedusaShippingOptionsResponse {
	shipping_options: ShippingOption[]
}

// Extended types for Medusa entities
interface MedusaCategory {
	id: string
	handle: string
	name: string
}

interface MedusaCollection {
	id: string
	handle: string
	title: string
}

interface ShippingOption {
	id: string
	name: string
	amount: number
}

// Query parameters for Medusa API
interface ProductQueryParams {
	limit?: number
	fields?: string
	region_id?: string
	handle?: string
	collection_id?: string[]
	category_id?: string[]
}

// Options for loadShopIndex
interface LoadShopIndexOptions {
	initialLoad?: boolean
}

// Options for loadCheckout
interface LoadCheckoutOptions {
	url?: URL
}

// Page data types
export interface ShopIndexData {
	pageType: 'index'
	products: MedusaProduct[]
	productsCount: number
	totalProducts: number
	hasMoreProducts: boolean
	regions: MedusaRegion[]
	defaultRegion: MedusaRegion | null
	categories: MedusaCategory[]
	collections: MedusaCollection[]
	lang: string
}

export interface ProductPageData {
	pageType: 'product'
	product: MedusaProduct
	relatedProducts: MedusaProduct[]
	regions: MedusaRegion[]
	defaultRegion: MedusaRegion | null
	lang: string
}

export interface CategoryPageData {
	pageType: 'category'
	category: MedusaCategory
	products: MedusaProduct[]
	productsCount: number
	regions: MedusaRegion[]
	defaultRegion: MedusaRegion | null
	lang: string
}

export interface CollectionPageData {
	pageType: 'collection'
	collection: MedusaCollection
	products: MedusaProduct[]
	productsCount: number
	regions: MedusaRegion[]
	defaultRegion: MedusaRegion | null
	lang: string
}

export interface CheckoutPageData {
	pageType: 'checkout'
	cart: MedusaCart
	regions: MedusaRegion[]
	defaultRegion: MedusaRegion | null
	shippingOptions: ShippingOption[]
	lang: string
}

export interface CartPageData {
	pageType: 'cart'
	regions: MedusaRegion[]
	defaultRegion: MedusaRegion | null
	lang: string
}

export interface ShopEntry {
	slug: string
	lang: string
}

// Extended store config type
interface ExtendedStoreConfig extends ShopConfig {
	pagination?: {
		productsPerBatch?: number
	}
}

/**
 * Loads data for the main shop index page
 */
export async function loadShopIndex(
	lang: string,
	config: ShopConfig | null = null,
	options: LoadShopIndexOptions = {}
): Promise<ShopIndexData> {
	const _finalConfig = (config || getStoreConfig()) as ExtendedStoreConfig
	const { initialLoad = false } = options

	try {
		// Get regions first for pricing context
		const { regions } = await medusaServerClient.regions.list() as MedusaRegionsResponse
		const defaultRegion: MedusaRegion | null = regions && regions.length > 0 ? regions[0] ?? null : null

		// Fetch products from Medusa
		const limit = initialLoad
			? _finalConfig.pagination?.productsPerBatch || 12
			: 50

		const queryParams: ProductQueryParams = {
			limit,
			// Request pricing calculations for variants
			fields: '+variants.calculated_price'
		}

		// Add region context if available for pricing
		if (defaultRegion?.id) {
			queryParams.region_id = defaultRegion.id
		}

		const { products, count } = await medusaServerClient.products.list(queryParams) as unknown as MedusaProductsResponse

		// Get product categories for filtering
		const { product_categories } = await medusaServerClient.productCategories.list({
			limit: 100
		}) as MedusaCategoriesResponse

		// Get collections for filtering
		const { collections } = await medusaServerClient.collections.list({
			limit: 100
		}) as MedusaCollectionsResponse

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
		const shopError = new Error('Error loading products from Medusa') as Error & { status: number; details: string }
		shopError.status = 500
		shopError.details = (err as Error).message
		throw shopError
	}
}

/**
 * Loads data for a specific product page
 */
export async function loadProduct(
	productHandle: string,
	lang: string,
	_config: ShopConfig | null = null
): Promise<ProductPageData> {
	// Config available for future customization
	void (_config || getStoreConfig())

	try {
		// Get regions first for pricing context
		const { regions } = await medusaServerClient.regions.list() as MedusaRegionsResponse
		const defaultRegion: MedusaRegion | null = regions && regions.length > 0 ? regions[0] ?? null : null

		// Fetch the product by handle (slug) with pricing information
		const queryParams: ProductQueryParams = {
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

		const { products } = await medusaServerClient.products.list(queryParams) as unknown as MedusaProductsResponse

		if (!products || products.length === 0) {
			throw error(404, `Product with handle "${productHandle}" not found`)
		}

		const product = products[0]!

		// Fetch related products in the same collection or with similar tags
		let relatedProducts: MedusaProduct[] = []
		const productWithCollection = product as MedusaProduct & { collection_id?: string }
		if (productWithCollection.collection_id) {
			const { products: collectionProducts } = await medusaServerClient.products.list({
				collection_id: [ productWithCollection.collection_id ],
				limit: 4
			}) as unknown as MedusaProductsResponse

			// Remove the current product from related products
			relatedProducts = collectionProducts.filter(p => p.id !== product.id)
		}

		return {
			pageType: 'product' as const,
			product,
			relatedProducts,
			regions,
			defaultRegion,
			lang
		}
	} catch (err) {
		// Re-throw SvelteKit errors (like 404) directly
		if ((err as { status?: number }).status) {
			throw err
		}

		// Log and wrap other errors
		logger.error('Error loading product:', err)
		throw error(500, 'Error loading product from Medusa')
	}
}

/**
 * Loads data for a specific category page
 */
export async function loadCategory(
	categoryHandle: string,
	lang: string,
	_config: ShopConfig | null = null
): Promise<CategoryPageData> {
	// Config available for future customization
	void (_config || getStoreConfig())

	try {
		// First, find the category by handle
		const { product_categories } = await medusaServerClient.productCategories.list({
			handle: categoryHandle
		}) as MedusaCategoriesResponse

		if (!product_categories || product_categories.length === 0) {
			throw error(404, `Category with handle "${categoryHandle}" not found`)
		}

		const category = product_categories[0]!

		// Fetch products in this category
		const { products, count } = await medusaServerClient.products.list({
			category_id: [ category.id ],
			limit: 50
		}) as unknown as MedusaProductsResponse

		// Get regions for pricing
		const { regions } = await medusaServerClient.regions.list() as MedusaRegionsResponse

		// Default to first region if available
		const defaultRegion: MedusaRegion | null = regions && regions.length > 0 ? regions[0] ?? null : null

		return {
			pageType: 'category' as const,
			category,
			products,
			productsCount: count,
			regions,
			defaultRegion,
			lang
		}
	} catch (err) {
		// Re-throw SvelteKit errors (like 404) directly
		if ((err as { status?: number }).status) {
			throw err
		}

		// Log and wrap other errors
		logger.error('Error loading category:', err)
		throw error(500, 'Error loading category from Medusa')
	}
}

/**
 * Loads data for a specific collection page
 */
export async function loadCollection(
	collectionHandle: string,
	lang: string,
	_config: ShopConfig | null = null
): Promise<CollectionPageData> {
	// Config available for future customization
	void (_config || getStoreConfig())

	try {
		// First, find the collection by handle
		const { collections } = await medusaServerClient.collections.list({
			handle: collectionHandle
		} as Record<string, unknown>) as MedusaCollectionsResponse

		if (!collections || collections.length === 0) {
			throw error(404, `Collection with handle "${collectionHandle}" not found`)
		}

		const collection = collections[0]!

		// Fetch products in this collection
		const { products, count } = await medusaServerClient.products.list({
			collection_id: [ collection.id ],
			limit: 50
		}) as unknown as MedusaProductsResponse

		// Get regions for pricing
		const { regions } = await medusaServerClient.regions.list() as MedusaRegionsResponse

		// Default to first region if available
		const defaultRegion: MedusaRegion | null = regions && regions.length > 0 ? regions[0] ?? null : null

		return {
			pageType: 'collection' as const,
			collection,
			products,
			productsCount: count,
			regions,
			defaultRegion,
			lang
		}
	} catch (err) {
		// Re-throw SvelteKit errors (like 404) directly
		if ((err as { status?: number }).status) {
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
 */
export async function generateShopEntries(
	languages: string[] = [ 'en' ],
	_config: ShopConfig | null = null
): Promise<ShopEntry[]> {
	// Config available for future customization
	void (_config || getStoreConfig())

	try {
		const generatedEntries: ShopEntry[] = []

		// Generate product entries
		const { products } = await medusaServerClient.products.list({ limit: 1000 }) as unknown as MedusaProductsResponse

		products.forEach(product => {
			if (!product.handle) {return}

			languages.forEach(lang => {
				generatedEntries.push({
					slug: product.handle,
					lang
				})
			})
		})

		// Generate category entries
		const { product_categories } = await medusaServerClient.productCategories.list({ limit: 100 }) as MedusaCategoriesResponse

		product_categories.forEach(category => {
			if (!category.handle) {return}

			languages.forEach(lang => {
				generatedEntries.push({
					slug: `category/${category.handle}`,
					lang
				})
			})
		})

		// Generate collection entries
		const { collections } = await medusaServerClient.collections.list({ limit: 100 }) as MedusaCollectionsResponse

		collections.forEach(collection => {
			if (!collection.handle) {return}

			languages.forEach(lang => {
				generatedEntries.push({
					slug: `collection/${collection.handle}`,
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
 */
export async function loadCheckout(
	lang: string,
	_config: ShopConfig | null = null,
	options: LoadCheckoutOptions = {}
): Promise<CheckoutPageData> {
	// Config available for future customization
	void (_config || getStoreConfig())
	const { url } = options
	const cartId = url?.searchParams.get('cart_id')

	if (!cartId) {
		throw redirect(302, '/shop/cart')
	}

	try {
		// Get the cart from Medusa
		const { cart } = await medusaServerClient.carts.retrieve(cartId) as MedusaCartResponse

		if (!cart) {
			throw redirect(302, '/shop/cart')
		}

		// Get regions for shipping
		const { regions } = await medusaServerClient.regions.list() as MedusaRegionsResponse

		// Default to first region
		const defaultRegion: MedusaRegion | null = regions && regions.length > 0 ? regions[0] ?? null : null

		// Get shipping options for the region
		let shippingOptions: ShippingOption[] = []
		if (defaultRegion) {
			const { shipping_options } = await medusaServerClient.shippingOptions.list({
				region_id: defaultRegion.id
			}) as MedusaShippingOptionsResponse

			shippingOptions = shipping_options || []
		}

		// Extended cart type for payment sessions check
		interface CartWithSessions extends MedusaCart {
			payment_sessions?: Array<{ provider_id: string }> | null
			shipping_methods?: Array<{ id: string }>
		}

		const cartWithSessions = cart as CartWithSessions

		// Check if payment sessions exist, initialize if needed
		if (cartWithSessions.payment_sessions === null && cartWithSessions.shipping_methods && cartWithSessions.shipping_methods.length > 0) {
			try {
				// Create payment sessions
				await medusaServerClient.carts.createPaymentSessions(cartId)

				// Get updated cart with payment sessions
				const { cart: updatedCart } = await medusaServerClient.carts.retrieve(cartId) as MedusaCartResponse
				const updatedCartWithSessions = updatedCart as CartWithSessions

				// If Stripe payment method is available, select it
				if (updatedCartWithSessions.payment_sessions && updatedCartWithSessions.payment_sessions.some(s => s.provider_id === 'stripe')) {
					await medusaServerClient.carts.setPaymentSession(cartId, {
						provider_id: 'stripe'
					})

					// Get final cart with selected payment session
					const { cart: finalCart } = await medusaServerClient.carts.retrieve(cartId) as MedusaCartResponse
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
			details: (err as Error).message
		} as App.Error)
	}
}

/**
 * Loads data for the cart page
 */
export async function loadCart(
	lang: string,
	_config: ShopConfig | null = null
): Promise<CartPageData> {
	// Config available for future customization
	void (_config || getStoreConfig())

	try {
		// Get regions for cart creation
		const { regions } = await medusaServerClient.regions.list() as MedusaRegionsResponse

		// Default to first region if available
		const defaultRegion: MedusaRegion | null = regions && regions.length > 0 ? regions[0] ?? null : null

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
			details: (err as Error).message
		} as App.Error)
	}
}
