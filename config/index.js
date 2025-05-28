/**
 * Store configuration
 */

// Export messages
export * from './defaultMessages.js'

export const storeConfig = {
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
 * @param {Object} customConfig - Custom configuration to merge
 * @returns {Object} Merged configuration
 */
export function getStoreConfig(customConfig = {}) {
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