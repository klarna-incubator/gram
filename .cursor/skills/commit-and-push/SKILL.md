---
name: commit-and-push
description: >-
  End-to-end Gram workflow in the internal Klarna clone: verify repo root under
  ~/Klarna/gram, verify origin (Klarna GHE) and github (klarna-incubator/gram) remotes,
  require staged changes that are homogeneous (either all Klarna-only for origin or all
  open-source for github—never mixed in one index), route paths with explicit user
  confirmation, run npm ci/build/lint for internal-only changes, use a github/main
  worktree for upstream paths, then commit and push to the correct remote; for
  Klarna-internal PRs propose base develop only, never main. Use when
  implementing, committing, or pushing Gram changes; when unsure upstream vs Klarna-only;
  or when the user previously used gram-change-routing for the same decisions.
disable-model-invocation: false
---

# Commit and push (Gram)

Single entry point: **where to change code**, **checks before commit**, and **which remote to push** — for the **internal** monorepo clone. Open-source sync after merges: [pull-opensource-github](../pull-opensource-github/SKILL.md).

Historical alias: [gram-change-routing](../gram-change-routing/SKILL.md) (same rules; kept in-repo for links and older prompts).

---

## User confirmation (required)

This workflow is **still being refined**. **Ask the user to confirm before every action**—do not run commands, edit files, commit, push, open PRs, or start related skills until they approve that specific step.

For each step:

1. **State** what you intend to do (command, paths, branch name, remote).
2. **Wait** for explicit approval (e.g. “yes”, “go ahead”, “proceed with step 2”).
3. **Then** perform only that step and report the outcome.
4. **Repeat** for the next step.

If the user rejects or redirects a step, stop and replan—do not continue the workflow silently.

---

## 1. Confirm internal Gram repo

Before any `git` write or push:

1. Resolve the repo root: `git rev-parse --show-toplevel`.
2. Ensure the path matches the internal clone layout — it **usually** resides at:

   `Users/<username>/Klarna/gram`

   On macOS/Linux this is typically `$HOME/Klarna/gram` (e.g. `/Users/pauline.didier/Klarna/gram`).

3. If the root is **not** under `.../Klarna/gram`, **stop** and tell the user they are not in the internal Gram clone; do not commit or push until they `cd` to the correct directory or clarify which clone they intend.

---

## 2. Confirm both remotes (`github` + `origin`)

Run `git remote -v` from the repo root (after user confirmation, per above).

### Required remotes

| Remote   | Role        | Push/fetch URL must identify |
|----------|-------------|------------------------------|
| `github` | Open source | `git@github.com:klarna-incubator/gram.git` (or equivalent HTTPS for the same repo) |
| `origin` | Internal    | Klarna GHE host with repository `klarna/gram` (SSH shape `*@klarna.ghe.com:klarna/gram.git`) |

**Example** (`git remote -v`; the `origin` user prefix can differ per machine/account):

```text
github	git@github.com:klarna-incubator/gram.git (fetch)
github	git@github.com:klarna-incubator/gram.git (push)
origin	klarna_225322@klarna.ghe.com:klarna/gram.git (fetch)
origin	klarna_225322@klarna.ghe.com:klarna/gram.git (push)
```

### Ensure the `github` remote

Before `git fetch github` or any open-source push:

- If **`github` is missing**, propose adding it, then run (after approval):

  ```bash
  git remote add github git@github.com:klarna-incubator/gram.git
  ```

- If **`github` exists** and points at `klarna-incubator/gram` (SSH URL above or `https://github.com/klarna-incubator/gram.git`), continue.
- If **`github` exists with a different URL**, stop and ask the user—do not change or remove the remote without explicit permission.

If **`origin`** is missing or is **not** the Klarna `gram` repo, stop and ask the user to fix remotes before committing.

More remote setup detail: [pull-opensource-github](../pull-opensource-github/SKILL.md) step 1.

