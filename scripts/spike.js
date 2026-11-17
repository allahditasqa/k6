import { journey } from './common.js';

// Spike: sudden surge of users, then drop back, to check recovery.
export const options = {
  stages: [
    { duration: __ENV.WARM || '30s', target: 5 },
    { duration: __ENV.SURGE || '10s', target: 50 },
    { duration: __ENV.HOLD || '1m', target: 50 },
    { duration: __ENV.DROP || '10s', target: 5 },
    { duration: __ENV.RECOVER || '1m', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  journey();
}
