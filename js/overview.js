// Vue d'ensemble de la progression (haut du Smart Advisor), idée reprise de l'onglet « Upgrades » du builder Maxroll :
// où en est le personnage dans chaque catégorie, entre rien et le maximum du jeu, et ce qu'il reste à gagner.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

const OVERVIEW_GEM_SLOTS = 11;
const OVERVIEW_STONE_MAX_LEVEL = 4;

const fmtOvNum = (v, d, isEn) => (isEn ? v.toFixed(d) : v.toFixed(d).replace('.', ','));

/**
 * Lignes de la vue d'ensemble. Chaque ligne : état lu sur le profil (`state`), part du maximum atteinte (`frac`,
 * null si la catégorie n'a pas d'échelle lisible) et gain jusqu'au maximum (`remain`, même unité que le GPD :
 * 100 × ln, % de dégâts ou % de buff ; null quand le modèle ne le chiffre pas). Aucune valeur inventée :
 * une catégorie illisible sur le profil est absente.
 */
function buildProgressOverview(charObj, isSupport, isEn) {
  if (!charObj || !charObj.rawProfile) return [];
  const rows = [];
  const add = (key, label, state, frac, remain) =>
    rows.push({ key, label, state, frac: Number.isFinite(frac) ? Math.max(0, Math.min(1, frac)) : null,
      remain: Number.isFinite(remain) ? Math.max(0, remain) : null });
  const ctx = gearStatContext(charObj);
  const gear = ctx ? ctx.gear : null;
  const trackOf = sl => (pieceIsSerka(gear, sl) ? 'Serka' : 'Aegir');

  // Affinage : chaque pièce jusqu'à +25 sur sa propre piste (Serka / Aegir)
  if (ctx && gear.weapon >= 0) {
    const lvl = gear.weapon;
    const remain = lvl < 25 ? gearRoleGain(charObj, ctx, [{ slot: 'weapon', isSerka: pieceIsSerka(gear, 'weapon'), lvl,
      adv: gearAdvOf(charObj, gear, 'weapon'), toLvl: 25, toAdv: gearAdvOf(charObj, gear, 'weapon') }], isSupport) : 0;
    add('weapon', isEn ? 'Honing — Weapon' : 'Affinage — Arme', `${trackOf('weapon')} +${lvl} / +25`, lvl / 25, remain);
  }
  const armors = ctx ? GEAR_ARMOR_SLOTS.filter(sl => gear[sl] >= 0) : [];
  if (armors.length === GEAR_ARMOR_SLOTS.length) {
    const changes = armors.filter(sl => gear[sl] < 25).map(sl => ({ slot: sl, isSerka: pieceIsSerka(gear, sl), lvl: gear[sl],
      adv: gearAdvOf(charObj, gear, sl), toLvl: 25, toAdv: gearAdvOf(charObj, gear, sl) }));
    const remain = changes.length ? gearRoleGain(charObj, ctx, changes, isSupport) : 0;
    const sum = armors.reduce((s, sl) => s + gear[sl], 0);
    const tracks = [...new Set(armors.map(trackOf))].join(' / ');
    add('armor', isEn ? 'Honing — Armor' : 'Affinage — Armures',
      `${tracks} ${armors.map(sl => `+${gear[sl]}`).join(' ')}`, sum / (25 * armors.length), remain);
  }
  // Affinage avancé : pièces Aegir seulement (sur le Serka il ne change ni l'iLvl ni les stats)
  const aegir = ctx ? ['weapon', ...GEAR_ARMOR_SLOTS].filter(sl => gear[sl] >= 0 && !pieceIsSerka(gear, sl)) : [];
  if (aegir.length) {
    const advs = aegir.map(sl => gearAdvOf(charObj, gear, sl));
    const all40 = advs.every(a => a >= 40);
    const remain = all40 ? 0 : advHoningDpsGain(charObj, aegir, false, 40, isSupport);
    add('adv', isEn ? 'Advanced honing (Aegir)' : 'Affinage avancé (Aegir)',
      `${fmtOvNum(advs.reduce((a, b) => a + b, 0) / advs.length, 1, isEn)} / 40 (${aegir.length} ${isEn ? 'pc' : 'pièce'}${aegir.length > 1 ? 's' : ''})`,
      advs.reduce((a, b) => a + b, 0) / (40 * advs.length), remain);
  }

  // Gemmes T4 portées, toutes au niveau 10 (emplacements vides : signalés, non chiffrés)
  const gemLevels = isSupport ? (supportInputs(charObj).gems || null) : (realGems(charObj) || []).map(g => g.level);
  if (gemLevels && gemLevels.length) {
    const n = gemLevels.length;
    const sum = gemLevels.reduce((a, b) => a + b, 0);
    const to = gemLevels.map(() => 10);
    const remain = sum >= 10 * n ? 0 : (isSupport ? supportGemSetGain(charObj, to) : dpsGemSetGain(charObj, to));
    add('gems', isEn ? 'Gems' : 'Gemmes',
      `${n}/${OVERVIEW_GEM_SLOTS} · ${isEn ? 'avg.' : 'moy.'} ${fmtOvNum(sum / n, 1, isEn)}`, sum / (10 * OVERVIEW_GEM_SLOTS), remain);
  }

  // Bijoux : lignes réelles contre les 5 bijoux High / High (même maximum que la note des bijoux)
  const acc = evaluateCharacterAccessories(charObj, isSupport, isEn);
  if (acc && acc.slotLines) {
    const cur = computeAccessoryLinesBonus(ACC_SLOTS.flatMap(s => acc.slotLines[s] || []), isSupport);
    const max = accessoryMaxBonusPct(isSupport);
    const g = accessoryGrade(cur, isSupport);
    add('acc', isEn ? 'Accessories' : 'Bijoux', `${g.grade} · ${fmtOvNum(cur, 2, isEn)} / ${fmtOvNum(max, 2, isEn)} %`,
      cur / max, 100 * Math.log((1 + max / 100) / (1 + cur / 100)));
  }

  // Bracelet et astrogemmes : note sur l'échelle 0-100 de Loseii (pas de maximum chiffrable : relances)
  const br = braceletBandOf(charObj, isSupport);
  if (br) add('bracelet', 'Bracelet', `${br.band} · ${fmtOvNum(br.score, 1, isEn)}`, br.score / 100, null);
  const ag = astrogemGridBand(charObj, isSupport);
  if (ag) add('astrogems', isEn ? 'Astrogems' : 'Astrogemmes', `${ag.band} · ${fmtOvNum(ag.mean, 1, isEn)} (${ag.n})`, ag.mean / 100, null);

  // Cœurs de la Grille d'Ark : points de chaque cœur sur 20
  const cores = getArkGridCoreIds(charObj);
  const coreDefs = ARK_CORE_DEFS.filter(d => cores[d.key]);
  if (coreDefs.length) {
    const pts = coreDefs.map(d => Math.min(20, cores[d.key].points || 0));
    add('cores', isEn ? 'Ark Grid cores' : 'Cœurs de la Grille d\'Ark',
      `${pts.join(' · ')} pts`, pts.reduce((a, b) => a + b, 0) / (20 * ARK_CORE_DEFS.length), null);
  }

  // Ark Passive : points dépensés par arbre (DPS : gain du Battle Point jusqu'au maximum ; support : branche buff du
  // Battle Point, pas dans l'unité de Loseii, non chiffré)
  const ap = arkPassiveModel(charObj);
  if (ap) {
    const t = ARK_TREES.map(tr => ap.trees[tr.key]);
    const spent = t.reduce((s, x) => s + x.spent, 0), max = t.reduce((s, x) => s + x.max, 0);
    const remain = isSupport ? null : 100 * Math.log(t.reduce((m, x) => m * (1 + x.rate * x.max / 1e4) / (1 + x.value / 1e4), 1));
    add('arkpassive', 'Ark Passive', t.map(x => `${x.spent}/${x.max}`).join(' · '), spent / max, remain);
  }

  // Karma d'Illumination : +0,10 % de puissance d'arme par niveau, jusqu'au dernier niveau de la table du jeu
  const karmaLvl = charObj.rawProfile.loadout && charObj.rawProfile.loadout.karma && charObj.rawProfile.loadout.karma.enlightenment;
  if (karmaT4 && Number.isFinite(karmaLvl) && ctx) {
    const maxLvl = Math.max(...Object.keys(karmaT4).map(Number));
    const wpAt = l => (karmaT4[l] && karmaT4[l].wp) || 0;
    const dWp = (ctx.wp / ctx.wpAmp) * (wpAt(maxLvl) - wpAt(karmaLvl)) / 1e4;
    const remain = dWp > 0 ? (isSupport ? supportApGain(charObj, ctx, dWp, 0) : 50 * Math.log(1 + dWp / ctx.wp)) : 0;
    add('karma', isEn ? 'Enlightenment Karma' : 'Karma d\'Illumination', `${karmaLvl} / ${maxLvl}`, karmaLvl / maxLvl, remain);
  }

  // Pierre d'aptitude : niveaux des deux gravures (0 à 4)
  const stone = getAbilityStone(charObj);
  if (stone) {
    const lv = stone.positives.map(p => p.level);
    add('stone', isEn ? 'Ability stone' : 'Pierre d\'aptitude',
      stone.positives.map(p => `${isEn ? p.en : p.fr} ${p.level}`).join(' · '), (lv[0] + lv[1]) / (2 * OVERVIEW_STONE_MAX_LEVEL), null);
  }

  // Livres reliques : livres lus sur les gravures reliques (20 par gravure)
  const engr = (charObj.rawProfile.engravings || (charObj.rawProfile.loadout && charObj.rawProfile.loadout.engravings) || [])
    .map(relicBooksRead).filter(r => r !== null);
  if (engr.length) {
    const read = engr.reduce((a, b) => a + b, 0);
    add('books', isEn ? 'Relic books' : 'Livres reliques', `${read} / ${RELIC_MAX_BOOKS * engr.length}`, read / (RELIC_MAX_BOOKS * engr.length), null);
  }

  if (!isSupport) {
    const q = weaponQualityOf(charObj);
    if (q !== null) add('quality', isEn ? 'Weapon quality' : 'Qualité d\'arme', `${q} / 100`, q / 100, q < 100 ? weaponQualityGain(q, 100) : 0);
  }

  const av = avatarBonusOf(charObj);
  if (av) {
    const step = av.pct < AVATAR_MAX_PCT ? avatarGpdStep(charObj, isSupport) : null;
    add('avatars', 'Avatars', `${fmtOvNum(av.pct, 1, isEn)} / ${AVATAR_MAX_PCT} %`, av.pct / AVATAR_MAX_PCT, av.pct >= AVATAR_MAX_PCT ? 0 : (step && step.gain));
  }

  // Où il reste le plus à gagner d'abord ; catégories sans gain chiffré ensuite, dans l'ordre ci-dessus
  return rows.map((r, i) => ({ r, i }))
    .sort((a, b) => ((b.r.remain !== null) - (a.r.remain !== null)) || ((b.r.remain || 0) - (a.r.remain || 0)) || (a.i - b.i))
    .map(x => x.r);
}

