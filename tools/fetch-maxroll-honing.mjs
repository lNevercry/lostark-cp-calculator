// Recettes d'affinage T4 (Aegir 1640 et Serka 1675) tirées du flux du planificateur Maxroll,
// les tables qu'utilise leur propre calculateur d'amélioration (même source que loseii.com).
// Usage : node tools/fetch-maxroll-honing.mjs [stats.json local]   → écrit data/honing-t4.json (et les tables ci-dessous)
// À relancer après un patch qui touche l'affinage, puis redéployer. Avec un fichier local : aucun appel à Maxroll.
import { writeFileSync, readFileSync } from 'node:fs';

const FEED = 'https://assets-ng.maxroll.gg/laplanner/game/stats.json';
const OUT = new URL('../data/honing-t4.json', import.meta.url);

// Matériaux du jeu → slug de l'API de prix (functions/api/market/prices.js)
const MAT_SLUGS = {
  66102006: 'destiny-destruction-stone',
  66102106: 'destiny-guardian-stone',
  66102007: 'destiny-crystallized-destruction-stone',
  66102107: 'destiny-crystallized-guardian-stone',
  6861012: 'abidos-fusion-material',
  6861013: 'superior-abidos-fusion-material',
  66110225: 'destiny-leapstone',
  66110226: 'great-destiny-leapstone'
};
const BREATH_SLUGS = { 66111131: 'lavas-breath', 66111132: 'glaciers-breath' };
// Recette commune : arme / armure de chaque palier
const TRACKS = {
  aegir: { weapon: '410500', armor: '410501' },
  serka: { weapon: '411100', armor: '411101' }
};
// Stats de base par iLvl (table itemLevel) : +N = baseIlvl + 5N. Arme : puissance d'arme (stat 151) ;
// armures : stat principale (stat 3) et Vitalité (stat 6, PV de la branche défense du CP support), par emplacement (catégories 10201…10205).
// Aegir : chaque niveau d'affinage avancé ajoute +1 iLvl à la pièce (profils lostark.bible : tout +18/40 = 1720),
// la table est donc aussi lue iLvl par iLvl jusqu'à +25 et 40 niveaux avancés. Serka : l'iLvl reste 1675 + 5N.
const STAT_ITEMS = {
  aegir: { baseIlvl: 1590, advIlvl: 40, weapon: '11159000', armor: { head: '11159011', chest: '11159012', pants: '11159013', gloves: '11159014', shoulder: '11159015' } },
  serka: { baseIlvl: 1675, weapon: '12159000', armor: { head: '12159011', chest: '12159012', pants: '12159013', gloves: '12159014', shoulder: '12159015' } }
};

let stats;
if (process.argv[2]) stats = JSON.parse(readFileSync(process.argv[2], 'utf8'));
else {
  const res = await fetch(FEED, { headers: { 'User-Agent': 'lostark-cp-calculator' } });
  if (!res.ok) throw new Error(`Flux Maxroll : HTTP ${res.status}`);
  stats = await res.json();
}
const common = stats.enhanceCommon;
const quality = stats.itemQuality;
const itemLevel = stats.itemLevel;

// Taux d'un souffle en 0,01 % (comme success). Le flux les donne en 0,001 % depuis l'ajout du brassard (2026-10-30, un
// souffle y vaut 0,375 %) : son calculateur divise la somme par 10. Arrêt si l'unité change encore : tous les souffles
// pleins valent additiveMax, dans l'unité du flux.
function breathRate(r, b) {
  if ((r.additive || []).some(a => a.rate * a.max * r.additive.length !== r.additiveMax)) throw new Error(`Unité des souffles inattendue : ${JSON.stringify(r.additive)} / ${r.additiveMax}`);
  return b.rate / 10;
}

function statAt(levelOption, ilvl, statId) {
  const row = itemLevel[`${levelOption}#${ilvl}`];
  const s = row && row.find(x => x.stat === statId);
  if (!s) throw new Error(`Stat ${statId} absente pour ${levelOption}#${ilvl}`);
  return s.value;
}

// Matériaux par niveau : portés par l'objet (itemQuality), qui renvoie vers sa recette commune
function matsFor(commonKey) {
  const all = Object.values(quality).filter(q => q && q.common === commonKey && q.mats);
  if (!all.length) throw new Error(`Aucun objet pour la recette ${commonKey}`);
  const ref = JSON.stringify(all[0].mats);
  // Toutes les pièces d'une même recette doivent coûter pareil, sinon la table ne tient pas
  if (all.some(q => JSON.stringify(q.mats) !== ref)) throw new Error(`Matériaux différents selon la pièce pour ${commonKey}`);
  const out = {};
  for (const [id, n] of Object.entries(all[0].mats)) {
    const slug = MAT_SLUGS[id];
    if (!slug) throw new Error(`Matériau inconnu ${id} dans ${commonKey}`);
    out[slug] = n;
  }
  return out;
}

