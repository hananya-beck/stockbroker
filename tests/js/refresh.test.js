import { test } from 'node:test';
import assert from 'node:assert/strict';
import { URLSearchParams } from 'node:url';
import { dispatchedRunId, pickDispatchedRun, describeRunState, describeApiError, dispatchedRunsQuery, isPastDeadline } from '../../src/lib/refresh.js';

test('dispatchedRunId reads workflow_run_id from a 2026-03-10 dispatch response', () => {
  const body = { workflow_run_id: 18234567890, run_url: 'https://api.github.com/x', html_url: 'https://github.com/x' };
  assert.equal(dispatchedRunId(body), 18234567890);
});

test('dispatchedRunId returns null for an empty (204) response', () => {
  assert.equal(dispatchedRunId(null), null);
  assert.equal(dispatchedRunId(undefined), null);
  assert.equal(dispatchedRunId({}), null);
});

test('dispatchedRunId rejects ids that are not positive integers', () => {
  for (const workflow_run_id of ['123', 0, -5, 1.5, NaN, null]) {
    assert.equal(dispatchedRunId({ workflow_run_id }), null);
  }
});

const clicked = new Date('2026-10-16T10:00:00Z');

/** @param {Partial<import('../../src/lib/refresh.js').WorkflowRun>} over */
function run(over) {
  return { id: 1, event: 'workflow_dispatch', status: 'queued', conclusion: null, created_at: '2026-10-16T10:00:05Z', ...over };
}

test('pickDispatchedRun returns null when no runs exist', () => {
  assert.equal(pickDispatchedRun([], clicked), null);
});

test('pickDispatchedRun ignores runs created before the click', () => {
  assert.equal(pickDispatchedRun([run({ created_at: '2026-10-16T09:00:00Z' })], clicked), null);
});

test('pickDispatchedRun ignores scheduled runs', () => {
  assert.equal(pickDispatchedRun([run({ event: 'schedule' })], clicked), null);
});

test('pickDispatchedRun tolerates small clock skew', () => {
  const r = run({ created_at: '2026-10-16T09:59:50Z' });
  assert.equal(pickDispatchedRun([r], clicked), r);
});

test('pickDispatchedRun picks the earliest run after the click', () => {
  const later = run({ id: 2, created_at: '2026-10-16T10:01:00Z' });
  const first = run({ id: 1, created_at: '2026-10-16T10:00:03Z' });
  assert.equal(pickDispatchedRun([later, first], clicked)?.id, 1);
});

test('describeRunState: no run yet is dispatching', () => {
  assert.deepEqual(describeRunState(null), { phase: 'running', message: 'מפעיל…' });
});

test('describeRunState: queued and in_progress are computing', () => {
  assert.equal(describeRunState(run({ status: 'queued' })).message, 'מחשב…');
  assert.equal(describeRunState(run({ status: 'in_progress' })).phase, 'running');
});

test('describeRunState: completed success loads data', () => {
  assert.deepEqual(describeRunState(run({ status: 'completed', conclusion: 'success' })), { phase: 'success', message: 'טוען נתונים…' });
});

test('describeRunState: completed failure reports the conclusion', () => {
  assert.deepEqual(describeRunState(run({ status: 'completed', conclusion: 'failure' })), { phase: 'failed', message: 'הריצה נכשלה (failure)' });
});

test('describeApiError explains auth failures', () => {
  assert.match(describeApiError(401), /401/);
  assert.match(describeApiError(500), /500/);
});

test('describeRunState defaults to Hebrew when lang is omitted', () => {
  assert.equal(describeRunState(null).message, 'מפעיל…');
});

test('describeRunState supports English', () => {
  assert.deepEqual(describeRunState(null, 'en'), { phase: 'running', message: 'Starting…' });
  assert.equal(describeRunState(run({ status: 'queued' }), 'en').message, 'Computing…');
  assert.deepEqual(
    describeRunState(run({ status: 'completed', conclusion: 'success' }), 'en'),
    { phase: 'success', message: 'Loading data…' },
  );
  assert.deepEqual(
    describeRunState(run({ status: 'completed', conclusion: 'failure' }), 'en'),
    { phase: 'failed', message: 'Run failed (failure)' },
  );
});

test('describeApiError supports English', () => {
  assert.match(describeApiError(401, 'en'), /401/);
  assert.match(describeApiError(401, 'en'), /[Tt]oken/);
  assert.match(describeApiError(500, 'en'), /500/);
});

test('dispatchedRunsQuery filters to dispatch runs on main since the click minus skew', () => {
  const q = new URLSearchParams(dispatchedRunsQuery(new Date('2026-10-18T05:00:30Z')));
  assert.equal(q.get('event'), 'workflow_dispatch');
  assert.equal(q.get('branch'), 'main');
  assert.equal(q.get('created'), '>=2026-10-18T05:00:00.000Z');
  assert.equal(q.get('per_page'), '10');
});

test('isPastDeadline is true only once the timeout has elapsed', () => {
  assert.equal(isPastDeadline(1000, 1000 + 500, 500), false);
  assert.equal(isPastDeadline(1000, 1000 + 501, 500), true);
});
