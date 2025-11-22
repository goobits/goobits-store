<script>
	/**
	 * Subscription Detail Component
	 *
	 * Displays detailed subscription information with management actions
	 * Reusable across different storefronts
	 */
	import Modal from '@goobits/forms/ui/modals/Modal.svelte'
	import { formatCurrency, formatDate } from '../utils/subscription-helpers.js'

	let {
		subscription,
		backendUrl = '',
		onUpdate = () => {},
		backLinkUrl = '/shop/subscriptions',
		backLinkText = '← Back to Subscriptions'
	} = $props()

	// Loading states
	let isPausing = $state(false)
	let isResuming = $state(false)
	let isCancelling = $state(false)
	let showCancelConfirm = $state(false)

	// Error/success handling
	let error = $state(null)
	let success = $state(null)

	/**
	 * Pause subscription
	 */
	async function pauseSubscription() {
		isPausing = true
		error = null

		try {
			const response = await fetch(`${backendUrl}/store/subscriptions/${subscription.id}/pause`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				throw new Error('Failed to pause subscription')
			}

			success = 'Subscription paused successfully'
			onUpdate({ action: 'pause', subscription })
		} catch (err) {
			error = err.message
		} finally {
			isPausing = false
		}
	}

	/**
	 * Resume subscription
	 */
	async function resumeSubscription() {
		isResuming = true
		error = null

		try {
			const response = await fetch(`${backendUrl}/store/subscriptions/${subscription.id}/resume`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				throw new Error('Failed to resume subscription')
			}

			success = 'Subscription resumed successfully'
			onUpdate({ action: 'resume', subscription })
		} catch (err) {
			error = err.message
		} finally {
			isResuming = false
		}
	}

	/**
	 * Cancel subscription
	 */
	async function cancelSubscription(immediately = false) {
		isCancelling = true
		error = null

		try {
			const response = await fetch(
				`${backendUrl}/store/subscriptions/${subscription.id}?immediately=${immediately}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)

			if (!response.ok) {
				throw new Error('Failed to cancel subscription')
			}

			success = immediately
				? 'Subscription cancelled immediately'
				: 'Subscription will be cancelled at the end of the current period'

			onUpdate({ action: 'cancel', subscription, immediately })
		} catch (err) {
			error = err.message
		} finally {
			isCancelling = false
			showCancelConfirm = false
		}
	}
</script>

<div class="subscription-detail">
	<div class="subscription-detail__header">
		<div>
			<a href={backLinkUrl} class="back-link">{backLinkText}</a>
			<h1>Subscription Details</h1>
		</div>
	</div>

	{#if error}
		<div class="alert alert--error">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="alert alert--success">
			{success}
		</div>
	{/if}

	{#if subscription}
		<div class="subscription-detail__content">
			<!-- Status Card -->
			<section class="card">
				<h2>Status</h2>
				<div class="status-badge status-badge--{subscription.status}">
					{subscription.status}
				</div>
			</section>

			<!-- Details Card -->
			<section class="card">
				<h2>Subscription Details</h2>
				<dl class="detail-list">
					<div class="detail-item">
						<dt>Interval:</dt>
						<dd>
							Every {subscription.interval_count}
							{subscription.interval}{subscription.interval_count > 1 ? 's' : ''}
						</dd>
					</div>

					<div class="detail-item">
						<dt>Amount:</dt>
						<dd>
							{formatCurrency(subscription.amount, subscription.currency_code)}
							{#if subscription.discount_type !== 'none'}
								<span class="discount-badge">
									{subscription.discount_value}{subscription.discount_type === 'percentage' ? '%' : ''} off
								</span>
							{/if}
						</dd>
					</div>

					<div class="detail-item">
						<dt>Started:</dt>
						<dd>{formatDate(subscription.start_date)}</dd>
					</div>

					<div class="detail-item">
						<dt>Next billing:</dt>
						<dd>{formatDate(subscription.next_billing_date)}</dd>
					</div>

					<div class="detail-item">
						<dt>Current period:</dt>
						<dd>
							{formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
						</dd>
					</div>

					{#if subscription.trial_end_date}
						<div class="detail-item">
							<dt>Trial ends:</dt>
							<dd>{formatDate(subscription.trial_end_date)}</dd>
						</div>
					{/if}
				</dl>
			</section>

			<!-- Actions Card -->
			<section class="card">
				<h2>Manage Subscription</h2>

				{#if subscription.status === 'active'}
					<div class="actions">
						<button
							class="btn btn--secondary"
							onclick={pauseSubscription}
							disabled={isPausing}
						>
							{isPausing ? 'Pausing...' : 'Pause Subscription'}
						</button>

						<button
							class="btn btn--danger"
							onclick={() => showCancelConfirm = true}
							disabled={isCancelling}
						>
							Cancel Subscription
						</button>
					</div>
				{/if}

				{#if subscription.status === 'paused'}
					<div class="actions">
						<button
							class="btn btn--primary"
							onclick={resumeSubscription}
							disabled={isResuming}
						>
							{isResuming ? 'Resuming...' : 'Resume Subscription'}
						</button>

						<button
							class="btn btn--danger"
							onclick={() => showCancelConfirm = true}
							disabled={isCancelling}
						>
							Cancel Subscription
						</button>
					</div>
				{/if}

				{#if ['cancelled', 'expired'].includes(subscription.status)}
					<p class="status-message">
						This subscription has ended.
						{#if subscription.ended_at}
							Ended on {formatDate(subscription.ended_at)}.
						{/if}
					</p>
				{/if}
			</section>

			<!-- Payment Info Card -->
			{#if subscription.payment_retry_count > 0}
				<section class="card card--warning">
					<h2>Payment Issues</h2>
					<p>
						We've attempted to charge your payment method {subscription.payment_retry_count} time(s).
						{#if subscription.last_payment_error}
							<br />
							<strong>Error:</strong> {subscription.last_payment_error}
						{/if}
					</p>
					<p>
						Please update your payment method or contact support.
					</p>
				</section>
			{/if}
		</div>
	{:else}
		<div class="subscription-detail__empty">
			<p>Subscription not found.</p>
			<a href={backLinkUrl} class="btn btn--primary">View All Subscriptions</a>
		</div>
	{/if}
</div>

<!-- Cancel Confirmation Modal -->
<Modal
	isVisible={showCancelConfirm}
	onClose={() => showCancelConfirm = false}
	title="Cancel Subscription"
	size="sm"
>
	<p>Are you sure you want to cancel this subscription?</p>

	<div class="modal-actions">
		<button
			class="btn btn--secondary"
			onclick={() => showCancelConfirm = false}
		>
			Keep Subscription
		</button>

		<button
			class="btn btn--danger"
			onclick={() => cancelSubscription(false)}
			disabled={isCancelling}
		>
			{isCancelling ? 'Cancelling...' : 'Cancel at Period End'}
		</button>

		<button
			class="btn btn--danger"
			onclick={() => cancelSubscription(true)}
			disabled={isCancelling}
		>
			{isCancelling ? 'Cancelling...' : 'Cancel Immediately'}
		</button>
	</div>
</Modal>

<style>
	.subscription-detail {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.subscription-detail__header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-block;
		color: #d97706;
		text-decoration: none;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	h1 {
		font-size: 2rem;
		margin: 0;
	}

	.subscription-detail__content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.subscription-detail__empty {
		text-align: center;
		padding: 4rem 2rem;
		background: #f9fafb;
		border-radius: 0.5rem;
	}

	.card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.card--warning {
		background: #fef3c7;
		border-color: #fde047;
	}

	.card h2 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.status-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 600;
		text-transform: uppercase;
		font-size: 0.875rem;
	}

	.status-badge--active {
		background: #d1fae5;
		color: #065f46;
	}

	.status-badge--paused {
		background: #fef3c7;
		color: #92400e;
	}

	.status-badge--cancelled,
	.status-badge--expired {
		background: #fee2e2;
		color: #991b1b;
	}

	.status-badge--past_due {
		background: #fed7aa;
		color: #9a3412;
	}

	.detail-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f3f4f6;
	}

	.detail-item:last-child {
		border-bottom: none;
	}

	.detail-item dt {
		color: #6b7280;
		font-weight: 500;
	}

	.detail-item dd {
		color: #1f2937;
		font-weight: 600;
		margin: 0;
	}

	.discount-badge {
		display: inline-block;
		background: #d1fae5;
		color: #065f46;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		margin-left: 0.5rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.status-message {
		color: #6b7280;
		margin: 0;
	}

	.alert {
		padding: 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1.5rem;
	}

	.alert--error {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}

	.alert--success {
		background: #d1fae5;
		color: #065f46;
		border: 1px solid #a7f3d0;
	}

	.btn {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		border-radius: 0.375rem;
		font-weight: 500;
		text-align: center;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn--primary {
		background: #d97706;
		color: white;
	}

	.btn--primary:hover:not(:disabled) {
		background: #b45309;
	}

	.btn--secondary {
		background: #f3f4f6;
		color: #1f2937;
		border: 1px solid #d1d5db;
	}

	.btn--secondary:hover:not(:disabled) {
		background: #e5e7eb;
	}

	.btn--danger {
		background: #ef4444;
		color: white;
	}

	.btn--danger:hover:not(:disabled) {
		background: #dc2626;
	}

	/* Modal Actions (modal container handled by forms package) */
	.modal-actions {
		display: flex;
		gap: 0.75rem;
		flex-direction: column;
		margin-top: 1.5rem;
	}

	@media (min-width: 640px) {
		.modal-actions {
			flex-direction: row;
			justify-content: flex-end;
		}
	}
</style>
