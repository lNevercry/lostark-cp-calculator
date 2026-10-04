// Brassard T4 (Belgardin) : table de projection et onglet.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// === Brassard T4 (완갑, raid Belgardin) : projection, en attendant les tables du jeu ===
// data/bracer-t4.json (tools/build-bracer-estimate.mjs) : chaque valeur porte sa source (official = note Stove 1225,
// inven = relevé +21, estimate = estimation communautaire KR). Le brassard ne donne ni iLvl, ni qualité, ni points
// d'Ark Passive : il n'entre ni dans l'iLvl du personnage, ni dans le GPD tant que les tables du jeu manquent.
let bracerT4 = null;
async function loadBracerT4() {
  try {
    const res = await fetch('data/bracer-t4.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bracerT4 = await res.json();
    updateBelgardinView();
  } catch (e) {
    console.warn('[BRASSARD] Table du brassard indisponible :', e.message);
  }
}

// Stats du brassard à +level (0 à 25) : stat principale, puissance d'arme, Vitalité, PA fixe, % de PA, source
function calcBracerStats(level) {
  const l = bracerT4 && bracerT4.levels[level];
  return l ? Object.assign({ level }, l) : null;
}

// Attaque du personnage avec le brassard à +level (-1 = sans brassard). Inven #3790814 :
// PA de base = (√(stat × puissance d'arme ÷ 6) + PA fixe) × (1 + % de PA) ; stat du brassard × 1,09 (avatars, ranch),
// puissance d'arme × (1 + % boucles + Karma) comme celle de l'arme.
function bracerAttackState(ctx, apPool, level) {
  const s = level >= 0 ? calcBracerStats(level) : null;
  // Multiplicateur mesuré sur le profil (comme les armures), sinon celui du post Inven (× 1,09)
  const mm = ctx.msMult > 1 ? ctx.msMult : (bracerT4 && bracerT4.mainStatMult) || 1;
  const st = {
    wp: ctx.wp + (s ? s.weaponPower * ctx.wpAmp : 0),
    ms: ctx.ms + (s ? s.mainStat * mm : 0),
    flat: s ? s.flatAp : 0,
    apPct: apPool + (s ? s.apPct / 100 : 0),
    vit: ctx.vit + (s ? s.vitality : 0)
  };
  st.atk = (Math.sqrt(st.wp * st.ms / 6) + st.flat) * (1 + st.apPct);
  return st;
}

/**
 * Ressources pour monter le brassard de +fromLevel à +toLevel : essais attendus par étape (recipeStepCost, taux officiels,
 * règle d'artisan des recettes T4), or, argent, fragments, matériaux, valeur en or au marché (matériaux + or, comme le
 * GPD), et déblocages de rareté franchis. estimate = au moins une étape hors du niveau 1 officiel.
 */
function getBracerHoningCumulativeCost(fromLevel, toLevel) {
  if (!bracerT4 || !(fromLevel >= 0) || !(toLevel <= 25) || fromLevel > toLevel) return null;
  const out = { gold: 0, silver: 0, shards: 0, mats: {}, value: 0, taps: 0, estimate: false, limitBreaks: [] };
  for (let l = fromLevel; l < toLevel; l++) {
    const st = bracerT4.steps[l];
    if (!st) return null;
    const r = recipeStepCost(st);
    out.taps += r.taps;
    out.value += r.cost;
    out.gold += st.gold * r.taps;
    out.silver += st.silver * r.taps;
    out.shards += st.shards * r.taps;
    Object.entries(st.mats).forEach(([slug, n]) => { out.mats[slug] = (out.mats[slug] || 0) + n * r.taps; });
    if (st.src !== 'official') out.estimate = true;
  }
  Object.entries(bracerT4.limitBreak || {}).forEach(([lv, lb]) => {
    // Rareté affichée = après déblocage : un brassard +10 Légendaire a passé le déblocage de +10
    if (fromLevel < +lv && +lv <= toLevel) out.limitBreaks.push(Object.assign({ level: +lv }, lb));
  });
  return out;
}

/**
 * Effet du brassard sur le personnage importé, de +fromLevel (-1 = sans brassard) à +level.
 * DPS : dégâts = 100 × ln(rapport des PA de base), CP = CP × (rapport − 1) (partie type 1 = PA de base × 2,88).
 * Support : buff par supportContribution (canal ap), CP = branche buff × (rapport − 1) + branche défense × (rapport de
 * Vitalité − 1). PV max proportionnels à la Vitalité. null sans personnage lisible ou sans table.
 */
function simulateBracerImpact(charObj, level, isSupport, fromLevel = -1) {
  const ctx = gearStatContext(charObj);
  const p1 = battlePointPartsOf(charObj).find(p => p.type === 1);
  if (!bracerT4 || !ctx || !p1 || !(level >= 0 && level <= 25) || !(fromLevel >= -1 && fromLevel <= level)) return null;
  const apPool = (p1.attackPowerMultiplier || 0) / 100;
  const a = bracerAttackState(ctx, apPool, fromLevel), b = bracerAttackState(ctx, apPool, level);
  const ratio = b.atk / a.atk;
  const vitRatio = a.vit > 0 ? b.vit / a.vit : 1;
  const cp = (charObj.rawProfile && charObj.rawProfile.raidCombatPower) || charObj.cp;
  const levelsUsed = [level, fromLevel].filter(l => l >= 0).map(calcBracerStats);
  const out = {
    level, fromLevel, stats: calcBracerStats(level),
    statsEstimate: levelsUsed.some(s => s.src === 'estimate'),
    hpGainPct: (vitRatio - 1) * 100,
    costs: getBracerHoningCumulativeCost(Math.max(0, fromLevel), level),
    dpsGainPct: null, allyBuffPct: null, cpGain: null
  };
  if (!isSupport) {
    out.dpsGainPct = 100 * Math.log(ratio);
    out.cpGain = cp > 0 ? cp * (ratio - 1) : null;
  } else {
    const inp = supportInputs(charObj);
    out.allyBuffPct = 100 * Math.log(supportContribution(inp, b.wp, b.ms, inp.gemAvg, b.apPct, b.flat) /
      supportContribution(inp, a.wp, a.ms, inp.gemAvg, a.apPct, a.flat));
    const br = supportBpBranches(charObj);
    out.cpGain = br ? br.A * (ratio - 1) + br.D * (vitRatio - 1) : null;
  }
  return out;
}

// === ONGLET PROJECTION BELGARDIN (brassard T4) ===
// Projection sur le personnage importé (simulateBracerImpact). Données officielles et relevé +21 signalés comme tels,
// le reste porte le badge « Estimation communautaire KR ». Pas de ligne GPD tant que les tables du jeu manquent.
const belgState = { level: 10, from: 0 };
const BRACER_GRADES = [
  { min: 20, key: 'ancient', fr: 'Ancien', en: 'Ancient' },
  { min: 15, key: 'relic', fr: 'Relique', en: 'Relic' },
  { min: 10, key: 'legendary', fr: 'Légendaire', en: 'Legendary' },
  { min: 0, key: 'heroic', fr: 'Héroïque', en: 'Heroic' }
];
const bracerGradeOf = level => BRACER_GRADES.find(g => level >= g.min);

function initBelgardinTab() {
  const range = document.getElementById('belgLevel');
  if (!range) return;
  range.addEventListener('input', e => { belgState.level = parseInt(e.target.value, 10) || 0; updateBracerView(); });
  document.querySelectorAll('[data-belg-level]').forEach(btn => btn.addEventListener('click', () => {
    belgState.level = parseInt(btn.getAttribute('data-belg-level'), 10) || 0;
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
  const estBadge = `<span class="belg-src belg-src-est">${isEn ? 'KR community estimate (Inven/Arca)' : 'Estimation communautaire KR (Inven/Arca)'}</span>`;
  const officialBadge = `<span class="belg-src belg-src-off">${isEn ? 'Official (Stove)' : 'Officiel (Stove)'}</span>`;
  const anchorBadge = `<span class="belg-src belg-src-off">${isEn ? 'Published +21 bracer (Inven)' : 'Brassard +21 publié (Inven)'}</span>`;

  const level = Math.min(25, Math.max(0, belgState.level));
  if (belgState.from > level) belgState.from = level === 0 ? -1 : 0;
  const range = document.getElementById('belgLevel');
  if (range) range.value = String(level);
  const out = document.getElementById('belgLevelOut');
  if (out) out.textContent = `+${level}`;
  const grade = bracerGradeOf(level);
  const gradeEl = document.getElementById('belgGrade');
  if (gradeEl) {
    gradeEl.textContent = (window.i18n && window.i18n.t(`bracer_${grade.key}`)) || (isEn ? grade.en : grade.fr);
    gradeEl.className = `belg-grade belg-grade-${grade.key}`;
  }
  document.querySelectorAll('[data-belg-level]').forEach(btn => btn.classList.toggle('active', parseInt(btn.getAttribute('data-belg-level'), 10) === level));
  const fromSel = document.getElementById('belgFrom');
  if (fromSel) {
    const opts = [-1].concat(Array.from({ length: level }, (_, i) => i)).concat(level === 0 ? [0] : []);
    fromSel.innerHTML = opts.map(l => `<option value="${l}"${l === belgState.from ? ' selected' : ''}>${l < 0
        ? (isEn ? 'No bracer' : 'Sans brassard')
        : l === 0 ? (isEn ? '+0 (given on the first Gate 2 clear)' : '+0 (offert au premier clear de la porte 2)') : `+${l}`}</option>`).join('');
  }

  if (!bracerT4) {
    results.innerHTML = `<p class="belg-empty">${isEn ? 'Loading the bracer table…' : 'Chargement de la table du brassard…'}</p>`;
    return;
  }
  const sim = charObj ? simulateBracerImpact(charObj, level, isSupport, belgState.from) : null;
  const stats = calcBracerStats(level);

  // 1. Résultats
  let html = '';
  if (!sim) {
    html += `<p class="belg-empty">${isEn
        ? 'Import a character to project the bracer on its real stats (weapon power, main stat, attack power multiplier, Combat Power).'
        : 'Importe un personnage pour projeter le brassard sur ses vraies stats (puissance d\'arme, stat principale, % de PA, Combat Power).'}</p>`;
  } else {
    const fromTxt = sim.fromLevel < 0 ? (isEn ? 'no bracer' : 'sans brassard') : `+${sim.fromLevel}`;
    const card = (label, value, sub) => `<div class="belg-card"><span class="belg-card-label">${label}</span><span class="belg-card-value">${value}</span>${sub ? `<span class="belg-card-sub">${sub}</span>` : ''}</div>`;
    const cpCard = sim.cpGain === null ? '' : card(isEn ? 'Combat Power' : 'Combat Power', `${signed(sim.cpGain, 0)} CP`,
      isEn ? `in-game CP ${fmt(charObj.rawProfile.raidCombatPower || charObj.cp, 0)}` : `CP en jeu ${fmt(charObj.rawProfile.raidCombatPower || charObj.cp, 0)}`);
    html += `<div class="belg-cards">`;
    if (!isSupport) {
      html += card(isEn ? 'Damage' : 'Dégâts', `${signed(sim.dpsGainPct)} %`, isEn ? 'personal damage, base attack ratio' : 'dégâts personnels, rapport des PA de base') + cpCard;
    } else {
      html += card(isEn ? 'Ally buff' : 'Buff allié', `${signed(sim.allyBuffPct)} %`, isEn ? 'damage of each ally (GPD scale)' : 'dégâts de chaque allié (échelle du GPD)')
        + card(isEn ? 'Max HP' : 'PV max', `${signed(sim.hpGainPct)} %`, isEn ? 'Vitality of the bracer' : 'Vitalité du brassard') + cpCard;
    }
    html += `</div><p class="belg-note">${isEn ? `From ${fromTxt} to +${level}.` : `De ${fromTxt} à +${level}.`} ${sim.statsEstimate ? estBadge : anchorBadge}</p>`;
  }

  // 2. Stats du brassard au niveau choisi
  const ctxB = charObj ? gearStatContext(charObj) : null;
  const measured = !!(ctxB && ctxB.msMult > 1);
  const mm = measured ? ctxB.msMult : (bracerT4.mainStatMult || 1);
  const mmTxt = measured ? (isEn ? 'measured on the profile, like the armors' : 'mesuré sur le profil, comme les armures') : (isEn ? 'avatars and pet ranch, Inven' : 'avatars et ranch, Inven');
  html += `<table class="market-table belg-table"><thead><tr><th>${isEn ? `Bracer +${level}` : `Brassard +${level}`}</th><th>${isEn ? 'Value' : 'Valeur'}</th></tr></thead><tbody>
      <tr><td>${isEn ? 'Main stat' : 'Stat principale'} <span class="belg-dim">(× ${fmt(mm, 3)}, ${mmTxt})</span></td><td class="market-num">${fmt(stats.mainStat)}</td></tr>
      <tr><td>${isEn ? 'Weapon power' : "Puissance d'arme"} <span class="belg-dim">(× ${isEn ? 'earrings and Karma' : 'boucles et Karma'})</span></td><td class="market-num">${fmt(stats.weaponPower)}</td></tr>
      <tr><td>${isEn ? 'Vitality' : 'Vitalité'}</td><td class="market-num">${fmt(stats.vitality)}</td></tr>
      <tr><td>${isEn ? 'Base attack power (flat)' : 'PA de base (fixe)'}</td><td class="market-num">+${fmt(stats.flatAp)}</td></tr>
      <tr><td>${isEn ? 'Base attack power' : 'PA de base'}</td><td class="market-num">+${fmt(stats.apPct, 1)} %</td></tr>
    </tbody></table>
    <p class="belg-note">${stats.src === 'inven' ? anchorBadge : estBadge} ${isEn
      ? 'No item level, quality or Ark Passive points: the character\'s item level stays the average of its 6 pieces.'
      : "Ni iLvl, ni qualité, ni points d'Ark Passive : l'iLvl du personnage reste la moyenne de ses 6 pièces."}</p>`;
  results.innerHTML = html;

  // 3. Plan de stockage
  const costsEl = document.getElementById('belgCosts');
  const fromCost = Math.max(0, belgState.from);
  const cost = getBracerHoningCumulativeCost(fromCost, level);
  if (costsEl) {
    let c = '';
    if (!cost || level === fromCost) {
      c += `<p class="belg-empty">${isEn ? 'No honing between these two levels.' : 'Aucun affinage entre ces deux niveaux.'}</p>`;
    } else {
      const matName = slug => {
        for (const g of MARKET_PRICE_GROUPS) { const it = g.items.find(x => x[0] === slug); if (it) return it[1]; }
        return marketSlugLabel(slug);
      };
      const row = (label, n, cls = '') => `<tr${cls ? ` class="${cls}"` : ''}><td>${label}</td><td class="market-num">${n}</td></tr>`;
      c += `<table class="market-table belg-table"><thead><tr><th>${isEn ? `+${fromCost} → +${level}, expected` : `+${fromCost} → +${level}, moyenne attendue`}</th><th>${isEn ? 'Amount' : 'Quantité'}</th></tr></thead><tbody>`;
      c += row(isEn ? 'Attempts' : 'Essais', fmt(cost.taps, 1));
      c += row(isEn ? 'Gold' : 'Or', fmt(Math.round(cost.gold)));
      c += row(isEn ? 'Silver' : 'Argent', fmt(Math.round(cost.silver)));
      c += row(isEn ? 'Destiny shards' : 'Fragments de destin', fmt(Math.round(cost.shards)));
      Object.entries(cost.mats).forEach(([slug, n]) => { c += row(escapeHtml(matName(slug)), fmt(Math.round(n))); });
      cost.limitBreaks.forEach(lb => {
        const g = bracerGradeOf(lb.level);
        const alt = lb.remnant
          ? (isEn ? `${lb.remnant} Remnants (Normal) or ${lb.deathHand} Hands of Death (Hard / Nightmare)` : `${lb.remnant} 사령의 잔영 (Normal) ou ${lb.deathHand} 죽음의 손 (Hard / Nightmare)`)
          : (isEn ? `${lb.deathHand} Hands of Death only (Hard / Nightmare)` : `${lb.deathHand} 죽음의 손 uniquement (Hard / Nightmare)`);
        c += row(`${isEn ? 'Limit break' : 'Déblocage'} +${lb.level} → ${isEn ? g.en : g.fr} ${officialBadge}`, alt, 'belg-lb-row');
      });
      c += row(`<strong>${isEn ? 'Market value (gold + materials)' : 'Valeur au marché (or + matériaux)'}</strong>`, `<strong>${fmt(Math.round(cost.value))}</strong>`);
      c += `</tbody></table>`;
      c += `<p class="belg-note">${cost.estimate ? estBadge : officialBadge} ${isEn
          ? 'Level 1 cost is official; the other levels follow the Serka recipe (half weapon, half armor) scaled on it. Official success rates, artisan rule of the other T4 recipes (not published for the bracer). Breaths not counted, shards and silver outside the market value, as in the GPD.'
          : "Coût du niveau 1 officiel ; les autres niveaux suivent la recette Serka (moitié arme, moitié armure) recalée dessus. Taux de réussite officiels, règle d'artisan des autres recettes T4 (non publiée pour le brassard). Souffles non comptés, fragments et argent hors valeur au marché, comme dans le GPD."}</p>`;
    }
    // Taux officiels
    const rates = [[1, 5, 15], [6, 10, 10], [11, 15, 5], [16, 20, 3], [21, 25, 1.5]];
    c += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Success rate' : 'Taux de réussite'} ${officialBadge}</th><th></th></tr></thead><tbody>
        ${rates.map(([a, b, p]) => `<tr><td>+${a} → +${b}</td><td class="market-num">${fmt(p, p % 1 ? 1 : 0)} %</td></tr>`).join('')}
      </tbody></table>`;
    costsEl.innerHTML = c;
  }

  // 4. Arbitrage : or par % sur les grandes tranches (estimation, hors GPD)
  const insight = document.getElementById('belgInsight');
  if (insight) {
    let h = `<h3>${isEn ? 'Gold per gain, by tier' : 'Or par gain, par tranche'} ${estBadge}</h3>`;
    if (!charObj) {
      h += `<p class="belg-empty">${isEn ? 'Import a character to price each tier.' : 'Importe un personnage pour chiffrer chaque tranche.'}</p>`;
    } else {
      const unit = isSupport ? (isEn ? 'Gold / 0.01% buff' : 'Or / 0,01 % de buff') : (isEn ? 'Gold / 1% damage' : 'Or / 1 % de dégâts');
      const tiers = [[0, 10], [10, 15], [15, 20], [20, 25]];
      h += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Tier' : 'Tranche'}</th><th>${isSupport ? (isEn ? 'Buff' : 'Buff') : (isEn ? 'Damage' : 'Dégâts')}</th><th>CP</th><th>${isEn ? 'Market value' : 'Valeur au marché'}</th><th>${unit}</th></tr></thead><tbody>`;
      tiers.forEach(([a, b]) => {
        const s = simulateBracerImpact(charObj, b, isSupport, a);
        if (!s || !s.costs) return;
        const gain = isSupport ? s.allyBuffPct : s.dpsGainPct;
        const ratio = gain > 0 ? s.costs.value / (isSupport ? gain / 0.01 : gain) : null;
        h += `<tr><td>+${a} → +${b}</td><td class="market-num">${signed(gain)} %</td><td class="market-num">${s.cpGain === null ? '—' : signed(s.cpGain, 0)}</td>
            <td class="market-num">${fmt(Math.round(s.costs.value))}</td><td class="market-num">${ratio === null ? '—' : fmt(Math.round(ratio))}</td></tr>`;
      });
      h += `</tbody></table>`;
      h += `<p class="belg-note">${isEn
          ? 'Projection only: the bracer is not in the Smart Advisor or the GPD until the game tables are published (Maxroll feed). Limit break materials are raid drops, not priced.'
          : "Projection seulement : le brassard n'entre ni dans le Smart Advisor ni dans le GPD tant que les tables du jeu ne sont pas publiées (flux Maxroll). Les matériaux de déblocage viennent du raid, non chiffrés."}</p>`;
    }
    h += `<p class="belg-note">${isEn
        ? 'KR community figures for comparison: +6.21 % damage at +10 and +19.05 % at +25 (kakao.gg guide), at least +6.37 % for +10 on a 1800 character (Inven #3954479, about 1.6 M gold in all: 363 k gold, 122 k guardian and 40 k destruction crystals, half our estimate). They do not say from which state they count; our low levels are estimated, so the +0 → +10 tier is the least reliable.'
        : "Repères de la communauté KR : +6,21 % de dégâts à +10 et +19,05 % à +25 (guide kakao.gg), au moins +6,37 % pour +10 sur un personnage 1800 (Inven #3954479, environ 1,6 M d'or en tout : 363 k d'or, 122 k pierres de gardien et 40 k de destruction cristallisées, moitié moins que notre estimation). Ils ne disent pas depuis quel état ils comptent ; nos niveaux bas sont estimés, la tranche +0 → +10 est donc la moins sûre."}</p>`;
    insight.innerHTML = h;
  }
}

// === PRÊT POUR BELGARDIN ? (seuils de CP par difficulté, axes d'amélioration) ===
// Seuils sourcés dans data.js (BELGARDIN_RAID) : CP des groupes publics KR de la première semaine, et pour un DPS le
// DPS minimum (Nightmare ~6 000-6 500 CP, Normal / Hard au rapport des PV porte par porte, même chrono). Le CP support
// ne mesure pas des dégâts : seulement le seuil des groupes publics. Plan : affinage le moins cher jusqu'à l'iLvl
// d'entrée (predictHoningPath), puis feuille de route du Smart Advisor (buildGpdRoadmap) jusqu'au CP visé.
const belgReadyState = { diff: null, goal: 'pf' };
// Étapes au-delà de 20 M d'or / 1 % (plus de trois fois le rang D du GPD) écartées : sinon un objectif hors de portée
// déroule les échelles jusqu'au bout (bracelet S ➔ S+ à plusieurs milliards d'or)
const BELG_MAX_RATE = 20e6;

function belgardinThresholds(diff, isSupport) {
  const R = window.BELGARDIN_RAID;
  const nm = R.difficulties.find(d => d.key === 'nightmare');
  let min = null;
  if (!isSupport) {
    const ratio = Math.max(...diff.hp.map((hp, i) => hp / nm.hp[i]));
    min = R.nightmareMinCp.map(v => Math.round(v * ratio / 10) * 10);
  }
  return { pf: diff.pf[isSupport ? 'support' : 'dps'], min };
}

// État d'un personnage pour chaque difficulté : 'ready' (CP des groupes publics), 'enough' (DPS minimum atteint),
// 'tight' (dans la fourchette du DPS minimum), 'short' (en dessous) ; ilvlGap > 0 = iLvl d'entrée pas atteint
function belgardinReadiness(c, isSupport = c.role === 'support') {
  const cp = raidCombatPowerOf(c) || c.cp || 0;
  const ilvl = c.ilvl || 0;
  return window.BELGARDIN_RAID.difficulties.map(diff => {
    const th = belgardinThresholds(diff, isSupport);
    let status = 'short';
    if (cp >= th.pf) status = 'ready';
    else if (th.min && cp >= th.min[1]) status = 'enough';
    else if (th.min && cp >= th.min[0]) status = 'tight';
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
    enough: [isEn ? 'Enough DPS' : 'DPS suffisant', isEn ? 'enough damage for a clean run, below public party CP' : 'assez de dégâts pour une exécution propre, sous le CP des groupes publics'],
    tight: [isEn ? 'Tight' : 'Juste', isEn ? 'within the minimum CP range: no room for mistakes' : "dans la fourchette du CP minimum : aucune marge d'erreur"],
    short: [isEn ? 'Not enough CP' : 'CP insuffisant', ''],
    ilvl: [isEn ? 'Item level too low' : 'iLvl insuffisant', '']
  };
  const chip = (r, withGap) => {
    const key = r.ilvlGap > 0 ? 'ilvl' : r.status;
    const gap = r.ilvlGap > 0 ? `−${fmt(r.ilvlGap, 2)} iLvl`
      : (r.status === 'ready' ? '' : `${r.status === 'short' ? '' : (isEn ? 'public parties ' : 'groupes publics ')}−${fmt(Math.ceil(r.th.pf - r.cp))} CP`);
    return `<span class="belg-st belg-st-${key}" title="${escapeHtml(STATUS[key][1])}">${STATUS[key][0]}${withGap && gap ? ` <span class="belg-st-gap">${gap}</span>` : ''}</span>`;
  };
  const charObj = getCurrentActiveCharacter();
  const isSupport = state.role === 'support';

  let h = `<h3>${isEn ? 'Ready for Belgardin?' : 'Prêt pour Belgardin ?'}</h3>`;
  // 1. Seuils par difficulté
  h += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Difficulty' : 'Difficulté'}</th><th class="market-num">iLvl</th>
      <th class="market-num" title="${isEn ? 'Party damage per second to beat the enrage, gate 1 / gate 2' : 'Dégâts par seconde du groupe pour battre l\'enrage, porte 1 / porte 2'}">${isEn ? 'Party damage needed (G1 / G2)' : 'Dégâts requis du groupe (P1 / P2)'}</th>
      ${isSupport ? '' : `<th class="market-num" title="${isEn ? 'Lowest average DPS Combat Power with enough damage to beat the enrage, with clean mechanics' : "CP moyen le plus bas d'un DPS dont les dégâts suffisent à battre l'enrage, avec des mécaniques propres"}">${isEn ? 'Min. CP (clean run)' : 'CP min. (exécution propre)'}</th>`}<th class="market-num" title="${isEn ? 'CP asked in Korean public party listings' : 'CP demandé dans les annonces de groupe coréennes'}">${isEn ? 'Public party CP' : 'CP groupes publics'}</th>${charObj ? `<th>${escapeHtml(charObj.name)}</th>` : ''}</tr></thead><tbody>`;
  const mine = charObj ? belgardinReadiness(charObj, isSupport) : null;
  R.difficulties.forEach((d, i) => {
    const th = belgardinThresholds(d, isSupport);
    const dps = d.hp.map((hp, g) => fmt(hp / (R.gates[g].minutes * 60) / 1e9, 1)).join(' / ');
    h += `<tr><td>${dName(d)}</td><td class="market-num">${d.ilvl}</td><td class="market-num">${dps} ${isEn ? 'B/s' : 'Md/s'}</td>
        ${isSupport ? '' : `<td class="market-num">${fmt(th.min[0])}–${fmt(th.min[1])}</td>`}<td class="market-num">${fmt(th.pf)}</td>
        ${mine ? `<td>${chip(mine[i], true)}</td>` : ''}</tr>`;
  });
  h += `</tbody></table>`;
  h += `<p class="belg-note">${isEn
      ? `Combat Power in the raid profile. <strong>Public party CP</strong>: CP asked in Korean party listings the first week (mostly trial groups, not a clear guarantee)${isSupport ? '; a support\'s CP measures its buffs, not damage, so there is no minimum CP for supports' : ''}. ${isSupport ? '' : `<strong>Min. CP (clean run)</strong>: lowest average CP whose damage beats the enrage. Nightmare cleared around ${fmt(R.nightmareMinCp[0])}–${fmt(R.nightmareMinCp[1])} average CP with clean mechanics (KR feedback), Normal and Hard scaled by boss HP (same timers, DPS Combat Power is proportional to damage). `}First Nightmare clear: 4 h 53, about ${fmt(R.firstClearCp)} average CP.`
      : `Combat Power du profil raid. <strong>CP groupes publics</strong> : CP demandé dans les annonces de groupe coréennes la première semaine (surtout des groupes d'essai, pas une garantie de clear)${isSupport ? " ; le CP d'un support mesure ses buffs, pas des dégâts : pas de CP minimum pour un support" : ''}. ${isSupport ? '' : `<strong>CP min. (exécution propre)</strong> : CP moyen le plus bas dont les dégâts battent l'enrage. Nightmare tombé vers ${fmt(R.nightmareMinCp[0])}–${fmt(R.nightmareMinCp[1])} CP de moyenne avec des mécaniques propres (retours KR), Normal et Hard au rapport des PV du boss (même chrono, CP d'un DPS proportionnel à ses dégâts). `}Premier clear Nightmare : 4 h 53, environ ${fmt(R.firstClearCp)} CP de moyenne.`}</p>`;

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
  if (isSupport) belgReadyState.goal = 'pf';
  const sel = mine.find(r => r.diff.key === belgReadyState.diff);
  const target = belgReadyState.goal === 'min' && sel.th.min ? sel.th.min[1] : sel.th.pf;
  h += `<h3 class="belg-plan-title">${isEn ? 'How to get there' : 'Comment y arriver'}</h3><div class="belg-quick">`;
  R.difficulties.forEach(d => {
    h += `<button type="button" class="belg-quick-btn${d.key === belgReadyState.diff ? ' active' : ''}" data-belg-diff="${d.key}">${dName(d)}</button>`;
  });
  if (!isSupport) {
    h += `<span class="belg-quick-sep"></span>`;
    [['pf', isEn ? 'Public party CP' : 'CP groupes publics'], ['min', isEn ? 'Min. CP (clean run)' : 'CP min. (exécution propre)']].forEach(([k, l]) => {
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
          ${fmt(Math.round(honing.gold))} ${isEn ? 'gold (expected, market prices)' : 'or (moyenne attendue, prix du marché)'}, ${isSupport ? '~' : ''}+${fmt(Math.round(honing.cpGain))} CP.</p>`;
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
      if (rows.length) road = buildGpdRoadmap(charObj, isSupport, isEn, rows, Infinity, { cpGoal: gap, maxSteps: 80, startK, maxRate: BELG_MAX_RATE * (isSupport ? 0.01 : 1) });
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
        ? `Same rows, costs and gains as the GPD and the Smart Advisor, chained on the current profile${honingDone ? ', honing continuing from step 1' : ''}; steps above 20 M gold per 1 % ${isSupport ? '(200 k per 0.01 %) ' : ''}left out. ${isSupport ? 'Support CP per step is an estimate from the support Battle Point. ' : ''}The bracer is not counted (no game tables yet, see the projection below).`
        : `Mêmes lignes, coûts et gains que le GPD et le Smart Advisor, enchaînés sur le profil actuel${honingDone ? ", l'affinage repartant de l'étape 1" : ''} ; étapes au-delà de 20 M d'or par 1 % ${isSupport ? '(200 k par 0,01 %) ' : ''}écartées. ${isSupport ? 'CP support de chaque étape estimé par le Battle Point support. ' : ''}Le brassard n'est pas compté (pas encore de tables du jeu, voir la projection plus bas).`}</p>`;
  }
  el.innerHTML = h;
}
