// Onglet Analyse de rotation : combats de la base locale de LOA Logs (encounters.db), choisie par l'utilisateur.
// Le fichier est lu dans un worker (js/rotation/sqlite-worker.js, SQLite en WebAssembly), jamais envoyé. Calculs et
// conseils : modules de js/rotation (metrics.js, coach.js), les mêmes que l'outil en ligne de commande tools/rotation.
// Références par spé et par boss : data/rotation-ref.json (node tools/rotation/build-ref.mjs).
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

const ROT_MAX_ADVICE = 5; // au-delà, trop d'un coup : les plus importants d'abord, le build à part
const ROT_DAY_LIMIT = 50;
const ROT_SYNC_MS = 10000;   // tant que l'onglet est affiché : le fichier a-t-il changé (nouveau combat) ?
const ROT_RETRY_MS = 2000;   // LOA Logs en pleine écriture : nouvel essai
const ROT_IDB = 'lostark_rotation';

// Accès direct au fichier (File System Access : Chrome, Edge, Opera) : le fichier se relit à chaque changement et se
// retrouve à la visite suivante. Ailleurs (Firefox, Safari), un File figé : le navigateur refuse de le relire dès que
// LOA Logs y écrit, il faut le choisir à nouveau.
const ROT_CAN_HANDLE = typeof window.showOpenFilePicker === 'function';

const rot = {
  worker: null, seq: 0, pending: new Map(),
  info: null, raids: null, dayFilter: '', busy: '', error: '',
  analysis: null, selected: null,
  mods: null, refData: null, skillData: null, guides: null,
  handle: null, storedHandle: null, storedLoaded: false, lastModified: null, syncedAt: null, newIds: new Set(), syncTimer: null,
};

// Lettre de la note d'exécution d'après le « Top X % » (part des logs de référence qui font au moins aussi bien) :
// S = 5 % du haut, A = quart du haut, B = moitié haute, C = moitié basse, D = quart du bas. La note 0-100 est une
// moyenne de rangs, tassée autour de 50 (presque aucun log de référence n'atteint 95) : ses seuils ne donnaient
// jamais S. Sans répartition de référence, repli sur la note. Couleurs du barème du site (subrank.js).
const ROT_GRADES_TOP = [['S', 5], ['A', 25], ['B', 50], ['C', 75], ['D', Infinity]];
const ROT_GRADES = [['S', 95], ['A', 75], ['B', 50], ['C', 25], ['D', -Infinity]];

function rotGrade(score, top) {
  if (top != null) return ROT_GRADES_TOP.find(([, max]) => top <= max)[0];
  return ROT_GRADES.find(([, min]) => score >= min)[0];
}

function rotGradeHtml(score, big, top = null) {
  const g = rotGrade(score, top);
  const c = window.Subrank ? window.Subrank.colorOf(g) : null;
  const style = c ? ` style="background:${c.bg};color:${c.fg}"` : '';
  return `<span class="rot-grade${big ? ' rot-grade-big' : ''}"${style}>${g}</span>`;
}

function rotClassIcon(className) {
  return `<img class="rot-class-icon" src="${escapeHtml(getClassIconUrl(className))}" alt="" width="20" height="20" loading="lazy">`;
}

function rotTopHtml(top) {
  return top != null ? `<span class="rot-top">${trLang(`Top ${top} %`, `Top ${top}%`)}</span>` : '';
}

// Couverture brute du support (style « Buff Performance » de lostark.bible) : moyenne buff d'attaque, Marque, identité.
function rotCoverageHtml(a) {
  if (a.coverageMean == null) return '';
  const c = a.supportCoverage;
  return `<div class="rot-coverage">
      <span class="rot-coverage-label">${trLang('Couverture brute', 'Raw coverage')}</span>
      <span class="rot-coverage-value">${rotPct(a.coverageMean)}</span>${rotTopHtml(a.coverageTop)}
      <span class="rot-dim rot-coverage-detail">${trLang('PA', 'AP')} ${rotPct(c.ap)} · ${trLang('Marque', 'Brand')} ${rotPct(c.brand)} · ${trLang('Identité', 'Identity')} ${rotPct(c.identity)}</span>
    </div>`;
}

function rotUrl(path) {
  return new URL(path, document.baseURI).href;
}

function rotCall(type, extra = {}) {
  if (!rot.worker) {
    rot.worker = new Worker(rotUrl('js/rotation/sqlite-worker.js'), { type: 'module' });
    rot.worker.onmessage = ({ data }) => {
      const p = rot.pending.get(data.id);
      if (!p) return;
      rot.pending.delete(data.id);
      data.ok ? p.resolve(data.result) : p.reject(new Error(data.error));
    };
    // Worker qui ne se charge pas (module, WASM, CSP) : appels en cours rejetés et worker abandonné, recréé au
    // prochain appel (sinon les appels suivants restaient sans réponse et l'onglet bloqué jusqu'au rechargement)
    rot.worker.onerror = e => {
      for (const p of rot.pending.values()) p.reject(new Error(e.message || 'worker'));
      rot.pending.clear();
      try { rot.worker.terminate(); } catch (_) {}
      rot.worker = null;
    };
  }
  const id = ++rot.seq;
  return new Promise((resolve, reject) => {
    rot.pending.set(id, { resolve, reject });
    rot.worker.postMessage({ id, type, ...extra });
  });
}

