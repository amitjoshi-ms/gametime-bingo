# Development Setup

Complete guide for setting up your local development environment for Gametime Bingo.

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18.x or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`
   - Recommended: Use [nvm](https://github.com/nvm-sh/nvm) for version management

2. **npm** (v9.x or higher)
   - Comes with Node.js
   - Verify: `npm --version`

3. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

### Recommended Tools

- **VS Code**: https://code.visualstudio.com/
- **Extensions for VS Code**:
  - Svelte for VS Code (`svelte.svelte-vscode`)
  - ESLint (`dbaeumer.vscode-eslint`)
  - Prettier (`esbenp.prettier-vscode`)
  - TypeScript + JavaScript (`ms-vscode.vscode-typescript-next`)

### Browser Requirements

For development and testing:
- **Chrome/Edge**: Recommended (best DevTools)
- **Firefox**: Good WebRTC support
- **Safari**: For cross-browser testing

**Note**: WebRTC (required for P2P) is supported in all modern browsers.

## 🚀 Initial Setup

### 1. Clone Repository

```bash
# Clone the repo
git clone https://github.com/amitjoshi-ms/gametime-bingo.git
cd gametime-bingo

# Or with SSH
git clone git@github.com:amitjoshi-ms/gametime-bingo.git
cd gametime-bingo
```

### 2. Install Dependencies

```bash
# Clean install (recommended)
npm ci

# Or regular install
npm install
```

**Expected time**: 30-60 seconds

### 3. Verify Installation

```bash
# Run all checks
npm run check    # TypeScript type checking
npm run lint     # ESLint
npm test         # Unit tests
npm run build    # Production build
```

All commands should complete successfully.

### 4. Start Development Server

```bash
npm run dev
```

Output should show:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Visit `http://localhost:5173` to see the app.

## 🗂️ Project Structure

```
gametime-bingo/
├── .github/
│   ├── workflows/           # CI/CD pipelines
│   ├── instructions/        # Coding standards
│   └── prompts/             # Development prompts
├── docs/                    # Documentation (you are here)
├── public/                  # Static assets
├── specs/                   # Feature specifications (speckit)
├── src/
│   ├── lib/
│   │   ├── game/           # Pure game logic
│   │   │   ├── card.ts     # Card generation, marking
│   │   │   ├── lines.ts    # Line definitions
│   │   │   ├── session.ts  # Session management
│   │   │   ├── types.ts    # TypeScript types
│   │   │   └── validation.ts # Input validation
│   │   ├── network/        # P2P networking
│   │   │   ├── host.ts     # Host logic
│   │   │   ├── messages.ts # Message types
│   │   │   ├── room.ts     # Room management
│   │   │   └── sync.ts     # State sync
│   │   ├── stores/         # Svelte stores
│   │   │   ├── game.svelte.ts   # Game state
│   │   │   └── player.svelte.ts # Player state
│   │   └── utils/          # Utility functions
│   ├── components/         # Svelte UI components
│   │   ├── ui/            # Reusable UI primitives
│   │   ├── Card.svelte    # Bingo card display
│   │   ├── Game.svelte    # Main game view
│   │   ├── Home.svelte    # Home screen
│   │   ├── Lobby.svelte   # Game lobby
│   │   └── ...            # Other components
│   ├── App.svelte         # Root component
│   ├── main.ts            # Entry point
│   └── app.css            # Global styles
├── tests/
│   ├── unit/              # Vitest unit tests
│   └── e2e/               # Playwright E2E tests
├── package.json           # Dependencies & scripts
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
├── playwright.config.ts   # E2E test config
└── eslint.config.js       # ESLint config
```

### Key Directories

| Directory | Purpose | Notes |
|-----------|---------|-------|
| `src/lib/game/` | Pure game logic | No side effects, fully testable |
| `src/lib/network/` | P2P networking | Trystero integration |
| `src/lib/stores/` | State management | Svelte stores with runes |
| `src/components/` | UI components | Svelte 5 components |
| `tests/unit/` | Unit tests | Vitest tests for game logic |
| `tests/e2e/` | E2E tests | Playwright tests for flows |
| `docs/` | Documentation | User and dev docs |
| `specs/` | Specifications | DO NOT MODIFY (speckit tool) |

## 🛠️ Development Commands

### Core Commands

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Type checking
npm run check

# Linting
npm run lint

# Auto-fix linting issues
npm run lint -- --fix

# Format code
npm run format
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with visible browser
npm run test:e2e -- --headed

# Run E2E tests with debugger
npm run test:e2e -- --debug
```

### Advanced Testing

```bash
# Run specific unit test file
npm test -- tests/unit/game/card.test.ts

# Run tests matching pattern
npm test -- -t "should generate"

# Run tests with coverage
npm test -- --coverage

# Run specific E2E test
npx playwright test tests/e2e/home.spec.ts

