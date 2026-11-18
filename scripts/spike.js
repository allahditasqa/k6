import { journey } from './common.js';

// Spike: sudden surge of users, then drop back, to check recovery.
// SCALE multiplies the virtual users (for example SCALE=0.2 for a polite short run).
// The comments TC_SPIKE_nn link every threshold to its test case in docs/test-cases/spike.md
const SCALE = Number(__ENV.SCALE || 1);
const vus = (n) => Math.max(1, Math.round(n * SCALE));

export const options = {
  stages: [
    { duration: __ENV.WARM || '30s', target: vus(5) },
    { duration: __ENV.SURGE || '10s', target: vus(50) },
    { duration: __ENV.HOLD || '1m', target: vus(50) },
    { duration: __ENV.DROP || '10s', target: vus(5) },
    { duration: __ENV.RECOVER || '1m', target: vus(5) },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // TC_SPIKE_01
    http_req_duration: ['p(95)<3000'], // TC_SPIKE_02
  },
};

export default function () {
  journey();
}
