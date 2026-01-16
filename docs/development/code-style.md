# Code Style Guide

Standards and conventions for writing code in Gametime Bingo.

> **Note**: This guide summarizes the official coding standards found in `.github/instructions/code-authoring.instructions.md`. For complete details, refer to that file.

## 📚 Overview

Gametime Bingo follows strict TypeScript and modern Svelte 5 patterns to ensure code quality, maintainability, and type safety.

## 🎯 Core Principles

1. **Type Safety**: Strict TypeScript, no `any` types
2. **Pure Functions**: Game logic has no side effects
3. **Explicit Reactivity**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
4. **Testability**: All logic is unit-testable
5. **Immutability**: Prefer immutable data patterns

## 🔷 TypeScript Guidelines

### Strict Mode

**Always** use strict mode (already configured):

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Type Definitions

**✅ DO**: Use explicit types

```typescript
function calculateProgress(completedLines: number): number {
  return completedLines / LINES_TO_WIN;
}

interface Player {
  readonly id: string;
  name: string;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
}
```

**❌ DON'T**: Use implicit any or loose types

```typescript
function calculateProgress(completedLines) { // ❌ No type
  return completedLines / 5;
}

let player: any = { id: '123' }; // ❌ No any
```

### Union Types for State Machines

```typescript
// ✅ DO: Use union types for states
type GameStatus = 'lobby' | 'playing' | 'completed';
type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

// ❌ DON'T: Use strings without constraints
let status: string = 'playing'; // Too loose
```

### Interfaces vs Types

```typescript
// ✅ DO: Use interface for object shapes
interface BingoCard {
  grid: number[][];
  marked: boolean[][];
  completedLines: LineDefinition[];
}

// ✅ DO: Use type for unions and intersections
type MessagePayload = PlayerJoinPayload | CallNumberPayload | SyncStatePayload;
type HostPlayer = Player & { isHost: true };
```

## 🎨 Svelte 5 Guidelines

### Runes Instead of Legacy Syntax

**✅ DO**: Use Svelte 5 runes

```svelte
<script lang="ts">
  // Reactive state
  let count = $state(0);
  
  // Derived values
  let doubled = $derived(count * 2);
  
  // Side effects
  $effect(() => {
    console.log('Count changed:', count);
    // Optional cleanup
    return () => console.log('Cleanup');
  });
  
  // Props
  interface Props {
    value: number;
    label?: string;
  }
  let { value, label = 'Default' }: Props = $props();
</script>
```

**❌ DON'T**: Use legacy reactive declarations

```svelte
<script lang="ts">
  let count = 0;
  $: doubled = count * 2; // ❌ Legacy syntax
  $: console.log(count);  // ❌ Use $effect instead
</script>
```

### Component Props

```svelte
<script lang="ts">
  // ✅ DO: Type props with interface
  interface Props {
    playerName: string;
    score?: number;
    onUpdate?: (score: number) => void;
  }
  
  let { playerName, score = 0, onUpdate }: Props = $props();
</script>
```

### Event Handlers

```svelte
<!-- ✅ DO: Use inline handlers -->
<button onclick={() => handleClick()}>Click</button>
<input oninput={(e) => handleInput(e.currentTarget.value)} />

<!-- ❌ DON'T: Use legacy on: syntax -->
<button on:click={handleClick}>Click</button>
```

## 🎮 Game Logic Guidelines

### Pure Functions

All game logic in `src/lib/game/` must be pure functions:

**✅ DO**: Return new state

```typescript
function markNumber(card: BingoCard, number: number): BingoCard {
  return {
    ...card,
    marked: card.marked.map((row, i) =>
      row.map((marked, j) =>
        marked || card.grid[i][j] === number
      )
    ),
  };
}
```

**❌ DON'T**: Mutate input

```typescript
function markNumber(card: BingoCard, number: number): void {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (card.grid[i][j] === number) {
        card.marked[i][j] = true; // ❌ Mutation
      }
    }
  }
}
```

### Validation

**✅ DO**: Explicit validation functions

```typescript
// Boolean validation
export function isValidNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= TOTAL_NUMBERS;
}

// Error getter with context
export function getCallNumberError(
  session: GameSession,
  playerId: string,
  num: number
): string | null {
  if (session.status !== 'playing') return 'Game is not in progress';
  if (!isValidNumber(num)) return 'Invalid number (must be 1-25)';
  if (session.calledNumbers.includes(num)) return 'Number already called';
  return null; // Valid
}
```

## 🌐 Network Layer Guidelines

### Message Types

**✅ DO**: Use discriminated unions with index signatures

```typescript
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface CallNumberPayload {
  [key: string]: JsonValue;  // Required for Trystero
  type: 'call-number';
  playerId: string;
  number: number;
}

export interface NumberCalledPayload {
  [key: string]: JsonValue;
  type: 'num-called';
  number: number;
  calledBy: string;
  timestamp: number;
}

export type MessagePayload = CallNumberPayload | NumberCalledPayload;
```

### Message Validation

**✅ DO**: Use type guards

