# MFA Grace Period Banner Integration Guide

This guide explains how to integrate and use the MFA grace period warning banner in your application.

## Overview

The MFA grace period banner system provides a visual warning to admin users who have not yet enabled two-factor authentication. The banner appears at the top of the application and shows different levels of urgency based on how many days remain in the grace period.

## Components

### 1. MFAGracePeriodBanner.svelte

The core banner component that displays the warning message.

**Props:**
- `daysRemaining` (number): Days remaining in the grace period
- `gracePeriodEndsAt` (string): ISO date string when the grace period ends
- `onSetupNow` (function): Callback function when "Set up now" button is clicked

**Features:**
- Color-coded by urgency level:
  - **Blue (info)**: 30-8 days remaining
  - **Yellow (warning)**: 7-3 days remaining
  - **Red (critical)**: <3 days remaining
- Dismissible when >7 days remaining (stored in localStorage with 24-hour expiry)
- Non-dismissible when <7 days remaining
- Responsive design for mobile and desktop
- Accessible with ARIA attributes

**Example:**
```svelte
<script>
	import { MFAGracePeriodBanner } from '@goobits/store/ui'

	function handleSetup() {
		// Navigate to MFA setup page
		window.location.href = '/account/mfa'
	}
</script>

<MFAGracePeriodBanner
	daysRemaining={15}
	gracePeriodEndsAt="2025-12-01T00:00:00Z"
	onSetupNow={handleSetup}
/>
```

### 2. MFAGracePeriodWrapper.svelte

A wrapper component that automatically fetches MFA status and manages the banner display.

**Props:**
- `auth` (object): Auth store instance (must have a `subscribe` method)
- `backendUrl` (string): Medusa backend URL
- `onSetupNow` (function): Callback function when "Set up now" button is clicked

**Features:**
- Automatically fetches MFA status from the API
- Only shows banner when appropriate (MFA required but not enabled, in grace period)
- Handles loading and error states
- Integrates with authentication state

**Example:**
```svelte
<script>
	import { MFAGracePeriodWrapper } from '@goobits/store/ui'
	import { auth } from '$lib/stores/auth.js'
	import { PUBLIC_MEDUSA_BACKEND_URL } from '$env/static/public'

	function handleMFASetup() {
		window.location.href = '/shop/account?section=mfa'
	}
</script>

<MFAGracePeriodWrapper
	auth={auth}
	backendUrl={PUBLIC_MEDUSA_BACKEND_URL}
	onSetupNow={handleMFASetup}
/>
```

### 3. mfaStatus.js

Utility module for MFA status checking and management.

**Functions:**

#### `fetchMFAStatus(backendUrl, token)`
Fetches MFA status from the API.

**Parameters:**
- `backendUrl` (string): Medusa backend URL
- `token` (string): Auth token

**Returns:** Promise<Object> - MFA status object

**Example:**
```javascript
import { fetchMFAStatus } from '@goobits/store/ui'

const status = await fetchMFAStatus('http://localhost:3282', 'auth-token')
// Returns: { required, enabled, inGracePeriod, daysRemaining, gracePeriodEndsAt }
```

#### `shouldShowGracePeriodBanner(mfaStatus)`
Determines if the grace period banner should be shown.

**Parameters:**
- `mfaStatus` (object): MFA status from API

**Returns:** boolean

#### `getUrgencyLevel(daysRemaining)`
Gets the urgency level based on days remaining.

**Parameters:**
- `daysRemaining` (number): Days remaining in grace period

**Returns:** string - 'critical', 'urgent', 'warning', or 'info'

#### `createMFAStatusStore()`
Creates a Svelte-compatible store for MFA status.

**Returns:** Object with `subscribe`, `set`, and `load` methods

**Example:**
```javascript
import { createMFAStatusStore } from '@goobits/store/ui'

const mfaStatusStore = createMFAStatusStore()

// Subscribe to changes
mfaStatusStore.subscribe(status => {
	console.log('MFA Status:', status)
})

// Load status
await mfaStatusStore.load('http://localhost:3282', 'auth-token')
```

## Integration Examples

### Basic Integration (Recommended)

Use the wrapper component for the simplest integration:

```svelte
<!-- /workspace/sveltekit/src/routes/[[lang=lang]]/(framed)/shop/+layout.svelte -->
<script>
	import { MFAGracePeriodWrapper } from '@goobits/store/ui'
	import { auth } from '$lib/stores/auth.js'
	import { PUBLIC_MEDUSA_BACKEND_URL } from '$env/static/public'

	function handleMFASetup() {
		window.location.href = '/shop/account?section=mfa'
	}
</script>

<MFAGracePeriodWrapper
	auth={auth}
	backendUrl={PUBLIC_MEDUSA_BACKEND_URL}
	onSetupNow={handleMFASetup}
/>

<main>
	<!-- Your page content -->
</main>
```

