// Pure helpers for the on-demand "refresh data" flow. No fetch, no DOM — the
// network calls live in index.html; this module only interprets their results.

/**
 * @typedef {Object} WorkflowRun
 * @property {number} id
 * @property {string} event - e.g. "workflow_dispatch", "schedule".
 * @property {string} status - "queued" | "in_progress" | "completed" | ...
 * @property {string | null} conclusion - "success" | "failure" | "cancelled" | ... once completed.
 * @property {string} created_at - ISO 8601 timestamp.
 */

/**
 * @typedef {Object} RefreshState
 * @property {'running' | 'success' | 'failed'} phase
 * @property {string} message - Hebrew status text for the UI.
 */

/**
 * Pick the workflow_dispatch run that started after the click. The dispatch
 * endpoint returns no run id, so we match by creation time; `skewMs` absorbs
 * clock drift between the browser and GitHub.
 * @param {WorkflowRun[]} runs
 * @param {Date} dispatchedAt - Browser time just before the dispatch request.
 * @param {number} [skewMs]
 * @returns {WorkflowRun | null} The earliest matching run, or null if none yet.
 */
export function pickDispatchedRun(runs, dispatchedAt, skewMs = 30_000) {
  const cutoff = dispatchedAt.getTime() - skewMs;
  let best = null;
  for (const run of runs) {
    if (run.event !== 'workflow_dispatch') continue;
    const created = new Date(run.created_at).getTime();
    if (Number.isNaN(created) || created < cutoff) continue;
    if (!best || created < new Date(best.created_at).getTime()) best = run;
  }
  return best;
}

/**
 * Map a workflow run (or its absence) to a UI state.
 * @param {WorkflowRun | null} run - null while the run hasn't appeared yet.
 * @returns {RefreshState}
 */
export function describeRunState(run) {
  if (!run) return { phase: 'running', message: 'מפעיל…' };
  if (run.status !== 'completed') return { phase: 'running', message: 'מחשב…' };
  if (run.conclusion === 'success') return { phase: 'success', message: 'טוען נתונים…' };
  return { phase: 'failed', message: `הריצה נכשלה (${run.conclusion ?? 'unknown'})` };
}

/**
 * Hebrew explanation for a failed GitHub API response.
 * @param {number} status - HTTP status code.
 * @returns {string}
 */
export function describeApiError(status) {
  switch (status) {
    case 401: return 'הטוקן לא תקין או שפג תוקפו (401)';
    case 403: return 'לטוקן אין הרשאה מתאימה (403)';
    case 404: return 'הריפו או ה-workflow לא נמצאו, או שלטוקן אין גישה (404)';
    case 422: return 'GitHub דחה את הבקשה (422)';
    default: return `שגיאת GitHub (${status})`;
  }
}
