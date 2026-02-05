<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte'
	import { browser } from '$app/environment'
	import StripeElements from './StripeElements.svelte'
	import { Loader2 } from '@lucide/svelte'

	import type { Stripe, StripeElements as StripeElementsType, PaymentIntent } from '@stripe/stripe-js'

	// Use console for logging within the package
	const logger = console

	interface StripeError {
		message: string;
	}

	interface StripeElementsData {
		elements: StripeElementsType;
		stripe: Stripe;
	}

	interface BillingDetails {
		name?: string;
		email?: string;
		address?: {
			line1?: string;
			line2?: string;
			city?: string;
			state?: string;
			postal_code?: string;
			country?: string;
		};
	}

	interface Props {
		clientSecret?: string;
		cartId?: string;
		billingDetails?: BillingDetails;
		returnUrl?: string;
		submitButtonText?: string;
		isProcessing?: boolean;
		onsuccess?: (event: CustomEvent<{ paymentIntent: PaymentIntent; paymentStatus: string }>) => void;
		onerror?: (event: CustomEvent<StripeError>) => void;
	}

	const dispatch = createEventDispatcher<{
		success: { paymentIntent: PaymentIntent; paymentStatus: string };
		error: StripeError;
	}>()

	// Props
	const {
		clientSecret = '',
		cartId = '',
		billingDetails = {
			name: '',
			email: '',
			address: {
				line1: '',
				line2: '',
				city: '',
				state: '',
				postal_code: '',
				country: ''
			}
		},
		returnUrl = '/shop/checkout/confirmation',
		submitButtonText = 'Pay now',
		isProcessing = false,
		onsuccess,
		onerror
	}: Props = $props()

	// State
	let isLoading: boolean = $state(true)
	let stripeError: StripeError | null = $state(null)
	let stripeElements: StripeElementsData | null = $state(null)
	// Processing state: use prop if provided, otherwise manage locally
	// eslint-disable-next-line svelte/valid-compile -- intentionally capturing initial value for local state management
	let processing: boolean = $state(isProcessing)

	// Set up Elements when component mounts
	onMount(() => {
		if (!browser) return

		// Make sure the client secret is available
		if (!clientSecret) {
			stripeError = { message: 'Client secret is required' }
			isLoading = false
			return
		}

		isLoading = false
	})

	// Update Elements when the client secret changes
	$effect(() => {
		if (browser && clientSecret) {
			// Reset error state when the client secret changes
			stripeError = null
			isLoading = false
		}
	})

	// Handle form submission
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault()

		if (!stripeElements || !browser) return

		// Set processing state
		processing = true

		try {
			// Get the stripe object from the elements
			const { stripe } = stripeElements

			// Confirm the payment using client-side confirmation
			const result = await stripe.confirmPayment({
				elements: stripeElements.elements,
				confirmParams: {
					return_url: `${window.location.origin}${returnUrl}?cart_id=${cartId}`,
					payment_method_data: {
						billing_details: billingDetails
					}
				},
				redirect: 'if_required'
			})

			// Handle the result
			if (result.error) {
				// Show error to customer
				stripeError = result.error as StripeError
				processing = false

				// Dispatch error event
				const errorEvent = new CustomEvent('error', { detail: stripeError })
				dispatch('error', stripeError)
				if (onerror) onerror(errorEvent as CustomEvent<StripeError>)
			} else {
				// The payment has been processed!
				if (result.paymentIntent) {
					// Dispatch the success event with payment info
					const successData = {
						paymentIntent: result.paymentIntent,
						paymentStatus: result.paymentIntent.status
					}
					const successEvent = new CustomEvent('success', { detail: successData })
					dispatch('success', successData)
					if (onsuccess) onsuccess(successEvent as CustomEvent<{ paymentIntent: PaymentIntent; paymentStatus: string }>)

					// Reset processing state if the payment doesn't require further action
					if (result.paymentIntent.status !== 'requires_action') {
						processing = false
					}
				}
			}
		} catch (error) {
			logger.error('Payment error:', error)
			stripeError = { message: 'Something went wrong with your payment. Please try again.' }
			processing = false

			// Dispatch error event
			const errorEvent = new CustomEvent('error', { detail: stripeError })
			dispatch('error', stripeError)
			if (onerror) onerror(errorEvent as CustomEvent<StripeError>)
		}
	}

	// Handle successful setup of the Elements
	function handleElementsReady(event: CustomEvent<StripeElementsData>): void {
		stripeElements = event.detail
	}
</script>

{#if !clientSecret}
	<div class="goo__stripe-payment-error">
		<p>Payment details could not be loaded. Please try refreshing.</p>
	</div>
{:else}
	<div class="goo__stripe-payment">
		{#if isLoading}
			<div class="goo__stripe-payment-loading">
				<Loader2 style="animation: spin 1s linear infinite;" />
				<p>Loading payment form...</p>
			</div>
		{:else}
			<form class="goo__stripe-payment-form" onsubmit={handleSubmit}>
				<!-- Stripe Elements will be injected here -->
				<StripeElements {clientSecret} onready={handleElementsReady} />

				{#if stripeError}
					<div class="goo__stripe-payment-error" aria-live="polite">
						<p>{stripeError.message}</p>
					</div>
				{/if}

				<button
					type="submit"
					class="goo__stripe-payment-button"
					disabled={processing}
					aria-disabled={processing}
					aria-label={processing ? 'Processing payment...' : submitButtonText}
				>
					{#if processing}
						<Loader2 style="animation: spin 1s linear infinite;" />
						<span>Processing...</span>
					{:else}
						<span>{submitButtonText}</span>
					{/if}
				</button>
			</form>
		{/if}
	</div>
{/if}

<style lang="scss">
	.goo__stripe-payment {
		max-width: 500px;
		margin: 0 auto;

		&-loading,
		&-error {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 2rem;
			text-align: center;
			color: #555;
		}

		&-error {
			background-color: #fff5f5;
			border: 1px solid #fc8181;
			border-radius: 0.25rem;
			padding: 0.75rem;
			margin: 1rem 0;
			color: #c53030;
			font-size: 0.875rem;
		}

		&-form {
			/* Form container */
		}

		&-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			width: 100%;
			background-color: var(--amber-600, #d97706);
			color: white;
			font-weight: 600;
			padding: 0.75rem 1.5rem;
			border-radius: 0.25rem;
			border: none;
			margin-top: 1.5rem;
			cursor: pointer;
			transition: background-color 0.2s ease;

			&:disabled {
				background-color: var(--amber-400, #fbbf24);
				cursor: not-allowed;
				opacity: 0.7;
			}

			&:not(:disabled):hover {
				background-color: var(--amber-700, #b45309);
			}
		}
	}

	/* Using inline style instead of class */
	/* .animate-spin {
		animation: spin 1s linear infinite;
	} */
</style>
