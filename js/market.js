// Onglet Marché & Forteresse.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// Initialisation au chargement

// Pierres de destruction / gardien : l'API donne le prix d'un lot de 100 au marché
// ainsi que pour les matériaux de récolte (fusions de Forteresse)
const MARKET_BUNDLE_SIZE = {
  'destiny-destruction-stone': 100,
  'destiny-guardian-stone': 100,
  'destiny-crystallized-destruction-stone': 100,
  'destiny-crystallized-guardian-stone': 100
};
(window.STRONGHOLD_FUSION_TRADES || []).forEach(t => t.mats.forEach(slug => { MARKET_BUNDLE_SIZE[slug] = 100; }));

// Prix du marché EUC (API de loa-buddy) via notre route serveur /api/market/prices :
// l'API n'autorise pas l'appel direct depuis le navigateur (CORS).
async function fetchMarketPrices() {
  try {
    const response = await fetch('/api/market/prices', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (!item || typeof item.price !== 'number' || item.price <= 0) return;
        state.marketPrices[item.item_slug] = item.price / (MARKET_BUNDLE_SIZE[item.item_slug] || 1);
      });
      state.marketPricesUpdatedAt = Math.max(...data.map(d => d.timestamp || 0)) * 1000 || Date.now();
    }
    console.log('[MARKET API] Prices updated (EUC):', state.marketPrices);
    if (typeof updatePredictorView === 'function') updatePredictorView();
    if (typeof updateHoningView === 'function') updateHoningView();
    if (typeof renderEfficiencyTable === 'function') renderEfficiencyTable();
    if (typeof renderAdvisorView === 'function') renderAdvisorView();
    if (typeof updateOptimizationView === 'function') updateOptimizationView();
    renderMarketTab();
    updateBelgardinView();
  } catch (e) {
    console.warn('[MARKET API] Prix du marché indisponibles, prix par défaut utilisés:', e.message);
    state.marketPricesFailed = true;
    renderMarketTab();
  }
}

// === ONGLET MARCHÉ & FORTERESSE ===
// Prix réels du marché EUC (ceux des calculs) et fusions de l'atelier de Forteresse
// (recettes du jeu, STRONGHOLD_FUSION_RECIPES dans data.js). Pas d'historique de prix :
// l'API ne donne que le dernier prix, aucun « prix moyen » n'est affiché.
const MARKET_TAX = 0.05; // taxe de l'hôtel des ventes, arrondie à l'or supérieur, payée par le vendeur
const STRONGHOLD_GS_BASE = 0.05; // Grande réussite : 5 % de base × (1 + bonus), production doublée
const STRONGHOLD_INPUTS_KEY = 'lostark_stronghold_bonus';

const MARKET_PRICE_GROUPS = [
  { fr: 'Affinage Serka', en: 'Serka honing', items: [
    ['great-destiny-leapstone', 'Great Destiny Leapstone'],
    ['destiny-crystallized-destruction-stone', 'Destiny Crystallized Destruction Stone'],
    ['destiny-crystallized-guardian-stone', 'Destiny Crystallized Guardian Stone'],
    ['superior-abidos-fusion-material', 'Superior Abidos Fusion Material']] },
  { fr: 'Affinage Aegir', en: 'Aegir honing', items: [
    ['destiny-leapstone', 'Destiny Leapstone'],
    ['destiny-destruction-stone', 'Destiny Destruction Stone'],
    ['destiny-guardian-stone', 'Destiny Guardian Stone'],
    ['abidos-fusion-material', 'Abidos Fusion Material']] },
  { fr: 'Souffles', en: 'Breaths', items: [
    ['lavas-breath', "Lava's Breath"],
    ['glaciers-breath', "Glacier's Breath"]] }
];

