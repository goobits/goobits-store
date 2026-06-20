/**
 * Logger utility for @goobits/store
 * Self-contained logger implementation with configurable levels
 */

/**
 * Logger interface with standard logging methods
 */
export interface Logger {
	error: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	debug: (...args: unknown[]) => void;
}

// Log levels
export const LogLevels = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3
} as const

// Global logger configuration
const globalConfig = {
	enabled: true,
	level: LogLevels.INFO as number,
	prefix: '@goobits/store'
}

const consoleSink = globalThis.console

/**
 * Logger configuration manager
 */
export const LoggerConfig = {
	/**
	 * Set the global prefix for all loggers
	 */
	setGlobalPrefix(prefix: string) {
		globalConfig.prefix = prefix
	},

	/**
	 * Configure the global logger settings
	 */
	configure(config: { enabled?: boolean; level?: number; prefix?: string }) {
		if (config.enabled !== undefined) {globalConfig.enabled = config.enabled}
		if (config.level !== undefined) {globalConfig.level = config.level}
		if (config.prefix !== undefined) {globalConfig.prefix = config.prefix}
	}
}

// Re-export configureLogger as alias
export const configureLogger = LoggerConfig.configure

/**
 * Create a logger instance for a specific module
 *
 * @param module - Module name
 * @returns Logger instance with error, warn, info, and debug methods
 */
export function createLogger(module: string): Logger {
	const prefix = `[${ globalConfig.prefix }:${ module }]`

	const shouldLog = (level: number) => globalConfig.enabled && level <= globalConfig.level

	const log = (level: number, method: string, message: unknown, ...args: unknown[]) => {
		if (!shouldLog(level)) {return}

		const timestamp = new Date().toISOString()
		const logMethod =
			(consoleSink[method as keyof Console] as ((...a: unknown[]) => void) | undefined) ||
			consoleSink.log
		logMethod(`${ timestamp } ${ prefix } ${ message }`, ...args)
	}

	return {
		error: (message, ...args) => log(LogLevels.ERROR, 'error', message, ...args),
		warn: (message, ...args) => log(LogLevels.WARN, 'warn', message, ...args),
		info: (message, ...args) => log(LogLevels.INFO, 'info', message, ...args),
		debug: (message, ...args) => log(LogLevels.DEBUG, 'debug', message, ...args)
	}
}
