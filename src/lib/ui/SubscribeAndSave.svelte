<script>
	/**
	 * Subscribe & Save Component
	 *
	 * Reusable component for adding subscription options to product pages
	 * Works with any e-commerce store using the subscription module
	 */

	const {
		product = $bindable(),
		selectedVariant = $bindable(),
		_onSubscribe = () => {},
		defaultInterval = 'month',
		intervals = [
			{ value: 'week', label: 'Weekly', discount: 5 },
			{ value: 'month', label: 'Monthly', discount: 10 },
			{ value: 'month', count: 3, label: 'Quarterly', discount: 15 },
			{ value: 'year', label: 'Annually', discount: 20 }
		]
	} = $props()

	// Subscription state
	let isSubscription = $state(false)
	// eslint-disable-next-line svelte/valid-compile -- intentionally capturing initial value for form state
	let selectedInterval = $state(defaultInterval)
	let _selectedIntervalCount = $state(1)
	let selectedDiscount = $state(0)

	// Get price
	const productPrice = $derived(selectedVariant?.prices?.[0]?.amount || product?.variants?.[0]?.prices?.[0]?.amount || 0)

	// Calculate subscription price with discount
	const subscriptionPrice = $derived.by(() => {
		if (!isSubscription) return productPrice

		const discount = selectedDiscount / 100
		return Math.floor(productPrice * (1 - discount))
	})

	// Calculate savings
	const savings = $derived.by(() => {
		if (!isSubscription) return 0
		return productPrice - subscriptionPrice
	})

	// Handle interval change
	function handleIntervalChange(event) {
		const intervalData = intervals.find(i => i.value === event.target.value)
		if (intervalData) {
			selectedInterval = intervalData.value
			_selectedIntervalCount = intervalData.count || 1
			selectedDiscount = intervalData.discount || 0
		}
	}

	// Format currency
	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount / 100)
	}
</script>

<div class="subscribe-save">
	<div class="subscribe-save__header">
		<label class="subscribe-save__toggle">
			<input
				type="checkbox"
				bind:checked={isSubscription}
				class="subscribe-save__checkbox"
			/>
			<span class="subscribe-save__toggle-label">
				Subscribe & Save
				{#if isSubscription && selectedDiscount > 0}
					<span class="subscribe-save__discount-badge">
						Save {selectedDiscount}%
					</span>
				{/if}
			</span>
		</label>
	</div>

	{#if isSubscription}
		<div class="subscribe-save__options">
			<label class="subscribe-save__label">
				Delivery frequency:
				<select
					class="subscribe-save__select"
					value={selectedInterval}
					onchange={handleIntervalChange}
				>
					{#each intervals as interval}
						<option value={interval.value}>
							{interval.label}
							{#if interval.discount > 0}
								- Save {interval.discount}%
							{/if}
						</option>
					{/each}
				</select>
			</label>

			<div class="subscribe-save__pricing">
				<div class="subscribe-save__price">
					<span class="subscribe-save__price-label">Subscription price:</span>
					<span class="subscribe-save__price-value">
						{formatCurrency(subscriptionPrice)}
					</span>
				</div>

				{#if savings > 0}
					<div class="subscribe-save__savings">
						You save {formatCurrency(savings)} per delivery!
					</div>
				{/if}
			</div>

			<ul class="subscribe-save__benefits">
				<li>✓ Never run out - automatic deliveries</li>
				<li>✓ Save {selectedDiscount}% on every order</li>
				<li>✓ Pause, skip, or cancel anytime</li>
				<li>✓ Manage easily from your account</li>
			</ul>
		</div>
	{/if}
</div>

<style>
	.subscribe-save {
		background: #fefce8;
		border: 2px solid #fde047;
		border-radius: 0.5rem;
		padding: 1.25rem;
		margin: 1.5rem 0;
	}

	.subscribe-save__header {
		margin-bottom: 0.75rem;
	}

	.subscribe-save__toggle {
		display: flex;
		align-items: center;
		cursor: pointer;
		user-select: none;
	}

	.subscribe-save__checkbox {
		width: 1.25rem;
		height: 1.25rem;
		margin-right: 0.75rem;
		cursor: pointer;
	}

	.subscribe-save__toggle-label {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.subscribe-save__discount-badge {
		display: inline-block;
		background: #10b981;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.subscribe-save__options {
		padding-top: 1rem;
		border-top: 1px solid #fde047;
	}

	.subscribe-save__label {
		display: block;
		font-weight: 500;
		color: #1f2937;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.subscribe-save__select {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
		margin-bottom: 1rem;
	}

	.subscribe-save__select:focus {
		outline: none;
		border-color: #d97706;
		box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
	}

	.subscribe-save__pricing {
		background: white;
		border-radius: 0.375rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.subscribe-save__price {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.subscribe-save__price-label {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.subscribe-save__price-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #d97706;
	}

	.subscribe-save__savings {
		font-size: 0.875rem;
		color: #10b981;
		font-weight: 600;
	}

	.subscribe-save__benefits {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.subscribe-save__benefits li {
		padding: 0.375rem 0;
		color: #4b5563;
		font-size: 0.875rem;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.subscribe-save {
			padding: 1rem;
		}

		.subscribe-save__toggle-label {
			font-size: 1rem;
		}

		.subscribe-save__price-value {
			font-size: 1.25rem;
		}
	}
</style>
