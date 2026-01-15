/**
 * P2P Message type definitions for Trystero communication
 * Based on: specs/001-bingo-game/contracts/p2p-protocol.md
 * 
 * Note: All payload interfaces include index signatures to satisfy Trystero's DataPayload constraint.
 */

import type { GameStatus, ConnectionStatus, LineType } from '../game/types';

// ============================================================================
// Base type for all message payloads (Trystero compatibility)
// ============================================================================

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// ============================================================================
// Serializable LineDefinition for network transmission
// ============================================================================

export interface SerializableLineDefinition {
  [key: string]: JsonValue;
  type: LineType;
  /** Cells as flat array: [[0,0],[0,1],...] becomes [[0,0],[0,1],...] */
  cells: number[][];
}

// ============================================================================
// Synced Player (subset sent over network)
// ============================================================================

export interface SyncedPlayerPayload {
  [key: string]: JsonValue;
  id: string;
  name: string;
  connectionStatus: ConnectionStatus;
  isHost: boolean;
}

// ============================================================================
// Message Payloads
// ============================================================================

/**
 * Full game state broadcast from host.
 * Used for: new player joins, reconnection, desync recovery.
 */
export interface SyncStatePayload {
  [key: string]: JsonValue;
  type: 'sync-state';
  session: {
    id: string;
    status: GameStatus;
    hostId: string;
    players: SyncedPlayerPayload[];
    currentTurnIndex: number;
    calledNumbers: number[];
    winnerId: string | null;
  };
  timestamp: number;
}

/**
 * Sent when a player connects to the room.
 */
export interface PlayerJoinPayload {
  [key: string]: JsonValue;
  type: 'player-join';
  player: {
    id: string;
    name: string;
  };
}

/**
 * Sent when a player intentionally leaves or times out.
 */
export interface PlayerLeavePayload {
  [key: string]: JsonValue;
  type: 'player-leave';
  playerId: string;
  reason: 'intentional' | 'timeout';
}

/**
 * Host initiates game start.
 */
export interface StartGamePayload {
  [key: string]: JsonValue;
  type: 'start-game';
  firstPlayerIndex: number;
  timestamp: number;
}

/**
 * Player calls a number during their turn.
 */
export interface CallNumberPayload {
  [key: string]: JsonValue;
  type: 'call-number';
  playerId: string;
  number: number; // 1-25
}

/**
 * Confirms a number was called (broadcast by host).
 */
export interface NumberCalledPayload {
  [key: string]: JsonValue;
  type: 'num-called';
  number: number;
  calledBy: string;
  nextTurnIndex: number;
  timestamp: number;
}

/**
 * Player declares they have achieved BINGO (5 lines).
 */
export interface DeclareWinnerPayload {
  [key: string]: JsonValue;
  type: 'claim-win';
  playerId: string;
  completedLineCount: number;
  completedLines: SerializableLineDefinition[];
}

/**
 * Announces game completion.
 */
export interface GameOverPayload {
  [key: string]: JsonValue;
  type: 'game-over';
  winnerId: string | null;
  reason: 'winner' | 'draw' | 'forfeit';
  timestamp: number;
}

/**
 * Connection health check - request.
 */
export interface PingPayload {
  [key: string]: JsonValue;
  type: 'ping';
  timestamp: number;
}

/**
 * Connection health check - response.
 */
export interface PongPayload {
  [key: string]: JsonValue;
  type: 'pong';
  originalTimestamp: number;
  respondedAt: number;
}

/**
 * Notify all peers of host change.
 */
export interface HostTransferPayload {
  [key: string]: JsonValue;
  type: 'new-host';
  newHostId: string;
  reason: 'disconnect' | 'manual';
}

/**
 * Error response from host.
 * Note: originalAction uses empty string instead of undefined for Trystero compatibility
 */
export interface ErrorPayload {
  [key: string]: JsonValue;
  type: 'error';
  code: string;
  message: string;
  originalAction: string; // Empty string if not applicable
}

// ============================================================================
// Union Type for All Messages
// ============================================================================

export type MessagePayload =
  | SyncStatePayload
  | PlayerJoinPayload
  | PlayerLeavePayload
  | StartGamePayload
  | CallNumberPayload
  | NumberCalledPayload
  | DeclareWinnerPayload
  | GameOverPayload
  | PingPayload
  | PongPayload
  | HostTransferPayload
  | ErrorPayload;

// ============================================================================
// Message Type Guards
// ============================================================================

export function isSyncState(msg: MessagePayload): msg is SyncStatePayload {
  return msg.type === 'sync-state';
}

export function isPlayerJoin(msg: MessagePayload): msg is PlayerJoinPayload {
  return msg.type === 'player-join';
}

export function isPlayerLeave(msg: MessagePayload): msg is PlayerLeavePayload {
  return msg.type === 'player-leave';
}

export function isStartGame(msg: MessagePayload): msg is StartGamePayload {
  return msg.type === 'start-game';
}

export function isCallNumber(msg: MessagePayload): msg is CallNumberPayload {
  return msg.type === 'call-number';
}

export function isNumberCalled(msg: MessagePayload): msg is NumberCalledPayload {
  return msg.type === 'num-called';
}

export function isDeclareWinner(msg: MessagePayload): msg is DeclareWinnerPayload {
  return msg.type === 'claim-win';
}

export function isGameOver(msg: MessagePayload): msg is GameOverPayload {
  return msg.type === 'game-over';
}

export function isPing(msg: MessagePayload): msg is PingPayload {
  return msg.type === 'ping';
}

export function isPong(msg: MessagePayload): msg is PongPayload {
  return msg.type === 'pong';
}

export function isHostTransfer(msg: MessagePayload): msg is HostTransferPayload {
  return msg.type === 'new-host';
}

export function isError(msg: MessagePayload): msg is ErrorPayload {
  return msg.type === 'error';
}
