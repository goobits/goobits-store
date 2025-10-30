/**
 * Payment Service module for handling payment processing
 * This is a client-side service for processing payments
 * In a production environment, payment processing should happen server-side
 */

import { browser } from '$app/environment'
import { createLogger } from './logger.js'

const logger = createLogger('PaymentService')

/**
 * Process a credit card payment
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.card_number - Card number
 * @param {string} paymentData.expiry_date - Expiration date (MM/YY)
 * @param {string} paymentData.cvv - CVV security code
 * @param {string} paymentData.card_name - Name on the card
 * @param {number} amount - Payment amount in cents
 * @returns {Promise<Object>} - Result of payment processing
 */
export async function processPayment(paymentData, amount) {
	if (!browser) {
		throw new Error('Payment processing can only be performed in the browser')
	}

	// Validate the payment data
	validatePaymentData(paymentData)

	// In a real implementation, this would call to a payment gateway API
	// For demo purposes, we simulate a payment processor response

	// Simulate network latency
	await new Promise(resolve => setTimeout(resolve, 1500))

	// Simulated success response (would come from payment gateway in real app)
	return {
		success: true,
		transaction_id: generateTransactionId(),
		amount: amount,
		currency: 'USD',
		card_last4: paymentData.card_number.replace(/\s/g, '').slice(-4),
		created_at: new Date().toISOString()
	}
}

/**
 * Process a payment and handle common errors
 * @param {Object} paymentData - Payment information
 * @param {number} amount - Payment amount in cents
 * @returns {Promise<Object>} - Result of payment processing
 */
export async function processPaymentWithErrorHandling(paymentData, amount) {
	try {
		// Validate amount
		if (!amount || amount <= 0) {
			throw new Error('Invalid payment amount')
		}

		const result = await processPayment(paymentData, amount)
		return result
	} catch (error) {
		logger.error('Payment processing error:', error)

		// Format the error for consistent UI handling
		return {
			success: false,
			error: error.message || 'Payment processing failed',
			error_code: error.code || 'unknown_error'
		}
	}
}

/**
 * Validate payment data
 * @param {Object} paymentData - Payment data to validate
 * @throws {Error} If validation fails
 */
function validatePaymentData(paymentData) {
	// Check for required fields
	if (!paymentData) throw new Error('Payment data is required')

	const { card_number, expiry_date, cvv, card_name } = paymentData

	// Validate card number (basic validation)
	if (!card_number) throw new Error('Card number is required')
	const cleanCardNumber = card_number.replace(/\s/g, '')
	if (!/^\d{13,19}$/.test(cleanCardNumber)) {
		throw new Error('Invalid card number format')
	}

	// Validate expiry date
	if (!expiry_date) throw new Error('Expiry date is required')
	if (!/^\d{2}\/\d{2}$/.test(expiry_date)) {
		throw new Error('Invalid expiry date format (MM/YY)')
	}

	// Parse expiry date
	const [ month, year ] = expiry_date.split('/')
	const expiryMonth = parseInt(month, 10)
	const expiryYear = parseInt(year, 10) + 2000 // Convert to full year

	// Check if card is expired
	const now = new Date()
	const currentMonth = now.getMonth() + 1 // 1-12
	const currentYear = now.getFullYear()

	if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
		throw new Error('Card has expired')
	}

	// Validate CVV
	if (!cvv) throw new Error('Security code (CVV) is required')
	if (!/^\d{3,4}$/.test(cvv)) {
		throw new Error('Invalid security code format')
	}

	// Validate cardholder name
	if (!card_name || card_name.trim().length < 3) {
		throw new Error('Cardholder name is required')
	}
}

/**
 * Generate a unique transaction ID for demo purposes
 * @returns {string} - A transaction ID
 */
function generateTransactionId() {
	return 'txn_' + Math.random().toString(36).substr(2, 9) + Date.now().toString().substr(-4)
}

/**
 * Save payment method for future use (dummy implementation)
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} - Saved payment method
 */
export async function savePaymentMethod(paymentData) {
	if (!browser) {
		throw new Error('This operation can only be performed in the browser')
	}

	// In a real implementation, you would tokenize the card with your payment provider
	// and store only the token, not the actual card details

	return {
		id: `pm_${ Date.now() }`,
		type: 'card',
		last4: paymentData.card_number.replace(/\s/g, '').slice(-4),
		brand: detectCardBrand(paymentData.card_number),
		expiry_month: paymentData.expiry_date.split('/')[0],
		expiry_year: paymentData.expiry_date.split('/')[1],
		name: paymentData.card_name
	}
}

/**
 * Detect the card brand from card number
 * @param {string} cardNumber - The card number
 * @returns {string} - The detected card brand
 */
function detectCardBrand(cardNumber) {
	const number = cardNumber.replace(/\s+/g, '')

	// Visa
	if (/^4/.test(number)) return 'visa'

	// Mastercard
	if (/^5[1-5]/.test(number)) return 'mastercard'

	// Amex
	if (/^3[47]/.test(number)) return 'amex'

	// Discover
	if (/^6(?:011|5)/.test(number)) return 'discover'

	// Unknown
	return 'unknown'
}