function renderProgressOverview(charObj, isSupport, isEn) {
  if (!dom.gpdOverviewBody) return;
  const rows = buildProgressOverview(charObj, isSupport, isEn);
  const unit = isSupport ? '% buff' : (isEn ? '% dmg' : '% dégâts');
  if (!rows.length) {
    dom.gpdOverviewBody.innerHTML = `<tr><td colspan="4" class="gpd-step-muted">${isEn ? 'Import a character to see its progression.' : 'Importez un personnage pour voir sa progression.'}</td></tr>`;
    return;
  }
  dom.gpdOverviewBody.innerHTML = rows.map(r => {
    const pct = r.frac === null ? null : Math.round(r.frac * 100);
    const remain = r.remain === null
      ? `<span class="gpd-step-muted" title="${isEn ? 'Not priced to the maximum (rerolls, game choices)' : 'Pas de maximum chiffrable (relances, choix en jeu)'}">—</span>`
      : (r.remain < 0.005 ? '<span class="ov-maxed">max</span>' : `+${fmtOvNum(r.remain, 2, isEn)} ${unit}`);
    return `
      <tr>
        <td><span class="gpd-system-title">${r.label}</span></td>
        <td><span class="gpd-read-text">${r.state}</span></td>
        <td class="col-rate">${pct === null ? '—' : `
          <div class="gpd-rate-cell">
            <span class="gpd-rate-bar"><span style="width: ${Math.max(2, pct)}%"></span></span>
            <span class="gpd-rate-val">${pct} %</span>
          </div>`}
        </td>
        <td class="col-num gpd-gain-val">${remain}</td>
      </tr>`;
  }).join('');
}
