---
description: 'Production release workflow and deployment guidelines'
applyTo: '.github/workflows/*.yml, .github/prompts/release*.md'
---

# Production Release Instructions

Guidelines for safely releasing changes to production.

> **Modularity**: This file defines release *standards and procedures*.
> - For step-by-step execution: `.github/prompts/release.latest.prompt.md`
> - For workflow implementation: `.github/workflows/release.yml`

## Release Philosophy

- **Ship small**: Frequent small releases are safer than big bang releases
- **Automate everything**: Manual steps are error-prone
- **Verify before merge**: All changes must pass CI and code review
- **Quick rollback**: Always have a way to revert quickly
- **Fast-forward only**: Release branch is always an exact subset of main

## Branch Strategy

```
main        ─────●─────●─────●─────●─────►  (protected, squash merges from PRs)
                 │     │     │     │
release     ─────●─────●─────●─────●─────►  (locked, fast-forward only from main)
                 │     │     │     │        (triggers Cloudflare production deploy)
feature/x   ─────●     │     │     │
```

**Why fast-forward only?** Ensures `release` is always an exact subset of `main` — no merge commits, no divergence, full traceability.

## Version Numbering

Format: `yy.mdd.rev`

| Part | Description | Example |
|------|-------------|---------|
| `yy` | Two-digit year | `26` for 2026 |
| `m` | Month (1-12, no leading zero) | `1` for January |
| `dd` | Day (01-31, always zero-padded) | `14` |
| `rev` | Revision number (starts at 0) | `0`, `1`, `2`... |

Examples:
- `26.114.0` — January 14, 2026, first release
- `26.114.1` — January 14, 2026, second release
- `26.1104.0` — November 4, 2026, first release

**Parsing**: Day is always 2 digits. Read from right: last 2 chars = day, remaining = month.

## Release Prerequisites

Before triggering a release:

- [ ] All CI checks pass on `main` (lint, type check, unit tests, E2E)
- [ ] Code review approved (Copilot + human if required)
- [ ] No unresolved review comments
- [ ] `main` branch is up to date
- [ ] No `console.log` debugging statements
- [ ] No hardcoded development URLs

## Automated Release Workflow

The workflow (`.github/workflows/release.yml`) executes:

1. **Environment approval** — Waits for authorized reviewer (web UI required)
2. **Unlock** — Removes branch protection from `release`
3. **Fast-forward merge** — `git merge --ff-only origin/main`
4. **Create tag** — Format `yy.mdd.rev`, auto-increments revision
5. **Re-lock** — Applies branch protection with `lock_branch=true`
6. **Cleanup on failure** — Re-locks branch if any step fails

Trigger via:
```powershell
gh workflow run release.yml -f confirm=release
```

See `.github/prompts/release.latest.prompt.md` for detailed execution options.

## Deployment

### Cloudflare Pages

| Environment | Trigger | URL |
|-------------|---------|-----|
| Preview | PR opened/updated | `https://<hash>.gametime-bingo.pages.dev` |
| Production | `release` branch updated | Production domain |

### Post-Deployment Verification

After deployment completes:

- [ ] Production site loads correctly
- [ ] No errors in browser console
- [ ] Critical flows work:
  - [ ] Home page loads
  - [ ] Create game works
  - [ ] Join game works
  - [ ] P2P connection establishes

## Rollback Procedures

### Quick Rollback (Cloudflare Dashboard)

For immediate rollback without code changes:

1. Go to Cloudflare Pages dashboard
2. Select gametime-bingo project
3. Find previous successful deployment
4. Click "Retry deployment"

### Git Rollback (Code-Level Fix)

When you need to revert code:

```powershell
# 1. Identify last good commit
git log --oneline release

# 2. Create revert branch from main
git checkout -b revert/bad-release main

# 3. Revert the problematic commit(s)
git revert <commit-hash>

# 4. Create PR and merge via normal process, then trigger release
```

## Hotfix Process

For urgent production fixes:

1. **Create hotfix branch** from `main`:
   ```powershell
   git checkout -b hotfix/critical-bug main
   ```

2. **Make minimal fix** — Only fix the issue, no other changes

3. **Test locally** — Verify fix works

4. **Fast-track review** — Request expedited review, note urgency in PR

5. **Merge and release** — Follow normal PR workflow, then trigger release

## Troubleshooting

### Fast-Forward Merge Failed

If the release workflow fails with "Fast-forward merge failed":

```powershell
# This means release has diverged from main (shouldn't happen normally)
# WARNING: This discards any release-only commits
git checkout release
git reset --hard origin/main
git push --force origin release
```

### Branch Protection API Errors

If unlock/lock fails:

1. Check GitHub token permissions (needs `repo` scope)
2. Manually unlock via GitHub Settings → Branches → release → Edit
3. Complete release manually (see prompt for steps)
4. Manually re-lock the branch
