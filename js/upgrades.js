// Pierre d'aptitude, cohérence du Battle Point, Karma, livres reliques, campagne de bracelet (worker).
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- Pierre d'aptitude T4 (Grande pierre d'envol : 10 nœuds par ligne) ---
// Prix (gold) d'une pierre non taillée : 9 pheons, au prix du pheon réglable dans l'onglet GPD (défaut Loseii)
const abilityStonePrice = () => ABILITY_STONE_PHEONS * gpdUnitPrice('pheon');
// Niveau de pierre 1…4 atteint à 6 / 7 / 9 / 10 nœuds
const STONE_LEVEL_NODES = [6, 7, 9, 10];
// Somme des niveaux positifs >= 5 : Puissance d'attaque de base +1,5 %
const STONE_BASE_AP_BONUS = 0.015;
// Pool « Atk. Power +X % » du DPS de référence de Loseii hors Adrénaline (loa-gpd/docs/research/reference-character.md :
// gemmes niv. 9 11 %, pierre 1,5 %, 2 boucles PA % 3,1 %, cœur Attaque ancien 2,68 %, nœud PA niv. 60 2,2 %).
// Repli quand le profil ne se lit pas (otherAttackPowerPct).
const REF_OTHER_AP_PCT = 20.48;
const stoneSuccessCache = new Map();
// Au-delà de ce nombre de pierres, un palier n'est plus un achat réaliste (un 10/x s'achète taillé à l'hôtel
// des ventes, sans prix connu) : pas de ligne GPD. Loseii ne chiffre que le palier niveau 5 (1 sur ~725).
const STONE_GPD_MAX_STONES = 5000;

function stoneLevelFromNodes(nodes) {
  let lvl = 0;
  STONE_LEVEL_NODES.forEach((t, i) => { if (nodes >= t) lvl = i + 1; });
  return lvl;
}

/**
 * Probabilité exacte d'obtenir au moins `a` nœuds sur la gravure 1 et `b` sur la gravure 2,
 * stratégie de taille optimale (chaîne de Markov / programmation dynamique) :
 * 10 tentatives par ligne, chance de départ 75 %, -10 % après un succès, +10 % après un échec (25 %…75 %).
 * La ligne négative sert de « ligne de délestage » pour remonter la chance ; son résultat est ignoré.
 */
function stoneSuccessProbability(a, b) {
  const cacheKey = `${a}/${b}`;
  if (stoneSuccessCache.has(cacheKey)) return stoneSuccessCache.get(cacheKey);
  const N = 10;
  const P = [0.25, 0.35, 0.45, 0.55, 0.65, 0.75];
  const memo = new Map();
  const V = (r1, s1, r2, s2, r3, pi) => {
    if (s1 >= a && s2 >= b) return 1;
    if (s1 + r1 < a || s2 + r2 < b) return 0;
    const key = ((((r1 * 11 + s1) * 11 + r2) * 11 + s2) * 11 + r3) * 6 + pi;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    const p = P[pi], up = Math.min(5, pi + 1), dn = Math.max(0, pi - 1);
    let best = 0;
    if (r1 > 0) best = Math.max(best, p * V(r1 - 1, Math.min(a, s1 + 1), r2, s2, r3, dn) + (1 - p) * V(r1 - 1, s1, r2, s2, r3, up));
    if (r2 > 0) best = Math.max(best, p * V(r1, s1, r2 - 1, Math.min(b, s2 + 1), r3, dn) + (1 - p) * V(r1, s1, r2 - 1, s2, r3, up));
    if (r3 > 0) best = Math.max(best, p * V(r1, s1, r2, s2, r3 - 1, dn) + (1 - p) * V(r1, s1, r2, s2, r3 - 1, up));
    memo.set(key, best);
    return best;
  };
  const prob = V(N, 0, N, 0, N, 5);
  stoneSuccessCache.set(cacheKey, prob);
  return prob;
}

/**
 * Probabilité exacte (taille optimale, mêmes règles) que la somme des niveaux des deux gravures atteigne
 * `minSum`, quel que soit l'ordre (9/7, 7/9, 10/6…) : seuil de la PA de base +1,5 %. Loseii : 1 pierre sur ~725.
 */
