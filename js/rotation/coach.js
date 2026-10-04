// Conseils pédagogiques tirés de l'analyse d'un joueur (prototype). Module pur, réutilisable dans le navigateur.
// Chaque conseil repose sur une mesure comparée à la référence (même spé sur le même boss) ou au build des 25 %
// meilleurs de la spé (DPS ÷ CP ; supports : couverture de PA). Aucune règle de classe écrite à la main.
//
// Conseil = { kind, gainPct?, title, what, why, how: [lignes], moments: [{ t, text }] } dans la langue demandée.

import { percentileRank, KEY_SKILL_MIN_SHARE, KEY_SKILL_MIN_USAGE, SHIELD_MIN_DURATION_MS, isStoneMalus, positionalMatters } from './metrics.js';

export const WEAK_RANK = 35;          // critère sous ce rang : conseil
export const SKILL_GAIN_MIN_PCT = 1;  // compétence : gain estimé d'au moins 1 % de dégâts
export const DELAY_MIN_MS = 3000;     // compétence prête depuis au moins 3 s : moment cité
export const OVERLAP_MIN_MS = 2000;   // buff relancé avec au moins 2 s restantes : moment cité
export const NODE_TOP_SHARE = 0.7;    // nœud / gravure chez au moins 70 % des meilleurs
export const NODE_RARE_SHARE = 0.15;  // … ou chez moins de 15 %
export const RESOURCE_SKILL_MAX_CD = 3000; // recharge de base ≤ 3 s : compétence de ressource (combo, identité, énergie)

function makeT(lang) {
  const en = lang === 'en';
  const tr = (fr, e) => (en ? e : fr);
  const num = (x, d = 1) => (x == null ? '—' : en ? x.toFixed(d) : x.toFixed(d).replace('.', ','));
  const pct = (x, d = 0) => (en ? `${num(x * 100, d)}%` : `${num(x * 100, d)} %`);
  const sec = ms => `${num(ms / 1000, ms < 10000 ? 1 : 0)} s`;
  const clock = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  return { en, tr, num, pct, sec, clock };
}

const top = (list, n, f) => [...list].sort((a, b) => f(b) - f(a)).slice(0, n);

// Le joueur était-il à terre pendant ce moment ? (au moins 1 s de recouvrement)
const wasDead = (a, from, to) => (a.deadWindows || []).some(([x, y]) => Math.min(to, y) - Math.max(from, x) >= 1000);

// Moments où une compétence était prête (d'après le rythme le plus rapide du joueur) mais n'a pas été relancée,
// hors phases sans boss, temps à terre et pauses partagées.
function skillDelays(skill, a, readyMs) {
  const out = [];
  const t = skill.times || [];
  const skip = [...(a.excludedWindows || [])];
  for (let i = 1; i < t.length; i++) {
    const idle = t[i] - t[i - 1] - readyMs;
    if (idle < DELAY_MIN_MS) continue;
    const from = t[i - 1] + readyMs, to = t[i];
    let covered = 0;
    for (const [x, y] of skip) covered += Math.max(0, Math.min(to, y) - Math.max(from, x));
    if (idle - covered >= DELAY_MIN_MS) out.push({ from, to, ms: idle - covered });
  }
  return out;
}

