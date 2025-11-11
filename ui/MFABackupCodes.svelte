<script>
	import { get } from 'svelte/store'
	import Modal from '@goobits/forms/ui/modals/Modal.svelte'
	import { getBackendUrl, getPublishableKey } from '@goobits/config/urls'
	import { createLogger } from '../utils/logger.js'

	const logger = createLogger('MFABackupCodes')

	/**
	 * MFABackupCodes - Display and manage MFA backup codes
	 *
	 * Shows backup codes in a grid, allows downloading, copying,
	 * and regenerating codes with proper warnings.
	 *
	 * @prop {Array<string>} [backupCodes] - Array of backup codes to display
	 * @prop {Object} auth - Auth store instance
	 * @prop {Function} onClose - Callback when modal should close
	 * @prop {Function} [onRegenerate] - Callback when codes are regenerated
	 * @prop {boolean} [isNewEnrollment] - True if showing codes from enrollment
	 */
	let {
		backupCodes = null,
		auth,
		onClose,
		onRegenerate = null,
		isNewEnrollment = false
	} = $props()

	// Component state
	let loading = $state(false)
	let error = $state(null)
	let password = $state('')
	let showRegenerateConfirm = $state(false)
	let isRegenerating = $state(false)
	let copiedIndex = $state(null)
	let copiedAll = $state(false)
	let confirmChecked = $state(false)

	const backendUrl = $derived(getBackendUrl())
	const publishableKey = $derived(getPublishableKey())

	// Codes state initialized from prop (no effect needed - ensures SSR consistency)
	// Uses $state because codes can be mutated when regenerated
	let codes = $state(backupCodes)

	// Note: Better Auth stores backup codes hashed for security,
	// so they can only be viewed once when first generated.
	// If codes aren't provided, user must regenerate new codes.

	// Copy individual code
	async function copyCode(code, index) {
		try {
			await navigator.clipboard.writeText(code)
			copiedIndex = index
			setTimeout(() => {
				copiedIndex = null
			}, 2000)
		} catch (err) {
			logger.error('Failed to copy code:', err)
		}
	}

	// Copy all codes
	async function copyAllCodes() {
		if (!codes || codes.length === 0) return

		try {
			const codesText = codes.map((code, i) => `${ i + 1 }. ${ code }`).join('\n')
			await navigator.clipboard.writeText(codesText)
			copiedAll = true
			setTimeout(() => {
				copiedAll = false
			}, 2000)
		} catch (err) {
			logger.error('Failed to copy codes:', err)
		}
	}

	// Download codes as text file
	function downloadCodes() {
		if (!codes || codes.length === 0) return

		const authState = auth ? get(auth) : null
		const currentUser = authState?.customer || authState?.user
		const email = currentUser?.email || 'user'
		const timestamp = new Date().toISOString().split('T')[0]

		const content = [
			'MFA Backup Codes',
			'=' .repeat(50),
			`Account: ${ email }`,
			`Generated: ${ new Date().toLocaleString() }`,
			'',
			'Store these codes in a safe place. Each code can only be used once.',
			'',
			...codes.map((code, i) => `${ String(i + 1).padStart(2, ' ') }. ${ code }`),
			'',
			'=' .repeat(50)
		].join('\n')

		const blob = new Blob([content], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `mfa-backup-codes-${ timestamp }.txt`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	// Regenerate backup codes
	async function handleRegenerate() {
		if (!password) {
			return
		}

		isRegenerating = true
		error = null

		try {
			const authState = auth ? get(auth) : null
			const customer = authState?.customer || authState?.user

			if (!customer) {
				throw new Error('Not authenticated')
			}

			const response = await fetch(`${ backendUrl }/store/auth/mfa/backup-codes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-publishable-api-key': publishableKey
				},
				credentials: 'include',
				body: JSON.stringify({
					password
				})
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to regenerate backup codes')
			}

			const data = await response.json()
			codes = data.backupCodes

			// Close regenerate confirm modal
			showRegenerateConfirm = false
			password = ''
			confirmChecked = false

			// Call callback
			if (onRegenerate) {
				onRegenerate(codes)
			}
		} catch (err) {
			error = err.message
		} finally {
			isRegenerating = false
		}
	}

	// Handle close with confirmation
	function handleClose() {
		if (isNewEnrollment && !confirmChecked) {
			return // Require confirmation for new enrollment
		}

		onClose()
	}

	// Format code for display (add hyphen in middle)
	function formatCode(code) {
		if (code.length === 8) {
			return `${ code.slice(0, 4) }-${ code.slice(4) }`
		}
		return code
	}
</script>

<div class="goo__backup-codes">
	<div class="goo__modal-header">
		<h3>Backup Codes</h3>
		{#if !isNewEnrollment}
			<button onclick={handleClose} class="goo__modal-close" aria-label="Close">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	<div class="goo__modal-content">
		{#if loading}
			<div class="goo__loading">
				<p>Loading backup codes...</p>
			</div>
		{:else if error}
			<div class="goo__error" role="alert">
				{error}
			</div>
		{/if}

		{#if isNewEnrollment}
			<div class="goo__info-box success">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<strong>MFA Enabled Successfully!</strong>
					<p>Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
				</div>
			</div>
		{:else if codes && codes.length > 0}
			<div class="goo__info-box">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<p>Each backup code can only be used once. Store them in a secure location.</p>
				</div>
			</div>
		{:else if !codes || codes.length === 0}
			<div class="goo__info-box warning">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div>
					<strong>Backup Codes Not Available</strong>
					<p>For security reasons, backup codes can only be viewed once when first generated. If you need new codes, you can regenerate them below.</p>
					<p><strong>Warning:</strong> Regenerating codes will invalidate any previously generated codes.</p>
				</div>
			</div>
		{/if}

		{#if codes && codes.length > 0}
			<div class="goo__codes-grid">
				{#each codes as code, index}
					<div class="goo__code-item">
						<span class="goo__code-number">{index + 1}.</span>
						<code class="goo__code-value">{formatCode(code)}</code>
						<button
							onclick={() => copyCode(code, index)}
							class="goo__code-copy"
							aria-label="Copy code"
							title="Copy code"
						>
							{#if copiedIndex === index}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{:else}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							{/if}
						</button>
					</div>
				{/each}
			</div>

			<div class="goo__code-actions">
				<button onclick={copyAllCodes} class="goo__action-button secondary">
					{#if copiedAll}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Copied All!
					{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
						Copy All
					{/if}
				</button>

				<button onclick={downloadCodes} class="goo__action-button secondary">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
					Download
				</button>

				{#if !isNewEnrollment}
					<button onclick={() => showRegenerateConfirm = true} class="goo__action-button warning">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						Regenerate
					</button>
				{/if}
			</div>
		{/if}

		{#if isNewEnrollment}
			<div class="goo__confirmation">
				<label class="goo__checkbox-label">
					<input
						type="checkbox"
						bind:checked={confirmChecked}
					/>
					<span>I have saved these backup codes in a secure location</span>
				</label>
			</div>
		{/if}

		<div class="goo__modal-footer">
			{#if !codes || codes.length === 0}
				<button
					onclick={() => showRegenerateConfirm = true}
					class="goo__modal-button primary"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Regenerate Backup Codes
				</button>
				<button
					onclick={handleClose}
					class="goo__modal-button secondary"
				>
					Close
				</button>
			{:else}
				<button
					onclick={handleClose}
					class="goo__modal-button primary"
					disabled={isNewEnrollment && !confirmChecked}
				>
					{isNewEnrollment ? 'Done' : 'Close'}
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Regenerate Confirmation Modal -->
<Modal
	isVisible={showRegenerateConfirm}
	onClose={() => showRegenerateConfirm = false}
	title="Regenerate Backup Codes"
	size="sm"
>
	<div class="goo__warning-box">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
		</svg>
		<div>
			<strong>Warning:</strong>
			<p>Regenerating backup codes will invalidate all existing codes. Make sure to save the new codes.</p>
		</div>
	</div>

	<form onsubmit={(e) => { e.preventDefault(); handleRegenerate(); }}>
		<div class="goo__form-group">
			<label for="regenerate-password">
				Enter your password to confirm:
			</label>
			<input
				type="password"
				id="regenerate-password"
				bind:value={password}
				placeholder="Enter your password"
				required
				disabled={isRegenerating}
				autocomplete="current-password"
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
				onclick={() => showRegenerateConfirm = false}
				class="goo__modal-button secondary"
				disabled={isRegenerating}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="goo__modal-button warning"
				disabled={isRegenerating || !password}
			>
				{isRegenerating ? 'Regenerating...' : 'Regenerate Codes'}
			</button>
		</div>
	</form>
</Modal>

<style lang="scss">
	@use '../../../sveltekit/src/styles/variables.scss' as *;

	.goo__backup-codes {
		width: 100%;
		background-color: var(--color-surface);
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

	.goo__info-box {
		display: flex;
		gap: $spacing-medium;
		padding: $spacing-medium;
		background-color: var(--bg-secondary);
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-large;
		border-left: 4px solid var(--accent-primary);

		&.success {
			background-color: var(--success-bg);
			border-left-color: var(--success-border);
			color: var(--success-text);
		}

		&.warning {
			background-color: var(--warning-bg);
			border-left-color: var(--warning-border);
			color: var(--warning-text);
		}

		svg {
			flex-shrink: 0;
		}

		strong {
			display: block;
			margin-bottom: $spacing-small;
		}

		p {
			margin: 0;
		}
	}

	.goo__codes-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: $spacing-small;
		margin-bottom: $spacing-large;
	}

	.goo__code-item {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		padding: $spacing-small;
		background-color: var(--bg-primary);
		border: 1px solid var(--color-border);
		border-radius: $border-radius-medium;
		transition: all 0.2s ease;

		&:hover {
			border-color: var(--accent-primary);
			background-color: var(--bg-secondary);
		}
	}

	.goo__code-number {
		color: var(--text-secondary);
		font-size: 0.875rem;
		min-width: 24px;
	}

	.goo__code-value {
		flex: 1;
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: 0.1em;
	}

	.goo__code-copy {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		padding: $spacing-small;
		border-radius: $border-radius-small;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover {
			background-color: var(--bg-secondary);
			color: var(--accent-primary);
		}
	}

	.goo__code-actions {
		display: flex;
		gap: $spacing-medium;
		flex-wrap: wrap;
		margin-bottom: $spacing-large;
	}

	.goo__action-button {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		padding: $spacing-small $spacing-medium;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;

		svg {
			flex-shrink: 0;
		}

		&.secondary {
			background-color: var(--color-surface);
			color: var(--accent-primary);
			border: 1px solid var(--accent-primary);

			&:hover {
				background-color: var(--bg-secondary);
			}
		}

		&.warning {
			background-color: var(--color-surface);
			color: var(--warning-text);
			border: 1px solid var(--warning-border);

			&:hover {
				background-color: var(--warning-bg);
			}
		}
	}

	.goo__confirmation {
		margin-bottom: $spacing-large;
		padding: $spacing-medium;
		background-color: var(--bg-secondary);
		border-radius: $border-radius-medium;
	}

	.goo__checkbox-label {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		cursor: pointer;
		user-select: none;

		input[type="checkbox"] {
			cursor: pointer;
			width: 18px;
			height: 18px;
		}

		span {
			color: var(--text-primary);
			font-weight: 500;
		}
	}

	.goo__modal-footer {
		display: flex;
		gap: $spacing-medium;
		justify-content: flex-end;
		padding-top: $spacing-medium;
		border-top: 1px solid var(--color-border);
	}

	.goo__modal-button {
		display: inline-flex;
		align-items: center;
		gap: $spacing-small;
		padding: $spacing-small $spacing-large;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;

		svg {
			flex-shrink: 0;
		}

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

		&.warning {
			background-color: var(--warning-text);
			color: white;

			&:hover:not(:disabled) {
				opacity: 0.9;
			}
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	/* Modal content styles (modal container handled by forms package) */

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

		strong {
			display: block;
			margin-bottom: $spacing-small;
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

	@media (max-width: 768px) {
		.goo__modal-content {
			padding: $spacing-medium;
		}

		.goo__code-actions {
			flex-direction: column;

			.goo__action-button {
				width: 100%;
				justify-content: center;
			}
		}

		.goo__codes-grid {
			gap: $spacing-small;
		}

		.goo__code-item {
			padding: $spacing-small;
		}

		.goo__code-value {
			font-size: 0.875rem;
		}
	}

	@media (max-width: 480px) {
		.goo__modal-overlay {
			padding: $spacing-small;
		}

		.goo__modal-header {
			padding: $spacing-medium;

			h3 {
				font-size: 1.125rem;
			}
		}
	}
</style>
