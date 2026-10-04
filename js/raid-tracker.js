// Suivi des raids de la semaine.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// ==========================================
// MODULE : WEEKLY RAID & GOLD REVENUE TRACKER
// ==========================================



const RAID_TRACKER_STORAGE_KEY = 'lostark_raid_tracker_state_v2';
let raidTrackerState = {
  agentStatus: 'checking',
  lastSyncTimestamp: null,
  roster: {}
};

function getLastWednesdayReset() {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = (day >= 3 ? day - 3 : day + 4);
  const reset = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff, 10, 0, 0, 0));
  if (d.getTime() < reset.getTime()) {
    reset.setUTCDate(reset.getUTCDate() - 7);
  }
  return reset;
}

function getNextWednesdayReset() {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = (3 - day + 7) % 7;
  const cand = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff, 10, 0, 0, 0));
  if (cand.getTime() <= d.getTime()) {
    cand.setUTCDate(cand.getUTCDate() + 7);
  }
  return cand;
}

function getDefaultModeForIlvl(raidKey, ilvl) {
  const lvl = typeof ilvl === 'number' ? ilvl : parseFloat(ilvl) || 1700;
  if (raidKey === 'horizon_cathedral') {
    if (lvl >= 1770) return 'nightmare';
    return 'hard'; // Level 2
  }
  if (raidKey === 'serca') {
    return 'hard';
  }
  if (raidKey === 'final_act_kazeros') {
    return 'normal';
  }
  return 'normal';
}

function getRaidCharacterAvatar(ch) {
  return getCharacterFaceAvatar(ch);
}

