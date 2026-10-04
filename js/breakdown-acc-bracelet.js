// Détails du Benchmark : bijoux et bracelet.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function buildAccBreakdownHtml(player, target, cpImpact, isEn) {
  const isSupport = player.role === 'support' || (player.className && ['Paladin', 'Bard', 'Artist'].some(s => (player.className || '').toLowerCase().includes(s.toLowerCase())));

  let pAccItems = (player && player.accessories)
    || (player && player.rawProfile && player.rawProfile.accessories)
    || (player && player.rawProfile && player.rawProfile.loadout && player.rawProfile.loadout.items && player.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || (player && player.loadout && player.loadout.items && player.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || [];

  // Fallback direct sur les données réelles vérifiées de Àlphâ si non ré-hydratées depuis le cache local

  const slots = [
    { key: 'neck', name: isEn ? 'Necklace T4' : 'Collier T4', icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' },
    { key: 'ear1', name: isEn ? 'Earring #1 T4' : "Boucle d'oreille #1 T4", icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' },
    { key: 'ear2', name: isEn ? 'Earring #2 T4' : "Boucle d'oreille #2 T4", icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' },
    { key: 'finger1', name: isEn ? 'Ring #1 T4' : 'Anneau #1 T4', icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' },
    { key: 'finger2', name: isEn ? 'Ring #2 T4' : 'Anneau #2 T4', icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' }
  ];

  // Extraction des lignes affinées réelles du joueur
  slots.forEach(s => {
    const item = pAccItems.find(i => i.slot === s.key);
    if (item && item.data && Array.isArray(item.data.stats)) {
      const rolls = item.data.stats.filter(st => st.base === false);
      rolls.forEach(r => {
        s.pLines.push(decodeAccessoryStat(r, s.key, isSupport, isEn));
      });
      // Si l'accessoire n'a pas encore toutes ses lignes d'affinage débloquées
      while (s.pLines.length < 3) {
        s.pLines.push({
          text: isEn ? "Line to roll" : "Ligne à affiner",
          isDead: false,
          rollTier: 'low',
          tierLabel: isEn ? "To Roll" : "À Affiner"
        });
      }
    }
  });

  // Extraction depuis les items textuels du preset (CANONICAL_PRESETS) si pas de données d'objets bruts
  const cKey = (player.id || player.name || '').toLowerCase().trim();
  const canon = null;
  const playerItems = (player.items && Array.isArray(player.items) && player.items.filter(i => i.cat === 'Accessoires').length > 0)
    ? player.items.filter(i => i.cat === 'Accessoires')
    : (canon && Array.isArray(canon.items) ? canon.items.filter(i => i.cat === 'Accessoires') : []);

  if (playerItems.length > 0) {
    slots.forEach(s => {
      if (s.pLines.length === 0) {
        let slotMatchStr = '';
        if (s.key === 'neck') slotMatchStr = 'collier';
        else if (s.key === 'ear1') slotMatchStr = 'boucle d\'oreille #1';
        else if (s.key === 'ear2') slotMatchStr = 'boucle d\'oreille #2';
        else if (s.key === 'finger1') slotMatchStr = 'anneau #1';
        else if (s.key === 'finger2') slotMatchStr = 'anneau #2';

        const matchingItems = playerItems.filter(it => (it.label || '').toLowerCase().includes(slotMatchStr));
        matchingItems.forEach(it => {
          const rawLabel = it.label || '';
          const statText = rawLabel.includes('—') ? rawLabel.split('—')[1].trim() : rawLabel;
          const note = (it.note || '').toLowerCase();
          const val = it.val || '';
          let isDead = false;
          let rollTier = 'mid';
          let tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';

          if (isSupport) {
            if (statText.toLowerCase().includes('critique') || statText.toLowerCase().includes('crit') || statText.toLowerCase().includes('additionnel') || note.includes('exclu') || note.includes('non transféré')) {
              isDead = true;
              tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
            } else if (statText.toLowerCase().includes('dégâts infligés') || val.includes('+800') || val.includes('+1.95%') || val.includes('+5.00%') || val.includes('+7.50%')) {
              rollTier = 'high';
              tierLabel = isEn ? 'High Roll' : 'Roll Élevé';
            } else if (val.includes('+2.10%') || val.includes('+2.00%') || val.includes('+1.80%') || val.includes('+1.47%')) {
              rollTier = 'mid';
              tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
            } else {
              rollTier = 'low';
              tierLabel = isEn ? 'Low Roll' : 'Roll Faible';
            }
          } else {
            if (statText.toLowerCase().includes('soins') || statText.toLowerCase().includes('bouclier') || statText.toLowerCase().includes('brand power') || statText.toLowerCase().includes('marque') || note.includes('exclu')) {
              isDead = true;
              tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
            } else if (statText.toLowerCase().includes('dégâts infligés') || val.includes('+390') || val.includes('+960') || val.includes('+4.00%') || val.includes('+3.00%') || val.includes('+2.60%')) {
              rollTier = 'high';
              tierLabel = isEn ? 'High Roll' : 'Roll Élevé';
            } else if (val.includes('+1.55%') || val.includes('+1.60%') || val.includes('+0.95%') || val.includes('+0.80%')) {
              rollTier = 'mid';
              tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
            } else {
              rollTier = 'low';
              tierLabel = isEn ? 'Low Roll' : 'Roll Faible';
            }
          }

          s.pLines.push({ text: isEn ? formatLostArkEnglish(statText) : statText, isDead, rollTier, tierLabel });
        });

        while (s.pLines.length < 3) {
          s.pLines.push({
            text: isEn ? "Line to roll" : "Ligne à affiner",
            isDead: false,
            rollTier: 'low',
            tierLabel: isEn ? "To Roll" : "À Affiner"
          });
        }
      }
    });
  }

  // Fallback pour les profils démo ou théoriques sans données brutes
  slots.forEach(s => {
    if (s.pLines.length === 0) {
      if (isSupport) {
        if (s.key === 'neck') {
          s.pLines.push({ text: isEn ? "Brand Power (+4.80%)" : "Brand Power / Marque (+4.80%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Outgoing Damage (+2.00%)" : "Dégâts infligés (+2.00%)", isDead: false, rollTier: 'passif', tierLabel: isEn ? 'Rank 3 Perk' : 'Passif Rang 3' });
          s.pLines.push({ text: isEn ? "Max HP (+3250)" : "Points de Vie Max (+3250)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
        } else if (s.key === 'ear1' || s.key === 'ear2') {
          s.pLines.push({ text: isEn ? "Shield for Party Members (+2.10%)" : "Boucliers aux Membres (+2.10%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Recovery for Party Members (+2.10%)" : "Soins aux Membres (+2.10%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Max HP (+3250)" : "Points de Vie Max (+3250)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
        } else {
          s.pLines.push({ text: isEn ? "Ally Damage Enhancement (+4.50%)" : "Effet Augmentation Dégâts d'Allié (+4.50%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Ally Atk. Power Enhancement (+3.00%)" : "Effet Amplification PA d'Allié (+3.00%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Max HP (+3250)" : "Points de Vie Max (+3250)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
        }
      } else {
        if (s.key === 'neck') {
          s.pLines.push({ text: isEn ? "Atk. Power (+195)" : "Puissance d'Attaque (+195)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Additional Damage (+1.60%)" : "Dégâts Additionnels (+1.60%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Outgoing Damage (+2.00%)" : "Dégâts infligés (+2.00%)", isDead: false, rollTier: 'passif', tierLabel: isEn ? 'Rank 3 Perk' : 'Passif Rang 3' });
        } else if (s.key === 'ear1' || s.key === 'ear2') {
          s.pLines.push({ text: isEn ? "Weapon Power (+1.80%)" : "Puissance d'Arme (+1.80%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Atk. Power (+0.95%)" : "Puissance d'Attaque (+0.95%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Atk. Power (+195)" : "Puissance d'Attaque (+195)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
        } else {
          s.pLines.push({ text: isEn ? "Crit Damage (+2.40%)" : "Dégâts Critiques (+2.40%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Crit Rate (+0.95%)" : "Taux Critique (+0.95%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          s.pLines.push({ text: isEn ? "Atk. Power (+195)" : "Puissance d'Attaque (+195)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
        }
      }
    }
  });

  // Extraction des lignes de référence de la cible (cible réelle ou cibles Best-in-Slot T4 canoniques)
  const isTargetSupport = target && (target.role === 'support' || (target.className && ['Paladin', 'Bard', 'Artist'].some(s => (target.className || '').toLowerCase().includes(s.toLowerCase()))));
  const tAccItems = (target && target.accessories)
    || (target && target.rawProfile && target.rawProfile.accessories)
    || (target && target.rawProfile && target.rawProfile.loadout && target.rawProfile.loadout.items && target.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || (target && target.loadout && target.loadout.items && target.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || [];

  slots.forEach(s => {
    const tItem = tAccItems.find(i => i.slot === s.key);
    if (tItem && tItem.data && Array.isArray(tItem.data.stats)) {
      const tRolls = tItem.data.stats.filter(st => st.base === false);
      tRolls.forEach(r => {
        s.tLines.push(decodeAccessoryStat(r, s.key, isTargetSupport, isEn));
      });
    }
  });

  // Extraction depuis les items de la cible si c'est un preset
  const targetItems = (target && target.items && Array.isArray(target.items) && target.items.filter(i => i.cat === 'Accessoires').length > 0)
    ? target.items.filter(i => i.cat === 'Accessoires')
    : [];

  if (targetItems.length > 0) {
    slots.forEach(s => {
      if (s.tLines.length === 0) {
        let slotMatchStr = '';
        if (s.key === 'neck') slotMatchStr = 'collier';
        else if (s.key === 'ear1') slotMatchStr = 'boucle d\'oreille #1';
        else if (s.key === 'ear2') slotMatchStr = 'boucle d\'oreille #2';
        else if (s.key === 'finger1') slotMatchStr = 'anneau #1';
        else if (s.key === 'finger2') slotMatchStr = 'anneau #2';

        const matchingItems = targetItems.filter(it => (it.label || '').toLowerCase().includes(slotMatchStr));
        matchingItems.forEach(it => {
          const rawLabel = it.label || '';
          const statText = rawLabel.includes('—') ? rawLabel.split('—')[1].trim() : rawLabel;
          const note = (it.note || '').toLowerCase();
          const val = it.val || '';
          let isDead = false;
          let rollTier = 'mid';
          let tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';

          if (isTargetSupport) {
            if (statText.toLowerCase().includes('critique') || statText.toLowerCase().includes('crit') || statText.toLowerCase().includes('additionnel') || note.includes('exclu')) {
              isDead = true;
              tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
            } else if (statText.toLowerCase().includes('dégâts infligés') || val.includes('+800') || val.includes('+1.95%') || val.includes('+5.00%') || val.includes('+7.50%')) {
              rollTier = 'high';
              tierLabel = isEn ? 'High Roll' : 'Roll Élevé';
            } else if (val.includes('+2.10%') || val.includes('+2.00%') || val.includes('+1.80%')) {
              rollTier = 'mid';
              tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
            } else {
              rollTier = 'low';
              tierLabel = isEn ? 'Low Roll' : 'Roll Faible';
            }
          } else {
            if (statText.toLowerCase().includes('soins') || statText.toLowerCase().includes('bouclier') || statText.toLowerCase().includes('brand power') || statText.toLowerCase().includes('marque') || note.includes('exclu')) {
              isDead = true;
              tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
            } else if (statText.toLowerCase().includes('dégâts infligés') || val.includes('+390') || val.includes('+960') || val.includes('+4.00%') || val.includes('+3.00%')) {
              rollTier = 'high';
              tierLabel = isEn ? 'High Roll' : 'Roll Élevé';
            } else if (val.includes('+1.55%') || val.includes('+1.60%') || val.includes('+0.95%')) {
              rollTier = 'mid';
              tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
            } else {
              rollTier = 'low';
              tierLabel = isEn ? 'Low Roll' : 'Roll Faible';
            }
          }
          s.tLines.push({ text: isEn ? formatLostArkEnglish(statText) : statText, isDead, rollTier, tierLabel });
        });
      }
    });
  }

  // Si pas de données d'accessoires brutes pour la cible, fournit les véritables lignes Best-in-Slot T4 High Rolls
  slots.forEach(s => {
    if (s.tLines.length === 0) {
      if (isTargetSupport) {
        if (s.key === 'neck') {
          s.tLines = [
            { text: isEn ? "Brand Power (+8.00%)" : "Brand Power / Marque (+8.00%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: isEn ? "Outgoing Damage (+2.00%)" : "Dégâts infligés (+2.00%)", rollTier: 'passif', tierLabel: isEn ? 'Rank 3 Perk' : 'Passif Rang 3' },
            { text: isEn ? "Max HP (+6500)" : "Points de Vie Max (+6500)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
          ];
        } else if (s.key === 'ear1' || s.key === 'ear2') {
          s.tLines = [
            { text: isEn ? "Shield for Party Members (+3.50%)" : "Boucliers aux Membres (+3.50%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: isEn ? "Recovery for Party Members (+3.50%)" : "Soins aux Membres (+3.50%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: isEn ? "Max HP (+6500)" : "Points de Vie Max (+6500)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
          ];
        } else {
          s.tLines = [
            { text: isEn ? "Ally Damage Enhancement (+7.50%)" : "Effet Augmentation Dégâts d'Allié (+7.50%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: isEn ? "Ally Atk. Power Enhancement (+5.00%)" : "Effet Amplification PA d'Allié (+5.00%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: isEn ? "Max HP (+6500)" : "Points de Vie Max (+6500)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
          ];
        }
      } else {
        if (s.key === 'neck') {
          s.tLines = [
            { text: isEn ? "Outgoing Damage (+2.00%)" : "Dégâts infligés (+2.00%)", rollTier: 'passif', tierLabel: isEn ? 'Rank 3 Perk' : 'Passif Rang 3' },
            { text: isEn ? "Additional Damage (+2.60%)" : "Dégâts Additionnels (+2.60%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: isEn ? "Atk. Power (+390)" : "Puissance d'Attaque (+390)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
          ];
        } else if (s.key === 'ear1' || s.key === 'ear2') {
          s.tLines = [
            { text: isEn ? "Weapon Power (+3.00%)" : "Puissance d'Arme (+3.00%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: isEn ? "Atk. Power (+1.55%)" : "Puissance d'Attaque (+1.55%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: s.key === 'ear1' ? (isEn ? "Atk. Power (+390)" : "Puissance d'Attaque (+390)") : (isEn ? "Weapon Power (+960)" : "Puissance d'Arme (+960)"), rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
          ];
        } else {
          s.tLines = [
            { text: isEn ? "Crit Damage (+4.00%)" : "Dégâts Critiques (+4.00%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: isEn ? "Crit Rate (+1.55%)" : "Taux Critique (+1.55%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
            { text: s.key === 'finger1' ? (isEn ? "Atk. Power (+390)" : "Puissance d'Attaque (+390)") : (isEn ? "Weapon Power (+960)" : "Puissance d'Arme (+960)"), rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
          ];
        }
      }
    }
  });

  // Distribution exacte et parité mathématique du delta CP
  if (cpImpact <= 0) {
    slots.forEach(s => {
      s.impactCp = 0;
      s.verdict = isEn ? "Equivalent rolls and parity with benchmark." : "Lignes équivalentes et parité optimale avec la référence.";
    });
  } else {
    const weights = slots.map(s => {
      let w = 0;
      const hasDead = s.pLines.some(l => l.isDead);
      const hasUnrolled = s.pLines.some(l => l.tierLabel.includes('Affiner') || l.tierLabel.includes('To Roll'));
      const lowCount = s.pLines.filter(l => l.rollTier === 'low' && !l.isDead && !l.tierLabel.includes('Affiner') && !l.tierLabel.includes('To Roll')).length;
      const midCount = s.pLines.filter(l => l.rollTier === 'mid' && !l.isDead).length;
      if (hasDead) w += 3.5;
      if (hasUnrolled) w += 2.0;
      w += lowCount * 2.0;
      w += midCount * 0.8;
      return Math.max(0.5, w);
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let distributedCp = 0;

    // Passe 1 : Allocation proportionnelle brute
    slots.forEach((s, idx) => {
      const share = Math.round((weights[idx] / totalWeight) * cpImpact);
      s.impactCp = share;
      distributedCp += share;
    });

    // Réconciliation stricte pour garantir 100% de parité (somme == cpImpact)
    if (distributedCp !== cpImpact) {
      const diff = cpImpact - distributedCp;
      const maxSlot = slots.reduce((best, cur) => cur.impactCp > (best ? best.impactCp : -1) ? cur : best, null);
      if (maxSlot) {
        maxSlot.impactCp = Math.max(0, maxSlot.impactCp + diff);
      }
    }

    // Passe 2 : Détermination des verdicts
    slots.forEach(s => {
      const deadStats = s.pLines.filter(l => l.isDead);
      const unrolledCount = s.pLines.filter(l => l.tierLabel.includes('Affiner') || l.tierLabel.includes('To Roll')).length;
      const lowLines = s.pLines.filter(l => l.rollTier === 'low' && !l.isDead && !l.tierLabel.includes('Affiner') && !l.tierLabel.includes('To Roll')).map(l => isEn ? formatLostArkEnglish(l.text) : l.text);
      const midLines = s.pLines.filter(l => l.rollTier === 'mid' && !l.isDead).map(l => isEn ? formatLostArkEnglish(l.text) : l.text);

      if (deadStats.length > 0) {
        const deadName = deadStats.map(d => isEn ? formatLostArkEnglish(d.text) : d.text).join(', ');
        s.verdict = isEn
          ? `Replace dead line (${deadName}) with active High Roll (+${s.impactCp} CP).`
          : `Remplacement de la ligne morte (${deadName}) par un High Roll actif (+${s.impactCp} CP).`;
      } else if (unrolledCount > 0) {
        s.verdict = isEn
          ? `Roll empty slot to an active High Roll (+${s.impactCp} CP).`
          : `Roulage de l'emplacement vide vers un High Roll actif (+${s.impactCp} CP).`;
      } else if (lowLines.length > 0) {
        s.verdict = isEn
          ? `Upgrade low rolls (${lowLines.join(', ')}) to High Rolls (+${s.impactCp} CP).`
          : `Amélioration des rolls faibles (${lowLines.join(', ')}) vers des High Rolls (+${s.impactCp} CP).`;
      } else if (midLines.length > 0 && s.impactCp > 0) {
        s.verdict = isEn
          ? `Push primary line to maximum High Roll (+${s.impactCp} CP).`
          : `Maximisation de la ligne vers le palier High (+${s.impactCp} CP).`;
      } else if (s.impactCp > 0) {
        s.verdict = isEn
          ? `Optimize minor substats (+${s.impactCp} CP).`
          : `Optimisation des sous-statistiques (+${s.impactCp} CP).`;
      } else {
        s.verdict = isEn ? "Optimal rolls on this piece." : "Rolls optimaux sur ce bijou.";
      }
    });
  }

  let cardsHtml = '';
  slots.forEach(s => {
    let pLinesHtml = '';
    s.pLines.forEach(l => {
      pLinesHtml += `<div class="acc-line-badge ${l.rollTier} ${l.isDead ? 'dead' : ''}">
          <span>${l.isDead ? '' : (l.rollTier === 'passif' ? '' : (l.rollTier === 'high' ? '' : (l.rollTier === 'mid' ? '' : '')))}${escapeHtml(l.text)}</span>
          <span class="acc-line-tier-tag">${escapeHtml(l.tierLabel)}</span>
        </div>`;
    });

    let tLinesHtml = '';
    s.tLines.forEach(l => {
      tLinesHtml += `<div class="acc-line-badge ${l.rollTier}">
          <span>${l.rollTier === 'passif' ? '' : ''}${escapeHtml(l.text)}</span>
          <span class="acc-line-tier-tag">${escapeHtml(l.tierLabel)}</span>
        </div>`;
    });

    cardsHtml += `
        <div class="acc-piece-card ${s.impactCp >= 15 ? 'heavy-gap' : (s.impactCp > 0 ? 'has-gap' : 'parity')}">
          <div class="acc-piece-top">
            <div class="acc-piece-name">
              <span class="acc-piece-icon">${s.icon}</span>
              <strong>${escapeHtml(s.name)}</strong>
            </div>
            <span class="acc-piece-gain-pill ${s.impactCp > 0 ? 'gap' : 'neutral'}">
              ${s.impactCp > 0 ? `+${s.impactCp} CP` : '= 0 CP'}
            </span>
          </div>

          <div class="acc-piece-body">
            <div class="acc-side-section">
              <span class="acc-side-lbl player">${isEn ? 'Your Rolls' : 'Vos Lignes'}</span>
              ${pLinesHtml}
            </div>
            <div class="acc-side-section">
              <span class="acc-side-lbl target">${isEn ? 'Benchmark Target' : 'Lignes Référence'}</span>
              ${tLinesHtml}
            </div>
          </div>

          <div class="acc-piece-verdict">
            <span></span>
            <span class="verdict-text">${s.verdict}</span>
          </div>
        </div>
      `;
  });

  return `
      <div class="acc-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'Individual T4 Accessories & Polish Lines Breakdown' : 'Détail des 5 Accessoires T4 & Lignes d\'Affinage'}</strong>
            </div>
            <span class="acc-breakdown-tag">${cpImpact > 0 ? `+${cpImpact} CP ${isEn ? 'gap' : 'd\'écart global'}` : (isEn ? 'Optimized parity' : 'Parité optimale')}</span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn 
              ? 'Piece-by-piece comparison showing which rolled lines contribute to the CP gap and where to prioritize your rolls.'
              : 'Comparaison pièce par pièce identifiant les lignes obtenues, les lignes mortes et les leviers d\'optimisation pour combler l\'écart de CP.'}
          </div>
        </div>
        <div class="acc-pieces-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
}

function getMainStatName(className, isEn) {
  const c = (className || '').toLowerCase().replace(/[\s\-_]/g, '');
  const isHunter = ['devilhunter', 'blaster', 'hawkeye', 'gunslinger', 'scouter', 'machinist', 'sharpshooter', 'deadeye', 'artillerist', 'franctireur', 'fusiliere', 'artilleur', 'sagittaire', 'machiniste'].some(k => c.includes(k));
  const isAssassin = ['blade', 'demonic', 'reaper', 'souleater', 'shadowhunter', 'deathblade', 'sanglante', 'demoniste', 'faucheuse', 'devoreuse'].some(k => c.includes(k));
  const isMartialArtist = ['battlemaster', 'wardancer', 'infighter', 'scrapper', 'forcemaster', 'soulmaster', 'soulfist', 'lancemaster', 'glaivier', 'striker', 'breaker', 'heavyinfighter', 'elementiste', 'pugiliste', 'spiritiste', 'lanciere', 'essentialiste', 'sangha'].some(k => c.includes(k));
  const isMage = ['bard', 'arcana', 'summoner', 'sorceress', 'arcanist', 'barde', 'sorciere', 'invocatrice'].some(k => c.includes(k));
  const isSpecialist = ['artist', 'aeromancer', 'alchemist', 'wildsoul', 'artiste', 'aeromancienne', 'yinyangshi', 'painter', 'weatherartist', 'dimensionalist', 'dimensionmaster', 'dimension', 'dimensionnaliste'].some(k => c.includes(k));

  if (isHunter || isAssassin || isMartialArtist) return isEn ? 'Dexterity' : 'Dextérité';
  if (isMage || isSpecialist) return isEn ? 'Intelligence' : 'Intelligence';
  return isEn ? 'Strength' : 'Force';
}

function decodeBraceletStat(st, className, isSupport, isEn) {
  const sIndex = st.index;
  const sVal = st.value;
  const isFixed = st.fixed === true;
  const isPerk = st.type === 3 || st.type === 4 || sIndex > 1000;

  if (isPerk) {
    const perk = (typeof BIBLE_BRACELET_PERKS !== 'undefined' && BIBLE_BRACELET_PERKS[sIndex]) || null;
    let baseName = perk ? (isEn ? (perk.nameEn || perk.name) : perk.name) : `Roll Spécial (#${sIndex})`;
    let rawName = perk && perk.desc ? `${baseName} (${perk.desc})` : baseName;
    if (!perk && typeof formatBraceletLine === 'function') {
      rawName = formatBraceletLine(rawName, isEn);
    }
    let rollTier = 'high';
    let tierLabel = isEn ? 'BiS Perk' : 'Proc BiS';
    let isDead = false;

    if (isSupport) {
      if (sIndex === 11061 || sIndex === 11091 || sIndex === 11071 || sIndex === 11081 || sIndex === 77300001) {
        rollTier = 'passif';
        tierLabel = isEn ? 'BiS Raid Perk' : 'Proc BiS Raid';
      } else if (rawName.toLowerCase().includes('marteau') || rawName.toLowerCase().includes('hammer') ||
                 rawName.toLowerCase().includes('coinçage') || rawName.toLowerCase().includes('wedge') ||
                 rawName.toLowerCase().includes('précision') || rawName.toLowerCase().includes('precision') ||
                 rawName.toLowerCase().includes('non-directionnel') || rawName.toLowerCase().includes('non-directional')) {
        isDead = true;
        rollTier = 'dead';
        tierLabel = isEn ? 'Dead Perk' : 'Perk Inutile';
      }
    } else {
      if (rawName.toLowerCase().includes('marteau') || rawName.toLowerCase().includes('hammer') ||
          rawName.toLowerCase().includes('ferveur') || rawName.toLowerCase().includes('fervor') ||
          rawName.toLowerCase().includes('coinçage') || rawName.toLowerCase().includes('wedge') ||
          rawName.toLowerCase().includes('précision') || rawName.toLowerCase().includes('precision') ||
          rawName.toLowerCase().includes('embuscade') || rawName.toLowerCase().includes('ambush') ||
          rawName.toLowerCase().includes('non-directionnel') || rawName.toLowerCase().includes('non-directional') ||
          rawName.toLowerCase().includes('bagarreur') || rawName.toLowerCase().includes('brawler')) {
        rollTier = (sIndex % 10 <= 2 || sIndex > 100000) ? 'passif' : 'high';
        tierLabel = isEn ? 'BiS Perk' : 'Proc BiS';
      } else if (rawName.toLowerCase().includes('protection') || rawName.toLowerCase().includes('soins') ||
                 rawName.toLowerCase().includes('shield and healing') || rawName.toLowerCase().includes('bénédiction')) {
        isDead = true;
        rollTier = 'dead';
        tierLabel = isEn ? 'Dead Perk' : 'Perk Inutile';
      }
    }
    return { 
      text: rawName, 
      rollTier, 
      tierLabel, 
      isDead, 
      isFixed: false, 
      isPerk: true, 
      sIndex, 
      sVal, 
      baseName,
      isMainStat: false,
      isCombatStat: false,
      isDefensive: false
    };
  }

  // Combat stats / Attributes
  const statInfo = (typeof BIBLE_STAT_MAP !== 'undefined' && BIBLE_STAT_MAP[sIndex]) || null;
  let statName = (statInfo && statInfo.name) ? statInfo.name : getMainStatName(className, isEn);
  if (isEn) {
    const enMap = {
      'Critique': 'Crit',
      'Spécialisation': 'Specialization',
      'Rapidité': 'Swiftness',
      'Vitalité': 'Vitality',
      'Force': 'Strength',
      'Dextérité': 'Dexterity',
      'Intelligence': 'Intelligence',
      'Points de Vie': 'Max HP',
      'Points de Vie Max': 'Max HP',
      'Points de Mana Max': 'Max MP',
      'Défense Physique': 'Physical Defense',
      'Défense Magique': 'Magical Defense',
      'Puissance d\'Attaque': 'Attack Power',
      'Dégâts Additionnels': 'Additional Damage'
    };
    if (enMap[statName]) statName = enMap[statName];
  }
  const isDead = isSupport 
    ? (sIndex === 17 || sIndex === 20 || sIndex === 55 || sIndex === 56) 
    : (sIndex === 6 || sIndex === 17 || sIndex === 19 || sIndex === 20 || sIndex === 27 || sIndex === 55 || sIndex === 56);

  const lStatName = (statName || '').toLowerCase();
  const isMainStat = (sIndex === 9 || sIndex === 7 || sIndex === 8 || ['intelligence', 'strength', 'dexterity', 'force', 'dextérité'].some(k => lStatName.includes(k)));
  const isCombatStat = (sIndex === 15 || sIndex === 16 || sIndex === 14 || ['crit', 'spéc', 'spec', 'rapid', 'swift'].some(k => lStatName.includes(k)));
  const isDefensive = (sIndex === 17 || sIndex === 20 || sIndex === 55 || sIndex === 56 || ['vitalit', 'vie', 'hp', 'mana', 'défense', 'defense'].some(k => lStatName.includes(k)));

  const formattedVal = typeof formatNumber === 'function' ? formatNumber(sVal) : sVal.toLocaleString('fr-FR');
  const text = `${statName} (+${formattedVal})`;
  let rollTier = 'mid';
  let tierLabel = isFixed ? (isEn ? 'Fixed Stat' : 'Stat Fixe') : (isEn ? 'Rolled Stat' : 'Stat Roulée');

  if (isDead) {
    rollTier = 'dead';
    tierLabel = isEn ? 'Dead Stat' : 'Stat Morte';
  } else if (!isFixed && (sIndex === 11 || sIndex === 7 || sIndex === 8 || sIndex === 9)) {
    if (sVal >= 12000) { rollTier = 'high'; tierLabel = isEn ? 'High Roll' : 'Roll Élevé'; }
    else if (sVal >= 9000) { rollTier = 'mid'; tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen'; }
    else { rollTier = 'low'; tierLabel = isEn ? 'Low Roll' : 'Roll Faible'; }
  } else if (isFixed) {
    rollTier = 'fixed';
  }

  return { 
    text, 
    rollTier, 
    tierLabel, 
    isDead, 
    isFixed, 
    isPerk: false, 
    sIndex, 
    sVal, 
    statName,
    isMainStat, 
    isCombatStat, 
    isDefensive 
  };
}

function extractBraceletItem(charObj) {
  if (!charObj) return null;
  let br = charObj.bracelet;
  if (!br && charObj.loadout && Array.isArray(charObj.loadout.items)) {
    br = charObj.loadout.items.find(i => i.slot === 'bracelet');
  }
  if (!br && charObj.rawProfile && charObj.rawProfile.loadout && Array.isArray(charObj.rawProfile.loadout.items)) {
    br = charObj.rawProfile.loadout.items.find(i => i.slot === 'bracelet');
  }
  if (!br && charObj.rawProfile && Array.isArray(charObj.rawProfile.rawItems)) {
    br = charObj.rawProfile.rawItems.find(i => i.slot === 'bracelet');
  }
  return br || null;
}

function generateTargetBraceletLines(target, isSupport, isEn) {
  const tSys = resolveTargetSystems(target, isEn);
  const lbl = (tSys && tSys.bracelet && tSys.bracelet.label) || '';
  const normClass = normalizeClassName(target ? target.className : '') || '';
  const mainStat = getMainStatName(normClass, isEn);

  const fixedLines = [];
  const rolledLines = [];

  if (isSupport) {
    fixedLines.push({
      text: isEn ? "Swiftness (+100)" : "Rapidité (+100)",
      rollTier: 'fixed',
      tierLabel: isEn ? 'Fixed Stat' : 'Stat Fixe',
      isDead: false,
      isFixed: true,
      isPerk: false,
      isCombatStat: true,
      isMainStat: false,
      isDefensive: false,
      sIndex: 15,
      sVal: 100
    });
    fixedLines.push({
      text: isEn ? "Specialization (+95)" : "Spécialisation (+95)",
      rollTier: 'fixed',
      tierLabel: isEn ? 'Fixed Stat' : 'Stat Fixe',
      isDead: false,
      isFixed: true,
      isPerk: false,
      isCombatStat: true,
      isMainStat: false,
      isDefensive: false,
      sIndex: 16,
      sVal: 95
    });
    rolledLines.push({
      text: `${mainStat} (+13 200)`,
      rollTier: 'high',
      tierLabel: isEn ? 'High Roll' : 'Roll Élevé',
      isDead: false,
      isFixed: false,
      isPerk: false,
      isCombatStat: false,
      isMainStat: true,
      isDefensive: false,
      sIndex: 9,
      sVal: 13200
    });
    rolledLines.push({
      text: isEn ? "Dagger / Weakness (Defense -2.5% & Ally AP +3%)" : "Poignard / Faiblesse (Défense -2.5% & AP Allié +3%)",
      rollTier: 'passif',
      tierLabel: isEn ? 'BiS Raid Perk' : 'Proc BiS Raid',
      isDead: false,
      isFixed: false,
      isPerk: true,
      isCombatStat: false,
      isMainStat: false,
      isDefensive: false,
      sIndex: 11061,
      sVal: 0
    });
    rolledLines.push({
      text: isEn ? "Cheers / Crit Vulnerability (Crit Dmg -4.8% & Ally AP +3%)" : "Ovation / Vulnérabilité Crit (Dégâts Crit -4.8% & AP Allié +3%)",
      rollTier: 'passif',
      tierLabel: isEn ? 'BiS Raid Perk' : 'Proc BiS Raid',
      isDead: false,
      isFixed: false,
      isPerk: true,
      isCombatStat: false,
      isMainStat: false,
      isDefensive: false,
      sIndex: 11091,
      sVal: 0
    });
  } else {
    // DPS
    const hasSwift = lbl.toLowerCase().includes('rapidité') || lbl.toLowerCase().includes('swift');
    const hasSpec = lbl.toLowerCase().includes('spé') || lbl.toLowerCase().includes('spec');
    const hasCrit = lbl.toLowerCase().includes('crit');

    let stat1 = isEn ? "Crit (+100)" : "Critique (+100)";
    let stat2 = isEn ? "Specialization (+95)" : "Spécialisation (+95)";
    if (hasSwift) {
      stat1 = isEn ? "Swiftness (+100)" : "Rapidité (+100)";
      stat2 = hasCrit ? (isEn ? "Crit (+95)" : "Critique (+95)") : (isEn ? "Specialization (+95)" : "Spécialisation (+95)");
    } else if (hasSpec) {
      stat1 = isEn ? "Specialization (+100)" : "Spécialisation (+100)";
      stat2 = isEn ? "Crit (+95)" : "Critique (+95)";
    }

    fixedLines.push({
      text: stat1,
      rollTier: 'fixed',
      tierLabel: isEn ? 'Fixed Stat' : 'Stat Fixe',
      isDead: false,
      isFixed: true,
      isPerk: false,
      isCombatStat: true,
      isMainStat: false,
      isDefensive: false,
      sVal: 100
    });
    fixedLines.push({
      text: stat2,
      rollTier: 'fixed',
      tierLabel: isEn ? 'Fixed Stat' : 'Stat Fixe',
      isDead: false,
      isFixed: true,
      isPerk: false,
      isCombatStat: true,
      isMainStat: false,
      isDefensive: false,
      sVal: 95
    });

    rolledLines.push({
      text: `${mainStat} (+13 100)`,
      rollTier: 'high',
      tierLabel: isEn ? 'High Roll' : 'Roll Élevé',
      isDead: false,
      isFixed: false,
      isPerk: false,
      isCombatStat: false,
      isMainStat: true,
      isDefensive: false,
      sVal: 13100
    });

    let perk1 = isEn ? "Hammer (Crit Damage +10% & Crit Hit Dmg +1.5%)" : "Marteau (Dégâts Critiques +10% & Dégâts Coup Crit +1.5%)";
    let perk2 = isEn ? "Fervor (Outgoing Damage +5.5% & Cooldown +2%)" : "Ferveur (Dégâts Sortants +5.5% & Cooldown +2%)";

    if (lbl.toLowerCase().includes('coinçage') || lbl.toLowerCase().includes('wedge')) {
      perk2 = isEn ? "Wedge (Additional Damage +3.5% & Demons +2.5%)" : "Coinçage (Dégâts Additionnels +3.5% & Démons +2.5%)";
    } else if (lbl.toLowerCase().includes('précision') || lbl.toLowerCase().includes('precision')) {
      perk1 = isEn ? "Precision (Crit Rate +5% & Crit Hit Dmg +1.5%)" : "Précision (Taux Critique +5% & Dégâts Coup Crit +1.5%)";
    } else if (lbl.toLowerCase().includes('embuscade') || lbl.toLowerCase().includes('ambush')) {
      perk2 = isEn ? "Ambush (Outgoing Damage +3% / Stagger)" : "Embuscade (Dégâts Sortants +3% / Neutralisation)";
    }

    rolledLines.push({
      text: perk1,
      rollTier: 'passif',
      tierLabel: isEn ? 'BiS Perk' : 'Proc BiS',
      isDead: false,
      isFixed: false,
      isPerk: true,
      isCombatStat: false,
      isMainStat: false,
      isDefensive: false
    });
    rolledLines.push({
      text: perk2,
      rollTier: 'passif',
      tierLabel: isEn ? 'BiS Perk' : 'Proc BiS',
      isDead: false,
      isFixed: false,
      isPerk: true,
      isCombatStat: false,
      isMainStat: false,
      isDefensive: false
    });
  }

  return { fixedLines, rolledLines };
}

function computeBraceletLineCps(pFixed, pRolled, tFixed, tRolled, cpImpact, isSupport, pClassName, tClassName, isEn) {
  const extractStatNum = (txt) => {
    const m = (txt || '').match(/\+([0-9\s ,]+)/);
    if (!m) return 0;
    return parseInt(m[1].replace(/[\s ,]/g, ''), 10) || 0;
  };

  const getPerkFamily = (txt) => {
    const l = (txt || '').toLowerCase();
    for (const f of ['poignard', 'dagger', 'exposition', 'expose', 'ferveur', 'fervor', 'ovation', 'cheers', 'protection', 'soins', 'marteau', 'hammer', 'précision', 'precision', 'coinçage', 'wedge', 'embuscade', 'ambush', 'non-directionnel', 'non-directional', 'bagarreur', 'brawler']) {
      if (l.includes(f)) {
        return f.replace('dagger', 'poignard')
                .replace('expose', 'exposition')
                .replace('fervor', 'ferveur')
                .replace('cheers', 'ovation')
                .replace('soins', 'protection')
                .replace('hammer', 'marteau')
                .replace('precision', 'précision')
                .replace('wedge', 'coinçage')
                .replace('ambush', 'embuscade')
                .replace('non-directional', 'non-directionnel')
                .replace('brawler', 'bagarreur');
      }
    }
    return 'other';
  };

  const getLinePerkMultiplier = (line) => {
    if (!line || line.isDead || !line.isPerk) return 0;
    const sIdx = line.sIndex || 0;
    const txt = (line.text || '').toLowerCase();

    const idMap = {
      11061: 12.75, 11062: 10.90, 11063: 9.06, 11064: 7.21,
      11071: 12.75, 11072: 10.90, 11073: 9.06, 11074: 7.21,
      11081: 12.75, 11082: 10.90, 11083: 9.06, 11084: 7.21,
      11091: 12.75, 11092: 10.90, 11093: 9.06, 11094: 7.21,
      11181: 4.90, 11182: 4.20, 11183: 3.50, 11184: 2.80,
      77300001: 6.00,
      11021: 5.00, 11022: 4.20, 11023: 3.40, 11024: 2.60,
      11051: 5.50, 11052: 5.00, 11053: 4.50, 11054: 4.00,
      11011: 4.50, 11012: 3.70, 11013: 3.00, 11014: 2.20,
      11041: 3.50, 11042: 3.00, 11043: 2.50, 11044: 2.00,
      605100031: 3.00, 605100032: 2.50, 605100033: 2.00,
      605100131: 3.00, 605100132: 2.50, 605100133: 2.00,
      605100171: 3.50, 605100172: 3.00, 605100173: 2.50
    };
    if (sIdx && idMap[sIdx]) return idMap[sIdx];

    if (isSupport) {
      if (txt.includes('poignard') || txt.includes('dagger')) {
        if (txt.includes('2.5%') || txt.includes('+3%')) return 12.75;
        if (txt.includes('2.1%') || txt.includes('+2.5%')) return 10.90;
        if (txt.includes('1.8%') || txt.includes('+2%')) return 9.06;
        return 7.21;
      }
      if (txt.includes('exposition') || txt.includes('expose')) {
        if (txt.includes('2.5%') || txt.includes('+3%')) return 12.75;
        if (txt.includes('2.1%') || txt.includes('+2.5%')) return 10.90;
        if (txt.includes('1.8%') || txt.includes('+2%')) return 9.06;
        return 7.21;
      }
      if (txt.includes('ferveur') || txt.includes('fervor')) {
        if (txt.includes('1.3%') || txt.includes('+3%')) return 12.75;
        if (txt.includes('1.1%') || txt.includes('+2.5%')) return 10.90;
        if (txt.includes('0.9%') || txt.includes('+2%')) return 9.06;
        return 7.21;
      }
      if (txt.includes('ovation') || txt.includes('cheers')) {
        if (txt.includes('4.8%') || txt.includes('+3%')) return 12.75;
        if (txt.includes('4.2%') || txt.includes('+2.5%')) return 10.90;
        if (txt.includes('3.6%') || txt.includes('+2%')) return 9.06;
        return 7.21;
      }
      if (txt.includes('protection') || txt.includes('soins') || txt.includes('recovery')) {
        if (txt.includes('3.5%')) return 4.90;
        if (txt.includes('3%')) return 4.20;
        if (txt.includes('2.5%')) return 3.50;
        return 2.80;
      }
    } else {
      if (txt.includes('marteau') || txt.includes('hammer')) {
        if (txt.includes('10%')) return 5.00;
        if (txt.includes('8.4%')) return 4.20;
        if (txt.includes('6.8%')) return 3.40;
        return 2.60;
      }
      if (txt.includes('ferveur') || txt.includes('fervor')) {
        if (txt.includes('5.5%')) return 5.50;
        if (txt.includes('5%')) return 5.00;
        if (txt.includes('4.5%')) return 4.50;
        return 4.00;
      }
      if (txt.includes('précision') || txt.includes('precision')) {
        if (txt.includes('5%')) return 4.50;
        if (txt.includes('4.2%')) return 3.70;
        if (txt.includes('3.4%')) return 3.00;
        return 2.20;
      }
      if (txt.includes('coinçage') || txt.includes('wedge')) {
        if (txt.includes('3.5%')) return 3.50;
        if (txt.includes('3%')) return 3.00;
        if (txt.includes('2.5%')) return 2.50;
        return 2.00;
      }
      if (txt.includes('embuscade') || txt.includes('ambush')) return 3.00;
      if (txt.includes('non-directionnel') || txt.includes('non-directional')) return 3.50;
      if (txt.includes('bagarreur') || txt.includes('brawler')) return 3.50;
      if (txt.includes('dégâts sortants') || txt.includes('outgoing damage')) return 3.00;
    }
    return 0;
  };

  const pAll = [...pFixed, ...pRolled];
  const tAll = [...tFixed, ...tRolled];

  // Main Stat
  const isMainStatLine = (l) => l.isMainStat || (!l.isPerk && (l.text.includes('Force') || l.text.includes('Strength') || l.text.includes('Dext') || l.text.includes('Int')));
  const pMainLine = pAll.find(isMainStatLine) || null;
  const tMainLine = tAll.find(isMainStatLine) || null;
  const pMainVal = pMainLine ? (pMainLine.sVal || extractStatNum(pMainLine.text)) : 0;
  const tMainVal = tMainLine ? (tMainLine.sVal || extractStatNum(tMainLine.text)) : 0;
  const mainDiff = tMainVal - pMainVal;

  // Combat Stats
  const isCombatStatLine = (l) => l.isCombatStat || (!l.isPerk && !l.isMainStat && !l.isDefensive && (l.text.includes('Rapid') || l.text.includes('Swift') || l.text.includes('Spé') || l.text.includes('Spec') || l.text.includes('Crit') || l.text.includes('Dom') || l.text.includes('Endur') || l.text.includes('Expert')));
  const pCombatLines = pAll.filter(isCombatStatLine);
  const tCombatLines = tAll.filter(isCombatStatLine);
  const pCombatSum = pCombatLines.reduce((s, l) => s + (l.sVal || extractStatNum(l.text)), 0);
  const tCombatSum = tCombatLines.reduce((s, l) => s + (l.sVal || extractStatNum(l.text)), 0);
  const combatDiff = tCombatSum - pCombatSum;

  // Defensive lines
  const isDefensiveLine = (l) => l.isDefensive || (!l.isPerk && (l.text.includes('Vitalit') || l.text.includes('Points de Vie') || l.text.includes('Max HP') || l.text.includes('Mana') || l.text.includes('Défense')));
  const pDefensiveLines = pAll.filter(isDefensiveLine);
  const pRolledDef = pRolled.filter(isDefensiveLine);

  // Perks
  const pPerks = pAll.filter(l => l.isPerk).map(l => ({ ...l, mult: getLinePerkMultiplier(l), family: getPerkFamily(l.text) }));
  const tPerks = tAll.filter(l => l.isPerk).map(l => ({ ...l, mult: getLinePerkMultiplier(l), family: getPerkFamily(l.text) }));

  const usedP = new Set();
  const pairs = [];

  // Step 1: Match exact families first
  tPerks.forEach((tP) => {
    const matchIdx = pPerks.findIndex((pP, pIdx) => !usedP.has(pIdx) && pP.family !== 'other' && pP.family === tP.family);
    if (matchIdx !== -1) {
      usedP.add(matchIdx);
      pairs.push({ tP, pP: pPerks[matchIdx], family: tP.family });
    }
  });

  // Step 2: Match remaining target perks with available player perks by minimal difference
  const unmatchedT = tPerks.filter(tP => !pairs.some(pair => pair.tP === tP));
  unmatchedT.sort((a, b) => b.mult - a.mult); // highest first

  unmatchedT.forEach(tP => {
    let bestIdx = -1, minDiff = Infinity;
    pPerks.forEach((pP, pIdx) => {
      if (usedP.has(pIdx)) return;
      const diff = Math.abs(tP.mult - pP.mult);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = pIdx;
      }
    });

    if (bestIdx !== -1) {
      usedP.add(bestIdx);
      pairs.push({ tP, pP: pPerks[bestIdx], family: tP.family });
    } else {
      // Paired with a rolled defensive line if available, or fixed defensive line, or null
      const defLine = pRolledDef[pairs.filter(p => !p.pP).length] || pDefensiveLines[pairs.filter(p => !p.pP).length] || null;
      pairs.push({ tP, pP: null, defLine, family: tP.family });
    }
  });

  // Compute raw gains
  let totalRawGain = 0;
  pairs.forEach(pair => {
    const pMult = pair.pP ? pair.pP.mult : 0;
    pair.gain = Math.max(0, Number((pair.tP.mult - pMult).toFixed(2)));
    totalRawGain += pair.gain;
  });

  // Distribute cpImpact across pairs with gain > 0
  let distributedCp = 0;
  pairs.forEach(pair => {
    if (cpImpact > 0 && totalRawGain > 0 && pair.gain > 0) {
      pair.cp = Math.round((pair.gain / totalRawGain) * cpImpact);
      distributedCp += pair.cp;
    } else {
      pair.cp = 0;
    }
  });

  // Reconcile rounding to match cpImpact exactly
  if (cpImpact > 0 && distributedCp !== cpImpact && totalRawGain > 0) {
    const diff = cpImpact - distributedCp;
    const maxPair = pairs.reduce((best, cur) => cur.cp > (best ? best.cp : 0) ? cur : best, null);
    if (maxPair) maxPair.cp += diff;
  }

  return {
    pairs,
    pMainLine,
    tMainLine,
    pMainVal,
    tMainVal,
    mainDiff,
    pCombatLines,
    tCombatLines,
    pCombatSum,
    tCombatSum,
    combatDiff,
    pDefensiveLines,
    pRolledDef,
    totalRawGain
  };
}

function buildBraceletBreakdownHtml(player, target, cpImpact, isEn) {
  const isSupport = player.role === 'support' || (player.className && ['Paladin', 'Bard', 'Artist'].some(s => (player.className || '').toLowerCase().includes(s.toLowerCase())));
  const pClassName = player.className || '';
  const tClassName = (target && target.className) || pClassName;

  // 1. Récupération du Bracelet Joueur
  let pBrItem = extractBraceletItem(player);

  const pFixed = [];
  const pRolled = [];
  if (pBrItem && pBrItem.data && Array.isArray(pBrItem.data.stats)) {
    pBrItem.data.stats.forEach(st => {
      const dec = decodeBraceletStat(st, pClassName, isSupport, isEn);
      if (dec.isFixed) pFixed.push(dec);
      else pRolled.push(dec);
    });
  }

  // Compléter les lignes si le bracelet joueur a des slots libres
  while (pFixed.length + pRolled.length < 5) {
    pRolled.push({
      text: isEn ? "Open Slot (Reroll Available)" : "Emplacement Libre (Reroll Disponible)",
      rollTier: 'low',
      tierLabel: isEn ? 'To Roll' : 'À Reroller',
      isDead: false,
      isFixed: false,
      isPerk: false,
      isMainStat: false,
      isCombatStat: false,
      isDefensive: false
    });
  }

  // 2. Récupération du Bracelet Cible Référence
  let tBrItem = extractBraceletItem(target);

  const tFixed = [];
  const tRolled = [];
  if (tBrItem && tBrItem.data && Array.isArray(tBrItem.data.stats)) {
    tBrItem.data.stats.forEach(st => {
      const dec = decodeBraceletStat(st, tClassName, isSupport, isEn);
      if (dec.isFixed) tFixed.push(dec);
      else tRolled.push(dec);
    });
  } else {
    // Génération synthétique canonique basée sur le profil cible
    const syn = generateTargetBraceletLines(target, isSupport, isEn);
    syn.fixedLines.forEach(l => tFixed.push(l));
    syn.rolledLines.forEach(l => tRolled.push(l));
  }

  // 3. Calcul de la distribution exacte du CP par composante / perk
  const lineCps = computeBraceletLineCps(pFixed, pRolled, tFixed, tRolled, cpImpact, isSupport, pClassName, tClassName, isEn);

  // Helpers de rendu par ligne
  const renderTargetLine = (l) => {
    let pillHtml = '';
    if (l.isPerk) {
      const pair = lineCps.pairs.find(p => p.tP === l || p.tP.text === l.text);
      if (pair && pair.cp > 0) {
        pillHtml = `<span class="line-cp-pill">+${pair.cp} CP</span>`;
      } else if (pair && pair.pP && Math.abs(pair.tP.mult - pair.pP.mult) < 0.1) {
        pillHtml = `<span class="line-parity-pill">${isEn ? 'BiS Parity' : 'Parité BiS'}</span>`;
      }
    } else if (l === lineCps.tMainLine || l.isMainStat) {
      if (lineCps.mainDiff < 0) {
        const lead = formatNumber(Math.abs(lineCps.mainDiff));
        pillHtml = `<span class="line-parity-pill" style="color:#9CB4C6;" title="${isEn ? 'Counted in Main Stat & Base AP row' : 'Comptabilisé dans la ligne Stat Principale & Attaque Base'}">-${lead} ${isEn ? 'vs Player' : 'vs Joueur'}</span>`;
      } else if (lineCps.mainDiff > 0) {
        const lead = formatNumber(lineCps.mainDiff);
        pillHtml = `<span class="line-parity-pill" title="${isEn ? 'Counted in Base AP row' : 'Comptabilisé dans Attaque Base'}">+${lead} ${isEn ? '(Base AP)' : '(Attaque Base)'}</span>`;
      }
    } else if (l.isCombatStat || lineCps.tCombatLines.includes(l)) {
      pillHtml = `<span class="line-parity-pill" title="${isEn ? 'Counted in Combat Stats row' : 'Comptabilisé dans Stats de Combat'}">${isEn ? 'Combat Stats' : 'Stats de Combat'}</span>`;
    } else if (l.isDefensive) {
      pillHtml = `<span class="line-parity-pill" style="color:var(--text-muted);">${isEn ? 'Survival' : 'Survie'}</span>`;
    }

    return `
        <div class="acc-line-badge ${l.rollTier} ${l.isDead ? 'dead' : ''}">
          <span>${l.isDead ? '' : (l.rollTier === 'passif' ? '' : (l.rollTier === 'high' ? '' : (l.rollTier === 'fixed' ? '' : (l.rollTier === 'mid' ? '' : ''))))}${escapeHtml(l.text)}</span>
          ${pillHtml}
          <span class="acc-line-tier-tag">${escapeHtml(l.tierLabel)}</span>
        </div>
      `;
  };

  const renderPlayerLine = (l) => {
    let pillHtml = '';
    if (l === lineCps.pMainLine || l.isMainStat) {
      if (lineCps.mainDiff < 0) {
        const lead = formatNumber(Math.abs(lineCps.mainDiff));
        pillHtml = `<span class="line-lead-pill">+${lead} ${getMainStatName(pClassName, isEn)} (${isEn ? 'Player Lead' : 'Avance Joueur'})</span>`;
      }
    } else if (l.isPerk) {
      const pair = lineCps.pairs.find(p => p.pP === l || (p.pP && p.pP.text === l.text));
      if (pair && pair.pP && Math.abs(pair.tP.mult - pair.pP.mult) < 0.1) {
        pillHtml = `<span class="line-parity-pill">${isEn ? 'BiS (Parity)' : 'Parité BiS'}</span>`;
      } else if (pair && pair.cp > 0) {
        pillHtml = `<span class="line-parity-pill" style="color:#E0A43A;" title="${isEn ? 'Target has higher perk tier' : 'Cible possède un palier supérieur'}">${isEn ? 'Tier Upgrade Avail.' : 'Palier Supérieur Dispo'}</span>`;
      }
    } else if (l.isDefensive) {
      pillHtml = `<span class="line-parity-pill" style="color:var(--text-muted);">${isEn ? 'Survival (0% Buff CP)' : 'Survie (0% Buff CP)'}</span>`;
    }

    return `
        <div class="acc-line-badge ${l.rollTier} ${l.isDead ? 'dead' : ''}">
          <span>${l.isDead ? '' : (l.rollTier === 'passif' ? '' : (l.rollTier === 'high' ? '' : (l.rollTier === 'fixed' ? '' : (l.rollTier === 'mid' ? '' : ''))))}${escapeHtml(l.text)}</span>
          ${pillHtml}
          <span class="acc-line-tier-tag">${escapeHtml(l.tierLabel)}</span>
        </div>
      `;
  };

  // 4. Rendu des badges du Joueur
  const pFixedHtml = pFixed.map(renderPlayerLine).join('');
  const pRolledHtml = pRolled.map(renderPlayerLine).join('');

  // 5. Rendu des badges de la Cible
  const tFixedHtml = tFixed.map(renderTargetLine).join('');
  const tRolledHtml = tRolled.map(renderTargetLine).join('');

  // 6. Tableau dynamique des lignes
  let tableRowsHtml = `
      <tr>
        <td><strong>${isEn ? 'Combat Stats (Crit/Spec/Swift)' : 'Stats de Combat (Crit / Spé / Rap)'}</strong></td>
        <td>${lineCps.pCombatLines.length > 0 ? lineCps.pCombatLines.map(l => escapeHtml(l.text)).join(' & ') : (isEn ? 'None (0 pt)' : 'Aucune (0 pt)')}</td>
        <td>${lineCps.tCombatLines.length > 0 ? lineCps.tCombatLines.map(l => escapeHtml(l.text)).join(' & ') : (isEn ? 'None (0 pt)' : 'Aucune (0 pt)')}</td>
        <td class="col-cp-gain" style="color:var(--text-muted);">= 0 CP <em style="font-size:11px; font-weight:normal; display:block;">(${isEn ? 'Tracked in Combat Stats row' : 'Comptabilisé dans Stats de Combat'})</em></td>
      </tr>
      <tr>
        <td><strong>${isEn ? 'Main Stat' : 'Statistique Principale'} (${getMainStatName(pClassName, isEn)})</strong></td>
        <td>${lineCps.pMainLine ? escapeHtml(lineCps.pMainLine.text) : '—'}</td>
        <td>${lineCps.tMainLine ? escapeHtml(lineCps.tMainLine.text) : '—'}</td>
        <td class="col-cp-gain" style="${lineCps.mainDiff < 0 ? 'color:#9CB4C6;' : 'color:var(--text-muted);'}">
          ${lineCps.mainDiff < 0 
            ? `+${formatNumber(Math.abs(lineCps.mainDiff))} ${isEn ? 'Player Lead' : 'Avance Joueur'} <em style="font-size:11px; font-weight:normal; display:block;">(${isEn ? 'Tracked in Base AP row' : 'Comptabilisé dans Attaque Base'})</em>` 
            : `= 0 CP <em style="font-size:11px; font-weight:normal; display:block;">(${isEn ? 'Tracked in Base AP row' : 'Comptabilisé dans Attaque Base'})</em>`}
        </td>
      </tr>
    `;

  lineCps.pairs.forEach((pair) => {
    const familyName = pair.family.charAt(0).toUpperCase() + pair.family.slice(1);
    const icon = pair.tP.rollTier === 'passif' ? '' : '';
    const playerDesc = pair.pP 
      ? escapeHtml(pair.pP.text) 
      : (pair.defLine ? `${escapeHtml(pair.defLine.text)} <em style="font-size:12px; color:var(--text-muted);">(${isEn ? 'Survival 0% Buff CP' : 'Survie 0% Buff CP'})</em>` : (isEn ? 'Empty Slot' : 'Emplacement Libre'));
    const targetDesc = escapeHtml(pair.tP.text);
    const cpText = pair.cp > 0 
      ? `<strong style="color:#8CC084;">+${pair.cp} CP</strong> <em style="font-size:12px; font-weight:normal; display:block; color:#8CC084;">(+${pair.gain.toFixed(2)}% ${isSupport ? 'Buff' : 'DPS'})</em>` 
      : `<span style="color:var(--text-muted);">= 0 CP (${isEn ? 'BiS Parity' : 'Parité BiS'})</span>`;

    tableRowsHtml += `
        <tr>
          <td><strong>${icon} ${isEn ? 'Raid Perk' : 'Passif Raid'} : ${escapeHtml(familyName)}</strong></td>
          <td>${playerDesc}</td>
          <td>${targetDesc}</td>
          <td class="col-cp-gain">${cpText}</td>
        </tr>
      `;
  });

  // 7. Formulation du diagnostic personnalisé
  let verdictText = '';
  if (cpImpact <= 0) {
    verdictText = isEn
      ? "Optimal rolls and equivalent high-tier performance to benchmark reference."
      : "Rolls de haute qualité et parité optimale avec la référence ciblée.";
  } else {
    const hasDef = lineCps.pDefensiveLines.length > 0;
    if (isSupport) {
      if (hasDef && lineCps.mainDiff < 0) {
        const lead = formatNumber(Math.abs(lineCps.mainDiff));
        verdictText = isEn
          ? `The +${cpImpact} CP gap stems entirely from raid support perks (+${lineCps.totalRawGain.toFixed(2)}% Buff Power). Target has higher-tier perks and an active party buff replacing your survival roll (${lineCps.pDefensiveLines.map(d=>d.text).join(', ')}). Your ${getMainStatName(pClassName, isEn)} is higher (+${lead} lead) and is already credited in the Main Stat & Base AP row.`
          : `L'écart de +${cpImpact} CP provient intégralement des passifs de soutien de raid (+${lineCps.totalRawGain.toFixed(2)}% de Buff Power) : la cible possède des passifs de palier supérieur et un passif de groupe actif remplaçant votre ligne de confort (${lineCps.pDefensiveLines.map(d=>d.text).join(', ')}). Votre ${getMainStatName(pClassName, isEn)} est supérieure (+${lead} d'avance) et est déjà créditée dans la ligne Stat Principale & Attaque Base.`;
      } else {
        verdictText = isEn
          ? `Bridge the +${cpImpact} CP gap by upgrading your raid perks (Dagger / Expose Weakness / Cheers) to higher tiers and replacing defensive lines with active party perks.`
          : `Combler les +${cpImpact} CP en faisant monter le palier de vos passifs de raid (Poignard / Exposition / Ferveur) et en remplaçant les stats défensives par des passifs de groupe actifs.`;
      }
    } else {
      if (lineCps.mainDiff < 0) {
        const lead = formatNumber(Math.abs(lineCps.mainDiff));
        verdictText = isEn
          ? `The +${cpImpact} CP delta is driven by higher raid perk tiers (Hammer / Fervor / Wedge). Your ${getMainStatName(pClassName, isEn)} has a +${lead} advantage credited in Base AP.`
          : `L'écart de +${cpImpact} CP provient des paliers supérieurs de passifs de raid (Marteau / Ferveur / Coinçage). Votre ${getMainStatName(pClassName, isEn)} possède une avance de +${lead} créditée dans l'Attaque de Base.`;
      } else {
        verdictText = isEn
          ? `Optimize raid perks (Hammer / Fervor / Precision) to bridge the +${cpImpact} CP gap.`
          : `Optimiser les passifs de raid (Marteau / Ferveur / Précision) pour combler les +${cpImpact} CP d'écart.`;
      }
    }
  }

  const pDeadStats = pRolled.filter(l => l.isDead).concat(pFixed.filter(l => l.isDead));
  const pHasDead = pDeadStats.length > 0;

  return `
      <div class="acc-breakdown-panel bracelet-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'Individual T4 Bracelet & Passive Rolls Breakdown' : 'Détail du Bracelet T4 & Lignes de Passifs'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(232, 230, 220, 0.15); border-color: rgba(232, 230, 220, 0.35); color: #CFCBBD;">
              ${cpImpact > 0 ? `+${cpImpact} CP ${isEn ? 'gap' : 'd\'écart global'}` : (isEn ? 'Optimized parity' : 'Parité optimale')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn 
              ? 'Detailed side-by-side comparison of fixed stats, main stat rolls, and BiS perks to bridge the CP gap.'
              : 'Comparaison détaillée des caractéristiques de base, rolls de statistiques principales et passifs BiS pour combler l\'écart de CP.'}
          </div>
        </div>

        <div class="bracelet-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card bracelet-card player-card ${pHasDead ? 'heavy-gap' : (cpImpact > 0 ? 'has-gap' : 'parity')}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${isEn ? 'Your T4 Bracelet' : 'Votre Bracelet T4'}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(232, 230, 220, 0.2); color: #CFCBBD; margin-left: 6px;">
                  ${isEn ? 'Ancient / Relic' : 'Relique T4'}
                </span>
              </div>
              <span class="acc-piece-gain-pill neutral">
                ${pFixed.length + pRolled.length} / 5 ${isEn ? 'lines' : 'lignes'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-side-section">
                <span class="acc-side-lbl player">${isEn ? 'Fixed Combat Stats' : 'Caractéristiques Fixes de Base'}</span>
                ${pFixedHtml}
              </div>
              <div class="acc-side-section" style="margin-top: 6px;">
                <span class="acc-side-lbl player">${isEn ? 'Rolled Stats & Perks' : 'Statistiques Roulées & Passifs'}</span>
                ${pRolledHtml}
              </div>
            </div>
          </div>

          <!-- Carte Cible Référence -->
          <div class="acc-piece-card bracelet-card target-card parity">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence BiS'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(140, 192, 132, 0.2); color: #8CC084; margin-left: 6px;">
                  ${isEn ? 'Target Reference' : 'Référence Cible'}
                </span>
              </div>
              <span class="acc-piece-gain-pill ${cpImpact > 0 ? 'gap' : 'neutral'}">
                ${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-side-section">
                <span class="acc-side-lbl target">${isEn ? 'Target Combat Stats' : 'Caractéristiques Fixes Cible'}</span>
                ${tFixedHtml}
              </div>
              <div class="acc-side-section" style="margin-top: 6px;">
                <span class="acc-side-lbl target">${isEn ? 'Target Rolled Stats & Perks' : 'Statistiques Roulées & Passifs Cible'}</span>
                ${tRolledHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé des Gains par Perk / Stat -->
        <div class="bracelet-compare-table-wrap">
          <div class="bracelet-compare-table-title">
            <span></span>
            <strong>${isEn ? 'Individual CP Contribution by Perk & Stat' : 'Décomposition Détaillée des Gains de CP par Statistique & Passif'}</strong>
          </div>
          <table class="bracelet-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Component / Perk' : 'Composante / Ligne'}</th>
                <th>${isEn ? 'Your Bracelet' : 'Votre Bracelet'}</th>
                <th>${isEn ? 'Benchmark Target' : 'Référence Cible'}</th>
                <th style="text-align:right;">${isEn ? 'CP Delta' : 'Gain en CP'}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Total Bracelet System Gap' : 'Gain Total du Système Bracelet'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="bracelet-verdict-banner">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            <strong>${isEn ? 'Bracelet Diagnostic & Recommendations:' : 'Diagnostic & Recommandations du Bracelet :'}</strong>
            <span>${verdictText}</span>
          </div>
        </div>
      </div>
    `;
}
