<script>
	import { addToCart, getCartCount } from '@goobits/store'
	import { goto } from '$app/navigation'

	/**
	 * @typedef {Object} Props
	 * @property {Object} data - Route data containing products and other shop data
	 */

	/** @type {Props} */
	let { data } = $props()

	let products = $derived(data.products || [])
	let addedProductId = $state(null)

	const fallbackImage = 'https://placehold.co/250x200/FFF3E0/A1887F?text=Honey+Product'

	/**
	 * Calculates and formats the price for a product
	 * @param {Object} product - The product object
	 * @returns {string} Formatted price string or 'N/A' if no variants
	 */
	function getProductPrice(product) {
		if (!product.variants?.length) return 'N/A'
		// Get calculated_amount from the calculated_price object
		const calculatedPrice = product.variants[0].calculated_price
		if (!calculatedPrice) return 'N/A'
		const price = calculatedPrice.calculated_amount || 0
		// Don't divide by 100 - Medusa v2 stores amounts as actual currency values, not cents
		return parseFloat(price).toFixed(2)
	}

	/**
	 * Gets the primary image URL for a product
	 * @param {Object} product - The product object
	 * @returns {string} URL of the product image or fallback
	 */
	function getProductImage(product) {
		if (product.thumbnail) return product.thumbnail
		if (product.images?.length) return product.images[0].url
		return fallbackImage
	}

	/**
	 * Generates appropriate alt text for product images
	 * @param {Object} product - The product object
	 * @returns {string} Alt text for the product image
	 */
	function getProductAlt(product) {
		if (product.description) {
			return `${ product.title } - ${ product.description.slice(0, 60) }${ product.description.length > 60 ? '...' : '' }`
		}
		return `${ product.title } - ${ product.collection?.title || 'Honey product' }`
	}

	/**
	 * Handles adding a product to the cart
	 * @param {Object} product - The product to add
	 * @param {Event} event - Click event
	 */
	function handleAddToCart(product, event) {
		if (event) event.stopPropagation()

		const cartProduct = {
			id: product.id,
			name: product.title,
			handle: product.handle,
			price: parseFloat(getProductPrice(product)),
			image: getProductImage(product),
			variant_id: product.variants[0].id
		}

		addToCart(cartProduct)
		addedProductId = product.id
		setTimeout(() => {
			addedProductId = null
		}, 1000)
	}

	/**
	 * Checks if a product has multiple variants or options
	 * @param {Object} product - The product to check
	 * @returns {boolean} True if product has options
	 */
	function hasOptions(product) {
		return product.options?.length > 0
	}

	/**
	 * Navigates to the checkout page
	 */
	function goToCheckout() {
		goto('/shop/cart')
	}
</script>

<!-- Hero Section -->
<section class="hero-section full-width">
	<div class="hero-content">
		<div class="badge">✨ Magical Honey Collection</div>
		<h1 class="hero-title">Taste the Pure Magic of Columbia Gorge Honey</h1>
		<p class="hero-subtitle">Small-batch, locally harvested honey from the heart of the Columbia Gorge—crafted with
			love (and maybe a dash of local legend).</p>
	</div>
</section>

