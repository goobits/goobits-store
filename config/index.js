/**
 * Store configuration
 */

// Export messages
export * from './defaultMessages.js'

export const storeConfig = {
	shopUri: '/shop',
	currency: 'USD',
	currencySymbol: '$',

	// Checkout configuration
	checkout: {
		steps: [ 'customer', 'shipping', 'payment', 'review', 'confirmation' ],
		requiredFields: [ 'email', 'firstName', 'lastName', 'address' ]
	},

	// UI configuration
	ui: {
		theme: {
			colors: {
				primary: '#ff6b6b',
				secondary: '#4ecdc4'
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