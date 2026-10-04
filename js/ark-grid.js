// Cœurs de la Grille d'Ark : bonus, cœur Arme, Battle Point, état de la grille.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function getArkGridCoreBonus(prefix, points, isSupport, isAncient) {
  // Sous 10 points un cœur n'a aucun effet (ni en jeu ni au Battle Point) : 0, jamais le palier de 10
  if (!(points >= 10)) return 0;
  const p = Math.min(20, points);
  const pr = (prefix || '').toString();
  const isOrder = pr.startsWith('6730');
  const isSun = pr.startsWith('67300') || pr.startsWith('67310');
  const isMoon = pr.startsWith('67301') || pr.startsWith('67311');
  const isStar = pr.startsWith('67302') || pr.startsWith('67312');

  if (isOrder) {
    if (isSun || isMoon) {
      if (p >= 20) return isAncient ? 9.42 : 8.80;
      if (p >= 19) return isAncient ? 8.70 : 8.10;
      if (p >= 18) return isAncient ? 8.67 : 7.98;
      if (p >= 17) return 7.80;
      if (p >= 14) return 6.00;
      return 4.50;
    } else { // Order Star
      if (isSupport) {
        if (p >= 20) return isAncient ? 2.50 : 2.40;
        if (p >= 19) return 2.30;
        if (p >= 18) return 2.20;
        if (p >= 17) return 2.10;
        if (p >= 14) return 1.60;
        return 1.20;
      } else {
        if (p >= 20) return isAncient ? 6.50 : 6.00;
        if (p >= 19) return isAncient ? 6.00 : 5.80;
        if (p >= 18) return isAncient ? 5.67 : 5.00;
        if (p >= 17) return 4.50;
        if (p >= 14) return 3.50;
        return 2.50;
      }
    }
  } else { // Chaos
    if (isSupport) {
      if (p >= 20) return isAncient ? 4.40 : 4.20;
      if (p >= 19) return isAncient ? 4.10 : 3.95;
      if (p >= 18) return isAncient ? 3.95 : 3.78;
      if (p >= 17) return 3.60;
      if (p >= 14) return 2.80;
      return 2.00;
    } else {
      if (p >= 20) return isAncient ? 3.00 : 2.85;
      if (p >= 19) return isAncient ? 2.85 : 2.75;
      if (p >= 18) return isAncient ? 2.67 : 2.67;
      if (p >= 17) return 2.50;
      if (p >= 14) return 2.00;
      return 1.50;
    }
  }
}

// Cœur Chaos Étoile « Arme » (ID 6731210xx, dernier chiffre = rang) : options cumulées du jeu (arkGridCoreOptions).
// 10 pts : +1 300 ; 14 : +0,75 % ; 17 : +2 600 et +1,50 % (rang 5) ou +3 900 et +2,25 % (rang 6) ; 18 à 20 : +0,23 % chacun.
// Rang 4 : options 10 et 14 seulement. null si le rang n'atteint pas ce palier.
const WEAPON_CORE_PREFIX = '6731210';
function weaponCoreBonus(id, points) {
  const grade = Number(id.toString().slice(-1));
  if (points >= 17 && grade < 5) return null;
  let flat = 0, pct = 0;
  if (points >= 10) flat += 1300;
  if (points >= 14) pct += 0.75;
  if (points >= 17) { flat += grade >= 6 ? 3900 : 2600; pct += grade >= 6 ? 2.25 : 1.5; }
  [18, 19, 20].forEach(t => { if (points >= t) pct += 0.23; });
  return { flat, pct };
}

/**
 * Gain du cœur « Arme » jusqu'à `toPoints` : puissance d'arme totale = (fixe) × (1 + % boucles + % Karma + % du cœur)
 * (formule de bebkok, exacte sur les profils Serka). DPS : gain de dégâts ; support : buff de PA donné aux alliés.
 */
function weaponCoreGain(charObj, core, toPoints, isSupport) {
  const ctx = gearStatContext(charObj);
  const cur = weaponCoreBonus(core.id, core.points);
  const next = weaponCoreBonus(core.id, toPoints);
  if (!ctx || !cur || !next) return null;
  const pool = ctx.wpAmp - 1; // boucles + Karma + % actuel du cœur (gearStatContext)
  const flat = ctx.wp / (1 + pool);
  const wpAfter = (flat + next.flat - cur.flat) * (1 + pool + (next.pct - cur.pct) / 100);
  return isSupport ? supportApGain(charObj, ctx, wpAfter - ctx.wp, 0) : 50 * Math.log(wpAfter / ctx.wp);
}

