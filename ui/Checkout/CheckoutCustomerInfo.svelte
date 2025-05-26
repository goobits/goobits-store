<script>
	import { enhance } from '$app/forms'
	import { preventDefault } from 'svelte/legacy'

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
</script>

<div class="goo__checkout-section">
	<h2>Contact Information</h2>
	
	<form method="POST" action="?/updateCustomer" use:enhance onsubmit={preventDefault(handleCustomerInfoSubmit)}>
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