function formatClearTime(epochMs) {
  if (!epochMs) return '';
  try {
    const d = new Date(epochMs);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${mins}`;
  } catch (e) {
    return '';
  }
}

function ensureCharacterRaidState(charKey, charIlvl) {
  if (!raidTrackerState.roster[charKey]) {
    raidTrackerState.roster[charKey] = { raids: {} };
  }
  const cObj = raidTrackerState.roster[charKey];
  Object.keys(RAID_DEFINITIONS).forEach(rKey => {
    if (!cObj.raids[rKey]) {
      const defaultMode = getDefaultModeForIlvl(rKey, charIlvl);
      cObj.raids[rKey] = {
        mode: defaultMode,
        modeAuto: false,
        g1: false,
        g2: false,
        chest: false,
        g1Time: null,
        g2Time: null,
        g1Boss: null,
        g2Boss: null
      };
    }
  });
}

function saveRaidTrackerState() {
  try {
    raidTrackerState.resetTimestamp = getLastWednesdayReset().getTime();
    localStorage.setItem(RAID_TRACKER_STORAGE_KEY, JSON.stringify(raidTrackerState));
  } catch (e) {}
}

function loadSavedRaidTrackerState() {
  try {
    const raw = localStorage.getItem(RAID_TRACKER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const lastReset = getLastWednesdayReset().getTime();
      if (parsed.resetTimestamp && parsed.resetTimestamp < lastReset) {
        Object.values(parsed.roster || {}).forEach(ch => {
          Object.values(ch.raids || {}).forEach(r => {
            r.g1 = false;
            r.g2 = false;
            r.g1Time = null;
            r.g2Time = null;
          });
        });
        parsed.resetTimestamp = lastReset;
      }
      raidTrackerState = Object.assign(raidTrackerState, parsed);
      raidTrackerState.agentStatus = 'checking';
    }
  } catch (e) {}
}

function fetchWithTimeout(url, opts = {}, timeoutMs = 800) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, opts);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, Object.assign({}, opts, { signal: controller.signal }))
    .then(res => { clearTimeout(timer); return res; })
    .catch(err => { clearTimeout(timer); throw err; });
}

async function fetchRaidTrackerStatus(isManual = false) {
  const pill = document.getElementById('raidAgentStatusPill');
  const pillText = document.getElementById('raidAgentStatusText');
  const refreshBtn = document.getElementById('btnRefreshRaidsSync');

  if (refreshBtn && isManual) {
    refreshBtn.style.opacity = '0.6';
    refreshBtn.style.pointerEvents = 'none';
  }

  let activeChars = [];
  try {
    const activeList = typeof getActiveRosterList === 'function' ? getActiveRosterList() : [];
    activeChars = (activeList || []).map(c => c && c.name).filter(Boolean);
  } catch (e) {}
  const queryParam = activeChars.length ? '?chars=' + encodeURIComponent(activeChars.join(',')) : '';

  let fetchedData = null;
  let source = 'none';

  // 1. Récupération immédiate du JSON synchronisé sur le serveur distant (HTTPS, zéro latence, infaillible)
  try {
    const srvRes = await fetchWithTimeout('data/raid_status.json?t=' + Date.now(), { cache: 'no-store' }, 2000);
    if (srvRes && srvRes.ok) {
      const srvData = await srvRes.json();
      const isFresh = (Date.now() - (srvData.updatedAt || 0)) < 300000;
      fetchedData = srvData;
      source = isFresh ? 'server_fresh' : 'server_stale';
    }
  } catch (e) {}

  // 2. Sondage direct en tâche de fond sur l'agent local (127.0.0.1:4848) si disponible
  try {
    const locRes = await fetchWithTimeout(`http://127.0.0.1:4848/api/raid-status${queryParam}`, {}, 700);
    if (locRes && locRes.ok) {
      const locData = await locRes.json();
      if (locData && locData.roster) {
        fetchedData = locData;
        source = 'local';
      }
    }
  } catch (e) {}

  if (fetchedData && fetchedData.roster) {
    const isLive = (source === 'local') || (source === 'server_fresh');
    raidTrackerState.agentStatus = isLive ? 'online' : 'offline';
    raidTrackerState.lastSyncTimestamp = fetchedData.updatedAt || Date.now();

    try {
      if (!raidTrackerState.roster || typeof raidTrackerState.roster !== 'object') {
        raidTrackerState.roster = {};
      }

      Object.entries(fetchedData.roster).forEach(([cKey, cData]) => {
        if (!cData) return;
        if (!raidTrackerState.roster[cKey] || typeof raidTrackerState.roster[cKey] !== 'object') {
          raidTrackerState.roster[cKey] = { raids: {} };
        }
        const localChar = raidTrackerState.roster[cKey];
        if (!localChar.raids || typeof localChar.raids !== 'object') {
          localChar.raids = {};
        }

        Object.entries(cData.raids || {}).forEach(([rKey, rData]) => {
          if (!rData) return;
          if (!localChar.raids[rKey]) {
            localChar.raids[rKey] = {
              mode: rData.mode || 'normal',
              modeAuto: !!rData.modeAuto,
              g1: false,
              g2: false,
              chest: false,
              g1Time: null,
              g2Time: null
            };
          }
          const lr = localChar.raids[rKey];
          if (rData.mode) {
            lr.mode = rData.mode;
            lr.modeAuto = true;
          }
          lr.g1 = !!rData.g1;
          lr.g1Time = rData.g1 ? rData.g1Time : null;
          lr.g1Boss = rData.g1 ? rData.g1Boss : null;
          lr.g2 = !!rData.g2;
          lr.g2Time = rData.g2 ? rData.g2Time : null;
          lr.g2Boss = rData.g2 ? rData.g2Boss : null;
        });
      });

      saveRaidTrackerState();
    } catch (mergeErr) {
      console.warn('Roster merge error:', mergeErr);
    }
  } else {
    raidTrackerState.agentStatus = 'offline';
  }

  if (pill && pillText) {
    const isOnline = raidTrackerState.agentStatus === 'online';
    pill.className = 'agent-status-pill ' + (isOnline ? 'online' : 'offline');
    const langKey = isOnline ? 'raid_agent_online' : 'raid_agent_offline';
    pillText.textContent = (window.i18n && window.i18n.t(langKey)) || (isOnline ? 'Agent Connecté (Temps Réel)' : 'Agent Non Détecté (Mode Cache)');
  }

  if (refreshBtn && isManual) {
    refreshBtn.style.opacity = '1';
    refreshBtn.style.pointerEvents = 'auto';
  }

  renderRaidTrackerView();
}

function toggleGate(cKey, rKey, gate) {
  if (!raidTrackerState.roster[cKey] || !raidTrackerState.roster[cKey].raids[rKey]) return;
  const cr = raidTrackerState.roster[cKey].raids[rKey];
  if (gate === '1') {
    cr.g1 = !cr.g1;
    cr.g1Time = cr.g1 ? Date.now() : null;
  } else if (gate === '2') {
    cr.g2 = !cr.g2;
    cr.g2Time = cr.g2 ? Date.now() : null;
  }
  saveRaidTrackerState();
  renderRaidTrackerView();
}

