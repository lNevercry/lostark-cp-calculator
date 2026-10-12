// Configuration des pièces, état de l'appli, prédiction de base, éléments du DOM, gemmes du personnage, formats.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// Profils prédéfinis legacy


// Configuration d'impact Combat Power (CP) et stats par pièce en T4
// Découverte empirique vérifiée in-game sur Lost Ark T4 (test Neeverslayer & Neversup) :
// - Les pièces d'armure T4 (Casque, Épaules, Torse, Pantalon, Gants) rapportent ~10 à 14 CP par tap (+14 -> +15).
//   La formule officielle de Combat Power indexe le gain d'armure sur la MainStat effective (+3700-4600 STR/INT avec multiplicateurs).
//   Le saut de palier +15 et les bonus passifs (Élixirs, Transcendance, Ark Passive) décuplent l'impact de l'armure.
// - L'Arme (Weapon) concentre la Puissance d'Arme (multiplicateur maître).
const PIECE_CONFIG = {
  dps: {
    weapon: { cpWeight: 1.05, atkPerLevel: 2400, strPerLevel: 0 },
    chest: { cpWeight: 0.35, atkPerLevel: 580, strPerLevel: 4600 },
    pants: { cpWeight: 0.35, atkPerLevel: 580, strPerLevel: 4600 },
    gloves: { cpWeight: 0.35, atkPerLevel: 480, strPerLevel: 3750 },
    head: { cpWeight: 0.35, atkPerLevel: 460, strPerLevel: 3700 },
    shoulder: { cpWeight: 0.35, atkPerLevel: 476, strPerLevel: 3730 }
  },
  support: {
    weapon: { cpWeight: 0.52, atkPerLevel: 1600, strPerLevel: 0 },
    chest: { cpWeight: 0.147, atkPerLevel: 420, strPerLevel: 4600 },
    pants: { cpWeight: 0.155, atkPerLevel: 420, strPerLevel: 4600 },
    gloves: { cpWeight: 0.160, atkPerLevel: 340, strPerLevel: 3750 },
    head: { cpWeight: 0.168, atkPerLevel: 320, strPerLevel: 3700 },
    shoulder: { cpWeight: 0.165, atkPerLevel: 320, strPerLevel: 3700 }
  }
};

// --- 2. BASE DE DONNÉES DU CALCULATEUR ARSONISTIC (OPTIMISATIONS T4) ---
// Données extraites de 'Lost Ark Arsonistic DPS Calculator.xlsx' (SupAcc, SupBrace, Acc, Brace, EffData)


// --- 2b. COÛTS D'AFFINAGE EN GOLD (EXTRAITS DU WORKBOOK T4 - SHEET HONING) ---
// Coût en Gold brut moyen (sans matériaux) par pièce
const HONING_COSTS = {
  weapon: {
    11: 12000,
    12: 15000,
    13: 18000,
    14: 22000,
    15: 28000,
    16: 35000,
    17: 44000,
    18: 56265,
    19: 61332,
    20: 123929,
    21: 134607,
    22: 212651,
    23: 229625,
    24: 479436,
    25: 515964
  },
  armor: {
    11: 4500,
    12: 6000,
    13: 8000,
    14: 12000,
    15: 20002, // 100 010 / 5
    16: 21920, // 109 600 / 5
    17: 30753, // 153 766 / 5
    18: 33724, // 168 618 / 5
    19: 36869, // 184 344 / 5
    20: 74422, // 372 111 / 5
    21: 80894, // 404 468 / 5
    22: 127779, // 638 895 / 5
    23: 137681, // 688 403 / 5
    24: 287661, // 1 438 306 / 5
    25: 309578  // 1 547 891 / 5
  },
  advWeapon: {
    10: 39171,
    20: 87047,
    30: 142024,
    40: 189365
  },
  advArmorTotal: {
    10: 164758,
    20: 313367,
    30: 473413,
    40: 568095
  }
};

// --- 2c. MATRICE D'ARBITRAGE RENTABILITÉ GOLD / DÉGÂTS (MARCHÉ EUC) ---
// Calculée d'après 'Gold Per 0.01% Ally DMG Support' & 'Gold to DMG% DPS' avec cours EUC


