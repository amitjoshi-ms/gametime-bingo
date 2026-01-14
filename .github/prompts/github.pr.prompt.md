---
description: 'Action-driven PR workflow: create, monitor CI, fix failures, address reviews, push changes'
tools:
  - github
  - create_pull_request
  - update_pull_request
  - get_pull_request_diff
  - list_pull_requests
  - get_pull_request_reviews
  - get_pull_request_status
  - get_pull_request_files
  - get_pull_request_comments
  - request_copilot_review
  - merge_pull_request
  - get_me
  - githubRepo
  - runCommands/runInTerminal
  - runCommands/getTerminalOutput
  - editFiles/editFile
  - codebase
---

# GitHub Pull Request Workflow

You are an automated PR management agent. Execute these workflows step-by-step, taking real actions.

## Workflow: Create PR

**Execute these steps in order:**

1. Run `git branch --show-current` to get branch name
2. Run `git log main..HEAD --oneline` to see commits
3. Get the diff: `git diff main...HEAD`
4. Search codebase for `.github/pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE.md`
5. **CREATE** a draft PR:
   - Title: `type(scope): description` (infer type from changes)
   - Body: Generate from diff + template structure
   - Base: `main` (unless specified otherwise)
6. **GET** the PR diff using `get_pull_request_diff`
7. **UPDATE** PR body with detailed description based on actual diff
8. **REQUEST** Copilot code review using `request_copilot_review`
9. Report PR number and URL to user

## Workflow: Monitor PR Until Ready

**Execute these steps, polling until complete:**

1. **ENSURE** Copilot review is requested:
   - **GET** PR status using `get_pull_request_status`
   - If no "Copilot Code Review" check found: **REQUEST** with `request_copilot_review`
   - This allows Copilot to run in parallel with CI
   - Note: Copilot may appear as a check or as a PR review depending on repo configuration
2. **CHECK** CI status (all checks except Copilot):
   - If any check `pending`/`in_progress`:
     - Poll every 30 seconds for up to 10 minutes
     - After 10 minutes of `pending`/`in_progress`, use exponential backoff: 1min → 2min → 4min (max 5min between polls)
     - Stop polling after 60 minutes total and report to user
   - If any check `failure`: Execute **Fix CI Failures** workflow → **GOTO step 1**
   - If all checks `success`: Continue to step 3
3. **AWAIT** Copilot Code Review:
   - Execute **Await Copilot Review** sub-workflow (max 15 minutes)
   - **IF** review received with comments: Continue to step 4
   - **IF** review received with no comments: PR is clean, continue to step 5
   - **IF** timeout (no review after 15 mins): Execute **Local Code Review** workflow, continue to step 5
4. **ADDRESS** Copilot review comments:
   - **GET** review comments using `get_pull_request_comments`
   - Execute **Address Review Comments** workflow → **GOTO step 1**
5. **REPORT** PR is ready to merge (CI passed, code review clean)

### Sub-workflow: Request Copilot Review

**Execute when no Copilot review found (max 3 attempts):**

1. **SET** attempt = 1, max_attempts = 3
2. **WHILE** attempt <= max_attempts:
   a. **REQUEST** Copilot review using `request_copilot_review`
   b. **WAIT** 30 seconds
   c. **VERIFY** request succeeded:
      - **GET** PR details to check requested reviewers
      - **CHECK** if `copilot-pull-request-reviewer` is in reviewers list
      - If yes: Request successful, **RETURN** success
      - If no: Log "Copilot request attempt {attempt} failed"
   d. **INCREMENT** attempt
   e. **WAIT** 30 seconds before retry
3. **IF** all attempts failed:
   - Log "Failed to request Copilot review after 3 attempts"
   - **RETURN** failure

### Sub-workflow: Await Copilot Review

**Poll for Copilot review (max 15 minutes, 1-minute intervals):**

1. **SET** start_time = now, timeout = 15 minutes
2. **LOOP** while (now - start_time) < timeout:
   a. **GET** PR reviews using `get_pull_request_reviews`
   b. **CHECK** for review from `copilot-pull-request-reviewer`:
      - If found with comments: **RETURN** {status: "comments", review: review}
      - If found with no comments: **RETURN** {status: "clean"}
      - If not found: Continue to step c
   c. **CHECK** if Copilot is in requested reviewers:
      - If not requested: Execute **Request Copilot Review** sub-workflow
        - If request failed: **RETURN** {status: "timeout"}
      - If requested: Log "Waiting for Copilot review..."
   d. **WAIT** 60 seconds (1-minute polling interval)
3. **RETURN** {status: "timeout"} (15 minutes elapsed without review)

## Workflow: Local Code Review

**Execute when remote Copilot review times out (fallback):**

