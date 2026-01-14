<script lang="ts">
  /**
   * Cell component - single card cell with marked/unmarked states
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  interface Props {
    /** Number displayed in the cell */
    number: number;
    /** Whether this cell is marked */
    marked?: boolean;
    /** Whether this cell is part of a completed line */
    inCompletedLine?: boolean;
    /** Whether this cell was just marked (for animation) */
    justMarked?: boolean;
    /** Whether the cell should be highlighted (e.g., current number called) */
    highlighted?: boolean;
  }

  let {
    number,
    marked = false,
    inCompletedLine = false,
    justMarked = false,
    highlighted = false,
  }: Props = $props();
</script>

<div
  class="cell"
  class:cell--marked={marked}
  class:cell--completed={inCompletedLine}
  class:cell--just-marked={justMarked}
  class:cell--highlighted={highlighted}
  role="gridcell"
  aria-label="Number {number}{marked ? ', marked' : ''}{inCompletedLine ? ', in completed line' : ''}"
>
  <span class="cell__number">{number}</span>
  {#if marked}
    <span class="cell__marker" aria-hidden="true"></span>
  {/if}
</div>

<style>
  .cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    background-color: var(--color-background, #ffffff);
    border: 2px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    transition: all 200ms ease-in-out;
    user-select: none;
  }

  .cell__number {
    font-size: clamp(1rem, 4vw, 1.5rem);
    font-weight: 700;
    color: var(--color-text, #1f2937);
    z-index: 1;
  }

  .cell__marker {
    position: absolute;
    inset: 0.25rem;
    background-color: var(--color-primary-light, rgba(37, 99, 235, 0.2));
    border-radius: 0.375rem;
    z-index: 0;
  }

  /* Marked state */
  .cell--marked {
    border-color: var(--color-primary, #2563eb);
  }

  .cell--marked .cell__number {
    color: var(--color-primary, #2563eb);
  }

  /* Completed line state */
  .cell--completed {
    background-color: var(--color-success-light, #dcfce7);
    border-color: var(--color-success, #22c55e);
  }

  .cell--completed .cell__number {
    color: var(--color-success-dark, #15803d);
  }

  .cell--completed .cell__marker {
    background-color: var(--color-success, rgba(34, 197, 94, 0.3));
  }

  /* Just marked animation */
  .cell--just-marked {
    animation: pop 300ms ease-out;
  }

  @keyframes pop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Highlighted (current number) */
  .cell--highlighted {
    box-shadow: 0 0 0 4px var(--color-warning, #f59e0b);
  }
</style>
