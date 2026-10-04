// Benchmark aligné sur le GPD, CP des supports, écarts et plan d'achat.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- Benchmark aligné sur le GPD : chaque écart achetable est chiffré par les fonctions de gain du GPD ---
// Gains dans l'unité du GPD (% de dégâts du DPS, ou % de dégâts de chaque allié pour un support),
// toujours évalués sur le profil réel du joueur : « ce que rapporterait d'avoir l'état de la référence ».
// net > 0 : la référence est devant ; net < 0 : le joueur est devant.
// buy / cost : la partie achetable du retard (ce que le plan d'achat propose) et son prix, comme les lignes du GPD.

// Appariement des gemmes : même type d'effet d'abord, meilleures gemmes face aux meilleures ;
// pick(joueur, référence) choisit le niveau retenu (max : rattraper la référence sans rien perdre)
function pairGemLevels(pGems, tGems, pick) {
  const out = pGems.map(g => g.level);
  const freeP = [], freeT = [];
  const byLevel = (a, b) => b.level - a.level;
  ['dmg', 'cd', 'any'].forEach(kind => {
    const ps = pGems.map((g, i) => ({ i, level: g.level, kind: g.kind || 'any' })).filter(g => g.kind === kind).sort(byLevel);
    const ts = tGems.map(g => ({ level: g.level, kind: g.kind || 'any' })).filter(g => g.kind === kind).sort(byLevel);
    const n = Math.min(ps.length, ts.length);
    for (let k = 0; k < n; k++) out[ps[k].i] = pick(ps[k].level, ts[k].level);
    freeP.push(...ps.slice(n));
    freeT.push(...ts.slice(n));
  });
  freeP.sort(byLevel);
  freeT.sort(byLevel);
  for (let k = 0; k < Math.min(freeP.length, freeT.length); k++) out[freeP[k].i] = pick(freeP[k].level, freeT[k].level);
  return out;
}

function benchGemGains(player, target, isSupport) {
  const gemsOf = c => {
    if (!isSupport) return realGems(c);
    const levels = realGemLevels(c);
    return levels ? levels.map(level => ({ level })) : null;
  };
  const pGems = gemsOf(player), tGems = gemsOf(target);
  if (!pGems || !tGems) return null;
  const setGain = levels => (isSupport ? supportGemSetGain(player, levels) : dpsGemSetGain(player, levels));
  const up = pairGemLevels(pGems, tGems, Math.max);
  const both = pairGemLevels(pGems, tGems, (p, t) => t);
  const buy = setGain(up), net = setGain(both);
  if (buy === null || net === null) return null;
  // Coût : chaque gemme relevée, niveau par niveau (mêmes coûts unitaires que le GPD)
  let cost = 0;
  pGems.forEach((g, i) => { for (let l = g.level; l < up[i]; l++) cost += GEM_UPGRADE_COST[l] || 0; });
  return { net, buy, cost };
}

// Coût d'affinage d'une pièce jusqu'au niveau de la référence : recette de sa piste au niveau affiché ;
// Aegir contre Serka : estimation Aegir sur les niveaux effectifs (+9 pour le Serka), comme avant
function benchHoningPieceCost(slot, p, t) {
  const piece = slot === 'weapon' ? 'weapon' : 'armor';
  const sameTrack = honingT4 && p.isSerka === t.isSerka;
  const from = sameTrack ? p.lvl : p.lvl + (p.isSerka ? 9 : 0);
  const to = Math.min(25, sameTrack ? t.lvl : t.lvl + (t.isSerka ? 9 : 0));
  const track = sameTrack && p.isSerka ? 'serka' : 'aegir';
  let total = 0;
  for (let l = Math.floor(from); l < to; l++) total += getLevelCost(piece, l, track).totalValue;
  return total;
}

// Affinage (arme, armures) et affinage avancé : gearDpsGain / supportApGain sur la table itemLevel, pièce par pièce
function benchGearGains(player, target, pSys, tSys, isSupport) {
  const ctx = gearStatContext(player);
  const tg = (target && (target.gear || (target.rawProfile && target.rawProfile.gear))) || null;
  if (!ctx || !tg) return null;
  const slots = ['weapon', ...GEAR_ARMOR_SLOTS];
  const pieceOf = (c, g, sys, sl) => ({
    isSerka: g.serka && typeof g.serka[sl] === 'boolean' ? g.serka[sl]
      : !!(sl === 'weapon' ? sys.weapon && sys.weapon.isSerka : sys.armors && sys.armors.isSerka),
    lvl: g[sl],
    adv: gearAdvOf(c, g, sl)
  });
  const P = {}, T = {};
  for (const sl of slots) {
    P[sl] = pieceOf(player, ctx.gear, pSys, sl);
    T[sl] = pieceOf(target, tg, tSys, sl);
    if (!(P[sl].lvl >= 0) || !(T[sl].lvl >= 0)) return null;
  }
  const change = (sl, to) => ({ slot: sl, isSerka: P[sl].isSerka, lvl: P[sl].lvl, adv: P[sl].adv, toIsSerka: to.isSerka, toLvl: to.lvl, toAdv: to.adv });
  const gain = list => (list.length ? gearRoleGain(player, ctx, list, isSupport) : 0);
  // Rang d'une pièce : piste d'abord (Serka au-dessus de l'Aegir), puis niveau affiché
  const rank = x => (x.isSerka ? 100 : 0) + x.lvl;
  const honingOf = group => {
    const toT = group.map(sl => change(sl, { isSerka: T[sl].isSerka, lvl: T[sl].lvl, adv: P[sl].adv }));
    const behind = group.filter(sl => rank(T[sl]) > rank(P[sl]));
    const net = gain(toT);
    const stat = gearDpsGain(ctx, toT);
    const buy = gain(behind.map(sl => change(sl, { isSerka: T[sl].isSerka, lvl: T[sl].lvl, adv: P[sl].adv })));
    if (net === null || buy === null) return null;
    const cost = behind.reduce((sum, sl) => sum + benchHoningPieceCost(sl, P[sl], T[sl]), 0);
    // dWp / dMs / dVit : écart de puissance d'arme, de stat principale et de Vitalité (CP support : attaque de base et PV du Battle Point)
    return { net, buy, cost, dWp: stat ? stat.dWp : 0, dMs: stat ? stat.dMs : 0, dVit: stat ? stat.dVit : 0 };
  };
  const weapon = honingOf(['weapon']);
  const armors = honingOf(GEAR_ARMOR_SLOTS);
  if (!weapon || !armors) return { weapon, armors, advHoning: null };
  // Affinage avancé : niveaux avancés de la référence sur les pièces du joueur
  // (Aegir des deux côtés seulement : sur le Serka il ne change aucune stat)
  const advSlots = slots.filter(sl => !P[sl].isSerka && !T[sl].isSerka && T[sl].adv !== P[sl].adv);
  const toAdv = sl => change(sl, { isSerka: P[sl].isSerka, lvl: P[sl].lvl, adv: T[sl].adv });
  const advBehind = advSlots.filter(sl => T[sl].adv > P[sl].adv);
  const advNet = gain(advSlots.map(toAdv));
  const advStat = advSlots.length ? gearDpsGain(ctx, advSlots.map(toAdv)) : null;
  const advBuy = gain(advBehind.map(toAdv));
  const advCost = advBehind.reduce((sum, sl) => sum + advHoningCostBetween(sl, P[sl].adv, T[sl].adv).totalValue, 0);
  const advHoning = advNet === null || advBuy === null ? null
    : { net: advNet, buy: advBuy, cost: advCost, dWp: advStat ? advStat.dWp : 0, dMs: advStat ? advStat.dMs : 0, dVit: advStat ? advStat.dVit : 0 };
  return { weapon, armors, advHoning };
}

