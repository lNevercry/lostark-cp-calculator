// Logs de lostark.bible pour les spés que la base locale de LOA Logs connaît mal (ex. Dimensionalist, sorti le
// 2026-09-18) : ils complètent les références de rotation (build-ref.mjs), jamais ne les remplacent.
// Lancé toutes les 2 h par cron via tools/rotation/harvest-bible.sh (sessions courtes, reprise automatique).
// Usage : node tools/rotation/fetch-bible-ref.mjs [--specs auto | "Time Wielder,Space Wielder"] [--median 10] [--best 5]
// --specs auto (défaut) : par boss, les spés DPS sans référence locale sur ce boss (data/rotation-ref.json). Supports
// exclus : leur note repose sur la couverture du groupe calculée par LOA Logs, absente des logs du site.
//
// Source : statistiques de raid du site (fonctions distantes raidStatsSearch / raidSamplesSearch). Pour chaque boss,
// difficulté et spé, le site propose 25 logs autour de la médiane de DPS (environ 35e-65e centile), 25 autour du
// quartile haut et 25 parmi les meilleurs ; il ignore les seuils envoyés et n'a rien sous la médiane. D'où :
// - « median » : les logs autour de la médiane, seule base des rythmes comparés (comparer à des logs plus forts que
//   la moyenne rendrait la note trop sévère) ;
// - « best » : les meilleurs, pour le build seulement (avec les médians, classés par DPS ÷ CP comme en local).
// Un log de lostark.bible n'a pas le détail coup par coup (buffs actifs) : seulement les utilisations datées, les
// dégâts par compétence, de dos et de face, les gravures et l'Ark Passive. Rythmes calculés sur toute la chronologie
// du combat (basis « timeline ») : le site ne permet pas de retirer les phases sans boss comme en local.
//
// Une requête à la fois, PAUSE_MS entre deux ; chaque log lu est gardé dans tools/samples/bible-logs/ (jamais relu
// en ligne). Sortie : tools/samples/bible-records.json, lu par build-ref.mjs.
// --campaign ID (harvest-bible.sh, une campagne toutes les 2 semaines) : récolte neuve, quotas comptés sur la campagne
// seulement, en cours dans bible-records.next.json ; bible-records.json (campagne précédente) n'est remplacé qu'une fois
// tout récolté. Un log déjà en cache reproposé par le site est repris sans appel.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { findRemotes, latestPatch, remote, fetchLog, RateLimited } from './bible.mjs';
import { playerBuild, quantile } from '../../js/rotation/metrics.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES = path.join(HERE, '..', 'samples');
const CACHE = path.join(SAMPLES, 'bible-logs');
const OUT = path.join(SAMPLES, 'bible-records.json');
const NEXT = path.join(SAMPLES, 'bible-records.next.json');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SPECS_ARG = arg('--specs', 'auto');
const CAMPAIGN = arg('--campaign', null);
const WORK = CAMPAIGN ? NEXT : OUT;
const SUPPORT_SPECS = new Set(['Blessed Aura', 'Desperate Salvation', 'Full Bloom', 'Liberator']);
const LOCAL = JSON.parse(readFileSync(path.join(HERE, '..', '..', 'data', 'rotation-ref.json'), 'utf8')).refs;
// Spés visées sur un boss : celles demandées, ou (auto) les spés DPS sans référence locale sur ce boss.
const targetsFor = (boss, statSpecs) => SPECS_ARG === 'auto'
  ? statSpecs.filter(sp => sp && sp !== 'Unknown' && !SUPPORT_SPECS.has(sp) && !LOCAL[`${sp}|${boss}`])
  : SPECS_ARG.split(',').map(x => x.trim()).filter(Boolean);
const PER_MEDIAN = +arg('--median', 10);
const PER_BEST = +arg('--best', 5);
const MIN_COUNT = 30; // combinaison boss / difficulté avec moins de logs de la spé : ignorée
let PATCH = arg('--patch', null); // résolu plus bas (patch de la campagne, sinon le dernier du site)
// Logs téléchargés au plus par lancement : la récolte se fait en plusieurs sessions espacées (reprise automatique).
const MAX_DOWNLOADS = +arg('--max-logs', 60);
let downloads = 0;
const DATA = JSON.parse(readFileSync(path.join(HERE, '..', '..', 'data', 'rotation-skills.json'), 'utf8'));