1. **GET** PR diff using `get_pull_request_diff`
2. **ANALYZE** the changes for:
   - Code style and formatting issues
   - Potential bugs or logic errors
   - Missing error handling
   - Security concerns
   - Performance issues
   - Missing tests for new functionality
3. **IF** issues found:
   - List issues and ask user: "Found these issues during local review. Fix them?"
   - If yes: Execute **Address Review Comments** workflow with local findings
4. **IF** no issues found:
   - Report: "Local code review passed. No issues found."

## Workflow: Fix CI Failures

**Execute these steps for each failing check:**

1. **GET** PR status using `get_pull_request_status` to identify failing checks
   - Extract the workflow run ID from the failing check's details URL or context
2. **RUN** `gh run view <run-id> --log-failed` to get failure logs
   - Replace `<run-id>` with the numeric ID extracted in step 1
3. **ANALYZE** the error output:
   - Identify the failing file(s) and line(s)
   - Determine root cause (lint, test, build, type error)
4. **READ** the failing file(s) from codebase
5. **EDIT** files to fix the issues:
   - For lint errors: Apply formatting/style fixes
   - For test failures: Fix the test or the code being tested
   - For type errors: Add types, fix signatures
   - For build errors: Fix imports, dependencies
6. **RUN** the relevant check(s) locally to verify fix works:
   - `npm run lint` for lint errors
   - `npm run check` for TypeScript type errors
   - `npm run test` for unit test failures
   - `npm run build` for build errors
   - `npx playwright test --project=chromium` for E2E failures (requires build first)
7. **IF** local check(s) **fail**:
   - Analyze the new error output
   - Go back to step 5 to refine the fix
   - **DO NOT** commit or push until local check(s) pass
8. **IF** local check(s) **pass**:
   - **STAGE** only the files you modified: `git add <file1> <file2> ...`
   - Alternatively, review staged changes with `git status` before committing
   - **COMMIT** fixes: `git commit -m "fix: address CI failures"`
9. **PUSH** changes: `git push`
   - If push fails due to conflicts: `git pull --rebase && git push`
10. **RETURN** to Monitor workflow to re-check CI

## Workflow: Address Review Comments

**Execute these steps for each review comment:**

1. **GET** review comments using `get_pull_request_comments`
2. **GET** review threads using `get_pull_request_reviews` with comments
3. **FOR EACH** unresolved comment:
   a. **READ** the file and line(s) mentioned
   b. **ANALYZE** what the reviewer is asking for
   c. **EDIT** the file to address the feedback
   d. **REPLY** to the comment explaining the change made
4. **STAGE** only the files you modified: `git add <file1> <file2> ...`
   - Alternatively, use `git add -p` for interactive staging
   - Verify with `git status` that only intended files are staged
5. **COMMIT** changes: `git commit -m "fix: address review comments"`
6. **PUSH** changes: `git push`
7. **RE-REQUEST** review from Copilot (automatic on push) or human reviewers who requested changes
8. **RETURN** to Monitor workflow

## Workflow: Check My PRs

**Execute these steps:**

1. **GET** current user with `get_me`
2. **LIST** open PRs using `list_pull_requests` with state=open
3. **FOR EACH** PR authored by current user:
   a. **GET** status using `get_pull_request_status`
   b. **GET** reviews using `get_pull_request_reviews`
   c. **REPORT**:
      - PR #, title, branch
      - CI: ✅ passing | ❌ failing | ⏳ pending
      - Reviews: ✅ approved | 🔄 changes requested | ⏳ pending
      - Ready to merge: Yes/No
4. **OFFER** to run Monitor workflow on any PR

## Workflow: Full PR Lifecycle

**For "drive this PR" or "get this PR merged":**

1. Execute **Create PR** workflow (if no PR exists)
2. Execute **Monitor PR Until Ready** workflow
3. When ready, ask user: "PR is ready to merge. Merge now?"
4. If yes: Merge using `merge_pull_request`

## Commands Reference

| Action | Command |
|--------|---------|
| Check CI locally (full) | `npm run lint && npm run check && npm run test && npm run build` |
| Lint only | `npm run lint` |
| Type check only | `npm run check` |
| Unit tests only | `npm run test` |
| E2E tests | `npm run build && npx playwright test --project=chromium` |
| View failed run | `gh run view <id> --log-failed` |
| Re-run checks | `gh run rerun <id> --failed` |
| Push changes | `git add <files> && git commit -m "msg" && git push` |

## Decision Tree

```
User Request
├── "create PR" → Create PR workflow
├── "check my PRs" → Check My PRs workflow
├── "fix PR #N" → Monitor PR Until Ready workflow
├── "address comments on #N" → Address Review Comments workflow
├── "fix CI on #N" → Fix CI Failures workflow
└── "drive PR #N" / "land PR #N" → Full PR Lifecycle workflow
```