function stoneLevelSumProbability(minSum) {
  const cacheKey = `sum${minSum}`;
  if (stoneSuccessCache.has(cacheKey)) return stoneSuccessCache.get(cacheKey);
  const N = 10;
  const P = [0.25, 0.35, 0.45, 0.55, 0.65, 0.75];
  const memo = new Map();
  const V = (r1, s1, r2, s2, r3, pi) => {
    if (stoneLevelFromNodes(s1) + stoneLevelFromNodes(s2) >= minSum) return 1;
    if (stoneLevelFromNodes(s1 + r1) + stoneLevelFromNodes(s2 + r2) < minSum) return 0;
    const key = ((((r1 * 11 + s1) * 11 + r2) * 11 + s2) * 11 + r3) * 6 + pi;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    const p = P[pi], up = Math.min(5, pi + 1), dn = Math.max(0, pi - 1);
    let best = 0;
    if (r1 > 0) best = Math.max(best, p * V(r1 - 1, s1 + 1, r2, s2, r3, dn) + (1 - p) * V(r1 - 1, s1, r2, s2, r3, up));
    if (r2 > 0) best = Math.max(best, p * V(r1, s1, r2 - 1, s2 + 1, r3, dn) + (1 - p) * V(r1, s1, r2 - 1, s2, r3, up));
    if (r3 > 0) best = Math.max(best, p * V(r1, s1, r2, s2, r3 - 1, dn) + (1 - p) * V(r1, s1, r2, s2, r3 - 1, up));
    memo.set(key, best);
    return best;
  };
  const prob = V(N, 0, N, 0, N, 5);
  stoneSuccessCache.set(cacheKey, prob);
  return prob;
}

// Profil raid « mélangé » : lostark.bible calcule le Battle Point selon l'arbre d'Illumination enregistré.
// Un joueur qui quitte après un donjon du chaos en arbre DPS peut laisser un profil raid de support avec
// ses gravures support mais un Battle Point en mode DPS (PV à 0, gravures support sans valeur).
// Ces chiffres ne se comparent pas à ceux d'un profil cohérent.
function hasMixedRaidProfile(c, roleOverride) {
  const bp = c && c.rawProfile && c.rawProfile.battlePoint;
  if (!bp || typeof bp.isSupport !== 'boolean') return false;
  const role = roleOverride || c.role;
  if (role === 'support') return bp.isSupport === false;
  if (role === 'dps') return bp.isSupport === true;
  return false;
}

/**
 * Cohérence du Battle Point : CP raid ÷ CP reconstitué depuis les parties du profil. DPS : attaque de base (type 1)
 * × produit des autres parties (1 + v / 10 000) ÷ 10 000 ; support : branche buff + branche défense
 * (supportBpBranches). Mesuré sur 70 profils réels : 0,99 à 1,04 (DPS), 0,96 à 0,99 (support). Un profil hors de ces
 * bornes a des parties manquantes sur lostark.bible (ex. cœurs absents, rapport 2,2) : ses écarts par système seraient
 * faux. null si le profil n'a pas de Battle Point.
 */
function battlePointCoherence(c, roleOverride) {
  const parts = battlePointPartsOf(c);
  const cp = c && ((c.rawProfile && c.rawProfile.raidCombatPower) || c.cp);
  const t1 = parts.find(p => p.type === 1);
  if (!(cp > 0) || !t1 || !(t1.value > 0)) return null;
  const role = roleOverride || c.role;
  if (role === 'support') {
    const br = supportBpBranches(c);
    return br && br.A + br.D > 0 ? cp / (br.A + br.D) : null;
  }
  const prod = parts.filter(p => p.type > 2).reduce((m, p) => m * (1 + ((('value' in p) ? p.value : p.min) || 0) / 1e4), 1);
  return cp / (t1.value * prod / 1e4);
}
const BP_COHERENCE_RANGE = { dps: [0.95, 1.08], support: [0.92, 1.06] };
function hasIncompleteBattlePoint(c, roleOverride) {
  const role = (roleOverride || (c && c.role)) === 'support' ? 'support' : 'dps';
  const r = battlePointCoherence(c, role);
  if (r === null) return false;
  const [lo, hi] = BP_COHERENCE_RANGE[role];
  return r < lo || r > hi;
}

// Karma T4 lu sur le Battle Point (part 8 = Évolution, part 9 = Bond, en centièmes de %).
// Obtenu en jeu : affiché sur la fiche, jamais classé en or.
function getKarmaBonus(charObj) {
  const raw = (charObj && charObj.rawProfile) || {};
  const parts = (raw.battlePoint && raw.battlePoint.parts)
    || (charObj && charObj.battlePoint && charObj.battlePoint.parts)
    || (raw.loadout && raw.loadout.battlePoint && raw.loadout.battlePoint.parts)
    || (charObj && charObj.loadout && charObj.loadout.battlePoint && charObj.loadout.battlePoint.parts);
  if (!Array.isArray(parts)) return null;
  const pct = type => parts.filter(x => x.type === type).reduce((sum, x) => sum + ((('value' in x) ? x.value : x.min) || 0), 0) / 100;
  if (!parts.some(x => x.type === 8 || x.type === 9)) return null;
  return { evolution: pct(8), leap: pct(9) };
}

