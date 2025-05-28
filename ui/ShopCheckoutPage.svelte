<script>
	// This component contains the existing checkout functionality
	// For now, we'll import and wrap the existing functionality
	const { data, form = undefined } = $props()

	// Re-export all the checkout functionality from the original file
	import { clearCart } from '@lib/shop/cart.js'
	import { goto } from '$app/navigation'
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import { Logger } from '@lib/utils/Logger.js'
	import { customer } from '@lib/stores/auth.js'

	const logger = new Logger('Checkout')

	// Import checkout components from store package
	import {
		CheckoutCustomerInfo,
		CheckoutShipping,
		CheckoutPayment,
		CheckoutReview,
		CheckoutConfirmation
	} from '@goobits/store'

	// Import checkout utilities from store package
	import * as CheckoutUtils from '@goobits/store'

	// Setup lifecycle hooks
	onMount(() => {
		// Initialize session storage for checkout
		if (browser && typeof window !== 'undefined') {
			// Do any initial setup here
		}
	})

	onDestroy(() => {
		// Clean up if needed
		// We'll keep the session storage data for page refreshes
	})

	// Extract checkout data
	let medusaCart = $derived(data.cart || {})
	let regions = $derived(data.regions || [])
	let defaultRegion = $derived(data.defaultRegion || null)
	let shippingOptions = $derived(data.shippingOptions || [])

	// Checkout steps
	const STEPS = {
		INFORMATION: 'information',
		SHIPPING: 'shipping',
		PAYMENT: 'payment',
		REVIEW: 'review',
		CONFIRMATION: 'confirmation'
	}

	// Load state from session storage or use defaults
	function loadCheckoutState() {
		if (!browser) return null

		try {
			const savedState = sessionStorage.getItem('checkout_state')
			return savedState ? JSON.parse(savedState) : null
		} catch (e) {
			logger.error('Error loading checkout state:', e)
			return null
		}
	}

	const savedState = loadCheckoutState()

	// Initialize form state (either from session storage or defaults)
	let currentStep = $state(savedState?.currentStep || STEPS.INFORMATION)
	let completedOrder = $state(null)
	let orderError = $state('')
	let formSubmitting = $state(false)
	let paymentErrors = $state({})

	// Payment state
	let paymentProcessed = $state(false)
	let paymentResult = $state(null)

	// Save checkout state to session storage
	function saveCheckoutState() {
		if (!browser) return

		try {
			const stateToSave = {
				currentStep,
				customerInfo,
				shippingAddress,
				selectedShippingOption,
				useSameAddress: true // Default value
			}

			sessionStorage.setItem('checkout_state', JSON.stringify(stateToSave))
		} catch (e) {
			logger.error('Error saving checkout state:', e)
		}
	}

	// Form data for each step (using saved state if available, or from authenticated user)
	let customerInfo = $state(savedState?.customerInfo || {
		email: $customer?.email || '',
		first_name: $customer?.first_name || '',
		last_name: $customer?.last_name || ''
	})

	// Get default country code separately to avoid reactivity issues
	let defaultCountry = 'us'

	// Update when defaultRegion changes
	$effect(() => {
		if (defaultRegion?.countries?.[0]?.iso_2) {
			defaultCountry = defaultRegion.countries[0].iso_2
		}
	})

	let shippingAddress = $state(savedState?.shippingAddress || {
		first_name: $customer?.first_name || '',
		last_name: $customer?.last_name || '',
		address_1: '',
		address_2: '',
		city: '',
		province: '',
		postal_code: '',
		country_code: defaultCountry,
		phone: $customer?.phone || ''
	})

	// Initialize shipping option (defaulted if available)
	let defaultShippingOption = $state('')

	$effect(() => {
		if (shippingOptions && shippingOptions.length > 0) {
			defaultShippingOption = shippingOptions[0].id
		}
	})

	let selectedShippingOption = $state(savedState?.selectedShippingOption || '')

	// Update selected shipping option when default changes and no option is selected
	$effect(() => {
		if (defaultShippingOption && !selectedShippingOption) {
			selectedShippingOption = defaultShippingOption
		}
	})

	// Save form state whenever critical values change
	$effect(() => {
		if (browser) {
			// Any of these state changes should trigger saving
			const _ = [
				customerInfo.email,
				customerInfo.first_name,
				customerInfo.last_name,
				shippingAddress.first_name,
				shippingAddress.address_1,
				shippingAddress.city,
				selectedShippingOption,
				currentStep
			]

			// Don't save on initial load
			if (typeof window !== 'undefined' && window.sessionStorage.getItem('checkout_init') === 'true') {
				saveCheckoutState()
			} else if (typeof window !== 'undefined') {
				window.sessionStorage.setItem('checkout_init', 'true')
			}
		}
	})

	// Handle form submissions for each step
	async function handleCustomerInfoSubmit(event) {
		formSubmitting = true

		// Save form state before submission
		saveCheckoutState()

		// Form is enhanced with enhance action, so it will be handled by the server
		// After successful form submission, move to next step
		if (!form || form.success) {
			currentStep = STEPS.SHIPPING
			// Save updated state after changing step
			saveCheckoutState()
		}

		formSubmitting = false
	}

	async function handleShippingAddressSubmit(event) {
		formSubmitting = true

		// Save form state before submission
		saveCheckoutState()

		// Form is enhanced with enhance action
		if (!form || form.success) {
			currentStep = STEPS.PAYMENT
			// Save updated state after changing step
			saveCheckoutState()
		}

		formSubmitting = false
	}

	async function handleShippingMethodSubmit(event) {
		formSubmitting = true

		// Save form state before submission
		saveCheckoutState()

		// Form is enhanced with enhance action
		if (!form || form.success) {
			// Don't advance to next step until payment is processed
			// We'll stay on the payment page
			saveCheckoutState()
		}

		formSubmitting = false
	}

	async function handlePaymentUpdate(event) {
		formSubmitting = true
		paymentErrors = {}

		// Form is enhanced with enhance action
		if (!form || form.success) {
			// Update payment method selection
			saveCheckoutState()
		} else if (form && !form.success) {
			paymentErrors.general = form.error || 'Failed to update payment method'
		}

		formSubmitting = false
	}

	function handlePaymentSuccess(event) {
		paymentProcessed = true
		paymentResult = event.detail.paymentIntent
		paymentErrors = {}

		// Move to review step
		currentStep = STEPS.REVIEW
		saveCheckoutState()
	}

	function handlePaymentError(event) {
		paymentProcessed = false
		paymentErrors.general = event.detail.error || 'Payment processing failed'
	}

	async function handlePlaceOrder(event) {
		formSubmitting = true
		orderError = ''

		// Verify payment was processed
		if (!paymentProcessed) {
			orderError = 'Payment has not been processed. Please complete payment before placing your order.'
			formSubmitting = false
			return
		}

		// Form is enhanced with enhance action
		if (form && form.success && form.order) {
			completedOrder = form.order
			currentStep = STEPS.CONFIRMATION

			// Clear the local cart
			clearCart()
		} else if (form && !form.success) {
			orderError = form.error || 'An error occurred while placing your order. Please try again.'
		}

		formSubmitting = false
	}

	// Helper functions
	function getSelectedShippingOption() {
		return shippingOptions.find(option => option.id === selectedShippingOption)
	}

	function formatPrice(price) {
		return CheckoutUtils.formatPrice(price)
	}

	function getLineItemTotal(item) {
		return CheckoutUtils.getLineItemTotal(item)
	}

	function getCartSubtotal() {
		return CheckoutUtils.getCartSubtotal(medusaCart)
	}

	function getShippingTotal() {
		return CheckoutUtils.getShippingTotal(medusaCart)
	}

	function getTaxTotal() {
		return CheckoutUtils.getTaxTotal(medusaCart)
	}

	function getOrderTotal() {
		return CheckoutUtils.getOrderTotal(medusaCart)
	}

	function goToStep(step) {
		// Only allow going back to previous steps
		const steps = Object.values(STEPS)
		const currentIndex = steps.indexOf(currentStep)
		const targetIndex = steps.indexOf(step)

		if (targetIndex < currentIndex) {
			currentStep = step
		}
	}

	function continueShopping() {
		goto('/shop')
	}
