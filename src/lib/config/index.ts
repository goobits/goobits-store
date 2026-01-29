/**
 * Store configuration
 */

// Export messages
export * from './defaultMessages.js'

export interface PaginationConfig {
	productsPerBatch: number;
	productsPerPage: number;
}

export interface CheckoutConfig {
	steps: string[];
	requiredFields: string[];
}

export interface ThemeColors {
	primary: string;
	secondary: string;
}

export interface ThemeConfig {
	colors: ThemeColors;
}

export interface UIConfig {
	theme: ThemeConfig;
	classPrefix: string;
}

export interface I18nConfig {
	enabled: boolean;
	supportedLanguages: string[];
	defaultLanguage: string;
	includeLanguageInURL: boolean;
	autoDetectLanguage: boolean;
	languageDetectionOrder: string[];
	persistLanguageKey: string;
}

export interface StoreConfig {
	shopUri: string;
	currency: string;
	currencySymbol: string;
	pagination: PaginationConfig;
	checkout: CheckoutConfig;
	ui: UIConfig;
	i18n: I18nConfig;
}

export interface PartialStoreConfig {
	shopUri?: string;
	currency?: string;
	currencySymbol?: string;
	pagination?: Partial<PaginationConfig>;
	checkout?: Partial<CheckoutConfig>;
	ui?: Partial<UIConfig>;
	i18n?: Partial<I18nConfig>;
}

export const storeConfig: StoreConfig = {
	shopUri: '/shop',
	currency: 'USD',
	currencySymbol: '$',

	// Pagination configuration
	pagination: {
		productsPerBatch: 12,
		productsPerPage: 24
	},

	// Checkout configuration
	checkout: {
		steps: [ 'customer', 'shipping', 'payment', 'review', 'confirmation' ],
		requiredFields: [ 'email', 'firstName', 'lastName', 'address' ]
	},

	// UI configuration
	ui: {
		theme: {
			colors: {
				primary: '#f59e0b',
				secondary: '#16a34a'
			}
		},
		classPrefix: 'goo__'
	},

	// i18n configuration
	i18n: {
		enabled: false,
		supportedLanguages: [ 'en' ],
		defaultLanguage: 'en',
		includeLanguageInURL: false,
		autoDetectLanguage: false,
		languageDetectionOrder: [ 'url', 'sessionStorage', 'browser' ],
		persistLanguageKey: 'store-lang'
	}
}

/**
 * Get the store configuration, merging with any custom configuration
 * @param customConfig - Custom configuration to merge
 * @returns Merged configuration
 */
export function getStoreConfig(customConfig: PartialStoreConfig = {}): StoreConfig {
	return {
		...storeConfig,
		...customConfig,
		// Deep merge nested objects
		pagination: { ...storeConfig.pagination, ...customConfig.pagination },
		checkout: { ...storeConfig.checkout, ...customConfig.checkout },
		ui: { ...storeConfig.ui, ...customConfig.ui },
		i18n: { ...storeConfig.i18n, ...customConfig.i18n }
	}
}