---

## 3. Repositories (routing table)

| Target | Remote | Repository | When |
|--------|--------|------------|------|
| **Open source** | `github` | `git@github.com:klarna-incubator/gram.git` (default branch `main`) | File exists on `github/main` |
| **Klarna** | `origin` | Klarna GHE `gram` (this clone under `~/Klarna/gram`) | File does **not** exist on `github/main` |

---

## 4. Rule (default)

**Any path that exists on `github/main` must be changed in the open-source project**, not only in the Klarna fork.

Before editing, classify every file you plan to touch.

### Check if a path exists upstream

From the Gram repo root:

```bash
git fetch github main
git cat-file -e "github/main:${path}" 2>/dev/null && echo "open-source"
```

For directories, check a representative file or list:

```bash
git ls-tree -r --name-only github/main -- "${path}"
```

### Klarna-only examples (typical)

Paths that often exist only on `origin` / not on `github/main`: `infra/`, `kep-pipeline.yaml`, `.klarna-system-metadata.json`, `plugins/jupiterone/`, Klarna-specific docs, `.cursor/skills/` in this fork. Re-verify with `git cat-file` / `git ls-tree`—do not rely on memory.

### Always open source — GitHub Actions / CI (mandatory)

**Never** commit or push changes under `.github/workflows/` (including `ci.yml`) to **`origin`**. Klarna GHE enforces push protection on these paths.

| Path | Target | Notes |
|------|--------|-------|
| `.github/workflows/**` | **`github` only** | Always land CI/workflow changes in `klarna-incubator/gram` via the open-source branch workflow; sync into the internal clone later with [pull-opensource-github](../pull-opensource-github/SKILL.md) if needed. |

When preparing a branch for **`origin`** (merge, sync, or internal PR):

1. **Before push**, diff against the internal base (usually `origin/develop`) and ensure **no** `.github/workflows/**` changes are included in the **resulting tree**.
2. **Also check commit history**: Klarna GHE push protection rejects pushes if **any commit** in the range being pushed touched `.github/workflows/**`—restoring `ci.yml` at the tip is **not** enough after merging `github/main` or open-source release tags. Prefer a **single squashed commit** on `origin/develop` with workflow files restored from the internal base:

   ```bash
   git fetch origin develop
   git reset --soft origin/develop
   git restore --source=origin/develop --staged --worktree .github/workflows/
   git commit -m "feat(...): sync … (CI excluded; github only)"
   ```

3. Do **not** ask the user to choose between bypassing push protection and dropping CI changes—the default is **always** leave CI on `github`.

---

## 5. Exception — discuss with the user first

These files exist in both trees but are **environment-specific**. Do **not** edit them in either repo until the user confirms target and intent:

- `config/development.ts`
- `config/production.ts`
- `config/staging.ts`
- `config/default.ts`

Ask whether the change belongs in open source, Klarna, or both. **Both** still means **two separate commits** (each with its own homogeneous staged set)—e.g. open-source PR first, then a Klarna-only commit if needed—not one commit spanning two remotes.

---

## 6. Prerequisite: staged changes

**First** check the index in the Klarna Gram repo root:

```bash
git diff --cached --name-only
```

- If the output is **empty**, **stop**. Tell the user to **stage their changes** (`git add <paths>`) and run this skill again. Do not continue routing, remotes, fetch, or worktrees.
- If there are staged paths, use **only those paths** as the planned change set (unless the user explicitly adds or removes paths after you list them).

### Homogeneous staging (required)

For **one** `git commit` / push cycle, the staged set must map to **exactly one** remote:

| Staged set | Push target |
|------------|-------------|
| **All** paths classified **Klarna-only** (internal) | `origin` (after pre-PR checks when applicable) |
| **All** paths classified **open source** | `github` via **Open-source branch workflow** (worktree or OSS clone)—never commit those paths to `origin` only |

