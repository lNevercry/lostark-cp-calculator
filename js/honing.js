// Chemin d'affinage, gains et coûts d'affinage et d'affinage avancé.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

/**
 * Prédicteur, mode affinage : chemin le moins cher en or jusqu'à l'iLvl visé, sur le vrai stuff du personnage.
 * Chaque +1 d'une pièce vaut +5 iLvl sur la pièce (+0,83 au total) quelle qu'elle soit : on prend à chaque fois le
 * palier le moins cher (recettes du jeu, prix du marché), à coût égal celui qui rapporte le plus. CP par le modèle
 * validé (gearCpGain). null sans données (pas de personnage, table d'affinage absente).
 */
function predictHoningPath(charObj, targetIlvl, isSupport) {
  const ctx = gearStatContext(charObj);
  if (!ctx || !honingT4) return null;
  const g = ctx.gear;
  const pieces = HONING_SIM_PIECES.map(slot => {
    return { slot, isSerka: pieceIsSerka(g, slot), lvl: g[slot], adv: gearAdvOf(charObj, g, slot), to: g[slot] };
  });
  if (pieces.some(p => !(p.lvl >= 0))) return null;
  const ilvlOf = p => (p.isSerka ? 1675 + 5 * p.to : 1590 + 5 * p.to + p.adv);
  const avg = () => pieces.reduce((sum, p) => sum + ilvlOf(p), 0) / 6;
  const startIlvl = avg();
  let gold = 0;
  const changes = () => pieces.map(p => ({ slot: p.slot, isSerka: p.isSerka, lvl: p.lvl, adv: p.adv, toLvl: p.to, toAdv: p.adv }));
  while (avg() < targetIlvl - 1e-6) {
    let best = null;
    pieces.forEach(p => {
      if (p.to >= 25) return;
      const cost = getLevelCost(p.slot === 'weapon' ? 'weapon' : 'armor', p.to, p.isSerka ? 'serka' : 'aegir').totalValue;
      if (!(cost > 0)) return;
      if (!best || cost < best.cost - 1 || (Math.abs(cost - best.cost) <= 1 && p.slot === 'weapon')) best = { p, cost };
    });
    if (!best) break;
    best.p.to++;
    gold += best.cost;
  }
  const r = gearDpsGain(ctx, changes());
  const cpGain = gearCpGain(charObj, ctx, r, isSupport);
  if (cpGain === null) return null;
  return {
    cpGain, gold, startIlvl, reachedIlvl: avg(), reached: avg() >= targetIlvl - 1e-6,
    steps: pieces.filter(p => p.to > p.lvl).map(p => ({ slot: p.slot, from: p.lvl, to: p.to }))
  };
}

/**
 * CP du jeu si les gemmes T4 du personnage montaient au moins au niveau `minLevel` (les `count` plus faibles
 * seulement si count est donné). DPS : dégâts du GPD (dpsGemSetGain) ; support : partie gemmes du Battle Point
 * (125 × niveau, branche buff) et % de PA des gemmes. null sans gemmes lisibles.
 */
function gemCpBonus(charObj, minLevel, count, isSupport) {
  const cp = charObj && ((charObj.rawProfile && charObj.rawProfile.raidCombatPower) || charObj.cp);
  const levels = isSupport ? realGemLevels(charObj) : (realGems(charObj) || []).map(x => x.level);
  if (!(cp > 0) || !levels || !levels.length) return null;
  const order = levels.map((l, i) => i).sort((a, b) => levels[a] - levels[b]);
  const pick = new Set(count ? order.slice(0, count) : order);
  const to = levels.map((l, i) => (pick.has(i) ? Math.max(l, minLevel) : l));
  if (!isSupport) {
    const gain = dpsGemSetGain(charObj, to);
    return gain === null ? null : cp * (Math.exp(gain / 100) - 1);
  }
  return supportGemCpDelta(charObj, levels, to);
}

// CP support d'un changement de niveaux de gemmes : partie type 22 (125 × niveau) et % de PA, branche buff
function supportGemCpDelta(charObj, levels, to) {
  const br = supportBpBranches(charObj);
  const p1 = battlePointPartsOf(charObj).find(x => x.type === 1);
  if (!br || !p1) return null;
  const apPool = (p1.attackPowerMultiplier || 0) / 100;
  const gemBp = lv => lv.reduce((m, l) => m * (1 + SUPPORT_GEM_BP_PER_LEVEL * l / 1e4), 1);
  const gemAp = lv => lv.reduce((sum, l) => sum + GEM_AP_PCT[l], 0) / 100;
  return br.A * (gemBp(to) / gemBp(levels) * (1 + apPool + gemAp(to) - gemAp(levels)) / (1 + apPool) - 1);
}

