/**
 * Standardized error handling utilities for @goobits/store
 */

import { createLogger } from './logger.js'

const logger = createLogger('ErrorHandler')

/**
 * Error types for better error categorization
 */
export const ErrorTypes = {
	// Common error types
	VALIDATION: 'VALIDATION',
	NETWORK: 'NETWORK',
	RATE_LIMIT: 'RATE_LIMIT',
	SERVER: 'SERVER',
	UNKNOWN: 'UNKNOWN',

	// Store-specific error types
	CART_ERROR: 'CART_ERROR',
	CHECKOUT_ERROR: 'CHECKOUT_ERROR',
	PAYMENT_ERROR: 'PAYMENT_ERROR',
	PRODUCT_ERROR: 'PRODUCT_ERROR',
	SHIPPING_ERROR: 'SHIPPING_ERROR',
	PRICE_ERROR: 'PRICE_ERROR',
	INVENTORY_ERROR: 'INVENTORY_ERROR',
	STRIPE_ERROR: 'STRIPE_ERROR'
}

/**
 * Standardized error class for store package
 *
 * @class StoreError
 * @extends Error
 */
export class StoreError extends Error {
	/**
	 * Create a standardized store error
	 *
	 * @param {string} message - Error message
	 * @param {string} [type=ErrorTypes.UNKNOWN] - Error type from ErrorTypes
	 * @param {Object} [details={}] - Additional error details
	 */
	constructor(message, type = ErrorTypes.UNKNOWN, details = {}) {
		super(message)
		this.name = 'StoreError'
		this.type = type
		this.details = details
		this.timestamp = new Date().toISOString()
	}
}

/**
 * Create standardized error response suitable for API returns
 *
 * @param {Error|string} error - The error to handle
 * @param {string} [type=ErrorTypes.UNKNOWN] - Error type from ErrorTypes
 * @param {Object} [details={}] - Additional error details
 * @returns {Object} Standardized error object
 */
export function createErrorResponse(error, type = ErrorTypes.UNKNOWN, details = {}) {
	const message = error instanceof Error ? error.message : String(error)

	return {
		success: false,
		error: {
			message,
			type,
			details,
			timestamp: new Date().toISOString()
		}
	}
}

/**
 * Handle and log errors consistently
 *
 * @param {Error|string} error - The error to handle
 * @param {string} context - Context where error occurred
 * @param {Object} [metadata={}] - Additional metadata
 * @returns {StoreError} Standardized error instance
 */
export function handleError(error, context, metadata = {}) {
	// Determine error type based on error content
	let errorType = ErrorTypes.UNKNOWN
	const message = error instanceof Error ? error.message : String(error)

	// Categorize error
	if (message.includes('validation') || message.includes('invalid')) {
		errorType = ErrorTypes.VALIDATION
	} else if (message.includes('network') || message.includes('fetch')) {
		errorType = ErrorTypes.NETWORK
	} else if (message.includes('rate') || message.includes('429')) {
		errorType = ErrorTypes.RATE_LIMIT
	} else if (message.includes('server') || message.includes('500')) {
		errorType = ErrorTypes.SERVER
	} else if (message.includes('cart')) {
		errorType = ErrorTypes.CART_ERROR
	} else if (message.includes('checkout')) {
		errorType = ErrorTypes.CHECKOUT_ERROR
	} else if (message.includes('payment')) {
		errorType = ErrorTypes.PAYMENT_ERROR
	} else if (message.includes('product')) {
		errorType = ErrorTypes.PRODUCT_ERROR
	} else if (message.includes('shipping')) {
		errorType = ErrorTypes.SHIPPING_ERROR
	} else if (message.includes('price')) {
		errorType = ErrorTypes.PRICE_ERROR
	} else if (message.includes('inventory')) {
		errorType = ErrorTypes.INVENTORY_ERROR
	} else if (message.includes('stripe') || message.includes('card')) {
		errorType = ErrorTypes.STRIPE_ERROR
	}

	// Log error with context
	logger.error(`[${ context }] ${ message }`, { errorType, metadata })

	// Return standardized error
	return new StoreError(message, errorType, metadata)
}

/**
 * Extract user-friendly error message
 *
 * @param {Error|Object} error - The error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error) {
	if (error instanceof StoreError) {
		switch (error.type) {
		case ErrorTypes.VALIDATION:
			return 'Please check the information and try again.'
		case ErrorTypes.NETWORK:
			return 'Network error. Please check your connection and try again.'
		case ErrorTypes.RATE_LIMIT:
			return 'Too many requests. Please wait a moment and try again.'
		case ErrorTypes.SERVER:
			return 'Server error. Please try again later.'
		case ErrorTypes.CART_ERROR:
			return 'There was an issue with your shopping cart. Please try refreshing the page.'
		case ErrorTypes.CHECKOUT_ERROR:
			return 'There was an issue with the checkout process. Please try again.'
		case ErrorTypes.PAYMENT_ERROR:
			return 'Payment error. Please check your payment details and try again.'
		case ErrorTypes.PRODUCT_ERROR:
			return 'Product error. The product may be unavailable or out of stock.'
		case ErrorTypes.SHIPPING_ERROR:
			return 'Shipping error. Please check your shipping address and try again.'
		case ErrorTypes.PRICE_ERROR:
			return 'Price error. The price may have changed since you added the item to your cart.'
		case ErrorTypes.INVENTORY_ERROR:
			return 'Inventory error. Some items in your cart may be out of stock.'
		case ErrorTypes.STRIPE_ERROR:
			return 'Payment processing error. Please check your card details and try again.'
		default:
			return 'An unexpected error occurred. Please try again.'
		}
	}

	// Fallback for non-standardized errors
	return error?.message || 'An unexpected error occurred with your order.'
}