</script>

<div class="goo__checkout-page">
	<h1>Checkout</h1>

	<!-- Checkout Navigation -->
	<div class="goo__checkout-steps">
		<div class="goo__checkout-step {currentStep === STEPS.INFORMATION ? 'active' : ''}"
			 onclick={() => goToStep(STEPS.INFORMATION)}
			 onkeydown={(e) => e.key === 'Enter' && goToStep(STEPS.INFORMATION)}
			 tabindex="0"
			 role="button">
			<span class="goo__step-number">1</span>
			<span class="goo__step-name">Information</span>
		</div>
		<div class="goo__step-divider"></div>
		<div class="goo__checkout-step {currentStep === STEPS.SHIPPING ? 'active' : ''}"
			 onclick={() => goToStep(STEPS.SHIPPING)}
			 onkeydown={(e) => e.key === 'Enter' && goToStep(STEPS.SHIPPING)}
			 tabindex="0"
			 role="button">
			<span class="goo__step-number">2</span>
			<span class="goo__step-name">Shipping</span>
		</div>
		<div class="goo__step-divider"></div>
		<div class="goo__checkout-step {currentStep === STEPS.PAYMENT ? 'active' : ''}"
			 onclick={() => goToStep(STEPS.PAYMENT)}
			 onkeydown={(e) => e.key === 'Enter' && goToStep(STEPS.PAYMENT)}
			 tabindex="0"
			 role="button">
			<span class="goo__step-number">3</span>
			<span class="goo__step-name">Payment</span>
		</div>
		<div class="goo__step-divider"></div>
		<div class="goo__checkout-step {currentStep === STEPS.REVIEW ? 'active' : ''}"
			 onclick={() => goToStep(STEPS.REVIEW)}
			 onkeydown={(e) => e.key === 'Enter' && goToStep(STEPS.REVIEW)}
			 tabindex="0"
			 role="button">
			<span class="goo__step-number">4</span>
			<span class="goo__step-name">Review</span>
		</div>
	</div>

	<div class="goo__checkout-content">
		<!-- Step 1: Customer Information -->
		{#if currentStep === STEPS.INFORMATION}
			<CheckoutCustomerInfo
				{customerInfo}
				cartId={medusaCart.id}
				{form}
				{formSubmitting}
				{handleCustomerInfoSubmit}
				{continueShopping}
			/>
		{/if}

		<!-- Step 2: Shipping Address -->
		{#if currentStep === STEPS.SHIPPING}
			<CheckoutShipping
				{shippingAddress}
				cartId={medusaCart.id}
				{form}
				{formSubmitting}
				{handleShippingAddressSubmit}
				{goToStep}
				{defaultRegion}
				STEPS_INFORMATION={STEPS.INFORMATION}
			/>
		{/if}

		<!-- Step 3: Payment Method -->
		{#if currentStep === STEPS.PAYMENT}
			<CheckoutPayment
				{medusaCart}
				{shippingOptions}
				{selectedShippingOption}
				{shippingAddress}
				{customerInfo}
				{form}
				{formSubmitting}
				{paymentErrors}
				{handleShippingMethodSubmit}
				{handlePaymentUpdate}
				{handlePaymentSuccess}
				{handlePaymentError}
				{goToStep}
				{formatPrice}
				STEPS_SHIPPING={STEPS.SHIPPING}
			/>
		{/if}

		<!-- Step 4: Order Review -->
		{#if currentStep === STEPS.REVIEW}
			<CheckoutReview
				{medusaCart}
				{shippingAddress}
				{selectedShippingOption}
				{paymentProcessed}
				{paymentResult}
				{orderError}
				{defaultRegion}
				{formSubmitting}
				{handlePlaceOrder}
				{getSelectedShippingOption}
				{formatPrice}
				{getLineItemTotal}
				{getCartSubtotal}
				{getShippingTotal}
				{getTaxTotal}
				{getOrderTotal}
				{goToStep}
				STEPS_PAYMENT={STEPS.PAYMENT}
			/>
		{/if}

		<!-- Step 5: Order Confirmation -->
		{#if currentStep === STEPS.CONFIRMATION}
			<CheckoutConfirmation
				{completedOrder}
				{formatPrice}
				{continueShopping}
			/>
		{/if}
	</div>
</div>

<style lang="scss">
	@use 'sass:color';
	@use 'sass:math';
	@use '../../../sveltekit/src/styles/variables' as *;
	@use '../../../sveltekit/src/styles/mixins' as *;

	.goo {
		&__checkout-page {
			padding: $spacing-large;
			max-width: 1000px;
			margin: 0 auto;
			font-family: $font-family-base;

			h1 {
				font-size: $font-size-h1;
				color: $color-primary;
				margin-bottom: $spacing-large;
				text-align: center;
			}
		}

		&__checkout-steps {
			display: flex;
			justify-content: center;
			align-items: center;
			margin-bottom: $spacing-xlarge;

			@media (max-width: 768px) {
				flex-wrap: wrap;
				gap: $spacing-small;
			}
		}

		&__checkout-step {
			display: flex;
			align-items: center;
			color: $color-text-secondary;
			cursor: pointer;

			&.active {
				color: $color-primary;
				font-weight: bold;

				.goo__step-number {
					background-color: $color-primary;
					color: $white;
					border-color: $color-primary;
				}
			}

			&:hover:not(.active) {
				color: $color-text-primary;

				.goo__step-number {
					border-color: $color-text-primary;
				}
			}
		}

		&__step-number {
			width: 30px;
			height: 30px;
			border-radius: 50%;
			border: 1px solid $color-border;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: $spacing-small;
			transition: all 0.2s ease;
		}

		&__step-divider {
			width: 40px;
			height: 1px;
			background-color: $color-border;
			margin: 0 $spacing-small;

			@media (max-width: 768px) {
				display: none;
			}
		}

		&__checkout-content {
			background-color: $color-background-light;
			border-radius: $border-radius-medium;
			border: 1px solid $color-border;
			overflow: hidden;
		}
	}
</style>