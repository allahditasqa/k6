import { journey } from './common.js';

// Load: ramp to the expected typical load, hold, ramp down.
export const options = {
  stages: [
    { duration: __ENV.RAMP_UP || '1m', target: Number(__ENV.VUS || 10) },
    { duration: __ENV.HOLD || '3m', target: Number(__ENV.VUS || 10) },
    { duration: __ENV.RAMP_DOWN || '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    'http_req_duration{name:get-names}': ['p(95)<1500'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  journey();
}
