# Release Latest Changes to Production

## Overview

This prompt guides the release of changes from `main` to the `release` branch for Cloudflare Pages deployment.

## How the Release Workflow Works

The release workflow automates deploying code from `main` to production:

```
┌─────────────────────────────────────────────────────────────────┐
│  User triggers workflow (gh workflow run / Actions UI)          │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Environment approval gate (if production environment exists)   │
│  - Workflow pauses and waits for reviewer approval              │
│  - Prevents unauthorized releases                               │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Unlock release branch                                       │
│     - Removes branch protection via GitHub API                  │
│     - Checks HTTP status (404 = skip, 200 = delete, else fail)  │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Fast-forward merge                                          │
│     - git merge --ff-only origin/main                           │
│     - Fails if release has diverged (no force overwrites)       │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Create release tag                                          │
│     - Format: yy.mdd.rev (e.g., 26.114.0)                       │
│     - Auto-increments revision for same-day releases            │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Re-lock release branch                                      │
│     - Applies branch protection via GitHub API                  │
│     - Verifies lock_branch=true after 2s delay                  │
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
- Unlock the `release` branch
- Fast-forward merge from `main`
- Create a tag in format `yy.mdd.rev`
- Re-lock the `release` branch

### Option 3: Manual Release (PowerShell)

```powershell
# 1. Unlock release branch
gh api repos/{owner}/{repo}/branches/release/protection -X DELETE

# 2. Fast-forward merge
git fetch origin
git checkout release
git merge --ff-only origin/main
git push origin release

# 3. Create tag (format: yy.mdd.rev)
$year = Get-Date -Format "yy"
$monthDay = (Get-Date).Month.ToString() + (Get-Date -Format "dd")
$datePrefix = "$year.$monthDay"

# Find next revision number (sort by numeric revision to handle 10+ releases/day)
$existingTags = git tag -l "$datePrefix.*" | Sort-Object { [int]($_ -split '\.')[-1] } | Select-Object -Last 1
if ($existingTags) {
    $lastRev = [int]($existingTags -replace "$datePrefix\.", "")
    $rev = $lastRev + 1
} else {
    $rev = 0
}

$newTag = "$datePrefix.$rev"
git tag $newTag
git push origin $newTag

# 4. Re-lock release branch
gh api repos/{owner}/{repo}/branches/release/protection -X PUT -f lock_branch=true -f enforce_admins=true -f allow_force_pushes=false -f allow_deletions=false
```

## Tag Format

Tags follow the format `{yy}.{mdd}.{rev}`:
- `yy` - Two-digit year
- `m` - Month (1-12, no leading zero)
- `dd` - Day (01-31, always zero-padded)
- `rev` - Revision number starting at 0

The format is unambiguous because the day is always 2 digits. Parse from right: last 2 chars = day, remaining = month.

Examples:
- `26.114.0` - January 14, 2026 (m=1, dd=14), first release
- `26.114.1` - January 14, 2026, second release
- `26.1104.0` - November 4, 2026 (m=11, dd=04), first release
- `26.1231.0` - December 31, 2026, first release

## Cloudflare Pages

The `release` branch is connected to Cloudflare Pages for production deployment. After the release workflow completes, Cloudflare will automatically build and deploy the changes.
