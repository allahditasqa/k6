import { journey } from './common.js';

// Stress: keep increasing load beyond normal to find the breaking point.
// SCALE multiplies the virtual users (for example SCALE=0.1 for a polite short run on a shared demo service).
// The comments TC_STRESS_nn link every threshold to its test case in docs/test-cases/stress.md
const SCALE = Number(__ENV.SCALE || 1);
const vus = (n) => Math.max(1, Math.round(n * SCALE));
const STEP = __ENV.STEP || '1m';

export const options = {
  stages: [
    { duration: STEP, target: vus(10) },
    { duration: STEP, target: vus(20) },
    { duration: STEP, target: vus(40) },
    { duration: STEP, target: vus(60) },
    { duration: STEP, target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // TC_STRESS_01
    http_req_duration: ['p(95)<3000'], // TC_STRESS_02
  },
};

export default function () {
  journey();
}
