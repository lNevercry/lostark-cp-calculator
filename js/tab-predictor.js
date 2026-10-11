// Onglets 1 et 2 : prédicteur iLvl → CP et simulateur d'affinage.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function updatePredictorView() {
  const { currentIlvl, currentCp, targetIlvl, role, gemBonus } = state;

  // Synchronisation des labels de saisie
  dom.dispCurrentIlvl.textContent = currentIlvl.toFixed(2);
  dom.sliderCurrentIlvl.value = currentIlvl;
  dom.numCurrentIlvl.value = currentIlvl;

  dom.dispCurrentCp.textContent = formatNumber(currentCp);
  dom.sliderCurrentCp.value = currentCp;
  dom.numCurrentCp.value = currentCp;

  dom.dispTargetIlvl.textContent = targetIlvl.toFixed(2);
  dom.sliderTargetIlvl.value = targetIlvl;
  dom.numTargetIlvl.value = targetIlvl;

  // Calcul de la prédiction
  const pred = predictCp(currentIlvl, currentCp, targetIlvl, role, gemBonus);

  // Affichage des chiffres clés
  dom.resTargetIlvlText.textContent = targetIlvl.toFixed(2);
  dom.predictedCp.textContent = formatNumber(pred.predictedCp);
  dom.predictedRange.textContent = isEnLang()
    ? `Estimated range : ${formatNumber(pred.minCp)} – ${formatNumber(pred.maxCp)} CP`
    : `Fourchette estimée : ${formatNumber(pred.minCp)} – ${formatNumber(pred.maxCp)} CP`;

  const sign = pred.diffCp >= 0 ? '+' : '';
  dom.diffCp.textContent = `${sign}${formatNumber(pred.diffCp)} CP`;
  dom.diffCp.className = `stat-val ${pred.diffCp >= 0 ? 'positive' : 'stat-val'}`;

  const ilvlSign = pred.diffIlvl >= 0 ? '+' : '';
  dom.diffIlvl.textContent = `${ilvlSign}${pred.diffIlvl.toFixed(2)} iLvl`;

  dom.efficiencyCp.textContent = `${pred.slope} CP / iLvl`;
  dom.bracketText.textContent = getCpBracket(pred.predictedCp);

  // Jauge visuelle (sur base 1640 - 1800)
  const minScale = 1640;
  const maxScale = 1800;
  const currPct = Math.min(100, Math.max(0, ((currentIlvl - minScale) / (maxScale - minScale)) * 100));
  const targetPct = Math.min(100, Math.max(0, ((targetIlvl - minScale) / (maxScale - minScale)) * 100));

  dom.gaugeCurrent.style.width = `${currPct}%`;
  dom.gaugeTarget.style.width = `${targetPct}%`;
  dom.gaugeCenterLabel.textContent = isEnLang() ? `Current: ${currentIlvl.toFixed(1)}` : `Actuel : ${currentIlvl.toFixed(1)}`;

  if (dom.sliderTargetIlvl) {
    dom.sliderTargetIlvl.min = Math.floor(currentIlvl);
  }
  if (dom.numTargetIlvl) {
    dom.numTargetIlvl.min = Math.floor(currentIlvl);
  }

  // Texte d'analyse dynamique intelligent
  updateAnalysisText(currentIlvl, targetIlvl, pred);
}

