<script lang="ts">
  /**
   * Accessible input component with 48px touch targets
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  interface Props {
    /** Input type */
    type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';
    /** Input value (bindable) */
    value?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Label text */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper text */
    helperText?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Required field */
    required?: boolean;
    /** Maximum length */
    maxlength?: number;
    /** Pattern for validation */
    pattern?: string;
    /** Input ID (auto-generated if not provided) */
    id?: string;
    /** Input name */
    name?: string;
    /** Auto capitalize */
    autocapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    /** Auto complete */
    autocomplete?: AutoFill;
    /** Full width */
    fullWidth?: boolean;
    /** Change handler */
    onchange?: (event: Event) => void;
    /** Input handler */
    oninput?: (event: Event) => void;
    /** Keydown handler */
    onkeydown?: (event: KeyboardEvent) => void;
  }

  let {
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    label,
    error,
    helperText,
    disabled = false,
    required = false,
    maxlength,
    pattern,
    id = `input-${Math.random().toString(36).slice(2, 9)}`,
    name,
    autocapitalize = 'none',
    autocomplete,
    fullWidth = false,
    onchange,
    oninput,
    onkeydown,
  }: Props = $props();

  const hasError = $derived(!!error);
  const describedBy = $derived(
    [error ? `${id}-error` : null, helperText ? `${id}-helper` : null]
      .filter(Boolean)
      .join(' ') || undefined
  );
</script>

<div class="input-wrapper" class:input-wrapper--full-width={fullWidth}>
  {#if label}
    <label for={id} class="input-label">
      {label}
      {#if required}
        <span class="input-label__required" aria-hidden="true">*</span>
      {/if}
    </label>
  {/if}
  
  <input
    {id}
    {type}
    {name}
    {placeholder}
    {disabled}
    {required}
    {maxlength}
    {pattern}
    {autocapitalize}
    {autocomplete}
    class="input"
    class:input--error={hasError}
    aria-invalid={hasError}
    aria-describedby={describedBy}
    bind:value
    {onchange}
    {oninput}
    {onkeydown}
  />
  
  {#if error}
    <p id="{id}-error" class="input-error" role="alert">
      {error}
    </p>
  {:else if helperText}
    <p id="{id}-helper" class="input-helper">
      {helperText}
    </p>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-wrapper--full-width {
    width: 100%;
  }

  .input-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text, #1f2937);
  }

  .input-label__required {
    color: var(--color-danger, #dc2626);
    margin-left: 0.25rem;
  }

  .input {
    /* Minimum touch target 48px */
    min-height: 48px;
    padding: 0.75rem 1rem;
    font-family: inherit;
    font-size: 1rem;
    color: var(--color-text, #1f2937);
    background-color: var(--color-background, #ffffff);
    border: 2px solid var(--color-border, #d1d5db);
    border-radius: 0.5rem;
    transition: border-color 150ms ease-in-out, box-shadow 150ms ease-in-out;
    width: 100%;
  }

  .input::placeholder {
    color: var(--color-text-muted, #9ca3af);
  }

  .input:hover:not(:disabled) {
    border-color: var(--color-primary-light, #93c5fd);
  }

  .input:focus {
    outline: none;
    border-color: var(--color-primary, #2563eb);
    box-shadow: 0 0 0 3px var(--color-primary-light, rgba(37, 99, 235, 0.2));
  }

  .input:disabled {
    background-color: var(--color-gray-100, #f3f4f6);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .input--error {
    border-color: var(--color-danger, #dc2626);
  }

  .input--error:focus {
    border-color: var(--color-danger, #dc2626);
    box-shadow: 0 0 0 3px var(--color-danger-light, rgba(220, 38, 38, 0.2));
  }

  .input-error {
    font-size: 0.875rem;
    color: var(--color-danger, #dc2626);
    margin: 0;
  }

  .input-helper {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin: 0;
  }
</style>
