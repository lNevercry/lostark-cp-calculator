// Smart Advisor : feuille de route, données du GPD, tableau pièce par pièce.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function extractCharacterGemParts(charObj) {
  if (!charObj) return null;
  if (Array.isArray(charObj.gemParts) && charObj.gemParts.length > 0) {
    return charObj.gemParts;
  }
  const raw = charObj.rawProfile || (charObj.loadouts ? charObj : null) || (charObj.loadout ? charObj.loadout : null);
  if (raw) {
    if (Array.isArray(raw.gemParts) && raw.gemParts.length > 0) {
      return raw.gemParts;
    }
    const l = (raw.loadouts && (raw.loadouts.find(x => x.classification === 'raid_merged') || raw.loadouts[0])) || raw;
    if (l && Array.isArray(l.gems) && l.gems.length > 0) {
      const isSupport = detectCharacterRole(charObj) === 'support' || (l && detectCharacterRole(l.classId) === 'support');
      return l.gems.map(g => {
        if (g.id) {
          const idStr = g.id.toString();
          if (idStr.length >= 8) {
            const lvlSub = parseInt(idStr.substring(5, 7), 10);
            if (lvlSub === 10) return isSupport ? 12.0 : 7.0;
            if (lvlSub === 9) return isSupport ? 10.8 : 6.35;
            if (lvlSub === 8) return isSupport ? 9.6 : 5.76;
            if (lvlSub === 7) return isSupport ? 8.5 : 5.12;
            if (lvlSub === 6) return isSupport ? 7.5 : 4.5;
          }
        }
        const atkEff = (g.effects || []).find(e => e.type === 2 && e.id === 150);
        if (atkEff) {
          if (atkEff.value >= 120) return isSupport ? 12.0 : 7.0;
          if (atkEff.value >= 100) return isSupport ? 10.8 : 6.35;
          if (atkEff.value >= 80) return isSupport ? 9.6 : 5.76;
          if (atkEff.value >= 60) return isSupport ? 8.5 : 5.12;
          return isSupport ? 7.5 : 4.5;
        }
        const cdEff = (g.effects || []).find(e => e.type === 27 || e.type === 5);
        if (cdEff) {
          if (cdEff.value >= 2400) return isSupport ? 12.0 : 7.0;
          if (cdEff.value >= 2200) return isSupport ? 10.8 : 6.35;
          if (cdEff.value >= 2000) return isSupport ? 9.6 : 5.76;
          if (cdEff.value >= 1800) return isSupport ? 8.5 : 5.12;
          return isSupport ? 7.5 : 4.5;
        }
        return isSupport ? 8.5 : 5.12;
      });
    }
  }
  const cKey = (charObj.id || charObj.name || '').toLowerCase().trim();
  return null;
}

/**
 * Étape k (k ≥ 2) d'une chaîne du GPD, une fois les k − 1 précédentes faites : affinage arme / armures (+1 niveau,
 * gain marginal du modèle sur le personnage réel), gemmes (le même groupe monte encore d'un niveau), Karma, échelles
 * de Loseii du bracelet et des astrogemmes (palier suivant, or et gain du palier). null en fin de chaîne ou pour les
 * systèmes à une seule étape (bijoux, livres, qualité, pierre, affinage avancé).
 */
function gpdFollowUp(charObj, isSupport, isEn, base, k) {
  const ratioUnit = isSupport ? 100 : 1;
  const mk = (nextStep, cost, gain, extra) => (gain >= 1e-4 && cost > 0 ? Object.assign({}, base, {
    id: `${base.id}#${k}`, chain: base.id, step: k, nextStep, cost: Math.round(cost), dmgGain: Number(gain.toFixed(2)),
    gainRaw: gain, rate: Math.round(cost / (gain * ratioUnit))
  }, extra || {}) : null);
  const sys = extractPlayerSystems(charObj, isEn);
  if (base.id === 'dyn_weapon' || base.id === 'dyn_armor') {
    const isW = base.id === 'dyn_weapon';
    const piece = isW ? 'weapon' : 'armor';
    const isSerka = isW ? sys.weapon.isSerka : sys.armors.isSerka;
    const g = (gearStatContext(charObj) || {}).gear;
    if (!g || !honingT4) return null;
    const slots = isW ? ['weapon'] : GEAR_ARMOR_SLOTS;
    const levels = slots.map(sl => ({ l: g[sl], track: pieceIsSerka(g, sl) ? 'serka' : 'aegir' })).filter(x => x.l >= 0 && x.l + k - 1 < 25);
    if (!levels.length) return null;
    const g1 = honingGainTo(charObj, piece, isSerka, isSupport, k), g0 = honingGainTo(charObj, piece, isSerka, isSupport, k - 1);
    if (g1 === null || g0 === null) return null;
    const cost = levels.reduce((sum, x) => sum + getLevelCost(isW ? 'weapon' : 'armor', x.l + k - 1, x.track).totalValue, 0);
    if (isW) {
      const from = Math.floor(sys.weapon.wLvl) + k - 1;
      return mk(`+${from} ➔ +${from + 1}`, cost, g1 - g0, { targetVal: from + 1 });
    }
    // Armures : pièces réelles encore sous +25 à cette étape (niveaux différents : « +1 sur n pièces »)
    const lbl = armorStepLabel(levels.map(x => x.l), k, isEn, sys.armors.avgArmor);
    return mk(lbl.step, cost, g1 - g0, { targetVal: Math.min(...levels.map(x => x.l)) + k, armorStep: k });
  }
  const gm = /^dyn_gems_(\d+)_\d+$/.exec(base.id);
  if (gm) {
    const L = +gm[1];
    if (L + k > 10) return null;
    const baseLv = isSupport ? realGemLevels(charObj) : (realGems(charObj) || []).map(x => x.level);
    if (!baseLv || !baseLv.length) return null;
    const at = j => baseLv.map(l => (l === L ? L + j : l));
    const setGain = lv => (isSupport ? supportGemSetGain(charObj, lv) : dpsGemSetGain(charObj, lv));
    const g1 = setGain(at(k)), g0 = setGain(at(k - 1));
    if (g1 === null || g0 === null) return null;
    const n = baseLv.filter(l => l === L).length;
    return mk(`${n}× ${isEn ? 'Lv.' : 'Niv.'} ${L + k - 1} ➔ ${L + k}`, n * GEM_UPGRADE_COST[L + k - 1], g1 - g0);
  }
  if (base.id === 'dyn_karma') {
    const lo = (charObj && charObj.rawProfile && charObj.rawProfile.loadout) || {};
    const lvl = lo.karma && lo.karma.enlightenment;
    if (!(lvl >= 0)) return null;
    const st = karmaGpdStep(charObj, isSupport, lvl + k - 1);
    return st ? mk(`${st.lvl} ➔ ${st.lvl + 1}`, st.cost, st.gain) : null;
  }
  if (base.id === 'dyn_brac' || base.id.startsWith('dyn_astro_')) {
    // Échelle de Loseii : paliers suivants, or et gain propres à chaque palier
    const ladder = base.id === 'dyn_brac'
      ? (loseiiGpd.rows[isSupport ? 'support' : 'dps'] || []).filter(r => r.series === 'bracelet')
      : ((loseiiGpd.arkgrid[isSupport ? 'support' : 'dps'][base.id.replace('dyn_astro_', '')] || {}).rows || []);
    let to = (/➔\s*(\S+)\s*$/.exec(base.nextStep) || [])[1];
    let row = null;
    for (let j = 2; j <= k; j++) {
      row = ladder.find(x => x.from === to);
      if (!row) return null;
      to = row.to;
    }
    if (!row) return null;
    const gold = row.gold * (base.id === 'dyn_brac' ? loseiiRepriceRatio(row) : 1);
    return mk(`${row.from} ➔ ${row.to}`, gold, row.damage);
  }
  return null;
}

