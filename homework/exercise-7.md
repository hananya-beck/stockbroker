# Exercise 7 — Something Claude remembers

## The fact
The daily GitHub Action ("Update fund data") commits `data/funds.json` to `main`, so a push that touches it usually gets rejected. The fix is to rebase onto `origin/main` and, if `funds.json` conflicts, keep my regenerated copy with `git checkout --theirs`. During a rebase `--theirs` is my commit, which is the opposite of what you'd expect. Never force-push over the bot.

A fresh session gets this wrong. On 2026-10-16 the first push of the fetch-script fix was rejected, and the bot's copy had been computed with the old scoring, so keeping the wrong side would have shipped stale weights.

## What was written
`~/.claude/projects/C--Users-Hananya-projects-stockbroker/memory/`
- `MEMORY.md`: one index line pointing to the topic file.
- `data-bot-push-conflicts.md`: the fact, with frontmatter (`type: project`) and **Why** / **How to apply** lines.

## What loads at session start
Only `MEMORY.md` loads, up to its first 200 lines / 25 KB. Topic files like `data-bot-push-conflicts.md` are read only when the index line looks relevant, so the index stays one line per memory.

## How to verify
In a fresh session, make a change to `data/funds.json` and say "commit and push". Claude should pull with rebase first and resolve a `funds.json` conflict with `--theirs`, without being told.
