/**
 * Medusa Payment Service
 *
 * This service handles interactions with the Medusa API for payment processing.
 * It provides methods to create and manage payment sessions for checkout.
 */

import { medusaClient } from '../utils/medusaClient.js'
import { writable, type Writable } from 'svelte/store'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('MedusaPayment')

export interface PaymentProvider {
	id: string;
	is_installed?: boolean;
}

export interface PaymentSession {
	id: string;
	provider_id: string;
	data: PaymentSessionData;
	status?: string;
	amount?: number;
}

export interface PaymentSessionData {
	client_secret?: string;
	[key: string]: unknown;
}

export interface Cart {
	id: string;
	payment_sessions?: PaymentSession[];
	[key: string]: unknown;
}

export interface Order {
	id: string;
	[key: string]: unknown;
}

// Type for Medusa client carts resource with extended methods
interface CartsResourceExtended {
	listPaymentProviders(cartId: string): Promise<{ payment_providers: PaymentProvider[] }>;
	createPaymentSessions(cartId: string): Promise<{ cart: Cart }>;
	setPaymentSession(cartId: string, data: { provider_id: string }): Promise<{ cart: Cart }>;
	updatePaymentSession(cartId: string, providerId: string, data: Record<string, unknown>): Promise<{ cart: Cart }>;
	complete(cartId: string): Promise<{ type: string; data: Order }>;
	update(cartId: string, data: Record<string, unknown>): Promise<{ cart: Cart }>;
}

// Store for payment session state
export const paymentSessionError: Writable<string | null> = writable(null)
export const paymentSessionLoading: Writable<boolean> = writable(false)
export const paymentProviders: Writable<PaymentProvider[]> = writable([])

/**
 * Get available payment providers for a cart
 * @param cartId - The cart ID
 * @returns List of available payment providers
 */
export const getPaymentProviders = async (cartId: string): Promise<PaymentProvider[]> => {
	if (!cartId) {
		paymentSessionError.set('No cart ID provided')
		return []
	}

	if (!medusaClient) {
		paymentSessionError.set('Medusa client not initialized')
		return []
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const carts = medusaClient.carts as unknown as CartsResourceExtended
		const { payment_providers } = await carts.listPaymentProviders(cartId)
		paymentProviders.set(payment_providers || [])
		return payment_providers || []
	} catch (error) {
		logger.error('Error fetching payment providers:', error)
		paymentSessionError.set((error as Error).message || 'Failed to get payment providers')
		return []
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Create payment sessions for a cart
 * @param cartId - The cart ID
 * @returns Updated cart with payment sessions
 */
export const createPaymentSessions = async (cartId: string): Promise<Cart | null> => {
	if (!cartId) {
		paymentSessionError.set('No cart ID provided')
		return null
	}

	if (!medusaClient) {
		paymentSessionError.set('Medusa client not initialized')
		return null
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const { cart } = await medusaClient.carts.createPaymentSessions(cartId)
		return cart as Cart
	} catch (error) {
		logger.error('Error creating payment sessions:', error)
		paymentSessionError.set((error as Error).message || 'Failed to create payment session')
		return null
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Select a payment provider for the cart
 * @param cartId - The cart ID
 * @param providerId - The payment provider ID (e.g., 'stripe')
 * @returns Updated cart with selected payment session
 */
export const selectPaymentSession = async (cartId: string, providerId: string): Promise<Cart | null> => {
	if (!cartId || !providerId) {
		paymentSessionError.set('Cart ID and payment provider ID are required')
		return null
	}

	if (!medusaClient) {
		paymentSessionError.set('Medusa client not initialized')
		return null
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const { cart } = await medusaClient.carts.setPaymentSession(cartId, {
			provider_id: providerId
		})
		return cart as Cart
	} catch (error) {
		logger.error('Error selecting payment session:', error)
		paymentSessionError.set((error as Error).message || 'Failed to select payment session')
		return null
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Update payment session data
 * @param cartId - The cart ID
 * @param providerId - The payment provider ID
 * @param data - The payment session data to update
 * @returns Updated cart
 */
export const updatePaymentSession = async (
	cartId: string,
	providerId: string,
	data: Record<string, unknown>
): Promise<Cart | null> => {
	if (!cartId || !providerId) {
		paymentSessionError.set('Cart ID and payment provider ID are required')
		return null
	}

	if (!medusaClient) {
		paymentSessionError.set('Medusa client not initialized')
		return null
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const carts = medusaClient.carts as unknown as CartsResourceExtended
		const { cart } = await carts.updatePaymentSession(cartId, providerId, data)
		return cart as Cart
	} catch (error) {
		logger.error('Error updating payment session:', error)
		paymentSessionError.set((error as Error).message || 'Failed to update payment session')
		return null
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Complete a cart with payment
 * @param cartId - The cart ID
 * @returns The created order
 */
export const completeCart = async (cartId: string): Promise<Order | null> => {
	if (!cartId) {
		paymentSessionError.set('No cart ID provided')
		return null
	}

	if (!medusaClient) {
		paymentSessionError.set('Medusa client not initialized')
		return null
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const result = await medusaClient.carts.complete(cartId)
		// The complete response has { type: 'order', data: Order }
		return (result as unknown as { type: string; data: Order }).data
	} catch (error) {
		logger.error('Error completing cart:', error)
		paymentSessionError.set((error as Error).message || 'Failed to complete order')
		throw error
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Get payment session data from a cart
 * @param cart - The cart object
 * @param providerId - The payment provider ID
 * @returns The payment session data or null if not found
 */
export const getPaymentSessionData = (cart: Cart | null, providerId: string = 'stripe'): PaymentSessionData | null => {
	if (!cart || !cart.payment_sessions) {
		return null
	}

	const session = cart.payment_sessions.find(s => s.provider_id === providerId)

	if (!session || !session.data) {
		return null
	}

	return session.data
}

/**
 * Get client secret from Stripe payment session
 * @param cart - The cart object
 * @returns Stripe client secret or null if not found
 */
export const getStripeClientSecret = (cart: Cart | null): string | null => {
	const sessionData = getPaymentSessionData(cart, 'stripe')

	if (!sessionData || !sessionData.client_secret) {
		return null
	}

	return sessionData.client_secret
}
