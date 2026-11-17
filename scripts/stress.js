import { journey } from './common.js';

// Stress: keep increasing load beyond normal to find the breaking point.
export const options = {
  stages: [
    { duration: __ENV.STEP || '1m', target: 10 },
    { duration: __ENV.STEP || '1m', target: 20 },
    { duration: __ENV.STEP || '1m', target: 40 },
    { duration: __ENV.STEP || '1m', target: 60 },
    { duration: __ENV.STEP || '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  journey();
}