// Battle Point DPS d'un cœur (table du jeu) ; palier que son rang n'atteint pas : dernier palier chiffré. null hors table
function benchCoreBp(core, points) {
  const tbl = arkGridBp && core && arkGridBp.dps[core.id];
  if (!tbl) return null;
  let v = 0;
  arkGridBp.steps.forEach((st, i) => { if (points >= st && tbl[i] !== null && tbl[i] !== undefined) v = tbl[i]; });
  return v;
}

// Gain signé d'un cœur qui passe de `from` à `to` points, par la même règle que la ligne cœur du GPD
function benchCoreGain(charObj, key, core, from, to, isSupport) {
  if (from === to) return 0;
  const def = ARK_CORE_DEFS.find(d => d.key === key);
  if (core && core.id.toString().startsWith(WEAPON_CORE_PREFIX)) {
    // Rang 4 : plafonné à 14 points
    const cap = p => (Number(core.id.toString().slice(-1)) < 5 ? Math.min(p, 16) : p);
    const g = weaponCoreGain(charObj, { id: core.id, points: cap(from) }, cap(to), isSupport);
    return g === null ? 0 : g;
  }
  if (isSupport) {
    const m = SUPPORT_CORE_STEPS[key];
    const val = p => (p >= 14 ? m.t14 : 0) + (p >= 17 ? m.t17 : 0);
    return val(to) - val(from);
  }
  const bpFrom = benchCoreBp(core, from), bpTo = benchCoreBp(core, to);
  if (bpFrom !== null) return 100 * Math.log((1 + bpTo / 1e4) / (1 + bpFrom / 1e4));
  const pct = p => (p >= 10 ? getArkGridCoreBonus(def.prefix, p, isSupport, false) : 0);
  return ((1 + pct(to) / 100) / (1 + pct(from) / 100) - 1) * 100;
}

// Cœurs de la Grille d'Ark par groupe (Ordre + Chaos) : points du joueur contre points de la référence,
// sur le cœur équipé par le joueur (celui de la référence si le joueur n'en a pas)
function benchCoreGains(player, target, isSupport) {
  const pSlots = getArkGridStatus(player).slots || {};
  const tSlots = getArkGridStatus(target).slots || {};
  // Joueur sans point de cœur (cœurs sans astrogemmes) : écart exact depuis 0, pas l'ancien barème
  // (Hephaestues → Momohammer : 30,4 points de Battle Point réels, 15,8 à l'ancien barème)
  if (!Object.values(tSlots).some(v => v > 0)) return null;
  const pIds = getArkGridCoreIds(player), tIds = getArkGridCoreIds(target);
  const group = (orderKey, chaosKey) => [orderKey, chaosKey].reduce((acc, key) => {
    const from = pSlots[key] || 0, to = tSlots[key] || 0;
    const core = pIds[key] || tIds[key];
    const g = benchCoreGain(player, key, core, from, to, isSupport);
    // DPS : l'écart affiché suit le Battle Point réel des deux cœurs (grade Relique / Ancien compris) ;
    // le plan d'achat ne garde que les points, sur le cœur du joueur (le grade s'obtient en jeu)
    const bpP = pIds[key] ? benchCoreBp(pIds[key], from) : 0, bpT = tIds[key] ? benchCoreBp(tIds[key], to) : 0;
    acc.net += !isSupport && bpP !== null && bpT !== null ? 100 * Math.log((1 + bpT / 1e4) / (1 + bpP / 1e4)) : g;
    // Points de cœur = astrogemmes serties : écart affiché, hors plan d'achat (pas de prix par point)
    return acc;
  }, { net: 0, buy: 0, cost: 0 });
  return {
    arkGridSun: group('orderSun', 'chaosSun'),
    arkGridMoon: group('orderMoon', 'chaosMoon'),
    arkGridStar: group('orderStar', 'chaosStar')
  };
}

// Prix d'un bijou de la même gamme que celui de la référence (2 lignes principales du rôle)
function accessoryPackagePrice(lines, kind, isSupport) {
  const [m1, m2] = ACC_MAIN_LINES[isSupport ? 'support' : 'dps'][kind];
  const tierOf = key => {
    const amt = (lines.find(l => l.key === key) || {}).amount || 0;
    return ACC_LINE_TIERS[key].reduce((t, v, i) => (amt >= v - 1e-6 ? i : t), -1);
  };
  const need = [tierOf(m1), tierOf(m2)].sort((a, b) => b - a);
  const fits = ACC_PACKAGES.filter(pk => {
    const has = pk.tiers.slice().sort((a, b) => b - a);
    return has[0] >= need[0] && has[1] >= need[1] && pk.price[kind] > 0;
  });
  return fits.length ? Math.min(...fits.map(pk => pk.price[kind])) : 0;
}

