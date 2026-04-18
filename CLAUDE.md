# Project rules for Claude

## Commits and PRs

Never add yourself (Claude, any model) as a co-author, author, generator, or contributor on anything in this repository. That means:

- No `Co-Authored-By: Claude ...` trailer on commits.
- No `🤖 Generated with Claude Code` (or similar) line on commits or PR bodies.
- No "AI-assisted" / "written by Claude" language in commit messages, PR descriptions, code comments, or docs.

The default Claude Code workflow appends a `Co-Authored-By` trailer automatically — override that for this project. Write the commit message body, stop.

## .claude directory

`.claude/` is gitignored and must stay that way. Do not commit anything under it, and do not suggest removing it from `.gitignore`.
