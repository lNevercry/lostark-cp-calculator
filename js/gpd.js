// GPD : barèmes, qualité d'arme, paliers de Loseii (bracelet, Karma, astrogemmes), tableau GPD.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// Bonus CP% moyen par niveau de gemme T4 (même échelle que extractPlayerSystems)
const GEM_LEVEL_BONUS_PCT = { 7: 31.5, 8: 36.0, 9: 40.5, 10: 48.0 };
// Coût (gold) pour monter UNE gemme T4 du niveau clé au niveau suivant
// Niv. 6 : trois gemmes niv. 6 font une niv. 7, donc 1/3 du coût du niveau 7
const GEM_UPGRADE_COST = { 6: 92000, 7: 276000, 8: 813000, 9: 2415000 };
// Bonus d'arme (échelle bonusPct de extractPlayerSystems) gagné par niveau d'affinage effectif
const WEAPON_HONING_BONUS_PER_LVL = 1.20;
// Bonus d'armure (échelle bonusPct) gagné par niveau moyen d'affinage effectif sur les 5 pièces
const ARMOR_HONING_BONUS_PER_LVL = { dps: 1.37, support: 1.50 };
const ARK_CORE_DEFS = [
  { key: 'orderSun', prefix: '67300', fr: 'Ordre Soleil', en: 'Order Sun' },
  { key: 'orderMoon', prefix: '67301', fr: 'Ordre Lune', en: 'Order Moon' },
  { key: 'orderStar', prefix: '67302', fr: 'Ordre Étoile', en: 'Order Star' },
  { key: 'chaosSun', prefix: '67310', fr: 'Chaos Soleil', en: 'Chaos Sun' },
  { key: 'chaosMoon', prefix: '67311', fr: 'Chaos Lune', en: 'Chaos Moon' },
  { key: 'chaosStar', prefix: '67312', fr: 'Chaos Étoile', en: 'Chaos Star' }
];
// Cœurs de la Grille d'Ark, support : ce que rapportent les options 14 et 17 points, en % de dégâts de chaque
// allié. Mesures de Loseii (loastuff/loa-gpd, docs/METHODOLOGY.md) sur la feuille « Ark Grid Cores » de bebkok,
// passées dans son modèle de buff, Barde de référence : falaise à 17, presque plat en dessous ;
// Ordre Soleil / Lune 1,0 à 1,2 %, Chaos 0,5 à 0,9 % (milieux retenus) ; Ordre Étoile (jauge) 0,3 % à 14, 0,16 % à 17.
const SUPPORT_CORE_STEPS = {
  orderSun: { t14: 0, t17: 1.1 },
  orderMoon: { t14: 0, t17: 1.1 },
  orderStar: { t14: 0.3, t17: 0.16 },
  chaosSun: { t14: 0, t17: 0.7 },
  chaosMoon: { t14: 0, t17: 0.7 },
  chaosStar: { t14: 0, t17: 0.7 }
};
// Qualité d'arme (Relique / Ancien, wiki Lost Ark « Quality upgrade », vérifié en jeu : 94 → 0,45 %, 97 → 0,23 %).
// Chaque essai tire une qualité avec des chances fixes, quelle que soit la qualité actuelle ; elle n'est gardée que si
// elle est plus haute. Tranche 0-10, 11-20 … 91-100, puis 10 % par qualité de la tranche. Coût : 800 or + 3 pierres du
// chaos (obtenues en jeu, non comptées). Effet : dégâts additionnels 10 % + 0,002 % × qualité² (partie type 4 du Battle Point).
const WEAPON_QUALITY_BANDS = [25.19, 21.41, 17.63, 13.85, 10.08, 6.30, 2.52, 1.26, 1.01, 0.76];
const WEAPON_QUALITY_TAP_GOLD = 800;
const weaponQualityChance = q => (q <= 10 ? WEAPON_QUALITY_BANDS[0] / 11 : WEAPON_QUALITY_BANDS[Math.min(9, Math.floor((q - 1) / 10))] / 10) / 100;
const weaponQualityAddDmg = q => 0.10 + 0.00002 * q * q;

/**
 * Prochaine amélioration de qualité d'arme d'un DPS : chance par essai de dépasser la qualité actuelle, coût moyen
 * (800 or ÷ chance) et gain moyen une fois réussie (qualité tirée au-dessus de l'actuelle, pondérée par ses chances).
 * Les dégâts additionnels s'additionnent entre eux : gain dilué dans le pool de bracelet-model.js
 * (familier, astrogemmes, collier), avec la vraie qualité à la place de la qualité 100. null si rien à gagner.
 */
// Qualité d'arme lue sur la partie type 4 du Battle Point (null si absente)
function weaponQualityOf(charObj) {
  const qp = battlePointPartsOf(charObj).find(p => p.type === 4);
  return qp && Number.isFinite(qp.quality) ? qp.quality : null;
}

// Gain DPS (%) de la qualité q à q2 : dégâts additionnels dilués dans le pool de bracelet-model.js
function weaponQualityGain(q, q2) {
  if (!window.Bracelet) return null;
  const prof = window.Bracelet.normalizeProfile({ role: 'dps' });
  const pool = window.Bracelet.addDamagePool(prof) - (prof.addDamage.weaponQuality || 0) + weaponQualityAddDmg(q);
  return 100 * Math.log((1 + pool - weaponQualityAddDmg(q) + weaponQualityAddDmg(q2)) / (1 + pool));
}

// Chance par essai de tirer au moins la qualité q (chances fixes, la qualité n'est gardée que si elle monte)
function weaponQualityChanceAtLeast(q) {
  let c = 0;
  for (let n = Math.max(0, q); n <= 100; n++) c += weaponQualityChance(n);
  return c;
}

function weaponQualityUpgrade(charObj) {
  if (!window.Bracelet) return null;
  const q = weaponQualityOf(charObj);
  if (q === null || q >= 100) return null;
  let chance = 0, gainSum = 0;
  for (let n = q + 1; n <= 100; n++) {
    const c = weaponQualityChance(n);
    chance += c;
    gainSum += c * weaponQualityGain(q, n);
  }
  if (!(chance > 0)) return null;
  return { quality: q, chance, taps: 1 / chance, cost: WEAPON_QUALITY_TAP_GOLD / chance, gain: gainSum / chance };
}

// Notes des échelles de Loseii (bracelet, astrogemmes), de la plus basse à la plus haute
const GPD_BANDS = ['F-', 'F', 'F+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S-', 'S', 'S+'];
const gpdBandRank = b => GPD_BANDS.indexOf(b);

/**
 * Prochaine étape d'une échelle de Loseii depuis la note `band` : la ligne qui part de cette note ; sous le bas
 * de l'échelle, la première ligne qui monte au-dessus (depuis une grille ou un bracelet de départ). null en haut.
 */
function loseiiNextStep(rows, band) {
  if (!rows || !rows.length) return null;
  const exact = rows.find(x => x.from === band);
  if (exact) return exact;
  const r = gpdBandRank(band);
  return rows.find(x => gpdBandRank(x.to) > r && (x.from === 'ungraded' || gpdBandRank(x.from) < r)) || null;
}

/**
 * Rapport entre l'or d'une ligne de Loseii à nos prix et à leurs prix : leurs achats (`mats`, depuis zéro) repris
 * au prix réglé par l'utilisateur, pheons et bracelets 90/90 non relancés (les 100/100 et 120/120 gardent le prix
 * de Loseii). 1 sans prix saisi : on retombe exactement sur leurs chiffres.
 */
function loseiiRepriceRatio(row) {
  if (!Array.isArray(row.mats) || !row.mats.length) return 1;
  let baked = 0, ours = 0;
  row.mats.forEach(([name, n, g]) => {
    if (typeof n !== 'number' || !(g > 0)) return;
    baked += g;
    if (/pheon/i.test(name)) ours += g * gpdUnitPrice('pheon') / GPD_DEFAULT_PRICES.pheon;
    else if (/90\/90 bracelet/i.test(name)) ours += g * gpdUnitPrice('bracelet') / GPD_DEFAULT_PRICES.bracelet;
    else ours += g;
  });
  return baked > 0 ? ours / baked : 1;
}

// Bracelet porté, décodé (lignes, traits, grade) ; null sans bracelet lisible
function braceletDecoded(charObj) {
  if (!window.Bracelet) return null;
  const items = (charObj && charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.items) || [];
  const item = items.find(i => i.slot === 'bracelet');
  const stats = getBraceletStats(charObj) || (item && item.data && Array.isArray(item.data.stats) ? item.data.stats : null);
  if (!stats) return null;
  const dec = window.Bracelet.decodeBibleBracelet(stats);
  if (!dec || !Array.isArray(dec.lines) || !dec.lines.length) return null;
  const TRAIT_KEYS = { crit: 'crit', spec: 'spec', swiftness: 'swift' };
  const traits = { crit: 0, spec: 0, swift: 0 };
  const lines = [];
  dec.lines.forEach(l => { if (l.cat === 'trait' && TRAIT_KEYS[l.family]) traits[TRAIT_KEYS[l.family]] = l.value; else lines.push(l); });
  return { lines, traits, grade: dec.grade || 'ancient' };
}

