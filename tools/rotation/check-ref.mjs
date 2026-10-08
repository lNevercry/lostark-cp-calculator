// Contrôle des références de rotation avant publication (harvest-bible.sh, ou à la main).
// Usage : node tools/rotation/check-ref.mjs <nouveau rotation-ref.json> <rotation-ref.json publié>
// Code 0 : publiable ; 1 : au moins un contrôle échoue (détail sur la sortie). Contrôles :
// - chaque série de centiles (21 valeurs) croissante et finie ; taux (activité, buffs, placement) dans [0, 1] ;
//   au moins REF_MIN_SAMPLES logs par groupe ;
// - par rapport à la version publiée : pas moins de spés couvertes, au moins 90 % des groupes, aucun groupe local
//   perdu en masse (fenêtre de 120 jours de la base locale : quelques groupes peuvent sortir).
import { readFileSync } from 'node:fs';

const [newPath, oldPath] = process.argv.slice(2);
if (!newPath || !oldPath) { console.error('Usage : node tools/rotation/check-ref.mjs <nouveau> <publié>'); process.exit(1); }
const N = JSON.parse(readFileSync(newPath, 'utf8'));
const O = JSON.parse(readFileSync(oldPath, 'utf8'));
const REF_MIN_SAMPLES = 8;
const errors = [];
const isSeries = a => Array.isArray(a) && a.length === 21 && a.every(x => typeof x === 'number');

function walk(o, at) {
  if (isSeries(o)) {
    if (o.some(x => !Number.isFinite(x))) errors.push(`valeur non finie : ${at}`);
    else if (o.some((x, i) => i && x < o[i - 1])) errors.push(`série non croissante : ${at}`);
    if (/(Rate|activity)$/.test(at) && (o[0] < 0 || o[20] > 1.0001)) errors.push(`taux hors de [0, 1] : ${at}`);
    return;
  }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, `${at}.${k}`);
  else if (typeof o === 'number' && !Number.isFinite(o)) errors.push(`valeur non finie : ${at}`);
}

if (!N.refs || !Object.keys(N.refs).length) errors.push('aucune référence');
for (const [k, v] of Object.entries(N.refs || {})) {
  if (!(v.n >= REF_MIN_SAMPLES)) errors.push(`${k} : ${v.n} logs (minimum ${REF_MIN_SAMPLES})`);
  walk(v, k);
}
walk(N.builds || {}, 'builds');

const keys = r => Object.keys(r.refs || {});
const specsOf = r => new Set(keys(r).map(k => k.replace(/^bible\|/, '').split('|')[0]));
const local = r => keys(r).filter(k => !k.startsWith('bible|'));
const [ns, os] = [specsOf(N), specsOf(O)];
const lost = [...os].filter(s => !ns.has(s));
if (lost.length) errors.push(`spés perdues : ${lost.join(', ')}`);
if (keys(N).length < 0.9 * keys(O).length) errors.push(`groupes : ${keys(N).length} contre ${keys(O).length} publiés (moins de 90 %)`);
if (local(N).length < 0.9 * local(O).length) errors.push(`groupes locaux : ${local(N).length} contre ${local(O).length} publiés (moins de 90 %)`);

const bible = r => keys(r).length - local(r).length;
console.log(`Références : ${keys(O).length} → ${keys(N).length} groupes (lostark.bible ${bible(O)} → ${bible(N)}, local ${local(O).length} → ${local(N).length}), ${os.size} → ${ns.size} spés`);
if (errors.length) {
  console.log(`${errors.length} contrôle(s) en échec :`);
  for (const e of [...new Set(errors)].slice(0, 30)) console.log(`  - ${e}`);
  process.exit(1);
}
console.log('Contrôles : OK');
