# stockbroker: how to work here

## Forbidden
- No `fetch`, DOM access or browser APIs in `src/lib/`. It's the pure, unit-tested core, and network and DOM code lives in `index.html`.
- No build step, bundler, framework or npm runtime dependency. GitHub Pages serves the files as committed, so they must run as native ES modules.
- No leading `/` in paths. The site lives under `/stockbroker/`, so absolute paths 404 on Pages.
- No browser storage (`localStorage`, `sessionStorage`, IndexedDB, cookies). A stored GitHub token would outlive the tab on a public page.
- No secrets in the repo, and no token in code or URLs. The repo and site are public, so tokens are typed in at runtime and kept in a JS variable.
- Don't hand-edit `data/funds.json`. The daily bot regenerates and commits it, so edits get overwritten.
- Never force-push to `main`. It would wipe the bot's data commits, so pull with rebase instead.

## Conventions
- UI text is Hebrew and the page is RTL. Match the existing wording ("רענן נתונים", "עודכן לאחרונה").
- Colors, spacing and fonts come from `src/styles/tokens.css` custom properties. Never hard-code a color.
- Logic worth testing goes in `src/lib/` as a pure function (its own `CLAUDE.md` has the details).
- Show every failure to the user (status text next to the control, plus an alert for auth errors like a 401). Never fail silently.
- Exercise write-ups go in `homework/exercise-N.md`, and development prompts go in `prompts/`.

## Stack
- Front end: static `index.html` plus ES modules in `src/lib/`, type-checked through `jsconfig.json` (TypeScript `checkJs`) and linted with ESLint 9.
- Data: `scripts/fetch_data.py` (Python 3.12, standard library only) scrapes bizportal and writes `data/funds.json`. `.github/workflows/update-data.yml` runs it daily at 05:00 UTC, and also on `workflow_dispatch` from the refresh button.
- Hosting: GitHub Pages from `main`.

## Commands
- `npm run check` runs the typecheck, lint and JS tests. Run it before every front-end commit.
- `python -m pytest tests -q` runs the Python tests, which are offline.
- `python scripts/fetch_data.py` regenerates `data/funds.json` locally (don't commit the result by hand).
- `python -m http.server` serves the site at http://localhost:8000.

## Open questions
- bizportal's endpoint is undocumented and may break or be disallowed by their terms. There's no fallback source yet.
- The score is a heuristic over past returns, not financial advice. The 25/35/40 window weights and `MIN_WEIGHT` haven't been validated.