**Do not** run `git commit` if the index mixes **Klarna-only** and **open-source** paths—**stop** and tell the user to split work: `git reset` (or unstage), then `git add` only one category, complete commit and push for that remote, then stage the other category in a **later** pass (order: usually open-source first if the user depends on upstream merging before Klarna-only follow-ups).

**Config-exception** paths are unresolved until the user picks a target; they must join a staged set that is **entirely** destined for that same remote after resolution. Do not combine “ask user” paths with a commit to the other remote until intent is explicit.

This rule exists so **every commit has an unambiguous push destination** (`git push` to `origin` **or** to `github`, not both implied by one commit).

---

## 7. Workflow (commit / push)

Each numbered step is a **separate confirmation gate**—complete one, report, get approval, then continue.

1. **List staged paths** from `git diff --cached --name-only`. **Confirm** the list with the user before any other git commands.
2. **`git fetch github main`**.
3. **Classify each path** (open source / Klarna-only / config exception). **Confirm** the routing table:

   ```text
   path                          → target
   api/src/.../router.ts         → open source (github)
   infra/staging/rds.tf          → Klarna (origin)
   config/production.ts          → ask user
   ```

4. **Single-target (homogeneity) gate:** every staged path must resolve to the **same** destination (`github` **or** `origin`). If any path is Klarna-only and any path is open-source, **stop**—do not commit; ask the user to unstage one side and re-stage a homogeneous set. If any path is still a **config exception** without a chosen target, **stop** until the user decides and the index matches that target only. If any staged path is under **`.github/workflows/`**, the destination must be **`github`**—never `origin`.
5. **Confirm overall plan** — one remote, one branch/worktree name if open source—before implementing anything not yet applied.
6. **Act** (one sub-step at a time, each confirmed):
   - **All open source:** follow **Open-source branch workflow** below only.
   - **All Klarna-only:** run **Klarna-internal pre-PR checks** below, then commit and push to `origin` only after separate confirmations for commit and push; optionally propose a PR **into `develop` only** (see **§10 Klarna-only push and internal PR**)—never into `main`.
7. **After upstream merges:** ask before starting [pull-opensource-github](../pull-opensource-github/SKILL.md); confirm each step of that skill the same way.

Do **not** push to the wrong remote to “save time.” If routing is ambiguous, ask the user before `git commit` or `git push`.

---

## 8. Klarna-internal pre-PR checks

Run **only** when the user has **confirmed** that **all** staged changes are **Gram internal** (every path is Klarna-only—no open-source paths, no unresolved config exceptions).

From the **Klarna Gram repo root**, after user approval to run CI checks, run in order:

```bash
npm ci
npm run build
npm run lint
```

| Command | On failure |
|---------|------------|
| `npm ci` | Stop checks. **Inform** the user (logs, likely cause). They may still choose to **commit** and open a PR—do not block unless they decline. |
| `npm run build` | Same as `npm ci`. |
| `npm run lint` | **Automatically** run `npm run lint-fix`, then `npm run lint` again. If still failing, **inform** the user; they may still choose to commit. |

If `npm run lint-fix` changes files:

- Report what changed.
- Tell the user to **`git add`** any fixes they want in the commit (and re-run from **Prerequisite: staged changes** if the index changed materially).

**Do not** commit on the user’s behalf after `lint-fix` without confirmation.

When all three commands pass, report success and ask whether to proceed with **commit** and, after push, whether to open a **Klarna-internal PR**—see **Klarna-only push and internal PR** (§10) (`develop` only).

Do not read **`.github/workflows/ci.yml`** for this step—use only the commands above.

---

## 9. Open-source branch workflow

**Required** when any planned path is classified as open source. **Confirm each sub-step** before executing it.

Use a **git worktree** on `github/main` so edits are not mixed with Klarna-only commits (propose `BRANCH` and `WORKTREE` paths; get approval first):

