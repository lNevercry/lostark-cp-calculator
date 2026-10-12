// Placement des gemmes DPS (Smart Advisor) : chaque gemme est-elle sur une compétence qui pèse encore dans la spé ?
// Demande de r/lostarkgame 1x3c7tx (« quand exactement une gemme décroche »). Même modèle que dpsGemSetGain :
// chaque compétence pèse sa part des dégâts de la spé (data/skill-shares.json), gemme de dégâts = dégâts × (1 + effet),
// gemme de recharge = lancers ÷ (1 − effet), compétence relancée dès sa recharge (meilleur cas, comme Loseii).
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// Gain sous lequel une gemme est considérée comme bien placée (bruit des parts médianes de la spé)
const GEM_PLACEMENT_MIN_GAIN = 0.05;

// Effets de gemme par compétence : { [skillId]: { dmg, cd } } en fraction (une seule gemme de chaque type par compétence)
function gemEffectsBySkill(gems) {
  const out = {};
  gems.forEach(g => new Set(g.skills).forEach(id => {
    const e = out[id] || (out[id] = { dmg: 0, cd: 0 });
    e[g.kind] = Math.max(e[g.kind], g.pct / 100);
  }));
  return out;
}

// Gain (100 × ln) quand les effets passent de `cur` à `next` (seules les compétences listées dans `next` changent)
function gemEffectsGain(cur, next, shares) {
  let mult = 1;
  Object.keys(next).forEach(id => {
    const s = (shares.skills[id] || [0])[0] || 0;
    const a = cur[id] || { dmg: 0, cd: 0 }, b = next[id];
    mult += s * ((1 + b.dmg) / (1 + a.dmg) * (1 - a.cd) / (1 - b.cd) - 1);
  });
  return 100 * Math.log(mult);
}

/**
 * Pour chaque gemme DPS portée sur une seule compétence : meilleure autre compétence du personnage pour le même effet,
 * soit libre (déplacement), soit déjà gemmée plus bas (échange des deux niveaux), et gain correspondant.
 * Gemmes de groupe (types 34 / 35, plusieurs compétences) : affichées sans alternative. null sans parts de la spé.
 */
function gemPlacementAdvice(charObj) {
  const gems = realGems(charObj);
  const shares = specSkillShares(charObj);
  if (!gems || !shares) return null;
  const lo = (charObj.rawProfile && charObj.rawProfile.loadout) || {};
  const own = new Set((lo.skills || []).map(s => String(s.id)));
  const cur = gemEffectsBySkill(gems);
  const shareOf = id => (shares.skills[id] || [0])[0] || 0;
  const nameOf = id => (shares.skills[id] || [])[1] || String(id);
  // Cibles : compétences montées du personnage (niveau > 1 ou rune) ou déjà gemmées. Éveil, techniques
  // d'hyper-éveil et compétences d'identité restent au niveau 1 sans rune et ne prennent pas de gemme
  // (ex. Fatal Finale, 33 % des dégâts du Night's Edge). Sans liste de compétences : aucune cible.
  const gemmable = new Set((lo.skills || []).filter(s => s.level > 1 || s.rune > 0).map(s => String(s.id)));
  Object.keys(cur).forEach(id => gemmable.add(id));
  const candidates = Object.keys(shares.skills).filter(id => own.has(id) && gemmable.has(id) && shareOf(id) > 0);

  // Plan glouton : à chaque tour le meilleur déplacement ou échange parmi les gemmes pas encore bougées, gain marginal
  // mesuré contre l'état d'origine (les parts de la spé correspondent aux gemmes portées), une seule gemme de chaque
  // type par compétence.
  const at = gems.map(g => (g.skills.length === 1 ? String(g.skills[0]) : null));
  const placed = () => gems.map((g, i) => (at[i] ? Object.assign({}, g, { skills: [at[i]] }) : g));
  const totalGain = list => {
    const next = gemEffectsBySkill(list);
    const keys = new Set([...Object.keys(cur), ...Object.keys(next)]);
    const changed = {};
    keys.forEach(id => { changed[id] = next[id] || { dmg: 0, cd: 0 }; });
    return gemEffectsGain(cur, changed, shares);
  };
  const rows = gems.map((g, i) => ({ index: i, level: g.level, kind: g.kind, pct: g.pct, group: g.group,
    share: gemDamageShare(g, shares), name: g.group || (at[i] ? nameOf(at[i]) : null),
    offClass: own.size > 0 && g.skills.length > 0 && !g.skills.some(id => own.has(String(id)) || shares.skills[id]), best: null }));
  const done = new Set();
  let base = 0;
  for (;;) {
    const list = placed();
    const effects = gemEffectsBySkill(list);
    let best = null;
    gems.forEach((g, i) => {
      if (done.has(i) || !at[i] || rows[i].offClass) return;
      candidates.forEach(id => {
        if (id === at[i] || shareOf(id) <= shareOf(at[i]) || ((effects[id] || {})[g.kind] || 0) >= g.pct / 100) return;
        // Échange avec la gemme du même type déjà sur la cible (plus basse), sinon déplacement
        const j = gems.findIndex((o, k) => k !== i && o.kind === g.kind && at[k] === id);
        const trial = at.slice();
        trial[i] = id;
        if (j >= 0) trial[j] = at[i];
        const gain = totalGain(gems.map((o, k) => (trial[k] ? Object.assign({}, o, { skills: [trial[k]] }) : o))) - base;
        if (!best || gain > best.gain) best = { i, j, id, gain, trial };
      });
    });
    if (!best || best.gain < GEM_PLACEMENT_MIN_GAIN) break;
    rows[best.i].best = { id: best.id, name: nameOf(best.id), share: shareOf(best.id), gain: best.gain,
      swapLevel: best.j >= 0 ? gems[best.j].level : null, step: done.size + 1 };
    done.add(best.i);
    if (best.j >= 0) done.add(best.j);
    at.splice(0, at.length, ...best.trial);
    base += best.gain;
  }
  // Étapes du plan dans l'ordre (un gain peut dépendre d'une étape précédente : deux gemmes sur la même compétence
  // se multiplient), puis les gemmes laissées en place
  return rows.sort((a, b) => ((a.best ? a.best.step : 1e3) - (b.best ? b.best.step : 1e3)) || (b.share - a.share));
}

