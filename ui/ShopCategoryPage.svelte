<script>
	import ShopIndexPage from './ShopIndexPage.svelte'

	/**
	 * @typedef {Object} Props
	 * @property {Object} data - Route data containing category and products
	 */

	/** @type {Props} */
	let { data } = $props()

	let category = $derived(data.category || {})
</script>

<section class="category-header">
	<h1>Category: {category.name || 'Products'}</h1>
	{#if category.description}
		<p class="category-description">{category.description}</p>
	{/if}
</section>

<!-- Reuse the product grid from ShopIndexPage -->
<ShopIndexPage {data} />

<style>
	.category-header {
		text-align: center;
		margin-bottom: 2rem;
		padding: 2rem 0;
		border-bottom: 1px solid var(--neutral-200, #e7e5e4);
	}

	.category-header h1 {
		font-size: 2rem;
		color: var(--dark-amber, #b45309);
		margin-bottom: 1rem;
	}

	.category-description {
		font-size: 1.125rem;
		color: var(--neutral-600, #57534e);
		max-width: 600px;
		margin: 0 auto;
	}
</style>