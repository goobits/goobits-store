<script>
	import { page } from '$app/stores'
	import { createMessageGetter } from '../utils/messages.js'
	import { defaultMessages } from '../config/defaultMessages.js'
	
	/**
	 * @typedef {Object} ShopNavProps
	 * @property {Object} [messages] - Custom messages for i18n
	 * @property {string} [shopName] - Custom shop name
	 * @property {string} [backUrl] - URL for back to main site link
	 * @property {Function} [getCartCount] - Function to get cart item count
	 * @property {string} [shopUrl] - URL for the shop page
	 * @property {string} [cartUrl] - URL for the cart page
	 */
	
	/** @type {ShopNavProps} */
	let {
		messages = {},
		shopName,
		backUrl = '/',
		getCartCount = () => 0,
		shopUrl = '/shop',
		cartUrl = '/shop/cart'
	} = $props()
	
	// Create message getter
	const getMessage = createMessageGetter({ ...defaultMessages, ...messages })
	
	// Determine if we're in the shop section
	let _isShopSection = $derived($page.url.pathname.startsWith(shopUrl))
	
	// Get cart item count
	let cartCount = $derived(getCartCount())
	
	// Get the shop name to display
	const displayShopName = shopName || getMessage('shopName', 'Shop')
</script>

<nav class="goo__shop-nav">
	<div class="goo__shop-nav-container">
		<div class="goo__shop-nav-logo">
			<a href={shopUrl}>{displayShopName}</a>
		</div>
		
		<div class="goo__shop-nav-links">
			<a 
				href={shopUrl} 
				class="goo__shop-nav-link {$page.url.pathname === shopUrl ? 'active' : ''}"
			>
				{getMessage('products', 'Products')}
			</a>
			<a 
				href={cartUrl}
				class="goo__shop-nav-link goo__cart-link {$page.url.pathname === cartUrl ? 'active' : ''}"
			>
				{getMessage('cart', 'Cart')} {cartCount > 0 ? `(${cartCount})` : ''}
			</a>
		</div>
		
		<div class="goo__shop-nav-main-site">
			<a href={backUrl}>{getMessage('backToMainSite', '← Back to Main Site')}</a>
		</div>
	</div>
</nav>

<style lang="scss">
	@use 'sass:color';

	/* Define local variables for the component */
	$color-primary: #f59e0b;
	$white: #ffffff;
	$spacing-small: 0.5rem;
	$spacing-medium: 1rem;
	$spacing-large: 1.5rem;
	$font-size-small: 0.875rem;
	$font-size-large: 1.125rem;

	.goo {
		&__shop-nav {
			background-color: $color-primary;
			padding: $spacing-medium 0;
			
			&-container {
				max-width: 1200px;
				margin: 0 auto;
				padding: 0 $spacing-large;
				display: flex;
				justify-content: space-between;
				align-items: center;
				
				@media (max-width: 768px) {
					flex-direction: column;
					gap: $spacing-medium;
				}
			}
			
			&-logo {
				a {
					text-decoration: none;
					color: $white;
					font-size: $font-size-large;
					font-weight: bold;
					
					&:hover {
						text-decoration: underline;
					}
				}
			}
			
			&-links {
				display: flex;
				gap: $spacing-large;
				
				@media (max-width: 768px) {
					gap: $spacing-medium;
				}
			}
			
			&-link {
				text-decoration: none;
				color: $white;
				transition: color 0.2s ease;
				
				&.active {
					font-weight: bold;
					text-decoration: underline;
				}
				
				&:hover {
					color: color.adjust($white, $alpha: -0.2);
				}
			}
			
			&-main-site {
				a {
					text-decoration: none;
					color: $white;
					font-size: $font-size-small;
					
					&:hover {
						text-decoration: underline;
					}
				}
			}
		}
		
		&__cart-link {
			position: relative;
		}
	}
</style>