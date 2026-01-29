/**
 * Client-side load utilities for store routes
 * Used for client-side navigation and data fetching
 */

// Client load options (for future extensibility)
interface ClientLoadOptions {
	// Reserved for future options
}

// Server data passed to client load
interface ServerData {
	pageType?: string
	[key: string]: unknown
}

// Client load result
interface ClientLoadResult extends ServerData {
	slug: string
	searchParams: Record<string, string>
}

// Load event type - use generic to avoid params constraint issues
interface ShopLoadEvent {
	params: { slug?: string; [key: string]: string | undefined }
	url: URL
	data: ServerData
}

/**
 * Creates a client-side load function for shop pages
 */
export function createShopClientLoad(_options: ClientLoadOptions = {}): (event: ShopLoadEvent) => ClientLoadResult {
	return ({ params, url, data }: ShopLoadEvent): ClientLoadResult =>
		// For client-side navigation, we can add any additional
		// client-specific logic here if needed
		// IMPORTANT: Merge with server data, don't override it
		 ({
			...data, // Preserve server data (pageType, etc)
			slug: params.slug || '',
			searchParams: Object.fromEntries(url.searchParams.entries())
		})

}
