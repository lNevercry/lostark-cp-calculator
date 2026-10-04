// Modèles de gain : stats d'équipement, gemmes DPS, modèle support de Loseii, CP par branche.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// Pièce Serka ou Aegir : type lu pièce par pièce sur le profil (gear.serka), sinon le type majoritaire
// (anciens rosters). Un set d'armures peut être mixte (ex. 3 Serka + 2 Aegir).
function pieceIsSerka(gear, slot) {
  if (gear && gear.serka && typeof gear.serka[slot] === 'boolean') return gear.serka[slot];
  return !!(gear && (slot === 'weapon' ? gear.isSerkaWeapon : gear.isSerkaArmors));
}

// Étape d'affinage à chiffrer pour une pièce : recette Serka au niveau affiché quand elle est chargée,
// sinon (repli) Serka estimé comme de l'Aegir au niveau effectif (+9). null au-delà de +25.
function honingStepFor(piece, isSerka, lvl, effLvl) {
  const track = isSerka ? 'serka' : 'aegir';
  if (!isSerka || (honingT4 && honingT4.tracks[track])) return lvl < 25 ? { track, lvl } : null;
  const e = effLvl !== undefined ? effLvl : lvl + 9;
  return e < 25 ? { track: 'aegir', lvl: e } : null;
}

const GEAR_ARMOR_SLOTS = ['head', 'chest', 'pants', 'gloves', 'shoulder'];

// Stat de base d'une pièce d'après la table itemLevel du jeu : iLvl = base + 5 × affinage,
// + 1 iLvl par niveau d'affinage avancé sur l'Aegir (table iLvl par iLvl). Sur le Serka l'avancé ne bouge pas l'iLvl.
// key : 'mainStat' (défaut) ou 'vitality' pour une armure ; l'arme donne toujours sa puissance d'arme.
function gearPieceStat(tr, slot, lvl, adv, key = 'mainStat') {
  const by = tr.stats.byIlvl;
  const src = by || tr.stats;
  const arr = slot === 'weapon' ? src.weaponPower : src[key] && src[key][slot];
  const v = arr && arr[by ? 5 * lvl + (adv || 0) : lvl];
  return v > 0 ? v : null;
}

// Niveau d'affinage avancé d'une pièce (0 à 40) ; anciens profils : valeur globale
function gearAdvOf(charObj, gear, slot) {
  const v = gear.adv && gear.adv[slot] !== undefined ? gear.adv[slot] : charObj && charObj.advHoning;
  return v >= 0 ? Math.min(40, v) : 0;
}

/**
 * Totaux du personnage réel pour le modèle loseii / bebkok : puissance d'arme (stat 151) et stat principale,
 * lus sur le profil raid lostark.bible, et amplification de la puissance d'arme d'une pièce
 * (% des boucles d'oreilles + Karma Illumination). null si une donnée manque.
 */
function gearStatContext(charObj) {
  if (!honingT4) return null;
  const raw = (charObj && charObj.rawProfile) || {};
  const lo = raw.loadout || {};
  const gear = (charObj && charObj.gear) || raw.gear;
  if (!gear || !Array.isArray(lo.stats)) return null;
  const stat = t => (lo.stats.find(s => s.type === t) || {}).value || 0;
  const wp = stat(151);
  const ms = Math.max(stat(3), stat(4), stat(5));
  if (!(wp > 0) || !(ms > 0)) return null;
  const parts = (lo.battlePoint && lo.battlePoint.parts) || (raw.battlePoint && raw.battlePoint.parts) || [];
  const earringPct = parts.filter(p => p.stat && p.stat.index === 152).reduce((s, p) => s + (p.stat.value || 0) / 100, 0);
  const karmaPct = ((lo.karma && lo.karma.enlightenment) || 0) * 0.1;
  // % du cœur Chaos Étoile « Arme » : même amplification que les boucles et le Karma
  const wc = getArkGridCoreIds(charObj).chaosStar;
  const wcb = wc && wc.id.toString().startsWith(WEAPON_CORE_PREFIX) ? weaponCoreBonus(wc.id, wc.points) : null;
  const corePct = wcb ? wcb.pct : 0;
  // Vitalité (stat 6) : les PV max suivent la Vitalité (branche défense du CP support)
  return { wp, ms, vit: stat(6), wpAmp: 1 + (earringPct + karmaPct + corePct) / 100, msMult: armorMainStatMult(charObj, gear, stat, ms), gear };
}

