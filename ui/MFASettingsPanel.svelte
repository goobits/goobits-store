<script>
	import { get } from 'svelte/store'
	import MFABackupCodes from './MFABackupCodes.svelte'
	import MFAEnrollmentWizard from './MFAEnrollmentWizard.svelte'

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

	const backendUrl = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:3282'
	const publishableKey = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY

	// Fetch MFA status
	async function fetchMFAStatus() {
		loading = true
		error = null

		try {
			const authState = auth ? get(auth) : null
			const customer = authState?.customer

			if (!customer) {
				throw new Error('Not authenticated')
			}

			const response = await fetch(`${ backendUrl }/auth/customer/mfa/status`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			})

			if (!response.ok) {
				throw new Error('Failed to fetch MFA status')
			}

			const data = await response.json()
			mfaStatus = data.status
		} catch (err) {
			error = err.message
			mfaStatus = null
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

			const response = await fetch(`${ backendUrl }/auth/customer/mfa/disable`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					verificationCode
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
	{#if loading}
		<div class="goo__loading">
			<p>Loading MFA settings...</p>
		</div>
	{:else if error}
		<div class="goo__error" role="alert">
			{error}
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
					<button
						onclick={handleRegenerateBackupCodes}
						class="goo__action-button secondary"
					>
						Regenerate Backup Codes
					</button>
					<button
						onclick={() => showDisableModal = true}
						class="goo__action-button danger"
					>
						Disable MFA
					</button>
				{:else}
					<button
						onclick={handleEnableMFA}
						class="goo__action-button primary"
					>
						Enable MFA
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Disable MFA Confirmation Modal -->
{#if showDisableModal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="goo__modal-overlay"
		role="button"
		tabindex="0"
		onclick={closeDisableModal}
		onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && closeDisableModal()}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="goo__modal"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="goo__modal-header">
				<h3>Disable Two-Factor Authentication</h3>
				<button onclick={closeDisableModal} class="goo__modal-close" aria-label="Close">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="goo__modal-content">
				<div class="goo__warning-box">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<p>Disabling two-factor authentication will make your account less secure.</p>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); handleDisableMFA(); }}>
					<div class="goo__form-group">
						<label for="verification-code">
							Enter your current MFA code to confirm:
						</label>
						<input
							type="text"
							id="verification-code"
							bind:value={verificationCode}
							placeholder="000000"
							pattern="[0-9]{6}"
							maxlength="6"
							required
							disabled={isDisabling}
							autocomplete="off"
						/>
					</div>

					{#if error}
						<div class="goo__modal-error" role="alert">
							{error}
						</div>
					{/if}

					<div class="goo__modal-actions">
						<button
							type="button"
							onclick={closeDisableModal}
							class="goo__modal-button secondary"
							disabled={isDisabling}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="goo__modal-button danger"
							disabled={isDisabling || !verificationCode}
						>
							{isDisabling ? 'Disabling...' : 'Disable MFA'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Backup Codes Modal -->
{#if showBackupCodesModal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="goo__modal-overlay"
		role="button"
		tabindex="0"
		onclick={closeBackupCodesModal}
		onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && closeBackupCodesModal()}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="goo__modal large"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
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
		</div>
	</div>
{/if}

<!-- Enrollment Wizard Modal -->
{#if showEnrollmentWizard}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="goo__modal-overlay"
		role="button"
		tabindex="0"
		onclick={closeEnrollmentWizard}
		onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && closeEnrollmentWizard()}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="goo__modal large"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
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
						<button onclick={closeEnrollmentWizard} class="goo__modal-button secondary">
							Close
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../../../sveltekit/src/styles/variables.scss' as *;

	.goo__mfa-settings {
		width: 100%;
	}

	.goo__loading {
		text-align: center;
		padding: $spacing-large;
		color: var(--text-secondary);
	}

	.goo__error {
		background-color: var(--error-bg);
		color: var(--error-text);
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-medium;
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

	.goo__action-button {
		padding: $spacing-small $spacing-large;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;

		&.primary {
			background-color: var(--accent-primary);
			color: var(--color-text-on-primary);

			&:hover {
				background-color: var(--accent-light);
			}
		}

		&.secondary {
			background-color: var(--color-surface);
			color: var(--accent-primary);
			border: 1px solid var(--accent-primary);

			&:hover {
				background-color: var(--bg-secondary);
			}
		}

		&.danger {
			background-color: var(--color-surface);
			color: var(--error-text);
			border: 1px solid var(--error-text);

			&:hover {
				background-color: var(--error-bg);
			}
		}
	}

	/* Modal Styles */
	.goo__modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $spacing-large;
		z-index: 1000;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.goo__modal {
		background-color: var(--color-surface);
		border-radius: $border-radius-large;
		box-shadow: var(--shadow-2xl);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		animation: slideIn 0.3s ease;

		&.large {
			max-width: 700px;
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.goo__modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: $spacing-large;
		border-bottom: 1px solid var(--color-border);

		h3 {
			margin: 0;
			color: var(--text-primary);
			font-size: 1.25rem;
		}
	}

	.goo__modal-close {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		padding: $spacing-small;
		border-radius: $border-radius-medium;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover {
			background-color: var(--bg-secondary);
			color: var(--text-primary);
		}
	}

	.goo__modal-content {
		padding: $spacing-large;
		overflow-y: auto;
		max-height: calc(90vh - 100px);
	}

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

	.goo__modal-error {
		background-color: var(--error-bg);
		color: var(--error-text);
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-medium;
		text-align: center;
	}

	.goo__modal-actions {
		display: flex;
		gap: $spacing-medium;
		justify-content: flex-end;
		margin-top: $spacing-large;
	}

	.goo__modal-button {
		padding: $spacing-small $spacing-large;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;

		&.primary {
			background-color: var(--accent-primary);
			color: var(--color-text-on-primary);

			&:hover:not(:disabled) {
				background-color: var(--accent-light);
			}
		}

		&.secondary {
			background-color: var(--color-surface);
			color: var(--text-secondary);
			border: 1px solid var(--color-border);

			&:hover:not(:disabled) {
				background-color: var(--bg-secondary);
			}
		}

		&.danger {
			background-color: var(--error-text);
			color: white;

			&:hover:not(:disabled) {
				background-color: var(--error-hover);
			}
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
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

			.goo__action-button {
				width: 100%;
			}
		}
	}
</style>
