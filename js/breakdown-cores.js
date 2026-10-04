// Détails du Benchmark : gravures, cœurs de la Grille d'Ark, réconciliation du CP.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function buildEngravingsBreakdownHtml(player, target, cpImpact, isEn) {
  const pEngs = extractCharacterEngravings(player, isEn);
  const tEngs = extractCharacterEngravings(target, isEn);

  const cpPerPct = (player.cp && player.cp > 1000) ? (player.cp / 100) : 55.87;

  const pTotalPct = pEngs.reduce((s, e) => s + e.valuePct, 0);
  const tTotalPct = tEngs.reduce((s, e) => s + e.valuePct, 0);
  const deltaTotal = Number((tTotalPct - pTotalPct).toFixed(2));

  const isEngMatch = (a, b) => {
    if (!a || !b) return false;
    if (a.id && b.id && (a.id === b.id || String(a.id) === String(b.id))) return true;
    const nA = (a.name || a.rawName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nB = (b.name || b.rawName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return nA && nB && (nA.includes(nB) || nB.includes(nA));
  };

  // Badges Joueur
  const pEngsHtml = pEngs.map(e => `
      <div class="acc-line-badge high">
        <span><strong>${escapeHtml(e.name)}</strong> (+${e.valuePct.toFixed(2)}%)</span>
        ${e.stonePoints > 0 ? `<span class="acc-line-tier-tag" style="background:rgba(232, 230, 220,0.2); color:#E0A43A;">${isEn ? 'Stone' : 'Pierre'} +${e.stonePoints}</span>` : ''}
      </div>
    `).join('');

  // Badges Cible
  const tEngsHtml = tEngs.map(e => {
    const pMatch = pEngs.find(p => isEngMatch(p, e));
    const isDifferentEng = !pMatch;
    return `
        <div class="acc-line-badge high">
          <span><strong>${escapeHtml(e.name)}</strong> (+${e.valuePct.toFixed(2)}%)</span>
          ${isDifferentEng ? `<span class="line-cp-pill" style="background:rgba(234,179,8,0.2); border-color:rgba(234,179,8,0.4); color:#E0A43A;">${isEn ? 'Diff Engraving' : 'Gravure Différente'}</span>` : ''}
          ${e.stonePoints > 0 ? `<span class="acc-line-tier-tag" style="background:rgba(140, 192, 132,0.2); color:#8CC084;">${isEn ? 'Stone' : 'Pierre'} +${e.stonePoints}</span>` : ''}
        </div>
      `;
  }).join('');

  // Diff items
  const pOnly = pEngs.filter(p => !tEngs.some(t => isEngMatch(p, t)));
  const tOnly = tEngs.filter(t => !pEngs.some(p => isEngMatch(p, t)));

  let diffRows = '';

  // Gravures différentes (swapped engravings)
  if (pOnly.length > 0 && tOnly.length > 0) {
    for (let i = 0; i < Math.max(pOnly.length, tOnly.length); i++) {
      const pO = pOnly[i];
      const tO = tOnly[i];
      const pVal = pO ? pO.valuePct : 0;
      const tVal = tO ? tO.valuePct : 0;
      const d = Number((tVal - pVal).toFixed(2));
      const gain = Math.round(d * cpPerPct);
      const gainStr = gain > 0 ? `+${gain} CP` : (gain < 0 ? `${gain} CP` : '= 0 CP');
      const pName = pO ? `${pO.name} (+${pVal.toFixed(2)}%)` : '—';
      const tName = tO ? `${tO.name} (+${tVal.toFixed(2)}%)` : '—';

      diffRows += `
          <tr>
            <td>
              <strong>${isEn ? 'Engraving Choice' : 'Choix de Gravure'}</strong>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                ${isEn ? 'Alternative T4 Relic Engraving' : 'Gravure Relique T4 différente'}
              </div>
            </td>
            <td>${escapeHtml(pName)}</td>
            <td><strong style="color:#E0A43A;">${escapeHtml(tName)}</strong></td>
            <td class="col-cp-gain" style="color:#8CC084;"><strong>${gainStr}</strong></td>
          </tr>
        `;
    }
  }

  // Gravures communes avec répartition de pierre ou palier différent
  const shared = pEngs.filter(p => tEngs.some(t => isEngMatch(p, t)));
  shared.forEach(p => {
    const t = tEngs.find(x => isEngMatch(x, p));
    if (!t) return;
    const d = Number((t.valuePct - p.valuePct).toFixed(2));
    if (Math.abs(d) > 0.01) {
      const gain = Math.round(d * cpPerPct);
      const gainStr = gain > 0 ? `+${gain} CP` : `${gain} CP`;
      const pStone = p.stonePoints > 0 ? ` (${isEn ? 'Stone' : 'Pierre'} +${p.stonePoints})` : '';
      const tStone = t.stonePoints > 0 ? ` (${isEn ? 'Stone' : 'Pierre'} +${t.stonePoints})` : '';

      diffRows += `
          <tr>
            <td>
              <strong>${escapeHtml(t.name)}</strong>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                ${isEn ? 'Stone nodes & base relic roll' : 'Nœuds de pierre & palier relique'}
              </div>
            </td>
            <td>+${p.valuePct.toFixed(2)}%${pStone}</td>
            <td>+${t.valuePct.toFixed(2)}%${tStone}</td>
            <td class="col-cp-gain" style="color:${gain > 0 ? '#8CC084' : '#9CB4C6'};"><strong>${gainStr}</strong></td>
          </tr>
        `;
    }
  });

  const explanationText = isEn
    ? `<strong>Combat Power Impact (+${cpImpact} CP):</strong> In Lost Ark, engravings are strictly multiplicative. Each 1% engraving or ability stone gain contributes ~${cpPerPct.toFixed(1)} CP to your character. Aligning relic node breakpoints and high stone node rolls (+3/+4) bridges this gap.`
    : `<strong>Impact sur le Combat Power (+${cpImpact} CP) :</strong> Dans Lost Ark, les gravures sont purement multiplicatives. Chaque 1% de gain de gravure ou de pierre apporte ~${cpPerPct.toFixed(1)} CP à votre profil. Aligner les paliers reliques et les nœuds de pierre (+3/+4) permet de rattraper cet écart.`;

  return `
      <div class="acc-breakdown-panel engravings-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'T4 Relic Engravings & Ability Stone Breakdown' : 'Détail des Gravures Reliques T4 & Pierre de Naissance'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(232, 230, 220, 0.15); border-color: rgba(232, 230, 220, 0.35); color: #E0A43A;">
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaTotal.toFixed(2)}% ${isEn ? 'gap' : 'd\'écart'})` : (isEn ? 'Optimized parity' : 'Parité optimale')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn
              ? 'Comparison of your 5 T4 relic engraving choices, ability stone nodes, and their mathematical contribution to Combat Power.'
              : 'Comparaison des 5 gravures reliques T4, des nœuds de pierre de naissance et de leur impact mathématique sur le Combat Power.'}
          </div>
        </div>

        <div class="astrogems-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card astrogems-card player-card ${cpImpact > 0 ? 'has-gap' : 'parity'}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(232, 230, 220, 0.2); color: #E0A43A; margin-left: 6px;">
                  5 T4 Relic
                </span>
              </div>
              <span class="acc-piece-gain-pill neutral">
                +${pTotalPct.toFixed(2)}% Total
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-side-section">
                <span class="acc-side-lbl player">${isEn ? 'Equipped Engravings & Stone' : 'Gravures Actives & Pierre'}</span>
                ${pEngsHtml}
              </div>
            </div>
          </div>

          <!-- Carte Cible Référence -->
          <div class="acc-piece-card astrogems-card target-card parity">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence BiS'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(140, 192, 132, 0.2); color: #8CC084; margin-left: 6px;">
                  ${isEn ? 'Target Reference' : 'Référence Cible'}
                </span>
              </div>
              <span class="acc-piece-gain-pill ${cpImpact > 0 ? 'gap' : 'neutral'}">
                ${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-side-section">
                <span class="acc-side-lbl target">${isEn ? 'Target Engravings & Stone' : 'Gravures Cible & Pierre'}</span>
                ${tEngsHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé des Gravures -->
        <div class="astrogems-compare-table-wrap">
          <div class="astrogems-compare-table-title">
            <span></span>
            <strong>${isEn ? 'Engraving & Stone Delta Breakdown' : 'Décomposition Détaillée de l\'Écart de Gravures & Pierre'}</strong>
          </div>
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'System / Engraving' : 'Système / Gravure'}</th>
                <th>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</th>
                <th>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence'))}</th>
                <th style="text-align:right;">${isEn ? 'CP Delta' : 'Gain en CP'}</th>
              </tr>
            </thead>
            <tbody>
              ${diffRows || `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">${isEn ? 'Identical engravings and stone.' : 'Gravures et pierre identiques.'}</td></tr>`}
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Total Engravings & Stone Gap' : 'Écart Total Gravures & Pierre'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="astrogems-verdict-banner" style="border-left-color:#E0A43A;">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            ${explanationText}
          </div>
        </div>
      </div>
    `;
}

function extractArkGridCoreDetail(char, coreGroup, isEn) {
  if (!char) return null;
  const normGroup = (coreGroup || 'sun').toLowerCase().replace('arkgrid', '');
  const prefixOrder = normGroup === 'sun' ? '67300' : (normGroup === 'moon' ? '67301' : '67302');
  const prefixChaos = normGroup === 'sun' ? '67310' : (normGroup === 'moon' ? '67311' : '67312');
  const groupLabel = normGroup === 'sun' ? (isEn ? 'Sun' : 'Soleil') : (normGroup === 'moon' ? (isEn ? 'Moon' : 'Lune') : (isEn ? 'Star' : 'Étoile'));

  const pId = (char && (char.id || char.name || '')).toLowerCase();
  const canon = null;

  function resolveCoreSpecificName(id, rawLabel) {
    let name = '';
    if (id && typeof BIBLE_CORES !== 'undefined' && BIBLE_CORES[id]) {
      const full = BIBLE_CORES[id];
      const m = full.match(/^([A-Za-z]+)\s+([A-Za-z]+)\s+Core:\s*(.+)$/i);
      if (m && m[3]) name = m[3].trim();
      else name = full;
    } else if (rawLabel) {
      const m1 = rawLabel.match(/^([^(\n]+?)\s*\(\d+P\s*\|\s*(?:Order|Chaos)/i);
      if (m1 && m1[1]) name = m1[1].trim();
      else {
        const m2 = rawLabel.match(/(?:Order|Chaos)\s*(?:Sun|Moon|Star)(?:\s*Core)?\s*:\s*([^(\n]+)/i);
        if (m2 && m2[1]) name = m2[1].trim();
      }
    }
    if (!name) return '';
    // Traduction et clarification des termes génériques pour éviter la confusion avec l'équipement
    if (/^weapon$/i.test(name)) return isEn ? 'Weapon Power' : "Puissance d'Arme";
    if (/^attack$/i.test(name)) return isEn ? 'Attack Power' : "Puissance d'Attaque";
    if (/^echoing brand$/i.test(name)) return isEn ? 'Echoing Brand' : "Marque d'Écho";
    if (/^fortitude enhancement$/i.test(name)) return isEn ? 'Fortitude Enhancement' : "Renforcement de Ténacité";
    return name;
  }

  let order = {
    name: isEn ? `Order ${groupLabel}` : `Cœur d'Ordre ${groupLabel}`,
    specificName: '',
    tier: 10,
    points: 10,
    bonusPct: 0,
    grade: 'Relic',
    effectName: isEn ? 'Order Resonance' : 'Résonance d\'Ordre'
  };

  let chaos = {
    name: isEn ? `Chaos ${groupLabel}` : `Cœur de Chaos ${groupLabel}`,
    specificName: '',
    tier: 10,
    points: 10,
    bonusPct: 0,
    grade: 'Relic',
    effectName: isEn ? 'Chaos Resonance' : 'Résonance de Chaos'
  };

  // 1. Try from battlePoint.parts (type 29)
  const allParts = (char.rawProfile && char.rawProfile.battlePoint && char.rawProfile.battlePoint.parts)
    || (char.loadout && char.loadout.battlePoint && char.loadout.battlePoint.parts)
    || (char.battlePoint && char.battlePoint.parts)
    || (char.rawProfile && char.rawProfile.loadout && char.rawProfile.loadout.battlePoint && char.rawProfile.loadout.battlePoint.parts)
    || (char.rawProfile && char.rawProfile.loadouts && char.rawProfile.loadouts[0] && char.rawProfile.loadouts[0].battlePoint && char.rawProfile.loadouts[0].battlePoint.parts)
    || (canon && canon.rawProfile && canon.rawProfile.battlePoint && canon.rawProfile.battlePoint.parts)
    || (canon && canon.battlePoint && canon.battlePoint.parts)
    || [];

  const classNameNorm = (char.className || char.class || (char.loadout && char.loadout.classId) || '').toLowerCase();
  const isSupportRole = char.role === 'support' || ['bard', 'paladin', 'artist', 'valkyrie'].some(s => classNameNorm.includes(s));

  const parts29 = allParts.filter(p => p.type === 29);
  if (parts29.length > 0) {
    const oPart = parts29.find(p => (p.id || '').toString().startsWith(prefixOrder));
    if (oPart) {
      order.id = oPart.id;
      order.points = oPart.points || 17;
      order.tier = oPart.points || 17;
      order.bonusPct = Number(((oPart.value || 0) / 100).toFixed(2));
      order.grade = ((oPart.id || 0) % 10 === 6) ? (isEn ? 'Ancient' : 'Ancien') : (isEn ? 'Relic' : 'Relique');
      const sName = resolveCoreSpecificName(oPart.id);
      if (sName) {
        order.specificName = sName;
        order.effectName = sName;
      }
    }
    const cPart = parts29.find(p => (p.id || '').toString().startsWith(prefixChaos));
    if (cPart) {
      chaos.id = cPart.id;
      chaos.points = cPart.points || 17;
      chaos.tier = cPart.points || 17;
      chaos.bonusPct = Number(((cPart.value || 0) / 100).toFixed(2));
      chaos.grade = ((cPart.id || 0) % 10 === 6) ? (isEn ? 'Ancient' : 'Ancien') : (isEn ? 'Relic' : 'Relique');
      const sName = resolveCoreSpecificName(cPart.id);
      if (sName) {
        chaos.specificName = sName;
        chaos.effectName = sName;
      }
    }
  }

  // 2. Try raw arkGridCores if specificName, points or bonus were not found (ex: Chaos Star exclu sur support ou pas de type 29)
  const rawCores = char.arkGridCores
    || (char.rawProfile && (char.rawProfile.arkGridCores || (char.rawProfile.loadout && char.rawProfile.loadout.arkGridCores)))
    || (char.loadout && char.loadout.arkGridCores)
    || (canon && (canon.arkGridCores || (canon.rawProfile && canon.rawProfile.arkGridCores)))
    || [];

  if (Array.isArray(rawCores) && rawCores.length > 0) {
    const oCore = rawCores.find(c => (c.id || '').toString().startsWith(prefixOrder));
    if (oCore) {
      order.id = oCore.id;
      const pts = Array.isArray(oCore.gems)
        ? oCore.gems.reduce((s, g) => s + (g.corePoints || 0), 0)
        : (oCore.points || 17);
      const isAnc = ((oCore.id || 0) % 10 === 6) || oCore.grade === 'ancient';
      order.grade = isAnc ? (isEn ? 'Ancient' : 'Ancien') : (isEn ? 'Relic' : 'Relique');
      if (!order.points || order.points <= 10) order.points = pts;
      if (!order.tier || order.tier <= 10) order.tier = pts;
      if (!order.bonusPct || order.bonusPct === 0) {
        order.bonusPct = getArkGridCoreBonus(prefixOrder, pts, isSupportRole, isAnc);
      }
      const sName = resolveCoreSpecificName(oCore.id);
      if (sName) {
        order.specificName = sName;
        order.effectName = sName;
      }
    }

    const cCore = rawCores.find(c => (c.id || '').toString().startsWith(prefixChaos));
    if (cCore) {
      chaos.id = cCore.id;
      const pts = Array.isArray(cCore.gems)
        ? cCore.gems.reduce((s, g) => s + (g.corePoints || 0), 0)
        : (cCore.points || 17);
      const isAnc = ((cCore.id || 0) % 10 === 6) || cCore.grade === 'ancient';
      chaos.grade = isAnc ? (isEn ? 'Ancient' : 'Ancien') : (isEn ? 'Relic' : 'Relique');
      if (!chaos.points || chaos.points <= 10) chaos.points = pts;
      if (!chaos.tier || chaos.tier <= 10) chaos.tier = pts;
      if (!chaos.bonusPct || chaos.bonusPct === 0) {
        chaos.bonusPct = getArkGridCoreBonus(prefixChaos, pts, isSupportRole, isAnc);
      }
      const sName = resolveCoreSpecificName(cCore.id);
      if (sName) {
        chaos.specificName = sName;
        chaos.effectName = sName;
      }
    }
  }

  // 3. Try items fallback (from CANONICAL_PRESETS or parsed items)
  const items = (char.rawProfile && char.rawProfile.items)
    || char.items
    || (char.loadout && char.loadout.items)
    || (canon && canon.items)
    || [];

  if (Array.isArray(items)) {
    items.forEach(it => {
      const cat = it.cat || '';
      if (!cat.includes('Grille') && !cat.includes('Ark')) return;
      const lbl = it.label || '';
      const multVal = parseFloat((it.mult || '').replace('+', '').replace('%', '')) || 0;
      const valMatch = (it.val || '').match(/(\d+)P/i);
      const pts = valMatch ? parseInt(valMatch[1], 10) : 17;

      const isOrderMatch = (lbl.toLowerCase().includes('order ' + groupLabel.toLowerCase()) || lbl.toLowerCase().includes('ordre ' + groupLabel.toLowerCase()) || lbl.toLowerCase().includes('order ' + normGroup) || lbl.toLowerCase().includes('ordre ' + normGroup));
      const isChaosMatch = (lbl.toLowerCase().includes('chaos ' + groupLabel.toLowerCase()) || lbl.toLowerCase().includes('chaos ' + normGroup));

      const extractedName = resolveCoreSpecificName(null, lbl);

      if (isOrderMatch) {
        if (!order.bonusPct || order.bonusPct === 0) {
          order.bonusPct = multVal;
          order.tier = pts;
          order.points = pts;
        }
        if (extractedName && !order.specificName) {
          order.specificName = extractedName;
          order.effectName = extractedName;
        } else if (!order.specificName && lbl) {
          const rawClean = lbl.split('(')[0].trim();
          if (rawClean && !rawClean.toLowerCase().includes('cœur') && !rawClean.toLowerCase().includes('core')) {
            order.specificName = rawClean;
            order.effectName = rawClean;
          }
        }
      }
      if (isChaosMatch) {
        if (!chaos.bonusPct || chaos.bonusPct === 0) {
          chaos.bonusPct = multVal;
          chaos.tier = pts;
          chaos.points = pts;
        }
        if (extractedName && !chaos.specificName) {
          chaos.specificName = extractedName;
          chaos.effectName = extractedName;
        } else if (!chaos.specificName && lbl) {
          const rawClean = lbl.split('(')[0].trim();
          if (rawClean && !rawClean.toLowerCase().includes('cœur') && !rawClean.toLowerCase().includes('core')) {
            chaos.specificName = rawClean;
            chaos.effectName = rawClean;
          }
        }
      }
    });
  }

  // 4. Fallback defaults per class & role if specificName is still missing
  if (!order.specificName) {
    if (classNameNorm.includes('bard')) {
      order.specificName = normGroup === 'sun' ? 'Brave Accent' : (normGroup === 'moon' ? 'Brave Pulse' : 'Buckshot Acceleration');
    } else if (classNameNorm.includes('paladin')) {
      order.specificName = normGroup === 'sun' ? 'Sacred Strike' : (normGroup === 'moon' ? 'Hour of Punishment' : 'Punishing Sword');
    } else if (classNameNorm.includes('artist')) {
      order.specificName = normGroup === 'sun' ? "Sun's Embrace" : (normGroup === 'moon' ? "Moon's Veil" : 'Star Splendor');
    } else if (classNameNorm.includes('breaker') || classNameNorm.includes('asura')) {
      order.specificName = normGroup === 'sun' ? 'Shadow Fist' : (normGroup === 'moon' ? 'Asura War' : 'Asura');
    } else if (classNameNorm.includes('slayer')) {
      order.specificName = normGroup === 'sun' ? 'Guillotine' : (normGroup === 'moon' ? 'Blade of Judgment' : 'Execution');
    } else if (isSupportRole) {
      order.specificName = normGroup === 'sun' ? 'Brave Accent' : (normGroup === 'moon' ? 'Brave Pulse' : 'Buckshot Acceleration');
    } else {
      order.specificName = normGroup === 'sun' ? 'Singularity' : (normGroup === 'moon' ? 'Absolute Control' : 'Crushing Storm');
    }
    order.effectName = order.specificName;
  }

  if (!chaos.specificName) {
    if (isSupportRole) {
      chaos.specificName = normGroup === 'sun' ? (isEn ? 'Fortitude Enhancement' : 'Renforcement de Ténacité') : (normGroup === 'moon' ? (isEn ? 'Echoing Brand' : "Marque d'Écho") : (isEn ? 'Weapon Power' : "Puissance d'Arme"));
    } else {
      chaos.specificName = normGroup === 'sun' ? (isEn ? 'Flashy Attack' : 'Attaque Éclatante') : (normGroup === 'moon' ? (isEn ? 'Smoldering Strike' : 'Frappe Ardente') : (isEn ? 'Attack Power' : "Puissance d'Attaque"));
    }
    chaos.effectName = chaos.specificName;
  }

  order.name = order.specificName || (isEn ? `Order ${groupLabel}` : `Cœur d'Ordre ${groupLabel}`);
  chaos.name = chaos.specificName || (isEn ? `Chaos ${groupLabel}` : `Cœur de Chaos ${groupLabel}`);

  // 5. Fallback from extractPlayerSystems if individual cores were 0
  const sysKey = 'arkGrid' + capitalize(normGroup);
  const sys = extractPlayerSystems(char, isEn);
  const rawSys = sys[sysKey] || { bonusPct: 0, label: '' };

  if (order.bonusPct === 0 && chaos.bonusPct === 0 && rawSys.bonusPct > 0) {
    order.bonusPct = Number((rawSys.bonusPct * 0.70).toFixed(2));
    chaos.bonusPct = Number((((1 + rawSys.bonusPct / 100) / (1 + order.bonusPct / 100) - 1) * 100).toFixed(2));
    const labelMatch = (rawSys.label || '').match(/(\d+)P/i);
    if (labelMatch) {
      order.tier = parseInt(labelMatch[1], 10);
      order.points = order.tier;
      chaos.tier = Math.max(10, order.tier - 2);
      chaos.points = chaos.tier;
    }
  }

  const totalMult = ((1 + order.bonusPct / 100) * (1 + chaos.bonusPct / 100) - 1) * 100;
  const highestTier = Math.max(order.tier, chaos.tier);

  return {
    order,
    chaos,
    totalMult: Number(totalMult.toFixed(2)),
    highestTier,
    groupLabel,
    normGroup
  };
}