// Bijoux : lignes valorisées avec les pentes Arsonistic (comme la ligne bijou du GPD), bijou par bijou
// (les deux boucles et les deux anneaux appariés du meilleur au meilleur)
function benchAccessoryGains(player, target, isSupport, isEn) {
  const pl = evaluateCharacterAccessories(player, isSupport, isEn).slotLines;
  const tl = evaluateCharacterAccessories(target, isSupport, isEn).slotLines;
  if (!pl || !tl) return null;
  const val = lines => computeAccessoryLinesBonus(lines || [], isSupport);
  const upSet = [], bothSet = [];
  let cost = 0;
  [['neck'], ['ear1', 'ear2'], ['finger1', 'finger2']].forEach(group => {
    const kind = accessoryKind(group[0]);
    const ps = group.map(s => pl[s] || []).sort((a, b) => val(b) - val(a));
    const ts = group.map(s => tl[s] || []).sort((a, b) => val(b) - val(a));
    ps.forEach((lines, k) => {
      const tLines = ts[k] || [];
      bothSet.push(...tLines);
      if (val(tLines) > val(lines) + 1e-9) {
        upSet.push(...tLines);
        cost += accessoryPackagePrice(tLines, kind, isSupport);
      } else upSet.push(...lines);
    });
  });
  const cur = val(ACC_SLOTS.flatMap(s => pl[s] || []));
  const rel = next => 100 * Math.log((1 + val(next) / 100) / (1 + cur / 100));
  return { net: rel(bothSet), buy: rel(upSet), cost };
}

// Livres de gravure reliques (DPS, comme le GPD) : livres manquants pour lire autant que la référence
// sur chaque gravure du joueur (jusqu'au niveau 4 si la référence ne la porte pas)
function benchRelicBookGains(player, target) {
  const engrOf = c => {
    const raw = (c && c.rawProfile) || c || {};
    return raw.engravings || (raw.loadout && raw.loadout.engravings) || [];
  };
  const targetRead = {};
  engrOf(target).forEach(e => { const r = relicBooksRead(e); if (r !== null) targetRead[e.id] = r; });
  let buy = 0, cost = 0;
  const otherAp = otherAttackPowerPct(player);
  engrOf(player).forEach(e => {
    const read = relicBooksRead(e);
    if (read === null) return;
    const key = (BIBLE_ENGRAVINGS[String(e.id)] || '').split(' (')[0].toLowerCase();
    const eff = window.RELIC_BOOK_EFFECTS && window.RELIC_BOOK_EFFECTS[key];
    const price = state.marketPrices[relicBookSlug(key)];
    const goal = e.id in targetRead ? targetRead[e.id] : RELIC_MAX_BOOKS;
    if (!eff || !(price > 0) || goal <= read) return;
    const lvl = Math.floor(read / RELIC_BOOKS_PER_LEVEL), goalLvl = Math.floor(goal / RELIC_BOOKS_PER_LEVEL);
    // 100 × ln : les gains des gravures s'additionnent
    buy += engravingBonusGain(eff.kind, eff.base, lvl > 0 ? eff.relic[lvl - 1] : 0, goalLvl > 0 ? eff.relic[goalLvl - 1] : 0, otherAp);
    cost += (goal - read) * price;
  });
  return { buy, cost: Math.round(cost) };
}

/**
 * Écarts du Benchmark chiffrés comme le GPD, par clé de système (weapon, armors, advHoning, gems,
 * arkGridSun/Moon/Star, accessories, engravings). Une clé absente garde l'ancien barème bonusPct
 * (profil sans données détaillées, ou système hors GPD : bracelet, astrogemmes, Ark Passive, Karma…).
 */
function benchmarkGpdGains(player, target, pSys, tSys, isSupport, isEn) {
  const out = {};
  const gear = benchGearGains(player, target, pSys, tSys, isSupport);
  if (gear) ['weapon', 'armors', 'advHoning'].forEach(k => { if (gear[k]) out[k] = gear[k]; });
  // Qualité d'arme (DPS) : ligne à part, même gain que la ligne du GPD ; coût pour tirer au moins la qualité
  // de la référence = 800 or ÷ chance par essai. Rien pour un support (ni buff, ni CP).
  if (!isSupport) {
    const pq = weaponQualityOf(player), tq = weaponQualityOf(target);
    const net = pq !== null && tq !== null ? weaponQualityGain(pq, tq) : null;
    if (net !== null) {
      const behind = tq > pq;
      out.weaponQuality = { net, buy: behind ? net : 0, cost: behind ? Math.round(WEAPON_QUALITY_TAP_GOLD / weaponQualityChanceAtLeast(tq)) : 0 };
    }
  }
  const gems = benchGemGains(player, target, isSupport);
  if (gems) out.gems = gems;
  const cores = benchCoreGains(player, target, isSupport);
  if (cores) Object.assign(out, cores);
  const acc = benchAccessoryGains(player, target, isSupport, isEn);
  if (acc) out.accessories = acc;
  // Gravures : l'écart affiché reste celui du Battle Point (pierre et choix de gravures compris) ;
  // seuls les livres reliques entrent au plan d'achat, au gain du GPD (pas de ligne livre pour les supports)
  if (!isSupport) out.engravings = Object.assign({ buyOnly: true }, benchRelicBookGains(player, target));
  // Supports : bracelet et astrogemmes aussi en % de Buff (obtenus en jeu : hors plan d'achat, buy = cost = 0) ;
  // le CP de ces lignes reste lu sur le Battle Point (supportCpGaps)
  if (isSupport) {
    const pb = supportBraceletBuff(player), tb = supportBraceletBuff(target);
    if (pb !== null && tb !== null) out.bracelet = { net: tb - pb, buy: 0, cost: 0 };
    const astro = supportAstroGain(player, target);
    if (astro !== null) out.arkGridAstrogems = { net: astro, buy: 0, cost: 0 };
  }
  return out;
}

