# CI/CD Quick Reference

Quick reference for developers working with the CI/CD pipeline.

## CI Status Badge

Add this badge to your README.md to show CI status:

```markdown
![CI Status](https://github.com/amitjoshi-ms/gametime-bingo/actions/workflows/ci.yml/badge.svg)
```

## Local Development Commands

Before pushing code, run these commands locally to catch issues early:

```bash
# Install dependencies
npm ci

# Run linter
npm run lint

# Run type check
npm run check

# Run unit tests
npm test

# Build application
npm run build

# Run E2E tests (requires build first)
npm run test:e2e
```

## CI Workflow Jobs

The CI workflow runs the following jobs in this order:

```
setup (installs dependencies)
  ├── lint (ESLint + TypeScript)
  ├── unit-tests (Vitest)
  └── build (Vite)
      └── e2e-tests (Playwright Chromium)
```

## Expected CI Times

| Job | Duration (cache hit) | Duration (cache miss) |
|-----|---------------------|----------------------|
| Setup | ~30s | ~1 min |
| Lint & Type Check | ~20s | ~30s |
| Unit Tests | ~15s | ~20s |
| Build | ~40s | ~1 min |
| E2E Tests | ~1 min | ~2.5 min |
| **Total** | **~2.5-3 min** | **~5-6 min** |

## CI Artifacts

After CI runs, the following artifacts are available:

- **dist**: Production build output (7 days retention)
- **playwright-report**: E2E test report with screenshots (30 days retention)
- **test-results**: Raw test output (7 days retention)

## Debugging CI Failures

### Quick Steps

1. Check the failed job in GitHub Actions
2. Click on the failed step to see error logs
3. Download artifacts for detailed reports
4. Reproduce locally using the commands above

### Common Issues

**Lint Failures**
```bash
# Fix locally
npm run lint

# Auto-fix where possible
npx eslint . --fix
```

**Type Check Failures**
```bash
# Fix locally
npm run check
```

**Unit Test Failures**
```bash
# Run tests locally
npm test

# Run in watch mode for debugging
npm run test:watch
```

**E2E Test Failures**
```bash
# Run E2E tests locally with UI
npm run test:e2e -- --ui

# Run in headed mode to see browser
npm run test:e2e -- --headed

# Debug specific test
npx playwright test tests/e2e/home.spec.ts --debug
```

**Build Failures**
```bash
# Build locally
npm run build

# Check for errors
npm run check
```

## Cache Behavior

The CI uses two types of caches:

### node_modules Cache
- **Key**: `{OS}-node-modules-{package-lock.json hash}`
- **Invalidated when**: package-lock.json changes
- **Saves**: ~30 seconds per job

### Playwright Browsers Cache
- **Key**: `{OS}-playwright-{version}-chromium`
- **Invalidated when**: Playwright version changes
- **Saves**: ~2 minutes in E2E tests

## Manual Cache Clearing

GitHub automatically manages caches, but you can clear them if needed:

1. Go to repository Settings → Actions → Caches
2. Find the cache to delete
3. Click the trash icon

## Workflow Triggers

The CI workflow runs on:

- **Pull Requests** to `main` branch
- **Pushes** to `main` branch

To skip CI on a commit (not recommended):

```bash
git commit -m "docs: update README [skip ci]"
```

## Node.js Version

The CI uses Node.js v22 (required by Waku dependencies).

To match locally:

```bash
# Check your version
node --version

# Install Node.js 22 via nvm (if using nvm)
nvm install 22
nvm use 22
```

## Concurrency Control

The CI automatically cancels redundant runs when you push new commits to the same branch.

Example:
- Push commit A → CI starts
- Push commit B → CI for commit A is cancelled, CI for commit B starts

This saves CI minutes and provides faster feedback.

## Contributing

Before submitting a PR:

1. ✅ Run all commands locally (see above)
2. ✅ Ensure all tests pass
3. ✅ Fix any linting or type errors
4. ✅ Check that your changes build successfully
5. ✅ Push and wait for CI to pass

## Getting Help

- Check [CI_IMPROVEMENTS.md](./.github/workflows/CI_IMPROVEMENTS.md) for detailed documentation
- Check workflow logs in GitHub Actions for error details
- Download artifacts for debugging test failures
- Ask in PR comments if you need help interpreting CI failures
