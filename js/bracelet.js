// Évaluateur et diagnostic de bracelet T4.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- ÉVALUATEUR & CONSEILLER DE BRACELET T4 (SMILEGATE / INVEN) ---

function isDeadStat(label, isSupport) {
  if (!label) return false;
  const lbl = label.toLowerCase();
  if (lbl.includes('poignard') || lbl.includes('dagger') ||
      lbl.includes('ovation') || lbl.includes('cheers') ||
      lbl.includes('exposition') || lbl.includes('expose') ||
      lbl.includes('ap allié') || lbl.includes('ally atk') ||
      lbl.includes('précision') || lbl.includes('precision') ||
      lbl.includes('marteau') || lbl.includes('hammer') ||
      lbl.includes('ferveur') || lbl.includes('fervor') ||
      lbl.includes('coinçage') || lbl.includes('wedge') ||
      lbl.includes('ardeur') || lbl.includes('ardor') ||
      lbl.includes('embuscade') || lbl.includes('ambush') ||
      lbl.includes('non directionnelles') || lbl.includes('non-directional') ||
      lbl.includes('arrière') || lbl.includes('back attack') ||
      lbl.includes('frontale') || lbl.includes('frontal attack') ||
      lbl.includes('dégâts sortants') || lbl.includes('outgoing damage') ||
      lbl.includes('dégâts additionnels') || lbl.includes('additional damage') ||
      lbl.includes('dégâts critiques') || lbl.includes('crit damage') ||
      lbl.includes('taux critique') || lbl.includes('crit rate') ||
      lbl.includes('puissance d\'attaque') || lbl.includes('attack power') ||
      lbl.includes('protection') || lbl.includes('recovery')) {
    return false;
  }
  if (isSupport) {
    return lbl.includes('défense magique') || lbl.includes('magic defense') ||
           lbl.includes('défense physique') || lbl.includes('physical defense') ||
           lbl.includes('expertise') || lbl.includes('endurance') || lbl.includes('domination');
  } else {
    return lbl.includes('défense magique') || lbl.includes('magic defense') ||
           lbl.includes('défense physique') || lbl.includes('physical defense') ||
           lbl.includes('vitalité') || lbl.includes('vitality') ||
           lbl.includes('points de vie') || lbl.includes('max hp') ||
           lbl.includes('expertise') || lbl.includes('endurance') || lbl.includes('domination');
  }
}

function isPerkLabel(lbl) {
  const l = (lbl || '').toLowerCase();
  return l.includes('précision') || l.includes('precision') ||
         l.includes('marteau') || l.includes('hammer') ||
         l.includes('ferveur') || l.includes('fervor') ||
         l.includes('coinçage') || l.includes('wedge') ||
         l.includes('ardeur') || l.includes('ardor') ||
         l.includes('poignard') || l.includes('dagger') ||
         l.includes('ovation') || l.includes('cheers') ||
         l.includes('exposition') || l.includes('expose') ||
         l.includes('non directionnelles') || l.includes('non-directional') ||
         l.includes('arrière') || l.includes('back attack');
}

function estimatePerkMult(lbl, isSupport) {
  const l = (lbl || '').toLowerCase();
  if (isSupport) {
    if (l.includes('poignard') || l.includes('dagger') || l.includes('ovation') || l.includes('cheers') || l.includes('exposition') || l.includes('expose')) return 9.06;
    if (l.includes('ferveur') || l.includes('fervor')) return 5.5;
    return 3.0;
  } else {
    if (l.includes('précision') || l.includes('precision')) return 5.0;
    if (l.includes('marteau') || l.includes('hammer')) return 4.5;
    if (l.includes('ferveur') || l.includes('fervor')) return 4.5;
    if (l.includes('coinçage') || l.includes('wedge')) return 3.5;
    if (l.includes('non directionnelles') || l.includes('non-directional')) return 3.5;
    if (l.includes('arrière') || l.includes('back attack')) return 3.5;
    return 2.5;
  }
}

