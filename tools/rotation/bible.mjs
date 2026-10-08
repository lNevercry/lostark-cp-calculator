// Client lostark.bible pour les outils de rotation : fonctions distantes SvelteKit (statistiques de raid) et logs
// (`/logs/{id}/__data.json`). Une requête à la fois, au moins PAUSE_MS entre deux (consigne de l'auteur : ne jamais
// marteler lostark.bible), réponses des logs gardées en cache local par l'appelant. Le site limite le débit : à 5,5 s
// entre deux appels, des réponses 429 sont arrivées après ~120 logs (2026-10-03). Au premier 429, RateLimited est levée
// et l'appelant s'arrête (jamais de nouvel essai).
const BASE = 'https://lostark.bible';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
export const PAUSE_MS = 15000;

export class RateLimited extends Error {}

const sleep = ms => new Promise(r => setTimeout(r, ms));
let last = 0;

async function get(url) {
  const wait = last + PAUSE_MS - Date.now();
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json, text/html, */*' } });
  if (res.status === 429) {
    // Règle de limitation inconnue : on note ce que le serveur en dit (délai à attendre, compteurs), s'il le dit.
    const hints = [...res.headers].filter(([k]) => /retry-after|ratelimit|x-rate/i.test(k)).map(([k, v]) => `${k}: ${v}`).join(', ');
    throw new RateLimited(`429 ${url}${hints ? ` (${hints})` : ''}`);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// Format devalue de SvelteKit : tableau plat dont les objets et tableaux référencent des indices (négatifs : valeurs
// spéciales, undefined pour -1).
export function unflatten(values) {
  const cache = new Map();
  const special = { '-1': undefined, '-2': null, '-3': NaN, '-4': Infinity, '-5': -Infinity, '-6': -0 };
  const hydrate = i => {
    if (i < 0) return special[i];
    if (cache.has(i)) return cache.get(i);
    const v = values[i];
    if (Array.isArray(v)) {
      if (v[0] === 'Date') return new Date(v[1]);
      if (v[0] === 'BigInt') return Number(v[1]);
      const out = [];
      cache.set(i, out);
      v.forEach(j => out.push(hydrate(j)));
      return out;
    }
    if (v && typeof v === 'object') {
      const out = {};
      cache.set(i, out);
      for (const [k, j] of Object.entries(v)) out[k] = hydrate(j);
      return out;
    }
    return v;
  };
  return hydrate(0);
}

// Arguments d'une fonction distante : devalue d'un objet plat, enveloppé comme le fait le site.
function payload(args) {
  const values = [['__skrao', 1], {}];
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined) { values[1][k] = -1; continue; }
    values[1][k] = values.length;
    values.push(v);
  }
  return Buffer.from(JSON.stringify(values)).toString('base64');
}

// Les identifiants des fonctions distantes changent à chaque mise à jour du site : on les relit dans le bundle.
export async function findRemotes(names) {
  const page = await get(`${BASE}/leaderboards`);
  const app = await get(`${BASE}/_app/immutable/entry/${page.match(/entry\/(app\.[A-Za-z0-9_-]+\.js)/)[1]}`);
  const found = {};
  for (const n of [...new Set(app.match(/nodes\/[0-9]+\.[A-Za-z0-9_-]+\.js/g) || [])]) {
    if (names.every(x => found[x])) break;
    const js = await get(`${BASE}/_app/immutable/${n}`);
    for (const m of js.matchAll(/`([a-z0-9]+)\/([A-Za-z]+)`/g)) if (names.includes(m[2])) found[m[2]] = `${m[1]}/${m[2]}`;
  }
  const missing = names.filter(x => !found[x]);
  if (missing.length) throw new Error(`Fonctions introuvables dans le bundle de lostark.bible : ${missing.join(', ')}`);
  return found;
}

// Patchs proposés par les statistiques de raid du site : objet { clé: `libellé` } du bundle, dans l'ordre (ex. jun26:
// `June 2026 Balance`, sep26: `September 2026 Balance`, puis current / alltime). Le dernier « … Balance » est le patch en
// cours. hint : fichier du bundle trouvé la fois précédente (3 requêtes au lieu d'en lire jusqu'à ~70).
export function parsePatches(js) {
  for (const m of js.matchAll(/\{((?:[a-z0-9]+:`[^`]*`,?)+)\}/g)) {
    const entries = [...m[1].matchAll(/([a-z0-9]+):`([^`]*)`/g)].map(x => [x[1], x[2]]);
    const balances = entries.filter(([, label]) => /Balance$/.test(label));
    if (balances.length) return balances;
  }
  return null;
}

export async function latestPatch(hint) {
  const page = await get(`${BASE}/leaderboards`);
  const app = await get(`${BASE}/_app/immutable/entry/${page.match(/entry\/(app\.[A-Za-z0-9_-]+\.js)/)[1]}`);
  const nodes = [...new Set(app.match(/nodes\/[0-9]+\.[A-Za-z0-9_-]+\.js/g) || [])];
  for (const n of hint && nodes.includes(hint) ? [hint, ...nodes.filter(x => x !== hint)] : nodes) {
    const balances = parsePatches(await get(`${BASE}/_app/immutable/${n}`));
    if (balances) { const [patch, label] = balances.at(-1); return { patch, label, node: n }; }
  }
  throw new Error('Liste des patchs introuvable dans le bundle de lostark.bible');
}

export async function remote(id, args) {
  const body = JSON.parse(await get(`${BASE}/_app/remote/${id}?payload=${encodeURIComponent(payload(args))}`));
  if (body.type !== 'result' || !body.data) return null;
  const root = unflatten(JSON.parse(body.data));
  return root && '_' in root ? root._ : root;
}

// Log complet tel qu'envoyé par LOA Logs : { encounter: { fightStart, lastCombatPacket, duration, difficulty,
// currentBossName, entityList: [joueurs avec skills{castLog…}, damageStats, engravingData, arkPassiveData…] } }.
export async function fetchLog(id) {
  const j = JSON.parse(await get(`${BASE}/logs/${encodeURIComponent(id)}/__data.json`));
  const node = j.nodes.find(n => n?.data?.[0]?.encounterInfo !== undefined);
  if (!node) throw new Error(`Log ${id} illisible`);
  return unflatten(node.data).encounterInfo;
}
