---
description: 'Code authoring standards for TypeScript, Svelte 5, and P2P multiplayer game development'
applyTo: '**/*.ts, **/*.svelte, **/*.js'
---

# Code Authoring Instructions

Standards and best practices for writing code in the gametime-bingo project.

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
  card: BingoCard;
  completedLines: number;
}

// ✅ Good: Union types for state machines
type GamePhase = 'lobby' | 'playing' | 'finished';

// ❌ Bad: Using any
const data: any = response;
```

### Function Signatures

```typescript
// ✅ Good: Explicit parameter and return types
function validateCard(card: BingoCard, calledNumbers: Set<number>): ValidationResult {
  // ...
}

// ✅ Good: Use generics for reusable functions
function clamp<T extends number>(value: T, min: T, max: T): T {
  return Math.max(min, Math.min(max, value)) as T;
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
function markCell(card: BingoCard, number: number): BingoCard {
  return {
    ...card,
    cells: card.cells.map(cell =>
      cell.value === number ? { ...cell, marked: true } : cell
    )
  };
}

// ❌ Bad: Mutates input
function markCell(card: BingoCard, number: number): void {
  const cell = card.cells.find(c => c.value === number);
  if (cell) cell.marked = true;
}
```

### Validation

- Always validate inputs at boundaries (network, user input)
- Return detailed error information, don't just throw

```typescript
// ✅ Good: Return validation result
function validateNumber(value: unknown): ValidationResult<number> {
  if (typeof value !== 'number') {
    return { success: false, error: 'Expected number' };
  }
  if (value < 1 || value > 75) {
    return { success: false, error: 'Number must be 1-75' };
  }
  return { success: true, value };
}
```

## Network Layer Guidelines

### Message Types

- Define explicit message types for P2P communication
- Keep payload sizes small (P2P has limits)
- Use discriminated unions for message handling

```typescript
// ✅ Good: Discriminated union for messages
type GameMessage =
  | { type: 'number-called'; number: number }
  | { type: 'player-joined'; player: Player }
  | { type: 'bingo-claimed'; playerId: string };
```

### Error Handling

- Handle disconnections gracefully
- Implement reconnection logic
- Show connection status to users

### P2P Security

```typescript
// ✅ Good: Validate incoming P2P messages
function handleMessage(raw: unknown): void {
  const result = validateGameMessage(raw);
  if (!result.success) {
    console.warn('Invalid message received:', result.error);
    return;
  }
  // Process validated message
  processMessage(result.value);
}

// ✅ Good: Type guard for message validation
function isNumberCalledMessage(msg: GameMessage): msg is { type: 'number-called'; number: number } {
  return msg.type === 'number-called';
}
```

## SPA Architecture Guidelines

### Client-Side State

- All state lives in the browser (no server)
- Use Svelte stores for shared state across components
- Persist critical state to localStorage for recovery

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

## Code Quality Checklist

Before committing code:

- [ ] TypeScript compiles without errors (`pnpm check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Unit tests pass (`pnpm test`)
- [ ] No `any` types (use `unknown` if needed)
- [ ] Functions have explicit return types
- [ ] Components use Svelte 5 runes
- [ ] Game logic is pure and testable
- [ ] Network messages are typed

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm check        # TypeScript type checking
pnpm lint         # ESLint
pnpm test         # Run unit tests
pnpm test:e2e     # Run E2E tests
```
