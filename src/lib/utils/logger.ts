/**
 * Logger utility for @goobits/store
 * Re-exports from @goobits/logger with @goobits/store defaults
 */

import { createLogger as createBaseLogger, LogLevels, LoggerConfig } from '@goobits/logger'

/**
 * Logger interface with standard logging methods
 */
export interface Logger {
	error: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	debug: (...args: unknown[]) => void;
}

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
 * @param module - Module name
 * @returns Logger instance with error, warn, info, and debug methods
 */
export function createLogger(module: string): Logger {
	return createBaseLogger(module)
}
