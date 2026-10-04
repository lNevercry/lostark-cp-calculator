// Onglet Benchmark et synchronisation live lostark.bible.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function renderBenchmarkTab() {
  const heroCard = document.getElementById('benchmarkHeroCard');
  if (!heroCard) return;

  const t = (window.i18n && window.i18n.t) || (k => k);
  const isEn = isEnglishLang();

  const player = getCurrentActiveCharacter();
  if (!player) return;

  // Enrichit le profil joueur depuis CANONICAL_PRESETS si c'est un profil du roster sans rawProfile
  const pId = (player.id || player.name || '').toLowerCase();
  const canonPlayer = null;
  if (canonPlayer) {
    if (!player.rawProfile) player.rawProfile = canonPlayer;
    if (!player.items || player.items.length === 0) player.items = canonPlayer.items;
    if (!player.engravings || player.engravings.length === 0) player.engravings = canonPlayer.engravings;
    if (!player.arkGridCores || player.arkGridCores.length === 0) player.arkGridCores = canonPlayer.arkGridCores;
    if (!player.gemParts) player.gemParts = canonPlayer.gemParts;
  }

  const pClass = normalizeClassName(player.className || '').toLowerCase();
  const isSupportClass = ['paladin', 'bard', 'artist', 'valkyrie'].some(s => pClass.includes(s));
  const pRole = player.role || (isSupportClass ? 'support' : 'dps');
  const avail = getAvailableBenchmarks(player);

  // Résolution du profil cible (100% profils LIVE ou Roster réel, zéro preset statique, zéro profil synthétique)
  let target = benchmarkState.customTarget;

  // VALIDATION STRICTE DE LA CLASSE, DU RÔLE ET EXCLUSION DU JOUEUR :
  // Si la cible en cache ou sélectionnée n'est pas de la même classe ou du même rôle, ou si c'est le joueur lui-même, on la rejette obligatoirement
  const pName = (player.name || player.id || '').toLowerCase().trim();
  if (target) {
    const tName = (target.name || target.id || '').toLowerCase().trim();
    const tClass = normalizeClassName(target.className || '').toLowerCase();
    const tRole = target.role || (isSupportClass ? (isSupportSpecName(target.spec) ? 'support' : 'dps') : 'dps');
    if (!target.isLive || tName === pName || tClass !== pClass || tRole !== pRole) {
      target = null;
      benchmarkState.customTarget = null;
      benchmarkState.currentTargetId = null;
    }
  }

  if (!target) {
    if (benchmarkState.currentTargetId) {
      // 1. Cherche dans les profils disponibles de CETTE CLASSE et MÊME RÔLE (sans le joueur lui-même)
      target = avail.find(b => {
        if (b.id !== benchmarkState.currentTargetId) return false;
        const bName = (b.name || b.id || '').toLowerCase().trim();
        if (bName === pName) return false;
        if (normalizeClassName(b.className || '').toLowerCase() !== pClass) return false;
        const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
        return bRole === pRole;
      });
      // 2. Cherche dans les profils LIVE recherchés de CETTE CLASSE et MÊME RÔLE (sans le joueur lui-même)
      if (!target) {
        target = (benchmarkState.searchedTargets || []).find(b => {
          if (b.id !== benchmarkState.currentTargetId) return false;
          const bName = (b.name || b.id || '').toLowerCase().trim();
          if (bName === pName) return false;
          if (normalizeClassName(b.className || '').toLowerCase() !== pClass) return false;
          const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
          return bRole === pRole;
        });
      }
    }
  }

  // Priorité absolue aux profils LIVE de lostark.bible (MÊME CLASSE ET MÊME RÔLE, SANS LE JOUEUR LUI-MÊME) :
  const hasLivePeer = avail.some(b => {
    if (!b.isLive) return false;
    const bName = (b.name || b.id || '').toLowerCase().trim();
    if (bName === pName) return false;
    if (normalizeClassName(b.className || '').toLowerCase() !== pClass) return false;
    const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
    return bRole === pRole;
  }) || (benchmarkState.searchedTargets || []).some(b => {
    if (!b || !b.isLive) return false;
    const bName = (b.name || b.id || '').toLowerCase().trim();
    if (bName === pName) return false;
    if (normalizeClassName(b.className || '').toLowerCase() !== pClass) return false;
    const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
    return bRole === pRole;
  });

  // Si la cible actuelle est dynamique ou absente, mais qu'un profil LIVE de cette classe et rôle est disponible en mémoire, on bascule dessus immédiatement
  // Profils proposés (réservoir + fiches en direct) ; l'ancienne liste figée ne sert qu'en dernier recours
  const sugState = ensureSuggestedPeers(player);

  if (!target && hasLivePeer) {
    const liveOpt = findOptimalBenchmark(player);
    if (liveOpt && liveOpt.isLive && (liveOpt.name || '').toLowerCase().trim() !== pName) {
      target = liveOpt;
      benchmarkState.customTarget = liveOpt;
      benchmarkState.currentTargetId = liveOpt.id;
    }
  }


  if (!target) {
    target = findOptimalBenchmark(player);
    if (target) benchmarkState.currentTargetId = target.id;
  }
  renderSuggestedPeers(player, target);

  if (!target) {
    // Si aucun profil n'est disponible et aucun fetch n'est en cours :
    // État d'invitation à la recherche (NON BLOQUANT, interactif)
    heroCard.innerHTML = `
        <div class="bench-char-card" style="text-align: center; padding: 48px 24px; border: 1px dashed rgba(232, 230, 220, 0.4); background: transparent; border-radius: 0; margin: 16px 0;">
          <div style="font-size: 40px; margin-bottom: 12px;"></div>
          <div style="font-size: 19px; font-weight: 700; color: #E0A43A; margin-bottom: 8px;">
            ${isEn ? 'No Benchmark Profile Selected' : 'Aucun Profil de Référence Sélectionné'}
          </div>
          <div style="font-size: 15px; color: var(--text-muted); max-width: 540px; margin: 0 auto 18px; line-height: 1.5;">
            ${isEn
              ? `To benchmark your <strong>${escapeHtml(player.className)}</strong> (${escapeHtml(player.name)}), enter any player name or lostark.bible profile link in the search bar below.`
              : `Pour comparer votre <strong>${escapeHtml(player.className)}</strong> (${escapeHtml(player.name)}), saisissez le pseudo d'un joueur ou un lien lostark.bible dans la barre de recherche ci-dessous.`}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid rgba(232, 230, 220, 0.3); color: #E0A43A; padding: 6px 16px; border-radius: 0; font-size: 13px; font-weight: 600;">
            <span>${isEn ? '100% Live lostark.bible profiles supported' : 'Profils 100% LIVE lostark.bible supportés'}</span>
          </div>
        </div>
      `;

    // Remplissage du sélecteur avec les profils recherchés disponibles de cette classe et rôle
    const select = document.getElementById('benchmarkPresetSelect');
    if (select) {
      let optionsHtml = `<option value="">${isEn ? 'Select or search a benchmark profile...' : 'Sélectionnez ou recherchez un profil...'} </option>`;
      
      const searchedList = (benchmarkState.searchedTargets || []).filter(s => {
        if (!s || !s.isLive) return false;
        const sName = (s.name || s.id || '').toLowerCase().trim();
        if (sName === pName) return false;
        if (normalizeClassName(s.className || '').toLowerCase() !== pClass) return false;
        const sRole = s.role || (isSupportClass ? (isSupportSpecName(s.spec) ? 'support' : 'dps') : 'dps');
        return sRole === pRole;
      });
      if (searchedList.length > 0) {
        optionsHtml += `<optgroup label="${isEn ? 'Live Profiles (' + escapeHtml(player.className) + ')' : 'Profils LIVE Réels (' + escapeHtml(player.className) + ')'}">`;
        searchedList.forEach(s => {
          optionsHtml += `<option value="${escapeHtml(s.id)}">
              ${escapeHtml(s.name)} • ${escapeHtml(s.spec || '')} (${s.ilvl.toFixed(1)} iLvl - ${formatNumber(Math.round(s.cp))} CP) [LIVE]
            </option>`;
        });
        optionsHtml += `</optgroup>`;
      }

      select.innerHTML = optionsHtml;
    }

    const gapsGrid = document.getElementById('benchmarkGapsGrid');
    if (gapsGrid) gapsGrid.innerHTML = '';
    const planEl = document.getElementById('benchmarkActionPlan');
    if (planEl) planEl.innerHTML = '';
    const matrixEl = document.getElementById('benchmarkSystemsMatrix');
    if (matrixEl) matrixEl.innerHTML = '';
    const reconEl = document.getElementById('benchmarkCpReconciliation');
    if (reconEl) reconEl.innerHTML = '';
    return;
  }

  // 1. Mise à jour du Sélecteur de Presets & Choix Libre (MÊME CLASSE ET MÊME RÔLE UNIQUEMENT)
  const select = document.getElementById('benchmarkPresetSelect');
  if (select) {
    let optionsHtml = '';

    // 1. Profils LIVE de CETTE CLASSE et MÊME RÔLE recherchés & synchronisés en direct sur lostark.bible (sans le joueur lui-même)
    const searchedList = (benchmarkState.searchedTargets || []).filter(s => {
      if (!s || !s.isLive) return false;
      const sName = (s.name || s.id || '').toLowerCase().trim();
      if (sName === pName) return false;
      if (normalizeClassName(s.className || '').toLowerCase() !== pClass) return false;
      const sRole = s.role || (isSupportClass ? (isSupportSpecName(s.spec) ? 'support' : 'dps') : 'dps');
      return sRole === pRole;
    });
    if (benchmarkState.customTarget && normalizeClassName(benchmarkState.customTarget.className || '').toLowerCase() === pClass && (benchmarkState.customTarget.name || '').toLowerCase().trim() !== pName && !searchedList.some(s => s.id === benchmarkState.customTarget.id)) {
      const ctRole = benchmarkState.customTarget.role || (isSupportClass ? (isSupportSpecName(benchmarkState.customTarget.spec) ? 'support' : 'dps') : 'dps');
      if (ctRole === pRole) {
        searchedList.unshift(benchmarkState.customTarget);
      }
    }
    // Même spé d'abord (même gameplay) ; l'autre spé reste disponible dans un groupe à part
    const playerSpecKey = specKey(getCharacterSpecName(player));
    const optionOf = s => {
      const isSel = target && (target.id === s.id);
      const deltaIlvl = s.ilvl - (player.ilvl || 1700);
      const signIlvl = deltaIlvl >= 0 ? `+${deltaIlvl.toFixed(1)}` : deltaIlvl.toFixed(1);
      return `<option value="${escapeHtml(s.id)}" ${isSel ? 'selected' : ''}>
            ${escapeHtml(s.name)} • ${escapeHtml(getCharacterSpecName(s) || '')} (${s.ilvl.toFixed(1)} iLvl [${signIlvl}] - ${formatNumber(Math.round(s.cp))} CP) [LIVE]
          </option>`;
    };
    const sameSpecList = searchedList.filter(s => specKey(getCharacterSpecName(s)) === playerSpecKey);
    const otherSpecList = searchedList.filter(s => !sameSpecList.includes(s));
    if (sameSpecList.length > 0) {
      optionsHtml += `<optgroup label="${isEn ? 'Live Profiles (' + escapeHtml(getCharacterSpecName(player)) + ')' : 'Profils LIVE Réels (' + escapeHtml(getCharacterSpecName(player)) + ')'}">`;
      sameSpecList.forEach(s => { optionsHtml += optionOf(s); });
      optionsHtml += `</optgroup>`;
    }
    if (otherSpecList.length > 0) {
      optionsHtml += `<optgroup label="${isEn ? 'Other spec (' + escapeHtml(player.className) + ')' : 'Autre spé (' + escapeHtml(player.className) + ')'}">`;
      otherSpecList.forEach(s => { optionsHtml += optionOf(s); });
      optionsHtml += `</optgroup>`;
    }

    select.innerHTML = optionsHtml;
  }

  // 2. Calcul du Différentiel CP
  const pCp = player.cp || 3692;
  const tCp = target.cp || 3989;
  const deltaCp = Math.round(tCp - pCp);
  const deltaPct = pCp > 0 ? ((deltaCp / pCp) * 100).toFixed(1) : '0.0';
  const isTargetAhead = deltaCp >= 0;

  const pAvatar = getCharacterFaceAvatar(player);
  const tAvatar = target.avatarUrl || getClassIconUrl(target.className, target.role);
  const pSpec = getCharacterSpecName(player);
  const tSpec = getCharacterSpecName(target) || pSpec;

  // 3. Rendu Hero Face à Face
  heroCard.innerHTML = `
      <div class="bench-hero-grid">
        <!-- Joueur -->
        <div class="bench-char-card player">
          <div class="bench-char-header">
            <div class="bench-avatar-frame">
              <img src="${escapeHtml(pAvatar)}" data-fallback="images/classes/paladin.png" alt="${escapeHtml(player.name)}" loading="eager">
            </div>
            <div class="bench-char-info">
              <span style="font-size:12px; text-transform:uppercase; font-weight:700; color:#E0A43A;">${t('bench_card_player_title')}</span>
              <div class="bench-char-name-row">
                <span class="bench-char-name">${escapeHtml(player.name)}</span>
                <span class="bench-char-ilvl">${(player.ilvl || 1700).toFixed(2)}</span>
              </div>
              <div class="bench-char-meta">${escapeHtml(normalizeClassName(player.className))} • ${escapeHtml(player.server || 'Elpon (CE)')}</div>
              <span class="bench-char-spec-badge">${escapeHtml(pSpec)}</span>
            </div>
          </div>

          <div class="bench-cp-box">
            <div>
              <div class="bench-cp-label">Combat Power</div>
              <div style="font-size:12px; color:var(--text-muted);">${isEn ? 'Observed in-game (Raid)' : 'Relevé en jeu (Raid)'}</div>
            </div>
            <div class="bench-cp-val">${formatNumber(Math.round(pCp))} CP</div>
          </div>

          <div class="bench-pills-row">
            <span class="bench-pill">${isEn ? 'Gems' : 'Gemmes'} : <strong>${escapeHtml(getCharacterGemSummary(player, isEn))}</strong></span>
            <span class="bench-pill">${isEn ? 'Adv. Honing' : 'Affinage Adv'} : <strong>+${player.advHoning || 40}</strong></span>
          </div>
        </div>

        <!-- VS & Delta Central -->
        <div class="bench-delta-center">
          <span class="bench-vs-pill">VS</span>
          <div class="bench-delta-badge">
            <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:#A29F92;">${t('bench_delta_title')}</span>
            <span class="bench-delta-val">${isTargetAhead ? '+' : ''}${formatNumber(deltaCp)} CP</span>
            <span class="bench-delta-pct">${isTargetAhead ? '+' : ''}${deltaPct}% ${isEn ? 'performance gap' : 'de performance'}</span>
          </div>
          <div class="bench-delta-bar-container">
            <div class="bench-delta-bar-fill" style="width: ${Math.min(100, Math.max(10, Math.round((pCp / tCp) * 100)))}%;"></div>
          </div>
          <span style="font-size:12px; color:var(--text-muted);">${t('bench_same_ilvl_note')} (±${Math.abs(Math.round(target.ilvl - player.ilvl))} iLvl)</span>
        </div>

        <!-- Benchmark Référence -->
        <div class="bench-char-card benchmark">
          <div class="bench-char-header">
            <div class="bench-avatar-frame">
              <img src="${escapeHtml(tAvatar)}" data-fallback="images/classes/paladin.png" alt="${escapeHtml(target.name)}" loading="eager">
            </div>
            <div class="bench-char-info">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size:12px; text-transform:uppercase; font-weight:700; color:#8CC084;">${t('bench_card_target_title')}</span>
                ${target.isLive 
                  ? `<span style="background: transparent; border: 1px solid rgba(140, 192, 132, 0.4); color: #8CC084; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 0; display: inline-flex; align-items: center; gap: 3px;">LIVE lostark.bible</span>` 
                  : `<span style="background: transparent; border: 1px solid rgba(232, 230, 220, 0.4); color: #CFCBBD; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 0; display: inline-flex; align-items: center; gap: 3px;">${isEn ? 'Calibrated T4 Target' : 'Palier Calibré T4'}</span>`
                }
              </div>
              <div class="bench-char-name-row">
                <span class="bench-char-name">${escapeHtml(target.name)}</span>
                <span class="bench-char-ilvl">${target.ilvl.toFixed(2)}</span>
              </div>
              <div class="bench-char-meta">${escapeHtml(normalizeClassName(target.className))} • ${escapeHtml(target.server || 'Elpon (CE)')}${target.guild ? ` • ${isEn ? 'Guild' : 'Guilde'} : ${escapeHtml(target.guild)}` : ''}</div>
              <span class="bench-char-spec-badge">${escapeHtml(tSpec)}</span>
            </div>
          </div>

          <div class="bench-cp-box">
            <div>
              <div class="bench-cp-label">Combat Power</div>
              <div style="font-size:12px; color:var(--text-muted);">${target.isLive ? (isEn ? 'Raid Preset (lostark.bible)' : 'Profil de Raid (lostark.bible)') : (isEn ? 'Calibrated Target (Progression)' : 'Palier de Progression Calibré')}</div>
            </div>
            <div class="bench-cp-val">${formatNumber(Math.round(tCp))} CP</div>
          </div>

          <div class="bench-pills-row">
            <span class="bench-pill">${isEn ? 'Gems' : 'Gemmes'} : <strong>${escapeHtml(isEn ? formatLostArkEnglish(target.gemDesc || 'Full Tier 4 Lv. 8 Gems') : formatLostArkFrench(target.gemDesc || 'Full Gemmes 8'))}</strong></span>
            ${target.isLive && target.bibleUrl
              ? `<a href="${target.bibleUrl}" target="_blank" rel="noopener noreferrer" style="font-size:13px; color:#E0A43A; text-decoration:underline; display:flex; align-items:center; gap:4px; margin-left:auto;">${t('bench_view_bible')}</a>`
              : `<span class="bench-pill" style="margin-left:auto; background: transparent; border-color:rgba(232, 230, 220,0.3); color:#CFCBBD;">${isEn ? 'Calibrated Model' : 'Modèle Calibré'}</span>`
            }
          </div>
        </div>
      </div>
    `;

  const pSys = extractPlayerSystems(player, isEn);
  const tSys = resolveTargetSystems(target, isEn);
  // Profil raid mélangé (d'un côté ou de l'autre) : aucun écart système par système
  const mixedOnly = hasMixedRaidProfile(player) || hasMixedRaidProfile(target, player.role);
  // Battle Point incomplet d'un côté : mêmes conséquences (écarts système par système faux)
  const incompleteWho = hasIncompleteBattlePoint(player) ? 'player' : (hasIncompleteBattlePoint(target, player.role) ? 'target' : null);
  const mixedProfiles = mixedOnly || !!incompleteWho;
  if (mixedProfiles) [pSys, tSys].forEach(sys => Object.values(sys).forEach(v => { if (v && typeof v === 'object') v.estimated = true; }));
  const cpPerPct = (player.cp && player.cp > 1000) ? (player.cp / 100) : 38;
  const directCpGap = Math.round((target.cp || 0) - (player.cp || 0));

  const { gaps, plan, rows: gpdRows } = computeDynamicGapsAndPlan(player, target, pSys, tSys, isEn);

  // 4. Diagnostic des Écarts Prioritaires (Uniquement les leviers de progression ou avantages joueur)
  const gapsGrid = document.getElementById('benchmarkGapsGrid');
  const reconEl = document.getElementById('benchmarkCpReconciliation');
  if (gapsGrid) {
    const activeGaps = gaps.filter(g => g.gainCp > 0 || g.priority === 'player_lead');
    if (mixedProfiles && !mixedOnly) {
      gapsGrid.innerHTML = `
          <div class="bench-gap-card" style="grid-column: 1 / -1; text-align: center; padding: 24px; border-color: var(--accent-gold);">
            <h4 style="margin: 0 0 6px 0; color: var(--accent-gold);">${isEn ? 'Incomplete Battle Point: comparison skipped' : 'Battle Point incomplet : comparaison suspendue'}</h4>
            <p style="font-size: 14px; color: var(--text-muted); margin: 0;">${isEn
              ? `${incompleteWho === 'player' ? 'Your' : 'The reference\'s'} raid profile on lostark.bible has Battle Point parts that do not add up to its Combat Power (some systems are missing, often the Ark Grid cores). System gaps would be wrong. Pick another reference or update the character on lostark.bible.`
              : `${incompleteWho === 'player' ? 'Ton profil raid' : 'Le profil raid de la référence'} sur lostark.bible a des parties de Battle Point qui ne reconstituent pas son Combat Power (des systèmes manquent, souvent les cœurs de la Grille d'Ark). Les écarts par système seraient faux. Choisis une autre référence ou mets le personnage à jour sur lostark.bible.`}</p>
          </div>
        `;
    } else if (mixedProfiles) {
      const who = hasMixedRaidProfile(player) ? (isEn ? 'Your' : 'Ton') : (isEn ? 'The reference\'s' : 'Le');
      gapsGrid.innerHTML = `
          <div class="bench-gap-card" style="grid-column: 1 / -1; text-align: center; padding: 24px; border-color: var(--accent-gold);">
            <h4 style="margin: 0 0 6px 0; color: var(--accent-gold);">${isEn ? 'Mixed raid profile: comparison skipped' : 'Profil raid mélangé : comparaison suspendue'}</h4>
            <p style="font-size: 14px; color: var(--text-muted); margin: 0;">${isEn
              ? `${who} raid profile on lostark.bible was saved with an Enlightenment tree of the other role (Lost Ark only saves the Ark Passive tree when the character logs out). Its Battle Point is computed in that mode, so system gaps would be wrong. Switch to the raid tree, log the character out, then update it on lostark.bible.`
              : `${who} profil raid${hasMixedRaidProfile(player) ? '' : ' de la référence'} sur lostark.bible a été enregistré avec un arbre d'Illumination de l'autre rôle (Lost Ark n'enregistre l'arbre d'Ark Passive qu'à la déconnexion du personnage). Son Battle Point est calculé dans ce mode : les écarts par système seraient faux. Remets l'arbre de raid, déconnecte le personnage, puis mets-le à jour sur lostark.bible.`}</p>
          </div>
        `;
    } else if (activeGaps.length === 0) {
      gapsGrid.innerHTML = `
          <div class="bench-gap-card" style="grid-column: 1 / -1; text-align: center; padding: 24px;">
            <span style="font-size: 31px;"></span>
            <h4 style="margin: 8px 0 4px 0; color: #8CC084;">${isEn ? 'Parity or ahead' : 'Parité ou avance'}</h4>
            <p style="font-size: 14px; color: var(--text-muted); margin: 0;">${isEn ? 'All your equipment systems are equal or superior to this reference benchmark.' : 'Tous vos systèmes d\'équipement sont équivalents ou supérieurs à ce profil de référence.'}</p>
          </div>
        `;
    } else {
      let gapsHtml = '';
      const targetLeads = activeGaps.filter(g => g.priority !== 'player_lead');
      const playerLeads = activeGaps.filter(g => g.priority === 'player_lead');
      const displayGaps = [];
      if (playerLeads.length > 0) {
        displayGaps.push(...targetLeads.slice(0, 4));
        displayGaps.push(...playerLeads.slice(0, 2));
      } else {
        displayGaps.push(...targetLeads.slice(0, 5));
      }

      let impactIdx = 1;
      displayGaps.forEach((g) => {
        let rankBadge = `#${impactIdx} IMPACT`;
        let gainText = '+' + g.gainCp + ' CP';
        if (g.priority === 'player_lead') {
          rankBadge = isEn ? 'ADVANTAGE' : 'AVANTAGE';
          gainText = '+' + g.gainCp + ' CP (' + (isEn ? 'Lead' : 'Avance') + ')';
        } else {
          impactIdx++;
        }

        gapsHtml += `
            <div class="bench-gap-card ${g.priority === 'player_lead' ? 'bench-gap-card-lead' : ''}">
              <div class="bench-gap-card-top">
                <span class="bench-gap-rank ${g.priority === 'player_lead' ? 'rank-lead' : ''}">${rankBadge}</span>
                <span class="bench-gap-gain-pill ${g.priority === 'player_lead' ? 'player-lead' : ''}">${gainText}</span>
              </div>
              <div class="bench-gap-title">
                <span>${g.icon}</span> <span>${escapeHtml(g.title)}</span>
              </div>
              <div class="bench-gap-desc">${escapeHtml(g.desc)}</div>
            </div>
          `;
      });
      gapsGrid.innerHTML = gapsHtml;
    }
  }

  // 4b. Bilan Mathématique du CP (Réconciliation des Écarts)
  if (reconEl) {
    reconEl.innerHTML = buildCpReconciliationHtml(player, target, gaps, isEn);
  }

  // 5. Tableau Comparatif Système par Système
  const tableBody = document.getElementById('benchmarkTableBody');
  if (tableBody) {
    const rowsConfig = [
      { key: 'arkGridSun', name: isEn ? 'Ark Grid: Sun Cores (Order & Chaos)' : 'Ark Grid : Cœurs Soleil (Ordre & Chaos)', icon: '', prio: 'high' },
      { key: 'arkGridMoon', name: isEn ? 'Ark Grid: Moon Cores (Order & Chaos)' : 'Ark Grid : Cœurs Lune (Ordre & Chaos)', icon: '', prio: 'high' },
      { key: 'arkGridStar', name: isEn ? 'Ark Grid: Star Cores (Order & Chaos)' : 'Ark Grid : Cœurs Étoile (Ordre & Chaos)', icon: '', prio: 'med' },
      { key: 'arkGridAstrogems', name: isEn ? 'Ark Grid: Astrogems (Substats)' : 'Ark Grid : Astrogemmes (Sous-stats)', icon: '', prio: 'med' },
      { key: 'accessories', name: isEn ? 'T4 Accessories (Rolls & Lines)' : 'Accessoires T4 (Rolls & Lignes)', icon: '', prio: 'high' },
      { key: 'weapon', name: isEn ? 'T4 Weapon (Honing)' : 'Arme T4 (Affinage)', icon: '', prio: 'med' },
      { key: 'weaponQuality', name: isEn ? 'Weapon Quality (Additional Damage)' : 'Qualité d\'Arme (Dégâts Additionnels)', icon: '', prio: 'med' },
      { key: 'advHoning', name: isEn ? 'T4 Advanced Honing' : 'Affinage Avancé T4', icon: '', prio: 'equal' },
      { key: 'bracelet', name: isEn ? 'T4 Bracelet (Stats & Passives)' : 'Bracelet T4 (Stats & Passifs)', icon: '', prio: 'med' },
      { key: 'gems', name: isEn ? 'T4 Gems (Tiers & DMG)' : 'Gemmes T4 (Niveaux & Dégâts)', icon: '', prio: target.gemTier === 'gem8' ? 'equal' : 'opt' },
      { key: 'armors', name: isEn ? 'T4 Armors (Chest/Pants/Shoulders)' : 'Armures T4 (Torse/Jambes/Épaules)', icon: '', prio: 'med' },
      { key: 'baseAttackStat', name: isEn ? 'Main Stat & Base AP' : 'Stat Principale & Attaque Base', icon: '', prio: 'med' },
      { key: 'engravings', name: isEn ? 'Engravings & Ability Stone' : 'Gravures & Pierre de Naissance', icon: '', prio: 'equal' },
      { key: 'combatStats', name: isEn ? 'Combat Stats (Crit/Spec/Swift)' : 'Stats de Combat (Crit/Spé/Rap)', icon: '', prio: 'equal' },
      { key: 'arkEvolution', name: isEn ? 'Ark Passive: Evolution (Stats)' : 'Ark Passive : Évolution (Stats)', icon: '', prio: 'med' },
      { key: 'arkEnlightenment', name: isEn ? 'Ark Passive: Enlightenment (Tree)' : 'Ark Passive : Illumination (Arbre)', icon: '', prio: 'med' },
      { key: 'arkLeap', name: isEn ? 'Ark Passive: Leap (Hyper)' : 'Ark Passive : Saut (Hyper)', icon: '', prio: 'equal' },
      { key: 'karma', name: isEn ? 'T4 Karma (Evolution Rank 0-6)' : 'Karma T4 (Évolution Rang 0-6)', icon: '', prio: 'equal' }
    ];

    const cpPerPct = (player.cp && player.cp > 1000) ? (player.cp / 100) : 38;
    let equalRowsCount = 0;
    let rowsHtml = '';
    let totalPositiveTableCp = 0;
    let totalPlayerLeadTableCp = 0;
    let maxLeadCp = 0;
    let topLeadTitle = '';

    rowsConfig.forEach(cfg => {
      const pRaw = pSys[cfg.key] || { label: 'Standard', bonusPct: 0 };
      let tRaw = tSys[cfg.key];
      if (!tRaw || (['baseAttackStat', 'combatStats'].includes(cfg.key) && tRaw.bonusPct <= 10) || (cfg.key === 'engravings' && tRaw.bonusPct < 60)) {
        const freshTargetSys = resolveTargetSystems(target, isEn);
        tRaw = freshTargetSys[cfg.key] || { label: 'Standard', bonusPct: 0 };
      }
      let pLabel = pRaw.label || '';
      let tLabel = tRaw.label || '';
      if (isEn) {
        pLabel = formatLostArkEnglish(pLabel);
        tLabel = formatLostArkEnglish(tLabel);
      } else {
        pLabel = formatLostArkFrench(pLabel);
        tLabel = formatLostArkFrench(tLabel);
      }
      const estimatedPair = mixedProfiles || isEstimatedPair(pRaw, tRaw);
      if (estimatedPair) {
        const note = isEn ? ' [estimated — not read]' : ' [estimé — non lu]';
        if (pRaw.estimated) pLabel += note;
        if (tRaw.estimated) tLabel += note;
      }
      const pItem = { label: pLabel, bonusPct: pRaw.bonusPct };
      const tItem = { label: tLabel, bonusPct: tRaw.bonusPct };
      // Systèmes chiffrés comme le GPD : écart = gain du GPD (% DPS ou % Buff), pas de différence de bonusPct
      // Support : aussi les systèmes hors GPD, chiffrés en CP sur les parties du Battle Point (unité « CP »)
      const gpdRow = !estimatedPair && gpdRows && gpdRows[cfg.key] && gpdRows[cfg.key].unit ? gpdRows[cfg.key] : null;
      const delta = estimatedPair ? 0 : (gpdRow ? gpdRow.delta : Number((tItem.bonusPct - pItem.bonusPct).toFixed(2)));
      const isEqual = Math.abs(delta) <= 0.02;

      const isAcc = cfg.key === 'accessories';
      const isBracelet = cfg.key === 'bracelet';
      const isAstrogems = cfg.key === 'arkGridAstrogems';
      const isEngravings = cfg.key === 'engravings';
      const isBaseAtk = cfg.key === 'baseAttackStat';
      const isCombatStats = cfg.key === 'combatStats';
      const isArkGridSun = cfg.key === 'arkGridSun';
      const isArkGridMoon = cfg.key === 'arkGridMoon';
      const isArkGridStar = cfg.key === 'arkGridStar';
      const isWeapon = cfg.key === 'weapon';
      const isArmors = cfg.key === 'armors';
      const hasInteractivePanel = isAcc || isBracelet || isAstrogems || isEngravings || isBaseAtk || isCombatStats || isArkGridSun || isArkGridMoon || isArkGridStar || isWeapon || isArmors;

      const isHiddenInEqual = isEqual && !hasInteractivePanel;
      if (isHiddenInEqual) equalRowsCount++;

      const deltaUnit = gpdRow ? ` ${gpdRow.unit}` : '';
      const deltaStr = delta > 0.01 
        ? `+${delta.toFixed(2)}%${deltaUnit}` 
        : (delta < -0.01 ? `${delta.toFixed(2)}%${deltaUnit}` : `= 0.00%${deltaUnit}`);
      const badgeClass = delta > 0.01 
        ? 'delta-badge-pos' 
        : (delta < -0.01 ? 'delta-badge-neg' : 'delta-badge-neutral');

      const rowGapCp = gpdRow ? gpdRow.gapCp : systemGapCp(pItem.bonusPct, tItem.bonusPct, player.cp);
      // Le CP suit son propre signe (support : buff du GPD et CP du jeu peuvent diverger, ex. cœurs au-delà de 17 points)
      const cpImpact = gpdRow ? Math.max(0, Math.round(rowGapCp)) : (delta > 0.01 ? Math.round(rowGapCp) : 0);
      const playerLeadCp = gpdRow ? Math.max(0, Math.round(-rowGapCp)) : (delta < -0.01 ? Math.round(-rowGapCp) : 0);

      if (cpImpact > 0) {
        totalPositiveTableCp += cpImpact;
      } else if (playerLeadCp > 0) {
        totalPlayerLeadTableCp += playerLeadCp;
        if (playerLeadCp > maxLeadCp) {
          maxLeadCp = playerLeadCp;
          topLeadTitle = cfg.name;
        }
      }

      let prioLabel = t('bench_prio_equal');
      let prioClass = 'equal';
      if (delta < -0.10) {
        prioLabel = isEn ? 'Player Advantage' : 'Avantage Joueur';
        prioClass = 'opt';
      } else if (cfg.prio === 'high' && delta > 0.5) {
        prioLabel = t('bench_prio_high');
        prioClass = 'high';
      } else if (cfg.prio === 'med' && delta > 0.2) {
        prioLabel = t('bench_prio_med');
        prioClass = 'med';
      } else if (cfg.prio === 'opt' && delta > 0) {
        prioLabel = t('bench_prio_opt');
        prioClass = 'opt';
      } else if (delta > 0.02) {
        // Retard hors seuils : stats dérivées de l'équipement, sinon simple écart
        const derived = cfg.key === 'combatStats' || cfg.key === 'baseAttackStat';
        prioLabel = derived ? t('bench_prio_derived') : t('bench_prio_med');
        prioClass = 'med';
      }

      let cpDisplay = '—';
      if (cpImpact > 0) {
        cpDisplay = `+${cpImpact} CP`;
      } else if (playerLeadCp > 0) {
        cpDisplay = `<span style="color:#9CB4C6;">+${playerLeadCp} CP (${isEn ? 'Lead' : 'Avance'})</span>`;
      }

      let toggleBtn = '';
      if (isAcc) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle" id="btnToggleAccDetails" aria-expanded="false" title="${isEn ? 'Click to inspect individual accessories & lines' : 'Cliquer pour déplier les 5 bijoux et leurs lignes d\'affinage'}">
              <span class="acc-toggle-icon">+</span>
            </button>
          `;
      } else if (isBracelet) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-bracelet-toggle" id="btnToggleBraceletDetails" aria-expanded="false" title="${isEn ? 'Click to inspect bracelet rolls & passives' : 'Cliquer pour déplier le bracelet et ses lignes de passifs'}">
              <span class="bracelet-toggle-icon">+</span>
            </button>
          `;
      } else if (isAstrogems) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-astrogems-toggle" id="btnToggleAstrogemsDetails" aria-expanded="false" title="${isEn ? 'Click to inspect astrogems substats & CP gains' : 'Cliquer pour déplier les sous-statistiques d\'astrogemmes et leurs gains de CP'}">
              <span class="astrogems-toggle-icon">+</span>
            </button>
          `;
      } else if (isEngravings) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-engravings-toggle" id="btnToggleEngravingsDetails" aria-expanded="false" title="${isEn ? 'Click to inspect engraving choices & ability stone nodes' : 'Cliquer pour comparer les 5 gravures et les nœuds de pierre de naissance'}">
              <span class="engravings-toggle-icon">+</span>
            </button>
          `;
      } else if (isBaseAtk) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-baseatk-toggle" id="btnToggleBaseAtkDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Main Stat, Weapon Power, and Base AP differences' : 'Cliquer pour inspecter la Stat Principale, la Puissance d\'Arme et l\'Attaque de Base'}">
              <span class="baseatk-toggle-icon">+</span>
            </button>
          `;
      } else if (isCombatStats) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-combatstats-toggle" id="btnToggleCombatStatsDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Combat Stats (Crit/Spec/Swift), accessory qualities, and bracelet rolls' : 'Cliquer pour inspecter les Stats de Combat (Crit/Spé/Rapide), la qualité des bijoux et le bracelet'}">
              <span class="combatstats-toggle-icon">+</span>
            </button>
          `;
      } else if (isArkGridSun) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-arkgridsun-toggle" id="btnToggleArkGridSunDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Sun Cores (Order & Chaos) breakdown' : 'Cliquer pour déplier les Cœurs Soleil (Ordre & Chaos)'}">
              <span class="arkgridsun-toggle-icon">+</span>
            </button>
          `;
      } else if (isArkGridMoon) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-arkgridmoon-toggle" id="btnToggleArkGridMoonDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Moon Cores (Order & Chaos) breakdown' : 'Cliquer pour déplier les Cœurs Lune (Ordre & Chaos)'}">
              <span class="arkgridmoon-toggle-icon">+</span>
            </button>
          `;
      } else if (isArkGridStar) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-arkgridstar-toggle" id="btnToggleArkGridStarDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Star Cores (Order & Chaos) breakdown' : 'Cliquer pour déplier les Cœurs Étoile (Ordre & Chaos)'}">
              <span class="arkgridstar-toggle-icon">+</span>
            </button>
          `;
      } else if (isWeapon) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-weapon-toggle" id="btnToggleWeaponDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Weapon Honing, Quality & Serka Tier breakdown' : 'Cliquer pour déplier l\'Affinage d\'Arme, la Qualité & le Palier Serka'}">
              <span class="weapon-toggle-icon">+</span>
            </button>
          `;
      } else if (isArmors) {
        toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-armors-toggle" id="btnToggleArmorsDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Armors Honing, Main Stat & Serka Tier breakdown' : 'Cliquer pour déplier l\'Affinage des Armures, la Stat Principale & le Palier Serka'}">
              <span class="armors-toggle-icon">+</span>
            </button>
          `;
      }

      const trClass = [
        isHiddenInEqual ? 'row-equal' : '',
        isAcc ? 'row-accessories-parent' : '',
        isBracelet ? 'row-bracelet-parent' : '',
        isAstrogems ? 'row-astrogems-parent' : '',
        isEngravings ? 'row-engravings-parent' : '',
        isBaseAtk ? 'row-baseatk-parent' : '',
        isCombatStats ? 'row-combatstats-parent' : '',
        isArkGridSun ? 'row-arkgridsun-parent' : '',
        isArkGridMoon ? 'row-arkgridmoon-parent' : '',
        isArkGridStar ? 'row-arkgridstar-parent' : '',
        isWeapon ? 'row-weapon-parent' : '',
        isArmors ? 'row-armors-parent' : ''
      ].filter(Boolean).join(' ');

      const trId = isAcc ? 'id="rowSysAccessories"' : (isBracelet ? 'id="rowSysBracelet"' : (isAstrogems ? 'id="rowSysAstrogems"' : (isEngravings ? 'id="rowSysEngravings"' : (isBaseAtk ? 'id="rowSysBaseAtk"' : (isCombatStats ? 'id="rowSysCombatStats"' : (isArkGridSun ? 'id="rowSysArkGridSun"' : (isArkGridMoon ? 'id="rowSysArkGridMoon"' : (isArkGridStar ? 'id="rowSysArkGridStar"' : (isWeapon ? 'id="rowSysWeapon"' : (isArmors ? 'id="rowSysArmors"' : ''))))))))));

      rowsHtml += `
          <tr class="${trClass}" ${trId}>
            <td class="col-sys">
              ${toggleBtn}<span>${cfg.icon}</span> <strong>${escapeHtml(cfg.name)}</strong>
            </td>
            <td class="col-player">${escapeHtml(pItem.label)}${gpdRow ? '' : ` (${pItem.bonusPct.toFixed(2)}%)`}</td>
            <td class="col-target">${escapeHtml(tItem.label)}${gpdRow ? '' : ` (${tItem.bonusPct.toFixed(2)}%)`}</td>
            <td class="col-delta"><span class="${badgeClass}">${deltaStr}</span></td>
            <td class="col-cp" style="font-family:var(--font-mono); font-weight:700; color:${cpImpact > 0 ? '#8CC084' : 'var(--text-muted)'};">
              ${cpDisplay}
            </td>
            <td><span class="prio-pill ${prioClass}">${escapeHtml(prioLabel)}</span></td>
          </tr>
        `;

      if (isAcc) {
        const accDetailsHtml = buildAccBreakdownHtml(player, target, cpImpact, isEn);
        rowsHtml += `
            <tr id="rowAccDetails" class="row-acc-details" style="display: none;">
              <td colspan="6">
                ${accDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isBracelet) {
        const braceletDetailsHtml = buildBraceletBreakdownHtml(player, target, cpImpact, isEn);
        rowsHtml += `
            <tr id="rowBraceletDetails" class="row-bracelet-details" style="display: none;">
              <td colspan="6">
                ${braceletDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isAstrogems) {
        const astrogemsDetailsHtml = buildAstrogemsBreakdownHtml(player, target, cpImpact, isEn);
        rowsHtml += `
            <tr id="rowAstrogemsDetails" class="row-astrogems-details" style="display: none;">
              <td colspan="6">
                ${astrogemsDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isEngravings) {
        const engravingsDetailsHtml = buildEngravingsBreakdownHtml(player, target, cpImpact, isEn);
        rowsHtml += `
            <tr id="rowEngravingsDetails" class="row-engravings-details" style="display: none;">
              <td colspan="6">
                ${engravingsDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isBaseAtk) {
        const baseAtkDetailsHtml = buildBaseAtkBreakdownHtml(player, target, cpImpact, isEn);
        rowsHtml += `
            <tr id="rowBaseAtkDetails" class="row-baseatk-details" style="display: none;">
              <td colspan="6">
                ${baseAtkDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isCombatStats) {
        const combatStatsDetailsHtml = buildCombatStatsBreakdownHtml(player, target, cpImpact, isEn);
        rowsHtml += `
            <tr id="rowCombatStatsDetails" class="row-combatstats-details" style="display: none;">
              <td colspan="6">
                ${combatStatsDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isArkGridSun) {
        const sunDetailsHtml = buildArkGridCoresBreakdownHtml(player, target, 'sun', cpImpact, isEn);
        rowsHtml += `
            <tr id="rowArkGridSunDetails" class="row-arkgridsun-details" style="display: none;">
              <td colspan="6">
                ${sunDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isArkGridMoon) {
        const moonDetailsHtml = buildArkGridCoresBreakdownHtml(player, target, 'moon', cpImpact, isEn);
        rowsHtml += `
            <tr id="rowArkGridMoonDetails" class="row-arkgridmoon-details" style="display: none;">
              <td colspan="6">
                ${moonDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isArkGridStar) {
        const starDetailsHtml = buildArkGridCoresBreakdownHtml(player, target, 'star', cpImpact, isEn);
        rowsHtml += `
            <tr id="rowArkGridStarDetails" class="row-arkgridstar-details" style="display: none;">
              <td colspan="6">
                ${starDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isWeapon) {
        const weaponDetailsHtml = buildWeaponBreakdownHtml(player, target, cpImpact, isEn, gpdRow && gpdRow.fromGpd ? gpdRow.delta : undefined);
        rowsHtml += `
            <tr id="rowWeaponDetails" class="row-weapon-details" style="display: none;">
              <td colspan="6">
                ${weaponDetailsHtml}
              </td>
            </tr>
          `;
      } else if (isArmors) {
        const armorsDetailsHtml = buildArmorsBreakdownHtml(player, target, cpImpact, isEn, gpdRow && gpdRow.fromGpd ? gpdRow.delta : undefined);
        rowsHtml += `
            <tr id="rowArmorsDetails" class="row-armors-details" style="display: none;">
              <td colspan="6">
                ${armorsDetailsHtml}
              </td>
            </tr>
          `;
      }
    });
    tableBody.innerHTML = rowsHtml;

    // Construction et injection du Bilan Mathématique tfoot du grand tableau comparatif
    const compareTbl = document.getElementById('benchmarkCompareTable');
    if (compareTbl) {
      let tfoot = compareTbl.querySelector('tfoot');
      if (!tfoot) {
        tfoot = document.createElement('tfoot');
        compareTbl.appendChild(tfoot);
      }
      tfoot.innerHTML = `
          <tr class="benchmark-table-total-row">
            <td colspan="4" style="padding: 12px 16px; font-weight: 700; color: #E8E6DC;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;"></span>
                <div>
                  <span>${isEn ? 'Sum of Improvement Levers (Gross Deficit)' : 'Total Brut des Leviers d\'Amélioration (Retards Stuff)'}</span>
                  <div style="font-size:12px; font-weight:400; color:var(--text-muted); margin-top:2px;">
                    ${isEn ? 'Arithmetic sum of all positive CP gains in the table above' : 'Somme arithmétique de tous les gains positifs individuels du tableau ci-dessus'}
                  </div>
                </div>
              </div>
            </td>
            <td class="col-cp" style="font-family:var(--font-mono); font-weight:800; font-size:15px; color:#8CC084; padding: 12px 16px;">
              +${formatNumber(totalPositiveTableCp)} CP
            </td>
            <td style="padding: 12px 16px;">
              <span class="prio-pill high">${isEn ? 'Gross Levers' : 'Leviers Cumulés'}</span>
            </td>
          </tr>
          ${totalPlayerLeadTableCp > 0 ? `
            <tr class="benchmark-table-lead-row">
              <td colspan="4" style="padding: 10px 16px; font-weight: 600; color: #B5C7D4;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:17px;"></span>
                  <div>
                    <span>${isEn ? 'Your Compensating Advantages (Equipments Ahead)' : 'Vos Avances Compensatoires (Équipements où vous surpassez la cible)'}</span>
                    <div style="font-size:12px; font-weight:400; color:var(--text-muted); margin-top:2px;">
                      ${isEn ? 'Directly cushions and offsets your equipment deficits' : 'Amortit et compense directement vos retards d\'équipements'}
                    </div>
                  </div>
                </div>
              </td>
              <td class="col-cp" style="font-family:var(--font-mono); font-weight:700; font-size:14px; color:#9CB4C6; padding: 10px 16px;">
                -${formatNumber(totalPlayerLeadTableCp)} CP (${isEn ? 'Lead' : 'Avance'})
              </td>
              <td style="padding: 10px 16px;">
                <span class="prio-pill opt">${isEn ? 'Cushioning' : 'Amortissement'}</span>
              </td>
            </tr>
          ` : ''}
          <tr class="benchmark-table-net-row">
            <td colspan="4" style="padding: 14px 16px; font-weight: 800; color: #E0A43A;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:20px;"></span>
                <div>
                  <span>${isEn ? 'Observed In-Game Net Gap (lostark.bible Score in Raid)' : 'Écart Réel Net In-Game (Score relevé en Raid sur lostark.bible)'}</span>
                  <div style="font-size:13px; font-weight:400; color:var(--text-muted); margin-top:3px; line-height:1.4;">
                    ${isEn
                      ? `Formula: <strong>Target CP (${formatNumber(Math.round(target.cp || 0))}) &minus; Your CP (${formatNumber(Math.round(player.cp || 0))}) = ${directCpGap >= 0 ? '+' : ''}${formatNumber(directCpGap)} CP</strong>. Reflects Lost Ark\'s compound multiplicative formula (each individual line shows its isolated linear gain).`
                      : `Formule : <strong>Cible (${formatNumber(Math.round(target.cp || 0))} CP) &minus; Vous (${formatNumber(Math.round(player.cp || 0))} CP) = ${directCpGap >= 0 ? '+' : ''}${formatNumber(directCpGap)} CP</strong>. Intègre la formule multiplicative croisée du jeu (chaque ligne isole son gain linéaire individuel).`
                    }
                  </div>
                </div>
              </div>
            </td>
            <td class="col-cp" style="font-family:var(--font-mono); font-weight:900; font-size:18px; color:#E0A43A; padding: 14px 16px;">
              ${directCpGap >= 0 ? '+' : ''}${formatNumber(directCpGap)} CP
            </td>
            <td style="padding: 14px 16px;">
              <span class="prio-pill equal" style="background: transparent; color:#E0A43A; border:1px solid rgba(232, 230, 220,0.35); font-weight:700;">
                ${isEn ? 'Official Raid Delta' : 'Écart Raid Réel'}
              </span>
            </td>
          </tr>
        `;
    }

    // Synchronisation mathématique de la carte de réconciliation supérieure avec les totaux réels du tableau
    if (reconEl) {
      reconEl.innerHTML = buildCpReconciliationHtml(player, target, gaps, isEn, {
        totalPositiveCp: totalPositiveTableCp,
        totalPlayerLeadCp: totalPlayerLeadTableCp,
        topLeadTitle: topLeadTitle || (isEn ? 'Equipment' : 'Équipement')
      });
    }

    // Gestion du dépliage interactif des 5 bijoux T4
    const btnAcc = document.getElementById('btnToggleAccDetails');
    const rowAccParent = document.getElementById('rowSysAccessories');
    const rowAccDet = document.getElementById('rowAccDetails');
    if (btnAcc && rowAccDet) {
      const doToggleAcc = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowAccDet.style.display === 'none';
        rowAccDet.style.display = isHidden ? 'table-row' : 'none';
        btnAcc.setAttribute('aria-expanded', isHidden);
        const icon = btnAcc.querySelector('.acc-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowAccParent) rowAccParent.classList.toggle('expanded', isHidden);
      };
      btnAcc.addEventListener('click', doToggleAcc);
      if (rowAccParent) {
        rowAccParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleAcc(e);
        });
      }
    }

    // Gestion du dépliage interactif du Bracelet T4
    const btnBracelet = document.getElementById('btnToggleBraceletDetails');
    const rowBraceletParent = document.getElementById('rowSysBracelet');
    const rowBraceletDet = document.getElementById('rowBraceletDetails');
    if (btnBracelet && rowBraceletDet) {
      const doToggleBracelet = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowBraceletDet.style.display === 'none';
        rowBraceletDet.style.display = isHidden ? 'table-row' : 'none';
        btnBracelet.setAttribute('aria-expanded', isHidden);
        const icon = btnBracelet.querySelector('.bracelet-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowBraceletParent) rowBraceletParent.classList.toggle('expanded', isHidden);
      };
      btnBracelet.addEventListener('click', doToggleBracelet);
      if (rowBraceletParent) {
        rowBraceletParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleBracelet(e);
        });
      }
    }

    // Gestion du dépliage interactif des Astrogemmes Ark Grid
    const btnAstrogems = document.getElementById('btnToggleAstrogemsDetails');
    const rowAstrogemsParent = document.getElementById('rowSysAstrogems');
    const rowAstrogemsDet = document.getElementById('rowAstrogemsDetails');
    if (btnAstrogems && rowAstrogemsDet) {
      const doToggleAstrogems = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowAstrogemsDet.style.display === 'none';
        rowAstrogemsDet.style.display = isHidden ? 'table-row' : 'none';
        btnAstrogems.setAttribute('aria-expanded', isHidden);
        const icon = btnAstrogems.querySelector('.astrogems-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowAstrogemsParent) rowAstrogemsParent.classList.toggle('expanded', isHidden);
      };
      btnAstrogems.addEventListener('click', doToggleAstrogems);
      if (rowAstrogemsParent) {
        rowAstrogemsParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleAstrogems(e);
        });
      }
    }

    // Gestion du dépliage interactif des Gravures Reliques T4 & Pierre
    const btnEng = document.getElementById('btnToggleEngravingsDetails');
    const rowEngParent = document.getElementById('rowSysEngravings');
    const rowEngDet = document.getElementById('rowEngravingsDetails');
    if (btnEng && rowEngDet) {
      const doToggleEng = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowEngDet.style.display === 'none';
        rowEngDet.style.display = isHidden ? 'table-row' : 'none';
        btnEng.setAttribute('aria-expanded', isHidden);
        const icon = btnEng.querySelector('.engravings-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowEngParent) rowEngParent.classList.toggle('expanded', isHidden);
      };
      btnEng.addEventListener('click', doToggleEng);
      if (rowEngParent) {
        rowEngParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleEng(e);
        });
      }
    }

    // Gestion du dépliage interactif de Stat Principale & Attaque de Base
    const btnBaseAtk = document.getElementById('btnToggleBaseAtkDetails');
    const rowBaseAtkParent = document.getElementById('rowSysBaseAtk');
    const rowBaseAtkDet = document.getElementById('rowBaseAtkDetails');
    if (btnBaseAtk && rowBaseAtkDet) {
      const doToggleBaseAtk = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowBaseAtkDet.style.display === 'none';
        rowBaseAtkDet.style.display = isHidden ? 'table-row' : 'none';
        btnBaseAtk.setAttribute('aria-expanded', isHidden);
        const icon = btnBaseAtk.querySelector('.baseatk-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowBaseAtkParent) rowBaseAtkParent.classList.toggle('expanded', isHidden);
      };
      btnBaseAtk.addEventListener('click', doToggleBaseAtk);
      if (rowBaseAtkParent) {
        rowBaseAtkParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleBaseAtk(e);
        });
      }
    }

    // Gestion du dépliage interactif des Stats de Combat (Crit/Spé/Rapide)
    const btnCombatStats = document.getElementById('btnToggleCombatStatsDetails');
    const rowCombatStatsParent = document.getElementById('rowSysCombatStats');
    const rowCombatStatsDet = document.getElementById('rowCombatStatsDetails');
    if (btnCombatStats && rowCombatStatsDet) {
      const doToggleCombatStats = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowCombatStatsDet.style.display === 'none';
        rowCombatStatsDet.style.display = isHidden ? 'table-row' : 'none';
        btnCombatStats.setAttribute('aria-expanded', isHidden);
        const icon = btnCombatStats.querySelector('.combatstats-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowCombatStatsParent) rowCombatStatsParent.classList.toggle('expanded', isHidden);
      };
      btnCombatStats.addEventListener('click', doToggleCombatStats);
      if (rowCombatStatsParent) {
        rowCombatStatsParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleCombatStats(e);
        });
      }
    }

    // Gestion du dépliage interactif des Cœurs Soleil Ark Grid (Ordre & Chaos)
    const btnArkGridSun = document.getElementById('btnToggleArkGridSunDetails');
    const rowArkGridSunParent = document.getElementById('rowSysArkGridSun');
    const rowArkGridSunDet = document.getElementById('rowArkGridSunDetails');
    if (btnArkGridSun && rowArkGridSunDet) {
      const doToggleArkGridSun = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowArkGridSunDet.style.display === 'none';
        rowArkGridSunDet.style.display = isHidden ? 'table-row' : 'none';
        btnArkGridSun.setAttribute('aria-expanded', isHidden);
        const icon = btnArkGridSun.querySelector('.arkgridsun-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowArkGridSunParent) rowArkGridSunParent.classList.toggle('expanded', isHidden);
      };
      btnArkGridSun.addEventListener('click', doToggleArkGridSun);
      if (rowArkGridSunParent) {
        rowArkGridSunParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleArkGridSun(e);
        });
      }
    }

    // Gestion du dépliage interactif des Cœurs Lune Ark Grid (Ordre & Chaos)
    const btnArkGridMoon = document.getElementById('btnToggleArkGridMoonDetails');
    const rowArkGridMoonParent = document.getElementById('rowSysArkGridMoon');
    const rowArkGridMoonDet = document.getElementById('rowArkGridMoonDetails');
    if (btnArkGridMoon && rowArkGridMoonDet) {
      const doToggleArkGridMoon = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowArkGridMoonDet.style.display === 'none';
        rowArkGridMoonDet.style.display = isHidden ? 'table-row' : 'none';
        btnArkGridMoon.setAttribute('aria-expanded', isHidden);
        const icon = btnArkGridMoon.querySelector('.arkgridmoon-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowArkGridMoonParent) rowArkGridMoonParent.classList.toggle('expanded', isHidden);
      };
      btnArkGridMoon.addEventListener('click', doToggleArkGridMoon);
      if (rowArkGridMoonParent) {
        rowArkGridMoonParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleArkGridMoon(e);
        });
      }
    }

    // Gestion du dépliage interactif des Cœurs Étoile Ark Grid (Ordre & Chaos)
    const btnArkGridStar = document.getElementById('btnToggleArkGridStarDetails');
    const rowArkGridStarParent = document.getElementById('rowSysArkGridStar');
    const rowArkGridStarDet = document.getElementById('rowArkGridStarDetails');
    if (btnArkGridStar && rowArkGridStarDet) {
      const doToggleArkGridStar = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowArkGridStarDet.style.display === 'none';
        rowArkGridStarDet.style.display = isHidden ? 'table-row' : 'none';
        btnArkGridStar.setAttribute('aria-expanded', isHidden);
        const icon = btnArkGridStar.querySelector('.arkgridstar-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowArkGridStarParent) rowArkGridStarParent.classList.toggle('expanded', isHidden);
      };
      btnArkGridStar.addEventListener('click', doToggleArkGridStar);
      if (rowArkGridStarParent) {
        rowArkGridStarParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleArkGridStar(e);
        });
      }
    }

    // Gestion du dépliage interactif de l'Arme T4 & Palier Serka
    const btnWeapon = document.getElementById('btnToggleWeaponDetails');
    const rowWeaponParent = document.getElementById('rowSysWeapon');
    const rowWeaponDet = document.getElementById('rowWeaponDetails');
    if (btnWeapon && rowWeaponDet) {
      const doToggleWeapon = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowWeaponDet.style.display === 'none';
        rowWeaponDet.style.display = isHidden ? 'table-row' : 'none';
        btnWeapon.setAttribute('aria-expanded', isHidden);
        const icon = btnWeapon.querySelector('.weapon-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowWeaponParent) rowWeaponParent.classList.toggle('expanded', isHidden);
      };
      btnWeapon.addEventListener('click', doToggleWeapon);
      if (rowWeaponParent) {
        rowWeaponParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleWeapon(e);
        });
      }
    }

    // Gestion du dépliage interactif des Armures T4 & Palier Serka
    const btnArmors = document.getElementById('btnToggleArmorsDetails');
    const rowArmorsParent = document.getElementById('rowSysArmors');
    const rowArmorsDet = document.getElementById('rowArmorsDetails');
    if (btnArmors && rowArmorsDet) {
      const doToggleArmors = (e) => {
        if (e) e.stopPropagation();
        const isHidden = rowArmorsDet.style.display === 'none';
        rowArmorsDet.style.display = isHidden ? 'table-row' : 'none';
        btnArmors.setAttribute('aria-expanded', isHidden);
        const icon = btnArmors.querySelector('.armors-toggle-icon');
        if (icon) icon.textContent = isHidden ? '−' : '+';
        if (rowArmorsParent) rowArmorsParent.classList.toggle('expanded', isHidden);
      };
      btnArmors.addEventListener('click', doToggleArmors);
      if (rowArmorsParent) {
        rowArmorsParent.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) doToggleArmors(e);
        });
      }
    }

    // Gestion du bouton dépliable des lignes équivalentes
    const wrapToggle = document.getElementById('wrapToggleEqualRows');
    const lblToggle = document.getElementById('lblToggleEqualRows');
    const tbl = document.getElementById('benchmarkCompareTable');
    if (wrapToggle && lblToggle && tbl) {
      if (equalRowsCount > 0) {
        wrapToggle.style.display = 'flex';
        const isExp = tbl.classList.contains('show-equal');
        const isEnglish = isEnglishLang();
        lblToggle.textContent = isExp
          ? (isEnglish ? `Hide ${equalRowsCount} equivalent systems ▴` : `Masquer les ${equalRowsCount} systèmes équivalents ▴`)
          : (isEnglish ? `Show ${equalRowsCount} equivalent systems (0% delta) ▾` : `Afficher les ${equalRowsCount} systèmes équivalents (0% d'écart) ▾`);
      } else {
        wrapToggle.style.display = 'none';
      }
    }

    const btnToggle = document.getElementById('btnToggleEqualRows');
    if (btnToggle && !btnToggle.dataset.bound) {
      btnToggle.dataset.bound = 'true';
      btnToggle.addEventListener('click', () => {
        const tTable = document.getElementById('benchmarkCompareTable');
        const tLbl = document.getElementById('lblToggleEqualRows');
        if (tTable && tLbl) {
          tTable.classList.toggle('show-equal');
          const isExpanded = tTable.classList.contains('show-equal');
          const eqCount = tTable.querySelectorAll('tr.row-equal').length;
          const isEnglish = isEnglishLang();
          tLbl.textContent = isExpanded
            ? (isEnglish ? `Hide ${eqCount} equivalent systems ▴` : `Masquer les ${eqCount} systèmes équivalents ▴`)
            : (isEnglish ? `Show ${eqCount} equivalent systems (0% delta) ▾` : `Afficher les ${eqCount} systèmes équivalents (0% d'écart) ▾`);
        }
      });
    }
  }

  // 6. Plan d'Action Recommandé
  const actionList = document.getElementById('benchmarkActionList');
  if (actionList) {
    const actions = plan.length > 0 ? plan : (target.actionPlan || []);
    let actHtml = '';
    actions.forEach(a => {
      actHtml += `
          <div class="bench-action-item">
            <div class="bench-action-left">
              <div class="bench-action-step">${a.step}</div>
              <div class="bench-action-content">
                <strong>${escapeHtml(a.title)}</strong>
                <span>${escapeHtml(a.desc)}</span>
              </div>
            </div>
            <div class="bench-action-right">
              <div class="bench-action-cost">${escapeHtml(a.cost)}</div>
              <div class="bench-action-roi">${escapeHtml(a.gain)} • ${escapeHtml(a.roi)}</div>
            </div>
          </div>
        `;
    });
    actionList.innerHTML = actHtml;
  }
}


