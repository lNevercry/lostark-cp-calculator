// Événements, fiche du personnage, cartes de profil, chargement d'un personnage.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- 5. INITIALISATION DES ÉVÉNEMENTS & INTERACTIONS ---

function bindEvents() {
  // Switch de Rôle (Support vs DPS) - s'il est présent dans le DOM
  if (dom.roleSupport) dom.roleSupport.addEventListener('click', () => setRole('support'));
  if (dom.roleDps) dom.roleDps.addEventListener('click', () => setRole('dps'));

  // Navigation des onglets
  dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.tabBtns.forEach(b => b.classList.remove('active'));
      dom.tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        if (targetId === 'tab-canonical') renderCanonicalView();
        if (targetId === 'tab-advisor') renderAdvisorView();
        if (targetId === 'tab-arkpassive') updateArkPassiveView();
        if (targetId === 'tab-raidtracker') renderRaidTrackerView();
        if (targetId === 'tab-benchmark') renderBenchmarkTab();
        if (targetId === 'tab-optimization') updateOptimizationView();
        if (targetId === 'tab-belgardin') updateBelgardinView();
        if (targetId === 'tab-rotation') showRotationTab();
      }
    });
  });

  // Clics interactifs sur les Cartes de Score de Profil (Loseii Style)
  function navigateToTab(tabId) {
    if (!dom.tabBtns || !dom.tabPanes) return;
    dom.tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
    dom.tabPanes.forEach(p => p.classList.toggle('active', p.id === tabId));
    if (tabId === 'tab-canonical') renderCanonicalView();
    if (tabId === 'tab-advisor') renderAdvisorView();
    if (tabId === 'tab-arkpassive') updateArkPassiveView();
    if (tabId === 'tab-raidtracker') renderRaidTrackerView();
    if (tabId === 'tab-benchmark') renderBenchmarkTab();
    if (tabId === 'tab-optimization') updateOptimizationView();
    if (tabId === 'tab-belgardin') updateBelgardinView();
    const pane = document.getElementById(tabId);
    if (pane) pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (dom.scoreCardAcc) dom.scoreCardAcc.addEventListener('click', () => navigateToTab('tab-optimization'));
  if (dom.scoreCardBracelet) dom.scoreCardBracelet.addEventListener('click', () => navigateToTab('tab-optimization'));
  if (dom.scoreCardAstro) dom.scoreCardAstro.addEventListener('click', () => navigateToTab('tab-optimization'));
  if (dom.scoreCardGpd) dom.scoreCardGpd.addEventListener('click', () => navigateToTab('tab-advisor'));

  function handleCurrentIlvlChange(newIlvl) {
    const prevIlvl = state.currentIlvl;
    const prevTarget = state.targetIlvl;
    const targetGap = Math.max(0, prevTarget - prevIlvl);
    const dIlvl = newIlvl - prevIlvl;

    state.currentIlvl = parseFloat(newIlvl.toFixed(2));

    // 1. Mise à jour dynamique et positive du Combat Power actuel selon la pente d'affinage
    if (dIlvl !== 0 && state.currentCp > 0) {
      const baseRate = state.role === 'support' ? 9.8 : 10.5;
      const cpScale = state.currentCp / 3500;
      const slope = baseRate * cpScale;
      state.currentCp = Math.max(100, Math.round(state.currentCp + dIlvl * slope));
      
      if (dom.sliderCurrentCp) dom.sliderCurrentCp.value = state.currentCp;
      if (dom.numCurrentCp) dom.numCurrentCp.value = state.currentCp;
      if (dom.dispCurrentCp) dom.dispCurrentCp.textContent = formatNumber(state.currentCp);
    }

    // 2. Maintien de l'iLvl cible toujours supérieur ou égal à l'iLvl actuel (évite tout gain négatif)
    if (state.targetIlvl <= state.currentIlvl) {
      state.targetIlvl = parseFloat((state.currentIlvl + 10).toFixed(2));
    }

    // 3. Ajustement de la borne minimale du curseur cible
    if (dom.sliderTargetIlvl) {
      dom.sliderTargetIlvl.min = Math.floor(state.currentIlvl);
    }

    updateTargetButtons();
    updatePredictorView();
    updateTargetButtonsState();
  }

  function handleTargetIlvlChange(newTarget) {
    if (newTarget < state.currentIlvl) {
      newTarget = state.currentIlvl;
    }
    state.targetIlvl = parseFloat(newTarget.toFixed(2));
    updatePredictorView();
    updateTargetButtonsState();
  }

  // Inputs iLvl Actuel
  dom.sliderCurrentIlvl.addEventListener('input', (e) => {
    handleCurrentIlvlChange(parseFloat(e.target.value));
  });
  dom.numCurrentIlvl.addEventListener('change', (e) => {
    handleCurrentIlvlChange(parseFloat(e.target.value) || 1740);
  });

  // Inputs CP Actuel
  dom.sliderCurrentCp.addEventListener('input', (e) => {
    state.currentCp = parseInt(e.target.value, 10);
    updatePredictorView();
  });
  dom.numCurrentCp.addEventListener('change', (e) => {
    state.currentCp = parseInt(e.target.value, 10) || 3000;
    updatePredictorView();
  });

  // Inputs iLvl Cible
  dom.sliderTargetIlvl.addEventListener('input', (e) => {
    handleTargetIlvlChange(parseFloat(e.target.value));
  });
  dom.numTargetIlvl.addEventListener('change', (e) => {
    handleTargetIlvlChange(parseFloat(e.target.value) || state.currentIlvl);
  });

  // Boutons de saut d'iLvl cible rapide (1750, 1760, 1770, 1780...)
  dom.quickTargetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.getAttribute('data-target'));
      state.targetIlvl = val;
      updatePredictorView();
      updateTargetButtonsState();
    });
  });

  // Commutateur de Mode de Prédiction (Affinage Pur vs Évolution Globale)
  const btnPredHoning = document.getElementById('btnPredModeHoning');
  const btnPredGlobal = document.getElementById('btnPredModeGlobal');
  if (btnPredHoning && btnPredGlobal) {
    btnPredHoning.addEventListener('click', () => {
      state.predictionMode = 'honing';
      btnPredHoning.classList.add('active');
      btnPredGlobal.classList.remove('active');
      updatePredictorView();
    });
    btnPredGlobal.addEventListener('click', () => {
      state.predictionMode = 'global';
      btnPredGlobal.classList.add('active');
      btnPredHoning.classList.remove('active');
      updatePredictorView();
    });
  }

  // Sélecteur de bonus gemmes
  dom.gemSelect.addEventListener('change', (e) => {
    state.gemBonus = computeGemBonus(e.target.value);
    updatePredictorView();
  });

  // Steppers d'équipement (Affinage pièce par pièce)
  dom.gearRows.forEach(row => {
    const piece = row.getAttribute('data-piece');
    const decBtn = row.querySelector('.btn-step.dec');
    const incBtn = row.querySelector('.btn-step.inc');

    decBtn.addEventListener('click', () => {
      if (state.gear[piece] > 10) {
        state.gear[piece]--;
        updateHoningView();
      }
    });

    incBtn.addEventListener('click', () => {
      if (state.gear[piece] < 25) {
        state.gear[piece]++;
        updateHoningView();
      }
    });
  });

  // Affinage avancé
  dom.advHoningSelect.addEventListener('change', (e) => {
    state.advHoning = parseInt(e.target.value, 10);
    updateHoningView();
  });

  // Actions collectives d'affinage (+14, +16, +18, +20 partout)
  dom.btnAll14.addEventListener('click', () => setAllGear(14));
  dom.btnAll16.addEventListener('click', () => setAllGear(16));
  dom.btnAll18.addEventListener('click', () => setAllGear(18));
  dom.btnAll20.addEventListener('click', () => setAllGear(20));

  const btnResetH = document.getElementById('btnResetHoning');
  if (btnResetH) {
    btnResetH.addEventListener('click', () => {
      if (state.baselineGear) {
        state.gear = { ...state.baselineGear };
      }
      if (state.baselineAdvHoning !== undefined) {
        state.advHoning = state.baselineAdvHoning;
        if (dom.advHoningSelect) dom.advHoningSelect.value = state.advHoning.toString();
      }
      updateHoningView();
    });
  }

  // Gestion de l'upload et de la personnalisation d'image de personnage
  if (dom.charImageUploadInput) {
    dom.charImageUploadInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert(trLang('Choisis une image de moins de 5 Mo.', 'Please choose an image under 5 MB.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const currentChar = getCurrentActiveCharacter();
        const charKey = (activeCharacterId || (currentChar && currentChar.id) || 'character').toLowerCase();
        const dataUrl = event.target.result;
        if (!lsSet('char_custom_avatar_' + charKey, dataUrl)) {
          showToast(trLang("Image non enregistrée : stockage du navigateur plein ou bloqué.", 'Image not saved: browser storage is full or blocked.'));
        }
        if (dom.charAvatarImg) dom.charAvatarImg.src = dataUrl;
        const chipImg = document.getElementById('chipAvatar_' + charKey);
        if (chipImg) chipImg.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  if (dom.btnResetAvatar) {
    dom.btnResetAvatar.addEventListener('click', () => {
      const currentChar = getCurrentActiveCharacter();
      const charKey = (activeCharacterId || (currentChar && currentChar.id) || 'character').toLowerCase();
      lsDel('char_custom_avatar_' + charKey);
      const defaultImg = (currentChar && currentChar.portraitUrl) || DEFAULT_AVATARS[charKey] || (currentChar ? getClassIconUrl(currentChar.className, currentChar.role) : 'images/classes/paladin.png');
      if (dom.charAvatarImg) dom.charAvatarImg.src = defaultImg;
      const chipImg = document.getElementById('chipAvatar_' + charKey);
      if (chipImg) chipImg.src = defaultImg;
    });
  }

  // Contrôles Roster & Presets Dynamiques
  if (dom.btnSyncRosterNav) {
    dom.btnSyncRosterNav.addEventListener('click', () => {
      if (dom.importModal) {
        dom.importModal.classList.add('active');
        renderSavedRosterManager();
      }
    });
  }

  if (dom.btnManageRoster) {
    dom.btnManageRoster.addEventListener('click', () => {
      if (dom.importModal) {
        dom.importModal.classList.add('active');
        renderSavedRosterManager();
      }
    });
  }


  if (dom.btnOAuthSyncAllRoster) {
    dom.btnOAuthSyncAllRoster.addEventListener('click', () => {
      if (currentOAuthRosters) syncAllOAuthCharacters(currentOAuthRosters);
    });
  }

  if (dom.btnRefreshAllUserRoster) {
    dom.btnRefreshAllUserRoster.addEventListener('click', () => refreshAllUserRosterCharacters());
  }

  if (dom.btnClearUserRoster) {
    dom.btnClearUserRoster.addEventListener('click', () => clearUserRoster());
  }

  // Modal d'Aide
  const helpModal = document.getElementById('helpModal');
  const btnOpenHelp = document.getElementById('btnOpenHelpModal');
  const btnCloseHelp = document.getElementById('btnCloseHelpModal');
  const btnCloseHelpFooter = document.getElementById('btnCloseHelpModalFooter');

  if (btnOpenHelp && helpModal) {
    btnOpenHelp.addEventListener('click', () => helpModal.classList.add('active'));
  }
  if (btnCloseHelp && helpModal) {
    btnCloseHelp.addEventListener('click', () => helpModal.classList.remove('active'));
  }
  if (btnCloseHelpFooter && helpModal) {
    btnCloseHelpFooter.addEventListener('click', () => helpModal.classList.remove('active'));
  }
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('active');
    });
  }

  // Modal d'Importation lostark.bible
  if (dom.btnOpenImportModal && dom.importModal) {
    dom.btnOpenImportModal.addEventListener('click', () => {
      dom.importModal.classList.add('active');
      if (dom.importStatus) dom.importStatus.style.display = 'none';
    });
  }

  if (dom.btnCloseImportModal && dom.importModal) {
    dom.btnCloseImportModal.addEventListener('click', () => {
      dom.importModal.classList.remove('active');
    });
  }

  // Modale d'import fermée sans aucun personnage (ouverte depuis l'accueil) : retour à l'accueil, jamais une page vide
  if (dom.importModal) {
    new MutationObserver(() => {
      if (!dom.importModal.classList.contains('active') && document.body.classList.contains('no-character')) {
        const w = document.getElementById('welcomeModal');
        if (w) w.classList.add('active');
      }
    }).observe(dom.importModal, { attributes: true, attributeFilter: ['class'] });
  }

  if (dom.btnCloseImportModalFooter && dom.importModal) {
    dom.btnCloseImportModalFooter.addEventListener('click', () => {
      dom.importModal.classList.remove('active');
    });
  }

  if (dom.importModal) {
    dom.importModal.addEventListener('click', (e) => {
      if (e.target === dom.importModal) {
        dom.importModal.classList.remove('active');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dom.importModal && dom.importModal.classList.contains('active')) {
        dom.importModal.classList.remove('active');
      }
      const aModal = document.getElementById('agentDownloadModal');
      if (aModal && aModal.classList.contains('active')) {
        aModal.classList.remove('active');
      }
      const hModal = document.getElementById('helpModal');
      if (hModal) hModal.classList.remove('active');
    }
  });

  // Modal Téléchargement Agent Local
  const agentModal = document.getElementById('agentDownloadModal');
  const btnOpenAgentModal = document.getElementById('btnOpenAgentModal');
  const btnCloseAgentModal = document.getElementById('btnCloseAgentModal');
  const btnCloseAgentModalFooter = document.getElementById('btnCloseAgentModalFooter');
  const raidPill = document.getElementById('raidAgentStatusPill');

  if (btnOpenAgentModal && agentModal) {
    btnOpenAgentModal.addEventListener('click', () => {
      agentModal.classList.add('active');
    });
  }

  if (raidPill && agentModal) {
    raidPill.style.cursor = 'pointer';
    raidPill.title = trLang('Cliquez pour ouvrir l\'aide et l\'installation de l\'agent', 'Click to open the agent help and installation');
    raidPill.addEventListener('click', () => {
      agentModal.classList.add('active');
    });
  }

  if (btnCloseAgentModal && agentModal) {
    btnCloseAgentModal.addEventListener('click', () => {
      agentModal.classList.remove('active');
    });
  }

  if (btnCloseAgentModalFooter && agentModal) {
    btnCloseAgentModalFooter.addEventListener('click', () => {
      agentModal.classList.remove('active');
    });
  }

  if (agentModal) {
    agentModal.addEventListener('click', (e) => {
      if (e.target === agentModal) {
        agentModal.classList.remove('active');
      }
    });
  }

  if (dom.btnFetchBible) {
    dom.btnFetchBible.addEventListener('click', () => {
      const region = dom.importRegion ? dom.importRegion.value : 'CE';
      const name = dom.importCharName ? dom.importCharName.value.trim() : '';
      if (!name) {
        if (dom.importStatus) {
          dom.importStatus.className = 'modal-status error';
          dom.importStatus.style.display = 'block';
          dom.importStatus.textContent = trLang('Renseigne le pseudo de ton personnage.', 'Please enter your character name.');
        }
        return;
      }
      const autoAdd = dom.chkAutoAddToRoster ? dom.chkAutoAddToRoster.checked : true;
      fetchBibleProfile(region, name, autoAdd);
    });
  }

  if (dom.btnParseDirectJson) {
    dom.btnParseDirectJson.addEventListener('click', () => {
      const raw = dom.importJsonDirect ? dom.importJsonDirect.value.trim() : '';
      if (!raw) return;
      const fail = msg => {
        if (!dom.importStatus) return;
        dom.importStatus.className = 'modal-status error';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = msg;
      };
      // Le JSON de lostark.bible ne contient pas le pseudo : on prend celui de la modale (et sa région)
      const name = dom.importCharName ? dom.importCharName.value.trim() : '';
      if (!name) return fail(trLang('Renseigne le pseudo du personnage au-dessus avant de coller son JSON.', 'Enter the character name above before pasting its JSON.'));
      const region = dom.importRegion ? dom.importRegion.value : 'CE';
      let json;
      try {
        json = JSON.parse(raw);
      } catch (e) {
        return fail(trLang('Format JSON invalide. Assure-toi de copier l\'intégralité du texte.', 'Invalid JSON. Make sure you copied the whole text.'));
      }
      try {
        const autoAdd = dom.chkAutoAddToRoster ? dom.chkAutoAddToRoster.checked : true;
        applyLoadedProfile(json, name, region, autoAdd);
      } catch (e) {
        console.warn('Import manuel :', e);
        fail(trLang(`Profil illisible : ${e.message}`, `Unreadable profile: ${e.message}`));
      }
    });
  }

  // Contrôles OAuth 2.0 PKCE (lostark.bible)
  if (dom.btnOAuthLogin) {
    dom.btnOAuthLogin.addEventListener('click', () => startOAuthFlow());
  }

  // Client OAuth choisi automatiquement (getOAuthClientId : production en ligne, développement sur le réseau local)

  if (dom.btnOAuthRefresh) {
    dom.btnOAuthRefresh.addEventListener('click', () => {
      const token = lsGet('lostark_bible_token');
      if (token) fetchOAuthUserData(token);
    });
  }

  if (dom.btnOAuthLogout) {
    dom.btnOAuthLogout.addEventListener('click', () => logoutOAuth());
  }

  initAdvisorEvents();
  initArkPassiveEvents();
  initAstrogemGraderEvents();

  // Bouton de partage du profil actif (?char=Nom)
  const btnShare = document.getElementById('btnShareCharacter');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      const cur = getCurrentActiveCharacter();
      if (!cur) return;
      const curName = cur.name || '';
      // Région dans le lien : sans elle, un personnage NA s'ouvrait en CE (introuvable ou homonyme)
      const shareUrl = `${window.location.origin}${window.location.pathname}?char=${encodeURIComponent(curName)}&region=${characterRegion(cur)}`;
      const copyPrompt = () => prompt(trLang('Copie ce lien :', 'Copy this link:'), shareUrl);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast(`${trLang('Lien direct copié', 'Direct link copied')} : ${shareUrl}`);
        }).catch(copyPrompt);
      } else {
        copyPrompt();
      }
    });
  }

}

