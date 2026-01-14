/**
 * Core type definitions for the BINGO game
 * Based on: specs/001-bingo-game/data-model.md
 */

// ============================================================================
// Enums / Union Types
// ============================================================================

/** Current phase of a game session */
export type GameStatus = 'lobby' | 'playing' | 'completed';

/** Player's connection state */
export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

/** Type of line on a BINGO card */
export type LineType = 'horizontal' | 'vertical' | 'diagonal';

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Represents a valid line on a BINGO card.
 * There are 12 possible lines: 5 horizontal, 5 vertical, 2 diagonal.
 */
export interface LineDefinition {
  /** Type of line */
  type: LineType;
  /** Array of [row, col] coordinates that make up this line */
  cells: [number, number][];
}

/**
 * Represents a participant in the game.
 * Card and progress are stored locally, not synced over network.
 */
export interface Player {
  /** Unique player identifier (Trystero peer ID) */
  id: string;
  /** Display name chosen by player (1-20 chars) */
  name: string;
  /** Current connection state */
  connectionStatus: ConnectionStatus;
  /** Whether this player is the session host */
  isHost: boolean;
  /** Timestamp when player joined (Unix epoch ms) */
  joinedAt: number;
}

/**
 * A player's 5x5 BINGO grid.
 * PRIVACY: Never transmitted over network.
 */
export interface BingoCard {
  /** 5x5 matrix of numbers (1-25, each appearing once) */
  grid: number[][];
  /** 5x5 matrix of marked states */
  marked: boolean[][];
  /** List of completed line definitions */
  completedLines: LineDefinition[];
}

/**
 * Represents an active multiplayer game session.
 * Owned and broadcast by the host.
 */
export interface GameSession {
  /** Unique session identifier (room code) - 6 alphanumeric chars, uppercase */
  id: string;
  /** Current game phase */
  status: GameStatus;
  /** Player ID of the current host */
  hostId: string;
  /** List of connected players (min 1, max 5) */
  players: Player[];
  /** Index of player whose turn it is (0 to players.length - 1) */
  currentTurnIndex: number;
  /** Ordered list of called numbers (each 1-25, no duplicates) */
  calledNumbers: number[];
  /** Player ID of winner, null until game ends */
  winnerId: string | null;
  /** Timestamp of session creation (Unix epoch ms) */
  createdAt: number;
}

// ============================================================================
// Derived Types (for convenience)
// ============================================================================

/** Player info that is synced over the network (excludes card/progress) */
export type SyncedPlayer = Pick<
  Player,
  'id' | 'name' | 'connectionStatus' | 'isHost'
>;

/** Session info that is synced over the network */
export interface SyncedSession {
  id: string;
  status: GameStatus;
  hostId: string;
  players: SyncedPlayer[];
  currentTurnIndex: number;
  calledNumbers: number[];
  winnerId: string | null;
}

// ============================================================================
// Constants
// ============================================================================

/** Minimum number of players required to start a game */
export const MIN_PLAYERS = 2;

/** Maximum number of players allowed in a session */
export const MAX_PLAYERS = 5;

/** Size of the BINGO grid (5x5) */
export const GRID_SIZE = 5;

/** Total numbers on a card (1-25) */
export const TOTAL_NUMBERS = 25;

/** Number of lines needed to win (B-I-N-G-O = 5 letters) */
export const LINES_TO_WIN = 5;

/** Room code length */
export const ROOM_CODE_LENGTH = 6;

/** Reconnection timeout in milliseconds */
export const RECONNECT_TIMEOUT_MS = 30_000;

/** Maximum player name length */
export const MAX_NAME_LENGTH = 20;
