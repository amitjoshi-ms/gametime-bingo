<script lang="ts">
  /**
   * Card component - 5x5 BINGO card grid
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  import Cell from './Cell.svelte';
  import type { LineDefinition } from '$lib/game/types';

  interface Props {
    /** 5x5 grid of numbers */
    grid: number[][] | null;
    /** 5x5 grid of marked cells */
    marked: boolean[][] | null;
    /** Completed lines (to highlight cells) */
    completedLines?: LineDefinition[];
    /** Recently completed lines (for animation) */
    recentlyCompletedLines?: LineDefinition[];
    /** Most recently called number (to highlight) */
    lastCalledNumber?: number | null;
  }

  let {
    grid,
    marked,
    completedLines = [],
    recentlyCompletedLines = [],
    lastCalledNumber = null,
  }: Props = $props();

  // Check if a cell is in any completed line
  function isCellInCompletedLine(row: number, col: number): boolean {
    return completedLines.some((line) =>
      line.cells.some(([r, c]) => r === row && c === col)
    );
  }

  // Check if a cell was just completed (for animation)
  function isCellJustCompleted(row: number, col: number): boolean {
    return recentlyCompletedLines.some((line) =>
      line.cells.some(([r, c]) => r === row && c === col)
    );
  }

  // Check if a cell contains the last called number
  function isLastCalled(row: number, col: number): boolean {
    if (lastCalledNumber === null || !grid) return false;
    return grid[row]?.[col] === lastCalledNumber;
  }
</script>

<div class="card" role="grid" aria-label="Your BINGO card">
  <header class="card__header" aria-hidden="true">
    <span class="card__letter">B</span>
    <span class="card__letter">I</span>
    <span class="card__letter">N</span>
    <span class="card__letter">G</span>
    <span class="card__letter">O</span>
  </header>
  
  <div class="card__grid">
    {#if grid && marked}
      {#each grid as row, rowIndex}
        {#each row as number, colIndex (number)}
          <Cell
            {number}
            marked={marked[rowIndex]?.[colIndex] ?? false}
            inCompletedLine={isCellInCompletedLine(rowIndex, colIndex)}
            justMarked={isCellJustCompleted(rowIndex, colIndex)}
            highlighted={isLastCalled(rowIndex, colIndex)}
          />
        {/each}
      {/each}
    {:else}
      <!-- Empty state / loading -->
      {#each Array(25) as _}
        <div class="card__empty-cell" aria-hidden="true"></div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 100%;
    width: 100%;
  }

  .card__header {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.25rem;
  }

  .card__letter {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(1.25rem, 5vw, 2rem);
    font-weight: 900;
    color: var(--color-primary, #2563eb);
    text-transform: uppercase;
    padding: 0.25rem;
  }

  .card__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.25rem;
  }

  .card__empty-cell {
    aspect-ratio: 1;
    background-color: var(--color-gray-100, #f3f4f6);
    border: 2px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