// --- SYNC LIVE LOSTARK.BIBLE ENGINE (TEMPS RÉEL SANS SNAPSHOT) ---
let liveBibleBenchmarkCache = {};
try {
  const savedLiveCache = lsGet('lostark_live_benchmarks_cache');
  if (savedLiveCache) {
    liveBibleBenchmarkCache = compactParse(savedLiveCache) || {};
    Object.values(liveBibleBenchmarkCache).forEach(b => {
      if (b && b.isLive) {
        const raidCp = raidCombatPowerOf(b);
        if (raidCp) b.cp = raidCp;
        b.spec = getCharacterSpecName({ ...b, spec: '' });
        if ((!b.gear || !b.systems || !b.systems.weapon || b.systems.weapon.label.includes('+17')) && b.rawProfile && b.rawProfile.gear) {
          b.gear = b.rawProfile.gear;
          b.weaponQuality = b.rawProfile.weaponQuality !== undefined ? b.rawProfile.weaponQuality : b.weaponQuality;
          b.weaponQualityValue = b.rawProfile.weaponQualityValue !== undefined ? b.rawProfile.weaponQualityValue : b.weaponQualityValue;
          b.advHoning = b.rawProfile.advHoning !== undefined ? b.rawProfile.advHoning : b.advHoning;
          b.systems = extractPlayerSystems(b, isEnglishLang());
        }
        if (!benchmarkState.searchedTargets || !benchmarkState.searchedTargets.some(s => s.id === b.id)) {
          benchmarkState.searchedTargets.push(b);
        }
      }
    });
  }
} catch (e) {}

