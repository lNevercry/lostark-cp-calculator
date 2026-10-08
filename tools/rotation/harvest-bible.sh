#!/usr/bin/env bash
# Récolte des logs lostark.bible pour les références de rotation : une campagne toutes les CAMPAIGN_DAYS jours, en
# sessions courtes lancées toutes les 2 h par cron (crontab de l'utilisateur dev). Chaque session :
# fetch-bible-ref.mjs --campaign (90 logs au plus, 15 s entre deux appels, reprise automatique). Garde-fous :
# - verrou : jamais deux sessions à la fois ;
# - refus 429 de lostark.bible : plus aucune session pendant COOLDOWN_H heures ;
# - campagne terminée : références reconstruites (build-ref.mjs), contrôlées (check-ref.mjs, contre la version de
#   production), puis commitées (data/rotation-ref.json et data/live-peers.json seulement), poussées sur main et master
#   et publiées (tools/publish-data.sh). Contrôle en échec : rien n'est publié, ancienne version remise.
# - commit impossible (autre branche que main, main local différent d'origin/main) : publication retentée à chaque
#   session tant que le fichier « publish » existe, rien n'est récolté entre-temps.
# - mail à WATCH_MAIL_TO (.env) en fin de campagne, s'il est défini.
# Relancer une campagne tout de suite : supprimer ~/.local/state/lostark-cp/bible-harvest.done
set -uo pipefail

REPO=/root/ia-projects/lostark-cp-calculator
STATE="${HARVEST_STATE:-$HOME/.local/state/lostark-cp}" # HARVEST_STATE : essais
COOLDOWN_H=6
CAMPAIGN_DAYS=14
mkdir -p "$STATE"
DONE="$STATE/bible-harvest.done"
COOL="$STATE/bible-harvest.cooldown"
CAMP="$STATE/bible-harvest.campaign"
PUBLISH="$STATE/bible-harvest.publish"
G=(git -c safe.directory="$REPO")

exec 9>"$STATE/bible-harvest.lock"
flock -n 9 || { echo "$(date '+%F %T') session déjà en cours"; exit 0; }

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null
cd "$REPO"
if [ -f .env ]; then set -a; . ./.env; set +a; fi

notify() {
  if [ -n "${WATCH_MAIL_TO:-}" ]; then
    echo "$2" | mail -s "[lostark-cp] $1" "$WATCH_MAIL_TO" && echo "Mail envoyé."
  else
    echo "WATCH_MAIL_TO absent de .env : pas de mail."
  fi
}

# Commit des données sur main (seulement si main local = origin/main : aucun travail local poussé avec), push sur main
# et master, publication vérifiée en ligne. Code 1 : à retenter à la session suivante.
publish() {
  local branch
  branch=$("${G[@]}" rev-parse --abbrev-ref HEAD)
  [ "$branch" = main ] || { echo "Publication en attente : dépôt sur la branche $branch (main attendu)."; return 1; }
  "${G[@]}" fetch -q origin || { echo "Publication en attente : git fetch impossible."; return 1; }
  [ "$("${G[@]}" rev-parse HEAD)" = "$("${G[@]}" rev-parse origin/main)" ] \
    || { echo "Publication en attente : main local différent d'origin/main (commits non poussés ou en retard)."; return 1; }
  local files=(data/rotation-ref.json)
  "${G[@]}" diff --quiet -- data/live-peers.json || files+=(data/live-peers.json)
  if ! "${G[@]}" diff --quiet -- "${files[@]}"; then
    "${G[@]}" commit -q -m "data: références de rotation, campagne lostark.bible du $(cat "$CAMP") ($(node -e 'const r=require("./data/rotation-ref.json");const k=Object.keys(r.refs);console.log(`${k.length} groupes spé|boss, ${k.filter(x=>x.startsWith("bible|")).length} lostark.bible`)'))" -- "${files[@]}" || { echo "Commit impossible."; return 1; }
    "${G[@]}" push -q origin main && "${G[@]}" push -q origin main:master \
      || { echo "Publication en attente : git push refusé."; return 1; }
    echo "Commit $("${G[@]}" log -1 --format=%h) poussé sur main et master."
  fi
  tools/publish-data.sh data/rotation-ref.json
}

