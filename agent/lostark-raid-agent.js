/**
 * Lost Ark Local Raid Sync Agent
 * Lit en direct C:\Users\Nevercry\AppData\Local\LOA Logs\encounters.db
 * Expose une API HTTP locale sur http://127.0.0.1:4848/api/raid-status
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = 4848;
const DB_PATH = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\Nevercry\\AppData\\Local',
  'LOA Logs',
  'encounters.db'
);

// Récompenses en Gold par Porte et par Difficulté
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

const ROSTER_NAMES = [
  'Neevercry',
  'Kaarlach',
  'Neeverslayer',
  'Neversup',
  'Jigokuushoujo',
  'Neverbreak'
];

function getLastWednesdayReset() {
  const d = new Date();
  const day = d.getUTCDay(); // 0: Dimanche, 3: Mercredi
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

  // 1. Horizon Cathedral (Archbishop Arcenos & Arcenos, Vanguard of Fanaticism)
  if (b.includes('archbishop') || b.includes('arcenos')) {
    const gate = b.includes('archbishop') ? 1 : 2;
    let mode = 'normal';
    if (d.includes('3') || d.includes('nightmare')) mode = 'nightmare';
    else if (d.includes('2') || d.includes('hard')) mode = 'hard';
    return { raidKey: 'horizon_cathedral', gate, mode };
  }

  // 2. Serca (Witch of Agony, Serca & Corvus Tul Rak)
  if (b.includes('serca') || b.includes('corvus')) {
    const gate = b.includes('serca') ? 1 : 2;
    let mode = 'normal';
    if (d.includes('nightmare')) mode = 'nightmare';
    else if (d.includes('hard')) mode = 'hard';
    return { raidKey: 'serca', gate, mode };
  }

  // 3. Final Act: Kazeros (Abyss Lord Kazeros & Archdemon / Death Incarnate Kazeros)
  if (b.includes('kazeros') || b.includes('archdemon') || b.includes('death incarnate')) {
    const gate = (b.includes('abyss lord') || b.includes('abyss')) ? 1 : 2;
    let mode = 'normal';
    if (d.includes('nightmare')) mode = 'nightmare';
    else if (d.includes('hard')) mode = 'hard';
    return { raidKey: 'final_act_kazeros', gate, mode };
  }

  return null;
}

function getPlayerCharacters(db) {
  try {
    const rows = db.prepare(`
      SELECT local_player, COUNT(*) as cnt, MAX(fight_start) as last_seen
      FROM encounter_preview
      WHERE local_player IS NOT NULL 
        AND length(local_player) >= 2 
        AND local_player NOT IN ('0', 'You', 'Unknown')
      GROUP BY local_player
      ORDER BY last_seen DESC
      LIMIT 12
    `).all();
    if (rows && rows.length > 0) {
      return rows.map(r => r.local_player);
    }
  } catch (e) {}
  return ROSTER_NAMES;
}

function extractRaidStatus(extraNames = []) {
  const resetDate = getLastWednesdayReset();
  const nextResetDate = getNextWednesdayReset();
  const resetTime = resetDate.getTime();

  let targetNames = Array.from(new Set([...extraNames, ...ROSTER_NAMES]));

  if (!fs.existsSync(DB_PATH)) {
    console.warn(`[AGENT] Base de données introuvable : ${DB_PATH}`);
    const fallbackRoster = {};
    targetNames.forEach(name => {
      const key = name.toLowerCase();
      fallbackRoster[key] = {
        name,
        raids: {
          horizon_cathedral: { g1: false, g2: false, mode: 'nightmare', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null },
          serca: { g1: false, g2: false, mode: 'nightmare', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null },
          final_act_kazeros: { g1: false, g2: false, mode: 'nightmare', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null }
        }
      };
    });
    return {
      success: false,
      error: 'Database not found',
      updatedAt: Date.now(),
      resetTimestamp: resetTime,
      nextResetTimestamp: nextResetDate.getTime(),
      roster: fallbackRoster
    };
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

  try {
    const db = new DatabaseSync(DB_PATH, { open: true, readOnly: true });

    // Découvrir dynamiquement les personnages locaux du joueur
    const discovered = getPlayerCharacters(db);
    targetNames = Array.from(new Set([...discovered, ...extraNames, ...ROSTER_NAMES]));

    // Initialisation de la structure pour chaque personnage
    const rosterData = {};
    targetNames.forEach(name => {
      const key = name.toLowerCase();
      rosterData[key] = {
        name,
        raids: {
          horizon_cathedral: {
            g1: false, g2: false, mode: 'nightmare', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null
          },
          serca: {
            g1: false, g2: false, mode: 'nightmare', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null
          },
          final_act_kazeros: {
            g1: false, g2: false, mode: 'nightmare', g1Time: null, g2Time: null, g1Boss: null, g2Boss: null
          }
        }
      };
    });

    // 1. Détecter automatiquement le mode préféré/habituel depuis l'historique complet
    targetNames.forEach(name => {
      const key = name.toLowerCase();
      Object.keys(RAID_PATTERNS).forEach(rKey => {
        const detected = detectLatestMode(db, key, rKey);
        if (detected && rosterData[key] && rosterData[key].raids[rKey]) {
          rosterData[key].raids[rKey].mode = detected;
          rosterData[key].raids[rKey].modeAuto = true;
        }
      });
    });

    // 2. Détecter les clears de la semaine en cours
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

    // Calcul du Gold total engrangé
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
      updatedAt: Date.now(),
      resetTimestamp: resetTime,
      resetDateStr: resetDate.toISOString(),
      nextResetTimestamp: nextResetDate.getTime(),
      totalGoldEarned,
      completedRaidsCount,
      clearedGatesCount,
      totalRaids: targetNames.length * 3,
      raidDefinitions: RAID_REWARDS,
      roster: rosterData
    };
  } catch (err) {
    console.error('[AGENT] Erreur lecture SQLite:', err);
    return {
      success: false,
      error: err.message,
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

// Serveur HTTP local ultra-léger
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

let lastJsonStr = '';
function syncLoop() {
  try {
    const status = extractRaidStatus();
    const jsonStr = JSON.stringify(status, null, 2);
    if (jsonStr !== lastJsonStr) {
      lastJsonStr = jsonStr;
      const dataDir = path.resolve(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, 'raid_status.json');
      fs.writeFileSync(filePath, jsonStr, 'utf8');
      console.log(`[AGENT] ${new Date().toLocaleTimeString()} • Données mises à jour (${status.clearedGatesCount} portes validées, ${status.totalGoldEarned.toLocaleString()} g)`);

      // Push to remote server in background if ssh is available
      try {
        const { exec } = require('child_process');
        exec(`scp "${filePath}" root@192.168.1.104:/opt/lostark-cp/public/data/raid_status.json`, (err) => {
          if (!err) {
            console.log(`[AGENT] Synchronisé avec succès sur le serveur distant.`);
          }
        });
      } catch (e) {}
    }
  } catch (err) {
    console.error('[AGENT] Erreur syncLoop:', err.message);
  }
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[AGENT] Lost Ark Raid Tracker Agent actif sur http://127.0.0.1:${PORT}/api/raid-status`);
  syncLoop();
  setInterval(syncLoop, 15000); // Check every 15s
});

module.exports = { extractRaidStatus, RAID_REWARDS };
