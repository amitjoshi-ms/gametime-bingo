/**
 * Host-specific message handlers
 * Based on: specs/001-bingo-game/contracts/p2p-protocol.md
 */

import type { GameSession } from '../game/types';
import type { SerializableLineDefinition } from './messages';
import { MAX_PLAYERS, LINES_TO_WIN } from '../game/types';
import { canCallNumber, isNumberCalled, isValidNumber } from '../game/validation';
import { addPlayer, removePlayer, callNumber, advanceTurn, endGame } from '../game/session';
import { LINES } from '../game/lines';
import type {
  PlayerJoinPayload,
  CallNumberPayload,
  DeclareWinnerPayload,
  SyncStatePayload,
  NumberCalledPayload,
  GameOverPayload,
  ErrorPayload,
  PlayerLeavePayload,
} from './messages';
import { getActions } from './room';

// ============================================================================
// Types
// ============================================================================

export interface HostHandlers {
  handlePlayerJoin: (payload: PlayerJoinPayload, peerId: string) => GameSession | null;
  handleCallNumber: (payload: CallNumberPayload, peerId: string) => GameSession | null;
  handleDeclareWinner: (payload: DeclareWinnerPayload, peerId: string) => GameSession | null;
  handlePlayerLeave: (payload: PlayerLeavePayload, peerId: string) => GameSession | null;
}

// ============================================================================
// Session State (managed by host)
// ============================================================================

let hostSession: GameSession | null = null;

/** Turn timeout timer */
let turnTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

/** Turn timeout duration in milliseconds */
export const TURN_TIMEOUT_MS = 30000;

/**
 * Sets the host's session state.
 */
export function setHostSession(session: GameSession | null): void {
  hostSession = session;
  // Clear any existing timeout when session changes
  clearTurnTimeout();
}

/**
 * Gets the host's session state.
 */
export function getHostSession(): GameSession | null {
  return hostSession;
}

/**
 * Clears the current turn timeout.
 */
export function clearTurnTimeout(): void {
  if (turnTimeoutTimer !== null) {
    clearTimeout(turnTimeoutTimer);
    turnTimeoutTimer = null;
  }
}

/**
 * Starts a turn timeout.
 * If the current turn player doesn't act within TURN_TIMEOUT_MS
 * and is disconnected, their turn is automatically skipped.
 */
export function startTurnTimeout(): void {
  clearTurnTimeout();
  
  if (!hostSession || hostSession.status !== 'playing') {
    return;
  }
  
  turnTimeoutTimer = setTimeout(() => {
    if (!hostSession || hostSession.status !== 'playing') {
      return;
    }
    
    const currentPlayer = hostSession.players[hostSession.currentTurnIndex];
    if (!currentPlayer) {
      return;
    }
    
    // Only skip if player is disconnected or reconnecting
    if (currentPlayer.connectionStatus !== 'connected') {
      // Auto-skip the turn
      autoSkipTurn(currentPlayer.id);
    } else {
      // Player is connected, restart the timeout
      startTurnTimeout();
    }
  }, TURN_TIMEOUT_MS);
}

/**
 * Automatically skips a player's turn due to timeout.
 */
function autoSkipTurn(playerId: string): void {
  if (!hostSession || hostSession.status !== 'playing') {
    return;
  }
  
  const currentPlayer = hostSession.players[hostSession.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    return; // Turn already changed
  }
  
  // Advance to next turn
  const nextTurnIndex = (hostSession.currentTurnIndex + 1) % hostSession.players.length;
  hostSession = advanceTurn(hostSession);
  
  // Broadcast turn skip as a num-called with number 0 (skip indicator)
  const actions = getActions();
  if (actions) {
    const numberCalledPayload: NumberCalledPayload = {
      type: 'num-called',
      number: 0, // 0 indicates a skipped turn (no actual number called)
      calledBy: playerId,
      nextTurnIndex,
      timestamp: Date.now(),
    };
    actions.sendNumberCalled(numberCalledPayload);
  }
  
  // Broadcast updated state
  broadcastSyncState(hostSession);
  
  // Start timeout for next player
  startTurnTimeout();
}

// ============================================================================
// Host Message Handlers
// ============================================================================

/**
 * Handles a player-join request.
 * Validates player count, adds player, broadcasts sync-state.
 */
