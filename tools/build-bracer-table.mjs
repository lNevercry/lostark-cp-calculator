// Brassard T4 (완갑, Vambraces en EU, raid Belgardin) : stats par niveau et recette d'affinage, en attendant le flux Maxroll.
// Le flux Maxroll n'a toujours pas le brassard (vérifié le 2026-10-26, quatre jours après la sortie EU). Quand il l'aura,
// lire sa recette et sa table itemLevel dans tools/fetch-maxroll-honing.mjs et retirer ce script.
//
// Tables reprises de loa-sim.vercel.app (relevé du 2026-10-26, source des données non publiée), contrôlées ici contre
// tout ce qui est officiel (le script s'arrête au moindre écart) :
//  - infobulles officielles +10 héroïque / +15 légendaire / +20 relique / +25 ancien (note Stove GMNote 1225, images
//    reprises sur Inven #3953370) : stat principale, puissance d'arme, Vitalité, PA fixe, identiques à loa-sim ;
//  - coût officiel du niveau 1 (5 200 or, 14 500 fragments, 600 / 1 800 pierres de destruction / gardien cristallisées,
//    30 grandes pierres de saut, 22 Abidos supérieurs) et taux 15 / 10 / 5 / 3 / 1,5 % par tranche de 5 : identiques ;
//  - profils EU réels (lostark.bible, 2026-10-26, 8 personnages au brassard héroïque +10) : PA fixe (stat 114) 2 030.
// Entre deux niveaux officiels, loa-sim donne un escalier (une stat monte à chaque niveau, la PA fixe tous les 5 niveaux),
// pas une droite : c'est sa table qui est gardée (src 'loa-sim'). Avant le 2026-10-26 : interpolation linéaire entre les
// niveaux officiels et recette Serka recalée sur le niveau 1 (estimation, deux fois plus chère que le relevé Inven #3954479).
// % de PA = rareté (héroïque 0, légendaire 1, relique 2, ancien 3 %), gagnée au déblocage de +10 / +15 / +20.
// Souffles : de lave et de glacier sur le même essai (loa-sim), même taux et même maximum chacun ; les deux pleins
// doublent le taux de base, comme le souffle unique des autres recettes T4.
// Règle d'artisan des recettes T4 (+10 % du taux par échec, plafond = taux de base, jauge pleine à 215 %), comme loa-sim.
//
// Usage : node tools/build-bracer-table.mjs   → écrit data/bracer-t4.json
import { writeFileSync } from 'node:fs';

const OUT = new URL('../data/bracer-t4.json', import.meta.url);
const SRC = {
  official: 'https://m-lostark.game.onstove.com/News/GMNote/Views/1225',
  officialTooltips: 'https://www.inven.co.kr/board/lostark/6271/3953370',
  mainStatMult: 'https://www.inven.co.kr/board/lostark/6271/3790814',
  loaSim: 'https://loa-sim.vercel.app/sim',
  raid: 'https://www.loa.kakao.gg/guides/로스트아크-완갑-효율-공략-10강20강25강-강화-우선순위와-준비-재료',
  limitItem: 'https://lostark.inven.co.kr/dataninfo/item/?code=52810002'
};

// loa-sim : [stat principale, Vitalité, puissance d'arme, PA fixe] au niveau +0 à +25
const LOA_SIM_LEVELS = [[10500, 900, 3500, 0], [10500, 1440, 5350, 0], [16500, 1440, 5350, 0], [16500, 1982, 7210, 0],
  [22530, 1982, 7210, 0], [22530, 1982, 7210, 850], [22530, 2526, 9077, 850], [28608, 2526, 9077, 850], [28608, 3072, 10969, 850],
  [34746, 3072, 10969, 850], [34746, 3072, 10969, 2030], [34746, 3621, 12873, 2030], [40962, 3621, 12873, 2030],
  [40962, 4173, 14817, 2030], [47268, 4173, 14817, 2030], [47268, 4173, 14817, 3690], [47268, 4728, 16778, 3690],
  [53682, 4728, 16778, 3690], [53682, 5286, 18794, 3690], [60216, 5286, 18794, 3690], [60216, 5286, 18794, 5980],
  [60216, 5848, 20832, 5980], [66888, 5848, 20832, 5980], [66888, 6414, 22940, 5980], [73710, 6414, 22940, 5980],
  [73710, 6414, 22940, 9050]];