// Modules de calcul, références et tables des compétences : chargés à la première ouverture d'une base.
async function rotLoadShared() {
  if (!rot.mods) {
    const [metrics, coach] = await Promise.all([import(rotUrl('js/rotation/metrics.js')), import(rotUrl('js/rotation/coach.js'))]);
    rot.mods = { metrics, coach };
  }
  if (!rot.refData || !rot.skillData) {
    const [refs, skills, guides] = await Promise.all([
      fetch(rotUrl('data/rotation-ref.json')).then(r => (r.ok ? r.json() : null)),
      fetch(rotUrl('data/rotation-skills.json')).then(r => (r.ok ? r.json() : null)),
      fetch(rotUrl('data/rotation-guides.json')).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    rot.refData = refs;
    rot.skillData = skills;
    rot.guides = guides;
  }
}

function rotErrorText(msg) {
  if (msg === 'not-sqlite') return trLang('Ce fichier n\'est pas une base SQLite : choisis encounters.db dans le dossier de LOA Logs.', 'This file is not an SQLite database: choose encounters.db in the LOA Logs folder.');
  if (msg === 'not-loalogs') return trLang('Cette base n\'est pas celle de LOA Logs (tables des combats absentes).', 'This database is not a LOA Logs database (fight tables missing).');
  if (msg === 'file-changed') return trLang('Le fichier a changé depuis que tu l\'as choisi (LOA Logs a enregistré un combat) : choisis-le à nouveau.', 'The file changed since you picked it (LOA Logs saved a fight): pick it again.');
  return trLang(`Lecture impossible : ${msg}`, `Could not read the file: ${msg}`);
}

const rotSleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- Fichier retenu d'une visite à l'autre (IndexedDB : le handle se clone, pas un File) ----------

function rotIdb(mode, fn) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(ROT_IDB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      let tx, r;
      try {
        tx = req.result.transaction('kv', mode);
        r = fn(tx.objectStore('kv'));
      } catch (e) { req.result.close(); reject(e); return; }
      tx.oncomplete = () => { req.result.close(); resolve(r && r.result); };
      tx.onerror = () => { req.result.close(); reject(tx.error); };
    };
  });
}
async function rotSaveHandle(h) {
  try { await rotIdb('readwrite', st => st.put(h, 'encounters')); } catch (e) { /* stockage indisponible : rien de grave */ }
}
async function rotLoadHandle() {
  try { return (await rotIdb('readonly', st => st.get('encounters'))) || null; } catch (e) { return null; }
}

// ---------- Ouverture, synchro ----------

// keep : synchro (même vue : filtre, combat analysé et joueur choisi restent ; les nouveaux raids sont signalés).
async function rotOpenFile(file, { keep = false } = {}) {
  if (!keep) { rot.info = null; rot.raids = null; rot.analysis = null; rot.selected = null; rot.newIds = new Set(); }
  rot.error = '';
  rot.busy = keep ? 'sync' : 'open';
  renderRotationTab();
  const before = new Set((rot.raids || []).map(r => r.id));
  try {
    const [info] = await Promise.all([rotCall('open', { file }), rotLoadShared()]);
    rot.info = { ...info, name: file.name };
    rot.lastModified = file.lastModified;
    rot.syncedAt = Date.now();
    rot.raids = await rotCall('list', { opts: rotListOpts() });
    if (keep) for (const r of rot.raids) if (!before.has(r.id)) rot.newIds.add(r.id);
  } catch (e) {
    rot.busy = '';
    throw e;
  }
  rot.busy = '';
  renderRotationTab();
}

async function rotOpenSafely(file, opts) {
  try { await rotOpenFile(file, opts); } catch (e) { rot.error = rotErrorText(e.message); renderRotationTab(); }
}

// Relit le fichier par son handle. Automatique : seulement s'il a changé, sans message d'erreur (LOA Logs peut être en
// train d'écrire : nouvel essai au tour suivant). Manuel : toujours, avec un nouvel essai après 2 s puis le message.
async function rotSync({ manual = false } = {}) {
  // Jamais pendant une lecture ou une analyse : rouvrir la base la fermerait en plein calcul
  if (!rot.handle || rot.busy) return;
  let file;
  try { file = await rot.handle.getFile(); } catch (e) {
    if (manual) { rot.error = rotErrorText(e.message); renderRotationTab(); }
    return;
  }
  if (!manual && rot.info && file.lastModified === rot.lastModified) return;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await rotOpenFile(file, { keep: !!rot.info });
      return;
    } catch (e) {
      if (attempt === 0) { await rotSleep(ROT_RETRY_MS); try { file = await rot.handle.getFile(); } catch (_) { /* nouvel essai avec l'ancien */ } continue; }
      if (manual || !rot.info) { rot.error = rotErrorText(e.message); renderRotationTab(); }
    }
  }
}

async function rotUseHandle(h) {
  rot.storedLoaded = true;
  rot.handle = h;
  rot.storedHandle = null;
  rot.info = null;
  rotSaveHandle(h);
  await rotSync({ manual: true });
}

async function rotPick() {
  let h;
  try {
    [h] = await window.showOpenFilePicker({ id: 'loalogs', types: [{ description: 'LOA Logs (encounters.db)', accept: { 'application/x-sqlite3': ['.db'] } }] });
  } catch (e) {
    return; // fenêtre fermée sans choix
  }
  await rotUseHandle(h);
}

