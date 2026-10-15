import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from fetch_data import (  # noqa: E402
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
