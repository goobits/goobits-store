<script lang="ts">
	interface MedusaVariant {
		id: string;
		title: string;
	}

	interface LineItem {
		id: string;
		title: string;
		quantity: number;
		thumbnail?: string;
		variant: MedusaVariant;
	}

	interface MedusaCartData {
		id: string;
		items?: LineItem[];
	}

	interface ShippingAddress {
		first_name: string;
		last_name: string;
		address_1: string;
		address_2?: string;
		city: string;
		province: string;
		postal_code: string;
		country_code: string;
		phone?: string;
	}

	interface PaymentResultData {
		id: string;
		last4?: string;
	}

	interface Country {
		iso_2: string;
		display_name: string;
	}

	interface DefaultRegion {
		countries?: Country[];
	}

	interface ShippingOption {
		name: string;
		amount: number;
	}

	interface Props {
		medusaCart: MedusaCartData;
		shippingAddress: ShippingAddress;
		selectedShippingOption: string;
		paymentProcessed: boolean;
		paymentResult: PaymentResultData | null;
		orderError: string | null;
		defaultRegion: DefaultRegion | null;
		formSubmitting: boolean;
		handlePlaceOrder: (event: SubmitEvent) => void;
		getSelectedShippingOption: () => ShippingOption | null;
		formatPrice: (amount: number) => string;
		getLineItemTotal: (item: LineItem) => string;
		getCartSubtotal: () => string;
		getShippingTotal: () => string;
		getTaxTotal: () => string;
		getOrderTotal: () => string;
		goToStep: (step: string) => void;
		STEPS_PAYMENT: string;
	}

	const {
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
	}: Props = $props()
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

		<form method="POST" action="?/completeCart" onsubmit={(e: SubmitEvent) => { e.preventDefault(); handlePlaceOrder(e); }}>
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
