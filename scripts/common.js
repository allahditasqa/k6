import http from 'k6/http';
import { check, sleep } from 'k6';

// Public demo service published by Grafana for k6 practice.
export const BASE_URL = __ENV.BASE_URL || 'https://quickpizza.grafana.com';

/** One user journey: fetch pizza names, then a quote. */
export function journey() {
  const names = http.get(`${BASE_URL}/api/names`, { tags: { name: 'get-names' } });
  check(names, {
    'names: status is 200': (r) => r.status === 200,
    'names: is JSON': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
    'names: non-empty list': (r) => Array.isArray(r.json('names')) && r.json('names').length > 0,
  });

  const quotes = http.get(`${BASE_URL}/api/quotes`, { tags: { name: 'get-quotes' } });
  check(quotes, {
    'quotes: status is 200': (r) => r.status === 200,
    'quotes: non-empty list': (r) => Array.isArray(r.json('quotes')) && r.json('quotes').length > 0,
  });

  sleep(1);
}
