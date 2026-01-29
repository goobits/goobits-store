/**
 * Subscription Helper Utilities
 *
 * Reusable functions for working with subscriptions
 * across different storefronts
 */

/**
 * Subscription object structure
 */
interface SubscriptionData {
	status: string;
	next_billing_date?: string | Date;
	discount_value?: number;
	discount_type?: 'none' | 'percentage' | 'fixed';
	currency_code?: string;
}

/**
 * Format currency amount
 * @param amount - Amount in cents
 * @param currency - Currency code (default: 'usd')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'usd'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase()
	}).format(amount / 100)
}

/**
 * Format date
 * @param dateString - Date to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date | null | undefined): string {
	if (!dateString) { return 'N/A' }
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

/**
 * Get interval display text
 * @param interval - Interval type (day, week, month, year)
 * @param intervalCount - Number of intervals (default: 1)
 * @returns Display text (e.g., "month", "2 months")
 */
export function getIntervalText(interval: string, intervalCount = 1): string {
	if (intervalCount === 1) {
		return interval
	}
	return `${intervalCount} ${interval}s`
}

/**
 * Get status badge CSS class
 * @param status - Subscription status
 * @returns CSS class name
 */
export function getStatusClass(status: string): string {
	const classes: Record<string, string> = {
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
 * @param subscriptions - Array of subscription objects
 * @param status - Status or array of statuses to filter by
 * @returns Filtered subscriptions
 */
export function filterByStatus<T extends SubscriptionData>(subscriptions: T[], status: string | string[]): T[] {
	const statuses = Array.isArray(status) ? status : [status]
	return subscriptions.filter(s => statuses.includes(s.status))
}

/**
 * Get active subscriptions
 * @param subscriptions - Array of subscription objects
 * @returns Active subscriptions
 */
export function getActiveSubscriptions<T extends SubscriptionData>(subscriptions: T[]): T[] {
	return filterByStatus(subscriptions, 'active')
}

/**
 * Get paused subscriptions
 * @param subscriptions - Array of subscription objects
 * @returns Paused subscriptions
 */
export function getPausedSubscriptions<T extends SubscriptionData>(subscriptions: T[]): T[] {
	return filterByStatus(subscriptions, 'paused')
}

/**
 * Get past subscriptions (cancelled or expired)
 * @param subscriptions - Array of subscription objects
 * @returns Past subscriptions
 */
export function getPastSubscriptions<T extends SubscriptionData>(subscriptions: T[]): T[] {
	return filterByStatus(subscriptions, ['cancelled', 'expired'])
}

/**
 * Calculate days until next billing
 * @param nextBillingDate - Next billing date
 * @returns Days until next billing (negative if past due)
 */
export function daysUntilBilling(nextBillingDate: string | Date | null | undefined): number | null {
	if (!nextBillingDate) { return null }
	const now = new Date()
	const billing = new Date(nextBillingDate)
	const diff = billing.getTime() - now.getTime()
	return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Check if subscription is past due
 * @param subscription - Subscription object
 * @returns True if past due
 */
export function isPastDue(subscription: SubscriptionData): boolean {
	const days = daysUntilBilling(subscription.next_billing_date)
	return subscription.status === 'past_due' || (days !== null && days < 0)
}

/**
 * Get discount display text
 * @param subscription - Subscription object
 * @returns Discount text (e.g., "10% off", "$5.00 off")
 */
export function getDiscountText(subscription: SubscriptionData): string {
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