/**
 * Multiplicateur appliqué à la stat principale des armures (avatars, ranch du familier…), mesuré sur le profil :
 * les deux autres stats (Force / Dextérité / Intelligence) viennent des mêmes sources que la principale (bijoux…)
 * sauf les armures, donc (principale − autre) ÷ stats de base des armures (table itemLevel). Mesuré sur 70 profils :
 * 1,035 à 1,111, 1,10 pour la moitié (avatars complets). 1 si une donnée manque ou sort de [1 ; 1,2].
 */
function armorMainStatMult(charObj, gear, stat, ms) {
  const others = [3, 4, 5].map(stat).filter(v => v !== ms);
  if (others.length !== 2) return 1;
  let base = 0;
  for (const slot of GEAR_ARMOR_SLOTS) {
    const isSerka = pieceIsSerka(gear, slot);
    const tr = honingT4.tracks[isSerka ? 'serka' : 'aegir'];
    const v = tr && tr.stats && gear[slot] >= 0 ? gearPieceStat(tr, slot, gear[slot], isSerka ? 0 : gearAdvOf(charObj, gear, slot)) : null;
    if (v === null) return 1;
    base += v;
  }
  const m = (ms - Math.max(...others)) / base;
  return m >= 1 && m <= 1.2 ? m : 1;
}

/**
 * Gain DPS (%) d'un ensemble de changements de pièces sur le personnage réel (modèle loseii / bebkok) :
 * PA de base = √(puissance d'arme × stat principale / 6), les dégâts suivent la PA, donc
 * gain = 50 × ln(1 + Δpuissance d'arme / total) + 50 × ln(1 + Δstat principale / total).
 * changes : [{ slot, isSerka, lvl, adv, toLvl, toAdv, toIsSerka? }]. Les écarts viennent de la table itemLevel (Maxroll).
 * Renvoie { gain, dWp, dMs, dVit } (dVit : Vitalité des armures, 0 si la table ne l'a pas) ou null si une donnée manque : l'appelant garde son estimation.
 */
function gearDpsGain(ctx, changes) {
  if (!ctx) return null;
  let dWp = 0, dMs = 0, dVit = 0;
  for (const c of changes) {
    // toIsSerka : pièce d'arrivée sur une autre piste (ex. Aegir du joueur contre Serka de la référence)
    const toSerka = c.toIsSerka !== undefined ? !!c.toIsSerka : !!c.isSerka;
    const tr = honingT4.tracks[c.isSerka ? 'serka' : 'aegir'];
    const trTo = honingT4.tracks[toSerka ? 'serka' : 'aegir'];
    if (!tr || !tr.stats || !trTo || !trTo.stats || !(c.lvl >= 0 && c.toLvl >= 0 && c.toLvl <= 25)) return null;
    // Serka : l'affinage avancé ne change pas l'iLvl, ni donc les stats de base
    const adv = c.isSerka ? 0 : c.adv, toAdv = toSerka ? 0 : c.toAdv;
    const from = gearPieceStat(tr, c.slot, c.lvl, adv);
    const to = gearPieceStat(trTo, c.slot, c.toLvl, toAdv);
    if (from === null || to === null) return null;
    if (c.slot === 'weapon') dWp += (to - from) * ctx.wpAmp;
    else {
      dMs += (to - from) * (ctx.msMult || 1);
      const vFrom = gearPieceStat(tr, c.slot, c.lvl, adv, 'vitality'), vTo = gearPieceStat(trTo, c.slot, c.toLvl, toAdv, 'vitality');
      if (vFrom !== null && vTo !== null) dVit += vTo - vFrom;
    }
  }
  return { gain: 50 * Math.log(1 + dWp / ctx.wp) + 50 * Math.log(1 + dMs / ctx.ms), dWp, dMs, dVit };
}