# Run E2E in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 🔧 Configuration Files

### TypeScript Configuration

**tsconfig.json**: Main TypeScript config
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    // ... other strict options
  }
}
```

**Key settings**:
- Strict mode enabled (no implicit any)
- ES modules
- Svelte integration

### Vite Configuration

**vite.config.ts**: Build tool config
```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // ...
});
```

### ESLint Configuration

**eslint.config.js**: Linting rules
- TypeScript rules
- Svelte-specific rules
- Custom project rules

### Prettier Configuration

**.prettierrc**: Code formatting
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

## 🌐 Development Server

### Hot Module Replacement (HMR)

Vite provides instant updates without full page reload:
- **Svelte components**: Updates in place
- **TypeScript/JavaScript**: Hot updates
- **CSS**: Updates without reload

### Custom Port

```bash
# Use a different port
npm run dev -- --port 3000

# Expose to network
npm run dev -- --host
```

### Environment Variables

Create `.env.local` for local overrides:
```bash
# Not currently used, but available if needed
# VITE_API_URL=http://localhost:3000
```

**Note**: Vite only exposes variables prefixed with `VITE_`.

## 🧪 Testing Setup

### Unit Testing (Vitest)

Tests in `tests/unit/` mirror `src/lib/` structure:
```
tests/unit/
  ├── game/
  │   ├── card.test.ts
  │   ├── session.test.ts
  │   └── validation.test.ts
  └── utils/
      └── random.test.ts
```

**Writing tests**:
```typescript
import { describe, it, expect } from 'vitest';
import { generateCard } from '$lib/game/card';

describe('generateCard', () => {
  it('should generate a 5x5 grid', () => {
    const card = generateCard();
    expect(card.grid).toHaveLength(5);
  });
});
```

### E2E Testing (Playwright)

Tests in `tests/e2e/`:
```
tests/e2e/
  ├── home.spec.ts
  ├── game.spec.ts
  └── multiplayer.spec.ts
```

**Writing E2E tests**:
```typescript
import { test, expect } from '@playwright/test';

test('should create game', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /create game/i }).click();
  await expect(page.getByText(/room code/i)).toBeVisible();
});
```

## 🐛 Debugging

### VS Code Debugging

**launch.json** (create in `.vscode/`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug App",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### Browser DevTools

**Chrome DevTools**:
1. Open: F12 or Ctrl+Shift+I (Windows) / Cmd+Option+I (Mac)
2. **Console**: See logs and errors
3. **Sources**: Set breakpoints in TypeScript
4. **Network**: Monitor WebRTC connections
5. **Application**: Inspect localStorage

### Svelte DevTools

Install: https://github.com/sveltejs/svelte-devtools

Features:
- Component tree inspection
- State inspection
- Performance profiling

### P2P Debugging

Enable verbose logging in `src/lib/network/`:
```typescript
// Temporarily add for debugging
console.log('[P2P] Connection state:', state);
console.log('[P2P] Message received:', message);
```

**Remember to remove debug logs before committing!**

## 🔥 Troubleshooting

### Installation Issues

**Problem**: `npm install` fails
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem**: TypeScript errors after install
```bash
# Rebuild TypeScript cache
npx tsc --build --clean
npm run check
```

### Development Server Issues

**Problem**: Port 5173 in use
```bash
# Find process using port
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill process or use different port
npm run dev -- --port 3000
```

**Problem**: HMR not working
1. Check browser console for errors
2. Restart dev server
3. Clear browser cache
4. Check file watchers aren't exhausted (Linux)

### Build Issues

**Problem**: Build fails
```bash
# Clean build
rm -rf dist/ node_modules/
npm install
npm run build
```

**Problem**: Type errors in build but not in IDE
```bash
# Restart TypeScript server in VS Code
# Command Palette (Ctrl+Shift+P): "TypeScript: Restart TS Server"
```

### Test Issues

**Problem**: E2E tests fail locally
```bash
# Install Playwright browsers
npx playwright install

# Re-run with headed mode to see what's happening
npm run test:e2e -- --headed
```

### Git Issues

**Problem**: Large diffs in `package-lock.json`
```bash
# Use npm ci instead of npm install for consistency
npm ci
```

## 📚 Next Steps

Now that you're set up:

1. **Read the architecture**: [Architecture Overview](../architecture.md)
2. **Review code style**: [Code Style Guide](./code-style.md)
3. **Learn testing**: [Testing Guide](./testing.md)
4. **Start contributing**: [Contributing Guidelines](./contributing.md)

## 🆘 Getting Help

- **Documentation**: Browse [docs/](../README.md)
- **Issues**: [GitHub Issues](https://github.com/amitjoshi-ms/gametime-bingo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/amitjoshi-ms/gametime-bingo/discussions)

Happy coding! 🚀
