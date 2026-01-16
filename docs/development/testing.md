# Testing Guide

Comprehensive guide to testing Gametime Bingo - covering unit tests, E2E tests, and testing best practices.

## 🧪 Testing Philosophy

- **Test behavior, not implementation**: Focus on what code does, not how it does it
- **Fast feedback**: Unit tests run in milliseconds
- **Confidence**: E2E tests verify real user flows
- **Coverage**: Target >80% for game logic
- **Maintainability**: Tests should be easy to understand and update

## 🏗️ Testing Architecture

```
tests/
├── unit/                    # Vitest unit tests (fast, isolated)
│   ├── game/
│   │   ├── card.test.ts     # Card generation, marking, lines
│   │   ├── session.test.ts  # Session management
│   │   └── validation.test.ts # Input validation
│   └── utils/
│       └── random.test.ts   # Utility functions
└── e2e/                     # Playwright E2E tests (slow, integrated)
    ├── home.spec.ts         # Home page flows
    ├── game.spec.ts         # Gameplay flows
    └── multiplayer.spec.ts  # Multi-player scenarios
```

## ⚡ Unit Testing with Vitest

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run in watch mode (recommended for development)
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/game/card.test.ts

# Run tests matching pattern
npm test -- -t "should generate card"
```

### Writing Unit Tests

**Basic Structure**:
```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '$lib/game/module';

describe('functionToTest', () => {
  it('should do something when given input', () => {
    // Arrange: Set up test data
    const input = 'test';
    
    // Act: Call the function
    const result = functionToTest(input);
    
    // Assert: Verify the result
    expect(result).toBe('expected');
  });
});
```

**Example: Testing Card Generation**:
```typescript
import { describe, it, expect } from 'vitest';
import { generateCard } from '$lib/game/card';

describe('generateCard', () => {
  it('should generate a 5x5 grid', () => {
    const card = generateCard();
    expect(card.grid).toHaveLength(5);
    expect(card.grid[0]).toHaveLength(5);
  });

  it('should have unique numbers from 1-25', () => {
    const card = generateCard();
    const allNumbers = card.grid.flat();
    const uniqueNumbers = new Set(allNumbers);
    
    expect(uniqueNumbers.size).toBe(25);
    allNumbers.forEach(num => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(25);
    });
  });

  it('should initialize all cells as unmarked', () => {
    const card = generateCard();
    const allUnmarked = card.marked.flat().every(marked => marked === false);
    expect(allUnmarked).toBe(true);
  });
});
```

### Testing Pure Functions

**What to test**:
- Happy path (normal inputs)
- Edge cases (boundary values)
- Error cases (invalid inputs)
- Immutability (original data unchanged)

**Example: Testing Validation**:
```typescript
import { describe, it, expect } from 'vitest';
import { isValidNumber } from '$lib/game/validation';

describe('isValidNumber', () => {
  it('should return true for numbers 1-25', () => {
    for (let i = 1; i <= 25; i++) {
      expect(isValidNumber(i)).toBe(true);
    }
  });

  it('should return false for 0', () => {
    expect(isValidNumber(0)).toBe(false);
  });

  it('should return false for numbers > 25', () => {
    expect(isValidNumber(26)).toBe(false);
    expect(isValidNumber(100)).toBe(false);
  });

  it('should return false for non-integers', () => {
    expect(isValidNumber(1.5)).toBe(false);
    expect(isValidNumber(NaN)).toBe(false);
  });
});
```

### Parameterized Tests

Use `it.each` for testing multiple inputs:

```typescript
import { describe, it, expect } from 'vitest';
import { isValidNumber } from '$lib/game/validation';

describe('isValidNumber', () => {
  it.each([
    [0, false, 'below minimum'],
    [1, true, 'minimum valid'],
    [25, true, 'maximum valid'],
    [26, false, 'above maximum'],
    [1.5, false, 'decimal'],
    [NaN, false, 'NaN'],
  ])('isValidNumber(%s) should return %s (%s)', (input, expected) => {
    expect(isValidNumber(input)).toBe(expected);
  });
});
```

### Mocking

**Mock localStorage**:
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('storage utilities', () => {
  beforeEach(() => {
    // Mock localStorage
    const mockStorage: Storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('should save to localStorage', () => {
    saveState({ playerId: 'test', playerName: 'Test' });
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});
```

