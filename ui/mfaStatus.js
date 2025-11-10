/**
 * MFA Status Utility
 *
 * Client-side utilities for checking MFA status and managing grace period warnings.
 * Used by the MFAGracePeriodBanner component and shop layout.
 *
 * @module @goobits/store/ui/mfaStatus
 * @version 1.0.0
 */

/**
 * Fetch MFA status from the API
 * @param {string} backendUrl - Medusa backend URL
 * @param {string} publishableKey - Medusa publishable API key
 * @returns {Promise<Object>} MFA status object
 */
export async function fetchMFAStatus(backendUrl, publishableKey) {
	try {
		const response = await fetch(`${ backendUrl }/store/auth/mfa/status`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-publishable-api-key': publishableKey
			},
			credentials: 'include'
		})

		if (!response.ok) {
			// If not authenticated or endpoint doesn't exist, return default
			// 400 = Bad Request (invalid/missing auth), 401 = Unauthorized, 404 = Not Found
			if (response.status === 400 || response.status === 401 || response.status === 404) {
				return {
					required: false,
					enabled: false,
					inGracePeriod: false,
					error: false // Not really an error, just means MFA not available/required
				}
			}
			throw new Error(`HTTP error! status: ${ response.status }`)
		}

		const data = await response.json()

		if (data.success && data.status) {
			return data.status
		}

		return {
			required: false,
			enabled: false,
			inGracePeriod: false,
			error: true
		}
	} catch (error) {
		console.error('Error fetching MFA status:', error)
		return {
			required: false,
			enabled: false,
			inGracePeriod: false,
			error: true
		}
	}
}

/**
 * Check if MFA grace period banner should be shown
 * @param {Object} mfaStatus - MFA status from API
 * @returns {boolean} True if banner should be shown
 */
export function shouldShowGracePeriodBanner(mfaStatus) {
	if (!mfaStatus) return false

	// Show banner if MFA is required but not enabled, and in grace period
	return mfaStatus.required &&
		!mfaStatus.enabled &&
		mfaStatus.inGracePeriod &&
		typeof mfaStatus.daysRemaining === 'number'
}

/**
 * Get urgency level based on days remaining
 * @param {number} daysRemaining - Days remaining in grace period
 * @returns {string} Urgency level: 'critical', 'urgent', 'warning', or 'info'
 */
export function getUrgencyLevel(daysRemaining) {
	if (daysRemaining < 3) return 'critical'
	if (daysRemaining < 7) return 'urgent'
	if (daysRemaining < 14) return 'warning'
	return 'info'
}

/**
 * Format grace period end date
 * @param {string} gracePeriodEndsAt - ISO date string
 * @returns {string} Formatted date string
 */
export function formatGracePeriodEndDate(gracePeriodEndsAt) {
	if (!gracePeriodEndsAt) return ''

	try {
		const date = new Date(gracePeriodEndsAt)
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	} catch {
		return ''
	}
}

/**
 * Create MFA status store (Svelte-compatible)
 * @returns {Object} Store with subscribe method
 */
export function createMFAStatusStore() {
	let subscribers = []
	let status = {
		required: false,
		enabled: false,
		inGracePeriod: false,
		daysRemaining: null,
		gracePeriodEndsAt: null,
		loading: true,
		error: false
	}

	function set(newStatus) {
		status = { ...status, ...newStatus }
		subscribers.forEach(subscriber => subscriber(status))
	}

	function subscribe(subscriber) {
		subscribers.push(subscriber)
		subscriber(status)

		return () => {
			subscribers = subscribers.filter(s => s !== subscriber)
		}
	}

	async function load(backendUrl, publishableKey) {
		set({ loading: true, error: false })

		try {
			const mfaStatus = await fetchMFAStatus(backendUrl, publishableKey)
			set({
				...mfaStatus,
				loading: false,
				error: false
			})
		} catch (error) {
			console.error('Error loading MFA status:', error)
			set({
				loading: false,
				error: true
			})
		}
	}

	return {
		subscribe,
		set,
		load
	}
}

/**
 * Check dismissal status from localStorage
 * @param {number} daysRemaining - Days remaining in grace period
 * @returns {boolean} True if banner is currently dismissed
 */
export function isBannerDismissed(daysRemaining) {
	if (typeof window === 'undefined') return false

	try {
		const dismissalKey = `mfa-banner-dismissed-${ daysRemaining }`
		const dismissedUntil = localStorage.getItem(dismissalKey)

		if (dismissedUntil) {
			const expiryDate = new Date(dismissedUntil)
			if (expiryDate > new Date()) {
				return true
			} else {
				localStorage.removeItem(dismissalKey)
			}
		}
	} catch (error) {
		console.error('Error checking banner dismissal:', error)
	}

	return false
}

/**
 * Dismiss banner (store in localStorage with 24h expiry)
 * @param {number} daysRemaining - Days remaining in grace period
 */
export function dismissBanner(daysRemaining) {
	if (typeof window === 'undefined') return

	try {
		const dismissalKey = `mfa-banner-dismissed-${ daysRemaining }`
		const expiryDate = new Date()
		expiryDate.setHours(expiryDate.getHours() + 24)
		localStorage.setItem(dismissalKey, expiryDate.toISOString())
	} catch (error) {
		console.error('Error dismissing banner:', error)
	}
}

export default {
	fetchMFAStatus,
	shouldShowGracePeriodBanner,
	getUrgencyLevel,
	formatGracePeriodEndDate,
	createMFAStatusStore,
	isBannerDismissed,
	dismissBanner
}
