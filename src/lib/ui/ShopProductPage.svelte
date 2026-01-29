<script lang="ts">
	// This component contains the existing product detail functionality
	import { addToCart } from '@goobits/store'
	import { goto } from '$app/navigation'
	// @ts-ignore - OptimizedImage component from external package
	import OptimizedImage from '@components/OptimizedImage/OptimizedImage.svelte'
	import { Logger } from '@lib/utils/Logger'
	import { formatPrice } from '@goobits/store/utils/checkoutUtils'

	interface ProductImage {
		id?: string;
		url: string;
	}

	interface VariantOption {
		option_id: string;
		value: string;
	}

	interface ProductVariant extends MedusaVariant {
		options?: VariantOption[];
	}

	interface ProductOption extends MedusaOption {
		id: string;
		title: string;
	}

	interface Product extends MedusaProduct {
		variants?: ProductVariant[];
		options?: ProductOption[];
		images?: ProductImage[];
		metadata?: Record<string, unknown>;
	}

	interface SelectedOptions {
		[optionId: string]: string;
	}

	interface PageData {
		product?: Product;
		relatedProducts?: Product[];
		defaultRegion?: MedusaRegion;
		[key: string]: unknown;
	}

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props()

	const logger = new Logger('ProductDetail')

	// Extract product data
	const product: Product = $derived(data.product || {} as Product)
	const relatedProducts: Product[] = $derived(data.relatedProducts || [])
	const defaultRegion: MedusaRegion | undefined = $derived(data.defaultRegion)

	// State
	let quantity: number = $state(1)
	let addedToCart: boolean = $state(false)
	let userSelectedImage: ProductImage | null = $state(null) // User's manual image selection
	let selectedOptions: SelectedOptions = $state({}) // Stores { optionId: optionValue }
	let showOptionWarning: boolean = $state(false) // State for showing option selection warning

	// Reactive updates when product data changes
	const variants: ProductVariant[] = $derived(product.variants || [])
	const options: ProductOption[] = $derived(product.options || [])

	// Initialize selectedOptions based on options and variants (runs during SSR)
	const initialSelectedOptions: SelectedOptions = $derived.by(() => {
		const initialOptions: SelectedOptions = {}
		if (options && options.length > 0 && variants && variants.length > 0) {
			options.forEach((option: ProductOption) => {
				// Calculate available values for this option
				const availableValues = [ ...new Set(variants.map((v: ProductVariant) => v.options?.find((o: VariantOption) => o.option_id === option.id)?.value).filter(Boolean)) ] as string[]
				if (availableValues.length > 0) {
					initialOptions[option.id] = availableValues[0]
				}
			})
		}
		return initialOptions
	})

	// Calculate selected variant based on options (runs during SSR)
	const selectedVariant: ProductVariant | null = $derived.by(() => {
		// If no options and only one variant, select it by default
		if (options.length === 0 && variants.length === 1) {
			return variants[0]
		}

		// Use selectedOptions if user has made selections, otherwise use initial
		const optionsToUse = Object.keys(selectedOptions).length > 0 ? selectedOptions : initialSelectedOptions

		// Find variant matching all selected options
		if (options.length > 0 && Object.keys(optionsToUse).length === options.length) {
			return variants.find((variant: ProductVariant) => {
				return options.every((option: ProductOption) => {
					const variantOption = variant.options?.find((vo: VariantOption) => vo.option_id === option.id)
					return variantOption && variantOption.value === optionsToUse[option.id]
				})
			}) || null
		}

		return null
	})

	// Selected image (derived to ensure SSR consistency)
	// Uses user selection if available, otherwise defaults to first product image
	const selectedImage: ProductImage | null = $derived(
		userSelectedImage ||
		(product?.images?.length ? product.images[0] : null)
	)

	// Get price from variant
	function getVariantPrice(variant: ProductVariant | null, region: MedusaRegion | undefined = defaultRegion): number | null {
		if (!variant) return null

		// Try calculated_price first (if available from API)
		if (variant.calculated_price) {
			// Return the calculated_amount from the calculated_price object
			return variant.calculated_price.calculated_amount
		}

		// Fall back to prices array
		if (variant.prices && variant.prices.length > 0) {
			// Find price for current region/currency
			const regionPrice = region
				? variant.prices.find(p => p.currency_code === region.currency_code)
				: variant.prices[0]

			return regionPrice ? regionPrice.amount : variant.prices[0].amount
		}

		return null
	}

	// Handle image selection
	function selectImage(image: ProductImage): void {
		userSelectedImage = image
	}

	// Handle option selection
	function selectOption(optionId: string, value: string): void {
		// Create a new object to trigger reactivity
		selectedOptions = { ...selectedOptions, [optionId]: value }
	}

	// Handle add to cart
	function handleAddToCart(): void {
		// Check if a valid variant matching all selected options exists
		if (!selectedVariant) {
			showOptionWarning = true // Show warning if options are missing/invalid
			logger.warn('Add to cart blocked: Not all options selected or variant not found.')
			return // Stop execution
		}

		// If variant is valid, proceed
		showOptionWarning = false // Hide warning if it was previously shown

		// Construct cart item
		const variantPrice = getVariantPrice(selectedVariant)
		const cartItem: CartProduct = {
			id: product.id, // Use product ID for grouping in cart logic if needed
			name: product.title,
			handle: product.handle,
			variant_id: selectedVariant.id,
			price: variantPrice ? parseFloat(formatPrice(variantPrice)) : 0,
			image: product.thumbnail || (product.images && product.images.length > 0 ? product.images[0].url : ''),
			quantity: quantity
		}

		addToCart(cartItem)
		addedToCart = true

		setTimeout(() => {
			addedToCart = false
		}, 1500)
	}

	// Increment/decrement quantity
	function incrementQuantity(): void {
		quantity++
	}

	function decrementQuantity(): void {
		if (quantity > 1) {
			quantity--
		}
	}

	// Navigate back to products
	function goBack(): void {
		goto('/shop')
	}
