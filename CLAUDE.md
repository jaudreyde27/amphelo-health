# Amphelo Health — Claude Code Instructions

## Git & Deployment Workflow

After making any code changes, always follow these steps in order:

1. **Stage and commit** to the current working branch (`claude/session_*`)
2. **Push** the working branch to origin

That's it. A GitHub Actions workflow (`.github/workflows/deploy-to-main.yml`) automatically merges every `claude/**` push into `main`, which triggers Vercel to deploy.

Do **not** attempt to push to `main` directly — the environment blocks it with 403.

## Commit Signing

Commit signing is disabled for this repo (`commit.gpgsign = false`). Do not use `--no-verify` or `-c commit.gpgsign=false` — it's already handled via `.git/config`.

## GitHub Remote

The remote URL includes an auth token. Do not remove or replace it.
