---
description: 'Code review guidelines for reviewing pull requests and providing feedback'
applyTo: '**'
---

# Code Review Instructions

Guidelines for conducting thorough and constructive code reviews.

## Review Philosophy

- **Be constructive**: Focus on improving the code, not criticizing the author
- **Be specific**: Point to exact lines and suggest alternatives
- **Be timely**: Review within 24 hours when possible
- **Be thorough**: Don't just look for bugs, consider design and maintainability

## Review Checklist

### Correctness

- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled?
- [ ] Are error conditions handled gracefully?
- [ ] Is the logic correct?

### TypeScript Quality

- [ ] No `any` types (use `unknown` if truly unknown)
- [ ] Explicit return types on functions
- [ ] Proper use of interfaces vs types
- [ ] No TypeScript errors or warnings
- [ ] Strict mode compliance

### Svelte 5 Patterns

- [ ] Uses runes (`$state`, `$derived`, `$effect`) correctly
- [ ] No legacy reactive declarations (`$:`)
- [ ] Props are typed with interfaces
- [ ] Events use proper handlers (`onclick`, `oninput`)
- [ ] Components are appropriately sized

### Code Quality

- [ ] Functions are pure where possible
- [ ] No unnecessary side effects
- [ ] DRY (Don't Repeat Yourself)
- [ ] Single responsibility principle
- [ ] Meaningful variable and function names

### Testing

- [ ] New code has tests
- [ ] Tests cover happy path and error cases
- [ ] Tests are deterministic
- [ ] Test names describe behavior

### Security

- [ ] No hardcoded secrets or credentials
- [ ] User input is validated
- [ ] No injection vulnerabilities
- [ ] P2P messages are validated

### Performance

- [ ] No unnecessary re-renders
- [ ] Large computations are memoized
- [ ] No memory leaks (cleanup in `$effect`)
- [ ] Network payloads are minimal

### Documentation

- [ ] Complex logic is commented
- [ ] Public APIs have JSDoc comments
- [ ] README updated if needed

## Comment Types

### Required Changes

Use when the code must be changed before merging:

```
🔴 **Required**: This will cause a runtime error when `value` is undefined.
Consider adding a null check or using optional chaining.
```

### Suggestions

Use for improvements that aren't blocking:

```
💡 **Suggestion**: This could be simplified using `Array.reduce()`.
```

### Questions

Use to understand the author's intent:

```
❓ **Question**: Why is this check needed here? Is there a specific edge case?
```

### Praise

Use to acknowledge good work:

```
✅ **Nice**: Great use of the discriminated union pattern here!
```

## Common Issues to Look For

### TypeScript

```typescript
// ❌ Avoid: any type
const data: any = response;

// ✅ Better: Explicit type or unknown
const data: GameState = response as GameState;
const data: unknown = response;
```

### Svelte 5

```svelte
<!-- ❌ Avoid: Legacy reactive declaration -->
<script>
  $: doubled = count * 2;
</script>

<!-- ✅ Better: Svelte 5 rune -->
<script>
  let doubled = $derived(count * 2);
</script>
```

### Pure Functions

```typescript
// ❌ Avoid: Mutating input
function updateCard(card: BingoCard, number: number): void {
  card.cells[0].marked = true;
}

// ✅ Better: Return new state
function updateCard(card: BingoCard, number: number): BingoCard {
  return { ...card, cells: [...card.cells] };
}
```

### Error Handling

```typescript
// ❌ Avoid: Swallowing errors
try {
  doSomething();
} catch (e) {
  // silent failure
}

// ✅ Better: Handle or propagate
try {
  doSomething();
} catch (e) {
  console.error('Failed to do something:', e);
  throw new Error('Operation failed', { cause: e });
}
```

## Review Process

1. **Understand the context**: Read the PR description and linked issues
2. **Review the diff**: Go through changes file by file
3. **Run locally**: If changes are significant, check out and test
4. **Leave comments**: Be specific and constructive
5. **Approve or request changes**: Make a clear decision

## Automated Checks

Before manual review, ensure these pass:

- ✅ CI pipeline (lint, type check, tests)
- ✅ Copilot code review
- ✅ No merge conflicts

## Response Expectations

- **Author**: Respond to all comments
- **Reviewer**: Re-review within 24 hours after changes
- **Resolution**: Resolve threads when addressed

## When to Block

Block the PR (request changes) when:

- Code has bugs or incorrect logic
- Security vulnerabilities exist
- Tests are missing for new functionality
- TypeScript errors or `any` types
- Breaking changes without migration plan

## When to Approve with Comments

Approve with non-blocking suggestions when:

- Code is correct but could be cleaner
- Minor style improvements possible
- Nice-to-have refactoring opportunities
