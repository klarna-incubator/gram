---
name: pull-opensource-github
description: >-
  Ensures the Gram open-source remote github points at git@github.com:klarna-incubator/gram.git,
  from the Gram clone at /Users/<first_name>.<family_name>/Klarna/gram (or created via kep develop --system-id gram),
  branches from develop, pulls upstream with merge (no rebase), resolves conflicts, and always
  regenerates root package-lock.json for Klarna npm registry (Node 24), then runs npm run lint and npm run lint-fix when needed,
  then npm run build and npm test after find-clean of package-lock.json and node_modules (step 9),
  then git push to origin (step 10), then open a PR to develop (step 11), then after merge delete the sync branch (step 12) and open a PR from develop to main (step 13).
  Use when syncing Gram with
  klarna-incubator/gram, pulling open-source changes, merging the github remote, Klarna registry
  lockfile refresh, fork sync, upstream merge, open-source pull without rebase, pushing the sync branch to origin, opening a PR to develop, or finishing after PR merge.
disable-model-invocation: true
---

# Pull open-source project (github remote)

## When to use

Apply this workflow when syncing **Gram** with the public **`klarna-incubator/gram`** tree using a Git remote named **`github`**, without rewriting local history via rebase.

## Preconditions

- **Working directory:** run every shell command from the **Gram** repository root. On Klarna macOS setups this is normally **`/Users/<first_name>.<family_name>/Klarna/gram`** (lowercase **`<first_name>.<family_name>`** Klarna username, e.g. `jane.doe` → `/Users/jane.doe/Klarna/gram`). **If that path does not exist** or the tree is not a **Gram** git checkout, run **`kep develop --system-id gram`**, wait for it to complete, then **`cd`** into the project directory **KEP** created (often still **`/Users/<first_name>.<family_name>/Klarna/gram`**—follow **KEP**’s printed path if it differs). If **`kep`** is missing or errors, stop and tell the user to fix **KEP** / the command environment. Confirm you are in **Gram** before step **1** (e.g. **`git rev-parse --show-toplevel`**, root **`package.json`**, **`AGENTS.md`** / **`CLAUDE.md`**). If the repo already exists elsewhere, **`cd`** there instead.
- **Klarna npm registry**: open-source **`package-lock.json`** is generated against the **public** registry. **Klarna uses a different npm registry**, so the root lockfile must **always** be regenerated locally after syncing from **`github`** (see step **7**) using **Node.js 24**, even when the merge had **no** conflicts. After that, run lint (step **8**), then a clean **install / build / test** (step **9**), then **push** to **`origin`** (step **10**), then **open a PR into `develop`** (step **11**). Steps **12–13** run only after the user confirms the PR is merged (see step **11**).
- **Upstream remote:** the agent should **ensure** remote **`github`** points at **`git@github.com:klarna-incubator/gram.git`** (workflow step **1**); do not offload that to the user unless permission is required.

## Workflow

**Start here:** if the **Gram** clone is missing at the expected path, run **`kep develop --system-id gram`**, then **`cd`** into the new project. Otherwise **`cd`** to **`/Users/<first_name>.<family_name>/Klarna/gram`** (or your confirmed **Gram** root). Verify **`pwd`** is the **Gram** repo before any git/npm step. Do not run git/npm steps from another project directory.

### 1. Ensure the `github` remote (Gram upstream)

Perform this step yourself; **do not** ask the user to run it unless you **need permission** (for example: Git refuses to modify remotes, or a remote named **`github`** already exists with a **different** URL—in that case, ask how to proceed before changing or removing it).

Canonical open-source upstream for **Gram**:

```text
git@github.com:klarna-incubator/gram.git
```

1. Run `git remote -v`.
2. If **`github`** is listed and its fetch URL matches the canonical URL above (SSH as shown, or the same repo over `https://github.com/klarna-incubator/gram.git`), continue to step **2**.
3. If **`github` is missing**, add it (no user prompt):

   ```bash
   git remote add github git@github.com:klarna-incubator/gram.git
   ```

4. If **`github` exists but the URL is not** `klarna-incubator/gram`, do **not** overwrite it without explicit user permission—stop and ask what to do.

### 2. Update local refs (recommended)

```bash
git fetch github
git fetch origin   # if develop tracks origin and you need latest
```

