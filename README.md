# @goobits/store

**Version 1.6.0** - Stable

Reusable e-commerce store components and utilities for Goobits projects built on Medusa v2.

Part of the Goobits monorepo ecosystem with shared `@goobits/logger`, `@goobits/security`, and `@goobits/ui` packages.

## 🔒 Security Notice

**This package contains demo payment forms that are NOT suitable for production use.**

- NEVER handle real credit card details in client-side JavaScript
- Use Stripe Elements or your payment provider's official SDK
- All payment processing MUST happen server-side
- This package is for demonstration purposes only

Using this package for real payment processing violates PCI compliance and could result in legal liability.

## ✨ Features

- 🛒 Full shopping cart functionality with Medusa v2 integration
- 💳 Checkout flow with Stripe integration and payment service abstraction
- 🔄 Subscription management components (Subscribe & Save, Subscription Detail)
- 📱 Responsive design with Svelte 5 runes mode
- 🌐 Built-in internationalization (i18n) support
- ♿ Accessibility compliant (WCAG)
- 🎨 Customizable styling with BEM naming and SCSS variables
- 📊 Structured logging with `@goobits/logger` integration
- 🔐 Integrates with `@goobits/security` for CSRF and validation

## 📦 Installation

```bash
npm install @goobits/store

# Required peer dependencies
npm install @sveltejs/kit formsnap svelte
```

## 🚀 Quick Start

```svelte
<script>
  import { ShopNav, CheckoutPayment } from '@goobits/store'
  
  // Optional: Provide custom messages for i18n
  const customMessages = {
    shopName: 'My Custom Shop',
    products: 'Our Products',
    cart: 'Shopping Cart'
  }
</script>

<ShopNav messages={customMessages} />
<CheckoutPayment messages={customMessages} />
```

## 🔧 Configuration

```js
// src/lib/store-config.js
export const storeConfig = {
  shopName: 'My Store',
  currencySymbol: '$',
  currencyCode: 'USD',

  stripe: {
    publicKey: 'YOUR_STRIPE_PUBLIC_KEY'
  }
}

// src/app.js
import { initStoreConfig } from '@goobits/store/config'
import { storeConfig } from '$lib/store-config.js'

initStoreConfig(storeConfig)
```

## 🌐 Internationalization (i18n)

The store package supports full internationalization through multiple integration methods:

### 1. Component-level Translation

All components accept a `messages` prop for direct translation override:

```svelte
<script>
  import { ShopNav } from '@goobits/store'
  
  // Spanish translations
  const messages = {
    products: 'Productos',
    cart: 'Carrito',
    backToMainSite: '← Volver al sitio principal'
  }
</script>

<ShopNav {messages} />
```

### 2. Server Integration

For full i18n with automatic language detection and routing:

```js
// hooks.server.js
import { handleStoreI18n } from '@goobits/store/i18n'

export async function handle({ event, resolve }) {
  // Add language info to event.locals
  await handleStoreI18n(event)
  
  // Continue with request handling
  return await resolve(event)
}
```

### 3. Page Integration

Enhance checkout pages with i18n data:

```js
// shop/checkout/+page.server.js
import { loadWithStoreI18n } from '@goobits/store/i18n'

export const load = async (event) => {
  return await loadWithStoreI18n(event, async () => {
    // Your original checkout data loading
    return { cart, shippingOptions }
  })
}
```

### 4. Paraglide Integration

For seamless integration with Paraglide (recommended):

```js
import { createMessageGetter } from '@goobits/store/i18n'
import * as m from '$paraglide/messages'

// Map store message keys to Paraglide translations
const getMessage = createMessageGetter({
  checkout: m.checkout,
  payment: m.payment,
  shipping: m.shipping
})
```

## 🧩 Components

### Checkout Components
- `CheckoutConfirmation` - Order confirmation page
- `CheckoutCustomerInfo` - Customer information form
- `CheckoutPayment` - Payment processing with Stripe
- `CheckoutReview` - Order review before payment
- `CheckoutShipping` - Shipping method selection

### Payment Components
- `PaymentForm` - Generic payment form
- `StripeElements` - Stripe Elements wrapper
- `StripePaymentForm` - Stripe-specific payment form
- `medusaPaymentService` - Abstracted payment service for Medusa
- `stripeService` - Reusable Stripe integration service

### Subscription Components
- `SubscribeAndSave` - Product page subscription option component
- `SubscriptionDetail` - Display subscription information and management
- Subscription utilities for managing recurring orders

### Navigation
- `ShopNav` - Store navigation with cart indicator

## 🎨 Styling

All components use BEM naming convention with the `goo__` namespace prefix:

```scss
// CSS variables for customization
:root {
  --goo-shop-primary: #f59e0b;
  --goo-shop-accent: #d97706;
  --goo-shop-text: #1f2937;
  --goo-shop-background: #ffffff;
  --goo-shop-border-radius: 0.25rem;
}
```

## ♿ Accessibility

Components include:
- Semantic HTML structure
- ARIA attributes and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader announcements

## 📄 License

ISC