# Smoke - Test Cases

**Module:** Smoke
**Automation:** `scripts/smoke.js` (user journey in `scripts/common.js`)  |  **Report:** `reports/smoke/Smoke test <DD-MM-YYYY>_<HH-mm-ss>.html` (all reports: `reports/index.html`)
**Service:** https://quickpizza.grafana.com (public k6 demo service, endpoints `/api/names` and `/api/quotes`)

## Overview
One virtual user runs the whole user journey for a short time. It proves that the script and the demo service work before any real load is applied.

## Scope and notes
- A performance "test case" here is one **threshold** of the script. k6 marks the run as failed when a threshold is crossed; that is the pass/fail rule.
- The ID is written as a comment next to the threshold in the script, for example `// TC_SMOKE_01`.
- The user journey is the same in every scenario: GET `/api/names`, then GET `/api/quotes`, with checks on status, content type and non-empty lists.
- Be polite: the service is shared. The committed reports use the short profile written in the "Test data" column.

## A. Thresholds

| ID | Title | Priority | Type | Preconditions | Test data | Steps | Expected result | Automated in |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_SMOKE_01 | Fewer than 1% of the HTTP requests fail | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 1 VU for 30 s. Report run: 1 VU for 10 s (`-e DURATION=10s`) | 1. Run `k6 run scripts/smoke.js`. 2. Read the end-of-test summary. | Threshold `http_req_failed: rate<0.01` holds. Less than 1% of all HTTP requests failed (`http_req_failed` rate < 0.01). | `scripts/smoke.js::http_req_failed: rate<0.01` |
| TC_SMOKE_02 | 95% of the requests answer in under 1500 ms | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 1 VU for 30 s. Report run: 1 VU for 10 s (`-e DURATION=10s`) | 1. Run `k6 run scripts/smoke.js`. 2. Read the end-of-test summary. | Threshold `http_req_duration: p(95)<1500` holds. The 95th percentile of the request duration is under 1500 ms. | `scripts/smoke.js::http_req_duration: p(95)<1500` |
| TC_SMOKE_03 | More than 99% of the checks pass | Medium | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 1 VU for 30 s. Report run: 1 VU for 10 s (`-e DURATION=10s`) | 1. Run `k6 run scripts/smoke.js`. 2. Read the end-of-test summary. | Threshold `checks: rate>0.99` holds. More than 99% of the checks of the journey passed (status 200, JSON content type, non-empty lists). | `scripts/smoke.js::checks: rate>0.99` |

## Summary

| Cases | High priority | Automated |
| --- | --- | --- |
| 3 | 2 | 3 |
