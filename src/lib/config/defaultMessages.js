/**
 * Default messages for i18n support in @goobits/store
 * These can be overridden by passing a messages prop to components
 */

export const defaultMessages = {
	// Navigation
	shopName: 'Shop',
	products: 'Products',
	cart: 'Cart',
	backToMainSite: '← Back to Main Site',

	// Cart
	emptyCart: 'Your cart is empty',
	addToCart: 'Add to Cart',
	removeFromCart: 'Remove',
	quantity: 'Quantity',
	total: 'Total',
	subtotal: 'Subtotal',

	// Checkout
	checkout: 'Checkout',
	checkoutSteps: {
		customer: 'Customer Info',
		shipping: 'Shipping',
		payment: 'Payment',
		review: 'Review',
		confirmation: 'Confirmation'
	},

	// Customer info
	email: 'Email',
	firstName: 'First Name',
	lastName: 'Last Name',
	phone: 'Phone',
	address: 'Address',
	city: 'City',
	postalCode: 'Postal Code',
	country: 'Country',
	state: 'State/Province',

	// Shipping
	shippingMethod: 'Shipping Method',
	shippingAddress: 'Shipping Address',
	selectShippingMethod: 'Select a shipping method',

	// Payment
	paymentMethod: 'Payment Method',
	creditCard: 'Credit Card',
	cardNumber: 'Card Number',
	expiryDate: 'Expiry Date',
	cvv: 'CVV',
	billingAddress: 'Billing Address',
	sameAsShipping: 'Same as shipping address',

	// Review
	orderSummary: 'Order Summary',
	placeOrder: 'Place Order',
	orderTotal: 'Order Total',

	// Confirmation
	orderConfirmation: 'Order Confirmation',
	thankYouForOrder: 'Thank you for your order!',
	orderNumber: 'Order Number',
	estimatedDelivery: 'Estimated Delivery',

	// Actions
	continueToShipping: 'Continue to Shipping',
	continueToPayment: 'Continue to Payment',
	continueToReview: 'Review Order',
	goToCheckout: 'Go to Checkout',
	continueShopping: 'Continue Shopping',
	back: 'Back',
	next: 'Next',
	save: 'Save',
	cancel: 'Cancel',

	// Errors
	requiredField: 'This field is required',
	invalidEmail: 'Please enter a valid email',
	invalidCardNumber: 'Please enter a valid card number',
	genericError: 'An error occurred. Please try again.',

	// Success messages
	itemAddedToCart: 'Item added to cart',
	orderSuccess: 'Your order has been placed successfully!',

	// Currency
	currency: '$'
}