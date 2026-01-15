---
description: 'Guide for releasing changes from main to production via release branch'
tools:
  - bash
  - github
---

# Release Latest Changes to Production

## Quick Start

**Most Common Path: Automated Release**
```bash
# 1. Trigger release workflow
gh workflow run release.yml -f confirm=release

# 2. Open in browser to approve
gh run list --workflow=release.yml --limit 1 --json url --jq '.[0].url' | xargs open

# 3. Watch progress
gh run watch $(gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId')
```

## Overview

This workflow releases changes from `main` to `release` branch, which triggers Cloudflare Pages production deployment.

**Key Features:**
- ✅ Automated quality gates (lint, type check, tests, build)
- 📅 Date-based versioning (no manual version selection)
- 📝 Auto-generated changelog from conventional commits
- 🔒 Branch protection with safe unlock/lock mechanism
- ✨ Fast-forward only merge (no divergence)

> **For rollback & troubleshooting**: See `.github/instructions/production-release.instructions.md`

## Pre-Flight Checklist

Before triggering a release, ensure:

- [ ] All CI checks passing on `main` branch
- [ ] Recent commits follow [conventional commit format](https://www.conventionalcommits.org/)
- [ ] You have admin access to trigger production deployments
- [ ] GitHub CLI (`gh`) is authenticated (for CLI method)

## Release Workflow

The automated workflow handles:

1. **Quality Gates** - Runs lint, type check, tests, and build
2. **Version Calculation** - Auto-calculates date-based version (YY.MDD.REV)
3. **Changelog Generation** - Extracts commits since last tag, groups by type
4. **Branch Management** - Safely unlocks, merges, and re-locks `release` branch
5. **GitHub Release** - Creates tag and release with changelog + artifacts
6. **Deployment** - Cloudflare Pages auto-deploys from `release` branch
7. **Verification** - Validates production site is accessible

**Flow:**
```
Trigger → Validate → Approve → Version → Merge → Tag → Deploy → Verify
```

**Safety:** Fast-forward only merge ensures `release` is always a subset of `main` (no divergence).

## Release Methods

### Method 1: GitHub CLI (Recommended)

**For PowerShell:**
```powershell
# Trigger release
gh workflow run release.yml -f confirm=release

# Get run ID and open in browser for approval
$runId = (gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view $runId --web

# After approving, watch progress
gh run watch $runId
```

**For Bash/Zsh:**
```bash
# Trigger release
gh workflow run release.yml -f confirm=release

# Get run URL and open for approval
gh run list --workflow=release.yml --limit 1 --json url --jq '.[0].url' | xargs open  # macOS
# OR: xdg-open $(gh run list --workflow=release.yml --limit 1 --json url --jq '.[0].url')  # Linux

# Watch progress
gh run watch $(gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId')
```

> **Note:** Environment deployment approvals must be done via the GitHub web UI.

### Method 2: GitHub Web UI

1. Navigate to **Actions** → **Release to Production**
2. Click **Run workflow** dropdown
3. Enter `release` in the confirmation field
4. Click green **Run workflow** button
5. When workflow pauses, click **Review deployments** to approve
6. Watch workflow progress in the Actions tab

### Method 3: Manual Release (Emergency Only)

If the automated workflow fails repeatedly, perform manual release:

```bash
# 1. Calculate version
YEAR=$(date -u +"%y")
MONTH=$(date -u +"%-m")
DAY=$(date -u +"%d")
MDD="${MONTH}${DAY}"
TAG_PREFIX="${YEAR}.${MDD}."

# Find highest revision for today
LATEST_REV=$(git tag -l "${TAG_PREFIX}*" | sed "s/${TAG_PREFIX}//" | sort -n | tail -1)
REV=$((LATEST_REV + 1))
VERSION="${YEAR}.${MDD}.${REV}"

echo "New version: $VERSION"

# 2. Unlock release branch (requires admin access)
gh api repos/{owner}/{repo}/branches/release/protection -X DELETE

# 3. Fast-forward merge
git fetch origin
git checkout release
git merge --ff-only origin/main

# 4. Update version and commit
npm version $VERSION --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): bump version to $VERSION"
git push origin release

# 5. Create tag and release
git tag $VERSION -m "Release $VERSION"
git push origin $VERSION
gh release create $VERSION --title "Release $VERSION" --generate-notes --target release

# 6. Re-lock release branch
gh api repos/{owner}/{repo}/branches/release/protection -X PUT \
  -f lock_branch=true -f enforce_admins=true \
  -f allow_force_pushes=false -f allow_deletions=false
```

## Date-Based Versioning

Versions follow the format: **`YY.MDD.REV`**

- **YY** = 2-digit year (e.g., 26 for 2026)
- **M** = Month (1-12, no leading zero)
- **DD** = Day (01-31, with leading zero)
- **REV** = Revision (0-based, increments for same-day releases)

**Examples:**
```
26.101.0   → First release on January 1, 2026
26.111.0   → First release on January 11, 2026
26.111.1   → Second release on January 11, 2026
26.1101.0  → First release on November 1, 2026
26.1231.0  → First release on December 31, 2026
```

**Benefits:**
- 📅 No manual version selection
- 📊 Chronologically sortable
- 🔍 Easy to identify release date
- 🔄 Supports multiple releases per day

## Conventional Commits

For automatic changelog generation, commits should follow this format:

```
<type>: <description>

[optional body]
```

**Common Types:**
- `feat:` - New features
- `fix:` - Bug fixes  
- `chore:` - Maintenance tasks
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `ci:` - CI/CD changes

**Examples:**
```bash
git commit -m "feat: add multiplayer game mode"
git commit -m "fix: correct score calculation bug"
git commit -m "chore: update dependencies"
git commit -m "docs: improve setup instructions"
```

The changelog groups commits by type and formats them automatically.

## Post-Deployment Verification

After deployment completes, verify these key areas:

**Quick Checks:**
```bash
# Check site is accessible
curl -I https://gametime-bingo.pages.dev

# Check if game loads
curl https://gametime-bingo.pages.dev | grep -q "Bingo" && echo "✅ Site OK" || echo "❌ Site Issue"
```

**Manual Verification:**
- [ ] Production site loads (https://gametime-bingo.pages.dev)
- [ ] No console errors in browser DevTools
- [ ] Home page renders correctly
- [ ] Can create a new game
- [ ] Can join existing game via URL
- [ ] P2P connection establishes between players

**GitHub Verification:**
- [ ] Build artifacts attached to release
- [ ] Changelog shows correct commits
- [ ] Tag created with correct version

## Troubleshooting

### Common Issues

**Fast-Forward Merge Failed**
```
Error: fatal: Not possible to fast-forward, aborting.
```
**Cause:** `release` branch has diverged from `main`  
**Fix:** Reset release to match main (⚠️ discards release-only commits):
```bash
git checkout release
git reset --hard origin/main
git push --force origin release
```

**Branch Protection API Errors**
```
Error: Resource not accessible by integration
```
**Cause:** Token lacks required permissions  
**Fix:**
1. Check token has `repo` scope in Settings → Developer settings → Personal access tokens
2. Manually unlock via Settings → Branches → release → Edit
3. Complete release manually
4. Manually re-lock the branch

**Version Bump Failed**
```
Error: npm version failed
```
**Cause:** Version already exists or package.json corrupted  
**Fix:**
```bash
# Check current version
npm pkg get version

# Manually update package.json version
npm version 26.115.0 --no-git-tag-version
npm install  # Update package-lock.json
git add package.json package-lock.json
git commit -m "chore: bump version"
```

**Deployment Not Triggering**
**Cause:** Cloudflare Pages not watching `release` branch  
**Fix:**
1. Go to Cloudflare Pages dashboard
2. Select gametime-bingo project
3. Settings → Builds & deployments → Production branch
4. Verify it's set to `release`

### Rollback Procedures

See `.github/instructions/production-release.instructions.md` for detailed rollback procedures.

**Quick Rollback (Cloudflare Dashboard):**
1. Go to Cloudflare Pages dashboard
2. Select gametime-bingo project
3. Find previous successful deployment
4. Click "Retry deployment"

**Code Rollback (Git):**
```bash
# Identify last good commit
git log --oneline release

# Create revert branch
git checkout -b revert/bad-release main
git revert <bad-commit-hash>

# Create PR, merge, then trigger new release
```
