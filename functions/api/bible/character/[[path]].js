// Profil lostark.bible pour le site (le navigateur ne peut pas l'appeler directement : CORS).
// Pas un proxy ouvert : GET / HEAD seulement, un seul format de chemin (région connue, un pseudo, __data.json),
// appelé par le site lui-même (même origine, aucun en-tête CORS), réponses gardées 15 min en cache.
const REGIONS = new Set(['CE', 'NA', 'NAE', 'NAW', 'SA']);
const PATH_RE = /^\/api\/bible\/character\/([A-Za-z]{2,3})\/([^/]+)\/__data\.json$/;

const reject = (status, error) => new Response(JSON.stringify({ error }), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return reject(405, 'Method not allowed');

  const url = new URL(request.url);
  const m = url.pathname.match(PATH_RE);
  if (!m) return reject(404, 'Not found');
  const region = m[1].toUpperCase();
  let name;
  try { name = decodeURIComponent(m[2]); } catch { return reject(400, 'Bad name'); }
  // Pseudo du jeu : lettres (accents compris) et chiffres, rien qui puisse changer de chemin
  if (!REGIONS.has(region) || !name || name.length > 32 || /[\/\\?#%.\s]/.test(name)) return reject(400, 'Bad character');

  const targetUrl = `https://lostark.bible/character/${region}/${encodeURIComponent(name)}/__data.json`;
  // Clé de cache normalisée : la query string ne contourne pas le cache
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/bible/character/${region}/${encodeURIComponent(name)}/__data.json`);
  let response = await cache.match(cacheKey);
  if (response) return response;

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    response = new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, s-maxage=900, max-age=900',
        'X-Content-Type-Options': 'nosniff'
      }
    });
    if (upstream.status === 200) context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (e) {
    return reject(502, 'Upstream timeout or error');
  }
}
