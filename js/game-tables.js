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
// Options support des astrogemmes : valeur (0,01 %) par niveau d'option, gemOptions[id][n - 1]
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
}

// --- Prix hors marché du GPD, réglables dans l'onglet GPD : pheon et bracelet non relancé ---
// Défauts = prix unitaires des tables de Loseii (lus sur leurs achats de bracelet), sinon ces valeurs.
const GPD_PRICE_KEY = 'lostark_gpd_prices';
const GPD_DEFAULT_PRICES = { pheon: 2300, bracelet: 24000 };
// Pierre d'aptitude non taillée : 9 pheons (Loseii : « uncut Ancient stones at 9 pheons each »)
const ABILITY_STONE_PHEONS = 9;
function loadGpdPrices() {
  try { return JSON.parse(localStorage.getItem(GPD_PRICE_KEY)) || {}; } catch (e) { return {}; }
}
function saveGpdPrices() {
  try { localStorage.setItem(GPD_PRICE_KEY, JSON.stringify(state.gpdPrices || {})); } catch (e) {}
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
 * On garde le nombre constant de souffles le moins cher (souvent 0 quand le souffle coûte plus que les tentatives qu'il évite).
 */
function recipeStepCost(recipe) {
  const matGold = Object.entries(recipe.mats).reduce((sum, [slug, n]) => sum + n * (state.marketPrices[slug] || 0), 0);
  const baseTap = recipe.gold + matGold;
  const breathPrice = recipe.breath ? (state.marketPrices[recipe.breath.slug] || 0) : 0;
  let best = null;
  const maxB = recipe.breath ? recipe.breath.max : 0;
  for (let b = 0; b <= maxB; b++) {
    const juice = recipe.breath ? b * recipe.breath.rate : 0;
    let reach = 1, energy = 0, taps = 0;
    for (let fails = 0; fails < 1000 && reach > 1e-9; fails++) {
      if (energy >= recipe.threshold) { taps += reach; reach = 0; break; }
      const p = Math.min(10000, recipe.success + Math.min(fails * recipe.failBonus, recipe.failMax) + juice);
      taps += reach;
      reach *= 1 - p / 10000;
      energy += p;
    }
    const cost = taps * (baseTap + b * breathPrice);
    if (!best || cost < best.cost) best = { cost, taps, breaths: b, rawGold: taps * recipe.gold };
  }
  return best;
}
