# Implementation Plan: Multiplayer BINGO Game

**Branch**: `001-bingo-game` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bingo-game/spec.md`

## Summary

Multiplayer BINGO game where 2-5 players take turns calling numbers (1-25) to complete lines on their unique 5x5 grids. First player to achieve 5 complete lines (spelling B-I-N-G-O) wins. Built as a static SPA with P2P connectivity via WebRTC for real-time synchronization, hosted on Cloudflare Pages.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Svelte 5 (~4KB runtime), Trystero (~7KB gzipped, Nostr strategy)  
**Storage**: localStorage for session recovery and player preferences; no database  
**Testing**: Vitest for unit tests, Playwright for E2E, @testing-library/svelte for component tests  
**Target Platform**: Modern browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)  
**Project Type**: Web SPA (frontend-only, static hosting)  
**Performance Goals**: TTI < 3s on slow 3G, 60fps animations, < 100ms input latency  
**Constraints**: JS bundle < 100KB gzipped, total assets < 500KB gzipped, no backend server  
**Scale/Scope**: 2-5 players per session, single game screen with lobby

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-Design | Post-Design | Notes |
|-----------|------------|-------------|-------|
| **I. Network-Resilient Architecture** | ✅ PASS | ✅ PASS | Trystero with Nostr signaling—no backend needed; auto-reconnect built-in; host-authoritative model with failover |
| **II. Bundle Size Budget** | ✅ PASS | ✅ PASS | Svelte (~4KB) + Trystero (~7KB) + app code (~30KB) = **~41KB** gzipped; well under 100KB |
| **III. Performance-First UX** | ✅ PASS | ✅ PASS | Game logic is pure functions (sync); P2P latency is WebRTC (sub-100ms); Vite for optimized builds |
| **IV. Responsive & Accessible Design** | ✅ PASS | ✅ PASS | 5x5 grid with CSS Grid; touch targets ≥48px; semantic HTML planned |
| **V. Simplicity & Maintainability** | ✅ PASS | ✅ PASS | Only 2 runtime deps; game logic is pure functions (100% unit-testable); host-authoritative simplifies sync |

**Post-Phase 1 Gate**: ✅ All principles satisfied. Ready for `/speckit.tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/001-bingo-game/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Developer guide
├── contracts/           # Phase 1: P2P message protocol
│   └── p2p-protocol.md
└── tasks.md             # Phase 2: Implementation tasks (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── game/               # Pure game logic (unit-testable)
│   │   ├── card.ts         # Card generation, marking, shuffling
│   │   ├── session.ts      # Session state management
│   │   ├── lines.ts        # Line detection (12 possible lines)
│   │   ├── validation.ts   # Input validation helpers
│   │   └── types.ts        # TypeScript type definitions
│   ├── network/            # P2P networking layer
│   │   ├── room.ts         # Trystero room management
│   │   ├── messages.ts     # Message type definitions
│   │   ├── host.ts         # Host-specific logic
│   │   └── sync.ts         # State synchronization
│   ├── stores/             # Svelte stores (reactive state)
│   │   ├── game.svelte.ts  # Game session state
│   │   └── player.svelte.ts # Local player state
│   └── utils/              # Shared utilities
│       ├── storage.ts      # localStorage helpers
│       └── random.ts       # Seeded RNG for testing
├── components/             # Svelte UI components
│   ├── Card.svelte         # 5x5 BINGO card display
│   ├── Cell.svelte         # Single card cell
│   ├── Lobby.svelte        # Pre-game waiting room
│   ├── Game.svelte         # Main game screen
│   ├── NumberPad.svelte    # Number calling interface (1-25)
│   ├── Progress.svelte     # B-I-N-G-O letter tracker
│   ├── CalledNumbers.svelte # List of called numbers
│   ├── PlayerList.svelte   # Players in lobby/game
│   ├── ConnectionStatus.svelte # Network status indicator
│   └── ui/                 # Generic UI primitives
│       ├── Button.svelte
│       ├── Input.svelte
│       └── Modal.svelte
├── App.svelte              # Root component with routing
├── main.ts                 # Entry point
├── app.css                 # Global styles
└── vite-env.d.ts           # Vite type declarations

tests/
├── unit/                   # Unit tests (Vitest)
│   ├── game/
│   │   ├── card.test.ts
│   │   ├── session.test.ts
│   │   ├── lines.test.ts
│   │   └── validation.test.ts
│   └── network/
│       └── messages.test.ts
├── component/              # Component tests (@testing-library/svelte)
│   ├── Card.test.ts
│   ├── NumberPad.test.ts
│   └── Progress.test.ts
└── e2e/                    # End-to-end tests (Playwright)
    ├── create-join.spec.ts
    ├── gameplay.spec.ts
    └── reconnection.spec.ts

static/                     # Static assets
├── favicon.svg
└── manifest.json           # PWA manifest (optional)

# Config files at root
vite.config.ts
svelte.config.js
tsconfig.json
playwright.config.ts
package.json
.prettierrc
eslint.config.js
```

**Structure Decision**: Frontend-only SPA structure selected. No backend directory needed—P2P via Trystero eliminates server requirements. Game logic isolated in `src/lib/game/` for maximum testability.

## Complexity Tracking

> No constitution violations. No complexity justifications required.
