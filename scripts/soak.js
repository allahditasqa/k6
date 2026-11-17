import { journey } from './common.js';

// Soak: moderate load for a long time to find leaks / degradation.
// Default hold is 30m; shorten with -e HOLD=1m for a quick try.
export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: __ENV.HOLD || '30m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  journey();
}
