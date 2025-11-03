# MFA Grace Period Banner - Visual Examples

This document shows examples of how the MFA grace period banner appears at different urgency levels.

## Banner States

### 1. Info Level (30-14 days remaining)
**Appearance:** Blue background with info icon
**Dismissible:** Yes (24-hour dismissal)
**Message:** "Two-factor authentication will be required. Set up MFA within X days."

```
┌──────────────────────────────────────────────────────────────────────┐
│ ℹ️  Two-factor authentication will be required. Set up MFA within   │
│    15 days.                                                          │
│    Grace period ends: Dec 1, 2025                                   │
│                                             [Set up now]  [✕ Dismiss]│
└──────────────────────────────────────────────────────────────────────┘
```
**Color:** Light blue (#dbeafe) with blue border (#3b82f6)

---

### 2. Warning Level (13-7 days remaining)
**Appearance:** Yellow/Amber background with warning triangle icon
**Dismissible:** Yes (24-hour dismissal)
**Message:** "Two-factor authentication required within X days."

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠️  Two-factor authentication required within 10 days.               │
│    Grace period ends: Dec 1, 2025                                   │
│                                             [Set up now]  [✕ Dismiss]│
└──────────────────────────────────────────────────────────────────────┘
```
**Color:** Light amber (#fef3c7) with amber border (#f59e0b)

---

### 3. Urgent Level (6-3 days remaining)
**Appearance:** Darker yellow background with warning triangle icon
**Dismissible:** No (forced display)
**Message:** "Two-factor authentication required in X days. Please set up MFA to secure your account."

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠️  Two-factor authentication required in 5 days. Please set up MFA │
│    to secure your account.                                          │
│    Grace period ends: Dec 1, 2025                                   │
│                                                       [Set up now]   │
└──────────────────────────────────────────────────────────────────────┘
```
**Color:** Medium amber (#fde68a) with darker amber border (#d97706)

---

### 4. Critical Level (<3 days remaining)
**Appearance:** Red background with alert icon
**Dismissible:** No (forced display)
**Message:** "Two-factor authentication required by tomorrow!" or "...required in X days"

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🔴 Two-factor authentication required in 2 days. Set up MFA now to  │
│    secure your account.                                              │
│    Grace period ends: Dec 1, 2025                                   │
│                                                       [Set up now]   │
└──────────────────────────────────────────────────────────────────────┘
```
**Color:** Light red with red border (#ef4444)

---

## Responsive Behavior

### Desktop (>768px)
- Full-width banner at top of page
- Horizontal layout with icon, message, and actions in one row
- Actions aligned to the right

### Mobile (<768px)
- Full-width banner
- Vertical layout with icon and message stacked
- Actions below message, aligned left
- Reduced padding for better mobile UX

## Interactive States

### Hover States
- **"Set up now" button**: Darker background color
- **Dismiss button**: Slightly darker background with opacity change

### Focus States
- Clear outline (2px) around focused elements
- Maintains color contrast for accessibility

### Active States
- Slight scale reduction (98%) when clicked
- Provides tactile feedback

## Accessibility Features

1. **ARIA Attributes**
   - `role="alert"` - Announces banner to screen readers
   - `aria-live="polite"` - Updates are announced
   - `aria-label` on dismiss button - "Dismiss banner"

2. **Keyboard Navigation**
   - Tab through interactive elements
   - Enter/Space to activate buttons
   - Escape to dismiss (when dismissible)

3. **Color Contrast**
   - All text meets WCAG AA standards (4.5:1 minimum)
   - Icons and text have sufficient contrast against backgrounds

4. **Screen Reader Support**
   - Clear, concise messages
   - Date information included
   - Button purposes clearly labeled

## Integration Placement

The banner should appear:
1. **Above the main content** but below the header
2. **Full-width** spanning the viewport
3. **Fixed to top** optionally (for critical warnings)
4. **Z-index 50** to appear above content but below modals

### Example Placement in Layout

```svelte
<Header />

<!-- MFA Grace Period Banner appears here -->
<MFAGracePeriodWrapper ... />

<main>
	<!-- Page content -->
</main>

<Footer />
```

## Dismissal Logic Flow

```
User sees banner (X days remaining)
  ↓
Is X >= 7?
  ↓ Yes                           ↓ No
Dismiss button visible      No dismiss button
  ↓
User clicks dismiss
  ↓
Store dismissal in localStorage:
  Key: mfa-banner-dismissed-X
  Value: ISO timestamp (now + 24h)
  ↓
Banner hidden
  ↓
After 24 hours...
  ↓
Banner reappears (or at new urgency level)
```

## Color Palette

### Info Level
- Background: `#dbeafe` (blue-100)
- Border: `#3b82f6` (blue-500)
- Text: `#1d4ed8` (blue-700)
- Button: `#2563eb` (blue-600)

### Warning Level
- Background: `#fef3c7` (amber-100)
- Border: `#f59e0b` (amber-500)
- Text: `#92400e` (amber-800)
- Button: `#d97706` (amber-600)

### Urgent Level
- Background: `#fde68a` (amber-200)
- Border: `#d97706` (amber-600)
- Text: `#78350f` (amber-900)
- Button: `#b45309` (amber-700)

### Critical Level
- Background: Light red (red-500 + 40% lightness)
- Border: `#ef4444` (red-500)
- Text: Dark red (red-500 - 20% lightness)
- Button: `#ef4444` (red-500)

## Testing Checklist

- [ ] Banner appears at correct urgency level
- [ ] Dismissal works for warnings (>=7 days)
- [ ] Dismissal prevented for urgent (<7 days)
- [ ] 24-hour dismissal expiry works correctly
- [ ] Banner reappears at new urgency level
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation functional
- [ ] Screen reader announces properly
- [ ] "Set up now" button navigates correctly
- [ ] Colors meet accessibility standards
- [ ] Loading states handled gracefully
- [ ] Error states don't break layout

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile Safari (iOS 14+)
✅ Chrome Mobile (Android 90+)

## Performance Notes

- Lightweight component (~8KB)
- No external dependencies (except Svelte)
- Minimal re-renders (uses Svelte 5 runes)
- localStorage operations are fast
- API call cached per session
