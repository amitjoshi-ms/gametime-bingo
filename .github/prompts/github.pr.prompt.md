---
description: 'Automated PR management: create, monitor CI, fix failures, address reviews, merge'
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

## Required Tools

**These tools are declared in the prompt frontmatter and auto-enabled:**

### VS Code Built-in Tools

| Tool | Purpose |
|------|---------|
| `runInTerminal` | Run git, npm, gh CLI commands |
| `getTerminalOutput` | Get output from terminal commands |
| `terminalLastCommand` | Get last command and its output |
| `readFile` | Read file contents for review |
| `editFiles` | Apply edits to fix issues |
| `createFile` | Create new files |
| `listDirectory` | List files in workspace |
| `fileSearch` | Search for files by pattern |
| `codebase` | Semantic code search |
| `problems` | Get workspace issues/errors |
| `changes` | Get source control changes |
| `fetch` | Fetch web content |

### MCP Tools (GitHub)

The GitHub MCP tools (`mcp_io_github_git_*`) require the GitHub MCP server:

1. **Install GitHub MCP Server** (if not already configured):
   ```json
   // In VS Code settings.json or .vscode/mcp.json
   {
     "mcp": {
       "servers": {
         "github": {
           "command": "npx",
           "args": ["-y", "@modelcontextprotocol/server-github"],
           "env": {
             "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
           }
         }
       }
     }
   }
   ```

2. **Create a GitHub PAT** with scopes: `repo`, `read:org`, `workflow`

### CLI Dependencies

```bash
# GitHub CLI (required for fallback commands)
gh --version || winget install GitHub.cli

# Authenticate
gh auth status || gh auth login
```

> ⚠️ **Without these tools**, the agent will provide guidance but cannot execute workflows automatically.

## Core Principles

**These rules apply to ALL workflows:**

1. **Always verify before pushing** — Run pre-push verification (lint, type check, tests) before every `git push`
2. **Always request code review** — Never merge without Copilot review or local review fallback
3. **Always ask before merging** — Get explicit user confirmation: "PR is ready to merge. Merge now?"
4. **Follow the workflows** — Don't skip steps, even for "simple" changes
5. **Keep local and remote in sync** — All edits are made locally, then pushed to remote

## MCP Tools Reference

### GitHub MCP Tools (mcp_io_github_git_*)

| Tool | Purpose |
|------|---------|
| `get_me` | Get authenticated user info |
| `create_pull_request` | Create a new PR |
| `pull_request_read` | Get PR details, diff, files, reviews, comments |
| `update_pull_request` | Update PR title, body, state, reviewers |
| `merge_pull_request` | Merge a PR |
| `request_copilot_review` | Request Copilot code review |
| `list_pull_requests` | List PRs in a repo |
| `search_pull_requests` | Search PRs by author, state, etc. |
| `get_commit` | Get commit details with diff |
| `list_commits` | List commits on a branch |
| `get_file_contents` | Read file from GitHub |
| `create_branch` | Create a new branch |
| `list_branches` | List branches in repo |
| `issue_read` | Read issue details |
| `issue_write` | Create/update issues |
| `add_issue_comment` | Add comment to issue/PR |

### Pull Request Read Methods

The `pull_request_read` tool has multiple methods:

```
method: "get"              → PR metadata (title, state, mergeable_state, etc.)
method: "get_diff"         → Full diff of changes
method: "get_files"        → List of changed files with stats
method: "get_status"       → CI/check status for head commit
method: "get_reviews"      → List of reviews (Copilot, human)
method: "get_review_comments" → Review comments with threads (IsOutdated, IsResolved)
method: "get_comments"     → General PR comments (not review-specific)
```

### Pull Request Review Write Methods

The `pull_request_review_write` tool manages reviews:

```
method: "create"           → Create new review (optionally submit with event)
method: "submit_pending"   → Submit existing pending review
method: "delete_pending"   → Delete pending review
```

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
   - Use `mcp_io_github_git_create_pull_request`:
     ```
     owner: <repo-owner>
     repo: <repo-name>
     title: "type(scope): description"
     head: <feature-branch>
     base: "main"
     body: <PR description>
     draft: true
     ```
   - Check for PR template: `.github/pull_request_template.md`
   - Title format: `type(scope): description` (infer from commits)

4. **Request Copilot review:**
   - Use `mcp_io_github_git_request_copilot_review`:
     ```
     owner: <repo-owner>
     repo: <repo-name>
     pullNumber: <PR number>
     ```

