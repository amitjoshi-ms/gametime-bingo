# Gametime Bingo Documentation

Welcome to the comprehensive documentation for Gametime Bingo - a multiplayer BINGO game built with Svelte 5, TypeScript, and WebRTC P2P networking.

## 📚 Documentation Overview

### Getting Started
- **[Quick Start Guide](./getting-started.md)** - Get up and running quickly
- **[How to Play](./gameplay.md)** - User guide for playing the game

### Architecture & Design
- **[Architecture Overview](./architecture.md)** - System design and technical decisions
- **[Deployment Guide](./deployment.md)** - Production deployment and URLs

### Development
- **[Development Setup](./development/setup.md)** - Local development environment
- **[Testing Guide](./development/testing.md)** - Unit, component, and E2E testing
- **[Contributing Guidelines](./development/contributing.md)** - How to contribute
- **[Code Style](./development/code-style.md)** - Coding conventions and standards

### Features
- **[Multiplayer P2P](./features/multiplayer.md)** - WebRTC peer-to-peer networking
- **[Game Modes](./features/game-modes.md)** - Single player, multiplayer, demo modes
- **[UI Components](./features/ui-components.md)** - Component library documentation

### API Reference
- **[Game Logic API](./api/game-logic.md)** - Pure game logic (`lib/game/`)
- **[Network Layer API](./api/network.md)** - P2P networking (`lib/network/`)
- **[Svelte Stores](./api/stores.md)** - State management stores

## 🎯 Quick Links

- **Production**: [https://gametime-bingo.pages.dev](https://gametime-bingo.pages.dev)
- **Repository**: [github.com/amitjoshi-ms/gametime-bingo](https://github.com/amitjoshi-ms/gametime-bingo)
- **Issues**: [GitHub Issues](https://github.com/amitjoshi-ms/gametime-bingo/issues)

## 🛠️ Technology Stack

- **Framework**: Svelte 5 with runes (`$state`, `$derived`, `$effect`)
- **Language**: TypeScript 5.x (strict mode)
- **P2P Networking**: Trystero (WebRTC via BitTorrent trackers)
- **Build Tool**: Vite
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Cloudflare Pages

## 📖 About This Project

Gametime Bingo is a multiplayer BINGO game where players take turns calling numbers to complete lines on their unique 5x5 grids. The first player to achieve 5 complete lines (spelling B-I-N-G-O) wins.

Key features:
- **True P2P**: No central server required for gameplay
- **Turn-based**: Players take turns calling numbers
- **Private cards**: Each player has a unique card that others cannot see
- **Real-time sync**: Game state updates instantly across all players
- **Offline-first**: Works entirely in the browser with localStorage persistence

## 🔍 Finding What You Need

- **New to the project?** Start with [Getting Started](./getting-started.md)
- **Want to play?** Check out [How to Play](./gameplay.md)
- **Contributing code?** Read [Development Setup](./development/setup.md) and [Contributing Guidelines](./development/contributing.md)
- **Understanding architecture?** See [Architecture Overview](./architecture.md)
- **Deploying?** Follow the [Deployment Guide](./deployment.md)
- **Working with P2P?** Read [Multiplayer P2P Documentation](./features/multiplayer.md)

## ⚠️ Note About specs/ Folder

The `specs/` folder contains feature specifications used by the speckit tool and should **not be modified** as part of general documentation work. This `docs/` folder is separate and contains user and developer documentation.
