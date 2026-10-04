/**
 * Lost Ark Local Raid Sync Agent (Client Version)
 * https://lostark.nevercry-prox.com
 *
 * Lit la base SQLite locale de LOA Logs : %LOCALAPPDATA%\LOA Logs\encounters.db
 * Expose une API locale sécurisée sur http://127.0.0.1:4848/api/raid-status
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = 4848;

function getDatabasePath() {
  if (process.env.LOA_DB_PATH && fs.existsSync(process.env.LOA_DB_PATH)) {
    return process.env.LOA_DB_PATH;
  }
  const customArg = process.argv.slice(2).find(a => a.endsWith('.db'));
  if (customArg && fs.existsSync(customArg)) {
    return customArg;
  }

  const localAppData = process.env.LOCALAPPDATA || (
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : ''
  );

  const defaultPath = path.join(localAppData, 'LOA Logs', 'encounters.db');
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }

  const altPath = path.join(localAppData, 'LostArkLogs', 'encounters.db');
  if (fs.existsSync(altPath)) {
    return altPath;
  }

  return defaultPath;
}

const RAID_REWARDS = {
  horizon_cathedral: {
    name: 'Horizon Cathedral',
    icon: '🏛️',
    normal: { g1: 13500, g2: 16500, chest1: 2500, chest2: 3500, total: 30000, ilvl: 1700 },
    hard: { g1: 16000, g2: 24000, chest1: 3000, chest2: 4500, total: 40000, ilvl: 1720 },
    nightmare: { g1: 20000, g2: 30000, chest1: 3500, chest2: 5500, total: 50000, ilvl: 1750 }
  },
  serca: {
    name: 'Serca',
    icon: '🥀',
    normal: { g1: 14000, g2: 21000, chest1: 2500, chest2: 4000, total: 35000, ilvl: 1710 },
    hard: { g1: 18000, g2: 26000, chest1: 3500, chest2: 5000, total: 44000, ilvl: 1730 },
    nightmare: { g1: 22000, g2: 32000, chest1: 4000, chest2: 6000, total: 54000, ilvl: 1740 }
  },
  final_act_kazeros: {
    name: 'Final Act: Kazeros',
    icon: '👑',
    normal: { g1: 14000, g2: 26000, chest1: 2500, chest2: 5000, total: 40000, ilvl: 1710 },
    hard: { g1: 17000, g2: 35000, chest1: 3500, chest2: 6500, total: 52000, ilvl: 1730 },
    nightmare: { g1: 25000, g2: 40000, chest1: 4500, chest2: 7500, total: 65000, ilvl: 1750 }
  }
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
  const last = getLastWednesdayReset();
  const next = new Date(last.getTime());
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

function mapBossToRaid(boss, diff) {
  if (!boss) return null;
  const b = boss.toLowerCase();
  const d = (diff || '').toLowerCase();

  if (b.includes('archbishop') || b.includes('arcenos')) {
    const gate = b.includes('archbishop') ? 1 : 2;
    let mode = 'normal';
    if (d.includes('3') || d.includes('nightmare')) mode = 'nightmare';
    else if (d.includes('2') || d.includes('hard')) mode = 'hard';
    return { raidKey: 'horizon_cathedral', gate, mode };
  }

  if (b.includes('serca') || b.includes('corvus')) {
    const gate = b.includes('serca') ? 1 : 2;
    let mode = 'normal';
    if (d.includes('nightmare')) mode = 'nightmare';
    else if (d.includes('hard')) mode = 'hard';
    return { raidKey: 'serca', gate, mode };
  }

  if (b.includes('kazeros') || b.includes('archdemon') || b.includes('death incarnate')) {
    const gate = (b.includes('abyss lord') || b.includes('abyss')) ? 1 : 2;
    let mode = 'normal';
    if (d.includes('nightmare')) mode = 'nightmare';
    else if (d.includes('hard')) mode = 'hard';
    return { raidKey: 'final_act_kazeros', gate, mode };
  }

  return null;
}

function discoverPlayerCharacters(db) {
  try {
    const rows = db.prepare(`
      SELECT local_player, COUNT(*) as cnt, MAX(fight_start) as last_seen
      FROM encounter_preview
      WHERE local_player IS NOT NULL 
        AND length(local_player) >= 2 
        AND local_player NOT IN ('0', 'You', 'Unknown', 'Player')
      GROUP BY local_player
      ORDER BY last_seen DESC
      LIMIT 18
    `).all();
    if (rows && rows.length > 0) {
      return rows.map(r => r.local_player);
    }
  } catch (e) {}
  return [];
}

const RAID_PATTERNS = {
  horizon_cathedral: ['arcenos', 'archbishop'],
  serca: ['serca', 'corvus'],
  final_act_kazeros: ['kazeros', 'archdemon']
};

function detectLatestMode(db, charKey, rKey) {
  try {
    const pats = RAID_PATTERNS[rKey] || [];
    const placeholders = pats.map(() => 'LOWER(current_boss) LIKE ?').join(' OR ');
    const params = [charKey.toLowerCase(), ...pats.map(p => '%' + p + '%')];
    const row = db.prepare(`
      SELECT current_boss, difficulty
      FROM encounter_preview
      WHERE LOWER(local_player) = ? AND (${placeholders})
      ORDER BY fight_start DESC
      LIMIT 1
    `).get(...params);
    if (row) {
      const mapped = mapBossToRaid(row.current_boss, row.difficulty);
      if (mapped && mapped.mode) return mapped.mode;
    }
  } catch (e) {}
  return 'normal';
}

function extractRaidStatus(extraNames = []) {
  const dbPath = getDatabasePath();
  const resetDate = getLastWednesdayReset();
  const nextResetDate = getNextWednesdayReset();
  const resetTime = resetDate.getTime();

  if (!fs.existsSync(dbPath)) {
    return {
      success: false,
      error: 'Fichier encounters.db introuvable',
      dbPath,
      dbFound: false,
      updatedAt: Date.now(),
      resetTimestamp: resetTime,
      nextResetTimestamp: nextResetDate.getTime(),
      roster: {}
    };
  }

  try {
    const db = new DatabaseSync(dbPath, { open: true, readOnly: true });
    const discovered = discoverPlayerCharacters(db);
    const allNames = Array.from(new Set([...extraNames, ...discovered]));

    const rosterData = {};
    allNames.forEach(name => {
      const key = name.toLowerCase();
      rosterData[key] = {
        name,
        raids: {
          horizon_cathedral: { g1: false, g2: false, mode: 'normal', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null },
          serca: { g1: false, g2: false, mode: 'normal', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null },
          final_act_kazeros: { g1: false, g2: false, mode: 'normal', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null }
        }
      };
    });

    allNames.forEach(name => {
      const key = name.toLowerCase();
      Object.keys(RAID_PATTERNS).forEach(rKey => {
        const detected = detectLatestMode(db, key, rKey);
        if (detected && rosterData[key] && rosterData[key].raids[rKey]) {
          rosterData[key].raids[rKey].mode = detected;
          rosterData[key].raids[rKey].modeAuto = true;
        }
      });
    });

    const clears = db.prepare(`
      SELECT id, fight_start, current_boss, difficulty, local_player, cleared
      FROM encounter_preview
      WHERE fight_start >= ? AND cleared = 1
      ORDER BY fight_start ASC
    `).all(resetTime);

    let clearedGatesCount = 0;

    clears.forEach(c => {
      const charKey = (c.local_player || '').toLowerCase();
      if (!rosterData[charKey]) return;

      const mapped = mapBossToRaid(c.current_boss, c.difficulty);
      if (!mapped) return;

      const raidObj = rosterData[charKey].raids[mapped.raidKey];
      if (!raidObj) return;

      if (mapped.gate === 1) {
        raidObj.g1 = true;
        raidObj.g1Time = c.fight_start;
        raidObj.g1Boss = c.current_boss;
        raidObj.mode = mapped.mode;
        clearedGatesCount++;
      } else if (mapped.gate === 2) {
        raidObj.g2 = true;
        raidObj.g2Time = c.fight_start;
        raidObj.g2Boss = c.current_boss;
        raidObj.mode = mapped.mode;
        clearedGatesCount++;
      }
    });

    let totalGoldEarned = 0;
    let completedRaidsCount = 0;

    Object.values(rosterData).forEach(ch => {
      Object.entries(ch.raids).forEach(([rKey, r]) => {
        const def = (RAID_REWARDS[rKey] && RAID_REWARDS[rKey][r.mode]) || RAID_REWARDS[rKey].normal;
        let charRaidGold = 0;
        if (r.g1) charRaidGold += def.g1;
        if (r.g2) charRaidGold += def.g2;
        r.earnedGold = charRaidGold;
        totalGoldEarned += charRaidGold;
        if (r.g1 && r.g2) completedRaidsCount++;
      });
    });

    return {
      success: true,
      dbFound: true,
      dbPath,
      updatedAt: Date.now(),
      resetTimestamp: resetTime,
      resetDateStr: resetDate.toISOString(),
      nextResetTimestamp: nextResetDate.getTime(),
      totalGoldEarned,
      completedRaidsCount,
      clearedGatesCount,
      totalRaids: allNames.length * 3,
      raidDefinitions: RAID_REWARDS,
      roster: rosterData
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      dbFound: true,
      dbPath,
      updatedAt: Date.now(),
      resetTimestamp: resetTime,
      nextResetTimestamp: nextResetDate.getTime(),
      roster: {}
    };
  }
}

// Origines autorisées : le site public (et ses prévisualisations), le serveur local CT 104, le développement local
function isAllowedOrigin(origin) {
  let u;
  try { u = new URL(origin); } catch (e) { return false; }
  if (u.protocol === 'https:' && (u.hostname === 'lostark-cp.pages.dev' || u.hostname.endsWith('.lostark-cp.pages.dev'))) return true;
  if (u.hostname === 'lostark.nevercry-prox.com') return true;
  if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '192.168.1.104')) return true;
  return false;
}

const server = http.createServer((req, res) => {
  // Seul le site du calculateur lit l'état des raids : un autre site ouvert dans le navigateur reçoit un 403
  // (sinon n'importe quelle page pourrait lire les personnages et l'or du joueur). Host contrôlé contre le
  // rebinding DNS. Sans en-tête Origin (page ouverte directement, curl) : accès normal.
  const host = String(req.headers.host || '');
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden host' }));
    return;
  }
  const origin = req.headers.origin;
  if (origin) {
    if (!isAllowedOrigin(origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden origin' }));
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  if (reqUrl.pathname === '/' || reqUrl.pathname === '/index.html') {
    const dbPath = getDatabasePath();
    const exists = fs.existsSync(dbPath);
    const status = exists ? extractRaidStatus() : null;
    const charNames = status && status.roster ? Object.values(status.roster).map(c => c.name) : [];

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Lost Ark Raid Agent - Status</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f17; color: #e2e8f0; padding: 40px 20px; margin: 0; }
    .card { background: #131b26; border: 1px solid #1e293b; border-radius: 14px; padding: 28px; max-width: 620px; margin: 0 auto; box-shadow: 0 12px 32px rgba(0,0,0,0.5); }
    h1 { margin-top: 0; color: #38bdf8; font-size: 22px; display: flex; align-items: center; justify-content: space-between; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; }
    .badge.ok { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .badge.warn { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .item { margin: 14px 0; font-size: 14px; }
    .label { color: #94a3b8; font-weight: 500; }
    .val { color: #f1f5f9; font-weight: 600; }
    .char-tag { display: inline-block; background: #1e293b; color: #38bdf8; padding: 4px 10px; border-radius: 6px; margin: 3px; font-size: 13px; font-weight: 500; border: 1px solid rgba(56,189,248,0.2); }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 13px; color: #94a3b8; text-align: center; }
    a { color: #38bdf8; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1><span>⚔️ Lost Ark Raid Agent</span> <span class="badge ${exists ? 'ok' : 'warn'}">${exists ? '🟢 Connecté (Prêt)' : '⚠️ Base introuvable'}</span></h1>
    <div class="item"><span class="label">Port local :</span> <span class="val">${PORT} (http://127.0.0.1:${PORT})</span></div>
    <div class="item"><span class="label">Fichier LOA Logs :</span> <span class="val" style="word-break:break-all;">${dbPath}</span></div>
    <div class="item"><span class="label">État de la base :</span> <span class="val">${exists ? 'Base SQLite détectée avec succès' : 'Introuvable dans AppData/Local/LOA Logs'}</span></div>
    ${status ? `
      <div class="item"><span class="label">Portes validées cette semaine :</span> <span class="val" style="color:#4ade80;">${status.clearedGatesCount} portes</span></div>
      <div class="item"><span class="label">Golds encaissés calculés :</span> <span class="val" style="color:#fbbf24;">${status.totalGoldEarned.toLocaleString()} g</span></div>
      <div class="item"><span class="label">Personnages détectés (${charNames.length}) :</span><br>
        <div style="margin-top:8px;">${charNames.map(n => `<span class="char-tag">${n}</span>`).join(' ') || 'Aucun combat récent'}</div>
      </div>
    ` : ''}
    <div class="footer">
      Ouvrez <a href="https://lostark.nevercry-prox.com" target="_blank">lostark.nevercry-prox.com</a> pour profiter de votre synchronisation en direct !
    </div>
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (reqUrl.pathname === '/api/raid-status' || reqUrl.pathname === '/raid-status') {
    const charsParam = reqUrl.searchParams.get('chars');
    const extraChars = charsParam ? charsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    const status = extractRaidStatus(extraChars);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(status, null, 2));
    return;
  }

  if (reqUrl.pathname === '/api/health' || reqUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const currentDbPath = getDatabasePath();
server.listen(PORT, '127.0.0.1', () => {
  console.log('====================================================');
  console.log('       LOST ARK RAID TRACKER - AGENT LOCAL');
  console.log('====================================================');
  console.log(`[OK] Agent démarré sur : http://127.0.0.1:${PORT}`);
  console.log(`[INFO] Base de données : ${currentDbPath}`);
  if (fs.existsSync(currentDbPath)) {
    console.log('[OK] Fichier encounters.db détecté avec succès !');
  } else {
    console.warn('[!] Attention : encounters.db est introuvable.');
    console.warn('    Assurez-vous que LOA Logs a bien été lancé.');
  }
  console.log('----------------------------------------------------');
  console.log('Ouvrez votre navigateur sur : https://lostark.nevercry-prox.com');
  console.log('Laissez cette fenêtre ouverte pendant vos raids.');
  console.log('====================================================');
});