function updateAnalysisText(currentIlvl, targetIlvl, pred) {
  const isEn = isEnLang();
  let msg = '';
  const diff = Math.max(0, targetIlvl - currentIlvl);

  if (diff === 0) {
    msg = isEn
      ? `You are at your current iLvl (${currentIlvl.toFixed(2)}). Select a higher target iLvl to view CP projection.`
      : `Tu es exactement sur ton iLvl actuel (${currentIlvl.toFixed(2)}). Choisis un iLvl cible supérieur pour voir la projection de CP.`;
  } else {
    if (pred.mode === 'honing' && pred.path) {
      const names = isEn
        ? { weapon: 'Weapon', head: 'Head', shoulder: 'Shoulders', chest: 'Chest', pants: 'Pants', gloves: 'Gloves' }
        : { weapon: 'Arme', head: 'Tête', shoulder: 'Épaules', chest: 'Torse', pants: 'Jambes', gloves: 'Gants' };
      const steps = pred.path.steps.map(st => `${names[st.slot]} +${st.from} ➔ +${st.to}`).join(', ');
      msg = isEn
        ? `<strong>Cheapest honing path on your real gear:</strong> ${steps}. Expected cost <strong>${formatNumber(Math.round(pred.path.gold))} g</strong> (game recipes, ${pred.path.owned ? 'your bound materials first, then market prices' : 'market prices'}), for <strong>+${formatNumber(pred.diffCp)} CP</strong> (${pred.slope} CP / iLvl). Every +1 is worth the same iLvl whatever the piece, so the cheapest steps (mostly armor) come first; raising the weapon gives about 5 times more CP per iLvl but costs much more.`
        : `<strong>Chemin d'affinage le moins cher sur ton vrai stuff :</strong> ${steps}. Coût attendu <strong>${formatNumber(Math.round(pred.path.gold))} or</strong> (recettes du jeu, ${pred.path.owned ? 'tes matériaux liés d\'abord, puis prix du marché' : 'prix du marché'}), pour <strong>+${formatNumber(pred.diffCp)} CP</strong> (${pred.slope} CP / iLvl). Chaque +1 vaut le même iLvl quelle que soit la pièce : les paliers les moins chers (surtout les armures) passent d'abord ; l'arme rapporte environ 5 fois plus de CP par iLvl mais coûte bien plus cher.`;
    } else if (pred.mode === 'honing') {
      msg = isEn
        ? `<strong>Pure Honing Gain (Gear Only):</strong> Going from <strong>${currentIlvl.toFixed(2)}</strong> to <strong>${targetIlvl.toFixed(2)}</strong> (+${diff.toFixed(2)} iLvl) grants approx. <strong>+${formatNumber(pred.diffCp)} CP</strong> (<strong>${pred.slope} CP / iLvl</strong>, average for the cheapest path, mostly armor; the weapon gives about 5 times more per iLvl). Estimate without an imported character: import yours for the real path, its cost and its CP.`
        : `<strong>Gain d'Affinage Pur (Stuff Seul) :</strong> Passer de <strong>${currentIlvl.toFixed(2)}</strong> à <strong>${targetIlvl.toFixed(2)}</strong> (+${diff.toFixed(2)} iLvl) confère environ <strong>+${formatNumber(pred.diffCp)} CP</strong> (<strong>${pred.slope} CP / iLvl</strong>, moyenne du chemin le moins cher, surtout des armures ; l'arme rapporte environ 5 fois plus par iLvl). Estimation sans personnage importé : importe le tien pour le chemin réel, son coût et son CP.`;
    } else {
      msg = isEn
        ? `<strong>Overall Build Projection (Endgame T4):</strong> Going from <strong>${currentIlvl.toFixed(2)}</strong> to <strong>${targetIlvl.toFixed(2)}</strong> (+${diff.toFixed(2)} iLvl) projects your character toward <strong>${formatNumber(pred.predictedCp)} CP</strong> (+${formatNumber(pred.diffCp)} CP). <em>Note: This global projection assumes parallel progression (Lvl. 9/10 Gems, T4 Karma, and Relic Engravings).</em>`
        : `<strong>Projection de Build Global (Endgame T4) :</strong> Passer de <strong>${currentIlvl.toFixed(2)}</strong> à <strong>${targetIlvl.toFixed(2)}</strong> (+${diff.toFixed(2)} iLvl) projette ton personnage vers <strong>${formatNumber(pred.predictedCp)} CP</strong> (+${formatNumber(pred.diffCp)} CP). <em>Note : Cette projection globale suppose que tu fasses évoluer ton build en parallèle (montée des Gemmes Niv. 9/10, Karma T4 et Gravures Reliques).</em>`;
    }
  }

  if (state.gemBonus > 0) {
    msg += isEn
      ? ` <em>(Gem upgrade bonus of +${state.gemBonus} CP included in estimation).</em>`
      : ` <em>(Bonus d'amélioration de gemmes de +${state.gemBonus} CP inclus dans l'estimation).</em>`;
  }

  dom.analysisText.innerHTML = msg;
}

/**
 * Met à jour le simulateur d'affinage (Onglet 2) avec pondération réaliste par pièce
 */