// État de l'application
const state = {
  // Prix réglables du GPD (pheon, bracelet non relancé), chargés dans initApp
  gpdPrices: {},
  // Prix unitaires par défaut (EUC, 2026-09-30), remplacés au chargement par fetchMarketPrices()
  marketPrices: { 'destiny-leapstone': 16, 'prime-oreha-fusion-material': 58, 'abidos-fusion-material': 124, 'destiny-destruction-stone': 5, 'destiny-guardian-stone': 0.58, 'destiny-shard': 0, 'lavas-breath': 411, 'glaciers-breath': 398, 'gold': 1,
    // Matériaux Serka (T4 1675)
    'superior-abidos-fusion-material': 151, 'destiny-crystallized-destruction-stone': 23.55, 'destiny-crystallized-guardian-stone': 3, 'great-destiny-leapstone': 26,
    // Matériaux de récolte des fusions de Forteresse (EUC, 2026-10-01, prix à l'unité)
    'abidos-wild-flower': 12.36, 'shy-wild-flower': 6.47, 'wild-flower': 2.18,
    'abidos-timber': 14.28, 'tender-timber': 2.36, 'timber': 1.15,
    'abidos-iron-ore': 14, 'heavy-iron-ore': 2.32, 'iron-ore': 1.2,
    'abidos-thick-raw-meat': 16.94, 'treated-meat': 3.22, 'thick-raw-meat': 1.49,
    'abidos-solar-carp': 19.89, 'redflesh-fish': 2.99, 'fish': 1.49,
    'abidos-relic': 13.87, 'rare-relic': 2.04, 'ancient-relic': 2.11 },
  role: 'support',
  currentIlvl: 1750.0,
  currentCp: 3369,
  targetIlvl: 1770.0,
  gemBonus: 0,
  predictionMode: 'honing', // 'honing' (Affinage pur) | 'global' (Endgame complet)
  // Simulateur de pièces
  advHoning: 40,
  gear: {
    weapon: 17,
    head: 14,
    shoulder: 14,
    chest: 15,
    pants: 15,
    gloves: 15
  },
  // Sauvegarde de l'état initial du personnage actif pour le calcul des gains d'affinage
  baselineGear: {
    weapon: 17,
    head: 14,
    shoulder: 14,
    chest: 15,
    pants: 15,
    gloves: 15
  },
  baselineAdvHoning: 40,
  baselineIlvl: 1750.0,
  baselineCp: 3369,
};

// --- 2. FONCTIONS MATHÉMATIQUES DE MODÉLISATION ---

/**
 * Interpolation continue linéaire par morceaux sur les points de calibration
 */
function getBaselineCp(ilvl, role) {
  const table = CALIBRATION_DATA[role] || CALIBRATION_DATA.support;
  if (ilvl <= table[0].ilvl) return table[0].cp;
  if (ilvl >= table[table.length - 1].ilvl) {
    const last = table[table.length - 1];
    const prev = table[table.length - 2];
    const slope = (last.cp - prev.cp) / (last.ilvl - prev.ilvl);
    return last.cp + (ilvl - last.ilvl) * slope;
  }

  // Trouver le segment correspondant
  let i = 0;
  while (i < table.length - 1 && table[i + 1].ilvl < ilvl) {
    i++;
  }

  const p0 = table[i];
  const p1 = table[i + 1];
  const t = (ilvl - p0.ilvl) / (p1.ilvl - p0.ilvl);

  // Interpolation continue linéaire (conserve la pente réelle sans dérivée nulle artificielle)
  return p0.cp + (p1.cp - p0.cp) * t;
}

/**
 * Calcule la pente locale de gain de CP par point d'iLvl pour un personnage
 */
function getLocalSlope(currentIlvl, currentCp, role) {
  const delta = 5.0;
  const bCurr = getBaselineCp(currentIlvl, role);
  const bTarget = getBaselineCp(currentIlvl + delta, role);
  const userRatio = currentCp > 0 ? (currentCp / bCurr) : 1.0;
  return ((bTarget - bCurr) * userRatio) / delta;
}

/**
 * Prédit le CP à un iLvl cible selon le mode sélectionné (Affinage Pur vs Évolution Globale)
 */
