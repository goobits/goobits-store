<script lang="ts">
	import { onMount } from 'svelte'

	/**
	 * MFAVerificationInput - 6-digit TOTP code input component
	 */

	interface Props {
		onVerify: (code: string, rememberDevice: boolean) => void | Promise<void>
		onUseBackupCode?: (() => void) | null
		showRememberDevice?: boolean
		autoSubmit?: boolean
		error?: string
		loading?: boolean
		timerSeconds?: number
	}

	const {
		onVerify,
		onUseBackupCode = null,
		showRememberDevice = true,
		autoSubmit = true,
		error = '',
		loading = false,
		timerSeconds = 30
	}: Props = $props()

	// State
	let digits: string[] = $state(['', '', '', '', '', ''])
	let rememberDevice: boolean = $state(false)
	const inputRefs: (HTMLInputElement | null)[] = $state([])
	let attempts: number = $state(0)
	let isLocked: boolean = $state(false)
	// eslint-disable-next-line svelte/valid-compile -- intentionally capturing initial value for countdown timer
	let timeRemaining: number = $state(timerSeconds)
	let timerInterval: ReturnType<typeof setInterval> | null = $state(null)

	// Derived
	const code: string = $derived(digits.join(''))
	const isComplete: boolean = $derived(code.length === 6)
	const canSubmit: boolean = $derived(isComplete && !loading && !isLocked)

	// Start countdown timer
	onMount(() => {
		startTimer()
		// Focus first input
		if (inputRefs[0]) {
			inputRefs[0].focus()
		}

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval)
			}
		}
	})

	function startTimer(): void {
		if (timerInterval) {
			clearInterval(timerInterval)
		}

		timeRemaining = timerSeconds
		timerInterval = setInterval(() => {
			timeRemaining--
			if (timeRemaining <= 0) {
				clearInterval(timerInterval!)
				timerInterval = null
			}
		}, 1000)
	}

	function handleInput(index: number, event: Event): void {
		const target = event.target as HTMLInputElement
		const value = target.value

		// Only allow digits
		if (!/^\d*$/.test(value)) {
			target.value = digits[index] ?? ''
			return
		}

		// Handle paste
		if (value.length > 1) {
			handlePaste(value, index)
			return
		}

		// Update digit
		digits[index] = value

		// Auto-advance to next input
		if (value && index < 5) {
			inputRefs[index + 1]?.focus()
		}

		// Auto-submit if complete
		if (autoSubmit && digits.join('').length === 6) {
			handleSubmit()
		}
	}

	function handleKeyDown(index: number, event: KeyboardEvent): void {
		// Backspace: clear current or move to previous
		if (event.key === 'Backspace') {
			if (!digits[index] && index > 0) {
				inputRefs[index - 1]?.focus()
			}
			digits[index] = ''
		}
		// Arrow keys
		else if (event.key === 'ArrowLeft' && index > 0) {
			inputRefs[index - 1]?.focus()
		}
		else if (event.key === 'ArrowRight' && index < 5) {
			inputRefs[index + 1]?.focus()
		}
		// Enter: submit if complete
		else if (event.key === 'Enter' && isComplete) {
			handleSubmit()
		}
	}

	function handlePaste(pastedText: string, startIndex: number): void {
		// Extract digits from pasted text
		const pastedDigits = pastedText.replace(/\D/g, '').slice(0, 6)

		// Fill inputs with pasted digits
		for (let i = 0; i < pastedDigits.length && (startIndex + i) < 6; i++) {
			digits[startIndex + i] = pastedDigits[i] ?? ''
		}

		// Focus last filled input or submit if complete
		const lastIndex = Math.min(startIndex + pastedDigits.length - 1, 5)
		inputRefs[lastIndex]?.focus()

		// Auto-submit if we got 6 digits
		if (autoSubmit && pastedDigits.length === 6) {
			handleSubmit()
		}
	}

	async function handleSubmit(): Promise<void> {
		if (!canSubmit) return

		attempts++

		// Lock after 3 failed attempts
		if (attempts >= 3) {
			isLocked = true
		}

		await onVerify(code, rememberDevice)
	}

	function handleBackupCode(): void {
		if (onUseBackupCode) {
			onUseBackupCode()
		}
	}

	/** Clear code and focus first input (exposed for external use) */
	export function clearCode(): void {
		digits = ['', '', '', '', '', '']
		if (inputRefs[0]) {
			inputRefs[0].focus()
		}
	}

	// Format timer display (MM:SS)
	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${ mins }:${ secs.toString().padStart(2, '0') }`
	}
</script>

<div class="goo__mfa-verification">
	<div class="goo__mfa-header">
		<h2>Verify Your Identity</h2>
		<p>Enter the 6-digit code from your authenticator app</p>
	</div>

	{#if error}
		<div class="goo__mfa-error" role="alert">
			{error}
		</div>
	{/if}

	{#if isLocked}
		<div class="goo__mfa-locked" role="alert">
			Too many failed attempts. Please try again later or use a backup code.
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="goo__mfa-form">
		<div class="goo__mfa-inputs">
			{#each digits as digit, i}
				<input
					type="text"
					inputmode="numeric"
					maxlength="1"
					value={digit}
					bind:this={inputRefs[i]}
					oninput={(e) => handleInput(i, e)}
					onkeydown={(e) => handleKeyDown(i, e)}
					onpaste={(e) => {
						e.preventDefault()
						handlePaste(e.clipboardData?.getData('text') || '', i)
					}}
					disabled={loading || isLocked}
					class="goo__mfa-digit-input"
					aria-label={`Digit ${ i + 1 }`}
					autocomplete="off"
				/>
			{/each}
		</div>

		<div class="goo__mfa-timer">
			<svg class="goo__mfa-timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10" />
				<path d="M12 6v6l4 2" />
			</svg>
			<span class:goo__mfa-timer--warning={timeRemaining <= 10}>
				{formatTime(timeRemaining)}
			</span>
		</div>

		{#if showRememberDevice}
			<div class="goo__mfa-remember">
				<label>
					<input
						type="checkbox"
						bind:checked={rememberDevice}
						disabled={loading || isLocked}
					/>
					<span>Remember this device for 30 days</span>
				</label>
			</div>
		{/if}

		<div class="goo__mfa-actions">
			<button
				type="submit"
				class="goo__mfa-submit"
				disabled={!canSubmit}
			>
				{loading ? 'Verifying...' : 'Verify'}
			</button>

			{#if onUseBackupCode}
				<button
					type="button"
					class="goo__mfa-backup-link"
					onclick={handleBackupCode}
					disabled={loading}
				>
					Use backup code instead
				</button>
			{/if}
		</div>
	</form>
</div>

<style lang="scss">
	@use './variables.scss' as *;

	.goo__mfa-verification {
		width: 100%;
		max-width: 480px;
	}

	.goo__mfa-header {
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

	.goo__mfa-error,
	.goo__mfa-locked {
		background-color: var(--error-bg);
		color: var(--error-text);
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-medium;
		text-align: center;
	}

	.goo__mfa-form {
		display: flex;
		flex-direction: column;
		gap: $spacing-large;
	}

	.goo__mfa-inputs {
		display: flex;
		justify-content: center;
		gap: $spacing-small;
		margin-bottom: $spacing-small;
	}

	.goo__mfa-digit-input {
		width: 3rem;
		height: 3.5rem;
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		text-align: center;
		border: 2px solid var(--color-border);
		border-radius: $border-radius-medium;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		transition: all $transition-base;

		// Mobile-friendly larger touch targets
		@media (max-width: $breakpoint-sm) {
			width: 2.5rem;
			height: 3rem;
			font-size: $font-size-xl;
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

	.goo__mfa-timer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-small;
		color: var(--text-secondary);
		font-size: $font-size-base;
		padding: $spacing-small;

		.goo__mfa-timer-icon {
			width: 1.25rem;
			height: 1.25rem;
		}

		.goo__mfa-timer--warning {
			color: var(--error);
			font-weight: $font-weight-semibold;
		}
	}

	.goo__mfa-remember {
		display: flex;
		justify-content: center;

		label {
			display: flex;
			align-items: center;
			gap: $spacing-small;
			cursor: pointer;
			color: var(--text-secondary);
			font-size: $font-size-base;

			input[type="checkbox"] {
				cursor: pointer;
				width: 1.125rem;
				height: 1.125rem;

				&:disabled {
					cursor: not-allowed;
				}
			}

			&:hover {
				color: var(--text-primary);
			}
		}
	}

	.goo__mfa-actions {
		display: flex;
		flex-direction: column;
		gap: $spacing-medium;
	}

	.goo__mfa-submit {
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
</style>
