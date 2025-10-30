import Medusa from '@medusajs/medusa-js'
import { Logger } from './logger.js'
import {
	PUBLIC_MEDUSA_BACKEND_URL,
	PUBLIC_MEDUSA_PUBLISHABLE_KEY
} from '$env/static/public'

const logger = new Logger('MedusaServer')

// Use SvelteKit public environment variables
const backendUrl = PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:3282'
const publishableKey = PUBLIC_MEDUSA_PUBLISHABLE_KEY

// Validate backend URL
if (!backendUrl) {
	throw new Error('Missing Medusa backend URL. Set PUBLIC_MEDUSA_BACKEND_URL in .env')
}

logger.info(`Connecting to Medusa at: ${ backendUrl }`)

// Initialize Medusa client for server-side operations
const clientConfig = {
	baseUrl: backendUrl,
	maxRetries: 3
}

// Only add publishable key if it's set (optional for development)
if (publishableKey) {
	clientConfig.publishableApiKey = publishableKey
	logger.info('Using publishable API key')
} else {
	logger.warn('No publishable API key configured - this may limit access to some resources')
}

const medusaServerClient = new Medusa(clientConfig)

export { medusaServerClient }