5. **Report to user:**
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

- Use `mcp_io_github_git_pull_request_read` with `method: "get"` to check `requested_reviewers`
- If Copilot not in reviewers → Use `mcp_io_github_git_request_copilot_review`

#### 2. Monitor CI Status

**Poll every 30s for up to 10 min, then use exponential backoff (1m → 2m → 4m → 5m)**

- Use `mcp_io_github_git_pull_request_read` with `method: "get_status"` OR
- Use terminal: `gh run list --repo <owner>/<repo> --branch <branch> --limit 3`
- Check status:
  - If `pending`/`in_progress`: Wait and poll
  - If `failure`:
    - Increment `ci_fix_attempts`
    - If `ci_fix_attempts > 3` → Ask user: "CI failed 3+ times. Continue?"
    - Run [Fix CI Failures](#workflow-fix-ci-failures) → GOTO step 1
  - If all `success`: Continue

#### 3. Await Copilot Review

**Max 15 minutes with 1-minute polls**

- Use `mcp_io_github_git_pull_request_read` with `method: "get_reviews"`
- Look for review from `copilot-pull-request-reviewer[bot]`:
  - Found with comments → Continue to step 4
  - Found, no comments → PR clean, continue to step 5
  - Not found → Re-request review, wait 60s, poll again
- If timeout (15 min) → Run [Local Code Review](#workflow-local-code-review) → Continue to step 5

#### 4. Address Review Comments (if any)

- Use `mcp_io_github_git_pull_request_read` with `method: "get_review_comments"`
- Check `IsOutdated` field — outdated comments were addressed by newer commits
- Increment `review_cycles`
- If `review_cycles > 3` → Ask user: "Review cycle #N. Continue?"
- Run [Address Review Comments](#workflow-address-review-comments) → GOTO step 1

#### 5. Check Branch Up-to-Date

- Use `mcp_io_github_git_pull_request_read` with `method: "get"`, check `mergeable_state`:
  - `behind`: Use `mcp_io_github_git_update_pull_request_branch`, sync local, GOTO step 1
  - `dirty`/`blocked`: Report conflict, stop and await user guidance
  - `clean`: Continue

#### 6. Report Ready

✅ **PR is ready to merge** (CI passed, review clean, branch current)

### Sub-Workflow: Request Copilot Review

**Max 3 attempts with 30s delays:**

```
FOR attempt = 1 TO 3:
  - Use mcp_io_github_git_request_copilot_review
  - Wait 30s
  - Use mcp_io_github_git_pull_request_read (method: "get")
  - Check if Copilot in requested_reviewers
  - If yes → SUCCESS
  - Else → Wait 30s and retry

If all attempts fail → LOG failure
```

### Sub-Workflow: Await Copilot Review

**Max 15 minutes, 1-minute intervals:**

```
start_time = now()
WHILE (now() - start_time) < 15 minutes:
  - Use mcp_io_github_git_pull_request_read (method: "get_reviews")
  - Check for copilot-pull-request-reviewer[bot] review:
    - Found with body containing comments → RETURN {status: "comments", review}
    - Found, no comments → RETURN {status: "clean"}
    - Not found → Re-request review
  - Wait 60s

RETURN {status: "timeout"}
```

## Workflow: Local Code Review

**Fallback when remote Copilot review times out.**

> **Reference**: See `.github/instructions/code-review.instructions.md` and `.github/instructions/documentation-review.instructions.md`

### Steps

1. **Get PR changes:**
   - Use `mcp_io_github_git_pull_request_read` with `method: "get_diff"`
   - Use `mcp_io_github_git_pull_request_read` with `method: "get_files"`

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
   - Use `mcp_io_github_git_pull_request_read` with `method: "get_status"` OR
   - Terminal: `gh run list --repo <owner>/<repo> --branch <branch> --limit 3`
   - Extract run ID from failed run

3. **Get logs (GitHub Actions):**
   ```bash
   gh run view <run-id> --log-failed
   ```

4. **Analyze error:**
   - Identify failing files and lines
   - Determine root cause (lint, test, build, type error)

5. **Fix locally:**
   - Read failing files with `read_file` or `mcp_io_github_git_get_file_contents`
   - Edit with `replace_string_in_file` or `multi_replace_string_in_file`
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
   - Use `mcp_io_github_git_pull_request_read` with `method: "get_review_comments"`
   - Returns `reviewThreads` array with:
     - `IsOutdated`: true if comment no longer applies to current code
     - `IsResolved`: true if thread was resolved
     - `Comments.Nodes[].Body`: The comment text
     - `Comments.Nodes[].Path`: File path
     - `Comments.Nodes[].Line`: Line number

3. **For each unresolved, non-outdated comment:**
   - Read file and lines mentioned
   - Understand reviewer's request
   - Edit local file with `replace_string_in_file` to address feedback
   - Use `mcp_io_github_git_add_issue_comment` to reply if needed

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
   - Use `mcp_io_github_git_request_copilot_review` (may auto-trigger on push)

9. **Return to [Monitor](#workflow-monitor-pr-until-ready)**

## Workflow: Check My PRs

**List status of all open PRs authored by you.**

### Steps

1. Use `mcp_io_github_git_get_me` to get current username
2. Use `mcp_io_github_git_search_pull_requests`:
   ```
   query: "author:<username> is:open"
   owner: <repo-owner>  # Optional: filter to specific repo
   repo: <repo-name>
   ```
3. For each PR, use `mcp_io_github_git_pull_request_read` with `method: "get"` to get:
   - `mergeable_state`: clean/behind/dirty/blocked
   - `requested_reviewers`: pending reviews
4. Report status for each PR

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
   - Use `mcp_io_github_git_merge_pull_request`:
     ```
     owner: <repo-owner>
     repo: <repo-name>
     pullNumber: <PR number>
     merge_method: "squash"  # or "merge" or "rebase"
     ```
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

### Terminal Commands

| Action | Command |
|--------|---------|
| Sync with remote | `git pull --rebase origin <branch>` |
| Full verification | `npm run lint && npm run check && npm run test && npm run build` |
| Lint only | `npm run lint` |
| Type check | `npm run check` |
| Unit tests | `npm run test` |
| E2E tests (fast) | `npx playwright test --project=chromium --reporter=list` |
| View failed run | `gh run view <id> --log-failed` |
| List CI runs | `gh run list --repo <owner>/<repo> --branch <branch> --limit 5` |
| Re-run failed | `gh run rerun <id> --failed` |
| Stage & commit | `git add <files> && git commit -m "msg"` |
| Push changes | `git push` |
| Review staged | `git diff --staged` |
| Review unpushed | `git diff origin/<branch>..HEAD` |

### MCP Tool Quick Reference

| Action | Tool | Key Parameters |
|--------|------|----------------|
| Get my user info | `get_me` | (none) |
| Create PR | `create_pull_request` | owner, repo, title, head, base, body, draft |
| Get PR details | `pull_request_read` | method:"get", owner, repo, pullNumber |
| Get PR diff | `pull_request_read` | method:"get_diff", owner, repo, pullNumber |
| Get PR files | `pull_request_read` | method:"get_files", owner, repo, pullNumber |
| Get CI status | `pull_request_read` | method:"get_status", owner, repo, pullNumber |
| Get reviews | `pull_request_read` | method:"get_reviews", owner, repo, pullNumber |
| Get review comments | `pull_request_read` | method:"get_review_comments", owner, repo, pullNumber |
| Request Copilot review | `request_copilot_review` | owner, repo, pullNumber |
| Update PR | `update_pull_request` | owner, repo, pullNumber, + fields to update |
| Update PR branch | `update_pull_request_branch` | owner, repo, pullNumber |
| Merge PR | `merge_pull_request` | owner, repo, pullNumber, merge_method |
| Add PR comment | `add_issue_comment` | owner, repo, issue_number (=PR#), body |
| Search PRs | `search_pull_requests` | query, owner, repo |
| Get file | `get_file_contents` | owner, repo, path, ref |
| Get commit | `get_commit` | owner, repo, sha |

### Review Comment Response Fields

When using `pull_request_read` with `method: "get_review_comments"`:

```typescript
reviewThreads: [
  {
    ID: string;
    IsResolved: boolean;   // Thread marked resolved
    IsOutdated: boolean;   // Code changed since comment (often means fixed)
    IsCollapsed: boolean;
    Comments: {
      Nodes: [
        {
          ID: string;
          Body: string;        // Comment text with suggestions
          Path: string;        // File path
          Line: number | null; // Line number (null if outdated)
          Author: { Login: string };
          CreatedAt: string;
          URL: string;
        }
      ]
    }
  }
]
```

**Key insight**: `IsOutdated: true` usually means the code was changed and the comment may be addressed.