function renderGemPlacement(charObj, isSupport, isEn) {
  if (!dom.gpdGemPlaceCard || !dom.gpdGemPlaceBody) return;
  const rows = isSupport ? null : gemPlacementAdvice(charObj);
  dom.gpdGemPlaceCard.style.display = rows && rows.length ? '' : 'none';
  if (!rows || !rows.length) { dom.gpdGemPlaceBody.innerHTML = ''; return; }
  const pct = v => (isEn ? (v * 100).toFixed(1) : (v * 100).toFixed(1).replace('.', ',')) + ' %';
  const gainTxt = v => `+${isEn ? v.toFixed(2) : v.toFixed(2).replace('.', ',')} %`;
  const kindTxt = k => (k === 'dmg' ? (isEn ? 'Damage' : 'Dégâts') : (isEn ? 'Cooldown' : 'Recharge'));
  let stepNo = 0;
  rows.forEach(r => { if (r.best && !r.offClass && r.best.gain >= GEM_PLACEMENT_MIN_GAIN) r.best.stepNo = ++stepNo; });
  dom.gpdGemPlaceBody.innerHTML = rows.map(r => {
    let advice;
    if (r.offClass) advice = `<span class="piece-line-tag dead">${isEn ? 'Other class: attack power only' : 'Autre classe : PA seule'}</span>`;
    else if (!r.best && r.group) advice = `<span class="gpd-step-muted">${isEn ? 'Skill group gem' : 'Gemme de groupe de compétences'}</span>`;
    else if (!r.best || r.best.gain < GEM_PLACEMENT_MIN_GAIN) advice = `<span class="ov-maxed">${isEn ? 'Well placed' : 'Bien placée'}</span>`;
    else {
      const how = r.best.swapLevel
        ? (isEn ? `swap with its Lv. ${r.best.swapLevel}` : `échange avec sa niv. ${r.best.swapLevel}`)
        : (isEn ? 'no gem of this type there' : 'aucune gemme de ce type dessus');
      advice = `${isEn ? 'Step' : 'Étape'} ${r.best.stepNo} · ${isEn ? 'better on' : 'mieux sur'} <strong>${r.best.name}</strong> (${pct(r.best.share)}, ${how})`;
    }
    const gain = r.best && r.best.gain >= GEM_PLACEMENT_MIN_GAIN && !r.offClass ? gainTxt(r.best.gain) : '—';
    return `
      <tr>
        <td><span class="gpd-system-title">${r.name || (isEn ? 'Unknown skill' : 'Compétence inconnue')}</span>
          <span class="gpd-read-text">${kindTxt(r.kind)} · ${isEn ? 'Lv.' : 'niv.'} ${r.level}</span></td>
        <td class="col-num">${r.offClass ? '—' : pct(r.share)}</td>
        <td>${advice}</td>
        <td class="col-num gpd-gain-val">${gain}</td>
      </tr>`;
  }).join('');
}
