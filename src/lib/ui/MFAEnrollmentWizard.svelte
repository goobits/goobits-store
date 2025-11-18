<script>
	import { Check, ChevronLeft, Download, Copy, CheckCircle2, Smartphone, QrCode, Shield } from '@lucide/svelte'
	import { browser } from '$app/environment'
	import QRCodeLib from 'qrcode'
	import { getBackendUrl, getPublishableKey } from '../config/urls.js'
	import { createLogger } from '../utils/logger.js'

	const logger = createLogger('MFAEnrollmentWizard')

	/**
	 * MFAEnrollmentWizard - Multi-step wizard for MFA enrollment
	 *
	 * @prop {string} userId - User ID for enrollment
	 * @prop {string} password - Pre-verified password for enrollment
	 * @prop {Function} onComplete - Callback when enrollment is complete
	 * @prop {Function} onCancel - Callback when user cancels
	 * @prop {boolean} allowSkip - Whether user can skip enrollment
	 * @prop {string} backendUrl - Backend API URL
	 */
	let {
	userId,
	password,
	onComplete,
	onCancel,
	allowSkip = true,
	backendUrl = getBackendUrl()
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

	// Selected app
	let selectedApp = $state(null)

	// Recommended authenticator apps
	const authenticatorApps = [
	{ name: 'Google Authenticator', icon: 'smartphone' },
	{ name: 'Authy', icon: 'smartphone' },
	{ name: '1Password', icon: 'shield' },
	{ name: 'Microsoft Authenticator', icon: 'smartphone' }
	]

	// Initialize MFA enrollment
	async function initializeEnrollment() {
	if (currentStep !== 2 || !password) return

	loading = true
	error = null

	try {
	const response = await fetch(`${ backendUrl }/store/auth/mfa/enroll/initialize`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-publishable-api-key': getPublishableKey()
	},
	credentials: 'include',
	body: JSON.stringify({ password })
	})

	const data = await response.json()

	if (!response.ok) {
	throw new Error(data.error || data.message || 'Failed to initialize MFA enrollment')
	}

	// Store enrollment data
	secretKey = data.mfa.secret
	totpUri = data.mfa.uri
	backupCodes = data.backupCodes || []

	// Generate QR code
	if (browser) {
	// Detect if dark mode is active
	const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches ||
		document.documentElement.getAttribute('data-theme') === 'dark' ||
		document.documentElement.classList.contains('dark')

	qrCodeUrl = await QRCodeLib.toDataURL(totpUri, {
		width: 300,
		margin: 2,
		color: {
			// In dark mode: use light foreground on dark background
			// In light mode: use dark foreground on light background
			dark: isDarkMode ? '#ffffff' : '#000000',
			light: isDarkMode ? '#1a1a1a' : '#ffffff'
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
	const response = await fetch(`${ backendUrl }/store/auth/mfa/enroll/complete`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-publishable-api-key': getPublishableKey()
	},
	credentials: 'include',
	body: JSON.stringify({ code: verificationCode })
	})

	const data = await response.json()

	if (!response.ok) {
	throw new Error(data.error || data.message || 'Invalid verification code')
	}

	// Backup codes were already retrieved in initialize step
	// Move to final step to display them
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
	logger.error('Failed to copy codes:', err)
	}
	}

	// Copy secret key to clipboard
	async function copySecretKey() {
	try {
	await navigator.clipboard.writeText(secretKey)
	} catch (err) {
	logger.error('Failed to copy secret key:', err)
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
	// Move to success screen
	currentStep = 5
	} else if (currentStep === 5) {
	// Complete enrollment and trigger callback
	onComplete?.(backupCodes)
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
	<span class="goo__mfa-progress-label">Backup</span>
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
			<Smartphone size={28} />
		</div>
		<h2>Choose your app</h2>
		<p class="goo__mfa-subtitle">
			Select an authenticator app to generate your security codes.
		</p>

		<div class="goo__mfa-apps">
			{#each authenticatorApps as app}
				<button
					type="button"
					class="goo__mfa-app-card"
					class:selected={selectedApp === app.name}
					onclick={() => selectedApp = app.name}
				>
					{#if app.icon === 'smartphone'}
						<Smartphone size={32} />
					{:else}
						<Shield size={32} />
					{/if}
					<span>{app.name}</span>
				</button>
			{/each}
		</div>

		<div class="goo__mfa-help">
			<p>Need an authenticator app?</p>
			<p class="goo__mfa-help-text">
				Download from your App Store. We recommend Google Authenticator or Authy.
			</p>
		</div>
	</div>
	{/if}

	<!-- Step 2: Scan QR Code -->
	{#if currentStep === 2}
	<div class="goo__mfa-step">
		<div class="goo__mfa-step-icon">
			<QrCode size={28} />
		</div>
		<h2>Scan this code</h2>
		<p class="goo__mfa-subtitle">
			Open your authenticator app and scan the QR code below.
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
			<Shield size={28} />
		</div>
		<h2>Verify it works</h2>
		<p class="goo__mfa-subtitle">
			Enter the 6-digit code from your authenticator app.
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
			<CheckCircle2 size={28} />
		</div>
		<h2>Save your backup codes</h2>
		<p class="goo__mfa-subtitle">
			Keep these safe. Use them if you lose access to your authenticator app.
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

	<!-- Step 5: Success -->
	{#if currentStep === 5}
	<div class="goo__mfa-step goo__mfa-step--success">
		<div class="goo__mfa-success-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>
		<h2>Two-Factor Authentication Enabled</h2>
		<p class="goo__mfa-subtitle">
			Your account is now more secure. You'll need your authenticator app each time you sign in.
		</p>

		<div class="goo__mfa-success-info">
			<div class="goo__mfa-success-item">
				<Shield size={20} />
				<span>Your account is protected</span>
			</div>
			<div class="goo__mfa-success-item">
				<Smartphone size={20} />
				<span>Use your authenticator app to log in</span>
			</div>
			<div class="goo__mfa-success-item">
				<CheckCircle2 size={20} />
				<span>Backup codes saved for emergencies</span>
			</div>
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
		Continue
	</button>
	{:else if currentStep === 5}
	<button
		type="button"
		class="goo__mfa-nav-btn goo__mfa-nav-btn--primary"
		onclick={nextStep}
	>
		Back to Settings
	</button>
	{/if}
	</div>

<style lang="scss">
	@use './variables.scss' as *;

	// Progress Indicator
	.goo__mfa-progress {
	display: flex;
	align-items: center;
	margin-bottom: 56px;
	padding: 0 8px;
	}

	.goo__mfa-progress-step {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	position: relative;
	flex: 1;
	}

	.goo__mfa-progress-dot {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: var(--bg-secondary, #f5f5f7);
	color: var(--text-tertiary, #86868b);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 15px;
	font-weight: 500;
	transition: all 0.3s ease;

	.active & {
	background: var(--accent-primary, #06c);
	color: var(--color-text-on-primary, #ffffff);
	}

	.completed & {
	background: $green-600;
	color: white;
	}
	}

	.goo__mfa-progress-label {
	font-size: 13px;
	color: var(--text-tertiary, #86868b);
	font-weight: 400;
	white-space: nowrap;

	.active & {
	color: var(--text-primary);
	font-weight: 500;
	}
	}

	.goo__mfa-progress-line {
	height: 1px;
	background: var(--color-border, #d2d2d7);
	flex: 1;
	margin: 0 -8px;
	position: relative;
	top: -20px;
	transition: background 0.3s ease;

	&.completed {
	background: $green-600;
	}
	}

	// Content
	.goo__mfa-content {
	background: var(--color-surface, var(--bg-primary, #fbfbfd));
	border-radius: 18px;
	padding: 48px;
	margin-bottom: 32px;
	}

	.goo__mfa-step {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;

	h2 {
	font-size: 32px;
	font-weight: 600;
	letter-spacing: -0.01em;
	color: var(--text-primary);
	margin-bottom: 12px;
	}
	}

	.goo__mfa-subtitle {
	font-size: 17px;
	color: var(--text-secondary, #6e6e73);
	margin-bottom: 40px;
	max-width: 400px;
	}

	.goo__mfa-step-icon {
	width: 56px;
	height: 56px;
	background: linear-gradient(135deg, var(--accent-primary, #06c) 0%, var(--accent-light, #0077ed) 100%);
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24px;
	color: var(--color-text-on-primary, #ffffff);

	&--success {
	background: linear-gradient(135deg, $green-600 0%, #22c55e 100%);
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

	// Step 1: Apps
	.goo__mfa-apps {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
	margin-bottom: 32px;
	width: 100%;
	max-width: 400px;
	}

	.goo__mfa-app-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 24px 20px;
	border: 1px solid var(--color-border, #d2d2d7);
	border-radius: 12px;
	background: var(--bg-primary, #ffffff);
	color: var(--text-primary);
	width: 100%;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
	border-color: var(--accent-primary, #06c);
	box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
	transform: translateY(-2px);
	}

	&:active {
	transform: translateY(0);
	}

	&.selected {
	border-color: var(--accent-primary, #06c);
	border-width: 2px;
	background: var(--accent-primary, #06c);
	color: var(--color-text-on-primary, #ffffff);

	:global(svg) {
	stroke: var(--color-text-on-primary, #ffffff);
	}
	}

	:global(svg) {
	stroke: var(--accent-primary, #06c);
	stroke-width: 1.5;
	}

	span {
	font-size: 15px;
	font-weight: 500;
	}
	}

	.goo__mfa-help {
	background: var(--bg-secondary, #f5f5f7);
	padding: 20px 24px;
	border-radius: 12px;
	max-width: 400px;
	margin-bottom: 32px;

	p {
	margin: 0;
	color: var(--text-primary);
	font-size: 15px;
	font-weight: 500;

	&:first-child {
	margin-bottom: 6px;
	}
	}

	.goo__mfa-help-text {
	font-weight: 400;
	color: var(--text-secondary);
	}
	}

	.goo__mfa-password-section {
	width: 100%;
	max-width: 400px;

	label {
	display: block;
	margin-bottom: 12px;
	font-weight: 500;
	color: var(--text-primary);
	font-size: 15px;
	}

	input {
	width: 100%;
	padding: 16px 18px;
	border: 1px solid var(--color-border, #d2d2d7);
	border-radius: 10px;
	font-size: 17px;
	background-color: var(--bg-primary, #ffffff);
	color: var(--text-primary);
	transition: all 0.2s ease;
	font-family: inherit;

	&:focus {
	outline: none;
	border-color: var(--accent-primary, #06c);
	box-shadow: 0 0 0 4px var(--accent-shadow, rgba(0, 108, 204, 0.1));
	}

	&::placeholder {
	color: var(--text-tertiary, #86868b);
	}
	}
	}

	// Step 2: QR Code
	.goo__mfa-qr-container {
	background: var(--color-surface, var(--bg-primary, #ffffff));
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

	// Step 5: Success
	.goo__mfa-step--success {
	text-align: center;
	}

	.goo__mfa-success-icon {
	width: 64px;
	height: 64px;
	background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto $spacing-xlarge;

	svg {
	width: 32px;
	height: 32px;
	stroke: #ffffff;
	}
	}

	.goo__mfa-success-info {
	display: flex;
	flex-direction: column;
	gap: $spacing-medium;
	margin-top: $spacing-xlarge;
	padding: $spacing-large;
	background: var(--bg-secondary);
	border-radius: $border-radius-medium;
	}

	.goo__mfa-success-item {
	display: flex;
	align-items: center;
	gap: $spacing-medium;
	color: var(--text-primary);
	text-align: left;

	svg {
	flex-shrink: 0;
	color: var(--accent-primary);
	}

	span {
	font-size: $font-size-base;
	}
	}

	// Navigation
	.goo__mfa-navigation {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 32px;
	}

	.goo__mfa-nav-spacer {
	flex: 1;
	}

	.goo__mfa-nav-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 14px 28px;
	border: none;
	border-radius: 10px;
	font-size: 17px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: inherit;

	&--primary {
	background: var(--accent-primary, #06c);
	color: var(--color-text-on-primary, #ffffff);

	&:hover:not(:disabled) {
	background: var(--accent-light, #0077ed);
	}

	&:disabled {
	opacity: 0.4;
	cursor: not-allowed;
	}
	}

	&--secondary {
	background: var(--bg-secondary, #f5f5f7);
	color: var(--text-primary);

	&:hover {
	background: var(--bg-tertiary, #e8e8ed);
	}
	}

	&--text {
	background: none;
	color: var(--text-secondary);
	padding: 14px 20px;

	&:hover {
	color: var(--accent-primary);
	}
	}
	}

	// Mobile responsive
	@media (max-width: 768px) {
	.goo__mfa-content {
	padding: 32px 24px;
	}

	.goo__mfa-step h2 {
	font-size: 28px;
	}

	.goo__mfa-progress-label {
	font-size: 11px;
	}

	.goo__mfa-progress-dot {
	width: 28px;
	height: 28px;
	font-size: 13px;
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

	@media (max-width: 480px) {
	.goo__mfa-progress-step {
	gap: 8px;
	}

	.goo__mfa-progress-label {
	display: none;
	}
	}
</style>
