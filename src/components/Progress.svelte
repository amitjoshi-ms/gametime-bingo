<script lang="ts">
  /**
   * Progress component - B-I-N-G-O letter tracker
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  interface Props {
    /** Number of completed lines (0-5) */
    completedLines?: number;
    /** Show animate on progress change */
    animate?: boolean;
  }

  let { completedLines = 0, animate = true }: Props = $props();

  const letters = ['B', 'I', 'N', 'G', 'O'];
  
  // Track previous value for animation
  let previousValue = $state(completedLines);
  let animatingIndex = $state(-1);

  $effect(() => {
    if (animate && completedLines > previousValue && completedLines <= 5) {
      animatingIndex = completedLines - 1;
      setTimeout(() => {
        animatingIndex = -1;
      }, 600);
    }
    previousValue = completedLines;
  });
</script>

<div
  class="progress"
  role="progressbar"
  aria-valuenow={completedLines}
  aria-valuemin={0}
  aria-valuemax={5}
  aria-label="BINGO progress: {completedLines} of 5 lines completed"
>
  {#each letters as letter, index}
    {@const isComplete = index < completedLines}
    {@const isAnimating = index === animatingIndex}
    <span
      class="progress__letter"
      class:progress__letter--complete={isComplete}
      class:progress__letter--animating={isAnimating}
      aria-hidden="true"
    >
      {letter}
    </span>
  {/each}
</div>

<style>
  .progress {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .progress__letter {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
    font-weight: 900;
    color: var(--color-gray-300, #d1d5db);
    background-color: var(--color-gray-100, #f3f4f6);
    border: 2px solid var(--color-gray-200, #e5e7eb);
    border-radius: 0.5rem;
    transition: all 200ms ease-in-out;
  }

  .progress__letter--complete {
    color: var(--color-background, #ffffff);
    background-color: var(--color-success, #22c55e);
    border-color: var(--color-success-dark, #16a34a);
  }

  .progress__letter--animating {
    animation: celebrate 600ms ease-out;
  }

  @keyframes celebrate {
    0% {
      transform: scale(1);
    }
    25% {
      transform: scale(1.3) rotate(-5deg);
    }
    50% {
      transform: scale(1.3) rotate(5deg);
    }
    75% {
      transform: scale(1.2) rotate(-2deg);
    }
    100% {
      transform: scale(1) rotate(0);
    }
  }
</style>
