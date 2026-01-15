# Release Latest Changes to Production

## Overview

This prompt guides the release of changes from `main` to the `release` branch for Cloudflare Pages deployment.

> **For rollback & troubleshooting**: See `.github/instructions/production-release.instructions.md`

## How the Release Workflow Works

The release workflow automates deploying code from `main` to production with quality gates:

```
┌─────────────────────────────────────────────────────────────────┐
│  User triggers workflow (gh workflow run / Actions UI)          │
│  - Must type "release" to confirm                               │
│  - Select version bump type (patch/minor/major)                 │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Pre-Release Validation Job                                     │
│  - Install dependencies                                         │
│  - Run linter (npm run lint)                                    │
│  - Run type check (npm run check)                               │
│  - Run unit tests (npm run test)                                │
│  - Build application (npm run build)                            │
│  - Upload build artifacts                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Environment approval gate (production environment)             │
│  - Workflow pauses and waits for reviewer approval              │
│  - Prevents unauthorized releases                               │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Determine version (semantic versioning)                     │
│     - Read current version from package.json                    │
│     - Bump based on input (major.minor.patch)                   │
│     - Create tag in format vX.Y.Z                               │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Update package.json version                                 │
│     - Use npm version command                                   │
│     - Stage changes for commit                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Generate changelog                                          │
│     - Extract commits since last tag                            │
│     - Group by type (feat, fix, chore, etc.)                    │
│     - Format as markdown                                        │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Unlock release branch                                       │
│     - Removes branch protection via GitHub API                  │
│     - Checks HTTP status (404 = skip, 200 = delete, else fail)  │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Fast-forward merge                                          │
│     - git merge --ff-only origin/main                           │
│     - Commit version bump if changes exist                      │
│     - Fails if release has diverged (no force overwrites)       │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Create release tag and GitHub release                       │
│     - Format: vX.Y.Z (semantic versioning)                      │
│     - Create GitHub release with changelog                      │
│     - Attach release notes                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Re-lock release branch                                      │
│     - Applies branch protection via GitHub API                  │
│     - Verifies lock_branch=true after 2s delay                  │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Create and upload release artifacts                         │
│     - Download build artifacts from validation job              │
│     - Create tar.gz archive                                     │
│     - Upload to GitHub release                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Post-Deployment Verification Job                               │
│  - Wait for Cloudflare Pages deployment (60s)                   │
│  - Check production site accessibility                          │
│  - Verify HTML content                                          │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages detects push to release branch                │
│  - Builds and deploys automatically                             │
└─────────────────────────────────────────────────────────────────┘

⚠️  ON FAILURE: Cleanup step automatically re-locks release branch
```

**Why fast-forward only?** Ensures `release` is always an exact subset of `main` — no merge commits, no divergence, full traceability.

## Prerequisites

- All CI checks passing on `main`
- You have admin access to the repository
- GitHub CLI (`gh`) is authenticated
- Commits follow [conventional commit format](https://www.conventionalcommits.org/) for changelog

## Release Process

### Option 1: GitHub CLI + Web UI (Recommended)

```powershell
# 1. Trigger the release workflow with version bump type
gh workflow run release.yml -f confirm=release -f version_bump=patch

# For minor version bump (new features):
# gh workflow run release.yml -f confirm=release -f version_bump=minor

# For major version bump (breaking changes):
# gh workflow run release.yml -f confirm=release -f version_bump=major

# 2. Get the run ID
$runId = (gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId')
Write-Host "Run ID: $runId"

# 3. Open the run in browser to approve (environment approvals require web UI)
gh run view $runId --web

# 4. After approving in browser, watch the run complete
gh run watch $runId
```

> **Note:** Environment deployment approvals must be done via the GitHub web UI.

### Option 2: GitHub Web UI

1. Go to **Actions** → **Release to Production**
2. Click **Run workflow**
3. Select version bump type (patch/minor/major)
4. Type `release` in the confirmation field
5. Click **Run workflow**
6. If environment protection is enabled, approve the pending deployment

The workflow will:
- Run all quality gates (lint, type check, tests, build)
- Calculate new semantic version
- Generate changelog from conventional commits
- Unlock the `release` branch
- Fast-forward merge from `main`
- Create a tag in format `vX.Y.Z`
- Create GitHub release with changelog
- Attach build artifacts
- Re-lock the `release` branch
- Verify deployment

### Option 3: Manual Release (PowerShell)

If automated workflow fails, perform manual release:

```powershell
# 1. Determine new version
$currentVersion = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "Current version: $currentVersion"

# Manually calculate new version (example for patch bump)
$parts = $currentVersion -split '\.'
$parts[2] = [int]$parts[2] + 1
$newVersion = $parts -join '.'
$newTag = "v$newVersion"

Write-Host "New version: $newVersion"
Write-Host "New tag: $newTag"

# 2. Update package.json
npm version $newVersion --no-git-tag-version

# 3. Unlock release branch
gh api repos/{owner}/{repo}/branches/release/protection -X DELETE

# 4. Fast-forward merge with version commit
git fetch origin
git checkout release
git merge --ff-only origin/main
git add package.json package-lock.json
git commit -m "chore(release): bump version to $newVersion"
git push origin release

# 5. Create tag
git tag $newTag -m "Release $newTag"
git push origin $newTag

# 6. Generate changelog (simplified)
$lastTag = git describe --tags --abbrev=0 HEAD~1 2>$null
$commits = git log "$lastTag..HEAD" --pretty=format:"%s"

# 7. Create GitHub release
gh release create $newTag --title "Release $newTag" --notes "See commits for details" --target release

# 8. Re-lock release branch
gh api repos/{owner}/{repo}/branches/release/protection -X PUT -f lock_branch=true -f enforce_admins=true -f allow_force_pushes=false -f allow_deletions=false
```

## Version Bump Guidelines

Choose the appropriate version bump type based on changes:

- **Patch** (0.0.X): Bug fixes, minor changes, no new features
  - Example: v1.0.0 → v1.0.1
  
- **Minor** (0.X.0): New features, backward-compatible changes
  - Example: v1.0.1 → v1.1.0
  
- **Major** (X.0.0): Breaking changes, major rewrites
  - Example: v1.1.0 → v2.0.0

## Conventional Commit Format

For automatic changelog generation, use conventional commits:

```
feat: add new game mode
fix: correct score calculation
chore: update dependencies
docs: improve README
refactor: simplify card generation
test: add unit tests for validation
ci: update release workflow
```

Format: `<type>: <description>`

Common types:
- `feat`: New features
- `fix`: Bug fixes
- `chore`: Maintenance tasks
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test changes
- `ci`: CI/CD changes

## Tag Format

Tags follow semantic versioning with a `v` prefix:
- Format: `vX.Y.Z` (e.g., v1.0.0, v1.2.3, v2.0.0)
- X = Major version (breaking changes)
- Y = Minor version (new features)
- Z = Patch version (bug fixes)

Examples:
- `v1.0.0` - First major release
- `v1.1.0` - Added new features
- `v1.1.1` - Bug fix release
- `v2.0.0` - Breaking changes

## Cloudflare Pages

The `release` branch is connected to Cloudflare Pages for production deployment. After the release workflow completes, Cloudflare will automatically build and deploy the changes.

## Rollback

If a release has issues, use the rollback workflow:

```powershell
# Trigger rollback to a specific version
gh workflow run rollback.yml -f tag=v1.0.0 -f confirm=rollback

# Get run ID and watch
$runId = (gh run list --workflow=rollback.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $runId
```

See `.github/instructions/production-release.instructions.md` for detailed rollback procedures.
