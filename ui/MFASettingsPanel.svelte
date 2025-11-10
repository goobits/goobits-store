<script>
	import { get } from 'svelte/store'
	import Modal from '@goobits/forms/ui/modals/Modal.svelte'
	import Button from '@goobits/forms/ui/modals/Button.svelte'
	import MFABackupCodes from './MFABackupCodes.svelte'
	import MFAEnrollmentWizard from './MFAEnrollmentWizard.svelte'
	import { getBackendUrl, getPublishableKey } from '@goobits/config/urls'

	/**
	 * MFASettingsPanel - MFA Settings and Management
	 *
	 * Displays MFA status and provides controls to enable/disable MFA
	 * and manage backup codes.
	 *
	 * @prop {Object} auth - Auth store instance
	 * @prop {Function} [onEnrollComplete] - Callback when enrollment is complete
	 */
	let {
		auth,
		onEnrollComplete = null
	} = $props()

	// Component state
	let mfaStatus = $state(null)
	let loading = $state(true)
	let error = $state(null)
	let showDisableModal = $state(false)
	let showBackupCodesModal = $state(false)
	let verificationCode = $state('')
	let isDisabling = $state(false)
	let backupCodes = $state(null)
	let showEnrollmentWizard = $state(false)

	const backendUrl = $derived(getBackendUrl())
	const publishableKey = $derived(getPublishableKey())

	// Fetch MFA status
	async function fetchMFAStatus() {
		loading = true
		error = null

		try {
			const authState = auth ? get(auth) : null
			const customer = authState?.customer || authState?.user

			if (!customer) {
				throw new Error('Not authenticated')
			}

			const response = await fetch(`${ backendUrl }/store/auth/mfa/status`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'x-publishable-api-key': publishableKey
				},
				credentials: 'include'
			})

			if (!response.ok) {
				throw new Error('Failed to fetch MFA status')
			}

			const data = await response.json()
			mfaStatus = data.status || { enabled: false, inGracePeriod: false }
		} catch (err) {
			console.error('MFA status fetch error:', err)
			error = err.message
			// Set a default status so UI still renders
			mfaStatus = { enabled: false, inGracePeriod: false }
		} finally {
			loading = false
		}
	}

	// Load MFA status on mount
	$effect(() => {
		fetchMFAStatus()
	})

	// Handle enable MFA
	function handleEnableMFA() {
		showEnrollmentWizard = true
	}

	// Handle enrollment complete
	function handleEnrollmentComplete(codes) {
		showEnrollmentWizard = false
		backupCodes = codes
		showBackupCodesModal = true
		fetchMFAStatus() // Refresh status

		if (onEnrollComplete) {
			onEnrollComplete()
		}
	}

	// Handle disable MFA
	async function handleDisableMFA() {
		if (!verificationCode) {
			return
		}

		isDisabling = true
		error = null

		try {
			const authState = auth ? get(auth) : null
			const customer = authState?.customer

			if (!customer) {
				throw new Error('Not authenticated')
			}

			const response = await fetch(`${ backendUrl }/store/auth/mfa/disable`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-publishable-api-key': publishableKey
				},
				credentials: 'include',
				body: JSON.stringify({
					password: verificationCode  // Better Auth requires password to disable MFA
				})
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to disable MFA')
			}

			// Success - close modal and refresh
			showDisableModal = false
			verificationCode = ''
			await fetchMFAStatus()
		} catch (err) {
			error = err.message
		} finally {
			isDisabling = false
		}
	}

	// Handle regenerate backup codes
	function handleRegenerateBackupCodes() {
		showBackupCodesModal = true
	}

	// Close modals
	function closeDisableModal() {
		showDisableModal = false
		verificationCode = ''
		error = null
	}

	function closeBackupCodesModal() {
		showBackupCodesModal = false
		backupCodes = null
	}

	function closeEnrollmentWizard() {
		showEnrollmentWizard = false
	}
</script>

