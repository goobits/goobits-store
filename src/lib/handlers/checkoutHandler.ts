/**
 * Checkout Handler for SvelteKit
 *
 * Reusable checkout logic that can be imported into checkout routes
 * to handle the complete checkout flow with Medusa.
 */

import { redirect, error, type RequestEvent } from '@sveltejs/kit'
 
// @ts-ignore - medusaServerClient module lacks type declarations
import { medusaServerClient } from '../utils/medusaServerClient.js'
import { createLogger } from '../utils/logger.js'
import { getBackendUrl } from '../config/urls.js'

const logger = createLogger('CheckoutHandler')

// Medusa cart item with subscription metadata
interface CartItem {
	variant_id: string
	product_id?: string
	quantity: number
	metadata?: {
		subscription?: boolean
		period?: string
		interval_count?: number
		trial_period_days?: number
	}
	variant?: {
		product_id?: string
	}
}

// Medusa cart with items
interface CartWithItems {
	id: string
	items: CartItem[]
	payment_sessions?: Array<{ provider_id: string }> | null
	shipping_methods?: Array<{ id: string }>
}

// Medusa order structure
interface MedusaOrderData {
	id: string
	customer_id: string
	email: string
	total: number
	currency_code: string
	region_id: string
	shipping_address?: {
		id?: string
	}
	payment_collection?: {
		payments?: Array<{
			provider_id: string
			data?: {
				payment_method?: string
			}
		}>
	}
}

// Subscription data to be sent to backend
interface SubscriptionData {
	customer_id: string
	interval: string
	interval_count: number
	amount: number
	currency_code: string
	product_ids: (string | undefined)[]
	variant_ids: string[]
	quantities: Record<string, number>
	region_id: string
	shipping_address_id: string | null
	payment_method_id: string | null
	trial_period_days: number
	metadata: {
		initial_order_id: string
		customer_email: string
		created_via: string
		billing_cycle_count: number
	}
}

// Subscription creation response
interface SubscriptionResponse {
	subscription: {
		id: string
	}
}

// Error data for subscription failures
interface SubscriptionErrorData {
	error: string
	stack?: string
	orderId: string
	customerEmail: string
	customerId: string
	orderTotal: number
	currencyCode: string
	subscriptionItems: Array<{
		variant_id: string
		product_id?: string
		quantity: number
		period?: string
	}>
	timestamp: string
	recovery: {
		instructions: string
		endpoint: string
		requiredData: string
	}
}

// Checkout handler options
interface CheckoutHandlerOptions {
	cartRedirectPath?: string
}

// Checkout load result
interface CheckoutLoadResult {
	cart: MedusaCart
	regions: MedusaRegion[]
	defaultRegion: MedusaRegion | null
	shippingOptions: Array<{ id: string; name: string; amount: number }>
}

// Action result types
interface ActionSuccessResult {
	success: true
	cart?: MedusaCart
	order?: MedusaOrderData
}

interface ActionErrorResult {
	success: false
	error: string
	requiresAction?: boolean
	cart?: MedusaCart
}

type ActionResult = ActionSuccessResult | ActionErrorResult

// Shipping address form data
interface ShippingAddressData {
	first_name: FormDataEntryValue | null
	last_name: FormDataEntryValue | null
	address_1: FormDataEntryValue | null
	address_2: FormDataEntryValue | null
	city: FormDataEntryValue | null
	province: FormDataEntryValue | null
	postal_code: FormDataEntryValue | null
	country_code: FormDataEntryValue | null
	phone: FormDataEntryValue | null
}

