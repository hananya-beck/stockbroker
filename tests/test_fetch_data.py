import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from fetch_data import (  # noqa: E402
    allocate_weights,
    annualized_return,
    annualized_volatility,
    compute_metrics,
    trailing_return,
)


def make_series(prices):
    return [{"date": f"day{i}", "close": p} for i, p in enumerate(prices)]


def test_trailing_return_simple_growth():
    series = make_series([100.0] * 10 + [110.0])
    assert math.isclose(trailing_return(series, 10), 0.10)


def test_trailing_return_insufficient_history_is_none():
    series = make_series([100.0, 101.0, 102.0])
    assert trailing_return(series, 10) is None


def test_annualized_return_matches_cagr_formula():
    series = make_series([100.0] * 252 + [121.0])
    ret = annualized_return(series, 252)
    assert math.isclose(ret, 0.21, abs_tol=1e-9)


def test_annualized_volatility_zero_for_flat_series():
    series = make_series([100.0] * 253)
    vol = annualized_volatility(series, 252)
    assert vol == 0.0


def test_compute_metrics_blended_volatility_uses_available_horizons_only():
    # Only a 1y-length window of real history (no 3y/5y data), so the
    # blended figure should equal the 1y volatility exactly.
    prices = [100.0]
    for i in range(1, 253):
        prices.append(prices[-1] * (1.001 if i % 2 == 0 else 0.999))
    series = make_series(prices)

    metrics = compute_metrics(series)

    assert metrics["volatility_3y"] is None
    assert metrics["volatility_5y"] is None
    assert metrics["volatility_1y"] is not None
    assert math.isclose(metrics["volatility_blended"], metrics["volatility_1y"])


def test_compute_metrics_no_history_gives_none_score_and_blend():
    series = make_series([100.0, 101.0])
    metrics = compute_metrics(series)
    assert metrics["risk_adjusted_score"] is None
    assert metrics["volatility_blended"] is None


def test_annualized_volatility_skips_zero_price_without_crashing():
    series = make_series([100.0] * 10 + [0.0] + [100.0] * 10)
    assert annualized_volatility(series, 20) == 0.0


def test_score_subtracts_risk_free_rate():
    prices = [100.0]
    for i in range(1, 253):
        prices.append(prices[-1] * (1.002 if i % 2 == 0 else 0.999))
    series = make_series(prices)
    m0 = compute_metrics(series, risk_free_rate=0.0)
    m4 = compute_metrics(series, risk_free_rate=0.04)
    expected = m0["risk_adjusted_score"] - 0.04 / m0["volatility_1y"]
    assert math.isclose(m4["risk_adjusted_score"], expected)


def test_young_fund_scored_on_partial_history():
    prices = [100.0]
    for i in range(1, 200):
        prices.append(prices[-1] * (1.002 if i % 2 == 0 else 0.999))
    metrics = compute_metrics(make_series(prices))
    assert metrics["score_basis"] == "partial_history"
    assert metrics["risk_adjusted_score"] is not None


def _fund(score):
    return {"metrics": {"risk_adjusted_score": score}}


def test_worst_fund_gets_more_than_floor():
    funds = [_fund(1.0), _fund(0.5), _fund(-0.5)]
    allocate_weights(funds)
    assert math.isclose(sum(f["suggested_weight"] for f in funds), 1.0)
    assert funds[2]["suggested_weight"] > 0.03 + 0.01


def test_floor_capped_for_many_funds():
    funds = [_fund(None) for _ in range(40)] + [_fund(1.0)]
    allocate_weights(funds)
    assert all(f["suggested_weight"] >= 0 for f in funds)
    assert math.isclose(sum(f["suggested_weight"] for f in funds), 1.0, abs_tol=1e-6)
