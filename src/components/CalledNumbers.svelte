<script lang="ts">
  /**
   * CalledNumbers component - chronological list of called numbers
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  interface Props {
    /** Array of called numbers in order */
    numbers?: number[];
    /** Maximum numbers to display (0 = all) */
    maxDisplay?: number;
  }

  let { numbers = [], maxDisplay = 0 }: Props = $props();

  // Get numbers to display (most recent first or all)
  const displayNumbers = $derived(
    maxDisplay > 0 ? numbers.slice(-maxDisplay).reverse() : [...numbers].reverse()
  );

  // Most recently called number
  const lastNumber = $derived(numbers.length > 0 ? numbers[numbers.length - 1] : null);
</script>

<div class="called-numbers" role="log" aria-label="Called numbers history" aria-live="polite">
  <header class="called-numbers__header">
    <h3 class="called-numbers__title">Called Numbers</h3>
    <span class="called-numbers__count">{numbers.length}/25</span>
  </header>

  {#if numbers.length === 0}
    <p class="called-numbers__empty">No numbers called yet</p>
  {:else}
    <div class="called-numbers__list">
      {#each displayNumbers as num (num)}
        {@const isLast = num === lastNumber}
        <span
          class="called-numbers__number"
          class:called-numbers__number--last={isLast}
          aria-label="Number {num}{isLast ? ', most recent' : ''}"
        >
          {num}
        </span>
      {/each}
    </div>
    
    {#if maxDisplay > 0 && numbers.length > maxDisplay}
      <p class="called-numbers__more">
        +{numbers.length - maxDisplay} more
      </p>
    {/if}
  {/if}
</div>

<style>
  .called-numbers {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background-color: var(--color-gray-50, #f9fafb);
    border-radius: 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
  }

  .called-numbers__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .called-numbers__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text, #1f2937);
    margin: 0;
  }

  .called-numbers__count {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted, #6b7280);
  }

  .called-numbers__empty {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    text-align: center;
    margin: 0;
  }

  .called-numbers__list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .called-numbers__number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
    background-color: var(--color-gray-200, #e5e7eb);
    border-radius: 0.375rem;
    padding: 0 0.5rem;
  }

  .called-numbers__number--last {
    color: var(--color-background, #ffffff);
    background-color: var(--color-primary, #2563eb);
    animation: pulse-once 500ms ease-out;
  }

  .called-numbers__more {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    text-align: right;
    margin: 0;
  }

  @keyframes pulse-once {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
