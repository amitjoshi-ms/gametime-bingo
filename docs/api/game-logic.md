# Game Logic API

Complete API reference for the pure game logic layer (`src/lib/game/`).

## 📖 Overview

The game logic layer contains pure functions that handle all BINGO game rules, card generation, session management, and validation. All functions are side-effect free and fully testable.

## 📁 Module Structure

```
src/lib/game/
├── card.ts          # Card generation and manipulation
├── lines.ts         # Line definitions
├── session.ts       # Session state management
├── types.ts         # TypeScript type definitions
└── validation.ts    # Input validation
```

## 🃏 card.ts

### `generateCard(seed?: number): BingoCard`

Generates a new BINGO card with numbers 1-25 randomly arranged in a 5x5 grid.

**Parameters**:
- `seed` (optional): Number for deterministic generation (useful for testing)

**Returns**: `BingoCard` object with:
- `grid`: 5x5 matrix of numbers (1-25, each unique)
- `marked`: 5x5 matrix of boolean (all false initially)
- `completedLines`: Empty array initially

**Example**:
```typescript
import { generateCard } from '$lib/game/card';

const card = generateCard();
console.log(card.grid); // [[3, 7, 12, ...], [...], ...]

// With seed for testing
const testCard = generateCard(12345);
```

---

### `markNumber(card: BingoCard, number: number): BingoCard`

Marks a number on the card if it exists. Returns a new card (immutable).

**Parameters**:
- `card`: The BINGO card to mark
- `number`: The number to mark (1-25)

**Returns**: New `BingoCard` with the number marked

**Example**:
```typescript
import { markNumber } from '$lib/game/card';

let card = generateCard();
card = markNumber(card, 7);  // Marks 7 if present on card
console.log(card.marked);  // [[false, true, ...], ...]
```

**Note**: This function is pure - it doesn't mutate the original card.

---

### `findNumberPosition(card: BingoCard, number: number): [number, number] | null`

Finds the position of a number on the card.

**Parameters**:
- `card`: The BINGO card
- `number`: The number to find

**Returns**: `[row, col]` tuple or `null` if not found

**Example**:
```typescript
const position = findNumberPosition(card, 7);
if (position) {
  const [row, col] = position;
  console.log(`Found at row ${row}, col ${col}`);
}
```

---

### `updateCompletedLines(card: BingoCard): BingoCard`

Scans the card and updates the `completedLines` array.

**Parameters**:
- `card`: The BINGO card to check

**Returns**: New `BingoCard` with updated `completedLines`

**Example**:
```typescript
import { updateCompletedLines } from '$lib/game/card';

let card = generateCard();
// ... mark some numbers ...
card = updateCompletedLines(card);
console.log(card.completedLines.length);  // 0-5
```

---

### Utility Functions

#### `shuffleArray<T>(array: T[], seed?: number): T[]`

Fisher-Yates shuffle algorithm with optional seeding.

**Example**:
```typescript
import { shuffleArray } from '$lib/game/card';

const nums = [1, 2, 3, 4, 5];
const shuffled = shuffleArray(nums);
console.log(shuffled);  // [3, 1, 5, 2, 4] (random)

// Deterministic shuffle for testing
const testShuffled = shuffleArray(nums, 12345);
```

#### `createEmptyMarked(): boolean[][]`

Creates a 5x5 matrix of false values.

---

## 📏 lines.ts

### `ALL_LINES: LineDefinition[]`

Array of all 12 possible line definitions (5 horizontal, 5 vertical, 2 diagonal).

**Type**:
```typescript
interface LineDefinition {
  type: 'horizontal' | 'vertical' | 'diagonal';
  cells: [number, number][];  // Array of [row, col] coordinates
}
```

**Example**:
```typescript
import { ALL_LINES } from '$lib/game/lines';

console.log(ALL_LINES.length);  // 12
console.log(ALL_LINES[0]);  
// { type: 'horizontal', cells: [[0,0], [0,1], [0,2], [0,3], [0,4]] }
```

---

### `isLineCompleted(marked: boolean[][], line: LineDefinition): boolean`

Checks if a line is completed.