Adjust `origin` if the user’s default remote uses another name.

### 3. Create a working branch from `develop`

Ensure `develop` is the intended base (ask if ambiguous).

```bash
git checkout develop
git pull origin develop   # or pull from the remote that owns develop
git checkout -b sync/open-source-<date>
```

Use **today’s date** for `<date>` in a short, URL-safe form the team already uses (for example `2026-05-27`). If that branch name already exists locally or on the remote, append a suffix (e.g. `sync/open-source-2026-05-27-2`) or ask the user only when you cannot pick a non-colliding name without their preference.

### 4. Pull upstream without rebasing

Merge-style pull from the **`github`** remote on branch **`main`** (no rebase):

```bash
git pull github main --no-rebase
```

For **Gram**, the public upstream default branch is **`main`**. Do not substitute another branch unless the user explicitly directs it.

Equivalent intent to: merge upstream `main` into the current branch without `git pull --rebase`.

### 5. Merge conflicts: ask the user to resolve (except `package-lock.json`)

If **`git status`** shows unmerged paths after step **4**:

1. **Ask the user** to resolve conflicts in every conflicted file **except** root **`package-lock.json`**. Do **not** resolve conflict markers yourself unless the user **explicitly** asks you to.
2. In the same message, tell them **not** to edit, merge, or fix conflict markers in **`package-lock.json`**—that file is regenerated in step **7**.
3. Give them enough context to work: run **`git status`** (and list unmerged paths if helpful). They should **`git add <file>`** each file once it is resolved.

If there are **no** unmerged paths, skip step **6**; follow **When the pull had no merge conflicts** (review + steps **7** through **11**; steps **12–13** after the user confirms PR merge).

### 6. Ask the user to review merge resolutions

**Skip this step** if there were **no** merge conflicts (use **When the pull had no merge conflicts** instead).

After the user has finished resolving conflicts (per step **5**), **ask them to review** their work before you continue:

- Confirm they did **not** change **`package-lock.json`** (remind again if needed).
- They should sanity-check diffs (`git diff`, staged changes) and any behavior, dependency, or CI impact.

Do not assume silent approval. **Once the user confirms they are ready to proceed** (or gives equivalent go-ahead), run steps **7** through **11** (skip **10** or **11** only when the user explicitly asks to hold the push or the PR).

### 7. Always regenerate root `package-lock.json`

**Always** run this after the upstream pull from **`github`** completes—whether there were **merge conflicts or not**. Upstream lockfiles target the **public** registry; regeneration aligns the lockfile with **Klarna’s npm registry** and avoids wrong resolved URLs or integrity metadata.

**Node.js:** regenerate **`package-lock.json`** using **Node.js 24** only. Before **`npm install`**, ensure the active runtime is **v20.x** (check with **`node -v`**). If needed, switch with whatever the machine already uses—e.g. **`nvm use 24`**, **`fnm use 24`**, **`asdf shell nodejs 24.x`**, **Volta**, or **`mise use node@24`**—do not guess a tool the user does not have; if **Node 24** is unavailable, stop and ask the user to install or expose it.

**If there were merge conflicts:** only run this after the user has resolved every **non–**`package-lock.json` file (and root **`package.json`** is correct if it conflicted).

From the **repository root** (where root `package-lock.json` lives):

1. Delete the lockfile:

   ```bash
   rm -f package-lock.json
   ```

2. With **Node 24** active and **npm** pointed at Klarna’s registry (do not hardcode registry URLs or tokens in the skill):

   ```bash
   node -v   # expect v24.x
   npm install
   ```

   If the repo documents a different install command for refreshing the lockfile, still run it **only** under **Node 24** unless the user directs otherwise.

3. Stage the new lockfile and finish Git:

   ```bash
   git add package-lock.json
   git status
   ```

4. If a merge is still in progress, complete it once Git reports no remaining conflicts (e.g. `git commit` for the merge). If the merge already produced a commit, commit the lockfile update in a **follow-up commit** (or follow team rules for amend—never amend if the user has forbidden it or the branch is shared in a way that forbids rewrite).

Then continue to step **8**.

### When the pull had no merge conflicts

Still ask the user to review the merge outcome (e.g. latest commit, diff against `develop`). **Once they confirm they are ready to proceed**, run step **7** through step **11** (lockfile, lint, build/test, push, PR). Steps **12–13** wait until they confirm the PR is merged.

