---
description: 'Test authoring standards for Vitest unit tests and Playwright E2E tests'
applyTo: '**/*.test.ts, **/*.spec.ts, tests/**/*.ts'
---

# Test Authoring Instructions

Standards and best practices for writing tests in the gametime-bingo project.

> **Modularity**: Tests follow the same TypeScript standards as application code.
> See: `.github/instructions/code-authoring.instructions.md` for TypeScript patterns.

## Test Structure

```text
tests/
  unit/           # Vitest unit tests
    game/         # Game logic tests (card.test.ts, session.test.ts, etc.)
    utils/        # Utility function tests (random.test.ts, storage.test.ts)
  e2e/            # Playwright E2E tests (home.spec.ts, multiplayer.spec.ts)
```

**Note**: Create `tests/component/` directory when adding Svelte component tests.

## Unit Testing with Vitest

### File Naming

- Test files: `*.test.ts`
- Location: Mirror source structure in `tests/unit/`
- Example: `src/lib/game/card.ts` → `tests/unit/game/card.test.ts`

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { generateCard, markNumber } from '$lib/game/card';
import type { BingoCard } from '$lib/game/types';

describe('generateCard', () => {
  it('should generate a 5x5 grid', () => {
    const card = generateCard();
    expect(card.grid).toHaveLength(5);
    expect(card.grid[0]).toHaveLength(5);
  });

  it('should have unique numbers from 1 to 25', () => {
    const card = generateCard();
    const values = card.grid.flat();
    expect(new Set(values).size).toBe(25);
    values.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(25);
    });
  });
});

describe('markNumber', () => {
  let card: BingoCard;

  beforeEach(() => {
    card = generateCard();
  });

  it('should mark the cell with matching number', () => {
    const number = card.grid[0][0];
    const result = markNumber(card, number);
    expect(result.marked[0][0]).toBe(true);
  });

  it('should not mutate the original card', () => {
    const number = card.grid[0][0];
    markNumber(card, number);
    expect(card.marked[0][0]).toBe(false);
  });
});
```

### Testing Pure Functions

```typescript
// ✅ Good: Test edge cases and boundaries
describe('isValidNumber', () => {
  it('should return true for numbers 1-25', () => {
    for (let i = 1; i <= 25; i++) {
      expect(isValidNumber(i)).toBe(true);
    }
  });

  it('should return false for 0', () => {
    expect(isValidNumber(0)).toBe(false);
  });

  it('should return false for numbers greater than 25', () => {
    expect(isValidNumber(26)).toBe(false);
    expect(isValidNumber(100)).toBe(false);
  });

  it('should return false for non-integers', () => {
    expect(isValidNumber(1.5)).toBe(false);
    expect(isValidNumber(NaN)).toBe(false);
  });
});
```

**Alternative: Using `it.each` for parameterized tests**:
```typescript
describe('isValidNumber', () => {
  it.each([
    [0, false, 'below minimum'],
    [1, true, 'minimum valid'],
    [25, true, 'maximum valid'],
    [26, false, 'above maximum'],
    [NaN, false, 'NaN'],
  ])('isValidNumber(%s) should return %s (%s)', (input, expected) => {
    expect(isValidNumber(input)).toBe(expected);
  });
});
```

### Mocking

```typescript
import { vi } from 'vitest';

// Mock localStorage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
vi.stubGlobal('localStorage', mockStorage);

// Mock random for deterministic tests
vi.spyOn(Math, 'random').mockReturnValue(0.5);
```

## E2E Testing with Playwright

### File Naming

- Test files: `*.spec.ts`
- Location: `tests/e2e/`

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display game title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /bingo/i })).toBeVisible();
  });

  test('should navigate to create game', async ({ page }) => {
    await page.getByRole('button', { name: /create game/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
```

### Page Object Pattern

```typescript
// tests/e2e/pages/home.page.ts
import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly createGameButton: Locator;
  readonly joinGameButton: Locator;
  readonly playerNameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createGameButton = page.getByRole('button', { name: /create game/i });
    this.joinGameButton = page.getByRole('button', { name: /join game/i });
    this.playerNameInput = page.getByLabel(/player name/i);
  }

  async goto() {
    await this.page.goto('/');
  }

  async createGame(playerName: string) {
    await this.createGameButton.click();
    await this.playerNameInput.fill(playerName);
    await this.page.getByRole('button', { name: /start/i }).click();
  }
}
```

### Accessibility Testing

