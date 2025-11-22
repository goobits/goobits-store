# @goobits/store

**Version 1.8.0** - Stable

Reusable e-commerce store components and utilities for Goobits projects built on Medusa v2.

Part of the Goobits monorepo ecosystem with shared `@goobits/logger`, `@goobits/security`, and `@goobits/ui` packages.

## Table of Contents

- [Security Notice](#security-notice)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Internationalization](#internationalization-i18n)
- [Components](#components)
- [Styling](#styling)
- [Accessibility](#accessibility)
- [License](#license)

## Security Notice

**This package contains demo payment forms that are NOT suitable for production use.**

- NEVER handle real credit card details in client-side JavaScript
- Use Stripe Elements or your payment provider's official SDK
- All payment processing MUST happen server-side
- This package is for demonstration purposes only

Using this package for real payment processing violates PCI compliance and could result in legal liability.

## Features

- Full shopping cart functionality with Medusa v2 integration
- Checkout flow with Stripe integration and payment service abstraction
- Multi-factor authentication (MFA) components with enrollment wizard
- Subscription management components (Subscribe & Save, Subscription Detail)
- Responsive design with Svelte 5 runes mode
- Built-in internationalization (i18n) support
- Accessibility compliant (WCAG)
- Customizable styling with BEM naming and SCSS variables
- Structured logging with `@goobits/logger` integration
- Integrates with `@goobits/security` for CSRF and validation

## Installation

```bash
npm install @goobits/store
```

### Peer Dependencies

Install required peer dependencies:

```bash
# Core (required)
npm install @sveltejs/kit@^2.0.0 svelte@^5.0.0

# Forms (required)
npm install formsnap@^2.0.0 sveltekit-superforms@^2.25.0 zod@^3.23.0

# Payment (required for checkout)
npm install @stripe/stripe-js@^5.0.0

# Icons (required for UI components)
npm install @lucide/svelte@^0.548.0
```

## Quick Start

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

## Configuration

### Store Configuration

The package exports a default `storeConfig` object that can be customized:

```js
// src/lib/store-config.js
import { getStoreConfig } from '@goobits/store/config'

export const config = getStoreConfig({
  shopUri: '/shop',
  currency: 'USD',
  currencySymbol: '$',
  pagination: {
    productsPerBatch: 12,
    productsPerPage: 24
  },
  checkout: {
    steps: ['customer', 'shipping', 'payment', 'review', 'confirmation']
  },
  i18n: {
    enabled: true,
    defaultLanguage: 'en'
  }
})
```

### URL Configuration

Helper functions for environment-aware URLs:

```js
import { getBackendUrl, getAppUrl, getPublishableKey } from '@goobits/store/config'

// Uses process.env.PUBLIC_MEDUSA_BACKEND_URL or fallback
const backendUrl = getBackendUrl()

// Or pass explicit values
const backendUrl = getBackendUrl('https://api.example.com')
```

### Stripe Configuration

```js
import { configureStripe, getStripe } from '@goobits/store/payment'

// Configure globally
configureStripe('pk_live_...')

// Or get instance with explicit key
const stripe = await getStripe('pk_live_...')
```

## Internationalization (i18n)

The store package supports full internationalization through multiple integration methods.

### Component-level Translation

All components accept a `messages` prop for direct translation override:

```svelte
<script>
  import { ShopNav } from '@goobits/store'

  // Spanish translations
  const messages = {
    products: 'Productos',
    cart: 'Carrito',
    backToMainSite: 'Volver al sitio principal'
  }
</script>

<ShopNav {messages} />
```

### Server Integration

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

### Page Integration

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

### Paraglide Integration

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

## Components

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

### MFA Components

Multi-factor authentication components for secure account management:

- `MFAEnrollmentWizard` - Complete MFA setup flow with QR code generation
- `MFAGracePeriodBanner` - Grace period warning banner
- `MFAGracePeriodWrapper` - Auto-fetching banner wrapper
- `MFAVerificationInput` - TOTP code input field
- `MFABackupCodeInput` - Backup code input
- `MFAAdminResetModal` - Admin MFA reset interface
- `mfaStatus` - MFA status utilities and store

See [MFA Integration Guide](./docs/mfa-integration.md) for detailed usage.

### Navigation

- `ShopNav` - Store navigation with cart indicator

## Styling

All components use BEM naming convention with the `goo__` namespace prefix.

### Customization

Components are built with SCSS and use internal variables defined in the package. To customize styling, override component styles in your application:

```scss
// src/app.scss
.goo__shop-nav {
  background-color: var(--your-custom-color);
}

.goo__checkout-payment {
  border-radius: 8px;
}
```

The package uses these internal color schemes:
- Primary: Amber tones (`#f59e0b`)
- Secondary: Green tones (`#16a34a`)
- Text: Gray scale
- Borders and shadows: Consistent with design system

## Accessibility

Components include:

- Semantic HTML structure
- ARIA attributes and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader announcements

## License

MIT