### 8. Check linting and apply fixes if needed

From the **repository root** (where **Gram**’s `package.json` defines scripts):

1. Run **`npm run lint`** and inspect the result.
2. If lint fails or reports issues that the repo auto-fixes, run **`npm run lint-fix`**.
3. Run **`npm run lint`** again to confirm a clean result (or follow whatever the repo documents if `lint-fix` leaves intentional exceptions).
4. If **`lint-fix`** produced changes (**`git status`** is not clean), **`git add`** the modified files (ensure they are lint-only), then **`git commit`** using **Conventional Commits**, for example **`chore: fix linting`**. Add a **scope** when it helps (e.g. **`chore(api): fix linting`**). Prefer a **standalone** lint commit rather than folding into an unrelated merge or lockfile commit unless the user explicitly wants one combined commit.
5. If **`lint-fix`** made no changes, do **not** create an empty commit.

If the project documents a different lint command, prefer that over guessing.

Then continue to step **9**.

### 9. Clean install, build, and test

Do **not** read or follow **`.github/workflows/ci.yml`** for this step—use only the commands below.

From the **repository root**:

1. **Clean state** from the **repository root** (confirm **`pwd`** is **Gram**). Run:

   ```bash
   find . -name 'dist' -type d -prune -exec rm -rf {} +
   find . -name 'build' -type d -prune -exec rm -rf {} +
   find . -name 'node_modules' -type d -prune -exec rm -rf {} +
   ```

   Then remove **`dist`** build output the same way: **`find . -name 'dist' -type d -prune -exec rm -rf {} +`**. Do **not** run these commands outside the repo root.
2. **`npm ci`**
3. **`npm run build`**
4. **`npm test`**

**Step 9 is complete only when** **`npm run build`** and **`npm test`** have **both** succeeded in this run (after the clean **`npm install`**). A successful **`npm install`** alone does **not** complete step **9**. If either command fails, step **9** stays **incomplete** until both pass after fixes.

If **`npm run build`** or **`npm test`** fails:

1. **Tell the user first**—do not start large refactors before they know.
2. Summarize the **root cause** (from logs, stack traces, missing deps, type errors, test failures, etc.) and **concrete ways to fix** (files, commands, or options).
3. **Ask** whether they want to **fix it themselves** or **have you apply fixes**.
4. If they want you to fix: implement, then re-run from step **1** (clean tree) and step **2** when dependencies or installs may be stale, or from step **3** if only a small code change, as appropriate until **build** and **test** pass, or stop if blocked.
5. If they will fix it themselves: wait for their go-ahead before declaring step **9** complete, running step **10** (push), step **11** (PR), steps **12–13** (after PR merge), or treating the workflow as finished.

**Do not** mark step **9** complete, or treat the overall sync as finished, while **`npm run build`** or **`npm test`** is still failing—unless the user has **explicitly** accepted that outcome (step **9** remains incomplete). **Do not** run step **10** while step **9** is incomplete unless the user explicitly tells you to push anyway.

**Stage** and **commit** any fixes from step **9** with **Conventional Commits** (e.g. **`fix:`** / **`chore:`** / scoped forms)—same style as step **8** for tool-driven fixes; use a message that matches the actual change.

When step **9** is **complete**, continue to step **10**.

### 10. Push commits to `origin`

Push the current branch’s commits to the **`origin`** remote (the repo’s default host remote—not **`github`**, which is the public upstream).

**Prerequisites:** step **9** must be **complete** (**`npm run build`** and **`npm test`** both succeeded). **Do not** push if step **9** is still incomplete unless the user **explicitly** instructs you to push anyway.

If the user explicitly asks **not** to push yet, skip this step and end the workflow there.

```bash
git push -u origin HEAD
```

Use **`-u`** so the local branch tracks **`origin`** when this is the first push for that branch.

