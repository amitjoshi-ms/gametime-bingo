<script lang="ts">
  /**
   * NumberPad component - 1-25 number buttons for calling
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  interface Props {
    /** Numbers that have been called (disabled) */
    calledNumbers?: number[];
    /** Whether it's the current player's turn */
    isMyTurn?: boolean;
    /** Whether the game is active */
    isPlaying?: boolean;
    /** Handler for calling a number */
    onCallNumber?: (number: number) => void;
  }

  let {
    calledNumbers = [],
    isMyTurn = false,
    isPlaying = false,
    onCallNumber,
  }: Props = $props();

  // All numbers 1-25
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);

  function isNumberCalled(num: number): boolean {
    return calledNumbers.includes(num);
  }

  function handleClick(num: number) {
    if (!isMyTurn || !isPlaying || isNumberCalled(num)) return;
    onCallNumber?.(num);
  }

  function handleKeydown(event: KeyboardEvent, num: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(num);
    }
  }
</script>

<div class="numberpad" role="group" aria-label="Number pad - select a number to call">
  <div class="numberpad__grid">
    {#each numbers as num}
      {@const called = isNumberCalled(num)}
      {@const disabled = called || !isMyTurn || !isPlaying}
      <button
        type="button"
        class="numberpad__button"
        class:numberpad__button--called={called}
        class:numberpad__button--disabled={disabled && !called}
        disabled={disabled}
        aria-label="Call number {num}{called ? ' (already called)' : ''}"
        aria-pressed={called}
        onclick={() => handleClick(num)}
        onkeydown={(e) => handleKeydown(e, num)}
      >
        {num}
      </button>
    {/each}
  </div>
  
  {#if !isPlaying}
    <p class="numberpad__hint">Waiting for game to start...</p>
  {:else if !isMyTurn}
    <p class="numberpad__hint">Wait for your turn</p>
  {:else}
    <p class="numberpad__hint">Your turn! Select a number to call</p>
  {/if}
</div>

<style>
  .numberpad {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .numberpad__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
  }

  .numberpad__button {
    /* Touch target 48px */
    min-height: 48px;
    min-width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text, #1f2937);
    background-color: var(--color-background, #ffffff);
    border: 2px solid var(--color-border, #d1d5db);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 150ms ease-in-out;
  }

  .numberpad__button:hover:not(:disabled) {
    background-color: var(--color-primary-light, #dbeafe);
    border-color: var(--color-primary, #2563eb);
    color: var(--color-primary, #2563eb);
  }

  .numberpad__button:focus-visible {
    outline: 3px solid var(--color-primary-light, #60a5fa);
    outline-offset: 2px;
  }

  .numberpad__button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .numberpad__button--called {
    background-color: var(--color-gray-200, #e5e7eb);
    border-color: var(--color-gray-300, #d1d5db);
    color: var(--color-gray-400, #9ca3af);
    cursor: not-allowed;
    text-decoration: line-through;
  }

  .numberpad__button--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .numberpad__hint {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    text-align: center;
    margin: 0;
  }
</style>
