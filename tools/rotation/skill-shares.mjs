// Part des dégâts de chaque compétence, par spé DPS : data/skill-shares.json, lu par le GPD (gemmes DPS, dpsGemSetGain).
// Logs de raid de la base LOA Logs locale et de lostark.bible réunis, une voix par joueur : la base locale vient des raids
// de l'auteur, ses propres personnages y font la majorité des logs de leur spé (ex. Slayer Predator : Brutal Impact 67 %
// des dégâts en local, 14 % sur lostark.bible). Part d'un joueur = médiane sur ses logs (0 quand il ne la lance pas) ;
// part de la spé = médiane sur les joueurs qui la lancent, dès 3 joueurs (pas le seuil de 10 % des références : une
// gemme sur une compétence d'un build minoritaire vaut sa part chez ceux qui la jouent, pas 0).
// Écrit par build-ref.mjs (--shares-out pour une autre sortie).
import { writeFileSync } from 'node:fs';
import { toQuantiles } from '../../js/rotation/metrics.js';

export const SHARES_MIN_PLAYERS = 5;
export const SHARES_MIN_USERS = 3;
const median = v => toQuantiles(v)?.[10] ?? null;

export function skillSharesFrom(records) {
  const bySpec = new Map();
  for (const r of records) {
    if (r.support || !r.spec || !r.player || !Array.isArray(r.skills)) continue;
    if (!bySpec.has(r.spec)) bySpec.set(r.spec, new Map());
    const players = bySpec.get(r.spec);
    if (!players.has(r.player)) players.set(r.player, []);
    players.get(r.player).push(r);
  }
  const specs = {};
  for (const [spec, players] of bySpec) {
    if (players.size < SHARES_MIN_PLAYERS) continue;
    const perSkill = new Map();
    let logs = 0;
    for (const rs of players.values()) {
      logs += rs.length;
      const ids = new Set(rs.flatMap(r => r.skills.map(s => s.id)));
      for (const id of ids) {
        const share = median(rs.map(r => (r.skills.find(s => s.id === id) || {}).share || 0));
        if (!(share > 0)) continue;
        if (!perSkill.has(id)) perSkill.set(id, { name: rs.flatMap(r => r.skills).find(s => s.id === id).name, shares: [] });
        perSkill.get(id).shares.push(share);
      }
    }
    const skills = {};
    for (const [id, k] of perSkill) {
      if (k.shares.length < SHARES_MIN_USERS) continue;
      skills[id] = [+median(k.shares).toFixed(4), k.name];
    }
    specs[spec] = { players: players.size, logs, skills };
  }
  return specs;
}

export function writeSkillShares(records, out, meta = {}) {
  const specs = skillSharesFrom(records);
  writeFileSync(out, JSON.stringify({ ...meta, specs }));
  return specs;
}