// Pierre équipée, lue sur le profil importé : deux gravures positives + la ligne négative
function getAbilityStone(charObj) {
  const raw = (charObj && charObj.rawProfile) || charObj || {};
  const items = raw.rawItems || (raw.loadout && raw.loadout.items) || (charObj && charObj.loadout && charObj.loadout.items) || [];
  const stone = items.find(i => i && i.slot === 'ability_stone');
  const engr = stone && stone.data && Array.isArray(stone.data.engravings) ? stone.data.engravings : null;
  if (!engr) return null;
  const lines = engr.map(e => {
    const label = BIBLE_ENGRAVINGS[String(e.id)] || '';
    const en = label.split(' (')[0];
    const fr = (label.match(/\(([^)]+)\)/) || [])[1] || en;
    return { id: e.id, en, fr, key: en.toLowerCase(), nodes: e.nodes || 0, level: stoneLevelFromNodes(e.nodes || 0), negative: /Reduction/.test(en) };
  });
  const positives = lines.filter(l => !l.negative && l.en);
  if (positives.length !== 2) return null;
  return { positives, negative: lines.find(l => l.negative) || null };
}

// Cœur Chaos Étoile « Attaque » (ID 6731200xx, dernier chiffre = rang) : % de PA des options du jeu (arkGridCoreOptions
// 3156100-3156400) : 14 pts +0,55 % ; 17 pts +1,10 % (rang 5) ou +1,65 % (rang 6) ; 18 à 20 : +0,16 % chacun.
// Rang 4 : options 10 et 14 seulement. Les fixes (+900 / +1 800 / +2 700) ne sont pas dans le pool de %.
const ATTACK_CORE_PREFIX = '6731200';
function attackCoreApPct(id, points) {
  const grade = Number(id.toString().slice(-1));
  let pct = points >= 14 ? 0.55 : 0;
  if (grade < 5) return pct;
  if (points >= 17) pct += grade >= 6 ? 1.65 : 1.10;
  [18, 19, 20].forEach(t => { if (points >= t) pct += 0.16; });
  return pct;
}

/**
 * % de PA du personnage hors gravure évaluée : tout ce que le jeu affiche « Atk. Power +X % » partage un seul pool
 * additif (Loseii, reference-character.md) : gemmes + pierre (Battle Point type 1, attackPowerMultiplier), lignes
 * PA % des bijoux (stat 49), cœur « Attaque », nœuds PA des astrogemmes (option 2001, table arkGridGemOptions).
 * Non lus : une 2e gravure PA (rare). REF_OTHER_AP_PCT si le profil n'a pas de Battle Point.
 */
function otherAttackPowerPct(charObj) {
  const lo = (charObj && charObj.rawProfile && charObj.rawProfile.loadout) || {};
  const p1 = battlePointPartsOf(charObj).find(p => p.type === 1);
  if (!p1) return REF_OTHER_AP_PCT;
  let pct = p1.attackPowerMultiplier || 0;
  (lo.items || []).forEach(it => ((it.data && it.data.stats) || []).forEach(st => {
    if (st.type === 2 && st.index === 49) pct += (st.value || 0) / 100;
  }));
  const core = getArkGridCoreIds(charObj).chaosStar;
  if (core && core.id.toString().startsWith(ATTACK_CORE_PREFIX)) pct += attackCoreApPct(core.id, core.points);
  const vals = astroSupportOptions && astroSupportOptions[2001];
  if (vals) (lo.arkGridCores || []).forEach(c => (c.gems || []).forEach(g => (g.opts || []).forEach(o => {
    if (o.id === 2001 && o.level > 0) pct += (vals[Math.min(o.level, vals.length) - 1] || 0) / 100;
  })));
  return pct;
}

