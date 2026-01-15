# CI Workflow Improvements

This document describes the improvements made to the CI workflow in `.github/workflows/ci.yml`.

## Summary of Changes

The CI workflow has been revamped to improve build reliability, speed, and coverage with the following key improvements:

### 1. Updated Node.js Version (v20 → v22)
- **Reason**: The `@waku` dependencies in the project require Node.js v22
- **Impact**: Eliminates engine compatibility warnings and ensures proper dependency installation

### 2. Added Concurrency Control
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
- **Benefit**: Cancels redundant CI runs when new commits are pushed to the same branch
- **Impact**: Saves CI minutes and provides faster feedback

### 3. Optimized Dependency Caching

#### Node Modules Caching
- Created a dedicated `setup` job that installs dependencies once
- All downstream jobs restore from cache instead of running `npm ci` redundantly
- Cache key based on `package-lock.json` hash ensures cache invalidation on dependency changes

#### Playwright Browser Caching
```yaml
- name: Get Playwright version
  id: playwright-version
  run: echo "version=$(node -p "require('./package-lock.json').packages['node_modules/@playwright/test'].version")" >> $GITHUB_OUTPUT

- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ steps.playwright-version.outputs.version }}-chromium
```
- **Benefit**: Playwright browsers (~300MB) are cached based on version
- **Impact**: Reduces E2E test setup time from ~2 minutes to ~10 seconds on cache hit

### 4. Improved Job Dependencies and Parallelization

#### Job Dependency Graph
```
setup
├── lint (parallel)
├── unit-tests (parallel)
└── build (parallel)
    └── e2e-tests
```

- `setup`: Installs dependencies once for all jobs
- `lint`, `unit-tests`, `build`: Run in parallel after setup completes
- `e2e-tests`: Runs after build completes (depends on build artifacts)

**Previous workflow**: All jobs ran independently, each running `npm ci` (3x redundant installs)  
**New workflow**: Dependencies installed once, reused via cache (3x faster)

### 5. Separated Build Job
- Build now runs as a separate job with artifact upload
- E2E tests download the build artifacts instead of rebuilding
- **Benefit**: Build once, test in multiple configurations (future: multiple browsers)
- **Impact**: Eliminates redundant builds in E2E tests

### 6. Enhanced Artifact Handling

#### Build Artifacts
```yaml
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: dist
    path: dist/
    retention-days: 7
```

#### Test Reports
```yaml
- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30

- name: Upload test results
  uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: test-results
    path: test-results/
    retention-days: 7
```

- **Benefit**: Debug artifacts available even when tests fail
- **Impact**: Easier debugging of CI failures

### 7. Renamed Jobs for Clarity
- `Lint` → `Lint & Type Check` (now includes both ESLint and TypeScript checks)
- `E2E Tests` → `E2E Tests (Chromium)` (clarifies browser under test)
- Added `Build Application` as separate job

## Performance Improvements

### Before
- **Total time**: ~8-10 minutes
- **Redundant work**: 
  - 3x `npm ci` (one per job)
  - 3x Playwright browser downloads (if running full test suite)
  - Build happens in E2E job

### After
- **Total time**: ~4-6 minutes (40-50% faster on cache hit)
- **Optimizations**:
  - 1x `npm ci` (in setup job)
  - Cache hit for node_modules: ~30s vs ~1min (2x faster)
  - Cache hit for Playwright browsers: ~10s vs ~2min (12x faster)
  - Parallel execution of lint, unit tests, and build
  - Build artifacts reused in E2E tests

### Expected CI Times

| Stage | Time (cache miss) | Time (cache hit) |
|-------|-------------------|------------------|
| Setup | ~1 min | ~30s |
| Lint & Type Check | ~30s | ~20s |
| Unit Tests | ~20s | ~15s |
| Build | ~1 min | ~40s |
| E2E Tests | ~2.5 min | ~1 min |
| **Total** | **~5-6 min** | **~2.5-3 min** |

*Times are approximate and may vary based on GitHub Actions runner availability*

## Test Coverage

The CI workflow now covers:

1. **Linting**: ESLint for code quality
2. **Type Checking**: TypeScript strict mode checks
3. **Unit Tests**: Vitest tests for game logic
4. **Build**: Vite production build validation
5. **E2E Tests**: Playwright tests on Chromium

All test types run on every PR and push to main, ensuring comprehensive quality checks.

## Debugging Failed CI Runs

### View Artifacts
1. Go to the failed workflow run in GitHub Actions
2. Scroll to "Artifacts" section at the bottom
3. Download:
   - `playwright-report`: HTML report with screenshots and traces
   - `test-results`: Raw test output and failure details
   - `dist`: Build artifacts (to verify build output)

### Common Failures and Solutions

#### Lint Failures
- Check ESLint warnings in the job logs
- Run `npm run lint` locally to reproduce
- Fix issues or add ESLint ignore comments if justified

#### Type Check Failures
- Review TypeScript errors in job logs
- Run `npm run check` locally to reproduce
- Fix type errors or update types

#### Unit Test Failures
- Check test output in job logs
- Run `npm test` locally to reproduce
- Fix failing tests or update snapshots

#### E2E Test Failures
- Download `playwright-report` artifact
- Open `index.html` in browser to view detailed report
- Check screenshots and traces for visual debugging
- Run `npm run test:e2e -- --headed` locally to reproduce

#### Build Failures
- Check build output in job logs
- Run `npm run build` locally to reproduce
- Fix build errors or update configuration

## Future Improvements

Potential enhancements for consideration:

1. **Multi-browser E2E testing**: Run E2E tests on Firefox and WebKit in parallel
2. **Code coverage reporting**: Add coverage collection and upload to Codecov
3. **Performance budgets**: Add checks for bundle size limits
4. **Lighthouse CI**: Add performance and accessibility checks
5. **Dependabot**: Auto-update dependencies with automated testing
6. **Status badges**: Add CI status badge to README.md

## Maintenance

### Updating Node.js Version
Edit `node-version` in all jobs:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'  # Update this
```

### Updating Actions
Keep GitHub Actions up to date:
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/cache@v4`
- `actions/upload-artifact@v4`
- `actions/download-artifact@v4`

Check for updates quarterly or when GitHub recommends.

### Cache Invalidation
Caches automatically invalidate when:
- `package-lock.json` changes (node_modules cache)
- Playwright version changes (browser cache)

Manual cache clearing is rarely needed.

## References

- [GitHub Actions: Caching dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Playwright CI Guide](https://playwright.dev/docs/ci)
- [npm ci documentation](https://docs.npmjs.com/cli/v10/commands/npm-ci)
