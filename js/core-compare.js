// Cœur Chaos Étoile : « Attaque » ou « Arme » (Smart Advisor, DPS). Seul emplacement où deux cœurs de dégâts se
// comparent sur les stats : les cœurs d'Ordre d'un même emplacement ont le même Battle Point (leur différence est un
// effet de compétence, non chiffré) ; en Chaos Soleil / Lune, les cœurs de dégâts (Flashy Attack, Smoldering Strike)
// dépassent les autres à tous les paliers de la table du jeu.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

const CORE_COMPARE_STEPS = [10, 14, 17, 18, 19, 20];

// Cœur « Attaque » (ID 6731200xx) : PA fixe des options du jeu (arkGridCoreOptions 3156000 / 3156200 / 3156300) :
// 10 pts +900 ; 17 pts +1 800 (rang 5) ou +2 700 (rang 6), cumulés. Le % est dans attackCoreApPct.
function attackCoreFlat(id, points) {
  const grade = Number(id.toString().slice(-1));
  let flat = points >= 10 ? 900 : 0;
  if (points >= 17 && grade >= 5) flat += grade >= 6 ? 2700 : 1800;
  return flat;
}

/**
 * Dégâts relatifs du personnage avec le cœur Chaos Étoile `kind` ('attack' | 'weapon') au rang `grade` et à `points`,
 * le cœur réellement porté retiré. PA de base = (√(puissance d'arme × stat principale ÷ 6) + PA fixe du cœur)
 * × (1 + pool de % de PA) ; puissance d'arme = fixe × (1 + % boucles + % Karma + % du cœur Arme), comme
 * weaponCoreGain et otherAttackPowerPct. Les autres PA fixes (bijoux…) sont communes aux deux cœurs et négligées.
 */
function chaosStarDamage(base, kind, grade, points) {
  const id = (kind === 'attack' ? ATTACK_CORE_PREFIX : WEAPON_CORE_PREFIX) + '0' + grade;
  let wp = base.wpFlat * (1 + base.wpPool), ap = base.apPool, flat = 0;
  if (kind === 'weapon') {
    const b = weaponCoreBonus(id, points);
    if (!b) return null;
    wp = (base.wpFlat + b.flat) * (1 + base.wpPool + b.pct / 100);
  } else {
    if (points >= 17 && grade < 5) return null;
    ap += attackCoreApPct(id, points);
    flat = attackCoreFlat(id, points);
  }
  return (Math.sqrt(wp * base.ms / 6) + flat) * (1 + ap / 100);
}

/**
 * Comparaison sur le profil réel : cœur porté, puis par palier le gain (100 × ln) de chaque cœur par rapport au cœur
 * porté à ses points actuels. null sans cœur Attaque / Arme en Chaos Étoile ou sans stats lisibles.
 */
function chaosStarCoreCompare(charObj) {
  const core = getArkGridCoreIds(charObj).chaosStar;
  const ctx = gearStatContext(charObj);
  if (!core || !ctx) return null;
  const sid = core.id.toString();
  const kind = sid.startsWith(ATTACK_CORE_PREFIX) ? 'attack' : (sid.startsWith(WEAPON_CORE_PREFIX) ? 'weapon' : null);
  if (!kind) return null;
  const grade = Number(sid.slice(-1));
  const points = Math.min(20, core.points || 0);
  // État sans cœur Chaos Étoile : on retire ce que le cœur porté apporte
  let wpPool = ctx.wpAmp - 1, wpFlat = ctx.wp / ctx.wpAmp, apPool = otherAttackPowerPct(charObj);
  if (kind === 'weapon') {
    const b = weaponCoreBonus(sid, points) || { flat: 0, pct: 0 };
    wpFlat -= b.flat;
    wpPool -= b.pct / 100;
  } else {
    apPool -= attackCoreApPct(sid, points);
  }
  const base = { wpFlat, wpPool, apPool, ms: ctx.ms };
  const now = chaosStarDamage(base, kind, grade, points);
  if (!(now > 0)) return null;
  const gain = d => (d > 0 ? 100 * Math.log(d / now) : null);
  const steps = CORE_COMPARE_STEPS.map(p => ({
    points: p,
    attack: gain(chaosStarDamage(base, 'attack', grade, p)),
    weapon: gain(chaosStarDamage(base, 'weapon', grade, p))
  }));
  return { kind, grade, points, steps };
}

function renderCoreCompare(charObj, isSupport, isEn) {
  if (!dom.gpdCoreCmpCard || !dom.gpdCoreCmpBody) return;
  const cmp = isSupport ? null : chaosStarCoreCompare(charObj);
  dom.gpdCoreCmpCard.style.display = cmp ? '' : 'none';
  if (!cmp) { dom.gpdCoreCmpBody.innerHTML = ''; if (dom.gpdCoreCmpSummary) dom.gpdCoreCmpSummary.textContent = ''; return; }
  const fmt = v => (v === null ? '—' : `${v >= 0 ? '+' : ''}${isEn ? v.toFixed(2) : v.toFixed(2).replace('.', ',')} %`);
  const nameOf = k => (k === 'attack' ? (isEn ? 'Attack' : 'Attaque') : (isEn ? 'Weapon' : 'Arme'));
  const other = cmp.kind === 'attack' ? 'weapon' : 'attack';
  const at = cmp.steps.find(s => s.points === cmp.points) || cmp.steps.filter(s => s.points <= cmp.points).pop();
  if (dom.gpdCoreCmpSummary) {
    const swap = at && at[other];
    const head = isEn
      ? `Equipped: ${nameOf(cmp.kind)} core, rank ${cmp.grade}, ${cmp.points} pts.`
      : `Porté : cœur ${nameOf(cmp.kind)}, rang ${cmp.grade}, ${cmp.points} pts.`;
    let verdict;
    if (swap === null || swap === undefined) verdict = isEn ? 'Below 10 points neither core has an effect.' : 'Sous 10 points, aucun des deux cœurs n\'a d\'effet.';
    else if (swap > 0.005) verdict = isEn ? `The ${nameOf(other)} core at the same points: ${fmt(swap)} damage.` : `Le cœur ${nameOf(other)} aux mêmes points : ${fmt(swap)} de dégâts.`;
    else verdict = isEn ? `The ${nameOf(other)} core would do ${fmt(swap)}: keep yours.` : `Le cœur ${nameOf(other)} ferait ${fmt(swap)} : gardez le vôtre.`;
    dom.gpdCoreCmpSummary.textContent = `${head} ${verdict}`;
  }
  dom.gpdCoreCmpBody.innerHTML = cmp.steps.map(s => {
    const best = s.attack !== null && s.weapon !== null ? (s.attack >= s.weapon ? 'attack' : 'weapon') : null;
    const cell = k => `<td class="col-num${best === k ? ' gpd-gain-val' : ''}">${fmt(s[k])}${best === k ? ' ★' : ''}</td>`;
    return `
      <tr${s.points === (at && at.points) ? ' class="gpd-row plan-selected"' : ''}>
        <td>${s.points} pts</td>
        ${cell('attack')}
        ${cell('weapon')}
      </tr>`;
  }).join('');
}
