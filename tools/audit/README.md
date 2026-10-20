# Banc d'audit des calculs

Charge l'appli complète (jsdom, `index.html` et tous les scripts) et fait passer de vrais profils lostark.bible
par le même chemin d'import que le site, sans aucun accès réseau pendant les contrôles.

1. `node tools/audit/fetch-sample.mjs [CE:Nom ...]` : récolte un échantillon (2 personnages par classe DPS,
   2 supports + 1 DPS par classe support, d'après `data/live-peers.json`), **une requête toutes les 6 s**, avec cache
   (`tools/audit/cache/`, ignoré par Git ; un profil déjà en cache n'est jamais retéléchargé). Copier aussi dans
   `cache/loseii/` les tables du GPD de Loseii (`rows*.json`, `arkgrid-rows-*.json`, `astrogem.js`) et dans
   `cache/market.json` la réponse de `/api/market/prices`.
2. `node tools/audit/audit.mjs` : contrôles par personnage (rôle, Battle Point cohérent, lignes du GPD finies et
   positives, chemins de repli, gains d'affinage comparés aux lignes de Loseii, Smart Advisor, feuille de route,
   cartes de la fiche). Résultat détaillé dans `tools/audit/report.json`.
3. `node tools/audit/bench.mjs` : Benchmark, chaque personnage contre un autre de même classe et de même rôle.

4. Comparaison avant / après une modification de calcul :
   - avant : `node tools/audit/audit.mjs --save-baseline` et `node tools/audit/bench.mjs --save-baseline`
     (références `baseline-audit.json` / `baseline-bench.json`, ignorées par Git car liées au cache local) ;
   - après : mêmes commandes avec `--compare`. Résumé par valeur (lignes du GPD en pleine précision : gain, coût,
     ratio, rang, emplacement du bijou ; +CP du Smart Advisor ; feuilles de route, cartes, prédicteur, gemmes, brassard,
     signalements ; Benchmark : lignes par
     système et plan d'achat), plage et médiane des écarts, exemples. Code de sortie 1 si un chiffre a bougé :
     si c'est voulu, réenregistrer la référence.

Ne jamais marteler lostark.bible, Loseii ou Maxroll : appels séquentiels et espacés seulement.