const data = { source: FEED, generatedAt: new Date().toISOString(), note: 'lvl N = passage de +N à +N+1 ; taux en 0,01 %', tracks: {} };
for (const [track, pieces] of Object.entries(TRACKS)) {
  data.tracks[track] = {};
  for (const [piece, group] of Object.entries(pieces)) {
    const levels = {};
    for (let lvl = 10; lvl <= 24; lvl++) {
      const key = `${group}#${101 + lvl}`;
      const r = common[key];
      if (!r) throw new Error(`Recette absente : ${key}`);
      const breath = (r.additive || [])[0];
      levels[lvl] = {
        success: r.success,
        failBonus: r.failBonus,
        failMax: r.failMax,
        threshold: r.threshold,
        gold: (r.money && r.money['2']) || 0,
        shards: (r.money && r.money['18']) || 0,
        mats: matsFor(key),
        breath: breath ? { slug: BREATH_SLUGS[breath.id], rate: breathRate(r, breath), max: breath.max } : null
      };
    }
    data.tracks[track][piece] = levels;
  }
  const si = STAT_ITEMS[track];
  const ilvls = Array.from({ length: 26 }, (_, n) => si.baseIlvl + 5 * n);
  data.tracks[track].stats = {
    weaponPower: ilvls.map(i => statAt(si.weapon, i, 151)),
    mainStat: Object.fromEntries(Object.entries(si.armor).map(([slot, lo]) => [slot, ilvls.map(i => statAt(lo, i, 3))])),
    vitality: Object.fromEntries(Object.entries(si.armor).map(([slot, lo]) => [slot, ilvls.map(i => statAt(lo, i, 6))]))
  };
  if (si.advIlvl) {
    // byIlvl[k] = stat à baseIlvl + k (k = 5 × affinage + affinage avancé)
    const all = Array.from({ length: 5 * 25 + si.advIlvl + 1 }, (_, k) => si.baseIlvl + k);
    data.tracks[track].stats.byIlvl = {
      weaponPower: all.map(i => statAt(si.weapon, i, 151)),
      mainStat: Object.fromEntries(Object.entries(si.armor).map(([slot, lo]) => [slot, all.map(i => statAt(lo, i, 3))])),
      vitality: Object.fromEntries(Object.entries(si.armor).map(([slot, lo]) => [slot, all.map(i => statAt(lo, i, 6))]))
    };
  }
}

writeFileSync(OUT, JSON.stringify(data, null, 1));
console.log(`data/honing-t4.json écrit (${Object.keys(data.tracks).join(', ')})`);

// Battle Point des cœurs de la Grille d'Ark (table battlePoint du jeu, branche 1 = mode DPS) :
// par cœur, la valeur cumulée aux paliers 10 / 14 / 17 / 18 / 19 / 20 points, en 0,01 % de dégâts
// (chaque partie du Battle Point s'applique comme un multiplicateur 1 + bp / 10 000). null = option non chiffrée.
const CORE_STEPS = [10, 14, 17, 18, 19, 20];
const cores = {};
for (const row of Object.values(stats.battlePoint['1']).flat()) {
  if (!row || row.type !== 29) continue;
  const [id, step, value] = row.values;
  (cores[id] = cores[id] || CORE_STEPS.map(() => null))[step - 1] = value === undefined ? null : value;
}
const CORE_OUT = new URL('../data/ark-grid-bp.json', import.meta.url);
// Ark Passive (mode DPS) : valeur par point dépensé, en 0,01 % (5 = Évolution paliers 1 à 4, 6 = Éclairage, 7 = Bond)
const arkPassive = {};
for (const row of Object.values(stats.battlePoint['1']).flat()) {
  if (row && [5, 6, 7].includes(row.type)) arkPassive[row.type] = row.values[0];
}
writeFileSync(CORE_OUT, JSON.stringify({ source: FEED, generatedAt: new Date().toISOString(), steps: CORE_STEPS, dps: cores, arkPassive }));
console.log(`data/ark-grid-bp.json écrit (${Object.keys(cores).length} cœurs)`);