function updateHoningView() {
  const role = state.role || 'dps';
  const config = PIECE_CONFIG[role] || PIECE_CONFIG.dps;

  const baseGear = state.baselineGear || state.gear;
  const baseAdv = state.baselineAdvHoning !== undefined ? state.baselineAdvHoning : state.advHoning;
  const baseIlvl = state.baselineIlvl !== undefined ? state.baselineIlvl : state.currentIlvl;
  const baseCp = state.baselineCp !== undefined ? state.baselineCp : state.currentCp;

  // Échelle de CP proportionnelle au profil du joueur
  const cpScale = baseCp > 0 ? (baseCp / 3500) : 1.0;

  let totalPieceCpDiff = 0;
  let totalAddedAtk = 0;
  let totalAddedStr = 0;

  // Personnage réel : pièces et affinage avancé, depuis le profil (Aegir / Serka, niveau avancé par pièce)
  const simChar = getCurrentActiveCharacter();
  const simCtx = gearStatContext(simChar);
  const simPieces = HONING_SIM_PIECES.map(slot => {
    const isSerka = !!(simCtx && pieceIsSerka(simCtx.gear, slot));
    const adv = simCtx ? gearAdvOf(simChar, simCtx.gear, slot) : baseAdv;
    // Le sélecteur d'affinage avancé s'applique à toutes les pièces dès qu'on le change
    const toAdv = state.advHoning === baseAdv ? adv : state.advHoning;
    return { slot, isSerka, lvl: baseGear[slot], adv, toLvl: state.gear[slot], toAdv };
  });
  const simReal = simCtx ? gearDpsGain(simCtx, simPieces) : null;
  // iLvl d'une pièce (profils lostark.bible) : Aegir 1590 + 5 × affinage + avancé, Serka 1675 + 5 × affinage
  const computedIlvl = simCtx
    ? parseFloat((simPieces.reduce((sum, p) => sum + (p.isSerka ? 1675 + 5 * p.toLvl : 1590 + 5 * p.toLvl + p.toAdv), 0) / 6).toFixed(2))
    : computeGearIlvl(state.gear, state.advHoning);
  const diffIlvl = computedIlvl - baseIlvl;

  // Personnage importé : CP du modèle validé (gearCpGain : DPS, attaque de base ; support, branches buff et défense),
  // ramené au CP de base du simulateur
  const simProfileCp = simChar && ((simChar.rawProfile && simChar.rawProfile.raidCombatPower) || simChar.cp);
  const simCpGain = simReal ? gearCpGain(simChar, simCtx, simReal, role === 'support') : null;
  if (simCpGain !== null) {
    totalPieceCpDiff = simCpGain * (simProfileCp > 0 ? baseCp / simProfileCp : 1);
  } else {
    for (const piece of ['weapon', 'head', 'shoulder', 'chest', 'pants', 'gloves']) {
      const dLevel = state.gear[piece] - baseGear[piece];
      if (dLevel === 0) continue;
      const pCfg = config[piece];
    
      let tapCp;
      if (piece === 'weapon') {
        const avgLvl = (state.gear[piece] + baseGear[piece]) / 2;
        // Paliers +21 à +25 d'arme : Puissance d'Arme accrue
        const wpBonus = avgLvl >= 21 ? 36.0 : 28.5;
        tapCp = wpBonus * cpScale;
        totalAddedAtk += dLevel * (avgLvl >= 21 ? 2400 : 1850);
      } else {
        // Armures T4 : indexées sur la MainStat effective avec multiplicateurs passifs (~3730 effective STR = ~11 CP pour 1750+ DPS)
        // Torse & Pantalon (+4600 effective STR) apportent plus de stat que Casque/Gants/Épaules (+3700-3750)
        const pieceFactor = (pCfg.strPerLevel || 3700) / 3700;
        const armorBase = (role === 'support' ? 9.8 : 9.3) * pieceFactor;
        tapCp = armorBase * cpScale;
        totalAddedStr += dLevel * (pCfg.strPerLevel || 3700);
        totalAddedAtk += dLevel * (pCfg.atkPerLevel || 476);
      }

      totalPieceCpDiff += dLevel * tapCp;
    }

    // Impact de l'Affinage Avancé (+10, +20 Echidna / +30, +40 Aegir)
    // Chaque palier de +10 iLvl équivaut à environ +75 CP par tranche de 10
    const dAdv = state.advHoning - baseAdv;
    if (dAdv !== 0) {
      const advCpPer10 = (role === 'support' ? 70 : 75) * cpScale;
      totalPieceCpDiff += (dAdv / 10) * advCpPer10;
      totalAddedAtk += Math.round(dAdv * 180);
      totalAddedStr += Math.round(dAdv * 450);
    }
  }
  if (simReal) {
    // Stats réelles du profil : les estimations par niveau ne servent plus à l'affichage
    totalAddedStr = simReal.dMs;
    totalAddedAtk = Math.sqrt((simCtx.wp + simReal.dWp) * (simCtx.ms + simReal.dMs) / 6) - Math.sqrt(simCtx.wp * simCtx.ms / 6);
  }

  const predictedCp = Math.round(baseCp + totalPieceCpDiff);
  // Le CP du profil a des décimales : l'écart s'arrondit seul (sinon « +0,02 CP » sans rien changer)
  const diffCp = Math.round(totalPieceCpDiff);

  dom.simulatedIlvl.textContent = computedIlvl.toFixed(2);
  dom.simulatedCp.textContent = formatNumber(predictedCp);

  dom.simDiffIlvl.textContent = `${diffIlvl >= 0 ? '+' : ''}${diffIlvl.toFixed(2)}`;
  dom.simDiffCp.textContent = `${diffCp >= 0 ? '+' : ''}${formatNumber(diffCp)} CP`;

  // Calcul du coût estimé en Gold brut (Honing Sheet)
  // Paliers simulés, pièce par pièce (recette de la pièce : Serka au niveau affiché, sinon Aegir) ; matériaux liés
  // du personnage consommés dans cet ordre. Pity : jauge d'artisan pleine à chaque palier (0 sans recette du jeu)
  const simOwned = simCtx ? getBoundMats(simChar) : null;
  const simSteps = [];
  simPieces.forEach(p => { for (let l = p.lvl; l < p.toLvl; l++) simSteps.push({ piece: p.slot, l, track: p.isSerka ? 'serka' : 'aegir' }); });
  const simSeq = honingStepsCost(simSteps, simOwned);
  let totalSimGold = simSeq.cost;
  let totalRawGold = simSeq.rawGold;
  let totalPity = simSeq.pity, advSimGold = 0;
  for (const p of simPieces) {
    // Affinage avancé de la pièce (Aegir : sur le Serka il ne rapporte rien)
    if (!p.isSerka && p.toAdv > p.adv) {
      const advCost = advHoningCostBetween(p.slot, p.adv, p.toAdv);
      totalSimGold += advCost.totalValue;
      totalRawGold += advCost.rawGold;
      advSimGold += advCost.totalValue;
    }
  }

  if (dom.simEstimatedGold) {
    const enG = isEnLang();
    const muted = 'font-size:13px; color:var(--text-muted); font-weight:normal;';
    // Affinage avancé : pas de jauge d'artisan, compté à son coût attendu dans le pire cas
    const pityLine = totalPity > 0
      ? `<br><span style="font-size:15px;">${formatNumber(totalPity + advSimGold)} g</span> <span style="${muted}">(${enG
          ? 'worst case: full artisan\'s energy on every step' + (advSimGold > 0 ? ', advanced honing at expected cost' : '')
          : 'pire cas : jauge d\'artisan pleine à chaque palier' + (advSimGold > 0 ? ', affinage avancé au coût attendu' : '')})</span>`
      : '';
    const priced = simSeq.bound
      ? (enG ? 'gold + materials beyond your bound stock, at market price' : 'or + matériaux au-delà de ton stock lié, au prix du marché')
      : (enG ? 'gold + materials at market price' : 'or + matériaux au prix du marché');
    dom.simEstimatedGold.innerHTML = totalSimGold > 0 ? `${formatNumber(totalSimGold)} g <span style="${muted}">(${priced})</span>${pityLine}<br><span style="font-size:15px; color:#ffb13b;">${formatNumber(totalRawGold)} g</span> <span style="${muted}">(${enG ? 'gold fee only' : 'or des tentatives seul'})</span>` : '0 g';
  }

  if (dom.simGoldPerCp) {
    if (diffCp > 0 && totalSimGold > 0) {
      const goldPerCp = Math.round(totalSimGold / diffCp);
      dom.simGoldPerCp.textContent = `${formatNumber(goldPerCp)} g / CP`;
      dom.simGoldPerCp.className = 'stat-val positive';
    } else {
      dom.simGoldPerCp.textContent = '—';
      dom.simGoldPerCp.className = 'stat-val';
    }
  }

  // Estimation Force / Dextérité / Intelligence & Attaque de base
  // Profil réel : stat principale et PA de base = √(puissance d'arme × stat principale / 6)
  const baseStr = simCtx ? simCtx.ms : (role === 'support' ? 453200 : 480000);
  const baseAtk = simCtx ? Math.sqrt(simCtx.wp * simCtx.ms / 6) : (role === 'support' ? 157300 : 162000);

  const classKeyHone = getCharacterClassKey(getCurrentActiveCharacter());
  const isEnHone = isEnLang();
  const statName = getMainStatName(classKeyHone, isEnHone);
  const statShort = statName.startsWith('D') ? 'DEX' : (statName.startsWith('I') ? 'INT' : 'STR');
  const statDisplay = `${statName} (${statShort})`;
  const lblMainStat = document.getElementById('lblMainStatEst');
  if (lblMainStat) {
    lblMainStat.textContent = isEnHone ? `Estimated ${statDisplay}` : `${statDisplay} estimée`;
  }

  dom.simEstimatedStr.textContent = `~${formatNumber(Math.max(0, Math.round(baseStr + totalAddedStr)))}`;
  dom.simEstimatedAtk.textContent = `~${formatNumber(Math.max(0, Math.round(baseAtk + totalAddedAtk)))}`;

  // Mise à jour de l'affichage de chaque pièce
  for (const piece of ['weapon', 'head', 'shoulder', 'chest', 'pants', 'gloves']) {
    const el = document.getElementById(`lvl${capitalize(piece)}`);
    if (el) el.textContent = `+${state.gear[piece]}`;
  }

  // Conseils : calculés sur le personnage importé (prochain palier le plus rentable), sinon règles générales
  const nextSteps = simCtx ? honingNextSteps(simChar, simCtx, simPieces, role === 'support', simProfileCp > 0 ? baseCp / simProfileCp : 1, simSeq.left) : null;
  updateHoningAdvice(diffCp, totalSimGold, nextSteps);
  renderBoundMatsPanel(document.getElementById('honingBoundMats'), isEnLang());
  if (dom.charCardIlvl) dom.charCardIlvl.textContent = `${computedIlvl.toFixed(2)} iLvl`;
  if (dom.charCardCp) dom.charCardCp.textContent = `${formatNumber(predictedCp)} CP`;
  if (dom.charCardWeapon) dom.charCardWeapon.textContent = `+${state.gear.weapon}`;
  if (dom.charCardArmor) {
    const g = state.gear;
    const armors = [g.head, g.shoulder, g.chest, g.pants, g.gloves];
    const minA = Math.min(...armors);
    const maxA = Math.max(...armors);
    dom.charCardArmor.textContent = minA === maxA ? `+${minA}` : `+${minA} / +${maxA}`;
  }
  if (dom.charCardAdv) dom.charCardAdv.textContent = `+${state.advHoning}`;
}

