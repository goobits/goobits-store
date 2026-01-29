/**
 * Type definitions for @goobits/store
 */

// Medusa types
declare interface MedusaProduct {
	id: string;
	title: string;
	handle: string;
	description?: string;
	thumbnail?: string;
	images?: Array<{ url: string }>;
	variants?: MedusaVariant[];
	options?: MedusaOption[];
	collection?: { title: string };
}

declare interface MedusaVariant {
	id: string;
	title: string;
	prices?: Array<{ amount: number; currency_code: string }>;
	calculated_price?: {
		calculated_amount: number;
		currency_code: string;
	};
	options?: Array<{ option_id: string; value: string }>;
}

declare interface MedusaOption {
	id: string;
	title: string;
	values?: Array<{ value: string }>;
}

declare interface MedusaCart {
	id: string;
	items?: MedusaLineItem[];
	region?: MedusaRegion;
	shipping_address?: MedusaAddress;
	billing_address?: MedusaAddress;
	payment_session?: { provider_id: string; data?: Record<string, unknown> };
	total?: number;
	subtotal?: number;
	tax_total?: number;
	shipping_total?: number;
	discount_total?: number;
}

declare interface MedusaLineItem {
	id: string;
	title: string;
	quantity: number;
	unit_price: number;
	thumbnail?: string;
	variant?: MedusaVariant;
}

declare interface MedusaRegion {
	id: string;
	name: string;
	currency_code: string;
	tax_rate?: number;
	countries?: MedusaCountry[];
}

declare interface MedusaCountry {
	iso_2: string;
	name: string;
}

declare interface MedusaAddress {
	first_name?: string;
	last_name?: string;
	address_1?: string;
	address_2?: string;
	city?: string;
	province?: string;
	postal_code?: string;
	country_code?: string;
	phone?: string;
}

declare interface MedusaOrder {
	id: string;
	display_id: number;
	status: string;
	items?: MedusaLineItem[];
	shipping_address?: MedusaAddress;
	total?: number;
	created_at?: string;
}

declare interface MedusaCustomer {
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
	phone?: string;
}

// Shop config types
declare interface ShopConfig {
	ui?: {
		placeholders?: {
			product?: string;
		};
	};
	shopUri?: string;
	shopName?: string;
}

declare interface HeroSection {
	badge?: string;
	title?: string;
	subtitle?: string;
	productsTitle?: string;
	productsDescription?: string;
}

declare interface FeaturesSection {
	title?: string;
	description?: string;
	links?: Array<{
		title: string;
		items: Array<{ text: string; href: string }>;
	}>;
}

declare interface FooterSection {
	title?: string;
	subtitle?: string;
	contact?: {
		email?: string;
		phone?: string;
		phoneDisplay?: string;
	};
}

// Cart types
declare interface CartProduct {
	id: string;
	name: string;
	handle: string;
	price: number;
	image?: string;
	variant_id: string;
	quantity?: number;
}

// Auth types
declare interface AuthState {
	isAuthenticated: boolean;
	customer?: MedusaCustomer;
	token?: string;
}

// Payment types
declare interface PaymentResult {
	success: boolean;
	error?: string;
	paymentIntent?: {
		id: string;
		status: string;
	};
}

// MFA types
declare interface MFAEnrollment {
	secret?: string;
	qrCode?: string;
	backupCodes?: string[];
}

// Subscription types
declare interface Subscription {
	id: string;
	status: string;
	interval: string;
	interval_count: number;
	current_period_start?: string;
	current_period_end?: string;
	product?: MedusaProduct;
}

// Global module declarations
declare module '@goobits/store/utils/checkoutUtils' {
	export function formatPrice(amount: number, currencyCode?: string): string;
	export function getLineItemTotal(item: MedusaLineItem): number;
	export function getCartSubtotal(cart: MedusaCart): number;
}

declare module '@goobits/store/stores' {
	export const cart: {
		subscribe: (fn: (value: CartProduct[]) => void) => () => void;
		addItem: (item: CartProduct) => void;
		removeItem: (id: string) => void;
		updateQuantity: (id: string, quantity: number) => void;
		clear: () => void;
	};
}
