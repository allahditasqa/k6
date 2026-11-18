import { journey } from './common.js';

// Soak: moderate load for a long time to find leaks / degradation.
// Default hold is 30m; shorten with -e HOLD=1m -e RAMP=10s for a quick try.
// The comments TC_SOAK_nn link every threshold to its test case in docs/test-cases/soak.md
const VUS = Number(__ENV.VUS || 10);
const RAMP = __ENV.RAMP || '2m';

export const options = {
  stages: [
    { duration: RAMP, target: VUS },
    { duration: __ENV.HOLD || '30m', target: VUS },
    { duration: RAMP, target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // TC_SOAK_01
    http_req_duration: ['p(95)<2000'], // TC_SOAK_02
  },
};

export default function () {
  journey();
}
