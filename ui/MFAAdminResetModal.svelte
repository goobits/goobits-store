<script>
	/**
	 * MFAAdminResetModal - Super-admin MFA reset confirmation modal
	 *
	 * @component
	 * Allows super-admins to reset MFA for other admin users with proper confirmation
	 *
	 * @prop {boolean} show - Show/hide modal (bindable)
	 * @prop {Object} user - User object with id, email, and MFA status
	 * @prop {Function} onReset - Callback when reset is confirmed
	 * @prop {Function} onCancel - Callback when modal is cancelled
	 */

	let {
		show = $bindable(),
		user,
		onReset,
		onCancel
	} = $props()

	let reason = $state('')
	let otherReason = $state('')
	let confirmed = $state(false)
	let submitting = $state(false)
	let error = $state(null)

	const reasonOptions = [
		{ value: 'lost_device', label: 'Lost device' },
		{ value: 'security_incident', label: 'Security incident' },
		{ value: 'user_request', label: 'User request' },
		{ value: 'other', label: 'Other' }
	]

	function handleClose() {
		if (submitting) return
		resetForm()
		if (onCancel) onCancel()
		show = false
	}

	function resetForm() {
		reason = ''
		otherReason = ''
		confirmed = false
		error = null
	}

	async function handleSubmit() {
		if (!reason) {
			error = 'Please select a reason for the reset'
			return
		}

		if (reason === 'other' && !otherReason.trim()) {
			error = 'Please provide details for "Other" reason'
			return
		}

		if (!confirmed) {
			error = 'Please confirm that you understand the impact'
			return
		}

		submitting = true
		error = null

		try {
			const resetReason = reason === 'other' ? otherReason.trim() : reason
			await onReset({
				userId: user.id,
				reason: resetReason
			})

			resetForm()
			show = false
		} catch (err) {
			error = err.message || 'Failed to reset MFA. Please try again.'
		} finally {
			submitting = false
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="goo__modal-overlay"
		role="button"
		tabindex="0"
		onclick={(e) => e.target === e.currentTarget && handleClose()}
		onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && e.target === e.currentTarget && handleClose()}
	>
		<div class="goo__modal goo__mfa-reset-modal">
			<header class="goo__modal-header">
				<h2>Reset User MFA</h2>
				<button
					class="goo__modal-close"
					onclick={handleClose}
					disabled={submitting}
					aria-label="Close modal"
				>
					&times;
				</button>
			</header>

			<div class="goo__modal-body">
				<div class="goo__user-info">
					<h3>User Information</h3>
					<div class="goo__info-grid">
						<div class="goo__info-item">
							<span class="goo__info-label">Email:</span>
							<span>{user.email}</span>
						</div>
						<div class="goo__info-item">
							<span class="goo__info-label">User ID:</span>
							<span class="goo__user-id">{user.id}</span>
						</div>
						{#if user.enrolled_at}
							<div class="goo__info-item">
								<span class="goo__info-label">MFA Enrolled:</span>
								<span>{new Date(user.enrolled_at).toLocaleDateString()}</span>
							</div>
						{/if}
						{#if user.last_verified_at}
							<div class="goo__info-item">
								<span class="goo__info-label">Last Verified:</span>
								<span>{new Date(user.last_verified_at).toLocaleDateString()}</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="goo__form-section">
					<h3>Reset Reason</h3>
					<label class="goo__label">
						Why are you resetting MFA for this user?
						<select
							class="goo__select"
							bind:value={reason}
							disabled={submitting}
						>
							<option value="">Select a reason...</option>
							{#each reasonOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>

					{#if reason === 'other'}
						<label class="goo__label">
							Please provide details:
							<textarea
								class="goo__textarea"
								bind:value={otherReason}
								placeholder="Describe the reason for this reset..."
								rows="3"
								disabled={submitting}
							></textarea>
						</label>
					{/if}
				</div>

				<div class="goo__warning-section">
					<h3>Impact Warning</h3>
					<div class="goo__warning-box">
						<p><strong>This action will:</strong></p>
						<ul>
							<li>Disable MFA for this user</li>
							<li>Delete all TOTP configuration</li>
							<li>Invalidate all backup codes</li>
							<li>Log the user out of all sessions</li>
							<li>User will need to re-enroll in MFA</li>
							<li>This action is logged in the audit trail</li>
						</ul>
					</div>
				</div>

				<label class="goo__confirmation-label">
					<input
						type="checkbox"
						bind:checked={confirmed}
						disabled={submitting}
					>
					<span>I understand the impact and want to proceed with the MFA reset</span>
				</label>

				{#if error}
					<div class="goo__error-message">
						{error}
					</div>
				{/if}
			</div>

			<footer class="goo__modal-footer">
				<button
					class="goo__btn goo__btn-danger"
					onclick={handleSubmit}
					disabled={!reason || !confirmed || submitting}
				>
					{submitting ? 'Resetting...' : 'Reset MFA'}
				</button>
				<button
					class="goo__btn goo__btn-ghost"
					onclick={handleClose}
					disabled={submitting}
				>
					Cancel
				</button>
			</footer>
		</div>
	</div>
{/if}

<style lang="scss">
	.goo__modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.goo__modal {
		background: white;
		border-radius: var(--radius-lg, 8px);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.goo__modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);

		h2 {
			margin: 0;
			font-size: 1.5rem;
			color: var(--color-text-primary, #333);
		}

		.goo__modal-close {
			background: none;
			border: none;
			font-size: 1.5rem;
			cursor: pointer;
			color: var(--color-text-secondary, #666);
			padding: 0;
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: var(--radius-sm, 4px);

			&:hover:not(:disabled) {
				color: var(--color-text-primary, #333);
				background: var(--color-background-secondary, #f5f5f5);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}
	}

	.goo__modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;

		h3 {
			margin: 0 0 1rem 0;
			font-size: 1.125rem;
			color: var(--color-text-primary, #333);
		}
	}

	.goo__user-info {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);

		.goo__info-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1rem;
		}

		.goo__info-item {
			.goo__info-label {
				display: block;
				font-weight: 600;
				color: var(--color-text-secondary, #666);
				margin-bottom: 0.25rem;
				font-size: 0.875rem;
			}

			span {
				display: block;
				color: var(--color-text-primary, #333);
			}

			.goo__user-id {
				font-family: monospace;
				font-size: 0.875rem;
				word-break: break-all;
			}
		}
	}

	.goo__form-section {
		margin-bottom: 1.5rem;
	}

	.goo__label {
		display: block;
		font-weight: 600;
		color: var(--color-text-primary, #333);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.goo__select {
		display: block;
		width: 100%;
		padding: 0.625rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: var(--radius-sm, 4px);
		font-size: 1rem;
		margin-top: 0.5rem;
		background: white;

		&:focus {
			outline: none;
			border-color: var(--accent-primary, #f4a623);
			box-shadow: 0 0 0 3px rgba(244, 166, 35, 0.1);
		}

		&:disabled {
			background: var(--color-background-secondary, #f5f5f5);
			cursor: not-allowed;
		}
	}

	.goo__textarea {
		display: block;
		width: 100%;
		padding: 0.625rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: var(--radius-sm, 4px);
		font-size: 1rem;
		margin-top: 0.5rem;
		font-family: inherit;
		resize: vertical;

		&:focus {
			outline: none;
			border-color: var(--accent-primary, #f4a623);
			box-shadow: 0 0 0 3px rgba(244, 166, 35, 0.1);
		}

		&:disabled {
			background: var(--color-background-secondary, #f5f5f5);
			cursor: not-allowed;
		}
	}

	.goo__warning-section {
		margin-bottom: 1.5rem;

		.goo__warning-box {
			background: #fff3cd;
			border: 1px solid #ffc107;
			border-radius: var(--radius-sm, 4px);
			padding: 1rem;
			color: #856404;

			p {
				margin: 0 0 0.5rem 0;
				font-weight: 600;
			}

			ul {
				margin: 0;
				padding-left: 1.5rem;

				li {
					margin-bottom: 0.25rem;

					&:last-child {
						margin-bottom: 0;
					}
				}
			}
		}
	}

	.goo__confirmation-label {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-weight: 600;
		cursor: pointer;

		input[type="checkbox"] {
			margin-top: 0.125rem;
			cursor: pointer;
			flex-shrink: 0;

			&:disabled {
				cursor: not-allowed;
			}
		}

		span {
			flex: 1;
		}
	}

	.goo__error-message {
		background: #f8d7da;
		border: 1px solid #f5c2c7;
		border-radius: var(--radius-sm, 4px);
		padding: 0.75rem;
		color: #842029;
		font-weight: 500;
		margin-top: 1rem;
	}

	.goo__modal-footer {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid var(--color-border, #e0e0e0);
		justify-content: flex-end;
	}

	.goo__btn {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: var(--radius-sm, 4px);
		cursor: pointer;
		font-weight: 600;
		font-size: 1rem;
		text-decoration: none;
		display: inline-block;
		transition: all 0.2s ease;

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&.goo__btn-danger {
			background: var(--color-danger, #dc3545);
			color: white;

			&:hover:not(:disabled) {
				background: var(--color-danger-dark, #bb2d3b);
			}
		}

		&.goo__btn-ghost {
			background: transparent;
			color: var(--color-text-secondary, #666);
			border: 1px solid var(--color-border, #e0e0e0);

			&:hover:not(:disabled) {
				background: var(--color-background-secondary, #f5f5f5);
				color: var(--color-text-primary, #333);
			}
		}
	}

	@media (max-width: 768px) {
		.goo__modal {
			margin: 1rem;
			max-width: none;
		}

		.goo__info-grid {
			grid-template-columns: 1fr !important;
		}

		.goo__modal-footer {
			flex-direction: column-reverse;

			.goo__btn {
				width: 100%;
			}
		}
	}
</style>
