# Getting Started with Gametime Bingo

This guide will help you get up and running with Gametime Bingo, whether you're playing the game or contributing to development.

## 🎮 For Players

### Playing Online

Visit the production site at **[https://gametime-bingo.pages.dev](https://gametime-bingo.pages.dev)** and start playing immediately - no installation required!

### Quick Play Guide

1. **Create a game**: Click "Create Game" and enter your name
2. **Invite friends**: Share the room code or URL with other players
3. **Start playing**: Once 2+ players join, start the game
4. **Take turns**: Call numbers on your turn and mark them on your card
5. **Win**: Complete 5 lines first to spell B-I-N-G-O and win!

See the [Gameplay Guide](./gameplay.md) for detailed rules and strategies.

## 💻 For Developers

### Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For cloning the repository
- **Code Editor**: VS Code recommended with [Svelte extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/amitjoshi-ms/gametime-bingo.git
cd gametime-bingo

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Development Commands

```bash
# Development
npm run dev          # Start dev server with HMR
npm run preview      # Preview production build locally

# Code Quality
npm run check        # TypeScript type checking
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# Testing
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests (headless)
npm run test:e2e -- --headed  # Run E2E tests with visible browser

# Build
npm run build        # Build for production (outputs to dist/)
```

### Project Structure

```
gametime-bingo/
├── src/
│   ├── lib/
│   │   ├── game/       # Pure game logic (card, session, validation)
│   │   ├── network/    # P2P networking layer (Trystero integration)
│   │   ├── stores/     # Svelte stores (game.svelte.ts, player.svelte.ts)
│   │   └── utils/      # Utility functions
│   ├── components/     # Svelte UI components
│   │   └── ui/         # Reusable UI primitives
│   ├── App.svelte      # Root component
│   └── main.ts         # Application entry point
├── tests/
│   ├── unit/           # Vitest unit tests
│   └── e2e/            # Playwright E2E tests
├── docs/               # Documentation (you are here!)
├── specs/              # Feature specifications (speckit tool)
└── .github/            # CI/CD workflows and instructions
```

### Your First Contribution

1. **Explore the codebase**: Start with [Architecture Overview](./architecture.md)
2. **Read coding standards**: Check [Code Style Guide](./development/code-style.md)
3. **Set up your environment**: Follow [Development Setup](./development/setup.md)
4. **Find an issue**: Browse [GitHub Issues](https://github.com/amitjoshi-ms/gametime-bingo/issues)
5. **Submit a PR**: Follow [Contributing Guidelines](./development/contributing.md)

## 🧪 Testing Your Setup

After installation, verify everything works:

```bash
# Run all checks
npm run check && npm run lint && npm test && npm run build
```

All commands should complete successfully with no errors.

### Test the App

1. Start the dev server: `npm run dev`
2. Open `http://localhost:5173` in your browser
3. Create a new game
4. Open another browser window/tab
5. Join the game with the room code
6. Play a few turns to verify P2P sync works

## 🔧 Troubleshooting

### Port Already in Use

If port 5173 is in use:
```bash
# Use a different port
npm run dev -- --port 3000
```

### TypeScript Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### P2P Connection Issues

If players can't connect:
- Check browser console for WebRTC errors
- Ensure WebSocket connections to BitTorrent trackers succeed
- Try a different browser (Chrome/Edge recommended)
- Check firewall settings

### Build Failures

```bash
# Clean build and retry
rm -rf dist/
npm run build
```

## 📚 Next Steps

- **Learn the architecture**: [Architecture Overview](./architecture.md)
- **Understand P2P networking**: [Multiplayer Documentation](./features/multiplayer.md)
- **Read API docs**: [Game Logic API](./api/game-logic.md)
- **Set up testing**: [Testing Guide](./development/testing.md)

## 🤝 Getting Help

- **Documentation**: Browse the [docs](./README.md)
- **Issues**: [GitHub Issues](https://github.com/amitjoshi-ms/gametime-bingo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/amitjoshi-ms/gametime-bingo/discussions)

Welcome to Gametime Bingo! 🎉