// Gain d'un changement de pièces selon le rôle : dégâts personnels (DPS) ou buff donné aux alliés (support)
function gearRoleGain(charObj, ctx, changes, isSupport) {
  const r = gearDpsGain(ctx, changes);
  if (!r) return null;
  return isSupport ? supportApGain(charObj, ctx, r.dWp, r.dMs) : r.gain;
}

/**
 * Gain DPS (%) d'une étape d'affinage (+1) sur l'arme ou sur les 5 armures, chaque pièce depuis
 * son niveau et son affinage avancé. null si une donnée manque.
 */
// Gain (DPS ou buff) de +k niveaux d'affinage sur l'arme ou les 5 armures, chaque pièce depuis son niveau (max +25)
function honingChangesTo(charObj, ctx, piece, k) {
  const g = ctx.gear;
  const slots = piece === 'weapon' ? ['weapon'] : GEAR_ARMOR_SLOTS;
  return slots.filter(sl => g[sl] >= 0 && g[sl] < 25)
    .map(sl => ({ slot: sl, isSerka: pieceIsSerka(g, sl), lvl: g[sl], adv: gearAdvOf(charObj, g, sl), toLvl: Math.min(25, g[sl] + k), toAdv: gearAdvOf(charObj, g, sl) }));
}
function honingGainTo(charObj, piece, isSerka, isSupport, k) {
  if (!(k > 0)) return 0;
  const ctx = gearStatContext(charObj);
  if (!ctx) return null;
  const changes = honingChangesTo(charObj, ctx, piece, k);
  if (!changes.length) return null;
  return gearRoleGain(charObj, ctx, changes, isSupport);
}

// CP du jeu de +k niveaux d'affinage (gearCpGain : DPS par l'attaque de base, support par les branches buff / défense)
function honingCpTo(charObj, piece, isSupport, k) {
  if (!(k > 0)) return 0;
  const ctx = gearStatContext(charObj);
  const changes = ctx ? honingChangesTo(charObj, ctx, piece, k) : [];
  const r = changes.length ? gearDpsGain(ctx, changes) : null;
  return r ? gearCpGain(charObj, ctx, r, isSupport) : null;
}

function honingDpsGain(charObj, piece, isSerka, isSupport) {
  const ctx = gearStatContext(charObj);
  if (!ctx) return null;
  const g = ctx.gear;
  const slots = piece === 'weapon' ? ['weapon'] : GEAR_ARMOR_SLOTS;
  const changes = slots.filter(sl => g[sl] >= 0 && g[sl] < 25)
    .map(sl => ({ slot: sl, isSerka: pieceIsSerka(g, sl), lvl: g[sl], adv: gearAdvOf(charObj, g, sl), toLvl: g[sl] + 1, toAdv: gearAdvOf(charObj, g, sl) }));
  if (!changes.length) return null;
  const gain = gearRoleGain(charObj, ctx, changes, isSupport);
  return gain > 0 ? gain : null;
}

/**
 * Gain DPS (%) de l'affinage avancé jusqu'à `toAdv` sur les pièces `slots` (Aegir seulement :
 * +1 iLvl par niveau). null sur le Serka ou si une donnée manque.
 */
function advHoningDpsGain(charObj, slots, isSerka, toAdv, isSupport) {
  if (isSerka) return null;
  const ctx = gearStatContext(charObj);
  if (!ctx) return null;
  const g = ctx.gear;
  // L'avancé ne compte que sur les pièces Aegir (Serka : pas d'iLvl ni de stats)
  const aegir = slots.filter(sl => !pieceIsSerka(g, sl));
  const changes = aegir.filter(sl => g[sl] >= 0 && g[sl] <= 25)
    .map(sl => ({ slot: sl, isSerka: false, lvl: g[sl], adv: gearAdvOf(charObj, g, sl), toLvl: g[sl], toAdv }));
  if (!changes.length || changes.length !== aegir.length) return null;
  const gain = gearRoleGain(charObj, ctx, changes, isSupport);
  return gain > 0 ? gain : null;
}

// Stratégie de souffles d'une étape (getLevelCost) : aucun, à chaque essai ou sur les N premiers ; '' sans recette du jeu
function breathPlanText(lc, isEn) {
  if (!lc || lc.breaths === undefined) return '';
  if (!(lc.breaths > 0)) return isEn ? 'no breath' : 'aucun souffle';
  if (lc.breathAll) return isEn ? `${lc.breaths} breaths every tap` : `${lc.breaths} souffles à chaque essai`;
  return isEn ? `${lc.breaths} breaths on the first ${lc.breathTaps} taps` : `${lc.breaths} souffles sur les ${lc.breathTaps} premiers essais`;
}

