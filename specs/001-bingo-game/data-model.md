# Data Model: Multiplayer BINGO Game

**Feature**: 001-bingo-game  
**Date**: 2026-01-13  
**Source**: [spec.md](./spec.md) Key Entities + [research.md](./research.md) Architecture

## Entity Overview

```
┌─────────────────┐     1:N     ┌─────────────────┐
│   GameSession   │─────────────│     Player      │
└─────────────────┘             └─────────────────┘
        │                               │
        │ 1:1                            │ 1:1
        ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│  CalledNumbers  │             │   BingoCard     │
└─────────────────┘             └─────────────────┘
```

---

## Entities

### GameSession

Represents an active multiplayer game. Owned and broadcast by the host.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | `string` | Unique session identifier (room code) | 6 alphanumeric chars, uppercase |
| `status` | `GameStatus` | Current game phase | One of: `lobby`, `playing`, `completed` |
| `hostId` | `string` | Player ID of the current host | Must exist in players list |
| `players` | `Player[]` | List of connected players | Min 1, max 5 |
| `currentTurnIndex` | `number` | Index of player whose turn it is | 0 to players.length - 1 |
| `calledNumbers` | `number[]` | Ordered list of called numbers | Each 1-25, no duplicates |
| `winnerId` | `string \| null` | Player ID of winner (if any) | Null until game ends |
| `createdAt` | `number` | Timestamp of session creation | Unix epoch ms |

**State Transitions**:
```
lobby ──[startGame]--> playing ──[playerWins/draw]--> completed
                           │
                           └──[allDisconnect]--> (session destroyed)
```

**Validation Rules**:
- Cannot transition to `playing` unless `players.length >= 2`
- Cannot transition to `completed` unless `status === 'playing'`
- `currentTurnIndex` only meaningful when `status === 'playing'`

---

### Player

Represents a participant in the game. Partially synced (name/status only).

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | `string` | Unique player identifier (Trystero peer ID) | Non-empty string |
| `name` | `string` | Display name chosen by player | 1-20 characters |
| `connectionStatus` | `ConnectionStatus` | Current connection state | One of: `connected`, `reconnecting`, `disconnected` |
| `isHost` | `boolean` | Whether this player is the session host | Only one player can be host |
| `joinedAt` | `number` | Timestamp when player joined | Unix epoch ms |

**Synced to other players**: `id`, `name`, `connectionStatus`, `isHost`  
**Local only**: Player's own card and progress (see BingoCard)

---

### BingoCard

A player's 5x5 BINGO grid. **Never transmitted over network** (privacy).

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `grid` | `number[][]` | 5x5 matrix of numbers | Each 1-25, all unique |
| `marked` | `boolean[][]` | 5x5 matrix of marked states | Corresponds to grid positions |
| `completedLines` | `LineDefinition[]` | List of completed line indices | Max 12 possible lines |

**Derived Properties** (computed, not stored):
- `progress`: Number of completed lines (0-5 shown as B-I-N-G-O)
- `isWinner`: Whether completedLines.length >= 5

**Validation Rules**:
- `grid` must contain exactly numbers 1-25, each appearing once
- `marked[row][col]` can only be true if corresponding number was called

---

### LineDefinition

Represents a valid line on a BINGO card (precomputed constant).

| Field | Type | Description |
|-------|------|-------------|
| `type` | `LineType` | One of: `horizontal`, `vertical`, `diagonal` |
| `cells` | `[number, number][]` | Array of [row, col] coordinates |

**All Valid Lines** (12 total):

