// Lost Ark CP Calculator - Data Dictionaries

window.ASTROGEM_DATA = {
    pools: {
      8: ["add_dmg", "atk_power", "brand", "ally_dmg"],
      9: ["boss_dmg", "atk_power", "ally_dmg", "ally_ap"],
      10: ["boss_dmg", "add_dmg", "brand", "ally_ap"]
    },
    effectLabels: {
      fr: {
        add_dmg: "Dégâts Additionnels",
        atk_power: "Puissance d'Arme / Attaque",
        brand: "Marque (Brand Power)",
        ally_dmg: "Amplif. Dégâts Alliés",
        ally_ap: "Amplif. Puissance d'Attaque (PA)",
        boss_dmg: "Dégâts aux Boss"
      },
      en: {
        add_dmg: "Additional Damage",
        atk_power: "Weapon / Attack Power",
        brand: "Brand Power",
        ally_dmg: "Ally Damage Amplification",
        ally_ap: "Ally Attack Power Amplification",
        boss_dmg: "Boss Damage"
      }
    },
    dps: {
      atkPerLvl: 0.032386,
      addPerLvl: 0.059287,
      bossPerLvl: 0.081268,
      orderPerPoint: 0.159872,
      wpCredit: { 3: 0.1327, 4: 0.0896, 5: 0, 6: -0.1203, 7: -0.2504, 8: -0.3970, 9: -0.5686 },
      bounds: { min: -1.048216, max: 0.862648 },
      anchor: 0.823494
    },
    support: {
      allyApPerLvl: 0.0586 / 3,   // 0.019533
      brandPerLvl: 0.0437 / 3,    // 0.014567
      allyDmgPerLvl: 0.0214 / 3,  // 0.007133
      orderPerPoint: 0.02879,
      wpCredit: { 3: 0.0252, 4: 0.0150, 5: 0, 6: -0.0235, 7: -0.0593, 8: -0.0986, 9: -0.1346 },
      bounds: { min: -0.105810, max: 0.314450 },
      anchor: 0.299708
    }
  };;

window.BIBLE_ARK_GRID_SUBSTATS = {"2001":{"id":2001,"en":"Attack Power","fr":"Puissance d'Attaque","fullName":"Astrogemmes — Puissance d'Attaque (Attack Power)","isSupport":false,"levels":[3,7,11,14,18,22,25,29,33,36,40,44,47,51,55,58,62,66,69,73,77,80,84,88,91,95,99,102,106,110,113,117,121,124,128,132,135,139,143,146,150,154,157,161,165,168,172,176,179,183,187,190,194,198,201,205,209,212,216,220,223,227,231,234,238,242,245,249,253,256,260,264,267,271,275,278,282,286,289,293,297,300,304,308,311,315,319,322,326,330,333,337,341,344,348,352,355,359,363,366,370,374,377,381,385,388,392,396,399,403,407,410,414,418,421,425,429,432,436,440]},"2002":{"id":2002,"en":"Additional Damage","fr":"Dégâts Additionnels","fullName":"Astrogemmes — Dégâts Additionnels (Additional Damage)","isSupport":false,"levels":[8,16,24,32,40,48,56,64,72,80,88,97,105,113,121,129,137,145,153,161,169,177,185,194,202,210,218,226,234,242,250,258,266,274,282,291,299,307,315,323,331,339,347,355,363,371,379,388,396,404,412,420,428,436,444,452,460,468,476,485,493,501,509,517,525,533,541,549,557,565,573,582,590,598,606,614,622,630,638,646,654,662,670,679,687,695,703,711,719,727,735,743,751,759,767,776,784,792,800,808,816,824,832,840,848,856,864,873,881,889,897,905,913,921,929,937,945,953,961,970]},"2003":{"id":2003,"en":"Boss Damage","fr":"Dégâts aux Boss","fullName":"Astrogemmes — Dégâts aux Boss (Boss Damage)","isSupport":false,"levels":[8,16,25,33,41,50,58,66,75,83,91,100,108,116,125,133,141,150,158,166,175,183,191,200,208,216,225,233,241,250,258,266,275,283,291,300,308,316,325,333,341,350,358,366,375,383,391,400,408,416,425,433,441,450,458,466,475,483,491,500,508,516,525,533,541,550,558,566,575,583,591,600,608,616,625,633,641,650,658,666,675,683,691,700,708,716,725,733,741,750,758,766,775,783,791,800,808,816,825,833,841,850,858,866,875,883,891,900,908,916,925,933,941,950,958,966,975,983,991,1000]},"2011":{"id":2011,"en":"Ally Damage Enh.","fr":"Amélioration Dégâts Alliés","fullName":"Astrogemmes — Ally Damage Enh. (Amélioration Dégâts Alliés)","isSupport":true,"levels":[5,10,15,21,26,31,36,42,47,52,57,63,68,73,78,84,89,94,99,105,110,115,120,126,131,136,141,147,152,157,162,168,173,178,183,189,194,199,204,210,215,220,225,231,236,241,246,252,257,262,267,273,278,283,288,294,299,304,309,315,320,325,330,336,341,346,351,357,362,367,372,378,383,388,393,399,404,409,414,420,425,430,435,441,446,451,456,462,467,472,477,483,488,493,498,504,509,514,519,525,530,535,540,546,551,556,561,567,572,577,582,588,593,598,603,609,614,619,624,630]},"2012":{"id":2012,"en":"Brand Power","fr":"Puissance de Marque","fullName":"Astrogemmes — Brand Power (Puissance de la Marque)","isSupport":true,"levels":[16,33,50,66,83,100,116,133,150,166,183,200,216,233,250,266,283,300,316,333,350,366,383,400,416,433,450,466,483,500,516,533,550,566,583,600,616,633,650,666,683,700,716,733,750,766,783,800,816,833,850,866,883,900,916,933,950,966,983,1000,1016,1033,1050,1066,1083,1100,1116,1133,1150,1166,1183,1200,1216,1233,1250,1266,1283,1300,1316,1333,1350,1366,1383,1400,1416,1433,1450,1466,1483,1500,1516,1533,1550,1566,1583,1600,1616,1633,1650,1666,1683,1700,1716,1733,1750,1766,1783,1800,1816,1833,1850,1866,1883,1900,1916,1933,1950,1966,1983,2000]},"2013":{"id":2013,"en":"Ally Attack Enh.","fr":"Amélioration AP Allié","fullName":"Astrogemmes — Ally Attack Enh. (Amélioration AP Allié)","isSupport":true,"levels":[13,26,39,52,65,78,91,104,117,130,143,156,169,182,195,208,221,234,247,260,273,286,299,312,325,338,351,364,377,390,403,416,429,442,455,468,481,494,507,520,533,546,559,572,585,598,611,624,637,650,663,676,689,702,715,728,741,754,767,780,793,806,819,832,845,858,871,884,897,910,923,936,949,962,975,988,1001,1014,1027,1040,1053,1066,1079,1092,1105,1118,1131,1144,1157,1170,1183,1196,1209,1222,1235,1248,1261,1274,1287,1300,1313,1326,1339,1352,1365,1378,1391,1404,1417,1430,1443,1456,1469,1482,1495,1508,1521,1534,1547,1560]}};;

