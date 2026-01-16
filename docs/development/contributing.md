# Contributing Guidelines

Thank you for your interest in contributing to Gametime Bingo! This guide will help you get started.

## 🤝 How to Contribute

### Ways to Contribute

- **Report bugs**: Found a bug? [Open an issue](https://github.com/amitjoshi-ms/gametime-bingo/issues/new)
- **Suggest features**: Have an idea? [Open a feature request](https://github.com/amitjoshi-ms/gametime-bingo/issues/new)
- **Fix bugs**: Browse [open issues](https://github.com/amitjoshi-ms/gametime-bingo/issues) and submit a PR
- **Add features**: Implement new functionality
- **Improve docs**: Fix typos, add examples, clarify explanations
- **Write tests**: Increase test coverage

### Before You Start

1. **Read the docs**: Familiarize yourself with the project
   - [Getting Started](../getting-started.md)
   - [Architecture Overview](../architecture.md)
   - [Development Setup](./setup.md)
   - [Code Style Guide](./code-style.md)

2. **Check existing issues**: See if someone else is working on it
3. **Discuss major changes**: Open an issue first for big features
4. **Follow the code style**: Use existing patterns and conventions

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:

# Clone your fork
git clone https://github.com/YOUR_USERNAME/gametime-bingo.git
cd gametime-bingo

# Add upstream remote
git remote add upstream https://github.com/amitjoshi-ms/gametime-bingo.git

# Verify remotes
git remote -v
```

### 2. Create a Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

**Branch naming conventions**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 3. Make Changes

Follow the [Code Style Guide](./code-style.md) and [Testing Guide](./testing.md).

**Before committing**:
```bash
# Run all checks
npm run check    # TypeScript
npm run lint     # ESLint
npm test         # Unit tests
npm run build    # Production build
```

All checks must pass!

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

git commit -m "feat(game): add undo last number call"
git commit -m "fix(network): handle reconnection timeout"
git commit -m "docs(api): add game logic examples"
git commit -m "test(card): add line detection tests"
```

**Commit types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance (dependencies, config)
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Scope** (optional):
- `game` - Game logic
- `network` - P2P networking
- `ui` - User interface
- `api` - API changes
- `build` - Build system
- `deps` - Dependencies

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
```

## 📝 Pull Request Process

### PR Title

Use the same format as commit messages:

```
feat(game): add undo last number call
fix(network): handle reconnection timeout properly
docs: update contributing guidelines
```

### PR Description

Include:

1. **What**: What does this PR do?
2. **Why**: Why is this change needed?
3. **How**: How does it work? (for complex changes)
4. **Testing**: How was this tested?
5. **Screenshots**: For UI changes (required)
6. **Related issues**: Fixes #123, Closes #456

**Template**:
```markdown
## Summary
Brief description of the changes.

## Changes
- Added feature X
- Fixed bug Y
- Updated docs for Z

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass locally

## Related Issues
Fixes #123

## Screenshots (if applicable)
[Attach screenshots for UI changes]
```

### PR Checklist

Before submitting, ensure:

- [ ] Code follows the [Code Style Guide](./code-style.md)
- [ ] All tests pass (`npm test` and `npm run test:e2e`)
- [ ] TypeScript compiles without errors (`npm run check`)
- [ ] Linting passes (`npm run lint`)
- [ ] New code has tests (unit or E2E)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions
- [ ] PR description is clear and complete
- [ ] Screenshots included (for UI changes)

### Review Process

1. **Automated checks**: CI runs linting, tests, build
2. **Code review**: Maintainers review your code
3. **Feedback**: Address review comments
4. **Approval**: Once approved, your PR will be merged
5. **Cleanup**: Delete your feature branch after merge

**Response time**: We aim to review PRs within 2-3 business days.

## 🎯 Contribution Guidelines

### Code Quality

- **Write tests**: All new features and bug fixes need tests
- **Keep it simple**: Prefer simple, readable code over clever solutions
- **Single responsibility**: Functions should do one thing well
- **Pure functions**: Prefer pure functions (especially in `lib/game/`)
- **Type safety**: No `any` types - use explicit types or `unknown`

### Testing Requirements

**For new features**:
- Unit tests for game logic
- E2E tests for user flows
- Coverage should not decrease

**For bug fixes**:
- Test that reproduces the bug
- Test that verifies the fix

**Example**:
```typescript
// Bug fix commit should include:

// 1. Test that reproduces bug (should fail before fix)
it('should handle duplicate number calls', () => {
  const session = createSession();
  session = addCalledNumber(session, 5);
  expect(() => addCalledNumber(session, 5)).toThrow();
});

// 2. Fix the code
// 3. Verify test passes
```

### Documentation

Update documentation for:
- New features (user-facing and API)
- Changed behavior
- New configuration options
- Deprecated features

**Documentation locations**:
- User docs: `docs/`
- API docs: JSDoc in code + `docs/api/`
- Code comments: For complex logic

### Performance

- Avoid unnecessary re-renders in Svelte components
- Keep bundle size small (check with `npm run build`)
- Use `$derived` for computed values, not `$effect`
- Minimize P2P message sizes

### Security

- Validate all user inputs
- Validate all P2P messages
- No hardcoded secrets or credentials
- Follow OWASP best practices

## 🐛 Reporting Bugs

### Before Reporting

1. **Search existing issues**: Someone might have already reported it
2. **Verify it's reproducible**: Can you reproduce it consistently?
3. **Check the latest version**: Is it still a bug in main branch?

### Bug Report Template

```markdown
## Bug Description
Clear description of what went wrong.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Version: 26.116.0

## Screenshots/Logs
[Attach screenshots or console logs]

## Additional Context
Any other relevant information.
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Why is this feature needed? Who benefits?

## Proposed Solution
How might this work? (optional)

## Alternatives Considered
Other approaches you've thought about. (optional)

## Additional Context
Mockups, examples from other apps, etc. (optional)
```

## 🏷️ Issue Labels

| Label | Meaning |
|-------|---------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `documentation` | Docs improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `priority: high` | Needs urgent attention |
| `priority: low` | Nice to have |
| `wontfix` | Not planned |
| `duplicate` | Already reported |

## 👥 Code of Conduct

### Our Standards

- **Be respectful**: Treat everyone with respect
- **Be constructive**: Focus on improving, not criticizing
- **Be inclusive**: Welcome diverse perspectives
- **Be patient**: Remember everyone started somewhere
- **Be collaborative**: Work together toward common goals

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information
- Any unprofessional conduct

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report issues to project maintainers.

## 🎓 Learning Resources

### Svelte 5
- [Svelte 5 Docs](https://svelte-5-preview.vercel.app/docs/introduction)
- [Runes Guide](https://svelte-5-preview.vercel.app/docs/runes)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### WebRTC & P2P
- [Trystero Docs](https://github.com/dmotz/trystero)
- [WebRTC Basics](https://webrtc.org/getting-started/overview)

### Testing
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)

## 📞 Getting Help

- **Documentation**: Start with [docs/](../README.md)
- **Issues**: [GitHub Issues](https://github.com/amitjoshi-ms/gametime-bingo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/amitjoshi-ms/gametime-bingo/discussions)

## 🙏 Recognition

All contributors will be:
- Listed in the [Contributors](https://github.com/amitjoshi-ms/gametime-bingo/graphs/contributors) page
- Mentioned in release notes (for significant contributions)
- Thanked in commit messages with `Co-authored-by:`

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Gametime Bingo! 🎉

Your contributions make this project better for everyone. We appreciate your time and effort! ❤️