// Noms de perks et d'effets de bracelet T4 (BIBLE_BRACELET_PERKS) : français ➔ anglais.
// Appliquée du terme le plus long au plus court (« Dégâts Critiques » avant « Dégâts Crit »).
const BRACELET_TERMS_EN = [
  ["Ovation / Vulnérabilité Crit", 'Cheers / Crit Vulnerability'],
  ["Poignard / Faiblesse", 'Dagger / Weakness'],
  ["Exposition Crit", 'Expose Crit'],
  ["Puissance d'Arme Cumulable", 'Stacking Weapon Power'],
  ["Protection & Soins d'Allié", 'Ally Protection & Healing'],
  ["Vitesse d'Attaque & Déplacement", 'Attack & Move Speed'],
  ["Rechargement Esquive / Relèvement", 'Dodge / Stand-up Recharge'],
  ["Réduction Dégâts Monstres Inférieurs", 'Damage Reduction vs Lesser Monsters'],
  ["Dégâts Monstres Inférieurs", 'Damage vs Lesser Monsters'],
  ["Immunité Paralysie / Repoussement", 'Paralysis / Push Immunity'],
  ["Compétences Non Directionnelles", 'Non-Directional Skills'],
  ["Attaque par l'Arrière", 'Back Attack'],
  ["Attaque Frontale", 'Front Attack'],
  ["Dégâts Sortants / Neutralisation", 'Outgoing Damage / Neutralization'],
  ["Dégâts Sortants", 'Outgoing Damage'],
  ["Dégâts Additionnels", 'Additional Damage'],
  ["Dégâts Coup Crit", 'Crit Hit Dmg'],
  ["Dégâts Critiques", 'Crit Damage'],
  ["Dégâts Crit", 'Crit Dmg'],
  ["Taux Critique", 'Crit Rate'],
  ["Résistance Crit", 'Crit Resistance'],
  ["Puissance d'Arme", 'Weapon Power'],
  ["AP Allié", 'Ally AP'],
  ['Précision', 'Precision'],
  ['Marteau', 'Hammer'],
  ['Coinçage', 'Wedge'],
  ['Ferveur', 'Fervor'],
  ['Embuscade', 'Ambush'],
  ['Ardeur', 'Ardor'],
  ['Poignard', 'Dagger'],
  ['Faiblesse', 'Weakness'],
  ['Ovation', 'Cheers'],
  ['Démons', 'Demons'],
  ['& Vitesse', '& Speed']
].sort((a, b) => b[0].length - a[0].length);

function translateBraceletTerms(str) {
  let res = str;
  for (const [fr, en] of BRACELET_TERMS_EN) res = res.split(fr).join(en);
  return res;
}

const BRACELET_TERMS_FR = BRACELET_TERMS_EN.map(([fr, en]) => [en, fr]).sort((a, b) => b[0].length - a[0].length);

function translateBraceletTermsToFrench(str) {
  let res = str;
  for (const [en, fr] of BRACELET_TERMS_FR) res = res.split(en).join(fr);
  return res;
}

