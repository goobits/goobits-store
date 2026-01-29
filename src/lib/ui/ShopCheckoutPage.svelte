<script lang="ts">
	// This component contains the existing checkout functionality
	// For now, we'll import and wrap the existing functionality
	import { clearCart } from '@goobits/store'
	import { goto } from '$app/navigation'
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import { Logger } from '@lib/utils/Logger'
	import { user as customer } from '@lib/stores/auth-simple'

	// Import checkout components from store package
	import CheckoutCustomerInfo from './Checkout/CheckoutCustomerInfo.svelte'
	import CheckoutShipping from './Checkout/CheckoutShipping.svelte'
	import CheckoutPayment from './Checkout/CheckoutPayment.svelte'
	import CheckoutReview from './Checkout/CheckoutReview.svelte'
	import CheckoutConfirmation from './Checkout/CheckoutConfirmation.svelte'

	// Import checkout utilities directly to avoid circular dependency
	import * as CheckoutUtils from '../utils/checkoutUtils'

	interface CustomerInfo {
		email: string;
		first_name: string;
		last_name: string;
	}

	interface ShippingAddress {
		first_name: string;
		last_name: string;
		address_1: string;
		address_2: string;
		city: string;
		province: string;
		postal_code: string;
		country_code: string;
		phone: string;
	}

	interface ShippingOption {
		id: string;
		name?: string;
		amount?: number;
		[key: string]: unknown;
	}

	interface SavedCheckoutState {
		currentStep?: string;
		customerInfo?: CustomerInfo;
		shippingAddress?: ShippingAddress;
		selectedShippingOption?: string;
		useSameAddress?: boolean;
	}

	interface FormData {
		success?: boolean;
		error?: string;
		order?: MedusaOrder;
	}

	interface PaymentErrors {
		general?: string;
		[key: string]: string | undefined;
	}

	interface PaymentIntent {
		id: string;
		status: string;
		[key: string]: unknown;
	}

	interface PageData {
		cart?: MedusaCart;
		defaultRegion?: MedusaRegion | null;
		shippingOptions?: ShippingOption[];
		[key: string]: unknown;
	}

	interface Props {
		data: PageData;
		form?: FormData;
	}

	const { data, form = undefined }: Props = $props()

	const logger = new Logger('Checkout')

	// Debug: log when component loads
	logger.info('ShopCheckoutPage loading...')
	// eslint-disable-next-line svelte/valid-compile -- debug logging intentionally captures initial values
	logger.info('Data cart:', data?.cart?.id)
	// eslint-disable-next-line svelte/valid-compile -- debug logging intentionally captures initial values
	logger.info('Data regions:', data?.defaultRegion)

	// Setup lifecycle hooks
	onMount(() => {
		// Initialize session storage for checkout
		if (browser && typeof window !== 'undefined') {
			// Populate customer data from store if available and not already loaded from session
			const unsubscribe = customer.subscribe((value: MedusaCustomer | null) => {
				if (value && !savedState?.customerInfo) {
					// Only populate if we don't have saved state
					customerInfo.email = value.email || ''
					customerInfo.first_name = value.first_name || ''
					customerInfo.last_name = value.last_name || ''

					shippingAddress.first_name = value.first_name || ''
					shippingAddress.last_name = value.last_name || ''
					shippingAddress.phone = value.phone || ''
				}
			})

			return unsubscribe
		}
	})

	onDestroy(() => {
		// Clean up if needed
		// We'll keep the session storage data for page refreshes
	})

	// Extract checkout data
	const medusaCart: MedusaCart = $derived(data.cart || {} as MedusaCart)
	const defaultRegion: MedusaRegion | null = $derived(data.defaultRegion || null)
	const shippingOptions: ShippingOption[] = $derived(data.shippingOptions || [])

	// Checkout steps
	const STEPS = {
		INFORMATION: 'information',
		SHIPPING: 'shipping',
		PAYMENT: 'payment',
		REVIEW: 'review',
		CONFIRMATION: 'confirmation'
	} as const

	type StepType = typeof STEPS[keyof typeof STEPS]

	// Load state from session storage or use defaults
	function loadCheckoutState(): SavedCheckoutState | null {
		if (!browser) return null

		try {
			const savedState = sessionStorage.getItem('checkout_state')
			return savedState ? JSON.parse(savedState) as SavedCheckoutState : null
		} catch (e) {
			logger.error('Error loading checkout state:', e)
			return null
		}
	}

	const savedState = loadCheckoutState()

	// Initialize form state (either from session storage or defaults)
	let currentStep: StepType = $state((savedState?.currentStep as StepType) || STEPS.INFORMATION)
	let completedOrder: MedusaOrder | null = $state(null)
	let orderError: string = $state('')
	let formSubmitting: boolean = $state(false)
	let paymentErrors: PaymentErrors = $state({})

	// Payment state
	let paymentProcessed: boolean = $state(false)
	let paymentResult: PaymentIntent | null = $state(null)

	// Save checkout state to session storage
	function saveCheckoutState(): void {
		if (!browser) return

		try {
			const stateToSave: SavedCheckoutState = {
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
	// Initialize with empty values - we'll populate from customer store in onMount
	const customerInfo: CustomerInfo = $state(savedState?.customerInfo || {
		email: '',
		first_name: '',
		last_name: ''
	})

	// Get default country code from region (derived to ensure SSR consistency)
	const defaultCountry: string = $derived(defaultRegion?.countries?.[0]?.iso_2 || 'us')

	/* eslint-disable svelte/valid-compile -- defaultCountry reference is intentional for initial state */
	const shippingAddress: ShippingAddress = $state(savedState?.shippingAddress || {
		first_name: '',
		last_name: '',
		address_1: '',
		address_2: '',
		city: '',
		province: '',
		postal_code: '',
		country_code: defaultCountry,
		phone: ''
	})
	/* eslint-enable svelte/valid-compile */

	// Get default shipping option (derived to ensure SSR consistency)
	const defaultShippingOption: string = $derived(
		shippingOptions && shippingOptions.length > 0 ? shippingOptions[0].id : ''
	)

	// Initialize selected shipping option from saved state or default
	let selectedShippingOption: string = $state(savedState?.selectedShippingOption || '')

	// Auto-select default shipping option if none selected (client-side only to avoid form issues)
	$effect(() => {
		if (defaultShippingOption && !selectedShippingOption) {
			selectedShippingOption = defaultShippingOption
		}
	})

	logger.info('State initialization complete')

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
	async function handleCustomerInfoSubmit(_event: Event): Promise<void> {
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

	async function handleShippingAddressSubmit(_event: Event): Promise<void> {
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

	async function handleShippingMethodSubmit(_event: Event): Promise<void> {
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

	async function handlePaymentUpdate(_event: Event): Promise<void> {
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

	function handlePaymentSuccess(event: CustomEvent<{ paymentIntent: PaymentIntent }>): void {
		paymentProcessed = true
		paymentResult = event.detail.paymentIntent
		paymentErrors = {}

		// Move to review step
		currentStep = STEPS.REVIEW
		saveCheckoutState()
	}

	function handlePaymentError(event: CustomEvent<{ error: string }>): void {
		paymentProcessed = false
		paymentErrors.general = event.detail.error || 'Payment processing failed'
	}

	async function handlePlaceOrder(_event: Event): Promise<void> {
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
	function getSelectedShippingOption(): ShippingOption | undefined {
		return shippingOptions.find(option => option.id === selectedShippingOption)
	}

	function formatPrice(price: number): string {
		return CheckoutUtils.formatPrice(price)
	}

	function getLineItemTotal(item: MedusaLineItem): number {
		return CheckoutUtils.getLineItemTotal(item)
	}

	function getCartSubtotal(): number {
		return CheckoutUtils.getCartSubtotal(medusaCart)
	}

	function getShippingTotal(): number {
		return CheckoutUtils.getShippingTotal(medusaCart)
	}

	function getTaxTotal(): number {
		return CheckoutUtils.getTaxTotal(medusaCart)
	}

	function getOrderTotal(): number {
		return CheckoutUtils.getOrderTotal(medusaCart)
	}

	function goToStep(step: StepType): void {
		// Only allow going back to previous steps
		const steps = Object.values(STEPS)
		const currentIndex = steps.indexOf(currentStep)
		const targetIndex = steps.indexOf(step)

		if (targetIndex < currentIndex) {
			currentStep = step
		}
	}

	function continueShopping(): void {
		goto('/shop')
	}

	// eslint-disable-next-line svelte/valid-compile -- Debug logging intentionally captures initial values
	logger.info('About to render template, currentStep:', currentStep)
	// eslint-disable-next-line svelte/valid-compile -- Debug logging intentionally captures initial values
	logger.info('medusaCart id:', medusaCart?.id)
</script>

<div class="goo__checkout-page">
	<h1>Checkout</h1>

	<!-- Checkout Navigation -->
	<div class="goo__checkout-steps">
		<div class="goo__checkout-step"
			 class:active={currentStep === STEPS.INFORMATION}
			 onclick={() => goToStep(STEPS.INFORMATION)}
			 onkeydown={(e) => e.key === 'Enter' && goToStep(STEPS.INFORMATION)}
			 tabindex="0"
			 role="button">
			<span class="goo__step-number">1</span>
			<span class="goo__step-name">Information</span>
		</div>
		<div class="goo__step-divider"></div>
		<div class="goo__checkout-step"
			 class:active={currentStep === STEPS.SHIPPING}
			 onclick={() => goToStep(STEPS.SHIPPING)}
			 onkeydown={(e) => e.key === 'Enter' && goToStep(STEPS.SHIPPING)}
			 tabindex="0"
			 role="button">
			<span class="goo__step-number">2</span>
			<span class="goo__step-name">Shipping</span>
		</div>
		<div class="goo__step-divider"></div>
		<div class="goo__checkout-step"
			 class:active={currentStep === STEPS.PAYMENT}
			 onclick={() => goToStep(STEPS.PAYMENT)}
			 onkeydown={(e) => e.key === 'Enter' && goToStep(STEPS.PAYMENT)}
			 tabindex="0"
			 role="button">
			<span class="goo__step-number">3</span>
			<span class="goo__step-name">Payment</span>
		</div>
		<div class="goo__step-divider"></div>
		<div class="goo__checkout-step"
			 class:active={currentStep === STEPS.REVIEW}
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
	@use './variables.scss' as *;
	@use './mixins.scss' as *;

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
