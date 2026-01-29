/**
 * Utility functions for formatting prices and calculating checkout totals
 */

import { createLogger } from './logger'

const logger = createLogger('CheckoutUtils')

/**
 * Shipping option type for checkout
 */
interface ShippingOption {
	id: string;
	name?: string;
	amount?: number;
	[key: string]: unknown;
}

// Local error handling implementation
function handleError(_moduleName: string, error: unknown): unknown {
	logger.error('Error:', error)
	return error
}

function validateType(value: unknown, type: string, name: string, isOptional = true): void {
	if (value === undefined || value === null) {
		if (!isOptional) {
			throw new TypeError(`${name} is required`)
		}
		return
	}

	const actualType = typeof value
	if (type === 'array') {
		if (!Array.isArray(value)) {
			throw new TypeError(`${name} must be an array, got ${actualType}`)
		}
	} else if (actualType !== type) {
		throw new TypeError(`${name} must be a ${type}, got ${actualType}`)
	}
}

// Module name for error context
const MODULE_NAME = 'CheckoutUtils'

/**
 * Formats a price from cents to dollars with two decimal places
 *
 * @param price - Price in cents
 * @param currencySymbol - Currency symbol to prepend
 * @param includeSymbol - Whether to include currency symbol
 * @returns Formatted price as a string with two decimal places
 * @throws TypeError If price is not a number or cannot be converted to one
 *
 * @example
 * formatPrice(1999) // '19.99'
 * formatPrice(1999, '$', true) // '$19.99'
 * formatPrice(0) // '0.00'
 */
export function formatPrice(price: number | string, currencySymbol = '$', includeSymbol = false): string {
	try {
		const priceNum = Number(price)

		// Validate price is a number
		if (isNaN(priceNum)) {
			throw new TypeError('Price must be a number or convertible to a number')
		}

		if (!price || price === 0) {
			return includeSymbol ? `${currencySymbol}0.00` : '0.00'
		}

		const formatted = (priceNum / 100).toFixed(2)
		return includeSymbol ? `${currencySymbol}${formatted}` : formatted
	} catch (error) {
		handleError(MODULE_NAME, error)
		return '0.00'
	}
}

/**
 * Format currency with proper symbol
 *
 * @param amount - Amount in cents
 * @param currencyCode - Currency code (USD, EUR, etc.)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1999, 'USD') // '$19.99'
 * formatCurrency(1999, 'EUR') // '€19.99'
 */
export function formatCurrency(amount: number, currencyCode = 'USD'): string {
	try {
		const symbols: Record<string, string> = {
			'USD': '$',
			'EUR': '€',
			'GBP': '£',
			'JPY': '¥'
		}

		const symbol = symbols[currencyCode] || currencyCode
		return formatPrice(amount, symbol, true)
	} catch (error) {
		handleError(MODULE_NAME, error)
		return '0.00'
	}
}

/**
 * Calculates the total for a line item by multiplying unit price by quantity
 *
 * @param item - Cart line item
 * @returns Formatted line item total with two decimal places
 * @throws TypeError If item is missing required properties
 */
export function getLineItemTotal(item: MedusaLineItem): string {
	try {
		// Validate item is an object
		validateType(item, 'object', 'item', false)

		// Validate required properties
		if (typeof item.unit_price !== 'number') {
			throw new TypeError('Item must have a numeric unit_price property')
		}

		if (typeof item.quantity !== 'number') {
			throw new TypeError('Item must have a numeric quantity property')
		}

		return ((item.unit_price / 100) * item.quantity).toFixed(2)
	} catch (error) {
		handleError(MODULE_NAME, error)
		return '0.00'
	}
}

/**
 * Finds the selected shipping option from the list of available options
 *
 * @param shippingOptions - Available shipping options
 * @param selectedId - ID of the selected option
 * @returns The selected shipping option or undefined if not found
 * @throws TypeError If shippingOptions is not an array
 */
export function getSelectedShippingOption(shippingOptions: ShippingOption[], selectedId: string): ShippingOption | undefined {
	try {
		// Validate shipping options is an array
		validateType(shippingOptions, 'array', 'shippingOptions', false)

		return shippingOptions.find(option => option.id === selectedId)
	} catch (error) {
		handleError(MODULE_NAME, error)
		return undefined
	}
}

/**
 * Gets the cart subtotal formatted as currency
 *
 * @param cart - The cart object
 * @returns Formatted subtotal with two decimal places
 * @throws TypeError If cart is not an object
 */
export function getCartSubtotal(cart: MedusaCart): string {
	try {
		// Validate cart is an object
		validateType(cart, 'object', 'cart', false)

		if (!cart.items) { return '0.00' }
		return formatPrice(cart.subtotal ?? 0)
	} catch (error) {
		handleError(MODULE_NAME, error)
		return '0.00'
	}
}

/**
 * Gets the shipping total formatted as currency
 *
 * @param cart - The cart object
 * @returns Formatted shipping total with two decimal places
 * @throws TypeError If cart is not an object
 */
export function getShippingTotal(cart: MedusaCart): string {
	try {
		// Validate cart is an object
		validateType(cart, 'object', 'cart', false)

		if (!cart.shipping_total) { return '0.00' }
		return formatPrice(cart.shipping_total)
	} catch (error) {
		handleError(MODULE_NAME, error)
		return '0.00'
	}
}

/**
 * Gets the tax total formatted as currency
 *
 * @param cart - The cart object
 * @returns Formatted tax total with two decimal places
 * @throws TypeError If cart is not an object
 */
export function getTaxTotal(cart: MedusaCart): string {
	try {
		// Validate cart is an object
		validateType(cart, 'object', 'cart', false)

		if (!cart.tax_total) { return '0.00' }
		return formatPrice(cart.tax_total)
	} catch (error) {
		handleError(MODULE_NAME, error)
		return '0.00'
	}
}

/**
 * Gets the order total formatted as currency
 *
 * @param cart - The cart object
 * @returns Formatted order total with two decimal places
 * @throws TypeError If cart is not an object
 */
export function getOrderTotal(cart: MedusaCart): string {
	try {
		// Validate cart is an object
		validateType(cart, 'object', 'cart', false)

		if (!cart.total) { return '0.00' }
		return formatPrice(cart.total)
	} catch (error) {
		handleError(MODULE_NAME, error)
		return '0.00'
	}
}
