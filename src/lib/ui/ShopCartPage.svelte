<script>
	// We'll import the existing cart page content and eventually refactor
	// For now, this is a wrapper around the existing cart functionality
	import { cart, updateQuantity, removeFromCart } from '@goobits/store'
	import { goto } from '$app/navigation'
	import { medusaClient } from '@goobits/store'
	import { browser } from '$app/environment'
	import { Logger } from '@lib/utils/Logger.js'

	const { data, config = {} } = $props()

	// Get placeholder image from config or use generic fallback
	const fallbackImage = $derived(config?.ui?.placeholders?.product ||
		'https://placehold.co/100x100/E5E5E5/999?text=Product')

	const logger = new Logger('ShopCart')

	// Extract region data from server
	const defaultRegion = $derived(data?.defaultRegion)
	
	// Utility function to get product ID consistently
	function getProductId(product) {
		return product.variant_id || product.id
	}

	let isSubmitting = $state(false)
	let errorMessage = $state('')

	// Derived state for subtotal - automatically updates when cart changes
	// Note: Cart prices are stored as actual dollar amounts, not cents
	const subtotal = $derived(
		!$cart || $cart.length === 0 ? 0 :
		$cart.reduce((total, item) => {
			const price = typeof item.price === 'number' ? item.price : 0
			const quantity = typeof item.quantity === 'number' ? item.quantity : 0
			return total + (price * quantity)
		}, 0)
	)

	// Helper function to format prices for display
	function formatCartPrice(price) {
		// Cart stores prices as dollars already, not cents
		// Just format to 2 decimal places
		return typeof price === 'number' ? price.toFixed(2) : '0.00'
	}
	
	// Derived state for cleaner template logic
	const hasItems = $derived($cart && $cart.length > 0)
	
	function handleQuantityChange(product, newQuantity) {
		if (newQuantity < 1) newQuantity = 1
		updateQuantity(getProductId(product), newQuantity)
	}

	function handleRemoveItem(product) {
		removeFromCart(getProductId(product))
	}

	function handleContinueShopping() {
		goto('/shop')
	}

	// Helper function to generate a slug from a product name
	function getProductHandle(item) {
		return item.name
			.toLowerCase()
			.replace(/[^\w\s]/g, '') // Remove special chars
			.replace(/\s+/g, '-') // Replace spaces with hyphens
	}

	async function handleCheckout() {
		if ($cart.length === 0) {
			errorMessage = 'My cart is empty'
			return
		}

		try {
			isSubmitting = true
			errorMessage = ''

			// Create a cart in Medusa (only client-side)
			if (!browser) {
				logger.error('Cart creation is only supported on the client side')
				errorMessage = 'Unable to create cart'
				isSubmitting = false
				return
			}

			try {
			// Create a cart in Medusa with region
			const cartParams = {}
			if (defaultRegion?.id) {
				cartParams.region_id = defaultRegion.id
			}
			logger.info("Creating cart with params:", cartParams)
			const { cart: medusaCart } = await medusaClient.carts.create(cartParams)

				// Add line items to the cart
				const itemsToAdd = $cart.map(item => {
					return {
						variant_id: item.variant_id,
						quantity: item.quantity
					}
				})

				// Track failed items
				const failedItems = []

				for (const item of itemsToAdd) {
					logger.info('Adding line item:', { variant_id: item.variant_id, quantity: item.quantity })
					try {
						await medusaClient.carts.lineItems.create(medusaCart.id, {
							variant_id: item.variant_id,
							quantity: item.quantity
						})
					} catch (lineItemError) {
						logger.error('Failed to add line item:', lineItemError)
						logger.error('Error response:', lineItemError.response?.data)

						// Check if it's a variant not found error
						const errorMsg = lineItemError.response?.data?.message || ''
						if (errorMsg.includes('do not exist') || errorMsg.includes('not published')) {
							logger.warn('Variant no longer exists or is unpublished, skipping:', item.variant_id)
							failedItems.push(item)
							// Continue with other items instead of throwing
							continue
						}

						// For other errors, throw to stop the process
						throw lineItemError
					}
				}

				// Remove failed items from local cart
				if (failedItems.length > 0) {
					logger.info('Removing invalid items from cart:', failedItems.length)
					for (const failedItem of failedItems) {
						const cartItems = $cart.filter(item => item.variant_id !== failedItem.variant_id)
						cart.set(cartItems)
					}

					// Show warning to user
					const itemWord = failedItems.length === 1 ? 'item' : 'items'
					errorMessage = `${failedItems.length} ${itemWord} in your cart are no longer available and have been removed.`
				}

				// Only redirect if we have items in the cart
				if ($cart.length > 0 || itemsToAdd.length > failedItems.length) {
					// Redirect to the checkout page with the cart ID
					goto(`/shop/checkout?cart_id=${ medusaCart.id }`)
				} else {
					// All items were invalid, stay on cart page
					errorMessage = 'All items in your cart are no longer available. Please add new items to continue.'
					isSubmitting = false
					return
				}
			} catch (apiError) {
				logger.error('API Error:', apiError)

				// Check for CORS error
				if (apiError.message && apiError.message.includes('NetworkError') ||
					apiError.message && apiError.message.includes('Failed to fetch')) {
					errorMessage = 'Connection to checkout server failed. The server may need to be configured for CORS. Please restart the Medusa server.'
				} else {
					errorMessage = 'Something went wrong connecting to checkout. Please try again.'
				}
			}
		} catch (error) {
			logger.error('Error creating checkout:', error)
			errorMessage = 'Something went wrong. Please try again.'
		} finally {
			isSubmitting = false
		}
	}