function dpsSkillAdvice(a, ref, build, L, skillMeta) {
  const { tr, num, pct, sec, clock } = L;
  const out = [];
  for (const [id, rs] of Object.entries(ref.skills || {})) {
    if ((rs.shareMedian ?? 0) < KEY_SKILL_MIN_SHARE || (rs.usage ?? 0) < KEY_SKILL_MIN_USAGE) continue;
    const s = a.skills.find(x => String(x.id) === id);
    if (!s || !s.casts) continue;
    const medianCpm = rs.cpm[10], bestCpm = rs.cpm[18];
    if (s.cpm >= medianCpm) continue;
    const gainPct = s.share * (medianCpm / s.cpm - 1) * 100;
    if (gainPct < SKILL_GAIN_MIN_PCT) continue;

    const mine = s.fastIntervalMs, theirs = rs.fastIntervalMedianMs;
    const meta = skillMeta[id] || skillMeta[+id - (+id % 10)];
    const resource = meta && meta.cd <= RESOURCE_SKILL_MAX_CD;
    const slower = !resource && mine != null && theirs != null && mine > theirs * 1.15 && mine - theirs > 500;
    const how = [], moments = [];
    let cause;
    if (resource) {
      // Sans recharge (combo, identité, énergie) : la fréquence dépend de la ressource que génèrent les autres compétences.
      cause = tr(
        `Cette compétence n'a pas de recharge : elle dépend de ta ressource (jauge, énergie ou combo de ta classe). Les ${a.spec} l'enchaînent au plus vite toutes les ${sec(theirs)}, toi toutes les ${sec(mine)}.`,
        `This skill has no cooldown: it depends on your class resource (gauge, energy or combo). ${a.spec} players chain it at best every ${sec(theirs)}, you every ${sec(mine)}.`);
      how.push(tr(`Remplis ta ressource plus vite : lance tes compétences qui la génèrent dès qu'elles sont prêtes, et ne la laisse pas pleine sans la dépenser.`,
                  `Build your resource faster: use the skills that generate it as soon as they are ready, and never sit on a full resource.`));
      how.push(tr(`Quand tu la dépenses, enchaîne les utilisations sans t'arrêter : les meilleurs les lancent l'une après l'autre.`,
                  `When you spend it, chain the uses without stopping: the best players use them back to back.`));
    } else if (slower) {
      cause = tr(
        `Elle revient moins vite chez toi : au plus vite toutes les ${sec(mine)}, contre ${sec(theirs)} chez les autres ${a.spec}. Ce n'est donc pas seulement ta façon de jouer, c'est aussi sa recharge.`,
        `It comes back slower for you: at best every ${sec(mine)}, versus ${sec(theirs)} for other ${a.spec} players. So it is not only how you play, its cooldown is longer too.`);
      const g = build?.gemCd?.[id];
      if (g && g.share >= 0.6 && (s.gemCooldown || 0) < (g.median || 0)) {
        how.push(s.gemCooldown
          ? tr(`Monte sa gemme de recharge : tu as un niveau ${s.gemCooldown}, ${pct(g.share)} des meilleurs ont une gemme de recharge dessus (niveau ${num(g.median, 0)} en médiane).`,
               `Upgrade its cooldown gem: yours is level ${s.gemCooldown}, ${pct(g.share)} of the best players have a cooldown gem on it (level ${num(g.median, 0)} median).`)
          : tr(`Mets-lui une gemme de recharge : tu n'en as pas, alors que ${pct(g.share)} des meilleurs en ont une (niveau ${num(g.median, 0)} en médiane).`,
               `Give it a cooldown gem: you have none, while ${pct(g.share)} of the best players do (level ${num(g.median, 0)} median).`));
      }
      const swift = build?.evolution?.swiftness?.[10], mySwift = a.build?.evolution?.swiftness ?? 0;
      if (swift != null && mySwift + 5 <= swift) {
        how.push(tr(`Mets plus de Rapidité dans l'Évolution de l'Ark Passive : tu as ${mySwift} niveaux, les meilleurs ${num(swift, 0)}. La Rapidité réduit les recharges de toutes tes compétences.`,
                    `Put more Swiftness in the Ark Passive Evolution tree: you have ${mySwift} levels, the best players ${num(swift, 0)}. Swiftness lowers the cooldown of all your skills.`));
      }
      if (!how.length) how.push(tr(`Compare tes tripods et ton bracelet (lignes de Rapidité) avec ceux des meilleurs ${a.spec} : ta recharge est plus longue que la leur, mais ni ta gemme ni ta Rapidité d'Évolution ne l'expliquent.`,
                                   `Compare your tripods and bracelet (Swiftness lines) with the best ${a.spec} players: your cooldown is longer than theirs, but neither your gem nor your Evolution Swiftness explains it.`));
    } else {
      cause = tr(
        `Elle revient aussi vite chez toi que chez les autres (au plus vite toutes les ${sec(mine ?? theirs)}). Ton équipement n'est donc pas en cause : la compétence était souvent prête, mais tu ne l'as pas relancée tout de suite.`,
        `It comes back as fast for you as for the others (at best every ${sec(mine ?? theirs)}). So your gear is not the problem: the skill was often ready, but you did not use it right away.`);
      how.push(tr(`Garde-la en priorité : dès qu'elle est disponible, lance-la avant tes petites compétences.`,
                  `Make it your priority: as soon as it is ready, use it before your smaller skills.`));
      const delays = top(skillDelays(s, a, mine ?? theirs), 3, d => d.ms);
      if (delays.length) {
        const total = skillDelays(s, a, mine ?? theirs).reduce((x, d) => x + d.ms, 0);
        how.push(tr(`Au total, elle est restée prête sans être lancée pendant ${sec(total)}. Les plus longs moments :`,
                    `In total, it sat ready without being used for ${sec(total)}. The longest moments:`));
        for (const d of delays.sort((x, y) => x.from - y.from)) moments.push({ t: d.from, text: tr(`${clock(d.from)} → ${clock(d.to)} : prête depuis ${sec(d.ms)}`, `${clock(d.from)} → ${clock(d.to)}: ready for ${sec(d.ms)}`) });
      }
    }
    out.push({
      kind: 'skill', gainPct,
      title: tr(`Tu ne lances pas assez ${s.name}`, `You do not use ${s.name} enough`),
      what: tr(`Tu l'as lancée ${s.casts} fois, soit ${num(s.cpm)} fois par minute. Les ${a.spec} ${L.on.fr} la lancent ${num(medianCpm)} fois par minute en médiane, et les meilleurs ${num(bestCpm)}.`,
               `You used it ${s.casts} times, ${num(s.cpm)} times per minute. ${a.spec} players ${L.on.en} use it ${num(medianCpm)} times per minute on median, the best ${num(bestCpm)}.`),
      why: tr(`Elle fait ${pct(s.share)} de tes dégâts. La lancer aussi souvent que la médiane te donnerait environ +${num(gainPct)} % de dégâts. ${cause}`,
              `It deals ${pct(s.share)} of your damage. Using it as often as the median would give you about +${num(gainPct)}% damage. ${cause}`),
      how, moments,
    });
  }
  return out;
}

