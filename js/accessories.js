// Bijoux : pentes des lignes, gammes de remplacement, évaluation des accessoires.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- Valorisation des lignes d'affinage d'accessoires (pentes ARSONISTIC_DATA) ---
// PA totale et bonus PA% de base du profil par défaut de bracelet-model.js :
// sqrt(703826×1.09 × 241367×1.085 / 6) × 1.125 + 3600 ≈ 209 464
const ACC_REF_TOTAL_AP = 209464;
const ACC_REF_BASE_AP_PCT = 0.125;
// --- Gammes de bijoux de remplacement ---
// Valeurs Low / Mid / High de chaque ligne de polissage T4 (mêmes unités que computeAccessoryLinesBonus)
const ACC_LINE_TIERS = {
  addDmg: [0.70, 1.60, 2.60], outDmg: [0.55, 1.20, 2.00], apPct: [0.40, 0.95, 1.55], wpPct: [0.80, 1.80, 3.00],
  critPct: [0.40, 0.95, 1.55], cdmgPct: [1.10, 2.40, 4.00], apFlat: [80, 195, 390], wpFlat: [195, 480, 960],
  brand: [2.15, 4.80, 8.00], identity: [1.60, 3.60, 6.00], allyAp: [1.35, 3.00, 5.00], allyDmg: [2.00, 4.50, 7.50]
};
// Les 2 lignes principales par rôle et type (support boucle : PA d'arme % + PA d'arme plate)
const ACC_MAIN_LINES = {
  dps: { neck: ['addDmg', 'outDmg'], ear: ['apPct', 'wpPct'], ring: ['critPct', 'cdmgPct'] },
  support: { neck: ['brand', 'identity'], ear: ['wpPct', 'wpFlat'], ring: ['allyAp', 'allyDmg'] }
};
// Gammes achetées à l'hôtel des ventes : tiers des 2 lignes principales (0 = Low, 1 = Mid, 2 = High),
// 3e ligne morte. Pas de source marché : prix EUC relevés en jeu (null = prix inconnu, gamme ignorée).
// Échantillon lostark.bible 1730+ (2026-09-30) : High / Mid est la combinaison la plus portée,
// High / Mid : 600 à 700 k à l'hôtel des ventes EUC (milieu retenu).
const ACC_PACKAGES = [
  { id: 'HM', label: 'High / Mid', tiers: [2, 1], price: { neck: 650000, ear: 650000, ring: 650000 } },
  { id: 'MM', label: 'Mid / Mid', tiers: [1, 1], price: { neck: 35000, ear: 35000, ring: 35000 } },
  // 40 à 80 k
  { id: 'HL', label: 'High / Low', tiers: [2, 0], price: { neck: 60000, ear: 60000, ring: 60000 } },
  // Collier 4 à 5,2 M, boucle 3 à 4,5 M, anneau 2,7 à 4 M (milieu de fourchette)
  { id: 'HH', label: 'High / High', tiers: [2, 2], price: { neck: 4600000, ear: 3750000, ring: 3350000 } }
];
const accessoryKind = slot => (slot === 'neck' ? 'neck' : (slot.startsWith('ear') ? 'ear' : 'ring'));
// Coût moyen d'un bijou de la gamme de référence, pour les comparaisons globales (Benchmark)
const ACC_UPGRADE_COST_AVG = ACC_PACKAGES[0].price.neck;

const ACC_SLOTS = ['neck', 'ear1', 'ear2', 'finger1', 'finger2'];
// Bijou cible d'un remplacement : 2 lignes principales du rôle en High + PA d'arme plate Mid
const ACC_TARGET_LINES = {
  dps: {
    neck: [['addDmg', 2.60], ['outDmg', 2.00], ['wpFlat', 480]],
    ear: [['apPct', 1.55], ['wpPct', 3.00], ['wpFlat', 480]],
    ring: [['critPct', 1.55], ['cdmgPct', 4.00], ['wpFlat', 480]]
  },
  support: {
    neck: [['brand', 8.00], ['identity', 6.00], ['wpFlat', 480]],
    ear: [['wpPct', 3.00], ['shield', 3.50], ['wpFlat', 480]],
    ring: [['allyAp', 5.00], ['allyDmg', 7.50], ['wpFlat', 480]]
  }
};

