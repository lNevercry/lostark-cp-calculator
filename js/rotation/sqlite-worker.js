// Worker : lit encounters.db (base de LOA Logs) choisi par l'utilisateur, sans le copier ni l'envoyer.
// SQLite (WebAssembly, js/rotation/vendor) lit le fichier par un VFS en lecture seule : chaque lecture de page devient
// une lecture synchrone d'un morceau du File (FileReaderSync, réservé aux workers). Seules les pages utiles aux
// requêtes sont lues, quelle que soit la taille de la base (~1 Go après quelques mois de raids).
//
// Messages : { id, type: 'open', file } → { tables } ; { id, type: 'list', opts } → combats ;
// { id, type: 'analyze', encounterId } → combat analysé (metrics.mjs), sans les coups bruts.
import sqlite3InitModule from './vendor/sqlite3.js';
import { listRaids, loadEncounter } from './encounters.js';
import { analyzeEncounter } from './metrics.js';

const VFS_NAME = 'loalogs-file';
const CHUNK = 64 * 1024;       // lectures alignées de 64 Ko : les pages de débordement des grosses colonnes se suivent
const CACHE_CHUNKS = 128;      // 8 Mo de cache

let sqlite3 = null, db = null, file = null, meta = null, readError = null;
const reader = new FileReaderSync();
const cache = new Map();

function chunk(index) {
  let buf = cache.get(index);
  if (buf) { cache.delete(index); cache.set(index, buf); return buf; }
  buf = new Uint8Array(reader.readAsArrayBuffer(file.slice(index * CHUNK, (index + 1) * CHUNK)));
  // Base en mode WAL (octets 18-19 = 2) : on la lit comme une base classique, sans fichier -wal (seul le fichier
  // principal est choisi ; les combats encore dans le -wal manquent, LOA Logs les y écrit à sa fermeture).
  if (index === 0 && buf.length > 19 && buf[18] === 2 && buf[19] === 2) { buf[18] = 1; buf[19] = 1; }
  cache.set(index, buf);
  if (cache.size > CACHE_CHUNKS) cache.delete(cache.keys().next().value);
  return buf;
}

function readInto(dest, offset, n) {
  let done = 0;
  while (done < n) {
    const pos = offset + done, c = chunk(Math.floor(pos / CHUNK)), at = pos % CHUNK;
    if (at >= c.length) break;
    const take = Math.min(n - done, c.length - at);
    dest.set(c.subarray(at, at + take), done);
    done += take;
  }
  return done;
}

function installFileVfs() {
  const { capi, wasm } = sqlite3;
  const io = new capi.sqlite3_io_methods();
  io.$iVersion = 1;
  const READONLY = capi.SQLITE_READONLY;
  sqlite3.vfs.installVfs({
    io: {
      struct: io,
      methods: {
        xClose: () => 0,
        xRead(pFile, pDest, n, offset64) {
          const dest = wasm.heap8u().subarray(Number(pDest), Number(pDest) + n);
          let got;
          // Fichier modifié depuis qu'il a été choisi (LOA Logs a enregistré un combat) : le navigateur refuse de le
          // relire (NotReadableError). Ne jamais laisser une exception traverser SQLite.
          try { got = readInto(dest, Number(offset64), n); } catch (e) { readError = e; return capi.SQLITE_IOERR_READ; }
          if (got < n) { dest.fill(0, got); return capi.SQLITE_IOERR_SHORT_READ; }
          return 0;
        },
        xWrite: () => READONLY,
        xTruncate: () => READONLY,
        xSync: () => 0,
        xFileSize(pFile, pSz64) { wasm.poke64(pSz64, BigInt(file.size)); return 0; },
        xLock: () => 0,
        xUnlock: () => 0,
        xCheckReservedLock(pFile, pOut) { wasm.poke(pOut, 0, 'i32'); return 0; },
        xFileControl: () => capi.SQLITE_NOTFOUND,
        xSectorSize: () => 4096,
        xDeviceCharacteristics: () => capi.SQLITE_IOCAP_IMMUTABLE,
      },
    },
  });
  const vfs = new capi.sqlite3_vfs();
  const pDefault = capi.sqlite3_vfs_find(null);
  const dVfs = new capi.sqlite3_vfs(pDefault);
  vfs.$iVersion = 2;
  vfs.$szOsFile = capi.sqlite3_file.structInfo.sizeof;
  vfs.$mxPathname = 1024;
  vfs.$xRandomness = dVfs.$xRandomness;
  vfs.$xSleep = dVfs.$xSleep;
  dVfs.dispose();
  sqlite3.vfs.installVfs({
    vfs: {
      struct: vfs,
      name: VFS_NAME,
      methods: {
        xOpen(pVfs, zName, pFile, flags, pOutFlags) {
          // Seul le fichier principal existe : pas de journal ni de fichier temporaire (base ouverte en immutable).
          if (!(flags & capi.SQLITE_OPEN_MAIN_DB)) return capi.SQLITE_CANTOPEN;
          const f = new capi.sqlite3_file(pFile);
          f.$pMethods = io.pointer;
          f.dispose();
          wasm.poke(pOutFlags, capi.SQLITE_OPEN_READONLY, 'i32');
          return 0;
        },
        xDelete: () => capi.SQLITE_IOERR_DELETE,
        xAccess(pVfs, zName, flags, pOut) { wasm.poke(pOut, 0, 'i32'); return 0; },
        xFullPathname(pVfs, zName, nOut, pOut) { return wasm.cstrncpy(pOut, zName, nOut) < nOut ? 0 : capi.SQLITE_CANTOPEN; },
        xGetLastError: () => 0,
        xCurrentTime(pVfs, pOut) { wasm.poke(pOut, 2440587.5 + Date.now() / 864e5, 'double'); return 0; },
        xCurrentTimeInt64(pVfs, pOut) { wasm.poke(pOut, 0xbfc83e532200 + Date.now(), 'i64'); return 0; },
      },
    },
  });
}

