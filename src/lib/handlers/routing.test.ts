/**
 * Route Handler Tests
 *
 * Tests for the slug routing logic that determines which page loads.
 * A bug here means 404s or wrong pages for valid URLs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the routeUtils module before importing handlers
vi.mock('./routeUtils', () => ({
	loadShopIndex: vi.fn().mockResolvedValue({ pageType: 'index', products: [] }),
	loadProduct: vi.fn().mockResolvedValue({ pageType: 'product', product: {} }),
	loadCategory: vi.fn().mockResolvedValue({ pageType: 'category', category: {} }),
	loadCollection: vi.fn().mockResolvedValue({ pageType: 'collection', collection: {} }),
	loadCheckout: vi.fn().mockResolvedValue({ pageType: 'checkout' }),
	loadCart: vi.fn().mockResolvedValue({ pageType: 'cart', items: [] }),
	generateShopEntries: vi.fn().mockResolvedValue([])
}))

import { createShopSlugHandler, createShopIndexHandler } from './index'
import * as routeUtils from './routeUtils'

describe('createShopSlugHandler', () => {
	const mockLocals = { paraglideLocale: 'en' } as App.Locals

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('route resolution', () => {
		it('should load shop index for empty slug', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: '' }, locals: mockLocals })

			expect(routeUtils.loadShopIndex).toHaveBeenCalledWith('en', null)
		})

		it('should load shop index for undefined slug', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: {}, locals: mockLocals })

			expect(routeUtils.loadShopIndex).toHaveBeenCalledWith('en', null)
		})

		it('should load product for products/handle path', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'products/awesome-widget' }, locals: mockLocals })

			expect(routeUtils.loadProduct).toHaveBeenCalledWith('awesome-widget', 'en', null)
		})

		it('should load category for category/slug path', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'category/electronics' }, locals: mockLocals })

			expect(routeUtils.loadCategory).toHaveBeenCalledWith('electronics', 'en', null)
		})

		it('should load collection for collection/slug path', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'collection/summer-sale' }, locals: mockLocals })

			expect(routeUtils.loadCollection).toHaveBeenCalledWith('summer-sale', 'en', null)
		})

		it('should load cart page for cart slug', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'cart' }, locals: mockLocals })

			expect(routeUtils.loadCart).toHaveBeenCalledWith('en', null)
		})

		it('should load checkout page for checkout slug', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'checkout', url: new URL('http://localhost/shop/checkout') }, locals: mockLocals })

			expect(routeUtils.loadCheckout).toHaveBeenCalled()
		})
	})

	describe('static pages', () => {
		it('should return account page type', async () => {
			const handler = createShopSlugHandler()
			const result = await handler.load({ params: { slug: 'account' }, locals: mockLocals })

			expect(result).toEqual({ pageType: 'account', lang: 'en' })
		})

		it('should return login page type', async () => {
			const handler = createShopSlugHandler()
			const result = await handler.load({ params: { slug: 'login' }, locals: mockLocals })

			expect(result).toEqual({ pageType: 'login', lang: 'en' })
		})

		it('should return register page type for register slug', async () => {
			const handler = createShopSlugHandler()
			const result = await handler.load({ params: { slug: 'register' }, locals: mockLocals })

			expect(result).toEqual({ pageType: 'register', lang: 'en' })
		})

		it('should return register page type for signup slug', async () => {
			const handler = createShopSlugHandler()
			const result = await handler.load({ params: { slug: 'signup' }, locals: mockLocals })

			expect(result).toEqual({ pageType: 'register', lang: 'en' })
		})

		it('should return plans page type', async () => {
			const handler = createShopSlugHandler()
			const result = await handler.load({ params: { slug: 'plans' }, locals: mockLocals })

			expect(result).toEqual({ pageType: 'plans', lang: 'en' })
		})
	})

	describe('trailing slash normalization', () => {
		it('should strip trailing slash from slug', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'products/widget/' }, locals: mockLocals })

			expect(routeUtils.loadProduct).toHaveBeenCalledWith('widget', 'en', null)
		})

		it('should handle multiple trailing slashes', async () => {
			const handler = createShopSlugHandler()
			// Only one trailing slash is removed by the regex
			await handler.load({ params: { slug: 'category/electronics/' }, locals: mockLocals })

			expect(routeUtils.loadCategory).toHaveBeenCalledWith('electronics', 'en', null)
		})
	})

	describe('fallback to product', () => {
		it('should treat unknown slug as product handle', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'some-random-product' }, locals: mockLocals })

			// Unknown slugs fall back to product lookup
			expect(routeUtils.loadProduct).toHaveBeenCalledWith('some-random-product', 'en', null)
		})
	})

	describe('products listing', () => {
		it('should load shop index for /products (no handle)', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'products' }, locals: mockLocals })

			expect(routeUtils.loadShopIndex).toHaveBeenCalledWith('en', null)
		})
	})

	describe('language handling', () => {
		it('should use language from locals', async () => {
			const handler = createShopSlugHandler()
			const frenchLocals = { paraglideLocale: 'fr' } as App.Locals
			await handler.load({ params: { slug: 'cart' }, locals: frenchLocals })

			expect(routeUtils.loadCart).toHaveBeenCalledWith('fr', null)
		})

		it('should default to en when no language in locals', async () => {
			const handler = createShopSlugHandler()
			await handler.load({ params: { slug: 'cart' }, locals: {} as App.Locals })

			expect(routeUtils.loadCart).toHaveBeenCalledWith('en', null)
		})

		it('should use custom getLanguage function', async () => {
			const handler = createShopSlugHandler({
				getLanguage: () => 'de'
			})
			await handler.load({ params: { slug: 'cart' }, locals: mockLocals })

			expect(routeUtils.loadCart).toHaveBeenCalledWith('de', null)
		})
	})
})

describe('createShopIndexHandler', () => {
	const mockLocals = { paraglideLocale: 'en' } as App.Locals

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should load shop index with language', async () => {
		const handler = createShopIndexHandler()
		await handler.load({ params: {}, locals: mockLocals })

		expect(routeUtils.loadShopIndex).toHaveBeenCalledWith('en', null, { initialLoad: true })
	})

	it('should default prerender to false', () => {
		const handler = createShopIndexHandler()
		expect(handler.prerender).toBe(false)
	})

	it('should allow prerender override', () => {
		const handler = createShopIndexHandler({ prerender: true })
		expect(handler.prerender).toBe(true)
	})
})
