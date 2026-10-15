#!/usr/bin/env python3
"""Fetch daily NAV history for the configured TASE funds from bizportal.co.il
and compute trailing returns, volatility and a suggested monthly allocation.

Writes the result to data/funds.json, which the static site (index.html) reads.
"""
import json
import math
import statistics
import time
import urllib.request
from datetime import datetime, timezone
from http.cookiejar import CookieJar
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FUNDS_CONFIG = ROOT / "data" / "funds_config.json"
OUTPUT = ROOT / "data" / "funds.json"

USER_AGENT = "Mozilla/5.0 (compatible; stockbroker-fetch/1.0)"
BASE = "https://www.bizportal.co.il"

TRADING_DAYS_PER_YEAR = 252
HORIZONS = {"1m": 21, "3m": 63, "6m": 126, "12m": 252}

# Minimum weight floor per fund so the recommendation never drops a fund to 0%,
# keeping the user's existing diversification across all 7 baskets.
MIN_WEIGHT = 0.03


def build_opener():
    jar = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    opener.addheaders = [("User-Agent", USER_AGENT)]
    return opener


def fetch_fund_series(opener, fund_id):
    quote_url = f"{BASE}/mutualfunds/quote/graphs/{fund_id}"
    # Visit the quote page first to pick up the session cookie the AJAX endpoint requires.
    req = urllib.request.Request(quote_url, headers={"User-Agent": USER_AGENT})
    opener.open(req, timeout=20).read()

    ajax_url = (
        f"{BASE}/ajax/biz_papers_helper.ashx?action=get_paper_yearly_graph"
        f"&request_type=1&paper_id={fund_id}&dd={int(time.time() * 1000)}"
    )
    req = urllib.request.Request(
        ajax_url,
        headers={
            "User-Agent": USER_AGENT,
            "Referer": quote_url,
            "X-Requested-With": "XMLHttpRequest",
        },
    )
    raw = opener.open(req, timeout=20).read().decode("utf-8")
    # bizportal prefixes the JSON array with a stray "~" marker.
    raw = raw[raw.index("[") :]
    points = json.loads(raw)
    # Points come back newest-first; sort ascending by date for return calculations.
    series = [
        {"date": p["D_p"], "close": float(p["C_p"])}
        for p in points
        if p.get("C_p") is not None
    ]
    series.sort(key=lambda p: datetime.strptime(p["date"], "%d/%m/%Y"))
    return series


def trailing_return(series, days):
    if len(series) <= days:
        return None
    start = series[-days - 1]["close"]
    end = series[-1]["close"]
    if start == 0:
        return None
    return (end / start) - 1.0


def annualized_volatility(series, days):
    window = series[-days - 1 :] if len(series) > days else series
    if len(window) < 3:
        return None
    daily_returns = []
    for prev, cur in zip(window, window[1:]):
        if prev["close"] > 0:
            daily_returns.append(math.log(cur["close"] / prev["close"]))
    if len(daily_returns) < 2:
        return None
    return statistics.pstdev(daily_returns) * math.sqrt(TRADING_DAYS_PER_YEAR)


def compute_metrics(series):
    metrics = {}
    for label, days in HORIZONS.items():
        metrics[f"return_{label}"] = trailing_return(series, days)
    metrics["volatility_12m"] = annualized_volatility(series, HORIZONS["12m"])
    ret_12m = metrics["return_12m"]
    vol = metrics["volatility_12m"]
    metrics["risk_adjusted_score"] = (
        ret_12m / vol if ret_12m is not None and vol else None
    )
    metrics["last_price"] = series[-1]["close"]
    metrics["last_date"] = series[-1]["date"]
    return metrics


def allocate_weights(funds):
    scored = [f for f in funds if f["metrics"]["risk_adjusted_score"] is not None]
    if not scored:
        equal = round(1.0 / len(funds), 4)
        for f in funds:
            f["suggested_weight"] = equal
        return

    # Shift scores positive so a negative risk-adjusted score doesn't zero out a fund.
    scores = [f["metrics"]["risk_adjusted_score"] for f in scored]
    shift = -min(scores) + 0.01 if min(scores) <= 0 else 0
    shifted = {id(f): f["metrics"]["risk_adjusted_score"] + shift for f in scored}
    total_shifted = sum(shifted.values())

    n = len(funds)
    remaining = 1.0 - MIN_WEIGHT * n
    for f in funds:
        base = MIN_WEIGHT
        if f["metrics"]["risk_adjusted_score"] is not None:
            base += remaining * (shifted[id(f)] / total_shifted)
        f["suggested_weight"] = round(base, 4)

    # Normalize rounding drift back to exactly 1.0.
    drift = 1.0 - sum(f["suggested_weight"] for f in funds)
    funds[0]["suggested_weight"] = round(funds[0]["suggested_weight"] + drift, 4)


def main():
    config = json.loads(FUNDS_CONFIG.read_text(encoding="utf-8"))
    opener = build_opener()

    funds = []
    for entry in config["funds"]:
        series = fetch_fund_series(opener, entry["id"])
        metrics = compute_metrics(series)
        funds.append({**entry, "metrics": metrics})

    funds.sort(
        key=lambda f: (f["metrics"]["risk_adjusted_score"] is None,
                        -(f["metrics"]["risk_adjusted_score"] or 0))
    )
    allocate_weights(funds)

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "funds": funds,
    }
    OUTPUT.write_text(
        json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote {OUTPUT} with {len(funds)} funds")


if __name__ == "__main__":
    main()
