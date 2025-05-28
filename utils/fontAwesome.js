/**
 * Font Awesome loader utility for shop components
 * Dynamically loads Font Awesome CSS from CDN
 */

/**
 * Load Font Awesome CSS from CDN if not already loaded
 * @param {Object} options - Configuration options
 * @param {string} options.version - Font Awesome version (default: 6.5.1)
 * @param {string} options.integrity - SRI hash for security
 * @param {string} options.id - Element ID to prevent duplicate loading
 */
export function loadFontAwesome(options = {}) {
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