function predictCp(currentIlvl, currentCp, targetIlvl, role, gemBonus = 0) {
  const mode = state.predictionMode || 'honing';

  if (targetIlvl <= currentIlvl) {
    return {
      predictedCp: Math.round(currentCp + gemBonus),
      minCp: Math.round(currentCp + gemBonus),
      maxCp: Math.round(currentCp + gemBonus),
      diffCp: Math.max(0, gemBonus),
      diffIlvl: 0,
      slope: 0,
      mode
    };
  }

  const diffIlvl = Math.max(0, targetIlvl - currentIlvl);
  let predictedCp, diffCp, slope, uncertainty;

  // Personnage importé, à son iLvl réel : chemin d'affinage réel (predictHoningPath)
  const realChar = getCurrentActiveCharacter();
  const realPath = mode === 'honing' && realChar && Math.abs((realChar.ilvl || 0) - currentIlvl) < 0.5
    ? predictHoningPath(realChar, targetIlvl, role === 'support') : null;
  if (realPath && realPath.reached) {
    const profileCp = (realChar.rawProfile && realChar.rawProfile.raidCombatPower) || realChar.cp || currentCp;
    const honingGain = realPath.cpGain * (profileCp > 0 ? currentCp / profileCp : 1);
    diffCp = Math.round(honingGain + gemBonus);
    predictedCp = Math.round(currentCp + diffCp);
    slope = parseFloat((honingGain / diffIlvl).toFixed(1));
    // Modèle vérifié à quelques % près (gains d'affinage comparés à Loseii, CP reconstitué depuis le Battle Point)
    uncertainty = Math.max(10, Math.round(Math.abs(diffCp) * 0.05));
    return {
      predictedCp, minCp: predictedCp - uncertainty, maxCp: predictedCp + uncertainty, diffCp,
      diffIlvl: parseFloat(diffIlvl.toFixed(2)), slope, mode, path: realPath
    };
  }

  if (mode === 'honing') {
    // 1. MODE AFFINAGE PUR (Gear Honing Seul), sans personnage importé : estimation.
    // Mesuré sur 68 profils réels : ce barème correspond au chemin le moins cher (armures surtout) ;
    // monter l'arme rapporte environ 5 fois plus de CP par iLvl.
    // En T4, l'affinage pur d'équipement donne en moyenne ~10.5 CP / iLvl pour un DPS et ~9.8 CP / iLvl pour un Support
    // (1 arme = ~28-35 CP, 5 armures = ~6.8 CP/tap). S'indexe proportionnellement au CP de base du joueur.
    const cpScale = currentCp > 0 ? (currentCp / 3500) : 1.0;
    const baseRate = role === 'support' ? 9.8 : 10.5;
    slope = parseFloat((baseRate * cpScale).toFixed(1));
    
    const honingGain = diffIlvl * slope;
    diffCp = Math.round(honingGain + gemBonus);
    predictedCp = Math.round(currentCp + diffCp);
    uncertainty = Math.max(10, Math.round(Math.abs(diffCp) * 0.05));
  } else {
    // 2. MODE ÉVOLUTION GLOBALE DE BUILD (Endgame lostark.bible)
    // Prend en compte le fait que les joueurs à haut iLvl ont aussi monté leurs gemmes 9/10, gravures reliques et karma.
    const baseCurr = getBaselineCp(currentIlvl, role);
    const baseTarget = getBaselineCp(targetIlvl, role);
    const userRatio = currentCp > 0 ? (currentCp / baseCurr) : 1.0;
    const rawPredicted = (baseTarget * userRatio) + gemBonus;

    predictedCp = Math.round(rawPredicted);
    diffCp = Math.round(rawPredicted - currentCp);
    slope = diffIlvl !== 0 ? parseFloat((diffCp / diffIlvl).toFixed(1)) : 0;
    uncertainty = Math.max(25, Math.round(Math.abs(diffCp) * 0.04));
  }

  return {
    predictedCp,
    minCp: predictedCp - uncertainty,
    maxCp: predictedCp + uncertainty,
    diffCp,
    diffIlvl: parseFloat(diffIlvl.toFixed(2)),
    slope,
    mode
  };
}

/**
 * iLvl de l'équipement sans personnage importé (simulateur, repli) : pièces Serka, iLvl = 1675 + 5 × affinage
 * (vérifié sur les profils lostark.bible ; l'affinage avancé ne change pas l'iLvl du Serka). Avec un personnage,
 * le simulateur lit chaque pièce (Aegir : 1590 + 5 × affinage + avancé).
 */
function computeGearIlvl(gearObj) {
  const currentSum = gearObj.weapon + gearObj.head + gearObj.shoulder + gearObj.chest + gearObj.pants + gearObj.gloves;
  return parseFloat((1675 + (currentSum * 5) / 6).toFixed(2));
}

// --- 3. ÉLÉMENTS DU DOM ---

