<script>
	/**
	 * ShopPlansPage - Generic plans/subscriptions redirect page
	 *
	 * @prop {Object} data - Route data
	 * @prop {Object} [content] - Page content (title, description, links)
	 */
	const {
		_data,
		content = {
			title: 'Service Plans & Subscriptions',
			description: 'Our service plans and subscription options have moved to make them easier to find!',
			links: []
		}
	} = $props()
</script>

<section class="plans-redirect">
	<h1>{content.title}</h1>
	<p>{content.description}</p>

	<div class="redirect-options">
		<a href="/plans" class="redirect-button">
			View All Plans & Subscriptions
		</a>
		<a href="/shop" class="redirect-button secondary">
			← Back to Shop
		</a>
	</div>

	{#if content.links && content.links.length > 0}
		<div class="quick-links">
			<h3>Quick Links:</h3>
			<ul>
				{#each content.links as link}
					<li><a href={link.url}>{link.label}</a></li>
				{/each}
			</ul>
		</div>
	{/if}
</section>

<style>
	.plans-redirect {
		text-align: center;
		padding: 3rem 2rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.plans-redirect h1 {
		color: var(--dark-amber, #b45309);
		margin-bottom: 1rem;
	}

	.plans-redirect p {
		color: var(--neutral-600, #57534e);
		margin-bottom: 2rem;
		font-size: 1.125rem;
	}

	.redirect-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 3rem;
		align-items: center;
	}

	@media (min-width: 640px) {
		.redirect-options {
			flex-direction: row;
			justify-content: center;
		}
	}

	.redirect-button {
		display: inline-block;
		padding: 0.75rem 2rem;
		background-color: var(--accent-green, #16a34a);
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.redirect-button:hover {
		background-color: var(--dark-green, #15803d);
		transform: translateY(-2px);
	}

	.redirect-button.secondary {
		background-color: white;
		color: var(--neutral-700, #44403c);
		border: 1px solid var(--neutral-300, #d6d3d1);
	}

	.redirect-button.secondary:hover {
		background-color: var(--neutral-50, #fafaf9);
	}

	.quick-links {
		text-align: left;
		max-width: 300px;
		margin: 0 auto;
	}

	.quick-links h3 {
		color: var(--neutral-800, #292524);
		margin-bottom: 1rem;
	}

	.quick-links ul {
		list-style: none;
		padding: 0;
	}

	.quick-links li {
		margin-bottom: 0.5rem;
	}

	.quick-links a {
		color: var(--primary-amber, #f59e0b);
		text-decoration: none;
		font-weight: 500;
	}

	.quick-links a:hover {
		text-decoration: underline;
	}
</style>