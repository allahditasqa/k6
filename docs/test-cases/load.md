# Load - Test Cases

**Module:** Load
**Automation:** `scripts/load.js` (user journey in `scripts/common.js`)  |  **Report:** `reports/load/Load test <DD-MM-YYYY>_<HH-mm-ss>.html` (all reports: `reports/index.html`)
**Service:** https://quickpizza.grafana.com (public k6 demo service, endpoints `/api/names` and `/api/quotes`)

## Overview
Ramp up to the expected normal number of users, hold the load, then ramp down. It shows how the service behaves under typical load.

## Scope and notes
- A performance "test case" here is one **threshold** of the script. k6 marks the run as failed when a threshold is crossed; that is the pass/fail rule.
- The ID is written as a comment next to the threshold in the script, for example `// TC_LOAD_01`.
- The user journey is the same in every scenario: GET `/api/names`, then GET `/api/quotes`, with checks on status, content type and non-empty lists.
- Be polite: the service is shared. The committed reports use the short profile written in the "Test data" column.

## A. Thresholds

| ID | Title | Priority | Type | Preconditions | Test data | Steps | Expected result | Automated in |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_LOAD_01 | Fewer than 1% of the HTTP requests fail under load | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: ramp to 10 VUs in 1 min, hold 3 min, ramp down 30 s. Report run: 3 VUs, ramp 5 s, hold 15 s, ramp down 5 s (`-e VUS=3 -e RAMP_UP=5s -e HOLD=15s -e RAMP_DOWN=5s`) | 1. Run `k6 run scripts/load.js`. 2. Read the end-of-test summary. | Threshold `http_req_failed: rate<0.01` holds. Less than 1% of all HTTP requests failed. | `scripts/load.js::http_req_failed: rate<0.01` |
| TC_LOAD_02 | 95% of the requests answer in under 1500 ms and 99% in under 3000 ms under load | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: ramp to 10 VUs in 1 min, hold 3 min, ramp down 30 s. Report run: 3 VUs, ramp 5 s, hold 15 s, ramp down 5 s (`-e VUS=3 -e RAMP_UP=5s -e HOLD=15s -e RAMP_DOWN=5s`) | 1. Run `k6 run scripts/load.js`. 2. Read the end-of-test summary. | Threshold `http_req_duration: p(95)<1500, p(99)<3000` holds. The 95th percentile is under 1500 ms and the 99th percentile is under 3000 ms. | `scripts/load.js::http_req_duration: p(95)<1500, p(99)<3000` |
| TC_LOAD_03 | 95% of the "get-names" requests answer in under 1500 ms under load | Medium | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: ramp to 10 VUs in 1 min, hold 3 min, ramp down 30 s. Report run: 3 VUs, ramp 5 s, hold 15 s, ramp down 5 s (`-e VUS=3 -e RAMP_UP=5s -e HOLD=15s -e RAMP_DOWN=5s`) | 1. Run `k6 run scripts/load.js`. 2. Read the end-of-test summary. | Threshold `http_req_duration{name:get-names}: p(95)<1500` holds. The 95th percentile of the requests tagged get-names is under 1500 ms. | `scripts/load.js::http_req_duration{name:get-names}: p(95)<1500` |
| TC_LOAD_04 | More than 99% of the checks pass under load | Medium | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: ramp to 10 VUs in 1 min, hold 3 min, ramp down 30 s. Report run: 3 VUs, ramp 5 s, hold 15 s, ramp down 5 s (`-e VUS=3 -e RAMP_UP=5s -e HOLD=15s -e RAMP_DOWN=5s`) | 1. Run `k6 run scripts/load.js`. 2. Read the end-of-test summary. | Threshold `checks: rate>0.99` holds. More than 99% of the checks passed. | `scripts/load.js::checks: rate>0.99` |

## Summary

| Cases | High priority | Automated |
| --- | --- | --- |
| 4 | 2 | 4 |
