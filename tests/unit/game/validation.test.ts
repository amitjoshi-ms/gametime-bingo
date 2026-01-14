/**
 * Unit tests for validation helpers
 */

import { describe, it, expect } from 'vitest';
import {
  isValidNumber,
  isNumberCalled,
  canCallNumber,
  isValidPlayerName,
  canPlayerJoin,
  canStartGame,
  isPlayerTurn,
  getCurrentPlayer,
  isValidRoomCode,
  getCallNumberError,
  getJoinError,
} from '../../../src/lib/game/validation';
import type { GameSession, Player } from '../../../src/lib/game/types';
import { MIN_PLAYERS, MAX_PLAYERS, MAX_NAME_LENGTH } from '../../../src/lib/game/types';

// Helper to create test session
function createTestSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: 'TEST01',
    status: 'lobby',
    hostId: 'host-1',
    players: [
      { id: 'host-1', name: 'Host', connectionStatus: 'connected', isHost: true, joinedAt: 1000 },
      { id: 'player-2', name: 'Player2', connectionStatus: 'connected', isHost: false, joinedAt: 2000 },
    ],
    currentTurnIndex: 0,
    calledNumbers: [],
    winnerId: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('validation.ts', () => {
  describe('isValidNumber', () => {
    it('should return true for numbers 1-25', () => {
      for (let i = 1; i <= 25; i++) {
        expect(isValidNumber(i)).toBe(true);
      }
    });

    it('should return false for 0', () => {
      expect(isValidNumber(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isValidNumber(-1)).toBe(false);
      expect(isValidNumber(-10)).toBe(false);
    });

    it('should return false for numbers greater than 25', () => {
      expect(isValidNumber(26)).toBe(false);
      expect(isValidNumber(100)).toBe(false);
    });

    it('should return false for non-integers', () => {
      expect(isValidNumber(1.5)).toBe(false);
      expect(isValidNumber(10.1)).toBe(false);
    });

    it('should return false for NaN and Infinity', () => {
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
    });
  });

  describe('isNumberCalled', () => {
    it('should return true if number is in calledNumbers', () => {
      const session = createTestSession({ calledNumbers: [5, 10, 15] });
      expect(isNumberCalled(session, 5)).toBe(true);
      expect(isNumberCalled(session, 10)).toBe(true);
      expect(isNumberCalled(session, 15)).toBe(true);
    });

    it('should return false if number is not in calledNumbers', () => {
      const session = createTestSession({ calledNumbers: [5, 10, 15] });
      expect(isNumberCalled(session, 1)).toBe(false);
      expect(isNumberCalled(session, 20)).toBe(false);
    });

    it('should return false for empty calledNumbers', () => {
      const session = createTestSession({ calledNumbers: [] });
      expect(isNumberCalled(session, 1)).toBe(false);
    });
  });

  describe('canCallNumber', () => {
    it('should return true when all conditions are met', () => {
      const session = createTestSession({
        status: 'playing',
        currentTurnIndex: 0,
        calledNumbers: [],
      });
      expect(canCallNumber(session, 'host-1', 10)).toBe(true);
    });

    it('should return false when game is not playing', () => {
      const session = createTestSession({ status: 'lobby' });
      expect(canCallNumber(session, 'host-1', 10)).toBe(false);
    });

    it('should return false when it is not the player turn', () => {
      const session = createTestSession({
        status: 'playing',
        currentTurnIndex: 1, // Player 2's turn
      });
      expect(canCallNumber(session, 'host-1', 10)).toBe(false);
    });

    it('should return false for invalid numbers', () => {
      const session = createTestSession({ status: 'playing' });
      expect(canCallNumber(session, 'host-1', 0)).toBe(false);
      expect(canCallNumber(session, 'host-1', 26)).toBe(false);
    });

    it('should return false for already called numbers', () => {
      const session = createTestSession({
        status: 'playing',
        calledNumbers: [10],
      });
      expect(canCallNumber(session, 'host-1', 10)).toBe(false);
    });
  });

  describe('isValidPlayerName', () => {
    it('should return true for valid names', () => {
      expect(isValidPlayerName('Alice')).toBe(true);
      expect(isValidPlayerName('A')).toBe(true);
      expect(isValidPlayerName('Player 123')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidPlayerName('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isValidPlayerName('   ')).toBe(false);
      expect(isValidPlayerName('\t\n')).toBe(false);
    });

    it('should return false for names exceeding max length', () => {
      const longName = 'A'.repeat(MAX_NAME_LENGTH + 1);
      expect(isValidPlayerName(longName)).toBe(false);
    });

    it('should return true for names at max length', () => {
      const maxName = 'A'.repeat(MAX_NAME_LENGTH);
      expect(isValidPlayerName(maxName)).toBe(true);
    });

    it('should trim whitespace when checking length', () => {
      expect(isValidPlayerName('  Bob  ')).toBe(true);
    });
  });

  describe('canPlayerJoin', () => {
    it('should return true when session is in lobby and not full', () => {
      const session = createTestSession({ status: 'lobby' });
      expect(canPlayerJoin(session)).toBe(true);
    });

    it('should return false when game has started', () => {
      const session = createTestSession({ status: 'playing' });
      expect(canPlayerJoin(session)).toBe(false);
    });

    it('should return false when game is completed', () => {
      const session = createTestSession({ status: 'completed' });
      expect(canPlayerJoin(session)).toBe(false);
    });

    it('should return false when session is full', () => {
      const players: Player[] = Array.from({ length: MAX_PLAYERS }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        connectionStatus: 'connected',
        isHost: i === 0,
        joinedAt: Date.now(),
      }));
      const session = createTestSession({ players });
      expect(canPlayerJoin(session)).toBe(false);
    });
  });

  describe('canStartGame', () => {
    it('should return true with minimum players in lobby', () => {
      const players: Player[] = Array.from({ length: MIN_PLAYERS }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        connectionStatus: 'connected',
        isHost: i === 0,
        joinedAt: Date.now(),
      }));
      const session = createTestSession({ status: 'lobby', players });
      expect(canStartGame(session)).toBe(true);
    });

    it('should return false with fewer than minimum players', () => {
      const session = createTestSession({
        status: 'lobby',
        players: [{ id: 'host-1', name: 'Host', connectionStatus: 'connected', isHost: true, joinedAt: 1000 }],
      });
      expect(canStartGame(session)).toBe(false);
    });

    it('should return false when not in lobby', () => {
      const session = createTestSession({ status: 'playing' });
      expect(canStartGame(session)).toBe(false);
    });
  });

  describe('isPlayerTurn', () => {
    it('should return true when it is the player turn', () => {
      const session = createTestSession({
        status: 'playing',
        currentTurnIndex: 0,
      });
      expect(isPlayerTurn(session, 'host-1')).toBe(true);
    });

    it('should return false when it is not the player turn', () => {
      const session = createTestSession({
        status: 'playing',
        currentTurnIndex: 1,
      });
      expect(isPlayerTurn(session, 'host-1')).toBe(false);
    });

    it('should return false when game is not playing', () => {
      const session = createTestSession({ status: 'lobby' });
      expect(isPlayerTurn(session, 'host-1')).toBe(false);
    });
  });

  describe('getCurrentPlayer', () => {
    it('should return the current player', () => {
      const session = createTestSession({ currentTurnIndex: 0 });
      const player = getCurrentPlayer(session);
      expect(player?.id).toBe('host-1');
    });

    it('should return the correct player when turn advances', () => {
      const session = createTestSession({ currentTurnIndex: 1 });
      const player = getCurrentPlayer(session);
      expect(player?.id).toBe('player-2');
    });

    it('should return undefined for empty players', () => {
      const session = createTestSession({ players: [] });
      expect(getCurrentPlayer(session)).toBeUndefined();
    });
  });

  describe('isValidRoomCode', () => {
    it('should return true for valid 6-character uppercase alphanumeric codes', () => {
      expect(isValidRoomCode('ABC123')).toBe(true);
      expect(isValidRoomCode('XYZABC')).toBe(true);
      expect(isValidRoomCode('123456')).toBe(true);
    });

    it('should return false for lowercase codes', () => {
      expect(isValidRoomCode('abc123')).toBe(false);
      expect(isValidRoomCode('Abc123')).toBe(false);
    });

    it('should return false for codes shorter than 6 characters', () => {
      expect(isValidRoomCode('ABC12')).toBe(false);
      expect(isValidRoomCode('A')).toBe(false);
      expect(isValidRoomCode('')).toBe(false);
    });

    it('should return false for codes longer than 6 characters', () => {
      expect(isValidRoomCode('ABC1234')).toBe(false);
      expect(isValidRoomCode('ABCDEFGHIJ')).toBe(false);
    });

    it('should return false for codes with special characters', () => {
      expect(isValidRoomCode('ABC-12')).toBe(false);
      expect(isValidRoomCode('ABC_12')).toBe(false);
      expect(isValidRoomCode('ABC 12')).toBe(false);
    });
  });

  describe('getCallNumberError', () => {
    it('should return null when call is valid', () => {
      const session = createTestSession({
        status: 'playing',
        currentTurnIndex: 0,
        calledNumbers: [],
      });
      expect(getCallNumberError(session, 'host-1', 10)).toBeNull();
    });

    it('should return error when game not in progress', () => {
      const session = createTestSession({ status: 'lobby' });
      expect(getCallNumberError(session, 'host-1', 10)).toBe('Game is not in progress');
    });

    it('should return error when not player turn', () => {
      const session = createTestSession({
        status: 'playing',
        currentTurnIndex: 1,
      });
      expect(getCallNumberError(session, 'host-1', 10)).toBe("It's not your turn");
    });

    it('should return error for invalid number', () => {
      const session = createTestSession({ status: 'playing' });
      expect(getCallNumberError(session, 'host-1', 0)).toBe('Invalid number (must be 1-25)');
    });

    it('should return error for already called number', () => {
      const session = createTestSession({
        status: 'playing',
        calledNumbers: [10],
      });
      expect(getCallNumberError(session, 'host-1', 10)).toBe('Number already called');
    });
  });

  describe('getJoinError', () => {
    it('should return null when join is valid', () => {
      const session = createTestSession({ status: 'lobby' });
      expect(getJoinError(session, 'ValidName')).toBeNull();
    });

    it('should return error when game started', () => {
      const session = createTestSession({ status: 'playing' });
      expect(getJoinError(session, 'ValidName')).toBe('Game has already started');
    });

    it('should return error when game is full', () => {
      const players: Player[] = Array.from({ length: MAX_PLAYERS }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        connectionStatus: 'connected',
        isHost: i === 0,
        joinedAt: Date.now(),
      }));
      const session = createTestSession({ players });
      expect(getJoinError(session, 'ValidName')).toBe('Game is full');
    });

    it('should return error for invalid name', () => {
      const session = createTestSession({ status: 'lobby' });
      expect(getJoinError(session, '')).toContain('Name must be');
    });
  });
});