// Gain d'un effet de gravure qui passe de base+addOld à base+addNew (même unité que `base`),
// en 100 × ln du rapport de dégâts (même échelle que l'affinage et les gemmes).
// otherAp : % de PA hors cette gravure (otherAttackPowerPct), pour les gravures PA seulement.
function engravingBonusGain(kind, base, addOld, addNew, otherAp = REF_OTHER_AP_PCT) {
  if (!(addNew > addOld)) return 0;
  if (kind === 'dmg') return 100 * Math.log((1 + (base + addNew) / 100) / (1 + (base + addOld) / 100));
  if (kind === 'ap') {
    const pool = base + otherAp;
    return 100 * Math.log((1 + (pool + addNew) / 100) / (1 + (pool + addOld) / 100));
  }
  if (!window.Bracelet) return 0;
  const prof = window.Bracelet.normalizeProfile({ role: 'dps' });
  const d = (addNew - addOld) / 100;
  const ref = window.Bracelet.critFactor(prof, 0, 0);
  const next = kind === 'critRate' ? window.Bracelet.critFactor(prof, d, 0) : window.Bracelet.critFactor(prof, 0, d);
  return 100 * Math.log(next / ref);
}

// Gain (%) de la gravure quand la pierre passe du niveau lvlFrom à lvlTo
function stoneEngravingGain(charObj, key, lvlFrom, lvlTo, isSupport) {
  const eff = window.ABILITY_STONE_EFFECTS && window.ABILITY_STONE_EFFECTS[key];
  if (isSupport || !eff || lvlTo <= lvlFrom) return 0;
  return engravingBonusGain(eff.kind, eff.base, lvlFrom > 0 ? eff.stone[lvlFrom - 1] : 0, eff.stone[lvlTo - 1], otherAttackPowerPct(charObj));
}

// Gain (%) de la PA de base +1,5 % (somme des niveaux >= 5). DPS : profil de référence de bracelet-model.js.
// Support : buff donné aux alliés (canal ap de supportContribution, % de PA du Battle Point type 1 + 1,5 %).
function stoneBaseApGain(charObj, isSupport) {
  if (isSupport) {
    const ctx = gearStatContext(charObj);
    if (!ctx) return 0;
    const inp = supportInputs(charObj);
    return 100 * Math.log(supportContribution(inp, ctx.wp, ctx.ms, inp.gemAvg, inp.apPct + STONE_BASE_AP_BONUS) /
      supportContribution(inp, ctx.wp, ctx.ms, inp.gemAvg, inp.apPct));
  }
  if (!window.Bracelet) return 0;
  const prof = window.Bracelet.normalizeProfile({ role: 'dps' });
  const without = Object.assign({}, prof, { baseApPct: prof.baseApPct - STONE_BASE_AP_BONUS });
  return 100 * Math.log(window.Bracelet.attackPower(prof) / window.Bracelet.attackPower(without));
}

/**
 * Meilleure amélioration de pierre : monter UNE des deux gravures d'un niveau, l'autre gardée à son niveau.
 * Coût = prix d'une pierre / probabilité exacte de réussir la taille visée.
 */
function getAbilityStoneUpgrade(charObj, isSupport) {
  const stone = getAbilityStone(charObj);
  if (!stone) return null;
  const [e1, e2] = stone.positives;
  const nodesFor = lvl => (lvl > 0 ? STONE_LEVEL_NODES[lvl - 1] : 0);
  const candidates = [];
  [[e1, e2], [e2, e1]].forEach(([up, keep]) => {
    if (up.level >= 4) return;
    const upTo = up.level + 1;
    const target = [nodesFor(upTo), nodesFor(keep.level)];
    const p = stoneSuccessProbability(target[0], target[1]);
    if (!(p > 0)) return;
    const sumFrom = e1.level + e2.level;
    const apBonus = sumFrom < 5 && sumFrom + 1 >= 5 ? stoneBaseApGain(charObj, isSupport) : 0;
    const engGain = stoneEngravingGain(charObj, up.key, up.level, upTo, isSupport);
    const gain = engGain + apBonus; // 100 × ln : les deux effets se multiplient
    const cost = abilityStonePrice() / p;
    candidates.push({ up, keep, upTo, target, p, stones: 1 / p, cost, gain, apBonus });
  });
  // PA de base seule (gravures sans gain chiffré, ou supports) : n'importe quelle pierre à 5 niveaux convient
  if (e1.level + e2.level < 5) {
    const apBonus = stoneBaseApGain(charObj, isSupport);
    const p = stoneLevelSumProbability(5);
    if (apBonus > 0 && p > 0) {
      candidates.push({ up: e1, keep: e2, upTo: e1.level, anyOrder: true, p, stones: 1 / p,
        cost: abilityStonePrice() / p, gain: apBonus, apBonus });
    }
  }
  const scored = candidates.filter(c => c.gain > 0);
  if (!scored.length) return null;
  scored.sort((x, y) => x.cost / x.gain - y.cost / y.gain);
  const best = scored[0];
  const nodesOf = (eng, lvl) => (eng === best.up ? nodesFor(best.upTo) : nodesFor(lvl));
  best.fromLabel = `${e1.nodes}/${e2.nodes}`;
  best.toLabel = best.anyOrder ? '9/7 · 10/6' : `${nodesOf(e1, e1.level)}/${nodesOf(e2, e2.level)}`;
  best.stone = stone;
  return best;
}