// Clé de stat et quantité (en % ou en points plats) d'une ligne d'affinage brute
function getAccessoryLineKey(st) {
  const t = st.type;
  const idx = st.index;
  const val = st.value || 0;
  if (t === 4 && idx >= 621000000 && idx <= 621000002) return { key: 'outDmg', amount: [0.55, 1.20, 2.00][idx - 621000000] };
  if (t === 29) return { key: 'identity', amount: idx === 6002 ? 6.00 : (idx === 6001 ? 3.60 : 1.60) };
  if (t === 50) return { key: 'heal', amount: val / 100 };
  if (t === 51) return { key: 'shield', amount: val / 100 };
  if (t === 54) return { key: 'allyAp', amount: val / 100 };
  if (t === 59 || idx === 16000001) return { key: 'allyDmg', amount: val / 100 };
  if (t === 2) {
    const pctKeys = { 152: 'wpPct', 49: 'apPct', 50: 'addDmg', 74: 'critPct', 76: 'cdmgPct', 46: 'brand' };
    if (pctKeys[idx]) return { key: pctKeys[idx], amount: val / 100 };
    if (idx === 124) return { key: 'apFlat', amount: val };
    if (idx === 151) return { key: 'wpFlat', amount: val };
  }
  return { key: 'other', amount: 0 };
}

const SUPPORT_IDENTITY_SLOPE = 0.0673;
// Gain (% DPS ou % Buff) par unité de ligne, dérivé des tables Arsonistic.
// Une clé absente vaut 0 : lignes inutiles, soins, boucliers, jauge d'identité, PV...
let accLineSlopesCache = null;
function getAccessoryLineSlopes() {
  if (accLineSlopesCache) return accLineSlopesCache;
  const dps = ARSONISTIC_DATA.dps;
  const sup = ARSONISTIC_DATA.support;
  const perPct = (tbl, field) => tbl.high[field] / tbl.high.pct;
  const dpsApSlope = perPct(dps.apPct, 'dps');
  const dpsWpSlope = perPct(dps.wpPct, 'dps');
  const supWpSlope = perPct(sup.wpPct, 'buffDmg');
  const supWpFlatPerPoint = sup.wpFlat['960'].buffDmg / 960;
  accLineSlopesCache = {
    dps: {
      addDmg: perPct(dps.addDmg, 'dps'),
      outDmg: perPct(dps.outDmg, 'dps'),
      apPct: dpsApSlope,
      critPct: perPct(dps.critPct, 'dps'),
      cdmgPct: perPct(dps.cdmgPct, 'dps'),
      wpPct: dpsWpSlope,
      // Même équivalence points plats ⇔ % PA d'arme que la table support
      wpFlat: (supWpFlatPerPoint / supWpSlope) * dpsWpSlope,
      // +v PA = v / PA totale de réf. ; une ligne PA% de x % n'ajoute que x / (1 + PA% de base)
      apFlat: (100 / ACC_REF_TOTAL_AP) * dpsApSlope * (1 + ACC_REF_BASE_AP_PCT)
    },
    support: {
      brand: perPct(sup.brand, 'buffDmg'),
      allyDmg: perPct(sup.allyDmg, 'buffDmg'),
      allyAp: perPct(sup.allyAp, 'buffDmg'),
      wpPct: supWpSlope,
      wpFlat: supWpFlatPerPoint,
      // Gain de jauge d'identité (collier) : absent des tables Arsonistic. Loseii (accessory-scores.json, collier
      // sans marque) : Low 1,6 % +0,108, Mid 3,6 % +0,243, High 6 % +0,404 → 0,0673 % de buff par %, linéaire.
      identity: SUPPORT_IDENTITY_SLOPE
    }
  };
  return accLineSlopesCache;
}

