<script>
	import ShopIndexPage from './ShopIndexPage.svelte'

	/**
	 * @typedef {Object} Props
	 * @property {Object} data - Route data containing collection and products
	 */

	/** @type {Props} */
	const { data } = $props()

	const collection = $derived(data.collection || {})
</script>

<section class="collection-header">
	<h1>Collection: {collection.title || 'Products'}</h1>
	{#if collection.description}
		<p class="collection-description">{collection.description}</p>
	{/if}
</section>

<!-- Reuse the product grid from ShopIndexPage -->
<ShopIndexPage {data} />

<style>
	.collection-header {
		text-align: center;
		margin-bottom: 2rem;
		padding: 2rem 0;
		border-bottom: 1px solid var(--neutral-200, #e7e5e4);
	}

	.collection-header h1 {
		font-size: 2rem;
		color: var(--dark-amber, #b45309);
		margin-bottom: 1rem;
	}

	.collection-description {
		font-size: 1.125rem;
		color: var(--neutral-600, #57534e);
		max-width: 600px;
		margin: 0 auto;
	}
</style>