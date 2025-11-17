/**
 * Checkout Handler for SvelteKit
 *
 * Reusable checkout logic that can be imported into checkout routes
 * to handle the complete checkout flow with Medusa.
 */

import { redirect, error } from '@sveltejs/kit'
import { medusaServerClient } from '../utils/medusaServerClient.js'
import { createLogger } from '../utils/logger.js'
import { getBackendUrl } from '../config/urls.js'

const logger = createLogger('CheckoutHandler')

/**
 * Creates a subscription record for an order containing subscription items
 *
 * @param {Object} order - The completed Medusa order
 * @param {Object} cart - The original cart with subscription metadata
 */
async function createSubscriptionForOrder(order, cart) {
	logger.info('Creating subscription for order:', order.id)

	// Extract subscription items from cart
	const subscriptionItems = cart.items.filter(item => item.metadata?.subscription === true)

	if (subscriptionItems.length === 0) {
		logger.warn('No subscription items found in cart')
		return
	}

	// Extract variant IDs, product IDs, and quantities
	const variant_ids = subscriptionItems.map(item => item.variant_id)
	const product_ids = subscriptionItems.map(item => item.product_id || item.variant?.product_id)
	const quantities = {}
	subscriptionItems.forEach(item => {
		quantities[item.variant_id] = item.quantity
	})

	// Get subscription details from first item (assumes all items have same period)
	const subscriptionMetadata = subscriptionItems[0].metadata
	const interval = subscriptionMetadata.period || 'month'
	const interval_count = subscriptionMetadata.interval_count || 1
	const trial_period_days = subscriptionMetadata.trial_period_days || 0

	// Calculate dates
	const now = new Date()
	const start_date = now

	// Calculate trial end date if applicable
	let trial_end_date = null
	if (trial_period_days > 0) {
		trial_end_date = new Date(start_date)
		trial_end_date.setDate(trial_end_date.getDate() + trial_period_days)
	}

	// Calculate next billing date
	const billing_start = trial_end_date || start_date
	const next_billing_date = calculateNextBillingDate(billing_start, interval, interval_count)
	const current_period_end = next_billing_date

	// Extract payment method from order's payment collection
	let payment_method_id = null
	if (order.payment_collection?.payments && order.payment_collection.payments.length > 0) {
		const payment = order.payment_collection.payments[0]
		// Extract Stripe payment method ID if available
		if (payment.provider_id === 'stripe' && payment.data?.payment_method) {
			payment_method_id = payment.data.payment_method
		}
	}

	// Calculate subscription amount (total order amount)
	const amount = order.total

	// Prepare subscription data
	const subscriptionData = {
		customer_id: order.customer_id,
		interval,
		interval_count,
		amount,
		currency_code: order.currency_code,
		product_ids,
		variant_ids,
		quantities,
		region_id: order.region_id,
		shipping_address_id: order.shipping_address?.id || null,
		payment_method_id,
		trial_period_days,
		metadata: {
			initial_order_id: order.id,
			customer_email: order.email,
			created_via: 'checkout',
			billing_cycle_count: 0
		}
	}

	// Create subscription via backend API
	try {
		// Get backend URL from environment
		const backendUrl = getBackendUrl()

		const response = await fetch(`${backendUrl}/store/subscriptions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(subscriptionData)
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(`Failed to create subscription: ${errorData.message || response.statusText}`)
		}

		const result = await response.json()
		logger.info('Successfully created subscription:', result.subscription.id)
		return result.subscription
	} catch (error) {
		logger.error('Failed to create subscription via API:', error)
		throw error
	}
}

/**
 * Send alert to admin about subscription creation failure
 *
 * @param {Object} order - The completed order
 * @param {Object} cart - The original cart
 * @param {Error} error - The subscription error
 * @param {Object} errorData - Structured error data
 */
async function sendSubscriptionFailureAlert(order, cart, error, errorData) {
	const backendUrl = getBackendUrl()

	try {
		await fetch(`${backendUrl}/admin/alert`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				subject: `Subscription Creation Failed for Order ${order.id}`,
				message: `Payment succeeded but subscription creation failed for customer ${order.email}.\n\nOrder ID: ${order.id}\nError: ${error.message}\n\nIMMediate action required: Create subscription manually using recovery data below.`,
				severity: 'critical',
				data: errorData
			})
		})

		logger.info('Subscription failure alert sent to admin')
	} catch (alertError) {
		// Silently fail - this is a best-effort alert
		logger.warn('Could not send admin alert', {
			error: alertError.message
		})
	}
}

/**
 * Calculate next billing date based on interval
 *
 * @param {Date} fromDate - Starting date
 * @param {string} interval - 'day', 'week', 'month', or 'year'
 * @param {number} count - Interval multiplier
 * @returns {Date}
 */
function calculateNextBillingDate(fromDate, interval, count = 1) {
	const nextDate = new Date(fromDate)

	switch (interval.toLowerCase()) {
		case 'day':
			nextDate.setDate(nextDate.getDate() + count)
			break
		case 'week':
			nextDate.setDate(nextDate.getDate() + (count * 7))
			break
		case 'month':
			nextDate.setMonth(nextDate.getMonth() + count)
			break
		case 'year':
			nextDate.setFullYear(nextDate.getFullYear() + count)
			break
		default:
			// Default to monthly if invalid interval
			nextDate.setMonth(nextDate.getMonth() + count)
	}

	return nextDate
}

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
					// Get cart details before completion to check for subscription metadata
					const { cart } = await medusaServerClient.carts.retrieve(cartId)
					const hasSubscription = cart?.items?.some(item => item.metadata?.subscription === true)

					// Complete the cart and create an order
					const { type, data } = await medusaServerClient.carts.complete(cartId)

					if (type === 'order' && data) {
						// If order contains subscription items, create subscription record
						if (hasSubscription) {
							try {
								await createSubscriptionForOrder(data, cart)
							} catch (subscriptionError) {
								// Prepare comprehensive error data for logging and alerting
								const errorData = {
									error: subscriptionError.message,
									stack: subscriptionError.stack,
									orderId: data.id,
									customerEmail: data.email,
									customerId: data.customer_id,
									orderTotal: data.total,
									currencyCode: data.currency_code,
									subscriptionItems: cart.items
										.filter(item => item.metadata?.subscription === true)
										.map(item => ({
											variant_id: item.variant_id,
											product_id: item.product_id,
											quantity: item.quantity,
											period: item.metadata?.period
										})),
									timestamp: new Date().toISOString(),
									// Manual recovery information
									recovery: {
										instructions: 'Create subscription manually via admin panel or API',
										endpoint: '/admin/subscriptions',
										requiredData: 'See subscriptionItems above'
									}
								}

								// Log error but don't fail the order since payment was successful
								logger.error('CRITICAL: Failed to create subscription for order', errorData)

								// Send admin alert (fire-and-forget, don't block checkout)
								sendSubscriptionFailureAlert(data, cart, subscriptionError, errorData).catch(alertError => {
									logger.error('Failed to send subscription failure alert', {
										error: alertError.message
									})
								})
							}
						}

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