// loa-sim : passage de +N à +N+1 = [taux %, fragments une fois (jauge), fragments, destruction cristallisée,
// gardien cristallisée, grande pierre de saut, Abidos supérieur, or] par essai
const LOA_SIM_STEPS = [[15, 145e3, 14500, 600, 1800, 30, 22, 5200], [15, 145e3, 15e3, 620, 1860, 31, 23, 5400],
  [15, 145e3, 15630, 640, 1925, 32, 24, 5610], [15, 145e3, 16280, 660, 1990, 33, 25, 5830], [15, 145e3, 16960, 680, 2055, 34, 26, 6060],
  [10, 148e3, 17670, 700, 2125, 36, 27, 6300], [10, 166e3, 18410, 720, 2195, 38, 28, 6550], [10, 166e3, 19180, 745, 2270, 40, 29, 6810],
  [10, 169e3, 19980, 770, 2345, 42, 30, 7080], [10, 204e3, 20810, 795, 2425, 44, 31, 7360], [5, 207e3, 21680, 820, 2505, 46, 32, 7650],
  [5, 227e3, 22590, 845, 2590, 48, 33, 7950], [5, 253e3, 23530, 870, 2680, 50, 34, 8260], [5, 275e3, 24510, 900, 2770, 53, 36, 8590],
  [5, 306e3, 25530, 930, 2865, 56, 38, 8930], [3, 328e3, 26600, 960, 2965, 59, 40, 9280], [3, 36e4, 27710, 990, 3065, 62, 42, 9650],
  [3, 388e3, 28870, 1020, 3170, 65, 44, 10030], [3, 42e4, 30080, 1055, 3280, 68, 46, 10430], [3, 447e3, 31340, 1090, 3390, 72, 48, 10840],
  [1.5, 48e4, 32650, 1125, 3505, 76, 50, 11270], [1.5, 513e3, 34020, 1160, 3625, 80, 53, 11720], [1.5, 541e3, 35440, 1200, 3750, 84, 56, 12180],
  [1.5, 574e3, 36920, 1240, 3880, 89, 59, 12660], [1.5, 607e3, 38470, 1280, 4015, 94, 62, 13160]];
// loa-sim : souffles par tranche de 5 niveaux = [taux par souffle en 0,01 %, maximum par essai], pour chaque souffle
const LOA_SIM_BREATHS = [[37.5, 20], [20, 25], [10, 25], [5, 30], [2.5, 30]];

// Infobulles officielles (GMNote 1225), après déblocage pour +15 / +20 / +25, avant pour +10 (héroïque)
const OFFICIAL = {
  10: { mainStat: 34746, weaponPower: 10969, vitality: 3072, flatAp: 2030 },
  15: { mainStat: 47268, weaponPower: 14817, vitality: 4173, flatAp: 3690 },
  20: { mainStat: 60216, weaponPower: 18794, vitality: 5286, flatAp: 5980 },
  25: { mainStat: 73710, weaponPower: 22940, vitality: 6414, flatAp: 9050 }
};
const OFFICIAL_STEP0 = {
  gold: 5200, silver: 80000, shards: 14500,
  mats: {
    'destiny-crystallized-destruction-stone': 600,
    'destiny-crystallized-guardian-stone': 1800,
    'great-destiny-leapstone': 30,
    'superior-abidos-fusion-material': 22
  }
};
// Taux officiels par tranche (en 0,01 %) : +1 à +5 15 %, +6 à +10 10 %, +11 à +15 5 %, +16 à +20 3 %, +21 à +25 1,5 %
const officialSuccess = l => (l < 5 ? 1500 : l < 10 ? 1000 : l < 15 ? 500 : l < 20 ? 300 : 150);