// Raids récents dans leur mode le plus joué par les joueurs avancés (demande de l'auteur, 2026-10-03 : de meilleurs logs
// et toutes les classes représentées) : Cathédrale niveaux 3 et 2, Serca et Kazeros en Difficile. Dans cet ordre (le plus
// récent d'abord) : une session coupée par son plafond a déjà couvert l'essentiel.
const RAIDS = [
  [['Archbishop Arcenos', 'Arcenos, Vanguard of Fanaticism'], ['Level 3', 'Level 2']],
  [['Witch of Agony, Serca', 'Corvus Tul Rak'], ['Hard']],
  [['Abyss Lord Kazeros', 'Death Incarnate Kazeros'], ['Hard']],
];
const inScope = r => RAIDS.some(([bosses, diffs]) => bosses.includes(r.boss) && diffs.includes(r.difficulty));

mkdirSync(CACHE, { recursive: true });

// Joueur d'un log de lostark.bible → enregistrement au format de build-ref.mjs.
function toRecord(info, p, sample) {
  const enc = info.encounter;
  const timelineMs = Math.max(enc.duration, (enc.lastCombatPacket || 0) - enc.fightStart);
  const minutes = timelineMs / 60000;
  const skills = Object.values(p.skills || {});
  const total = p.damageStats?.damageDealt || skills.reduce((t, s) => t + (s.totalDamage || 0), 0);
  let posDmg = 0, posOk = 0;
  const out = [];
  for (const s of skills) {
    const times = (s.castLog || []).slice().sort((a, b) => a - b);
    const meta = DATA.skills[s.id] || DATA.skills[s.id - (s.id % 10)];
    const mask = meta ? meta.dm : 0;
    if (mask && s.totalDamage) {
      posDmg += s.totalDamage;
      posOk += (mask & 1 ? s.backAttackDamage || 0 : 0) + (mask & 2 ? s.frontAttackDamage || 0 : 0);
    }
    if (!times.length) continue;
    const iv = times.slice(1).map((t, i) => t - times[i]).sort((a, b) => a - b);
    out.push({ id: s.id, name: s.name, cpm: times.length / minutes, share: total ? (s.totalDamage || 0) / total : 0, fast: quantile(iv, 0.1), gemCd: null });
  }
  return {
    source: 'bible', sample, logId: info.id, date: new Date(enc.fightStart).toISOString().slice(0, 10), ...(CAMPAIGN && { campaign: CAMPAIGN }), name: p.name, spec: p.spec, boss: enc.currentBossName, difficulty: enc.difficulty,
    group: `${p.spec}|${enc.currentBossName}|${enc.difficulty}`, support: false,
    eff: p.combatPower ? (p.damageStats?.dps || total / (timelineMs / 1000)) / p.combatPower : null,
    activity: null, apRate: null, fullBuffRate: null,
    positionalRate: posDmg ? posOk / posDmg : null, positionalShare: total ? posDmg / total : 0,
    coverage: null, skills: out,
    build: playerBuild({ arkPassive: p.arkPassiveData, engravings: p.engravingData || [] }),
  };
}

