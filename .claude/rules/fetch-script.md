---
paths:
  - "scripts/**"
---

# Fetch script

- `scripts/fetch_data.py` runs in GitHub Actions on Python 3.12 with the standard library only. Don't add third-party dependencies (no `requests`, `pandas`, etc.).
- bizportal's endpoint is undocumented: visit the quote page first for the session cookie, strip the leading `~` before the JSON, and sort the points ascending (they arrive newest-first).
- Horizons are counted in data points (trading days), with 252 per year. Only use a 1y/3y/5y horizon when the fund has a full window of history.
- One fund failing must not break the run. Keep its previous metrics marked `"stale": true` and exit 0, so the workflow still commits the funds that did update. Only abort, leaving `data/funds.json` untouched, when every fund fails.
- `index.html` reads the output fields (`metrics.*`, `suggested_weight`, `stale`, `generated_at`). Keep them backward compatible, or update the page in the same change.
- Suggested weights must sum to exactly 1.0 and respect the per-fund floor (`MIN_WEIGHT`, capped at 1/n).
- Add or update tests in `tests/test_fetch_data.py` and run `python -m pytest tests -q`. Tests must not hit the network.