<!-- Product Section -->
<section>
	<h2 class="section-title">Our Products</h2>
	<p class="section-description">Pure Pacific Northwest sweetness in every jar, crafted by bees and loved by
		locals.</p>

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
						{#if hasOptions(product) || product.variants.length > 1}
							<a href="/shop/{product.handle}" class="btn btn-primary">View Options</a>
						{:else}
							<button
								class="btn btn-primary {addedProductId === product.id ? 'added' : ''}"
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
<section class="feature-highlight full-width">
	<div class="feature-content">
		<h2>Every Spoonful Protects Pollinators</h2>
		<p>Your purchase directly supports local pollinator habitats and educational initiatives.</p>
		<div class="services-container">
			<div class="services">
				<h3>Services</h3>
				<ul>
					<li><a href="/tiny-bee-homes">Bee Homes</a></li>
					<li><a href="/pollination-services">Pollination Services</a></li>
					<li><a href="/educational-programs">Educational Workshops</a></li>
				</ul>
			</div>
			<div class="explore">
				<h3>Explore</h3>
				<ul>
					<li><a href="/beekeeping">Beekeeping Tips</a></li>
					<li><a href="/mythology">Local Legends</a></li>
					<li><a href="/recipes">Recipes & More</a></li>
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- Contact CTA -->
<section class="contact-cta">
	<div class="contact-content">
		<h2>Let's Talk Honey!</h2>
		<p>Questions or just buzzing to chat?</p>
		<div class="contact-links">
			<a href="mailto:hello@honeyfarmer.com" class="contact-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
					<polyline points="22,6 12,13 2,6"></polyline>
				</svg>
				hello@honeyfarmer.com
			</a>
			<a href="tel:+15551234567" class="contact-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
				</svg>
				(555) 123-4567
			</a>
		</div>
	</div>
</section>

<style>
	/* Import existing styles from the original shop page */
	/* Modern CSS Variables */
	:root {
		--primary-amber: #f59e0b;
		--dark-amber: #b45309;
		--warm-amber: #fef3c7;
		--accent-green: #16a34a;
		--dark-green: #15803d;
		--neutral-50: #fafaf9;
		--neutral-100: #f5f5f4;
		--neutral-200: #e7e5e4;
		--neutral-300: #d6d3d1;
		--neutral-400: #a8a29e;
		--neutral-500: #78716c;
		--neutral-600: #57534e;
		--neutral-700: #44403c;
		--neutral-800: #292524;
		--neutral-900: #1c1917;
		--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
		--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	/* Hero Section */
	.hero-section {
		background: linear-gradient(135deg, var(--warm-amber), #ffffff);
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
		color: var(--dark-amber);
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
		color: var(--neutral-600);
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
		background: white;
		border-radius: 1rem;
		box-shadow: var(--shadow-sm);
		overflow: hidden;
		transition: all 0.3s ease;
		border: 1px solid var(--neutral-200);
	}

	.product-card:hover {
		transform: translateY(-8px);
		box-shadow: var(--shadow-lg);
	}

	.product-image-container {
		width: 100%;
		height: 260px;
		overflow: hidden;
		background-color: var(--neutral-100);
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
		color: var(--neutral-900);
		margin-bottom: 0.5rem;
	}

	.product-price {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--primary-amber);
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
		background-color: var(--accent-green);
		color: white;
	}

	.btn-primary:hover {
		background-color: var(--dark-green);
	}

	.btn-primary.added {
		animation: cartBounce 0.5s ease;
	}

	@keyframes cartBounce {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	/* Checkout Section */
	.checkout-section {
		text-align: center;
		margin-top: 3rem;
		margin-bottom: 3rem;
	}

	.checkout-button {
		background-color: var(--accent-green);
		color: white;
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

	.checkout-button:hover {
		background-color: var(--dark-green);
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
		color: var(--neutral-900);
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.section-description {
		max-width: 800px;
		margin: 0 auto 2rem;
		text-align: center;
		color: var(--neutral-600);
	}

	.feature-highlight {
		background: linear-gradient(135deg, var(--warm-amber), white);
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
		color: var(--dark-amber);
		margin-bottom: 1rem;
	}

	.services-container {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4rem;
		margin-top: 2rem;
	}

	.services, .explore {
		text-align: left;
	}

	.services h3, .explore h3 {
		font-size: 1.25rem;
		color: var(--dark-amber);
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.services ul, .explore ul {
		list-style: none;
		padding: 0;
	}

	.services li, .explore li {
		margin-bottom: 0.5rem;
	}

	.services a, .explore a {
		color: var(--accent-green);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.services a:hover, .explore a:hover {
		color: var(--dark-green);
		text-decoration: underline;
	}

	.contact-cta {
		text-align: center;
		padding: 3rem 2rem;
		background-color: var(--neutral-50);
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
		color: var(--primary-amber);
		margin-bottom: 0.5rem;
	}

	.contact-content p {
		color: var(--neutral-600);
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
		color: var(--accent-green);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.contact-link:hover {
		color: var(--dark-green);
	}

	.badge {
		display: inline-block;
		background-color: var(--primary-amber);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	.empty-products {
		grid-column: 1 / -1;
		text-align: center;
		padding: 2rem;
		background: white;
		border-radius: 1rem;
		border: 1px solid var(--neutral-200);
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