// Fichier retenu : la permission de lecture se redemande à chaque visite (clic obligatoire si le navigateur l'exige).
async function rotResume() {
  const h = rot.storedHandle;
  if (!h) return;
  try {
    if ((await h.requestPermission({ mode: 'read' })) !== 'granted') return;
  } catch (e) { return; }
  await rotUseHandle(h);
}

// Onglet affiché : fichier retenu déjà autorisé → ouvert sans clic ; sinon vérification immédiate d'un changement.
// Le fichier retenu n'est lu qu'ici, à l'ouverture de l'onglet, jamais au chargement du site.
async function showRotationTab() {
  if (rot.handle) { rotSync(); return; }
  if (ROT_CAN_HANDLE && !rot.storedLoaded) {
    rot.storedLoaded = true;
    rot.storedHandle = await rotLoadHandle();
    renderRotationTab();
  }
  if (!rot.storedHandle) return;
  try {
    if ((await rot.storedHandle.queryPermission({ mode: 'read' })) === 'granted') await rotUseHandle(rot.storedHandle);
  } catch (e) { /* le bouton « Reprendre » reste proposé */ }
}

function rotSyncTick() {
  const pane = document.getElementById('tab-rotation');
  if (!rot.handle || document.visibilityState !== 'visible' || !pane?.classList.contains('active')) return;
  rotSync();
}

function rotListOpts() {
  const opts = { limit: 10 };
  if (rot.dayFilter) {
    const [y, m, d] = rot.dayFilter.split('-').map(Number);
    opts.from = new Date(y, m - 1, d).getTime();
    opts.to = new Date(y, m - 1, d + 1).getTime();
    opts.limit = ROT_DAY_LIMIT;
  }
  return opts;
}

// Fichier modifié pendant une lecture (File figé) : avec un handle, on le relit et on refait l'action une fois.
async function rotWithFreshFile(action) {
  try { return await action(); } catch (e) {
    if (e.message !== 'file-changed' || !rot.handle) throw e;
    const file = await rot.handle.getFile();
    await rotCall('open', { file });
    // rot.lastModified n'est PAS mis à jour : la synchro suivante voit le changement et relit la liste des raids
    // (sinon le raid qui venait de finir n'apparaissait qu'à l'écriture suivante de LOA Logs)
    rot.syncedAt = Date.now();
    return action();
  }
}

async function rotListRaids() {
  if (!rot.info) return;
  rot.busy = 'list';
  rot.error = '';
  rot.newIds = new Set();
  renderRotationTab();
  try {
    rot.raids = await rotWithFreshFile(() => rotCall('list', { opts: rotListOpts() }));
  } catch (e) {
    rot.error = rotErrorText(e.message);
  }
  rot.busy = '';
  renderRotationTab();
}

