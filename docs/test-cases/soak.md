# Soak - Test Cases

**Module:** Soak
**Automation:** `scripts/soak.js` (user journey in `scripts/common.js`)  |  **Report:** `reports/soak/Soak test <DD-MM-YYYY>_<HH-mm-ss>.html` (all reports: `reports/index.html`)
**Service:** https://quickpizza.grafana.com (public k6 demo service, endpoints `/api/names` and `/api/quotes`)

## Overview
A moderate, constant load for a long time to find slow degradation such as memory leaks. A real soak run lasts 30 minutes; the committed report uses a short run only.

## Scope and notes
- A performance "test case" here is one **threshold** of the script. k6 marks the run as failed when a threshold is crossed; that is the pass/fail rule.
- The ID is written as a comment next to the threshold in the script, for example `// TC_SOAK_01`.
- The user journey is the same in every scenario: GET `/api/names`, then GET `/api/quotes`, with checks on status, content type and non-empty lists.
- Be polite: the service is shared. The committed reports use the short profile written in the "Test data" column.

## A. Thresholds

| ID | Title | Priority | Type | Preconditions | Test data | Steps | Expected result | Automated in |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_SOAK_01 | Fewer than 1% of the HTTP requests fail over the whole soak run | High | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 10 VUs for 30 min plus 2 min ramps. Report run: 3 VUs, 20 s hold, 5 s ramps (`-e VUS=3 -e RAMP=5s -e HOLD=20s`) - a short smoke of the soak script, NOT a real 30 minute soak | 1. Run `k6 run scripts/soak.js`. 2. Read the end-of-test summary. | Threshold `http_req_failed: rate<0.01` holds. Less than 1% of all HTTP requests failed. | `scripts/soak.js::http_req_failed: rate<0.01` |
| TC_SOAK_02 | 95% of the requests answer in under 2000 ms over the whole soak run | Medium | Performance | The demo service https://quickpizza.grafana.com is reachable | Default: 10 VUs for 30 min plus 2 min ramps. Report run: 3 VUs, 20 s hold, 5 s ramps (`-e VUS=3 -e RAMP=5s -e HOLD=20s`) - a short smoke of the soak script, NOT a real 30 minute soak | 1. Run `k6 run scripts/soak.js`. 2. Read the end-of-test summary. | Threshold `http_req_duration: p(95)<2000` holds. The 95th percentile of the request duration is under 2000 ms. | `scripts/soak.js::http_req_duration: p(95)<2000` |

## Summary

| Cases | High priority | Automated |
| --- | --- | --- |
| 2 | 1 | 2 |
