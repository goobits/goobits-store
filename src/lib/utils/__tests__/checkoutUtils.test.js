import { describe, it, expect, vi } from 'vitest'

// Mock the logger module
vi.mock('../logger.js', () => ({
	createLogger: () => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn()
	})
}))

import {
	formatPrice,
	formatCurrency,
	getLineItemTotal,
	getSelectedShippingOption,
	getCartSubtotal,
	getShippingTotal,
	getTaxTotal,
	getOrderTotal
} from '../checkoutUtils.js'

describe('formatPrice', () => {
	describe('basic conversions', () => {
		it('converts cents to dollars with two decimal places', () => {
			expect(formatPrice(1999)).toBe('19.99')
			expect(formatPrice(100)).toBe('1.00')
			expect(formatPrice(1)).toBe('0.01')
			expect(formatPrice(50)).toBe('0.50')
		})

		it('handles large amounts', () => {
			expect(formatPrice(999999)).toBe('9999.99')
			expect(formatPrice(100000000)).toBe('1000000.00')
		})

		it('handles string numbers', () => {
			expect(formatPrice('1999')).toBe('19.99')
			expect(formatPrice('100')).toBe('1.00')
			expect(formatPrice('0')).toBe('0.00')
		})
	})

	describe('zero and falsy handling', () => {
		it('returns 0.00 for zero', () => {
			expect(formatPrice(0)).toBe('0.00')
		})

		it('returns 0.00 for null', () => {
			expect(formatPrice(null)).toBe('0.00')
		})

		// Note: undefined causes an error path that returns undefined
		// This is a known limitation of the current implementation
		it('returns undefined for undefined input (error case)', () => {
			expect(formatPrice(undefined)).toBeUndefined()
		})
	})

	describe('currency symbol formatting', () => {
		it('includes currency symbol when requested', () => {
			expect(formatPrice(1999, '$', true)).toBe('$19.99')
			expect(formatPrice(0, '$', true)).toBe('$0.00')
		})

		it('uses custom currency symbols', () => {
			expect(formatPrice(1999, '€', true)).toBe('€19.99')
			expect(formatPrice(1999, '£', true)).toBe('£19.99')
			expect(formatPrice(1999, '¥', true)).toBe('¥19.99')
		})

		it('omits symbol when includeSymbol is false', () => {
			expect(formatPrice(1999, '$', false)).toBe('19.99')
			expect(formatPrice(1999, '€', false)).toBe('19.99')
		})
	})

	describe('invalid input handling', () => {
		it('returns undefined for non-numeric strings (error case)', () => {
			expect(formatPrice('abc')).toBeUndefined()
			expect(formatPrice('$19.99')).toBeUndefined()
		})
	})
})

describe('formatCurrency', () => {
	it('formats USD with dollar sign', () => {
		expect(formatCurrency(1999, 'USD')).toBe('$19.99')
		expect(formatCurrency(0, 'USD')).toBe('$0.00')
	})

	it('formats EUR with euro sign', () => {
		expect(formatCurrency(1999, 'EUR')).toBe('€19.99')
	})

	it('formats GBP with pound sign', () => {
		expect(formatCurrency(1999, 'GBP')).toBe('£19.99')
	})

	it('formats JPY with yen sign', () => {
		expect(formatCurrency(1999, 'JPY')).toBe('¥19.99')
	})

	it('uses currency code as fallback for unknown currencies', () => {
		expect(formatCurrency(1999, 'CAD')).toBe('CAD19.99')
		expect(formatCurrency(1999, 'AUD')).toBe('AUD19.99')
		expect(formatCurrency(1999, 'CHF')).toBe('CHF19.99')
	})

	it('defaults to USD when no currency specified', () => {
		expect(formatCurrency(1999)).toBe('$19.99')
	})
})

describe('getLineItemTotal', () => {
	it('calculates total for single quantity', () => {
		expect(getLineItemTotal({ unit_price: 1999, quantity: 1 })).toBe('19.99')
	})

	it('calculates total for multiple quantities', () => {
		expect(getLineItemTotal({ unit_price: 1000, quantity: 2 })).toBe('20.00')
		expect(getLineItemTotal({ unit_price: 500, quantity: 5 })).toBe('25.00')
		expect(getLineItemTotal({ unit_price: 999, quantity: 10 })).toBe('99.90')
	})

	it('handles zero quantity', () => {
		expect(getLineItemTotal({ unit_price: 1999, quantity: 0 })).toBe('0.00')
	})

	it('handles zero price', () => {
		expect(getLineItemTotal({ unit_price: 0, quantity: 5 })).toBe('0.00')
	})

	it('handles fractional cent calculations correctly', () => {
		// 333 cents * 3 = 999 cents = $9.99
		expect(getLineItemTotal({ unit_price: 333, quantity: 3 })).toBe('9.99')
		// 199 cents * 3 = 597 cents = $5.97
		expect(getLineItemTotal({ unit_price: 199, quantity: 3 })).toBe('5.97')
	})

	it('returns undefined for missing item (error case)', () => {
		expect(getLineItemTotal(null)).toBeUndefined()
		expect(getLineItemTotal(undefined)).toBeUndefined()
	})

	it('returns undefined for missing required properties (error case)', () => {
		expect(getLineItemTotal({})).toBeUndefined()
		expect(getLineItemTotal({ unit_price: 100 })).toBeUndefined()
		expect(getLineItemTotal({ quantity: 2 })).toBeUndefined()
	})
})