# Publication en attente d'une campagne précédente
if [ -f "$PUBLISH" ]; then
  echo "=== $(date '+%F %T') publication des références (en attente)"
  if publish; then rm -f "$PUBLISH"; date '+%F %T' > "$DONE"; notify "Références de rotation publiées" "Campagne du $(cat "$CAMP") publiée ($(date '+%F %T'))."; fi
  exit 0
fi

# Campagne terminée depuis moins de CAMPAIGN_DAYS jours : rien à faire ; au-delà, nouvelle campagne.
if [ -f "$DONE" ]; then
  [ $(( $(date +%s) - $(date -d "$(cat "$DONE")" +%s) )) -lt $(( CAMPAIGN_DAYS * 86400 )) ] && exit 0
  rm -f "$DONE"
  date +%F > "$CAMP"
  echo "=== $(date '+%F %T') nouvelle campagne $(cat "$CAMP")"
fi
[ -f "$CAMP" ] || date +%F > "$CAMP"

if [ -f "$COOL" ] && [ $(( $(date +%s) - $(cat "$COOL") )) -lt $(( COOLDOWN_H * 3600 )) ]; then
  echo "$(date '+%F %T') pause après un refus de lostark.bible (jusqu'à $(date -d @$(( $(cat "$COOL") + COOLDOWN_H * 3600 )) '+%F %T'))"
  exit 0
fi

echo "=== $(date '+%F %T') session de récolte lostark.bible (campagne $(cat "$CAMP"))"
OUT=$(node --no-warnings tools/rotation/fetch-bible-ref.mjs --specs auto --median 10 --best 3 --max-logs 90 --campaign "$(cat "$CAMP")" 2>&1)
CODE=$?
echo "$OUT"

if [ "$CODE" -eq 2 ] || echo "$OUT" | grep -q "429 https://lostark.bible"; then
  date +%s > "$COOL"
  echo "Refus de lostark.bible : pause de ${COOLDOWN_H} h."
  exit 0
fi
[ "$CODE" -eq 3 ] && { echo "Plafond de la session atteint : suite à la prochaine session."; exit 0; }
[ "$CODE" -ne 0 ] && { echo "Erreur (code $CODE)."; exit "$CODE"; }

# Tout est récolté : références reconstruites (base locale + logs lostark.bible)
REF=$(node --no-warnings tools/rotation/build-ref.mjs 2>&1)
REF_CODE=$?
echo "$REF"
# Reconstruction ratée (ex. base locale non montée) : pas de fichier .done, la session suivante réessaie
[ "$REF_CODE" -ne 0 ] && { echo "Échec de build-ref.mjs (code $REF_CODE) : campagne non marquée terminée."; exit "$REF_CODE"; }

# Contrôles contre la version de production
PROD=$(mktemp)
trap 'rm -f "$PROD"' EXIT
"${G[@]}" fetch -q origin
"${G[@]}" show origin/master:data/rotation-ref.json > "$PROD"
CHECK=$(node tools/rotation/check-ref.mjs data/rotation-ref.json "$PROD" 2>&1)
CHECK_CODE=$?
echo "$CHECK"
SUMMARY="$(echo "$OUT" | tail -n 1)
$(echo "$REF" | tail -n 1)
$CHECK"
if [ "$CHECK_CODE" -ne 0 ]; then
  cp "$PROD" data/rotation-ref.json
  date '+%F %T' > "$DONE"
  echo "Contrôles en échec : rien n'est publié, version de production remise dans data/rotation-ref.json."
  notify "Références de rotation NON publiées" "Campagne du $(cat "$CAMP") terminée ($(date '+%F %T')), contrôles en échec : rien n'est publié.
$SUMMARY"
  exit 1
fi

touch "$PUBLISH"
if publish; then
  rm -f "$PUBLISH"
  date '+%F %T' > "$DONE"
  notify "Références de rotation publiées" "Campagne du $(cat "$CAMP") terminée et publiée ($(date '+%F %T')).
$SUMMARY"
else
  notify "Références de rotation en attente" "Campagne du $(cat "$CAMP") terminée, contrôles OK, publication en attente (nouvel essai toutes les 2 h).
$SUMMARY"
fi