</script>

<section class="goo__shop-page">
	<div class="goo__container">
		{#if !hasItems}
			<div class="goo__empty-cart">
				<p>Your cart is empty.</p>
				<button onclick={handleContinueShopping} class="btn btn-primary">
					<i class="fas fa-arrow-left"></i> Continue Shopping
				</button>
			</div>
		{:else}
			<div class="goo__cart-table">
				<div class="goo__cart-header">
					<span class="goo__cart-header-product">Product</span>
					<span class="goo__cart-header-price">Price</span>
					<span class="goo__cart-header-quantity">Quantity</span>
					<span class="goo__cart-header-total">Total</span>
					<span class="goo__cart-header-actions"></span>
				</div>

				{#each $cart as item (getProductId(item))}
					<div class="goo__cart-item">
						<div class="goo__cart-item-product">
							<a href="/shop/{item.handle || getProductHandle(item)}" class="goo__cart-item-image-link">
								<img
									src={item.image || fallbackImage}
									alt={item.name}
									class="goo__cart-item-image"
								/>
							</a>
							<div class="goo__cart-item-details">
								<a href="/shop/{item.handle || getProductHandle(item)}" class="goo__cart-item-name">{item.name}</a>
								{#if item.options && item.options.length > 0 && item.options.some(opt => opt.title && (opt.title.toLowerCase() === 'color' || opt.title.toLowerCase() === 'size'))}
									{#each item.options as option}
										{#if option.title && option.value}
											{#if option.title.toLowerCase() === 'color'}
												<div class="goo__cart-item-option">
													{option.title}:
													<span class="goo__color-swatch" style:background-color="{option.value.toLowerCase()}"></span>
													{option.value}
												</div>
											{:else if option.title.toLowerCase() === 'size'}
												<div class="goo__cart-item-option">
													{option.title}: {option.value}
												</div>
											{/if}
										{/if}
									{/each}
								{:else if item.variant_title && item.variant_title.includes(' / ')}
									{@const parts = item.variant_title.split(' / ')}
									{#if parts.length === 2}
										<div class="goo__cart-item-option">
											Size: {parts[0]}
										</div>
										<div class="goo__cart-item-option">
											Color:
											<span class="goo__color-swatch" style:background-color="{parts[1].toLowerCase()}"></span>
											{parts[1]}
										</div>
									{:else}
										<div class="goo__cart-item-variant">{item.variant_title}</div>
									{/if}
								{:else if item.variant_title && item.variant_title !== ''}
									<div class="goo__cart-item-variant">{item.variant_title}</div>
								{/if}
							</div>
						</div>
						<div class="goo__cart-item-price">
							${formatCartPrice(item.price)}</div>
						<div class="goo__cart-item-quantity">
							<button
								class="goo__quantity-btn"
								onclick={() => handleQuantityChange(item, item.quantity - 1)}
								aria-label="Decrease quantity"
							>
								<i class="fas fa-minus"></i>
							</button>
							<span class="goo__quantity-value">{item.quantity}</span>
							<button
								class="goo__quantity-btn"
								onclick={() => handleQuantityChange(item, item.quantity + 1)}
								aria-label="Increase quantity"
							>
								<i class="fas fa-plus"></i>
							</button>
						</div>
						<div class="goo__cart-item-total">
							${formatCartPrice(
							(typeof item.price === 'number' ? item.price : 0) *
							(typeof item.quantity === 'number' ? item.quantity : 1)
						)}
						</div>
						<div class="goo__cart-item-actions">
							<button
								class="goo__remove-btn"
								onclick={() => handleRemoveItem(item)}
								aria-label="Remove item"
							>
								<i class="fas fa-times"></i>
							</button>
						</div>
					</div>
				{/each}
			</div>

			<div class="goo__cart-footer">
				<div class="goo__cart-subtotal">
					<span>Subtotal</span>
					<span>${formatCartPrice(subtotal)}</span>
				</div>
				<div class="goo__cart-actions">
					<button onclick={handleContinueShopping} class="btn btn-secondary">
						<i class="fas fa-arrow-left"></i> Continue Shopping
					</button>
					<button
						onclick={handleCheckout}
						class="btn btn-primary"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Processing...' : 'Proceed to Checkout'} <i class="fas fa-arrow-right"></i>
					</button>
				</div>
				{#if errorMessage}
					<div class="goo__cart-error">{errorMessage}</div>
				{/if}
			</div>
		{/if}
	</div>
</section>

<!-- Import the existing cart styles -->
<style>
	.goo__shop-page {
		flex: 1;
		color: var(--text-primary);
		line-height: 1.5;
		margin-top: 2rem;
		padding-top: 1rem;
		font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	.goo__container {
		max-width: 1280px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.goo__empty-cart {
		text-align: center;
		padding: 3rem;
		background-color: var(--color-surface);
		border-radius: 1rem;
		box-shadow: var(--shadow-md);
	}

	.goo__cart-table {
		background-color: var(--color-surface);
		border-radius: 1rem;
		box-shadow: var(--shadow-md);
		overflow: hidden;
		margin-bottom: 3rem;
	}

	.goo__cart-header {
		display: grid;
		grid-template-columns: 3fr 1fr 1.5fr 1fr 0.5fr;
		padding: 1.5rem;
		background-color: var(--bg-secondary);
		font-weight: 600;
		color: var(--text-primary);
		border-bottom: 1px solid var(--color-border);
	}

	.goo__cart-item {
		display: grid;
		grid-template-columns: 3fr 1fr 1.5fr 1fr 0.5fr;
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border);
		align-items: center;
	}

	.goo__cart-item:last-child {
		border-bottom: none;
	}

	.goo__cart-item-product {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.goo__cart-item-image-link {
		display: block;
		border-radius: 0.5rem;
		overflow: hidden;
		transition: transform 0.2s;
	}

	.goo__cart-item-image-link:hover {
		transform: scale(1.05);
	}

	.goo__cart-item-image {
		width: 80px;
		height: 80px;
		object-fit: cover;
		display: block;
	}

	.goo__cart-item-details {
		display: flex;
		flex-direction: column;
	}

	.goo__cart-item-name {
		font-weight: 600;
		color: var(--accent-primary);
		text-decoration: none;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}

	.goo__cart-item-name:hover {
		text-decoration: underline;
	}

	.goo__cart-item-option, .goo__cart-item-variant {
		font-size: 0.875rem;
		color: var(--text-secondary);
		background-color: var(--bg-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		display: inline-block;
		margin-top: 0.25rem;
	}

	.goo__color-swatch {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 1px solid var(--color-border);
		border-radius: 2px;
		margin-right: 5px;
		vertical-align: middle;
	}

	.goo__cart-item-price {
		font-weight: 500;
		color: var(--text-primary);
	}

	.goo__cart-item-quantity {
		display: flex;
		align-items: center;
	}

	.goo__quantity-btn {
		width: 32px;
		height: 32px;
		border: 1px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.goo__quantity-btn:first-child {
		border-radius: 0.375rem 0 0 0.375rem;
	}

	.goo__quantity-btn:last-child {
		border-radius: 0 0.375rem 0.375rem 0;
	}

	.goo__quantity-btn:hover {
		background-color: var(--bg-secondary);
	}

	.goo__quantity-value {
		width: 40px;
		height: 32px;
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 500;
	}

	.goo__cart-item-total {
		font-weight: 700;
		color: var(--accent-primary);
	}

	.goo__remove-btn {
		width: 32px;
		height: 32px;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background-color: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--error-text);
		font-size: 0.875rem;
	}

	.goo__remove-btn:hover {
		background-color: var(--error-bg);
		color: var(--error-text);
		border-color: var(--error-text);
	}

	.goo__cart-footer {
		margin-top: 2rem;
	}

	.goo__cart-subtotal {
		background-color: var(--color-surface);
		border-radius: 0.75rem;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		font-size: 1.25rem;
		margin-bottom: 2rem;
		box-shadow: var(--shadow-md);
	}

	.goo__cart-subtotal span:first-child {
		font-weight: 600;
		color: var(--text-primary);
	}

	.goo__cart-subtotal span:last-child {
		font-weight: 700;
		color: var(--accent-primary);
	}

	.goo__cart-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.btn-primary {
		background-color: var(--accent-primary);
		color: var(--color-text-on-primary);
	}

	.btn-primary:hover {
		background-color: var(--accent-light);
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-secondary {
		background-color: var(--color-surface);
		color: var(--text-primary);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		background-color: var(--bg-secondary);
		border-color: var(--color-border);
	}

	.goo__cart-error {
		margin-top: 1rem;
		padding: 1rem;
		background-color: var(--error-bg);
		color: var(--error-text);
		border-radius: 0.5rem;
		text-align: center;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.goo__cart-header {
			display: none;
		}

		.goo__cart-item {
			grid-template-columns: 1fr;
			grid-template-areas:
				"product"
				"price"
				"quantity"
				"total"
				"actions";
			gap: 1rem;
			padding: 1.5rem;
		}

		.goo__cart-item-product {
			grid-area: product;
		}

		.goo__cart-item-price {
			grid-area: price;
		}

		.goo__cart-item-price:before {
			content: 'Price: ';
			font-weight: 600;
		}

		.goo__cart-item-quantity {
			grid-area: quantity;
			justify-content: flex-start;
		}

		.goo__cart-item-quantity:before {
			content: 'Quantity: ';
			font-weight: 600;
			margin-right: 0.5rem;
		}

		.goo__cart-item-total {
			grid-area: total;
		}

		.goo__cart-item-total:before {
			content: 'Total: ';
			font-weight: 600;
		}

		.goo__cart-item-actions {
			grid-area: actions;
		}

		.goo__cart-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}
	}
</style>