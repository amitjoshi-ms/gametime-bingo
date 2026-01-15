---
description: 'Documentation authoring standards for README, guides, and inline documentation'
applyTo: '**/*.md, **/*.mdx'
---

# Documentation Authoring Instructions

Standards for writing clear, maintainable documentation.

> **Modularity**: This file defines *what* standards to follow when writing docs.
> For *how* docs are reviewed, see: `.github/instructions/documentation-review.instructions.md`

## Documentation Types

### README.md

The main entry point for the project. Should include:

- **Project overview**: What is this? Who is it for?
- **Quick start**: Get running in < 5 minutes
- **Features**: Key capabilities
- **Tech stack**: Technologies used
- **Development**: How to contribute
- **License**: Legal information

### Inline Documentation

Code comments and JSDoc for APIs.

### Prompt Files

Instructions for Copilot workflows (`.github/prompts/*.prompt.md`).

### Instruction Files

Coding standards and guidelines (`.github/instructions/*.instructions.md`).

## Markdown Standards

### Headings

```markdown
# H1 - Document Title (one per file)

## H2 - Major Sections

### H3 - Subsections

#### H4 - Details (use sparingly)
```

### Code Blocks

Always specify language for syntax highlighting:

````markdown
```typescript
function example(): void {
  console.log('Hello');
}
```
````

### Lists

```markdown
Unordered lists for items without sequence:
- Item one
- Item two
- Item three

Ordered lists for sequences:
1. First step
2. Second step
3. Third step

Task lists for checklists:
- [ ] Todo item
- [x] Completed item
```

### Links

```markdown
<!-- Inline link -->
See the [contributing guide](./CONTRIBUTING.md) for details.

<!-- Reference link -->
Check the [API documentation][api-docs] for more information.

[api-docs]: ./docs/api.md
```

### Tables

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |
```

## JSDoc Standards

### Function Documentation

```typescript
/**
 * Generates a new bingo card with random numbers.
 *
 * @description Creates a 5x5 bingo card with numbers 1-25 randomly distributed.
 *
 * @param seed - Optional seed for deterministic generation (useful for testing)
 * @returns A new BingoCard with a 5x5 grid and marked state
 *
 * @example
 * ```typescript
 * const card = generateCard();
 * console.log(card.grid.flat().length); // 25
 * ```
 */
function generateCard(seed?: number): BingoCard {
  // ...
}
```

### Interface Documentation

```typescript
/**
 * Represents a player in the bingo game.
 * Card and progress are stored locally, not synced over network.
 */
interface Player {
  /** Unique player identifier (Trystero peer ID) */
  readonly id: string;

  /** Display name chosen by player (1-20 chars) */
  name: string;

  /** Current connection state */
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';

  /** Whether this player is the session host */
  isHost: boolean;

  /** Timestamp when player joined (Unix epoch ms) */
  joinedAt: number;
}
```

**Best Practices**:
- Document the interface's purpose in the main comment
- Add inline comments for each property
- Specify units for numeric values (ms, seconds, etc.)
- Explain readonly fields and why they're immutable

### Type Documentation

```typescript
/**
 * Current status of a game session.
 *
 * - `lobby`: Players are joining, game hasn't started
 * - `playing`: Game is in progress, numbers being called
 * - `completed`: Game has ended, winner declared
 */
type GameStatus = 'lobby' | 'playing' | 'completed';
```

## Prompt File Standards

### Frontmatter

```yaml
---
description: 'Brief description of what this prompt does'
tools:
  - tool1
  - tool2
---
```

### Structure

1. **Title**: Clear, action-oriented
2. **Purpose**: What problem does this solve?
3. **Prerequisites**: What's needed before starting?
4. **Workflow**: Step-by-step instructions
5. **Commands**: Relevant CLI commands
6. **Examples**: Sample inputs/outputs

## Instruction File Standards

### Frontmatter

```yaml
---
description: 'Brief description of what these instructions cover'
applyTo: '**/*.ts, **/*.svelte'  # Glob pattern for applicable files
---
```

### Structure

1. **Title**: Technology or domain name
2. **Overview**: Context and scope
3. **Guidelines**: Organized by topic
4. **Examples**: Good vs bad patterns
5. **Checklist**: Quick reference for compliance

## Writing Style

### Be Concise

````markdown
<!-- ❌ Verbose -->
In order to start the development server, you will need to execute the following command in your terminal application.

<!-- ✅ Concise -->
Start the development server:
```bash
npm run dev
```
````

### Be Active

```markdown
<!-- ❌ Passive -->
The tests should be run before committing.

<!-- ✅ Active -->
Run tests before committing.
```

### Be Specific

````markdown
<!-- ❌ Vague -->
Make sure the code is good.

<!-- ✅ Specific -->
Ensure TypeScript compiles without errors:
```bash
npm run check
```
````

## Documentation Checklist

Before committing documentation:

- [ ] Spelling and grammar checked
- [ ] Code examples are tested and work
- [ ] Links are valid (no 404s)
- [ ] Headings follow hierarchy (no skipped levels)
- [ ] Code blocks have language specified
- [ ] Screenshots are up to date (if any)
- [ ] Version numbers are current

## Commands

> **Note**: These tools are not included in the project. Install separately if needed.

```bash
# Preview markdown locally
npx markserv README.md

# Check links
npx markdown-link-check README.md

# Lint markdown
npx markdownlint README.md
```
