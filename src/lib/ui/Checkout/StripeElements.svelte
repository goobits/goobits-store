<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte'
	import { Loader2 } from '@lucide/svelte'
	import { getStripe as defaultGetStripe, createElements as defaultCreateElements, createPaymentElementOptions as defaultCreatePaymentElementOptions } from '../../payment/stripeService.js'
	import { createLogger } from '../../utils/logger.js'

	const logger = createLogger('StripeElements')

	const dispatch = createEventDispatcher()

	// Props
	let {
		clientSecret = '',
		returnUrl = '',
		billingDetails = {},
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
		}
	} = $props()

	// State
	let elements = $state(null)
	let stripe = $state(null)
	let isLoading = $state(true)
	let elementsReady = $state(false)
	let elementsError = $state(null)
	let elementsContainer = $state(null)

	// Variables to store the payment element reference
	let paymentElement = null

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
				elements = await createElements(stripe, {
					clientSecret,
					appearance
				})
				
				// Create the Payment Element
				paymentElement = elements.create('payment')
				
				// Mount the Payment Element to the container
				paymentElement.mount('#stripe-payment-element')
				
				// Listen for ready event
				paymentElement.on('ready', (event) => {
					elementsReady = true
					isLoading = false
					
					// Dispatch the ready event with the elements and stripe objects
					dispatch('ready', { elements, stripe })
				})
				
				// Listen for change events
				paymentElement.on('change', (event) => {
					dispatch('change', event)
				})
				
				// Listen for blur events
				paymentElement.on('blur', () => {
					dispatch('blur')
				})
				
				// Listen for focus events
				paymentElement.on('focus', () => {
					dispatch('focus')
				})
				
				// Listen for escape events
				paymentElement.on('escape', () => {
					dispatch('escape')
				})
				
			} else {
				elementsError = new Error('Client secret is required')
				isLoading = false
			}
		} catch (error) {
			logger.error('Error initializing Stripe Elements:', error)
			elementsError = error
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