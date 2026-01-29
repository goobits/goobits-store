/**
 * Payment Service module for handling payment processing
 * This is a client-side service for processing payments
 * In a production environment, payment processing should happen server-side
 */

import { browser } from '$app/environment'
import { createLogger } from './logger'

const logger = createLogger('PaymentService')

/**
 * Payment data for card payments
 */
interface PaymentData {
	card_number: string;
	expiry_date: string;
	cvv: string;
	card_name: string;
}

/**
 * Payment success result
 */
interface PaymentSuccessResult {
	success: true;
	transaction_id: string;
	amount: number;
	currency: string;
	card_last4: string;
	created_at: string;
}

/**
 * Payment error result
 */
interface PaymentErrorResult {
	success: false;
	error: string;
	error_code: string;
}

/**
 * Saved payment method
 */
interface SavedPaymentMethod {
	id: string;
	type: 'card';
	last4: string;
	brand: string;
	expiry_month: string;
	expiry_year: string;
	name: string;
}

type PaymentResult = PaymentSuccessResult | PaymentErrorResult

/**
 * Process a credit card payment
 * @param paymentData - Payment information
 * @param amount - Payment amount in cents
 * @returns Result of payment processing
 */
export async function processPayment(paymentData: PaymentData, amount: number): Promise<PaymentSuccessResult> {
	if (!browser) {
		throw new Error('Payment processing can only be performed in the browser')
	}

	// Validate the payment data
	validatePaymentData(paymentData)

	// In a real implementation, this would call to a payment gateway API
	// For demo purposes, we simulate a payment processor response

	// Simulate network latency
	await new Promise<void>(resolve => {
		setTimeout(resolve, 1500)
	})

	// Simulated success response (would come from payment gateway in real app)
	return {
		success: true,
		transaction_id: generateTransactionId(),
		amount,
		currency: 'USD',
		card_last4: paymentData.card_number.replace(/\s/g, '').slice(-4),
		created_at: new Date().toISOString()
	}
}

/**
 * Process a payment and handle common errors
 * @param paymentData - Payment information
 * @param amount - Payment amount in cents
 * @returns Result of payment processing
 */
export async function processPaymentWithErrorHandling(paymentData: PaymentData, amount: number): Promise<PaymentResult> {
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
		const errorMessage = error instanceof Error ? error.message : 'Payment processing failed'
		const errorCode = (error as { code?: string }).code || 'unknown_error'

		return {
			success: false,
			error: errorMessage,
			error_code: errorCode
		}
	}
}

/**
 * Validate payment data
 * @param paymentData - Payment data to validate
 * @throws Error If validation fails
 */
function validatePaymentData(paymentData: PaymentData): void {
	// Check for required fields
	if (!paymentData) { throw new Error('Payment data is required') }

	const { card_number, expiry_date, cvv, card_name } = paymentData

	// Validate card number (basic validation)
	if (!card_number) { throw new Error('Card number is required') }
	const cleanCardNumber = card_number.replace(/\s/g, '')
	if (!/^\d{13,19}$/.test(cleanCardNumber)) {
		throw new Error('Invalid card number format')
	}

	// Validate expiry date
	if (!expiry_date) { throw new Error('Expiry date is required') }
	if (!/^\d{2}\/\d{2}$/.test(expiry_date)) {
		throw new Error('Invalid expiry date format (MM/YY)')
	}

	// Parse expiry date
	const [month, year] = expiry_date.split('/')
	const expiryMonth = parseInt(month ?? '', 10)
	const expiryYear = parseInt(year ?? '', 10) + 2000 // Convert to full year

	// Check if card is expired
	const now = new Date()
	const currentMonth = now.getMonth() + 1 // 1-12
	const currentYear = now.getFullYear()

	if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
		throw new Error('Card has expired')
	}

	// Validate CVV
	if (!cvv) { throw new Error('Security code (CVV) is required') }
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
 * @returns A transaction ID
 */
function generateTransactionId(): string {
	return `txn_${Math.random().toString(36).substr(2, 9)}${Date.now().toString().substr(-4)}`
}

/**
 * Save payment method for future use (dummy implementation)
 * @param paymentData - Payment data
 * @returns Saved payment method
 */
export function savePaymentMethod(paymentData: PaymentData): SavedPaymentMethod {
	if (!browser) {
		throw new Error('This operation can only be performed in the browser')
	}

	// In a real implementation, you would tokenize the card with your payment provider
	// and store only the token, not the actual card details
	const [expiryMonth, expiryYear] = paymentData.expiry_date.split('/')

	return {
		id: `pm_${Date.now()}`,
		type: 'card',
		last4: paymentData.card_number.replace(/\s/g, '').slice(-4),
		brand: detectCardBrand(paymentData.card_number),
		expiry_month: expiryMonth ?? '',
		expiry_year: expiryYear ?? '',
		name: paymentData.card_name
	}
}

/**
 * Detect the card brand from card number
 * @param cardNumber - The card number
 * @returns The detected card brand
 */
function detectCardBrand(cardNumber: string): string {
	const number = cardNumber.replace(/\s+/g, '')

	// Visa
	if (/^4/.test(number)) { return 'visa' }

	// Mastercard
	if (/^5[1-5]/.test(number)) { return 'mastercard' }

	// Amex
	if (/^3[47]/.test(number)) { return 'amex' }

	// Discover
	if (/^6(?:011|5)/.test(number)) { return 'discover' }

	// Unknown
	return 'unknown'
}
