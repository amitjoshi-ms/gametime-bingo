/**
 * Unit tests for localStorage persistence
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  saveState,
  loadState,
  clearState,
  updateState,
  hasSavedSession,
  type PersistedState,
} from '../../../src/lib/utils/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get _store() {
      return store;
    },
  };
})();

// Replace global localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('storage.ts', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const validState: PersistedState = {
    playerId: 'player-123',
    playerName: 'TestPlayer',
    roomCode: 'ABC123',
    wasHost: true,
    savedAt: Date.now(),
  };

  describe('saveState', () => {
    it('should save state to localStorage', () => {
      saveState(validState);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should include savedAt timestamp', () => {
      saveState(validState);
      
      const savedData = JSON.parse(localStorageMock._store['gametime-bingo-state'] || '{}');
      expect(savedData.savedAt).toBeDefined();
      expect(typeof savedData.savedAt).toBe('number');
    });

    it('should save all required fields', () => {
      saveState(validState);
      
      const savedData = JSON.parse(localStorageMock._store['gametime-bingo-state'] || '{}');
      expect(savedData.playerId).toBe(validState.playerId);
      expect(savedData.playerName).toBe(validState.playerName);
      expect(savedData.roomCode).toBe(validState.roomCode);
      expect(savedData.wasHost).toBe(validState.wasHost);
    });

    it('should save optional cardSeed if provided', () => {
      const stateWithSeed = { ...validState, cardSeed: 12345 };
      saveState(stateWithSeed);
      
      const savedData = JSON.parse(localStorageMock._store['gametime-bingo-state'] || '{}');
      expect(savedData.cardSeed).toBe(12345);
    });
  });

  describe('loadState', () => {
    it('should return null when no state exists', () => {
      expect(loadState()).toBeNull();
    });

    it('should return saved state', () => {
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(validState);
      
      const loaded = loadState();
      expect(loaded).not.toBeNull();
      expect(loaded?.playerId).toBe(validState.playerId);
      expect(loaded?.playerName).toBe(validState.playerName);
    });

    it('should return null for invalid JSON', () => {
      localStorageMock._store['gametime-bingo-state'] = 'invalid json';
      expect(loadState()).toBeNull();
    });

    it('should return null if playerId is missing', () => {
      const invalidState = { playerName: 'Test', savedAt: Date.now() };
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(invalidState);
      expect(loadState()).toBeNull();
    });

    it('should return null if playerName is missing', () => {
      const invalidState = { playerId: 'test', savedAt: Date.now() };
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(invalidState);
      expect(loadState()).toBeNull();
    });

    it('should return null and clear expired state (older than 1 hour)', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);
      
      const oldState = { ...validState, savedAt: now - (61 * 60 * 1000) }; // 61 minutes ago
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(oldState);
      
      expect(loadState()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it('should return state if less than 1 hour old', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);
      
      const recentState = { ...validState, savedAt: now - (30 * 60 * 1000) }; // 30 minutes ago
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(recentState);
      
      expect(loadState()).not.toBeNull();
    });
  });

  describe('clearState', () => {
    it('should remove state from localStorage', () => {
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(validState);
      
      clearState();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gametime-bingo-state');
    });
  });

  describe('updateState', () => {
    it('should update specific fields in existing state', () => {
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(validState);
      
      updateState({ playerName: 'NewName' });
      
      const updated = JSON.parse(localStorageMock._store['gametime-bingo-state'] || '{}');
      expect(updated.playerName).toBe('NewName');
      expect(updated.playerId).toBe(validState.playerId); // Original field preserved
    });

    it('should do nothing if no existing state', () => {
      updateState({ playerName: 'NewName' });
      // setItem should not be called if no existing state
      expect(localStorageMock._store['gametime-bingo-state']).toBeUndefined();
    });
  });

  describe('hasSavedSession', () => {
    it('should return false when no state exists', () => {
      expect(hasSavedSession()).toBe(false);
    });

    it('should return false when state has no roomCode', () => {
      const stateNoRoom = { ...validState, roomCode: null };
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(stateNoRoom);
      expect(hasSavedSession()).toBe(false);
    });

    it('should return true when valid state with roomCode exists', () => {
      localStorageMock._store['gametime-bingo-state'] = JSON.stringify(validState);
      expect(hasSavedSession()).toBe(true);
    });
  });
});
