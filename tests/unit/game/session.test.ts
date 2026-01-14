/**
 * Unit tests for session management
 */

import { describe, it, expect } from 'vitest';
import {
  createSession,
  addPlayer,
  removePlayer,
  startGame,
  canStartGame,
  callNumber,
  endGame,
  advanceTurn,
} from '../../../src/lib/game/session';
import { MIN_PLAYERS, MAX_PLAYERS } from '../../../src/lib/game/types';

describe('session.ts', () => {
  describe('createSession', () => {
    it('should create a new session with host as first player', () => {
      const session = createSession('ABC123', 'host-id', 'Host Name');
      
      expect(session.id).toBe('ABC123');
      expect(session.status).toBe('lobby');
      expect(session.hostId).toBe('host-id');
      expect(session.players.length).toBe(1);
      expect(session.players[0]?.id).toBe('host-id');
      expect(session.players[0]?.name).toBe('Host Name');
      expect(session.players[0]?.isHost).toBe(true);
      expect(session.currentTurnIndex).toBe(0);
      expect(session.calledNumbers).toEqual([]);
      expect(session.winnerId).toBeNull();
    });
  });

  describe('addPlayer', () => {
    it('should add a player to the session', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      
      expect(session.players.length).toBe(2);
      expect(session.players[1]?.id).toBe('player-2');
      expect(session.players[1]?.name).toBe('Player 2');
      expect(session.players[1]?.isHost).toBe(false);
    });

    it('should throw if game has already started', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = startGame(session);
      
      expect(() => addPlayer(session, 'player-3', 'Player 3')).toThrow('Cannot join: game has already started');
    });

    it('should throw if game is full', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      
      // Add players until full
      for (let i = 2; i <= MAX_PLAYERS; i++) {
        session = addPlayer(session, `player-${i}`, `Player ${i}`);
      }
      
      expect(session.players.length).toBe(MAX_PLAYERS);
      expect(() => addPlayer(session, 'extra', 'Extra')).toThrow('Cannot join: game is full');
    });

    it('should throw if player already exists', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      
      expect(() => addPlayer(session, 'player-2', 'Player 2 Again')).toThrow('Player already in session');
    });
  });

  describe('removePlayer', () => {
    it('should remove a player from the session', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = addPlayer(session, 'player-3', 'Player 3');
      
      session = removePlayer(session, 'player-2');
      
      expect(session.players.length).toBe(2);
      expect(session.players.some(p => p.id === 'player-2')).toBe(false);
    });

    it('should not change session if player not found', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      const originalPlayers = session.players.length;
      
      session = removePlayer(session, 'nonexistent');
      
      expect(session.players.length).toBe(originalPlayers);
    });
  });

  describe('canStartGame', () => {
    it('should return false with only one player', () => {
      const session = createSession('ABC123', 'host-id', 'Host');
      expect(canStartGame(session)).toBe(false);
    });

    it('should return true with minimum players', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      for (let i = 2; i <= MIN_PLAYERS; i++) {
        session = addPlayer(session, `player-${i}`, `Player ${i}`);
      }
      expect(canStartGame(session)).toBe(true);
    });

    it('should return false if game already started', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = startGame(session);
      
      expect(canStartGame(session)).toBe(false);
    });
  });

  describe('startGame', () => {
    it('should change status to playing', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = startGame(session);
      
      expect(session.status).toBe('playing');
    });

    it('should throw if not enough players', () => {
      const session = createSession('ABC123', 'host-id', 'Host');
      expect(() => startGame(session)).toThrow();
    });
  });

  describe('callNumber', () => {
    it('should add number to calledNumbers', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = startGame(session);
      session = callNumber(session, 10);
      
      expect(session.calledNumbers).toContain(10);
    });

    it('should advance to next turn using advanceTurn', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = startGame(session);
      
      const initialTurn = session.currentTurnIndex;
      session = advanceTurn(session);
      
      expect(session.currentTurnIndex).not.toBe(initialTurn);
    });

    it('should throw if number already called', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = startGame(session);
      session = callNumber(session, 10);
      
      expect(() => callNumber(session, 10)).toThrow();
    });

    it('should throw if number is out of range', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = startGame(session);
      
      expect(() => callNumber(session, 0)).toThrow();
      expect(() => callNumber(session, 26)).toThrow();
      expect(() => callNumber(session, -1)).toThrow();
    });
  });

  describe('advanceTurn', () => {
    it('should wrap around to first player after last', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      // Start with first player (index 0)
      session = startGame(session, 0);
      
      // Start at 0, advance to 1
      session = advanceTurn(session);
      expect(session.currentTurnIndex).toBe(1);
      
      // Advance from 1 back to 0
      session = advanceTurn(session);
      expect(session.currentTurnIndex).toBe(0);
    });
  });

  describe('endGame', () => {
    it('should set winnerId and status to completed', () => {
      let session = createSession('ABC123', 'host-id', 'Host');
      session = addPlayer(session, 'player-2', 'Player 2');
      session = startGame(session);
      session = endGame(session, 'player-2');
      
      expect(session.winnerId).toBe('player-2');
      expect(session.status).toBe('completed');
    });
  });
});