// Même chose pour +1 sur plusieurs pièces { l, track } : une stratégie commune, sinon par niveau (« +20 : … · +22 : … »)
function breathPlanOf(piece, levels, isEn) {
  const byText = new Map();
  for (const x of levels) {
    const t = breathPlanText(getLevelCost(piece, x.l, x.track), isEn);
    if (!t) return '';
    if (!byText.has(t)) byText.set(t, new Set());
    byText.get(t).add(x.l);
  }
  if (byText.size <= 1) return [...byText.keys()][0] || '';
  return [...byText].map(([t, ls]) => `${[...ls].sort((a, b) => a - b).map(l => `+${l}`).join(' / ')} : ${t}`).join(' · ');
}

function getLevelCost(piece, lvl, track = 'aegir') {
    if (lvl < 10 || lvl > 24) return { totalValue: 0, rawGold: 0 };
    const recipe = honingT4 && honingT4.tracks[track] && honingT4.tracks[track][piece === 'weapon' ? 'weapon' : 'armor'][lvl];
    if (recipe) {
      const r = recipeStepCost(recipe);
      // Souffles (stratégie retenue) et pity (pire cas, jauge d'artisan pleine) : absents sur l'ancien barème de repli
      return { totalValue: Math.round(r.cost), rawGold: Math.round(r.rawGold), taps: r.taps,
        breaths: r.breaths, breathTaps: r.breathTaps, breathAll: r.breathAll,
        pityValue: Math.round(r.pityCost), pityRawGold: Math.round(r.pityRawGold), pityTaps: r.pityTaps };
    }
    if (track !== 'aegir') return { totalValue: 0, rawGold: 0 };
    
    const isWeapon = piece === 'weapon';
    const costs = isWeapon ? window.T4_WEAPON_COST : window.T4_ARMOR_COST;
    const chances = window.T4_HONING_CHANCES;
    
    if (!costs || !chances) {
       return { totalValue: 50000, rawGold: 50000 };
    }
    
    const avgTaps = getAverageTaps(chances[lvl]);
    
    const destStones = isWeapon ? costs[0][lvl] : 0;
    const guardStones = isWeapon ? 0 : costs[1][lvl];
    const fusion = costs[2][lvl];
    const shards = costs[3][lvl];
    const leaps = costs[4][lvl];
    const rawGold = costs[5][lvl];
    
    const priceDest = state.marketPrices['destiny-destruction-stone'] || 5;
    const priceGuard = state.marketPrices['destiny-guardian-stone'] || 0.58;
    const actualFusionPrice = lvl >= 20 ? (state.marketPrices['abidos-fusion-material'] || 124) : (state.marketPrices['prime-oreha-fusion-material'] || 58);
    const priceLeap = state.marketPrices['destiny-leapstone'] || 16;
    
    const tapCostGold = rawGold +
         destStones * priceDest + 
         guardStones * priceGuard + 
         fusion * actualFusionPrice + 
         leaps * priceLeap;

    return {
       totalValue: Math.round(tapCostGold * avgTaps),
       rawGold: Math.round(rawGold * avgTaps)
    };
}

