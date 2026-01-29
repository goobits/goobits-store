<script lang="ts">
	import MFAGracePeriodBanner from './MFAGracePeriodBanner.svelte'
	import { fetchMFAStatus, shouldShowGracePeriodBanner, type MFAStatus } from './mfaStatus'
	import { getPublishableKey } from '../config/urls'
	import { createLogger } from '../utils/logger'
	import type { Readable } from 'svelte/store'

	const logger = createLogger('MFAGracePeriodWrapper')

	/**
	 * MFAGracePeriodWrapper - Wrapper that manages MFA status checking
	 *
	 * Automatically fetches MFA status and shows banner if needed.
	 * Integrates with auth store to get current user token.
	 */

	interface AuthState {
		customer?: { id: string } | null
		user?: { id: string } | null
	}

	interface Props {
		auth: Readable<AuthState>
		backendUrl?: string
		onSetupNow?: () => void
	}

	const {
		auth,
		backendUrl = '',
		onSetupNow = () => {}
	}: Props = $props()

	// MFA status state
	let mfaStatus: MFAStatus | null = $state(null)
	let loading: boolean = $state(true)
	let error: boolean = $state(false)

	// Auth state
	let authState: AuthState = $state({ customer: null, user: null })

	// Subscribe to auth store
	$effect(() => {
		if (auth) {
			const unsubAuth = auth.subscribe((state) => {
				authState = state
			})
			return unsubAuth
		}
		return undefined
	})

	// Check if banner should be shown
	const showBanner: boolean = $derived(
		!loading &&
		!error &&
		mfaStatus !== null &&
		shouldShowGracePeriodBanner(mfaStatus)
	)

	// Load MFA status when component mounts or auth changes
	// Only fetch when we have customer data (confirmed authentication)
	$effect(() => {
		const isAuthenticated = authState.customer || authState.user
		const hasUserId = isAuthenticated && (authState.customer?.id || authState.user?.id)

		if (hasUserId && backendUrl) {
			loadMFAStatus()
		} else {
			// Reset MFA status if user logs out or not authenticated
			if (!hasUserId) {
				mfaStatus = null
				loading = false
			}
		}
	})

	async function loadMFAStatus(): Promise<void> {
		loading = true
		error = false

		try {
			const status = await fetchMFAStatus(backendUrl, getPublishableKey())
			mfaStatus = status
		} catch (err) {
			logger.error('Error loading MFA status:', err)
			error = true
		} finally {
			loading = false
		}
	}

	function handleSetupNow(): void {
		// Call parent callback
		onSetupNow()

		// Navigate to MFA setup page
		if (typeof window !== 'undefined') {
			window.location.href = '/shop/account/mfa-setup'
		}
	}
</script>

{#if showBanner && mfaStatus}
	<MFAGracePeriodBanner
		daysRemaining={mfaStatus.daysRemaining}
		gracePeriodEndsAt={mfaStatus.gracePeriodEndsAt}
		onSetupNow={handleSetupNow}
	/>
{/if}