function showToast(msg) {
  let toast = document.getElementById('appGlobalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appGlobalToast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span></span> <span>${escapeHtml(msg)}</span>`;
  toast.style.display = 'flex';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 3800);
}


function initWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (!modal) return;

  const btnClose = document.getElementById('btnCloseWelcomeModal');
  const btnFetch = document.getElementById('btnWelcomeFetch');
  const inputName = document.getElementById('welcomeCharName');
  const selectRegion = document.getElementById('welcomeRegion');
  const statusEl = document.getElementById('welcomeStatus');

  function closeModal() {
    modal.classList.remove('active');
    try { lsSet('lostark_onboarding_dismissed', 'true', true); } catch (e) {}
  }

  if (btnClose) btnClose.addEventListener('click', closeModal);

  // Connexion OAuth et import manuel (JSON collé) ne sont que dans la modale d'import : accessible sans personnage
  const btnMore = document.getElementById('btnWelcomeMoreOptions');
  if (btnMore && dom.importModal) {
    btnMore.addEventListener('click', () => {
      modal.classList.remove('active');
      dom.importModal.classList.add('active');
      if (dom.importStatus) dom.importStatus.style.display = 'none';
    });
  }

  // Suggestions de pseudos rapides
  document.querySelectorAll('.welcome-chip-suggestion').forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.getAttribute('data-name');
      if (inputName) inputName.value = name;
      if (btnFetch) btnFetch.click();
    });
  });

  if (btnFetch) {
    btnFetch.addEventListener('click', async () => {
      const name = inputName ? inputName.value.trim() : '';
      const region = selectRegion ? selectRegion.value : 'CE';
      if (!name) {
        if (statusEl) {
          statusEl.className = 'modal-status error';
          statusEl.style.display = 'block';
          statusEl.textContent = trLang('Renseigne le pseudo de ton personnage.', 'Please enter your character name.');
        }
        return;
      }

      if (statusEl) {
        statusEl.className = 'modal-status info';
        statusEl.style.display = 'block';
        statusEl.innerHTML = trLang(`Recherche de <strong>${escapeHtml(name)} (${escapeHtml(region)})</strong> sur lostark.bible…`, `Looking up <strong>${escapeHtml(name)} (${escapeHtml(region)})</strong> on lostark.bible…`);
      }

      const loaded = await fetchBibleProfile(region, name, true);
      if (loaded) {
        closeModal();
        showToast(`${loaded.name} (${loaded.className} ${loaded.ilvl.toFixed(1)}) ${trLang('importé', 'imported')}.`);
      } else {
        if (statusEl) {
          statusEl.className = 'modal-status error';
          statusEl.style.display = 'block';
          // Site indisponible (429, panne) : le message de fetchBibleProfile le dit, au lieu de « introuvable »
          const down = dom.importStatus && /ne répond pas|not responding/.test(dom.importStatus.textContent || '');
          statusEl.innerHTML = down ? dom.importStatus.innerHTML : trLang(`Personnage <strong>${escapeHtml(name)}</strong> introuvable sur lostark.bible (${escapeHtml(region)}). Vérifie l'orthographe ou essaie une suggestion.`, `Character <strong>${escapeHtml(name)}</strong> not found on lostark.bible (${escapeHtml(region)}). Check the spelling or try a suggestion.`);
        }
      }
    });
  }

  if (inputName) {
    inputName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (btnFetch) btnFetch.click();
      }
    });
  }
}

