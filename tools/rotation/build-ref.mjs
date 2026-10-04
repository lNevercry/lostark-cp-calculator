// Références de rotation par spé et par boss, tirées de tous les raids de la base LOA Logs.
// Seules des distributions (quantiles tous les 5 %) et des fréquences sont écrites, aucun nom de joueur.
// Usage : node tools/rotation/build-ref.mjs [--db encounters.db] [--out fichier.json] [--days 120]
// Sortie par défaut : data/rotation-ref.json, servi au site (onglet Rotation). Groupes de moins de REF_MIN_SAMPLES logs
// non écrits : pickReference ne les utilise jamais.
// --days : seulement les combats des N derniers jours avant le plus récent (les façons de jouer changent avec les patchs).
//
// refs["spé|boss"] et refs["spé|*"] : rythme (activité, buffs, placement, utilisations par minute, rythme le plus rapide
// et gemmes de recharge par compétence, couverture et chevauchements des supports).
// builds["spé"] : build des 25 % de joueurs qui font le plus de dégâts pour leur CP (rang dans leur groupe
// spé | boss | difficulté ; supports : couverture de PA) : stats de l'Évolution, nœuds d'Ark Passive, gravures, gemmes.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { openDb, raidIds, loadEncounter } from './db.mjs';
import { analyzeEncounter, toQuantiles, scorePlayer, coverageMean, REF_MIN_SAMPLES, isStoneMalus } from '../../js/rotation/metrics.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg('--out', path.join(HERE, '..', '..', 'data', 'rotation-ref.json'));

// Refontes de classe : les logs d'avant ne décrivent plus la classe (compétences, rythmes). Date du patch EU, vérifiée
// sur les logs : Soulfist, dernière Energy Overflow le 2026-09-15, première Supreme Art (nouvelle spé) le 2026-09-18.
const CLASS_REWORKS = { Soulfist: '2026-09-16' };
const DATA = JSON.parse(readFileSync(path.join(HERE, '..', '..', 'data', 'rotation-skills.json'), 'utf8'));

const db = openDb(arg('--db'));
const DAYS = +arg('--days', 120);
const latest = db.get('SELECT MAX(fight_start) AS t FROM encounter_preview').t;
const since = latest - DAYS * 86400000;
// Raids seulement (ni gardiens ni donjons du chaos) : table raids de data/rotation-skills.json.
const ids = (await raidIds(db, { bosses: Object.keys(DATA.raids) })).filter(id => db.get('SELECT fight_start FROM encounter_preview WHERE id = ?', [id]).fight_start >= since);

const records = [];
const t0 = Date.now();
for (const [i, id] of ids.entries()) {
  let enc;
  try { enc = await loadEncounter(db, id); } catch { continue; }
  const { players: rows } = analyzeEncounter(enc, { skillMeta: DATA.skills, buffMeta: DATA.buffs });
  for (const a of rows) {
    if (!a.spec || a.spec === 'Unknown' || a.skills.reduce((t, s) => t + s.casts, 0) < 20) continue;
    if (CLASS_REWORKS[a.className] && enc.fightStart < Date.parse(CLASS_REWORKS[a.className])) continue;
    const minutes = a.availableMs / 60000;
    const sd = a.supportDetails;
    records.push({
      spec: a.spec, boss: enc.boss, group: `${a.spec}|${enc.boss}|${enc.difficulty}`, support: a.support,
      eff: a.support ? a.supportCoverage?.ap ?? null : a.combatPower ? a.dps / a.combatPower : null,
      activity: a.activity, apRate: a.apRate, fullBuffRate: a.fullBuffRate,
      positionalRate: a.positionalRate, positionalShare: a.positionalShare ?? 0,
      coverage: a.supportCoverage,
      apOverlapPerMin: sd ? sd.apOverlapMs / 1000 / minutes : null,
      apGapPerMin: sd ? sd.apGapMs / 1000 / minutes : null,
      brandGapPerMin: sd ? sd.brandGapMs / 1000 / minutes : null,
      shieldEfficiency: sd?.shields.efficiency ?? null, shieldProtected: sd?.shields.protectedShare ?? null, shieldBig: sd?.shields.bigShielded ?? null,
      shieldList: sd ? sd.shields.list.map(x => ({ id: x.id, eff: x.efficiency, given: x.given })) : [],
      skills: a.skills.filter(s => s.casts).map(s => ({ id: s.id, name: s.name, cpm: s.cpm, share: s.share, fast: s.fastIntervalMs, gemCd: s.gemCooldown })),
      build: a.build,
    });
  }
  if ((i + 1) % 250 === 0) console.log(`${i + 1}/${ids.length} combats…`);
}

