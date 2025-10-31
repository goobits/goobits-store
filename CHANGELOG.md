# Changelog

All notable changes to the `@goobits/store` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-10-30

### Added
- Payment service extraction: `medusaPaymentService` and `stripeService` for reusable payment processing
- Subscription components for multi-store reuse:
  - `SubscriptionDetail` component for displaying subscription information
  - `SubscribeAndSave` component for product pages
  - Reusable subscription utilities
- Logger integration with `@goobits/logger` for unified logging across monorepo
- Structured logging throughout store package (replaced console.log)

### Fixed
- Checkout handler imports to use relative paths and createLogger
- Route utils imports to use relative paths and createLogger
- Cart.js Logger import to use createLogger function
- UI component imports to use `@goobits/store` namespace
- Auth.js to use local cart and medusaClient imports
- Complete checkout flow with region_id, error handling, and styling
- Critical Svelte 5 bugs in cart component
- Shop page 500 error with comprehensive E2E test suite
- Product page routing and Medusa v2 API compatibility

### Changed
- Updated all components to Svelte 5 runes mode syntax
- Improved product pricing display with Medusa v2 support
- Migrated from Tailwind to SCSS variables for styling
- Updated dependencies to latest minor versions

### Infrastructure
- Integration with `@goobits/logger` package
- Added Medusa JS dependency for API communication
- Monorepo workspace structure with shared packages

## [1.0.0] - 2024-12-01

### Added
- Initial release of `@goobits/store` package
- Core e-commerce components:
  - Checkout flow components (CustomerInfo, Shipping, Payment, Review, Confirmation)
  - Shop navigation with cart indicator
  - Payment form components with Stripe integration
- Full shopping cart functionality
- Internationalization (i18n) support with multiple integration methods
- Responsive design with BEM naming convention
- Accessibility features (ARIA attributes, keyboard navigation, screen reader support)
- Demo payment forms (not production-ready, educational purposes only)

### Security
- Added prominent security notice about demo payment forms
- PCI compliance warnings