// Modèle support de Loseii (loastuff/loa-gpd, model/support.js et model/gems.js) :
// Q = 100 × ln(ap × marque × identité), en % de dégâts de CHAQUE allié.
// Le support buffé est leur Barde de référence (gemmes niv. 9) ; les écarts du vrai personnage
// (PA, % de PA, lignes de bijoux, niveau moyen des gemmes) sont appliqués par-dessus.
const SUPPORT_MODEL = {
  share: 0.22,             // part de sa PA de base que le support donne à un allié
  upAp: 0.95, upBrand: 1, upSeren: 0.7, upChord: 0.7, upTskill: 0.4,
  allyAtkEnh: 68.55,       // % à gemmes niv. 9 (absentes du profil lostark.bible) ; les bijoux s'y ajoutent
  allyDmg: 38.26,
  allyDmgT: 9.26,
  brandPower: 45,
  spec: 1016,
  classCoeff: 0.0005005722461,
  baseAdd: 0.3585,
  dpsWP: 260918,           // DPS buffé : 241 367 d'arme × (1 + 6 % boucles + 2,1 % karma)
  dpsMS: 767170,
  dpsAtkPct: 0.2948,
  dpsFlatAtk: 3600,
  // Gemmes : +1 point de chaque buff par niveau du set, recharge convertie en Spécialisation
  gemRefLevel: 9,
  gemBuffPerLevel: 1,
  swiftAtTen: 1400,
  cdrPerSwift: 15 / 699,
  gemCdrAtTen: 0.24,
  cdrPerGemLevel: 0.02
};
// % de PA de base d'UNE gemme T4 par niveau (effet stat 150 des profils lostark.bible, en 0,01 %)
const GEM_AP_BY_VALUE = { 45: 6, 60: 7, 80: 8, 100: 9, 120: 10 };
const GEM_AP_PCT = { 6: 0.45, 7: 0.60, 8: 0.80, 9: 1.00, 10: 1.20 };

// Niveaux des gemmes T4 du profil (effet PA de base, stat 150). Une gemme T3 (sans PA, ID 6502…) est ignorée :
// elle ne s'améliore pas en T4 ; avant, une seule T3 faisait retomber tout le set sur l'ancien barème.
// null si aucune gemme T4 n'est reconnue.
function realGemLevels(charObj) {
  const raw = (charObj && charObj.rawProfile) || {};
  const gems = (raw.loadout && raw.loadout.gems) || [];
  const levels = gems.map(g => {
    const ap = (g.effects || []).find(e => e.type === 2 && e.id === 150);
    return ap ? GEM_AP_BY_VALUE[ap.value] : undefined;
  }).filter(Boolean);
  return levels.length ? levels : null;
}

// Gemmes du profil avec leur effet de compétence, en % : dégâts (type 5) ou recharge (type 27).
// Types 34 et 35 (effets 170 0xx, lus sur des profils lostark.bible) : mêmes valeurs que 5 et 27 (40 % / 22 % au niv. 9)
function realGems(charObj) {
  const raw = (charObj && charObj.rawProfile) || {};
  const gems = (raw.loadout && raw.loadout.gems) || [];
  const out = gems.map(g => {
    const ap = (g.effects || []).find(e => e.type === 2 && e.id === 150);
    const sk = (g.effects || []).find(e => [5, 34, 27, 35].includes(e.type));
    const level = ap ? GEM_AP_BY_VALUE[ap.value] : undefined;
    return level && sk ? { level, kind: sk.type === 27 || sk.type === 35 ? 'cd' : 'dmg', pct: sk.value / 100 } : null;
  }).filter(Boolean);
  // Mêmes gemmes que realGemLevels (T4 seulement), dans le même ordre
  return out.length ? out : null;
}

// Part des dégâts d'un DPS portée par des compétences à recharge (Loseii, lignes gemmes DPS)
const GEM_CD_DAMAGE_SHARE = 0.7;
// Effet de compétence gagné par niveau de gemme T4 : +4 points de dégâts, +2 points de réduction de recharge
const GEM_STEP = { dmg: 4, cd: 2 };