const dom = {
  // Role switch
  roleSupport: document.getElementById('roleSupport'),
  roleDps: document.getElementById('roleDps'),
  roleBadge: document.getElementById('roleBadge'),
  
  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),

  // Quick Predictor Inputs
  sliderCurrentIlvl: document.getElementById('sliderCurrentIlvl'),
  numCurrentIlvl: document.getElementById('numCurrentIlvl'),
  dispCurrentIlvl: document.getElementById('dispCurrentIlvl'),

  sliderCurrentCp: document.getElementById('sliderCurrentCp'),
  numCurrentCp: document.getElementById('numCurrentCp'),
  dispCurrentCp: document.getElementById('dispCurrentCp'),

  sliderTargetIlvl: document.getElementById('sliderTargetIlvl'),
  numTargetIlvl: document.getElementById('numTargetIlvl'),
  dispTargetIlvl: document.getElementById('dispTargetIlvl'),

  quickTargetBtns: document.querySelectorAll('.target-btn'),
  gemSelect: document.getElementById('gemLevelSelect'),
  optGemMajor8: document.getElementById('optGemMajor8'),
  optGemFull8: document.getElementById('optGemFull8'),
  optGemFull9: document.getElementById('optGemFull9'),
  optGemFull10: document.getElementById('optGemFull10'),

  // Result Card Displays
  resTargetIlvlText: document.getElementById('resTargetIlvlText'),
  predictedCp: document.getElementById('predictedCp'),
  predictedRange: document.getElementById('predictedRange'),
  diffCp: document.getElementById('diffCp'),
  diffIlvl: document.getElementById('diffIlvl'),
  efficiencyCp: document.getElementById('efficiencyCp'),
  bracketText: document.getElementById('bracketText'),
  gaugeCurrent: document.getElementById('gaugeCurrent'),
  gaugeTarget: document.getElementById('gaugeTarget'),
  gaugeCenterLabel: document.getElementById('gaugeCenterLabel'),
  analysisText: document.getElementById('analysisText'),

  // Honing Tab
  advHoningSelect: document.getElementById('advHoningSelect'),
  gearRows: document.querySelectorAll('.gear-row'),
  simulatedIlvl: document.getElementById('simulatedIlvl'),
  simulatedCp: document.getElementById('simulatedCp'),
  simDiffIlvl: document.getElementById('simDiffIlvl'),
  simDiffCp: document.getElementById('simDiffCp'),
  simEstimatedGold: document.getElementById('simEstimatedGold'),
  simGoldPerCp: document.getElementById('simGoldPerCp'),
  simEstimatedStr: document.getElementById('simEstimatedStr'),
  simEstimatedAtk: document.getElementById('simEstimatedAtk'),
  honingAdviceText: document.getElementById('honingAdviceText'),
  btnAll14: document.getElementById('btnAll14'),
  btnAll16: document.getElementById('btnAll16'),
  btnAll18: document.getElementById('btnAll18'),
  btnAll20: document.getElementById('btnAll20'),

  // Presets Bar Dynamique & Roster
  presetsList: document.getElementById('presetsList'),
  presetsTitle: document.getElementById('presetsTitle'),
  rosterStatusBadge: document.getElementById('rosterStatusBadge'),
  btnSyncRosterNav: document.getElementById('btnSyncRosterNav'),
  btnManageRoster: document.getElementById('btnManageRoster'),
  rosterCountTag: document.getElementById('rosterCountTag'),

  // Bannière Visuelle du Personnage Actif
  activeCharacterCard: document.getElementById('activeCharacterCard'),
  charAvatarImg: document.getElementById('charAvatarImg'),
  charCardName: document.getElementById('charCardName'),
  charCardClass: document.getElementById('charCardClass'),
  charCardServer: document.getElementById('charCardServer'),
  charCardIlvl: document.getElementById('charCardIlvl'),
  charCardCp: document.getElementById('charCardCp'),
  charCardWeapon: document.getElementById('charCardWeapon'),
  charCardArmor: document.getElementById('charCardArmor'),
  charCardAdv: document.getElementById('charCardAdv'),
  charCardRoster: document.getElementById('charCardRoster'),
  charCardGearPill: document.getElementById('charCardGearPill'),
  charCardStonePill: document.getElementById('charCardStonePill'),
  charCardKarmaPill: document.getElementById('charCardKarmaPill'),
  charCardMixedPill: document.getElementById('charCardMixedPill'),
  charImageUploadInput: document.getElementById('charImageUploadInput'),
  btnResetAvatar: document.getElementById('btnResetAvatar'),

  // Cartes de Score de Profil (Loseii Style)
  scoreCardAcc: document.getElementById('scoreCardAcc'),
  scoreAccRoleTag: document.getElementById('scoreAccRoleTag'),
  scoreAccGrade: document.getElementById('scoreAccGrade'),
  scoreAccVal: document.getElementById('scoreAccVal'),
  scoreAccSub: document.getElementById('scoreAccSub'),
  scoreAccDetail: document.getElementById('scoreAccDetail'),

  scoreCardBracelet: document.getElementById('scoreCardBracelet'),
  scoreBrRoleTag: document.getElementById('scoreBrRoleTag'),
  scoreBrGrade: document.getElementById('scoreBrGrade'),
  scoreBrScore: document.getElementById('scoreBrScore'),
  scoreBrPct: document.getElementById('scoreBrPct'),
  scoreBrDetail: document.getElementById('scoreBrDetail'),

  scoreCardAstro: document.getElementById('scoreCardAstro'),
  scoreAgRoleTag: document.getElementById('scoreAgRoleTag'),
  scoreAgGrade: document.getElementById('scoreAgGrade'),
  scoreAgScore: document.getElementById('scoreAgScore'),
  scoreAgPct: document.getElementById('scoreAgPct'),
  scoreAgDetail: document.getElementById('scoreAgDetail'),

  scoreCardGpd: document.getElementById('scoreCardGpd'),
  scoreGpdPrice: document.getElementById('scoreGpdPrice'),
  scoreGpdPer: document.getElementById('scoreGpdPer'),
  scoreGpdDetail: document.getElementById('scoreGpdDetail'),

  // Onglet 3 : Optimisation T4 Arsonistic & Arbitrage EUC
  
  // Support Inputs

  // DPS Inputs

  // Gems Input

  // Option C : Per-Skill Gem Simulator

  // DPS Gem Simulator Elements

  // Conseiller de Taillage Loseii Bellman DP

  // Passifs Karma & Ark Grid

  // Optimization Outputs
  optBadge: document.getElementById('optBadge'),
  optResultTypeLabel: document.getElementById('optResultTypeLabel'),
  optDpsGainDisplay: document.getElementById('optDpsGainDisplay'),
  optCpGainDisplay: document.getElementById('optCpGainDisplay'),
  optBreakdownAcc: document.getElementById('optBreakdownAcc'),
  optBreakdownGems: document.getElementById('optBreakdownGems'),

  optAdviceText: document.getElementById('optAdviceText'),

  // Tableau d'Arbitrage EUC (Onglet 3)
  effRoleBadge: document.getElementById('effRoleBadge'),
  effNextBestDesc: document.getElementById('effNextBestDesc'),
  effColGainHeader: document.getElementById('effColGainHeader'),
  effColRatioHeader: document.getElementById('effColRatioHeader'),
  effTableBody: document.getElementById('effTableBody'),

  // Onglet 4 : Moteur Canonique (lostark.bible)
  canonRoleBadge: document.getElementById('canonRoleBadge'),
  canonInGameScore: document.getElementById('canonInGameScore'),
  canonInGameSub: document.getElementById('canonInGameSub'),
  canonCalculatedScore: document.getElementById('canonCalculatedScore'),
  canonCalculatedRange: document.getElementById('canonCalculatedRange'),
  canonBuffCard: document.getElementById('canonBuffCard'),
  canonBuffPower: document.getElementById('canonBuffPower'),
  canonHealCard: document.getElementById('canonHealCard'),
  canonHealPower: document.getElementById('canonHealPower'),
  canonPartsCount: document.getElementById('canonPartsCount'),
  canonTableBody: document.getElementById('canonTableBody'),

  // Modal d'Importation lostark.bible
  btnOpenImportModal: document.getElementById('btnOpenImportModal'),
  btnCloseImportModal: document.getElementById('btnCloseImportModal'),
  btnCloseImportModalFooter: document.getElementById('btnCloseImportModalFooter'),
  importModal: document.getElementById('importModal'),
  importRegion: document.getElementById('importRegion'),
  importCharName: document.getElementById('importCharName'),
  btnFetchBible: document.getElementById('btnFetchBible'),
  importStatus: document.getElementById('importStatus'),
  importJsonDirect: document.getElementById('importJsonDirect'),
  btnParseDirectJson: document.getElementById('btnParseDirectJson'),

  // OAuth 2.0 PKCE Controls
  btnOAuthLogin: document.getElementById('btnOAuthLogin'),
  btnOAuthRefresh: document.getElementById('btnOAuthRefresh'),
  btnOAuthLogout: document.getElementById('btnOAuthLogout'),
  oauthDisconnectedView: document.getElementById('oauthDisconnectedView'),
  oauthConnectedView: document.getElementById('oauthConnectedView'),
  oauthUsername: document.getElementById('oauthUsername'),
  oauthRosterList: document.getElementById('oauthRosterList'),

  // Modal Roster Management
  btnOAuthSyncAllRoster: document.getElementById('btnOAuthSyncAllRoster'),
  chkAutoAddToRoster: document.getElementById('chkAutoAddToRoster'),
  userRosterManagerSection: document.getElementById('userRosterManagerSection'),
  modalRosterCount: document.getElementById('modalRosterCount'),
  modalUserRosterList: document.getElementById('modalUserRosterList'),
  btnRefreshAllUserRoster: document.getElementById('btnRefreshAllUserRoster'),
  btnClearUserRoster: document.getElementById('btnClearUserRoster'),

  // Smart Upgrade Advisor (Onglet 2)
  tabAdvisorBtn: document.querySelector('[data-tab="tab-advisor"]'),
  tabAdvisorPane: document.getElementById('tab-advisor'),
  advisorCharName: document.getElementById('advisorCharName'),
  advisorCharStats: document.getElementById('advisorCharStats'),
  gpdNextBanner: document.getElementById('gpdNextBanner'),
  gpdNextSystem: document.getElementById('gpdNextSystem'),
  gpdNextContext: document.getElementById('gpdNextContext'),
  gpdNextRate: document.getElementById('gpdNextRate'),
  gpdNextUnit: document.getElementById('gpdNextUnit'),
  gpdTableTitle: document.getElementById('gpdTableTitle'),
  gpdThRate: document.getElementById('gpdThRate'),
  gpdNextGain: document.getElementById('gpdNextGain'),
  gpdGoalButtons: document.getElementById('gpdGoalButtons'),
  gpdCustomCpInput: document.getElementById('gpdCustomCpInput'),
  gpdPlanSummary: document.getElementById('gpdPlanSummary'),
  planSummaryGold: document.getElementById('planSummaryGold'),
  planSummaryCp: document.getElementById('planSummaryCp'),
  planSummaryRoi: document.getElementById('planSummaryRoi'),
  btnApplyGpdPlan: document.getElementById('btnApplyGpdPlan'),
  gpdMasterTable: document.getElementById('gpdMasterTable'),
  gpdMasterTableBody: document.getElementById('gpdMasterTableBody'),
  gpdPiecesTable: document.getElementById('gpdPiecesTable'),
  gpdPiecesTableBody: document.getElementById('gpdPiecesTableBody'),
  gpdOverviewBody: document.getElementById('gpdOverviewBody'),
  gpdGemPlaceCard: document.getElementById('gpdGemPlaceCard'),
  gpdGemPlaceBody: document.getElementById('gpdGemPlaceBody'),
  dispAdvisorBudget: document.getElementById('dispAdvisorBudget'),
  dispAdvisorIlvl: document.getElementById('dispAdvisorIlvl'),
  dispAdvisorCp: document.getElementById('dispAdvisorCp'),
  advInputBudget: document.getElementById('advInputBudget'),
  advInputIlvl: document.getElementById('advInputIlvl'),
  advInputCp: document.getElementById('advInputCp'),
  advScopeGear: document.getElementById('advScopeGear'),
  advScopeAdvHoning: document.getElementById('advScopeAdvHoning'),
  advScopeGems: document.getElementById('advScopeGems'),
  advScopeArkGrid: document.getElementById('advScopeArkGrid'),
  advScopeAcc: document.getElementById('advScopeAcc'),
  advScopeEngravings: document.getElementById('advScopeEngravings'),
  advScopeBracelet: document.getElementById('advScopeBracelet'),
  advisorBraceletCard: document.getElementById('advisorBraceletCard'),
  advBraceTierBadge: document.getElementById('advBraceTierBadge'),
  advBraceSubtitle: document.getElementById('advBraceSubtitle'),
  advBraceGainVal: document.getElementById('advBraceGainVal'),
  advBraceEffVal: document.getElementById('advBraceEffVal'),
  advBraceRatingDesc: document.getElementById('advBraceRatingDesc'),
  advBraceProgressBar: document.getElementById('advBraceProgressBar'),
  advBraceLinesList: document.getElementById('advBraceLinesList'),
  advBraceTargetsList: document.getElementById('advBraceTargetsList'),
  btnRunAdvisor: document.getElementById('btnRunAdvisor'),
  btnApplyRoadmap: document.getElementById('btnApplyRoadmap'),
  advResGainCp: document.getElementById('advResGainCp'),
  advResProjectedCp: document.getElementById('advResProjectedCp'),
  advResNewIlvl: document.getElementById('advResNewIlvl'),
  advResDiffIlvl: document.getElementById('advResDiffIlvl'),
  advResTotalGold: document.getElementById('advResTotalGold'),
  advResBudgetRemaining: document.getElementById('advResBudgetRemaining'),
  advResAvgRoi: document.getElementById('advResAvgRoi'),
  advisorRoadmapList: document.getElementById('advisorRoadmapList'),
  advRoadmapSubtitle: document.getElementById('advRoadmapSubtitle'),

  // Ark Passive Simulator (Onglet 4)
  tabArkPassiveBtn: document.querySelector('[data-tab="tab-arkpassive"]'),
  tabArkPassivePane: document.getElementById('tab-arkpassive'),
  arkCharPill: document.getElementById('arkCharPill'),
  arkCharName: document.getElementById('arkCharName'),
  arkCharStats: document.getElementById('arkCharStats'),
  btnArkResetCurrent: document.getElementById('btnArkResetCurrent'),
  btnArkPresetMax: document.getElementById('btnArkPresetMax'),
  btnApplyArkToSim: document.getElementById('btnApplyArkToSim'),
  
  // Evolution
  sliderArkEvoPoints: document.getElementById('sliderArkEvoPoints'),
  numArkEvoPoints: document.getElementById('numArkEvoPoints'),
  dispArkEvoPoints: document.getElementById('dispArkEvoPoints'),
  arkEvoTierBadge: document.getElementById('arkEvoTierBadge'),
  dispArkEvoMult: document.getElementById('dispArkEvoMult'),
  dispArkEvoCp: document.getElementById('dispArkEvoCp'),
  
  // Enlightenment
  sliderArkEnlightPoints: document.getElementById('sliderArkEnlightPoints'),
  numArkEnlightPoints: document.getElementById('numArkEnlightPoints'),
  dispArkEnlightPoints: document.getElementById('dispArkEnlightPoints'),
  arkEnlightTierBadge: document.getElementById('arkEnlightTierBadge'),
  dispArkEnlightMult: document.getElementById('dispArkEnlightMult'),
  dispArkEnlightCp: document.getElementById('dispArkEnlightCp'),
  
  // Leap
  sliderArkLeapPoints: document.getElementById('sliderArkLeapPoints'),
  numArkLeapPoints: document.getElementById('numArkLeapPoints'),
  dispArkLeapPoints: document.getElementById('dispArkLeapPoints'),
  arkLeapTierBadge: document.getElementById('arkLeapTierBadge'),
  dispArkLeapMult: document.getElementById('dispArkLeapMult'),
  dispArkLeapCp: document.getElementById('dispArkLeapCp'),
  
  // Summary & KPIs
  arkSummaryRoleBadge: document.getElementById('arkSummaryRoleBadge'),
  arkResTotalCp: document.getElementById('arkResTotalCp'),
  arkResDiffCp: document.getElementById('arkResDiffCp'),
  arkResGlobalMult: document.getElementById('arkResGlobalMult'),
  arkResBuffDetail: document.getElementById('arkResBuffDetail'),
  arkResTotalPoints: document.getElementById('arkResTotalPoints'),
  arkResPointsCap: document.getElementById('arkResPointsCap'),
  arkResEfficiency: document.getElementById('arkResEfficiency'),
  arkResAdviceText: document.getElementById('arkResAdviceText'),
  arkAnalysisBox: document.getElementById('arkAnalysisBox'),
  arkAnalysisText: document.getElementById('arkAnalysisText'),

  // Astrogem Grader T4 (Ark Grid / Loseii)
  astroRoleBadge: document.getElementById('astroRoleBadge'),
  astroBaseCost: document.getElementById('astroBaseCost'),
  astroWpLevel: document.getElementById('astroWpLevel'),
  dispAstroWpLevel: document.getElementById('dispAstroWpLevel'),
  dispAstroEffectiveCost: document.getElementById('dispAstroEffectiveCost'),
  astroOrderLevel: document.getElementById('astroOrderLevel'),
  dispAstroOrderLevel: document.getElementById('dispAstroOrderLevel'),
  astroEffect1: document.getElementById('astroEffect1'),
  astroEff1Level: document.getElementById('astroEff1Level'),
  dispAstroEff1Level: document.getElementById('dispAstroEff1Level'),
  astroEffect2: document.getElementById('astroEffect2'),
  astroEff2Level: document.getElementById('astroEff2Level'),
  dispAstroEff2Level: document.getElementById('dispAstroEff2Level'),
  astroScoreHero: document.getElementById('astroScoreHero'),
  astroGradeVal: document.getElementById('astroGradeVal'),
  astroRainbowLabel: document.getElementById('astroRainbowLabel'),
  astroRankPill: document.getElementById('astroRankPill'),
  astroTierBadge: document.getElementById('astroTierBadge'),
  astroGainLabel: document.getElementById('astroGainLabel'),
  astroGainVal: document.getElementById('astroGainVal'),
  astroGainSub: document.getElementById('astroGainSub'),
  astroRarityVal: document.getElementById('astroRarityVal'),
  astroRaritySub: document.getElementById('astroRaritySub'),
  astroCostVal: document.getElementById('astroCostVal'),
  astroViabilityVal: document.getElementById('astroViabilityVal'),
  astroViabilitySub: document.getElementById('astroViabilitySub'),
  astroAnalysisText: document.getElementById('astroAnalysisText'),
  btnAstroPresetPerfect8: document.getElementById('btnAstroPresetPerfect8'),
  btnAstroPresetRelic9: document.getElementById('btnAstroPresetRelic9'),
  btnAstroPresetRelic10: document.getElementById('btnAstroPresetRelic10'),
  btnAstroPresetFodder: document.getElementById('btnAstroPresetFodder')
};

