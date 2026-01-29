/**
 * Font Awesome loader utility for shop components
 * Dynamically loads Font Awesome CSS from CDN
 */

/**
 * Font Awesome loader options
 */
interface FontAwesomeOptions {
	version?: string;
	integrity?: string;
	id?: string;
}

/**
 * Load Font Awesome CSS from CDN if not already loaded
 * @param options - Configuration options
 */
export function loadFontAwesome(options: FontAwesomeOptions = {}): void {
	const {
		version = '6.5.1',
		integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==',
		id = 'fontawesome-css'
	} = options

	// Check if Font Awesome is already loaded
	if (!document.getElementById(id)) {
		const link = document.createElement('link')
		link.id = id
		link.rel = 'stylesheet'
		link.href = `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${version}/css/all.min.css`
		link.integrity = integrity
		link.crossOrigin = 'anonymous'
		link.referrerPolicy = 'no-referrer'
		document.head.appendChild(link)
	}
}
