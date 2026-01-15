---
description: 'Documentation review guidelines for reviewing docs, READMEs, and guides'
applyTo: '**/*.md, **/*.mdx'
---

# Documentation Review Instructions

Guidelines for reviewing documentation changes.

> **Modularity**: This file defines *how* to review docs. For *what* standards to check,
> reference: `.github/instructions/documentation-authoring.instructions.md`

## Review Philosophy

- **Accuracy first**: Information must be correct
- **Clarity second**: Information must be understandable
- **Completeness third**: Information must be sufficient

## Review Checklist

### Accuracy

- [ ] Technical information is correct
- [ ] Code examples compile/run without errors
- [ ] Command examples work as documented
- [ ] Links point to correct destinations
- [ ] Version numbers are current
- [ ] Screenshots match current UI

### Clarity

- [ ] Purpose is clear from the first paragraph
- [ ] Headings accurately describe content
- [ ] Steps are in logical order
- [ ] Jargon is explained or linked
- [ ] Examples illustrate the concept
- [ ] No ambiguous pronouns ("it", "this")

### Completeness

- [ ] All required information is present
- [ ] Prerequisites are listed
- [ ] Error cases are documented
- [ ] Related topics are linked
- [ ] Next steps are provided

### Structure

- [ ] Follows document type template
- [ ] Heading hierarchy is correct (no skipped levels)
- [ ] Code blocks have language specified
- [ ] Lists use consistent formatting
- [ ] Tables are properly aligned

### Style

- [ ] Active voice used
- [ ] Sentences are concise
- [ ] Consistent terminology throughout
- [ ] Spelling and grammar are correct
- [ ] Tone is appropriate for audience

## Common Issues

### Broken Code Examples

```typescript
// ❌ Example that won't compile
function example(data) {  // Missing type annotation
  return data.value;
}

// ✅ Example that compiles
function example(data: { value: string }): string {
  return data.value;
}
```

### Outdated Information

Look for:
- Old version numbers
- Deprecated APIs or commands
- Changed file paths
- Removed features

### Missing Context

````markdown
<!-- ❌ Missing context -->
Run `npm test` to verify.

<!-- ✅ With context -->
After making changes, verify tests pass:
```bash
npm test
```

This runs the Vitest unit test suite.
````

### Ambiguous Instructions

````markdown
<!-- ❌ Ambiguous -->
Update the configuration file.

<!-- ✅ Specific -->
Update `vite.config.ts` to add the plugin:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [svelte()],
});
```
````

### Inconsistent Formatting

````markdown
<!-- ❌ Inconsistent -->
Run these commands:
- `npm install`
- npm run dev
- Run `npm run build`

<!-- ✅ Consistent -->
Run these commands:
- `npm install`
- `npm run dev`
- `npm run build`
````

## Comment Types

### Factual Errors

```
🔴 **Error**: This command has been deprecated since v2.0.
The correct command is `npm run check`.
```

### Clarity Issues

```
📝 **Clarity**: This step might confuse new users.
Consider adding an example showing the expected output.
```

### Missing Information

```
➕ **Missing**: This section should mention the required Node.js version.
```

### Style Suggestions

```
💡 **Style**: This sentence could be more concise.
Suggestion: "Run tests before committing" instead of
"Before you commit your changes, you should run the tests".
```

### Positive Feedback

```
✅ **Nice**: Great example! The before/after comparison really clarifies the concept.
```

## Special Considerations

### README Changes

- Does it still make sense for first-time visitors?
- Are quick-start steps still valid?
- Is the project description accurate?

### API Documentation

- Are all parameters documented?
- Are return types accurate?
- Are error conditions described?
- Do examples demonstrate actual use cases?

### Prompt/Instruction Files

- Does the frontmatter have required fields?
- Are `applyTo` patterns correct?
- Are workflows complete and actionable?
- Can Copilot follow the instructions?

## Review Process

1. **Read the diff**: Understand what changed
2. **Check links**: Verify all links work
3. **Test code**: Run any code examples
4. **Read in context**: View rendered markdown
5. **Leave comments**: Be specific and helpful
6. **Approve or request changes**: Make clear decision

## When to Block

Block documentation PRs when:

- Technical information is incorrect
- Code examples don't work
- Critical steps are missing
- Links are broken
- Security information is wrong

## When to Approve with Comments

Approve with suggestions when:

- Minor wording improvements
- Style preferences
- Nice-to-have additions
- Formatting tweaks
