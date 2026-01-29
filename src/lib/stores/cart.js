import { writable, get } from 'svelte/store'
import { browser } from '$app/environment'
import { createLogger } from '../utils/logger.js'
import { medusaClient } from '../utils/medusaClient.js'

const logger = createLogger('Cart')
const CART_ID_KEY = 'medusa_cart_id'

/**
 * Loads cart data from browser storage.
 *
 * Attempts to load cart from multiple sources in order of preference:
 * 1. SessionStorage (persists within browser session even through refresh)
 * 2. localStorage (persists even when browser is closed)
 * 3. Empty array (fallback)
 *
 * @returns {Array} The cart items array or an empty array if nothing found
 */
function getStoredCart() {
	if (!browser) {return []}

	try {
		// Try to get cart from sessionStorage first (more recent)
		const sessionCart = sessionStorage.getItem('cart')
		if (sessionCart) {return JSON.parse(sessionCart)}

		// Fall back to localStorage
		const localCart = localStorage.getItem('cart')
		if (localCart) {
			// Copy from localStorage to sessionStorage
			const parsedCart = JSON.parse(localCart)
			sessionStorage.setItem('cart', localCart)
			return parsedCart
		}
	} catch (e) {
		logger.error('Error loading cart from storage:', e)
	}

	return []
}

/**
 * Helper function to persist cart to storage synchronously
 * @param {Array} cartItems - Cart items to persist
 */
function persistCart(cartItems) {
	if (!browser) {return}

	try {
		const cartJson = JSON.stringify(cartItems)
		sessionStorage.setItem('cart', cartJson)
		localStorage.setItem('cart', cartJson)
	} catch (e) {
		logger.error('Error saving cart to storage:', e)
	}
}

/**
 * Cart store containing all cart items
 * @type {import('svelte/store').Writable<Array>}
 */
export const cart = writable(getStoredCart())

// Persist cart state to browser storage when changes occur
if (browser) {
	cart.subscribe(value => {
		persistCart(value)
	})

	// Listen for storage events from other tabs/windows or synthetic events from tests
	window.addEventListener('storage', (event) => {
		if (event.key === 'cart' && event.newValue !== null) {
			try {
				const newCart = JSON.parse(event.newValue)
				// Update the store without triggering another persist cycle
				cart.set(newCart)
			} catch (e) {
				logger.error('Error parsing cart from storage event:', e)
			}
		} else if (event.key === 'cart' && event.newValue === null) {
			// Cart was cleared
			cart.set([])
		}
	})
}

/**
 * Adds a product to the cart. If the product already exists, increases quantity.
 *
 * @param {Object} product - The product to add to the cart
 * @param {string} product.id - The unique product ID
 * @param {string} [product.variant_id] - Optional variant ID if applicable
 * @param {number} [product.quantity=1] - Optional quantity (defaults to 1)
 * @returns {void}
 */
export function addToCart(product) {
	cart.update(items => {
		// Use variant_id if available, otherwise use product id
		const productId = product.variant_id || product.id

		const existingItem = items.find(item => (item.variant_id || item.id) === productId)

		let updatedCart
		if (existingItem) {
			// Update quantity of existing cart item
			updatedCart = items.map(item =>
				(item.variant_id || item.id) === productId
					? { ...item, quantity: item.quantity + (product.quantity || 1) }
					: item
			)
		} else {
			const newProduct = { ...product }
			if (!newProduct.quantity) {
				newProduct.quantity = 1
			}

			// Add as new cart item
			updatedCart = [ ...items, newProduct ]
		}

		// Persist synchronously BEFORE returning (fixes race condition)
		persistCart(updatedCart)
		return updatedCart
	})
}

/**
 * Removes a product from the cart.
 *
 * @param {string} productId - The ID of the product to remove
 * @returns {void}
 */
export function removeFromCart(productId) {
	cart.update(items => {
		const updatedCart = items.filter(item => (item.variant_id || item.id) !== productId)
		// Persist synchronously BEFORE returning (fixes race condition)
		persistCart(updatedCart)
		return updatedCart
	})
}

/**
 * Updates the quantity of a product in the cart.
 * If quantity is 0 or negative, the product is removed from the cart.
 *
 * @param {string} productId - The ID of the product to update
 * @param {number} quantity - The new quantity
 * @returns {void}
 */
export function updateQuantity(productId, quantity) {
	if (quantity <= 0) {
		removeFromCart(productId)
		return
	}

	cart.update(items => {
		const updatedCart = items.map(item =>
			(item.variant_id || item.id) === productId
				? { ...item, quantity }
				: item
		)
		// Persist synchronously BEFORE returning (fixes race condition)
		persistCart(updatedCart)
		return updatedCart
	})
}

/**
 * Removes all items from the cart.
 *
 * @returns {void}
 */
export function clearCart() {
	cart.set([])
	// Immediately persist empty cart
	persistCart([])
}

/**
 * Gets the current items in the cart.
 *
 * @returns {Array} Current cart items or empty array for server-side rendering
 */
export function getCartItems() {
	// Handle server-side rendering where stores aren't available
	if (!browser) {return []}

	return get(cart)
}

/**
 * Calculates the total price of all items in the cart.
 *
 * @returns {number} The total price of all items
 */
export function getCartTotal() {
	const items = getCartItems()
	return items.reduce((total, item) => total + (item.price * item.quantity), 0)
}

/**
 * Counts the total number of items in the cart (sum of quantities).
 *
 * @returns {number} The total count of items
 */
export function getCartCount() {
	const items = getCartItems()
	return items.reduce((count, item) => count + item.quantity, 0)
}

/**
 * Associates the current cart with a logged-in customer
 * @returns {Promise<void>}
 */
export async function associateWithCustomer() {
	if (!browser) {
		return
	}

	try {
		const cartId = localStorage.getItem(CART_ID_KEY)
		if (cartId) {
			// Update the existing cart with customer association
			await medusaClient.carts.update(cartId, {})
			logger.info('Cart associated with customer')
		}
	} catch (error) {
		logger.error('Failed to associate cart with customer:', error)
	}
}

/**
 * Resets the cart (used on logout)
 * @returns {Promise<void>}
 */
export function reset() {
	if (!browser) {
		return
	}

	// Clear cart ID
	localStorage.removeItem(CART_ID_KEY)
	sessionStorage.removeItem(CART_ID_KEY)

	// Clear cart items
	clearCart()

	logger.info('Cart reset')
}

// Export cart object with methods
export const cartStore = {
	subscribe: cart.subscribe,
	addToCart,
	removeFromCart,
	updateQuantity,
	clearCart,
	getCartItems,
	getCartTotal,
	getCartCount,
	associateWithCustomer,
	reset
}
