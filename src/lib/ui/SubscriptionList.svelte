<script>
	/**
	 * Subscription List Component
	 *
	 * Displays subscriptions grouped by status (active, paused, past)
	 * Reusable across different storefronts
	 */
	import {
		formatCurrency,
		formatDate,
		getIntervalText,
		getStatusClass,
		getActiveSubscriptions,
		getPausedSubscriptions,
		getPastSubscriptions
	} from '../utils/subscription-helpers.js'

	const {
		subscriptions = [],
		detailUrlPattern = '/shop/subscriptions/{id}',
		emptyMessage = 'No subscriptions yet',
		emptyAction = null
	} = $props()

	// Filter subscriptions by status
	const activeSubscriptions = $derived(getActiveSubscriptions(subscriptions))
	const pausedSubscriptions = $derived(getPausedSubscriptions(subscriptions))
	const pastSubscriptions = $derived(getPastSubscriptions(subscriptions))

	/**
	 * Get detail URL for a subscription
	 */
	function getDetailUrl(subscriptionId) {
		return detailUrlPattern.replace('{id}', subscriptionId)
	}
</script>

{#if subscriptions.length === 0}
	<div class="subscriptions-empty">
		<h2>{emptyMessage}</h2>
		{#if emptyAction}
			{@render emptyAction()}
		{/if}
	</div>
{:else}
	<!-- Active Subscriptions -->
	{#if activeSubscriptions.length > 0}
		<section class="subscriptions-section">
			<h2>Active Subscriptions</h2>
			<div class="subscriptions-grid">
				{#each activeSubscriptions as subscription}
					<article class="subscription-card">
						<div class="subscription-card__header">
							<h3 class="subscription-card__title">
								{getIntervalText(subscription.interval, subscription.interval_count)} Subscription
							</h3>
							<span class="subscription-status {getStatusClass(subscription.status)}">
								{subscription.status}
							</span>
						</div>

						<div class="subscription-card__body">
							<div class="subscription-card__detail">
								<span class="subscription-card__label">Amount:</span>
								<span class="subscription-card__value">
									{formatCurrency(subscription.amount, subscription.currency_code)}
									{#if subscription.discount_type !== 'none'}
										<span class="subscription-card__discount">
											({subscription.discount_value}% off)
										</span>
									{/if}
								</span>
							</div>

							<div class="subscription-card__detail">
								<span class="subscription-card__label">Next billing:</span>
								<span class="subscription-card__value">
									{formatDate(subscription.next_billing_date)}
								</span>
							</div>

							{#if subscription.trial_end_date}
								<div class="subscription-card__detail">
									<span class="subscription-card__label">Trial ends:</span>
									<span class="subscription-card__value">
										{formatDate(subscription.trial_end_date)}
									</span>
								</div>
							{/if}
						</div>

						<div class="subscription-card__footer">
							<a
								href={getDetailUrl(subscription.id)}
								class="btn btn--secondary btn--sm"
							>
								Manage
							</a>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Paused Subscriptions -->
	{#if pausedSubscriptions.length > 0}
		<section class="subscriptions-section">
			<h2>Paused Subscriptions</h2>
			<div class="subscriptions-grid">
				{#each pausedSubscriptions as subscription}
					<article class="subscription-card subscription-card--paused">
						<div class="subscription-card__header">
							<h3 class="subscription-card__title">
								{getIntervalText(subscription.interval, subscription.interval_count)} Subscription
							</h3>
							<span class="subscription-status {getStatusClass(subscription.status)}">
								paused
							</span>
						</div>

						<div class="subscription-card__body">
							<div class="subscription-card__detail">
								<span class="subscription-card__label">Amount:</span>
								<span class="subscription-card__value">
									{formatCurrency(subscription.amount, subscription.currency_code)}
								</span>
							</div>

							{#if subscription.metadata?.pause_until}
								<div class="subscription-card__detail">
									<span class="subscription-card__label">Paused until:</span>
									<span class="subscription-card__value">
										{formatDate(subscription.metadata.pause_until)}
									</span>
								</div>
							{/if}
						</div>

						<div class="subscription-card__footer">
							<a
								href={getDetailUrl(subscription.id)}
								class="btn btn--secondary btn--sm"
							>
								Manage
							</a>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Past Subscriptions -->
	{#if pastSubscriptions.length > 0}
		<section class="subscriptions-section">
			<h2>Past Subscriptions</h2>
			<div class="subscriptions-grid">
				{#each pastSubscriptions as subscription}
					<article class="subscription-card subscription-card--past">
						<div class="subscription-card__header">
							<h3 class="subscription-card__title">
								{getIntervalText(subscription.interval, subscription.interval_count)} Subscription
							</h3>
							<span class="subscription-status {getStatusClass(subscription.status)}">
								{subscription.status}
							</span>
						</div>

						<div class="subscription-card__body">
							<div class="subscription-card__detail">
								<span class="subscription-card__label">Amount:</span>
								<span class="subscription-card__value">
									{formatCurrency(subscription.amount, subscription.currency_code)}
								</span>
							</div>

							<div class="subscription-card__detail">
								<span class="subscription-card__label">Ended:</span>
								<span class="subscription-card__value">
									{formatDate(subscription.ended_at || subscription.cancelled_at)}
								</span>
							</div>
						</div>

						<div class="subscription-card__footer">
							<a
								href={getDetailUrl(subscription.id)}
								class="btn btn--ghost btn--sm"
							>
								View Details
							</a>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}
{/if}

<style>
	.subscriptions-empty {
		text-align: center;
		padding: 4rem 2rem;
		background: #f9fafb;
		border-radius: 0.5rem;
	}

	.subscriptions-empty h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.subscriptions-section {
		margin-bottom: 3rem;
	}

	.subscriptions-section h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		color: #1f2937;
	}

	.subscriptions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.subscription-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
		transition: box-shadow 0.2s;
	}

	.subscription-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.subscription-card--paused {
		background: #fefce8;
		border-color: #fde047;
	}

	.subscription-card--past {
		background: #f9fafb;
		opacity: 0.8;
	}

	.subscription-card__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.subscription-card__title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.subscription-status {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.subscription-status--active {
		background: #d1fae5;
		color: #065f46;
	}

	.subscription-status--paused {
		background: #fef3c7;
		color: #92400e;
	}

	.subscription-status--cancelled,
	.subscription-status--expired {
		background: #fee2e2;
		color: #991b1b;
	}

	.subscription-status--past-due {
		background: #fed7aa;
		color: #9a3412;
	}

	.subscription-card__body {
		margin-bottom: 1rem;
	}

	.subscription-card__detail {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.subscription-card__label {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.subscription-card__value {
		font-weight: 500;
		color: #1f2937;
		font-size: 0.875rem;
	}

	.subscription-card__discount {
		color: #059669;
		font-size: 0.75rem;
		margin-left: 0.25rem;
	}

	.subscription-card__footer {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		text-align: center;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.btn--secondary {
		background: #f3f4f6;
		color: #1f2937;
		border: 1px solid #d1d5db;
	}

	.btn--secondary:hover {
		background: #e5e7eb;
	}

	.btn--ghost {
		background: transparent;
		color: #6b7280;
		border: 1px solid #d1d5db;
	}

	.btn--ghost:hover {
		background: #f9fafb;
	}

	.btn--sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}
</style>