// Joueurs du log dont la spé est visée sur ce boss : la spé échantillonnée garde son échantillon (« median » /
// « best »), les autres sont marqués « median-party » / « best-party » (coéquipiers, pris au hasard de leur spé).
async function logRecords(id, spec, sample, targets) {
  const file = path.join(CACHE, `${id}.json`);
  let info;
  if (existsSync(file)) info = JSON.parse(readFileSync(file, 'utf8'));
  else {
    if (downloads >= MAX_DOWNLOADS) return null;
    downloads++;
    info = await fetchLog(id);
    // Cache réduit aux joueurs (les buffs du combat pèsent la plupart des 300 Ko)
    const e = info.encounter;
    info = { id: info.id, encounter: { fightStart: e.fightStart, lastCombatPacket: e.lastCombatPacket, duration: e.duration, difficulty: e.difficulty, currentBossName: e.currentBossName,
      entityList: e.entityList.filter(x => x.entityType === 'PLAYER').map(x => ({ name: x.name, class: x.class, spec: x.spec, combatPower: x.combatPower, engravingData: x.engravingData, arkPassiveData: x.arkPassiveData,
        damageStats: { dps: x.damageStats?.dps, damageDealt: x.damageStats?.damageDealt },
        skills: Object.fromEntries(Object.entries(x.skills || {}).map(([k, s]) => [k, { id: s.id, name: s.name, totalDamage: s.totalDamage, castLog: s.castLog, backAttackDamage: s.backAttackDamage, frontAttackDamage: s.frontAttackDamage }])) })) } };
    writeFileSync(file, JSON.stringify(info));
  }
  return info.encounter.entityList
    .filter(p => targets.has(p.spec) && Object.values(p.skills).some(s => s.castLog?.length))
    .map(p => toRecord(info, p, p.spec === spec ? sample : `${sample}-party`));
}

