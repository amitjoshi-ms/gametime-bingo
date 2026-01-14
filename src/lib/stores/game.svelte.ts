/**
 * Game session store - reactive state for the shared game session
 * Based on: specs/001-bingo-game/data-model.md
 */

import type { GameSession, Player, GameStatus, ConnectionStatus } from '../game/types';
import * as sessionFns from '../game/session';

// ============================================================================
// Svelte 5 Runes State
// ============================================================================

/** Current game session (null when not in a game) */
let session = $state<GameSession | null>(null);

/** Local player ID (set when joining/creating) */
let localPlayerId = $state<string | null>(null);

// ============================================================================
// Derived Values (internal - exposed via getters for module export)
// ============================================================================

const _isInGame = $derived(session !== null);
const _gameStatus = $derived<GameStatus | null>(session?.status ?? null);
const _isHost = $derived(
  session !== null && localPlayerId !== null && session.hostId === localPlayerId
);
const _currentTurnPlayer = $derived<Player | undefined>(
  session ? session.players[session.currentTurnIndex] : undefined
);
const _isMyTurn = $derived(
  session !== null &&
    localPlayerId !== null &&
    _currentTurnPlayer?.id === localPlayerId
);
const _players = $derived<Player[]>(session?.players ?? []);
const _playerCount = $derived(_players.length);
const _calledNumbers = $derived<number[]>(session?.calledNumbers ?? []);
const _roomCode = $derived<string | null>(session?.id ?? null);
const _winnerId = $derived<string | null>(session?.winnerId ?? null);
const _canStart = $derived(session !== null && sessionFns.canStartGame(session));
const _localPlayer = $derived<Player | undefined>(
  session && localPlayerId
    ? session.players.find((p) => p.id === localPlayerId)
    : undefined
);

// ============================================================================
// Getter Functions (for module export)
// ============================================================================

/** Whether we're currently in a game */
export function getIsInGame(): boolean {
  return _isInGame;
}

/** Current game status */
export function getGameStatus(): GameStatus | null {
  return _gameStatus;
}

/** Whether we're the host */
export function getIsHost(): boolean {
  return _isHost;
}

/** Current player whose turn it is */
export function getCurrentTurnPlayer(): Player | undefined {
  return _currentTurnPlayer;
}

/** Whether it's our turn */
export function getIsMyTurn(): boolean {
  return _isMyTurn;
}

/** All players in the session */
export function getPlayers(): Player[] {
  return _players;
}

/** Number of players */
export function getPlayerCount(): number {
  return _playerCount;
}

/** Called numbers list */
export function getCalledNumbers(): number[] {
  return _calledNumbers;
}

/** Room code */
export function getRoomCode(): string | null {
  return _roomCode;
}

/** Winner ID (if game completed) */
export function getWinnerId(): string | null {
  return _winnerId;
}

/** Whether game can be started (host only check) */
export function getCanStart(): boolean {
  return _canStart;
}

/** Get local player info */
export function getLocalPlayer(): Player | undefined {
  return _localPlayer;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Sets the game session state.
 */
export function setSession(newSession: GameSession | null): void {
  session = newSession;
}

/**
 * Gets the current session (for reading in non-reactive contexts).
 */
export function getSession(): GameSession | null {
  return session;
}

/**
 * Sets the local player ID.
 */
export function setLocalPlayerId(id: string | null): void {
  localPlayerId = id;
}

/**
 * Gets the local player ID.
 */
export function getLocalPlayerId(): string | null {
  return localPlayerId;
}

/**
 * Creates a new game session.
 */
export function createGame(roomCode: string, hostId: string, hostName: string): void {
  session = sessionFns.createSession(roomCode, hostId, hostName);
  localPlayerId = hostId;
}

/**
 * Adds a player to the session.
 */
export function addPlayer(playerId: string, playerName: string): void {
  if (session) {
    session = sessionFns.addPlayer(session, playerId, playerName);
  }
}

/**
 * Removes a player from the session.
 */
export function removePlayer(playerId: string): void {
  if (session) {
    session = sessionFns.removePlayer(session, playerId);
  }
}

/**
 * Updates a player's connection status.
 */
export function updatePlayerStatus(playerId: string, status: ConnectionStatus): void {
  if (session) {
    session = sessionFns.updatePlayerStatus(session, playerId, status);
  }
}

/**
 * Starts the game.
 */
export function startGame(firstPlayerIndex?: number): void {
  if (session && sessionFns.canStartGame(session)) {
    session = sessionFns.startGame(session, firstPlayerIndex);
  }
}

/**
 * Calls a number (adds to called numbers list).
 */
export function callNumber(number: number): void {
  if (session) {
    session = sessionFns.callNumber(session, number);
  }
}

/**
 * Advances to the next player's turn.
 */
export function advanceTurn(): void {
  if (session) {
    session = sessionFns.advanceTurn(session);
  }
}

/**
 * Ends the game with a winner.
 */
export function endGame(winner: string | null): void {
  if (session) {
    session = sessionFns.endGame(session, winner);
  }
}

/**
 * Transfers host to another player.
 */
export function transferHost(newHostId: string): void {
  if (session) {
    session = sessionFns.transferHost(session, newHostId);
  }
}

/**
 * Leaves the current game (resets state).
 */
export function leaveGame(): void {
  session = null;
  localPlayerId = null;
}

/**
 * Resets the store state (alias for leaveGame).
 */
export function reset(): void {
  session = null;
  localPlayerId = null;
}

/**
 * Checks if a specific number has been called.
 */
export function isNumberCalled(num: number): boolean {
  return session?.calledNumbers.includes(num) ?? false;
}
