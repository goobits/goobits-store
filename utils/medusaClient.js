import Medusa from '@medusajs/medusa-js'
import { browser } from '$app/environment'
import { createLogger } from './logger.js'

const logger = createLogger('MedusaClient')

// Client-side only Medusa client
// This is used for browser-only operations
let client = null

// Initialize the client only in the browser
if (browser) {
	// Use environment variables for backend URL and API key
	const MEDUSA_BACKEND_URL = import.meta.env.VITE_MEDUSA_BACKEND_URL
	const PUBLISHABLE_API_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY

	// Validate required environment variables
	if (!MEDUSA_BACKEND_URL || !PUBLISHABLE_API_KEY) {
		logger.error('Missing required environment variables for Medusa client:',
			!MEDUSA_BACKEND_URL ? 'VITE_MEDUSA_BACKEND_URL' : '',
			!PUBLISHABLE_API_KEY ? 'VITE_MEDUSA_PUBLISHABLE_KEY' : '')
	}

	// Initialize Medusa client
	client = new Medusa({
		baseUrl: MEDUSA_BACKEND_URL,
		maxRetries: 3,
		publishableApiKey: PUBLISHABLE_API_KEY
	})
}

// Export the client - will be null on the server
export const medusaClient = client