// Cœur équipé dans chaque emplacement (ID et points), d'après les parties 29 / 30 du Battle Point
function getArkGridCoreIds(charObj) {
  const raw = (charObj && charObj.rawProfile) || {};
  const parts = (raw.loadout && raw.loadout.battlePoint && raw.loadout.battlePoint.parts)
    || (raw.battlePoint && raw.battlePoint.parts) || [];
  const out = {};
  const add = (id, points) => {
    const def = ARK_CORE_DEFS.find(d => id.toString().startsWith(d.prefix));
    if (def && (!out[def.key] || points > out[def.key].points)) out[def.key] = { id, points };
  };
  parts.filter(p => (p.type === 29 || p.type === 30) && p.id).forEach(p => add(p.id, p.points || 0));
  // Cœurs sous 10 points : absents du Battle Point, lus dans la grille (points = somme des gemmes)
  const cores = (raw.loadout && raw.loadout.arkGridCores) || raw.arkGridCores || [];
  cores.filter(c => c && c.id).forEach(c => add(c.id, (c.gems || []).reduce((sum, g) => sum + (g.corePoints || 0), 0)));
  return out;
}

// Battle Point DPS d'un cœur à `points` (0 sous 10 points), null si le jeu ne chiffre pas ce palier
function arkCoreBpAt(tbl, points) {
  let v = 0;
  arkGridBp.steps.forEach((st, i) => { if (points >= st) v = tbl[i]; });
  return v;
}