/**
 * Feuille de route vers un objectif : à chaque tour, l'étape au meilleur ratio parmi les premières étapes du GPD et
 * les étapes suivantes des chaînes déjà engagées. Taille d'épiques et de rares = deux chemins vers la même grille :
 * le premier retenu exclut l'autre. Objectif en CP (DPS, gains en % de dégâts × CP actuel) ou en % de buff (support).
 * opts.cpGoal : objectif en CP cumulé, y compris pour un support (onglet Belgardin) ; opts.maxSteps : 40 par défaut ;
 * opts.startK : { id de ligne: k } pour partir de la k-ième étape d'une chaîne (affinage déjà prévu ailleurs) ;
 * opts.maxRate : étapes au-delà de ce ratio écartées, chaîne arrêtée (objectif hors de portée : bout des échelles).
 */
function buildGpdRoadmap(charObj, isSupport, isEn, masterRows, goal, opts = {}) {
  const maxSteps = opts.maxSteps || 40;
  const cpGoal = opts.cpGoal > 0 ? opts.cpGoal : null;
  const startK = opts.startK || {};
  const avail = masterRows.map(r => {
    const k = startK[r.id] > 1 ? startK[r.id] : 1;
    if (k === 1) return { row: Object.assign({ chain: r.id, step: 1 }, r), k: 1 };
    const row = gpdFollowUp(charObj, isSupport, isEn, r, k);
    return row ? { row, k } : null;
  }).filter(Boolean);
  const plan = [];
  let cum = 0, cumCp = 0, gold = 0, arkChain = null;
  const currentCp = characterCp(charObj);
  while (avail.length && (cpGoal ? cumCp < cpGoal : cum < goal) && plan.length < maxSteps) {
    avail.sort((a, b) => a.row.rate - b.row.rate);
    const it = avail.shift();
    if (it.row.category === 'arkGrid') {
      if (arkChain && arkChain !== it.row.chain) continue;
      arkChain = it.row.chain;
    }
    const row = it.row;
    if (opts.maxRate && row.rate > opts.maxRate) continue;
    // Gain non arrondi (dmgGain est arrondi à 0,01 % pour l'affichage)
    const gain = row.gainRaw !== undefined ? row.gainRaw : row.dmgGain;
    if (it.k > 1 || row.cpGain === undefined) {
      row.cpGain = isSupport
        ? (row.cpPerGain ? row.cpPerGain * gain : null)
        : currentCp * (Math.exp(gain / 100) - 1);
    }
    plan.push(row);
    gold += row.cost;
    cum += isSupport ? gain : row.cpGain;
    if (row.cpGain > 0) cumCp += row.cpGain;
    const base = masterRows.find(r => r.id === row.chain);
    const next = base && gpdFollowUp(charObj, isSupport, isEn, base, it.k + 1);
    if (next) avail.push({ row: next, k: it.k + 1 });
  }
  return { plan, gold, cum, cumCp, reached: cpGoal ? cumCp >= cpGoal : cum >= goal };
}

/**
 * CP du jeu estimé d'une ligne du GPD pour un support. Le % de buff de Loseii ne se convertit pas en CP au même taux
 * pour tous les systèmes (le Battle Point pèse les lignes support autrement), on passe donc par les branches buff (A)
 * et défense (D) du Battle Point du personnage (supportBpBranches), système par système :
 * - affinage : gearCpGain (√(puissance d'arme × stat principale), PV ∝ Vitalité) ; Karma : même chose, puissance d'arme ;
 * - gemmes : partie type 22 (125 × niveau) et % de PA (supportGemCpDelta) ;
 * - pierre : valeur de la gravure dans la table support (+20 au code par niveau de pierre) et PA de base +1,5 % ;
 * - bijoux (parties 15 / 17), bracelet (19 / 20), astrogemmes (29 / 31) : parties réelles du système au prorata
 *   du buff Loseii actuel du système, soit le rapport CP / buff propre au personnage ; cœurs bornés à leur dernier palier.
 * Repli (affinage avancé, système sans partie lisible) : rapport CP / buff de l'affinage de la même famille.
 * null sans Battle Point.
 */