const push = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };

// 25 % meilleurs de chaque groupe spé | boss | difficulté (DPS ÷ CP ; supports : couverture de PA du groupe).
const byGroup = new Map();
for (const r of records) if (r.eff != null) push(byGroup, r.group, r);
for (const g of byGroup.values()) {
  if (g.length < 4) continue;
  g.sort((x, y) => y.eff - x.eff);
  g.slice(0, Math.ceil(g.length / 4)).forEach(r => { r.top = true; });
}

const median = v => toQuantiles(v)?.[10] ?? null;
const freq = (counts, n) => Object.fromEntries([...counts].map(([k, c]) => [k, +(c / n).toFixed(3)]));

function rhythm(rs) {
  const skills = new Map();
  for (const r of rs) for (const s of r.skills) {
    if (!skills.has(s.id)) skills.set(s.id, { name: s.name, users: 0, cpm: [], share: [], fast: [], gemCd: [] });
    const k = skills.get(s.id);
    k.users++; k.cpm.push(s.cpm); k.share.push(s.share);
    if (s.gemCd != null) k.gemCd.push(s.gemCd); // logs de lostark.bible : gemmes inconnues
    if (s.fast != null) k.fast.push(s.fast);
  }
  const out = {};
  for (const [id, k] of skills) {
    const usage = k.users / rs.length;
    if (usage < 0.1) continue;
    const withGem = k.gemCd.filter(x => x > 0);
    out[id] = {
      name: k.name, usage: +usage.toFixed(3), shareMedian: +median(k.share).toFixed(4), cpm: toQuantiles(k.cpm),
      fastIntervalMedianMs: median(k.fast), gemCdShare: k.gemCd.length ? +(withGem.length / k.gemCd.length).toFixed(3) : null, gemCdMedian: median(withGem),
    };
  }
  const q = f => toQuantiles(rs.map(r => r[f]).filter(x => x != null));
  const sup = rs.filter(r => r.coverage);
  return {
    n: rs.length, activity: q('activity'), apRate: q('apRate'), fullBuffRate: q('fullBuffRate'),
    positionalRate: q('positionalRate'), positionalShareMedian: median(rs.map(r => r.positionalShare)), skills: out,
    ...(sup.length ? {
      support: Object.fromEntries(['ap', 'brand', 'identity', 'hat'].map(k => [k, toQuantiles(sup.map(r => r.coverage[k]))])),
      supportTiming: { apOverlapPerMin: q('apOverlapPerMin'), apGapPerMin: q('apGapPerMin'), brandGapPerMin: q('brandGapPerMin') },
      shields: shieldRef(rs),
    } : {}),
  };
}

// Boucliers : part utile (absorbé ÷ donné) au total et par bouclier, et part des dégâts du groupe évitée.
function shieldRef(rs) {
  const per = new Map();
  for (const r of rs) for (const s of r.shieldList || []) { if (!per.has(s.id)) per.set(s.id, []); per.get(s.id).push(s.eff); }
  const q = f => toQuantiles(rs.map(r => r[f]).filter(x => x != null));
  return {
    efficiency: q('shieldEfficiency'), protectedShare: q('shieldProtected'), bigShielded: q('shieldBig'),
    byShield: Object.fromEntries([...per].filter(([, v]) => v.length >= 5).map(([id, v]) => [id, { n: v.length, efficiency: toQuantiles(v) }])),
  };
}

function build(rs) {
  const top = rs.filter(r => r.top);
  if (top.length < 5) return null;
  const nodes = new Map(), engr = new Map(), gems = new Map();
  for (const r of top) {
    for (const id of Object.keys(r.build.nodes)) nodes.set(id, (nodes.get(id) || 0) + 1);
    for (const e of r.build.engravings) if (!isStoneMalus(e)) engr.set(e, (engr.get(e) || 0) + 1);
    for (const s of r.skills) {
      if (s.gemCd == null) continue;
      if (!gems.has(s.id)) gems.set(s.id, { name: s.name, n: 0, withGem: [] });
      const g = gems.get(s.id);
      g.n++;
      if (s.gemCd > 0) g.withGem.push(s.gemCd);
    }
  }
  const evolution = {};
  for (const k of ['crit', 'specialization', 'swiftness', 'domination', 'endurance']) evolution[k] = toQuantiles(top.map(r => r.build.evolution[k]));
  return {
    n: top.length, evolution, nodes: freq(nodes, top.length), engravings: freq(engr, top.length),
    gemCd: Object.fromEntries([...gems].filter(([, g]) => g.n >= top.length * 0.5)
      .map(([id, g]) => [id, { name: g.name, share: +(g.withGem.length / g.n).toFixed(3), median: median(g.withGem) }])),
  };
}

