/**
 * Utility functions for slug generation and manipulation
 * Used by dynamic routes to convert file paths to URL slugs
 */

/**
 * Generates a kebab-case slug from a file path segment.
 * Handles PascalCase, camelCase, and spaces.
 * Example: 'AboutUs' -> 'about-us', 'Privacy Policy' -> 'privacy-policy'
 * @param part - The path segment.
 * @returns The kebab-case slug segment.
 */
export function generateKebabCasePart(part: string): string {
	// Add hyphen before capital letter preceded by lowercase or number
	let kebabPart = part.replace(/([a-z\d])([A-Z])/g, '$1-$2')
	// Add hyphen between consecutive capitals followed by lowercase (e.g. FAQPage -> FAQ-Page)
	kebabPart = kebabPart.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
	// Replace spaces with hyphens and convert to lowercase
	return kebabPart.replace(/\s+/g, '-').toLowerCase()
}

/**
 * Generates a URL-friendly slug from a relative markdown file path.
 * @param relativePath - e.g., 'AboutUs' or 'Legal/Privacy Policy'
 * @returns - e.g., 'about-us' or 'legal/privacy-policy'
 */
export function generateSlugFromPath(relativePath: string): string {
	return relativePath
		.split('/')
		.map(generateKebabCasePart)
		.join('/')
}

/**
 * Cleans a content file path by removing common prefixes and extensions
 * @param path - Original path from import.meta.glob
 * @returns Cleaned relative path without prefixes or extensions
 */
export function cleanContentPath(path: string): string {
	return path
		.replace(/^\/src\/content\//, '') // Remove /src/content/ prefix
		.replace(/^@content\//, '')       // Remove @content/ prefix
		.replace(/^src\/content\//, '')   // Remove src/content/ prefix
		.replace('.md', '')               // Remove .md extension
}
