import { journey } from './common.js';

// Smoke: 1 VU for 30s - verifies the script and the system work at minimal load.
export const options = {
  vus: 1,
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  journey();
}