function setRaidMode(cKey, rKey, mode) {
  if (!raidTrackerState.roster[cKey] || !raidTrackerState.roster[cKey].raids[rKey]) return;
  raidTrackerState.roster[cKey].raids[rKey].mode = mode;
  raidTrackerState.roster[cKey].raids[rKey].modeAuto = false;
  saveRaidTrackerState();
  renderRaidTrackerView();
}

function cycleRaidMode(cKey, rKey) {
  if (!raidTrackerState.roster[cKey] || !raidTrackerState.roster[cKey].raids[rKey]) return;
  const cr = raidTrackerState.roster[cKey].raids[rKey];
  const order = ['normal', 'hard', 'nightmare'];
  const currentIdx = order.indexOf(cr.mode || 'normal');
  const nextMode = order[(currentIdx + 1) % order.length];
  cr.mode = nextMode;
  cr.modeAuto = false;
  saveRaidTrackerState();
  renderRaidTrackerView();
}

function toggleAllCharacterGates(cKey) {
  if (!raidTrackerState.roster[cKey]) return;
  const cObj = raidTrackerState.roster[cKey];
  let allDone = true;
  Object.keys(RAID_DEFINITIONS).forEach(rKey => {
    const cr = cObj.raids[rKey];
    if (!cr || !cr.g1 || !cr.g2) allDone = false;
  });

  const targetDone = !allDone;
  const now = Date.now();
  Object.keys(RAID_DEFINITIONS).forEach(rKey => {
    if (!cObj.raids[rKey]) cObj.raids[rKey] = { mode: 'normal', g1: false, g2: false, chest: false };
    const cr = cObj.raids[rKey];
    cr.g1 = targetDone;
    cr.g1Time = targetDone ? (cr.g1Time || now) : null;
    cr.g2 = targetDone;
    cr.g2Time = targetDone ? (cr.g2Time || now) : null;
  });
  saveRaidTrackerState();
  renderRaidTrackerView();
}

function toggleAllCharacterChests(cKey) {
  if (!raidTrackerState.roster[cKey]) return;
  const cObj = raidTrackerState.roster[cKey];
  let allChests = true;
  Object.keys(RAID_DEFINITIONS).forEach(rKey => {
    const cr = cObj.raids[rKey];
    if (!cr || !cr.chest) allChests = false;
  });

  const targetChest = !allChests;
  Object.keys(RAID_DEFINITIONS).forEach(rKey => {
    if (!cObj.raids[rKey]) cObj.raids[rKey] = { mode: 'normal', g1: false, g2: false, chest: false };
    cObj.raids[rKey].chest = targetChest;
  });
  saveRaidTrackerState();
  renderRaidTrackerView();
}

function toggleAllRosterGates() {
  const rosterList = getActiveRosterList();
  let allAccountDone = true;
  rosterList.forEach(ch => {
    const cKey = (ch.id || ch.name).toLowerCase();
    const cObj = raidTrackerState.roster[cKey];
    if (!cObj) { allAccountDone = false; return; }
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      const cr = cObj.raids[rKey];
      if (!cr || !cr.g1 || !cr.g2) allAccountDone = false;
    });
  });

  const targetDone = !allAccountDone;
  const now = Date.now();
  rosterList.forEach(ch => {
    const cKey = (ch.id || ch.name).toLowerCase();
    ensureCharacterRaidState(cKey, ch.ilvl);
    const cObj = raidTrackerState.roster[cKey];
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      const cr = cObj.raids[rKey];
      cr.g1 = targetDone;
      cr.g1Time = targetDone ? (cr.g1Time || now) : null;
      cr.g2 = targetDone;
      cr.g2Time = targetDone ? (cr.g2Time || now) : null;
    });
  });
  saveRaidTrackerState();
  renderRaidTrackerView();
}

function toggleAllRosterChests() {
  const rosterList = getActiveRosterList();
  let allAccountChests = true;
  rosterList.forEach(ch => {
    const cKey = (ch.id || ch.name).toLowerCase();
    const cObj = raidTrackerState.roster[cKey];
    if (!cObj) { allAccountChests = false; return; }
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      const cr = cObj.raids[rKey];
      if (!cr || !cr.chest) allAccountChests = false;
    });
  });

  const targetChest = !allAccountChests;
  rosterList.forEach(ch => {
    const cKey = (ch.id || ch.name).toLowerCase();
    ensureCharacterRaidState(cKey, ch.ilvl);
    const cObj = raidTrackerState.roster[cKey];
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      cObj.raids[rKey].chest = targetChest;
    });
  });
  saveRaidTrackerState();
  renderRaidTrackerView();
}