**Parameters**:
- `marked`: 5x5 matrix of marked states
- `line`: Line definition to check

**Returns**: `true` if all cells in the line are marked

**Example**:
```typescript
import { isLineCompleted, ALL_LINES } from '$lib/game/lines';

const isFirstRowComplete = isLineCompleted(card.marked, ALL_LINES[0]);
```

---

### `findCompletedLines(marked: boolean[][]): LineDefinition[]`

Finds all completed lines on a card.

**Parameters**:
- `marked`: 5x5 matrix of marked states

**Returns**: Array of completed `LineDefinition` objects

**Example**:
```typescript
import { findCompletedLines } from '$lib/game/lines';

const completedLines = findCompletedLines(card.marked);
console.log(completedLines.length);  // 0-5 (max for win)
```

---

## 🎮 session.ts

### `createSession(roomCode: string, hostId: string, hostName: string): GameSession`

Creates a new game session in lobby state.

**Parameters**:
- `roomCode`: 6-character room code
- `hostId`: Host player ID
- `hostName`: Host player name

**Returns**: New `GameSession` object

**Example**:
```typescript
import { createSession } from '$lib/game/session';

const session = createSession('ABC123', 'player-1', 'Alice');
console.log(session.status);  // 'lobby'
console.log(session.players.length);  // 1 (host)
```

---

### `addPlayer(session: GameSession, playerId: string, playerName: string): GameSession`

Adds a player to the session.

**Parameters**:
- `session`: Current game session
- `playerId`: New player ID
- `playerName`: New player name

**Returns**: Updated `GameSession` with new player

**Throws**: Error if game started, session full, or player already exists

**Example**:
```typescript
import { addPlayer } from '$lib/game/session';

try {
  session = addPlayer(session, 'player-2', 'Bob');
  console.log(session.players.length);  // 2
} catch (error) {
  console.error('Cannot add player:', error.message);
}
```

---

### `removePlayer(session: GameSession, playerId: string): GameSession`

Removes a player from the session.

**Parameters**:
- `session`: Current game session
- `playerId`: Player ID to remove

**Returns**: Updated `GameSession` without the player

**Example**:
```typescript
import { removePlayer } from '$lib/game/session';

session = removePlayer(session, 'player-2');
console.log(session.players.length);  // 1
```

---

### `startGame(session: GameSession, firstPlayerIndex?: number): GameSession`

Starts the game from lobby state.

**Parameters**:
- `session`: Current game session
- `firstPlayerIndex` (optional): Index of first player (random if not provided)

**Returns**: Updated `GameSession` with status 'playing'

**Throws**: Error if not in lobby or insufficient players

**Example**:
```typescript
import { startGame } from '$lib/game/session';

try {
  session = startGame(session);
  console.log(session.status);  // 'playing'
  console.log(session.currentTurnIndex);  // 0 or random
} catch (error) {
  console.error('Cannot start:', error.message);
}
```

---

### `callNumber(session: GameSession, number: number): GameSession`

Adds a number to the called numbers list and advances turn.

**Parameters**:
- `session`: Current game session
- `number`: Number to call (1-25)

**Returns**: Updated `GameSession` with number called and turn advanced

**Example**:
```typescript
import { callNumber } from '$lib/game/session';

session = callNumber(session, 7);
console.log(session.calledNumbers);  // [7]
console.log(session.currentTurnIndex);  // Advanced to next player
```

---

### `setWinner(session: GameSession, winnerId: string): GameSession`

Sets the winner and ends the game.

**Parameters**:
- `session`: Current game session
- `winnerId`: ID of winning player

**Returns**: Updated `GameSession` with status 'completed' and winnerId set

**Example**:
```typescript
import { setWinner } from '$lib/game/session';

session = setWinner(session, 'player-1');
console.log(session.status);  // 'completed'
console.log(session.winnerId);  // 'player-1'
```

---

### `updatePlayerConnectionStatus(session: GameSession, playerId: string, status: ConnectionStatus): GameSession`

Updates a player's connection status.

**Parameters**:
- `session`: Current game session
- `playerId`: Player ID
- `status`: New connection status ('connected' | 'reconnecting' | 'disconnected')

