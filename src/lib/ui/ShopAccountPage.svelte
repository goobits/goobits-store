<script>
	import { onMount } from 'svelte'
	import MFASettingsPanel from './MFASettingsPanel.svelte'

	/**
	 * ShopAccountPage - Customer account management
	 *
	 * @prop {Object} auth - Auth store instance
	 * @prop {Object} isAuthenticated - Auth status store
	 * @prop {Object} customer - Customer data store
	 * @prop {Object} [branding] - Site branding
	 */
	const {
		auth,
		isAuthenticated,
		customer,
		branding = { siteName: 'Store' }
	} = $props()

	// Subscribe to stores
	let authState = $state({ customer: null, token: null, loading: false, error: null })
	let isAuth = $state(false)
	let customerData = $state(null)

	$effect(() => {
		if (auth) {
			const unsubAuth = auth.subscribe((state) => {
				authState = state
			})
			return unsubAuth
		}
	})

	$effect(() => {
		if (isAuthenticated) {
			const unsubIsAuth = isAuthenticated.subscribe((value) => {
				isAuth = value
			})
			return unsubIsAuth
		}
	})

	$effect(() => {
		if (customer) {
			const unsubCustomer = customer.subscribe((value) => {
				customerData = value
			})
			return unsubCustomer
		}
	})

	// Redirect to login if not authenticated
	// Fetch user data if authenticated but missing
	onMount(async () => {
		if (!isAuth) {
			if (typeof window !== 'undefined') {
				window.location.href = '/shop/login?return=/shop/account'
			}
		} else if (isAuth && !currentUser && auth) {
			// User is authenticated but user data is missing.
			// Refresh session to get user data
			await auth.checkSession()
		}
	})

	let editing = $state(false)

	// Get user data from either customerData or authState.user
	const currentUser = $derived(customerData || authState.user)

	// Use $derived for display values to ensure SSR/client consistency
	const displayName = $derived(currentUser?.name || '')
	const displayEmail = $derived(currentUser?.email || '')
	const displayPhone = $derived(currentUser?.phone || '')

	// Separate state for editing (only used when editing=true)
	let editName = $state('')
	let editEmail = $state('')
	let editPhone = $state('')

	// Populate edit fields when entering edit mode
	function startEditing() {
		editName = displayName
		editEmail = displayEmail
		editPhone = displayPhone
		editing = true
	}

	async function handleUpdate(e) {
		e.preventDefault()
		if (!auth) return

		const result = await auth.updateProfile({
			name: editName,
			phone: editPhone
		})

		if (result.success) {
			editing = false
		}
	}

	async function handleLogout() {
		if (auth) {
			await auth.logout()
			if (typeof window !== 'undefined') {
				window.location.href = '/shop/login'
			}
		}
	}
</script>

<svelte:head>
	<title>My Account - {branding.siteName}</title>
</svelte:head>

