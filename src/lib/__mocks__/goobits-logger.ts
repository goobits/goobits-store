// Mock for @goobits/logger in tests
export const LogLevels = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3
}

export const LoggerConfig = {
	setGlobalPrefix: () => {},
	configure: () => {}
}

export function createLogger(_module: string) {
	return {
		error: () => {},
		warn: () => {},
		info: () => {},
		debug: () => {}
	}
}
