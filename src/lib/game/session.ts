/**
 * Session state management functions
 * Based on: specs/001-bingo-game/data-model.md
 */

import type { GameSession, Player, ConnectionStatus } from './types';
import { MIN_PLAYERS, MAX_PLAYERS } from './types';
import { isValidNumber, isNumberCalled } from './validation';

/**
 * Creates a new game session in lobby state.
 */
export function createSession(
  roomCode: string,
  hostId: string,
  hostName: string
): GameSession {
  const host: Player = {
    id: hostId,
    name: hostName,
    connectionStatus: 'connected',
    isHost: true,
    joinedAt: Date.now(),
  };

  return {
    id: roomCode,
    status: 'lobby',
    hostId,
    players: [host],
    currentTurnIndex: 0,
    calledNumbers: [],
    winnerId: null,
    createdAt: Date.now(),
  };
}

/**
 * Adds a player to the session.
 * Returns the updated session or throws if invalid.
 */
export function addPlayer(
  session: GameSession,
  playerId: string,
  playerName: string
): GameSession {
  if (session.status !== 'lobby') {
    throw new Error('Cannot join: game has already started');
  }

  if (session.players.length >= MAX_PLAYERS) {
    throw new Error('Cannot join: game is full');
  }

  // Check if player already exists
  if (session.players.some((p) => p.id === playerId)) {
    throw new Error('Player already in session');
  }

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    connectionStatus: 'connected',
    isHost: false,
    joinedAt: Date.now(),
  };

  return {
    ...session,
    players: [...session.players, newPlayer],
  };
}

/**
 * Removes a player from the session.
 */
export function removePlayer(session: GameSession, playerId: string): GameSession {
  const playerIndex = session.players.findIndex((p) => p.id === playerId);
  
  if (playerIndex === -1) {
    return session; // Player not found, no change
  }

  const newPlayers = session.players.filter((p) => p.id !== playerId);

  // Adjust currentTurnIndex if needed
  let newTurnIndex = session.currentTurnIndex;
  if (session.status === 'playing') {
    if (playerIndex < session.currentTurnIndex) {
      // Removed player was before current player, shift index down
      newTurnIndex = Math.max(0, newTurnIndex - 1);
    } else if (playerIndex === session.currentTurnIndex) {
      // Removed player was current player, move to next (wrapping)
      newTurnIndex = newPlayers.length > 0 ? newTurnIndex % newPlayers.length : 0;
    }
  }

  return {
    ...session,
    players: newPlayers,
    currentTurnIndex: newTurnIndex,
  };
}

/**
 * Updates a player's connection status.
 */
export function updatePlayerStatus(
  session: GameSession,
  playerId: string,
  status: ConnectionStatus
): GameSession {
  return {
    ...session,
    players: session.players.map((p) =>
      p.id === playerId ? { ...p, connectionStatus: status } : p
    ),
  };
}

/**
 * Checks if the game can be started.
 */
export function canStartGame(session: GameSession): boolean {
  return session.status === 'lobby' && session.players.length >= MIN_PLAYERS;
}

/**
 * Starts the game with a randomly chosen first player.
 */
export function startGame(session: GameSession, firstPlayerIndex?: number): GameSession {
  if (!canStartGame(session)) {
    throw new Error('Cannot start game: not enough players');
  }

  const index = firstPlayerIndex ?? Math.floor(Math.random() * session.players.length);

  return {
    ...session,
    status: 'playing',
    currentTurnIndex: index % session.players.length,
  };
}

/**
 * Adds a called number to the session.
 */
export function callNumber(session: GameSession, number: number): GameSession {
  if (session.status !== 'playing') {
    throw new Error('Game is not in progress');
  }

  if (!isValidNumber(number)) {
    throw new Error('Invalid number');
  }

  if (isNumberCalled(session, number)) {
    throw new Error('Number already called');
  }

  return {
    ...session,
    calledNumbers: [...session.calledNumbers, number],
  };
}

/**
 * Advances to the next player's turn.
 */
export function advanceTurn(session: GameSession): GameSession {
  if (session.status !== 'playing') {
    return session;
  }

  if (session.players.length === 0) {
    return session;
  }

  const nextIndex = (session.currentTurnIndex + 1) % session.players.length;

  return {
    ...session,
    currentTurnIndex: nextIndex,
  };
}

/**
 * Advances turn, skipping disconnected players.
 * Returns the session with updated turn index.
 */
export function advanceTurnSkipDisconnected(session: GameSession): GameSession {
  if (session.status !== 'playing' || session.players.length === 0) {
    return session;
  }

  let attempts = 0;
  let nextIndex = (session.currentTurnIndex + 1) % session.players.length;

  // Try to find a connected player, but don't infinite loop
  while (attempts < session.players.length) {
    const player = session.players[nextIndex];
    if (player?.connectionStatus === 'connected') {
      break;
    }
    nextIndex = (nextIndex + 1) % session.players.length;
    attempts++;
  }

  return {
    ...session,
    currentTurnIndex: nextIndex,
  };
}

/**
 * Checks for a winner given player progress.
 * Returns the winner's player ID or null.
 */
export function checkForWinner(
  session: GameSession,
  playerProgress: Map<string, number>
): string | null {
  for (const player of session.players) {
    const progress = playerProgress.get(player.id) ?? 0;
    if (progress >= 5) {
      return player.id;
    }
  }
  return null;
}

/**
 * Ends the game with a winner.
 */
export function endGame(
  session: GameSession,
  winnerId: string | null
): GameSession {
  return {
    ...session,
    status: 'completed',
    winnerId,
  };
}

/**
 * Transfers host to another player.
 */
export function transferHost(
  session: GameSession,
  newHostId: string
): GameSession {
  // Validate new host exists
  if (!session.players.some((p) => p.id === newHostId)) {
    throw new Error('New host not found in session');
  }

  return {
    ...session,
    hostId: newHostId,
    players: session.players.map((p) => ({
      ...p,
      isHost: p.id === newHostId,
    })),
  };
}

/**
 * Finds the next available host (first connected non-host player).
 */
export function findNextHost(session: GameSession): string | null {
  for (const player of session.players) {
    if (!player.isHost && player.connectionStatus === 'connected') {
      return player.id;
    }
  }
  return null;
}

/**
 * Gets a player by ID.
 */
export function getPlayer(session: GameSession, playerId: string): Player | undefined {
  return session.players.find((p) => p.id === playerId);
}

/**
 * Gets the current player whose turn it is.
 */
export function getCurrentPlayer(session: GameSession): Player | undefined {
  return session.players[session.currentTurnIndex];
}

/**
 * Checks if there are enough connected players to continue.
 */
export function hasEnoughPlayers(session: GameSession): boolean {
  const connectedCount = session.players.filter(
    (p) => p.connectionStatus === 'connected'
  ).length;
  return connectedCount >= MIN_PLAYERS;
}
