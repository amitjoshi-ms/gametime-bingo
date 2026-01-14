/**
 * Local player store - private player data that is NOT synced over network
 * Based on: specs/001-bingo-game/spec.md (FR-018, FR-019)
 */

import type { BingoCard, LineDefinition } from '../game/types';
import { generateCard, markNumber as markCardNumber } from '../game/card';
import { findCompletedLines, getNewlyCompletedLines, isWinner } from '../game/lines';
import { generatePlayerId, generateCardSeed } from '../utils/random';
import { saveState, loadState, clearState, type PersistedState } from '../utils/storage';

// ============================================================================
// Svelte 5 Runes State (Private - never sent over network!)
// ============================================================================

/** Player's unique ID */
let playerId = $state<string>(generatePlayerId());

/** Player's display name */
let playerName = $state<string>('');

/** Player's BINGO card (PRIVATE - never transmitted!) */
let card = $state<BingoCard | null>(null);

/** Seed used for card generation (for recovery) */
let cardSeed = $state<number | null>(null);

/** Lines that were just completed (for animation) */
let newlyCompletedLines = $state<LineDefinition[]>([]);

// ============================================================================
// Derived Values (exposed via getter functions for module export)
// ============================================================================

/** Internal derived values */
const _completedLineCount = $derived(card?.completedLines.length ?? 0);
const _progress = $derived(Math.min(_completedLineCount, 5));
const _hasWon = $derived(card !== null && isWinner(card));
const _cardGrid = $derived(card?.grid ?? null);
const _markedCells = $derived(card?.marked ?? null);
const _completedLines = $derived(card?.completedLines ?? []);
const _recentlyCompletedLines = $derived(newlyCompletedLines);

/** Number of completed lines (0-12, but shown as 0-5 for B-I-N-G-O) */
export function getCompletedLineCount(): number {
  return _completedLineCount;
}

/** Progress for B-I-N-G-O display (0-5) */
export function getProgress(): number {
  return _progress;
}

/** Whether player has won (5+ lines) */
export function getHasWon(): boolean {
  return _hasWon;
}

/** Get the player's card grid */
export function getCardGrid(): number[][] | null {
  return _cardGrid;
}

/** Get the player's marked cells */
export function getMarkedCells(): boolean[][] | null {
  return _markedCells;
}

/** Get completed lines */
export function getCompletedLines(): LineDefinition[] {
  return _completedLines;
}

/** Get newly completed lines (for animation) */
export function getRecentlyCompletedLines(): LineDefinition[] {
  return _recentlyCompletedLines;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Sets the player name.
 */
export function setPlayerName(name: string): void {
  playerName = name;
  persistState();
}

/**
 * Gets the player name.
 */
export function getPlayerName(): string {
  return playerName;
}

/**
 * Gets the player ID.
 */
export function getPlayerId(): string {
  return playerId;
}

/**
 * Sets the player ID.
 */
export function setPlayerId(id: string): void {
  playerId = id;
  persistState();
}

/**
 * Generates a new card for the game.
 * Optionally accepts a seed for deterministic generation (recovery).
 */
export function generateNewCard(seed?: number): void {
  const useSeed = seed ?? generateCardSeed();
  cardSeed = useSeed;
  card = generateCard(useSeed);
  newlyCompletedLines = [];
  persistState();
}

/**
 * Gets the current card (for non-reactive contexts).
 */
export function getCard(): BingoCard | null {
  return card;
}

/**
 * Marks a number on the player's card.
 * Returns true if a new line was completed.
 */
export function markNumber(number: number): boolean {
  if (!card) {
    return false;
  }

  const previousLines = [...card.completedLines];
  
  // Mark the number
  card = markCardNumber(card, number);
  
  // Check for completed lines
  const currentLines = findCompletedLines(card);
  card = { ...card, completedLines: currentLines };
  
  // Find newly completed lines
  newlyCompletedLines = getNewlyCompletedLines(previousLines, currentLines);
  
  // Clear animation state after a delay
  if (newlyCompletedLines.length > 0) {
    setTimeout(() => {
      newlyCompletedLines = [];
    }, 2000);
  }
  
  return newlyCompletedLines.length > 0;
}

/**
 * Checks if a specific cell is marked.
 */
export function isCellMarked(row: number, col: number): boolean {
  return card?.marked[row]?.[col] ?? false;
}

/**
 * Gets the number at a specific position.
 */
export function getNumberAt(row: number, col: number): number | undefined {
  return card?.grid[row]?.[col];
}

/**
 * Resets player state for a new game.
 */
export function resetForNewGame(): void {
  card = null;
  cardSeed = null;
  newlyCompletedLines = [];
  clearState();
}

/**
 * Completely resets player (new ID, clear everything).
 */
export function resetPlayer(): void {
  playerId = generatePlayerId();
  playerName = '';
  card = null;
  cardSeed = null;
  newlyCompletedLines = [];
  clearState();
}

/**
 * Resets the store (alias for resetPlayer).
 */
export function reset(): void {
  resetPlayer();
}

// ============================================================================
// Persistence
// ============================================================================

/**
 * Persists current state to localStorage.
 */
function persistState(): void {
  const state: PersistedState = {
    playerId,
    playerName,
    roomCode: null, // Set by game store
    wasHost: false, // Set by game store
    savedAt: Date.now(),
    cardSeed: cardSeed ?? undefined,
  };
  saveState(state);
}

/**
 * Restores player state from localStorage.
 */
export function restoreFromStorage(): boolean {
  const state = loadState();
  if (!state) {
    return false;
  }

  playerId = state.playerId;
  playerName = state.playerName;
  
  // Regenerate card if seed is available
  if (state.cardSeed !== undefined) {
    cardSeed = state.cardSeed;
    card = generateCard(state.cardSeed);
    // Note: Marks need to be re-applied based on called numbers
    // This will be done when sync-state is received
  }
  
  return true;
}

/**
 * Re-applies marks from called numbers (for recovery).
 */
export function reapplyMarks(calledNumbers: number[]): void {
  if (!card) {
    return;
  }

  // Reset marks
  card = {
    ...card,
    marked: card.grid.map(() => card!.grid[0]!.map(() => false)),
    completedLines: [],
  };

  // Re-apply each called number
  for (const num of calledNumbers) {
    card = markCardNumber(card, num);
  }

  // Update completed lines
  card = { ...card, completedLines: findCompletedLines(card) };
}

/**
 * Updates the persisted room code.
 */
export function updatePersistedRoom(roomCode: string | null, isHost: boolean): void {
  const state = loadState();
  if (state) {
    saveState({
      ...state,
      roomCode,
      wasHost: isHost,
    });
  }
}