<div class="goo__mfa-settings">
	{#if error && !loading}
		<div class="goo__error-banner" role="alert">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="12" y1="8" x2="12" y2="12"></line>
				<line x1="12" y1="16" x2="12.01" y2="16"></line>
			</svg>
			<span>{error}</span>
			<button onclick={() => error = null} class="goo__error-close" aria-label="Close">×</button>
		</div>
	{/if}

	{#if loading}
		<div class="goo__loading">
			<p>Loading MFA settings...</p>
		</div>
	{:else if mfaStatus}
		<div class="goo__mfa-status">
			<div class="goo__status-row">
				<div class="goo__status-info">
					<span class="goo__status-label">Status:</span>
					<span class="goo__status-value {mfaStatus.enabled ? 'enabled' : 'disabled'}">
						{mfaStatus.enabled ? 'Enabled' : 'Disabled'}
					</span>
				</div>

				{#if mfaStatus.enabled}
					<div class="goo__status-info">
						<span class="goo__status-label">Backup Codes:</span>
						<span class="goo__status-value">
							{mfaStatus.backupCodesRemaining || 0} remaining
						</span>
					</div>
				{/if}
			</div>

			{#if mfaStatus.inGracePeriod && !mfaStatus.enabled}
				<div class="goo__grace-period-warning" role="alert">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<div>
						<strong>Action Required:</strong>
						{#if mfaStatus.daysRemaining <= 1}
							MFA enrollment required by tomorrow! Please set up two-factor authentication immediately.
						{:else if mfaStatus.daysRemaining <= 7}
							MFA enrollment required in {mfaStatus.daysRemaining} days.
						{:else}
							MFA enrollment required within {mfaStatus.daysRemaining} days.
						{/if}
					</div>
				</div>
			{/if}

			<div class="goo__actions">
				{#if mfaStatus.enabled}
					<Button
						variant="secondary"
						onclick={handleRegenerateBackupCodes}
					>
						Regenerate Backup Codes
					</Button>
					<Button
						variant="danger"
						onclick={() => showDisableModal = true}
					>
						Disable MFA
					</Button>
				{:else}
					<Button
						variant="primary"
						onclick={handleEnableMFA}
					>
						Enable MFA
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Disable MFA Confirmation Modal -->
<Modal
	isVisible={showDisableModal}
	onClose={closeDisableModal}
	title="Disable Two-Factor Authentication"
	size="sm"
>
	<div class="goo__warning-box">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
		</svg>
		<p>Disabling two-factor authentication will make your account less secure.</p>
	</div>

	<form onsubmit={(e) => { e.preventDefault(); handleDisableMFA(); }}>
		<div class="goo__form-group">
			<label for="verification-code">
				Enter your password to confirm:
			</label>
			<input
				type="password"
				id="verification-code"
				bind:value={verificationCode}
				placeholder="Password"
				required
				disabled={isDisabling}
				autocomplete="current-password"
			/>
		</div>

		<!-- Alert component removed - not imported
		<Alert
			isVisible={!!error}
			onClose={() => error = null}
			variant="danger"
			title="Verification Failed"
			message={error || ''}
			size="sm"
		/>
		-->

		<div class="goo__modal-actions">
			<Button
				type="button"
				variant="secondary"
				onclick={closeDisableModal}
				disabled={isDisabling}
			>
				Cancel
			</Button>
			<Button
				type="submit"
				variant="danger"
				loading={isDisabling}
				disabled={!verificationCode}
			>
				Disable MFA
			</Button>
		</div>
	</form>
</Modal>

<!-- Backup Codes Modal -->
<Modal
	isVisible={showBackupCodesModal}
	onClose={closeBackupCodesModal}
	size="lg"
	showCloseButton={false}
>
	<MFABackupCodes
		{auth}
		backupCodes={backupCodes}
		onClose={closeBackupCodesModal}
		onRegenerate={(newCodes) => {
			backupCodes = newCodes
			fetchMFAStatus()
		}}
		isNewEnrollment={!!backupCodes}
	/>
</Modal>

<!-- Enrollment Wizard Modal -->
<Modal
	isVisible={showEnrollmentWizard}
	onClose={closeEnrollmentWizard}
	size="lg"
	showCloseButton={false}
>
	{#if auth}
		{@const authState = get(auth)}
		{#if authState?.customer?.id}
			<MFAEnrollmentWizard
				userId={authState.customer.id}
				{backendUrl}
				onComplete={handleEnrollmentComplete}
				onCancel={closeEnrollmentWizard}
				allowSkip={false}
			/>
		{:else}
			<div class="goo__modal-placeholder">
				<p>Unable to load enrollment wizard - authentication required</p>
				<Button variant="secondary" onclick={closeEnrollmentWizard}>
					Close
				</Button>
			</div>
		{/if}
	{/if}
</Modal>

<style lang="scss">
	@use '../../../sveltekit/src/styles/variables.scss' as *;

	.goo__mfa-settings {
		width: 100%;
	}

	.goo__error-banner {
		display: flex;
		align-items: center;
		gap: $spacing-medium;
		padding: $spacing-medium;
		margin-bottom: $spacing-medium;
		background-color: var(--error-bg);
		color: var(--error-text);
		border: 1px solid var(--error-border);
		border-radius: $border-radius-medium;
		font-size: 0.9rem;

		svg {
			flex-shrink: 0;
		}

		span {
			flex: 1;
		}
	}

	.goo__error-close {
		background: none;
		border: none;
		color: var(--error-text);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		padding: 0 $spacing-small;
		opacity: 0.7;
		transition: opacity 0.2s ease;

		&:hover {
			opacity: 1;
		}
	}

	.goo__mfa-disabled-notice {
		display: flex;
		gap: $spacing-medium;
		padding: $spacing-large;
		background-color: var(--bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: $border-radius-medium;

		svg {
			flex-shrink: 0;
			color: var(--text-secondary);
			margin-top: 2px;
		}

		div {
			flex: 1;
		}

		h3 {
			margin: 0 0 $spacing-small 0;
			color: var(--text-primary);
			font-size: 1.1rem;
			font-weight: 600;
		}

		p {
			margin: 0 0 $spacing-small 0;
			color: var(--text-secondary);
			line-height: 1.5;

			&:last-child {
				margin-bottom: 0;
			}
		}

		.goo__notice-detail {
			font-size: 0.9rem;
			color: var(--text-tertiary);
		}
	}

	.goo__loading {
		text-align: center;
		padding: $spacing-large;
		color: var(--text-secondary);
	}

	.goo__mfa-status {
		display: flex;
		flex-direction: column;
		gap: $spacing-medium;
	}

	.goo__status-row {
		display: flex;
		gap: $spacing-xlarge;
		flex-wrap: wrap;
	}

	.goo__status-info {
		display: flex;
		gap: $spacing-small;
		align-items: center;
	}

	.goo__status-label {
		font-weight: 500;
		color: var(--text-secondary);
	}

	.goo__status-value {
		color: var(--text-primary);
		font-weight: 600;

		&.enabled {
			color: var(--success-text);
		}

		&.disabled {
			color: var(--text-secondary);
		}
	}

	.goo__grace-period-warning {
		display: flex;
		gap: $spacing-medium;
		padding: $spacing-medium;
		background-color: var(--warning-bg);
		color: var(--warning-text);
		border-radius: $border-radius-medium;
		border-left: 4px solid var(--warning-border);

		svg {
			flex-shrink: 0;
			margin-top: 2px;
		}

		strong {
			display: block;
			margin-bottom: $spacing-small;
		}
	}

	.goo__actions {
		display: flex;
		gap: $spacing-medium;
		flex-wrap: wrap;
		margin-top: $spacing-medium;
	}

	/* Modal Content Styles (modal container handled by forms package) */

	.goo__warning-box {
		display: flex;
		gap: $spacing-medium;
		padding: $spacing-medium;
		background-color: var(--warning-bg);
		color: var(--warning-text);
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-large;

		svg {
			flex-shrink: 0;
		}

		p {
			margin: 0;
		}
	}

	.goo__form-group {
		margin-bottom: $spacing-large;

		label {
			display: block;
			margin-bottom: $spacing-small;
			font-weight: 500;
			color: var(--text-secondary);
		}

		input {
			width: 100%;
			padding: $spacing-small $spacing-medium;
			border: 1px solid var(--color-border);
			border-radius: $border-radius-medium;
			font-size: 1rem;
			background-color: var(--bg-primary);
			color: var(--text-primary);
			text-align: center;
			font-family: 'Courier New', monospace;
			font-size: 1.5rem;
			letter-spacing: 0.5em;

			&:focus {
				outline: none;
				border-color: var(--accent-primary);
				box-shadow: 0 0 0 3px var(--accent-shadow);
			}

			&:disabled {
				background-color: var(--bg-secondary);
				cursor: not-allowed;
			}
		}
	}

	.goo__modal-actions {
		display: flex;
		gap: $spacing-medium;
		justify-content: flex-end;
		margin-top: $spacing-large;
	}

	.goo__modal-placeholder {
		padding: $spacing-xlarge;
		text-align: center;
		color: var(--text-secondary);

		p {
			margin-bottom: $spacing-medium;
		}
	}

	@media (max-width: 768px) {
		.goo__modal-overlay {
			padding: $spacing-medium;
		}

		.goo__modal {
			max-width: 100%;
		}

		.goo__modal-header {
			padding: $spacing-medium;
		}

		.goo__modal-content {
			padding: $spacing-medium;
		}

		.goo__status-row {
			flex-direction: column;
			gap: $spacing-medium;
		}

		.goo__actions {
			flex-direction: column;

			:global(.modal-button) {
				width: 100%;
			}
		}
	}
</style>
