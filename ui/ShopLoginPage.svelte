<script>
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { browser } from '$app/environment'

	// Props - auth store and optional demo credentials passed from parent
	let { auth, demoCredentials = null } = $props()

	let email = $state('')
	let password = $state('')
	let showRegister = $state(false)
	let firstName = $state('')
	let lastName = $state('')
	let phone = $state('')
	let confirmPassword = $state('')
	let isDemoMode = $state(false)

	// Subscribe to auth store
	let authState = $state({ customer: null, token: null, loading: false, error: null })

	$effect(() => {
		if (auth) {
			// Subscribe to auth store updates
			const unsubscribe = auth.subscribe((state) => {
				authState = state
			})
			return unsubscribe
		}
	})

	// Auto-fill demo credentials on localhost
	$effect(() => {
		if (browser && typeof window !== 'undefined' && demoCredentials) {
			const isLocalhost = window.location.hostname === 'localhost' ||
							   window.location.hostname === '127.0.0.1' ||
							   window.location.hostname.startsWith('192.168.')

			if (isLocalhost && !showRegister && !email && !password) {
				email = demoCredentials.email
				password = demoCredentials.password
				isDemoMode = true
			}
		}
	})

	let returnUrl = $derived($page.url.searchParams.get('return') || '/shop/account')

	async function handleLogin(e) {
		e.preventDefault()
		if (!auth) return

		const result = await auth.login(email, password)
		if (result.success) {
			goto(returnUrl)
		}
	}

	async function handleRegister(e) {
		e.preventDefault()
		if (!auth) return

		if (password !== confirmPassword) {
			// Set error state
			authState = { ...authState, error: 'Passwords do not match' }
			return
		}

		const result = await auth.register({
			first_name: firstName,
			last_name: lastName,
			email,
			password,
			phone
		})

		if (result.success) {
			goto(returnUrl)
		}
	}

	function toggleMode() {
		showRegister = !showRegister
		// Clear error when switching modes
		if (auth && auth.clearError) {
			auth.clearError()
		} else {
			authState = { ...authState, error: null }
		}
	}
</script>

<svelte:head>
	<title>{showRegister ? 'Create Account' : 'Sign In'} - HoneyFarmer</title>
</svelte:head>

<div class="goo__auth-page">
	<div class="goo__auth-container">
		<h1>{showRegister ? 'Create Your Account' : 'Welcome Back'}</h1>
		<p class="goo__auth-subtitle">
			{showRegister
				? 'Join our hive and start your sweet journey'
				: 'Sign in to access your account and orders'}
		</p>

		{#if authState.error}
			<div class="goo__auth-error" role="alert">
				{authState.error}
			</div>
		{/if}
		
		{#if showRegister}
			<form onsubmit={handleRegister} class="goo__auth-form">
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
						bind:value={email}
						required
						disabled={authState.loading}
					/>
				</div>
				
				<div class="goo__form-group">
					<label for="phone">Phone Number (Optional)</label>
					<input
						type="tel"
						id="phone"
						bind:value={phone}
						disabled={authState.loading}
					/>
				</div>
				
				<div class="goo__form-group">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						minlength="8"
						disabled={authState.loading}
					/>
				</div>
				
				<div class="goo__form-group">
					<label for="confirmPassword">Confirm Password</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						required
						minlength="8"
						disabled={authState.loading}
					/>
				</div>
				
				<button 
					type="submit" 
					class="goo__auth-submit"
					disabled={authState.loading}
				>
					{authState.loading ? 'Creating Account...' : 'Create Account'}
				</button>
			</form>
		{:else}
			<form onsubmit={handleLogin} class="goo__auth-form">
				<div class="goo__form-group">
					<label for="email">Email Address</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						disabled={authState.loading}
					/>
				</div>
				
				<div class="goo__form-group">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						disabled={authState.loading}
					/>
				</div>
				
				<button 
					type="submit" 
					class="goo__auth-submit"
					disabled={authState.loading}
				>
					{authState.loading ? 'Signing In...' : 'Sign In'}
				</button>
			</form>
		{/if}
		
		<div class="goo__auth-toggle">
			{#if showRegister}
				<p>Already have an account?</p>
				<button onclick={toggleMode} class="goo__auth-link">
					Sign In
				</button>
			{:else}
				<p>Don't have an account?</p>
				<button onclick={toggleMode} class="goo__auth-link">
					Create Account
				</button>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	@use '../../../sveltekit/src/styles/variables.scss' as *;
	
	.goo__auth-page {
		min-height: calc(100vh - 200px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $spacing-xlarge $spacing-medium;
	}
	
	.goo__auth-container {
		background: white;
		border-radius: $border-radius-large;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: $spacing-xlarge;
		width: 100%;
		max-width: 480px;
		
		h1 {
			color: $amber-800;
			margin-bottom: $spacing-small;
			text-align: center;
		}
	}
	
	.goo__auth-subtitle {
		text-align: center;
		color: $gray-600;
		margin-bottom: $spacing-large;
	}

	.goo__auth-error {
		background-color: #fee;
		color: #c00;
		padding: $spacing-medium;
		border-radius: $border-radius-medium;
		margin-bottom: $spacing-medium;
		text-align: center;
	}
	
	.goo__auth-form {
		margin-bottom: $spacing-large;
	}
	
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
	
	.goo__auth-submit {
		width: 100%;
		padding: $spacing-medium;
		background-color: $amber-600;
		color: white;
		border: none;
		border-radius: $border-radius-medium;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		
		&:hover:not(:disabled) {
			background-color: $amber-700;
			transform: translateY(-1px);
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		}
		
		&:disabled {
			background-color: $gray-500;
			cursor: not-allowed;
		}
	}
	
	.goo__auth-toggle {
		text-align: center;
		padding-top: $spacing-medium;
		border-top: 1px solid $gray-200;
		
		p {
			margin-bottom: $spacing-small;
			color: $gray-600;
		}
	}
	
	.goo__auth-link {
		background: none;
		border: none;
		color: $amber-600;
		font-weight: 500;
		cursor: pointer;
		text-decoration: underline;
		
		&:hover {
			color: $amber-700;
		}
	}
</style>