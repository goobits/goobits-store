<script>
	import { Loader2 } from '@lucide/svelte'
	import { createEventDispatcher } from 'svelte'

	// Props
	let {
		formData = {
			card_number: '',
			expiry_date: '',
			cvv: '',
			card_name: ''
		},
		errors = {},
		isSubmitting = false
	} = $props()

	const dispatch = createEventDispatcher()

	// SECURITY WARNING: This component is for demonstration only.
	// NEVER handle real card details in client-side JavaScript.
	// Use Stripe Elements or your payment provider's SDK instead.
	
	// Form state - for demo purposes only
	let localFormData = $state({
		card_number: formData.card_number,
		expiry_date: formData.expiry_date,
		cvv: formData.cvv,
		card_name: formData.card_name
	})

	// Track touched fields for validation
	let touched = $state({
		card_number: false,
		expiry_date: false,
		cvv: false,
		card_name: false
	})

	// Sync local form data with prop changes
	$effect(() => {
		localFormData = {
			card_number: formData.card_number,
			expiry_date: formData.expiry_date,
			cvv: formData.cvv,
			card_name: formData.card_name
		}
	})

	// Validation functions
	function validateCardNumber(value) {
		// WARNING: This is basic validation only.
		// Real payment processing must happen server-side.
		// Use tokenization from Stripe/payment provider.
		const cardNumber = value.replace(/\s/g, '')
		if (!cardNumber) return 'Card number is required'
		if (!/^\d{13,19}$/.test(cardNumber)) return 'Invalid card number'
		return null
	}

	function validateExpiryDate(value) {
		if (!value) return 'Expiry date is required'
		
		// Check format
		if (!/^\d{2}\/\d{2}$/.test(value)) return 'Invalid format (MM/YY)'
		
		const [month, year] = value.split('/')
		const currentYear = new Date().getFullYear() % 100 // Get last 2 digits
		const currentMonth = new Date().getMonth() + 1 // 1-12
		
		// Convert to numbers
		const monthNum = parseInt(month, 10)
		const yearNum = parseInt(year, 10)
		
		// Validate month
		if (monthNum < 1 || monthNum > 12) return 'Invalid month'
		
		// Validate year and expiration
		if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
			return 'Card has expired'
		}
		
		return null
	}

	function validateCVV(value) {
		if (!value) return 'Security code is required'
		if (!/^\d{3,4}$/.test(value)) return 'Invalid security code'
		return null
	}

	function validateCardName(value) {
		if (!value.trim()) return 'Name on card is required'
		if (value.trim().length < 3) return 'Please enter full name'
		return null
	}

	// Validate all fields
	function validateAll() {
		const newErrors = {}
		
		newErrors.card_number = validateCardNumber(localFormData.card_number)
		newErrors.expiry_date = validateExpiryDate(localFormData.expiry_date)
		newErrors.cvv = validateCVV(localFormData.cvv)
		newErrors.card_name = validateCardName(localFormData.card_name)
		
		// Mark all fields as touched for displaying errors
		touched = {
			card_number: true,
			expiry_date: true,
			cvv: true,
			card_name: true
		}
		
		// Return true if valid (no errors)
		return !Object.values(newErrors).some(error => error !== null)
	}

	// Handle field changes with validation
	function handleCardNumberInput(e) {
		// Format card number with spaces
		const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
		const formattedValue = value.replace(/(.{4})/g, '$1 ').trim()
		
		localFormData.card_number = formattedValue
		e.target.value = formattedValue
		
		if (touched.card_number) {
			errors.card_number = validateCardNumber(formattedValue)
		}
		
		dispatch('change', { field: 'card_number', value: formattedValue })
	}

	function handleExpiryDateInput(e) {
		// Format expiry date with slash
		const value = e.target.value.replace(/\D/g, '')
		let formattedValue = value
		
		if (value.length > 2) {
			formattedValue = value.slice(0, 2) + '/' + value.slice(2, 4)
		}
		
		localFormData.expiry_date = formattedValue
		e.target.value = formattedValue
		
		if (touched.expiry_date) {
			errors.expiry_date = validateExpiryDate(formattedValue)
		}
		
		dispatch('change', { field: 'expiry_date', value: formattedValue })
	}

	function handleCVVInput(e) {
		// Only allow numbers
		const value = e.target.value.replace(/\D/g, '')
		
		localFormData.cvv = value
		e.target.value = value
		
		if (touched.cvv) {
			errors.cvv = validateCVV(value)
		}
		
		dispatch('change', { field: 'cvv', value })
	}

	function handleCardNameInput(e) {
		const value = e.target.value
		
		localFormData.card_name = value
		
		if (touched.card_name) {
			errors.card_name = validateCardName(value)
		}
		
		dispatch('change', { field: 'card_name', value })
	}

	// Handle form submission
	function handleSubmit() {
		const isValid = validateAll()
		
		if (isValid) {
			dispatch('submit', localFormData)
		} else {
			dispatch('validation-error', errors)
		}
	}

	// Mark fields as touched on blur
	function handleBlur(field) {
		touched[field] = true
		
		// Validate the field
		switch (field) {
			case 'card_number':
				errors.card_number = validateCardNumber(localFormData.card_number)
				break
			case 'expiry_date':
				errors.expiry_date = validateExpiryDate(localFormData.expiry_date)
				break
			case 'cvv':
				errors.cvv = validateCVV(localFormData.cvv)
				break
			case 'card_name':
				errors.card_name = validateCardName(localFormData.card_name)
				break
		}
		
		dispatch('blur', { field, touched: true })
	}