**Returns**: Updated `GameSession`

---

## ✅ validation.ts

### `isValidNumber(num: number): boolean`

Checks if a number is valid for BINGO (1-25, integer).

**Parameters**:
- `num`: Number to validate

**Returns**: `true` if valid, `false` otherwise

**Example**:
```typescript
import { isValidNumber } from '$lib/game/validation';

console.log(isValidNumber(7));    // true
console.log(isValidNumber(0));    // false
console.log(isValidNumber(26));   // false
console.log(isValidNumber(1.5));  // false
```

---

### `isValidPlayerName(name: string): boolean`

Checks if a player name is valid (1-20 characters, trimmed).

**Parameters**:
- `name`: Name to validate

**Returns**: `true` if valid, `false` otherwise

**Example**:
```typescript
import { isValidPlayerName } from '$lib/game/validation';

console.log(isValidPlayerName('Alice'));  // true
console.log(isValidPlayerName(''));       // false
console.log(isValidPlayerName('A'.repeat(21)));  // false (too long)
```

---

### `isNumberCalled(session: GameSession, number: number): boolean`

Checks if a number has already been called.

**Parameters**:
- `session`: Current game session
- `number`: Number to check

**Returns**: `true` if already called, `false` otherwise

---

### `isPlayersTurn(session: GameSession, playerId: string): boolean`

Checks if it's a specific player's turn.

**Parameters**:
- `session`: Current game session
- `playerId`: Player ID to check

**Returns**: `true` if it's their turn, `false` otherwise

---

### `canStartGame(session: GameSession): boolean`

Checks if a game can be started.

**Parameters**:
- `session`: Current game session

**Returns**: `true` if can start (in lobby, 2+ players), `false` otherwise

---

### Error Getters

These functions return `string | null` - `null` if valid, error message if invalid.

#### `getJoinError(session: GameSession, playerName: string): string | null`

Validates joining a game.

**Example**:
```typescript
import { getJoinError } from '$lib/game/validation';

const error = getJoinError(session, 'Alice');
if (error) {
  console.error('Cannot join:', error);
} else {
  // Proceed with join
}
```

#### `getCallNumberError(session: GameSession, playerId: string, num: number): string | null`

Validates calling a number.

---

## 📦 types.ts

### Core Types

See [types.ts source](../../../src/lib/game/types.ts) for complete type definitions.

**Key types**:
- `GameStatus`: `'lobby' | 'playing' | 'completed'`
- `ConnectionStatus`: `'connected' | 'reconnecting' | 'disconnected'`
- `LineType`: `'horizontal' | 'vertical' | 'diagonal'`

**Key interfaces**:
- `BingoCard`: Player's card with grid, marked state, completed lines
- `Player`: Player info (id, name, connection, host status)
- `GameSession`: Complete game state
- `LineDefinition`: Definition of a valid line

**Constants**:
- `MIN_PLAYERS = 2`
- `MAX_PLAYERS = 5`
- `GRID_SIZE = 5`
- `TOTAL_NUMBERS = 25`
- `LINES_TO_WIN = 5`
- `ROOM_CODE_LENGTH = 6`
- `MAX_NAME_LENGTH = 20`

---

## 🧪 Testing Examples

### Unit Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { generateCard, markNumber } from '$lib/game/card';

describe('markNumber', () => {
  it('should mark the correct cell', () => {
    const card = generateCard(12345);  // Deterministic
    const number = card.grid[0][0];
    
    const marked = markNumber(card, number);
    
    expect(marked.marked[0][0]).toBe(true);
    expect(card.marked[0][0]).toBe(false);  // Immutability check
  });
});
```

---

## 📚 Best Practices

1. **Immutability**: Never mutate inputs, always return new objects
2. **Pure functions**: No side effects, same input = same output
3. **Type safety**: Use TypeScript types, no `any`
4. **Validation**: Always validate inputs at boundaries
5. **Testing**: All functions should be unit tested

---

## 🔗 Related Documentation

- [Architecture Overview](../architecture.md)
- [Code Style Guide](../development/code-style.md)
- [Testing Guide](../development/testing.md)
- [Network API](./network.md)
