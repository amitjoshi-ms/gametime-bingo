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
│  1. Determine version (date-based versioning)                   │
│     - Format: YY.MDD.REV (year, month+day, revision)            │
│     - Auto-calculated from current date                         │
│     - Revision increments for same-day releases                 │
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
│     - Format: YY.MDD.REV (date-based versioning)                │
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
# 1. Trigger the release workflow
gh workflow run release.yml -f confirm=release

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
3. Type `release` in the confirmation field
4. Click **Run workflow**
5. If environment protection is enabled, approve the pending deployment

The workflow will:
- Run all quality gates (lint, type check, tests, build)
- Calculate date-based version (YY.DDD.REV)
- Generate changelog from conventional commits
- Unlock the `release` branch
- Fast-forward merge from `main`
- Create a tag in format `YY.DDD.REV`
- Create GitHub release with changelog
- Attach build artifacts
- Re-lock the `release` branch
- Verify deployment

### Option 3: Manual Release (PowerShell)

If automated workflow fails, perform manual release:

```powershell
# 1. Determine new version (date-based: YY.MDD.REV)
$year = (Get-Date).ToString("yy")
$month = (Get-Date).Month
$day = (Get-Date).ToString("dd")
$mdd = "$month$day"

# Find existing tags for today to determine revision
$tagPrefix = "$year.$mdd."
$existingTags = git tag -l "$tagPrefix*"
$rev = 0
if ($existingTags) {
    $maxRev = $existingTags | ForEach-Object { [int]($_ -replace $tagPrefix, '') } | Measure-Object -Maximum
    $rev = $maxRev.Maximum + 1
}

$newVersion = "$year.$mdd.$rev"
$newTag = $newVersion

Write-Host "New version: $newVersion"
Write-Host "New tag: $newTag"

# 2. Unlock release branch
gh api repos/{owner}/{repo}/branches/release/protection -X DELETE

# 3. Fast-forward merge main to release
git fetch origin
git checkout release
git merge --ff-only origin/main

# 4. Update package.json on release branch and commit
npm version $newVersion --no-git-tag-version
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

## Date-Based Versioning

Versions are automatically calculated based on the current date:

- **Format**: `YY.MDD.REV`
  - `YY` = 2-digit year (e.g., 26 for 2026)
  - `M` = Month (1-12, no leading zero)
  - `DD` = Day of month (01-31, with leading zero)
  - `REV` = Revision number (0-based, increments for same-day releases)

**Examples:**
- `26.101.0` - First release on January 1, 2026
- `26.111.0` - First release on January 11, 2026
- `26.111.1` - Second release on January 11, 2026
- `26.1101.0` - First release on November 1, 2026
- `26.1111.0` - First release on November 11, 2026

**Benefits:**
- No manual version selection needed
- Releases are naturally ordered chronologically
- Easy to identify when a release was made (month and day are readable)
- Supports multiple releases per day via revision number

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

Tags use date-based versioning without a prefix:
- Format: `YY.MDD.REV` (e.g., 26.101.0, 26.111.0, 26.1101.0)
- YY = 2-digit year
- M = Month (1-12, no leading zero)
- DD = Day of month (01-31, with leading zero)
- REV = Revision for same-day releases (starts at 0)

Examples:
- `26.101.0` - First release on January 1, 2026
- `26.111.0` - First release on January 11, 2026
- `26.111.1` - Second release on January 11, 2026
- `26.1101.0` - First release on November 1, 2026
- `26.1111.0` - First release on November 11, 2026

## Cloudflare Pages

The `release` branch is connected to Cloudflare Pages for production deployment. After the release workflow completes, Cloudflare will automatically build and deploy the changes.

## Rollback

If a release has issues, use Cloudflare Dashboard for immediate rollback:

1. Go to Cloudflare Pages dashboard
2. Select gametime-bingo project  
3. Find previous successful deployment
4. Click "Retry deployment"

See `.github/instructions/production-release.instructions.md` for detailed rollback procedures.
