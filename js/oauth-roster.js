// OAuth lostark.bible et gestion du roster.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// Texte selon la langue de l'interface (anglais par défaut, i18n.js)
const trLang = (fr, en) => (isEnLang() ? en : fr);

// --- 4c. INTÉGRATION OFFICIELLE OAUTH 2.0 PKCE (LOSTARK.BIBLE) ---



// Client OAuth : production sur le site public ; développement (seul enregistré pour ces adresses) sur le réseau local
function getOAuthClientId() {
  const host = (window.location && window.location.hostname) || '';
  // Sur localhost, 127.0.0.1 ou IP LAN, basculer par défaut sur devClientId
  if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local')) {
    return OAUTH_CONFIG.devClientId;
  }
  return OAUTH_CONFIG.prodClientId;
}

function getOAuthRedirectUri() {
  return window.location.origin + window.location.pathname;
}

function generateRandomString(length = 43) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

// Implémentation pure JS de SHA-256 (garantit le fonctionnement sur IP locale non-HTTPS / LAN)
function sha256Bytes(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const words = [];
  const asciiBitLength = ascii.length * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  for (let i = 0; i < ascii.length; i++) {
    const j = i >> 2;
    words[j] = (words[j] || 0) | (ascii.charCodeAt(i) << (24 - (i % 4) * 8));
  }
  const endByteIndex = ascii.length;
  words[endByteIndex >> 2] = (words[endByteIndex >> 2] || 0) | (0x80 << (24 - (endByteIndex % 4) * 8));
  words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

  const w = new Array(64);
  for (let i = 0; i < words.length; i += 16) {
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];
    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = (hash[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (hash[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (hash[i] >>> 8) & 0xff;
    out[i * 4 + 3] = hash[i] & 0xff;
  }
  return out;
}

async function generateCodeChallenge(verifier) {
  let bytes;
  if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      bytes = new Uint8Array(digest);
    } catch (e) {
      bytes = sha256Bytes(verifier);
    }
  } else {
    bytes = sha256Bytes(verifier);
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function startOAuthFlow() {
  try {
    const clientId = getOAuthClientId();
    const redirectUri = getOAuthRedirectUri();
    const verifier = generateRandomString(50);
    const state = generateRandomString(24);

    sessionStorage.setItem('lostark_oauth_verifier', verifier);
    sessionStorage.setItem('lostark_oauth_state', state);

    const challenge = await generateCodeChallenge(verifier);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: OAUTH_CONFIG.scopes,
      state: state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    if (dom.importStatus) {
      dom.importStatus.className = 'modal-status info';
      dom.importStatus.style.display = 'block';
      dom.importStatus.textContent = trLang('Redirection vers lostark.bible…', 'Redirecting to lostark.bible…');
    }

    window.location.href = `${OAUTH_CONFIG.authUrl}?${params.toString()}`;
  } catch (err) {
    console.error('startOAuthFlow error:', err);
    if (dom.importStatus) {
      dom.importStatus.className = 'modal-status error';
      dom.importStatus.style.display = 'block';
      dom.importStatus.textContent = `Impossible d'initialiser OAuth : ${err.message}`;
    }
  }
}

async function checkOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const stateParam = params.get('state');
  const errorParam = params.get('error');

  // Gestion du retour d'erreur OAuth (e.g. access_denied, invalid_scope, etc.)
  if (errorParam) {
    const errDesc = params.get('error_description') || errorParam;
    console.warn('[OAuth Callback Error]', errorParam, errDesc);
    window.history.replaceState({}, document.title, window.location.pathname);
    logoutOAuth();
    if (dom.importStatus) {
      dom.importStatus.className = 'modal-status error';
      dom.importStatus.style.display = 'block';
      dom.importStatus.textContent = trLang(`Autorisation lostark.bible refusée : ${errDesc}`, `lostark.bible authorization denied: ${errDesc}`);
    }
    if (dom.importModal) dom.importModal.classList.add('active');
    return;
  }

  if (!code) return;

  const savedState = sessionStorage.getItem('lostark_oauth_state');
  const verifier = sessionStorage.getItem('lostark_oauth_verifier');

  // Retour sans state, sans vérificateur PKCE ou d'une autre session : refusé (connexion forcée à un autre compte)
  if (!stateParam || !savedState || stateParam !== savedState || !verifier) {
    console.warn('[OAuth] state ou vérificateur PKCE absent ou différent : retour ignoré');
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem('lostark_oauth_state');
    sessionStorage.removeItem('lostark_oauth_verifier');
    return;
  }

  const clientId = getOAuthClientId();
  const redirectUri = getOAuthRedirectUri();

  window.history.replaceState({}, document.title, window.location.pathname);

  try {
    if (dom.importStatus) {
      dom.importStatus.className = 'modal-status info';
      dom.importStatus.style.display = 'block';
      dom.importStatus.textContent = trLang('Échange du code d\'autorisation OAuth en cours…', 'Exchanging the OAuth authorization code…');
      if (dom.importModal) dom.importModal.classList.add('active');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    });

    const res = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error_description || errJson?.error || `HTTP ${res.status}`;
      throw new Error(trLang(`Échange de jeton refusé (${errMsg})`, `Token exchange refused (${errMsg})`));
    }
    const data = await res.json();

    if (data.access_token) {
      localStorage.setItem('lostark_bible_token', data.access_token);
      sessionStorage.removeItem('lostark_oauth_verifier');
      sessionStorage.removeItem('lostark_oauth_state');

      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status success';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = trLang('Connexion OAuth 2.0 réussie. Chargement de vos rosters…', 'OAuth 2.0 sign-in successful. Loading your rosters…');
      }

      await fetchOAuthUserData(data.access_token);
    } else {
      throw new Error(trLang('Aucun jeton d\'accès reçu.', 'No access token received.'));
    }
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    logoutOAuth();
    if (dom.importStatus) {
      dom.importStatus.className = 'modal-status error';
      dom.importStatus.style.display = 'block';
      dom.importStatus.textContent = `Échec de la connexion OAuth : ${err.message}`;
    }
  }
}

