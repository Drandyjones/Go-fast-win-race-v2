// GO FAST · WIN RACE relay, v2
// Cloudflare Worker (free tier). Passes a short allow-list of public data sources through
// with a CORS header so the app can read them from any site. Cached 60 s at the edge.
//
// To update your existing worker: Cloudflare dashboard → Workers & Pages → race-wind-relay
// → Edit code → select all, paste this file, Deploy. The URL stays the same.

const ALLOWED = [
  'https://hha.co.uk/wp-content/uploads/hha-met-api/',       // Harwich Haven live stations and tide
  'https://aviationweather.gov/api/data/',                    // airport observations, worldwide
  'https://environment.data.gov.uk/flood-monitoring/',        // UK Environment Agency tide gauges
  'https://www.ioc-sealevelmonitoring.org/service.php',       // global sea-level gauges (reserved for v2.1)
];
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const target = new URL(request.url).searchParams.get('url') || '';
    if (!ALLOWED.some(p => target.startsWith(p))) {
      return new Response('Source not on the relay allow-list.', { status: 403, headers: CORS });
    }
    const clean = new URL(target);
    clean.searchParams.delete('t');
    const upstream = await fetch(clean.toString(), {
      headers: { 'User-Agent': 'GoFastWinRace/2.0 (+personal sailing dashboard)', 'Accept': 'application/json,*/*' },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    const headers = new Headers(CORS);
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=60');
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