window.BIBLE_CARDS = {"1001":"Guardian's Mayhem","1002":"Guardian's Threat","1003":"Guardian's Roar","1004":"Lostwind Cliff (Falaise du Vent Perdu)","1005":"Grand Master Trial","1006":"Luterra's Ordeal","1007":"Farewell, Weapon","1008":"A Ghostly Night","1009":"Romanticist","1010":"Master of Necromancy","1011":"We'll Meet Again","1012":"Triarchy","1013":"Three Umar Families (Trois Familles Umar)","1014":"Scene Stealer","1015":"Light of Salvation (Lumière du Salut)","1016":"Verdantier Plan","1017":"Weight of Destiny","1018":"Death Approaches","1019":"Nature's Elementals","1020":"Spear Master","1021":"Cherish Your Books","1022":"Forest of Giants","1023":"Kazeros's Legion Commanders (Commandants de Kazeros)","1024":"Trixion","1025":"Field Boss II","1026":"Desert of Sky","1027":"Pirate Generation","1028":"Chaos Guardian I","1029":"The Way it Was","1031":"Oreha's Well","1032":"Fate of the Lazeniths (Destin des Lazeniths)","1034":"A Sun That Rose in the South","1036":"Guardian's Punishment","1037":"What's Left After a War","1038":"Revenge Is Mine","1039":"Destined Encounter I","1041":"Platina's People","1042":"The Witcher Collaboration 2023","1043":"Deep Dive (Plongée Profonde)","1044":"You Have A Plan","1045":"Star of Destiny","1046":"A Voice Calls","1048":"Spirited Flame's Breath","1049":"Powerful Wind's Breath","1050":"Strong Earth's Breath","1051":"Swift Thunderbolt's Breath","1052":"Frozen Wildfire Protection","1053":"Melodious Tide Protection","1054":"Sleeping Earth Protection","1055":"Raging Thunderbolt Protection","1056":"Guardian Purification I","1057":"Guardian's First Choice II","1058":"Path of Faith"};;

