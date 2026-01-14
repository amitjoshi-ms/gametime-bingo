/**
 * Unit tests for random utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateRoomCode,
  secureRandomInt,
  generatePlayerId,
  generateCardSeed,
} from '../../../src/lib/utils/random';
import { ROOM_CODE_LENGTH } from '../../../src/lib/game/types';

describe('random.ts', () => {
  describe('generateRoomCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateRoomCode();
      expect(code.length).toBe(ROOM_CODE_LENGTH);
    });

    it('should only contain uppercase alphanumeric characters', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateRoomCode();
        expect(code).toMatch(/^[A-Z0-9]+$/);
      }
    });

    it('should exclude easily confused characters (0, O, 1, I, L)', () => {
      // Generate many codes and check none contain confusing chars
      for (let i = 0; i < 100; i++) {
        const code = generateRoomCode();
        expect(code).not.toMatch(/[0OIL1]/);
      }
    });

    it('should generate unique codes (probabilistically)', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      // With 6 chars from ~30 options, collisions are very unlikely in 100 tries
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  describe('secureRandomInt', () => {
    it('should return 0 when max is 0 or negative', () => {
      expect(secureRandomInt(0)).toBe(0);
      expect(secureRandomInt(-5)).toBe(0);
    });

    it('should return values in range [0, max)', () => {
      for (let i = 0; i < 100; i++) {
        const value = secureRandomInt(10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      }
    });

    it('should return 0 for max of 1', () => {
      for (let i = 0; i < 10; i++) {
        expect(secureRandomInt(1)).toBe(0);
      }
    });

    it('should produce varied results', () => {
      const values = new Set<number>();
      for (let i = 0; i < 100; i++) {
        values.add(secureRandomInt(100));
      }
      // Should see reasonable distribution
      expect(values.size).toBeGreaterThan(30);
    });
  });

  describe('generatePlayerId', () => {
    it('should start with p_ prefix', () => {
      const id = generatePlayerId();
      expect(id.startsWith('p_')).toBe(true);
    });

    it('should contain timestamp and random parts', () => {
      const id = generatePlayerId();
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('p');
      // Timestamp part (base36)
      expect(parts[1]!.length).toBeGreaterThan(0);
      // Hex part (16 chars from 8 bytes)
      expect(parts[2]!.length).toBe(16);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generatePlayerId());
      }
      expect(ids.size).toBe(100);
    });

    it('should be a valid string with expected format', () => {
      const id = generatePlayerId();
      expect(id).toMatch(/^p_[a-z0-9]+_[a-f0-9]{16}$/);
    });
  });

  describe('generateCardSeed', () => {
    it('should return a number', () => {
      const seed = generateCardSeed();
      expect(typeof seed).toBe('number');
    });

    it('should return positive integers', () => {
      for (let i = 0; i < 10; i++) {
        const seed = generateCardSeed();
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(seed)).toBe(true);
      }
    });

    it('should generate varied seeds', () => {
      const seeds = new Set<number>();
      for (let i = 0; i < 100; i++) {
        seeds.add(generateCardSeed());
      }
      // Should see high variation
      expect(seeds.size).toBeGreaterThan(95);
    });
  });
});
