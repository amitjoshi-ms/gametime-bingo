/**
 * State synchronization handlers
 * Based on: specs/001-bingo-game/contracts/p2p-protocol.md
 */

import type { GameSession } from '../game/types';
import type {
  SyncStatePayload,
  NumberCalledPayload,
  GameOverPayload,
  StartGamePayload,
  ErrorPayload,
  HostTransferPayload,
} from './messages';
import { getActions } from './room';
import * as gameStore from '../stores/game.svelte';
import * as playerStore from '../stores/player.svelte';

// ============================================================================
// Callbacks
// ============================================================================

type SyncCallback = (session: GameSession) => void;
type NumberCalledCallback = (number: number, calledBy: string, nextTurnIndex: number) => void;
type GameOverCallback = (winnerId: string | null, reason: string) => void;
type StartGameCallback = (firstPlayerIndex: number) => void;
type ErrorCallback = (code: string, message: string, originalAction?: string) => void;
type HostTransferCallback = (newHostId: string, reason: string) => void;

let onSyncCallback: SyncCallback | null = null;
let onNumberCalledCallback: NumberCalledCallback | null = null;
let onGameOverCallback: GameOverCallback | null = null;
let onStartGameCallback: StartGameCallback | null = null;
let onErrorCallback: ErrorCallback | null = null;
let onHostTransferCallback: HostTransferCallback | null = null;

// ============================================================================
// Event Registration
// ============================================================================

export function onSync(callback: SyncCallback): void {
  onSyncCallback = callback;
}

export function onNumberCalled(callback: NumberCalledCallback): void {
  onNumberCalledCallback = callback;
}

export function onGameOver(callback: GameOverCallback): void {
  onGameOverCallback = callback;
}

export function onStartGame(callback: StartGameCallback): void {
  onStartGameCallback = callback;
}

export function onError(callback: ErrorCallback): void {
  onErrorCallback = callback;
}

export function onHostTransfer(callback: HostTransferCallback): void {
  onHostTransferCallback = callback;
}

// ============================================================================
// Sync State Handling
// ============================================================================

/**
 * Processes a sync-state message from the host.
 */
function handleSyncState(payload: SyncStatePayload): void {
  const session: GameSession = {
    id: payload.session.id,
    status: payload.session.status,
    hostId: payload.session.hostId,
    players: payload.session.players.map((p) => ({
      id: p.id,
      name: p.name,
      connectionStatus: p.connectionStatus,
      isHost: p.isHost,
      joinedAt: Date.now(), // Not sent over network, use current time
    })),
    currentTurnIndex: payload.session.currentTurnIndex,
    calledNumbers: payload.session.calledNumbers,
    winnerId: payload.session.winnerId,
    createdAt: Date.now(), // Not sent over network
  };

  // Update game store
  gameStore.setSession(session);

  // If we have a card, re-apply marks from called numbers
  if (playerStore.getCard() && session.calledNumbers.length > 0) {
    playerStore.reapplyMarks(session.calledNumbers);
  }

  // Notify callback
  onSyncCallback?.(session);
}

/**
 * Processes a num-called message.
 */
function handleNumberCalled(payload: NumberCalledPayload): void {
  // Update game store
  gameStore.callNumber(payload.number);
  gameStore.advanceTurn();

  // Mark on local card
  const newLineCompleted = playerStore.markNumber(payload.number);

  // Check for win
  if (newLineCompleted && playerStore.getHasWon()) {
    // Auto-declare winner
    sendDeclareWinner();
  }

  // Notify callback
  onNumberCalledCallback?.(payload.number, payload.calledBy, payload.nextTurnIndex);
}

/**
 * Processes a game-over message.
 */
function handleGameOver(payload: GameOverPayload): void {
  gameStore.endGame(payload.winnerId);
  onGameOverCallback?.(payload.winnerId, payload.reason);
}

/**
 * Processes a start-game message.
 */
function handleStartGame(payload: StartGamePayload): void {
  // Generate local card
  playerStore.generateNewCard();

  // Update game store
  gameStore.startGame(payload.firstPlayerIndex);

  onStartGameCallback?.(payload.firstPlayerIndex);
}

/**
 * Processes an error message.
 */
function handleError(payload: ErrorPayload): void {
  console.error(`[P2P Error] ${payload.code}: ${payload.message}`);
  onErrorCallback?.(payload.code, payload.message, payload.originalAction);
}

/**
 * Processes a new-host message.
 */
function handleHostTransfer(payload: HostTransferPayload): void {
  gameStore.transferHost(payload.newHostId);
  onHostTransferCallback?.(payload.newHostId, payload.reason);
}

// ============================================================================
// Outgoing Messages
// ============================================================================

/**
 * Sends a player-join message to the host.
 */
export function sendPlayerJoin(playerId: string, playerName: string): void {
  const actions = getActions();
  if (!actions) return;

  actions.sendPlayerJoin({
    type: 'player-join',
    player: { id: playerId, name: playerName },
  });
}

/**
 * Sends a call-number message to the host.
 */
export function sendCallNumber(playerId: string, number: number): void {
  const actions = getActions();
  if (!actions) return;

  actions.sendCallNumber({
    type: 'call-number',
    playerId,
    number,
  });
}

/**
 * Sends a claim-win message to the host.
 */
export function sendDeclareWinner(): void {
  const actions = getActions();
  const card = playerStore.getCard();
  const playerId = playerStore.getPlayerId();
  
  if (!actions || !card) return;

  // Serialize LineDefinition for network transmission
  const serializedLines = card.completedLines.map((line) => ({
    type: line.type,
    cells: line.cells.map(([r, c]) => [r, c]),
  }));

  actions.sendDeclareWinner({
    type: 'claim-win',
    playerId,
    completedLineCount: card.completedLines.length,
    completedLines: serializedLines,
  });
}

/**
 * Sends a player-leave message.
 */
export function sendPlayerLeave(playerId: string, reason: 'intentional' | 'timeout'): void {
  const actions = getActions();
  if (!actions) return;

  actions.sendPlayerLeave({
    type: 'player-leave',
    playerId,
    reason,
  });
}

// ============================================================================
// Handler Registration
// ============================================================================

/**
 * Registers all sync handlers with the current room actions.
 */
export function registerSyncHandlers(): void {
  const actions = getActions();
  if (!actions) return;

  actions.onSyncState((payload) => {
    handleSyncState(payload);
  });

  actions.onNumberCalled((payload) => {
    handleNumberCalled(payload);
  });

  actions.onGameOver((payload) => {
    handleGameOver(payload);
  });

  actions.onStartGame((payload) => {
    handleStartGame(payload);
  });

  actions.onError((payload) => {
    handleError(payload);
  });

  actions.onHostTransfer((payload) => {
    handleHostTransfer(payload);
  });
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Unregisters all callbacks.
 */
export function clearCallbacks(): void {
  onSyncCallback = null;
  onNumberCalledCallback = null;
  onGameOverCallback = null;
  onStartGameCallback = null;
  onErrorCallback = null;
  onHostTransferCallback = null;
}