// Cumul des lignes : additif à l'intérieur d'une même stat, multiplicatif entre stats
function computeAccessoryLinesBonus(lines, isSupport) {
  const slopes = getAccessoryLineSlopes()[isSupport ? 'support' : 'dps'];
  const pools = {};
  lines.forEach(l => {
    if (slopes[l.key]) pools[l.key] = (pools[l.key] || 0) + l.amount;
  });
  const mult = Object.keys(pools).reduce((m, k) => m * (1 + pools[k] * slopes[k] / 100), 1);
  return (mult - 1) * 100;
}

// Remplacement de bijou au meilleur ratio : chaque slot × chaque gamme au prix connu,
// en plaçant le High sur la ligne principale où il rapporte le plus
// onlyKind ('neck' | 'ear' | 'ring') : limite la recherche à ce type de bijou
function findBestAccessoryUpgrade(slotLines, isSupport, onlyKind) {
  if (!slotLines) return null;
  const role = isSupport ? 'support' : 'dps';
  const curPct = computeAccessoryLinesBonus(ACC_SLOTS.flatMap(s => slotLines[s] || []), isSupport);
  let best = null;
  ACC_SLOTS.forEach(slot => {
    const kind = accessoryKind(slot);
    if (onlyKind && kind !== onlyKind) return;
    const [m1, m2] = ACC_MAIN_LINES[role][kind];
    const others = ACC_SLOTS.filter(s => s !== slot).flatMap(s => slotLines[s] || []);
    ACC_PACKAGES.forEach(pkg => {
      const cost = pkg.price[kind];
      if (!(cost > 0)) return;
      const [t1, t2] = pkg.tiers;
      [[t1, t2], [t2, t1]].forEach(([a, b]) => {
        const target = [{ key: m1, amount: ACC_LINE_TIERS[m1][a] }, { key: m2, amount: ACC_LINE_TIERS[m2][b] }];
        const nextPct = computeAccessoryLinesBonus(others.concat(target), isSupport);
        const gain = 100 * Math.log((1 + nextPct / 100) / (1 + curPct / 100)); // même échelle que l'affinage
        if (!(gain >= 1e-4)) return;
        if (!best || cost / gain < best.cost / best.gain) best = { slot, kind, pkg, gain, cost, curPct, nextPct, lines: [m1, m2], tiers: [a, b] };
      });
    });
  });
  return best;
}

// Bonus accessoires maximal pour le rôle : les 5 bijoux avec leurs 2 lignes principales High
// et la PA d'arme plate au roll High (960). Sert d'échelle à la note des bijoux.
function accessoryMaxBonusPct(isSupport) {
  const lineSet = isSupport ? ACC_TARGET_LINES.support : ACC_TARGET_LINES.dps;
  const lines = ['neck', 'ear', 'ear', 'ring', 'ring'].flatMap(kind =>
    lineSet[kind].map(([key, amount]) => ({ key, amount: key === 'wpFlat' ? 960 : amount })));
  return computeAccessoryLinesBonus(lines, isSupport);
}

// Note des bijoux sur la part du maximum atteinte (et non sur le nombre de lignes High)
const ACC_GRADE_BANDS = [
  [0.95, 'S+', 'grade-s-plus'], [0.88, 'S', 'grade-s'], [0.80, 'A+', 'grade-a'], [0.72, 'A', 'grade-a'],
  [0.64, 'B+', 'grade-b'], [0.56, 'B', 'grade-b'], [0.48, 'C+', 'grade-c'], [0, 'C', 'grade-c']
];

