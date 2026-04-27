import Medusa from '@medusajs/medusa-js'
import { createLogger } from './logger.js'
import { getBackendUrl, getPublishableKey } from '../config/urls.js'

const logger = createLogger('MedusaServer')

/**
 * Medusa client configuration
 */
interface MedusaClientConfig {
	baseUrl: string;
	maxRetries: number;
	publishableApiKey?: string;
}

const backendUrl: string = getBackendUrl()
const publishableKey: string | undefined = getPublishableKey() || undefined
const requestTimeoutMs = Number(
	process.env.MEDUSA_REQUEST_TIMEOUT_MS
	|| (process.env.NODE_ENV === 'development' ? 1200 : 4000)
)
const maxRetries = Number(
	process.env.MEDUSA_MAX_RETRIES
	|| (process.env.NODE_ENV === 'development' ? 0 : 1)
)

// Validate backend URL
if (!backendUrl) {
	throw new Error('Missing Medusa backend URL. Set PUBLIC_MEDUSA_BACKEND_URL in .env')
}

logger.info(`Connecting to Medusa at: ${backendUrl} (timeout=${requestTimeoutMs}ms, retries=${maxRetries})`)

// Initialize Medusa client for server-side operations
const clientConfig: MedusaClientConfig = {
	baseUrl: backendUrl,
	maxRetries
}

// Only add publishable key if it's set (optional for development)
if (publishableKey) {
	clientConfig.publishableApiKey = publishableKey
	logger.info('Using publishable API key')
} else {
	logger.warn('No publishable API key configured - this may limit access to some resources')
}

const medusaServerClient = new Medusa(clientConfig)

function withMedusaTimeout<T>(operation: string, promise: Promise<T>): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined

	const timeoutPromise = new Promise<T>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`Medusa request timed out after ${ requestTimeoutMs }ms during ${ operation }`))
		}, requestTimeoutMs)
	})

	return Promise.race([
		promise.finally(() => {
			if (timeoutId) {
				clearTimeout(timeoutId)
			}
		}),
		timeoutPromise
	])
}

const proxyCache = new WeakMap<object, object>()

function wrapMedusaClient<T extends object>(target: T, path: string[] = []): T {
	const cached = proxyCache.get(target)
	if (cached) {
		return cached as T
	}

	const proxy = new Proxy(target, {
		get(currentTarget, property, receiver) {
			const value = Reflect.get(currentTarget, property, receiver)

			if (typeof value === 'function') {
				const operation = [ ...path, String(property) ].join('.')

				return (...args: unknown[]) => {
					const result = value.apply(currentTarget, args)
					if (!result || typeof (result as PromiseLike<unknown>).then !== 'function') {
						return result
					}

					return withMedusaTimeout(operation, result as Promise<unknown>)
				}
			}

			if (value && typeof value === 'object') {
				return wrapMedusaClient(value as object, [ ...path, String(property) ])
			}

			return value
		}
	})

	proxyCache.set(target, proxy)
	return proxy as T
}

export { backendUrl as medusaBackendUrl, requestTimeoutMs as medusaRequestTimeoutMs }
export const medusaServerClientWithTimeouts = wrapMedusaClient(medusaServerClient)
export { medusaServerClientWithTimeouts as medusaServerClient }
