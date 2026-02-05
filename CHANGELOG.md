# Changelog

All notable changes to the `@goobits/store` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-02-05

### Added
- **Comprehensive Test Suite** - 161 tests across 6 test files using Vitest
  - Cart store tests: quantity math, variant_id/id collision handling, edge cases
  - Checkout utils tests: price formatting, currency conversion, line item calculations
  - Validation tests: email validation edge cases, string sanitization
  - Slug utils tests: kebab-case conversion, acronym handling, path cleaning
  - Route handler tests: slug routing resolution, language handling
  - Tests focus on finding bugs rather than coverage metrics

### Changed
- **Full TypeScript Conversion** - Migrated entire codebase from JavaScript to TypeScript
  - Renamed all 30 .js files to .ts with proper type annotations
  - Added `lang="ts"` to all 30 Svelte components
  - Created comprehensive type interfaces for Medusa entities, component props, store states
  - Added type declarations for external modules (@goobits/forms, qrcode, etc.)
- **Strict TypeScript Configuration** - Enhanced type safety across the codebase
  - Enabled `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`
  - Enabled `noUnusedLocals` and `noUnusedParameters`
  - Added `@goobits/store` module declaration with cart store types
- **ESLint Configuration** - Added strict ESLint config with TypeScript and Svelte plugins
  - Fixed all ESLint errors across 45+ files
  - Proper const usage, arrow function styles, template literals
  - Svelte 5 state_referenced_locally warnings resolved with $derived()
- **Dependency Updates** - Updated all dev dependencies to latest versions
  - @sveltejs/kit 2.48.4 → 2.50.1
  - svelte 5.43.9 → 5.48.5
  - vite 7.2.2 → 7.3.1
  - sass-embedded 1.93.3 → 1.97.3

### Fixed
- **Type Safety Improvements** - Multiple strict TypeScript fixes
  - Added optional chaining for array index access (noUncheckedIndexedAccess)
  - Fixed $effect return paths in Svelte 5 components
  - Added proper null checks for medusaClient
  - Removed unused imports and variables
  - Fixed logger mock with proper no-op functions
- **AuthStore Compatibility** - Updated interfaces with loading and error properties
- **Test Infrastructure** - Cleaned up test files, removed unused @ts-expect-error directives

## [1.8.0] - 2025-11-19

### Fixed
- **Build Warnings** - Removed `import.meta.env` usage that only works with Vite bundler
  - Updated URL configuration functions to accept optional parameters instead of reading from `import.meta.env`
  - Stripe service now accepts public key via parameter or configuration function
  - StripeElements component properly imports and uses stripe services with default implementations
- **Package Structure** - Restructured to use standard `src/lib` layout for better SvelteKit compatibility
- **Build Performance** - Removed `vitePreprocess` to fix hanging builds

### Changed
- **API Flexibility** - URL and Stripe configuration functions now accept optional parameters
  - `getBackendUrl(envValue?)` - accepts optional backend URL
  - `getAppUrl(envValue?)` - accepts optional app URL
  - `getPublishableKey(envValue?)` - accepts optional publishable key
  - `getStripe(publicKey?)` - accepts optional Stripe public key
  - Added `configureStripe(publicKey)` for global Stripe configuration

## [1.7.0] - 2025-11-16

### Added
- **MFA Enrollment Wizard** - Complete multi-factor authentication setup flow
  - Dedicated MFA enrollment page with Apple-style design
  - QR code generation with light/dark theme support
  - Inline MFA wizard for seamless user experience
  - Password validation before MFA setup
  - Visual feedback for authenticator app selection
  - Theme-aware CSS variables for better integration
- **Subscription Failure Alerting** - Enhanced checkout handler with subscription failure detection
  - Detailed logging with recovery information
  - Improved error handling for subscription flows
- **Cart Persistence** - Storage event listener for external cart modifications
  - Synchronization across browser tabs
  - Better cart state management

### Changed
- **Dependency Updates** - Updated `@sveltejs/kit` to v2.48.4
- **Logging Migration** - Replaced `console.*` with structured Logger across components
  - MFA components now use `@goobits/logger`
  - Consistent logging throughout store package

### Fixed
- **SSR Hydration** - Resolved hydration mismatches across store components
  - Fixed client/server rendering inconsistencies
  - Improved component initialization
- **MFA UI Issues** - Multiple fixes for MFA enrollment and management
  - Fixed account page and MFA enrollment display issues
  - Corrected MFA disable handler to check both customer and user
  - Removed undefined Alert component references
  - Replaced Alert modals with inline FormErrors
  - Made app cards informational with proper validation flow
  - Fixed wizard to accept password prop

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