function accessoryGrade(bonusPct, isSupport) {
  const ratio = bonusPct / accessoryMaxBonusPct(isSupport);
  const band = ACC_GRADE_BANDS.find(([min]) => ratio >= min);
  return { grade: band[1], cls: band[2], ratio };
}

function accessorySlotNames(isEn) {
  return {
    neck: isEn ? 'Necklace' : 'Collier',
    ear1: isEn ? 'Earring #1' : 'Boucle d\'oreille #1',
    ear2: isEn ? 'Earring #2' : 'Boucle d\'oreille #2',
    finger1: isEn ? 'Ring #1' : 'Anneau #1',
    finger2: isEn ? 'Ring #2' : 'Anneau #2'
  };
}

function decodeAccessoryStat(st, slot, isSupport, isEn) {
  const t = st.type;
  const idx = st.index;
  const val = st.value;

  let text = '';
  let rollTier = 'mid';
  let tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
  let isDead = false;

  // 1. Passifs & Compteurs Collier (type 4 ou 29)
  if (t === 4 && (idx === 621000000 || idx === 621000001 || idx === 621000002)) {
    const pct = idx === 621000002 ? '2.00' : (idx === 621000001 ? '1.20' : '0.55');
    text = isEn ? `Outgoing Damage (+${pct}%)` : `Dégâts infligés (+${pct}%)`;
    // Seul le roll max garde le statut « passif » ; dégâts personnels = inutiles en support
    if (idx === 621000002) {
      rollTier = 'passif';
      tierLabel = isEn ? 'Rank 3 Perk' : 'Passif Rang 3';
    } else {
      rollTier = idx === 621000001 ? 'mid' : 'low';
      tierLabel = rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible');
    }
    isDead = isSupport;
    return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
  }
  if (t === 29) {
    const pct = idx === 6002 ? '6.00' : (idx === 6001 ? '3.60' : '1.60');
    text = isEn ? `Identity Meter Gain (+${pct}%)` : `Gain Jauge d'Identité (+${pct}%)`;
    rollTier = idx === 6002 ? 'high' : (idx === 6001 ? 'mid' : 'low');
    tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
    isDead = !isSupport;
    return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
  }

  // 2. Lignes d'Équipe Support spécifiques (type 50, 51, 54, 59)
  if (t === 50) { // Recovery for Party Members
    const pct = (val / 100).toFixed(2);
    text = isEn ? `Recovery for Party Members (+${pct}%)` : `Soins aux Membres du Groupe (+${pct}%)`;
    rollTier = val >= 350 ? 'high' : (val >= 210 ? 'mid' : 'low');
    tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
    isDead = !isSupport;
    return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
  }
  if (t === 51) { // Shield for Party Members
    const pct = (val / 100).toFixed(2);
    text = isEn ? `Shield for Party Members (+${pct}%)` : `Boucliers aux Membres du Groupe (+${pct}%)`;
    rollTier = val >= 350 ? 'high' : (val >= 210 ? 'mid' : 'low');
    tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
    isDead = !isSupport;
    return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
  }
  if (t === 54) { // Ally Atk. Power Enhancement Effect
    const pct = (val / 100).toFixed(2);
    text = isEn ? `Ally Atk. Power Enhancement Effect (+${pct}%)` : `Effet Amplification PA d'Allié (+${pct}%)`;
    rollTier = val >= 500 ? 'high' : (val >= 300 ? 'mid' : 'low');
    tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
    isDead = !isSupport;
    return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
  }
  if (t === 59 || idx === 16000001) { // Ally Damage Enhancement Effect
    const pct = (val / 100).toFixed(2);
    text = isEn ? `Ally Damage Enhancement Effect (+${pct}%)` : `Effet Augmentation Dégâts d'Allié (+${pct}%)`;
    rollTier = val >= 750 ? 'high' : (val >= 450 ? 'mid' : 'low');
    tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
    isDead = !isSupport;
    return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
  }

  // 3. Stats Standard T4 (type === 2)
  if (t === 2) {
    if (idx === 152) { // Weapon Power %
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Weapon Power (+${pct}%)` : `Puissance d'Arme (+${pct}%)`;
      rollTier = val >= 300 ? 'high' : (val >= 180 ? 'mid' : 'low');
    } else if (idx === 49) { // Atk. Power %
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Atk. Power (+${pct}%)` : `Puissance d'Attaque (+${pct}%)`;
      rollTier = val >= 155 ? 'high' : (val >= 95 ? 'mid' : 'low');
    } else if (idx === 50) { // Additional Damage %
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Additional Damage (+${pct}%)` : `Dégâts Additionnels (+${pct}%)`;
      rollTier = val >= 260 ? 'high' : (val >= 160 ? 'mid' : 'low');
      if (isSupport) isDead = true;
    } else if (idx === 74) { // Crit Rate %
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Crit Rate (+${pct}%)` : `Taux Critique (+${pct}%)`;
      rollTier = val >= 155 ? 'high' : (val >= 95 ? 'mid' : 'low');
      if (isSupport) isDead = true;
    } else if (idx === 76) { // Crit Damage %
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Crit Damage (+${pct}%)` : `Dégâts Critiques (+${pct}%)`;
      rollTier = val >= 400 ? 'high' : (val >= 240 ? 'mid' : 'low');
      if (isSupport) isDead = true;
    } else if (idx === 46) { // Brand Power %
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Brand Power (+${pct}%)` : `Brand Power / Marque (+${pct}%)`;
      rollTier = val >= 800 ? 'high' : (val >= 480 ? 'mid' : 'low');
      if (!isSupport) isDead = true;
    } else if (idx === 124) { // Atk. Power flat
      text = isEn ? `Atk. Power (+${val})` : `Puissance d'Attaque (+${val})`;
      rollTier = val >= 390 ? 'high' : (val >= 195 ? 'mid' : 'low');
    } else if (idx === 151) { // Weapon Power flat
      text = isEn ? `Weapon Power (+${val})` : `Puissance d'Arme (+${val})`;
      rollTier = val >= 960 ? 'high' : (val >= 480 ? 'mid' : 'low');
    } else if (idx === 27) { // Max HP flat
      text = isEn ? `Max HP (+${val})` : `Points de Vie Max (+${val})`;
      rollTier = val >= 6500 ? 'high' : (val >= 3250 ? 'mid' : 'low');
      if (!isSupport) isDead = true;
    } else if (idx === 34) { // Combat HP Recovery
      text = isEn ? `Combat HP Recovery (+${val})` : `Récupération PV en Combat (+${val})`;
      rollTier = val >= 50 ? 'high' : (val >= 25 ? 'mid' : 'low');
      isDead = true;
    } else if (idx === 28) { // Max MP
      text = isEn ? `Max MP (+${val})` : `Points de Mana Max (+${val})`;
      rollTier = val >= 30 ? 'high' : (val >= 15 ? 'mid' : 'low');
      isDead = true;
    } else if (idx === 106) { // Status Ailment
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Status Ailment Time Bonus (+${pct}%)` : `Bonus Durée Altération État (+${pct}%)`;
      rollTier = val >= 100 ? 'high' : (val >= 50 ? 'mid' : 'low');
      isDead = true;
    } else {
      text = `Stat #${idx} (+${val})`;
    }

    tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
    if (isDead) tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
    return { text, rollTier, tierLabel, isDead };
  }

  return { text: `Option #${t} (${val})`, rollTier: 'low', tierLabel: isEn ? 'Low Roll' : 'Roll Faible', isDead: false };
}