// Note du bracelet sur l'échelle du calculateur de bracelet (Subrank), comme Loseii
function braceletBandOf(charObj, isSupport) {
  const dec = braceletDecoded(charObj);
  if (!dec || !window.Subrank) return null;
  try {
    const sc = window.Subrank.braceletScore({ grade: dec.grade, lines: dec.lines, traits: dec.traits,
      profile: window.Bracelet.normalizeProfile({ role: isSupport ? 'support' : 'dps' }) });
    return sc && sc.band ? { band: sc.band.key, score: sc.score, damagePct: sc.damagePct, total: sc.total } : null;
  } catch (e) { return null; }
}

/**
 * Bracelet : note suivante de l'échelle de Loseii. Un bracelet relancé ne s'améliore pas sur place : c'est une
 * campagne neuve, chiffrée depuis zéro (total de l'échelle jusqu'à cette note, bracelets non relancés et pheons
 * à nos prix), et son gain se mesure depuis le bracelet porté (dégâts de la note − dégâts du bracelet actuel).
 */
function braceletGpdStep(charObj, isSupport) {
  const cur = braceletBandOf(charObj, isSupport);
  const rows = (loseiiGpd.rows[isSupport ? 'support' : 'dps'] || []).filter(r => r.series === 'bracelet');
  if (!cur || !rows.length) return null;
  const r = gpdBandRank(cur.band);
  const step = rows.find(x => gpdBandRank(x.to) > r);
  if (!step) return null;
  const scale = loseiiRepriceRatio(step);
  const fromScratch = step.total != null && step.totalDamage != null && Number.isFinite(cur.total);
  const gold = (fromScratch ? step.total : step.gold) * scale;
  const gain = fromScratch ? step.totalDamage - cur.total : step.damage;
  return gain > 0 ? { cur, step, gold, gain } : null;
}

// Karma d'Illumination : essais attendus d'un niveau (jauge d'énergie : essai garanti à 100 %), comme Loseii
function karmaExpectedAttempts(prob, care) {
  const p = prob / 1e4;
  if (p >= 1) return 1;
  const cap = care > 0 ? Math.ceil(1e4 / care) + 1 : Infinity;
  if (p <= 0) return cap;
  return isFinite(cap) ? (1 - Math.pow(1 - p, cap)) / p : 1 / p;
}

/**
 * Karma d'Illumination, niveau suivant : 900 or par essai (la pierre du destin est gratuite), +0,10 % de puissance
 * d'arme. DPS : dégâts par √(puissance d'arme) ; support : buff de PA donné aux alliés. null au niveau 30 ou sans données.
 */
function karmaGpdStep(charObj, isSupport, lvlOverride) {
  const lo = (charObj && charObj.rawProfile && charObj.rawProfile.loadout) || {};
  const lvl = lvlOverride !== undefined ? lvlOverride : lo.karma && lo.karma.enlightenment;
  const here = karmaT4 && karmaT4[lvl], next = karmaT4 && karmaT4[lvl + 1];
  const ctx = gearStatContext(charObj);
  if (!here || !next || !(here.prob > 0) || !ctx) return null;
  const attempts = karmaExpectedAttempts(here.prob, here.care);
  // Le % de Karma s'applique à la puissance d'arme avant amplification
  const dWp = (ctx.wp / ctx.wpAmp) * (next.wp - here.wp) / 1e4;
  const gain = isSupport ? supportApGain(charObj, ctx, dWp, 0) : 50 * Math.log(1 + dWp / ctx.wp);
  return { lvl, attempts, rate: here.prob / 100, cost: attempts * here.gold, gain, dWp, wpTotal: next.wp / 100 };
}

// Avatars (tête, torse, jambes, arme) : stat principale +0,5 / 1 / 2 % par pièce rare / épique / légendaire, 8 % pour
// 4 légendaires. Le profil ne donne que le total : stats 7 / 8 / 9 = % de Force / Dextérité / Intelligence en 0,01 %
// (10 000 = 100 %), avatars = % de la stat principale − % des deux autres (le ranch du familier, +1 %, est sur les trois).
// Mesuré sur 70 profils : 37 à 8 %, 22 à 4 %, le reste entre 1 et 7 % ; loa-sim lit le même total.
const AVATAR_MAX_PCT = 8;
function avatarBonusOf(charObj) {
  const stats = charObj && charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.stats;
  if (!Array.isArray(stats)) return null;
  const v = t => (stats.find(s => s.type === t) || {}).value;
  const ms = [3, 4, 5].map(v);
  if (ms.some(x => !(x > 0))) return null;
  const main = 3 + ms.indexOf(Math.max(...ms));
  const pct = [7, 8, 9].map(v);
  if (pct.some(x => !(x >= 1e4))) return null;
  const others = [3, 4, 5].filter(t => t !== main).map(t => pct[t - 3]);
  if (others[0] !== others[1]) return null;
  const bonus = (pct[main - 3] - others[0]) / 100;
  return bonus >= 0 && bonus <= AVATAR_MAX_PCT && Number.isInteger(bonus * 2) ? { pct: bonus, mult: pct[main - 3] / 1e4 } : null;
}

// Répartition la plus probable du total sur les 4 pièces (comme loa-sim) : le plus de pièces portées, puis d'épiques
// (4 % = 4 épiques, 7 % = 3 légendaires + 1 épique, 3,5 % = 3 épiques + 1 rare)
function avatarPieces(total) {
  const vals = [2, 1, 0.5, 0];
  let best = null, bestScore = -Infinity;
  for (const a of vals) for (const b of vals) for (const c of vals) for (const d of vals) {
    const p = [a, b, c, d];
    if (a + b + c + d !== total) continue;
    const score = p.filter(x => x > 0).length * 100 + p.filter(x => x === 1).length * 10 - new Set(p).size;
    if (score > bestScore) { best = p; bestScore = score; }
  }
  return best;
}

/**
 * Avatars légendaires sur les pièces qui ne le sont pas (jusqu'à 8 %). Le bonus multiplie toute la stat principale :
 * DPS 50 × ln(rapport des multiplicateurs), support canal ap (supportApGain). Coût = pièces à acheter × prix saisi
 * (aucune source de prix : ni marché ni Loseii), cost null sans prix. null au maximum ou sans profil lisible.
 */
function avatarGpdStep(charObj, isSupport) {
  const av = avatarBonusOf(charObj);
  const ctx = gearStatContext(charObj);
  if (!av || !ctx || av.pct >= AVATAR_MAX_PCT) return null;
  const pieces = avatarPieces(av.pct);
  if (!pieces) return null;
  const buy = pieces.filter(x => x < 2).length;
  const add = AVATAR_MAX_PCT - av.pct;
  const dMs = ctx.ms * (add / 100) / av.mult;
  const gain = isSupport ? supportApGain(charObj, ctx, 0, dMs) : 50 * Math.log(1 + dMs / ctx.ms);
  const price = gpdUnitPrice('avatar');
  return { pct: av.pct, pieces, buy, add, dMs, gain, cost: price > 0 ? buy * price : null };
}

// Libellés de la ligne « Avatars » (tableau GPD, ligne en attente de prix, Smart Advisor)
function avatarRowText(av, isEn) {
  const fmtPct = x => (isEn ? String(x) : String(x).replace('.', ','));
  const tier = x => (x === 2 ? (isEn ? 'legendary' : 'légendaire') : x === 1 ? (isEn ? 'epic' : 'épique') : x === 0.5 ? (isEn ? 'rare' : 'rare') : (isEn ? 'none' : 'aucun'));
  const split = av.pieces.map(tier).join(' / ');
  return {
    name: isEn ? `Avatars ${fmtPct(av.pct)}% ➔ ${AVATAR_MAX_PCT}% main stat` : `Avatars ${fmtPct(av.pct)} % ➔ ${AVATAR_MAX_PCT} % de stat principale`,
    sub: isEn ? `${av.buy} legendary piece${av.buy > 1 ? 's' : ''} to buy (likely now: ${split})` : `${av.buy} pièce${av.buy > 1 ? 's' : ''} légendaire${av.buy > 1 ? 's' : ''} à acheter (probable : ${split})`,
    state: isEn ? `${fmtPct(av.pct)}%` : `${fmtPct(av.pct)} %`,
    comment: isEn
      ? `Head, chest, pants and weapon avatars: main stat +0.5 / 1 / 2% per rare / epic / legendary piece. The profile only gives the total (${fmtPct(av.pct)}%), so the split per piece is the most likely one; check in game how many pieces are not legendary. Price per legendary piece set above the table (no market source).`
      : `Avatars de tête, torse, jambes et arme : stat principale +0,5 / 1 / 2 % par pièce rare / épique / légendaire. Le profil ne donne que le total (${fmtPct(av.pct)} %) : répartition la plus probable par pièce, vérifie en jeu combien ne sont pas légendaires. Prix d'une pièce légendaire réglé au-dessus du tableau (pas de source marché).`
  };
}

// Astrogemmes : effets et coût de base (8 / 9 / 10) d'après les options de la gemme (arkGridGems du jeu)
const ASTRO_EFFECT_NAMES = { 2001: 'Attack Power', 2002: 'Additional Damage', 2003: 'Boss Damage',
  2011: 'Ally Damage Enh.', 2012: 'Brand Power', 2013: 'Ally Attack Enh.' };
const ASTRO_BASE_COST_OPTS = [[8, [2001, 2002, 2011, 2012]], [9, [2001, 2003, 2011, 2013]], [10, [2002, 2003, 2012, 2013]]];

