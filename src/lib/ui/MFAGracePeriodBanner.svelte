<script lang="ts">
	import { browser } from '$app/environment'

	/**
	 * MFAGracePeriodBanner - Warning banner for MFA grace period
	 *
	 * Shows color-coded warnings based on days remaining in grace period.
	 * Allows dismissal when >7 days, mandatory when <7 days.
	 */

	type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'info'

	interface Props {
		daysRemaining?: number
		gracePeriodEndsAt?: string | null
		onSetupNow?: () => void
	}

	const {
		daysRemaining = 30,
		gracePeriodEndsAt = null,
		onSetupNow = () => {}
	}: Props = $props()

	// Calculate urgency level
	const urgencyLevel: UrgencyLevel = $derived(
		daysRemaining < 3 ? 'critical' :
		daysRemaining < 7 ? 'urgent' :
		daysRemaining < 14 ? 'warning' :
		'info'
	)

	// Check if banner can be dismissed (only when >7 days)
	const isDismissible: boolean = $derived(daysRemaining >= 7)

	// Check localStorage for dismissal state (SSR-safe)
	function checkDismissalState(): boolean {
		if (!browser || !isDismissible) return false

		const dismissalKey = `mfa-banner-dismissed-${ daysRemaining }`
		const dismissedUntil = localStorage.getItem(dismissalKey)

		if (dismissedUntil) {
			const expiryDate = new Date(dismissedUntil)
			if (expiryDate > new Date()) {
				return true
			} else {
				localStorage.removeItem(dismissalKey)
			}
		}
		return false
	}

	// Dismissal state (initialized with localStorage check)
	let dismissed: boolean = $state(checkDismissalState())

	// Get urgency-specific message
	const message: () => string = $derived(() => {
		if (daysRemaining <= 1) {
			return 'Two-factor authentication required by tomorrow! Set up MFA immediately to maintain access.'
		} else if (daysRemaining <= 3) {
			return `Two-factor authentication required in ${ daysRemaining } days. Set up MFA now to secure your account.`
		} else if (daysRemaining <= 7) {
			return `Two-factor authentication required in ${ daysRemaining } days. Please set up MFA to secure your account.`
		} else if (daysRemaining <= 14) {
			return `Two-factor authentication required within ${ daysRemaining } days.`
		} else {
			return `Two-factor authentication will be required. Set up MFA within ${ daysRemaining } days.`
		}
	})

	// Get formatted end date
	const formattedEndDate: () => string = $derived(() => {
		if (!gracePeriodEndsAt) return ''
		try {
			const date = new Date(gracePeriodEndsAt)
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			})
		} catch {
			return ''
		}
	})

	function handleDismiss(): void {
		if (!isDismissible) return

		dismissed = true

		// Store dismissal with 24-hour expiry
		const dismissalKey = `mfa-banner-dismissed-${ daysRemaining }`
		const expiryDate = new Date()
		expiryDate.setHours(expiryDate.getHours() + 24)
		localStorage.setItem(dismissalKey, expiryDate.toISOString())
	}

	function handleSetupNow(): void {
		onSetupNow()
	}
</script>