async function fetchLiveBibleBenchmark(characterName, region = 'AUTO', preferredRole = 'support') {
  if (!characterName) return null;
  let cleanName = characterName.trim();
  if (!cleanName) return null;

  let targetRegion = (region || 'AUTO').toUpperCase();

  // 1. Détection automatique d'une URL lostark.bible complète
  const urlMatch = cleanName.match(/(?:https?:\/\/)?(?:www\.)?lostark\.bible\/character\/([a-zA-Z]+)\/([^/?#\s]+)/i);
  if (urlMatch) {
    targetRegion = urlMatch[1].toUpperCase();
    cleanName = decodeURIComponent(urlMatch[2]);
  }

  // 2. Détection d'une région entre parenthèses : "Pseudo (CE)" ou "Pseudo (NAE)"
  const parenMatch = cleanName.match(/^([^(]+)\s*\((CE|NAE|NAW|SA)\)$/i);
  if (parenMatch) {
    cleanName = parenMatch[1].trim();
    targetRegion = parenMatch[2].toUpperCase();
  }

  const cacheKey = `${cleanName.toLowerCase()}_${targetRegion}`;
  if (liveBibleBenchmarkCache[cacheKey]) {
    return liveBibleBenchmarkCache[cacheKey];
  }

  // Définition de l'ordre des régions à interroger (Auto ou région sélectionnée en priorité)
  let regionsToTry = ['CE', 'NA', 'NAE', 'NAW', 'SA'];
  if (targetRegion !== 'AUTO') {
    regionsToTry = [targetRegion, 'CE', 'NA', 'NAE', 'NAW', 'SA'].filter((v, i, a) => a.indexOf(v) === i);
  }

  let validData = null;
  let successfulRegion = 'CE';

  for (const reg of regionsToTry) {
    const encodedName = encodeURIComponent(cleanName);
    const proxyUrl = `/api/bible/character/${reg}/${encodedName}/__data.json`;
    const directUrl = `https://lostark.bible/character/${reg}/${encodedName}/__data.json`;

    let res = null;
    try {
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) res = proxyRes;
    } catch (e) {}

    if (!res) {
      try {
        res = await fetch(directUrl, { mode: 'cors' });
      } catch (e) {}
    }

    if (!res || !res.ok) continue;

    try {
      let json = await res.json();

      // Résolution automatique des redirections HTTP (ex: casse du pseudo genkidama -> Genkidama ou NAE -> NA)
      if (json.type === 'redirect' && json.location) {
        const locMatch = json.location.match(/^\/character\/([^\/]+)/i);
        const redirectProxyUrl = `/api/bible${json.location}/__data.json`;
        const redirectDirectUrl = `https://lostark.bible${json.location}/__data.json`;
        let rRes = null;
        try {
          const rProxy = await fetch(redirectProxyUrl);
          if (rProxy.ok) rRes = rProxy;
        } catch (e) {}
        if (!rRes) {
          try {
            rRes = await fetch(redirectDirectUrl, { mode: 'cors' });
          } catch (e) {}
        }
        if (rRes && rRes.ok) {
          json = await rRes.json();
          if (locMatch && locMatch[1]) {
            successfulRegion = locMatch[1].toUpperCase();
          }
        }
      }

      if (!json.nodes || !json.nodes[2] || !json.nodes[2].data) continue;

      const nodeData = json.nodes[2].data;
      const parsed = parseBibleCharacter(nodeData, preferredRole || 'support');
      if (parsed && parsed.ilvl && parsed.ilvl > 500) {
        validData = { json, parsed };
        successfulRegion = reg;
        break;
      }
    } catch (err) {
      // En cas d'erreur ou de profil vide sur cette région, on tente la suivante
      continue;
    }
  }

  if (!validData) return null;

  const { json, parsed } = validData;
  let header = {};
  if (json.nodes[1] && json.nodes[1].data) {
    try {
      const r1 = unflattenDevalue(json.nodes[1].data);
      if (r1 && r1.header) header = r1.header;
    } catch (e) {}
  }

  const normClass = normalizeClassName(header.class || (parsed.loadout && parsed.loadout.classId) || parsed.className || '');
  // Déclaré avant detectCharacterRole, qui l'utilise (ReferenceError « before initialization » sinon)
  const displayName = capitalize(header.name || cleanName);
  const liveRole = detectCharacterRole({
    className: normClass,
    classId: parsed.loadout && parsed.loadout.classId,
    engravings: parsed.engravings,
    name: displayName
  });
  const isSupport = liveRole === 'support' || (parsed.battlePoint && parsed.battlePoint.isSupport === true);
  const liveIlvl = header.ilvl ? Number(header.ilvl.toFixed(2)) : (parsed.ilvl || 1740);
  // CP du profil raid comparé ligne par ligne ; maxCombatPower (maximum historique) seulement en repli
  const liveCp = parseFloat((parsed.raidCombatPower || header.maxCombatPower?.score || header.combatPower?.score || parsed.inGameScore || parsed.calculatedScore || 4000).toFixed(2));

  const liveChar = {
    name: displayName,
    className: normClass,
    role: isSupport ? 'support' : 'dps',
    ilvl: liveIlvl,
    cp: liveCp,
    server: header.world ? `${header.world} (${successfulRegion})` : `${successfulRegion} Server`,
    guild: (header.guild && header.guild.name) || (typeof header.guild === 'string' ? header.guild : '') || 'lostark.bible',
    rosterLevel: header.rosterLevel || 300,
    portraitUrl: (header.portrait && header.portrait.url) || null,
    avatarUrl: (header.portrait && header.portrait.url) || getClassIconUrl(normClass, isSupport ? 'support' : 'dps'),
    bibleUrl: `https://lostark.bible/character/${successfulRegion}/${encodeURIComponent(displayName)}`,
    rawProfile: parsed,
    gear: parsed.gear,
    advHoning: parsed.advHoning,
    weaponQuality: parsed.weaponQuality !== undefined ? parsed.weaponQuality : 90,
    weaponQualityValue: parsed.weaponQualityValue !== undefined ? parsed.weaponQualityValue : 2500,
    gemParts: parsed.gemParts,
    engravings: parsed.engravings,
    arkGridCores: parsed.arkGridCores,
    arkGrid: getArkGridStatus({ rawProfile: parsed, id: displayName.toLowerCase() }),
    accRolled: parsed.accRolled,
    accessories: parsed.accessories || [],
    bracelet: parsed.bracelet || (parsed.loadout && parsed.loadout.items ? parsed.loadout.items.find(i => i.slot === 'bracelet') : null) || null,
    loadout: parsed.loadout || null,
    apPoints: parsed.apPoints || null,
    isLive: true
  };

  const isEn = isEnglishLang();
  const systems = extractPlayerSystems(liveChar, isEn);

  const fullBenchmark = {
    id: `live_${displayName.toLowerCase()}`,
    name: liveChar.name,
    className: liveChar.className,
    spec: getCharacterSpecName(liveChar),
    role: liveChar.role,
    ilvl: liveChar.ilvl,
    cp: liveChar.cp,
    server: liveChar.server,
    guild: liveChar.guild,
    rosterLevel: liveChar.rosterLevel,
    gemTier: (liveChar.gemParts && liveChar.gemParts.some(g => g >= (isSupport ? 11.0 : 6.4))) ? 'gem9' : 'gem8',
    gemDesc: getCharacterGemSummary(liveChar, isEn),
    avatarUrl: liveChar.avatarUrl,
    bibleUrl: liveChar.bibleUrl,
    isLive: true,
    systems: systems,
    gear: liveChar.gear,
    advHoning: liveChar.advHoning,
    weaponQuality: liveChar.weaponQuality,
    weaponQualityValue: liveChar.weaponQualityValue,
    gemParts: liveChar.gemParts,
    engravings: liveChar.engravings,
    apPoints: liveChar.apPoints,
    accessories: liveChar.accessories || [],
    bracelet: liveChar.bracelet || null,
    rawProfile: parsed,
    loadout: parsed.loadout || null
  };

  liveBibleBenchmarkCache[cacheKey] = fullBenchmark;
  liveBibleBenchmarkCache[displayName.toLowerCase()] = fullBenchmark;
  storeCompact('lostark_live_benchmarks_cache', liveBibleBenchmarkCache);
  return fullBenchmark;
}


async function searchAndCompareBibleProfile(cleanName, region = 'AUTO') {
  const statusEl = document.getElementById('benchLoadingStatus');
  const regionSelect = document.getElementById('benchSearchRegion');
  const reg = (region && region !== 'AUTO') ? region : (regionSelect ? regionSelect.value : 'AUTO');
  const isEn = isEnglishLang();

  if (statusEl) {
    statusEl.className = 'bench-status-msg info';
    statusEl.style.display = 'block';
    statusEl.innerHTML = isEn
      ? `Querying live data for <strong>${escapeHtml(cleanName)}</strong> from lostark.bible...`
      : `Interrogation directe de <strong>${escapeHtml(cleanName)}</strong> sur lostark.bible (Live)...`;
  }

  try {
    const activePlayer = getCurrentActiveCharacter();
    if (activePlayer && cleanName.toLowerCase() === (activePlayer.name || '').toLowerCase().trim()) {
      throw new Error(isEn ? "You cannot compare a character against themselves. Please select another reference player." : "Vous ne pouvez pas vous comparer à vous-même. Veuillez sélectionner un autre joueur de référence.");
    }
    const liveBench = await fetchLiveBibleBenchmark(cleanName, reg, (activePlayer && activePlayer.role) || 'support');
    if (!liveBench) throw new Error(isEn ? "Profile not found" : "Profil introuvable");

    if (!benchmarkState.searchedTargets) {
      benchmarkState.searchedTargets = [];
    }
    // Ajouter en tête de liste sans doublon
    benchmarkState.searchedTargets = benchmarkState.searchedTargets.filter(t => t.id !== liveBench.id);
    benchmarkState.searchedTargets.unshift(liveBench);

    benchmarkState.customTarget = liveBench;
    benchmarkState.currentTargetId = liveBench.id;

    if (statusEl) {
      statusEl.className = 'bench-status-msg success';
      statusEl.innerHTML = isEn
        ? `Live data retrieved from lostark.bible for <strong>${escapeHtml(liveBench.name)}</strong> (${escapeHtml(liveBench.className)} • ${liveBench.ilvl.toFixed(2)} iLvl • <strong>${formatNumber(Math.round(liveBench.cp))} CP</strong>).`
        : `Données récupérées en direct de lostark.bible pour <strong>${escapeHtml(liveBench.name)}</strong> (${escapeHtml(liveBench.className)} • ${liveBench.ilvl.toFixed(2)} iLvl • <strong>${formatNumber(Math.round(liveBench.cp))} CP</strong>).`;
      setTimeout(() => {
        if (statusEl) statusEl.style.display = 'none';
      }, 5000);
    }

    renderBenchmarkTab();
  } catch (err) {
    console.warn('searchAndCompareBibleProfile error:', err);
    if (!benchmarkState.failedAttempts) benchmarkState.failedAttempts = new Set();
    benchmarkState.failedAttempts.add(`${cleanName.toLowerCase()}_${reg}`);
    if (statusEl) {
      statusEl.className = 'bench-status-msg error';
      statusEl.style.display = 'block';
      statusEl.innerHTML = isEn
        ? `<strong>Could not query lostark.bible for "${escapeHtml(cleanName)}":</strong> verify character name spelling or paste full profile URL (e.g. <code>https://lostark.bible/character/CE/...</code>).`
        : `<strong>Impossible d'interroger lostark.bible pour « ${escapeHtml(cleanName)} » :</strong> vérifiez l'orthographe du pseudo ou essayez de coller le lien complet du profil (ex: <code>https://lostark.bible/character/CE/...</code>).`;
    }
    renderBenchmarkTab();
  }
}

function initBenchmarkEvents() {
  const btnAuto = document.getElementById('btnBenchmarkAutoMatch');
  if (btnAuto) {
    btnAuto.addEventListener('click', () => {
      // Revient au meilleur joueur proposé (même classe, CP le plus proche au-dessus)
      const player = getCurrentActiveCharacter();
      benchmarkState.userPickedTarget = false;
      benchmarkState.customTarget = null;
      benchmarkState.currentTargetId = null;
      if (player) {
        const st = suggestedPeersState.byPlayer[suggestedPeersKey(player)];
        const best = st && st.peers && st.peers[0];
        if (best) {
          benchmarkState.customTarget = best;
          benchmarkState.currentTargetId = best.id;
        }
      }
      renderBenchmarkTab();
    });
  }

  const select = document.getElementById('benchmarkPresetSelect');
  if (select) {
    select.addEventListener('change', () => {
      benchmarkState.userPickedTarget = true;
      const val = select.value;
      const searched = (benchmarkState.searchedTargets || []).find(s => s.id === val);
      if (searched) {
        benchmarkState.customTarget = searched;
        benchmarkState.currentTargetId = searched.id;
      } else {
        benchmarkState.customTarget = null;
        benchmarkState.currentTargetId = val;
      }
      renderBenchmarkTab();
    });
  }

  const gemFilterGroup = document.getElementById('benchmarkGemFilterGroup');
  if (gemFilterGroup) {
    gemFilterGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.bench-filter-pill');
      if (!btn) return;
      gemFilterGroup.querySelectorAll('.bench-filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      benchmarkState.gemFilter = btn.dataset.filter || 'all';
      benchmarkState.customTarget = null;
      benchmarkState.currentTargetId = null;
      renderBenchmarkTab();
    });
  }

  const searchBtn = document.getElementById('btnBenchSearchSubmit');
  const searchInput = document.getElementById('benchCustomSearchInput');
  const searchRegion = document.getElementById('benchSearchRegion');
  if (searchBtn && searchInput) {
    const doSearch = () => {
      const val = searchInput.value.trim();
      const reg = searchRegion ? searchRegion.value : 'AUTO';
      if (val) {
        benchmarkState.userPickedTarget = true;
        searchAndCompareBibleProfile(val, reg);
      }
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }
}