- If **`origin`** is missing or clearly wrong, stop and ask the user—do not guess the URL.
- If the remote rejects the push (non-fast-forward), reconcile with **`git fetch`** / merge or rebase **only** per user instruction—never **`git push --force`** (or **`--force-with-lease`**) without **explicit** user approval.
- On auth errors, explain the failure; do not put tokens or passwords in commands or logs.
- If **push protection** still flags the branch **after** a push attempt because **merge history touched `ci.yml`** (usually **`.github/workflows/ci.yml`**), **rebase onto `develop` as a single commit that excludes any `ci.yml` changes**, then push again:

  1. **`git fetch origin develop`**
  2. On the current sync branch, rewrite history to **one commit** on top of **`origin/develop`** with **no `ci.yml` diff** vs **`develop`**:

     ```bash
     git reset --soft origin/develop
     git restore --source=origin/develop --staged --worktree .github/workflows/ci.yml
     git add -A
     git diff --cached origin/develop -- .github/workflows/ci.yml   # must be empty
     git commit -m "<conventional message for the sync code changes>"
     ```

     Use the exact **`ci.yml`** path from the protection error if it is not **`.github/workflows/ci.yml`**.

  3. **`git push --force-with-lease origin HEAD`** — history was rewritten; **tell the user** before force-pushing (this is the allowed exception to the no-force rule for this remediation).
  4. If the working tree no longer matches what passed step **9**, re-run step **9** before pushing again.
  5. If protection still fails, treat as a **push violation** below and escalate.

