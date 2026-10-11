# Analyseur de rotation (prototype)

Analyse d'un combat enregistré par [LOA Logs](https://github.com/snoww/loa-logs) (base locale `encounters.db`), façon xivanalysis : utilisations par compétence, temps perdu, alignement sur les buffs du support, placement, et note d'exécution sur 100 par rapport aux joueurs de la même spé.

## Fichiers

| Fichier | Rôle |
|---|---|
| `js/rotation/encounters.js` | Requêtes sur `encounters.db` (liste des raids, chargement d'un combat), communes à Node et au navigateur. |
| `js/rotation/metrics.js` | Calculs, sans dépendance à Node. |
| `js/rotation/coach.js` | Conseils pédagogiques (FR / EN), module pur. |
| `js/rotation/sqlite-worker.js` | Navigateur : worker qui lit le fichier choisi par SQLite en WebAssembly (`js/rotation/vendor`, @sqlite.org/sqlite-wasm 3.53.4, Apache-2.0 / domaine public) et un VFS en lecture seule (FileReaderSync, blocs de 64 Ko en cache), sans copie ni envoi. |
| `js/tab-rotation.js` | Onglet « Analyse de rotation » du site. |
| `db.mjs` | Node : ouverture de la base (`node:sqlite`, gzip), mêmes requêtes. |
| `build-ref.mjs` | Références par spé et par boss → `data/rotation-ref.json`, servi au site (quantiles, aucun nom). Ajoute les références « bible|… » si `tools/samples/bible-records.json` existe. Écrit aussi `data/skill-shares.json` (`skill-shares.mjs`, `--shares-out`) : part des dégâts de chaque compétence par spé DPS, logs locaux et lostark.bible réunis, une voix par joueur (médiane des logs du joueur, puis médiane des joueurs qui lancent la compétence, dès 3), pour les gemmes DPS du GPD. |
| `fetch-bible-ref.mjs` | Logs de lostark.bible (stats publiques de raid : 25 logs autour de la médiane de DPS par spé, boss et difficulté, et les meilleurs) pour les spés DPS sans référence locale sur un boss → `tools/samples/bible-records.json`. Cathédrale niv. 3 / 2, Serca et Kazeros Difficile. 15 s entre deux appels, 60 logs par session (90 par la récolte), arrêt au premier 429, cache `tools/samples/bible-logs/`. |
| `harvest-bible.sh` | Une campagne de récolte toutes les 14 jours, en sessions lancées par cron toutes les 2 h (verrou, pause de 6 h après un 429). Patch : le dernier « … Balance » du site, relevé au début de chaque campagne (`latestPatch` de `bible.mjs`, bundle mémorisé dans `tools/samples/bible-patch.json`) ; nouveau patch trop peu joué : contrôles en échec, références précédentes gardées. Quotas comptés sur la campagne seulement (`--campaign`, en cours dans `bible-records.next.json`, la campagne précédente sert jusqu'à la fin). Campagne terminée : références reconstruites, contrôlées par `check-ref.mjs`, commitées (`data/rotation-ref.json`, `data/live-peers.json`) sur main et master puis publiées par `tools/publish-data.sh` ; main local différent d'origin/main : publication retentée à chaque session. Mail à `WATCH_MAIL_TO` (`.env`). |
| `check-ref.mjs` | Contrôles avant publication : centiles croissants et finis, taux dans [0, 1], 8 logs par groupe au moins, aucune spé perdue et au moins 90 % des groupes de la version publiée. |
| `bible.mjs` | Client lostark.bible (fonctions distantes SvelteKit, devalue, logs `__data.json`). |
| `analyze.mjs` | Rapport en ligne de commande (`--en` : conseils en anglais). |
| `build-skill-meta.mjs` | `data/rotation-skills.json` : recharge de base et placement (`directionalMask`) de chaque compétence, noms des nœuds d'Ark Passive, durée et groupe des buffs de support, boss de raid (`encounters.json`), tirés des tables du jeu de LOA Logs (`Skill.json`, `ArkPassive.json`, `SkillBuff.json`). |

`js/rotation/package.json` (`"type": "module"`) : Node lit ces fichiers comme des modules, et les serveurs les servent en `application/javascript` (nginx ne connaît pas `.mjs`).

`tools/samples/` (ignoré par Git) contient `encounters.db`, un lien vers la copie de l'utilisateur sur le partage `medias` (`/mnt/pve/Proxmox-Data4TO/encounters.db`), et les références.

## Usage

```bash
node --no-warnings tools/rotation/build-ref.mjs [--days 120]        # ~20 s, puis redéployer
node --no-warnings tools/rotation/analyze.mjs --list --player Neeverslayer
node --no-warnings tools/rotation/analyze.mjs 4275 Neeverslayer [--json]
```

## Onglet du site

- **Raids seulement** (liste du site, `--list`, références) : boss de la table `raids` de `data/rotation-skills.json`, tirée de `meter-data/encounters.json` de LOA Logs (raid → porte → boss, 85 boss : Légion, Abysse, Kazeros, Serca, Cathédrale, raids d'assaut). Gardiens (Hanumatan, Krathios…) et donjons du chaos exclus : 525 combats de référence sur 649. Affiché « Serca G1 · Witch of Agony, Serca ».
- Bouton « Choisir encounters.db » (dossier de LOA Logs, à côté de `LOA Logs.exe`, par défaut `%LOCALAPPDATA%\LOA Logs`), puis les 10 derniers raids réussis, ou ceux d'un jour choisi au calendrier (50 au plus).
- Mesuré sur la base de l'utilisateur (1 Go, 4 280 combats, Chromium) : ouverture 0,1 s, liste 0,01 s, analyse d'un combat 0,1 s ; mêmes chiffres que `analyze.mjs`.
- Synchro (Chrome, Edge, Opera : `showOpenFilePicker`) : le bouton ouvre un accès direct au fichier (FileSystemFileHandle), relu par `getFile()` toutes les 10 s tant que l'onglet est affiché et que la date du fichier a changé, ou par « Synchroniser » ; nouveaux raids marqués « nouveau », combat analysé conservé ; LOA Logs en pleine écriture : nouvel essai 2 s après. Accès retenu dans IndexedDB (`lostark_rotation`), lu seulement à l'ouverture de l'onglet ; à la visite suivante, « Reprendre » redemande la permission de lecture. Vérifié dans Chromium : nouveau raid affiché 8 s après l'écriture. Non vérifié ici : la reprise après rechargement (lire un handle depuis IndexedDB fait planter le Chromium de test, même sur une page vide). Firefox / Safari : sélecteur classique, File figé, le choisir à nouveau après un combat.
- Base en mode WAL : lue comme une base classique (en-tête corrigé à la lecture) ; les combats encore dans le `-wal` manquent. Fichier modifié après sa sélection (nouveau combat) : le navigateur refuse de le relire, message « choisis-le à nouveau ».
- CSP de nginx : `'wasm-unsafe-eval'` dans script-src.

## Données d'un combat (LOA Logs 1.51)

- `entity.skills` : par compétence, `skillCastLog` = chaque utilisation (`timestamp`, `last` = dernier coup) et ses coups (dégâts, crit, dos / face, `buffedBy` / `debuffedBy` actifs au moment du coup). Dégâts sur la durée et objets : pas d'utilisations.
- Buffs de support reconnus par leur groupe du jeu (`uniqueGroup`, mêmes règles que LOA Logs) : PA 101204 / 101105 / 314004 / 480030, Marque 210230 (debuff), identité 211400 / 368000 / 310501 / 480018, T 362600…
- `duration` de LOA Logs retire certains passages (Kazeros : 657 s contre 697 s de chronologie) : les calculs utilisent la chronologie complète (`timelineMs`, jusqu'au dernier paquet).
- Morts : `damageStats.deathInfo` (instant absolu, `deadFor`).
- La recharge de base (`Skill.json`) ne sert pas de référence : identité, tripods et Ark Passive la changent (Brutal Impact : 40 s de base, 4,6 s en médiane chez le Prédateur). Les rythmes de référence sont mesurés sur les logs de la spé.

## Calculs

- **Phases sans boss** : moins de la moitié du raid inflige des dégâts pendant plus de 4 s (boss absent, non ciblable, mécanique). Fondé sur les coups, pas sur les compétences lancées : le support continue de buffer et certains lancent dans le vide (G2 de la Cathédrale vers 7:40 : ~13 s sans aucun dégât). Retirées du temps jouable, comme le temps à terre.
- **Pauses partagées** : trou d'au moins 5 s pendant lequel au moins 2 autres DPS (et un tiers d'entre eux) n'infligent presque rien (coups sur moins de 25 % du trou) : mécanique qui désigne certains joueurs (Kazeros : 3 joueurs de groupes différents arrêtés 14 s). Affichées à part, hors temps perdu. Avec 1 seul autre DPS, ou des trous plus courts, la coïncidence est fréquente (corrélation de l'activité 0,58 → 0,50).
- **Temps perdu** : écarts entre deux utilisations au-delà de 1,5 s de battement. **Activité** = 1 − temps perdu ÷ temps jouable.
- **Buffs** : part des dégâts (coups des compétences) sous PA du support et Marque à la fois.
- **Placement** : part des dégâts des compétences à placement portés du bon côté.
- **Refontes de classe** (`CLASS_REWORKS` de `build-ref.mjs`) : logs d'avant le patch écartés. Soulfist au 2026-09-16 (dernière Energy Overflow le 15/09, première Supreme Art, nouvelle spé, le 18/09). Supreme Art n'est pas un alias d'Energy Overflow : compétences différentes.
- Groupes de moins de 8 logs non écrits dans les références (jamais utilisés par la note).
- **Note** (DPS seulement) : chaque critère = rang (0-100) parmi les logs de la même spé sur le même boss (8 au minimum, sinon la spé tous boss), sur les 120 derniers jours. Activité 30, compétences 35 (utilisations par minute des compétences clés, ≥ 3 % des dégâts et jouées par 60 % de la spé, pondérées par leur part), buffs 20, placement 15 (spés dont ≥ 20 % des dégâts sont à placement). Critère absent : poids redistribué.
- **Note des supports** : couverture de leur groupe calculée par LOA Logs (`support_ap` / `_brand` / `_identity` / `_hyper` de la table `entity`, `compute_support_buffs` : part des dégâts des DPS du groupe sous le buff de PA, la Marque, l'identité et la T, pondérée par leurs dégâts, groupes à un seul support), rang parmi la même spé sur le même boss. PA 30, Marque 25, identité 25, T 10, activité 10 : poids proches de la corrélation de chaque critère avec le rDPS donné ÷ dégâts du groupe (803 supports, 29 groupes : identité 0,61, PA 0,50, Marque 0,50, activité 0,34, T 0,25 ; CP 0,53). Note : 0,66, et 0,21 avec le CP. Compétences comparées à la référence à titre indicatif (fréquence des buffs), hors note.
- **Top X %** (site) : `build-ref.mjs` note chaque log de référence sur la référence que le site lui appliquerait et écrit la répartition des notes (`score`) et, pour les supports, de la couverture brute (`support.mean`, moyenne PA / Marque / identité) ; `topPercent` = part des logs au moins aussi bons.
- Validation des DPS (2026-10-01, 649 combats récents) : corrélation de rang médiane avec DPS ÷ CP de 0,68 au sein d'une même spé, boss et difficulté (activité 0,55, compétences 0,50, placement 0,35, buffs 0,29) ; 0,24 avec le CP. Mesuré sur les mêmes logs que les références.

## Conseils (`coach.mjs`)

Chaque conseil : ce qui ne va pas (chiffres du joueur), pourquoi (gain estimé quand il se mesure), comment faire (en mots simples) et les moments du combat. Uniquement des comparaisons mesurées, aucune règle de classe écrite à la main. Les 5 plus importants sont affichés (gain estimé décroissant), le build à part.

- **Compétence clé pas assez lancée** (DPS, gain = part des dégâts × (fréquence médiane ÷ la sienne − 1), au moins 1 %). Cause par le rythme le plus rapide (10 % des écarts, approche la recharge réelle) comparé à celui de la spé :
  - compétence sans recharge (≤ 3 s de base, ex. Asura Destruction, type combo) : ressource à générer plus vite ;
  - rythme plus lent de 15 % : recharge → gemme de recharge des meilleurs (≥ 60 % en ont une) ou Rapidité de l'Évolution (5 niveaux d'écart), sinon tripods / bracelet ;
  - même rythme : prête mais pas relancée → moments où elle est restée prête plus de 3 s (hors phases sans boss, temps à terre, pauses partagées).
- **Activité** (rang < 35) : temps perdu et ses moments.
- **Buffs** (rang < 35) : gros sorts partis sans PA ou Marque, avec la couverture du support du groupe pour faire la part entre son timing et celui du joueur (écart < 2 points : les trous viennent du support).
- **Placement** (rang < 35) : les compétences à placement les moins bien placées.
- **Build** : comparé aux 25 % de la spé qui font le plus de dégâts pour leur CP (supports : couverture de PA), tous boss : stats de l'Évolution (5 niveaux d'écart), gravures et nœuds d'Ark Passive (≥ 70 % des meilleurs, ou < 15 %), gemmes de recharge.
- **Supports** : couverture PA / Marque / identité (rang < 35) avec les moments où le groupe a frappé sans (« tu étais à terre » si c'est le cas) ; buffs de PA relancés alors que le précédent est actif (même groupe, durée des tables du jeu ; au-dessus du 75e centile de la spé, moments à 2 s ou plus gaspillées ; la Marque n'est pas comptée, elle est réappliquée par beaucoup de coups) ; compétences de buff lancées moins souvent (rang < 25).
- **Boucliers des supports** : par bouclier de classe (`applied_shield_buffs`, catégories classskill / arkpassive), total donné et absorbé sur les autres (`shieldsGivenBy` / `damageAbsorbedOnOthersBy`) ; part utile (absorbé ÷ donné) et part des dégâts du groupe évitée (absorbé ÷ (absorbé + dégâts reçus par le groupe)), comparées à la spé sur le même boss, bouclier par bouclier. Un bouclier peu utile n'est pas une faute en soi (God's Decree du Paladin : 2 % chez tous) ni quand le groupe esquive : conseil seulement si la part évitée est faible (rang < 35), en citant les boucliers qui servent moins que chez les autres. 59 supports sur 182 récents. Boucliers de moins de 3 s (God's Decree : 1 s) jamais cités : ils ne se placent pas.
- **Moments des boucliers** (exemples, hors note et hors déclenchement) : le log ne date pas les coups reçus, mais le boss est une entité (`entity_type = 'BOSS'`) dont chaque attaque a ses lancements datés (`castLog`) et ses dégâts totaux sur les joueurs (somme = dégâts reçus). Grosse attaque = utilisation à au moins 3 % des dégâts du boss (total de l'attaque ÷ utilisations, ~9 par combat) ; bouclier en place si un bouclier du support (durée des tables du jeu, ≥ 3 s) est actif dans [lancement, + 3 s]. Mesure approximative : corrélation 0,26 avec la part évitée ; les mises à terre de groupe (`incapacitations`, au moins 2 coéquipiers dans la même seconde) ne font pas mieux (0,22). D'où l'usage en exemples seulement (« ton bouclier s'était terminé 1,1 s avant »).
- Contrôle (150 combats, 748 joueurs, FR et EN) : aucun texte vide ou cassé ; conseils hors build par note : 6,2 (0-24), 3,5 (25-49), 1,2 (50-74), 0,4 (75-100).

## Pas encore fait

- Bracelet et stats de combat (absents du log) : à croiser avec le profil lostark.bible dans l'appli.

- Ouverture et cycle comparés à la référence, fenêtres de burst (gros sorts lancés juste avant le buff).
- Références du top (logs de lostark.bible) : aujourd'hui, les joueurs de la base de l'utilisateur.
- Références plus larges : une seule base (celle de l'utilisateur) ; Recurrence absente, 11 spés sous 10 logs.
- Logs lostark.bible par URL (option 2) : la page embarque castLog, dégâts de dos / face et sous buffs par compétence, boucliers, PV du boss, DPS par seconde, mais pas les coups datés avec leurs buffs (proxy Cloudflare nécessaire, pas de CORS).

## Références lostark.bible (spés absentes de la base locale)

- Ordre de `pickReference` : base locale même boss → lostark.bible même boss → base locale tous boss → lostark.bible tous boss.
- Logs du site sans le détail des coups (buffs actifs, phases sans boss) : note sur les compétences et le placement seulement ; rythmes sur toute la chronologie du combat des deux côtés (`alignToReference`), comme la colonne CPM de lostark.bible.
- Rythmes : logs autour de la médiane de DPS et leurs coéquipiers (jamais les meilleurs : le site n'a rien sous la médiane, la note serait trop sévère). Build : 25 % meilleurs en DPS ÷ CP, sans gemmes (absentes des logs du site).
- Limite de débit mesurée (2026-10-03) : 429 après ~120 logs à 5,5 s d'écart.
- Une même spé mélange les builds de grille d'Ark (ex. Time Wielder 111 / 222) : les logs ne disent pas la grille.

## Guides de classe (`data/rotation-guides.json`)

Objectifs écrits dans un guide cité (ex. Dimensionalist, guide communautaire Nexus, 2026-09), pour le build qu'il décrit (reconnu à la part de dégâts d'une compétence) : rythme d'une compétence (utilisations ÷ durée du combat) et gravures déconseillées (`guideAdvice` de coach.js, affiché même sans référence).