// --- CONFIGURATION & CALCULS DYNAMIQUES DES GEMMES T4 (CANONIQUE SMILEGATE / BIBLE) ---

function getDynamicGemsForActiveCharacter() {
  const isSupport = state.role === 'support';
  const cId = (activeCharacterId || '').toLowerCase();
  const curChar = getCurrentActiveCharacter();

  // Gemmes T4 réelles : même modèle que le GPD (gemCpBonus)
  if (curChar) {
    const f = (lvl, n) => gemCpBonus(curChar, lvl, n, isSupport);
    const full8 = f(8), full9 = f(9), full10 = f(10), major8 = f(8, 3);
    if ([full8, full9, full10, major8].every(v => v !== null)) {
      return { major8: Math.round(major8), full8: Math.round(full8), full9: Math.round(full9), full10: Math.round(full10) };
    }
  }
  // Repli : gemmes lues sur gemParts, barème estimé
  const gemParts = curChar ? extractCharacterGemParts(curChar) : null;
  if (gemParts && gemParts.length > 0) {
    const t8Val = isSupport ? 9.60 : 5.70;
    const t9Val = isSupport ? 10.80 : 6.35;
    const t10Val = isSupport ? 12.00 : 7.00;
    const step78 = isSupport ? 32.2 : 30.4;
    const step89 = isSupport ? 36.1 : 32.3;
    const step910 = isSupport ? 40.3 : 34.5;

    let to8 = 0, to9 = 0, to10 = 0;
    for (let rawG of gemParts) {
      const g = rawG > 20 ? rawG / 100 : rawG;
      if (g < t8Val) to8 += step78;
      if (g < t9Val) to9 += (g < t8Val ? step78 + step89 : step89);
      if (g < t10Val) to10 += (g < t8Val ? step78 + step89 + step910 : (g < t9Val ? step89 + step910 : step910));
    }
    return {
      major8: isSupport ? 80 : 95,
      full8: Math.round(to8),
      full9: Math.round(to9),
      full10: Math.round(to10)
    };
  }

  return {
    major8: isSupport ? 80 : 95,
    full8: isSupport ? 355 : 335,
    full9: isSupport ? 745 : 690,
    full10: isSupport ? 1190 : 1070
  };
}