function formatBraceletLine(lbl, isEn = false) {
  if (!lbl) return '';
  let res = lbl.replace(/^Bracelet Ancien\s*—\s*/i, '').replace(/^Ancient Bracelet\s*—\s*/i, '');

  // Normalisation proactive des intitulés tronqués (Hammer, Précision, Coinçage, Ferveur)
  res = res.replace(/Marteau\s*\(Dégâts Critiques\s*\+?10%\)(?!.*Coup Crit)/i, 'Marteau (Dégâts Critiques +10% & Dégâts Coup Crit +1.5%)')
           .replace(/Hammer\s*\(Crit Damage\s*\+?10%\)(?!.*Hit)/i, 'Hammer (Crit Damage +10% & Crit Hit Dmg +1.5%)')
           .replace(/Marteau\s*\(Dégâts Critiques\s*\+?8\.4%\)(?!.*Coup Crit)/i, 'Marteau (Dégâts Critiques +8.4% & Dégâts Coup Crit +1.5%)')
           .replace(/Hammer\s*\(Crit Damage\s*\+?8\.4%\)(?!.*Hit)/i, 'Hammer (Crit Damage +8.4% & Crit Hit Dmg +1.5%)')
           .replace(/Marteau\s*\(Dégâts Critiques\s*\+?6\.8%\)(?!.*Coup Crit)/i, 'Marteau (Dégâts Critiques +6.8% & Dégâts Coup Crit +1.5%)')
           .replace(/Hammer\s*\(Crit Damage\s*\+?6\.8%\)(?!.*Hit)/i, 'Hammer (Crit Damage +6.8% & Crit Hit Dmg +1.5%)')
           .replace(/Marteau\s*\(Dégâts Critiques\s*\+?5\.2%\)(?!.*Coup Crit)/i, 'Marteau (Dégâts Critiques +5.2% & Dégâts Coup Crit +1.5%)')
           .replace(/Hammer\s*\(Crit Damage\s*\+?5\.2%\)(?!.*Hit)/i, 'Hammer (Crit Damage +5.2% & Crit Hit Dmg +1.5%)')
           .replace(/Précision\s*\(Taux Critique\s*\+?5%\)(?!.*Coup Crit)/i, 'Précision (Taux Critique +5% & Dégâts Coup Crit +1.5%)')
           .replace(/Precision\s*\(Crit Rate\s*\+?5%\)(?!.*Hit)/i, 'Precision (Crit Rate +5% & Crit Hit Dmg +1.5%)')
           .replace(/Précision\s*\(Taux Critique\s*\+?4\.2%\)(?!.*Coup Crit)/i, 'Précision (Taux Critique +4.2% & Dégâts Coup Crit +1.5%)')
           .replace(/Precision\s*\(Crit Rate\s*\+?4\.2%\)(?!.*Hit)/i, 'Precision (Crit Rate +4.2% & Crit Hit Dmg +1.5%)')
           .replace(/Précision\s*\(Taux Critique\s*\+?3\.4%\)(?!.*Coup Crit)/i, 'Précision (Taux Critique +3.4% & Dégâts Coup Crit +1.5%)')
           .replace(/Precision\s*\(Crit Rate\s*\+?3\.4%\)(?!.*Hit)/i, 'Precision (Crit Rate +3.4% & Crit Hit Dmg +1.5%)')
           .replace(/Précision\s*\(Taux Critique\s*\+?2\.6%\)(?!.*Coup Crit)/i, 'Précision (Taux Critique +2.6% & Dégâts Coup Crit +1.5%)')
           .replace(/Precision\s*\(Crit Rate\s*\+?2\.6%\)(?!.*Hit)/i, 'Precision (Crit Rate +2.6% & Crit Hit Dmg +1.5%)')
           .replace(/Coinçage\s*\/\s*Dégâts Additionnels\s*\(\+?([0-9.]+)%\)/i, 'Coinçage (Dégâts Additionnels +$1% & Démons +2.5%)')
           .replace(/Ferveur\s*\(Dégâts Sortants\s*\+?([45]\.?[0-9]*)%\)(?!.*Cooldown)/i, 'Ferveur (Dégâts Sortants +$1% & Cooldown +2%)');

  if (!isEn) return res;
  res = translateBraceletTerms(res);
  // Termes génériques propres aux lignes de bracelet (stats, défenses)
  const map = [
    ['Défense Magique', 'Magical Defense'],
    ['Défense Physique', 'Physical Defense'],
    ['Défense -', 'Defense -'],
    ['Défense', 'Defense'],
    ['Rapidité', 'Swiftness'],
    ['Spécialisation', 'Specialization'],
    ['Critique', 'Crit'],
    ['Dextérité', 'Dexterity'],
    ['Force', 'Strength'],
    ['Vitalité', 'Vitality'],
    ['Points de Vie', 'Max HP']
  ];
  for (const [fr, en] of map) {
    res = res.replace(new RegExp(fr, 'g'), en);
  }
  return res;
}

