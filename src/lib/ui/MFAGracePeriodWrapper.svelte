<script>
	import MFAGracePeriodBanner from './MFAGracePeriodBanner.svelte'
	import { fetchMFAStatus, shouldShowGracePeriodBanner } from './mfaStatus.js'
	import { getPublishableKey } from '../config/urls.js'
	import { createLogger } from '../utils/logger.js'

	const logger = createLogger('MFAGracePeriodWrapper')

	/**
	 * MFAGracePeriodWrapper - Wrapper that manages MFA status checking
	 *
	 * Automatically fetches MFA status and shows banner if needed.
	 * Integrates with auth store to get current user token.
	 *
	 * @prop {Object} auth - Auth store instance
	 * @prop {string} backendUrl - Medusa backend URL
	 * @prop {Function} onSetupNow - Callback when "Set up now" is clicked
	 */
	const {
		auth,
		backendUrl = '',
		onSetupNow = () => {}
	} = $props()

	// MFA status state
	let mfaStatus = $state(null)
	let loading = $state(true)
	let error = $state(false)

	// Auth state
	let authState = $state({ customer: null, user: null })

	// Subscribe to auth store
	$effect(() => {
		if (auth) {
			const unsubAuth = auth.subscribe((state) => {
				authState = state
			})
			return unsubAuth
		}
	})

	// Check if banner should be shown
	const showBanner = $derived(
		!loading &&
		!error &&
		mfaStatus &&
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

	async function loadMFAStatus() {
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

	function handleSetupNow() {
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
