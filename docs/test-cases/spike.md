# Spike - Test Cases

**Module:** Spike
**Automation:** `scripts/spike.js` (user journey in `scripts/common.js`)  |  **Report:** `reports/spike/Spike test <DD-MM-YYYY>_<HH-mm-ss>.html` (all reports: `reports/index.html`)
**Service:** https://quickpizza.grafana.com (public k6 demo service, endpoints `/api/names` and `/api/quotes`)

## Overview
A sudden surge of users (5 to 50 VUs in 10 s), a hold, a drop back to 5 VUs and a recovery period. It checks that the service survives a spike and recovers.

## Scope and notes
- A performance "test case" here is one **threshold** of the script. k6 marks the run as failed when a threshold is crossed; that is the pass/fail rule.
- The ID is written as a comment next to the threshold in the script, for example `// TC_SPIKE_01`.
- The user journey is the same in every scenario: GET `/api/names`, then GET `/api/quotes`, with checks on status, content type and non-empty lists.
- Be polite: the service is shared. The committed reports use the short profile written in the "Test data" column.

## A. Thresholds

| ID | Title | Priority | Type | Preconditions | Test data | Steps | Expected result | Automated in |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_SPIKE_01 | Fewer than 5% of the HTTP requests fail during and after the spike | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 30 s warm-up, 10 s surge, 1 min hold, 10 s drop, 1 min recovery. Report run: 20 % of the users, 5/5/10/5/10 s (`-e SCALE=0.2 -e WARM=5s -e SURGE=5s -e HOLD=10s -e DROP=5s -e RECOVER=10s`, peak 10 VUs) | 1. Run `k6 run scripts/spike.js`. 2. Read the end-of-test summary. | Threshold `http_req_failed: rate<0.05` holds. Less than 5% of all HTTP requests failed. | `scripts/spike.js::http_req_failed: rate<0.05` |
| TC_SPIKE_02 | 95% of the requests answer in under 3000 ms during and after the spike | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 30 s warm-up, 10 s surge, 1 min hold, 10 s drop, 1 min recovery. Report run: 20 % of the users, 5/5/10/5/10 s (`-e SCALE=0.2 -e WARM=5s -e SURGE=5s -e HOLD=10s -e DROP=5s -e RECOVER=10s`, peak 10 VUs) | 1. Run `k6 run scripts/spike.js`. 2. Read the end-of-test summary. | Threshold `http_req_duration: p(95)<3000` holds. The 95th percentile of the request duration is under 3000 ms. | `scripts/spike.js::http_req_duration: p(95)<3000` |

## Summary

| Cases | High priority | Automated |
| --- | --- | --- |
| 2 | 2 | 2 |
