<script lang="ts">
	import { browser } from '$app/environment'
	import StripePaymentForm from './StripePaymentForm.svelte'

	interface PaymentSession {
		provider_id: string;
		data?: {
			client_secret?: string;
		};
	}

	interface ShippingOption {
		id: string;
		name: string;
		amount: number;
	}

	interface MedusaCartData {
		id: string;
		payment_session?: PaymentSession;
		payment_sessions?: PaymentSession[];
	}

	interface ShippingAddress {
		first_name: string;
		last_name: string;
		address_1: string;
		address_2?: string;
		city: string;
		province?: string;
		postal_code: string;
		country_code: string;
	}

	interface CustomerInfo {
		email: string;
		first_name: string;
		last_name: string;
	}

	interface FormResult {
		success: boolean;
		error?: string;
	}

	interface PaymentErrors {
		message?: string;
	}

	interface Props {
		medusaCart: MedusaCartData;
		shippingOptions: ShippingOption[];
		selectedShippingOption?: string;
		shippingAddress: ShippingAddress;
		customerInfo: CustomerInfo;
		_form?: FormResult | null;
		formSubmitting: boolean;
		_paymentErrors?: PaymentErrors | null;
		handleShippingMethodSubmit: (event: SubmitEvent) => void;
		handlePaymentUpdate: (event: SubmitEvent) => void;
		handlePaymentSuccess: (event: CustomEvent) => void;
		handlePaymentError: (event: CustomEvent) => void;
		goToStep: (step: string) => void;
		formatPrice: (amount: number) => string;
		STEPS_SHIPPING: string;
	}

	/* eslint-disable prefer-const -- Svelte 5 requires `let` when using $bindable() in destructuring */
	let {
		medusaCart,
		shippingOptions,
		selectedShippingOption = $bindable(),
		shippingAddress,
		customerInfo,
		_form,
		formSubmitting,
		_paymentErrors,
		handleShippingMethodSubmit,
		handlePaymentUpdate,
		handlePaymentSuccess,
		handlePaymentError,
		goToStep,
		formatPrice,
		STEPS_SHIPPING
	}: Props = $props()
	/* eslint-enable prefer-const */
</script>

<div class="goo__checkout-section">
	<h2>Payment Method</h2>

	<!-- Shipping Method Selection -->
	<form method="POST" action="?/addShippingMethod" onsubmit={(e: SubmitEvent) => { e.preventDefault(); handleShippingMethodSubmit(e); }}>
		<input type="hidden" name="cart_id" value={medusaCart.id} />

		<div class="goo__shipping-options">
			<h3>Shipping Method</h3>
			{#if shippingOptions.length === 0}
				<div class="goo__no-shipping">
					<p>No shipping options available for your region.</p>
				</div>
			{:else}
				{#each shippingOptions as option}
					<div class="goo__shipping-option">
						<label class="goo__shipping-option-label">
							<input type="radio" name="shipping_option_id" value={option.id}
								bind:group={selectedShippingOption} checked={selectedShippingOption === option.id} />
							<div class="goo__shipping-option-info">
								<span class="goo__shipping-option-name">{option.name}</span>
								<span class="goo__shipping-option-price">${formatPrice(option.amount)}</span>
							</div>
						</label>
					</div>
				{/each}
			{/if}
		</div>

		<div class="goo__form-actions">
			<button type="button" class="goo__back-button" onclick={() => goToStep(STEPS_SHIPPING)}>
				Return to Shipping
			</button>
			<button type="submit" class="goo__continue-button"
				disabled={formSubmitting || shippingOptions.length === 0}>
				{formSubmitting ? 'Processing...' : 'Select Shipping Method'}
			</button>
		</div>
	</form>

	<!-- Stripe Payment Form -->
	{#if medusaCart.payment_session && medusaCart.payment_session.data?.client_secret}
		<div class="goo__payment-section">
			<h3>Payment Details</h3>

			<div class="goo__stripe-container">
				<!-- Stripe Elements Payment Form -->
				<StripePaymentForm
					clientSecret={medusaCart.payment_session.data.client_secret}
					cartId={medusaCart.id}
					billingDetails={{
						name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
						email: customerInfo.email,
						address: {
							line1: shippingAddress.address_1,
							line2: shippingAddress.address_2 || '',
							city: shippingAddress.city,
							state: shippingAddress.province || '',
							postal_code: shippingAddress.postal_code,
							country: shippingAddress.country_code
						}
					}}
					returnUrl={`${browser ? window.location.origin : ''}/shop/checkout/confirmation`}
					submitButtonText="Continue to Review"
					isProcessing={formSubmitting}
					onsuccess={handlePaymentSuccess}
					onerror={handlePaymentError}
				/>
			</div>
		</div>
	{:else if medusaCart.payment_sessions && medusaCart.payment_sessions.length > 0}
		<div class="goo__payment-section">
			<h3>Payment Details</h3>

			<form method="POST" action="?/updatePayment" onsubmit={(e: SubmitEvent) => { e.preventDefault(); handlePaymentUpdate(e); }}>
				<input type="hidden" name="cart_id" value={medusaCart.id} />
				<input type="hidden" name="provider_id" value="stripe" />

				<p>Select a payment method to continue:</p>

				<div class="goo__payment-providers">
					{#each medusaCart.payment_sessions as session}
						<div class="goo__payment-provider">
							<label>
								<input
									type="radio"
									name="provider_id"
									value={session.provider_id}
									checked={session.provider_id === 'stripe'}
								/>
								<span>{session.provider_id === 'stripe' ? 'Credit Card' : session.provider_id}</span>
							</label>
						</div>
					{/each}
				</div>

				<div class="goo__form-actions">
					<button type="submit" class="goo__continue-button" disabled={formSubmitting}>
						{formSubmitting ? 'Processing...' : 'Continue with Payment Method'}
					</button>
				</div>
			</form>
		</div>
	{:else}
		<div class="goo__payment-section">
			<div class="goo__payment-error">
				<p>Payment processing is currently unavailable. Please select a shipping method first.</p>
			</div>
		</div>
	{/if}
</div>
