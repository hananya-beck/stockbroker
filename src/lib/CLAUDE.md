# src/lib: the pure core

- No `fetch`, DOM, timers, `Date.now()` or randomness. Callers pass in times such as `dispatchedAt` and data such as runs or funds, so every function is deterministic and testable under `node --test`.
- Named exports only, with no default exports and no module-level state.
- Every export has JSDoc with `@param` and `@returns`. Shared shapes are `@typedef`s that tests import through `import('../../src/lib/x.js').Type`.
- Unknown or missing numbers (`null`, `undefined`, `NaN`) render as `'—'` with `sign: null`. They never throw or render `NaN`.
- Values are fractions (`0.031`), not percents. Only formatters turn them into display text.
- User-facing strings are Hebrew and are returned to the caller, never displayed here.
- Each module `x.js` has `tests/js/x.test.js`. Add a test for every new export and every edge case (empty input, null, boundary).
