# Exercise 3 — all seven techniques in one prompt

Feature: a summary line under the funds table (feature #9 in the list, adapted).

**[Dial effort, not words]** Run with `/effort high` — the prompt never says "think hard".

---

<!-- [Data first] the material comes before the question -->
<data>
@src/lib/formatting.js   — existing pure helpers: computeAllocationAmount, formatScore, Fund typedef
@index.html              — render() builds one <tr> per fund inside #fundsTable
@src/styles/tokens.css   — the only place styling values may come from
</data>

<!-- [Give a role] -->
<role>
You are a senior front-end engineer who keeps business logic in pure, tested functions.
</role>

<!-- [Brief once] goal · reason · scope · done-when, all up front -->
<context>
I split a monthly deposit across 7 funds. Each row's ₪ amount is rounded on its own,
so the rows may not add up to what I typed — I want to see the real total I'd be
depositing, plus one number that sums up the risk/return of the whole split.
</context>

<!-- [Be specific] file, function, inputs, outputs, constraints, check -->
<task>
1. Add `summarizeAllocation(funds, amount)` to `src/lib/formatting.js` returning
   `{ fundCount, totalAmount, weightedScore }`:
   - totalAmount = sum of computeAllocationAmount(weight, amount) per fund (so rounding shows).
   - weightedScore = Σ(weight × risk_adjusted_score) / Σ(weight) over funds whose score
     is not null, formatted with formatScore; "—" if none.
2. In `index.html`, add a `<tfoot>` row to #fundsTable that shows the summary and
   re-renders on amount input together with the body.
</task>

<constraints>
In: the function + JSDoc typedef, unit tests in tests/js/formatting.test.js, the tfoot.
Out: no new dependencies, no network/localStorage, no UI framework, no edits to
scripts/, data/ or the per-row cells. Style the tfoot only with existing CSS variables.
Note other bugs you see; don't fix them.
Done when `npm run check` is green.
</constraints>

<!-- [Multishot] 3 diverse examples, exact expected output -->
<examples>
<example>
funds: weights 0.5 / 0.5, scores 2.0 / 1.0, amount 1000
→ { fundCount: 2, totalAmount: 1000, weightedScore: { text: "1.50", sign: null } }
</example>
<example>
funds: weights 1/3 · 1/3 · 1/3, scores 1, 1, 1, amount 100
→ totalAmount: 99   (33 + 33 + 33 — rounding drift is shown, not hidden)
</example>
<example>
funds: weights 0.97 / 0.03, scores 1.2 / null, amount 0
→ { fundCount: 2, totalAmount: 0, weightedScore: { text: "1.20", sign: null } }
</example>
</examples>

<!-- [XML structure] everything above is tagged -->
<format>
A short list of changed files, then the diff.
</format>