function extractOAuthUsername(data) {
  if (!data) return 'Utilisateur';
  const u = data.user || data.data || data.discord || data;
  return u.global_name || u.globalName || u.username || u.name || u.displayName || u.discord_name || (u.id ? `ID #${u.id}` : trLang('Connecté', 'Connected'));
}

function extractRostersList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.rosters)) return data.rosters;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.linkedRosters)) return data.linkedRosters;
  if (Array.isArray(data.characters)) return [{ server: 'Principal', region: 'CE', characters: data.characters }];
  return [];
}

async function fetchOAuthUserData(token) {
  if (!token) return;

  try {
    console.log('[OAuth] Chargement des données utilisateur avec le jeton...');
    const userRes = await fetch(OAUTH_CONFIG.userUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Si le token est expiré ou non autorisé (401 ou 403)
    if (userRes.status === 401 || userRes.status === 403) {
      console.warn('[OAuth] Session expirée ou non autorisée (HTTP ' + userRes.status + '). Déconnexion.');
      logoutOAuth();
      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status error';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = trLang('Session OAuth expirée ou invalide. Reconnecte-toi avec lostark.bible.', 'OAuth session expired or invalid. Please sign in again with lostark.bible.');
      }
      return;
    }

    let userData = null;
    try {
      userData = await userRes.json();
    } catch (e) {
      console.warn('[OAuth] Erreur parsing user data:', e);
    }

    if (!userRes.ok || !userData || userData.error) {
      console.warn('[OAuth] Données utilisateur invalides:', userRes.status, userData);
      logoutOAuth();
      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status error';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = `Session OAuth invalide (${userData?.error_description || userData?.error || 'HTTP ' + userRes.status}). Reconnexion requise.`;
      }
      return;
    }

    const rostersRes = await fetch(OAUTH_CONFIG.rostersUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let rostersData = null;
    if (rostersRes.ok) {
      try {
        rostersData = await rostersRes.json();
      } catch (e) {
        console.warn('[OAuth] Erreur parsing rosters:', e);
      }
    } else {
      console.warn('[OAuth] Échec récupération rosters (HTTP ' + rostersRes.status + ')');
    }

    if (dom.oauthDisconnectedView) dom.oauthDisconnectedView.style.display = 'none';
    if (dom.oauthConnectedView) dom.oauthConnectedView.style.display = 'block';
    if (dom.oauthUsername) {
      const uName = extractOAuthUsername(userData);
      dom.oauthUsername.textContent = `${uName} (Discord)`;
    }

    renderOAuthRosters(rostersData);

  } catch (e) {
    console.warn('Error fetching OAuth data:', e);
    if (dom.importStatus) {
      dom.importStatus.className = 'modal-status error';
      dom.importStatus.style.display = 'block';
      dom.importStatus.textContent = `Erreur de communication OAuth : ${e.message}`;
    }
  }
}

