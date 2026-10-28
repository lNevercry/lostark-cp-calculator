// Brassard T4 (Vambraces, raid Belgardin) : modèle, lignes du GPD et onglet.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// === Brassard T4 (완갑, Vambraces en EU, raid Belgardin) ===
// data/bracer-t4.json (tools/build-bracer-table.mjs) : stats par niveau et recette d'affinage de loa-sim.vercel.app,
// contrôlées contre tout ce qui est officiel (infobulles +10 / 15 / 20 / 25, taux, coût du niveau 1 : src official) ;
// le flux Maxroll n'a pas encore le brassard. Un état du brassard = { grade (0 héroïque … 3 ancien), level } : la
// rareté donne le % de PA de base (0 / 1 / 2 / 3 %) et change au déblocage de +10 / +15 / +20 (matériaux de raid,
// sans or). Le brassard ne donne ni iLvl, ni qualité, ni points d'Ark Passive.
let bracerT4 = null;
async function loadBracerT4() {
  try {
    const res = await fetch('data/bracer-t4.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Variantes de souffles de chaque étape, objets gardés : recipeStepCost met ses résultats en cache par recette
    data.steps.forEach(st => { st.variants = bracerBreathVariants(st); });
    bracerT4 = data;
    bracerChainCache = null;
    updateBelgardinView();
    // Lignes du brassard dans le GPD et le Smart Advisor dès que la table est là
    if (typeof renderEfficiencyTable === 'function') renderEfficiencyTable();
    if (typeof renderAdvisorView === 'function') renderAdvisorView();
  } catch (e) {
    console.warn('[BRASSARD] Table du brassard indisponible :', e.message);
  }
}

// Niveaux de chaque rareté (repli sans la table : mêmes bornes que data/bracer-t4.json)
const BRACER_RANGES = [[0, 10], [10, 15], [15, 20], [20, 25]];
const BRACER_GRADES = [
  { key: 'heroic', fr: 'Héroïque', en: 'Heroic' },
  { key: 'legendary', fr: 'Légendaire', en: 'Legendary' },
  { key: 'relic', fr: 'Relique', en: 'Relic' },
  { key: 'ancient', fr: 'Ancien', en: 'Ancient' }
];
const bracerGradeName = (grade, isEn) => (isEn ? BRACER_GRADES[grade].en : BRACER_GRADES[grade].fr);
const bracerStateLabel = (s, isEn) => (s ? `${bracerGradeName(s.grade, isEn)} +${s.level}` : (isEn ? 'No vambraces' : 'Sans brassard'));

// Tous les états dans l'ordre d'amélioration : Héroïque +0 … +10, Légendaire +10 (déblocage) … +15, Relique +15 … +20,
// Ancien +20 … +25 (29 états)
let bracerChainCache = null;
function bracerChain() {
  if (!bracerChainCache) {
    bracerChainCache = [];
    BRACER_RANGES.forEach(([min, max], grade) => { for (let level = min; level <= max; level++) bracerChainCache.push({ grade, level }); });
  }
  return bracerChainCache;
}
const bracerIndex = s => (s ? bracerChain().findIndex(c => c.grade === s.grade && c.level === s.level) : -1);
const bracerIsLimitBreak = (a, b) => !!(a && b && a.level === b.level && b.grade === a.grade + 1);

// État d'après un nombre (anciens appels) : +N après le déblocage de ce niveau (+10 = Légendaire +10), -1 = sans brassard
function bracerState(x) {
  if (x === null || x === undefined || x === -1) return null;
  if (typeof x === 'number') {
    if (!(x >= 0 && x <= 25)) return null;
    return { grade: BRACER_RANGES.reduce((g, [min], i) => (x >= min ? i : g), 0), level: x };
  }
  return bracerIndex(x) >= 0 ? { grade: x.grade, level: x.level } : null;
}

/**
 * Brassard porté, lu sur le profil raid lostark.bible (emplacement « bracer ») : ID 134GxxNNN, rareté = chiffre des
 * centaines de mille − 3 (3 héroïque … 6 ancien, comme loa-sim), niveau = affinage. flatAp : PA fixe du profil
 * (stat 114, celle du brassard ; 2 030 sur les profils EU au brassard +10 héroïque). null sans brassard lisible.
 */
function equippedBracer(charObj) {
  const lo = (charObj && charObj.rawProfile && charObj.rawProfile.loadout) || {};
  const it = (lo.items || []).find(i => i.slot === 'bracer' || i.slot === 'vambrace');
  const level = it && it.data ? it.data.honing : undefined;
  const id = it ? Number(it.id) : NaN;
  if (!Number.isInteger(level) || Math.floor(id / 1e6) !== 134 || Math.floor(id / 1e4) % 10 !== 0) return null;
  const grade = Math.floor(id / 1e5) % 10 - 3;
  const range = BRACER_RANGES[grade];
  if (!range || level < range[0] || level > range[1]) return null;
  const flat = (lo.stats || []).find(s => s.type === 114);
  return { grade, level, flatAp: flat && flat.value > 0 ? flat.value : 0 };
}

// Stats du brassard dans un état (ou à +N après déblocage) : stat principale, puissance d'arme, Vitalité, PA fixe,
// % de PA de la rareté, source
function calcBracerStats(x) {
  const s = bracerState(x);
  const l = s && bracerT4 && bracerT4.levels[s.level];
  const g = s && bracerT4 && bracerT4.grades[s.grade];
  return l && g ? Object.assign({ grade: s.grade, level: s.level }, l, { apPct: g.apPct }) : null;
}

// Multiplicateur de la stat principale du brassard : mesuré sur le profil (comme les armures), sinon Inven (× 1,09)
const bracerMainStatMult = ctx => (ctx.msMult > 1 ? ctx.msMult : (bracerT4 && bracerT4.mainStatMult) || 1);

// Attaque du personnage avec le brassard dans l'état s (null = sans brassard), le brassard porté (cur) retiré du profil.
// Formule d'Inven #3790814 : PA de base = (√(stat × puissance d'arme ÷ 6) + PA fixe) × (1 + % de PA) ; stat du brassard
// × multiplicateur du profil, puissance d'arme × (1 + % boucles + Karma + cœur) comme celle de l'arme.
function bracerAttackState(ctx, apPool, s, cur) {
  const to = s ? calcBracerStats(s) : null, from = cur ? calcBracerStats(cur) : null;
  const d = k => (to ? to[k] : 0) - (from ? from[k] : 0);
  const st = {
    wp: ctx.wp + d('weaponPower') * ctx.wpAmp,
    ms: ctx.ms + d('mainStat') * bracerMainStatMult(ctx),
    flat: to ? to.flatAp : 0,
    apPct: apPool + d('apPct') / 100,
    vit: ctx.vit + d('vitality')
  };
  st.atk = (Math.sqrt(st.wp * st.ms / 6) + st.flat) * (1 + st.apPct);
  return st;
}

// Recettes d'une étape à essayer : souffle de lave seul, de glacier seul, ou les deux sur le même essai (même taux et
// même maximum chacun : un seul « souffle » au prix moyen, maximum doublé, cf. breathUnitPrice)
function bracerBreathVariants(st) {
  const base = { success: st.success, failBonus: st.failBonus, failMax: st.failMax, threshold: st.threshold, gold: st.gold, mats: st.mats };
  const bs = (st.breaths || []).filter(b => b.max > 0);
  const out = bs.map(b => Object.assign({}, base, { breath: b }));
  if (bs.length === 2 && bs[0].rate === bs[1].rate && bs[0].max === bs[1].max) {
    out.push(Object.assign({}, base, { breath: { slugs: bs.map(b => b.slug), rate: bs[0].rate, max: bs[0].max * 2 } }));
  }
  return out.length ? out : [base];
}

// Coût attendu de +level → +level+1 (recipeStepCost, prix du marché) : la variante de souffles la moins chère.
// breath : souffle retenu (null = aucun), step : recette de la table
function bracerStepCost(level) {
  const st = bracerT4 && bracerT4.steps[level];
  if (!st) return null;
  let best = null;
  (st.variants || bracerBreathVariants(st)).forEach(v => {
    const r = recipeStepCost(v);
    if (!best || r.cost < best.r.cost) best = { r, v };
  });
  return Object.assign({}, best.r, { step: st, breath: best.r.breaths > 0 ? best.v.breath : null });
}

// Stratégie de souffles d'une étape (bracerStepCost) : « aucun souffle », « 25 souffles de lave + 25 de glacier sur
// les 15 premiers essais »…
function bracerBreathText(c, isEn) {
  if (!c) return '';
  if (!(c.breaths > 0) || !c.breath) return isEn ? 'no breath' : 'aucun souffle';
  const when = c.breathAll ? (isEn ? 'every tap' : 'à chaque essai') : (isEn ? `on the first ${c.breathTaps} taps` : `sur les ${c.breathTaps} premiers essais`);
  const b = c.breath;
  if (b.slugs) {
    const n = b.max / b.slugs.length;
    return isEn ? `${n} Lava's + ${n} Glacier's breaths ${when}` : `${n} souffles de lave + ${n} de glacier ${when}`;
  }
  const lava = b.slug === 'lavas-breath';
  return isEn ? `${b.max} ${lava ? "Lava's" : "Glacier's"} breaths ${when}` : `${b.max} souffles ${lava ? 'de lave' : 'de glacier'} ${when}`;
}

// Matériaux d'un déblocage (au niveau +level) : Normal ou Hard / Nightmare
function bracerLimitBreakText(level, isEn) {
  const lb = bracerT4 && bracerT4.limitBreak[level];
  if (!lb) return '';
  const it = bracerT4.limitBreakItems || {};
  const name = k => (it[k] ? (isEn ? it[k].en : `${it[k].en} (${it[k].ko})`) : k);
  return lb.remnant
    ? (isEn ? `${lb.remnant} ${name('remnant')} (Normal) or ${lb.deathHand} ${name('deathHand')} (Hard / Nightmare)`
      : `${lb.remnant} ${name('remnant')} (Normal) ou ${lb.deathHand} ${name('deathHand')} (Hard / Nightmare)`)
    : (isEn ? `${lb.deathHand} ${name('deathHand')} only (Hard / Nightmare)` : `${lb.deathHand} ${name('deathHand')} uniquement (Hard / Nightmare)`);
}

/**
 * Ressources pour monter le brassard d'un état à un autre (from null = sans brassard : le premier, Héroïque +0, est
 * offert au premier clear de la porte 2) : essais attendus par étape (bracerStepCost : souffles les moins chers, règle
 * d'artisan des recettes T4), or, argent (connu au niveau 1 seulement), fragments (jauge comprise), matériaux,
 * souffles, valeur en or au marché (or + matériaux + souffles, comme le GPD ; fragments et argent hors valeur),
 * pire cas, et déblocages franchis (matériaux de raid, sans or). loaSim = au moins une étape de la table de loa-sim.
 */
function getBracerHoningCumulativeCost(fromX, toX) {
  if (!bracerT4) return null;
  const chain = bracerChain();
  const from = bracerState(fromX), to = bracerState(toX);
  const i0 = from ? bracerIndex(from) : 0, i1 = bracerIndex(to);
  if (i0 < 0 || i1 < 0 || i0 > i1) return null;
  const out = { gold: 0, silver: 0, silverKnown: true, shards: 0, mats: {}, breaths: {}, value: 0, pity: 0, taps: 0, steps: 0, loaSim: false, limitBreaks: [] };
  for (let i = i0; i < i1; i++) {
    const a = chain[i], b = chain[i + 1];
    if (bracerIsLimitBreak(a, b)) {
      out.limitBreaks.push(Object.assign({}, bracerT4.limitBreak[a.level], { level: a.level, grade: b.grade }));
      continue;
    }
    const c = bracerStepCost(a.level);
    if (!c) return null;
    const st = c.step;
    out.steps++;
    out.taps += c.taps;
    out.value += c.cost;
    out.pity += c.pityCost;
    out.gold += st.gold * c.taps;
    if (st.silver !== undefined) out.silver += st.silver * c.taps; else out.silverKnown = false;
    out.shards += st.shards * c.taps + (st.shardsOnce || 0);
    Object.entries(st.mats).forEach(([slug, n]) => { out.mats[slug] = (out.mats[slug] || 0) + n * c.taps; });
    if (c.breath) {
      const slugs = c.breath.slugs || [c.breath.slug];
      slugs.forEach(slug => { out.breaths[slug] = (out.breaths[slug] || 0) + c.breathsUsed / slugs.length; });
    }
    if (st.src !== 'official') out.loaSim = true;
  }
  return out;
}

/**
 * Effet du brassard sur le personnage importé, de l'état from à l'état to (états ou +N après déblocage ; from omis =
 * brassard porté, null / -1 = sans brassard). Le brassard porté est retiré des stats du profil avant de poser les deux
 * états. DPS : dégâts = 100 × ln(rapport des PA de base), CP = CP × écart de PA de base ÷ PA de base avec le brassard
 * porté (partie type 1 = PA de base × 2,88) : le CP du profil compte le brassard porté, donc « Aucun ➔ Héroïque +10 (fait) »
 * vaut CP × (1 − 1 ÷ rapport) et non CP × (rapport − 1) (Neevercry : +372 CP, 6 040 ➔ 6 410 en jeu ; avant +395), et les
 * paliers se somment. Support : buff par supportContribution (canal ap), CP = branche buff × écart de PA de base ÷ PA
 * portée + branche défense × écart de Vitalité ÷ Vitalité portée. PV max proportionnels à la Vitalité. null sans
 * personnage lisible ou sans table.
 */
function simulateBracerImpact(charObj, toX, isSupport, fromX) {
  const ctx = gearStatContext(charObj);
  const p1 = battlePointPartsOf(charObj).find(p => p.type === 1);
  if (!bracerT4 || !ctx || !p1) return null;
  const cur = equippedBracer(charObj);
  const to = bracerState(toX), from = fromX === undefined ? cur : bracerState(fromX);
  if (!to || (fromX !== undefined && fromX !== null && fromX !== -1 && !from) || bracerIndex(from) > bracerIndex(to)) return null;
  const apPool = (p1.attackPowerMultiplier || 0) / 100;
  const a = bracerAttackState(ctx, apPool, from, cur), b = bracerAttackState(ctx, apPool, to, cur);
  const w = bracerAttackState(ctx, apPool, cur, cur);
  const ratio = b.atk / a.atk;
  const vitRatio = a.vit > 0 ? b.vit / a.vit : 1;
  const cp = (charObj.rawProfile && charObj.rawProfile.raidCombatPower) || charObj.cp;
  const used = [to, from].filter(Boolean).map(calcBracerStats);
  const out = {
    to, from, current: cur, stats: calcBracerStats(to),
    statsLoaSim: used.some(s => s.src !== 'official'),
    hpGainPct: (vitRatio - 1) * 100,
    costs: getBracerHoningCumulativeCost(from, to),
    dpsGainPct: null, allyBuffPct: null, cpGain: null
  };
  if (!isSupport) {
    out.dpsGainPct = 100 * Math.log(ratio);
    out.cpGain = cp > 0 ? cp * (b.atk - a.atk) / w.atk : null;
  } else {
    const inp = supportInputs(charObj);
    out.allyBuffPct = 100 * Math.log(supportContribution(inp, b.wp, b.ms, inp.gemAvg, b.apPct, b.flat) /
      supportContribution(inp, a.wp, a.ms, inp.gemAvg, a.apPct, a.flat));
    const br = supportBpBranches(charObj);
    out.cpGain = br ? br.A * (b.atk - a.atk) / w.atk + (w.vit > 0 ? br.D * (b.vit - a.vit) / w.vit : 0) : null;
  }
  return out;
}

// === Lignes du brassard porté (GPD, Smart Advisor, feuille de route) ===
// Déblocage disponible tout de suite (brassard au maximum de sa rareté) : matériaux de raid, 0 or.
function bracerLimitBreakNow(charObj, isSupport) {
  const cur = equippedBracer(charObj);
  const chain = bracerChain();
  const i = bracerIndex(cur);
  if (!bracerT4 || i < 0 || !bracerIsLimitBreak(cur, chain[i + 1])) return null;
  const to = chain[i + 1];
  const sim = simulateBracerImpact(charObj, to, isSupport, cur);
  if (!sim) return null;
  return { from: cur, to, sim, gain: isSupport ? sim.allyBuffPct : sim.dpsGainPct };
}

/**
 * k-ième étape d'affinage du brassard porté (1 = la prochaine), une fois le déblocage disponible fait (il est gratuit,
 * ligne à part) et les k − 1 étapes précédentes faites. Un affinage qui atteint le maximum de la rareté (+10 / +15 /
 * +20) compte aussi le déblocage qu'il ouvre (lb : matériaux de raid, sans or) : sans lui, l'étape suivante n'existe pas.
 * Gain marginal (DPS : % de dégâts, support : % de buff), coût attendu du seul affinage. null au bout (Ancien +25).
 */
function bracerHoningStep(charObj, isSupport, k = 1) {
  const cur = equippedBracer(charObj);
  const chain = bracerChain();
  let i = bracerIndex(cur);
  if (!bracerT4 || i < 0) return null;
  if (bracerIsLimitBreak(chain[i], chain[i + 1])) i++;
  let from = null, to = null, lb = null;
  for (let j = 1; j <= k; j++) {
    if (i + 1 >= chain.length) return null;
    from = chain[i];
    to = chain[++i];
    lb = bracerIsLimitBreak(to, chain[i + 1]) ? chain[++i] : null;
  }
  const sim = simulateBracerImpact(charObj, lb || to, isSupport, from);
  const cost = bracerStepCost(from.level);
  if (!sim || !cost) return null;
  return { from, to, lb, sim, cost, gain: isSupport ? sim.allyBuffPct : sim.dpsGainPct };
}

// Textes d'une étape d'affinage du brassard (GPD, Smart Advisor, feuille de route)
function bracerStepTexts(st, isEn) {
  const breath = bracerBreathText(st.cost, isEn);
  const lbTxt = st.lb ? (isEn ? `then limit break to ${bracerGradeName(st.lb.grade, isEn)}` : `puis déblocage ${bracerGradeName(st.lb.grade, isEn)}`) : '';
  const pity = honingPityText(Math.round(st.cost.pityCost), st.cost.pityTaps, isEn);
  return {
    step: `${bracerStateLabel(st.from, isEn)} ➔ +${st.to.level}${st.lb ? ` ➔ ${bracerGradeName(st.lb.grade, isEn)}` : ''}`,
    breath, lbTxt, pity,
    detail: [breath, st.lb ? `${lbTxt} : ${bracerLimitBreakText(st.to.level, isEn)}` : '', pity ? (isEn ? `at pity: ${pity}` : `au pity : ${pity}`) : ''].filter(Boolean).join(' · ')
  };
}

// === ONGLET BELGARDIN (brassard T4) ===
// Simulation sur le personnage importé (simulateBracerImpact), du brassard porté (ou d'un point de départ choisi) à
// l'état visé. Niveaux officiels (+10 / 15 / 20 / 25) signalés comme tels, les autres viennent de loa-sim.
// belgState.idx : état visé (index de bracerChain), null = suivant du brassard porté ; from : index, -1 = sans brassard,
// undefined = brassard porté
const belgState = { idx: null, from: undefined };

function initBelgardinTab() {
  const range = document.getElementById('belgLevel');
  if (!range) return;
  range.addEventListener('input', e => { belgState.idx = parseInt(e.target.value, 10) || 0; updateBracerView(); });
  document.querySelectorAll('[data-belg-level]').forEach(btn => btn.addEventListener('click', () => {
    belgState.idx = bracerIndex(bracerState(parseInt(btn.getAttribute('data-belg-level'), 10) || 0));
    updateBracerView();
  }));
  const from = document.getElementById('belgFrom');
  if (from) from.addEventListener('change', e => { belgState.from = parseInt(e.target.value, 10); updateBracerView(); });
  const ready = document.getElementById('belgReady');
  if (ready) ready.addEventListener('click', e => {
    const d = e.target.closest('[data-belg-diff]'), g = e.target.closest('[data-belg-goal]');
    if (d) belgReadyState.diff = d.getAttribute('data-belg-diff');
    else if (g) belgReadyState.goal = g.getAttribute('data-belg-goal');
    else return;
    renderBelgardinReadiness();
  });
}

function updateBelgardinView() {
  renderBelgardinReadiness();
  updateBracerView();
}

function updateBracerView() {
  const results = document.getElementById('belgResults');
  if (!results) return;
  const isEn = isEnLang();
  const isSupport = state.role === 'support';
  const charObj = getCurrentActiveCharacter();
  const fmt = (v, d = 0) => Number(v).toLocaleString(isEn ? 'en-US' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v, d = 2) => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v), d)}`;
  const simBadge = `<span class="belg-src belg-src-est">${isEn ? 'loa-sim table' : 'Table loa-sim'}</span>`;
  const officialBadge = `<span class="belg-src belg-src-off">${isEn ? 'Official (Stove)' : 'Officiel (Stove)'}</span>`;

  if (!bracerT4) {
    results.innerHTML = `<p class="belg-empty">${isEn ? 'Loading the vambraces table…' : 'Chargement de la table du brassard…'}</p>`;
    return;
  }
  const chain = bracerChain();
  const cur = charObj ? equippedBracer(charObj) : null;
  const curIdx = bracerIndex(cur);
  // Par défaut : l'état qui suit le brassard porté (ex. Héroïque +10 → déblocage Légendaire), sinon Légendaire +10
  if (belgState.idx === null) belgState.idx = curIdx >= 0 ? Math.min(chain.length - 1, curIdx + 1) : bracerIndex(bracerState(10));
  const idx = Math.min(chain.length - 1, Math.max(0, belgState.idx));
  const target = chain[idx];
  let fromIdx = belgState.from === undefined ? (curIdx >= 0 ? curIdx : 0) : belgState.from;
  if (fromIdx > idx) fromIdx = curIdx >= 0 && curIdx <= idx ? curIdx : (idx === 0 ? -1 : 0);
  const from = fromIdx >= 0 ? chain[fromIdx] : null;

  const range = document.getElementById('belgLevel');
  if (range) { range.max = String(chain.length - 1); range.value = String(idx); }
  const out = document.getElementById('belgLevelOut');
  if (out) out.textContent = `+${target.level}`;
  const gradeEl = document.getElementById('belgGrade');
  if (gradeEl) {
    gradeEl.textContent = bracerGradeName(target.grade, isEn);
    gradeEl.className = `belg-grade belg-grade-${BRACER_GRADES[target.grade].key}`;
  }
  document.querySelectorAll('[data-belg-level]').forEach(btn => btn.classList.toggle('active', bracerIndex(bracerState(parseInt(btn.getAttribute('data-belg-level'), 10))) === idx));
  const fromSel = document.getElementById('belgFrom');
  if (fromSel) {
    // Départs possibles : sans brassard, puis chaque état avant la cible (+0 pour la cible +0, l'état porté s'il est la cible)
    const opts = [-1].concat(Array.from({ length: Math.max(1, idx) }, (_, i) => i)).concat(fromIdx === idx && idx > 0 ? [idx] : []);
    fromSel.innerHTML = opts.map(i => {
      const s = i >= 0 ? chain[i] : null;
      const txt = !s ? (isEn ? 'No vambraces' : 'Sans brassard')
        : `${bracerStateLabel(s, isEn)}${i === 0 ? (isEn ? ' (given on the first Gate 2 clear)' : ' (offert au premier clear de la porte 2)') : ''}${i === curIdx ? (isEn ? ' — worn' : ' — porté') : ''}`;
      return `<option value="${i}"${i === fromIdx ? ' selected' : ''}>${txt}</option>`;
    }).join('');
  }

  const sim = charObj ? simulateBracerImpact(charObj, target, isSupport, from) : null;
  const stats = calcBracerStats(target);

  // 1. Résultats
  let html = '';
  if (charObj) {
    html += `<p class="belg-note">${cur
      ? (isEn ? `Worn: <strong>${bracerStateLabel(cur, isEn)}</strong> (lostark.bible profile, flat attack power ${fmt(cur.flatAp)}).`
        : `Porté : <strong>${bracerStateLabel(cur, isEn)}</strong> (profil lostark.bible, PA fixe ${fmt(cur.flatAp)}).`)
      : (isEn ? 'No vambraces on the lostark.bible raid profile: the first one (Heroic +0) is given on the first Gate 2 clear.'
        : 'Pas de brassard sur le profil raid lostark.bible : le premier (Héroïque +0) est offert au premier clear de la porte 2.')}</p>`;
  }
  if (!sim) {
    html += `<p class="belg-empty">${isEn
        ? 'Import a character to simulate the vambraces on its real stats (weapon power, main stat, attack power multiplier, Combat Power).'
        : 'Importe un personnage pour simuler le brassard sur ses vraies stats (puissance d\'arme, stat principale, % de PA, Combat Power).'}</p>`;
  } else {
    const card = (label, value, sub) => `<div class="belg-card"><span class="belg-card-label">${label}</span><span class="belg-card-value">${value}</span>${sub ? `<span class="belg-card-sub">${sub}</span>` : ''}</div>`;
    const cpCard = sim.cpGain === null ? '' : card(isEn ? 'Combat Power' : 'Combat Power', `${signed(sim.cpGain, 0)} CP`,
      isEn ? `in-game CP ${fmt(charObj.rawProfile.raidCombatPower || charObj.cp, 0)}` : `CP en jeu ${fmt(charObj.rawProfile.raidCombatPower || charObj.cp, 0)}`);
    html += `<div class="belg-cards">`;
    if (!isSupport) {
      html += card(isEn ? 'Damage' : 'Dégâts', `${signed(sim.dpsGainPct)} %`, isEn ? 'personal damage, base attack ratio' : 'dégâts personnels, rapport des PA de base') + cpCard;
    } else {
      html += card(isEn ? 'Ally buff' : 'Buff allié', `${signed(sim.allyBuffPct)} %`, isEn ? 'damage of each ally (GPD scale)' : 'dégâts de chaque allié (échelle du GPD)')
        + card(isEn ? 'Max HP' : 'PV max', `${signed(sim.hpGainPct)} %`, isEn ? 'Vitality of the vambraces' : 'Vitalité du brassard') + cpCard;
    }
    html += `</div><p class="belg-note">${isEn ? `From ${bracerStateLabel(from, isEn)} to ${bracerStateLabel(target, isEn)}.` : `De ${bracerStateLabel(from, isEn)} à ${bracerStateLabel(target, isEn)}.`} ${sim.statsLoaSim ? simBadge : officialBadge}</p>`;
  }

  // 2. Stats du brassard dans l'état visé
  const ctxB = charObj ? gearStatContext(charObj) : null;
  const measured = !!(ctxB && ctxB.msMult > 1);
  const mm = measured ? ctxB.msMult : (bracerT4.mainStatMult || 1);
  const mmTxt = measured ? (isEn ? 'measured on the profile, like the armors' : 'mesuré sur le profil, comme les armures') : (isEn ? 'avatars and pet ranch, Inven' : 'avatars et ranch, Inven');
  html += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Vambraces' : 'Brassard'} ${bracerStateLabel(target, isEn)}</th><th>${isEn ? 'Value' : 'Valeur'}</th></tr></thead><tbody>
      <tr><td>${isEn ? 'Main stat' : 'Stat principale'} <span class="belg-dim">(× ${fmt(mm, 3)}, ${mmTxt})</span></td><td class="market-num">${fmt(stats.mainStat)}</td></tr>
      <tr><td>${isEn ? 'Weapon power' : "Puissance d'arme"} <span class="belg-dim">(× ${isEn ? 'earrings and Karma' : 'boucles et Karma'})</span></td><td class="market-num">${fmt(stats.weaponPower)}</td></tr>
      <tr><td>${isEn ? 'Vitality' : 'Vitalité'}</td><td class="market-num">${fmt(stats.vitality)}</td></tr>
      <tr><td>${isEn ? 'Base attack power (flat)' : 'PA de base (fixe)'}</td><td class="market-num">+${fmt(stats.flatAp)}</td></tr>
      <tr><td>${isEn ? 'Base attack power' : 'PA de base'} <span class="belg-dim">(${isEn ? 'grade' : 'rareté'})</span></td><td class="market-num">+${fmt(stats.apPct, 1)} %</td></tr>
    </tbody></table>
    <p class="belg-note">${stats.src === 'official' ? officialBadge : simBadge} ${isEn
      ? 'Official tooltips at Heroic +10, +15, +20 and +25 (developer letter); the other levels come from loa-sim.vercel.app, identical to every official value (a step table: one stat goes up at each level, flat attack power every 5 levels). Attack power % follows the grade (0 / 1 / 2 / 3 %), gained at each limit break. No item level, quality or Ark Passive points: the character\'s item level stays the average of its 6 pieces.'
      : "Infobulles officielles à Héroïque +10, +15, +20 et +25 (lettre des développeurs) ; les autres niveaux viennent de loa-sim.vercel.app, identique à toutes les valeurs officielles (en escalier : une stat monte à chaque niveau, la PA fixe tous les 5 niveaux). Le % de PA suit la rareté (0 / 1 / 2 / 3 %), gagnée à chaque déblocage. Ni iLvl, ni qualité, ni points d'Ark Passive : l'iLvl du personnage reste la moyenne de ses 6 pièces."}</p>`;
  results.innerHTML = html;

  // 3. Plan de stockage
  const costsEl = document.getElementById('belgCosts');
  const cost = getBracerHoningCumulativeCost(from, target);
  if (costsEl) {
    let c = '';
    if (!cost || (!cost.steps && !cost.limitBreaks.length)) {
      c += `<p class="belg-empty">${isEn ? 'Nothing to do between these two states.' : 'Rien à faire entre ces deux états.'}</p>`;
    } else {
      const matName = slug => {
        for (const g of MARKET_PRICE_GROUPS) { const it = g.items.find(x => x[0] === slug); if (it) return it[1]; }
        return marketSlugLabel(slug);
      };
      const row = (label, n, cls = '') => `<tr${cls ? ` class="${cls}"` : ''}><td>${label}</td><td class="market-num">${n}</td></tr>`;
      const start = from || chain[0];
      c += `<table class="market-table belg-table"><thead><tr><th>${isEn ? `${bracerStateLabel(start, isEn)} → ${bracerStateLabel(target, isEn)}, expected` : `${bracerStateLabel(start, isEn)} → ${bracerStateLabel(target, isEn)}, moyenne attendue`}</th><th>${isEn ? 'Amount' : 'Quantité'}</th></tr></thead><tbody>`;
      if (cost.steps) {
        c += row(isEn ? 'Attempts' : 'Essais', fmt(cost.taps, 1));
        c += row(isEn ? 'Gold' : 'Or', fmt(Math.round(cost.gold)));
        if (cost.silverKnown) c += row(isEn ? 'Silver' : 'Argent', fmt(Math.round(cost.silver)));
        c += row(isEn ? 'Destiny shards (gauge included)' : 'Fragments de destin (jauge comprise)', fmt(Math.round(cost.shards)));
        Object.entries(cost.mats).forEach(([slug, n]) => { c += row(escapeHtml(matName(slug)), fmt(Math.round(n))); });
        Object.entries(cost.breaths).forEach(([slug, n]) => { c += row(escapeHtml(matName(slug)), fmt(Math.round(n))); });
      }
      cost.limitBreaks.forEach(lb => {
        c += row(`${isEn ? 'Limit break' : 'Déblocage'} +${lb.level} → ${bracerGradeName(lb.grade, isEn)} ${officialBadge}`, escapeHtml(bracerLimitBreakText(lb.level, isEn)), 'belg-lb-row');
      });
      if (cost.steps) {
        c += row(`<strong>${isEn ? 'Market value (gold + materials + breaths)' : 'Valeur au marché (or + matériaux + souffles)'}</strong>`, `<strong>${fmt(Math.round(cost.value))}</strong>`);
        c += row(isEn ? 'Worst case (full artisan\'s energy on every level)' : 'Pire cas (jauge d\'artisan pleine à chaque niveau)', fmt(Math.round(cost.pity)));
      }
      c += `</tbody></table>`;
      c += `<p class="belg-note">${cost.loaSim ? simBadge : officialBadge} ${isEn
          ? 'Recipe from loa-sim.vercel.app (level 1 cost and success rates match the official ones), artisan rule of the other T4 recipes. Lava\'s and Glacier\'s breaths can go on the same tap: the cheapest plan at market prices is kept for each level. Shards and silver outside the market value, as in the GPD. Limit break materials are raid drops, not priced.'
          : "Recette de loa-sim.vercel.app (coût du niveau 1 et taux identiques aux officiels), règle d'artisan des autres recettes T4. Souffles de lave et de glacier possibles sur le même essai : le plan le moins cher aux prix du marché est retenu à chaque niveau. Fragments et argent hors valeur au marché, comme dans le GPD. Matériaux de déblocage tirés du raid, non chiffrés."}</p>`;
    }
    // Taux officiels
    const rates = [[1, 5, 15], [6, 10, 10], [11, 15, 5], [16, 20, 3], [21, 25, 1.5]];
    c += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Success rate' : 'Taux de réussite'} ${officialBadge}</th><th></th></tr></thead><tbody>
        ${rates.map(([a, b, p]) => `<tr><td>+${a} → +${b}</td><td class="market-num">${fmt(p, p % 1 ? 1 : 0)} %</td></tr>`).join('')}
      </tbody></table>`;
    costsEl.innerHTML = c;
  }

  // 4. Arbitrage : or par % sur les grandes tranches (mêmes calculs que la ligne du GPD)
  const insight = document.getElementById('belgInsight');
  if (insight) {
    let h = `<h3>${isEn ? 'Gold per gain, by tier' : 'Or par gain, par tranche'}</h3>`;
    if (!charObj) {
      h += `<p class="belg-empty">${isEn ? 'Import a character to price each tier.' : 'Importe un personnage pour chiffrer chaque tranche.'}</p>`;
    } else {
      const unit = isSupport ? (isEn ? 'Gold / 0.01% buff' : 'Or / 0,01 % de buff') : (isEn ? 'Gold / 1% damage' : 'Or / 1 % de dégâts');
      // Chaque tranche part du maximum de la rareté précédente et compte son déblocage
      const tiers = [[null, { grade: 0, level: 10 }], [{ grade: 0, level: 10 }, { grade: 1, level: 15 }],
        [{ grade: 1, level: 15 }, { grade: 2, level: 20 }], [{ grade: 2, level: 20 }, { grade: 3, level: 25 }]];
      h += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Tier' : 'Tranche'}</th><th>${isSupport ? 'Buff' : (isEn ? 'Damage' : 'Dégâts')}</th><th>CP</th><th>${isEn ? 'Market value' : 'Valeur au marché'}</th><th>${unit}</th></tr></thead><tbody>`;
      tiers.forEach(([a, b]) => {
        const s = simulateBracerImpact(charObj, b, isSupport, a);
        if (!s || !s.costs) return;
        const gain = isSupport ? s.allyBuffPct : s.dpsGainPct;
        const ratio = gain > 0 ? s.costs.value / (isSupport ? gain / 0.01 : gain) : null;
        const done = curIdx >= bracerIndex(b);
        h += `<tr${done ? ' class="belg-dim"' : ''}><td>${a ? bracerStateLabel(a, isEn) : (isEn ? 'None' : 'Aucun')} → ${bracerStateLabel(b, isEn)}${done ? (isEn ? ' (done)' : ' (fait)') : ''}</td><td class="market-num">${signed(gain)} %</td><td class="market-num">${s.cpGain === null ? '—' : signed(s.cpGain, 0)}</td>
            <td class="market-num">${fmt(Math.round(s.costs.value))}</td><td class="market-num">${ratio === null ? '—' : fmt(Math.round(ratio))}</td></tr>`;
      });
      h += `</tbody></table>`;
      h += `<p class="belg-note">${isEn
          ? 'Same model and costs as the Vambraces rows of the GPD and the Smart Advisor (worn vambraces: next limit break and next honing, ranked with every other upgrade). Limit breaks count no gold (raid materials).'
          : 'Mêmes calculs et coûts que les lignes Brassard du GPD et du Smart Advisor (brassard porté : prochain déblocage et prochain affinage, classés avec toutes les autres améliorations). Déblocages comptés sans or (matériaux de raid).'}</p>`;
    }
    h += `<p class="belg-note">${isEn
        ? 'KR community figures for comparison: +5.63 / 9.07 / 12.95 / 17.37 % CP at +10 / 15 / 20 / 25 from no vambraces on an end-game character (Inven #3951651), +6.21 % damage at +10 and +19.05 % at +25 (kakao.gg guide), at least +6.37 % for +10 on a 1800 character (Inven #3954479, about 1.6 M gold in all: 363 k gold, 122 k guardian and 40 k destruction crystals). They do not say from which state they count.'
        : "Repères de la communauté KR : +5,63 / 9,07 / 12,95 / 17,37 % de CP à +10 / 15 / 20 / 25 depuis aucun brassard sur un personnage de fin de jeu (Inven #3951651), +6,21 % de dégâts à +10 et +19,05 % à +25 (guide kakao.gg), au moins +6,37 % pour +10 sur un personnage 1800 (Inven #3954479, environ 1,6 M d'or en tout : 363 k d'or, 122 k pierres de gardien et 40 k de destruction cristallisées). Ils ne disent pas depuis quel état ils comptent."}</p>`;
    insight.innerHTML = h;
  }
}

