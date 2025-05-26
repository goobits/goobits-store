<script>
	import { enhance } from '$app/forms'
	import { preventDefault } from 'svelte/legacy'

	/**
	 * @typedef {Object} Props
	 * @property {Object} shippingAddress - The current shipping address
	 * @property {string} cartId - The cart ID
	 * @property {Object} form - Form data from the action
	 * @property {boolean} formSubmitting - Whether the form is currently submitting
	 * @property {Function} handleShippingAddressSubmit - Function to handle submission
	 * @property {Function} goToStep - Function to navigate between steps
	 * @property {Object} defaultRegion - The default region data with countries
	 * @property {string} STEPS_INFORMATION - The information step identifier
	 */

	/** @type {Props} */
	let { 
		shippingAddress, 
		cartId, 
		form, 
		formSubmitting, 
		handleShippingAddressSubmit, 
		goToStep,
		defaultRegion,
		STEPS_INFORMATION
	} = $props()
</script>

<div class="goo__checkout-section">
	<h2>Shipping Address</h2>
	
	<form method="POST" action="?/addShippingAddress" use:enhance onsubmit={preventDefault(handleShippingAddressSubmit)}>
		<input type="hidden" name="cart_id" value={cartId} />
		
		<div class="goo__form-row">
			<div class="goo__form-group">
				<label for="shipping_first_name">First Name <span class="required">*</span></label>
				<input type="text" id="shipping_first_name" name="first_name" required 
					bind:value={shippingAddress.first_name} />
			</div>
			
			<div class="goo__form-group">
				<label for="shipping_last_name">Last Name <span class="required">*</span></label>
				<input type="text" id="shipping_last_name" name="last_name" required 
					bind:value={shippingAddress.last_name} />
			</div>
		</div>
		
		<div class="goo__form-group">
			<label for="address_1">Address <span class="required">*</span></label>
			<input type="text" id="address_1" name="address_1" required bind:value={shippingAddress.address_1} />
		</div>
		
		<div class="goo__form-group">
			<label for="address_2">Apartment, suite, etc. (optional)</label>
			<input type="text" id="address_2" name="address_2" bind:value={shippingAddress.address_2} />
		</div>
		
		<div class="goo__form-row">
			<div class="goo__form-group">
				<label for="city">City <span class="required">*</span></label>
				<input type="text" id="city" name="city" required bind:value={shippingAddress.city} />
			</div>
			
			<div class="goo__form-group">
				<label for="postal_code">Postal Code <span class="required">*</span></label>
				<input type="text" id="postal_code" name="postal_code" required bind:value={shippingAddress.postal_code} />
			</div>
		</div>
		
		<div class="goo__form-row">
			<div class="goo__form-group">
				<label for="province">State/Province</label>
				<input type="text" id="province" name="province" bind:value={shippingAddress.province} />
			</div>
			
			<div class="goo__form-group">
				<label for="country_code">Country <span class="required">*</span></label>
				<select id="country_code" name="country_code" required bind:value={shippingAddress.country_code}>
					{#if defaultRegion && defaultRegion.countries}
						{#each defaultRegion.countries as country}
							<option value={country.iso_2}>{country.display_name}</option>
						{/each}
					{:else}
						<option value="us">United States</option>
					{/if}
				</select>
			</div>
		</div>
		
		<div class="goo__form-group">
			<label for="phone">Phone (optional)</label>
			<input type="tel" id="phone" name="phone" bind:value={shippingAddress.phone} />
		</div>
		
		{#if form && !form.success}
			<div class="goo__form-error">
				{form.error || 'An error occurred. Please try again.'}
			</div>
		{/if}
		
		<div class="goo__form-actions">
			<button type="button" class="goo__back-button" onclick={() => goToStep(STEPS_INFORMATION)}>
				Return to Information
			</button>
			<button type="submit" class="goo__continue-button" disabled={formSubmitting}>
				{formSubmitting ? 'Processing...' : 'Continue to Payment'}
			</button>
		</div>
	</form>
</div>