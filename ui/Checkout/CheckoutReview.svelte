<script>
	import { enhance } from '$app/forms'
	import { preventDefault } from 'svelte/legacy'

	/**
	 * @typedef {Object} Props
	 * @property {Object} medusaCart - The Medusa cart object
	 * @property {Object} shippingAddress - The current shipping address
	 * @property {string} selectedShippingOption - ID of the selected shipping option
	 * @property {boolean} paymentProcessed - Whether payment has been processed
	 * @property {Object} paymentResult - Result of payment processing
	 * @property {string} orderError - Order error message if any
	 * @property {Object} defaultRegion - The default region data with countries
	 * @property {boolean} formSubmitting - Whether the form is currently submitting
	 * @property {Function} handlePlaceOrder - Function to handle order placement
	 * @property {Function} getSelectedShippingOption - Function to get selected shipping option
	 * @property {Function} formatPrice - Function to format price values
	 * @property {Function} getLineItemTotal - Function to calculate line item total
	 * @property {Function} getCartSubtotal - Function to get cart subtotal
	 * @property {Function} getShippingTotal - Function to get shipping total
	 * @property {Function} getTaxTotal - Function to get tax total
	 * @property {Function} getOrderTotal - Function to get order total
	 * @property {Function} goToStep - Function to navigate between steps
	 * @property {string} STEPS_PAYMENT - The payment step identifier
	 */

	/** @type {Props} */
	let {
		medusaCart,
		shippingAddress,
		selectedShippingOption,
		paymentProcessed,
		paymentResult,
		orderError,
		defaultRegion,
		formSubmitting,
		handlePlaceOrder,
		getSelectedShippingOption,
		formatPrice,
		getLineItemTotal,
		getCartSubtotal,
		getShippingTotal,
		getTaxTotal,
		getOrderTotal,
		goToStep,
		STEPS_PAYMENT
	} = $props()
</script>

<div class="goo__checkout-section">
	<h2>Review Your Order</h2>
	
	<div class="goo__order-review">
		<!-- Shipping Information -->
		<div class="goo__review-section">
			<h3>Shipping Address</h3>
			<div class="goo__review-content">
				<p>{shippingAddress.first_name} {shippingAddress.last_name}</p>
				<p>{shippingAddress.address_1}</p>
				{#if shippingAddress.address_2}
					<p>{shippingAddress.address_2}</p>
				{/if}
				<p>{shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}</p>
				<p>
					{#if defaultRegion && defaultRegion.countries}
						{defaultRegion.countries.find(c => c.iso_2 === shippingAddress.country_code)?.display_name || shippingAddress.country_code}
					{:else}
						{shippingAddress.country_code}
					{/if}
				</p>
				{#if shippingAddress.phone}
					<p>{shippingAddress.phone}</p>
				{/if}
			</div>
			<button type="button" class="goo__edit-button" onclick={() => goToStep(STEPS_PAYMENT)}>Edit</button>
		</div>
		
		<!-- Shipping Method -->
		<div class="goo__review-section">
			<h3>Shipping Method</h3>
			<div class="goo__review-content">
				{#if selectedShippingOption}
					<p>
						{getSelectedShippingOption()?.name || 'Standard Shipping'} - 
						${formatPrice(getSelectedShippingOption()?.amount || 0)}
					</p>
				{:else}
					<p>No shipping method selected</p>
				{/if}
			</div>
			<button type="button" class="goo__edit-button" onclick={() => goToStep(STEPS_PAYMENT)}>Edit</button>
		</div>
		
		<!-- Payment Method -->
		<div class="goo__review-section">
			<h3>Payment Method</h3>
			<div class="goo__review-content">
				{#if paymentProcessed && paymentResult}
					<p>
						<i class="fa fa-credit-card"></i> Credit Card ending in {paymentResult.last4 || '****'}
					</p>
					<p>Transaction ID: {paymentResult.id}</p>
				{:else}
					<p>No payment method selected</p>
				{/if}
			</div>
			<button type="button" class="goo__edit-button" onclick={() => goToStep(STEPS_PAYMENT)}>Edit</button>
		</div>
		
		<!-- Order Items -->
		<div class="goo__review-section">
			<h3>Order Items</h3>
			<div class="goo__order-items">
				{#if medusaCart.items && medusaCart.items.length > 0}
					{#each medusaCart.items as item}
						<div class="goo__order-item">
							<div class="goo__order-item-image">
								{#if item.thumbnail}
									<img src={item.thumbnail} alt={item.title} />
								{:else}
									<div class="goo__item-placeholder"></div>
								{/if}
								<span class="goo__item-quantity">{item.quantity}</span>
							</div>
							<div class="goo__order-item-details">
								<p class="goo__item-title">{item.title}</p>
								<p class="goo__item-variant">{item.variant.title !== 'Default' ? item.variant.title : ''}</p>
							</div>
							<div class="goo__order-item-price">${getLineItemTotal(item)}</div>
						</div>
					{/each}
				{:else}
					<p>No items in cart</p>
				{/if}
			</div>
		</div>
		
		<!-- Order Summary -->
		<div class="goo__order-summary">
			<div class="goo__summary-row">
				<span>Subtotal</span>
				<span>${getCartSubtotal()}</span>
			</div>
			<div class="goo__summary-row">
				<span>Shipping</span>
				<span>${getShippingTotal()}</span>
			</div>
			<div class="goo__summary-row">
				<span>Tax</span>
				<span>${getTaxTotal()}</span>
			</div>
			<div class="goo__summary-row goo__summary-total">
				<span>Total</span>
				<span>${getOrderTotal()}</span>
			</div>
		</div>
		
		{#if orderError}
			<div class="goo__form-error">
				{orderError}
			</div>
		{/if}
		
		<form method="POST" action="?/completeCart" use:enhance onsubmit={preventDefault(handlePlaceOrder)}>
			<input type="hidden" name="cart_id" value={medusaCart.id} />
			
			<div class="goo__form-actions">
				<button type="button" class="goo__back-button" onclick={() => goToStep(STEPS_PAYMENT)}>
					Return to Payment
				</button>
				<button type="submit" class="goo__place-order-button" disabled={formSubmitting || !paymentProcessed}>
					{formSubmitting ? 'Processing...' : 'Place Order'}
				</button>
			</div>
		</form>
	</div>
</div>