function getArkGridStatus(charObj) {
  if (!charObj) return { hasSun17: false, hasMoon17: false, hasStar17: false, starTier: 1, slots: {} };
  const cId = (charObj.id || charObj.name || '').toLowerCase().trim();
  const pIlvl = charObj.ilvl || (charObj.rawProfile && charObj.rawProfile.ilvl) || 1700;
  const isEndgame = pIlvl >= 1740;

  const slotPts = {
    orderSun: 0,
    orderMoon: 0,
    orderStar: 0,
    chaosSun: 0,
    chaosMoon: 0,
    chaosStar: 0
  };
  let foundAnyCore = false;

  // Type de cœur = préfixe de l'ID (67300 Ordre Soleil … 67312 Chaos Étoile).
  // Le champ `base` des cœurs bruts n'est PAS le type (10002 peut être un Chaos Étoile) : ne pas s'en servir.
  const slotOfId = (idStr) => {
    if (idStr.startsWith('67300')) return 'orderSun';
    if (idStr.startsWith('67301')) return 'orderMoon';
    if (idStr.startsWith('67302')) return 'orderStar';
    if (idStr.startsWith('67310')) return 'chaosSun';
    if (idStr.startsWith('67311')) return 'chaosMoon';
    if (idStr.startsWith('67312')) return 'chaosStar';
    return null;
  };

  // A. Points officiels : battlePoint.parts type 29 / 30 (champ `points`)
  const bpParts = (charObj.rawProfile && charObj.rawProfile.battlePoint && charObj.rawProfile.battlePoint.parts)
    || (charObj.battlePoint && charObj.battlePoint.parts)
    || (charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.battlePoint && charObj.rawProfile.loadout.battlePoint.parts)
    || (charObj.rawProfile && charObj.rawProfile.loadouts && charObj.rawProfile.loadouts[0] && charObj.rawProfile.loadouts[0].battlePoint && charObj.rawProfile.loadouts[0].battlePoint.parts)
    || (charObj.loadout && charObj.loadout.battlePoint && charObj.loadout.battlePoint.parts);
  if (Array.isArray(bpParts)) {
    bpParts.filter(p => p.type === 29 || p.type === 30).forEach(p => {
      const slot = slotOfId((p.id || '').toString());
      if (!slot) return;
      const pts = p.points || (p.value >= 450 ? 17 : (p.value >= 300 ? 14 : 10));
      slotPts[slot] = Math.max(slotPts[slot], pts);
      foundAnyCore = true;
    });
  }

  // B. Secours : somme des corePoints des astrogemmes, pour les cœurs absents des parts
  const cores = charObj.arkGridCores 
    || (charObj.rawProfile && (charObj.rawProfile.arkGridCores || (charObj.rawProfile.loadout && charObj.rawProfile.loadout.arkGridCores)))
    || (charObj.loadout && charObj.loadout.arkGridCores);
  if (Array.isArray(cores) && cores.length > 0) {
    cores.forEach(c => {
      const slot = slotOfId((c.id || '').toString());
      if (!slot || slotPts[slot] > 0) return;
      const pts = Array.isArray(c.gems) 
        ? c.gems.reduce((sum, g) => sum + (g.corePoints || 0), 0) 
        : (c.points || 0);
      slotPts[slot] = pts;
      if (pts > 0) foundAnyCore = true;
    });
  }

  // C. Si des cœurs ont été analysés
  if (foundAnyCore) {
    const sunP = Math.max(slotPts.orderSun, slotPts.chaosSun) || (isEndgame ? 18 : 10);
    const moonP = Math.max(slotPts.orderMoon, slotPts.chaosMoon) || (isEndgame ? 18 : 10);
    const starP = Math.max(slotPts.orderStar, slotPts.chaosStar) || (isEndgame ? 18 : 10);
    
    let starT = 1;
    if (starP >= 17) starT = 3;
    else if (starP >= 14) starT = 2;
    else if (isEndgame) starT = 3;

    return {
      hasSun17: sunP >= 17 || isEndgame,
      hasMoon17: moonP >= 17 || isEndgame,
      hasStar17: starP >= 17 || isEndgame,
      starTier: starT,
      slots: slotPts
    };
  }

  // D. Flags sur l'objet arkGrid pré-existant
  if (charObj.arkGrid) {
    let starT = charObj.arkGrid.starTier || 0;
    if (charObj.arkGrid.star17 || starT >= 3 || (charObj.arkGrid.starPts !== undefined && charObj.arkGrid.starPts >= 17) || isEndgame) starT = 3;
    else if (charObj.arkGrid.star14 || starT === 2 || (charObj.arkGrid.starPts !== undefined && charObj.arkGrid.starPts >= 14)) starT = 2;
    const s17 = charObj.arkGrid.hasSun17 !== undefined ? charObj.arkGrid.hasSun17 : (charObj.arkGrid.sun17 !== undefined ? charObj.arkGrid.sun17 : isEndgame);
    const m17 = charObj.arkGrid.hasMoon17 !== undefined ? charObj.arkGrid.hasMoon17 : (charObj.arkGrid.moon17 !== undefined ? charObj.arkGrid.moon17 : isEndgame);
    return {
      hasSun17: !!s17,
      hasMoon17: !!m17,
      hasStar17: starT >= 3,
      starTier: starT || (isEndgame ? 3 : 1),
      slots: slotPts
    };
  }

  // E. Fallback universel Endgame T4
  if (isEndgame) {
    return { hasSun17: true, hasMoon17: true, hasStar17: true, starTier: 3, slots: slotPts };
  }

  return { hasSun17: false, hasMoon17: false, hasStar17: false, starTier: 1, slots: slotPts };
}

function getAccPolishAvailable(charObj) {
  if (!charObj) return 2;
  const cId = (charObj.id || charObj.name || '').toLowerCase();
  if (charObj.accRolled) return 0;

  // Détection dynamique depuis les données lostark.bible
  const raw = charObj.rawProfile || (charObj.loadout ? charObj : null);
  if (raw) {
    if (raw.accRolled) return 0;
    const items = raw.items || (raw.loadout && raw.loadout.items);
    if (Array.isArray(items)) {
      let rolledCount = 0;
      items.forEach(it => {
        if (it.slot && (it.slot.includes('neck') || it.slot.includes('ear') || it.slot.includes('finger'))) {
          const hasPolishStats = it.data && Array.isArray(it.data.stats) && it.data.stats.some(s => s.base === false);
          if (hasPolishStats) rolledCount++;
        }
      });
      if (rolledCount >= 3) return 0;
    }
  }

  const pIlvl = charObj.ilvl || (raw && raw.ilvl) || 1700;
  if (pIlvl >= 1740) return 0;

  return 2;
}
