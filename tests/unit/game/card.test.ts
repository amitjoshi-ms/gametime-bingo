/**
 * Unit tests for card generation and manipulation
 */

import { describe, it, expect } from 'vitest';
import {
  generateCard,
  markNumber,
  findNumberPosition,
  shuffleArray,
  createEmptyMarked,
} from '../../../src/lib/game/card';
import { GRID_SIZE, TOTAL_NUMBERS } from '../../../src/lib/game/types';

describe('card.ts', () => {
  describe('shuffleArray', () => {
    it('should return array with same elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffleArray(arr);
      expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should produce deterministic results with seed', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result1 = shuffleArray(arr, 12345);
      const result2 = shuffleArray(arr, 12345);
      expect(result1).toEqual(result2);
    });

    it('should produce different results with different seeds', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result1 = shuffleArray(arr, 12345);
      const result2 = shuffleArray(arr, 54321);
      expect(result1).not.toEqual(result2);
    });

    it('should not modify original array', () => {
      const arr = [1, 2, 3, 4, 5];
      shuffleArray(arr);
      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('createEmptyMarked', () => {
    it('should create 5x5 grid of false values', () => {
      const marked = createEmptyMarked();
      expect(marked.length).toBe(GRID_SIZE);
      for (const row of marked) {
        expect(row.length).toBe(GRID_SIZE);
        expect(row.every(cell => cell === false)).toBe(true);
      }
    });
  });

  describe('generateCard', () => {
    it('should create a 5x5 grid', () => {
      const card = generateCard();
      expect(card.grid.length).toBe(GRID_SIZE);
      for (const row of card.grid) {
        expect(row.length).toBe(GRID_SIZE);
      }
    });

    it('should contain numbers 1-25 exactly once', () => {
      const card = generateCard();
      const allNumbers = card.grid.flat().sort((a, b) => a - b);
      const expected = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
      expect(allNumbers).toEqual(expected);
    });

    it('should have empty marked array', () => {
      const card = generateCard();
      expect(card.marked.every(row => row.every(cell => cell === false))).toBe(true);
    });

    it('should have empty completedLines array', () => {
      const card = generateCard();
      expect(card.completedLines).toEqual([]);
    });

    it('should produce deterministic results with seed', () => {
      const card1 = generateCard(42);
      const card2 = generateCard(42);
      expect(card1.grid).toEqual(card2.grid);
    });

    it('should produce different results with different seeds', () => {
      const card1 = generateCard(42);
      const card2 = generateCard(999);
      expect(card1.grid).not.toEqual(card2.grid);
    });
  });

  describe('findNumberPosition', () => {
    it('should find number that exists on card', () => {
      const card = generateCard(42);
      // Every number 1-25 should be findable
      for (let num = 1; num <= TOTAL_NUMBERS; num++) {
        const pos = findNumberPosition(card, num);
        expect(pos).not.toBeNull();
        const [row, col] = pos!;
        expect(card.grid[row]![col]).toBe(num);
      }
    });

    it('should return null for number not on card', () => {
      const card = generateCard();
      expect(findNumberPosition(card, 0)).toBeNull();
      expect(findNumberPosition(card, 26)).toBeNull();
      expect(findNumberPosition(card, -1)).toBeNull();
    });
  });

  describe('markNumber', () => {
    it('should mark a number that exists on the card', () => {
      const card = generateCard(42);
      const pos = findNumberPosition(card, 1);
      expect(pos).not.toBeNull();
      
      const markedCard = markNumber(card, 1);
      const [row, col] = pos!;
      expect(markedCard.marked[row]![col]).toBe(true);
    });

    it('should not modify original card', () => {
      const card = generateCard(42);
      markNumber(card, 1);
      expect(card.marked.every(row => row.every(cell => cell === false))).toBe(true);
    });

    it('should return unchanged card for number not on card', () => {
      const card = generateCard();
      const result = markNumber(card, 100);
      expect(result).toBe(card);
    });

    it('should preserve existing marks', () => {
      let card = generateCard(42);
      card = markNumber(card, 1);
      card = markNumber(card, 2);
      
      const pos1 = findNumberPosition(card, 1);
      const pos2 = findNumberPosition(card, 2);
      
      expect(card.marked[pos1![0]]![pos1![1]]).toBe(true);
      expect(card.marked[pos2![0]]![pos2![1]]).toBe(true);
    });
  });
});