async function checkUrlCharacterParam() {
  const params = new URLSearchParams(window.location.search);
  const charParam = params.get('char') || params.get('name') || params.get('player');
  const regionParam = BIBLE_REGIONS.includes(String(params.get('region') || '').toUpperCase()) ? params.get('region').toUpperCase() : 'CE';
  if (charParam && charParam.trim()) {
    try { lsSet('lostark_onboarding_dismissed', 'true', true); } catch (e) {}
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) welcomeModal.classList.remove('active');

    const clean = charParam.trim();
    const existing = getActiveRosterList().find(c => (c.name || '').toLowerCase() === clean.toLowerCase());
    if (existing) {
      loadCharacter(existing);
      showToast(trLang(`Profil ${existing.name} chargé.`, `Profile ${existing.name} loaded.`));
    } else {
      showToast(trLang(`Chargement de ${clean} (${regionParam})…`, `Loading ${clean} (${regionParam})…`));
      const loaded = await fetchBibleProfile(regionParam, clean, true);
      if (loaded) {
        showToast(trLang(`Personnage ${loaded.name} chargé depuis lostark.bible.`, `Character ${loaded.name} loaded from lostark.bible.`));
      } else if (dom.importModal) {
        // Échec : la modale d'import montre l'erreur (sinon page vide sans explication)
        dom.importModal.classList.add('active');
      }
    }
    return true;
  }
  return false;
}

