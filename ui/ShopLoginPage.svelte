<script>
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { browser } from '$app/environment'

	// Props - auth store, optional demo credentials, and initial mode passed from parent
	let { auth, demoCredentials = null, initialMode = 'login' } = $props()

	let email = $state('')
	let password = $state('')
	let showRegister = $state(initialMode === 'register')
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
		// Clear error when switching modes
		if (auth && auth.clearError) {
			auth.clearError()
		} else {
			authState = { ...authState, error: null }
		}

		// Navigate to the appropriate route
		if (showRegister) {
			goto('/shop/login')
		} else {
			goto('/shop/register')
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
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem $spacing-medium;
		min-height: 0; // Allow flex shrinking if needed
	}
	
	.goo__auth-container {
		background: var(--color-surface);
		border-radius: $border-radius-large;
		box-shadow: var(--shadow-md);
		padding: $spacing-xlarge;
		width: 100%;
		max-width: 480px;

		h1 {
			color: var(--text-primary);
			margin-bottom: $spacing-small;
			text-align: center;
		}
	}

	.goo__auth-subtitle {
		text-align: center;
		color: var(--text-secondary);
		margin-bottom: $spacing-large;
	}

	.goo__auth-error {
		background-color: var(--error-bg);
		color: var(--error-text);
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
	
	.goo__auth-submit {
		width: 100%;
		padding: $spacing-medium;
		background-color: var(--accent-primary);
		color: var(--color-text-on-primary);
		border: none;
		border-radius: $border-radius-medium;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;

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

	.goo__auth-toggle {
		text-align: center;
		padding-top: $spacing-medium;
		border-top: 1px solid var(--color-border);

		p {
			margin-bottom: $spacing-small;
			color: var(--text-secondary);
		}
	}

	.goo__auth-link {
		background: none;
		border: none;
		color: var(--accent-primary);
		font-weight: 500;
		cursor: pointer;
		text-decoration: underline;

		&:hover {
			color: var(--accent-light);
		}
	}
</style>