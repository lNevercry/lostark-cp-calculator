// Banc d'audit (voir README.md du dossier). Aucun accès réseau : tout vient de tools/audit/cache.
// Banc d'audit : charge l'appli complète dans jsdom, AUCUN accès réseau (tout vient du cache local).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(path.resolve(HERE, '../../package.json'));
const { JSDOM, requestInterceptor, VirtualConsole } = require('jsdom');
export const REPO = path.resolve(HERE, '../..');
export const CACHE = path.resolve(HERE, 'cache');

const AUDIT_NAMES = ['getDynamicGpdTable', 'buildMasterGpdData', 'buildPieceByPieceData', 'astrogemGridBand', 'getAbilityStoneUpgrade',
  'braceletBandOf', 'extractPlayerSystems', 'detectCharacterRole', 'gearStatContext', 'supportInputs', 'realGems', 'realGemLevels',
  'weaponQualityUpgrade', 'karmaGpdStep', 'avatarGpdStep', 'avatarBonusOf', 'renderEfficiencyTable', 'getRelicBookUpgrades', 'findBestAccessoryUpgrade', 'computeAccessoryLinesBonus',
  'state', 'updateActiveCharacterCard', 'getAbilityStone', 'pieceIsSerka', 'battlePointPartsOf', 'honingDpsGain', 'supportContribution',
  'braceletGpdStep', 'getKarmaBonus', 'benchmarkGpdGains', 'computeDynamicGapsAndPlan', 'getArkGridCoreIds', 'loseiiGpd',
  'getBraceletRerollEstimate', 'getLevelCost', 'honingStepFor', 'getAdvHoningLevels', 'roleFromEngravings', 'hasMixedRaidProfile',
  'supportBraceletBuff', 'dpsGemUpgradeGain', 'dpsGemSetGain', 'dpsGemDetails', 'specSkillShares', 'supportGemUpgradeGain', 'weaponCoreGain', 'gearDpsGain', 'accessoryMaxBonusPct',
  'getAccessoryLineKey', 'raidCombatPowerOf', 'arkGridBp', 'evaluateCharacterAccessories', 'advHoningDpsGain', 'getAdvHoningCost', 'arkCoreBpAt', 'ARK_CORE_DEFS', 'getArkGridStatus', 'accessoryGrade', 'supportBpBranches', 'getBaselineCp', 'updateHoningView', 'honingNextSteps', 'gearCpGain', 'predictCp', 'predictHoningPath', 'gemCpBonus', 'getDynamicGemsForActiveCharacter', 'computeGearIlvl', 'honingGainTo', 'buildGpdRoadmap', 'gpdFollowUp', 'hasIncompleteBattlePoint', 'battlePointCoherence', 'extractCharacterGemParts', 'isEnLang', 'activeCharacterId', 'getCurrentActiveCharacter', 'getUserRoster', 'computeOptimizationSim', 'optSim', 'updateOptimizationView',
  'recipeStepCost', 'honingT4', 'getBoundMats', 'setBoundMat', 'honingStepsCost', 'predictHoningPath', 'buildGpdRoadmap', 'renderBelgardinReadiness', 'updatePredictorView'];

function serveLocal(url) {
  const u = new URL(url, 'https://lostark-cp.pages.dev/');
  const p = decodeURIComponent(u.pathname);
  if (u.hostname === 'lostark-cp.pages.dev') {
    if (p === '/api/market/prices') return fs.readFileSync(path.join(CACHE, 'market.json'));
    const m = p.match(/^\/api\/bible\/character\/([^/]+)\/([^/]+)\/__data\.json$/);
    if (m) return bible(m[1], m[2]);
    const f = path.join(REPO, p);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      let buf = fs.readFileSync(f);
      if (p === '/js/main.js') {
        const exp = AUDIT_NAMES.map(n => `get ${n}() { return typeof ${n} !== 'undefined' ? ${n} : null; }`).join(', ');
        buf = Buffer.from(buf.toString().replace('window.__initApp = initApp;',
          `window.__initApp = initApp;\nwindow.__audit = { ${exp}, get active() { return activeCharacterId; } };`));
      }
      return buf;
    }
    return null;
  }
  if (u.hostname === 'www.loseii.com') {
    const f = path.join(CACHE, 'loseii', path.basename(p));
    return fs.existsSync(f) ? fs.readFileSync(f) : null;
  }
  if (u.hostname === 'lostark.bible') {
    const m = p.match(/^\/character\/([^/]+)\/([^/]+)\/__data\.json$/);
    if (m) return bible(m[1], m[2]);
  }
  return null;
}
function bible(reg, name) {
  const f = path.join(CACHE, 'bible', `${reg.toUpperCase()}_${name}.json`);
  return fs.existsSync(f) ? fs.readFileSync(f) : null;
}

// Toute requête de jsdom s'arrête ici : jamais de réseau
const interceptor = requestInterceptor(request => {
  const b = serveLocal(request.url);
  const type = /\.js(\?|$)/.test(request.url) ? 'application/javascript' : (/\.css/.test(request.url) ? 'text/css' : 'application/json');
  return b ? new Response(b, { status: 200, headers: { 'content-type': type } }) : new Response('', { status: 404 });
});

export async function loadApp({ quiet = true } = {}) {
  const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8')
    .replace(/<script type='module' src='https:\/\/static\.cloudflareinsights[^>]*><\/script>/, '');
  const vc = new VirtualConsole();
  const logs = [];
  vc.on('error', e => logs.push(['error', String(e && e.message || e)]));
  vc.on('warn', (...a) => logs.push(['warn', a.join(' ')]));
  vc.on('jsdomError', e => logs.push(['jsdomError', String(e.message || e)]));
  if (!quiet) vc.on('log', (...a) => console.log('[page]', ...a));
  const dom = new JSDOM(html, {
    url: 'https://lostark-cp.pages.dev/', runScripts: 'dangerously', resources: { interceptors: [interceptor] }, pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win) {
      win.fetch = async (url, opts) => {
        const b = serveLocal(String(url));
        const ok = !!b;
        return { ok, status: ok ? 200 : 404, json: async () => JSON.parse(b.toString()), text: async () => (b ? b.toString() : '') };
      };
      win.scrollTo = () => {};
      win.matchMedia = win.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      win.HTMLCanvasElement.prototype.getContext = () => null;
      win.alert = () => {}; win.confirm = () => true;
    }
  });
  const win = dom.window;
  await new Promise(r => win.addEventListener('load', r));
  for (let i = 0; i < 50 && !(win.Astrogem && win.__audit && win.__audit.loseiiGpd && win.__audit.loseiiGpd.rows.dps); i++) await new Promise(r => setTimeout(r, 100));
  await new Promise(r => setTimeout(r, 500));
  return { win, logs, A: win.__audit };
}

export function bibleFiles() {
  return fs.readdirSync(path.join(CACHE, 'bible')).filter(f => f.endsWith('.json')).map(f => {
    const [reg, ...rest] = f.replace(/\.json$/, '').split('_');
    return { region: reg, name: rest.join('_'), file: path.join(CACHE, 'bible', f) };
  });
}