**Mock random for deterministic tests**:
```typescript
import { vi } from 'vitest';

// Mock Math.random for predictable results
vi.spyOn(Math, 'random').mockReturnValue(0.5);
```

### Testing Immutability

```typescript
it('should not mutate the original card', () => {
  const card = generateCard();
  const originalGrid = JSON.parse(JSON.stringify(card.grid));
  
  const newCard = markNumber(card, card.grid[0][0]);
  
  expect(card.grid).toEqual(originalGrid);
  expect(card.marked[0][0]).toBe(false);
  expect(newCard.marked[0][0]).toBe(true);
});
```

## 🎭 E2E Testing with Playwright

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with visible browser (helpful for debugging)
npm run test:e2e -- --headed

# Run with debugger
npm run test:e2e -- --debug

# Run specific test file
npx playwright test tests/e2e/home.spec.ts

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests with UI mode (interactive)
npx playwright test --ui
```

### Writing E2E Tests

**Basic Structure**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Interact with the page
    await page.getByRole('button', { name: /click me/i }).click();
    
    // Assert expected state
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

**Example: Testing Game Creation**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display game title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /bingo/i })).toBeVisible();
  });

  test('should create a new game', async ({ page }) => {
    // Click create game button
    await page.getByRole('button', { name: /create game/i }).click();
    
    // Enter player name
    await page.getByLabel(/player name/i).fill('Test Player');
    
    // Submit
    await page.getByRole('button', { name: /start/i }).click();
    
    // Should show lobby
    await expect(page.getByText(/lobby/i)).toBeVisible();
    await expect(page.getByText(/room code/i)).toBeVisible();
  });
});
```

### Page Object Pattern

For complex tests, use page objects:

```typescript
// tests/e2e/pages/home.page.ts
import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly createGameButton: Locator;
  readonly joinGameButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createGameButton = page.getByRole('button', { name: /create game/i });
    this.joinGameButton = page.getByRole('button', { name: /join game/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async createGame(playerName: string) {
    await this.createGameButton.click();
    await this.page.getByLabel(/player name/i).fill(playerName);
    await this.page.getByRole('button', { name: /start/i }).click();
  }
}

// Use in test
import { HomePage } from './pages/home.page';

test('should create game using page object', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.createGame('Test Player');
  await expect(page.getByText(/lobby/i)).toBeVisible();
});
```

### Testing Multiplayer

Use multiple browser contexts for P2P testing:

```typescript
test('two players can join same room', async ({ browser }) => {
  // Create two independent browser contexts
  const host = await browser.newContext();
  const guest = await browser.newContext();
  
  const hostPage = await host.newPage();
  const guestPage = await guest.newPage();
  
  // Host creates game
  await hostPage.goto('/');
  await hostPage.getByRole('button', { name: /create/i }).click();
  await hostPage.getByLabel(/name/i).fill('Host');
  await hostPage.getByRole('button', { name: /start/i }).click();
  
  // Get room URL
  const roomUrl = hostPage.url();
  
  // Guest joins via URL
  await guestPage.goto(roomUrl);
  await guestPage.getByLabel(/name/i).fill('Guest');
  await guestPage.getByRole('button', { name: /join/i }).click();
  
  // Both see each other
  await expect(hostPage.getByText(/2 players/i)).toBeVisible();
  await expect(guestPage.getByText(/2 players/i)).toBeVisible();
  
  // Cleanup
  await host.close();
  await guest.close();
});
```

### Accessibility Testing

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should pass accessibility checks', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

**Note**: Requires `@axe-core/playwright` package (install separately if needed).

### Network Mocking

```typescript
test('should handle network errors', async ({ page }) => {
  // Mock network failure
  await page.route('**/api/**', route => route.abort());
  
  await page.goto('/');
  await page.getByRole('button', { name: /join/i }).click();
  
  await expect(page.getByText(/connection failed/i)).toBeVisible();
});
```