function updateGemSelectOptions() {
  if (!dom.gemSelect) return;
  const gems = getDynamicGemsForActiveCharacter();
  const isSupport = state.role === 'support';
  const isEn = isEnLang();

  if (dom.optGemMajor8) {
    dom.optGemMajor8.textContent = isEn
      ? `2-3 Key Lv. 8 Gems (${isSupport ? 'AP Buffs' : 'Top Skills'}) (+${gems.major8} CP)`
      : `2-3 Gemmes clés Niv. 8 (${isSupport ? 'Buffs AP' : 'Top Skills'}) (+${gems.major8} CP)`;
  }
  if (dom.optGemFull8) {
    const note = gems.full8 === 0 ? (isEn ? ' (Already reached)' : ' (Déjà atteint)') : '';
    dom.optGemFull8.textContent = isEn
      ? `Full Deck 11x Lv. 8 Gems${note} (+${gems.full8} CP)`
      : `Deck Complet 11x Gemmes Niv. 8${note} (+${gems.full8} CP)`;
  }
  if (dom.optGemFull9) {
    dom.optGemFull9.textContent = isEn
      ? `Full Deck 11x Lv. 9 Gems (+${gems.full9} CP)`
      : `Deck Complet 11x Gemmes Niv. 9 (+${gems.full9} CP)`;
  }
  if (dom.optGemFull10) {
    dom.optGemFull10.textContent = isEn
      ? `Full Deck 11x Lv. 10 Endgame Gems (+${formatNumber(gems.full10)} CP)`
      : `Deck Complet 11x Gemmes Niv. 10 Endgame (+${formatNumber(gems.full10)} CP)`;
  }
}

