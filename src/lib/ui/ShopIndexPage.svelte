<script lang="ts">
	import { addToCart, getCartCount } from '@goobits/store'
	import { goto } from '$app/navigation'
	import { formatPrice } from '@goobits/store/utils/checkoutUtils'

	interface PageData {
		products?: MedusaProduct[];
		[key: string]: unknown;
	}

	interface Props {
		data: PageData;
		hero?: HeroSection | null;
		features?: FeaturesSection | null;
		footer?: FooterSection | null;
		config?: ShopConfig;
	}

	const {
		data,
		hero = null,
		features = null,
		footer = null,
		config = {}
	}: Props = $props()

	const products: MedusaProduct[] = $derived(data.products || [])
	let addedProductId: string | null = $state(null)

	// Get fallback image from config or use generic placeholder
	const fallbackImage: string = $derived(config?.ui?.placeholders?.product ||
		'https://placehold.co/250x200/E5E5E5/999?text=Product')

	/**
	 * Calculates and formats the price for a product
	 */
	function getProductPrice(product: MedusaProduct): string {
		const firstVariant = product.variants?.[0]
		if (!firstVariant) return 'N/A'
		const calculatedPrice = firstVariant.calculated_price
		if (!calculatedPrice) return 'N/A'
		const price = calculatedPrice.calculated_amount || 0
		return formatPrice(price)
	}

	/**
	 * Gets the primary image URL for a product
	 */
	function getProductImage(product: MedusaProduct): string {
		if (product.thumbnail) return product.thumbnail
		const firstImage = product.images?.[0]
		if (firstImage) return firstImage.url
		return fallbackImage
	}

	/**
	 * Generates appropriate alt text for product images
	 */
	function getProductAlt(product: MedusaProduct): string {
		if (product.description) {
			return `${ product.title } - ${ product.description.slice(0, 60) }${ product.description.length > 60 ? '...' : '' }`
		}
		return `${ product.title } - ${ product.collection?.title || 'Product' }`
	}

	/**
	 * Handles adding a product to the cart
	 */
	function handleAddToCart(product: MedusaProduct, event: MouseEvent): void {
		if (event) event.stopPropagation()

		const firstVariant = product.variants?.[0]
		if (!firstVariant) return

		const cartProduct: CartProduct = {
			id: product.id,
			name: product.title,
			handle: product.handle,
			price: parseFloat(getProductPrice(product)),
			image: getProductImage(product),
			variant_id: firstVariant.id
		}

		addToCart(cartProduct)
		addedProductId = product.id
		setTimeout(() => {
			addedProductId = null
		}, 1000)
	}

	/**
	 * Checks if a product has multiple variants or options
	 */
	function hasOptions(product: MedusaProduct): boolean {
		return (product.options?.length ?? 0) > 0
	}

	/**
	 * Navigates to the checkout page
	 */
	function goToCheckout(): void {
		goto('/shop/cart')
	}
</script>