function supportGpdCpModel(charObj) {
  const br = supportBpBranches(charObj);
  const parts = battlePointPartsOf(charObj);
  const p1 = parts.find(p => p.type === 1);
  if (!br || !p1) return null;
  const pool = (p1.attackPowerMultiplier || 0) / 100;
  const offProd = types => parts.filter(p => types.includes(p.type) && !BP_DEF_TYPES.includes(p.type))
    .reduce((m, p) => m * (1 + (Number.isFinite(p.value) ? p.value : 0) / 1e4), 1);
  const linesCp = (types, cur, gain) => {
    const prod = offProd(types);
    if (!(cur > 0) || !(prod > 1)) return null;
    return br.A * ((1 + (prod - 1) * (cur + gain) / cur) / prod - 1);
  };
  // Astrogemmes : options support (partie 31) au prorata du buff ; cœurs (partie 29) au prorata aussi, mais bornés au
  // CP qui leur reste jusqu'à leur dernier palier (10 / 14 / 17 / 18 / 19 / 20 points, selon le rang du cœur) : un cœur
  // à 20 points ne rapporte plus rien, mieux tailler ne change que les options.
  const coreRoom = () => {
    const T = bpSupportTable && bpSupportTable[29];
    const cores = (charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.arkGridCores) || [];
    if (!T || !cores.length) return null;
    return cores.reduce((m, c) => {
      const rows = T.filter(v => v[0] === c.id && Number.isFinite(v[2]));
      if (!rows.length) return m;
      const points = (c.gems || []).reduce((sum, g) => sum + (g.corePoints || 0), 0);
      let cur = 0;
      [10, 14, 17, 18, 19, 20].forEach((st, i) => { const r = rows.find(v => v[1] === i + 1); if (points >= st && r) cur = r[2]; });
      const max = Math.max(...rows.map(v => v[2]));
      return m * (1 + max / 1e4) / (1 + cur / 1e4);
    }, 1);
  };
  const astroCp = (cur, gain) => {
    if (!(cur > 0)) return null;
    const share = types => { const prod = offProd(types); return br.A * (prod - 1) * (gain / cur) / prod; };
    const room = coreRoom();
    const cores = share([29]);
    return share([31]) + (room !== null ? Math.min(cores, br.A * (room - 1)) : cores);
  };
  const stoneCp = () => {
    const up = getAbilityStoneUpgrade(charObj, true);
    if (!up) return null;
    let cp = up.apBonus > 0 ? br.A * STONE_BASE_AP_BONUS / (1 + pool) : 0;
    if (!up.anyOrder && bpSupportTable) {
      const lo = (charObj.rawProfile && charObj.rawProfile.loadout) || {};
      const e = (lo.engravings || []).find(x => x.id === 1000 + up.up.id);
      const books = !e ? null : (e.grade === 'engrave_grade05' ? 13 : (e.grade === 'engrave_grade04' ? 9 + Math.floor((e.progress || 0) / 5) : null));
      if (books !== null) {
        [10, 11].forEach(t => {
          const val = lvl => ((bpSupportTable[t] || []).find(v => v[0] === e.id && v[1] === 20 * lvl + books) || [])[2];
          const v0 = val(up.up.level), v1 = val(up.upTo);
          if (Number.isFinite(v0) && Number.isFinite(v1)) cp += (t === 10 ? br.A : br.D) * ((1 + v1 / 1e4) / (1 + v0 / 1e4) - 1);
        });
      }
    }
    return cp > 0 ? cp : null;
  };
  return { br, linesCp, astroCp, stoneCp };
}

function supportGpdRowCp(charObj, model, d, factors) {
  const m = d.meta || {};
  const id = d.id;
  let cp = null;
  if (id === 'dyn_weapon' || id === 'dyn_armor') cp = honingCpTo(charObj, id === 'dyn_weapon' ? 'weapon' : 'armor', true, 1);
  else if (id.startsWith('dyn_gems_')) {
    const lv = realGemLevels(charObj);
    if (lv) cp = supportGemCpDelta(charObj, lv, lv.map(l => (l === m.lvl ? l + 1 : l)));
  } else if (id === 'dyn_karma') {
    const st = karmaGpdStep(charObj, true);
    const ctx = gearStatContext(charObj);
    if (st && ctx) cp = gearCpGain(charObj, ctx, { dWp: st.dWp, dMs: 0, dVit: 0 }, true);
  } else if (id === 'dyn_stone') cp = model.stoneCp();
  else if (id === 'dyn_avatar') {
    // Stat principale seule : branche buff au rapport √(stat principale), comme l'affinage des armures
    const av = avatarGpdStep(charObj, true);
    const ctx = gearStatContext(charObj);
    if (av && ctx) cp = gearCpGain(charObj, ctx, { dWp: 0, dMs: av.dMs, dVit: 0 }, true);
  }
  else if (id.startsWith('dyn_acc')) cp = model.linesCp([15, 17], m.curPct, d.gainRaw);
  else if (id === 'dyn_brac') cp = model.linesCp([19, 20], m.curTotal, d.gainRaw);
  else if (id.startsWith('dyn_astro_')) {
    const cur = astrogemGridDamage(true, { mean: m.mean, n: m.n });
    cp = cur !== null ? model.astroCp(cur, d.gainRaw) : null;
  }
  if (Number.isFinite(cp) && cp > 0) return cp;
  // Repli : rapport CP / buff de l'affinage (même famille pour l'avancé), sinon le premier disponible
  const f = id === 'dyn_adv_weapon' ? factors.weapon : (id === 'dyn_adv_armor' ? factors.armor : (factors.weapon || factors.armor));
  return f ? f * d.gainRaw : null;
}

// CP d'une ligne, arrondi : décimale sous 10 CP (un support gagne souvent quelques CP par étape)
function fmtCpGain(cp) {
  if (!Number.isFinite(cp)) return '—';
  return `+${cp < 10 ? cp.toFixed(1) : formatNumber(Math.round(cp))}`;
}

// CP du personnage pour la colonne +CP et l'objectif de la feuille de route : CP raid du profil, jamais le curseur
// du prédicteur (onglet 1) que le joueur peut déplacer ; curseur seulement sans personnage
function characterCp(charObj) {
  const cp = (charObj && (raidCombatPowerOf(charObj) || charObj.cp)) || 0;
  return cp > 0 ? cp : (state.currentCp || 0);
}

