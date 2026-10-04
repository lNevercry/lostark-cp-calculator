// Analyse de rotation d'un joueur sur un combat LOA Logs (prototype, phase 1).
// Module pur (sans Node) : réutilisable tel quel dans le navigateur.
//
// Données : skillCastLog de chaque compétence = utilisations (timestamp, last = dernier coup)
// et leurs coups (dégâts, crit, dos / face, buffs et debuffs actifs au moment du coup).
// Temps en ms depuis le début du combat.

// Groupes de buffs du jeu (uniqueGroup), mêmes règles que LOA Logs (src-tauri/src/data.rs).
export const SUPPORT_AP_GROUPS = new Set([101204, 101105, 314004, 480030]); // Barde, Paladin, Artiste, Valkyrie
export const SUPPORT_IDENTITY_GROUPS = new Set([211400, 368000, 310501, 480018]);
export const SUPPORT_BRAND_GROUPS = new Set([210230]);
export const HAT_BUFFS = new Set([362600, 212305, 319503, 319504, 485100, 362601, 212306, 319506, 485101]);
export const SUPPORT_SPECS = new Set(['Blessed Aura', 'Desperate Salvation', 'Full Bloom', 'Liberator']);

export const DOWNTIME_GAP_MS = 4000; // moins de la moitié du raid frappe pendant plus de 4 s : boss absent, non ciblable ou mécanique
export const DOWNTIME_BIN_MS = 500;
export const IDLE_TOLERANCE_MS = 1500; // battement normal entre deux compétences (déplacement, animation après le dernier coup)
export const SHARED_PAUSE_MIN_MS = 5000;
export const SHARED_PAUSE_MAX_COVER = 0.25; // un autre DPS « en pause » : des coups sur moins de 25 % du trou
export const BIG_SKILL_MIN_SHARE = 0.03;
export const BIG_SKILL_MIN_INTERVAL_MS = 15000;

const DMG_FLAG = 1;

export function isSupport(player) {
  return SUPPORT_SPECS.has(player.spec);
}

export function classifyBuffs(encounter) {
  const ap = new Set(), identity = new Set(), brand = new Set(), hat = new Set();
  for (const [id, b] of Object.entries(encounter.buffs || {})) {
    const n = +id;
    if (HAT_BUFFS.has(n)) { hat.add(n); continue; }
    if (b.buffCategory !== 'supportbuff' || !(b.buffType & DMG_FLAG)) continue;
    if (SUPPORT_AP_GROUPS.has(b.uniqueGroup)) ap.add(n);
    else if (SUPPORT_IDENTITY_GROUPS.has(b.uniqueGroup)) identity.add(n);
  }
  for (const [id, b] of Object.entries(encounter.debuffs || {})) {
    if (SUPPORT_BRAND_GROUPS.has(b.uniqueGroup) && (b.buffType & DMG_FLAG)) brand.add(+id);
  }
  return { ap, identity, brand, hat };
}

function castWindows(player) {
  const w = [];
  for (const s of Object.values(player.skills)) {
    for (const c of s.skillCastLog || []) w.push([c.timestamp, Math.max(c.last || c.timestamp, c.timestamp)]);
  }
  return w.sort((a, b) => a[0] - b[0]);
}

function hitWindows(player) {
  const w = [];
  for (const s of Object.values(player.skills)) {
    for (const c of s.skillCastLog || []) for (const h of c.hits || []) if (h.damage > 0) w.push([h.timestamp, h.timestamp]);
  }
  return w.sort((a, b) => a[0] - b[0]);
}

