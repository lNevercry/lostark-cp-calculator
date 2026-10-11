// Tables du jeu et de Loseii chargées en direct : Battle Point, recalcul support, Karma, GPD de Loseii, prix, recettes d'affinage.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// Battle Point des cœurs de la Grille d'Ark en mode DPS (table du jeu, tools/fetch-maxroll-honing.mjs) :
// par ID de cœur, valeur cumulée à 10 / 14 / 17 / 18 / 19 / 20 points, en 0,01 % de dégâts
let arkGridBp = null;
async function loadArkGridBp() {
  try {
    const res = await fetch('data/ark-grid-bp.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    arkGridBp = await res.json();
    if (typeof renderEfficiencyTable === 'function') renderEfficiencyTable();
    if (typeof renderAdvisorView === 'function') renderAdvisorView();
  } catch (e) {
    console.warn('[ARK GRID] Battle Point des cœurs indisponible, barème interne utilisé :', e.message);
  }
}

// --- Battle Point support recalculé (profils raid « mélangés ») ---
// Bug du jeu : l'arbre d'Ark Passive enregistré ne se met à jour qu'à la déconnexion du personnage. Un support qui a changé
// d'arbre en jeu peut donc avoir un profil raid lostark.bible calculé en mode DPS (lignes support à 0, 2 gravures comptées…),
// alors que tout le reste (stuff, gravures, gemmes, cœurs) est à jour. Quand les gravures disent support, on recalcule le
// Battle Point en mode support avec la table du jeu (branche 2, data/battle-point-support.json, tools/fetch-maxroll-honing.mjs).
// Vérifié à l'identique, partie par partie, sur 6 profils support corrects (Bardes, Paladins, Artiste).
let bpSupportTable = null;
// Options des astrogemmes : valeur (0,01 %) par niveau d'option, gemOptions[id][n - 1] (2011-2013 support, 2001 PA % DPS)
let astroSupportOptions = null;
async function loadBpSupportTable() {
  try {
    const res = await fetch('data/battle-point-support.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    bpSupportTable = json.rows;
    astroSupportOptions = json.gemOptions || null;
    healStoredSupportProfiles();
  } catch (e) {
    console.warn('[BATTLE POINT] Table support indisponible, profils mélangés non recalculés :', e.message);
  }
}

// Niveau de pierre d'une gravure d'après ses nœuds taillés (6 = +1, 7-8 = +2, 9 = +3, 10 = +4)
const stoneLevelOfNodes = nodes => (nodes >= 10 ? 4 : nodes >= 9 ? 3 : nodes >= 7 ? 2 : nodes >= 6 ? 1 : 0);
// Clés de stat des lignes de bijoux et de bracelet dans la table (1 = stat type 2 + index)
const SUPPORT_LINE_KEYS = { 15: { 2: [54], 3: [59] }, 16: { 2: [50], 3: [51] }, 19: { 2: [54], 3: [59] } };

/**
 * Battle Point support d'un loadout enregistré en mode DPS, ou null s'il n'y a rien à recalculer.
 * Reprend du profil ce qui ne dépend pas du mode (PA de base, PV, niveau, points d'Ark Passive, Karma, cartes, paradis,
 * gemmes, lignes de stats de base) et revalorise tout le reste avec la table support.
 */
function rebuildSupportBattlePoint(loadout) {
  const T = bpSupportTable;
  const bp = loadout && loadout.battlePoint;
  if (!T || !bp || bp.isSupport !== false || !Array.isArray(bp.parts)) return null;
  const old = bp.parts;
  const get = t => old.find(p => p.type === t);
  const row = (t, pred) => (T[t] || []).find(pred);
  const t1 = get(1), t2 = get(2);
  if (!t1 || !(t1.baseAttackPower > 0) || !t2 || !(t2.maxHp > 0)) return null;
  // Lignes de stats de base (puissance d'arme, stat principale, PV…) : valeur 0 dans les deux modes, gardées pour la lecture du profil
  const parts = old.filter(p => p.affectsBaseStats === true);
  parts.push(Object.assign({}, t1, { value: t1.baseAttackPower * T[1][0][0] / 100 }));
  parts.push(Object.assign({}, t2, { value: t2.maxHp * T[2][0][0] }));
  const lvl = get(3);
  if (lvl) { const r = row(3, v => v[0] === lvl.level); parts.push(Object.assign({}, lvl, { value: r ? r[1] : 0 })); }
  const q = get(4);
  if (q) parts.push(Object.assign({}, q, { value: 0 }));
  [5, 6, 7].forEach(t => { const p = get(t); if (p) parts.push(Object.assign({}, p, { value: T[t][0][0] * (p.pointsSpent || 0) })); });
  const karma = get(8);
  if (karma) parts.push(Object.assign({}, karma));
  // Gravures : niveau de livres (13 = relique 20/20) + 20 × niveau de pierre ; type 10 (buff) ou 11 (défense)
  const stone = ((loadout.items || []).find(i => i.slot === 'ability_stone') || {}).data || {};
  const stoneLv = {};
  (stone.engravings || []).forEach(e => { stoneLv[1000 + e.id] = stoneLevelOfNodes(e.nodes); });
  (loadout.engravings || []).forEach(e => {
    const books = e.grade === 'engrave_grade05' ? 13 : (e.grade === 'engrave_grade04' ? 9 + Math.floor((e.progress || 0) / 5) : null);
    if (books === null) return;
    const code = 20 * (stoneLv[e.id] || 0) + books;
    [10, 11].forEach(t => {
      const r = row(t, v => v[0] === e.id && v[1] === code);
      if (r) parts.push({ type: t, value: r[2], id: e.id, grade: e.grade, stonePoints: stoneLv[e.id] || 0 });
    });
  });
  // Lignes de bijoux et de bracelet
  const lineValue = (t, st) => {
    const r = (T[t] || []).find(([key, index]) => (key === 1
      ? st.type === 2 && st.index === index
      : ((SUPPORT_LINE_KEYS[t] || {})[key] || []).includes(st.type) || (key === 3 && t !== 16 && st.index === 16000001)));
    return r ? st.value * r[2] / 1e4 : 0;
  };
  (loadout.items || []).forEach(it => {
    const stats = (it.data && it.data.stats) || [];
    const isAcc = ACC_SLOTS.includes(it.slot);
    if (!isAcc && it.slot !== 'bracelet') return;
    stats.forEach(st => {
      if (isAcc) {
        [15, 16].forEach(t => { const v = lineValue(t, st); if (v) parts.push({ type: t, value: v, slot: it.slot, stat: st, affectsBaseStats: false }); });
        if (st.type === 29) { const r = row(17, v => v[1] === st.index); if (r) parts.push({ type: 17, value: r[2], slot: it.slot, stat: st, affectsBaseStats: false }); }
      } else {
        const v = lineValue(19, st);
        if (v) parts.push({ type: 19, value: v, stat: st, affectsBaseStats: false });
        if (st.type === 3) [20, 21].forEach(t => { const r = row(t, x => x[1] === st.index); if (r) parts.push({ type: t, value: r[2], stat: st, affectsBaseStats: false }); });
      }
    });
  });
  // Gemmes : niveau = (ID mod 1000) / 10, T4 = 125 × niveau
  old.filter(p => p.type === 22).forEach(p => {
    const tier = String(p.id).startsWith('650') ? 4 : 3;
    const r = row(22, v => v[0] === tier && v[1] === Math.floor((p.id % 1000) / 10));
    if (r) parts.push(Object.assign({}, p, { value: r[2] }));
  });
  // Stats de combat : clé k = stat de combat 14 + k (2 = Spécialisation, 4 = Célérité en mode support)
  const stat = t => ((loadout.stats || []).find(s => s.type === t) || {}).value || 0;
  const combat = get(26);
  parts.push(Object.assign({}, combat || { type: 26 }, {
    value: T[26].reduce((sum, [k, c]) => sum + stat(14 + k) * c, 0),
    total: T[26].reduce((sum, [k]) => sum + stat(14 + k), 0)
  }));
  const cards = get(27);
  if (cards) { const r = row(27, v => v[0] === cards.id && v[1] === cards.rank); parts.push(Object.assign({}, cards, { value: r ? r[2] : 0 })); }
  // Cœurs de la Grille d'Ark : points = somme des points des gemmes, paliers 10 / 14 / 17 / 18 / 19 / 20
  (loadout.arkGridCores || []).forEach(c => {
    const points = (c.gems || []).reduce((s, g) => s + (g.corePoints || 0), 0);
    [29, 30].forEach(t => {
      const rows = (T[t] || []).filter(v => v[0] === c.id);
      let value = 0;
      [10, 14, 17, 18, 19, 20].forEach((st, i) => { const r = rows.find(v => v[1] === i + 1); if (points >= st && r && r[2] !== undefined) value = r[2]; });
      if (value) parts.push({ type: t, value, id: c.id, points });
    });
  });
  // Astrogemmes : niveau total de chaque option support (2011 à 2013) sur les gemmes des cœurs
  const opts = {};
  (loadout.arkGridCores || []).forEach(c => (c.gems || []).forEach(g => (g.opts || []).forEach(o => { opts[o.id] = (opts[o.id] || 0) + (o.level || 0); })));
  Object.entries(opts).forEach(([id, totalLevel]) => {
    const r = (T[31] || []).filter(v => v[0] === Number(id) && v[1] <= totalLevel).pop();
    if (r) parts.push({ type: 31, value: r[2], id: Number(id), totalLevel });
  });
  const paradise = get(33) || get(34);
  if (paradise) { const r = row(34, v => v[0] === paradise.id); if (r) parts.push({ type: 34, value: r[1], id: paradise.id, paradisePoints: paradise.paradisePoints }); }
  return Object.assign({}, bp, { isSupport: true, rebuiltSupport: true, parts });
}

// Profils déjà enregistrés (roster, références en cache) : même recalcul une fois la table chargée
function healSupportProfile(c) {
  const raw = c && c.rawProfile;
  if (!raw || !raw.loadout || detectCharacterRole(c) !== 'support') return false;
  const bp = rebuildSupportBattlePoint(raw.loadout);
  if (!bp) return false;
  raw.loadout.battlePoint = bp;
  raw.battlePoint = bp;
  raw.astrogems = bp.parts.filter(p => p.type === 31 || p.type === 32);
  if (c.loadout) c.loadout = raw.loadout;
  if (c.battlePoint) c.battlePoint = bp;
  return true;
}

function healStoredSupportProfiles() {
  const roster = getUserRoster();
  if (roster && roster.some(healSupportProfile)) saveUserRoster(roster);
  let cacheChanged = false;
  Object.values(liveBibleBenchmarkCache).forEach(b => {
    if (healSupportProfile(b)) { b.systems = extractPlayerSystems(b, isEnglishLang()); cacheChanged = true; }
  });
  if (cacheChanged) {
    storeCompact('lostark_live_benchmarks_cache', liveBibleBenchmarkCache);
  }
  if (typeof updateActiveCharacterCard === 'function' && activeCharacterId) updateActiveCharacterCard(activeCharacterId);
  if (typeof renderEfficiencyTable === 'function') renderEfficiencyTable();
  const benchTab = document.getElementById('tab-benchmark');
  if (benchTab && benchTab.classList.contains('active') && typeof renderBenchmarkTab === 'function') renderBenchmarkTab();
}

// Karma d'Illumination du jeu (flux Maxroll, tools/fetch-maxroll-honing.mjs) : chance, énergie par échec, or, puissance d'arme
let karmaT4 = null;
async function loadKarmaT4() {
  try {
    const res = await fetch('data/karma-t4.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    karmaT4 = (await res.json()).enlightenment;
    refreshGpdViews();
  } catch (e) {
    console.warn('[KARMA] Table Maxroll indisponible, pas de ligne Karma :', e.message);
  }
}

// --- Tables du GPD de Loseii (loseii.com/loa-gpd), chargées en direct (CORS ouvert, lookup.js est fait pour ça) ---
// rows.json (support, % de dégâts d'UN allié) et rows-dps.json : échelles du bracelet par note, avec leurs achats
// (bracelets non relancés, pheons) ; arkgrid-rows-*.json : taille d'astrogemmes épiques / rares par note moyenne des
// 24 gemmes, simulée par leur modèle de compte (or de taille et de fusion, gemme brute gratuite). astrogem.js note les gemmes.
const LOSEII_GPD = 'https://www.loseii.com/loa-gpd/data/';
const LOSEII_ASTROGEM_JS = 'https://www.loseii.com/loa-astrogem-calc/model/astrogem.js?v=62';
const LOSEII_ASTROGEM_SRI = 'sha384-kyWxDB+/DNZrb2NfgLFc/CWdufhq5PAoghXG0wi7NFERX15wP62RyvMdWMWMdvsC';
const loseiiGpd = { rows: {}, arkgrid: { support: {}, dps: {} } };
// Textes des tables de Loseii (notes, « minimum », « odds ») insérés tels quels dans le HTML du GPD :
// table tierce sans empreinte, on retire tout caractère de balise ou de guillemet d'attribut.
function stripMarkup(v) {
  if (typeof v === 'string') return v.replace(/[<>"`]/g, '');
  if (Array.isArray(v)) return v.map(stripMarkup);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k] = stripMarkup(v[k]);
    return o;
  }
  return v;
}

async function loadLoseiiGpd() {
  const get = async f => {
    const res = await fetch(LOSEII_GPD + f, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${f} : HTTP ${res.status}`);
    return stripMarkup(await res.json());
  };
  try {
    const [sup, dps, se, sr, de, dr] = await Promise.all(['rows.json', 'rows-dps.json',
      'arkgrid-rows-epic.json', 'arkgrid-rows-rare.json', 'arkgrid-rows-dps-epic.json', 'arkgrid-rows-dps-rare.json'].map(get));
    loseiiGpd.rows = { support: sup.rows || [], dps: dps.rows || [] };
    loseiiGpd.arkgrid = { support: { epic: se, rare: sr }, dps: { epic: de, rare: dr } };
    setLoseiiDefaultPrices();
    refreshGpdViews();
  } catch (e) {
    console.warn('[LOSEII] Tables du GPD indisponibles, pas de lignes bracelet / astrogemmes :', e.message);
  }
  if (!window.Astrogem && document && document.head) {
    const sc = document.createElement('script');
    sc.src = LOSEII_ASTROGEM_JS;
    // Script tiers épinglé par son empreinte : s'il change, le navigateur refuse de l'exécuter (pas de note d'astrogemmes).
    // Nouvelle version chez Loseii : mettre à jour LOSEII_ASTROGEM_JS et LOSEII_ASTROGEM_SRI ensemble.
    sc.integrity = LOSEII_ASTROGEM_SRI;
    sc.crossOrigin = 'anonymous';
    sc.async = true;
    sc.onload = () => {
      refreshGpdViews();
      // La carte Astrogemmes de la fiche prend la note de Loseii dès que le modèle est là
      if (typeof updateActiveCharacterCard === 'function' && activeCharacterId) updateActiveCharacterCard(activeCharacterId);
    };
    sc.onerror = () => console.warn('[LOSEII] Modèle astrogem.js indisponible, pas de note d\'astrogemmes');
    document.head.appendChild(sc);
  }
}

function refreshGpdViews() {
  if (typeof renderEfficiencyTable === 'function') renderEfficiencyTable();
  if (typeof renderAdvisorView === 'function') renderAdvisorView();
  // Onglet Optimisation : mêmes prix et tables (ligne bracelet « note suivante », coûts)
  if (typeof updateOptimizationView === 'function') updateOptimizationView();
}

// --- Prix hors marché du GPD, réglables dans l'onglet GPD : pheon, bracelet non relancé, avatar légendaire ---
// Défauts = prix unitaires des tables de Loseii (lus sur leurs achats de bracelet), sinon ces valeurs.
// Avatar légendaire (une pièce) : aucun défaut (ni marché ni Loseii), la ligne attend le prix du joueur.
const GPD_PRICE_KEY = 'lostark_gpd_prices';
const GPD_DEFAULT_PRICES = { pheon: 2300, bracelet: 24000 };
// Pierre d'aptitude non taillée : 9 pheons (Loseii : « uncut Ancient stones at 9 pheons each »)
const ABILITY_STONE_PHEONS = 9;
function loadGpdPrices() {
  try { return JSON.parse(lsGet(GPD_PRICE_KEY)) || {}; } catch (e) { return {}; }
}
function saveGpdPrices() {
  try { lsSet(GPD_PRICE_KEY, JSON.stringify(state.gpdPrices || {})); } catch (e) {}
}
function gpdUnitPrice(kind) {
  const v = state.gpdPrices && state.gpdPrices[kind];
  return v > 0 ? v : GPD_DEFAULT_PRICES[kind];
}
function setLoseiiDefaultPrices() {
  // Prix unitaires de Loseii lus sur une ligne 90/90 de leur échelle (ils varient un peu d'une ligne à l'autre)
  const r = (loseiiGpd.rows.dps || []).find(x => x.series === 'bracelet' && Array.isArray(x.mats) &&
    x.mats.some(([name]) => /90\/90 bracelet/i.test(name)) && x.mats.some(([name]) => /pheon/i.test(name)));
  if (!r) return;
  r.mats.forEach(([name, n, gold]) => {
    if (!(n > 0) || !(gold > 0)) return;
    if (/pheon/i.test(name)) GPD_DEFAULT_PRICES.pheon = Math.round(gold / n);
    else if (/90\/90 bracelet/i.test(name)) GPD_DEFAULT_PRICES.bracelet = Math.round(gold / n);
  });
}

// Recettes d'affinage T4 du jeu (Aegir / Serka), tirées du flux Maxroll par tools/fetch-maxroll-honing.mjs
let honingT4 = null;
async function loadHoningT4() {
  try {
    const res = await fetch('data/honing-t4.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    honingT4 = await res.json();
    // Le prédicteur a pu s'afficher avant les recettes (repli « sans personnage ») : on le recalcule
    if (typeof updatePredictorView === 'function') updatePredictorView();
    if (typeof updateHoningView === 'function') updateHoningView();
    if (typeof renderEfficiencyTable === 'function') renderEfficiencyTable();
    if (typeof renderAdvisorView === 'function') renderAdvisorView();
    const active = typeof getCurrentActiveCharacter === 'function' ? getCurrentActiveCharacter() : null;
    if (active && typeof updateActiveCharacterCard === 'function') updateActiveCharacterCard(active.id || active.name);
  } catch (e) {
    console.warn('[HONING] Recettes Maxroll indisponibles, tables internes utilisées :', e.message);
  }
}

/**
 * Coût attendu d'une étape d'affinage (+lvl → +lvl+1) d'après la recette du jeu.
 * Taux en 0,01 % : p = base + min(échecs × failBonus, failMax) + souffles × rate.
 * Chaque échec charge l'énergie d'artisan du taux dépensé ; à `threshold` (215 %) la tentative suivante réussit.
 * Souffles : pleins sur les N premiers essais puis aucun, N le moins cher (aucun, quelques-uns ou tous les essais).
 * Un souffle rapporte son taux × le coût qui reste à payer, qui baisse en approchant de la jauge pleine : il vaut plus
 * tôt que tard. Vérifié sur toutes les recettes, prix des souffles × 0,1 à × 4 : identique à l'optimum essai par
 * essai (programmation dynamique) sauf un souffle isolé juste avant la jauge pleine (≤ 0,1 %, non retenu) ; jamais
 * plus cher qu'un nombre constant de souffles à chaque essai (ancien modèle) à 0,003 % près, jusqu'à 1,1 % moins cher.
 * Essai garanti (jauge pleine) ou déjà à 100 % : jamais de souffle.
 * Pity (pire cas, même stratégie) : échecs jusqu'à la jauge pleine, puis la tentative garantie
 * (ex. Serka +24 armure, 0,5 % : 219 tentatives, 2,4 × le coût attendu).
 * owned : matériaux liés du personnage ({ slug: quantité }), utilisés avant l'achat au marché (stratégie de souffles
 * choisie avec : des souffles possédés sont gratuits). Méthode de loa-sim.vercel.app.
 * Résultat gardé par recette, prix et stock (appelé des milliers de fois par la feuille de route).
 */
const recipeCostCache = new WeakMap();
function recipeStepCost(recipe, owned) {
  const matGold = Object.entries(recipe.mats).reduce((sum, [slug, n]) => sum + n * (state.marketPrices[slug] || 0), 0);
  const baseTap = recipe.gold + matGold;
  const breathPrice = recipe.breath ? (state.marketPrices[recipe.breath.slug] || 0) : 0;
  const own = recipeOwned(recipe, owned);
  const key = `${baseTap}|${breathPrice}${own ? '|' + JSON.stringify(own) : ''}`;
  let cache = recipeCostCache.get(recipe);
  if (!cache) recipeCostCache.set(recipe, cache = new Map());
  if (cache.has(key)) return cache.get(key);
  const maxB = recipe.breath ? recipe.breath.max : 0;
  const rate = recipe.breath ? recipe.breath.rate : 0;
  // Souffles pleins sur les n premiers essais ; all = chaque essai non garanti en a eu ;
  // dist[t - 1] = probabilité de réussir au t-ième essai (inventaire de matériaux liés)
  const simulate = n => {
    let reach = 1, energy = 0, taps = 0, breaths = 0, juiced = 0, plain = false, pityTaps = 0, pityBreaths = 0;
    const dist = [];
    for (let fails = 0; fails < 1000 && reach > 1e-9; fails++) {
      if (energy >= recipe.threshold) { taps += reach; dist.push(reach); pityTaps = fails + 1; break; }
      const base = Math.min(10000, recipe.success + Math.min(fails * recipe.failBonus, recipe.failMax));
      const b = fails < n && base < 10000 ? maxB : 0;
      if (b) juiced++; else if (base < 10000) plain = true;
      const p = Math.min(10000, base + b * rate);
      taps += reach;
      breaths += reach * b;
      pityBreaths += b;
      dist.push(reach * p / 10000);
      reach *= 1 - p / 10000;
      energy += p;
      if (p >= 10000) { pityTaps = fails + 1; break; }
    }
    const r = { cost: taps * baseTap + breaths * breathPrice, taps, breathsUsed: breaths, juiced, all: !plain, pityTaps, pityBreaths,
      pityCost: pityTaps * baseTap + pityBreaths * breathPrice, boundUse: {}, pityBoundUse: {} };
    return own ? withOwned(r, dist) : r;
  };
  // Matériaux liés utilisés d'abord : coût de t essais X(t) = or + achats au-delà du stock, espérance exacte
  // sur la distribution des essais (pas seulement le besoin moyen moins le stock), usage moyen du stock
  const withOwned = (r, dist) => {
    const mats = Object.entries(recipe.mats).map(([slug, q]) => ({ slug, q, price: state.marketPrices[slug] || 0, own: own[slug] || 0, cap: Infinity }));
    if (r.juiced > 0) mats.push({ slug: recipe.breath.slug, q: maxB, price: breathPrice, own: own[recipe.breath.slug] || 0, cap: r.juiced });
    const need = (m, t) => m.q * Math.min(t, m.cap);
    const X = t => mats.reduce((g, m) => g + m.price * Math.max(0, need(m, t) - m.own), t * recipe.gold);
    let cost = 0;
    const use = {};
    dist.forEach((pr, i) => {
      cost += pr * X(i + 1);
      mats.forEach(m => { if (m.own > 0) use[m.slug] = (use[m.slug] || 0) + pr * Math.min(m.own, need(m, i + 1)); });
    });
    const pityUse = {};
    mats.forEach(m => { if (m.own > 0) pityUse[m.slug] = Math.min(m.own, need(m, r.pityTaps)); });
    return Object.assign(r, { cost, pityCost: X(r.pityTaps), boundUse: use, pityBoundUse: pityUse });
  };
  let best = null;
  for (let n = 0; n <= 1000; n++) {
    const r = simulate(n);
    if (!best || r.cost < best.cost) best = r;
    if (!maxB || r.all) break;
  }
  const res = {
    cost: best.cost, taps: best.taps, rawGold: best.taps * recipe.gold,
    // breaths : souffles par essai (0 = aucun), sur les breathTaps premiers essais, ou sur tous (breathAll)
    breaths: best.juiced > 0 ? maxB : 0, breathTaps: best.juiced, breathAll: best.juiced > 0 && best.all, breathsUsed: best.breathsUsed,
    pityTaps: best.pityTaps, pityCost: best.pityCost, pityRawGold: best.pityTaps * recipe.gold,
    // Stock de matériaux liés consommé : en moyenne (boundUse) et au pity (pityBoundUse)
    boundUse: best.boundUse, pityBoundUse: best.pityBoundUse
  };
  if (cache.size > 64) cache.clear();
  cache.set(key, res);
  return res;
}

// Stock utile à une recette (matériaux et souffle de la recette, quantités > 0) ; null si rien
function recipeOwned(recipe, owned) {
  if (!owned) return null;
  const slugs = Object.keys(recipe.mats).concat(recipe.breath ? [recipe.breath.slug] : []);
  const out = {};
  slugs.forEach(slug => { if (owned[slug] > 0) out[slug] = owned[slug]; });
  return Object.keys(out).length ? out : null;
}