## 📊 Coverage Reports

### Generate Coverage

```bash
# Run tests with coverage
npm test -- --coverage
```

**Output**:
```
 COVERAGE REPORT
 ===============
 File             | % Stmts | % Branch | % Funcs | % Lines |
 -----------------|---------|----------|---------|---------|
 All files        |   85.2  |   78.3   |   91.4  |   84.7  |
  game/card.ts    |   95.5  |   88.9   |  100.0  |   95.2  |
  game/session.ts |   82.1  |   75.0   |   90.0  |   81.8  |
  ...             |   ...   |   ...    |   ...   |   ...   |
```

### Coverage Targets

| Area | Target | Current |
|------|--------|---------|
| **Game logic** (`lib/game/`) | >80% | 85% |
| **Network** (`lib/network/`) | >70% | 72% |
| **Stores** (`lib/stores/`) | >75% | 78% |
| **Overall** | >75% | 80% |

## ✅ Testing Checklist

Before submitting a PR, ensure:

**Unit Tests**:
- [ ] All new functions have tests
- [ ] Edge cases are covered
- [ ] Error cases are tested
- [ ] Tests pass: `npm test`
- [ ] No test skips or warnings

**E2E Tests**:
- [ ] Critical flows tested
- [ ] Tests pass: `npm run test:e2e`
- [ ] Tests use accessible selectors (role, label)
- [ ] No hardcoded waits (use Playwright's auto-waiting)

**Code Quality**:
- [ ] TypeScript compiles: `npm run check`
- [ ] Linting passes: `npm run lint`
- [ ] Coverage maintained or improved

## 🐛 Debugging Tests

### Debugging Unit Tests

**VS Code**:
1. Set breakpoint in test file
2. Run "Debug: JavaScript Debug Terminal"
3. Run `npm test` in debug terminal

**Console logs**:
```typescript
it('should do something', () => {
  console.log('Debug:', someValue);
  expect(someValue).toBe(expected);
});
```

### Debugging E2E Tests

**Headed mode** (see browser):
```bash
npm run test:e2e -- --headed
```

**Debug mode** (step through):
```bash
npm run test:e2e -- --debug
```

**Trace viewer** (record and replay):
```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

**Screenshots on failure**:
```typescript
test('should work', async ({ page }) => {
  // Playwright automatically takes screenshot on failure
  await page.goto('/');
  await expect(page.getByText(/test/i)).toBeVisible();
});
```

## 🚀 Best Practices

### Unit Test Best Practices

1. **One assertion per test** (when possible)
2. **Clear test names**: Describe what and when
3. **Arrange-Act-Assert pattern**: Structure tests clearly
4. **Test behavior, not implementation**: Focus on what, not how
5. **Avoid test interdependence**: Each test should be independent
6. **Fast tests**: Mock slow operations (network, localStorage)

### E2E Test Best Practices

1. **Use accessible selectors**: `getByRole`, `getByLabel`
2. **Leverage auto-waiting**: Playwright waits automatically
3. **No hardcoded waits**: Use `waitForSelector` instead of `wait`
4. **Test user flows**: Complete scenarios, not individual actions
5. **Cleanup after tests**: Close contexts, clear localStorage
6. **Parallel execution**: Tests should not interfere with each other

### P2P Testing Strategies

**Unit testing**:
- Test message validation separately
- Mock Trystero functions
- Test state transformations independently

**E2E testing**:
- Use multiple browser contexts for multi-player tests
- Test connection, gameplay, and disconnection separately
- Mock WebRTC failures for error testing

## 📚 Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Code Style Guide](./code-style.md)
- [Contributing Guidelines](./contributing.md)

## 🆘 Troubleshooting

**Tests timing out**:
- Increase timeout in config
- Check for infinite loops
- Use `--headed` mode to see what's happening

**Flaky tests**:
- Remove hardcoded waits
- Use Playwright's auto-waiting
- Check for race conditions

**Coverage not updating**:
- Clear cache: `rm -rf coverage/`
- Re-run: `npm test -- --coverage`

Happy testing! 🧪