function checkOnboarding() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('char') || params.get('name') || params.get('player') || params.get('code')) {
    return;
  }
  const userRoster = getUserRoster();
  const dismissed = lsGet('lostark_onboarding_dismissed', true);
  if (!userRoster && !dismissed) {
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
      welcomeModal.classList.add('active');
      const inputName = document.getElementById('welcomeCharName');
      if (inputName && typeof inputName.focus === 'function') setTimeout(() => inputName.focus(), 300);
    }
  }
}

function setAllGear(lvl) {
  for (const piece of Object.keys(state.gear)) {
    if (piece === 'weapon') {
      state.gear[piece] = Math.max(state.gear[piece], lvl);
    } else {
      state.gear[piece] = lvl;
    }
  }
  updateHoningView();
}

function updateTargetButtons() {
  if (!dom.quickTargetBtns || !dom.quickTargetBtns.length) return;
  const base = Math.ceil((state.currentIlvl + 0.5) / 10) * 10;
  const milestones = [base, base + 10, base + 20, base + 30, base + 40];
  dom.quickTargetBtns.forEach((btn, idx) => {
    if (milestones[idx] !== undefined) {
      const targetVal = milestones[idx];
      btn.setAttribute('data-target', targetVal.toString());
      btn.textContent = targetVal.toString();
    }
  });
}

function updateTargetButtonsState() {
  dom.quickTargetBtns.forEach(b => {
    const val = parseFloat(b.getAttribute('data-target'));
    b.classList.toggle('active', Math.abs(val - state.targetIlvl) < 0.1);
  });
}

function setRole(newRole) {
  state.role = newRole;
  const cur = getCurrentActiveCharacter();
  if (cur) {
    cur.role = newRole;
  }
  if (dom.roleSupport) dom.roleSupport.classList.toggle('active', newRole === 'support');
  if (dom.roleDps) dom.roleDps.classList.toggle('active', newRole === 'dps');
  if (dom.roleBadge) {
    dom.roleBadge.textContent = isEnLang()
      ? (newRole === 'support' ? 'Support model' : 'DPS model')
      : (newRole === 'support' ? 'Modèle Support' : 'Modèle DPS');
    dom.roleBadge.style.color = newRole === 'support' ? 'var(--support-color)' : 'var(--dps-color)';
    dom.roleBadge.style.borderColor = newRole === 'support' ? 'rgba(232, 230, 220, 0.3)' : 'rgba(224, 122, 99, 0.3)';
  }
  
  updatePredictorView();
  updateHoningView();
  updateOptimizationView();
  renderCanonicalView();
  updateAstrogemGraderView();
  updateBelgardinView();
  updateActiveCharacterCard(activeCharacterId, cur);
}