function activityAdvice(a, ref, L) {
  const { tr, num, pct, sec, clock } = L;
  const rank = percentileRank(ref.activity, a.activity);
  if (rank == null || rank >= WEAK_RANK) return [];
  const medianAct = ref.activity[10];
  const gainPct = Math.max(0, (medianAct - a.activity) / a.activity * 100);
  const moments = a.longestGaps.filter(g => !g.shared && g.lostMs >= 2000).slice(0, 4).sort((x, y) => x.from - y.from)
    .map(g => ({ t: g.from, text: tr(`${clock(g.from)} → ${clock(g.to)} : ${sec(g.lostMs)} sans rien lancer`, `${clock(g.from)} → ${clock(g.to)}: ${sec(g.lostMs)} without using anything`) }));
  return [{
    kind: 'activity', gainPct,
    title: tr('Tu restes trop souvent sans rien lancer', 'You spend too much time doing nothing'),
    what: tr(`Pendant que le boss était là, tu es resté ${sec(a.lostMs)} sans lancer de compétence (au-delà d'1,5 s de battement normal entre deux). Tu as été actif ${pct(a.activity, 1)} du temps, la médiane des ${a.spec} est à ${pct(medianAct, 1)}.`,
             `While the boss was available, you went ${sec(a.lostMs)} without using a skill (beyond a normal 1.5 s between two). You were active ${pct(a.activity, 1)} of the time, the ${a.spec} median is ${pct(medianAct, 1)}.`),
    why: tr(`Chaque seconde sans compétence, ce sont des dégâts perdus. Revenir à la médiane, c'est environ +${num(gainPct)} % de dégâts.`,
            `Every second without a skill is lost damage. Getting back to the median is about +${num(gainPct)}% damage.`),
    how: [tr(`Regarde ces moments sur la vidéo ou dans ta mémoire : te déplaçais-tu sans attaquer, attendais-tu une recharge ? Garde toujours une petite compétence de côté pour combler ces trous, et rapproche-toi du boss pendant les déplacements.`,
             `Look at these moments: were you moving without attacking, waiting for a cooldown? Always keep a small skill available to fill these gaps, and move towards the boss while repositioning.`)],
    moments,
  }];
}

function buffAdvice(a, ref, L) {
  const { tr, pct, clock } = L;
  if (a.support || !a.apRate) return [];
  const rank = percentileRank(ref.fullBuffRate, a.fullBuffRate);
  const casts = a.skills.flatMap(s => (s.unbuffedCasts || []).map(c => ({ ...c, name: s.name })));
  // Aucun gros sort hors buffs : l'écart vient des petits coups, le titre « gros sorts » serait faux
  if (rank == null || rank >= WEAK_RANK || !casts.length) return [];
  const moments = casts.sort((x, y) => x.t - y.t).slice(0, 6).map(c => ({
    t: c.t,
    text: tr(`${clock(c.t)} : ${c.name} ${!c.ap && !c.brand ? 'sans le buff d\'attaque ni la Marque' : !c.ap ? 'sans le buff d\'attaque' : 'sans la Marque'}`,
             `${clock(c.t)}: ${c.name} ${!c.ap && !c.brand ? 'without the attack buff or the Brand' : !c.ap ? 'without the attack buff' : 'without the Brand'}`),
  }));
  return [{
    kind: 'buffs',
    title: tr('Tes gros sorts partent hors des buffs du support', 'Your big skills land outside the support buffs'),
    what: tr(`${pct(a.fullBuffRate, 1)} de tes dégâts ont été faits avec à la fois le buff d'attaque du support et sa Marque sur le boss (médiane des ${a.spec} : ${pct(ref.fullBuffRate[10], 1)}). ${casts.length} de tes gros sorts sont partis sans l'un des deux.`,
             `${pct(a.fullBuffRate, 1)} of your damage was dealt with both the support's attack buff and their Brand on the boss (${a.spec} median: ${pct(ref.fullBuffRate[10], 1)}). ${casts.length} of your big skills landed without one of them.`),
    why: tr(`Ces deux effets augmentent fortement les dégâts : un gros sort lancé sans eux en fait beaucoup moins.`,
            `Both effects raise damage a lot: a big skill used without them deals much less.`) + supportShare(a, L),
    how: [tr(`Avant une grosse compétence, vérifie que l'icône du buff d'attaque est sur ta barre de buffs et que la Marque est sur le boss. S'il manque l'un des deux, attends une seconde ou deux : le support le remet très vite.`,
             `Before a big skill, check that the attack buff icon is on your buff bar and that the Brand is on the boss. If one is missing, wait a second or two: the support reapplies it quickly.`)],
    moments,
  }];
}