function evaluateBracelet(charObj, isEn = false) {
  if (!charObj) return null;
  const role = (charObj.role || state.role || 'dps').toLowerCase();
  const isSupport = role === 'support';
  const cName = charObj.className || (isSupport ? 'Paladin' : 'Shadowhunter');
  const cId = (activeCharacterId || (charObj && (charObj.id || charObj.name)) || '').toLowerCase();

  // Récupération des items de bracelet
  const rawItems = (charObj && charObj.items)
    || (charObj && charObj.rawProfile && charObj.rawProfile.items)
    || (liveImportedProfile && liveImportedProfile.items)
    || [];

  const brItems = rawItems.filter(i => i.cat === 'Bracelet');

  const usefulPerks = [];
  const deadStats = [];
  const baseStats = [];
  let totalMultPercent = 0;

  brItems.forEach(it => {
    const lbl = it.label || '';
    const multStr = it.mult || '+0.00%';
    const multVal = parseFloat(multStr.replace('+', '').replace('%', '')) || 0;

    const isDead = isDeadStat(lbl, isSupport);

    if (isDead) {
      deadStats.push({
        label: lbl,
        val: it.val,
        note: isEn ? 'Dead stat (0% net CP/DPS)' : 'Stat morte (0% CP/DPS net)'
      });
    } else if (multVal > 0 || isPerkLabel(lbl)) {
      const effectiveMult = multVal > 0 ? multVal : estimatePerkMult(lbl, isSupport);
      usefulPerks.push({
        label: lbl,
        mult: effectiveMult,
        val: it.val
      });
      totalMultPercent += effectiveMult;
    } else {
      baseStats.push({
        label: lbl,
        val: it.val
      });
    }
  });

  if (brItems.length === 0) {
    totalMultPercent = isSupport ? 18.1 : 8.0;
  }

  let efficiency = totalMultPercent;
  let combatStatMult = 0;
  
  // Integration of Loseii's methodology: 
  // T4 combat stats (Crit/Spec/Swift) on bracelets are valued at ~0.43% damage equivalent per 120 points.
  baseStats.forEach(stat => {
    const lbl = stat.label || '';
    const vStr = (stat.val || '').replace('+', '').replace(/\s/g, '').replace(' ', '');
    const v = parseInt(vStr, 10) || 0;
    if (lbl.includes('Spé') || lbl.includes('Spec') || lbl.includes('Rap') || lbl.includes('Swif') || lbl.includes('Cri')) {
       combatStatMult += (v / 120) * 0.43;
    }
  });

  if (combatStatMult > 0) {
    efficiency += combatStatMult;
  } else if (!isSupport && baseStats.length > 0) {
    efficiency += 1.2;
  }

  let tier = 'b';
  let tierLabel = '';
  let badgeClass = '';
  let ratingDesc = '';
  let potentialGainCp = 0;
  const currentCp = charObj.inGameScore || charObj.cp || (state.currentCp || 4000);

  if (isSupport) {
    if (efficiency >= 22.0) {
      tier = 's';
      tierLabel = isEn ? 'Tier S • Best in slot' : 'Rang S • Meilleur possible';
      badgeClass = 'god';
      ratingDesc = isEn ? 'Endgame BiS bracelet (3-4 max-value raid perks)' : 'Bracelet BiS endgame (3-4 rolls de raid au max)';
      potentialGainCp = 0;
    } else if (efficiency >= 16.0) {
      tier = 'a';
      tierLabel = isEn ? 'Tier A • Strong' : 'Rang A • Très bon';
      badgeClass = 'great';
      ratingDesc = isEn ? 'Solid endgame roll (2 major BiS ally AP perks)' : 'Très solide pour l\'endgame (2 rolls BiS majeurs)';
      potentialGainCp = Math.round(currentCp * 0.025);
    } else if (efficiency >= 9.0) {
      tier = 'b';
      tierLabel = isEn ? 'Tier B • Good' : 'Rang B • Bon';
      badgeClass = 'good';
      ratingDesc = isEn ? 'Transitional setup (1 perk or minor rolls, room for growth)' : 'Correct de transition (1 seul perk ou rolls bas, marge de progression)';
      potentialGainCp = Math.round(currentCp * 0.055);
    } else {
      tier = 'c';
      tierLabel = isEn ? 'Tier C/D • Suboptimal' : 'Rang C/D • Passable / Mauvais';
      badgeClass = 'bad';
      ratingDesc = isEn ? 'Suboptimal (dead stats or no ally AP buffs, high priority)' : 'Sous-optimal (stats mortes ou aucun buff d\'AP allié, priorité haute)';
      potentialGainCp = Math.round(currentCp * 0.090);
    }
  } else {
    // DPS
    if (efficiency >= 12.0 && deadStats.length === 0) {
      tier = 's';
      tierLabel = isEn ? 'Tier S • Best in slot' : 'Rang S • Meilleur possible';
      badgeClass = 'god';
      ratingDesc = isEn ? 'Endgame BiS bracelet (3-4 max-value damage rolls)' : 'Bracelet BiS endgame (3-4 rolls de dégâts au max)';
      potentialGainCp = 0;
    } else if (efficiency >= 9.2 && deadStats.length === 0) {
      tier = 'a';
      tierLabel = isEn ? 'Tier A • Strong' : 'Rang A • Très bon';
      badgeClass = 'great';
      ratingDesc = isEn ? 'Solid endgame roll (2 major BiS damage perks)' : 'Très solide pour l\'endgame (2 rolls BiS majeurs)';
      potentialGainCp = Math.round(currentCp * 0.025);
    } else if (efficiency >= 6.5) {
      tier = 'b';
      tierLabel = isEn ? 'Tier B • Good' : 'Rang B • Bon';
      badgeClass = 'good';
      ratingDesc = deadStats.length > 0
        ? (isEn ? `Transitional setup (${deadStats.length} dead stat detected)` : `Correct de transition (${deadStats.length} stat morte détectée)`)
        : (isEn ? 'Transitional setup (noticeable room for growth vs Lv. 9 gems)' : 'Correct de transition (marge de progression nette vs gemmes 9)');
      potentialGainCp = Math.round(currentCp * (deadStats.length > 0 ? 0.050 : 0.040));
    } else {
      tier = 'c';
      tierLabel = isEn ? 'Tier C/D • Suboptimal' : 'Rang C/D • Passable / Mauvais';
      badgeClass = 'bad';
      ratingDesc = isEn ? 'Suboptimal (dead stats or weak rolls to replace urgently)' : 'Sous-optimal (stats mortes ou rolls faibles à changer)';
      potentialGainCp = Math.round(currentCp * 0.075);
    }
  }

  // Recommandations de Procs BiS personnalisées
  const targets = [];
  if (isSupport) {
    targets.push({
      name: isEn ? 'Dagger / Weakness (-2.5% Def & +3% Ally AP)' : 'Poignard / Faiblesse (Défense -2.5% & AP Allié +3%)',
      badge: 'BiS #1 Raid',
      gain: '+13.5% CP'
    });
    targets.push({
      name: isEn ? 'Cheers / Crit Vulnerability (-4.8% Crit Dmg & +3% Ally AP)' : 'Ovation / Vulnérabilité Crit (Dégâts Crit -4.8% & AP Allié +3%)',
      badge: 'BiS #2 Raid',
      gain: '+13.5% CP'
    });
    targets.push({
      name: isEn ? 'Expose Crit (-2.5% Crit Res & +3% Ally AP)' : 'Exposition Crit (Résistance Crit -2.5% & AP Allié +3%)',
      badge: 'BiS Alternative',
      gain: '+13.5% CP'
    });
    targets.push({
      name: isEn ? 'Swiftness (>100) + Vitality (>5,000 HP)' : 'Rapidité (>100) + Vitalité (>5 000 HP)',
      badge: 'Stats BiS',
      gain: isEn ? '+Shields & Cooldown' : '+Boucliers & Cooldown'
    });
  } else {
    const isBackAttack = ['slayer', 'deathblade', 'reaper', 'striker', 'scrapper', 'blade'].some(k => cName.toLowerCase().includes(k));
    targets.push({
      name: isEn ? 'Precision (Crit Rate +5% & Crit Hit Dmg +1.5%)' : 'Précision (Taux Critique +5% & Dégâts Crit +1.5%)',
      badge: 'BiS #1 Universel',
      gain: '+5.0% Dmg'
    });
    targets.push({
      name: isEn ? 'Hammer (Crit Damage +10% & Crit Hit Dmg +1.5%)' : 'Marteau (Dégâts Critiques +10% & Dégâts Crit +1.5%)',
      badge: 'BiS #2 Burst',
      gain: '+4.5% Dmg'
    });
    if (isBackAttack) {
      targets.push({
        name: isEn ? 'Back Attack (Back Attack Damage +3.5%)' : 'Attaque par l\'Arrière (Back Attack +3.5%)',
        badge: 'BiS Directionnel',
        gain: '+3.5% Dmg'
      });
      targets.push({
        name: isEn ? 'Fervor (Outgoing Damage +5.5%) or Ardor (+1,480 WP)' : 'Ferveur (Dégâts Sortants +5.5%) ou Ardeur (+1 480 WP)',
        badge: 'BiS Multiplier',
        gain: '+4.0% à +5.5% Dmg'
      });
    } else {
      targets.push({
        name: isEn ? 'Fervor (Outgoing Damage +5.5%)' : 'Ferveur (Dégâts Sortants +5.5%)',
        badge: 'BiS Multiplier',
        gain: '+4.0% à +5.5% Dmg'
      });
      targets.push({
        name: isEn ? 'Non-Directional Skill Damage (+3.5%) / Wedge (+3.5%)' : 'Compétences Non Directionnelles (+3.5%) / Coinçage (+3.5%)',
        badge: 'BiS Add-on',
        gain: '+3.5% Dmg'
      });
    }
    const mainStatLabel = getMainStatName(cName, isEn);
    targets.push({
      name: isEn ? `Specialization / Crit (>80) + ${mainStatLabel} (>10,000)` : `Spécialisation / Critique (>80) + ${mainStatLabel} (>10 000)`,
      badge: 'Stats BiS',
      gain: isEn ? '+Combat Stats' : '+Stats Combat'
    });
  }

  return {
    role,
    isSupport,
    className: cName,
    efficiency,
    tier,
    tierLabel,
    badgeClass,
    ratingDesc,
    usefulPerks,
    deadStats,
    baseStats,
    potentialGainCp,
    targets
  };
}

