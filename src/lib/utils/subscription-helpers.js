/**
 * Subscription Helper Utilities
 *
 * Reusable functions for working with subscriptions
 * across different storefronts
 */

/**
 * Format currency amount
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code (default: 'usd')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'usd') {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase()
	}).format(amount / 100)
}

/**
 * Format date
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
	if (!dateString) {return 'N/A'}
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

/**
 * Get interval display text
 * @param {string} interval - Interval type (day, week, month, year)
 * @param {number} intervalCount - Number of intervals (default: 1)
 * @returns {string} Display text (e.g., "month", "2 months")
 */
export function getIntervalText(interval, intervalCount = 1) {
	if (intervalCount === 1) {
		return interval
	}
	return `${intervalCount} ${interval}s`
}

/**
 * Get status badge CSS class
 * @param {string} status - Subscription status
 * @returns {string} CSS class name
 */
export function getStatusClass(status) {
	const classes = {
		active: 'subscription-status--active',
		paused: 'subscription-status--paused',
		cancelled: 'subscription-status--cancelled',
		expired: 'subscription-status--expired',
		past_due: 'subscription-status--past-due',
		incomplete: 'subscription-status--incomplete'
	}
	return classes[status] || ''
}

/**
 * Filter subscriptions by status
 * @param {Array} subscriptions - Array of subscription objects
 * @param {string|Array} status - Status or array of statuses to filter by
 * @returns {Array} Filtered subscriptions
 */
export function filterByStatus(subscriptions, status) {
	const statuses = Array.isArray(status) ? status : [status]
	return subscriptions.filter(s => statuses.includes(s.status))
}

/**
 * Get active subscriptions
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {Array} Active subscriptions
 */
export function getActiveSubscriptions(subscriptions) {
	return filterByStatus(subscriptions, 'active')
}

/**
 * Get paused subscriptions
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {Array} Paused subscriptions
 */
export function getPausedSubscriptions(subscriptions) {
	return filterByStatus(subscriptions, 'paused')
}

/**
 * Get past subscriptions (cancelled or expired)
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {Array} Past subscriptions
 */
export function getPastSubscriptions(subscriptions) {
	return filterByStatus(subscriptions, ['cancelled', 'expired'])
}

/**
 * Calculate days until next billing
 * @param {string|Date} nextBillingDate - Next billing date
 * @returns {number} Days until next billing (negative if past due)
 */
export function daysUntilBilling(nextBillingDate) {
	if (!nextBillingDate) {return null}
	const now = new Date()
	const billing = new Date(nextBillingDate)
	const diff = billing.getTime() - now.getTime()
	return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Check if subscription is past due
 * @param {Object} subscription - Subscription object
 * @returns {boolean} True if past due
 */
export function isPastDue(subscription) {
	return subscription.status === 'past_due' || daysUntilBilling(subscription.next_billing_date) < 0
}

/**
 * Get discount display text
 * @param {Object} subscription - Subscription object
 * @returns {string} Discount text (e.g., "10% off", "$5.00 off")
 */
export function getDiscountText(subscription) {
	if (!subscription.discount_value || subscription.discount_type === 'none') {
		return ''
	}

	if (subscription.discount_type === 'percentage') {
		return `${subscription.discount_value}% off`
	}

	if (subscription.discount_type === 'fixed') {
		return `${formatCurrency(subscription.discount_value, subscription.currency_code)} off`
	}

	return ''
}
