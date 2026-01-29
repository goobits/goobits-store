/**
 * Standardized error handling utilities for @goobits/store
 */

import { createLogger } from './logger'

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
} as const

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes]

/**
 * Error response structure
 */
interface ErrorResponse {
	success: false;
	error: {
		message: string;
		type: ErrorType;
		details: Record<string, unknown>;
		timestamp: string;
	};
}

/**
 * Standardized error class for store package
 */
export class StoreError extends Error {
	public readonly type: ErrorType
	public readonly details: Record<string, unknown>
	public readonly timestamp: string

	/**
	 * Create a standardized store error
	 *
	 * @param message - Error message
	 * @param type - Error type from ErrorTypes
	 * @param details - Additional error details
	 */
	constructor(message: string, type: ErrorType = ErrorTypes.UNKNOWN, details: Record<string, unknown> = {}) {
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
 * @param error - The error to handle
 * @param type - Error type from ErrorTypes
 * @param details - Additional error details
 * @returns Standardized error object
 */
export function createErrorResponse(error: Error | string, type: ErrorType = ErrorTypes.UNKNOWN, details: Record<string, unknown> = {}): ErrorResponse {
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
 * @param error - The error to handle
 * @param context - Context where error occurred
 * @param metadata - Additional metadata
 * @returns Standardized error instance
 */
export function handleError(error: Error | string, context: string, metadata: Record<string, unknown> = {}): StoreError {
	// Determine error type based on error content
	let errorType: ErrorType = ErrorTypes.UNKNOWN
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
	logger.error(`[${context}] ${message}`, { errorType, metadata })

	// Return standardized error
	return new StoreError(message, errorType, metadata)
}

/**
 * Extract user-friendly error message
 *
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: Error | StoreError | { message?: string }): string {
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
