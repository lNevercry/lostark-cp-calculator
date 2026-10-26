// Surveillance du flux Maxroll en attendant le brassard T4 (완갑, Belgardin) en EU.
// Compare la structure du flux (recettes d'affinage, tables itemLevel / itemQuality, matériaux) à une empreinte
// de référence versionnée (tools/maxroll-baseline.json, flux du 2026-09-30, sans brassard). Une nouvelle recette,
// une nouvelle table de stats ou un nouveau matériau d'affinage = le brassard est probablement arrivé : il faut alors
// lire sa recette et sa table itemLevel dans tools/fetch-maxroll-honing.mjs et remplacer la table de loa-sim (data/bracer-t4.json).
//
// Usage : node tools/watch-maxroll-bracer.mjs [--save-baseline] [stats.json local]
// Code de sortie : 0 rien de nouveau, 2 nouveautés (rapport sur stdout), 1 erreur.
// Lancé chaque semaine par tools/watch-maxroll-bracer.sh (cron), qui envoie le rapport par mail.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FEED = 'https://assets-ng.maxroll.gg/laplanner/game/stats.json';
const BASELINE = new URL('./maxroll-baseline.json', import.meta.url);

const args = process.argv.slice(2);
const save = args.includes('--save-baseline');
const local = args.find(a => !a.startsWith('--'));

let stats, version = null;
if (local) {
  stats = JSON.parse(readFileSync(local, 'utf8'));
} else {
  const res = await fetch(FEED, { headers: { 'User-Agent': 'lostark-cp-calculator' } });
  if (!res.ok) throw new Error(`Flux Maxroll : HTTP ${res.status}`);
  version = res.headers.get('last-modified');
  stats = await res.json();
}

const prefixes = obj => [...new Set(Object.keys(obj || {}).map(k => k.split('#')[0]))].sort();
// Ce qui change quand le jeu ajoute une pièce d'équipement améliorable
function fingerprint(s) {
  const mats = new Set();
  for (const q of Object.values(s.itemQuality || {})) for (const id of Object.keys(q?.mats || {})) mats.add(id);
  for (const list of Object.values(s.enhanceMaterial || {})) for (const m of list || []) mats.add(String(m.id));
  return {
    sections: Object.keys(s).sort(),
    enhanceCommon: prefixes(s.enhanceCommon),
    itemLevel: prefixes(s.itemLevel),
    itemQuality: prefixes(s.itemQuality),
    enhanceMaterial: Object.keys(s.enhanceMaterial || {}).sort(),
    materials: [...mats].sort()
  };
}
const LABELS = {
  sections: 'Nouvelles sections du flux',
  enhanceCommon: "Nouvelles recettes d'affinage (enhanceCommon)",
  itemLevel: 'Nouvelles tables de stats par niveau (itemLevel)',
  itemQuality: "Nouveaux objets améliorables (itemQuality)",
  enhanceMaterial: "Nouveaux groupes de matériaux d'affinage (enhanceMaterial)",
  materials: "Nouveaux matériaux d'affinage"
};

const fp = fingerprint(stats);
if (save) {
  writeFileSync(BASELINE, JSON.stringify({ source: FEED, feedVersion: version, savedAt: new Date().toISOString(), ...fp }, null, 1) + '\n');
  console.log('Empreinte de référence enregistrée : tools/maxroll-baseline.json');
  process.exit(0);
}
if (!existsSync(BASELINE)) throw new Error('Pas de référence : lancer avec --save-baseline');
const base = JSON.parse(readFileSync(BASELINE, 'utf8'));

const lines = [];
for (const [key, label] of Object.entries(LABELS)) {
  const known = new Set(base[key] || []);
  const added = fp[key].filter(x => !known.has(x));
  if (!added.length) continue;
  lines.push(`${label} : ${added.length}`);
  for (const id of added.slice(0, 40)) {
    // Échantillon : premières lignes de la table, pour voir de quoi il s'agit
    const sample = key === 'enhanceCommon' ? stats.enhanceCommon[Object.keys(stats.enhanceCommon).find(k => k.startsWith(id + '#'))]
      : key === 'itemLevel' ? stats.itemLevel[Object.keys(stats.itemLevel).find(k => k.startsWith(id + '#'))]
      : key === 'itemQuality' ? stats.itemQuality[Object.keys(stats.itemQuality).find(k => k.startsWith(id + '#'))]
      : null;
    lines.push(`  - ${id}${sample ? '  ' + JSON.stringify(sample).slice(0, 220) : ''}`);
  }
  if (added.length > 40) lines.push(`  … et ${added.length - 40} autres`);
}

console.log(`Flux Maxroll ${version || '(fichier local)'} comparé à la référence du ${base.savedAt.slice(0, 10)}`);
if (!lines.length) {
  console.log('Rien de nouveau : le brassard n\'est pas encore dans le flux.');
  process.exit(0);
}
console.log(lines.join('\n'));
console.log('\nÀ faire : identifier le brassard, lire sa recette et sa table itemLevel dans tools/fetch-maxroll-honing.mjs,');
console.log('les comparer à la table de loa-sim (tools/build-bracer-table.mjs, data/bracer-t4.json) et la remplacer, puis --save-baseline.');
process.exit(2);
