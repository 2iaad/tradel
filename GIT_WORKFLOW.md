# Git workflow — issue → PR → merge (CLI)

The full loop a tech lead expects: an issue tracks the work, a branch does the
work, a PR reviews it and **auto-closes the issue on merge**, then it lands in
`master`. All via `gh` CLI.

> **Core convention:** `master` is production and stays always-deployable. You
> never commit to it directly — every change goes through a branch and a PR.

---

## 0. One-time setup

```bash
gh auth login          # authenticate the CLI (once per machine)
gh auth status         # verify
```

---

## 1. Create an issue — with a label, self-assigned

```bash
gh issue create \
  --title "Add password reset flow" \
  --body "Users can't recover accounts. Add POST /auth/forgot + /auth/reset." \
  --label "feature" \
  --assignee "@me"
```

- `--assignee "@me"` — self-assign (special value, no need to type your login).
- `--label "feature"` — the label **must already exist** in the repo, or the
  command errors.

**Create a label first if it doesn't exist:**

```bash
gh label create feature --color 5319e7 --description "New functionality"
```

**Good issue conventions (what a tech lead looks for):**

- Title is a clear, imperative summary — *what* the outcome is, not "fix stuff".
- Body states the **problem and the intended change**, not just a restated title.
- Labels categorize it: `feature`, `bug`, `chore`, `docs`, `frontend`, …
- Assignee = who owns it. Self-assign what you're about to work on.

The command prints the new issue URL and number, e.g. `#31`. Note that number.

---

## 2. Branch, work, commit

Branch name follows `type/short-description` — matches your commit `[type]`
convention:

```bash
git checkout master
git pull                          # start from the latest master
git checkout -b feat/password-reset
```

Do the work, then commit. Reference the issue in the body so it's traceable:

```bash
git add .
git commit -m "[feat] add password reset endpoints

Refs #31"
git push -u origin feat/password-reset
```

- One branch per issue. One concern per branch.
- `Refs #31` links the commit to the issue (mention, not close — the PR closes).

---

## 3. Open a PR that closes the issue on merge

The magic is a **closing keyword** in the PR body: `Closes #31`. GitHub links
them, and merging the PR auto-closes the issue.

```bash
gh pr create \
  --base master \
  --title "[feat] password reset flow" \
  --body "$(cat <<'EOF'
## What
Adds POST /auth/forgot and POST /auth/reset with hashed, expiring tokens.

## Why
Users had no way to recover a locked-out account.

## Testing
- Requested reset → link logged → reset succeeds → old password rejected.

Closes #31
EOF
)" \
  --label "feature" \
  --assignee "@me"
```

**Closing keywords** (any of these + `#number` in the PR body auto-close on
merge): `Closes`, `Fixes`, `Resolves`. Use `Closes #31`.

**Good PR conventions:**

- Title mirrors the commit style (`[feat] …`).
- Body answers **What / Why / How tested** — a reviewer shouldn't have to guess.
- `Closes #N` — one line, links and closes the issue automatically.
- Base branch is explicit (`--base master`).

`--fill` shortcut: `gh pr create --fill` autofills title+body from your commits
— handy, but write the body by hand when you need `Closes #N` and a proper
description. A tech lead prefers the described PR.

---

## 4. Review, then merge

Never merge your own PR blindly on a team — request review first:

```bash
gh pr view --web           # open in browser to eyeball the diff
gh pr checks               # confirm CI passed before merging
```

Merge with **squash** (cleanest history — the whole PR becomes one commit on
`master`) and delete the branch:

```bash
gh pr merge --squash --delete-branch
```

- `--squash` — collapses all branch commits into one on `master`. Most teams
  default to this: linear, readable history, one commit per PR/issue.
- `--delete-branch` — removes the merged branch locally + remotely (housekeeping).
- Alternatives: `--merge` (keeps every commit + a merge commit), `--rebase`
  (replays commits, no merge commit). Pick the one your team standardizes on;
  **squash is the safe default**.

On merge, issue `#31` closes automatically (from `Closes #31`).

Sync your local master afterward:

```bash
git checkout master
git pull
```

---

## The whole loop, condensed

```bash
# 1. issue
gh issue create --title "Add X" --body "..." --label feature --assignee "@me"   # → #31

# 2. branch + work
git checkout master && git pull
git checkout -b feat/x
git add . && git commit -m "[feat] add X

Refs #31"
git push -u origin feat/x

# 3. PR (Closes #31 in body → auto-closes on merge)
gh pr create --base master --title "[feat] add X" \
  --body "What/Why/Testing... Closes #31" --assignee "@me"

# 4. merge
gh pr checks
gh pr merge --squash --delete-branch
git checkout master && git pull
```

---

## Why a tech lead is happy with this

- **Traceability:** issue → branch → PR → commit are all linked. Anyone can walk
  the history and know *why* a change exists.
- **`master` is never touched directly** — every change is reviewed via a PR.
- **Issues auto-close** — no stale open issues, no manual bookkeeping.
- **Clean history** — squash means one readable commit per unit of work.
- **Ownership is explicit** — labels + assignee say what kind of work and whose.