// --- Affinage avancé T4 (wiki Lost Ark « Advanced Honing ») ---
// Coût d'une tentative, identique sur toute une tranche de 10 niveaux.
// Éclats et argent ignorés (comme pour l'affinage normal) ; Souffle = Lave (arme) ou Glacier (armure).
const ADV_HONING_ATTEMPT = {
  weapon: {
    10: { dest: 180, guard: 0, leap: 5, fusion: 8, gold: 563, breath: 4 },
    20: { dest: 330, guard: 0, leap: 7, fusion: 9, gold: 1250, breath: 6 },
    30: { dest: 1200, guard: 0, leap: 25, fusion: 28, gold: 3000, breath: 20 },
    40: { dest: 1400, guard: 0, leap: 32, fusion: 30, gold: 4000, breath: 24 }
  },
  armor: {
    10: { dest: 0, guard: 150, leap: 4, fusion: 5, gold: 475, breath: 4 },
    20: { dest: 0, guard: 270, leap: 5, fusion: 5, gold: 900, breath: 6 },
    30: { dest: 0, guard: 1000, leap: 18, fusion: 17, gold: 2000, breath: 20 },
    40: { dest: 0, guard: 1200, leap: 23, fusion: 19, gold: 2400, breath: 24 }
  }
};
// Tentatives moyennes [payées, totales] pour k niveaux restants avant la fin de la tranche (k = 1…10).
// Simulation Monte-Carlo (200 000 essais) : 100 XP/niveau, succès 10/20/40 XP à 80/15/5 %
// (souffle complet : 50/30/20 %), Grâce de l'ancêtre toutes les 4 tentatives (effets 1-20 et 21-40),
// Ciseau de Temer = tentative suivante gratuite (le souffle reste consommé).
const ADV_HONING_ATTEMPTS = {
  low: {
    plain: [[5.75, 6.11], [10.21, 11.07], [14.72, 16.08], [19.21, 21.05], [23.72, 26.05], [28.22, 31.06], [32.72, 36.04], [37.23, 41.04], [41.75, 46.05], [46.23, 51.04]],
    breath: [[4.45, 4.69], [7.66, 8.26], [10.85, 11.79], [14.05, 15.34], [17.23, 18.87], [20.43, 22.43], [23.63, 25.97], [26.83, 29.52], [30.02, 33.07], [33.21, 36.6]]
  },
  high: {
    plain: [[5.44, 5.71], [9.57, 10.18], [13.7, 14.65], [17.84, 19.12], [21.99, 23.6], [26.14, 28.1], [30.27, 32.54], [34.43, 37.05], [38.59, 41.54], [42.72, 46.01]],
    breath: [[4.42, 4.6], [7.49, 7.93], [10.56, 11.24], [13.63, 14.57], [16.7, 17.89], [19.78, 21.21], [22.86, 24.55], [25.96, 27.89], [29.01, 31.19], [32.07, 34.5]]
  }
};

/**
 * Coût attendu (gold, prix du marché) pour finir la tranche d'affinage avancé en cours
 * depuis le niveau `fromLvl` (0…39) d'UNE pièce. Retient l'option la moins chère : avec ou sans souffle.
 */
function getAdvHoningCost(piece, fromLvl) {
  const lvl = Math.max(0, Math.floor(fromLvl || 0));
  if (lvl >= 40) return null;
  const rangeEnd = Math.floor(lvl / 10) * 10 + 10;
  const levels = rangeEnd - lvl;
  const isWeapon = piece === 'weapon';
  const a = ADV_HONING_ATTEMPT[isWeapon ? 'weapon' : 'armor'][rangeEnd];
  const mp = state.marketPrices;
  const attemptCost = a.gold +
    a.dest * (mp['destiny-destruction-stone'] || 5) +
    a.guard * (mp['destiny-guardian-stone'] || 0.58) +
    a.leap * (mp['destiny-leapstone'] || 16) +
    a.fusion * (mp['abidos-fusion-material'] || 124);
  const breathCost = a.breath * (mp[isWeapon ? 'lavas-breath' : 'glaciers-breath'] || (isWeapon ? 411 : 398));
  const table = ADV_HONING_ATTEMPTS[rangeEnd <= 20 ? 'low' : 'high'];
  const [plainPaid] = table.plain[levels - 1];
  const [breathPaid, breathTotal] = table.breath[levels - 1];
  const plain = plainPaid * attemptCost;
  const withBreath = breathPaid * attemptCost + breathTotal * breathCost;
  const useBreath = withBreath < plain;
  return {
    from: lvl,
    to: rangeEnd,
    levels,
    useBreath,
    attempts: useBreath ? breathPaid : plainPaid,
    totalValue: Math.round(useBreath ? withBreath : plain),
    rawGold: Math.round((useBreath ? breathPaid : plainPaid) * a.gold)
  };
}

const HONING_SIM_PIECES = ['weapon', 'head', 'shoulder', 'chest', 'pants', 'gloves'];

// Coût attendu de l'affinage avancé d'une pièce de `from` à `to`, tranche par tranche ;
// une tranche entamée vaut son coût jusqu'au bout moins celui qui resterait depuis `to`.
function advHoningCostBetween(slot, from, to) {
  const piece = slot === 'weapon' ? 'weapon' : 'armor';
  let totalValue = 0, rawGold = 0;
  for (let lvl = from; lvl < to;) {
    const c = getAdvHoningCost(piece, lvl);
    if (!c) break;
    if (c.to <= to) { totalValue += c.totalValue; rawGold += c.rawGold; lvl = c.to; continue; }
    const rest = getAdvHoningCost(piece, to);
    totalValue += c.totalValue - (rest ? rest.totalValue : 0);
    rawGold += c.rawGold - (rest ? rest.rawGold : 0);
    break;
  }
  return { totalValue: Math.round(totalValue), rawGold: Math.round(rawGold) };
}
