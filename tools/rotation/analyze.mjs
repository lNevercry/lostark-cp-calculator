// Analyse de rotation d'un combat LOA Logs en ligne de commande (prototype).
// Usage :
//   node tools/rotation/analyze.mjs --list [--player Nom] [--boss Texte] [--limit 20]
//   node tools/rotation/analyze.mjs <id du combat> [Nom du joueur] [--json]
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { openDb, listRaids, loadEncounter } from './db.mjs';
import { analyzeEncounter, pickReference, alignToReference, scorePlayer } from '../../js/rotation/metrics.js';
import { coachPlayer } from '../../js/rotation/coach.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = k => argv.includes(k);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !['--json', '--list', '--en'].includes(argv[i - 1])));

const db = openDb(opt('--db'));
const fmtTime = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const pct = x => (x == null ? '—' : `${(x * 100).toFixed(1)} %`);
const num = (x, d = 1) => (x == null ? '—' : x.toFixed(d));
const pad = (s, n) => String(s).slice(0, n).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);

const DATA = JSON.parse(readFileSync(path.join(HERE, '..', '..', 'data', 'rotation-skills.json'), 'utf8'));

if (flag('--list')) {
  const rows = await listRaids(db, { player: opt('--player'), boss: opt('--boss'), bosses: Object.keys(DATA.raids), limit: +opt('--limit', 20) });
  for (const r of rows) {
    console.log(`${lpad(r.id, 5)}  ${new Date(r.fight_start).toISOString().slice(0, 16).replace('T', ' ')}  ${pad(r.current_boss, 34)} ${pad(r.difficulty, 8)} ${lpad(fmtTime(r.duration), 6)}  ${pad(r.local_player, 14)} ${r.upstream_id ? 'lostark.bible/logs/' + r.upstream_id : ''}`);
  }
  process.exit(0);
}

const id = +positional[0];
if (!id) { console.error('Usage : analyze.mjs <id> [joueur] [--json] | --list [--player Nom] [--boss Texte]'); process.exit(1); }
const enc = await loadEncounter(db, id);
const skillMeta = DATA.skills;
const refFile = opt('--ref', path.join(HERE, '..', '..', 'data', 'rotation-ref.json'));
const refData = existsSync(refFile) ? JSON.parse(readFileSync(refFile, 'utf8')) : null;
const refs = refData?.refs || null;

const result = analyzeEncounter(enc, { skillMeta, buffMeta: DATA.buffs });
const who = positional[1] || enc.localPlayer;
for (const a of result.players) {
  const { ref, scope } = pickReference(refs, a.spec, enc.boss);
  a.skills = alignToReference(a, ref).skills; // référence lostark.bible : rythmes sur toute la chronologie
  a.reference = ref ? { scope, n: ref.n } : null;
  a.score = scorePlayer(a, ref);
}

if (flag('--json')) { console.log(JSON.stringify({ encounter: { id: enc.id, boss: enc.boss, difficulty: enc.difficulty, durationMs: enc.durationMs, bibleId: enc.bibleId }, ...result }, null, 1)); process.exit(0); }

const downMs = result.downtime.reduce((t, [a, b]) => t + b - a, 0);
console.log(`\n${enc.boss} (${enc.difficulty}) — ${fmtTime(enc.timelineMs)}, dont ${fmtTime(downMs)} où moins de la moitié du raid frappe${enc.bibleId ? `  ·  lostark.bible/logs/${enc.bibleId}` : ''}`);
console.log('\nJoueur          Classe / spé                     CP     DPS (M)  Activité  Sous PA+Marque  Placement  Note');
for (const a of result.players) {
  console.log(`${pad(a.name, 15)} ${pad(`${a.className} / ${a.spec}`, 30)} ${lpad(Math.round(a.combatPower || 0), 6)} ${lpad(num(a.dps / 1e6, 0), 9)}  ${lpad(pct(a.activity), 8)}  ${lpad(a.support ? '(support)' : pct(a.fullBuffRate), 14)}  ${lpad(a.positionalShare >= 0.05 ? pct(a.positionalRate) : '—', 9)}  ${lpad(a.score?.score ?? '—', 4)}`);
}