const fail = msg => { console.error(`Écart avec les données officielles : ${msg}`); process.exit(1); };

const levels = LOA_SIM_LEVELS.map(([mainStat, vitality, weaponPower, flatAp], l) => {
  const row = { mainStat, weaponPower, vitality, flatAp };
  if (OFFICIAL[l]) Object.keys(OFFICIAL[l]).forEach(k => { if (OFFICIAL[l][k] !== row[k]) fail(`+${l} ${k} ${row[k]} ≠ ${OFFICIAL[l][k]}`); });
  return Object.assign(row, { src: OFFICIAL[l] ? 'official' : 'loa-sim' });
});

const steps = LOA_SIM_STEPS.map(([rate, once, shards, destruction, guardian, leap, fusion, gold], l) => {
  const success = rate * 100;
  if (success !== officialSuccess(l)) fail(`taux de +${l} → +${l + 1} : ${success} ≠ ${officialSuccess(l)}`);
  const [bRate, bMax] = LOA_SIM_BREATHS[Math.floor(l / 5)];
  const step = {
    success, failBonus: success / 10, failMax: success, threshold: 21500,
    gold, shards, shardsOnce: once,
    mats: {
      'destiny-crystallized-destruction-stone': destruction,
      'destiny-crystallized-guardian-stone': guardian,
      'great-destiny-leapstone': leap,
      'superior-abidos-fusion-material': fusion
    },
    breaths: [{ slug: 'lavas-breath', rate: bRate, max: bMax }, { slug: 'glaciers-breath', rate: bRate, max: bMax }],
    src: l === 0 ? 'official' : 'loa-sim'
  };
  if (l === 0) {
    if (gold !== OFFICIAL_STEP0.gold || shards !== OFFICIAL_STEP0.shards) fail('or / fragments du niveau 1');
    Object.entries(OFFICIAL_STEP0.mats).forEach(([k, n]) => { if (step.mats[k] !== n) fail(`niveau 1 ${k} ${step.mats[k]} ≠ ${n}`); });
    step.silver = OFFICIAL_STEP0.silver;
  }
  return step;
});

const data = {
  generatedAt: new Date().toISOString(),
  sources: SRC,
  note: 'levels[N] = brassard +N ; steps[N] = passage de +N à +N+1, taux en 0,01 % ; src = official | loa-sim ; ' +
    '% de PA = rareté (grades), gagné au déblocage',
  // Multiplicateur de la stat principale du brassard sans mesure sur le profil (Inven #3790814) : avatars +8 %, ranch +1 %
  mainStatMult: 1.09,
  // Rareté : niveaux possibles et % de PA de base. Le brassard ne donne ni iLvl, ni qualité, ni points d'Ark Passive.
  grades: [
    { key: 'heroic', min: 0, max: 10, apPct: 0 },
    { key: 'legendary', min: 10, max: 15, apPct: 1 },
    { key: 'relic', min: 15, max: 20, apPct: 2 },
    { key: 'ancient', min: 20, max: 25, apPct: 3 }
  ],
  // Déblocage (한계 해방) au niveau maximal de la rareté : matériaux de raid (Normal ou Hard / Nightmare), sans or
  limitBreak: {
    10: { grade: 'legendary', remnant: 200, deathHand: 100 },
    15: { grade: 'relic', remnant: 240, deathHand: 120 },
    20: { grade: 'ancient', remnant: null, deathHand: 150 }
  },
  limitBreakItems: {
    remnant: { ko: '사령의 잔영', en: 'Spectral Shade' },
    deathHand: { ko: '죽음의 손', en: 'Deathly Hand' }
  },
  raidGates: { normal: 1750, hard: 1770, nightmare: 1780 },
  levels,
  steps
};
writeFileSync(OUT, JSON.stringify(data, null, 1));
console.log('data/bracer-t4.json écrit (+0 → +25 ; officiel à +10 / 15 / 20 / 25 et au niveau 1, le reste de loa-sim)');