{#if isAuth && currentUser}
	<div class="goo__account-page">
		<h1>My Account</h1>

		<div class="goo__account-content">
			<section class="goo__account-section">
				<div class="goo__section-header">
					<h2>Profile Information</h2>
					{#if !editing}
						<button
							onclick={startEditing}
							class="goo__edit-button"
						>
							Edit
						</button>
					{/if}
				</div>

				{#if editing}
					<form onsubmit={handleUpdate} class="goo__profile-form">
						<div class="goo__form-group">
							<label for="name">Full Name</label>
							<input
								type="text"
								id="name"
								bind:value={editName}
								required
								disabled={authState.loading}
								placeholder="Enter your full name"
							/>
						</div>

						<div class="goo__form-group">
							<label for="email">Email Address</label>
							<input
								type="email"
								id="email"
								value={editEmail}
								disabled
								title="Email cannot be changed"
							/>
						</div>

						<div class="goo__form-group">
							<label for="phone">Phone Number</label>
							<input
								type="tel"
								id="phone"
								bind:value={editPhone}
								disabled={authState.loading}
							/>
						</div>

						{#if authState.error}
							<div class="goo__error" role="alert">
								{authState.error}
							</div>
						{/if}

						<div class="goo__form-actions">
							<button
								type="button"
								onclick={() => editing = false}
								class="goo__cancel-button"
								disabled={authState.loading}
							>
								Cancel
							</button>
							<button
								type="submit"
								class="goo__save-button"
								disabled={authState.loading}
							>
								{authState.loading ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</form>
				{:else}
					<div class="goo__profile-info">
						<div class="goo__info-row">
							<span class="goo__info-label">Name:</span>
							<span class="goo__info-value">{displayName || 'Not provided'}</span>
						</div>
						<div class="goo__info-row">
							<span class="goo__info-label">Email:</span>
							<span class="goo__info-value">{displayEmail}</span>
						</div>
						<div class="goo__info-row">
							<span class="goo__info-label">Phone:</span>
							<span class="goo__info-value">{displayPhone || 'Not provided'}</span>
						</div>
					</div>
				{/if}
			</section>

			<section class="goo__account-section">
				<h2>Security</h2>
				<p class="goo__section-description">
					Manage your account security settings and two-factor authentication.
				</p>
				<MFASettingsPanel {auth} />
			</section>

			<section class="goo__account-section">
				<h2>Order History</h2>
				<div class="goo__empty-state">
					<svg class="goo__empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<path d="M16 10a4 4 0 0 1-8 0"></path>
					</svg>
					<h3 class="goo__empty-title">No orders yet</h3>
					<p class="goo__empty-description">Start your shopping journey and your orders will appear here.</p>
					<a href="/shop" class="goo__empty-action">Browse Products</a>
				</div>
			</section>

			<section class="goo__account-section goo__account-actions">
				<h2>Account Actions</h2>
				<div class="goo__actions-grid">
					<button
						onclick={handleLogout}
						class="goo__action-button goo__action-button--danger"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
							<polyline points="16 17 21 12 16 7"></polyline>
							<line x1="21" y1="12" x2="9" y2="12"></line>
						</svg>
						<span>Sign Out</span>
					</button>
				</div>
			</section>
		</div>
	</div>
{:else}
	<div class="goo__loading">
		<p>Loading...</p>
	</div>
{/if}

<style lang="scss">
	@use './variables.scss' as *;
	
	.goo__account-page {
		flex: 1;
		max-width: 800px;
		margin: 0 auto;
		padding: $spacing-xlarge $spacing-medium;

		h1 {
			color: var(--text-primary);
			margin-bottom: $spacing-xlarge;
		}
	}

	.goo__account-content {
		display: flex;
		flex-direction: column;
		gap: $spacing-xlarge;
	}

	.goo__account-section {
		background: var(--color-surface);
		border-radius: $border-radius-large;
		box-shadow: var(--shadow-md);
		padding: $spacing-large;

		h2 {
			color: var(--text-primary);
			font-size: 1.25rem;
			margin-bottom: $spacing-medium;
		}
	}

	.goo__section-description {
		color: var(--text-secondary);
		margin-bottom: $spacing-medium;
		font-size: 0.9375rem;
		line-height: 1.5;
	}
	
	.goo__section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-medium;
		
		h2 {
			margin-bottom: 0;
		}
	}
	
	.goo__edit-button {
		padding: $spacing-small $spacing-medium;
		background-color: var(--color-surface);
		color: var(--accent-primary);
		border: 1px solid var(--accent-primary);
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background-color: var(--bg-secondary);
		}
	}

	.goo__profile-form {
		.goo__form-row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: $spacing-medium;

			@media (max-width: 480px) {
				grid-template-columns: 1fr;
			}
		}

		.goo__form-group {
			margin-bottom: $spacing-medium;

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
	}
	
	.goo__error {
		background-color: var(--error-bg);
		color: var(--error-text);
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-medium;
		text-align: center;
	}

	.goo__form-actions {
		display: flex;
		gap: $spacing-medium;
		justify-content: flex-end;
		margin-top: $spacing-large;
	}

	.goo__cancel-button {
		padding: $spacing-small $spacing-large;
		background-color: var(--color-surface);
		color: var(--text-secondary);
		border: 1px solid var(--color-border);
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			background-color: var(--bg-secondary);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.goo__save-button {
		padding: $spacing-small $spacing-large;
		background-color: var(--accent-primary);
		color: var(--color-text-on-primary);
		border: none;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			background-color: var(--accent-light);
		}

		&:disabled {
			background-color: var(--bg-tertiary);
			cursor: not-allowed;
			opacity: 0.6;
		}
	}
	
	.goo__profile-info {
		.goo__info-row {
			display: flex;
			padding: $spacing-medium 0;
			border-bottom: 1px solid var(--color-border);

			&:last-child {
				border-bottom: none;
			}
		}

		.goo__info-label {
			font-weight: 500;
			color: var(--text-secondary);
			width: 120px;
			flex-shrink: 0;
		}

		.goo__info-value {
			color: var(--text-primary);
		}
	}

	.goo__empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: $spacing-xlarge * 2;
		background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
		border-radius: $border-radius-large;
		border: 1px solid var(--color-border);
		gap: $spacing-medium;
	}

	.goo__empty-icon {
		color: var(--accent-primary);
		opacity: 0.6;
		margin-bottom: $spacing-small;
	}

	.goo__empty-title {
		color: var(--text-primary);
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.goo__empty-description {
		color: var(--text-secondary);
		font-size: 0.95rem;
		margin: 0;
		max-width: 400px;
		line-height: 1.5;
	}

	.goo__empty-action {
		display: inline-flex;
		align-items: center;
		padding: $spacing-small $spacing-large;
		margin-top: $spacing-small;
		background-color: var(--accent-primary);
		color: var(--color-text-on-primary);
		text-decoration: none;
		font-weight: 600;
		border-radius: $border-radius-medium;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

		&:hover {
			background-color: var(--accent-light);
			transform: translateY(-1px);
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.goo__account-actions {
		h2 {
			margin-bottom: $spacing-large;
		}
	}

	.goo__actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: $spacing-medium;
	}

	.goo__action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-small;
		padding: $spacing-medium $spacing-large;
		border-radius: $border-radius-medium;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid transparent;

		svg {
			flex-shrink: 0;
		}

		&--danger {
			background-color: transparent;
			color: var(--error-text);
			border-color: var(--error-border);

			&:hover {
				background-color: var(--error-bg);
				border-color: var(--error-text);
				transform: translateY(-1px);
				box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
			}

			&:active {
				transform: translateY(0);
			}
		}
	}

	.goo__loading {
		text-align: center;
		padding: $spacing-xlarge;
		color: var(--text-secondary);
	}
</style>