async function createSubscriptionForOrder(order: MedusaOrderData, cart: CartWithItems): Promise<SubscriptionResponse['subscription'] | undefined> {
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
	const quantities: Record<string, number> = {}
	subscriptionItems.forEach(item => {
		quantities[item.variant_id] = item.quantity
	})

	// Get subscription details from first item (assumes all items have same period)
	// We already checked subscriptionItems.length > 0 above
	const firstItem = subscriptionItems[0]!
	const subscriptionMetadata = firstItem.metadata!
	const interval = subscriptionMetadata.period || 'month'
	const interval_count = subscriptionMetadata.interval_count || 1
	const trial_period_days = subscriptionMetadata.trial_period_days || 0

	// Calculate dates
	const now = new Date()
	const start_date = now

	// Calculate trial end date if applicable
	let trial_end_date: Date | null = null
	if (trial_period_days > 0) {
		trial_end_date = new Date(start_date)
		trial_end_date.setDate(trial_end_date.getDate() + trial_period_days)
	}

	// Calculate next billing date (used for subscription record)
	const billing_start = trial_end_date || start_date
	// Note: next_billing_date calculated for future use in subscription metadata
	void calculateNextBillingDate(billing_start, interval, interval_count)

	// Extract payment method from order's payment collection
	let payment_method_id: string | null = null
	const payments = order.payment_collection?.payments
	if (payments && payments.length > 0) {
		const payment = payments[0]
		// Extract Stripe payment method ID if available
		if (payment && payment.provider_id === 'stripe' && payment.data?.payment_method) {
			payment_method_id = payment.data.payment_method
		}
	}

	// Calculate subscription amount (total order amount)
	const amount = order.total

	// Prepare subscription data
	const subscriptionData: SubscriptionData = {
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
			const errorData = await response.json() as { message?: string }
			throw new Error(`Failed to create subscription: ${errorData.message || response.statusText}`)
		}

		const result = await response.json() as SubscriptionResponse
		logger.info('Successfully created subscription:', result.subscription.id)
		return result.subscription
	} catch (err) {
		logger.error('Failed to create subscription via API:', err)
		throw err
	}
}

async function sendSubscriptionFailureAlert(
	order: MedusaOrderData,
	_cart: CartWithItems,
	err: Error,
	errorData: SubscriptionErrorData
): Promise<void> {
	const backendUrl = getBackendUrl()

	try {
		await fetch(`${backendUrl}/admin/alert`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				subject: `Subscription Creation Failed for Order ${order.id}`,
				message: `Payment succeeded but subscription creation failed for customer ${order.email}.\n\nOrder ID: ${order.id}\nError: ${err.message}\n\nIMMediate action required: Create subscription manually using recovery data below.`,
				severity: 'critical',
				data: errorData
			})
		})

		logger.info('Subscription failure alert sent to admin')
	} catch (alertError) {
		// Silently fail - this is a best-effort alert
		logger.warn('Could not send admin alert', {
			error: (alertError as Error).message
		})
	}
}

