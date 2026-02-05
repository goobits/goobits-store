// Mock for @goobits/logger in tests
const noop = (): void => { /* no-op for testing */ }

export const LogLevels = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3
}

export const LoggerConfig = {
	setGlobalPrefix: noop,
	configure: noop
}

export function createLogger(_module: string) {
	return {
		error: noop,
		warn: noop,
		info: noop,
		debug: noop
	}
}
