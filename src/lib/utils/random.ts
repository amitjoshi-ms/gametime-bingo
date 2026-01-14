/**
 * Secure random utilities
 * Based on: specs/001-bingo-game/research.md (Web Crypto API)
 */

import { ROOM_CODE_LENGTH } from '../game/types';

/**
 * Characters used for room codes (uppercase alphanumeric).
 * Excludes easily confused characters: 0/O, 1/I/L.
 */
const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generates a cryptographically secure room code.
 * Uses Web Crypto API instead of Math.random() for security.
 *
 * @returns 6-character uppercase alphanumeric string
 */
export function generateRoomCode(): string {
  const array = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(array);

  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    // Use modulo to map random byte to character index
    // This introduces slight bias but is acceptable for room codes
    const byte = array[i];
    if (byte !== undefined) {
      code += ROOM_CODE_CHARS[byte % ROOM_CODE_CHARS.length];
    }
  }

  return code;
}

/**
 * Generates a cryptographically secure random integer.
 *
 * @param max - Exclusive upper bound
 * @returns Random integer from 0 to max-1
 */
export function secureRandomInt(max: number): number {
  if (max <= 0) {
    return 0;
  }

  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const value = array[0];
  
  return value !== undefined ? value % max : 0;
}

/**
 * Generates a unique player ID.
 * Uses a combination of timestamp and random bytes for uniqueness.
 */
export function generatePlayerId(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);

  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `p_${Date.now().toString(36)}_${hex}`;
}

/**
 * Generates a seed for deterministic card generation.
 * This allows cards to be regenerated after reconnection.
 */
export function generateCardSeed(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] ?? Date.now();
}

/**
 * Shuffles an array using crypto-secure randomness.
 * Fisher-Yates shuffle with secure random.
 */
export function secureShuffleArray<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }

  return result;
}
