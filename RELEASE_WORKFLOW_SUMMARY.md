# Release Workflow Revamp - Summary

## Overview

The release workflow has been completely revamped to address all requirements from the issue. This document summarizes the changes and provides validation guidance.

## Changes Made

### 1. New Release Workflow (`release.yml`)

**Previous Workflow:**
- Date-based versioning (e.g., `26.114.0`)
- No pre-release validation
- No changelog generation
- No artifact handling
- Basic branch management

**New Workflow:**
- ✅ Date-based versioning (e.g., `26.114.0`) - auto-calculated
- ✅ Pre-release validation job (lint, type check, tests, build)
- ✅ Automatic changelog generation from conventional commits
- ✅ Build artifact creation and upload to GitHub releases
- ✅ Post-deployment verification
- ✅ Enhanced error handling and cleanup
- ✅ Secure secret handling (no hardcoded URLs)

**Workflow Jobs:**

1. **validate** - Pre-release quality gates
   - Install dependencies
   - Run linter (`npm run lint`)
   - Run type check (`npm run check`)
   - Run unit tests (`npm run test`)
   - Build application (`npm run build`)
   - Upload build artifacts

2. **release** - Main release process
   - Determine new date-based version (YY.MDD.REV)
   - Generate changelog from commits
   - Unlock release branch
   - Fast-forward merge from main
   - Update package.json version (on release branch)
   - Create release tag and GitHub release
   - Lock release branch
   - Download and archive build artifacts
   - Upload artifacts to release

3. **verify** - Post-deployment verification
   - Wait for Cloudflare deployment
   - Check production site accessibility
   - Verify HTML content

### 2. Updated Documentation

**production-release.instructions.md:**
- Added semantic versioning principles
- Added quality gates philosophy
- Enhanced post-deployment verification checklist
- Expanded troubleshooting section

**release.latest.prompt.md:**
- Updated workflow diagram
- Added version bump guidelines
- Added conventional commit format guide
- Updated tag format to semantic versioning
- Added rollback instructions

## Acceptance Criteria Met

- ✅ **Releases are automated and consistent**
  - Pre-release validation ensures quality
  - Automated version bumping
  - Consistent workflow execution

- ✅ **Version numbers follow date-based versioning**
  - Format: `YY.MDD.REV` (26.114.0)
  - Auto-calculated from current date
  - Revision increments for same-day releases

- ✅ **Changelog is generated automatically**
  - Extracts commits since last release
  - Groups by type (feat, fix, chore, etc.)
  - Uses conventional commit format
  - Included in GitHub release notes

- ✅ **Deployment is reliable with proper checks**
  - Pre-release validation (lint, tests, build)
  - Post-deployment verification
  - Error handling and cleanup
  - Environment protection gates

- ✅ **Aligned with production-release.instructions.md guidelines**
  - Fast-forward only merges
  - Branch protection management
  - Quick rollback capabilities
  - Documentation updates

## How to Use

### Triggering a Release

**Via GitHub CLI:**
```powershell
# Trigger release (version is auto-calculated from date)
gh workflow run release.yml -f confirm=release
```

**Via GitHub UI:**
1. Go to Actions → Release to Production
2. Click "Run workflow"
3. Type "release" to confirm
4. Click "Run workflow"
5. Approve production environment deployment when prompted

## Testing Recommendations

Since this is a workflow change, testing in a live environment is recommended:

1. **Test on a fork or test repository first**
   - Create a test repository with similar structure
   - Test the workflow with different version bump types
   - Verify changelog generation

2. **Verify pre-release validation**
   - Ensure all checks run correctly
   - Verify build artifacts are created
   - Check artifact upload to release

3. **Document any issues**
   - Note any environment-specific configurations needed
   - Update documentation as needed

## Migration Notes

### Required Configuration

Before first use, configure the following repository secret:

1. **PRODUCTION_URL** - Your production site URL (required for deployment verification)
   - Example: `https://gametime-bingo.pages.dev`
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `PRODUCTION_URL`
   - Value: Your actual production URL

   > **Note**: This secret should also be documented in the main README.md for new contributors.
   > Without this secret, the post-deployment verification will fail with a helpful error message.

### First Release After Merge

The first release after merging this PR will use date-based versioning:

1. Version is auto-calculated as `YY.MDD.REV`
2. Example: If merged on January 14, 2026, first release will be `26.114.0`
3. Subsequent releases on the same day will be `26.114.1`, `26.114.2`, etc.

### Conventional Commits

For best changelog generation, follow conventional commit format:

```
feat: add new feature
fix: correct bug
chore: update dependencies
docs: improve documentation
refactor: simplify code
test: add tests
ci: update workflows
```

## Files Modified

- `.github/workflows/release.yml` - Revamped release workflow
- `.github/instructions/production-release.instructions.md` - Updated guidelines
- `.github/prompts/release.latest.prompt.md` - Updated documentation

## Breaking Changes

- Workflow inputs simplified (removed `version_bump` parameter - versions are auto-calculated)
- Requires conventional commit format for optimal changelog generation

### Tag Format

Tags use date-based versioning: `YY.MDD.REV`
- `YY` = 2-digit year
- `M` = Month (1-12, no leading zero)
- `DD` = Day of month (01-31, with leading zero)
- `REV` = Revision for same-day releases (starts at 0)

Examples: `26.101.0`, `26.114.0`, `26.1101.0`, `26.1111.0`

## Future Enhancements

Potential improvements for future iterations:

1. **Automated version detection** - Auto-detect bump type from commits
2. **Release notes template** - Customizable release notes format
3. **Deploy to multiple environments** - Staging → Production workflow
4. **Slack/Teams notifications** - Notify team of releases
5. **Performance metrics** - Track release success rates

## Support

For questions or issues:
- See `.github/instructions/production-release.instructions.md` for detailed guidelines
- See `.github/prompts/release.latest.prompt.md` for workflow usage
- Check workflow logs in GitHub Actions for debugging