// Part du support : sa couverture sur tout le groupe. Si elle est proche de celle du joueur, les trous viennent du support.
function supportShare(a, L) {
  const { tr, pct } = L;
  const c = a.partySupport?.coverage;
  if (!c) return '';
  const name = a.partySupport.name;
  const close = Math.abs((a.apRate ?? 0) - c.ap) < 0.02 && Math.abs((a.brandRate ?? 0) - c.brand) < 0.02;
  return ' ' + (close
    ? tr(`Mais attention : sur tout ton groupe, ${name} n'a couvert que ${pct(c.ap, 1)} des dégâts avec son buff d'attaque et ${pct(c.brand, 1)} avec sa Marque, presque comme toi. Ces trous viennent donc surtout du support, pas de ton timing.`,
         `But note: across your whole party, ${name} only covered ${pct(c.ap, 1)} of the damage with their attack buff and ${pct(c.brand, 1)} with their Brand, almost like you. These gaps come mostly from the support, not your timing.`)
    : tr(`Sur tout ton groupe, ${name} a couvert ${pct(c.ap, 1)} des dégâts avec son buff d'attaque et ${pct(c.brand, 1)} avec sa Marque : l'écart avec toi vient de ton timing.`,
         `Across your whole party, ${name} covered ${pct(c.ap, 1)} of the damage with their attack buff and ${pct(c.brand, 1)} with their Brand: the difference with you comes from your timing.`));
}

function positionalAdvice(a, ref, L) {
  const { tr, pct } = L;
  if (!positionalMatters(ref) || a.positionalRate == null) return [];
  const rank = percentileRank(ref.positionalRate, a.positionalRate);
  if (rank == null || rank >= WEAK_RANK) return [];
  const worst = a.skills.filter(s => s.positional && s.share >= 0.03 && s.positionalRate != null).sort((x, y) => x.positionalRate - y.positionalRate).slice(0, 3);
  const side = s => (s.positional === 'back' ? tr('dans le dos', 'from behind') : s.positional === 'front' ? tr('de face', 'from the front') : tr('de face ou de dos', 'from the front or behind'));
  return [{
    kind: 'positional',
    title: tr('Ton placement peut être meilleur', 'Your positioning can improve'),
    what: tr(`${pct(a.positionalRate, 1)} des dégâts de tes compétences à placement ont touché le bon côté du boss, contre ${pct(ref.positionalRate[10], 1)} en médiane chez les ${a.spec}.`,
             `${pct(a.positionalRate, 1)} of your positional skills' damage hit the right side of the boss, versus ${pct(ref.positionalRate[10], 1)} median for ${a.spec} players.`),
    why: tr(`Une attaque de dos ou de face réussie fait plus de dégâts (et plus de critiques avec certaines gravures).`,
            `A successful back or head attack deals more damage (and crits more with some engravings).`),
    how: worst.map(s => tr(`${s.name} doit toucher ${side(s)} : c'était le cas pour ${pct(s.positionalRate)} de ses dégâts. Place-toi avant de la lancer.`,
                           `${s.name} must hit ${side(s)}: it did for ${pct(s.positionalRate)} of its damage. Get in position before using it.`)),
    moments: [],
  }];
}

