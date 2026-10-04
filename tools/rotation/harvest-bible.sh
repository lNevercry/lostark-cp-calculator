#!/usr/bin/env bash
# Récolte des logs lostark.bible pour les références de rotation, en sessions courtes : lancé toutes les 2 h par cron
# (crontab de l'utilisateur dev). Chaque session : fetch-bible-ref.mjs (90 logs au plus, 15 s entre deux appels,
# reprise automatique). Garde-fous :
# - verrou : jamais deux sessions à la fois ;
# - refus 429 de lostark.bible : plus aucune session pendant COOLDOWN_H heures ;
# - récolte terminée : références reconstruites en local (build-ref.mjs), mail à WATCH_MAIL_TO (.env), puis plus
#   rien tant que le fichier « done » existe. Rien n'est commité ni déployé : vérification et publication à la main.
# Relancer une récolte complète : supprimer ~/.local/state/lostark-cp/bible-harvest.done
set -uo pipefail

REPO=/root/ia-projects/lostark-cp-calculator
STATE="$HOME/.local/state/lostark-cp"
COOLDOWN_H=6
mkdir -p "$STATE"
DONE="$STATE/bible-harvest.done"
COOL="$STATE/bible-harvest.cooldown"

exec 9>"$STATE/bible-harvest.lock"
flock -n 9 || { echo "$(date '+%F %T') session déjà en cours"; exit 0; }

[ -f "$DONE" ] && exit 0
if [ -f "$COOL" ] && [ $(( $(date +%s) - $(cat "$COOL") )) -lt $(( COOLDOWN_H * 3600 )) ]; then
  echo "$(date '+%F %T') pause après un refus de lostark.bible (jusqu'à $(date -d @$(( $(cat "$COOL") + COOLDOWN_H * 3600 )) '+%F %T'))"
  exit 0
fi

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null
cd "$REPO"
if [ -f .env ]; then set -a; . ./.env; set +a; fi

echo "=== $(date '+%F %T') session de récolte lostark.bible"
OUT=$(node --no-warnings tools/rotation/fetch-bible-ref.mjs --specs auto --median 10 --best 3 --max-logs 90 2>&1)
CODE=$?
echo "$OUT"

if [ "$CODE" -eq 2 ] || echo "$OUT" | grep -q "429 https://lostark.bible"; then
  date +%s > "$COOL"
  echo "Refus de lostark.bible : pause de ${COOLDOWN_H} h."
  exit 0
fi
[ "$CODE" -eq 3 ] && { echo "Plafond de la session atteint : suite à la prochaine session."; exit 0; }
[ "$CODE" -ne 0 ] && { echo "Erreur (code $CODE)."; exit "$CODE"; }

# Tout est récolté : références reconstruites (base locale + logs lostark.bible), puis mail.
REF=$(node --no-warnings tools/rotation/build-ref.mjs 2>&1)
REF_CODE=$?
echo "$REF"
# Reconstruction ratée (ex. base locale non montée) : pas de fichier .done, la session suivante réessaie
[ "$REF_CODE" -ne 0 ] && { echo "Échec de build-ref.mjs (code $REF_CODE) : récolte non marquée terminée."; exit "$REF_CODE"; }
date '+%F %T' > "$DONE"
MSG="Récolte lostark.bible terminée ($(date '+%F %T')).
$(echo "$OUT" | tail -n 1)
$(echo "$REF" | tail -n 1)

Références reconstruites en local (data/rotation-ref.json), non publiées : à vérifier puis déployer."
if [ -n "${WATCH_MAIL_TO:-}" ]; then
  echo "$MSG" | mail -s "[lostark-cp] Récolte lostark.bible terminée" "$WATCH_MAIL_TO" && echo "Mail envoyé."
else
  echo "WATCH_MAIL_TO absent de .env : pas de mail."
fi