let currentOAuthRosters = null;

function renderOAuthRosters(rostersRaw) {
  const rosters = extractRostersList(rostersRaw);
  currentOAuthRosters = rosters;
  if (!dom.oauthRosterList) return;
  if (rosters.length === 0) {
    dom.oauthRosterList.innerHTML = `<div style="font-size:13px; color:var(--text-dim);">${trLang('Aucun roster ou personnage synchronisé.', 'No roster or character synced.')}</div>`;
    return;
  }

  let html = '';
  rosters.forEach(r => {
    const serverName = escapeHtml(r.server || r.serverName || r.name || 'Serveur');
    const rawRegion = (r.region || r.regionId || 'CE').toUpperCase();
    const region = escapeHtml(rawRegion);
    const characters = r.characters || r.characterList || r.chars || [];

    html += `<div style="font-size: 12px; font-weight: 700; color: var(--accent-gold); text-transform: uppercase; margin-top: 6px;">
        ${serverName} (${region}) :
      </div>`;

    characters.forEach(c => {
      const rawName = c.name || c.characterName || c.charName;
      if (!rawName) return;
      const charName = escapeHtml(rawName);
      const charClass = escapeHtml(formatClassName(c.className || c.characterClassName || c.class || 'Classe'));
      const ilvl = c.itemLevel || c.itemAvgLevel || c.ilvl || c.maxItemLevel || 0;

      html += `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.25); border: 1px solid rgba(232, 230, 220,0.06); border-radius: 6px; padding: 6px 10px; margin-top: 4px;">
            <div>
              <strong style="color: var(--text-main); font-size: 14px;">${charName}</strong>
              <span style="font-size: 13px; color: var(--text-muted); margin-left: 6px;">${charClass} • ${ilvl > 0 ? ilvl.toFixed(1) : ''} iLvl</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-add-oauth-char" data-name="${charName}" data-region="${region}" style="background: rgba(140, 192, 132, 0.15); border: 1px solid rgba(140, 192, 132, 0.4); color: #8CC084; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
                + ${trLang('Ajouter', 'Add')}
              </button>
              <button type="button" class="btn-load-oauth-char" data-name="${charName}" data-region="${region}" style="background: rgba(232, 230, 220, 0.15); border: 1px solid rgba(232, 230, 220, 0.4); color: #E0A43A; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
                ${trLang('Charger', 'Load')}
              </button>
            </div>
          </div>
        `;
    });
  });

  dom.oauthRosterList.innerHTML = html;

  dom.oauthRosterList.querySelectorAll('.btn-add-oauth-char').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const region = btn.getAttribute('data-region') || 'CE';
      if (name) {
        fetchBibleProfile(region, name, true);
      }
    });
  });

  dom.oauthRosterList.querySelectorAll('.btn-load-oauth-char').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const region = btn.getAttribute('data-region') || 'CE';
      if (name) {
        fetchBibleProfile(region, name, false);
      }
    });
  });
}