</script>

<div class="payment-form">
	<h3 class="payment-form__title">Payment Information</h3>
	
	<div class="payment-form__fields">
		<!-- Card Number -->
		<div class="payment-form__form-group">
			<label for="card_number" class="payment-form__label">
				Card Number <span class="required">*</span>
			</label>
			<input
				type="text"
				id="card_number"
				class="payment-form__input"
				class:payment-form__input-error={touched.card_number && errors.card_number}
				placeholder="1234 5678 9012 3456"
				value={localFormData.card_number}
				oninput={handleCardNumberInput}
				onblur={() => handleBlur('card_number')}
				maxlength="19"
				autocomplete="cc-number"
			/>
			{#if touched.card_number && errors.card_number}
				<div class="payment-form__error-message">
					{errors.card_number}
				</div>
			{/if}
		</div>
		
		<!-- Expiry Date and CVV -->
		<div class="payment-form__form-row">
			<div class="payment-form__form-group">
				<label for="expiry_date" class="payment-form__label">
					Expiry Date <span class="required">*</span>
				</label>
				<input
					type="text"
					id="expiry_date"
					class="payment-form__input"
					class:payment-form__input-error={touched.expiry_date && errors.expiry_date}
					placeholder="MM/YY"
					value={localFormData.expiry_date}
					oninput={handleExpiryDateInput}
					onblur={() => handleBlur('expiry_date')}
					maxlength="5"
					autocomplete="cc-exp"
				/>
				{#if touched.expiry_date && errors.expiry_date}
					<div class="payment-form__error-message">
						{errors.expiry_date}
					</div>
				{/if}
			</div>
			
			<div class="payment-form__form-group">
				<label for="cvv" class="payment-form__label">
					Security Code (CVV) <span class="required">*</span>
				</label>
				<input
					type="text"
					id="cvv"
					class="payment-form__input"
					class:payment-form__input-error={touched.cvv && errors.cvv}
					placeholder="123"
					value={localFormData.cvv}
					oninput={handleCVVInput}
					onblur={() => handleBlur('cvv')}
					maxlength="4"
					autocomplete="cc-csc"
				/>
				{#if touched.cvv && errors.cvv}
					<div class="payment-form__error-message">
						{errors.cvv}
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Name on Card -->
		<div class="payment-form__form-group">
			<label for="card_name" class="payment-form__label">
				Name on Card <span class="required">*</span>
			</label>
			<input
				type="text"
				id="card_name"
				class="payment-form__input"
				class:payment-form__input-error={touched.card_name && errors.card_name}
				placeholder="John Doe"
				value={localFormData.card_name}
				oninput={handleCardNameInput}
				onblur={() => handleBlur('card_name')}
				autocomplete="cc-name"
			/>
			{#if touched.card_name && errors.card_name}
				<div class="payment-form__error-message">
					{errors.card_name}
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Payment Method Icons -->
	<div class="payment-form__payment-methods">
		<div class="payment-form__payment-method-icons">
			<span class="payment-form__payment-icon visa">
				<i class="fa fa-cc-visa"></i>
			</span>
			<span class="payment-form__payment-icon mastercard">
				<i class="fa fa-cc-mastercard"></i>
			</span>
			<span class="payment-form__payment-icon amex">
				<i class="fa fa-cc-amex"></i>
			</span>
			<span class="payment-form__payment-icon discover">
				<i class="fa fa-cc-discover"></i>
			</span>
		</div>
		<p class="payment-form__security-note">
			<i class="fa fa-lock"></i> Your payment information is secure and encrypted
		</p>
	</div>
	
	<button
		type="button"
		class="payment-form__submit-button"
		onclick={handleSubmit}
		disabled={isSubmitting}
	>
		{#if isSubmitting}
			<Loader2 class="animate-spin" size={18} />
			<span>Processing...</span>
		{:else}
			<span>Submit Payment</span>
		{/if}
	</button>
</div>

<style lang="scss">
	.payment-form {
		margin-top: 1.5rem;
		
		&__title {
			font-size: 1.25rem;
			font-weight: 600;
			margin-bottom: 1rem;
			color: #b45309;
		}
		
		&__fields {
			margin-bottom: 1.5rem;
		}
		
		&__form-group {
			margin-bottom: 1rem;
			
			&:last-child {
				margin-bottom: 0;
			}
		}
		
		&__form-row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1rem;
			
			@media (max-width: 480px) {
				grid-template-columns: 1fr;
			}
		}
		
		&__label {
			display: block;
			margin-bottom: 0.5rem;
			font-weight: 500;
			color: #4b5563;
			
			.required {
				color: #ef4444;
			}
		}
		
		&__input {
			width: 100%;
			padding: 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 0.375rem;
			font-size: 0.875rem;
			transition: border-color 0.2s, box-shadow 0.2s;
			
			&:focus {
				border-color: #f59e0b;
				outline: none;
				box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
			}
			
			&-error {
				border-color: #ef4444;
				
				&:focus {
					border-color: #ef4444;
					box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
				}
			}
		}
		
		&__error-message {
			margin-top: 0.25rem;
			color: #ef4444;
			font-size: 0.75rem;
		}
		
		&__payment-methods {
			margin-top: 1.5rem;
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		
		&__payment-method-icons {
			display: flex;
			gap: 0.75rem;
			margin-bottom: 0.75rem;
		}
		
		&__payment-icon {
			font-size: 1.5rem;
			
			&.visa {
				color: #1434cb;
			}
			
			&.mastercard {
				color: #eb001b;
			}
			
			&.amex {
				color: #2e77bb;
			}
			
			&.discover {
				color: #ff6000;
			}
		}
		
		&__security-note {
			font-size: 0.75rem;
			color: #6b7280;
			
			i {
				color: #10b981;
				margin-right: 0.25rem;
			}
		}
		
		&__submit-button {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			background-color: #f59e0b;
			color: white;
			border: none;
			border-radius: 0.375rem;
			font-weight: 500;
			cursor: pointer;
			transition: background-color 0.2s, transform 0.1s;
			
			&:hover:not(:disabled) {
				background-color: #d97706;
			}
			
			&:active:not(:disabled) {
				transform: translateY(1px);
			}
			
			&:disabled {
				opacity: 0.7;
				cursor: not-allowed;
			}
		}
	}
</style>