/**
 * Simulateur : +1 sur chaque pièce depuis l'état simulé, CP marginal du modèle (gearCpGain) et coût attendu
 * (recette de la pièce, matériaux liés restants `owned` puis prix du marché), classés par or / CP. null sans données.
 */
function honingNextSteps(charObj, ctx, pieces, isSupport, cpScale, owned = null) {
  const cpOf = list => { const r = gearDpsGain(ctx, list); return r ? gearCpGain(charObj, ctx, r, isSupport) : null; };
  const now = cpOf(pieces);
  if (now === null) return null;
  const out = [];
  pieces.forEach((p, i) => {
    if (p.toLvl >= 25) return;
    const lc = getLevelCost(p.slot === 'weapon' ? 'weapon' : 'armor', p.toLvl, p.isSerka ? 'serka' : 'aegir', owned);
    const cost = lc.totalValue;
    const next = cpOf(pieces.map((q, j) => (j === i ? Object.assign({}, q, { toLvl: q.toLvl + 1 }) : q)));
    if (!(cost > 0) || next === null) return;
    const cp = (next - now) * cpScale;
    if (cp > 0) out.push({ slot: p.slot, from: p.toLvl, to: p.toLvl + 1, cp, cost, ratio: cost / cp, pity: lc.pityValue, pityTaps: lc.pityTaps, lc });
  });
  return out.sort((a, b) => a.ratio - b.ratio);
}