// --- CP d'un support, comme le calcule le jeu (Battle Point en mode support, lostark.bible) ---
// CP = branche buff + branche défense. Buff : partie type 1 (PA de base × 1,24) × (1 + v / 10 000) de chaque partie offensive ;
// défense : partie type 2 (PV × 12) × les parties 11, 16, 18, 21, 30, 32, 35 (soins, boucliers…).
// Le % de buff du GPD (modèle Loseii) ne se convertit pas en CP : le Battle Point pèse les lignes support
// environ 5 fois plus, avec un rapport qui change d'une stat à l'autre. Le CP support se lit donc sur les parties du jeu.
const BP_DEF_TYPES = [11, 16, 18, 21, 30, 32, 35];
// Gemme T4 en mode support : 125 × niveau (table battlePoint du jeu, branche 2)
const SUPPORT_GEM_BP_PER_LEVEL = 125;

function battlePointPartsOf(c) {
  const raw = (c && c.rawProfile) || {};
  return (raw.loadout && raw.loadout.battlePoint && raw.loadout.battlePoint.parts) || (raw.battlePoint && raw.battlePoint.parts) || [];
}

function supportBpBranches(c) {
  const parts = battlePointPartsOf(c);
  const t1 = parts.find(p => p.type === 1), t2 = parts.find(p => p.type === 2);
  if (!t1 || !t2 || !(t1.value > 0) || !(t2.value > 0)) return null;
  let A = t1.value / 1e4, D = t2.value / 1e4;
  parts.forEach(p => {
    if (p.type <= 2) return;
    const m = 1 + (p.value || 0) / 1e4;
    if (BP_DEF_TYPES.includes(p.type)) D *= m; else A *= m;
  });
  return { A, D };
}

/**
 * Écart de CP d'un support, par système (> 0 : la référence est devant), sur les branches du joueur :
 * ΔCP = buff × (rapport des parties offensives − 1) + défense × (rapport des parties défensives − 1).
 * Parties réelles des deux profils ; l'équipement (dans l'attaque de base) passe par l'écart de puissance d'arme
 * et de stat principale du GPD (branche buff) et par l'écart de Vitalité des armures (branche défense : PV max
 * proportionnels à la Vitalité, partie type 2 = PV × 12), les gemmes par leur partie et leur % de PA.
 */
/**
 * Attaque de base (partie type 1) de la référence sur celle du joueur, SANS ce que portent déjà les lignes
 * affinage (√(puissance d'arme × stat principale)) et gemmes (% de PA) : reste = stat du bracelet, lignes plates
 * des bijoux, élixirs… null si une donnée manque.
 */
function baseAttackRestRatio(player, target, gpd) {
  const p1 = battlePointPartsOf(player).find(p => p.type === 1), t1 = battlePointPartsOf(target).find(p => p.type === 1);
  const ctx = gearStatContext(player);
  if (!p1 || !t1 || !(p1.value > 0) || !(t1.value > 0) || !ctx || !gpd.weapon || !gpd.armors) return null;
  const dWp = ['weapon', 'armors', 'advHoning'].reduce((sum, k) => sum + ((gpd[k] && gpd[k].dWp) || 0), 0);
  const dMs = ['weapon', 'armors', 'advHoning'].reduce((sum, k) => sum + ((gpd[k] && gpd[k].dMs) || 0), 0);
  const gear = Math.sqrt((ctx.wp + dWp) * (ctx.ms + dMs) / (ctx.wp * ctx.ms));
  const pl = realGemLevels(player), tl = realGemLevels(target);
  const apPool = (p1.attackPowerMultiplier || 0) / 100;
  const gemAp = levels => levels.reduce((sum, l) => sum + GEM_AP_PCT[l], 0) / 100;
  const gems = pl && tl ? (1 + apPool + gemAp(tl) - gemAp(pl)) / (1 + apPool) : 1;
  return (t1.value / p1.value) / (gear * gems);
}

function supportCpGaps(player, target, gpd) {
  const br = supportBpBranches(player);
  const pp = battlePointPartsOf(player), tp = battlePointPartsOf(target);
  if (!br || !tp.length) return null;
  const cp = (mA, mD) => br.A * (mA - 1) + br.D * ((mD === undefined ? 1 : mD) - 1);
  const prod = (parts, pick, def) => parts.filter(p => pick(p) && BP_DEF_TYPES.includes(p.type) === def)
    .reduce((m, p) => m * (1 + (p.value || 0) / 1e4), 1);
  const fromParts = pick => cp(prod(tp, pick, false) / prod(pp, pick, false), prod(tp, pick, true) / prod(pp, pick, true));
  const ofTypes = types => p => types.includes(p.type);
  const cores = prefixes => p => (p.type === 29 || p.type === 30) && prefixes.some(pr => String(p.id).startsWith(pr));
  const out = {
    arkGridSun: fromParts(cores(['67300', '67310'])),
    arkGridMoon: fromParts(cores(['67301', '67311'])),
    arkGridStar: fromParts(cores(['67302', '67312'])),
    arkGridAstrogems: fromParts(ofTypes([31, 32])),
    accessories: fromParts(ofTypes([15, 16, 17])),
    bracelet: fromParts(ofTypes([19, 20, 21])),
    engravings: fromParts(ofTypes([10, 11])),
    combatStats: fromParts(ofTypes([26])),
    arkEvolution: fromParts(ofTypes([5])),
    arkEnlightenment: fromParts(ofTypes([6])),
    arkLeap: fromParts(ofTypes([7])),
    karma: fromParts(ofTypes([8, 9])),
  };
  const rest = baseAttackRestRatio(player, target, gpd);
  if (rest !== null) out.baseAttackStat = cp(rest);
  // Équipement : l'attaque de base suit √(puissance d'arme × stat principale), les PV max suivent la Vitalité
  const ctx = gearStatContext(player);
  const vitRatio = g => (ctx.vit > 0 ? (ctx.vit + (g.dVit || 0)) / ctx.vit : 1);
  const gearCp = g => (ctx && g ? cp(Math.sqrt((ctx.wp + (g.dWp || 0)) * (ctx.ms + (g.dMs || 0)) / (ctx.wp * ctx.ms)), vitRatio(g)) : undefined);
  ['weapon', 'armors', 'advHoning'].forEach(k => { if (gpd[k]) out[k] = gearCp(gpd[k]); });
  if (out.weapon !== undefined) out.weapon += fromParts(ofTypes([4]));
  // Gemmes : partie type 22 (125 × niveau) et % de PA des gemmes dans l'attaque de base
  const pl = realGemLevels(player), tl = realGemLevels(target);
  const apPool = ((pp.find(p => p.type === 1) || {}).attackPowerMultiplier || 0) / 100;
  if (pl && tl) {
    const gemBp = levels => levels.reduce((m, l) => m * (1 + SUPPORT_GEM_BP_PER_LEVEL * l / 1e4), 1);
    const gemAp = levels => levels.reduce((sum, l) => sum + GEM_AP_PCT[l], 0) / 100;
    out.gems = cp(gemBp(tl) / gemBp(pl) * (1 + apPool + gemAp(tl) - gemAp(pl)) / (1 + apPool));
  }
  Object.keys(out).forEach(k => { if (!(Number.isFinite(out[k]))) delete out[k]; });
  return out;
}