export function handlePlayerJoin(
  payload: PlayerJoinPayload,
  peerId: string
): GameSession | null {
  if (!hostSession) {
    sendError(peerId, 'NO_SESSION', 'No active session', 'player-join');
    return null;
  }

  // Check if player already exists (reconnection scenario)
  const existingPlayer = hostSession.players.find((p) => p.id === payload.player.id);
  if (existingPlayer) {
    // Player reconnecting - update their status and send sync state
    hostSession = {
      ...hostSession,
      players: hostSession.players.map((p) =>
        p.id === payload.player.id
          ? { ...p, connectionStatus: 'connected' as const }
          : p
      ),
    };
    broadcastSyncState(hostSession);
    return hostSession;
  }

  // Check if game already started (new players can't join mid-game)
  if (hostSession.status !== 'lobby') {
    sendError(peerId, 'GAME_STARTED', 'Game has already started', 'player-join');
    return null;
  }

  // Check player count
  if (hostSession.players.length >= MAX_PLAYERS) {
    sendError(peerId, 'GAME_FULL', 'Game is full', 'player-join');
    return null;
  }

  try {
    // Add the player
    hostSession = addPlayer(hostSession, payload.player.id, payload.player.name);
    
    // Broadcast updated state to all
    broadcastSyncState(hostSession);
    
    return hostSession;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join';
    sendError(peerId, 'JOIN_FAILED', message, 'player-join');
    return null;
  }
}

/**
 * Handles a call-number request.
 * Validates turn and number, broadcasts num-called.
 */
export function handleCallNumber(
  payload: CallNumberPayload,
  peerId: string
): GameSession | null {
  if (!hostSession) {
    sendError(peerId, 'NO_SESSION', 'No active session', 'call-number');
    return null;
  }

  // Validate the call
  if (!canCallNumber(hostSession, payload.playerId, payload.number)) {
    // Determine specific error
    if (hostSession.status !== 'playing') {
      sendError(peerId, 'NOT_PLAYING', 'Game is not in progress', 'call-number');
    } else if (!isValidNumber(payload.number)) {
      sendError(peerId, 'INVALID_NUMBER', 'Invalid number', 'call-number');
    } else if (isNumberCalled(hostSession, payload.number)) {
      sendError(peerId, 'NUMBER_ALREADY_CALLED', 'Number already called', 'call-number');
    } else {
      sendError(peerId, 'INVALID_TURN', "It's not your turn", 'call-number');
    }
    return null;
  }

  try {
    // Add number to called numbers
    hostSession = callNumber(hostSession, payload.number);
    
    // Advance turn
    const nextTurnIndex = (hostSession.currentTurnIndex + 1) % hostSession.players.length;
    hostSession = advanceTurn(hostSession);
    
    // Broadcast num-called to all
    const actions = getActions();
    if (actions) {
      const numberCalledPayload: NumberCalledPayload = {
        type: 'num-called',
        number: payload.number,
        calledBy: payload.playerId,
        nextTurnIndex,
        timestamp: Date.now(),
      };
      actions.sendNumberCalled(numberCalledPayload);
    }
    
    // Restart turn timeout for next player
    startTurnTimeout();
    
    return hostSession;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to call number';
    sendError(peerId, 'CALL_FAILED', message, 'call-number');
    return null;
  }
}

/**
 * Handles a claim-win request.
 * Validates the claim and broadcasts game-over if valid.
 */
export function handleDeclareWinner(
  payload: DeclareWinnerPayload,
  peerId: string
): GameSession | null {
  if (!hostSession) {
    sendError(peerId, 'NO_SESSION', 'No active session', 'claim-win');
    return null;
  }

  if (hostSession.status !== 'playing') {
    sendError(peerId, 'NOT_PLAYING', 'Game is not in progress', 'claim-win');
    return null;
  }

  // Validate claimed lines
  if (payload.completedLineCount < LINES_TO_WIN) {
    sendError(peerId, 'NOT_ENOUGH_LINES', 'Not enough lines to win', 'claim-win');
    return null;
  }

  // Verify that claimed lines are possible with called numbers
  // We can't verify the exact card, but we can check line validity
  const isValidClaim = validateWinClaim(payload.completedLines, hostSession.calledNumbers);
  
  if (!isValidClaim) {
    sendError(peerId, 'INVALID_CLAIM', 'Invalid win claim', 'claim-win');
    return null;
  }

  // End the game
  hostSession = endGame(hostSession, payload.playerId);
  
  // Broadcast game-over
  const actions = getActions();
  if (actions) {
    const gameOverPayload: GameOverPayload = {
      type: 'game-over',
      winnerId: payload.playerId,
      reason: 'winner',
      timestamp: Date.now(),
    };
    actions.sendGameOver(gameOverPayload);
  }
  
  return hostSession;
}

/**
 * Handles a player-leave request.
 */