- If a **push violation** occurs for **other** reasons (remote or policy blocks the push—protected branches, compliance hooks, artifact rules, or **`ci.yml`** remediation did not help), explain what the message says and **invite the user to contact the Code and Artifacts team on Slack**: [https://klarna.enterprise.slack.com/archives/C4SFKUC2E](https://klarna.enterprise.slack.com/archives/C4SFKUC2E). Do not try to bypass organizational policy. **Skip step 11** until the branch is successfully pushed to **`origin`**.

When step **10** succeeds (**`git push`** to **`origin`** completed), continue to step **11**. If step **10** was skipped, skip step **11** unless the branch already exists on **`origin`** and the user explicitly wants a PR created anyway.

### 11. Open a pull request into `develop`

**Prerequisites:** step **10** completed successfully (branch is on **`origin`**). If step **10** was skipped, **skip step 11** unless the user confirms the compare branch is already on **`origin`** and still wants a PR.

1. Get the current branch with **`git branch --show-current`**. Inspect **what changed in the code** compared to **`develop`**, for example **`git diff develop...HEAD --stat`**, **`git log develop..HEAD --oneline`**, and spot-check important files. Use this to write the PR body—not the workflow steps from earlier in this skill.

2. **Write a PR title** (imperative, short, e.g. `Sync open-source upstream (klarna-incubator/gram main)`). The title may mention the sync; the **description** must not.

3. **Write a PR description in markdown** focused on **upstream code changes**, not on how you pulled or validated the sync:

   - **## Summary** — describe **what** landed in the codebase: features, fixes, refactors, dependency or API changes, new/removed modules, config or CI changes from upstream, and anything reviewers must know about **behavior**. Use bullets. **Do not** narrate workflow actions (no “merged from `github`”, “regenerated `package-lock.json`”, “ran `npm install` / lint / build / test”, “resolved conflicts”, Klarna registry, Node version, or steps **1–10** of this skill).
   - **## Test plan** — checklist for **verifying the product changes** (areas to exercise, regression risks, manual checks). You may include “CI green” as a single item if useful, but **do not** list the agent’s local commands as the test plan.

   If the diff is huge, prioritize the highest-impact areas; link to key paths or commits when it helps reviewers.

4. **Create the PR** using the **GitHub CLI** from the repo root (preferred):

   ```bash
   gh pr create --base develop --head "$(git branch --show-current)" --title "<title>" --body-file pr-body.md
   ```

   Write the markdown body to **`pr-body.md`** first (keep it **untracked**—do not commit it), then run the command (avoids shell-escaping issues). Delete **`pr-body.md`** after a successful **`gh pr create`** when practical. If **`--body-file`** is awkward, use a safely quoted **`--body`** with a heredoc.

5. **If `gh pr create` fails** (not installed, not authenticated, SSO, missing scopes, org policy, **auth/authz** errors, or network):
   - Tell the user **why** it failed in plain language.
   - **Manual steps:** open the **`origin`** repository in the browser → **Pull requests** → **New pull request** → set **base** to **`develop`** and **compare** to the sync branch → paste the **title** and **description**.
   - When you can derive **`owner/repo`** from **`git remote get-url origin`**, give a **compare** link pattern: `https://<github-host>/<owner>/<repo>/compare/develop...<branch>?expand=1` (use the enterprise host if not `github.com`).
   - **Copy-paste description:** output the **full** PR body as **plain GitHub-flavored markdown** in **one** continuous block **without** wrapping it in a markdown code fence, so the user can select it in **one gesture** (e.g. triple-click) and paste into GitHub’s description field. Use normal **`##`** headings and **`- [ ]`** checklist lines.
   - If your output channel **requires** a fence, wrap the body in a single fenced block with the `markdown` language tag and **tell the user** to copy **only** the lines **between** the opening and closing fence lines when pasting into GitHub (second best).

6. When **`gh pr create`** succeeds, share the **PR URL** with the user and **note the PR number or URL** for merge verification in step **12**.

7. **Ask the user** to check that **PR checks** are passing on that PR (GitHub UI, or **`gh pr checks`** / **`gh pr view`** for the PR). Tell them:
   - If checks are **green**, they **may merge** the PR into **`develop`** (themselves in the UI, or via **`gh pr merge`** if they prefer).
   - When the PR is **merged**, they should **let you know** so you can run steps **12** and **13** (step **12** will try to **verify** merge with **`gh`** when possible).
   - **Do not** run steps **12–13** until the user explicitly confirms the PR is **merged** (and checks were acceptable). If checks fail, help diagnose or wait for their direction—do not merge or delete branches without instruction.

### 12. Delete the sync branch

**Prerequisites:** the user said the PR into **`develop`** is **merged** (step **11**). **Verify** that when possible before deleting branches.

1. Note the sync branch name (from step **3**, e.g. **`sync/open-source-<date>`**), or **`git branch --show-current`** if still on it.

2. **Check the PR is merged** (when **`gh`** works and the PR is known):

   ```bash
   gh pr view --head "<sync-branch>" --base develop --json state,mergedAt,url
   ```

   Or, if you saved the PR number or URL from step **11**:

   ```bash
   gh pr view <pr-number-or-url> --json state,mergedAt
   ```

   Proceed only if **`state`** is **`MERGED`**. If it is **`OPEN`**, **`CLOSED`** (not merged), or missing, **stop**—tell the user the PR does not look merged and do **not** delete the sync branch yet.

   If **`gh`** is unavailable, auth fails, or the PR cannot be found, **ask the user** to confirm merge again before continuing (do not delete branches on assumption alone).

3. Update local **`develop`** and switch off the sync branch:

   ```bash
   git fetch origin
   git checkout develop
   git pull --no-rebase origin develop
   ```

4. Delete the sync branch **locally** and on **`origin`**:

   ```bash
   git branch -d <sync-branch>    # use -D only if Git refuses and the user agrees
   git push origin --delete <sync-branch>
   ```

   If **`origin`** rejects deletion (protection, open PR, etc.), explain and ask the user how to proceed.

### 13. Open a pull request from `develop` into `main`

**Prerequisites:** step **12** completed (sync branch removed or deletion handled). **`origin/develop`** should already include the merged open-source sync.

Create a PR **`develop`** → **`main`** and give the user the link—**do not** merge **`develop`** into **`main`** locally or push to **`main`** in this step.

1. **`git fetch origin`** so **`develop`** and **`main`** refs are current.

2. **Create the PR** with **`gh`** (preferred):

   ```bash
   gh pr create --base main --head develop --title "<title>" --body "<short body>"
   ```

   Use a clear title (e.g. `Promote develop to main` or `Release: open-source sync on develop`). Keep the body brief—**`develop`** now contains the synced changes; mention that the open-source sync was merged via the earlier PR into **`develop`**.

   If a PR from **`develop`** to **`main`** already exists, share that URL instead of opening a duplicate (`gh pr list --base main --head develop`).

3. **Share the PR URL** with the user. They merge it when ready (checks, approvals, etc.)—that merge is **outside** this skill unless they ask for help.

4. **If `gh pr create` fails** (auth, permissions, no **`gh`**): explain why and tell the user how to open the PR manually (**base `main`**, **compare `develop`**) and give a compare URL when you can derive **`owner/repo`** from **`git remote get-url origin`**: `https://<github-host>/<owner>/<repo>/compare/main...develop?expand=1`.

When step **13** succeeds (PR link delivered), the open-source sync workflow is **complete**.

## Frequent conflict: root `package.json`

When **`package.json` at the repository root** conflicts, **coach the user** while they resolve it (step **5**):

1. **Merge intentionally**: keep legitimate changes from **both** sides (scripts, workspaces, dependencies, engines).
2. **Dependencies**: align `dependencies` / `devDependencies` / `peerDependencies` with the merged feature set; remove duplicate keys; preserve semver ranges unless the project standard says otherwise.
3. **`package-lock.json`**: follow steps **5–9**—never hand-merge the lockfile; always regenerate after `package.json` is settled (and Klarna registry applies) using **Node.js 24** in step **7**; then lint (step **8**); then build/test (step **9**); then push (step **10**); PR (step **11**); after user confirms PR merge, steps **12–13** (delete sync branch, open PR **`develop`** → **`main`**).
4. **Sanity check**: step **9** is **done** only when **`npm run build`** and **`npm test`** both pass after the **find** cleanup and **`npm install`**—do not substitute **`.github/workflows/ci.yml`** for this step.

## Anti-patterns

- Do not use **`git pull --rebase`** for this workflow unless the user explicitly changes the goal—**except** the step **10** **`ci.yml`** push-protection remediation (soft reset onto **`develop`**, single commit, no **`ci.yml`** changes).
- Do not run this workflow from outside the **Gram** repo root—always **`cd`** to **`/Users/<first_name>.<family_name>/Klarna/gram`** (or the user’s equivalent **Gram** clone) first. If that clone is missing, run **`kep develop --system-id gram`** and **`cd`** into the project before continuing—do not run git/npm in the wrong directory.
- Do not resolve merge conflicts on the user’s behalf unless they **explicitly** ask you to—default is step **5** (user resolves everything except **`package-lock.json`**).
- Do not skip step **1**: ensure remote **`github`** is correct for **Gram** (`klarna-incubator/gram`), without asking the user to do it unless permission is required.
- Do not resolve `package.json` by blindly choosing one side without checking scripts, workspaces, and dependency overlap.
- Do not manually merge or edit **`package-lock.json`** during conflict resolution; always regenerate it per step **7** after the pull (and after other conflicts are resolved when applicable)—**Node.js 24** must be active for that **`npm install`** (not another major version unless the user explicitly overrides).
- Do not skip step **8** after syncing—**`npm run lint`** (and **`npm run lint-fix`** when needed) keeps the branch merge-ready.
- Do not leave **`lint-fix`** changes uncommitted—commit with a **Conventional Commits** message such as **`chore: fix linting`** (see step **8**).
- Do not skip step **9**—after **`find`** cleanup of **`package-lock.json`** and **`node_modules`** (plus **`dist`**), run **`npm install`**, **`npm run build`**, and **`npm test`** to validate the branch.
- Do not use **`.github/workflows/ci.yml`** to decide step **9** commands; use only the sequence in step **9**.
- Do not mark step **9** complete unless **`npm run build`** and **`npm test`** have **both** passed.
- Do not skip step **10** after step **9** succeeds unless the user asks to hold the push—then **`git push -u origin HEAD`** (or equivalent) publishes the branch to **`origin`**.
- Do not skip step **11** after a successful step **10**—open the PR into **`develop`** with a proper title and markdown body.
- Do not put **workflow / plumbing** in the PR **description** (steps **1–10**, lockfile regen, lint/install/build/test commands, merge mechanics)—summarize **code changes** from **`git diff develop...HEAD`** instead (see step **11**).
- Do not omit the **copy-paste PR description** when **`gh pr create`** fails; the user must be able to create the PR manually with one-select markdown.
- Do not **`git push --force`** (or **`--force-with-lease`**) without **explicit** user approval—**except** step **10** **`ci.yml`** push-protection remediation after you explain that history was rewritten.
- Do not run steps **12–13** before the user confirms the PR is **merged** and checks were OK.
- Do not delete the sync branch or open the **`develop`** → **`main`** PR without completing step **11** handoff, user confirmation, and—when **`gh`** works—a **`MERGED`** PR check in step **12**.
- Do not merge **`develop`** into **`main`** via local **`git merge`** / push in step **13**—only create the PR and share the link.

## Additional resources

None by default; keep this skill self-contained unless the repo adds `reference.md` here later.
