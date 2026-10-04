// Benchmark : systèmes du joueur et de la référence.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function extractPlayerSystems(playerChar, isEn = false) {
  if (!playerChar) return {};
  const normClass = normalizeClassName(playerChar.className || '').toLowerCase();
  const isSupport = playerChar.role === 'support' || (playerChar.role !== 'dps' && ['paladin', 'bard', 'artist', 'holyknight', 'valkyrie', 'yinyangshi'].some(s => normClass.includes(s)));
  const cKey = (playerChar.id || playerChar.name || '').toLowerCase().trim();
  const canon = (playerChar.rawProfile ? playerChar : null);

  // 1. Ark Grid Status
  const arkStatus = getArkGridStatus(playerChar) || (canon ? getArkGridStatus(canon) : { hasSun17: false, hasMoon17: false, starTier: 1 });
  // Statut Ark Grid Universel (100% universel pour tout profil importé ou preset)
  const hasSun17 = !!arkStatus.hasSun17;
  const hasMoon17 = !!arkStatus.hasMoon17;
  const starTier = arkStatus.starTier || 1;

  const allBpParts = (playerChar.rawProfile && playerChar.rawProfile.battlePoint && playerChar.rawProfile.battlePoint.parts)
    || (playerChar.battlePoint && playerChar.battlePoint.parts)
    || (playerChar.rawProfile && playerChar.rawProfile.loadout && playerChar.rawProfile.loadout.battlePoint && playerChar.rawProfile.loadout.battlePoint.parts)
    || (playerChar.rawProfile && playerChar.rawProfile.loadouts && playerChar.rawProfile.loadouts[0] && playerChar.rawProfile.loadouts[0].battlePoint && playerChar.rawProfile.loadouts[0].battlePoint.parts)
    || (playerChar.loadout && playerChar.loadout.battlePoint && playerChar.loadout.battlePoint.parts)
    || (canon && canon.rawProfile && canon.rawProfile.battlePoint && canon.rawProfile.battlePoint.parts)
    || (canon && canon.battlePoint && canon.battlePoint.parts)
    || [];

  // 2. Weapon & Gear
  const gear = playerChar.gear 
    || (playerChar.rawProfile && playerChar.rawProfile.gear)
    || (playerChar.loadout && playerChar.loadout.gear)
    || (canon && canon.gear) 
    || { weapon: 17, head: 14, chest: 14, pants: 14, shoulder: 14, gloves: 14 };
  const wLvl = gear.weapon !== undefined ? gear.weapon : 17;
  const avgArmor = Math.round(((gear.head || 14) + (gear.chest || 14) + (gear.pants || 14) + (gear.shoulder || 14) + (gear.gloves || 14)) / 5);

  // Détection Serka (Advanced Ancient T4 Tier 2: décalage de +9 crans d'affinage / +45 iLvl)
  const pIlvlForGear = playerChar.ilvl || (canon && canon.ilvl) || 1750;
  const isSerkaWeapon = !!(gear.isSerkaWeapon || gear.weaponTier === 2 || (pIlvlForGear >= 1735 && wLvl <= 16));
  const serkaArmorCount = gear.serkaArmorCount !== undefined ? gear.serkaArmorCount : (gear.isSerkaArmors ? 5 : ((pIlvlForGear >= 1735 && avgArmor <= 14) ? 5 : 0));
  const isSerkaArmors = serkaArmorCount >= 3;

  const effWLvl = gear.effectiveWeapon !== undefined ? gear.effectiveWeapon : (wLvl + (isSerkaWeapon ? 9 : 0));
  const effAvgArmor = gear.effectiveAvgArmor !== undefined ? gear.effectiveAvgArmor : (avgArmor + (isSerkaArmors ? 9 : 0));

  // Extraction de la qualité réelle de l'arme (type 4 ou property weaponQuality)
  const qPart = allBpParts.find(p => p.type === 4 || p.quality !== undefined);
  const wQual = (qPart && qPart.quality !== undefined)
    ? qPart.quality
    : (playerChar.weaponQuality !== undefined 
        ? playerChar.weaponQuality 
        : (playerChar.rawProfile && playerChar.rawProfile.weaponQuality !== undefined 
            ? playerChar.rawProfile.weaponQuality 
            : (canon && canon.weaponQuality !== undefined ? canon.weaponQuality : 90)));

  // Dégâts additionnels de qualité (ex: 29.21% pour Qualité 98)
  const wQualVal = (qPart && qPart.value !== undefined && qPart.value > 0)
    ? (qPart.value / 100)
    : (playerChar.weaponQualityValue !== undefined && playerChar.weaponQualityValue > 0
        ? (playerChar.weaponQualityValue / 100) 
        : (playerChar.rawProfile && playerChar.rawProfile.weaponQualityValue !== undefined && playerChar.rawProfile.weaponQualityValue > 0
            ? (playerChar.rawProfile.weaponQualityValue / 100) 
            : (10 + (wQual * 0.196))));

  // Bonus d'Affinage Inven (+1.20% net CP par niveau équivalent au-dessus du palier +12)
  const wHoningBonus = Math.max(0, (effWLvl - 12) * WEAPON_HONING_BONUS_PER_LVL);
  const weaponBonusPct = Number((wQualVal + wHoningBonus).toFixed(2));

  // Armures T4 : MainStat + Vitalité/HP des 5 pièces d'armure (+1.37% DPS / +1.50% Supp par niveau moyen équivalent)
  const armorBonusPct = isSupport 
    ? Number((12.00 + (effAvgArmor - 12) * ARMOR_HONING_BONUS_PER_LVL.support).toFixed(2))
    : Number((8.00 + (effAvgArmor - 12) * ARMOR_HONING_BONUS_PER_LVL.dps).toFixed(2));

  // 3. Adv Honing
  const adv = playerChar.advHoning !== undefined 
    ? playerChar.advHoning 
    : (playerChar.rawProfile && playerChar.rawProfile.advHoning !== undefined 
        ? playerChar.rawProfile.advHoning 
        : (canon && canon.advHoning !== undefined ? canon.advHoning : 40));
  const advBonusPct = adv >= 40 ? 8.80 : (adv >= 20 ? 5.50 : (adv >= 10 ? 3.00 : 0.00));

  // 4. Ark Passive Points (Données réelles de Raid)
  const pIlvl = playerChar.ilvl || (canon && canon.ilvl) || 1750;
  const isEndgame = pIlvl >= 1740;
  const ap = playerChar.apPoints || (playerChar.rawProfile && playerChar.rawProfile.apPoints) || (canon && canon.apPoints) || {
    evolution: isEndgame ? 140 : 120,
    enlightenment: isEndgame ? 101 : 88,
    leap: isEndgame ? 70 : 50
  };
  const evoPts = ap.evolution || (isEndgame ? 140 : 120);
  const enlPts = ap.enlightenment || (isEndgame ? 101 : 88);
  const leapPts = ap.leap || (isEndgame ? 70 : 50);

  // 5. Gems
  const gemDesc = getCharacterGemSummary(playerChar, isEn);
  const parts = (typeof extractCharacterGemParts === 'function')
    ? extractCharacterGemParts(playerChar)
    : ((playerChar && Array.isArray(playerChar.gemParts) && playerChar.gemParts.length > 0)
        ? playerChar.gemParts
        : (canon && Array.isArray(canon.gemParts) && canon.gemParts.length > 0 ? canon.gemParts : null));

  let gemBonusPct = 36.00;
  if (parts && parts.length > 0) {
    const gc = countGemLevels(parts, isSupport);
    const weighted = [7, 8, 9, 10].reduce((s, lvl) => s + gc[lvl] * GEM_LEVEL_BONUS_PCT[lvl], 0);
    gemBonusPct = Number((weighted / parts.length).toFixed(2));
  } else {
    if (gemDesc.includes('10')) gemBonusPct = 48.00;
    else if (gemDesc.includes('9')) gemBonusPct = 40.50;
    else if (gemDesc.includes('7')) gemBonusPct = 33.55;
    else gemBonusPct = 36.00;
  }

  // 6. Accessories (Évaluation dynamique des 5 bijoux et des 15 lignes d'affinage T4)
  const accEval = evaluateCharacterAccessories(playerChar, isSupport, isEn);
  const accLabel = accEval.label;
  const accBonusPct = accEval.bonusPct;

  // 7. Engravings & Ability Stone
  const spec = getCharacterSpecName(playerChar);

  const engParts = allBpParts.filter(p => p.type === 10 || p.type === 11 || (p.grade && p.grade.includes('engrave')));
  let engBonusPct = 101.94;
  let hasRealEng = false;
  if (engParts.length > 0) {
    const sumVal = engParts.reduce((s, p) => s + (p.value || 0), 0);
    if (sumVal > 0) {
      engBonusPct = Number((sumVal / 100).toFixed(2));
      hasRealEng = true;
    }
  } else {
    const gravItems = (Array.isArray(playerChar.items) && playerChar.items.filter(i => i.cat === 'Gravures').length > 0)
      ? playerChar.items.filter(i => i.cat === 'Gravures')
      : ((canon && Array.isArray(canon.items) && canon.items.filter(i => i.cat === 'Gravures').length > 0)
          ? canon.items.filter(i => i.cat === 'Gravures')
          : []);
    if (gravItems.length > 0) {
      const sumVal = gravItems.reduce((s, it) => s + (parseFloat((it.val || it.mult || '0').replace(/[^0-9.]/g, '')) || 0), 0);
      if (sumVal > 50) {
        engBonusPct = Number(sumVal.toFixed(2));
        hasRealEng = true;
      }
    }
  }

  // Libellé lu sur les gravures du profil : livres reliques terminés (20/20) sur le nombre de gravures équipées
  const rawP = playerChar.rawProfile || playerChar;
  const engList = rawP.engravings || (rawP.loadout && rawP.loadout.engravings) || [];
  const engRelic = engList.filter(e => relicBooksRead(e) === RELIC_MAX_BOOKS).length;
  const stoneNotice = hasRealEng ? (isEn ? ` (Stone & Relic: +${engBonusPct.toFixed(2)}%)` : ` (Pierre & Relique : +${engBonusPct.toFixed(2)} %)`) : "";
  const engLabel = (engList.length
    ? (isEn ? `${spec}, ${engRelic}/${engList.length} relic engravings 20/20` : `${spec}, ${engRelic}/${engList.length} gravures reliques 20/20`)
    : spec) + stoneNotice;

  // 7b. Main Stat & Base AP (Type 1)
  const t1Part = allBpParts.find(p => p.type === 1);
  const mainStatName = getMainStatName(playerChar.className || '', isEn);
  let baseAtkLabel = '';
  let baseAtkBonusPct = 37.00;
  if (t1Part) {
    const mStat = t1Part.mainStat || 0;
    const bAp = t1Part.baseAttackPower || 0;
    const mStatK = (mStat / 1000).toFixed(0);
    const bApK = (bAp / 1000).toFixed(1);
    baseAtkLabel = `${mainStatName} ${mStatK}k (${bApK}k AP)`;
    baseAtkBonusPct = Number((bAp / 5000).toFixed(2));
  } else {
    const fallbackMStat = playerChar.mainStat || (pIlvl >= 1770 ? 735000 : (pIlvl >= 1750 ? 690000 : 640000));
    baseAtkLabel = `${mainStatName} ${(fallbackMStat / 1000).toFixed(0)}k`;
    baseAtkBonusPct = Number((fallbackMStat / 20000).toFixed(2));
  }

  // 7c. Combat Stats (Type 26: Crit / Spec / Swift)
  const t26Part = allBpParts.find(p => p && (p.type === 26 || p.total));
  let totalPtsNum = t26Part && t26Part.total ? t26Part.total : 0;
  if (!totalPtsNum && t26Part && t26Part.value) {
    totalPtsNum = isSupport ? Math.round(t26Part.value / 4) : Math.round(t26Part.value / 3);
  }
  if (!totalPtsNum) {
    totalPtsNum = pIlvl >= 1770 ? 2495 : (pIlvl >= 1750 ? 2386 : 2280);
  }

  // Normalisation unifiée : Support base 2500 pts = 100% (+0.04%/pt), DPS base 2500 pts = 75% (+0.03%/pt)
  let combatStatsBonusPct = isSupport
    ? Number(((totalPtsNum / 2500) * 100).toFixed(2))
    : Number((totalPtsNum * 0.03).toFixed(2));
  const totalPtsLabel = ` (${formatNumber(totalPtsNum)} pts)`;
  let combatStatsLabel = isEn
    ? `Combat Stats${totalPtsLabel} (+${combatStatsBonusPct.toFixed(2)}%)`
    : `Stats de Combat${totalPtsLabel} (+${combatStatsBonusPct.toFixed(2)}%)`;

  // 8. Ark Grid Percentages & Labels (Calcul dynamique sur battlePoint.parts type 29 pour Soleil, Lune, Étoile)
  const coreParts = (Array.isArray(allBpParts) && allBpParts.length > 0)
    ? allBpParts.filter(p => p.type === 29)
    : [];

  const rawCores = (playerChar && (playerChar.arkGridCores || (playerChar.loadout && playerChar.loadout.arkGridCores) || (playerChar.rawProfile && (playerChar.rawProfile.arkGridCores || (playerChar.rawProfile.loadout && playerChar.rawProfile.loadout.arkGridCores)))))
    || (canon && (canon.arkGridCores || (canon.rawProfile && canon.rawProfile.arkGridCores)))
    || [];

  function evalCoreGroup(prefixes, nameFr, nameEn, fallbackBonus, fallbackTier) {
    const matching = coreParts.filter(p => {
      const s = (p.id || '').toString();
      return prefixes.some(pr => s.startsWith(pr));
    });

    // Compléter tout cœur manquant (ex: 67312 Chaos Star Support exclu de Bible parts29, ou profil entier sans parts29)
    if (Array.isArray(rawCores) && rawCores.length > 0) {
      prefixes.forEach(pr => {
        const alreadyMatched = matching.some(p => (p.id || '').toString().startsWith(pr));
        if (!alreadyMatched) {
          const raw = rawCores.find(c => {
            const idStr = (c.id || '').toString();
            return idStr.startsWith(pr);
          });
          if (raw) {
            const pts = Array.isArray(raw.gems)
              ? raw.gems.reduce((s, g) => s + (g.corePoints || 0), 0)
              : (raw.points || 17);
            const isAncient = ((raw.id || 0) % 10 === 6) || raw.grade === 'ancient';
            const bonusValPct = getArkGridCoreBonus(pr, pts, isSupport, isAncient);
            matching.push({
              id: raw.id,
              points: pts,
              value: Math.round(bonusValPct * 100),
              fromRaw: true
            });
          }
        }
      });
    }

    if (matching.length > 0) {
      let mult = 1;
      let maxPoints = 0;
      let hasAncient = false;
      let hasRelic = false;
      matching.forEach(p => {
        const val = ('value' in p ? p.value : p.min) || 0;
        mult *= (1 + val / 10000);
        if (p.points && p.points > maxPoints) maxPoints = p.points;
        const gradeDigit = (p.id || 0) % 10;
        if (gradeDigit === 6) hasAncient = true;
        else if (gradeDigit === 5) hasRelic = true;
      });
      const bonusPct = Number(((mult - 1) * 100).toFixed(2));
      // Points de chaque cœur (Ordre puis Chaos), pas seulement le maximum
      const corePts = prefixes.map((pr, k) => {
        const part = matching.find(p => (p.id || '').toString().startsWith(pr));
        if (!part || !part.points) return null;
        const kind = k === 0 ? (isEn ? 'Order' : 'Ordre') : 'Chaos';
        return `${kind} ${part.points}P`;
      }).filter(Boolean);
      const ptsStr = corePts.length
        ? corePts.join(' · ')
        : (maxPoints > 0 ? (isEn ? `Tier ${maxPoints}P` : `Palier ${maxPoints}P`) : (isEn ? 'Tier 17P+' : 'Palier 17P+'));
      const gradeStr = (hasAncient && !hasRelic)
        ? (isEn ? 'Ancient' : 'Ancien')
        : (hasRelic && !hasAncient ? (isEn ? 'Relic' : 'Relique') : (hasAncient ? (isEn ? 'Ancient/Relic' : 'Ancien/Relique') : ''));
      const label = isEn
        ? `${gradeStr ? gradeStr + ' ' : ''}${ptsStr} (${nameEn}: +${bonusPct.toFixed(2)}%)`.trim()
        : `${gradeStr ? gradeStr + ' ' : ''}${ptsStr} (${nameFr} : +${bonusPct.toFixed(2)}%)`.trim();
      return { bonusPct, label };
    }
    // Fallback si battlePoint.parts type 29 absent
    const bonusPct = fallbackBonus;
    const label = isEn
      ? `Tier ${fallbackTier}P (${nameEn}: +${bonusPct.toFixed(2)}%)`
      : `Palier ${fallbackTier}P (${nameFr} : +${bonusPct.toFixed(2)}%)`;
    return { bonusPct, label };
  }

  const defaultSunBonus = hasSun17 ? (isSupport ? 7.00 : 10.50) : (isSupport ? 4.50 : 6.00);
  const sunEval = evalCoreGroup(['67300', '67310'], 'Cœurs Soleil', 'Sun Cores', defaultSunBonus, hasSun17 ? 17 : 10);
  const sunBonusPct = sunEval.bonusPct;
  const sunLabel = sunEval.label;

  const defaultMoonBonus = hasMoon17 ? (isSupport ? 7.00 : 10.50) : (isSupport ? 4.50 : 6.00);
  const moonEval = evalCoreGroup(['67301', '67311'], 'Cœurs Lune', 'Moon Cores', defaultMoonBonus, hasMoon17 ? 17 : 10);
  const moonBonusPct = moonEval.bonusPct;
  const moonLabel = moonEval.label;

  let defaultStarBonus = isSupport ? 4.00 : 6.00;
  let defaultStarTier = 10;
  if (starTier >= 3) { defaultStarBonus = isSupport ? 6.00 : 8.15; defaultStarTier = 17; }
  else if (starTier >= 2) { defaultStarBonus = isSupport ? 5.00 : 7.20; defaultStarTier = 14; }
  const starEval = evalCoreGroup(['67302', '67312'], 'Cœurs Étoile', 'Star Cores', defaultStarBonus, defaultStarTier);
  const starBonusPct = starEval.bonusPct;
  const starLabel = starEval.label;

  const weaponNameStr = isSerkaWeapon
    ? (isEn ? `T4 Serka Weapon +${wLvl} (Eq. +${effWLvl})` : `Arme T4 Serka +${wLvl} (Éq. +${effWLvl})`)
    : (isEn ? `T4 Weapon +${wLvl}` : `Arme T4 +${wLvl}`);
  const weaponLabel = `${weaponNameStr} (${isEn ? 'Quality' : 'Qualité'} ${wQual})`;

  const armorsLabel = isSerkaArmors
    ? (isEn ? `T4 Serka Armor Avg +${avgArmor} (Eq. +${effAvgArmor})` : `Armures T4 Serka Moyenne +${avgArmor} (Éq. +${effAvgArmor})`)
    : (isEn ? `T4 Armor Avg +${avgArmor}` : `Armures T4 Moyenne +${avgArmor}`);

  const advLabel = isEn
    ? `T4 Advanced Honing +${adv} ${adv >= 40 ? 'complete' : ''}`.trim()
    : `Affinage Avancé +${adv} ${adv >= 40 ? 'complet' : ''}`.trim();

  // Karma : parties type 8 (Évolution, 3,60 % au rang 6) et 9 (Bond) du Battle Point ; repli sur le rang 6 sans Battle Point
  const karmaParts = allBpParts.filter(p => p && (p.type === 8 || p.type === 9) && Number.isFinite(p.value));
  const karmaBonusPct = karmaParts.length ? Number((karmaParts.reduce((m, p) => m * (1 + p.value / 1e4), 1) * 100 - 100).toFixed(2)) : 3.60;
  const karmaLabel = karmaParts.length
    ? (isEn ? `Karma Evolution & Leap (+${karmaBonusPct.toFixed(2)}%)` : `Karma Évolution & Bond (+${karmaBonusPct.toFixed(2)} %)`)
    : (isEn ? "Karma Evolution Rank 6" : "Karma Évolution Rang 6");

  // 8b. Astrogemmes de la Grille d'Ark
  let astroBonusPct = isSupport ? 3.50 : 4.80;
  const bpParts = (playerChar.astrogems && playerChar.astrogems.length > 0)
    ? playerChar.astrogems
    : (allBpParts.length > 0 ? allBpParts.filter(p => p.type === 31 || p.type === 32) : []);
  if (Array.isArray(bpParts) && bpParts.length > 0) {
    const astros = bpParts.filter(p => p.type === 31 || p.type === 32);
    if (astros.length > 0) {
      // Chaque partie est un multiplicateur 1 + v / 10 000 du Battle Point
      const mult = astros.reduce((m, p) => m * (1 + (p.value || 0) / 1e4), 1);
      astroBonusPct = Number(((mult - 1) * 100).toFixed(2));
    }
  }
  const astroLabel = isEn
    ? `Astrogems (+${astroBonusPct.toFixed(2)}% DPS/Buff Substats)`
    : `Astrogemmes (+${astroBonusPct.toFixed(2)}% Sous-stats Grille)`;

  // 8c. Bracelet T4 / Relique (Calcul fidèle sur lostark.bible battlePoint & items)
  let brBonusPct = isSupport ? 18.50 : 10.20;
  let brPerkNames = [];
  let hasRealBr = false;

  // A. Calcul précis via battlePoint.parts (types 19, 20 & 21 pour DPS et Support)
  if (Array.isArray(allBpParts) && allBpParts.length > 0) {
    const brParts = allBpParts.filter(p => [19, 20, 21].includes(p.type) && (('value' in p ? p.value : p.min) || 0) > 0);
    if (brParts.length > 0) {
      let t = 1;
      for (const p of brParts) {
        const val = ('value' in p ? p.value : p.min) || 0;
        t *= (1 + val / 10000);
      }
      brBonusPct = Number(((t * 100) - 100).toFixed(2));
      hasRealBr = true;
    }
  }

  // B. Fallback via items (cat: 'Bracelet')
  if (!hasRealBr) {
    const brItems = (Array.isArray(playerChar.items) ? playerChar.items.filter(i => i.cat === 'Bracelet') : [])
      || (playerChar.rawProfile && Array.isArray(playerChar.rawProfile.items) ? playerChar.rawProfile.items.filter(i => i.cat === 'Bracelet') : [])
      || (canon && Array.isArray(canon.items) ? canon.items.filter(i => i.cat === 'Bracelet') : []);
    if (brItems.length > 0) {
      let t = 1;
      let foundMult = false;
      for (const it of brItems) {
        if (it.mult && it.mult.includes('%')) {
          const mVal = parseFloat(it.mult.replace('+', '').replace('%', '')) || 0;
          if (mVal > 0) {
            t *= (1 + mVal / 100);
            foundMult = true;
          }
        }
      }
      if (foundMult) {
        brBonusPct = Number(((t * 100) - 100).toFixed(2));
        hasRealBr = true;
      }
    }
  }

  // C. Fallback par défaut selon iLvl
  if (!hasRealBr) {
    if (isSupport) {
      brBonusPct = pIlvl >= 1770 ? 18.50 : (pIlvl >= 1750 ? 15.00 : 12.00);
    } else {
      brBonusPct = pIlvl >= 1770 ? 10.20 : (pIlvl >= 1750 ? 8.16 : 6.50);
    }
  }

  // Extraction des noms de perks pour le label
  const brItemObj = (playerChar.bracelet) 
    || (playerChar.loadout && Array.isArray(playerChar.loadout.items) && playerChar.loadout.items.find(i => i.slot === 'bracelet'))
    || (playerChar.rawProfile && playerChar.rawProfile.loadout && Array.isArray(playerChar.rawProfile.loadout.items) && playerChar.rawProfile.loadout.items.find(i => i.slot === 'bracelet'))
    || (playerChar.rawProfile && playerChar.rawProfile.rawItems && playerChar.rawProfile.rawItems.find(i => i.slot === 'bracelet'))
    || null;

  if (brItemObj && brItemObj.data && Array.isArray(brItemObj.data.stats)) {
    brItemObj.data.stats.forEach(st => {
      if (st.type === 3 || st.type === 4 || st.index > 1000) {
        const perk = (typeof BIBLE_BRACELET_PERKS !== 'undefined' && BIBLE_BRACELET_PERKS[st.index]);
        const pName = perk ? (isEn ? (perk.nameEn || perk.name) : perk.name) : null;
        if (pName && !brPerkNames.includes(pName)) brPerkNames.push(pName);
      }
    });
  }

  if (brPerkNames.length === 0) {
    const brTextItems = (Array.isArray(playerChar.items) ? playerChar.items.filter(i => i.cat === 'Bracelet') : [])
      || (playerChar.rawProfile && Array.isArray(playerChar.rawProfile.items) ? playerChar.rawProfile.items.filter(i => i.cat === 'Bracelet') : []);
    brTextItems.forEach(it => {
      const lbl = it.label || '';
      if (typeof BIBLE_BRACELET_PERKS !== 'undefined') {
        for (const [k, v] of Object.entries(BIBLE_BRACELET_PERKS)) {
          if (lbl.includes(v.name) || (v.nameEn && lbl.includes(v.nameEn))) {
            const pName = isEn ? (v.nameEn || v.name) : v.name;
            if (!brPerkNames.includes(pName)) brPerkNames.push(pName);
          }
        }
      }
    });
  }

  let brSummaryPerks = brPerkNames.length > 0 ? brPerkNames.join(' + ') : (isEn ? "Main Stats + Perk" : "Stats principales + Passif");
  const braceletLabel = isEn 
    ? `Relic (${brSummaryPerks}: +${brBonusPct.toFixed(2)}%)` 
    : `Relique (${brSummaryPerks} : +${brBonusPct.toFixed(2)}%)`;

  return {
    engravings: { label: engLabel, bonusPct: engBonusPct, estimated: !hasRealEng },
    baseAttackStat: { label: baseAtkLabel, bonusPct: baseAtkBonusPct },
    combatStats: { label: combatStatsLabel, bonusPct: combatStatsBonusPct },
    arkEvolution: { label: `${evoPts} Pts ${isEn ? 'Evolution' : 'Évolution'}`, bonusPct: Number((evoPts * 0.15).toFixed(2)) },
    arkEnlightenment: { label: `${enlPts} Pts ${isEn ? 'Enlightenment' : 'Illumination'}`, bonusPct: Number((enlPts * 0.28).toFixed(2)) },
    arkLeap: { label: `${leapPts} Pts ${isEn ? 'Leap' : 'Saut'}`, bonusPct: Number((leapPts * 0.20).toFixed(2)) },
    arkGridSun: { label: sunLabel, bonusPct: sunBonusPct },
    arkGridMoon: { label: moonLabel, bonusPct: moonBonusPct },
    arkGridStar: { label: starLabel, bonusPct: starBonusPct },
    arkGridAstrogems: { label: astroLabel, bonusPct: astroBonusPct },
    weapon: { label: weaponLabel, bonusPct: weaponBonusPct, quality: wQual, qualityVal: wQualVal, wLvl, effWLvl, isSerka: isSerkaWeapon },
    // Écart chiffré par le GPD (benchmarkGpdGains) ; bonusPct 0 : le repli de l'arme compte déjà la qualité
    weaponQuality: {
      label: isSupport
        ? (isEn ? `Quality ${wQual} (no effect on buffs)` : `Qualité ${wQual} (sans effet sur le buff)`)
        : (isEn ? `Quality ${wQual} (+${wQualVal.toFixed(2)}% additional damage)` : `Qualité ${wQual} (+${wQualVal.toFixed(2)} % dégâts additionnels)`),
      bonusPct: 0
    },
    armors: { label: armorsLabel, bonusPct: Number(armorBonusPct.toFixed(2)), avgArmor, effAvgArmor, isSerka: isSerkaArmors, serkaArmorCount },
    advHoning: { label: advLabel, bonusPct: advBonusPct },
    accessories: { label: accLabel, bonusPct: accBonusPct },
    bracelet: { label: braceletLabel, bonusPct: brBonusPct, fromBattlePoint: hasRealBr },
    gems: { label: gemDesc, bonusPct: gemBonusPct },
    karma: { label: karmaLabel, bonusPct: karmaBonusPct }
  };
}