```typescript
export function isCallNumber(msg: MessagePayload): msg is CallNumberPayload {
  return (
    msg.type === 'call-number' &&
    typeof msg.playerId === 'string' &&
    typeof msg.number === 'number' &&
    isValidNumber(msg.number)
  );
}

function handleMessage(raw: MessagePayload): void {
  if (isCallNumber(raw)) {
    // TypeScript knows this is CallNumberPayload
    processCallNumber(raw);
  }
}
```

### WebRTC Connection Timing

**✅ DO**: Wait for peer connection

```typescript
// Wait for peer connection callback
joinRoom(roomCode);
onPeerJoin((peerId) => {
  // WebRTC DataChannel is now open
  sendPlayerJoin(playerId, playerName);
});

// Also check for already-connected peers
const connectedPeers = getConnectedPeers();
if (connectedPeers.length > 0) {
  sendPlayerJoin(playerId, playerName);
}
```

**❌ DON'T**: Send immediately

```typescript
joinRoom(roomCode);
sendPlayerJoin(playerId, playerName); // ❌ May fail silently!
```

## 🏪 State Management

### Svelte Stores

**✅ DO**: Use Svelte 5 runes in stores

```typescript
// src/lib/stores/game.svelte.ts
let session = $state<GameSession | null>(null);
let localPlayerId = $state<string | null>(null);

// Derived state
const isInGame = $derived(session !== null);
const isHost = $derived(
  session !== null && 
  localPlayerId !== null && 
  session.hostId === localPlayerId
);

// Export functions to access state
export function getSession() {
  return session;
}

export function setSession(newSession: GameSession | null) {
  session = newSession;
}
```

### Host State Synchronization

**✅ DO**: Update both internal state and store

```typescript
// ✅ Update both hostSession AND reactive store
hostSession = addPlayer(hostSession, playerId, playerName);
gameStore.setSession(hostSession); // Update UI!
broadcastSyncState(hostSession);
```

**❌ DON'T**: Only update internal state

```typescript
// ❌ Only updating hostSession (UI won't reflect changes)
hostSession = addPlayer(hostSession, playerId, playerName);
broadcastSyncState(hostSession);
```

## 📏 Code Formatting

### Prettier Configuration

Already configured in `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

**Run formatter**: `npm run format`

### File Naming

- **Components**: `PascalCase.svelte` (e.g., `BingoCard.svelte`)
- **Stores**: `camelCase.svelte.ts` (e.g., `game.svelte.ts`)
- **Utils/Logic**: `camelCase.ts` (e.g., `validation.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`
- **Types**: `types.ts` or inline in module

## 📝 Comments & Documentation

### JSDoc for Public APIs

```typescript
/**
 * Generates a new bingo card with random numbers.
 *
 * @description Creates a 5x5 bingo card with numbers 1-25 randomly distributed.
 *
 * @param seed - Optional seed for deterministic generation (useful for testing)
 * @returns A new BingoCard with a 5x5 grid and marked state
 *
 * @example
 * ```typescript
 * const card = generateCard();
 * console.log(card.grid.flat().length); // 25
 * ```
 */
export function generateCard(seed?: number): BingoCard {
  // ...
}
```

### Inline Comments

**✅ DO**: Explain why, not what

```typescript
// Use seeded random for reproducible testing
const random = createSeededRandom(seed ?? Date.now());

// Skip checking current player - they sent the message
if (playerId === session.players[session.currentTurnIndex].id) {
  return;
}
```

**❌ DON'T**: State the obvious

```typescript
// Increment count by 1
count = count + 1;

// Loop through array
for (let i = 0; i < arr.length; i++) {
```

### No Debug Logs in Production

```typescript
// ❌ DON'T: Leave debug logs
console.log('[DEBUG] Message received:', msg);

// ✅ DO: Remove before committing
// Or use a debug flag
if (import.meta.env.DEV) {
  console.log('[DEBUG] Message received:', msg);
}
```

## ✅ Code Quality Checklist

Before committing, ensure:

- [ ] TypeScript compiles: `npm run check`
- [ ] Linting passes: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] No `any` types
- [ ] Functions have explicit return types
- [ ] Svelte components use runes (no legacy `$:`)
- [ ] Game logic is pure (no mutations)
- [ ] Network messages are typed and validated
- [ ] Error handling is comprehensive
- [ ] No hardcoded secrets
- [ ] Code is formatted: `npm run format`

## 📚 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Svelte 5 Docs](https://svelte-5-preview.vercel.app/docs/introduction)
- [Runes Guide](https://svelte-5-preview.vercel.app/docs/runes)
- [Testing Guide](./testing.md)
- [Architecture Overview](../architecture.md)

## 🔍 Code Review Focus Areas

When reviewing code, pay attention to:

1. **Type safety**: No `any`, explicit types
2. **Purity**: Game logic doesn't mutate state
3. **Validation**: All inputs validated
4. **Testing**: New code has tests
5. **Documentation**: Public APIs have JSDoc
6. **Performance**: No unnecessary re-renders
7. **Security**: No vulnerabilities introduced

See [Code Review Instructions](/.github/instructions/code-review.instructions.md) for detailed review guidelines.

---

**Remember**: These guidelines exist to keep the codebase maintainable and consistent. When in doubt, follow existing patterns in the codebase! 🚀
