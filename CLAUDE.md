# Amphelo Health — Claude Code Instructions

## Git & Deployment Workflow

After making any code changes, always follow these steps in order:

1. **Stage and commit** to the current working branch (`claude/session_*`)
2. **Push** the working branch to origin
3. **Merge to `main` and push** — Vercel deploys from `main`:
   ```
   git checkout main
   git merge <working-branch> --no-edit
   git push -u origin main
   git checkout <working-branch>
   ```

Do this automatically after every set of changes — do not wait to be asked.

## Commit Signing

Commit signing is disabled for this repo (`commit.gpgsign = false`). Do not use `--no-verify` or `-c commit.gpgsign=false` — it's already handled via `.git/config`.

## GitHub Remote

The remote URL includes an auth token. Do not remove or replace it.