async function syncAllOAuthCharacters(rostersRaw) {
  const statusEl = dom.importStatus;
  if (statusEl) {
    statusEl.className = 'modal-status info';
    statusEl.style.display = 'block';
    statusEl.innerHTML = trLang('Préparation de la synchronisation de ton roster…', 'Preparing your roster sync…');
  }

  const rosters = extractRostersList(rostersRaw);
  const allChars = [];
  rosters.forEach(r => {
    const server = r.server || r.serverName || r.name || 'Serveur';
    const region = (r.region || r.regionId || 'CE').toUpperCase();
    const chars = r.characters || r.characterList || r.chars || [];
    chars.forEach(c => {
      const name = c.name || c.characterName || c.charName;
      if (!name) return;
      allChars.push({
        name,
        className: formatClassName(c.className || c.characterClassName || c.class || 'Classe'),
        ilvl: c.itemLevel || c.itemAvgLevel || c.ilvl || c.maxItemLevel || 0,
        server,
        region
      });
    });
  });

  allChars.sort((a, b) => b.ilvl - a.ilvl);
  const topChars = allChars.slice(0, 6);

  if (topChars.length === 0) {
    if (statusEl) {
      statusEl.className = 'modal-status error';
      statusEl.textContent = trLang('Aucun personnage trouvé dans tes données lostark.bible.', 'No character found in your lostark.bible data.');
    }
    return;
  }

  const importedList = [];
  for (let i = 0; i < topChars.length; i++) {
    const tc = topChars[i];
    if (statusEl) {
      statusEl.innerHTML = `${trLang('Synchronisation', 'Syncing')} (${i + 1}/${topChars.length}) : <strong>${escapeHtml(tc.name)}</strong> (${tc.ilvl.toFixed(1)})...`;
    }
    try {
      const charObj = await fetchBibleProfile(tc.region, tc.name, false);
      if (charObj) {
        importedList.push(charObj);
      }
    } catch (e) {
      console.warn('Error fetching char in batch:', tc.name, e);
    }
  }

  if (importedList.length > 0) {
    saveUserRoster(importedList);
    renderPresetsBar();
    loadCharacter(importedList[0]);
    renderSavedRosterManager();

    if (statusEl) {
      statusEl.className = 'modal-status success';
      statusEl.innerHTML = trLang(`<strong>Roster synchronisé.</strong><br>Tes ${importedList.length} personnages sont disponibles dans la barre du haut.`,
        `<strong>Roster synced.</strong><br>Your ${importedList.length} characters are available in the top bar.`);
    }
  }
}

function addCharacterToUserRoster(charObj) {
  let list = getUserRoster();
  if (!list) list = [];

  const existingIndex = list.findIndex(c => (c.id || c.name.toLowerCase()) === (charObj.id || charObj.name.toLowerCase()));
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...charObj };
  } else {
    list.push(charObj);
  }

  saveUserRoster(list);
  renderPresetsBar();
  loadCharacter(charObj);
  renderSavedRosterManager();
}

function removeCharacterFromUserRoster(charId) {
  let list = getUserRoster() || [];
  list = list.filter(c => (c.id || c.name.toLowerCase()) !== charId.toLowerCase());
  saveUserRoster(list);
  if (list.length === 0) {
    activeCharacterId = null;
    showNoCharacterState();
  } else {
    renderPresetsBar();
    loadCharacter(list[0]);
  }
  renderSavedRosterManager();
}

function clearUserRoster() {
  localStorage.removeItem('lostark_user_roster');
  activeCharacterId = null;
  showNoCharacterState();
  renderSavedRosterManager();
  if (dom.importStatus) {
    dom.importStatus.className = 'modal-status info';
    dom.importStatus.style.display = 'block';
    dom.importStatus.textContent = isEnLang() ? 'Roster cleared. Import a character to continue.' : 'Roster réinitialisé. Importe un personnage pour continuer.';
  }
}

async function refreshAllUserRosterCharacters() {
  const list = getUserRoster();
  if (!list || list.length === 0) return;
  const statusEl = dom.importStatus;
  if (statusEl) {
    statusEl.className = 'modal-status info';
    statusEl.style.display = 'block';
    statusEl.innerHTML = trLang(`Réactualisation de tes ${list.length} personnages…`, `Refreshing your ${list.length} characters…`);
  }

  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (statusEl) statusEl.innerHTML = `${trLang('Réactualisation', 'Refreshing')} (${i + 1}/${list.length}) : <strong>${escapeHtml(c.name)}</strong>...`;
    try {
      const updated = await fetchBibleProfile(c.region || 'CE', c.name, false);
      if (updated) {
        list[i] = { ...list[i], ...updated };
      }
    } catch (e) {
      console.warn('Error refreshing char:', c.name, e);
    }
  }

  saveUserRoster(list);
  renderPresetsBar();
  loadCharacter(list[0]);
  renderSavedRosterManager();

  if (statusEl) {
    statusEl.className = 'modal-status success';
    statusEl.innerHTML = trLang(`Tes ${list.length} personnages sont à jour.`, `Your ${list.length} characters are up to date.`);
  }
}