/**
 * Note moyenne des astrogemmes taillées (modèle astrogem.js de Loseii, note DPS ou support) et sa lettre.
 * Ordre / Chaos d'après le cœur qui porte la gemme (ID 6730… Ordre, 6731… Chaos). null sans modèle ni gemmes.
 */
function astrogemGridBand(charObj, isSupport) {
  const A = window.Astrogem;
  const cores = (charObj && charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.arkGridCores) || [];
  if (!A || !cores.length) return null;
  const grades = [];
  cores.forEach(c => {
    const gemType = String(c.id).startsWith('6731') ? 'chaos' : 'order';
    (c.gems || []).forEach(g => {
      const o = g.opts || [];
      if (o.length < 2) return;
      const ids = o.map(x => x.id);
      const base = ASTRO_BASE_COST_OPTS.find(([, set]) => ids.every(i => set.includes(i)));
      if (!base) return;
      const cfg = { baseCost: base[0], gemType, willpowerLevel: g.costReduc, orderLevel: g.corePoints,
        effect1: ASTRO_EFFECT_NAMES[ids[0]], effect1Level: o[0].level, effect2: ASTRO_EFFECT_NAMES[ids[1]], effect2Level: o[1].level };
      try {
        if (A.validateConfig && !A.validateConfig(cfg).valid) return;
        const gr = isSupport && A.supportGrade ? A.supportGrade(cfg) : A.grade(cfg);
        if (Number.isFinite(gr)) grades.push(gr);
      } catch (e) {}
    });
  });
  if (!grades.length) return null;
  const mean = grades.reduce((a, b) => a + b, 0) / grades.length;
  const band = isSupport && A.supportRankFromGrade ? A.supportRankFromGrade(mean) : A.rankFromGrade(mean);
  return { mean, band, n: grades.length };
}

// Astrogemmes : prochaine note de l'échelle de Loseii pour la taille d'épiques ou de rares
function astrogemGpdStep(grid, isSupport, rarity) {
  const src = loseiiGpd.arkgrid[isSupport ? 'support' : 'dps'][rarity];
  const step = grid && src && loseiiNextStep(src.rows, grid.band);
  return step ? { step, src } : null;
}

// Dégâts (ou buff) estimés de la grille du joueur d'après sa note moyenne : courbe note → dégâts des paliers
// (`tiers`) du modèle de compte de Loseii, épiques et rares du même axe réunis, pour une grille pleine (24 gemmes).
// Sous le bas de la courbe : sa première valeur (estimation haute de l'actuel, donc gain prudent). Grille incomplète :
// au prorata des gemmes posées. null au-dessus de la courbe ou sans données.
function astrogemGridDamage(isSupport, grid) {
  const srcs = loseiiGpd.arkgrid[isSupport ? 'support' : 'dps'] || {};
  const slots = (srcs.epic && srcs.epic.slots) || 24;
  const lo = astrogemCurveLow(isSupport);
  const d = astrogemDamageAtMean(isSupport, lo !== null ? Math.max(lo, grid.mean) : grid.mean);
  return d === null ? null : d * Math.min(1, grid.n / slots);
}
function astrogemCurveLow(isSupport) {
  const srcs = loseiiGpd.arkgrid[isSupport ? 'support' : 'dps'] || {};
  const means = ['epic', 'rare'].flatMap(r => ((srcs[r] && srcs[r].tiers) || []).map(t => t.mean)).filter(Number.isFinite);
  return means.length ? Math.min(...means) : null;
}
function astrogemDamageAtMean(isSupport, mean) {
  const srcs = loseiiGpd.arkgrid[isSupport ? 'support' : 'dps'] || {};
  const pts = [];
  ['epic', 'rare'].forEach(r => ((srcs[r] && srcs[r].tiers) || []).forEach(t => {
    if (Number.isFinite(t.mean) && Number.isFinite(t.damage)) pts.push([t.mean, t.damage]);
  }));
  if (pts.length < 2 || !Number.isFinite(mean)) return null;
  pts.sort((a, b) => a[0] - b[0]);
  // Courbe croissante : un palier d'une rareté ne descend pas sous un palier de note plus basse
  for (let i = 1; i < pts.length; i++) pts[i][1] = Math.max(pts[i][1], pts[i - 1][1]);
  if (mean < pts[0][0] || mean > pts[pts.length - 1][0]) return null;
  for (let i = 1; i < pts.length; i++) {
    const [m0, d0] = pts[i - 1], [m1, d1] = pts[i];
    if (mean <= m1) return m1 > m0 ? d0 + (d1 - d0) * (mean - m0) / (m1 - m0) : d1;
  }
  return pts[pts.length - 1][1];
}

const GPD_TIER_LABELS = { 's-plus': 'Rang S+', 's': 'Rang S', 'a': 'Rang A', 'b': 'Rang B', 'c': 'Rang C', 'd': 'Rang D' };

// Où en est le personnage sur le système d'une ligne du GPD (note de Loseii quand l'échelle en a une)
function gpdRowState(row, isEn) {
  const m = row.meta || {};
  if (m.state !== undefined) return String(m.state);
  if (row.id === 'dyn_weapon' || row.id === 'dyn_armor') return `+${m.from}`;
  if (row.id.startsWith('dyn_adv_')) return `${m.from}/40`;
  if (row.id.startsWith('dyn_gems_')) return isEn ? `Lv. ${m.lvl}` : `Niv. ${m.lvl}`;
  if (row.id.startsWith('dyn_core_')) return `${m.pts} pts`;
  if (row.id.startsWith('dyn_relic_')) return isEn ? `Relic ${m.lvl}` : `Relique ${m.lvl}`;
  if (row.id === 'dyn_quality') return isEn ? `Quality ${m.quality}` : `Qualité ${m.quality}`;
  return '—';
}

// Répartition des gemmes par niveau à partir des valeurs de gemParts (seuils DPS/Support)
function countGemLevels(parts, isSupport) {
  const counts = { 7: 0, 8: 0, 9: 0, 10: 0 };
  const l10 = isSupport ? 12.00 : 7.00;
  const l9 = isSupport ? 10.80 : 6.35;
  const l8 = isSupport ? 9.60 : 5.70;
  parts.forEach(g => {
    if (g >= l10 - 0.05) counts[10]++;
    else if (g >= l9 - 0.05) counts[9]++;
    else if (g >= l8 - 0.05) counts[8]++;
    else counts[7]++;
  });
  return counts;
}

// Repli sur le libellé de getCharacterGemSummary : "3x Niv. 9", "Full Gemmes 8 T4"...
function countGemLevelsFromLabel(label) {
  const counts = { 7: 0, 8: 0, 9: 0, 10: 0 };
  let found = false;
  const re = /(\d+)x\s*(?:Lv\.|Niv\.)\s*(\d+)/g;
  let m;
  while ((m = re.exec(label))) {
    const lvl = parseInt(m[2], 10);
    if (counts[lvl] !== undefined) { counts[lvl] += parseInt(m[1], 10); found = true; }
  }
  if (!found) {
    const full = /Full.*?(?:Lv\.|Gemmes)\s*(10|[789])\b/.exec(label);
    if (!full) return null;
    counts[parseInt(full[1], 10)] = 11;
  }
  return counts;
}

/**
 * Libellé de l'étape k (1 = la prochaine) de l'affinage des armures, d'après les niveaux des pièces sous +25.
 * Même niveau partout : « +21 » / « depuis +20 sur 5 pièces » ; niveaux différents : « +1 sur 3 pièces » /
 * « depuis +20 / +20 / +21 ». Sans pièces lisibles (levels null) : repli sur le niveau moyen du système.
 */
function armorStepLabel(levels, k, isEn, avgFallback) {
  if (!levels || !levels.length) {
    const from = Math.floor(avgFallback || 12) + k - 1;
    return { title: `+${from + 1}`, sub: isEn ? `From +${from} on 5 pieces` : `Depuis +${from} sur 5 pièces`, step: `+${from} ➔ +${from + 1}` };
  }
  const cur = levels.map(l => l + k - 1);
  const n = cur.length;
  if (cur.every(l => l === cur[0])) {
    const from = cur[0];
    return {
      title: `+${from + 1}`,
      sub: isEn ? `From +${from} on ${n} piece${n > 1 ? 's' : ''}` : `Depuis +${from} sur ${n} pièce${n > 1 ? 's' : ''}`,
      step: `+${from} ➔ +${from + 1}`
    };
  }
  const list = [...cur].sort((a, b) => a - b).map(l => `+${l}`).join(' / ');
  return {
    title: isEn ? `+1 on ${n} pieces` : `+1 sur ${n} pièces`,
    sub: isEn ? `From ${list}` : `Depuis ${list}`,
    step: isEn ? `+1 on ${n} pieces (${list})` : `+1 sur ${n} pièces (${list})`
  };
}

// Pire cas d'une étape d'affinage (jauge d'artisan pleine sur chaque pièce) ; essais quand une seule pièce monte
function honingPityText(pity, taps, isEn) {
  if (!(pity > 0)) return '';
  const n = taps > 0 ? (isEn ? ` (${taps} taps)` : ` (${taps} essais)`) : '';
  return isEn ? `${formatNumber(pity)} g${n}` : `${formatNumber(pity)} or${n}`;
}
// Phrase ajoutée au commentaire d'une ligne d'affinage
function honingPityComment(pityText, isEn) {
  if (!pityText) return '';
  return isEn ? ` Worst case (full artisan's energy): ${pityText}.` : ` Pire cas (jauge d'artisan pleine) : ${pityText}.`;
}