/**
 * Gain DPS (%) quand les gemmes du profil passent aux niveaux `toLevels` (même ordre que realGems).
 * Trois effets, d'après les vraies gemmes du profil :
 *  - dégâts : moyenne des (1 + dégâts) des gemmes de dégâts (chaque compétence gemmée porte une part égale des dégâts) ;
 *  - recharge : les compétences sont lancées plus souvent, moyenne des 1 / (1 − recharge), sur 70 % des dégâts ;
 *  - PA de base : % de PA de chaque gemme, sur le multiplicateur de PA réel du Battle Point.
 * Renvoie 100 × ln(produit), même échelle que l'affinage (négatif si des gemmes baissent). null si le profil manque de données.
 */
function dpsGemSetGain(charObj, toLevels) {
  const gems = realGems(charObj);
  if (!gems || !toLevels || toLevels.length !== gems.length || toLevels.some(l => !(GEM_AP_PCT[l] > 0))) return null;
  const rows = gems.map((g, i) => ({ g, steps: toLevels[i] - g.level }));
  const dmg = rows.filter(r => r.g.kind === 'dmg');
  const cd = rows.filter(r => r.g.kind === 'cd');
  const mean = (arr, f) => arr.reduce((sum, r) => sum + f(r), 0) / arr.length;
  let mult = 1;
  if (dmg.length) mult *= mean(dmg, r => 1 + (r.g.pct + r.steps * GEM_STEP.dmg) / 100) / mean(dmg, r => 1 + r.g.pct / 100);
  if (cd.length) {
    const casts = mean(cd, r => 1 / (1 - (r.g.pct + r.steps * GEM_STEP.cd) / 100)) / mean(cd, r => 1 / (1 - r.g.pct / 100));
    mult *= 1 + GEM_CD_DAMAGE_SHARE * (casts - 1);
  }
  const raw = (charObj && charObj.rawProfile) || {};
  const lo = raw.loadout || {};
  const parts = (lo.battlePoint && lo.battlePoint.parts) || (raw.battlePoint && raw.battlePoint.parts) || [];
  const apPool = ((parts.find(p => p.type === 1) || {}).attackPowerMultiplier || 0) / 100;
  const dAp = rows.reduce((sum, r) => sum + GEM_AP_PCT[r.g.level + r.steps] - GEM_AP_PCT[r.g.level], 0);
  mult *= (1 + apPool + dAp / 100) / (1 + apPool);
  return 100 * Math.log(mult);
}

// Gain DPS (%) d'une montée de gemmes : toutes les gemmes au niveau `lvl` passent à lvl + 1
function dpsGemUpgradeGain(charObj, lvl) {
  const gems = realGems(charObj);
  if (!gems || !gems.some(g => g.level === lvl)) return null;
  return dpsGemSetGain(charObj, gems.map(g => (g.level === lvl ? lvl + 1 : g.level)));
}

// Célérité nécessaire, à ce niveau moyen de gemmes, pour garder les recharges du set niv. 10
function supportSwiftFor(level) {
  const M = SUPPORT_MODEL;
  const target = (1 - M.swiftAtTen * M.cdrPerSwift / 100) * (1 - M.gemCdrAtTen);
  const gemCdr = M.gemCdrAtTen - (10 - level) * M.cdrPerGemLevel;
  return (1 - target / (1 - gemCdr)) * 100 / M.cdrPerSwift;
}