function evaluateCharacterAccessories(playerChar, isSupport = false, isEn = false) {
  if (!playerChar) {
    return { bonusPct: 12.80, label: isEn ? "Standard Mid T4 Rolls" : "Rolls Mid T4 (Standard)", highCount: 0, midCount: 0, lowCount: 0, deadCount: 0 };
  }

  const cKey = (playerChar.id || playerChar.name || '').toLowerCase().trim();
  const canon = (playerChar.rawProfile ? playerChar : null);
  const pIlvl = playerChar.ilvl || (canon && canon.ilvl) || 1750;

  let pAccItems = (playerChar && playerChar.accessories)
    || (playerChar && playerChar.rawProfile && playerChar.rawProfile.accessories)
    || (playerChar && playerChar.rawProfile && playerChar.rawProfile.loadout && playerChar.rawProfile.loadout.items && playerChar.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || (playerChar && playerChar.loadout && playerChar.loadout.items && playerChar.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || (canon && canon.rawProfile && canon.rawProfile.accessories)
    || (canon && canon.rawProfile && canon.rawProfile.loadout && canon.rawProfile.loadout.items && canon.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || (canon && canon.loadout && canon.loadout.items && canon.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || [];


  let highCount = 0;
  let midCount = 0;
  let lowCount = 0;
  let deadCount = 0;
  let totalFound = 0;

  // Lignes valorisables par bijou (uniquement quand les stats brutes sont disponibles)
  let slotLines = null;

  // 1. Détection via les données d'objets bruts (lostark.bible ou import)
  if (pAccItems && pAccItems.length > 0) {
    ACC_SLOTS.forEach(slot => {
      const item = pAccItems.find(i => i.slot === slot);
      if (item && item.data && Array.isArray(item.data.stats)) {
        const rolls = item.data.stats.filter(st => st.base === false);
        if (!slotLines) slotLines = {};
        slotLines[slot] = rolls.map(getAccessoryLineKey);
        rolls.forEach(r => {
          const dec = decodeAccessoryStat(r, slot, isSupport, isEn);
          totalFound++;
          if (dec.isDead) deadCount++;
          else if (dec.rollTier === 'passif' || dec.rollTier === 'high') highCount++;
          else if (dec.rollTier === 'mid') midCount++;
          else lowCount++;
        });
      }
    });
  }

  // 2. Détection via les items textuels du preset (CANONICAL_PRESETS) si pas de stats brutes
  if (totalFound === 0) {
    const presetItems = (playerChar.items && Array.isArray(playerChar.items) && playerChar.items.filter(i => i.cat === 'Accessoires').length > 0)
      ? playerChar.items.filter(i => i.cat === 'Accessoires')
      : ((canon && Array.isArray(canon.items) && canon.items.filter(i => i.cat === 'Accessoires').length > 0)
          ? canon.items.filter(i => i.cat === 'Accessoires')
          : []);

    if (presetItems.length > 0) {
      presetItems.forEach(it => {
        totalFound++;
        const lbl = (it.label || '').toLowerCase();
        const note = (it.note || '').toLowerCase();
        const val = it.val || '';
        let isDead = false;
        let rollTier = 'mid';

        if (isSupport) {
          if (lbl.includes('critique') || lbl.includes('crit') || lbl.includes('additionnel') || note.includes('exclu') || note.includes('non transféré')) {
            isDead = true;
          } else if (lbl.includes('dégâts infligés') || val.includes('+800') || val.includes('+1.95%') || val.includes('+5.00%') || val.includes('+7.50%')) {
            rollTier = 'high';
          } else if (val.includes('+2.10%') || val.includes('+2.00%') || val.includes('+1.80%') || val.includes('+1.47%')) {
            rollTier = 'mid';
          } else {
            rollTier = 'low';
          }
        } else {
          if (lbl.includes('soins') || lbl.includes('bouclier') || lbl.includes('brand power') || lbl.includes('marque') || lbl.includes('mana max') || lbl.includes('altération') || note.includes('exclu')) {
            isDead = true;
          } else if (lbl.includes('dégâts infligés') || val.includes('+390') || val.includes('+960') || val.includes('+4.00%') || val.includes('+3.00%') || val.includes('+2.60%')) {
            rollTier = 'high';
          } else if (val.includes('+1.55%') || val.includes('+1.60%') || val.includes('+0.95%') || val.includes('+0.80%')) {
            rollTier = 'mid';
          } else {
            rollTier = 'low';
          }
        }

        if (isDead) deadCount++;
        else if (rollTier === 'high') highCount++;
        else if (rollTier === 'mid') midCount++;
        else lowCount++;
      });
    }
  }

  // 3. Calcul du bonus effectif
  let bonusPct = 12.80;
  let label = '';

  if (totalFound > 0) {
    if (slotLines) {
      // Stats brutes : valeur réelle de chaque ligne × pente Arsonistic, cumul multiplicatif entre stats
      const allLines = ACC_SLOTS.flatMap(s => slotLines[s] || []);
      bonusPct = Number(computeAccessoryLinesBonus(allLines, isSupport).toFixed(2));
    } else {
      // Presets textuels (valeurs non décodables) : estimation par tiers, sans pénalité pour les lignes inutiles
      const calc = 10.00 + (highCount * 0.35) + (midCount * 0.22) + (lowCount * 0.10);
      bonusPct = Number(Math.min(15.20, calc).toFixed(2));
    }

    const deadSuffix = deadCount > 0 
      ? (isEn ? `, ${deadCount === 1 ? '1 Dead' : deadCount + ' Dead'}` : `, ${deadCount === 1 ? '1 Inutile' : deadCount + ' Inutiles'}`)
      : '';
    const highStr = isEn ? `${highCount === 1 ? '1 High' : highCount + ' High'}` : `${highCount === 1 ? '1 Élevé' : highCount + ' Élevés'}`;
    const midStr = isEn ? `${midCount === 1 ? '1 Mid' : midCount + ' Mid'}` : `${midCount === 1 ? '1 Moyen' : midCount + ' Moyens'}`;

    if (highCount >= 12 && deadCount === 0) {
      label = isEn ? `Full High T4 Rolls (+${bonusPct.toFixed(2)}%)` : `Rolls Full High T4 (+${bonusPct.toFixed(2)}%)`;
    } else if (highCount >= 5) {
      label = isEn
        ? `T4 High/Mid Rolls (${highStr}${deadSuffix})`
        : `Rolls T4 High/Mid (${highStr}${deadSuffix})`;
    } else if (midCount > 0 || deadCount > 0) {
      label = isEn
        ? `T4 Mid Rolls (${midStr}${deadSuffix})`
        : `Rolls T4 Moyens (${midStr}${deadSuffix})`;
    } else {
      label = isEn ? `T4 Low/Early Rolls (+${bonusPct.toFixed(2)}%)` : `Rolls T4 Faibles (+${bonusPct.toFixed(2)}%)`;
    }
  } else {
    // Fallback si aucune ligne trouvée selon le palier iLvl
    if (pIlvl >= 1770) {
      bonusPct = 14.40;
      label = isEn ? "High/Mid T4 Rolls (Optimized)" : "Rolls High/Mid T4 (Optimisés)";
    } else if (pIlvl >= 1755) {
      bonusPct = 13.90;
      label = isEn ? "High/Mid T4 Rolls (2 High)" : "Rolls High/Mid T4 (2 High)";
    } else if (pIlvl >= 1750) {
      bonusPct = 13.50;
      label = isEn ? "Mid T4 Rolls (2 High)" : "Rolls Mid T4 (2 High)";
    } else if (pIlvl >= 1740) {
      bonusPct = 12.80;
      label = isEn ? "Standard Mid T4 Rolls" : "Rolls Mid T4 (Standard)";
    } else {
      bonusPct = 11.50;
      label = isEn ? "Early T4 Rolls" : "Rolls T4 Débutants";
    }
  }

  return { bonusPct, label, highCount, midCount, lowCount, deadCount, totalFound, slotLines };
}
