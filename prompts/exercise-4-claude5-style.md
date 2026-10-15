# Exercise 4 — a Claude 5–style development prompt

Feature: a "רענן נתונים" (Refresh Information) button that re-runs the daily calculation on demand.

Run with `/effort high` — the prompt never asks it to think harder.

---

<context>
@index.html  @src/lib/formatting.js  @.github/workflows/update-data.yml  @scripts/fetch_data.py

The dashboard is a static GitHub Pages site (hananya-beck/stockbroker). The numbers come
from `scripts/fetch_data.py`, which the "Update fund data" workflow runs once a day and
commits as `data/funds.json`. The workflow already has `workflow_dispatch`. I want to
refresh the numbers on demand — e.g. right before I split my monthly deposit — instead of
waiting for tomorrow's 05:00 UTC run.
</context>

<goal>
Add a "רענן נתונים" button to the amount card in `index.html`. Clicking it triggers the
workflow via the GitHub REST API (`workflow_dispatch` on `main`), waits for that run to
finish, then loads the new `data/funds.json` and re-renders the table, summary row and
"עודכן לאחרונה" line. While it runs, the page shows a waiting indication (spinner + status
text: "מפעיל…" / "מחשב…" / "טוען נתונים…") and the button is disabled, so it cannot be
clicked again until the run succeeds or fails. On failure, show the reason next to the
button and re-enable it.
</goal>

<auth>
The page is public, so a token can't live in the code or in the repo. Ask for a
fine-grained GitHub token (Actions: read & write, Contents: read, this repo only) with a
password input the first time the button is clicked, and keep it in a JS variable for the
current tab only. Use memory rather than localStorage because the project rules forbid
browser storage and a stored token would outlive the tab.
</auth>

<constraints>
- Put the network calls (GitHub API, fetch) in `index.html`. Keep `src/lib/` pure: no
  `fetch`, no DOM. Any logic worth testing goes there as a pure function — e.g. mapping a
  workflow run's `status`/`conclusion` to a UI state and message, or picking the run that
  started after the click.
- Load the new data from the GitHub contents API after the run finishes, not from the Pages
  URL, because Pages redeploys a minute or more after the commit and would serve the old file.
- Style only with existing CSS variables from `src/styles/tokens.css`; add a spinner with a
  CSS animation, no images or libraries.
- No new dependencies. Don't change `scripts/fetch_data.py`, `data/` or the workflow file.
- Note any other bugs you see, but don't fix them.
</constraints>

<done_when>
- `npm run check` is green, with unit tests for the new pure function(s).
- Serving the site locally (`python -m http.server`) and clicking the button with a valid
  token starts a run visible under Actions, shows the waiting state and the disabled
  button, and updates the table once the run finishes. A bad token shows an error and
  re-enables the button.
- Your report lists the changed files, how you verified the UI, and any other bugs you
  noticed (or says there were none).
</done_when>
