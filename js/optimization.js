// Onglet Optimisation T4 : simulateur bijoux, gemmes et bracelet.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function getCharacterClassKey(curChar) {
  if (!curChar) return 'shadowhunter';
  const raw = String(curChar.className || curChar.classId || curChar.class || curChar.name || '').toLowerCase().trim();
  if (raw.includes('shadowhunter') || raw.includes('demonic')) return 'shadowhunter';
  if (raw.includes('souleater')) return 'souleater';
  if (raw.includes('slayer')) return 'slayer';
  if (raw.includes('breaker')) return 'breaker';
  if (raw.includes('destroyer')) return 'destroyer';
  if (raw.includes('reaper')) return 'reaper';
  if (raw.includes('bard')) return 'bard';
  if (raw.includes('artist') || raw.includes('yinyangshi')) return 'artist';
  if (raw.includes('valkyrie') || raw.includes('holyknight_female') || raw.includes('holyknightfemale')) return 'valkyrie';
  if (raw.includes('paladin') || raw.includes('holyknight')) return 'paladin';
  if (raw.includes('dimension') || raw.includes('knäy') || raw.includes('knay')) return 'dimensionalist';
  return 'shadowhunter';
}

// --- ONGLET OPTIMISATION : SIMULATEUR BIJOUX, GEMMES & BRACELET (personnage importé) ---
// Mêmes modèles que le GPD : lignes de bijoux par les pentes Arsonistic (computeAccessoryLinesBonus), prix des gammes
// ACC_PACKAGES ; gemmes réelles (dpsGemSetGain / supportGemSetGain, GEM_UPGRADE_COST) ; bracelet noté par Subrank et
// chiffré par braceletGpdStep. Rien n'est simulé sans personnage importé.

const ACC_LINE_NAMES = {
  addDmg: ['Dégâts additionnels', 'Additional Damage'], outDmg: ['Dégâts infligés', 'Outgoing Damage'],
  apPct: ['PA %', 'Attack Power %'], wpPct: ["Puissance d'arme %", 'Weapon Power %'],
  critPct: ['Taux critique', 'Crit Rate'], cdmgPct: ['Dégâts critiques', 'Crit Damage'],
  brand: ['Puissance de marque', 'Brand Power'], identity: ["Gain de jauge d'identité", 'Identity Gain'],
  allyAp: ['Amplification PA alliée', 'Ally Attack Enh.'], allyDmg: ['Dégâts alliés', 'Ally Damage Enh.'],
  wpFlat: ["Puissance d'arme plate", 'Flat Weapon Power']
};
const ACC_TIER_NAMES = ['Low', 'Mid', 'High'];
// Noms courts des lignes (tableaux du GPD et du Smart Advisor, sans défilement horizontal)
const ACC_LINE_SHORT = {
  addDmg: ['Dgt add.', 'Add. Dmg'], outDmg: ['Dgt infligés', 'Dmg to enemies'],
  apPct: ['PA %', 'AP %'], wpPct: ['PdA %', 'WP %'],
  critPct: ['Taux crit.', 'Crit Rate'], cdmgPct: ['Dgt crit.', 'Crit Dmg'],
  brand: ['Marque', 'Brand'], identity: ['Identité', 'Identity'],
  allyAp: ['Ampli. PA alliée', 'Ally AP Enh.'], allyDmg: ['Dgt alliés', 'Ally Dmg Enh.'],
  wpFlat: ['PdA plate', 'Flat WP']
};

// Cibles choisies : { [slot]: [cible ligne 1, cible ligne 2] } (-1 = actuel, 0/1/2 = Low/Mid/High) ; gemmes : niveau minimal
const optSim = { charKey: null, acc: {}, gemMin: 0 };

// Tier (0/1/2) le plus proche d'une valeur de ligne, null si la stat n'a pas d'échelle
function accTierOf(key, amount) {
  const t = ACC_LINE_TIERS[key];
  if (!t) return null;
  let best = 0;
  t.forEach((v, i) => { if (Math.abs(v - amount) < Math.abs(t[best] - amount)) best = i; });
  return best;
}