function renderBraceletDiagnostic(curChar, isEn) {
  if (!dom.advisorBraceletCard) return;
  const diag = evaluateBracelet(curChar, isEn);
  if (!diag) return;

  if (dom.advBraceTierBadge) {
    dom.advBraceTierBadge.textContent = diag.tierLabel;
    dom.advBraceTierBadge.className = 'bracelet-tier-badge ' + diag.badgeClass;
  }

  if (dom.advBraceGainVal) {
    dom.advBraceGainVal.textContent = diag.potentialGainCp > 0 ? `+${formatNumber(diag.potentialGainCp)} CP` : (isEn ? 'Optimized' : 'Optimisé');
  }

  if (dom.advBraceEffVal) {
    dom.advBraceEffVal.textContent = `${diag.efficiency.toFixed(2)}%`;
  }

  if (dom.advBraceRatingDesc) {
    dom.advBraceRatingDesc.textContent = `(${diag.ratingDesc})`;
  }

  if (dom.advBraceProgressBar) {
    const maxEff = diag.isSupport ? 22.0 : 13.5;
    const pct = Math.min(100, Math.max(15, Math.round((diag.efficiency / maxEff) * 100)));
    dom.advBraceProgressBar.style.width = `${pct}%`;
  }

  if (dom.advBraceLinesList) {
    let html = '';
    if (diag.usefulPerks.length === 0 && diag.deadStats.length === 0 && diag.baseStats.length === 0) {
      html = `<div style="font-size:13px; color:var(--text-dim); padding:6px 0;">${isEn ? 'Standard baseline bracelet.' : 'Bracelet de base standard.'}</div>`;
    } else {
      diag.usefulPerks.forEach(u => {
        const cleanLbl = formatBraceletLine(u.label, isEn);
        html += `
            <div class="bracelet-item-pill useful">
              <span><strong>${escapeHtml(cleanLbl)}</strong></span>
              <span class="pill-mult" style="color:#8CC084; font-weight:700;">+${u.mult.toFixed(2)}%</span>
            </div>
          `;
      });
      diag.deadStats.forEach(d => {
        const cleanLbl = formatBraceletLine(d.label, isEn);
        html += `
            <div class="bracelet-item-pill dead">
              <span><strong style="color:#E07A63;">${escapeHtml(cleanLbl)}</strong></span>
              <span class="pill-mult" style="color:#E07A63; font-size:12px;">${isEn ? 'Dead stat (0% CP)' : 'Stat morte (0% CP)'}</span>
            </div>
          `;
      });
      diag.baseStats.forEach(b => {
        const cleanLbl = formatBraceletLine(b.label, isEn);
        html += `
            <div class="bracelet-item-pill stat">
              <span>${escapeHtml(cleanLbl)}</span>
              <span style="color:var(--text-muted); font-size:12px;">${escapeHtml(b.val)}</span>
            </div>
          `;
      });
    }
    dom.advBraceLinesList.innerHTML = html;
  }

  if (dom.advBraceTargetsList) {
    let html = '';
    diag.targets.forEach(t => {
      html += `
          <div class="bracelet-target-pill">
            <span class="target-name">${escapeHtml(t.name)}</span>
            <span class="target-gain">${escapeHtml(t.gain)}</span>
          </div>
        `;
    });
    dom.advBraceTargetsList.innerHTML = html;
  }
}
