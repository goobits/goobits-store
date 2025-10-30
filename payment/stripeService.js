/**
 * Stripe Payment Service
 *
 * This service handles client-side Stripe integration for the checkout process.
 * It initializes Stripe.js and provides functions for handling payments.
 */

import { loadStripe } from '@stripe/stripe-js'
import { browser } from '$app/environment'
import { writable } from 'svelte/store'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('Stripe')

// Public Stripe key (client-side safe)
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY

// Validate Stripe key is set
if (browser && !STRIPE_PUBLIC_KEY) {
	logger.error('VITE_STRIPE_PUBLIC_KEY is not set in environment variables')
}

// Store to track loading state
export const stripeLoading = writable(true)
export const stripeError = writable(null)

// Stripe instance (will be initialized)
let stripePromise

/**
 * Initialize Stripe
 * @returns {Promise<Object>} Stripe instance
 */
export const getStripe = async () => {
	if (!browser) return null

	if (!stripePromise) {
		stripeLoading.set(true)
		stripeError.set(null)

		try {
			stripePromise = loadStripe(STRIPE_PUBLIC_KEY)
			const stripe = await stripePromise

			if (!stripe) {
				throw new Error('Failed to initialize Stripe')
			}

			stripeLoading.set(false)
			return stripe
		} catch (error) {
			logger.error('Error initializing Stripe:', error)
			stripeError.set(error.message || 'Failed to load Stripe')
			stripeLoading.set(false)
			return null
		}
	}

	return await stripePromise
}

/**
 * Create payment element options
 * @returns {Object} Options for creating payment elements
 */
export const createPaymentElementOptions = () => {
	return {
		style: {
			base: {
				fontSize: '16px',
				color: '#424770',
				fontFamily: 'sans-serif',
				'::placeholder': {
					color: '#aab7c4'
				}
			},
			invalid: {
				color: '#c23d4b'
			}
		},
		fields: {
			billingDetails: {
				name: 'auto',
				email: 'auto',
				phone: 'never'
			}
		}
	}
}

/**
 * Create Elements instance for adding Elements to the page
 * @param {Object} stripe - Stripe instance
 * @param {Object} options - Elements options
 * @returns {Object} Elements instance
 */
export const createElements = async (stripe, options = {}) => {
	if (!stripe) {
		logger.error('Stripe not initialized')
		return null
	}

	try {
		const elements = stripe.elements({
			appearance: {
				theme: 'stripe',
				...options.appearance
			},
			clientSecret: options.clientSecret
		})

		return elements
	} catch (error) {
		logger.error('Error creating Elements:', error)
		stripeError.set(error.message || 'Failed to initialize payment form')
		return null
	}
}

/**
 * Confirm payment with Stripe
 * @param {Object} stripe - Stripe instance
 * @param {Object} elements - Elements instance
 * @param {Object} options - Payment options
 * @returns {Promise<Object>} Payment result
 */
export const confirmPayment = async (stripe, elements, options = {}) => {
	if (!stripe || !elements) {
		throw new Error('Stripe not initialized')
	}

	const { error, paymentIntent } = await stripe.confirmPayment({
		elements,
		confirmParams: {
			return_url: options.returnUrl || window.location.origin + '/shop/checkout/confirmation',
			payment_method_data: {
				billing_details: options.billingDetails || {}
			}
		},
		redirect: options.redirect || 'if_required'
	})

	if (error) {
		logger.error('Payment error:', error)
		throw error
	}

	return paymentIntent
}

/**
 * Create a payment method
 * @param {Object} stripe - Stripe instance
 * @param {Object} elements - Elements instance
 * @param {Object} options - Payment method options
 * @returns {Promise<Object>} Payment method result
 */
export const createPaymentMethod = async (stripe, elements, options = {}) => {
	if (!stripe || !elements) {
		throw new Error('Stripe not initialized')
	}

	const { error, paymentMethod } = await stripe.createPaymentMethod({
		elements,
		params: {
			billing_details: options.billingDetails || {}
		}
	})

	if (error) {
		logger.error('Payment method error:', error)
		throw error
	}

	return paymentMethod
}