/**
 * Écart de CP d'un DPS sur les systèmes hors GPD (> 0 : la référence est devant), lu sur les parties du Battle Point :
 * le CP est le produit des parties (1 + v / 10 000), donc ΔCP = CP × (produit référence ÷ produit joueur − 1).
 * Remplace l'ancien barème (points d'Ark Passive × constante, Karma fixe, sommes de parties). null sans Battle Point.
 */
const DPS_BP_SYSTEMS = {
  arkGridAstrogems: [31, 32],
  bracelet: [19, 20, 21],
  engravings: [10, 11],
  combatStats: [26],
  arkEvolution: [5],
  arkEnlightenment: [6],
  arkLeap: [7],
  karma: [8, 9] // Évolution + Bond
};
function dpsBpGaps(player, target, cpBase) {
  const pp = battlePointPartsOf(player), tp = battlePointPartsOf(target);
  const valid = parts => parts.some(p => p.type === 1 && p.value > 0);
  if (!valid(pp) || !valid(tp)) return null;
  const prod = (parts, types) => parts.filter(p => types.includes(p.type))
    .reduce((m, p) => m * (1 + (Number.isFinite(p.value) ? p.value : 0) / 1e4), 1);
  const out = {};
  Object.entries(DPS_BP_SYSTEMS).forEach(([key, types]) => { out[key] = cpBase * (prod(tp, types) / prod(pp, types) - 1); });
  return out;
}

// Conversion d'un gain du GPD en CP : chaque système est un multiplicateur du Battle Point
function gpdGainToCp(gain, cp) {
  const base = cp && cp > 1000 ? cp : 3800;
  return base * (Math.exp(gain / 100) - 1);
}