// === PRÊT POUR BELGARDIN ? (seuils de CP par difficulté, axes d'amélioration) ===
// Seuils sourcés dans data.js (BELGARDIN_RAID) : CP des groupes publics KR de la première semaine, et pour un DPS le
// CP de groupe fixe (Nightmare seulement, DPS : 6 000). Pas de seuil calculé pour Normal / Hard : un plancher au rapport des
// PV ne tient compte ni de la survie ni des temps morts (2 200 / 3 500 CP, loin des 4 000 / 5 000 réels). Plan : affinage le moins cher jusqu'à l'iLvl
// d'entrée (predictHoningPath), puis feuille de route du Smart Advisor (buildGpdRoadmap) jusqu'au CP visé.
const belgReadyState = { diff: null, goal: 'pf' };
// Étapes au-delà de 20 M d'or / 1 % (plus de trois fois le rang D du GPD) écartées : sinon un objectif hors de portée
// déroule les échelles jusqu'au bout (bracelet S ➔ S+ à plusieurs milliards d'or)
const BELG_MAX_RATE = 20e6;

function belgardinThresholds(diff, isSupport) {
  return { pf: diff.pf[isSupport ? 'support' : 'dps'], fixed: !isSupport && diff.fixedDps ? diff.fixedDps : null };
}

