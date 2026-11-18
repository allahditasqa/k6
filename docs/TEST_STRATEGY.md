# Test strategy: k6 performance scenarios on the QuickPizza demo service

**Version:** 1.0  |  **Prepared by:** QA (SDET)

## 1. Objective
Show the five classic performance test types with k6, each with explicit thresholds, against a public demo service built for k6 practice (https://quickpizza.grafana.com).

## 2. Scope

| Module (script) | Document | Cases (thresholds) | Purpose |
| --- | --- | --- | --- |
| Smoke | [smoke.md](test-cases/smoke.md) | 3 | The script and the service work at minimal load |
| Load | [load.md](test-cases/load.md) | 4 | Expected normal load |
| Stress | [stress.md](test-cases/stress.md) | 2 | Load beyond normal, find the limit |
| Spike | [spike.md](test-cases/spike.md) | 2 | Sudden surge and recovery |
| Soak | [soak.md](test-cases/soak.md) | 2 | Long constant load (degradation) |

**Out of scope:** capacity planning of the demo service, distributed runs, browser (frontend) performance.

## 3. Approach
- One shared user journey (`/api/names`, then `/api/quotes`) with checks on status, content type and non-empty lists.
- Pass/fail rule: k6 **thresholds**. One threshold is one test case and carries its ID as a comment in the script.
- The committed reports use a **short, polite profile** (see the Test data column of every document). They prove the scripts and thresholds work; they are not capacity results. The soak report is only a 20 s run of the soak script.

## 4. Risks
| Risk | Mitigation |
| --- | --- |
| Shared public demo service | Small profiles, `SCALE` and duration variables |
| Thresholds depend on network quality | Generous limits (p95 1.5 to 3 s) |

## 5. Deliverables
Documents and master CSVs, five scripts, module-wise reports of a real run, a traceability check (`node tools/docs.js check`) and a smoke CI job.