// Souffles dans le commentaire d'une ligne d'affinage (stratégie la moins chère aux prix du marché)
function honingBreathComment(plan, isEn) {
  if (!plan) return '';
  return isEn ? `, breaths: ${plan} (cheapest)` : `, souffles : ${plan} (le moins cher)`;
}

// Pity de +1 sur des pièces { l, track } (somme des pires cas, matériaux liés consommés au pire cas) ; 0 si une recette manque
function honingPityOf(piece, levels, owned = null) {
  const r = honingStepsCost(levels.map(x => ({ piece, l: x.l, track: x.track })), owned);
  return { pity: r.pity, taps: r.pity > 0 && levels.length === 1 ? r.perStep[0].pityTaps : 0 };
}

// Commentaire d'une ligne d'affinage quand le stock de matériaux liés du personnage a servi
function honingBoundComment(used, isEn) {
  if (!used) return '';
  return isEn ? ' Your bound materials (entered above the table) are used first, the rest is bought.' : ' Tes matériaux liés (saisis au-dessus du tableau) servent d\'abord, le reste est acheté.';
}

function getDynamicGpdTable(charObj, role, isEn) {
  const charRole = (charObj && detectCharacterRole(charObj)) || role || 'dps';
  if (!charObj) return [];
  const isSupport = charRole === 'support';
  const sys = extractPlayerSystems(charObj, isEn);

  let dynTable = [];

  // Support : gold par 0.01% de buff ; DPS : gold par 1% de dégâts.
  // Le tier est toujours évalué sur le coût par 1% pour garder les mêmes seuils.
  const ratioUnit = isSupport ? 100 : 1;
  // Gain sous 0,0001 % : bruit d'arrondi (ex. bijou remplacé par un équivalent), ratio absurde sinon
  const pushRow = (id, name, sub, gain, cost, comment, meta) => {
    if (!(gain >= 1e-4) || !(cost > 0)) return;
    const ratio = Math.round(cost / (gain * ratioUnit));
    const tier = getTierFromRatio(cost / gain);
    dynTable.push({
      id,
      name,
      sub,
      gainText: `+${gain.toFixed(2)}% ${isSupport ? 'Buff' : 'DPS'}`,
      gainVal: Number(gain.toFixed(2)),
      gainRaw: gain, // non arrondi : cumuls de la feuille de route (gains support de l'ordre de 0,01 %)
      cost: Math.round(cost),
      ratioText: formatNumber(ratio) + ' g',
      ratioVal: ratio,
      tier,
      tierLabel: GPD_TIER_LABELS[tier],
      comment,
      meta: meta || {}
    });
  };

  // Matériaux liés saisis pour ce personnage (affinage normal seulement)
  const owned = getBoundMats(charObj);

  // 1. Weapon Honing
  let wLvl = sys.weapon.wLvl || 12;
  // Serka : sa propre recette au niveau affiché (Maxroll) ; sans elle, estimation Aegir au niveau effectif (+9)
  const wStep = honingStepFor('weapon', sys.weapon.isSerka, wLvl, sys.weapon.effWLvl);
  if (wStep) {
    // Gain relatif : +1 niveau ajoute WEAPON_HONING_BONUS_PER_LVL au bonus d'arme actuel
    const curWeaponPct = sys.weapon.bonusPct || 0;
    // Gain réel sur le personnage : dégâts (DPS) ou buff de PA donné aux alliés (support) ; estimation par niveau si une donnée manque
    const realGain = honingDpsGain(charObj, 'weapon', sys.weapon.isSerka, isSupport);
    const dmgGain = realGain !== null ? realGain : ((1 + (curWeaponPct + WEAPON_HONING_BONUS_PER_LVL) / 100) / (1 + curWeaponPct / 100) - 1) * 100;
    // Coût attendu du palier : tentatives moyennes (artisan) × matériaux au prix du marché
    // Matériaux liés du personnage utilisés d'abord (chaque ligne compte avec tout le stock, comme loa-sim)
    const wLc = getLevelCost('weapon', wStep.lvl, wStep.track, owned);
    const cost = wLc.totalValue;
    const wPity = honingPityOf('weapon', [{ l: wStep.lvl, track: wStep.track }], owned);
    const wPityText = honingPityText(wPity.pity, wPity.taps, isEn);
    // Souffles : stratégie la moins chère de l'étape (aucun, à chaque essai, N premiers essais)
    const wBreath = breathPlanOf('weapon', [{ l: wStep.lvl, track: wStep.track }], isEn, owned);
    const wBound = !!(wLc.boundUse && Object.keys(wLc.boundUse).length);
    pushRow('dyn_weapon',
      isEn ? `Honing — Weapon +${wLvl + 1}` : `Affinage — Arme +${wLvl + 1}`,
      (isEn ? `From +${wLvl}` : `Depuis +${wLvl}`) + (wBreath ? ` · ${wBreath}` : ''),
      dmgGain, cost,
      (isEn ? 'Expected cost (average taps with artisan energy, market-priced materials' : 'Coût attendu (nombre moyen de tentatives avec artisanat, matériaux au prix du marché') +
        honingBreathComment(wBreath, isEn) + ').' + honingPityComment(wPityText, isEn) + honingBoundComment(wBound, isEn),
      { from: wLvl, to: wLvl + 1, pity: wPity.pity, pityTaps: wPity.taps, breathPlan: wBreath, bound: wBound,
        honingSteps: [{ piece: 'weapon', l: wStep.lvl, track: wStep.track }] });
  }

  // 2. Armor Honing
  // Pièces réelles du profil : +1 sur chaque pièce sous +25 (même périmètre que honingDpsGain), libellé exact
  // (le niveau moyen arrondi affichait « depuis +21 » avec deux pièces à +20, et aucune ligne à 25/25/25/24/24)
  const gearLv = charObj && charObj.gear;
  const armorPieces = gearLv ? GEAR_ARMOR_SLOTS.map(sl => gearLv[sl]).filter(l => l >= 0) : [];
  const knownPieces = armorPieces.length === 5;
  let aLvl = knownPieces ? Math.min(...armorPieces.filter(l => l < 25), 25) : Math.floor(sys.armors.avgArmor || 12);
  // Serka : même logique que l'arme
  const aStep = honingStepFor('armor', sys.armors.isSerka, aLvl, !knownPieces && sys.armors.effAvgArmor !== undefined ? Math.floor(sys.armors.effAvgArmor) : undefined);
  if (aStep) {
    // Gain relatif : +1 niveau moyen ajoute ARMOR_HONING_BONUS_PER_LVL au bonus d'armure actuel
    const curArmorPct = sys.armors.bonusPct || 0;
    const perLvl = isSupport ? ARMOR_HONING_BONUS_PER_LVL.support : ARMOR_HONING_BONUS_PER_LVL.dps;
    const realGain = honingDpsGain(charObj, 'armor', sys.armors.isSerka, isSupport);
    const dmgGain = realGain !== null ? realGain : ((1 + (curArmorPct + perLvl) / 100) / (1 + curArmorPct / 100) - 1) * 100;
    // Coût attendu : +1 sur chaque pièce sous +25, chacune depuis son niveau, sur sa propre recette (Serka ou Aegir :
    // un set peut être mixte)
    const perPiece = honingT4 && knownPieces
      ? GEAR_ARMOR_SLOTS.map(sl => ({ l: gearLv[sl], track: pieceIsSerka(gearLv, sl) ? 'serka' : 'aegir' })).filter(x => x.l >= 10 && x.l < 25)
      : null;
    // Matériaux liés : consommés pièce par pièce sur les 5 pièces de la ligne
    const aSteps = perPiece && perPiece.length ? perPiece.map(x => ({ piece: 'armor', l: x.l, track: x.track })) : null;
    const aSeq = aSteps ? honingStepsCost(aSteps, owned) : null;
    const cost = aSeq ? aSeq.cost : getLevelCost('armor', aStep.lvl, aStep.track).totalValue * 5;
    const up = knownPieces ? armorPieces.filter(l => l < 25) : null;
    const lbl = armorStepLabel(up, 1, isEn, sys.armors.avgArmor);
    // Pity : jauge pleine sur chaque pièce (pièces réelles seulement, pas sur l'estimation × 5)
    const aPity = aSeq ? { pity: aSeq.pity, taps: 0 } : { pity: 0, taps: 0 };
    const aBreath = perPiece && perPiece.length ? breathPlanOf('armor', perPiece, isEn, owned) : '';
    pushRow('dyn_armor',
      isEn ? `Honing — Armors ${lbl.title}` : `Affinage — Armures ${lbl.title}`,
      lbl.sub + (aBreath ? ` · ${aBreath}` : ''),
      dmgGain, cost,
      (isEn ? 'Expected cost of +1 on each piece below +25 (average taps with artisan energy, market-priced materials' : 'Coût attendu de +1 sur chaque pièce sous +25 (nombre moyen de tentatives avec artisanat, matériaux au prix du marché') +
        honingBreathComment(aBreath, isEn) + ').' + honingPityComment(honingPityText(aPity.pity, aPity.taps, isEn), isEn) +
        honingBoundComment(aSeq && aSeq.bound, isEn),
      { from: aLvl, to: aLvl + 1, levels: up, pity: aPity.pity, pityTaps: aPity.taps, breathPlan: aBreath, bound: !!(aSeq && aSeq.bound),
        honingSteps: aSteps });
  }

  // 2b. Affinage avancé : prochaine tranche de 10 niveaux (arme, puis armures les moins avancées).
  // 1 niveau avancé = +1 iLvl sur la pièce = 1/5 d'un niveau d'affinage normal (même gain de stat par iLvl).
  const advLv = getAdvHoningLevels(charObj);
  if (advLv) {
    const wAdv = getAdvHoningCost('weapon', advLv.weapon);
    // Serka : l'avancé ne change pas l'iLvl (profils lostark.bible), aucun gain à chiffrer
    if (wAdv && !pieceIsSerka(charObj && charObj.gear, 'weapon')) {
      const curWeaponPct = sys.weapon.bonusPct || 0;
      const add = WEAPON_HONING_BONUS_PER_LVL * wAdv.levels / 5;
      // Gain réel d'après la table itemLevel (DPS : dégâts, support : buff de PA) ; sinon estimation par niveau
      const realGain = advHoningDpsGain(charObj, ['weapon'], false, wAdv.to, isSupport);
      const dmgGain = realGain !== null ? realGain : ((1 + (curWeaponPct + add) / 100) / (1 + curWeaponPct / 100) - 1) * 100;
      pushRow('dyn_adv_weapon',
        isEn ? `Advanced Honing — Weapon ${wAdv.from} ➔ ${wAdv.to}` : `Affinage avancé — Arme ${wAdv.from} ➔ ${wAdv.to}`,
        isEn ? `+${wAdv.levels} item levels on the weapon` : `+${wAdv.levels} niveaux d'objet sur l'arme`,
        dmgGain, wAdv.totalValue,
        advHoningComment(wAdv, isEn),
        { piece: 'weapon', from: wAdv.from, to: wAdv.to, breath: wAdv.useBreath });
    }
    // Avancé des armures : pièces Aegir seulement (sur le Serka il ne change ni l'iLvl ni les stats)
    const gearAdv = charObj && charObj.gear;
    const aegirIdx = ADV_ARMOR_SLOTS.map((sl, i) => i).filter(i => !pieceIsSerka(gearAdv, ADV_ARMOR_SLOTS[i]));
    const minArmor = aegirIdx.length ? Math.min(...aegirIdx.map(i => advLv.armors[i])) : 40;
    const laggingSlots = aegirIdx.filter(i => advLv.armors[i] === minArmor).map(i => ADV_ARMOR_SLOTS[i]);
    const lagging = laggingSlots;
    const aAdv = aegirIdx.length ? getAdvHoningCost('armor', minArmor) : null;
    if (aAdv) {
      const curArmorPct = sys.armors.bonusPct || 0;
      const perLvl = isSupport ? ARMOR_HONING_BONUS_PER_LVL.support : ARMOR_HONING_BONUS_PER_LVL.dps;
      // Le niveau moyen des 5 pièces monte de (pièces × niveaux) / 5, à 1/5 d'un niveau normal
      const add = perLvl * (lagging.length * aAdv.levels / 5) / 5;
      // Gain réel pièce par pièce (chacune a sa propre courbe de stat principale)
      const realGain = advHoningDpsGain(charObj, laggingSlots, false, aAdv.to, isSupport);
      const dmgGain = realGain !== null ? realGain : ((1 + (curArmorPct + add) / 100) / (1 + curArmorPct / 100) - 1) * 100;
      pushRow('dyn_adv_armor',
        isEn ? `Advanced Honing — Armors ${aAdv.from} ➔ ${aAdv.to}` : `Affinage avancé — Armures ${aAdv.from} ➔ ${aAdv.to}`,
        isEn ? `${lagging.length} piece(s) out of 5` : `${lagging.length} pièce(s) sur 5`,
        dmgGain, aAdv.totalValue * lagging.length,
        advHoningComment(aAdv, isEn),
        { piece: 'armor', from: aAdv.from, to: aAdv.to, pieces: lagging.length, breath: aAdv.useBreath });
    }
  }

  // 3. Gems : une ligne par niveau présent
  // Vraies gemmes du profil : buff du modèle Loseii (support) ou dégâts, recharge et PA (DPS) ;
  // sinon (profil sans gemmes détaillées) gain relatif sur le bonus moyen du set
  const supGems = realGemLevels(charObj);
  if (supGems) {
    const counts = { 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    supGems.forEach(l => { counts[l]++; });
    [6, 7, 8, 9].forEach(lvl => {
      const n = counts[lvl];
      if (!n) return;
      const gain = isSupport ? supportGemUpgradeGain(charObj, lvl) : dpsGemUpgradeGain(charObj, lvl);
      if (gain === null) return;
      pushRow(`dyn_gems_${lvl}_${lvl + 1}`,
        isEn ? `Skill gems — Lv. ${lvl} ➔ ${lvl + 1}` : `Gemmes de Compétences — Niv. ${lvl} ➔ ${lvl + 1}`,
        isEn ? `${n} gem(s) out of ${supGems.length}` : `${n} gemme(s) sur ${supGems.length}`,
        gain, n * GEM_UPGRADE_COST[lvl],
        isSupport
          ? (isEn
            ? `Only the ${n} gem(s) currently at Lv. ${lvl} are priced. Buff (Loseii model): ally buffs +1 point per set level, real base AP per gem, cooldown turned into Specialization.`
            : `Seules les ${n} gemme(s) actuellement Niv. ${lvl} sont comptées. Buff (modèle Loseii) : +1 point de buffs alliés par niveau du set, vraie PA de base par gemme, recharge convertie en Spécialisation.`)
          : (isEn
            ? `Only the ${n} gem(s) currently at Lv. ${lvl} are priced. Damage gems +4% skill damage, cooldown gems -2% cooldown (70% of damage on cooldown), plus each gem's base attack power.`
            : `Seules les ${n} gemme(s) actuellement Niv. ${lvl} sont comptées. Gemmes de dégâts +4 % de dégâts de compétence, gemmes de recharge −2 % de recharge (70 % des dégâts sous recharge), plus la PA de base de chaque gemme.`),
        { lvl, n, counts, total: supGems.length });
    });
  }
  const gemParts = supGems ? null : extractCharacterGemParts(charObj);
  const gemCounts = (gemParts && gemParts.length > 0)
    ? countGemLevels(gemParts, isSupport)
    : countGemLevelsFromLabel((sys.gems && sys.gems.label) || '');
  if (gemCounts && !supGems) {
    const totalGems = gemCounts[7] + gemCounts[8] + gemCounts[9] + gemCounts[10];
    const curGemPct = [7, 8, 9, 10].reduce((s, l) => s + gemCounts[l] * GEM_LEVEL_BONUS_PCT[l], 0) / totalGems;
    [7, 8, 9].forEach(lvl => {
      const n = gemCounts[lvl];
      if (!n) return;
      const delta = n * (GEM_LEVEL_BONUS_PCT[lvl + 1] - GEM_LEVEL_BONUS_PCT[lvl]) / totalGems;
      const gain = ((1 + (curGemPct + delta) / 100) / (1 + curGemPct / 100) - 1) * 100;
      pushRow(`dyn_gems_${lvl}_${lvl + 1}`,
        isEn ? `Skill gems — Lv. ${lvl} ➔ ${lvl + 1}` : `Gemmes de Compétences — Niv. ${lvl} ➔ ${lvl + 1}`,
        isEn ? `${n} gem(s) out of ${totalGems}` : `${n} gemme(s) sur ${totalGems}`,
        gain, n * GEM_UPGRADE_COST[lvl],
        isEn ? `Only the ${n} gem(s) currently at Lv. ${lvl} are priced.` : `Seules les ${n} gemme(s) actuellement Niv. ${lvl} sont comptées.`,
        { lvl, n, counts: gemCounts, total: totalGems });
    });
  }

  // 4. Cœurs de la Grille d'Ark : pas de ligne en or. Leurs points viennent des astrogemmes serties (points
  // d'Ordre / Chaos de chaque gemme), déjà chiffrées par les lignes « taille d'épiques / de rares » (modèle de compte
  // de Loseii, cœurs à 17-20 points dans ses paliers). Un prix par point serait inventé et compterait deux fois.

  // Bracelet, pierre d'aptitude, astrogemmes et Karma : obtenus en jeu (chaos, gardiens, Paradise, raids), pas achetés.
  // Pas de ligne en or ici ; leur état est affiché sur la fiche (updateActiveCharacterCard, cartes de score).

  // 6c. Livres de gravure reliques : les livres restants jusqu'au niveau relique 4, au prix du marché
  getRelicBookUpgrades(charObj, isSupport).forEach(r => {
    const name = isEn ? r.en : r.fr;
    pushRow(`dyn_relic_${r.id}`,
      isEn ? `Relic books — ${name} Lv. ${r.lvl} ➔ 4` : `Livres reliques — ${name} niv. ${r.lvl} ➔ 4`,
      isEn ? `${r.books} books × ${formatNumber(Math.round(r.price))} g` : `${r.books} livres × ${formatNumber(Math.round(r.price))} g`,
      r.gain, r.cost,
      isEn
        ? `Relic book market price (EUC). ${r.read}/20 books already read; the gain per level is nearly linear, so every level has about the same ratio.`
        : `Prix du livre relique au marché (EUC). ${r.read}/20 livres déjà lus ; le gain par niveau est quasi linéaire, chaque niveau a donc à peu près le même ratio.`,
      { engraving: name, lvl: r.lvl, books: r.books, read: r.read });
  });

  // 6d. Qualité d'arme (DPS) : les dégâts additionnels ne profitent qu'au porteur, rien pour le buff d'un support
  // (le Battle Point support compte la qualité à 0)
  const wq = isSupport ? null : weaponQualityUpgrade(charObj);
  if (wq) {
    const pct = (wq.chance * 100).toFixed(2);
    pushRow('dyn_quality',
      isEn ? `Weapon quality ${wq.quality} ➔ higher` : `Qualité d'arme ${wq.quality} ➔ supérieure`,
      isEn ? `${pct}% per attempt, ~${Math.round(wq.taps)} attempts` : `${pct} % par essai, ~${Math.round(wq.taps)} essais`,
      wq.gain, wq.cost,
      isEn
        ? `Official odds (fixed, whatever the current quality): ${pct}% per attempt to beat ${wq.quality}. Average cost ${formatNumber(Math.round(wq.cost))} gold (800 gold per attempt; the 3 chaos stones come from content and are not counted). Gain: average additional damage of the higher qualities (10% + 0.002% × quality²), diluted in the additional damage pool.`
        : `Chances officielles (fixes, quelle que soit la qualité actuelle) : ${pct} % par essai de dépasser ${wq.quality}. Coût moyen ${formatNumber(Math.round(wq.cost))} or (800 or par essai ; les 3 pierres du chaos viennent du contenu et ne sont pas comptées). Gain : dégâts additionnels moyens des qualités supérieures (10 % + 0,002 % × qualité²), dilués dans le pool de dégâts additionnels.`,
      { quality: wq.quality, chance: wq.chance, taps: wq.taps });
  }

  // 7. Accessoires : une ligne par type (collier, boucles, anneaux), le bijou au meilleur ratio de ce type
  const accEval = evaluateCharacterAccessories(charObj, isSupport, isEn);
  if (accEval.slotLines) {
    const slotNames = accessorySlotNames(isEn);
    const accGrade = accessoryGrade(accEval.bonusPct || 0, isSupport).grade;
    [['neck', isEn ? 'Necklace' : 'Collier'], ['ear', isEn ? 'Earring' : 'Boucle d\'oreille'], ['ring', isEn ? 'Ring' : 'Anneau']].forEach(([kind, kindName]) => {
      const best = findBestAccessoryUpgrade(accEval.slotLines, isSupport, kind);
      if (!best) return;
      // Gamme nommée ligne par ligne (« High / Mid » seul ne dit pas quelle ligne est High) et état actuel du bijou
      const lineName = k => (ACC_LINE_SHORT[k] || ACC_LINE_NAMES[k] || [k, k])[isEn ? 1 : 0];
      const tierName = t => (t === null || t === undefined ? (isEn ? 'none' : 'absente') : ACC_TIER_NAMES[t]);
      const curLines = accEval.slotLines[best.slot] || [];
      const curTiers = best.lines.map(k => { const l = curLines.find(x => x.key === k); return l ? accTierOf(k, l.amount) : null; });
      const target = best.lines.map((k, i) => `${lineName(k)} ${tierName(best.tiers[i])}`).join(' / ');
      const current = best.lines.map((k, i) => `${lineName(k)} ${tierName(curTiers[i])}`).join(' / ');
      pushRow(`dyn_acc_${kind}`,
        `${kindName} — ${slotNames[best.slot]} ➔ ${target}`,
        isEn ? `Now ${current} ➔ ${target} + 1 dead line` : `Actuel ${current} ➔ ${target} + 1 ligne morte`,
        best.gain, best.cost,
        isEn
          ? `Best ${kindName.toLowerCase()} to replace (the weaker one when you wear two), lines valued with the Arsonistic slopes. Price per accessory type is an in-game estimate (no market source).`
          : `Meilleur remplacement de ce type (le plus faible quand tu en portes deux), lignes valorisées avec les pentes Arsonistic. Prix par type de bijou estimé en jeu (pas de source marché).`,
        { slot: best.slot, slotName: slotNames[best.slot], kind, curPct: best.curPct, pkg: best.pkg.label, target, current, state: accGrade });
    });
  }

  // 8. Bracelet : prochaine note de l'échelle de Loseii, bracelets non relancés et pheons à nos prix réglables
  const brac = braceletGpdStep(charObj, isSupport);
  if (brac) {
    const st = brac.step;
    pushRow('dyn_brac',
      isEn ? `Bracelet ${brac.cur.band} ➔ ${st.to}` : `Bracelet ${brac.cur.band} ➔ ${st.to}`,
      // Textes de Loseii (« minimum », « odds ») en anglais seulement : repris tels quels en anglais, résumés en français
      isEn ? (st.minimum || `Next grade: ${st.to}`) : `Note suivante : ${st.to}`,
      brac.gain, brac.gold,
      (isEn
        ? `Loseii's bracelet ladder (score ${brac.cur.score.toFixed(1)} on the bracelet calculator's scale). A rolled bracelet cannot be improved in place: a fresh campaign priced from scratch, gain measured from the bracelet you wear. ${st.odds || ''} Unrolled bracelets and pheons at the prices set above the table.`
        : `Échelle du bracelet de Loseii (score ${brac.cur.score.toFixed(1)} sur l'échelle du calculateur de bracelet). Un bracelet relancé ne s'améliore pas sur place : campagne neuve chiffrée depuis zéro, gain mesuré depuis ton bracelet actuel. Bracelets non relancés et pheons aux prix réglés au-dessus du tableau.`).trim(),
      { state: brac.cur.band, from: brac.cur.band, to: st.to, score: brac.cur.score, curTotal: brac.cur.total });
  }

  // 9. Pierre d'aptitude : taille exacte (chaîne de Markov), pierre non taillée = 9 pheons au prix réglable
  // La taille coûte de l'argent (non comptée) ; l'or = pierres non taillées achetées
  const stoneUp = getAbilityStoneUpgrade(charObj, isSupport);
  if (stoneUp && stoneUp.stones <= STONE_GPD_MAX_STONES) {
    const upName = isEn ? stoneUp.up.en : stoneUp.up.fr;
    const odds = Math.round(stoneUp.stones);
    const stoneGold = formatNumber(Math.round(abilityStonePrice()));
    pushRow('dyn_stone',
      isEn ? `Ability stone ${stoneUp.fromLabel} ➔ ${stoneUp.toLabel}` : `Pierre d'aptitude ${stoneUp.fromLabel} ➔ ${stoneUp.toLabel}`,
      stoneUp.anyOrder
        ? (isEn ? `5 levels in total (base Atk. Power +1.5%), 1 stone in ${formatNumber(odds)}` : `5 niveaux au total (PA de base +1,5 %), 1 pierre sur ${formatNumber(odds)}`)
        : (isEn ? `${upName} Lv. ${stoneUp.up.level} ➔ ${stoneUp.upTo}, 1 stone in ${formatNumber(odds)}` : `${upName} niv. ${stoneUp.up.level} ➔ ${stoneUp.upTo}, 1 pierre sur ${formatNumber(odds)}`),
      stoneUp.gain, stoneUp.cost,
      isEn
        ? `Exact odds with optimal faceting: 1 stone in ${formatNumber(odds)} reaches ${stoneUp.toLabel} (${(stoneUp.p * 100).toFixed(3)}%). Cost = ${formatNumber(odds)} uncut stones × ${stoneGold} g (${ABILITY_STONE_PHEONS} pheons each); faceting costs silver, not counted.${stoneUp.apBonus > 0 ? ' Includes the +1.5% base Atk. Power at 5 levels.' : ''}`
        : `Probabilité exacte avec une taille optimale : 1 pierre sur ${formatNumber(odds)} atteint ${stoneUp.toLabel} (${(stoneUp.p * 100).toFixed(3)} %). Coût = ${formatNumber(odds)} pierres non taillées × ${stoneGold} or (${ABILITY_STONE_PHEONS} pheons chacune) ; la taille coûte de l'argent, non comptée.${stoneUp.apBonus > 0 ? ' Inclut la PA de base +1,5 % à 5 niveaux.' : ''}`,
      { state: stoneUp.fromLabel, from: stoneUp.fromLabel, to: stoneUp.toLabel, engraving: stoneUp.anyOrder ? (isEn ? 'base Atk. Power' : 'PA de base') : upName, odds, stoneGold });
  }

  // 10. Karma d'Illumination : niveau suivant, 900 or par essai
  const karma = karmaGpdStep(charObj, isSupport);
  if (karma) {
    pushRow('dyn_karma',
      isEn ? `Karma — Enlightenment ${karma.lvl} ➔ ${karma.lvl + 1}` : `Karma — Illumination ${karma.lvl} ➔ ${karma.lvl + 1}`,
      isEn ? `${karma.rate.toFixed(2)}% per try, ~${karma.attempts.toFixed(1)} tries` : `${karma.rate.toFixed(2)} % par essai, ~${karma.attempts.toFixed(1)} essais`,
      karma.gain, karma.cost,
      isEn
        ? `Game table: 900 gold per try (the Destiny Stone is not counted), energy bar guarantees the try at 100%. +0.10% weapon power (${karma.wpTotal.toFixed(2)}% in total).`
        : `Table du jeu : 900 or par essai (la pierre du destin n'est pas comptée), la jauge d'énergie garantit l'essai à 100 %. +0,10 % de puissance d'arme (${karma.wpTotal.toFixed(2)} % au total).`,
      { state: isEn ? `lv ${karma.lvl}` : `niv. ${karma.lvl}`, lvl: karma.lvl });
  }

  // 10b. Avatars légendaires (prix saisi par le joueur ; sans prix, ligne en attente sous le tableau)
  const avatar = avatarGpdStep(charObj, isSupport);
  if (avatar && avatar.cost) {
    const t = avatarRowText(avatar, isEn);
    pushRow('dyn_avatar', t.name, t.sub, avatar.gain, avatar.cost, t.comment,
      { state: t.state, pct: avatar.pct, buy: avatar.buy, pieces: avatar.pieces });
  }

  // 11. Astrogemmes : taille d'épiques et de rares, échelles de Loseii par note moyenne des gemmes
  const grid = astrogemGridBand(charObj, isSupport);
  [['epic', isEn ? 'cutting epics' : 'taille d\'épiques'], ['rare', isEn ? 'cutting rares' : 'taille de rares']].forEach(([rarity, word]) => {
    const a = astrogemGpdStep(grid, isSupport, rarity);
    if (!a) return;
    const st = a.step;
    const fromGrid = st.from === 'ungraded';
    // Palier qui part sous la note du joueur (ex. « ungraded ➔ B » pour une grille B-) : ses dégâts comptent la
    // grille entière depuis zéro. Gain = dégâts du palier visé − dégâts estimés de la grille actuelle ; l'or reste
    // celui du palier (taille depuis zéro, comme une campagne de bracelet neuve).
    // Grille incomplète (moins de 24 gemmes) : le palier de l'échelle suppose une grille pleine, on mesure aussi
    // depuis la grille réelle, à l'or cumulé du palier (grille taillée depuis zéro).
    const slots = (a.src && a.src.slots) || 24;
    const partial = grid.n < slots;
    const below = fromGrid || partial || gpdBandRank(st.from) < gpdBandRank(grid.band);
    const curDmg = below && Number.isFinite(st.totalDamage) ? astrogemGridDamage(isSupport, grid) : null;
    const gain = curDmg !== null ? st.totalDamage - curDmg : st.damage;
    const gold = curDmg !== null && partial && st.total > 0 ? st.total : st.gold;
    if (!(gain > 0)) return;
    pushRow(`dyn_astro_${rarity}`,
      isEn ? `Ark grid — ${word} ${grid.band} ➔ ${st.to}` : `Grille d'Ark — ${word} ${grid.band} ➔ ${st.to}`,
      isEn ? `mean of ${grid.n} cut gems: ${grid.mean.toFixed(1)}` : `moyenne des ${grid.n} gemmes taillées : ${grid.mean.toFixed(1)}`,
      gain, gold,
      (isEn
        ? `Loseii's account model: ${st.buy || 'astrogems cut and fused'}${st.gems ? `, about ${Math.round(st.gems)} gems` : ''}. Gold covers cutting and fusing; the raw astrogem is free.`
        : `Modèle de compte de Loseii : ${st.gems ? `environ ${Math.round(st.gems)} gemmes taillées, ` : ''}taille à la gemme la plus faible, ratés fusionnés. L'or couvre la taille et la fusion ; la gemme brute est gratuite.`) +
        (curDmg !== null
          ? (isEn
            ? ` This rung starts below your grade: gold of a grid cut from scratch, gain = ${st.totalDamage.toFixed(2)}% of the target grid − ~${curDmg.toFixed(2)}% for yours (Loseii's grade → damage curve).`
            : ` Ce palier part sous ta note : or d'une grille taillée depuis zéro, gain = ${st.totalDamage.toFixed(2)} % de la grille visée − ~${curDmg.toFixed(2)} % pour la tienne (courbe note → dégâts de Loseii).`)
          : fromGrid ? (isEn ? ' Your grade is below the ladder: priced as a build from an empty grid.' : ' Ta note est sous le bas de l\'échelle : chiffré comme une grille bâtie depuis zéro.') : ''),
      { state: grid.band, from: grid.band, to: st.to, mean: grid.mean, n: grid.n, rarity });
  });

  // Sort by most efficient (lowest ratio)
  dynTable.sort((a, b) => a.ratioVal - b.ratioVal);

  return dynTable;
}

// Niveaux d'affinage avancé par pièce, lus sur le profil importé.
// Anciens profils sans détail par pièce : la valeur globale advHoning s'applique à toutes les pièces.
const ADV_ARMOR_SLOTS = ['head', 'shoulder', 'chest', 'pants', 'gloves'];
function getAdvHoningLevels(charObj) {
  const gear = (charObj && (charObj.gear || (charObj.rawProfile && charObj.rawProfile.gear))) || {};
  const adv = gear.adv;
  const fallback = charObj && charObj.advHoning !== undefined ? charObj.advHoning : undefined;
  const pick = key => (adv && adv[key] !== undefined ? adv[key] : fallback);
  const weapon = pick('weapon');
  const armors = ADV_ARMOR_SLOTS.map(pick);
  if (weapon === undefined || armors.some(v => v === undefined)) return null;
  return { weapon, armors };
}

function advHoningComment(adv, isEn) {
  const attempts = Math.round(adv.attempts);
  if (isEn) {
    return `Expected cost: ~${attempts} paid attempts ${adv.useBreath ? 'with' : 'without'} breath (cheaper at current prices), Ancestor's Grace included, market-priced materials. Shards and tempering not counted.`;
  }
  return `Coût attendu : ~${attempts} tentatives payées ${adv.useBreath ? 'avec' : 'sans'} souffle (moins cher aux prix actuels), Grâce de l'ancêtre incluse, matériaux au prix du marché. Éclats et trempe non comptés.`;
}

function getTierFromRatio(ratio) {
  if (ratio <= 400000) return 's-plus';
  if (ratio <= 750000) return 's';
  if (ratio <= 1200000) return 'a';
  if (ratio <= 2500000) return 'b';
  if (ratio <= 6000000) return 'c';
  return 'd';
}

/**
 * Génère et injecte dynamiquement le tableau d'arbitrage EUC (Onglet 3)
 */
function renderEfficiencyTable() {
  const role = state.role || 'support';
  const isSupport = role === 'support';
  
  // Uniquement le GPD du personnage actif : sans personnage importé, état vide (aucun tableau figé)
  const activeChar = getCurrentActiveCharacter();
  const list = activeChar ? getDynamicGpdTable(activeChar, role, isEnLang()) : [];

  const isEn = isEnLang();
  if (dom.effRoleBadge) {
    dom.effRoleBadge.textContent = isSupport
      ? (isEn ? 'Support: Cost per 0.01% Raid Buff' : 'Support : Coût par 0.01% Buff Alliés')
      : (isEn ? 'DPS: Cost per 1.00% Personal DPS' : 'DPS : Coût par 1.00% DPS Personnel');
    dom.effRoleBadge.style.color = isSupport ? 'var(--support-color)' : 'var(--dps-color)';
    dom.effRoleBadge.style.borderColor = isSupport ? 'rgba(232, 230, 220, 0.3)' : 'rgba(224, 122, 99, 0.3)';
  }

  if (dom.effColGainHeader) {
    dom.effColGainHeader.textContent = isSupport 
      ? (isEn ? 'Raid Buff Gain' : 'Gain Buff Groupe') 
      : (isEn ? 'Net DPS Gain' : 'Gain DPS Net');
  }
  const stateHeader = document.getElementById('effColStateHeader');
  if (stateHeader) stateHeader.textContent = isEn ? 'Where you are' : 'Ton état';
  renderGpdPriceInputs(isEn);
  renderBoundMatsPanel(document.getElementById('gpdBoundMats'), isEn);
  if (dom.effColRatioHeader) {
    dom.effColRatioHeader.textContent = isSupport 
      ? (isEn ? 'Cost / 0.01% Buff' : 'Coût / 0.01% Buff') 
      : (isEn ? 'Cost / 1% DPS' : 'Coût / 1% DPS');
  }

  // Meilleure amélioration : première ligne (tableau déjà trié par ratio)
  const nextBest = list[0] || null;

  if (dom.effNextBestDesc) {
    if (nextBest) {
      const unit = isSupport 
        ? (isEn ? '0.01% Raid Buff' : '0.01% Buff Alliés') 
        : (isEn ? '1% Personal DPS' : '1% DPS');
      dom.effNextBestDesc.innerHTML = isEn
        ? `<strong>${nextBest.name}</strong> (${nextBest.gainText}) for an estimated cost of <strong>${formatNumber(nextBest.cost)} gold</strong>, i.e. a cost-efficiency ratio of <strong>${nextBest.ratioText} / ${unit}</strong>.<br><span style="color:var(--text-muted); font-size:14px;"><em>${nextBest.comment}</em></span>`
        : `<strong>${nextBest.name}</strong> (${nextBest.gainText}) pour un coût estimé de <strong>${formatNumber(nextBest.cost)} gold</strong>, soit un ratio de rentabilité de <strong>${nextBest.ratioText} / ${unit}</strong>.<br><span style="color:var(--text-muted); font-size:14px;"><em>${nextBest.comment}</em></span>`;
    } else if (!activeChar) {
      dom.effNextBestDesc.innerHTML = isEn
        ? `Import a character from lostark.bible to rank its upgrades by gold per gain.`
        : `Importe un personnage depuis lostark.bible pour classer ses améliorations par or dépensé.`;
    } else {
      dom.effNextBestDesc.innerHTML = isEn
        ? `No upgrade can be priced on this character right now.`
        : `Aucune amélioration chiffrable sur ce personnage pour l'instant.`;
    }
  }

  if (dom.effTableBody) {
    let rowsHtml = '';
    list.forEach((item, idx) => {
      const isTop = nextBest && nextBest.id === item.id;
      const itemTierLabel = isEn 
        ? item.tierLabel.replace('Rang S+', 'Tier S+').replace('Rang S', 'Tier S').replace('Rang A', 'Tier A').replace('Rang B', 'Tier B').replace('Rang C', 'Tier C').replace('Rang D', 'Tier D').replace('Piège à Gold', 'Gold Trap').replace('Luxe Extrême', 'Extreme Luxury')
        : item.tierLabel;
      rowsHtml += `
          <tr class="eff-row ${isTop ? 'top-pick' : ''}">
            <td class="col-rank">${idx + 1}</td>
            <td class="col-name">
              <div><strong>${item.name}</strong></div>
              <span class="eff-subtext">${item.sub}</span>
            </td>
            <td class="col-state">${escapeHtml(gpdRowState(item, isEn))}</td>
            <td class="col-gain">${item.gainText}</td>
            <td class="col-cost">${formatNumber(item.cost)} g${item.meta && item.meta.pity > 0
                ? `<span class="eff-subtext" title="${escapeHtml(isEn ? 'Worst case: success only at full artisan\'s energy' : 'Pire cas : réussite seulement à la jauge d\'artisan pleine')}">pity ${formatNumber(item.meta.pity)} g</span>` : ''}</td>
            <td class="col-ratio">${item.ratioText}</td>
            <td class="col-prio">
              <span class="prio-badge ${item.tier}">${itemTierLabel}</span>
            </td>
          </tr>
        `;
    });
    if (!list.length) {
      rowsHtml = `<tr class="eff-row"><td colspan="7" class="eff-empty">${activeChar
          ? (isEn ? 'No priced upgrade for this character.' : 'Aucune amélioration chiffrée pour ce personnage.')
          : (isEn ? 'No character imported yet.' : 'Aucun personnage importé.')}</td></tr>`;
    }
    // Avatars sans prix saisi : gain affiché, pas de ratio ni de rang (aucun prix inventé)
    const av = activeChar ? avatarGpdStep(activeChar, isSupport) : null;
    if (av && !av.cost && av.gain >= 1e-4) {
      const t = avatarRowText(av, isEn);
      rowsHtml += `
          <tr class="eff-row eff-row-pending" title="${escapeHtml(t.comment)}">
            <td class="col-rank">—</td>
            <td class="col-name">
              <div><strong>${t.name}</strong></div>
              <span class="eff-subtext">${t.sub}</span>
            </td>
            <td class="col-state">${escapeHtml(t.state)}</td>
            <td class="col-gain">+${av.gain.toFixed(2)}% ${isSupport ? 'Buff' : 'DPS'}</td>
            <td class="col-cost">—</td>
            <td class="col-ratio eff-pending-note" colspan="2">${isEn ? 'Enter the price of a legendary avatar above the table' : 'Saisis le prix d\'un avatar légendaire au-dessus du tableau'}</td>
          </tr>
        `;
    }
    dom.effTableBody.innerHTML = rowsHtml;
  }
}

// Prix hors marché réglables (pheon, bracelet non relancé, avatar légendaire) au-dessus du tableau GPD ;
// vide = défaut Loseii (avatar : pas de défaut, ligne en attente)
function renderGpdPriceInputs(isEn) {
  const box = document.getElementById('gpdPriceInputs');
  if (!box) return;
  const fields = [
    ['pheon', isEn ? 'Pheon (gold)' : 'Pheon (or)'],
    ['bracelet', isEn ? 'Unrolled 90/90 bracelet (gold)' : 'Bracelet 90/90 non relancé (or)'],
    ['avatar', isEn ? 'Legendary avatar, 1 piece (gold)' : 'Avatar légendaire, 1 pièce (or)']
  ];
  if (!box.dataset.bound) {
    box.innerHTML = fields.map(([k, label]) => `
        <label class="gpd-price-field">
          <span data-label="${k}">${label}</span>
          <input type="number" min="0" step="1" inputmode="numeric" data-price="${k}">
        </label>`).join('');
    box.querySelectorAll('input[data-price]').forEach(inp => {
      inp.addEventListener('change', () => {
        const v = Number(inp.value);
        state.gpdPrices = state.gpdPrices || {};
        if (v > 0) state.gpdPrices[inp.dataset.price] = v; else delete state.gpdPrices[inp.dataset.price];
        saveGpdPrices();
        refreshGpdViews();
      });
    });
    box.dataset.bound = '1';
  }
  fields.forEach(([k, label]) => {
    const inp = box.querySelector(`input[data-price="${k}"]`);
    const lab = box.querySelector(`span[data-label="${k}"]`);
    if (lab) lab.textContent = label;
    if (!inp) return;
    const own = state.gpdPrices && state.gpdPrices[k] > 0 ? state.gpdPrices[k] : '';
    if (document.activeElement !== inp) inp.value = own;
    inp.placeholder = GPD_DEFAULT_PRICES[k] > 0 ? `${formatNumber(GPD_DEFAULT_PRICES[k])} (Loseii)` : (isEn ? 'to enter' : 'à saisir');
  });
}

/**
 * Panneau « Matériaux liés » du personnage actif (onglets GPD et simulateur d'affinage) : stock par matériau, utilisé
 * avant l'achat au marché. Groupes affichés selon le stuff (Serka / Aegir encore sous +25) ; souffles toujours.
 * Noms des objets en anglais, comme l'onglet Marché (MARKET_PRICE_GROUPS).
 */
function renderBoundMatsPanel(box, isEn) {
  if (!box) return;
  const c = getCurrentActiveCharacter();
  if (!c) { box.innerHTML = ''; box.dataset.sig = ''; return; }
  const gear = c.gear || (c.rawProfile && c.rawProfile.gear) || null;
  const open = sl => gear && gear[sl] >= 0 && gear[sl] < 25;
  const hasSerka = !gear || HONING_SIM_PIECES.some(sl => open(sl) && pieceIsSerka(gear, sl));
  const hasAegir = !!gear && HONING_SIM_PIECES.some(sl => open(sl) && !pieceIsSerka(gear, sl));
  const groups = (typeof MARKET_PRICE_GROUPS !== 'undefined' ? MARKET_PRICE_GROUPS : [])
    .filter(g => (g.en === 'Serka honing' ? hasSerka : g.en === 'Aegir honing' ? hasAegir : true));
  const owned = getBoundMats(c) || {};
  const n = Object.keys(owned).length;
  const sig = `${boundMatsId(c)}|${groups.map(g => g.en).join(',')}|${isEn}`;
  if (box.dataset.sig !== sig) {
    const name = escapeHtml(c.name || '');
    box.innerHTML = `
      <details class="bound-mats"${n ? ' open' : ''}>
        <summary>${isEn ? `Bound materials of ${name}` : `Matériaux liés de ${name}`} <span class="bound-mats-count"></span></summary>
        <p class="bound-mats-note">${isEn
          ? 'Used before buying at the market in honing costs (GPD, Smart Advisor, roadmap, honing simulator, predictor, Belgardin). Each GPD row counts with your whole stock; a plan uses it up step by step. Advanced honing and the Benchmark stay at market price.'
          : 'Utilisés avant l\'achat au marché dans les coûts d\'affinage (GPD, Smart Advisor, feuille de route, simulateur, prédicteur, Belgardin). Chaque ligne du GPD compte avec tout ton stock ; un plan le consomme étape par étape. Affinage avancé et Benchmark : prix du marché.'}</p>
        <div class="bound-mats-groups">${groups.map(g => `
          <fieldset class="bound-mats-group">
            <legend>${isEn ? g.en : g.fr}</legend>
            ${g.items.map(([slug, label]) => `
            <label class="gpd-price-field">
              <span>${escapeHtml(label)}</span>
              <input type="number" min="0" step="1" inputmode="numeric" data-bound-mat="${slug}" placeholder="0">
            </label>`).join('')}
          </fieldset>`).join('')}
        </div>
      </details>`;
    box.querySelectorAll('input[data-bound-mat]').forEach(inp => {
      inp.addEventListener('change', () => {
        setBoundMat(getCurrentActiveCharacter(), inp.dataset.boundMat, Number(inp.value));
        refreshBoundMatsViews();
      });
    });
    box.dataset.sig = sig;
  }
  box.querySelectorAll('input[data-bound-mat]').forEach(inp => {
    if (document.activeElement !== inp) inp.value = owned[inp.dataset.boundMat] > 0 ? owned[inp.dataset.boundMat] : '';
  });
  const count = box.querySelector('.bound-mats-count');
  if (count) count.textContent = n ? (isEn ? `· ${n} entered` : `· ${n} renseigné${n > 1 ? 's' : ''}`) : (isEn ? '· none' : '· aucun');
}

// Après une saisie de stock : tout ce qui chiffre l'affinage
function refreshBoundMatsViews() {
  refreshGpdViews();
  if (typeof updateHoningView === 'function') updateHoningView();
  if (typeof updatePredictorView === 'function') updatePredictorView();
  if (typeof renderBelgardinReadiness === 'function') renderBelgardinReadiness();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- 4a-bis. SMART UPGRADE ADVISOR (PLANIFICATEUR RENTABLE DE PROGRESSION) ---

const advisorState = {};
