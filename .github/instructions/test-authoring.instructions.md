---
description: 'Test authoring standards for Vitest unit tests and Playwright E2E tests'
applyTo: '**/*.test.ts, **/*.spec.ts, tests/**/*.ts'
---

# Test Authoring Instructions

Standards and best practices for writing tests in the gametime-bingo project.

## Test Structure

```text
tests/
  unit/           # Vitest unit tests
    game/         # Game logic tests
    utils/        # Utility function tests
  component/      # Svelte component tests
  e2e/            # Playwright E2E tests
```

## Unit Testing with Vitest

### File Naming

- Test files: `*.test.ts`
- Location: Mirror source structure in `tests/unit/`
- Example: `src/lib/game/card.ts` → `tests/unit/game/card.test.ts`

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { generateCard, markCell } from '$lib/game/card';

describe('generateCard', () => {
  it('should generate a 5x5 card with 25 cells', () => {
    const card = generateCard();
    expect(card.cells).toHaveLength(25);
  });

  it('should have unique numbers in each column range', () => {
    const card = generateCard();
    // B column: 1-15, I column: 16-30, etc.
    const bColumn = card.cells.filter((_, i) => i % 5 === 0);
    bColumn.forEach(cell => {
      expect(cell.value).toBeGreaterThanOrEqual(1);
      expect(cell.value).toBeLessThanOrEqual(15);
    });
  });
});

describe('markCell', () => {
  let card: BingoCard;

  beforeEach(() => {
    card = generateCard();
  });

  it('should mark the cell with matching number', () => {
    const number = card.cells[0].value;
    const result = markCell(card, number);
    expect(result.cells[0].marked).toBe(true);
  });

  it('should not mutate the original card', () => {
    const number = card.cells[0].value;
    markCell(card, number);
    expect(card.cells[0].marked).toBe(false);
  });
});
```

### Testing Pure Functions

```typescript
// ✅ Good: Test edge cases and boundaries
describe('validateNumber', () => {
  it.each([
    [0, false, 'below minimum'],
    [1, true, 'minimum valid'],
    [75, true, 'maximum valid'],
    [76, false, 'above maximum'],
    [NaN, false, 'NaN'],
    [Infinity, false, 'Infinity'],
  ])('validateNumber(%s) should return %s (%s)', (input, expected) => {
    expect(validateNumber(input).success).toBe(expected);
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

```typescript
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

## Test Quality Guidelines

### What to Test

1. **Unit Tests** (fast, isolated):
   - Pure game logic functions
   - Validation functions
   - Utility functions
   - State transformations

2. **E2E Tests** (slow, integrated):
   - Critical user flows (create game, join game, play bingo)
   - Cross-browser compatibility
   - Accessibility
   - Error states and recovery

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

## Commands

```bash
pnpm test                    # Run unit tests
pnpm test:watch              # Run unit tests in watch mode
pnpm test:coverage           # Run with coverage report
pnpm test:e2e                # Run E2E tests (headless)
pnpm test:e2e --headed       # Run E2E tests (visible browser)
pnpm test:e2e --debug        # Run E2E tests with debugger
```