function computeDynamicGapsAndPlan(player, target, pSys, tSys, isEn) {
  if (!pSys) pSys = extractPlayerSystems(player, isEn);
  if (!tSys) tSys = resolveTargetSystems(target, isEn);
  const isSupport = player.role === 'support';
  const gaps = [];
  // Écarts achetables chiffrés par les fonctions du GPD (sinon : ancien barème bonusPct)
  const gpd = benchmarkGpdGains(player, target, pSys, tSys, isSupport, isEn);
  // Support : CP lu sur les parties du Battle Point en mode support (le % de buff du GPD ne se convertit pas en CP)
  const supCp = isSupport ? supportCpGaps(player, target, gpd) : null;
  // DPS : la ligne stat principale ne garde que le reste de l'attaque de base (l'affinage et les gemmes ont leur ligne)
  const dpsRest = isSupport ? null : baseAttackRestRatio(player, target, gpd);
  const cpBase = player.cp && player.cp > 1000 ? player.cp : 3800;
  // DPS : systèmes hors GPD (astrogemmes, bracelet, gravures, stats, Ark Passive, Karma) au Battle Point du jeu
  const bpCp = isSupport ? supCp : dpsBpGaps(player, target, cpBase);
  const unit = isSupport ? 'Buff' : 'DPS';
  // Même ratio que le GPD : or par 1 % de dégâts (DPS) ou par 0,01 % de buff (support)
  const ratioUnit = isSupport ? 100 : 1;
  const ratioLabel = isSupport ? (isEn ? '0.01% Buff' : '0,01 % Buff') : (isEn ? '1% DPS' : '1 % DPS');

  // Repli affinage : coût attendu de chaque palier jusqu'au niveau de la référence (1 palier si inconnu)
  const honingPathCost = (piece, fromLvl, toLvl, pieces, track = 'aegir') => {
    const from = Math.floor(fromLvl);
    const to = Math.min(25, toLvl !== undefined && Math.floor(toLvl) > from ? Math.floor(toLvl) : from + 1);
    let total = 0;
    for (let l = from; l < to; l++) total += getLevelCost(piece, l, track).totalValue * pieces;
    return total;
  };
  const honingGapCost = (piece, p, t, lvlKey, effKey, pieces) => {
    if (honingT4 && !!p.isSerka === !!t.isSerka && p[lvlKey] !== undefined) {
      return honingPathCost(piece, p[lvlKey], t[lvlKey], pieces, p.isSerka ? 'serka' : 'aegir');
    }
    return honingPathCost(piece, p[effKey] !== undefined ? p[effKey] : (p[lvlKey] || 12), t[effKey], pieces);
  };

  const systemMeta = [
    { key: 'arkGridSun', title: isEn ? "Ark Grid: Sun Cores (Order & Chaos)" : "Ark Grid : Cœurs Soleil (Ordre & Chaos)", cost: () => 0 }, // points des cœurs = astrogemmes serties : écart affiché, hors plan d'achat
    { key: 'arkGridMoon', title: isEn ? "Ark Grid: Moon Cores (Order & Chaos)" : "Ark Grid : Cœurs Lune (Ordre & Chaos)", cost: () => 0 },
    { key: 'arkGridStar', title: isEn ? "Ark Grid: Star Cores (Order & Chaos)" : "Ark Grid : Cœurs Étoile (Ordre & Chaos)", cost: () => 0 },
    { key: 'arkGridAstrogems', title: isEn ? "Ark Grid: Astrogems (Substats)" : "Ark Grid : Astrogemmes (Sous-stats)", cost: () => 0 }, // obtenues en jeu : écart affiché, hors plan d'achat
    { key: 'accessories', title: isEn ? "T4 Accessory Lines (High Rolls)" : "Lignes d'Accessoires T4 (High Rolls)", cost: () => ACC_UPGRADE_COST_AVG },
    { key: 'weapon', title: isEn ? "T4 Weapon Honing" : "Affinage Arme T4", cost: () => honingGapCost('weapon', pSys.weapon || {}, tSys.weapon || {}, 'wLvl', 'effWLvl', 1) },
    { key: 'weaponQuality', title: isEn ? "Weapon Quality" : "Qualité d'Arme", cost: () => 0 }, // chiffrée par le GPD (DPS) ; sinon hors plan
    { key: 'advHoning', title: isEn ? "T4 Advanced Honing" : "Affinage Avancé T4", cost: () => 0 }, // sans gain du GPD : coût inconnu, hors plan d'achat
    { key: 'bracelet', title: isEn ? "T4 Bracelet Passives (Circularity)" : "Passifs de Bracelet T4 (Circulaire)", cost: () => 0 }, // obtenu en jeu : écart affiché, hors plan d'achat
    { key: 'gems', title: isEn ? "T4 Gems Tier" : "Palier de Gemmes T4", cost: () => computeGemUpgradeCost(player, target) },
    { key: 'armors', title: isEn ? "T4 Armor Honing" : "Affinage Armures T4", cost: () => honingGapCost('armor', pSys.armors || {}, tSys.armors || {}, 'avgArmor', 'effAvgArmor', 5) },
    // Stat principale et stats de combat découlent de l'équipement (bijoux, bracelet, affinage), déjà comptés
    // sur leurs propres lignes : coût 0 = affichées au diagnostic mais exclues du plan d'action.
    { key: 'baseAttackStat', title: isEn ? "Main Stat & Base AP" : "Stat Principale & Attaque de Base", cost: () => 0 },
    { key: 'engravings', title: isEn ? "Engravings & Ability Stone" : "Gravures & Pierre de Naissance", cost: () => relicBooksCostToTarget(player, target) }, // livres au prix du marché ; la pierre vient du jeu
    { key: 'combatStats', title: isEn ? "Combat Stats (Crit / Spec / Swift)" : "Stats de Combat (Crit / Spé / Rapidité)", cost: () => 0 },
    { key: 'arkEnlightenment', title: isEn ? "Ark Passive: Enlightenment (Spec Tree)" : "Ark Passive : Illumination (Arbre Spé)", cost: () => 0 }, // points obtenus en jeu : écart affiché, hors plan d'achat
    { key: 'arkEvolution', title: isEn ? "Ark Passive: Evolution (Net Stats)" : "Ark Passive : Évolution (Stats Nets)", cost: () => 0 },
    { key: 'arkLeap', title: isEn ? "Ark Passive: Leap (Hyper Awakening)" : "Ark Passive : Saut (Hyper Awakening)", cost: () => 0 },
    { key: 'karma', title: isEn ? "T4 Karma (Evolution & Leap)" : "Karma T4 (Évolution & Bond)", cost: () => 0 } // obtenu en jeu
  ];
  const rows = {};

  systemMeta.forEach(m => {
    const p = pSys[m.key] || { bonusPct: 0, label: '' };
    const t = tSys[m.key] || { bonusPct: 0, label: '' };
    const estimated = isEstimatedPair(p, t);
    const g = gpd[m.key];
    // Écart de la ligne : gain du GPD (unité du GPD), sinon écart de bonusPct converti en CP.
    // Support : le CP vient des parties du Battle Point ; l'écart en % reste le buff du GPD, ou la part du CP (unité « CP »)
    let delta, gapCp, fromGpd = false, rowUnit = null;
    const sCp = bpCp && !estimated ? bpCp[m.key] : undefined;
    if (estimated) {
      delta = 0; gapCp = 0;
    } else if (g && !g.buyOnly) {
      delta = Number(g.net.toFixed(2)); gapCp = sCp !== undefined ? sCp : gpdGainToCp(g.net, player.cp); fromGpd = true; rowUnit = unit;
    } else if (sCp !== undefined) {
      gapCp = sCp; delta = Number((100 * sCp / cpBase).toFixed(2)); rowUnit = 'CP';
    } else if (m.key === 'baseAttackStat' && dpsRest !== null) {
      gapCp = cpBase * (dpsRest - 1); delta = Number((100 * (dpsRest - 1)).toFixed(2)); rowUnit = 'CP';
    } else {
      delta = Number((t.bonusPct - p.bonusPct).toFixed(2)); gapCp = delta === 0 ? 0 : systemGapCp(p.bonusPct, t.bonusPct, player.cp);
    }
    // Partie achetable : celle du GPD quand elle existe (seulement ce qui manque, au coût du GPD)
    // Hors GPD : seulement ce qui manque (jamais négatif quand le joueur est en avance)
    const buy = estimated ? 0 : (g ? g.buy : Math.max(0, delta));
    const cost = g ? g.cost : m.cost();
    rows[m.key] = { delta, gapCp, fromGpd, unit: rowUnit, buy, cost };
    // Support : cartes classées sur le CP du jeu (retard si la référence gagne plus de 0,05 % du CP, avance au-delà de 0,15 %)
    const behind = supCp && rowUnit ? gapCp > 0.0005 * cpBase : delta > 0.05;
    const ahead = supCp && rowUnit ? gapCp < -0.0015 * cpBase : delta < -0.15;

    let tLabel = t.label || '';
    let pLabel = p.label || '';
    if (isEn) {
      tLabel = formatLostArkEnglish(tLabel);
      pLabel = formatLostArkEnglish(pLabel);
    } else {
      tLabel = formatLostArkFrench(tLabel);
      pLabel = formatLostArkFrench(pLabel);
    }
    // Partie achetable différente de l'écart total (pièces en avance et en retard) : on l'indique
    const partText = fromGpd && buy > 0.05 && Math.abs(buy - delta) > 0.05
      ? (isEn ? `; behind pieces: +${buy.toFixed(2)}% ${unit}` : ` ; pièces en retard : +${buy.toFixed(2)} % ${unit}`)
      : '';
    const signed = v => `${v >= 0 ? '+' : ''}${v}`;
    const gapText = fromGpd && supCp
      ? (isEn ? `${signed(Math.round(gapCp))} CP from the game's Battle Point; ${signed(delta)}% raid Buff, GPD model${partText}`
        : `${signed(Math.round(gapCp))} CP au Battle Point du jeu ; ${signed(delta)} % de Buff pour le raid, modèle du GPD${partText}`)
      : fromGpd
      ? (isEn ? `+${delta}% ${unit}, GPD model${partText}` : `+${delta} % ${unit}, modèle du GPD${partText}`)
      : rowUnit === 'CP'
        ? (isEn ? `+${Math.round(gapCp)} CP from the game's Battle Point` : `+${Math.round(gapCp)} CP au Battle Point du jeu`)
        : (isEn ? `+${delta}% gap` : `écart de +${delta}%`);

    if (behind) {
      const gainCp = Math.round(gapCp);
      gaps.push({
        icon: '',
        key: m.key,
        title: m.title,
        gainCp: gainCp,
        gainPct: delta,
        fromGpd,
        buyFromGpd: !!g,
        buyPct: buy,
        desc: isEn
          ? `${tLabel} on benchmark vs ${pLabel} on your character (${gapText}).`
          : `${tLabel} chez la référence contre ${pLabel} chez vous (${gapText}).`,
        cost,
        priority: delta > 1.0 ? 'high' : 'med'
      });
    } else if (ahead) {
      const gainCp = Math.round(-gapCp);
      gaps.push({
        icon: '',
        key: m.key,
        title: `${m.title} ${isEn ? '(Player Advantage)' : '(Avantage Joueur)'}`,
        gainCp: gainCp,
        gainPct: delta,
        fromGpd,
        desc: isEn
          ? `Your advantage: ${pLabel} vs ${tLabel} on benchmark (+${gainCp} CP in your favor!).`
          : `Votre avantage : ${pLabel} contre ${tLabel} chez la référence (+${gainCp} CP en votre faveur !).`,
        cost: 0,
        priority: 'player_lead'
      });
    }
    // Gravures : pas d'écart au Battle Point mais des livres reliques qui manquent encore
    if (g && g.buyOnly && !behind && g.buy > 0.05 && g.cost > 0) {
      gaps.push({
        icon: '', key: m.key, title: m.title, gainCp: Math.round(gpdGainToCp(g.buy, player.cp)), gainPct: Number(g.buy.toFixed(2)),
        fromGpd: true, buyFromGpd: true, buyPct: g.buy, cost: g.cost, priority: 'med',
        desc: isEn ? `Relic books still missing to match the reference (+${g.buy.toFixed(2)}% ${unit}, GPD model).`
          : `Livres reliques qui manquent pour lire autant que la référence (+${g.buy.toFixed(2)} % ${unit}, modèle du GPD).`
      });
    }
  });

  gaps.sort((a, b) => {
    if (a.gainCp > 0 && a.priority !== 'player_lead' && (b.gainCp <= 0 || b.priority === 'player_lead')) return -1;
    if (b.gainCp > 0 && b.priority !== 'player_lead' && (a.gainCp <= 0 || a.priority === 'player_lead')) return 1;
    if (a.gainCp > 0 && b.gainCp > 0 && a.priority !== 'player_lead' && b.priority !== 'player_lead') return b.gainCp - a.gainCp;
    if (a.priority === 'player_lead' && b.priority !== 'player_lead') return -1;
    if (b.priority === 'player_lead' && a.priority !== 'player_lead') return 1;
    return 0;
  });

  // Plan d'achat : partie achetable de chaque retard, classée comme le GPD (or par unité de gain).
  // Un système où le joueur est devant au total peut garder des pièces en retard (ex. 2 armures sur 5) : elles restent au plan.
  const planGaps = gaps.filter(g => g.priority !== 'player_lead');
  systemMeta.forEach(m => {
    const r = rows[m.key];
    if (!gpd[m.key] || !(r.buy > 0.05) || !(r.cost > 0) || planGaps.some(g => g.key === m.key)) return;
    planGaps.push({
      key: m.key, title: m.title, fromGpd: true, buyFromGpd: true, buyPct: r.buy, cost: r.cost,
      desc: isEn
        ? `You are ahead on this system overall, but the reference is ahead on part of it (+${r.buy.toFixed(2)}% ${unit} to catch up there, GPD model).`
        : `Vous êtes devant sur l'ensemble de ce système, mais la référence est devant sur une partie (+${r.buy.toFixed(2)} % ${unit} à rattraper, modèle du GPD).`
    });
  });
  // Système sans données détaillées (ancien barème) : son écart en CP est ramené à la même unité (% du CP)
  const planItems = planGaps
    .filter(g => g.cost > 0 && g.buyPct > 0.01)
    .map(g => {
      const pct = g.buyFromGpd ? g.buyPct : 100 * Math.log(1 + systemGapCp(0, g.buyPct, player.cp) / cpBase);
      return { g, pct, ratio: g.cost / (pct * ratioUnit) };
    })
    .sort((a, b) => a.ratio - b.ratio);

  const plan = planItems.slice(0, 5).map(({ g, pct, ratio }, idx) => {
    const buyCp = gpdGainToCp(pct, player.cp);
    const estimate = g.buyFromGpd ? '' : (isEn ? ', estimate' : ', estimation');
    return {
      step: idx + 1,
      title: g.title,
      desc: g.desc,
      cost: formatNumber(g.cost) + ' g',
      gain: `+${pct.toFixed(2)}% ${unit}${isSupport ? '' : ` (+${formatNumber(Math.round(buyCp))} CP${estimate})`}${isSupport && estimate ? ` (${estimate.slice(2)})` : ''}`,
      roi: `${formatNumber(Math.round(ratio))} g / ${ratioLabel}`
    };
  });

  return { gaps, plan, rows };
}
// Répertoire de profils LIVE vérifiés en temps réel sur lostark.bible pour l'ensemble des 26 classes du jeu
// 100% profils réels en direct de lostark.bible, zéro preset statique, zéro profil générique ou synthétique


