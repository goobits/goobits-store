# MFA Grace Period Banner Integration

[Home](../README.md) > MFA Integration

Integrate the MFA grace period warning banner into your application. The banner alerts admin users who haven't enabled two-factor authentication, with urgency levels based on remaining grace period days.

## Components

### MFAGracePeriodBanner

The core banner component.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `daysRemaining` | number | Days remaining in grace period |
| `gracePeriodEndsAt` | string | ISO date when grace period ends |
| `onSetupNow` | function | Callback for "Set up now" button |

**Urgency Levels:**
| Days Remaining | Level | Color | Dismissible |
|----------------|-------|-------|-------------|
| 30-8 | info | Blue | Yes (24h) |
| 7-3 | warning | Yellow | Yes (24h) |
| <3 | critical | Red | No |

```svelte
<script>
  import { MFAGracePeriodBanner } from '@goobits/store/ui'
</script>

<MFAGracePeriodBanner
  daysRemaining={15}
  gracePeriodEndsAt="2025-12-01T00:00:00Z"
  onSetupNow={() => window.location.href = '/account/mfa'}
/>
```

### MFAGracePeriodWrapper

Auto-fetches MFA status and manages banner display.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `auth` | object | Auth store with `subscribe` method |
| `backendUrl` | string | Medusa backend URL |
| `onSetupNow` | function | Callback for "Set up now" button |

```svelte
<script>
  import { MFAGracePeriodWrapper } from '@goobits/store/ui'
  import { auth } from '$lib/stores/auth.js'
  import { PUBLIC_MEDUSA_BACKEND_URL } from '$env/static/public'
</script>

<MFAGracePeriodWrapper
  auth={auth}
  backendUrl={PUBLIC_MEDUSA_BACKEND_URL}
  onSetupNow={() => window.location.href = '/shop/account?section=mfa'}
/>
```

## Utility Functions

Import from `@goobits/store/ui`:

### fetchMFAStatus(backendUrl, token)

Fetches MFA status from the API.

```javascript
// src/lib/stores/auth.js
import { fetchMFAStatus } from '@goobits/store/ui'

const status = await fetchMFAStatus('http://localhost:3282', 'auth-token')
// Returns: { required, enabled, inGracePeriod, daysRemaining, gracePeriodEndsAt }
```

### shouldShowGracePeriodBanner(mfaStatus)

Returns `boolean` indicating if banner should display.

### getUrgencyLevel(daysRemaining)

Returns urgency level: `'critical'`, `'urgent'`, `'warning'`, or `'info'`.

### createMFAStatusStore()

Creates a Svelte-compatible store for MFA status.

```javascript
import { createMFAStatusStore } from '@goobits/store/ui'

const mfaStatus = createMFAStatusStore()

// Load status
await mfaStatus.load('http://localhost:3282', 'auth-token')

// Subscribe to changes
mfaStatus.subscribe(status => console.log('MFA Status:', status))
```

## Layout Integration

Place the wrapper after your header, before main content:

```svelte
<!-- src/routes/shop/+layout.svelte -->
<script>
  import { MFAGracePeriodWrapper } from '@goobits/store/ui'
  import { auth } from '$lib/stores/auth.js'
  import { PUBLIC_MEDUSA_BACKEND_URL } from '$env/static/public'
</script>

<Header />

<MFAGracePeriodWrapper
  auth={auth}
  backendUrl={PUBLIC_MEDUSA_BACKEND_URL}
  onSetupNow={() => window.location.href = '/shop/account?section=mfa'}
/>

<main>
  <slot />
</main>

<Footer />
```

## API Endpoint

Required backend endpoint:

**GET /admin/mfa/status**

Authentication: Bearer token required

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

## Dismissal Behavior

- Banners with 7+ days remaining can be dismissed for 24 hours
- Dismissal stored in localStorage: `mfa-banner-dismissed-{daysRemaining}`
- Each urgency level has separate dismissal tracking
- Dismissing at 15 days won't prevent banner at 7 days

## Accessibility

- `role="alert"` for screen reader announcements
- `aria-live="polite"` for dynamic updates
- Keyboard navigation support
- WCAG AA color contrast compliance

## Troubleshooting

**Banner not appearing:**
1. Verify API endpoint is accessible
2. Check auth token validity
3. Confirm MFA is required for user role
4. Ensure MFA is not already enabled
5. Verify user is within grace period

**Dismissal not working:**
1. Check browser console for localStorage errors
2. Verify `daysRemaining` is 7 or greater
3. Clear localStorage and retry

## See Also

- [MFA Banner Examples](./mfa-examples.md)
- [Components Overview](../README.md#components)
