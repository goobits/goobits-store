<script>
	import { onMount } from 'svelte'

	/**
	 * MFABackupCodeInput - Backup code entry component
	 *
	 * @prop {Function} onVerify - Callback when code is submitted (code)
	 * @prop {Function} [onBackToTOTP] - Callback to switch back to TOTP
	 * @prop {string} [error] - Error message to display
	 * @prop {boolean} [loading=false] - Loading state
	 */
	let {
		onVerify,
		onBackToTOTP = null,
		error = '',
		loading = false
	} = $props()

	// State
	let code = $state('')
	let inputRef = $state(null)

	// Derived
	let cleanCode = $derived(code.replace(/[-\s]/g, ''))
	let isValid = $derived(cleanCode.length === 8)
	let canSubmit = $derived(isValid && !loading)

	onMount(() => {
		// Focus input on mount
		if (inputRef) {
			inputRef.focus()
		}
	})

	function handleInput(event) {
		let value = event.target.value.toUpperCase()

		// Remove any characters that aren't alphanumeric
		value = value.replace(/[^A-Z0-9]/g, '')

		// Limit to 8 characters
		if (value.length > 8) {
			value = value.slice(0, 8)
		}

		// Format with hyphen after 4 characters
		if (value.length > 4) {
			value = `${ value.slice(0, 4) }-${ value.slice(4) }`
		}

		code = value
	}

	function handlePaste(event) {
		event.preventDefault()
		const pastedText = event.clipboardData.getData('text')

		// Extract alphanumeric characters
		let cleaned = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)

		// Format with hyphen
		if (cleaned.length > 4) {
			cleaned = `${ cleaned.slice(0, 4) }-${ cleaned.slice(4) }`
		}

		code = cleaned

		// Auto-submit if we got a full code
		if (cleaned.replace(/[-\s]/g, '').length === 8) {
			handleSubmit()
		}
	}

	function handleSubmit() {
		if (!canSubmit) return
		onVerify(cleanCode)
	}

	function handleBackToTOTP() {
		if (onBackToTOTP) {
			onBackToTOTP()
		}
	}
</script>

<div class="goo__mfa-backup">
	<div class="goo__mfa-backup-header">
		<h2>Enter Backup Code</h2>
		<p>Use one of your 8-character backup codes</p>
	</div>

	{#if error}
		<div class="goo__mfa-backup-error" role="alert">
			{error}
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="goo__mfa-backup-form">
		<div class="goo__mfa-backup-input-wrapper">
			<input
				type="text"
				bind:this={inputRef}
				value={code}
				oninput={handleInput}
				onpaste={handlePaste}
				disabled={loading}
				placeholder="XXXX-XXXX"
				class="goo__mfa-backup-input"
				aria-label="Backup code"
				autocomplete="off"
				maxlength="9"
			/>
		</div>

		<div class="goo__mfa-backup-hint">
			Format: XXXX-XXXX (8 characters)
		</div>

		<div class="goo__mfa-backup-actions">
			<button
				type="submit"
				class="goo__mfa-backup-submit"
				disabled={!canSubmit}
			>
				{loading ? 'Verifying...' : 'Verify Backup Code'}
			</button>

			{#if onBackToTOTP}
				<button
					type="button"
					class="goo__mfa-backup-link"
					onclick={handleBackToTOTP}
					disabled={loading}
				>
					Back to authenticator code
				</button>
			{/if}
		</div>
	</form>

	<div class="goo__mfa-backup-info">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4M12 8h.01" />
		</svg>
		<span>Each backup code can only be used once. Generate new codes after using one.</span>
	</div>
</div>

<style lang="scss">
	@use '../../../sveltekit/src/styles/variables.scss' as *;

	.goo__mfa-backup {
		width: 100%;
		max-width: 480px;
	}

	.goo__mfa-backup-header {
		text-align: center;
		margin-bottom: $spacing-large;

		h2 {
			color: var(--text-primary);
			margin-bottom: $spacing-small;
			font-size: $font-size-xl;
		}

		p {
			color: var(--text-secondary);
			font-size: $font-size-base;
		}
	}

	.goo__mfa-backup-error {
		background-color: var(--error-bg);
		color: var(--error-text);
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-medium;
		text-align: center;
	}

	.goo__mfa-backup-form {
		display: flex;
		flex-direction: column;
		gap: $spacing-medium;
	}

	.goo__mfa-backup-input-wrapper {
		display: flex;
		justify-content: center;
	}

	.goo__mfa-backup-input {
		width: 100%;
		max-width: 300px;
		padding: $spacing-medium;
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		text-align: center;
		letter-spacing: 0.2em;
		border: 2px solid var(--color-border);
		border-radius: $border-radius-medium;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		font-family: monospace;
		transition: all $transition-base;

		&::placeholder {
			letter-spacing: 0.1em;
			opacity: 0.5;
		}

		&:focus {
			outline: none;
			border-color: var(--accent-primary);
			box-shadow: 0 0 0 3px var(--accent-shadow);
		}

		&:disabled {
			background-color: var(--bg-secondary);
			cursor: not-allowed;
			opacity: 0.6;
		}

		&:not(:disabled):hover {
			border-color: var(--accent-light);
		}
	}

	.goo__mfa-backup-hint {
		text-align: center;
		color: var(--text-secondary);
		font-size: $font-size-small;
	}

	.goo__mfa-backup-actions {
		display: flex;
		flex-direction: column;
		gap: $spacing-medium;
		margin-top: $spacing-small;
	}

	.goo__mfa-backup-submit {
		width: 100%;
		padding: $spacing-medium;
		background-color: var(--accent-primary);
		color: var(--color-text-on-primary);
		border: none;
		border-radius: $border-radius-medium;
		font-size: $font-size-medium;
		font-weight: $font-weight-semibold;
		cursor: pointer;
		transition: all $transition-base;

		&:hover:not(:disabled) {
			background-color: var(--accent-light);
			transform: translateY(-1px);
			box-shadow: var(--shadow-md);
		}

		&:disabled {
			background-color: var(--bg-tertiary);
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	.goo__mfa-backup-link {
		background: none;
		border: none;
		color: var(--accent-primary);
		font-size: $font-size-base;
		font-weight: $font-weight-medium;
		cursor: pointer;
		text-decoration: underline;
		padding: $spacing-small;

		&:hover:not(:disabled) {
			color: var(--accent-light);
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	.goo__mfa-backup-info {
		display: flex;
		align-items: flex-start;
		gap: $spacing-small;
		margin-top: $spacing-large;
		padding: $spacing-medium;
		background-color: var(--bg-secondary);
		border-radius: $border-radius-medium;
		color: var(--text-secondary);
		font-size: $font-size-small;

		svg {
			flex-shrink: 0;
			width: 1.25rem;
			height: 1.25rem;
			margin-top: 0.125rem;
		}
	}
</style>
