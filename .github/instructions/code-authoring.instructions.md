---
description: 'Code authoring standards for TypeScript, Svelte 5, and P2P multiplayer game development'
applyTo: '**/*.ts, **/*.svelte, **/*.js'
---

# Code Authoring Instructions

Standards and best practices for writing code in the gametime-bingo project.

> **Modularity**: This file defines *what* standards to follow when writing code.
> For *how* code is reviewed, see: `.github/instructions/code-review.instructions.md`

## Technology Stack

- **TypeScript 5.x** (strict mode)
- **Svelte 5** with runes (`$state`, `$derived`, `$effect`)
- **Trystero** for WebRTC P2P networking
- **Vite** for build tooling
- **Vitest** for unit testing
- **Playwright** for E2E testing

## Project Structure

```text
src/
  lib/
    game/       # Pure game logic (unit-testable, no side effects)
    network/    # P2P networking layer (Trystero integration)
    stores/     # Svelte stores (*.svelte.ts)
    utils/      # Utility functions
  components/   # Svelte UI components
    ui/         # Reusable UI primitives (Button, Input, Modal)
```

**Note**: Create the `components/ui/` directory when building reusable UI components.

## TypeScript Guidelines

### Strict Mode Requirements

- Enable all strict checks (`strict: true` in tsconfig)
- No implicit `any` - always provide explicit types
- Use `unknown` instead of `any` when type is truly unknown
- Prefer `interface` for object shapes, `type` for unions/intersections

### Type Definitions

```typescript
// ✅ Good: Explicit interfaces with readonly where appropriate
interface Player {
  readonly id: string;
  name: string;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  isHost: boolean;
  joinedAt: number; // Unix epoch milliseconds
}

// ✅ Good: Union types for state machines
type GameStatus = 'lobby' | 'playing' | 'completed';

// ❌ Bad: Using any
const data: any = response;
```

### Function Signatures

```typescript
// ✅ Good: Explicit parameter and return types
function validateCard(card: BingoCard, calledNumbers: Set<number>): ValidationResult {
  // ...
}

// ✅ Good: Use clear parameter and return types
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

## Svelte 5 Guidelines

### Runes Usage

```svelte
<script lang="ts">
  // ✅ Good: Use runes for reactive state
  let count = $state(0);
  let doubled = $derived(count * 2);

  // ✅ Good: Use $effect for side effects
  $effect(() => {
    console.log('Count changed:', count);
  });

  // ❌ Bad: Don't use legacy reactive declarations
  // $: doubled = count * 2;
</script>
```

**Key Concepts**:
- `$state()`: Creates reactive state (replaces `let` variables with reactivity)
- `$derived()`: Creates computed values (replaces `$:` reactive declarations)
- `$effect()`: Runs side effects when dependencies change (replaces `$:` statements with side effects)
- `$props()`: Receives component props (see Component Props section)

**Performance Tips**:
```svelte
<script lang="ts">
  // ✅ Good: Use $derived for computations
  let items = $state([1, 2, 3, 4, 5]);
  let sum = $derived(items.reduce((a, b) => a + b, 0));
  
  // ✅ Good: Cleanup in $effect
  $effect(() => {
    const timer = setInterval(() => console.log('tick'), 1000);
    return () => clearInterval(timer); // Cleanup function
  });
  
  // ❌ Bad: Using $effect for computations (use $derived instead)
  let doubled = $state(0);
  $effect(() => {
    doubled = count * 2; // Should use $derived
  });
</script>
```

### Component Props

```svelte
<script lang="ts">
  // ✅ Good: Type props with interface
  interface Props {
    value: number;
    label?: string;
    onchange?: (value: number) => void;
  }

  let { value, label = 'Default', onchange }: Props = $props();
</script>
```

**Best Practices**:
- Always define a `Props` interface for type safety
- Use optional properties with `?` for optional props
- Provide default values in the destructuring
- Use `$props()` rune for all props (Svelte 5 pattern)

### Event Handling

```svelte
<!-- ✅ Good: Use typed event handlers -->
<button onclick={() => handleClick()}>Click</button>

<!-- ✅ Good: Pass event when needed -->
<input oninput={(e) => handleInput(e.currentTarget.value)} />
```

## Game Logic Guidelines

### Pure Functions in `lib/game/`

- All game logic must be pure functions (no side effects)
- Functions should be easily unit-testable
- Use immutable data patterns

```typescript
// ✅ Good: Pure function, returns new state
function markNumber(card: BingoCard, calledNumber: number): BingoCard {
  const newMarked = card.marked.map((row, rowIndex) =>
    row.map((cellMarked, colIndex) =>
      cellMarked || card.grid[rowIndex][colIndex] === calledNumber
    )
  );
  return { ...card, marked: newMarked };
}

