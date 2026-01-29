/**
 * Stripe Payment Service
 *
 * This service handles client-side Stripe integration for the checkout process.
 * It initializes Stripe.js and provides functions for handling payments.
 */

import { loadStripe, type Stripe, type StripeElements, type StripeElementsOptions, type PaymentIntent, type PaymentMethod } from '@stripe/stripe-js'
import { browser } from '$app/environment'
import { writable, type Writable } from 'svelte/store'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('Stripe')

// Store to track loading state
export const stripeLoading: Writable<boolean> = writable(true)
export const stripeError: Writable<string | null> = writable(null)

// Stripe instance (will be initialized)
let stripePromise: Promise<Stripe | null> | null = null
let configuredPublicKey: string | null = null

export interface PaymentElementOptions {
	style: {
		base: {
			fontSize: string;
			color: string;
			fontFamily: string;
			'::placeholder': {
				color: string;
			};
		};
		invalid: {
			color: string;
		};
	};
	fields: {
		billingDetails: {
			name: string;
			email: string;
			phone: string;
		};
	};
}

export interface BillingDetails {
	name?: string;
	email?: string;
	phone?: string;
	address?: {
		line1?: string;
		line2?: string;
		city?: string;
		state?: string;
		postal_code?: string;
		country?: string;
	};
}

export interface ConfirmPaymentOptions {
	returnUrl?: string;
	billingDetails?: BillingDetails;
	redirect?: 'if_required' | 'always' | undefined;
}

export interface CreatePaymentMethodOptions {
	billingDetails?: BillingDetails;
}

export interface ElementsOptions {
	appearance?: {
		theme?: 'stripe' | 'night' | 'flat';
		[key: string]: unknown;
	};
	clientSecret?: string;
}

/**
 * Configure Stripe with a public key
 * @param publicKey - Stripe public key
 */
export const configureStripe = (publicKey: string): void => {
	configuredPublicKey = publicKey
	// Reset promise to force re-initialization with new key
	stripePromise = null
}

/**
 * Initialize Stripe
 * @param publicKey - Optional Stripe public key. If not provided, uses configured key.
 * @returns Stripe instance
 */
export const getStripe = async (publicKey?: string): Promise<Stripe | null> => {
	if (!browser) {return null}

	const keyToUse = publicKey || configuredPublicKey

	if (!keyToUse) {
		logger.error(
			'Stripe public key not provided',
			'\n💡 Solution: Call configureStripe(key) or pass key to getStripe(key)',
			'\n   Or set it in your SvelteKit app via environment variables'
		)
		stripeError.set('Stripe public key not configured')
		return null
	}

	if (!stripePromise) {
		stripeLoading.set(true)
		stripeError.set(null)

		try {
			stripePromise = loadStripe(keyToUse)
			const stripe = await stripePromise

			if (!stripe) {
				throw new Error('Failed to initialize Stripe')
			}

			stripeLoading.set(false)
			return stripe
		} catch (error) {
			logger.error('Error initializing Stripe:', error)
			stripeError.set((error as Error).message || 'Failed to load Stripe')
			stripeLoading.set(false)
			return null
		}
	}

	return stripePromise
}

/**
 * Create payment element options
 * @returns Options for creating payment elements
 */
export const createPaymentElementOptions = (): PaymentElementOptions => ({
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
	})

/**
 * Create Elements instance for adding Elements to the page
 * @param stripe - Stripe instance
 * @param options - Elements options
 * @returns Elements instance
 */
export const createElements = (stripe: Stripe | null, options: ElementsOptions = {}): StripeElements | null => {
	if (!stripe) {
		logger.error('Stripe not initialized')
		return null
	}

	try {
		const elementsOptions: StripeElementsOptions = {
			appearance: {
				theme: 'stripe',
				...options.appearance
			},
			...(options.clientSecret ? { clientSecret: options.clientSecret } : {})
		}

		return stripe.elements(elementsOptions)
	} catch (error) {
		logger.error('Error creating Elements:', error)
		stripeError.set((error as Error).message || 'Failed to initialize payment form')
		return null
	}
}

/**
 * Confirm payment with Stripe
 * @param stripe - Stripe instance
 * @param elements - Elements instance
 * @param options - Payment options
 * @returns Payment result
 */
export const confirmPayment = async (
	stripe: Stripe,
	elements: StripeElements,
	options: ConfirmPaymentOptions = {}
): Promise<PaymentIntent | undefined> => {
	if (!stripe || !elements) {
		throw new Error('Stripe not initialized')
	}

	const confirmOptions = {
		elements,
		confirmParams: {
			return_url: options.returnUrl || `${window.location.origin}/shop/checkout/confirmation`,
			payment_method_data: {
				billing_details: options.billingDetails || {}
			}
		},
		redirect: 'if_required' as const
	}

	if (options.redirect === 'always') {
		confirmOptions.redirect = 'always' as never
	}

	const result = await stripe.confirmPayment(confirmOptions)

	if (result.error) {
		logger.error('Payment error:', result.error)
		throw result.error
	}

	return result.paymentIntent
}

/**
 * Create a payment method
 * @param stripe - Stripe instance
 * @param elements - Elements instance
 * @param options - Payment method options
 * @returns Payment method result
 */
export const createPaymentMethod = async (
	stripe: Stripe,
	elements: StripeElements,
	options: CreatePaymentMethodOptions = {}
): Promise<PaymentMethod | undefined> => {
	if (!stripe || !elements) {
		throw new Error('Stripe not initialized')
	}

	const result = await stripe.createPaymentMethod({
		elements,
		params: {
			billing_details: options.billingDetails || {}
		}
	})

	if (result.error) {
		logger.error('Payment method error:', result.error)
		throw result.error
	}

	return result.paymentMethod
}