// Lignes d'un bijou acheté (même hypothèse que le GPD, findBestAccessoryUpgrade) : les 2 lignes principales du rôle,
// à leur cible ou à leur tier actuel, 3e ligne morte
function simulatedSlotLines(lines, mains, targets) {
  const out = [];
  mains.forEach((k, i) => {
    if (targets[i] >= 0) out.push({ key: k, amount: ACC_LINE_TIERS[k][targets[i]] });
    else out.push(...lines.filter(l => l.key === k));
  });
  return out;
}

// Prix d'une gamme (ACC_PACKAGES) pour ces tiers, quel que soit l'ordre ; null si la gamme n'a pas de prix
function accPackagePrice(kind, tiers) {
  const pkg = ACC_PACKAGES.find(p => (p.tiers[0] === tiers[0] && p.tiers[1] === tiers[1]) || (p.tiers[0] === tiers[1] && p.tiers[1] === tiers[0]));
  return pkg && pkg.price[kind] > 0 ? pkg.price[kind] : null;
}

/**
 * Résultat de la simulation sur le personnage : gain des bijoux et des gemmes (% DPS ou % de buff, 100 × ln), or
 * (gammes de bijoux achetées, montées de gemmes), CP (support : Battle Point, supportGpdCpModel). null sans personnage importé.
 */
function computeOptimizationSim(charObj, isSupport) {
  if (!charObj || !charObj.rawProfile) return null;
  const role = isSupport ? 'support' : 'dps';
  const accEval = evaluateCharacterAccessories(charObj, isSupport, false);
  const slotLines = accEval && accEval.slotLines;
  const slots = [];
  let accGain = 0, accGold = 0, accUnpriced = false;
  const supCp = { acc: 0, gems: 0 };
  if (slotLines) {
    const curAll = ACC_SLOTS.flatMap(s => slotLines[s] || []);
    const curPct = computeAccessoryLinesBonus(curAll, isSupport);
    const nextAll = [];
    ACC_SLOTS.forEach(slot => {
      const lines = slotLines[slot];
      if (!lines) return;
      const kind = accessoryKind(slot);
      const mains = ACC_MAIN_LINES[role][kind];
      const cur = mains.map(k => {
        const l = lines.find(x => x.key === k);
        return l ? accTierOf(k, l.amount) : null;
      });
      const targets = (optSim.acc[slot] || [-1, -1]).slice(0, 2);
      const changed = targets.some((t, i) => t >= 0 && t !== cur[i]);
      nextAll.push(...(changed ? simulatedSlotLines(lines, mains, targets) : lines));
      let price = null;
      if (changed) {
        price = accPackagePrice(kind, targets.map((t, i) => (t >= 0 ? t : cur[i])));
        if (price === null) accUnpriced = true; else accGold += price;
      }
      const others = lines.filter(l => !mains.includes(l.key) && ACC_LINE_NAMES[l.key]);
      slots.push({ slot, kind, mains, cur, targets, changed, price, others });
    });
    const nextPct = computeAccessoryLinesBonus(nextAll, isSupport);
    accGain = 100 * Math.log((1 + nextPct / 100) / (1 + curPct / 100));
    // Support : CP par les parties bijoux du Battle Point, au prorata du buff (supportGpdCpModel)
    if (isSupport && nextPct !== curPct) {
      const model = supportGpdCpModel(charObj);
      supCp.acc = model ? model.linesCp([15, 17], curPct, nextPct - curPct) : null;
    }
  }

  const gemLevels = isSupport ? realGemLevels(charObj) : (realGems(charObj) || []).map(g => g.level);
  let gemGain = 0, gemGold = 0, gemCount = 0;
  if (gemLevels && gemLevels.length && optSim.gemMin > 0) {
    const to = gemLevels.map(l => Math.max(l, optSim.gemMin));
    const g = isSupport ? supportGemSetGain(charObj, to) : dpsGemSetGain(charObj, to);
    if (Number.isFinite(g)) gemGain = g;
    if (isSupport) supCp.gems = supportGemCpDelta(charObj, gemLevels, to);
    gemLevels.forEach((l, i) => {
      if (to[i] > l) gemCount++;
      for (let k = l; k < to[i]; k++) gemGold += GEM_UPGRADE_COST[k] || 0;
    });
  }

  const total = accGain + gemGain;
  const cp = raidCombatPowerOf(charObj);
  return {
    slots, accGain, accGold, accUnpriced, hasAcc: !!slotLines,
    gemLevels: gemLevels && gemLevels.length ? gemLevels : null, gemGain, gemGold, gemCount,
    total, gold: accGold + gemGold,
    cpGain: isSupport
      ? (Number.isFinite(supCp.acc) && Number.isFinite(supCp.gems) ? supCp.acc + supCp.gems : null)
      : (cp > 0 ? cp * (Math.exp(total / 100) - 1) : null),
    bracelet: braceletBandOf(charObj, isSupport),
    braceletStep: braceletGpdStep(charObj, isSupport)
  };
}

