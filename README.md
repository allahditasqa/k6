# k6

**Automation Framework:** k6 (JavaScript) performance tests - smoke, load, stress, spike and soak - with pass/fail thresholds, against the public k6 demo API [quickpizza.grafana.com](https://quickpizza.grafana.com).

> Be polite: the demo API is shared. Defaults are small; do not raise VUs aggressively.

## Test types
| Script | Purpose | Shape |
|--------|---------|-------|
| `scripts/smoke.js` | sanity check | 1 VU, 30s |
| `scripts/load.js` | expected load | ramp 1m → 10 VUs, hold 3m, ramp down |
| `scripts/stress.js` | find limits | 10 → 20 → 40 → 60 VUs, 1m each |
| `scripts/spike.js` | sudden surge + recovery | 5 → 50 VUs in 10s, hold, drop |
| `scripts/soak.js` | long run | 10 VUs for 30m (default) |

Every script uses **thresholds** (`http_req_failed`, `http_req_duration` p95/p99, `checks`); k6 exits non-zero if one is breached, which is how CI fails a run.

## Structure
```
k6/
├── scripts/
│   ├── common.js    # shared user journey (list + detail) with checks
│   ├── smoke.js  load.js  stress.js  spike.js  soak.js
└── .github/workflows/k6-smoke.yml
```

## Prerequisites
[Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (`choco install k6`, `brew install k6`, or the Docker image `grafana/k6`).

## Run
```bash
k6 run scripts/smoke.js
k6 run scripts/load.js
k6 run -e VUS=5 -e HOLD=30s scripts/load.js        # smaller / shorter
k6 run -e HOLD=1m scripts/soak.js                  # short soak
k6 run -e BASE_URL=https://quickpizza.grafana.com --out json=results/out.json scripts/stress.js
```
Docker (no local install):
```bash
docker run --rm -v "$PWD/scripts:/scripts" grafana/k6 run /scripts/smoke.js
```

## Verified
`smoke.js`, `load.js` (reduced) and `spike.js` (reduced) were run locally with k6 v2.4.0 - all checks passed and no threshold was crossed. `stress.js` and the full-length `soak.js` were not executed in full.