// ❌ Bad: Mutates input
function markNumber(card: BingoCard, calledNumber: number): void {
  for (let row = 0; row < card.grid.length; row++) {
    for (let col = 0; col < card.grid[row].length; col++) {
      if (card.grid[row][col] === calledNumber) {
        card.marked[row][col] = true;
      }
    }
  }
}
```

### Validation

- Always validate inputs at boundaries (network, user input)
- Return detailed error information, don't just throw
- Use explicit error messages for user feedback

```typescript
// ✅ Good: Return error string or null
function validatePlayerName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return 'Name cannot be empty';
  }
  if (trimmed.length > 20) {
    return 'Name must be 20 characters or less';
  }
  return null; // Valid
}

// ✅ Good: Boolean validation with separate error getter
function isValidNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= 25;
}

function getNumberError(num: number): string | null {
  if (!Number.isInteger(num)) return 'Number must be an integer';
  if (num < 1 || num > 25) return 'Number must be between 1 and 25';
  return null;
}
```

## Network Layer Guidelines

### Message Types

- Define explicit message types for P2P communication
- Keep payload sizes small (P2P has limits)
- Use discriminated unions for message handling
- Include index signatures for Trystero compatibility

```typescript
// ✅ Good: Discriminated union for messages with index signature
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface CallNumberPayload {
  [key: string]: JsonValue;  // Required for Trystero
  type: 'call-number';
  playerId: string;
  number: number;
}

export interface NumberCalledPayload {
  [key: string]: JsonValue;
  type: 'number-called';
  number: number;
  calledBy: string;
  nextTurnIndex: number;
  timestamp: number;
}

export type MessagePayload = CallNumberPayload | NumberCalledPayload | /* ... */;
```

### Error Handling

- Handle disconnections gracefully
- Implement reconnection logic
- Show connection status to users

### P2P Security

```typescript
// ✅ Good: Type guard for message validation
export function isCallNumber(msg: MessagePayload): msg is CallNumberPayload {
  return msg.type === 'call-number';
}

// ✅ Good: Validate incoming P2P messages
function handleMessage(raw: MessagePayload): void {
  // Type guards provide runtime validation
  if (isCallNumber(raw)) {
    // TypeScript knows this is CallNumberPayload now
    if (!isValidNumber(raw.number)) {
      console.warn('Invalid number in message:', raw.number);
      return;
    }
    processCallNumber(raw);
  } else if (isNumberCalled(raw)) {
    processNumberCalled(raw);
  }
  // ... handle other message types
}
```

**Security Best Practices**:
- Always validate P2P messages before processing
- Use TypeScript type guards for runtime validation
- Never trust data received from peers
- Log suspicious messages for debugging
- Validate message structure and data ranges
- Check bounds on arrays and numbers (e.g., number must be 1-25)

## SPA Architecture Guidelines

### Client-Side State

- All state lives in the browser (no server)
- Use Svelte stores (`*.svelte.ts` files) for shared state across components
- Persist critical state to localStorage for recovery

```typescript
// ✅ Good: Svelte 5 store with runes (src/lib/stores/game.svelte.ts)
let session = $state<GameSession | null>(null);
let localPlayerId = $state<string | null>(null);

// Derived state
const isInGame = $derived(session !== null);
const isHost = $derived(
  session !== null && localPlayerId !== null && session.hostId === localPlayerId
);

// Export functions that access the state
export function getSession() {
  return session;
}

export function setSession(newSession: GameSession | null) {
  session = newSession;
}
```

```typescript
// ✅ Good: State recovery on page refresh
$effect(() => {
  if (gameState) {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }
});

// On mount, restore state
const saved = localStorage.getItem('gameState');
if (saved) {
  gameState = JSON.parse(saved);
}
```

### URL-Based Room Sharing

```typescript
// ✅ Good: Room ID in URL for easy sharing
const roomId = window.location.hash.slice(1) || generateRoomId();
window.location.hash = roomId;
```

### Offline Considerations

- Game should handle temporary disconnections
- Show clear connection status to users
- Queue actions during brief disconnections

**localStorage Security**:
```typescript
// ✅ Good: Validate data from localStorage (from src/lib/utils/storage.ts)
export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    const state = JSON.parse(raw) as PersistedState;
    
    // Validate required fields
    if (!state.playerId || !state.playerName) {
      return null;
    }
    
    // Check expiration (1 hour)
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

// ❌ Bad: Trusting localStorage data without validation
const saved = localStorage.getItem('gameState');
const gameState = JSON.parse(saved!); // Unsafe!
```

## Code Quality Checklist

Before committing code:

- [ ] TypeScript compiles without errors (`npm run check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Unit tests pass (`npm test`)
- [ ] E2E tests pass if UI changes made (`npm run test:e2e`)
- [ ] No `any` types (use `unknown` if needed)
- [ ] Functions have explicit return types
- [ ] Components use Svelte 5 runes (no legacy `$:`)
- [ ] Game logic is pure and testable
- [ ] Network messages are typed and validated
- [ ] Error handling is present and comprehensive
- [ ] No hardcoded secrets or credentials

> **Related**: See `.github/instructions/test-authoring.instructions.md` for testing guidelines
> **Related**: See `.github/instructions/code-review.instructions.md` for review standards

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run check     # TypeScript type checking
npm run lint      # Run ESLint
npm test          # Run unit tests
npm run test:e2e  # Run E2E tests (headless)
```
