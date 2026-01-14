/**
 * Card generation and manipulation functions
 * Based on: specs/001-bingo-game/data-model.md
 */

import type { BingoCard } from './types';
import { GRID_SIZE, TOTAL_NUMBERS } from './types';

/**
 * Fisher-Yates shuffle algorithm.
 * Optionally accepts a seed for deterministic testing.
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  
  // Simple seeded random number generator for testing
  let random: () => number;
  if (seed !== undefined) {
    let s = seed;
    random = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  } else {
    random = () => Math.random();
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  
  return result;
}

/**
 * Creates an empty 5x5 matrix of false values for marked states.
 */
export function createEmptyMarked(): boolean[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => false)
  );
}

/**
 * Generates a new BINGO card with numbers 1-25 randomly arranged in a 5x5 grid.
 * Optional seed for deterministic testing.
 */
export function generateCard(seed?: number): BingoCard {
  // Create array of numbers 1-25
  const numbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
  
  // Shuffle the numbers
  const shuffled = shuffleArray(numbers, seed);
  
  // Create 5x5 grid
  const grid: number[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    grid.push(shuffled.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE));
  }
  
  return {
    grid,
    marked: createEmptyMarked(),
    completedLines: [],
  };
}

/**
 * Finds the position of a number on the card.
 * Returns [row, col] or null if not found.
 */
export function findNumberPosition(
  card: BingoCard,
  number: number
): [number, number] | null {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (card.grid[row]?.[col] === number) {
        return [row, col];
      }
    }
  }
  return null;
}

/**
 * Marks a number on the card if it exists.
 * Returns a new card with the number marked.
 */
export function markNumber(card: BingoCard, number: number): BingoCard {
  const position = findNumberPosition(card, number);
  
  if (!position) {
    // Number not on this card, return unchanged
    return card;
  }
  
  const [row, col] = position;
  
  // Check if already marked
  if (card.marked[row]?.[col]) {
    return card;
  }
  
  // Create new marked array with the number marked
  const newMarked = card.marked.map((r, rIdx) =>
    rIdx === row
      ? r.map((c, cIdx) => (cIdx === col ? true : c))
      : [...r]
  );
  
  return {
    ...card,
    marked: newMarked,
  };
}

/**
 * Gets all numbers that are currently marked on the card.
 */
export function getMarkedNumbers(card: BingoCard): number[] {
  const marked: number[] = [];
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (card.marked[row]?.[col]) {
        const num = card.grid[row]?.[col];
        if (num !== undefined) {
          marked.push(num);
        }
      }
    }
  }
  
  return marked;
}

/**
 * Checks if a specific cell is marked.
 */
export function isCellMarked(card: BingoCard, row: number, col: number): boolean {
  return card.marked[row]?.[col] ?? false;
}

/**
 * Gets the number at a specific cell position.
 */
export function getNumberAt(
  card: BingoCard,
  row: number,
  col: number
): number | undefined {
  return card.grid[row]?.[col];
}
