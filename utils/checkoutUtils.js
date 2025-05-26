/**
 * Utility functions for formatting prices and calculating checkout totals
 */

// Local error handling implementation
function handleError(moduleName, error) {
	console.error(`[${ moduleName }] Error:`, error)
	return error
}

function validateType(value, type, name, isOptional = true) {
	if (value === undefined || value === null) {
		if (!isOptional) {
			throw new TypeError(`${ name } is required`)
		}
		return
	}

	const actualType = typeof value
	if (type === 'array') {
		if (!Array.isArray(value)) {
			throw new TypeError(`${ name } must be an array, got ${ actualType }`)
		}
	} else if (actualType !== type) {
		throw new TypeError(`${ name } must be a ${ type }, got ${ actualType }`)
	}
}

// Module name for error context
const MODULE_NAME = 'CheckoutUtils'

/**
 * Formats a price from cents to dollars with two decimal places
 *
 * @param {number|string} price - Price in cents
 * @returns {string} Formatted price as a string with two decimal places
 * @throws {TypeError} If price is not a number or cannot be converted to one
 */
export function formatPrice(price) {
	try {
		const priceNum = Number(price)

		// Validate price is a number
		if (isNaN(priceNum)) {
			throw new TypeError('Price must be a number or convertible to a number')
		}

		if (!price) return '0.00'
		return (priceNum / 100).toFixed(2)
	} catch (error) {
		handleError(MODULE_NAME, error)
	}
}

/**
 * Calculates the total for a line item by multiplying unit price by quantity
 *
 * @param {Object} item - Cart line item
 * @param {number} item.unit_price - Item price in cents
 * @param {number} item.quantity - Item quantity
 * @returns {string} Formatted line item total with two decimal places
 * @throws {TypeError} If item is missing required properties
 */
export function getLineItemTotal(item) {
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
	}
}

/**
 * Finds the selected shipping option from the list of available options
 *
 * @param {Array<Object>} shippingOptions - Available shipping options
 * @param {string} selectedId - ID of the selected option
 * @returns {Object|undefined} The selected shipping option or undefined if not found
 * @throws {TypeError} If shippingOptions is not an array
 */
export function getSelectedShippingOption(shippingOptions, selectedId) {
	try {
		// Validate shipping options is an array
		validateType(shippingOptions, 'array', 'shippingOptions', false)

		return shippingOptions.find(option => option.id === selectedId)
	} catch (error) {
		handleError(MODULE_NAME, error)
	}
}

/**
 * Gets the cart subtotal formatted as currency
 *
 * @param {Object} cart - The cart object
 * @param {number} [cart.subtotal] - Subtotal in cents
 * @param {Array} [cart.items] - Cart items
 * @returns {string} Formatted subtotal with two decimal places
 * @throws {TypeError} If cart is not an object
 */
export function getCartSubtotal(cart) {
	try {
		// Validate cart is an object
		validateType(cart, 'object', 'cart', false)

		if (!cart.items) return '0.00'
		return formatPrice(cart.subtotal)
	} catch (error) {
		handleError(MODULE_NAME, error)
	}
}

/**
 * Gets the shipping total formatted as currency
 *
 * @param {Object} cart - The cart object
 * @param {number} [cart.shipping_total] - Shipping total in cents
 * @returns {string} Formatted shipping total with two decimal places
 * @throws {TypeError} If cart is not an object
 */
export function getShippingTotal(cart) {
	try {
		// Validate cart is an object
		validateType(cart, 'object', 'cart', false)

		if (!cart.shipping_total) return '0.00'
		return formatPrice(cart.shipping_total)
	} catch (error) {
		handleError(MODULE_NAME, error)
	}
}

/**
 * Gets the tax total formatted as currency
 *
 * @param {Object} cart - The cart object
 * @param {number} [cart.tax_total] - Tax total in cents
 * @returns {string} Formatted tax total with two decimal places
 * @throws {TypeError} If cart is not an object
 */
export function getTaxTotal(cart) {
	try {
		// Validate cart is an object
		validateType(cart, 'object', 'cart', false)

		if (!cart.tax_total) return '0.00'
		return formatPrice(cart.tax_total)
	} catch (error) {
		handleError(MODULE_NAME, error)
	}
}

/**
 * Gets the order total formatted as currency
 *
 * @param {Object} cart - The cart object
 * @param {number} [cart.total] - Order total in cents
 * @returns {string} Formatted order total with two decimal places
 * @throws {TypeError} If cart is not an object
 */
export function getOrderTotal(cart) {
	try {
		// Validate cart is an object
		validateType(cart, 'object', 'cart', false)

		if (!cart.total) return '0.00'
		return formatPrice(cart.total)
	} catch (error) {
		handleError(MODULE_NAME, error)
	}
}