<!-- Hero Section -->
{#if hero}
	<section class="hero-section full-width">
		<div class="hero-content">
			{#if hero.badge}
				<div class="badge">{hero.badge}</div>
			{/if}
			{#if hero.title}
				<h1 class="hero-title">{hero.title}</h1>
			{/if}
			{#if hero.subtitle}
				<p class="hero-subtitle">{hero.subtitle}</p>
			{/if}
		</div>
	</section>
{/if}

<!-- Product Section -->
<section>
	<h2 class="section-title">{hero?.productsTitle || 'Our Products'}</h2>
	{#if hero?.productsDescription}
		<p class="section-description">{hero.productsDescription}</p>
	{/if}

	<div class="product-grid">
		{#if products.length === 0}
			<div class="empty-products">
				<p>No products found. Please check back later.</p>
			</div>
		{:else}
			{#each products as product (product.id)}
				<div class="product-card">
					<a href="/shop/{product.handle}" class="product-link">
						<div class="product-image-container">
							<img
								src={getProductImage(product)}
								alt={getProductAlt(product)}
								class="product-image"
								loading="lazy"
							/>
						</div>
						<div class="product-content">
							<h3 class="product-title">{product.title}</h3>
							<p class="product-price">${getProductPrice(product)}</p>
						</div>
					</a>
					<div class="product-actions">
						{#if hasOptions(product) || (product.variants?.length ?? 0) > 1}
							<a href="/shop/{product.handle}" class="btn btn-primary">View Options</a>
						{:else}
							<button
								class="btn btn-primary"
								class:added={addedProductId === product.id}
								onclick={(e) => handleAddToCart(product, e)}
							>
								{addedProductId === product.id ? 'Added!' : 'Add to Cart'}
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</section>

<!-- Checkout Section -->
<section class="checkout-section">
	<button class="checkout-button" onclick={goToCheckout}>
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon">
			<circle cx="8" cy="21" r="1"></circle>
			<circle cx="19" cy="21" r="1"></circle>
			<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
		</svg>
		Checkout Securely ({getCartCount()} items)
	</button>
</section>

<!-- Feature Highlight -->
{#if features}
	<section class="feature-highlight full-width">
		<div class="feature-content">
			{#if features.title}
				<h2>{features.title}</h2>
			{/if}
			{#if features.description}
				<p>{features.description}</p>
			{/if}
			{#if features.links && features.links.length > 0}
				<div class="services-container">
					{#each features.links as linkGroup}
						<div class="services">
							{#if linkGroup.title}
								<h3>{linkGroup.title}</h3>
							{/if}
							{#if linkGroup.items && linkGroup.items.length > 0}
								<ul>
									{#each linkGroup.items as link}
										<li><a href={link.url ?? link.href}>{link.label ?? link.text}</a></li>
									{/each}
								</ul>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}

<!-- Contact CTA -->
{#if footer}
	<section class="contact-cta">
		<div class="contact-content">
			{#if footer.title}
				<h2>{footer.title}</h2>
			{/if}
			{#if footer.subtitle}
				<p>{footer.subtitle}</p>
			{/if}
			{#if footer.contact}
				<div class="contact-links">
					{#if footer.contact.email}
						<a href="mailto:{footer.contact.email}" class="contact-link">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
								<polyline points="22,6 12,13 2,6"></polyline>
							</svg>
							{footer.contact.email}
						</a>
					{/if}
					{#if footer.contact.phone}
						<a href="tel:{footer.contact.phone}" class="contact-link">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
							</svg>
							{footer.contact.phoneDisplay || footer.contact.phone}
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</section>
{/if}

<style>
	/* Modern shop page using theme-aware design tokens */

	/* Hero Section */
	.hero-section {
		background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
		padding: 4rem 1rem;
		margin-bottom: 4rem;
		box-shadow: var(--shadow-md);
	}

	.hero-content {
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
	}

	.hero-title {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.025em;
	}

	@media (min-width: 768px) {
		.hero-title {
			font-size: 3.75rem;
		}
	}

	.hero-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	/* Product Grid */
	.product-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		margin-bottom: 4rem;
	}

	@media (min-width: 640px) {
		.product-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.product-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.product-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.product-card {
		background: var(--bg-card);
		border-radius: 1rem;
		box-shadow: var(--shadow-sm);
		overflow: hidden;
		transition: all 0.3s ease;
		border: 1px solid var(--color-border);
	}

	.product-card:hover {
		transform: translateY(-8px);
		box-shadow: var(--shadow-lg);
	}

	.product-image-container {
		width: 100%;
		height: 260px;
		overflow: hidden;
		background-color: var(--color-background-alt);
		position: relative;
	}

	.product-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.product-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.product-content {
		padding: 1.5rem 1.5rem 0.75rem;
	}

	.product-actions {
		padding: 0 1.5rem 1.5rem;
		display: flex;
		gap: 1rem;
	}

	.product-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.product-price {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--accent-primary);
		margin-bottom: 1rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.3s ease;
		border: none;
		cursor: pointer;
		flex: 1;
		text-align: center;
		min-width: 100px;
	}

	.btn-primary {
		background-color: var(--success);
		color: var(--white);
	}

	/* Dark mode: use dark text on light green buttons */
	:global(html.theme-dark) .btn-primary,
	:global(html.theme-system-dark) .btn-primary {
		color: var(--black);
	}

	.btn-primary:hover {
		background-color: var(--color-success-dark);
	}

	.btn-primary.added {
		animation: cart-bounce 0.5s ease;
	}

	/* Checkout Section */
	.checkout-section {
		text-align: center;
		margin-top: 3rem;
		margin-bottom: 3rem;
	}

	.checkout-button {
		background-color: var(--success);
		color: var(--white);
		padding: 1rem 2.5rem;
		border-radius: 0.75rem;
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		transition: all 0.3s ease;
		box-shadow: var(--shadow-md);
	}

	/* Dark mode: use dark text on light green buttons */
	:global(html.theme-dark) .checkout-button,
	:global(html.theme-system-dark) .checkout-button {
		color: var(--black);
	}

	.checkout-button:hover {
		background-color: var(--color-success-dark);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.icon {
		stroke-width: 2;
		stroke: currentColor;
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	section {
		margin-bottom: 4rem;
	}

	.section-title {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.section-description {
		max-width: 800px;
		margin: 0 auto 2rem;
		text-align: center;
		color: var(--text-secondary);
	}

	.feature-highlight {
		background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
		padding: 3rem 2rem;
		margin-top: 2rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	.feature-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.feature-highlight h2 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.services-container {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4rem;
		margin-top: 2rem;
	}

	.services {
		text-align: left;
	}

	.services h3 {
		font-size: 1.25rem;
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.services ul {
		list-style: none;
		padding: 0;
	}

	.services li {
		margin-bottom: 0.5rem;
	}

	.services a {
		color: var(--color-link);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.services a:hover {
		color: var(--color-link-hover);
		text-decoration: underline;
	}

	.contact-cta {
		text-align: center;
		padding: 3rem 2rem;
		background-color: var(--bg-secondary);
		border-radius: 1rem;
		margin-bottom: 4rem;
	}

	.contact-content {
		max-width: 600px;
		margin: 0 auto;
	}

	.contact-content h2 {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--accent-primary);
		margin-bottom: 0.5rem;
	}

	.contact-content p {
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}

	.contact-links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
	}

	.contact-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-link);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.contact-link:hover {
		color: var(--color-link-hover);
	}

	.badge {
		display: inline-block;
		background-color: var(--accent-primary);
		color: var(--white);
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	/* Dark mode: use dark text on light amber badge */
	:global(html.theme-dark) .badge,
	:global(html.theme-system-dark) .badge {
		color: var(--black);
	}

	.empty-products {
		grid-column: 1 / -1;
		text-align: center;
		padding: 2rem;
		background: var(--bg-card);
		border-radius: 1rem;
		border: 1px solid var(--color-border);
	}

	.full-width {
		width: 100vw;
		position: relative;
		left: calc(-50vw + 50%);
		box-sizing: border-box;
	}

	.hero-section.full-width {
		margin-top: 0;
		padding-top: 4rem;
		padding-bottom: 4rem;
		margin-bottom: 4rem;
	}

	.feature-highlight.full-width {
		margin-top: 3rem;
		margin-bottom: 2rem;
		padding-top: 4rem;
		padding-bottom: 4rem;
	}

	@media (max-width: 768px) {
		.full-width {
			left: -1rem;
			width: calc(100% + 2rem);
		}

		.services-container {
			flex-direction: column;
			gap: 2rem;
			align-items: center;
		}

		.contact-links {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