{#if !dismissed}
	<div class="goo__mfa-banner goo__mfa-banner--{ urgencyLevel }" role="alert" aria-live="polite">
		<div class="goo__mfa-banner__container">
			<div class="goo__mfa-banner__icon">
				{#if urgencyLevel === 'critical'}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
				{:else if urgencyLevel === 'urgent' || urgencyLevel === 'warning'}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
				{:else}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
				{/if}
			</div>

			<div class="goo__mfa-banner__content">
				<div class="goo__mfa-banner__message">
					{message()}
				</div>
				{#if formattedEndDate()}
					<div class="goo__mfa-banner__deadline">
						Grace period ends: {formattedEndDate()}
					</div>
				{/if}
			</div>

			<div class="goo__mfa-banner__actions">
				<button
					type="button"
					onclick={handleSetupNow}
					class="goo__mfa-banner__button goo__mfa-banner__button--primary"
				>
					Set up now
				</button>

				{#if isDismissible}
					<button
						type="button"
						onclick={handleDismiss}
						class="goo__mfa-banner__button goo__mfa-banner__button--dismiss"
						aria-label="Dismiss banner"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	@use 'sass:color';
	@use './variables.scss' as *;

	.goo__mfa-banner {
		width: 100%;
		padding: $spacing-medium $spacing-large;
		position: relative;
		z-index: 50;
		border-bottom: 2px solid transparent;

		// Info level (30-8 days) - Blue
		&--info {
			background-color: $blue-100;
			border-bottom-color: $blue-500;
			color: $blue-700;

			.goo__mfa-banner__button--primary {
				background-color: $blue-600;
				color: $white;

				&:hover {
					background-color: $blue-700;
				}
			}
		}

		// Warning level (7-3 days) - Yellow/Amber
		&--warning {
			background-color: $amber-100;
			border-bottom-color: $amber-600;
			color: $amber-800;

			.goo__mfa-banner__button--primary {
				background-color: $amber-600;
				color: $white;

				&:hover {
					background-color: $amber-700;
				}
			}
		}

		// Urgent level (7-3 days) - Yellow/Amber (same as warning but stronger)
		&--urgent {
			background-color: $amber-200;
			border-bottom-color: $amber-700;
			color: $amber-900;

			.goo__mfa-banner__button--primary {
				background-color: $amber-700;
				color: $white;

				&:hover {
					background-color: $amber-800;
				}
			}
		}

		// Critical level (<3 days) - Red
		&--critical {
			background-color: color.adjust($red-500, $lightness: 40%);
			border-bottom-color: $red-500;
			color: color.adjust($red-500, $lightness: -20%);

			.goo__mfa-banner__button--primary {
				background-color: $red-500;
				color: $white;

				&:hover {
					background-color: color.adjust($red-500, $lightness: -10%);
				}
			}
		}
	}

	.goo__mfa-banner__container {
		display: flex;
		align-items: center;
		gap: $spacing-medium;
		max-width: 1200px;
		margin: 0 auto;

		@media (max-width: 768px) {
			flex-direction: column;
			align-items: flex-start;
			gap: $spacing-small;
		}
	}

	.goo__mfa-banner__icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;

		svg {
			width: 24px;
			height: 24px;
		}

		@media (max-width: 768px) {
			align-self: flex-start;
		}
	}

	.goo__mfa-banner__content {
		flex: 1;
		min-width: 0;
	}

	.goo__mfa-banner__message {
		font-weight: $font-weight-semibold;
		font-size: $font-size-base;
		line-height: 1.4;
		margin-bottom: $spacing-xsmall;
	}

	.goo__mfa-banner__deadline {
		font-size: $font-size-small;
		opacity: 0.9;
	}

	.goo__mfa-banner__actions {
		display: flex;
		align-items: center;
		gap: $spacing-small;
		flex-shrink: 0;

		@media (max-width: 768px) {
			width: 100%;
			justify-content: flex-start;
		}
	}

	.goo__mfa-banner__button {
		padding: $spacing-small $spacing-large;
		border-radius: $border-radius-medium;
		font-weight: $font-weight-semibold;
		font-size: $font-size-small;
		cursor: pointer;
		transition: $transition-base;
		border: none;
		white-space: nowrap;

		&--primary {
			// Colors set by urgency level
		}

		&--dismiss {
			padding: $spacing-small;
			background-color: transparent;
			color: currentColor;
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0.7;

			&:hover {
				opacity: 1;
				background-color: rgba(0, 0, 0, 0.1);
			}

			svg {
				width: 20px;
				height: 20px;
			}
		}

		&:focus {
			outline: 2px solid currentColor;
			outline-offset: 2px;
		}

		&:active {
			transform: scale(0.98);
		}
	}
</style>