// Données du support lues sur le profil : % de PA (Battle Point type 1), lignes des bijoux (hors bracelet), gemmes
function supportInputs(charObj) {
  const raw = (charObj && charObj.rawProfile) || {};
  const lo = raw.loadout || {};
  const parts = (lo.battlePoint && lo.battlePoint.parts) || (raw.battlePoint && raw.battlePoint.parts) || [];
  const atkPart = parts.find(p => p.type === 1) || {};
  const lines = { allyAtkEnh: 0, allyDmg: 0, brand: 0 };
  // Bijoux seulement : le bracelet est chiffré à part (Bracelet.jointScore), ses lignes alliées n'entrent pas ici
  (lo.items || []).filter(it => it.slot !== 'bracelet').forEach(it => ((it.data && it.data.stats) || []).forEach(st => {
    const v = (st.value || 0) / 100;
    if (st.type === 54) lines.allyAtkEnh += v;
    else if (st.type === 59 || st.index === 16000001) lines.allyDmg += v;
    else if (st.type === 2 && st.index === 46) lines.brand += v;
  }));
  const gems = realGemLevels(charObj);
  const gemAvg = gems ? gems.reduce((a, b) => a + b, 0) / gems.length : SUPPORT_MODEL.gemRefLevel;
  return { apPct: (atkPart.attackPowerMultiplier || 0) / 100, lines, gems, gemAvg };
}

// Multiplicateur de dégâts donné à un allié (ap × marque × identité).
// flatAp : PA de base fixe ajoutée avant le % de PA (brassard T4, Inven #3790814), 0 sinon.
function supportContribution(inp, wp, ms, gemAvg, apPct, flatAp = 0) {
  const M = SUPPORT_MODEL;
  const shift = (gemAvg - M.gemRefLevel) * M.gemBuffPerLevel;
  const atkEnh = (M.allyAtkEnh + shift + inp.lines.allyAtkEnh) / 100;
  const allyDmg = (M.allyDmg + shift + inp.lines.allyDmg) / 100;
  const allyDmgT = (M.allyDmgT + inp.lines.allyDmg) / 100;
  const brandPower = (M.brandPower + shift + inp.lines.brand) / 100;
  const spec = M.spec + supportSwiftFor(M.gemRefLevel) - supportSwiftFor(gemAvg);
  const specEff = spec * M.classCoeff;
  const supAtk = (Math.sqrt(wp * ms / 6) + flatAp) * (1 + apPct);
  const dpsAtk = Math.sqrt(M.dpsWP * M.dpsMS / 6);
  const mults = 1 + M.dpsAtkPct;
  const apMult = ((dpsAtk + supAtk * M.share * (1 + atkEnh)) * mults + M.dpsFlatAtk) / (dpsAtk * mults + M.dpsFlatAtk);
  const ap = 1 + M.upAp * (apMult - 1);
  const brand = 1 + M.upBrand * 0.1 * (1 + brandPower);
  const seren = 0.15 * (1 + allyDmg) * (1 + specEff);
  const chord = 0.02 * (1 + allyDmg) * (1 + specEff);
  const tsk = 0.1 * (1 + allyDmgT);
  const identity = 1 + (M.upSeren * seren + M.upChord * chord + M.upTskill * tsk) / (1 + M.baseAdd);
  return ap * brand * identity;
}

/**
 * Gain de buff (% de dégâts de chaque allié, même échelle que les lignes support des bijoux)
 * quand la puissance d'arme et la stat principale du support montent de dWp / dMs.
 */
function supportApGain(charObj, ctx, dWp, dMs) {
  const inp = supportInputs(charObj);
  return 100 * Math.log(supportContribution(inp, ctx.wp + dWp, ctx.ms + dMs, inp.gemAvg, inp.apPct) /
    supportContribution(inp, ctx.wp, ctx.ms, inp.gemAvg, inp.apPct));
}

// Options support des astrogemmes = mêmes stats que les lignes support des bijoux
const ASTRO_SUPPORT_LINES = { 2011: 'allyDmg', 2012: 'brand', 2013: 'allyAtkEnh' };

// Somme des options support des astrogemmes du profil, en % (null sans cœurs ou sans table)
function supportAstroLines(charObj) {
  const lo = (charObj && charObj.rawProfile && charObj.rawProfile.loadout) || {};
  const cores = lo.arkGridCores;
  if (!astroSupportOptions || !Array.isArray(cores) || !cores.length) return null;
  const out = { allyAtkEnh: 0, allyDmg: 0, brand: 0 };
  cores.forEach(c => (c.gems || []).forEach(g => (g.opts || []).forEach(o => {
    const key = ASTRO_SUPPORT_LINES[o.id], vals = astroSupportOptions[o.id];
    if (key && vals && o.level > 0) out[key] += (vals[Math.min(o.level, vals.length) - 1] || 0) / 100;
  })));
  return out;
}

