# Stress - Test Cases

**Module:** Stress
**Automation:** `scripts/stress.js` (user journey in `scripts/common.js`)  |  **Report:** `reports/stress/Stress test <DD-MM-YYYY>_<HH-mm-ss>.html` (all reports: `reports/index.html`)
**Service:** https://quickpizza.grafana.com (public k6 demo service, endpoints `/api/names` and `/api/quotes`)

## Overview
Increase the number of users step by step beyond normal load (10, 20, 40, 60 VUs) to find where the service starts to degrade.

## Scope and notes
- A performance "test case" here is one **threshold** of the script. k6 marks the run as failed when a threshold is crossed; that is the pass/fail rule.
- The ID is written as a comment next to the threshold in the script, for example `// TC_STRESS_01`.
- The user journey is the same in every scenario: GET `/api/names`, then GET `/api/quotes`, with checks on status, content type and non-empty lists.
- Be polite: the service is shared. The committed reports use the short profile written in the "Test data" column.

## A. Thresholds

| ID | Title | Priority | Type | Preconditions | Test data | Steps | Expected result | Automated in |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_STRESS_01 | Fewer than 5% of the HTTP requests fail while the load increases | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 10, 20, 40, 60 VUs, 1 min per step. Report run: 10 % of the users, 8 s per step (`-e SCALE=0.1 -e STEP=8s`, peak 6 VUs) | 1. Run `k6 run scripts/stress.js`. 2. Read the end-of-test summary. | Threshold `http_req_failed: rate<0.05` holds. Less than 5% of all HTTP requests failed. | `scripts/stress.js::http_req_failed: rate<0.05` |
| TC_STRESS_02 | 95% of the requests answer in under 3000 ms while the load increases | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 10, 20, 40, 60 VUs, 1 min per step. Report run: 10 % of the users, 8 s per step (`-e SCALE=0.1 -e STEP=8s`, peak 6 VUs) | 1. Run `k6 run scripts/stress.js`. 2. Read the end-of-test summary. | Threshold `http_req_duration: p(95)<3000` holds. The 95th percentile of the request duration is under 3000 ms. | `scripts/stress.js::http_req_duration: p(95)<3000` |

## Summary

| Cases | High priority | Automated |
| --- | --- | --- |
| 2 | 2 | 2 |