function renderOptimizationSimInputs(charObj, sim, isSupport, isEn) {
  const body = document.getElementById('optSimBody');
  if (!body) return;
  if (!sim) {
    body.innerHTML = `<p class="opt-sim-empty">${isEn
        ? 'Import a character from lostark.bible: the simulator starts from its real accessories, gems and bracelet.'
        : 'Importe un personnage depuis lostark.bible : le simulateur part de ses vrais bijoux, gemmes et bracelet.'}</p>`;
    return;
  }
  const L = k => escapeHtml((ACC_LINE_NAMES[k] || [k, k])[isEn ? 1 : 0]);
  const slotName = s => ({ neck: isEn ? 'Necklace' : 'Collier', ear1: isEn ? 'Earring 1' : "Boucle d'oreille 1", ear2: isEn ? 'Earring 2' : "Boucle d'oreille 2",
    finger1: isEn ? 'Ring 1' : 'Anneau 1', finger2: isEn ? 'Ring 2' : 'Anneau 2' })[s];
  const tierSel = (slot, i, cur, val) => {
    const opts = [`<option value="-1"${val < 0 ? ' selected' : ''}>${isEn ? 'Current' : 'Actuel'} (${cur === null ? (isEn ? 'none' : 'absente') : ACC_TIER_NAMES[cur]})</option>`]
      .concat(ACC_TIER_NAMES.map((n, t) => `<option value="${t}"${val === t ? ' selected' : ''}>${n}</option>`));
    return `<select class="clean-select compact-select" data-opt-slot="${slot}" data-opt-line="${i}">${opts.join('')}</select>`;
  };

  let html = `<div class="opt-section-title"><span>${isEn ? 'Accessories: main lines of your role' : 'Bijoux : lignes principales de ton rôle'}</span></div>`;
  if (!sim.hasAcc) {
    html += `<p class="opt-sim-empty">${isEn ? 'Accessory lines not readable on this profile.' : 'Lignes des bijoux illisibles sur ce profil.'}</p>`;
  } else {
    html += `<div class="opt-sim-table">`;
    sim.slots.forEach(s => {
      const extra = s.others.length ? `<span class="opt-sim-sub">${s.others.map(l => `${L(l.key)} ${ACC_TIER_NAMES[accTierOf(l.key, l.amount)] || ''}`).join(' · ')}</span>` : '';
      html += `<div class="opt-sim-row">
          <div class="opt-sim-slot"><strong>${slotName(s.slot)}</strong>${extra}</div>
          ${s.mains.map((k, i) => `<label class="opt-sim-line"><span>${L(k)}</span>${tierSel(s.slot, i, s.cur[i], s.targets[i])}</label>`).join('')}
        </div>`;
    });
    html += `</div>`;
  }

  html += `<div class="opt-section-title"><span>${isEn ? 'Skill gems' : 'Gemmes de compétence'}</span></div>`;
  if (!sim.gemLevels) {
    html += `<p class="opt-sim-empty">${isEn ? 'No T4 gem readable on this profile.' : 'Aucune gemme T4 lisible sur ce profil.'}</p>`;
  } else {
    const counts = {};
    sim.gemLevels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
    const summary = Object.keys(counts).sort((a, b) => b - a).map(l => `${counts[l]}× ${isEn ? 'Lv.' : 'Niv.'} ${l}`).join(', ');
    const opts = [`<option value="0"${optSim.gemMin === 0 ? ' selected' : ''}>${isEn ? 'Current' : 'Actuel'}</option>`]
      .concat([7, 8, 9, 10].map(l => `<option value="${l}"${optSim.gemMin === l ? ' selected' : ''}>${isEn ? `All gems at least Lv. ${l}` : `Toutes au moins niv. ${l}`}</option>`));
    html += `<div class="opt-sim-row"><div class="opt-sim-slot"><strong>${sim.gemLevels.length} ${isEn ? 'gems' : 'gemmes'}</strong><span class="opt-sim-sub">${summary}</span></div>
        <label class="opt-sim-line"><span>${isEn ? 'Target' : 'Cible'}</span><select class="clean-select compact-select" id="optSimGemMin">${opts.join('')}</select></label></div>`;
  }

  html += `<div class="opt-section-title"><span>${isEn ? 'Bracelet' : 'Bracelet'}</span></div>`;
  const br = sim.bracelet;
  const unit = isSupport ? (isEn ? 'buff' : 'de buff') : (isEn ? 'damage' : 'de dégâts');
  if (!br) {
    html += `<p class="opt-sim-empty">${isEn ? 'Bracelet not readable on this profile.' : 'Bracelet illisible sur ce profil.'}</p>`;
  } else {
    const st = sim.braceletStep;
    html += `<p class="opt-sim-note">${isEn ? 'Grade' : 'Note'} <strong>${escapeHtml(String(br.band))}</strong>${Number.isFinite(br.total) ? ` · +${br.total.toFixed(2)} % ${unit}` : ''}.
        ${st ? (isEn
          ? `Next grade ${escapeHtml(String(st.step.to))}: a new campaign from scratch, ${formatNumber(Math.round(st.gold))} gold for +${st.gain.toFixed(2)} %.`
          : `Note suivante ${escapeHtml(String(st.step.to))} : campagne neuve depuis zéro, ${formatNumber(Math.round(st.gold))} or pour +${st.gain.toFixed(2)} %.`) : ''}
        ${isEn ? 'A bracelet is not upgraded in place: it is not part of the simulation.' : "Un bracelet ne s'améliore pas sur place : il n'entre pas dans la simulation."}</p>`;
  }
  body.innerHTML = html;

  body.querySelectorAll('select[data-opt-slot]').forEach(el => el.addEventListener('change', e => {
    const slot = e.target.getAttribute('data-opt-slot');
    const i = parseInt(e.target.getAttribute('data-opt-line'), 10);
    const t = (optSim.acc[slot] || [-1, -1]).slice();
    t[i] = parseInt(e.target.value, 10);
    optSim.acc[slot] = t;
    updateOptimizationView();
  }));
  const gemSel = document.getElementById('optSimGemMin');
  if (gemSel) gemSel.addEventListener('change', e => { optSim.gemMin = parseInt(e.target.value, 10) || 0; updateOptimizationView(); });
}