function buildAdvice(a, build, names, L) {
  const { tr, num, pct } = L;
  if (!build || !a.build) return [];
  const how = [];
  const evo = a.build.evolution, label = { crit: tr('Crit', 'Crit'), specialization: tr('Spécialisation', 'Specialization'), swiftness: tr('Rapidité', 'Swiftness') };
  const diffs = Object.keys(label).filter(k => Math.abs((evo[k] ?? 0) - (build.evolution[k]?.[10] ?? 0)) >= 5);
  if (diffs.length) {
    how.push(tr(`Stats de l'Évolution (Ark Passive) : tu as ${Object.keys(label).map(k => `${label[k]} ${evo[k] ?? 0}`).join(', ')} ; les meilleurs ${a.spec} ont ${Object.keys(label).map(k => `${label[k]} ${num(build.evolution[k]?.[10] ?? 0, 0)}`).join(', ')}.`,
                `Evolution stats (Ark Passive): you have ${Object.keys(label).map(k => `${label[k]} ${evo[k] ?? 0}`).join(', ')}; the best ${a.spec} players have ${Object.keys(label).map(k => `${label[k]} ${num(build.evolution[k]?.[10] ?? 0, 0)}`).join(', ')}.`));
  }
  // Malus de pierre exclus aussi ici : les références construites avant ne les filtraient pas
  const mine = new Set(a.build.engravings.filter(e => !isStoneMalus(e)));
  const missingEng = Object.entries(build.engravings).filter(([e, f]) => f >= NODE_TOP_SHARE && e !== 'Unknown' && !isStoneMalus(e) && !mine.has(e));
  const rareEng = [...mine].filter(e => e !== 'Unknown' && (build.engravings[e] ?? 0) < NODE_RARE_SHARE);
  for (const [e, f] of missingEng) how.push(tr(`Gravure ${e} : ${pct(f)} des meilleurs la jouent, pas toi.`, `${e} engraving: ${pct(f)} of the best players run it, you do not.`));
  for (const e of rareEng) how.push(tr(`Gravure ${e} : tu la joues, mais moins de ${pct(NODE_RARE_SHARE)} des meilleurs ${a.spec} la prennent.`, `${e} engraving: you run it, but fewer than ${pct(NODE_RARE_SHARE)} of the best ${a.spec} players do.`));
  const myNodes = new Set(Object.keys(a.build.nodes));
  const missingNodes = Object.entries(build.nodes).filter(([id, f]) => f >= NODE_TOP_SHARE && !myNodes.has(id));
  const rareNodes = [...myNodes].filter(id => (build.nodes[id] ?? 0) < NODE_RARE_SHARE);
  for (const [id, f] of missingNodes) how.push(tr(`Ark Passive, nœud « ${names[id] || id} » : ${pct(f)} des meilleurs l'ont, pas toi.`, `Ark Passive node "${names[id] || id}": ${pct(f)} of the best players have it, you do not.`));
  for (const id of rareNodes) how.push(tr(`Ark Passive, nœud « ${names[id] || id} » : tu l'as pris, moins de ${pct(NODE_RARE_SHARE)} des meilleurs le prennent.`, `Ark Passive node "${names[id] || id}": you took it, fewer than ${pct(NODE_RARE_SHARE)} of the best players do.`));
  for (const [id, g] of Object.entries(build.gemCd || {})) {
    if (g.share < 0.6) continue;
    const s = a.skills.find(x => String(x.id) === id);
    if (!s || !s.casts) continue;
    if (!s.gemCooldown) how.push(tr(`Gemme de recharge sur ${g.name} : ${pct(g.share)} des meilleurs en ont une (niveau ${num(g.median, 0)}), toi non.`, `Cooldown gem on ${g.name}: ${pct(g.share)} of the best players have one (level ${num(g.median, 0)}), you do not.`));
  }
  if (!how.length) return [];
  return [{
    kind: 'build',
    title: tr(`Ton build diffère de celui des meilleurs ${a.spec}`, `Your build differs from the best ${a.spec} players`),
    what: build.source === 'lostark.bible'
      ? tr(`Comparé aux ${build.n} logs des 25 % de ${a.spec} qui font le plus de dégâts pour leur CP, parmi les logs de lostark.bible lus (autour de la médiane et parmi les meilleurs, tous boss).`,
           `Compared with ${build.n} logs from the 25% of ${a.spec} players with the most damage for their CP, among the lostark.bible logs read (around the median and among the best, all bosses).`)
      : tr(`Comparé aux ${build.n} logs des 25 % de ${a.spec} qui font le plus de dégâts pour leur CP (tous boss, 120 derniers jours).`,
           `Compared with ${build.n} logs from the 25% of ${a.spec} players with the most damage for their CP (all bosses, last 120 days).`),
    why: tr(`Ce ne sont pas des règles absolues, mais des choix que presque tous les meilleurs font (ou ne font pas). Vérifie-les sur un guide de ta classe (Maxroll) avant de tout changer.`,
            `These are not absolute rules, but choices almost all of the best players make (or avoid). Check them against a class guide (Maxroll) before changing everything.`),
    how, moments: [],
  }];
}

