/**
 * localStorage helpers for session persistence
 * Based on: specs/001-bingo-game/spec.md (FR-021)
 */

const STORAGE_KEY = 'gametime-bingo-state';

/**
 * State that is persisted to localStorage for session recovery.
 */
export interface PersistedState {
  /** Player's unique ID */
  playerId: string;
  /** Player's display name */
  playerName: string;
  /** Current room code (null if not in a room) */
  roomCode: string | null;
  /** Whether this player was the host */
  wasHost: boolean;
  /** Timestamp when state was saved */
  savedAt: number;
  /** Card seed for regeneration (if game was in progress) */
  cardSeed?: number;
}

/**
 * Saves state to localStorage.
 */
export function saveState(state: PersistedState): void {
  try {
    const data: PersistedState = {
      ...state,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // localStorage might be unavailable or full
    console.warn('Failed to save state to localStorage:', error);
  }
}

/**
 * Loads state from localStorage.
 * Returns null if no state exists or if it's invalid/expired.
 */
export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const state = JSON.parse(raw) as PersistedState;

    // Validate required fields
    if (!state.playerId || !state.playerName) {
      return null;
    }

    // Check if state is too old (1 hour expiry per spec assumptions)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - state.savedAt > ONE_HOUR) {
      clearState();
      return null;
    }

    return state;
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clears saved state from localStorage.
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear state from localStorage:', error);
  }
}

/**
 * Updates specific fields in the persisted state.
 */
export function updateState(updates: Partial<PersistedState>): void {
  const current = loadState();
  if (current) {
    saveState({ ...current, ...updates });
  }
}

/**
 * Checks if there is a saved session that can be recovered.
 */
export function hasSavedSession(): boolean {
  const state = loadState();
  return state !== null && state.roomCode !== null;
}

/**
 * Gets the saved room code if available.
 */
export function getSavedRoomCode(): string | null {
  const state = loadState();
  return state?.roomCode ?? null;
}

// ============================================================================
// Player preferences (separate from session state)
// ============================================================================

const PREFS_KEY = 'gametime-bingo-prefs';

export interface PlayerPreferences {
  /** Last used player name */
  lastPlayerName: string;
  /** Sound effects enabled */
  soundEnabled: boolean;
  /** Vibration enabled (mobile) */
  vibrationEnabled: boolean;
}

const DEFAULT_PREFS: PlayerPreferences = {
  lastPlayerName: '',
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * Loads player preferences.
 */
export function loadPreferences(): PlayerPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return DEFAULT_PREFS;
    }
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Saves player preferences.
 */
export function savePreferences(prefs: Partial<PlayerPreferences>): void {
  try {
    const current = loadPreferences();
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch (error) {
    console.warn('Failed to save preferences:', error);
  }
}