function updateActiveCharacterCard(key, customProfile = null) {
  const p = customProfile || getCurrentActiveCharacter();
  if (!p) return;
  const resolvedRole = detectCharacterRole(p);
  p.role = resolvedRole;
  state.role = resolvedRole;
  const isSupport = resolvedRole === 'support';
  const charKey = (p.id || p.name || 'char').toLowerCase();

  if (dom.charCardName) dom.charCardName.textContent = p.name || 'Personnage';
  if (dom.charCardClass) {
    const cName = p.className || (isSupport ? 'Paladin' : 'Shadowhunter');
    const sigilSrc = getClassIconUrl(cName, p.role);
    dom.charCardClass.innerHTML = `<img class="class-sigil-tag" src="${escapeHtml(sigilSrc)}" alt=""> <span>${escapeHtml(cName)}</span>`;
  }
  if (dom.charCardServer) {
    const sName = p.server || (isEnLang() ? 'Server' : 'Serveur');
    const guild = p.guild;
    const gName = guild ? `${guild} • ` : '';
    dom.charCardServer.textContent = `${gName}${sName}`;
  }
  if (dom.charCardIlvl) dom.charCardIlvl.textContent = (state.currentIlvl || p.ilvl || 1750).toFixed(2);
  if (dom.charCardCp) dom.charCardCp.textContent = `${formatNumber(Math.round(state.currentCp || p.cp || 0))} CP`;

  if (dom.charCardWeapon) {
    const wep = state.gear.weapon || (p.gear && p.gear.weapon) || 17;
    dom.charCardWeapon.textContent = `+${wep}`;
  }

  if (dom.charCardArmor) {
    const g = state.gear || p.gear;
    if (g) {
      const armors = [g.head, g.shoulder, g.chest, g.pants, g.gloves].filter(v => v !== undefined);
      if (armors.length) {
        const minA = Math.min(...armors);
        const maxA = Math.max(...armors);
        dom.charCardArmor.textContent = minA === maxA ? `+${minA}` : `+${minA} / +${maxA}`;
      }
    }
  }

  if (dom.charCardAdv) {
    const adv = state.advHoning !== undefined ? state.advHoning : p.advHoning;
    dom.charCardAdv.textContent = `+${adv}`;
  }

  if (dom.charCardRoster) {
    dom.charCardRoster.innerHTML = `Roster <strong>${p.rosterLevel || 300}</strong>`;
  }

  if (dom.activeCharacterCard) {
    dom.activeCharacterCard.classList.toggle('role-support', isSupport);
    dom.activeCharacterCard.classList.toggle('role-dps', !isSupport);
  }

  // Gestion de l'avatar du héros (priorité au custom upload local puis live / CDN officiel)
  const savedCustom = lsGet('char_custom_avatar_' + charKey);
  const isDemo = Object.prototype.hasOwnProperty.call(DEFAULT_AVATARS, charKey);
  const classIconFallback = getClassIconUrl(p.className, p.role);
  const defaultImg = p.portraitUrl || (isDemo ? DEFAULT_AVATARS[charKey] : classIconFallback);
  const finalAvatarSrc = savedCustom || defaultImg;

  if (dom.charAvatarImg) {
    dom.charAvatarImg.src = finalAvatarSrc;
    dom.charAvatarImg.onerror = () => { dom.charAvatarImg.src = classIconFallback; };
  }

  const chipImg = document.getElementById(`chipAvatar_${charKey}`);
  if (chipImg) {
    const faceSrc = getCharacterFaceAvatar(p);
    const isFull = isFullBodyAgsAvatar(faceSrc);
    chipImg.src = savedCustom || faceSrc;
    chipImg.classList.toggle('ags-fullbody-zoom', isFull && !savedCustom);
    chipImg.onerror = () => { chipImg.src = classIconFallback; };
  }

  // Mise à jour du pill d'équipement dans le footer (Arme, Armures, Adv Honing)
  if (dom.charCardGearPill) {
    const wep = state.gear.weapon || (p.gear && p.gear.weapon) || 17;
    let armStr = '+18';
    const g = state.gear || p.gear;
    if (g) {
      const armors = [g.head, g.shoulder, g.chest, g.pants, g.gloves].filter(v => v !== undefined);
      if (armors.length) {
        const minA = Math.min(...armors);
        const maxA = Math.max(...armors);
        armStr = minA === maxA ? `+${minA}` : `+${minA}/+${maxA}`;
      }
    }
    const adv = state.advHoning !== undefined ? state.advHoning : p.advHoning;
    dom.charCardGearPill.innerHTML = isEnLang()
      ? `Weapon <strong>+${wep}</strong> · Armor <strong>${armStr}</strong> · Adv. <strong>+${adv !== undefined ? adv : 40}</strong>`
      : `Arme <strong>+${wep}</strong> · Armures <strong>${armStr}</strong> · Avancé <strong>+${adv !== undefined ? adv : 40}</strong>`;
  }

  // Pierre d'aptitude : obtenue en jeu, on affiche ses niveaux et les chances d'atteindre le palier suivant
  if (dom.charCardStonePill) {
    const isEn = isEnLang();
    const stone = getAbilityStone(p);
    if (stone) {
      const [e1, e2] = stone.positives;
      const name = e => (isEn ? e.en : e.fr);
      const hasApBonus = e1.level + e2.level >= 5;
      const up = getAbilityStoneUpgrade(p, isSupport);
      let html = isEn
        ? `Stone <strong>${e1.nodes}/${e2.nodes}</strong>`
        : `Pierre <strong>${e1.nodes}/${e2.nodes}</strong>`;
      if (hasApBonus) html += isEn ? ' · base Atk. Power <strong>+1.5%</strong>' : ' · PA de base <strong>+1,5 %</strong>';
      if (up) {
        html += isEn
          ? ` · ${up.toLabel}: 1 stone in ${formatNumber(Math.round(up.stones))} (+${up.gain.toFixed(2)}%)`
          : ` · ${up.toLabel} : 1 pierre sur ${formatNumber(Math.round(up.stones))} (+${up.gain.toFixed(2).replace('.', ',')} %)`;
      }
      dom.charCardStonePill.innerHTML = html;
      dom.charCardStonePill.title = isEn
        ? `${name(e1)} Lv. ${e1.level} · ${name(e2)} Lv. ${e2.level}. Odds with optimal faceting of a new stone carrying the same engravings. At 5 levels in total (e.g. 9/7) the stone adds +1.5% base Atk. Power.`
        : `${name(e1)} niv. ${e1.level} · ${name(e2)} niv. ${e2.level}. Chances avec une taille optimale d'une nouvelle pierre aux mêmes gravures. À 5 niveaux au total (ex. 9/7), la pierre ajoute +1,5 % de PA de base.`;
      dom.charCardStonePill.hidden = false;
    } else {
      dom.charCardStonePill.hidden = true;
    }
  }

  // Profil raid mélangé (arbre d'Illumination d'un autre rôle) : chiffres non fiables, on le dit
  if (dom.charCardMixedPill) {
    const isEn = isEnLang();
    if (hasMixedRaidProfile(p, isSupport ? 'support' : 'dps')) {
      dom.charCardMixedPill.innerHTML = isEn
        ? `<strong>Raid profile mixed</strong> · ${isSupport ? 'DPS' : 'support'} Ark Passive, CP not comparable`
        : `<strong>Profil raid mélangé</strong> · Ark Passive ${isSupport ? 'DPS' : 'support'}, CP non comparable`;
      dom.charCardMixedPill.title = isEn
        ? `lostark.bible saved your raid profile with a ${isSupport ? 'DPS' : 'support'} Enlightenment tree: Lost Ark only saves the Ark Passive tree when the character logs out. Its Battle Point is computed in that mode, so comparisons are skipped. Switch to your raid tree, log the character out, then update it on lostark.bible.`
        : `lostark.bible a enregistré ton profil raid avec un arbre d'Illumination ${isSupport ? 'DPS' : 'support'} : Lost Ark n'enregistre l'arbre d'Ark Passive qu'à la déconnexion du personnage. Son Battle Point est calculé dans ce mode, les comparaisons sont donc suspendues. Remets ton arbre de raid, déconnecte le personnage, puis mets-le à jour sur lostark.bible.`;
      dom.charCardMixedPill.hidden = false;
    } else if (p.rawProfile && p.rawProfile.battlePoint && p.rawProfile.battlePoint.rebuiltSupport) {
      // Profil raid enregistré en mode DPS mais gravures support : Battle Point recalculé en mode support
      dom.charCardMixedPill.innerHTML = isEn
        ? `<strong>Support Battle Point recalculated</strong> · saved Ark Passive tree out of date`
        : `<strong>Battle Point support recalculé</strong> · arbre d'Ark Passive enregistré périmé`;
      dom.charCardMixedPill.title = isEn
        ? `Lost Ark only saves the Ark Passive tree when the character logs out, so lostark.bible computed this raid profile in DPS mode. Your engravings are support ones: the app recalculated the Battle Point in support mode from your real gear, with the game's own table (checked identical on correct support profiles). Nothing to do on your side.`
        : `Lost Ark n'enregistre l'arbre d'Ark Passive qu'à la déconnexion du personnage : lostark.bible a donc calculé ce profil raid en mode DPS. Tes gravures sont celles d'un support : l'appli a recalculé le Battle Point en mode support à partir de ton vrai stuff, avec la table du jeu (vérifiée à l'identique sur des profils support corrects). Rien à faire de ton côté.`;
      dom.charCardMixedPill.hidden = false;
    } else if (hasIncompleteBattlePoint(p, isSupport ? 'support' : 'dps')) {
      dom.charCardMixedPill.innerHTML = isEn
        ? `<strong>Incomplete Battle Point</strong> · comparisons skipped`
        : `<strong>Battle Point incomplet</strong> · comparaisons suspendues`;
      dom.charCardMixedPill.title = isEn
        ? `The Battle Point parts lostark.bible gives for this raid profile do not add up to its Combat Power (some systems are missing, often the Ark Grid cores). The GPD still works on your gear, but system-by-system comparisons would be wrong. Update the character on lostark.bible.`
        : `Les parties du Battle Point données par lostark.bible pour ce profil raid ne reconstituent pas son Combat Power (des systèmes manquent, souvent les cœurs de la Grille d'Ark). Le GPD fonctionne toujours sur ton stuff, mais les comparaisons système par système seraient fausses. Mets le personnage à jour sur lostark.bible.`;
      dom.charCardMixedPill.hidden = false;
    } else {
      dom.charCardMixedPill.hidden = true;
    }
  }

  // Karma : obtenu en jeu, on affiche ce qu'il apporte au Battle Point
  if (dom.charCardKarmaPill) {
    const isEn = isEnLang();
    const karma = getKarmaBonus(p);
    if (karma) {
      const fmt = v => (isEn ? v.toFixed(2) : v.toFixed(2).replace('.', ','));
      dom.charCardKarmaPill.innerHTML = isEn
        ? `Karma · Evolution <strong>+${fmt(karma.evolution)}%</strong> · Leap <strong>+${fmt(karma.leap)}%</strong>`
        : `Karma · Évolution <strong>+${fmt(karma.evolution)} %</strong> · Bond <strong>+${fmt(karma.leap)} %</strong>`;
      dom.charCardKarmaPill.title = isEn
        ? 'Karma bonus read from the Battle Point. Karma comes from content, not gold: it is not ranked in the GPD.'
        : 'Bonus de Karma lu sur le Battle Point. Le Karma vient du contenu, pas de l\'or : il n\'est pas classé dans le GPD.';
      dom.charCardKarmaPill.hidden = false;
    } else {
      dom.charCardKarmaPill.hidden = true;
    }
  }

  // Mise à jour des 4 Cartes de Score de Profil (Loseii Style)
  updateProfileScoreCards(p, isSupport, isEnLang());
}