window.BIBLE_STAT_MAP = {
    1: { name: 'Points de Vie', isPercent: false, dest: 'les Points de Vie Maximum' },
    6: { name: 'Vitalité', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    7: { name: 'Force', isPercent: false, dest: "l'Attaque de Base (Base AP)" },
    8: { name: 'Dextérité', isPercent: false, dest: "l'Attaque de Base (Base AP)" },
    9: { name: 'Intelligence', isPercent: false, dest: "l'Attaque de Base (Base AP)" },
    10: { name: 'Vitalité', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    11: { name: null, isPercent: false, dest: "l'Attaque de Base (Base AP)" }, // mainStatName selon classe
    15: { name: 'Critique', isPercent: false, dest: 'les Stats de Combat' },
    16: { name: 'Spécialisation', isPercent: false, dest: 'les Stats de Combat' },
    17: { name: 'Domination', isPercent: false, dest: 'les Stats de Combat' },
    18: { name: 'Rapidité', isPercent: false, dest: 'les Stats de Combat' },
    19: { name: 'Endurance', isPercent: false, dest: 'les Stats de Combat' },
    20: { name: 'Expertise', isPercent: false, dest: 'les Stats de Combat' },
    21: { name: 'Critique', isPercent: false, dest: 'les Stats de Combat' },
    22: { name: 'Spécialisation', isPercent: false, dest: 'les Stats de Combat' },
    23: { name: 'Domination', isPercent: false, dest: 'les Stats de Combat' },
    24: { name: 'Rapidité', isPercent: false, dest: 'les Stats de Combat' },
    25: { name: 'Endurance', isPercent: false, dest: 'les Stats de Combat' },
    26: { name: 'Expertise', isPercent: false, dest: 'les Stats de Combat' },
    27: { name: 'Points de Vie Max', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    28: { name: 'Points de Mana Max', isPercent: false, dest: 'le Mana Maximum' },
    29: { name: 'Points de Vie Max', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    30: { name: 'Points de Mana Max', isPercent: false, dest: 'le Mana Maximum' },
    31: { name: 'Points de Vie Max', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    32: { name: 'Points de Mana Max', isPercent: false, dest: 'le Mana Maximum' },
    45: { name: "Dégâts d'Évolution", isPercent: true, dest: 'les Dégâts' },
    46: { name: 'Brand Power (Marque)', isPercent: true, dest: 'la Marque' },
    47: { name: "Puissance d'Attaque", isPercent: false, dest: "l'Attaque de Base" },
    48: { name: 'Dégâts Bonus', isPercent: false, dest: 'les Dégâts' },
    49: { name: "Puissance d'Attaque", isPercent: true, dest: "l'Attaque de Base" },
    50: { name: 'Dégâts Additionnels', isPercent: true, dest: 'les Dégâts' },
    51: { name: "Puissance d'Attaque", isPercent: true, dest: "l'Attaque de Base" },
    52: { name: 'Dégâts Additionnels', isPercent: true, dest: 'les Dégâts' },
    53: { name: 'Réduction Temps de Recharge', isPercent: true, dest: 'le Temps de Recharge' },
    54: { name: 'Neutralisation (Stagger)', isPercent: true, dest: 'la Neutralisation' },
    55: { name: 'Défense Physique', isPercent: false, dest: 'la Défense Physique' },
    56: { name: 'Défense Magique', isPercent: false, dest: 'la Défense Magique' },
    57: { name: 'Défense Physique', isPercent: false, dest: 'la Défense Physique' },
    58: { name: 'Défense Magique', isPercent: false, dest: 'la Défense Magique' },
    59: { name: 'Défense Physique', isPercent: false, dest: 'la Défense Physique' },
    60: { name: 'Défense Magique', isPercent: false, dest: 'la Défense Magique' },
    71: { name: 'Bouclier', isPercent: true, dest: 'les Boucliers' },
    76: { name: 'Dégâts Critiques', isPercent: true, dest: 'les Dégâts Critiques' },
    77: { name: "Vitesse d'Attaque", isPercent: false, dest: "la Vitesse d'Attaque" },
    78: { name: "Vitesse d'Attaque", isPercent: true, dest: "la Vitesse d'Attaque" },
    79: { name: 'Vitesse de Déplacement', isPercent: false, dest: 'la Vitesse de Déplacement' },
    80: { name: 'Vitesse de Déplacement', isPercent: true, dest: 'la Vitesse de Déplacement' },
    151: { name: "Puissance d'Arme", isPercent: false, dest: "l'Attaque de Base (Base AP)" }
  };;

window.OAUTH_CONFIG = {
    prodClientId: 'm2remvngsp3rb3ezylwvlgzdfa',
    devClientId: 'rvyrwvi7r4hb65oma34fv73cte',
    scopes: 'identify rosters logs',
    authUrl: 'https://lostark.bible/oauth/authorize',
    tokenUrl: 'https://lostark.bible/oauth/token',
    userUrl: 'https://lostark.bible/api/oauth/user',
    rostersUrl: 'https://lostark.bible/api/oauth/rosters'
  };;

window.RAID_DEFINITIONS = {
    horizon_cathedral: {
      key: 'horizon_cathedral',
      nameKey: 'raid_cathedral',
      fallbackName: 'Horizon Cathedral',
      short: 'Cathedral',
      icon: '',
      image: 'images/raids/cathedral.webp',
      bosses: 'G1: Archbishop Arcenos • G2: Vanguard of Fanaticism',
      normal: { g1: 13500, g2: 16500, chest1: 2500, chest2: 3500, chest: 6000, total: 30000, ilvl: 1700 },
      hard: { g1: 16000, g2: 24000, chest1: 3000, chest2: 4500, chest: 7500, total: 40000, ilvl: 1720 },
      nightmare: { g1: 20000, g2: 30000, chest1: 3500, chest2: 5500, chest: 9000, total: 50000, ilvl: 1750 }
    },
    serca: {
      key: 'serca',
      nameKey: 'raid_serca',
      fallbackName: 'Serca',
      short: 'Serca',
      icon: '',
      image: 'images/raids/serca.webp',
      bosses: 'G1: Witch of Agony, Serca • G2: Corvus Tul Rak',
      normal: { g1: 14000, g2: 21000, chest1: 2500, chest2: 4000, chest: 6500, total: 35000, ilvl: 1710 },
      hard: { g1: 18000, g2: 26000, chest1: 3500, chest2: 5000, chest: 8500, total: 44000, ilvl: 1730 },
      nightmare: { g1: 22000, g2: 32000, chest1: 4000, chest2: 6000, chest: 10000, total: 54000, ilvl: 1740 }
    },
    final_act_kazeros: {
      key: 'final_act_kazeros',
      nameKey: 'raid_kazeros',
      fallbackName: 'Final Act: Kazeros',
      short: 'Kazeros',
      icon: '',
      image: 'images/raids/kazeros.webp',
      bosses: 'G1: Abyss Lord Kazeros • G2: Archdemon Kazeros',
      normal: { g1: 14000, g2: 26000, chest1: 2500, chest2: 5000, chest: 7500, total: 40000, ilvl: 1710 },
      hard: { g1: 17000, g2: 35000, chest1: 3500, chest2: 6500, chest: 10000, total: 52000, ilvl: 1730 },
      nightmare: { g1: 25000, g2: 40000, chest1: 4500, chest2: 7500, chest: 12000, total: 65000, ilvl: 1750 }
    }
  };;

window.CLASS_DEFAULT_SPECS = {
    shadowhunter: { default: "Demonic Impulse", alt: "Perfect Suppression", keys: ["demonic", "suppression", "impulse", "shadowhunter"] },
    paladin: { default: "Blessed Aura", alt: "Judgment", keys: ["blessed", "aura", "judgment", "paladin"] },
    breaker: { default: "Asura's Path", alt: "Brawl King Storm", keys: ["asura", "brawl", "breaker"] },
    slayer: { default: "Predator", alt: "Punisher", keys: ["predator", "punisher", "slayer"] },
    souleater: { default: "Full Moon Harvester", alt: "Night's Edge", keys: ["moon", "night", "edge", "souleater"] },
    bard: { default: "Desperate Salvation", alt: "True Courage", keys: ["salvation", "courage", "bard"] },
    artist: { default: "Full Bloom", alt: "Recurrence", keys: ["bloom", "recurrence", "artist", "yinyangshi"] },
    deathblade: { default: "Surge", alt: "Remaining Energy", keys: ["surge", "remaining", "deathblade", "blade"] },
    sorceress: { default: "Igniter", alt: "Reflux", keys: ["igniter", "reflux", "sorceress"] },
    gunlancer: { default: "Combat Readiness", alt: "Lone Knight", keys: ["combat readiness", "lone knight", "gunlancer", "warlord"] },
    wardancer: { default: "First Intention", alt: "Esoteric Skill Enhancement", keys: ["first intention", "esoteric", "wardancer", "battlemaster"] },
    scrapper: { default: "Ultimate Skill: Taijutsu", alt: "Shock Training", keys: ["taijutsu", "shock", "scrapper", "infighter"] },
    gunslinger: { default: "Peacemaker", alt: "Time to Hunt", keys: ["peacemaker", "hunt", "gunslinger"] },
    reaper: { default: "Hunger", alt: "Lunar Voice", keys: ["hunger", "lunar", "reaper"] },
    berserker: { default: "Mayhem", alt: "Berserker Technique", keys: ["mayhem", "berserker technique", "berserker"] },
    destroyer: { default: "Rage Hammer", alt: "Gravity Training", keys: ["rage hammer", "gravity", "destroyer"] },
    artillerist: { default: "Barrage Enhancement", alt: "Firepower Enhancement", keys: ["barrage", "firepower", "artillerist", "blaster"] },
    sharpshooter: { default: "Death Strike", alt: "Loyal Companion", keys: ["death strike", "loyal companion", "sharpshooter", "hawkeye"] },
    machinist: { default: "Evolutionary Legacy", alt: "Arthetinean Skill", keys: ["evolutionary legacy", "arthetinean", "machinist", "scouter"] },
    arcanist: { default: "Grace of the Empress", alt: "Order of the Emperor", keys: ["empress", "emperor", "arcanist", "arcana"] },
    summoner: { default: "Master Summoner", alt: "Communication Overflow", keys: ["master summoner", "overflow", "summoner"] },
    aeromancer: { default: "Wind Fury", alt: "Drizzle", keys: ["wind fury", "drizzle", "aeromancer"] },
    glaivier: { default: "Pinnacle", alt: "Control", keys: ["pinnacle", "control", "glaivier", "lancemaster"] },
    striker: { default: "Deathblow", alt: "Esoteric Flurry", keys: ["deathblow", "flurry", "striker"] },
    soulfist: { default: "Energy Overflow", alt: "Robust Spirit", keys: ["energy overflow", "robust", "soulfist", "soulmaster"] },
    deadeye: { default: "Enhanced Weapon", alt: "Pistoleer", keys: ["enhanced weapon", "pistoleer", "deadeye", "devilhunter"] },
    valkyrie: { default: "Liberator", alt: "Shining Knight", keys: ["liberator", "shining knight", "knight of light", "valkyrie", "holyknight_female", "holyknightfemale"] },
    dimensionalist: { default: "Time Wielder", alt: "Space Wielder", keys: ["time wielder", "space wielder", "dimensionalist", "dimension_master", "dimension master", "dimensionmaster", "dimension"] }
  };;

// Nœud d’Éclairage de palier 1 (groupe 1, tier 0) qui fixe la spé : table arkPassives du flux Maxroll
// (assets-ng.maxroll.gg/laplanner/game/stats.json), nom = subName du jeu, sinon name ; « Supreme Art » et
// « Tactical Bullet » écrits avec les noms de CLASS_DEFAULT_SPECS (Energy Overflow, Enhanced Weapon).
window.BIBLE_ENLIGHTENMENT_SPECS = {
    2160000: "Berserker Technique",
    2160010: "Mayhem",
    2180000: "Rage Hammer",
    2180010: "Gravity Training",
    2170000: "Lone Knight",
    2170010: "Combat Readiness",
    2360000: "Judgment",
    2360010: "Blessed Aura",
    2450000: "Punisher",
    2450010: "Predator",
    2480000: "Shining Knight",
    2480100: "Liberator",
    2190000: "Grace of the Empress",
    2190100: "Order of the Emperor",
    2200000: "Communication Overflow",
    2200100: "Master Summoner",
    2210000: "Desperate Salvation",
    2210100: "True Courage",
    2370000: "Igniter",
    2370100: "Reflux",
    2220000: "First Intention",
    2220100: "Esoteric Skill Enhancement",
    2230000: "Ultimate Skill: Taijutsu",
    2230100: "Shock Training",
    2240000: "Energy Overflow",
    2240100: "Robust Spirit",
    2340000: "Control",
    2340100: "Pinnacle",
    2390000: "Esoteric Flurry",
    2390100: "Deathblow",
    2470000: "Brawl King Storm",
    2470100: "Asura's Path",
    2250000: "Surge",
    2250600: "Remaining Energy",
    2270000: "Demonic Impulse",
    2270600: "Perfect Suppression",
    2260000: "Lunar Voice",
    2260600: "Hunger",
    2460000: "Full Moon Harvester",
    2460600: "Night's Edge",
    2280000: "Death Strike",
    2280100: "Loyal Companion",
    2290000: "Enhanced Weapon",
    2290100: "Pistoleer",
    2300000: "Barrage Enhancement",
    2300100: "Firepower Enhancement",
    2350000: "Evolutionary Legacy",
    2350100: "Arthetinean Skill",
    2380000: "Peacemaker",
    2380100: "Time to Hunt",
    2310000: "Full Bloom",
    2310600: "Recurrence",
    2320000: "Wind Fury",
    2320600: "Drizzle",
    2330000: "Ferality",
    2330100: "Phantom Beast Awakening",
    220500000: "Time Wielder",
    220500100: "Space Wielder",
    2490000: "Hellfire Successor",
    2490100: "Dreadful Roar"
  };;

window.CLASS_NAME_MAP = {
    // Warriors
    holyknight: 'Paladin',
    holy_knight: 'Paladin',
    paladin: 'Paladin',
    warlord: 'Gunlancer',
    gunlancer: 'Gunlancer',
    pistolancier: 'Gunlancer',
    berserker: 'Berserker',
    berserker_male: 'Berserker',
    berserkermale: 'Berserker',
    berserker_female: 'Slayer',
    berserkerfemale: 'Slayer',
    slayer: 'Slayer',
    salveuse: 'Slayer',
    destroyer: 'Destroyer',
    valkyrie: 'Valkyrie',
    holyknight_female: 'Valkyrie',
    'holyknight female': 'Valkyrie',
    holyknightfemale: 'Valkyrie',
    guardianknight: 'Valkyrie',

    // Martial Artists
    battlemaster: 'Wardancer',
    battle_master: 'Wardancer',
    wardancer: 'Wardancer',
    elementiste: 'Wardancer',
    infighter: 'Scrapper',
    infighter_female: 'Scrapper',
    'infighter female': 'Scrapper',
    infighterfemale: 'Scrapper',
    scrapper: 'Scrapper',
    pugiliste: 'Scrapper',
    force_master: 'Soulfist',
    forcemaster: 'Soulfist',
    soul_master: 'Soulfist',
    soulmaster: 'Soulfist',
    soulfist: 'Soulfist',
    spiritiste: 'Soulfist',
    lance_master: 'Glaivier',
    lancemaster: 'Glaivier',
    glaivier: 'Glaivier',
    lanciere: 'Glaivier',
    striker: 'Striker',
    essentialiste: 'Striker',
    heavy_infighter: 'Breaker',
    heavyinfighter: 'Breaker',
    infighter_male: 'Breaker',
    'infighter male': 'Breaker',
    infightermale: 'Breaker',
    breaker: 'Breaker',
    sangha: 'Breaker',

    // Gunners
    devil_hunter: 'Deadeye',
    devilhunter: 'Deadeye',
    deadeye: 'Deadeye',
    franctireur: 'Deadeye',
    gunslinger: 'Gunslinger',
    devil_hunter_female: 'Gunslinger',
    devilhunterfemale: 'Gunslinger',
    fusiliere: 'Gunslinger',
    blaster: 'Artillerist',
    artillerist: 'Artillerist',
    artilleur: 'Artillerist',
    hawkeye: 'Sharpshooter',
    sharpshooter: 'Sharpshooter',
    sagittaire: 'Sharpshooter',
    machinist: 'Machinist',
    scouter: 'Machinist',
    machiniste: 'Machinist',

    // Mages
    bard: 'Bard',
    barde: 'Bard',
    arcana: 'Arcanist',
    arcanist: 'Arcanist',
    summoner: 'Summoner',
    invocatrice: 'Summoner',
    sorceress: 'Sorceress',
    sorciere: 'Sorceress',
    elemental_master: 'Sorceress',
    elementalmaster: 'Sorceress',

    // Assassins
    blade: 'Deathblade',
    deathblade: 'Deathblade',
    sanglante: 'Deathblade',
    demonic: 'Shadowhunter',
    shadowhunter: 'Shadowhunter',
    demoniste: 'Shadowhunter',
    reaper: 'Reaper',
    faucheuse: 'Reaper',
    soul_eater: 'Souleater',
    souleater: 'Souleater',
    devoreuse: 'Souleater',
    devoreusedames: 'Souleater',

    // Specialists
    artist: 'Artist',
    artiste: 'Artist',
    yinyangshi: 'Artist',
    yin_yang_shi: 'Artist',
    painter: 'Artist',
    illusionist: 'Artist',
    aeromancer: 'Aeromancer',
    weather_artist: 'Aeromancer',
    weatherartist: 'Aeromancer',
    aeromancienne: 'Aeromancer',
    meteorologist: 'Aeromancer',
    wildsoul: 'Wildsoul',
    wild_soul: 'Wildsoul',
    alchemist: 'Wildsoul',
    dimensionalist: 'Dimensionalist',
    dimension_master: 'Dimensionalist',
    dimensionmaster: 'Dimensionalist',
    'dimension master': 'Dimensionalist',
    dimensionnaliste: 'Dimensionalist',
    dimensioniste: 'Dimensionalist',
    maitredesdimensions: 'Dimensionalist'
  };;

// Pentes des lignes de bijoux T4 (tables Arsonistic) : valeur de la ligne (pct) et gain qu'elle apporte, en % de dégâts
// (dps) ou en % de buff allié (buffDmg). Seuls le rapport gain / valeur au tier High et la ligne plate 960 servent
// (getAccessoryLineSlopes dans js/accessories.js : GPD, Benchmark, simulateur de l'onglet Optimisation).
window.ARSONISTIC_DATA = {
    support: {
      brand: { high: { pct: 8.00, buffDmg: 0.70 } },
      allyDmg: { high: { pct: 7.50, buffDmg: 0.75 } },
      allyAp: { high: { pct: 5.00, buffDmg: 0.78 } },
      wpPct: { high: { pct: 3.00, buffDmg: 0.36 } },
      wpFlat: { '960': { val: 960, buffDmg: 0.077 } }
    },
    dps: {
      addDmg: { high: { pct: 2.60, dps: 1.95 } },
      outDmg: { high: { pct: 2.00, dps: 2.00 } },
      apPct: { high: { pct: 1.55, dps: 1.38 } },
      critPct: { high: { pct: 1.55, dps: 1.23 } },
      cdmgPct: { high: { pct: 4.00, dps: 1.02 } },
      wpPct: { high: { pct: 3.00, dps: 1.03 } }
    }
  };



// --- T4 EXACT HONING MATRICES (Imported from Honing Forecast) ---
// Index Mapping: [0] Destruction, [1] Guardian, [2] Fusion, [3] Shards, [4] Leapstones, [5] Raw Gold, [6] Silver
window.T4_HONING_CHANCES = [0.6,0.6,0.6,0.45,0.45,0.3,0.3,0.15,0.15,0.1,0.1,0.05,0.05,0.04,0.04,0.04,0.03,0.03,0.03,0.015,0.015,0.01,0.01,0.005,0.005];
window.T4_WEAPON_COST = [[350,450,550,650,750,800,900,1000,1050,1150,1250,1300,1400,1550,1700,1950,2200,2450,2700,2950,3200,3700,4000,4200,4500],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[12,13,14,15,15,15,16,16,18,18,18,21,24,27,30,33,36,39,42,45,48,52,56,60,65],[3000,3100,3200,3300,3500,3700,3900,4200,4400,4700,5000,5300,7600,8200,8800,9400,12000,12900,13700,16000,17100,18200,19200,20400,21500],[5,5,5,6,6,6,8,8,10,10,12,12,15,15,18,18,25,25,25,35,35,35,35,50,50],[624,632,648,688,728,792,864,952,1048,1168,1296,1432,1592,1760,1944,2136,2352,2576,3510,3830,4160,4510,4870,5250,5650],[50000,50000,50000,50000,50000,50000,55000,55000,55000,55000,55000,55000,55000,55000,55000,55000,65000,65000,65000,90000,90000,120000,120000,150000,150000]];
window.T4_ARMOR_COST = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[210,270,330,390,450,480,540,600,630,690,750,780,840,930,1020,1170,1320,1470,1620,1770,1920,2220,2400,2520,2700],[7,8,8,9,9,9,10,10,11,11,11,13,14,16,18,20,22,23,25,27,29,31,34,36,40],[1800,1860,1920,1980,2100,2220,2340,2520,2640,2820,3000,3180,4560,4920,5280,5640,7200,7740,8220,9600,10260,10920,11520,12240,12900],[3,3,3,4,4,4,5,5,6,6,7,7,9,9,11,11,15,15,15,21,21,21,21,30,30],[376,384,392,416,440,472,520,568,632,704,776,856,952,1056,1168,1280,1408,1544,2110,2300,2500,2710,2920,3150,3390],[30000,30000,30000,30000,30000,30000,33000,33000,33000,33000,33000,33000,33000,33000,33000,33000,39000,39000,39000,54000,54000,72000,72000,90000,90000]];
window.T4_WEAPON_UNLOCK = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[15000,15000,15000,15000,15000,16000,17000,17000,18000,20000,21000,23000,33000,38000,43000,49000,66000,75000,85000,106000,120000,135000,152000,170000,190000],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[240000,240000,240000,270000,270000,320000,340000,374000,396000,520000,525000,690000,825000,950000,1075000,1225000,1650000,1875000,1955000,2120000,2400000,2700000,3040000,3400000,4750000]];
window.T4_ARMOR_UNLOCK = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[9000,9000,9000,9000,9000,9000,10000,10000,10000,12000,12000,13000,19000,22000,25000,29000,39000,45000,51000,63000,72000,81000,91000,102000,114000],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[144000,144000,144000,162000,162000,180000,200000,220000,220000,312000,300000,390000,475000,550000,625000,725000,975000,1125000,1173000,1260000,1440000,1620000,1820000,2040000,2850000]];

// --- PIERRE D'APTITUDE T4 : bonus de gravure par niveau de pierre (wiki Lost Ark, page de chaque gravure) ---
// Niveaux de pierre 1/2/3/4 à 6/7/9/10 nœuds. `stone` = bonus de la pierre aux niveaux 1…4 (valeurs totales, non cumulées).
// `base` = effet de la gravure livres reliques au max (base + légendaire 4 + relique 4), même unité.
// kind : dmg = case de dégâts multiplicative propre, critDmg / critRate = points de critique, ap = Puissance d'attaque %.
// Capitaine de raid dépend du bonus de vitesse de déplacement : pris à +40 % (base et pierre × 0,4).
// Recalés sur le Battle Point lostark.bible (valeurs relevées sur des joueurs réels, 2026-09-30) :
// Super Charge / All-Out Attack comptent pour 0,8 × l'effet affiché (16,8 % au max, 18,6 % avec pierre niv. 3) ;
// Master Brawler vaut 15,3 % au max légendaire et 18,1 % au max relique. Ambush Master : repris de Master Brawler
// (gravure symétrique, pas encore relevée) ; pierre de Master Brawler non relevée.
// Gravures absentes (défensives, utilitaires, support) : la pierre n'ajoute aucun dégât.
window.ABILITY_STONE_EFFECTS = {
  'grudge': { kind: 'dmg', base: 21, stone: [3, 3.75, 5.25, 6] },
  'cursed doll': { kind: 'dmg', base: 17, stone: [3, 3.75, 5.25, 6] },
  'hit master': { kind: 'dmg', base: 17, stone: [3, 3.75, 5.25, 6] },
  'super charge': { kind: 'dmg', base: 16.8, stone: [2.4, 3, 4.2, 4.8] },
  'mass increase': { kind: 'dmg', base: 19, stone: [3, 3.75, 5.25, 6] },
  'barricade': { kind: 'dmg', base: 17, stone: [3, 3.75, 5.25, 6] },
  'all-out attack': { kind: 'dmg', base: 16.8, stone: [2.4, 3, 4.2, 4.8] },
  'stabilized status': { kind: 'dmg', base: 17, stone: [3, 3.75, 5.25, 6] },
  'master brawler': { kind: 'dmg', base: 18.1, stone: [2.7, 3.4, 4.7, 5.4] },
  'ambush master': { kind: 'dmg', base: 18.1, stone: [2.7, 3.4, 4.7, 5.4] },
  'raid captain': { kind: 'dmg', base: 19.2, stone: [3, 3.76, 5.28, 6] },
  'keen blunt weapon': { kind: 'critDmg', base: 52, stone: [7.5, 9.4, 13.2, 15] },
  'precise dagger': { kind: 'critRate', base: 21, stone: [3, 3.75, 5.25, 6] },
  'adrenaline': { kind: 'ap', base: 5.4, stone: [2.85, 3.6, 4.95, 5.7] },
  'ether predator': { kind: 'ap', base: 16.2, stone: [3, 3.75, 5.25, 6] },
  'contender': { kind: 'ap', base: 25.2, stone: [3.6, 4.5, 6.3, 7.2] }
};

// --- LIVRES DE GRAVURE RELIQUES T4 : bonus par niveau relique (wiki Lost Ark, page de chaque gravure) ---
// 5 livres par niveau, 4 niveaux (20 livres). `relic` = bonus relique aux niveaux 1…4 (valeurs totales).
// `base` = effet avec les livres légendaires au max (base + légendaire 4), relique 0. Mêmes `kind` que la pierre.
// Adrénaline : le relique donne du taux critique (à stacks max). Contender : +1 stack par niveau (2,1 % PA/stack).
// Super Charge, All-Out Attack et Master Brawler : recalés sur le Battle Point (cf. ABILITY_STONE_EFFECTS).
window.RELIC_BOOK_EFFECTS = {
  'grudge': { kind: 'dmg', base: 18, relic: [0.75, 1.5, 2.25, 3] },
  'cursed doll': { kind: 'dmg', base: 14, relic: [0.75, 1.5, 2.25, 3] },
  'hit master': { kind: 'dmg', base: 14, relic: [0.75, 1.5, 2.25, 3] },
  'super charge': { kind: 'dmg', base: 14.4, relic: [0.6, 1.2, 1.8, 2.4] },
  'mass increase': { kind: 'dmg', base: 16, relic: [0.75, 1.5, 2.25, 3] },
  'barricade': { kind: 'dmg', base: 14, relic: [0.75, 1.5, 2.25, 3] },
  'all-out attack': { kind: 'dmg', base: 14.4, relic: [0.6, 1.2, 1.8, 2.4] },
  'stabilized status': { kind: 'dmg', base: 14, relic: [0.75, 1.5, 2.25, 3] },
  'master brawler': { kind: 'dmg', base: 15.3, relic: [0.7, 1.4, 2.1, 2.8] },
  'ambush master': { kind: 'dmg', base: 15.3, relic: [0.7, 1.4, 2.1, 2.8] },
  'raid captain': { kind: 'dmg', base: 16, relic: [0.8, 1.6, 2.4, 3.2] },
  'keen blunt weapon': { kind: 'critDmg', base: 44, relic: [2, 4, 6, 8] },
  'precise dagger': { kind: 'critRate', base: 18, relic: [0.75, 1.5, 2.25, 3] },
  'adrenaline': { kind: 'critRate', base: 14, relic: [1.5, 3, 4.5, 6] },
  'ether predator': { kind: 'ap', base: 12.6, relic: [0.9, 1.8, 2.7, 3.6] },
  'contender': { kind: 'ap', base: 16.8, relic: [2.1, 4.2, 6.3, 8.4] }
};

// Recettes de fusion T4 de l'atelier de Forteresse (lostarkcodex.com, recettes 1068610xx / 1068611xx…) :
// une recette par métier, mêmes quantités. Ingrédients = identifiants du marché (prix par lot de 100).
// Grande réussite : production doublée ; chance = 5 % × (1 + bonus de Forteresse).
// Énergie de Forteresse (288 / 360) non chiffrée en or.
window.STRONGHOLD_FUSION_TRADES = [
  { fr: 'Cueillette', en: 'Foraging', mats: ['abidos-wild-flower', 'shy-wild-flower', 'wild-flower'] },
  { fr: 'Bûcheronnage', en: 'Logging', mats: ['abidos-timber', 'tender-timber', 'timber'] },
  { fr: 'Minage', en: 'Mining', mats: ['abidos-iron-ore', 'heavy-iron-ore', 'iron-ore'] },
  { fr: 'Chasse', en: 'Hunting', mats: ['abidos-thick-raw-meat', 'treated-meat', 'thick-raw-meat'] },
  { fr: 'Pêche', en: 'Fishing', mats: ['abidos-solar-carp', 'redflesh-fish', 'fish'] },
  { fr: 'Archéologie', en: 'Excavating', mats: ['abidos-relic', 'rare-relic', 'ancient-relic'] }
];
window.STRONGHOLD_FUSION_RECIPES = [
  { slug: 'abidos-fusion-material', fr: "Fusion d'Abidos", en: 'Abidos Fusion Material',
    qty: [33, 45, 86], gold: 400, minutes: 60, out: 10 },
  { slug: 'superior-abidos-fusion-material', fr: "Fusion d'Abidos supérieure", en: 'Superior Abidos Fusion Material',
    qty: [43, 59, 112], gold: 520, minutes: 75, out: 10 }
];

// Raid de l'ombre Belgardin (sorti en Corée le 2026-08-04). Sources :
// - iLvl d'entrée et PV / chrono de chaque porte : lobal.kr (guide du raid), iLvl confirmés par Stove / MMOHuts.
// - groupes publics (pf) : CP demandés dans les annonces de groupe KR la première semaine (Inven 6271/3976146 et
//   3976548, 2026-08-05 ; surtout des groupes d'essai, pas une garantie de clear). Hard DPS : 5 000 à 5 500 selon le
//   relevé, on garde le plus haut. Même Battle Point qu'en Europe, brassard pas encore monté à ces dates.
// - DPS minimum (DPS seulement) : Nightmare ~6 000-6 500 CP de moyenne avec une exécution propre (retours KR relayés
//   sur r/lostarkgame) ; Normal / Hard en sont déduits au rapport des PV, porte par porte (même chrono dans les trois
//   modes, CP DPS proportionnel aux dégâts : chaque partie du Battle Point est un multiplicateur).
// - premier clear Nightmare : 4 h 53, six joueurs sur huit à 1800 (Inven Global 24475) ; ~8 300 CP de moyenne (relayé
//   sur r/lostarkgame, non vérifié).
window.BELGARDIN_RAID = {
  gates: [{ minutes: 10 }, { minutes: 13 }],
  nightmareMinCp: [6000, 6500],
  firstClearCp: 8300,
  difficulties: [
    { key: 'normal', fr: 'Normal', en: 'Normal', ilvl: 1750, hp: [1.7393e12, 1.9506e12], pf: { dps: 4000, support: 4000 } },
    { key: 'hard', fr: 'Hard', en: 'Hard', ilvl: 1770, hp: [2.7686e12, 3.1340e12], pf: { dps: 5500, support: 5000 } },
    { key: 'nightmare', fr: 'Nightmare', en: 'Nightmare', ilvl: 1780, hp: [4.9516e12, 5.6051e12], pf: { dps: 7000, support: 6500 } }
  ]
};
