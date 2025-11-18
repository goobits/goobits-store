<script>
	/**
	 * @typedef {Object} Props
	 * @property {Object} customerInfo - The current customer information
	 * @property {string} cartId - The cart ID
	 * @property {Object} form - Form data from the action
	 * @property {boolean} formSubmitting - Whether the form is currently submitting
	 * @property {Function} handleCustomerInfoSubmit - Function to handle submission
	 * @property {Function} continueShopping - Function to navigate back to shopping
	 */

	/** @type {Props} */
	let {
		customerInfo,
		cartId,
		form,
		formSubmitting,
		handleCustomerInfoSubmit,
		continueShopping
	} = $props()

	function handleSubmit(event) {
		event.preventDefault()
		handleCustomerInfoSubmit(event)
	}
</script>

<div class="goo__checkout-section">
	<h2>Contact Information</h2>

	<form method="POST" action="?/updateCustomer" onsubmit={handleSubmit}>
		<input type="hidden" name="cart_id" value={cartId} />
		
		<div class="goo__form-group">
			<label for="email">Email <span class="required">*</span></label>
			<input type="email" id="email" name="email" required bind:value={customerInfo.email} />
		</div>
		
		<div class="goo__form-row">
			<div class="goo__form-group">
				<label for="first_name">First Name <span class="required">*</span></label>
				<input type="text" id="first_name" name="first_name" required bind:value={customerInfo.first_name} />
			</div>
			
			<div class="goo__form-group">
				<label for="last_name">Last Name <span class="required">*</span></label>
				<input type="text" id="last_name" name="last_name" required bind:value={customerInfo.last_name} />
			</div>
		</div>
		
		{#if form && !form.success}
			<div class="goo__form-error">
				{form.error || 'An error occurred. Please try again.'}
			</div>
		{/if}
		
		<div class="goo__form-actions">
			<button type="button" class="goo__back-button" onclick={continueShopping}>
				Return to Cart
			</button>
			<button type="submit" class="goo__continue-button" disabled={formSubmitting}>
				{formSubmitting ? 'Processing...' : 'Continue to Shipping'}
			</button>
		</div>
	</form>
</div>

<style>
	.goo__checkout-section {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
	}

	.goo__checkout-section h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		color: #333;
	}

	.goo__form-group {
		margin-bottom: 1rem;
	}

	.goo__form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #555;
	}

	.goo__form-group .required {
		color: #e53e3e;
	}

	.goo__form-group input,
	.goo__form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.goo__form-group input:focus,
	.goo__form-group select:focus {
		outline: none;
		border-color: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	.goo__form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.goo__form-error {
		background-color: #fee2e2;
		color: #991b1b;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.goo__form-actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 2rem;
	}

	.goo__back-button,
	.goo__continue-button {
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.goo__back-button {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		color: #374151;
	}

	.goo__back-button:hover {
		background: #e5e7eb;
	}

	.goo__continue-button {
		background: #f59e0b;
		border: none;
		color: white;
		flex: 1;
	}

	.goo__continue-button:hover:not(:disabled) {
		background: #d97706;
	}

	.goo__continue-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>