function calculateNextBillingDate(fromDate: Date, interval: string, count: number = 1): Date {
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
 */
export function createCheckoutHandler(options: CheckoutHandlerOptions = {}): {
	load: (event: { url: URL }) => Promise<CheckoutLoadResult>
	actions: {
		updateCustomer: (event: RequestEvent) => Promise<ActionResult>
		addShippingAddress: (event: RequestEvent) => Promise<ActionResult>
		addShippingMethod: (event: RequestEvent) => Promise<ActionResult>
		updatePayment: (event: RequestEvent) => Promise<ActionResult>
		completeCart: (event: RequestEvent) => Promise<ActionResult>
	}
} {
	const {
		cartRedirectPath = '/shop/cart'
	} = options

	return {
		load: async ({ url }): Promise<CheckoutLoadResult> => {
			const cartId = url.searchParams.get('cart_id')

			if (!cartId) {
				throw redirect(302, cartRedirectPath)
			}

			try {
				logger.info('Loading checkout for cart:', cartId)
				// Get the cart from Medusa
				const { cart } = await medusaServerClient.carts.retrieve(cartId) as { cart: MedusaCart }
				logger.info('Retrieved cart successfully:', cart.id)

				if (!cart) {
					throw redirect(302, cartRedirectPath)
				}

				// Get regions for shipping
				logger.info('Fetching regions...')
				const { regions } = await medusaServerClient.regions.list() as { regions: MedusaRegion[] }
				logger.info('Fetched regions:', regions?.length)

				// Default to first region
				const defaultRegion: MedusaRegion | null = regions && regions.length > 0 ? regions[0] ?? null : null

				// Get shipping options for the cart
				logger.info('Fetching shipping options...')
				let shippingOptions: Array<{ id: string; name: string; amount: number }> = []
				if (defaultRegion && cart.id) {
					try {
						// Use query parameter to filter shipping options by cart_id
						const { shipping_options } = await medusaServerClient.shippingOptions.list({
							cart_id: cart.id
						} as Record<string, unknown>) as { shipping_options: Array<{ id: string; name: string; amount: number }> }
						shippingOptions = shipping_options || []
						logger.info('Fetched shipping options:', shippingOptions.length)
					} catch (err) {
						logger.warn('Could not fetch shipping options:', (err as Error).message)
						// Continue without shipping options - they may not be configured yet
						shippingOptions = []
					}
				}

				logger.info('About to check payment sessions...')
				const cartWithSessions = cart as unknown as CartWithItems
				logger.info('Cart payment_sessions:', cartWithSessions.payment_sessions)
				logger.info('Cart shipping_methods:', cartWithSessions.shipping_methods?.length || 0)
				// Check if payment sessions exist, initialize if needed
				if (cartWithSessions.payment_sessions === null && cartWithSessions.shipping_methods && cartWithSessions.shipping_methods.length > 0) {
					logger.info('Creating payment sessions...')
					try {
						// Create payment sessions
						await medusaServerClient.carts.createPaymentSessions(cartId)

						// Get updated cart with payment sessions
						const { cart: updatedCart } = await medusaServerClient.carts.retrieve(cartId) as { cart: MedusaCart }
						const updatedCartWithSessions = updatedCart as unknown as CartWithItems

						// If Stripe payment method is available, select it
						if (updatedCartWithSessions.payment_sessions && updatedCartWithSessions.payment_sessions.some(s => s.provider_id === 'stripe')) {
							await medusaServerClient.carts.setPaymentSession(cartId, {
								provider_id: 'stripe'
							})

							// Get final cart with selected payment session
							const { cart: finalCart } = await medusaServerClient.carts.retrieve(cartId) as { cart: MedusaCart }
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
				logger.error('Error stack:', (err as Error).stack)
				logger.error('Error response:', (err as { response?: { data?: unknown } }).response?.data)

				throw error(500, {
					message: 'Error loading checkout information',
					details: (err as Error).message
				} as App.Error)
			}
		},

		actions: {
			// Action to update cart with customer information
			updateCustomer: async ({ request }: RequestEvent): Promise<ActionResult> => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id') as string | null
				const email = formData.get('email') as string | null
				const firstName = formData.get('first_name') as string | null
				const lastName = formData.get('last_name') as string | null

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
					} as Record<string, unknown>) as { cart: MedusaCart }

					return { success: true, cart }
				} catch (err) {
					logger.error('Error updating customer:', err)
					return { success: false, error: (err as Error).message }
				}
			},

			// Action to add shipping address
			addShippingAddress: async ({ request }: RequestEvent): Promise<ActionResult> => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id') as string | null

				if (!cartId) {
					return { success: false, error: 'Missing cart ID' }
				}

				const shipping: ShippingAddressData = {
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
					} as Record<string, unknown>) as { cart: MedusaCart }

					return { success: true, cart }
				} catch (err) {
					logger.error('Error adding shipping address:', err)
					return { success: false, error: (err as Error).message }
				}
			},

			// Action to add shipping method
			addShippingMethod: async ({ request }: RequestEvent): Promise<ActionResult> => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id') as string | null
				const shippingOptionId = formData.get('shipping_option_id') as string | null

				if (!cartId || !shippingOptionId) {
					return { success: false, error: 'Missing required fields' }
				}

				try {
					// Add shipping method to cart
					const { cart } = await medusaServerClient.carts.addShippingMethod(cartId, {
						option_id: shippingOptionId
					}) as { cart: MedusaCart }

					// Create payment sessions after adding shipping method
					try {
						await medusaServerClient.carts.createPaymentSessions(cartId)

						// Get updated cart with payment sessions
						const { cart: updatedCart } = await medusaServerClient.carts.retrieve(cartId) as { cart: MedusaCart }
						const updatedCartWithSessions = updatedCart as unknown as CartWithItems

						// Select Stripe as the payment provider if available
						if (updatedCartWithSessions.payment_sessions && updatedCartWithSessions.payment_sessions.some(s => s.provider_id === 'stripe')) {
							await medusaServerClient.carts.setPaymentSession(cartId, {
								provider_id: 'stripe'
							})

							// Get final cart with selected payment
							const { cart: finalCart } = await medusaServerClient.carts.retrieve(cartId) as { cart: MedusaCart }
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
					return { success: false, error: (err as Error).message }
				}
			},

			// Action to update payment session
			updatePayment: async ({ request }: RequestEvent): Promise<ActionResult> => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id') as string | null
				const providerId = (formData.get('provider_id') as string | null) || 'stripe'

				if (!cartId) {
					return { success: false, error: 'Missing cart ID' }
				}

				try {
					// Ensure we have payment sessions
					const { cart } = await medusaServerClient.carts.retrieve(cartId) as { cart: MedusaCart }
					const cartWithSessions = cart as unknown as CartWithItems

					if (!cartWithSessions.payment_sessions || cartWithSessions.payment_sessions.length === 0) {
						// Create payment sessions if they don't exist
						await medusaServerClient.carts.createPaymentSessions(cartId)
					}

					// Select the payment provider
					await medusaServerClient.carts.setPaymentSession(cartId, {
						provider_id: providerId
					})

					// Get updated cart
					const { cart: updatedCart } = await medusaServerClient.carts.retrieve(cartId) as { cart: MedusaCart }

					return { success: true, cart: updatedCart }
				} catch (err) {
					logger.error('Error updating payment session:', err)
					return { success: false, error: (err as Error).message }
				}
			},

			// Action to complete cart and create an order
			completeCart: async ({ request }: RequestEvent): Promise<ActionResult> => {
				const formData = await request.formData()
				const cartId = formData.get('cart_id') as string | null

				if (!cartId) {
					return { success: false, error: 'Missing cart ID' }
				}

				try {
					// Get cart details before completion to check for subscription metadata
					const { cart } = await medusaServerClient.carts.retrieve(cartId) as { cart: MedusaCart }
					const cartWithItems = cart as unknown as CartWithItems
					const hasSubscription = cartWithItems?.items?.some(item => item.metadata?.subscription === true)

					// Complete the cart and create an order
					const { type, data } = await medusaServerClient.carts.complete(cartId) as {
						type: 'order' | 'cart'
						data: MedusaOrderData | MedusaCart
					}

					if (type === 'order' && data) {
						const orderData = data as MedusaOrderData
						// If order contains subscription items, create subscription record
						if (hasSubscription) {
							try {
								await createSubscriptionForOrder(orderData, cartWithItems)
							} catch (subscriptionError) {
								// Prepare comprehensive error data for logging and alerting
								const errorData: SubscriptionErrorData = {
									error: (subscriptionError as Error).message,
									stack: (subscriptionError as Error).stack,
									orderId: orderData.id,
									customerEmail: orderData.email,
									customerId: orderData.customer_id,
									orderTotal: orderData.total,
									currencyCode: orderData.currency_code,
									subscriptionItems: cartWithItems.items
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
								sendSubscriptionFailureAlert(orderData, cartWithItems, subscriptionError as Error, errorData).catch(alertError => {
									logger.error('Failed to send subscription failure alert', {
										error: (alertError as Error).message
									})
								})
							}
						}

						return {
							success: true,
							order: orderData
						}
					} else if (type === 'cart') {
						// Payment requires additional action (like 3D Secure)
						return {
							success: false,
							requiresAction: true,
							error: 'Additional payment authentication required',
							cart: data as MedusaCart
						}
					} else {
						return {
							success: false,
							error: 'Could not complete order'
						}
					}
				} catch (err) {
					logger.error('Error completing cart:', err)
					return { success: false, error: (err as Error).message }
				}
			}
		}
	}
}