function resolveTargetSystems(target, isEn = false) {
  if (!target) return {};
  let sys = {};

  // Si le target possède des données réelles de profil, on extrait fidèlement selon la langue demandée
  if (target.battlePoint || target.rawProfile || target.loadout || target.gear) {
    sys = extractPlayerSystems(target, isEn);
  } else if (target.systems && Object.keys(target.systems).length > 0) {
    sys = JSON.parse(JSON.stringify(target.systems));
  } else {
    sys = extractPlayerSystems(target, isEn);
  }

  const ilvl = target.ilvl || 1750;
  const isSupport = target.role === 'support' || (target.role !== 'dps' && ['paladin', 'bard', 'artist', 'valkyrie'].some(s => (target.className || '').toLowerCase().includes(s)));

  // Garde-fou 1 : Gravures Reliques T4 (Support: ~125-135%, DPS: ~101-105%)
  if (isSupport) {
    if (!sys.engravings || !sys.engravings.bonusPct || sys.engravings.bonusPct < 110) {
      const engVal = ilvl >= 1770 ? 134.50 : (ilvl >= 1750 ? 133.89 : 125.00);
      const specName = target.spec || (target.className || (isEn ? 'Support' : 'Support'));
      const stoneBonus = isEn
        ? (ilvl >= 1770 ? ` (Stone +3/+4 & Relic: +${engVal.toFixed(2)}%)` : ` (Stone +2/+3 & Relic: +${engVal.toFixed(2)}%)`)
        : (ilvl >= 1770 ? ` (Pierre +3/+4 & Relique: +${engVal.toFixed(2)}%)` : ` (Pierre +2/+3 & Relique: +${engVal.toFixed(2)}%)`);
      sys.engravings = {
        label: (isEn ? `${specName}, relic engravings (estimate)` : `${specName}, gravures reliques (estimation)`) + stoneBonus,
        bonusPct: engVal,
        estimated: true
      };
    }
  } else {
    if (!sys.engravings || !sys.engravings.bonusPct || sys.engravings.bonusPct < 60) {
      const engVal = ilvl >= 1770 ? 104.24 : 101.94;
      const specName = target.spec || (target.className || (isEn ? 'Class' : 'Classe'));
      const stoneBonus = isEn
        ? (ilvl >= 1770 ? ` (Stone +3/+4 & Relic: +${engVal.toFixed(2)}%)` : ` (Stone +2/+3 & Relic: +${engVal.toFixed(2)}%)`)
        : (ilvl >= 1770 ? ` (Pierre +3/+4 & Relique: +${engVal.toFixed(2)}%)` : ` (Pierre +2/+3 & Relique: +${engVal.toFixed(2)}%)`);
      sys.engravings = {
        label: (isEn ? `${specName}, relic engravings (estimate)` : `${specName}, gravures reliques (estimation)`) + stoneBonus,
        bonusPct: engVal,
        estimated: true
      };
    }
  }

  // Garde-fou 2 : Main Stat & Base AP (ne peut JAMAIS être <= 10% pour un profil T4 1700+)
  if (!sys.baseAttackStat || !sys.baseAttackStat.bonusPct || sys.baseAttackStat.bonusPct <= 10) {
    const mStatK = ilvl >= 1770 ? 735 : (ilvl >= 1750 ? 690 : 640);
    const bApK = ilvl >= 1770 ? 185.0 : (ilvl >= 1750 ? 172.5 : 160.0);
    const mStatName = getMainStatName(target.className || '', isEn);
    const bPct = Number((ilvl >= 1770 ? 37.00 : (ilvl >= 1750 ? 34.50 : 32.00)).toFixed(2));
    sys.baseAttackStat = {
      label: `${mStatName} ${mStatK}k (${bApK}k AP)`,
      bonusPct: bPct
    };
  }

  // Garde-fou 3 : Combat Stats (Support base 2500 pts = 100%, DPS base 2500 pts = 75%)
  if (isSupport) {
    if (!sys.combatStats || !sys.combatStats.bonusPct || sys.combatStats.bonusPct < 85) {
      const defaultPts = ilvl >= 1770 ? 2500 : (ilvl >= 1750 ? 2450 : 2380);
      const cPct = Number(((defaultPts / 2500) * 100).toFixed(2));
      sys.combatStats = {
        label: isEn ? `Combat Stats (${formatNumber(defaultPts)} pts) (+${cPct.toFixed(2)}%)` : `Stats de Combat (${formatNumber(defaultPts)} pts) (+${cPct.toFixed(2)}%)`,
        bonusPct: cPct
      };
    }
  } else {
    if (!sys.combatStats || !sys.combatStats.bonusPct || sys.combatStats.bonusPct <= 10) {
      const defaultPts = ilvl >= 1770 ? 2500 : (ilvl >= 1750 ? 2450 : 2380);
      const cPct = Number((defaultPts * 0.03).toFixed(2));
      sys.combatStats = {
        label: isEn ? `Combat Stats (${formatNumber(defaultPts)} pts) (+${cPct.toFixed(2)}%)` : `Stats de Combat (${formatNumber(defaultPts)} pts) (+${cPct.toFixed(2)}%)`,
        bonusPct: cPct
      };
    }
  }

  // Garde-fou 4 : Astrogemmes Grille d'Ark
  if (!sys.arkGridAstrogems || !sys.arkGridAstrogems.bonusPct || sys.arkGridAstrogems.bonusPct <= 0) {
    const aPct = Number((ilvl >= 1770 ? 7.52 : (ilvl >= 1750 ? 5.80 : (isSupport ? 3.50 : 4.80))).toFixed(2));
    sys.arkGridAstrogems = {
      label: isEn ? `Astrogems (+${aPct.toFixed(2)}% DPS/Buff Substats)` : `Astrogemmes (+${aPct.toFixed(2)}% Sous-stats Grille)`,
      bonusPct: aPct
    };
  }

  // Garde-fou 4b : Bracelet T4 / Relique
  if (!sys.bracelet || !sys.bracelet.bonusPct || sys.bracelet.bonusPct <= 0) {
    const defBrVal = isSupport
      ? (ilvl >= 1770 ? 18.50 : 15.00)
      : (ilvl >= 1770 ? 10.20 : 8.16);
    const defPerks = isSupport
      ? (isEn ? "Dagger + Cheers" : "Poignard + Ovation")
      : (isEn ? "Fervor + Wedge" : "Ferveur + Coinçage");
    sys.bracelet = {
      label: isEn ? `Relic (${defPerks}: +${defBrVal.toFixed(2)}%)` : `Relique (${defPerks} : +${defBrVal.toFixed(2)}%)`,
      bonusPct: defBrVal
    };
  }

  // Garde-fou 5 : Karma
  if (!sys.karma || !sys.karma.bonusPct) {
    sys.karma = {
      label: isEn ? "Karma Evolution Rank 6" : "Karma Évolution Rang 6",
      bonusPct: 3.60
    };
  }

  // Traduction Lost Ark officielle des labels selon la langue demandée
  for (const [k, v] of Object.entries(sys)) {
    if (v && v.label) {
      v.label = isEn ? formatLostArkEnglish(v.label) : formatLostArkFrench(v.label);
    }
  }

  return sys;
}


