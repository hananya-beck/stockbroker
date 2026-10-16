# Exercise 7: why `/context` shows 4 memory files

"Memory files" in `/context` counts every instruction file loaded into context, not only the auto-memory notes:

| # | File | Type | What it is |
|---|------|------|------------|
| 1 | `~\.claude\CLAUDE.md` | User | Global instructions. It only contains `@RTK.md` (15 tokens). |
| 2 | `~\.claude\RTK.md` | User | Pulled in by the `@RTK.md` import, so it counts as its own file. |
| 3 | `stockbroker\.claude\rules\static-deploy.md` | Project | The always-on rule added in Exercise 6. |
| 4 | `...\memory\MEMORY.md` | AutoMem | The auto-memory index from Exercise 7. |

The category covers CLAUDE.md files, anything they import, `.claude/rules/*.md`, and the auto-memory `MEMORY.md`.

The individual memory notes aren't counted. `data-bot-push-conflicts.md` is listed in `MEMORY.md` but isn't loaded at startup, which is why the auto-memory only costs 64 tokens. It gets read only when it's relevant.

A path-scoped rule (one with `paths:` frontmatter) also stays out of the count until you work on a file that matches its paths, so the count can change during a session.