function updateProfileScoreCards(p, isSupport, isEn) {
  if (!p) return;
  const roleTagText = isSupport ? 'Support' : 'DPS';

  // Rôle tag des cartes
  [dom.scoreAccRoleTag, dom.scoreBrRoleTag, dom.scoreAgRoleTag].forEach(el => {
    if (el) {
      el.textContent = roleTagText;
      el.classList.toggle('support', isSupport);
      el.classList.toggle('dps', !isSupport);
    }
  });

  // --- 1. CARTE ACCESSOIRES ---
  if (dom.scoreCardAcc) {
    try {
      const accEval = evaluateCharacterAccessories(p, isSupport, isEn);
      const bonusPct = accEval ? (accEval.bonusPct || 0) : (isSupport ? 12.0 : 15.0);
      let accGrade = 'B';
      let gradeClass = 'grade-b';
      if (accEval && accEval.slotLines) {
        // Lignes lues : note sur la valeur réelle (pentes Arsonistic) rapportée au maximum du rôle
        const g = accessoryGrade(bonusPct, isSupport);
        accGrade = g.grade; gradeClass = g.cls;
      } else if (accEval) {
        // Presets sans lignes décodables : ancienne note par nombre de lignes
        if (accEval.highCount >= 10 && accEval.deadCount === 0) {
          accGrade = 'S+'; gradeClass = 'grade-s-plus';
        } else if (accEval.highCount >= 7) {
          accGrade = 'S'; gradeClass = 'grade-s';
        } else if (accEval.highCount >= 4) {
          accGrade = 'A+'; gradeClass = 'grade-a';
        } else if (accEval.highCount >= 2 || accEval.midCount >= 8) {
          accGrade = 'A'; gradeClass = 'grade-a';
        } else if (accEval.midCount >= 4) {
          accGrade = 'B+'; gradeClass = 'grade-b';
        } else if (accEval.midCount >= 1) {
          accGrade = 'B'; gradeClass = 'grade-b';
        } else {
          accGrade = 'C'; gradeClass = 'grade-c';
        }
      }
      if (dom.scoreAccGrade) {
        dom.scoreAccGrade.textContent = accGrade;
        dom.scoreAccGrade.className = 'score-grade-badge ' + gradeClass;
      }
      if (dom.scoreAccVal) {
        dom.scoreAccVal.textContent = `+${bonusPct.toFixed(2)}%`;
      }
      if (dom.scoreAccSub) {
        dom.scoreAccSub.textContent = isSupport 
          ? (isEn ? 'Exact Ally Buff' : 'Buff Allié Exact') 
          : (isEn ? 'Exact Damage' : 'Dégâts Exacts');
      }
      if (dom.scoreAccDetail) {
        if (accEval && (accEval.highCount > 0 || accEval.midCount > 0)) {
          const hStr = `${accEval.highCount} High`;
          const mStr = `${accEval.midCount} Mid`;
          const dStr = accEval.deadCount > 0 ? ` • ${accEval.deadCount} ${isEn ? 'Dead' : 'Morts'}` : '';
          const maxStr = accEval.slotLines
            ? ` • ${Math.round(accessoryGrade(bonusPct, isSupport).ratio * 100)}\u00a0%\u00a0${isEn ? 'of\u00a0max' : 'du\u00a0max'}`
            : '';
          dom.scoreAccDetail.textContent = `${hStr} • ${mStr}${dStr}${maxStr}`;
        } else {
          dom.scoreAccDetail.textContent = isEn ? '15/15 Rolls • Multiplicative' : '15/15 Rolls • Modèle Multiplicatif';
        }
      }
    } catch (err) {
      console.warn('Error updating acc score card:', err);
    }
  }

  // --- 2. CARTE BRACELET ---
  if (dom.scoreCardBracelet) {
    try {
      let brScore = '—';
      let brGrade = 'B-';
      let brPct = isSupport ? '+15.00% Buff' : '+10.20% Dmg';
      let brDetail = isEn ? 'Standard T4 Bracelet' : 'Bracelet T4 Standard';
      let customBg = null;
      let customFg = null;

      // Tenter le décodage exact Loseii
      const brItemObj = (p.bracelet)
        || (p.loadout && Array.isArray(p.loadout.items) && p.loadout.items.find(i => i.slot === 'bracelet'))
        || (p.rawProfile && p.rawProfile.loadout && Array.isArray(p.rawProfile.loadout.items) && p.rawProfile.loadout.items.find(i => i.slot === 'bracelet'))
        || (p.rawProfile && p.rawProfile.rawItems && p.rawProfile.rawItems.find(i => i.slot === 'bracelet'))
        || null;

      const brStats = (brItemObj && brItemObj.data && Array.isArray(brItemObj.data.stats) && brItemObj.data.stats)
        || (p.rawProfile && p.rawProfile.bracelet && Array.isArray(p.rawProfile.bracelet.stats) && p.rawProfile.bracelet.stats)
        || (p.bracelet && Array.isArray(p.bracelet.stats) && p.bracelet.stats)
        || null;

      if (typeof window.Bracelet !== 'undefined' && typeof window.Subrank !== 'undefined' && brStats) {
        try {
          const TRAIT_TO_APP = { crit: "crit", spec: "spec", swiftness: "swift" };
          const dec = window.Bracelet.decodeBibleBracelet(brStats);
          const traits = { crit: 0, spec: 0, swift: 0 };
          const lines = [];
          const traitParts = [];
          for (let i = 0; i < (dec.lines || []).length; i++) {
            const l = dec.lines[i];
            const key = TRAIT_TO_APP[l.family];
            if (l.cat === "trait" && key) {
              traits[key] = l.value;
              const traitName = key === "swift" ? "Swift" : (key === "spec" ? "Spec" : "Crit");
              traitParts.push(`${traitName} ${l.value}`);
            } else {
              lines.push(l);
            }
          }
          const normProf = window.Bracelet.normalizeProfile({ role: isSupport ? 'support' : 'dps' });
          const sc = window.Subrank.braceletScore({
            grade: dec.grade || 'ancient',
            lines: lines,
            traits: traits,
            profile: normProf
          });
          if (sc && sc.band) {
            brGrade = sc.band.key;
            brScore = sc.score.toFixed(1);
            brPct = `+${sc.damagePct.toFixed(2)}% ${isSupport ? (isEn ? 'Buff' : 'Buff') : (isEn ? 'Dmg' : 'Dégâts')}`;
            customBg = sc.band.bg;
            customFg = sc.band.fg;

            const traitStr = traitParts.join(' / ');
            const linesCount = lines.length;
            brDetail = traitStr ? `${traitStr} • ${linesCount} lines` : (isEn ? `${linesCount} effect lines` : `${linesCount} lignes d'effets`);
          }
        } catch (e) {
          console.warn('Subrank score failed, fallback to diag:', e);
        }
      }

      // Fallback avec evaluateBracelet
      if (brScore === '—') {
        const brDiag = evaluateBracelet(p, isEn);
        if (brDiag) {
          brGrade = brDiag.tier === 's' ? 'S' : (brDiag.tier === 'a' ? 'A' : (brDiag.tier === 'b' ? 'B' : 'C'));
          brScore = brDiag.efficiency ? (brDiag.efficiency * 5).toFixed(1) : '60.0';
          brPct = `+${(brDiag.efficiency || 10).toFixed(2)}% ${isSupport ? 'Buff' : (isEn ? 'Dmg' : 'Dégâts')}`;
          brDetail = brDiag.ratingDesc || (isEn ? 'Transitional Setup' : 'Rolls de transition');
        }
      }

      if (dom.scoreBrGrade) {
        dom.scoreBrGrade.textContent = brGrade;
        if (customBg) {
          dom.scoreBrGrade.className = 'score-grade-badge';
          dom.scoreBrGrade.style.backgroundColor = customBg;
          dom.scoreBrGrade.style.color = customFg || '#E8E6DC';
        } else {
          dom.scoreBrGrade.style.backgroundColor = '';
          dom.scoreBrGrade.style.color = '';
          dom.scoreBrGrade.className = 'score-grade-badge ' + (brGrade.startsWith('S') ? 'grade-s' : (brGrade.startsWith('A') ? 'grade-a' : 'grade-b'));
        }
      }
      // Même chiffre que le Benchmark : contribution officielle au CP (battlePoint 19-21).
      // La note Subrank reste (qualité pour les dégâts) ; son % inclut les traits, d'où le détail séparé.
      try {
        const brSys = extractPlayerSystems(p, isEn).bracelet;
        if (brSys && brSys.fromBattlePoint) {
          const subrankPct = brPct && brPct !== '—' ? brPct.split(' ')[0] : '';
          brPct = `+${brSys.bonusPct.toFixed(2)}% CP`;
          if (subrankPct) {
            brDetail = `${brDetail ? brDetail + ' • ' : ''}${isEn ? `Subrank ${subrankPct} dmg (traits incl.)` : `Subrank ${subrankPct} dégâts (traits inclus)`}`;
          }
        }
      } catch (e) {}
      // Bracelets obtenus en jeu : part de ceux qui battraient l'actuel après une campagne de rerolls optimale
      const brEv = getBraceletRerollEstimate(p, isSupport);
      if (brEv) {
        const pct = (Math.round(brEv.pBeat * 1000) / 10).toString();
        brDetail = `${brDetail ? brDetail + ' • ' : ''}${isEn ? `${pct}% of new bracelets beat it` : `${pct.replace('.', ',')} % des nouveaux bracelets font mieux`}`;
      }
      if (dom.scoreBrScore) dom.scoreBrScore.textContent = brScore;
      if (dom.scoreBrPct) dom.scoreBrPct.textContent = brPct;
      if (dom.scoreBrDetail) dom.scoreBrDetail.textContent = brDetail;
    } catch (err) {
      console.warn('Error updating bracelet score card:', err);
    }
  }

  // --- 3. CARTE ASTROGEMMES ---
  if (dom.scoreCardAstro) {
    try {
      let astroBonusPct = 0;
      const allBpParts = (p.rawProfile && p.rawProfile.battlePoint && Array.isArray(p.rawProfile.battlePoint.parts))
        ? p.rawProfile.battlePoint.parts
        : [];
      const bpParts = (p.astrogems && p.astrogems.length > 0)
        ? p.astrogems
        : (allBpParts.length > 0 ? allBpParts.filter(x => x.type === 31 || x.type === 32) : []);
      if (Array.isArray(bpParts) && bpParts.length > 0) {
        const sumVal = bpParts.reduce((s, x) => s + (('value' in x ? x.value : x.min) || 0), 0);
        astroBonusPct = Number((sumVal / 100).toFixed(2));
      }
      if (!astroBonusPct) {
        astroBonusPct = isSupport ? 3.50 : 7.92;
      }

      // Note de Loseii (astrogem.js) : moyenne des gemmes taillées, même note que la ligne astrogemmes du GPD.
      // Sans le modèle (pas encore chargé, gemmes illisibles) : estimation d'après le % du Battle Point.
      const grid = astrogemGridBand(p, isSupport);
      const calcGrade = grid ? grid.mean : Math.min(99.9, Math.max(50.0, 60.0 + (astroBonusPct / 12.0) * 36.1));
      const agScoreStr = calcGrade.toFixed(1);

      const ladder = [
        ["S+", 96.1, "grade-s-plus", "#E0A43A"],
        ["S", 93.3, "grade-s", "#2A2B24"],
        ["S-", 90.0, "grade-s", "#2A2B24"],
        ["A+", 86.7, "grade-a", "#CFCBBD"],
        ["A", 83.3, "grade-a", "#CFCBBD"],
        ["A-", 80.0, "grade-a", "#CFCBBD"],
        ["B+", 76.7, "grade-b", "#2A2B24"],
        ["B", 73.3, "grade-b", "#2A2B24"],
        ["B-", 70.0, "grade-b", "#2A2B24"],
        ["C+", 66.7, "grade-c", "#8CC084"],
        ["C", 63.3, "grade-c", "#8CC084"],
        ["C-", 60.0, "grade-c", "#8CC084"],
        ["D", 50.0, "grade-d", "#6A675C"]
      ];

      let agLetter = "B+";
      let agClass = "grade-b";
      let agColor = "#2A2B24";
      for (const [r, cut, cls, col] of ladder) {
        if (grid ? r === grid.band : calcGrade >= cut) {
          agLetter = r;
          agClass = cls;
          agColor = col;
          break;
        }
      }

      // Notes de Loseii sous D (D-, F…) : absentes de l'échelle de couleurs, badge D
      if (grid && grid.band !== agLetter) { agLetter = grid.band; agClass = 'grade-d'; agColor = '#6A675C'; }
      if (dom.scoreAgGrade) {
        dom.scoreAgGrade.textContent = agLetter;
        dom.scoreAgGrade.className = 'score-grade-badge ' + agClass;
        dom.scoreAgGrade.style.backgroundColor = agColor;
        dom.scoreAgGrade.style.color = '#E8E6DC';
      }
      if (dom.scoreAgScore) dom.scoreAgScore.textContent = agScoreStr;
      if (dom.scoreAgPct) {
        dom.scoreAgPct.textContent = `+${astroBonusPct.toFixed(2)}% ${isSupport ? (isEn ? 'Party Buff' : 'Buff Groupe') : (isEn ? 'Grid Dmg' : 'Grille Dmg')}`;
      }
      if (dom.scoreAgDetail) {
        dom.scoreAgDetail.textContent = grid
          ? (isEn ? `Mean of ${grid.n} cut gems (Loseii grade) • Ark Grid` : `Moyenne des ${grid.n} gemmes taillées (note Loseii) • Grille d'Ark`)
          : (isEn ? 'Cut gems • Ark Grid (grade estimated)' : 'Gemmes taillées • Grille d\'Ark (note estimée)');
      }
    } catch (err) {
      console.warn('Error updating astrogems score card:', err);
    }
  }

  // --- 4. CARTE PROCHAIN +1% (GPD) ---
  if (dom.scoreCardGpd) {
    try {
      const dynGpd = getDynamicGpdTable(p, p.role || state.role, isEn);
      if (dynGpd && dynGpd.length > 0) {
        const best = dynGpd[0];
        if (dom.scoreGpdPrice) dom.scoreGpdPrice.textContent = best.ratioText;
        if (dom.scoreGpdPer) {
          dom.scoreGpdPer.textContent = isSupport
            ? (isEn ? 'per 0.01% Ally Buff' : 'par 0.01% Buff Allié')
            : (isEn ? 'per 1% Damage' : 'par 1% Dégâts');
        }
        if (dom.scoreGpdDetail) {
          dom.scoreGpdDetail.textContent = `${best.name} (${best.gainText})`;
        }
      }
    } catch (err) {
      console.warn('Error updating gpd score card:', err);
    }
  }
}