function getAvailableBenchmarks(playerChar) {
  if (!playerChar) return [];
  const pClass = normalizeClassName(playerChar.className || playerChar.characterClass || playerChar.class || '').toLowerCase();
  const isSupportClass = ['paladin', 'bard', 'artist', 'valkyrie'].some(s => pClass.includes(s));
  const pRole = playerChar.role || (isSupportClass ? 'support' : 'dps');
  const pName = (playerChar.name || playerChar.id || '').toLowerCase().trim();
  const list = [];

  // 1. Profils RÉELS LIVE recherchés et auto-chargés depuis lostark.bible (MÊME CLASSE ET MÊME RÔLE STRICTEMENT, SANS LE JOUEUR LUI-MÊME)
  const searchedList = benchmarkState.searchedTargets || [];
  searchedList.forEach(s => {
    const sName = (s.name || s.id || '').toLowerCase().trim();
    if (sName === pName) return;
    const sClass = normalizeClassName(s.className || s.characterClass || s.class || '').toLowerCase();
    const sRole = s.role || (isSupportClass ? (isSupportSpecName(s.spec) ? 'support' : 'dps') : 'dps');
    if (s && s.isLive && sClass === pClass && sRole === pRole) {
      list.push(s);
    }
  });

  // Références : uniquement des joueurs réels chargés en direct depuis lostark.bible
  // (ni personnages du roster ou de démo, ni profil généré)
  return list;
}