```bash
# From the Klarna Gram repo root
git fetch github main
BRANCH="fix/short-description"   # or feat/... — conventional, URL-safe
WORKTREE="../gram-oss-${BRANCH//\//-}"   # sibling dir, e.g. ../gram-oss-fix-short-description

git worktree add -b "$BRANCH" "$WORKTREE" github/main
cd "$WORKTREE"
```

1. **Confirm** then implement **only** the open-source paths in the worktree.
2. **Confirm** commit message, then commit (Conventional Commits).
3. **Confirm** then push to the open-source remote:

   ```bash
   git push -u github HEAD
   ```

4. **Confirm** PR title and body, then open a PR against `klarna-incubator/gram` **`main`** (`gh pr create --repo klarna-incubator/gram` from the worktree, or give the user the compare URL).
5. Share the branch name and PR URL. Leave Klarna `origin` unchanged for those paths until upstream is merged and synced.

**Cleanup** (optional, after PR is merged or abandoned)—**confirm** before removing worktree or deleting branch:

```bash
cd /path/to/Klarna/gram   # Klarna clone root
git worktree remove "$WORKTREE"
git branch -d "$BRANCH"    # if fully merged upstream
```

If `git push github` fails (auth, permissions), stop and tell the user — do not fall back to committing open-source paths only on `origin` unless they explicitly accept a temporary fork-only patch.

If a dedicated open-source clone already exists, `cd` there, `git fetch github main`, `git checkout -b "$BRANCH" github/main`, then implement and `git push -u github HEAD` — same rules.

---

## 10. Klarna-only push and internal PR

For **all Klarna-only** homogeneous changes (after §8 checks and user approvals).

**Before push**, verify the branch does not modify `.github/workflows/**` relative to `origin/develop` (see **Always open source — GitHub Actions / CI** in §4). Restore from `origin/develop` if a merge introduced workflow diffs.

**Push to `origin`:**

```bash
git push -u origin HEAD
```

**Klarna-internal pull request (optional)** — after a successful push to `origin`, you **may propose** opening a PR on the Klarna GHE `gram` repo. **Base branch must be `develop`—never `main`.** Confirm title, body, and `gh` invocation with the user before running.

Example (default remote is usually `origin`; adjust `--repo` if needed for your `gh` setup):

```bash
gh pr create --base develop --title "…" --body "$(cat <<'EOF'
…
EOF
)"
```

Do **not** use `--base main` for Klarna-internal PRs.

---

## 11. Anti-patterns

- Do not proceed if there are **no staged changes**—ask the user to `git add` first.
- Do not run git commands, edit files, commit, push, or open PRs without **explicit user confirmation** for that step.
- Do not batch multiple workflow steps in one turn without approval between them.
- Do not edit open-source–classified paths in the Klarna clone without creating and pushing an open-source branch first.
- Do not edit `api/`, `app/`, `core/`, or `plugins/*` shared code only on Klarna when the same path exists on `github/main`.
- Do not skip routing because the task sounds “internal” — check the path.
- Do not change `config/default.ts` (or the other three config files) without user confirmation.
- Do not assume `HEAD` matches `github/main`; always check the path on `github/main`.
- Do not skip **Klarna-internal pre-PR checks** when all changes are internal and the user is about to commit or open a PR on `origin`.
- Do not run `npm run lint-fix` for failures of `npm ci` or `npm run build`—only for `npm run lint`.
- Do not **`git commit`** with **mixed** Klarna-only and open-source paths in the index—split into two homogeneous staged passes so each commit pushes to **one** remote only.
- Do not open or suggest a **Klarna-internal** PR with **`main`** as the base branch—**`develop` only** (open-source PRs against `klarna-incubator/gram` **`main`** are unchanged; see **Open-source branch workflow** above).
- Do not push **`.github/workflows/**`** changes to **`origin`**—CI belongs on **`github`** only; restore workflow files from `origin/develop` before an internal push rather than requesting push-protection bypass.
