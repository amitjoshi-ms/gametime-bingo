<script lang="ts">
  /**
   * Accessible button component with 48px touch targets
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  interface Props {
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    /** Button size */
    size?: 'sm' | 'md' | 'lg';
    /** Disabled state */
    disabled?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Button type attribute */
    type?: 'button' | 'submit' | 'reset';
    /** Full width */
    fullWidth?: boolean;
    /** Click handler */
    onclick?: (event: MouseEvent) => void;
    /** Accessible label for icon-only buttons */
    ariaLabel?: string;
    /** Children slot */
    children?: import('svelte').Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    fullWidth = false,
    onclick,
    ariaLabel,
    children,
  }: Props = $props();

  const isDisabled = $derived(disabled || loading);
</script>

<button
  {type}
  class="button button--{variant} button--{size}"
  class:button--full-width={fullWidth}
  class:button--loading={loading}
  disabled={isDisabled}
  aria-disabled={isDisabled}
  aria-label={ariaLabel}
  aria-busy={loading}
  {onclick}
>
  {#if loading}
    <span class="button__spinner" aria-hidden="true"></span>
  {/if}
  <span class="button__content" class:button__content--hidden={loading}>
    {#if children}
      {@render children()}
    {/if}
  </span>
</button>

<style>
  .button {
    /* Base styles */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
    font-weight: 600;
    text-decoration: none;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 150ms ease-in-out;
    position: relative;
    
    /* Minimum touch target 48px */
    min-height: 48px;
    min-width: 48px;
  }

  /* Variants */
  .button--primary {
    background-color: var(--color-primary, #2563eb);
    color: white;
    border-color: var(--color-primary, #2563eb);
  }

  .button--primary:hover:not(:disabled) {
    background-color: var(--color-primary-dark, #1d4ed8);
    border-color: var(--color-primary-dark, #1d4ed8);
  }

  .button--primary:focus-visible {
    outline: 3px solid var(--color-primary-light, #60a5fa);
    outline-offset: 2px;
  }

  .button--secondary {
    background-color: transparent;
    color: var(--color-primary, #2563eb);
    border-color: var(--color-primary, #2563eb);
  }

  .button--secondary:hover:not(:disabled) {
    background-color: var(--color-primary-light, #dbeafe);
  }

  .button--secondary:focus-visible {
    outline: 3px solid var(--color-primary-light, #60a5fa);
    outline-offset: 2px;
  }

  .button--ghost {
    background-color: transparent;
    color: var(--color-text, #1f2937);
    border-color: transparent;
  }

  .button--ghost:hover:not(:disabled) {
    background-color: var(--color-gray-100, #f3f4f6);
  }

  .button--ghost:focus-visible {
    outline: 3px solid var(--color-primary-light, #60a5fa);
    outline-offset: 2px;
  }

  .button--danger {
    background-color: var(--color-danger, #dc2626);
    color: white;
    border-color: var(--color-danger, #dc2626);
  }

  .button--danger:hover:not(:disabled) {
    background-color: var(--color-danger-dark, #b91c1c);
    border-color: var(--color-danger-dark, #b91c1c);
  }

  .button--danger:focus-visible {
    outline: 3px solid var(--color-danger-light, #fca5a5);
    outline-offset: 2px;
  }

  /* Sizes */
  .button--sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    min-height: 48px;
  }

  .button--md {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    min-height: 48px;
  }

  .button--lg {
    padding: 1rem 2rem;
    font-size: 1.125rem;
    min-height: 56px;
  }

  /* Modifiers */
  .button--full-width {
    width: 100%;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Loading state */
  .button--loading {
    cursor: wait;
  }

  .button__content--hidden {
    visibility: hidden;
  }

  .button__spinner {
    position: absolute;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