function findOptimalBenchmark(playerChar) {
  if (!playerChar) return null;
  const avail = getAvailableBenchmarks(playerChar);
  if (!avail || avail.length === 0) return null;

  const pIlvl = playerChar.ilvl || 1740;
  const pCp = playerChar.cp || playerChar.combatPower || 3500;
  const pSpec = specKey(getCharacterSpecName(playerChar));
  const pClass = normalizeClassName(playerChar.className || playerChar.characterClass || playerChar.class || '').toLowerCase();
  const isSupportClass = ['paladin', 'bard', 'artist', 'valkyrie'].some(s => pClass.includes(s));
  const pRole = playerChar.role || (isSupportClass ? 'support' : 'dps');

  // Filtre strict : même classe et même rôle obligatoires (zéro comparaison Support vs DPS !)
  const sameClass = avail.filter(b => {
    const bClass = normalizeClassName(b.className || b.characterClass || b.class || '').toLowerCase();
    if (bClass !== pClass) return false;
    const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
    return bRole === pRole;
  });
  if (sameClass.length === 0) return null;

  // 1. Cherche en priorité un profil LIVE réel de même spé avec CP >= pCp ET iLvl proche (écart <= 15 iLvl)
  const closeSameSpecLive = sameClass.filter(b => b.isLive && specKey(b.spec) === pSpec && b.cp >= pCp && Math.abs(b.ilvl - pIlvl) <= 15.0);
  if (closeSameSpecLive.length > 0) {
    closeSameSpecLive.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
    return closeSameSpecLive[0];
  }

  // 2. Cherche un profil LIVE réel de même spé avec CP >= pCp (écart <= 30 iLvl)
  const anySameSpecLive = sameClass.filter(b => b.isLive && specKey(b.spec) === pSpec && b.cp >= pCp && Math.abs(b.ilvl - pIlvl) <= 30.0);
  if (anySameSpecLive.length > 0) {
    anySameSpecLive.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
    return anySameSpecLive[0];
  }

  // 3. Cherche un profil LIVE réel de la même classe et rôle avec CP >= pCp ET iLvl proche (écart <= 20 iLvl)
  const closeClassLiveHigher = sameClass.filter(b => b.isLive && b.cp >= pCp && Math.abs(b.ilvl - pIlvl) <= 20.0);
  if (closeClassLiveHigher.length > 0) {
    closeClassLiveHigher.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
    return closeClassLiveHigher[0];
  }

  // 4. Cherche un profil LIVE de même classe et rôle avec CP >= pCp
  const anyClassLiveHigher = sameClass.filter(b => b.isLive && b.cp >= pCp);
  if (anyClassLiveHigher.length > 0) {
    anyClassLiveHigher.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
    return anyClassLiveHigher[0];
  }

  // 5. PRIORITÉ ABSOLUE AUX VRAIS JOUEURS : tout profil LIVE réel même classe et rôle le plus proche en iLvl
  const anyLive = sameClass.filter(b => b.isLive);
  if (anyLive.length > 0) {
    anyLive.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
    return anyLive[0];
  }

  // Aucun joueur réel disponible : pas de référence (l'onglet invite à rechercher un joueur)
  return null;
}

function convertCharToBenchmarkFormat(c, isEn) {
  if (!c) return null;
  const normClass = normalizeClassName(c.className || '') || 'Breaker';
  const isSupp = c.role === 'support' || (c.role !== 'dps' && ['paladin', 'bard', 'artist', 'valkyrie'].some(s => normClass.toLowerCase().includes(s)));
  const systems = extractPlayerSystems(c, isEn);
  return {
    id: `roster_${(c.id || c.name || 'char').toLowerCase()}`,
    name: c.name,
    className: normClass,
    spec: getCharacterSpecName(c),
    role: isSupp ? 'support' : 'dps',
    ilvl: Number((c.ilvl || 1700).toFixed(2)),
    cp: Math.round(c.cp || 4000),
    server: c.server || 'Elpon (CE)',
    guild: c.guild || 'Roster',
    rosterLevel: c.rosterLevel || 300,
    avatarUrl: getCharacterFaceAvatar(c),
    bibleUrl: `https://lostark.bible/character/CE/${encodeURIComponent(c.name)}`,
    isLive: false,
    gemTier: (c.gemParts && c.gemParts.some(g => g >= (isSupp ? 11.0 : 6.4))) ? 'gem9' : 'gem8',
    gemDesc: getCharacterGemSummary(c, isEn),
    systems: systems,
    accessories: c.accessories || (c.rawProfile && c.rawProfile.accessories) || (c.rawProfile && c.rawProfile.loadout && c.rawProfile.loadout.items && c.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot))) || [],
    bracelet: c.bracelet || (c.rawProfile && c.rawProfile.bracelet) || (c.rawProfile && c.rawProfile.loadout && c.rawProfile.loadout.items && c.rawProfile.loadout.items.find(i => i.slot === 'bracelet')) || (c.loadout && c.loadout.items && c.loadout.items.find(i => i.slot === 'bracelet')) || null,
    rawProfile: c.rawProfile,
    loadout: c.loadout || (c.rawProfile && c.rawProfile.loadout) || null
  };
}
