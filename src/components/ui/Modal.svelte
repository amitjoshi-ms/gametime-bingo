<script lang="ts">
  /**
   * Accessible modal component with focus trap
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  interface Props {
    /** Modal open state */
    open?: boolean;
    /** Modal title */
    title?: string;
    /** Show close button */
    showCloseButton?: boolean;
    /** Close on backdrop click */
    closeOnBackdrop?: boolean;
    /** Close on escape key */
    closeOnEscape?: boolean;
    /** Close handler */
    onclose?: () => void;
    /** Header slot */
    header?: import('svelte').Snippet;
    /** Content slot */
    children?: import('svelte').Snippet;
    /** Footer slot */
    footer?: import('svelte').Snippet;
  }

  let {
    open = $bindable(false),
    title,
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    onclose,
    header,
    children,
    footer,
  }: Props = $props();

  let dialogElement: HTMLDialogElement | undefined = $state();
  let previousActiveElement: Element | null = null;

  function handleClose() {
    open = false;
    onclose?.();
    
    // Restore focus to previous element
    if (previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (closeOnBackdrop && event.target === dialogElement) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (closeOnEscape && event.key === 'Escape') {
      handleClose();
    }
  }

  // Sync open state with dialog element
  $effect(() => {
    if (!dialogElement) return;
    
    if (open) {
      previousActiveElement = document.activeElement;
      dialogElement.showModal();
    } else {
      dialogElement.close();
    }
  });

  // Focus trap - focus first focusable element when opened
  $effect(() => {
    if (!open || !dialogElement) return;
    
    const focusableElements = dialogElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    if (firstFocusable) {
      firstFocusable.focus();
    }
  });
</script>

<dialog
  bind:this={dialogElement}
  class="modal"
  aria-labelledby={title ? 'modal-title' : undefined}
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
>
  <div class="modal__container" role="document">
    {#if header}
      <header class="modal__header">
        {@render header()}
        {#if showCloseButton}
          <button
            type="button"
            class="modal__close"
            aria-label="Close modal"
            onclick={handleClose}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        {/if}
      </header>
    {:else if title}
      <header class="modal__header">
        <h2 id="modal-title" class="modal__title">{title}</h2>
        {#if showCloseButton}
          <button
            type="button"
            class="modal__close"
            aria-label="Close modal"
            onclick={handleClose}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        {/if}
      </header>
    {/if}

    {#if children}
      <div class="modal__content">
        {@render children()}
      </div>
    {/if}

    {#if footer}
      <footer class="modal__footer">
        {@render footer()}
      </footer>
    {/if}
  </div>
</dialog>

<style>
  .modal {
    padding: 0;
    border: none;
    border-radius: 0.75rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    max-width: min(90vw, 32rem);
    max-height: 85vh;
    overflow: visible;
    background: transparent;
  }

  .modal::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }

  .modal__container {
    display: flex;
    flex-direction: column;
    background-color: var(--color-background, #ffffff);
    border-radius: 0.75rem;
    max-height: 85vh;
    overflow: hidden;
  }

  .modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .modal__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text, #1f2937);
    margin: 0;
  }

  .modal__close {
    /* Touch target 48px */
    min-width: 48px;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    color: var(--color-text-muted, #6b7280);
    cursor: pointer;
    transition: background-color 150ms ease-in-out, color 150ms ease-in-out;
    margin: -0.5rem -0.5rem -0.5rem 0;
  }

  .modal__close:hover {
    background-color: var(--color-gray-100, #f3f4f6);
    color: var(--color-text, #1f2937);
  }

  .modal__close:focus-visible {
    outline: 3px solid var(--color-primary-light, #60a5fa);
    outline-offset: 2px;
  }

  .modal__content {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .modal__footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  /* Responsive - full width on small screens */
  @media (max-width: 480px) {
    .modal {
      max-width: 100%;
      max-height: 100%;
      width: 100%;
      height: 100%;
      border-radius: 0;
    }

    .modal__container {
      border-radius: 0;
      min-height: 100%;
    }
  }
</style>