function supportAdvice(a, ref, L) {
  const { tr, num, pct, sec, clock } = L;
  const out = [];
  const c = a.supportCoverage, sd = a.supportDetails, rs = ref.support, tm = ref.supportTiming;
  if (!c || !rs) return out;
  const minutes = a.availableMs / 60000;

  const apRank = percentileRank(rs.ap, c.ap);
  if (apRank != null && apRank < WEAK_RANK) {
    out.push({
      kind: 'support-ap',
      title: tr('Ton groupe frappe trop souvent sans ton buff d\'attaque', 'Your party hits too often without your attack buff'),
      what: tr(`${pct(c.ap, 1)} des dégâts de ton groupe ont profité de ton buff d'attaque. Les ${a.spec} ${L.on.fr} sont à ${pct(rs.ap[10], 1)} en médiane, les meilleurs à ${pct(rs.ap[18], 1)}.`,
               `${pct(c.ap, 1)} of your party's damage benefited from your attack buff. ${a.spec} players ${L.on.en} are at ${pct(rs.ap[10], 1)} median, the best at ${pct(rs.ap[18], 1)}.`),
      why: tr(`C'est ton buff le plus important : chaque seconde sans lui, tes DPS font moins de dégâts.`, `It is your most important buff: every second without it, your DPS deal less damage.`),
      how: [tr(`Relance ton buff d'attaque juste avant qu'il se termine, même en te déplaçant. Moments où ton groupe a frappé sans lui :`,
               `Recast your attack buff just before it ends, even while moving. Moments your party hit without it:`)],
      moments: top(sd.apGaps, 4, g => g.ms).sort((x, y) => x.from - y.from).map(g => ({ t: g.from, text: tr(`${clock(g.from)} → ${clock(g.to)} : ${sec(g.ms)} sans ton buff d'attaque${wasDead(a, g.from, g.to) ? ' (tu étais à terre)' : ''}`, `${clock(g.from)} → ${clock(g.to)}: ${sec(g.ms)} without your attack buff${wasDead(a, g.from, g.to) ? ' (you were dead)' : ''}`) })),
    });
  }

  const overlapPerMin = sd.apOverlapMs / 1000 / minutes;
  const ovMedian = tm?.apOverlapPerMin?.[10];
  const bigOverlaps = sd.overlaps.ap.filter(o => o.wastedMs >= OVERLAP_MIN_MS);
  if (ovMedian != null && overlapPerMin > tm.apOverlapPerMin[15] && bigOverlaps.length) {
    out.push({
      kind: 'support-overlap',
      title: tr('Tu relances ton buff d\'attaque alors que le précédent est encore actif', 'You recast your attack buff while the previous one is still active'),
      what: tr(`Tes buffs d'attaque ne se cumulent pas : en relancer un pendant que l'autre est actif remplace le premier et gaspille le temps qui lui restait. Tu as gaspillé ${sec(sd.apOverlapMs)} (${num(overlapPerMin)} s par minute, médiane des ${a.spec} : ${num(ovMedian)} s).`,
               `Your attack buffs do not stack: recasting one while the other is active replaces the first and wastes its remaining time. You wasted ${sec(sd.apOverlapMs)} (${num(overlapPerMin)} s per minute, ${a.spec} median: ${num(ovMedian)} s).`),
      why: tr(`Ce temps gaspillé, c'est du temps où tu aurais pu garder un buff en réserve pour couvrir un trou plus tard.`,
              `That wasted time is time you could have kept a buff in reserve to cover a gap later.`),
      how: [tr(`Alterne tes buffs : lance le suivant quand le précédent va se terminer (une seconde avant suffit), pas au milieu de sa durée. Exemples :`,
               `Alternate your buffs: cast the next one when the previous is about to end (one second before is enough), not halfway through. Examples:`)],
      moments: top(bigOverlaps, 4, o => o.wastedMs).sort((x, y) => x.t - y.t).map(o => ({ t: o.t, text: tr(`${clock(o.t)} : ${o.name} lancée alors que ${o.previous} avait encore ${sec(o.wastedMs)}`, `${clock(o.t)}: ${o.name} cast while ${o.previous} still had ${sec(o.wastedMs)}`) })),
    });
  }

  const brandRank = percentileRank(rs.brand, c.brand);
  if (brandRank != null && brandRank < WEAK_RANK) {
    out.push({
      kind: 'support-brand',
      title: tr('Ta Marque n\'est pas toujours sur le boss', 'Your Brand is not always on the boss'),
      what: tr(`${pct(c.brand, 1)} des dégâts de ton groupe ont été faits avec ta Marque (médiane des ${a.spec} : ${pct(rs.brand[10], 1)}).`,
               `${pct(c.brand, 1)} of your party's damage was dealt with your Brand on the boss (${a.spec} median: ${pct(rs.brand[10], 1)}).`),
      why: tr(`La Marque augmente les dégâts que le boss reçoit de ton groupe.`, `The Brand increases the damage the boss takes from your party.`),
      how: [tr(`Touche le boss avec une compétence qui pose la Marque dès qu'elle va expirer, surtout avant les gros sorts de tes DPS. Moments sans Marque :`,
               `Hit the boss with a Brand skill when it is about to expire, especially before your DPS use big skills. Moments without Brand:`)],
      moments: top(sd.brandGaps, 4, g => g.ms).sort((x, y) => x.from - y.from).map(g => ({ t: g.from, text: tr(`${clock(g.from)} → ${clock(g.to)} : ${sec(g.ms)} sans Marque${wasDead(a, g.from, g.to) ? ' (tu étais à terre)' : ''}`, `${clock(g.from)} → ${clock(g.to)}: ${sec(g.ms)} without Brand${wasDead(a, g.from, g.to) ? ' (you were dead)' : ''}`) })),
    });
  }

  const idRank = percentileRank(rs.identity, c.identity);
  if (idRank != null && idRank < WEAK_RANK) {
    out.push({
      kind: 'support-identity',
      title: tr('Ton identité couvre peu les dégâts de ton groupe', 'Your identity covers little of your party\'s damage'),
      what: tr(`${pct(c.identity, 1)} des dégâts de ton groupe ont été faits sous ton identité (médiane des ${a.spec} : ${pct(rs.identity[10], 1)}, meilleurs : ${pct(rs.identity[18], 1)}).`,
               `${pct(c.identity, 1)} of your party's damage was dealt under your identity (${a.spec} median: ${pct(rs.identity[10], 1)}, best: ${pct(rs.identity[18], 1)}).`),
      why: tr(`C'est le critère qui suit le mieux les dégâts qu'un support apporte (mesuré sur 803 supports).`, `It is the criterion that best tracks the damage a support adds (measured on 803 supports).`),
      how: [tr(`Remplis ta jauge plus vite (frappe le boss entre deux buffs) et utilise ton identité dès qu'elle est pleine, au moment où tes DPS lancent leurs gros sorts. Ne la garde pas trop longtemps.`,
               `Fill your gauge faster (hit the boss between buffs) and use your identity as soon as it is full, when your DPS use their big skills. Do not hold it too long.`)],
      moments: [],
    });
  }

  out.push(...shieldAdvice(a, ref, L));

  for (const sc of a.score?.skillScores || []) {
    if (sc.absent || sc.rank == null || sc.rank >= 25) continue;
    const isBuff = sd.buffSkills.some(b => b.id === sc.id || b.id === sc.id - (sc.id % 10));
    if (!isBuff) continue;
    out.push({
      kind: 'support-skill',
      title: tr(`Tu lances ${sc.name} moins souvent que les autres`, `You use ${sc.name} less often than others`),
      what: tr(`${num(sc.cpm)} fois par minute, contre ${num(sc.refCpmMedian)} en médiane chez les ${a.spec} et ${num(sc.refCpmP90)} chez les meilleurs.`,
               `${num(sc.cpm)} times per minute, versus ${num(sc.refCpmMedian)} median for ${a.spec} players and ${num(sc.refCpmP90)} for the best.`),
      why: tr(`Cette compétence pose un de tes buffs : moins tu la lances, plus ton groupe passe de temps sans.`, `This skill applies one of your buffs: the less you use it, the more time your party spends without it.`),
      how: [tr(`Relance-la dès qu'elle est prête, sauf si le même buff est encore actif pour plus de 2 secondes.`, `Recast it as soon as it is ready, unless the same buff still has more than 2 seconds left.`)],
      moments: [],
    });
  }
  return out;
}

