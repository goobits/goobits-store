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
	const MEDUSA_BACKEND_URL = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL
	const PUBLISHABLE_API_KEY = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY

	// Validate required environment variables
	if (!MEDUSA_BACKEND_URL || !PUBLISHABLE_API_KEY) {
		const missing = []
		if (!MEDUSA_BACKEND_URL) missing.push('PUBLIC_MEDUSA_BACKEND_URL')
		if (!PUBLISHABLE_API_KEY) missing.push('PUBLIC_MEDUSA_PUBLISHABLE_KEY')

		logger.error(
			`Missing required environment variables for Medusa client: ${missing.join(', ')}`,
			'\n💡 Solution: These variables are in .env but Vite needs restart to load them.',
			'\n   Run: Ctrl+C and restart with `pnpm dev`'
		)
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
