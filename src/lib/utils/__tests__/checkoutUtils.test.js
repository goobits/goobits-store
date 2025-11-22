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
	it('should convert cents to dollars with two decimal places', () => {
		expect(formatPrice(1999)).toBe('19.99')
		expect(formatPrice(100)).toBe('1.00')
		expect(formatPrice(1)).toBe('0.01')
	})

	it('should handle zero and falsy values', () => {
		expect(formatPrice(0)).toBe('0.00')
		expect(formatPrice(null)).toBe('0.00')
		// undefined converts to NaN, so it returns undefined (error case)
		expect(formatPrice(undefined)).toBeUndefined()
	})

	it('should include currency symbol when requested', () => {
		expect(formatPrice(1999, '$', true)).toBe('$19.99')
		expect(formatPrice(0, '$', true)).toBe('$0.00')
	})

	it('should use custom currency symbol', () => {
		expect(formatPrice(1999, '€', true)).toBe('€19.99')
		expect(formatPrice(1999, '£', true)).toBe('£19.99')
	})

	it('should handle string numbers', () => {
		expect(formatPrice('1999')).toBe('19.99')
		expect(formatPrice('100')).toBe('1.00')
	})
})

describe('formatCurrency', () => {
	it('should format USD correctly', () => {
		expect(formatCurrency(1999, 'USD')).toBe('$19.99')
	})

	it('should format EUR correctly', () => {
		expect(formatCurrency(1999, 'EUR')).toBe('€19.99')
	})

	it('should format GBP correctly', () => {
		expect(formatCurrency(1999, 'GBP')).toBe('£19.99')
	})

	it('should format JPY correctly', () => {
		expect(formatCurrency(1999, 'JPY')).toBe('¥19.99')
	})

	it('should use currency code as fallback for unknown currencies', () => {
		expect(formatCurrency(1999, 'CAD')).toBe('CAD19.99')
	})

	it('should default to USD', () => {
		expect(formatCurrency(1999)).toBe('$19.99')
	})
})

describe('getLineItemTotal', () => {
	it('should calculate line item total correctly', () => {
		expect(getLineItemTotal({ unit_price: 1000, quantity: 2 })).toBe('20.00')
		expect(getLineItemTotal({ unit_price: 1999, quantity: 1 })).toBe('19.99')
		expect(getLineItemTotal({ unit_price: 500, quantity: 5 })).toBe('25.00')
	})

	it('should handle fractional cents', () => {
		expect(getLineItemTotal({ unit_price: 333, quantity: 3 })).toBe('9.99')
	})
})

describe('getSelectedShippingOption', () => {
	const options = [
		{ id: 'opt_1', name: 'Standard', price: 500 },
		{ id: 'opt_2', name: 'Express', price: 1500 },
		{ id: 'opt_3', name: 'Overnight', price: 2500 }
	]

	it('should find the selected shipping option', () => {
		expect(getSelectedShippingOption(options, 'opt_2')).toEqual({
			id: 'opt_2',
			name: 'Express',
			price: 1500
		})
	})

	it('should return undefined for non-existent option', () => {
		expect(getSelectedShippingOption(options, 'opt_999')).toBeUndefined()
	})

	it('should return undefined for empty array', () => {
		expect(getSelectedShippingOption([], 'opt_1')).toBeUndefined()
	})
})

describe('getCartSubtotal', () => {
	it('should format cart subtotal', () => {
		expect(getCartSubtotal({ subtotal: 5999, items: [{}] })).toBe('59.99')
	})

	it('should return 0.00 for cart without items', () => {
		expect(getCartSubtotal({ subtotal: 5999 })).toBe('0.00')
	})

	it('should return 0.00 for empty items array', () => {
		expect(getCartSubtotal({ subtotal: 0, items: [] })).toBe('0.00')
	})
})

describe('getShippingTotal', () => {
	it('should format shipping total', () => {
		expect(getShippingTotal({ shipping_total: 599 })).toBe('5.99')
	})

	it('should return 0.00 for no shipping', () => {
		expect(getShippingTotal({ shipping_total: 0 })).toBe('0.00')
		expect(getShippingTotal({})).toBe('0.00')
	})
})

describe('getTaxTotal', () => {
	it('should format tax total', () => {
		expect(getTaxTotal({ tax_total: 450 })).toBe('4.50')
	})

	it('should return 0.00 for no tax', () => {
		expect(getTaxTotal({ tax_total: 0 })).toBe('0.00')
		expect(getTaxTotal({})).toBe('0.00')
	})
})

describe('getOrderTotal', () => {
	it('should format order total', () => {
		expect(getOrderTotal({ total: 7048 })).toBe('70.48')
	})

	it('should return 0.00 for no total', () => {
		expect(getOrderTotal({ total: 0 })).toBe('0.00')
		expect(getOrderTotal({})).toBe('0.00')
	})
})