function updateHoningAdvice(diffCp = 0, totalSimGold = 0, nextSteps = null) {
  const g = state.gear;
  const role = state.role;
  const isEn = isEnLang();
  let advice = '';

  let simPrefix = '';
  if (diffCp > 0 && totalSimGold > 0) {
    const goldPerCp = Math.round(totalSimGold / diffCp);
    simPrefix = `<div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed rgba(232, 230, 220,0.1); color: var(--accent-gold);">
        <strong>${isEn ? 'Simulation Summary' : 'Bilan Simulation'} :</strong> +${formatNumber(diffCp)} CP ${isEn ? 'for' : 'pour'} ~${formatNumber(totalSimGold)} gold (${isEn ? 'ratio' : 'ratio'} : <strong>${formatNumber(goldPerCp)} g / CP</strong>).
      </div>`;
  }

  if (nextSteps && nextSteps.length) {
    const names = isEn
      ? { weapon: 'Weapon', head: 'Head', shoulder: 'Shoulders', chest: 'Chest', pants: 'Pants', gloves: 'Gloves' }
      : { weapon: 'Arme', head: 'Tête', shoulder: 'Épaules', chest: 'Torse', pants: 'Jambes', gloves: 'Gants' };
    const pity = st => {
      const breath = breathPlanText(st.lc, isEn);
      return (breath ? (isEn ? `; ${breath}` : ` ; ${breath}`) : '') +
        (st.pity > 0 ? (isEn ? `; at pity ${formatNumber(st.pity)} g, ${st.pityTaps} taps` : ` ; au pity ${formatNumber(st.pity)} or, ${st.pityTaps} essais`) : '');
    };
    const fmt = st => `${names[st.slot]} +${st.from} ➔ +${st.to} : +${formatNumber(Math.round(st.cp))} CP ${isEn ? 'for' : 'pour'} ${formatNumber(Math.round(st.cost))} ${isEn ? 'g' : 'or'} (${formatNumber(Math.round(st.ratio))} ${isEn ? 'g' : 'or'} / CP${pity(st)})`;
    const best = nextSteps[0];
    const others = nextSteps.slice(1).map(fmt).join('<br>');
    advice = `${simPrefix}${isEn ? 'Most cost-effective next step from this simulation' : 'Prochain palier le plus rentable depuis cette simulation'} : <strong>${fmt(best)}</strong>.` +
      (others ? `<div style="margin-top: 6px; font-size: 13px; color: var(--text-muted);">${others}</div>` : '') +
      `<div style="margin-top: 6px; font-size: 12px; color: var(--text-muted);">${isEn
          ? 'Your real gear, game recipes and market prices (expected cost with artisan energy and the cheapest breath use; pity = worst case, full energy). CP from base attack power' + (role === 'support' ? ' and Vitality.' : '.')
          : 'Ton vrai stuff, recettes du jeu et prix du marché (coût attendu avec l\'énergie d\'artisan et les souffles au moins cher ; pity = pire cas, jauge pleine). CP par l\'attaque de base' + (role === 'support' ? ' et la Vitalité.' : '.')}</div>`;
    dom.honingAdviceText.innerHTML = advice;
    return;
  }

  // Sans personnage importé : rappel général (mesuré sur 68 profils réels), sans chiffres inventés
  advice = isEn
    ? `${simPrefix}Each +1 is worth the same item level whatever the piece. The weapon gives about 5 times more CP per level than an armor piece, but costs several times more gold. <strong>Import your character</strong> to get the real CP and the most cost-effective next step, piece by piece.`
    : `${simPrefix}Chaque +1 vaut le même iLvl quelle que soit la pièce. L'arme rapporte environ 5 fois plus de CP par niveau qu'une armure, mais coûte plusieurs fois plus d'or. <strong>Importe ton personnage</strong> pour le vrai CP et le palier le plus rentable, pièce par pièce.`;

  dom.honingAdviceText.innerHTML = advice;
}
