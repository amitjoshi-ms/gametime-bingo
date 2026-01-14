/**
 * Input validation helpers
 * Based on: specs/001-bingo-game/spec.md
 */

import type { GameSession, Player } from './types';
import { TOTAL_NUMBERS, MIN_PLAYERS, MAX_PLAYERS, MAX_NAME_LENGTH } from './types';

/**
 * Validates if a number is within the valid range (1-25).
 */
export function isValidNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= TOTAL_NUMBERS;
}

/**
 * Checks if a number has already been called in the session.
 */
export function isNumberCalled(session: GameSession, num: number): boolean {
  return session.calledNumbers.includes(num);
}

/**
 * Checks if a player can call a specific number.
 * Returns true if:
 * - Game is in 'playing' status
 * - It's the player's turn
 * - Number is valid (1-25)
 * - Number hasn't been called yet
 */
export function canCallNumber(
  session: GameSession,
  playerId: string,
  num: number
): boolean {
  // Must be in playing state
  if (session.status !== 'playing') {
    return false;
  }

  // Must be player's turn
  const currentPlayer = session.players[session.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    return false;
  }

  // Number must be valid
  if (!isValidNumber(num)) {
    return false;
  }

  // Number must not have been called
  if (isNumberCalled(session, num)) {
    return false;
  }

  return true;
}

/**
 * Validates a player name.
 */
export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_NAME_LENGTH;
}

/**
 * Checks if a player can join the session.
 */
export function canPlayerJoin(session: GameSession): boolean {
  // Can only join in lobby state
  if (session.status !== 'lobby') {
    return false;
  }

  // Must not be at max capacity
  if (session.players.length >= MAX_PLAYERS) {
    return false;
  }

  return true;
}

/**
 * Checks if the game can be started.
 */
export function canStartGame(session: GameSession): boolean {
  // Must be in lobby state
  if (session.status !== 'lobby') {
    return false;
  }

  // Must have minimum players
  if (session.players.length < MIN_PLAYERS) {
    return false;
  }

  return true;
}

/**
 * Checks if it's a specific player's turn.
 */
export function isPlayerTurn(session: GameSession, playerId: string): boolean {
  if (session.status !== 'playing') {
    return false;
  }

  const currentPlayer = session.players[session.currentTurnIndex];
  return currentPlayer?.id === playerId;
}

/**
 * Gets the current player whose turn it is.
 */
export function getCurrentPlayer(session: GameSession): Player | undefined {
  return session.players[session.currentTurnIndex];
}

/**
 * Validates a room code format (6 uppercase alphanumeric).
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Gets validation error message for number call attempt.
 */
export function getCallNumberError(
  session: GameSession,
  playerId: string,
  num: number
): string | null {
  if (session.status !== 'playing') {
    return 'Game is not in progress';
  }

  const currentPlayer = session.players[session.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    return "It's not your turn";
  }

  if (!isValidNumber(num)) {
    return 'Invalid number (must be 1-25)';
  }

  if (isNumberCalled(session, num)) {
    return 'Number already called';
  }

  return null;
}

/**
 * Gets validation error for player join attempt.
 */
export function getJoinError(session: GameSession, playerName: string): string | null {
  if (session.status !== 'lobby') {
    return 'Game has already started';
  }

  if (session.players.length >= MAX_PLAYERS) {
    return 'Game is full';
  }

  if (!isValidPlayerName(playerName)) {
    return `Name must be 1-${MAX_NAME_LENGTH} characters`;
  }

  return null;
}
