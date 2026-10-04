// Sécurité XSS, calibration iLvl → CP, classes et rôles, avatars, stockage compact et roster local.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- 0. SÉCURITÉ : SANITISATION XSS ---
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Régions des profils lostark.bible (segment de chemin des appels : rien d'autre n'y entre)
const BIBLE_REGIONS = ['CE', 'NA', 'NAE', 'NAW', 'SA'];

// Image de repli (attribut data-fallback) : écouteur unique en capture, à la place des onerror inline
// (la CSP n'autorise aucun script inline)
document.addEventListener('error', e => {
  const img = e.target;
  if (!img || img.tagName !== 'IMG' || !img.dataset.fallback || img.dataset.fallbackDone) return;
  img.dataset.fallbackDone = '1';
  img.src = img.dataset.fallback;
}, true);

// --- 1. BASE DE CALIBRATION EMPIRIQUE (LOSTARK.BIBLE) ---
// Paliers réels observés pour Supports et DPS en T4
const CALIBRATION_DATA = {
  support: [
    { ilvl: 1640, cp: 650 },
    { ilvl: 1670, cp: 810 },
    { ilvl: 1714, cp: 2040 },
    { ilvl: 1735, cp: 2950 },
    { ilvl: 1740, cp: 3120 },
    { ilvl: 1750, cp: 3368 }, // Neversup calibré live (lostark.bible)
    { ilvl: 1765.83, cp: 4652 }, // Siwilpal calibré live (lostark.bible)
    { ilvl: 1775, cp: 5350 },
    { ilvl: 1785, cp: 6150 },
    { ilvl: 1800, cp: 7100 }
  ],
  dps: [
    { ilvl: 1640, cp: 750 },
    { ilvl: 1670, cp: 950 },
    { ilvl: 1714, cp: 2250 },
    { ilvl: 1735, cp: 3350 },
    { ilvl: 1740, cp: 3650 },
    { ilvl: 1750, cp: 4100 },
    { ilvl: 1762.5, cp: 4950 },
    { ilvl: 1770.83, cp: 5445 }, // Neevercry calibré live (lostark.bible)
    { ilvl: 1775.83, cp: 6103 }, // Ebeneben calibré live (lostark.bible)
    { ilvl: 1785.00, cp: 6525 }, // Bascojin calibré live (lostark.bible)
    { ilvl: 1790.00, cp: 6650 }, // Câsy calibré live (lostark.bible)
    { ilvl: 1800.00, cp: 7400 }
  ]
};

// Dictionnaire de normalisation universel des 28 classes Lost Ark (FR / EN / IDs internes)


