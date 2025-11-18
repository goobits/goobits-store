/**
 * Medusa Payment Service
 *
 * This service handles interactions with the Medusa API for payment processing.
 * It provides methods to create and manage payment sessions for checkout.
 */

import { medusaClient } from '../utils/medusaClient.js'
import { writable } from 'svelte/store'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('MedusaPayment')

// Store for payment session state
export const paymentSessionError = writable(null)
export const paymentSessionLoading = writable(false)
export const paymentProviders = writable([])

/**
 * Get available payment providers for a cart
 * @param {string} cartId - The cart ID
 * @returns {Promise<Array>} List of available payment providers
 */
export const getPaymentProviders = async (cartId) => {
	if (!cartId) {
		paymentSessionError.set('No cart ID provided')
		return []
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const { payment_providers } = await medusaClient.carts.listPaymentProviders(cartId)
		paymentProviders.set(payment_providers || [])
		return payment_providers || []
	} catch (error) {
		logger.error('Error fetching payment providers:', error)
		paymentSessionError.set(error.message || 'Failed to get payment providers')
		return []
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Create payment sessions for a cart
 * @param {string} cartId - The cart ID
 * @returns {Promise<Object>} Updated cart with payment sessions
 */
export const createPaymentSessions = async (cartId) => {
	if (!cartId) {
		paymentSessionError.set('No cart ID provided')
		return null
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const { cart } = await medusaClient.carts.createPaymentSessions(cartId)
		return cart
	} catch (error) {
		logger.error('Error creating payment sessions:', error)
		paymentSessionError.set(error.message || 'Failed to create payment session')
		return null
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Select a payment provider for the cart
 * @param {string} cartId - The cart ID
 * @param {string} providerId - The payment provider ID (e.g., 'stripe')
 * @returns {Promise<Object>} Updated cart with selected payment session
 */
export const selectPaymentSession = async (cartId, providerId) => {
	if (!cartId || !providerId) {
		paymentSessionError.set('Cart ID and payment provider ID are required')
		return null
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const { cart } = await medusaClient.carts.setPaymentSession(cartId, {
			provider_id: providerId
		})
		return cart
	} catch (error) {
		logger.error('Error selecting payment session:', error)
		paymentSessionError.set(error.message || 'Failed to select payment session')
		return null
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Update payment session data
 * @param {string} cartId - The cart ID
 * @param {string} providerId - The payment provider ID
 * @param {Object} data - The payment session data to update
 * @returns {Promise<Object>} Updated cart
 */
export const updatePaymentSession = async (cartId, providerId, data) => {
	if (!cartId || !providerId) {
		paymentSessionError.set('Cart ID and payment provider ID are required')
		return null
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const { cart } = await medusaClient.carts.updatePaymentSession(cartId, providerId, data)
		return cart
	} catch (error) {
		logger.error('Error updating payment session:', error)
		paymentSessionError.set(error.message || 'Failed to update payment session')
		return null
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Complete a cart with payment
 * @param {string} cartId - The cart ID
 * @returns {Promise<Object>} The created order
 */
export const completeCart = async (cartId) => {
	if (!cartId) {
		paymentSessionError.set('No cart ID provided')
		return null
	}

	paymentSessionLoading.set(true)
	paymentSessionError.set(null)

	try {
		const { order } = await medusaClient.carts.complete(cartId)
		return order
	} catch (error) {
		logger.error('Error completing cart:', error)
		paymentSessionError.set(error.message || 'Failed to complete order')
		throw error
	} finally {
		paymentSessionLoading.set(false)
	}
}

/**
 * Get payment session data from a cart
 * @param {Object} cart - The cart object
 * @param {string} providerId - The payment provider ID
 * @returns {Object|null} The payment session data or null if not found
 */
export const getPaymentSessionData = (cart, providerId = 'stripe') => {
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
 * @param {Object} cart - The cart object
 * @returns {string|null} Stripe client secret or null if not found
 */
export const getStripeClientSecret = (cart) => {
	const sessionData = getPaymentSessionData(cart, 'stripe')

	if (!sessionData || !sessionData.client_secret) {
		return null
	}

	return sessionData.client_secret
}