```typescript
const LINES: LineDefinition[] = [
  // Horizontal (5 lines)
  { type: 'horizontal', cells: [[0,0], [0,1], [0,2], [0,3], [0,4]] },
  { type: 'horizontal', cells: [[1,0], [1,1], [1,2], [1,3], [1,4]] },
  { type: 'horizontal', cells: [[2,0], [2,1], [2,2], [2,3], [2,4]] },
  { type: 'horizontal', cells: [[3,0], [3,1], [3,2], [3,3], [3,4]] },
  { type: 'horizontal', cells: [[4,0], [4,1], [4,2], [4,3], [4,4]] },
  // Vertical (5 lines)
  { type: 'vertical', cells: [[0,0], [1,0], [2,0], [3,0], [4,0]] },
  { type: 'vertical', cells: [[0,1], [1,1], [2,1], [3,1], [4,1]] },
  { type: 'vertical', cells: [[0,2], [1,2], [2,2], [3,2], [4,2]] },
  { type: 'vertical', cells: [[0,3], [1,3], [2,3], [3,3], [4,3]] },
  { type: 'vertical', cells: [[0,4], [1,4], [2,4], [3,4], [4,4]] },
  // Diagonal (2 lines)
  { type: 'diagonal', cells: [[0,0], [1,1], [2,2], [3,3], [4,4]] },
  { type: 'diagonal', cells: [[0,4], [1,3], [2,2], [3,1], [4,0]] },
]
```

---

## Enums

### GameStatus

```typescript
type GameStatus = 'lobby' | 'playing' | 'completed'
```

### ConnectionStatus

```typescript
type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'
```

### LineType

```typescript
type LineType = 'horizontal' | 'vertical' | 'diagonal'
```

---

## Pure Functions (Unit-Testable Game Logic)

All game logic should be implemented as pure functions that take state and return new state:

### Card Generation

```typescript
function generateCard(seed?: number): BingoCard
// Returns a shuffled 5x5 grid with numbers 1-25
// Optional seed for deterministic testing

function createEmptyMarked(): boolean[][]
// Returns 5x5 matrix of false values
```

### Marking & Line Detection

```typescript
function markNumber(card: BingoCard, number: number): BingoCard
// Returns new card with the number marked (if present)

function findCompletedLines(card: BingoCard): LineDefinition[]
// Returns all lines that are fully marked

function getNewlyCompletedLines(
  before: LineDefinition[], 
  after: LineDefinition[]
): LineDefinition[]
// Returns lines that were just completed this turn
```

### Game State Transitions

```typescript
function canStartGame(session: GameSession): boolean
// True if lobby && players.length >= 2

function callNumber(session: GameSession, number: number): GameSession
// Returns updated session with number added to calledNumbers
// Throws if number already called or not current player's turn

function advanceTurn(session: GameSession): GameSession
// Returns session with currentTurnIndex incremented (wrapping)

function checkForWinner(
  session: GameSession, 
  playerProgress: Map<string, number>
): string | null
// Returns player ID if any player has >= 5 lines, else null
```

### Session Management

```typescript
function createSession(hostId: string, hostName: string): GameSession
// Returns new session in lobby status

function addPlayer(session: GameSession, player: Player): GameSession
// Returns session with new player added (throws if full)

function removePlayer(session: GameSession, playerId: string): GameSession
// Returns session with player removed; promotes new host if needed
```

---

## State Ownership Summary

| Data | Owner | Storage | Synced? |
|------|-------|---------|---------|
| GameSession (shared state) | Host | Memory + localStorage backup | Yes (broadcast by host) |
| Player list & statuses | Host | Memory | Yes |
| Called numbers | Host | Memory | Yes |
| Current turn | Host | Memory | Yes |
| Individual BingoCard | Each player | localStorage | **No** (private) |
| Individual progress | Each player | Computed locally | **No** (private) |
| Player name/prefs | Each player | localStorage | Partial (name synced) |

---

## localStorage Schema

```typescript
// Session recovery data
interface PersistedState {
  sessionId: string
  playerId: string
  playerName: string
  card: BingoCard | null  // Null if game hasn't started
  lastKnownSession: GameSession | null  // For reconnection
  timestamp: number
}

// Key: 'bingo_session_' + sessionId
```