async function rotAnalyze(encounterId) {
  rot.busy = 'analyze';
  rot.error = '';
  rot.analysis = null;
  renderRotationTab();
  try {
    const res = await rotWithFreshFile(() => rotCall('analyze', { encounterId }));
    const { pickReference, alignToReference, scorePlayer, coverageMean, topPercent } = rot.mods.metrics;
    const refs = rot.refData?.refs || null;
    for (const a of res.players) {
      const { ref, scope } = pickReference(refs, a.spec, res.encounter.boss);
      // Référence lostark.bible : rythmes du joueur comptés comme les siens, sur toute la chronologie.
      a.skills = alignToReference(a, ref).skills;
      a.ref = ref;
      a.reference = ref ? { scope, n: ref.n } : null;
      a.score = scorePlayer(a, ref);
      // « Top X % » comme lostark.bible : rang de la note, et de la couverture brute des supports, dans leur référence.
      a.scoreTop = a.score?.score != null ? topPercent(ref?.score, a.score.score) : null;
      a.coverageMean = coverageMean(a.supportCoverage);
      a.coverageTop = a.coverageMean != null ? topPercent(ref?.support?.mean, a.coverageMean) : null;
    }
    rot.analysis = res;
    const local = res.players.find(p => p.name === res.encounter.localPlayer);
    rot.selected = (local || res.players[0])?.name || null;
  } catch (e) {
    rot.error = rotErrorText(e.message);
  }
  rot.busy = '';
  renderRotationTab();
  const el = document.getElementById('rotAnalysis');
  if (el && rot.analysis) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Formats ----------

function rotNum(x, d = 1) {
  if (x == null || !Number.isFinite(x)) return '—';
  return x.toLocaleString(isEnLang() ? 'en-US' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function rotPct(x, d = 1) {
  if (x == null || !Number.isFinite(x)) return '—';
  return isEnLang() ? `${rotNum(x * 100, d)}%` : `${rotNum(x * 100, d)} %`;
}
function rotClock(ms) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
}
function rotDate(t) {
  return new Date(t).toLocaleString(isEnLang() ? 'en-GB' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function rotDifficulty(d) {
  if (isEnLang()) return d;
  return { Normal: 'Normal', Hard: 'Difficile', Nightmare: 'Cauchemar', 'Level 1': 'Niveau 1', 'Level 2': 'Niveau 2', 'Level 3': 'Niveau 3' }[d] || d;
}

// ---------- Rendu ----------

function renderRotationTab() {
  const pane = document.getElementById('tab-rotation');
  if (!pane) return;
  const loc = isEnLang() ? 'en-GB' : 'fr-FR';
  const info = document.getElementById('rotFileInfo');
  if (info) {
    if (rot.busy === 'open') info.textContent = trLang('Ouverture…', 'Opening…');
    else if (rot.busy === 'sync') info.textContent = trLang('Synchronisation…', 'Syncing…');
    else if (rot.info) {
      const range = rot.info.first ? ` · ${new Date(rot.info.first).toLocaleDateString(loc)} → ${new Date(rot.info.last).toLocaleDateString(loc)}` : '';
      const synced = rot.handle && rot.syncedAt ? ` · ${trLang('lu à', 'read at')} ${new Date(rot.syncedAt).toLocaleTimeString(loc)}` : '';
      info.textContent = `${rot.info.name} · ${rotNum(rot.info.size / 1048576, 0)} ${trLang('Mo', 'MB')} · ${rot.info.encounters} ${trLang('combats', 'fights')}${range}${synced}`;
    } else info.textContent = '';
  }
  const resume = document.getElementById('rotResume');
  if (resume) resume.hidden = !(rot.storedHandle && !rot.handle);
  const sync = document.getElementById('rotSync');
  if (sync) { sync.hidden = !rot.handle; sync.disabled = !!rot.busy; }
  const note = document.getElementById('rotSyncNote');
  if (note) {
    note.textContent = !ROT_CAN_HANDLE
      ? trLang('Ton navigateur ne permet pas de relire le fichier : après un nouveau combat, choisis-le à nouveau. Chrome et Edge le relisent tout seuls.', 'Your browser cannot re-read the file: after a new fight, pick it again. Chrome and Edge re-read it on their own.')
      : rot.handle
        ? trLang('Synchro automatique : tant que cet onglet est affiché, les nouveaux combats enregistrés par LOA Logs apparaissent en 10 s environ.', 'Auto sync: while this tab is shown, new fights saved by LOA Logs show up within about 10 s.')
        : rot.storedHandle
          ? trLang(`Fichier retenu : ${rot.storedHandle.name}. Clique sur « Reprendre » pour autoriser sa lecture.`, `Remembered file: ${rot.storedHandle.name}. Click "Resume" to allow reading it.`)
          : trLang('Le fichier est retenu pour tes prochaines visites et relu automatiquement après chaque combat.', 'The file is remembered for your next visits and re-read automatically after each fight.');
  }
  const raidsPanel = document.getElementById('rotRaidsPanel');
  if (raidsPanel) raidsPanel.hidden = !rot.info;
  const dateInput = document.getElementById('rotDate');
  if (dateInput && dateInput.value !== rot.dayFilter) dateInput.value = rot.dayFilter;
  const latest = document.getElementById('rotLatest');
  if (latest) latest.classList.toggle('active', !rot.dayFilter);

  const raidsEl = document.getElementById('rotRaids');
  if (raidsEl) raidsEl.innerHTML = rotRaidsHtml();
  const an = document.getElementById('rotAnalysis');
  if (an) an.innerHTML = rotAnalysisHtml();
}

// « Serca G1 · Witch of Agony, Serca » : raid et porte de la table de LOA Logs (noms du jeu, en anglais).
function rotRaidLabel(boss) {
  const r = rot.skillData?.raids?.[boss];
  return `${r ? `<span class="rot-dim">${escapeHtml(`${r.r}${r.g ? ' ' + r.g : ''}`)} · </span>` : ''}${escapeHtml(boss)}`;
}

function rotRaidsHtml() {
  if (rot.busy === 'list') return `<p class="belg-empty">${trLang('Recherche des raids…', 'Looking for raids…')}</p>`;
  if (!rot.raids) return '';
  if (!rot.raids.length) {
    return `<p class="belg-empty">${rot.dayFilter
      ? trLang('Aucun raid réussi ce jour-là (raids seulement : ni gardiens ni donjons du chaos ; combats de plus de 2 minutes, hors solo et matchmaking).', 'No cleared raid that day (raids only: no guardians or chaos dungeons; fights over 2 minutes, solo and matchmaking excluded).')
      : trLang('Aucun raid réussi dans cette base.', 'No cleared raid in this database.')}</p>`;
  }
  const current = rot.analysis?.encounter.id;
  const rows = rot.raids.map(r => `
    <tr class="rot-raid-row${r.id === current ? ' active' : ''}" data-rot-encounter="${r.id}" tabindex="0">
      <td class="market-num">${escapeHtml(rotDate(r.fight_start))}</td>
      <td>${rotRaidLabel(r.current_boss)}${rot.newIds.has(r.id) ? ` <span class="rot-new">${trLang('nouveau', 'new')}</span>` : ''}</td>
      <td>${escapeHtml(rotDifficulty(r.difficulty))}</td>
      <td class="market-num">${rotClock(r.duration)}</td>
      <td>${escapeHtml(r.local_player || '')}</td>
    </tr>`).join('');
  return `<div class="table-container"><table class="market-table rot-table">
    <thead><tr><th>${trLang('Date', 'Date')}</th><th>${trLang('Boss', 'Boss')}</th><th>${trLang('Difficulté', 'Difficulty')}</th><th>${trLang('Durée', 'Duration')}</th><th>${trLang('Ton personnage', 'Your character')}</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    ${rot.dayFilter && rot.raids.length >= ROT_DAY_LIMIT ? `<p class="belg-note">${trLang(`Les ${ROT_DAY_LIMIT} plus récents de ce jour.`, `The ${ROT_DAY_LIMIT} most recent of that day.`)}</p>` : ''}`;
}

function rotAnalysisHtml() {
  if (rot.error) return `<div class="belg-panel"><p class="rot-error">${escapeHtml(rot.error)}</p></div>`;
  if (rot.busy === 'analyze') return `<div class="belg-panel"><p class="belg-empty">${trLang('Analyse du combat…', 'Analysing the fight…')}</p></div>`;
  const res = rot.analysis;
  if (!res) return '';
  const e = res.encounter;
  const downMs = res.downtime.reduce((t, [a, b]) => t + b - a, 0);
  const bible = e.bibleId ? ` · <a href="https://lostark.bible/logs/${encodeURIComponent(e.bibleId)}" target="_blank" rel="noopener">lostark.bible</a>` : '';
  const rows = res.players.map(a => {
    const sc = a.score?.score;
    return `<tr class="rot-player-row${a.name === rot.selected ? ' active' : ''}" data-rot-player="${escapeHtml(a.name)}" tabindex="0">
      <td class="rot-name-cell">${rotClassIcon(a.className)}${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.className)} <span class="rot-dim">${escapeHtml(a.spec || '')}</span></td>
      <td class="market-num">${a.combatPower ? rotNum(a.combatPower, 0) : '—'}</td>
      <td class="market-num">${rotNum(a.dps / 1e6, 0)} M</td>
      <td class="market-num">${rotPct(a.activity)}</td>
      <td class="market-num">${a.support ? `<span class="rot-dim">${trLang('support', 'support')}</span>` : rotPct(a.fullBuffRate)}</td>
      <td class="market-num">${a.positionalShare >= 0.05 ? rotPct(a.positionalRate) : '—'}</td>
      <td class="market-num rot-score-cell">${sc != null ? `${rotGradeHtml(sc, false, a.scoreTop)} ${sc}` : '—'}</td>
    </tr>`;
  }).join('');
  const player = res.players.find(p => p.name === rot.selected);
  return `<div class="belg-panel">
      <h3>${rotRaidLabel(e.boss)} <span class="rot-dim">${escapeHtml(rotDifficulty(e.difficulty))} · ${rotClock(e.timelineMs)} · ${escapeHtml(rotDate(e.fightStart))}${bible}</span></h3>
      <p class="belg-note">${trLang(`Phases où moins de la moitié du raid frappe (boss absent, mécanique) : ${rotClock(downMs)}, retirées du temps jouable.`, `Phases where less than half the raid deals damage (boss away, mechanic): ${rotClock(downMs)}, removed from the playable time.`)}</p>
      <div class="table-container"><table class="market-table rot-table">
        <thead><tr><th>${trLang('Joueur', 'Player')}</th><th>${trLang('Classe / spé', 'Class / spec')}</th><th>CP</th><th>DPS</th>
          <th title="${trLang('Part du temps jouable passée à lancer des compétences', 'Share of the playable time spent using skills')}">${trLang('Activité', 'Activity')}</th>
          <th title="${trLang('Part des dégâts faits avec le buff d\'attaque et la Marque du support', 'Share of damage dealt with both the support attack buff and Brand')}">${trLang('PA + Marque', 'AP + Brand')}</th>
          <th>${trLang('Placement', 'Positioning')}</th><th>${trLang('Note', 'Score')}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <p class="belg-note">${trLang('Clique sur un joueur pour voir sa note et ses conseils.', 'Click a player to see their score and advice.')}</p>
    </div>
    ${player ? rotPlayerHtml(player, e) : ''}`;
}

function rotScopeText(a) {
  const r = a.reference;
  if (r.scope === 'bible-boss' || r.scope === 'bible-spec') {
    const where = r.scope === 'bible-boss' ? trLang('sur ce boss', 'on this boss') : trLang('tous boss', 'all bosses');
    return trLang(`rang parmi ${r.n} logs de ${a.spec} autour de la médiane de DPS sur lostark.bible, ${where} (pas assez de logs dans les références locales). Sans le détail des coups : compétences et placement seulement, rythmes sur toute la durée du combat`,
      `rank among ${r.n} ${a.spec} logs around the median DPS on lostark.bible, ${where} (not enough logs in the local references). Without hit details: skills and positioning only, rates over the whole fight`);
  }
  return r.scope === 'boss'
    ? trLang(`rang parmi ${r.n} logs de ${a.spec} sur ce boss`, `rank among ${r.n} ${a.spec} logs on this boss`)
    : trLang(`rang parmi ${r.n} logs de ${a.spec}, tous boss (pas assez sur celui-ci)`, `rank among ${r.n} ${a.spec} logs, all bosses (not enough on this one)`);
}

function rotPartsHtml(a) {
  const p = a.score.parts;
  const labels = a.support
    ? [['ap', trLang('Buff d\'attaque', 'Attack buff')], ['brand', trLang('Marque', 'Brand')], ['identity', trLang('Identité', 'Identity')], ['hat', 'T'], ['activity', trLang('Activité', 'Activity')]]
    : [['activity', trLang('Activité', 'Activity')], ['skills', trLang('Compétences', 'Skills')], ['buffs', trLang('Buffs', 'Buffs')], ['positional', trLang('Placement', 'Positioning')]];
  return labels.map(([k, l]) => `<div class="belg-card"><span class="belg-card-label">${l}</span><span class="belg-card-value rot-part">${p[k] ?? '—'}</span></div>`).join('');
}

function rotPlayerHtml(a, enc) {
  const lang = isEnLang() ? 'en' : 'fr';
  let head;
  if (a.score && a.score.score != null) {
    head = `<div class="rot-score-row">
        <div class="rot-score">${rotGradeHtml(a.score.score, true, a.scoreTop)}<span class="rot-score-value">${a.score.score}</span><span class="rot-dim">/ 100</span>${rotTopHtml(a.scoreTop)}</div>
        ${rotCoverageHtml(a)}
        <div class="rot-score-text">${trLang('Note d\'exécution : ', 'Execution score: ')}${escapeHtml(rotScopeText(a))}.
          <span class="rot-dim">${trLang('Lettre d\'après ton Top : S = 5 % du haut, A = quart du haut, B = moitié haute, C = moitié basse, D = quart du bas. La note ne dépend pas de ton équipement : elle compare ta façon de jouer.', 'Letter from your Top: S = top 5%, A = top quarter, B = upper half, C = lower half, D = bottom quarter. The score does not depend on your gear: it compares how you play.')}</span>
          <span class="rot-dim">${a.scoreTop != null ? trLang(`Top ${a.scoreTop} % : part des ${a.reference.n} logs de référence qui ont une note au moins aussi bonne.`, `Top ${a.scoreTop}%: share of the ${a.reference.n} reference logs with a score at least as good.`) : ''}</span>
          <span class="rot-dim">${a.coverageMean != null ? trLang('Couverture brute : moyenne simple de la part des dégâts du groupe sous ton buff d\'attaque, ta Marque et ton identité. Même idée que la « Buff Performance » de lostark.bible, dont la formule n\'est pas publiée : les chiffres ne sont pas identiques. Son « Top » compare aussi d\'autres joueurs (tous les logs envoyés, à CP proche).', 'Raw coverage: plain average of the party damage share under your attack buff, Brand and identity. Same idea as lostark.bible\'s “Buff Performance”, whose formula is not published: the numbers are not identical. Its “Top” also compares other players (all uploaded logs, at similar CP).') : ''}</span></div>
      </div>
      <div class="belg-cards rot-parts">${rotPartsHtml(a)}</div>`;
  } else if (a.support && a.ref && !a.supportCoverage) {
    head = `<p class="belg-empty">${trLang('Pas de note : la couverture du groupe n\'est pas calculée (groupe sans DPS ou avec deux supports).', 'No score: party coverage is not computed (party without DPS or with two supports).')}</p>`;
  } else if (a.support && a.ref && !a.ref.support) {
    head = `<p class="belg-empty">${trLang(`Pas de note : les logs de référence de ${escapeHtml(a.spec || '?')} n'ont pas la couverture du groupe (logs lostark.bible). Les mesures ci-dessous restent valables.`, `No score: the ${escapeHtml(a.spec || '?')} reference logs have no party coverage (lostark.bible logs). The measures below still apply.`)}</p>`;
  } else {
    head = `<p class="belg-empty">${trLang(`Pas encore assez de logs de référence pour ${escapeHtml(a.spec || '?')} (il en faut au moins 8) : pas de note ni de conseils comparés. Les mesures ci-dessous restent valables.`, `Not enough reference logs for ${escapeHtml(a.spec || '?')} yet (at least 8 needed): no score or compared advice. The measures below still apply.`)}</p>`;
  }

  // Sans référence, seuls les objectifs d'un guide de classe (s'il y en a un pour la spé).
  const advice = rot.mods.coach.coachPlayer(a, a.ref, rot.refData?.builds?.[a.spec], { lang, arkPassiveNames: rot.skillData?.arkPassive || {}, skillMeta: rot.skillData?.skills || {}, guides: rot.guides, scope: a.reference?.scope });
  const main = advice.filter(c => c.kind !== 'build');
  const shown = [...main.slice(0, ROT_MAX_ADVICE), ...advice.filter(c => c.kind === 'build')];
  let adviceHtml = '';
  // Support sans note (couverture absente) : pas de « rien ne ressort », rien n'a pu être comparé
  const scored = a.score && a.score.score != null;
  if (advice.length || (a.ref && (scored || !a.support))) {
    adviceHtml = shown.length
      ? shown.map((c, i) => rotAdviceHtml(c, i)).join('') + (main.length > ROT_MAX_ADVICE ? `<p class="belg-note">${rotMoreText(main.length - ROT_MAX_ADVICE)}</p>` : '')
      : `<p class="belg-empty">${['boss', 'bible-boss'].includes(a.reference?.scope)
        ? trLang('Rien ne ressort : tu joues comme les meilleurs de ta spé sur ce boss.', 'Nothing stands out: you play like the best of your spec on this boss.')
        : trLang('Rien ne ressort : tu joues comme les meilleurs de ta spé (tous boss confondus).', 'Nothing stands out: you play like the best of your spec (across all bosses).')}</p>`;
  }

  return `<div class="belg-panel rot-player">
      <h3>${escapeHtml(a.name)} <span class="rot-dim">${escapeHtml(a.className)} · ${escapeHtml(a.spec || '')}</span></h3>
      ${head}
      ${adviceHtml ? `<h4 class="rot-h4">${trLang('Comment progresser', 'How to improve')}</h4>${adviceHtml}` : ''}
      <details class="rot-details"><summary>${trLang('Détail des mesures', 'Measure details')}</summary>${rotMeasuresHtml(a)}</details>
    </div>`;
}

function rotMoreText(n) {
  return n === 1
    ? trLang('…et 1 point moins important : commence par ceux-là.', '…and 1 smaller point: work on these first.')
    : trLang(`…et ${n} points moins importants : commence par ceux-là.`, `…and ${n} smaller points: work on these first.`);
}

function rotAdviceHtml(c, i) {
  const gain = c.gainPct != null ? `<span class="rot-gain">≈ +${rotNum(c.gainPct)}${isEnLang() ? '%' : ' %'} ${trLang('de dégâts', 'damage')}</span>` : '';
  const how = c.how.length ? `<ul class="rot-how">${c.how.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>` : '';
  const moments = c.moments.length ? `<ul class="rot-moments">${c.moments.map(m => `<li>${escapeHtml(m.text)}</li>`).join('')}</ul>` : '';
  return `<div class="rot-advice${c.kind === 'build' ? ' rot-advice-build' : ''}">
      <div class="rot-advice-title"><span class="rot-advice-num">${i + 1}</span>${escapeHtml(c.title)}${gain}</div>
      <p>${escapeHtml(c.what)}</p>
      <p class="rot-why">${escapeHtml(c.why)}</p>
      ${how}${moments}${c.source?.url ? `<p class="rot-source"><a href="${escapeHtml(c.source.url)}" target="_blank" rel="noopener">${trLang('Lire le guide', 'Read the guide')}</a></p>` : ''}
    </div>`;
}

function rotMeasuresHtml(a) {
  const parts = [];
  parts.push(`<p>${trLang(`Temps perdu : ${rotClock(a.lostMs)} sur ${rotClock(a.availableMs - a.deadMs)} jouables (activité ${rotPct(a.activity)})${a.deadMs >= 1000 ? `, ${rotClock(a.deadMs)} à terre` : ''}.`, `Lost time: ${rotClock(a.lostMs)} out of ${rotClock(a.availableMs - a.deadMs)} playable (activity ${rotPct(a.activity)})${a.deadMs >= 1000 ? `, ${rotClock(a.deadMs)} dead` : ''}.`)}
    ${a.sharedPauseMs >= 1000 ? trLang(`Pauses partagées avec d'autres DPS (mécanique probable, non comptées) : ${rotClock(a.sharedPauseMs)}.`, `Pauses shared with other DPS (likely a mechanic, not counted): ${rotClock(a.sharedPauseMs)}.`) : ''}</p>`);
  const gaps = a.longestGaps.filter(g => g.lostMs >= 2000);
  if (gaps.length) parts.push(`<ul class="rot-moments">${gaps.map(g => `<li>${rotClock(g.from)} → ${rotClock(g.to)}${trLang(' : ', ': ')}${rotNum(g.lostMs / 1000)} s ${trLang('sans compétence', 'without a skill')}${g.shared ? ` <span class="rot-dim">(${trLang('pause partagée : ', 'shared pause: ')}${escapeHtml(g.pausedWith.join(', '))})</span>` : ''}</li>`).join('')}</ul>`);
  if (a.supportCoverage) {
    const c = a.supportCoverage, rs = a.ref?.support;
    const med = k => (rs?.[k] ? ` <span class="rot-dim">(${trLang('médiane', 'median')} ${rotPct(rs[k][10])}, ${trLang('top 10 %', 'top 10%')} ${rotPct(rs[k][18])})</span>` : '');
    parts.push(`<p>${trLang('Couverture du groupe (part des dégâts des DPS sous ton buff) :', 'Party coverage (share of DPS damage under your buff):')}</p>
      <ul class="rot-moments"><li>${trLang('Buff d\'attaque', 'Attack buff')} ${rotPct(c.ap)}${med('ap')}</li><li>${trLang('Marque', 'Brand')} ${rotPct(c.brand)}${med('brand')}</li><li>${trLang('Identité', 'Identity')} ${rotPct(c.identity)}${med('identity')}</li><li>T ${rotPct(c.hat)}${med('hat')}</li></ul>`);
  } else if (!a.support) {
    parts.push(`<p>${trLang(`Buffs : buff d'attaque du support sur ${rotPct(a.apRate)} de tes dégâts, Marque ${rotPct(a.brandRate)}, les deux ${rotPct(a.fullBuffRate)}, identité ${rotPct(a.identityRate)}, T ${rotPct(a.hatRate)}.`, `Buffs: support attack buff on ${rotPct(a.apRate)} of your damage, Brand ${rotPct(a.brandRate)}, both ${rotPct(a.fullBuffRate)}, identity ${rotPct(a.identityRate)}, T ${rotPct(a.hatRate)}.`)}</p>`);
  }
  if (a.positionalShare >= 0.05) parts.push(`<p>${trLang(`Placement : ${rotPct(a.positionalRate)} des dégâts des compétences à placement du bon côté (${rotPct(a.positionalShare)} de tes dégâts).`, `Positioning: ${rotPct(a.positionalRate)} of positional skill damage from the right side (${rotPct(a.positionalShare)} of your damage).`)}</p>`);

  const scored = new Map((a.score?.skillScores || []).map(s => [s.id, s]));
  const skills = a.skills.filter(s => (a.support ? s.casts > 0 && (scored.has(s.id) || s.share >= 0.02) : s.share >= 0.005 || scored.has(s.id)));
  const rows = skills.map(s => {
    const sc = scored.get(s.id);
    return `<tr><td>${escapeHtml(s.name)}</td><td class="market-num">${rotPct(s.share)}</td><td class="market-num">${s.casts}</td><td class="market-num">${rotNum(s.cpm)}</td>
      <td class="market-num">${sc ? `${rotNum(sc.refCpmMedian)} / ${rotNum(sc.refCpmP90)}` : ''}</td><td class="market-num">${sc?.rank ?? ''}</td>
      <td class="market-num">${s.positional ? rotPct(s.positionalRate) : ''}</td><td class="market-num">${rotPct(s.fullBuffRate)}</td></tr>`;
  }).join('');
  const absent = (a.score?.skillScores || []).filter(s => s.absent)
    .map(s => `<li>${escapeHtml(s.name)}${trLang(' : ', ': ')}${trLang(`absente, jouée par la plupart des ${escapeHtml(a.spec)} (${rotNum(s.refCpmMedian)} /min en médiane)`, `missing, played by most ${escapeHtml(a.spec)} players (${rotNum(s.refCpmMedian)}/min median)`)}</li>`).join('');
  parts.push(`<div class="table-container"><table class="market-table rot-table rot-skills">
    <thead><tr><th>${trLang('Compétence', 'Skill')}</th><th>${trLang('Dégâts', 'Damage')}</th><th>${trLang('Util.', 'Uses')}</th><th>/min</th>
      <th title="${trLang('Utilisations par minute de la spé : médiane / meilleurs (90e centile)', 'Spec uses per minute: median / best (90th percentile)')}">${trLang('Réf. /min', 'Ref. /min')}</th><th>${trLang('Rang', 'Rank')}</th>
      <th>${trLang('Placement', 'Positioning')}</th><th>${trLang('PA + Marque', 'AP + Brand')}</th></tr></thead>
    <tbody>${rows}</tbody></table></div>${absent ? `<ul class="rot-moments">${absent}</ul>` : ''}`);
  parts.push(`<p class="belg-note">${trLang('Ouverture : ', 'Opener: ')}${a.opener.map(o => `${escapeHtml(o.name)} (${rotNum(o.t / 1000)} s)`).join(' → ')}</p>`);
  if (rot.refData) parts.push(`<p class="belg-note">${trLang(`Références : ${rot.refData.encounters} combats et ${rot.refData.players} joueurs depuis le ${rot.refData.since}, enregistrés par LOA Logs. Les rangs comparent aux joueurs de la même spé.`, `References: ${rot.refData.encounters} fights and ${rot.refData.players} players since ${rot.refData.since}, recorded by LOA Logs. Ranks compare with players of the same spec.`)}</p>`);
  return parts.join('');
}

function initRotationTab() {
  const input = document.getElementById('rotFile');
  if (!input) return;
  input.addEventListener('change', () => {
    const f = input.files && input.files[0];
    if (f) { rot.handle = null; rotOpenSafely(f); }
    input.value = ''; // rechoisir le même fichier (modifié par LOA Logs) relance la lecture
  });
  if (ROT_CAN_HANDLE) {
    // Accès direct au fichier à la place du sélecteur classique (même bouton).
    input.closest('label')?.addEventListener('click', e => { e.preventDefault(); if (!rot.busy) rotPick(); });
    rot.syncTimer = setInterval(rotSyncTick, ROT_SYNC_MS);
    document.addEventListener('visibilitychange', rotSyncTick);
  }
  // Pendant une lecture ou une analyse, les commandes attendent (une seule opération à la fois sur la base)
  document.getElementById('rotResume')?.addEventListener('click', () => { if (!rot.busy) rotResume(); });
  document.getElementById('rotSync')?.addEventListener('click', () => rotSync({ manual: true }));
  document.getElementById('rotLatest')?.addEventListener('click', () => { if (rot.busy) return; rot.dayFilter = ''; rotListRaids(); });
  document.getElementById('rotDate')?.addEventListener('change', e => {
    if (rot.busy) { e.target.value = rot.dayFilter; return; }
    rot.dayFilter = e.target.value || ''; rotListRaids();
  });
  const pane = document.getElementById('tab-rotation');
  const pick = (target, attr, fn) => {
    const row = target.closest(`[${attr}]`);
    if (row) fn(row.getAttribute(attr));
  };
  pane.addEventListener('click', e => {
    if (rot.busy) return;
    pick(e.target, 'data-rot-encounter', id => rotAnalyze(+id));
    pick(e.target, 'data-rot-player', name => { rot.selected = name; renderRotationTab(); });
  });
  pane.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || rot.busy) return;
    pick(e.target, 'data-rot-encounter', id => rotAnalyze(+id));
    pick(e.target, 'data-rot-player', name => { rot.selected = name; renderRotationTab(); });
  });
  renderRotationTab();
}
