# UI Components

Documentation for the UI component library in Gametime Bingo.

## 📦 Component Overview

Gametime Bingo uses **Svelte 5** components with modern runes (`$state`, `$derived`, `$effect`) for a reactive, type-safe UI.

### Component Structure

```
src/components/
├── ui/                      # Reusable UI primitives
│   ├── Button.svelte        # Button component
│   ├── Input.svelte         # Input field
│   ├── Modal.svelte         # Modal dialog
│   └── ...
├── Card.svelte              # BINGO card display
├── Cell.svelte              # Individual card cell
├── CalledNumbers.svelte     # Called numbers list
├── ConnectionStatus.svelte  # P2P connection indicator
├── Game.svelte              # Main game view
├── GameOver.svelte          # End game screen
├── Home.svelte              # Home/landing page
├── Lobby.svelte             # Game lobby
├── NumberPad.svelte         # Number selection pad
├── PlayerList.svelte        # Connected players
└── Progress.svelte          # B-I-N-G-O progress tracker
```

## 🎨 Core Components

### Card.svelte

**Purpose**: Displays the player's 5x5 BINGO card.

**Props**:
```typescript
interface Props {
  grid: number[][];           // 5x5 grid of numbers
  marked: boolean[][];        // 5x5 grid of marked states
  completedLines: LineDefinition[];  // Completed lines
}
```

**Features**:
- 5x5 grid layout
- Visual distinction for marked cells
- Highlights completed lines
- Responsive sizing

**Usage**:
```svelte
<script>
  import Card from './Card.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  
  const card = playerStore.getCard();
</script>

<Card 
  grid={card.grid} 
  marked={card.marked}
  completedLines={card.completedLines}
/>
```

---

### Cell.svelte

**Purpose**: Individual cell within the BINGO card.

**Props**:
```typescript
interface Props {
  number: number;      // Cell number (1-25)
  marked: boolean;     // Is cell marked?
  inLine: boolean;     // Is cell part of completed line?
}
```

**Features**:
- Shows number
- Visual state for marked/unmarked
- Special highlight for completed lines
- Click interactions (disabled in actual gameplay - auto-marked)

---

### NumberPad.svelte

**Purpose**: Number selection interface for calling numbers.

**Props**:
```typescript
interface Props {
  calledNumbers: number[];           // Already called numbers
  onSelectNumber: (num: number) => void;  // Callback when number selected
}
```

**Features**:
- 5x5 grid of numbers 1-25
- Disables already-called numbers
- Visual feedback on selection
- Only shown on player's turn

**Usage**:
```svelte
<script>
  import NumberPad from './NumberPad.svelte';
  
  function handleNumberCall(num: number) {
    callNumber(num);
  }
</script>

{#if isMyTurn}
  <NumberPad 
    calledNumbers={session.calledNumbers}
    onSelectNumber={handleNumberCall}
  />
{/if}
```

---

### CalledNumbers.svelte

**Purpose**: Displays history of called numbers.

**Props**:
```typescript
interface Props {
  calledNumbers: number[];  // Numbers in order called
}
```

**Features**:
- Scrollable list
- Most recent at top or highlighted
- Shows who called each number (optional)
- Responsive layout

---

### PlayerList.svelte

**Purpose**: Shows all connected players.

**Props**:
```typescript
interface Props {
  players: Player[];           // All players in session
  currentTurnIndex: number;    // Whose turn it is
  localPlayerId: string;       // Current user's ID
}
```

**Features**:
- Player names
- Connection status indicators
- Host badge
- Current turn highlight
- Your player highlighted differently

---

### Progress.svelte

**Purpose**: B-I-N-G-O progress tracker.

**Props**:
```typescript
interface Props {
  completedLines: number;  // 0-5 lines completed
}
```

**Features**:
- Visual representation of B-I-N-G-O letters
- Lights up each letter as lines complete
- Progress bar or counter
- Celebratory animation on completion

---

### ConnectionStatus.svelte

**Purpose**: P2P connection status indicator.

**Props**:
```typescript
interface Props {
  status: 'connected' | 'reconnecting' | 'disconnected';
}
```

**Features**:
- Color-coded indicator (green/yellow/red)
- Tooltip with status details
- Reconnection animations
- Minimal, non-intrusive design

---

### Lobby.svelte

**Purpose**: Pre-game waiting room.

**Features**:
- Player list with join animations
- Room code display with copy button
- Host-only "Start Game" button
- Your generated card preview
- Minimum player count indicator

---

### Game.svelte

**Purpose**: Main game view during gameplay.

**Features**:
- Player's card (Card component)
- Called numbers list (CalledNumbers component)
- Number pad for your turn (NumberPad component)
- Player list (PlayerList component)
- Progress tracker (Progress component)
- Connection status (ConnectionStatus component)

