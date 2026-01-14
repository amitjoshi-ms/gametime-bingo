/**
 * Unit tests for line detection
 */

import { describe, it, expect } from 'vitest';
import {
  LINES,
  isLineComplete,
  findCompletedLines,
  getNewlyCompletedLines,
  updateCompletedLines,
  getProgress,
  isWinner,
} from '../../../src/lib/game/lines';
import type { BingoCard, LineDefinition } from '../../../src/lib/game/types';

// Helper to create a card with specific marks
function createTestCard(marks: [number, number][]): BingoCard {
  const grid = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];
  const marked = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false));
  
  for (const [row, col] of marks) {
    if (marked[row]) {
      marked[row][col] = true;
    }
  }
  
  return { grid, marked, completedLines: [] };
}

describe('lines.ts', () => {
  describe('LINES constant', () => {
    it('should have 12 lines total', () => {
      expect(LINES.length).toBe(12);
    });

    it('should have 5 horizontal lines', () => {
      const horizontal = LINES.filter(l => l.type === 'horizontal');
      expect(horizontal.length).toBe(5);
    });

    it('should have 5 vertical lines', () => {
      const vertical = LINES.filter(l => l.type === 'vertical');
      expect(vertical.length).toBe(5);
    });

    it('should have 2 diagonal lines', () => {
      const diagonal = LINES.filter(l => l.type === 'diagonal');
      expect(diagonal.length).toBe(2);
    });

    it('each line should have 5 cells', () => {
      for (const line of LINES) {
        expect(line.cells.length).toBe(5);
      }
    });
  });

  describe('isLineComplete', () => {
    it('should return true for completed horizontal line', () => {
      const card = createTestCard([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
      const horizontalLine = LINES.find(l => 
        l.type === 'horizontal' && l.cells[0]![0] === 0
      )!;
      expect(isLineComplete(card, horizontalLine)).toBe(true);
    });

    it('should return false for incomplete line', () => {
      const card = createTestCard([[0, 0], [0, 1], [0, 2], [0, 3]]);
      const horizontalLine = LINES.find(l => 
        l.type === 'horizontal' && l.cells[0]![0] === 0
      )!;
      expect(isLineComplete(card, horizontalLine)).toBe(false);
    });

    it('should return true for completed diagonal', () => {
      const card = createTestCard([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
      const diagonalLine = LINES.find(l => 
        l.type === 'diagonal' && l.cells[0]![0] === 0 && l.cells[0]![1] === 0
      )!;
      expect(isLineComplete(card, diagonalLine)).toBe(true);
    });
  });

  describe('findCompletedLines', () => {
    it('should return empty array for card with no completed lines', () => {
      const card = createTestCard([]);
      expect(findCompletedLines(card)).toEqual([]);
    });

    it('should find one completed horizontal line', () => {
      const card = createTestCard([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
      const completed = findCompletedLines(card);
      expect(completed.length).toBe(1);
      expect(completed[0]?.type).toBe('horizontal');
    });

    it('should find multiple completed lines', () => {
      // Mark first row and first column (2 lines intersecting at 0,0)
      const card = createTestCard([
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],  // first row
        [1, 0], [2, 0], [3, 0], [4, 0],           // rest of first column
      ]);
      const completed = findCompletedLines(card);
      expect(completed.length).toBe(2);
    });
  });

  describe('getNewlyCompletedLines', () => {
    it('should return empty for identical arrays', () => {
      const lines = [LINES[0]!];
      expect(getNewlyCompletedLines(lines, lines)).toEqual([]);
    });

    it('should return new lines not in before', () => {
      const before: LineDefinition[] = [];
      const after = [LINES[0]!];
      const newLines = getNewlyCompletedLines(before, after);
      expect(newLines.length).toBe(1);
    });
  });

  describe('updateCompletedLines', () => {
    it('should update card with completed lines', () => {
      const card = createTestCard([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
      const updated = updateCompletedLines(card);
      expect(updated.completedLines.length).toBe(1);
    });
  });

  describe('getProgress', () => {
    it('should return 0 for card with no lines', () => {
      const card: BingoCard = {
        grid: [],
        marked: [],
        completedLines: [],
      };
      expect(getProgress(card)).toBe(0);
    });

    it('should cap at 5', () => {
      const card: BingoCard = {
        grid: [],
        marked: [],
        completedLines: LINES.slice(0, 7), // 7 lines
      };
      expect(getProgress(card)).toBe(5);
    });
  });

  describe('isWinner', () => {
    it('should return false with less than 5 lines', () => {
      const card: BingoCard = {
        grid: [],
        marked: [],
        completedLines: LINES.slice(0, 4),
      };
      expect(isWinner(card)).toBe(false);
    });

    it('should return true with exactly 5 lines', () => {
      const card: BingoCard = {
        grid: [],
        marked: [],
        completedLines: LINES.slice(0, 5),
      };
      expect(isWinner(card)).toBe(true);
    });

    it('should return true with more than 5 lines', () => {
      const card: BingoCard = {
        grid: [],
        marked: [],
        completedLines: LINES.slice(0, 8),
      };
      expect(isWinner(card)).toBe(true);
    });
  });
});