// Battle Point en mode support (table battlePoint du jeu, branche 2) : sert à recalculer le Battle Point d'un support
// quand lostark.bible l'a enregistré en mode DPS (arbre d'Ark Passive périmé : le jeu ne le met à jour qu'à la déconnexion).
// Par type de partie, les lignes brutes du jeu (valeurs en 0,01 %). Vérifié à l'identique sur 6 profils support réels.
const SUPPORT_TYPES = [1, 2, 3, 5, 6, 7, 10, 11, 15, 16, 17, 19, 20, 21, 22, 26, 27, 29, 30, 31, 34];
const supportRows = {};
for (const row of Object.values(stats.battlePoint['2']).flat()) {
  if (!row || !SUPPORT_TYPES.includes(row.type)) continue;
  (supportRows[row.type] = supportRows[row.type] || []).push(row.values);
}
const SUPPORT_OUT = new URL('../data/battle-point-support.json', import.meta.url);
// Options support des astrogemmes (arkGridGemOptions) : valeur de la stat par niveau d'option, en 0,01 %.
// 2011 = dégâts alliés (stat 59), 2012 = puissance de marque (stat 2 index 46), 2013 = amplification de PA alliée (stat 54),
// les mêmes stats que les lignes support des bijoux ; 2001 = PA % (stat 2 index 49, pool de PA des gravures, DPS).
// gemOptions[id][n - 1] = valeur au niveau n.
const gemOptions = {};
for (const id of [2001, 2011, 2012, 2013]) {
  const vals = [];
  for (let n = 1; stats.arkGridGemOptions[`${id}#${n}`]; n++) vals.push(stats.arkGridGemOptions[`${id}#${n}`].stat.value);
  if (!vals.length) throw new Error(`Option d'astrogemme ${id} absente`);
  gemOptions[id] = vals;
}
writeFileSync(SUPPORT_OUT, JSON.stringify({ source: FEED, generatedAt: new Date().toISOString(), rows: supportRows, gemOptions }));
console.log(`data/battle-point-support.json écrit (${Object.keys(supportRows).length} types de parties)`);

// Karma d'Illumination (table karma du jeu, planche 20000) : par niveau, chance d'un essai (0,01 %), énergie gagnée
// à chaque échec (0,01 % ; la jauge pleine garantit l'essai suivant), or par essai et puissance d'arme totale (0,01 %).
// levels[N] = passage de N à N + 1. Identique à la table de Loseii (loa-gpd/data/karma.json).
const karmaLevels = {};
for (const rank of Object.values(stats.karma['20000'].ranks)) {
  for (const [lv, v] of Object.entries(rank.levels)) {
    const cur = karmaLevels[lv];
    if (cur && !(v.prob > 0)) continue;
    karmaLevels[lv] = { prob: v.prob, care: v.care, gold: (v.money && v.money['2']) || 0, wp: v.stats[0].value };
  }
}
const KARMA_OUT = new URL('../data/karma-t4.json', import.meta.url);
writeFileSync(KARMA_OUT, JSON.stringify({ source: FEED, generatedAt: new Date().toISOString(), enlightenment: karmaLevels }));
console.log(`data/karma-t4.json écrit (${Object.keys(karmaLevels).length} niveaux d'Illumination)`);

// Gemmes de groupe (effets de type 34 dégâts / 35 recharge des profils lostark.bible, ex. « Barrage Skill » de l'Artilleur) :
// l'ID de l'effet est un groupe de compétences (table skillGroup), pas une compétence. Groupes tirés des options des
// gemmes T4 (itemRandom 650…), compétences et nom du groupe. Les effets 5 / 27 portent directement l'ID de la compétence.
const gemGroups = {};
for (const [key, opts] of Object.entries(stats.itemRandom)) {
  if (!key.startsWith('650')) continue;
  for (const m of JSON.stringify(opts).matchAll(/"type":3[45],"stat":0,"index":(\d+)/g)) {
    const g = stats.skillGroup[m[1]];
    if (!g || !Array.isArray(g.skills) || !g.skills.length) throw new Error(`Groupe de compétences ${m[1]} absent de skillGroup`);
    gemGroups[m[1]] = { name: g.name, skills: g.skills };
  }
}
const GEM_GROUPS_OUT = new URL('../data/gem-skill-groups.json', import.meta.url);
writeFileSync(GEM_GROUPS_OUT, JSON.stringify({ source: FEED, generatedAt: new Date().toISOString(), groups: gemGroups }));
console.log(`data/gem-skill-groups.json écrit (${Object.keys(gemGroups).length} groupes)`);