function setRaidChest(cKey, rKey, checked) {
  if (!raidTrackerState.roster[cKey] || !raidTrackerState.roster[cKey].raids[rKey]) return;
  raidTrackerState.roster[cKey].raids[rKey].chest = checked;
  saveRaidTrackerState();
  renderRaidTrackerView();
}

function updateRaidResetCountdown() {
  const el = document.getElementById('raidResetCountdownVal');
  if (!el) return;

  const lang = (window.i18n && window.i18n.getLang()) || 'fr';
  const isFr = lang === 'fr';

  const next = getNextWednesdayReset();
  const diffMs = next.getTime() - Date.now();
  if (diffMs <= 0) {
    el.textContent = isFr ? '0j 0h 0m' : '0d 0h 0m';
    return;
  }

  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);

  const dUnit = isFr ? 'j' : 'd';
  el.textContent = `${days}${dUnit} ${hours}h ${mins}m`;
}

function renderRaidTrackerView() {
  const grid = document.getElementById('rosterRaidsGrid');
  if (!grid) return;

  const t = (window.i18n && window.i18n.t) || (k => k);
  const lang = (window.i18n && window.i18n.getLang()) || 'fr';
  const isFr = lang === 'fr';

  const rosterList = getActiveRosterList();

  let totalAccountEarnedGold = 0;
  let totalAccountPotentialGold = 0;
  let totalAccountChestCost = 0;
  let totalClearedGates = 0;
  let totalCompletedRaids = 0;
  const totalMaxRaids = rosterList.length * 3;
  const totalMaxGates = totalMaxRaids * 2;

  rosterList.forEach(ch => {
    const cKey = (ch.id || ch.name).toLowerCase();
    ensureCharacterRaidState(cKey, ch.ilvl);
  });

  const existingCards = grid.querySelectorAll('.char-raid-card');
  const needsFullBuild = existingCards.length !== rosterList.length;

  if (needsFullBuild) {
    let html = '';
    rosterList.forEach(ch => {
      const cKey = (ch.id || ch.name).toLowerCase();
      const charState = raidTrackerState.roster[cKey] || { raids: {} };
      const avatarUrl = getRaidCharacterAvatar(ch);
      const isFullBody = isFullBodyAgsAvatar(avatarUrl);
      const isSupp = ch.role === 'support' || (ch.className && ['Paladin', 'Bard', 'Artist'].includes(ch.className));
      const isDemo = Object.prototype.hasOwnProperty.call(FACE_AVATARS, cKey);
      const classIconFallback = getClassIconUrl(ch.className, ch.role);
      const fallbackFace = isDemo ? FACE_AVATARS[cKey] : classIconFallback;

      html += `
          <div class="char-raid-card" data-char="${escapeHtml(cKey)}">
            <div class="char-raid-card-header">
              <div class="char-meta-left">
                <div class="char-raid-avatar-frame ${isSupp ? 'role-support' : 'role-dps'}">
                  <img class="char-raid-avatar ${isFullBody ? 'ags-fullbody-zoom' : ''}" src="${escapeHtml(avatarUrl)}" data-fallback="${escapeHtml(fallbackFace)}" alt="${escapeHtml(ch.name)}" width="44" height="44" loading="eager">
                </div>
                <div class="char-info-col">
                  <div class="char-raid-name-row">
                    <span class="char-raid-name">${escapeHtml(ch.name)}</span>
                    <span class="char-server-badge">[${escapeHtml(ch.server || 'CE')}]</span>
                  </div>
                  <div class="char-raid-sub">
                    <span class="char-class-txt">${escapeHtml(ch.className || '')}</span>
                    <span class="char-sep">•</span>
                    <span class="char-raid-ilvl">${(ch.ilvl || 1700).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div class="char-header-right">
                <div class="char-quick-actions">
                  <button type="button" class="char-action-btn btn-char-clear-all" data-char="${escapeHtml(cKey)}" title="${isFr ? 'Valider ou réinitialiser tous les raids de ce personnage' : 'Toggle all raids cleared for this character'}">
                    ✓
                  </button>
                  <button type="button" class="char-action-btn btn-char-chests-all" data-char="${escapeHtml(cKey)}" title="${isFr ? 'Acheter ou retirer tous les coffres de ce personnage' : 'Toggle all chests for this character'}">
                   
                  </button>
                </div>
                <div class="char-raid-gold-badge">
                  <span class="char-gold-cur">0</span>
                  <span class="char-gold-sep">/</span>
                  <span class="char-gold-max">0 g</span>
                </div>
              </div>
            </div>

            <!-- Mini barre de progression d'or du perso -->
            <div class="char-progress-track">
              <div class="char-progress-bar" style="width: 0%;"></div>
            </div>

            <!-- Chips des 3 Raids -->
            <div class="char-raids-list">
        `;

      Object.keys(RAID_DEFINITIONS).forEach(rKey => {
        const raidDef = RAID_DEFINITIONS[rKey];
        const cr = charState.raids[rKey] || { mode: 'normal', g1: false, g2: false, chest: false };
        const mode = cr.mode || 'normal';
        const modeDef = (raidDef && raidDef[mode]) || raidDef.normal;
        const chestCost = modeDef.chest;
        const raidArtUrl = raidDef.image || `images/raids/${rKey}.webp`;
        const modeShort = mode === 'nightmare' ? 'NM' : (mode === 'hard' ? 'HM' : 'N');

        html += `
            <div class="raid-chip" data-char="${escapeHtml(cKey)}" data-raid="${rKey}">
              <img class="raid-chip-art" src="${raidArtUrl}" alt="" loading="lazy">

              <div class="raid-chip-top">
                <div class="raid-chip-identity">
                  <span class="raid-chip-icon">${raidDef.icon}</span>
                  <span class="raid-chip-name" title="${raidDef.bosses}">${t(raidDef.nameKey) || raidDef.fallbackName}</span>
                </div>

                <div class="raid-diff-badge-wrapper">
                  <button type="button" class="raid-diff-pill diff-${mode}" data-char="${escapeHtml(cKey)}" data-raid="${rKey}" title="${isFr ? 'Cliquer pour changer de difficulté' : 'Click to cycle difficulty'}">
                    <span class="diff-short">${modeShort}</span>
                    <span class="diff-gold">(${(modeDef.total / 1000).toFixed(0)}k)</span>
                    ${cr.modeAuto ? '<span class="diff-auto-dot" title="Auto LOA Logs">●</span>' : ''}
                  </button>
                </div>

                <div class="raid-chip-gold">
                  +${modeDef.total.toLocaleString()} g
                </div>
              </div>

              <div class="raid-chip-controls">
                <div class="gate-pips-group">
                  <button type="button" class="gate-pip ${cr.g1 ? 'cleared' : ''}" data-char="${escapeHtml(cKey)}" data-raid="${rKey}" data-gate="1">
                    <span class="gate-pip-lbl">${cr.g1 ? '✓ ' : ''}${isFr ? 'P1' : 'G1'}</span>
                    <span class="gate-pip-reward">+${(modeDef.g1 / 1000).toFixed(1).replace('.0', '')}k</span>
                  </button>
                  <button type="button" class="gate-pip ${cr.g2 ? 'cleared' : ''}" data-char="${escapeHtml(cKey)}" data-raid="${rKey}" data-gate="2">
                    <span class="gate-pip-lbl">${cr.g2 ? '✓ ' : ''}${isFr ? 'P2' : 'G2'}</span>
                    <span class="gate-pip-reward">+${(modeDef.g2 / 1000).toFixed(1).replace('.0', '')}k</span>
                  </button>
                </div>

                <button type="button" class="chest-toggle-pill ${cr.chest ? 'active' : ''}" data-char="${escapeHtml(cKey)}" data-raid="${rKey}" title="${t('raid_chest_label').replace('{cost}', (chestCost / 1000).toFixed(1).replace('.0', '') + 'k')}">
                  <span class="chest-icon"></span>
                  <span class="chest-cost">-${(chestCost / 1000).toFixed(1).replace('.0', '')}k</span>
                </button>
              </div>
            </div>
          `;
      });

      html += `
            </div>
          </div>
        `;
    });

    grid.innerHTML = html;

    // Listeners interactifs
    grid.querySelectorAll('.gate-pip').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const cKey = pill.getAttribute('data-char');
        const rKey = pill.getAttribute('data-raid');
        const gate = pill.getAttribute('data-gate');
        toggleGate(cKey, rKey, gate);
      });
    });

    grid.querySelectorAll('.raid-diff-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cKey = btn.getAttribute('data-char');
        const rKey = btn.getAttribute('data-raid');
        cycleRaidMode(cKey, rKey);
      });
    });

    grid.querySelectorAll('.chest-toggle-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cKey = btn.getAttribute('data-char');
        const rKey = btn.getAttribute('data-raid');
        const cr = (raidTrackerState.roster[cKey] && raidTrackerState.roster[cKey].raids[rKey]) || {};
        setRaidChest(cKey, rKey, !cr.chest);
      });
    });

    grid.querySelectorAll('.btn-char-clear-all').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cKey = btn.getAttribute('data-char');
        toggleAllCharacterGates(cKey);
      });
    });

    grid.querySelectorAll('.btn-char-chests-all').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cKey = btn.getAttribute('data-char');
        toggleAllCharacterChests(cKey);
      });
    });
  }

  // Mise à jour fluide in-place des valeurs
  rosterList.forEach(ch => {
    const cKey = (ch.id || ch.name).toLowerCase();
    const charState = raidTrackerState.roster[cKey] || { raids: {} };
    const card = grid.querySelector(`.char-raid-card[data-char="${escapeHtml(cKey)}"]`);
    if (!card) return;

    let charEarnedGold = 0;
    let charPotentialGold = 0;
    let charCompletedRaids = 0;
    let charAllChests = true;

    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      const raidDef = RAID_DEFINITIONS[rKey];
      const cr = charState.raids[rKey] || {};
      const mode = cr.mode || 'normal';
      const modeDef = (raidDef && raidDef[mode]) || raidDef.normal;
      if (!cr.chest) charAllChests = false;

      const g1Earned = cr.g1 ? modeDef.g1 : 0;
      const g2Earned = cr.g2 ? modeDef.g2 : 0;
      let raidEarned = g1Earned + g2Earned;
      let raidPotential = modeDef.total;

      if (cr.chest) {
        const chestDeduct = (cr.g1 && cr.g2) ? modeDef.chest : (cr.g1 ? modeDef.chest1 : (cr.g2 ? modeDef.chest2 : 0));
        raidEarned = Math.max(0, raidEarned - chestDeduct);
        raidPotential = Math.max(0, raidPotential - modeDef.chest);
        totalAccountChestCost += chestDeduct;
      }

      charEarnedGold += raidEarned;
      charPotentialGold += raidPotential;

      if (cr.g1) totalClearedGates++;
      if (cr.g2) totalClearedGates++;
      if (cr.g1 && cr.g2) {
        charCompletedRaids++;
        totalCompletedRaids++;
      }

      const chip = card.querySelector(`.raid-chip[data-raid="${rKey}"]`);
      if (chip) {
        const isDone = !!(cr.g1 && cr.g2);
        const isJailed = !isDone && !!(cr.g1 || cr.g2);
        chip.classList.toggle('is-cleared', isDone);
        chip.classList.toggle('is-jailed', isJailed);

        const diffPill = chip.querySelector('.raid-diff-pill');
        if (diffPill) {
          diffPill.className = `raid-diff-pill diff-${mode}`;
          const modeShort = mode === 'nightmare' ? 'NM' : (mode === 'hard' ? 'HM' : 'N');
          diffPill.innerHTML = `
              <span class="diff-short">${modeShort}</span>
              <span class="diff-gold">(${(modeDef.total / 1000).toFixed(0)}k)</span>
              ${cr.modeAuto ? '<span class="diff-auto-dot" title="Auto LOA Logs">●</span>' : ''}
            `;
          diffPill.title = cr.modeAuto ? (isFr ? 'Difficulté détectée automatiquement depuis LOA Logs (cliquer pour changer)' : 'Auto-detected from LOA Logs (click to change)') : (isFr ? 'Cliquer pour changer de mode' : 'Click to cycle difficulty');
        }

        const g1Pip = chip.querySelector('.gate-pip[data-gate="1"]');
        if (g1Pip) {
          g1Pip.classList.toggle('cleared', !!cr.g1);
          const g1TimeStr = cr.g1Time ? formatClearTime(cr.g1Time) : '';
          g1Pip.title = cr.g1 && g1TimeStr ? t('raid_cleared_at').replace('{time}', g1TimeStr) : '';
          const g1Lbl = `${cr.g1 ? '✓ ' : ''}${isFr ? 'P1' : 'G1'}`;
          g1Pip.innerHTML = `<span class="gate-pip-lbl">${g1Lbl}</span><span class="gate-pip-reward">+${(modeDef.g1 / 1000).toFixed(1).replace('.0', '')}k</span>${cr.g1 && g1TimeStr ? `<span class="gate-pip-time">${g1TimeStr}</span>` : ''}`;
        }

        const g2Pill = chip.querySelector('.gate-pip[data-gate="2"]');
        if (g2Pill) {
          g2Pill.classList.toggle('cleared', !!cr.g2);
          const g2TimeStr = cr.g2Time ? formatClearTime(cr.g2Time) : '';
          g2Pill.title = cr.g2 && g2TimeStr ? t('raid_cleared_at').replace('{time}', g2TimeStr) : '';
          const g2Lbl = `${cr.g2 ? '✓ ' : ''}${isFr ? 'P2' : 'G2'}`;
          g2Pill.innerHTML = `<span class="gate-pip-lbl">${g2Lbl}</span><span class="gate-pip-reward">+${(modeDef.g2 / 1000).toFixed(1).replace('.0', '')}k</span>${cr.g2 && g2TimeStr ? `<span class="gate-pip-time">${g2TimeStr}</span>` : ''}`;
        }

        const chestBtn = chip.querySelector('.chest-toggle-pill');
        if (chestBtn) {
          chestBtn.classList.toggle('active', !!cr.chest);
          chestBtn.querySelector('.chest-cost').textContent = `-${(modeDef.chest / 1000).toFixed(1).replace('.0', '')}k`;
        }

        const totalGoldEl = chip.querySelector('.raid-chip-gold');
        if (totalGoldEl) {
          totalGoldEl.style.color = raidEarned > 0 ? '#8CC084' : '#E0A43A';
          totalGoldEl.textContent = raidEarned > 0 ? `${raidEarned.toLocaleString()} g` : `+${(modeDef.total - (cr.chest ? modeDef.chest : 0)).toLocaleString()} g`;
        }
      }
    });

    totalAccountEarnedGold += charEarnedGold;
    totalAccountPotentialGold += charPotentialGold;

    // État général du personnage
    const isCharAllCleared = charCompletedRaids === Object.keys(RAID_DEFINITIONS).length;
    card.classList.toggle('is-all-cleared', isCharAllCleared);

    const clearAllBtn = card.querySelector('.btn-char-clear-all');
    if (clearAllBtn) clearAllBtn.classList.toggle('is-active', isCharAllCleared);

    const chestsAllBtn = card.querySelector('.btn-char-chests-all');
    if (chestsAllBtn) chestsAllBtn.classList.toggle('is-active', charAllChests);

    const goldCur = card.querySelector('.char-gold-cur');
    if (goldCur) {
      goldCur.textContent = charEarnedGold.toLocaleString();
      goldCur.style.color = charEarnedGold > 0 ? '#8CC084' : '#E0A43A';
    }
    const goldMax = card.querySelector('.char-gold-max');
    if (goldMax) {
      goldMax.textContent = `${charPotentialGold.toLocaleString()} g`;
    }

    const progressBar = card.querySelector('.char-progress-bar');
    if (progressBar) {
      const charPct = charPotentialGold > 0 ? Math.round((charEarnedGold / charPotentialGold) * 100) : 0;
      progressBar.style.width = `${charPct}%`;
    }
  });

  // Mise à jour de la bannière Hero Neria.lol
  const heroEarnedVal = document.getElementById('raidHeroEarnedVal');
  const heroPotentialVal = document.getElementById('raidHeroPotentialVal');
  const heroPctBadge = document.getElementById('raidHeroPctBadge');
  const heroBarEarned = document.getElementById('raidHeroBarEarned');
  const heroBarChests = document.getElementById('raidHeroBarChests');

  const pct = totalAccountPotentialGold > 0 ? Math.round((totalAccountEarnedGold / totalAccountPotentialGold) * 100) : 0;
  const remainingGold = Math.max(0, totalAccountPotentialGold - totalAccountEarnedGold);

  if (heroEarnedVal) heroEarnedVal.textContent = `${totalAccountEarnedGold.toLocaleString()} g`;
  if (heroPotentialVal) heroPotentialVal.textContent = `${totalAccountPotentialGold.toLocaleString()} g max`;
  if (heroPctBadge) heroPctBadge.textContent = `${pct}% ${isFr ? 'encaissés' : 'earned'}`;
  if (heroBarEarned) heroBarEarned.style.width = `${pct}%`;
  if (heroBarChests) {
    const chestPct = totalAccountPotentialGold > 0 ? Math.min(100 - pct, Math.round((totalAccountChestCost / totalAccountPotentialGold) * 100)) : 0;
    heroBarChests.style.width = `${chestPct}%`;
  }

  // Mise à jour des KPI Cards
  const kpiEarnedVal = document.getElementById('raidKpiEarnedVal');
  const kpiEarnedSub = document.getElementById('raidKpiEarnedSub');
  const kpiRemainingVal = document.getElementById('raidKpiRemainingVal');
  const kpiRemainingSub = document.getElementById('raidKpiRemainingSub');
  const kpiProgressVal = document.getElementById('raidKpiProgressVal');
  const kpiGatesSub = document.getElementById('raidKpiGatesSub');
  const kpiPotentialVal = document.getElementById('raidKpiPotentialVal');

  if (kpiEarnedVal) kpiEarnedVal.textContent = `${totalAccountEarnedGold.toLocaleString()} g`;
  if (kpiEarnedSub) kpiEarnedSub.textContent = t('raid_kpi_earned_sub').replace('{pct}', pct);

  if (kpiRemainingVal) kpiRemainingVal.textContent = `${remainingGold.toLocaleString()} g`;
  if (kpiRemainingSub) kpiRemainingSub.textContent = t('raid_kpi_remaining_sub').replace('{raids}', totalMaxRaids);

  if (kpiProgressVal) kpiProgressVal.textContent = `${totalCompletedRaids} / ${totalMaxRaids}`;
  if (kpiGatesSub) kpiGatesSub.textContent = t('raid_kpi_gates_sub').replace('{cleared}', totalClearedGates).replace('{total}', totalMaxGates);

  if (kpiPotentialVal) kpiPotentialVal.textContent = `${totalAccountPotentialGold.toLocaleString()} g`;

  // Statut Agent & Compte à rebours
  const pill = document.getElementById('raidAgentStatusPill');
  const pillText = document.getElementById('raidAgentStatusText');
  if (pill && pillText) {
    if (raidTrackerState.agentStatus === 'checking') {
      pill.className = 'agent-status-pill checking';
      pillText.textContent = (window.i18n && window.i18n.t('raid_agent_checking')) || 'Connexion Agent...';
    } else {
      const isOnline = raidTrackerState.agentStatus === 'online';
      pill.className = 'agent-status-pill ' + (isOnline ? 'online' : 'offline');
      const langKey = isOnline ? 'raid_agent_online' : 'raid_agent_offline';
      pillText.textContent = (window.i18n && window.i18n.t(langKey)) || (isOnline ? 'Agent Connecté (Temps Réel)' : 'Agent Non Détecté (Mode Cache)');
    }
  }

  updateRaidResetCountdown();
}

let raidPollingInterval = null;

function initRaidTracker() {
  loadSavedRaidTrackerState();
  renderRaidTrackerView();

  const btnRefresh = document.getElementById('btnRefreshRaidsSync');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      fetchRaidTrackerStatus(true);
    });
  }

  const btnMarkAll = document.getElementById('btnRosterMarkAllCleared');
  if (btnMarkAll) {
    btnMarkAll.addEventListener('click', () => {
      toggleAllRosterGates();
    });
  }

  const btnAllChests = document.getElementById('btnRosterToggleAllChests');
  if (btnAllChests) {
    btnAllChests.addEventListener('click', () => {
      toggleAllRosterChests();
    });
  }

  // Premier fetch automatique
  fetchRaidTrackerStatus(false);

  // Compte à rebours
  setInterval(updateRaidResetCountdown, 30000);

  // Polling toutes les 15s si l'onglet est actif
  if (!raidPollingInterval) {
    raidPollingInterval = setInterval(() => {
      const pane = document.getElementById('tab-raidtracker');
      if (pane && pane.classList.contains('active')) {
        fetchRaidTrackerStatus(false);
      }
    }, 15000);
  }
}
