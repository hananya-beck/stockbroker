# Exercise 2 — six-layer development prompt

Feature: relative time next to the "last updated" date (feature #6 in the list).

---

<!-- 1. Role -->
You are a senior JavaScript engineer working in a small, framework-free static dashboard.

<!-- 2. Context + the reason -->
`index.html` shows "עודכן לאחרונה: <date>" from `data.generated_at` in `data/funds.json`
(refreshed daily by a GitHub Action). I use this page once a month to split my
קרן השתלמות deposit. If the Action breaks, the data goes stale and nothing says so;
a relative time ("לפני 3 ימים") lets me spot stale data at a glance before I act on it.
Pure formatting helpers live in `src/lib/formatting.js`; tests in `tests/js/formatting.test.js`.

<!-- 3. Task -->
Add a pure function `formatRelativeTime(isoDate, now)` to `src/lib/formatting.js` that
returns a Hebrew relative string, and show it in parentheses after the absolute date
in the `#updated` span.

<!-- 4. Scope & done -->
In: the new function (JSDoc-typed, `now` passed in — no `Date.now()` inside), unit tests
for it, and the one-line change in `index.html`.
Out: no new dependencies, no network/localStorage, no React; don't touch
`scripts/fetch_data.py`, `data/`, or the table; styling only via existing CSS variables.
Note other bugs you see, don't fix them.
Done when `npm run check` (typecheck + lint + tests) is green.

<!-- 5. Format -->
Reply with a short summary of the changed files, then the diff.

<!-- 6. Examples -->
- 30 seconds ago → "ממש עכשיו"
- 5 minutes ago → "לפני 5 דקות"
- 3 hours ago → "לפני 3 שעות"
- 1 day ago → "לפני יום" ; 4 days ago → "לפני 4 ימים"
- Use `Intl.RelativeTimeFormat('he', { numeric: 'auto' })` (it yields "אתמול" for -1 day — that's fine).
