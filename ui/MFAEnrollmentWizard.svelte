<script>
	import { Check, ChevronLeft, Download, Copy, CheckCircle2, Smartphone, QrCode, Shield } from '@lucide/svelte'
	import { browser } from '$app/environment'
	import QRCodeLib from 'qrcode'

	/**
	 * MFAEnrollmentWizard - Multi-step wizard for MFA enrollment
	 *
	 * @prop {string} userId - User ID for enrollment
	 * @prop {Function} onComplete - Callback when enrollment is complete
	 * @prop {Function} onCancel - Callback when user cancels
	 * @prop {boolean} allowSkip - Whether user can skip enrollment
	 * @prop {string} backendUrl - Backend API URL
	 */
	let {
		userId,
		onComplete,
		onCancel,
		allowSkip = true,
		backendUrl = 'http://localhost:3282'
	} = $props()

	// State management
	let currentStep = $state(1)
	let loading = $state(false)
	let error = $state(null)

	// Enrollment data
	let qrCodeUrl = $state('')
	let secretKey = $state('')
	let totpUri = $state('')
	let verificationCode = $state('')
	let backupCodes = $state([])
	let backupCodesSaved = $state(false)

	// Manual code entry
	let showManualEntry = $state(false)

	// Recommended authenticator apps
	const authenticatorApps = [
		{ name: 'Google Authenticator', icon: 'smartphone' },
		{ name: 'Authy', icon: 'smartphone' },
		{ name: '1Password', icon: 'shield' },
		{ name: 'Microsoft Authenticator', icon: 'smartphone' }
	]

	// Initialize MFA enrollment
	async function initializeEnrollment() {
		if (currentStep !== 2) return

		loading = true
		error = null

		try {
			const response = await fetch(`${ backendUrl }/auth/customer/mfa/enroll/initialize`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || 'Failed to initialize MFA enrollment')
			}

			// Store enrollment data
			secretKey = data.mfa.secret
			totpUri = data.mfa.uri

			// Generate QR code
			if (browser) {
				qrCodeUrl = await QRCodeLib.toDataURL(totpUri, {
					width: 300,
					margin: 2,
					color: {
						dark: '#000000',
						light: '#ffffff'
					}
				})
			}
		} catch (err) {
			error = err.message
		} finally {
			loading = false
		}
	}

	// Complete enrollment with verification code
	async function completeEnrollment() {
		if (!verificationCode || verificationCode.length !== 6) {
			error = 'Please enter a valid 6-digit code'
			return
		}

		loading = true
		error = null

		try {
			const response = await fetch(`${ backendUrl }/auth/customer/mfa/enroll/complete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ code: verificationCode })
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || 'Invalid verification code')
			}

			// Store backup codes
			backupCodes = data.backupCodes || []

			// Move to final step
			currentStep = 4
		} catch (err) {
			error = err.message
			verificationCode = ''
		} finally {
			loading = false
		}
	}

	// Download backup codes
	function downloadBackupCodes() {
		const content = backupCodes.map((code, i) => `${ i + 1 }. ${ code }`).join('\n')
		const header = '=== MFA Backup Codes ===\n'
		const footer = '\n\nKeep these codes safe! Each can only be used once.\n'
		const fullContent = header + content + footer

		const blob = new Blob([ fullContent ], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `mfa-backup-codes-${ new Date().toISOString().split('T')[ 0 ] }.txt`
		a.click()
		URL.revokeObjectURL(url)
	}

	// Copy backup codes to clipboard
	async function copyBackupCodes() {
		const content = backupCodes.join('\n')
		try {
			await navigator.clipboard.writeText(content)
			// Show success feedback (could add a toast here)
		} catch (err) {
			console.error('Failed to copy codes:', err)
		}
	}

	// Copy secret key to clipboard
	async function copySecretKey() {
		try {
			await navigator.clipboard.writeText(secretKey)
		} catch (err) {
			console.error('Failed to copy secret key:', err)
		}
	}

	// Navigate steps
	function nextStep() {
		if (currentStep === 1) {
			currentStep = 2
			// Initialize enrollment when moving to QR code step
			initializeEnrollment()
		} else if (currentStep === 2) {
			currentStep = 3
		} else if (currentStep === 3) {
			completeEnrollment()
		} else if (currentStep === 4 && backupCodesSaved) {
			onComplete?.()
		}
	}

	function previousStep() {
		if (currentStep > 1) {
			currentStep--
			error = null
		}
	}

	function handleCancel() {
		onCancel?.()
	}

	// Auto-submit when 6 digits entered
	$effect(() => {
		if (verificationCode.length === 6 && currentStep === 3) {
			// Small delay for better UX
			setTimeout(() => {
				if (verificationCode.length === 6) {
					completeEnrollment()
				}
			}, 300)
		}
	})
</script>

<div class="goo__mfa-wizard">
	<div class="goo__mfa-wizard-container">
		<!-- Progress Indicator -->
		<div class="goo__mfa-progress">
			<div class="goo__mfa-progress-step" class:active={currentStep >= 1} class:completed={currentStep > 1}>
				<div class="goo__mfa-progress-dot">
					{#if currentStep > 1}
						<Check size={16} />
					{:else}
						1
					{/if}
				</div>
				<span class="goo__mfa-progress-label">Choose App</span>
			</div>
			<div class="goo__mfa-progress-line" class:completed={currentStep > 1}></div>
			<div class="goo__mfa-progress-step" class:active={currentStep >= 2} class:completed={currentStep > 2}>
				<div class="goo__mfa-progress-dot">
					{#if currentStep > 2}
						<Check size={16} />
					{:else}
						2
					{/if}
				</div>
				<span class="goo__mfa-progress-label">Scan QR</span>
			</div>
			<div class="goo__mfa-progress-line" class:completed={currentStep > 2}></div>
			<div class="goo__mfa-progress-step" class:active={currentStep >= 3} class:completed={currentStep > 3}>
				<div class="goo__mfa-progress-dot">
					{#if currentStep > 3}
						<Check size={16} />
					{:else}
						3
					{/if}
				</div>
				<span class="goo__mfa-progress-label">Verify</span>
			</div>
			<div class="goo__mfa-progress-line" class:completed={currentStep > 3}></div>
			<div class="goo__mfa-progress-step" class:active={currentStep >= 4}>
				<div class="goo__mfa-progress-dot">
					{#if currentStep > 4}
						<Check size={16} />
					{:else}
						4
					{/if}
				</div>
				<span class="goo__mfa-progress-label">Backup Codes</span>
			</div>
		</div>

		<!-- Step Content -->
		<div class="goo__mfa-content">
			{#if error}
				<div class="goo__mfa-error" role="alert">
					{error}
				</div>
			{/if}

			<!-- Step 1: Choose Authenticator App -->
			{#if currentStep === 1}
				<div class="goo__mfa-step">
					<div class="goo__mfa-step-icon">
						<Smartphone size={48} />
					</div>
					<h2>Choose Your Authenticator App</h2>
					<p class="goo__mfa-subtitle">
						You'll need an authenticator app to generate security codes.
					</p>

					<div class="goo__mfa-apps">
						{#each authenticatorApps as app}
							<div class="goo__mfa-app-card">
								{#if app.icon === 'smartphone'}
									<Smartphone size={32} />
								{:else}
									<Shield size={32} />
								{/if}
								<span>{app.name}</span>
							</div>
						{/each}
					</div>

					<div class="goo__mfa-help">
						<p>Don't have an authenticator app?</p>
						<p class="goo__mfa-help-text">
							Download one from your app store. We recommend Google Authenticator or Authy.
						</p>
					</div>
				</div>
			{/if}

			<!-- Step 2: Scan QR Code -->
			{#if currentStep === 2}
				<div class="goo__mfa-step">
					<div class="goo__mfa-step-icon">
						<QrCode size={48} />
					</div>
					<h2>Scan This QR Code</h2>
					<p class="goo__mfa-subtitle">
						Open your authenticator app and scan this code
					</p>

					{#if loading}
						<div class="goo__mfa-loading">
							<div class="goo__mfa-spinner"></div>
							<p>Generating QR code...</p>
						</div>
					{:else if qrCodeUrl}
						<div class="goo__mfa-qr-container">
							<img src={qrCodeUrl} alt="MFA QR Code" class="goo__mfa-qr-code" />
						</div>

						<!-- Manual Entry Option -->
						<div class="goo__mfa-manual">
							<button
								type="button"
								class="goo__mfa-manual-toggle"
								onclick={() => showManualEntry = !showManualEntry}
							>
								{showManualEntry ? 'Hide' : 'Can\'t scan? Enter manually'}
							</button>

							{#if showManualEntry}
								<div class="goo__mfa-manual-content">
									<p>Enter this code in your authenticator app:</p>
									<div class="goo__mfa-secret">
										<code>{secretKey}</code>
										<button
											type="button"
											class="goo__mfa-copy-btn"
											onclick={copySecretKey}
											title="Copy secret key"
										>
											<Copy size={16} />
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Step 3: Verify Code -->
			{#if currentStep === 3}
				<div class="goo__mfa-step">
					<div class="goo__mfa-step-icon">
						<Shield size={48} />
					</div>
					<h2>Verify It Works</h2>
					<p class="goo__mfa-subtitle">
						Enter the 6-digit code from your authenticator app
					</p>

					<form onsubmit={(e) => { e.preventDefault(); completeEnrollment(); }} class="goo__mfa-verify-form">
						<div class="goo__mfa-code-input-wrapper">
							<input
								type="text"
								class="goo__mfa-code-input"
								bind:value={verificationCode}
								placeholder="000000"
								maxlength="6"
								pattern="[0-9]{6}"
								inputmode="numeric"
								autocomplete="off"
								disabled={loading}
							/>
						</div>
					</form>
				</div>
			{/if}

			<!-- Step 4: Backup Codes -->
			{#if currentStep === 4}
				<div class="goo__mfa-step">
					<div class="goo__mfa-step-icon goo__mfa-step-icon--success">
						<CheckCircle2 size={48} />
					</div>
					<h2>Save Your Backup Codes</h2>
					<p class="goo__mfa-subtitle">
						Keep these safe! Use them if you lose access to your authenticator app.
					</p>

					<div class="goo__mfa-warning">
						<Shield size={20} />
						<span>Each code can only be used once. Store them securely.</span>
					</div>

					<div class="goo__mfa-backup-codes">
						{#each backupCodes as code, i}
							<div class="goo__mfa-backup-code">
								<span class="goo__mfa-backup-code-number">{i + 1}.</span>
								<code>{code}</code>
							</div>
						{/each}
					</div>

					<div class="goo__mfa-backup-actions">
						<button type="button" class="goo__mfa-action-btn" onclick={downloadBackupCodes}>
							<Download size={18} />
							Download
						</button>
						<button type="button" class="goo__mfa-action-btn" onclick={copyBackupCodes}>
							<Copy size={18} />
							Copy All
						</button>
					</div>

					<div class="goo__mfa-confirmation">
						<label class="goo__mfa-checkbox">
							<input type="checkbox" bind:checked={backupCodesSaved} />
							<span>I've saved my backup codes securely</span>
						</label>
					</div>
				</div>
			{/if}
		</div>

		<!-- Navigation -->
		<div class="goo__mfa-navigation">
			{#if currentStep > 1 && currentStep < 4}
				<button type="button" class="goo__mfa-nav-btn goo__mfa-nav-btn--secondary" onclick={previousStep}>
					<ChevronLeft size={20} />
					Back
				</button>
			{/if}

			<div class="goo__mfa-nav-spacer"></div>

			{#if allowSkip && currentStep < 4}
				<button type="button" class="goo__mfa-nav-btn goo__mfa-nav-btn--text" onclick={handleCancel}>
					Skip for now
				</button>
			{/if}

			{#if currentStep < 3}
				<button
					type="button"
					class="goo__mfa-nav-btn goo__mfa-nav-btn--primary"
					onclick={nextStep}
					disabled={loading || (currentStep === 2 && !qrCodeUrl)}
				>
					{currentStep === 1 ? 'Continue' : 'I\'ve Scanned It'}
				</button>
			{:else if currentStep === 4}
				<button
					type="button"
					class="goo__mfa-nav-btn goo__mfa-nav-btn--primary"
					onclick={nextStep}
					disabled={!backupCodesSaved}
				>
					Finish Setup
				</button>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	@use '../../../sveltekit/src/styles/variables.scss' as *;

	.goo__mfa-wizard {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $spacing-large;
		min-height: 600px;
	}

	.goo__mfa-wizard-container {
		background: var(--color-surface);
		border-radius: $border-radius-large;
		box-shadow: var(--shadow-lg);
		padding: $spacing-xlarge;
		width: 100%;
		max-width: 600px;
	}

	// Progress Indicator
	.goo__mfa-progress {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-xlarge;
		padding-bottom: $spacing-large;
		border-bottom: 1px solid var(--color-border);
	}

	.goo__mfa-progress-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-small;
		flex: 0 0 auto;
	}

	.goo__mfa-progress-dot {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		transition: all $transition-base;

		.active & {
			background: var(--accent-primary);
			color: var(--color-text-on-primary);
		}

		.completed & {
			background: $green-600;
			color: white;
		}
	}

	.goo__mfa-progress-label {
		font-size: $font-size-small;
		color: var(--text-secondary);
		white-space: nowrap;

		.active & {
			color: var(--text-primary);
			font-weight: 500;
		}
	}

	.goo__mfa-progress-line {
		height: 2px;
		background: var(--color-border);
		flex: 1;
		margin: 0 $spacing-small;
		transition: background $transition-base;

		&.completed {
			background: $green-600;
		}
	}

	// Content
	.goo__mfa-content {
		min-height: 400px;
		display: flex;
		flex-direction: column;
	}

	.goo__mfa-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;

		h2 {
			color: var(--text-primary);
			margin-bottom: $spacing-small;
		}
	}

	.goo__mfa-subtitle {
		color: var(--text-secondary);
		margin-bottom: $spacing-large;
		max-width: 400px;
	}

	.goo__mfa-step-icon {
		color: var(--accent-primary);
		margin-bottom: $spacing-medium;

		&--success {
			color: $green-600;
		}
	}

	// Error
	.goo__mfa-error {
		background: var(--error-bg);
		color: var(--error-text);
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-medium;
		text-align: center;
	}

	// Loading
	.goo__mfa-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-medium;
		padding: $spacing-xlarge;
	}

	.goo__mfa-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--bg-secondary);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	// Step 1: Apps
	.goo__mfa-apps {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: $spacing-medium;
		margin-bottom: $spacing-large;
		width: 100%;
		max-width: 400px;
	}

	.goo__mfa-app-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-small;
		padding: $spacing-large;
		border: 2px solid var(--color-border);
		border-radius: $border-radius-medium;
		background: var(--bg-primary);
		transition: all $transition-base;
		color: var(--text-primary);

		&:hover {
			border-color: var(--accent-primary);
			transform: translateY(-2px);
			box-shadow: var(--shadow-md);
		}

		span {
			font-size: $font-size-small;
			font-weight: 500;
		}
	}

	.goo__mfa-help {
		background: $blue-50;
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		max-width: 400px;

		p {
			margin: 0;
			color: $blue-900;
			font-weight: 500;

			&:first-child {
				margin-bottom: $spacing-small;
			}
		}

		.goo__mfa-help-text {
			font-weight: 400;
			font-size: $font-size-small;
		}
	}

	// Step 2: QR Code
	.goo__mfa-qr-container {
		background: white;
		padding: $spacing-large;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-medium;
		box-shadow: var(--shadow-md);
	}

	.goo__mfa-qr-code {
		width: 100%;
		max-width: 300px;
		height: auto;
		display: block;
	}

	.goo__mfa-manual {
		width: 100%;
		max-width: 400px;
	}

	.goo__mfa-manual-toggle {
		background: none;
		border: none;
		color: var(--accent-primary);
		font-size: $font-size-small;
		cursor: pointer;
		text-decoration: underline;
		padding: $spacing-small;

		&:hover {
			color: var(--accent-light);
		}
	}

	.goo__mfa-manual-content {
		margin-top: $spacing-medium;
		padding: $spacing-medium;
		background: var(--bg-secondary);
		border-radius: $border-radius-medium;
		text-align: left;

		p {
			margin: 0 0 $spacing-small 0;
			font-size: $font-size-small;
			color: var(--text-secondary);
		}
	}

	.goo__mfa-secret {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		background: white;
		padding: $spacing-small $spacing-medium;
		border-radius: $border-radius-small;
		border: 1px solid var(--color-border);

		code {
			flex: 1;
			font-family: 'Courier New', monospace;
			font-size: $font-size-medium;
			color: var(--text-primary);
			letter-spacing: 0.1em;
		}
	}

	.goo__mfa-copy-btn {
		background: none;
		border: none;
		color: var(--accent-primary);
		cursor: pointer;
		padding: $spacing-small;
		display: flex;
		align-items: center;
		border-radius: $border-radius-small;

		&:hover {
			background: var(--bg-secondary);
		}
	}

	// Step 3: Verification
	.goo__mfa-verify-form {
		width: 100%;
		max-width: 300px;
	}

	.goo__mfa-code-input-wrapper {
		margin-bottom: $spacing-medium;
	}

	.goo__mfa-code-input {
		width: 100%;
		padding: $spacing-large;
		font-size: 2rem;
		font-family: 'Courier New', monospace;
		text-align: center;
		letter-spacing: 0.5em;
		border: 2px solid var(--color-border);
		border-radius: $border-radius-medium;
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: all $transition-base;

		&:focus {
			outline: none;
			border-color: var(--accent-primary);
			box-shadow: 0 0 0 3px var(--accent-shadow);
		}

		&:disabled {
			background: var(--bg-secondary);
			cursor: not-allowed;
		}

		&::placeholder {
			color: var(--text-tertiary);
			letter-spacing: 0.5em;
		}
	}

	// Step 4: Backup Codes
	.goo__mfa-warning {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		background: $amber-50;
		color: $amber-900;
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-large;
		font-size: $font-size-small;
		font-weight: 500;
	}

	.goo__mfa-backup-codes {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: $spacing-small;
		width: 100%;
		max-width: 500px;
		margin-bottom: $spacing-large;
	}

	.goo__mfa-backup-code {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		background: var(--bg-secondary);
		padding: $spacing-small $spacing-medium;
		border-radius: $border-radius-small;

		code {
			font-family: 'Courier New', monospace;
			font-size: $font-size-small;
			color: var(--text-primary);
			letter-spacing: 0.05em;
		}
	}

	.goo__mfa-backup-code-number {
		font-size: $font-size-small;
		color: var(--text-secondary);
		font-weight: 500;
		min-width: 20px;
	}

	.goo__mfa-backup-actions {
		display: flex;
		gap: $spacing-medium;
		margin-bottom: $spacing-large;
	}

	.goo__mfa-action-btn {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		padding: $spacing-small $spacing-large;
		background: var(--bg-primary);
		border: 1px solid var(--color-border);
		border-radius: $border-radius-medium;
		color: var(--text-primary);
		font-weight: 500;
		cursor: pointer;
		transition: all $transition-base;

		&:hover {
			background: var(--bg-secondary);
			border-color: var(--accent-primary);
		}
	}

	.goo__mfa-confirmation {
		margin-top: $spacing-medium;
	}

	.goo__mfa-checkbox {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		cursor: pointer;
		user-select: none;

		input[type="checkbox"] {
			width: 20px;
			height: 20px;
			cursor: pointer;
		}

		span {
			color: var(--text-primary);
			font-weight: 500;
		}
	}

	// Navigation
	.goo__mfa-navigation {
		display: flex;
		gap: $spacing-medium;
		padding-top: $spacing-large;
		border-top: 1px solid var(--color-border);
		margin-top: $spacing-large;
	}

	.goo__mfa-nav-spacer {
		flex: 1;
	}

	.goo__mfa-nav-btn {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		padding: $spacing-medium $spacing-large;
		border: none;
		border-radius: $border-radius-medium;
		font-size: $font-size-base;
		font-weight: 600;
		cursor: pointer;
		transition: all $transition-base;

		&--primary {
			background: var(--accent-primary);
			color: var(--color-text-on-primary);

			&:hover:not(:disabled) {
				background: var(--accent-light);
				transform: translateY(-1px);
				box-shadow: var(--shadow-md);
			}

			&:disabled {
				background: var(--bg-tertiary);
				cursor: not-allowed;
				opacity: 0.6;
			}
		}

		&--secondary {
			background: var(--bg-primary);
			color: var(--text-primary);
			border: 1px solid var(--color-border);

			&:hover {
				background: var(--bg-secondary);
				border-color: var(--accent-primary);
			}
		}

		&--text {
			background: none;
			color: var(--text-secondary);
			text-decoration: underline;

			&:hover {
				color: var(--accent-primary);
			}
		}
	}

	// Mobile responsive
	@media (max-width: $breakpoint-md) {
		.goo__mfa-wizard {
			padding: $spacing-medium;
		}

		.goo__mfa-wizard-container {
			padding: $spacing-large;
		}

		.goo__mfa-progress-label {
			font-size: 0.75rem;
		}

		.goo__mfa-progress-dot {
			width: 32px;
			height: 32px;
			font-size: $font-size-small;
		}

		.goo__mfa-apps {
			grid-template-columns: 1fr;
		}

		.goo__mfa-backup-codes {
			grid-template-columns: 1fr;
		}

		.goo__mfa-navigation {
			flex-wrap: wrap;
		}

		.goo__mfa-code-input {
			font-size: 1.5rem;
		}
	}

	@media (max-width: $breakpoint-sm) {
		.goo__mfa-progress-label {
			display: none;
		}

		.goo__mfa-progress-step {
			gap: 0;
		}
	}
</style>
