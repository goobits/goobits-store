# MFA Grace Period Banner Examples

[Home](../README.md) > [MFA Integration](./mfa-integration.md) > Examples

Visual reference for the MFA grace period banner at different urgency levels.

## Banner States

### Info Level (30-14 days)

Blue background, dismissible for 24 hours.

```
Message: "Two-factor authentication will be required. Set up MFA within X days."
Actions: [Set up now] [Dismiss]
```

- Background: `#dbeafe` (blue-100)
- Border: `#3b82f6` (blue-500)
- Text: `#1d4ed8` (blue-700)

### Warning Level (13-7 days)

Yellow background, dismissible for 24 hours.

```
Message: "Two-factor authentication required within X days."
Actions: [Set up now] [Dismiss]
```

- Background: `#fef3c7` (amber-100)
- Border: `#f59e0b` (amber-500)
- Text: `#92400e` (amber-800)

### Urgent Level (6-3 days)

Darker yellow, not dismissible.

```
Message: "Two-factor authentication required in X days. Please set up MFA to secure your account."
Actions: [Set up now]
```

- Background: `#fde68a` (amber-200)
- Border: `#d97706` (amber-600)
- Text: `#78350f` (amber-900)

### Critical Level (<3 days)

Red background, not dismissible.

```
Message: "Two-factor authentication required in X days. Set up MFA now to secure your account."
Actions: [Set up now]
```

- Background: Light red
- Border: `#ef4444` (red-500)
- Text: Dark red

## Responsive Behavior

### Desktop (>768px)
- Full-width banner at page top
- Horizontal layout: icon, message, actions in one row
- Actions aligned right

### Mobile (<768px)
- Full-width banner
- Vertical layout with stacked elements
- Actions below message, aligned left
- Reduced padding

## Interactive States

**Hover:** Darker background on buttons
**Focus:** 2px outline for accessibility
**Active:** Slight scale reduction (98%)

## Advanced Integration

For custom status fetching:

```svelte
<script>
  import { onMount } from 'svelte'
  import { MFAGracePeriodBanner, fetchMFAStatus, shouldShowGracePeriodBanner } from '@goobits/store/ui'

  let mfaStatus = $state(null)
  let showBanner = $derived(shouldShowGracePeriodBanner(mfaStatus))

  onMount(async () => {
    mfaStatus = await fetchMFAStatus(backendUrl, authToken)
  })
</script>

{#if showBanner && mfaStatus}
  <MFAGracePeriodBanner
    daysRemaining={mfaStatus.daysRemaining}
    gracePeriodEndsAt={mfaStatus.gracePeriodEndsAt}
    onSetupNow={() => { /* custom logic */ }}
  />
{/if}
```

## Using the Store

```javascript
import { createMFAStatusStore } from '@goobits/store/ui'

const mfaStatus = createMFAStatusStore()

// Reactive loading
$effect(() => {
  if (authToken) {
    mfaStatus.load(backendUrl, authToken)
  }
})

// Monitor for critical urgency
mfaStatus.subscribe(status => {
  if (status.inGracePeriod && status.daysRemaining < 3) {
    console.warn('MFA grace period expiring soon!')
  }
})
```

## Testing Checklist

- [ ] Banner appears at correct urgency level
- [ ] Dismissal works for 7+ days remaining
- [ ] Dismissal prevented for <7 days
- [ ] 24-hour dismissal expiry works
- [ ] Banner reappears at new urgency level
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation functional
- [ ] Screen reader announces properly
- [ ] "Set up now" navigates correctly
- [ ] Colors meet accessibility standards

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 90+)

## See Also

- [MFA Integration Guide](./mfa-integration.md)
- [Components Overview](../README.md#components)