const readRecords = f => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
// Campagne : reprise de la campagne en cours seulement (fichier d'une autre campagne : on repart de zéro).
const work = readRecords(WORK);
const prev = !work ? [] : CAMPAIGN && work.campaign !== CAMPAIGN ? [] : work.records;
// Reprise : les enregistrements déjà faits sont gardés (un même joueur d'un même log une seule fois).
// (enregistrements d'avant le nom du joueur : refaits depuis le cache, sans appel en ligne)
// Hors des raids choisis (ex. Armoche, Normal) : retirés des références.
const records = SPECS_ARG === 'auto' ? prev.filter(r => r.name && inScope(r)) : prev.filter(r => !SPECS_ARG.split(',').map(x => x.trim()).includes(r.spec));
const seen = new Set(records.map(r => `${r.logId}|${r.name}`));
const save = () => writeFileSync(WORK, JSON.stringify({ built: new Date().toISOString(), patch: PATCH, ...(CAMPAIGN && { campaign: CAMPAIGN }), records }));
process.on('uncaughtException', e => { save(); console.error(e instanceof RateLimited ? `lostark.bible limite le débit (${e.message}) : arrêt, ${records.length} enregistrements gardés.` : e); process.exit(e instanceof RateLimited ? 2 : 1); });
process.on('unhandledRejection', e => { save(); console.error(e instanceof RateLimited ? `lostark.bible limite le débit (${e.message}) : arrêt, ${records.length} enregistrements gardés.` : e); process.exit(e instanceof RateLimited ? 2 : 1); });
// Patch : --patch, sinon celui de la campagne en cours, sinon (nouvelle campagne) le dernier « … Balance » du site ;
// hors campagne, le dernier relevé (bible-patch.json).
const PATCH_FILE = path.join(SAMPLES, 'bible-patch.json');
const knownPatch = existsSync(PATCH_FILE) ? JSON.parse(readFileSync(PATCH_FILE, 'utf8')) : null;
if (!PATCH && CAMPAIGN && work?.campaign === CAMPAIGN && work.patch) PATCH = work.patch;
if (!PATCH && CAMPAIGN) {
  const found = await latestPatch(knownPatch?.node);
  writeFileSync(PATCH_FILE, JSON.stringify(found));
  PATCH = found.patch;
  console.log(`Patch de la campagne : ${found.label} (${found.patch})${knownPatch && knownPatch.patch !== found.patch ? `, nouveau (avant : ${knownPatch.patch})` : ''}`);
}
if (!PATCH) PATCH = knownPatch?.patch || 'sep26';
const filters = { minGearScore: 1700, maxGearScore: 1800, minCombatPower: undefined, maxCombatPower: undefined, includeBus: false, includeWeird: false, patch: PATCH };
// Identifiants des fonctions distantes gardés d'un lancement à l'autre (les retrouver lit ~70 fichiers du site) ;
// recherchés à nouveau seulement s'ils ne répondent plus (mise à jour du site).
const REMOTES = path.join(SAMPLES, 'bible-remotes.json');
let ids = existsSync(REMOTES) ? JSON.parse(readFileSync(REMOTES, 'utf8')) : null;
const statsOf = (boss, difficulty) => remote(ids.raidStatsSearch, { boss, difficulty, isSupport: false, filterBy: 'ilvl', dpsType: 'ndps', ...filters });
let firstStats = null;
if (ids) { try { firstStats = await statsOf(RAIDS[0][0][0], RAIDS[0][1][0]); } catch (e) { if (e instanceof RateLimited) throw e; } }
if (!firstStats) {
  ids = await findRemotes(['raidStatsSearch', 'raidSamplesSearch']);
  writeFileSync(REMOTES, JSON.stringify(ids));
}
const have = (spec, boss, difficulty, prefix) => records.filter(r => r.spec === spec && r.boss === boss && r.difficulty === difficulty && r.sample.startsWith(prefix)).length;
for (const [bosses, difficulties] of RAIDS) for (const boss of bosses) for (const difficulty of difficulties) {
  if (downloads >= MAX_DOWNLOADS) break;
  const st = firstStats && boss === RAIDS[0][0][0] && difficulty === RAIDS[0][1][0] ? firstStats : await statsOf(boss, difficulty);
  const stats = (st?.stats || []).filter(x => x.count >= MIN_COUNT);
  const targets = new Set(targetsFor(boss, stats.map(x => x.spec)));
  // Les plus jouées d'abord : leurs logs apportent aussi des coéquipiers des autres spés visées.
  for (const s of stats.filter(x => targets.has(x.spec)).sort((x, y) => y.count - x.count)) {
    if (downloads >= MAX_DOWNLOADS) break; // plafond atteint : plus d'appel inutile (la liste de combats coûte 15 s)
    const spec = s.spec;
    const needMedian = PER_MEDIAN - have(spec, boss, difficulty, 'median'), needBest = PER_BEST - have(spec, boss, difficulty, 'best');
    if (needMedian <= 0 && needBest <= 0) continue;
    const sm = await remote(ids.raidSamplesSearch, { boss, difficulty, spec, ceiling: s.upperWhisker, q3: s.q3, median: s.median, ...filters, statType: 'ndps' });
    const picks = [...(sm?.median || []).slice(0, Math.max(0, needMedian)).map(x => [x.id, 'median']), ...(sm?.ceiling || []).slice(0, Math.max(0, needBest)).map(x => [x.id, 'best'])];
    let n = 0;
    for (const [id, sample] of picks) {
      try {
        const rs = await logRecords(id, spec, sample, targets);
        if (!rs) continue; // plafond de la session atteint : la suite au prochain lancement
        for (const r of rs) {
          if (seen.has(`${r.logId}|${r.name}`)) continue;
          seen.add(`${r.logId}|${r.name}`);
          records.push(r);
          n++;
        }
      } catch (e) {
        if (e instanceof RateLimited) { save(); console.error(`lostark.bible limite le débit (${e.message}) : arrêt, ${records.length} enregistrements gardés. Relancer plus tard.`); process.exit(2); }
        console.warn(`  ${id} : ${e.message}`);
      }
    }
    console.log(`${spec} · ${boss} · ${difficulty} : ${s.count} logs sur le site, ${n} joueurs ajoutés`);
  }
  save();
}
save();
const complete = downloads < MAX_DOWNLOADS;
// Campagne terminée : elle remplace la précédente.
if (CAMPAIGN && complete) renameSync(NEXT, OUT);
console.log(`${records.length} enregistrements → ${path.relative(process.cwd(), complete ? OUT : WORK)} (${downloads} logs téléchargés${downloads >= MAX_DOWNLOADS ? ', plafond de la session atteint : relancer plus tard pour la suite' : ''})`);
// Code de sortie (lu par harvest-bible.sh) : 0 = tout est récolté, 3 = plafond atteint (relancer plus tard),
// 2 = lostark.bible limite le débit (attendre avant de relancer).
process.exit(complete ? 0 : 3);
