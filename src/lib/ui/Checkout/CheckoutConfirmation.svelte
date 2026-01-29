<script lang="ts">
	import { createMessageGetter } from '../../utils/messages'
	import { defaultMessages } from '../../config/defaultMessages'

	interface CompletedOrder {
		id: string;
		display_id?: number;
		email: string;
		created_at: string;
		subtotal: number;
		shipping_total: number;
		tax_total: number;
		total: number;
		shipping_address?: {
			first_name: string;
			last_name: string;
			address_1: string;
			address_2?: string;
			city: string;
			province: string;
			postal_code: string;
			country_code: string;
		};
	}

	interface Props {
		completedOrder: CompletedOrder;
		formatPrice: (amount: number) => string;
		continueShopping: () => void;
		messages?: Record<string, string>;
		locale?: string;
	}

	const {
		completedOrder,
		formatPrice,
		continueShopping,
		messages = {},
		locale = 'en-US'
	}: Props = $props()

	// Create message getter - cast to string since we always provide fallback
	const messageGetter = $derived(createMessageGetter({ ...defaultMessages, ...messages }))
	const msg = (key: string, fallback: string): string => String(messageGetter(key, fallback))
</script>

<div class="goo__checkout-section goo__confirmation">
	<div class="goo__confirmation-header">
		<div class="goo__confirmation-icon">✓</div>
		<h2>{msg('thankYouForOrder', 'Thank you!')}</h2>
		<p>{msg('orderSuccess', 'Your order has been placed successfully.')}</p>
	</div>

	{#if completedOrder}
		<div class="goo__confirmation-details">
			<div class="goo__confirmation-info">
				<h3>{msg('orderInformation', 'Order Information')}</h3>
				<p><strong>{msg('orderNumber', 'Order Number')}:</strong> {completedOrder.display_id || completedOrder.id}</p>
				<p><strong>{msg('date', 'Date')}:</strong> {new Date(completedOrder.created_at).toLocaleDateString(locale)}</p>
				<p><strong>{msg('email', 'Email')}:</strong> {completedOrder.email}</p>
			</div>

			<div class="goo__confirmation-summary">
				<h3>{msg('orderSummary', 'Order Summary')}</h3>
				<div class="goo__summary-row">
					<span>{msg('subtotal', 'Subtotal')}</span>
					<span>{msg('currency', '$')}{formatPrice(completedOrder.subtotal)}</span>
				</div>
				<div class="goo__summary-row">
					<span>{msg('shipping', 'Shipping')}</span>
					<span>{msg('currency', '$')}{formatPrice(completedOrder.shipping_total)}</span>
				</div>
				{#if completedOrder.tax_total > 0}
					<div class="goo__summary-row">
						<span>{msg('tax', 'Tax')}</span>
						<span>{msg('currency', '$')}{formatPrice(completedOrder.tax_total)}</span>
					</div>
				{/if}
				<div class="goo__summary-row goo__summary-total">
					<span>{msg('total', 'Total')}</span>
					<span>{msg('currency', '$')}{formatPrice(completedOrder.total)}</span>
				</div>
			</div>

			{#if completedOrder.shipping_address}
				<div class="goo__confirmation-shipping">
					<h3>{msg('shippingInformation', 'Shipping Information')}</h3>
					<p>
						{completedOrder.shipping_address.first_name} {completedOrder.shipping_address.last_name}<br>
						{completedOrder.shipping_address.address_1}<br>
						{#if completedOrder.shipping_address.address_2}
							{completedOrder.shipping_address.address_2}<br>
						{/if}
						{completedOrder.shipping_address.city}, {completedOrder.shipping_address.province} {completedOrder.shipping_address.postal_code}<br>
						{completedOrder.shipping_address.country_code}
					</p>
				</div>
			{/if}
		</div>
	{/if}

	<div class="goo__confirmation-actions">
		<button
			class="goo__btn goo__btn--primary"
			onclick={continueShopping}
		>
			{msg('continueShopping', 'Continue Shopping')}
		</button>
	</div>
</div>

<style lang="scss">
	@use 'sass:color';

	/* Define local variables for the component */
	$color-primary: #f59e0b;
	$color-primary-dark: #d97706;
	$color-success: #10b981;
	$white: #ffffff;
	$black: #000000;
	$light-gray: #f3f4f6;
	$spacing-small: 0.5rem;
	$spacing-medium: 1rem;
	$spacing-large: 1.5rem;
	$spacing-xlarge: 2rem;
	$font-size-small: 0.875rem;
	$font-size-medium: 1rem;
	$font-size-large: 1.125rem;
	$font-size-xlarge: 1.25rem;
	$font-size-h1: 2rem;
	$font-weight-medium: 500;
	$border-color: #e5e7eb;
	$border-radius-medium: 0.5rem;
	$border-radius-small: 0.25rem;

	/* Button mixin replacement */
	@mixin button($background, $hover-background, $text-color: $white) {
		background-color: $background;
		color: $text-color;
		padding: $spacing-small $spacing-medium;
		border: 1px solid transparent;
		border-radius: $border-radius-small;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-block;
		font-size: $font-size-medium;

		&:hover {
			background-color: $hover-background;
			transform: translateY(-1px);
		}

		&:active {
			transform: translateY(0);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;

			&:hover {
				transform: none;
			}
		}
	}

	/* Button primary mixin */
	@mixin button-primary {
		@include button($color-primary, $color-primary-dark);
	}

	.goo {
		&__confirmation {
			text-align: center;
			margin-top: $spacing-large;

			&-header {
				margin-bottom: $spacing-xlarge;
			}

			&-icon {
				display: inline-block;
				width: 80px;
				height: 80px;
				line-height: 80px;
				border-radius: 50%;
				background-color: $color-success;
				color: $white;
				font-size: 40px;
				margin-bottom: $spacing-medium;
			}

			&-details {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
				gap: $spacing-large;
				margin: $spacing-large 0;
				text-align: left;
			}

			&-info,
			// &-summary,
			&-shipping {
				background-color: $light-gray;
				border-radius: $border-radius-medium;
				padding: $spacing-medium;

				h3 {
					margin-bottom: $spacing-medium;
					font-size: $font-size-medium;
				}

				p {
					margin-bottom: $spacing-small;

					&:last-child {
						margin-bottom: 0;
					}
				}
			}

			&-actions {
				margin-top: $spacing-xlarge;
			}
		}

		&__summary {
			&-row {
				display: flex;
				justify-content: space-between;
				margin-bottom: $spacing-small;

				&:last-child {
					margin-bottom: 0;
				}
			}

			&-total {
				font-weight: bold;
				font-size: $font-size-medium;
				border-top: 1px solid $border-color;
				padding-top: $spacing-small;
				margin-top: $spacing-small;
			}
		}

		&__btn {
			&--primary {
				@include button-primary;
			}
		}
	}
</style>
