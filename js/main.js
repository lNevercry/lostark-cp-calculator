// Démarrage de l'appli et exports window.__*.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

async function initApp() {
  console.log('[APP] initApp executed! readyState:', document.readyState);
  state.gpdPrices = loadGpdPrices();
  bindEvents();
  loadStrongholdInputs();
  ['shCostRed', 'shTimeRed', 'shGsChance', 'shMatSource'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { saveStrongholdInputs(); renderMarketTab(); });
  });
  renderMarketTab();
  fetchMarketPrices();
  loadHoningT4();
  loadKarmaT4();
  loadBracerT4();
  initBelgardinTab();
  initRotationTab();
  loadLoseiiGpd();
  loadArkGridBp();
  loadBpSupportTable();

  const savedRoster = getUserRoster();
  if (savedRoster && savedRoster.length > 0) {
    hideNoCharacterState();
    renderPresetsBar();
    let savedActive = null;
    try { savedActive = lsGet('lostark_active_char'); } catch (e) {}
    loadCharacter(savedRoster.find(c => (c.id || c.name.toLowerCase()) === savedActive) || savedRoster[0]);
  } else {
    showNoCharacterState();
  }

  renderSavedRosterManager();

  // Écouteur de changement de langue (i18n dynamique)
  window.addEventListener('languageChanged', () => {
    renderPresetsBar();
    const curChar = getCurrentActiveCharacter();
    if (curChar) {
      updateActiveCharacterCard(activeCharacterId, curChar);
    }
    updatePredictorView();
    updateHoningView();
    updateOptimizationView();
    renderCanonicalView();
    renderAdvisorView();
    updateArkPassiveView();
    renderEfficiencyTable();
    updateGemSelectOptions();
    updateAstrogemGraderView();
    renderRaidTrackerView();
    renderBenchmarkTab();
    renderMarketTab();
    updateBelgardinView();
    renderRotationTab();
    renderSavedRosterManager();
    renderOAuthRosters();
  });

  // Initialisation des modules
  initRaidTracker();
  initBenchmarkEvents();
  initWelcomeModal();

  // Vérification d'un lien direct avec paramètre ?char=...
  const hasCharParam = await checkUrlCharacterParam();
  if (!hasCharParam) {
    checkOnboarding();
  }

  // Vérification du retour de redirection OAuth ou session active
  checkOAuthCallback();
  const token = lsGet('lostark_bible_token');
  if (token) {
    fetchOAuthUserData(token);
  }
}

window.__initApp = initApp;
window.__renderPresetsBar = renderPresetsBar;
window.__evaluateBracelet = evaluateBracelet;
window.__renderBenchmarkTab = renderBenchmarkTab;
window.__initBenchmarkEvents = initBenchmarkEvents;
window.__findOptimalBenchmark = findOptimalBenchmark;
window.__normalizeClassName = normalizeClassName;
window.__getMainStatName = getMainStatName;
window.__getCharacterSpecName = getCharacterSpecName;
window.__extractPlayerSystems = extractPlayerSystems;
window.__parseBibleCharacter = parseBibleCharacter;
window.__getArkGridStatus = getArkGridStatus;
window.__showToast = showToast;
window.__BENCHMARK_DATABASE = typeof BENCHMARK_DATABASE !== 'undefined' ? BENCHMARK_DATABASE : {};
window.__fetchBibleProfile = fetchBibleProfile;
window.__extractCharacterGemParts = extractCharacterGemParts;
window.__extractPlayerSystems = extractPlayerSystems;
window.__loadCharacter = loadCharacter;
window.__setAdvisorMode = typeof setAdvisorMode !== 'undefined' ? setAdvisorMode : function(goal) {
  if (typeof advisorState !== 'undefined') advisorState.selectedGoal = goal;
  if (typeof renderAdvisorView === 'function') renderAdvisorView();
};
window.__renderAdvisorView = renderAdvisorView;
window.__computeDynamicGapsAndPlan = computeDynamicGapsAndPlan;
window.__benchmarkGpdGains = benchmarkGpdGains;
window.__getDynamicGpdTable = getDynamicGpdTable;
window.__buildCpReconciliationHtml = buildCpReconciliationHtml;
window.__resolveTargetSystems = resolveTargetSystems;
window.__fetchLiveBibleBenchmark = fetchLiveBibleBenchmark;
window.__benchmarkState = typeof benchmarkState !== 'undefined' ? benchmarkState : {};
window.__getAvailableBenchmarks = getAvailableBenchmarks;
window.__findOptimalBenchmark = findOptimalBenchmark;
window.__extractCharacterEngravings = extractCharacterEngravings;
window.__buildEngravingsBreakdownHtml = buildEngravingsBreakdownHtml;
window.__buildBaseAtkBreakdownHtml = buildBaseAtkBreakdownHtml;
window.__buildCombatStatsBreakdownHtml = buildCombatStatsBreakdownHtml;
window.__buildAccBreakdownHtml = buildAccBreakdownHtml;
window.__buildBraceletBreakdownHtml = buildBraceletBreakdownHtml;
window.__buildAstrogemsBreakdownHtml = buildAstrogemsBreakdownHtml;
window.__buildArkGridCoresBreakdownHtml = buildArkGridCoresBreakdownHtml;
window.__buildWeaponBreakdownHtml = buildWeaponBreakdownHtml;
window.__buildArmorsBreakdownHtml = buildArmorsBreakdownHtml;
window.__getClassIconUrl = getClassIconUrl;
window.__applyLoadedProfile = applyLoadedProfile;
window.__detectCharacterRole = detectCharacterRole;
window.__calcBracerStats = calcBracerStats;
window.__simulateBracerImpact = simulateBracerImpact;
window.__getBracerHoningCumulativeCost = getBracerHoningCumulativeCost;
window.__updateBelgardinView = updateBelgardinView;
window.detectCharacterRole = detectCharacterRole;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