// --- Livres de gravure reliques T4 : 5 livres par niveau, 4 niveaux ---
const RELIC_BOOKS_PER_LEVEL = 5;
const RELIC_MAX_BOOKS = 20;

// Slug du marché loa-buddy pour le livre d'une gravure (« Keen Blunt Weapon » -> keen-blunt-weapon)
function relicBookSlug(key) {
  return key.replace(/'/g, '').replace(/\s+/g, '-');
}

/**
 * Livres reliques déjà lus sur une gravure, d'après lostark.bible (vérifié sur le Battle Point de 100+ gravures) :
 * - engrave_grade05 : livres reliques terminés (20/20), `progress` vaut toujours 0 ;
 * - engrave_grade04 : livres légendaires terminés, `progress` = livres reliques lus (0…19).
 * Autre grade (livres légendaires en cours) : null, ces livres-là n'ont pas de prix marché.
 */
function relicBooksRead(e) {
  if (!e) return null;
  if (e.grade === 'engrave_grade05') return RELIC_MAX_BOOKS;
  if (e.grade === 'engrave_grade04') return Math.max(0, Math.min(RELIC_MAX_BOOKS - 1, e.progress || 0));
  return null;
}

/** Livres reliques restants par gravure équipée : de la progression actuelle jusqu'au niveau 4. */
function getRelicBookUpgrades(charObj, isSupport) {
  if (isSupport) return [];
  const raw = (charObj && charObj.rawProfile) || charObj || {};
  const list = raw.engravings || (raw.loadout && raw.loadout.engravings) || [];
  const out = [];
  list.forEach(e => {
    const read = relicBooksRead(e);
    if (read === null || read >= RELIC_MAX_BOOKS) return;
    const label = BIBLE_ENGRAVINGS[String(e.id)] || '';
    const en = label.split(' (')[0];
    const key = en.toLowerCase();
    const eff = window.RELIC_BOOK_EFFECTS && window.RELIC_BOOK_EFFECTS[key];
    if (!eff) return;
    const price = state.marketPrices[relicBookSlug(key)];
    if (!(price > 0)) return;
    const lvl = Math.floor(read / RELIC_BOOKS_PER_LEVEL);
    const books = RELIC_MAX_BOOKS - read;
    const gain = engravingBonusGain(eff.kind, eff.base, lvl > 0 ? eff.relic[lvl - 1] : 0, eff.relic[3], otherAttackPowerPct(charObj));
    if (!(gain > 0)) return;
    out.push({
      id: e.id, key, en,
      fr: (label.match(/\(([^)]+)\)/) || [])[1] || en,
      lvl, read, books, price, cost: books * price, gain
    });
  });
  return out;
}

// Benchmark : prix des livres reliques qui manquent au joueur pour lire autant que la référence
// sur chacune de ses gravures (jusqu'au niveau 4 si la référence ne porte pas cette gravure).
// 0 si aucun livre manquant n'a de prix marché (ex. gravures support) : écart affiché, hors plan d'achat.
function relicBooksCostToTarget(player, target) {
  const engrOf = c => {
    const raw = (c && c.rawProfile) || c || {};
    return raw.engravings || (raw.loadout && raw.loadout.engravings) || [];
  };
  const targetRead = {};
  engrOf(target).forEach(e => {
    const read = relicBooksRead(e);
    if (read !== null) targetRead[e.id] = read;
  });
  let total = 0;
  engrOf(player).forEach(e => {
    const read = relicBooksRead(e);
    if (read === null) return;
    const label = BIBLE_ENGRAVINGS[String(e.id)] || '';
    const price = state.marketPrices[relicBookSlug(label.split(' (')[0].toLowerCase())];
    if (!(price > 0)) return;
    const goal = e.id in targetRead ? targetRead[e.id] : RELIC_MAX_BOOKS;
    total += Math.max(0, goal - read) * price;
  });
  return Math.round(total);
}

