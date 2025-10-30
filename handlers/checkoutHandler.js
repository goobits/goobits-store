/**
 * Checkout Handler for SvelteKit
 *
 * Reusable checkout logic that can be imported into checkout routes
 * to handle the complete checkout flow with Medusa.
 */

import { redirect, error } from '@sveltejs/kit'
import { medusaServerClient } from '@lib/medusa/server-client.js'
import { Logger } from '@lib/utils/Logger.js'

const logger = new Logger('CheckoutHandler')

/**
 * Creates a checkout page handler for +page.server.js
 *
 * @example
 * // In your routes/shop/checkout/+page.server.js
 * import { createCheckoutHandler } from '@goobits/store/handlers'
 * export const { load, actions } = createCheckoutHandler()
 *
 * @param {Object} options - Configuration options
 * @param {string} [options.cartRedirectPath='/shop/cart'] - Where to redirect if no cart
 * @returns {Object} Object with load function and actions
 */
export function createCheckoutHandler(options = {}) {
	const {
		cartRedirectPath = '/shop/cart'
	} = options

	return {
		load: async ({ url }) => {
			const cartId = url.searchParams.get('cart_id')

			if (!cartId) {
				throw redirect(302, cartRedirectPath)
			}

			try {
				logger.info('Loading checkout for cart:', cartId)
				// Get the cart from Medusa
				const { cart } = await medusaServerClient.carts.retrieve(cartId)
				logger.info('Retrieved cart successfully:', cart.id)

				if (!cart) {
					throw redirect(302, cartRedirectPath)
				}

				// Get regions for shipping
				logger.info('Fetching regions...')
				const { regions } = await medusaServerClient.regions.list()
				logger.info('Fetched regions:', regions?.length)

				// Default to first region
				const defaultRegion = regions && regions.length > 0 ? regions[0] : null

				// Get shipping options for the cart
				logger.info('Fetching shipping options...')
				let shippingOptions = []
				if (defaultRegion && cart.id) {
					try {
						// Use query parameter to filter shipping options by cart_id
						const { shipping_options } = await medusaServerClient.shippingOptions.list({
							cart_id: cart.id
						})
						shippingOptions = shipping_options || []
						logger.info('Fetched shipping options:', shippingOptions.length)
					} catch (err) {
						logger.warn('Could not fetch shipping options:', err.message)
						// Continue without shipping options - they may not be configured yet
						shippingOptions = []
					}
				}

				logger.info('About to check payment sessions...')
				logger.info('Cart payment_sessions:', cart.payment_sessions)
				logger.info('Cart shipping_methods:', cart.shipping_methods?.length || 0)
				// Check if payment sessions exist, initialize if needed
				if (cart.payment_sessions === null && cart.shipping_methods && cart.shipping_methods.length > 0) {
					logger.info('Creating payment sessions...')
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
								cart: finalCart,
								regions,
								defaultRegion,
								shippingOptions
							}
						}

						return {
							cart: updatedCart,
							regions,
							defaultRegion,
							shippingOptions
						}
					} catch (e) {
						logger.error('Failed to initialize payment sessions:', e)
						// Continue with the original cart if payment session initialization fails
					}
				}

				logger.info('Returning checkout data...')
				return {
					cart,
					regions,
					defaultRegion,
					shippingOptions
				}
			} catch (err) {
				logger.error('Error loading cart:', err)
				logger.error('Error stack:', err.stack)
				logger.error('Error response:', err.response?.data)

				throw error(500, {
					message: 'Error loading checkout information',
					details: err.message
				})
			}
		},

		actions: {
			// Action to update cart with customer information
			updateCustomer: async ({ request }) => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id')
				const email = formData.get('email')
				const firstName = formData.get('first_name')
				const lastName = formData.get('last_name')

				if (!cartId || !email) {
					return { success: false, error: 'Missing required fields' }
				}

				try {
					// Update the cart with customer information
					const { cart } = await medusaServerClient.carts.update(cartId, {
						email,
						customer: {
							email,
							first_name: firstName,
							last_name: lastName
						}
					})

					return { success: true, cart }
				} catch (err) {
					logger.error('Error updating customer:', err)
					return { success: false, error: err.message }
				}
			},

			// Action to add shipping address
			addShippingAddress: async ({ request }) => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id')

				const shipping = {
					first_name: formData.get('first_name'),
					last_name: formData.get('last_name'),
					address_1: formData.get('address_1'),
					address_2: formData.get('address_2') || '',
					city: formData.get('city'),
					province: formData.get('province') || '',
					postal_code: formData.get('postal_code'),
					country_code: formData.get('country_code'),
					phone: formData.get('phone') || ''
				}

				try {
					// Update cart with shipping address
					const { cart } = await medusaServerClient.carts.update(cartId, {
						shipping_address: shipping
					})

					return { success: true, cart }
				} catch (err) {
					logger.error('Error adding shipping address:', err)
					return { success: false, error: err.message }
				}
			},

			// Action to add shipping method
			addShippingMethod: async ({ request }) => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id')
				const shippingOptionId = formData.get('shipping_option_id')

				if (!cartId || !shippingOptionId) {
					return { success: false, error: 'Missing required fields' }
				}

				try {
					// Add shipping method to cart
					const { cart } = await medusaServerClient.carts.addShippingMethod(cartId, {
						option_id: shippingOptionId
					})

					// Create payment sessions after adding shipping method
					try {
						await medusaServerClient.carts.createPaymentSessions(cartId)

						// Get updated cart with payment sessions
						const { cart: updatedCart } = await medusaServerClient.carts.retrieve(cartId)

						// Select Stripe as the payment provider if available
						if (updatedCart.payment_sessions && updatedCart.payment_sessions.some(s => s.provider_id === 'stripe')) {
							await medusaServerClient.carts.setPaymentSession(cartId, {
								provider_id: 'stripe'
							})

							// Get final cart with selected payment
							const { cart: finalCart } = await medusaServerClient.carts.retrieve(cartId)
							return { success: true, cart: finalCart }
						}

						return { success: true, cart: updatedCart }
					} catch (e) {
						logger.error('Error initializing payment:', e)
						// Return the original cart if payment initialization fails
						return { success: true, cart }
					}
				} catch (err) {
					logger.error('Error adding shipping method:', err)
					return { success: false, error: err.message }
				}
			},

			// Action to update payment session
			updatePayment: async ({ request }) => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id')
				const providerId = formData.get('provider_id') || 'stripe'

				if (!cartId) {
					return { success: false, error: 'Missing cart ID' }
				}

				try {
					// Ensure we have payment sessions
					const { cart } = await medusaServerClient.carts.retrieve(cartId)

					if (!cart.payment_sessions || cart.payment_sessions.length === 0) {
						// Create payment sessions if they don't exist
						await medusaServerClient.carts.createPaymentSessions(cartId)
					}

					// Select the payment provider
					await medusaServerClient.carts.setPaymentSession(cartId, {
						provider_id: providerId
					})

					// Get updated cart
					const { cart: updatedCart } = await medusaServerClient.carts.retrieve(cartId)

					return { success: true, cart: updatedCart }
				} catch (err) {
					logger.error('Error updating payment session:', err)
					return { success: false, error: err.message }
				}
			},

			// Action to complete cart and create an order
			completeCart: async ({ request }) => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id')

				if (!cartId) {
					return { success: false, error: 'Missing cart ID' }
				}

				try {
					// Complete the cart and create an order
					const { type, data } = await medusaServerClient.carts.complete(cartId)

					if (type === 'order' && data) {
						return {
							success: true,
							order: data
						}
					} else if (type === 'cart') {
						// Payment requires additional action (like 3D Secure)
						return {
							success: false,
							requiresAction: true,
							error: 'Additional payment authentication required',
							cart: data
						}
					} else {
						return {
							success: false,
							error: 'Could not complete order'
						}
					}
				} catch (err) {
					logger.error('Error completing cart:', err)
					return { success: false, error: err.message }
				}
			}
		}
	}
}