// Brassard T4 (Vambraces, raid Belgardin). Recette commune 411102, stats par niveau
// portées par l'objet (itemQuality 11675016 / 026 / 036 : même table, seul l'ID de la stat principale change), stats de
// base par rareté (itemStatic 1167501x6 … 1167531x6, stat 150 = % de PA de base, même pool que les gemmes).
// levels[N] = brassard +N ; steps[N] = passage de +N à +N+1, taux en 0,01 %. Jauge du niveau (shardsOnce) : exp du flux,
// cumulée, moins celle du niveau précédent, comme le calculateur de Maxroll ; chaque point coûte 1 fragment et
// feedSubCost d'argent. Déblocage : portée par la recette du niveau suivant (#111 = +10 ➔ Légendaire), itemAmount de
// itemId ou itemAmount ÷ replaceRatio de replaceItemId.
const BRACER_RECIPE = '411102', BRACER_STATS = '11675026', BRACER_MAIN = 4;
const BRACER_GRADE_KEYS = ['heroic', 'legendary', 'relic', 'ancient'];
const SPECTRAL_SHADE = 52810001, DEATHLY_HAND = 52810002;
const pick = (rows, id) => ((rows || []).find(x => x.stat === id) || {}).value || 0;
const bracerStatic = g => stats.itemStatic[`${BRACER_STATS.slice(0, 5)}${g}${BRACER_STATS.slice(6)}#${g + 3}`];
if (!bracerStatic(0)) throw new Error('Brassard absent du flux');
const bracerLevels = Array.from({ length: 26 }, (_, l) => {
  const q = l ? quality[`${BRACER_STATS}#${100 + l}`] : null;
  if (l && !q) throw new Error(`Niveau +${l} du brassard absent`);
  const base = bracerStatic(0), up = q ? q.stats : [];
  const sum = id => pick(base, id) + pick(up, id);
  return { mainStat: sum(BRACER_MAIN), weaponPower: sum(151), vitality: sum(6), flatAp: sum(114) };
});
const bracerSteps = [], bracerLimitBreak = {}, bracerMaxes = [];
for (let l = 0; l < 25; l++) {
  const key = `${BRACER_RECIPE}#${101 + l}`;
  const r = common[key];
  if (!r) throw new Error(`Recette absente : ${key}`);
  const once = r.exp - (l ? common[`${BRACER_RECIPE}#${100 + l}`].exp : 0);
  bracerSteps.push({
    success: r.success, failBonus: r.failBonus, failMax: r.failMax, threshold: r.threshold,
    gold: r.money['2'], silver: r.money['1'], shards: r.money['18'],
    shardsOnce: once / r.feedExp, silverOnce: once / r.feedExp * r.feedSubCost,
    mats: matsFor(key),
    breaths: r.additive.map(b => ({ slug: BREATH_SLUGS[b.id], rate: breathRate(r, b), max: b.max }))
  });
  const lb = r.limitBreak;
  if (lb) {
    const shade = lb.itemId === SPECTRAL_SHADE;
    if (!shade && lb.itemId !== DEATHLY_HAND) throw new Error(`Matériau de déblocage inconnu ${lb.itemId}`);
    bracerMaxes.push(l);
    bracerLimitBreak[l] = {
      grade: BRACER_GRADE_KEYS[bracerMaxes.length],
      remnant: shade ? lb.itemAmount : null,
      deathHand: shade ? lb.itemAmount / lb.replaceRatio : lb.itemAmount
    };
  }
}
if (bracerMaxes.length !== 3) throw new Error(`Déblocages du brassard : ${bracerMaxes}`);
const BRACER_OUT = new URL('../data/bracer-t4.json', import.meta.url);
writeFileSync(BRACER_OUT, JSON.stringify({
  source: FEED, generatedAt: new Date().toISOString(),
  note: 'levels[N] = brassard +N ; steps[N] = passage de +N à +N+1, taux en 0,01 % ; % de PA = rareté, gagné au déblocage',
  // Rareté : niveaux possibles et % de PA de base. Le brassard ne donne ni iLvl, ni qualité, ni points d'Ark Passive.
  grades: BRACER_GRADE_KEYS.map((key, g) => ({ key, min: g ? bracerMaxes[g - 1] : 0, max: bracerMaxes[g] ?? 25, apPct: pick(bracerStatic(g), 150) / 100 })),
  limitBreak: bracerLimitBreak,
  limitBreakItems: { remnant: { ko: '사령의 잔영', en: 'Spectral Shade' }, deathHand: { ko: '죽음의 손', en: 'Deathly Hand' } },
  levels: bracerLevels, steps: bracerSteps
}, null, 1));
console.log('data/bracer-t4.json écrit (+0 → +25)');