function renderSavedRosterManager() {
  if (!dom.userRosterManagerSection || !dom.modalUserRosterList) return;
  const roster = getUserRoster();
  if (!roster || roster.length === 0) {
    dom.userRosterManagerSection.style.display = 'none';
    if (dom.modalRosterCount) dom.modalRosterCount.textContent = '0';
    return;
  }

  dom.userRosterManagerSection.style.display = 'block';
  if (dom.modalRosterCount) dom.modalRosterCount.textContent = roster.length.toString();

  let html = '';
  roster.forEach(c => {
    const cId = escapeHtml(c.id || c.name.toLowerCase());
    const isSupport = c.role === 'support';
    const classIconSrc = escapeHtml(getClassIconUrl(c.className, c.role));
    const isSafeUrl = c.portraitUrl && (
      c.portraitUrl.startsWith('images/') ||
      c.portraitUrl.startsWith('./') ||
      c.portraitUrl.startsWith('/') ||
      c.portraitUrl.startsWith('https://') ||
      c.portraitUrl.startsWith('http://') ||
      c.portraitUrl.startsWith('data:image/')
    );
    const rawAvatar = isSafeUrl ? c.portraitUrl : classIconSrc;
    const avatarSrc = escapeHtml(rawAvatar);
    const safeName = escapeHtml(c.name);
    const safeClass = escapeHtml(c.className || 'Classe');

    html += `
        <div class="user-roster-card-item">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img class="user-roster-avatar" src="${avatarSrc}" data-fallback="${classIconSrc}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: #121310; border: 1px solid rgba(232, 230, 220,0.2);">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: #E8E6DC;">
                <img class="chip-class-sigil" src="${classIconSrc}" alt="${safeClass}" title="${safeClass}">
                <span>${safeName}</span>
              </div>
              <div style="font-size: 12px; color: var(--text-dim);">
                ${safeClass} • ${(c.ilvl || 1750).toFixed(1)} iLvl • ${formatNumber(c.cp || 0)} CP
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-select-roster-char" data-id="${cId}" style="background: rgba(232, 230, 220,0.15); border: 1px solid rgba(232, 230, 220,0.4); color: #E0A43A; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
              ${trLang('Charger', 'Load')}
            </button>
            <button type="button" class="btn-delete-roster-char" data-id="${cId}" style="background: rgba(224, 122, 99,0.15); border: 1px solid rgba(224, 122, 99,0.4); color: #E07A63; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
              ${trLang('Retirer', 'Remove')}
            </button>
          </div>
        </div>
      `;
  });

  dom.modalUserRosterList.innerHTML = html;

  dom.modalUserRosterList.querySelectorAll('.user-roster-avatar').forEach(img => {
    img.addEventListener('error', () => {
      const fb = img.getAttribute('data-fallback');
      if (fb) img.src = fb;
    });
  });

  dom.modalUserRosterList.querySelectorAll('.btn-select-roster-char').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const list = getUserRoster() || [];
      const found = list.find(x => (x.id || x.name.toLowerCase()) === id);
      if (found) {
        renderPresetsBar();
        loadCharacter(found);
        if (dom.importModal) dom.importModal.classList.remove('active');
      }
    });
  });

  dom.modalUserRosterList.querySelectorAll('.btn-delete-roster-char').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      removeCharacterFromUserRoster(id);
    });
  });
}

function logoutOAuth() {
  localStorage.removeItem('lostark_bible_token');
  currentOAuthRosters = null;
  if (dom.oauthDisconnectedView) dom.oauthDisconnectedView.style.display = 'block';
  if (dom.oauthConnectedView) dom.oauthConnectedView.style.display = 'none';
  if (dom.oauthUsername) dom.oauthUsername.textContent = trLang('Connecté', 'Connected');
  if (dom.oauthRosterList) dom.oauthRosterList.innerHTML = '';
}