function renderPresetsBar() {
  if (!dom.presetsList) return;
  const list = getActiveRosterList();

  const isEn = isEnLang();
  if (dom.presetsTitle) {
    dom.presetsTitle.textContent = isEn ? 'My Roster:' : 'Mon Roster :';
  }
  if (dom.rosterStatusBadge) {
    dom.rosterStatusBadge.textContent = isEn ? `Synced (${list.length})` : `Synchronisé (${list.length})`;
    dom.rosterStatusBadge.className = 'roster-status-badge custom';
  }
  if (dom.btnManageRoster) {
    dom.btnManageRoster.style.display = list.length ? 'inline-flex' : 'none';
  }
  if (dom.rosterCountTag) {
    dom.rosterCountTag.textContent = list.length.toString();
  }
  if (dom.btnSyncRosterNav) {
    dom.btnSyncRosterNav.innerHTML = list.length
      ? (isEn ? '<span>+</span> <strong>Add character</strong>' : '<span>+</span> <strong>Ajouter un perso</strong>')
      : (isEn ? '<strong>Import my character</strong>' : '<strong>Importer mon personnage</strong>');
  }

  let html = '';
  list.forEach(c => {
    const cId = escapeHtml(c.id || c.name.toLowerCase());
    const isActive = (c.id || c.name.toLowerCase()) === activeCharacterId;
    const classIconSrc = escapeHtml(getClassIconUrl(c.className, c.role));
    const faceAvatar = escapeHtml(getCharacterFaceAvatar(c));
    const isFull = isFullBodyAgsAvatar(faceAvatar);
    const safeName = escapeHtml(c.name);
    const safeClass = escapeHtml(c.className || 'Classe');
    const safeRole = escapeHtml(c.role || 'dps');

    html += `
        <button type="button" class="preset-chip ${isActive ? 'active' : ''}" data-id="${cId}" data-role="${safeRole}" title="${safeClass} • ${safeName}">
          <span class="chip-avatar-frame">
            <img class="chip-avatar-mini ${isFull ? 'ags-fullbody-zoom' : ''}" id="chipAvatar_${cId}" src="${faceAvatar}" alt="${safeName}" width="22" height="22" loading="eager" data-fallback="${classIconSrc}">
          </span>
          <span>${safeName} (${(c.ilvl || 1750).toFixed(1)})</span>
        </button>
      `;
  });

  dom.presetsList.innerHTML = html;

  dom.presetsList.querySelectorAll('.preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const targetChar = list.find(x => (x.id || x.name.toLowerCase()) === id);
      if (targetChar) loadCharacter(targetChar);
    });
  });
}