function normalizeClassName(raw) {
  if (!raw) return 'Paladin';
  const clean = raw.toLowerCase().trim();
  if (CLASS_NAME_MAP[clean]) return CLASS_NAME_MAP[clean];
  const stripped = clean.replace(/[\s\-_'’]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (CLASS_NAME_MAP[stripped]) return CLASS_NAME_MAP[stripped];
  if (stripped.includes('holyknightfemale') || stripped.includes('valkyrie')) return 'Valkyrie';
  if (stripped.includes('infightermale') || stripped.includes('breaker') || stripped.includes('heavyinfighter')) return 'Breaker';
  if (stripped.includes('infighterfemale') || stripped === 'infighter' || stripped.includes('scrapper')) return 'Scrapper';
  if (stripped.includes('holyknight') || stripped.includes('paladin')) return 'Paladin';
  if (stripped.includes('berserkerfemale') || stripped.includes('slayer')) return 'Slayer';
  if (stripped.includes('scouter') || stripped.includes('machinist')) return 'Machinist';
  if (stripped.includes('souleater') || stripped.includes('soul_eater')) return 'Souleater';
  if (stripped.includes('yinyangshi') || stripped.includes('artist') || stripped.includes('artiste') || stripped.includes('painter')) return 'Artist';
  if (stripped.includes('aeromancer') || stripped.includes('weatherartist')) return 'Aeromancer';
  if (stripped.includes('dimension') || stripped.includes('dimensionalist')) return 'Dimensionalist';
  return clean.charAt(0).toUpperCase() + clean.slice(1).replace(/_/g, ' ');
}

function formatClassName(raw) {
  return normalizeClassName(raw);
}

const SUPPORT_CLASS_NAMES = [
  'paladin', 'holyknight', 'holy knight', 'holy_knight', 'sainte guerriere', 'sainte guerrière',
  'bard', 'barde',
  'artist', 'artiste', 'yinyangshi', 'painter',
  'valkyrie', 'holyknight_female', 'holyknightfemale', 'female_holyknight'
];

const SUPPORT_DPS_SPECS = [
  'judgment', 'jugement',
  'true courage', 'vrai courage',
  'recurrence', 'récurrence',
  'shining knight'
];
// Spés support (lostark.bible) : Paladin, Barde, Artiste, Valkyrie
const SUPPORT_SPEC_NAMES = ['blessed aura', 'desperate salvation', 'full bloom', 'liberator', 'knight of light'];
function isSupportSpecName(spec) {
  return SUPPORT_SPEC_NAMES.includes((spec || '').toLowerCase().trim());
}

// Une classe support est support par défaut ; ce sont ses GRAVURES qui disent si elle est jouée DPS.
// « Expert » signe un support ; au moins 2 gravures de dégâts purs signent un build DPS.
const SUPPORT_MARKER_ENGRAVINGS = ['expert'];
const DPS_DAMAGE_ENGRAVINGS = [
  'grudge', 'cursed doll', 'keen blunt weapon', 'adrenaline', 'hit master', 'raid captain',
  'super charge', 'master brawler', 'precise dagger', 'mass increase', 'ambush master', 'barricade',
  'all-out attack', 'stabilized status', 'ether predator', 'contender'
];

function engravingNamesOf(ch) {
  if (!ch || typeof ch !== 'object') return [];
  const raw = ch.rawProfile || null;
  const list = (Array.isArray(ch.engravings) && ch.engravings.length ? ch.engravings : null)
    || (raw && (raw.engravings || (raw.loadout && raw.loadout.engravings)))
    || (ch.loadout && ch.loadout.engravings)
    || [];
  let names = {};
  try { names = BIBLE_ENGRAVINGS; } catch (e) { names = {}; }
  return list
    .map(e => (typeof e === 'string' ? e : ((e && names[e.id]) || (e && e.name) || '')))
    .map(n => String(n).toLowerCase())
    .filter(Boolean);
}

// 'support' | 'dps' d'après les gravures, ou null si elles ne sont pas lisibles
function roleFromEngravings(ch) {
  const engs = engravingNamesOf(ch);
  if (engs.length < 3) return null;
  if (engs.some(n => SUPPORT_MARKER_ENGRAVINGS.some(m => n.includes(m)))) return 'support';
  const dpsCount = engs.filter(n => DPS_DAMAGE_ENGRAVINGS.some(d => n.includes(d))).length;
  return dpsCount >= 2 ? 'dps' : 'support';
}

function isSupportClassName(rawClass) {
  if (!rawClass) return false;
  const clean = String(rawClass).toLowerCase().replace(/[\s\-_]/g, '');
  return SUPPORT_CLASS_NAMES.some(s => {
    const sClean = s.replace(/[\s\-_]/g, '');
    return clean === sClean || clean.includes(sClean);
  });
}

function detectCharacterRole(charOrClass, maybeSpec = '') {
  if (!charOrClass) return 'dps';

  let rawClass = '';
  let rawSpec = '';
  let charName = '';
  let explicitRole = null;

  if (typeof charOrClass === 'object') {
    rawClass = charOrClass.className || charOrClass.classId || charOrClass.class || '';
    rawSpec = charOrClass.spec || charOrClass.engraving || maybeSpec || '';
    charName = (charOrClass.name || charOrClass.id || '').toLowerCase();
    explicitRole = charOrClass.role;
    if (!rawClass && charOrClass.loadout) {
      rawClass = charOrClass.loadout.classId || '';
    }
    if (!rawClass && charOrClass.rawProfile) {
      rawClass = charOrClass.rawProfile.className || (charOrClass.rawProfile.loadout && charOrClass.rawProfile.loadout.classId) || '';
    }
    if (!rawSpec && Array.isArray(charOrClass.engravings)) {
      rawSpec = charOrClass.engravings.map(e => (typeof e === 'string' ? e : (e.name || e.id || ''))).join(' ');
    }
  } else {
    rawClass = String(charOrClass);
    rawSpec = String(maybeSpec || '');
  }


  const cleanClass = String(rawClass).toLowerCase().trim();
  if (cleanClass === 'support') {
    return 'support';
  }

  const isSupClass = isSupportClassName(rawClass);

  if (isSupClass) {
    // 1. Les gravures décident quand elles sont lisibles
    const engRole = typeof charOrClass === 'object' ? roleFromEngravings(charOrClass) : null;
    if (engRole) return engRole;
    // 2. Sinon, une spé DPS explicite (Judgment, True Courage, Recurrence, Shining Knight)
    const specLower = (rawSpec || '').toLowerCase();
    const isDpsSpec = SUPPORT_DPS_SPECS.some(dpsSpec => specLower.includes(dpsSpec));
    if (isDpsSpec) {
      return 'dps';
    }
    return 'support';
  }

  // Si la classe est clairement identifiée et n'est pas un support, c'est un DPS à 100%
  if (cleanClass && cleanClass !== 'unknown' && cleanClass !== 'undefined') {
    return 'dps';
  }

  if (explicitRole === 'support' || explicitRole === 'dps') {
    return explicitRole;
  }

  return 'dps';
}

function getClassIconUrl(raw, role) {
  if (!raw) {
    return (role === 'support') ? 'images/classes/paladin.png' : 'images/classes/shadowhunter.png';
  }
  const clean = raw.toLowerCase().trim().replace(/[\s\-_]/g, '');
  const map = {
    // Warriors
    berserker: 'berserker.png',
    destroyer: 'destroyer.png',
    gunlancer: 'gunlancer.png',
    warlord: 'gunlancer.png',
    paladin: 'paladin.png',
    holyknight: 'paladin.png',
    slayer: 'slayer.png',
    valkyrie: 'valkyrie.png',
    holyknightfemale: 'valkyrie.png',
    warriormale: 'warrior_male.png',
    femalewarrior: 'female_warrior.png',

    // Mages
    mage: 'mage.png',
    arcanist: 'arcanist.png',
    arcana: 'arcanist.png',
    summoner: 'summoner.png',
    bard: 'bard.png',
    sorceress: 'sorceress.png',

    // Martial Artists
    martialartistfemale: 'martial_artist_female.png',
    martialartistmale: 'martial_artist_male.png',
    wardancer: 'wardancer.png',
    battlemaster: 'wardancer.png',
    scrapper: 'scrapper.png',
    infighter: 'scrapper.png',
    soulfist: 'soulfist.png',
    soulmaster: 'soulfist.png',
    glaivier: 'glaivier.png',
    lancemaster: 'glaivier.png',
    striker: 'striker.png',
    breaker: 'breaker.png',
    heavyinfighter: 'breaker.png',
    infightermale: 'breaker.png',
    infighterfemale: 'scrapper.png',

    // Assassins
    assassin: 'assassin.png',
    deathblade: 'deathblade.png',
    blade: 'deathblade.png',
    shadowhunter: 'shadowhunter.png',
    demonic: 'shadowhunter.png',
    reaper: 'reaper.png',
    souleater: 'souleater.png',

    // Gunners
    gunnermale: 'gunner_male.png',
    gunnerfemale: 'gunner_female.png',
    sharpshooter: 'sharpshooter.png',
    hawkeye: 'sharpshooter.png',
    deadeye: 'deadeye.png',
    devilhunter: 'deadeye.png',
    artillerist: 'artillerist.png',
    blaster: 'artillerist.png',
    machinist: 'machinist.png',
    scouter: 'machinist.png',
    gunslinger: 'gunslinger.png',

    // Specialists
    specialist: 'specialist.png',
    artist: 'artist.png',
    yinyangshi: 'artist.png',
    painter: 'artist.png',
    aeromancer: 'aeromancer.png',
    weatherartist: 'aeromancer.png',
    meteorologist: 'aeromancer.png',
    wildsoul: 'wildsoul.png',
    dimensionalist: 'dimensionalist.png',
    dimensionmaster: 'dimensionalist.png',
    guardianknight: 'guardianknight.png'
  };

  const fileName = map[clean] || (role === 'support' ? 'paladin.png' : 'shadowhunter.png');
  return `images/classes/${fileName}`;
}

// Sauvegarde intégrée du Roster personnel de Neevercry (ne peut jamais être perdu)


// Profils prédéfinis : Roster de Démonstration neutre (Archétypes T4 sans pseudos privés)


const DEFAULT_AVATARS = {
  neevercry: 'images/characters/neevercry.webp',
  neversup: 'images/characters/neversup.webp',
  kaarlach: 'images/characters/kaarlach.webp',
  neeverslayer: 'images/characters/neeverslayer.webp',
  jigokuushoujo: 'images/characters/jigokuushoujo.webp',
  neverbreak: 'images/characters/neverbreak.webp'
};

const FACE_AVATARS = {
  neevercry: 'images/characters/neevercry_avatar.webp',
  neversup: 'images/characters/neversup_avatar.webp',
  kaarlach: 'images/characters/kaarlach_avatar.webp',
  neeverslayer: 'images/characters/neeverslayer_avatar.webp',
  jigokuushoujo: 'images/characters/jigokuushoujo_avatar.webp',
  neverbreak: 'images/characters/neverbreak_avatar.webp'
};

function getCharacterFaceAvatar(ch) {
  if (!ch) return 'images/classes/paladin.png';
  const cKey = (ch.id || ch.name || '').toLowerCase().trim();
  const savedCustom = localStorage.getItem('char_custom_avatar_' + cKey);
  if (savedCustom) return savedCustom;

  // Les 6 avatars découpés sont STRICTEMENT réservés au Roster Démo de Nevercry
  const isDemo = Object.prototype.hasOwnProperty.call(FACE_AVATARS, cKey);
  if (isDemo && FACE_AVATARS[cKey]) return FACE_AVATARS[cKey];

  // Pour tout autre utilisateur / personnage importé :
  // 1. Son propre avatar local si fourni
  if (ch.avatarUrl && !ch.avatarUrl.includes('placeholder')) return ch.avatarUrl;
  // 2. Son propre portrait officiel Lost Ark (AGS / Bible)
  if (ch.portraitUrl && !ch.portraitUrl.includes('placeholder')) return ch.portraitUrl;

  // 3. Repli STRICT sur l'icône de sa propre classe (JAMAIS les personnages de Nevercry)
  return getClassIconUrl(ch.className, ch.role);
}

function isFullBodyAgsAvatar(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('_avatar.webp') || url.startsWith('data:image/')) return false;
  return url.includes('character-cdn.ags.lol') || 
         url.includes('onstove.com') || 
         url.includes('lostark.co.kr') || 
         url.endsWith('neevercry.webp') ||
         url.endsWith('kaarlach.webp') ||
         url.endsWith('neeverslayer.webp') ||
         url.endsWith('neversup.webp') ||
         url.endsWith('jigokuushoujo.webp') ||
         url.endsWith('neverbreak.webp');
}

// Fonctions de persistance du Roster personnel (isolé par navigateur)
// CP du profil raid lu (loadout.combatPower) ; les anciens imports gardaient le maximum historique de l'en-tête
function raidCombatPowerOf(c) {
  const raw = (c && c.rawProfile) || {};
  const cp = raw.raidCombatPower || (raw.loadout && raw.loadout.combatPower && raw.loadout.combatPower.score);
  return cp > 0 ? parseFloat(cp.toFixed(2)) : null;
}

// Stockage compact (localStorage : 5 M de caractères par site). Un profil importé reprend plusieurs fois les mêmes
// objets (loadout, battlePoint, objets, cœurs, bijoux), que JSON.stringify écrit en entier à chaque fois : la moitié
// de ses ~72 000 caractères ; le cache du Benchmark range en plus chaque référence sous deux clés. Un objet déjà écrit
// (le même, ou identique et d'au moins 1 000 caractères près de la racine d'une entrée) devient { $ref: chemin } et
// redevient le même objet à la lecture, comme juste après l'import. L'ancien format (JSON brut) reste lu.
const COMPACT_MIN_CHARS = 1000;
function compactStringify(value) {
  const seen = new Map(), same = new Map();
  const walk = (v, path) => {
    if (!v || typeof v !== 'object') return v;
    if (seen.has(v)) return { $ref: seen.get(v) };
    // Égalité de contenu près de la racine seulement (entrée, profil, loadout) : relie les copies des anciens stockages
    if (path.length <= 4) {
      const json = JSON.stringify(v);
      if (json.length >= COMPACT_MIN_CHARS) {
        if (same.has(json)) return { $ref: same.get(json) };
        same.set(json, path);
      }
    }
    seen.set(v, path);
    if (Array.isArray(v)) return v.map((x, i) => walk(x, path.concat(i)));
    const out = {};
    Object.keys(v).forEach(k => { const r = walk(v[k], path.concat(k)); if (r !== undefined) out[k] = r; });
    return out;
  };
  return JSON.stringify({ $compact: 1, data: walk(value, []) });
}
function compactParse(text) {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.$compact !== 1) return parsed;
  const root = parsed.data;
  const at = path => path.reduce((o, k) => o[k], root);
  const isRef = x => x && typeof x === 'object' && Array.isArray(x.$ref) && Object.keys(x).length === 1;
  const walk = v => {
    if (!v || typeof v !== 'object') return;
    Object.keys(v).forEach(k => { if (isRef(v[k])) v[k] = at(v[k].$ref); else walk(v[k]); });
  };
  walk(root);
  return root;
}
// Écriture protégée : en cas de quota plein, le cache des références du Benchmark (retéléchargeable) cède sa place
function storeCompact(key, value) {
  const text = compactStringify(value);
  try {
    localStorage.setItem(key, text);
    return true;
  } catch (e) {
    if (key === 'lostark_live_benchmarks_cache') { console.warn('Cache du Benchmark non enregistré (quota) :', e.message); return false; }
    try {
      localStorage.removeItem('lostark_live_benchmarks_cache');
      localStorage.setItem(key, text);
      console.warn('Quota du navigateur plein : cache des références du Benchmark vidé pour enregistrer', key);
      return true;
    } catch (e2) {
      console.warn('Enregistrement impossible (quota du navigateur) :', key, e2.message);
      if (typeof showToast === 'function') showToast(isEnLang()
        ? 'Browser storage is full: the roster could not be saved.'
        : "Stockage du navigateur plein : le roster n'a pas pu être enregistré.");
      return false;
    }
  }
}