**Layout**:
```
┌─────────────────────────────────┐
│  Connection Status  │ Progress  │
├──────────────┬──────────────────┤
│              │                  │
│  BINGO Card  │  Called Numbers  │
│              │                  │
├──────────────┤  Player List     │
│              │                  │
│  Number Pad  │                  │
│ (your turn)  │                  │
└──────────────┴──────────────────┘
```

---

### Home.svelte

**Purpose**: Landing page and entry point.

**Features**:
- Game title and description
- "Create Game" button
- "Join Game" input (room code)
- Instructions link
- Demo mode (future)

---

### GameOver.svelte

**Purpose**: End-game screen with results.

**Props**:
```typescript
interface Props {
  winner: Player;           // Winning player
  yourProgress: number;     // Your completed lines
  onPlayAgain: () => void;  // Callback to start new game
}
```

**Features**:
- Winner announcement
- Confetti/celebration animation
- Your final progress
- "Play Again" button
- "Leave Game" button

## 🎨 UI Primitives (ui/ folder)

### Button.svelte

**Purpose**: Reusable button component.

**Props**:
```typescript
interface Props {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  onclick?: () => void;
}
```

**Usage**:
```svelte
<Button variant="primary" onclick={handleClick}>
  Click Me
</Button>
```

### Input.svelte

**Purpose**: Text input field.

**Props**:
```typescript
interface Props {
  value: string;
  placeholder?: string;
  label?: string;
  error?: string;
  maxlength?: number;
  oninput?: (value: string) => void;
}
```

**Usage**:
```svelte
<Input 
  label="Player Name"
  value={playerName}
  oninput={(val) => playerName = val}
  maxlength={20}
/>
```

### Modal.svelte

**Purpose**: Modal dialog overlay.

**Props**:
```typescript
interface Props {
  open: boolean;
  title?: string;
  onclose?: () => void;
}
```

**Usage**:
```svelte
<Modal open={showModal} title="Join Game" onclose={() => showModal = false}>
  <p>Modal content here</p>
</Modal>
```

## 🎨 Styling

### CSS Approach

- **Global styles**: `src/app.css`
- **Component styles**: Scoped `<style>` blocks in `.svelte` files
- **Utility classes**: Minimal (prefer component styles)

### Design System

**Colors** (example - check actual code):
```css
:root {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-bg: #ffffff;
  --color-text: #1f2937;
}
```

**Spacing** (example):
```css
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
```

### Responsive Design

Components use responsive CSS:
```css
/* Mobile-first */
.card {
  width: 100%;
}

/* Tablet and up */
@media (min-width: 768px) {
  .card {
    width: 400px;
  }
}
```

## 🧩 Component Patterns

### Svelte 5 Runes

All components use modern Svelte 5 patterns:

```svelte
<script lang="ts">
  // Props
  interface Props {
    value: number;
    onchange?: (value: number) => void;
  }
  let { value, onchange }: Props = $props();
  
  // Local state
  let count = $state(0);
  
  // Derived values
  let doubled = $derived(count * 2);
  
  // Side effects
  $effect(() => {
    console.log('Value changed:', value);
  });
  
  // Event handlers
  function handleClick() {
    count += 1;
    onchange?.(count);
  }
</script>

<button onclick={handleClick}>
  Count: {count} (doubled: {doubled})
</button>
```

### Type Safety

All components are fully typed:
```svelte
<script lang="ts">
  import type { Player, GameSession } from '$lib/game/types';
  
  interface Props {
    session: GameSession;
    players: Player[];
  }
  let { session, players }: Props = $props();
</script>
```

## ✅ Component Checklist

When creating new components:

- [ ] Use TypeScript (`lang="ts"`)
- [ ] Define Props interface
- [ ] Use `$props()` for props
- [ ] Use Svelte 5 runes (no legacy `$:`)
- [ ] Add JSDoc comments for complex components
- [ ] Make responsive (mobile-first)
- [ ] Test on multiple screen sizes
- [ ] Add to component documentation

## 🧪 Testing Components

### Unit Testing

Use `@testing-library/svelte`:

```typescript
import { render, screen } from '@testing-library/svelte';
import Button from './Button.svelte';

test('renders button with text', () => {
  render(Button, { props: { children: 'Click me' } });
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Testing

Use Playwright with accessible selectors:

```typescript
await page.getByRole('button', { name: /create game/i }).click();
await page.getByLabel(/player name/i).fill('Test');
```

## 📚 Related Documentation

- [Code Style Guide](../development/code-style.md) - Coding standards
- [Testing Guide](../development/testing.md) - How to test components
- [Svelte 5 Docs](https://svelte-5-preview.vercel.app/docs/introduction)

---

**Note**: This documentation describes the current component structure. Components may evolve as features are added. Always check the source code for the most up-to-date implementation details.
