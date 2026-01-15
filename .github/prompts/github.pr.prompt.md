---
description: 'Automated PR management: create, monitor CI, fix failures, address reviews, merge'
tools:
  - github          # PR operations (create, update, status, reviews, merge)
  - bash            # Run commands (git, npm, gh, tests)
  - view            # Read files
  - edit            # Fix issues
  - grep            # Search code
---

# GitHub Pull Request Workflow

Automated agent for managing pull requests from creation to merge.

## Quick Reference

**Common Commands:**
```bash
# Create PR
@workspace /github.pr create

# Monitor existing PR
@workspace /github.pr monitor #123

# Check all my PRs
@workspace /github.pr check

# Drive PR to completion
@workspace /github.pr drive #123
```

## Core Principles

**These rules apply to ALL workflows:**

1. **Always verify before pushing** — Run pre-push verification (lint, type check, tests) before every `git push`
2. **Always request code review** — Never merge without Copilot review or local review fallback
3. **Always ask before merging** — Get explicit user confirmation: "PR is ready to merge. Merge now?"
4. **Follow the workflows** — Don't skip steps, even for "simple" changes
5. **Keep local and remote in sync** — All edits are made locally, then pushed to remote

## Workflow Index

| Workflow | Use Case |
|----------|----------|
| [Create PR](#workflow-create-pr) | Create new PR from current branch |
| [Monitor PR](#workflow-monitor-pr-until-ready) | Poll until PR passes CI and review |
| [Fix CI Failures](#workflow-fix-ci-failures) | Debug and fix failing CI checks |
| [Address Review Comments](#workflow-address-review-comments) | Fix issues from code review |
| [Check My PRs](#workflow-check-my-prs) | List status of all open PRs |
| [Full Lifecycle](#workflow-full-pr-lifecycle) | Create → Monitor → Merge |

## Workflow: Create PR

**Create a draft PR from the current branch.**

### Steps

1. **Get branch info:**
   ```bash
   git branch --show-current
   git log main..HEAD --oneline
   ```

2. **Check for unpushed changes:**
   ```bash
   git log origin/<branch>..HEAD --oneline 2>/dev/null || echo "Branch not pushed"
   ```
   - If unpushed commits exist → Run [Pre-Push Verification](#workflow-pre-push-verification) → Push branch

3. **Create draft PR:**
   - Get diff: `git diff main...HEAD`
   - Check for PR template: `.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE.md`
   - Title format: `type(scope): description` (infer from commits)
   - Use template structure in body if exists
   - Base: `main` (unless specified)

4. **Update with details:**
   - Get PR diff using GitHub API
   - Update body with detailed description

5. **Request Copilot review:**
   - Request review (allow parallel execution with CI)

6. **Report to user:**
   - PR number and URL
   - Current status

### Example Output

```
✅ Created PR #123: feat(game): add multiplayer support
🔗 https://github.com/owner/repo/pull/123
📋 Status: Draft, awaiting CI and review
```

## Workflow: Monitor PR Until Ready

**Poll PR status until CI passes and code review is complete.**

### Tracking Variables

- `ci_fix_attempts` = 0
- `review_cycles` = 0

### Main Loop

Repeat these checks until PR is ready:

#### 1. Ensure Copilot Review Requested

- Check PR status for "Copilot Code Review" check
- If not found → Request review (runs in parallel with CI)
- May appear as check or PR review depending on repo config

#### 2. Monitor CI Status

**Poll every 30s for up to 10 min, then use exponential backoff (1m → 2m → 4m → 5m)**

- If `pending`/`in_progress`: Wait and poll
- If `failure`:
  - Increment `ci_fix_attempts`
  - If `ci_fix_attempts > 3` → Ask user: "CI failed 3+ times. Continue?"
  - Run [Fix CI Failures](#workflow-fix-ci-failures) → GOTO step 1
- If all `success`: Continue

#### 3. Await Copilot Review

**Max 15 minutes with 1-minute polls**

- Poll for review from `copilot-pull-request-reviewer`
- If review with comments → Continue to step 4
- If review with no comments → PR clean, continue to step 5
- If timeout (15 min) → Run [Local Code Review](#workflow-local-code-review) → Continue to step 5

#### 4. Address Review Comments (if any)

- Get comments from GitHub
- Increment `review_cycles`
- If `review_cycles > 3` → Ask user: "Review cycle #N. Continue?"
- Run [Address Review Comments](#workflow-address-review-comments) → GOTO step 1

#### 5. Check Branch Up-to-Date

- Get PR `mergeable_state`
- If `behind`:
  - Update branch
  - Wait 30s for merge
  - Sync local: `git fetch && git pull --rebase`
  - GOTO step 1 (CI/review will re-run)
- If `dirty`/`blocked`:
  - Report conflict/blocking issue
  - Stop and await user guidance
- If `clean`: Continue

#### 6. Report Ready

✅ **PR is ready to merge** (CI passed, review clean, branch current)

### Sub-Workflow: Request Copilot Review

**Max 3 attempts with 30s delays:**

```
FOR attempt = 1 TO 3:
  - Request review via API
  - Wait 30s
  - Check if copilot-pull-request-reviewer in reviewers list
  - If yes → SUCCESS
  - Else → Wait 30s and retry
  
If all attempts fail → LOG failure
```

### Sub-Workflow: Await Copilot Review

**Max 15 minutes, 1-minute intervals:**

```
start_time = now()
WHILE (now() - start_time) < 15 minutes:
  - Get PR reviews
  - Check for copilot-pull-request-reviewer review:
    - Found with comments → RETURN {status: "comments", review}
    - Found, no comments → RETURN {status: "clean"}
    - Not found → Check if requested, if not request again
  - Wait 60s
  
RETURN {status: "timeout"}
```

## Workflow: Local Code Review

**Fallback when remote Copilot review times out.**

> **Reference**: See `.github/instructions/code-review.instructions.md` and `.github/instructions/documentation-review.instructions.md`

### Steps

1. **Get PR changes:**
   - Get diff
   - Get changed files (identify `.ts`, `.svelte`, `.js`, `.md`, `.mdx`)

2. **Review code files** (`.ts`, `.svelte`, `.js`):
   - Read `.github/instructions/code-review.instructions.md`
   - Check against review standards:
     - ✅ Correctness (logic, edge cases, errors)
     - ✅ Standards (TypeScript strict, Svelte 5 runes, testing)
     - ✅ Security (validation, no secrets, P2P message checks)
     - ✅ Performance (no unnecessary re-renders, memory leaks)
     - ✅ Architecture (pure logic, isolated network, state flow)

3. **Review documentation** (`.md`, `.mdx`):
   - Read `.github/instructions/documentation-review.instructions.md`
   - Check against review standards:
     - ✅ Accuracy (correct info, working examples, valid links)
     - ✅ Clarity (clear purpose, logical steps)
     - ✅ Completeness (prerequisites, error cases)
     - ✅ Structure (heading hierarchy, code blocks)
     - ✅ Style (active voice, concise, correct spelling)

4. **Report findings:**
   - If issues found → Ask: "Found these issues. Fix them?"
   - If no issues → Report: "Local review passed."

## Workflow: Pre-Push Verification

**MANDATORY before every `git push`. No exceptions.**

### Quick Command

```bash
npm run lint && npm run check && npm run test && \
npm run build && npx playwright test --project=chromium --reporter=list
```

### Steps

1. **Lint:** `npm run lint` (fix errors if any)
2. **Type check:** `npm run check` (fix errors if any)
3. **Unit tests:** `npm run test` (fix failures if any)
4. **Build:** `npm run build` (fix errors if any)
5. **E2E tests (Chromium only):**
   ```bash
   npx playwright test --project=chromium --reporter=list
   ```
   - Fast local verification (full cross-browser runs in CI)
   - Fix failures if any

6. **Local code review:**
   - Review changes to be pushed:
     ```bash
     git diff origin/<branch>..HEAD  # All unpushed changes
     git diff --name-only origin/<branch>..HEAD  # Changed files
     ```
   - **For code files**: Apply code review checklist from `.github/instructions/code-review.instructions.md`
   - **For docs**: Apply doc review checklist from `.github/instructions/documentation-review.instructions.md`
   - Fix issues if found

7. **All checks passed** → Proceed with `git push`

### Note on Skipping Steps

When running this workflow after fixing CI failures or review comments, you may skip steps 1-4 for checks you just ran successfully. **Step 6 (local code review) is always mandatory.**

## Workflow: Fix CI Failures

**Debug and fix failing CI checks. All edits made locally, then pushed.**

### Steps for Each Failing Check

1. **Sync local:** `git pull --rebase origin <branch>`

2. **Identify failure:**
   - Get PR status to find failing checks
   - For GitHub Actions: Extract run ID from `details_url` (e.g., `/actions/runs/<run-id>`)
   - For external CI: Skip to step 4

3. **Get logs (GitHub Actions only):**
   ```bash
   gh run view <run-id> --log-failed
   ```

4. **Analyze error:**
   - Identify failing files and lines
   - Determine root cause (lint, test, build, type error)

5. **Fix locally:**
   - Read failing files
   - Edit to fix issues
   - Run relevant check to verify:
     ```bash
     npm run lint       # For lint errors
     npm run check      # For type errors
     npm run test       # For unit test failures
     npm run build      # For build errors
     npx playwright test --project=chromium --reporter=list  # For E2E failures
     ```

6. **Verify fix:**
   - If local check fails → Refine fix (go to step 5)
   - If local check passes → Continue

7. **Commit:**
   ```bash
   git add <fixed-files>
   git diff --staged  # Review before commit
   git commit -m "fix: address CI failures"
   ```

8. **Pre-push verification:**
   - Run [Pre-Push Verification](#workflow-pre-push-verification)
   - May skip steps 1-4 for checks already run in step 5
   - **Step 6 (local code review) is mandatory**

9. **Push:** `git push` (use `git pull --rebase && git push` if conflicts)

10. **Return to [Monitor](#workflow-monitor-pr-until-ready)** to re-check CI

## Workflow: Address Review Comments

**Fix issues from code review. All edits made locally, then pushed.**

### Steps

1. **Sync local:** `git pull --rebase origin <branch>`

2. **Get review feedback:**
   - Get comments via GitHub API
   - Get review threads

3. **For each unresolved comment:**
   - Read file and lines mentioned
   - Understand reviewer's request
   - Edit local file to address feedback
   - Reply to comment explaining the change
   - Resolve thread if fix is complete

4. **Verify changes:**
   ```bash
   npm run lint && npm run check && npm run test
   # For UI changes, also run:
   npm run build && npx playwright test --project=chromium --reporter=list
   ```

5. **Commit:**
   ```bash
   git add <fixed-files>
   git diff --staged  # Review before commit
   git commit -m "fix: address review comments"
   ```

6. **Pre-push verification:**
   - Run [Pre-Push Verification](#workflow-pre-push-verification)
   - May skip steps 1-4 for checks already run in step 4
   - **Step 6 (local code review) is mandatory**

7. **Push:** `git push` (use `git pull --rebase && git push` if conflicts)

8. **Re-request review:**
   - From Copilot (may auto-trigger)
   - From human reviewers who requested changes

9. **Return to [Monitor](#workflow-monitor-pr-until-ready)**

## Workflow: Check My PRs

**List status of all open PRs authored by you.**

### Steps

1. Get current user
2. List open PRs where author = current user
3. For each PR, report:
   - PR number, title, branch
   - CI status: ✅ passing | ❌ failing | ⏳ pending
   - Reviews: ✅ approved | 🔄 changes requested | ⏳ pending
   - Ready to merge: Yes/No
4. Offer to run Monitor workflow on any PR

### Example Output

```
Your Open PRs:

#123: feat(game): add multiplayer support
  Branch: feature/multiplayer
  CI: ✅ passing
  Review: ⏳ pending
  Ready: No (awaiting review)

#118: fix(ui): correct button alignment
  Branch: fix/button-align
  CI: ❌ failing (lint errors)
  Review: ⏳ pending
  Ready: No (CI failing)

Would you like me to monitor or fix any of these?
```

## Workflow: Full PR Lifecycle

**Drive PR from creation to merge (or existing PR to merge).**

### Steps

1. If no PR exists → Run [Create PR](#workflow-create-pr)
2. Run [Monitor PR Until Ready](#workflow-monitor-pr-until-ready)
3. **STOP AND ASK:** "PR is ready to merge. Merge now?"
   - Wait for explicit "yes" from user
4. **ONLY if user confirms:**
   - Merge PR
   - Clean up local:
     ```bash
     git checkout main
     git pull
     git branch -d <feature-branch>
     ```

### Example Usage

```
User: "Drive PR #123 to completion"
Agent: [Monitors PR, fixes CI, addresses reviews]
Agent: "✅ PR #123 is ready to merge. Merge now?"
User: "yes"
Agent: [Merges PR, cleans up branch]
```

## Decision Tree

```
User Request → Action

"create PR"           → Create PR workflow
"monitor PR #N"       → Monitor PR Until Ready workflow
"fix CI on #N"        → Fix CI Failures workflow
"address comments #N" → Address Review Comments workflow
"check my PRs"        → Check My PRs workflow
"drive PR #N"         → Full PR Lifecycle workflow
"land PR #N"          → Full PR Lifecycle workflow
```

## Commands Reference

Assumes dependencies installed (`npm ci` to install from lockfile).

| Action | Command |
|--------|---------|
| Sync with remote | `git pull --rebase origin <branch>` |
| Full verification | `npm run lint && npm run check && npm run test && npm run build` |
| Lint only | `npm run lint` |
| Type check | `npm run check` |
| Unit tests | `npm run test` |
| E2E tests (fast) | `npx playwright test --project=chromium --reporter=list` |
| View failed run | `gh run view <id> --log-failed` |
| Re-run failed | `gh run rerun <id> --failed` |
| Stage & commit | `git add <files> && git commit -m "msg"` |
| Push changes | `git push` |
| Review staged | `git diff --staged` |
| Review unpushed | `git diff origin/<branch>..HEAD` |