function buildArkGridCoresBreakdownHtml(player, target, coreGroup = 'sun', cpImpact = 0, isEn = false) {
  const normGroup = (coreGroup || 'sun').toLowerCase().replace('arkgrid', '');
  const p = extractArkGridCoreDetail(player, normGroup, isEn);
  const t = extractArkGridCoreDetail(target, normGroup, isEn);

  const groupThemes = {
    sun: {
      icon: '',
      color: '#E0A43A',
      nameFr: 'Cœurs Soleil (Ordre & Chaos)',
      nameEn: 'Sun Cores (Order & Chaos)',
      statFr: 'Buff Power (Dégâts Allié & Dégâts)',
      statEn: 'Buff Power (Ally DMG & Base DMG)'
    },
    moon: {
      icon: '',
      color: '#CFCBBD',
      nameFr: 'Cœurs Lune (Ordre & Chaos)',
      nameEn: 'Moon Cores (Order & Chaos)',
      statFr: 'Buff Power (Boucliers & Soins)',
      statEn: 'Buff Power (Shields & Heals)'
    },
    star: {
      icon: '',
      color: '#CFCBBD',
      nameFr: 'Cœurs Étoile (Ordre & Chaos)',
      nameEn: 'Star Cores (Order & Chaos)',
      statFr: 'DPS Net & CDR Compétences',
      statEn: 'DPS Net & Skill CDR'
    }
  };

  const theme = groupThemes[normGroup] || groupThemes.sun;
  const titleGroup = isEn ? theme.nameEn : theme.nameFr;

  const deltaMult = Number((t.totalMult - p.totalMult).toFixed(2));
  const deltaOrder = Number((t.order.bonusPct - p.order.bonusPct).toFixed(2));
  const deltaChaos = Number((t.chaos.bonusPct - p.chaos.bonusPct).toFixed(2));

  return `
      <div class="acc-breakdown-panel arkgrid${normGroup}-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span>${theme.icon}</span>
              <strong>${isEn ? `Ark Grid: ${titleGroup} Breakdown` : `Détail de la Grille d'Ark : ${titleGroup}`}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(224, 164, 58, 0.15); border-color: rgba(224, 164, 58, 0.35); color: ${theme.color};">
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaMult.toFixed(2)}% ${isEn ? 'gap' : 'd\'écart'})` : (deltaMult < 0 ? `<span style="color:#9CB4C6;">+${Math.abs(Math.round(deltaMult * (player.cp || 3200) / 100))} CP (${isEn ? 'Lead' : 'Avance'})</span>` : (isEn ? 'Parity' : 'Parité'))}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn
              ? `Comparative inspection of <strong>Order Core</strong> and <strong>Chaos Core</strong> resonances. Ark Grid applies a multiplicative compounding formula: <code>(1 + Order%) &times; (1 + Chaos%) &minus; 1</code>.`
              : `Comparaison détaillée des résonances du <strong>Cœur d'Ordre</strong> et du <strong>Cœur de Chaos</strong>. L'Ark Grid applique un multiplicateur croisé : <code>(1 + Ordre%) &times; (1 + Chaos%) &minus; 1</code>.`}
          </div>
        </div>

        <!-- Cartes Face-à-Face : Mon Personnage vs Référence -->
        <div class="acc-inspect-grid">
          <!-- Mon Personnage -->
          <div class="acc-inspect-card player">
            <div class="acc-inspect-card-header">
              <div class="acc-inspect-slot-info">
                <span class="acc-inspect-slot-name">${isEn ? 'My Character' : 'Mon Personnage'}</span>
                <span class="acc-inspect-item-name">${escapeHtml(player.name)}</span>
              </div>
              <span class="acc-inspect-ilvl" style="background: rgba(232, 230, 220, 0.15); color: #E0A43A; border: 1px solid rgba(232, 230, 220, 0.3);">
                ${p.highestTier > 0 ? (isEn ? `Tier ${p.highestTier}P` : `Palier ${p.highestTier}P`) : 'Standard'}
              </span>
            </div>
            <div class="acc-lines-list">
              <div class="acc-line-badge high">
                <span><strong>${escapeHtml(p.order.specificName || p.order.name)}</strong> <span style="font-size:12px; opacity:0.85; font-weight:normal;">(${isEn ? 'Order ' + p.groupLabel : 'Ordre ' + p.groupLabel} • ${p.order.grade} ${p.order.points}P)</span></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">+${p.order.bonusPct.toFixed(2)}%</span>
                </div>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${escapeHtml(p.chaos.specificName || p.chaos.name)}</strong> <span style="font-size:12px; opacity:0.85; font-weight:normal;">(${isEn ? 'Chaos ' + p.groupLabel : 'Chaos ' + p.groupLabel} • ${p.chaos.grade} ${p.chaos.points}P)</span></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">+${p.chaos.bonusPct.toFixed(2)}%</span>
                </div>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Total Compounded Multiplier' : 'Multiplicateur Total Combiné'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700; color:${theme.color};">+${p.totalMult.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Référence Benchmark -->
          <div class="acc-inspect-card target">
            <div class="acc-inspect-card-header">
              <div class="acc-inspect-slot-info">
                <span class="acc-inspect-slot-name">${isEn ? 'Benchmark Target' : 'Profil Référence'}</span>
                <span class="acc-inspect-item-name">${escapeHtml(target.name)}</span>
              </div>
              <span class="acc-inspect-ilvl" style="background: rgba(140, 192, 132, 0.15); color: #8CC084; border: 1px solid rgba(140, 192, 132, 0.3);">
                ${t.highestTier > 0 ? (isEn ? `Tier ${t.highestTier}P` : `Palier ${t.highestTier}P`) : 'Standard'}
              </span>
            </div>
            <div class="acc-lines-list">
              <div class="acc-line-badge high">
                <span><strong>${escapeHtml(t.order.specificName || t.order.name)}</strong> <span style="font-size:12px; opacity:0.85; font-weight:normal;">(${isEn ? 'Order ' + t.groupLabel : 'Ordre ' + t.groupLabel} • ${t.order.grade} ${t.order.points}P)</span></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">+${t.order.bonusPct.toFixed(2)}%</span>
                  ${deltaOrder > 0.05 ? `<span class="line-cp-pill">+${deltaOrder.toFixed(2)}%</span>` : ''}
                </div>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${escapeHtml(t.chaos.specificName || t.chaos.name)}</strong> <span style="font-size:12px; opacity:0.85; font-weight:normal;">(${isEn ? 'Chaos ' + t.groupLabel : 'Chaos ' + t.groupLabel} • ${t.chaos.grade} ${t.chaos.points}P)</span></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">+${t.chaos.bonusPct.toFixed(2)}%</span>
                  ${deltaChaos > 0.05 ? `<span class="line-cp-pill">+${deltaChaos.toFixed(2)}%</span>` : ''}
                </div>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Total Compounded Multiplier' : 'Multiplicateur Total Combiné'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">+${t.totalMult.toFixed(2)}%</span>
                  ${deltaMult > 0.05 ? `<span class="line-cp-pill">+${deltaMult.toFixed(2)}%</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé -->
        <div class="astrogems-compare-table-wrap" style="margin-top: 14px;">
          <div class="astrogems-compare-table-title">
            <span></span>
            <strong>${isEn ? `Comparative Breakdown: ${titleGroup}` : `Décomposition Détaillée : ${titleGroup}`}</strong>
          </div>
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Core Component' : 'Composant de Cœur'}</th>
                <th>${isEn ? 'Your Character' : 'Votre Personnage'}</th>
                <th>${isEn ? 'Benchmark Target' : 'Référence Cible'}</th>
                <th style="text-align:right;">${isEn ? 'Delta' : 'Écart'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${isEn ? `Order ${p.groupLabel} Core` : `Cœur d'Ordre ${p.groupLabel}`}</strong><br><span style="font-size:12px; color:var(--text-muted);">${isEn ? 'Primary Order Core' : 'Cœur d\'Ordre Principal'}</span></td>
                <td><strong style="color:var(--text-primary); font-size:14px;">${escapeHtml(p.order.specificName || p.order.name)}</strong><br><span style="font-size:12px; color:var(--text-muted);">${p.order.grade} ${isEn ? 'Tier' : 'Palier'} ${p.order.points}P (+${p.order.bonusPct.toFixed(2)}%)</span></td>
                <td><strong style="color:#8CC084; font-size:14px;">${escapeHtml(t.order.specificName || t.order.name)}</strong><br><span style="font-size:12px; color:var(--text-muted);">${t.order.grade} ${isEn ? 'Tier' : 'Palier'} ${t.order.points}P (+${t.order.bonusPct.toFixed(2)}%)</span></td>
                <td class="col-cp-gain">${deltaOrder >= 0 ? `+${deltaOrder.toFixed(2)}%` : `${deltaOrder.toFixed(2)}%`}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? `Chaos ${p.groupLabel} Core` : `Cœur de Chaos ${p.groupLabel}`}</strong><br><span style="font-size:12px; color:var(--text-muted);">${isEn ? 'Amplifying Chaos Core' : 'Cœur de Chaos Amplificateur'}</span></td>
                <td><strong style="color:var(--text-primary); font-size:14px;">${escapeHtml(p.chaos.specificName || p.chaos.name)}</strong><br><span style="font-size:12px; color:var(--text-muted);">${p.chaos.grade} ${isEn ? 'Tier' : 'Palier'} ${p.chaos.points}P (+${p.chaos.bonusPct.toFixed(2)}%)</span></td>
                <td><strong style="color:#8CC084; font-size:14px;">${escapeHtml(t.chaos.specificName || t.chaos.name)}</strong><br><span style="font-size:12px; color:var(--text-muted);">${t.chaos.grade} ${isEn ? 'Tier' : 'Palier'} ${t.chaos.points}P (+${t.chaos.bonusPct.toFixed(2)}%)</span></td>
                <td class="col-cp-gain">${deltaChaos >= 0 ? `+${deltaChaos.toFixed(2)}%` : `${deltaChaos.toFixed(2)}%`}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Compounded Synergy Multiplier' : 'Synergie Multiplicative Croisée'}</strong></td>
                <td><strong>+${p.totalMult.toFixed(2)}%</strong></td>
                <td><strong style="color:#8CC084;">+${t.totalMult.toFixed(2)}%</strong></td>
                <td class="col-cp-gain"><strong>${deltaMult >= 0 ? `+${deltaMult.toFixed(2)}%` : `${deltaMult.toFixed(2)}%`}</strong></td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Combat Power Impact (Direct Core Contribution)' : 'Gain de Combat Power (Impact de l\'Écart de Cœurs)'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : (deltaMult < 0 ? `<span style="color:#9CB4C6;">-${Math.abs(Math.round(deltaMult * (player.cp || 3200) / 100))} CP (${isEn ? 'Lead' : 'Avance'})</span>` : '= 0 CP')}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Bannière Explicative & Conseils d'Optimisation -->
        <div class="stats-educational-banner" style="border-left-color: ${theme.color}; margin-top: 14px;">
          <span class="edu-icon"></span>
          <div class="edu-content">
            <strong>${isEn ? `Why does the reference profile have a +${deltaMult.toFixed(2)}% advantage in ${titleGroup}?` : `Pourquoi la référence a-t-elle une avance de +${deltaMult.toFixed(2)}% sur les ${titleGroup} ?`}</strong>
            <div style="margin-top: 4px;">
              ${isEn
                ? `1. <strong>Core Point Tiers (20P vs ${p.highestTier}P)</strong>: Reaching <strong>Tier 20P</strong> requires 4 socketed Astrogems with +5 resonance points each (4 &times; 5 = 20 pts). Each tier jump triggers a major milestone multiplier.<br>
                   2. <strong>Chaos Core Synergy</strong>: The Chaos Core serves as a direct cross-multiplier for your Order Core: <code>(1 + Order) &times; (1 + Chaos) &minus; 1</code>. Improving your Chaos Core from ${p.chaos.points}P to 20P yields a large gain in effective CP.<br>
                   3. <strong>Optimization Tip</strong>: Prioritize cutting and socketing 5-point Astrogems on your lowest core (${p.chaos.points < p.order.points ? (p.chaos.specificName ? `Chaos: ${p.chaos.specificName}` : 'Chaos') : (p.order.specificName ? `Order: ${p.order.specificName}` : 'Order')}) to bridge the <strong>+${cpImpact} CP</strong> gap at optimal gold efficiency.`
                : `1. <strong>Paliers de Points de Cœur (20P vs ${p.highestTier}P)</strong> : Pour débloquer le <strong>Palier 20P</strong>, il est nécessaire de sertir 4 astrogemmes taillées apportant 5 points de résonance chacune (4 &times; 5 = 20 pts). Chaque palier franchi déclenche un multiplicateur de dégâts/buff accru.<br>
                   2. <strong>Multiplication Croisée Ordre &times; Chaos</strong> : Le Cœur de Chaos multiplie directement le bonus du Cœur d'Ordre : <code>(1 + Ordre) &times; (1 + Chaos) &minus; 1</code>. Faire monter le Cœur de Chaos de ${p.chaos.points}P à 20P génère un gain immédiat de puissance.<br>
                   3. <strong>Conseil d'Optimisation</strong> : Priorisez le taillage d'astrogemmes à 5 points de résonance sur votre cœur le plus bas (${p.chaos.points < p.order.points ? (p.chaos.specificName ? `Chaos : ${p.chaos.specificName}` : 'Chaos') : (p.order.specificName ? `Ordre : ${p.order.specificName}` : 'Ordre')}) pour combler rapidement l'écart de <strong>+${cpImpact} CP</strong>.`
              }
            </div>
          </div>
        </div>
      </div>
    `;
}

function buildCpReconciliationHtml(player, target, gaps, isEn, tableStats) {
  if (!player || !target) return '';
  const pCp = Number(player.cp || 0);
  const tCp = Number(target.cp || 0);
  const netGap = Math.round(tCp - pCp);

  // Totaux réels des lignes du tableau (sinon, ceux du diagnostic)
  const lagCp = (tableStats && tableStats.totalPositiveCp !== undefined)
    ? tableStats.totalPositiveCp
    : (gaps || []).filter(g => g.gainCp > 0 && g.priority !== 'player_lead').reduce((s, g) => s + (g.gainCp || 0), 0);
  const leadCp = (tableStats && tableStats.totalPlayerLeadCp !== undefined)
    ? tableStats.totalPlayerLeadCp
    : (gaps || []).filter(g => g.priority === 'player_lead').reduce((s, g) => s + (g.gainCp || 0), 0);
  const modelGap = lagCp - leadCp;
  const residual = netGap - modelGap;
  const signed = (v) => `${v > 0 ? '+' : (v < 0 ? '−' : '')}${formatNumber(Math.abs(v))} CP`;

  // La référence est toujours un joueur réel : l'écart restant est ce que le modèle n'explique pas
  const explanation = isEn
    ? `The rows model a ${signed(modelGap)} gap; the real profiles differ by ${signed(netGap)}. The remaining ${signed(residual)} comes from what the model does not read (roster level, cards, pets, potions…) and from the way systems multiply together.`
    : `Les lignes modélisent un écart de ${signed(modelGap)} ; les vrais profils diffèrent de ${signed(netGap)}. Les ${signed(residual)} restants viennent de ce que le modèle ne lit pas (niveau de roster, cartes, familiers, potions…) et de la multiplication des systèmes entre eux.`;

  return `
      <div class="cp-reconciliation-card">
        <div class="reconciliation-top">
          <div class="reconciliation-title">
            <strong>${isEn ? 'Combat Power balance' : 'Bilan du Combat Power'}</strong>
          </div>
        </div>

        <div class="reconciliation-equation">
          <div class="eq-box gross-deficit">
            <div class="eq-box-label">${isEn ? 'Behind (sum of rows)' : 'Retards (somme des lignes)'}</div>
            <div class="eq-box-val">+${formatNumber(lagCp)} CP</div>
            <div class="eq-box-sub">${isEn ? 'Systems where the reference is ahead' : 'Systèmes où la référence est devant'}</div>
          </div>

          <div class="eq-operator">−</div>

          <div class="eq-box player-lead">
            <div class="eq-box-label">${isEn ? 'Ahead (sum of rows)' : 'Avances (somme des lignes)'}</div>
            <div class="eq-box-val">${formatNumber(leadCp)} CP</div>
            <div class="eq-box-sub">${isEn ? 'Systems where you are ahead' : 'Systèmes où tu es devant'}</div>
          </div>

          <div class="eq-operator">=</div>

          <div class="eq-box net-gap">
            <div class="eq-box-label">${isEn ? 'Model balance' : 'Solde du modèle'}</div>
            <div class="eq-box-val">${signed(modelGap)}</div>
            <div class="eq-box-sub">${isEn ? `Header gap: ${signed(netGap)}` : `Écart affiché : ${signed(netGap)}`}</div>
          </div>
        </div>

        <div class="reconciliation-explanation">
          <span>${explanation}</span>
        </div>
      </div>
    `;
}
