<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte'
	import { Loader2 } from '@lucide/svelte'
	import { getStripe as defaultGetStripe, createElements as defaultCreateElements, createPaymentElementOptions as defaultCreatePaymentElementOptions, type ElementsOptions } from '../../payment/stripeService'

	import type { Stripe, StripeElements as StripeElementsType, StripePaymentElement, Appearance } from '@stripe/stripe-js'

	// Use console for logging within the package
	const logger = console

	const dispatch = createEventDispatcher<{
		ready: { elements: StripeElementsType; stripe: Stripe };
		change: unknown;
		blur: void;
		focus: void;
		escape: void;
	}>()

	interface Props {
		clientSecret?: string;
		stripePublicKey?: string;
		getStripe?: (publicKey?: string) => Promise<Stripe | null>;
		createElements?: (stripe: Stripe | null, options?: ElementsOptions) => StripeElementsType | null;
		createPaymentElementOptions?: typeof defaultCreatePaymentElementOptions;
		appearance?: Appearance;
		onready?: (event: CustomEvent<{ elements: StripeElementsType; stripe: Stripe }>) => void;
		onchange?: (event: CustomEvent<unknown>) => void;
		onblur?: (event: CustomEvent<void>) => void;
		onfocus?: (event: CustomEvent<void>) => void;
		onescape?: (event: CustomEvent<void>) => void;
	}

	// Props
	const {
		clientSecret = '',
		stripePublicKey = '', // Stripe public key
		getStripe = defaultGetStripe, // Function to get Stripe instance
		createElements = defaultCreateElements, // Function to create Stripe Elements
		createPaymentElementOptions = defaultCreatePaymentElementOptions, // Function to create payment element options
		appearance = {
			theme: 'stripe',
			variables: {
				colorPrimary: '#f59e0b',
				colorBackground: '#ffffff',
				colorText: '#1f2937',
				colorDanger: '#ef4444',
				fontFamily: 'sans-serif',
				fontSizeBase: '16px',
				borderRadius: '4px',
				spacingUnit: '4px',
			},
			rules: {
				'.Input': {
					border: '1px solid #e2e8f0',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
				},
				'.Input:focus': {
					border: '1px solid #f59e0b',
					boxShadow: '0 1px 3px rgba(245, 158, 11, 0.2)'
				},
				'.Input.is-invalid': {
					borderColor: '#ef4444'
				}
			}
		},
		onready,
		onchange,
		onblur,
		onfocus,
		onescape
	}: Props = $props()

	// Suppress unused variable warning - kept for potential future use
	// eslint-disable-next-line svelte/valid-compile -- intentionally capturing initial value
	void createPaymentElementOptions

	// State
	let elements: StripeElementsType | null = $state(null)
	let stripe: Stripe | null = $state(null)
	let isLoading: boolean = $state(true)
	let _elementsReady: boolean = $state(false)
	let elementsError: Error | null = $state(null)
	let elementsContainer: HTMLDivElement | null = $state(null)

	// Variables to store the payment element reference
	let paymentElement: StripePaymentElement | null = null

	// Mount: Initialize Stripe when the component mounts
	onMount(async () => {
		// Load Stripe
		try {
			// Initialize Stripe with the public key
			stripe = await getStripe(stripePublicKey)

			if (!stripe) {
				elementsError = new Error('Failed to load Stripe')
				isLoading = false
				return
			}

			// Create Elements instance
			if (clientSecret) {
				// Create elements instance using the provided function
				elements = createElements(stripe, {
					clientSecret,
					appearance: appearance as Record<string, unknown>
				})

				if (!elements) {
					elementsError = new Error('Failed to create Stripe Elements')
					isLoading = false
					return
				}

				// Create the Payment Element
				paymentElement = elements.create('payment')

				// Mount the Payment Element to the container
				paymentElement.mount('#stripe-payment-element')

				// Listen for ready event
				paymentElement.on('ready', () => {
					_elementsReady = true
					isLoading = false

					// Dispatch the ready event with the elements and stripe objects
					const detail = { elements: elements!, stripe: stripe! }
					dispatch('ready', detail)
					if (onready) onready(new CustomEvent('ready', { detail }))
				})

				// Listen for change events
				paymentElement.on('change', (event) => {
					dispatch('change', event)
					if (onchange) onchange(new CustomEvent('change', { detail: event }))
				})

				// Listen for blur events
				paymentElement.on('blur', () => {
					dispatch('blur')
					if (onblur) onblur(new CustomEvent('blur'))
				})

				// Listen for focus events
				paymentElement.on('focus', () => {
					dispatch('focus')
					if (onfocus) onfocus(new CustomEvent('focus'))
				})

				// Listen for escape events
				paymentElement.on('escape', () => {
					dispatch('escape')
					if (onescape) onescape(new CustomEvent('escape'))
				})

			} else {
				elementsError = new Error('Client secret is required')
				isLoading = false
			}
		} catch (error) {
			logger.error('Error initializing Stripe Elements:', error)
			elementsError = error as Error
			isLoading = false
		}
	})

	// Cleanup on component destroy
	onDestroy(() => {
		if (paymentElement) {
			paymentElement.unmount()
		}
	})
</script>

<div class="goo__stripe-elements">
	{#if isLoading}
		<div class="goo__stripe-elements-loading">
			<Loader2 class="animate-spin" />
		</div>
	{:else if elementsError}
		<div class="goo__stripe-elements-error">
			<p>{elementsError.message || 'Error loading payment form'}</p>
		</div>
	{:else}
		<div id="stripe-payment-element" class="goo__stripe-elements-field" bind:this={elementsContainer}></div>
	{/if}
</div>

<style lang="scss">
	.goo__stripe-elements {
		min-height: 300px;
		margin-bottom: 1rem;

		&-loading {
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: 200px;
			color: #4b5563;
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

		&-field {
			/* Stripe injects its own styles here */
		}
	}

	/* Animate spinner */
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}
</style>