function buildMasterGpdData(charObj, isSupport, isEn) {
  const currentCp = characterCp(charObj);
  // Taille d'astrogemmes et Karma : obtenus en jeu, pas de ligne en or (cf. getDynamicGpdTable)
  const rows = [];

  // Lignes dynamiques : mêmes coûts et gains que le tableau GPD (getDynamicGpdTable)
  const dynRows = charObj ? getDynamicGpdTable(charObj, isSupport ? 'support' : 'dps', isEn) : [];
  const unit = isSupport ? 'buff' : 'dmg';
  const lvlWord = isEn ? 'Lv.' : 'Niv.';
  const dynToMaster = (d, extra) => Object.assign({
    id: d.id,
    lastRate: '—',
    cost: d.cost,
    dmgGain: d.gainVal,
    gainRaw: d.gainRaw,
    // ratioVal est déjà par 0.01% en support : on repasse par 1% comme les autres lignes (reconverti plus bas)
    rate: isSupport ? d.ratioVal * 100 : d.ratioVal
  }, extra);
  dynRows.forEach(d => {
    const m = d.meta || {};
    if (d.id === 'dyn_weapon') {
      rows.push(dynToMaster(d, {
        icon: '',
        system: isEn ? 'Weapon honing' : 'Affinage Arme',
        whatItReads: isEn ? `+${m.from} T4 Weapon` : `+${m.from} Arme T4`,
        wherePutsYou: `+${m.from}`,
        lastStep: `+${m.from - 1} ➔ +${m.from}`,
        nextStep: `+${m.from} ➔ +${m.to}`,
        category: 'gear',
        applyType: 'weapon',
        targetVal: m.to
      }));
    } else if (d.id === 'dyn_armor') {
      // Pièces à des niveaux différents : état et étape lus pièce par pièce (armorStepLabel)
      const lbl = armorStepLabel(m.levels, 1, isEn, m.from);
      const mixed = m.levels && m.levels.length && !m.levels.every(l => l === m.levels[0]);
      rows.push(dynToMaster(d, {
        icon: '',
        system: isEn ? 'Armors honing' : 'Affinage Armures',
        whatItReads: mixed ? lbl.sub : (isEn ? `+${m.from} all pieces` : `+${m.from} toutes pièces`),
        wherePutsYou: `+${m.from}`,
        lastStep: `+${m.from - 1} ➔ +${m.from}`,
        nextStep: lbl.step,
        category: 'gear',
        applyType: 'armors',
        targetVal: m.to
      }));
    } else if (d.id.startsWith('dyn_relic_')) {
      rows.push(dynToMaster(d, {
        icon: '',
        system: isEn ? `Relic books — ${m.engraving}` : `Livres reliques — ${m.engraving}`,
        whatItReads: isEn ? `${m.read}/20 books` : `${m.read}/20 livres`,
        wherePutsYou: isEn ? `Relic Lv. ${m.lvl}` : `Relique niv. ${m.lvl}`,
        lastStep: '—',
        nextStep: isEn ? `Lv. ${m.lvl} ➔ 4 (${m.books} books)` : `Niv. ${m.lvl} ➔ 4 (${m.books} livres)`,
        category: 'engraving'
      }));
    } else if (d.id === 'dyn_adv_weapon' || d.id === 'dyn_adv_armor') {
      const isW = d.id === 'dyn_adv_weapon';
      const scope = isW ? '' : (isEn ? ` (${m.pieces}/5 pieces)` : ` (${m.pieces}/5 pièces)`);
      rows.push(dynToMaster(d, {
        icon: '',
        system: isW ? (isEn ? 'Advanced honing — Weapon' : 'Affinage avancé — Arme') : (isEn ? 'Advanced honing — Armors' : 'Affinage avancé — Armures'),
        whatItReads: `${isEn ? 'Adv.' : 'Avancé'} ${m.from}/40${scope}`,
        wherePutsYou: `${m.from}/40`,
        lastStep: '—',
        nextStep: `${m.from} ➔ ${m.to}${m.breath ? (isEn ? ' (breath)' : ' (souffle)') : ''}`,
        category: 'gear'
      }));
    } else if (d.id.startsWith('dyn_gems_')) {
      const mix = [10, 9, 8, 7, 6].filter(l => m.counts[l] > 0).map(l => `${m.counts[l]}× ${lvlWord} ${l}`).join(', ');
      rows.push(dynToMaster(d, {
        icon: '',
        system: isEn ? 'Skill gems' : 'Gemmes de compétences',
        whatItReads: mix,
        wherePutsYou: `${m.n}/${m.total} ${lvlWord} ${m.lvl}`,
        lastStep: '—',
        nextStep: `${m.n}× ${lvlWord} ${m.lvl} ➔ ${m.lvl + 1}`,
        category: 'gems',
        applyType: 'gems',
        targetVal: m.lvl + 1
      }));
    } else if (d.id.startsWith('dyn_core_')) {
      rows.push(dynToMaster(d, {
        icon: m.key.endsWith('Sun') ? '' : (m.key.endsWith('Moon') ? '' : ''),
        system: isEn ? `Ark grid — ${m.label} core` : `Grille d'Ark — Cœur ${m.label}`,
        whatItReads: `${m.pts} pts`,
        wherePutsYou: `${m.pts}P`,
        lastStep: '—',
        nextStep: `${m.pts}P ➔ 17P`,
        category: 'arkGrid'
      }));
    } else if (d.id === 'dyn_quality') {
      rows.push(dynToMaster(d, {
        icon: '',
        system: isEn ? 'Weapon quality' : 'Qualité d\'arme',
        whatItReads: isEn ? `Quality ${m.quality}` : `Qualité ${m.quality}`,
        wherePutsYou: `${m.quality}`,
        lastStep: '—',
        nextStep: isEn ? `${m.quality} ➔ higher (${(m.chance * 100).toFixed(2)}%/attempt)` : `${m.quality} ➔ supérieure (${(m.chance * 100).toFixed(2)} %/essai)`,
        category: 'gear'
      }));
    } else if (d.id === 'dyn_brac') {
      rows.push(dynToMaster(d, {
        icon: '',
        system: 'Bracelet',
        whatItReads: isEn ? `${m.from} · score ${m.score.toFixed(1)}` : `${m.from} · score ${m.score.toFixed(1)}`,
        wherePutsYou: m.from,
        lastStep: '—',
        nextStep: `${m.from} ➔ ${m.to}`,
        category: 'bracelet'
      }));
    } else if (d.id === 'dyn_stone') {
      rows.push(dynToMaster(d, {
        icon: '',
        system: isEn ? 'Ability stone' : 'Pierre d\'aptitude',
        whatItReads: `${m.from} · ${m.engraving}`,
        wherePutsYou: m.from,
        lastStep: '—',
        nextStep: `${m.from} ➔ ${m.to}`,
        stepDetail: isEn
          ? `${formatNumber(m.odds)} uncut stones × ${m.stoneGold} g (faceting in silver, not counted)`
          : `${formatNumber(m.odds)} pierres non taillées × ${m.stoneGold} or (taille en argent, non comptée)`,
        category: 'stone'
      }));
    } else if (d.id === 'dyn_karma') {
      rows.push(dynToMaster(d, {
        icon: '',
        system: isEn ? 'Karma — Enlightenment' : 'Karma — Illumination',
        whatItReads: m.state,
        wherePutsYou: m.state,
        lastStep: '—',
        nextStep: `${m.lvl} ➔ ${m.lvl + 1}`,
        category: 'arkPassive'
      }));
    } else if (d.id === 'dyn_avatar') {
      const pct = isEn ? `${m.pct}%` : `${String(m.pct).replace('.', ',')} %`;
      rows.push(dynToMaster(d, {
        icon: '',
        system: 'Avatars',
        whatItReads: isEn ? `Main stat +${pct}` : `Stat principale +${pct}`,
        wherePutsYou: pct,
        lastStep: '—',
        nextStep: `${pct} ➔ ${AVATAR_MAX_PCT}${isEn ? '%' : ' %'}`,
        stepDetail: isEn ? `${m.buy} legendary piece${m.buy > 1 ? 's' : ''} × price set in the GPD tab` : `${m.buy} pièce${m.buy > 1 ? 's' : ''} légendaire${m.buy > 1 ? 's' : ''} × prix réglé dans l'onglet GPD`,
        category: 'gear'
      }));
    } else if (d.id.startsWith('dyn_astro_')) {
      rows.push(dynToMaster(d, {
        icon: '',
        system: m.rarity === 'epic'
          ? (isEn ? 'Ark grid — cutting epics' : 'Grille d\'Ark — taille d\'épiques')
          : (isEn ? 'Ark grid — cutting rares' : 'Grille d\'Ark — taille de rares'),
        whatItReads: isEn ? `${m.from} (mean of ${m.n} gems: ${m.mean.toFixed(1)})` : `${m.from} (moyenne des ${m.n} gemmes : ${m.mean.toFixed(1)})`,
        wherePutsYou: m.from,
        lastStep: '—',
        nextStep: `${m.from} ➔ ${m.to}`,
        category: 'arkGrid'
      }));
    } else if (d.id.startsWith('dyn_acc')) {
      rows.push(dynToMaster(d, {
        icon: '',
        system: isEn ? `Accessory — ${m.slotName}` : `Bijou — ${m.slotName}`,
        whatItReads: isEn ? `Accessories +${m.curPct.toFixed(2)}% ${unit}` : `Bijoux +${m.curPct.toFixed(2)}% ${unit}`,
        wherePutsYou: isEn ? 'Best ratio' : 'Meilleur ratio',
        lastStep: '—',
        nextStep: `➔ ${m.target}`,
        stepDetail: isEn ? `now ${m.current} · + dead line` : `actuel ${m.current} · + ligne morte`,
        category: 'acc'
      }));
    }
  });

  // CP estimé : DPS, chaque système est un multiplicateur du Battle Point (CP × (e^(gain/100) − 1)) ;
  // support, Battle Point système par système (supportGpdRowCp)
  const supModel = isSupport && charObj ? supportGpdCpModel(charObj) : null;
  const factors = {};
  if (supModel) {
    dynRows.filter(d => d.id === 'dyn_weapon' || d.id === 'dyn_armor').forEach(d => {
      const cp = supportGpdRowCp(charObj, supModel, d, {});
      if (cp > 0 && d.gainRaw > 0) factors[d.id === 'dyn_weapon' ? 'weapon' : 'armor'] = cp / d.gainRaw;
    });
  }
  rows.forEach(r => {
    if (isSupport) {
      const d = dynRows.find(x => x.id === r.id);
      r.cpGain = supModel && d ? supportGpdRowCp(charObj, supModel, d, factors) : null;
    } else {
      r.cpGain = currentCp * (Math.exp(r.gainRaw / 100) - 1);
    }
    // Rapport CP / gain de la ligne, repris par les étapes suivantes de la feuille de route
    r.cpPerGain = r.cpGain > 0 && r.gainRaw > 0 ? r.cpGain / r.gainRaw : null;
    r.roi = r.cpGain > 0 ? Math.round(r.cost / r.cpGain) : null;
  });

  // Support : même unité que le tableau GPD, gold par 0.01% de buff (et non par 1%)
  if (isSupport) {
    rows.forEach(r => {
      r.rate = Math.round(r.rate / 100);
      const m = /^([\d.]+)(k|M) \/ 1%$/.exec(r.lastRate || '');
      if (m) {
        const gold = parseFloat(m[1]) * (m[2] === 'M' ? 1e6 : 1e3) / 100;
        r.lastRate = `${gold >= 1000 ? (gold / 1000).toFixed(1) + 'k' : Math.round(gold)} / 0.01%`;
      }
    });
  }

  rows.sort((a, b) => a.rate - b.rate);
  return rows;
}

