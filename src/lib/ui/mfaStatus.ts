/**
 * MFA Status Utility
 *
 * Client-side utilities for checking MFA status and managing grace period warnings.
 * Used by the MFAGracePeriodBanner component and shop layout.
 *
 * @module @goobits/store/ui/mfaStatus
 * @version 1.0.0
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('MFAStatus')

/**
 * MFA Status object returned from API
 */
export interface MFAStatus {
	required: boolean
	enabled: boolean
	inGracePeriod: boolean
	daysRemaining?: number
	gracePeriodEndsAt?: string | null
	error?: boolean
}

/**
 * MFA Status Store state
 */
export interface MFAStatusStoreState extends MFAStatus {
	loading: boolean
}

/**
 * Subscriber function type
 */
type Subscriber = (status: MFAStatusStoreState) => void

/**
 * Urgency level type
 */
export type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'info'

/**
 * MFA Status Store interface
 */
export interface MFAStatusStore {
	subscribe: (subscriber: Subscriber) => () => void
	set: (newStatus: Partial<MFAStatusStoreState>) => void
	load: (backendUrl: string, publishableKey: string) => Promise<void>
}

/**
 * Fetch MFA status from the API
 * @param backendUrl - Medusa backend URL
 * @param publishableKey - Medusa publishable API key
 * @returns MFA status object
 */
export async function fetchMFAStatus(backendUrl: string, publishableKey: string): Promise<MFAStatus> {
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
			// If not authenticated or endpoint doesn't exist, return default (not an error)
			// 400 = Bad Request (invalid/missing auth), 401 = Unauthorized, 404 = Not Found, 500 = Server Error
			if (response.status === 400 || response.status === 401 || response.status === 404 || response.status === 500) {
				// Don't log these as errors - they're expected when not authenticated
				return {
					required: false,
					enabled: false,
					inGracePeriod: false,
					error: false
				}
			}
			throw new Error(`HTTP error! status: ${ response.status }`)
		}

		const data = await response.json()

		if (data.success && data.status) {
			return data.status as MFAStatus
		}

		return {
			required: false,
			enabled: false,
			inGracePeriod: false,
			error: true
		}
	} catch (error) {
		// Only log unexpected errors (not auth-related)
		if (!(error instanceof Error) || (!error.message.includes('401') && !error.message.includes('500'))) {
			logger.error('Error fetching MFA status:', error)
		}
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
 * @param mfaStatus - MFA status from API
 * @returns True if banner should be shown
 */
export function shouldShowGracePeriodBanner(mfaStatus: MFAStatus | null): boolean {
	if (!mfaStatus) {return false}

	// Show banner if MFA is required but not enabled, and in grace period
	return mfaStatus.required &&
		!mfaStatus.enabled &&
		mfaStatus.inGracePeriod &&
		typeof mfaStatus.daysRemaining === 'number'
}

/**
 * Get urgency level based on days remaining
 * @param daysRemaining - Days remaining in grace period
 * @returns Urgency level: 'critical', 'urgent', 'warning', or 'info'
 */
export function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
	if (daysRemaining < 3) {return 'critical'}
	if (daysRemaining < 7) {return 'urgent'}
	if (daysRemaining < 14) {return 'warning'}
	return 'info'
}

/**
 * Format grace period end date
 * @param gracePeriodEndsAt - ISO date string
 * @returns Formatted date string
 */
export function formatGracePeriodEndDate(gracePeriodEndsAt: string | null | undefined): string {
	if (!gracePeriodEndsAt) {return ''}

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
 * @returns Store with subscribe method
 */
export function createMFAStatusStore(): MFAStatusStore {
	let subscribers: Subscriber[] = []
	let status: MFAStatusStoreState = {
		required: false,
		enabled: false,
		inGracePeriod: false,
		daysRemaining: undefined,
		gracePeriodEndsAt: null,
		loading: true,
		error: false
	}

	function set(newStatus: Partial<MFAStatusStoreState>): void {
		status = { ...status, ...newStatus }
		subscribers.forEach(subscriber => subscriber(status))
	}

	function subscribe(subscriber: Subscriber): () => void {
		subscribers.push(subscriber)
		subscriber(status)

		return () => {
			subscribers = subscribers.filter(s => s !== subscriber)
		}
	}

	async function load(backendUrl: string, publishableKey: string): Promise<void> {
		set({ loading: true, error: false })

		try {
			const mfaStatus = await fetchMFAStatus(backendUrl, publishableKey)
			set({
				...mfaStatus,
				loading: false,
				error: false
			})
		} catch (error) {
			logger.error('Error loading MFA status:', error)
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
 * @param daysRemaining - Days remaining in grace period
 * @returns True if banner is currently dismissed
 */
export function isBannerDismissed(daysRemaining: number): boolean {
	if (typeof window === 'undefined') {return false}

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
		logger.error('Error checking banner dismissal:', error)
	}

	return false
}

/**
 * Dismiss banner (store in localStorage with 24h expiry)
 * @param daysRemaining - Days remaining in grace period
 */
export function dismissBanner(daysRemaining: number): void {
	if (typeof window === 'undefined') {return}

	try {
		const dismissalKey = `mfa-banner-dismissed-${ daysRemaining }`
		const expiryDate = new Date()
		expiryDate.setHours(expiryDate.getHours() + 24)
		localStorage.setItem(dismissalKey, expiryDate.toISOString())
	} catch (error) {
		logger.error('Error dismissing banner:', error)
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
