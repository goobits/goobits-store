<script>
	import ShopIndexPage from './ShopIndexPage.svelte'
	import ShopProductPage from './ShopProductPage.svelte'
	import ShopCategoryPage from './ShopCategoryPage.svelte'
	import ShopCollectionPage from './ShopCollectionPage.svelte'
	import ShopAccountPage from './ShopAccountPage.svelte'
	import ShopCartPage from './ShopCartPage.svelte'
	import ShopCheckoutPage from './ShopCheckoutPage.svelte'
	import ShopLoginPage from './ShopLoginPage.svelte'
	import ShopPlansPage from './ShopPlansPage.svelte'

	/**
	 * @typedef {Object} Props
	 * @property {Object} data - Route data from load function
	 */

	/** @type {Props} */
	let { data } = $props()

	// Extract page type and route data
	let pageType = $derived(data.pageType || 'index')
</script>

<div class="shop-router">
	{#if pageType === 'index'}
		<ShopIndexPage {data} />
	{:else if pageType === 'product'}
		<ShopProductPage {data} />
	{:else if pageType === 'category'}
		<ShopCategoryPage {data} />
	{:else if pageType === 'collection'}
		<ShopCollectionPage {data} />
	{:else if pageType === 'account'}
		<ShopAccountPage {data} auth={data.auth} isAuthenticated={data.isAuthenticated} customer={data.customer} />
	{:else if pageType === 'cart'}
		<ShopCartPage {data} />
	{:else if pageType === 'checkout'}
		<ShopCheckoutPage {data} form={data.form} />
	{:else if pageType === 'login'}
		<ShopLoginPage {data} auth={data.auth} demoCredentials={data.demoCredentials} initialMode="login" />
	{:else if pageType === 'register'}
		<ShopLoginPage {data} auth={data.auth} demoCredentials={null} initialMode="register" />
	{:else if pageType === 'plans'}
		<ShopPlansPage {data} />
	{:else}
		<div class="shop-error">
			<h1>Page Not Found</h1>
			<p>The requested shop page could not be found.</p>
			<a href="/shop">← Back to Shop</a>
		</div>
	{/if}
</div>

<style>
	.shop-router {
		display: flex;
		flex-direction: column;
		flex: 1;
		width: 100%;
	}

	.shop-error {
		text-align: center;
		padding: 2rem;
	}

	.shop-error h1 {
		color: var(--color-text-primary, #1a1a1a);
		margin-bottom: 1rem;
	}

	.shop-error p {
		color: var(--color-text-secondary, #666);
		margin-bottom: 1.5rem;
	}

	.shop-error a {
		color: var(--color-primary, #f59e0b);
		text-decoration: none;
	}

	.shop-error a:hover {
		text-decoration: underline;
	}
</style>