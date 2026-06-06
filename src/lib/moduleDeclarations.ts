declare module '@goobits/store' {
	import type { Writable } from 'svelte/store'

	interface StoreCartItem {
		id: string
		name: string
		price: number
		quantity: number
		variant_id?: string
		image?: string
		handle?: string
		variant_title?: string
		options?: Array<{ title?: string; value?: string }>
		[key: string]: unknown
	}

	export const cart: Writable<StoreCartItem[]>
	export function addToCart(product: StoreCartItem | CartProduct): void
	export function removeFromCart(productId: string): void
	export function updateQuantity(productId: string, quantity: number): void
	export function clearCart(): void
	export function getCartItems(): StoreCartItem[]
	export function getCartTotal(): number
	export function getCartCount(): number
	export function associateWithCustomer(): Promise<void>
	export function reset(): void

	interface MedusaClientWithConfig {
		config?: {
			baseUrl: string
			publishableApiKey: string
		}
		carts: {
			create(params?: { region_id?: string }): Promise<{ cart: MedusaCart }>
			update(cartId: string, data: Record<string, unknown>): Promise<{ cart: MedusaCart }>
			lineItems: {
				create(cartId: string, data: { variant_id?: string; quantity: number }): Promise<{ cart: MedusaCart }>
			}
		}
	}
	export const medusaClient: MedusaClientWithConfig | null

	export function formatPrice(amount: number, currencyCode?: string): string
}

declare module '@goobits/store/utils/checkoutUtils' {
	export function formatPrice(amount: number, currencyCode?: string): string
	export function getLineItemTotal(item: MedusaLineItem): number
	export function getCartSubtotal(cart: MedusaCart): number
}

declare module '@goobits/store/stores' {
	export const cart: {
		subscribe: (fn: (value: CartProduct[]) => void) => () => void
		addItem: (item: CartProduct) => void
		removeItem: (id: string) => void
		updateQuantity: (id: string, quantity: number) => void
		clear: () => void
	}
}

declare module '$env/static/public' {
	export const PUBLIC_MEDUSA_BACKEND_URL: string
	export const PUBLIC_MEDUSA_PUBLISHABLE_KEY: string
}

declare module '@goobits/forms/ui/FormErrors.svelte' {
	export { SvelteComponent as default } from 'svelte'
}

declare module '@goobits/forms/ui/modals/Button.svelte' {
	export { SvelteComponent as default } from 'svelte'
}

declare module '@goobits/forms/ui/modals/Modal.svelte' {
	export { SvelteComponent as default } from 'svelte'
}

declare module '@lib/utils/Logger' {
	export class Logger {
		constructor(module?: string)
		info(...args: unknown[]): void
		warn(...args: unknown[]): void
		error(...args: unknown[]): void
		debug(...args: unknown[]): void
	}
}

declare module '@lib/stores/auth-simple' {
	export const user: {
		subscribe(run: (value: unknown) => void, invalidate?: () => void): () => void
	}
}

declare module 'qrcode' {
	export function toDataURL(text: string, options?: object): Promise<string>
	export function toString(text: string, options?: object): Promise<string>
}

declare module '@goobits/logger' {
	export interface Logger {
		error: (...args: unknown[]) => void
		warn: (...args: unknown[]) => void
		info: (...args: unknown[]) => void
		debug: (...args: unknown[]) => void
	}

	export interface LoggerConfigType {
		setGlobalPrefix: (prefix: string) => void
		configure: (options: Record<string, unknown>) => void
	}

	export function createLogger(module: string): Logger
	export const LogLevels: Record<string, string>
	export const LoggerConfig: LoggerConfigType
}