/**
 * Met à jour l'onglet Optimisation : simulateur sur le personnage importé, tableau GPD.
 */
function updateOptimizationView() {
  const isSupport = (state.role || 'support') === 'support';
  const isEn = isEnLang();
  const charObj = getCurrentActiveCharacter();
  const key = charObj ? `${charObj.id || charObj.name}|${isSupport}` : null;
  if (key !== optSim.charKey) { optSim.charKey = key; optSim.acc = {}; optSim.gemMin = 0; }
  const sim = computeOptimizationSim(charObj, isSupport);
  renderOptimizationSimInputs(charObj, sim, isSupport, isEn);

  const pct = v => (Math.abs(v) < 0.005 ? '0.00 %' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} %`);
  if (dom.optBadge) {
    dom.optBadge.textContent = isSupport ? (isEn ? 'Support: % ally buff' : 'Support : % de buff allié') : (isEn ? 'DPS: % damage' : 'DPS : % de dégâts');
    dom.optBadge.style.color = isSupport ? 'var(--support-color)' : 'var(--dps-color)';
  }
  if (dom.optResultTypeLabel) {
    dom.optResultTypeLabel.textContent = isSupport
      ? (isEn ? 'Simulated ally buff gain:' : 'Gain de buff allié simulé :')
      : (isEn ? 'Simulated personal damage gain:' : 'Gain de dégâts personnels simulé :');
  }
  if (dom.optDpsGainDisplay) dom.optDpsGainDisplay.textContent = sim ? pct(sim.total) : '—';
  if (dom.optCpGainDisplay) {
    dom.optCpGainDisplay.textContent = !sim ? ''
      : (sim.cpGain !== null ? `${isSupport ? '~' : ''}${sim.cpGain >= 0 ? '+' : '−'}${formatNumber(Math.round(Math.abs(sim.cpGain)))} CP`
        : (isEn ? 'CP: Battle Point unreadable on this profile.' : 'CP : Battle Point illisible sur ce profil.'));
  }
  if (dom.optBreakdownAcc) dom.optBreakdownAcc.textContent = sim && sim.hasAcc ? pct(sim.accGain) : '—';
  if (dom.optBreakdownGems) dom.optBreakdownGems.textContent = sim && sim.gemLevels ? pct(sim.gemGain) : '—';
  const goldEl = document.getElementById('optSimGold');
  if (goldEl) goldEl.textContent = sim && sim.gold > 0 ? `${formatNumber(Math.round(sim.gold))} g` : '—';

  if (dom.optAdviceText) {
    let txt;
    if (!sim) {
      txt = isEn ? 'No simulation without an imported character.' : 'Aucune simulation sans personnage importé.';
    } else if (Math.abs(sim.total) < 1e-4) {
      txt = isEn
        ? 'Choose a target tier for an accessory line or a gem level: gain and gold are computed on your character with the GPD models.'
        : "Choisis un tier cible pour une ligne de bijou ou un niveau de gemmes : gain et or sont calculés sur ton personnage avec les modèles du GPD.";
    } else {
      const per = isSupport ? 0.01 : 1;
      const ratio = sim.total > 0 && sim.gold > 0 && !sim.accUnpriced ? sim.gold * per / sim.total : null;
      const perLbl = isSupport ? (isEn ? '0.01% buff' : '0,01 % de buff') : (isEn ? '1% damage' : '1 % de dégâts');
      txt = (ratio !== null
        ? (isEn ? `About <strong>${formatNumber(Math.round(ratio))} gold per ${perLbl}</strong>, to compare with the GPD table below.`
          : `Environ <strong>${formatNumber(Math.round(ratio))} or par ${perLbl}</strong>, à comparer au tableau GPD ci-dessous.`)
        : (isEn ? 'No gold ratio for this simulation.' : "Pas de ratio en or pour cette simulation."))
        + (sim.accUnpriced ? (isEn ? ' One accessory combination has no market price (only High/High, High/Mid, High/Low and Mid/Mid are priced).'
          : ' Une combinaison de bijou n\'a pas de prix de marché (seules High/High, High/Mid, High/Low et Mid/Mid sont chiffrées).') : '')
        + (isEn ? ' Accessories bought at the auction house (EUC prices), dead 3rd line; gems at the GPD upgrade cost.'
          : " Bijoux achetés à l'hôtel des ventes (prix EUC), 3e ligne morte ; gemmes au coût de montée du GPD.");
    }
    dom.optAdviceText.innerHTML = txt;
  }

  renderEfficiencyTable();
}
