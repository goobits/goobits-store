import { writable, derived } from 'svelte/store'
import { browser } from '$app/environment'
import { medusaClient } from '../utils/medusaClient.js'
import { goto } from '$app/navigation'
import { cartStore } from './cart.js'

// Auth token key
const AUTH_TOKEN_KEY = 'medusa_auth_token'

// Create auth store
function createAuthStore() {
	// Initial state
	const { subscribe, set, update } = writable({
		customer: null,
		token: null,
		loading: false,
		error: null
	})

	// Load token from localStorage on init
	if (browser) {
		const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
		if (savedToken) {
			// Verify token and load customer
			medusaClient.auth.getSession()
				.then(({ customer }) => {
					update(state => ({ ...state, customer, token: savedToken }))
				})
				.catch(() => {
					// Token expired or invalid
					localStorage.removeItem(AUTH_TOKEN_KEY)
				})
		}
	}

	return {
		subscribe,

		async login(email, password) {
			update(state => ({ ...state, loading: true, error: null }))

			try {
				const { customer } = await medusaClient.auth.authenticate({
					email,
					password
				})

				// Get the auth token from the cookie (Medusa sets it)
				const token = medusaClient.config.apiKey

				// Save token
				if (browser && token) {
					localStorage.setItem(AUTH_TOKEN_KEY, token)
				}

				// Update store
				update(state => ({
					...state,
					customer,
					token,
					loading: false,
					error: null
				}))

				// Merge anonymous cart with customer cart
				await cartStore.associateWithCustomer()

				return { success: true, customer }
			} catch (error) {
				const errorMessage = error.response?.data?.message || 'Invalid email or password'
				update(state => ({
					...state,
					loading: false,
					error: errorMessage
				}))
				return { success: false, error: errorMessage }
			}
		},

		async register(userData) {
			update(state => ({ ...state, loading: true, error: null }))

			try {
				// Create customer account
				const { customer: _customer } = await medusaClient.customers.create({
					first_name: userData.first_name,
					last_name: userData.last_name,
					email: userData.email,
					password: userData.password,
					phone: userData.phone
				})

				// Auto-login after registration
				return await this.login(userData.email, userData.password)
			} catch (error) {
				const errorMessage = error.response?.data?.message || 'Registration failed'
				update(state => ({
					...state,
					loading: false,
					error: errorMessage
				}))
				return { success: false, error: errorMessage }
			}
		},

		async logout() {
			update(state => ({ ...state, loading: true }))

			try {
				// Call Medusa logout
				await medusaClient.auth.deleteSession()
			} catch (error) {
				// Continue with logout even if API call fails
			}

			// Clear local state
			if (browser) {
				localStorage.removeItem(AUTH_TOKEN_KEY)
			}

			// Reset store
			set({
				customer: null,
				token: null,
				loading: false,
				error: null
			})

			// Clear cart
			await cartStore.reset()

			// Redirect to home
			if (browser) {
				goto('/')
			}
		},

		async updateCustomer(updates) {
			update(state => ({ ...state, loading: true, error: null }))

			try {
				const { customer } = await medusaClient.customers.update(updates)

				update(state => ({
					...state,
					customer,
					loading: false,
					error: null
				}))

				return { success: true, customer }
			} catch (error) {
				const errorMessage = error.response?.data?.message || 'Update failed'
				update(state => ({
					...state,
					loading: false,
					error: errorMessage
				}))
				return { success: false, error: errorMessage }
			}
		}
	}
}

// Create and export store instance
export const auth = createAuthStore()

// Derived store for auth state
export const isAuthenticated = derived(
	auth,
	$auth => !!$auth.customer && !!$auth.token
)

// Derived store for customer info
export const customer = derived(
	auth,
	$auth => $auth.customer
)