function computeGemBonus(val) {
  const gems = getDynamicGemsForActiveCharacter();
  switch (val) {
    case 'major8':
      return gems.major8;
    case 'lvl8':
    case 'full8':
      return gems.full8;
    case 'lvl9':
    case 'full9':
      return gems.full9;
    case 'lvl10':
    case 'full10':
      return gems.full10;
    default:
      return 0;
  }
}

// --- 4. GESTION DES MISES À JOUR UI ---

function isEnLang() {
  return !!(window.i18n && window.i18n.getLang() === 'en');
}

function formatNumber(num) {
  const locale = isEnLang() ? 'en-US' : 'fr-FR';
  return new Intl.NumberFormat(locale).format(num);
}

function getCpBracket(cp) {
  if (cp < 1000) return isEnLang() ? 'Below 1,000' : 'Inférieur à 1000';
  const low = Math.floor(cp / 500) * 500;
  const high = low + 500;
  return `${formatNumber(low)} – ${formatNumber(high)}`;
}

/**
 * Met à jour les résultats du prédicteur rapide (Onglet 1)
 */

function getAverageTaps(baseChance) {
    if (!baseChance || baseChance >= 1) return 1;
    let artisan = 0;
    let currentChance = baseChance;
    let expectedTaps = 0;
    let probReachingThisTap = 1.0;
    let tap = 1;

    while (artisan < 1.0 && tap < 500) {
        expectedTaps += probReachingThisTap * currentChance * tap;
        let artisanGained = currentChance / 2.15;
        let probFail = 1 - currentChance;
        artisan += artisanGained;
        
        if (artisan >= 1.0) {
            expectedTaps += (probReachingThisTap * probFail) * (tap + 1);
            break;
        }
        
        probReachingThisTap *= probFail;
        tap++;
        let nextChance = baseChance + (baseChance * 0.1 * (tap - 1));
        currentChance = Math.min(baseChance * 2, nextChance);
    }
    return expectedTaps;
}
