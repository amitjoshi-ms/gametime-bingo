# Svelte Stores API

API reference for Svelte stores (`src/lib/stores/`).

## 📖 Overview

Gametime Bingo uses Svelte 5 stores with runes (`$state`, `$derived`, `$effect`) for reactive state management. Stores coordinate between game logic, network layer, and UI components.

## 📁 Module Structure

```
src/lib/stores/
├── game.svelte.ts    # Game session state
└── player.svelte.ts  # Local player state
```

## 🎮 game.svelte.ts

Manages game session state and coordinates multiplayer interactions.

### State Variables

```typescript
// Internal reactive state
let _session = $state<GameSession | null>(null);
let _localPlayerId = $state<string | null>(null);

// Derived state
const _isInGame = $derived(_session !== null);
const _isHost = $derived(
  _session !== null && 
  _localPlayerId !== null && 
  _session.hostId === _localPlayerId
);
```

### Exported Functions

#### `getSession(): GameSession | null`

Gets the current game session.

**Returns**: Current session or null if not in a game

**Example**:
```typescript
import { getSession } from '$lib/stores/game.svelte';

const session = getSession();
if (session) {
  console.log('Room code:', session.id);
  console.log('Players:', session.players.length);
}
```

---

#### `setSession(session: GameSession | null): void`

Updates the game session.

**Parameters**:
- `session`: New session state or null to leave game

**Example**:
```typescript
import { setSession } from '$lib/stores/game.svelte';

// Join/update game
setSession(newSession);

// Leave game
setSession(null);
```

---

#### `getLocalPlayerId(): string | null`

Gets the local player's ID.

**Returns**: Player ID or null if not set

---

#### `setLocalPlayerId(id: string): void`

Sets the local player's ID.

**Parameters**:
- `id`: Player ID to set

---

#### `isInGame(): boolean`

Checks if currently in a game.

**Returns**: True if in a game, false otherwise

---

#### `isHost(): boolean`

Checks if local player is the host.

**Returns**: True if host, false otherwise

---

#### `getCurrentPlayer(): Player | null`

Gets the local player's Player object from the session.

**Returns**: Player object or null if not in game

---

#### `isMyTurn(): boolean`

Checks if it's the local player's turn.

**Returns**: True if it's your turn, false otherwise

**Example**:
```svelte
<script>
  import { isMyTurn } from '$lib/stores/game.svelte';
</script>

{#if isMyTurn()}
  <NumberPad ... />
{:else}
  <p>Waiting for other player...</p>
{/if}
```

---

### Usage Patterns

**Reactive subscriptions in components**:

```svelte
<script lang="ts">
  import { getSession, isMyTurn } from '$lib/stores/game.svelte';
  
  // Access reactive state
  const session = $derived(getSession());
  const myTurn = $derived(isMyTurn());
</script>

{#if session}
  <p>Room: {session.id}</p>
  {#if myTurn}
    <p>Your turn!</p>
  {/if}
{/if}
```

**State updates**:

```typescript
import { setSession, getSession } from '$lib/stores/game.svelte';

// Update session
let session = getSession();
if (session) {
  session = callNumber(session, 7);
  setSession(session);
}
```

---

## 👤 player.svelte.ts

Manages local player state including their card and progress.

### State Variables

```typescript
let _playerId = $state<string | null>(null);
let _playerName = $state<string>('');
let _card = $state<BingoCard | null>(null);
```

### Exported Functions

#### `getPlayerId(): string`

Gets the player ID, generating one if needed.

**Returns**: Player ID (guaranteed to exist)

**Example**:
```typescript
import { getPlayerId } from '$lib/stores/player.svelte';

const id = getPlayerId();  // Always returns an ID
console.log('Player ID:', id);
```

---

#### `getPlayerName(): string`

Gets the player name.

**Returns**: Player name (empty string if not set)

---

#### `setPlayerName(name: string): void`

Sets the player name.

**Parameters**:
- `name`: Player name to set

---

#### `getCard(): BingoCard | null`

Gets the player's BINGO card.

**Returns**: Card or null if not generated

---

#### `generateNewCard(): void`

Generates a new random BINGO card for the player.

**Example**:
```typescript
import { generateNewCard, getCard } from '$lib/stores/player.svelte';

// Generate new card
generateNewCard();

// Access the card
const card = getCard();
console.log(card.grid);
```

---

#### `markCardNumber(number: number): void`

Marks a number on the player's card if present.

**Parameters**:
- `number`: Number to mark (1-25)