async function gunzipJson(v) {
  if (v == null) return null;
  if (typeof v === 'string') return v ? JSON.parse(v) : null;
  const text = await new Response(new Blob([v]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(text);
}

const adapter = {
  get: (sql, args = []) => db.selectObject(sql, args),
  all: (sql, args = []) => db.selectObjects(sql, args),
  unpack: gunzipJson,
};

async function open(f) {
  if (!sqlite3) {
    sqlite3 = await sqlite3InitModule({ print: () => {}, printErr: () => {} });
    installFileVfs();
  }
  if (db) { db.close(); db = null; }
  file = f;
  cache.clear();
  const head = new TextDecoder().decode(chunk(0).subarray(0, 15));
  if (head !== 'SQLite format 3') throw new Error('not-sqlite');
  db = new sqlite3.oo1.DB({ filename: 'file:encounters.db?immutable=1', flags: 'r', vfs: VFS_NAME });
  const tables = db.selectValues(`SELECT name FROM sqlite_master WHERE type = 'table'`);
  if (!['encounter_preview', 'encounter', 'entity'].every(t => tables.includes(t))) throw new Error('not-loalogs');
  const range = db.selectObject('SELECT MIN(fight_start) AS first, MAX(fight_start) AS last, COUNT(*) AS n FROM encounter_preview');
  return { size: f.size, first: range.first, last: range.last, encounters: range.n };
}

async function skillData() {
  if (!meta) {
    const r = await fetch(new URL('../../data/rotation-skills.json', import.meta.url));
    if (!r.ok) throw new Error('skills-meta');
    meta = await r.json();
  }
  return meta;
}

// Résultat de metrics.mjs pour chaque joueur, sans les coups bruts (seulement les champs calculés).
async function analyze(encounterId) {
  const enc = await loadEncounter(adapter, encounterId);
  const data = await skillData();
  const result = analyzeEncounter(enc, { skillMeta: data.skills, buffMeta: data.buffs });
  return {
    encounter: { id: enc.id, boss: enc.boss, difficulty: enc.difficulty, durationMs: enc.durationMs, timelineMs: enc.timelineMs, fightStart: enc.fightStart, localPlayer: enc.localPlayer, bibleId: enc.bibleId },
    downtime: result.downtime,
    players: result.players,
  };
}

async function handle({ id, type, ...data }) {
  readError = null;
  try {
    let result;
    if (type === 'open') result = await open(data.file);
    // Base fermée par une ouverture ratée (fichier en cours d'écriture) : même traitement qu'un fichier modifié,
    // l'onglet le rouvre et refait l'action
    else if ((type === 'list' || type === 'analyze') && !db) throw new Error('file-changed');
    else if (type === 'list') result = await listRaids(adapter, { ...data.opts, bosses: Object.keys((await skillData()).raids || {}) });
    else if (type === 'analyze') result = await analyze(data.encounterId);
    else throw new Error(`unknown message ${type}`);
    self.postMessage({ id, ok: true, result });
  } catch (e) {
    self.postMessage({ id, ok: false, error: readError ? 'file-changed' : String(e?.message || e) });
  }
}

// Messages traités un par un : une ouverture ne ferme jamais la base pendant une liste ou une analyse en cours
// (et readError reste celui de l'opération en cours)
let queue = Promise.resolve();
self.onmessage = ({ data }) => { queue = queue.then(() => handle(data)); };
