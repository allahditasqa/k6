import { journey } from './common.js';

// Smoke: 1 VU - verifies the script and the system work at minimal load.
// The comments TC_SMOKE_nn link every threshold to its test case in docs/test-cases/smoke.md
export const options = {
  vus: 1,
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // TC_SMOKE_01
    http_req_duration: ['p(95)<1500'], // TC_SMOKE_02
    checks: ['rate>0.99'], // TC_SMOKE_03
  },
};

export default function () {
  journey();
}
