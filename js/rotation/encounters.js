// Lecture d'un combat dans la base de LOA Logs (encounters.db), commune à Node (tools/rotation/db.mjs, node:sqlite)
// et au navigateur (sqlite-worker.mjs, SQLite en WebAssembly). Les colonnes JSON (skills, damage_stats, buffs,
// debuffs, misc…) sont compressées en gzip.
//
// db = { get(sql, args), all(sql, args), unpack(valeur) } : chaque méthode peut renvoyer une promesse.

// Combats de raid exploitables : réussis, pas en solo ni en matchmaking, plus de 2 minutes.
export const RAID_FILTER = `p.cleared = 1 AND p.difficulty IS NOT NULL AND p.difficulty <> '' AND p.difficulty NOT IN ('Solo', 'Matching') AND p.duration > 120000`;

// Seulement les boss de raid (bosses : noms exacts, table raids de data/rotation-skills.json tirée de encounters.json de
// LOA Logs) : ni gardiens ni donjons du chaos, qui ne se comparent pas.
function bossFilter(bosses, where, args) {
  if (!bosses?.length) return;
  where.push(`p.current_boss IN (${bosses.map(() => '?').join(', ')})`);
  args.push(...bosses);
}

// from / to : bornes de fight_start (ms) ; player : nom exact d'un joueur du combat ; boss : texte du nom.
export async function listRaids(db, { player, boss, bosses, from, to, limit = 20 } = {}) {
  const where = [RAID_FILTER];
  const args = [];
  bossFilter(bosses, where, args);
  if (player) { where.push(`EXISTS (SELECT 1 FROM entity e WHERE e.encounter_id = p.id AND e.name = ? AND e.entity_type = 'PLAYER')`); args.push(player); }
  if (boss) { where.push('p.current_boss LIKE ?'); args.push(`%${boss}%`); }
  if (from != null) { where.push('p.fight_start >= ?'); args.push(from); }
  if (to != null) { where.push('p.fight_start < ?'); args.push(to); }
  return db.all(`SELECT p.id, p.fight_start, p.current_boss, p.difficulty, p.duration, p.local_player, s.upstream_id
    FROM encounter_preview p LEFT JOIN sync_logs s ON s.encounter_id = p.id
    WHERE ${where.join(' AND ')} ORDER BY p.fight_start DESC LIMIT ?`, [...args, limit]);
}

export async function raidIds(db, { bosses } = {}) {
  const where = [RAID_FILTER];
  const args = [];
  bossFilter(bosses, where, args);
  return (await db.all(`SELECT p.id FROM encounter_preview p WHERE ${where.join(' AND ')} ORDER BY p.id`, args)).map(r => r.id);
}

export async function loadEncounter(db, id) {
  const p = await db.get(`SELECT p.*, s.upstream_id FROM encounter_preview p LEFT JOIN sync_logs s ON s.encounter_id = p.id WHERE p.id = ?`, [id]);
  if (!p) throw new Error(`Combat ${id} introuvable`);
  const e = await db.get('SELECT buffs, debuffs, misc, last_combat_packet, applied_shield_buffs FROM encounter WHERE id = ?', [id]);
  const unpack = db.unpack;
  // support_* : pour un support, part des dégâts des DPS de son groupe (pondérée par leurs dégâts) faite sous son buff
  // de PA, sa Marque, son identité et sa T (compute_support_buffs de LOA Logs, groupes à un seul support).
  const rows = await db.all(`SELECT name, class, class_id, spec, combat_power, gear_score, skills, damage_stats, skill_stats,
      support_ap, support_brand, support_identity, support_hyper, rdps_damage_given, engravings, ark_passive_data
    FROM entity WHERE encounter_id = ? AND entity_type = 'PLAYER'`, [id]);
  const players = [];
  for (const r of rows) {
    players.push({
      name: r.name, className: r.class, classId: r.class_id, spec: r.spec || null,
      combatPower: r.combat_power, gearScore: r.gear_score,
      supportCoverage: { ap: r.support_ap, brand: r.support_brand, identity: r.support_identity, hat: r.support_hyper },
      rdpsGiven: r.rdps_damage_given || 0,
      engravings: (await unpack(r.engravings)) || [], arkPassive: (await unpack(r.ark_passive_data)) || null,
      skills: (await unpack(r.skills)) || {}, damageStats: (await unpack(r.damage_stats)) || {}, skillStats: (await unpack(r.skill_stats)) || {},
    });
  }
  // Attaques du boss : chaque utilisation datée (castLog) et dégâts totaux infligés aux joueurs par attaque.
  const bossAttacks = [];
  for (const r of await db.all(`SELECT skills FROM entity WHERE encounter_id = ? AND entity_type = 'BOSS'`, [id])) {
    for (const s of Object.values((await unpack(r.skills)) || {})) {
      if (s.totalDamage > 0 && s.castLog?.length) bossAttacks.push({ id: s.id, totalDamage: s.totalDamage, hits: s.hits || 0, castLog: s.castLog });
    }
  }
  return {
    // durationMs = durée affichée par LOA Logs, qui retire certains passages (ex. Kazeros) ; timelineMs = chronologie
    // complète des utilisations et des morts, jusqu'au dernier paquet de combat.
    id: p.id, boss: p.current_boss, difficulty: p.difficulty, durationMs: p.duration, fightStart: p.fight_start,
    timelineMs: Math.max(p.duration, (e.last_combat_packet || 0) - p.fight_start),
    localPlayer: p.local_player, bibleId: p.upstream_id || null,
    buffs: (await unpack(e.buffs)) || {}, debuffs: (await unpack(e.debuffs)) || {}, misc: (await unpack(e.misc)) || {},
    shieldBuffs: (await unpack(e.applied_shield_buffs)) || {}, bossAttacks,
    players,
  };
}