const a = result.players.find(p => p.name.toLowerCase() === who.toLowerCase());
if (!a) { console.error(`\nJoueur ${who} absent de ce combat.`); process.exit(1); }

console.log(`\n=== ${a.name} — ${a.className} / ${a.spec} ===`);
if (a.score) {
  const p = a.score.parts;
  const ref = { boss: `même spé sur ce boss`, spec: `même spé, tous boss`, 'bible-boss': `logs lostark.bible autour de la médiane, ce boss`, 'bible-spec': `logs lostark.bible autour de la médiane, tous boss` }[a.reference.scope];
  console.log(`Note d'exécution : ${a.score.score} / 100  (rang parmi ${a.reference.n} logs, ${ref})`);
  if (a.support) console.log(`  PA ${p.ap ?? '—'} · Marque ${p.brand ?? '—'} · Identité ${p.identity ?? '—'} · T ${p.hat ?? '—'} · Activité ${p.activity ?? '—'}`);
  else console.log(`  Activité ${p.activity ?? '—'} · Compétences ${p.skills ?? '—'} · Buffs ${p.buffs ?? '—'} · Placement ${p.positional ?? '—'}`);
} else console.log(a.support && !a.supportCoverage ? 'Note : couverture non calculée (groupe sans DPS ou avec deux supports).' : 'Note : pas assez de logs de référence pour cette spé.');

console.log(`\nTemps perdu : ${fmtTime(a.lostMs)} sur ${fmtTime(a.availableMs - a.deadMs)} jouables (activité ${pct(a.activity)})${a.deadMs >= 1000 ? `, ${fmtTime(a.deadMs)} à terre` : ''}`);
if (a.sharedPauseMs >= 1000) console.log(`Pauses partagées avec d'autres DPS (mécanique probable, non comptées) : ${fmtTime(a.sharedPauseMs)}`);
for (const g of a.longestGaps.filter(g => g.lostMs >= 2000)) console.log(`  ${fmtTime(g.from)} → ${fmtTime(g.to)} : ${num(g.lostMs / 1000)} s sans compétence${g.shared ? `  (pause partagée : ${g.pausedWith.join(', ')})` : ''}`);
if (a.supportCoverage) {
  const c = a.supportCoverage, rs = refs && pickReference(refs, a.spec, enc.boss).ref?.support;
  const med = k => (rs?.[k] ? ` (médiane ${pct(rs[k][10])}, top 10 % ${pct(rs[k][18])})` : '');
  console.log('\nCouverture du groupe (part des dégâts des DPS sous ton buff) :');
  console.log(`  PA ${pct(c.ap)}${med('ap')}\n  Marque ${pct(c.brand)}${med('brand')}\n  Identité ${pct(c.identity)}${med('identity')}\n  T ${pct(c.hat)}${med('hat')}`);
  const sh = a.supportDetails?.shields, rsh = refs && pickReference(refs, a.spec, enc.boss).ref?.shields;
  if (sh?.given) {
    console.log(`Boucliers : ${num(sh.given / 1e6)} M donnés, ${pct(sh.efficiency)} utiles${rsh?.efficiency ? ` (médiane ${pct(rsh.efficiency[10])})` : ''} ; ${pct(sh.protectedShare)} des dégâts reçus par ton groupe évités${rsh?.protectedShare ? ` (médiane ${pct(rsh.protectedShare[10])})` : ''}`);
    for (const s of sh.list) { const r = rsh?.byShield?.[s.id]; console.log(`  ${pad(s.name, 24)} ${lpad(num(s.given / 1e6), 6)} M  utile ${lpad(pct(s.efficiency), 7)}${r ? `  (médiane ${pct(r.efficiency[10])})` : ''}`); }
  }
}
if (!a.support) {
  console.log(`\nBuffs : PA du support ${pct(a.apRate)}, Marque ${pct(a.brandRate)}, les deux ${pct(a.fullBuffRate)}, identité ${pct(a.identityRate)}, T ${pct(a.hatRate)} des dégâts`);
  if (a.bigSkillFullBuffRate != null) console.log(`  Gros sorts (≥ 3 % des dégâts, ≥ 15 s entre deux) sous PA + Marque : ${pct(a.bigSkillFullBuffRate)}`);
}
if (a.positionalShare >= 0.05) console.log(`Placement : ${pct(a.positionalRate)} des dégâts des compétences à placement (${pct(a.positionalShare)} des dégâts)`);

