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
declare interface SubscriptionInterval {
	value: string;
	label: string;
	discount: number;
	count?: number;
}

declare interface Subscription {
	id: string;
	status: string;
	interval: string;
	interval_count: number;
	current_period_start?: string;
	current_period_end?: string;
	product?: MedusaProduct;
	next_billing_date?: string;
	amount?: number;
	currency_code?: string;
	discount_type?: 'none' | 'percentage' | 'fixed';
	discount_value?: number;
	start_date?: string;
	trial_end_date?: string;
	ended_at?: string;
	cancelled_at?: string;
	payment_retry_count?: number;
	last_payment_error?: string;
	metadata?: Record<string, unknown>;
}

declare interface SubscriptionUpdateEvent {
	action: 'pause' | 'resume' | 'cancel';
	subscription: Subscription;
	immediately?: boolean;
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

// SvelteKit module declarations
declare module '$app/environment' {
	export const browser: boolean;
	export const dev: boolean;
	export const building: boolean;
	export const version: string;
}

declare module '$env/static/public' {
	export const PUBLIC_MEDUSA_BACKEND_URL: string;
	export const PUBLIC_MEDUSA_PUBLISHABLE_KEY: string;
}

declare module '@goobits/forms/ui/FormErrors.svelte' {
	export { SvelteComponent as default } from 'svelte';
}

declare module '@goobits/forms/ui/modals/Button.svelte' {
	export { SvelteComponent as default } from 'svelte';
}

declare module '@goobits/forms/ui/modals/Modal.svelte' {
	export { SvelteComponent as default } from 'svelte';
}

declare module '@lib/utils/Logger' {
	export class Logger {
		info(...args: unknown[]): void;
		warn(...args: unknown[]): void;
		error(...args: unknown[]): void;
		debug(...args: unknown[]): void;
	}
}

declare module '@lib/stores/auth-simple' {
	import { Readable } from 'svelte/store';
	export const user: Readable<unknown>;
}

declare module 'qrcode' {
	export function toDataURL(text: string, options?: object): Promise<string>;
	export function toString(text: string, options?: object): Promise<string>;
}

// Logger module declaration
declare module '@goobits/logger' {
	export interface Logger {
		error: (...args: unknown[]) => void;
		warn: (...args: unknown[]) => void;
		info: (...args: unknown[]) => void;
		debug: (...args: unknown[]) => void;
	}

	export interface LoggerConfigType {
		setGlobalPrefix: (prefix: string) => void;
		configure: (options: Record<string, unknown>) => void;
	}

	export function createLogger(module: string): Logger;
	export const LogLevels: Record<string, string>;
	export const LoggerConfig: LoggerConfigType;
}