/**
 * Gain de buff si le joueur avait les options support d'astrogemmes de la référence.
 * La base de Loseii compte déjà la grille d'Ark de son Barde de référence : seul l'écart
 * référence − joueur s'ajoute aux lignes du joueur, jamais la valeur absolue. null si une donnée manque.
 */
function supportAstroGain(player, target) {
  const ctx = gearStatContext(player);
  const pa = supportAstroLines(player), ta = supportAstroLines(target);
  if (!ctx || !pa || !ta) return null;
  const inp = supportInputs(player);
  const moved = Object.assign({}, inp, { lines: {} });
  Object.keys(inp.lines).forEach(k => { moved.lines[k] = inp.lines[k] + (ta[k] - pa[k]); });
  return 100 * Math.log(supportContribution(moved, ctx.wp, ctx.ms, inp.gemAvg, inp.apPct) /
    supportContribution(inp, ctx.wp, ctx.ms, inp.gemAvg, inp.apPct));
}

/**
 * Gain de buff d'un support pour tout le bracelet (lignes, stats et traits réunis), modèle de bracelet-model.js
 * (même modèle support ap × marque × identité, plus les débuffs de groupe sur un DPS allié). null sans bracelet lisible.
 */
function supportBraceletBuff(charObj) {
  const dec = braceletDecoded(charObj);
  if (!dec) return null;
  const D = window.Bracelet.jointScore(dec.lines, dec.traits, dec.grade, window.Bracelet.normalizeProfile({ role: 'support' }));
  return Number.isFinite(D) ? D : null;
}

/**
 * Gain de buff quand les gemmes du profil passent aux niveaux `toLevels` (même ordre que realGemLevels).
 * Buffs du set (niveau moyen), PA de base réelle par gemme, recharge convertie en Spécialisation.
 * null si le profil manque de données.
 */
function supportGemSetGain(charObj, toLevels) {
  const ctx = gearStatContext(charObj);
  const inp = supportInputs(charObj);
  if (!ctx || !inp.gems || !toLevels || toLevels.length !== inp.gems.length || toLevels.some(l => !(GEM_AP_PCT[l] > 0))) return null;
  const after = toLevels.reduce((a, b) => a + b, 0) / toLevels.length;
  const apAfter = inp.apPct + inp.gems.reduce((sum, l, i) => sum + GEM_AP_PCT[toLevels[i]] - GEM_AP_PCT[l], 0) / 100;
  return 100 * Math.log(supportContribution(inp, ctx.wp, ctx.ms, after, apAfter) /
    supportContribution(inp, ctx.wp, ctx.ms, inp.gemAvg, inp.apPct));
}

// Gains de buff d'une montée de gemmes : les gemmes au niveau `lvl` passent à lvl + 1
function supportGemUpgradeGain(charObj, lvl) {
  const gems = realGemLevels(charObj);
  if (!gems || !gems.includes(lvl)) return null;
  return supportGemSetGain(charObj, gems.map(l => (l === lvl ? lvl + 1 : l)));
}

// CP du jeu gagné par un changement de pièces (dWp, dMs, dVit de gearDpsGain). DPS : le CP suit l'attaque de base
// √(puissance d'arme × stat principale). Support : branche buff (même rapport) + branche défense (PV ∝ Vitalité).
function gearCpGain(charObj, ctx, r, isSupport) {
  const cp = charObj && ((charObj.rawProfile && charObj.rawProfile.raidCombatPower) || charObj.cp);
  if (!r || !ctx || !(cp > 0)) return null;
  const atk = Math.sqrt((ctx.wp + r.dWp) * (ctx.ms + r.dMs) / (ctx.wp * ctx.ms));
  if (!isSupport) return cp * (atk - 1);
  const br = supportBpBranches(charObj);
  if (!br) return null;
  const vit = ctx.vit > 0 ? (ctx.vit + (r.dVit || 0)) / ctx.vit : 1;
  return br.A * (atk - 1) + br.D * (vit - 1);
}