function mergeWindows(windows, joinGapMs) {
  const out = [];
  for (const [a, b] of windows) {
    const last = out[out.length - 1];
    if (last && a - last[1] <= joinGapMs) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

function overlap(a, b, intervals) {
  let t = 0;
  for (const [x, y] of intervals) t += Math.max(0, Math.min(b, y) - Math.max(a, x));
  return t;
}

// Périodes où personne dans le raid ne fait rien : boss absent, non ciblable, cinématique.
// Périodes où moins de la moitié du raid inflige des dégâts : boss absent, non ciblable, cinématique ou mécanique.
// Fondé sur les coups, pas sur les compétences lancées : un support qui buffe ou une compétence dans le vide
// pendant une phase sans boss ne compte pas (vérifié sur la G2 de la Cathédrale, ~13 s sans dégâts vers 7:40).
export function raidDowntime(encounter) {
  const bins = Math.ceil(encounter.timelineMs / DOWNTIME_BIN_MS) + 1;
  const active = new Uint8Array(bins);
  const players = encounter.players.filter(p => Object.values(p.skills).some(s => s.skillCastLog?.length));
  for (const p of players) {
    const seen = new Uint8Array(bins);
    for (const [a, b] of mergeWindows(hitWindows(p), IDLE_TOLERANCE_MS)) {
      for (let i = Math.floor(a / DOWNTIME_BIN_MS); i <= Math.min(bins - 1, Math.floor((b + IDLE_TOLERANCE_MS) / DOWNTIME_BIN_MS)); i++) seen[i] = 1;
    }
    for (let i = 0; i < bins; i++) active[i] += seen[i];
  }
  const need = Math.max(1, Math.ceil(players.length / 2));
  const down = [];
  let start = null;
  for (let i = 0; i <= bins; i++) {
    const quiet = i < bins && active[i] < need;
    if (quiet && start == null) start = i;
    if (!quiet && start != null) {
      if ((i - start) * DOWNTIME_BIN_MS > DOWNTIME_GAP_MS) down.push([start * DOWNTIME_BIN_MS, Math.min(encounter.timelineMs, i * DOWNTIME_BIN_MS)]);
      start = null;
    }
  }
  return down;
}

// Temps à terre (deathInfo : instant absolu de la mort, durée). Les morts après la fin du combat ne comptent pas.
function deathWindows(encounter, player) {
  return (player.damageStats.deathInfo || [])
    .map(d => [d.deathTime - encounter.fightStart, d.deathTime - encounter.fightStart + (d.deadFor || 0)])
    .filter(([a]) => a >= 0 && a < encounter.timelineMs)
    .map(([a, b]) => [a, Math.min(b, encounter.timelineMs)]);
}

export function quantile(sorted, q) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function analyzePlayer(encounter, player, { skillMeta = {}, buffMeta = {}, buffSets = classifyBuffs(encounter), downtime = raidDowntime(encounter), otherDps = dpsHitWindows(encounter) } = {}) {
  const durationMs = encounter.timelineMs;
  const downMs = downtime.reduce((t, [a, b]) => t + b - a, 0);
  const availableMs = Math.max(1, durationMs - downMs);
  const minutes = availableMs / 60000;

  // Temps sans action : écarts entre deux utilisations, hors périodes mortes du raid, au-delà du battement normal.
  const dead = deathWindows(encounter, player);
  const deadMs = dead.reduce((t, [a, b]) => t + b - a - overlap(a, b, downtime), 0);
  const excluded = mergeWindows([...downtime, ...dead].sort((x, y) => x[0] - y[0]), 0);
  const windows = mergeWindows(castWindows(player), 0);
  const gaps = [];
  let prev = 0;
  for (const [a, b] of [...windows, [durationMs, durationMs]]) {
    const raw = a - prev;
    const eff = raw - overlap(prev, a, excluded);
    if (eff > IDLE_TOLERANCE_MS) gaps.push({ from: prev, to: a, lostMs: eff - IDLE_TOLERANCE_MS });
    prev = Math.max(prev, b);
  }
  // Pause partagée : d'autres DPS sans dégâts au même moment (mécanique qui désigne certains joueurs, ex. Kazeros).
  // Il en faut au moins 2 (les 2 autres DPS d'un raid à 4), sur un trou d'au moins 5 s : plus court ou avec un
  // seul autre DPS, la coïncidence est fréquente (corrélation de l'activité avec DPS ÷ CP 0,58 → 0,50).
  const others = (otherDps || []).filter(o => o.name !== player.name);
  const need = Math.min(others.length, Math.max(2, Math.ceil(others.length / 3)));
  for (const g of gaps) {
    const span = g.to - g.from;
    g.pausedWith = others.filter(o => overlap(g.from, g.to, o.windows) < SHARED_PAUSE_MAX_COVER * span).map(o => o.name);
    g.shared = need >= 2 && span >= SHARED_PAUSE_MIN_MS && g.pausedWith.length >= need;
  }
  const lostMs = gaps.filter(g => !g.shared).reduce((t, g) => t + g.lostMs, 0);
  const sharedPauseMs = gaps.filter(g => g.shared).reduce((t, g) => t + g.lostMs, 0);

  const totalDamage = player.damageStats.damageDealt || Object.values(player.skills).reduce((t, s) => t + (s.totalDamage || 0), 0);
  const skills = [];
  const acc = { hitDmg: 0, ap: 0, brand: 0, identity: 0, hat: 0, full: 0, posDmg: 0, posOk: 0, bigDmg: 0, bigFull: 0 };

  for (const s of Object.values(player.skills)) {
    const casts = s.skillCastLog || [];
    if (!s.totalDamage && !casts.length) continue;
    const meta = skillMeta[s.id] || skillMeta[s.id - (s.id % 10)] || null;
    const mask = meta ? meta.dm : 0;
    const times = casts.map(c => c.timestamp).sort((a, b) => a - b);
    const iv = times.slice(1).map((t, i) => t - times[i]).sort((a, b) => a - b);
    const k = { hitDmg: 0, ap: 0, brand: 0, identity: 0, hat: 0, full: 0, posOk: 0 };
    const castBuffs = []; // par utilisation : PA et Marque présents sur son premier coup
    for (const c of casts) {
      const h = (c.hits || []).find(x => x.damage > 0);
      if (h) castBuffs.push({ t: c.timestamp, ap: (h.buffedBy || []).some(b => buffSets.ap.has(b)), brand: (h.debuffedBy || []).some(b => buffSets.brand.has(b)) });
    }
    for (const c of casts) for (const h of c.hits || []) {
      const d = h.damage || 0;
      const buffs = h.buffedBy || [], debuffs = h.debuffedBy || [];
      const hasAp = buffs.some(b => buffSets.ap.has(b));
      const hasBrand = debuffs.some(b => buffSets.brand.has(b));
      k.hitDmg += d;
      if (hasAp) k.ap += d;
      if (hasBrand) k.brand += d;
      if (hasAp && hasBrand) k.full += d;
      if (buffs.some(b => buffSets.identity.has(b))) k.identity += d;
      if (buffs.some(b => buffSets.hat.has(b))) k.hat += d;
      if ((mask & 1 && h.backAttack) || (mask & 2 && h.frontAttack)) k.posOk += d;
    }
    const share = totalDamage ? (s.totalDamage || 0) / totalDamage : 0;
    const medianIv = quantile(iv, 0.5);
    const big = share >= BIG_SKILL_MIN_SHARE && medianIv != null && medianIv >= BIG_SKILL_MIN_INTERVAL_MS;
    skills.push({
      // Sans journal d'utilisations (dégâts sur la durée, objets) : pas d'utilisations à compter.
      id: s.id, name: s.name, damage: s.totalDamage || 0, share, casts: casts.length,
      cpm: casts.length / minutes, medianIntervalMs: medianIv, minIntervalMs: iv[0] ?? null,
      positional: mask ? (mask === 1 ? 'back' : mask === 2 ? 'front' : 'any') : null,
      positionalRate: mask && k.hitDmg ? k.posOk / k.hitDmg : null,
      apRate: k.hitDmg ? k.ap / k.hitDmg : null, fullBuffRate: k.hitDmg ? k.full / k.hitDmg : null,
      isHyperAwakening: !!s.isHyperAwakening, big, firstCasts: times.slice(0, 3), times,
      // Rythme le plus rapide (10 % des écarts) : approche la recharge réelle, une fois l'identité, les gemmes,
      // la Rapidité et l'Ark Passive pris en compte.
      fastIntervalMs: quantile(iv, 0.1),
      gemCooldown: s.gemCooldown || 0, gemDamage: s.gemDamage || 0,
      unbuffedCasts: big && encounter.players.some(isSupport) ? castBuffs.filter(c => !c.ap || !c.brand) : [],
    });
    for (const f of ['hitDmg', 'ap', 'brand', 'identity', 'hat', 'full']) acc[f] += k[f];
    if (mask) { acc.posDmg += k.hitDmg; acc.posOk += k.posOk; }
    if (big) { acc.bigDmg += k.hitDmg; acc.bigFull += k.full; }
  }
  skills.sort((a, b) => b.damage - a.damage);

  const opener = Object.values(player.skills)
    .flatMap(s => (s.skillCastLog || []).map(c => ({ t: c.timestamp, name: s.name, id: s.id })))
    .sort((a, b) => a.t - b.t).slice(0, 12);

  const r = (x, y) => (y ? x / y : null);
  return {
    name: player.name, className: player.className, spec: player.spec, support: isSupport(player),
    supportCoverage: isSupport(player) && player.supportCoverage?.ap != null ? player.supportCoverage : null,
    combatPower: player.combatPower, dps: player.damageStats.dps || Math.round(totalDamage / (durationMs / 1000)),
    durationMs, downtimeMs: downMs, availableMs,
    // Durée du combat comptée par LOA Logs (son compteur « par minute »), plus courte que la chronologie des paquets
    fightMs: encounter.durationMs || durationMs,
    deadMs, lostMs, sharedPauseMs, activity: 1 - lostMs / Math.max(1, availableMs - deadMs - sharedPauseMs),
    longestGaps: [...gaps].sort((a, b) => b.lostMs - a.lostMs).slice(0, 6),
    deadWindows: dead,
    // Périodes à ignorer pour juger le joueur : phases sans boss, temps à terre, pauses partagées.
    excludedWindows: mergeWindows([...excluded, ...gaps.filter(g => g.shared).map(g => [g.from, g.to])].sort((x, y) => x[0] - y[0]), 0),
    deaths: player.damageStats.deaths || 0,
    apRate: r(acc.ap, acc.hitDmg), brandRate: r(acc.brand, acc.hitDmg), identityRate: r(acc.identity, acc.hitDmg),
    hatRate: r(acc.hat, acc.hitDmg), fullBuffRate: r(acc.full, acc.hitDmg),
    bigSkillFullBuffRate: r(acc.bigFull, acc.bigDmg),
    positionalShare: r(acc.posDmg, acc.hitDmg), positionalRate: r(acc.posOk, acc.posDmg),
    skills, opener, build: playerBuild(player), partySupport: partySupportOf(encounter, player),
    supportDetails: isSupport(player) ? supportDetails(encounter, player, { buffSets, buffMeta, excluded }) : null,
  };
}

// Support du groupe du joueur et sa couverture (pour faire la part entre le timing du DPS et celui du support).
function partySupportOf(encounter, player) {
  const party = Object.values(encounter.misc?.partyInfo || {}).find(p => p.includes(player.name));
  const sup = party && encounter.players.find(p => party.includes(p.name) && isSupport(p) && p.name !== player.name);
  return sup ? { name: sup.name, spec: sup.spec, coverage: sup.supportCoverage?.ap != null ? sup.supportCoverage : null } : null;
}

// Boucliers du support : par bouclier de classe (compétence ou Ark Passive), total donné et total réellement absorbé
// sur les autres joueurs (shieldsGivenBy / damageAbsorbedOnOthersBy de LOA Logs). Le log ne date pas les coups reçus :
// on mesure la part utile, pas le moment.
export const SHIELD_CATEGORIES = new Set(['classskill', 'arkpassive']);

// Grosses attaques du boss : utilisations dont les dégâts (total de l'attaque ÷ nombre d'utilisations) font au moins
// 3 % des dégâts du boss sur le combat. Bouclier « en place » : un bouclier du support (durée ≥ 3 s, tables du jeu)
// actif à un moment de la fenêtre [lancement de l'attaque, + 3 s] (le coup tombe après le lancement).
export const BIG_ATTACK_MIN_SHARE = 0.03;
export const BIG_ATTACK_HIT_WINDOW_MS = 3000;
export const SHIELD_MIN_DURATION_MS = 3000;

function bigBossAttacks(encounter) {
  const total = (encounter.bossAttacks || []).reduce((t, s) => t + s.totalDamage, 0);
  if (!total) return [];
  return encounter.bossAttacks.flatMap(s => s.castLog.map(t => ({ t, id: s.id, dmg: s.totalDamage / s.castLog.length })))
    .filter(x => x.dmg >= total * BIG_ATTACK_MIN_SHARE).sort((a, b) => a.t - b.t);
}

function supportShields(encounter, player, party, buffMeta = {}) {
  const ds = player.damageStats || {};
  const given = ds.shieldsGivenBy || {}, absorbed = ds.damageAbsorbedOnOthersBy || {};
  const skillName = id => Object.values(player.skills).find(s => s.id === id || s.id - (s.id % 10) === id)?.name;
  const list = [];
  for (const [id, g] of Object.entries(given)) {
    const b = encounter.shieldBuffs?.[id];
    if (!b || !SHIELD_CATEGORIES.has(b.buffCategory) || !(g > 0)) continue;
    const skillId = b.source?.skill?.id || null;
    list.push({ id: +id, skillId, name: (skillId && skillName(skillId)) || b.source?.skill?.name || b.source?.name || id, durationMs: buffMeta[id]?.d ?? null, given: g, absorbed: absorbed[id] || 0, efficiency: (absorbed[id] || 0) / g });
  }
  const totalGiven = list.reduce((t, x) => t + x.given, 0), totalAbsorbed = list.reduce((t, x) => t + x.absorbed, 0);

  // Fenêtres où un bouclier du support est actif : ses utilisations des compétences qui posent un bouclier.
  const shieldSkills = new Map();
  for (const [id, b] of Object.entries(encounter.shieldBuffs || {})) {
    const d = buffMeta[id]?.d, skillId = b.source?.skill?.id;
    if (!skillId || !SHIELD_CATEGORIES.has(b.buffCategory) || !(d >= SHIELD_MIN_DURATION_MS)) continue;
    shieldSkills.set(skillId, Math.max(shieldSkills.get(skillId) || 0, d));
  }
  const active = [];
  for (const s of Object.values(player.skills)) {
    const d = shieldSkills.get(s.id) || shieldSkills.get(s.id - (s.id % 10));
    if (d) for (const c of s.skillCastLog || []) active.push([c.timestamp, c.timestamp + d, s.name]);
  }
  active.sort((a, b) => a[0] - b[0]);
  const attacks = bigBossAttacks(encounter).map(x => {
    const on = active.some(([a, b]) => a <= x.t + BIG_ATTACK_HIT_WINDOW_MS && b >= x.t);
    const before = active.filter(([a]) => a <= x.t).pop();
    const after = active.find(([a]) => a > x.t + BIG_ATTACK_HIT_WINDOW_MS);
    return { ...x, shielded: on, lastShieldEnd: before ? before[1] : null, nextShield: after ? after[0] : null };
  });
  const bigDmg = attacks.reduce((t, x) => t + x.dmg, 0);
  // Dégâts reçus par le reste du groupe (après boucliers) : part que les boucliers du support ont évitée.
  const taken = encounter.players.filter(p => party.includes(p.name) && p.name !== player.name).reduce((t, p) => t + (p.damageStats.damageTaken || 0), 0);
  return {
    list: list.sort((x, y) => y.given - x.given), given: totalGiven, absorbed: totalAbsorbed,
    efficiency: totalGiven ? totalAbsorbed / totalGiven : null,
    bigAttacks: attacks, bigShielded: bigDmg ? attacks.filter(x => x.shielded).reduce((t, x) => t + x.dmg, 0) / bigDmg : null,
    protectedShare: totalAbsorbed + taken ? totalAbsorbed / (totalAbsorbed + taken) : null,
  };
}

// Évolution : nœuds de stats du palier 0 (50 points par niveau). Gravures et nœuds d'Éclairage / de Bond tels quels.
export const EVOLUTION_STATS = { 1010100: 'crit', 1010200: 'specialization', 1010300: 'domination', 1010400: 'swiftness', 1010500: 'endurance' };

export function playerBuild(player) {
  const ap = player.arkPassive || {};
  const evo = { crit: 0, specialization: 0, swiftness: 0, domination: 0, endurance: 0 };
  for (const n of ap.evolution || []) if (EVOLUTION_STATS[n.id]) evo[EVOLUTION_STATS[n.id]] = n.lv;
  const nodes = {};
  for (const tree of ['evolution', 'enlightenment', 'leap']) for (const n of ap[tree] || []) if (!EVOLUTION_STATS[n.id]) nodes[n.id] = n.lv;
  return { evolution: evo, nodes, engravings: (player.engravings || []).filter(e => !isStoneMalus(e)) };
}

// Supports : chevauchement de leurs propres buffs (relancer un buff du même groupe encore actif gaspille la durée
// restante) et moments où les DPS du groupe ont frappé sans le buff de PA ou la Marque.
export const COVERAGE_GAP_MIN_MS = 2000;

function supportDetails(encounter, player, { buffSets, buffMeta, excluded }) {
  const party = Object.values(encounter.misc?.partyInfo || {}).find(p => p.includes(player.name)) || encounter.players.map(p => p.name);
  const partyDps = encounter.players.filter(p => party.includes(p.name) && !isSupport(p));

  const gapsOf = test => {
    const hits = [];
    for (const p of partyDps) for (const s of Object.values(p.skills)) for (const c of s.skillCastLog || []) for (const h of c.hits || []) {
      if (h.damage > 0) hits.push([h.timestamp, test(h)]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    const out = [];
    let start = null, last = null;
    const close = () => {
      if (start != null && last - start >= COVERAGE_GAP_MIN_MS) {
        const missing = last - start - overlap(start, last, excluded);
        if (missing >= COVERAGE_GAP_MIN_MS) out.push({ from: start, to: last, ms: missing });
      }
      start = null;
    };
    for (const [t, ok] of hits) {
      if (!ok) { if (start == null) start = t; last = t; } else close();
    }
    close();
    return out;
  };
  const apGaps = gapsOf(h => (h.buffedBy || []).some(b => buffSets.ap.has(b)));
  const brandGaps = gapsOf(h => (h.debuffedBy || []).some(b => buffSets.brand.has(b)));

  // Compétences du support qui posent un buff de PA ou la Marque, et durée de ce buff (tables du jeu).
  const bySkill = new Map();
  const collect = (map, kind, set) => {
    for (const [id, b] of Object.entries(map || {})) {
      const skillId = b.source?.skill?.id;
      const d = buffMeta[id]?.d;
      if (!set.has(+id) || !skillId || !(d > 0)) continue;
      if (!bySkill.has(skillId) || bySkill.get(skillId).d < d) bySkill.set(skillId, { kind, d, buff: b.source.name });
    }
  };
  collect(encounter.buffs, 'ap', buffSets.ap);
  collect(encounter.debuffs, 'brand', buffSets.brand);

  // Seulement le buff de PA : la Marque est réappliquée par beaucoup de coups, la relancer est normal.
  const overlaps = { ap: [] };
  for (const kind of ['ap']) {
    const casts = [];
    for (const s of Object.values(player.skills)) {
      const info = bySkill.get(s.id) || bySkill.get(s.id - (s.id % 10));
      if (info?.kind === kind) for (const c of s.skillCastLog || []) casts.push({ t: c.timestamp, d: info.d, name: s.name });
    }
    casts.sort((a, b) => a.t - b.t);
    let until = 0, prevName = null;
    for (const c of casts) {
      const wasted = until - c.t;
      if (wasted > 500) overlaps[kind].push({ t: c.t, name: c.name, previous: prevName, wastedMs: wasted });
      until = c.t + c.d;
      prevName = c.name;
    }
  }
  const sum = (a, f) => a.reduce((t, x) => t + x[f], 0);
  return {
    partyDps: partyDps.map(p => p.name), shields: supportShields(encounter, player, party, buffMeta),
    apGaps, apGapMs: sum(apGaps, 'ms'), brandGaps, brandGapMs: sum(brandGaps, 'ms'),
    overlaps, apOverlapMs: sum(overlaps.ap, 'wastedMs'), apBuffCasts: overlaps.ap.length,
    buffSkills: [...bySkill.entries()].map(([id, v]) => ({ id, ...v })),
  };
}

// Coups des DPS (fenêtres fusionnées), pour repérer les pauses partagées.
export function dpsHitWindows(encounter) {
  return encounter.players.filter(p => !isSupport(p))
    .map(p => ({ name: p.name, windows: mergeWindows(hitWindows(p), IDLE_TOLERANCE_MS) }));
}

export function analyzeEncounter(encounter, opts = {}) {
  const buffSets = classifyBuffs(encounter);
  const downtime = raidDowntime(encounter);
  const otherDps = dpsHitWindows(encounter);
  return {
    downtime,
    players: encounter.players.map(p => analyzePlayer(encounter, p, { ...opts, buffSets, downtime, otherDps })),
  };
}

// ---------- Références (même spé, même boss) et note d'exécution ----------

export const QUANTILE_STEPS = 20; // quantiles tous les 5 %

export function toQuantiles(values) {
  const v = values.filter(x => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  return Array.from({ length: QUANTILE_STEPS + 1 }, (_, i) => +quantile(v, i / QUANTILE_STEPS).toFixed(5));
}

// Rang (0-100) d'une valeur dans la distribution de référence.
export function percentileRank(q, x) {
  if (!q || x == null) return null;
  const n = q.length - 1;
  // Ex aequo (quantiles égaux à x, ex. 15 % de la référence à 0 de placement) : rang du milieu de la plage, pas le
  // plus bas ; référence constante = 50
  const lo = q.findIndex(v => v >= x);
  let hi = -1;
  for (let i = n; i >= 0; i--) if (q[i] <= x) { hi = i; break; }
  if (lo !== -1 && hi !== -1 && lo <= hi && q[lo] === x) return Math.round(((lo + hi) / 2 / n) * 100);
  if (x <= q[0]) return 0;
  if (x >= q[n]) return 100;
  for (let i = 1; i < q.length; i++) {
    if (x <= q[i]) {
      const span = q[i] - q[i - 1];
      const f = span > 0 ? (x - q[i - 1]) / span : 0.5;
      return Math.round(((i - 1 + f) / (q.length - 1)) * 100);
    }
  }
  return 100;
}

export const SCORE_WEIGHTS = { activity: 30, skills: 35, buffs: 20, positional: 15 };
// Supports : couverture de leur groupe (part des dégâts des DPS sous chaque buff). Poids proches de la corrélation
// de chaque critère avec le rDPS donné ÷ dégâts du groupe (803 supports, 2026-10-02) : identité 0,61, PA 0,50,
// Marque 0,50, activité 0,34, T 0,25.
export const SUPPORT_SCORE_WEIGHTS = { ap: 30, brand: 25, identity: 25, hat: 10, activity: 10 };
// Malus de pierre d'aptitude (Defense / Atk. Power / Atk. Speed / Move Speed Reduction) : subis, pas choisis,
// jamais un élément de build à conseiller
export const isStoneMalus = e => /Reduction$/i.test(String(e || '').trim());

export const REF_MIN_SAMPLES = 8;
export const KEY_SKILL_MIN_SHARE = 0.03;
export const KEY_SKILL_MIN_USAGE = 0.6; // compétence jouée par au moins 60 % des joueurs de la spé (sinon choix de build)
export const POSITIONAL_MIN_SHARE = 0.2;
// Placement noté seulement si les joueurs de la spé le réussissent vraiment : réussite médiane de la référence
// d'au moins 10 % (Pistoleer : compétences marquées « de dos » dans les données du jeu, 0,4 % de réussite médiane)
export const POSITIONAL_MIN_RATE = 0.1;
export function positionalMatters(ref) {
  const q = ref && ref.positionalRate;
  const med = q && q.length ? q[Math.floor(q.length / 2)] : 0;
  return (ref?.positionalShareMedian ?? 0) >= POSITIONAL_MIN_SHARE && med >= POSITIONAL_MIN_RATE;
}

// Référence locale (même boss, sinon tous boss) d'abord ; à défaut, logs de lostark.bible autour de la médiane
// (même boss d'abord : une spé jouée sur un boss est mieux comparée sur ce boss, même hors de la base locale).
export function pickReference(refs, spec, boss) {
  const order = [[`${spec}|${boss}`, 'boss'], [`bible|${spec}|${boss}`, 'bible-boss'], [`${spec}|*`, 'spec'], [`bible|${spec}|*`, 'bible-spec']];
  for (const [k, scope] of order) {
    const ref = refs?.[k];
    if (ref && ref.n >= REF_MIN_SAMPLES) return { ref, scope };
  }
  return { ref: null, scope: null };
}

// Joueur ramené à la base de la référence : les logs de lostark.bible n'ont pas le détail des coups, leurs rythmes
// sont comptés sur toute la chronologie (basis « timeline ») ; ceux du joueur aussi, sans retirer les phases sans boss.
export function alignToReference(a, ref) {
  if (ref?.basis !== 'timeline') return a;
  const minutes = Math.max(1, a.durationMs) / 60000;
  return { ...a, skills: a.skills.map(s => ({ ...s, cpm: s.casts / minutes })) };
}

function weighted(parts, weights) {
  let tw = 0, total = 0;
  for (const [k, wk] of Object.entries(weights)) if (parts[k] != null) { tw += wk; total += wk * parts[k]; }
  return tw ? Math.round(total / tw) : null;
}

export function scoreSupport(a, ref) {
  // Couverture absente : groupe sans DPS ou avec deux supports (LOA Logs ne la calcule pas).
  if (!ref?.support || !a.supportCoverage) return null;
  const parts = { activity: percentileRank(ref.activity, a.activity) };
  for (const k of ['ap', 'brand', 'identity', 'hat']) parts[k] = percentileRank(ref.support[k], a.supportCoverage[k]);
  // Compétences : à titre indicatif (hors note), toutes celles que la spé joue, quelle que soit leur part des dégâts.
  const skillScores = [];
  for (const [id, rs] of Object.entries(ref.skills || {})) {
    if ((rs.usage ?? 0) < KEY_SKILL_MIN_USAGE || (rs.cpm?.[10] ?? 0) < 0.5) continue;
    const mine = a.skills.find(x => String(x.id) === id);
    skillScores.push(mine
      ? { id: +id, name: rs.name, cpm: mine.cpm, refCpmMedian: rs.cpm[10], refCpmP90: rs.cpm[18], rank: percentileRank(rs.cpm, mine.cpm), weight: 0 }
      : { id: +id, name: rs.name, absent: true, refCpmMedian: rs.cpm[10], refCpmP90: rs.cpm[18], weight: 0 });
  }
  return { score: weighted(parts, SUPPORT_SCORE_WEIGHTS), parts, skillScores };
}

// Couverture brute d'un support : moyenne simple de la part des dégâts du groupe sous le buff d'attaque, la Marque et
// l'identité (proche de la « Buff Performance » de lostark.bible, dont la formule n'est pas publiée).
export function coverageMean(c) {
  if (!c || c.ap == null || c.brand == null || c.identity == null) return null;
  return (c.ap + c.brand + c.identity) / 3;
}

// « Top X % » : part des logs de référence qui font au moins aussi bien (1 à 100), sur la distribution d'une mesure.
export function topPercent(q, x) {
  const r = percentileRank(q, x);
  return r == null ? null : Math.min(100, Math.max(1, 100 - r));
}

export function scorePlayer(a, ref) {
  if (!ref) return null;
  if (a.support) return scoreSupport(a, ref);
  const parts = {};
  parts.activity = percentileRank(ref.activity, a.activity);

  // Compétences clés de la spé (≥ 3 % des dégâts en médiane chez ceux qui la jouent) : utilisations par minute,
  // pondérées par leur part. Une compétence absente du build n'est pas notée (affichée à part).
  let w = 0, s = 0;
  const skillScores = [];
  for (const [id, rs] of Object.entries(ref.skills || {})) {
    if ((rs.shareMedian ?? 0) < KEY_SKILL_MIN_SHARE) continue;
    if ((rs.usage ?? 0) < KEY_SKILL_MIN_USAGE) continue;
    const mine = a.skills.find(x => String(x.id) === id);
    if (!mine) { skillScores.push({ id: +id, name: rs.name, absent: true, refCpmMedian: rs.cpm[10], refCpmP90: rs.cpm[18], weight: rs.shareMedian }); continue; }
    const rank = percentileRank(rs.cpm, mine.cpm);
    skillScores.push({ id: +id, name: rs.name, cpm: mine.cpm, refCpmMedian: rs.cpm[10], refCpmP90: rs.cpm[18], rank, weight: rs.shareMedian });
    w += rs.shareMedian; s += rs.shareMedian * rank;
  }
  parts.skills = w ? Math.round(s / w) : null;

  // Buffs : seulement si un support a donné son buff de PA pendant le combat (sinon rien à aligner).
  // Un support ne s'aligne pas sur son propre buff : critère réservé aux DPS.
  parts.buffs = !a.support && a.apRate ? percentileRank(ref.fullBuffRate, a.fullBuffRate) : null;

  parts.positional = positionalMatters(ref) ? percentileRank(ref.positionalRate, a.positionalRate) : null;

  return { score: weighted(parts, SCORE_WEIGHTS), parts, skillScores: skillScores.sort((x, y) => y.weight - x.weight) };
}