function computeGemUpgradeCost(player, target) {
  if (!player || !target) return 0;
  const pGems = extractCharacterGemParts(player) || [];
  const tGems = extractCharacterGemParts(target) || [];
  
  // Coût cumulé pour amener une gemme du Niv. 7 à son niveau (mêmes coûts unitaires que le GPD)
  const levelOf = (val) => {
    if (val >= 12.0 || (val >= 6.9 && val <= 7.1)) return 10;
    if (val >= 10.7 || (val >= 6.3 && val <= 6.4)) return 9;
    if (val >= 9.5 || (val >= 5.7 && val <= 5.8)) return 8;
    return 7;
  };
  const getGemValue = (val) => {
    let total = 0;
    for (let l = 7; l < levelOf(val); l++) total += GEM_UPGRADE_COST[l];
    return total;
  };
  
  let pVal = 0; pGems.forEach(g => pVal += getGemValue(g));
  let tVal = 0; tGems.forEach(g => tVal += getGemValue(g));
  
  const diff = tVal - pVal;
  return Math.max(0, diff); // 0 : hors plan d'achat
}


// Écart de CP d'un système entre joueur (p) et référence (t) : les systèmes se multiplient,
// donc l'écart est le gain relatif (1 + t) / (1 + p) − 1 appliqué au CP du joueur.
// Positif : la référence est devant ; négatif : le joueur est devant.
// Une valeur « estimée » (donnée absente, remplacée par une valeur par défaut) ne crée pas d'écart
function isEstimatedPair(p, t) {
  return !!((p && p.estimated) || (t && t.estimated));
}

function systemGapCp(pPct, tPct, cp) {
  const base = cp && cp > 1000 ? cp : 3800;
  return base * ((1 + (tPct || 0) / 100) / (1 + (pPct || 0) / 100) - 1);
}