function getUserRoster() {
  try {
    const raw = localStorage.getItem('lostark_user_roster');
    if (raw) {
      const parsed = compactParse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false;
        parsed.forEach(c => {
          const correctRole = detectCharacterRole(c);
          if (c.role !== correctRole) {
            c.role = correctRole;
            modified = true;
          }
          const raidCp = raidCombatPowerOf(c);
          if (raidCp && c.cp !== raidCp) {
            c.cp = raidCp;
            modified = true;
          }
        });
        if (modified) {
          saveUserRoster(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading user roster from localStorage:', e);
  }
  return null;
}

function saveUserRoster(list) {
  storeCompact('lostark_user_roster', list);
}

let activeCharacterId = null;

// Uniquement de vrais personnages importés depuis lostark.bible : aucun roster de démo.
function getActiveRosterList() {
  return getUserRoster() || [];
}

function getCurrentActiveCharacter() {
  const list = getActiveRosterList();
  if (activeCharacterId) {
    const found = list.find(c => (c.id || c.name.toLowerCase()) === activeCharacterId);
    if (found) return found;
  }
  return list[0] || null;
}

// Aucun vrai personnage : on masque le contenu et on ouvre l'import (non fermable)
function showNoCharacterState() {
  document.body.classList.add('no-character');
  renderPresetsBar();
  const modal = document.getElementById('welcomeModal');
  if (modal) modal.classList.add('active');
  const btnClose = document.getElementById('btnCloseWelcomeModal');
  if (btnClose) btnClose.style.display = 'none';
}

function hideNoCharacterState() {
  document.body.classList.remove('no-character');
  const btnClose = document.getElementById('btnCloseWelcomeModal');
  if (btnClose) btnClose.style.display = '';
}
