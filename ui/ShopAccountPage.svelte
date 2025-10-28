<script>
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'

	// Props - auth stores passed from parent
	let { auth, isAuthenticated, customer } = $props()

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
	onMount(() => {
		if (!isAuth) {
			goto('/shop/login?return=/shop/account')
		}
	})

	let editing = $state(false)
	let firstName = $state('')
	let lastName = $state('')
	let email = $state('')
	let phone = $state('')

	$effect(() => {
		if (customerData && !editing) {
			firstName = customerData.first_name || ''
			lastName = customerData.last_name || ''
			email = customerData.email || ''
			phone = customerData.phone || ''
		}
	})

	async function handleUpdate(e) {
		e.preventDefault()
		if (!auth) return

		const result = await auth.updateCustomer({
			first_name: firstName,
			last_name: lastName,
			phone
		})

		if (result.success) {
			editing = false
		}
	}

	function handleLogout() {
		if (auth) {
			auth.logout()
		}
	}
</script>

<svelte:head>
	<title>My Account - HoneyFarmer</title>
</svelte:head>

{#if isAuth && customerData}
	<div class="goo__account-page">
		<h1>My Account</h1>

		<div class="goo__account-content">
			<section class="goo__account-section">
				<div class="goo__section-header">
					<h2>Profile Information</h2>
					{#if !editing}
						<button
							onclick={() => editing = true}
							class="goo__edit-button"
						>
							Edit
						</button>
					{/if}
				</div>

				{#if editing}
					<form onsubmit={handleUpdate} class="goo__profile-form">
						<div class="goo__form-row">
							<div class="goo__form-group">
								<label for="firstName">First Name</label>
								<input
									type="text"
									id="firstName"
									bind:value={firstName}
									required
									disabled={authState.loading}
								/>
							</div>

							<div class="goo__form-group">
								<label for="lastName">Last Name</label>
								<input
									type="text"
									id="lastName"
									bind:value={lastName}
									required
									disabled={authState.loading}
								/>
							</div>
						</div>

						<div class="goo__form-group">
							<label for="email">Email Address</label>
							<input
								type="email"
								id="email"
								value={email}
								disabled
								title="Email cannot be changed"
							/>
						</div>

						<div class="goo__form-group">
							<label for="phone">Phone Number</label>
							<input
								type="tel"
								id="phone"
								bind:value={phone}
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
							<span class="goo__info-value">{firstName} {lastName}</span>
						</div>
						<div class="goo__info-row">
							<span class="goo__info-label">Email:</span>
							<span class="goo__info-value">{email}</span>
						</div>
						<div class="goo__info-row">
							<span class="goo__info-label">Phone:</span>
							<span class="goo__info-value">{phone || 'Not provided'}</span>
						</div>
					</div>
				{/if}
			</section>
			
			<section class="goo__account-section">
				<h2>Order History</h2>
				<p class="goo__empty-state">
					You haven't placed any orders yet. 
					<a href="/shop">Start shopping</a> to see your order history here.
				</p>
			</section>
			
			<section class="goo__account-section">
				<h2>Account Actions</h2>
				<button 
					onclick={handleLogout}
					class="goo__logout-button"
				>
					Sign Out
				</button>
			</section>
		</div>
	</div>
{:else}
	<div class="goo__loading">
		<p>Loading...</p>
	</div>
{/if}

<style lang="scss">
	@use '../../../sveltekit/src/styles/variables.scss' as *;
	
	.goo__account-page {
		max-width: 800px;
		margin: 0 auto;
		padding: $spacing-xlarge $spacing-medium;
		
		h1 {
			color: $amber-800;
			margin-bottom: $spacing-xlarge;
		}
	}
	
	.goo__account-content {
		display: flex;
		flex-direction: column;
		gap: $spacing-xlarge;
	}
	
	.goo__account-section {
		background: white;
		border-radius: $border-radius-large;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		padding: $spacing-large;
		
		h2 {
			color: $gray-800;
			font-size: 1.25rem;
			margin-bottom: $spacing-medium;
		}
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
		background-color: white;
		color: $amber-600;
		border: 1px solid $amber-600;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		
		&:hover {
			background-color: $amber-50;
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
				color: $gray-600;
			}
			
			input {
				width: 100%;
				padding: $spacing-small $spacing-medium;
				border: 1px solid $gray-200;
				border-radius: $border-radius-medium;
				font-size: 1rem;
				
				&:focus {
					outline: none;
					border-color: $amber-500;
					box-shadow: 0 0 0 3px rgba($amber-500, 0.1);
				}
				
				&:disabled {
					background-color: $gray-100;
					cursor: not-allowed;
				}
			}
		}
	}
	
	.goo__error {
		background-color: #fee;
		color: #c00;
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
		background-color: white;
		color: $gray-600;
		border: 1px solid $gray-200;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		
		&:hover:not(:disabled) {
			background-color: $gray-100;
		}
		
		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
	
	.goo__save-button {
		padding: $spacing-small $spacing-large;
		background-color: $amber-600;
		color: white;
		border: none;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		
		&:hover:not(:disabled) {
			background-color: $amber-700;
		}
		
		&:disabled {
			background-color: $gray-500;
			cursor: not-allowed;
		}
	}
	
	.goo__profile-info {
		.goo__info-row {
			display: flex;
			padding: $spacing-medium 0;
			border-bottom: 1px solid $gray-200;
			
			&:last-child {
				border-bottom: none;
			}
		}
		
		.goo__info-label {
			font-weight: 500;
			color: $gray-600;
			width: 120px;
			flex-shrink: 0;
		}
		
		.goo__info-value {
			color: $gray-800;
		}
	}
	
	.goo__empty-state {
		color: $gray-600;
		text-align: center;
		padding: $spacing-xlarge;
		
		a {
			color: $amber-600;
			text-decoration: none;
			font-weight: 500;
			
			&:hover {
				text-decoration: underline;
			}
		}
	}
	
	.goo__logout-button {
		padding: $spacing-medium $spacing-large;
		background-color: white;
		color: #dc2626;
		border: 1px solid #dc2626;
		border-radius: $border-radius-medium;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		
		&:hover {
			background-color: #fef2f2;
		}
	}
	
	.goo__loading {
		text-align: center;
		padding: $spacing-xlarge;
		color: $gray-600;
	}
</style>