export function handlePlayerLeave(
  payload: PlayerLeavePayload,
  _peerId: string
): GameSession | null {
  if (!hostSession) {
    return null;
  }

  hostSession = removePlayer(hostSession, payload.playerId);
  
  // Check if game should end (not enough players)
  if (hostSession.status === 'playing' && hostSession.players.length < 2) {
    // Last player wins by default
    const winner = hostSession.players[0];
    if (winner) {
      hostSession = endGame(hostSession, winner.id);
      
      const actions = getActions();
      if (actions) {
        const gameOverPayload: GameOverPayload = {
          type: 'game-over',
          winnerId: winner.id,
          reason: 'forfeit',
          timestamp: Date.now(),
        };
        actions.sendGameOver(gameOverPayload);
      }
    }
  } else {
    // Broadcast updated state
    broadcastSyncState(hostSession);
  }
  
  return hostSession;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates that a win claim is possible with the called numbers.
 * We can't verify exact card ownership, but we can detect impossible claims.
 */
function validateWinClaim(
  claimedLines: SerializableLineDefinition[],
  _calledNumbers: number[]
): boolean {
  // Must have enough lines
  if (claimedLines.length < LINES_TO_WIN) {
    return false;
  }

  // Each claimed line must be a valid line definition
  for (const line of claimedLines) {
    const isValidLine = LINES.some(
      (l) =>
        l.type === line.type &&
        l.cells.length === line.cells.length &&
        l.cells.every(([r, c], i) => {
          const claimed = line.cells[i];
          return claimed && claimed[0] === r && claimed[1] === c;
        })
    );
    
    if (!isValidLine) {
      return false;
    }
  }

  // We can't verify cell contents without knowing the player's card
  // The host trusts the client claim (privacy requirement)
  return true;
}

/**
 * Broadcasts sync-state to all peers.
 */
export function broadcastSyncState(session: GameSession): void {
  const actions = getActions();
  if (!actions) return;

  const payload: SyncStatePayload = {
    type: 'sync-state',
    session: {
      id: session.id,
      status: session.status,
      hostId: session.hostId,
      players: session.players.map((p) => ({
        id: p.id,
        name: p.name,
        connectionStatus: p.connectionStatus,
        isHost: p.isHost,
      })),
      currentTurnIndex: session.currentTurnIndex,
      calledNumbers: session.calledNumbers,
      winnerId: session.winnerId,
    },
    timestamp: Date.now(),
  };

  actions.sendSyncState(payload);
}

/**
 * Sends an error to a specific peer.
 */
function sendError(
  peerId: string,
  code: string,
  message: string,
  originalAction: string
): void {
  const actions = getActions();
  if (!actions) return;

  const payload: ErrorPayload = {
    type: 'error',
    code,
    message,
    originalAction,
  };

  actions.sendError(payload, peerId);
}

// ============================================================================
// Host Registration
// ============================================================================

/**
 * Registers all host handlers with the current room actions.
 */
export function registerHostHandlers(): void {
  const actions = getActions();
  if (!actions) return;

  actions.onPlayerJoin((payload, peerId) => {
    handlePlayerJoin(payload, peerId);
  });

  actions.onCallNumber((payload, peerId) => {
    handleCallNumber(payload, peerId);
  });

  actions.onDeclareWinner((payload, peerId) => {
    handleDeclareWinner(payload, peerId);
  });

  actions.onPlayerLeave((payload, peerId) => {
    handlePlayerLeave(payload, peerId);
  });
}

// ============================================================================
// Host Failover
// ============================================================================

import type { HostTransferPayload } from './messages';

/**
 * Determines the next host based on player order.
 * Returns the ID of the new host, or null if no eligible players.
 */
export function determineNextHost(currentHostId: string): string | null {
  if (!hostSession) return null;
  
  // Get connected or reconnecting players (excluding current host)
  const eligiblePlayers = hostSession.players.filter(
    (p) => p.id !== currentHostId && p.connectionStatus !== 'disconnected'
  );
  
  if (eligiblePlayers.length === 0) return null;
  
  // Return the first eligible player
  return eligiblePlayers[0]?.id ?? null;
}

/**
 * Handles host transfer when the current host disconnects.
 * Should be called by the new host after receiving new-host message.
 */
export function becomeHost(session: GameSession, localPlayerId: string): void {
  // Update session to reflect new host
  const updatedSession: GameSession = {
    ...session,
    hostId: localPlayerId,
    players: session.players.map((p) =>
      p.id === localPlayerId
        ? { ...p, isHost: true }
        : { ...p, isHost: false }
    ),
  };
  
  // Set as host session
  setHostSession(updatedSession);
  
  // Register host handlers
  registerHostHandlers();
  
  // Start turn timeout if game is in progress
  if (updatedSession.status === 'playing') {
    startTurnTimeout();
  }
  
  // Broadcast updated state to all peers
  broadcastSyncState(updatedSession);
}

/**
 * Broadcasts a new-host message to all peers.
 */
export function broadcastHostTransfer(newHostId: string, reason: 'disconnect' | 'manual'): void {
  const actions = getActions();
  if (!actions) return;

  const payload: HostTransferPayload = {
    type: 'new-host',
    newHostId,
    reason,
  };

  actions.sendHostTransfer(payload);
}
