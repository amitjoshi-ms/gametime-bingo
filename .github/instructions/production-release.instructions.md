---
description: 'Production release workflow and deployment guidelines'
applyTo: '.github/workflows/*.yml, .github/prompts/release*.md'
---

# Production Release Instructions

Guidelines for safely releasing changes to production.

## Release Philosophy

- **Ship small**: Frequent small releases are safer than big bang releases
- **Automate everything**: Manual steps are error-prone
- **Verify before merge**: All changes must pass CI and code review
- **Quick rollback**: Always have a way to revert quickly

## Branch Strategy

```
main        ─────●─────●─────●─────●─────►  (protected, squash only)
                 │     │     │     │
release     ─────●─────●─────●─────●─────►  (production, fast-forward only)
                 │     │     │     │
feature/x   ─────●     │     │     │
feature/y   ───────────●     │     │
fix/z       ─────────────────●     │
```

## Release Process

### Prerequisites

- [ ] All CI checks pass on `main`
- [ ] Code review approved (Copilot + human if required)
- [ ] No unresolved review comments
- [ ] Branch is up to date with `main`

### Automated Release Workflow

The release workflow (`.github/workflows/release.yml`) handles:

1. **Unlock** release branch (temporarily remove protection)
2. **Fast-forward merge** from `main` to `release`
3. **Create tag** with format `YY.MDD.REV` (e.g., `26.0114.1`)
4. **Re-lock** release branch
5. **Cleanup** on failure (re-lock branch if error occurs)

### Manual Release Steps

If automation fails, follow these steps:

```bash
# 1. Ensure main is up to date
git checkout main
git pull

# 2. Verify CI passes
gh run list --branch main --limit 1

# 3. Check out release branch
git checkout release
git pull

# 4. Fast-forward merge
git merge --ff-only origin/main

# 5. Create tag
TAG="$(date +%y.%m%d).1"
git tag -a "$TAG" -m "Release $TAG"

# 6. Push release and tag
git push origin release
git push origin "$TAG"
```

## Deployment

### Cloudflare Pages

- **Preview**: Automatic on every PR
- **Production**: Automatic when `release` branch is updated
- **Rollback**: Redeploy previous commit via Cloudflare dashboard

### Deployment Verification

After deployment:

1. Check Cloudflare Pages deployment status
2. Verify production site loads correctly
3. Test critical user flows:
   - [ ] Home page loads
   - [ ] Create game works
   - [ ] Join game works
   - [ ] P2P connection establishes

## Version Numbering

Format: `YY.MDD.REV`

- `YY`: Two-digit year (e.g., `26` for 2026)
- `M`: Month without leading zero (e.g., `1` for January)
- `DD`: Two-digit day (e.g., `14`)
- `REV`: Revision number for same day (starts at `1`)

Examples:
- First release on Jan 14, 2026: `26.0114.1`
- Second release same day: `26.0114.2`
- Release on Feb 3, 2026: `26.0203.1`

## Rollback Procedure

### Quick Rollback (Cloudflare)

1. Go to Cloudflare Pages dashboard
2. Select gametime-bingo project
3. Find previous successful deployment
4. Click "Retry deployment"

### Git Rollback

```bash
# 1. Identify last good commit
git log --oneline release

# 2. Create revert branch
git checkout -b revert/bad-release main

# 3. Revert the problematic commit(s)
git revert <commit-hash>

# 4. Create PR and merge via normal process
```

## Hotfix Process

For urgent production fixes:

1. **Create hotfix branch** from `main`
   ```bash
   git checkout -b hotfix/critical-bug main
   ```

2. **Make minimal fix** - only fix the issue, no other changes

3. **Test locally** - verify fix works

4. **Fast-track review** - request expedited review

5. **Merge and release** - follow normal release process

## Release Checklist

Before releasing:

- [ ] CI pipeline passes (lint, type check, unit tests, E2E)
- [ ] Code review approved
- [ ] No `console.log` debugging statements
- [ ] No hardcoded development URLs
- [ ] Bundle size is acceptable
- [ ] No new security vulnerabilities

After releasing:

- [ ] Production deployment successful
- [ ] Site loads correctly
- [ ] Critical flows work
- [ ] No errors in browser console
- [ ] Monitoring shows no issues

## Environment Configuration

### Development
- URL: `http://localhost:5173`
- P2P: Uses Trystero default STUN/TURN

### Preview (PR)
- URL: `https://<hash>.gametime-bingo.pages.dev`
- P2P: Uses Trystero default STUN/TURN

### Production
- URL: Production domain
- P2P: Uses Trystero default STUN/TURN

## Monitoring

### What to Watch

- Cloudflare Pages deployment status
- Browser console errors (via real user monitoring if available)
- P2P connection success rates

### Alert Response

If issues are detected:

1. Assess severity (blocking vs non-blocking)
2. If blocking: Initiate rollback
3. Create issue to track
4. Investigate root cause
5. Create fix and follow hotfix process