function marketSlugLabel(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Revenu net d'une vente au marché, taxe arrondie à l'or supérieur sur le lot vendu
function marketNetSale(price, lot = 1) {
  const lotPrice = price * lot;
  return (lotPrice - Math.ceil(lotPrice * MARKET_TAX)) / lot;
}

function loadStrongholdInputs() {
  try {
    const saved = JSON.parse(lsGet(STRONGHOLD_INPUTS_KEY) || 'null');
    if (!saved) return;
    ['shCostRed', 'shTimeRed', 'shGsChance', 'shMatSource'].forEach(id => {
      const el = document.getElementById(id);
      if (el && saved[id] != null) el.value = saved[id];
    });
  } catch (e) { /* stockage indisponible : valeurs par défaut */ }
}

function saveStrongholdInputs() {
  try {
    const out = {};
    ['shCostRed', 'shTimeRed', 'shGsChance', 'shMatSource'].forEach(id => {
      const el = document.getElementById(id);
      if (el) out[id] = el.value;
    });
    lsSet(STRONGHOLD_INPUTS_KEY, JSON.stringify(out));
  } catch (e) { /* ignoré */ }
}

// Une recette de fusion pour un métier : coût, production espérée, profit
function strongholdFusionCraft(recipe, trade, opts) {
  const mp = state.marketPrices;
  const unitPrices = trade.mats.map(slug => mp[slug]);
  const sell = mp[recipe.slug];
  if (unitPrices.some(p => !(p > 0)) || !(sell > 0)) return null;
  const matCost = trade.mats.reduce((sum, slug, i) => {
    const unit = mp[slug];
    // Récoltés : on renonce à les vendre (lot de 100, taxe déduite)
    const value = opts.ownMats ? marketNetSale(unit, MARKET_BUNDLE_SIZE[slug] || 1) : unit;
    return sum + recipe.qty[i] * value;
  }, 0);
  const gold = recipe.gold * Math.max(0, 1 - opts.costRed / 100);
  const cost = matCost + gold;
  const gsChance = Math.min(1, STRONGHOLD_GS_BASE * (1 + opts.gsBonus / 100));
  const out = recipe.out * (1 + gsChance);
  const revenue = out * marketNetSale(sell);
  const profit = revenue - cost;
  const minutes = recipe.minutes * Math.max(0, 1 - opts.timeRed / 100);
  return {
    cost, matCost, gold, out, gsChance, sell,
    unitCost: cost / out,
    profit,
    roi: cost > 0 ? profit / cost : 0,
    perHour: minutes > 0 ? profit / (minutes / 60) : null,
    minutes
  };
}

function renderMarketTab() {
  const pricesBody = document.querySelector('#marketPricesTable tbody');
  const craftBody = document.querySelector('#craftingTable tbody');
  if (!pricesBody || !craftBody) return;
  const isEn = isEnLang();
  const locale = isEn ? 'en-US' : 'fr-FR';
  const mp = state.marketPrices;
  const fmt = (v, d = 0) => Number(v).toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtPrice = v => (v >= 100 ? fmt(v) : v >= 10 ? fmt(v, 1) : fmt(v, 2));

  // 1. Prix du marché
  const srcEl = document.getElementById('mktPricesSource');
  if (srcEl) {
    if (state.marketPricesUpdatedAt && !state.marketPricesFailed) {
      const when = new Date(state.marketPricesUpdatedAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
      srcEl.textContent = isEn
        ? `Latest EUC price (loa-buddy market API), updated ${when}. Price per unit; gathering materials and stones are sold in lots of 100.`
        : `Dernier prix EUC (API de marché de loa-buddy), relevé le ${when}. Prix à l'unité ; matériaux de récolte et pierres vendus par lots de 100.`;
    } else if (state.marketPricesFailed) {
      srcEl.textContent = isEn
        ? 'Market API unavailable: default prices from 2026-10-01 (EUC).'
        : 'API de marché indisponible : prix par défaut du 2026-10-01 (EUC).';
    } else {
      srcEl.textContent = isEn ? 'Loading market prices…' : 'Chargement des prix du marché…';
    }
  }

  const groups = MARKET_PRICE_GROUPS.slice();
  (window.STRONGHOLD_FUSION_TRADES || []).forEach(t => {
    groups.push({ fr: `Récolte : ${t.fr.toLowerCase()}`, en: `Gathering: ${t.en.toLowerCase()}`,
      items: t.mats.map(slug => [slug, marketSlugLabel(slug)]) });
  });
  let pHtml = '';
  groups.forEach(g => {
    pHtml += `<tr class="market-group-row"><td colspan="2">${escapeHtml(isEn ? g.en : g.fr)}</td></tr>`;
    g.items.forEach(([slug, label]) => {
      const v = mp[slug];
      const lot = MARKET_BUNDLE_SIZE[slug];
      const price = v > 0
        ? `${fmtPrice(v)} g${lot ? ` <span class="market-lot">(${fmt(v * lot)} g / ${lot})</span>` : ''}`
        : '—';
      pHtml += `<tr><td>${escapeHtml(label)}</td><td class="market-num">${price}</td></tr>`;
    });
  });
  pricesBody.innerHTML = pHtml;

  // 2. Fusions de Forteresse
  const num = id => {
    const v = parseFloat(document.getElementById(id)?.value);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
  const opts = {
    costRed: Math.min(100, num('shCostRed')),
    timeRed: Math.min(100, num('shTimeRed')),
    gsBonus: num('shGsChance'),
    ownMats: document.getElementById('shMatSource')?.value === 'own'
  };

  const rows = [];
  const verdicts = [];
  (window.STRONGHOLD_FUSION_RECIPES || []).forEach(recipe => {
    let best = null;
    (window.STRONGHOLD_FUSION_TRADES || []).forEach(trade => {
      const r = strongholdFusionCraft(recipe, trade, opts);
      rows.push({ recipe, trade, r });
      if (r && (!best || r.unitCost < best.r.unitCost)) best = { trade, r };
    });
    if (best) verdicts.push({ recipe, best });
  });
  rows.sort((a, b) => (b.r ? b.r.profit : -Infinity) - (a.r ? a.r.profit : -Infinity));

  let cHtml = '';
  rows.forEach(({ recipe, trade, r }) => {
    const name = `${escapeHtml(isEn ? recipe.en : recipe.fr)} <span class="market-lot">${escapeHtml(isEn ? trade.en : trade.fr)}</span>`;
    if (!r) {
      cHtml += `<tr><td>${name}</td><td class="market-num" colspan="4">${isEn ? 'price missing' : 'prix manquant'}</td></tr>`;
      return;
    }
    const cls = r.profit >= 0 ? 'market-gain' : 'market-loss';
    const sign = r.profit > 0 ? '+' : '';
    cHtml += `<tr>
        <td>${name}</td>
        <td class="market-num">${fmt(r.unitCost, 1)} g</td>
        <td class="market-num ${cls}">${sign}${fmt(r.profit)} g</td>
        <td class="market-num ${cls}">${sign}${fmt(r.roi * 100, 1)} %</td>
        <td class="market-num ${cls}">${r.perHour == null ? '—' : `${sign}${fmt(r.perHour)} g`}</td>
      </tr>`;
  });
  craftBody.innerHTML = cHtml;

  const verdictEl = document.getElementById('craftVerdict');
  if (verdictEl) {
    verdictEl.innerHTML = verdicts.map(({ recipe, best }) => {
      const craftCheaper = best.r.unitCost < best.r.sell;
      const diff = Math.abs(best.r.sell - best.r.unitCost);
      const name = escapeHtml(isEn ? recipe.en : recipe.fr);
      const trade = escapeHtml(isEn ? best.trade.en : best.trade.fr);
      const text = isEn
        ? (craftCheaper
          ? `<strong>Craft</strong>: ${fmt(best.r.unitCost, 1)} g per unit (${trade}) vs ${fmtPrice(best.r.sell)} g on the market, ${fmt(diff, 1)} g saved per unit.`
          : `<strong>Buy</strong>: ${fmtPrice(best.r.sell)} g on the market vs ${fmt(best.r.unitCost, 1)} g per unit crafted (${trade}, cheapest recipe).`)
        : (craftCheaper
          ? `<strong>Crafter</strong> : ${fmt(best.r.unitCost, 1)} g l'unité (${trade}) contre ${fmtPrice(best.r.sell)} g au marché, ${fmt(diff, 1)} g d'économie par unité.`
          : `<strong>Acheter</strong> : ${fmtPrice(best.r.sell)} g au marché contre ${fmt(best.r.unitCost, 1)} g l'unité en craft (${trade}, recette la moins chère).`);
      return `<div class="market-verdict"><span class="market-verdict-item">${name}</span><span>${text}</span></div>`;
    }).join('');
  }

  const noteEl = document.getElementById('craftNote');
  if (noteEl) {
    const gs = fmt(Math.min(1, STRONGHOLD_GS_BASE * (1 + opts.gsBonus / 100)) * 100, 2);
    noteEl.textContent = isEn
      ? `10 fusions per craft; Great Success ${gs} % (5 % base × (1 + bonus)) doubles the output. Sale after the 5 % market tax. Stronghold energy is not counted in gold. Gold / hour for one workshop slot.`
      : `10 fusions par craft ; Grande réussite ${gs} % (5 % de base × (1 + bonus)), production doublée. Vente après la taxe de 5 % du marché. L'énergie de Forteresse n'est pas comptée en or. Or / heure pour un emplacement d'atelier.`;
  }
}