</script>

<div class="goo__product-detail">
	<button class="goo__back-button" onclick={goBack}>← Back to Products</button>

	{#if !product || !product.title}
		<div class="goo__product-loading">
			Loading product...
		</div>
	{:else}
		<div class="goo__product-content">
			<!-- Left Side - Product Images -->
			<div class="goo__product-images">
				<div class="goo__product-main-image">
					{#if selectedImage && selectedImage.url}
						<OptimizedImage
							src={selectedImage.url}
							alt={product.title || "Product Image"}
							widths={[400, 800, 1200]}
							sizes="(max-width: 768px) 100vw, 50vw"
							class="main-product-image"
						/>
					{:else if product.thumbnail}
						<OptimizedImage
							src={product.thumbnail}
							alt={product.title || "Product Image"}
							widths={[400, 800, 1200]}
							sizes="(max-width: 768px) 100vw, 50vw"
							class="main-product-image"
						/>
					{:else}
						<div class="goo__product-placeholder">No image available</div>
					{/if}
				</div>

				{#if product.images && product.images.length > 1}
					<div class="goo__product-thumbnails">
						{#each product.images as image}
							{#if image && image.url}
								<div
									class="goo__product-thumbnail" class:active={selectedImage && selectedImage.id === image.id}
									onclick={() => selectImage(image)}
									onkeydown={(e) => e.key === 'Enter' && selectImage(image)}
									tabindex="0"
									role="button"
									aria-label="View image"
								>
									<img src={image.url} alt={product.title} />
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Right Side - Product Info -->
			<div class="goo__product-info">
				<h1>{product.title}</h1>

				{#if selectedVariant}
					<p class="goo__product-price">${formatPrice(getVariantPrice(selectedVariant) || 0)}</p>
				{:else if variants.length > 0 && variants[0].calculated_price}
					<p class="goo__product-price">From ${formatPrice(variants[0].calculated_price.calculated_amount)}</p>
				{/if}

				{#if product.description}
					<div class="goo__product-description">
						<p>{product.description}</p>
					</div>
				{/if}

				<!-- Variants Selection -->
				{#if options.length > 0}
					<div class="goo__product-variants">
						{#each options as option (option.id)}
							<!-- Calculate available values for this option *inside* the each block -->
							{@const availableValues = [ ...new Set(variants.map((v: ProductVariant) => v.options?.find((o: VariantOption) => o.option_id === option.id)?.value).filter(Boolean)) ] as string[]}
							{@const currentSelection = selectedOptions[option.id] || initialSelectedOptions[option.id]}
							<div class="goo__option-group">
								<h3>
									{option.title}
									{#if showOptionWarning && !currentSelection}
										<span class="goo__required-option-indicator">*</span>
									{/if}
								</h3>
								<div class="goo__variant-options">
									{#each availableValues as value (value)}
										<button
											class="goo__variant-button" class:active={currentSelection === value}
											onclick={() => selectOption(option.id, value)}
										>
											<!-- Add color swatch if it's a color option -->
											{#if option.title.toLowerCase() === 'color'}
												<span class="goo__color-swatch" style:background-color="{value.toLowerCase()}"></span>
											{/if}
											{value}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{:else if variants.length > 1}
					<!-- Fallback for products defined with variants but no options (less common) -->
					<div class="goo__product-variants">
						<h3>Select Option</h3>
						<div class="goo__variant-options">
							{#each variants as variant (variant.id)}
								<button
									class="goo__variant-button" class:active={selectedVariant?.id === variant.id}
									onclick={() => { selectedOptions = { _selectedVariantId: variant.id }; /* Store variant selection in options to trigger derived recalculation */ }}
								>
									{variant.title}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Quantity Selector -->
				<div class="goo__quantity-selector">
					<h3>Quantity</h3>
					<div class="goo__quantity-controls">
						<button onclick={decrementQuantity} aria-label="Decrease quantity">-</button>
						<span>{quantity}</span>
						<button onclick={incrementQuantity} aria-label="Increase quantity">+</button>
					</div>
				</div>

				<!-- Add to Cart Button -->
				<button
					class="goo__add-to-cart-button" class:added={addedToCart}
					onclick={handleAddToCart}
					aria-live="polite"
				>
					{addedToCart ? 'Added to Cart!' : 'Add to Cart'}
				</button>
				{#if showOptionWarning}
					<div class="goo__option-warning" role="alert">
						Please select all options.
					</div>
				{/if}

				<!-- Additional Product Details -->
				{#if product.metadata}
					<div class="goo__product-metadata">
						<h3>Details</h3>
						<ul>
							{#each Object.entries(product.metadata) as [ key, value ]}
								<li><strong>{key}:</strong> {value}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>

		<!-- Related Products -->
		{#if relatedProducts && relatedProducts.length > 0}
			<div class="goo__related-products">
				<h2>You May Also Like</h2>
				<div class="goo__related-products-grid">
					{#each relatedProducts as relatedProduct}
						{#if relatedProduct && relatedProduct.handle}
							<div class="goo__related-product">
								<a href="/shop/{relatedProduct.handle}">
									{#if relatedProduct.thumbnail}
										<OptimizedImage
											src={relatedProduct.thumbnail}
											alt={relatedProduct.title || 'Related Product'}
											widths={[200, 400, 600]}
											sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
											class="related-product-image"
										/>
									{:else if relatedProduct.images && relatedProduct.images.length > 0 && relatedProduct.images[0].url}
										<OptimizedImage
											src={relatedProduct.images[0].url}
											alt={relatedProduct.title || 'Related Product'}
											widths={[200, 400, 600]}
											sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
											class="related-product-image"
										/>
									{:else}
										<div class="goo__product-placeholder">No image</div>
									{/if}
									<h3>{relatedProduct.title || 'Product'}</h3>
									{#if relatedProduct.variants && relatedProduct.variants.length > 0 && relatedProduct.variants[0].calculated_price}
										<p>${formatPrice(relatedProduct.variants[0].calculated_price.calculated_amount)}</p>
									{/if}
								</a>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Import existing SCSS styles -->
<style lang="scss">
	@use './variables.scss' as *;
	@use './mixins.scss' as *;

	.goo__product-loading {
		text-align: center;
		padding: $spacing-xlarge;
		font-size: $font-size-large;
		color: $color-text-secondary;
	}

	.goo {
		&__product-detail {
			padding: $spacing-large;
			max-width: 1200px;
			margin: 0 auto;
			font-family: $font-family-base;
		}

		&__back-button {
			border: none;
			background: none;
			color: $color-primary;
			font-size: $font-size-medium;
			padding: $spacing-small 0;
			margin-bottom: $spacing-medium;
			cursor: pointer;
			transition: color 0.2s ease;

			&:hover {
				color: $color-primary-dark;
				text-decoration: underline;
			}
		}

		&__product-content {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: $spacing-xlarge;
			margin-bottom: $spacing-xlarge;

			@media (max-width: 768px) {
				grid-template-columns: 1fr;
			}
		}

		&__product-images {
			.goo__product-main-image {
				margin-bottom: $spacing-medium;
				border-radius: $border-radius-medium;
				overflow: hidden;
				position: relative;

				:global(.main-product-image) {
					width: 100%;
					height: auto;
					display: block;
				}
			}

			.goo__product-thumbnails {
				display: flex;
				gap: $spacing-small;
				flex-wrap: wrap;

				.goo__product-thumbnail {
					width: 80px;
					height: 80px;
					border-radius: $border-radius-small;
					overflow: hidden;
					cursor: pointer;
					border: 2px solid transparent;
					transition: border-color 0.2s ease;

					&.active {
						border-color: $color-primary;
					}

					img {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}

					&:hover {
						border-color: $color-primary-light;
					}
				}
			}
		}

		&__product-placeholder {
			background-color: $color-background-alt;
			height: 300px;
			display: flex;
			align-items: center;
			justify-content: center;
			color: $color-text-secondary;
			border-radius: $border-radius-medium;
		}

		&__product-info {
			h1 {
				font-size: $font-size-h1;
				color: $color-text-primary;
				margin-bottom: $spacing-medium;
			}

			.goo__product-price {
				font-size: $font-size-xlarge;
				color: $color-primary-dark;
				font-weight: bold;
				margin-bottom: $spacing-large;
			}

			.goo__product-description {
				margin-bottom: $spacing-large;

				p {
					color: $color-text-secondary;
					line-height: 1.6;
				}
			}
		}

		&__product-variants {
			margin-bottom: $spacing-large;

			h3 {
				font-size: $font-size-medium;
				margin-bottom: $spacing-small;
				color: $color-text-primary;
			}

			.goo__option-group {
				margin-bottom: $spacing-medium;

				&:last-child {
					margin-bottom: 0;
				}
			}

			.goo__variant-options {
				display: flex;
				flex-wrap: wrap;
				gap: $spacing-small;

				.goo__variant-button {
					padding: $spacing-small $spacing-medium;
					border: 1px solid $color-border;
					background-color: $color-background-light;
					border-radius: $border-radius-small;
					cursor: pointer;
					transition: all 0.2s ease;

					&.active {
						background-color: $color-primary;
						color: $white;
						border-color: $color-primary;
					}

					&:hover:not(.active) {
						border-color: $color-primary-light;
					}
				}
			}

			.goo__color-swatch {
				display: inline-block;
				width: 14px;
				height: 14px;
				border: 1px solid rgba(0, 0, 0, 0.2);
				margin-right: 6px;
				vertical-align: middle;
				border-radius: 3px;
			}

			.goo__required-option-indicator {
				color: $color-danger;
				margin-left: 4px;
				font-weight: bold;
			}
		}

		&__quantity-selector {
			margin-bottom: $spacing-large;

			h3 {
				font-size: $font-size-medium;
				margin-bottom: $spacing-small;
				color: $color-text-primary;
			}

			.goo__quantity-controls {
				display: flex;
				align-items: center;

				button {
					width: 40px;
					height: 40px;
					border: 1px solid $color-border;
					background-color: $color-background-light;
					font-size: $font-size-large;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;

					&:first-child {
						border-radius: $border-radius-small 0 0 $border-radius-small;
					}

					&:last-child {
						border-radius: 0 $border-radius-small $border-radius-small 0;
					}

					&:hover {
						background-color: $color-background-alt;
					}
				}

				span {
					width: 60px;
					height: 40px;
					border-top: 1px solid $color-border;
					border-bottom: 1px solid $color-border;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: $font-size-medium;
				}
			}
		}

		&__add-to-cart-button {
			background-color: $color-accent;
			color: $white;
			font-weight: bold;
			border: none;
			cursor: pointer;
			border-radius: 9999px;
			width: 100%;
			padding: $spacing-medium;
			margin-bottom: $spacing-large;
			font-size: $font-size-medium;
			min-width: 150px;
			text-align: center;
			transition: background-color 0.2s ease;

			&:hover {
				background-color: var(--color-primary-hover);
			}

			&.added {
				background-color: $color-success;
				animation: cart-bounce 0.5s ease;
			}

			&:disabled {
				background-color: $color-background-alt;
				border-color: $color-border;
				color: $color-text-secondary;
				cursor: not-allowed;
			}
		}

		&__option-warning {
			color: $color-danger;
			font-size: $font-size-small;
			margin-top: -$spacing-medium;
			margin-bottom: $spacing-large;
			text-align: center;
		}

		&__product-metadata {
			border-top: 1px solid $color-border;
			padding-top: $spacing-large;

			h3 {
				font-size: $font-size-medium;
				margin-bottom: $spacing-small;
				color: $color-text-primary;
			}

			ul {
				list-style: none;
				padding: 0;

				li {
					margin-bottom: $spacing-small;
					color: $color-text-secondary;

					strong {
						color: $color-text-primary;
						text-transform: capitalize;
					}
				}
			}
		}

		&__related-products {
			margin-top: $spacing-xlarge;
			border-top: 1px solid $color-border;
			padding-top: $spacing-large;

			h2 {
				font-size: $font-size-h2;
				color: $color-primary;
				margin-bottom: $spacing-large;
				text-align: center;
			}

			.goo__related-products-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
				gap: $spacing-large;
			}

			.goo__related-product {
				a {
					text-decoration: none;
					display: block;

					&:hover h3 {
						color: $color-primary;
					}
				}

				:global(.related-product-image) {
					width: 100%;
					height: 200px;
					object-fit: cover;
					border-radius: $border-radius-small;
					margin-bottom: $spacing-small;
				}

				h3 {
					font-size: $font-size-medium;
					color: $color-text-primary;
					margin-bottom: $spacing-small;
					transition: color 0.2s ease;
				}

				p {
					font-size: $font-size-small;
					color: $color-primary-dark;
					font-weight: bold;
				}

				.goo__product-placeholder {
					height: 200px;
					font-size: $font-size-small;
				}
			}
		}
	}
</style>
