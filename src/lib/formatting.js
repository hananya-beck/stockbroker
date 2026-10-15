// Framework-free core: no React/UI-framework import, no network calls, no
// localStorage/IndexedDB, no writes. Pure functions only — safe to unit test
// without a DOM or a browser.

/**
 * @typedef {Object} FormattedValue
 * @property {string} text - Display text, or "—" when the value is unknown.
 * @property {'pos'|'neg'|null} sign - Sign class for coloring, or null when
 *   the value is unknown or sign-less (e.g. volatility, score).
 */

/**
 * @param {number | null | undefined} value - A fraction, e.g. 0.031 for 3.1%.
 * @param {{ decimals?: number }} [options]
 * @returns {FormattedValue}
 */
export function formatPercent(value, options = {}) {
  const decimals = options.decimals ?? 1;
  if (value === null || value === undefined) {
    return { text: '—', sign: null };
  }
  return {
    text: `${(value * 100).toFixed(decimals)}%`,
    sign: value >= 0 ? 'pos' : 'neg',
  };
}

/**
 * Volatility is always non-negative, so it's never colored pos/neg.
 * @param {number | null | undefined} value - A fraction, e.g. 0.184 for 18.4%.
 * @param {{ decimals?: number }} [options]
 * @returns {FormattedValue}
 */
export function formatVolatility(value, options = {}) {
  const decimals = options.decimals ?? 1;
  if (value === null || value === undefined) {
    return { text: '—', sign: null };
  }
  return { text: `${(value * 100).toFixed(decimals)}%`, sign: null };
}

/**
 * @param {number | null | undefined} value
 * @param {{ decimals?: number }} [options]
 * @returns {FormattedValue}
 */
export function formatScore(value, options = {}) {
  const decimals = options.decimals ?? 2;
  if (value === null || value === undefined) {
    return { text: '—', sign: null };
  }
  return { text: value.toFixed(decimals), sign: null };
}

/**
 * @param {number} weight - Suggested allocation weight, 0..1.
 * @param {number} totalAmount - Total deposit amount.
 * @returns {number} Rounded ILS amount for this fund.
 */
export function computeAllocationAmount(weight, totalAmount) {
  return Math.round(weight * totalAmount);
}

/**
 * @param {number} weight - Suggested allocation weight, 0..1.
 * @param {{ decimals?: number }} [options]
 * @returns {string} e.g. "14.3"
 */
export function formatWeightPercent(weight, options = {}) {
  const decimals = options.decimals ?? 1;
  return (weight * 100).toFixed(decimals);
}

/**
 * @typedef {Object} FundMetrics
 * @property {number | null} return_1m
 * @property {number | null} return_3m
 * @property {number | null} return_1y
 * @property {number | null} return_3y
 * @property {number | null} return_5y
 * @property {number | null} volatility_1y
 * @property {number | null} volatility_3y
 * @property {number | null} volatility_5y
 * @property {number | null} volatility_blended
 * @property {number | null} risk_adjusted_score
 */

/**
 * @typedef {Object} Fund
 * @property {string} id
 * @property {string} name_en
 * @property {string} name_he
 * @property {number} suggested_weight
 * @property {FundMetrics} metrics
 */

/**
 * @typedef {Object} FundRowViewModel
 * @property {string} id
 * @property {string} nameEn
 * @property {string} nameHe
 * @property {FormattedValue} return1m
 * @property {FormattedValue} return3m
 * @property {FormattedValue} return1y
 * @property {FormattedValue} return3y
 * @property {FormattedValue} return5y
 * @property {FormattedValue} volatility1y
 * @property {FormattedValue} volatility3y
 * @property {FormattedValue} volatility5y
 * @property {FormattedValue} volatilityBlended
 * @property {FormattedValue} riskAdjustedScore
 * @property {string} weightPct
 * @property {number} amount
 */

/**
 * Turn one fund + the deposit amount into a fully-formatted, presentation-
 * ready view model. Pure data in, pure data out — no DOM, no HTML strings.
 * @param {Fund} fund
 * @param {number} amount
 * @returns {FundRowViewModel}
 */
export function buildFundRowViewModel(fund, amount) {
  const m = fund.metrics;
  return {
    id: fund.id,
    nameEn: fund.name_en,
    nameHe: fund.name_he,
    return1m: formatPercent(m.return_1m),
    return3m: formatPercent(m.return_3m),
    return1y: formatPercent(m.return_1y),
    return3y: formatPercent(m.return_3y),
    return5y: formatPercent(m.return_5y),
    volatility1y: formatVolatility(m.volatility_1y),
    volatility3y: formatVolatility(m.volatility_3y),
    volatility5y: formatVolatility(m.volatility_5y),
    volatilityBlended: formatVolatility(m.volatility_blended),
    riskAdjustedScore: formatScore(m.risk_adjusted_score),
    weightPct: formatWeightPercent(fund.suggested_weight),
    amount: computeAllocationAmount(fund.suggested_weight, amount),
  };
}

const RELATIVE_UNITS = /** @type {const} */ ([
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
]);

/**
 * Hebrew relative time for a past timestamp, e.g. "לפני 3 ימים".
 * `now` is passed in so the function stays pure and testable.
 * @param {string} isoDate - ISO 8601 timestamp, e.g. data.generated_at.
 * @param {Date} now
 * @returns {string} Relative text, or "" when isoDate is unparseable.
 */
export function formatRelativeTime(isoDate, now) {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const seconds = Math.round((now.getTime() - then) / 1000);
  if (seconds < 60) {
    return 'ממש עכשיו';
  }
  const rtf = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (seconds >= size) {
      return rtf.format(-Math.floor(seconds / size), unit);
    }
  }
  return 'ממש עכשיו';
}

/**
 * @typedef {Object} AllocationSummary
 * @property {number} fundCount
 * @property {number} totalAmount - Sum of the rounded per-fund amounts, so
 *   rounding drift against the typed deposit stays visible.
 * @property {FormattedValue} weightedScore - Weight-averaged risk-adjusted
 *   score over funds that have one, or "—" when none do.
 */

/**
 * @param {Fund[]} funds
 * @param {number} amount - Total deposit amount.
 * @returns {AllocationSummary}
 */
export function summarizeAllocation(funds, amount) {
  let totalAmount = 0;
  let scoreSum = 0;
  let weightSum = 0;
  for (const fund of funds) {
    totalAmount += computeAllocationAmount(fund.suggested_weight, amount);
    const score = fund.metrics.risk_adjusted_score;
    if (score !== null && score !== undefined) {
      scoreSum += fund.suggested_weight * score;
      weightSum += fund.suggested_weight;
    }
  }
  return {
    fundCount: funds.length,
    totalAmount,
    weightedScore: formatScore(weightSum > 0 ? scoreSum / weightSum : null),
  };
}