**Example**:
```typescript
import { markCardNumber } from '$lib/stores/player.svelte';

// Mark number 7
markCardNumber(7);
```

---

#### `getCompletedLinesCount(): number`

Gets the count of completed lines.

**Returns**: Number of completed lines (0-5)

**Example**:
```typescript
import { getCompletedLinesCount } from '$lib/stores/player.svelte';

const linesCount = getCompletedLinesCount();
console.log(`Completed ${linesCount}/5 lines`);

if (linesCount === 5) {
  console.log('BINGO!');
}
```

---

#### `hasBingo(): boolean`

Checks if the player has completed 5 lines (won).

**Returns**: True if player has BINGO, false otherwise

---

#### `resetCard(): void`

Resets the card (sets to null).

---

### Usage Patterns

**Component integration**:

```svelte
<script lang="ts">
  import { getCard, markCardNumber, getCompletedLinesCount } from '$lib/stores/player.svelte';
  
  const card = $derived(getCard());
  const progress = $derived(getCompletedLinesCount());
  
  // Mark number when called
  function handleNumberCalled(num: number) {
    markCardNumber(num);
  }
</script>

{#if card}
  <Card grid={card.grid} marked={card.marked} completedLines={card.completedLines} />
  <Progress completedLines={progress} />
{/if}
```

**Game flow**:

```typescript
import { generateNewCard, markCardNumber, hasBingo } from '$lib/stores/player.svelte';

// When joining game
generateNewCard();

// When number is called
function onNumberCalled(number: number) {
  markCardNumber(number);
  
  if (hasBingo()) {
    // Send BINGO message to host
    sendBingoMessage();
  }
}
```

---

## 🔄 Store Coordination

### Game Flow Example

```typescript
import { setSession, getSession, setLocalPlayerId } from '$lib/stores/game.svelte';
import { setPlayerName, generateNewCard } from '$lib/stores/player.svelte';

// Create game
async function createGame(playerName: string) {
  // 1. Set player info
  setPlayerName(playerName);
  const playerId = getPlayerId();
  setLocalPlayerId(playerId);
  
  // 2. Generate card
  generateNewCard();
  
  // 3. Create session
  const session = createSession(generateRoomCode(), playerId, playerName);
  setSession(session);
  
  // 4. Join P2P room
  await joinNetworkRoom(session.id);
}

// Join game
async function joinGame(roomCode: string, playerName: string) {
  // 1. Set player info
  setPlayerName(playerName);
  const playerId = getPlayerId();
  setLocalPlayerId(playerId);
  
  // 2. Generate card
  generateNewCard();
  
  // 3. Join P2P room
  await joinNetworkRoom(roomCode);
  
  // 4. Send join request (host will send back session via sync-state)
  sendPlayerJoinMessage(playerId, playerName);
}
```

---

## 💾 Persistence

Both stores integrate with localStorage for state persistence:

**game.svelte.ts**:
- Saves session state for reconnection
- Saves local player ID
- Clears on explicit leave

**player.svelte.ts**:
- Saves player name (convenience for re-joining)
- Saves player ID (persistent across sessions)
- Card is NOT persisted (regenerated each game)

**Example**:
```typescript
// Stores automatically persist
setPlayerName('Alice');  // Saved to localStorage

// On page refresh
const name = getPlayerName();  // 'Alice' (restored from localStorage)
```

---

## 🧪 Testing

### Testing with Stores

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setSession, getSession, isHost } from '$lib/stores/game.svelte';
import { createSession } from '$lib/game/session';

describe('game store', () => {
  beforeEach(() => {
    // Reset state
    setSession(null);
  });
  
  it('should set and get session', () => {
    const session = createSession('ABC123', 'player-1', 'Alice');
    setSession(session);
    
    expect(getSession()).toEqual(session);
  });
  
  it('should detect host', () => {
    const session = createSession('ABC123', 'player-1', 'Alice');
    setLocalPlayerId('player-1');
    setSession(session);
    
    expect(isHost()).toBe(true);
  });
});
```

---

## 📚 Best Practices

1. **Use derived state**: Leverage `$derived` for computed values
2. **Batch updates**: Update stores together for related changes
3. **Validate inputs**: Check data before updating stores
4. **Handle null states**: Always check if session/card exists
5. **Coordinate with network**: Update stores after network messages

---

## 🔗 Related Documentation

- [Architecture Overview](../architecture.md)
- [Game Logic API](./game-logic.md)
- [Network API](./network.md)
- [Svelte 5 Docs](https://svelte-5-preview.vercel.app/docs/runes)