function loadCharacter(c) {
  if (!c) return;
  hideNoCharacterState();
  const cId = (c.id || c.name.toLowerCase());
  activeCharacterId = cId;
  loadedCharacter = c;
  // Personnage actif retenu d'une visite à l'autre (main.js le recharge)
  try { lsSet('lostark_active_char', cId); } catch (e) {}

  if (dom.presetsList) {
    dom.presetsList.querySelectorAll('.preset-chip').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-id') === cId);
    });
  }

  const resolvedRole = detectCharacterRole(c);
  c.role = resolvedRole;
  state.role = resolvedRole;
  state.currentIlvl = c.ilvl || 1750;
  state.currentCp = c.cp || 3500;
  state.targetIlvl = c.target || (Math.ceil((state.currentIlvl + 0.1) / 10) * 10);
  state.advHoning = c.advHoning !== undefined ? c.advHoning : 40;
  state.gear = c.gear ? { ...c.gear } : { weapon: 17, head: 15, shoulder: 15, chest: 15, pants: 15, gloves: 15 };
  state.baselineGear = { ...state.gear };
  state.baselineAdvHoning = state.advHoning;
  state.baselineIlvl = state.currentIlvl;
  state.baselineCp = state.currentCp;
  state.gemBonus = 0;
  if (dom.gemSelect) {
    dom.gemSelect.value = 'current';
    updateGemSelectOptions();
  }

  if (!c.gemParts || c.gemParts.length === 0) {
    const gParts = extractCharacterGemParts(c);
    if (gParts && gParts.length > 0) c.gemParts = gParts;
  }

  activeCanonicalKey = cId;
  liveImportedProfile = c.rawProfile || null;

  state.predictionMode = 'honing';
  const btnPredHoning = document.getElementById('btnPredModeHoning');
  const btnPredGlobal = document.getElementById('btnPredModeGlobal');
  if (btnPredHoning && btnPredGlobal) {
    btnPredHoning.classList.add('active');
    btnPredGlobal.classList.remove('active');
  }

  setRole(resolvedRole);
  if (dom.advHoningSelect) dom.advHoningSelect.value = state.advHoning.toString();

  updatePredictorView();
  updateHoningView();
  updateOptimizationView();
  renderCanonicalView();
  renderAdvisorView();

  // Ark Passive : relu sur le Battle Point du personnage chargé
  arkPassiveState.model = null;
  updateArkPassiveView();

  updateTargetButtons();
  updateTargetButtonsState();
  updateActiveCharacterCard(cId, c);
  benchmarkState.customTarget = null;
  benchmarkState.currentTargetId = null;

  const benchPane = document.getElementById('tab-benchmark');
  if (benchPane && benchPane.classList.contains('active')) {
    renderBenchmarkTab();
  }
}

function loadPreset(key) {
  const list = getActiveRosterList();
  const found = list.find(x => (x.id || x.name.toLowerCase()) === key.toLowerCase());
  if (found) loadCharacter(found);
}
