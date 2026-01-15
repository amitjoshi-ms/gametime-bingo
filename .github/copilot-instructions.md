# gametime-bingo Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-13

## Active Technologies

- TypeScript 5.x (strict mode) + Svelte 5 (~4KB gzipped), Trystero (WebRTC P2P ~7KB gzipped) (001-bingo-game)

## Project Structure

```text
src/
  lib/
    game/       # Pure game logic (unit-testable)
    network/    # P2P networking layer
    stores/     # Svelte stores
  components/   # Svelte UI components
tests/
  unit/
  component/
  e2e/
```

## Commands

pnpm dev; pnpm test; pnpm lint

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Recent Changes

- 001-bingo-game: Added TypeScript 5.x (strict mode) + Svelte 5 (~4KB), Trystero (~7KB) for P2P multiplayer

## Available Resources

- **Instructions**: `.github/instructions/*.instructions.md` — Coding standards (auto-loaded by file type)
- **Prompts**: `.github/prompts/*.prompt.md` — Workflows (invoke via @workspace)
- **Agents**: `.github/agents/*.agent.md` — Specialized agents

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