// Boucliers : problème seulement si le groupe a pris des coups non protégés (part évitée faible pour la spé sur ce
// boss) ; un bouclier peu utile quand le groupe esquive bien n'est pas une faute. On cite alors les boucliers qui
// servent moins que chez les autres, et en exemples les grosses attaques du boss tombées sans bouclier du support.
// Ces exemples sont approximatifs (lancement de l'attaque, pas l'instant du coup ; corrélation 0,26 avec la part
// évitée, 0,22 avec les mises à terre de groupe) : jamais dans la note ni dans le déclenchement.
function shieldAdvice(a, ref, L) {
  const { tr, num, pct, sec, clock } = L;
  const sh = a.supportDetails?.shields, rs = ref.shields;
  if (!sh?.given || !rs?.protectedShare) return [];
  const protRank = percentileRank(rs.protectedShare, sh.protectedShare);
  if (protRank == null || protRank >= WEAK_RANK) return [];
  const M = x => `${num(x / 1e6, 1)} M`;
  const weak = sh.list.filter(s => {
    const r = rs.byShield?.[s.id];
    // Boucliers de moins de 3 s (ex. God's Decree, 1 s) : effets d'accompagnement qui ne se placent pas.
    return r && s.durationMs >= SHIELD_MIN_DURATION_MS && s.given >= sh.given * 0.05 && percentileRank(r.efficiency, s.efficiency) < WEAK_RANK;
  });
  const how = weak.map(s => {
    const r = rs.byShield[s.id];
    return tr(`${s.name} : ${M(s.given)} de bouclier donnés, ${pct(s.efficiency, 1)} ont vraiment absorbé des dégâts. Chez les autres ${a.spec} ${L.on.fr}, ce même bouclier sert à ${pct(r.efficiency[10], 1)} (meilleurs : ${pct(r.efficiency[18], 1)}). Le reste a disparu sans protéger personne.`,
              `${s.name}: ${M(s.given)} of shields given, ${pct(s.efficiency, 1)} actually absorbed damage. For other ${a.spec} players ${L.on.en}, the same shield is ${pct(r.efficiency[10], 1)} useful (best: ${pct(r.efficiency[18], 1)}). The rest vanished without protecting anyone.`);
  });
  how.push(tr(`Garde tes boucliers pour les attaques du boss qui touchent tout le groupe : lance-les une ou deux secondes avant le coup, pas dès qu'ils sont prêts. Un bouclier qui expire avant le coup ne sert à rien.`,
              `Keep your shields for boss attacks that hit the whole party: cast them one or two seconds before the hit, not as soon as they are ready. A shield that expires before the hit is wasted.`));
  const missed = (sh.bigAttacks || []).filter(x => !x.shielded);
  if (missed.length) how.push(tr(`Grosses attaques du boss tombées sans ton bouclier (à quelques secondes près : le log date le lancement de l'attaque, pas le coup) :`,
                                 `Big boss attacks that landed without your shield (within a few seconds: the log dates the start of the attack, not the hit):`));
  const moments = top(missed, 4, x => x.dmg).sort((x, y) => x.t - y.t).map(x => {
    const ended = x.lastShieldEnd != null && x.t - x.lastShieldEnd <= 5000
      ? tr(`ton bouclier s'était terminé ${sec(Math.max(0, x.t - x.lastShieldEnd))} avant`, `your shield had ended ${sec(Math.max(0, x.t - x.lastShieldEnd))} before`)
      : x.nextShield != null && x.nextShield - x.t <= 8000
        ? tr(`ton bouclier est arrivé ${sec(x.nextShield - x.t)} après`, `your shield came ${sec(x.nextShield - x.t)} after`)
        : tr('aucun bouclier autour', 'no shield around it');
    return { t: x.t, text: tr(`${clock(x.t)} : ${num(x.dmg / 1e3, 0)} k de dégâts, ${ended}`, `${clock(x.t)}: ${num(x.dmg / 1e3, 0)}k damage, ${ended}`) };
  });
  return [{
    kind: 'support-shield',
    title: tr('Tes boucliers ne tombent pas au bon moment', 'Your shields do not land at the right time'),
    what: tr(`Ton groupe a pris des dégâts sans protection : tes boucliers n'ont évité que ${pct(sh.protectedShare, 0)} des dégâts reçus par tes coéquipiers (médiane des ${a.spec} ${L.on.fr} : ${pct(rs.protectedShare[10], 0)}). Pourtant, sur ${M(sh.given)} de boucliers donnés, seuls ${pct(sh.efficiency, 1)} ont servi.`,
             `Your party took unprotected damage: your shields only prevented ${pct(sh.protectedShare, 0)} of the damage your teammates took (${a.spec} median ${L.on.en}: ${pct(rs.protectedShare[10], 0)}). Yet of ${M(sh.given)} shields given, only ${pct(sh.efficiency, 1)} were used.`),
    why: tr(`Un bouclier au bon moment évite des morts et laisse tes DPS frapper au lieu de se soigner. Dans le vent, il ne sert à rien.`,
            `A well-timed shield prevents deaths and lets your DPS keep attacking instead of healing. Wasted, it does nothing.`),
    how, moments,
  }];
}

