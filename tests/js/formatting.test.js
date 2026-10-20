import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPercent,
  formatVolatility,
  formatScore,
  computeAllocationAmount,
  formatWeightPercent,
  buildFundRowViewModel,
  formatRelativeTime,
  summarizeAllocation,
} from '../../src/lib/formatting.js';

test('formatPercent formats a positive fraction with a pos sign', () => {
  assert.deepEqual(formatPercent(0.031), { text: '3.1%', sign: 'pos' });
});

test('formatPercent formats a negative fraction with a neg sign', () => {
  assert.deepEqual(formatPercent(-0.052), { text: '-5.2%', sign: 'neg' });
});

test('formatPercent treats null/undefined as unknown', () => {
  assert.deepEqual(formatPercent(null), { text: '—', sign: null });
  assert.deepEqual(formatPercent(undefined), { text: '—', sign: null });
});

test('formatVolatility never assigns a sign, even for 0', () => {
  assert.deepEqual(formatVolatility(0.184), { text: '18.4%', sign: null });
  assert.deepEqual(formatVolatility(0), { text: '0.0%', sign: null });
  assert.deepEqual(formatVolatility(null), { text: '—', sign: null });
});

test('formatScore formats to two decimals by default', () => {
  assert.deepEqual(formatScore(1.679), { text: '1.68', sign: null });
  assert.deepEqual(formatScore(null), { text: '—', sign: null });
});

test('computeAllocationAmount rounds weight * amount', () => {
  assert.equal(computeAllocationAmount(0.143, 1000), 143);
  assert.equal(computeAllocationAmount(0.1449, 1000), 145);
});

test('formatWeightPercent formats a 0..1 weight as a percentage string', () => {
  assert.equal(formatWeightPercent(0.143), '14.3');
});

test('buildFundRowViewModel assembles a full row from a fund + amount', () => {
  const fund = {
    id: '5109889',
    name_en: 'Example Fund',
    name_he: 'קרן לדוגמה',
    suggested_weight: 0.2,
    metrics: {
      return_1m: -0.01,
      return_3m: 0.02,
      return_1y: 0.31,
      return_3y: 0.29,
      return_5y: null,
      volatility_1y: 0.18,
      volatility_3y: 0.17,
      volatility_5y: null,
      volatility_blended: 0.175,
      risk_adjusted_score: 1.68,
    },
  };

  const row = buildFundRowViewModel(fund, 1000);

  assert.equal(row.id, '5109889');
  assert.equal(row.nameEn, 'Example Fund');
  assert.equal(row.nameHe, 'קרן לדוגמה');
  assert.deepEqual(row.return1y, { text: '31.0%', sign: 'pos' });
  assert.deepEqual(row.return5y, { text: '—', sign: null });
  assert.deepEqual(row.volatilityBlended, { text: '17.5%', sign: null });
  assert.equal(row.weightPct, '20.0');
  assert.equal(row.amount, 200);
});

const NOW = new Date('2026-10-16T12:00:00Z');
const ago = (/** @type {number} */ s) => new Date(NOW.getTime() - s * 1000).toISOString();

test('formatRelativeTime says "just now" under a minute', () => {
  assert.equal(formatRelativeTime(ago(30), NOW), 'ממש עכשיו');
});

test('formatRelativeTime picks minutes, hours and days', () => {
  assert.equal(formatRelativeTime(ago(5 * 60), NOW), 'לפני 5 דקות');
  assert.equal(formatRelativeTime(ago(3 * 3600), NOW), 'לפני 3 שעות');
  assert.equal(formatRelativeTime(ago(4 * 86400), NOW), 'לפני 4 ימים');
});

test('formatRelativeTime uses "yesterday" for one day', () => {
  assert.equal(formatRelativeTime(ago(86400), NOW), 'אתמול');
});

test('formatRelativeTime returns "" for an unparseable date', () => {
  assert.equal(formatRelativeTime('not a date', NOW), '');
});

test('formatRelativeTime supports English', () => {
  assert.equal(formatRelativeTime(ago(30), NOW, 'en'), 'just now');
  assert.equal(formatRelativeTime(ago(5 * 60), NOW, 'en'), '5 minutes ago');
  assert.equal(formatRelativeTime(ago(3 * 3600), NOW, 'en'), '3 hours ago');
  assert.equal(formatRelativeTime(ago(4 * 86400), NOW, 'en'), '4 days ago');
  assert.equal(formatRelativeTime(ago(86400), NOW, 'en'), 'yesterday');
});

/**
 * @param {number} weight
 * @param {number | null} score
 * @returns {import('../../src/lib/formatting.js').Fund}
 */
const fundWith = (weight, score) => ({
  id: 'x',
  name_en: 'x',
  name_he: 'x',
  suggested_weight: weight,
  metrics: {
    return_1m: null, return_3m: null, return_1y: null, return_3y: null, return_5y: null,
    volatility_1y: null, volatility_3y: null, volatility_5y: null, volatility_blended: null,
    risk_adjusted_score: score,
  },
});

test('summarizeAllocation weights the score by allocation', () => {
  assert.deepEqual(summarizeAllocation([fundWith(0.5, 2), fundWith(0.5, 1)], 1000), {
    fundCount: 2,
    totalAmount: 1000,
    weightedScore: { text: '1.50', sign: null },
  });
});

test('summarizeAllocation sums rounded amounts so drift is visible', () => {
  const third = 1 / 3;
  const funds = [fundWith(third, 1), fundWith(third, 1), fundWith(third, 1)];
  assert.equal(summarizeAllocation(funds, 100).totalAmount, 99);
});

test('summarizeAllocation skips funds with no score', () => {
  assert.deepEqual(summarizeAllocation([fundWith(0.97, 1.2), fundWith(0.03, null)], 0), {
    fundCount: 2,
    totalAmount: 0,
    weightedScore: { text: '1.20', sign: null },
  });
});

test('summarizeAllocation shows "—" when no fund has a score', () => {
  assert.equal(summarizeAllocation([fundWith(1, null)], 100).weightedScore.text, '—');
});
