export interface StoreMedusaProduct {
	id: string
	title: string
	handle: string
	description?: string
	thumbnail?: string
	images?: Array<{ url: string }>
	variants?: StoreMedusaVariant[]
	options?: StoreMedusaOption[]
	collection?: { title: string }
}

export interface StoreMedusaVariant {
	id: string
	title: string
	prices?: Array<{ amount: number; currency_code: string }>
	calculated_price?: {
		calculated_amount: number
		currency_code: string
	}
	options?: Array<{ option_id: string; value: string }>
}

export interface StoreMedusaOption {
	id: string
	title: string
	values?: Array<{ value: string }>
}

export interface StoreMedusaCart {
	id: string
	items?: StoreMedusaLineItem[]
	region?: StoreMedusaRegion
	shipping_address?: StoreMedusaAddress
	billing_address?: StoreMedusaAddress
	payment_session?: { provider_id: string; data?: Record<string, unknown> }
	total?: number
	subtotal?: number
	tax_total?: number
	shipping_total?: number
	discount_total?: number
}

export interface StoreMedusaLineItem {
	id: string
	title: string
	quantity: number
	unit_price: number
	thumbnail?: string
	variant?: StoreMedusaVariant
}

export interface StoreMedusaRegion {
	id: string
	name: string
	currency_code: string
	tax_rate?: number
	countries?: StoreMedusaCountry[]
}

export interface StoreMedusaCountry {
	iso_2: string
	name: string
}

export interface StoreMedusaAddress {
	first_name?: string
	last_name?: string
	address_1?: string
	address_2?: string
	city?: string
	province?: string
	postal_code?: string
	country_code?: string
	phone?: string
}

export interface StoreMedusaOrder {
	id: string
	display_id: number
	status: string
	items?: StoreMedusaLineItem[]
	shipping_address?: StoreMedusaAddress
	total?: number
	created_at?: string
}

export interface StoreMedusaCustomer {
	id: string
	email: string
	first_name?: string
	last_name?: string
	phone?: string
}

export interface StoreShopConfig {
	ui?: {
		theme?: {
			colors?: {
				primary?: string
				secondary?: string
			}
		}
		classPrefix?: string
		placeholders?: {
			product?: string
		}
	}
	shopUri?: string
	shopName?: string
}

export interface StoreHeroSection {
	badge?: string
	title?: string
	subtitle?: string
	productsTitle?: string
	productsDescription?: string
}

export interface StoreFeaturesSection {
	title?: string
	description?: string
	links?: Array<{
		title: string
		items: Array<{ text: string; href: string; url?: string; label?: string }>
	}>
}

export interface StoreFooterSection {
	title?: string
	subtitle?: string
	contact?: {
		email?: string
		phone?: string
		phoneDisplay?: string
	}
}

export interface StoreCartProduct {
	id: string
	name: string
	handle: string
	price: number
	image?: string
	variant_id: string
	quantity?: number
}

export interface StoreAuthState {
	isAuthenticated: boolean
	customer?: StoreMedusaCustomer
	token?: string
	loading: boolean
	error: string | null
}

export interface StorePaymentResult {
	success: boolean
	error?: string
	paymentIntent?: {
		id: string
		status: string
	}
}

export interface StoreMFAEnrollment {
	secret?: string
	qrCode?: string
	backupCodes?: string[]
}

export interface StoreSubscriptionInterval {
	value: string
	label: string
	discount: number
	count?: number
}

export interface StoreSubscription {
	id: string
	status: string
	interval: string
	interval_count: number
	current_period_start?: string
	current_period_end?: string
	product?: StoreMedusaProduct
	next_billing_date?: string
	amount?: number
	currency_code?: string
	discount_type?: 'none' | 'percentage' | 'fixed'
	discount_value?: number
	start_date?: string
	trial_end_date?: string
	ended_at?: string
	cancelled_at?: string
	payment_retry_count?: number
	last_payment_error?: string
	metadata?: Record<string, unknown>
}

export interface StoreSubscriptionUpdateEvent {
	action: 'pause' | 'resume' | 'cancel'
	subscription: StoreSubscription
	immediately?: boolean
}

export type MedusaProduct = StoreMedusaProduct
export type MedusaVariant = StoreMedusaVariant
export type MedusaOption = StoreMedusaOption
export type MedusaCart = StoreMedusaCart
export type MedusaLineItem = StoreMedusaLineItem
export type MedusaRegion = StoreMedusaRegion
export type MedusaCountry = StoreMedusaCountry
export type MedusaAddress = StoreMedusaAddress
export type MedusaOrder = StoreMedusaOrder
export type MedusaCustomer = StoreMedusaCustomer
export type ShopConfig = StoreShopConfig
export type HeroSection = StoreHeroSection
export type FeaturesSection = StoreFeaturesSection
export type FooterSection = StoreFooterSection
export type CartProduct = StoreCartProduct
export type AuthState = StoreAuthState
export type PaymentResult = StorePaymentResult
export type MFAEnrollment = StoreMFAEnrollment
export type SubscriptionInterval = StoreSubscriptionInterval
export type Subscription = StoreSubscription
export type SubscriptionUpdateEvent = StoreSubscriptionUpdateEvent

declare global {
	interface MedusaProduct extends StoreMedusaProduct {}
	interface MedusaVariant extends StoreMedusaVariant {}
	interface MedusaOption extends StoreMedusaOption {}
	interface MedusaCart extends StoreMedusaCart {}
	interface MedusaLineItem extends StoreMedusaLineItem {}
	interface MedusaRegion extends StoreMedusaRegion {}
	interface MedusaCountry extends StoreMedusaCountry {}
	interface MedusaAddress extends StoreMedusaAddress {}
	interface MedusaOrder extends StoreMedusaOrder {}
	interface MedusaCustomer extends StoreMedusaCustomer {}
	interface ShopConfig extends StoreShopConfig {}
	interface HeroSection extends StoreHeroSection {}
	interface FeaturesSection extends StoreFeaturesSection {}
	interface FooterSection extends StoreFooterSection {}
	interface CartProduct extends StoreCartProduct {}
	interface AuthState extends StoreAuthState {}
	interface PaymentResult extends StorePaymentResult {}
	interface MFAEnrollment extends StoreMFAEnrollment {}
	interface SubscriptionInterval extends StoreSubscriptionInterval {}
	interface Subscription extends StoreSubscription {}
	interface SubscriptionUpdateEvent extends StoreSubscriptionUpdateEvent {}
}