console.log('\nCompétence                 Dégâts   Util.  /min   Écart méd.  Placement  PA+Marque  Réf. /min (méd. / p90)  Rang');
const scored = new Map((a.score?.skillScores || []).map(s => [s.id, s]));
for (const s of a.skills.filter(s => (a.support ? s.casts > 0 && (scored.has(s.id) || s.share >= 0.02) : s.share >= 0.005 || scored.has(s.id)))) {
  const sc = scored.get(s.id);
  console.log(`${pad(s.name, 25)} ${lpad(pct(s.share), 7)} ${lpad(s.casts, 6)} ${lpad(num(s.cpm), 5)}  ${lpad(s.medianIntervalMs == null ? '—' : num(s.medianIntervalMs / 1000) + ' s', 10)}  ${lpad(s.positional ? pct(s.positionalRate) : '', 9)}  ${lpad(pct(s.fullBuffRate), 9)}  ${lpad(sc ? `${num(sc.refCpmMedian)} / ${num(sc.refCpmP90)}` : '', 22)}  ${lpad(sc?.rank ?? '', 4)}`);
}
for (const s of (a.score?.skillScores || []).filter(s => s.absent)) console.log(`${pad(s.name, 25)} absente (jouée par la plupart des ${a.spec} : ${num(s.refCpmMedian)} /min en médiane)`);

console.log(`\nOuverture : ${a.opener.map(o => `${o.name} (${num(o.t / 1000)} s)`).join(' → ')}`);

const lang = flag('--en') ? 'en' : 'fr';
const guidesFile = path.join(HERE, '..', '..', 'data', 'rotation-guides.json');
const guides = existsSync(guidesFile) ? JSON.parse(readFileSync(guidesFile, 'utf8')) : null;
const advice = coachPlayer(a, pickReference(refs, a.spec, enc.boss).ref, refData?.builds?.[a.spec], { lang, arkPassiveNames: DATA.arkPassive, skillMeta, guides, scope: a.reference?.scope });
console.log(`\n${'='.repeat(20)} ${lang === 'en' ? 'HOW TO IMPROVE' : 'COMMENT PROGRESSER'} ${'='.repeat(20)}`);
if (!advice.length) console.log(lang === 'en' ? 'Nothing stands out: you play like the best of your spec on this boss.' : 'Rien ne ressort : tu joues comme les meilleurs de ta spé sur ce boss.');
const MAX_ADVICE = 5; // au-delà, trop d'un coup : les plus importants d'abord, le build à part
const main = advice.filter(c => c.kind !== 'build'), shown = [...main.slice(0, MAX_ADVICE), ...advice.filter(c => c.kind === 'build')];
shown.forEach((c, i) => {
  console.log(`\n${i + 1}. ${c.title}${c.gainPct != null ? `  (≈ +${lang === 'en' ? c.gainPct.toFixed(1) + '%' : c.gainPct.toFixed(1).replace('.', ',') + ' %'} ${lang === 'en' ? 'damage' : 'de dégâts'})` : ''}`);
  console.log(`   ${c.what}`);
  console.log(`   ${c.why}`);
  for (const h of c.how) console.log(`   → ${h}`);
  for (const m of c.moments) console.log(`      • ${m.text}`);
});
if (main.length > MAX_ADVICE) console.log(`\n${lang === 'en' ? `…and ${main.length - MAX_ADVICE} smaller points: work on these first.` : `…et ${main.length - MAX_ADVICE} points moins importants : commence par ceux-là.`}`);
