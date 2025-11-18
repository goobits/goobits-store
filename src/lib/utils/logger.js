/**
 * Logger utility for @goobits/store
 * Re-exports from @goobits/logger with @goobits/store defaults
 */

import { createLogger as createBaseLogger, LogLevels, LoggerConfig } from '@goobits/logger'

// Set default prefix for @goobits/store
LoggerConfig.setGlobalPrefix('@goobits/store')

// Re-export everything from @goobits/logger
export { LogLevels, LoggerConfig }

// Re-export configureLogger as alias
export const configureLogger = LoggerConfig.configure

/**
 * Create a logger instance for a specific module
 * Wrapper around @goobits/logger's createLogger with store defaults
 *
 * @param {string} module - Module name
 * @returns {Object} Logger instance with error, warn, info, and debug methods
 */
export function createLogger(module) {
	return createBaseLogger(module)
}