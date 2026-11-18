import { journey } from './common.js';

// Load: ramp to the expected typical load, hold, ramp down.
// The comments TC_LOAD_nn link every threshold to its test case in docs/test-cases/load.md
const VUS = Number(__ENV.VUS || 10);

export const options = {
  stages: [
    { duration: __ENV.RAMP_UP || '1m', target: VUS },
    { duration: __ENV.HOLD || '3m', target: VUS },
    { duration: __ENV.RAMP_DOWN || '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // TC_LOAD_01
    http_req_duration: ['p(95)<1500', 'p(99)<3000'], // TC_LOAD_02
    'http_req_duration{name:get-names}': ['p(95)<1500'], // TC_LOAD_03
    checks: ['rate>0.99'], // TC_LOAD_04
  },
};

export default function () {
  journey();
}
