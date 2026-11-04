#!/usr/bin/env bash
# Surveillance hebdomadaire du flux Maxroll : lancé par cron (crontab de l'utilisateur dev).
# Nouveautés dans le flux → rapport par mail (Postfix local), une seule fois par rapport identique.
# Destinataire : WATCH_MAIL_TO dans .env (ignoré par Git, le dépôt est public). Sans lui : rapport dans le journal seulement.
set -uo pipefail

REPO=/root/ia-projects/lostark-cp-calculator
STATE="$HOME/.local/state/lostark-cp"
mkdir -p "$STATE"

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null
cd "$REPO"
if [ -f .env ]; then set -a; . ./.env; set +a; fi

echo "=== $(date '+%F %T') surveillance du flux Maxroll"
REPORT=$(node tools/watch-maxroll-bracer.mjs 2>&1)
CODE=$?
echo "$REPORT"

if [ "$CODE" -eq 0 ]; then exit 0; fi
SUBJECT="[lostark-cp] Flux Maxroll : nouveautés"
[ "$CODE" -ne 2 ] && SUBJECT="[lostark-cp] Surveillance Maxroll en erreur"

# Même rapport que la semaine passée : pas de nouveau mail (la 1re ligne porte la date du flux, ignorée)
HASH=$(echo "$REPORT" | tail -n +2 | sha256sum | cut -c1-16)
if [ "$(cat "$STATE/maxroll-watch.last" 2>/dev/null)" = "$HASH" ]; then
  echo "Rapport déjà envoyé."
  exit "$CODE"
fi
if [ -n "${WATCH_MAIL_TO:-}" ]; then
  echo "$REPORT" | mail -s "$SUBJECT" "$WATCH_MAIL_TO" && echo "$HASH" > "$STATE/maxroll-watch.last" && echo "Mail envoyé."
else
  echo "WATCH_MAIL_TO absent de .env : pas de mail."
fi
exit "$CODE"