// État d'un personnage pour chaque difficulté : 'ready' (CP des groupes publics), 'fixed' (CP de groupe fixe atteint),
// 'short' (en dessous) ; ilvlGap > 0 = iLvl d'entrée pas atteint
function belgardinReadiness(c, isSupport = c.role === 'support') {
  const cp = raidCombatPowerOf(c) || c.cp || 0;
  const ilvl = c.ilvl || 0;
  return window.BELGARDIN_RAID.difficulties.map(diff => {
    const th = belgardinThresholds(diff, isSupport);
    let status = 'short';
    if (cp >= th.pf) status = 'ready';
    else if (th.fixed && cp >= th.fixed) status = 'fixed';
    return { diff, th, cp, ilvlGap: Math.max(0, diff.ilvl - ilvl), status };
  });
}

function renderBelgardinReadiness() {
  const el = document.getElementById('belgReady');
  if (!el || !window.BELGARDIN_RAID) return;
  const isEn = isEnLang();
  const fmt = (v, d = 0) => Number(v).toLocaleString(isEn ? 'en-US' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const R = window.BELGARDIN_RAID;
  const dName = d => (isEn ? d.en : d.fr);
  const STATUS = {
    ready: [isEn ? 'Ready' : 'Prêt', isEn ? 'public party CP reached' : 'CP des groupes publics atteint'],
    fixed: [isEn ? 'Static group' : 'Groupe fixe', isEn ? 'static group CP reached, below public party CP' : 'CP de groupe fixe atteint, sous le CP des groupes publics'],
    short: [isEn ? 'Not enough CP' : 'CP insuffisant', ''],
    ilvl: [isEn ? 'Item level too low' : 'iLvl insuffisant', '']
  };
  const chip = (r, withGap) => {
    const key = r.ilvlGap > 0 ? 'ilvl' : r.status;
    const gap = r.ilvlGap > 0 ? `−${fmt(r.ilvlGap, 2)} iLvl`
      : (r.status === 'ready' ? '' : `${r.status === 'short' ? '' : (isEn ? '· public parties ' : '· groupes publics ')}−${fmt(Math.ceil(r.th.pf - r.cp))} CP`);
    return `<span class="belg-st belg-st-${key}" title="${escapeHtml(STATUS[key][1])}">${STATUS[key][0]}${withGap && gap ? ` <span class="belg-st-gap">${gap}</span>` : ''}</span>`;
  };
  const charObj = getCurrentActiveCharacter();
  const isSupport = state.role === 'support';

  let h = `<h3>${isEn ? 'Ready for Belgardin?' : 'Prêt pour Belgardin ?'}</h3>`;
  // 1. Seuils par difficulté
  h += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Difficulty' : 'Difficulté'}</th><th class="market-num">iLvl</th>
      <th class="market-num" title="${isEn ? 'Party damage per second to beat the enrage, gate 1 / gate 2' : 'Dégâts par seconde du groupe pour battre l\'enrage, porte 1 / porte 2'}">${isEn ? 'Party damage needed (G1 / G2)' : 'Dégâts requis du groupe (P1 / P2)'}</th>
      ${isSupport ? '' : `<th class="market-num" title="${isEn ? 'CP asked by Korean static groups' : 'CP demandé par les groupes fixes coréens'}">${isEn ? 'Static group CP' : 'CP groupe fixe'}</th>`}<th class="market-num" title="${isEn ? 'CP asked in Korean public party listings' : 'CP demandé dans les annonces de groupe coréennes'}">${isEn ? 'Public party CP' : 'CP groupes publics'}</th>${charObj ? `<th>${escapeHtml(charObj.name)}</th>` : ''}</tr></thead><tbody>`;
  const mine = charObj ? belgardinReadiness(charObj, isSupport) : null;
  R.difficulties.forEach((d, i) => {
    const th = belgardinThresholds(d, isSupport);
    const dps = d.hp.map((hp, g) => fmt(hp / (R.gates[g].minutes * 60) / 1e9, 1)).join(' / ');
    h += `<tr><td>${dName(d)}</td><td class="market-num">${d.ilvl}</td><td class="market-num">${dps} ${isEn ? 'B/s' : 'Md/s'}</td>
        ${isSupport ? '' : `<td class="market-num">${th.fixed ? fmt(th.fixed) : '—'}</td>`}<td class="market-num">${fmt(th.pf)}</td>
        ${mine ? `<td>${chip(mine[i], true)}</td>` : ''}</tr>`;
  });
  h += `</tbody></table>`;
  h += `<p class="belg-note">${isEn
      ? `Combat Power in the raid profile. <strong>Public party CP</strong>: CP asked in Korean party listings the first week (mostly trial groups, not a clear guarantee)${isSupport ? '; a support\'s CP measures its buffs, not damage, so only the public party CP applies' : ''}. ${isSupport ? '' : `<strong>Static group CP</strong> (Nightmare only): ${fmt(R.difficulties[2].fixedDps)}; KR public parties went down to ${fmt(R.nightmarePublicKrCp)} with the "double rumble" strategy. `}Expect more in Europe on release week: 7,000 for a Nightmare reclear, ${fmt(R.nightmareHomeworkCp)} for "homework" lobbies (Shizukaziye). First Nightmare clear in Korea: 4 h 53, six players out of eight at 1800.`
      : `Combat Power du profil raid. <strong>CP groupes publics</strong> : CP demandé dans les annonces de groupe coréennes la première semaine (surtout des groupes d'essai, pas une garantie de clear)${isSupport ? " ; le CP d'un support mesure ses buffs, pas des dégâts : seul le CP des groupes publics s'applique" : ''}. ${isSupport ? '' : `<strong>CP groupe fixe</strong> (Nightmare seulement) : ${fmt(R.difficulties[2].fixedDps)} ; les groupes publics KR sont descendus à ${fmt(R.nightmarePublicKrCp)} avec la stratégie « double rumble ». `}Compter plus en Europe la semaine de sortie : 7 000 pour un reclear Nightmare, ${fmt(R.nightmareHomeworkCp)} pour les groupes « homework » (Shizukaziye). Premier clear Nightmare en Corée : 4 h 53, six joueurs sur huit à 1800.`}</p>`;

  // 2. Roster
  const roster = getActiveRosterList();
  if (roster.length > 1) {
    h += `<table class="market-table belg-table belg-roster"><thead><tr><th>${isEn ? 'Roster' : 'Roster'}</th><th class="market-num">iLvl</th><th class="market-num">CP</th>${R.difficulties.map(d => `<th>${dName(d)}</th>`).join('')}</tr></thead><tbody>`;
    roster.forEach(c => {
      const rr = belgardinReadiness(c);
      h += `<tr><td>${escapeHtml(c.name)} <span class="belg-dim">${escapeHtml(c.className || '')}${c.role === 'support' ? ' · support' : ''}</span></td>
          <td class="market-num">${fmt(c.ilvl || 0, 2)}</td><td class="market-num">${fmt(rr[0].cp)}</td>${rr.map(r => `<td>${chip(r, false)}</td>`).join('')}</tr>`;
    });
    h += `</tbody></table>`;
  }

  // 3. Axes d'amélioration du personnage actif
  if (!charObj) {
    h += `<p class="belg-empty">${isEn ? 'Import a character to check it against each difficulty.' : 'Importe un personnage pour le comparer à chaque difficulté.'}</p>`;
    el.innerHTML = h;
    return;
  }
  if (!R.difficulties.some(d => d.key === belgReadyState.diff)) {
    // Par défaut : la première difficulté où le personnage n'est pas prêt
    const first = mine.find(r => r.ilvlGap > 0 || r.status !== 'ready');
    belgReadyState.diff = (first || mine[mine.length - 1]).diff.key;
  }
  const sel = mine.find(r => r.diff.key === belgReadyState.diff);
  if (!sel.th.fixed) belgReadyState.goal = 'pf';
  const target = belgReadyState.goal === 'fixed' ? sel.th.fixed : sel.th.pf;
  h += `<h3 class="belg-plan-title">${isEn ? 'How to get there' : 'Comment y arriver'}</h3><div class="belg-quick">`;
  R.difficulties.forEach(d => {
    h += `<button type="button" class="belg-quick-btn${d.key === belgReadyState.diff ? ' active' : ''}" data-belg-diff="${d.key}">${dName(d)}</button>`;
  });
  if (sel.th.fixed) {
    h += `<span class="belg-quick-sep"></span>`;
    [['pf', isEn ? 'Public party CP' : 'CP groupes publics'], ['fixed', isEn ? 'Static group CP' : 'CP groupe fixe']].forEach(([k, l]) => {
      h += `<button type="button" class="belg-quick-btn${k === belgReadyState.goal ? ' active' : ''}" data-belg-goal="${k}">${l}</button>`;
    });
  }
  h += `</div>`;

  const cp = sel.cp;
  let honing = null;
  if (sel.ilvlGap > 0) {
    honing = predictHoningPath(charObj, sel.diff.ilvl, isSupport);
    const slotName = s => (isEn
      ? { weapon: 'Weapon', head: 'Helmet', shoulder: 'Shoulders', chest: 'Chest', pants: 'Pants', gloves: 'Gloves' }
      : { weapon: 'Arme', head: 'Casque', shoulder: 'Épaulières', chest: 'Plastron', pants: 'Jambières', gloves: 'Gants' })[s] || s;
    if (honing && honing.reached) {
      h += `<p class="belg-step"><strong>1. ${isEn ? `Item level ${sel.diff.ilvl}` : `iLvl ${sel.diff.ilvl}`}</strong> — ${honing.steps.map(st => `${slotName(st.slot)} +${st.from} ➔ +${st.to}`).join(', ')} :
          ${fmt(Math.round(honing.gold))} ${isEn
            ? `gold (expected, ${honing.owned ? 'your bound materials first, then market prices' : 'market prices'})`
            : `or (moyenne attendue, ${honing.owned ? 'tes matériaux liés d\'abord, puis prix du marché' : 'prix du marché'})`}, ${isSupport ? '~' : ''}+${fmt(Math.round(honing.cpGain))} CP.</p>`;
    } else if (honing) {
      // Stuff Aegir : l'affinage normal plafonne à +25 (1715 + affinage avancé)
      h += `<p class="belg-step"><strong>1. ${isEn ? `Item level ${sel.diff.ilvl}` : `iLvl ${sel.diff.ilvl}`}</strong> — ${isEn
          ? `${fmt(sel.ilvlGap, 2)} item levels missing; normal honing of this gear stops at ${fmt(honing.reachedIlvl, 2)}: move to Serka gear (or advanced honing on the Aegir pieces).`
          : `il manque ${fmt(sel.ilvlGap, 2)} iLvl ; l'affinage normal de ce stuff s'arrête à ${fmt(honing.reachedIlvl, 2)} : passer au stuff Serka (ou à l'affinage avancé des pièces Aegir).`}</p>`;
    } else {
      h += `<p class="belg-step"><strong>1. ${isEn ? `Item level ${sel.diff.ilvl}` : `iLvl ${sel.diff.ilvl}`}</strong> — ${isEn ? `${fmt(sel.ilvlGap, 2)} item levels missing; honing path unavailable (honing table or gear unreadable).` : `il manque ${fmt(sel.ilvlGap, 2)} iLvl ; chemin d'affinage indisponible (table d'affinage ou stuff illisible).`}</p>`;
    }
  }
  const honingDone = !!(honing && honing.reached);
  const cpAfterIlvl = cp + (honingDone ? honing.cpGain : 0);
  const gap = target - cpAfterIlvl;
  const n = sel.ilvlGap > 0 ? 2 : 1;
  if (gap <= 0) {
    h += `<p class="belg-step"><strong>${n}. Combat Power</strong> — ${isEn
        ? `${fmt(Math.round(cpAfterIlvl))} CP${honingDone ? ' after honing' : ''}, target ${fmt(target)} reached.`
        : `${fmt(Math.round(cpAfterIlvl))} CP${honingDone ? " après l'affinage" : ''}, objectif ${fmt(target)} atteint.`}</p>`;
  } else {
    let road = null;
    try {
      const rows = buildMasterGpdData(charObj, isSupport, isEn);
      // Affinage de l'étape 1 déjà compté : les chaînes d'affinage repartent de l'état atteint (armures : +1 sur
      // chaque pièce par étape, on part du plus petit gain de niveau des pièces encore sous +25)
      const startK = {};
      if (honingDone) {
        const ctx = gearStatContext(charObj);
        const raise = slot => { const st = honing.steps.find(x => x.slot === slot); return st ? st.to - st.from : 0; };
        startK.dyn_weapon = raise('weapon') + 1;
        const armor = GEAR_ARMOR_SLOTS.filter(sl => ctx && ctx.gear[sl] < 25).map(raise);
        if (armor.length) startK.dyn_armor = Math.min(...armor) + 1;
      }
      // Matériaux liés : ce que l'affinage de l'étape 1 n'a pas consommé
      const roadOpts = { cpGoal: gap, maxSteps: 80, startK, maxRate: BELG_MAX_RATE * (isSupport ? 0.01 : 1) };
      if (honingDone) roadOpts.owned = honing.left;
      if (rows.length) road = buildGpdRoadmap(charObj, isSupport, isEn, rows, Infinity, roadOpts);
    } catch (e) {
      console.warn('[BELGARDIN] Feuille de route indisponible :', e.message);
    }
    h += `<p class="belg-step"><strong>${n}. Combat Power</strong> — ${isEn
        ? `${fmt(Math.round(cpAfterIlvl))} CP${honingDone ? ' after honing' : ''}, target ${fmt(target)}: <strong>+${fmt(Math.ceil(gap))} CP</strong> to find. Best gold per gain first (Smart Advisor roadmap):`
        : `${fmt(Math.round(cpAfterIlvl))} CP${honingDone ? " après l'affinage" : ''}, objectif ${fmt(target)} : <strong>+${fmt(Math.ceil(gap))} CP</strong> à trouver. Meilleur ratio or / gain d'abord (feuille de route du Smart Advisor) :`}</p>`;
    if (!road || !road.plan.length) {
      h += `<p class="belg-empty">${isEn ? 'No priced upgrade available for this character.' : 'Aucune amélioration chiffrée pour ce personnage.'}</p>`;
    } else {
      let cum = 0;
      h += `<table class="market-table belg-table"><thead><tr><th>#</th><th>${isEn ? 'System' : 'Système'}</th><th>${isEn ? 'Step' : 'Étape'}</th><th class="market-num">${isEn ? 'Gold' : 'Or'}</th><th class="market-num">+CP</th><th class="market-num">${isEn ? 'CP reached' : 'CP atteint'}</th></tr></thead><tbody>`;
      road.plan.forEach((r, i) => {
        if (r.cpGain > 0) cum += r.cpGain;
        h += `<tr><td>${i + 1}</td><td>${r.system}</td><td>${r.nextStep}${r.stepDetail ? `<span class="belg-dim belg-step-detail">${r.stepDetail}</span>` : ''}</td>
            <td class="market-num">${fmt(Math.round(r.cost))}</td><td class="market-num">${Number.isFinite(r.cpGain) ? `${isSupport ? '~' : ''}${fmtCpGain(r.cpGain)}` : '—'}</td>
            <td class="market-num">${fmt(Math.round(cpAfterIlvl + cum))}</td></tr>`;
      });
      const totalGold = road.gold + (honingDone ? honing.gold : 0);
      h += `</tbody></table><p class="belg-note"><strong>${isEn ? 'Total' : 'Total'} : ${fmt(Math.round(totalGold))} ${isEn ? 'gold' : 'or'}</strong>${honingDone ? (isEn ? ' (honing included)' : " (affinage compris)") : ''}, ${isSupport ? '~' : ''}${fmt(Math.round(cpAfterIlvl + road.cumCp))} CP. ${road.reached ? '' : (isEn
          ? `Target out of reach with these ${road.plan.length} steps.`
          : `Objectif hors de portée avec ces ${road.plan.length} étapes.`)}</p>`;
    }
    h += `<p class="belg-note">${isEn
        ? `Same rows, costs and gains as the GPD and the Smart Advisor, chained on the current profile${honingDone ? ', honing continuing from step 1' : ''}; steps above 20 M gold per 1 % ${isSupport ? '(200 k per 0.01 %) ' : ''}left out. ${isSupport ? 'Support CP per step is an estimate from the support Battle Point. ' : ''}Worn vambraces included (limit breaks without gold, honing from the loa-sim table, see below).`
        : `Mêmes lignes, coûts et gains que le GPD et le Smart Advisor, enchaînés sur le profil actuel${honingDone ? ", l'affinage repartant de l'étape 1" : ''} ; étapes au-delà de 20 M d'or par 1 % ${isSupport ? '(200 k par 0,01 %) ' : ''}écartées. ${isSupport ? 'CP support de chaque étape estimé par le Battle Point support. ' : ''}Brassard porté compris (déblocages sans or, affinage sur la table de loa-sim, voir plus bas).`}</p>`;
  }
  el.innerHTML = h;
}
