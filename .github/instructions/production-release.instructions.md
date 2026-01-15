---
description: 'Production release workflow and deployment guidelines'
applyTo: '.github/workflows/*.yml, .github/prompts/release*.md'
---

# Production Release Instructions

Reference for release standards, rollback, and troubleshooting.

> **For release execution**: See `.github/prompts/release.latest.prompt.md`

## Release Philosophy

- **Ship small**: Frequent small releases are safer than big bang releases
- **Fast-forward only**: Release branch is always an exact subset of main
- **Quick rollback**: Always have a way to revert quickly

## Post-Deployment Verification

After deployment completes, verify:

- [ ] Production site loads correctly
- [ ] No errors in browser console
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

```powershell
# WARNING: This discards any release-only commits
git checkout release
git reset --hard origin/main
git push --force origin release
```

### Branch Protection API Errors

1. Check GitHub token permissions (needs `repo` scope)
2. Manually unlock via GitHub Settings → Branches → release → Edit
3. Complete release manually (see prompt for steps)
4. Manually re-lock the branch