const refs = {}, builds = {};
const bySpecBoss = new Map(), bySpec = new Map();
for (const r of records) { push(bySpecBoss, `${r.spec}|${r.boss}`, r); push(bySpec, r.spec, r); }
for (const [k, rs] of bySpecBoss) if (rs.length >= REF_MIN_SAMPLES) refs[k] = rhythm(rs);
for (const [spec, rs] of bySpec) {
  if (rs.length >= REF_MIN_SAMPLES) refs[`${spec}|*`] = rhythm(rs);
  const b = build(rs);
  if (b) builds[spec] = b;
}

// Logs de lostark.bible (fetch-bible-ref.mjs) : références « bible|spé|boss » et « bible|spé|* » faites des logs autour
// de la médiane de DPS du site, rythmes sur toute la chronologie (basis « timeline ») ; build des 25 % meilleurs
// (DPS ÷ CP, logs médians et meilleurs) seulement pour une spé sans build local. pickReference ne s'en sert qu'à
// défaut de référence locale.
const BIBLE = path.join(HERE, '..', 'samples', 'bible-records.json');
const bible = existsSync(BIBLE) ? JSON.parse(readFileSync(BIBLE, 'utf8')).records : [];
const bibleSpecs = new Map(), bibleBoss = new Map();
for (const r of bible) push(bibleSpecs, r.spec, r);
// Rythmes : logs autour de la médiane et leurs coéquipiers (« median-party ») ; jamais les meilleurs.
const isMedian = r => r.sample === 'median' || r.sample === 'median-party';
for (const r of bible) if (isMedian(r)) push(bibleBoss, `${r.spec}|${r.boss}`, r);
const bibleRef = rs => ({ ...rhythm(rs), source: 'lostark.bible', basis: 'timeline' });
for (const [k, rs] of bibleBoss) if (rs.length >= REF_MIN_SAMPLES) refs[`bible|${k}`] = bibleRef(rs);
for (const [spec, rs] of bibleSpecs) {
  const med = rs.filter(isMedian);
  if (med.length >= REF_MIN_SAMPLES) refs[`bible|${spec}|*`] = bibleRef(med);
  if (builds[spec]) continue;
  for (const g of new Map(rs.map(r => [r.group, rs.filter(x => x.group === r.group && x.eff != null)])).values()) {
    g.sort((x, y) => y.eff - x.eff);
    g.slice(0, Math.ceil(g.length / 4)).forEach(r => { r.top = true; });
  }
  const b = build(rs);
  if (b) builds[spec] = { ...b, source: 'lostark.bible' };
}
for (const [k, rs] of bibleBoss) bySpecBoss.set(`bible|${k}`, rs);
for (const [spec, rs] of bibleSpecs) bySpec.set(`bible|${spec}`, rs.filter(isMedian));

// Répartition des notes et de la couverture brute de chaque groupe (« Top X % » du site) : chaque log noté sur la
// référence que le site lui appliquerait (même spé et même boss, sinon même spé tous boss).
for (const [key, ref] of Object.entries(refs)) {
  const rs = key.endsWith('|*') ? bySpec.get(key.slice(0, -2)) : bySpecBoss.get(key);
  ref.score = toQuantiles(rs.map(r => scorePlayer({ ...r, supportCoverage: r.coverage }, ref)?.score));
  if (ref.support) ref.support.mean = toQuantiles(rs.map(r => coverageMean(r.coverage)));
}

writeFileSync(OUT, JSON.stringify({ built: new Date().toISOString(), since: new Date(since).toISOString().slice(0, 10), encounters: ids.length, players: records.length, refs, builds }));
console.log(`${ids.length} combats, ${records.length} joueurs, ${Object.keys(refs).length} groupes spé|boss, ${Object.keys(builds).length} builds → ${path.relative(process.cwd(), OUT)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
