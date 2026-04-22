import type { Readable } from 'svelte/store'

export interface StoreAuthUser {
	id: string
	email?: string | null
	first_name?: string | null
	last_name?: string | null
	phone?: string | null
}

export interface StoreAuthState {
	customer?: StoreAuthUser | MedusaCustomer | null
	user?: StoreAuthUser | MedusaCustomer | null
	token?: string | null
	loading: boolean
	error: string | null
}

export interface StoreAuthStore {
	subscribe: Readable<StoreAuthState>['subscribe']
	login?: (email: string, password: string) => Promise<{ success: boolean; mfaRequired?: boolean }>
	register?: (data: Record<string, unknown>) => Promise<{ success: boolean }>
	clearError?: () => void
	checkSession?: () => Promise<void>
	logout?: () => Promise<void>
	updateProfile?: (data: Record<string, unknown>) => Promise<{ success: boolean }>
}

export interface DemoCredentials {
	email: string
	password: string
}

export interface Branding {
	siteName?: string
	loginTitle?: string
	loginSubtitle?: string
	registerTitle?: string
	registerSubtitle?: string
}

export interface ShippingAddress {
	first_name: string
	last_name: string
	address_1: string
	address_2: string
	city: string
	province: string
	postal_code: string
	country_code: string
	phone: string
}

export interface CustomerInfo {
	email: string
	first_name: string
	last_name: string
}

export interface StoreShippingOption {
	id: string
	name?: string
	amount?: number
	[key: string]: unknown
}

export interface CheckoutFormResult {
	success: boolean
	error?: string
	order?: MedusaOrder
}