// Objectifs écrits dans un guide de classe (data/rotation-guides.json), pour le build qu'il décrit seulement : rythme
// d'une compétence (utilisations ÷ durée du combat, comme le compteur de LOA Logs) et gravures déconseillées.
// Le guide est cité : ce n'est pas une mesure de la référence, mais une consigne publiée comparée au log.
export function guideAdvice(a, guides, L) {
  const g = guides?.specs?.[a.spec];
  if (!g || a.support) return [];
  const src = guides.sources?.[g.source];
  const { tr, num } = L;
  const key = tr('fr', 'en');
  // Même base que le compteur de LOA Logs cité par les guides : durée du combat, pas la chronologie (jusqu'à 6 % plus longue)
  const minutes = Math.max(1, a.fightMs || a.durationMs) / 60000;
  const main = a.skills.find(s => s.name === g.when.skill);
  if (!main || main.share < g.when.minShare) return [];
  const cite = src ? tr(`Source : ${src.title} (${src.authors}, ${src.updated}).`, `Source: ${src.title} (${src.authors}, ${src.updated}).`) : '';
  const out = [];
  for (const t of g.skills || []) {
    const s = a.skills.find(x => x.name === t.name);
    const cpm = s ? s.casts / minutes : 0;
    if (cpm >= t.cpmMin) continue;
    const target = t.cpmMax ? tr(`${t.cpmMin} à ${t.cpmMax}`, `${t.cpmMin} to ${t.cpmMax}`) : tr(`${t.cpmMin} et plus`, `${t.cpmMin} or more`);
    out.push({
      kind: 'guide', source: src || null,
      title: tr(`Guide ${g.build} : lance ${t.name} plus souvent`, `${g.build} guide: use ${t.name} more often`),
      what: tr(`${num(cpm)} fois par minute sur ce combat. Le guide de la classe vise ${target} pour le build ${g.build}.`,
               `${num(cpm)} times per minute in this fight. The class guide aims for ${target} for the ${g.build} build.`),
      why: `${t[key].why} ${cite}`,
      how: t[key].how,
      moments: [],
    });
  }
  const worn = new Set(a.build?.engravings || []);
  const bad = (g.engravingsAvoid || []).filter(e => worn.has(e.name));
  if (bad.length) out.push({
    kind: 'guide', source: src || null,
    title: tr(`Guide ${g.build} : gravure${bad.length > 1 ? 's' : ''} déconseillée${bad.length > 1 ? 's' : ''}`, `${g.build} guide: engraving${bad.length > 1 ? 's' : ''} not recommended`),
    what: tr(`Tu portes ${bad.map(e => e.name).join(', ')}, que le guide déconseille pour ce build.`, `You use ${bad.map(e => e.name).join(', ')}, which the guide advises against for this build.`),
    why: `${bad.map(e => `${e.name} : ${e[key]}`).join(' ; ')}. ${cite}`,
    how: [tr('Vérifie sur le guide avant de changer : remplace-la par une des gravures qu\'il conseille.', 'Check the guide before changing: replace it with one of the engravings it recommends.')],
    moments: [],
  });
  return out;
}

export function coachPlayer(a, ref, build, { lang = 'fr', arkPassiveNames = {}, skillMeta = {}, guides = null, scope = 'boss' } = {}) {
  const L = makeT(lang);
  // Référence du même boss ou de tous les boss (pickReference) : les phrases disent laquelle
  const sameBoss = scope === 'boss' || scope === 'bible-boss';
  L.on = sameBoss ? { fr: 'sur ce boss', en: 'on this boss' } : { fr: 'tous boss confondus', en: 'across all bosses' };
  const fromGuide = guideAdvice(a, guides, L);
  if (!ref) return fromGuide;
  const list = a.support
    ? [...supportAdvice(a, ref, L), ...activityAdvice(a, ref, L), ...buildAdvice(a, build, arkPassiveNames, L)]
    : [...dpsSkillAdvice(a, ref, build, L, skillMeta), ...activityAdvice(a, ref, L), ...buffAdvice(a, ref, L), ...positionalAdvice(a, ref, L), ...fromGuide, ...buildAdvice(a, build, arkPassiveNames, L)];
  // Les conseils chiffrés d'abord (gain estimé décroissant), puis les autres dans l'ordre ; le build en dernier.
  return list.sort((x, y) => (x.kind === 'build') - (y.kind === 'build') || (y.gainPct ?? -1) - (x.gainPct ?? -1));
}