/**
 * Lecture d'un bijou à la manière de l'échelle de Loseii : roll des 2 lignes principales du rôle (« high/— »),
 * ligne plate (PA / puissance d'arme) et nombre de lignes mortes, d'après les vraies valeurs (getAccessoryLineKey).
 */
function accessoryLadderLabel(rolls, slot, isSupport, isEn) {
  const role = isSupport ? 'support' : 'dps';
  const prim = ACC_MAIN_LINES[role][accessoryKind(slot)];
  const tierOf = (key, amount) => {
    const t = ACC_LINE_TIERS[key];
    if (!t) return null;
    let best = 0;
    t.forEach((v, i) => { if (Math.abs(v - amount) < Math.abs(t[best] - amount)) best = i; });
    return ['low', 'mid', 'high'][best];
  };
  const found = {};
  const flats = [];
  let dead = 0;
  rolls.forEach(st => {
    const { key, amount } = getAccessoryLineKey(st);
    if (prim.includes(key)) found[key] = tierOf(key, amount);
    else if (key === 'apFlat' || key === 'wpFlat') flats.push(`${isEn ? (key === 'apFlat' ? 'Atk.' : 'Wpn') : (key === 'apFlat' ? 'PA' : 'arme')} ${tierOf(key, amount)}`);
    else dead++;
  });
  const parts = [prim.map(k => found[k] || '—').join('/')];
  parts.push(flats.length ? `${isEn ? "flat" : "plate"} ${flats.join(", ")}` : (isEn ? "no flat" : "sans ligne plate"));
  if (dead) parts.push(isEn ? `${dead} dead` : `${dead} morte${dead > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

function buildPieceByPieceData(charObj, isSupport, isEn) {
  if (!charObj) return [];
  const cKey = (charObj.id || charObj.name || '').toLowerCase().trim();
  const canon = (charObj.rawProfile ? charObj : null);

  let pAccItems = (charObj && charObj.accessories)
    || (charObj && charObj.rawProfile && charObj.rawProfile.accessories)
    || (charObj && charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.items && charObj.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || (charObj && charObj.loadout && charObj.loadout.items && charObj.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || (canon && canon.rawProfile && canon.rawProfile.accessories)
    || (canon && canon.rawProfile && canon.rawProfile.loadout && canon.rawProfile.loadout.items && canon.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || (canon && canon.loadout && canon.loadout.items && canon.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
    || [];

  const slotConfigs = [
    { slot: 'neck', name: isEn ? 'Necklace' : 'Collier', icon: '' },
    { slot: 'ear1', name: isEn ? 'Earring 1' : 'Boucle d\'oreille 1', icon: '' },
    { slot: 'ear2', name: isEn ? 'Earring 2' : 'Boucle d\'oreille 2', icon: '' },
    { slot: 'finger1', name: isEn ? 'Ring 1' : 'Anneau 1', icon: '' },
    { slot: 'finger2', name: isEn ? 'Ring 2' : 'Anneau 2', icon: '' }
  ];

  const result = [];
  const textItems = (charObj.items && Array.isArray(charObj.items))
    ? charObj.items
    : ((canon && Array.isArray(canon.items)) ? canon.items : []);

  slotConfigs.forEach(cfg => {
    const item = (pAccItems && pAccItems.length > 0) ? pAccItems.find(i => i.slot === cfg.slot) : null;
    let ladderStr = '—';
    const lines = [];

    if (item && item.data && Array.isArray(item.data.stats)) {
      const rolls = item.data.stats.filter(st => st.base === false);
      rolls.forEach(r => {
        const dec = decodeAccessoryStat(r, cfg.slot, isSupport, isEn);

        lines.push({
          text: dec.text,
          tier: dec.isDead ? 'dead' : dec.rollTier,
          tierLabel: dec.tierLabel
        });
      });

      if (rolls.length > 0) ladderStr = accessoryLadderLabel(rolls, cfg.slot, isSupport, isEn);
    } else {
      const pieceKeyword = cfg.slot === 'neck' ? 'collier'
        : (cfg.slot === 'ear1' ? 'boucle d\'oreille #1'
        : (cfg.slot === 'ear2' ? 'boucle d\'oreille #2'
        : (cfg.slot === 'finger1' ? 'anneau #1' : 'anneau #2')));

      const matched = textItems.filter(it => it.cat === 'Accessoires' && (it.label || '').toLowerCase().includes(pieceKeyword));
      matched.forEach(m => {
        const lbl = (m.label || '').toLowerCase();
        const val = m.val || '';
        let tier = 'mid';
        if (lbl.includes('soins') || lbl.includes('marque') || lbl.includes('brand') || (lbl.includes('allié') && !isSupport)) {
          tier = 'dead';
        } else if (val.includes('+2.00%') || val.includes('+4.00%') || val.includes('+960') || val.includes('+390')) {
          tier = 'high';
        } else if (val.includes('+1.60%') || val.includes('+0.95%')) {
          tier = 'mid';
        }
        lines.push({
          text: m.label.replace(/^.*?—\s*/, ''),
          tier: tier,
          tierLabel: tier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (tier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Dead' : 'Inutile'))
        });
      });
    }

    result.push({
      name: cfg.name,
      icon: cfg.icon,
      ladder: ladderStr,
      lines: lines
    });
  });

  // 6. Bracelet
  const brLines = [];
  let brLadder = '—';

  // Mêmes stats que la carte Bracelet et le GPD (getBraceletStats, puis l'objet bracelet du loadout)
  const brItem = ((charObj && charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.items) || []).find(i => i.slot === 'bracelet');
  const brStats = getBraceletStats(charObj) || (brItem && brItem.data && Array.isArray(brItem.data.stats) ? brItem.data.stats : null);

  if (typeof window.Bracelet !== 'undefined' && typeof window.Subrank !== 'undefined' && brStats) {
    try {
      const TRAIT_TO_APP = { crit: "crit", spec: "spec", swiftness: "swift" };
      const dec = window.Bracelet.decodeBibleBracelet(brStats);
      const traits = { crit: 0, spec: 0, swift: 0 };
      for (let i = 0; i < (dec.lines || []).length; i++) {
        const l = dec.lines[i];
        const key = TRAIT_TO_APP[l.family];
        if (l.cat === "trait" && key) {
          traits[key] = l.value;
          const tName = key === "swift" ? (isEn ? "Swiftness" : "Rapidité") : (key === "spec" ? (isEn ? "Specialization" : "Spécialisation") : (isEn ? "Crit" : "Critique"));
          brLines.push({ text: `${tName} +${l.value}`, tier: 'trait', tierLabel: 'Combat Stat' });
        } else {
          const isDead = isDeadStat(l.name || l.desc, isSupport);
          brLines.push({
            text: formatBraceletLine(l.name || l.desc, isEn),
            tier: isDead ? 'dead' : 'high',
            tierLabel: isDead ? (isEn ? 'Dead' : 'Inutile') : (isEn ? 'High Roll' : 'Roll Élevé')
          });
        }
      }
      const normProf = window.Bracelet.normalizeProfile({ role: isSupport ? 'support' : 'dps' });
      const sc = window.Subrank.braceletScore({ grade: dec.grade || 'ancient', lines: dec.lines.filter(l => l.cat !== 'trait'), traits, profile: normProf });
      if (sc && sc.band) {
        brLadder = `${sc.band.key} · ${sc.score.toFixed(1)} · +${sc.damagePct.toFixed(2)}% ${isSupport ? 'buff' : 'dmg'}`;
      }
    } catch (e) {}
  } else {
    const matched = textItems.filter(it => it.cat === 'Bracelet' || (it.label || '').toLowerCase().includes('bracelet'));
    matched.forEach(m => {
      const lbl = (m.label || '').toLowerCase();
      let tier = 'high';
      if (lbl.includes('rapidité') || lbl.includes('spécialisation') || lbl.includes('swift') || lbl.includes('spec') || lbl.includes('crit')) {
        tier = 'trait';
      } else if (lbl.includes('défense') || lbl.includes('defense') || lbl.includes('mana')) {
        tier = 'dead';
      }
      brLines.push({
        text: m.label.replace(/^.*?—\s*/, ''),
        tier: tier,
        tierLabel: tier === 'trait' ? 'Combat Stat' : (tier === 'dead' ? (isEn ? 'Dead' : 'Inutile') : (isEn ? 'High Roll' : 'Roll Élevé'))
      });
    });
  }

  result.push({
    name: isEn ? 'T4 Bracelet' : 'Bracelet T4',
    icon: '',
    ladder: brLadder,
    lines: brLines
  });

  return result;
}

function renderAdvisorView() {
  if (!dom.tabAdvisorPane) return;

  const curChar = getCurrentActiveCharacter();
  const isEn = isEnLang();
  const isSupport = (state.role === 'support');
  const cName = curChar ? curChar.name : (isEn ? 'Active Character' : 'Personnage Actif');
  if (dom.advisorCharName) dom.advisorCharName.textContent = cName;
  if (dom.advisorCharStats) {
    const ilvl = curChar && curChar.ilvl > 0 ? curChar.ilvl : state.currentIlvl;
    dom.advisorCharStats.textContent = `${ilvl.toFixed(2)} iLvl • ${formatNumber(Math.round(characterCp(curChar)))} CP`;
  }

  const masterData = buildMasterGpdData(curChar, isSupport, isEn);
  advisorState.lastGpdData = masterData;

  // Unité des ratios alignée sur le tableau GPD (appelé après applyTranslations au changement de langue)
  if (dom.gpdNextUnit) {
    dom.gpdNextUnit.textContent = isSupport
      ? (isEn ? 'per 0.01% Ally Buff' : 'par 0.01% Buff Allié')
      : (isEn ? 'per 1% Dmg' : 'par 1% Dégâts');
  }
  if (dom.gpdThRate) {
    dom.gpdThRate.textContent = isSupport
      ? (isEn ? 'Gold / 0.01%' : 'Or / 0,01 %')
      : (isEn ? 'Gold / 1%' : 'Or / 1 %');
  }
  if (dom.gpdTableTitle) {
    dom.gpdTableTitle.textContent = isEn
      ? `Ranked by efficiency (gold / ${isSupport ? '0.01% buff' : '1% damage'})`
      : `Classement par rentabilité (or / ${isSupport ? '0,01 % de buff' : '1 % de dégâts'})`;
  }

  // 1. Highlight Banner (Next Upgrade)
  if (masterData.length > 0) {
    const best = masterData[0];
    if (dom.gpdNextSystem) dom.gpdNextSystem.textContent = `${best.system} ${best.nextStep}`;
    if (dom.gpdNextContext) dom.gpdNextContext.textContent = `${isEn ? 'Current:' : 'Actuel :'} ${best.whatItReads}`;
    if (dom.gpdNextRate) dom.gpdNextRate.textContent = `${formatNumber(best.rate)} g`;
    if (dom.gpdNextGain) {
      // Support : CP estimé par le Battle Point support (supportGpdRowCp)
      const cpTxt = Number.isFinite(best.cpGain) ? ` · ${isSupport ? '~' : ''}${fmtCpGain(best.cpGain)} CP` : '';
      dom.gpdNextGain.textContent = `${formatNumber(best.cost)} g · +${best.dmgGain.toFixed(2)} %${isSupport ? ' Buff' : ''}${cpTxt}`;
    }
  }

  // 2. Objectif : feuille de route par étapes enchaînées (buildGpdRoadmap). DPS : objectif en CP ;
  // support : en % de buff allié, CP estimé à côté (supportGpdRowCp).
  // Boutons d'objectif selon le rôle ; changement de rôle = retour à « Tous » (les unités diffèrent)
  const goalRole = isSupport ? 'support' : 'dps';
  if (advisorState.goalRole !== goalRole) {
    advisorState.goalRole = goalRole;
    advisorState.selectedGoal = 'all';
    const fr = !isEn;
    const goals = isSupport ? [0.5, 1, 2, 3] : [100, 200, 300, 500];
    const pills = document.querySelectorAll('#gpdGoalButtons .btn-goal-pill:not([data-goal="all"])');
    pills.forEach((b, i) => {
      if (goals[i] === undefined) return;
      b.setAttribute('data-goal', String(goals[i]));
      b.textContent = isSupport ? `+${fr ? String(goals[i]).replace('.', ',') : goals[i]} % Buff` : `+${goals[i]} CP`;
    });
    document.querySelectorAll('#gpdGoalButtons .btn-goal-pill').forEach(b => b.classList.toggle('active', b.getAttribute('data-goal') === 'all'));
    if (dom.gpdCustomCpInput) {
      dom.gpdCustomCpInput.value = '';
      dom.gpdCustomCpInput.placeholder = isSupport ? (fr ? '% Buff +' : 'Buff % +') : 'CP +';
      dom.gpdCustomCpInput.step = isSupport ? '0.1' : '50';
      dom.gpdCustomCpInput.min = isSupport ? '0.1' : '10';
    }
  }
  const goal = advisorState.selectedGoal || 'all';
  let chosenIds = new Set();
  advisorState.planItems = [];
  let tableRows = masterData;

  if (goal !== 'all') {
    const targetGoal = parseFloat(goal) || (isSupport ? 1 : 100);
    const road = buildGpdRoadmap(curChar, isSupport, isEn, masterData, targetGoal);
    advisorState.planItems = road.plan;
    road.plan.forEach(r => chosenIds.add(r.id));
    tableRows = road.plan;
    const fmtBuff = v => (isEn ? v.toFixed(2) : v.toFixed(2).replace('.', ','));
    const gainTxt = isSupport
      ? `+${fmtBuff(road.cum)} % Buff${road.cumCp > 0 ? ` (~${fmtCpGain(road.cumCp)} CP)` : ''}`
      : `${fmtCpGain(road.cum)} CP`;
    if (dom.planSummaryGold) dom.planSummaryGold.textContent = `${isEn ? 'Cost:' : 'Coût :'} ${formatNumber(Math.round(road.gold))} g`;
    if (dom.planSummaryCp) {
      dom.planSummaryCp.textContent = `${isEn ? 'Gain:' : 'Gain :'} ${gainTxt}` +
        (road.reached ? '' : (isEn ? ' (goal out of reach with these steps)' : ' (objectif hors de portée avec ces étapes)'));
    }
    if (dom.planSummaryRoi) {
      const per = road.cum > 0 ? Math.round(road.gold / (isSupport ? road.cum * 100 : road.cum)) : 0;
      dom.planSummaryRoi.textContent = `${formatNumber(per)} g / ${isSupport ? (isEnLang() ? '0.01%' : '0,01 %') : 'CP'}`;
    }
    if (dom.gpdPlanSummary) dom.gpdPlanSummary.style.display = 'flex';
  } else {
    if (dom.gpdPlanSummary) dom.gpdPlanSummary.style.display = 'none';
  }

  // 3. Render Master Table (Ledger : tableau dense, barre log du ratio, rang par luminosité)
  if (dom.gpdMasterTableBody) {
    const rates = tableRows.map(r => r.rate).filter(r => r > 0);
    const logLo = Math.log(Math.min(...rates));
    const logHi = Math.log(Math.max(...rates));
    const barPct = (rate) => (logHi > logLo ? 6 + 94 * (Math.log(rate) - logLo) / (logHi - logLo) : 50).toFixed(1);
    let rowsHtml = '';
    tableRows.forEach((row, idx) => {
      const isChosen = chosenIds.has(row.id);
      const planIdx = advisorState.planItems.findIndex(x => x.id === row.id);
      const trClass = isChosen ? 'gpd-row plan-selected' : 'gpd-row';
      // Le rang est toujours évalué sur l'or par 1 % (le ratio support est affiché par 0,01 %)
      const tier = getTierFromRatio(isSupport ? row.rate * 100 : row.rate);

      let statusBadge = '';
      if (goal !== 'all') {
        statusBadge = isChosen
          ? `<span class="gpd-status-badge in-plan">${isEn ? `Plan #${planIdx + 1}` : `Plan n° ${planIdx + 1}`}</span>`
          : '';
      } else if (idx === 0) {
        statusBadge = `<span class="gpd-status-badge best-deal">${isEn ? 'Best ratio' : 'Meilleur ratio'}</span>`;
      }

      rowsHtml += `
          <tr class="${trClass}">
            <td class="col-rank">${idx + 1}</td>
            <td>
              <div class="gpd-system-cell">
                <span class="gpd-system-title">${row.system}</span>
                <span class="gpd-read-text">${row.whatItReads}</span>
              </div>
            </td>
            <td class="gpd-step-cell"><span class="gpd-next-step-name">${row.nextStep}</span>${row.stepDetail ? `<span class="gpd-step-detail">${row.stepDetail}</span>` : ''}</td>
            <td class="col-num">${formatNumber(row.cost)}</td>
            <td class="col-num gpd-gain-val">+${row.dmgGain.toFixed(2)} %</td>
            <td class="col-num col-rate">
              <div class="gpd-rate-cell">
                <span class="gpd-rate-bar"><span style="width: ${barPct(row.rate)}%"></span></span>
                <span class="gpd-rate-val">${formatNumber(row.rate)}</span>
              </div>
            </td>
            <td class="col-num gpd-cp-val"${isSupport && Number.isFinite(row.cpGain) ? ` title="${isEn ? 'Estimate from the support Battle Point' : 'Estimation par le Battle Point support'}"` : ''}>${Number.isFinite(row.cpGain) ? `${isSupport ? '~' : ''}${fmtCpGain(row.cpGain)}` : '—'}</td>
            <td class="col-num"><span class="gpd-tier tier-${tier}">${GPD_TIER_LABELS[tier].replace('Rang ', '')}</span></td>
            <td>${statusBadge}</td>
          </tr>
        `;
    });
    dom.gpdMasterTableBody.innerHTML = rowsHtml;
  }

  // 4. Render Piece by Piece
  if (dom.gpdPiecesTableBody) {
    const pieceData = buildPieceByPieceData(curChar, isSupport, isEn);
    let pRowsHtml = '';
    pieceData.forEach(p => {
      const linesTags = p.lines.map(l => `<span class="piece-line-tag ${l.tier}">${l.text}</span>`).join(' ') || `<span class="gpd-step-muted">${isEn ? 'Standard rolls' : 'Rolls standards'}</span>`;
      pRowsHtml += `
          <tr>
            <td>
              <div class="piece-name-cell">
                <span>${p.icon}</span>
                <span>${p.name}</span>
              </div>
            </td>
            <td><span class="piece-ladder-badge">${p.ladder}</span></td>
            <td><div class="piece-lines-container">${linesTags}</div></td>
          </tr>
        `;
    });
    dom.gpdPiecesTableBody.innerHTML = pRowsHtml;
  }
}

function applyGpdPlan() {
  if (!advisorState.planItems || advisorState.planItems.length === 0) return;
  let appliedCount = 0;

  advisorState.planItems.forEach(item => {
    if (item.applyType === 'weapon' && item.targetVal) {
      state.gear.weapon = item.targetVal;
      appliedCount++;
    } else if (item.applyType === 'armors' && item.targetVal) {
      // Étape k des armures = +k sur chaque pièce réelle (plafond +25) ; sans pièces lisibles, niveau cible commun
      const own = (getCurrentActiveCharacter() || {}).gear;
      const k = item.armorStep || 1;
      ['head', 'shoulder', 'chest', 'pants', 'gloves'].forEach(p => {
        const target = own && own[p] >= 0 ? Math.min(25, own[p] + k) : item.targetVal;
        state.gear[p] = Math.max(state.gear[p] || 0, target);
      });
      appliedCount++;
    } else if (item.applyType === 'gems') {
      if (dom.gemSelect) dom.gemSelect.value = 'full9';
      state.gemBonus = state.role === 'support' ? 240 : 420;
      appliedCount++;
    }
  });

  dom.tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-honing'));
  dom.tabPanes.forEach(p => p.classList.toggle('active', p.id === 'tab-honing'));

  updateHoningView();
  updateOptimizationView();
  updatePredictorView();
  updateActiveCharacterCard(activeCharacterId);

  showToast(isEnLang() ? 'Plan applied to Simulator.' : 'Plan appliqué au Simulateur.');
}

function initAdvisorEvents() {
  // Goal Pills
  const goalBtns = document.querySelectorAll('#gpdGoalButtons .btn-goal-pill');
  goalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      goalBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const goal = btn.getAttribute('data-goal');
      advisorState.selectedGoal = goal;
      if (dom.gpdCustomCpInput) dom.gpdCustomCpInput.value = '';
      renderAdvisorView();
    });
  });

  if (dom.gpdCustomCpInput) {
    dom.gpdCustomCpInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (val && val > 0) {
        goalBtns.forEach(b => b.classList.remove('active'));
        advisorState.selectedGoal = val;
        renderAdvisorView();
      } else {
        advisorState.selectedGoal = 'all';
        const allBtn = document.querySelector('#gpdGoalButtons .btn-goal-pill[data-goal="all"]');
        if (allBtn) allBtn.classList.add('active');
        renderAdvisorView();
      }
    });
  }

  if (dom.btnApplyGpdPlan) {
    dom.btnApplyGpdPlan.addEventListener('click', () => applyGpdPlan());
  }
}