> **Note**: Requires `@axe-core/playwright` package (install separately if needed).

```typescript
// Note: @axe-core/playwright is not included by default.
// Install it separately: npm install -D @axe-core/playwright
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should pass accessibility checks', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### Network Mocking

```typescript
test('should handle network errors gracefully', async ({ page }) => {
  // Mock network failure
  await page.route('**/api/**', route => route.abort());
  
  await page.goto('/');
  await page.getByRole('button', { name: /join/i }).click();
  
  await expect(page.getByText(/connection failed/i)).toBeVisible();
});
```

### P2P Testing Strategies

P2P tests require special handling since there's no central server:

```typescript
// ✅ Good: Test P2P message validation in isolation
describe('P2P message validation', () => {
  it('should reject messages with missing type', () => {
    const result = validateGameMessage({ number: 42 });
    expect(result.success).toBe(false);
  });

  it('should accept valid number-called messages', () => {
    const result = validateGameMessage({ type: 'number-called', number: 42 });
    expect(result.success).toBe(true);
  });
});

// ✅ Good: Mock Trystero for unit tests
vi.mock('trystero', () => ({
  joinRoom: vi.fn(() => ({
    makeAction: vi.fn(() => [vi.fn(), vi.fn()]),
    leave: vi.fn(),
    getPeers: vi.fn(() => ({})),
  })),
}));
```

### Multi-Player E2E Tests

```typescript
// ✅ Good: Use two browser contexts for P2P E2E tests
test('two players can join same room', async ({ browser }) => {
  const host = await browser.newContext();
  const guest = await browser.newContext();
  
  const hostPage = await host.newPage();
  const guestPage = await guest.newPage();
  
  // Host creates game
  await hostPage.goto('/');
  await hostPage.getByRole('button', { name: /create/i }).click();
  const roomUrl = hostPage.url();
  
  // Guest joins via URL
  await guestPage.goto(roomUrl);
  
  // Both see each other
  await expect(hostPage.getByText(/2 players/i)).toBeVisible();
  await expect(guestPage.getByText(/2 players/i)).toBeVisible();
  
  await host.close();
  await guest.close();
});
```

## Test Quality Guidelines

### What to Test

1. **Unit Tests** (fast, isolated):
   - Pure game logic functions
   - Validation functions
   - Utility functions
   - State transformations
   - P2P message validation

2. **E2E Tests** (slow, integrated):
   - Critical user flows (create game, join game, play bingo)
   - Cross-browser compatibility
   - Accessibility
   - Error states and recovery
   - Multi-player scenarios (using multiple browser contexts)

### Test Naming

```typescript
// ✅ Good: Descriptive, follows "should X when Y" pattern
it('should mark cell as selected when number is called', () => {});
it('should return error when number is out of range', () => {});

// ❌ Bad: Vague or implementation-focused
it('works', () => {});
it('test markCell function', () => {});
```

### Assertions

```typescript
// ✅ Good: Specific assertions
expect(result.cells[0].marked).toBe(true);
expect(result.error).toBe('Number out of range');

// ❌ Bad: Vague assertions
expect(result).toBeTruthy();
expect(result).not.toBeNull();
```

## Test Checklist

Before submitting tests:

- [ ] Tests are deterministic (no flaky tests)
- [ ] Tests are independent (can run in any order)
- [ ] Test names describe behavior, not implementation
- [ ] Edge cases are covered
- [ ] Error cases are tested
- [ ] No `any` types in test code
- [ ] Mocks are cleaned up after tests
- [ ] E2E tests use accessible selectors (role, label)

> **For code review**: See `.github/instructions/code-review.instructions.md` for review standards

## Commands

```bash
npm test                        # Run unit tests
npm run test:watch              # Run unit tests in watch mode
npm test -- --coverage          # Run with coverage report
npm run test:e2e                # Run E2E tests (headless)
npm run test:e2e -- --headed    # Run E2E tests (visible browser)
npm run test:e2e -- --debug     # Run E2E tests with debugger
npx playwright test --project=chromium  # Run E2E in specific browser
```

**Run Specific Tests**:
```bash
# Run single unit test file
npm test tests/unit/game/card.test.ts

# Run tests matching a pattern
npm test -- --grep "should generate"

# Run single E2E test file
npx playwright test tests/e2e/home.spec.ts

# Run E2E test in headed mode for debugging
npx playwright test tests/e2e/home.spec.ts --headed
```