### Advanced Integration

For more control, use the banner component directly with your own status fetching logic:

```svelte
<script>
	import { onMount } from 'svelte'
	import { MFAGracePeriodBanner } from '@goobits/store/ui'
	import { fetchMFAStatus, shouldShowGracePeriodBanner } from '@goobits/store/ui'

	let mfaStatus = $state(null)
	let showBanner = $derived(shouldShowGracePeriodBanner(mfaStatus))

	onMount(async () => {
		const status = await fetchMFAStatus(backendUrl, authToken)
		mfaStatus = status
	})

	function handleSetup() {
		// Custom setup logic
	}
</script>

{#if showBanner && mfaStatus}
	<MFAGracePeriodBanner
		daysRemaining={mfaStatus.daysRemaining}
		gracePeriodEndsAt={mfaStatus.gracePeriodEndsAt}
		onSetupNow={handleSetup}
	/>
{/if}
```

### Using the MFA Status Store

```javascript
import { createMFAStatusStore } from '@goobits/store/ui'

const mfaStatus = createMFAStatusStore()

// In your component
$effect(() => {
	if (authToken) {
		mfaStatus.load(backendUrl, authToken)
	}
})

// Access status
mfaStatus.subscribe(status => {
	if (status.inGracePeriod && status.daysRemaining < 3) {
		console.warn('MFA grace period expiring soon!')
	}
})
```

## API Endpoint

The banner requires the following API endpoint to be available:

**GET /admin/mfa/status**

**Authentication:** Required (Bearer token)

**Response:**
```json
{
	"success": true,
	"status": {
		"required": true,
		"enabled": false,
		"inGracePeriod": true,
		"daysRemaining": 15,
		"gracePeriodEndsAt": "2025-12-01T00:00:00Z",
		"verified": false
	}
}
```

## Styling

The banner uses SCSS variables from `/workspace/packages/store/ui/variables.scss`:

- `$blue-100`, `$blue-500`, `$blue-600`, `$blue-700` - Info level colors
- `$amber-100`, `$amber-200`, `$amber-600`, `$amber-700`, `$amber-800` - Warning colors
- `$red-500` - Critical level colors
- `$spacing-*` - Spacing values
- `$border-radius-*` - Border radius values
- `$font-weight-*` - Font weights

### Customizing Colors

To customize the banner colors, override the SCSS variables or modify the component's style section.

## Behavior Details

### Dismissal Logic

- Banners with ≥7 days remaining can be dismissed
- Dismissal is stored in localStorage with a 24-hour expiry
- Each urgency level has a separate dismissal key
- Dismissing at 15 days won't prevent the banner from showing when it reaches 7 days

### Storage Keys

- Format: `mfa-banner-dismissed-{daysRemaining}`
- Example: `mfa-banner-dismissed-15`
- Value: ISO date string when dismissal expires

### Urgency Levels

| Days Remaining | Urgency Level | Color  | Dismissible |
|---------------|---------------|--------|-------------|
| 30-14         | info          | Blue   | Yes         |
| 13-7          | warning       | Yellow | Yes         |
| 6-3           | urgent        | Yellow | No          |
| <3            | critical      | Red    | No          |

## Accessibility

The banner includes:
- `role="alert"` for screen reader announcements
- `aria-live="polite"` for dynamic updates
- `aria-label` on dismiss button
- Keyboard navigation support
- Focus management with visible focus indicators

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires localStorage support for dismissal functionality
- Degrades gracefully if localStorage is unavailable

## Testing

To test the banner in development:

1. Ensure the MFA API endpoint is available
2. Create a test user with MFA required but not enabled
3. Set the grace period to a small number of days
4. Log in and navigate to a page with the banner integration
5. Verify banner appearance and behavior at different urgency levels

## Troubleshooting

### Banner not appearing

1. Check that the API endpoint is accessible
2. Verify the auth token is valid
3. Ensure MFA is required for the user role
4. Check that MFA is not already enabled
5. Verify user is within the grace period

### Dismissal not working

1. Check browser console for localStorage errors
2. Verify daysRemaining prop is ≥7
3. Clear localStorage and test again

### Styling issues

1. Verify SCSS variables are imported correctly
2. Check that variables.scss is accessible
3. Inspect element to see computed styles

## Future Enhancements

Potential improvements for future versions:

- Animated transitions when banner appears/disappears
- Progress bar showing grace period timeline
- Integration with notification system
- Email reminders for expiring grace periods
- Admin dashboard for managing grace periods
