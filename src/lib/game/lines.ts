/**
 * Line detection for BINGO cards
 * Based on: specs/001-bingo-game/data-model.md
 */

import type { BingoCard, LineDefinition, LineType } from './types';

/**
 * All 12 possible lines on a BINGO card:
 * - 5 horizontal rows
 * - 5 vertical columns
 * - 2 diagonals
 */
export const LINES: LineDefinition[] = [
  // Horizontal (5 lines)
  { type: 'horizontal', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { type: 'horizontal', cells: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] },
  { type: 'horizontal', cells: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
  { type: 'horizontal', cells: [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]] },
  { type: 'horizontal', cells: [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]] },
  // Vertical (5 lines)
  { type: 'vertical', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  { type: 'vertical', cells: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]] },
  { type: 'vertical', cells: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]] },
  { type: 'vertical', cells: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]] },
  { type: 'vertical', cells: [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]] },
  // Diagonal (2 lines)
  { type: 'diagonal', cells: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]] },
  { type: 'diagonal', cells: [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]] },
];

/**
 * Checks if a line is complete (all cells marked).
 */
export function isLineComplete(card: BingoCard, line: LineDefinition): boolean {
  return line.cells.every(([row, col]) => {
    return card.marked[row]?.[col] === true;
  });
}

/**
 * Finds all completed lines on a card.
 */
export function findCompletedLines(card: BingoCard): LineDefinition[] {
  return LINES.filter((line) => isLineComplete(card, line));
}

/**
 * Finds lines that were newly completed (in 'after' but not in 'before').
 */
export function getNewlyCompletedLines(
  before: LineDefinition[],
  after: LineDefinition[]
): LineDefinition[] {
  // Create a set of line identifiers from 'before'
  const beforeSet = new Set(before.map(lineToKey));
  
  // Return lines in 'after' that aren't in 'before'
  return after.filter((line) => !beforeSet.has(lineToKey(line)));
}

/**
 * Creates a unique key for a line definition for comparison.
 */
function lineToKey(line: LineDefinition): string {
  return `${line.type}:${line.cells.map((c) => `${c[0]},${c[1]}`).join('|')}`;
}

/**
 * Updates a card with its currently completed lines.
 */
export function updateCompletedLines(card: BingoCard): BingoCard {
  const completedLines = findCompletedLines(card);
  return {
    ...card,
    completedLines,
  };
}

/**
 * Gets the progress (number of completed lines) for a card.
 * Returns 0-5 (capped at 5 for B-I-N-G-O display).
 */
export function getProgress(card: BingoCard): number {
  return Math.min(card.completedLines.length, 5);
}

/**
 * Checks if a card is a winner (5 or more completed lines).
 */
export function isWinner(card: BingoCard): boolean {
  return card.completedLines.length >= 5;
}

/**
 * Gets all cells that are part of any completed line.
 */
export function getCompletedCells(card: BingoCard): Set<string> {
  const cells = new Set<string>();
  
  for (const line of card.completedLines) {
    for (const [row, col] of line.cells) {
      cells.add(`${row},${col}`);
    }
  }
  
  return cells;
}

/**
 * Checks if a specific cell is part of a completed line.
 */
export function isCellInCompletedLine(
  card: BingoCard,
  row: number,
  col: number
): boolean {
  return card.completedLines.some((line) =>
    line.cells.some(([r, c]) => r === row && c === col)
  );
}

/**
 * Gets the count of each line type completed.
 */
export function getLineTypeCounts(card: BingoCard): Record<LineType, number> {
  const counts: Record<LineType, number> = {
    horizontal: 0,
    vertical: 0,
    diagonal: 0,
  };
  
  for (const line of card.completedLines) {
    counts[line.type]++;
  }
  
  return counts;
}
