/**
 * Checkout Utils Tests
 *
 * These tests probe for real bugs in price formatting, calculations,
 * and edge cases that could display wrong prices to customers.
 */

import { describe, it, expect } from 'vitest'
import {
	formatPrice,
	formatCurrency,
	getLineItemTotal,
	getCartSubtotal,
	getShippingTotal,
	getTaxTotal,
	getOrderTotal,
	getSelectedShippingOption
} from './checkoutUtils'

describe('formatPrice', () => {
	describe('cents to dollars conversion', () => {
		it('should convert 1999 cents to 19.99', () => {
			expect(formatPrice(1999)).toBe('19.99')
		})

		it('should convert 100 cents to 1.00', () => {
			expect(formatPrice(100)).toBe('1.00')
		})

		it('should convert 1 cent to 0.01', () => {
			expect(formatPrice(1)).toBe('0.01')
		})

		it('should handle exact dollar amounts (no cents)', () => {
			expect(formatPrice(2000)).toBe('20.00')
		})
	})

	describe('zero and falsy values', () => {
		it('should format 0 as 0.00', () => {
			expect(formatPrice(0)).toBe('0.00')
		})

		it('should format empty string as 0.00', () => {
			// The code has: if (!price || price === 0) return '0.00'
			// Empty string is falsy, so this should return '0.00'
			expect(formatPrice('')).toBe('0.00')
		})

		it('should handle null gracefully', () => {
			// @ts-expect-error Testing runtime behavior with invalid input
			expect(formatPrice(null)).toBe('0.00')
		})

		it('should handle undefined gracefully', () => {
			// @ts-expect-error Testing runtime behavior with invalid input
			expect(formatPrice(undefined)).toBe('0.00')
		})
	})

	describe('negative prices', () => {
		it('should format negative prices (refunds/discounts)', () => {
			// Refunds and discounts could be negative
			const result = formatPrice(-500)
			// Should be '-5.00' - verify the code handles this
			expect(result).toBe('-5.00')
		})
	})

	describe('string inputs', () => {
		it('should handle numeric string input', () => {
			expect(formatPrice('1999')).toBe('19.99')
		})

		it('should return 0.00 for non-numeric string', () => {
			expect(formatPrice('not a number')).toBe('0.00')
		})
	})

	describe('currency symbol', () => {
		it('should prepend symbol when includeSymbol is true', () => {
			expect(formatPrice(1999, '$', true)).toBe('$19.99')
		})

		it('should not include symbol by default', () => {
			expect(formatPrice(1999)).toBe('19.99')
		})

		it('should use custom currency symbol', () => {
			expect(formatPrice(1999, '€', true)).toBe('€19.99')
		})
	})

	describe('precision edge cases', () => {
		it('should handle very large prices', () => {
			// $1,000,000.00 in cents
			expect(formatPrice(100000000)).toBe('1000000.00')
		})

		it('should handle fractional cents from calculation errors', () => {
			// If somehow we got a fractional cent value
			expect(formatPrice(199.9)).toBe('2.00')
		})
	})
})

describe('formatCurrency', () => {
	it('should use $ for USD', () => {
		expect(formatCurrency(1999, 'USD')).toBe('$19.99')
	})

	it('should use € for EUR', () => {
		expect(formatCurrency(1999, 'EUR')).toBe('€19.99')
	})

	it('should use £ for GBP', () => {
		expect(formatCurrency(1999, 'GBP')).toBe('£19.99')
	})

	it('should use ¥ for JPY', () => {
		expect(formatCurrency(1999, 'JPY')).toBe('¥19.99')
	})

	it('should fall back to currency code for unknown currencies', () => {
		// Unknown currency should use the code itself as symbol
		expect(formatCurrency(1999, 'CHF')).toBe('CHF19.99')
	})

	it('should default to USD when no currency specified', () => {
		expect(formatCurrency(1999)).toBe('$19.99')
	})
})

describe('getLineItemTotal', () => {
	it('should multiply unit_price by quantity', () => {
		const item = { unit_price: 1000, quantity: 3 }
		expect(getLineItemTotal(item as MedusaLineItem)).toBe('30.00')
	})

	it('should handle quantity of 1', () => {
		const item = { unit_price: 1999, quantity: 1 }
		expect(getLineItemTotal(item as MedusaLineItem)).toBe('19.99')
	})

	it('should handle zero quantity', () => {
		const item = { unit_price: 1000, quantity: 0 }
		expect(getLineItemTotal(item as MedusaLineItem)).toBe('0.00')
	})

	it('should return 0.00 for missing unit_price', () => {
		const item = { quantity: 3 }
		expect(getLineItemTotal(item as MedusaLineItem)).toBe('0.00')
	})

	it('should return 0.00 for missing quantity', () => {
		const item = { unit_price: 1000 }
		expect(getLineItemTotal(item as MedusaLineItem)).toBe('0.00')
	})

	it('should return 0.00 for null item', () => {
		// @ts-expect-error Testing runtime behavior
		expect(getLineItemTotal(null)).toBe('0.00')
	})
})

describe('getSelectedShippingOption', () => {
	const options = [
		{ id: 'standard', name: 'Standard', amount: 500 },
		{ id: 'express', name: 'Express', amount: 1500 },
		{ id: 'overnight', name: 'Overnight', amount: 2500 }
	]

	it('should find option by id', () => {
		const result = getSelectedShippingOption(options, 'express')
		expect(result?.name).toBe('Express')
		expect(result?.amount).toBe(1500)
	})

	it('should return undefined for non-existent id', () => {
		expect(getSelectedShippingOption(options, 'drone')).toBeUndefined()
	})

	it('should return undefined for empty array', () => {
		expect(getSelectedShippingOption([], 'standard')).toBeUndefined()
	})

	it('should handle invalid input gracefully', () => {
		// @ts-expect-error Testing runtime behavior
		expect(getSelectedShippingOption(null, 'standard')).toBeUndefined()
	})
})

describe('cart total functions', () => {
	describe('getCartSubtotal', () => {
		it('should format subtotal from cart object', () => {
			const cart = { items: [{}], subtotal: 5000 }
			expect(getCartSubtotal(cart as MedusaCart)).toBe('50.00')
		})

		it('should return 0.00 when no items', () => {
			const cart = { subtotal: 5000 }
			expect(getCartSubtotal(cart as MedusaCart)).toBe('0.00')
		})

		it('should return 0.00 for null cart', () => {
			// @ts-expect-error Testing runtime behavior
			expect(getCartSubtotal(null)).toBe('0.00')
		})
	})

	describe('getShippingTotal', () => {
		it('should format shipping total', () => {
			const cart = { shipping_total: 1000 }
			expect(getShippingTotal(cart as MedusaCart)).toBe('10.00')
		})

		it('should return 0.00 when no shipping', () => {
			const cart = {}
			expect(getShippingTotal(cart as MedusaCart)).toBe('0.00')
		})
	})

	describe('getTaxTotal', () => {
		it('should format tax total', () => {
			const cart = { tax_total: 825 }
			expect(getTaxTotal(cart as MedusaCart)).toBe('8.25')
		})

		it('should return 0.00 when no tax', () => {
			const cart = {}
			expect(getTaxTotal(cart as MedusaCart)).toBe('0.00')
		})
	})

	describe('getOrderTotal', () => {
		it('should format order total', () => {
			const cart = { total: 6825 }
			expect(getOrderTotal(cart as MedusaCart)).toBe('68.25')
		})

		it('should return 0.00 when no total', () => {
			const cart = {}
			expect(getOrderTotal(cart as MedusaCart)).toBe('0.00')
		})
	})
})