describe('getSelectedShippingOption', () => {
	const shippingOptions = [
		{ id: 'so_standard', name: 'Standard Shipping', amount: 599 },
		{ id: 'so_express', name: 'Express Shipping', amount: 1299 },
		{ id: 'so_overnight', name: 'Overnight Shipping', amount: 2499 }
	]

	it('finds shipping option by ID', () => {
		const result = getSelectedShippingOption(shippingOptions, 'so_express')
		expect(result).toEqual({
			id: 'so_express',
			name: 'Express Shipping',
			amount: 1299
		})
	})

	it('returns first option when selecting first ID', () => {
		const result = getSelectedShippingOption(shippingOptions, 'so_standard')
		expect(result?.id).toBe('so_standard')
	})

	it('returns last option when selecting last ID', () => {
		const result = getSelectedShippingOption(shippingOptions, 'so_overnight')
		expect(result?.id).toBe('so_overnight')
	})

	it('returns undefined for non-existent ID', () => {
		expect(getSelectedShippingOption(shippingOptions, 'so_invalid')).toBeUndefined()
		expect(getSelectedShippingOption(shippingOptions, '')).toBeUndefined()
		expect(getSelectedShippingOption(shippingOptions, null)).toBeUndefined()
	})

	it('returns undefined for empty options array', () => {
		expect(getSelectedShippingOption([], 'so_standard')).toBeUndefined()
	})

	it('returns undefined for non-array input (error case)', () => {
		expect(getSelectedShippingOption(null, 'so_standard')).toBeUndefined()
		expect(getSelectedShippingOption(undefined, 'so_standard')).toBeUndefined()
		expect(getSelectedShippingOption('not-an-array', 'so_standard')).toBeUndefined()
	})
})

describe('getCartSubtotal', () => {
	it('formats subtotal from cart with items', () => {
		const cart = { subtotal: 5999, items: [{ id: 'item_1' }] }
		expect(getCartSubtotal(cart)).toBe('59.99')
	})

	it('returns 0.00 for cart without items property', () => {
		expect(getCartSubtotal({ subtotal: 5999 })).toBe('0.00')
	})

	it('handles cart with empty items array', () => {
		// Cart has items array but subtotal is 0
		expect(getCartSubtotal({ subtotal: 0, items: [] })).toBe('0.00')
	})

	it('formats various subtotal amounts', () => {
		expect(getCartSubtotal({ subtotal: 100, items: [{}] })).toBe('1.00')
		expect(getCartSubtotal({ subtotal: 12345, items: [{}] })).toBe('123.45')
	})

	it('returns undefined for null cart (error case)', () => {
		expect(getCartSubtotal(null)).toBeUndefined()
		expect(getCartSubtotal(undefined)).toBeUndefined()
	})
})

describe('getShippingTotal', () => {
	it('formats shipping total from cart', () => {
		expect(getShippingTotal({ shipping_total: 599 })).toBe('5.99')
		expect(getShippingTotal({ shipping_total: 1299 })).toBe('12.99')
	})

	it('returns 0.00 for zero shipping', () => {
		expect(getShippingTotal({ shipping_total: 0 })).toBe('0.00')
	})

	it('returns 0.00 for missing shipping_total', () => {
		expect(getShippingTotal({})).toBe('0.00')
		expect(getShippingTotal({ other_field: 100 })).toBe('0.00')
	})

	it('returns undefined for null cart (error case)', () => {
		expect(getShippingTotal(null)).toBeUndefined()
	})
})

describe('getTaxTotal', () => {
	it('formats tax total from cart', () => {
		expect(getTaxTotal({ tax_total: 450 })).toBe('4.50')
		expect(getTaxTotal({ tax_total: 1234 })).toBe('12.34')
	})

	it('returns 0.00 for zero tax', () => {
		expect(getTaxTotal({ tax_total: 0 })).toBe('0.00')
	})

	it('returns 0.00 for missing tax_total', () => {
		expect(getTaxTotal({})).toBe('0.00')
	})

	it('returns undefined for null cart (error case)', () => {
		expect(getTaxTotal(null)).toBeUndefined()
	})
})

describe('getOrderTotal', () => {
	it('formats order total from cart', () => {
		expect(getOrderTotal({ total: 7048 })).toBe('70.48')
		expect(getOrderTotal({ total: 15000 })).toBe('150.00')
	})

	it('returns 0.00 for zero total', () => {
		expect(getOrderTotal({ total: 0 })).toBe('0.00')
	})

	it('returns 0.00 for missing total', () => {
		expect(getOrderTotal({})).toBe('0.00')
	})

	it('returns undefined for null cart (error case)', () => {
		expect(getOrderTotal(null)).toBeUndefined()
	})
})
