# Quickstart Guide: GameTime Bingo

**Feature**: 001-bingo-game  
**Last Updated**: 2026-01-13

## Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 9.x (preferred) or npm 10.x
- **Browser**: Chrome 90+, Firefox 90+, Safari 15+, or Edge 90+

## Initial Setup

```bash
# Clone and enter the repository
cd gametime-bingo

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
gametime-bingo/
├── src/
│   ├── lib/
│   │   ├── game/           # Pure game logic (unit-testable)
│   │   │   ├── card.ts     # Card generation & marking
│   │   │   ├── session.ts  # Session state management
│   │   │   ├── lines.ts    # Line detection algorithms
│   │   │   └── types.ts    # TypeScript type definitions
│   │   ├── network/        # P2P networking layer
│   │   │   ├── room.ts     # Trystero room management
│   │   │   ├── messages.ts # Message type definitions
│   │   │   └── sync.ts     # State synchronization
│   │   └── stores/         # Svelte stores
│   │       ├── game.ts     # Game state store
│   │       └── player.ts   # Local player state
│   ├── components/         # Svelte UI components
│   │   ├── Card.svelte     # 5x5 BINGO card display
│   │   ├── Lobby.svelte    # Pre-game waiting room
│   │   ├── Game.svelte     # Main game screen
│   │   ├── NumberPad.svelte # Number calling interface
│   │   └── Progress.svelte # B-I-N-G-O progress tracker
│   ├── App.svelte          # Root component
│   └── main.ts             # Entry point
├── tests/
│   ├── unit/               # Unit tests (Vitest)
│   │   ├── card.test.ts
│   │   ├── session.test.ts
│   │   └── lines.test.ts
│   ├── component/          # Component tests
│   │   └── Card.test.ts
│   └── e2e/                # End-to-end tests (Playwright)
│       └── game-flow.spec.ts
├── static/                 # Static assets
├── vite.config.ts
├── svelte.config.js
├── tsconfig.json
├── playwright.config.ts
└── package.json
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Build production bundle |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm test:ui` | Open Vitest UI |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run end-to-end tests (Playwright) |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm check` | Run Svelte type checking |
| `pnpm size` | Check bundle size budget |

## Development Workflow

### 1. Writing Game Logic

Game logic lives in `src/lib/game/` as pure functions:

```typescript
// src/lib/game/card.ts
export function generateCard(): BingoCard {
  // Shuffle numbers 1-25 into 5x5 grid
}

export function markNumber(card: BingoCard, num: number): BingoCard {
  // Return new card with number marked
}
```

**Test first**:
```typescript
// tests/unit/card.test.ts
import { describe, it, expect } from 'vitest'
import { generateCard, markNumber } from '$lib/game/card'

describe('generateCard', () => {
  it('should contain numbers 1-25 exactly once', () => {
    const card = generateCard()
    const flat = card.grid.flat()
    expect(flat.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 25 }, (_, i) => i + 1)
    )
  })
})
```

### 2. Testing Components

Use `@testing-library/svelte` for component tests:

```typescript
// tests/component/Card.test.ts
import { render, screen } from '@testing-library/svelte'
import Card from '$components/Card.svelte'

it('displays all 25 numbers', () => {
  const card = generateCard()
  render(Card, { props: { card } })
  
  for (let i = 1; i <= 25; i++) {
    expect(screen.getByText(i.toString())).toBeInTheDocument()
  }
})
```

### 3. E2E Testing

Playwright tests simulate real multiplayer:

```typescript
// tests/e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test'

test('two players can complete a game', async ({ browser }) => {
  const host = await browser.newPage()
  const guest = await browser.newPage()
  
  // Host creates game
  await host.goto('/')
  await host.click('text=Create Game')
  const roomCode = await host.textContent('.room-code')
  
  // Guest joins
  await guest.goto(`/?room=${roomCode}`)
  await guest.fill('input[name=name]', 'Guest')
  await guest.click('text=Join')
  
  // ... continue game flow
})
```

## Deployment

### Cloudflare Pages

1. Push to GitHub repository
2. Connect repository to Cloudflare Pages
3. Configure build settings:
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20`

### Manual Deploy

```bash
# Build for production
pnpm build

# Preview locally
pnpm preview

# Deploy to Cloudflare (requires Wrangler CLI)
npx wrangler pages deploy dist
```

## Bundle Size Monitoring

The project enforces a strict bundle budget:

```bash
# Check current bundle size
pnpm size

# Expected output:
# ✓ JavaScript: 45KB gzipped (budget: 100KB)
# ✓ Total: 120KB gzipped (budget: 500KB)
```

Bundle size is checked in CI and will fail if budget exceeded.

## Debugging P2P Connections

### Enable Debug Logging

```typescript
// In browser console
localStorage.setItem('debug', 'trystero:*')
location.reload()
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Peers not connecting | Firewall blocking WebRTC | Try different network or use TURN relay |
| Slow initial connect | Nostr relay latency | Wait 5-10s; relays have eventual consistency |
| State desync | Host changed | Refresh page to resync with new host |

## Environment Variables

```bash
# .env (optional)
VITE_APP_ID=gametime-bingo          # Trystero app ID for room isolation
VITE_NOSTR_RELAYS=wss://relay1.com  # Custom Nostr relays (comma-separated)
```

## Contributing

1. Create feature branch from `main`
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass: `pnpm test`
5. Check bundle size: `pnpm size`
6. Run linter: `pnpm lint`
7. Submit PR with description of changes
