# Gametime Bingo 🎉

A multiplayer BINGO game built with Svelte 5, TypeScript, and WebRTC P2P networking. Play with friends in real-time without needing a server!

## 🎮 Play Now

**Production**: [https://gametime-bingo.pages.dev](https://gametime-bingo.pages.dev)

## ✨ Features

- **🌐 True P2P**: No central server required - direct peer-to-peer gameplay
- **🎯 Turn-based**: Players take turns calling numbers
- **🔒 Private Cards**: Each player has a unique card that others can't see
- **⚡ Real-time Sync**: Game state updates instantly across all players
- **💾 Offline-first**: Works entirely in the browser with localStorage persistence
- **📱 Responsive**: Play on desktop, tablet, or mobile

## 🚀 Quick Start

### For Players

Visit [gametime-bingo.pages.dev](https://gametime-bingo.pages.dev) to start playing! See the [Gameplay Guide](./docs/gameplay.md) for instructions.

### For Developers

```bash
# Clone the repository
git clone https://github.com/amitjoshi-ms/gametime-bingo.git
cd gametime-bingo

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

### Getting Started
- **[Quick Start Guide](./docs/getting-started.md)** - Get up and running quickly
- **[How to Play](./docs/gameplay.md)** - User guide for playing the game

### Architecture & Design
- **[Architecture Overview](./docs/architecture.md)** - System design and technical decisions
- **[Deployment Guide](./docs/deployment.md)** - Production deployment and URLs

### Development
- **[Development Setup](./docs/development/setup.md)** - Local development environment
- **[Testing Guide](./docs/development/testing.md)** - Unit, component, and E2E testing
- **[Contributing Guidelines](./docs/development/contributing.md)** - How to contribute
- **[Code Style](./docs/development/code-style.md)** - Coding conventions and standards

### Features
- **[Multiplayer P2P](./docs/features/multiplayer.md)** - WebRTC peer-to-peer networking
- **[Game Modes](./docs/features/game-modes.md)** - Single player, multiplayer, demo modes
- **[UI Components](./docs/features/ui-components.md)** - Component library documentation

### API Reference
- **[Game Logic API](./docs/api/game-logic.md)** - Pure game logic (`lib/game/`)
- **[Network Layer API](./docs/api/network.md)** - P2P networking (`lib/network/`)
- **[Svelte Stores](./docs/api/stores.md)** - State management stores

## 🛠️ Technology Stack

- **Framework**: [Svelte 5](https://svelte-5-preview.vercel.app/) with runes
- **Language**: TypeScript 5.x (strict mode)
- **P2P Networking**: [Trystero](https://github.com/dmotz/trystero) (WebRTC via BitTorrent trackers)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (E2E)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)

## 🎯 Project Status

**Current**: Multiplayer mode fully implemented  
**Planned**: Single-player mode, demo mode, custom rules

See [Game Modes](./docs/features/game-modes.md) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./docs/development/contributing.md) for details on:

- Reporting bugs
- Suggesting features
- Submitting pull requests
- Code of conduct

## 📝 Development Commands

```bash
# Development
npm run dev          # Start dev server with HMR
npm run preview      # Preview production build

# Code Quality
npm run check        # TypeScript type checking
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# Testing
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests

# Build
npm run build        # Build for production
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Svelte 5](https://svelte-5-preview.vercel.app/)
- P2P networking powered by [Trystero](https://github.com/dmotz/trystero)
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com/)

## 📞 Links

- **Production**: [https://gametime-bingo.pages.dev](https://gametime-bingo.pages.dev)
- **Repository**: [github.com/amitjoshi-ms/gametime-bingo](https://github.com/amitjoshi-ms/gametime-bingo)
- **Issues**: [GitHub Issues](https://github.com/amitjoshi-ms/gametime-bingo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/amitjoshi-ms/gametime-bingo/discussions)

---

**Start playing now**: [gametime-bingo.pages.dev](https://gametime-bingo.pages.dev) 🎲
