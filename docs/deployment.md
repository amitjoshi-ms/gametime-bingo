# Deployment Guide

This guide covers deploying Gametime Bingo to production and managing releases.

## 🌐 Production Deployment

### Current Deployment

**Production URL**: [https://gametime-bingo.pages.dev](https://gametime-bingo.pages.dev)

**Platform**: Cloudflare Pages  
**Branch**: `release`  
**Auto-deploy**: Yes (on push to release branch)

### Cloudflare Pages Configuration

The project is configured for zero-config deployment:

| Setting | Value |
|---------|-------|
| **Framework** | Vite (auto-detected) |
| **Build command** | `npm run build` |
| **Output directory** | `dist/` |
| **Node version** | 22.x |
| **Branch** | `release` |

No environment variables or secrets are required for deployment.

## 🚀 Release Process

### Overview

Gametime Bingo uses a **manual release workflow** with automated validation:

1. Develop on feature branches
2. Merge to `main` via Pull Requests
3. Trigger manual release workflow
4. Automated validation, versioning, and deployment

### Release Workflow

#### Step 1: Prepare Release

Ensure `main` branch is ready:

```bash
# On main branch
git checkout main
git pull origin main

# Verify all checks pass
npm ci
npm run lint
npm run check
npm test
npm run build
```

#### Step 2: Trigger Release

Go to GitHub Actions and trigger the release workflow:

1. Navigate to **Actions** tab
2. Select **Release to Production** workflow
3. Click **Run workflow**
4. Type `release` to confirm
5. Click **Run workflow** button

**GitHub Actions URL**: https://github.com/amitjoshi-ms/gametime-bingo/actions/workflows/release.yml

#### Step 3: Automated Steps

The workflow automatically:

1. **Validates**: Runs linting, type checking, tests, build
2. **Versions**: Calculates date-based version (`YY.MDD.REV`)
3. **Fast-forwards**: Merges `main` → `release` (fast-forward only)
4. **Updates**: Bumps `package.json` version
5. **Tags**: Creates Git tag and GitHub release
6. **Uploads**: Attaches build artifacts to release
7. **Deploys**: Cloudflare auto-deploys from `release` branch
8. **Verifies**: Checks production site health

#### Step 4: Verify Deployment

After workflow completes (~2-3 minutes):

1. **Check workflow status**: Should show ✅ green checkmark
2. **Visit production**: [https://gametime-bingo.pages.dev](https://gametime-bingo.pages.dev)
3. **Test core flows**:
   - Create a game
   - Join from another browser/device
   - Play a few turns
   - Verify P2P sync works
4. **Check browser console**: Should be error-free
5. **Verify GitHub release**: View at https://github.com/amitjoshi-ms/gametime-bingo/releases

### Version Numbers

**Format**: `YY.MDD.REV`

- `YY`: 2-digit year (e.g., `26` for 2026)
- `M`: Month without leading zero (e.g., `1` for January, `12` for December)
- `DD`: Day with leading zero (e.g., `01`, `16`, `31`)
- `REV`: Revision number (0-based, increments for multiple releases on same day)

**Examples**:
- `26.116.0` = January 16, 2026, first release of the day
- `26.116.1` = January 16, 2026, second release of the day
- `26.1231.0` = December 31, 2026, first release of the day

**Why date-based?**
- No need to manually bump versions
- Instant context on release date
- Simplified for small projects

## 🏗️ Build Process

### Local Build

```bash
# Clean build
rm -rf dist/ node_modules/
npm install
npm run build

# Preview locally
npm run preview
# Opens at http://localhost:4173
```

### Build Output

```
dist/
├── index.html           # Entry HTML file
├── assets/
│   ├── index-[hash].js  # Application bundle
│   ├── index-[hash].css # Styles
│   └── ...              # Other assets
└── ...
```

**Bundle sizes** (approximate):
- JavaScript: ~50KB gzipped
- CSS: ~5KB gzipped
- Total: ~55KB gzipped

### Build Optimizations

Vite automatically applies:
- **Tree shaking**: Removes unused code
- **Minification**: Compresses JS/CSS
- **Code splitting**: Separates vendor chunks
- **Asset optimization**: Optimizes images/fonts
- **Hashing**: Cache busting with content hashes

## 🔄 Rollback Procedures

### Quick Rollback (Cloudflare Dashboard)

For immediate rollback without GitHub Actions:

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
2. Select **gametime-bingo** project
3. Go to **Deployments** tab
4. Find the last known good deployment
5. Click **⋯** (three dots) → **Rollback to this deployment**
6. Confirm rollback

**Recovery time**: ~1 minute

### Git Rollback (Code-Level Revert)

When you need to revert code changes:

```bash
# 1. Identify the problematic commit
git log --oneline release

# 2. Create revert branch from main
git checkout main
git pull origin main
git checkout -b revert/bad-release

# 3. Revert the commit(s)
git revert <commit-hash>

# 4. Push and create PR
git push origin revert/bad-release

# 5. After PR merged, trigger new release
# (Follow normal release process)
```

### Rollback Checklist

After rollback:

- [ ] Verify production site loads correctly
- [ ] Test core game flows (create, join, play)
- [ ] Check browser console for errors
- [ ] Update GitHub issue if rollback was due to a bug
- [ ] Communicate rollback to team

## 🩺 Post-Deployment Verification

### Automated Checks

The release workflow automatically verifies:
- Site returns HTTP 200
- HTML content is valid
- Assets load correctly

### Manual Verification

Perform these manual checks:

**1. Basic Functionality**
- [ ] Home page loads
- [ ] "Create Game" works
- [ ] Room code is generated
- [ ] Can share room URL

**2. Multiplayer**
- [ ] Join game with room code
- [ ] Players see each other in lobby
- [ ] Host can start game
- [ ] Turn-based gameplay works
- [ ] Numbers are marked correctly
- [ ] Win condition triggers

**3. UI/UX**
- [ ] No layout issues
- [ ] Buttons are clickable
- [ ] Responsive design works on mobile
- [ ] No console errors or warnings

**4. Performance**
- [ ] Page load time < 3 seconds
- [ ] P2P connection establishes < 5 seconds
- [ ] Smooth animations and transitions

### Health Check Script

```bash
# Quick health check
PROD_URL="https://gametime-bingo.pages.dev"

# Check if site is up
curl -I $PROD_URL

# Check for HTML content
curl -s $PROD_URL | grep -q "<!DOCTYPE html>" && echo "✅ HTML OK" || echo "❌ HTML FAIL"

# Check assets load
curl -I $PROD_URL/assets/ | grep -q "200" && echo "✅ Assets OK" || echo "⚠️  Assets check failed"
```

## 🐛 Troubleshooting

### Deployment Failed

**Symptom**: Cloudflare Pages deployment fails

**Solutions**:
1. Check Cloudflare Pages build logs
2. Verify `package.json` scripts are correct
3. Ensure `dist/` directory is created by build
4. Check Node.js version compatibility (should be 22.x)

### Site Shows Old Version

**Symptom**: Production shows old code after deployment

**Solutions**:
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check Cloudflare deployment status (should show latest commit)
4. Wait 1-2 minutes for CDN propagation

### Release Workflow Failed

**Symptom**: GitHub Actions workflow fails

**Common causes**:
1. **Fast-forward merge failed**: `release` branch diverged from `main`
   - Solution: Reset release branch
   ```bash
   git checkout release
   git reset --hard origin/main
   git push --force origin release
   ```

2. **Tests failed**: Code has bugs
   - Solution: Fix bugs on `main`, then re-run release

3. **Branch protection error**: API authentication issue
   - Solution: Check GitHub token permissions
   - Manually unlock/lock branch if needed

### P2P Connection Issues in Production

**Symptom**: Players can't connect to each other

**Solutions**:
1. Verify WebTorrent trackers are accessible
2. Check browser console for WebRTC errors
3. Test with different browsers
4. Ensure CORS is not blocking connections
5. Check if users are behind restrictive firewalls

### Performance Issues

**Symptom**: Slow load times or laggy UI

**Solutions**:
1. Check Cloudflare Analytics for traffic patterns
2. Verify bundle sizes haven't grown excessively
3. Run Lighthouse audit
4. Check for console errors indicating runtime issues

## 📊 Monitoring

### Cloudflare Analytics

Access at: https://dash.cloudflare.com → gametime-bingo → Analytics

**Metrics to monitor**:
- **Requests**: Traffic volume
- **Bandwidth**: Data transfer
- **Status codes**: Error rates (4xx, 5xx)
- **Performance**: Load times

### GitHub Actions

Monitor workflow runs at: https://github.com/amitjoshi-ms/gametime-bingo/actions

**Key metrics**:
- Workflow success rate
- Build duration
- Test pass rate

### Browser Console

For user-reported issues:
1. Ask user to open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application → Storage for localStorage issues

## 🔐 Secrets & Configuration

### Repository Secrets

Required secrets (configured in GitHub Settings → Secrets):

| Secret | Purpose | Where Used |
|--------|---------|------------|
| `GITHUB_TOKEN` | Automatic (GitHub provides) | Release workflow |
| `PRODUCTION_URL` | Site health checks | Verify job (optional) |

**PRODUCTION_URL** is optional. If not set, verification step will fail but won't block deployment.

### Cloudflare Configuration

No secrets needed! Cloudflare Pages auto-detects:
- Framework (Vite)
- Build command (`npm run build`)
- Output directory (`dist/`)

## 🔄 Environment Workflow

```
Feature Branch → main (dev) → release (production)
     ↓             ↓                ↓
  Local Dev    CI/CD Tests    Cloudflare Pages
```

**Branches**:
- `main`: Development branch (default)
- `release`: Production branch (protected, fast-forward only)
- Feature branches: `feature/*`, `fix/*`, etc.

**Protection Rules**:
- `main`: Requires PR reviews, CI checks must pass
- `release`: Can only be fast-forwarded from `main`

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Release Workflow Source](/.github/workflows/release.yml)
- [Production Instructions](/.github/instructions/production-release.instructions.md)

## 🚨 Emergency Contacts

For critical production issues:

1. **Rollback immediately** using Cloudflare dashboard
2. **Create incident issue** on GitHub with `critical` label
3. **Notify team** via your communication channel
4. **Document the issue** for post-mortem

Remember: **Rollback first, debug later!** User experience is the priority.