// --- Bracelet : gain espéré d'une nouvelle campagne (solveur exact, dans bracelet-worker.js) ---
// 4 rerolls normaux + 3 tickets de reconversion
const BRACELET_CAMPAIGN_ROLLS = 7;
const BRACELET_EV_STORAGE = 'lostark_bracelet_ev';
let braceletEvCache = null;
let braceletWorker = null;
const braceletEvPending = new Set();

function loadBraceletEvCache() {
  if (braceletEvCache) return braceletEvCache;
  try { braceletEvCache = JSON.parse(lsGet(BRACELET_EV_STORAGE) || '{}') || {}; } catch (e) { braceletEvCache = {}; }
  return braceletEvCache;
}

function getBraceletStats(charObj) {
  const cands = [charObj && charObj.bracelet, charObj && charObj.rawProfile && charObj.rawProfile.bracelet];
  for (const b of cands) {
    if (!b) continue;
    if (Array.isArray(b.stats)) return b.stats;
    if (b.data && Array.isArray(b.data.stats)) return b.data.stats;
  }
  return null;
}

// Entrées du solveur pour le bracelet porté : lignes fixes, lignes rerollables, traits
function braceletSolverInput(charObj, isSupport) {
  const stats = getBraceletStats(charObj);
  if (!stats || !window.Bracelet) return null;
  const dec = window.Bracelet.decodeBibleBracelet(stats);
  if (!dec || !Array.isArray(dec.lines) || !dec.lines.length) return null;
  const TRAIT_KEYS = { crit: 'crit', spec: 'spec', swiftness: 'swift' };
  const traits = {};
  const fixed = [];
  const granted = [];
  dec.lines.forEach(l => {
    const clean = { cat: l.cat, family: l.family, tier: l.tier, value: l.value };
    if (l.cat === 'trait' && TRAIT_KEYS[l.family]) traits[TRAIT_KEYS[l.family]] = l.value;
    (l.fixed ? fixed : granted).push(clean);
  });
  if (!granted.length) return null;
  return {
    grade: dec.grade || 'ancient',
    role: isSupport ? 'support' : 'dps',
    fixed, granted, traits,
    slots: granted.length,
    rolls: BRACELET_CAMPAIGN_ROLLS
  };
}

/**
 * Gain espéré (%) d'une campagne complète sur un bracelet neuf, en gardant l'actuel s'il reste meilleur.
 * Renvoie le résultat en cache, ou null en lançant le calcul (le tableau se redessine à la réception).
 */
function getBraceletRerollEstimate(charObj, isSupport) {
  const input = braceletSolverInput(charObj, isSupport);
  if (!input) return null;
  const key = `${window.Bracelet.MODEL_SIG}|${window.Bracelet.VERSION}|${JSON.stringify(input)}`;
  const cache = loadBraceletEvCache();
  if (cache[key]) return cache[key];
  if (braceletEvPending.has(key) || typeof Worker === 'undefined') return null;
  try {
    if (!braceletWorker) {
      braceletWorker = new Worker('bracelet-worker.js?v=1.0');
      braceletWorker.onmessage = (ev) => {
        const res = ev.data || {};
        braceletEvPending.delete(res.key);
        if (!res.ok) { console.warn('[BRACELET] Calcul impossible :', res.error); return; }
        const store = loadBraceletEvCache();
        store[res.key] = { gain: res.gain, pBeat: res.pBeat, curPct: res.curPct, freshMeanPct: res.freshMeanPct };
        // On ne garde que les 20 derniers bracelets calculés
        const keys = Object.keys(store);
        if (keys.length > 20) keys.slice(0, keys.length - 20).forEach(k => delete store[k]);
        try { lsSet(BRACELET_EV_STORAGE, JSON.stringify(store)); } catch (e) {}
        if (typeof updateActiveCharacterCard === 'function') updateActiveCharacterCard(activeCharacterId);
      };
      // Worker qui ne se charge pas : calculs en attente libérés, worker recréé au prochain appel
      braceletWorker.onerror = (ev) => {
        console.warn('[BRACELET] Worker en erreur :', ev && ev.message);
        braceletEvPending.clear();
        try { braceletWorker.terminate(); } catch (e) {}
        braceletWorker = null;
      };
    }
    braceletEvPending.add(key);
    braceletWorker.postMessage(Object.assign({ key }, input));
  } catch (e) {
    console.warn('[BRACELET] Worker indisponible :', e.message);
  }
  return null;
}
