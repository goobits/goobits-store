<script>
	import { onMount } from 'svelte'
	import MFAGracePeriodBanner from './MFAGracePeriodBanner.svelte'
	import { fetchMFAStatus, shouldShowGracePeriodBanner } from './mfaStatus.js'

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
	let {
		auth,
		backendUrl = '',
		onSetupNow = () => {}
	} = $props()

	// MFA status state
	let mfaStatus = $state(null)
	let loading = $state(true)
	let error = $state(false)

	// Auth state
	let authState = $state({ token: null })

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
	let showBanner = $derived(
		!loading &&
		!error &&
		mfaStatus &&
		shouldShowGracePeriodBanner(mfaStatus)
	)

	// Load MFA status when component mounts or auth changes
	// Only fetch when we have customer data (confirmed authentication)
	$effect(() => {
		if (authState.customer && authState.token && backendUrl) {
			loadMFAStatus()
		} else {
			// Reset MFA status if user logs out
			if (!authState.customer) {
				mfaStatus = null
				loading = false
			}
		}
	})

	async function loadMFAStatus() {
		loading = true
		error = false

		try {
			const status = await fetchMFAStatus(backendUrl, authState.token)
			mfaStatus = status
		} catch (err) {
			console.error('Error loading MFA status:', err)
			error = true
		} finally {
			loading = false
		}
	}

	function handleSetupNow() {
		// Call parent callback
		onSetupNow()

		// Default behavior: navigate to account page MFA section
		if (typeof window !== 'undefined') {
			// You can customize this based on your app structure
			window.location.href = '/shop/account?section=mfa'
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
